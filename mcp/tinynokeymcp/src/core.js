import { readFile, writeFile } from "node:fs/promises";
import { extname } from "node:path";
import https from "node:https";

/** tinynokeymcp 1.0.0 — 官网 Web 后台免 Key 压缩（非官方 API） */
const SHRINK_URL = "https://tinypng.com/backend/opt/shrink";
const MAX_BYTES = 5_200_000;
const ALLOWED_EXT = new Set([".png", ".jpg", ".jpeg"]);
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/**
 * 每张图随机伪造 X-Forwarded-For，模拟不同客户端 IP（与 yongplus/tinypng Web 模式一致）。
 *
 * @returns {string} 形如 "23.45.67.89"
 */
export function generateRandomIp() {
  const parts = [];
  for (let i = 0; i < 4; i++) {
    parts.push(String(Math.floor(Math.random() * 254) + 1));
  }
  return parts.join(".");
}

/**
 * @param {string} url
 * @param {object} [opts]
 * @param {string} [opts.method]
 * @param {Record<string, string>} [opts.headers]
 * @param {Buffer} [opts.body]
 */
function httpsRequest(url, opts = {}) {
  const method = opts.method || "GET";
  const headers = opts.headers || {};
  const body = opts.body;

  return new Promise(function (resolve, reject) {
    const u = new URL(url);
    const req = https.request(
      {
        method: method,
        hostname: u.hostname,
        path: u.pathname + u.search,
        headers: headers,
      },
      function (res) {
        const chunks = [];
        res.on("data", function (chunk) {
          chunks.push(chunk);
        });
        res.on("end", function () {
          resolve({
            status: res.statusCode || 0,
            headers: res.headers,
            body: Buffer.concat(chunks),
          });
        });
      }
    );
    req.on("error", reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

/**
 * 通过 TinyPNG 官网 Web 后台压缩单张图片（无需 API Key）。
 *
 * 实现参考公开项目 [yongplus/tinypng](https://github.com/yongplus/tinypng) Web 模式、
 * [super-tinypng](https://github.com/zhanyuzhang/super-tinypng)。
 *
 * @param {string} input  输入文件路径
 * @param {object} [options]
 * @param {string} [options.output]  输出路径；省略则覆盖原文件
 * @returns {Promise<object>}
 */
export async function compressFile(input, options = {}) {
  const ext = extname(input).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    throw new Error(
      `不支持的格式: ${ext}，免 Key 模式仅支持 .png / .jpg / .jpeg`
    );
  }

  const binary = await readFile(input);
  const before = binary.length;
  if (before > MAX_BYTES) {
    throw new Error(
      `文件过大: ${before} 字节，免 Key 模式上限约 ${MAX_BYTES} 字节（约 5MB）`
    );
  }

  const output = options.output || input;
  const ip = generateRandomIp();

  const upload = await httpsRequest(SHRINK_URL, {
    method: "POST",
    headers: {
      "User-Agent": USER_AGENT,
      "Content-Type": "application/octet-stream",
      "X-Forwarded-For": ip,
    },
    body: binary,
  });

  if (upload.status !== 201 && upload.status !== 200) {
    const snippet = upload.body.toString("utf8").slice(0, 300);
    throw new Error(
      `压缩接口失败 HTTP ${upload.status}: ${snippet || upload.status}`
    );
  }

  let json;
  try {
    json = JSON.parse(upload.body.toString("utf8"));
  } catch (parseErr) {
    throw new Error("压缩接口返回非 JSON: " + upload.body.toString("utf8").slice(0, 200));
  }

  const outputInfo = json.output;
  const downloadUrl = outputInfo && outputInfo.url;
  if (!downloadUrl) {
    throw new Error(
      "压缩接口响应缺少 output.url: " + upload.body.toString("utf8").slice(0, 300)
    );
  }

  const download = await httpsRequest(downloadUrl, {
    method: "GET",
    headers: {
      "User-Agent": USER_AGENT,
      "X-Forwarded-For": ip,
    },
  });

  if (download.status !== 200) {
    throw new Error(`下载压缩结果失败 HTTP ${download.status}`);
  }

  await writeFile(output, download.body);
  const after = download.body.length;

  return {
    input: input,
    output: output,
    before: before,
    after: after,
    saved: before - after,
    ratio: before ? (before - after) / before : 0,
    width: outputInfo.width,
    height: outputInfo.height,
    mode: "web",
  };
}
