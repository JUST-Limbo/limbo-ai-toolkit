---
name: generate-color-palette
description: >-
  Scan frontend source for hex/rgb/oklch colors and generate an interactive HTML
  palette grouped by spectrum. Use when auditing project colors, consolidating
  design tokens, finding duplicate hex values, or when the user asks for a
  color palette report or color inventory.
x-skill-version: 1.1.1
x-source-repo: JUST-Limbo/limbo-ai-toolkit
x-source-path: skills/generate-color-palette
---

# Generate Color Palette

## 功能说明

扫描前端源码中的颜色值（`#hex`、`rgb()` / `rgba()`、`oklch()`），去重后按色谱分组排序，生成交互式 HTML 色板页面。

**适用场景**

- 梳理项目实际使用的颜色，发现重复或近似色值
- 设计系统审计、色板文档化
- 重构前盘点硬编码颜色分布

**不负责**

- 自动替换或统一颜色（仅生成报告）
- 解析 CSS 变量名（只提取字面量色值）
- 扫描非前端目录（需通过 `--scan` 指定）

**实现来源**：逻辑源自 StockBuddy 项目的 `frontend/scripts/generate-color-palette.mjs`，已参数化以便跨项目复用。

## 使用方法

### 1. 运行脚本（优先：直接引用，无需复制）

脚本零依赖，可从 Skill 目录**直接调用**，用绝对路径指向目标项目的扫描目录与输出文件即可。**默认不必复制到目标项目。**

```powershell
# 示例：本机 toolkit 路径 + 目标项目路径（按实际修改）
node "c:\code\limbo-personal-skills\skills\generate-color-palette\scripts\generate-color-palette.mjs" `
  --scan "c:\code\my-app\frontend\src" `
  --output "c:\code\my-app\frontend\color-palette.html" `
  --title "MyApp 项目色板" `
  --path-label "frontend/src"
```

Agent 执行时：先定位本 Skill 的 `scripts/generate-color-palette.mjs` 绝对路径，再传入目标项目的 `--scan`、`--output` 等参数。

### 2. 可选：复制到目标项目

仅在以下情况再复制脚本到目标项目（例如 `scripts/generate-color-palette.mjs`）：

- 用户明确要求纳入项目仓库
- 需要配 `npm run` 等固定命令
- 团队无 toolkit 路径、需离线独立运行

复制后在目标项目目录执行：

```bash
node scripts/generate-color-palette.mjs
```

默认：扫描 `./src`，输出 `./color-palette.html`，页面标题「项目色板」。

**常用参数**

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--scan <dir>` | 扫描目录 | `./src` |
| `--output <file>` | 输出 HTML 路径 | `./color-palette.html` |
| `--title <text>` | 页面标题 | `项目色板` |
| `--path-label <text>` | 页头显示的扫描路径标签 | `src` |

### 3. 查看结果

用浏览器打开生成的 HTML。页面支持：

- 按色谱 Tab 筛选（红 / 橙 / 黄 / 绿 / 青 / 蓝 / 紫 / 品红 / 中性 / OKLCH）
- 搜索色值或文件路径
- 点击色块复制色值
- 内置取色器

### 4. Agent 执行流程

用户触发本 Skill 时，Agent 应：

1. 确认目标项目的源码目录（常见：`src`、`frontend/src`、`app`）及输出 HTML 路径。
2. **优先**定位本 Skill 的 `scripts/generate-color-palette.mjs` 绝对路径并直接运行；**不要**默认复制到目标项目。
3. 仅当用户明确要求纳入项目、或需 `npm run` / 离线独立运行时，才复制脚本到目标项目。
4. 按项目结构传入 `--scan`、`--output`、`--title`、`--path-label` 并运行。
5. 汇报：输出文件路径、扫描到的颜色总数、重复色值较多的条目（如有）。
6. 提示用户用浏览器打开 HTML 查看；若需纳入版本库，询问是否将 HTML 加入 `.gitignore`。

## 扫描规则

- **文件类型**：`.vue`、`.ts`、`.tsx`、`.js`、`.jsx`、`.css`、`.scss`、`.less`
- **跳过目录**：`node_modules`、`dist`、`.git`
- **提取模式**：行内匹配 hex / rgb(a) / oklch 字面量
- **分组逻辑**：hex/rgb 转 HSL 后按色相分段；低饱和度或极亮/极暗归为中性色；`oklch()` 单独一组；**同色系内按明度从浅到深排序**

## 输出说明

每个颜色卡片包含：

- 色值与引用次数
- 出现该色的源文件路径（相对 `--scan` 目录）
- 所属色谱分组

## 典型对话示例

```text
/generate-color-palette 扫描 frontend/src 生成色板
```

```text
帮我盘点这个项目用了哪些颜色，生成 HTML 报告
```

```text
找出项目里重复的 hex 色值，按色谱分组展示
```
