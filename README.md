# emotia-ruth-arias

Next.js app for the Emotia site of Ruth Arias. Pages are indexable.

## Routes

- `/` home
- `/test` free reflection quiz
- `/aula` class review page

`/index.html`, `/test.html` and `/aula.html` redirect to those routes. External links from the design are unchanged.

## Scripts

```bash
pnpm install
pnpm dev
pnpm test
pnpm lint
pnpm typecheck
pnpm build
pnpm test:e2e
```

## Environment

Copy `.env.example` to `.env.local` and replace the fake values in the host, not in git.

| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | Resend API key. Server only. |
| `RESEND_FROM` | Verified sender address. |
| `RESEND_TO` | Inbox that receives the signup notice. |

The public pages render without these variables. The newsletter action refuses to send when any of them is missing.

## Logs

Application logs go to stdout and stderr as one JSON object per line, with `time` (ISO 8601), `level` and `msg`. The host collects them. They do not include email addresses or message bodies.

## Deviations

- User-facing copy is Spanish only. English and Brazilian Portuguese message files are not part of this project.
- One theme, the designer's. There is no dark theme.
