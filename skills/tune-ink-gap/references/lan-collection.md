# 局域网采集回传

在 Agent 电脑启动临时服务，目标设备测量业务页面并自动回传。使用已有 Node.js 18+，无需安装依赖。以下路径以 Skill 目录为基准。

## 1. 启动服务

目标设备需能访问电脑和业务页面，通常使用同一可互通局域网。手机访问电脑时使用电脑的局域网 IP，不能用 `localhost`。

```sh
node scripts/collector.mjs --port 47381 --origin http://192.168.1.10:5173
```

将示例 IP 和端口换成实际值；`--origin` 是目标设备打开的业务页面来源（协议、主机、端口）。记录启动输出中的：

- `session`：本轮标识，重启后更新。
- `reportFile`：本轮报告的 JSONL 文件路径。
- `urls`：演示地址，仅用于检查回传是否可用，不能替代业务页面测量。

服务默认 900 秒后退出，可用 `--timeout` 调整。连接失败时检查 IP、防火墙和网络隔离。

## 2. 接入目标页面

在业务页面 HTML 入口临时加入脚本，替换服务地址、会话、选择器和目标间距：

```html
<script
  defer
  src="http://192.168.1.10:47381/measure.js"
  data-ink-session="本轮 session"
  data-ink-text=".page-title"
  data-ink-next=".cover"
  data-ink-gap="20"
  data-ink-device="设备备注"
></script>
```

相邻元素也是文字时，增加 `data-ink-next-text="true"`。目标间距单位为页面 CSS px。脚本等待元素、字体和图片后自动测量并上报，刷新页面可重测。

### 使用同源代理

项目已有开发代理时，优先把 `/__ink__/` 转发到采集服务。以 Vite 为例，合并到现有配置：

```js
server: {
  proxy: {
    "/__ink__": {
      target: "http://127.0.0.1:47381",
      changeOrigin: true,
      rewrite: path => path.replace(/^\/__ink__/, "")
    }
  }
}
```

把脚本地址改为 `/__ink__/measure.js`，上报会自动使用 `/__ink__/report`。`--origin` 仍填写业务页面来源。修改代理配置后重启开发服务。

HTTPS、CSP 或浏览器本地网络限制可能阻止直接加载 HTTP 采集脚本；优先使用已有可达的同源入口，不通过关闭浏览器保护或放宽整个项目 CSP 绕过。

## 3. 读取结果并收尾

Agent 读取 `reportFile`，核对本轮会话、业务页面、设备和选择器：

- `status: "ok"`：测量成功，使用 `measurements` 中的单行盒高、字号和估算留白。
- `status: "error"`：测量失败，读取 `error` 排查后重测。

按 `SKILL.md` 计算、调整并汇报结果，不执行视觉效果校验。完成后移除临时脚本和代理，关闭服务，按需保留报告。
