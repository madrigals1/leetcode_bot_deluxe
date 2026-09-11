# AGENTS.md

Guide for AI agents working in this repository.

## Project overview

A Telegram bot (built on [grammy](https://grammy.dev)) that tracks LeetCode
statistics for users in Telegram groups/channels. It talks to two external
services:

- **LeetCode Bot Backend** (`BACKEND_URL`) — Django REST API serving user/channel
  data and JWT auth.
- **VizAPI** (`VIZAPI_URL`) — renders charts (table, compare, pie, bar) as images.

Stats rendered to chat: leaderboards, profiles, language stats, submission
tables, solved-problems pie charts, and user comparisons.

## Commands

- `npm run start` — dev mode, watch mode, env from `.env.local`
- `npm run start:prod` — production mode, env from `.env`
- `npm run debug` — `tsx --inspect-brk`
- `npm run lint` — ESLint (flat config, `eslint.config.mjs`)

> `npm test` is **broken** — `package.json` has `"test": "npm test"` (self
> recursive). There are no tests in the repo.

## Language & tooling

- TypeScript, `strict` mode, CommonJS, ESNext target, `experimentalDecorators: true`.
- Path alias `@/*` → `src/*`.
- ESLint flat config with `typescript-eslint` + `@stylistic/eslint-plugin`.
  Formatting is enforced by ESLint (2-space indent, `curly: all`, `max-len: 100`);
  there is no Prettier.
- Run `npm run lint` after making changes.

## Architecture

Two decorator-driven, registry-based frameworks plus a pagination subsystem:

```
@command({ name, args?, requiresAdmin?, requiresSuperAdmin? })   // src/command/decorator.ts
  └─ CommandRegistry.addCommand(...)                              // collected at class-load
  └─ registerAllCommands() → bot.command(name, handler)
       handler: new LbContext(ctx) → auth check → parseArgs
                → original handler (lbCtx, parsedArgs) → dispatchResponse(...)

@callback({ action: string | RegExp })                            // src/callback/decorator.ts
  └─ CallbackRegistry.addCallback(...)
  └─ registerAllCallbacks() → bot.callbackQuery(action, handler)

PaginationRegistry                                                    // src/command/response/pagination/
  └─ single callback handler for /^(\w+)_page:(\d+)$/, edits the tapped message
```

Boot wiring is in `src/index.ts` (`registerAll*` calls). `src/callback/callbacks`
is side-effect imported to force decorator registration.

### The "button = mini command" pattern

Inline buttons embed `callback_data: "command:<cmd> <args>"`. The `command:`
callback (`src/callback/callbacks.ts`) returns a `CommandRedirectResponse`,
and `dispatchCallbackResponse` re-parses args and runs `cmd.originalFn`
**directly** — reusing command bodies from button taps, but **bypassing the
command decorator's auth wrapper** (see Known issues).

### Response model

Command handlers return a discriminated `CommandResponse` union
(`src/command/types.ts`): `text`, `photo`, `editText`, `paginatedText`,
`paginatedButtons`. Callback handlers return `editText`, `editPhoto`, or
`commandRedirect`. Factories live in `src/command/response/shortcuts.ts`
(`text`, `successText`, `errorText`, `buttons`, `photo`, `paginatedText`, ...).

`LbContext` (`src/utils/context.ts`) wraps grammy's `Context` and guarantees
`chatId`, `telegramUsername`, `match` (throws typed errors if missing).

### Errors

All domain errors extend `LeetCodeBotError` in `src/errors/index.ts`, and carry
HTML + emoji presentational strings (rendered via the global HTML parse-mode
middleware in `src/index.ts`). `src/errors/catchers.ts` maps backend error
sentinel codes (e.g. `USER_NOT_FOUND_IN_LEETCODE`) into domain errors.

## Key files

| Path | Purpose |
|------|---------|
| `src/index.ts` | Bootstrap: health checks, metrics server, bot wiring |
| `src/command/commands.ts` | All `/` commands (decorated static methods) |
| `src/callback/callbacks.ts` | The single `command:` callback | 
| `src/services/backend/*` | Backend REST clients per resource |
| `src/services/backend/api_service.ts` | Central JWT-authed HTTP client |
| `src/services/vizapi/api.ts` | VizAPI image-generation client |
| `src/constants.ts` | Env var loading (required vs optional) |
| `src/metrics.ts` | Prometheus metrics HTTP server (`prom-client`) |

## Conventions

- Commands list emoji-prefixed descriptions; UX markers `❗` error, `✅` success, `⚠️` warning.
- All output is HTML (forced globally); use `<b>`, `<code>`, `<i>`.
- First pagination page is a new message; later pages edit that message.
- Page nav data format: `<name>_page:<n>`.
- Extra keyboards appended after nav rows (e.g. rating ↔ rating_cml toggle).
- `parseArgs` lowercases all arguments; missing optionals default to `""`.
- New decorator-based commands/callbacks are auto-collected via class `static`
  methods — no need to touch `registerAll*`.

## Known issues / opportunities

Prioritized list of what could be done next (verified against the code):

1. **Security — auth bypass on `command:` redirects (HIGH).**
   `src/callback/response/dispatch.ts:48` calls `cmd.originalFn` directly,
   skipping the superadmin/admin checks in `src/command/decorator.ts:24-36`.
   Any chat member can click `/remove` picker buttons or the `/superadmin`
   dashboard buttons and run protected commands or delete users. Fix: replicate
   the `requiresAdmin`/`requiresSuperAdmin` checks in `dispatchCallbackResponse`
   (or store required role on the button/callback data).
2. **`/commands` & `/botfather` leak admin commands.** The help output only
   filters `requiresSuperAdmin` (`src/command/commands.ts:41,54`); `/remove`
   and `/chatid` are shown to (and listed for) users who can't run them.
3. **Global pagination state.** `PaginationRegistry.handlers` is a single
   name-keyed map; concurrent `/compare` stage-2 flows in different chats can
   cross-contaminate (closures capture the first user's arg).
4. **ApiService JWT refresh has no single-flight lock and no fetch timeouts.**
   `src/services/backend/api_service.ts:12-43` — concurrent stale-token requests
   each hit `/api/token/refresh/`; a hung backend hangs handlers forever.
   Same missing-timeout issue in `src/services/vizapi/api.ts`.
5. **Duplicate HTTP clients.** `api_service.ts` and `vizapi/api.ts` are ~80%
   identical; extract a shared `httpJson` helper (timeout + error mapping args).
6. **Thin/zero Prometheus metrics.** `src/metrics.ts` only exposes default Node
   metrics; add custom counters (backend/vizapi request counts, error rates,
   command usage).
7. **Broken `test` script** (`"test": "npm test"` → infinite recursion) and no
   tests at all. Add a real framework (e.g. `node:test` or vitest) and tests for
   `parseArgs`, pagination, dispatchers, error catchers.
8. **Dead code.** Unused service classes: `AuthService`, `SubscriptionsService`,
   `ContestsService`, `ContestNotificationsService` (scaffolding for a planned
   contest-notifications feature); several unused methods on `ChannelService`
   and `UserService`; `generateBar` in VizAPI; `CommandRegistry.registerCommand`,
   `CallbackRegistry.registerCallback`, `CallbackRegistry.findByAction`.
9. **`PaginationHandlerData.reply` stored but never read** (`src/command/types.ts`)
   and the `registerPaginationCallback` flow stores the extra keyboard captured
   at first render — page navigation re-uses only the header/items, so the
   "refresh" extra buttons persist but that's fine; the dead `reply` field can
   be removed.
10. **Fetch errors are lossy.** Backend refresh failure throws a bare `Error`;
    VizAPI discards the response body (`src/services/vizapi/api.ts:107`).
    Backend error contract depends on an `error` JSON field — a Django
    `{"detail": ...}` payload would defeat `errors/catchers.ts`.
11. **Fragile error-code mapping.** Catchers match sentinel substrings
    (`err.message.includes("...")`); two distinct codes
    (`USER_NOT_FOUND_IN_DATABASE` vs `USER_NOT_FOUND_IN_CHANNEL`) collapse to
    one user-facing message. Prefer typed error codes from the API client.
12. **Docker polish** (`deployment/Dockerfile`): runs `tsx` on uncompiled TS in
    prod, ships all devDeps, no multi-stage build, no HEALTHCHECK/EXPOSE, runs
    as root; `.gitignore` misses `dist/`; entrypoint echoes "Running with .env
    file" but `.env` isn't in the image.
13. **Minor nits:** `import { LbContext }` should be `import type` in
    `src/command/types.ts`; `humanizeTimestamp` doesn't guard invalid dates;
    pagination page numbers aren't validated (`_page:0` / negative → negative
    item indices); response dispatchers have no exhaustive `default` branch.