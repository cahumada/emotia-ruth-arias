---
name: backend-dotnet-standards
description: "DiWork's .NET API standards: solution layout by DDD layer, Minimal API endpoints, dependency injection, type and input validation, entity-DTO mapping, snake_case and documented contracts, Swagger, .NET versions and upgrades, architecture questions (microservice or project API, distributed transactions, persistence) and external integrations. Use when designing, implementing or reviewing a .NET backend service, its endpoints, its worker or its integrations."
license: UNLICENSED
metadata:
  owner: DiWork Soluciones
  version: "0.7.0"
  phases: [implement, review, dw-flow]
  layers: [backend]
  stacks: [dotnet]
  extends: backend-standards
---

# .NET API Standards

How a .NET backend is built in DiWork projects. Adds to backend-standards the
way each of its rules is done in .NET. The persistence, messaging and cache
details are in their own standards, loaded when the component declares the
stack: `efcore-standards` or `dapper-standards`, `servicebus-standards`,
`cache-standards`.

## Before designing

A new API, or a change to how an existing one is deployed or persisted,
starts with questions to the user. The answers go into the implementation
plan, in Spanish, and into the component's `stacks` in
`.dw-told-ai/project.json`.

- MUST ask whether the API is **one service of a set of microservices** or
  **the API of one project** (a single backend serving its own frontends),
  unless the plan or the project already says so. The answer decides data
  ownership, messaging and how transactions span services.
- When it is a microservice, MUST ask whether an operation needs to change
  data owned by **another service** in the same business transaction
  (a distributed transaction). When it does, MUST clear every point below
  with the user before designing it, and record the answers:
  - which services take part, and which one owns each piece of data;
  - whether the business accepts eventual consistency, and for how long a
    partial state may be visible;
  - the compensation of every step (what undoes it) and which steps cannot
    be undone (an email sent, a payment captured), so they go last;
  - who coordinates: one orchestrator service holding the saga state, or
    choreography through events; with three or more steps or with
    compensations, an orchestrator;
  - the timeout of each step and what happens when it expires;
  - how each step stays idempotent under redelivery, and whether order
    matters;
  - how a stuck or failed transaction becomes visible (status, alert) and
    who fixes it.

  MUST NOT use a two-phase commit across services or databases
  (`TransactionScope` spanning connections, MSDTC). A distributed
  transaction is a saga: each step commits locally and publishes its event
  through an outbox (backend-standards, Transactions; servicebus-standards).
- MUST ask which persistence the component uses, unless the project already
  declares it: **Entity Framework Core with migrations** or **Dapper with
  queries and stored procedures**; and the engine: **SQL Server**,
  **Oracle** or **PostgreSQL**. One persistence per component; a second one
  in the same component needs the user's approval and a reason in the plan.
- MUST ask whether the component needs messaging (Azure Service Bus) or a
  cache or state store (Redis, Cosmos DB), when the feature suggests it and
  the project does not say so.
- MUST NOT guess an answer the user can give: an assumption made to go on is
  written in the plan as an assumption, and asked at the next checkpoint.

## Versions and upgrades

- MUST target a .NET release in support, and SHOULD target the newest LTS
  for a new service. Check the current releases and their end of support on
  the official .NET support policy page at the time, not from memory.
- MUST write code with the current APIs of the target version and of each
  package: follow the official documentation of that version, and do not
  add an API the documentation marks obsolete.
- MUST NOT upgrade the target framework, the SDK in `global.json` or a
  package across a major version on the agent's initiative. MUST first tell
  the user, in Spanish, the risk of the upgrade:

  ```markdown
  ## Evaluación de upgrade: <paquete o runtime> <actual> → <propuesta>

  - Motivo: <fin de soporte, vulnerabilidad, funcionalidad necesaria>
  - Cambios que rompen: <de las release notes oficiales, uno por línea>
  - Impacto en el código: <archivos o áreas afectadas>
  - Dependencias arrastradas: <otros paquetes que deben subir con este>
  - Cobertura de pruebas sobre lo afectado: <alta | parcial | baja>
  - Riesgo: <bajo | medio | alto>, porque <razón>
  - Reversión: <cómo volver atrás>
  ```

  and wait for the user's decision. A patch or minor update of a package
  through Dependabot follows base-standards, Dependencies; a security fix
  follows security-standards, Dependencies.
- MUST pin the SDK in `global.json` (`rollForward: latestFeature`) and
  manage package versions centrally in `Directory.Packages.props`.

## Solution layout

One solution per service, one project per DDD layer (backend-standards,
Layers). Project references enforce the direction of dependencies.

```
<Service>.sln
global.json
Directory.Build.props        Nullable, warnings as errors, analyzers, XML docs
Directory.Packages.props     every package version, once
src/
  <Service>.Api/             Presentation: Minimal API endpoints, Program.cs
  <Service>.Application/     services, DTOs, validators, mappers, ports
  <Service>.Domain/          entities, value objects, domain errors and events
  <Service>.Infrastructure/  persistence, messaging, cache, external clients
  <Service>.Worker/          message consumers (servicebus-standards)
tests/
  <Service>.UnitTests/
  <Service>.IntegrationTests/
```

- MUST keep `Domain` free of references to other projects and of
  infrastructure packages (EF Core, Dapper, Azure SDKs, ASP.NET Core).
  `Application` references `Domain` only; `Infrastructure` references
  `Application` and `Domain`; `Api` and `Worker` reference all of them, only
  to wire them in their composition root.
- MUST organize `Application` and `Api` by feature (`Features/Patients/`),
  not by technical type (`Services/`, `Dtos/`).
- MUST model the domain in `Domain`: an entity guards its invariants in its
  constructor and methods (private setters, no public `set` on a field with
  a rule); a value object is an immutable `record` validated on creation; a
  broken rule throws a domain error (`BusinessRuleException`), never returns
  `false` to be checked by the caller.

  ```csharp
  // incorrect: anyone can break the rule
  public class Policy { public DateOnly ExpiresOn { get; set; } }

  // correct
  public sealed class Policy
  {
      public DateOnly ExpiresOn { get; private set; }

      public void Renew(DateOnly today, int termMonths)
      {
          // Regla de negocio: solo se renueva dentro de los 30 días previos al vencimiento.
          if (ExpiresOn > today.AddDays(30))
              throw new BusinessRuleException("POLICY_RENEWAL_TOO_EARLY", $"Policy {Id} expires on {ExpiresOn}");
          ExpiresOn = ExpiresOn.AddMonths(termMonths);
      }
  }
  ```

- MUST define in `Application` the interfaces (ports) of what it needs from
  outside: repositories, message publisher, cache, external services. Their
  implementations live in `Infrastructure`.
- SHOULD check the dependency direction with an architecture test
  (NetArchTest or ArchUnitNET) in `UnitTests`.
- MUST enable in `Directory.Build.props`: `<Nullable>enable</Nullable>`,
  `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`,
  `<AnalysisLevel>latest-recommended</AnalysisLevel>`, and
  `<GenerateDocumentationFile>true</GenerateDocumentationFile>`.

## Minimal API

- MUST expose endpoints with Minimal APIs, not MVC controllers, in a new
  service. An existing service with controllers keeps them; a new feature in
  it follows what the service already uses.
- MUST map each feature's endpoints in its own static class, as an extension
  method `Map<Feature>Endpoints`, under a route group carrying the version,
  the tag and the authorization policy:

  ```csharp
  public static class PatientEndpoints
  {
      public static IEndpointRouteBuilder MapPatientEndpoints(this IEndpointRouteBuilder app)
      {
          var group = app.MapGroup("/api/v1/patients")
              .WithTags("Patients")
              .RequireAuthorization();

          group.MapGet("/{id:guid}", GetById).WithName("GetPatientById");
          group.MapPost("/", Create).WithName("CreatePatient");
          return app;
      }

      private static async Task<Results<Ok<ApiResponse<PatientDto>>, NotFound<ApiResponse>>> GetById(
          Guid id, IPatientService patients, CancellationToken cancellationToken) { ... }
  }
  ```

  `Program.cs` only registers services and calls `Map<Feature>Endpoints`; it
  holds no handler.
- MUST keep a handler thin (backend-standards, Layers): it binds, lets
  validation run, calls one application service, and maps the result. It
  MUST return `TypedResults` with a `Results<...>` union, so every status it
  can answer is in its signature and in the OpenAPI contract.
- MUST bind a list's query parameters into a record with `[AsParameters]`,
  naming each one in snake_case with `[FromQuery(Name = "sort_by")]`.
- MUST take a `CancellationToken` in every handler and pass it down to every
  asynchronous call.
- MUST map domain and application errors to status, `code` and the
  backend-standards envelope in one `IExceptionHandler` registered with
  `AddExceptionHandler` and `UseExceptionHandler`; a handler MUST NOT catch
  them to build the response itself.
- MUST NOT use `async void`, `.Result` or `.Wait()`.

## Contracts: snake_case and documentation

- MUST configure snake_case once, for the HTTP pipeline and for every other
  place that serializes (messages, cache):

  ```csharp
  builder.Services.ConfigureHttpJsonOptions(options =>
  {
      options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower;
      options.SerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.SnakeCaseLower));
  });
  ```

  A `[JsonPropertyName]` on a single property is allowed only to match an
  external contract the service does not own, with a comment saying which.
- MUST write DTOs as `sealed record`s in `Application/Features/<Feature>/`,
  named after their use (`CreatePatientRequest`, `PatientDto`,
  `PatientCreatedMessage`). An endpoint MUST NOT receive or return a domain
  entity or a persistence model.
- MUST document every DTO and each property with an XML `<summary>`, in
  Spanish (backend-standards, API design): what it means, its format or
  unit, its allowed values. These comments reach the OpenAPI document.

  ```csharp
  /// <summary>Paciente registrado en el tenant.</summary>
  public sealed record PatientDto
  {
      /// <summary>Identificador único del paciente.</summary>
      public required Guid Id { get; init; }

      /// <summary>Fecha de nacimiento, formato YYYY-MM-DD.</summary>
      public required DateOnly BirthDate { get; init; }

      /// <summary>Estado del paciente: active, inactive o archived.</summary>
      public required PatientStatus Status { get; init; }
  }
  ```

  Serialized as `id`, `birth_date`, `status`. Properties with `<summary>`
  are used rather than positional parameters, so each description reaches
  the OpenAPI schema whatever the generator.

- MUST NOT suppress the missing-XML-comment warning (`CS1591`) in a project
  that holds DTOs.

## Swagger

- MUST generate the OpenAPI document with the platform's support
  (`Microsoft.AspNetCore.OpenApi`: `AddOpenApi` and `MapOpenApi`) and show
  it with Swagger UI (`Swashbuckle.AspNetCore.SwaggerUI` pointing at
  `/openapi/v1.json`), so the operations can be seen and tried. On a target
  without built-in OpenAPI support, Swashbuckle generates the document.
- MUST give every endpoint a name, a summary and its tag, and every DTO its
  XML documentation, so Swagger shows what each operation does without
  reading the code.
- MUST enable Swagger UI in development and test environments. In
  production it is off, or behind the same authentication as the API when
  the project decides to expose it; the decision is written in the README.
- MUST describe the authentication scheme in the document, so a request can
  be tried from Swagger UI with a token.
- SHOULD keep the generated document in the repository (built at compile
  time with `Microsoft.Extensions.ApiDescription.Server`) so a change to the
  contract shows in the pull request diff (backend-standards, API design).

## Dependency injection

- MUST use the built-in container (`Microsoft.Extensions.DependencyInjection`).
  A third-party container needs the user's approval.
- MUST register each layer through its own extension method, called from
  the composition root: `AddApplication()`, `AddInfrastructure(configuration)`.
  `Program.cs` does not register a layer's classes one by one.
- MUST choose each lifetime on purpose:

  | Lifetime | For |
  |---|---|
  | Singleton | Stateless and thread-safe clients that are expensive to create: `ServiceBusClient`, `CosmosClient`, `IConnectionMultiplexer`, `HybridCache` |
  | Scoped | Anything holding per-request state: the `DbContext`, a connection factory, repositories, application services, the current user and tenant |
  | Transient | Lightweight stateless helpers |

- MUST NOT inject a scoped service into a singleton (a captive dependency).
  A singleton that needs one creates a scope with `IServiceScopeFactory`.
  MUST enable `ValidateScopes` and `ValidateOnBuild` in every environment.
- MUST NOT resolve services from `IServiceProvider` inside application code
  (service locator); only the composition root and scope factories do.
- MUST bind configuration to typed options with the options pattern,
  validated at startup:
  `AddOptions<T>().BindConfiguration("Section").ValidateDataAnnotations().ValidateOnStart()`
  (backend-standards, Configuration).

## Type and input validation

- MUST keep nullable reference types enabled, with no `!` (null-forgiving)
  without a comment saying why it cannot be null.
- MUST type identifiers and values with a rule as such, not as bare
  primitives, when mixing them up is a real risk: `PatientId` instead of
  `Guid`, `Money` instead of `decimal`, `DateOnly` for a date without time.
- MUST NOT use `dynamic` or `object` for data that has a known shape.
- MUST validate every request DTO at the boundary before the handler runs,
  with one approach per service: the platform's Minimal API validation
  (`AddValidation()` with data annotations) for shape rules, or
  FluentValidation when rules need cross-field logic or injected
  dependencies. A validation failure answers `400` with the envelope and the
  failing fields in snake_case in `details`.
- MUST keep business rules out of validators: uniqueness, state transitions
  and plan limits are checked by the service or the domain (backend-standards,
  Validation).

## Mapping entities and DTOs

- MUST map between domain entities, persistence models and DTOs in the
  `Application` layer, in one mapper per feature, never in the endpoint and
  never by returning the entity.
- MUST map with code that is checked at compile time: hand-written mapping
  methods or a source generator (Mapperly). MUST NOT map with reflection at
  runtime.
- MUST NOT add AutoMapper or any other mapper under a commercial license
  without the user's approval (base-standards, Dependencies).
- MUST NOT map a DTO onto an entity wholesale on create or update: the
  service sets each accepted field through the entity's methods
  (security-standards, Input handling, mass assignment).
- MUST test each mapper: a new property of the source that has no
  destination fails a test or is marked ignored on purpose (Mapperly's
  `RequiredMappingStrategy`).

## External integrations

When a feature calls a system outside the service (a third-party API,
another DiWork service, a file store, an identity provider), the agent MUST
propose the integration with the practices below, in the plan, before
writing it, and say which ones the user's request did not mention.

- MUST put the integration behind a port in `Application` and an adapter in
  `Infrastructure` that translates the external model to the service's own
  types (anti-corruption layer); no external DTO crosses into the domain.
- MUST call HTTP services through a typed client from `IHttpClientFactory`,
  never with `new HttpClient()`, with a timeout and the standard resilience
  handler (`Microsoft.Extensions.Http.Resilience`,
  `AddStandardResilienceHandler`): retries with backoff only for idempotent
  calls, circuit breaker.
- MUST authenticate to Azure resources with managed identity
  (`Azure.Identity`) where the resource supports it, and read any other
  secret from Key Vault or the platform's secret store
  (security-standards, Secrets). MUST NOT put a key in `appsettings.json`.
- MUST send the correlation id to the external system when it accepts one
  (base-standards, Logging) and log each call with its duration and status,
  not its body.
- MUST add a health check for every dependency the service cannot work
  without (`AddHealthChecks`), exposed on `/health/ready`, and a liveness
  endpoint `/health/live` that checks only the process.
- SHOULD instrument the service with OpenTelemetry (traces, metrics, logs)
  so a request can be followed across services and queues.
- SHOULD prefer the provider's official SDK over hand-written HTTP calls,
  when it is maintained.

## Testing

On top of backend-standards, Testing:

- MUST test with xUnit, one test project per kind (`UnitTests`,
  `IntegrationTests`).
- MUST unit-test domain rules and application services without ASP.NET
  Core, a database or a broker: dependencies are replaced through their
  ports.
- MUST test endpoints with `WebApplicationFactory<Program>`: status, the
  envelope, snake_case fields, and the security cases.
- SHOULD run integration tests against the real engine and broker in
  containers (Testcontainers, the Service Bus emulator), never against a
  shared environment.

## Review checklist

- Were the architecture questions asked and answered in the plan: microservice
  or project API, distributed transactions, persistence and engine,
  messaging and cache?
- Is every distributed transaction a saga with compensations and an outbox,
  never a two-phase commit?
- Does the change upgrade a runtime, SDK or package major? Was the risk
  evaluated and the user's decision recorded?
- Does `Domain` reference nothing, and does each layer reference only those
  below it?
- Are endpoints Minimal APIs in a per-feature group, thin, with
  `TypedResults`, a `CancellationToken`, and errors mapped in one handler?
- Are JSON fields and enums snake_case through the serializer policy? Does
  every DTO and property have a Spanish XML summary?
- Does Swagger show every operation with its summary, and is Swagger UI off
  or authenticated in production?
- Are lifetimes right, with no captive dependency and no service locator?
- Is input validated at the boundary with the service's one approach, and
  business rules kept in the service or domain?
- Is mapping compile-time checked, tested, and free of mass assignment?
- Is each external integration behind a port, through `IHttpClientFactory`
  with resilience, with managed identity or Key Vault, and a health check?
