import { stat, writeFile } from "node:fs/promises";
import { basename, dirname, extname, isAbsolute, join, resolve } from "node:path";
import sharp from "sharp";
import { createHtmlReport } from "./report.js";

export const DEFAULT_QUALITY = 80;
export const DEFAULT_CONCURRENCY = 4;
export const DEFAULT_FORMATS = ["jpeg", "png", "webp", "avif"];
const SUPPORTED_FORMATS = new Set(DEFAULT_FORMATS);

/**
 * 按固定并发数执行任务，结果保留输入顺序。
 * 用例：4 个任务、并发 2 时，前两个任务可同时运行；任一完成后才启动下一个。
 */
export async function mapConcurrent(items, concurrency, task) {
  const results = new Array(items.length);
  let nextIndex = 0;
  const workerCount = Math.min(items.length, concurrency);
  const workers = Array.from({ length: workerCount }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await task(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

function normalizeInputs(inputPaths) {
  if (!Array.isArray(inputPaths) || inputPaths.length === 0) {
    throw new Error("inputPaths 至少需要一张图片");
  }
  const paths = [];
  const seen = new Set();
  for (const inputPath of inputPaths) {
    if (typeof inputPath !== "string" || !isAbsolute(inputPath)) {
      throw new Error("inputPaths 必须是绝对路径数组");
    }
    const normalized = resolve(inputPath);
    const identity = process.platform === "win32" ? normalized.toLowerCase() : normalized;
    if (!seen.has(identity)) {
      seen.add(identity);
      paths.push(normalized);
    }
  }
  return paths;
}

function normalizeFormats(formats) {
  const requested = formats === undefined ? DEFAULT_FORMATS : formats;
  if (!Array.isArray(requested) || requested.length === 0) {
    throw new Error("formats 至少需要一种输出格式");
  }
  for (const format of requested) {
    if (!SUPPORTED_FORMATS.has(format)) {
      throw new Error(`不支持的输出格式: ${format}`);
    }
  }
  return [...new Set(requested)];
}

function encode(inputPath, format, quality, pngMode) {
  const pipeline = sharp(inputPath).autoOrient();
  if (format === "jpeg") {
    return pipeline.flatten({ background: "#ffffff" }).jpeg({ quality, mozjpeg: true });
  }
  if (format === "webp") {
    return pipeline.webp({ quality, effort: 4 });
  }
  if (format === "avif") {
    return pipeline.avif({ quality, effort: 4 });
  }
  if (pngMode === "palette") {
    return pipeline.png({ palette: true, quality });
  }
  return pipeline.png({ palette: false, compressionLevel: 9 });
}

async function writeUniqueImage(inputPath, format, buffer) {
  const directory = dirname(inputPath);
  const name = basename(inputPath, extname(inputPath));
  const extension = format === "jpeg" ? "jpg" : format;
  for (let serial = 1; ; serial += 1) {
    const suffix = serial === 1 ? "" : `-${serial}`;
    const outputPath = join(directory, `${name}.optimized${suffix}.${extension}`);
    try {
      await writeFile(outputPath, buffer, { flag: "wx" });
      return outputPath;
    } catch (error) {
      if (error.code !== "EEXIST") {
        throw error;
      }
    }
  }
}

async function optimizeOne({ inputPath, format, quality, pngMode }) {
  const source = await stat(inputPath);
  if (!source.isFile()) {
    throw new Error("输入路径不是文件");
  }
  const buffer = await encode(inputPath, format, quality, pngMode).toBuffer();
  const outputPath = await writeUniqueImage(inputPath, format, buffer);
  const metadata = await sharp(buffer).metadata();
  return {
    inputPath,
    outputPath,
    format,
    quality: format === "png" && pngMode === "lossless" ? "lossless" : quality,
    beforeBytes: source.size,
    afterBytes: buffer.length,
    savedBytes: source.size - buffer.length,
    width: metadata.width,
    height: metadata.height,
  };
}

export async function optimizeImages(options) {
  const inputPaths = normalizeInputs(options.inputPaths);
  const formats = normalizeFormats(options.formats);
  const quality = options.quality === undefined ? DEFAULT_QUALITY : options.quality;
  const concurrency = options.concurrency === undefined ? DEFAULT_CONCURRENCY : options.concurrency;
  const pngMode = options.pngMode === undefined ? "palette" : options.pngMode;
  const report = options.report === undefined ? "summary" : options.report;
  if (!Number.isInteger(quality) || quality < 1 || quality > 100) {
    throw new Error("quality 必须是 1–100 的整数");
  }
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 16) {
    throw new Error("concurrency 必须是 1–16 的整数");
  }
  if (pngMode !== "lossless" && pngMode !== "palette") {
    throw new Error("pngMode 只能是 lossless 或 palette");
  }
  if (report !== "summary" && report !== "html") {
    throw new Error("report 只能是 summary 或 html");
  }

  const jobs = inputPaths.flatMap((inputPath) => formats.map((format) => ({
    inputPath, format, quality, pngMode,
  })));
  const settled = await mapConcurrent(jobs, concurrency, async (job) => {
    try {
      return { result: await optimizeOne(job) };
    } catch (error) {
      return {
        failure: {
          inputPath: job.inputPath,
          format: job.format,
          message: error instanceof Error ? error.message : String(error),
        },
      };
    }
  });
  const results = settled.filter((item) => item.result).map((item) => item.result);
  const failures = settled.filter((item) => item.failure).map((item) => item.failure);
  const beforeBytes = results.reduce((sum, item) => sum + item.beforeBytes, 0);
  const afterBytes = results.reduce((sum, item) => sum + item.afterBytes, 0);
  const summary = {
    inputCount: inputPaths.length,
    outputCount: results.length,
    failureCount: failures.length,
    beforeBytes,
    afterBytes,
    savedBytes: beforeBytes - afterBytes,
  };
  let reportPath;
  if (report === "html") {
    reportPath = await createHtmlReport(dirname(inputPaths[0]), { summary, results, failures });
  }
  return { summary, results, failures, reportPath };
}
