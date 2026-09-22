# 执行与数据协议

## 内置脚本

分析器使用 Node 20+，实际验证版本见 `validation.md`。业务工程仍使用其支持的本机 Node；分析进程与业务构建可以使用不同 Node，无需全局切换。`scripts/package.json` 为私有内部依赖清单，没有 `bin`，不发布独立工具。

所有路径可为绝对路径；`--dist` 的相对路径以 `--root` 为基准，`--output`、`--baseline` 以调用进程 cwd 为基准。报告父目录须已存在，新报告目录必须不存在。命令示例使用参数形态，Agent 在执行前按 Windows PowerShell / macOS / Linux shell 正确引用路径。

| 脚本 / 参数 | 含义 |
|---|---|
| `analyze.mjs --root ... --output ...` | 采集本地依赖和质量结果，生成 JSON 和单 HTML |
| `--dist ...` | 包含微信 `project.config.json` 的产物目录，默认 `dist/build/mp-weixin` |
| `--production` | 调用者确认刚刚完成 production 构建；脚本本身不构建，不保证源码新鲜度 |
| `--preview` | 明确请求微信预览；读取环境变量凭据，并发送代码到微信 |
| `--robot 1` | 预览机器人编号，1–30 |
| `--timeout 180` | 每个 SDK 阶段的超时秒数，5–1800 |
| `--baseline ...` | 与旧 `analysis.json` 比较，嵌入同一报告 |
| `generate-report.mjs --input ... --output ...` | 从已有统一 JSON 重新生成 HTML |
| `compare.mjs --before ... --after ... --output ...` | 离线生成带比较结果的 JSON 和 HTML，新目录保护基准 |

分析退出码：`0` 已请求阶段完成；`1` 参数、工程、输入、数据协议或报告写入失败；`2` 存在失败/不完整阶段但已生成可检查报告。质量项 `success:false` 是问题，不等于脚本执行失败。预览默认跳过不影响本地分析成功。

本地模式以非密钥占位字符串满足 `ci.Project` 构造器，完全不读取真实密钥；只调用不需鉴权的 `analyseCode` / `checkCodeQuality`。占位字符串不是模拟分析数据，也不能用于预览。预览需真实 `WECHAT_APPID` 与 `WECHAT_PRIVATE_KEY_PATH`；密钥内容和路径不写进统一报告。SDK 输出在独立子进程中隔离；SDK 内部异常数量也计入状态，避免质量检查吞掉异常后误报通过。

## 输出

```text
<新报告目录>/
  analysis.json            统一协议，供 AI 和页面读取
  report.html              内嵌脚本、样式和数据，可离线打开
  raw/
    analyse-code.json      官方依赖结果原文
    code-quality.json      官方质量结果原文（成功返回时）
    stages.json            各阶段成功、跳过或失败
    preview.json           官方预览返回值（仅启用且返回时）
    preview-qrcode.jpg     预览二维码（仅成功预览时）
```

原始结果可能包含项目文件名、路径和业务结构，不要未经用户要求上传到第三方服务。HTML 嵌入数据同样包含这些信息。发布 Skill 只带模板，不带用户报告。

## `schemaVersion: 1`

字节均为非负整数，显示层按 1000 换算 KB/MB/GB；缺失测量为 `null`，绝不等于 0。

- `project`：名称、`framework`（`vue2-webpack` / `vue3-vite`）、`buildMode`（`production` / `existing`）、构建脚本、相关依赖声明和依赖锁文件摘要 `lockHashes`。
- `tool`：`miniprogram-ci` 名称、精确版本、分析时 Node 版本。
- `stages`：`analysis`、`quality`、`preview` 的 `status` 和 `message`。解析图内部错误也导致 analysis 不完整。
- `measurement`：`fileSizeSource`、`packageSizeSource` 和口径说明。
- `totals`：`fileBytes` / `fileCount`、`unlinkedBytes` / `unlinkedCount`、`packedBytes`。
- `packages[]`：`name`、`root`、`label`、`fileBytes`、`fileCount`、`packedBytes`。主包键为 `__APP__`；分包按 SDK 给出的根路径归属。
- `files[]`：`path`、`ext`、`size`、`package`、`moduleId`、`sha256`。按体积降序，来源为 analyseCode；不是压缩后每文件贡献。
- `modules[]`：保留 SDK 的 `id/type/path/deps/parentDeps/errors` 等字段。向下看 `deps[].moduleId`，向上看 `parentDeps[].originModuleId`。
- `quality[]`：保留 SDK 的 `name/success/text/docURL/detail`。SDK 规则不是平台硬性限制；保留 detail 才能定位文件。
- `findings[]`：派生发现，包括 `id/severity/title/description/files/evidence`。未关联、重复候选不构成自动删除授权。
- `duplicates[]`：相同 SHA-256 的 `size/paths/potentialBytes`，潜在冗余不是可兑现收益。
- `fingerprint`：微信编译设置哈希和产物文件哈希集合摘要，用来识别对比口径变化。不是完整构建环境锁定。
- `comparison`：无基准时为 null；否则包含可比性提示、总量和各包的 before/after/delta、文件新增/删除/变化（同体积但 hash 不同也保留）。

`preview.subPackageInfo` 中 `__FULL__` 是官方总包值，`__APP__` 是主包值；分包优先按根路径匹配，也支持 app.json 中显式包名。未返回 `__FULL__` 时不把各包相加冒充官方总包。插件等未匹配包保留于 raw，并在报告提示。

矩形树图只表达 analyseCode 文件字节，不能按比例分配 packedBytes 伪造“压缩后单文件大小”。质量检查 `PACKAGE_SIZE_LIMIT.detail` 也不能冒充预览包体。两种数据并列展示。

树图使用固定高度、无内部滚动条的紧凑视口，层级固定为“代码包 → 主包/分包 → 具体目录和文件”。画布顶层只能出现包区块，每个文件必须归入唯一的主包或分包区块；分包区块内部会移除与分包根目录重复的首段路径，但文件点击仍使用原始产物路径。当前范围的全部文件始终绘制，不收起深层目录、不分页，也不删除或合并文件数据；密集数据下矩形会相应缩小。名称和体积单行展示，空间不足时省略显示，悬停查看完整路径。文件数只在“代码包”根层级的统计栏展示；主包、分包和普通目录标签均不显示文件数。点击包或目录标题及其留白下钻，矩形视图内部顶部统计栏左侧同步展示以“代码包”为起点的面包屑路径；祖先层级使用可点击链接切换视图，当前层级以文字标识，不另设返回上一级或根目录按钮。目录标题使用原生按钮、面包屑使用原生链接，支持键盘操作。下钻仅影响树图，不改变文件排行；切换包筛选时返回代码包根视图，窗口重排保留当前目录。矩形面积按 analyseCode 文件体积计算，精确数值以标签为准。点击文件仍可查看依赖，不触发目录跳转，包筛选同时作用于树图。

矩形视图内部的单行统计栏始终显示当前层级及后代文件的汇总体积；仅处于“代码包”根层级时附带文件数，下钻和返回时同步更新。包归属只在一级包节点通过“主包”或“分包 · 包名”表达，包内目录和文件不重复显示包标签；不同包中的同名目录保持为独立节点。目录和包容器保持透明，仅具体文件使用背景色；目录体积可保留强调，文件体积使用常规字重，悬停矩形可查看精确字节数。以上均为 analyseCode 文件口径，不是微信预览包体积。

质量检查的标题与解释默认使用中文，按官方 `success` 分别表述通过、未通过或未确认；不能从 SDK 的英文告警句式推断状态。未通过表示需核实，不自动等同于发布阻断或可删除代码。官方规则标识、英文说明及详情完整保存在折叠的原始结果中，统一 JSON 不因展示翻译而改写。未知规则只提示核对原文，不编造中文结论。

## Windows SDK 路径兼容

在 `miniprogram-ci 2.1.31` 的真实 Vue 2 / Vue 3 产物测试中，SDK 可能同时返回 `common/vendor.js`（关联模块）和 `common\vendor.js`（未关联模块），并在分包根后附加 `/`。统一层将分隔符和分包根规范化，合并同文件别名并优先保留已关联模块的记录；内容或关联信息冲突时直接失败，不猜测。

`raw/` 保留官方原文。出现路径别名时报告增加 `sdk-path-aliases` 提示：官方质量扫描的包字节数和“未使用代码”列表也可能受到相同问题影响。AI 必须对照统一后的文件及依赖图，不把同一文件的反斜杠别名当无用代码删除，也不把它当真实重复资源。报告内文件合计以去重后的文件表为准。

## 接口依据

- [微信官方 miniprogram-ci 文档](https://github.com/wechat-miniprogram/miniprogram-ci-dist)：`analyseCode`、`checkCodeQuality`、`preview` 和 `subPackageInfo`。
- [DCloud CLI 工程](https://uniapp.dcloud.net.cn/quickstart-cli.html)：Vue 2 / Vue 3 创建与生产构建。

文档更新可能早于 npm 包；以锁文件、已安装接口和实测数据为实现依据，不使用未公开的内部函数替代正式 API。
