import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function parseArgs(argv) {
    const opts = {
        scanDir: path.resolve(process.cwd(), "src"),
        output: path.resolve(process.cwd(), "color-palette.html"),
        title: "项目色板",
        pathLabel: "src",
    }
    for (let i = 2; i < argv.length; i++) {
        const arg = argv[i]
        if (arg === "--scan" && argv[i + 1]) {
            opts.scanDir = path.resolve(argv[++i])
        } else if (arg === "--output" && argv[i + 1]) {
            opts.output = path.resolve(argv[++i])
        } else if (arg === "--title" && argv[i + 1]) {
            opts.title = argv[++i]
        } else if (arg === "--path-label" && argv[i + 1]) {
            opts.pathLabel = argv[++i]
        } else if (arg === "--help" || arg === "-h") {
            console.log(`Usage: node generate-color-palette.mjs [options]

Options:
  --scan <dir>         Directory to scan (default: ./src)
  --output <file>      Output HTML path (default: ./color-palette.html)
  --title <text>       Page title (default: 项目色板)
  --path-label <text>  Label shown in page meta (default: src)
`)
            process.exit(0)
        }
    }
    return opts
}

const { scanDir, output, title, pathLabel } = parseArgs(process.argv)

if (!fs.existsSync(scanDir)) {
    console.error("Scan directory not found:", scanDir)
    process.exit(1)
}

const exts = new Set([".vue", ".ts", ".tsx", ".css", ".js", ".jsx", ".scss", ".less"])
const colorMap = new Map()

function addColor(raw, file) {
    const value = raw.trim()
    const key = value.toLowerCase().replace(/\s+/g, " ")
    if (!colorMap.has(key)) {
        colorMap.set(key, { value, files: new Set(), count: 0 })
    }
    const entry = colorMap.get(key)
    entry.count++
    entry.files.add(path.relative(scanDir, file).replace(/\\/g, "/"))
}

function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name)
        const st = fs.statSync(full)
        if (st.isDirectory()) {
            if (name !== "node_modules" && name !== "dist" && name !== ".git") {
                walk(full)
            }
        } else {
            const ext = path.extname(name).toLowerCase()
            if (!exts.has(ext)) {
                continue
            }
            const text = fs.readFileSync(full, "utf8")
            text.split(/\r?\n/).forEach((line) => {
                const hexes = line.match(/#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})\b/gi)
                if (hexes) {
                    hexes.forEach(h => addColor(h, full))
                }
                const rgbs = line.match(/rgba?\([^)]+\)/g)
                if (rgbs) {
                    rgbs.forEach(r => addColor(r, full))
                }
                const oklchs = line.match(/oklch\([^)]+\)/g)
                if (oklchs) {
                    oklchs.forEach(o => addColor(o, full))
                }
            })
        }
    }
}

function kind(v) {
    if (v.startsWith("#")) {
        return "hex"
    }
    if (v.startsWith("rgb")) {
        return "rgb"
    }
    if (v.startsWith("oklch")) {
        return "oklch"
    }
    return "other"
}

function normalizeHex(hex) {
    let h = hex.replace("#", "").toLowerCase()
    if (h.length === 3 || h.length === 4) {
        h = h.split("").map(c => c + c).join("")
    }
    if (h.length === 6) {
        return `#${h}`
    }
    if (h.length === 8) {
        return `#${h.slice(0, 6)}`
    }
    return hex
}

function swatchCss(v) {
    if (v.startsWith("#")) {
        return normalizeHex(v)
    }
    return v
}

function parseHexRgb(hex) {
    let h = hex.replace("#", "").toLowerCase()
    if (h.length === 3 || h.length === 4) {
        h = h.split("").map(c => c + c).join("")
    }
    if (h.length === 8) {
        h = h.slice(0, 6)
    }
    if (h.length !== 6) {
        return null
    }
    return {
        r: Number.parseInt(h.slice(0, 2), 16),
        g: Number.parseInt(h.slice(2, 4), 16),
        b: Number.parseInt(h.slice(4, 6), 16),
    }
}

function parseRgbString(value) {
    const inner = value.replace(/^rgba?\(|\)$/gi, "").trim()
    const slash = inner.split("/")
    const nums = slash[0].trim().split(/[\s,]+/).map(Number).filter(n => !Number.isNaN(n))
    if (nums.length < 3) {
        return null
    }
    return { r: nums[0], g: nums[1], b: nums[2] }
}

function rgbToHsl(r, g, b) {
    const rn = r / 255
    const gn = g / 255
    const bn = b / 255
    const max = Math.max(rn, gn, bn)
    const min = Math.min(rn, gn, bn)
    const l = (max + min) / 2
    let h = 0
    let s = 0
    if (max !== min) {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        if (max === rn) {
            h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6
        } else if (max === gn) {
            h = ((bn - rn) / d + 2) / 6
        } else {
            h = ((rn - gn) / d + 4) / 6
        }
    }
    return { h: h * 360, s: s * 100, l: l * 100 }
}

const SPECTRUM_GROUPS = [
    { id: "red", label: "红色系", min: 345, max: 15 },
    { id: "orange", label: "橙色系", min: 15, max: 45 },
    { id: "yellow", label: "黄色系", min: 45, max: 70 },
    { id: "green", label: "绿色系", min: 70, max: 165 },
    { id: "cyan", label: "青色系", min: 165, max: 195 },
    { id: "blue", label: "蓝色系", min: 195, max: 250 },
    { id: "purple", label: "紫色系", min: 250, max: 290 },
    { id: "magenta", label: "品红 / 粉色系", min: 290, max: 345 },
    { id: "neutral", label: "中性色（灰 / 白 / 黑）", min: -1, max: -1 },
    { id: "oklch", label: "OKLCH 设计令牌", min: -1, max: -1 },
    { id: "other", label: "其他格式", min: -1, max: -1 },
]

function getSpectrum(h, s, l) {
    if (s < 12 || (l > 97 && s < 20) || (l < 8 && s < 20)) {
        return "neutral"
    }
    const hue = h < 0 ? h + 360 : h >= 360 ? h - 360 : h
    for (const group of SPECTRUM_GROUPS) {
        if (group.id === "red") {
            if (hue >= group.min || hue < group.max) {
                return group.id
            }
        } else if (group.min >= 0 && hue >= group.min && hue < group.max) {
            return group.id
        }
    }
    return "other"
}

function analyzeColor(value) {
    if (value.startsWith("oklch")) {
        return { spectrum: "oklch", sortHue: 999, sortSat: 0, sortLight: 50 }
    }
    let rgb = null
    if (value.startsWith("#")) {
        rgb = parseHexRgb(value)
    } else if (value.startsWith("rgb")) {
        rgb = parseRgbString(value)
    }
    if (!rgb) {
        return { spectrum: "other", sortHue: 999, sortSat: 0, sortLight: 50 }
    }
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
    const spectrum = getSpectrum(hsl.h, hsl.s, hsl.l)
    return {
        spectrum,
        sortHue: spectrum === "neutral" ? 360 : hsl.h,
        sortSat: hsl.s,
        sortLight: hsl.l,
    }
}

function compareColors(a, b) {
    const ga = SPECTRUM_GROUPS.findIndex(g => g.id === a.spectrum)
    const gb = SPECTRUM_GROUPS.findIndex(g => g.id === b.spectrum)
    if (ga !== gb) {
        return ga - gb
    }
    if (a.spectrum === "neutral") {
        if (a.sortLight !== b.sortLight) {
            return a.sortLight - b.sortLight
        }
        return a.sortSat - b.sortSat
    }
    if (a.sortHue !== b.sortHue) {
        return a.sortHue - b.sortHue
    }
    if (a.sortLight !== b.sortLight) {
        return a.sortLight - b.sortLight
    }
    if (a.sortSat !== b.sortSat) {
        return a.sortSat - b.sortSat
    }
    return a.value.localeCompare(b.value)
}

walk(scanDir)

const colors = [...colorMap.values()]
    .map((c) => {
        const meta = analyzeColor(c.value)
        const group = SPECTRUM_GROUPS.find(g => g.id === meta.spectrum)
        return {
            value: c.value,
            kind: kind(c.value),
            count: c.count,
            files: [...c.files].sort(),
            swatch: swatchCss(c.value),
            label: c.value.toUpperCase(),
            spectrum: meta.spectrum,
            spectrumLabel: group ? group.label : "其他格式",
            sortHue: meta.sortHue,
            sortSat: meta.sortSat,
            sortLight: meta.sortLight,
        }
    })
    .sort(compareColors)

const spectrumTabs = SPECTRUM_GROUPS.filter(g => colors.some(c => c.spectrum === g.id))

const generatedAt = new Date().toISOString().slice(0, 19).replace("T", " ")
const dataJson = JSON.stringify(colors)
const spectrumTabsJson = JSON.stringify(spectrumTabs)
const escapedTitle = title.replace(/</g, "&lt;").replace(/>/g, "&gt;")

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapedTitle}</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
    background: #f5f5f7;
    color: #111;
  }
  header {
    position: sticky; top: 0; z-index: 10;
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid #e0e0e0;
    padding: 16px 24px;
  }
  h1 { margin: 0 0 8px; font-size: 20px; font-weight: 600; }
  .meta { font-size: 12px; color: #666; margin-bottom: 12px; }
  .toolbar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
  input[type="search"], input[type="color"] {
    height: 36px; border: 1px solid #ddd; border-radius: 8px; padding: 0 12px; font-size: 14px;
  }
  input[type="search"] { min-width: 260px; flex: 1; }
  .tabs button {
    border: 1px solid #ddd; background: #fff; border-radius: 999px;
    padding: 6px 12px; font-size: 13px; cursor: pointer;
  }
  .tabs button.active { background: #727fff; border-color: #727fff; color: #fff; }
  .picked {
    display: flex; align-items: center; gap: 10px; margin-top: 12px;
    padding: 10px 12px; background: #fafafa; border: 1px solid #e0e0e0; border-radius: 10px; font-size: 13px;
  }
  .picked-swatch { width: 40px; height: 40px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.08); }
  main { padding: 20px 24px 40px; }
  .section-title { font-size: 14px; color: #666; margin: 18px 0 10px; }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 12px;
  }
  .card {
    background: #fff; border: 1px solid #ececec; border-radius: 12px; overflow: hidden;
    cursor: pointer; transition: transform .12s ease, box-shadow .12s ease;
  }
  .card:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(0,0,0,.06); }
  .card.selected { outline: 2px solid #727fff; outline-offset: 2px; }
  .swatch { height: 72px; display: flex; align-items: flex-end; padding: 8px 10px; font-size: 11px; font-weight: 600; letter-spacing: .02em; }
  .info { padding: 10px 12px 12px; }
  .value { font-family: Consolas, monospace; font-size: 13px; word-break: break-all; }
  .sub { margin-top: 6px; font-size: 11px; color: #888; line-height: 1.4; }
  .toast {
    position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%) translateY(20px);
    background: #111; color: #fff; padding: 10px 16px; border-radius: 999px; font-size: 13px;
    opacity: 0; pointer-events: none; transition: .2s ease;
  }
  .toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
  .empty { color: #888; padding: 40px 0; text-align: center; }
</style>
</head>
<body>
<header>
  <h1>${escapedTitle}</h1>
  <div class="meta">扫描目录 ${pathLabel} · 共 ${colors.length} 个颜色值 · 按色谱分组排序 · 生成于 ${generatedAt}</div>
  <div class="toolbar">
    <input id="search" type="search" placeholder="搜索色值或文件路径…" />
    <div class="tabs" id="tabs">
      <button class="active" data-spectrum="all">全部</button>
    </div>
    <input id="picker" type="color" value="#727fff" title="取色器" />
  </div>
  <div class="picked" id="picked">
    <div class="picked-swatch" id="pickedSwatch" style="background:#727fff"></div>
    <div>
      <div>当前选中：<strong id="pickedValue">#727FFF</strong></div>
      <div style="color:#888;margin-top:2px">点击色块复制 · 也可使用上方取色器</div>
    </div>
  </div>
</header>
<main>
  <div id="sections"></div>
  <div class="empty" id="empty" hidden>没有匹配的颜色</div>
</main>
<div class="toast" id="toast">已复制</div>
<script>
const COLORS = ${dataJson};
const SPECTRUM_TABS = ${spectrumTabsJson};
let activeSpectrum = "all";
let query = "";
let selected = "#727fff";

function initTabs() {
  const tabs = document.getElementById("tabs");
  SPECTRUM_TABS.forEach(function (tab) {
    const btn = document.createElement("button");
    btn.dataset.spectrum = tab.id;
    btn.textContent = tab.label.replace("（灰 / 白 / 黑）", "").replace(" / 粉色系", "");
    tabs.appendChild(btn);
  });
}

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(function () { t.classList.remove("show"); }, 1400);
}

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () { showToast("已复制 " + text); }).catch(fallbackCopy);
  } else {
    fallbackCopy();
  }
  function fallbackCopy() {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    showToast("已复制 " + text);
  }
}

function setPicked(value, swatch) {
  selected = value;
  document.getElementById("pickedValue").textContent = value;
  document.getElementById("pickedSwatch").style.background = swatch;
  const picker = document.getElementById("picker");
  if (value.startsWith("#") && (value.length === 4 || value.length === 7)) {
    picker.value = value.length === 4
      ? "#" + value.slice(1).split("").map(function (c) { return c + c; }).join("")
      : value.slice(0, 7);
  }
}

function textColorForSwatch(v) {
  if (!v.startsWith("#") || v.length < 7) return "#111";
  const r = parseInt(v.slice(1, 3), 16);
  const g = parseInt(v.slice(3, 5), 16);
  const b = parseInt(v.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62 ? "#111" : "#fff";
}

function filtered() {
  return COLORS.filter(function (c) {
    if (activeSpectrum !== "all" && c.spectrum !== activeSpectrum) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return c.value.toLowerCase().includes(q)
      || c.spectrumLabel.toLowerCase().includes(q)
      || c.files.some(function (f) { return f.toLowerCase().includes(q); });
  });
}

function groupFiltered(list) {
  const map = new Map()
  list.forEach(function (c) {
    if (!map.has(c.spectrum)) {
      map.set(c.spectrum, [])
    }
    map.get(c.spectrum).push(c)
  })
  const order = []
  list.forEach(function (c) {
    if (!order.includes(c.spectrum)) {
      order.push(c.spectrum)
    }
  })
  return order.map(function (id) {
    const first = map.get(id)[0]
    return [first.spectrumLabel, map.get(id)]
  })
}

function render() {
  const list = filtered();
  const sections = document.getElementById("sections");
  const empty = document.getElementById("empty");
  sections.innerHTML = "";
  if (!list.length) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  const groups = groupFiltered(list);

  groups.forEach(function (pair) {
    const title = pair[0];
    const arr = pair[1];
    const h = document.createElement("div");
    h.className = "section-title";
    h.textContent = title + " (" + arr.length + ")";
    sections.appendChild(h);
    const grid = document.createElement("div");
    grid.className = "grid";
    arr.forEach(function (c) {
      const card = document.createElement("div");
      card.className = "card" + (c.value === selected ? " selected" : "");
      const sw = c.swatch.startsWith("#") && c.swatch.length >= 7 ? c.swatch : "#ffffff";
      const tc = textColorForSwatch(sw);
      card.innerHTML =
        '<div class="swatch" style="background:' + c.swatch + ";color:" + tc + '">' + c.label + "</div>" +
        '<div class="info"><div class="value">' + c.value + "</div>" +
        '<div class="sub">引用 ' + c.count + " 次<br>" + c.files.slice(0, 2).join("<br>") + (c.files.length > 2 ? "…" : "") + "</div></div>";
      card.onclick = function () {
        setPicked(c.value, c.swatch);
        document.querySelectorAll(".card.selected").forEach(function (el) { el.classList.remove("selected"); });
        card.classList.add("selected");
        copyText(c.value);
      };
      grid.appendChild(card);
    });
    sections.appendChild(grid);
  });
}

document.getElementById("search").addEventListener("input", function (e) {
  query = e.target.value.trim();
  render();
});
document.getElementById("tabs").addEventListener("click", function (e) {
  const btn = e.target.closest("button[data-spectrum]");
  if (!btn) return;
  activeSpectrum = btn.dataset.spectrum;
  document.querySelectorAll("#tabs button").forEach(function (b) {
    b.classList.toggle("active", b === btn);
  });
  render();
});
document.getElementById("picker").addEventListener("input", function (e) {
  const v = e.target.value.toUpperCase();
  setPicked(v, v);
  document.querySelectorAll(".card.selected").forEach(function (el) { el.classList.remove("selected"); });
});

initTabs();
render();
</script>
</body>
</html>`

fs.mkdirSync(path.dirname(output), { recursive: true })
fs.writeFileSync(output, html, "utf8")
console.log("Written:", output)
console.log("Colors:", colors.length)
