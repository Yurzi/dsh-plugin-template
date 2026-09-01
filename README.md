# dsh-plugin-template

A production-oriented template for third-party [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugins. It mirrors current internal plugin contracts (DSH `0.1.2-alpha.3` baseline) while remaining installable outside the DSH monorepo.

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
2. Register resources through `ctx` and return or attach lifecycle disposers.
3. Attach user-configurable settings through `ctx.settings.installSection` (supplying mandatory `onChange`) so the Web settings tab displays the card.
4. Client dependencies must be DSH browser module-table entries or bundled; never use Node APIs in `src/client`.
5. Every object in a model-facing JSON schema sets `additionalProperties: false`.
6. Mark custom third-party session events with `ignorable: true` so unequipped readers reconstruct without error.
7. Keep `dsh.client.inject`, client `inject`, imports, and slot ownership aligned.
8. Treat `cordis.patch.yml` values as first-boot composition defaults.
