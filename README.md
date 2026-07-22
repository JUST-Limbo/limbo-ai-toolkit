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

`rules/` 下存放可被其它项目复用的规则与编码规约，按语言/框架或主题切分。
详见 [rules/README.md](rules/README.md)。

### `agent-global-baseline`

- 路径：[`rules/agent-global-baseline.md`](rules/agent-global-baseline.md)
- 来源：`JUST-Limbo/limbo-ai-toolkit`（本仓库原创）
- 作用域：**全局**（始终加载，不绑定文件 glob）
- 功能：跨项目 Agent 全局基线（简体中文、代码原则、目录预检查、Git 临时 proxy 等）。**功能说明与取用方式**见 [rules/README.md](rules/README.md#agent-global-baseline)。
- Use example：

```text
复制 agent-global-baseline.md（去掉 YAML 头，保留文末来源注释）到 ~/.claude/CLAUDE.md
```

```text
复制正文到 .cursor/rules/agent-global-baseline.mdc，设 alwaysApply: true
```

---

维护约定（含资产分类、版本规则、目录结构）见 [AGENTS.md](AGENTS.md)。
