# Limbo AI Toolkit

## 项目结构

提供可复用于其他项目或 AI 客户端的工程资产：

| 类型 | 目录 | 用途 |
| --- | --- | --- |
| Skills | `skills/` | 封装任务与操作流程 |
| Rules | `rules/` | 约定编码和 Agent 行为 |
| MCP | `mcp/` | 为 AI 客户端提供工具 |
| 历史快照 | `history/` | 保留已发布版本，供维护与审计使用 |

按目标 AI 工具的目录和配置规则安装；不要把 `history/` 当作当前版本分发。

## 对外资产清单

### Skills

| 名称 | 说明 |
|------|------|
| [`generate-color-palette`](skills/generate-color-palette/SKILL.md) | 扫描前端源码颜色，生成可搜索、筛选和复制的 HTML 色板 |
| [`git-branch-merge-flow`](skills/git-branch-merge-flow/SKILL.md) | 同步当前分支，合并到目标分支并推送 |
| [`task-journey`](skills/task-journey/SKILL.md) | 维护长期任务的计划与进度，支持跨会话恢复和接管 |
| [`picture-formats`](skills/picture-formats/SKILL.md) | 导出多种图片格式，通过 `<picture>` 按浏览器支持情况加载 |
| [`programming-teacher`](skills/programming-teacher/SKILL.md) | 规划编程课程、编写 HTML 教材、开展教学并维护 Markdown 笔记 |
| [`tune-ink-gap`](skills/tune-ink-gap/SKILL.md) | 测量并校准文字可见笔画间距，支持真实设备验证 |
| [`uni-mp-analy`](skills/uni-mp-analy/SKILL.md) | 分析 Vue 2 / Vue 3 uni-app 小程序依赖，辅助优化打包体积 |
| [`wxmpurl-info`](skills/wxmpurl-info/SKILL.md) | 解析 wxmpurl.cn 短链中的小程序信息、页面路径和参数 |

### Rules

| 名称 | 作用域 | 说明 |
|------|--------|------|
| [`agent-global-baseline`](rules/agent-global-baseline.md) | 全局 | 统一语言、编码、目录检查和 Git 操作约定 |
| [`style-reference-clarify`](rules/style-reference-clarify.md) | 全局 | 参考已有样式时，先确认复用范围再修改代码 |

### MCP

| 名称 | 说明 |
|------|------|
| [`tinypng-mcp`](mcp/tinypng-mcp/README.md) | 通过 TinyPNG 官方 API 压缩和转换图片，需 API Key |
| [`tinypng-web-mcp`](mcp/tinypng-web-mcp/README.md) | 通过 TinyPNG 网页压缩图片，免 Key，仅建议学习 |
| [`sharp-image-mcp`](mcp/sharp-image-mcp/README.md) | 本地图片格式转换、画质调整与效果对比 |

## License

本仓库代码与文档采用 [MIT License](LICENSE)。涉及 TinyPNG 等第三方服务的资产，还需遵守对应服务条款及资产目录中的免责声明。
