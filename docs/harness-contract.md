# Harness Contract

## Source of truth

Extracted from DeepSeek Harness commit `fb2c4b9e698e30edb738bca4cf0618587db7d203` (release `0.1.5-rc.2`) and source package line `0.1.5-rc.2` (Vendor line 4.0.2: Cordis 4.0.2, Schemastery 3.18.2, Cosmokit 1.8.3).

> **Version Support Policy**: This template exclusively supports DeepSeek Harness **RC (Release Candidate) and stable releases** (`engines.dsh >= 0.1.5-rc.2`). It intentionally does not provide maintenance for volatile, fast-moving Alpha iterations.

Representative sources:

- `packages/fs/tool-fs/src/index.ts`: named Cordis exports, Schemastery config, required and conditional injection.
- `packages/core/tools/src/schema.ts`: tool definitions and execution contracts.
- `packages/client/tsdown.client.ts`: ModuleLoader output, external purity, CSS Modules with `lightningcss`, and build faces.
- `packages/client/web/src/platform.ts`: shared browser platform module roster (`PLATFORM_MODULES`, including dockkit).
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
   - Explicit Agent passing: dynamic `ctx.agent` is completely removed in 0.1.5 (`AgentRegistry` no longer registers `ctx.accessor('agent')`); setup uses `(agentCtx, agent)` or explicit service passing, and current initiator uses `ctx.agents.currentInitiator()`.
   - Tool schemas use `defineTool` with explicit `parameters`, `output` (`additionalProperties: false`), and text renderers. Tool execution context receives `{ agent, signal, callId, deferContext, concludeTurn }`.
2. **Settings Integration**:
   - Host attaches user settings through `ctx.inject(['settings'], (settingsCtx) => { settingsCtx.settings.installSection(ctx, name, Config, config, { setSource, onChange, validate? }) })`. Note that `onChange` is mandatory.
   - Client card registers into the keyed slot `settings.plugin.item` matching the settings namespace. The DSH Web UI renders cards at the intersection of host-served namespaces and client registrations.
3. **Client UI & Design Tokens**:
   - Client bundles resolve platform modules (`react`, `react/jsx-runtime`, `react-dom`, `react-dom/client`, `@deepseek-ai/cordis`, `@deepseek-ai/dsh-client-store`, `@deepseek-ai/dsh-client-ui-slots`, `@deepseek-ai/dsh-client-ui-primitives`, `@deepseek-ai/dsh-client-ui-dockkit`) as externals provided by the host runtime module loader.
   - UI styling adopts 0.1.5-rc.2 design tokens: 0.5px hairline strokes (`--dsw-alias-border-l4`), 16px superellipse rounded card containers, and standard theme color tokens (`--dsw-alias-bg-layer-3`, `--dsw-alias-label-primary`, `--dsw-alias-label-tertiary`). Rightbar docking (`dockkit`) replaced legacy Details, turn-tail layout follows the 20/16/20px contract, and `FileTypeIcon` replaces legacy `DocumentFileIcon`.
   - `*.module.css` stylesheets are compiled at build time via `lightningcss` with scoped class maps and injected as `<style data-plugin="...">` tags upon client bundle execution.
4. **Session Projections & Durability**:
   - Session state is driven by `ctx.sessionProjections`. Under the identity gate, projection `wire.view` must reuse object/array references across internal-only state changes to suppress redundant wire pushes.
   - Authoritative session persistence is handle-based JSONL (`@deepseek-ai/dsh-session-persistence-jsonl`) with format version V3 (`SESSION_FORMAT_VERSION = 3`). `agentLoop.create(...)` is asynchronous with multi-process session locking (`SessionHandle`).
   - Dynamic system prompts use in-history messaging (`systemPromptUpdate: 'in-history'`), preserving KV-cache across long sessions.
   - Custom informational events appended to sessions should specify `ignorable: true` so unequipped readers or CLI viewers reconstruct without errors. Non-ignorable events (such as `deliverables/presented`) enforce strict schema validation across host boundaries.
5. **Subprocess & Outbound Proxy**:
   - Subprocess lifecycle management uses `.terminate()` or `AbortSignal`; `SubprocessHandle.pid` is removed on standard subprocesses.
   - Outbound HTTP(S)/ALL proxy policy is installed before plugin boot (`@deepseek-ai/dsh-http-proxy`); standard host-plane `fetch` calls automatically honor environment and `$DSH_HOME/.env` proxy configuration.
6. **Remote RPC**:
   - High-level RPC methods use `ctx.remote` with standardized `RemoteError` code mapping (`<domain>/<reason>`). Scoped remote event contexts require explicit `agentId`.

## Deliberately not copied

The internal monorepo uses `workspace:^`, project references, generated catalogs, build faces, Typert generators, oxlint, package-invariant gates, static-linked client channels, and root release orchestration. Those are repository infrastructure, not portable plugin API. Typert generation is especially monorepo-bound today, so this basic template demonstrates a narrow optional RPC adapter and standard settings integration instead of copying generated monorepo internals.

## Upgrade checklist

- Compare DSH package versions (`engines.dsh`) and Node/pnpm engines (`node ^22.19.0 || >=24.0.0`).
- Inspect `packages/client/tsdown.client.ts` for loader, external, CSS, and build changes (including `PLATFORM_MODULES` additions such as `@deepseek-ai/dsh-client-ui-dockkit`).
- Verify no code accesses dynamic `ctx.agent`; use `(agentCtx, agent)` or explicit service passing.
- Inspect a current tool package for `defineTool` changes.
- Inspect a current client package for slot, locale, and `dsh.client.inject` changes.
- Verify settings namespace registration matches between host `installSection` and client `settings.plugin.item`, ensuring `onChange` hook is supplied.
- Run `pnpm run check`, then verify the packed plugin in the current DSH GUI after refresh.
