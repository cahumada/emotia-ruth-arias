---
name: frontend-standards
description: "DiWork's frontend standards: structure, components, state, data fetching, feedback, forms, styling, accessibility, user-facing text and frontend tests. Use when designing, implementing or reviewing user interface code, screens, components, forms or client-side logic."
license: UNLICENSED
metadata:
  owner: DiWork Soluciones
  version: "0.7.0"
  phases: [implement, review, dw-flow]
  layers: [frontend]
---

# Frontend Standards

How client-side code is written in DiWork projects. Applies on top of base-standards and security-standards; a stack skill (`frontend-react-standards`, `next-standards`) adds how each rule is done with its tools.

Every project uses TypeScript in strict mode, react-hook-form with Zod for
forms, SWR for server data, Playwright for end-to-end tests, and one design
system, chosen when the project is created and declared as a stack of its
frontend component:

| Stack | Design system | Styling |
|---|---|---|
| `shadcn` | shadcn/ui on Radix; components copied into the project | Tailwind CSS classes and the theme's CSS variables |
| `astryx` | Astryx (`@astryxdesign/core`, Meta; beta, React 19+); components installed as a dependency | StyleX (`stylex.create`, the `xstyle` prop) and the theme package's tokens |
| `tailwind` | No component library: base HTML elements styled directly, wrapped once per component the same as the other two stacks (see Structure) — chosen when the project needs no prebuilt primitives (Radix) or is too small to justify one | Tailwind CSS classes and the theme's CSS variables |

A project MUST NOT declare more than one of these. The rules below hold for
all three; each design system's skill (`shadcn-standards`, `astryx-standards`)
adds how for the two that have one — a `tailwind` project follows this
standard alone, with no extra stack skill to load.

## Structure

- MUST organize code by feature (`features/<feature>/` with its components,
  hooks, services, schemas and types), not by technical type across the app.
- MUST put code used by two or more features in a shared folder
  (`components/ui` for the base components, `components/shared`, `hooks`,
  `lib`). A feature MUST NOT import another feature's internals; it uses
  what the other exports from its `index.ts`, or the code moves to shared.
- MUST wrap each base component once where the project needs behavior on
  top of it (a form field bound to the form library, a data table synced to
  the URL, a search input with debounce) and use the wrapper in every
  feature. A screen MUST NOT rebuild one from primitives. With `shadcn` or
  `astryx` the base component comes from the design system; with `tailwind`
  it is the project's own element (a `<button>`, a `<div>` styled as a
  card) wrapped the same way, so a screen never repeats the same
  Tailwind classes by hand.
  Why: one wrapper fixes behavior, accessibility and style everywhere.

## Components

- MUST write function components with typed props; no class components.
- MUST name a component in PascalCase, in a file with its name
  (`PatientCard.tsx`), and a hook with the `use` prefix (`usePatients.ts`).
- MUST keep a component to one job. Split it when it fetches data and renders
  a complex layout, or when a part of it has its own state; a component that
  needs a scroll to read is a candidate.
- MUST move logic with state or effects shared by two components into a hook.
- MUST NOT compute during render what can be derived once: derive values
  from props and state instead of copying them into state; memoize
  (`useMemo`, `useCallback`) only where a measurement or a dependency needs
  it, not by default.
- MUST give every item of a list a stable `key` from its data, never the
  index when the list can change order.

## State

- MUST keep state as close as possible to where it is used: local state
  first, lifted to the nearest common parent when two siblings need it, a
  context or store only for state the whole app reads (session, tenant,
  theme).
- MUST keep in the URL the state a user expects to share or keep on reload:
  search, filters, page, sort, selected tab. The URL is the source of truth
  and the fetch reacts to it.
- MUST NOT copy server data into a global store to share it; the
  data-fetching cache shares it.
- MUST NOT store secrets, tokens or personal data in `localStorage` or
  `sessionStorage` (see security-standards). A draft or a UI preference may
  live there; the server value wins when both exist.

## Data fetching

- MUST call the API through the feature's service or hook, built on one
  shared client that sets credentials, parses the response envelope and
  turns an error response into a typed error with a user-facing message. A
  component MUST NOT call `fetch` with a hand-written URL.
- MUST read server data in client components through SWR, with one key per
  resource and query (`["/api/v1/patients", { search, page }]`), and
  revalidate the affected keys (`mutate`) after a write. Data read on the
  server (server components) uses the framework's fetching instead.
  Why: requests are deduplicated and cached, and a write refreshes every
  view of the data.
- MUST show a paginated list with server-side pagination, search and sort,
  following the list contract in backend-standards, with its state in the
  URL.
- MUST debounce a search input that triggers a request, with one product
  default delay, and reset the page to the first when the filter changes.
- MUST ignore or cancel a response that arrives after its component
  unmounted or after a newer request (an `AbortController`, or the caching
  library).
- MUST fetch independent data in parallel, and only the catalogs the screen
  uses.
- MUST download a binary response as a blob and release its object URL
  after the download starts; never parse it as JSON.

## Feedback

- MUST handle the four states of every asynchronous view: loading, error,
  empty and data. An empty list says it is empty and, when it applies, how
  to add the first item.
- MUST show a skeleton that mirrors the final layout for an initial load
  that has a structure (table, list, form); a spinner only for a short
  action (submit). A Next.js App Router project's default for a whole page
  is in next-standards (`loading.tsx` per route segment).
- MUST confirm every write (create, update, delete) with a toast: success or
  the error's message. An error that needs attention or a longer
  explanation also stays on the page as an alert.
- MUST show the message the API returns for `400`, `403`, `409` and `422`,
  through the shared client, never a raw payload or an error code. `401`
  sends the user to sign in again.
- MUST disable a submit button while its request runs, and ask for
  confirmation before a destructive action (delete, cancel, revoke), naming
  what will be lost.

## Forms

- MUST build every form with the form library and one schema: the
  project's form wrapper and field components, never raw inputs wired by
  hand.
- MUST define the schema in its own file in the feature
  (`<feature>FormSchema.ts`), so it can be tested without rendering, and
  build it from a factory that receives the translation function: no
  validation message is hard-coded.
- SHOULD validate a field when it loses focus (`mode: "onTouched"`) and the
  whole form on submit; a rule that spans fields goes in the schema
  (`refine`), with the path of the field that shows it.
- MUST show the error of each field under it, and the server's errors on the
  fields they name (`details` of the API error).
- The client schema helps the user; the server validates again. A rule MUST
  NOT exist only on the client.
- MUST map the API response to form values in a mapper of the feature
  (`map<Entity>ToFormValues`) when a form edits an existing record: dates to
  `YYYY-MM-DD`, ids to the type the field expects, nested values flattened.
- MUST mark a field whose value is encrypted at rest with the standard
  notice under it.
- SHOULD lay out a long form in sections with headings, one column on small
  screens and a grid from `sm` up, with its actions at the end, aligned
  right.

## Styling

- MUST style with the design system's own mechanism and tokens (colors,
  spacing, radius, typography from the theme): Tailwind classes with
  `shadcn` or `tailwind`, `stylex.create` passed through `xstyle` with
  `astryx`. MUST NOT hard-code a color, a font size or a spacing value, nor
  write inline `style` for them, nor mix another stack's mechanism in.
- MUST build mobile first: the base classes are for the smallest screen and
  breakpoints add from there. Touch targets are at least 44 px high.
- MUST support light and dark themes through the theme's tokens; a new
  color is added to both. A theme is changed in one place (the theme's CSS
  variables, or the Astryx theme package), never per component.
- MUST put an icon on every action button, before its label; on a table row
  or card, an icon-only button with a tooltip and an accessible name.

## Accessibility

- MUST use the semantic element for the job: `button` for actions, `a` for
  navigation, `label` tied to its input, headings in order, lists as lists,
  tables for tabular data.
- MUST give every control an accessible name: its visible label, or
  `aria-label` when it has only an icon. A decorative icon has
  `aria-hidden`.
- MUST reach and operate everything with the keyboard, with a visible focus;
  a dialog traps focus while open and returns it on close.
- MUST give every image meaningful `alt` text, or `alt=""` when decorative.
- MUST NOT convey meaning by color alone, and keep text contrast at WCAG AA
  (4.5:1, 3:1 for large text).
- MUST mark a loading region with `aria-busy` and announce a result that
  appears without navigation (`aria-live="polite"`, or the toast library's).

Checked: an automated accessibility check in component or end-to-end tests
(axe); review question.

## User-facing text

- MUST take every text the user sees from the message files of the
  internationalization library, by key. MUST NOT hard-code user-facing text
  in a component, a schema or a service.
- MUST support Spanish (`es`, the default), English (`en`) and Brazilian
  Portuguese (`pt-BR`), with one message file per locale
  (`messages/es.json`, `messages/en.json`, `messages/pt-BR.json`). A user
  without a saved preference sees Spanish.
- MUST keep the same keys in every locale file; a missing key fails the
  build or a test.
- MUST format dates, times, numbers and money with the locale's formatter
  (`Intl`, the i18n library), never by concatenation.
- MUST show a date without time (`YYYY-MM-DD`) as that calendar date,
  without converting it through a time zone, and a wall-clock time (an
  appointment at 10:00) in the product's time zone, not the browser's.
- MUST write messages for the user, not the developer: what happened and
  what to do, without codes, ids or stack traces.

## Testing

On top of base-standards, Testing:

- MUST test a component through what the user sees and does (roles, labels,
  text) with Testing Library, not through its internals or snapshots.
- MUST unit-test form schemas, mappers and hooks with logic.
- MUST cover the main flow of each feature with a Playwright end-to-end
  test, selecting elements by role or label (`getByRole`, `getByLabel`),
  and by `data-testid` only when neither exists.
- MUST mock the network at the API client or with a request mock (MSW), not
  by mocking the component's internals.

## Review checklist

- Does the code live in its feature, using shared wrappers instead of
  rebuilding base components?
- Is state local unless shared, and is shareable state in the URL?
- Does data come through the feature's service on the shared client and
  SWR, with the affected keys revalidated after a write?
- Are loading, error, empty and data states handled, and is every write
  confirmed?
- Does the form use the form wrapper, a tested schema with translated
  messages, and show server errors on their fields?
- Are styles from the design system's tokens and mechanism, mobile first,
  in both themes, without mixing more than one design system?
- Is every control reachable by keyboard with an accessible name?
- Is every user-facing text from the message files, in `es`, `en` and
  `pt-BR`, with dates and numbers formatted by the locale?
- Do tests use roles and labels, and does the main flow have an end-to-end
  test?
