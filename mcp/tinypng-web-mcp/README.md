---
name: "tinypng-web-mcp"
description: "MCP server for compressing PNG/JPG via TinyPNG web backend without API key"
metadata:
  x-mcp-version: "2.0.0"
  x-source-repo: "JUST-Limbo/limbo-ai-toolkit"
  x-source-path: "mcp/tinypng-web-mcp"
---

# tinypng-web-mcp

**免 API Key** 的 TinyPNG 图片压缩 **MCP Server** 与 **CLI**。

通过模拟官网浏览器上传，请求 `tinypng.com/backend/opt/shrink`（**非**官方 Developer API）。实现参考公开项目 [yongplus/tinypng](https://github.com/yongplus/tinypng) Web 模式、[super-tinypng](https://github.com/zhanyuzhang/super-tinypng)。

当前版本：**2.0.0**

> **取用原则**：从 `mcp/tinypng-web-mcp/dist/` **只复制** `tinypng-web-mcp.cjs`（以及按需复制 `tinypng-web-mcp-cli.cjs`）。目标存放位置与 MCP 配置文件由调用方根据所用客户端的规则决定；无需 `npm install`，不必复制 `src/` 等源码。
>
> **生产环境请用 [tinypng-mcp](../tinypng-mcp/README.md)**（官方 API + Key）。使用前必读 [DISCLAIMER.md](DISCLAIMER.md)。

---

## 功能说明

### 解决什么问题

- 不想申请 `TINIFY_API_KEY`，偶尔在本地或支持 MCP 的客户端中压几张 **PNG / JPG**
- 对话或 CLI 触发压缩，**零 Key 配置**

### 适用场景

- 个人学习、验证压缩效果
- 临时处理少量前端静态图

### 不负责的范围

- **不提供**官方 API 的稳定性、额度与合规保障
- **不支持** WebP / AVIF、格式转换、缩放（官方 API 能力请用 tinypng-mcp）
- **不适合**商用、CI 长期跑、大批量生产

### 提供的能力

| 能力 | 说明 |
|------|------|
| MCP `compress_local_image` | 压缩单张 PNG/JPG |
| MCP `compress_images_glob` | glob 批量压缩 |
| CLI `tinypng-web-mcp` | 终端批量压缩 |
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

### 1. 取用并配置 MCP

按照[取用方式](#取用方式)复制构建产物，并根据所用 MCP 客户端的规则配置 `tinypng-web-mcp.cjs` 的实际路径。本工具无需 `TINIFY_API_KEY`。保存后按客户端提供的方式重载 MCP 配置；必要时重启客户端。

### 2. 对话示例

```text
用 tinypng-web-mcp 把 C:/project/assets/logo.png 压一下
```

### 3. CLI（可选）

```powershell
node "path/to/tinypng-web-mcp-cli.cjs" logo.png
node "path/to/tinypng-web-mcp-cli.cjs" "assets/**/*.png" -o dist
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
cd mcp/tinypng-web-mcp
npm install
npm run build
```

修改 `src/` 后请重新 `npm run build` 并提交 `dist/`。

---

## 取用方式

从 `mcp/tinypng-web-mcp/dist/` 取用以下已打包文件：

- MCP Server 必需：`tinypng-web-mcp.cjs`
- CLI 可选：`tinypng-web-mcp-cli.cjs`

将文件放到调用方允许且能够访问的位置。不同 MCP 客户端的配置目录和文件格式不同，应以所用客户端的规则为准，不要默认使用某个客户端的专属目录。

以下仅展示 stdio MCP 启动项所需的通用字段；配置外层结构和路径写法按客户端要求调整：

```json
{
  "mcpServers": {
    "tinypng-web-mcp": {
      "command": "node",
      "args": ["<实际路径>/tinypng-web-mcp.cjs"]
    }
  }
}
```

说明：

- **只复制** `dist/tinypng-web-mcp.cjs`（以及按需复制 `dist/tinypng-web-mcp-cli.cjs`），**不要**复制 `src/` 等源码。
- 是否把 `.cjs` 文件放入项目以及是否提交 git，由调用方项目的依赖与安全策略决定。
- 多个客户端可以指向同一份 `.cjs` 文件，也可以各自维护；路径必须按各客户端的配置规则填写。
- 本工具**无需** `TINIFY_API_KEY`。

**不必复制**：`src/`、`bin/`、`scripts/`、`package.json`、`package-lock.json`、`node_modules/`。

---

## 与 tinypng-mcp 对比

| | tinypng-web-mcp | tinypng-mcp |
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
| **2.0.0** | 破坏性重命名：`tinynokeymcp` 改为 `tinypng-web-mcp`，同步目录、包名、CLI、MCP 服务标识和构建产物名 |
| **1.0.1** | 取用和客户端配置说明改为客户端无关表述 |
| **1.0.0** | 初始版本：Web 后台免 Key 压缩；MCP + CLI + `compressFile` |

---

## License

MIT
