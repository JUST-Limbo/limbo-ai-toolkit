# 贡献指南（CONTRIBUTING）

本仓库集中维护可复用的 AI 资产（Skill / Rule / MCP / 子 Agent / 命令等）。
新增或修改前，先按下面的核心原则归类，再遵守对应约定。治理性规则（版本保留、改码注释等）的完整说明见 [AGENTS.md](AGENTS.md)。

## 核心原则：先分「给谁用」

任何一样东西，先判断它**是给别的仓库用，还是给本仓库自己用**，二者放置规则完全不同：

| | 对外资产（可分发） | 项目本地配置（不分发） |
|---|---|---|
| **给谁用** | 别的项目复用 | 只在本仓库内生效 |
| **放哪** | 按类型命名的**顶层目录** | 各 AI 工具约定的**隐藏目录** |
| **举例** | `skills/`、`rules/`、`mcp/`、`agents/`、`commands/` | `.cursor/`、`.claude/`、`.github/` … |

同一种资产类型在两类里**成对存在**：

| 资产类型 | 对外资产 | 项目本地 |
|---------|---------|---------|
| Skill   | `skills/<name>/` | `.claude/skills/` 等 |
| Rule    | `rules/`         | `.cursor/rules/`、`.claude/rules/`、`.github/copilot-instructions.md` … |
| MCP     | `mcp/`           | `.cursor/mcp.json`、`.mcp.json` 等各工具 MCP 配置 |
| 子 Agent | `agents/`       | `.claude/agents/` |
| 命令     | `commands/`      | `.claude/commands/` |

> 顶层 `mcp/`、`agents/`、`commands/` 暂未建，需要时再加；没有内容前不建空目录。

---

## 一、对外资产（给别的仓库用）

放在顶层类型目录，是仓库对外提供的可复用资产。

### 新增一个 Skill

1. 在 `skills/<your-skill-name>/` 下新建 `SKILL.md`（可参照现有 skill 的结构）。
2. 填写 `SKILL.md`：
   - YAML 头：`name`、英文 `description`（便于工具检索）、`x-skill-version`（语义化版本，从 `1.0.0` 起）。
   - 正文必须含**中文的「功能说明」与「使用方法」**，英文 description 不能替代中文说明。
3. 在根 `README.md` 的「对外 Skills」清单中按现有风格补一条（功能 + use example）。

### 版本规则（对外资产通用）

- 采用语义化版本 `主.次.修订`。
- **每发布一个新版本**：先把当前 `SKILL.md` 全文快照到 `versions/<旧版本>/SKILL.md`（只增不改旧快照），
  再更新顶层 `SKILL.md` 为新版本，并改 `x-skill-version` 与「Version Notes」。
- 用户未指定版本时，一律以顶层最新 `SKILL.md` 为准。

### 新增 Rule / MCP / Agent / 命令

- 放进对应顶层目录（`rules/`、`mcp/`、`agents/`、`commands/`），目录尚不存在时新建。
- 同样要带清晰的中文说明，并在 README 相应清单补条目。

---

## 二、项目本地配置（给本仓库自己用）

只约束在本仓库里干活的 AI 工具行为（如提交信息格式），**不进顶层对外目录**。
团队用到的**每个 AI 工具各放一份**到它约定的固定路径：

| 工具 | 项目本地路径（以 Rule 为例） | 加载方式 |
|------|---------------------------|---------|
| Cursor | `.cursor/rules/*.mdc` | `alwaysApply: true` 始终加载 |
| Claude Code | `.claude/rules/*.md` | 无 `paths:` 启动即加载 |
| GitHub Copilot | `.github/copilot-instructions.md` | 仓库级自动加载 |
| Windsurf | `.windsurf/rules/*.md` | 规则文件加载 |
| 其它工具 | 该工具约定路径 | 以该工具**最新文档**为准 |

> 上表为常见示例；新增某工具时以其官方最新文档核对路径与加载规则，团队没用到的工具不必建目录。
> MCP / 子 Agent / 命令等其它类型的项目本地配置同理，各放进对应工具的约定路径。

**同步要求**：

- 同一条项目本地配置，凡是团队在用的工具，**每个都要有一份且正文一致**；改任意一份，**其余全部同步更新**。
- 改完后用 `diff` 逐一自查各份正文是否一致（仅扩展名/必要的工具专属 frontmatter 可不同）。

### 当前项目本地配置清单

暂无。新增项目本地配置时，按上述「同步要求」在各在用工具里各放一份，并在此登记。

---

## 命名约定

- 资产文件与目录统一 **kebab-case**（如 `git-branch-merge-flow`、`git-commit.md`）。
- 目录名、`name` 字段、README 条目三者保持一致。
