---
name: efcore-standards
description: "DiWork's Entity Framework Core standards: DbContext and entity configuration, providers for SQL Server, Oracle and PostgreSQL, queries, tracking, concurrency, soft delete and tenant filters, and migrations. Use when designing, implementing or reviewing a .NET component that persists with Entity Framework Core."
license: UNLICENSED
metadata:
  owner: DiWork Soluciones
  version: "0.7.0"
  phases: [implement, review, dw-flow]
  layers: [backend]
  stacks: [efcore]
  extends: backend-dotnet-standards
---

# Entity Framework Core Standards

How a .NET component persists with Entity Framework Core. Adds to
backend-standards (Data access, Transactions, Migrations) and
backend-dotnet-standards. Chosen when the user picks "Entity Framework with
migrations" (backend-dotnet-standards, Before designing).

## Providers

| Engine | Provider package | Notes |
|---|---|---|
| SQL Server | `Microsoft.EntityFrameworkCore.SqlServer` | `rowversion` for concurrency |
| PostgreSQL | `Npgsql.EntityFrameworkCore.PostgreSQL` | `xmin` for concurrency; `timestamptz` for UTC instants |
| Oracle | `Oracle.EntityFrameworkCore` | its major follows EF Core's with a delay: check that it supports the EF Core version before upgrading either |

- MUST use the provider of the component's engine, at the major version of
  EF Core it supports, and keep EF Core and the provider on the same major.
- MUST configure the engine's retry on transient failures
  (`EnableRetryOnFailure` on SQL Server and PostgreSQL); a manual
  transaction then runs inside `Database.CreateExecutionStrategy()`.

## DbContext and configuration

- MUST put the `DbContext`, the entity configurations and the migrations in
  `Infrastructure`. `Domain` has no EF Core attribute or reference.
- MUST configure each entity in its own `IEntityTypeConfiguration<T>`
  class, applied with `ApplyConfigurationsFromAssembly`; no data annotations
  on domain types.
- MUST map private fields and value objects through the configuration
  (backing fields, `OwnsOne`, value converters for strongly typed ids), so
  the domain keeps its encapsulation.
- MUST apply the engine's naming convention once, for the whole model (for
  PostgreSQL, snake_case through `UseSnakeCaseNamingConvention` from
  `EFCore.NamingConventions`), not table by table.
- MUST register the context as scoped (`AddDbContext` or
  `AddDbContextPool`); never as a singleton, never shared between threads.
- MUST NOT enable lazy loading.

## Queries

- MUST read with `AsNoTracking()` when the result is not modified, and
  project to the DTO or read model with `Select` instead of loading the
  entity to return a few fields (backend-standards, Data access).
- MUST load the relations a command needs with `Include` in the same query,
  or with `AsSplitQuery()` when several collections would multiply the rows.
- MUST pass the `CancellationToken` to every async EF call.
- MUST use `ExecuteUpdateAsync` / `ExecuteDeleteAsync` for a bulk change
  that needs no domain rule per row, instead of loading the rows.
- MUST write raw SQL only with `FromSql` or `SqlQuery` and an interpolated
  string, which EF parameterizes. MUST NOT use `FromSqlRaw` or
  `ExecuteSqlRaw` with a concatenated string (security-standards, Input
  handling).
- MUST declare the soft-delete and tenant conditions as global query
  filters (`HasQueryFilter`). `IgnoreQueryFilters()` needs a comment saying
  why.

## Transactions and concurrency

- MUST let one `SaveChangesAsync` per command be the transaction. An
  explicit transaction (`BeginTransactionAsync`) is used only when the
  command needs several `SaveChanges` that must commit together.
- MUST mark a concurrency token on an entity two users may edit
  (`IsRowVersion` on SQL Server, `xmin` on PostgreSQL, a version column
  incremented on save on Oracle) and answer `409` on
  `DbUpdateConcurrencyException`.
- MUST write the outbox row in the same `SaveChangesAsync` as the change it
  announces, when the change publishes a message (servicebus-standards).

## Migrations

- MUST create migrations with `dotnet ef migrations add <Name>
  --project src/<Service>.Infrastructure --startup-project src/<Service>.Api`,
  with a name that says what it does (`AddPatientBirthDate`).
- MUST attach the idempotent SQL script (`dotnet ef migrations script
  --idempotent`) or its relevant part to the pull request when the migration
  has a destructive step, so the reviewer reads the SQL that will run
  (backend-standards, Migrations).
- MUST apply migrations from the pipeline with a migration bundle
  (`dotnet ef migrations bundle`) or the idempotent script. MUST NOT call
  `Database.Migrate()` or `EnsureCreated()` at application startup in a
  shared environment.
- MUST seed reference data with `HasData` in a migration or an idempotent
  script, never from application startup.

## Review checklist

- Is the provider the engine's, on EF Core's major, with transient retry?
- Are configurations in `IEntityTypeConfiguration<T>` classes, with no EF
  attribute in `Domain`?
- Do reads use `AsNoTracking` and project with `Select`? Are relations
  loaded in the query, never lazily?
- Is raw SQL interpolated and parameterized, never `FromSqlRaw` with
  concatenation?
- Are soft delete and tenant global query filters, with every
  `IgnoreQueryFilters` explained?
- Does an editable entity have a concurrency token, mapped to `409`?
- Is the migration named, generated in `Infrastructure`, reviewed as SQL
  when destructive, and applied from the pipeline, not at startup?
