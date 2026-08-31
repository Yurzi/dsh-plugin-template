# Harness Contract

## Source of truth

Extracted from DeepSeek Harness commit `3f1b46a5db011ca1d167f2231c9444dd1d51a66a` and source package line `0.1.2-alpha.2` (Vendor line 4.0.2: Cordis 4.0.2, Schemastery 3.18.2, Cosmokit 1.8.3).

Representative sources:

- `packages/fs/tool-fs/src/index.ts`: named Cordis exports, Schemastery config, required and conditional injection.
- `packages/core/tools/src/schema.ts`: tool definitions and execution contracts.
- `packages/client/tsdown.client.ts`: ModuleLoader output, external purity, CSS Modules, and build faces.
- `packages/client/ui-settings-plugins/package.json`: `dsh.client`, exports, peers, and files.
- `packages/client/ui-settings-plugins/src/client/index.ts`: browser surface ownership and `settings.plugin.item` slot dispatch.
- `packages/settings/settings/src/index.ts`: settings provider, `installSection` lifecycle, and namespace verification.
- `packages/session/session-projection/src/index.ts`: mandatory session projection seam and `ignorable` event markers for external plugins.
- `packages/typert/protocol/src/index.ts`: unified `RemoteError` failure vocabulary.

## Portable contract retained here

One package exposes a Node host half and optional browser half. `dsh.bundle.patch` publishes composition defaults; `dsh.client` declares browser dependencies. Client output calls `window.__ModuleLoader__.load` and resolves shared identity through injected `require`. TypeScript uses strict NodeNext semantics, relative runtime imports end in `.js`, declarations live under `lib/types`, and published files are explicit.

Key architectural boundaries:

1. **Host & Tool Registration**:
   - Host plugins export `name`, `inject`, `Config`, and `apply`.
   - Tool schemas use `defineTool` with explicit `parameters`, `output` (`additionalProperties: false`), and text renderers.
2. **Settings Integration**:
   - Host attaches user settings through `ctx.inject(['settings'], (settingsCtx) => { settingsCtx.settings.installSection(ctx, name, Config, config, hooks) })`.
   - Client card registers into the keyed slot `settings.plugin.item` matching the settings namespace. The DSH Web UI renders cards at the intersection of host-served namespaces and client registrations.
3. **Session Projections & Events**:
   - Session state is driven by `ctx.sessionProjections` rather than manual event log scans.
   - Custom informational events appended to sessions should specify `ignorable: true` so unequipped readers or CLI viewers reconstruct without errors.
4. **Remote RPC**:
   - High-level RPC methods use `ctx.remote` with standardized `RemoteError` code mapping (`<domain>/<reason>`).

## Deliberately not copied

The internal monorepo uses `workspace:^`, project references, generated catalogs, build faces, Typert generators, oxlint, package-invariant gates, static-linked client channels, and root release orchestration. Those are repository infrastructure, not portable plugin API. Typert generation is especially monorepo-bound today, so this basic template demonstrates a narrow optional RPC adapter and standard settings integration instead of copying generated monorepo internals.

## Upgrade checklist

- Compare DSH package versions (`engines.dsh`) and Node/pnpm engines.
- Inspect `packages/client/tsdown.client.ts` for loader, external, CSS, and build changes.
- Inspect a current tool package for `defineTool` changes.
- Inspect a current client package for slot, locale, and `dsh.client.inject` changes.
- Verify settings namespace registration matches between host `installSection` and client `settings.plugin.item`.
- Run `pnpm run check`, then verify the packed plugin in the current DSH GUI after refresh.
