---
name: generate-style-catalog
description: >-
  Scan a Vue feature module directory, extract CSS rules from SFC style blocks,
  and generate an interactive HTML style catalog grouped by component. Use when
  auditing component styles, copying CSS characteristics for a feature module,
  documenting design patterns, or when the user asks for a style inventory report.
x-skill-version: 1.0.0
x-source-repo: JUST-Limbo/limbo-ai-toolkit
x-source-path: skills/generate-style-catalog
---

# Generate Style Catalog

## 功能说明

扫描 Vue 功能模块目录下的 `.vue` 文件（及同目录 `.css` / `.scss` / `.less`），从 `<style>` 块中提取 CSS 规则，按组件分组，生成交互式 HTML 样式目录页面。

**适用场景**

- 盘点某个功能模块（如 `features/checkout/`）的样式特征
- 复制组件的选择器、属性声明或整条规则块
- 重构前梳理模块内样式分布，对照字体 / 边框 / 布局等分组

**不负责**

- 自动替换或统一样式（仅生成报告）
- 解析 Tailwind 工具类对应的 computed 值（仅列出类名本身，若写在 template 中不会提取）
- 展开 CSS 变量 `var(--token)` 的实际值
- 解析 SCSS 嵌套规则、mixins、变量运算（仅提取可静态解析的顶层规则）
- 扫描非指定目录（需通过 `--scan` 指定功能模块路径）

## 使用方法

### 1. 运行脚本（优先：直接引用，无需复制）

脚本零依赖，可从 Skill 目录**直接调用**，用绝对路径指向目标项目的功能模块目录与输出文件即可。**默认不必复制到目标项目。**

```powershell
# 示例：扫描登录功能模块
node "c:\code\limbo-ai-toolkit\skills\generate-style-catalog\scripts\generate-style-catalog.mjs" `
  --scan "c:\code\my-app\src\features\login" `
  --output "c:\code\my-app\login-style-catalog.html" `
  --title "登录模块样式目录" `
  --path-label "features/login"
```

Agent 执行时：先定位本 Skill 的 `scripts/generate-style-catalog.mjs` 绝对路径，再传入目标项目的 `--scan`、`--output` 等参数。

### 2. 可选：复制到目标项目

仅在以下情况再复制脚本到目标项目（例如 `scripts/generate-style-catalog.mjs`）：

- 用户明确要求纳入项目仓库
- 需要配 `npm run` 等固定命令
- 团队无 toolkit 路径、需离线独立运行

### 3. 确定扫描范围

用户说「某个功能模块」时，Agent 应：

1. 根据项目结构定位功能目录（常见：`src/features/<name>/`、`src/views/<name>/`、`src/modules/<name>/`）。
2. 若用户未指明模块名，列出候选目录或询问。
3. 将 `--scan` 指向该目录（递归扫描子目录中的 `.vue` 文件）。

### 4. 查看结果

用浏览器打开生成的 HTML。页面支持：

- 按组件（Vue 文件）分组展示
- 按属性类别 Tab 筛选（字体 / 颜色背景 / 边框 / 布局 / 形式效果 / 其他）
- 搜索选择器、属性名、属性值、文件路径
- 每条属性、每条规则提供「覆盖」「追加」两个操作
- **覆盖**：直接复制该条样式到剪贴板
- **追加**：选中到右侧面板（可多条汇总），再点「一并复制」
- 右侧简易预览（仅作参考，复杂选择器或依赖上下文时可能不准确）

### 5. Agent 执行流程

用户触发本 Skill 时，Agent 应：

1. 确认目标项目的**功能模块目录**及输出 HTML 路径。
2. **优先**定位本 Skill 的 `scripts/generate-style-catalog.mjs` 绝对路径并直接运行；**不要**默认复制到目标项目。
3. 按项目结构传入 `--scan`、`--output`、`--title`、`--path-label` 并运行。
4. 汇报：输出文件路径、扫描到的文件数、规则总数、属性总数。
5. 提示用户用浏览器打开 HTML 查看；若需纳入版本库，询问是否将 HTML 加入 `.gitignore`。

## 扫描规则

- **文件类型**：`.vue`（提取 `<style>` 块）、`.css`、`.scss`、`.less`
- **跳过目录**：`node_modules`、`dist`、`.git`
- **Vue SFC**：支持 `<style>`、`<style scoped>`；scoped 选择器中的 `[data-v-xxx]` 在展示时去除，并标注 scoped 徽章
- **@media / @supports**：嵌套规则会保留 media 上下文标注
- **属性分组**：字体、颜色/背景、边框、布局、形式/效果、其他

## 输出说明

每个规则卡片包含：

- 选择器（已规范化展示）
- scoped / @media 标记
- 按类别分组的属性列表（覆盖 / 追加）
- 规则块操作（覆盖 / 追加）
- 右侧已选样式面板（追加汇总、一并复制）
- 简易样式预览

## 典型对话示例

```text
/generate-style-catalog 扫描 features/checkout 生成样式目录
```

```text
帮我盘点登录模块的 CSS 样式特征，输出可批量复制的 HTML
```

```text
提取 src/views/order 目录下各组件的样式，按字体和边框分组展示
```
