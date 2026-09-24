import * as esbuild from "esbuild";
import { mkdir } from "node:fs/promises";

await mkdir("dist", { recursive: true });

await esbuild.build({
  entryPoints: ["src/mcp.js"],
  outfile: "dist/sharp-image-mcp.cjs",
  bundle: true,
  packages: "external",
  platform: "node",
  target: "node20",
  format: "cjs",
  banner: { js: "#!/usr/bin/env node" },
});
