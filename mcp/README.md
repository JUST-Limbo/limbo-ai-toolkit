# MCP 服务器

本目录存放可复用的 MCP Server，供各项目接入 [Cursor](https://cursor.com/)、Claude Desktop 等支持 MCP 的客户端。

维护约定见 [AGENTS.md](../AGENTS.md)。

---

## 取用原则

取用方将 `dist/*.cjs` 放入目标项目的 **`.cursor/tinymcp/`**（或 **`.claude/tinymcp/`**），无需 `npm install`，不必复制源码。

---

## 清单

| 名称 | 路径 | 版本 | 说明 |
|------|------|------|------|
| tinymcp | [`tinymcp/`](tinymcp/README.md) | 2.1.1 | 图片压缩（TinyPNG **官方 API**，支持多 Key） |

---

## tinymcp

### 功能说明

通过 [TinyPNG 官方 Developer API](https://tinypng.com/developers) 压缩本地 PNG/JPG/WebP/AVIF。

- **MCP Tools**：`compress_local_image`、`compress_images_glob`
- **CLI**：`dist/tinymcp-cli.cjs`（命令名 `tinymcp`）
- **前提**：`TINIFY_API_KEY`（[申请 Key](https://tinypng.com/developers)；多个 Key 用 `,` 或 `;` 分隔）
- **额度**：免费账户约 500 次/月（以官网为准）

详细说明见 [`tinymcp/README.md`](tinymcp/README.md)。免责声明见 [`tinymcp/DISCLAIMER.md`](tinymcp/DISCLAIMER.md)。

### 使用方法（本仓库，维护者）

本仓为 toolkit **维护仓库**：`dist` 在 `mcp/tinymcp/dist/`，`.cursor/mcp.json` 指向该路径便于调试。取用方请按下方「其它项目」约定。

1. 在 [`.cursor/mcp.json`](../.cursor/mcp.json) 填入 `TINIFY_API_KEY`
2. `npm run build` 后确认 `mcp/tinymcp/dist/tinymcp.cjs` 存在
3. 重启 Cursor

### 使用方法（其它项目）

1. 从 `mcp/tinymcp/dist/` 复制 `tinymcp.cjs`（+ 可选 `tinymcp-cli.cjs`）到 **`.cursor/tinymcp/`**
2. 配置 `.cursor/mcp.json`：

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

3. 重启 Cursor

详见 [`tinymcp/README.md#取用方式`](tinymcp/README.md#取用方式)。

### 是否需要 npm install？

| 角色 | 是否需要 | 说明 |
|------|----------|------|
| **使用者** | **否** | 只用 `dist/*.cjs`，不必复制源码 |
| **开发者**（改 `src/`） | **是** | `cd mcp/tinymcp && npm install && npm run build` |

### Version Notes

| 版本 | 说明 |
|------|------|
| 2.1.1 | MCP 默认覆盖原图；取用统一为 `.cursor/tinymcp/` |
| 2.1.0 | 支持多 `TINIFY_API_KEY`（`,` / `;` 分隔），轮询与失败切换 |
| 2.0.0 | 官方 API；目录与产物更名为 **tinymcp** |
| 1.x | 旧名 `tinypng-mcp`、网站未公开接口（已废弃） |

---

## 新增 MCP 时

1. 在 `mcp/<name>/` 下创建实现与 `README.md`（含中文说明、`x-source-repo`）
2. 更新本文档「清单」与根 [README.md](../README.md)
3. 若在本仓库启用，更新 [`.cursor/mcp.json`](../.cursor/mcp.json) 与 [AGENTS.md](../AGENTS.md)
