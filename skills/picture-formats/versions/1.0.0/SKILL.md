---
name: picture-formats
description: >-
  Implement multi-format image delivery with parallel AVIF/WebP/JPEG or PNG
  exports and HTML picture element selection. Use when adding responsive image
  formats, picture tags, Vue image components, transparent logo fallbacks,
  Network debugging for image requests, or preparing multi-format assets with
  tinymcp/sharp/build scripts.
x-skill-version: 1.0.0
x-source-repo: JUST-Limbo/limbo-ai-toolkit
x-source-path: skills/picture-formats
---

# Picture Formats

## 功能说明

指导从**同一份高质量源图**并行导出多种格式（AVIF / WebP / JPEG 或 PNG），在网页上用 `<picture>` 让浏览器**只下载其中一种**，兼顾体积与兼容性。

**适用场景**

- 营销页 hero、内容站大图、产品图等资源优化
- 在 HTML / Vue / React 中接入 `<picture>` 多格式选型
- 透明 Logo、镂空 UI 的多格式兜底（PNG/WebP，不用 JPEG）
- DevTools Network 排错：为何看到多条图片请求
- 构建期或对话中准备 `avif + webp + jpg/png` 素材

**不负责**

- 串联有损转码（`PNG → AVIF → WebP → JPEG`）
- 图片 CDN 协商式分发（`Accept` 头）的完整接入方案（仅作备选说明）
- 用 `tinynokeymcp` 产出 AVIF/WebP（该 MCP 仅压 PNG/JPG，无转格式）

## 使用方法

用户触发本 Skill 时，Agent 应：

1. **判断场景**：照片 / 透明图 / UI 截图 / 内网老环境，确定格式组合（见下文「选型决策」）。
2. **确认素材来源**：是否已有各格式文件；若没有，按「素材准备」从同一源并行导出。
3. **实现页面**：用**一个** `<picture>` + **一个** `<img>` 兜底；Vue 等框架中 import 多个 URL 不等于下载多个。
4. **透明检查**：有 alpha 则兜底用 PNG 或 WebP，**禁止** JPEG 兜底。
5. **验证**：DevTools → Network → Img → 硬刷新；单图单 `<picture>` 通常只有 **1** 条图片请求。
6. **发布前自检**：走「选型清单」。

## 核心概念

### 是什么

```
                    ┌─ hero.avif   （现代浏览器，体积通常最小）
原图（高质量源） ──┼─ hero.webp   （兼容更广）
                    └─ hero.jpg    （照片兜底，几乎都能解码）

用户访问时：只下载其中 1 个文件，不是 3 个都下。
```

- **多格式分发** = 同源**并行**多文件 + 浏览器**备选一**
- 每种格式从**同一源**各压/各转**一次**

### 不是什么

| 避免 | 推荐 |
|------|------|
| 串联转码：`原图 → AVIF → WebP → JPEG`（画质叠损、浪费额度） | 并行导出 + `<picture>` 选型 |
| 三个 `<img>` 各挂一种格式（会下三个） | 一个 `<picture>` + 一个 `<img>` |
| 演示页同时展示三格式对照（调试用） | 生产环境只保留一个 `<picture>` |

体积大致趋势（同画质照片）：`AVIF < WebP < JPEG << PNG`

## 选型决策

### 格式能力

| 格式 | 透明 | 适合 |
|------|------|------|
| AVIF | 支持 | 照片、大图、追求极致体积 |
| WebP | 支持 | 照片 + 透明、兼容折中 |
| JPEG | **不支持** | 照片兜底 |
| PNG | 支持 | UI、截图、透明兜底 |
| SVG | 支持 | 简单图标、Logo 矢量 |

### 按场景选组合

| 场景 | 建议组合 |
|------|----------|
| 营销页 hero、大图 | AVIF + WebP + JPEG |
| 普通内容站 | WebP + JPEG 往往够用 |
| Logo / 镂空 UI | AVIF + WebP + **PNG**（不用 JPEG） |
| 内网 / 老系统 | 只 JPEG |
| API 额度紧张 | 本地 sharp 出格式；TinyPNG 只压最终 1～2 种 |

### 决策树

```
有没有透明？
  ├─ 是 → AVIF + WebP + PNG（或 WebP 单独也可）
  └─ 否 → 是照片吗？
         ├─ 是 → AVIF + WebP + JPEG
         └─ 否（UI/线条/截图）→ PNG 或 SVG；简单图标优先 SVG
```

## HTML 实现

### 标准写法（照片类）

```html
<picture>
  <source srcset="images/hero.avif" type="image/avif" />
  <source srcset="images/hero.webp" type="image/webp" />
  <img
    src="images/hero.jpg"
    alt="活动横幅"
    width="1200"
    height="630"
    loading="lazy"
  />
</picture>
```

浏览器从上到下检查 `<source type>`，能解码则用该 `srcset`；否则落到 `<img src>`。**只发一次图片请求。**

`type` 属性很重要：不支持的格式可直接跳过，不必先下载试探。

### 透明图兜底

```html
<picture>
  <source srcset="logo.avif" type="image/avif" />
  <source srcset="logo.webp" type="image/webp" />
  <img src="logo.png" alt="Logo" />
</picture>
```

JPEG 从标准上**不支持**透明；透明 PNG 强转 JPEG 会铺实色底、半透明边缘出丑边，且不可逆。

### 布局

`<picture>` 是包装，占位靠内部 `<img>`。全宽时常用：

```css
picture {
  display: block;
  width: 100%;
}
picture img {
  display: block;
  width: 100%;
  height: auto;
}
```

`width` / `height` 仍写在 `<img>` 上以防 CLS。

## Vue 3 实践

```vue
<script setup>
import heroAvif from '@/assets/hero.avif'
import heroWebp from '@/assets/hero.webp'
import heroJpg from '@/assets/hero.jpg'
</script>

<template>
  <picture>
    <source :srcset="heroAvif" type="image/avif" />
    <source :srcset="heroWebp" type="image/webp" />
    <img
      :src="heroJpg"
      alt="活动横幅"
      width="1200"
      height="630"
      loading="lazy"
    />
  </picture>
</template>
```

- 三个 `import` 只是构建期拿 URL；运行时浏览器仍只选一种请求
- **错误**：三个 `<img>` 各绑一种格式 → 会下三个

### 可复用组件（推荐）

```vue
<!-- PictureImage.vue -->
<script setup>
defineProps({
  avif: { type: String, default: '' },
  webp: { type: String, default: '' },
  src: { type: String, required: true },
  alt: { type: String, default: '' },
  width: { type: [String, Number], default: undefined },
  height: { type: [String, Number], default: undefined },
  loading: { type: String, default: 'lazy' },
})
</script>

<template>
  <picture class="picture-image">
    <source v-if="avif" :srcset="avif" type="image/avif" />
    <source v-if="webp" :srcset="webp" type="image/webp" />
    <img :src="src" :alt="alt" :width="width" :height="height" :loading="loading" />
  </picture>
</template>

<style scoped>
.picture-image { display: block; width: 100%; }
.picture-image img { display: block; width: 100%; height: auto; }
</style>
```

React 等项目同理：`import` 拿 URL，DOM 层仍用 `<picture>`。

## Network 排错

**正常**：一个 `<picture>` → Img 过滤器里通常 **1** 条请求（`demo.avif` 或 `demo.webp` 或 `demo.jpg`）。

**为何会看到多种格式都被请求**

| 原因 | 说明 |
|------|------|
| 多个 `<img>` 各写一种格式 | 页面写法问题，不是 picture 失效 |
| 对照区同时展示三格式 | 演示用途；线上不要 |
| `new Image()` 预加载多个 URL | 脚本主动预加载 |
| 多个 `link rel=preload` | LCP 大图只 preload 一种最优格式 |
| 软刷新 / 缓存 | 用硬刷新（Ctrl+Shift+R）排除 |

**import 三个文件 ≠ 加载三个文件** — 是否请求取决于 DOM 里最终会下载的地址。

## 素材准备

工作流：

```
设计导出 / 摄影原图
       ↓
构建脚本（sharp、Vite 插件）或 tinymcp 并行生成 avif + webp + jpg/png
       ↓
（可选）TinyPNG 再压一遍
       ↓
页面 <picture> 引用
```

### 方式对比

| 方式 | 说明 |
|------|------|
| 构建时静态生成（**推荐**） | Vite/Webpack 插件、npm script + sharp；不占 TinyPNG 额度 |
| `<picture>` 前端选型 | 最简单，不依赖 CDN |
| tinymcp（本仓库 MCP） | 官方 API，须 `TINIFY_API_KEY`；每种目标格式各计 1 次额度 |
| CDN Accept 协商 | 一个 URL，服务端按 `Accept` 返回格式 |

### tinymcp CLI 示例

本仓库路径：`mcp/tinymcp/`（v2.2.0）。复制 `dist/tinymcp-cli.cjs` 到目标项目 `.cursor/tinymcp/` 后：

```bash
# 单张转 WebP
node .cursor/tinymcp/tinymcp-cli.cjs logo.png -f webp

# 单张并行导出 avif + webp + jpg 到 dist/
node .cursor/tinymcp/tinymcp-cli.cjs hero.jpg -F avif,webp,jpg -o dist
```

MCP Tools：`convert_local_image_formats`（单张多格式）、`convert_images_glob`（批量）。

**注意**：`avif,webp,jpg` 三格式 ≈ **3 次** API 额度；免费账户约 500 次/月/账户。

### tinynokeymcp 的限制

免 Key、仅学习/临时：只能压 PNG/JPG，**不能**产出 AVIF/WebP，**不能**做多格式分发素材准备。

## 常见误区

| 误区 | 正解 |
|------|------|
| AVIF→WebP→JPEG 是推荐压缩链 | 那是浏览器**降级顺序**；应并行从源图各出一份 |
| import 几个格式就会下几个 | 只有 DOM 里多个可请求地址才会多下 |
| 透明图兜底用 JPEG | 用 PNG 或 WebP |
| 多格式 = 页面放三张图对照 | 对照是调试手段；生产只用一个 picture |
| 每张图都上 AVIF+WebP+JPEG | 按场景选；内网/小图可只一种格式 |

## 选型清单（发布前）

1. 有没有透明 / 镂空？→ 有则兜底 PNG/WebP，不用 JPEG
2. 是照片还是 UI/截图？→ 照片 JPEG 兜底；UI 考虑 PNG/SVG
3. 是否用 `<picture>` + 一个 `<img>`？
4. Network 硬刷新后 Img 是否只有 1 条？（单图单 picture）
5. `img` 是否写了 `width` / `height` 防布局偏移？
6. 各格式是否都从**同一源**导出，而非串联转码？
7. LCP 大图是否只 preload 一种格式？

## 典型对话示例

```text
给这个 hero 图加上 AVIF/WebP/JPEG 多格式分发
```

```text
Vue 3 里怎么用 picture，import 三个格式会不会下三个？
```

```text
Logo 有透明通道，多格式兜底该怎么选？
```

```text
Network 里为什么三种格式都被请求了？帮我排查
```

```text
用 tinymcp 把 hero.jpg 导出 avif webp jpg 三件套
```
