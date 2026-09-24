import assert from "node:assert/strict";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import sharp from "sharp";

test("stdio MCP 暴露画质参数并完成一次优化调用", async () => {
  const directory = await mkdtemp(join(tmpdir(), "sharp-image-mcp-"));
  const serverPath = resolve("dist/sharp-image-mcp.cjs");
  const client = new Client({ name: "sharp-image-mcp-test", version: "1.0.0" });
  try {
    const inputPath = join(directory, "input.png");
    // 仅用于协议测试的临时图片，测试结束会删除。
    await sharp({ create: { width: 16, height: 16, channels: 4, background: "#2080e0" } })
      .png()
      .toFile(inputPath);
    await client.connect(new StdioClientTransport({ command: process.execPath, args: [serverPath] }));
    const tools = await client.listTools();
    assert.equal(tools.tools.length, 1);
    assert.equal(tools.tools[0].name, "optimize_images");
    assert.ok(tools.tools[0].inputSchema.properties.quality);
    assert.equal(tools.tools[0].inputSchema.properties.quality.default, 80);
    assert.equal(tools.tools[0].inputSchema.properties.pngMode.default, "palette");
    assert.ok(tools.tools[0].inputSchema.properties.formats);
    assert.deepEqual(tools.tools[0].inputSchema.properties.formats.default, ["jpeg", "png", "webp", "avif"]);
    assert.equal(tools.tools[0].inputSchema.required.includes("formats"), false);
    const response = await client.callTool({
      name: "optimize_images",
      arguments: { inputPaths: [inputPath], formats: ["webp"], quality: 90 },
    });
    assert.equal(response.isError, false);
    assert.equal(response.structuredContent.summary.outputCount, 1);
    assert.equal(response.structuredContent.results[0].quality, 90);
    assert.equal(dirname(response.structuredContent.results[0].outputPath), directory);
    assert.ok((await stat(response.structuredContent.results[0].outputPath)).size > 0);
    const defaultResponse = await client.callTool({
      name: "optimize_images",
      arguments: { inputPaths: [inputPath] },
    });
    assert.equal(defaultResponse.isError, false);
    assert.deepEqual(defaultResponse.structuredContent.results.map((item) => item.format), ["jpeg", "png", "webp", "avif"]);
    assert.equal(defaultResponse.structuredContent.results.find((item) => item.format === "png").quality, 80);
  } finally {
    await client.close();
    if (dirname(directory) !== tmpdir() || !basename(directory).startsWith("sharp-image-mcp-")) {
      throw new Error("拒绝清理意外路径");
    }
    await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});
