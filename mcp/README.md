# MCP 服务器

本目录存放可复用的 MCP Server，供各项目接入支持 MCP 的客户端。

维护约定见 [AGENTS.md](../AGENTS.md)。

---

## 取用原则

取用方按各 MCP 的 README 白名单复制文件。TinyPNG 两项只需对应的 `dist/*.cjs` 构建产物；`sharp-image-mcp` 还需复制包清单并在目标机器安装 Sharp 的原生依赖。构建产物的目标存放位置、MCP 配置文件及重载方式，由调用方根据所用客户端的规则决定。

---

## 清单

| 名称 | 简介 | 详细说明 |
|------|------|----------|
| `tinypng-mcp` | 使用 TinyPNG 官方 API 压缩或转换图片，须 API Key | [README](tinypng-mcp/README.md) · [免责声明](tinypng-mcp/DISCLAIMER.md) |
| `tinypng-web-mcp` | 通过 TinyPNG 未公开 Web 后台免 Key 压缩 PNG/JPG，不适合生产 | [README](tinypng-web-mcp/README.md) · [免责声明](tinypng-web-mcp/DISCLAIMER.md) |
| `sharp-image-mcp` | 本地并行优化图片，支持多格式、画质控制和可选 HTML 滑块对比报告 | [README](sharp-image-mcp/README.md) |

---

## 新增 MCP 时

1. 在 `mcp/<name>/` 下创建实现与 `README.md`（含中文说明、`x-source-repo`）
2. 更新本文档「清单」与根 [README.md](../README.md)
3. 若在本仓库启用，更新 [`.cursor/mcp.json`](../.cursor/mcp.json) 与 [AGENTS.md](../AGENTS.md)
