---
name: tinynokeymcp
description: MCP server for compressing PNG/JPG via TinyPNG web backend without API key
x-mcp-version: 1.0.0
x-source-repo: JUST-Limbo/limbo-ai-toolkit
x-source-path: mcp/tinynokeymcp
---

# tinynokeymcp

**免 API Key** 的 TinyPNG 图片压缩 **MCP Server** 与 **CLI**。

通过模拟官网浏览器上传，请求 `tinypng.com/backend/opt/shrink`（**非**官方 Developer API）。实现参考公开项目 [yongplus/tinypng](https://github.com/yongplus/tinypng) Web 模式、[super-tinypng](https://github.com/zhanyuzhang/super-tinypng)。

当前版本：**1.0.0**

> **取用原则**：从 `mcp/tinynokeymcp/dist/` **只复制** `tinynokeymcp.cjs`（+ 可选 `tinynokeymcp-cli.cjs`）到目标项目的 **`.cursor/tinynokeymcp/`**。无需 `npm install`，不必复制 `src/`。
>
> **生产环境请用 [tinymcp](../tinymcp/README.md)**（官方 API + Key）。使用前必读 [DISCLAIMER.md](DISCLAIMER.md)。

---

## 功能说明

### 解决什么问题

- 不想申请 `TINIFY_API_KEY`，偶尔在本地 / Cursor 里压几张 **PNG / JPG**
- 对话或 CLI 触发压缩，**零 Key 配置**

### 适用场景

- 个人学习、验证压缩效果
- 临时处理少量前端静态图

### 不负责的范围

- **不提供**官方 API 的稳定性、额度与合规保障
- **不支持** WebP / AVIF、格式转换、缩放（官方 API 能力请用 tinymcp）
- **不适合**商用、CI 长期跑、大批量生产

### 提供的能力

| 能力 | 说明 |
|------|------|
| MCP `compress_local_image` | 压缩单张 PNG/JPG |
| MCP `compress_images_glob` | glob 批量压缩 |
| CLI `tinynokeymcp` | 终端批量压缩 |
| 库 `compressFile()` | Node 脚本调用 |

限制：单文件约 **≤ 5MB**；仅 **`.png` / `.jpg` / `.jpeg`**；需能访问 `tinypng.com`。

### 实现原理（简要）

```text
1. POST 原图二进制 → https://tinypng.com/backend/opt/shrink
   Header: User-Agent（浏览器）、X-Forwarded-For（随机 IP）
2. 解析 JSON → output.url
3. GET 下载压缩结果 → 写入本地
```

---

## 快速开始

### 前提

- **Node.js ≥ 18**
- 能访问 `tinypng.com`（国外服务，国内可能需要代理）
- 已阅读 [DISCLAIMER.md](DISCLAIMER.md)

### 1. 复制 dist 并配置 MCP

```text
your-project/
├── .cursor/
│   ├── mcp.json
│   └── tinynokeymcp/
│       ├── tinynokeymcp.cjs          # 必填
│       └── tinynokeymcp-cli.cjs      # 可选
```

`.cursor/mcp.json` 示例（可与 `tinymcp` 并存，注意 `mcpServers` 里两个条目）：

```json
{
  "mcpServers": {
    "tinynokeymcp": {
      "command": "node",
      "args": [".cursor/tinynokeymcp/tinynokeymcp.cjs"]
    }
  }
}
```

**无需** `TINIFY_API_KEY`。保存后重启 Cursor。

### 2. 对话示例

```text
用 tinynokeymcp 把 C:/project/assets/logo.png 压一下
```

### 3. CLI（可选）

```powershell
node .cursor/tinynokeymcp/tinynokeymcp-cli.cjs logo.png
node .cursor/tinynokeymcp/tinynokeymcp-cli.cjs "assets/**/*.png" -o dist
```

未指定 `-o` 时**覆盖原文件**。

---

## MCP Tools

### `compress_local_image`

| 参数 | 必填 | 说明 |
|------|------|------|
| `inputPath` | 是 | 输入图片绝对路径 |
| `outputPath` | 否 | 输出路径；省略则覆盖原文件 |

### `compress_images_glob`

| 参数 | 必填 | 说明 |
|------|------|------|
| `patterns` | 是 | glob 数组 |
| `outputDir` | 否 | 输出目录；省略则覆盖各原文件 |

---

## 作为库使用

```js
import { compressFile } from "./src/core.js";

const r = await compressFile("logo.png", { output: "logo.png" });
// { input, output, before, after, saved, ratio, width, height, mode: "web" }
```

---

## 开发与重新打包

```bash
cd mcp/tinynokeymcp
npm install
npm run build
```

修改 `src/` 后请重新 `npm run build` 并提交 `dist/`。

---

## 与 tinymcp 对比

| | tinynokeymcp | tinymcp |
|---|--------------|---------|
| API Key | **不需要** | 需要 `TINIFY_API_KEY` |
| 接口 | 官网 Web 后台（未公开） | 官方 `api.tinify.com` |
| 稳定性 | 低，可能随时失效 | 高 |
| 格式 | PNG / JPG | PNG / JPG / WebP / AVIF + 转格式 |
| 合规 | 灰色，仅建议学习 | 正规 |
| 额度 | 靠 IP 限流，不透明 | 账户 500/月（以官网为准） |

---

## 版本说明

| 版本 | 说明 |
|------|------|
| **1.0.0** | 初始版本：Web 后台免 Key 压缩；MCP + CLI + `compressFile` |

---

## License

MIT
