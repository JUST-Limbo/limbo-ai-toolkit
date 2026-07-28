import { basename, join } from "node:path";
import { mkdir } from "node:fs/promises";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fg from "fast-glob";
import * as z from "zod/v4";
import { compressFile, setApiKey } from "./core.js";

setApiKey(process.env.TINIFY_API_KEY);

const server = new McpServer({
  name: "tinymcp",
  version: "2.1.1",
});

function kb(n) {
  return (n / 1024).toFixed(1) + "KB";
}

function formatResult(r) {
  let text =
    `压缩完成\n` +
    `- 输入: ${r.input}\n` +
    `- 输出: ${r.output}\n` +
    `- 体积: ${kb(r.before)} → ${kb(r.after)} (-${(r.ratio * 100).toFixed(1)}%)`;
  if (r.keyCount > 1) {
    text += `\n- 使用 Key: #${r.keyIndex}/${r.keyCount}`;
  }
  text += `\n- 本月已用: ${r.compressionCount} 次（该 Key，免费额度 500/月）`;
  return text;
}

server.registerTool(
  "compress_local_image",
  {
    description:
      "用 TinyPNG 官方 API 压缩本地 PNG/JPG/WebP/AVIF。需 TINIFY_API_KEY（多个 Key 用 , 或 ; 分隔）。",
    inputSchema: {
      inputPath: z
        .string()
        .describe("输入图片的绝对路径，如 C:/Users/xxx/Desktop/a.png"),
      outputPath: z
        .string()
        .optional()
        .describe("输出路径（可选）。省略则覆盖原文件"),
      width: z.number().optional().describe("目标宽度（像素，可选）"),
      height: z.number().optional().describe("目标高度（像素，可选）"),
    },
  },
  async ({ inputPath, outputPath, width, height }) => {
    try {
      const output = outputPath || inputPath;
      const r = await compressFile(inputPath, { output, width, height });
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
      "用 TinyPNG 官方 API 按 glob 批量压缩。需 TINIFY_API_KEY（多个 Key 用 , 或 ; 分隔）。",
    inputSchema: {
      patterns: z
        .array(z.string())
        .describe("glob 模式数组，路径建议用正斜杠"),
      outputDir: z
        .string()
        .optional()
        .describe("输出目录（可选）。省略则覆盖各原文件"),
      width: z.number().optional().describe("目标宽度（像素，可选）"),
      height: z.number().optional().describe("目标高度（像素，可选）"),
    },
  },
  async ({ patterns, outputDir, width, height }) => {
    try {
      const files = await fg(patterns, { onlyFiles: true, absolute: true });
      if (files.length === 0) {
        return {
          isError: true,
          content: [{ type: "text", text: "没匹配到任何文件" }],
        };
      }
      if (outputDir) await mkdir(outputDir, { recursive: true });

      const lines = [];
      let totalSaved = 0;
      let lastCount = 0;
      for (const f of files) {
        const output = outputDir ? join(outputDir, basename(f)) : f;
        const r = await compressFile(f, { output, width, height });
        totalSaved += r.saved;
        lastCount = r.compressionCount;
        lines.push(
          `✓ ${f}  ${kb(r.before)} → ${kb(r.after)} (-${(r.ratio * 100).toFixed(1)}%)`
        );
      }
      lines.push(
        `\n完成 ${files.length} 张，共省 ${kb(totalSaved)}。本月已用 ${lastCount} 次。`
      );
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
  console.error("[tinymcp] ready (stdio, official API)");
}

main().catch((err) => {
  console.error("[tinymcp] fatal:", err);
  process.exit(1);
});
