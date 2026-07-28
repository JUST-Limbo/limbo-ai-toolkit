# 可复用 AI 资产库

集中维护 Skill / Rule / MCP 等，供各项目取用。

## 目录一览

```
skills/      可复用 Skill（每个一目录：SKILL.md 最新版 + versions/ 历史快照）
rules/       可复用 Rule（编码规约、流程约束等）
mcp/         可复用 MCP Server（每个一子目录：package.json + README）
```

## 对外资产清单

### Skills

| 名称 | 说明 |
|------|------|
| `generate-color-palette` | 扫描前端源码中的 hex / rgb / oklch 颜色值，去重后按色谱分组，生成交互式 HTML 色板（搜索、Tab 筛选、点击复制） |
| `git-branch-merge-flow` | 将当前分支按固定流程同步到目标分支：`fetch` → 对齐 `origin/*` → `push` → checkout 目标 → merge `origin/<当前>` → 推送；冲突时停在当前阶段分支 |

### Rules

| 名称 | 作用域 | 说明 |
|------|--------|------|
| `agent-global-baseline` | 全局 | 跨项目 Agent 基线（简体中文、代码原则、目录预检查、Git 临时 proxy 等） |
| `style-reference-clarify` | 全局 | 参考某处样式实现另一处时，先读参考源、一轮多选确认必抄样式点后再改代码 |

### MCP

| 名称 | 说明 |
|------|------|
| `tinymcp` | 通过 TinyPNG 官方 API 压缩或转换 PNG/JPG/WebP/AVIF；MCP Tools + CLI；须 `TINIFY_API_KEY` |

功能详情与 Version Notes：Skill 见各 `SKILL.md`；Rule 见 [rules/README.md](rules/README.md)；MCP 见 [mcp/README.md](mcp/README.md)。来源 / 实现参考标注见 [AGENTS.md](AGENTS.md#实现参考标注readme--正文)。

---

维护约定（含资产分类、版本规则、目录结构）见 [AGENTS.md](AGENTS.md)。
