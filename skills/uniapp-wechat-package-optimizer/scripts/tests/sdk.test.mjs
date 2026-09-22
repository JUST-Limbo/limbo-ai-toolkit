// uniapp-wechat-package-optimizer 1.0.0
// 本文件仅使用 node:test 临时生成的原生小程序合成夹具验证 SDK API，不代表真实 uni-app 工程或业务数据。
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { runStage } from '../analyze.mjs';
import { readJson, isWithin } from '../lib.mjs';

test('real SDK local analysis and quality run without reading an upload key', async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'uniapp-sdk-test-'));
  try {
    const projectPath = path.join(temp, 'dist');
    await fs.mkdir(path.join(projectPath, 'pages'), { recursive: true });
    const fixture = {
      'project.config.json': { appid: 'touristappid', compileType: 'miniprogram', setting: { minified: true, minifyWXML: true, minifyWXSS: true } },
      'app.json': { pages: ['pages/index'], lazyCodeLoading: 'requiredComponents' },
      'pages/index.json': {},
    };
    for (const [file, contents] of Object.entries(fixture)) await fs.writeFile(path.join(projectPath, file), JSON.stringify(contents));
    await fs.writeFile(path.join(projectPath, 'app.js'), 'App({})');
    await fs.writeFile(path.join(projectPath, 'pages/index.js'), 'Page({})');
    await fs.writeFile(path.join(projectPath, 'pages/index.wxml'), '<view>SDK test fixture</view>');
    await fs.writeFile(path.join(projectPath, 'pages/index.wxss'), 'view{color:red}');
    const analysisPath = path.join(temp, 'analysis.json');
    const local = await runStage('analysis', { projectPath, appid: 'touristappid', output: analysisPath }, 60000);
    assert.equal(local.status, 'ok', local.message);
    const raw = await readJson(analysisPath);
    assert.ok(raw.files.some(file => file.path === 'pages/index.js'));
    assert.ok(raw.modules.some(module => module.type === 'Page'));
    const qualityPath = path.join(temp, 'quality.json');
    const quality = await runStage('quality', { projectPath, appid: 'touristappid', output: qualityPath }, 60000);
    assert.equal(quality.status, 'ok', quality.message);
    assert.ok((await readJson(qualityPath)).some(item => item.name === 'PACKAGE_SIZE_LIMIT'));
  } finally {
    assert.ok(isWithin(os.tmpdir(), temp) && path.basename(temp).startsWith('uniapp-sdk-test-'));
    await fs.rm(temp, { recursive: true, force: true });
  }
});
