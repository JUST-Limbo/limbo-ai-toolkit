---
name: trans-to-unicli
description: Audit and migrate an HBuilderX-built uni-app project to a uni-app CLI project, preserving platform, environment, and build behavior. Use for HB-to-CLI conversion or migration planning; not for ordinary CLI feature work.
metadata:
  x-skill-version: "1.0.0"
  x-source-repo: "JUST-Limbo/limbo-ai-toolkit"
  x-source-path: "skills/trans-to-unicli"
---

# trans-to-unicli

> **状态：草案分支留档，暂不对外分发。** 虽已通过 Git 提交保留版本，但暂不并入主线、安装为通用 Skill 或宣称已验证迁移能力。当前流程主要归纳自一次真实 Vue 2 项目迁移；Vue 3 只用合成的最小输入验证过微信小程序编译。尚无第二个真实项目证明步骤可复用，也未验证真实多环境配置、插件/原生能力、开发者工具运行与 CI 上传。它没有自动迁移实现，现阶段更接近项目检查清单；待更多真实迁移暴露出稳定共性后，再决定是否发布。实验工程不作为本 Skill 的依赖。

## 功能说明

将 HBuilderX 内置的 uni-app 工程迁移为可通过命令行构建的 uni-app 工程，或先审计迁移可行性。适用于已有业务源码、环境区分、自定义编译、微信小程序上传脚本等需要保留的项目；不负责把 Vue 2 项目顺便升级到 Vue 3，不负责业务重构、发布或替用户决定平台 AppID。

这是一套审计与半自动迁移流程，不是对任意目录一键搬运的脚本。只把可复用的判断和验证方法带到目标项目；目标项目的 AppID、域名、签名资料、CI 凭据、环境名称和业务约定必须现场确认。

## 使用方法

用户可说“用 `trans-to-unicli` 评估这个 HBuilderX uni-app 项目”或“将这个 HB 内置项目迁移为 CLI 工程，并验证微信小程序构建”。先说明目标平台和期望的开发/生产环境；未说明时从项目现状识别，不凭示例预设。若用户仅要求评估，交付迁移方案，不修改工程。

## 工作流程

1. **预检查与盘点。** 先读取目标目录及其父目录的 `AGENTS.md`、rules 等约束，检查 Git 状态和已有未提交改动，确认可回退边界。识别 `manifest.json`、`pages.json`、`main.js`、`App.vue`、`uni.scss`、`package.json`、`vue.config.js`、`project.config.json`、HBuilderX 自定义编译项、CI 脚本、锁文件和源码引用。核对 Vue 版本、目标端、插件、原生扩展、编译器/HBuilderX 依赖和本机 Node 兼容性。已有 CLI 结构时先判断是继续修复还是迁移，避免二次搬运。
2. **选择同代官方基准。** Vue 2 使用相应的 DCloud Vue CLI 预设；Vue 3 先辨别项目对应的 Vite/CLI 路线，不以 Vue 2 依赖模板覆盖。核对当时适用的官方安装和升级说明、包版本与锁文件；在临时目录生成基准工程，核对实际生成的 `src/`、入口和构建配置确为 uni-app（脚手架退出码为 0 不足以证明生成内容正确），比较结构、Babel/Vite 和依赖，再形成保留/迁移/删除清单。不要把示例版本号固定为普适值，也不要将临时基准中的 AppID 或示例业务数据带进目标工程。
3. **先给迁移计划，再改目标工程。** 列明源码和静态资源位置、构建命令、环境矩阵、AppID 来源、CI/微信开发者工具路径、回退方式以及无法自动判定的项目特性。大范围移动、覆盖配置、删除旧产物或变更发布链路前让用户确认方案；不要清理与迁移无关的工作区改动。
4. **按计划迁移。** 将业务源码与页面配置放到所选基准预期的目录（常见 CLI 工程为 `src/`），合并入口、`manifest.json`、`pages.json`、`project.config.json`、样式和资源引用。分别处理 Vue 2/Vue 3 的编译配置，不凭空拼装官方脚手架文件。逐项核对路径别名、静态资源、条件编译、分包、插件、云函数/原生模块与第三方依赖；有平台特有能力时说明其 CLI 支持范围。仅在原代码已需要时引入 Promise 适配层，并检查 `uni` 异步 API 的返回语义及页面错误处理，避免重复手写 Promise 化。
5. **梳理环境与 AppID。** 追踪接口域名、环境变量、自定义 `uni-app.scripts`、HBuilderX 菜单、`manifest.json`、`project.config.json` 及 `project.private.config.json` 的实际优先级。JSON 配置不能假定支持 shell 环境变量插值。若构建确需临时改写源码 JSON，必须先记录原值，确保构建失败也能恢复，避免并行/监听构建竞态，并在结束后核对 Git diff；优先选择可审计、无需修改源文件的配置方案。不能仅因代码“计划恢复”就宣称已恢复，要实际验证源文件和产物中的 AppID。
6. **验证与交付。** 根据项目实际脚本执行开发、生产及自定义环境的目标平台构建；检查产物目录和编译后的 AppID、域名、页面/资源、条件编译与警告。CLI 常见产物为 `dist/dev/<platform>`、`dist/build/<platform>`，但以项目实际配置为准；同步核对上传脚本与微信开发者工具项目路径，不要误用旧 `unpackage/dist/...` 产物。必要时做真机/开发者工具验证。交付改动清单、验证矩阵（命令、结果、未验证项）、风险和回退方式；不把“构建成功”等同于运行与上传成功。

## 边界与注意

- 未经用户授权不上传小程序、不改生产 AppID 或密钥、不安装全局工具、不提交或推送。用户只要求方案时止于审计。
- 不复制私有项目名称、域名、AppID 或业务源码进本 Skill；迁移实例仅用于归纳通用检查点。
- 若目标项目已带本 Skill 的旧版本代码注释，而本次使用新版本修改同一代码区域，按目标仓库规则先告知并询问版本选择。实际修改目标业务/脚本代码后，在改动附近按目标项目语言注明 `trans-to-unicli` 与本版本号；文档/配置说明不强加代码注释。
- 迁移过程中遇到与本流程冲突的更具体目录规则、官方版本差异或项目现状，以核实后的目标项目要求为准并说明取舍。

## 官方资料

开始迁移前核对 DCloud 当前文档，尤其是 CLI 创建方式、版本兼容性和目标平台限制：

- [uni-app CLI 创建项目](https://uniapp.dcloud.net.cn/quickstart-cli.html)
- [uni-app package.json 配置](https://uniapp.dcloud.net.cn/collocation/package.html)
- [uni-app manifest.json 配置](https://uniapp.dcloud.net.cn/collocation/manifest.html)
