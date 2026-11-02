---
name: tune-ink-gap
description: >-
  Calibrate visible text-to-element spacing when CSS margin copied from a design looks too large.
  Reuse matching measurements or inspect the target browser. For real-device testing, run a temporary
  LAN collector and automatically report page measurements without installing project dependencies.
metadata:
  x-skill-version: "1.2.0"
  x-source-repo: "JUST-Limbo/limbo-ai-toolkit"
  x-source-path: "skills/tune-ink-gap"
---

# Tune Ink Gap

## 功能说明

当设计稿标注的是文字**可见笔画**到相邻元素的间距时，CSS `margin` 控制的**元素盒子**间距可能与之不同。文字行框通常高于可见笔画，直接照抄标注值，视觉间距容易偏大。本 Skill 用实测单行盒高和字号估算留白，辅助校准文字与图片、文字与文字之间的上下间距。

## 获取数据的方式

1. **浏览器自动化读取**：优先通过已有浏览器自动化工具直接读取目标页面的测量数据。
2. **局域网采集回传**：自动化读取受阻、不稳定，或需要真实设备测量时，按[局域网采集操作](references/lan-collection.md)自动回传结果。
3. **控制台日志回传**：自动采集不可用时，按[控制台日志操作](references/console-collection.md)执行一次性代码，由用户回传结果。

## 触发示例

- “用 tune-ink-gap 测量手机页面标题 `.page-title` 到封面 `.cover` 的间距，目标为 20 CSS px。”
- “tune-ink-gap 文章正文和文章标题二者间距设置为20px”

## 使用方法

### 1. 确认目标

取得目标页面、相邻元素和设计稿的可见间距，统一为页面 CSS px；定位控制间距的 `margin`、`padding`，保留实际生效的 `line-height`。考虑目标浏览器的兼容性，优先使用 `margin`、`padding` 调整间距，避免新增布局 `gap`。

### 2. 获取测量值

优先查 `docs/tune-ink-gap.md` 或已有设计度量文档，按字体、字号和行高复用留白估算值；没有对应记录或实际效果偏差明显时，按[获取数据的方式](#获取数据的方式)重新测量，不默认向业务项目安装依赖。

测量前等待元素、字体和相邻图片准备完成。多行文字使用同样式的单行探针盒高；取得本次目标页面的有效测量结果后，再用于计算。

### 3. 计算并调整

```text
单侧估算留白 =（单行盒高 − 字号）÷ 2
文字到图片的建议盒间距 ≈ 目标可见间距 − 文字下侧估算留白
文字到文字的建议盒间距 ≈ 目标可见间距 − 前文下侧估算留白 − 后文上侧估算留白
```

`suggestedBoxGap` 表示建议盒间距；结合已有 `margin`、容器 `padding` 和外边距折叠关系调整 CSS，不能直接当作最终属性值。使用 `padding` 时保持被测文字盒无上下内边距，可调整已有外层容器。

### 4. 汇报与收尾

- 向调用者汇报目标间距、测量或复用的数据、留白估算值及最终 CSS 调整结果；Agent 不执行视觉效果校验。
- 将单行盒高、字号、估算留白及匹配条件记入项目测量文档；首次需要时创建，不缓存最终 `margin`。
- 移除临时脚本入口和代理配置，关闭采集服务，按需保留原始报告。

## 测量边界

- 适用于自然高度、无上下 `padding` / 边框的横排纯文本盒；固定高度、富文本或实际变换/缩放需另行测量。恒等矩阵及等效不缩放的倍率允许通过。
- 公式估算行框相对字号多出的空间，不精确测量笔画边缘；字体、字形和图片内部留白可能影响最终效果。
- 汇报数据来源及测量环境，区分复用值和本次实测值，不将估算结果表述为视觉效果已验证或精确还原。
