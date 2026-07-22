# rules — 对外 Rule 库

本目录是 [`README.md`](../README.md) 所述「对外资产」中的 **Rule** 一类：
存放面向**其它项目**、可复用的规则与编码规约，供别的仓库取用（复制、引用或同步过去）。

## 文件约定

- **`rules/*.md` 正文 = 可直接复制的规则内容**（YAML 头仅本仓库治理用；取用时 Claude Code 等平台一般**去掉 frontmatter**，只保留 `# 全局规则` 起的 Markdown）。
- **功能说明、使用方法、版本历史** 写在本 README 的各 Rule 条目下，**不**放进 `.md` 规则文件，避免被误复制进目标项目的 Rule。

## 规则清单

| 文件 | 作用域 | 说明 |
|------|--------|------|
| [`agent-global-baseline.md`](agent-global-baseline.md) | 全局 | 跨项目通用的 Agent 基线（交流、代码、预检查、Git） |

---

### `agent-global-baseline`

- 来源：`JUST-Limbo/limbo-ai-toolkit`
- 版本：`1.2.0`（见文件内 `x-rule-version`）
- 作用域：**全局**（始终加载，不绑定文件 glob）

#### 功能说明

定义 AI Agent 在**任意业务仓库**中协作时应默认遵守的**全局基线**，不限定具体语言或框架。

**适用场景**

- 全局简体中文交流、代码引用带行号
- Vue/React 页面层 API 用 async/await；新代码禁用 `?.` / `!` / `??`
- 动作链（提交、推送、批量改动等）前做目录规则预检查
- Git 远程失败时说明原因、提示开代理，仅用**临时 proxy** 重试

**不负责的范围**

- 特定语言/框架的详细编码规约（另建专题 Rule）
- 某仓库自身的分支策略、提交信息格式（项目本地配置）

#### 使用方法

整文件复制 [`agent-global-baseline.md`](agent-global-baseline.md)，**去掉 YAML frontmatter** 后写入目标路径；Cursor 改用下方 frontmatter。

| 工具 | 目标路径 | 加载配置 |
|------|---------|---------|
| Claude Code | `~/.claude/CLAUDE.md` | 用户级自动加载 |
| Cursor | `.cursor/rules/agent-global-baseline.mdc` | `alwaysApply: true` |
| Claude Code（项目内） | `.claude/rules/agent-global-baseline.md` | 无 `paths:` 即全局 |
| GitHub Copilot | 合并进 `.github/copilot-instructions.md` | 仓库级自动加载 |

Cursor 的 frontmatter 示例：

```yaml
---
description: Global always-on baseline for AI agents
alwaysApply: true
---
```

与专题 Rule 冲突时，以**更具体**的目录/项目 Rule 为准。

#### Version Notes

**1.2.0**

- 规则文件改为「frontmatter + 纯正文」；功能说明、使用方法、版本历史外置到本 README。

**1.1.0**

- 合并 Git 章节（提交前检查 + 远程操作临时 proxy）。

**1.0.0**

- 初始版本。

---

> **判断标准（全仓库统一）**：一条规则若写给"使用这些资产的别的项目"看，放本目录（对外）；
> 若只约束"在本仓库里干活"的 AI 工具行为，则属于**项目本地配置**，放各工具的隐藏目录，见下。

## 不要和「项目本地规则」混淆

约束**本仓库自身**行为的规则（如提交信息格式）属于项目本地配置，**不放本目录**，
而是放进团队所用每个 AI 工具各自约定的固定路径，例如 `.cursor/rules/*.mdc`、
`.claude/rules/*.md`、`.github/copilot-instructions.md` …，每个工具各放一份且正文一致。

例如"提交信息格式"这类只约束本仓库的规则就放在这些工具路径里，**不进入 `rules/` 库**。
完整的两类划分、各工具路径与同步约定见 [AGENTS.md](../AGENTS.md)。
