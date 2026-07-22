# 可复用 AI 资产库

集中维护 Skill / Rule 等，供各项目取用。

## 目录一览

```
skills/      可复用 Skill（每个一目录：SKILL.md 最新版 + versions/ 历史快照）
rules/       可复用 Rule（编码规约、流程约束等）
```

## Skills

### `git-branch-merge-flow`

- 路径：[`skills/git-branch-merge-flow/`](skills/git-branch-merge-flow/SKILL.md)
- 来源：`JUST-Limbo/limbo-ai-toolkit`（本仓库原创）
- 功能：将当前分支的改动按固定流程同步到目标分支。先校验来源≠目标；在 **CurrentBranch** 上：`fetch` → 必要时提交 → 若落后则对齐 `origin/<当前>` → `push`；在 **TargetBranch** 上：checkout → `fetch` → 对齐 `origin/<目标>`（若需要）→ 以 `origin/<当前>` 为来源合并 → 推送目标分支；若无冲突则切回之前的分支，冲突则停在当前阶段所在分支等待处理。
- Use example：

```text
/git-branch-merge-flow 合并到dev
```

```text
/git-branch-merge-flow 合并到release/yyy
```

## Rules

`rules/` 下存放可被其它项目复用的规则与编码规约，按语言/框架或主题切分。功能说明与 Version Notes 见 [rules/README.md](rules/README.md)；创建、维护与版本治理见 [AGENTS.md](AGENTS.md#rule创建维护与调用)。

### 取用方式

从 [`rules/<name>.md`](rules/) 复制到目标项目或用户级配置：

1. 复制正文（**去掉**本仓库治理用 YAML frontmatter），**保留**文末 `<!-- x-source-* -->` 注释。
2. 按目标工具补写必要的 frontmatter（如 Cursor 的 `alwaysApply`、`globs`）。
3. **不要**把 [rules/README.md](rules/README.md) 里的功能说明、Version Notes 抄进规则正文。

**常见路径**（`<name>` 替换为规则文件名，不含 `.md`）：

| 工具 | 目标路径 | 加载配置 |
|------|---------|---------|
| Claude Code | `~/.claude/CLAUDE.md` | 用户级自动加载 |
| Cursor | `.cursor/rules/<name>.mdc` | `alwaysApply: true` 或 `globs` |
| Claude Code（项目内） | `.claude/rules/<name>.md` | 无 `paths:` 即全局 |
| GitHub Copilot | 合并进 `.github/copilot-instructions.md` | 仓库级自动加载 |

Cursor 全局 Rule 的 frontmatter 示例：

```yaml
---
description: Global always-on baseline for AI agents
alwaysApply: true
---
```

**对照更新**：读取本地规则文末注释中的 `x-source-url`（或 `x-source-repo` + `x-source-path`），与上游 diff；本地 `x-rule-version` 低于上游时再合并更新。

与专题 Rule 冲突时，以**更具体**的目录/项目 Rule 为准（详见 [AGENTS.md §5](AGENTS.md#5-加载优先级与冲突)）。

### `agent-global-baseline`

- 路径：[`rules/agent-global-baseline.md`](rules/agent-global-baseline.md)
- 来源：`JUST-Limbo/limbo-ai-toolkit`（本仓库原创）
- 作用域：**全局**（始终加载，不绑定文件 glob）
- 功能：跨项目 Agent 全局基线（简体中文、代码原则、目录预检查、Git 临时 proxy 等）。详细说明见 [rules/README.md](rules/README.md#agent-global-baseline)。
- Use example：

```text
复制 agent-global-baseline.md（去掉 YAML 头，保留文末来源注释）到 ~/.claude/CLAUDE.md
```

```text
复制正文到 .cursor/rules/agent-global-baseline.mdc，设 alwaysApply: true
```

---

维护约定（含资产分类、版本规则、目录结构）见 [AGENTS.md](AGENTS.md)。
