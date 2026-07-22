---
name: style-reference-clarify
description: >-
  When asked to copy or adapt UI/style from one place to another, use one round
  of multi-select choices to confirm what must be copied before editing code
x-rule-version: 1.0.0
x-source-repo: JUST-Limbo/limbo-ai-toolkit
x-source-path: rules/style-reference-clarify.md
scope: global
---

# 样式参考澄清

## 触发条件

用户意图属于下列任一情况时，本规则生效（不要求原话一致）：

- 「参考 / 照着 / 抄 / 对齐 / 仿」某处（页面、组件、截图、设计稿、已有文件）的样式，去实现或改造另一处
- 「做成和某某一样 / 跟某某风格一致 / 复用某某的 UI」
- 同时给出参考源与目标，但未说明具体要抄哪些样式点

## 硬性约束

1. **先问后改**：触发后，在用户完成本轮样式点选之前，**禁止**开始改目标处的代码、样式或布局。
2. **选了必抄**：用户勾选的每一项，执行时**必须**从参考源对齐到目标；不得遗漏、降级或擅自替换为近似方案。
3. **没选不代表不抄**：未勾选的项**不表示禁止抄**；Agent 可结合「参考某处样式」的整体意图自行判断是否一并对齐，但不得以未选项为由跳过已勾选项。
4. **每组可不选**：每一组题目语义上**均允许零必抄项**；某组没有必抄项，不表示该组全部禁止抄，也不要求用户「每组至少选一项」样式点。因 `AskQuestion` 多题 UI 常要求每组至少点选一项才能继续，**每组须额外提供** `本组无必抄项` 选项供用户显式跳过；选该项表示该组无必抄项，**不是**必抄样式点。
5. **禁止替用户勾选**：不得默认假定用户要抄哪些点；须由用户在本轮选择中明确勾选。
6. **先读参考源再定题目**：触发后须先阅读**参考源**代码/样式实现，再决定本轮要问哪些分组、各组出哪些选项、`questions` 数组中的**先后顺序**；不得未读参考源就按固定模板出题。
7. **用户已说清则可跳过提问**：若用户在同一条消息里已逐项写明**必须抄**的样式点，可直接执行，无需再问一遍。

## 提问方式

1. **一轮收集、按参考源定题**：用**一次** `AskQuestion` 完成收集；在 `questions` 数组中按**分组**拆成多道多选题（每组 `allow_multiple: true`）。**须先读参考源代码/样式**，再决定：问哪几组、每组有哪些选项、`questions` 的先后顺序——**不是五组必问**。下文五组（字体 / 背景 / 边框 / 布局 / 形式）仅为**高权重参考分类**与选项示例：参考实现里明显涉及的优先出组、优先排前；未涉及的可不出该组；参考实现里的特殊样式可增补新组或新选项。组标题即分组，组内不必再加 `[字体]` 等前缀。**每一组末尾须提供** `本组无必抄项`；题面写清「可多选；无必抄项请选“本组无必抄项”」。**每项样式选项须带对应 CSS 属性名**（`本组无必抄项` 除外）。**禁止**拆成多条助手消息逐轮追问，**禁止**用 Markdown 清单、编号列表代替选择题 UI。
2. **参考源或目标未明时**：若路径/组件名不清楚，在同一次 `AskQuestion` 的 `questions` 数组**最前面追加**一道单选题（如列出候选文件供点选）；仍算同一轮。
3. **选项要短、可执行，且带 CSS 属性名**：每项样式点须同时包含**中文说明**与 **CSS 属性名**（伪类/伪元素用 `:hover`、`::before` 等标注）；格式示例：`字号（font-size）`。每组固定提供 `本组无必抄项`（无 CSS 属性名），与具体样式点区分。若用户同组既选 `本组无必抄项` 又选具体样式点，**以具体样式点为准**，忽略 `本组无必抄项`。全部分组中至多保留一项「其它（我稍后打字说明）」作为补充。
4. **无 `AskQuestion` 时的降级**：若当前会话未挂载该工具，用一两句极短白话请用户按分组缩写回复必抄项（如 `字体:字号,颜色 | 背景:hover`），仍禁止长清单墙；一旦工具可用，必须改回分组选择题 UI。
5. **`AskQuestion` 失败时的降级**：不可用或调用失败时，同轮内用**同一分组结构**重试 1 次；仍失败则走第 4 条白话兜底。用户取消或未作答时说明等待确认，**禁止**默认开改。

## 高权重分组与选项（示例，非必问清单）

下列五组**不是每轮都要问**，而是**高权重参考分类**：Agent 读参考源后，优先从这些维度提炼题目；参考实现里突出的组先问、排前，无关组可省略，特殊实现可增补新组。

组内选项**仅为示例**；实际出题时只列参考源里**真实存在**的样式点，可增补、删减或改写表述；**每项均须带 CSS 属性名**（见上文格式）。

### 字体相关（示例）

- 字号（`font-size`）
- 字体族（`font-family`）
- 字体颜色（`color`）
- 字重（`font-weight`）

### 背景相关（示例）

- 背景色（`background-color`）
- hover 背景色（`:hover` `background-color`）
- 激活态背景色（`:active` `background-color`）
- focus 背景色（`:focus` `background-color`）
- disabled 背景色（`:disabled` `background-color`）

### 边框相关（示例）

- 边框颜色（`border-color`）
- 边框宽度（`border-width`）
- 边框样式（`border-style`）
- 圆角（`border-radius`）

### 布局相关（示例）

- 内外边距（`margin`, `padding`）
- 宽高约束（`width`, `height`, `min-width`, `max-width`, `min-height`, `max-height`）
- 对齐方式（`text-align`, `align-items`, `justify-content`）
- 分栏 / 栅格（`display`, `grid`, `flex`, `gap`）
- 响应式断点（`@media`）
- DOM / 组件结构（结构层级；涉及 `display`, `flex-direction`, `grid-template` 等）

### 形式相关（示例）

- 阴影（`box-shadow`, `text-shadow`）
- 透明度（`opacity`）
- 图标风格与尺寸（`width`, `height`, `fill`, `stroke`）
- hover / focus / active 等非背景态样式（`:hover`, `:focus`, `:active` 等状态下的 `color`, `border-color`, `text-decoration` 等）
- 过渡 / 动画（`transition`, `animation`）

增补分组示例：「内容相关：文案层级（`font-size`, `line-height`）」「交互相关：点击区域（`cursor`）」——当参考实现需要、且高权重五组未覆盖时使用。无论沿用、调整或新增，均须仍在一轮 `AskQuestion` 内呈现。

## 确认后的执行

用户完成本轮点选（或白话兜底给出必抄项）后，Agent **无须等待**用户再说「可以开始改了」等确认语；应**先简要总结**已确认的必抄项，**随即开始**读取参考源与目标并改代码。

- **已勾选项**：逐项从参考源提取并对齐到目标；总结后**立即执行**，改完后在回复中列出落实清单。
- **某组选了「本组无必抄项」**（且未同选该组具体样式点）：该组无必抄项；Agent 仍可结合整体「参考」意图自行对齐该组相关样式。
- **某组零勾选**（仅当 UI 允许完全不点时）：同上，该组无必抄项。
- **未勾选项**（组内有选项但未选）：不作为「禁止抄」依据；若一并对齐了，在回复中简要说明；若未动，无需逐条声明「未抄」。
- **须停下等待用户的情况**：用户取消/未作答点选、参考源或目标路径仍不明、已勾选项与技术栈/设计系统/品牌约束冲突——上述情形**禁止**开改，须说明原因并请用户选择。

<!-- x-source-repo: JUST-Limbo/limbo-ai-toolkit
     x-source-path: rules/style-reference-clarify.md
     x-rule-version: 1.0.0
     x-source-url: https://github.com/JUST-Limbo/limbo-ai-toolkit/blob/main/rules/style-reference-clarify.md -->
