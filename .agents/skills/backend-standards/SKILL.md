---
name: backend-standards
description: "DiWork's backend standards: layers, API design, errors, lists, data access, transactions, migrations, audit, configuration and backend tests. Use when designing, implementing or reviewing server-side code: APIs, route handlers, server actions, services, database queries, migrations or background jobs."
license: UNLICENSED
metadata:
  owner: DiWork Soluciones
  version: "0.7.0"
  phases: [implement, review, dw-flow]
  layers: [backend, bff]
---

# Backend Standards

How server-side code is written in DiWork projects. Applies on top of base-standards and security-standards, whatever the stack; a stack skill (`prisma-standards`, `efcore-standards`, ...) adds how each rule is done with its tools.

A BFF (the server side of a Next app) follows every section except Data access, Transactions, Migrations and Audit: it does not own data, it calls the backends that do.

## Layers

DiWork backends are Domain-Driven Design, layered:

| DDD layer | What lives there | What it MUST NOT depend on |
|---|---|---|
| Presentation | The endpoint (controller, route handler, server action): authenticates, validates, calls one service, maps the result to the response | Business rules, the ORM client |
| Application | Services, grouped by feature (`features/<feature>/`): orchestrate business logic, call the domain and the data layer | The HTTP framework (`Request`, `HttpContext`, `NextResponse`) |
| Domain | Business rules and invariants, typed errors (`NotFoundError`, `ConflictError`, `BusinessRuleError`), the shape of an entity | The HTTP framework and the ORM's query API — a domain type may be a plain object or class the data layer maps to and from |
| Infrastructure | The data layer: repositories or the ORM calls themselves | Nothing above it; it is called by the application layer, never by the endpoint |

A small CRUD feature may fold Domain into the service (a few validated
fields and no invariant worth its own type); a feature with real business
rules (eligibility, pricing, a state machine) gives them their own
functions or types under the feature, so they are testable without a
database and without an HTTP request.

- MUST keep the endpoint (controller, route handler, server action) thin:
  authenticate, validate, call one service, map the result to the response.
  No business rule and no query lives in it.

  ```ts
  // correct: the route orchestrates, the service decides
  export async function POST(request: Request) {
    const caller = await authenticate(request);
    if (caller instanceof Response) return caller;
    const input = createPatientSchema.safeParse(await request.json());
    if (!input.success) return badRequest(input.error);
    const patient = await patientsService.create(caller, input.data);
    return created(toPatientDto(patient));
  }
  ```

- MUST put business rules in services, grouped by feature
  (`features/<feature>/`), not by technical type across the codebase.
- MUST reach the database only from the data layer (services or
  repositories of the feature). An endpoint MUST NOT import the ORM client.
- MUST create the database client once per process (a shared singleton or
  the container's scoped context), never per request.
- SHOULD put a repository interface in front of the ORM when the feature has
  domain logic worth testing without a database; a CRUD feature may use the
  ORM from its service.
- Dependencies point inward: endpoint → service → data layer. A service MUST
  NOT depend on the HTTP framework (`Request`, `HttpContext`, `NextResponse`).
- MUST wire a service's dependencies (repositories, other services, an
  external client) through dependency injection: a constructor parameter (or
  a factory function that takes them as arguments), resolved by the
  framework's DI container (NestJS, .NET's built-in container) or, where the
  stack has none, a small composition root that builds the object graph once
  at startup. A service or repository MUST NOT construct its own dependency
  with `new` inside its body, nor reach one through a module-level singleton
  it imports directly.
  Why: a test replaces a dependency by passing a different implementation to
  the constructor, not by mocking a module; the composition root is the one
  place that knows every concrete implementation in use.

## API design

- MUST name resources as plural nouns in kebab-case, with the id as a path
  segment: `GET /api/v1/patients/{id}`, `POST /api/v1/patients`. Actions
  that are not CRUD are sub-resources: `POST /api/v1/sessions/{id}/cancel`.
- MUST version every API in its path: `/api/v1/...`. A breaking change
  (removing or renaming a field or endpoint, changing a type or a status, a
  new required input) goes to a new version (`/api/v2/...`), and the
  previous one keeps working until its clients have moved. An additive
  change (a new endpoint, a new optional input, a new response field) stays
  in the current version.
- MUST name JSON fields and query parameters in snake_case (`tenant_id`,
  `created_at`, `sort_by`), in requests, responses and messages, whatever
  the names in the code or the database are. The serializer's naming policy
  does the conversion, configured once per service, not field by field;
  enum values travel as snake_case strings (`in_review`), not numbers.
- MUST describe every DTO exposed by an API (request, response, message) and
  each of its fields: what it means for the consumer, its unit or format,
  and its allowed values when they are a closed set. The description is a
  functional comment (base-standards, Language): it is written in Spanish
  and reaches the OpenAPI contract.
- MUST use the method for its meaning: `GET` reads and never changes state,
  `POST` creates or runs an action, `PATCH` updates the fields sent, `PUT`
  replaces, `DELETE` removes.
- MUST answer with the status that says what happened:

  | Status | When |
  |---|---|
  | `200` | read or update with a body |
  | `201` | created; the body is the new resource |
  | `204` | done, no body |
  | `400` | the input fails its schema |
  | `401` / `403` / `404` | see security-standards, Authorization |
  | `409` | conflicts with the current state (duplicate, stale version) |
  | `422` | valid input that breaks a business rule |
  | `500` | unexpected error; never on purpose |

- MUST wrap every response in the same envelope:

  ```json
  { "success": true, "data": { } }
  { "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Validation failed", "details": [ ] } }
  ```

  `code` is a stable `UPPER_SNAKE_CASE` value the client may branch on;
  `message` is for the developer; `details` lists the failing fields.
- MUST write dates as ISO 8601 in UTC (`2026-09-29T14:00:00Z`) and dates
  without time as `YYYY-MM-DD`.
- MUST update the API contract (OpenAPI file) in the same change as the
  endpoint.
- SHOULD accept an `Idempotency-Key` header on a `POST` that charges, sends
  or creates something outside the system, and return the first result on a
  retry with the same key.

### Lists

A list shown in a table is paginated, searched and sorted on the server.

- MUST take `limit` (default 50, clamped to 1–100) and `offset` (≥ 0).
- MAY take `search` (free text; the service decides which fields) and
  `sort_by` / `sort_order` (`asc` | `desc`, default `desc`). `sort_by` maps
  through a whitelist; an unknown value falls back to the default without an
  error. An encrypted or computed field is never sortable.
- MUST answer `{ "success": true, "data": { "items": [ ], "total": 123 } }`,
  running the page query and the count in parallel.
- A small fixed catalog (countries, types) MAY return every item without
  pagination.

## Errors

- MUST raise typed errors from services (`NotFoundError`, `ConflictError`,
  `BusinessRuleError`) and map them to status and `code` in one place: the
  framework's error middleware, filter or a shared helper. An endpoint MUST
  NOT build error responses by hand for each case.
- MUST answer an unexpected error with `500`, a generic message and a
  correlation id, and log the full error with that id. MUST NOT return a
  stack trace, a SQL message or an internal path.
- MUST NOT swallow an error: every `catch` rethrows, maps or logs it, and
  says why when it continues.

## Validation

Input validation at the boundary is in security-standards, Input handling.
On top of it:

- MUST validate the shape (types, required, formats, ranges) in the schema at
  the boundary, and the business rules (uniqueness, state transitions,
  limits of the plan) in the service, which answers `409` or `422`.
- MUST share one schema per operation between the endpoint and its tests; a
  BFF and its client MAY share it too.

## Data access

Backend only.

- MUST select the fields the operation needs; never load a whole entity to
  return two fields.
- MUST NOT query inside a loop (N+1): load relations with the query or batch
  them by id.
- MUST run independent queries in parallel (`Promise.all`, `Task.WhenAll`).
- MUST filter soft-deleted rows (`is_deleted`, `deleted_at`) in every read,
  through a shared filter or a global query filter, not by memory.
- MUST add an index, in the same change, for every column a new list filters
  or sorts by.
- MUST read a table with temporal validity (`effective_date`,
  `expiry_date`) through one shared condition, so exactly one row is valid
  at a given date:

  ```sql
  effective_date <= :as_of AND (expiry_date IS NULL OR expiry_date > :as_of)
  ```

  A new version closes the current one (its `expiry_date` becomes the new
  `effective_date`) and inserts the new one, in one transaction.
- MUST include, in the same change, every new table, file or external
  resource that belongs to a tenant in the routine that deletes a tenant, in
  foreign-key order (children first).
  Why: a table left out breaks the deletion in production.

## Transactions

Backend only.

- MUST write in one transaction every set of changes that must succeed or
  fail together.
- MUST NOT call anything outside the database inside a transaction: HTTP,
  email, payment provider, file storage, queue. Call it after the commit, or
  record it in an outbox table in the same transaction and send it from
  there.
  Why: the external call cannot be rolled back, and it holds locks while it
  waits.
- MUST keep a transaction short: no user input, no long computation inside.
- SHOULD use optimistic concurrency (a version or `updated_at` column,
  checked on update, `409` on mismatch) where two users may edit the same
  row.

## Migrations

Backend only. Code deployed into the database (PL/SQL, T-SQL) is in
database-standards.

- MUST change the schema only through a migration generated by the ORM's
  tool (`prisma migrate dev --name`, `dotnet ef migrations add`), committed
  with the code that needs it, with a name that says what it does
  (`add_patient_birth_date`).
- MUST NOT edit or delete a migration already applied to a shared
  environment; a fix is a new migration.
- MUST apply migrations to shared environments from the pipeline
  (`prisma migrate deploy`, an EF migration bundle), never from a developer
  machine, never with `db push` or `EnsureCreated`.
- MUST read the generated SQL before merging, and mark in the pull request
  every destructive step: dropping a table or column, narrowing a type,
  adding `NOT NULL` without a default.
- SHOULD change a schema in use in two steps (expand, then contract): add
  the new column nullable or with a default, backfill, switch the code, and
  drop the old one in a later release. A rename is add + copy + drop.
- MUST write a data backfill as an idempotent script, separate from the
  schema migration, that can run twice with the same result.
- SHOULD document every new table and column where the project keeps its
  data dictionary (database comments or the data model document), in the
  same change.

## Audit

Backend only.

- MUST write an audit record for every create, update, delete and state
  change of an entity the project declares auditable: who (user and acting
  role), what (event type), which entity and id, which tenant, when.
- MUST NOT fail the operation when the audit write fails: catch it, log it
  with the correlation id, and go on. It runs after the operation's
  transaction commits, or inside it when the project requires the audit to
  be atomic.
- MUST NOT put sensitive content in the audit record: ids and the names of
  the changed fields, not their values.

## Configuration

Secrets are in security-standards, Secrets. On top of it:

- MUST read configuration in one typed module that validates it at startup
  and exposes it to the rest of the code. MUST NOT read environment
  variables (`process.env`, `Environment.GetEnvironmentVariable`) anywhere
  else.
- MUST NOT hard-code a URL, a limit, a timeout or a feature switch that can
  differ between environments.
- MUST add every new variable to `.env.example` (or `appsettings.json` with a
  fake value) in the same change, with a comment saying what it is.

## Security evaluation (mandatory per endpoint)

Not conditional on the endpoint looking sensitive: this walk happens every
time, and decides whether the heavier gate below applies.

- MUST walk security-standards' review checklist for **every** endpoint
  added or modified, in the same change — before it is considered done, not
  as a follow-up task. This is broader than security-standards' own
  "Security review" gate: that one triggers a second reviewer only for the
  categories it lists (auth, authorization, personal data, secrets, a
  public or machine-to-machine endpoint, uploads, tenant isolation); this
  one applies to every endpoint, so the categories that do not apply get
  recorded as such instead of skipped silently.
- MUST record the answer in the pull request description, in Spanish, as a
  line per security-standards checklist item that applies, or "no aplica"
  for the ones that do not, so the self-evaluation is visible to the
  reviewer instead of assumed.
- MUST escalate to security-standards' "Security review" gate (a second
  reviewer, the `security` label) the moment any answer above is not
  "no aplica": the mandatory walk is what decides the escalation, not a
  guess made before reading the endpoint's own code.

## Testing

On top of base-standards, Testing, and security-standards, Security tests:

- MUST test every endpoint: the success path, input that fails validation,
  and the security cases.
- MUST unit-test business rules in the service, mocking the data layer at
  the module boundary, not the ORM's internals.
- SHOULD test queries with non-trivial filters, temporal validity or
  migrations against a real database of the same engine (a container), not
  a mock or an in-memory substitute.
- MUST name a test after the behavior and follow arrange, act, assert.

## Review checklist

- Is the endpoint thin: authenticate, validate, one service call, map?
- Does the endpoint avoid the ORM, and the service avoid the HTTP framework?
- Are a service's dependencies injected (constructor or factory), not
  constructed with `new` inside it or reached through a module singleton?
- Do the URL, method, status and envelope follow API design? Is the OpenAPI
  contract updated?
- Are JSON fields, query parameters and enum values in snake_case, through
  the serializer policy? Does every exposed DTO and field have a Spanish
  description that reaches the OpenAPI contract?
- Does a list paginate, clamp `limit`, and whitelist `sort_by`?
- Are errors typed and mapped in one place, with no internals in a `500`?
- Are queries free of N+1, selecting only needed fields, filtering
  soft-deleted rows, with indexes for new filters?
- Does a transaction hold only database work?
- Is the migration generated, named, reviewed for destructive steps, and
  safe to apply while the previous version runs?
- Is a new tenant-owned table in the tenant deletion routine?
- Is the audit record written, without sensitive values, and unable to fail
  the operation?
- Is new configuration read through the config module and in `.env.example`?
- Was security-standards' checklist walked for every endpoint touched, with
  the answers recorded in the pull request, and escalated to a second
  reviewer when any of them was not "no aplica"?
