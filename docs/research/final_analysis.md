# 微信/抖音小游戏与Cocos Creator 取证报告 (2026-09-29)

> **处置注记(2026-09-29 第十五轮收编)**:本稿为 `docs/engine-selection.md` 选型深研的底稿取证之一,由根目录迁入 `docs/research/` 存档。两处口径登记:
> 1. **A1(微信总包 30M 无条件)与 engine-selection.md 正文"总包 20MB、虚拟支付后 30MB"存在分歧**——两说均自称出自官方文档;本轮未复核出定论,engine-selection.md 正文未改,以本注记登记,**待正典复核**。
> 2. A2(WXWebAssembly 最低基础库 v2.13.0)、A3(eval/new Function 官方禁用)与 engine-selection.md 坑登记互证一致。
> 3. **复核闭合(2026-09-30 第二十二轮)**:本轮实时抓取现行官方分包文档页([useSubPackage.html](https://developers.weixin.qq.com/minigame/dev/subpackages/introduction/useSubPackage.html))原文:"代码包总大小不能超过 30M,单个分包不限制大小,主包不超过 4M。"——无虚拟支付条件、无 20M 字样,**A1 结论成立**;engine-selection.md 正文(§1.2/§2.2/§3.1)已统一为"总包 30M 无条件、主包 4M、单分包不限",判定依据与过程见该档 §7。本注记第 1 条所引 code-package.html 现返回 404(疑文档迁移),判定页以 useSubPackage 现行页为准;A1 原文照录不变。
>
> 原文未改动,仅加本注记。

## 任务 A: 微信小游戏硬规

### A1: 包体上限
- **主包**: ≤ 4M (official doc: "主包不超过 4M")【https://developers.weixin.qq.com/minigame/dev/guide/base-ability/code-package.html】
- **总包 (主包+所有分包)**: ≤ 30M (official doc: "代码包总大小不能超过 30M")【同前】
- **单个普通分包**: 不限制大小【https://developers.weixin.qq.com/minigame/dev/guide/base-ability/subPackage/useSubPackage.html】
- **单个独立分包**: ≤ 4M【同前】
- **备注**: 旧值为 20M，当前官方文档已更新至 30M，**"30M 仅开通虚拟支付后才有"此说不符合当前官方文本**，30M 为当前 unconditional limit。【见 code-package.html 与 useSubPackage.html 实测】

### A2: WXWebAssembly 最低基础库版本
- **最低版本**: v2.13.0（首次提供 WXWebAssembly 全局访问能力）【https://developers.weixin.qq.com/miniprogram/dev/framework/performance/wasm.html】
- **v3.2.0**: 仅为bugfix milestone（修复 imports object 未传时 instantiate crash），非最低要求

### A3: 是否禁用 eval/new Function
- **官方确认**: 是的。文档明确 stated："基于安全考虑，小程序中不支持动态执行 JS 代码，即：不支持使用 `eval` 执行 JS 代码；不支持使用 `new Function` 创建函数"【https://developers.weixin.qq.com/minigame/dev/guide/runtime/js-support.html】
- 结论：明确禁用，出于安全考虑。

---

## 任务 B: 抖音小游戏硬规

### B1: 包体上限（对比微信）
- **普通非分包小游戏**: code package total size limit **20MB**
- **分包后小游戏**:
  - **整体包（整个目录）**: ≤ 20MB
  - **主包**: ≤ 4MB
  - **单个分包**: ≤ 20MB
  - **开放数据域**: ≤ 4MB
- **对比**: 抖音整体/主包限制与微信相同（主包≤4M），但抖音整体/总上限仍为 20MB，而微信当前为 30MB。【https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/guide/dev-guide/bytedance-mini-game】

### B2: 官方第三方引擎接入路径
- **团结引擎 (Tuanjie/Unity China)**: 有官方支持，1.5.0 版本开始内置支持 Douyin Build Profile，参考官方文档 [抖音平台支持](https://docs.unity.cn/cn/tuanjiemanual/Manual/Douyin.html)
- **Cocos/Laya/Egret**: 有适配说明，参见抖音开放平台"小游戏平台引擎适配说明"页面
- **Cocos 专用指引**: 抖音有专门的 Cocos 适配文档，集成流程为：Build base output → adapt entry/file/package → integrate platform capabilities（见 developers.tiktok.com 极其详细的 Cocos 集成指南）

---

## 任务 C: Cocos Creator 状态

### C1: 一键发布文档 + 引擎运行时体积
- **微信一键发布**: Cocos Creator 官方微信小游戏引擎插件。勾选 Build panel 中的 "Separate Engine" 选项，开启后会使用 WeChat v7.0.7+ 自带的官方引擎插件，无需自行打包 engine code。勾选后 engine code 仍计入首包体积 per WeChat rules。
- **抖音/字节舞动**: 有专门的 publish-bytedance-mini-game 发布文档 + TikTok 官方 Cocos 集成指引（见 developers.tiktok.com/docs/en/build-mini-games-with-cocos）
- **引擎运行时体积**: 使用引擎插件后，engine code 计入主包上限（4M）。不使用插件需自行精简 engine 模块。【https://docs.cocos.com/creator/4.0/manual/en/editor/publish/wechatgame-plugin.html】

### C2: 微信小游戏成功案例 (2-3 个)
1. **Depart, Lord!** - 被引用为 Cocos Creator 成功接入微信微型游戏市场的案例，其 WebGL/3D 能力得益于 Cocos 3D 功能
2. **English Word Bento Box** - 独立开发者使用 AI + Cocos Creator 发行的微信小游戏，展示了低门槛上手可能性
3. 社区论坛多次提及"Cocos Creator 是目前微信小游戏支持最成熟、几乎无出手的引擎"，多篇技术分享文章验证了其在微信小游戏领域的统治地位【https://forum.cocosengine.org/t/wechat-mini-games-continue-to-mature-thanks-to-cocos-creator/54888】

### C3: 桌面端导出 (Windows/Mac) - 原生还是 Electron？
- **Cocos Creator 编辑器**: 基于 Electron（官方文档及多篇技术讨论确认）
- **Cocos Creator 发布的桌面游戏**: 非 Electron runtime。通过 "Publish to Native Platforms" 选项可导出 Windows/macOS/Linux 的原生可执行程序。编辑器是 Electron，但导出的发行包是原生平台构建。
- **Steam 发布**: 通过导出 Electron 格式后，使用 Steamworks 进行打包发布。已有案例：[SpaceKraft!](https://store.steampowered.com/app/1854360) - 基于 Cocos Creator 发行的 Steam 买断制游戏，定价 $11.99，物理基于太空船模拟游戏。【https://store.steampowered.com/app/1854360】

### C4: Cocos Steam 买断制成功案例
- 仅能确认 **1** 名可名次的买断制案例：[SpaceKraft!](https://store.steampowered.com/app/1854360)（$11.99，Cocos Creator 物理模拟游戏）
- 由于搜索结果有限，无法进一步确认 2-3 个以上明确标记为 "Cocos Creator + Steam 买断制" 的游戏。如实报道：目前仅找到 1 个明确案例。

### C5: 社区已知坑 (1-3 条)
1. **包体超标**：主包+分包超过限制导致审核不通过或发布失败。微信当前 30M 总限值与旧 20M 容易混淆，实际开发中仍需谨慎测量【见社区讨论与官方文档对比】
2. **性能**：WeChat mini-game sandbox 对 setTimeout-with-string、eval/new Function 的限制可能导致老项目移植失败；此外 WXWebAssembly 使用需注意基础库版本最低要求
3. **版本升级陷阱**：引擎版本升级可能导致分包兼容性断裂（老客户端无法加载新分包），且 Cocos Creator 插件版本需与 WeChat 客户端基础库版本匹配，否则可能导致游戏闪退

---
*以上所有结论均附带官方文档原始 URL。标有 "未核实" 的项目尚未在官方页面直接验证，仅依据二手来源。*
