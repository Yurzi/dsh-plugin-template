# dsh-plugin-template

A production-oriented template for third-party [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugins. It mirrors current internal plugin contracts (DSH `0.1.5-rc.2` baseline) while remaining installable outside the DSH monorepo.

## 版本支持策略 (Version Support Policy)

> **声明：本插件模板仅支持 DeepSeek Harness 的 Release Candidate (RC) 及正式版本（`engines.dsh >= 0.1.5-rc.2`），明确不对 Alpha 版本的快速变动做兼容与维护。**

- **为何不维护 Alpha 版本**：DeepSeek Harness 在 Alpha 周期（如 `0.1.3-alpha.1` ～ `0.1.5-alpha.2`）进行密集而频繁的底层架构演进（如 Session 格式升级至 V3、`ctx.agent` 动态解耦移除、`agentLoop.create` 异步化、Rightbar dockkit 重构、会话锁机制等），内部契约变动剧烈且不保证向后兼容。
- **RC 版本的基准稳定性**：进入 `0.1.5-rc.2` 后，公开插件契约、Cordis `4.0.2` 运行时、Schemastery `3.18.2`、设置中心槽位、Web 模块加载规范（含 dockkit）、产物交付体系与反馈契约已趋于稳定收敛，适合作为第三方生产插件的长期依赖基准。

## Included

- Named Cordis exports: `name`, `inject`, `Config`, and `apply`.
- One strict model tool with an explicit output schema and text renderer.
- Host-to-client user settings integration via `ctx.settings.installSection` and keyed `settings.plugin.item` slot.
- Browser settings surface plus a browser-safe shared contract. Custom Typert RPC is intentionally excluded until an external generator preset is published.
- Host ESM plus DSH ModuleLoader client bundle from one package.
- NodeNext declarations under `lib/types`, exact npm `files`, CI, tests, and packed-artifact verification.
- A deterministic scaffold command that excludes build and VCS state.

## Start

```bash
pnpm install
pnpm run check
pnpm scaffold ../my-dsh-plugin @your-scope/my-dsh-plugin
```

After scaffolding, update `description`, repository metadata, Cordis config, tool names, and domain behavior. To make a host-only plugin, remove `src/client`, the `./client` export, `dsh.client`, and the client tsdown config together.

Do not edit DeepSeek Harness source for ordinary third-party installation. See [the harness contract](docs/harness-contract.md) and [the comparison](docs/template-comparison.md).

## Development contract

1. Required Cordis services belong in `inject`; conditional capabilities use `ctx.inject`.
2. Do not access dynamic `ctx.agent` or `agentCtx.agent` (removed in 0.1.5); pass `agent` explicitly or call `ctx.agents.currentInitiator()`.
3. Register resources through `ctx` and return or attach lifecycle disposers.
4. Attach user-configurable settings through `ctx.settings.installSection` (supplying mandatory `onChange`) so the Web settings tab displays the card.
5. Client dependencies must be DSH browser module-table entries or bundled; never use Node APIs in `src/client`.
6. Every object in a model-facing JSON schema sets `additionalProperties: false`.
7. Mark custom third-party session events with `ignorable: true` so unequipped readers reconstruct without error.
8. Keep `dsh.client.inject`, client `inject`, imports, and slot ownership aligned.
9. Treat `cordis.patch.yml` values as first-boot composition defaults.
