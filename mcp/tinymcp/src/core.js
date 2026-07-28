import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import tinify from "tinify";

const ALLOWED_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif"]);

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

async function compressWithKey(input, opts, index) {
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

  const output = opts.output || input;
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
  };
}

/**
 * 压缩单个文件。多 Key 时按轮询选取起始 Key，失败则自动切换下一个。
 */
export async function compressFile(input, opts = {}) {
  const ext = extname(input).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    throw new Error(
      `不支持的格式: ${ext}，支持 .png / .jpg / .jpeg / .webp / .avif`
    );
  }

  if (apiKeys.length === 0) {
    throw new Error(
      "缺少 TinyPNG API Key（环境变量 TINIFY_API_KEY，或 CLI 的 -k）"
    );
  }

  const start = keyIndex;
  let lastError = null;

  for (let attempt = 0; attempt < apiKeys.length; attempt++) {
    const index = (start + attempt) % apiKeys.length;
    try {
      const result = await compressWithKey(input, opts, index);
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
