// uniapp-wechat-package-optimizer 1.0.0
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

/** Read UTF-8 JSON, accepting a BOM (e.g. PowerShell-created config files). */
export async function readJson(file) {
  return JSON.parse((await fs.readFile(file, 'utf8')).replace(/^\uFEFF/, ''));
}

/** True for the directory itself and descendants; sibling prefixes are not children. */
export function isWithin(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

/** Resolve an SDK file path inside its real root; reject traversal and external symlinks. */
export async function safeFile(root, relative) {
  if (typeof relative !== 'string' || path.isAbsolute(relative) || /^[A-Za-z]:/.test(relative)) {
    throw new Error('分析结果含非相对文件路径');
  }
  const resolved = await fs.realpath(path.resolve(root, relative));
  if (!isWithin(root, resolved)) throw new Error(`文件超出产物目录：${relative}`);
  return resolved;
}

/** Stable key order: identical config objects with different key insertion orders hash equally. */
export function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function digest(value) {
  return createHash('sha256').update(value).digest('hex');
}

/** Strict internal script arguments: unknown flags, duplicate flags, missing values fail early. */
export function parseOptions(args, valueFlags, boolFlags = []) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    if (Object.hasOwn(options, flag)) throw new Error(`重复参数：${flag}`);
    if (boolFlags.includes(flag)) options[flag] = true;
    else if (valueFlags.includes(flag)) {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) throw new Error(`参数缺少值：${flag}`);
      options[flag] = value;
      index += 1;
    } else throw new Error(`未知参数：${flag}`);
  }
  return options;
}

export async function inspectProject(root, distOption) {
  root = await fs.realpath(root);
  const pkg = await readJson(path.join(root, 'package.json'));
  const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
  const vue2 = Boolean(dependencies['@dcloudio/vue-cli-plugin-uni']);
  const vue3 = Boolean(dependencies['@dcloudio/vite-plugin-uni']);
  if (vue2 === vue3) throw new Error('需要明确的 uni-app CLI 工程：Vue 2 vue-cli-plugin-uni 或 Vue 3 vite-plugin-uni。');
  const projectPath = await fs.realpath(path.resolve(root, distOption || 'dist/build/mp-weixin'));
  const config = await readJson(path.join(projectPath, 'project.config.json'));
  if (config.compileType && config.compileType !== 'miniprogram') throw new Error('仅支持微信小程序产物。');
  const dist = await fs.realpath(path.resolve(projectPath, config.miniprogramRoot || '.'));
  if (!isWithin(projectPath, dist)) throw new Error('miniprogramRoot 必须位于产物项目目录内。');
  const app = await readJson(path.join(dist, 'app.json'));
  if (!Array.isArray(app.pages) || app.pages.length === 0) throw new Error('app.json 缺少主包页面，请先完成微信小程序构建。');
  const lockHashes = {};
  for (const name of ['package-lock.json', 'npm-shrinkwrap.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lock', 'bun.lockb']) {
    try { lockHashes[name] = digest(await fs.readFile(path.join(root, name))); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return { root, projectPath, dist, config, app, project: {
    name: pkg.name || path.basename(root), framework: vue2 ? 'vue2-webpack' : 'vue3-vite',
    buildMode: 'existing', label: pkg.name || path.basename(root),
    buildScript: pkg.scripts && pkg.scripts['build:mp-weixin'] || null,
    dependencySpec: Object.fromEntries(Object.entries(dependencies).filter(([name]) => name.startsWith('@dcloudio/') || name === 'vue')),
    lockHashes,
  } };
}
