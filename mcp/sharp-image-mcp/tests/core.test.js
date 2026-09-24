import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import sharp from "sharp";
import { DEFAULT_FORMATS, DEFAULT_QUALITY, mapConcurrent, optimizeImages } from "../src/core.js";

async function withTemporaryDirectory(run) {
  const directory = await mkdtemp(join(tmpdir(), "sharp-image-mcp-"));
  try {
    return await run(directory);
  } finally {
    if (dirname(directory) !== tmpdir() || !basename(directory).startsWith("sharp-image-mcp-")) {
      throw new Error("拒绝清理意外路径");
    }
    await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}

async function createInput(directory, name = "sample.png") {
  // 仅用于测试的临时图片数据，测试结束会删除。
  const inputPath = join(directory, name);
  const pixels = randomBytes(96 * 72 * 3);
  await sharp(pixels, { raw: { width: 96, height: 72, channels: 3 } })
    .png()
    .toFile(inputPath);
  return inputPath;
}

test("任务同时运行且结果保持输入顺序", async () => {
  let active = 0;
  let peak = 0;
  const results = await mapConcurrent([1, 2, 3, 4], 2, async (value) => {
    active += 1;
    peak = Math.max(peak, active);
    await new Promise((done) => setTimeout(done, 20));
    active -= 1;
    return value * 2;
  });
  assert.deepEqual(results, [2, 4, 6, 8]);
  assert.equal(peak, 2);
});

test("多格式输出、同级目录、不覆盖源图和已有产物", async () => {
  await withTemporaryDirectory(async (directory) => {
    const inputPath = await createInput(directory);
    const original = await readFile(inputPath);
    const occupied = join(directory, "sample.optimized.webp");
    await writeFile(occupied, "已有文件");
    const data = await optimizeImages({
      inputPaths: [inputPath, inputPath],
      formats: ["jpeg", "png", "webp", "avif", "webp"],
      report: "html",
    });
    assert.equal(data.summary.inputCount, 1);
    assert.equal(data.summary.outputCount, 4);
    assert.equal(data.summary.failureCount, 0);
    assert.deepEqual(await readFile(inputPath), original);
    assert.equal(await readFile(occupied, "utf8"), "已有文件");
    assert.equal(data.results.find((item) => item.format === "webp").outputPath, join(directory, "sample.optimized-2.webp"));
    for (const item of data.results) {
      assert.equal(dirname(item.outputPath), directory);
      const expectedFormat = item.format === "avif" ? "heif" : item.format;
      assert.equal((await sharp(await readFile(item.outputPath)).metadata()).format, expectedFormat);
      assert.equal(item.quality, DEFAULT_QUALITY);
      assert.ok((await stat(item.outputPath)).size > 0);
    }
    const pngOutput = data.results.find((item) => item.format === "png");
    const originalPixels = await sharp(original).raw().toBuffer();
    const optimizedPixels = await sharp(await readFile(pngOutput.outputPath)).raw().toBuffer();
    assert.notDeepEqual(optimizedPixels, originalPixels);
    const html = await readFile(data.reportPath, "utf8");
    assert.match(html, /type="range"/);
    assert.match(html, /--split/);
    assert.match(html, /sample\.optimized-2\.webp/);
    assert.match(html, /画质 80\/100/);
    assert.doesNotMatch(html, /无损 PNG/);
  });
});

test("显式指定无损 PNG 时保留像素", async () => {
  await withTemporaryDirectory(async (directory) => {
    const inputPath = await createInput(directory);
    const originalPixels = await sharp(await readFile(inputPath)).raw().toBuffer();
    const data = await optimizeImages({ inputPaths: [inputPath], formats: ["png"], pngMode: "lossless" });
    assert.equal(data.results[0].quality, "lossless");
    const optimizedPixels = await sharp(await readFile(data.results[0].outputPath)).raw().toBuffer();
    assert.deepEqual(optimizedPixels, originalPixels);
  });
});

test("省略 formats 时输出全部格式，指定格式时仅输出所需格式", async () => {
  await withTemporaryDirectory(async (directory) => {
    const inputPath = await createInput(directory, "test.png");
    const defaults = await optimizeImages({ inputPaths: [inputPath] });
    assert.deepEqual(defaults.results.map((item) => item.format), DEFAULT_FORMATS);
    assert.equal(defaults.summary.outputCount, DEFAULT_FORMATS.length);
    assert.equal(defaults.reportPath, undefined);
    const targeted = await optimizeImages({ inputPaths: [inputPath], formats: ["webp"] });
    assert.deepEqual(targeted.results.map((item) => item.format), ["webp"]);
    assert.equal(targeted.summary.outputCount, 1);
  });
});

test("画质参数影响 JPEG 体积，重复运行继续避让文件名", async () => {
  await withTemporaryDirectory(async (directory) => {
    const inputPath = await createInput(directory);
    const low = await optimizeImages({ inputPaths: [inputPath], formats: ["jpeg"], quality: 30 });
    const high = await optimizeImages({ inputPaths: [inputPath], formats: ["jpeg"], quality: 95 });
    assert.equal(low.results[0].quality, 30);
    assert.equal(high.results[0].quality, 95);
    assert.ok(high.results[0].afterBytes > low.results[0].afterBytes);
    assert.notEqual(high.results[0].outputPath, low.results[0].outputPath);
  });
});

test("局部失败仍汇总成功产物，并在 HTML 中列出失败项", async () => {
  await withTemporaryDirectory(async (directory) => {
    const inputPath = await createInput(directory);
    const missing = join(directory, "missing.png");
    const data = await optimizeImages({
      inputPaths: [inputPath, missing],
      formats: ["webp"],
      report: "html",
    });
    assert.equal(data.summary.outputCount, 1);
    assert.equal(data.summary.failureCount, 1);
    assert.equal(data.failures[0].inputPath, missing);
    const html = await readFile(data.reportPath, "utf8");
    assert.match(html, /处理失败/);
    assert.match(html, /missing\.png/);
  });
});
