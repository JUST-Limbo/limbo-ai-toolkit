# 验证基线与复测方法

## 已验证范围

2026-09-22 在 Windows / PowerShell、Node `22.22.0`、npm `10.9.4` 和 `miniprogram-ci 2.1.31` 下完成验证。以下是实测组合，不是对所有编译器版本的兼容承诺。

| 工程 | 主要依赖 | 结果 |
|---|---|---|
| Vue 2 CLI | Vue 2.6.14、Vue CLI 5.0.9、Webpack 5.111.1、DCloud 2.0.2-5020620260917001 | 生产构建、分析和基线对比通过 |
| Vue 3 CLI | Vue 3.4.21、Vite 5.2.8、DCloud 3.0.0-5020620260917001 | 生产构建、分析和基线对比通过 |

工程基于公开的 [DCloud uni-preset-vue](https://github.com/dcloudio/uni-preset-vue) 模板创建。为完成构建而做的 Vue 2 测试工程适配不是 Skill 对业务工程的通用修改要求。实验工程和报告不随 Skill 保留或分发，复测时重新创建。

实测已核对磁盘文件数与字节总量，并覆盖包归属、路径去重、报告生成和前后对比。尚未执行真实微信预览，因此最终微信打包体积未验证。

## 自动回归

`scripts/` 中的 `npm test` 覆盖：

- 分包归属、预览包映射、未关联与重复文件判断。
- Windows 路径别名归一化与冲突拒绝。
- 基线对比、工程识别、路径边界和输出目录保护。
- 报告生成、数据转义、空数据和已有目录拒绝。
- 无密钥调用官方 `analyseCode` 与 `checkCodeQuality`。

自动测试不替代真实浏览器的像素级视觉验收、微信预览或真机回归。

## 已知 SDK 差异

Windows 上的正反斜杠文件别名会影响原始文件和质量统计，统一层已去重并保留警告。处理约束见 [执行与数据协议](runtime.md#windows-sdk-路径兼容)。

依赖导航向下使用 `deps.moduleId`，向上使用 `parentDeps.originModuleId`。

## 发布前复测

1. 在 `scripts/` 安装锁定依赖并运行 `npm test`。
2. 分别创建 Vue 2 / Vue 3 CLI 工程，完成 production 构建后核对报告与磁盘文件。
3. 对一组可证实的源码优化执行 `--baseline` 对比。
4. 修改预览流程时，使用获得授权的 AppID、包外密钥和 IP 白名单验证 `subPackageInfo`。
