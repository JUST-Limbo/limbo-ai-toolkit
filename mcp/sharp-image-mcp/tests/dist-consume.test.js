import assert from "node:assert/strict";
import { cp, mkdtemp, rm, stat } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import sharp from "sharp";

async function removeTemporaryDirectory(directory, prefix) {
  if (dirname(directory) !== tmpdir() || !basename(directory).startsWith(prefix)) {
    throw new Error("拒绝清理意外路径");
  }
  await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}

test("只复制 dist 目录即可在隔离环境启动并优化图片", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "sharp-image-mcp-consume-"));
  const imageDirectory = await mkdtemp(join(tmpdir(), "sharp-image-mcp-input-"));
  const client = new Client({ name: "sharp-image-mcp-consume-test", version: "1.0.0" });
  try {
    await cp(resolve("dist"), join(workspace, "dist"), { recursive: true });
    const serverPath = join(workspace, "dist", "sharp-image-mcp.cjs");
    const inputPath = join(imageDirectory, "input.png");
    // 仅用于隔离取用测试的临时图片，测试结束会删除。
    await sharp({ create: { width: 16, height: 16, channels: 4, background: "#2080e0" } })
      .png()
      .toFile(inputPath);
    await client.connect(new StdioClientTransport({ command: process.execPath, args: [serverPath] }));
    const response = await client.callTool({
      name: "optimize_images",
      arguments: { inputPaths: [inputPath], formats: ["webp"] },
    });
    assert.equal(response.isError, false);
    assert.equal(response.structuredContent.summary.outputCount, 1);
    assert.ok((await stat(response.structuredContent.results[0].outputPath)).size > 0);
  } finally {
    await client.close();
    await removeTemporaryDirectory(workspace, "sharp-image-mcp-consume-");
    await removeTemporaryDirectory(imageDirectory, "sharp-image-mcp-input-");
  }
});
