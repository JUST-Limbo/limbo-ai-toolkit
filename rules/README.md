# rules — 对外 Rule 库

本目录存放面向**其它项目**、可复用的规则与编码规约。创建、维护、版本、取用与加载优先级等约定见 [AGENTS.md](../AGENTS.md#rule创建维护与调用)。

## 规则清单

| 文件 | 作用域 | 说明 |
|------|--------|------|
| [`agent-global-baseline.md`](agent-global-baseline.md) | 全局 | 跨项目通用的 Agent 基线（交流、代码、预检查、Git） |

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

规则正文：[`agent-global-baseline.md`](agent-global-baseline.md)。复制、frontmatter 调整、对照上游更新见 [AGENTS.md §3](../AGENTS.md#3-项目本地-rule-与对外-rule)。

#### Version Notes

**1.2.1**

- 正文末尾增加 HTML 来源注释（`x-source-repo` / `x-source-path` / `x-rule-version` / `x-source-url`），复制后仍可追踪上游。

**1.2.0**

- 规则文件改为「frontmatter + 纯正文」；功能说明、使用方法、版本历史外置到本 README。

**1.1.0**

- 合并 Git 章节（提交前检查 + 远程操作临时 proxy）。

**1.0.0**

- 初始版本。
