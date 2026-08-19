# CLAUDE.md

forgecmms is one full-stack TypeScript app: React 19 and TanStack Start on Node,
PostgreSQL through Drizzle. Phones get the same app as an installable PWA.

## Commands

```bash
pnpm dev              # dev server on localhost:3000
pnpm build            # client, SSR, worker bundle, service worker
pnpm start            # serve the build on Node, reads PORT
pnpm worker           # pg-boss consumer
pnpm test             # vitest against the real database
pnpm check            # biome
pnpm db:generate      # drizzle-kit generate
pnpm db:migrate       # apply migrations
pnpm db:seed          # truncate every table, write the dev data set
```

`pnpm db:seed` gives `owner@forgecmms.com` / `forge1234`. `pnpm test` needs that data
set: two organizations owned by the same user, one user outside every organization,
and work orders planned for today.

## Stack and layout

- `src/routes/` file-based routes, `src/lib/queries/` query options and mutation
  hooks, `src/components/shared/form-fields/` the shared TanStack Form fields
- Two surfaces: `/org/$orgId` is the backoffice with the sidebar, `/app/$orgId` is the
  technician PWA with `FieldLayout` and the components in `src/components/field/`.
  A member without `backoffice` access lands on `/app`, and `/org/$orgId` sends them
  back there
- `src/server/domains/<domain>/`: `schema.ts` (zod), `repository.ts` (Drizzle),
  `service.ts`, `fn.ts`. The client imports `fn.ts` directly, `createServerFn` leaves
  only the RPC stub in the browser bundle
- Drizzle with `casing: "snake_case"`. Coordinates are plain `double precision`
  columns
- pg-boss jobs in `src/server/jobs/`, S3 storage against MinIO through the plain S3 API
- Tailwind 4, Base UI, shadcn, Phosphor, Recharts, Sonner. MapLibre loaded lazily
  from `src/lib/map.ts`. Paraglide for `en-US`, `es` and `pt-BR`

## Rules

- Never add comments to the code. Code must be self-explanatory
- URL, query and body params are `snake_case`. Local variables are `camelCase`
- Read `.claude/skills` first: no-useEffect (lint-banned), typescript-advanced-types,
  zod

## Multi-tenancy

- Every table carries `organization_id`, and every query filters on it plus
  `deleted_at IS NULL`
- Org-scoped server functions take `organization_id` and chain `orgMiddleware`, which
  resolves `context.tenant`: `organizationId`, `userId`, `hasBackoffice`, `hasField`,
  `isOwner`, `timezone`. Any live membership grants access
- Services pass `tenant.organizationId` to the repository. Never read a row first to
  check which organization owns it
- Update and delete throw `notFound()` when no row comes back. Delete is a soft
  delete, except tags and attachments

## Types and errors

- Types come from the zod schemas. `z.input` aliases (`...Payload`) describe what a
  caller sends, `z.infer` (`...Response`) what a handler returns
- `AppError` in `src/server/errors.ts`. The code is the message, so it survives the
  wire. Match with `isAppError(error, "conflict")`

## Queries and mutations

Query keys come from the factory in `src/lib/queries/keys.ts`, never inline arrays.
`entityKeys("parts")` gives:

```ts
all(orgId)            // ["organization", orgId, "parts"]
lists(orgId)          // ["organization", orgId, "parts", "list"]
list(orgId, params)   // ["organization", orgId, "parts", "list", params]
infinite(orgId, p)    // ["organization", orgId, "parts", "list", "infinite", p]
detail(orgId, id)     // ["organization", orgId, "parts", "detail", id]
```

`lists()` shares its prefix with `infinite()` and never matches `detail()`.

- **Create and delete**: invalidate `keys.lists(orgId)` only
- **Update**: the server function returns the hydrated entity, so seed the detail
  cache with `setQueryData(keys.detail(orgId, id), data)` and invalidate the lists.
  No `predicate`, or the `Get` runs twice
- **Cross-domain**: when a mutation changes another domain, invalidate that domain
  with `keys.all(orgId)`, as `work-orders.ts` does with `partsKeys`
- `assets` and `parts` use the factory. Migrate the other domains when you touch them
- **Partial updates**: in edit mode send only `modifiedFields` from `useAutoSave`
  through `buildPartialUpdateRequest`, so a concurrent edit is not overwritten

## List filters

Filters are URL search params, not component state, so they survive a refresh and are
shareable. Read them with `Route.useSearch()` and pass them to the query options.
Update with `navigate({ search: (prev) => ({ ...prev, key: value }) })`, and use
`undefined` to drop one. Filtering is server side: add the param to the search schema
and the WHERE clause to both the list query and the count query.

## Detail panels

The panel fetches by id, and the `Get` embeds its related entities, so one query
fills the whole panel. The parent route passes the id:

```tsx
<DetailPanel key={selectedId} entityId={selectedId} orgId={orgId} />
```

Layout is a sticky header, a tab bar and the content area. Avatar and tags live in
the header and mutate directly, not through the form. The form takes `activeTab` and
renders that section only, so its state survives a tab switch. Create mode keeps the
stacked layout with `PanelDetailSection`, and there the image and tags fields belong
to the form. Merge embedded relations with search results through `mergeById`.

## i18n

Messages live in `messages/{locale}.json`, keys are `{module}_{element}`, for example
`parts_title`. Import with `import * as m from "@/paraglide/messages"` and call
`m.key()` or `m.key({ param })`. For dates use `formatDate()` from
`src/utils/format-date.ts`, which already reads the locale and the profile timezone.

## Build

- `vite build` writes a fetch handler to `dist/server/server.js`, not a listener.
  `server.ts` is the Node entry that runs the migrations and serves `dist/client`
- `src/server/db/migrate.ts` must stay free of development-only imports: the runtime
  image installs production dependencies only. `scripts/migrate.ts` is the
  development wrapper that loads dotenv
- `VITE_*` keys are baked into the client bundle at build time. A key that only
  exists in the runtime environment reaches the browser empty
- The service worker comes from `scripts/build-sw.ts` and `src/sw.ts`, never from
  `vite-plugin-pwa`, which keeps the SSR config and silently generates nothing. Every
  navigation stays `NetworkOnly`, because a cached SSR document is a cross-tenant leak
