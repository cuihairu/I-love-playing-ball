# Godot 微信小游戏社区方案调研

> **处置注记(2026-09-29 第十五轮收编)**:本稿为 `docs/engine-selection.md`"Godot 小游戏生态"一节的底稿调研,由根目录迁入 `docs/research/` 存档。要点(AnranS/godot_for_minigame、mkdevkit/godot-minigame、godothub/godot-minigame、godots.app、Godot 官方无支持承诺)已被 engine-selection.md 吸收并互证;文中星数/活跃度为调研时点快照,会随时间失效,引用前需复核。原文未改动,仅加本注记。

## 1. AnranS/godot_for_minigame

**URL**: https://github.com/AnranS/godot_for_minigame

**提供内容**: Godot 4 导出插件，将 Godot 项目导出为 WeChat、Douyin 和 TikTok 小游戏包。

**支持 Godot 版本**: Godot **4.6.1.stable**（commit 14d19694e0c8）。插件发布版本 v0.3.0 绑定该引擎身份，另一版本的 Godot 编译器需要匹配模板包。

**Star 数**: 57 星

**最近提交**: 2026-08-03（约 1 个月前），feat: add TikTok Mini Game support

**README 列出的已知坑/限制**:
- **TikTok Native 为 beta 级别**，需要 TikTok client ≥ 43.4.0、ttmg DevTool 编译、真机发布验证才能发布
- 当前 TikTok beta 构建在存储枚举、电池读取、公共文件系统写入上 fail-closed，真机调用可能 crash/hang
- 关键值存储 get/set/remove 有效且经设备验证；TikTok HTML runtime 超出本次发行范围
- 绑定的引擎经 CI 验证仅在 exact identity（Godot 4.6.1 + Emscripten 4.0.3 + 特定模板）下有效；使用其他 Godot 编译器需要匹配模板包，自动检查无法替代平台 DevTools 与真机 final testing
- 初次使用 TikTok 需完成 `ttmg setup` / `ttmg login`，进入 export 目录后运行 `ttmg init`（使用相同 Client Key），然后 `ttmg dev`；CLI 不会自动将 `project.config.json.appid` 复制到 `~/.ttmgrc`，跳过 init 会导致 `Missing clientKey`
- Editor-native workflow：从单一 Dock 生成 PCK、组装平台文件、验证并发布；但需要自行保证版本一致性

---

## 2. mkdevkit/godot-minigame (或 mkdevkit 组织下的同名仓库)

**URL**: https://github.com/mkdevkit/godot-minigame

**适配工具**: Godot Web 导出 → 微信/抖音小游戏 适配工具。通过 `tools/adapt-minigame.js` 脚本对 Web 导出产物进行底层适配。

**支持 Godot 版本**: 说明针对 Godot **4.6.4**（pck 格式）。核心限制是**引擎版本与 pck 必须同一 patch**（如 4.6.1 vs 4.6.4 的 UID 索引不兼容，会报 `Unrecognized UID`）。必须使用同版本号的编辑器导出 pck，并用该版本的引擎模板编译 wasm。

**活跃度**: 8 星，8 个 commit（master 分支），最近一次 commit 信息未在列表中明确，但有 8 条文件记录（adapt-minigame.js、godot-sdk、wechat-templates、tiktok-templates 等）。

**README 列出的已知坑/限制**:
- 标准 Web Export 的 WASM 带 EH（异常处理），微信无法编译——`WXWebAssembly.compile` 会报 `CompileError: unexpected section <Exception>`；**必须使用无 EH / 无 SIMD 的小游戏兼容引擎**（godot.js + godot.wasm.br），用 `--engine` 传入
- 引擎与 pck 必须**同 Godot 版本（同一 patch）**，不同 patch 版本哈希不兼容
- `FileSystemManager` 不允许读取 `.pck`，**自动改名为 `engine/build.zip`**（微信/抖音均按 `.zip` 处理）
- 总包体积 ≈ 19–20MB（`build.zip` 13.5MB + `godot.wasm.br` 6.0MB + 主包 ≈ 0.4MB），逼近**未开通虚拟支付的 20MB 上限**
- **音频为尽力而为**：走微信 WebAudio，position worklet 已禁用；`Module._JS_Sound_GetPlaybackPos` / `Module.audioChannels` 是 Unity WebGL 风格桥接，**标准 Godot 不会调用**，仅作防御性 guard
- **WeChat 禁止 `eval` 和 `new Function()`**。Godot jsbb 绑定的 `CompileFunctionSource` 依赖动态编译，会报 `eval is not a function`。这是引擎 C++ 源码层问题，需自编引擎时替换为 MinigameBuilder 或预编译绑定（参考 `godot_for_minigame`）
- **Emscripten 未导出的属性会 `abort()`**。`rtenv.FS` 是 getter，访问未导出的 `FS` 会直接中止进程；loader 已改用 `mod["FS"]` 方括号安全探测
- **需要 WebGL2**（Godot 4 Compatibility 渲染器 = GLES3/WebGL2），请使用较新基础库（≥ 3.2）
- **开发者工具 `access_token expired` 等报错**属登录/游客态，与本适配无关

---

## 3. godothub/godot-minigame

**URL**: https://github.com/godothub/godot-minigame

**功能**: Face-to-face C++ 编辑器插件 + 模板分发。提供小游戏模板适配、下载、缓存、解压和导出能力。

**支持 Godot 版本**: Godot **4.4+**。

**如何分发**: 模板通过 **Release 资产分发**。插件内置版本适配规则：
- 先找当前引擎版本的精确匹配
- 找不到则选择同大版本下不高于目标版本的最新模板
- 还找不到则回退到该大版本桶里的最后一个条目
- Release 需要提供：索引 `versions.yaml` + 对应版本的 `*.tpz` 模板文件（示例：`godot4: 4.5.1: tag: 4.5.1, file: minigame4.5.1.tpz`）

**活跃度**: 186 星，36 个 commit，32 个 fork。最近提交可见于 36 commits in main。

**插件更新渠道**: 插件本体不通过模板分发流程管理，建议通过 **Godot Asset Library** 或 **仓库源码** 安装更新。

**使用流程**: 1) 将 `demo/addons/godot-minigame/` 放入 Godot 项目 `res://addons/godot-minigame/`；2) 在编辑器启用插件；3) 设置面板配置模板分发源（Source / Owner / Repo / Tag）；4) 导出时插件自动选择模板并完成下载、缓存和解压。

---

## 4. godots.app (get.godots.app)

**URL**: https://get.godots.app（已访问，内容见正文）

**是什么**: "Godot 工具箱"——一站式 Godot 开发助手。集成微信小游戏转换、TapTap 社区 SDK 以及实用 Godot 插件。

**与微信小游戏导出关系**:
- **核心功能**：一键将 Godot 项目转换为微信小游戏
- 工作流：下载工具箱 App → 安装 Godot → 安装微信开发者工具 → 在工具箱设置好相关路径 → 左上角导入项目 → 小游戏模块一键转换即可导出小游戏模板
- **仍在运营**：网站 get.godots.app 正常可访问，展示已上架的小游戏作品，提供 FAQ 与 QQ 群技术支持（官方 QQ 群: 704339128）
- 开源项目 **GDExtension 插件(4.2+)** 指向 godothub/godot-minigame

**运营状态**: 网站活跃，展示多个独立开发者的上架小游戏（如《暗影侵袭》、《迷你高尔夫球》、《🐱猫猫跳跃》、《星海渔猫》等），提供订阅机制相关 FAQ、退款政策和技术支持联系方式。

---

## 5. Godot 官方对微信小游戏支持的态度

**URL**: https://github.com/godotengine/godot-proposals/issues/10934（存档）

**官方立场**: 无明确官方计划/承诺。GitHub proposal #10934 "hope support WeChat mini-games, Douyin mini-games, QQ mini-games, and Alipay mini-games" 于 2024-10-08 创建，状态 **archived**，标签 `platform:web` / `topic:platforms`。

**关键信息**:
- 提出者希望 Godot 直接支持 WeChat/Douyin/QQ/Alipay 小游戏打包，因为 Godot 只能导出 H5 格式，不适合微信小游戏的打包格式
- 问题描述中明确："The Godot engine can only export h5 format, which is not very suitable for the packaging format of WeChat mini games"
- 并未看到 Godot 官方团队的正面回应或路线图承诺
- 红dit 另一讨论中有用户声称 "Godot being able to easily adapt and deploy mini-games on various platforms (such as WeChat Mini Games)"，但这属社区非官方表态
- Godot 文档仅涵盖 Web 导出，无微信专属支持声明
- **结论**: Godot 官方未承诺内置 WeChat 小游戏支持，社区所有解方案均为"自行适配/移植"形式

---

## 6. 方案间相互差异一句话总结

| 方案 | 关键差异 |
|------|----------|
| **AnranS/godot_for_minigame** | **支持 Godot 4.6.1.stable**，提供 Godot 编辑器插件，内置 SDK（225 方法/84 信号），WeChat/Douyin 全链路验证通过，TikTok 为 beta。 |
| **mkdevkit/godot-minigame** | **适配现有 Web 导出**，需自行提供无 EH/SIMD 引擎（godot.js + godot.wasm.br），通过 `adapt-minigame.js` 脚本改写底层文件，对 Godot 版本有严格 patch 级别要求。 |
| **godothub/godot-minigame** | **C++ 编辑器插件 + 模板分发**，Godot 4.4+，通过 Release 发布模板，版本自动匹配，插件内置导出流程，无需改动引擎源码。 |
| **godots.app** | **在线工具箱网站**（get.godots.app），提供"一键转换"体验，商业闭源，集成 godothub 插件路径，作者 citizenll。 |
| **Godot 官方** | **无官方支持**，仅有社区 proposal（issue #10934 已归档），无路线图承诺，全部解方案均为社区驱动的"自行适配"。 |
