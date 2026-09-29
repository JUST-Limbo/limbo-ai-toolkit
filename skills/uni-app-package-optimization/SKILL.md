---
name: uni-app-package-optimization
description: Optimize main and subpackage size in uni-app mini-program projects. Use for package ownership, subpackage-only npm dependencies, shared-code or CSS duplication, and before/after size tradeoffs; check platform, Vue version, and compiler behavior.
metadata:
  x-skill-version: "1.0.0"
  x-source-repo: "JUST-Limbo/limbo-ai-toolkit"
  x-source-path: "skills/uni-app-package-optimization"
---

# uni-app 小程序包体优化

## 功能说明

诊断并优化主包、分包和总包体积，适用于 uni-app CLI 与 HBuilderX 项目。需要微信 CLI 的依赖图或树图报告时，可另用 `uni-mp-analy`；本 Skill 不依赖它。

## 使用方法

1. 确认目标平台、Vue 和编译器版本，用同一生产构建配置记录主包、各分包及总包体积；按文件大小排序，找出大文件、重复文件和异常归属。
2. 从产物反查页面、入口、组件注册和依赖链，选影响最大的目标做单项改动。CLI 项目若编译器缺少所需能力或有相关已修复问题，核对兼容性后，必要时更新对应的 `@dcloudio` 依赖并重建。
3. 改动前说明预期影响主包、分包还是总包；改动后复测相同指标和页面行为。

### 按产物类型定位

#### 样式

- 对照 `app.wxss` 和页面 `.wxss`，检查 `uni.scss` 中产出规则的选择器／导入，以及页面重复导入的公共样式。自动注入造成重复时，让 `uni.scss` 只承载变量、mixin、函数，评估把全局规则放入 `App.vue` 非 scoped 样式。
- 反复使用的样式可参照 Tailwind 的原子类表达方式整理为全局公共类；只纳入实际使用的规则，核对页面重复量与主包、总包体积。

#### 代码与组件

- 从大 JS 文件反查页面、全局入口、全局组件注册和整库导入；仅在分包使用的代码，检查是否被公共入口或主包间接引用。
- 核对目标平台 `manifest.json` 中的 `optimization.subPackages`，结合[分包优化规则](https://uniapp.dcloud.net.cn/collocation/manifest.html)和编译器版本判断归属：只被一个分包引用的 JS 可进入该分包；被主包或多个分包引用的共享代码仍可能进入主包。以产物为准，不能按导入的函数名推断拆包结果。
- 移动组件或拆分导入后，核对组件所在包、重复次数及相关页面运行结果。

#### npm 包依赖

- [DCloud 分包依赖方案](https://ask.dcloud.net.cn/article/42418)主要把分包专用 npm JS 移出主包，降低主包体积；适用于支持该能力的 Vue 3 编译器，需在分包根目录单独声明并安装依赖，Vue 2 不适用。
- 对照根目录与分包的依赖清单、实际解析路径和构建产物。同一依赖两处安装时，公共内部代码可能重复打包；分别比较主包、分包、总包，避免只看主包变小。

#### 页面与静态资源

- 核对 `pages.json` 的主包启动页、tabBar 页、分包 `root` 与页面路径。主包页面和分包根路径都可按业务命名（如 `home/index`、`orders/`），不必以 `page`／`pages` 开头；检查配置与实际目录一致。
- 改路径时同步更新跳转 API、`<navigator>`、tabBar、分享入口；路径散落多处时，可引入 route 映射表和统一跳转 API，验证各入口。
- 检查 `static` 与分包静态目录中的废弃图片、字体、大文件及放错目录的平台专用资源；确认无引用后清理，并核对产物。分包独占的资源尽量归入对应分包，检查主包是否有引用。

### 验收与交付

重新生产构建，记录目标文件归属、重复次数以及主包、各分包和总包的变化；验证受影响页面与跳转。主包变小但总量变大也如实报告，区分本地文件字节与平台压缩包体。

修改业务或脚本代码时，在附近留下 `uni-app-package-optimization 1.0.0` 注释；发现本 Skill 旧版本痕迹则先按目标仓库规则处理。严格 JSON 不插入注释。