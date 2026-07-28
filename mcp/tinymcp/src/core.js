import { readFile } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import tinify from "tinify";

const ALLOWED_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif"]);

/** tinymcp 2.2.0 — 格式转换 MIME 映射 */
const FORMAT_ALIASES = {
  avif: "image/avif",
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  jxl: "image/jxl",
};

const MIME_TO_EXT = {
  "image/avif": ".avif",
  "image/webp": ".webp",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/jxl": ".jxl",
};

let apiKeys = [];
let keyIndex = 0;

/**
 * 解析多个 API Key 字符串，支持英文逗号、分号分隔。
 *
 * @param {string} raw
 * @returns {string[]}
 *
 * @example
 * parseApiKeys("k1,k2;k3") // => ["k1", "k2", "k3"]
 */
export function parseApiKeys(raw) {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * 将格式别名规范为 TinyPNG API 使用的 MIME 类型。
 *
 * @param {string} format  avif | webp | jpg | jpeg | png | jxl | image/webp 等
 * @returns {string}
 *
 * @example
 * normalizeFormat("webp") // => "image/webp"
 * normalizeFormat("image/avif") // => "image/avif"
 * normalizeFormat(".png") // => "image/png"
 */
export function normalizeFormat(format) {
  if (!format || typeof format !== "string") {
    throw new Error("缺少目标格式");
  }
  const raw = format.toLowerCase().trim();
  if (raw.indexOf("image/") === 0) {
    return raw;
  }
  if (raw.charAt(0) === ".") {
    const key = raw.slice(1);
    if (FORMAT_ALIASES[key]) {
      return FORMAT_ALIASES[key];
    }
  }
  if (FORMAT_ALIASES[raw]) {
    return FORMAT_ALIASES[raw];
  }
  throw new Error(
    `不支持的目标格式: ${format}，支持 avif / webp / jpg / png / jxl`
  );
}

/**
 * 根据目标格式返回推荐文件扩展名（含点号）。
 *
 * @param {string} format
 * @returns {string}
 *
 * @example
 * extensionForFormat("webp") // => ".webp"
 * extensionForFormat("jpeg") // => ".jpg"
 */
export function extensionForFormat(format) {
  const mime = normalizeFormat(format);
  const ext = MIME_TO_EXT[mime];
  if (ext) {
    return ext;
  }
  const parts = mime.split("/");
  return "." + parts[parts.length - 1];
}

/**
 * 解析格式转换的输出路径。
 * 未指定 output 时：与输入同目录、同主文件名，仅替换扩展名（保留原图）。
 *
 * @param {string} input
 * @param {string|undefined} output
 * @param {string} format
 * @returns {string}
 */
export function resolveConvertOutputPath(input, output, format) {
  const newExt = extensionForFormat(format);
  const stem = basename(input, extname(input));

  if (!output) {
    return join(dirname(input), stem + newExt);
  }

  const trimmed = output.replace(/[\\/]+$/, "");
  const outExt = extname(trimmed).toLowerCase();
  if (!outExt) {
    return join(trimmed, stem + newExt);
  }
  return trimmed;
}

/**
 * 设置一个或多个 TinyPNG 官方 API Key。
 * 申请：https://tinypng.com/developers
 *
 * @param {string|string[]} keys  单个 Key，或 `,` / `;` 分隔的多个 Key
 */
export function setApiKey(keys) {
  const list = Array.isArray(keys)
    ? keys.flatMap((k) => parseApiKeys(k))
    : parseApiKeys(keys);
  if (list.length === 0) {
    throw new Error(
      "缺少 TinyPNG API Key（环境变量 TINIFY_API_KEY，或 CLI 的 -k；多个 Key 用 , 或 ; 分隔）"
    );
  }
  apiKeys = list;
  keyIndex = 0;
  tinify.key = apiKeys[0];
}

/** 当前已配置的 Key 数量 */
export function getApiKeyCount() {
  return apiKeys.length;
}

function activateKey(index) {
  tinify.key = apiKeys[index];
}

function shouldTryNextKey(err) {
  const status = err && err.status;
  if (status === 401 || status === 429) return true;
  if (status >= 500 && status <= 599) return true;
  const msg = ((err && err.message) || "").toLowerCase();
  if (
    msg.includes("limit") ||
    msg.includes("quota") ||
    msg.includes("exceed") ||
    msg.includes("too many")
  ) {
    return true;
  }
  return false;
}

function assertInputExt(input) {
  const ext = extname(input).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    throw new Error(
      `不支持的输入格式: ${ext}，支持 .png / .jpg / .jpeg / .webp / .avif`
    );
  }
}

function assertApiKeys() {
  if (apiKeys.length === 0) {
    throw new Error(
      "缺少 TinyPNG API Key（环境变量 TINIFY_API_KEY，或 CLI 的 -k）"
    );
  }
}

/** 校验所有 Key，返回各 Key 本月已用次数 */
export async function validateKey() {
  const results = [];
  for (let i = 0; i < apiKeys.length; i++) {
    activateKey(i);
    await tinify.validate();
    results.push({
      index: i + 1,
      compressionCount: tinify.compressionCount,
    });
  }
  if (results.length === 1) {
    return { compressionCount: results[0].compressionCount, keys: results };
  }
  return { compressionCount: results[0].compressionCount, keys: results };
}

async function processImageWithKey(input, opts, index) {
  activateKey(index);

  const before = (await readFile(input)).length;
  let source = tinify.fromFile(input);

  if (opts.width || opts.height) {
    const method =
      opts.resizeMethod || (opts.width && opts.height ? "fit" : "scale");
    const resize = { method };
    if (opts.width) resize.width = opts.width;
    if (opts.height) resize.height = opts.height;
    source = source.resize(resize);
  }

  let output;
  let formatLabel = null;
  let mimeType = null;

  if (opts.format) {
    mimeType = normalizeFormat(opts.format);
    formatLabel = mimeType.split("/")[1];
    source = source.convert({ type: mimeType });
    output = resolveConvertOutputPath(input, opts.output, opts.format);
  } else {
    output = opts.output || input;
  }

  await source.toFile(output);
  const after = (await readFile(output)).length;

  return {
    input,
    output,
    before,
    after,
    saved: before - after,
    ratio: before ? (before - after) / before : 0,
    compressionCount: tinify.compressionCount,
    keyIndex: index + 1,
    keyCount: apiKeys.length,
    format: formatLabel,
    mimeType: mimeType,
  };
}

async function runWithKeyRotation(input, opts) {
  const start = keyIndex;
  let lastError = null;

  for (let attempt = 0; attempt < apiKeys.length; attempt++) {
    const index = (start + attempt) % apiKeys.length;
    try {
      const result = await processImageWithKey(input, opts, index);
      keyIndex = (index + 1) % apiKeys.length;
      return result;
    } catch (err) {
      lastError = err;
      const hasMore = attempt < apiKeys.length - 1;
      if (!hasMore || !shouldTryNextKey(err)) {
        throw err;
      }
    }
  }

  throw lastError;
}

/**
 * 压缩单个文件（保持原格式）。多 Key 时按轮询选取起始 Key，失败则自动切换下一个。
 *
 * @param {string} input
 * @param {object} [opts]
 * @param {string} [opts.output]  输出路径；省略则覆盖原文件
 * @param {number} [opts.width]
 * @param {number} [opts.height]
 */
export async function compressFile(input, opts = {}) {
  assertInputExt(input);
  assertApiKeys();
  return runWithKeyRotation(input, opts);
}

/**
 * 将图片转换为目标格式并压缩（基于 TinyPNG convert API）。
 * 未指定 output 时：与输入同目录、同主文件名，仅替换扩展名，**不覆盖原图**。
 *
 * @param {string} input
 * @param {object} opts
 * @param {string} opts.format  目标格式：avif | webp | jpg | png | jxl
 * @param {string} [opts.output]  输出文件或目录
 * @param {number} [opts.width]
 * @param {number} [opts.height]
 *
 * @example
 * await convertFile("hero.png", { format: "webp" });
 * // => 同目录 hero.webp，保留 hero.png
 *
 * @example
 * await convertFile("hero.png", { format: "avif", output: "dist/" });
 * // => dist/hero.avif
 */
export async function convertFile(input, opts = {}) {
  if (!opts.format) {
    throw new Error("convertFile 需要 format 参数（avif / webp / jpg / png / jxl）");
  }
  assertInputExt(input);
  assertApiKeys();
  normalizeFormat(opts.format);
  return runWithKeyRotation(input, opts);
}

/**
 * 从同一张输入图导出多种目标格式（每种格式各调用一次 API，各计 1 次额度）。
 *
 * @param {string} input
 * @param {object} opts
 * @param {string[]} opts.formats  如 ["avif", "webp", "jpg"]
 * @param {string} [opts.outputDir]  输出目录；省略则与输入同目录
 * @param {number} [opts.width]
 * @param {number} [opts.height]
 * @returns {Promise<object[]>}
 *
 * @example
 * await convertToFormats("hero.png", { formats: ["avif", "webp", "jpg"] });
 */
export async function convertToFormats(input, opts = {}) {
  const formats = opts.formats;
  if (!formats || !Array.isArray(formats) || formats.length === 0) {
    throw new Error("convertToFormats 需要 formats 数组，如 ['avif','webp','jpg']");
  }

  const results = [];
  for (let i = 0; i < formats.length; i++) {
    const format = formats[i];
    const output = opts.outputDir
      ? join(
          opts.outputDir.replace(/[\\/]+$/, ""),
          basename(input, extname(input)) + extensionForFormat(format)
        )
      : undefined;
    const r = await convertFile(input, {
      format: format,
      output: output,
      width: opts.width,
      height: opts.height,
    });
    results.push(r);
  }
  return results;
}
