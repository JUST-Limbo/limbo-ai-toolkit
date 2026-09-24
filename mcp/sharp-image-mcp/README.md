---
name: sharp-image-mcp
description: Local parallel image optimization MCP with multiple output formats, quality control and optional visual comparison report.
x-mcp-version: 1.0.0
x-source-repo: JUST-Limbo/limbo-ai-toolkit
x-source-path: mcp/sharp-image-mcp
---

# sharp-image-mcp

## 功能说明

基于开源库 [Sharp](https://github.com/lovell/sharp) 在本地优化图片，无需图片服务或 API Key。一个 `optimize_images` 工具接收多张本地图片，默认按 **4 个并行任务**输出 JPEG、PNG、WebP、AVIF 全部格式；指定 `formats` 时仅输出所需格式。默认画质参数为 **80**，适用于 JPEG、PNG、WebP、AVIF。

PNG 默认使用调色板量化，按 `quality` 控制画质；渐变、阴影等图片可能出现色带。需要保留原始像素时指定 `pngMode: "lossless"`，此时 `quality` 不作用于 PNG。JPEG 不支持透明，透明区域会填白。编码结果的文件大小不保证比原图更小，简报会如实显示体积变化。

输出始终写到各源文件的同级目录，命名为 `原名.optimized.扩展名`，JPEG 使用 `.jpg`。若该名称已被占用，依次尝试 `原名.optimized-2.扩展名` 等，使用独占写入保证不覆盖源图或已有产物。默认只返回简单汇总及每份产物路径；指定 `report: "html"` 时，额外在**第一张源图的目录**写入 `image-comparison.html`（重名时加序号）。HTML 通过文件路径引用原图和优化图，可在图上左右拖动滑块观察前后画质，并显示画质、格式、大小和失败项。移动报告时需保留被引用的图片路径。

## 使用方法

要求 Node.js ≥ 20.9。开发和构建在 Windows PowerShell 中执行：

```powershell
Set-Location C:\code\limbo-personal-skills\mcp\sharp-image-mcp
npm ci
npm test
```

`npm test` 会先生成 `dist/sharp-image-mcp.cjs`，再运行单元与 MCP 协议测试。修改为自己的仓库路径后，在支持 stdio 的 MCP 客户端中配置：

```json
{
  "mcpServers": {
    "sharp-image-mcp": {
      "command": "node",
      "args": ["C:/code/limbo-personal-skills/mcp/sharp-image-mcp/dist/sharp-image-mcp.cjs"]
    }
  }
}
```

配置后重新加载 MCP 客户端。仅传入源图路径即可使用默认参数，输出四种格式并返回简单汇总：

```json
{
  "inputPaths": ["C:/images/test.png"]
}
```

如需定向输出 WebP，并生成 HTML 对比报告：

```json
{
  "inputPaths": ["C:/images/hero.png", "C:/images/logo.png"],
  "formats": ["webp"],
  "report": "html"
}
```

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `inputPaths` | 必填 | 本地图片绝对路径数组；重复路径会去重。 |
| `formats` | `jpeg`、`png`、`webp`、`avif` 全部 | 可指定其中一个或多个格式；重复格式会去重。 |
| `quality` | `80` | 1–100 的整数；控制 JPEG、PNG、WebP、AVIF 的画质，无损 PNG 除外。 |
| `pngMode` | `palette` | `palette` 按 `quality` 量化；`lossless` 不量化颜色。 |
| `concurrency` | `4` | 同时执行的最大编码任务数，1–16；包括不同文件和格式。 |
| `report` | `summary` | `summary` 只返回文字与结构化数据；`html` 额外生成详细对比网页。 |

每个源文件与格式组成一项任务。部分任务失败时其余任务继续执行，结果中保留失败原因。简单汇总中的“原始总体积”按成功的**产物份数**累计；同一原图输出三种格式时，其原始大小也计入三次，便于与产物总体积比较。

## 对外分发

Sharp 含平台相关的原生依赖，本 MCP **不能只复制单个 CJS 文件**。按白名单复制 `dist/sharp-image-mcp.cjs`、`package.json`、`package-lock.json` 到目标目录，然后在该目录运行 `npm ci --omit=dev`。配置文件指向复制后的 `dist/sharp-image-mcp.cjs`。不要复制本仓库的 `node_modules`、`tests` 或 `history`。
