# Harness Contract

## Source of truth

Verified against DeepSeek Harness tag **dsh-v0.1.7-rc.1**, commit `46a7f68b0922371ce7144b668b90e377d8e799f4`. Vendor versions: Cordis 4.0.4 and Schemastery 3.18.4. Development dependencies are pinned to this release; no compatibility claim is made for earlier settings APIs.

Representative upstream sources (relative to the upstream checkout):

- `packages/boot/app-boot/src/plugin-compatibility.ts`: startup/install peer compatibility evaluation.
- `vendor/schemastery/src/index.ts`, `vendor/cosmokit/src/volatile.ts`: schema wrapping and live references.
- `packages/settings/settings/src/index.ts`: active profile configuration descriptors and volatile-field projection.
- `packages/web/web-search-deepseek/src/index.ts`: reading volatile values per invocation.
- `packages/core/tools/src/schema.ts`: tool definitions.
- `packages/client/web/src/platform.ts`, `packages/client/tsdown.client.ts`: browser module table and loader bundle contract.
- `packages/client/ui-plugin-manager/src/client/slot-contract.ts`: third-party configuration surfaces.
- `packages/client/ui-settings/src/client/config-form.ts`: configForms service.
- `packages/client/ui-slots/src/index.ts`, `packages/client/locale/src/client/index.ts`: typed props, locale binding and lifecycle.

## Portable contract

One package exposes the Node host half and optional browser half. `dsh.bundle.patch` publishes composition defaults; `dsh.client.inject` declares browser plugin providers. Client output calls `window.__ModuleLoader__.load` and resolves shared identity through injected `require`. TypeScript uses strict NodeNext semantics, relative runtime imports end in `.js`, and declarations live under `lib/types`.

### Live configuration

Host plugins export `name`, `inject`, `Config`, and `apply`. The loader validates the schema before calling apply. A defaulted field marked `.volatile()` becomes a live reference, not a string. Read `config.prefix.get()` at execution time; tests that call apply directly must pass parsed Config or a matching reference.

The settings service derives editable forms from active profile entries and their volatile schemas. No `installSection`, `setSource`, or old settings namespace registration is needed. Keep the schema default aligned with `cordis.patch.yml`. Values are persisted in profile configuration, not the removed global settings document.

### Client UI

Use type-only imports for actual Context/SlotMap declarations and `PropsRuntime` / `PropsLocale` for components. Declare the locale namespace in `LocaleNamespaceMap`; `locale: NS` provides the typed `t` automatically.

This template registers a descriptive `plugins.bundle.config` panel keyed by npm package name. It does not register `plugins.row.config`, leaving the Host-generated prefix editor intact. Bundle panels receive `view: page` but no form. Row configuration panels use `<package>#<patch-row-id>` and receive optional `form`; summary views must return inline content rather than list/card wrappers.

If custom editing is needed, use the row owner form, or inject `configForms` from `@deepseek-ai/dsh-client-ui-settings`. `get<T>(entryId)` uses a real profile entry id. `set`, `unset`, and `mutate` return `Promise<boolean>`; handle false, rejected writes, unavailable/loading state and revision conflicts. The static bundle panel does not implement custom editing.

Shared platform externals remain React, React JSX runtime, react-dom, react-dom/client, Cordis, client-store, ui-slots, ui-primitives, and ui-dockkit. Other cross-plugin imports should be type-only unless the host explicitly provides their runtime module. CSS Modules are scoped and injected by the existing build adapter.

### Dependency gate

The Host checks `@deepseek-ai/dsh` and `@deepseek-ai/dsh-*` peers using semver with `includePrerelease: true`. An `engines.dsh` field alone does not establish that peer gate. The template explicitly declares its external host runtime import `@deepseek-ai/dsh-tools` as a peer. Its lower bound explicitly names rc.1; `>=0.1.7` would exclude rc.1 because it is earlier than the stable version.

## Deliberately not copied

The upstream monorepo uses workspace dependencies, generated catalogs, build faces, Typert generators, invariant gates and release orchestration. Those are repository infrastructure, not portable plugin APIs. `src/contract.ts` is only a browser-safe descriptor example; it is not an implemented RPC service.

## Upgrade checklist

- Check runtime peers, exact dev dependencies, vendor versions and the lockfile together.
- Check loader output and platform module identity against upstream.
- Verify Config reference semantics and schema-generated editing.
- Check client slot owners, locale props and lifecycle disposal with real type imports.
- Run `pnpm run check` and a frozen-lockfile install.
- Install the packed plugin in the target profile; after refreshing Web, verify bundle information, row prefix editing and a fresh tool invocation.
