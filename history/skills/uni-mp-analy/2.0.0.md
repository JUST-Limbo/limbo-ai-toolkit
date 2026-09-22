---
name: uni-mp-analy
description: Analyze and optimize WeChat mini-program package size for Vue 2 and Vue 3 uni-app CLI projects. Build production artifacts, collect miniprogram-ci dependency and quality data, generate an offline HTML treemap report, and verify source-level optimizations with before/after measurements. Use for main-package bloat, subpackage planning, dependency attribution, or package-size audits; excludes HBuilderX-managed projects and other mini-program platforms.
metadata:
  x-skill-version: "2.0.0"
  x-source-repo: "JUST-Limbo/limbo-ai-toolkit"
  x-source-path: "skills/uni-mp-analy"
---

# uni-app 微信小程序包体分析与优化

## 功能说明

面向 **Vue 2 / Vue CLI / Webpack** 和 **Vue 3 / Vite** 的 uni-app CLI 工程，使用 Skill 内置脚本调用 `miniprogram-ci`，采集编译产物依赖、包归属和官方质量检查，生成可离线打开的单文件 HTML 报告。报告包含包概览、矩形树图、文件搜索、模块引用、重复文件及前后对比。AI 结合源码解释原因，并按用户授权实施优化。

用户只集成这个 Skill。`miniprogram-ci` 是 `scripts/` 内的固定版本依赖，不默认安装进业务工程，不需要独立命令、全局 npm 包、MCP 服务或微信开发者工具 GUI。

本地分析输出的是生产构建文件数据；**最终微信打包体积**仅在成功执行微信预览且返回 `subPackageInfo` 后确认。预览会把代码发送给微信，需要真实 AppID、上传密钥和 IP 白名单。没有这些条件也能完成本地报告，但必须写明“最终包体未验证”。当前 Skill 不执行 `upload`，不发布版本，也不替代真机行为验证。

## 使用方法

典型请求：

- “使用 uni-mp-analy 分析当前项目，给我包体报告。”
- “查看为什么 vendor.js 留在主包，先给优化方案。”
- “按已经确认的方案优化分包，重新构建并比较结果。”
- “使用提供的 AppID 和本地密钥生成预览，验证微信实际包体。”

默认根据用户请求选择工作范围：仅分析时不修改源码；要求方案时先解释证据和取舍；要求实施时执行已授权的改动并复测。已经明确的优化授权无需重复确认，但新增外部上传行为或扩大业务改造范围需另行确认。

### 1. 确定工程和执行环境

先读目标目录规则并查看工作区变更。确认操作系统，使用用户本机 Node 和项目现有包管理器；不要静默换用 Agent 自带 Node、全局切换版本或改写业务工程锁文件。

读取工程 `package.json`、相关锁文件、`src/pages.json`、`src/manifest.json` 及构建配置。自定义 `UNI_INPUT_DIR` 时使用实际目录。识别 `@dcloudio/vue-cli-plugin-uni`（Vue 2）或 `@dcloudio/vite-plugin-uni`（Vue 3）；两者同时存在或都缺失时先查清工程类型，不能按 HBuilderX 工程猜测。

确认 `build:mp-weixin` 的具体内容和产物路径。自定义脚本可使用等价 production 构建，避免执行 watch 或 dev 构建；已有产物模式必须说明可能过期。若 Node 不兼容，报告实际错误并使用已经安装且项目支持的版本，不擅自升级整个工程。

### 2. 准备 Skill 内部依赖并构建

首次运行，在本 Skill 的 `scripts/` 目录执行 `npm ci`；存在匹配锁文件的依赖时复用。锁定版本来自随附 `package-lock.json`，升级后必须重新验证接口和两种工程。不将 `node_modules/` 分发或提交。

在目标工程根目录执行已有 production 微信构建命令。构建成功后定位包含 `project.config.json` 的目录，通常为 `dist/build/mp-weixin`；内置脚本按 `miniprogramRoot` 定位 `app.json`。不修改或直接修补 `dist` 来冒充源码优化。

### 3. 采集与展示

首次使用脚本时阅读 [执行与数据协议](references/runtime.md)。脚本路径使用 Skill 实际绝对路径；报告选择一个**尚不存在、父目录已存在**的目录，并放在产物目录以外，防止报告自身进入包体。每次保留独立目录作为基准。

下面是参数形态，不是可不加判断粘贴的跨平台命令：

```text
node <skill>/scripts/analyze.mjs --root <工程根目录> --output <新报告目录> --production
```

仅在刚刚成功完成 production 构建后传 `--production`。只检查用户提供的已有产物时省略该参数。非默认路径追加 `--dist <包含 project.config.json 的目录>`。

默认只采集本地 `analyseCode` 和 `checkCodeQuality`。用户要求真实微信预览且凭据可用时，使用本次进程环境变量 `WECHAT_APPID`、`WECHAT_PRIVATE_KEY_PATH`，追加 `--preview`；不要读取或打印密钥内容，不将密钥放入产物、报告或版本库。预览使用产物 `project.config.json` 的编译设置。

向用户打开或链接生成的 `report.html`；无需服务器或外部 CDN。AI 先读 `analysis.json` 中阶段状态、概览与问题，再按需查询 `raw/` 或模块数据，不把整个大依赖图直接塞入上下文。

输出结论须包括：工程类型、构建方式、数据来源、主包/分包体积、主要问题及证据、未验证项。SDK 失败或依赖解析不完整时仍可展示已获取的部分报告，但不可声称全部通过。

### 4. 解释与优化

需要制定或实施优化时阅读 [优化决策](references/optimization.md)。每项建议至少给出产物路径、引用证据、对应源码位置、预计影响和验证方法。估算与实测分开写，不能把重复字节或未关联字节直接当成可节省体积。

遵循用户授权改动源码，一次聚焦一组可验证的变化。对被修改代码留下简短 `uni-mp-analy 2.0.0` 注释，沿用语言原生注释格式；严格 JSON 不插入非法注释，可在相邻被改动的脚本标注关联配置。发现同区域有本 Skill 旧版本注释时，按目标目录规则先让用户明确版本处理方式。

### 5. 重建与对比

再次执行相同 production 构建，用新报告目录运行分析并追加 `--baseline <旧报告/analysis.json>`。或使用内置 `compare.mjs --before <旧 JSON> --after <新 JSON> --output <新目录>` 离线生成对比。

同时报告主包、每个分包和总量；把“主包变小但总包增大”的取舍写出来。两份报告的编译器、SDK、编译设置或构建模式不一致时不得直接归因于优化；报告会标记部分差异，Agent 还需核对依赖、环境和构建日志。

检查路由、tabBar、组件、静态资源及动态引用。构建通过和预览生成均不等于真机回归通过；无法做行为验证时明确剩余项。交付源码变更、前后报告与实际验证结果。

## 取用与维护

对外复制白名单：本文件，`scripts/` 下的 `.mjs`、`.cjs`、`package.json`、`package-lock.json`，完整 `assets/` 与 `references/`。`agents/openai.yaml` 为可选界面元数据。不要复制 `node_modules/`、`scripts/tests/`、临时报告、凭据、测试工程或顶层 `history/`。

维护时运行 `scripts/` 内的 `npm test`，并按 [实测记录](references/validation.md) 对真实 Vue 2、Vue 3 工程验证。
