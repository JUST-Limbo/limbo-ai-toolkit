import * as esbuild from "esbuild";
import { mkdir } from "node:fs/promises";

const banner = { js: "#!/usr/bin/env node" };

await mkdir("dist", { recursive: true });

const shared = {
  bundle: true,
  platform: "node",
  target: "node18",
  format: "cjs",
  banner: banner,
  logLevel: "info",
};

await esbuild.build({
  ...shared,
  entryPoints: ["src/mcp.js"],
  outfile: "dist/tinynokeymcp.cjs",
});

await esbuild.build({
  ...shared,
  entryPoints: ["bin/cli.js"],
  outfile: "dist/tinynokeymcp-cli.cjs",
});

console.log("built dist/tinynokeymcp.cjs, dist/tinynokeymcp-cli.cjs");
