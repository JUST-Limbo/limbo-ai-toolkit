---
name: tinymcp
description: MCP server for compressing images via TinyPNG official API
x-mcp-version: 2.1.1
x-source-repo: JUST-Limbo/limbo-ai-toolkit
x-source-path: mcp/tinymcp
---

# tinymcp

基于 [TinyPNG 官方 Developer API](https://tinypng.com/developers) 的图片压缩 **MCP Server** 与 **CLI**。

当前版本：**2.1.1**（官方 API + `tinify` SDK，支持多 Key）

> **取用原则**：从 `mcp/tinymcp/dist/` **只复制** `tinymcp.cjs`（+ 可选 `tinymcp-cli.cjs`）到目标项目的 **`.cursor/tinymcp/`** 或 **`.claude/tinymcp/`**。无需 `npm install`，不必复制 `src/` 等源码。

---

## 功能说明

### 解决什么问题

- 在 Cursor / Claude 对话中，让 Agent **直接压缩本地图片**（MCP Tools）
- 在终端中 **批量压缩** PNG/JPG 等（CLI）
- 可选 **等比缩放**（宽度 / 高度）

### 适用场景

- 前端资源、设计稿、截图的体积优化
- 对话里说「帮我把某张图压一下」，由 Agent 调用 MCP
- 脚本或手工在终端批量处理图片

### 不负责的范围

- 不提供 TinyPNG 账号或 API Key（须自行申请）
- 不保证超出官方免费额度后的费用（见官网定价）
- 不做本地离线压缩（需网络访问 TinyPNG API）

### 提供的能力

| 能力 | 说明 |
|------|------|
| MCP `compress_local_image` | 压缩单张本地图片 |
| MCP `compress_images_glob` | 按 glob 批量压缩 |
| CLI `tinymcp` | 命令行压缩，支持 glob、输出目录、缩放 |
| 库 `compressFile()` | 在 Node 脚本中调用 |

支持格式：`.png`、`.jpg`、`.jpeg`、`.webp`、`.avif`（以 [官方 API](https://tinypng.com/developers) 为准）。

---

## 快速开始

### 前提

- **Node.js ≥ 18**
- **TinyPNG API Key**（[申请地址](https://tinypng.com/developers)）
- 能访问 `api.tinify.com`（官方 API 域名）

### 1. 申请 API Key

1. 打开 https://tinypng.com/developers
2. 填写 **Full name**、**Email**，同意条款后提交
3. 在邮箱或 https://tinypng.com/dashboard/api 查看 Key
4. 免费账户通常为 **每月 500 次**压缩（以官网为准）

> **安全**：Key 等同于密码，不要提交到 git、不要发到公开渠道。

### 多个 API Key（可选）

`TINIFY_API_KEY` 支持用**英文逗号 `,` 或分号 `;`** 配置多个 Key，例如：

```text
TINIFY_API_KEY=abc123,def456;ghi789
```

- **轮询**：每次压缩按顺序选用下一个 Key，均衡分摊额度
- **自动切换**：当前 Key 返回 401/429 或额度类错误时，自动尝试列表中的下一个 Key

`.cursor/mcp.json` 示例：

```json
"env": {
  "TINIFY_API_KEY": "key1,key2,key3"
}
```

### 2. 安装 dist 并配置 MCP

从本仓库 `mcp/tinymcp/dist/` 复制单文件到目标项目：

```text
your-project/
├── .cursor/
│   ├── mcp.json
│   └── tinymcp/
│       ├── tinymcp.cjs          # 必填（自 dist/tinymcp.cjs 复制）
│       └── tinymcp-cli.cjs      # 可选（自 dist/tinymcp-cli.cjs 复制）
└── .claude/                     # 若用 Claude Code，可同样放一份 tinymcp/
    └── tinymcp/
        └── tinymcp.cjs
```

编辑 `.cursor/mcp.json`（路径相对**仓库根目录**）：

```json
{
  "mcpServers": {
    "tinymcp": {
      "command": "node",
      "args": [".cursor/tinymcp/tinymcp.cjs"],
      "env": {
        "TINIFY_API_KEY": "你的API_KEY"
      }
    }
  }
}
```

保存后 **重启 Cursor** 或在设置中刷新 MCP。

也可将 Key 设为系统 / 用户环境变量 `TINIFY_API_KEY`，则 `mcp.json` 可省略 `env` 段。

> **本仓库（limbo-ai-toolkit）维护者**：开发与构建在 `mcp/tinymcp/`，当前 `.cursor/mcp.json` 指向 `mcp/tinymcp/dist/tinymcp.cjs` 便于本仓调试；**其它项目取用请一律放入 `.cursor/tinymcp/`**。

### 3. 在对话中使用

```text
帮我把 C:/Users/xxx/Desktop/logo.png 压缩一下
```

```text
批量压缩 assets 目录下所有 png，输出到 dist
```

Agent 会调用 `compress_local_image` 或 `compress_images_glob`。未指定输出路径时，**默认覆盖原文件**；指定 `outputPath` / `outputDir` 则写到目标位置、保留原图。

### 4. CLI 使用（可选）

仓库已包含 esbuild 单文件 `dist/tinymcp-cli.cjs`，**无需 `npm install`**：

```powershell
# Windows PowerShell（路径按你放置 dist 的位置调整）
$env:TINIFY_API_KEY = "你的API_KEY"
node .cursor/tinymcp/tinymcp-cli.cjs logo.png
node .cursor/tinymcp/tinymcp-cli.cjs "assets/**/*.png" -o dist
```

```bash
# macOS / Linux
export TINIFY_API_KEY="你的API_KEY"
node .cursor/tinymcp/tinymcp-cli.cjs logo.png
```

---

## MCP Tools 说明

### `compress_local_image`

压缩单张本地图片。

| 参数 | 必填 | 说明 |
|------|------|------|
| `inputPath` | 是 | 输入图片**绝对路径**，建议用正斜杠，如 `C:/Users/xxx/a.png` |
| `outputPath` | 否 | 输出路径；省略则**覆盖原文件** |
| `width` | 否 | 目标宽度（像素） |
| `height` | 否 | 目标高度（像素） |

返回文本包含：输入/输出路径、压缩前后体积、节省比例、**本月已用次数**。

### `compress_images_glob`

按 glob 批量压缩。

| 参数 | 必填 | 说明 |
|------|------|------|
| `patterns` | 是 | glob 数组，如 `["C:/project/assets/**/*.png"]` |
| `outputDir` | 否 | 统一输出目录；省略则**覆盖各原文件** |
| `width` | 否 | 目标宽度 |
| `height` | 否 | 目标高度 |

---

## CLI 参数

```text
tinymcp <patterns...> [选项]

参数:
  patterns          图片路径或 glob，如 'assets/**/*.{png,jpg}'

选项:
  -k, --key <keys>  API Key（默认 TINIFY_API_KEY；多个用 , 或 ; 分隔）
  -o, --out <dir>   输出目录（省略则覆盖原文件）
  -w, --width <px>  目标宽度
  -H, --height <px> 目标高度
```

**MCP 与 CLI 默认行为一致**：未指定 `outputPath` / `outputDir` / `-o` 时，**覆盖原文件**。若要保留原图，须显式指定其它输出路径或目录。

---

## 作为库使用

```js
import { setApiKey, compressFile, validateKey } from "./src/core.js";

setApiKey(process.env.TINIFY_API_KEY);

const { compressionCount } = await validateKey();

const r = await compressFile("logo.png", {
  output: "dist/logo.png",
  width: 800,
});

console.log(r);
// { input, output, before, after, saved, ratio, compressionCount }
```

---

## 目录结构

```text
mcp/tinymcp/
├── dist/                 # ★ 取用方只需要这里（单文件，已打包）
│   ├── tinymcp.cjs       # MCP 入口
│   └── tinymcp-cli.cjs   # CLI 入口（可选）
├── src/                  # 源码（取用方不必复制）
├── bin/                  # CLI 源码（取用方不必复制）
├── scripts/build.mjs     # 打包脚本（维护者用）
└── package.json          # 依赖声明（维护者 build 用）
```

### MCP 入口 vs CLI

| | MCP（`tinymcp.cjs`） | CLI（`tinymcp-cli.cjs`） |
|---|----------------------|--------------------------|
| **谁用** | Cursor / Claude 里的 Agent | 你在终端 |
| **怎么触发** | 对话中让 Agent 调 tool | 敲 `tinymcp` 或 `node dist/tinymcp-cli.cjs` |
| **协议** | MCP stdio | 命令行参数 |

二者共用 `src/core.js`，压缩逻辑一致。

---

## 开发与重新打包

仅**修改源码**时需要：

```bash
cd mcp/tinymcp
npm install
npm run build
```

| 脚本 | 说明 |
|------|------|
| `npm run build` | 生成 `dist/tinymcp.cjs`、`dist/tinymcp-cli.cjs` |
| `npm run mcp` | 运行打包后的 MCP |
| `npm run start` | 运行打包后的 CLI |
| `npm run dev:mcp` | 开发模式跑 `src/mcp.js` |
| `npm run dev:cli` | 开发模式跑 `bin/cli.js` |

修改 `src/` 或 `bin/` 后请重新 `npm run build` 并提交 `dist/`。

---

## 取用方式

将 `mcp/tinymcp/dist/` 中的单文件复制到目标项目的 **`.cursor/tinymcp/`**（或 **`.claude/tinymcp/`**），并配置 `.cursor/mcp.json`：

```text
.cursor/mcp.json
.cursor/tinymcp/tinymcp.cjs
```

```json
{
  "mcpServers": {
    "tinymcp": {
      "command": "node",
      "args": [".cursor/tinymcp/tinymcp.cjs"],
      "env": {
        "TINIFY_API_KEY": "你的API_KEY"
      }
    }
  }
}
```

说明：

- **只复制** `dist/tinymcp.cjs`（+ 可选 `dist/tinymcp-cli.cjs`），**不要**复制 `src/` 等源码。
- **`tinymcp/*.cjs` 建议提交 git**，团队 clone 即可用。
- **Cursor + Claude 共用**：只维护一份（如 `.cursor/tinymcp/`），两边 MCP 配置指向同一路径。
- **Key 勿提交**：`TINIFY_API_KEY` 用本机 `env` 或环境变量。

**不必复制**：`src/`、`bin/`、`scripts/`、`package.json`、`package-lock.json`、`node_modules/`。

---

## 常见问题

### 启动报错「缺少 TinyPNG API Key」

未配置 `TINIFY_API_KEY`。在 `.cursor/mcp.json` 的 `env` 中填入 Key，或设置系统环境变量后重启 Cursor。

### 压缩失败 / 401

Key 无效或过期。到 https://tinypng.com/dashboard/api 核对。

### 本月额度用完

免费账户约 500 次/月。等待下月重置，或按官网升级付费计划。

### 多个 Key 如何工作？

| 行为 | 说明 |
|------|------|
| 轮询 | 每次成功压缩后，下次从下一个 Key 开始 |
| 失败切换 | 401 / 429 / 5xx 或报额度错误时，自动换 Key 重试 |
| 结果展示 | MCP 返回中会显示 `使用 Key: #2/3`（不暴露 Key 明文） |

### 是否需要 `npm install`？

| 角色 | 是否需要 | 需要哪些文件 |
|------|----------|--------------|
| **使用者** | **否** | 仅 `dist/tinymcp.cjs`（+ 可选 `dist/tinymcp-cli.cjs`） |
| **开发者**（改 `src/`） | **是** | 完整源码目录 + `npm install && npm run build` |

---

## 免责声明

详见 [DISCLAIMER.md](DISCLAIMER.md)。

---

## 版本说明

| 版本 | 说明 |
|------|------|
| **2.1.1** | MCP 默认输出改为覆盖原文件（与 CLI 一致） |
| **2.1.0** | 支持 `TINIFY_API_KEY` 多 Key（`,` / `;` 分隔），轮询 + 失败自动切换 |
| **2.0.0** | 官方 API（`tinify` SDK）；项目更名为 **tinymcp** |
| 1.x | 早期目录名 `tinypng-mcp`、网站未公开接口方案（已废弃） |

---

## License

MIT
