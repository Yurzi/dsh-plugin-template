# dsh-plugin-template

A production-oriented template for third-party [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugins, verified against **DSH 0.2.0-rc.2** outside the upstream monorepo.

## 版本支持策略 (Version Support Policy)

- 当前验证基线：DSH `0.2.0-rc.2`，上游 tag `dsh-v0.2.0-rc.2`，commit `639ed015397290b3745d163aafe02ffee4aa3f84`。
- `engines.dsh` 与所有 `@deepseek-ai/dsh-*` peers 统一声明 `>=0.2.0-rc.2 <0.3.0-0`。rc.2 是本次核验的最低基线，不声明支持 rc.1、0.1.x 或 0.3.x；范围内未来版本仍需重新验证，不代表兼容承诺。
- 开发用 DSH 包精确固定到 `0.2.0-rc.2`；上游 Cordis `4.0.4`、Schemastery `3.18.4` 未变。升级时同步更新锁文件、契约和测试。

## Included

- Named Cordis exports: `name`, `inject`, `Config`, and `apply`.
- One strict model tool with an explicit output schema and text renderer.
- Profile-owned live configuration: `prefix` uses `.volatile()` and is read with `config.prefix.get()` on each invocation.
- A typed, localized third-party `plugins.bundle.config` information panel. The Host generates the row configuration editor from the schema; the template does not replace it.
- Host ESM, a browser-safe shared contract, and a DSH ModuleLoader client bundle. Custom Typert RPC is deliberately not implemented.
- NodeNext declarations under `lib/types`, explicit npm files, CI, contract tests, packed-artifact verification, and deterministic scaffolding.

## Start

```bash
pnpm install
pnpm run check
pnpm scaffold ../my-dsh-plugin @your-scope/my-dsh-plugin
```

After scaffolding, update description, repository metadata, Cordis config, tool names, and domain behavior. To make a host-only plugin, remove `src/client`, the `./client` export, `dsh.client`, and the client tsdown config together.

Do not edit DeepSeek Harness source for ordinary third-party installation. See [the harness contract](docs/harness-contract.md) and [the rc.2 upgrade notes](docs/upgrade-0.2.0-rc.2.md) (the [0.1.7 migration](docs/upgrade-0.1.7-rc.1.md) is historical).

The published `./client` declarations reference DSH client packages. They are declared as optional peers so host-only consumers need not install them; TypeScript consumers of `./client` must provide the listed client peers at the target version. This repository installs them as dev dependencies.

## Development contract

1. Required Cordis services belong in `inject`; conditional capabilities use `ctx.inject`.
2. Pass agents explicitly; do not use removed dynamic `ctx.agent` access.
3. Register resources through `ctx` and retain lifecycle disposers.
4. Declare editable fields in `Config` with `.volatile()`. Do not call removed `settings.installSection` APIs or copy a volatile snapshot at plugin startup.
5. Client type-only imports pull in actual Context, SlotMap, and locale declarations. Never replace them with permissive handwritten interfaces.
6. Third-party bundle configuration uses `plugins.bundle.config` keyed by npm package name. Custom row configuration uses `plugins.row.config` keyed by `<package>#<patch-row-id>`. `plugins.item` is for official plugin cards.
7. Explicit nested/output objects set `additionalProperties: false`; required output fields use `required: true` in the `defineTool` DSL. The implicit parameter root is compiled by DSH.
8. Client runtime imports must be host module-table entries or bundled browser-safe code. Keep `dsh.client.inject`, services, and slot ownership aligned.
9. `cordis.patch.yml` holds composition defaults. Persisted live configuration belongs to the profile; form ids are profile entry ids, not arbitrary locale namespaces.
10. Build and test before publishing, then smoke-test the installed package in the target DSH GUI after refresh. Updating an installed plugin requires uninstall/reinstall; back up profile configuration first.

`pnpm run check` verifies types, tool/config/client tests, Host and client builds, all DSH peer version gates, and the unpacked npm artifact (Host execution, ModuleLoader factory, CSS and source map). It does not install into or restart your DSH profile. See the upgrade notes for timed-question, reminder, open-in-app and pi-ai extension risks.
