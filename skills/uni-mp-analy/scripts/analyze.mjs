// uni-mp-analy 2.0.0
import fs from 'node:fs/promises';
import path from 'node:path';
import { fork } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readJson, parseOptions, inspectProject, isWithin } from './lib.mjs';
import { normalizeAnalysis } from './normalize.mjs';
import { compareAnalyses } from './compare.mjs';

const require = createRequire(import.meta.url);
const worker = fileURLToPath(new URL('./ci-worker.cjs', import.meta.url));

/** Run one SDK stage with bounded lifetime; never interpret a crashed worker as empty success. */
export function runStage(stage, options, timeoutMs) {
  return new Promise(resolve => {
    const env = { ...process.env };
    if (stage !== 'preview') delete env.WECHAT_PRIVATE_KEY_PATH;
    const child = fork(worker, [], { execPath: process.execPath, env, stdio: ['ignore', 'ignore', 'ignore', 'ipc'] });
    let finished = false;
    const finish = result => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      child.kill();
      resolve(result);
    };
    const timer = setTimeout(() => finish({ status: 'error', message: `SDK ${stage} 超时（${timeoutMs / 1000} 秒）。` }), timeoutMs);
    child.once('error', () => finish({ status: 'error', message: `SDK ${stage} 进程启动失败。` }));
    child.once('exit', code => finish({ status: 'error', message: `SDK ${stage} 未返回结果，退出码 ${code}。` }));
    child.once('message', message => finish(message.ok ? {
      status: message.diagnosticCount ? 'error' : 'ok',
      message: message.diagnosticCount ? `SDK 内部记录 ${message.diagnosticCount} 条错误；保留返回值供检查，不能视为全部通过。` : '已完成',
    } : { status: 'error', message: `SDK ${stage} 失败（${message.code}）；检查产物、网络、AppID、密钥与 IP 白名单。` }));
    child.send({ stage, ...options });
  });
}

export async function analyze(args) {
  if (!args['--root'] || !args['--output']) throw new Error('需要 --root 工程目录和 --output 新报告目录。');
  const context = await inspectProject(path.resolve(args['--root']), args['--dist']);
  const output = path.resolve(args['--output']);
  if (isWithin(context.projectPath, output) || isWithin(output, context.projectPath)) throw new Error('报告目录不能位于产物内，也不能是产物的父目录。');
  // Resolve its parent as well, so a symlink cannot redirect the report into dist.
  const parent = await fs.realpath(path.dirname(output));
  const realOutput = path.join(parent, path.basename(output));
  if (isWithin(context.projectPath, realOutput) || isWithin(realOutput, context.projectPath)) throw new Error('报告真实路径与产物目录重叠。');
  const timeout = Number(args['--timeout'] || 180);
  const robot = Number(args['--robot'] || 1);
  if (!Number.isFinite(timeout) || timeout < 5 || timeout > 1800) throw new Error('--timeout 必须是 5–1800 秒。');
  if (!Number.isInteger(robot) || robot < 1 || robot > 30) throw new Error('--robot 必须是 1–30。');
  const appid = process.env.WECHAT_APPID || context.config.appid || 'touristappid';
  if (args['--preview']) {
    if (!/^wx[0-9a-f]{16}$/i.test(appid)) throw new Error('预览需要真实 AppID，通过 WECHAT_APPID 提供。');
    if (!process.env.WECHAT_PRIVATE_KEY_PATH) throw new Error('预览需要 WECHAT_PRIVATE_KEY_PATH，值为本地上传密钥路径。');
    const key = await fs.realpath(process.env.WECHAT_PRIVATE_KEY_PATH);
    if (isWithin(context.projectPath, key)) throw new Error('密钥不得放入待预览的产物目录。');
  }
  const baseline = args['--baseline'] ? await readJson(args['--baseline']) : null;
  context.project.buildMode = args['--production'] ? 'production' : 'existing';
  context.tool = { name: 'miniprogram-ci', version: require('miniprogram-ci/package.json').version, nodeVersion: process.version };
  await fs.mkdir(realOutput); // Refuse to overwrite a prior baseline or a user's directory.
  const rawDir = path.join(realOutput, 'raw');
  await fs.mkdir(rawDir);
  const common = { projectPath: context.projectPath, appid, robot };
  const stages = {};
  console.log('正在采集官方依赖图…');
  stages.analysis = await runStage('analysis', { ...common, output: path.join(rawDir, 'analyse-code.json') }, timeout * 1000);
  console.log('正在采集官方代码质量检查…');
  stages.quality = await runStage('quality', { ...common, output: path.join(rawDir, 'code-quality.json') }, timeout * 1000);
  stages.preview = { status: 'skipped', message: '未请求微信预览，最终打包体积未验证。' };
  if (args['--preview']) {
    console.log('正在向微信发送预览代码并采集实际包体…');
    stages.preview = await runStage('preview', { ...common, output: path.join(rawDir, 'preview.json') }, timeout * 1000);
  }
  await fs.writeFile(path.join(rawDir, 'stages.json'), JSON.stringify(stages, null, 2));
  context.stages = stages;
  let raw;
  try { raw = await readJson(path.join(rawDir, 'analyse-code.json')); }
  catch { throw new Error(`未生成有效依赖图。阶段状态已保留：${path.join(rawDir, 'stages.json')}`); }
  async function optionalJson(name) {
    try { return await readJson(path.join(rawDir, name)); }
    catch { return null; }
  }
  const report = await normalizeAnalysis(raw, await optionalJson('code-quality.json'), await optionalJson('preview.json'), context);
  if (report.findings.some(finding => finding.id === 'dependency-errors')) stages.analysis = { status: 'error', message: '存在依赖解析错误，详见报告。' };
  if (args['--preview'] && !report.measurement.packageSizeSource && stages.preview.status === 'ok') stages.preview = { status: 'error', message: '预览未返回 subPackageInfo，最终体积仍未验证。' };
  if (baseline) report.comparison = compareAnalyses(baseline, report);
  await fs.writeFile(path.join(rawDir, 'stages.json'), JSON.stringify(stages, null, 2));
  await fs.writeFile(path.join(realOutput, 'analysis.json'), JSON.stringify(report, null, 2));
  const { generateReport } = await import('./generate-report.mjs');
  await generateReport(report, path.join(realOutput, 'report.html'));
  console.log(`报告：${path.join(realOutput, 'report.html')}`);
  return { report, output: realOutput, exitCode: Object.values(stages).some(stage => stage.status === 'error') ? 2 : 0 };
}

async function main() {
  const args = parseOptions(process.argv.slice(2), ['--root', '--dist', '--output', '--baseline', '--timeout', '--robot'], ['--production', '--preview', '--help']);
  if (args['--help']) {
    console.log('Skill 内部脚本：node analyze.mjs --root <uni-app CLI 工程> --output <新目录> [--dist <微信产物项目目录>] [--production] [--baseline <analysis.json>] [--preview] [--robot 1] [--timeout 180]\n先独立执行项目 production 构建。预览通过 WECHAT_APPID / WECHAT_PRIVATE_KEY_PATH 读取凭据；默认仅本地分析。输出父目录须已存在。');
    return;
  }
  const result = await analyze(args);
  process.exitCode = result.exitCode;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
