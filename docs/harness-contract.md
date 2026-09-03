# Harness Contract

## Source of truth

Extracted from DeepSeek Harness commit `a66e4702047846cdaa10c66c9d3df3951f5ea70d` (release `0.1.2-rc.1`) / master HEAD `76fda729799fe9b3848dbe2c211d4b231032b81e` and source package line `0.1.2-rc.1` (Vendor line 4.0.2: Cordis 4.0.2, Schemastery 3.18.2, Cosmokit 1.8.3).

> **Version Support Policy**: This template exclusively supports DeepSeek Harness **RC (Release Candidate) and stable releases** (`engines.dsh >= 0.1.2-rc.1`). It intentionally does not provide maintenance for volatile, fast-moving Alpha iterations.

Representative sources:

- `packages/fs/tool-fs/src/index.ts`: named Cordis exports, Schemastery config, required and conditional injection.
- `packages/core/tools/src/schema.ts`: tool definitions and execution contracts.
- `packages/client/tsdown.client.ts`: ModuleLoader output, external purity, CSS Modules with `lightningcss`, and build faces.
- `packages/client/web/src/platform.ts`: shared browser platform module roster (`PLATFORM_MODULES`).
- `packages/client/ui-settings-plugins/package.json`: `dsh.client`, exports, peers, and files.
- `packages/client/ui-settings-plugins/src/client/index.ts`: browser surface ownership and `settings.plugin.item` slot dispatch.
- `packages/settings/settings/src/index.ts`: settings provider, `installSection` lifecycle with mandatory `onChange`, and namespace verification.
- `packages/session/session-projection/src/index.ts`: mandatory session projection seam, identity-gated change feed, and `ignorable` event markers.
- `packages/session/session-turn-outline/src/index.ts`: whole-log turn outline projection.
- `packages/typert/protocol/src/index.ts`: unified `RemoteError` failure vocabulary.

## Portable contract retained here

One package exposes a Node host half and optional browser half. `dsh.bundle.patch` publishes composition defaults; `dsh.client` declares browser dependencies. Client output calls `window.__ModuleLoader__.load` and resolves shared identity through injected `require`. TypeScript uses strict NodeNext semantics, relative runtime imports end in `.js`, declarations live under `lib/types`, and published files are explicit.

Key architectural boundaries:

1. **Host & Tool Registration**:
   - Host plugins export `name`, `inject`, `Config`, and `apply`.
   - Tool schemas use `defineTool` with explicit `parameters`, `output` (`additionalProperties: false`), and text renderers.
2. **Settings Integration**:
   - Host attaches user settings through `ctx.inject(['settings'], (settingsCtx) => { settingsCtx.settings.installSection(ctx, name, Config, config, { setSource, onChange, validate? }) })`. Note that `onChange` is mandatory.
   - Client card registers into the keyed slot `settings.plugin.item` matching the settings namespace. The DSH Web UI renders cards at the intersection of host-served namespaces and client registrations.
3. **Client UI & Design Tokens**:
   - Client bundles resolve platform modules (`react`, `react-dom`, `react-dom/client`, `@deepseek-ai/cordis`, `@deepseek-ai/dsh-client-store`, `@deepseek-ai/dsh-client-ui-slots`, `@deepseek-ai/dsh-client-ui-primitives`) as externals provided by the host runtime module loader.
   - UI styling adopts 0.1.2-rc.1 design tokens: 0.5px hairline strokes (`--dsw-alias-border-l4`), 16px superellipse rounded card containers, and standard theme color tokens (`--dsw-alias-bg-layer-3`, `--dsw-alias-label-primary`, `--dsw-alias-label-tertiary`).
   - `*.module.css` stylesheets are compiled at build time via `lightningcss` with scoped class maps and injected as `<style data-plugin="...">` tags upon client bundle execution.
4. **Session Projections & Durability**:
   - Session state is driven by `ctx.sessionProjections`. Under the identity gate, projection `wire.view` must reuse object/array references across internal-only state changes to suppress redundant wire pushes.
   - Authoritative session persistence is solely handle-based JSONL (`@deepseek-ai/dsh-session-persistence-jsonl`), strictly separating logical event sequences (`seq`) from physical log byte offsets.
   - Custom informational events appended to sessions should specify `ignorable: true` so unequipped readers or CLI viewers reconstruct without errors.
5. **Remote RPC**:
   - High-level RPC methods use `ctx.remote` with standardized `RemoteError` code mapping (`<domain>/<reason>`).

## Deliberately not copied

The internal monorepo uses `workspace:^`, project references, generated catalogs, build faces, Typert generators, oxlint, package-invariant gates, static-linked client channels, and root release orchestration. Those are repository infrastructure, not portable plugin API. Typert generation is especially monorepo-bound today, so this basic template demonstrates a narrow optional RPC adapter and standard settings integration instead of copying generated monorepo internals.

## Upgrade checklist

- Compare DSH package versions (`engines.dsh`) and Node/pnpm engines.
- Inspect `packages/client/tsdown.client.ts` for loader, external, CSS, and build changes.
- Inspect a current tool package for `defineTool` changes.
- Inspect a current client package for slot, locale, and `dsh.client.inject` changes.
- Verify settings namespace registration matches between host `installSection` and client `settings.plugin.item`, ensuring `onChange` hook is supplied.
- Run `pnpm run check`, then verify the packed plugin in the current DSH GUI after refresh.
