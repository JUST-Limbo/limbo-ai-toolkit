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

---

维护与贡献（含资产分类、版本规则、提交约定）见 [CONTRIBUTING.md](CONTRIBUTING.md) 与 [AGENTS.md](AGENTS.md)。
