// uniapp-wechat-package-optimizer 1.0.0
// 本文件中的目录、JSON 和分析结果均为 node:test 合成测试数据，不代表真实微信 SDK 实测结果。
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { compareAnalyses } from '../compare.mjs';
import { inspectProject, isWithin, safeFile } from '../lib.mjs';
import { normalizeAnalysis } from '../normalize.mjs';

async function makeTempDir(t, label) {
  const created = await fs.mkdtemp(path.join(os.tmpdir(), `uniapp-optimizer-${label}-`));
  const resolved = path.resolve(created);
  assert.equal(isWithin(path.resolve(os.tmpdir()), resolved), true, '临时目录必须位于系统临时目录内');
  t.after(async () => {
    await fs.rm(resolved, { recursive: true, force: true });
  });
  return resolved;
}

async function writeJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(value, null, 2));
}

async function writeArtifact(dist, relative, content) {
  const file = path.join(dist, ...relative.split('/'));
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content);
  return Buffer.byteLength(content);
}

function normalizeContext(dist) {
  return {
    dist,
    app: {
      pages: ['pages/index/index'],
      subPackages: [
        { root: 'pkg', name: 'FriendlyPackage' },
        { root: 'pkg-near', name: 'NeighborPackage' },
      ],
    },
    config: {
      compileType: 'miniprogram',
      miniprogramRoot: 'mini-root/',
      setting: { es6: true },
      packOptions: { ignore: [] },
    },
    project: { name: 'synthetic-project', framework: 'vue3-vite', buildMode: 'existing' },
    tool: { name: 'miniprogram-ci', version: '2.1.31', nodeVersion: process.version },
    stages: {
      analysis: { status: 'ok' },
      quality: { status: 'ok' },
      preview: { status: 'ok' },
    },
  };
}

function comparableReport(overrides = {}) {
  return {
    schemaVersion: 1,
    generatedAt: '2026-09-22T00:00:00.000Z',
    project: { name: 'synthetic-project', framework: 'vue3-vite', buildMode: 'production' },
    tool: { name: 'miniprogram-ci', version: '2.1.31' },
    fingerprint: { settings: 'settings-a' },
    stages: { analysis: { status: 'ok' } },
    totals: { fileBytes: 0, packedBytes: null },
    packages: [],
    files: [],
    ...overrides,
  };
}

test('normalizeAnalysis 信任官方 subPackage 精确归属并把 null moduleId 仅作为风险提示', async t => {
  const dist = await makeTempDir(t, 'normalize');
  const duplicate = 'same-content';
  const mainSize = await writeArtifact(dist, 'app.js', 'main');
  const firstSize = await writeArtifact(dist, 'pkg-near/assets/a.bin', duplicate);
  const secondSize = await writeArtifact(dist, 'pkg-near/assets/b.bin', duplicate);

  const raw = {
    files: [
      { path: 'app.js', size: mainSize, moduleId: 'module-main' },
      // 路径看似属于 pkg-near，但官方 analyseCode 的 subPackage 明确归到 pkg。
      { path: 'pkg-near/assets/a.bin', size: firstSize, subPackage: 'pkg', moduleId: null },
      { path: 'pkg-near/assets/b.bin', size: secondSize, subPackage: 'pkg-near', moduleId: 'module-b' },
    ],
    modules: [],
  };
  const preview = {
    subPackageInfo: [
      { name: '__FULL__', size: 901 },
      { name: '__APP__', size: 101 },
      { name: 'FriendlyPackage', size: 202 },
      { name: 'pkg-near', size: 303 },
    ],
  };

  const report = await normalizeAnalysis(raw, [], preview, normalizeContext(dist));
  const files = new Map(report.files.map(file => [file.path, file]));
  const packages = new Map(report.packages.map(pkg => [pkg.name, pkg]));
  const unlinked = report.findings.find(finding => finding.id === 'unlinked');

  assert.equal(files.get('pkg-near/assets/a.bin').package, 'pkg');
  assert.equal(files.get('pkg-near/assets/b.bin').package, 'pkg-near');
  assert.equal(files.get('pkg-near/assets/a.bin').moduleId, null);
  assert.equal(unlinked.severity, 'info');
  assert.match(unlinked.description, /未关联不等于可删除/);
  assert.deepEqual(unlinked.files, ['pkg-near/assets/a.bin']);

  assert.equal(report.totals.packedBytes, 901);
  assert.equal(packages.get('__APP__').packedBytes, 101);
  assert.equal(packages.get('pkg').packedBytes, 202);
  assert.equal(packages.get('pkg-near').packedBytes, 303);

  assert.equal(report.duplicates.length, 1);
  assert.equal(report.duplicates[0].size, firstSize);
  assert.equal(report.duplicates[0].potentialBytes, firstSize);
  assert.deepEqual(report.duplicates[0].paths, [
    'pkg-near/assets/a.bin',
    'pkg-near/assets/b.bin',
  ]);
  const duplicateFinding = report.findings.find(finding => finding.id === 'duplicates');
  assert.equal(duplicateFinding.severity, 'info');
  assert.match(duplicateFinding.description, /候选冗余字节不等于可实现收益/);
});

test('normalizeAnalysis 合并 Windows SDK 路径别名并归一化分包尾斜杠', async t => {
  const dist = await makeTempDir(t, 'sdk-path-alias');
  const vendorSize = await writeArtifact(dist, 'common/vendor.js', 'linked vendor content');
  const packageSize = await writeArtifact(dist, 'package-a/pages/a.js', 'package alpha content');
  const raw = {
    files: [
      { path: 'common/vendor.js', size: vendorSize, moduleId: 'Js:common/vendor.js' },
      // miniprogram-ci 2.1.31 在 Windows 上会额外返回同一物理文件的反斜杠未关联记录。
      { path: 'common\\vendor.js', size: vendorSize, moduleId: null },
      { path: 'package-a/pages/a.js', size: packageSize, subPackage: 'package-a/', moduleId: 'Js:package-a/pages/a.js' },
    ],
    modules: [],
  };
  const quality = [
    { name: 'PACKAGE_SIZE_LIMIT', success: true, detail: { __APP__: vendorSize * 2, 'package-a/': packageSize } },
    { name: 'CONTAINS_UNUSED_CODES', success: true, detail: ['common\\vendor.js'] },
  ];
  const context = normalizeContext(dist);
  context.app.subPackages = [{ root: 'package-a', name: 'AlphaPackage' }];

  const report = await normalizeAnalysis(raw, quality, null, context);
  const packages = new Map(report.packages.map(pkg => [pkg.name, pkg]));
  const aliasFinding = report.findings.find(finding => finding.id === 'sdk-path-aliases');

  assert.equal(report.files.length, 2);
  assert.equal(report.totals.fileBytes, vendorSize + packageSize);
  assert.equal(report.totals.unlinkedCount, 0);
  assert.equal(report.files.find(file => file.path === 'common/vendor.js').moduleId, 'Js:common/vendor.js');
  assert.equal(report.files.some(file => file.path.includes('\\')), false);
  assert.equal(report.duplicates.length, 0, '同一物理文件的路径别名不能成为重复候选');
  assert.equal(packages.get('package-a').fileBytes, packageSize);
  assert.equal(packages.has('package-a/'), false);
  assert.equal(aliasFinding.severity, 'warning');
  assert.match(aliasFinding.description, /包大小/);
  assert.match(aliasFinding.description, /未使用代码/);
  assert.deepEqual(report.quality, quality, '统一报告应保留官方质量扫描原始字段供审计');
  assert.equal(raw.files.length, 3, '规范化不能篡改后续要写入 raw 的官方数据');
});

test('normalizeAnalysis 拒绝同一路径别名上的关联信息冲突', async t => {
  const dist = await makeTempDir(t, 'sdk-path-conflict');
  const size = await writeArtifact(dist, 'common/vendor.js', 'conflicting aliases');
  const raw = {
    files: [
      { path: 'common/vendor.js', size, moduleId: 'Js:first' },
      { path: 'common\\vendor.js', size, moduleId: 'Js:second' },
    ],
    modules: [],
  };

  await assert.rejects(
    normalizeAnalysis(raw, [], null, normalizeContext(dist)),
    /SDK 路径别名信息冲突/,
  );
});

test('normalizeAnalysis 在预览缺失时保留 packed 为 null，不用文件体积或 0 代替', async t => {
  const dist = await makeTempDir(t, 'no-preview');
  const size = await writeArtifact(dist, 'app.js', 'main');
  const report = await normalizeAnalysis({
    files: [{ path: 'app.js', size, moduleId: 'module-main' }],
    modules: [],
  }, [], null, normalizeContext(dist));

  assert.equal(report.measurement.packageSizeSource, null);
  assert.equal(report.totals.packedBytes, null);
  assert.equal(report.packages.every(pkg => pkg.packedBytes === null), true);
  assert.equal(report.measurement.notes.some(note => note.includes('最终包体未验证')), true);
});

test('compareAnalyses 按路径区分同大小、不同 hash 的添加与删除', () => {
  const before = comparableReport({
    totals: { fileBytes: 4, packedBytes: 20 },
    packages: [{ name: '__APP__', fileBytes: 4, packedBytes: 20 }],
    files: [{ path: 'old.js', size: 4, sha256: 'hash-old' }],
  });
  const after = comparableReport({
    generatedAt: '2026-09-22T00:01:00.000Z',
    totals: { fileBytes: 4, packedBytes: 20 },
    packages: [{ name: '__APP__', fileBytes: 4, packedBytes: 20 }],
    files: [{ path: 'new.js', size: 4, sha256: 'hash-new' }],
  });

  const comparison = compareAnalyses(before, after);
  assert.deepEqual(comparison.files, [
    { path: 'old.js', status: 'removed', before: 4, after: 0, delta: -4 },
    { path: 'new.js', status: 'added', before: 0, after: 4, delta: 4 },
  ]);
});

test('compareAnalyses 将 framework、SDK 和 settings 混用标记为不可直接比较', () => {
  const before = comparableReport();
  const after = comparableReport({
    project: { name: 'synthetic-project', framework: 'vue2-webpack', buildMode: 'production' },
    tool: { name: 'miniprogram-ci', version: '2.2.0' },
    fingerprint: { settings: 'settings-b' },
  });

  const comparison = compareAnalyses(before, after);
  assert.equal(comparison.comparable, false);
  assert.equal(comparison.warnings.includes('编译器类型不同。'), true);
  assert.equal(comparison.warnings.includes('miniprogram-ci 版本不同。'), true);
  assert.equal(comparison.warnings.includes('微信编译/打包设置不同或缺失；体积变化可能来自配置变化。'), true);
});

test('compareAnalyses 对缺失的总包和分包 packed 测量返回 null', () => {
  const before = comparableReport({
    totals: { fileBytes: 10, packedBytes: 20 },
    packages: [{ name: '__APP__', fileBytes: 10, packedBytes: 20 }],
  });
  const after = comparableReport({
    totals: { fileBytes: 10, packedBytes: null },
    packages: [{ name: '__APP__', fileBytes: 10, packedBytes: null }],
  });

  const comparison = compareAnalyses(before, after);
  assert.equal(comparison.totals.packedBytes, null);
  assert.equal(comparison.packages[0].packedBytes, null);
});

test('safeFile 拒绝通过父目录跳转到相似前缀的外部目录', async t => {
  const parent = await makeTempDir(t, 'safe-file');
  const dist = path.join(parent, 'dist');
  const sibling = path.join(parent, 'dist-copy');
  await fs.mkdir(dist);
  await fs.mkdir(sibling);
  await fs.writeFile(path.join(sibling, 'outside.txt'), 'outside');

  await assert.rejects(
    safeFile(dist, '../dist-copy/outside.txt'),
    /文件超出产物目录/,
  );
  await assert.rejects(
    safeFile(dist, path.join(sibling, 'outside.txt')),
    /分析结果含非相对文件路径/,
  );
});

async function makeCliProject(t, label, dependencies) {
  const root = await makeTempDir(t, label);
  const projectPath = path.join(root, 'dist', 'build', 'mp-weixin');
  const miniRoot = path.join(projectPath, 'mini-root');
  await writeJson(path.join(root, 'package.json'), {
    name: `fixture-${label}`,
    dependencies,
  });
  await writeJson(path.join(projectPath, 'project.config.json'), {
    compileType: 'miniprogram',
    miniprogramRoot: 'mini-root/',
  });
  await writeJson(path.join(miniRoot, 'app.json'), {
    pages: ['pages/index/index'],
  });
  return { root, projectPath, miniRoot };
}

test('inspectProject 识别 Vue 2 CLI 并遵循 project.config.json 的 miniprogramRoot', async t => {
  const fixture = await makeCliProject(t, 'vue2', {
    '@dcloudio/vue-cli-plugin-uni': '2.0.2',
  });
  const result = await inspectProject(fixture.root);

  assert.equal(result.project.framework, 'vue2-webpack');
  assert.equal(result.projectPath, await fs.realpath(fixture.projectPath));
  assert.equal(result.dist, await fs.realpath(fixture.miniRoot));
});

test('inspectProject 识别 Vue 3 CLI 并遵循 project.config.json 的 miniprogramRoot', async t => {
  const fixture = await makeCliProject(t, 'vue3', {
    '@dcloudio/vite-plugin-uni': '3.0.0',
  });
  const result = await inspectProject(fixture.root);

  assert.equal(result.project.framework, 'vue3-vite');
  assert.equal(result.projectPath, await fs.realpath(fixture.projectPath));
  assert.equal(result.dist, await fs.realpath(fixture.miniRoot));
});

test('inspectProject 拒绝非 CLI 工程和同时声明两套 CLI 插件的歧义工程', async t => {
  const unsupported = await makeCliProject(t, 'unsupported', {
    '@dcloudio/uni-app': '3.0.0',
  });
  const ambiguous = await makeCliProject(t, 'ambiguous', {
    '@dcloudio/vue-cli-plugin-uni': '2.0.2',
    '@dcloudio/vite-plugin-uni': '3.0.0',
  });

  await assert.rejects(inspectProject(unsupported.root), /需要明确的 uni-app CLI 工程/);
  await assert.rejects(inspectProject(ambiguous.root), /需要明确的 uni-app CLI 工程/);
});
