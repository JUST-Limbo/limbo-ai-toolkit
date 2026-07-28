# 免责声明（Disclaimer）

**请在使用 tinynokeymcp 之前阅读本文档。使用本工具即表示你理解并同意下列内容。**

---

## 1. 与 TinyPNG 的关系

- 本仓库（`JUST-Limbo/limbo-ai-toolkit`）**不是** TinyPNG 或 Voormedia 的官方产品。
- 实现思路参考公开开源项目 [yongplus/tinypng](https://github.com/yongplus/tinypng)、[super-tinypng](https://github.com/zhanyuzhang/super-tinypng)，仅供学习研究。

## 2. 风险与限制

| 风险 | 说明 |
|------|------|
| **接口未公开** | 官网随时可改路径、限流或封禁，工具可能整体失效 |
| **伪造 IP** | 使用随机 `X-Forwarded-For` 绕过按 IP 限制 |
| **无额度透明** | 不像官方 API 有明确的账户用量；可能被限流且无明确错误码 |
| **格式有限** | 通常仅 PNG / JPG，无 WebP / AVIF、无官方 convert / resize |
| **合规** | **不适合**公开发布产品、商用或团队长期依赖 |

## 3. 推荐使用方式

- **学习、本地偶尔压几张图**：可使用本工具（自担风险）。
- **生产、团队、可审计、需稳定**：请使用同仓库 **[tinymcp](../tinymcp/README.md)** + 官方 `TINIFY_API_KEY`。

## 4. 使用规范

你同意：

- 仅压缩你**有权处理**的图片；
- 不用于大规模滥用、批量爬取或任何可能损害 TinyPNG 服务的行为；
- 自行承担因接口变更、限流、网络失败导致的后果。

## 5. 无担保

本工具按「**现状**」（AS IS）提供，作者与仓库维护者不承担任何直接或间接损失。

---

**若你不同意上述条款，请勿使用 tinynokeymcp。**
