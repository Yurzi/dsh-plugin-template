# 升级到 DSH 0.2.0-rc.2

## 核对基线与支持范围

本次从模板实际基线 `0.1.7-rc.1` 迁移到上游 tag `dsh-v0.2.0-rc.2`，commit `639ed015397290b3745d163aafe02ffee4aa3f84`。两份引用会话的 rc.1 → rc.2 评估作为风险线索；适配结论以用户指定 checkout 的实际源码、对应 npm 包及本模板验证为准。没有拉取或修改上游 checkout、安装用户 profile、重启当前 DSH。

- `engines.dsh` 和全部五个 `@deepseek-ai/dsh-*` peers：`>=0.2.0-rc.2 <0.3.0-0`。
- 五个 DSH 开发依赖精确固定到 `0.2.0-rc.2`，同步锁文件和 pnpm 的精确版本 release-age 例外；没有通配放行所有新包。
- Cordis `4.0.4`、Schemastery `3.18.4` 与上游一致，无需升级。
- rc.2 是本次已核验的最低版本。没有继续宣称支持旧模板的 0.1.x，也没有因为评估只比较 rc.1/rc.2 就宣称模板已验证 rc.1。范围内未来版本仍需重新核查。
- 上游实际门禁位于 `packages/boot/app-boot/src/plugin-compatibility.ts`，对所有 DSH peers 使用 `semver.satisfies(..., { includePrerelease: true })`。只改 `engines.dsh` 不能解除旧 peers 的拒载。显式 rc.2 下界避免稳定版下界排除目标预发布版；`<0.3.0-0` 同时挡住下一版本线的 alpha/rc。不要用 `allow-version` 掩盖真实不兼容。

## 模板实际改动

| 范围 | 处理 |
| --- | --- |
| 依赖与兼容门禁 | 更新 engines、所有 DSH peers、精确开发依赖、锁文件及精确 release-age 例外 |
| Host 工具 | 保留 `defineTool`、`inject: [tools]`、`.volatile()` 和逐次 `.get()`；输出 `greeting` 明确为必填，renderer 使用真实推断类型，不再强制断言 |
| Client UI | 保留类型合并、locale 生命周期、第三方 `plugins.bundle.config`、npm 包名 key；不覆盖 Host 的行配置表单 |
| 构建 | 保留 NodeNext、Host ESM、ModuleLoader 客户端 factory 和 CSS Modules；实际平台共享模块表未变 |
| 测试 | 验证输出 required、输入缺失/类型错误、实时配置与客户端注册 |
| 发布校验 | 对所有 DSH peers 验证范围边界；检查声明/contract/升级文档/source map；解包后执行 Host 工具及客户端 factory，验证槽、locale、CSS |
| 文档 | 当前契约切换到 rc.2；旧 0.1.7 升级记录保留并标注为历史 |

源码比较确认下列模板使用的契约不需要迁移：

- `packages/core/tools/src/schema.ts`：`defineTool`、参数/输出 DSL 和执行校验。显式对象声明 `additionalProperties`；必填字段是属性上的 `required: true`，不是作者 DSL 根部的 `required` 数组。
- `vendor/schemastery/src/index.ts`、`vendor/cosmokit/src/volatile.ts`、`packages/settings/settings/src/index.ts`：schema/live reference 与 profile 配置。
- `packages/client/ui-plugin-manager/src/client/slot-contract.ts`：bundle/row 配置槽与 owner props。
- `packages/client/ui-slots/src/index.ts`、`packages/client/locale/src/client/index.ts`：实际类型和资源生命周期。
- `packages/client/web/src/platform.ts`：平台模块身份。

## 评估报告中的变更：扩展插件时注意

以下内容不是问候示例需要实现的功能，不为它们加入多余 peers、模拟 RPC 或覆盖宿主工具。

### 1. 限时提问与迟到回答

`packages/interaction/tool-ask-user/src/index.ts` 的 `mode: legacy | timed` 是工具插件的 Cordis 配置，不是所有调用都可传的通用 `mode` 参数。默认仍是 `legacy`；选择 `timed` 后默认前台等待 120 秒，`timeout: -1` 表示无限等待。

`packages/interaction/tool-ask-user/src/timed.ts` 和 `packages/interaction/user-questions/src/index.ts` 引入 pending 结果及迟到用户回复。使用此能力的扩展必须区分已回答/待回答，保留 callId 关联，并按真实 SessionProjection 和 `user-question-reply` 语义处理后续答复，不可无条件读取 `result.answers`。只继续独立工作；授权或确认还未收到时，不能把超时当作同意。面板关闭也不能简单等同取消问题。

### 2. 定时提醒包装的行为变化

`packages/schedule/schedule/src/domain.ts` 将包装文字改为 `This is a scheduled message from the user`。依赖旧 `untrusted reminder content` 字符串的拦截器/快照测试必须更新。若扩展把网页、日志等外部内容放入提醒，不应依赖宿主旧前缀来保证安全；明确区分用户请求与引用数据，避免把外部指令提升为用户授权。

### 3. OpenInAppAction 的 props

`packages/client/ui-open-in-app/src/client/OpenInAppAction.tsx` 现在要求 `absolutePath: string`，不再接收旧的 `sessionId`/`useSessions` 路径解析方式。扩展若封装或直接复用它，应由调用方解析目标目录并提供绝对路径。模板本身未导入该组件。

### 4. 插件安装与 Desktop profile

rc.2 的插件管理文案明确：已安装插件不能自动更新，应先卸载再重新安装。不要据此发明不存在的 upgrade 命令。依据 `apps/cli/src/plugin.ts` 及 `apps/desktop/README.md` 的 Bundled command runtime：仅 Desktop 安装提供的命令可管理 `--profile desktop`，npm 安装的 CLI 不能修改该保留 profile。应先启动 Desktop 一次初始化 profile，再完全退出应用、执行插件操作，完成后重新打开 Desktop；文件锁和兼容门禁仍然生效。不能用 CLI 启动 desktop profile，也不能绕过 profile 锁。

更新已有插件前备份目标 profile 配置，记录自定义 prefix；卸载/重装后检查 entry 配置是否保留，必要时在插件行配置重新设置。新安装可在目标 DSH 的插件管理页使用打包文件；涉及 profile 的操作应由用户明确选择，不在模板校验里自动执行。

### 5. 内部 Inspect 服务

`packages/extensions/cordis-host-runner/src/inspect-registry.ts` 的 `CordisInspectRegistryService` 构造函数增加必填 `clientQueryTimeoutMs`。只有手动实例化内部服务的扩展需要处理；普通第三方插件应使用公开服务，不复制宿主内部构造逻辑。

### 6. pi-ai 模型目录及传递类型依赖

`packages/llm/llm-pi-ai/package.json` 升级到 pi-ai `^0.87.1`。上游 `apps/cli/tests/profiles/headless/tests/fixtures/pi-ai-defaults.patch.yml` 已将模型和 override 改为 `deepseek-flash`，`packages/llm/llm-pi-ai/src/config.ts` 要求 override 的 ID 在目录中有效。评估指出旧 `deepseek-v4-flash` / `deepseek-v4-flash-vision-exp` 已移出相应目录，不应继续硬编码；这不是所有 DSH Provider 的统一改名。使用 pi-ai 的扩展应核对实际已安装版本的目录并迁移相应 profile；模板没有模型配置，不能擅自改用户 Provider。

报告中的 Zod/Undici 类型冲突来自其他下游工程，不说明本模板的 DSH API 被删除。新增相关依赖时检查发布包的传递版本，在独立项目做类型检查，不用上游 workspace 链接冒充 npm 包兼容验证。

## 验证与验收

```bash
pnpm install --frozen-lockfile
pnpm run check
```

`check` 包含类型检查、Vitest、Host/Client 构建与 npm 解包校验。版本测试接纳 rc.2、后续 rc 及 0.2 稳定版本的范围成员，拒绝旧 0.1.x、0.2.0 alpha/rc.1、0.3.0 alpha/rc/稳定版与 1.x；这只证明门禁范围，不证明未来版本 API 已通过验证。

打包冒烟使用真实 rc.2 npm 依赖，Host 运行 `template_greet`；客户端通过 ModuleLoader factory 在模拟浏览器/服务上下文中注册 bundle 配置槽与 locale、注入 CSS，确认 source map 含源码。这些不是实际 GUI/profile 的端到端测试。

生成项目验收：使用 `pnpm scaffold <target-directory> @your-scope/my-dsh-plugin`，检查 package/模块 id/locale/slot key 一致，无旧基线依赖；生成项目执行上述两条验证命令（首次安装不带 frozen，因为脚手架不复制锁文件）。

### 本次实际验证结果

- Node `26.10.0` / pnpm `11.7.0`。
- `pnpm install --frozen-lockfile` 成功；全部五个直接 DSH npm 包的实际版本核对为 `0.2.0-rc.2`。
- `pnpm run check` 成功：类型检查、5 个 Vitest 测试、Host/Client 构建、版本门禁和解包后的 Host/ModuleLoader/CSS/source-map 校验。
- scoped 脚手架 `@smoke/scoped-plugin` 的生成排除项、rc.2 metadata、完整 check 和 scoped 打包运行冒烟通过。该验证复用模板已安装的真实 rc.2 依赖，不宣称另做了一次生成项目的全新 npm 安装。
- `git diff --check` 通过。

本地环境最初遇到 pnpm 状态数据库和 npm registry 的网络重置，通过临时 XDG 状态目录、非交互安装及降低网络并发解决；没有把环境专用路径或代理设置写入模板，也没有放宽供应链校验。

### 尚需真实 GUI 验收

真实 GUI 仍需在 **DSH 0.2.0-rc.2 测试 profile** 验收：

1. 安装打包文件并刷新页面；确认插件详情的 bundle 说明面板，无模块加载或 slot 错误。
2. 修改插件行 prefix，运行 `template_greet`，确认新值立即生效；再次修改无需重启插件。
3. 重启测试宿主，确认 profile 值持久化。
4. 停用插件，确认工具与 locale/slot 资源清理；验证更新时的卸载/重装路径。

本次不覆盖全部受支持 Node 版本，也不更改当前运行的 GUI 或用户 profile。
