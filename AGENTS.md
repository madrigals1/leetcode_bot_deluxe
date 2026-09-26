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

- `npm run start` — dev mode, watch mode (`tsx`), env from `.env.local`
- `npm run build` — compile to `dist/` via `tsconfig.build.json` and rewrite `@/*` aliases
- `npm run start:prod` — build then run `node dist/index.js`, env from `.env`
- `npm run debug` — `tsx --inspect-brk`
- `npm run lint` — Biome check-only (lint + format) over `src/` and `tests/`
- `npm run lint:fix` — Biome with safe autofixes applied
- `npm run test` — Vitest, one-off run
- `npm run test:watch` — Vitest watch mode
- `npm run test:coverage` — Vitest with v8 coverage

## Testing

- **Vitest** (`vitest.config.ts`): aliases `@/*` → `src/*`, node environment,
  honours `experimentalDecorators` via esbuild. Globals are disabled — import
  `describe`/`it`/`expect`/`vi` from `vitest` explicitly.
- Unit tests are **colocated** as `*.test.ts` next to the code; `tsconfig.build.json`
  excludes them from the `tsgo` build so `dist/` stays clean. Integration-style
  tests live in `tests/` with reusable fakes in `tests/helpers/`
  (`makeFakeBot`, `makeFakeContext`) and payloads in `tests/fixtures/`.
- Tests are typechecked **separately** via `tsconfig.test.json` (self-contained
  strict project: `paths` for `@/*`, `types: ["node"]`, `noEmit`) —
  `npx tsc --noEmit -p tsconfig.test.json`. Do not have it `extends`
  `tsconfig.build.json`, whose `exclude` silently drops test files from the project.
- Root `tsconfig.json` is a **solution config** (`files: []` + `references` to
  `tsconfig.build.json` and `tsconfig.test.json`). It must stay that way: the
  editor's TS server only auto-discovers configs literally named `tsconfig.json`
  while walking up from the open file, and it has no notion of
  `tsconfig.test.json`. Without the root `references`, every `*.test.ts` lands in
  an *inferred* project with no `paths` mapping, and `@/…`/`process` fail to
  resolve in VS Code even though `tsc -p tsconfig.test.json` passes.
- `tsconfig.test.json` sets `composite: true` (with `tsBuildInfoFile` under
  `node_modules/.cache/`) so `tsc -b` accepts it as a referenced project, which
  requires its program to be closed over its imports — hence `include: ["src",
  "tests"]` rather than just the test globs.
- Modules that import `@/metrics` (counters) are `vi.mock`ed per test file to
  assert increments deterministically (prom-client `get()` is opaque in v15).

## Language & tooling

- TypeScript, `strict` mode, CommonJS, ESNext target, `experimentalDecorators: true`.
- Path alias `@/*` → `src/*`.
- Production build: `tsgo` (the native Go TypeScript compiler,
  `@typescript/native-preview`, drop-in for `tsc`) emits to `dist/`, then
  `tsc-alias` rewrites `@/*` requires to relative paths so `node dist/index.js`
  runs with no runtime alias shim. Dev still uses `tsx` (it resolves aliases natively).
- **Biome** (`biome.json`) is the only linter/formatter — it replaced ESLint
  (flat config), `typescript-eslint`, `@eslint/js`, `@stylistic/eslint-plugin` and
  Prettier, taking devDependencies from 15 to 8. Formatting is 2-space indent,
  `lineWidth: 80`, matching the old `max-len: 80`.
- One recommended rule is off, deliberately:
  - `complexity/noStaticOnlyClass` — this codebase is *built* on static-only
    classes (`CommandRegistry`, `CallbackRegistry`, every service class). The rule
    flags 13 of them and directly opposes the architecture. Keep it off.
- `style/noNonNullAssertion` is on and enforced. Do not reintroduce `!`; use the
  `must` / `mustGet` / `mustFind` helpers in `tests/helpers/mustGet.ts` in tests,
  and narrow explicitly in library code (see `CommandRegistry.requireBot`).
- `assist.actions.source.organizeImports` is off: it alphabetises named import
  specifiers (`{ BACKEND_URL, BACKEND_JWT_REFRESH_TOKEN }` gets re-sorted), which
  is churn without catching bugs. Flip it on if you want whole-statement sorting.
- Biome's `noMisleadingCharacterClass` is a **false positive** here, suppressed in
  `src/utils/format.ts` with a rationale: the invisible `\uFE0F`/`\u200D` code points
  in the emoji-stripping regex are intentional.
- `max-len` no longer exists as a lint rule. `lineWidth` is a soft guideline and
  Biome cannot break long string/template literals, so such lines are allowed.
- Run `npm run lint` after making changes; `npm run lint:fix` to autofix.

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
**directly** — reusing command bodies from button taps. Auth is enforced:
`dispatchCallbackResponse` calls `assertAuth(ctx, cmd)` (the same check the
`@command` decorator runs) before executing the redirected command.

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

Prioritized backlog (verified against the code). Old items now **done**: auth
bypass on `command:` redirects (`assertAuth` added in `dispatchCallbackResponse`),
100% test coverage, `humanizeTimestamp` guards, pagination page-number
validation, pagination flows scoped per chat (`<chatId>:<name>` handlers),
`isSuperAdmin` matching case-insensitively (`src/utils/chat.ts`), structured
backend errors (`BackendApiError` with `code`/`status`, catchers match codes not
substrings, Django `{detail: ...}` payloads preserved), HTML escaping of
user/backend-sourced strings (`escapeHtml` in `src/utils/format.ts`, applied in
`boldUsername` and every direct `<b>` interpolation in `commands.ts`), VizAPI
HTTP errors as `VizApiError` (`src/errors/index.ts`, carries `status`),
`langstats` empty guard (throws `DataNotFoundError` like `submissions`),
`CommandRegistry.bot!`/`CallbackRegistry.bot!` (the `@RequireBot` decorator is
gone — each registry narrows via a private `requireBot()` and passes the bot
down, so the type system can see the guard), and the
`import { LbContext }` → `import type` nit in `command/types.ts`. Work
through the remaining items one at a time:

1. **`parseArgs` lowercases every arg** (`src/command/utils.ts:32`), including
   usernames sent to the backend. Verify the backend treats `Username` and
   `username` the same; otherwise `/track Alice` then `/remove Alice` won't match.
2. **HTML parse-mode middleware mutates every API payload** (`src/index.ts:30`)
   — including methods that don't accept `parse_mode` (`answerCallbackQuery`,
   `getChatMember`, `deleteMessage`); relies on Telegram ignoring unknown params
   and throws if a payload is frozen. Scope to parse_mode-capable methods.
3. **Callback error path double-handling.** `callback/decorator.ts:22` and
   `callback/registry.ts:46` both catch and call `ctx.editMessageText` — which
   itself fails on stale/media messages. Route the final fallback through
   `answerCallbackQuery` instead.
4. **Duplicate paginated pickers.** `remove`, `profile`, `avatar`, `langstats`,
   `submissions`, `problems`, `compare` repeat the same `paginatedButtons`
   boilerplate in `commands.ts`. Extract a `userPicker(name, text, argTransform)`.
5. **Dead code & nits.** Remove `reply` from `PaginationHandlerData` (stored,
   never read — `command/types.ts:117`); delete unused `AuthService`
   (`auth_service.ts`, exported but never called); add exhaustive `default`
   branches to both response dispatchers.
6. **`/commands` & `/botfather` leak admin commands.** Help filters only
   `requiresSuperAdmin` (`commands.ts:41,54`); `/remove` and `/chatid` are
   listed for users who can't run them. Filter `requiresAdmin` too.