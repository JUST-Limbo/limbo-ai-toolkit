import { writeFile } from "node:fs/promises";
import { basename, isAbsolute, join, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function assetUrl(reportDirectory, imagePath) {
  const path = relative(reportDirectory, imagePath);
  if (isAbsolute(path)) {
    return pathToFileURL(imagePath).href;
  }
  return path.split(sep).map(encodeURIComponent).join("/");
}

function bytes(value) {
  return `${(value / 1024).toFixed(1)} KB`;
}

function comparisonCard(reportDirectory, item, index) {
  const originalUrl = escapeHtml(assetUrl(reportDirectory, item.inputPath));
  const optimizedUrl = escapeHtml(assetUrl(reportDirectory, item.outputPath));
  const originalName = escapeHtml(basename(item.inputPath));
  const outputName = escapeHtml(basename(item.outputPath));
  const quality = item.quality === "lossless" ? "无损 PNG" : `${item.quality}/100`;
  const width = Number.isInteger(item.width) && item.width > 0 ? item.width : 1;
  const height = Number.isInteger(item.height) && item.height > 0 ? item.height : 1;
  const change = item.beforeBytes > 0
    ? `${((item.savedBytes / item.beforeBytes) * 100).toFixed(1)}%`
    : "0.0%";
  return `<section class="card">
    <h2>${originalName} → ${outputName}</h2>
    <p class="meta">格式 ${escapeHtml(item.format.toUpperCase())} · 画质 ${escapeHtml(quality)} · ${bytes(item.beforeBytes)} → ${bytes(item.afterBytes)} · 体积变化 ${change}</p>
    <figure>
      <div class="comparison" style="aspect-ratio:${width}/${height};--split:50%">
        <img class="optimized" src="${optimizedUrl}" alt="优化后：${outputName}">
        <img class="original" src="${originalUrl}" alt="原图：${originalName}">
        <span class="divider" aria-hidden="true"><span class="handle">↔</span></span>
        <input type="range" min="0" max="100" value="50" aria-label="拖动比较第 ${index + 1} 组图片的原图和优化图">
      </div>
      <figcaption><span>原图 · ${bytes(item.beforeBytes)}</span><span>优化后 · ${bytes(item.afterBytes)}</span></figcaption>
    </figure>
  </section>`;
}

function renderHtml(reportDirectory, data) {
  const cards = data.results.map((item, index) => comparisonCard(reportDirectory, item, index)).join("\n");
  const failures = data.failures.length > 0
    ? `<section class="card"><h2>处理失败</h2><ul>${data.failures.map((item) => `<li>${escapeHtml(item.inputPath)} (${escapeHtml(item.format)}): ${escapeHtml(item.message)}</li>`).join("")}</ul></section>`
    : "";
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>图片优化画质对比报告</title>
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
  <h1>图片优化画质对比报告</h1>
  <p class="summary">源图片 ${data.summary.inputCount} 张 · 成功 ${data.summary.outputCount} 份 · 失败 ${data.summary.failureCount} 份 · 成功项合计 ${bytes(data.summary.beforeBytes)} → ${bytes(data.summary.afterBytes)}</p>
  <p class="summary">在图片上左右拖动分界线，也可聚焦后使用方向键。图片通过相对路径引用；移动报告时请一同保留源图和输出图。</p>
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

export async function createHtmlReport(reportDirectory, data) {
  const html = renderHtml(reportDirectory, data);
  for (let serial = 1; ; serial += 1) {
    const suffix = serial === 1 ? "" : `-${serial}`;
    const reportPath = join(reportDirectory, `image-comparison${suffix}.html`);
    try {
      await writeFile(reportPath, html, { flag: "wx", encoding: "utf8" });
      return reportPath;
    } catch (error) {
      if (error.code !== "EEXIST") {
        throw error;
      }
    }
  }
}
