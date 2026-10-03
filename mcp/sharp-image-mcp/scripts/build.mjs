import * as esbuild from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = join(pkgRoot, "dist");
const runtimeDir = join(distDir, "runtime");
const nodeModulesDir = join(pkgRoot, "node_modules");

/**
 * 把 npm 包装进 dist/runtime，取用方只需复制 dist、不必 npm install。
 * 用例：copyRuntimePackage("sharp") → dist/runtime/sharp
 * 用例：copyRuntimePackage(join("@img", "sharp-wasm32"), join("@img", "sharp-wasm32")) → dist/runtime/@img/sharp-wasm32
 */
async function copyRuntimePackage(id, destinationId) {
  const name = destinationId === undefined ? id : destinationId;
  await cp(join(nodeModulesDir, id), join(runtimeDir, name), { recursive: true });
}

await rm(distDir, { recursive: true, force: true });
await mkdir(join(runtimeDir, "@img"), { recursive: true });
await mkdir(join(runtimeDir, "@emnapi"), { recursive: true });

await copyRuntimePackage("sharp");
await copyRuntimePackage(join("@img", "colour"), join("@img", "colour"));
await copyRuntimePackage(join("@img", "sharp-wasm32"), join("@img", "sharp-wasm32"));
await copyRuntimePackage(join("@emnapi", "runtime"), join("@emnapi", "runtime"));
await copyRuntimePackage("detect-libc");
await copyRuntimePackage("semver");
await copyRuntimePackage("tslib");

await esbuild.build({
  entryPoints: [join(pkgRoot, "src", "mcp.js")],
  outfile: join(distDir, "sharp-image-mcp.cjs"),
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  mainFields: ["main"],
  conditions: ["node", "require"],
  external: ["sharp"],
  banner: {
    js: [
      "#!/usr/bin/env node",
      'var __sharpRuntime = require("node:path").join(__dirname, "runtime");',
      'var __sharpModule = require("node:module");',
      "process.env.NODE_PATH = process.env.NODE_PATH ? __sharpRuntime + require(\"node:path\").delimiter + process.env.NODE_PATH : __sharpRuntime;",
      "__sharpModule.Module._initPaths();",
    ].join("\n"),
  },
});
