// wxmpurl-info 1.0.0：静态读取网页配置，不执行网页代码。
import { pathToFileURL } from 'node:url';

const MAX_BYTES = 1024 * 1024;
const fields = new Set(['nickname', 'url_scheme', 'user_name', 'path', 'query']);

/** 例：validateUrl('https://wxmpurl.cn/Example123')；仅接受无凭证的同域 HTTPS 短链。 */
export function validateUrl(value) {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname !== 'wxmpurl.cn' || url.port
        || url.username || url.password || !/^\/[A-Za-z0-9]+$/.test(url.pathname)) {
        throw new Error('仅支持 https://wxmpurl.cn/<短链编号>');
    }
    return url;
}

function stringValue(token) {
    if (!token || !/^['"]/.test(token))
        throw new Error('配置字段不是静态字符串');
    return token.slice(1, -1).replace(/\\(u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|[\s\S])/g, (_, escape) => {
        if (/^(?:u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2})$/.test(escape))
            return String.fromCharCode(Number.parseInt(escape.slice(1), 16));
        if (!/^['"\\/bnrtfv]$/.test(escape))
            throw new Error('字符串包含不支持的转义');
        return ({ b: '\b', n: '\n', r: '\r', t: '\t', f: '\f', v: '\v' })[escape] || escape;
    });
}

function decodeQuery(encoded) {
    if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded))
        throw new Error('query 不是有效的标准 Base64');
    return new TextDecoder('utf-8', { fatal: true }).decode(Buffer.from(encoded, 'base64'));
}

function parseObject(tokens) {
    const config = {};
    for (let index = 0; index < tokens.length;) {
        if (tokens[index] === ',') {
            index++;
            continue;
        }
        const keyToken = tokens[index++];
        const key = /^['"]/.test(keyToken) ? stringValue(keyToken) : keyToken;
        if (tokens[index++] !== ':')
            throw new Error('配置对象结构不受支持');
        const expression = [];
        let depth = 0;
        while (index < tokens.length) {
            const token = tokens[index];
            if (token === ',' && depth === 0)
                break;
            if (['(', '[', '{'].includes(token)) depth++;
            if ([')', ']', '}'].includes(token)) depth--;
            expression.push(token);
            index++;
        }
        if (!fields.has(key)) continue;
        if (Object.hasOwn(config, key))
            throw new Error('配置对象存在重复字段');
        if (expression.length === 1 && /^['"]/.test(expression[0])) {
            config[key] = stringValue(expression[0]);
        } else if (key === 'query' && expression.length === 4
            && expression[0] === 'base64Decode' && expression[1] === '(' && expression[3] === ')') {
            config.query = decodeQuery(stringValue(expression[2]));
        } else {
            throw new Error('配置字段包含不支持的动态表达式');
        }
    }
    return config;
}

/** 例：parseHtml(html, shortUrl)；只取编号匹配的唯一静态配置，注释和示例分支不作结果。 */
export function parseHtml(html, sourceUrl) {
    const url = validateUrl(sourceUrl);
    const expectedScheme = `weixin://dl/business/?t=${url.pathname.slice(1)}`;
    const configs = [];
    const failures = [];
    for (const script of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)) {
        // 字符串先于注释匹配，避免把 URL 中的 // 当成注释。
        const tokens = (script[1].match(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`|\/\/[^\r\n]*|\/\*[\s\S]*?\*\/|[A-Za-z_$][\w$]*|[^\s]/g) || [])
            .filter(token => !token.startsWith('//') && !token.startsWith('/*'));
        for (let index = 0; index < tokens.length - 4; index++) {
            if (tokens.slice(index, index + 5).join(' ') !== 'window . data = {') continue;
            const start = index + 5;
            let end = start;
            let depth = 1;
            for (; end < tokens.length; end++) {
                if (tokens[end] === '{') depth++;
                if (tokens[end] === '}') {
                    depth--;
                    if (depth === 0) break;
                }
            }
            const objectTokens = tokens.slice(start, end);
            // 先按静态 scheme 选择分支，mock 的动态值不需要解析。
            const matchesScheme = objectTokens.some((token, at) => (token === 'url_scheme' || token === '"url_scheme"' || token === "'url_scheme'")
                && objectTokens[at + 1] === ':' && /^['"]/.test(objectTokens[at + 2] || '')
                && stringValue(objectTokens[at + 2]) === expectedScheme);
            if (!matchesScheme) continue;
            try {
                if (depth !== 0) throw new Error('配置对象未闭合');
                const config = parseObject(objectTokens);
                if (!config.path || !config.user_name || typeof config.query !== 'string')
                    throw new Error('配置缺少 path、user_name 或 query');
                configs.push(config);
            } catch (error) {
                failures.push(error.message);
            }
        }
    }
    if (failures.length) throw new Error(failures.join('; '));
    if (configs.length !== 1)
        throw new Error(`需要唯一匹配配置，实际找到 ${configs.length} 个`);
    const config = configs[0];
    return {
        sourceUrl: url.href,
        nickname: config.nickname || '',
        userName: config.user_name,
        path: config.path,
        query: config.query,
        pageUrl: config.path + (config.query ? `?${config.query}` : ''),
        urlScheme: config.url_scheme,
        queryParams: [...new URLSearchParams(config.query)],
        evidence: 'landing-page-config-only',
    };
}

/** 例：await resolveLink(shortUrl)；GET 总超时 20 秒，最多 5 次同域跳转、1 MiB 正文。 */
export async function resolveLink(sourceUrl, fetchImpl = fetch) {
    let current = validateUrl(sourceUrl);
    const signal = AbortSignal.timeout(20000);
    for (let redirects = 0; redirects <= 5; redirects++) {
        const response = await fetchImpl(current.href, {
            redirect: 'manual', signal,
            headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
        });
        if ([301, 302, 303, 307, 308].includes(response.status)) {
            if (response.body) await response.body.cancel();
            const location = response.headers.get('location');
            if (!location) throw new Error('重定向缺少 Location');
            current = validateUrl(new URL(location, current));
            continue;
        }
        if (!response.ok) {
            if (response.body) await response.body.cancel();
            throw new Error(`HTTP ${response.status}`);
        }
        if (!response.body) throw new Error('响应没有正文');
        const chunks = [];
        let size = 0;
        for await (const chunk of response.body) {
            size += chunk.length;
            if (size > MAX_BYTES) throw new Error('响应超过 1 MiB');
            chunks.push(chunk);
        }
        const result = parseHtml(Buffer.concat(chunks).toString('utf8'), current.href);
        return { ...result, sourceUrl: validateUrl(sourceUrl).href, fetchedUrl: current.href };
    }
    throw new Error('重定向超过 5 次');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    try {
        if (process.argv.length !== 3) throw new Error('用法：node resolve.mjs <https://wxmpurl.cn/短链编号>');
        console.log(JSON.stringify(await resolveLink(process.argv[2]), null, 2));
    } catch (error) {
        console.error(`解析失败：${error.message}`);
        process.exitCode = 1;
    }
}
