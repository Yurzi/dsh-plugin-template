# 升级到 DSH 0.1.7-rc.1

## 核对基线

本次依据上游 tag `dsh-v0.1.7-rc.1`，commit `46a7f68b0922371ce7144b668b90e377d8e799f4` 的源码和对应 npm 包进行适配。原模板基线为 `0.1.5-rc.2`。引用会话的评估仅用于发现线索，接口以实际源码为准。

## 模板中的实际迁移

| 范围 | 旧实现 | 新实现 |
| --- | --- | --- |
| 宿主配置 | 可选 settings 注入、installSection、setSource | Config 声明 `.volatile()`，工具每次读取 `config.prefix.get()` |
| 配置持久化 | 旧 settings 命名空间 | Profile entry 配置，由宿主按 volatile schema 生成表单 |
| 客户端槽 | `settings.plugin.item` | 第三方专用 `plugins.bundle.config`，key 为 npm 包名 |
| 前端类型 | 手写宽松 ClientContext | 上游 Context/SlotMap 类型合并、PropsRuntime、PropsLocale |
| 文案注入 | 手动 bind 并 inject t | 注册 LocaleNamespaceMap 和 `locale: NS`，renderer 提供 t |
| 生命周期 | 旧配置回调与声明 | 移除旧 settings 类型补丁，保留 locale/slot 的 Cordis 资源管理 |
| 依赖 | DSH ^0.1.5-rc.2，Cordis ^4.0.2，Schemastery ^3.18.2 | DSH 精确 0.1.7-rc.1，Cordis 4.0.4，Schemastery 3.18.4 |
| 兼容声明 | 只有 engines.dsh | 增加外部运行时包 dsh-tools peer，范围 `>=0.1.7-rc.1 <0.1.8-0` |
| 回归测试 | 模拟旧 installSection | 验证真实 schema/default、volatile 按调用读取、客户端槽与 locale、打包产物及版本门禁 |

这里没有机械替换为 `plugins.item`：上游明确该槽属于官方插件列表。模板保留简洁的 bundle 说明面板，不注册 `plugins.row.config`，因此不覆盖宿主默认的行配置编辑器。bundle 配置槽本身不接收 form；需要自定义编辑器时，应使用行配置 owner form 或 configForms 服务。

## 与初步评估相比需要注意的细节

1. `.volatile()` 不是单纯的 UI 标签：解析后的字段是实时引用，读取必须使用 `.get()`。只删除 installSection 而继续拼接 config.prefix 会导致行为错误。
2. `engines.dsh` 不能替代宿主的 peer 检查。上游 `plugin-compatibility.ts` 对 DSH peers 使用 `semver.satisfies(..., { includePrerelease: true })`。不要把 npm 默认预发布语义与宿主门禁混为一谈。显式 rc.1 下界同时避免误接纳过旧 API。
3. 老版本的 Cordis/Schemastery 不应继续作为开发基线；本次使用上游对应 vendor 版本。
4. 模板未使用旧图标、toolview、workspaceFiles、agent 生命周期、LLM Message、remote 二进制或自定义 session 持久化接口，因此没有为这些无关变更加入额外实现。锁文件中的传递运行时依赖随 tools 升级到 dsh-ptc-runtime。

## 配置迁移与扩展注意事项

- 旧环境保存过 prefix 时，请把值迁到目标 profile 中该插件 entry 的 config，或在目标插件管理页重新设置。模板不读取、迁移或删除旧全局 settings 文件。
- `cordis.patch.yml` 中 prefix 仍为普通字符串 Hello。只有经过 schema 解析、传入 apply 的值才是 volatile 引用。
- `configForms.get(entryId)` 使用实际 profile entry id；不要假设它总等于 npm 包名或 locale namespace。
- 自定义行面板使用 `<package>#<patch-row-id>`；需要处理 form 不存在、loading/unavailable、只读、写入返回 false、抛错及 revision 冲突。
- 当前范围只覆盖 0.1.7 版本线，已验证目标仅为 rc.1。未来发布或更高版本需要重新核查，不通过 allow-version 来掩盖不兼容。

## 验证方法

```bash
pnpm install --frozen-lockfile
pnpm run check
```

本次验证结果：

- `pnpm install --frozen-lockfile` 成功。
- `pnpm run check` 全部通过：类型检查、4 个 Vitest 测试、宿主/客户端构建、tarball 检查。
- 编译产物冒烟通过：实际导入宿主 bundle 调用工具；通过 ModuleLoader factory 加载客户端并核对槽注册。
- scoped 包脚手架冒烟通过：重命名后的生成项目类型检查和 4 个测试通过，且不携带 node_modules/lib/.git/旧锁文件。
- `git diff --check` 通过。

上述检查使用 Node 26.9.0 / pnpm 11.7.0；没有覆盖全部受支持的 Node 版本。环境中的 pnpm 状态目录不可用及自动下载网络问题通过临时 XDG 目录与 `NODE_USE_ENV_PROXY=1` 解决，没有把这些环境专用设置写进模板。

公开客户端类型相关包声明为 optional peers；TypeScript 消费者需要显式提供它们。说明文档也随 npm 包发布。

check 包含 TypeScript 检查、Vitest、宿主/客户端构建以及解包后的产物检查。产物检查使用 semver 7.8.5 和上游一致的 includePrerelease 选项，覆盖 rc.1/稳定版接纳与旧版/alpha/下一版本线拒绝。

真实 GUI 验收仍需要在 DSH 0.1.7-rc.1 的测试 profile 安装该包后进行：

1. 刷新页面，打开插件管理，确认 bundle 说明面板出现且无 slot crash。
2. 打开插件条目的配置，将 prefix 改为 Hi 并保存。
3. 运行 template_greet，确认新调用返回 Hi 前缀；再次修改后无需重启插件即可生效。
4. 重启宿主确认 profile 配置持久化，再停用插件确认工具与客户端资源清理。

本次不会修改正在运行的 GUI、上游 checkout 或用户 profile；本地测试与打包检查不等同于完成这四步端到端验收。
