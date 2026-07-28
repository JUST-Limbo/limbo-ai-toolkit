import { basename, extname, join } from "node:path";
import { mkdir } from "node:fs/promises";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fg from "fast-glob";
import * as z from "zod/v4";
import {
  compressFile,
  convertFile,
  convertToFormats,
  extensionForFormat,
  setApiKey,
} from "./core.js";

setApiKey(process.env.TINIFY_API_KEY);

const server = new McpServer({
  name: "tinymcp",
  version: "2.2.0",
});

function kb(n) {
  return (n / 1024).toFixed(1) + "KB";
}

function formatResult(r) {
  const title = r.format ? "格式转换完成" : "压缩完成";
  let text =
    `${title}\n` +
    `- 输入: ${r.input}\n` +
    `- 输出: ${r.output}\n` +
    `- 体积: ${kb(r.before)} → ${kb(r.after)} (-${(r.ratio * 100).toFixed(1)}%)`;
  if (r.format) {
    text += `\n- 目标格式: ${r.format}`;
  }
  if (r.keyCount > 1) {
    text += `\n- 使用 Key: #${r.keyIndex}/${r.keyCount}`;
  }
  text += `\n- 本月已用: ${r.compressionCount} 次（该 Key，免费额度 500/月）`;
  return text;
}

const formatSchema = z
  .string()
  .describe("目标格式：avif | webp | jpg | png | jxl");

server.registerTool(
  "compress_local_image",
  {
    description:
      "用 TinyPNG 官方 API 压缩本地 PNG/JPG/WebP/AVIF（保持原格式）。需 TINIFY_API_KEY。",
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
      "用 TinyPNG 官方 API 按 glob 批量压缩（保持原格式）。需 TINIFY_API_KEY。",
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

server.registerTool(
  "convert_local_image",
  {
    description:
      "用 TinyPNG 官方 API 将本地图片转为 avif/webp/jpg/png/jxl 并压缩。未指定输出时同目录换扩展名、保留原图。每种格式计 1 次 API 额度。",
    inputSchema: {
      inputPath: z.string().describe("输入图片绝对路径"),
      format: formatSchema,
      outputPath: z
        .string()
        .optional()
        .describe("输出文件或目录（可选）。省略则同目录换扩展名"),
      width: z.number().optional().describe("目标宽度（像素，可选）"),
      height: z.number().optional().describe("目标高度（像素，可选）"),
    },
  },
  async ({ inputPath, format, outputPath, width, height }) => {
    try {
      const r = await convertFile(inputPath, {
        format,
        output: outputPath,
        width,
        height,
      });
      return { content: [{ type: "text", text: formatResult(r) }] };
    } catch (e) {
      return {
        isError: true,
        content: [{ type: "text", text: `格式转换失败: ${e.message}` }],
      };
    }
  }
);

server.registerTool(
  "convert_local_image_formats",
  {
    description:
      "从一张原图导出多种格式（如 avif+webp+jpg），用于多格式分发素材准备。每种格式各计 1 次 API 额度。",
    inputSchema: {
      inputPath: z.string().describe("输入图片绝对路径"),
      formats: z
        .array(z.string())
        .describe('目标格式数组，如 ["avif","webp","jpg"]'),
      outputDir: z
        .string()
        .optional()
        .describe("输出目录（可选）。省略则与输入同目录"),
      width: z.number().optional().describe("目标宽度（像素，可选）"),
      height: z.number().optional().describe("目标高度（像素，可选）"),
    },
  },
  async ({ inputPath, formats, outputDir, width, height }) => {
    try {
      if (outputDir) await mkdir(outputDir, { recursive: true });
      const results = await convertToFormats(inputPath, {
        formats,
        outputDir,
        width,
        height,
      });
      const lines = results.map(function (r) {
        return (
          `✓ ${r.format}  → ${r.output}  ${kb(r.before)} → ${kb(r.after)}`
        );
      });
      const last = results[results.length - 1];
      lines.push(
        `\n完成 ${results.length} 种格式。本月已用 ${last.compressionCount} 次（最后一张所用 Key）。`
      );
      return { content: [{ type: "text", text: lines.join("\n") }] };
    } catch (e) {
      return {
        isError: true,
        content: [{ type: "text", text: `多格式导出失败: ${e.message}` }],
      };
    }
  }
);

server.registerTool(
  "convert_images_glob",
  {
    description:
      "按 glob 批量将图片转为指定格式。未指定输出目录时各文件同目录换扩展名、保留原图。",
    inputSchema: {
      patterns: z.array(z.string()).describe("glob 模式数组"),
      format: formatSchema,
      outputDir: z
        .string()
        .optional()
        .describe("输出目录（可选）。省略则各文件同目录换扩展名"),
      width: z.number().optional().describe("目标宽度（像素，可选）"),
      height: z.number().optional().describe("目标高度（像素，可选）"),
    },
  },
  async ({ patterns, format, outputDir, width, height }) => {
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
      let lastCount = 0;
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const output = outputDir
          ? join(outputDir, basename(f, extname(f)) + extensionForFormat(format))
          : undefined;
        const r = await convertFile(f, {
          format,
          output,
          width,
          height,
        });
        lastCount = r.compressionCount;
        lines.push(`✓ ${f}  → ${r.output}`);
      }
      lines.push(
        `\n完成 ${files.length} 张，目标格式 ${format}。本月已用 ${lastCount} 次。`
      );
      return { content: [{ type: "text", text: lines.join("\n") }] };
    } catch (e) {
      return {
        isError: true,
        content: [{ type: "text", text: `批量转换失败: ${e.message}` }],
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
