import { basename, extname, join } from "node:path";
import { mkdir } from "node:fs/promises";
import { Command } from "commander";
import fg from "fast-glob";
import {
  setApiKey,
  compressFile,
  convertFile,
  convertToFormats,
  extensionForFormat,
} from "../src/core.js";

const kb = (n) => `${(n / 1024).toFixed(1)}KB`;

const program = new Command();
program
  .name("tinymcp")
  .description("用 TinyPNG 官方 API 压缩或转换图片格式")
  .argument("<patterns...>", "图片路径或 glob，如 'assets/**/*.{png,jpg}'")
  .option("-k, --key <keys>", "API Key（默认 TINIFY_API_KEY；多个用 , 或 ; 分隔）")
  .option("-o, --out <dir>", "输出目录或文件路径")
  .option(
    "-f, --format <fmt>",
    "目标格式：avif | webp | jpg | png | jxl（指定则转格式，否则仅压缩原格式）"
  )
  .option(
    "-F, --formats <list>",
    "一次导出多种格式，逗号分隔，如 avif,webp,jpg（仅单文件输入时可用）"
  )
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

      if (opts.formats) {
        if (files.length !== 1) {
          console.error("多格式导出（-F）仅支持单张输入文件");
          process.exit(1);
        }
        const formats = opts.formats.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
        if (opts.out) await mkdir(opts.out, { recursive: true });
        const results = await convertToFormats(files[0], {
          formats,
          outputDir: opts.out,
          width: opts.width,
          height: opts.height,
        });
        for (let i = 0; i < results.length; i++) {
          const r = results[i];
          console.log(`✓ ${r.format}  ${r.output}  ${kb(r.before)} → ${kb(r.after)}`);
        }
        const last = results[results.length - 1];
        console.log(
          `\n完成 ${results.length} 种格式。本月已用 ${last.compressionCount} 次。`
        );
        return;
      }

      if (opts.format) {
        if (opts.out) await mkdir(opts.out, { recursive: true });
        let lastCount = 0;
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          let output = opts.out;
          if (output && files.length > 1) {
            output = join(
              opts.out.replace(/[\\/]+$/, ""),
              basename(f, extname(f)) + extensionForFormat(opts.format)
            );
          }
          const r = await convertFile(f, {
            format: opts.format,
            output,
            width: opts.width,
            height: opts.height,
          });
          lastCount = r.compressionCount;
          console.log(
            `✓ ${f}  → ${r.output}  ${kb(r.before)} → ${kb(r.after)}  (-${(r.ratio * 100).toFixed(1)}%)`
          );
        }
        console.log(
          `\n完成 ${files.length} 张，格式 ${opts.format}。本月已用 ${lastCount} 次。`
        );
        return;
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
