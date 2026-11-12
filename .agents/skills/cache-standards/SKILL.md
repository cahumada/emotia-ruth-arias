---
name: cache-standards
description: "DiWork's cache and state store standards for .NET with Redis and Azure Cosmos DB: what may be cached, keys scoped by tenant, expiration and invalidation, HybridCache with Redis, Cosmos DB partitioning and point reads, and their use as idempotency, saga and outbox store next to Azure Service Bus. Use when designing, implementing or reviewing a .NET component that caches data or keeps state in Redis or Cosmos DB."
license: UNLICENSED
metadata:
  owner: DiWork Soluciones
  version: "0.7.0"
  phases: [implement, review, dw-flow]
  layers: [backend]
  stacks: [redis, cosmosdb]
  extends: backend-dotnet-standards
---

# Cache and State Store Standards

How a .NET service uses Redis and Azure Cosmos DB, as a cache in front of
its database, or as a store for state that supports messaging
(servicebus-standards): processed message ids, saga state, outbox.

| Use | Store |
|---|---|
| Cache of reads from the service's database | Redis, through `HybridCache` |
| Short-lived keys: processed `MessageId`s, locks, rate limits | Redis |
| Documents read by key, saga state, outbox with change feed | Cosmos DB |

## What may be cached

- MUST cache only data that may be served stale for its expiration time, and
  say so in the plan with that time. The database stays the source of
  truth: a cache miss or a cache outage reads from it.
- MUST NOT fail a request because the cache is down: a cache error is
  logged as `warn` and the request goes to the source.
- MUST NOT cache secrets or tokens. MUST NOT cache personal data unless the
  plan justifies it, with the shortest expiration that works and the same
  access checks as the source (security-standards, Personal data).
- MUST NOT cache a response that depends on the caller's permissions under
  a key that does not include what it depends on.

## Keys, expiration and invalidation

- MUST build every key from the tenant, the feature, the entity and its id,
  in one key builder per feature: `{tenant_id}:patients:{patient_id}`. MUST
  NOT build a key without the tenant for tenant data
  (security-standards, Multi-tenant isolation).
- MUST set an expiration on every entry; nothing is cached forever.
- MUST invalidate (remove or overwrite) an entry in the same command that
  changes its source, after the transaction commits; SHOULD use tags
  (`HybridCache.RemoveByTagAsync`) to invalidate a group, such as every list
  of a tenant.
- MUST serialize cached values with the service's JSON policy (snake_case),
  and include a version segment in the key (`v2:`) when the cached shape
  changes.

## Redis

- MUST cache reads through `HybridCache` (`Microsoft.Extensions.Caching.Hybrid`)
  with Redis as its distributed layer (`AddStackExchangeRedisCache`), which
  adds the in-memory layer and protects against stampedes. MUST NOT call
  `IConnectionMultiplexer` for plain cache-aside reads.
- MUST register one `IConnectionMultiplexer` as a singleton when Redis is
  used directly (locks, `MessageId` deduplication with `SET NX` and an
  expiration, counters).
- MUST authenticate with Microsoft Entra ID (managed identity) where the
  Azure Redis offering supports it, or read the access key from Key Vault;
  TLS always.
- MUST NOT run commands that scan the keyspace (`KEYS`, `FLUSHDB`) from
  application code.

## Cosmos DB

- MUST register one `CosmosClient` as a singleton, authenticated with
  managed identity, with the serializer set to the service's
  System.Text.Json options (`UseSystemTextJsonSerializerWithOptions`); the
  document id stays `id`.
- MUST choose the partition key in the plan, by the queries the container
  serves: for tenant data, `tenant_id` or a hierarchical key starting with
  it. Every query on tenant data includes the partition key.
- MUST read a document by id and partition key (`ReadItemAsync`, a point
  read) whenever both are known, instead of a query. A cross-partition
  query needs a comment saying why.
- MUST use the document's `_etag` for optimistic concurrency
  (`IfMatchEtag`) when two writers may update the same document (saga
  state, counters), retrying or answering `409` on a precondition failure.
- MUST set the container's default TTL on documents that expire (cache
  entries, processed message ids); a document that must not expire sets
  `ttl: -1`.
- MUST create databases and containers, with their partition key, indexing
  policy and throughput, as infrastructure as code, not from application
  code at startup.
- SHOULD exclude from indexing the paths no query filters on.
- MUST log the request charge (RU) of an operation that exceeds the
  expected budget, and handle `429` with the SDK's retry, not a loop of its
  own.

## With Azure Service Bus

- MUST store a consumer's processed `MessageId`s where the consumer's work
  is committed, so both happen together. When the work goes to Cosmos DB, the
  processed id is a document in the same partition written with the work in
  a transactional batch (`TransactionalBatch`); a Redis key is used only
  when the handler's work is itself idempotent.
- MUST keep a saga's state as one document per saga instance, updated with
  its `_etag` (servicebus-standards, Distributed transactions).
- MAY use the change feed as the outbox: the change and its pending message
  are written in one transactional batch, and a change feed processor in the
  worker publishes it and marks it sent.

## Testing

- MUST test that a read still answers when the cache is down, and that a
  write invalidates its entries.
- SHOULD run integration tests against Redis in a container and the Cosmos
  DB emulator, never a shared account.

## Review checklist

- Is every cached value allowed to be stale, with an expiration, and never a
  secret or unjustified personal data?
- Does every key carry the tenant and come from the feature's key builder?
- Is an entry invalidated after the commit of the write that changes it?
- Does a cache outage degrade to the source instead of failing the request?
- Are reads cached through `HybridCache`, with singleton clients and managed
  identity?
- Does each Cosmos DB container have a planned partition key, point reads
  where possible, `_etag` concurrency, TTL where needed, and infrastructure
  as code?
- Are processed message ids, saga state and outbox written together with
  the work they belong to?
