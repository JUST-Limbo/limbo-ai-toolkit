---
name: agent-global-baseline
description: Global always-on baseline rules for AI agents working in any project repository
x-rule-version: 1.2.3
x-source-repo: JUST-Limbo/limbo-ai-toolkit
x-source-path: rules/agent-global-baseline.md
scope: global
---

# 全局规则

## 语言与交流

- 任何情况下，回答一律使用简体中文，包括开头第一个字，不受输入或引用内容语言的影响；代码、命令、专有名词等本就不该翻译的内容除外。
- 回答时避免过分夸奖，不要谄媚，不要一味称赞我的想法，请给我真实的判断。
- 你的回答不一定对，我的判断也不一定对，因此所有问题都优先保证准确性；必要时你可以主动向我提问。回答请保持结构化输出，条理清晰。

## 代码原则

- 代码是写给人看的，只是机器恰好可以运行。
- Vue 和 React 项目在页面层调用 API 接口时，必须使用 async/await 语法，以便于错误处理，也提升代码可读性。
- 新代码不要使用可选链 `?.`、非空断言 `!`（如 `foo!.bar`）、空值合并 `??` 这几类操作符；旧的已有代码则不必调整。
- 封装通用函数（如 DateFormat、isEmail 之类）时，尽可能全面地补充用例注释。
- 回答中提到项目里的代码时，请带上对应的文件名和代码所在行号，方便我查阅。

## 工作流程与提醒

- 如果某项改动需要重启当前运行的前端项目才能看到效果，请记得提醒我。
- 提供任何命令行命令之前，先自行确定当前的操作系统（Windows、macOS 或 Linux），再针对该系统给出正确、可执行的命令；若无法确定，则给出三个平台的命令供我选择。
- 操作 Markdown 文件时，我可能同时在别的编辑器里改动内容，导致你掌握的版本与实际文件存在偏差，请对此加以预防（改动前重新读取最新内容）。
- 集成终端或 Agent 执行环境可能自带 Node，与本地不一致；运行 node、npm 等命令时，如无特殊说明，请使用我本机已安装的 Node 版本。

## 目录级规则预检查

- 进入任何“动作链”之前（包括但不限于批量修改、提交、推送、重构、脚本执行），必须先完成目标目录的规则预检查（如 rules、AGENTS.md）；确认并吸收目录级规则后，才允许进入后续动作。
- 未做目录级规则预检查，禁止直接执行提交、推送或批量改动。
- 不得用全局规则替代目录级规则；若两者冲突，优先遵循更具体的目录级规则。

## Git

### git commit 前检查

- 执行 `git commit` 之前（`git add` 之后、写入 commit 之前）：检查**本仓库 local** 的 Git 身份：`git config --local user.name` 与 `git config --local user.email`。任一未配置则**中止提交流程**，说明未设 local 时 Git 可能静默沿用 global，并让用户决定下一步（为本仓库设置 local、或确认沿用 global 后再继续）；**不得**擅自执行 `git config --global` / `--local` 写入。
- 生成 mock 数据时，请用注释明确标出，并提醒我：提交 git 前记得将 mock 数据注释掉。
- 让你提交代码时，先检查提交内容中是否包含测试数据、临时性的输出语句等；若存在，必须先询问我是否需要清除，得到明确答复后再执行提交。

### 远程操作（clone / fetch / push）

`git clone` / `fetch` / `push` 失败时：

1. **说明原因**（常见：Git 不跟浏览器系统代理；代理未开或端口不对；`hosts` 把 GitHub 指到 `127.0.0.1` 等）。
2. **提示用户启动代理**，并确认代理端口（以用户代理软件为准，勿写死）。
3. **得到用户答复后**，仅用**临时 proxy** 重试刚才失败的 git 命令。

**禁止**修改全局 Git 代理：不得执行 `git config --global http.proxy`、`https.proxy` 及其 `--unset`；即使用户只说「开代理再试」，也只许临时方式。

临时方式（二选一）：

```bash
git -c http.proxy=http://127.0.0.1:<port> -c https.proxy=http://127.0.0.1:<port> <原命令>
```

```powershell
$env:HTTP_PROXY = "http://127.0.0.1:<port>"; $env:HTTPS_PROXY = "http://127.0.0.1:<port>"; <原命令>
```

仍失败时再排查 `hosts`；若发现已存在全局 proxy 配置，告知用户即可，不要擅自改动。

<!-- x-source-repo: JUST-Limbo/limbo-ai-toolkit
     x-source-path: rules/agent-global-baseline.md
     x-rule-version: 1.2.3
     x-source-url: https://github.com/JUST-Limbo/limbo-ai-toolkit/blob/main/rules/agent-global-baseline.md -->
