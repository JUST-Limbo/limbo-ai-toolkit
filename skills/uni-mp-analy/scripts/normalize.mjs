// uni-mp-analy 2.0.0
import fs from 'node:fs/promises';
import path from 'node:path';
import { safeFile, digest, stableJson } from './lib.mjs';

/** SDK Windows paths can use either separator; package roots also carry a trailing slash. */
function canonicalPath(value) { return path.posix.normalize(value.replace(/\\/g, '/')).replace(/\/$/, ''); }

/** Preserve SDK package attribution. Merge Windows aliases without double-counting physical files. */
export async function normalizeAnalysis(raw, quality, preview, context) {
  if (!raw || !Array.isArray(raw.files) || !Array.isArray(raw.modules)) {
    throw new Error('analyseCode 返回结构与已验证协议不符，请保留 raw 数据并检查 SDK 版本。');
  }
  const seen = new Set();
  const canonicalFiles = new Map();
  let aliasCount = 0;
  for (const file of raw.files) {
    if (!Number.isFinite(file.size) || file.size < 0 || typeof file.path !== 'string' || seen.has(file.path)) {
      throw new Error('analyseCode 包含无效或重复文件记录');
    }
    seen.add(file.path);
    const relative = canonicalPath(file.path);
    const fullPath = await safeFile(context.dist, relative);
    const bytes = await fs.readFile(fullPath);
    if (bytes.length !== file.size) throw new Error(`采集期间产物已变更：${file.path}，请停止 watch 构建后重试。`);
    const normalized = { path: relative, ext: file.ext || path.posix.extname(relative), size: file.size,
      package: file.subPackage ? canonicalPath(file.subPackage) : '__APP__', moduleId: file.moduleId || null, sha256: digest(bytes) };
    const previous = canonicalFiles.get(relative);
    if (previous) {
      if (previous.sha256 !== normalized.sha256 || previous.size !== normalized.size || (previous.moduleId && normalized.moduleId && (previous.moduleId !== normalized.moduleId || previous.package !== normalized.package))) {
        throw new Error(`SDK 路径别名信息冲突：${relative}`);
      }
      aliasCount += 1;
      // The SDK's extra backslash record is unlinked; keep the graph-connected record.
      if (!previous.moduleId && normalized.moduleId) canonicalFiles.set(relative, normalized);
    } else canonicalFiles.set(relative, normalized);
  }
  const files = [...canonicalFiles.values()];
  files.sort((a, b) => b.size - a.size || a.path.localeCompare(b.path));
  const subpackages = context.app.subPackages || context.app.subpackages || [];
  const packages = new Map([['__APP__', { name: '__APP__', root: '', label: '主包', fileBytes: 0, fileCount: 0, packedBytes: null }]]);
  for (const pkg of subpackages) {
    const root = canonicalPath(pkg.root);
    packages.set(root, { name: root, root, label: pkg.name || root, fileBytes: 0, fileCount: 0, packedBytes: null });
  }
  for (const file of files) {
    if (!packages.has(file.package)) packages.set(file.package, { name: file.package, root: file.package, label: file.package, fileBytes: 0, fileCount: 0, packedBytes: null });
    const pkg = packages.get(file.package);
    pkg.fileBytes += file.size;
    pkg.fileCount += 1;
  }
  const packed = preview && Array.isArray(preview.subPackageInfo) ? preview.subPackageInfo : [];
  let packedBytes = null;
  const unmatched = [];
  for (const item of packed) {
    if (!Number.isFinite(item.size) || item.size < 0) continue;
    if (item.name === '__FULL__') packedBytes = item.size;
    else {
      const definition = subpackages.find(pkg => pkg.name === item.name);
      const normalizedName = canonicalPath(item.name);
      const key = packages.has(normalizedName) ? normalizedName : definition ? canonicalPath(definition.root) : null;
      if (key) packages.get(key).packedBytes = item.size;
      else unmatched.push(item.name);
    }
  }
  const duplicateMap = new Map();
  for (const file of files) {
    if (file.size === 0) continue;
    if (!duplicateMap.has(file.sha256)) duplicateMap.set(file.sha256, []);
    duplicateMap.get(file.sha256).push(file);
  }
  const duplicates = [...duplicateMap].filter(([, group]) => group.length > 1).map(([sha256, group]) => ({
    sha256, size: group[0].size, paths: group.map(file => file.path), potentialBytes: group[0].size * (group.length - 1),
  })).sort((a, b) => b.potentialBytes - a.potentialBytes);
  const unlinked = files.filter(file => !file.moduleId);
  const findings = [];
  if (aliasCount) findings.push({ id: 'sdk-path-aliases', severity: 'warning', title: '已合并 SDK 的 Windows 路径别名',
    description: `官方结果把 ${aliasCount} 条同文件路径以不同分隔符重复列出。文件统计已去重；官方质量扫描的包大小和未使用代码条目可能同样受影响，不能直接据此删除文件。`,
    files: [], evidence: 'raw/analyse-code.json 中正反斜杠路径指向同一文件；优先保留已关联模块的记录' });
  if (unlinked.length) findings.push({ id: 'unlinked', severity: 'info', title: '依赖图未关联文件',
    description: '未关联不等于可删除：动态资源路径、运行时读取、平台约定文件可能未被静态依赖图覆盖。',
    files: unlinked.map(file => file.path), evidence: 'analyseCode.files[].moduleId 为空' });
  if (duplicates.length) findings.push({ id: 'duplicates', severity: 'info', title: '存在相同内容文件',
    description: 'SHA-256 相同。候选冗余字节不等于可实现收益；分包隔离可能需要保留副本。',
    files: duplicates.flatMap(group => group.paths), evidence: '产物文件 SHA-256 与长度比较' });
  const errors = raw.modules.filter(module => (module.errors && module.errors.length) || module.buildError || (module.deps || []).some(dep => dep.error));
  if (errors.length) findings.push({ id: 'dependency-errors', severity: 'error', title: '依赖解析不完整',
    description: '这些模块存在解析错误，不能据此认定文件无用或自动删除；详情见模块和原始数据。',
    files: errors.map(module => module.path), evidence: 'analyseCode.modules errors/buildError/deps.error' });
  if (unmatched.length) findings.push({ id: 'unmatched-packages', severity: 'warning', title: '部分预览包未匹配',
    description: `预览返回的包名未匹配 app.json：${unmatched.join(', ')}。请检查 raw/preview.json。`, files: [], evidence: 'preview.subPackageInfo' });
  const notes = [
    '矩形树图和文件合计来自 analyseCode 的文件体积，不代表微信最终打包体积。',
    '质量扫描中的包预算是 SDK 的检查规则，不等同于当前微信平台的硬性上传限制。',
    '静态图未覆盖的动态引用和分包隔离需结合源码与运行验证。',
  ];
  if (!packed.length) notes.push('尚无微信预览打包数据；最终包体未验证。');
  if (context.project.buildMode === 'existing') notes.push('使用已有产物；本报告不能证明它来自最新源码或生产构建。');
  const result = {
    schemaVersion: 1, generatedAt: new Date().toISOString(), tool: context.tool, project: context.project,
    stages: context.stages,
    measurement: { fileSizeSource: 'miniprogram-ci.analyseCode', packageSizeSource: packed.length ? 'miniprogram-ci.preview' : null, notes },
    fingerprint: { settings: digest(stableJson({ setting: context.config.setting || {}, packOptions: context.config.packOptions || {}, miniprogramRoot: context.config.miniprogramRoot || '', compileType: context.config.compileType || 'miniprogram' })),
      artifact: digest(stableJson(files.map(file => [file.path, file.sha256]).sort((a, b) => a[0].localeCompare(b[0])))) },
    totals: { fileBytes: files.reduce((sum, file) => sum + file.size, 0), fileCount: files.length,
      unlinkedBytes: unlinked.reduce((sum, file) => sum + file.size, 0), unlinkedCount: unlinked.length, packedBytes },
    packages: [...packages.values()], files, modules: raw.modules, quality: Array.isArray(quality) ? quality : [],
    findings, duplicates, comparison: null,
  };
  return result;
}
