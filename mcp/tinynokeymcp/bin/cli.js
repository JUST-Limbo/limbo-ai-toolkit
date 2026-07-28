import { basename, join } from "node:path";
import { mkdir } from "node:fs/promises";
import { Command } from "commander";
import fg from "fast-glob";
import { compressFile } from "../src/core.js";

const kb = function (n) {
  return (n / 1024).toFixed(1) + "KB";
};

const program = new Command();
program
  .name("tinynokeymcp")
  .description("免 API Key：通过 TinyPNG 官网 Web 后台压缩 PNG/JPG")
  .argument("<patterns...>", "图片路径或 glob")
  .option("-o, --out <dir>", "输出目录（默认覆盖原文件）")
  .action(async function (patterns, opts) {
    try {
      const files = await fg(patterns, { onlyFiles: true });
      if (files.length === 0) {
        console.error("没匹配到文件");
        process.exit(1);
      }
      if (opts.out) {
        await mkdir(opts.out, { recursive: true });
      }

      let totalSaved = 0;
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const output = opts.out ? join(opts.out, basename(f)) : f;
        const r = await compressFile(f, { output: output });
        totalSaved += r.saved;
        console.log(
          `✓ ${f}  ${kb(r.before)} → ${kb(r.after)}  (-${(r.ratio * 100).toFixed(1)}%)`
        );
      }

      console.log(`\n完成 ${files.length} 张，共省 ${kb(totalSaved)}。`);
    } catch (e) {
      console.error("✗", e.message);
      process.exit(1);
    }
  });

program.parseAsync();
