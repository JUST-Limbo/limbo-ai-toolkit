// wxmpurl-info 1.0.0：合成数据验证；不保存真实用户链接和参数。
import assert from 'node:assert/strict';
import test from 'node:test';
import { parseHtml, resolveLink, validateUrl } from './resolve.mjs';

const url = 'https://wxmpurl.cn/Example123';
const query = 'usercode=demo&room_id=42&title=中文&tag=a&tag=b';
const encoded = Buffer.from(query).toString('base64');
const config = (expression = `base64Decode('${encoded}')`, id = 'Example123') => `window.data = {
    nickname: '测试小程序', user_name: 'gh_example', path: 'pages/room/index',
    url_scheme: 'weixin://dl/business/?t=${id}', query: ${expression},
}`;
const html = body => `<html><script>${body}</script></html>`;

test('过滤 mock 和注释，解码 UTF-8，保留重复参数', () => {
    const page = html(`
        if (false) { window.data = {path:'mock',url_scheme:mockScheme,query:'x=1'} }
        else { ${config().replace('query:', "// query: '旧值',\n query:")} }
        // ${config("'fake=1'")}
        /* ${config("'fake=2'")} */
    `);
    const result = parseHtml(page, url);
    assert.equal(result.path, 'pages/room/index');
    assert.equal(result.query, query);
    assert.equal(result.pageUrl, `pages/room/index?${query}`);
    assert.deepEqual(result.queryParams.slice(-2), [['tag', 'a'], ['tag', 'b']]);
    assert.equal(result.evidence, 'landing-page-config-only');
});

test('支持空 query、字符串转义及路径不作额外猜测', () => {
    const result = parseHtml(html(config("''").replace('pages/room/index', 'pages/index/index').replace('测试小程序', 'A\\u4e2d\\x42')), url);
    assert.equal(result.nickname, 'A中B');
    assert.equal(result.pageUrl, 'pages/index/index');
    assert.deepEqual(result.queryParams, []);
});

test('明文 query 中的 URL、逗号和花括号不破坏静态解析', () => {
    const result = parseHtml(html(config("'next=https://example.com/a?x={1},2&n=3'")), url);
    assert.equal(result.query, 'next=https://example.com/a?x={1},2&n=3');
});

test('转义反斜杠与引号正确解码，未知转义不猜测', () => {
    const result = parseHtml(html(config(String.raw`'value=a\\q\'b'`)), url);
    assert.equal(result.query, "value=a\\q'b");
    assert.throws(() => parseHtml(html(config(String.raw`'value=\q'`)), url), /不支持的转义/);
});

test('无法确定唯一配置时拒绝，不能复用别的短链数据', () => {
    assert.throws(() => parseHtml(html(config("''", 'Other123')), url), /找到 0 个/);
    assert.throws(() => parseHtml(html(config() + ';' + config()), url), /找到 2 个/);
    assert.throws(() => parseHtml('<html>已失效</html>', url), /找到 0 个/);
});

test('无效 Base64 和非法 UTF-8 明确失败', () => {
    assert.throws(() => parseHtml(html(config("base64Decode('???')")), url), /Base64/);
    assert.throws(() => parseHtml(html(config("base64Decode('/w==')")), url), /encoded data/);
});

test('动态表达式不执行，缺失和重复字段拒绝', () => {
    globalThis.wxmpurlTestExecuted = false;
    assert.throws(() => parseHtml(html(config('(globalThis.wxmpurlTestExecuted = true)')), url), /动态表达式/);
    assert.equal(globalThis.wxmpurlTestExecuted, false);
    delete globalThis.wxmpurlTestExecuted;
    assert.throws(() => parseHtml(html(config().replace("path: 'pages/room/index',", '')), url), /缺少/);
    assert.throws(() => parseHtml(html(config().replace("path: 'pages/room/index',", "path:'a',path:'b',")), url), /重复字段/);
});

test('拒绝其他协议、主机、凭证和非短链路径', () => {
    for (const invalid of ['http://wxmpurl.cn/a', 'https://example.com/a', 'https://wxmpurl.cn.evil/a', 'https://x@wxmpurl.cn/a', 'https://wxmpurl.cn/a/b', 'https://wxmpurl.cn:444/a'])
        assert.throws(() => validateUrl(invalid));
});

test('GET 获取配置，发送禁用缓存头，保留请求与最终 URL', async () => {
    const result = await resolveLink(url, async (requestUrl, options) => {
        assert.equal(requestUrl, url);
        assert.equal(options.redirect, 'manual');
        assert.equal(options.headers['Cache-Control'], 'no-cache');
        assert.ok(options.signal);
        return new Response(html(config()));
    });
    assert.equal(result.fetchedUrl, url);
    assert.equal(result.sourceUrl, url);
});

test('允许同域跳转，并匹配最终短链编号', async () => {
    let count = 0;
    const result = await resolveLink(url, async () => ++count === 1
        ? new Response(null, { status: 302, headers: { location: '/Other123' } })
        : new Response(html(config("''", 'Other123'))));
    assert.equal(result.sourceUrl, url);
    assert.equal(result.fetchedUrl, 'https://wxmpurl.cn/Other123');
});

test('异域跳转、无限跳转、HTTP 失败、超大响应和网络失败均终止', async () => {
    await assert.rejects(resolveLink(url, async () => new Response(null, { status: 302, headers: { location: 'https://example.com/a' } })), /仅支持/);
    await assert.rejects(resolveLink(url, async () => new Response(null, { status: 302, headers: { location: '/Example123' } })), /超过 5 次/);
    await assert.rejects(resolveLink(url, async () => new Response('', { status: 403 })), /HTTP 403/);
    await assert.rejects(resolveLink(url, async () => new Response('x'.repeat(1024 * 1024 + 1))), /1 MiB/);
    await assert.rejects(resolveLink(url, async () => { throw new Error('测试网络不可达'); }), /测试网络不可达/);
});
