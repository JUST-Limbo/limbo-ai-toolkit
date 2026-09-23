---
name: tune-ink-gap
description: Calibrate visible text-to-element spacing when CSS margin copied from a design looks too large. Reuse matching project-local text measurements, or measure the rendered line box and font size, then estimate and visually refine the margin.
metadata:
  x-skill-version: "1.0.0"
  x-source-repo: "JUST-Limbo/limbo-ai-toolkit"
  x-source-path: "skills/tune-ink-gap"
---

# Tune Ink Gap

## 功能说明

设计稿标注的是文字**可见笔画**到相邻元素的间距，CSS `margin` 控制的是**元素盒子**之间的间距。文字行框通常高于可见笔画，直接把标注值写成 `margin`，视觉间距容易偏大。本 Skill 用实际渲染的盒高和字号估算留白，辅助校准文字与图片、文字与文字之间的间距。

## 使用方法

适用于“标题到图片的间距比设计稿大”“两段文字的 `margin` 照抄标注值却不准”等情况。

1. 确认设计稿标注的是可见笔画间距，并取得对应的页面目标值；定位产生盒间距的 `margin`。保留页面实际生效的 `line-height`。
2. 先查目标项目已有的文字测量记录，默认位置为 `docs/tune-ink-gap.md`；若项目已有设计度量文档，沿用其位置。仅当字体及加载状态、`font-size`、`font-weight`、`font-style`、生效的 `line-height` 和渲染环境（浏览器、操作系统）匹配，且记录的是无上下 `padding`、边框的单行盒高时，复用其单侧留白估算值；有疑问就重测。
3. 未命中时，在目标环境字体加载后临时用 `console.log` 输出相关文字的实际盒高、`font-size`、生效的 `line-height` 和相邻盒间距，请用户复制日志回填给 Agent。多行文字另测同样式的**单行盒高**，不要将整段盒高代入公式。将单行盒高、字号、`(单行盒高 - font-size) / 2`、上述匹配条件和测量环境记入目标项目记录；首次需要时才创建文件，不缓存最终 `margin`。
4. Agent 用缓存命中值或新测结果估算单侧留白。文字到图片时，先试 `margin = 目标可见间距 - 文字下侧估算留白`；文字到文字时，再减去后一段文字上侧的估算留白。以实测盒间距为准，留意外边距折叠。
5. 对照设计稿微调 `margin`，复查多行、窄屏及目标字体环境，完成后移除临时日志。该公式估算的是行框相对字号多出的空间，并非可见笔画边缘的精确位置；字体、字形及图片内留白可能影响结果。没有视觉对照时，不宣称已精确还原。

修改代码时，在改动附近注释本 Skill 名称和当前版本；若已有旧版本标记，先与用户确认采用的版本。
