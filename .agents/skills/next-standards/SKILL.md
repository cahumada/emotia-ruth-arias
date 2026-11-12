---
name: next-standards
description: "DiWork's Next.js standards: App Router only, route conventions, default loading skeletons, and where Server vs Client Components go. Use when designing, implementing or reviewing a Next.js page, layout, route handler or server action."
license: UNLICENSED
metadata:
  owner: DiWork Soluciones
  version: "0.7.0"
  phases: [implement, review, dw-flow]
  layers: [frontend, bff]
  stacks: [next]
  extends: frontend-standards
---

# Next.js Standards

How Next.js is used in DiWork projects. Adds to frontend-standards (and, for
the BFF side of a Next app, backend-standards) the parts specific to Next's
App Router. For the detailed React/Next.js performance rules (waterfalls,
bundle size, server caching, re-renders, hydration), load the vendored
`vercel-react-best-practices` skill — this standard only states DiWork's
mandatory structural rules, it does not repeat that catalog.

## Routing

- MUST use the App Router (`src/app/`). MUST NOT add a `pages/` directory,
  nor `getServerSideProps`, `getStaticProps` or `getInitialProps`. A Pages
  Router file found in a project this standard applies to is migrated to
  the App Router in the same change that touches it, not extended.
- MUST use route groups (`(private)`, `(auth)`) to share a layout without
  adding a path segment, and dynamic segments (`[id]`, `[slug]`) typed
  through `params` in the page's own signature — never parsed by hand from
  `usePathname`.
- MUST put a segment's data fetching in the page or layout (a Server
  Component) or a Route Handler, never in a Client Component's `useEffect`.
  A Client Component that needs server data receives it as a prop from its
  Server Component parent, or reads it through SWR (frontend-standards,
  Data fetching) when it must refetch after user action.
- SHOULD use Server Actions for a form's write instead of a Route Handler
  the client calls by hand, when the mutation belongs to one page and needs
  no other HTTP caller; a mutation a non-browser client also calls (a
  webhook, a script, a mobile app) is a Route Handler under `api/`.

## Server and Client Components

- Every component is a Server Component **by default**. MUST add
  `"use client"` only to the component that actually needs state, an
  effect, a browser API (`window`, `localStorage`) or an event handler —
  and push it as far down the tree as it will go: a page stays a Server
  Component with one small Client Component island inside it, not the
  reverse.
- MUST NOT import a server-only module (the database client, a secret, a
  Node-only package) into a file that has, or is imported by a file that
  has, `"use client"`. Fetch on the server and pass the result down as
  props or serializable data.
- MUST type and validate a Server Action's input the same way an endpoint
  does (security-standards, Input handling; backend-standards, Validation):
  a Server Action is a public HTTP endpoint the framework hides the URL of,
  not a trusted in-process function call.

## Loading, error and not-found

- MUST ship a `loading.tsx` next to every `page.tsx` that reads data on the
  server (directly or through a Server Component it renders), rendering the
  skeleton frontend-standards' Feedback section describes for that page's
  layout. This is the App Router mechanism for "every page shows a skeleton
  by default": the Suspense boundary Next inserts around the segment, not a
  client-side spinner shown while `useEffect` fetches.
- MUST ship an `error.tsx` for a segment whose data fetching or Server
  Action can fail in a way the user needs to recover from (retry, go back),
  distinct from the top-level error boundary base-standards requires.
- MUST ship a `not-found.tsx` (or call `notFound()`) for a dynamic segment
  whose id can fail to resolve, instead of letting the page render with
  empty or `undefined` data.
- A segment with no data fetching of its own (a static page, a form with no
  initial data) MAY skip `loading.tsx`; it has nothing to be loading.

## Metadata and assets

- MUST export `metadata` (or `generateMetadata` for a dynamic segment)
  instead of a manual `<head>` tag; a title or description the user should
  see in a locale comes from the i18n message files (frontend-standards,
  User-facing text), not hard-coded in the metadata call.
- MUST use `next/image` for a raster image and `next/font` for a web font,
  never a raw `<img>` or a `<link>` to a font stylesheet, so Next controls
  sizing, format and preloading.

## Review checklist

- Does the project have a `pages/` directory, or a page using
  `getServerSideProps` / `getStaticProps`?
- Is `"use client"` on the smallest component that needs it, not on a page
  or layout that has no state or browser API of its own?
- Does a Client Component fetch on mount with `useEffect` where a Server
  Component or a prop from one would do?
- Does every data-fetching page have a `loading.tsx` with a skeleton that
  matches its layout?
- Does a segment that can fail to resolve have `error.tsx` or
  `not-found.tsx`?
- Does a Server Action validate its input like a public endpoint?
- Are images through `next/image` and fonts through `next/font`?
