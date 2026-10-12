<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Portal project rules

Current scope: public portal, verified content, email/password accounts and separate student/teacher dashboards. Auth runs on Node 24.7+ and PostgreSQL. Static/offline builds use explicitly labelled previews with no accounts. Never simulate authorization with localStorage or client role flags. Requested roles require verified email and operator-reviewed affiliation; every private API checks session and object scope. Only publish professional staff information already disclosed in official sources; never expose private personal data, tokens or correct test answers. Active registration groups come from PostgreSQL. Keep source URLs and verification dates with imported content. Do not turn weekly patterns into dated lessons without a confirmed academic calendar. Never migrate or disable existing university sites without explicit authorization. Run lint, typecheck, tests and build; run test:accounts on a loopback test database after auth changes. See docs/ACCOUNTS.md and docs/ARCHITECTURE.md.
