import { basename, join } from "node:path";
import { mkdir } from "node:fs/promises";
import { Command } from "commander";
import fg from "fast-glob";
import { setApiKey, compressFile } from "../src/core.js";

const kb = (n) => `${(n / 1024).toFixed(1)}KB`;

const program = new Command();
program
  .name("tinymcp")
  .description("用 TinyPNG 官方 API 压缩图片")
  .argument("<patterns...>", "图片路径或 glob，如 'assets/**/*.{png,jpg}'")
  .option("-k, --key <keys>", "API Key（默认 TINIFY_API_KEY；多个用 , 或 ; 分隔）")
  .option("-o, --out <dir>", "输出目录（默认覆盖原文件）")
  .option("-w, --width <px>", "目标宽度", Number)
  .option("-H, --height <px>", "目标高度", Number)
  .action(async (patterns, opts) => {
    try {
      setApiKey(opts.key || process.env.TINIFY_API_KEY);

      const files = await fg(patterns, { onlyFiles: true });
      if (files.length === 0) {
        console.error("没匹配到文件");
        process.exit(1);
      }
      if (opts.out) await mkdir(opts.out, { recursive: true });

      let totalSaved = 0;
      let lastCount = 0;
      for (const f of files) {
        const output = opts.out ? join(opts.out, basename(f)) : f;
        const r = await compressFile(f, {
          output,
          width: opts.width,
          height: opts.height,
        });
        totalSaved += r.saved;
        lastCount = r.compressionCount;
        console.log(
          `✓ ${f}  ${kb(r.before)} → ${kb(r.after)}  (-${(r.ratio * 100).toFixed(1)}%)`
        );
      }

      console.log(
        `\n完成 ${files.length} 张，共省 ${kb(totalSaved)}。` +
          `本月已用 ${lastCount} 次（免费额度 500/月）。`
      );
    } catch (e) {
      console.error("✗", e.message);
      process.exit(1);
    }
  });

program.parseAsync();
