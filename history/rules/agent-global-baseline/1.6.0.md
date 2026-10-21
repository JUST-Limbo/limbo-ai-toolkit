---
name: "agent-global-baseline"
description: "Global always-on baseline rules for AI agents working in any project repository"
scope: "global"
metadata:
  x-rule-version: "1.6.0"
  x-source-repo: "JUST-Limbo/limbo-ai-toolkit"
  x-source-path: "rules/agent-global-baseline.md"
  x-source-url: "https://github.com/JUST-Limbo/limbo-ai-toolkit/blob/main/rules/agent-global-baseline.md"
---

# 全局规则

## 语言与交流

- 任何情况下，回答一律使用简体中文，包括开头第一个字，不受输入或引用内容语言的影响；代码、命令、专有名词等本就不该翻译的内容除外。
- 不迎合、不刻意夸奖，基于事实给出判断；回答条理清晰。

## 代码原则

- Vue 和 React 项目在页面层调用 API 接口时，必须使用 async/await 语法，以便于错误处理，也提升代码可读性。
- 调整 DOM 后，移除已不承担布局、样式、交互、语义、无障碍或框架职责的节点；避免新增无必要的层级，不扩大改动范围。
- 新代码不要使用可选链 `?.`、非空断言 `!`（如 `foo!.bar`）、空值合并 `??` 这几类操作符；旧的已有代码则不必调整。
- 封装通用函数时，在注释中提供典型用法，并说明重要边界条件。
- 回答中提到项目里的代码时，请带上对应的文件名和代码所在行号，方便我查阅。

## 工作流程与提醒

- 如果某项改动需要重启当前运行的前端项目才能看到效果，请记得提醒我。
- 命令须匹配实际执行环境的操作系统与 Shell；环境不明时先核实。
- 文件可能被用户或外部工具修改；已有读取结果可能过期时，修改前重新读取，避免覆盖新内容。
- 集成终端或 Agent 执行环境可能自带 Node，与本地不一致；运行 node、npm 等命令时，如无特殊说明，请使用我本机已安装的 Node 版本。

## 目录级规则预检查

- 操作前确认并遵守目标路径适用的目录级规则；已加载且未变化的规则无需重复读取，发生冲突时以更具体的规则为准。

## Git

### git commit 前检查

- 执行 `git commit` 之前（`git add` 之后、写入 commit 之前）：检查**本仓库 local** 的 Git 身份：`git config --local user.name` 与 `git config --local user.email`。任一未配置则**中止提交流程**，说明未设 local 时 Git 可能静默沿用 global，并让用户决定下一步（为本仓库设置 local、或确认沿用 global 后再继续）；**不得**擅自执行 `git config --global` / `--local` 写入。
- 生成临时 mock 数据时明确标注；提交前检查是否仍需保留，并按用户要求处理。
- 提交前检查临时测试数据、调试输出及其他非交付内容；发现用途不明或是否保留不明确的内容时，先询问用户。

### WSL Linux 文件系统中的 Git 操作

对于实际存放在 WSL Linux 文件系统（如 `/root/code/...`）中的项目，应在 WSL 终端内执行 Git 操作；不得从 Windows 侧经 `\\wsl.localhost\...` 路径调用 Git。这样可避免路径过长，以及 Windows 与 Linux 在文件权限、换行符和大小写规则上的差异引发异常。

### 远程操作（clone / fetch / pull / push / ls-remote）

- 操作前核实本次远端地址、传输协议及 Git 配置和环境变量中的有效代理，避免输出凭证；根据域名、私有地址及项目上下文识别内网，不得把所有非 GitHub 远端视为内网。
- **GitHub HTTPS**：主动核实 `127.0.0.1:7897` 的可用性及代理协议，可用时优先通过临时代理执行；直连因网络问题失败时，主动尝试该端口重试，无需先等待用户确认。
- **内网仓库**：显式临时直连，排除 Git 配置（含 URL / remote 专属配置）及代理环境变量的继承影响；因继承代理失败时，主动禁用本次代理并重试。
- **其他远端**：沿用当前网络路径，失败后再诊断。SSH 远端须核实 SSH 代理配置，不能套用 Git HTTP 代理参数。
- 代理调整仅作用于当前命令或临时子进程；不得持久修改 Git 配置或环境变量，不得影响后续命令。
- 仅对连接超时、代理连接失败等网络错误切换路径重试；认证、权限、分支保护及非快进拒绝按实际原因处理。仍失败时继续排查代理服务、DNS、`hosts` 等，并说明原因；需要用户启动代理或提供信息时再询问。
