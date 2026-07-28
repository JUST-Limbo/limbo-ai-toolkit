import { basename, join } from "node:path";
import { mkdir } from "node:fs/promises";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fg from "fast-glob";
import * as z from "zod/v4";
import { compressFile } from "./core.js";

const server = new McpServer({
  name: "tinynokeymcp",
  version: "1.0.0",
});

function kb(n) {
  return (n / 1024).toFixed(1) + "KB";
}

function formatResult(r) {
  let text =
    "压缩完成（免 Key / Web 后台）\n" +
    `- 输入: ${r.input}\n` +
    `- 输出: ${r.output}\n` +
    `- 体积: ${kb(r.before)} → ${kb(r.after)} (-${(r.ratio * 100).toFixed(1)}%)`;
  if (r.width && r.height) {
    text += `\n- 尺寸: ${r.width}×${r.height}`;
  }
  text +=
    "\n- 说明: 走 tinypng.com 未公开 Web 接口，非官方 API；生产环境请用 tinymcp + API Key";
  return text;
}

server.registerTool(
  "compress_local_image",
  {
    description:
      "免 API Key：通过 TinyPNG 官网 Web 后台压缩本地 PNG/JPG（模拟浏览器上传）。仅自用/学习；不稳定，不支持 webp/avif/转格式。",
    inputSchema: {
      inputPath: z
        .string()
        .describe("输入图片绝对路径，如 C:/Users/xxx/a.png"),
      outputPath: z
        .string()
        .optional()
        .describe("输出路径（可选）。省略则覆盖原文件"),
    },
  },
  async function ({ inputPath, outputPath }) {
    try {
      const output = outputPath || inputPath;
      const r = await compressFile(inputPath, { output: output });
      return { content: [{ type: "text", text: formatResult(r) }] };
    } catch (e) {
      return {
        isError: true,
        content: [{ type: "text", text: `压缩失败: ${e.message}` }],
      };
    }
  }
);

server.registerTool(
  "compress_images_glob",
  {
    description:
      "免 API Key：按 glob 批量压缩 PNG/JPG。走官网 Web 后台，串行请求；单文件约 ≤5MB。",
    inputSchema: {
      patterns: z
        .array(z.string())
        .describe("glob 模式数组，路径建议用正斜杠"),
      outputDir: z
        .string()
        .optional()
        .describe("输出目录（可选）。省略则覆盖各原文件"),
    },
  },
  async function ({ patterns, outputDir }) {
    try {
      const files = await fg(patterns, { onlyFiles: true, absolute: true });
      if (files.length === 0) {
        return {
          isError: true,
          content: [{ type: "text", text: "没匹配到任何文件" }],
        };
      }
      if (outputDir) {
        await mkdir(outputDir, { recursive: true });
      }

      const lines = [];
      let totalSaved = 0;
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const output = outputDir ? join(outputDir, basename(f)) : f;
        const r = await compressFile(f, { output: output });
        totalSaved += r.saved;
        lines.push(
          `✓ ${f}  ${kb(r.before)} → ${kb(r.after)} (-${(r.ratio * 100).toFixed(1)}%)`
        );
      }
      lines.push(`\n完成 ${files.length} 张，共省 ${kb(totalSaved)}。`);
      return { content: [{ type: "text", text: lines.join("\n") }] };
    } catch (e) {
      return {
        isError: true,
        content: [{ type: "text", text: `批量压缩失败: ${e.message}` }],
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[tinynokeymcp] ready (stdio, web backend, no API key)");
}

main().catch(function (err) {
  console.error("[tinynokeymcp] fatal:", err);
  process.exit(1);
});
