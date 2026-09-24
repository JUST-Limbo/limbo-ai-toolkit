import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";
import { DEFAULT_CONCURRENCY, DEFAULT_FORMATS, DEFAULT_QUALITY, optimizeImages } from "./core.js";

const server = new McpServer({ name: "sharp-image-mcp", version: "1.0.0" });

function formatBytes(value) {
  return `${(value / 1024).toFixed(1)} KB`;
}

server.registerTool(
  "optimize_images",
  {
    description: "并行优化本地图片；默认输出 JPEG/PNG/WebP/AVIF 四种格式，可指定 formats 仅输出所需格式。产物保存在源图同级目录且不会覆盖已有文件。默认画质 80，PNG 默认按此画质量化颜色，也可指定无损。需要详细画质对比时将 report 设为 html。",
    inputSchema: {
      inputPaths: z.array(z.string()).min(1).describe("输入图片的绝对路径数组"),
      formats: z.array(z.enum(["jpeg", "png", "webp", "avif"])).min(1).default(DEFAULT_FORMATS).describe("目标格式数组；省略时输出 JPEG、PNG、WebP、AVIF 全部格式"),
      quality: z.number().int().min(1).max(100).default(DEFAULT_QUALITY).describe("画质 1–100，默认 80；用于 JPEG、WebP、AVIF 和默认的调色板 PNG"),
      pngMode: z.enum(["lossless", "palette"]).default("palette").describe("PNG 默认按 quality 量化颜色；lossless 保留颜色且不使用 quality"),
      concurrency: z.number().int().min(1).max(16).default(DEFAULT_CONCURRENCY).describe("最大并行任务数，默认 4"),
      report: z.enum(["summary", "html"]).default("summary").describe("summary 只返回简报；html 在首张源图目录生成滑块对比报告"),
    },
  },
  async (options) => {
    try {
      const data = await optimizeImages(options);
      const summary = data.summary;
      const text = [
        `图片优化完成：${summary.inputCount} 张源图，成功 ${summary.outputCount} 份，失败 ${summary.failureCount} 份。`,
        `成功项体积合计：${formatBytes(summary.beforeBytes)} → ${formatBytes(summary.afterBytes)}（变化 ${formatBytes(summary.savedBytes)}）。`,
      ];
      if (data.reportPath) {
        text.push(`画质对比报告：${data.reportPath}`);
      }
      for (const item of data.results) {
        text.push(`${item.format.toUpperCase()}：${item.outputPath}，画质 ${item.quality}，${formatBytes(item.beforeBytes)} → ${formatBytes(item.afterBytes)}`);
      }
      for (const failure of data.failures) {
        text.push(`失败：${failure.inputPath} → ${failure.format}：${failure.message}`);
      }
      return {
        isError: summary.outputCount === 0,
        content: [{ type: "text", text: text.join("\n") }],
        structuredContent: data,
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `图片优化失败：${error instanceof Error ? error.message : String(error)}` }],
      };
    }
  }
);

server.connect(new StdioServerTransport()).catch((error) => {
  console.error("MCP 启动失败：", error);
  process.exitCode = 1;
});
