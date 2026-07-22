# 仓库约定（Agents）

本文档约束在本仓库中**创建、维护、调用** AI 资产（Skill / Rule / MCP / 子 Agent / 命令等）时的行为。执行与用户任务相关的 Skill 时，应完整遵守下列规则。

本仓库集中维护可复用的 AI 资产。新增或修改前，先按下面的核心原则归类，再遵守对应约定。

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

### 来源仓库标注（必做）

每条对外资产**必须**标明**来源仓库**，便于日后对照上游更新、同步版本。

| 字段 | 必填 | 说明 |
|------|------|------|
| `x-source-repo` | 是 | 来源仓库标识。推荐 `owner/repo`（如 `JUST-Limbo/limbo-ai-toolkit`）；也可用完整 HTTPS URL。 |
| `x-source-path` | 否 | 该资产在来源仓库中的路径（如 `skills/git-branch-merge-flow`）。从外仓迁入、或需与上游逐文件对照时**建议填写**。 |
| `x-source-version` | 否 | 最近一次从来源仓库同步或对照时的上游版本（tag、commit SHA 或语义化版本）。便于判断是否需要再同步。 |

**填写规则**：

- **本仓库原创**：`x-source-repo` 填本仓库（当前为 `JUST-Limbo/limbo-ai-toolkit`）；`x-source-path` 填该资产在本仓库中的路径。
- **从其它仓库迁入或 fork**：`x-source-repo` 填**上游**仓库；`x-source-path` 填上游中的对应路径；同步后更新 `x-source-version`。
- Skill 写在 `SKILL.md` YAML 头；Rule / MCP / Agent / 命令等写在文件 frontmatter，或无 frontmatter 时在正文开头用等价 YAML 块标注。

示例（本仓库原创 Skill）：

```yaml
x-source-repo: JUST-Limbo/limbo-ai-toolkit
x-source-path: skills/git-branch-merge-flow
```

示例（从外仓同步）：

```yaml
x-source-repo: org/upstream-toolkit
x-source-path: skills/some-skill
x-source-version: 2.1.0
```

根 `README.md` 的对外资产清单中，每条也应**简要注明来源**（至少 `owner/repo`）。

### 新增一个 Skill

1. 在 `skills/<your-skill-name>/` 下新建 `SKILL.md`（可参照现有 skill 的结构）。
2. 填写 `SKILL.md`：
   - YAML 头：`name`、英文 `description`（便于工具检索）、`x-skill-version`（语义化版本，从 `1.0.0` 起）、**`x-source-repo`**（及按需的 `x-source-path`、`x-source-version`，见上文「来源仓库标注」）。
   - 正文必须含**中文的「功能说明」与「使用方法」**，英文 description 不能替代中文说明。
3. 在根 `README.md` 的「对外 Skills」清单中按现有风格补一条（功能 + use example）。

Skill 的版本治理、改码注释、旧版本痕迹处理等细则见下文「Skill：创建、维护与调用」。

### 版本规则（对外资产通用）

- 采用语义化版本 `主.次.修订`。
- 用户未指定版本时，一律以顶层最新正文为准（Skill 即顶层 `SKILL.md`）。

### 新增 Rule / MCP / Agent / 命令

- 放进对应顶层目录（`rules/`、`mcp/`、`agents/`、`commands/`），目录尚不存在时新建。
- 同样要带清晰的中文说明、**来源仓库标注**（见上文），并在 README 相应清单补条目。
- Rule 的 `.md` 正文末尾加 HTML 来源注释（`<!-- x-source-repo` / `x-source-path` / `x-rule-version` / `x-source-url -->`），取用方去掉 frontmatter 复制后仍能对照上游更新；各 Rule 的功能说明与 Version Notes 写在 `rules/README.md`，通用取用方式见根 [README.md](README.md#取用方式)。
- Rule 的版本治理、取用同步、冲突优先级等细则见下文「Rule：创建、维护与调用」。

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

---

## Skill：创建、维护与调用

### 1. 新建 Skill 时的必备内容

创建或新增一个 Skill 时，**必须**在对应 `SKILL.md` 中增加**中文说明**，至少包含：

- **功能说明**：该 Skill 解决什么问题、适用场景、不负责的范围（如有）。
- **使用方法**：用户或 Agent 如何触发、需要哪些参数、典型示例（可含对话里的示例语句）。

英文的 `description`（YAML 头）仍建议保留，便于工具检索；但**不能**仅用英文替代上述中文说明。

### 2. 版本号与历史版本保留

- 每个 Skill **必须**带有**版本号**，推荐语义化版本 `主版本.次版本.修订号`（例如 `1.0.0`）。
- **每一个**曾发布过的版本都要**完整保留**一份可读的 Skill 正文（建议与当时 `SKILL.md` 内容一致），便于对照与审计。
- **默认调用规则**：用户未指定版本时，Agent **必须**以该 Skill 的**最新版本**为准执行（即当前仓库中约定为「当前生效」的那份说明与流程）。

#### 2.0 版本号只在「发布点」进位（重要）

「已发布」指该版本**已通过 git 提交**（进入版本历史）。仅存在于工作区、尚未提交的改动**不算**已发布。

- **同一次迭代只维护一个未提交版本**：在同一轮打磨里连续多次修改 `SKILL.md`（哪怕跨多轮对话），只要**尚未提交**，就**始终复用同一个版本号**，持续在该版本上修改，**不要**每改一次就升一个号。
- **到发布点才定版本 + 留快照**：当一轮迭代收敛、准备 `git commit` 时，才确定最终版本号，并在 `versions/<版本号>/SKILL.md` 建**一份**快照。发布点之前**不**创建中间快照。
- **禁止把过程当发布**：不得因为"用户又让改了一次"就自动升版本号、建新快照；这会制造 `1.5.0→1.5.1→1.6.0…` 一串未发布的噪音版本。
- **误建的中间版本应合并**：若已产生多个未提交的中间版本号/快照，应在提交前**合并为一个**干净版本（删除多余快照），只保留真正发布的那一个。

#### 2.1 推荐的目录与文件约定（示例）

所有 Skill 统一存放在 `skills/` 下，每个 Skill 一个目录（可按仓库习惯微调，但须满足「全量保留 + 默认最新」）：

- `skills/某个-skill/SKILL.md`：**始终**对应该 Skill 的**最新版本**全文（含中文说明与版本号字段）。
- `skills/某个-skill/versions/<版本号>/SKILL.md`：该版本的**完整快照**；发布新版本时**新增**子目录与文件，**不要**覆盖旧版本快照。

在 `SKILL.md` 的 YAML 头中增加版本字段 `x-skill-version`，例如：

```yaml
x-skill-version: 1.0.0
x-source-repo: JUST-Limbo/limbo-ai-toolkit
x-source-path: skills/某个-skill
```

> 用 `x-` 前缀表明这是本仓库自定义的扩展字段：它不属于 SKILL.md 官方 frontmatter，工具不会解析它，也不会与官方字段冲突。版本号、来源仓库等仅供本仓库治理与对照使用。

### 3. 会改动代码的 Skill：版本注释

对于**会直接修改业务或脚本代码**的 Skill（不仅限于改文档、改配置说明），在**完成代码改动后**，必须在**被改动的代码附近**增加**简短注释**，标明：

- 是哪个 Skill（可用 Skill 的 `name` 或目录名）。
- 使用的是**哪一个版本号**。

注释形式需与项目语言一致（例如 JavaScript 用 `//`，PHP 用 `//` 等），且避免冗长；同一文件多处由同一 Skill 同一版本改动时，可按项目习惯在文件头一处集中说明，或每处各标一次，但**必须**能追溯到 Skill 与版本。

### 4. 同一段代码上存在旧版本 Skill 痕迹时的处理

若在即将执行「会改动代码的 Skill」之前，发现目标代码区域**已经存在**由**旧版本**本 Skill 留下的版本注释（或仓库内可识别的等价标记），且当前将要执行的是**新版本**该 Skill：

1. Agent **必须先提示**用户：此处存在**旧版本 Skill** 作用过的痕迹，并简要指出依据（例如注释中的旧版本号、旧 Skill 名）。
2. Agent **必须询问**用户：本次应使用**哪一个版本**（沿用旧版本逻辑、仅升级到新版、或先人工清理再执行等，由用户明确选择）。
3. **在得到用户明确选择之前**，不要擅自按新版本覆盖执行可能造成语义冲突的批量修改。

用户明确指定使用某一版本后，Agent 仅按该版本对应的 Skill 说明执行；若用户指定「最新版」，则以本仓库中该 Skill 的**最新** `SKILL.md` 为准。

### 5. 与「默认用最新」的关系（简要）

- **未**发现旧版本痕迹，且用户未指定版本：使用**最新** Skill。
- **已**发现旧版本痕迹，且将用新版本改动同一区域：**必须先提示并询问**，不得默认静默升级。

### 6. README 同步维护

- 仓库根目录的 `README.md` 用于简短说明每个 Skill 的**功能**与**use example**。
- 后续每当新增 Skill（新增一个可用的 `SKILL.md` 主目录）时，Agent **必须**按 README 现有风格自动补充对应条目。
- 若 Skill 被删除或重命名，README 中对应条目也应同步更新，避免文档与仓库现状不一致。

---

## Rule：创建、维护与调用

### 1. 新建 Rule 时的必备内容

创建或新增一条**对外** Rule 时，内容分两处，职责不同：

**`rules/<name>.md`（可复制的规则正文）**

- YAML 头：`name`、英文 `description`（便于工具检索）、`x-rule-version`（语义化版本，从 `1.0.0` 起）、**`x-source-repo`**（及按需的 `x-source-path`、`x-source-version`）、`scope`（如 `global`，或注明文件 glob 作用域）。
- 正文从 `# 标题` 起为**可直接复制**的约束条文；**不要**在正文中间写功能说明、取用教程、版本历史——避免被取用方误当作约束加载。
- 正文末尾加 HTML 来源注释（`<!-- x-source-repo` / `x-source-path` / `x-rule-version` / `x-source-url -->`），取用方去掉 frontmatter 后仍能对照上游更新。

**`rules/README.md`（规则目录与条目说明）**

- 在规则清单表补一行（文件、作用域、简要说明）。
- 在该 Rule 条目下写**中文**说明，至少包含：
  - **功能说明**：该 Rule 解决什么问题、适用场景、不负责的范围（如有）。
  - **使用方法**：链到根 [README.md](README.md#取用方式) 的通用取用方式；若该 Rule 有特有用法（非通用路径/frontmatter），在此补充。
  - **Version Notes**：各已发布版本的变更摘要。

英文 `description` 仍建议保留，便于工具检索；但**不能**仅用英文替代上述中文说明。

### 2. 版本号与历史版本保留

- 每条 Rule **必须**带有**版本号**，推荐语义化版本 `主版本.次版本.修订号`（例如 `1.0.0`）。
- **每一个**曾发布过的版本都要**完整保留**一份可读的 Rule 正文（建议与当时 `rules/<name>.md` 内容一致），便于对照与审计。
- **默认取用规则**：用户未指定版本时，Agent **必须**以该 Rule 的**最新版本**为准（即当前 `rules/<name>.md` 与 frontmatter / 文末注释中的 `x-rule-version`）。

#### 2.0 版本号只在「发布点」进位（重要）

「已发布」指该版本**已通过 git 提交**（进入版本历史）。仅存在于工作区、尚未提交的改动**不算**已发布。

- **同一次迭代只维护一个未提交版本**：在同一轮打磨里连续多次修改同一条 Rule（哪怕跨多轮对话），只要**尚未提交**，就**始终复用同一个版本号**，持续在该版本上修改，**不要**每改一次就升一个号。
- **到发布点才定版本 + 留快照**：当一轮迭代收敛、准备 `git commit` 时，才确定最终版本号，并在 `rules/versions/<版本号>/<name>.md` 建**一份**快照；同步更新 frontmatter、`rules/README.md` 的 Version Notes 与文末 HTML 注释中的 `x-rule-version`。发布点之前**不**创建中间快照。
- **禁止把过程当发布**：不得因为「用户又让改了一次」就自动升版本号、建新快照；这会制造 `1.2.0→1.2.1→1.3.0…` 一串未发布的噪音版本。
- **误建的中间版本应合并**：若已产生多个未提交的中间版本号/快照，应在提交前**合并为一个**干净版本（删除多余快照），只保留真正发布的那一个。

#### 2.1 推荐的目录与文件约定（示例）

对外 Rule 统一放在 `rules/` 下，每条 Rule 一个 `.md` 文件（可按主题扩展，但须满足「全量保留 + 默认最新」）：

- `rules/<name>.md`：**始终**对应该 Rule 的**最新版本**全文（含 frontmatter、可复制正文与文末来源注释）。
- `rules/versions/<版本号>/<name>.md`：该版本的**完整快照**；发布新版本时**新增**子目录与文件，**不要**覆盖旧版本快照。
- `rules/README.md`：规则清单、各 Rule 的功能说明与 Version Notes；新增 / 删除 / 重命名 Rule 时同步更新。

在 frontmatter 中增加版本字段 `x-rule-version`，例如：

```yaml
name: agent-global-baseline
description: Global always-on baseline rules for AI agents
x-rule-version: 1.0.0
x-source-repo: JUST-Limbo/limbo-ai-toolkit
x-source-path: rules/agent-global-baseline.md
scope: global
```

正文末尾 HTML 注释示例（`x-rule-version` 须与 frontmatter 一致）：

```html
<!-- x-source-repo: JUST-Limbo/limbo-ai-toolkit
     x-source-path: rules/agent-global-baseline.md
     x-rule-version: 1.0.0
     x-source-url: https://github.com/JUST-Limbo/limbo-ai-toolkit/blob/main/rules/agent-global-baseline.md -->
```

> 用 `x-` 前缀表明这是本仓库自定义的扩展字段：各 AI 工具未必解析它们，仅供本仓库治理与取用方对照上游使用。

### 3. 项目本地 Rule 与对外 Rule

- **对外 Rule**（`rules/`）：写给**别的项目**复用；正文可复制到目标仓库或用户级配置路径。
- **项目本地 Rule**（`.cursor/rules/`、`.claude/rules/` 等）：只约束**本仓库**内 AI 工具行为；见上文「二、项目本地配置」的同步要求——团队用到的每个工具各放一份，正文一致。

通用取用路径、复制步骤与对照更新见根目录 [README.md](README.md#取用方式)（「Rules → 取用方式」）。从对外 Rule 复制时，**不要**把 `rules/README.md` 里的功能说明、Version Notes 抄进项目本地 Rule 正文。

### 4. 取用方仓库中存在旧版本 Rule 痕迹时的处理

若在目标仓库准备**更新或合并**某条 Rule，且本地已存在该 Rule（例如文末 HTML 注释或 frontmatter 中有**旧** `x-rule-version`），而即将写入的是**新版本**：

1. Agent **必须先提示**用户：此处存在**旧版本 Rule**，并简要指出依据（例如注释中的旧版本号、文件名）。
2. Agent **必须询问**用户：本次应**保留本地改动**、**整文件替换为上游最新**，还是**人工 diff 后再合并**。
3. **在得到用户明确选择之前**，不要擅自用新版本覆盖可能造成冲突的本地定制内容。

用户明确指定使用某一版本后，Agent 以该版本对应的 Rule 正文为准；若指定「最新版」，则以本仓库中该 Rule 的**最新** `rules/<name>.md` 为准。

### 5. 加载优先级与冲突

- **更具体的 Rule 优先于更通用的 Rule**（例如某语言的专题 Rule 优先于 `agent-global-baseline` 这类全局 Rule）。
- 项目本地 Rule 与从本仓库复制的对外 Rule 若主题重叠，以**项目本地**、**路径/ glob 更具体**的为准，除非用户明确要求以本仓库最新版覆盖。
- Agent 进入「动作链」前，仍须完成目标目录的规则预检查（见各 Rule 正文中的约定）；不得用全局 Rule 替代更具体的目录级 Rule。

### 6. README 同步维护

- **`rules/README.md`**：每条对外 Rule 须有清单条目，以及功能说明、Version Notes；新增 / 删除 / 重命名 Rule 时同步更新。
- **根目录 `README.md`**：维护「Rules → 取用方式」；每条 Rule 补简要说明（功能 + use example + 指向 `rules/README.md` 详情）；Rule 删除或重命名时同步更新。

---

若本仓库后续对目录结构或版本字段名有统一约定，应更新本文档并保持与各 Skill / Rule 目录一致。
