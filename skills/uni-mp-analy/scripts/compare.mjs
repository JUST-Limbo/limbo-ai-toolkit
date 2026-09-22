// uni-mp-analy 2.0.0
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { readJson, parseOptions, stableJson } from './lib.mjs';

function change(before, after) { return { before, after, delta: after - before }; }
function packedChange(before, after) {
  return Number.isFinite(before) && Number.isFinite(after) ? change(before, after) : null;
}

/** Match by package/file identity, not ranking. Missing packed measurements remain null. */
export function compareAnalyses(before, after) {
  if (before.schemaVersion !== 1 || after.schemaVersion !== 1) throw new Error('仅支持 schemaVersion 1 的报告比较。');
  const warnings = [];
  if (before.project.name !== after.project.name) warnings.push('项目名称不同。');
  if (before.project.framework !== after.project.framework) warnings.push('编译器类型不同。');
  if (before.tool.version !== after.tool.version) warnings.push('miniprogram-ci 版本不同。');
  if (before.tool.nodeVersion !== after.tool.nodeVersion) warnings.push('分析时 Node 版本不同。');
  if (stableJson(before.project.dependencySpec || {}) !== stableJson(after.project.dependencySpec || {})) warnings.push('uni-app / Vue 依赖声明不同，需区分依赖升级与源码优化收益。');
  if (stableJson(before.project.lockHashes || {}) !== stableJson(after.project.lockHashes || {})) warnings.push('项目依赖锁文件不同，需核对依赖变动。');
  if (before.project.buildMode !== 'production' || after.project.buildMode !== 'production') warnings.push('至少一份报告未确认生产构建。');
  if (!before.fingerprint || !after.fingerprint || before.fingerprint.settings !== after.fingerprint.settings) warnings.push('微信编译/打包设置不同或缺失；体积变化可能来自配置变化。');
  if (!before.stages || !after.stages || before.stages.analysis.status !== 'ok' || after.stages.analysis.status !== 'ok') warnings.push('至少一份依赖分析不完整。');
  const packageNames = new Set([...before.packages, ...after.packages].map(pkg => pkg.name));
  const beforeFiles = new Map(before.files.map(file => [file.path, file]));
  const afterFiles = new Map(after.files.map(file => [file.path, file]));
  const files = [];
  for (const name of new Set([...beforeFiles.keys(), ...afterFiles.keys()])) {
    const a = beforeFiles.get(name);
    const b = afterFiles.get(name);
    if (a && b && a.size === b.size && a.sha256 === b.sha256) continue;
    files.push({ path: name, status: !a ? 'added' : !b ? 'removed' : 'changed', ...change(a ? a.size : 0, b ? b.size : 0) });
  }
  return { baselineGeneratedAt: before.generatedAt, comparable: warnings.length === 0, warnings,
    totals: { fileBytes: change(before.totals.fileBytes, after.totals.fileBytes), packedBytes: packedChange(before.totals.packedBytes, after.totals.packedBytes) },
    packages: [...packageNames].map(name => {
      const a = before.packages.find(pkg => pkg.name === name);
      const b = after.packages.find(pkg => pkg.name === name);
      return { name, fileBytes: change(a ? a.fileBytes : 0, b ? b.fileBytes : 0), packedBytes: packedChange(a ? a.packedBytes : null, b ? b.packedBytes : null) };
    }), files: files.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)),
  };
}

async function main() {
  const args = parseOptions(process.argv.slice(2), ['--before', '--after', '--output']);
  if (!args['--before'] || !args['--after'] || !args['--output']) throw new Error('需要 --before、--after 和 --output。');
  const after = await readJson(args['--after']);
  after.comparison = compareAnalyses(await readJson(args['--before']), after);
  const output = path.resolve(args['--output']);
  await fs.mkdir(output, { recursive: false });
  await fs.writeFile(path.join(output, 'analysis.json'), JSON.stringify(after, null, 2));
  const { generateReport } = await import('./generate-report.mjs');
  await generateReport(after, path.join(output, 'report.html'));
  console.log(`对比报告：${path.join(output, 'report.html')}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
