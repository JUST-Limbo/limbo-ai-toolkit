# rules — 对外 Rule 库

本目录存放面向**其它项目**、可复用的规则与编码规约。创建、维护与版本治理见 [AGENTS.md](../AGENTS.md#rule创建维护与调用)；取用方式见根 [README.md](../README.md#取用方式)。

## 规则清单

| 文件 | 作用域 | 说明 |
|------|--------|------|
| [`agent-global-baseline.md`](agent-global-baseline.md) | 全局 | 跨项目通用的 Agent 基线（交流、代码、预检查、Git） |
| [`style-reference-clarify.md`](style-reference-clarify.md) | 全局 | 参考某处样式实现另一处时，一轮多选确认必抄样式点后再改代码 |

---

### `agent-global-baseline`

- 来源：`JUST-Limbo/limbo-ai-toolkit`
- 版本：见文件内 `x-rule-version` 与文末来源注释
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

规则正文：[`agent-global-baseline.md`](agent-global-baseline.md)。复制、frontmatter 调整、对照上游更新见根 [README.md §取用方式](../README.md#取用方式)。

#### Version Notes

**1.2.1**

- 正文末尾增加 HTML 来源注释（`x-source-repo` / `x-source-path` / `x-rule-version` / `x-source-url`），复制后仍可追踪上游。

**1.2.0**

- 规则文件改为「frontmatter + 纯正文」；功能说明、使用方法、版本历史外置到本 README。

**1.1.0**

- 合并 Git 章节（提交前检查 + 远程操作临时 proxy）。

**1.0.0**

- 初始版本。

---

### `style-reference-clarify`

- 来源：`JUST-Limbo/limbo-ai-toolkit`
- 版本：见文件内 `x-rule-version` 与文末来源注释
- 作用域：**全局**（始终加载，不绑定文件 glob）

#### 功能说明

当用户要求「参考 / 照着 / 对齐」某处 UI 或样式去实现另一处时，强制 Agent **先读参考源**、再**一轮多选**确认必抄样式点，然后改目标代码。**选了必抄，没选不代表不抄**。五类高权重分组（字体/背景/边框/布局/形式）仅为出题参考，**问哪几组、先问哪组由参考实现决定**。

**适用场景**

- 「参考首页 Hero 的样式做详情页顶栏」
- 「做成和某某组件一样」「跟设计稿/截图风格一致」
- 同时给出参考源与目标，但未说明具体要抄哪些样式点

**不负责的范围**

- 具体设计系统 token 或组件库的编码规约（另建专题 Rule）
- 从零做视觉设计、或无「参考源 → 目标」关系的普通 UI 改动
- 替代用户做审美决策；本规则只保证先问清范围再动手

#### 使用方法

规则正文：[`style-reference-clarify.md`](style-reference-clarify.md)。复制、frontmatter 调整、对照上游更新见根 [README.md §取用方式](../README.md#取用方式)。

取用到 Cursor 时建议 `alwaysApply: true`，以便自然语言触发时也能拦住「先改后问」。

#### Version Notes

**1.0.0**

- 初始版本：触发条件、先问后改、**先读参考源再定题**（五类高权重分组非必问）、「选了必抄 / 没选不代表不抄」、一轮 `AskQuestion` 分组多选（每组含 `本组无必抄项`）、点选完成后总结即开改、高权重分组与选项（示例）、AskQuestion 失败降级、确认后执行约定。
