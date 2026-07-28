import * as esbuild from "esbuild";
import { mkdir } from "node:fs/promises";

const banner = { js: "#!/usr/bin/env node" };

await mkdir("dist", { recursive: true });

const shared = {
  bundle: true,
  platform: "node",
  target: "node18",
  format: "cjs",
  banner,
  logLevel: "info",
};

await esbuild.build({
  ...shared,
  entryPoints: ["src/mcp.js"],
  outfile: "dist/tinymcp.cjs",
});

await esbuild.build({
  ...shared,
  entryPoints: ["bin/cli.js"],
  outfile: "dist/tinymcp-cli.cjs",
});

console.log("built dist/tinymcp.cjs, dist/tinymcp-cli.cjs");
