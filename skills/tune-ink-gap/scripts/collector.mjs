// tune-ink-gap 1.2.0：局域网临时采集服务。
import http from "node:http";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile, appendFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { networkInterfaces, tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const maxBytes = 64 * 1024;

function requestError(status, message) {
  return Object.assign(new Error(message), { status });
}

async function readBody(request) {
  return await new Promise((done, reject) => {
    let size = 0;
    const chunks = [];
    request.on("data", chunk => {
      size += chunk.length;
      if (size > maxBytes) {
        chunks.length = 0;
        reject(requestError(413, "上报超过 64 KiB"));
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      if (size > maxBytes) return;
      try {
        done(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(requestError(400, "需要有效的 JSON 上报"));
      }
    });
    request.on("error", reject);
    request.on("aborted", () => reject(requestError(400, "上报连接已中断")));
  });
}

function validateReport(report, session) {
  if (!report || typeof report !== "object" || Array.isArray(report)) {
    throw requestError(400, "上报必须是对象");
  }
  if (report.session !== session) throw requestError(409, "本轮会话不匹配，请更新测量入口");
  if (report.skill !== "tune-ink-gap" || report.schemaVersion !== 1) {
    throw requestError(400, "不支持的测量格式");
  }
  if (report.status === "error") {
    if (!report.error || typeof report.error.message !== "string" || !report.error.message.trim() ||
        !Array.isArray(report.measurements) || report.measurements.length !== 0) {
      throw requestError(400, "诊断记录需要错误信息，不能携带测量成功数据");
    }
    return;
  }
  if (report.status !== undefined && report.status !== "ok") {
    throw requestError(400, "不支持的上报状态");
  }
  if (!Array.isArray(report.measurements) || report.measurements.length === 0) {
    throw requestError(400, "上报缺少 measurements");
  }
  for (const item of report.measurements) {
    if (!item || !Number.isFinite(item.boxGap) || !Number.isFinite(item.suggestedBoxGap)) {
      throw requestError(400, "测量结果缺少有效的盒间距");
    }
  }
}

/**
 * 用法：const run = await startCollector({ host: "127.0.0.1", port: 0 });
 * 用 run.reportFile 读取 JSONL，完成后 await run.close()。不注册进程信号、不删除记录。
 * host 默认为局域网监听；origins 只接受完整 HTTP(S) origin，不使用通配 CORS。
 */
export async function startCollector(options = {}) {
  const host = options.host || "0.0.0.0";
  const port = options.port === undefined ? 47381 : options.port;
  const session = randomBytes(18).toString("hex");
  const reportFile = resolve(options.out || join(tmpdir(), "tune-ink-gap", session, "reports.jsonl"));
  const origins = new Set(options.origins || []);
  for (const origin of origins) {
    const parsed = new URL(origin);
    if (!["http:", "https:"].includes(parsed.protocol) || parsed.origin !== origin) {
      throw new Error("--origin 必须为完整 origin，例如 http://192.168.1.10:5173");
    }
  }
  const [script, preview] = await Promise.all([
    readFile(join(root, "measure.js"), "utf8"),
    readFile(join(root, "../assets/preview.html"), "utf8")
  ]);
  await mkdir(dirname(reportFile), { recursive: true });
  // 明确拒绝覆盖已有输出；每轮默认使用独立的系统临时目录。
  await writeFile(reportFile, "", { flag: "wx" });
  let writes = Promise.resolve();
  let reportCount = 0;
  const server = http.createServer(async (request, response) => {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    const send = (status, data) => {
      response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify(data));
    };
    try {
      const pathname = new URL(request.url, "http://collector.invalid").pathname;
      const origin = request.headers.origin;
      const sameOrigin = "http://" + request.headers.host;
      if (origin && origin !== sameOrigin && !origins.has(origin)) {
        throw requestError(403, "此页面来源未获允许，请用 --origin 声明目标页面来源");
      }
      if (origin) {
        response.setHeader("Access-Control-Allow-Origin", origin);
        response.setHeader("Vary", "Origin");
      }
      if (request.method === "OPTIONS" && pathname === "/report") {
        response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type");
        response.writeHead(204);
        response.end();
        return;
      }
      if (request.method === "GET" && pathname === "/health") {
        send(200, { ok: true, skill: "tune-ink-gap" });
        return;
      }
      if (request.method === "GET" && pathname === "/") {
        response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        response.end(preview.replace("__INK_SESSION_JSON__", JSON.stringify(session)));
        return;
      }
      if (request.method === "GET" && pathname === "/measure.js") {
        response.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8" });
        response.end(script);
        return;
      }
      if (request.method !== "POST" || pathname !== "/report") {
        send(404, { ok: false, error: "路径不存在" });
        return;
      }
      if (!(request.headers["content-type"] || "").toLowerCase().startsWith("application/json")) {
        throw requestError(415, "请使用 application/json 上报");
      }
      const report = await readBody(request);
      validateReport(report, session);
      const record = { ...report, receivedAt: new Date().toISOString() };
      // 串行追加；只有本次写入完成才回应成功，一次写入失败不阻塞后续请求。
      const write = writes.then(async () => {
        await appendFile(reportFile, JSON.stringify(record) + "\n");
        reportCount += 1;
      });
      writes = write.catch(() => {});
      await write;
      send(201, { ok: true, session, receivedAt: record.receivedAt });
      if (options.onReport) options.onReport({ reportCount, status: report.status || "ok", receivedAt: record.receivedAt });
    } catch (error) {
      if (!response.destroyed && !response.headersSent) {
        send(error.status || 500, {
          ok: false,
          error: error.status ? error.message : "保存失败，请检查采集服务终端"
        });
      }
      if (!error.status) console.error("[tune-ink-gap]", error.message);
    }
  });
  server.requestTimeout = 10000;
  server.headersTimeout = 10000;
  await new Promise((ready, reject) => {
    server.once("error", reject);
    server.listen(port, host, ready);
  });
  return {
    server, session, reportFile,
    port: server.address().port,
    async close() {
      await new Promise((done, reject) => {
        server.close(error => error ? reject(error) : done());
        server.closeIdleConnections();
      });
      await writes;
    }
  };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    console.log("用法：node collector.mjs [--host 0.0.0.0] [--port 47381] [--origin 页面来源] [--out JSONL路径] [--timeout 900]\n--origin 可重复；默认 15 分钟自动退出，Ctrl+C 可提前结束。输出已有文件时拒绝覆盖。");
    return;
  }
  const options = { origins: [] };
  let timeout = 900;
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    const value = args[index + 1];
    if (!value || !["--host", "--port", "--origin", "--out", "--timeout"].includes(key)) {
      throw new Error("参数无效，使用 --help 查看用法");
    }
    if (key === "--origin") options.origins.push(value);
    if (key === "--host") options.host = value;
    if (key === "--out") options.out = value;
    if (key === "--port") {
      options.port = Number(value);
      if (!Number.isInteger(options.port) || options.port < 0 || options.port > 65535) {
        throw new Error("端口应在 0–65535 之间");
      }
    }
    if (key === "--timeout") {
      timeout = Number(value);
      if (!Number.isFinite(timeout) || timeout <= 0) throw new Error("超时秒数应大于零");
    }
  }
  options.onReport = info => console.log(JSON.stringify({ type: "report", ...info }));
  const run = await startCollector(options);
  const bindHost = options.host || "0.0.0.0";
  const urls = ["http://" + (bindHost === "0.0.0.0" ? "127.0.0.1" : bindHost) + ":" + run.port + "/"];
  if (bindHost === "0.0.0.0") {
    for (const entries of Object.values(networkInterfaces())) {
      for (const address of entries) {
        if (address.family === "IPv4" && !address.internal) {
          urls.push("http://" + address.address + ":" + run.port + "/");
        }
      }
    }
  }
  console.log(JSON.stringify({
    type: "ready", session: run.session, port: run.port,
    reportFile: run.reportFile, origins: options.origins, urls, timeoutSeconds: timeout
  }));
  let stopping = false;
  async function stop() {
    if (stopping) return;
    stopping = true;
    clearTimeout(timer);
    await run.close();
    console.log(JSON.stringify({ type: "stopped", reportFile: run.reportFile }));
  }
  const timer = setTimeout(() => stop().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  }), timeout * 1000);
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.once(signal, () => stop().catch(error => {
      console.error(error.message);
      process.exitCode = 1;
    }));
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => {
    console.error("[tune-ink-gap] " + error.message);
    process.exitCode = 1;
  });
}
