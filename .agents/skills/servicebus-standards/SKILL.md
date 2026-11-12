---
name: servicebus-standards
description: "DiWork's Azure Service Bus standards for .NET: the worker inside the service's solution, queues and topics, message contracts, publishing through an outbox, idempotent consumers, retries and dead-lettering, ordering with sessions, and sagas for distributed transactions. Use when designing, implementing or reviewing a .NET component that sends or receives Azure Service Bus messages."
license: UNLICENSED
metadata:
  owner: DiWork Soluciones
  version: "0.7.0"
  phases: [implement, review, dw-flow]
  layers: [backend]
  stacks: [servicebus]
  extends: backend-dotnet-standards
---

# Azure Service Bus Standards

How a .NET service sends and receives messages through Azure Service Bus.
Adds to backend-standards (Transactions) and backend-dotnet-standards.
Delivery is at least once: every rule below assumes a message can arrive
twice, late, or never be completed.

## Worker in the same solution

- When a service connects to Service Bus, the agent MUST suggest adding the
  consumer as a Worker project in the **same solution**
  (`src/<Service>.Worker/`), and record the user's answer in the plan.
  Why: the worker reuses the service's `Domain`, `Application` and
  `Infrastructure`, so a message and an HTTP request run the same business
  rule, versioned and released together.
- MUST build the worker as a .NET Worker Service (`Host.CreateApplicationBuilder`)
  with its own composition root, calling the same `AddApplication()` and
  `AddInfrastructure()` as the API. It holds consumers only: no business
  rule lives in it.
- MUST deploy the worker as its own process (its own container or app),
  scaled apart from the API. MUST NOT run consumers inside the API process
  unless the user decides so, with the reason in the plan.

## Clients and configuration

- MUST use `Azure.Messaging.ServiceBus`, with one `ServiceBusClient`
  registered as a singleton (through `Microsoft.Extensions.Azure`,
  `AddAzureClients`), and senders created once per entity and reused.
- MUST authenticate with managed identity (the namespace's fully qualified
  name and a `TokenCredential`), not a connection string with a shared key,
  in every shared environment. Local development MAY use the emulator.
- MUST create queues, topics, subscriptions and their settings (lock
  duration, max delivery count, sessions, dead-lettering) as infrastructure
  as code. MUST NOT create or change entities from application code at
  runtime (`ServiceBusAdministrationClient`).
- MUST read entity names from typed options, not literals spread in code.

## Queues, topics and contracts

- MUST use a queue for a **command** (one consumer must do something:
  `generate-invoice`) and a topic with subscriptions for an **event**
  (something happened, any number may react: `patient-created`). Entity
  names are kebab-case.
- MUST define each message as a `sealed record` in `Application`, named as a
  command (`GenerateInvoiceCommand`) or a past-tense event
  (`PatientCreatedEvent`), serialized as JSON with the same snake_case
  policy as the API and documented in Spanish like an API DTO
  (backend-dotnet-standards, Contracts).
- MUST set on every message: `MessageId` (unique and stable for the same
  business fact, so a retry of the publish is deduplicated),
  `CorrelationId`, `Subject` (the message type), `ContentType`
  (`application/json`) and an application property with the contract
  version (`schema_version`).
- MUST evolve a contract additively. A breaking change is a new message
  type or a new `schema_version` that consumers handle side by side until
  every producer has moved.
- MUST NOT put personal data, secrets or files in a message: ids and the
  minimum the consumer needs (security-standards, Personal data). A payload
  near the size limit goes to Blob Storage and the message carries its
  reference (claim check).

## Publishing

- MUST NOT publish a message inside the database transaction, nor before it
  commits (backend-standards, Transactions). A message announcing a change
  MUST be written to an outbox in the same transaction as the change, and
  sent by a dispatcher in the worker that marks each row sent.
- MAY instead use the Cosmos DB change feed as the outbox when the state
  that changes lives in Cosmos DB (cache-standards).
- SHOULD enable duplicate detection on an entity whose producer may resend
  the same `MessageId`.

## Consuming

- MUST consume with `ServiceBusProcessor` (or `ServiceBusSessionProcessor`)
  in `PeekLock` mode, with `AutoCompleteMessages = false`, one hosted
  service per entity, and a handler class per message type resolved in its
  own DI scope.
- MUST complete a message only after its work is committed; abandon it to
  retry a transient failure, and dead-letter it with a reason and a
  description when it can never succeed (an invalid payload, a broken
  business rule). MUST NOT complete a message whose processing failed.
- MUST make every handler idempotent: record the processed `MessageId` in
  the same transaction as the work (a processed-messages table, or a
  Cosmos DB item or Redis key with a TTL longer than the redelivery
  window), and skip a message already processed.
- MUST set `MaxConcurrentCalls` and `PrefetchCount` on purpose, and the
  entity's `MaxDeliveryCount` so a poison message reaches the dead-letter
  queue instead of retrying forever.
- MUST renew the lock for work that can outlast it
  (`MaxAutoLockRenewalDuration`), and keep a handler short; long work is
  split into steps with messages of their own.
- MUST use sessions (`SessionId` = the aggregate id) only when messages of
  the same aggregate must be processed in order; ordering is not assumed
  otherwise.
- MUST continue the trace and the correlation id from the message to the
  logs of the handler (base-standards, Logging).
- MUST monitor every dead-letter queue: an alert when it is not empty, and
  a documented way to inspect and resubmit its messages.

## Distributed transactions

When backend-dotnet-standards' questions found that an operation spans
services, it is a saga.

- MUST implement the saga with the answers recorded in the plan: an
  orchestrator holding the saga's state (in the service's database or in
  Cosmos DB) for three or more steps or any compensation, or choreography
  through events for two steps without compensation.
- MUST give each step a command, a success event, a failure event and a
  compensating command; the orchestrator moves the state only on those
  events, persisted before it sends the next command.
- MUST time out every step, and run the compensations of the completed
  steps, in reverse order, when one fails or expires.
- MUST expose the saga's state (a status the API can return) and alert on a
  saga stuck beyond its timeout.

## Testing

- MUST unit-test handlers without Service Bus: the handler receives the
  deserialized message and its ports are replaced.
- MUST test that a handler is idempotent: the same message twice changes
  state once.
- SHOULD run integration tests against the Azure Service Bus emulator in a
  container, never a shared namespace.

## Review checklist

- Is the consumer in a Worker project of the same solution, reusing
  `Application`, deployed as its own process?
- Is there one singleton `ServiceBusClient` with managed identity, and are
  entities created by infrastructure as code?
- Is each message a documented snake_case record with `MessageId`,
  `CorrelationId`, `Subject` and `schema_version`, free of personal data?
- Is every publish of a state change sent through an outbox, after commit?
- Does every handler complete only after commit, dead-letter what cannot
  succeed, and skip a `MessageId` already processed?
- Are concurrency, lock renewal and max delivery count set on purpose, and
  are dead-letter queues monitored?
- Is a cross-service operation a saga with timeouts and compensations,
  with its state visible?
