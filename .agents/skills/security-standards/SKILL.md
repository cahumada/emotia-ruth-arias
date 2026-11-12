---
name: security-standards
description: "DiWork's security standards: authentication, authorization, multi-tenant isolation, secrets, personal data, input handling, external callers, security tests, dependencies and security review. Use when designing, implementing or reviewing anything touching authentication, permissions, tenants, secrets, personal or customer data, external input, redirects, webhooks or third-party dependencies."
license: UNLICENSED
metadata:
  owner: DiWork Soluciones
  version: "0.7.0"
  phases: [implement, review, dw-flow]
---

# Security Standards

The security rules every DiWork change follows. A rule here wins over any other standard it conflicts with.

Threat model: every request may come from an authenticated user of another
tenant, or from a user of the same tenant with fewer permissions, trying to
read or change data they do not own. Every id in a URL, query, body, header
or cookie is controlled by the caller.

## Authentication

- MUST authenticate every endpoint and server action through the project's
  single authentication entry point (a middleware, filter or helper that
  checks the session, the origin and the tenant). A route MUST NOT check the
  session by hand.
  Why: each hand-written check drifts; one entry point is fixed once.
- An endpoint MAY skip that entry point only when it is public by design, an
  external callback (OAuth redirect) or a machine-to-machine caller (see
  External callers). The reason MUST be in a comment on the route.
- MUST reject a state-changing request from another origin (CSRF): same-origin
  check or anti-forgery token, applied by the entry point.
- MUST keep session tokens in `HttpOnly`, `Secure`, `SameSite` cookies.
  MUST NOT store them in `localStorage`, `sessionStorage` or a URL.
- MUST NOT implement password hashing, token signing or session storage by
  hand; use the framework's or a maintained library.

Checked: review question "which entry point authenticates this route, and if
none, why?"

## Authorization

- MUST authorize on the server, on every request. Hiding a button, a route
  or a field in the UI is not authorization.
- MUST deny by default: an operation with no explicit permission is refused.
- MUST check two levels when both exist: the role (may this kind of user do
  this at all?) and the action permission of the catalog (may this user do
  this operation?).
- MUST check ownership of the specific resource, not only its tenant: who may
  read or change *this* row. Each resource type has one access helper
  (`require<Resource>Access`), unit-tested, in its feature folder; a route
  MUST NOT inline its own check.
- MUST answer `404` both when a resource does not exist and when it exists
  but the caller may not see it. `403` is for an operation the caller may
  not perform on a resource they can see.
  Why: `403` on lookup confirms the resource exists.
- MUST NOT let a tenant-scoped flow grant a platform-wide role (system
  administrator), whatever the payload says.

### Multi-tenant isolation

- MUST scope every query on tenant data by the tenant of the request.
- MUST verify that the caller is an active member of the tenant it acts on,
  when the tenant comes from anything the client sends (cookie, header, URL).
  Where a route cannot use the entry point, it calls the membership check
  itself and returns `403` on failure.
- MUST resolve every foreign key the client sends (`client_id`,
  `patient_id`, `role_id`, ...) with a tenant-scoped query before storing it,
  and return `404` when it does not resolve.

  ```ts
  // incorrect: stores whatever id the client sent
  await db.session.create({ data: { professionalId: input.professionalId, tenantId } });

  // correct: the id must exist in the caller's tenant
  const professional = await db.professional.findFirst({
    where: { id: input.professionalId, tenantId, isDeleted: false },
    select: { id: true },
  });
  if (!professional) return notFound("Professional not found");
  ```

Checked: review question "can a user of another tenant, or of this tenant
with another role, reach this data?"; the security tests below.

## Secrets

- MUST NOT commit a secret: keys, tokens, passwords, connection strings,
  certificates. `.env` files are ignored; a committed `.env.example` lists
  every variable with a fake value.
- MUST read secrets from the environment or the platform's secret store, and
  validate the required ones at startup (or at first use, for optional
  integrations), failing with the variable's name, never its value.
- MUST fail closed when a secret that guards an endpoint is missing: the
  endpoint refuses every request, it does not become open.
- MUST NOT send a secret to the browser. In frameworks that expose variables
  by prefix (`NEXT_PUBLIC_`, `VITE_`), only non-secret values carry it.
- MUST NOT write a secret to a log, an error message, a response, a test
  fixture or an artifact.
- MUST keep encryption keys out of the database whose data they protect, and
  back up and restore both together.
- A secret that reached the repository, a log or a chat is compromised: it
  MUST be revoked and rotated, not only deleted.

Checked: secret scanning in CI; review question.

## Personal data

- MUST return DTOs with the fields the caller needs, never the raw entity.
  MUST NOT return password or credential hashes, access or refresh tokens,
  invitation tokens outside their flow, raw provider payloads, or other
  users' personal data.
- MUST NOT log personal data or sensitive content (health, financial,
  identity documents, message bodies, prompts, audio, images). Log ids.
- MUST encrypt at rest the fields a project classifies as sensitive, with the
  key owner documented next to the field; a form that edits an encrypted
  field says so to the user.
- MUST NOT store an uploaded document or image in public storage; it is
  private and served through an authorized endpoint. The response never
  exposes the storage URL or path.
- MUST NOT write real data about real people into code, tests, fixtures,
  examples, documentation or agent memory. Invent it: clearly fictional
  names, identifiers with a valid format that do not exist.
- MUST delete, in the same operation, everything that belongs to a deleted
  tenant or user: rows, files, keys, external resources.

- MUST classify, per project, which fields are personal and which are
  sensitive (health, financial, identity documents, insurance claims), and
  how long each kind is kept, in the project's data model document.
- MUST have a way to delete or anonymize personal data when its retention
  ends or its owner asks for it, covering backups and files, and document
  it with the retention.

## Input handling

- MUST validate every request body, query and header against a schema at the
  boundary (Zod, FluentValidation, data annotations) and return `400` when it
  fails.
- MUST whitelist the fields a create or update accepts. MUST NOT pass a raw
  body to the ORM (mass assignment); fields like `tenantId`, `createdBy`,
  `isDeleted` or a status transition are never taken from the request.
- MUST clamp pagination (`limit`, `offset`) and map sort fields through a
  whitelist; a client value never reaches `ORDER BY` or a column name.
- MUST build SQL with parameters. MUST NOT concatenate input into SQL, and
  raw queries use the ORM's parameterized form (`$queryRaw` tagged template,
  `FromSqlInterpolated`), never the unsafe one.
- MUST sanitize user-authored HTML before serving it to others, with a
  maintained sanitizer; MUST NOT render it with `dangerouslySetInnerHTML` or
  `innerHTML` unsanitized.
- MUST reduce a redirect target taken from input to a same-origin relative
  path: it starts with a single `/`, it is not `//...` or `/\...`, and it
  falls back to a safe default.

  ```ts
  // incorrect
  return redirect(searchParams.get("next"));
  // correct
  return redirect(toSafeRelativePath(searchParams.get("next"), "/"));
  ```

- MUST check an uploaded file's type by its content, limit its size, and
  store it under a generated name, never the client's.
- MUST NOT deserialize untrusted input into arbitrary types (polymorphic
  JSON, `BinaryFormatter`, `eval`).
- MUST treat input sent to an LLM as untrusted: prompts are versioned files,
  user input goes in delimited placeholders, and the model's output is
  validated like any other input before it is used.

## External callers

- **Scheduled jobs (cron)** MUST authenticate with a secret
  (`Authorization: Bearer <secret>`) and fail closed when it is not set.
- **Webhooks** MUST verify the provider's signature over the raw body before
  reading the payload, and MUST treat ids in the payload as untrusted:
  re-fetch the resource from the provider's API.
- **OAuth callbacks** MUST bind `state` to the user and tenant that started
  the flow, verify it and delete it on callback, and verify tenant
  membership before storing the connection.
- **Calls to other services** SHOULD sign the request (HMAC over the raw
  body) and send an idempotency key when the operation is not idempotent.

## Security tests

Every new or changed endpoint MUST have tests for at least:

1. no session → `401`;
2. wrong role or missing action permission → `403`;
3. resource of another tenant, or not owned → `404` (or `403`), and the
   operation was **not** executed;
4. malicious payload: a foreign key from another tenant, a field outside the
   whitelist, an absolute redirect URL → rejected.

Checked: review question "which test proves each of the four?"

## Dependencies

How dependencies are added and updated is in base-standards, Dependencies.
On top of it:

- MUST enable Dependabot alerts and security updates, and GitHub secret
  scanning with push protection, on every repository.
- MUST NOT merge a change that adds or keeps a known vulnerability of
  severity critical or high in a dependency it uses, when a fixed version
  exists.
- When no fix exists, the vulnerability MAY be accepted only with a
  justification in the pull request: why the vulnerable code is not
  reachable, or the mitigation in place, and when it will be reviewed
  again. The alert is dismissed with that reason, never silently.
- SHOULD fix a medium or low vulnerability in the next update of that
  dependency.

Checked: Dependabot alerts on the repository; a CI step that fails on a
critical or high vulnerability (`pnpm audit --audit-level high`,
`dotnet list package --vulnerable`).

## Security review

- MUST have a security review, by a second person other than the author,
  for a change that touches any of: authentication or sessions,
  authorization or permissions, personal or sensitive data, secrets or
  cryptography, a public or machine-to-machine endpoint (webhook, cron,
  OAuth callback), file uploads, or the tenant isolation.
- That second person does not have to be on the project's team: any other
  DiWork engineer, a technical lead, or an external reviewer engaged for
  this purpose satisfies it, as long as they did not author the change and
  they go through the diff themselves.
- MUST label such a pull request `security` and have the reviewer go
  through this standard's review checklist; the approval of the labeled
  pull request records the review.
- The author MUST say in the pull request which of the areas above the
  change touches, so the label is not left to chance.
- When no such person is reachable at all — a solo engagement with no
  other technical contact — the author MAY merge on a self-review instead
  of an independent one, but only as a documented deviation, never
  presented as if a second person reviewed it. The pull request MUST say
  explicitly that no reviewer was available and why, and MUST record: the
  review checklist below walked through point by point, in writing; a
  clean dependency scan (Dependencies above); and a second read of the
  diff after stepping away from it (a night, at least), noting anything it
  changed. This path MUST NOT be used when a second person as defined
  above is in fact reachable, even at the cost of delay.
  Why: an approval that hides that no independent person reviewed it is
  worse than an honest gap — it would let a real risk pass as checked.

## Review checklist

- Does every route go through the authentication entry point, or say why not?
- Is authorization checked on the server, deny by default, role and action?
- Is ownership of the specific resource checked, not only its tenant?
- Is every client-sent foreign key resolved within the caller's tenant?
- Is the body validated, with whitelisted fields and no raw body to the ORM?
- Are redirects, uploads, raw SQL and user HTML handled as above?
- Does the response hold only the fields the caller needs?
- Could a secret or personal data reach a log, a response, the browser or
  the repository?
- Do cron, webhook and OAuth endpoints verify their secret, signature or state?
- Are the four security tests there?
- Does the change add or keep a critical or high vulnerability, or accept
  one without a recorded justification?
- Does the change touch an area that needs a security review, and is the
  pull request labeled `security`, with either a second reviewer's
  approval or a fully documented self-review deviation?
