// uni-mp-analy 2.1.0. 合成数据只用于离线视图回归，不包含业务工程数据。
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import { createViewerData } from '../viewer-data.mjs';

const ASSETS = new URL('../../assets/code-analyse-viewer/', import.meta.url);
const bundle = await readFile(new URL('5.11e9b38e.chunk.js', ASSETS), 'utf8');

test('视图映射分包与路径，独立复制测量和依赖，提示缺失引用', () => {
  const analysis = {
    files: [{ path: 'sub/page.js', package: 'sub', size: 3, moduleId: 'a' }, { path: 'app.js', package: '__APP__', size: 4, moduleId: 'missing' }],
    modules: [{ id: 'a', path: 'sub\\page.js', deps: [{ moduleId: 'b' }, { moduleId: 'missing', error: 'unresolved' }], parentDeps: [] }, { id: 'b', path: 'common.js', deps: [], parentDeps: [{ originModuleId: 'a', moduleId: 'b' }] }]
  };
  const before = JSON.stringify(analysis);
  const { data, omittedRelations } = createViewerData(analysis);
  assert.equal(data.files[0].subPackage, 'sub/');
  assert.equal(data.files[1].subPackage, null);
  assert.equal(data.files[1].moduleId, null);
  assert.equal(data.modules[0].path, 'sub/page.js');
  assert.equal(data.modules[0].deps[0].moduleId, 'b');
  assert.equal(data.modules[1].parentDeps[0].originModuleId, 'a');
  assert.equal(omittedRelations, 2);
  data.files[0].size += 100;
  assert.equal(JSON.stringify(analysis), before);
  assert.deepEqual(createViewerData(null), { data: { files: [], modules: [], compilerPlugins: [] }, omittedRelations: 0 });
});

test('运行原版分摊函数：隐藏节点大小平均分配至保留子树叶节点', () => {
  const start = bundle.indexOf('var y=function(t,e)') + 'var y='.length;
  const end = bundle.indexOf('}(p,v.descendants()', start) + 1;
  assert.ok(start > 6 && end > start, '原版算法边界必须可识别');
  const redistribute = runInNewContext('(' + bundle.slice(start, end) + ')');
  const tree = { id: 'root', children: [
    { id: 'a', type: 'file', size: 100 },
    { id: 'dir', size: 60, children: [{ id: 'b', size: 20 }, { id: 'c', size: 30 }, { id: 'hidden-in-dir', size: 10 }] },
    { id: 'hidden', size: 90 }
  ] };
  const result = redistribute(tree, ['root', 'a', 'dir', 'b', 'c']);
  assert.equal(result.originalChildCount, 3);
  assert.equal(result.children.length, 2);
  assert.equal(result.children[0].size, 145);
  assert.equal(result.children[1].children[0].size, 47.5);
  assert.equal(result.children[1].children[1].size, 57.5);
  assert.equal(result.children[1].children.length, 2);
});

test('原版依赖标签保留路径文字且不生成用户注入的 HTML', () => {
  const start = bundle.indexOf('function __escapeLabel');
  const end = bundle.indexOf('function T(t)', start);
  const render = runInNewContext(bundle.slice(start, end) + ';({file:S,module:N})', {
    f: { a: size => String(size) },
    A: { a: { basename: path => path.split('/').pop(), dirname: path => path.split('/').slice(0, -1).join('/') } }
  });
  const path = 'folder/<img src=x onerror="alert(1)">.js';
  for (const html of [render.file({ path, size: 2 }), render.module({ path, type: 'Page' })]) {
    assert.doesNotMatch(html, /<img/);
    assert.match(html, /&lt;img/);
    assert.match(html, /&quot;/);
  }
});

test('运行资源哈希与移植清单一致，不包含原版示例 chunk', async () => {
  const manifest = JSON.parse(await readFile(new URL('provenance.json', ASSETS), 'utf8'));
  assert.equal(manifest.files.length, 8);
  for (const item of manifest.files) {
    const content = await readFile(new URL(item.file, ASSETS));
    assert.equal(createHash('sha256').update(content.toString().replace(/\r\n/g, '\n')).digest('hex'), item.bundledSha256, item.file);
    assert.doesNotMatch(content.toString(), /sourceMappingURL/);
    assert.doesNotMatch(item.file, /^6\./);
  }
});
