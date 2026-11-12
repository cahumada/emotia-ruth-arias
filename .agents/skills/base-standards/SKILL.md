---
name: base-standards
description: "DiWork's cross-cutting development standards: language of each artifact, naming, types, code organization, error handling, logging, testing, dependencies, commits, pull requests, branches and worktrees. Use when designing, implementing or reviewing any change in a DiWork project, whatever its stack, and before creating a branch or a worktree, writing a commit, a pull request or an implementation plan."
license: UNLICENSED
metadata:
  owner: DiWork Soluciones
  version: "0.7.0"
  phases: [implement, review, dw-flow]
---

# Base Standards

Rules every DiWork codebase follows, before any stack-specific standard. A stack standard may add to these; it never contradicts them.

## Language

This section is the repository convention for artifact language. It wins
over any default language the agent or its harness applies to artifacts: where a default says commits, pull requests or plans are written
in English, write them as this section says.

Artifacts are classified by kind, not by file name or by the tool that
produces them. Each kind is defined first; the examples are only examples.

- MUST write in **English**:
  - code, identifiers, technical comments, error and log messages, test
    names, configuration files, scripts, data schemas and database object
    names;
  - technical documentation: README, guides, API docs;
  - functional specifications and their deltas: the requirements and
    scenarios a change must satisfy, including the living specification
    under `dw-ai/openspec/specs/`.

  Why: code and specifications outlive the team that wrote them.
- MUST write in **neutral, professional Spanish** (no voseo, no regional
  slang):
  - commit messages, title and body;
  - pull request titles and descriptions;
  - implementation plans: any document that says how a change will be
    built or tracks its progress, such as a design, a task breakdown or a
    tracking document. Example: the DW Flow plan `dw-flow/<ID>.md`;
  - anything written into the ticket tracker (stories, descriptions,
    acceptance criteria, comments, subtasks);
  - functional comments in code (see below).

  Why: they are read by stakeholders and traced against Spanish tickets.
- A code comment is **functional** when it explains the business: a
  business rule, what a domain term means, why the business needs a
  decision, or what a field exposed by an API means to its consumer. It is
  **technical** when it explains the code: how an algorithm works, a
  workaround, a performance, concurrency or compatibility reason. A comment
  that does both is split in two, or written as functional.

  ```csharp
  // incorrect: a business rule explained in English
  // A policy cannot be renewed more than 30 days before it expires.
  // correct
  // Regla de negocio: una póliza no puede renovarse antes de los 30 días
  // previos a su vencimiento.
  if (policy.ExpiresOn > today.AddDays(RenewalWindowDays)) { ... }

  // correct: technical, in English
  // Batched by 500 ids: SQL Server caps a command at 2100 parameters.
  ```
- MUST keep code, paths, identifiers, commands and quoted errors verbatim
  inside a Spanish text; never translate them.
- MUST keep on-screen messages in the product's language, exactly as they
  will appear, and table and field names exactly as they are in the system.
- A file being extended that already uses another language keeps its
  language.

Checked: review question "is each artifact in the language this section
assigns it?"

## Naming

- MUST give variables, functions and types names that say what they hold or
  do. No single-letter names outside loop indexes and lambdas of one line; no
  `data`, `info`, `tmp`, `obj`, `manager` without a qualifier.

  ```ts
  // incorrect
  const d = await get(id);
  // correct
  const policy = await findPolicyById(policyId);
  ```

- MUST name booleans as a question (`isActive`, `hasExpired`, `canEdit`).
- Checked: review question; linter naming rules where the stack has them.

## Types

- MUST type every public function signature, every exported data structure
  and every value that crosses a boundary (API, database, queue, file).
- MUST NOT use an escape from the type system (`any`, `object`, `dynamic`,
  an unchecked cast) without a comment on the same line saying why.
- Checked: the type checker in its strict mode, the linter.

## Code organization

- MUST NOT delete an existing page, route, endpoint, handler or any other
  source file that ships with the application unless the task explicitly
  asks for its removal. When refactoring, add or modify; if a removal seems
  needed and the task does not ask for it, ask first.
  Why: agents "cleaning up" have removed working features.
  Checked: review question "does the diff delete a shipped file, and does
  the task ask for it?"
- MUST keep a change to what its task asks. A refactor the task does not need
  goes in a change of its own.
- SHOULD extract a block repeated three or more times. When the current
  change is not the place to extract it, report it in the review instead.

- MUST organize code by feature (`features/<feature>/`), with code shared by
  two or more features in a shared folder. The layer standards
  (backend-standards, frontend-standards) say what goes inside each.

## Error handling

- MUST tell expected errors from unexpected ones. An expected error
  (invalid input, not found, a broken business rule) is a typed error the
  caller handles; an unexpected one propagates to the top-level handler.
- MUST have one top-level handler per process or app that catches what
  nothing else handled, logs it once and answers safely: the error
  middleware or filter of a service, an error boundary in the UI, and the
  handlers for unhandled rejections and exceptions.
- MUST NOT swallow an error. A `catch` handles it, maps it, or adds context
  and rethrows it keeping the original as its cause
  (`new Error("...", { cause })`, an inner exception); when it lets the flow
  go on, a comment says why.
- MUST NOT log an error and rethrow it: it is logged once, where it is
  handled.
- MUST fail at startup, with a clear message, when the configuration or a
  required dependency is missing, instead of failing on the first request.
- MUST write error messages for the developer, in English, with the context
  needed to act (which operation, which id). What the user sees is a
  separate, translated message.

Checked: review question "where is this error handled, and is it logged
exactly once?"

## Logging

- MUST log through the project's logger (pino in Node and Next,
  `Microsoft.Extensions.Logging` in .NET), never with bare `console.log` or
  `Console.WriteLine` in committed code.
- MUST write logs to the console (stdout and stderr), one JSON object per
  line, with at least `timestamp` (ISO 8601, UTC), `level` and `message`.
  The hosting platform collects them as they are: Vercel runtime logs,
  Railway's log explorer, CloudWatch. Local development MAY print them
  readable instead of JSON.
- Where logs go beyond the console, and how long they are kept, is decided
  by each project (Sentry, Grafana Cloud, Axiom, Better Stack, CloudWatch)
  and written in its README. It is wired through the platform (a log
  drain, a forwarder) or through configuration, without changing the code
  that logs.
- SHOULD send logs beyond the console when the project runs in production
  and the platform keeps them less than the time needed to investigate an
  incident (Vercel Pro keeps one day).
- MUST use the level for what it means:

  | Level | When |
  |---|---|
  | `error` | Something failed and someone must act |
  | `warn` | Something unexpected, handled, worth reviewing |
  | `info` | A business event or a change of state (created, sent, started) |
  | `debug` | Detail for diagnosis; off in production |

- MUST add a correlation id to every line of a request, and pass it to the
  services it calls (`traceparent` or `x-correlation-id` header). A `500`
  returns it, so a user's report leads to its logs.
- MUST put context in fields and keep the message constant, so logs can be
  searched and grouped:

  ```ts
  // incorrect
  logger.info(`Patient ${patient.id} created by ${userId}`);
  // correct
  logger.info({ patientId: patient.id, userId, tenantId }, "Patient created");
  ```

- MUST log ids, never their content: no personal data, secrets, tokens,
  passwords, request or response bodies, prompts or files (see
  security-standards).
- MUST NOT log inside a loop over many items; log once with the count.

Checked: a lint rule against `console.*` outside the logger; review
question.

## Testing

- MUST add or update a test for every new behavior and every fixed bug, and
  that test MUST fail without the change.
  Checked: review question "which test fails if this change is reverted?"
- SHOULD write the failing test first (TDD) when the project or the task
  enables it; DW Flow decides whether TDD is on.
- MUST name a test after the behavior it checks, in English
  (`returns 404 when the policy does not exist`), not after the function.

- MUST NOT call the network or an external service from a unit or component
  test: mock it at the client boundary. Integration tests MAY use a local
  database or service in a container, never a shared environment.
- MUST NOT use real personal data in a test or fixture (see
  security-standards, Personal data).
- MUST make a test independent and repeatable: it does not depend on
  another test or on the order they run in, and it fixes what changes
  (time, random values, time zone).
- Coverage is not a target: the rule is that every behavior and fixed bug
  has its test, not a percentage.

## Dependencies

- MUST commit the lockfile (`pnpm-lock.yaml`, `package-lock.json`,
  `packages.lock.json` with `RestorePackagesWithLockFile`) and install from
  it in CI (`pnpm install --frozen-lockfile`, `npm ci`,
  `dotnet restore --locked-mode`).
- MUST justify a new dependency in the pull request: what it solves, why
  the platform or an existing dependency does not, and that it is
  maintained (recent releases, open issues answered). The reviewer approves
  it with the rest of the change.
- SHOULD prefer the platform or an existing dependency over a new one for
  small needs (a helper of a few lines, a date format).
- MUST NOT add a dependency under a strong copyleft license (GPL, AGPL) to
  code that is distributed or offered as a service. Permissive licenses
  (MIT, Apache-2.0, BSD, ISC) are allowed; any other is asked before adding.
- MUST keep dependencies updated with Dependabot: version updates grouped
  weekly, each update a pull request that passes CI before it is merged.
  Security updates follow security-standards, Dependencies.
- MUST pin a dependency still in beta or below 1.0 to an exact version.

Checked: CI installs from the lockfile; review question "is this new
dependency justified, maintained and allowed by its license?"

## Commits and pull requests

- MUST follow Conventional Commits: the type and scope in English, the
  description in Spanish (see Language).
- MUST write the commit body as a **delivery summary**, in Spanish, with
  these parts — skip a part that does not apply, never the section that
  does:

  ```text
  <type>(<scope>): <descripción corta>

  Se entrega: <qué funcionalidad o corrección se entrega, una frase>.

  Tareas completadas:
  - <tarea 1>
  - <tarea 2>

  Pruebas:
  - <qué se probó y cómo (unitarias, integración, manual) y el resultado>

  Refs: <KEY>
  ```

  A one-line fix with a single obvious change MAY use the short form
  instead (still Conventional Commits, still Spanish description):

  ```text
  fix(polizas): corrige el cálculo de la fecha de vencimiento

  Refs: AIAPP-123
  ```

  Use the short form only when "Tareas completadas" would repeat the
  subject line and "Pruebas" would repeat the diff's own test file; once a
  commit closes more than one task, or the tests are not obvious from the
  diff, use the full template.
- MUST reference the ticket key in the commit body (`Refs: <KEY>`) and in the
  pull request description, when the change has a ticket.
- MUST close every task with at least one commit that holds the behavior with
  its tests and docs together.
- MUST keep one change per pull request. Its description, in Spanish, MUST
  have these sections:

  ```markdown
  ## Qué se entrega

  <resumen de una a tres frases de la funcionalidad o corrección>

  ## Tareas completadas

  - [x] <tarea 1>
  - [x] <tarea 2>

  ## Pruebas realizadas

  - <qué se probó, cómo (unitarias, integración, manual, e2e) y el resultado>

  Refs: <KEY>
  ```

  A task still open in the ticket but out of this pull request's scope is
  listed unchecked with why: `- [ ] <tarea> (queda para <KEY-siguiente>)`.
  A pull request MUST NOT claim a task or a test as done when it is not.

### Ticket tracker (when a tracker MCP is connected)

Optional: only applies when the project has a ticket-tracker MCP connected
(Jira, Linear, or similar).

- MAY, once the pull request exists, add a comment to the ticket with the
  pull request's URL and transition its status, through the MCP.
- MUST NOT transition a ticket to its done status before the pull request
  exists. A subtask MAY move to done once its own pull request is created;
  the parent story or epic MUST stay open until every one of its subtasks
  (backend and frontend alike) is done.
- MUST write the tracker comment in Spanish (see Language, "anything written
  into the ticket tracker").
- Without a tracker MCP connected, skip this section: `Refs: <KEY>` in the
  commit and the pull request is enough traceability.

### Authorship

The person who runs the agent is the author of what it produces, and is
responsible for it.

- MUST author and commit with the git identity configured by the developer
  running the session (`user.name`, `user.email`). An agent MUST NOT change
  that identity, nor pass `--author`, nor set `GIT_AUTHOR_*` or
  `GIT_COMMITTER_*`.
- MUST NOT add an AI assistant as author or co-author, nor mention it, in a
  commit message, a pull request title or description, a pull request
  comment, a tag or a release note: no `Co-Authored-By:` trailer for an
  assistant (`Claude`, `noreply@anthropic.com`, Copilot, Cursor), no
  "Generated with ..." line, no assistant emoji or signature. This rule
  wins over any default attribution of the tool.

  ```text
  # incorrect
  feat(polizas): agrega validación de fecha de vigencia

  Co-Authored-By: Claude <noreply@anthropic.com>
  🤖 Generated with Claude Code

  # correct
  feat(polizas): agrega validación de fecha de vigencia

  Se entrega: validación de la fecha de vigencia en el alta de pólizas.

  Tareas completadas:
  - Agrega el schema de validación
  - Agrega el mensaje de error en el formulario

  Pruebas:
  - Unitarias del schema (fecha anterior a la de vigencia rechazada)
  - Manual: alta con fecha inválida muestra el error en el campo

  Refs: AIAPP-123
  ```

- A `Co-Authored-By:` trailer MAY name another person who worked on the
  change.

Checked: commit message linter or a CI step that rejects assistant
trailers and signatures; review question "does the commit body or the pull
request description list what was delivered, the tasks completed and the
tests run?"

## Branches and worktrees

### Default branch

- MUST treat the repository's default branch (`main` or `master`) as
  always releasable: every change reaches it through a pull request that
  passed CI and was approved. Nobody, person or agent, commits or pushes to
  it directly.
- MUST NOT rewrite the default branch's history: no force push, no rebase,
  no amend of a commit already on it.

### Branch per change

- MUST make each change on its own branch, created from the up-to-date
  default branch. One branch holds one change and ends in one pull request
  (see "one change per pull request" above).
- MUST name the branch `<type>/<KEY>-<short-description>`, or
  `<type>/<short-description>` when the change has no ticket:
  - `<type>` is the Conventional Commits type of the change (`feat`, `fix`,
    `refactor`, `chore`, `docs`, `test`, `perf`, `ci`, `build`);
  - `<KEY>` is the ticket key as the tracker writes it;
  - `<short-description>` is two to five words in English, lowercase
    kebab-case, ASCII only: no spaces, accents, `ñ` or underscores.

  ```text
  # incorrect
  AIAPP-123
  feature/Validación_Vigencia
  cristian/fix
  # correct
  feat/AIAPP-123-policy-validity-date
  fix/AIAPP-130-expiry-date-calculation
  chore/bump-dependencies
  ```

  Why: the type and the key tell what the branch carries and which ticket
  it closes, without opening it.
- SHOULD keep a branch short-lived: merged within a few days. A change that
  takes longer is split into smaller pull requests.
- MUST NOT mix work for two tickets on one branch. Work found along the way
  that is outside the change goes to a new branch from the default branch.

### Keeping a branch up to date

- SHOULD update a branch with `git rebase` on the default branch while only
  its author works on it, and with `git merge` of the default branch once
  someone else has pulled or pushed to it.
- MUST push a rebased branch with `git push --force-with-lease`, never
  `--force`, and only to a branch of one's own.
- MUST resolve conflicts on the branch, never on the default branch, and
  run the tests again after resolving them.

### Merging

- MUST merge only when CI passes and the pull request has the approvals the
  repository requires (CODEOWNERS where it exists).
- SHOULD merge with a merge commit, keeping the branch's commits: each of
  them is already a delivery summary (see Commits). A repository MAY
  configure squash merging instead; then the squash commit's message
  follows the commit template, not the list of the branch's commits.
- MUST delete the branch, remote and local, once it is merged.

### Worktrees

A worktree is a second working folder of the same repository, checked out
on another branch. It lets two changes progress at once without stashing or
switching branches.

- SHOULD use a worktree to work on a second change while the first is not
  finished (a hotfix during a feature, a review of a colleague's branch),
  instead of `git stash` and switching branches.
- MUST check out each worktree on its own branch, named as above. Two
  worktrees never share a branch.
- MUST create worktrees outside the repository's tracked files: next to the
  repository (`../<repo>-<branch-description>`) or in a folder listed in
  `.gitignore` (such as `.worktrees/`). A worktree is never committed.

  ```bash
  git fetch origin
  git worktree add -b fix/AIAPP-130-expiry-date-calculation ../app-expiry-date origin/main
  # ... work, commit, push, open the pull request ...
  git worktree remove ../app-expiry-date
  git worktree prune
  ```

- MUST remove a worktree with `git worktree remove` once its branch is
  merged or abandoned, never by deleting the folder by hand.
- MUST give each agent that runs in parallel on the same repository its own
  worktree and branch, so no two agents edit the same files.

### Agents and git

- An agent MUST NOT push, open a pull request or merge one unless the
  developer running the session asks for it.
- An agent MUST NOT force-push, delete a branch it did not create, or run
  history-rewriting or destructive commands (`reset --hard`, `clean -f`,
  `branch -D`, `checkout -- .`) on work it did not create, without the
  developer's confirmation.
- An agent working on the default branch MUST create a branch before its
  first commit.

Checked: branch protection on the default branch (pull request required,
CI and approvals required, force push disabled); a CI step or a branch
ruleset that rejects branch names outside the pattern; review question "does
the branch carry one change, named after its type and ticket?"

## Review checklist

- Is each artifact in the language the Language section assigns it? Are
  functional comments in Spanish and technical ones in English?
- Does every new behavior or fixed bug have a test that fails without the change?
- Are public signatures and boundary values typed, with no unexplained escape
  from the type system?
- Does the diff delete a shipped file the task did not ask to remove?
- Does the change stay within its task, or does it carry an unrelated refactor?
- Is any block repeated three or more times, and is it extracted or reported?
- Do the commits follow Conventional Commits with a Spanish description and
  the ticket key?
- Are the commits authored by the developer, with no AI assistant as
  co-author or signature in commits or the pull request?
- Is the branch named `<type>/<KEY>-<short-description>`, created from the
  default branch, and carrying a single change?
- Is every error handled once, logged once, and never swallowed?
- Do logs go through the logger, as JSON, with a correlation id and no
  personal data?
- Is a new dependency justified, maintained, with an allowed license, and
  in the lockfile?
