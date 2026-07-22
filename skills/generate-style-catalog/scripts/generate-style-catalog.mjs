import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const FILE_EXTS = new Set([".vue", ".css", ".scss", ".less"])
const SKIP_DIRS = new Set(["node_modules", "dist", ".git"])

const CATEGORIES = [
    { id: "typography", label: "字体" },
    { id: "color", label: "颜色 / 背景" },
    { id: "border", label: "边框" },
    { id: "layout", label: "布局" },
    { id: "effect", label: "形式 / 效果" },
    { id: "other", label: "其他" },
]

const CATEGORY_MAP = {
    typography: new Set([
        "font", "font-family", "font-size", "font-weight", "font-style",
        "line-height", "letter-spacing", "text-align", "text-decoration",
        "text-transform", "text-indent", "text-overflow", "white-space",
        "word-break", "word-wrap", "vertical-align",
    ]),
    color: new Set([
        "color", "background", "background-color", "background-image",
        "background-size", "background-position", "background-repeat",
        "opacity", "fill", "stroke",
    ]),
    border: new Set([
        "border", "border-top", "border-right", "border-bottom", "border-left",
        "border-color", "border-width", "border-style", "border-radius",
        "outline", "outline-color", "outline-width", "outline-style",
    ]),
    layout: new Set([
        "display", "position", "top", "right", "bottom", "left",
        "width", "height", "min-width", "max-width", "min-height", "max-height",
        "margin", "margin-top", "margin-right", "margin-bottom", "margin-left",
        "padding", "padding-top", "padding-right", "padding-bottom", "padding-left",
        "flex", "flex-direction", "flex-wrap", "flex-grow", "flex-shrink", "flex-basis",
        "justify-content", "align-items", "align-content", "align-self", "order",
        "gap", "row-gap", "column-gap",
        "grid", "grid-template-columns", "grid-template-rows", "grid-column", "grid-row",
        "overflow", "overflow-x", "overflow-y", "z-index", "box-sizing", "float", "clear",
    ]),
    effect: new Set([
        "box-shadow", "transform", "transform-origin",
        "transition", "transition-property", "transition-duration", "transition-timing-function",
        "animation", "filter", "backdrop-filter", "cursor", "pointer-events", "user-select",
    ]),
}

function parseArgs(argv) {
    const opts = {
        scanDir: path.resolve(process.cwd(), "src"),
        output: path.resolve(process.cwd(), "style-catalog.html"),
        title: "样式目录",
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
            console.log(`Usage: node generate-style-catalog.mjs [options]

Options:
  --scan <dir>         Vue feature module directory to scan (default: ./src)
  --output <file>      Output HTML path (default: ./style-catalog.html)
  --title <text>       Page title (default: 样式目录)
  --path-label <text>  Label shown in page meta (default: src)
`)
            process.exit(0)
        }
    }
    return opts
}

function categorizeProperty(name) {
    const lower = name.toLowerCase().trim()
    for (const cat of CATEGORIES) {
        if (cat.id === "other") {
            continue
        }
        if (CATEGORY_MAP[cat.id].has(lower)) {
            return cat.id
        }
    }
    if (lower.startsWith("font-") || lower.startsWith("text-")) {
        return "typography"
    }
    if (lower.startsWith("background-")) {
        return "color"
    }
    if (lower.startsWith("border-") || lower.startsWith("outline-")) {
        return "border"
    }
    if (lower.startsWith("margin-") || lower.startsWith("padding-") || lower.startsWith("flex-") || lower.startsWith("grid-")) {
        return "layout"
    }
    if (lower.startsWith("transition-") || lower.startsWith("transform-")) {
        return "effect"
    }
    return "other"
}

function stripComments(css) {
    return css
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/[^\n]*/g, "")
}

function skipWs(text, pos) {
    while (pos < text.length && /\s/.test(text[pos])) {
        pos++
    }
    return pos
}

function extractBraced(text, openIdx) {
    let depth = 0
    for (let i = openIdx; i < text.length; i++) {
        if (text[i] === "{") {
            depth++
        } else if (text[i] === "}") {
            depth--
            if (depth === 0) {
                return { content: text.slice(openIdx + 1, i), end: i }
            }
        }
    }
    return { content: "", end: text.length - 1 }
}

function parseDeclarations(content) {
    const props = []
    const parts = content.split(";")
    for (const part of parts) {
        const trimmed = part.trim()
        if (!trimmed) {
            continue
        }
        const colon = trimmed.indexOf(":")
        if (colon === -1) {
            continue
        }
        const name = trimmed.slice(0, colon).trim()
        const value = trimmed.slice(colon + 1).trim()
        if (!name || !value) {
            continue
        }
        props.push({
            name,
            value,
            category: categorizeProperty(name),
            copyText: `${name}: ${value};`,
        })
    }
    return props
}

function normalizeSelector(selector) {
    return selector
        .replace(/\s+/g, " ")
        .replace(/\s*\[data-v-[a-f0-9]+\]/gi, "")
        .trim()
}

function hasScopedMarker(selector) {
    return /\[data-v-[a-f0-9]+\]/i.test(selector)
}

function parseCssRules(css, mediaContext) {
    css = stripComments(css)
    const rules = []
    let pos = 0

    function parseInner(text, media) {
        let innerPos = 0
        while (innerPos < text.length) {
            innerPos = skipWs(text, innerPos)
            if (innerPos >= text.length) {
                break
            }
            if (text[innerPos] === "@") {
                const braceStart = text.indexOf("{", innerPos)
                if (braceStart === -1) {
                    break
                }
                const prelude = text.slice(innerPos, braceStart).trim()
                const { content, end } = extractBraced(text, braceStart)
                if (/^@(media|supports)\b/i.test(prelude)) {
                    rules.push(...parseCssRules(content, prelude))
                }
                innerPos = end + 1
                continue
            }
            const braceStart = text.indexOf("{", innerPos)
            if (braceStart === -1) {
                break
            }
            const rawSelector = text.slice(innerPos, braceStart).trim()
            const { content, end } = extractBraced(text, braceStart)
            if (rawSelector && !rawSelector.startsWith("@")) {
                const properties = parseDeclarations(content)
                if (properties.length > 0) {
                    const scoped = hasScopedMarker(rawSelector)
                    const selector = normalizeSelector(rawSelector)
                    const ruleBlock = `${selector} {\n${properties.map(p => `  ${p.copyText}`).join("\n")}\n}`
                    rules.push({
                        selector,
                        rawSelector,
                        scoped,
                        media: media || null,
                        properties,
                        ruleBlock,
                        categories: [...new Set(properties.map(p => p.category))],
                    })
                }
            }
            innerPos = end + 1
        }
    }

    parseInner(css, mediaContext)
    return rules
}

function extractVueStyleBlocks(content) {
    const blocks = []
    const re = /<style(\s[^>]*)?>([\s\S]*?)<\/style>/gi
    let match
    while ((match = re.exec(content)) !== null) {
        const attrs = match[1] || ""
        blocks.push({
            scoped: /\bscoped\b/i.test(attrs),
            lang: (attrs.match(/\blang=["']?([^"'\s>]+)/i) || [])[1] || "css",
            content: match[2],
        })
    }
    return blocks
}

function componentNameFromFile(filePath) {
    const base = path.basename(filePath, path.extname(filePath))
    return base
}

function walkFiles(dir, files) {
    for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name)
        const st = fs.statSync(full)
        if (st.isDirectory()) {
            if (!SKIP_DIRS.has(name)) {
                walkFiles(full, files)
            }
        } else {
            const ext = path.extname(name).toLowerCase()
            if (FILE_EXTS.has(ext)) {
                files.push(full)
            }
        }
    }
}

function scanFile(file, scanDir) {
    const rel = path.relative(scanDir, file).replace(/\\/g, "/")
    const ext = path.extname(file).toLowerCase()
    const component = componentNameFromFile(file)
    const entries = []

    if (ext === ".vue") {
        const content = fs.readFileSync(file, "utf8")
        const blocks = extractVueStyleBlocks(content)
        blocks.forEach((block, index) => {
            const rules = parseCssRules(block.content)
            if (rules.length > 0) {
                entries.push({
                    blockIndex: index + 1,
                    scoped: block.scoped,
                    lang: block.lang,
                    rules,
                })
            }
        })
    } else {
        const content = fs.readFileSync(file, "utf8")
        const rules = parseCssRules(content)
        if (rules.length > 0) {
            entries.push({
                blockIndex: 1,
                scoped: false,
                lang: ext.slice(1),
                rules,
            })
        }
    }

    if (entries.length === 0) {
        return null
    }

    const allRules = entries.flatMap(e => e.rules)
    return {
        file: rel,
        component,
        blocks: entries,
        ruleCount: allRules.length,
        propertyCount: allRules.reduce((sum, r) => sum + r.properties.length, 0),
        categories: [...new Set(allRules.flatMap(r => r.categories))],
    }
}

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
}

function buildPreviewStyle(properties) {
    const allowed = new Set([
        ...CATEGORY_MAP.color,
        ...CATEGORY_MAP.border,
        ...CATEGORY_MAP.typography,
        ...CATEGORY_MAP.layout,
        ...CATEGORY_MAP.effect,
        "display", "width", "height", "padding", "margin", "border-radius",
        "box-shadow", "background-color", "color", "font-size",
    ])
    return properties
        .filter(p => allowed.has(p.name.toLowerCase()) || p.name.toLowerCase().startsWith("background"))
        .map(p => `${p.name}: ${p.value}`)
        .join("; ")
}

const { scanDir, output, title, pathLabel } = parseArgs(process.argv)

if (!fs.existsSync(scanDir)) {
    console.error("Scan directory not found:", scanDir)
    process.exit(1)
}

const fileList = []
walkFiles(scanDir, fileList)

const components = fileList
    .map(f => scanFile(f, scanDir))
    .filter(Boolean)
    .sort((a, b) => a.file.localeCompare(b.file))

const totalRules = components.reduce((sum, c) => sum + c.ruleCount, 0)
const totalProps = components.reduce((sum, c) => sum + c.propertyCount, 0)

const usedCategories = CATEGORIES.filter(cat =>
    components.some(c => c.categories.includes(cat.id))
)

const generatedAt = new Date().toISOString().slice(0, 19).replace("T", " ")
const dataJson = JSON.stringify(components)
const categoryTabsJson = JSON.stringify(usedCategories)
const escapedTitle = escapeHtml(title)

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
    display: flex;
    min-height: 100vh;
  }
  .layout { flex: 1; min-width: 0; display: flex; flex-direction: column; }
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
  input[type="search"] {
    height: 36px; border: 1px solid #ddd; border-radius: 8px; padding: 0 12px; font-size: 14px;
    min-width: 260px; flex: 1;
  }
  .tabs button, .file-filter button {
    border: 1px solid #ddd; background: #fff; border-radius: 999px;
    padding: 6px 12px; font-size: 13px; cursor: pointer;
  }
  .tabs button.active, .file-filter button.active {
    background: #727fff; border-color: #727fff; color: #fff;
  }
  main { padding: 20px 24px 40px; }
  .file-section { margin-bottom: 28px; }
  .file-title {
    font-size: 16px; font-weight: 600; margin: 0 0 4px;
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  }
  .file-path { font-size: 12px; color: #888; margin-bottom: 12px; font-family: Consolas, monospace; }
  .badge {
    display: inline-block; font-size: 11px; padding: 2px 8px; border-radius: 999px;
    background: #eef0ff; color: #4a52cc; font-weight: 500;
  }
  .badge.scoped { background: #e8f5e9; color: #2e7d32; }
  .badge.media { background: #fff3e0; color: #e65100; }
  .rules { display: flex; flex-direction: column; gap: 12px; }
  .rule-card {
    background: #fff; border: 1px solid #ececec; border-radius: 12px; overflow: hidden;
  }
  .rule-head {
    padding: 12px 14px; border-bottom: 1px solid #f0f0f0;
    display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap;
  }
  .selector {
    font-family: Consolas, monospace; font-size: 13px; font-weight: 600; word-break: break-all;
  }
  .rule-actions { display: flex; gap: 8px; flex-shrink: 0; }
  .rule-body { display: grid; grid-template-columns: 1fr 200px; gap: 0; }
  @media (max-width: 720px) { .rule-body { grid-template-columns: 1fr; } }
  .props { padding: 10px 14px 14px; }
  .prop-group-title { font-size: 11px; color: #888; margin: 10px 0 6px; text-transform: uppercase; letter-spacing: .04em; }
  .prop-group-title:first-child { margin-top: 0; }
  .prop-list { display: flex; flex-wrap: wrap; gap: 6px; }
  .prop {
    font-family: Consolas, monospace; font-size: 12px;
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 4px 4px 10px; border-radius: 8px; border: 1px solid #e8e8e8;
    background: #fafafa; word-break: break-all;
  }
  .prop-label { flex: 1; }
  .prop-actions { display: inline-flex; gap: 2px; flex-shrink: 0; }
  .prop-actions button, .rule-actions button {
    border: 1px solid #ddd; background: #fff; border-radius: 6px;
    padding: 2px 8px; font-size: 11px; cursor: pointer; line-height: 1.6;
  }
  .prop-actions button:hover, .rule-actions button:hover { background: #f0f0f0; }
  .prop-actions button[data-action="overwrite"]:hover,
  .rule-actions button[data-action="overwrite"]:hover { background: #eef0ff; border-color: #c5caff; }
  .prop-actions button[data-action="append"]:hover,
  .rule-actions button[data-action="append"]:hover { background: #e8faff; border-color: #727fff; }
  .prop.picked, .rule-actions button[data-action="append"].picked {
    background: #e8faff; border-color: #727fff; box-shadow: inset 0 0 0 1px #727fff;
  }
  .pick-panel {
    width: 320px; flex-shrink: 0; background: #fff; border-left: 1px solid #e0e0e0;
    display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh;
  }
  .pick-panel-head { padding: 16px; border-bottom: 1px solid #f0f0f0; }
  .pick-panel-head h2 { margin: 0 0 6px; font-size: 15px; font-weight: 600; }
  .pick-panel-hint { font-size: 12px; color: #888; line-height: 1.5; margin-bottom: 12px; }
  .pick-panel-actions { display: flex; gap: 8px; }
  .pick-panel-actions button {
    flex: 1; height: 34px; border: 1px solid #ddd; border-radius: 8px;
    background: #fafafa; font-size: 13px; cursor: pointer;
  }
  .pick-panel-actions button.primary { background: #727fff; border-color: #727fff; color: #fff; }
  .pick-panel-actions button:disabled { opacity: 0.45; cursor: not-allowed; }
  .pick-panel-list { flex: 1; overflow-y: auto; padding: 12px 16px 20px; }
  .pick-empty { font-size: 12px; color: #aaa; line-height: 1.6; padding: 20px 0; text-align: center; }
  .pick-item {
    margin-bottom: 8px; border: 1px solid #ececf2; border-radius: 10px; background: #f8f9fc; overflow: hidden;
  }
  .pick-item-head {
    display: flex; justify-content: space-between; align-items: center; gap: 8px;
    padding: 6px 10px; background: #f0f1f6; border-bottom: 1px solid #ececf2;
    font-size: 11px; color: #666;
  }
  .pick-item-remove {
    border: none; background: transparent; color: #999; font-size: 12px; cursor: pointer; padding: 2px 4px;
  }
  .pick-item-remove:hover { color: #e65100; }
  .pick-item-text {
    margin: 0; padding: 10px; font-family: Consolas, monospace; font-size: 11px;
    line-height: 1.5; white-space: pre-wrap; word-break: break-all;
  }
  @media (max-width: 960px) {
    body { flex-direction: column; }
    .pick-panel {
      width: 100%; height: auto; max-height: 42vh; position: static;
      border-left: none; border-top: 1px solid #e0e0e0;
    }
  }
  .preview {
    padding: 14px; border-left: 1px solid #f0f0f0; background: #fafafa;
    display: flex; align-items: center; justify-content: center; min-height: 80px;
  }
  .preview-box {
    padding: 12px 16px; border: 1px dashed #ccc; border-radius: 8px;
    background: #fff; max-width: 100%; text-align: center; font-size: 13px;
  }
  .empty { color: #888; padding: 40px 0; text-align: center; }
  .toast {
    position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%) translateY(20px);
    background: #111; color: #fff; padding: 10px 16px; border-radius: 999px; font-size: 13px;
    opacity: 0; pointer-events: none; transition: .2s ease; max-width: 90vw; word-break: break-all;
  }
  .toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
</style>
</head>
<body>
<div class="layout">
<header>
  <h1>${escapedTitle}</h1>
  <div class="meta">扫描目录 ${escapeHtml(pathLabel)} · ${components.length} 个文件 · ${totalRules} 条规则 · ${totalProps} 个属性 · 生成于 ${generatedAt}</div>
  <div class="toolbar">
    <input id="search" type="search" placeholder="搜索选择器、属性名、属性值、文件路径…" />
    <div class="tabs" id="tabs">
      <button class="active" data-category="all">全部</button>
    </div>
  </div>
</header>
<main>
  <div id="content"></div>
  <div class="empty" id="empty" hidden>没有匹配的样式规则</div>
</main>
</div>
<aside class="pick-panel" id="pickPanel">
  <div class="pick-panel-head">
    <h2>已选样式 <span id="pickCount">0</span></h2>
    <div class="pick-panel-hint">覆盖：直接复制；追加：选中到面板，汇总后一并复制</div>
    <div class="pick-panel-actions">
      <button type="button" id="pickClear">清空</button>
      <button type="button" class="primary" id="pickCopyAll" disabled>一并复制</button>
    </div>
  </div>
  <div class="pick-panel-list" id="pickList">
    <div class="pick-empty">点击「追加」选中的样式会显示在这里</div>
  </div>
</aside>
<div class="toast" id="toast">已复制</div>
<script>
const COMPONENTS = ${dataJson};
const CATEGORY_TABS = ${categoryTabsJson};
const CATEGORY_LABELS = {
  typography: "字体",
  color: "颜色 / 背景",
  border: "边框",
  layout: "布局",
  effect: "形式 / 效果",
  other: "其他"
};
let activeCategory = "all";
let query = "";
let selectedItems = [];

function isPicked(text) {
  return selectedItems.some(function (item) { return item.text === text; });
}

function escapeAttr(text) {
  return text.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function initTabs() {
  const tabs = document.getElementById("tabs");
  CATEGORY_TABS.forEach(function (tab) {
    const btn = document.createElement("button");
    btn.dataset.category = tab.id;
    btn.textContent = tab.label;
    tabs.appendChild(btn);
  });
}

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(function () { t.classList.remove("show"); }, 1600);
}

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () {
      showToast("已复制");
    }).catch(fallbackCopy);
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
    showToast("已复制");
  }
}

function overwritePick(text) {
  copyText(text);
}

function toggleAppend(text, label, type) {
  const index = selectedItems.findIndex(function (item) { return item.text === text; });
  if (index >= 0) {
    selectedItems.splice(index, 1);
    showToast("已取消选中");
  } else {
    selectedItems.push({ text: text, label: label, type: type });
    showToast("已追加到面板");
  }
  renderPanel();
  render();
}

function renderPanel() {
  const list = document.getElementById("pickList");
  const count = document.getElementById("pickCount");
  const copyAll = document.getElementById("pickCopyAll");
  count.textContent = String(selectedItems.length);
  copyAll.disabled = selectedItems.length === 0;
  if (!selectedItems.length) {
    list.innerHTML = '<div class="pick-empty">点击「追加」选中的样式会显示在这里</div>';
    return;
  }
  list.innerHTML = "";
  selectedItems.forEach(function (item, index) {
    const el = document.createElement("div");
    el.className = "pick-item";
    const typeLabel = item.type === "rule" ? "规则块" : "属性";
    el.innerHTML =
      '<div class="pick-item-head">' +
        '<span>' + typeLabel + " #" + (index + 1) + "</span>" +
        '<button type="button" class="pick-item-remove" data-index="' + index + '">移除</button>' +
      "</div>" +
      '<pre class="pick-item-text"></pre>';
    el.querySelector(".pick-item-text").textContent = item.text;
    el.querySelector(".pick-item-remove").onclick = function () {
      selectedItems.splice(index, 1);
      renderPanel();
      render();
    };
    list.appendChild(el);
  });
}

function bindPickButtons(root, text, label, type) {
  const overwriteBtn = root.querySelector('[data-action="overwrite"]');
  const appendBtn = root.querySelector('[data-action="append"]');
  if (overwriteBtn) {
    overwriteBtn.onclick = function (e) {
      e.stopPropagation();
      overwritePick(text);
    };
  }
  if (appendBtn) {
    if (isPicked(text)) {
      appendBtn.classList.add("picked");
    }
    appendBtn.onclick = function (e) {
      e.stopPropagation();
      toggleAppend(text, label, type);
    };
  }
}

function ruleMatches(rule, file, component, q, category) {
  if (category !== "all" && !rule.categories.includes(category)) {
    return false;
  }
  if (!q) {
    return true;
  }
  const hay = [
    file, component, rule.selector, rule.media || "",
    rule.properties.map(function (p) { return p.name + " " + p.value; }).join(" ")
  ].join(" ").toLowerCase();
  return hay.includes(q);
}

function buildPreviewStyle(properties) {
  const skip = new Set(["position", "top", "right", "bottom", "left", "z-index", "float", "clear"]);
  return properties
    .filter(function (p) { return !skip.has(p.name.toLowerCase()); })
    .slice(0, 12)
    .map(function (p) { return p.name + ": " + p.value; })
    .join("; ");
}

function renderProps(properties) {
  const groups = new Map();
  properties.forEach(function (p) {
    if (!groups.has(p.category)) {
      groups.set(p.category, []);
    }
    groups.get(p.category).push(p);
  });
  let html = "";
  groups.forEach(function (props, cat) {
    html += '<div class="prop-group-title">' + (CATEGORY_LABELS[cat] || cat) + "</div>";
    html += '<div class="prop-list">';
    props.forEach(function (p) {
      const picked = isPicked(p.copyText) ? " picked" : "";
      html += '<span class="prop' + picked + '" data-copy="' + escapeAttr(p.copyText) + '">' +
        '<span class="prop-label">' + p.name + ": " + p.value + "</span>" +
        '<span class="prop-actions">' +
        '<button type="button" data-action="overwrite">覆盖</button>' +
        '<button type="button" data-action="append"' + (isPicked(p.copyText) ? ' class="picked"' : "") + '>追加</button>' +
        "</span></span>";
    });
    html += "</div>";
  });
  return html;
}

function render() {
  const q = query.toLowerCase();
  const content = document.getElementById("content");
  const empty = document.getElementById("empty");
  content.innerHTML = "";
  let hasAny = false;

  COMPONENTS.forEach(function (comp) {
    const blocks = [];
    comp.blocks.forEach(function (block) {
      const rules = block.rules.filter(function (rule) {
        return ruleMatches(rule, comp.file, comp.component, q, activeCategory);
      });
      if (rules.length) {
        blocks.push({ block: block, rules: rules });
      }
    });
    if (!blocks.length) {
      return;
    }
    hasAny = true;

    const section = document.createElement("div");
    section.className = "file-section";
    section.innerHTML =
      '<div class="file-title">' + comp.component +
      ' <span class="badge">' + comp.ruleCount + " 条规则</span></div>" +
      '<div class="file-path">' + comp.file + "</div>";

    blocks.forEach(function (item) {
      const block = item.block;
      const rulesWrap = document.createElement("div");
      rulesWrap.className = "rules";

      if (comp.blocks.length > 1) {
        const blockLabel = document.createElement("div");
        blockLabel.style.cssText = "font-size:12px;color:#888;margin-bottom:8px";
        blockLabel.textContent = "style block #" + block.blockIndex +
          (block.scoped ? " · scoped" : "") +
          (block.lang !== "css" ? " · " + block.lang : "");
        rulesWrap.appendChild(blockLabel);
      }

      item.rules.forEach(function (rule) {
        const card = document.createElement("div");
        card.className = "rule-card";
        const badges = (rule.scoped ? '<span class="badge scoped">scoped</span> ' : "") +
          (rule.media ? '<span class="badge media">' + rule.media + "</span> " : "");
        const previewStyle = buildPreviewStyle(rule.properties);
        card.innerHTML =
          '<div class="rule-head">' +
            '<div><div class="selector">' + rule.selector + "</div>" +
            '<div style="margin-top:6px">' + badges + "</div></div>" +
            '<div class="rule-actions">' +
              '<button type="button" data-action="overwrite">覆盖</button>' +
              '<button type="button" data-action="append"' + (isPicked(rule.ruleBlock) ? ' class="picked"' : "") + '>追加</button>' +
            "</div>" +
          "</div>" +
          '<div class="rule-body">' +
            '<div class="props">' + renderProps(rule.properties) + "</div>" +
            '<div class="preview"><div class="preview-box" style="' + previewStyle.replace(/"/g, "&quot;") + '">预览</div></div>' +
          "</div>";
        bindPickButtons(card.querySelector(".rule-actions"), rule.ruleBlock, rule.selector + " {…}", "rule");
        card.querySelectorAll(".prop").forEach(function (el) {
          bindPickButtons(el, el.getAttribute("data-copy"), el.getAttribute("data-copy"), "prop");
        });
        rulesWrap.appendChild(card);
      });

      section.appendChild(rulesWrap);
    });

    content.appendChild(section);
  });

  empty.hidden = hasAny;
}

document.getElementById("search").addEventListener("input", function (e) {
  query = e.target.value.trim();
  render();
});
document.getElementById("tabs").addEventListener("click", function (e) {
  const btn = e.target.closest("button[data-category]");
  if (!btn) return;
  activeCategory = btn.dataset.category;
  document.querySelectorAll("#tabs button").forEach(function (b) {
    b.classList.toggle("active", b === btn);
  });
  render();
});

document.getElementById("pickClear").addEventListener("click", function () {
  if (!selectedItems.length) {
    return;
  }
  selectedItems = [];
  renderPanel();
  render();
  showToast("已清空");
});
document.getElementById("pickCopyAll").addEventListener("click", function () {
  if (!selectedItems.length) {
    return;
  }
  copyText(selectedItems.map(function (item) { return item.text; }).join("\\n\\n"));
});

initTabs();
renderPanel();
render();
</script>
</body>
</html>`

fs.mkdirSync(path.dirname(output), { recursive: true })
fs.writeFileSync(output, html, "utf8")
console.log("Written:", output)
console.log("Files:", components.length)
console.log("Rules:", totalRules)
console.log("Properties:", totalProps)
