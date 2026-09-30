# 三引擎选型深研：Godot / Cocos / Unity（Steam 先行 + 微信/抖音后行）

> 背景：平台策略 Steam 买断制先行、微信/抖音小游戏后行（降敏 F2P、变现只广告不接支付）。README 现定 Cocos，`apps/game` 尚未初始化正式引擎工程（仅 TS 骨架 + Creator 模板），处于切换零成本窗口期。本轮只做文档深研，**README 引擎口径暂不改，等用户拍板**。
> 取证方式：web 检索（GitHub README、微信开放社区、团结引擎文档、Godot 官方论坛/文档、Cocos 官方文档）。每个坑给来源链接；查不到一手来源的标注为假设/二手转述。

## 0. 结论先行（给 ikunism）

- **推荐：Cocos Creator 3.8.x（维持 README 现状）**。理由：唯一官方双端链路齐全的引擎——桌面端官方有 Windows/mac 构建（Steam 经 Electron/原生壳已有社区路径），小游戏端官方一键导出微信/抖音且引擎运行时可走微信客户端插件（不吃 4MB 主包）。本项目是 2D 章节叙事 + 篮球梗图 + 轻物理 + 无重度在线，Cocos 的能力覆盖全部需求，而它的坑是三者中唯一“有官方文档兜底”的。
- **第二选择：Godot 4.x（Steam 先行阶段可接受，小游戏阶段高成本）**。Steam 侧 Godot 完全成熟（GodotSteam、买断制爆款众多）；小游戏侧只有社区方案（见 §2），要自编无 EH/SIMD 引擎 + 钉死版本 + 踩一遍 §2.2 的坑登记表。适合“先 Steam 验证玩法、小游戏后行时再评估人力”的节奏。
- **不推荐首选：Unity/团结引擎**。Steam 侧最强但对本项目过剩；小游戏侧 wasm 体积（~30MB 未压缩/压缩后 ~6MB）与 Cocos/Godot 同级甚至更大，且要走微信转换 SDK + wasm 代码分包全套流程，团队前端偏弱时成本最高。

**什么条件下推翻这个结论**（满足任一即重议）：

1. 团队确定配一名专职引擎同学维护自编 Godot 模板（能跟进 Godot 发版钉版本、修 wasm-eh/SIMD、跟微信基础库升级）——则 Godot 可升为首选（Steam 体验 + 开源无授权顾虑）。
2. 小游戏后行被取消（只做 Steam + PC），——则 Godot 与 Cocos 打平，按团队手感二选一；Unity 仍过剩。
3. 需要 3D 高表现或主机平台（Switch/PS/Xbox）——则改选 Unity/团结引擎（Cocos/Godot 的主机链路弱）。
4. 微信/抖音要求引擎运行时插件未覆盖的新能力且 Cocos 官方链掉队——则以实测为准重比。

## 1. 三引擎双端适配矩阵

### 1.1 Steam 桌面端

| 项 | Godot | Cocos Creator | Unity（含团结引擎） |
|---|---|---|---|
| 导出形态 | 官方 PC 导出（Win/macOS/Linux）+ Steam 直接卖；GodotSteam 提供模块/GDExtension 两种集成形态（[GodotSteam org](https://github.com/GodotSteam)、[Asset Store](https://store.godotengine.org/asset/godotsteam/godotsteam-gdextension/)；注：GitHub 原仓库已于 2026-09-04 归档只读，活跃开发迁至 [Codeberg](https://codeberg.org/godotsteam/godotsteam)，3.8k★/226 fork——引用与安装以 Codeberg 为准，见 §6-1） | 官方 Windows/macOS 构建（[Cocos 3.8 Windows 构建指引](https://docs.cocos.com/creator/3.8/manual/zh/editor/publish/windows/index.html)）；上 Steam 无官方集成，走 Electron 壳 + Steamworks 插件（社区路径：[Cocos 论坛 Steam 对接经验 3.8.4](https://forum.cocos.org/t/topic/162489)、[英文论坛 Electron 上 Steam 教程](https://forum.cocosengine.org/t/tutorial-transfer-your-cocos-creator-game-to-steam/53694)） | 官方 PC 导出 + 最成熟 Steamworks 绑定：Facepunch.Steamworks（[GitHub](https://github.com/facepunch/facepunch.steamworks)、[wiki](https://wiki.facepunch.com/steamworks/)）或 Steamworks.NET；成就/工坊/Input 全覆盖 |
| Steam 集成（成就/工坊/Input） | GodotSteam 全量 Steamworks API（含成就/统计/工坊/Input），社区反馈 2 小时接通成就（[reddit 实测](https://www.reddit.com/r/godot/comments/1mo5ekk/adding_steamworks_with_godot_is_super_easy/)）；Steam 官方文档已收录 Godot（[Steamworks 文档](https://partner.steamgames.com/doc/steamhardware/steamframe/engines/godot)） | 无官方 Steam 集成；商店插件质量参差（3.8.2 对接失败案例见上）；成就要走 Electron 侧 JS 桥或自写绑定，工坊/Input 无现成方案 | Facepunch 单 DLL、无原生依赖（[NuGet](https://www.nuget.org/packages/Facepunch.Steamworks/2.0.0)；注意授权：非商业免费、商业需付费许可，[wiki](https://wiki.facepunch.com/steamworks/)）；Steamworks.NET 为 MIT 直封（[GitHub](https://github.com/rlabrecque/Steamworks.NET)）；工坊上传有现成教程（[onewheelstudio](https://onewheelstudio.com/blog/2020/12/3/steam-workshop-with-unity-and-facepunch-steamworks)）；Steam Input 标准支持 |
| 买断制成功案例 | 多（百万级）：Brotato 全平台超千万（[知乎盘点](https://zhuanlan.zhihu.com/p/2062472007040644197)）、Dome Keeper 收入 $6.1M（[Medium 2025 盘点](https://alihan98ersoy.medium.com/most-successful-games-made-with-godot-engine-revenue-sales-analysis-2025-9b69af569585)）、Buckshot Roulette 两周破百万；Steam 鉴赏家“Is it made with Godot”满 2000 评测（[Steam curator](https://store.steampowered.com/curator/41324400-Is-it-made-with-Godot/?l=tchinese&appid=1432760)） | 极少（Cocos 主战场是小游戏/手游免费制；Steam 买断制无头部案例，假设，欢迎反例） | 最多（独立买断制默认引擎，无需举证） |
| 包体 | PC 无包体上限顾虑；Godot 导出体积极小 | Electron 壳增大约数十 MB（假设，二手经验） | 无包体上限顾虑；Player 体积最大但 PC 可接受 |

### 1.2 微信/抖音小游戏端

| 项 | Godot（社区方案） | Cocos Creator（官方） | Unity/团结引擎（官方转换 SDK） |
|---|---|---|---|
| 支持性质 | **无官方支持**，纯社区（Godot 官方 proposal 仍 open：[#10934](https://github.com/godotengine/godot-proposals/issues/10934)、[discussion 10947](https://github.com/godotengine/godot-proposals/discussions/10947)） | **官方一键导出**微信/抖音（含 PC 小游戏、引擎插件、iOS 内存优化指南）：[微信](https://docs.cocos.com/creator/4.0/manual/zh/editor/publish/publish-wechatgame.html)、[抖音](https://docs.cocos.com/creator/4.0/manual/zh/editor/publish/publish-bytedance-mini-game.html)、[分包](https://docs.cocos.com/creator/3.8/manual/zh/editor/publish/subpackage.html) | **微信官方转换方案**（团结引擎及 Unity 均支持）：[适配方案总览](https://developers.weixin.qq.com/minigame/dev/guide/game-engine/unity-webgl-transform.html)、[转换 SDK 手册](https://docs.unity.cn/cn/tuanjiemanual/Manual/WechatSDK.html)、[快速开始](https://developers.weixin.qq.com/minigame/dev/guide/game-engine/unity-webgl-transform/Design/Transform.html) |
| 导出链路 | Web 导出 → 社区适配脚本改造成小游戏工程（§2 详述） | 编辑器构建面板直出，配资源服务器地址做远程化 | Unity 导出 WebGL → 微信转换插件转小游戏（assets 内 WebGLTemplates + WX-WASM-SDK） |
| 引擎运行时体积 | 兼容构建 `godot.wasm.br` **6.0MB**（[mkdevkit README 实测值](https://github.com/mkdevkit/godot-minigame)；Brotli 后；未压缩约 22MB） | **引擎运行时内置于微信客户端**（走引擎插件），不吃 4MB 主包（二手来源：[cinevva 2026 选型指南](https://app.cinevva.com/zh-CN/guides/wechat-mini-game-engines)，假设待官方文档复核） | wasm 未压缩 **~30MB**、Brotli 后 **~6MB**（[微信官方代码分包文档](https://developers.weixin.qq.com/minigame/dev/guide/game-engine/unity-webgl-transform/Design/WasmSplit.html)）；分包后首包 3–5MB、子包 7–15MB |
| 包体上限规则 | 同微信通用规则：主包 ≤4MB、**总包 ≤30M（现行官方文本，无条件，不依赖虚拟支付）**、单分包不限（[微信官方分包文档 2026-09-30 实时抓取](https://developers.weixin.qq.com/minigame/dev/subpackages/introduction/useSubPackage.html)：“代码包总大小不能超过 30M，单个分包不限制大小，主包不超过 4M”；复核过程见 §7）。历史口径“总包 ≤20MB（未开虚拟支付）/≤30MB（已开）”系二手转述（[mkdevkit](https://github.com/mkdevkit/godot-minigame)），20M 为旧值；虚拟支付能力本身见[微信官方](https://developers.weixin.qq.com/minigame/introduction/commercialization/virtual-payment/guide.html)；知乎实战（[链接](https://zhuanlan.zhihu.com/p/2078517342133281890)）提示的“20MB 包内加载阈值 vs 30MB 总包上限不要混淆”仍作二手提示保留——首屏可玩内容仍按 ≤20MB 加载阈值设计更稳 | 同左；Cocos 官方文档口径：主包 4MB、超限配资源服务器（[Cocos 微信发布](https://docs.cocos.com/creator/4.0/manual/zh/editor/publish/publish-wechatgame.html)）；抖音：整体 ≤20MB、主包 ≤4MB（[Cocos 分包](https://docs.cocos.com/creator/3.8/manual/zh/editor/publish/subpackage.html)）；注意抖音侧与微信还有一个差异——微信单分包不限大小，抖音单分包上限存在 **4MB**（[Cocos 2.4 分包文档](https://docs.cocos.com/creator/2.4/manual/zh/publish/subpackage.html)、[抖音分包介绍](https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/framework/subpackages/introduction)）与 **20MB** 两种记载（检索快照互相矛盾），架构上按“单分包 ≤4MB”保守设计可同时满足两平台，提审前以开发者工具实测为准（见 §6-4） | 同左；Unity 场景下官方建议代码分包 + AssetBundle/Addressable 按需加载（[分包工具](https://developers.weixin.qq.com/minigame/dev/guide/game-engine/unity-webgl-transform/Design/WasmSplit.html)、[资源部署](https://developers.weixin.qq.com/minigame/dev/guide/game-engine/unity-webgl-transform/Design/DataCDN.html)） |
| 本项目相关度 | 后行降敏版若走 Godot：引擎 6MB + pck 13.5MB（示例值）≈ 19–20MB，占现行 30M 无条件上限约 2/3、不越线；但若按二手“20MB 首屏加载阈值”口径设计则仍顶格，pck 走 CDN 仍是推荐解；原“开虚拟支付提上限”解法随总包口径复核为 30M 无条件而不再必要（§7） | 引擎不吃包体，包体压力最小，最契合“梗图多、包体敏感” | 体积压力最大，优化流程最重 |

## 2. Godot 小游戏方案细研（重点）

### 2.1 社区方案盘点

| 方案 | 形态 | 活跃度（截至 2026-09-29 取证） | 差异/定位 |
|---|---|---|---|
| [AnranS/godot_for_minigame](https://github.com/AnranS/godot_for_minigame) | 编辑器导出插件 + 模板 + GDScript MiniGameSDK（225 方法/84 信号）+ 网站/API 文档 | Star 57 / Fork 16 / Issue 3；v0.3.0，钉 Godot **4.6.1** + Emscripten 4.0.3，CI 导出测试；微信/抖音全量、TikTok Native beta | 最完整的工作流（编辑器内 Dock、一事务导出、版本身份门）；TikTok 额外支持 |
| [mkdevkit/godot-minigame](https://github.com/mkdevkit/godot-minigame) | 适配脚本 `adapt-minigame.js`（Web 导出就地改造）+ 自编引擎补丁说明 + 跨平台 SDK（C++/GDScript/GodotJS 三形态）+ Tauri 打包器 | Star 8 / Fork 1 / 8 commits；钉 Godot **4.6.4**（pck），复用 AnranS 的 adapter/fetch（MIT） | 文档即“坑登记表”本体（§2.2 多数坑的一手来源）；抖音 game.json 差异（subPackages 驼峰/workers 字符串）有明确记载 |
| [godothub/godot-minigame](https://github.com/godothub/godot-minigame) | C++ 编辑器插件（模板下载/缓存/解压/导出）+ Release 模板分发（versions.yaml + .tpz）+ skills/ 给 AI 移植用 | Star 186 / Fork 32 / 36 commits；面向 4.4+，模板按版本精确匹配、同大版本就低兼容 | 定位是“模板分发器”而非全栈适配；**仅微信**（全篇未涉抖音）；与 godothub 启动器生态同源（[GodotHub org](https://github.com/godothub)） |
| [godots.app 工具箱](https://www.bilibili.com/video/BV1RBqxYYEny/) | 桌面 GUI 导出工具（即「Godot 工具箱」，get.godots.app） | 二手渠道称已适配 Godot 3.6 与 4.4（[teamtime.cc 2026-07 六平台分析](https://www.teamtime.cc)、贴吧官方公告转述）；仓库未公开，**维护状态需试用验证** | 有条件再评估；本轮不纳入推荐链（见 §6-3） |

另：抖音官方已宣布支持 Godot（4.5）并给出接入指南（[indienova 转述](https://indienova.com/groups/post/103403)），但一手文档链接待补，暂列观察项。已有独立开发者用社区链上线微信小游戏（《潜艇进击》，[V2EX 分享](https://v2ex.com/t/1187822)）——证明链路可走通，但个案不等于规模化验证（见 §6-5）。

### 2.2 已知坑全录（影响面 / 规避 / 是否阻塞）

| # | 坑 | 影响面 | 规避方式 | 是否阻塞上线 | 来源 |
|---|---|---|---|---|---|
| G1 | 标准 Web 导出 wasm 带 EH（Exception 段），`WXWebAssembly.compile` 报 `CompileError: unexpected section <Exception>`，模拟器默认也拒 | 致命：包跑不起来 | 自编无 EH/SIMD 兼容引擎：`platform/web/detect.py` 两处 wasm→emscripten（SUPPORT_LONGJMP），scons 按 §2.3 配置编译 | **是** | [mkdevkit §二-1/§八](https://github.com/mkdevkit/godot-minigame) |
| G2 | 引擎与 pck 必须**同 patch 版本**（UID 索引哈希不兼容，如 4.6.1 vs 4.6.4 报 Unrecognized UID） | 版本错配即黑屏/报错 | 引擎模板与导出编辑器同版本；AnranS 用“exact template identity”门 + CI 校验；godothub 插件自动匹配模板 | **是** | [mkdevkit §二-2](https://github.com/mkdevkit/godot-minigame)、[AnranS 架构](https://github.com/AnranS/godot_for_minigame/blob/main/docs/ARCHITECTURE.md)；UID 机制背景 [Godot 官方 4.4 UID](https://godotengine.org/article/uid-changes-coming-to-godot-4-4/) |
| G3 | 微信 FileSystemManager 不读 `.pck`，须改 `.zip` | 资源加载失败 | 导出改名 `engine/build.zip`（各方案已自动做） | 否（方案内建） | [mkdevkit §一/§二-3](https://github.com/mkdevkit/godot-minigame)；微信 [unzip 文档](https://developers.weixin.qq.com/minigame/dev/api/file/FileSystemManager.unzip.html) |
| G4 | 总包 ≈19–20MB（示例：zip 13.5MB + wasm.br 6.0MB + 主包 0.4MB）；现行官方总上限 30M 无条件（§7），约占 2/3 不越线，但按二手“20MB 首屏加载阈值”口径设计仍顶格 | 包越大越接近拒收，首屏加载越慢 | pck 改 CDN 下载落地读（原“开虚拟支付提至 30MB”解法随总包上限复核为无条件而不再必要；本项目本就不接支付） | **需关注**（原“接近阻塞”，2026-09-30 第二十二轮随上限口径复核降级） | [mkdevkit §二-4](https://github.com/mkdevkit/godot-minigame)、上限口径见本档 §7 |
| G5 | 主包 4MB | 主包超限提审失败 | 引擎/pck 进分包、主包只留 loader；`packOptions.ignore` 排除源导出与 tools（mkdevkit 已做） | 否（有解） | [Cocos 微信发布（通用规则）](https://docs.cocos.com/creator/4.0/manual/zh/editor/publish/publish-wechatgame.html) |
| G6 | iOS 低端机 wasm 编译 8–12s 冷启动（任务书给定值；本轮未找到一手基准，**假设待实测**） | 首启流失 | 首包瘦身 + 加载画面/启动剧情 + 预下载；Unity 侧同理（官方[启动优化](https://developers.weixin.qq.com/minigame/dev/guide/game-engine/unity-webgl-transform/Design/StartupOptimization.html)） | 否（体验级） | 任务书给定；类比来源 Unity 官方启动优化 |
| G7 | 微信禁 `eval`/`new Function`；Godot jsbb `CompileFunctionSource` 报 `eval is not a function`；GodotJS 需把 quickjs-ng/v8 编进 wasm | 动态脚本能力不可用 | 自编引擎 `javascript_eval=no`，GodotJS 走 `use_quickjs_ng=yes`（mkdevkit 给出 scons 行） | 条件阻塞（不用 GodotJS 则无关） | [mkdevkit §二-8/§八](https://github.com/mkdevkit/godot-minigame) |
| G8 | 官方 Web 模板真机 CompileError（EH/SIMD/线程头等综合症状） | 真机黑屏 | 只用验证过的兼容模板 + DevTools + 真机双验（AnranS：自动化检查≠替代真机测试） | 是（须过真机） | [mkdevkit §二-1](https://github.com/mkdevkit/godot-minigame)；Web 通用坑背景 [Godot 论坛 SIMD](https://forum.godotengine.org/t/wasm-simd-unsupported-error-in-console-when-running-godot-4-5-1-html5-export/129575)、[allbyte wasm gotchas](https://allbyte.studio/devlog/wasm-gotchas-and-web-export/) |
| G9 | `workers.path` 必须存在（game.json 多线程 worker 配置缺失/路径错即起不来） | 启动失败 | 按模板 game.json 配 workers（微信对象形态/抖音字符串形态注意区分） | 否（配置级） | 任务书给定 + [mkdevkit 输出结构/game.json](https://github.com/mkdevkit/godot-minigame)；微信 [Worker 文档](https://developers.weixin.qq.com/minigame/dev/guide/base-ability/workers.html) |
| G10 | 基础库 ≥3.2（WebGL2/GLES3 要求） | 低版本客户端黑屏 | 勾高基础库 + 低版本兼容提示（微信[低版本兼容](https://developers.weixin.qq.com/minigame/dev/guide/runtime/client-lib/compatibility.html)） | 否 | [mkdevkit §二-6](https://github.com/mkdevkit/godot-minigame) |
| G11 | 引擎版本钉死的升级代价（Godot 一升版就要重编模板+重验全链；AnranS 把模板视为不可拆分版本包） | 长期维护成本 | 钉死版本 + 升级走“模板包”流程；godothub 的 versions.yaml 机制即为此设计 | 否（成本级） | [AnranS ARCHITECTURE](https://github.com/AnranS/godot_for_minigame/blob/main/docs/ARCHITECTURE.md)、[godothub 模板分发约定](https://github.com/godothub/godot-minigame) |
| G12 | IndexedDB 不可用，存档要走 wxFS 映射（/userfs ↔ USER_DATA_PATH）+ 定时/切后台刷盘 | 存档丢失风险 | 用方案内建 wxfs-adapter（还原/刷盘/onHide 兜底） | 否（方案内建） | [mkdevkit §一/§五](https://github.com/mkdevkit/godot-minigame) |
| G13 | Emscripten 未导出属性访问即 abort（如 `rtenv.FS` getter）；音频 position worklet 需兼容层 | 偶发崩溃/无声 | loader 方括号安全探测 + audio-compat 桥（方案内建） | 否 | [mkdevkit §二-5/§二-9](https://github.com/mkdevkit/godot-minigame) |

### 2.3 自编兼容引擎基线（摘自 mkdevkit §八，原样转述，未亲测）

```text
# detect.py：两处 'wasm' 改 'emscripten'（SUPPORT_LONGJMP）
scons platform=web target=template_release optimize=size_extra lto=full \
  disable_3d=yes disable_advanced_gui=yes module_mono_enabled=no \
  module_xr_enabled=no module_webxr_enabled=no module_multiplayer_enabled=no \
  module_text_server_adv_enabled=no module_text_server_fb_enabled=yes \
  module_bmp_enabled=no module_dds_enabled=no module_hdr_enabled=no \
  module_ktx_enabled=no module_tga_enabled=no disable_audio_speech=yes \
  module_spine_godot_enabled=yes threads=no javascript_eval=no use_quickjs_ng=yes
```

注意：`disable_3d=yes` 等裁剪项与本项目 2D 需求吻合，但正式采用前须以实测包体/功能回归为准。

## 3. Cocos 与 Unity 小游戏侧对照坑位

### 3.1 Cocos 官方链已知问题

- **包体**：主包 4MB/总包 30M（现行无条件上限，§7）同受；解法官方化（分包 + 资源服务器远程化），文档齐（[分包](https://docs.cocos.com/creator/3.8/manual/zh/editor/publish/subpackage.html)、[微信发布](https://docs.cocos.com/creator/4.0/manual/zh/editor/publish/publish-wechatgame.html)）。本项目梗图多，远程化是必选项而非可选项。
- **性能**：iOS 内存与性能有官方优化指南（[微信 iOS 优化](https://docs.cocos.com/creator/3.8/manual/zh/editor/publish/wechat-ios-optimize.html)、[抖音 iOS 优化](https://docs.cocos.com/creator/3.8/manual/zh/editor/publish/bytedance-ios-optimize.html)）。
- **引擎钉版**：Creator 大版本（3.8 LTS）内升级成本低于 Godot 自编模板，但 2.x→3.x/4.x 仍是 breaking 级；锁定 3.8.x LTS。
- **桌面/Steam**：官方只有 Win/mac 构建，无 Steamworks 集成（见 §1.1），Steam 侧是 Cocos 唯一短板。

### 3.2 Unity/团结引擎小游戏实战坑

- **wasm 体积**：~30MB 未压缩/~6MB Brotli（[微信官方](https://developers.weixin.qq.com/minigame/dev/guide/game-engine/unity-webgl-transform/Design/WasmSplit.html)），与 Godot 兼容构建同级，优化起点更差。
- **真机兼容/内存**：iOS 高性能模式是必修（子包不加载、按函数粒度按需加载，省 200–300MB 内存：同上文档）；另有 iOS 优化、压缩纹理、渲染优化全套（[性能总览](https://developers.weixin.qq.com/minigame/dev/guide/game-engine/unity-webgl-transform/Design/PerfOptimization.html)）。
- **瘦身手段**：代码分包（PGO：真机收集→首包/子包拆分，首包函数占比 25–50% 为常态）+ AssetBundle/Addressable/AutoStreaming 按需加载 + 启动封面/剧情（[分包工具](https://developers.weixin.qq.com/minigame/dev/guide/game-engine/unity-webgl-transform/Design/WasmSplit.html)、[资源部署](https://developers.weixin.qq.com/minigame/dev/guide/game-engine/unity-webgl-transform/Design/DataCDN.html)）。
- **托管稳定性信号**：社区/官方转换工具的主仓库 `wechat-miniprogram/minigame-unity-webgl-transform` 已被 GitHub Staff 因商标政策禁用（2026-09-29 实查：页面显示 "disabled by GitHub Staff due to a violation of GitHub's Trademark Policy"）；转换文档本体仍在[微信官方文档站](https://developers.weixin.qq.com/minigame/dev/guide/game-engine/unity-webgl-transform.html)且持续更新，团结引擎内置导出为官方主推通道——但“开源工具链托管一夜失效”本身是 Unity 路线的第三方依赖风险样本（见 §6-2）。
- **结论**：Unity 小游戏是“官方重器、流程最重”，适合团队有 Unity 产能时选用；本项目不匹配。

## 4. 迁移影响面（若从 Cocos 切换）

### 4.1 monorepo 耦合点

- `apps/game`：当前仅 TS 骨架（bootstrap/services/demo）+ `assets/scripts/*` 模板 + `creator-templates/` 真实组件壳，**无正式引擎工程**（[apps/game/README](apps/game/README.md)），切换零成本。`package.json` 无引擎依赖（仅 workspace 包 + vitest/tsx）。
- `packages/game-config`：纯数值/文案/关卡配置（gameplay-v2.ts 等），**引擎无关**，切换不受影响。
- `packages/platform-sdk`：当前是 `MemoryPlatformSdk` 纯接口（login/广告/share/storage），**引擎无关**——但注意它屏蔽的是微信/抖音 JS API 差异；若选 Godot，需在 Godot 侧另接 MiniGameSDK（AnranS 225 方法 / mkdevkit 三形态 SDK），本包作为 TS 侧契约保留，新增 Godot 桥接映射层。
- `apps/backend`（Go 网关 + shield 规划）：与引擎选择无关（只经 HTTPS/WSS 契约）。
- 若选 Godot：新增 `apps/game` Godot 工程 + 自编模板构建说明 + 导出事务文档；`tools/art` 管线不变（出图与引擎无关）。

### 4.2 docs/*.md 处置建议（切换时执行，本轮不动）

| 文档 | 现状 | 处置 |
|---|---|---|
| `cocos-project-plan.md`、`cocos-component-mapping.md`、`cocos-field-checklist.md` | Cocos 专属（工程结构/组件映射/字段清单） | 切换则归档为 `docs/archive/cocos-*` 并在头部加“已废止”横幅；保留是因为 apps/game 模板曾参照它们 |
| `creator-component-shells.md`、`creator-integration-playbook.md`、`creator-file-map.md` | Creator 真实组件壳/接入手册/落位图 | 同上归档；若 Godot 则新建 `godot-project-plan.md` + `godot-minigame-pipeline.md`（模板版本/导出事务/真机验收单）替代 |
| `gameplay-node-binding.md`、`gameplay-feedback-hooks.md`、`home-result-hooks.md` | 节点绑定/反馈钩子（Cocos 语境写就，但语义多为引擎无关） | 改写为引擎无关版（保留钩子语义，删 Cocos 节点表述）或按目标引擎重写 |
| `architecture.md`、`apps/game/README.md`、`README.md` | 含“Cocos Creator”推荐表述 | 用户拍板后统一改（本轮不动） |
| `gameplay-v3.md`、`story.md`、`levels.md` | 纯设计，与引擎无关 | 不动 |

## 5. 取证缺口与假设清单

1. Cocos“引擎运行时内置微信客户端不吃主包”采自二手选型指南，待 Cocos/微信官方文档复核（已知有[微信游戏引擎插件](https://developers.weixin.qq.com/minigame/dev/guide/base-ability/game-engine-plugin.html)机制，方向可信）。
2. G6（iOS 低端 wasm 编译 8–12s）为任务书给定，本轮未找到一手基准，须真机实测。
3. Cocos Steam Electron 壳体积“数十 MB”为二手经验假设。
4. Godot Steam 买断案例数为公开报道转述，非 Steamworks 后台统计。
5. 抖音 Godot 官方支持（4.5）仅见[indienova 转述](https://indienova.com/groups/post/103403)，一手文档链接待补。
6. 本文档 Star/Fork/版本号为 2026-09-29 取证快照，决策前建议重验（社区方案迭代快）。
**第二批(2026-09-29)独立取证新增事实**(并入§6复核记录，见下):
7. 微信主包上限实测：官方文档当前明确**30M 为无条件上限**（非“仅开通虚拟支付后”），旧值20M系历史遗留，详见 `final_analysis.md` A1。——2026-09-30 第二十二轮正典复核维持此结论并已统一正文（§1.2 包体上限规则与本项目相关度、§2.2 G4、§3.1），过程见本档 §7。
8. 微信 WXWebAssembly 最低基础库：v2.13.0 为首次提供 WXWebAssembly 访问能力（非最低运行要求），v3.2.0 仅为 bugfix milestone，详见 `final_analysis.md` A2。
9. 微信 eval/new Function 明确禁用：官方文档确认“出于安全考虑，不支持动态执行 JS 代码”，详见 `final_analysis.md` A3。
10. 抖音包体上限：整体/总上限 20MB，主包≤4MB，单分包≤20MB，与微信现行 30M 总上限存在差异，详见 `final_analysis.md` B1。
11. 抖音官方转换工具链风险：`wechat-miniprogram/minigame-unity-webgl-transform` 被 GitHub Staff 因商标政策禁用（2026-09-29 实查），官方文档仍在微信文档站，已并入 engine-selection §3.2。
12. Cocos Steam 买断制确认案例：`SpaceKraft!` 为唯一明确标记 Cocos Creator + Steam 买断制案例（$11.99，物理模拟游戏），社区多次提及但明确案例仅 1 个，详见 `final_analysis.md` C4/C5。

## 6. 复核记录（2026-09-29 第二批独立取证，同日并行会话）

并行会话先行落地本文档（commit 985fc37）后，另一会话按同一任务书独立重跑了一遍 web 取证（GitHub README 逐仓实抓、微信/抖音/Cocos 官方文档、GodotSteam 官网）。**复核结论：§0 推荐不动摇；§1–§4 事实经独立来源互证成立**（AnranS 锁 4.6.1/Emscripten 4.0.3/MiniGameSDK 225 方法 84 信号、mkdevkit 坑清单与 19–20MB 总包、godothub 186★ 版本回退匹配、微信官方 wasm“未压缩 ~30MB/压缩 ~6MB/分包后首包 3–5MB、子包 7–15MB”均复现）。以下 6 条为第二批新增事实，已就地并入正文：

1. **GodotSteam 迁移**：GitHub 原仓库（Gramps/GodotSteam）2026-09-04 起归档只读，活跃开发迁至 Codeberg（[codeberg.org/godotsteam/godotsteam](https://codeberg.org/godotsteam/godotsteam)，3.8k★/226 fork）；官网确认模块/GDExtension/GDNative 三形态与全功能文档（成就/云存档/工坊/网络/Input/DLC/富状态），其赞助方含 Trampoline Tales（Vampire Survivors）与 Purple Moss Collectors（Dome Keeper）——买断制头部厂商背书（[godotsteam.com](https://godotsteam.com)）。已并入 §1.1。
2. **Unity 转换工具托管失效**：`wechat-miniprogram/minigame-unity-webgl-transform` 仓库被 GitHub Staff 因商标政策禁用（2026-09-29 实查页面原文）；官方文档仍在微信文档站。已并入 §3.2。
3. **godots.app 身份确认**：即「Godot 工具箱」（get.godots.app），二手渠道称已适配 Godot 3.6 与 4.4（[teamtime.cc 2026-07](https://www.teamtime.cc)、贴吧公告转述）；仓库仍未公开。已更新 §2.1。
4. **抖音单分包口径分歧**：微信单分包不限大小；抖音单分包存在 4MB（[Cocos 2.4 分包文档](https://docs.cocos.com/creator/2.4/manual/zh/publish/subpackage.html)）与 20MB 两种互相矛盾的检索记载，官方文档页为 JS 渲染未能直读正文。保守结论：分包架构按单分包 ≤4MB 设计可同时覆盖两平台。已并入 §1.2。
5. **Godot 小游戏已上线个案**：《潜艇进击》经社区链上线微信小游戏（[V2EX](https://v2ex.com/t/1187822)）；另第三方分析转述 Godot 官方对微信适配的态度为“需腾讯出资才做”（[teamtime.cc](https://www.teamtime.cc)，二手）。
6. **Steamworks 绑定授权差异**：Facepunch.Steamworks 非商业免费、商业需付费许可（[wiki.facepunch.com](https://wiki.facepunch.com/steamworks/)）；Steamworks.NET 为 MIT（[GitHub](https://github.com/rlabrecque/Steamworks.NET)）。选型成本维度已并入 §1.1。

范围：本轮仅动本文档（含上述 6 处就地补强与本节）；README 引擎口径仍不动，等用户拍板；根目录遗留的未跟踪笔记 `godot_minigame_solutions.md` 属并行会话工作产物，不处置。

## 7. 口径核对记录（2026-09-30 第二十二轮：微信总包 20M/30M 正典复核统一）

轮次号占号前已全仓 grep 确认空闲（第二十一轮=终章 8-1/8-2 销账轮）。本轮销 `docs/story.md` §19.5 第三条遗留（也是该清单最后一条）。

### 7.1 判定依据（正典复核，2026-09-30 实时取证）

- **一手来源**：微信官方分包文档现行页（[useSubPackage.html](https://developers.weixin.qq.com/minigame/dev/subpackages/introduction/useSubPackage.html)，2026-09-30 WebFetch 实抓）原文：**“代码包总大小不能超过 30M，单个分包不限制大小，主包不超过 4M。”**——全文无 20M 字样、无虚拟支付条件。
- **互证**：`docs/research/final_analysis.md` A1（收编时实抓，引文同上）与本文档 §5-7（第二批复核已实测）三点一致；“总包 ≤20MB（未开虚拟支付）/≤30MB（已开）”仅见于 mkdevkit 等二手转述，与现行官方文本不符，判为**历史口径的过时转述**（20M 为旧值）。
- **判定**：统一为「总包 30M 无条件、主包 4M、单分包不限」；“开虚拟支付提上限”不再构成有效解法（本项目本不接支付）。
- **注**：原 A1 所引 code-package.html 现返回 404（疑文档迁移），判定引文以现行 useSubPackage 页为准；“20MB 首屏加载阈值”为知乎实战二手提示，无官方一手佐证，仅作设计保守值保留、不升格为事实。

### 7.2 本轮改动（engine-selection.md 正文四处统一 + 两处指针）

| 落点 | 旧口径 | 新口径 |
| --- | --- | --- |
| §1.2 包体上限规则（Godot 列） | 总包 ≤20MB（未开虚拟支付）/≤30MB（已开），引 mkdevkit 转述 | 总包 ≤30M 无条件、单分包不限，引官方现行页；旧口径降为历史注记 |
| §1.2 本项目相关度（Godot 列） | ≈19–20MB 逼近 20MB 上限，大概率要开虚拟支付 | ≈19–20MB 占 30M 上限约 2/3 不越线；按二手 20MB 首屏阈值设计仍顶格，pck CDN 仍推荐；虚拟支付解法取消 |
| §2.2 G4 | 逼近 20MB 上限；解法含开虚拟支付提至 30MB；评级**接近阻塞** | 占 30M 约 2/3；解法仅留 pck CDN；评级降为**需关注**（降级缘由随行注明） |
| §3.1 Cocos 包体 | 主包 4MB/总包 20MB 同受 | 主包 4MB/总包 30M（现行无条件上限）同受 |
| §5-7 指针 | — | 加“第二十二轮已统一正文，过程见 §7” |

结论影响面：G4 风险降级不改变 §0 推荐序（Cocos 引擎插件本就不吃包体，Godot 的 wasm 体积劣势判断不变）；抖音口径（整体 20MB）与微信差异照旧，§1.2 抖音列未动。

### 7.3 相关文档同步

- `docs/research/final_analysis.md`：处置注记新增第 3 条（复核闭合，A1 结论维持，判定页改记现行 URL）。
- `docs/story.md`：§19.1 分歧登记行加复核闭合注；§19.5 第三条遗留加后记销账（三条遗留至此全部闭合）。
- `docs/levels.md` §23.6 遗留行首项（同一事项的关卡侧登记）：**该文件本轮有他方在途改动（§2 无障碍行改写），按并行会话协议不互染，销注留待该文件空闲轮顺带补一行**。
- 根目录 `story.md`、两份 `levels.md`、`gameplay-v3.md`：全文无 20M/30M 包体口径出现（grep 复核），零改动。

### 7.4 假设与遗留（非交互）

- “20M 为官方历史值”仅由二手转述与收编稿备注支撑，未回溯到官方存档页佐证——表述定为“历史口径/旧值”，不断言具体更替时间。
- 遗留：README 引擎口径仍待用户拍板（原样保持）；抖音单分包 4MB/20MB 分歧维持保守设计口径（§6-4 原样）。
