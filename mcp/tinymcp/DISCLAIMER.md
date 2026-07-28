# 免责声明（Disclaimer）

**请在使用 tinymcp 之前阅读本文档。使用本工具即表示你理解并同意下列内容。**

---

## 1. 与 TinyPNG 的关系

- 本工具通过 [TinyPNG 官方 Developer API](https://tinypng.com/developers) 提供压缩能力。
- 本仓库（`JUST-Limbo/limbo-ai-toolkit`）**不是** TinyPNG 或 Voormedia 的官方产品，**未获其授权或背书**。
- 项目名称「tinymcp」仅作工具标识；压缩服务由 TinyPNG 提供，不构成商标关联。

## 2. API Key

| 事项 | 说明 |
|------|------|
| 获取方式 | 须在 https://tinypng.com/developers 自行注册申请 |
| 保管 | Key 等同于密码，**不得**提交到公开仓库、聊天记录或他人 |
| 泄露后果 | 他人滥用导致的压缩次数消耗与可能产生的费用由 **Key 持有人** 承担 |
| 配置方式 | 环境变量 `TINIFY_API_KEY`（**多个 Key 用 `,` 或 `;` 分隔**），或 Cursor `.cursor/mcp.json` 的 `env` 段 |

## 3. 额度与费用

- 免费账户通常为 **每月约 500 次**压缩（以 [TinyPNG 官网](https://tinypng.com/developers) 当前政策为准）。
- 超出免费额度后，可能产生费用，请查阅官方定价并在控制台关注用量：https://tinypng.com/dashboard/api

## 4. 使用规范

你同意：

- 仅压缩你**有权处理**的图片；
- 遵守 [TinyPNG Terms of Use](https://tinypng.com/terms) 及适用法律；
- 不将本工具用于滥用 API、批量爬取或任何违反官方条款的行为。

## 5. 无担保

本工具及其文档按「**现状**」（AS IS）提供：

- 不保证 TinyPNG 服务持续可用、接口不变或压缩结果满足特定画质要求；
- 不承担因网络故障、API 变更、额度用尽、Key 失效等导致的损失。

## 6. 开源许可

- 本仓库**源代码**采用 MIT 许可证（见 `package.json` 中 `"license": "MIT"`）。
- MIT 许可**仅适用于本仓库分发的代码**；对 TinyPNG 服务的使用须遵守其**官方服务条款**。

---

**API Key 申请**：https://tinypng.com/developers  
**用量查询**：https://tinypng.com/dashboard/api
