#!/usr/bin/env node
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/mcp.js
var import_mcp = require("@modelcontextprotocol/sdk/server/mcp.js");
var import_stdio = require("@modelcontextprotocol/sdk/server/stdio.js");
var z = __toESM(require("zod/v4"), 1);

// src/core.js
var import_promises2 = require("node:fs/promises");
var import_node_path2 = require("node:path");
var import_sharp = __toESM(require("sharp"), 1);

// src/report.js
var import_promises = require("node:fs/promises");
var import_node_path = require("node:path");
var import_node_url = require("node:url");
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}
function assetUrl(reportDirectory, imagePath) {
  const path = (0, import_node_path.relative)(reportDirectory, imagePath);
  if ((0, import_node_path.isAbsolute)(path)) {
    return (0, import_node_url.pathToFileURL)(imagePath).href;
  }
  return path.split(import_node_path.sep).map(encodeURIComponent).join("/");
}
function bytes(value) {
  return `${(value / 1024).toFixed(1)} KB`;
}
function comparisonCard(reportDirectory, item, index) {
  const originalUrl = escapeHtml(assetUrl(reportDirectory, item.inputPath));
  const optimizedUrl = escapeHtml(assetUrl(reportDirectory, item.outputPath));
  const originalName = escapeHtml((0, import_node_path.basename)(item.inputPath));
  const outputName = escapeHtml((0, import_node_path.basename)(item.outputPath));
  const quality = item.quality === "lossless" ? "\u65E0\u635F PNG" : `${item.quality}/100`;
  const width = Number.isInteger(item.width) && item.width > 0 ? item.width : 1;
  const height = Number.isInteger(item.height) && item.height > 0 ? item.height : 1;
  const change = item.beforeBytes > 0 ? `${(item.savedBytes / item.beforeBytes * 100).toFixed(1)}%` : "0.0%";
  return `<section class="card">
    <h2>${originalName} \u2192 ${outputName}</h2>
    <p class="meta">\u683C\u5F0F ${escapeHtml(item.format.toUpperCase())} \xB7 \u753B\u8D28 ${escapeHtml(quality)} \xB7 ${bytes(item.beforeBytes)} \u2192 ${bytes(item.afterBytes)} \xB7 \u4F53\u79EF\u53D8\u5316 ${change}</p>
    <figure>
      <div class="comparison" style="aspect-ratio:${width}/${height};--split:50%">
        <img class="optimized" src="${optimizedUrl}" alt="\u4F18\u5316\u540E\uFF1A${outputName}">
        <img class="original" src="${originalUrl}" alt="\u539F\u56FE\uFF1A${originalName}">
        <span class="divider" aria-hidden="true"><span class="handle">\u2194</span></span>
        <input type="range" min="0" max="100" value="50" aria-label="\u62D6\u52A8\u6BD4\u8F83\u7B2C ${index + 1} \u7EC4\u56FE\u7247\u7684\u539F\u56FE\u548C\u4F18\u5316\u56FE">
      </div>
      <figcaption><span>\u539F\u56FE \xB7 ${bytes(item.beforeBytes)}</span><span>\u4F18\u5316\u540E \xB7 ${bytes(item.afterBytes)}</span></figcaption>
    </figure>
  </section>`;
}
function renderHtml(reportDirectory, data) {
  const cards = data.results.map((item, index) => comparisonCard(reportDirectory, item, index)).join("\n");
  const failures = data.failures.length > 0 ? `<section class="card"><h2>\u5904\u7406\u5931\u8D25</h2><ul>${data.failures.map((item) => `<li>${escapeHtml(item.inputPath)} (${escapeHtml(item.format)}): ${escapeHtml(item.message)}</li>`).join("")}</ul></section>` : "";
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>\u56FE\u7247\u4F18\u5316\u753B\u8D28\u5BF9\u6BD4\u62A5\u544A</title>
<style>
  :root { color-scheme: light; font-family: system-ui, sans-serif; background: #f4f6f9; color: #172033; }
  body { margin: 0; padding: 24px; }
  main { max-width: 1080px; margin: auto; }
  h1 { margin-bottom: 8px; }
  h2 { font-size: 1.15rem; overflow-wrap: anywhere; }
  .summary, .meta { color: #536178; line-height: 1.6; }
  .card { background: white; border: 1px solid #dbe2eb; border-radius: 14px; padding: 20px; margin: 20px 0; box-shadow: 0 5px 18px #1720330a; }
  figure { margin: 18px 0 0; }
  .comparison { position: relative; width: 100%; max-height: 72vh; overflow: hidden; background-color: #fff; background-image: linear-gradient(45deg, #e6e9ee 25%, transparent 25%), linear-gradient(-45deg, #e6e9ee 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e6e9ee 75%), linear-gradient(-45deg, transparent 75%, #e6e9ee 75%); background-size: 24px 24px; background-position: 0 0, 0 12px, 12px -12px, -12px 0; }
  .comparison img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; }
  .comparison .original { clip-path: inset(0 calc(100% - var(--split)) 0 0); }
  .divider { position: absolute; top: 0; bottom: 0; left: var(--split); width: 2px; background: #fff; box-shadow: 0 0 0 1px #17203366; pointer-events: none; }
  .handle { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; background: #fff; color: #172033; box-shadow: 0 2px 12px #17203366; font-size: 22px; }
  .comparison input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: ew-resize; }
  .comparison:focus-within { outline: 3px solid #3569d4; outline-offset: 3px; }
  figcaption { display: flex; justify-content: space-between; gap: 12px; margin-top: 10px; color: #536178; font-size: .9rem; }
  li { overflow-wrap: anywhere; margin: 8px 0; }
</style>
</head>
<body>
<main>
  <h1>\u56FE\u7247\u4F18\u5316\u753B\u8D28\u5BF9\u6BD4\u62A5\u544A</h1>
  <p class="summary">\u6E90\u56FE\u7247 ${data.summary.inputCount} \u5F20 \xB7 \u6210\u529F ${data.summary.outputCount} \u4EFD \xB7 \u5931\u8D25 ${data.summary.failureCount} \u4EFD \xB7 \u6210\u529F\u9879\u5408\u8BA1 ${bytes(data.summary.beforeBytes)} \u2192 ${bytes(data.summary.afterBytes)}</p>
  <p class="summary">\u5728\u56FE\u7247\u4E0A\u5DE6\u53F3\u62D6\u52A8\u5206\u754C\u7EBF\uFF0C\u4E5F\u53EF\u805A\u7126\u540E\u4F7F\u7528\u65B9\u5411\u952E\u3002\u56FE\u7247\u901A\u8FC7\u76F8\u5BF9\u8DEF\u5F84\u5F15\u7528\uFF1B\u79FB\u52A8\u62A5\u544A\u65F6\u8BF7\u4E00\u540C\u4FDD\u7559\u6E90\u56FE\u548C\u8F93\u51FA\u56FE\u3002</p>
  ${cards}
  ${failures}
</main>
<script>
  document.querySelectorAll('.comparison').forEach((comparison) => {
    const slider = comparison.querySelector('input[type="range"]');
    slider.addEventListener('input', () => {
      comparison.style.setProperty('--split', slider.value + '%');
    });
  });
</script>
</body>
</html>`;
}
async function createHtmlReport(reportDirectory, data) {
  const html = renderHtml(reportDirectory, data);
  for (let serial = 1; ; serial += 1) {
    const suffix = serial === 1 ? "" : `-${serial}`;
    const reportPath = (0, import_node_path.join)(reportDirectory, `image-comparison${suffix}.html`);
    try {
      await (0, import_promises.writeFile)(reportPath, html, { flag: "wx", encoding: "utf8" });
      return reportPath;
    } catch (error) {
      if (error.code !== "EEXIST") {
        throw error;
      }
    }
  }
}

// src/core.js
var DEFAULT_QUALITY = 80;
var DEFAULT_CONCURRENCY = 4;
var DEFAULT_FORMATS = ["jpeg", "png", "webp", "avif"];
var SUPPORTED_FORMATS = new Set(DEFAULT_FORMATS);
async function mapConcurrent(items, concurrency, task) {
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
    throw new Error("inputPaths \u81F3\u5C11\u9700\u8981\u4E00\u5F20\u56FE\u7247");
  }
  const paths = [];
  const seen = /* @__PURE__ */ new Set();
  for (const inputPath of inputPaths) {
    if (typeof inputPath !== "string" || !(0, import_node_path2.isAbsolute)(inputPath)) {
      throw new Error("inputPaths \u5FC5\u987B\u662F\u7EDD\u5BF9\u8DEF\u5F84\u6570\u7EC4");
    }
    const normalized = (0, import_node_path2.resolve)(inputPath);
    const identity = process.platform === "win32" ? normalized.toLowerCase() : normalized;
    if (!seen.has(identity)) {
      seen.add(identity);
      paths.push(normalized);
    }
  }
  return paths;
}
function normalizeFormats(formats) {
  const requested = formats === void 0 ? DEFAULT_FORMATS : formats;
  if (!Array.isArray(requested) || requested.length === 0) {
    throw new Error("formats \u81F3\u5C11\u9700\u8981\u4E00\u79CD\u8F93\u51FA\u683C\u5F0F");
  }
  for (const format of requested) {
    if (!SUPPORTED_FORMATS.has(format)) {
      throw new Error(`\u4E0D\u652F\u6301\u7684\u8F93\u51FA\u683C\u5F0F: ${format}`);
    }
  }
  return [...new Set(requested)];
}
function encode(inputPath, format, quality, pngMode) {
  const pipeline = (0, import_sharp.default)(inputPath).autoOrient();
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
  const directory = (0, import_node_path2.dirname)(inputPath);
  const name = (0, import_node_path2.basename)(inputPath, (0, import_node_path2.extname)(inputPath));
  const extension = format === "jpeg" ? "jpg" : format;
  for (let serial = 1; ; serial += 1) {
    const suffix = serial === 1 ? "" : `-${serial}`;
    const outputPath = (0, import_node_path2.join)(directory, `${name}.optimized${suffix}.${extension}`);
    try {
      await (0, import_promises2.writeFile)(outputPath, buffer, { flag: "wx" });
      return outputPath;
    } catch (error) {
      if (error.code !== "EEXIST") {
        throw error;
      }
    }
  }
}
async function optimizeOne({ inputPath, format, quality, pngMode }) {
  const source = await (0, import_promises2.stat)(inputPath);
  if (!source.isFile()) {
    throw new Error("\u8F93\u5165\u8DEF\u5F84\u4E0D\u662F\u6587\u4EF6");
  }
  const buffer = await encode(inputPath, format, quality, pngMode).toBuffer();
  const outputPath = await writeUniqueImage(inputPath, format, buffer);
  const metadata = await (0, import_sharp.default)(buffer).metadata();
  return {
    inputPath,
    outputPath,
    format,
    quality: format === "png" && pngMode === "lossless" ? "lossless" : quality,
    beforeBytes: source.size,
    afterBytes: buffer.length,
    savedBytes: source.size - buffer.length,
    width: metadata.width,
    height: metadata.height
  };
}
async function optimizeImages(options) {
  const inputPaths = normalizeInputs(options.inputPaths);
  const formats = normalizeFormats(options.formats);
  const quality = options.quality === void 0 ? DEFAULT_QUALITY : options.quality;
  const concurrency = options.concurrency === void 0 ? DEFAULT_CONCURRENCY : options.concurrency;
  const pngMode = options.pngMode === void 0 ? "palette" : options.pngMode;
  const report = options.report === void 0 ? "summary" : options.report;
  if (!Number.isInteger(quality) || quality < 1 || quality > 100) {
    throw new Error("quality \u5FC5\u987B\u662F 1\u2013100 \u7684\u6574\u6570");
  }
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 16) {
    throw new Error("concurrency \u5FC5\u987B\u662F 1\u201316 \u7684\u6574\u6570");
  }
  if (pngMode !== "lossless" && pngMode !== "palette") {
    throw new Error("pngMode \u53EA\u80FD\u662F lossless \u6216 palette");
  }
  if (report !== "summary" && report !== "html") {
    throw new Error("report \u53EA\u80FD\u662F summary \u6216 html");
  }
  const jobs = inputPaths.flatMap((inputPath) => formats.map((format) => ({
    inputPath,
    format,
    quality,
    pngMode
  })));
  const settled = await mapConcurrent(jobs, concurrency, async (job) => {
    try {
      return { result: await optimizeOne(job) };
    } catch (error) {
      return {
        failure: {
          inputPath: job.inputPath,
          format: job.format,
          message: error instanceof Error ? error.message : String(error)
        }
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
    savedBytes: beforeBytes - afterBytes
  };
  let reportPath;
  if (report === "html") {
    reportPath = await createHtmlReport((0, import_node_path2.dirname)(inputPaths[0]), { summary, results, failures });
  }
  return { summary, results, failures, reportPath };
}

// src/mcp.js
var server = new import_mcp.McpServer({ name: "sharp-image-mcp", version: "1.0.0" });
function formatBytes(value) {
  return `${(value / 1024).toFixed(1)} KB`;
}
server.registerTool(
  "optimize_images",
  {
    description: "\u5E76\u884C\u4F18\u5316\u672C\u5730\u56FE\u7247\uFF1B\u9ED8\u8BA4\u8F93\u51FA JPEG/PNG/WebP/AVIF \u56DB\u79CD\u683C\u5F0F\uFF0C\u53EF\u6307\u5B9A formats \u4EC5\u8F93\u51FA\u6240\u9700\u683C\u5F0F\u3002\u4EA7\u7269\u4FDD\u5B58\u5728\u6E90\u56FE\u540C\u7EA7\u76EE\u5F55\u4E14\u4E0D\u4F1A\u8986\u76D6\u5DF2\u6709\u6587\u4EF6\u3002\u9ED8\u8BA4\u753B\u8D28 80\uFF0CPNG \u9ED8\u8BA4\u6309\u6B64\u753B\u8D28\u91CF\u5316\u989C\u8272\uFF0C\u4E5F\u53EF\u6307\u5B9A\u65E0\u635F\u3002\u9700\u8981\u8BE6\u7EC6\u753B\u8D28\u5BF9\u6BD4\u65F6\u5C06 report \u8BBE\u4E3A html\u3002",
    inputSchema: {
      inputPaths: z.array(z.string()).min(1).describe("\u8F93\u5165\u56FE\u7247\u7684\u7EDD\u5BF9\u8DEF\u5F84\u6570\u7EC4"),
      formats: z.array(z.enum(["jpeg", "png", "webp", "avif"])).min(1).default(DEFAULT_FORMATS).describe("\u76EE\u6807\u683C\u5F0F\u6570\u7EC4\uFF1B\u7701\u7565\u65F6\u8F93\u51FA JPEG\u3001PNG\u3001WebP\u3001AVIF \u5168\u90E8\u683C\u5F0F"),
      quality: z.number().int().min(1).max(100).default(DEFAULT_QUALITY).describe("\u753B\u8D28 1\u2013100\uFF0C\u9ED8\u8BA4 80\uFF1B\u7528\u4E8E JPEG\u3001WebP\u3001AVIF \u548C\u9ED8\u8BA4\u7684\u8C03\u8272\u677F PNG"),
      pngMode: z.enum(["lossless", "palette"]).default("palette").describe("PNG \u9ED8\u8BA4\u6309 quality \u91CF\u5316\u989C\u8272\uFF1Blossless \u4FDD\u7559\u989C\u8272\u4E14\u4E0D\u4F7F\u7528 quality"),
      concurrency: z.number().int().min(1).max(16).default(DEFAULT_CONCURRENCY).describe("\u6700\u5927\u5E76\u884C\u4EFB\u52A1\u6570\uFF0C\u9ED8\u8BA4 4"),
      report: z.enum(["summary", "html"]).default("summary").describe("summary \u53EA\u8FD4\u56DE\u7B80\u62A5\uFF1Bhtml \u5728\u9996\u5F20\u6E90\u56FE\u76EE\u5F55\u751F\u6210\u6ED1\u5757\u5BF9\u6BD4\u62A5\u544A")
    }
  },
  async (options) => {
    try {
      const data = await optimizeImages(options);
      const summary = data.summary;
      const text = [
        `\u56FE\u7247\u4F18\u5316\u5B8C\u6210\uFF1A${summary.inputCount} \u5F20\u6E90\u56FE\uFF0C\u6210\u529F ${summary.outputCount} \u4EFD\uFF0C\u5931\u8D25 ${summary.failureCount} \u4EFD\u3002`,
        `\u6210\u529F\u9879\u4F53\u79EF\u5408\u8BA1\uFF1A${formatBytes(summary.beforeBytes)} \u2192 ${formatBytes(summary.afterBytes)}\uFF08\u53D8\u5316 ${formatBytes(summary.savedBytes)}\uFF09\u3002`
      ];
      if (data.reportPath) {
        text.push(`\u753B\u8D28\u5BF9\u6BD4\u62A5\u544A\uFF1A${data.reportPath}`);
      }
      for (const item of data.results) {
        text.push(`${item.format.toUpperCase()}\uFF1A${item.outputPath}\uFF0C\u753B\u8D28 ${item.quality}\uFF0C${formatBytes(item.beforeBytes)} \u2192 ${formatBytes(item.afterBytes)}`);
      }
      for (const failure of data.failures) {
        text.push(`\u5931\u8D25\uFF1A${failure.inputPath} \u2192 ${failure.format}\uFF1A${failure.message}`);
      }
      return {
        isError: summary.outputCount === 0,
        content: [{ type: "text", text: text.join("\n") }],
        structuredContent: data
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `\u56FE\u7247\u4F18\u5316\u5931\u8D25\uFF1A${error instanceof Error ? error.message : String(error)}` }]
      };
    }
  }
);
server.connect(new import_stdio.StdioServerTransport()).catch((error) => {
  console.error("MCP \u542F\u52A8\u5931\u8D25\uFF1A", error);
  process.exitCode = 1;
});
