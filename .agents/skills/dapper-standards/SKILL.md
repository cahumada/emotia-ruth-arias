---
name: dapper-standards
description: "DiWork's Dapper standards: connection factory, parameterized queries and stored procedures on SQL Server, Oracle and PostgreSQL, transactions, mapping, pagination and versioned schema scripts. Use when designing, implementing or reviewing a .NET component that persists with Dapper, SQL queries or stored procedures."
license: UNLICENSED
metadata:
  owner: DiWork Soluciones
  version: "0.7.0"
  phases: [implement, review, dw-flow]
  layers: [backend]
  stacks: [dapper]
  extends: backend-dotnet-standards
---

# Dapper Standards

How a .NET component persists with Dapper, through SQL queries or stored
procedures. Adds to backend-standards (Data access, Transactions,
Migrations) and backend-dotnet-standards. Chosen when the user picks
"Dapper with queries and stored procedures" (backend-dotnet-standards,
Before designing). Code deployed into the database (the procedures
themselves) follows the database standards of its language (`tsql`,
`plsql`).

## Providers

| Engine | ADO.NET provider | Parameter prefix | Page |
|---|---|---|---|
| SQL Server | `Microsoft.Data.SqlClient` (not `System.Data.SqlClient`) | `@` | `OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY` |
| PostgreSQL | `Npgsql` | `@` | `LIMIT @limit OFFSET @offset` |
| Oracle | `Oracle.ManagedDataAccess.Core` | `:` | `OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY` (12c and later) |

## Connections

- MUST open connections through one factory port
  (`IDbConnectionFactory.CreateOpenConnectionAsync(cancellationToken)`)
  implemented in `Infrastructure` with the engine's provider and the
  connection string from configuration. A repository MUST NOT build a
  connection itself.
- MUST open a connection per unit of work and dispose it with
  `await using`; the provider's pool reuses it. MUST NOT keep a connection
  in a singleton or a field that outlives the request.
- MUST pass the `CancellationToken` through `CommandDefinition` to every
  call.

## Queries and stored procedures

- MUST put SQL in the repository of the feature, in `Infrastructure`: as a
  `const string` next to the method that runs it, or in an embedded `.sql`
  file when it is long. MUST NOT build SQL in `Application` or `Api`.
- MUST pass every value as a parameter (an anonymous object or
  `DynamicParameters`). MUST NOT concatenate or interpolate input into SQL
  (security-standards, Input handling). A sort column comes from a
  whitelist mapped to a constant column name.

  ```csharp
  // incorrect
  var sql = $"SELECT * FROM patients WHERE name = '{name}'";

  // correct
  const string sql = """
      SELECT id, name, birth_date
      FROM patients
      WHERE tenant_id = @TenantId AND name = @Name AND is_deleted = 0
      """;
  var rows = await connection.QueryAsync<PatientRow>(
      new CommandDefinition(sql, new { TenantId = tenantId, Name = name }, cancellationToken: cancellationToken));
  ```

- MUST list the columns a query returns; never `SELECT *`.
- MUST call a stored procedure with `CommandType.StoredProcedure` and its
  name, never with an `EXEC` string built by hand.
- MUST read a procedure's result per engine:
  - SQL Server: result sets with `QueryAsync` or `QueryMultipleAsync`,
    output parameters through `DynamicParameters` with
    `ParameterDirection.Output`.
  - PostgreSQL: a procedure returns no result set; a read is a function
    `RETURNS TABLE (...)` called with `SELECT ... FROM fn(@p)`, and a
    procedure (`CALL`) is used only for writes.
  - Oracle: a result set comes back as a `SYS_REFCURSOR` output parameter,
    which needs `OracleParameter` with `OracleDbType.RefCursor` (through a
    `SqlMapper.IDynamicParameters` implementation), not plain
    `DynamicParameters`.
- MUST read related rows with a join and multi-mapping, or with
  `QueryMultipleAsync`, never with one query per row (backend-standards,
  Data access, N+1).
- MUST include the tenant and soft-delete conditions in every query on
  tenant data; SHOULD keep them in shared SQL fragments so none is
  forgotten (security-standards, Multi-tenant isolation).

## Mapping

- MUST read rows into persistence records (`PatientRow`) in
  `Infrastructure` and map them to domain entities or DTOs there or in the
  feature's mapper (backend-dotnet-standards, Mapping); a row record never
  leaves `Infrastructure`.
- MUST map snake_case columns to properties once, at startup
  (`DefaultTypeMap.MatchNamesWithUnderscores = true`), or with column
  aliases in the query; not with per-type custom maps unless needed.
- MUST register type handlers once for types the provider does not map
  (`DateOnly` on older providers, strongly typed ids).

## Transactions

- MUST run the commands of one unit of work on one connection and one
  `DbTransaction`, passing the transaction to every call; the repository
  methods take it, or a unit-of-work port holds it.
- MUST commit explicitly and let `await using` roll back on an exception.
- MUST write the outbox row in the same transaction as the change it
  announces, when the change publishes a message (servicebus-standards).
- MUST check optimistic concurrency with a version column in the `WHERE`
  of the `UPDATE` and answer `409` when no row was affected.

## Schema changes

Dapper has no migrations of its own: the schema is versioned with scripts.

- MUST change the schema only through numbered, versioned SQL scripts in
  the repository (`db/migrations/V0007__add_patient_birth_date.sql`),
  applied by one migration tool (DbUp, or the engine-neutral tool the
  project chose) that records which scripts ran.
- MUST version stored procedures, functions and views as files in the
  repository, deployed by the same pipeline; never edited only in the
  database. A change to one is a new script or a repeatable script
  (`CREATE OR ALTER`, `CREATE OR REPLACE`) committed with the code that
  needs it.
- MUST apply scripts from the pipeline, never from a developer machine
  (backend-standards, Migrations), and never edit a script already applied
  to a shared environment.

## Testing

- MUST test repositories against the real engine in a container
  (Testcontainers), with the schema scripts applied; Dapper SQL is not
  checked by the compiler, only by running it.

## Review checklist

- Does every query go through the connection factory, disposed per unit of
  work, with a `CancellationToken`?
- Is every value a parameter, every sort column whitelisted, and every
  column listed?
- Are stored procedures called with `CommandType.StoredProcedure`, and read
  the way the engine returns results (Oracle ref cursor, PostgreSQL
  function)?
- Do queries filter by tenant and soft delete, with no N+1?
- Do the commands of a unit of work share one transaction, with the outbox
  row inside it?
- Is the schema or procedure change a versioned script applied from the
  pipeline, with a test against the real engine?
