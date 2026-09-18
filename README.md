# Limbo AI Toolkit

面向 Codex、Claude Code、Cursor、GitHub Copilot 及其他 AI Coding Agents 的可复用工程资产库，集中维护 **Agent Skills、AI Agent Rules、MCP Servers、Git 工作流与前端图片优化工具**。

> Reusable AI agent toolkit with Agent Skills, coding rules, MCP servers, Git workflows, and frontend/image optimization utilities.

## 项目定位

本仓库用于沉淀可以复制到其它项目或接入 AI 客户端的工程资产，而不是通用提示词合集：

- **Agent Skills**：封装可重复执行的开发任务与操作流程。
- **AI Agent Rules**：约束编码风格、Git 流程和 Agent 行为。
- **MCP Servers**：通过 Model Context Protocol 为 AI 客户端提供本地工具。

不同资产的适用工具和安装位置可能不同，应以对应文档为准：

| 资产类型 | 适用范围 |
|---------|---------|
| Skills | Codex、Claude Code 或支持相应 Skill 格式的 Agent |
| Rules | Cursor、Claude Code、GitHub Copilot 等支持项目规则的 AI 编码工具 |
| MCP | 支持 stdio MCP Server 的客户端或 Agent |

## 快速开始

1. 从下方「对外资产清单」选择需要的 Skill、Rule 或 MCP。
2. 打开对应文档，确认功能范围、版本和客户端要求。
3. 按白名单取用：Skill 只复制 `SKILL.md` 及其明确依赖，Rule 只复制指定规则文件，MCP 只复制对应 README 指定的构建产物。
4. 按目标 AI 工具的目录和配置规则安装；不要把 `history/` 当作当前版本分发。

## 目录一览

```text
skills/      可复用 Agent Skills（每个一目录，仅放当前版本及其运行依赖）
rules/       可复用 AI Agent Rules（编码规约、流程约束等当前版本）
mcp/         可复用 MCP Servers（每个一子目录：package.json + README）
history/     已发布资产的历史快照（维护与审计使用，不向使用侧分发）
```

## 对外资产清单

### Skills

| 名称 | 说明 |
|------|------|
| [`generate-color-palette`](skills/generate-color-palette/SKILL.md) | 扫描前端源码中的 hex / rgb / oklch 颜色值，去重后按色谱分组，生成交互式 HTML 色板（搜索、Tab 筛选、点击复制） |
| [`git-branch-merge-flow`](skills/git-branch-merge-flow/SKILL.md) | 将当前分支按固定流程同步到目标分支：`fetch` → 对齐 `origin/*` → `push` → checkout 目标 → merge `origin/<当前>` → 推送；冲突时停在当前阶段分支 |
| [`long-task-state`](skills/long-task-state/SKILL.md) | 评估长时间、多阶段任务是否需要持久状态，征得用户同意后维护可验证的里程碑计划、进度与路线调整，并支持有界子 Agent 委派、跨会话恢复、接管和自动发现探针 |
| [`picture-formats`](skills/picture-formats/SKILL.md) | 同源并行导出 AVIF/WebP/JPEG（或 PNG），用 `<picture>` 让浏览器只下载一种；含 Vue 实践、透明兜底、Network 排错与 tinypng-mcp 素材准备 |
| [`programming-study-coach`](skills/programming-study-coach/SKILL.md) | 调研有信誉的公开课程后规划并教授编程语言，维护相互印证的教学大纲、由练习文档与实际答案代码文件组成的练习簿和面向学习者的知识手册；参考答案默认只做静态完整性与路径一致性检查，不要求逐题运行验证；每次改文档后按「文档→节→小节→点」汇报维护位置；可按任务边界自主选择子智能体模型与思考强度开展调研、草稿、审计和诊断，由主 Agent 统一教学决策与事实源写入 |

### Rules

| 名称 | 作用域 | 说明 |
|------|--------|------|
| [`agent-global-baseline`](rules/agent-global-baseline.md) | 全局 | 跨项目 Agent 基线（简体中文、代码原则、目录预检查、Git 临时 proxy 等） |
| [`style-reference-clarify`](rules/style-reference-clarify.md) | 全局 | 参考某处样式实现另一处时，先读参考源、一轮多选确认必抄样式点后再改代码 |

### MCP

| 名称 | 说明 |
|------|------|
| [`tinypng-mcp`](mcp/tinypng-mcp/README.md) | 通过 TinyPNG 官方 API 压缩或转换 PNG/JPG/WebP/AVIF；MCP Tools + CLI；须 `TINIFY_API_KEY` |
| [`tinypng-web-mcp`](mcp/tinypng-web-mcp/README.md) | 走官网 Web 后台免 Key 压缩 PNG/JPG；不稳定，仅建议学习；使用前阅读对应免责声明 |

功能详情与 Version Notes：Skill 见各 `SKILL.md`；Rule 见 [rules/README.md](rules/README.md)；MCP 见 [mcp/README.md](mcp/README.md)。来源 / 实现参考标注见 [AGENTS.md](AGENTS.md#实现参考标注readme--正文)。

## License

本仓库代码与文档采用 [MIT License](LICENSE)。涉及 TinyPNG 等第三方服务的资产，还需遵守对应服务条款及资产目录中的免责声明。

---

维护约定（含资产分类、版本规则、目录结构）见 [AGENTS.md](AGENTS.md)。
