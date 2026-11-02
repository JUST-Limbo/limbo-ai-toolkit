// tune-ink-gap 1.2.0：真实页面测量与回传。
(function () {
  "use strict";
  const script = document.currentScript;

  async function waitForPair(pair, timeoutMs) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const text = document.querySelector(pair.text);
      const next = document.querySelector(pair.next);
      if (text && next) return { text, next };
      await new Promise(done => setTimeout(done, 100));
    }
    throw new Error("等待目标元素超时：" + pair.text + " / " + pair.next);
  }

  async function waitForImage(element, timeoutMs) {
    const image = element.tagName === "IMG" ? element : element.querySelector("img");
    if (!image) return;
    if (image.complete) {
      if (!image.naturalWidth) throw new Error("相邻图片加载失败");
      return;
    }
    await new Promise((done, reject) => {
      function finish(error) {
        clearTimeout(timer);
        image.removeEventListener("load", onLoad);
        image.removeEventListener("error", onError);
        if (error) reject(error);
        else done();
      }
      function onLoad() { finish(); }
      function onError() { finish(new Error("相邻图片加载失败")); }
      const timer = setTimeout(() => finish(new Error("等待相邻图片超时")), timeoutMs);
      image.addEventListener("load", onLoad, { once: true });
      image.addEventListener("error", onError, { once: true });
    });
  }

  function box(element) {
    const rect = element.getBoundingClientRect();
    return { top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height };
  }

  function checkGeometry(element) {
    const trace = [];
    for (let ancestor = element; ancestor; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor);
      const transform = String(style.getPropertyValue("transform") ||
        style.getPropertyValue("-webkit-transform") || style.transform || "none").trim();
      const zoom = String(style.getPropertyValue("zoom") || style.zoom || "normal").trim().toLowerCase();
      const zoomFactor = zoom === "normal" || zoom === "reset" ? 1 :
        (zoom.endsWith("%") ? Number(zoom.slice(0, -1)) / 100 : Number(zoom));
      // CSSOM 的 1、1.0、100% 表示相同倍率；恒等 matrix 也没有改变几何。
      let unchanged = transform === "none";
      const match = transform.match(/^matrix(3d)?\(([^)]+)\)$/);
      if (match) {
        const values = match[2].split(",").map(Number);
        const identity = match[1] ? [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] : [1, 0, 0, 1, 0, 0];
        unchanged = values.length === identity.length &&
          values.every((value, index) => Number.isFinite(value) && Math.abs(value - identity[index]) < 1e-8);
      }
      const classes = (ancestor.getAttribute("class") || "").trim().replace(/\s+/g, ".");
      const name = ancestor.tagName.toLowerCase() + (ancestor.id ? "#" + ancestor.id : "") +
        (classes ? "." + classes.slice(0, 120) : "");
      const detail = { element: name, transform, zoom };
      trace.push(detail);
      if (!unchanged || !Number.isFinite(zoomFactor) || Math.abs(zoomFactor - 1) > 1e-8) {
        const error = new Error("目标或祖先存在实际变换/缩放：" + name +
          "（transform=" + transform + "，zoom=" + zoom + "）");
        error.diagnostic = { ...detail, ancestors: trace };
        throw error;
      }
    }
    return trace;
  }

  function measureFont(element) {
    const style = getComputedStyle(element);
    if (style.writingMode !== "horizontal-tb") throw new Error("本版只测量横排文字的上下间距");
    if (element.children.length || !element.textContent.trim()) {
      throw new Error("请定位非空的纯文本元素，富文本请选内部文字节点对应的元素");
    }
    for (const property of ["paddingTop", "paddingBottom", "borderTopWidth", "borderBottomWidth"]) {
      if (parseFloat(style[property]) !== 0) {
        throw new Error("文字元素含上下 padding 或边框，请选无额外留白的文字元素");
      }
    }
    const fontSize = parseFloat(style.fontSize);
    if (!Number.isFinite(fontSize) || fontSize <= 0) throw new Error("目标字号无效");
    const probe = document.createElement("span");
    probe.style.setProperty("all", "initial", "important");
    const language = element.closest("[lang]");
    if (language) probe.lang = language.getAttribute("lang");
    for (const property of [
      "fontFamily", "fontSize", "fontWeight", "fontStyle", "fontStretch", "fontVariant",
      "fontFeatureSettings", "fontVariationSettings", "fontKerning", "lineHeight",
      "letterSpacing", "wordSpacing", "textTransform", "direction", "textSizeAdjust"
    ]) {
      if (style[property]) {
        const cssProperty = property.replace(/[A-Z]/g, letter => "-" + letter.toLowerCase());
        probe.style.setProperty(cssProperty, style[property], "important");
      }
    }
    const layout = {
      position: "fixed", left: "-100000px", top: "0", display: "block",
      width: "max-content", height: "auto", minHeight: "0", maxHeight: "none",
      padding: "0", border: "0", margin: "0", whiteSpace: "nowrap", visibility: "hidden"
    };
    for (const [property, value] of Object.entries(layout)) {
      const cssProperty = property.replace(/[A-Z]/g, letter => "-" + letter.toLowerCase());
      probe.style.setProperty(cssProperty, value, "important");
    }
    probe.textContent = element.textContent;
    document.body.appendChild(probe);
    let singleLineBoxHeight;
    try {
      singleLineBoxHeight = probe.getBoundingClientRect().height;
    } finally {
      probe.remove();
    }
    const range = document.createRange();
    range.selectNodeContents(element);
    const lineTops = new Set(Array.from(range.getClientRects())
      .filter(rect => rect.width > 0 && rect.height > 0)
      .map(rect => Math.round(rect.top * 100) / 100));
    const lineCount = lineTops.size;
    const sourceBox = box(element);
    if (!lineCount || !sourceBox.width || !singleLineBoxHeight ||
        Math.abs(sourceBox.height - singleLineBoxHeight * lineCount) > 1) {
      throw new Error("目标不是自然行高文字盒，请排除固定高度、额外布局留白或隐藏状态");
    }
    return {
      family: style.fontFamily, size: fontSize, weight: style.fontWeight,
      style: style.fontStyle, lineHeight: style.lineHeight,
      letterSpacing: style.letterSpacing, fontStretch: style.fontStretch,
      fontFeatureSettings: style.fontFeatureSettings,
      fontVariationSettings: style.fontVariationSettings,
      singleLineBoxHeight, lineCount, sourceBox,
      estimatedBlank: (singleLineBoxHeight - fontSize) / 2
    };
  }

  async function timeout(promise, milliseconds, message) {
    let timer;
    try {
      return await Promise.race([
        promise,
        new Promise((done, reject) => { timer = setTimeout(() => reject(new Error(message)), milliseconds); })
      ]);
    } finally {
      clearTimeout(timer);
    }
  }

  async function measure(options) {
    if (!options || !options.endpoint || !options.session ||
        !Array.isArray(options.pairs) || !options.pairs.length) {
      throw new Error("需要 endpoint、session 和非空 pairs");
    }
    const timeoutMs = options.timeoutMs || 10000;
    const located = [];
    for (const pair of options.pairs) {
      if (!pair || typeof pair.text !== "string" || !pair.text.trim() ||
          typeof pair.next !== "string" || !pair.next.trim()) {
        throw new Error("每组测量需要 text 和 next 选择器");
      }
      if (!Number.isFinite(pair.targetGap)) throw new Error("targetGap 必须为页面 CSS px 数值");
      located.push({ pair, elements: await waitForPair(pair, timeoutMs) });
    }
    if (document.fonts) await timeout(document.fonts.ready, timeoutMs, "等待字体加载超时");
    for (const item of located) await waitForImage(item.elements.next, timeoutMs);
    await timeout(new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))),
      timeoutMs, "请保持测试页面在前台后重试");
    return located.map(({ pair, elements }) => {
      if (!elements.text.isConnected || !elements.next.isConnected) {
        throw new Error("目标元素已被页面替换，请在页面稳定后重测");
      }
      const geometry = { text: checkGeometry(elements.text), next: checkGeometry(elements.next) };
      const font = measureFont(elements.text);
      const nextBox = box(elements.next);
      if (!nextBox.width || !nextBox.height) throw new Error("相邻元素不可见");
      const nextFont = pair.nextIsText ? measureFont(elements.next) : null;
      const nextBlank = nextFont ? nextFont.estimatedBlank : 0;
      return {
        textSelector: pair.text, nextSelector: pair.next, targetGap: pair.targetGap,
        nextIsText: Boolean(pair.nextIsText), font, nextFont, nextBox, geometry,
        boxGap: nextBox.top - font.sourceBox.bottom,
        suggestedBoxGap: pair.targetGap - font.estimatedBlank - nextBlank
      };
    });
  }

  function makeReport(options, result) {
    const viewport = window.visualViewport;
    return {
      skill: "tune-ink-gap", schemaVersion: 1, session: options.session,
      capturedAt: new Date().toISOString(), deviceLabel: options.deviceLabel || "",
      // 不收集页面查询参数、hash、正文、Cookie 或存储内容。
      page: { origin: location.origin, pathname: location.pathname },
      environment: {
        userAgent: navigator.userAgent, language: navigator.language,
        viewportWidth: innerWidth, viewportHeight: innerHeight,
        devicePixelRatio: devicePixelRatio,
        screenWidth: screen.width, screenHeight: screen.height,
        visualViewport: viewport ? { width: viewport.width, height: viewport.height, scale: viewport.scale } : null,
        fontsStatus: document.fonts ? document.fonts.status : "unsupported"
      },
      ...result
    };
  }

  async function sendReport(options, report) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs || 10000);
    try {
      const response = await fetch(options.endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report), credentials: "omit", signal: controller.signal
      });
      if (!response.ok) throw new Error("上报失败（HTTP " + response.status + "）：" + await response.text());
      const saved = await response.json();
      if (saved.ok !== true || saved.session !== options.session) throw new Error("服务未确认本轮保存");
      return { ...report, receivedAt: saved.receivedAt };
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * 用法：await TuneInkGap.run({ endpoint: "/__ink__/report", session: "本轮标识",
   *   pairs: [{ text: ".title", next: ".cover", targetGap: 20 }] });
   * nextIsText: true 时扣除后一段文字的估算留白。目标须为自然高度、无上下
   * padding/边框的纯文本盒；多行使用同字体单行探针。返回值仅在服务确认保存后给出。
   * 测量失败会尽力回传 status:error 的诊断，随后仍抛出原错误，不伪装成测量成功。
   */
  async function run(options) {
    let measurements;
    try {
      measurements = await measure(options);
    } catch (error) {
      if (options && options.endpoint && options.session) {
        try {
          await sendReport(options, makeReport(options, {
            status: "error", measurements: [],
            error: { message: error.message, diagnostic: error.diagnostic || null }
          }));
          error.diagnosticSaved = true;
        } catch (uploadError) {
          error.diagnosticUploadError = uploadError.message;
        }
      }
      throw error;
    }
    return await sendReport(options, makeReport(options, { status: "ok", measurements }));
  }

  window.TuneInkGap = { run };
  if (script && script.hasAttribute("data-ink-session")) {
    const settings = {
      endpoint: new URL("report", script.src).href,
      session: script.getAttribute("data-ink-session"),
      deviceLabel: script.getAttribute("data-ink-device") || "",
      pairs: [{
        text: script.getAttribute("data-ink-text"), next: script.getAttribute("data-ink-next"),
        targetGap: Number(script.getAttribute("data-ink-gap")),
        nextIsText: script.getAttribute("data-ink-next-text") === "true"
      }]
    };
    async function autoRun() {
      try {
        if (!script.hasAttribute("data-ink-gap")) throw new Error("需要 data-ink-gap 页面目标间距");
        const report = await run(settings);
        console.info("[tune-ink-gap] 已保存到电脑", report);
      } catch (error) {
        console.error("[tune-ink-gap]", error.message);
      }
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", autoRun, { once: true });
    } else {
      autoRun();
    }
  }
}());
