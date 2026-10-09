========================================
    仙路长青 - 项目完整结构说明 v27.23
========================================

【零、工程基线速查（v27.23 · 2026-10-09 更新）】
========================================

本节是**唯一入口基线**。下列数字全部由实测得出，改代码后请连带更新本节。

> **2026-10-05 v27.12 补记**：货币总闸批新增 `js/core/world-ledger.js`（378 行），`仙侠.html` 与 `scripts.manifest.json` 同步登记——manifest **350 → 352 script**（25 条层注释不变），挂载口径 352 保持（354 本 − 2 刻意不挂载）。`core/` 目录 33 → **34** 本。文档头自本批起由 v26.2 顺延为 v27.12（版本记录已补至 v27.11，见该文档「文档补账批」；此前「版本号口径存疑」一条就此销账）。
> **2026-10-07 v27.13 补记（断档补写）**：全模块过堂修复批（五天 18 项 + 同批续刀：部位族/器谱/物品登记/塑灵根丹 B 案）——新增三件：`js/battle/beast-part-family.js`（668 行，`battle/` 目录首件：兽形部位族十五格伤势册）、`js/core/population-ledger.js`（418 行，23 城人口户账）、根 `app-city-bureaus.js`（城署）。manifest **352 → 356 script**（358 本 − 2 刻意不挂载，口径不变）；根 44 → 45、core 34 → 35、`battle/` 0 → 1。存档新键：`itemProvenance`（v1）/`rootBodyMemory`（v1）/`populationLedger`/`npcLifeActions`（v1→2，NPC 私账 purse）——全走 StateRegistry 加键不升版先例。详见版本记录 v27.13「同批续刀」段。
> **2026-10-07 v27.14 补记**：总档待办第一批（3 刀）——**零新文件**，改三件：`js/crafting/alchemy-compound.js`（药性暗账 getProps 三层+稳定哈希真账+herbLore 册 StateRegistry 加键 v1）、`js/crafting/compound-ui.js`（品相播报炉火纹路+候选行药性标注）、`js/enhanced-shop.js`（quoteSell 单次饱和层+saturation 字段+报价明细行）。存档新键：`herbLore`（v1，学过的表外药材）。文件数/挂载数/目录计数全部不变（358/356）。待办账与争议七案见《交接-总档待办与争议册.md》。
> **2026-10-08 v27.15 补记**：总档待办第二批（小刀族四件）——**零新文件**，改六件：`js/battle.js`（护崽判定+遁走否决+狂怒包装+卷刃计数折伤）、`js/map/randomMap.js`（WildEcology 窝账 isGrudged/noteGrudge+wildMap 存档加 grudge 字段）、`js/app.js`（onEnd 护崽记仇+卷刃落账+装备面板卷刃标/磨刃钮+honeDulledEdge）、`js/location-system.js`（enterCity 第五钩·耳语）、`js/core/world-ledger.js`（heardOf 耳语暗账+noteHeardOf/heardOfIn+import 补键）、`js/grand-legacy.js`（回响掷+echoPending 存档三处+对质第六钩 echoChoose）。存档新键：wildMap.grudge（老键加字段）、worldLedger.heardOf（老键加字段）、grandLegacy.echoPending/echoNextDay（老键加字段）——**三处全走加键不升版先例，零新顶层键**。文件数/挂载数/目录计数全部不变（358/356）。待办账与争议七案见《交接-总档待办与争议册.md》。
> **2026-10-08 v27.19 补记**：部位族构装+亡灵两册+机关臂（模块②收全）——**新文件 1 件**：`js/battle/construct-undead-family.js`（303 行：构装六格[躯壳/枢座停机窗6轮/双关节/双悬臂]+亡灵六骨格+弱点系数[壳钝×1.3斩×0.7·节斩×1.3·骨钝×1.2火×1.3]+伤册+功能减档，兽形族同款范式）——**script 挂载 356→357、文件计数 +1**（TA 本地 manifest gen+check 复验：BUILD-MANIFEST 加行）。改四件：`js/battle.js`（takeDamage 路由+弱点乘+记册+getAttack 减档+回合边界停机窗）、`js/items-extended/02-weapons.js`（机关臂模板 wpn_mechanism_arm：攻16/命中-5/钝伤）、`js/crafting.js`（机关臂配方：机关件×4+精铁×5/锻造25）、`js/loot-system.js`（构装解剖 common 池补 special_mechanism 权重30）。生死口径刻意保守：判死池一字不动（构装/亡灵无四笔裁决就不发明窗口死）。
> **2026-10-09 v27.25 补记**：消息账统一（⑬改良-2）——**零新文件**，改三件：`js/core/world-ledger.js`（noteRumor 升总闸：+carrier 四枚举 商旅/海捕文书/告示/人腿，缺省商旅；rumorPend 在途账成四路消息通用件，knownRumors 带 carrier 分层）、`js/city-facilities/case-system.js`（人犯单张榜挂海捕文书腿：noteRumor('bounty',…,r.city,'海捕文书')）、`js/extensions/market-dynamic.js`（行情异动挂商旅腿：applyWorldEvent 即 noteRumor('price',…,cities[0],'商旅')——价本城立变、风声随商旅到外城）。世界事件/传闻两路本就有腿不动。
  > **2026-10-09 v27.24 补记**：世界年表（⑬新增-1）——**零新文件**，改七件接线四路大事入 `WorldLedger.annals` 一本史册：`js/core/world-ledger.js`（annals 账既有，四路写点：noteFameChange/noteNotorietyChange 成名恶名双写；修 grand-legacy noteAnnal→recordAnnal 死引用 2 处）、`js/dynasty-court.js`（chron 朝堂史笔双写 'court'）、`js/sects/sect-war.js`（addHistory 包层宗门大事双写 'sect'）、`js/world-events.js`（过期盖棺入册 'world:*ID'）、`js/city-facilities/tea-storyteller.js`（今日新闻口 pickNews/listenNews ≤7 日账）、`js/extensions/codex-tutorial.js`（史官读口 world ledger 年表按年分组+亲历大事记同屏）。
  > **2026-10-09 v27.23 补记**：sol（GPT6.1）回流一刀收刀（js/core/auto-save.js·两行）：tickAutoSaveDay 旧序「先记 _lastAutoDay 后存」→写失败时当天标记照立、后续 tick 全跳过当天不再重试（7 天定期档静默丢一轮）；修成 `if (doAutoSave('day')) _lastAutoDay = day`（读返回值才记·与 v27.21 双成才 true 口径同款）。三方 diff 验基线干净（仅此一处代码差异）。实测：注入 QuotaExceeded 失败返回 false✓、重试真在跑✓、恢复后成功才标记✓。**顺带实锤配额风险**：测试环境 localStorage 4465KB（单格自动档 1116KB——5 格满=5.6MB 必爆 5MB 上限），存档省空间应立项。
> **2026-10-08 v27.22 补记**：存档机制三改（TA 点单·快照史心智）——**零新文件**，改 app.js 一件：saveGame 手动模式删"按角色名自动覆盖同槽"改**每次存入新档位**（超 10 滚最旧+如实播报+成功话带档位号）；refreshSaveSlots 槽行四钮（载入/覆盖/删除/导出）；新增 overwriteSaveSlot(i)[当前进度写进指定格·confirm 过闸·其他快照不动]与 deleteSaveSlot(i)[只删这一格·其他档主档自动档全不动·写盘失败如实报]。实测：连存两次=2 档✓（旧版同名覆盖只 1 档）、同角色两档✓、单删 2→1✓、UI 含两新钮✓。v27.21 的 A/B/C 存档架构争议随本批消解（多份快照=特性，10 格上限兜空间）。
> **2026-10-08 v27.21 补记**：sol（GPT6.1）两报告七修——**零新文件**，改四件：`js/global-utils.js`（存盘提示去 Markdown 星号+按 e.name 分流配额满/存储禁用两类）、`js/app.js`（deleteSave 补删 xianxia_auto_saves+xianxia_saves_corrupt_backup 两键[P1 直接诱因]+talkToNPC 闲聊疲劳账 talkFatigue[正向好感 ×(1-疲劳×0.1) 封底 0.3·隔日自清·厌烦驱动非次数帽]）、`js/core/auto-save.js`（_saveSlots 返回布尔+doAutoSave 主档槽位双成才成功[时间戳不假走]）、`js/npcs/npc-emotions.js`（冷却存在性哨兵 -1e9+>=0[新局 0 时刻不再绕冷却]+删每日 3 次硬限[判例「厌烦不限额」对齐]）。**存档架构案留 TA 裁**（A 槽位摘要单份真源/B 减份数 5→2+10→8/C 不动——倾向 B）。
> **2026-10-08 v27.20 补记**：争议七案裁决落地（①⑤⑥三刀+②④销账+③零动+⑦随①收官）——**零新文件**，改两件：`js/battle.js`（HUMANOID_VITAL_WINDOWS 人形敌气绝窗表[头4/脑2/胸12/颈3 对齐兽形四笔]+takeDamage/checkDeath 两道口同步窗内不即死+回合边界倒计时——只动敌侧，玩家 critical 窗不搅）、`js/app.js`（药铺问药 askMedicineShop/askOneMedicine[学识口才三档详略+herbLore 记学]+尝药 tasteOneMedicine[毒半入丹毒账换明账]+openMedicineShop 开铺先弹问药窗）。教训记档：两道判死口必须同步改（单改一道被复核打穿·实测抓到）；显示层假警报再犯（sed/node console 都吞 `[`——python count 与码点级才是真相）。
> **2026-10-08 v27.19 补记·续**：族册侧栏——renderSideList（构装册/骨相册·六格：格名/要害◆/伤标/百分比/点格出手）接进 app.js _paintBattleRight 第三分支（兽形分支后）；SVG 沿用人形图族上色（壳红即壳损），族专属 SVG 待外包图列遗留。测试坑记档：同 id 假阴（测试节点撞战斗面板原 id——用唯一 id）。
> **2026-10-08 v27.18 补记**：修随机事件越界（TA 实机报 BUG：随机事件到处弹/野外弹门派事件/概率稍高）——**零新文件**，改四件：`js/core/daily-events.js`（_deInSect 真在场三级判定[门派场景标志>野外地图在屏>弟子身份兜底]+resolve 重排+城门派 5%→3%+冷却 35→60 分钟+resolveDailyLocation 补导出）、`js/location-system.js`（enterSect/closeSectPanel 挂清 __inSectScene 场景标志配对）、`js/sects/sect-visit.js`（门派内院补 5% 奇遇口）、`js/app.js`（奇遇口压三处：酒馆 30%→15%/传送 10%→5%/坊市睡醒 5%→2%）。根因：discipleState.isInSect 是"门派弟子"不是"人在门派"——两向都错。四态行为验收全绿。浏览器缓存三重坑记铁律（r 参数不破子资源/换端口≠新码/正解=no-cache 小服务器 8935）。
> **2026-10-08 v27.17 补记**：总档待办第四批（断肢江湖+耳语读方·按 TA 平衡定调收窄版）——**零新文件**，改三件：`js/app.js`（battle onEnd 带伤出账·废格才出账每场 1 格+残格乘区三系数+医馆接骨档 clinicSetBone/clinicSetBoneSkip 三钮+耳语读方 B 结仇加码）、`js/battle.js`（构造器残格乘区·康复进度现算零定时器+命中基段 _lingerHitMod）、`js/npcs/npc-crime.js`（addHeat 前置耳语读方 A·heat+10 联案加码）。存档新字段：charData.lingeringInjury（角色档加字段，随 game-state 主档走零迁移）。**对账省一刀**：城医馆 v25.1 已在（深伤正骨档）——原计划的 hospital.js 新设施件取消。修两 bug：crime 无参 IIFE 裸 global 被 try 吞、浏览器启发式缓存（改后必换新端口验·铁律升级）。下批：部位族构装+亡灵两族单批+机关臂并批（材料同源）。
> **2026-10-08 v27.16 补记**：总档待办第三批（无争议清账三件）——**零新文件**，改五件：`js/time-system.js`（updateSeason 换季广播 seasonChange——EventBus/GameEvents 双发）、`js/city-facilities/tea-storyteller.js`（季节线消费方示范：四句按季话+EventBus 订阅）、`js/world-events.js`（三灾变上报人口账 noteCalamity：瘟疫 6%/兵灾 10%/兽灾 12%）、`js/npcs/npc-life-actor.js`（ledger 补 credit 收钱入账正门）、`js/npcs/npc-borrow-service.js`+`js/npcs/npc-bond.js`（借钱契约 money 族：借/还/逾期七日兄弟上门三选项（还/躲/赖）+赖账写耳语暗账+面板穷态可见——borrowRecords v2 记录加 kind:money 字段，同键不升版）。对账销两件：辟谷（v27.13 已做）、事件腿（v27.13 已做）。文件数/挂载数/目录计数全部不变（358/356）。总档**无争议待办至此全清**；下批首刀=断肢江湖。

> **2026-10-03 文档核验轮补记**：本节基线数字经逐条复核，**全部准确**（354 文件 / 352 script / manifest 350+25（entries 449）/ 288 套测试 / 19 个目录计数）。
> 但同一批复核发现**散落在后文各节的行数与计数已漂移**（`app.js`、`npc-system.js`、`data.js`、`item-tags.js` 各差 1 行；`items-extended` 各子文件种数、`buildingEffectsRegistry` 登记数、类别名行号等多处过时或自相矛盾）。
> 已就地改正的条目均带 `（2026-10-03 复核）` 标注；未标注的仍以本轮之前的标注为准。

| 项目 | 实测值 | 怎么复核 |
|------|--------|----------|
| `js/` 下 js 文件总数 | **358**（v27.13 实测：根 45 + core 35 + battle/ 1 + npcs 92 + sects 44 + city-facilities 34 + extensions 30 + items-extended 18 + quest 13 + cultivation 10 + map 9 + crafting 7 + economy 5 + factions 3 + gameplay 3 + equipment 2 + combat 1 + endgame 1 + vendor 1 + world 1） | `Get-ChildItem js -Recurse -File -Filter *.js` |
| `仙侠.html` 里 script 标签数 | **356** | `Select-String 仙侠.html -Pattern '<script defer src'` |
| 实际挂载的 js（= 上面 358 − 2） | **356** | 刻意不挂载：`items-extended/09-loot-sources.js`、`npcs/npc-storylines.js`（均已废弃，文件暂留） |
| `scripts.manifest.json` 登记 | **356 script + 25 条层注释**（v27.13 · 2026-10-07 断档补写，新增 `battle/beast-part-family.js` / `core/population-ledger.js` / 根 `app-city-bureaus.js`；v27.12 基线 352+25，10-03 基线为 350+25，entries 总数未复数） | `python tools/refactor/manifest-scripts.py check` |
| 加载序列唯一真源 | `scripts.manifest.json` 的 `entries` 顺序 | 同上 |
| `tests/*-node.js` 套数 | **288**（基线 275 通过 / 13 失败） | `Get-ChildItem tests -Filter *-node.js -File` |
| 逐目录文件数 | 根 **45**（v27.13 增 app-city-bureaus.js）/ npcs **92** / sects 44 / city-facilities 34 / core **35**（v27.13 增 population-ledger.js）/ **battle 1**（v27.13 新目录：beast-part-family.js）/ extensions 30 / items-extended 18 / quest 13 / cultivation 10 / map 9 / crafting 7 / economy 5 / factions 3 / gameplay 3 / equipment 2 / combat 1 / endgame 1 / vendor 1 / world 1（合计 **358**） | 见 0.2 节 |

> ✅ **版本号口径存疑（已销账 2026-10-05）**：本块原记「代码已到 v27.x，版本记录停在 v26.1，本文头写 v26.2——三者互不同步」。
> 现状：`版本记录.md` 已由「文档补账批」（2026-10-04）补至 **v27.11**，本批（v27.12 货币总闸，2026-10-05）后文档头顺延为 **v27.12**——三者同步，此条挂账销掉。

---

## 0.1 怎么加一个新模块（新人先读这一节）

> 这是全文档此前完全缺失的一节。一个没读过代码的人，只读本文就能把一个新功能挂进游戏，靠的就是下面七步。

### 第 0 步：先判断「新模块该放哪个目录」

目录不是随便分的，它对应依赖层。放错目录 = 运行时 `undefined`。

| 新模块属于 | 放哪 | 判据 |
|-----------|------|------|
| 纯数据表（无副作用、别的文件读它） | `js/data.js` / `js/regions.js` / `js/sects/sects.js` / `js/items.js` | 只有常量，没有函数调用别的系统 |
| 扩展物品模板（自己注册进物品库） | `js/items-extended/19-xxx.js` 之类新号 | 只往 `window.itemById` 注册模板，不改既有表 |
| 通用底座（事件总线 / 存档 / 调度 / 事务 / 状态注册） | `js/core/` | 不认识具体玩法，只提供闸门与工具 |
| 存档相关 | **一律 `StateRegistry`**，见 `js/core/state-registry.js` | 禁止往 `game-state.js` 里加键名（已石山化） |
| 战斗内机制 | `js/battle.js` 或独立战斗模块 | 需要 `Entity` / `Battle` 上下文 |
| 门派玩法 | `js/sects/` | 依赖 `discipleState` / `sectName` |
| NPC 玩法 | `js/npcs/` | 依赖 `npcManager` / `SPECIAL_NPC_DATA` |
| 城市设施 / 城中玩法 | `js/city-facilities/` | 依赖 `locationSystem` / 情境引擎 |
| 任务 / 主线 | `js/quest/` | 依赖 `QuestRegistry` / `playerQuestProgress` |
| 洞府 / 阵法 / 傀儡 / 秘境等「扩展大系统」 | `js/extensions/` | 独立闭环，跨版本批次新增的多落这里 |
| 主逻辑 / 面板 / 事件接线 | `js/app.js`（只在接线时改，别把逻辑塞进来） | app.js 已 11738 行（2026-10-03 复核实测），只做转发 |

**不确定就问一句**：「这个模块运行时读谁、被谁读？」——它读谁决定它必须晚于谁挂载。

### 第 1 步：写文件（本项目统一外形）

```javascript
// ==================== xxx.js — 一句话说清它负责什么 ====================
// 依赖：<列出它运行时读的 window.* 全局>
// 纪律：成本走世界账（时间/精力/真气/灵石），不设人为日限配额
(function () {
    'use strict';
    if (typeof window === 'undefined') return;   // ← 必须：node 验收环境没有 window

    var API = { /* ... */ };
    window.XxxSystem = API;                       // ← 唯一出口：挂一个具名全局
})();
```

三条硬规矩（`强制规则.md`）：
- 状态必须走 `StateRegistry.register('key', {export, import})`，**禁止新开 localStorage 角色键**；
- 银钱必须走 `RewardService`（`js/core/reward-service.js`），**禁止裸写 `inventory.currency.*`**；
- 出错信息走 `console.warn` + `gameLog.add()`，**禁止空 catch 静默**。

### 第 2 步：在 `scripts.manifest.json` 登记（唯一真源）

`scripts.manifest.json` 的 `entries` 数组顺序 **就是** defer 执行顺序。
- `{"kind":"script","indent":"    ","src":"js/xxx.js","comment":"行尾注释（可空）"}`
- `{"kind":"comment",...}` = 分层注释（`第 N 层：…`），不产生 script
- `{"kind":"blank","indent":"  "}` = 空行

**放在哪一行 = 它的依赖顺序**。判据：它 `window.` 读到的每个全局，都必须排在它前面。
典型插入点：读 `data.js` 的放第1层后；读 `battle.js` 的放第4层后；读 `EventBus` 的放 `js/core/event-bus.js` 之后。

### 第 3 步：让工具把顺序写回 `仙侠.html`

```powershell
python tools/refactor/manifest-scripts.py gen      # 读 manifest 重建 script 区段写回 HTML
python tools/refactor/manifest-scripts.py check    # 校验 HTML == manifest；有漏网标签会 exit 1
```

**不要手改 `仙侠.html` 的 script 区段**——下次 `gen` 会覆盖。也不要手编 manifest 而不跑 `check`。

### 第 4 步：验收测试

```powershell
# 单跑本批
node tests/xxx-node.js
# 静态检查（行号/API 名漂移）
python tests/static-check.py
# 全量（Windows PowerShell）
$files = Get-ChildItem "tests" -Filter "*-node.js" -File
$pass = 0; $fail = @()
foreach ($f in $files) { & node $f.FullName *>$null; if ($LASTEXITCODE -eq 0) { $pass++ } else { $fail += $f.Name } }
"全量: $($files.Count) 套 / 通过 $pass / 失败 $($fail.Count)"; $fail
```

新套件还要追加一行到 `tests/run-all.sh`（bash 版 CI 走这个文件）。
**基线：288 套 / 275 通过 / 13 失败**。改文档不该改变任何测试结果。

### 第 5 步：功能接线（面板入口）

`app.js` 里加一个 `openXxxPanel()` 转发函数，在 `switchPanel(...)` 或对应面板按钮上挂 `onclick`。
UI 事件优先走事件委托（`js/core/delegate.js` 的 `data-act` 注册表），别再堆内联 `onclick` 字符串。

### 第 6 步：写清三份账（`强制规则.md` 修改前报告）

1. 涉及哪些状态及其**唯一所有者**
2. 调用了哪些**公开 API**
3. 改哪些**存档字段**（+ 旧档迁移方式）
4. 发出/消费哪些**事件**
5. 跑哪些验收用例

### 已知的 13 套基线失败（与你无关，别去"修"）

`beast-ecosystem-node.js`、`v20.18-bank-node.js`、`v20.21-world-teeth-node.js`、`v24.0-audit-fixes-node.js`、
`v25.7-street-life-node.js`、`v25.8-dark-bonds-node.js`、`v26.0-six-livelihoods-node.js`、`v26.1-city-gates-node.js`、
`wave135-halfbag-attribution-node.js`、`wave141-empty-catch-node.js`、`wave65-washe-shows-node.js`、
`wave68-festival-fair-node.js`、`wave72-city-jobs-node.js`

---

## 0.2 文件总账（js/ 全量 358 个文件 · 逐个说清"这个文件负责什么"）

> 格式：`路径 :: 职责`。职责取自各文件自身的头注释（作者原文），未作推测。
> 标注 `【已废弃·不挂载】` 的两个文件不在 `仙侠.html` 里，文件暂留供考古。

### js/ 根目录（44 个）

- `js/achievement-system.js` :: 成就系统（v20.11 重构）
  机制 927 行 · 混合（成就档案快照 + 成就管理器 + 成就墙渲染）｜关键数据 `PresetAchievements`（全表对齐档案快照）、`FREE_UNLOCK_IDS`、`ACH_CATEGORY_CN` / `ACH_RARITY_CN` 分类/稀有度中文表、`HOUSE_TIER`（洞府档并入成就判据）；成就本身**不落档**（现推）
  接口 `window.AchievementSystem`（含 `checkAllAchievements` / 成就墙渲染）+ 自身挂 `getEffectiveMax` 等转发｜依赖 profile 快照（`collectProfileSnapshot` 一类的只读派生函数）、StateRegistry、timeSystem、checkAchievementsNow（travel-journal 侧）｜事件：无
  缺口 ★`achievement-system.js:925 window.checkAllAchievements = function () { return checkAchievementsNow(); }` 是 `checkAchievementsNow` 的**同义别名**，而真函数 :922 挂的是 `window.checkAchievementsNow`（travel-journal.js 有调）⇒ 别名这一枚 js/ 内无外部调用方（同一函数两个名字，易误读为两套判定口）
  缺口 成就走「档案快照现推」而不落档，但档案快照读 `currentCharData` + `inventory` + `tamedBeasts` + 洞府档 —— 任一底层账读档顺序变化，成就会成批误判（**无法判定**是否有版本号）
  缺口 本文件是 §0.2 职责行点名的「v20.11 重构」本，重构后成就表对齐了档案快照，但 `checkAllAchievements` 仍零引用 ⇒ **重构留下了一个没接线的判定入口**
- `js/app.js` :: 全局游戏日志系统
  - **机制摘要**（**实测 11748 行 / 681 KB，全项目最大单文件** · 混合：角色创建 + 世界切换 +
    城市/门派设施 UI + 存读档 + 战斗 UI 骨架 + 实体构建 + 野外内容 + 面板渲染 · **98 个分节**）
    **实测骨架数字**：顶层 `function` 声明 **303** 个（**无重名**）· `window.X = ` 赋值 **353** 个不同名 ·
    分节头 **98** 处 · 字符串 `onclick="` **150** 处 · `showMessage(` 调用 **291** 次 ·
    `advanceTime(` **45** 次 · `saveToStorage` **24** 处 · `localStorage` **28** 处 ·
    `innerHTML` 写入 **114** 处 · `addEventListener` **17** 处 · `setTimeout` 7 处。
    ★**`EventBus.on` 实测 0 处、`EventBus.emit` 仅 3 处、`StateRegistry.register` 实测 0 处**
    ⇒ 本文件**几乎不订阅事件总线、也不向注册表登记任何状态**（它自己管的那些键全是手写 localStorage）。
    按系统拆（**98 节归成 11 组**）：
    **①角色创建**（L65-258）：`selectGender` / `generateAttributeInputs` / `initRootSystem`(L99) /
    `updateRootUI` / `startGame`(L259) / `backToCreation` / `collectCharacterData`(L390) / `getLuckTier`。
    **②世界切换与身体**（L258-1046）：`populateGameWorld`(L551) / `initCharacterBodyDurability` /
    `renderBodyDurability`(L776) / `updateBodySVG`(L913) / `renderAvoidancePriority`(L941)。
    **③面板与导航**（L1046-1191）：`switchPanel`(L1047，巨型 if-else 分发；**实测查
    `PanelLifecycle.runShowHooks` 优先**，旧链留在 `app.js:1078` 的 `if(!_handled)` 兜底) /
    `switchSubTab` / `selectProvince`。
    **④城市/门派设施**（L1191-1565 + L2283-2547）：`selectCity`/`selectSect`/`renderFacilitiesList`/
    `renderSectFacilitiesList`/`executeFacilityAction`/`executeSectFacilityAction`/`restAtInn`/
    `startTraining`/`visitTemple`/`templePray`/`templeMeditate`/`visitTavern`/`tavernRumor`/
    `askBeastTrail`/`showTeleportUI`/`teleportToCity`/`openQuestHall`/`openBlackMarket`/`joinCurrentSect`
    /炼丹房/`openForgingShop`/`performEnhancementAction`。
    **⑤洞府界面**（L1565-1930）：时长选择（`toggleDurationGrid`/`selectDuration`/
    `_refreshDurationSelectorInPlace`/`_renderDurationSelector`）+ `startCultivation`/`cultivationMeditate`/
    `useSpring` —— **26 个顶层函数里 8 个是这一个面板的**。
    **⑥存读档**（L2902-3471）：`refreshSaveSlots`/`saveGame`(L2959)/`exportSave`/`exportSingleSave`/
    `importSave`/`continueCandidate`(L3214)/`continueLastGame`/`refreshContinueButton`/`loadSaveSlot`/
    `loadSaveData`(L3277)/`deleteSave`/`showSaveToast`/`parseSaveSlotsSafe`(L44) + `updateKarmaDisplay`。
    续档有**三套优先级**（注释里点明：① 显式 last-slot 存档 ② `global.__lastSaveData` ③
    单键全量 `xianxia_auto_saves`），与 `core/game-state.js:1416-1420` 的「`xianxia_save` 被自己删掉」
    是同一条链的两端。
    **⑦战斗 UI 骨架**（L3533-4831）：`updateBattleUI`(L3606)/`_updateBattleUIImpl`/`_renderActionBars`/
    `_updatePhysiologyUI`/`paintBars`/`_updateCriticalBanner`/`_updatePainDebuffIcon`/`_updateArmorUI`/
    `closeBattle`(L3843)/左右人体栏（`_sideLeftData`/`_paintBattleLeft`/`_paintBattleSvgParts`…）/
    `switchBodyView` + **实体菜单与交互**（L4217-4831：`updateEntityMenu`/`openInteraction`/
    `renderInteraction`/`lootCorpse`/`dissectCorpse`/`interactBuilding`/`interactTalk`）。
    ★**战斗的实体构建被放在 app.js**（L4831「玩家战斗实体统一构建（单一权威链路）」），
    而 `js/battle.js` 是战斗类与结算 —— 两文件平级共享 `window`，**没有模块边界**。
    **⑧实体与队友**（L4831-6245）：`buildPlayerEntity` 链 + 队友战斗状态(L5292) +
    v21.9 速度档位/自动战斗(L6016) + v10.0 招式UI(L6074) + 常用栏管理(L6245) +
    阵前话/见招拆招/战斗医疗(L6404-6610) + **伤口与医疗系统**（L6610-6970）。
    **⑨装备/功法集成**（L6970-7746）：`equipItem` 接线 + `getFinalAttributes` 的调用侧 +
    v6.0-v6.4 新系统初始化 + 门派专属装备功法注册 + `initAllSectInternal`。
    **⑩NPC 与野外**（L7746-10171 + L11345）：NPC 交互完善(L7746) / 物品-NPC 联动与赠礼
    (L7951-8118) / **战败复活**(L8118) / **敌人处置**(L8218) / 灵石经济闭环(L8298) /
    野外内容+区域特性+木材采集(L8396-8738) / 新面板渲染(L8738) / 钓鱼(L9055) /
    二周目多周目(L9167) / 功法修炼可视化(L9285) / 炼丹品质(L9335) / 灵根变异(L9338) /
    竞技场(L9362) / 贡献兑换(L9365) / 境界突破(L9528) / 拍卖行(L9583) / 野外 NPC 游商流浪修士(L9587) /
    副本秘境(L9802) / 灵兽园+清剿+雷鹰探秘境(L11345)。
    **⑪全局导出与设施/设置尾段**（L10171-11748）：**L10171 起的全局导出块**（供 HTML onclick 用）
    + 道侣结拜(L10243) + 活动面板刷新(L10306) + 全局战斗入口(L10346) + 分城商店与设施动作(L10448) +
    v9 新增设施基础功能(L10710) + 第二批设施入口(L11136) + 设置系统(L11168) + 字号调节(L11266) +
    黑市交易修复(L11294) + 深入按钮(L11326) + 手机汉堡导航(L11691)。
    运行时实测：`window.gameState` **0 键**（**空对象**，注释说它是「gameState 全局状态对象」但实测空）、
    `window.currentBattle` 是 object、`STATIC_PANEL_IDS` **3** 项。
    **事件**：★发 3 处；★订 0 处。
  - **缺口** ★★①**11748 行里有 303 个顶层函数 + 353 个 window 全局，且 `switchPanel` 是
    「巨型 if-else 分发」**——这正是 `core/panel-lifecycle.js` 与 `core/scenario-engine.js`
    两处头注各自说「要截断的石山/巨型 if-else」的**同一个病灶的宿主**。
    `app.js:1047 switchPanel` 与 `app.js:1075-1078` 的 `runShowHooks` 查表是两套并存的分发机制
    （重构第 5 步只搬走了 13 个面板里的 1 个 `calendar`，见 `core/world-calendar-ui.js` 条目缺口①）。
    ★★②**`EventBus.on` 实测 0 处**：一个 11748 行的主程序**从不订阅事件总线**
    ⇒ 它既不发也不听，模块间全靠直接调用 window 函数；而 `core/game-state.js:1325-1335` 的
    读档重载清单里**没有它**（那 15 个 init\* 里没有 app.js 的函数）
    ⇒ **读档之后 app.js 侧的状态由谁重算，这条链无法判定**（可能靠 `loadSaveData` 内部显式调，
    也可能靠各面板 onShow 现算）。
    ★③**`StateRegistry.register` 实测 0 处** ⇒ app.js 自己管的 ~24 个 localStorage 键
    **全部绕过注册表**，与 `core/state-registry.js` 头注「把新增系统就继续改 1000 行 GameState 的
    石山趋势截断」的路线相反（记档：`xianxia_save`/`xianxia_inventory` 等仍由 `core/game-state.js` 白名单管，
    但 app.js 自己那 24 处 `saveToStorage` 是平行账）。
    ④**`window.gameState` 实测 0 键**（空对象）——L22 分节写「gameState 全局状态对象」，
    若它本应是真实状态容器，则**要么初始化被某处覆盖，要么它只是占位**（**无法判定**，
    未逐处追 `gameState.` 的写入点）。
    ⑤`innerHTML` 写入 **114** 处 + 字符串 `onclick=` **150** 处 ⇒ **XSS 面很大**；
    其中设施名/物品名/NPC 名等玩家可见数据是否经 `escapeHtml`
    （`core/world-calendar-ui.js`、`js/inventory.js` 都有转义 helper，app.js 侧**未核**）。
    ⑥`advanceTime(` **45** 处散落全文件 ⇒ 「时间推进」这条会触发 `time:advanced` → `GameScheduler`
    的全局副作用（各系统 tick）有 **45 个入口**、无统一收口（记档）。
    ⑦L5362 附近有 **两处** 名字带「重复定义，委托给第一个」的注释（L2547「门派交互（重复定义，
    委托给第一个 selectSect）」）⇒ **顶层函数重名隐患**：实测 303 个顶层函数**无重名**，
    说明这个「重复定义」是通过 `window.x =` 覆盖实现的（这也解释了 353 个 window 赋值 > 303 个函数），
    ⇒ **加载顺序一旦变化，「委托给第一个」的那个可能反被覆盖**（记档）。
    ⑧本文件**没有自己的分节总览文档**；98 个分节头是唯一的导航依据
    （本条 §0.2 摘要即由这 98 节归纳而来，粒度到「组」不到「节」——
    **若要更细，需按 `11-app-系统N.md` 逐节展开，本批只做到组级**）。
- `js/battle-injuries.js` :: battle-injuries.js · 关键伤标签系统 + 仙侠修为接入（v4.2） · 基于 GPT机体建议.txt 实施的3项改进： · 1. 关键伤标签系统（CRITICAL_INJURIES 配置表 + 多因素概率） · 2. 不同危急时间（不同关键伤有不同救治窗口）
- `js/battle.js` :: 基于部位耐久的战斗系统 + 生理系统（5种生物模板/伤口/意识/出血） · v13.0：将 v12.8/v12.9 的"亚型=固定机制包"重构为敌人战斗技能系统 · 人形敌人 = 身份模板（前缀/武器倾向/AI姿态/招牌技）+ 从共享池随机抽取的额外技能
  - **机制摘要**（**实测 4817 行 / 274 KB** · 混合：实体与生理模型 + 战斗流程状态机 + 敌人装配 +
    伤害结算管线 · **本文件是全项目最纯的一块：0 DOM、0 localStorage、0 onclick 字符串**，
    头注 `deserialize()` 可在离线调用器里跑正是靠这条纯度）
    **93 个分节**（实测 `// ====`/`// ---` 小节头 **93** 处）、**39 个顶层 function 声明**、
    **61 个 window 全局**、**1 处 `EventBus.emit`、0 处 `EventBus.on`** ⇒ 它**只发不订**。
    按系统拆：
    **①部位与耐久模型**（L7-518）：`BODY_PARTS` 实测 **22** 项，
    id 顺序 `brain`/`eyes`/`jaw`/`head`/`neck`/`chest`/`abdomen`/`dantian`/`waist`/`pelvis` +
    四肢 6 对（`upperArmL/R`…`footL/R`）——★与 `js/data.js:43 bodyParts` 的 **22** 项**逐 id 一致**，
    该文件 L42「与 battle.js 的 BODY_PARTS 保持一致」的断言**实测成立**。
    `initBodyDurability` / `normalizeDurabilityBook` / `calculateStatsFromDurability`（部位残缺如何折算六维）/
    `getArmorSlotForPart` / `getArmorData` / `applyArmorToWound` / `getArmorStatus`。
    **②生理与伤口**（L370-1707）：`initPhysiology`（`bloodVolume` + 缺氧/危急）· `initBodyParts` ·
    `createWound` / `generateWoundId` · `processPhysiology`(L1233，每回合结算) · `calculateBreathing` ·
    `updateConsciousness` · `getPainCombatPenalties`（疼痛的出手惩罚）· `bandageWound` ·
    `hourlyRecovery` · `hemostaticTreatment` · `pressureBleeding` / `_revertPressureBleeding` ·
    `willpowerSuppress` · `enterCriticalState`/`clearCriticalState`/`getCriticalStatus`。
    **③敌人装配**（L123-2369）：`COMBAT_ABILITIES` 实测 **13** 条机制（v13.0 起「机制不再焊死在敌人身份上，
    判断一律查 combatAbilities」）· `getCombatAbilityName` · v17.0 挑战梯度（**词缀层** + 具名强敌）
    · v21.8 高境界名号（金丹往后五十多级不再只有三张脸）· v26.4 头目级档位
    （与词缀层**同一张表形**：门槛/概率/倍率/额外抽数）· 人形亚型加权表（v12.8 权重写死）
    与亚型=身份模板（v13.0 删掉 8 个机制布尔，收编为 `sig`）· v20.64 敌方一组（兽群/同伙一起进场）
    · v21.9 敌人护甲机制（玩家挨打有覆盖率/抗性/耐久，敌人此前不对称——已补齐）。
    **④战斗流程**（L2255-2740 + L3284-4700）：`class Battle`(L2255) · 队伍成员作为战斗实体(L2308) ·
    v9 十二波 行动条时间轴引擎（L2518，**全员按时间攒条、满 100 出手、动作按轻重扣条**）·
    v9 十四波 见招拆招（姿态不是固定效果，是社交动作，不同性子不同反应）· v9 十七波
    「对面也是活人」（敌人也有真气、也有行囊、也带同伙）· v9 十九波 江湖耳目（阵前话/骂阵/
    卖绽/投鼠忌器/死前之言，全是**可选动作**）· v21.9 符箓控制（定身/冰封/乾坤跳回合、毒药发作、沉默计时）·
    v20.64 掩护指令 / 目标选择 / 队员自保 / 队员挨打记账 · 摄魂音 / 迷魂术 / 金蚕蛊（含啃噬结算）。
    **⑤伤害结算管线**（L4378-4624，编号即管线顺序）：
    `2. 命中` → `3. 闪避`（**上限 35%**，防守技能走轻功）→ `3.5 接触效果钩子`
    （未被闪避即接触；毒/元素冰火**每次攻击只结算一次**）→ `4. 格挡`（有条件、**上限 45%**，
    连续格挡降低后续成功率）→ `5. 化解`（**上限 35%**）→ `5.5 招式加成`（v10.0）
    → `6. 正常伤害 + 暴击`（基 5%、倍率动态、暴击不可闪避）。
    三个概率上限（35/45/35）是**分条硬编码**而非表驱动（记档）。
    **运行时**：`window.currentBattle` 实测是 **object**（不是 null）⇒ 加载即有一个空战斗实例兜底。
    **事件**：★发 1 处；★订 0 处。
  - **缺口** ★①**`personality` 用一个全局 `Personality16` 而不是每敌一份**（实测 `window.Personality16`
    存在）⇒ **同一个性格对象被全场敌人共用**（**无法判定**它内部是「模板 + 运行时状态分离」
    还是真的单例共享状态；`battle.js:2737`「不同性子不同反应」与 `3445`/`3461`/`3466` 四节都按
    「他的性子」分派，若是单例共享则这些分派读到的是同一份）。
    ★②**「行动条引擎」与「见招拆招」「江湖耳目」三套系统都把时间轴停住等玩家操作**
    （L2737 起连着四节都是「时间轴停着等你挑」）⇒ 一场遭遇战里**可插入的决策点至少 3 类**，
    而它们各自维护自己的面板与状态，**没有任何一处统计「本场战斗玩家被要求做几次决策」**
    （**无法判定**是否会造成节奏拖沓，未逐条核各处的出口条件）。
    ③`5. 招式加成`(L4518) 与 `5.5` 之间**编号重复 5.5**，且 `3.5 接触效果钩子` 插在闪避与格挡之间
    ⇒ 管线编号不是连续的纯整数，**注释里的编号是唯一的顺序真源**（记档）。
    ④敌人亚型/词缀/头目三套加权表各自硬编码权重与概率（v12.8「权重写死」自陈），
    **无平衡性断言、无统计分布输出** ⇒ 想调难度只能手改常数（记档）。
    ⑤**`class Battle` 与 `class Entity` 之外的战斗状态挂在 `window.currentBattle`**（实测是全局对象）
    ⇒ 与 `js/app.js` 共享同一份战斗态，两文件**互不 import**（都是 window 全局），
    **谁最后赋值谁说了算**（`app.js:4831`「玩家战斗实体统一构建（单一权威链路）」自称单权威，
    但那是**玩家实体**的构建链，敌方实体链在 battle.js）。
    ⑥`EMIT 1 / ON 0` ⇒ 本文件**从不订阅事件**，因此它对 `activeBuffs`、心境、护甲套、
    符箓加成等外部账的读取全是**调用时现取**（如 `TalismanSystem.getCombatBonuses()`）——
    这本身是对的（无陈旧态），但意味着**战斗中的外部变更（战斗中服丹药改心境）会立刻改变结算**，
    **无一致性快照**（记档）。
    ⑦`0 localStorage / 0 StateRegistry` ⇒ 战斗态**完全不落盘**，
    所以「战斗中存档」要么禁止、要么存到一半的战场（**无法判定**，`app.js` 的 `saveGame` 是否
    在战斗中可达**未核**）。
- `js/beast-taming.js` :: beast-taming.js - 灵兽系统 v7.1 P0-3 · 收服（战后正门）/ 培养 / 出战 / 骑乘 / 进化（第八十五波：过渡版主动捕捉已拆除）
  机制 1577 行 · 混合（灵兽系统 v7.1：收服/培养/出战/骑乘/进化 + v27.0 凡兽账同栏不同册 + v17.1 天赋/喂食/绝技）｜关键数据 `BEAST_TEMPLATES` **25 种**、`BEAST_TRAITS` 词缀表、`MUNDANE_PEN_CAP`（凡兽栏上限）、`BEAST_LINE_MAP` 进化线、`tamedBeasts` / `activeBeastIndex` / `activeMountIndex` 三个运行态
  接口 大量 window 全局（`beastDisplayName` / `spiritBeastCount` / `mundaneBeastCount` / `getBeastPenCap` / `isMundaneBeast` / `hireOutBeast` / `bringBackBeast` / `getActiveMount` / `renderBeastList` / `saveBeastData` / `tryRegisterTamedBeast` / `openRenameBeastModal`（horse-market.js:119-545 实测挂出同名的 12 个））｜依赖 `city-facilities/horse-market.js`（买/卖/雇/牵回/改名）、inventory/itemById、StateRegistry、timeSystem、EventBus｜事件：无
  缺口 1（口径澄清：六个动作口**不是**死导出）→ 本文件把 6 个动作口挂在 `window` 上后，又在**本文件自己的 HTML 模板里**用 `onclick` 字符串点名它们（实测：`teachBeastAbility` 定义 :974 + 模板引用 :966 + 汇总口 :1567；`openRenameBeastModal`/`openReleaseBeastModal`/`openSellMundaneModal` 同款）⇒ **js/ 内无外部调用方 ≠ 按钮点不到**，这批是「自驱型」出口（128 个此类，见总账附录口径）
  ★缺口 2（注释可能已过时）→ `beast-taming.js:1009` 「① `evolve()` 全库零调用——面板只亮『✨可进化』的提示却不给按钮，纯骗玩家」；但同文件 `:1036` 已有 `window.BeastEvolution.evolve(bid)` 的真调用 ⇒ **注释描述的零调用已不成立或指的是另一处同名**（**无法判定**：未逐行追 `:433-492` 那对 `canEvolve`/`evolve` 的定义名）
  ★缺口 3（注释点名的死 API）→ `:608` 「旧版受伤 API 全库零调用」（力竭的兽不听号令那条线）；`:1040 breedBeasts` 与之同族 ⇒ 繁育与受伤两条线都只有数据没有入口
  缺口 本文件与 `extensions/beast-evolution.js`（359 行，进化/疗伤/变异/繁育 29 方法）+ `extensions/beast-ecosystem.js`（338 行，地图分布）+ `extensions/beast-lore.js`（162 行，打听）四本构成灵兽链，但**四本之间没有事件串联**（beast:* 事件全零订阅）⇒ 链是并列的四个模块而非一条流程
  缺口 本文件与 `city-facilities/horse-market.js` 双向导出 12+ 个同名口（`beastDisplayName` / `getBeastPenCap` / `isMundaneBeast` / `mundaneBeastCount` / `spiritBeastCount` / `hireOutBeast` / `bringBackBeast` / `tryRegisterTamedBeast` / `saveBeastData` / `renderBeastList` / `openRenameBeastModal`）⇒ **全项目最重的一对同名覆盖**（谁赢取决于 manifest 顺序，**无法判定**）
- `js/building-effects.js` :: building-effects.js - 建筑效果系统 · 定义每种建筑的具体效果，与现有系统集成
  机制 921 行 · 数据表 + 渲染（建筑效果注册表：19 类建筑的专属效果与弹窗）｜关键数据 `buildingEffectsRegistry`（19 段 `// ===` 一段一类：坊市/商店/炼丹房/铁匠铺/任务堂/客栈/演武场/传送阵/洞府/灵泉/寺庙/酒楼/黑市…）；`inTELs` 灵气层数表
  接口 `window.showBuildingEffectDialog` / `closeBuildingDialog` / `useBuildingEffect` / `openBuildingInterface` / `getRealmLayerName` / `updateStatusPanel` 等 + 自身挂 `advanceQuestObjectivesFromEvent` 调用（:301 发 `sparring`）｜依赖 cityData/BUILDING_TYPES、`QuestRegistry`、`CityVoices.vo`（分城口吻）、MarketDynamic、RewardService、`satietySystem`｜事件：★发 `sparring`(:301)（quest 桥的 13 类之一）
  缺口 1（口径澄清：`pray` **不是**死导出）→ `pray` 是 `buildingEffects` 注册表里的**动作名**（:558 定义），由 :613 `onclick="useBuildingEffect('temple','pray')"` 分发 ⇒ 寺庙祈祷按钮接得上
  缺口 `:299` 注释自陈「updateQuestObjective，findQuestById 返回 null，daily_003 永不可完成」已改走 `advanceQuestObjectivesFromEvent('sparring', {amount:1})`（:301）——但 `sparring` 只被 quest 桥消费，`daily_003` 是否真的能推进**无法判定**（该任务定义在 quests 目录外）
  缺口 本文件是城市建筑的**第一层**效果（注册表），而 `city-facilities/` 34 本是第二层（面板钩子 + 情境增补），`app.js` 的 `BUILDING_ACTIONS` 是第三层分发 ⇒ 三层分发表并存，同一建筑的动作可能落在任一层（**无法判定**优先级：实测 `works_bureau`/`salt_iron_office` 在三层都有名字）
  缺口 本文件 921 行但 `buildingEffectsRegistry` 未见条目数常量（只按 `// ===` 分段计 19 段）⇒ 无法按数据表口径核对覆盖度
- `js/city-depth.js` :: city-depth.js — v20.7 建筑补齐包（一次性全做批次）
  - **机制摘要**（**实测 312 行 / 18.1 KB** · 混合：城市建筑补齐包 = 试炼塔层数制 + 剑冢剑意成长线 + 僵尸字段接真消费 + 专属货架，全落既有真源｜**实测骨架数字**：整文件是一个 IIFE `(function(global){...})(window)`，**顶层 function 声明 0 个 / 顶层 window 赋值 0 个 / `====` 分节头 0 处**（静态扫 0 是因为全包在 IIFE 内，见下）；IIFE 内部 **11 个 `function` 声明**（`num`/`clamp`/`rngOf`/`cd`/`msg`/`dm`/`addTime`/`grantItem`/`货没处放`/`payStones`/`realmScore` + 3 个具名）、**2 个对象字面量** `SwordIntent`(:158，5 方法) / `TrialTower`(:213，2 getter+2 方法)、**1 张模块账** `PROGRESS`(:28，4 键)；运行时实测本文件只往 window 挂 **2 个键**：`CityDepth`（16 键 api）+ `getSwordIntentAttackMul`）
    ① 试炼塔（L212-259 `TrialTower`）：`challenge` 耗 20 精力 + 30 灵石「塔前香火」+ 60 时辰，胜率 `clamp(50 + (realmScore − 层数×8) × 3, 5, 90)`；胜则 `trialFloor/trialBest` 递增、真元 `+30+层×5`、名声 `+1+⌊层/3⌋`，每逢 5 的倍数层额外赐 `vitality_pill`×2（走 `grantItem` 收据口，半包有专门文案）；败则心情 −5、历练 +10。`openPanel`(:252) 用 `onclick="CityDepth.trialChallenge()"` 字符串自驱，按钮上的层数是渲染时快照。
    ② 剑冢剑意（L157-210 `SwordIntent`）：`comprehend` 耗 20 真气 + 60 时辰，剑意 +1~2（30% 出 2）；`pull` 需剑意 ≥8，成功率 `clamp((剑意−8)×5+10, 5, 80)`，成则发 `wpn_dark_iron_sword` 并 `hasAncientSword=true` 永久锁死、古剑一次性；`challenge` 需剑意 ≥5，胜率 `clamp(15+剑意×2, 5, 75)`，胜则剑意 +3、真元 +50、名声 +3，败则精力 −20、历练 +15。`attackMul`(:209) 每点剑意 +0.6% 攻击，经 `getSwordIntentAttackMul`(:309，0 点时短路返 1) 交 `battle.js:725` 读。
    ③ 僵尸字段接真消费（L135-155）：`tryBlockPoison` 扣 `blessing` 1 层挡一次毒；`poisonTick` 在 `_poisoned` 为真时每日扣 `maxHealth × 0.15`（下限 1）。
    ④ 专属货架（L89-133）：`GOLD_WARES` 3 条 / `PEARL_WARES` 2 条，`buyWare`(:100) 走 `payStones` → `grantItem` → **失败原路退款**（`addSpiritStones`）→ 10 时辰。`renderWares` 的按钮是 `onclick="CityDepth.buyWare('gold',0)"` 字符串自驱。
    ⑤ 持久化（L266-285）：StateRegistry 键 **`cityProgress`**（version 1），`export/import/reset` 三件套齐全，4 键往返；旧档 import 空对象即字段全默认、零迁移。
    接口 `window.CityDepth`（16 键实测：`version`/`sword`/`tower`/`goldWares`/`pearlWares`/`swordComprehend`/`swordPull`/`swordChallenge`/`trialChallenge`/`openTrialPanel`/`openWaresPanel`/`buyWare`/`tryBlockPoison`/`poisonTick`/`getSwordIntentMul`/`progress`）+ `window.getSwordIntentAttackMul`｜依赖 `XianXia.DataManager.deductSpiritStones/addSpiritStones`、`giveWithReceipt`（优先）/ `addItem`、`timeSystem.advanceTime`/`onNewDaySubscribe`、`StateRegistry`、`addFame`、`updateStatusPanel`、`showBuildingEffectDialog`（退 `showModal`）、`addItemFailPhraseFor`/`addItemReasonPhraseFor`｜事件：★无 emit；★订 `timeSystem.onNewDaySubscribe(poisonTick)`(:263)
  - **缺口** ★①**试炼塔胜率的境界表缺飞升/金仙，两境玩家与凡人同档** → `:24 REALM_ORDER` 只抄到渡劫（10 境），`:84 indexOf` 对「飞升」「金仙」返 −1 → `if (idx < 0) idx = 0` 兜成凡人。实测（realmScore → 第 1 层胜率）：渡劫 90% / 大乘 90% / … **飞升 32% / 金仙 32%**（与凡人 32% 完全相同），即**通关飞升的玩家进试炼塔第一层胜率与凡人一样**。这是 `combat-stats.js:97 _REALM_ORDER` 那条已知「境界档位表缺两境」病灶的第 5 份抄本（本批实测，抄本清单见 `combat-stats.js` 条目）
  - **缺口** ★②**`:454`（`loot-system.js` 同款病灶在本文件的对应物不成立，但**试炼塔的成本回收无回滚**）→ 实测 `payStones` 先扣 30 灵石（`:221`），随后 `:227` 掷骰；若同一 tick 内 `addFame`(:231) 抛错，**灵石已扣、精力已扣(:222)、时辰已走(:223) 而层数没升**，`challenge` 无 try/catch 包裹（**无法判定** `addFame` 是否可能抛错——本批未追它的实现）
  - **缺口** ★③**试炼塔没有层数上限，`trialBest` 可无限爬** → `:217-251` 唯一约束是 20 精力 + 30 灵石，而 `:226 prob` 被 `clamp(…, 5, 90)` 封顶 ⇒ 层数够高后每层固定 5% 胜率、代价恒定 50 灵石 ⇒ **理论上可无限刷层**，只是每层要付 30 灵石 + 1 时辰（属设计内的成本闸，**是否有意不设上限：无法判定**）
  - **缺口** ④**`openPanel`(:252) 的按钮层数是渲染快照** → 挑战成功后不重开面板，屏上仍写「挑战第 N 层」旧数字（须手动关闭再打开）；`trialChallenge` 成功分支只调 `updateStatusPanel`(:244)，不重渲染本面板（**无法判定** `showBuildingEffectDialog` 是否每次调用重建 DOM——若是引用同一个节点则会同步，取决于它的实现，本批未追）
  - **缺口** ⑤**订阅时机与文件头注释矛盾** → `:18` 头注写「加载顺序：time-system.js 之后（毒发订阅世界日历）」，实测 `仙侠.html` 里 `js/time-system.js` 是 **idx 52**、`js/city-depth.js` 是 **idx 107** ⇒ 顺序确实成立，**订阅接得上**（此条为核实通过，非缺口；但与 `mount-events.js:213` 那条「只查一次不在位就永久哑掉」的写法不同，本文件**没有** `load` 兜底 —— 若将来有人把 city-depth 提前到 time-system 之前，毒发会静默哑掉，无日志）
  - **缺口** ⑥**`getSwordIntentAttackMul` 是全局裸函数，与阵法增益同款读取，但只在玩家侧生效** → `battle.js:725` 的守卫是 `this.type === 'player'`，敌方剑意不入算（**无法判定**是否有意：敌方 `PROGRESS` 是玩家那份账，敌人没有剑意概念，看起来是有意）
  - **缺口** ⑦**`CityDepth.sword` / `CityDepth.tower` 两个命名空间对象的 5+4 个方法，本文件外的调用方只用了 5 个** → 实测外部消费点全是 `window.CityDepth.xxx()` 平铺调（`location-system.js:1365 openTrialPanel` / `:1480 tryBlockPoison` / `:1495 openWaresPanel('gold')` / `:1574 swordComprehend` / `:1579 swordPull` / `:1589 swordChallenge` / `:1622 openWaresPanel('pearl')`、`app.js:8614 tryBlockPoison`、`achievement-system.js:139-140 progress()`、`battle.js:725 getSwordIntentAttackMul`）⇒ **`CityDepth.sword.*` 与 `CityDepth.tower.*` 这两条命名空间路径全仓 0 引用**（只经同名转发函数 `swordComprehend`/`trialChallenge` 等被调）；`getSwordIntentMul`(:302) 这个键同样零外部引用
  - **缺口** ⑧**`js/sects/sect-trials.js:63` 挂了一个同名的 `openTrialPanel`** → 该文件实测 `W.openTrialPanel = function (fid) {…}`，与本文件 `CityDepth.openTrialPanel()` **同键名不同签名**（前者收 `fid`、后者无参）；因两者挂在不同命名空间（`window.openTrialPanel` vs `window.CityDepth.openTrialPanel`）目前不冲突，但 `location-system.js:1364` 读的是 `CityDepth.` 前缀那一份 ⇒ **扇区试炼与城市试炼塔是两套同名不同物，读档/口径容易混**（**无法判定** `window.openTrialPanel` 那一路当前是否还有活的调用方，本批未追 sect-trials.js）
- `js/combat-stats.js` :: combat-stats.js - v9.8 动态战斗属性统一计算 · 面板与战斗必须共用本文件，禁止再读 combatStats.default
  机制 450 行 · 纯派生计算（无状态、无持久化、无事件）+ 装备负荷五档｜关键数据 内部 `_REALM_ORDER` **9 境**（:97，炼气→渡劫）/ 文件级 `REALM_TIERS` **10 项**（:384，多一个「凡人」）/ `SLOT_DEFAULT_WEIGHT` **14 键**（:267）/ 负荷五档阈值 30%·55%·80%·100%（简装/轻装/中装/重装/超载）/ `_emptyStats()` 兜底表 / 返回对象 **21 键**（含 `load` 子对象）
  接口 9 个 window 全局：`getDerivedCombatStats`（面板与战斗唯一入口，:350 被包装过一次以自动并入负荷修正）/ `getCombatStatsForPanel`（13 行展示表，替代 combatStats.default）/ `getLoadInfo` / `getLoadCapacity` / `getCurrentLoad` / `getItemWeight` / `realmScaledEnemyLevel` / `synthesizeEnemyAttrs` / `scaleEnemyEntityToLevel`｜依赖 currentEquipment、itemById、getCurrentCharData、syncCharAttrsFromMain、getCombatBonuses、getPlayerWeaponSkill｜事件：无
  ★缺口 1（实测：飞升/金仙两境加成归零）→ `:97 _REALM_ORDER` 只抄到渡劫。同一套六维（各 10、无技能）实测：渡劫 1 层 attack 43 / defense 31 / speed 23 / toughness 19；**飞升 1 层 attack 10 / defense 6 / speed 7 / toughness 3**（四项全部落回 `_emptyStats()` 兜底值）⇒ 飞升与金仙玩家的境界派生加成**完全归零**，比渡劫低 33 点攻击。这是 `enhanced-shop.js:1815`、`location-system.js:502`、`:1429` 同源「境界档位表缺两境」病灶的**第 4 份抄本**
  ★缺口 2（实测：已修的「敌人强度接回境界」在两境失效）→ `:384 REALM_TIERS` 同样缺飞升/金仙，`_realmTierOf` 回落 `indexOf` 得 -1 → 返 1。实测 `realmScaledEnemyLevel` 渡劫 layer1/9 = 57/65，而**飞升 layer1/9 = 1/9、金仙 layer1/9 = 1/9**（与凡人同档）⇒ `:380` 声称修好的 v21.6 病灶在最顶两境**原样复发**
  ★缺口 3（实测：四类槽位的负重恒算错）→ `:267 SLOT_DEFAULT_WEIGHT` 只有 14 键，缺 `ring1`/`ring2`/`acc1`/`acc2`。实测 512 件物品里这四槽分别有 11 / 5 / 8 / 41 件（合计 65 件），全部走 `:281 return 2` 兜底，而表里 `ring` 写 0.1、`accessory` 写 0.5 ⇒ **戒指/饰品负重被高估 4~20 倍**。连带后果：`equipment/equipment-sets.js` 的 13 件毕业装里有 4 件（问天戒 ring1、合道戒 ring2、鸿蒙玉佩 acc1、太上仙印 acc2）重量算错
  缺口 `:350` 包装器在同一次调用里 `getLoadInfo()` 调两次（:356 取修正、:365 塞结果），每次面板/战斗派生都重算一遍全装备重量
  缺口 `:301` 用魔数反推重量 `if (w === 2 && !item.weight)`——靠「恰好等于默认值 2」识别「没写 weight」，任何显式写 `weight: 2` 的模板都会被误判
  缺口（**正面样本**：已达标）`:2` 头注「禁止再读 combatStats.default」实测成立——全仓 `combatStats.default` 只剩本文件 :2 与 :246 两处注释文本，零代码引用
- `js/crafting.js` :: crafting.js - 物品合成系统 · 借鉴《太吾绘卷》、《觅长生》的合成设计
  - **机制摘要**（**实测 1167 行 / 47.5 KB**（`Get-Content Measure-Object -Line` 数出 1092，差 75 行是它对末尾导出块内多行 `if` 的计数口径差；Python 逐行读 `split('\n')` 得 1167 行、本条数字以此为准）· 数据表 + 混合（配方库 + 材料/货币结算事务 + 成功率与品质掷骰 + 面板宿主动态建 + 事件发射 + 丹方图鉴记账）｜**实测骨架数字**：顶层 `function` 声明 **15 个**（`isRecipeContentReady`/`checkMaterials`/`consumeMaterials`/`addResultItem`/`getCraftCostMul`/`calculateSuccessRate`/`growRecipeSkills`/`executeCrafting`/`finishCrafting`/`getRecipesByCategory`/`renderCraftingUI`/`ensureCraftingPanel`/`renderCraftingTabs`/`closeCraftingUI`/`openCraftingUI`）、顶层 `var/const` **10 个**、顶层 `window.` 赋值 **21 处**（L1126-1153）、`====` 分节头 **20 处**；运行时实测本文件引入 **25 个 window 键**）
    ① 配方库（L23-609）：`pilferRecipes`(:23) / `forgingRecipes`(:288) / `talismanRecipes`(:408) / `foodRecipes`(:499) 四个原始数组 **加载那一刻共 40 条**；`isRecipeContentReady`(:614) 按「产物在册且 `implemented !== false`」过滤后合成 `allRecipes`(:620) → 实测**加载后 40 条**。**全量加载完成后 `allRecipes` 变 54 条**：后 14 条由 `js/items-extended/10-crafting-extensions.js:132` 运行时 push 进来（见缺口①）。按 category 实测 `pilfer` 22 / `forging` 8 / `talismans` 20 / `food` 4；`recipeById`(:628) 实测 **54 键**、重复 id 0。
    ② 材料/货币结算（L641-711）：`checkMaterials` 逐项查背包 + 查 `inventory.currency.spiritStones`，灵石按 `getCraftCostMul()`(:734) 打折；`consumeMaterials` **再验一遍**才动手（`:684` 注释明说防外部调用造成半扣）。
    ③ 成功率（L752-802）：基准硬编码 **0.7**，累加四路 —— ①`requiredSkills` 超出部分每级 +0.003 ②生活技能 `min(0.16, lv×0.004)` ③`getHouseBonus('alchemy'/'forging')` 超出 1 的部分 ×0.5 ④`_sectCraftBuff` 场地窗 +0.08，再叠 `sectSignatureCraftBonus`；最终 `clamp(0.6, 0.95)`。
    ④ 执行合成（L814-998）：`codexHint` → 配方存在 → `requiredSkills` 闸 → `canCraftWithProfession` 闸 → 材料闸 → **真气闸**（`qiCost`，符箓可吃 `sectSignatureTalismanQiSave` 打折）→ 产物实装二次校验 → `EconomyTransaction.capture()` 快照 → 扣真气 → 扣材料（失败则 `EconomyTransaction.restore` + 还真气）→ 掷成功骰（失败也 `growRecipeSkills(+1)` 并推进时间，**按设计损失材料**）→ 掷品质骰（`CRAFT_QUALITY` 5 档累计概率）→ `addResultItem` 实收 → 发放失败则快照回滚 → `Codex.discover('codex_recipe')` → `EventBus.emit('item:crafted')` → `growRecipeSkills(+2)` → 推进时间。
    ⑤ 面板宿主（L1061-1123）：`panel-crafting` / `#crafting-tabs` / `#crafting-deep-entry` / `#crafting-recipes` **HTML 里一个都没有**（实测 `仙侠.html` 全文不含这 4 个 id），全靠 `ensureCraftingPanel`(:1068) 首次调用时动态建；`renderCraftingTabs`(:1087) 按 `CRAFTING_TAB_LABELS` 5 个页签生成，**计数为 0 的页签 `continue` 静默跳过**（见缺口②）；炼丹页签挂「开放丹方·药性四维」、锻造页签挂「词缀炼器」两个深水入口（`:1104/:1106`，分别要 `window.AlchemyCompound` / `window.ForgingCompound` 在场）。
    接口 `window.` 25 键（`allRecipes`/`recipeById`/`CRAFTING_CATEGORIES`/`CRAFT_QUALITY`/四类原始数组 + `checkMaterials`/`consumeMaterials`/`addResultItem`/`calculateSuccessRate`/`executeCrafting`/`finishCrafting`/`getRecipesByCategory`/`renderCraftingUI`/`openCraftingUI`/`closeCraftingUI`/`_openCraftingUIImpl`/`getCraftCostMul`/`canCraftWithProfession`/`isRecipeContentReady`/`ensureCraftingPanel`/`renderCraftingTabs`/`growRecipeSkills`）｜依赖 `window.itemById`、`inventory.slots`/`inventory.currency`、`getLifeSkill`/`growLifeSkill`、`getHouseBonus`、`EconomyTransaction.capture/restore`、`Codex.discover`、`EventBus`、`timeSystem.advanceTime`、`sectSignatureForgeDiscount`/`sectSignatureCraftBonus`/`sectSignatureTalismanQiSave`、`SECT_SIG_TUNING`、`_craftDiscountUntil`/`_sectCraftBuff`、`codexHint`、`addItemReasonPhrase`｜事件：★发 `item:crafted`（`:971`，**本文件唯一 emit**，quest 事件桥 13 类之一）
  - **缺口** ★①**`allRecipes` 有 14 条是运行时后补的，`crafting.js` 自己的配方表只占 40/54** → 实测逐脚本追踪：`js/crafting.js` 加载完 `allRecipes.length = 40`，`js/items-extended/10-crafting-extensions.js` 加载完变 **54**。这 14 条是 `recipe_icicle`/`recipe_wind_blade`/`recipe_fire_wall`/`recipe_ice_wall`/`recipe_wind_dodge`/`recipe_invisibility`/`recipe_bind`/`recipe_silence`/`recipe_armor_break_tal`/`recipe_freeze`/`recipe_revive`/`recipe_five_element`/`recipe_universe`/`recipe_heavenly_master`（全是符箓），由扩展批 `:131-136` 自己重跑一遍同样的 `implemented` 过滤后 push 进 `allRecipes` **并同步补 `recipeById`**（实测 `recipeById` 54 键含这 14 条，方向一致无遗漏）。**不是 bug，但记账口径要认**：本文件 `window.talismanRecipes` 数组长 20（含后补 14），而**文件里写死的只有 6 条** ⇒ 静态读源码数不出真实可制作配方数
  - **缺口** ★②**`CRAFTING_CATEGORIES` 声明 5 类，`herb` 类 0 条配方 ⇒ 页签静默消失** → `:9 HERB: 'herb'`（草药加工），实测 `getRecipesByCategory('herb').length = 0`，而 `renderCraftingTabs:1093` 是 `if (!count) continue;` ⇒ **玩家永远看不到「🌿 草药加工」这个页签**（`CRAFTING_TAB_LABELS:1066` 里的 `herb: '🌿 草药加工'` 标签是死文案）。这是「常量与实际不符」：分类表比配方表多一类
  - **缺口** ★③**`foodRecipes` 数组里 4 条配方自报 `category: 'pilfer'`，被端到炼丹页签** → 实测数组名 vs 条目自报 category：`pilferRecipes` 18 条全 `pilfer`、`forgingRecipes` 8 条全 `forging`、`talismanRecipes` 20 条全 `talismans`、**`foodRecipes` 8 条里 4 条 `food` + 4 条 `pilfer`**（`recipe_peiyuan`/`recipe_zhuji`/`recipe_ningyuan`/`recipe_jieying`，即筑基/结婴类破境丹）。分类靠**条目自报字段**而非数组归属（`getRecipesByCategory:1024` 过滤 `r.category`）⇒ 实测最终分布 pilfer 22 / food 4，数组名与实际归类不一致（**疑似**有意：破境丹放炼丹页签更合理，但数组名未随之改名，属命名与内容脱节）
  - **缺口** ★④**全部 54 条配方都没有 `skill` / `requiredSkill` 字段 ⇒ `profQuality`/`timeMul` 两行是死分支，事件 `profession` 字段恒 null** → 实测 `recipe.skill` 存在数 **0/54**、`recipe.requiredSkill` 存在数 **0/54**（技能只写在 `requiredSkills` 复数形里，实测用到的技能名 4 个：炼制/锻造/学识/烹饪，门槛 5~85 共 15 档）。于是 `:948 var qSkill = recipe.skill || recipe.requiredSkill || null` **恒 null** ⇒ `:949 profQuality = 1 + Math.min(0.4, 0×0.01) = 1`、`:950 timeMul = max(0.6, 1−0) = 1`（这两行恒等计算）、`:953` 的 `(profQuality > 1.15 ? 1.2 : 1)` **恒取 1**、`:977 profession: (typeof qSkill === 'string' && qSkill) ? qSkill : null` **恒 null**。⇒ 注释里「v18.0 生活技能成功率/品质/耗时（副职业退役）」声称的「技能越高成品越多、做得越快」在当前配方表下**整条不生效**
  - **缺口** ★⑤**UI 显示的灵石标价与实扣金额不一致（工坊折扣窗开着时）** → `:1053` 渲染的是 `recipe.currency.spiritStones` **原值**，而 `:669`/`:704` 实扣 `Math.floor(标价 × getCraftCostMul())`。实测 `getCraftCostMul() = 0.6` 时：`recipe_flying_sword` 屏显 500 实扣 300、`recipe_fireball` 屏显 30 实扣 18、`recipe_teleport` 屏显 200 实扣 120（21/54 条配方有灵石标价，其余 33 条不耗灵石）⇒ **面板说一个数、钱包扣另一个数**（方向是玩家占便宜，但账面对不上；`checkMaterials` 的闸也按折后算，所以不会出现「显示够、实扣不够」）
  - **缺口** ★⑥**`finishCrafting` 是死导出，`craftingState` 四字段整账从未被写过** → 实测 `finishCrafting` 全仓**只有定义 + 挂 window**，本文件内零调用、文件外零调用（`[call()]` 口径：全仓 2 处 = 本文件定义 1 + `STRUCTURE.md` 1）。它 `:1017-1019` 那三行 `craftingState.isCrafting=false / currentRecipe=null / progress=0` 因此永不执行 ⇒ `craftingState`(:634，4 键 `isCrafting`/`currentRecipe`/`progress`/`startTime`) 是**只写不读的账**：`executeCrafting` 从头到尾没碰过它，`isCrafting` 恒 `false`、`progress` 恒 `0`、`startTime` 恒 `null`（**疑似**是早期「合成耗时进度条」设计废弃后的残留，本批未追 git 历史）
  - **缺口** ★⑦**`_openCraftingUIImpl` 是 `openCraftingUI` 的同函数别名，零外部引用** → `:1144 window._openCraftingUIImpl = openCraftingUI;`（同一函数对象），实测该名字除本文件这一行外只出现在 `STRUCTURE.md` 与 `版本记录.md`，**js/ 内零引用** ⇒ 纯死别名（疑为某批「先埋Impl再包一层」改造留下的后半截）
  - **缺口** ★⑧**`isRecipeContentReady` 与 `canCraftWithProfession` 的门禁效果在当前数据下都是空转** → ①`isRecipeContentReady`(:614) 实测过滤掉 **0 条**（54 条产物全在册、全 `implemented!==false`，见 b1e 实测）；②`canCraftWithProfession`(:1153) 与 `:837` 的 `requiredSkills` 闸、`executeCrafting:823-835` 的闸**读的是同一张表同一套口径** ⇒ 面板的「职业不足」置灰(:1039)与点下去后的报错**必然同生同灭**，那道「先在 UI 拦一道、再在执行拦一道」的双保险实际只有一份逻辑（`:1149` 注释自陈这函数是「补真身」补上的，但补出来的口径与旧闸重合）
  - **缺口** ⑨**`CRAFT_QUALITY.FAIL` 档的 30% 概率被 `continue` 吞掉，不产生任何「失败品质」** → `:931 if (!q.result && q.chance) { cumChance += q.chance; continue; }`，实测 5 档 chance 合计 `0.3+0.15+0.4+0.2+0.1 = 1.15 > 1` ⇒ 累计概率超 1，掷到 >0.85 的值会一路走到最后仍不 break，`qualityMultiplier` 停在初始 **1**、qualityName 停在 **'普通'**（`:926-927` 初始化值）⇒ 该分支概率约 `(1−0.85)/1 ≈ …` 实际是「掷骰 > 各档累计上界 ⇒ 按普通档结算」。另有 **sum ≠ 1** 这件事本身（1.15）意味着后两档（优良 20%、杰出 10%）的真实概率被前面挤压，**杰出档实际命中率低于 10%**（具体数值需按累计边界逐档算，本批未精算，**无法判定**确切值）
  - **缺口** ⑩`CRAFT_QUALITY` 里 `EXCELLENT.multiplier = 1.5` 只乘 `result.count`，而实测 **54 条配方里 `result.count` 有多条是 1**（如 `recipe_universe` count 1）⇒ 掷到杰出档也只多出 `floor(1×1.5)=1` 件，**品质档对丹药/符箓几乎无感**，只在 count≥2 的配方上体现（**疑似**设计如此：品质本意是材料等级而非份数）
  - **缺口** ⑪`calculateSuccessRate` 不读配方自带的成功率字段 —— 实测 54 条配方**全部没有 `successRate` 字段**，`:754` 的 `baseRate = 0.7` 是硬编码；`:930` 品质档也不读 `recipe.quality`（实测 0 条有该字段）⇒ 配方表**没有任何逐条调平衡的入口**，全靠全局常量
  - **缺口** ⑫与 `js/crafting/` 目录 7 本无 window 键交集（实测逐文件比对：alchemy-compound 1 键 / forging-compound 1 / pill-poison 10 / brewing 2 / craft-custom-pill 3 / fire-qte 4 / compound-ui 27，**交集全为空**）⇒ 两套合成系统**并行不冲突**；但 `js/crafting/compound-ui.js` 另挂 27 个 window 键且**加载在 `crafting.js` 之后**（实测 html 顺序：`js/crafting.js` 在 `js/crafting/compound-ui.js` 之前），谁覆盖谁由键名决定（本批实测交集为空 ⇒ 当前无覆盖，**无法判定**未来加同名键时谁赢）
- `js/data.js` :: 仙路长青 - 基础游戏数据
  - **机制摘要**（**实测 175 行** · 纯基础数据表 + 2 个纯函数，无逻辑分支）
    本文件是全项目的**术语与常量基座**：导出 **15 个 window 全局**。实测表规模：
    `attributes`（3 组：`main` **6** 项 / `combat` **9** 项 / `life` **10** 项，v20.90 起 `life` 含「音律」）
    · `combatStats` **10** 项（`hit` 85 / `dodge` 10 / `block` 10 / `parry` 10 / `crit` 5 /
    `critDmg` 150 / `counter` 5 / `penetrate` 5 / `toughness` 5 / `poisonRes` 0，每项带 tooltip）
    · `avoidanceMethods` **3** 项（`dodge` 罚 20 / `block` 罚 40 / `parry` 罚 10）
    · `avoidancePriority` 默认 `['dodge','block','parry']`（`let` 声明，导出的是**引用副本**）
    · `bodyParts` **22** 项（含左右对称，`brain`/`eyes`/`jaw`/`head`/`neck`/`chest`/`abdomen`/`dantian`/
    `waist`/`pelvis` + 四肢 6 对，每项带 `stat` 指向受影响的属性键）
    · `durabilityColors` **7** 档色值 · `terrainTypes` **10** 项（带 `moveCost` 1-4 与灵根加成）
    · `buildingTypes` **10** 项（带 `action`：`rest`/`trade`/`meditate`/`info`/`explore`×2/
    `cultivate`/`recover`/`craft`/`gather`）· `rootNames`/`rootColors` 各 **5**
    · `realmLevels` **9** 境（`{realm,layers:9,baseQi}`，炼气 100 → 渡劫 15000）
    · `REALM_CONFIG`（`realms` **9** 境带 `qiBase`/`essenceBase`/`temperingBase` +
    `layerMultipliers` **9** 个 1.0→17.5）。
    两个纯函数：`getDurabilityColor(v)`(L80) 与 `getDurabilityLabel(v)`(L92)，都把 NaN 兜成 100，
    分档边界 100/80/50/30/11/1/0，与 7 档色值一一对应。
    **实测消费方 10 个文件 / 77 处命中**（含自身 27 处）：`app.js` 20 处 ·
    `cultivation/breakthrough-system.js` 14 · `js/location-system.js` 6 · `js/combat-stats.js` 2 ·
    `cultivation/breakthrough-ritual.js` 2 · `enhanced-shop.js` 2 · `extensions/beast-ecosystem.js` 2 ·
    `achievement-system.js` 1 · `js/beast-taming.js` 1。**事件**：无。
  - **缺口** ★★①**同一个文件里有两张并行的境界表，两张都只到渡劫、都没有飞升/金仙** ——
    `realmLevels`(L105-115) 与 `REALM_CONFIG.realms`(L147-157) 各 9 条，都止于 `渡劫`；
    而 `cultivation/cultivation.js` 实测出现「飞升」17 次、「金仙」7 次（是真实境界态）
    ⇒ 这是「档位表只抄到渡劫」病灶的**上游源头**（此前已在
    `enhanced-shop.js:1815`、`location-system.js:502`/`:1429`、`core/soul-state.js:14 REALM_NAMES` 四处发现同源症状；
    本条定位到**第 5 处同源且是元凶**）。任何按这两张表 `indexOf` 求档位的代码在飞升/金仙段都会返 0。
    ②**两张表的字段完全不同却都叫「境界」**：`realmLevels` 是 `{realm,layers,baseQi}`、
    `REALM_CONFIG` 是 `{name,index,qiBase,essenceBase,temperingBase}` —— 一个用 `realm` 一个用 `name`、
    一个用 `baseQi` 一个用 `qiBase`（数值还不同：炼气 baseQi **100** vs qiBase **50**）
    ⇒ **无转换函数、无一致性断言**，两条读取路径各算各的（记档）。
    ③**耐久分档注释与实现不一致**：L40 注释写「耐久度 0-100，颜色从绿到红 **10 级**」，
    实测 `durabilityColors` 与两个判定函数都是 **7 档**（100/80/50/30/11/1/0）。
    ④**属性名一词两语**：本文件里 `attributes.main` 用中文显示名（`神识`）而 `bodyParts[].stat`
    用英文内部键（`intelligence`），v9.8 注释说明「界面显示神识（内部英文键仍为 intelligence）」
    ⇒ **没有中英映射表**，两套名字各自硬抄在两个数组里；实测「音律」是 v20.90 才补进 `life` 的
    （`js/itemsextended`/`cultivation` 侧另有一批生活技能名，同样无映射表，记档）。
    ⑤`window.avoidancePriority = avoidancePriority` 导出的是**引用**；任何一处写
    `window.avoidancePriority = [...]` 换新数组，本文件的 `let` 就与 window 脱钩（实测**消费方 0 处**
    重新赋值，暂无症状；记档）。
    ⑥`bodyParts` L42 注释声明「与 `battle.js` 的 `BODY_PARTS` 保持一致」——
    该断言**未核**（battle.js 本批最后做，会回填；本批实测本文件是 **22** 项）。
    ⑦`terrainTypes` 的 10 种地形里 **6 种的效果文案是「某灵根修炼速度+X%」**
    （forest/mountain/river/volcano/mine/snow），而这些加成**在随机地图生成时怎么用**（是移动消耗还是修炼倍率）
    `无法判定`（属 `js/map/` 段，不在本批范围）。
- `js/debug-panel.js` :: debug-panel.js — 调试面板（Admin 专属作弊功能） · 当角色名称为 "admin" 时，设置页下方会出现调试面板
  机制 942 行 · 渲染 + 直接改写运行态（无持久化、无事件）｜关键数据 `DebugPanel` **35 个动作口**（货币 4 / 境界 1 / 属性 3 / 战斗技能 2 / 生活技能 2 / 灵根 2 / 物品 3 / 一键恢复 2 / 业障声望 2 / 城望 2 / 清 debuff 1 / 冷却 1 / 地图 1 / 时间 4）；`window.DIFFICULTY_PRESETS` 战斗难度卡（v12.4）；顶部 8 段静态表（境界 11 / 层名 / 主属性 / 战斗技能 / 生活技能 / 灵根 / 变异灵根 / 物品快速选择）；`debugState.isAdmin`
  接口 `window.DebugPanel`（35 键）+ `window._isAdmin` + `window.toggleDifficultyDetail` / `applyDifficultySetting`｜入口 `app.js:1145-1153`（`panelId === 'settings'` 时先调 `renderDebugPanel()` 再读 `_isAdmin` 决定 `display`，**顺序正确**）；DOM 锚点 `debug-panel`（html 3 处）与 `debug-panel-content`（html 1 处）**均存在**
  缺口（口径澄清：难度卡**不是**死导出）→ `toggleDifficultyDetail` / `applyDifficultySetting` 在 js/ 内零外部引用，但 `applyDifficultySetting` 被本文件 `:848` 的 `onclick` 字符串点名、两个函数定义在 `:862/:877` ⇒ 设置页「游戏设置」区的难度按钮**接得上**。同理 `DebugPanel` 35 个口全靠本文件 34 处 `onclick` 字符串自驱
  ★缺口 1（绕过统一钱包口径）→ `:358/:371/:386/:399` 直接写 `window.inventory.currency.spiritStones` / `.copper`，绕开 `global-utils.js:422 XianXia.DataManager` 与 `:745 installWalletMirror`（NEW-36/NEW-31/NEW-06「钱包只有一本账」）。实测全仓这样直写的点共 **60 处**（app.js 15、sects 24、inventory 4…）⇒ 调试面板不是孤例，但它是**唯一一处由玩家手动触发的直写口**
  ★缺口 2（时间备胎分支不发 `newDay`）→ `:813` 优先走 `timeSystem.advanceTime`（正确），但 `:816-830` 的备用分支直接 `window.gameTime.currentDay++` / `hour +=` / `minute +=` 归一，**全程不发 `timeSystem` 的 `newDay`**。按 §0.2 `js/time-system.js` 条目，`newDay` 是全项目唯一发点、**40 个订阅方**（银行逾期、当铺过期、坐骑马贼、香火月俸、大业日账…）全吊在这一行 ⇒ 一旦 `timeSystem` 未就位而走了这条备胎，Admin 的「推进 30 天」会让 40 本账的当日结算**全部不跑**且无任何提示
  缺口 `:71` Admin 判定是 `charData.name.toLowerCase() === 'admin'`，而 `:931` 在 IIFE 末尾把 `window._isAdmin` 硬置 `false` ⇒ 该标志只在 `renderDebugPanel()` 被调时刷新；`app.js:1151` 另有 `|| 名称兜底` 双保险（已核实顺序无误）
  缺口 `:746-754` 的清档动作直接遍历 `localStorage` 逐键 `removeItem`，绕过 `global-utils.js:562 saveToStorage` 的「写盘失败不许静默」纪律（**疑似**有意：清档本就该静默批量删）
- `js/dynasty-court.js` :: v27.7 朝政篇 · 朝廷（新文件 dynasty-court.js） · 称帝不是终点是一段剧情的开头：大业名册第 92 件「称帝建国」落地之后，这里接朝政大剧情 · 国库明账（月初自动过账）· 立储（亲子/弟子，吃子嗣账与宗门账）· 征伐邻城（真仗，属城岁入）
  机制 1140 行 · 大状态机（国库/立储/征伐/三大工程/朝堂风波/终局）+ 三个真仗结算口 + 存档 + **两个全局函数包装器**｜关键数据 `CFG` **38 常量**（TREASURY_START / UPKEEP / VASSAL_MAX / VASSAL_INCOME / VASSAL_ARMY / GRANARY_INCOME / CONQ_* / WORK_PALACE / PALACE_FAME / APPEASE_COST / REBEL_* / RELIEF_COST / REMIT_DAYS / IGNORE_REP / BURN_KARMA / ALLOW_KARMA / HEIR_REP / ABDICATE_REP / ASCEND_INCENSE_BASE / EDICT_DUE / DEFY_PUNITIVE / SUBMIT_GRACE / PUNITIVE_* / SUMMON_* / TURMOIL_GAP / TURMOIL_MIN_REIGN / CHRON_MAX）；`CHRON_MAX` 编年史上限
  接口 `window.DynastyCourt`（14 个源码行约 50 键，代表 open / courtOk / initCourt / incomeOf / expenseOf / childHeirs / discipleHeirs / designateHeir / startConquest / settleConquestFight / buildWork / maybeTurmoil / settleRebelFight / resolveEdict / settlePunitiveFight / summonCity / endingOk / onAscend / dailyTick / state）+ `window.openDynastyCourt` + `window.settleConquestFight` / `settleRebelFight` / `settlePunitiveFight`｜入口 `grand-legacy.js:671`（称帝后才出现的「👑 打开朝政」按钮，`onclick="window.openDynastyCourt()"`）与 `core/scenario-engine.js:530`（`eff.grand.op === 'court'`）；三个结算口被 `app.js:5640/5644/5648`（胜）与 `:5904/5908/5912`（败）按 `_isConquestFight` / `_isRebelFight` / `_isPunitiveFight` 成对调｜存档 `StateRegistry.register('dynastyCourt', {version:1})`；事件：无 emit；★订 `timeSystem.onNewDaySubscribe(dailyTick)`(:1066)
  ★缺口 1（★全项目最高风险的全局覆写：`window.enterCity`）→ `:1087-1095` 把 `window.enterCity`（`location-system.js` 的**全项目唯一进城正门**）包一层，跑完原函数再调 `changanVisit(cityName)`，用 `window.enterCity.__dcCityWrapped` 防重包。实测加载序：`location-system.js` @188401 早于 `dynasty-court.js` @200227 ⇒ **当前包裹成功**。但这段**没有 `load` 事件兜底重试**（与紧邻的飞升钩子 `:1114-1117` 形成不对称）——一旦 manifest 顺序改成 dynasty-court 先加载，`origEnterCity` 拿到 `undefined`，`:1088` 的守卫直接 return 且**不置 `__dcCityWrapped`**，长安见闻永久哑掉、无日志无告警
  ★缺口 2（飞升钩子只包一层，两个 `onAscension` 谁先谁后看加载序）→ `:1100-1117` 包 `window.onAscension`（真身在 `endgame/ascension-epilogue.js:166`，由 `cultivation/heavenly-tribulation.js:141` 在渡劫成功时调）。实测 `dynasty-court.js` @200227 **早于** `ascension-epilogue.js` @204539 ⇒ 加载瞬间 `window.onAscension` 还是 undefined，靠 `:1114` 的 `load` 事件补包才接上（**当前成立**）。守卫 `window.__dcAscendHooked` 只认自己那份，若日后有第三份包装器插在中间，链条会静默断
  缺口 `:133` 反向读 `window.GrandLegacy.state()` 取称帝凭据 ⇒ 朝政与仕途两本账互相咬合，任一侧读档坏账（`grand-legacy.js` 的 `_import` 会剔掉「没进士官身的城主」）都会让朝政这边失去 emperor 依据（**无法判定**：是否有兜底提示）
  缺口 `:1069` 的「v27.9 长安见闻（世界对你的大胜/敌对有反应，各一次入见闻戳）」挂在 `changanVisit` 上，而 `changanVisit` 只由上面的 `enterCity` 包装器驱动 ⇒ **缺口 1 一旦发生，这一整节内容随之消失**
- `js/enhanced-shop.js` :: 增强商店系统
  机制 2041 行 · 混合（商店类 + 商店管理器 + TradeService 统一交易 + 报价明细 + 货架筛选 + 分城动态店 + 秘籍货架过滤）｜关键数据 `SHOP_TYPE_LABELS`、`SHOP_TITLE_GREET`、`PREDEFINED_SHOPS`（预设商店）、v42 价格缓存、v15.1 秘籍渠道分层表；报价一律经 `TradeService`
  接口 `window.TradeService`（统一买卖通道，**全项目金钱真源**）+ 商店管理器 + 全局购买/出售函数（专用名避免被 app/inventory 覆盖）｜依赖 itemById/inventory/allItems、`MarketDynamic`、`CityVoices`、`KnowledgeSystem`、`PSectWorld`、locationSystem｜事件：无
  缺口 1（口径澄清：12 个回购口**不是**死导出）→ `getBaseBuybackRate`(:545) / `getRegionMultiplier`(:560) / `getMerchantDemandModifier`(:600) / `getDurabilityModifier`(:632) / `getSpeechModifier`(:643) / `getReputationModifier`(:658) / `isSellable`(:671) / `quoteSell`(:680) / `executeSell`(:784) / `_addToBuyback`(:899) / `getBuybackItems`(:924) / `buybackItem`(:929) 这 12 个口在 js/ 内**无外部调用方**，但每个在本文件内有 2~9 次引用（`:714-719` 六乘数汇总一次调完、`quoteSell`/`executeSell` 被出售页与回购面板自身驱动）⇒ 回购链是**自驱型**
  ★缺口 2（注释点名的已删死码）→ `:156-157` 「F-7 重构：删除死代码 `sellItem`（v10.5 起物品出售统一走 inventory.js sellItem → markForSale → TradeService.executeSell），原 `sellItem` 固定 `basePrice*0.5` 绕过 TradeService 真回购率（0.25-0.35），**可刷钱**，且无人调用」⇒ 注释说已删，但 `:689 executeSell` / `:600 quoteSell` 仍在（说明是「TradeService 的那一份删了、别处还有同名」——**疑似**同名双实现残留）
  ★缺口 3（死入口的间接证据）→ `:239` 「v25.1·试-18：『第一次买卖』引导原来只挂在 app.js `buyFromCityShop`（**死函数，零调用方**）」⇒ 同款「写完没接线」病史第三次出现在商店链
  缺口 `enhanced-shop.js:1815` DES-92 注释自陈「这张配置表数到渡劫就断了，飞升／金仙查不到 ⇒ 旧写法当 0（炼气）」已修 ⇒ 品质档位表曾缺 2 境；`location-system.js:502` / `:1429` 有同款病灶（三处同源）
  缺口 `:1791` 注释自陈「v13.1 遗留待办：秘籍自注册进全物品库后，general 滤网 `return true` 使其可随机上任何货架」⇒ **未修的已知待办**（本批实测仍在文件内）
  缺口 2041 行里 `window.itemById` 被整体转发（第 5 处），与 crafting/compound-ui.js、extensions 三本共 5 份
- `js/enhancement.js` :: enhancement.js - 强化系统（v7.1 P0-1 完整实现） · 强化 / 精炼 / 附魔 / 突破 + 保底 + 转移 + 属性生效 + UI
  机制 687 行 · 混合（强化 v7.1 P0-1：强化/精炼/附魔/突破 + 保底 + 转移 + UI）｜关键数据 `ENHANCE_CONFIG`（费用/成功率档）、`ENCHANT_POOL`（附魔池）、`enhancementPity` **保底表**；14 个 `====` 段（配置/保底/成功率/字段规范化/属性倍率/消耗检查/核心强化/兼容口/UI/强化大厅/转移 UI/转移/描述/导出）
  接口 `window.performEnhancement`（兼容 app.js 调用）/ `performEnhancementOnSlot` / `enhanceTransfer` / `getEnhanceMultiplier` / `getEnhanceDescription` / `getPityInfo` + 强化大厅 UI 入口｜依赖 EconomyTransaction（**强化扣费已收口**，wave95 C 段实测 `payEnhanceCost` 走 debit）、inventory、StateRegistry、timeSystem｜事件：无
  ★缺口 1（死常量）→ `enhancement.js:9 costSpirit`、`:11 costGold` 顶层常量名极短，实测二者在 js/ 内**只出现在这一处** ⇒ **死常量**（费用真源在 `ENHANCE_CONFIG` 里，这两个是残留）
  缺口 `enhanced-shop.js:1815` 与 `location-system.js:502/:1429` 是同源的三处「境界档位表只抄到渡劫」病灶；**本文件是否也有第四份抄本，本批未逐行核，疑似**（**无法判定**）
  缺口 本文件与 `enhanced-shop.js` 的 `TradeService` 是同一批 NE-31 修复的两端（强化扣费 vs 商店买卖），两边各自写了一份「先查够再扣、失败回补」的兜底（wave95 C12~C15 实测有兜底）⇒ 同一纪律写两遍（**无法判定**是否有意分层）
- `js/equipment.js` :: equipment.js · 装备与功法系统 - 借鉴《太吾绘卷》、《觅长生》设计 · v9.4：运功栏三槽；v9.6：选择并入装备栏/运功栏槽内，无独立选择面板 · v10.0：功法招式 attackMoves 定义（每门功法2招，用于战斗招式选择）
  - **机制摘要**（**实测 988 行** · 招式表 + 功法分页表 + 12 槽装备/3 槽运功运行时 + 面板装饰器）
    导出 **38 个 window 全局**，分四块：
    **①招式层**：`SKILL_ATTACK_MOVES` 实测 **161 键**（技能 id → 招式数组）+
    `getSkillAttackMoves(skillId)` + `getActiveAttackMoves()`（把 `currentSkills` 三槽 + 门派功法
    `sectArtChannelList()` 汇总成一份可用招式清单）。
    **②功法层**：`skillPages` 实测 **11 页 / 59 门**，`type` 共 **15 种**
    （内功/防御/医术/锻造/炼制/轻功/绝技/剑法/刀法/拳掌/长兵/射术/奇门/毒术/融合功法）
    ——**15 个 type 全部有槽位映射**（实测 `skill_types_without_slot` 为空）。
    `SKILL_CATEGORY_MAP` **15 键** 定槽：`skill_main` 收 **内功/防御/医术/锻造/炼制/融合功法**
    （5 类）· `skill_sub1` 只收 **轻功**（1 类）· `skill_sub2` 收 **绝技/剑法/刀法/拳掌/长兵/射术/奇门/毒术**
    （9 类）。`skillSlots` = `skill_main` / `skill_sub1` / `skill_sub2` 三槽，
    `currentSkills` 是对应的三键运行时。
    **③装备层**：`equipmentSlots` **12 条**（`head`/`neck`/`body`/`waist`/`hands`/`feet`/`mainHand`/
    `offHand`/`ring1`/`ring2`/`acc1`/`acc2`），`currentEquipment` 是 12 键运行时；
    `equipItem`/`unequipItem`/`getEquippedItem`/`getAllEquippedItems`。
    **④快捷招式层**：`quickMoveSlots` **6 槽** + `setQuickMoveSlot`/`getQuickMoves`/`initQuickMoves`
    （走 `xianxia_quick_moves` 键，**同时**在 `L692-706` 注册进 `StateRegistry` 的 **`quickMoves`** 键
    ——实测这是 items-extended 目录外唯一把 `quickMoveSlots` 交给注册表的地方）。
    `equipSkill` 的可学判定是**三段回退**（`sectArtChannelable` → `KnowledgeSystem.canEquip`
    → `learnedSecrets.indexOf`），`migrateSkillsToThreeSlots` 负责把旧档技能并入三槽。
    文件末尾 `L716-981` 是一整块**纯呈现装饰器**（`_ensureEquipmentChrome` / `_decorateEquipmentSlots`
    / `_decorateSlotCard` / `_ensureLoadHint` 等 + 一个 `MutationObserver`），注释自陈
    「只补呈现，不做数据活；自身写入都有比对前置，跑一遍即收敛」。
    **实测** `getQuickMoves()` 返回 **0**（新号未学功法）。**持久化**：`xianxia_quick_moves`
    （在 `core/game-state.js` 的 37 键白名单里）+ `StateRegistry.quickMoves` 双写。
    **事件**：无（纯调用式）。
  - **缺口** ★★①**三个运功槽的负载是 5 : 1 : 9**（实测 `SKILL_CATEGORY_MAP` 15 键分布）：
    `skill_main` 吞 5 个 type、`skill_sub1` 只有「轻功」1 个、`skill_sub2` 挤 9 个
    ⇒ 一个玩家最多同时生效 **3 门**，而 15 个 type 里**只有 1 个（轻功）独占一个槽**；
    `skill_sub2` 的 9 类（绝技/剑法/刀法/拳掌/长兵/射术/奇门/毒术）**互相挤一个槽**。
    这是 `17-lead-tokens.js` 里「36 枚信物全挤 `acc2`」之外的另一个同族失衡（记档，
    **疑似**是为了让「一门内功 + 一门轻功 + 一门外功」的传统配置成立而设计的取舍）。
    ★②**`equipSkill` 的判定是三段 if-else 回退**，而 `core/knowledge-system.js` 的
    `canEquip()` 本身就是同一件事的第二实现（且 knowledge 那边实测有 13 个死导出）
    ⇒ **「能不能装备」这一判定有 2~3 套实现**，本文件的三段回退意味着：
    `KnowledgeSystem` 一旦不在位就静默降级到 `learnedSecrets` 数组判定（更宽松）。
    ③`equipmentSlots`（12）与 `js/items.js` 的 `EQUIPMENT_SLOTS`（11，
    且 `ACCESORY` 拼写少 S）**是两套并行的槽位真源**（后者实测外部零引用 = 死表）
    ⇒ 只剩本文件这一套是活的，但文档与旧代码里仍能查到 11 槽的说法。
    ④`L733-981` 那 250 行装饰器**靠 DOM 结构定位**（`box.children[i]`、`head.querySelector('p')`、
    `cell.children`、`querySelector('button[onclick*="openEnhancementUI"]')`）
    ⇒ 它**依赖 `仙侠.html` 里装备面板的标签嵌套顺序**；`:913` 甚至靠读按钮的 `onclick` 字符串来
    「认出按钮职责」（注释自陈「只读不改：靠它认出按钮职责」）
    ⇒ 任何改 `仙侠.html` 面板结构的改动都会静默破掉这一整块（`catch(e){}` 吞掉）。
    ⑤`getActiveAttackMoves()` 与 `getAllLearnedMoves()` 都**先查 `learnedSecrets`、为空则回落
    「全部视为已学」**（L378-380 形态）⇒ 玩家一个秘籍都没学时，全 59 门招式的**攻击键位判定依据
    会走「全解锁」分支（**无法判定**该分支的实际后果，未逐行核 `:367-420` 的每一条 add 条件）。
    ⑥`quickMoveSlots` 有 **两个 owner**：`setQuickMoveSlot` 写 `xianxia_quick_moves`、
    `StateRegistry.quickMoves` 的 export/import 也写它 ⇒ 与
    `core/scenario-engine.js` 的 `xianxia_scenario_progress` 同款「双 owner」病灶（记档）。
- `js/event-system.js` :: event-system.js - 奇遇事件系统 · 借鉴《太吾绘卷》、《觅长生》的奇遇设计
  机制 968 行（37 个 `====` 段）· 混合（奇遇事件：12 类事件 + 4 档稀有度 + 事件库 + 旗标账 + 掉落生成 + 秘境/灵狐/顿悟/Boss 五个专项）｜关键数据 `EVENT_TYPES` **12 类**、`EVENT_RARITY` 4 档、`randomEvents` **11 条**、`eventFlags` 运行态、`eventHistory`、存档键 `xianxia_event_flags`
  接口 大量 window 全局（`triggerRandomEvent` / `handleEventChoice` / `generateTreasureLoot` / `generateCaveLoot` / `applyTreasureRewards` / `lootNameOf` / `lootLedgerText` / `setFlag`/`hasFlag`/`removeFlag` / `getEventFlags` / `EVENT_TYPES` / `EVENT_RARITY` / `randomEvents` / `eventFlags`）｜依赖 Realm 境界尺、showModal、addItem/addResultItem、startBattle、inventory｜事件：无（事件系统本身是**事件的消费者/生产者**而非 EventBus 参与者——实测 emit 名单 0 条）
  ★缺口 1（死导出）→ `:959 getEventFlags` → 全域零引用；旁边同段的 `eventFlags`（:958）是**同一份数据的裸暴露且有外部引用** ⇒ 两枚导出功能重复，其中一枚死
  缺口 `event-system.js:193` / `:382` / `:715` / `:760` 四处 DES-72/DES-89 注释串起来记同一批病灶（旧写法丢 addItem 返回值、把「千年人参」念成灵芝、先念「赠你丹药」再裸发奖）⇒ 本文件历史上至少 4 处丢返回值；wave102/103 的 loot 套件已覆盖其中一部分，但**文件名对不上**（测试覆盖的是 app.js 的发奖路径，不是本文件的 4 处）
  缺口 本文件 968 行的奇遇引擎与 `js/extensions/qiyu-encounters.js`（564 行，13 组奇遇）是**两套并行的奇遇系统**；前者走 `randomEvents` 表，后者走 `location:visited` 事件 + `getLuckChance` ⇒ 奇遇有两个入口系统（**无法判定**分工）
- `js/family-system.js` :: v27.5 家业与闲趣批 · 家业系统（新文件 family-system.js） · 设计方案 G 引擎：94 立宗族修族谱 · 95 建祠堂 · 96 养儿育女（并入既有子嗣账，不另立门户） · 97 收义子 · 98 乔迁宴 · 99 捡土狗
  机制 493 行 · 里程碑状态机 + 季度日账订阅 + 只读汇总面板 + 存档（StateRegistry 零新 localStorage 键）｜关键数据 `CFG` **20 常量**（CLAN_COST 200 / HALL_COST 400 / ADOPT_COST 60 / BANQUET_COST 120 / **FAMEVT_GAP 90**（一季度一件家事）/ **CHILD_CAP 3**（与 marriage-offspring 同口径）…）；`ORPHAN_NAMES` **6 名**；`_st` **5 键**（clan / hall / dog / banquet 按 siteId / lastFamEvt）；子嗣账直接读 `cd()._children`（纪律②，零新账）
  接口 `window.FamilyHall`（10 个源码行约 28 键，代表 open / foundClan / buildHall / hallRiteTick / adoptChild / pendingOrphanFavor / holdBanquet / takeDog / petDog / familyTick / hasFamily / enmityRows / genealogyHtml / state）+ `window.openFamilyHall`｜入口 `city-facilities/street-life.js:188`（市井烟火菜单里的「🏠 家业名册」按钮，`onclick="FamilyHall.open()"`）｜存档 `StateRegistry.register('familyHall', {version:1})`；事件：无 emit；★订 `timeSystem.onNewDaySubscribe(familyTick)`(:476)
  缺口（口径澄清：`openFamilyHall` **不是**死导出）→ `window.openFamilyHall`(:491) 在 js/ 内无外部调用方，但命名空间口 `FamilyHall.open` 被 `street-life.js:188` 的 onclick 字符串点名 ⇒ 家业名册的入口在**市井烟火总门**里，不在修炼面板
  缺口 `:440` 面板尾注「生儿育女在修炼面板『道侣子嗣』」——本文件只**读** `_children`、不生不养（纪律②），所以「96 养儿育女」这条设计实际由 `npcs/marriage-offspring.js` 承担，本文件是纯消费方（与头注「并入既有子嗣账，不另立门户」一致，但 §0.2 职责行把 96 列在本文件名下容易误读）
  缺口 头注纪律④称恩仇簿「只读三本账，零新状态」→ 实测本文件 `_st` **5 键里没有恩仇簿相关字段**，只有 `enmityRows` / `enmityHtml` 两个渲染函数现读 GoodDeeds / NpcCrime / CaseSystem ⇒ 纪律成立，是正面样本
  缺口 `_import`(:448-470) 同样做了坏账剔除（没立宗却有祠堂 = 剔除、`banquet` 最多收 30 条、`lastFamEvt` 未来日戳夹回今天），但 `d0 = absDay()`(:450) 取了值**只用于 :469 一处**，`clan.day` / `hall.day` / `dog.day` 的日戳**不做未来夹取**（与 `grand-legacy.js` 同款，**疑似**）
  缺口 `:98 houseSite()` 读 `window.playerHouse.location`，而 `house-system.js` 的洞府位置真源是 `CAVE_SITES`/`getHouseSite`、`house-panel.js` 另有 `_site()` ⇒ **洞府位置四种读法**（与 §0.2 `house-system.js` 条目已记的「一个洞府位置三处读法」同族，本处是第四处）
- `js/global-utils.js` :: 仙路长青 - 全局工具函数与命名空间（v7.2 修复） · 本文件解决以下结构瑕疵： · 1. 函数重复定义与覆盖 · 2. 全局变量命名冲突 · 3. 数据访问接口不一致 · 4. 跨文件依赖引用 · 加载顺序：第0层（所有其他文件之前）
  机制 915 行 · 底座层（命名空间 + 数据访问层 + UI 壳 + 工具函数，无游戏状态、无事件总线、无持久化账）｜关键数据 `window.XianXia` 下挂 **29 处**命名空间成员（`fmt` / `showMessage` / `esc` / `Modal` / `showToast` / `showConfirm` / `showLoading` / `hideLoading` / `notifyResult` / `DataManager` / `UI` / `Utils`）；★`REALM_ORDER` **12 项**（凡人→渡劫→飞升→金仙，:899，注释 :893-897 明说这是「境界档位表的唯一权威口径」）；`ATTRIBUTE_KEY_MAP` / `ATTRIBUTE_EN_TO_CN` 中英双写表；`STATIC_PANEL_IDS` 3 键（battle-modal / reincarnation-modal / entity-competition）
  接口 30+ 个 window 全局，代表：`XianXia.DataManager`（**全项目金钱真源**，另在 :542 挂 `window.DataManager` 别名）/ `saveToStorage`（写盘失败必告警，79 处外部调用）/ `showMessage` / `esc`（**全库唯一 escapeHtml**）/ `showModal` + `XianXia.Modal`（栈式注册 + `Modal.adopt` 收编存量弹层）/ `closeModalSoft` / `closeRuntimeModals`（22 处外部调用）/ `showChoiceDialog` / `coalesceRender`（渲染刹车，rAF 合帧）/ `placeKey` / `samePlace`（DES-57 地名唯一一把尺，10 + 2 处外部调用）/ `syncCharAttrsFromMain` / `setMainAttribute` / `addMainAttribute` / `installWalletMirror` / `setCurrentCharData` / `getCurrentCharData` / `getLifeSkill` / `growLifeSkill` / `giveWithReceipt` / `realmIndex`（125 处外部调用，全项目最热）/ `realmAtLeast`（16 处）｜事件：★唯一的 emit 在 `growLifeSkill` 里 `lifeSkill:grew`(:856)
  ★缺口 1（实测：`lifeSkill:grew` 零订阅）→ `:855-856` 是本文件唯一的 EventBus 发点，实测 `'lifeSkill:grew'` 在 js/ 内除本文件外 **0 处 `.on`** ⇒ 生活技能升级**不进任何日志/传闻/成就/图鉴**（对比 `js/time-system.js` 的 `newDay` 40 个订阅方）
  ★缺口 2（实测：`REALM_ORDER` 是权威口径，而 `js/combat-stats.js` 有两份更短的抄本）→ 本文件 :893-897 的注释已逐条登记「一份把炼气抄成练气、一份含真仙、还有几份排在渡劫就断了…逐本登记在 FIX_NOTES」。实测 `combat-stats.js:97 _REALM_ORDER` 只有 **9 项**、`:384 REALM_TIERS` 只有 **10 项**，两处都排在渡劫断 ⇒ 已登记未修，实测后果见 combat-stats 条目（飞升/金仙加成归零）
  缺口 `flushCoalescedRenders`(:49) 导出但 js/ 内**零外部调用**（注释称「需要同步读屏的地方先冲账」，实际没有任何地方冲账）⇒ 合帧渲染只靠 rAF 一条路
  缺口 `window.notifyResult`(:416) 是 `XianXia.notifyResult` 的别名，js/ 内零外部调用（真实调用都走 `XianXia.` 前缀）
  缺口 `:130 initMessageSystem` 与 `:36` 无 rAF 时直调的合帧降级分支都靠环境探测，环境不一致时行为分叉（node 测试桩与浏览器不同）
  缺口 `:642-644` `clamp` / `randomChoice` / `deepMerge` 用 `window.x = window.x || window.XianXia.Utils.x` 兜底——**「谁先加载谁定」**，与 §0.2 已记录的「至少 20 个文件各挂一份同名转发」同族（**无法判定**当前是否还有更早的同名定义盖掉了 Utils 版）
- `js/grand-legacy.js` :: v27.6 大业收官批 · 大业名册（新文件 grand-legacy.js） · 设计方案 H 引擎（压轴）：85 科举 · 86 捐官当城主 · 87 自创功法 · 88 著经立说 · 90 设坛传教 · 91 受封土地公 · 92 称帝建国 · 93 办比武大会
  机制 836 行 · 里程碑状态机（一生一回）+ 弹窗总门 + 日/月自动账 + 存档（StateRegistry 零新 localStorage 键）｜关键数据 `CFG` **36 常量**（7 组：OFFICE/EMP/PREACH/EG/ART/SCRIPT/TOUR）；`EXAMS` **3 场**（乡试/会试/殿试，各带 need/base/cap/en/min/rep/schol/stones 八项）；`RANK_TOP` 3（状元榜眼探花）；`ERA_POOL` **8** 年号 / `SCRIPT_POOL` **5** 经名 / `ART_NAME_POOL` **5** 功法名 / `TOUR_NAMES` **3 组 × 4 对手**；`_st` **14 键**运行账；登基大典**六步仪程**（劝进→筑坛告天→加衮冕→改元→册礼→大赦），钱到第 6 步才扣
  接口 `window.GrandLegacy`（14 个源码行，约 45 键，代表 open / sitExam / takeOffice / proclaimPanel / doProclaim / doPreach / doEarthgod / doCreateArt / writeScripture / startTourney / settleTourneyFight / dailyTick / state）+ `window.openGrandLegacy` + `window.settleTourneyFight`｜入口 `cultivation.js:522-529`（修炼面板按钮）与 `core/scenario-engine.js:529`（`eff.grand.op === 'open'`）｜存档 `StateRegistry.register('grandLegacy', {version:1})`；战斗结算被 `app.js:5636`（胜）/`:5900`（败）按 `currentBattle._isTourneyFight` 成对调 `settleTourneyFight`｜事件：无 emit；★订 `timeSystem.onNewDaySubscribe(dailyTick)`(:783)
  缺口（口径澄清：`masteredCount` **不是**恒为 0）→ `:383 masteredCount()` 逐条遍历 `skillPages`（排除 `merged_`/`legacyart_` 前缀）并用 `KnowledgeSystem.canEquip(sk.id)` 判定（:394），`learnedSecrets` 兜底（:395）⇒ 它统计的是**已学会**而非「精通」。但 `CFG.ART_NEED_MASTERED = 3` 的键名与 `:406` 的提示文案「掌握的功法不足 N 门」「没吃透三家」都写「掌握/吃透」⇒ **键名与文案说精通、代码数已学会**（口径不符，非功能失效）
  缺口 `:8` 纪律③称自创功法靠「`rehydrateMergedSkills` 重载回册」实现，但 `rehydrateMergedSkills` 这个名字**在本文件内 0 处出现**（只在注释里）；实际走的是 `:456 registerArt` → skillPages + KnowledgeSystem.unlock + `localStorage['xianxia_merged_skills']` 手写读写（:477-484）⇒ 头注描述的机制与代码实现不是同一条路（**疑似**注释沿用了旧批次的函数名）
  缺口 `:233 _proclaimEra` 年号只存内存（头注自陈「中断重走，钱没扣就不留账」）——玩家在大典第 4 步填好年号后若关掉弹窗，下次从第 1 步重来，**已填年号丢失**
  缺口 `:787 mountTourneyAugment` 为抢在 `city-facilities` 批之后挂 `arena_stage` 增补而补挂 `load` 事件（与 `dynasty-court.js` 的飞升钩子同款），但**没有 `readyState === 'complete'` 之外的兜底重试**；`window.__glTourneyMounted` 一旦被别的代码占用即永久失挂
  缺口 `_import`(:729-770) 做了很严的坏账剔除（科举逐级不跳、没进士官身的城主剔除、没传教的神位剔除、未来月戳夹回本月），但 `d0 = absDay()`(:730) 取了值后**只用于 :769 的月戳夹取**，`examFailYear` / `banquet` 的日戳**不做未来夹取**（**疑似**，未构造复现）
  缺口 `:236 consortOf()` 读 `getDaoCompanionBond()`；若道侣系统不在位则 `consort` 为 null，第 5 步仍能「礼成」，只是中宫虚悬（设计如此，`:280` 已明写）
- `js/house-panel.js` :: house-panel.js — 第一百零一波 · 洞府翻新 · 把「一堆按钮的列表页」改成「一处能走的宅子」： · 甲 布局图：顶部鸟瞰四间屋子（静室/灵田圃/库房/阵工坊），点哪间切哪间 · 乙 屋子页签化：设施/阵法/傀儡从二级弹窗升为「阵工坊」页签一级内容，套娃取消
  机制 839 行 · 纯渲染层（无状态、无持久化、无事件；全部动作转发给 `house-system.js` / `world-map.js`）｜关键数据 无数据表；模块级运行态 5 个（`_tab` 当前页签 / `_plantTarget` 待下种的地号 / `_showTradeUp` 库房置换开关 / `_showRoads` 州界图开关 / `_sitePick` 择址单 {mode:buy|relocate, type}）；**32 处 `onclick` 字符串**驱动全部交互
  接口 `window.HousePanelUI`（15 个源码行）：对外真正被外部调用的只有 3 个——`render(container, shop)`（`app.js:9022`，洞府面板总装）/ `refresh()`（转发 `window.renderHouseStatus`；被 `crafting/compound-ui.js:492` 与 `extensions/fengshui.js:164` 调）/ `selectTab(t)`（`app.js:1611`）；其余 `_setTab` / `_pickPlot` / `_toggleTradeUp` / `_plantAt` / `_toggleRoads` / `_pickSite` / `_cancelSite` / `_siteConfirm` / `_goHome` / `_depart` 是 `_` 前缀的 UI 内部件，由本文件模板的 onclick 自驱｜依赖 playerHouse / `buyHouse` / `relocateHouse` / `plantCrop` / `WorldMap.setOut` / `CaveFacilities` / `FormationSystem`（转发，不持有）｜事件：无
  缺口（口径澄清：11 个 `_` 前缀口**不是**死导出）→ 它们全在本文件 32 处 `onclick` 字符串里被点名（自驱型），这是 §0.2 总账既有的「js/ 内无外部调用 ≠ 按钮点不到」口径
  ★缺口 1（`selectTab` 与 `_setTab` 行为不一致）→ `:780 selectTab(t)` **只改 `_tab` 不刷新**；`:781 _setTab(t)` 改完立刻 `HousePanelUI.refresh()`。而 `app.js:1611` 用的是 `selectTab('jing')` ⇒ 该调用点若不随后自行重渲染，静室页签**会切状态但不重画**（**疑似**：未追 app.js:1611 之后是否有 refresh/render，同族问题见 fengshui.js:164 与 compound-ui.js:492 都会自己调 refresh）
  缺口 `:66`（一百零二波）与 `:358`、`:386`（一百零三波）两段注释描述「洞府在野，脚程走关隘账」「按州界算」，而 §0.2 `house-system.js` 条目已记「洞府位置真源是 `CAVE_SITES`，本文件另有 `_site()`」⇒ **同一处洞府位置两套读法**（`house-panel.js` 自己的 `_site()` vs `house-system.js` 的 `CAVE_SITES`/`getHouseSite`），迁移择地功能落地后两套是否会漂**无法判定**
  缺口 `:807 _goHome` 依赖 `window.WorldMap.setOut`；不在位时退化成一句提示「疆界的账还没就绪」⇒ 回府功能**静默降级**（不报错、不引导）
- `js/house-system.js` :: house-system.js - 洞府系统 v7.1 P0-4 · 购买/升级/储物扩容/修炼加成/灵田种植
  机制 971 行 · 混合（洞府 v7.1 P0-4 + v27.1 灵田雇工：4 个 `====` 大段 — 择地而居/山居营造/地脉/雇工）｜关键数据 `HOUSE_TYPES`（洞府档次）、`HOUSE_CROPS`（灵田作物）、`CROP_GRACE_DAYS`（作物宽限）、`HOUSE_FURNITURE`（家具五行）、`CAVE_SITES` + `SITE_BY_REGION`（择地区）、`UPGRADE_RECIPES`（营造配方）、`playerHouse` 运行态
  接口 `window.playerHouse` + 洞府面板/购买/升级/储物扩容/修炼加成/灵田种植全套口 + `clean`（打扫，发 `clean:completed`）｜依赖 StateRegistry、StateRegistry 白名单、inventory、itemById、timeSystem.onNewDaySubscribe、EventBus、`_qiEncounter`、`CaveFacilities`、`FormationSystem`、`furnitureElement`（fengshui）｜事件：★发 `clean:completed`(:650)（**零订阅**）
  缺口 1（口径澄清：雇工两口**不是**死导出）→ `hireFarmhand`(:740 定义，:895 灵田面板 `onclick` 引用) 与 `fireFarmhand`(:769 定义，:892 面板引用) 都在本文件自驱 ⇒ v27.1 灵田雇工按钮**接得上**
  缺口 `clean:completed` 事件零订阅 ⇒ 打扫洞府不进日志/传闻/成就
  缺口 `house-system.js:686` DES-72 注释自陈「addItem 报的是实收件数。旧写法把返回值丢在地上、田照清」已修 ⇒ 灵田收获曾有丢件病灶
  缺口 本文件的洞府位置真源是 `CAVE_SITES`，而 `extensions/cave-life.js` 读 `getHouseSite`/`isAtHome`/`playerHouse`、`world-map.js` 读 `getHouseSite`、`extensions/cave-siege.js` 读 `isAtHome` ⇒ **一个洞府位置三处读法**（**无法判定**是否全部归一到 CAVE_SITES）
  缺口 本文件与 `extensions/cave-facilities.js`（洞府设施 12 种 + 5 级）、`cave-life.js`、`cave-reception.js`、`cave-siege.js` 共 5 本讲洞府，洞府账分散（**无法判定**是否有单一 owner）
- `js/inventory.js` :: inventory.js - 背包系统 · 借鉴《太吾绘卷》、《觅长生》的背包设计
  - **机制摘要**（**实测 2808 行 / 132 KB**，本目录第二大文件 · 混合：背包运行时 + 使用分发器 +
    结算总线 + 商店 + 装备属性合成 + 面板装饰器）
    **背包运行时** `window.inventory` 实测 **14 个键**：`slots` / `maxSlots` / `currency` / `expanded` /
    `filter` / `searchQuery` / `qualityFilter` / `sortBy` / `favorites` / `batchSellMode` /
    `batchSellSelection` / `markedForSale`(实测是 **`Set`**) / `addItem` / `openShop`。
    新号实测 `slots=[]`、`maxSlots=30`、`currency={copper:100, spiritStones:10}`、`sortBy='count_desc'`。
    `INVENTORY_CONFIG` 实测：`INITIAL_SLOTS 30` / `MAX_SLOTS 99` / `COPPER_PER_SLOT 10`、
    `CATEGORIES` **9 类**（`all`/`weapon`/`armor`/`accessory`/`consumable`/`material`/`secret_art`/
    `quest`/`currency`）、`CATEGORY_LABELS` **9 条**中文名、`FILTER_CHIPS` **7 类**
    （比 `CATEGORIES` 少 `quest`/`currency` ⇒ 这两类**没有筛选按钮**）、`QUALITIES` **11 档**
    （`all` + PIN9..PIN1 + `UNIQUE`）、`SORT_OPTIONS` **8 种**。
    `class ItemInstance`(L68) 是背包格的实例类型；`equippedStatsCache` 实测 3 键
    （`attrs`/`combatBonus`/`special`）。
    **入库口** `addItem(templateId, count)`(L176) 是**全项目唯一入库通道**（`L2644` 注释自陈
    「唯一全局背包入库入口」）：先查模板（查不到写 `window.addItemFailReason='no_template'` 并返 `false`）
    → 按 `maxStack` 填已有格 → 再找空格 → `_settle()` 发 **`item:obtained`** 事件并置
    `window.addItemFailReason`。**运行时实测**：`addItem('pill_small_recovery',1)` → `1`、失败位 `null`；
    `addItem('__no_such_item__',1)` → `false`、失败位 `'no_template'`；
    `addItem('mat_iron_ore',1500)` → `1500`（跨格堆叠正常，货币分文未动）。
    **失败文案体系**（DES-85 的落点）`L2650-2712` 一整套 **6 个**文案函数：
    `addItemFailTextFor` / `addItemFailText` / `addItemReasonTextFor` / `addItemReasonText` /
    `addItemFailPhraseFor` / `addItemFailPhrase`。
    **使用分发器** `useItem(uid)`(L274) 是一个**按 `template.subtype` / `effect` 键分派的大 switch**：
    标记待售拒用 → 模板查不到报「来历不明」→ `implemented === false` 报「尚未实装」→
    突破加成丹（算 `_bbActual` 封顶）/ 疗伤丹（要求走疗伤界面）/ 毒丹 / 止血丹（**无流血伤口时
    拒绝并保留丹**，L368 播「丹未消耗」）/ `root_refine`（调 `window.refineRootByPill`）/
    食物与辟谷丹（`subtype==='food'` 走 `satietySystem`，`pill_fasting` 走 `startFasting(3)`，
    L412-424）/ 通用消耗品（`_potency = 0.85 + Math.random()*0.3` 药力吸收率）/ 秘籍（`learnSecretArt`）。
    `applyConsumableEffect`(L538) 是效果总线（`hp/qi/energy` 按 `maxQi`/`maxEnergy` 夹逼、
    `learn_ability` → `COMBAT_ABILITIES`、六种 `_permAttr` 永久属性、`_foundationBonus`/`_coreBonus`/
    `_primordialBonus`/`_divineBonus` 四个永久加成字段、解毒/解乱、`mood_boost`、
    `lifespan_years` → `extendLifespan`）。
    `learnSecretArt`(L693) 是**研读进度机**：`cd._manualProgress[template.id]` 0→100，每研读
    `_studyMin = 120` 分钟（受 `CaveFacilities.getBuff('player','studyTimeMul')` 缩放），
    长进 `round((12 + 神识*1.6) * (0.8 + rand*0.4))`，进度满 100 才调
    `KnowledgeSystem.learnFromManual` 进 knowledge 账（**秘籍不消耗，可随时续读**）。
    ★`assembleTreasureMap`(L485)：`spec_map_fragment` **集齐 3 片**合成藏宝图，
    掷 `Math.random()` 出四档奖励（150+rand150 灵石 / `mat_five_element_essence` / 40+rand60 小头），
    **L508 裸写 `inventory.currency.spiritStones`**。
    **装备侧** `equipItemFromInventory` / `unequipItemToInventory` / `updateEquippedStats`(L1975) /
    `getFinalAttributes`(L2090) / `getCombatBonuses`(L2110) —— 后两者是**全项目装备/功法加成的汇流点**，
    依次并入 `ArtEffects.attrBonus` / `TalismanSystem.getCombatBonuses` / `ArtEffects.combatBonus` /
    `WildGround.battleMods` / `QinArts.combatBonus` / `sectSignatureCombatBonus` /
    `getRealmBonusPct(realm,key)` / `EquipmentSets.combatBonus`。
    **待售系统**（v10.5）9 个函数：`markForSale`/`unmarkForSale`/`isMarkedForSale`/
    `getMarkedForSaleItems`/`getMarkedForSaleCount`/`clearAllMarkedForSale` +
    三件套数量弹窗（`showMarkForSaleQuantityDialog`/`adjustMarkQty`/`confirmMarkForSale`）。
    `sellItem`(L2201) **已改成拒绝态**：「背包中已不能直接出售物品，请标记后到商铺完成交易」。
    **商店** `openShop`(L2302) + `SHOP_ITEMS` 三档 + `buyFromInventoryShop` +
    数量弹窗三件套（`showBuyQuantityDialog`/`adjustBuyQty`/`confirmBuyQuantity`），
    购买成功会 `MarketDynamic.notePlayerTrade(itemId,qty,true)` 记行情。
    **掉落** `generateLoot(enemyLevel, enemyType, region)`(L2387) + `applyBattleLoot`。
    **身体耐久** `restoreBodyDurability(amount)`(L2426) 逐部位回填并同步 `window._savedDurabilities`。
    **持久化** `saveInventory()`(L2223) 走 `saveToStorage('xianxia_inventory', …)`（在
    `core/game-state.js` 的 37 键白名单里）；`loadInventory()`(L2249) 逐槽重建 `ItemInstance`。
    另 `restoreItemFromSnapshot`(L2715) 是事务回滚用的一格回填（**认领原 uid**，L2736）。
    **面板装饰器** `L1004-1256` + `L1421-2176` 一整块（`_ensureInventoryChrome` /
    `_syncInventoryFilterChips` / `_decorateSlotCard` 等 + 靠读按钮 `onclick` 认职责的
    `_syncInventoryActionButtons`），与 `js/equipment.js:716-981` 那块**同款手法**。
    **导出实测 33 个行囊/商店/待售函数全部在位**（探针 33/33 `typeof === 'function'`）+ 约 60 个 window 全局。
    **事件**：★发 `item:obtained`(L200)；★订无（货币/耐久变化不统一走事件）。
  - **缺口** ★★①**品质排序表被抄了第二份**：本文件 `L1396-1400` 另立
    `QUALITY_RANK`（`PIN9:1 … PIN1:9, UNIQUE:10`）与 `QUALITY_NAMES`（`九品…一品, UNIQUE:'特殊'`），
    **与 `js/items.js` 的 `ITEM_QUALITIES`（含 `order` 与中文名）语义重叠、无单一真源**。
    实测两边对 `PIN9/PIN1/UNIQUE` 的取值一致，但**两份都要手工同步**，且
    `L1416 getQualityColor` 走的是第三条路 `QUALITY_LEGACY_MAP[quality] || quality`。
    ⇒ **同一套品级有 3 套查法**（`items.js:ITEM_QUALITIES.order` / 本文件 `QUALITY_RANK` /
    `L1416 QUALITY_LEGACY_MAP`），且 `items.js` 那条对中文品名会落空（见 items.js 条目缺口①）。
    ②`FILTER_CHIPS` **7 类 vs `CATEGORIES` 9 类**：少了 `quest` 与 `currency`
    ⇒ **任务物品与财货两类在背包里筛不出来**（只能靠搜索框）。
    ★③**`assembleTreasureMap:508` 裸写货币**：
    `window.inventory.currency.spiritStones = (…||0) + n` ⇒ **违反 `STRUCTURE.md:73`
    「银钱必须走 `RewardService`，禁止裸写 `inventory.currency.*`」**
    （与 `core/world-loop.js:144` 傀儡灵石、`core/soul-state.js:143` 重塑肉身、
    `core/daily-events.js:383` 巡夜兜底同族，是本批实测的第 4 处）。
    ④**货币是四套账**：`inventory.currency.{copper,spiritStones}` 与 `currentCharData.copper` 与
    `DataManager`（`items.js` 条目已记 `reward-service` 的读端分歧），而本文件同时写
    `inventory.currency`（L508）与读 `inventory.currency.spiritStones`（L2310）
    ⇒ 本文件内部也是「读 A 写 B」的混用（**无法判定**哪套是当前权威，需 economy 段确认）。
    ★⑤`useItem` 的分派是**逐条 if/else**（不是表驱动），L326 有一个兜底
    「`window.showMessage(template.name + ' 暂无法使用','info')`」
    ⇒ **任何新增的 `effect` 键若忘了加分支，就会静默落到这句「暂无法使用」上**
    （与 `core/scenario-engine.js` 的「表驱动 + reasonMap」是两种风格，记档）。
    ⑥`QUALITY_RANK` 里 **`UNIQUE:10` 排在 `PIN1:9` 之上** ⇒ 「特殊」品级比一品还高一档，
    而 `js/items.js` 的 `ITEM_QUALITIES.UNIQUE.order` 是另一个值（**未核**，两者是否一致无法判定）。
    ★⑦`generateLoot`/`applyBattleLoot` 在**本文件里**（L2387/L2398），而
    `js/items-extended/09-loot-sources.js` 也有一份 `getExtendedLoot`（**未挂载**，见该条）
    ⇒ **同一件事两份实现、一份是死的**（记档，本条为活的那份）。
    ⑧`L2727-2741 restoreItemFromSnapshot` 的空位查找是「第一个 `null`；没有就 `slots.push(null)`
    再取末位」⇒ **不检查 `maxSlots`** ⇒ 事务回滚可能把格子数顶过 `maxSlots`（疑似，记档）。
    ⑨装饰器同样靠 DOM 嵌套 + 读 `onclick` 字符串认按钮职责（L1180），
    `catch(e){}` 吞异常 ⇒ 改 `仙侠.html` 面板结构会静默破掉（与 equipment.js 同款）。
    ⑩`window.sellItem`(L2764) 导出的实现是**拒绝态**（L2204），而 UI 上仍可能有「出售」按钮
    ⇒ **疑似死按钮**（`getFilteredSlots` 是否还渲染出售入口**未核**，需看 L1448-1500 的 actions 拼装）。
- `js/items-extended.js` :: 仙路长青 - 扩展物品系统 v1.0 · 主入口文件 - 合并所有子类别数据并导出到全局 · 子文件加载顺序：pills > weapons > armor > materials > talismans > arts > food > special
- `js/items.js` :: 仙侠世界 - 物品系统 · 借鉴《太吾绘卷》、《觅长生》等仙侠游戏的物品设计
  - **机制摘要**（**实测 773 行** · 纯数据表 + 两张规范化表 + 4 个查询函数）
    本文件是**物品总表的正典**：`window.allItems`（实测 **538** 条）与 `window.itemById`（**576** 键）
    在此声明，后续 `js/items-extended/` 的 17 个子文件往这两个对象上追加。
    **5 张原始分类表（实测条目）**：`weapons` **71** · `armor` **128** · `consumables` **102** ·
    `materials` **69** · `secretArts` **52** = **422 条**（全部实测在 `allItems` 里；
    `allItems` 538 − 422 = **116 条**来自 items-extended 侧）。`L719-732` 把 5 张表拼成
    `allItems` 并建 `itemById`。
    **两张规范化表（★本文件的核心机制）**：`QUALITY_LEGACY_MAP` **6 键**
    （`COMMON→PIN9` `UNCOMMON→PIN8` `RARE→PIN7` `EPIC→PIN5` `LEGENDARY→PIN3` `MYTHIC→PIN1`）
    配 `normalizeQuality(q)`；`GRADE_LEGACY_MAP` **5 键**（`凡品→九品` `良品→八品` `珍品→七品`
    `优品→五品` `仙品→三品`）配 `normalizeGrade(g)`。`ITEM_QUALITIES` 实测 **16 键**
    = `PIN9..PIN1`（9）+ `UNIQUE`（1）+ 6 个英文旧键（L35 用
    `forEach` 把旧键**指向同一份定义对象**，注释自陈「旧键指向同一份定义，任何
    `ITEM_QUALITIES[旧串]` 查表都不落空」）。`ITEM_CATEGORIES` **6 键**
    （`EQUIPMENT`/`CONSUMABLE`/`MATERIAL`/`QUEST`/`SECRET_ART`/`FORMATION`）。
    `EQUIPMENT_SLOTS` **11 键**（`HEAD`/`NECK`/`BODY`/`WAIST`/`HANDS`/`FEET`/`MAIN_HAND`/`OFF_HAND`/
    `RING1`/`RING2`/`ACCESORY`）。`qualityOrder(q)` 是唯一的排序口，实测 `PIN9→1`、`PIN1→9`、
    未知串 `→0`。4 个查询函数实测样本：`getItemsByCategory('equipment')` = **216** 条 ·
    `getItemsByCategory('qq')` = **空数组** · `getItemsByQuality('PIN9')` = **99** 条 ·
    `searchItems('丹')` = **59** 条。导出 20 个 window 全局。**事件**：无。
  - **缺口** ★★①**中文品名与 PIN 码之间没有任何通路**：`GRADE_LEGACY_MAP` 把
    `凡品→九品`（中文→中文），而 `QUALITY_LEGACY_MAP` 只收英文 6 键（英文→PIN 码）——
    两张表**互不相交**。**运行时实测**：`normalizeQuality('凡品')` → **`'凡品'`（原样返回）**
    ⇒ `qualityOrder('凡品')` → **0**，即所有中文品名一律落到「未知/最低」档。
    而 `js/inventory.js:1416` 用的正是 `QUALITY_LEGACY_MAP[quality] || quality`
    ⇒ 遇到中文品名时同样原样穿透，后续查表落空（**后果**取决于 inventory.js 那段，未核）。
    实测缓解事实：**全仓零物品使用中文品名**（`quality:'(凡品|良品|珍品|优品|仙品|九品|…)'` 0 命中）
    ⇒ 这条坑现在不发作，但 `GRADE_LEGACY_MAP` + `normalizeGrade` 是**为一个不存在的输入准备的整条死链**。
    ★②**死导出 4 个**（实测 js/ 内 0 外部引用）：`GRADE_LEGACY_MAP` · `normalizeGrade` ·
    `ITEM_QUALITIES` · `ITEM_CATEGORIES` · `EQUIPMENT_SLOTS`
    ⇒ **`EQUIPMENT_SLOTS` 这张 11 槽表没人用**，真正在用的是 `js/equipment.js` 的
    `equipmentSlots`（**12** 条）⇒ **两套槽位表 11 vs 12 不一致**，`EQUIPMENT_SLOTS` 把
    饰品收敛成单个 `ACCESORY`，而 `equipment.js` 拆成 `acc1`/`acc2`；命名风格也不同
    （`MAIN_HAND` vs `mainHand`）；且 `EQUIPMENT_SLOTS` 的 `ACCESORY` **拼写少一个 S**
    （应为 `ACCESSORY`，记此，因它是死表所以无实际症状）。
    ③`ITEM_QUALITIES` 的 16 键里有 **6 个是镜像出来的英文旧键**，而实测
    **没有任何物品使用这 6 个英文品级** ⇒ 它们只为「查表不落空」而存在。
    真正被用的第 10 个键是 **`UNIQUE`**，全仓唯一使用者是
    `js/items-extended/17-lead-tokens.js:12`（36 枚主角信物）⇒ **「特殊」品级是独占的一条支线**，
    与 `PIN1..PIN9` 九档**不在同一排序体系里**（`qualityOrder('UNIQUE')` 落在 `ITEM_QUALITIES.UNIQUE`
    的 order 上，与 PIN 序列的关系**未核**）。
    ★④**`getItemsByCategory` 认不出 `'equipment'` 小写串**：实测传 `'qq'` 返回**空数组**而非 null/报错，
    说明它是纯 filter、无未知值守卫 ⇒ 传错大小写**静默返回空**（实测 `'equipment'` 能出 216 条，
    说明真实 id 是 `'equipment'` 小写，而 `ITEM_CATEGORIES` 的键是 `'EQUIPMENT'` 大写
    ⇒ **常量表用大写、物品数据用小写，两套大小写**，记档）。
    ⑤`allItems` 538 与 `itemById` **576 键差 38**（差额全在 items-extended 侧，
    见该目录批次汇总：`tal_*` 15 + `fmt_*` 7 + `pup_*` 16 只进 `itemById`）
    ⇒ **本文件声明的正典与实际注册表已经不一致**，按 `allItems` 遍历的界面看不到这 38 件。
    ⑥`itemById` 由 `L728-732` 的 `forEach` 一次性建成，**不做重复检测**
    ⇒ 后加载的 items-extended 若注册同 id 会**静默覆盖**（实测当前无重复，`dup_defs_in_allItems` 为空）。
- `js/lifespan-system.js` :: lifespan-system.js - 寿命系统 · 寿元概念、修炼增加寿元、时间不可逆 · 加载顺序：在 time-system.js 之后 · v20.40 做深：历法口径对齐世界历（360 日一年）；凶兆分四档（一年/百日/三十日/十日
- `js/location-system.js` :: location-system.js - 城市/建筑系统 · 管理城市进入和建筑交互
  机制 2630 行（46 个 `====` 段，含 city-life.js 城市生活化系统）· 混合（城市真源 + 建筑分发表 + 面板渲染 + 存档）｜关键数据 ★`BUILDING_TYPES` **51 类**（初测 49 类，审计期间被并发批次新增 2 类；本条数字会随其他代理改动漂移，以实测当日为准）、`COMMON_SERVICE_BUILDING_IDS`（3 铺置顶）、★`cityData` **23 城**（每城 buildings/specialFeatures/specialties/specialNPCs/events/priceModifier/bonus/desc/accessLevel/region）、`CN_LAYER`、`CITY_ATMOSPHERE` + `DEFAULT_ATMOSPHERE`（分城氛围）、`CITIZEN_NAMES` / `CITIZEN_OCCUPATIONS` / `CITIZEN_GOSSIP`（市民与闲话池）、`visitedCities`、`buildingCooldowns`、`buildingClickGuards`
  接口 `window.locationSystem`（`enterCity` / `getCurrentLocation` / `getCityData` / `getAllCities` / `triggerSpecialFeature` / `unlockTeleport` 等）+ 自身挂 `renderCityBuildings`（:690-740 内联调 6 个 `panelHtml` 钩子）+ `getCurrentCityName`｜依赖 EventBus（发 `location:visited` :461/:2309）、`getReputationPanelHtml`、`FestivalFair`/`StreetStall`/`CityLodging`/`CityJobs`/`StreetLife` 五个 `panelHtml` 钩子、`scenarioEngine.executeFacilityAction`、`app.js` 的 `BUILDING_ACTIONS`、sectsData、showMessage｜事件：★发 `location:visited`（3 处 emit，全项目最多）
  ★缺口 1（实测：cityData 23 城 × 5 字段全部唯一，与两张「城账」形成反差）→ `location-system.js` `cityData` 的 `specialFeatures` / `specialties` / `specialNPCs` / `events` / `bonus` **五项实测 23/23 城全唯一**（`buildings` 亦 23/23 唯一）；而 `reputation-system.js` 的 `CITY_SPECIAL_QUEST_TEMPLATES` 只有 3 个模板 23 城复用、`SECRET_ARTS_BY_CITY` 只有 `default` 一个键 2 部功法（详见 reputation 条目）⇒ **同一套「千城千面」的表，一处做满一处留空**
  ★缺口 2（同一段里三套数字，全过时）→ `location-system.js:70` 头注写「城市数据（v6.0 增强版 - **16 城市**差异化）」，紧接 `:71` 的 v21.4 注释写「**19 座**人间城的建筑清单按城市性格重裁」，而实测 `cityData` 是 **23 城** ⇒ **连续两行写着 16 与 19 两个互相矛盾的旧数，实数是 23**
  ★缺口 3（档位表缺两境，同源三处）→ `location-system.js:502` DES-92 「本函数旧写法只认自己抄的这 9 档——渡劫之上还有飞升、金仙」；`:1429` 同款 ⇒ 本文件与 `enhanced-shop.js:1815` 是同一处境界档位表被抄三份的病灶
  ★缺口 4（口径澄清：三组九个动作口**不是**死导出）→ `_palaceAudience`(:1194) / `_palaceGift`(:1205) / `_palaceSneak`(:1210) / `_prisonVisit`(:1240) / `_prisonBribe`(:1264) / `_prisonBreak`(:1278) / `_swordComprehend`(:1573) / `_swordPull`(:1578) / `_swordChallenge`(:1588) 九个 `window` 口在 js/ 内**无外部调用方**，但每个在本文件内都有「定义 + 面板 `onclick`」两处引用 ⇒ 皇宫/天牢/剑冢三组按钮是**自驱型**接线（且全部走 `window.X && window.X(...)` 守卫式调用，函数未加载时**静默不响应**）
  缺口 `:1107` 注释自陈「旧写法无条件再叠 20 分钟：成行双扣（观星一次 60+20），**被拒也照扣**」已修；`:1212`/`:1383` 两处 DES-86/DES-72 同款丢返回值已修 ⇒ 本文件历史上至少 5 处时间/发货病灶
  缺口 `:534-537` 注释自陈「先确保 cityPanel 存在…导致 line 359-363 的更新被覆盖（**首次进入城市看到占位符**）」已修 ⇒ 面板初始化顺序曾有竞态
  缺口 `:1619` 注释自陈「v20.7 珍珠市场专属货架（**旧版是一段空 if 死代码** + 泛货架）」已修
  缺口 本文件同时挂 `getCurrentCityName`（全项目至少 20 个文件各挂一份同名转发）⇒ 最高频的同名全局之一
- `js/loot-system.js` :: 战利品系统 v1.0 · 核心原则：战斗胜利不掉落物品，物品通过搜刮(人类)或解剖(动物)获得 · 敌人携带物在生成时预设，由其类型/身份/等级决定
  - **机制摘要**（**实测 605 行 / 21.5 KB**（`Measure-Object -Line` 数出 552，差 53；本条以 Python 逐行读的 605 行为准）· 数据表 + 纯派生（无状态、无持久化、无事件、无 UI）｜**实测骨架数字**：顶层 `function` 声明 **6 个**（`weightedPick`:341 / `randomPick`:353 / `determineEnemyType`:360 / `pickItems`:432 / `generateEnemyInventory`:503 / `getBeastMaterialDescription`:589）、顶层 `var/const` **16 个**、顶层 `window.` 赋值 **7 处**（L599-605）、`====` 分节头 **11 处**；运行时实测引入 **10 个 window 键**（7 个显式 + `weightedPick`/`randomPick`/`ABILITY_MANUAL_IDS` 三个由顶层 `function`/`const` 声明自动挂全局））
    ① 敌人类型常量（L7-20）：`ENEMY_TYPES` **12 值**（bandit / normal_human / elite / boss / beast / demon_beast / boss_beast / dungeon_guard / dungeon_boss / undead / construct / elemental）。
    ② 12 张携带物表（L25-336）：每张 `common`/`uncommon`/`rare` 三档 + `minLevel` + `spiritStones{min,max}` + `spiritStoneChance`。实测条目数 **139**、不重复物品 id **93**（重复 33 个 id）；**无空品质池**；逐档规模 common/uncommon/rare = bandit 6/6/3、normal_human 5/6/5、elite 5/7/8、boss 6/7/7、beast 4/2/1、demon_beast 3/2/3、boss_beast 2/3/4、dungeon_guard 4/4/4、dungeon_boss 4/6/6、undead 2/2/2、construct 1/1/2、elemental 1/3/2。**139 个 id 全在物品表 576 件里查得到，且 4 条毕业装梯 43 件也与主表零重叠**（本项为核实通过，非缺口）。
    ③ 类型判定（L360-411 `determineEnemyType`）：五级瀑布 —— 生理类型（undead/construct/elemental）→ 名称关键词（BOSS/首领/霸主/妖王/龙王、守卫/守护/护法、山贼/流寇/土匪/强盗/匪徒/马贼）→ `species==='beast'`（含精英/妖兽判定）→ `type` 字段 → 兜底 `normal_human`。
    ④ 选取（L432-486 `pickItems`）：等级低于 `minLevel` 走「给少量 common」分支；否则 `availablePools` 按 `level>=5` 推 uncommon、`level>=10` 推 rare；common 必给 1~2 件、uncommon 50% 给 1 件、rare 按 `boss系 ? 0.6 : 0.2` 给 1 件。
    ⑤ 生成（L503-585 `generateEnemyInventory`）：`pickItems` + 灵石（`min/max × level`，掷 `spiritStoneChance`）+ **v13.1 秘籍掉落**（`:532-544`，持绝技者每项 12% 掉对应秘籍，金蚕蛊/采补减半 6%，上限 1 本）+ **v20.95 毕业装四档梯**（`:547-563`，六品 15+ 精英/boss 25%、四品 20+ boss 18% 或灵脉一重 12%、二品 26+ boss 12% 或灵脉二重 20%、一品灵脉三重 35% / 30+ 秘境 boss 10% / 33+ boss 6%）+ **扩展掉落表叠加**（`:567-582`，`window.getExtendedLoot` 接 `beast/elite_beast/boss_beast/bandit/dungeon_guard/dungeon_boss` 六个子类）。
    接口 `window.LOOT_TABLES`/`GRAD_LOOT_BANDS`/`ENEMY_TYPES`/`ABILITY_MANUAL_IDS` + `determineEnemyType`/`generateEnemyInventory`/`pickItems`/`getBeastMaterialDescription`/`weightedPick`/`randomPick`｜依赖 `window.getExtendedLoot`（`js/items-extended/09-loot-sources.js`）、`enemyData._leyElite`、`enemyData.combatAbilities`｜事件：★无 emit、无订；**本文件是纯生成器**，唯一的生产侧调用方是 `js/battle.js`（搜刮/解剖时读敌人账）
  - **缺口** ★①（对应已知线索，**成立且比线索更严重**）**品质档在 `level>=10` 就彻底冻结，20 层以上与 10 层完全同构** → 实测 `pickItems` 每档跑 6000 次（boss 池）：`L10` 均 1.50 件、全 common；`L15` 均 2.51 件（c8456/u2995/r3617）；**`L15` 到 `L99` 九个档位的三档计数与件数均值全部同量级（L15 c8456 / L99 c8446，u2995/2996，r3617/3604）** ⇒ 化神以上（level 30+）的掉落结构与筑基期（level 15）**完全一样**。机制原因：`:478 rareChance = boss系 ? 0.6 : 0.2` 是**常量、与 level 无关**；`availablePools` 在 `level>=10` 后不再增长；三档各自的 `minLevel` 门槛（boss 15 / elite 8 / dungeon_boss 18 / boss_beast 20）只控制**档位是否整体开启**，不控制档内梯度。另实测 `demon_beast`/`undead`/`elemental`/`construct` 六表 `spiritStones{0,0}` + `spiritStoneChance 0` ⇒ **解剖系敌人一件灵石都不掉**（beast/demon_beast/boss_beast/undead/construct/elemental 六张表实测全为 0）
  - **缺口** ★②（对应已知线索，**成立**）**掉落表 139 条目只对应 93 个不重复物品（全表 17.3% 重复 ⇒ 实测 33 个 id 重复出现）** → 重复 TOP：`mat_chaos_stone` **×6**（boss.rare / boss_beast.rare / dungeon_guard.rare / dungeon_boss.rare / undead.rare / elemental.rare）、`mat_phoenix_feather` ×4、`mat_sky_iron` ×4、`pill_big_recovery` ×3、`pill_qi_return` ×3、`pill_qi_condense` ×3、`mat_demon_beast_bone` ×3、`mat_star_iron` ×3。⇒ **「 chaos 石掉哪都有、六档里五档都能出混沌石」**，高阶稀有物的稀缺性被摊平（139 槽位里 46 个是重复 id 的第二份以上）
  - **缺口** ★③`:454` 的运算符优先级让「20 层以上加开 rare」这行**判错且即使判对也是 no-op** → 源码 `if (level >= 20 && poolId === 'boss' || poolId === 'dungeon_boss' || poolId === 'boss_beast')`，JS 里 `&&` 优先于 `||`，实际解析为 `(level>=20 && poolId==='boss') || poolId==='dungeon_boss' || poolId==='boss_beast'`。实测优先级分歧组合：**`dungeon_boss` 与 `boss_beast` 在 level 5/15/19 时实际=true 而作者本意=false**（低等级秘境 BOSS 与 BOSS 野兽也算命中）。但无论 true/false，`:455` push 的是 `availablePools` 里 `:453`（`level>=10`）**早已推入的同一个 `'rare'` 字符串**，而后续只做 `availablePools.includes('rare')` ⇒ **整行对最终掉落零影响**，纯属误导性死代码
  - **缺口** ★④`randomPick`(:353) 是死函数 —— 实测全仓 `[call()]` 只有它自己的定义那 1 处，**js/ 内零调用、零外部引用**（也未挂 `window`，靠顶层 `function` 声明自动挂全局但没人用）
  - **缺口** ★⑤`getBeastMaterialDescription`(:589) 是死导出 —— 实测全仓 `[call()]` 仅定义处 1 处，**js/ 内零调用** ⇒ 那套「传说级龙族材料/凤族/麒麟/妖兽/普通野兽」文案玩家永远看不到（同一函数还把 `name.includes('龙')` 排在最前，而 `BOSS_BEAST_LOOT` 那类「炎魔/蛟龙」名字都含「龙」）
  - **缺口** ⑥`ABILITY_MANUAL_IDS`(:491) 的 9 条映射实测**秘籍 id 全部在册**（`manual_venom`=万毒真经 / `manual_lifesteal`=血煞魔功·残篇 / `manual_reflect`=铁体功 / `manual_soundwave`=摄魂音律 / `manual_illusion`=迷魂宝录 / `manual_escape`=遁术要诀 / `manual_drain_qi`=采补密录 / `manual_gu_parasite`=金蚕蛊经 / `manual_sword_burst`=剑气纵横诀，`implemented` 全为 `undefined` 即视为已实装）—— 核实通过，但**这个常量自身零外部引用**（只在 `:536` 被本文件读），而它头注说「与 `items-extended/14-ability-manuals.js` 对应」⇒ **两侧是两份手写清单，无一致性断言**（若将来那边加一本秘籍而这边不加，该绝技就永远掉不出秘籍）
  - **缺口** ⑦`:547-563`（毕业装梯）与 `:567-582`（扩展表）**整段包在 `try{}catch(e){}` 空 catch 里** ⇒ 梯子取值/扩展表取值的任何异常都被静默吞掉，玩家看不到任何提示（`tools/验收/空catch分诊基线.json` 实测收录了本文件 `generateEnemyInventory` 2 处）
  - **缺口** ⑧`determineEnemyType` 的关键词表把 `'妖兽'` 归到 `DEMON_BEAST`（`:389`），而 `boss_beast` 表只能靠名字含「龙/王/霸」或 `species==='beast' && type==='boss'` 进入 ⇒ **一只名字里带「妖兽」的普通野兽会拿到妖兽表的掉落梯度（minLevel 5、灵石 0）**，而真 BOSS 野兽要靠名字关键词，**判定口径与表的分档意图不完全对齐**（`boss_beast` minLevel 20 是全表最高，但 `:377` 判它时并不看等级）
  - **缺口** ⑨`LOOT_TABLES`/`GRAD_LOOT_BANDS` 作为 window 全局**只被测试读**（实测 `[dot-ref]` 全仓 3 处 / 9 处，`js/` 内零引用，仅 `tests/wave129-chest-ghost-node.js`、`tests/wave142-fix-wiring-node.js`、`tests/v20.95-grad-loot-node.js` 与 `js/app.js` 1 处）⇒ 运行时它们不被游戏代码读，是给测试与调试用的导出（`js/app.js` 那 1 处 `GRAD_LOOT_BANDS` 引用本批**未追**，**无法判定**用途）
- `js/mail-system-ui.js` :: mail-system-ui.js - 飞鸽传书UI模块 v12.0
  - **机制摘要**（**实测 821 行 / 43.3 KB**（`Measure-Object -Line` 数出 760，差 61；本条以 Python 逐行读的 821 行为准）· 纯 UI 渲染 + 面板宿主动态建（无状态账、无持久化、无事件发射）｜**实测骨架数字**：整文件是一个 IIFE，故**顶层 function 声明 0 个 / 顶层 window 赋值 0 处**；IIFE 内 **`function` 声明 45 个**、**模块级 `var` 状态 5 个**（`_activeTab`(:124) / `MAIL_PAGE_SIZE`(:225) / `_listPage`(:226) / `_LIST_NOTE`(:237) / `_EMPTY_TEXT`(:244)）、`====` 分节头 **8 处**；运行时实测只往 window 挂 **1 个键** `MailSystemUI`（**31 个方法**，见接口行）
    ① 飞行物动画（L14-86）：`flyInPigeon`(:15，按钮坐标飞鸽入画) / `dropJadeScroll`(:47，玉简落地) / `showMirror`(:58，灵镜全屏镜影) / `closeMirror`(:71)，共用 `ensureContainer`(:76) 动态建容器。
    ② 托盘通知（L87-102）：`showToast(text, type)`(:91)，4 档配色。
    ③ 未读角标（L103-122）：`updateUnreadBadge`(:104) 读 `#mailInboxBtn` 与 `MailSystem.getUnreadCount()`。
    ④ 收件箱面板（L123-507）：`openInbox`(:126) → `ensureInboxPanel`(:179，**动态建 `#mailInboxPanel`/`#mailInboxScrim`/`#mailInboxList`/`#mailDetailPanel`**）；`showTab`(:159) 是标签高亮与内容的唯一结算口；分页 `listPage`(:227) + `MAIL_PAGE_SIZE = 50`(:225)；`renderInboxList`(:285) 三档列表（inbox/outbox/favorites）+ `_pending` 只读计数、`carrierIcon`/`importanceClass` 两张映射表；空态 `_emptyStateHtml`(:262)、载入失败态 `_loadFailHtml`(:276)；`openMail`(:393) 详情 + `closeMail`(:454)、`toggleFav`(:465)、`askDeleteMail`(:472)/`keepMail`(:477)/`deleteMail`(:483)。
    ⑤ 窗内信纸（L508-681，UI-01）：`mailBodyCap`(:500，**从 `MailSystem.MAIL_BODY_CAP` 现读不另立一份**）、`_paperFit`(:514)、`_carrierBrief`(:522)/`_carrierRowHtml`(:531)/`_carrierNote`(:548)（资费与路速都现读 `MailSystem.CARRIERS`）、`_letterSubject`(:553)；`openSheet`(:560)/`onSheetInput`(:594)/`pickCarrier`(:622)/`sendSheet`(:634)/`sendCompose`(:650)/`sendReply`(:661)/`replyMail`(:674)/`writableRecipients`(:687)/`renderComposeInto`(:710)/`composeTo`(:736)。
    ⑥ 家书邮路（L682-742，第七十六波）：主动写信的门。
    ⑦ 整合 NPCLifeSystem（L743-754）：`showArrivalAnimation(mail)`(:744) 按 `mail.carrier` 分派五种动画。
    ⑧ 轮询（L793-820）：`setInterval(startPeriodicUpdate, 5000)`(:801) —— 5 秒一次推进待收邮件 + 刷未读角标 + 刷人物页速览（`updateQuickStatus`:804）。
    接口 `window.MailSystemUI` **31 键实测**（`openInbox`/`closeInbox`/`showTab`/`showTabBtn`/`listPage`/`listPageBtn`/`openMail`/`closeMail`/`toggleFav`/`deleteMail`/`askDeleteMail`/`keepMail`/`replyMail`/`composeTo`/`openSheet`/`onSheetInput`/`pickCarrier`/`sendSheet`/`sendCompose`/`sendReply`/`writableRecipients`/`renderComposeInto`/`updateUnreadBadge`/`showArrivalAnimation`/`showToast`/`flyInPigeon`/`dropJadeScroll`/`showMirror`/`closeMirror`/`renderInboxList`/`formatTimeShort`）｜依赖 `window.MailSystem`（**本文件对它有 29 处引用**，是头号消费方）、`npcManager.getNPC`、`timeSystem.gameTime.totalMinutes`｜事件：★无 emit；★反向调 `MailSystem.markRead/deleteMail/toggleFavorite/getUnreadCount/checkCarrierAvailability/playerSendMail/playerReply/advancePendingMail`
  - **缺口** ★①**`MailSystem.send` / `sendNPCMail` 的对外口径与 UI 按钮不一致：UI 的写信/回信/再写一封三条路都走 `MailSystem.playerSendMail`，而 `playerSendMail` 把 `importance` 硬编码成 `'normal'`** → 实测 `mail-system.js:449`（`playerSendMail` 内）、`:327`（`playerReply` 内）、`:414`（`sendAutoReplyFromNPC` 内）**三处都写死 `importance: 'normal'`** ⇒ **玩家写出去的信与 NPC 回信全部落在「一般」档**，`IMPORTANCE` 表的 urgent/important 两档**只可能由 `sendNPCMail`(:482) 那条内部口产生**（而它被 `npcs/npc-life-system.js` 6 处 + `npcs/jealousy-deep.js` 2 处调用）。玩家侧无路可主动发紧急/重要信（UI 的 `importanceClass`/`mail-badge`(:304/:318-319) 三档渲染因此对玩家信永远只出「一般」样式）
  - **缺口** ★②**`CARRIERS[].dailyLimit` 五个值（飞鸽 3 / 灵镜 2 / 玉简 3 / 传音符 999 / 灵兽 5）全仓零消费** → 实测 `dailyLimit` 在 `js/` 内只出现在 `mail-system.js` 自己的 5 行声明处（`:28/:38/:48/:58/:70`），`checkCarrierAvailability`(:109-138) 与 `playerSendMail`(:419-476) **都不查它**；另 `js/core/balance-config.js:10` 与 `js/gameplay/arena-system.js` 那几处 `dailyLimit` 是**同名不同物**（NPC 互动 / 比武日限）⇒ **飞鸽「每日三封」这条写在表里的限制从未生效**，玩家可无限发信
  - **缺口** ★③**`IMPORTANCE` 表的 `popup` / `sound` / `color` 三个字段全仓零消费** → 实测 `popup:` 与 `sound:` 各只在 `mail-system.js:79-81` 声明处出现 1 次（3 档 × 2 字段），`color` 同理；`showArrivalAnimation`(:744) 只按 `mail.carrier` 分派、**不看 `mail.importance`** ⇒ 「紧急件弹窗 + 响铃」这条设计在代码里**没有任何执行点**
  - **缺口** ★④`mail-system.js:167` 的 `var carrier = CARRIERS[opts.carrier || 'pigeon']` 在载具名写错时**得到 `undefined`，下一行 `:173 carrier.baseDelayMin` 立刻抛 TypeError** → 守卫只在 `:110` 的 `checkCarrierAvailability` 里（`if (!carrier) return {canUse:false}`），而 `sendMail` 本身**不校验 carrier 存在**；`playerSendMail:426` 有 `|| CARRIERS.pigeon` 兜底故走 UI 不会炸，但 `sendNPCMail:490` 与 `sendAutoReplyFromNPC:407` 也都写死了合法名 ⇒ **当前三条生产路径都合法，此缺口属潜在**（**无法判定**是否有别的调用方传非法名——全仓 `MailSystem.send` 的 `[dot-ref]` 65 处里本批只逐个确认了上述几条）
  - **缺口** ⑤`setInterval(startPeriodicUpdate, 5000)`(:801) 是**裸定时器，无 clearInterval、无 unload 守卫** → 每次脚本求值起一条永不停歇的 5 秒轮询；本文件只被 html 加载一次故当前无害，但**任何测试/热重载重复求值都会叠加轮询**（每条都会调 `advancePendingMail` + 刷两次 DOM）
  - **缺口** ⑥`renderInboxList:298` 把 `data._pending.length` 显示成「N 封在路上」，但**待收队列在 `mail-system.js` 里是从不被玩家看见的信**（`:216-217` NPC 发信先进 `_pending`）⇒ 这个数字**包含玩家完全不知情的信**，属信息披露口径存疑（**无法判定**是否有意做成悬念）
  - **缺口** ⑦`formatTimeShort`(:341) 与 `_carrierRowHtml`(:531) 等 20 余处 HTML 拼接**一律不转义**收件人名/标题/正文（`_esc`(:494) 存在但只用在**一处**——实测 `[call()]` 全仓 5 处含定义，其余 4 处均在同文件）⇒ NPC 名或信标题含 `<` `&` 即破版（`mail-system.js` 侧同样：`:137` 信封主体直接进 `showMessage`）

- `js/mail-system.js` :: mail-system.js - 飞鸽传书/灵器传讯系统 v12.0
  - **机制摘要**（**实测 635 行 / 28.4 KB**（`Measure-Object -Line` 数出 556，差 79；本条以 Python 逐行读的 635 行为准）· 数据表 + 状态机 + 持久化（IIFE）｜**实测骨架数字**：**顶层 function 声明 0 个 / 顶层 window 赋值 0 处**（全在 IIFE 内）；IIFE 内 **`function` 声明 18 个**、模块级 `var` 表 4 张（`CARRIERS`:20 5 载具 / `IMPORTANCE`:78 3 档 / `MAIL_BODY_CAP`:146 =500 / `INBOX_CAP`:559 =200 / `NPC_SUBJECT_BANK`:513 5 类）、`====` 分节头 **11 处**；运行时实测只挂 **1 个 window 键** `MailSystem`（**20 个成员**，见接口行）
    ① 5 种载具（L20-75）：`pigeon`（凡人 / 延迟 60+0~300 分 / 截获 5% / 免费 / 日限 3）、`mirror`（筑基 / 0 延迟 / 1% / **50 灵石**）、`jade`（金丹 / 15+0~90 / 2% / **20 灵石**）、`fire`（元婴 / 0 延迟 / 0% / 耗 `tal_transmission`）、`beast`（化神 / 720+720 分 / 0% / 耗 `pet_immortal_crane`）。
    ② 境界门（L91-138）：`realmGateOk`(:98) **不再自抄境界序**，改读 `window.realmIndex`（真源 `js/global-utils.js`）；尺未就绪时 `return needRealm === '凡人'`（判不了即不够格，不敞大门）。`checkCarrierAvailability`(:109) 判境界 + `isConsumable` 载具的行囊存量。
    ③ 发信（L161-229 `sendMail`）：空主题/正文拒收 → 延迟 → 截获掷骰 → `arriveAt = 当前游戏分钟 + 延迟` → 建 17 字段信封（`clampMailBody` 截到 500 字）→ 玩家信进 `outbox.unshift`，NPC 信进 `_pending.push`，**即达信（延迟 0 且未截获）当场从 `_pending` 摘出直接入箱**（防双份）→ `saveMailData()`。
    ④ 推进/入箱（L231-263）：`advancePendingMail`(:232) 把 `arriveAt <= 当前分钟` 的搬进箱；`moveToInbox`(:250) 盖 `receivedAt`、`enforceInboxCap`（**收件箱封顶 200，超出 `length = 200` 截尾即丢最旧**）、调 `MailSystemUI.showArrivalAnimation` 或报被截、刷角标。
    ⑤ 读删藏（L265-310）：`markRead`/`deleteMail`（三本账同删）/`toggleFavorite`（**收藏是 `push` 整个信封对象**，不是 id 引用）/`getUnreadCount`。
    ⑥ NPC 智能回信（L312-416）：`playerReply`(:313) 按好感 + `dao_companion` 旗算回信概率（0 / 0.05 / 0.3 / 0.5 / 0.7 / 0.85 / 0.95），命中则经 `GameScheduler.schedule('mail:auto_reply', +120~360 分)` 排队（**调度器缺失时直接回信，不伪造延迟**）；`sendAutoReplyFromNPC`(:358) 按好感选 4 档语气库（high/mid/low/refuse）+ **v23.3「一日信多则回信变短」人情后果链**（`_mailAffDay` 日账，前 2 封 +1 好感、第 4 封起换短句并附「今日信来得勤」小字），并按境界优选载具（筑基→灵镜、金丹→玉简）。
    ⑦ 玩家发信（L419-476 `playerSendMail`）：`checkCarrierAvailability` → **真扣资费**（`:427-440`，`DataManager.deductSpiritStones` 优先，退 `inventory.currency`）→ 10 时辰「修书一封」→ 发信 → 同样按好感排回信概率（基准 0.4）与 120~360 分延迟。
    ⑧ NPC 事件信（L482-533）：`sendNPCMail`(:482) 对**同一 NPC 的敌意信（urgent）加 30 游戏日冷却**（日头记在 `npc._lastHostileMailDay`，随 `npcs/npc-system.js:1415/:1724` 的 serialize 持久化）；`generateNPCSubject`(:522) 按 `NPC_SUBJECT_BANK` 的 5 类 eventType（hostile/help/gift/invite/greet）出题并冠「紧急: / 重要: 」前缀。
    ⑨ 过期与存档（L535-606）：`saveMailData`(:536) 写 `xianxia_mail_system`（`saveToStorage` 优先，写失败抛错再被 catch 改 `console.warn`）；`loadMailData`(:543) 读档即 `cleanupExpiredMail`；`cleanupExpiredMail`(:567) 按 `urgent/important 90 天 / normal 30 天` 过期（`:575-576` 两档判定字面相同）；StateRegistry 键 **`mail`**（version 1，export/import/reset 三件套，import 时再清一次过期）。
    接口 `window.MailSystem` **20 键实测**：`CARRIERS`/`IMPORTANCE`/`MAIL_BODY_CAP` + 17 个函数（`send`/`sendNPCMail`/`playerSendMail`/`playerReply`/`markRead`/`deleteMail`/`toggleFavorite`/`getUnreadCount`/`advancePendingMail`/`checkCarrierAvailability`/`loadMailData`/`saveMailData`/`cleanupExpiredMail`/`moveToInbox`/`getPlayerRealm`/`realmGateOk`/`getData`）｜依赖 `timeSystem.gameTime.totalMinutes`/`advanceTime`/`getAbsoluteDay`、`GameScheduler.schedule`/`registerHandler`/`nowMinute`、`npcManager.getNPC`、`XianXia.DataManager.deductSpiritStones`、`StateRegistry`、`window.realmIndex`、`window._countInventoryItem`（借 `poison-system.js` 的私有 helper）、`MailSystemUI.showArrivalAnimation`/`updateUnreadBadge`、`saveToStorage`｜事件：★无 emit、无 EventBus；★订 `GameScheduler.registerHandler('mail:auto_reply')`(:583)；★被 `time-system.js:226` 在**每次时间推进**时调 `advancePendingMail`
  - **缺口** ★①**`CARRIERS[].dailyLimit` 五个值全仓零执行**（同 UI 条缺口②，此处是声明侧）：实测 `dailyLimit` 在 `js/` 内只出现在本文件 5 行声明处，`checkCarrierAvailability`(:109-138) 与 `playerSendMail`(:419) 都不查 ⇒ **头注第 4 行「5种载具」列出的日限从未生效**
  - **缺口** ★②**`IMPORTANCE` 的 `popup`/`sound`/`color` 三字段零执行**（同 UI 条缺口③）：紧急件不会弹窗也不会响铃，`showArrivalAnimation` 只看 carrier
  - **缺口** ★③**`sendMail` 的载具守卫被注释自陈「登记等裁」，直接调 `sendMail` 绕得开载具门槛** → `:168-169` 注释原文：「这里旧写法先算了 playerIdx/requiredIdx 却一处也没用——看着像守卫，其实拦不住任何东西。载具门槛真把在 `playerSendMail` → `checkCarrierAvailability` 那一道；直接调 `sendMail`（NPC 回信等）绕得开。**补守卫属改变现有行为，登记等裁**」。⇒ 这是**代码里明写的已知未修缺口**（不是本批推断）。而 `window.MailSystem.send` 是导出口，全仓 `[dot-ref]` 65 处/12 文件 ⇒ 任何新调用方绕过 `playerSendMail` 就等于无门槛寄信（当前 12 个消费文件里 `npcs/*` 那几处走的是 `sendNPCMail`，`mail-system-ui.js` 29 处走 `playerSendMail`/`playerReply` ⇒ **实测暂无绕过者**）
  - **缺口** ★④**截获的信「未送达」但仍留在 `_pending` 里等着** → `:179-181` 掷出 `intercepted = true` 后，`:216-217` **照样**把信 push 进 `_pending`，`:221` 的即达分支条件是 `delayMin === 0 && !intercepted` ⇒ 被截的即达信（灵镜 1%、玉简不适用）**不进箱也不退**，永远卡在 `_pending`；而 `:259-260` 的「📜 飞鸽被截获！…未送达」提示只在 `moveToInbox` 里发 ⇒ **被截的信既不提示也永不到达、还占着 `_pending` 并被 `cleanupExpiredMail` 漏清**（`:572` 只清 `inbox`）。⇒ 玩家看不出自己的信丢了，而 `updateQuickStatus:816` 还会把它算成「N 封在路上」
  - **缺口** ★⑤`cleanupExpiredMail:575-576` 两档判定字面相同 ⇒ **头注「30天普通/90天重要/90天紧急」实际是 30/90/90 三档里两档同值**，与注释一致但说明 `important` 与 `urgent` 的过期口径无差异（`NEW-40③` 注释说「紧急件不再终身免死」，这条已修，但**重要件与紧急件现已同寿**，是否有意**无法判定**）
  - **缺口** ⑥`:127` 借 `window._countInventoryItem` 查道具载具存量 —— 该函数是 **`js/poison-system.js:39` 的私有 helper**，靠顶层 `function` 声明自动挂全局才被取到；实测 `js/poison-system.js` 在 html 里是 **idx 51**、`js/mail-system.js` 是 **idx 171** ⇒ 顺序成立**当前接得上**，但这是**跨系统借私有函数**的隐式耦合：毒术文件若改成 IIFE 包起来，载具道具检查即静默退回 `inventory.slots.some`（功能等价，**无法判定**是否有细微口径差）
  - **缺口** ⑦`sendMail` 的延迟只按载具算，**头注第 4 行「受距离影响」在代码里不成立** → `:173-175` 的延迟公式只读 `carrier.baseDelayMin + rnd(randomDelayMin)`，**全程不读 `opts.location` 或任何距离表** ⇒ 「飞鸽传书受距离影响」这条设计未实现（飞鸽的 `randomDelayMin: 300` 是固定上限，与远近无关）
  - **缺口** ⑧`window.MailSystem.realmGateOk` 与 `getPlayerRealm` 两个导出口**仓内无消费方** → 实测 `realmGateOk` 的 `[call()]` 全仓 7 处里 3 处在本文件、**3 处在 `js/quest/qi-arc2.js`（是同名本地函数还是 `MailSystem.realmGateOk` 的调用，本批未逐行核，疑似同名不同物）**；`:629` 注释自陈「仓内无消费方」⇒ 与该自陈一致
  - **缺口** ⑨`xianxia_mail_system` 这个 localStorage 键**同时被 StateRegistry 与 game-state 两条路写** → `saveMailData:539` 仍无条件写 localStorage，而 `js/core/game-state.js:1293` 的条件是 `&& !window.StateRegistry`（有 StateRegistry 就不重复写）⇒ **同一份账两个 owner**，`:590` 注释已明说「v12.1：邮件作为当前存档的模块状态；localStorage 仅保留旧版兼容」，但代码里兼容写**没被 `!StateRegistry` 门住**（读档侧 `game-state.js:1400-1405` 有 `// F-9 撤回：mail 由 StateRegistry 接管。保留 MailSystem.loadMailData 作为旧存档兼容路径` 的显式分支，两侧口径不对称）
- `js/mount-events.js` :: v27.0 坐骑批 · 骑乘低频事件账（名马被贼盯上 / 路上兽惊） · 坐骑是资产，资产就有人惦记、就有脾气——但都是**低频**事（数日最多一回），绝不追着玩家跑： · ① 路上兽惊：骑乘赶路进城那一刻 10% 骰——牲口被锣鼓/幡影惊了。七成勒得住（亲密+1，患难见交情）
  机制 223 行 · 事件判定 + 弹窗三选一 + 翻日账订阅（无持久化）｜关键数据 `CFG` **10 常量**（JOLT_P 0.10 / JOLT_HELD_P 0.70 / JOLT_HURT_FRAC 0.05 / JOLT_LOST_MINUTES 30 / BANDIT_P 0.18 / BANDIT_CD_DAYS 5 / BANDIT_TARGET_SP 1.3 / PAYOFF_COPPER 100 / PAYOFF_PEACE_DAYS 15 / SHOO_STOLEN_P 0.30）；设伏把握率 `min(0.9, 0.5 + 境界idx*0.05 + 驭兽*0.003)`；日账 `cd()._mountEvt` 2 键（banditDay / peaceUntil）；伤账走 `health/maxHealth`（与 `city-gate.js:99-101` 同款口径，已核实一致）
  接口 `window.MountEvents` 5 键（maybeJolt / banditTick / banditTarget / openBanditDialog / CFG）+ 三个裸全局按钮 `_meAmbush` / `_mePayOff` / `_meShoo`（`onclick` 字符串驱动）｜依赖 getActiveMount、beastDisplayName、isMundaneBeast、stealMundaneBeast（真身在 `beast-taming.js:1492`）、saveBeastData、XianXia.DataManager.deductCopper、getAbsoluteDay、__scenarioRng｜事件：无 emit；★订 `timeSystem.onNewDaySubscribe(banditTick)`(:213)；`maybeJolt` 唯一外部调用方 `travel-system.js:582-583`
  ★缺口 1（实测：日账不落存档）→ `_mountEvt` **不在 `game-state.js` 的存档白名单**（实测 `_mountEvt` 在 game-state.js 里 0 命中）⇒ `BANDIT_CD_DAYS=5` 的五日冷却与「破财免灾买来的 15 日太平」**读档即清零**。可利用后果：读档重掷马贼脚点；以及「花 100 铜买 15 日太平」变成可重复购买的无成本按钮
  ★缺口 2（订阅可能永久丢失）→ `:213` 只在**加载那一刻**检查 `timeSystem`，不在位就退 `addEventListener('load', subscribe)`。若 `timeSystem` 在本文件之后才挂载，`load` 早已发过 ⇒ 翻日账的 `banditTick` **永久哑掉**（无日志、无告警），而「路上兽惊」那半（由 travel-system 主动调）仍正常
  缺口 `MountEvents.banditTarget` / `openBanditDialog` / `CFG` 三键对外零引用，仅本文件内部使用
  缺口 `:96` 目标口径 `mount.speed + qualityAdj` 与 `BANDIT_TARGET_SP = 1.3` 都是**硬编码**，没挂在任何物品/坐骑数据上（改坐骑数值不会自动改门槛）
  缺口 `:167` 设伏失败的伤用魔数 `hurt(0.10)`，而兽惊的伤走 `CFG.JOLT_HURT_FRAC` ⇒ 这一档不在 CFG 里，调平衡时容易漏掉
  缺口 `:194` 「轰走拉倒」的马真被牵走分支用 `stealMundaneBeast(tgt.index)`，与马市卖回同口径（头注自陈）——同一个 `tgt.index` 在 `banditTarget` 里是**当次遍历时的下标**，弹窗打开后玩家若改动厩内顺序会指向另一头（**疑似**，未构造复现）
- `js/party-system.js` :: party-system.js - 队伍系统 · 借鉴《觅长生》、《仙剑奇侠传》的队伍设计
  机制 1442 行（48 个 `====` 段）· 混合（队伍：阵型加成 + NPC 招募对话树 + 队员战斗派生 + 装备/功法分配 + 新人上限开关 + UI）｜关键数据 `partyData`（成员/装备/功法/忠诚度）、`FORMATIONS` **6 套阵型**、`recruitmentDialogues`（招募对话树）、`MEMBER_STRATEGY_LABELS`、`PARTY_UNLIMITED_CAP`（v108 解除人数上限的实验开关）、`realmHpMap`/`realmName`/`baseHp`（NPC 气血按境界尺）
  接口 `window.partySystem`（含 `addMember`/`removeMember`/`setLeader`/`switchFormation`/`getFormationBonus`/`getPartyPower`/`getAliveMemberCount`/分配装备/教功法 等）｜依赖 npcManager、discipleState、inventory/itemById、StateRegistry（`partyData`）、timeSystem.onNewDaySubscribe(:1437)、EventBus、currentCharData｜事件：★订 `newDay`
  缺口 ★本文件显式标注两个已废弃段：`:战斗中使用队伍（已废弃，Battle类自动处理）` 与 `:执行队员操作（已废弃）` ⇒ **两段死代码仍在文件里**（§0.2 总账看不出）
  缺口 `:队员战斗改算（阵型+装备的统一出口）`（v107）与「Battle 类自动处理」并存 ⇒ 队员战力算两处，若 Battle 侧已自动算，则本文件的派生函数是死出口（**无法判定**哪个在用）
  缺口 `partyData` 走 StateRegistry（v98 存档桥「就地灌，不重绑」），而 `realmHpMap`/`baseHp` 等 NPC 气血表每次现算 ⇒ 队伍战力在读档后可能与首次进队时不一致（**无法判定**）；另有 `timeSystem.onNewDaySubscribe`(:1437) 与 EventBus 两套订阅接口并存
- `js/physiology-config.js` :: 仙路长青 - 生理系统配置 · 机体扩展实施方案 v4.1 — 生理平衡参数、部位敏感性、伤害类型效果 · 修订：health→bloodVolume、oxygenDebt、危急计时、疼痛系统重做 · v4.1：头/颈/胸耐久归零=肉体尽毁直接死亡（不用 CHEST/NECK_ZERO 惩罚）
- `js/poison-system.js` :: poison-system.js - 毒术系统（v9.5 批次F2） · 解毒（战斗内）+ 制毒（战斗外）
  - **机制摘要**（**实测 225 行 / 9.8 KB**（`Measure-Object -Line` 数出 186，差 39；本条以 Python 逐行读的 225 行为准）· 数据表 + 两个业务函数 + 一段被借走的商店折扣（无持久化、无事件）｜**实测骨架数字**：顶层 `function` 声明 **7 个**（`_parseMaterialSpec`:33 / `_countInventoryItem`:39 / `_removeInventoryItem`:52 / `_itemDisplayName`:75 / `detoxify`:82 / `craftPoison`:152 / `getPlayerSpeechDiscount`:213）、顶层 `var/const` **1 个**（`POISON_TYPES`:5）、顶层 `window.` 赋值 **4 处**（L222-225）、`====` 分节头 **1 处**；运行时实测引入 **8 个 window 键**（4 个显式 + 4 个私有 helper 靠顶层 `function` 声明自动挂全局）
    ①  toxin 配方表（L5-30 `POISON_TYPES`）：**3 档** —— `weak_poison`（伤害 2 / 持续 3 / 门槛毒术 0 / 材料 `mat_liquorice`+`mat_beast_fang`）、`medium_poison`（5/5/门槛 30 / 三料带 `*N` 数量语法）、`strong_poison`（10/8/门槛 60 / 四料含 `mat_dragon_blood`）；每档一个成品 `itemId`（`poison_weak`/`poison_medium`/`poison_strong`）。
    ② 材料 DSL（L32-78）：`_parseMaterialSpec` 解 `"id*count"`；`_countInventoryItem` 扫 `inventory.slots`（兼容 `templateId` 与 `id` 两种写法）；`_removeInventoryItem` 走 `window.removeItem` → `inventory.removeItem` → **直接改 `slots[i]` 并置 null** 三级兜底；`_itemDisplayName` 查 `itemById`。
    ③ 解毒（L80-149 `detoxify`，战斗内外均可）：目标兜底链 `_playerEntity` → `_playerPhysiology` → `currentBattle.player`；毒术读 `getLifeSkill('毒术')`；毒状态三处找（`physiology.statusEffects` / `entity.statusEffects` / 兼容分支），按 `type==='poison' || id==='poison' || name==='中毒'` 认；`removeCount = max(1, floor(毒术×0.5))`，层数归零则整条移除并把 `phys.poisonLoad` 清 0（`:139`，注释自陈由 `battle.js` 战斗侧真实读写），否则改写 `stacks`/`duration`；两条分支各 `growLifeSkill('毒术', 2 或 1)`（v20.94 熟能生巧）。
    ④ 制毒（L151-210 `craftPoison`）：毒术门槛 → 逐材料校验 → **DES-87 成品先验**（`:179` 先查 `itemById[poisonItemId]` 在不在，不在就材料不动、一炉不开）→ `addItem` 实收（收不进则**此时材料仍未扣**）→ 才扣材料 → `growLifeSkill('毒术',2)` → 刷背包 UI。
    ⑤ 口才折扣（L212-219 `getPlayerSpeechDiscount`）：`max(0.5, 1 - floor(口才/5)/100)`，即口才 100 封顶 8 折、最低半价。
    接口 `window.POISON_TYPES` / `detoxify` / `craftPoison` / `getPlayerSpeechDiscount` + 4 个「本不打算导出」的 helper（`_parseMaterialSpec`/`_countInventoryItem`/`_removeInventoryItem`/`_itemDisplayName`，靠顶层 `function` 声明自动挂全局）｜依赖 `getLifeSkill`/`growLifeSkill`、`inventory.slots`、`removeItem`、`addItem`、`addItemFailPhrase`、`updateInventoryUI`、`itemById`、`_playerEntity`/`_playerPhysiology`/`currentBattle.player`｜事件：★无 emit、无订
  - **缺口** ★①**`craftPoison` 是死导出：`js/` 内零调用，只被 `tests/wave126-gate-after-loot-node.js` 穿过** → 实测 `[call()]` 全仓 3 处 = 本文件 `:152` 定义 + `STRUCTURE.md` + 那一处测试；**面板 `onclick` 口径 0 处** ⇒ 「制毒（战斗外，炼丹房/工坊）」这条注释声称的入口**在游戏里没有按钮**，玩家做不出毒。`POISON_TYPES` 同理：`[dot-ref]` 只有测试那 2 处，`js/` 内零引用 ⇒ **三档毒配方表连同 `damage`/`duration`/`reqSkill` 全部是死数据**
  - **缺口** ★②**`detoxify` 在 `js/` 内零调用，「解毒在战斗内」这条线索不成立** → 实测 `[call()]` 全仓 2 处 = 定义 1 + `STRUCTURE.md` 1；`[dot-ref]` 1 处即本文件 `:223` 挂 window；`[onclick=]` **0 处**；`[bare-word]` 的 4 处外部命中全在 `STRUCTURE.md`(2) 与 `版本记录.md`(2)，**没有一个游戏代码文件** ⇒ **战斗内没有任何地方调它，玩家中毒后无法主动解毒**。而战斗侧另有一条独立的中毒链（`city-depth.js` 的 `_poisoned` + 每日扣血 15%、`battle.js` 的 `poisonLoad` 累积与 tick 衰减、`inventory.js:653` / `building-effects.js:231` / `app.js:11054` 的清除路径）⇒ **两套「毒」各走各的：本文件只认 `statusEffects` 里的 poison 条目，`_poisoned` 那条扣血链它完全看不见**（**无法判定**战斗是否真的往 `statusEffects` 写 poison 条目——本批未追 `battle.js` 的下毒路径）
  - **缺口** ★③**`getPlayerSpeechDiscount` 名不符实：它叫「玩家口才折扣」，实现却读的是 `getLifeSkill('口才')`（生活技能），与 `detoxify`/`craftPoison` 同口径** → 与「已实现的唯一消费方」`js/enhanced-shop.js`（2 处）本批未逐行核它读的键名，**无法判定**商店那边读的是不是同一个值。另本函数**没有注释**说明自己为何住在毒术文件里（**疑似**历史归属错误）
  - **缺口** ④**四个私有 helper 因顶层 `function` 声明而意外变成全局，且其中一个被跨系统借用** → `_countInventoryItem` 被 `js/mail-system.js:127-128` 用来查传音符/灵兽信使存量（信使通道的道具门禁）；另三个 `_parseMaterialSpec`/`_removeInventoryItem`/`_itemDisplayName` 实测**全仓只有本文件内部调用** ⇒ 三个是**纯意外导出**（对外暴露了可被任意脚本改写行囊的 `_removeInventoryItem`）
  - **缺口** ⑤`detoxify:122` 的除毒量 `floor(毒术×0.5)` 与 `:123` 的层数兜底 `poisonEffect.stacks != null ? stacks : (duration || 1)` 口径不一致 —— 层数缺省时**拿「持续回合数」当层数**，而 `:144` 又把 `duration` 改写成 `newStacks` ⇒ 一个 `duration` 型毒状态被解一次之后，`duration` 与 `stacks` 就永久绑成同一个数（**无法判定** `battle.js` 造毒时到底设哪个字段，本批未追）
  - **缺口** ⑥`:53-71` 的兜底第三档**直接改 `inventory.slots[i]` 并置 `null`**，绕过 `removeItem` 的一切副作用（耐久扣减、实例事件、账目留痕）⇒ 前两档不可用时，制毒会走一条与全项目其余扣物路径**不同口径**的旁路（**疑似**仅为极端环境兜底）
  - **缺口** ⑦三个成品 `poison_weak`/`poison_medium`/`poison_strong` **在物品表 576 件里查无此物** ⇒ 由 `:176` 注释 `DES-87` 明写「三枚 itemId 全仓无模板（addItem 遇未知 id 直接返回 false）」，代码已加前置守卫把损失堵住；实测守卫走通时玩家只会看到「这一方的成品还没入册（缺 poison_weak 的物品档）」⇒ **三档毒永远做不出来**（与缺口①叠加：既无入口也无成品）
- `js/qi-environment.js` :: qi-environment.js - 灵气环境系统 · 地点灵气浓度、引导灵气修炼、灵气枯竭 · 加载顺序：在 regions.js 之后 · v20.43 做深：天时地灵共鸣（天气五行合地灵+10%，读取方在 weather-effects）； · 枯竭警示有纪律（跌破一档报一次，回春再报一次，不刷屏）
- `js/qin-arts.js` :: qin-arts.js — 音律琴心（v20.90） · 「音律」生活技能的两本账： · 1) 兵册：主手持琴类兵器（subtype 'qin'）时，音律折进攻击/命中（getCombatBonuses 接线） · 2) 艺册：勾栏瓦舍登台卖艺，打赏多少、长进快慢全看音律与手中琴的品相
- `js/regions.js` :: 仙路长青 - 地区与城市数据（v2.0 区域特性扩展）
  - **机制摘要**（**实测 246 行 / 12.4 KB**（`Get-Content Measure-Object -Line` 数出 233，差 13；本条以 Python 逐行读的 246 行为准）· 类型：**纯静态数据模块** = 4 张表 + 8 个取值口，零持久化、零事件、零 UI 渲染、零副作用｜**实测骨架数字**：顶层 `function` 声明 **8 个**（`getRegionMonsters`:130 / `getRegionResources`:137 / `getRegionWeather`:144 / `getRegionBonus`:152 / `getRegionSpecialEvent`:158 / `getRegionDangerLevel`:175 / `getTravelDistance`:203 / `getTravelTimePreview`:223）、顶层 `var/const` **4 个**（`mapData`:4 / `REGION_FEATURES`:21 / `REGION_DANGER_LEVELS`:165 / `CITY_DISTANCE_MAP`:181）、顶层 `window.` 赋值 **11 处**（L233-246）、`====` 分节头 **5 处**（L1/19/163/164/180）；运行时实测引入 **12 个 window 键**（4 表 + 8 函数）；`仙侠.html` script 序 **idx 11 / 351**（倒数第 340 位，全仓挂载最靠前的一批）
    ① 地区地图（L4-17 `mapData`）：**10 个地区 / 23 城** —— 中州3 东荒3 南疆3 西漠3 北冥3 蜀地2 东南海域2 灵界2 魔界2 **天界 0**，每地区 `{desc, cities[]}`。位面四城真实名是 `灵界·蓬莱仙境`/`灵界·九天罡风带`/`魔界·九幽深渊`/`魔界·血海荒原`（`仙侠.html` 侧键写作 `帝都·长安` 无空格，见缺口⑥）；`天界` 挂空数组，进出口只在 `endgame/ascension-epilogue.js`。
    ② 地区特性表（L21-127 `REGION_FEATURES`）：**只 7 个地区**（无灵界/魔界/天界），每地区 `{monsters{common,elite,boss}, resources{mine,herb,special}, weather[], special, bonus{}}`。实测去重：怪物名 **49** 个、资源 id **45** 个、天气词 **17** 个、`special` 事件 **7** 条、`bonus` 键 **13** 个（`copper/trade/herb/wood/fire/poison/defense/earth/ice/water/sword/cultivation/luck`）。
    ③ 五个取值口（L129-161）：`getRegionMonsters(region,type='common')`/`getRegionResources(region,type='herb')`/`getRegionWeather(region)`（`weather[]` 里 `Math.random()` 抽一个，实测 20 抽 19 命中「晴/多云/小雨/阴」四档）/`getRegionBonus(region)`/`getRegionSpecialEvent(region)`；地区查不到一律返 `[]`/`['晴']`/`{}`/`null`。
    ④ 危险等级（L165-178）：`REGION_DANGER_LEVELS` **7 地区**，各 `{level,label,color,desc}`；实测 level/label 单调（安全1 → 低危2 → 中危3 → 高危4）；`getRegionDangerLevel` 查不到返兜底 `{level:1,label:'未知',color:'text-gray-400',desc:''}`。
    ⑤ 旅行路线预览（L181-231）：`CITY_DISTANCE_MAP` **19 个起点城 / 74 条有向边**（19 城完全图应有 342；取值 13 档：60/90/100/120/150/180/200/240/300/360/400/420/480）。`getTravelDistance` 三级取值：表直查 → `:212-213` 反向查 → `:216-220` 同地区 60 / 跨地区 240 兜底（城名为空返 120）。`getTravelTimePreview` = `max(5, round(base × dist/60))`，base 为步120/骑60/御剑20/传送5，未知法门落回步行档（实测「帝都 · 长安→鲛人镇」步行 720 / 骑 360 / 御剑 120 / 传送 30；同城 dist=0 时四种法门一律 5）。
    ⑥ 导出块（L233-246）：11 条 `window.` 赋值；`:238-240` 头注自陈 v20.53「断线补电」——`mapData`/`REGION_FEATURES` 此前只活在脚本顶层 `const`、从不挂 window，而 `travel-system`/`beast-taming`/`location-system`/`reputation-system`/`app` 十来处读的全是 `window.mapData`，等于所有「按地区反查」一直落空。
    接口 `window.mapData` / `REGION_FEATURES` / `REGION_DANGER_LEVELS` / `CITY_DISTANCE_MAP` + 8 个函数（`getRegionMonsters`/`getRegionResources`/`getRegionWeather`/`getRegionBonus`/`getRegionSpecialEvent`/`getRegionDangerLevel`/`getTravelDistance`/`getTravelTimePreview`）｜依赖 **无**（纯字面量，不 import 任何模块、不写任何角色字段、不调 `StateRegistry`）｜事件 **无 emit、无订阅**（全文件零 `EventBus`、零 `timeSystem`）｜真实消费方实测仅 4 处：`js/app.js:8409-8413`（读 `window.mapData` 反查地区）、`js/app.js:8441-8442`+`:8553-8554`（读 `window.getRegionBonus`）、`js/house-panel.js:413-414`（读 `window.getRegionDangerLevel`）、`js/map/randomMap.js:524`（裸读 `REGION_FEATURES[region].resources`）
  - **缺口** ★①**四个取值口是死导出，连带三张子表玩家永远见不到** → 五口径接线扫描（`call()`/`onclick=`/`.dot-ref`/`.assign=`/裸词，已排除 `.kilo/worktrees/`、`html-0bd3fb25-source/`、`.scratch/`、`xianxia_work2/`、`ui-audit/`、`打包输出/`）本文件外命中：`getRegionMonsters` 三项全 **0**、`getRegionResources` 三项全 **0**、`getRegionWeather` 三项全 **0**、`getRegionSpecialEvent` 三项全 **0**（裸词口径的 1~2 处命中全在 `.md` 文档里）⇒ **49 个怪物名 / 17 个天气词 / 7 条地区特殊事件只能经这四个死口取**，游戏代码零消费（`resources` 子表例外：被 `js/map/randomMap.js:524` 直接读裸表，见缺口⑦）。
  - **缺口** ★②**`bonus` 13 个键里只有 1 个被真读过，而消费方点名要的那个键任何地区都没有** → 唯二消费方是 `js/app.js:8443`（读 `bonus.mining`，用于采矿 `regionBonus`）与 `js/app.js:8555`（读 `bonus.herb`，用于采药）。实测七个地区的 `bonus` 里 **`mining` 一个都没有** ⇒ `app.js:8443` 恒读到 `undefined`，`regionBonus` 恒停在初始 `1.0`，`app.js:8418` 头注「增强版采矿（支持区域特性影响）」在采矿这一路上**从未生效**；`herb` 只有东荒有（1.3）⇒ 另外 6 个地区采药也拿不到地区加成。`copper/trade/wood/fire/poison/defense/earth/ice/water/sword/cultivation/luck` **12 个键全仓零读方**。
  - **缺口** ★③**「旅行路线预览」整节 51 行是自闭环孤岛** → `getTravelDistance` 的 `[call()]` 全仓 2 处**都在本文件内**（`:203` 定义 + `:224` 被 `getTravelTimePreview` 调）；`getTravelTimePreview` 只有定义 1 处；`CITY_DISTANCE_MAP` 本文件外 `[dot-ref]`0 / 裸词 0。⇒ **距离表与时间预览在游戏里没有任何消费方**，玩家实际脚程另有真源（**本批未追 `js/travel-system.js` 的实际算法，无法判定两套口径是否一致**）。
  - **缺口** ④**距离表漏掉四个位面城，另有 8 条单向边靠反向查找兜** → 19 个起点城 vs `mapData` 23 城，缺 `灵界·蓬莱仙境`/`灵界·九天罡风带`/`魔界·九幽深渊`/`魔界·血海荒原`（实测 `getTravelDistance('灵界·蓬莱仙境','帝都 · 长安')` = 240，即落进「跨地区 240」估值而非真距离；同行之间则得 60）；74 条有向边里 **8 条不对称**（`帝都 · 长安` 出发 7 条、`太虚山` 出发 1 条无反向），由 `:212-213` 的反向查找救回（实测 `getTravelDistance('洛水城','帝都 · 长安')` = 60 正确、`('蓬莱仙岛','太虚山')` = 300 正确）。
  - **缺口** ⑤**`:205` 的 `clean()` 折叠空白而不是删空白，与全项目 DES-57 口径相反** → 实测 `getTravelDistance('帝都 · 长安','洛水城')` = **60**（表值），但 `getTravelDistance('帝都·长安','洛水城')` = **240**（表查不到、落到跨地区估值）⇒ 只要调用方传 `location-system.js` `cityData` 那一串写法，距离就整体偏移。同一处 DES-57 病根在 `app.js:8408`、`relations-panel.js:40`、`ui-immersive.js:124` 都用 `.replace(/\s+/g,'')` 治好了，**唯独本文件没治**（当前不构成活 bug，只因缺口③里这个函数无人调用）。
  - **缺口** ⑥**`mapData` 与 `location-system.js:73 cityData` 是两份 23 城双表，长安那一个键逐字不同** → 实测两边各 23 城、其余 22 城的 `cityData.region` 与 `mapData` 地区名**完全一致**，唯一分歧是 `帝都 · 长安`（mapData，L5，带空格）vs `帝都·长安`（cityData 表键，无空格）⇒ 任何按字面 `indexOf`/`===` 查长安的代码只会命中其中一份（`:217-218` 的地区反查循环正是这一类）。两份分属两个文件、**无一致性断言也无测试钉住**（`tests/v20.94-batch-node.js:265` 只断言 `cityData` 有 23 城，`tests/v21.4-city-content-node.js:159-168` 只断言 `cityData` 是 23 城 = 19 人间 + 4 位面，两处都不与 `mapData` 对账）。
  - **缺口** ⑦**45 个资源 id 里 13 个在 576 件物品表中查无此物，实测把三个采集池打成空** → 死 id：`mat_licorice`（注意与真实存在的 `mat_liquorice` 甘草只差一个字母）、`mat_skullcap`、`mat_wood_essence`、`mat_poison_mushroom`、`mat_poison_essence`、`mat_earth_essence`、`mat_water_essence`、`mat_metal_essence`、`mat_sword_soul`、`mat_sea_crystal`、`mat_seaweed`、`mat_coral_flower`、`mat_spirit_pearl`。`js/map/randomMap.js:511 usableNodePool` 会按 `itemById` 过滤（所以不会真发出不存在的道具），实测两级过滤后各地区实际采集池：**蜀地 spirit 0/2、东南海域 herb 0/2、东南海域 spirit 0/2 三池整池落空**，回落到 `SAFE_NODE_POOLS` —— 蜀地与东南海域的「灵机之物」退化成同一枚 `mat_spirit_source`（灵源石），**东南海域的野外采集点只掉得甘草与灵芝**；另 6 池缩水：中州 herb 1/3（只剩灵芝）、南疆 herb 2/3、东南海域 mine 2/3、东荒/南疆/西漠/北冥的 spirit 各只剩 1 味。
  - **缺口** ⑧**危险等级表与特性表都停在 7 个地区，位面与天界是空的** → 实测 `getRegionDangerLevel('灵界')` 返兜底 `{level:1,label:'未知'}`、`getRegionBonus('灵界')` 返 `{}`、`getRegionWeather('灵界')` 恒返 `['晴']`、`getRegionMonsters('灵界')` 恒返 `[]`。当前不显形，因为唯一活消费方 `js/house-panel.js:413-414` 传的是 `CAVE_SITES[sid].region`，实测七座洞府的地区正好就是那 7 个（**7/7 命中**）⇒ 属**潜伏缺口**：将来加一座位面洞府，洞府面板会静默显示「未知」危险。
  - **缺口** ⑨**地区天气词与全局天气系统不同源** → `REGION_FEATURES[*].weather` 的 17 个词（晴/多云/小雨/阴/雨/大雾/酷热/火山灰/毒雾/沙尘暴/干旱/雪/暴风雪/极光/雾/台风/海雾）**没有一个在 `WEATHER_TYPES` 里**，后者实测是 7 项数字索引数组（`0:晴天 1:阴天 2:雨天 3:雷雨 4:下雪 5:大风 6:雾天`）⇒ 两套天气词汇表互不相通；叠加缺口①里 `getRegionWeather` 零消费方，这 17 个词目前是**纯文案**（另注：真正生效的天气走 `weatherTravelMul`/`getWeatherGatheringBonus`/`getWeatherCombatBonus` 那套，与本表无关）。
  - **缺口** ⑩`:216-219` 的地区反查用 `mapData[r].cities.indexOf(f)` 逐城线性扫，且**不 break** —— 同名城出现在多个地区时后写覆盖先写；`:144-149 getRegionWeather` 每次调用重摇一次随机且**无冷却**，若将来接进日结会被同一天多次调用摇出不同天气（**当前无调用方，属潜伏**）。
- `js/relations-panel.js` :: 人脉关系面板渲染（v2.0 优化版）
  - **机制摘要**（**实测 318 行 / 13.8 KB**（`Get-Content Measure-Object -Line` 数出 295，差 23；本条以 Python 逐行读的 318 行为准）· 类型：单面板渲染器 = 5 个模块级筛选状态 + 6 个函数（读 NPC 表 → 搜索/筛选/排序/分页 → 拼 `innerHTML`），零持久化、零记账、零副作用｜**实测骨架数字**：顶层 `function` 声明 **6 个**（`renderRelationsPanel`:8 / `getNPCSect`:232 / `changeRelationsPage`:261 / `onRelationsSearch`:279 / `toggleRelationsFilter`:286 / `updateFilterButtons`:298）、顶层 `var` **5 个**（`RELATIONS_PAGE_SIZE`:2=12 / `RELATIONS_CURRENT_PAGE`:3 / `RELATIONS_SEARCH_QUERY`:4 / `RELATIONS_FILTER_MODE`:5 / `RELATIONS_ACTIVE_FILTERS`:6）、顶层 `window.` 赋值 **0 处**（5 条全在 `:312-317` 的 `if (typeof window !== 'undefined')` 块内，静态扫顶层抓不到）、`====` 分节头 **1 处**（L1）；运行时实测引入 **11 个 window 键**（5 条显式挂载 + `updateFilterButtons` 靠顶层 `function` 声明自动挂全局 + 5 个 `var` 自动挂全局）；`仙侠.html` script 序 **idx 170 / 351**，晚于 `js/npcs/npc-system.js`（idx 88）⇒ NPC 类先就位，顺序成立
    ① 取数（L9-23）：`npcManager.getAllNPCs()` 逐个过 `npc.memory.firstMet === true || (npc.memory.meetCount||0) > 0` 收「已结识」。实测新档 **57 个 NPC 一个都没结识** ⇒ 首开面板走 `:136-147` 占位分支（「👤 暂无结识之人 / 游历四方，结识天下英豪」）；把 57 人全标结识后每页 12 张卡、共 **5 页**（实测第一页 `innerHTML` 9812 字符 / 12 卡）。
    ② 搜索（L26-33）：`toLowerCase().indexOf` 子串匹配，只查 `name`/`occupation`/`location` 三字段。实测搜「清」筛到 2 张卡。
    ③ 六个快速筛选（L36-94，键与 `仙侠.html:563-576` 七个按钮**一一对应**，实测无遗漏无多余）：`sameLocation`（两侧 `.replace(/\s+/g,'')` 去空白后全等，DES-57）、`canInteract`（`npc.state.mood >= 20`，注释自陈「情绪不愤怒即可互动」）、`hasNewEvents`（v22.0 起只标「此刻就绪、一谈就会发生」的人：先 `isPersonalLineFinished` 排除已完线，再遍历 `NPC_PERSONAL_EVENTS` 问 `isEventReadyNow(npc, rev, aff)`；旧 `hasEventTriggered` 口径留作无门禁环境的兜底分支 `:67-70`）、`hasRequests`（`relationship.affection >= 20`）、`isCompanion`（`npc.isInParty || npc.isFollowing`）、`specialRelation`（`aff >= 60 || aff <= -50`）、`isRomance`（`HEROINE_ROSTER` 的 20 个 id）。实测在「全员结识」表上的命中数：同地点 **3** / 可互动 ≥12 / 似有心事 ≥12 / 有请求 **2** / 同行 **0** / 特殊关系 **2** / 情缘 **0**。
    ④ 四档排序（L97-122）：`high` 好感降序 / `low` 升序 / `sect` 按 `getNPCSect` 字符串比 / `location` 按所在地字符串比。实测四档手动赋值都能排出不同次序，**但没有任何写入口**（缺口①）。
    ⑤ 计数与分页（L124-133、`:217-226`）：`relations-count` 写「共 N 人」；`RELATIONS_CURRENT_PAGE` 越界时夹到 `totalPages`；`totalPages > 1` 才渲染上下页按钮，按钮是 `onclick="changeRelationsPage(N±1)"` 字符串自驱，首/末页加 `opacity-50 pointer-events-none`。
    ⑥ 卡片拼装（L149-215）：`npc.appearance?.icon || '👤'`（实测 57 人里 **11 人缺 icon**）→ 姓名 + `[关系徽章]` + `身份 · 📍所在地 🏛️门派` + `affLevel` 七档 + 心情 emoji 五档（`:180-185` `mood>=80 😄 / >=60 🙂 / >=40 😐 / >=20 😞 / else 😡`，实测初值 50 → 😐）+ 底部 `💗好感 敬重X 💝人情`；整卡 `onclick="window.showNPCDialog && window.showNPCDialog('id')"`。实测首张卡文案：`👤 清虚道人 [至交] 长老 · 📍武当派 🏛️青云门 挚爱 😐 💗85 敬重0 💝0`。
    ⑦ `getNPCSect`（L232-258）：**34 个门派名硬编码**（`少林 武当 峨眉 华山 昆仑 崆峒 天山 逍遥 唐门 丐帮 点苍 衡山 泰山 嵩山 恒山 全真 古墓 明教 星宿 日月 桃花 绝情 灵鹫 铁掌 少林寺 青云门 修罗宫 百花谷 星辰阁 天机阁 大隐阁 天书阁 万宝阁 剑阁`），三级子串匹配 `id.indexOf` → `background.origin` → `location`，全不中返「散修」。实测 57 人分布 **散修 51 / 剑阁 2 / 青云门 1 / 百花谷 1 / 天山 1 / 少林 1**。
    接口 `window.renderRelationsPanel` / `changeRelationsPage` / `onRelationsSearch` / `toggleRelationsFilter` / `getNPCSect`（+ 因顶层 `function` 声明意外挂上的 `updateFilterButtons`）+ 五个状态变量 `RELATIONS_PAGE_SIZE`/`RELATIONS_CURRENT_PAGE`/`RELATIONS_SEARCH_QUERY`/`RELATIONS_FILTER_MODE`/`RELATIONS_ACTIVE_FILTERS`｜依赖 `npcManager.getAllNPCs`、`window.currentCharData.location`、`npc.memory`、`npc.getRelationshipStatus`、`npc.relationship.{affection,respect,favor}`、`npc.state.mood`、`npc.appearance.icon`、`window.showNPCDialog`、`HEROINE_ROSTER`、`NPC_PERSONAL_EVENTS`、`isEventReadyNow`/`isPersonalLineFinished`/`hasEventTriggered`、`document.querySelectorAll('.relations-filter-btn')` + `btn.dataset.filterKey`｜事件 **无 emit、无订阅**（零 `EventBus`、零 `timeSystem`、零 `StateRegistry`）；入口实测三处 —— `仙侠.html:558 oninput="onRelationsSearch(this.value)"`、`:563-576` 七个按钮的 `onclick="toggleRelationsFilter('key')"`、`:547 onchange="renderRelationsPanel()"`；另 `js/app.js:1160-1161` 切到 relations 子页时刷一次
  - **缺口** ★①**四档排序（好感优先/好感最低/按门派/按所在地）在游戏里永远选不中，25 行排序代码全是不可达分支** → `仙侠.html:547` 是 `<select id="relations-filter" onchange="renderRelationsPanel()">`，**onchange 只重渲染，不读 `this.value`、不写 `RELATIONS_FILTER_MODE`**；而 `RELATIONS_FILTER_MODE` 的五口径接线扫描（`call()`/`onclick=`/`.dot-ref`/`.assign=`/裸词，已排除 `.kilo/worktrees/`、`html-0bd3fb25-source/`、`.scratch/`、`xianxia_work2/`、`ui-audit/`、`打包输出/`）本文件外命中 **0 处**，唯一写入点是 `:5` 的初值 `'all'` ⇒ `:98-122` 的四个分支玩家永远走不到。实测手动把变量改成四档确实能排出四种次序（`high` 前六：清虚道人/铁山/贾有道/玄冰子/柳随风/张大爷；`sect` 前六：剑圣·独孤/铸剑师·干将/玄冰子/无咎/铁山/贾有道；`location` 前六：守冢人·断剑老人/万剑宗外务执事·铁面/毒王·蝎心/巫医·蓝月/龙王·敖广/龙女·敖灵儿），只是没有入口。
  - **缺口** ★②**面板的七档 `affLevel` 与徽章的八档 `getRelationshipStatus` 是两套并行阶梯，同一张卡片能自相矛盾** → 七档（`:163-170`）**直取 `npc.relationship?.affection` 一个字段**；徽章（`:173`）走 `npc.getRelationshipStatus()`，实测定义在 `js/npcs/npc-system.js:1201-1212`，是 **8 档不是 9 档**（`return` 语句 8 条：至交/死敌/敢怒不敢言/追随者/畏惧/路人/敬畏/普通），读 `affection`/`hatred`/`respect`/`fear` **四个**字段、顺序为「至交 → 死敌 → 敢怒不敢言 → 追随者 → 畏惧 → 路人 → 敬畏 → 普通」。实测 18 组边界里 **6 组两套说法打架**：`aff=-21` 面板「厌恶」/徽章「路人」、`aff=-50` 面板「厌恶」/徽章「路人」、`aff=-51` 面板「仇人」/徽章「路人」、`aff=59` 与 `aff=40` 面板「朋友」/徽章「普通」、`aff=10 res=60` 面板「陌生人」/徽章「敬畏」；反向也有：`hatred=60` 时面板恒显「陌生人」而徽章是「死敌」、`fear>=60` 时面板恒显「陌生人」而徽章是「畏惧」。**实测卡片原文（铁山 `aff=-55`）：`铁山 [路人] … 仇人 💗-55`——徽章说路人、角落说仇人**。根因：徽章那条链把 `hatred`/`fear` 摆到台前，而面板既不读这两项、也没有展示位 ⇒ **一段死仇在卡片上看着只是「陌生人」**（徽章侧的 `res` 面板只印数字不印档名，`fear` 连数字都没有）。
  - **缺口** ★③**`isCompanion`（「👫同行」）的 `npc.isInParty` 字段全仓没有任何写入点，这一档只剩半条腿** → 裸词扫描 `isInParty` 在 `js/` + `仙侠.html` 里**只有本文件 `:81` 这一处**，实测 57 个 NPC 里 `'isInParty' in n` 为 **0**；`isFollowing` 才有真源（`js/party-system.js` 4 处 / `js/npcs/npc-system.js` 10 处 / `js/npcs/kidnap-system.js` 2 处）⇒ 筛选实际退化成「正在跟随」，实测新档命中 **0 张卡**。
  - **缺口** ④**`isRomance`（「💗情缘」）与 `HEROINE_ROSTER` 的 20 个 id 在新档里一个都碰不到** → `HEROINE_ROSTER` 实测 **20 条**，id 全是 `sect_leader_<派名>` 形态（`sect_leader_百花谷`/`sect_leader_修罗宫`/`sect_leader_天山派`… `sect_leader_少林寺`），而新档 `getAllNPCs()` 只有 57 个（9 个原型 `mentor_01`/`healer_01`/`warrior_01`/`merchant_01`/`elder_01`/`rival_01`/`villager_01`/`alchemist_01`/`craftsman_01`/`mysterious_01` 中的 10 个 + `shaolin_wujiu`，其余 46 个是 `cres_<城名>_<序号>`），**交集 0** ⇒ 面板点「情缘」实测命中 0 张卡。掌门 NPC 是懒建的（`js/sects/sect-internal.js:234/268/286` 才 `npcManager.addNPC`），且新建实例 `memory.firstMet` 初值仍是 `false` ⇒ **得先入门见到掌门，这一档才会亮**（**是否有意如此：无法判定**）。
  - **缺口** ⑤**`getNPCSect` 靠 34 个门派名做子串猜，且 `background.origin` 优先于 `location`** → 实测样本 `mentor_01 清虚道人`：`location='武当派'`、`background.origin='青云门'` ⇒ 判为**青云门**（`:241-248` 先于 `:249-256`），把 origin 去掉才落到「武当」。名单里「少林」与「少林寺」重名（`:235` 中「少林」排在「少林寺」前，`indexOf` 先命中者胜 ⇒ 少林寺的 NPC 一律记成「少林」）；「剑阁」既是门派名也是 `蜀地` 的城市名，`id` 含「剑阁」的 2 人因此被记成门派。57 人里 **51 人落「散修」**，含全部 46 个 `cres_*` 城民 ⇒ 卡片上的 🏛️ 标签基本不出现。真门派真源在 `js/sects/*`，本函数**不查表**（**`npc.sect` 字段是否存在：本批未追 `npc-system.js` 的 NPC 构造参数，无法判定**）。
  - **缺口** ⑥**`changeRelationsPage:262-272` 与 `renderRelationsPanel:14-23` 重复扫一遍整张 NPC 表算总数，且两处 `totalPages` 口径不同（未过滤 vs 已过滤）** → 实测：57 人全结识、无筛选时两处都得 5 页（一致）；开 `hasRequests`（真实命中 2 人）后分页控件**根本不出现**（因为 `:218` 按过滤后的 2 人算 `totalPages=1`），此时强行 `changeRelationsPage(4)` 会被 `changeRelationsPage` 按未过滤的 57 人放行，但随即被 `renderRelationsPanel:131` 夹回 1 ⇒ **口径分叉代码层可证、UI 层无可见后果**（诚实结论：不派单）。真实代价只是每次翻页多扫 57 个对象。
  - **缺口** ⑦**`updateFilterButtons` 是纯意外导出（顶层 `function` 声明自动挂全局），只在 `:295 toggleRelationsFilter` 内被调一次** → `renderRelationsPanel` 不调它，`js/app.js:1160` 与 `onRelationsSearch` 也不调（实测外部零引用）。因筛选按钮 DOM 在 `仙侠.html:562 #relations-filter-tags` 静态块里、状态也是模块级持久，**高亮与状态当前始终同步（核实通过，非可见缺口）**；隐患仅在于：将来若有人从面板外直接改 `RELATIONS_ACTIVE_FILTERS` 而不同步调它，按钮高亮就会与实际筛选脱节。
  - **缺口** ⑧`仙侠.html:547` 的 `<select>` 五个 `<option>` 的 `value`（`all/high/low/sect/location`）与 `:97` 的四个分支字面量对得上，但**没有任何代码读 `select.value`**（除缺口①所述）⇒ 这五个 `option` 目前是纯装饰。另 `:10` 取 `relations-count`、`:9` 取 `relations-npc-list` 两个 id 实测都存在（`仙侠.html:545/578`）——核实通过，非缺口。
  - **缺口** ⑨`:194` 卡片用了 Tailwind 默认调色板里**不存在的 `hover:bg-gray-750`**（全仓仅 2 处：本文件与 `js/core/scenario-engine.js:711`，`html`/`css` 里无任何定义）⇒ 鼠标悬停时那层高亮**静默不生效**（同类写法在 `js/relations-panel.js:302-307` 自己的按钮里用的是 `bg-gray-700`）。
  - **缺口** ⑩`:15` 与 `:263` 都硬依赖 `window.npcManager.getAllNPCs`，若 NPC 系统未就位则面板静默渲染「暂无结识之人」而**不报任何错**；按 `仙侠.html` 序本文件 idx 170 晚于 `npcs/npc-system.js` idx 88，**当前顺序成立**（核实通过，非缺口），但与 `js/dynasty-court.js:1087` 覆写 `window.enterCity` 那类「靠 manifest 顺序的裸接线」是同一类脆弱性。
- `js/reputation-system.js` :: reputation-system.js - 城市声望系统 v1.0 · 每个城市独立声望，影响价格、任务、隐藏内容
  机制 1196 行 · 数据表 + 持久化 + 渲染（城市声望 v1.0：每城独立账 → 解锁 6 类内容 → 7.1 P1-1 隐藏商店/秘传/专属任务 + v27.2 善举名册）｜关键数据 `REPUTATION_LEVELS`（声望档）、`REPUTATION_FEATURE_LEVELS` / `_LABELS` / `_ENTRIES`（解锁表）、`cityReputation`（分城账 + `repKey` 归一）、★`HIDDEN_SHOP_ITEMS` **8 件**、★`SECRET_ARTS_BY_CITY` **1 键（default）2 部功法**、★`CITY_SPECIAL_QUEST_TEMPLATES` **3 个模板**；存档经 `xianxia_reputation` + v27.2 善举链
  接口 34 个 window 全局（`getReputationValue`/`getReputationLevelIndex`/`getReputationDiscount`/`getReputationTitle`/`addReputationFromQuest`/`addReputationFromTrade`/`getUnlockedFeatures`/`hasUnlockedFeature`/`hasGlobalSpecialPermit`/`getRoyalAuctionAccess`/`openHiddenShop`/`openSecretArtsShop`/`openSpecialQuests`/`getOrCreateSpecialQuests`/`getReputationPanelHtml`/`repKey`…）｜依赖 inventory/addItem/addResultItem/giveWithReceipt、EconomyTransaction（`economy/auction-service.js` 读 `getRoyalAuctionAccess`）、`_endingModifiers`（choice-memory）、NPC 关系｜事件：★发 `reputation:changed`(:165)（全项目唯一发点，自订 :887）
  ★缺口 1（对应「已知的坑」，**成立：这是漏做，不是设计取舍**）→ `:370-375 SECRET_ARTS_BY_CITY` **只有 `default` 一个键、2 部功法**（混元功 300 / 凌波微步 500）；`:578` 取词 `SECRET_ARTS_BY_CITY[cityName] || SECRET_ARTS_BY_CITY['default']` ⇒ **23 城全部拿到同一部功法残卷**，「分城差异化」实际是空的。对照 `location-system.js` `cityData` 的 5 个字段 23/23 城全唯一（实测），可见是漏做
  ★缺口 2（对应「已知的坑」，**成立**）→ `:377-384 CITY_SPECIAL_QUEST_TEMPLATES` **只有 3 个模板**（collect / patrol / combat），`getOrCreateSpecialQuests` 按城名落键逐城生成 ⇒ 23 城复用同 3 张单子，只是 id/标题前缀带城名
  ★缺口 3（模板自身的 `type` 字段根本没被用）→ `:466` 生成的 objectives 恒为 `[{ type:'talk', target:cityName, count:1 }]`，**三个模板各自的 `type`（collect/patrol/combat）从未落进目标** ⇒ 「城中悬赏·收集」的实际目标是「交谈」；`:489` 的按钮文案对三张单子**一律**写「完成巡城」；完成靠 `:519 _completeCityRepQuest` 手动置位 ⇒ 三张单子机制上完全同形，只差难度与赏品
  缺口 `:370-375` 与 `:377-384` 两张表**没有城名字段**（结构上就没法分城）——补做时需同时改表结构，不是填数据就完事
  缺口 `:426-444` `_buyHiddenShopItem` 与 `:598-613 _buySecretArt` 都做了 DES-72/DES-90 的「先交货再收钱 + 报实收」，但**没有一条路径查 `hasUnlockedFeature` 之外的价格表**（价格写死在 `HIDDEN_SHOP_ITEMS.basePrice` × 声望折扣）⇒ 23 城的隐藏商店价格结构相同（**无法判定**是否有意）
  缺口 `HIDDEN_SHOP_ITEMS` 8 件与 `SECRET_ARTS_BY_CITY` 2 部功法的 id **实测全部在 608 件物品表内**（`items-extended/01-pills.js` 等），不存在幽灵 id ⇒ 这条不是缺口（已核实）
  缺口 `:86-103` 带空格城名归一迁移（NEW-32）与 `flag`/`value`/`unlockedFeatures`/`specialQuests` 四账并档逻辑，是本批唯一一处「城名两本账」的收口；wave95 D 段已钉 ⇒ 该病灶已修，可作为正面样本
- `js/status-effects.js` :: 状态效果系统
  机制 515 行 · 状态机 + 判定函数（6 段：状态效果类型 / 状态效果类 / 预设状态效果 / 管理器 / 初始化 / 导出）｜关键数据 `StatusEffectTypes`（类型枚举）、`PresetStatusEffects`（预设表）、管理器实例；挂 `window.tickHandler` 之外的常规全局口
  接口 `window.StatusEffectManager`（管理器：施加/移除/叠加/查询）+ `StatusEffect` 类 + `PresetStatusEffects`（`StatusEffectTypes` 类型枚举 + 预设表，见文件 6 段结构）｜依赖 currentCharData、battle 回合推进｜事件：无
  缺口 ★`status-effects.js` 的 `tickHandler` 是**效果对象的字段名**（:52 构造、:96-97 逐回合调、:155 从预设重建、:211 预设自带）而不是导出函数——本条不构成死导出；但**谁在战斗回合里驱动管理器逐回合调 `tickHandler` 未在本文件内出现**，需查 `battle.js`（**无法判定**，battle.js 归别的代理）
  缺口 本文件 515 行是**战斗内异常的唯一正规账**，但 `gameplay/talisman-system.js` 另建 `state`13键+`negative`13键 一套、`cultivation/qi-deviation.js`（走火）、`cultivation/cultivation.js`（心魔）各一套 ⇒ 全项目 **4 套并行的「异常/状态」机制**（**无法判定**分工边界）
  缺口 `extensions/talisman-advanced.js` 消费的是 `statusEffectManager`（正主在本文件），而 `city-facilities/eatery.js` 直接写 `window.applyBuff`/`window.activeBuffs` 裸全局 ⇒ 餐饮 buff 与状态效果本体可能不通（**无法判定**管理器是否也读裸全局）
- `js/time-system.js` :: time-system.js - 时间系统 · 基于行为触发的时间推进系统
  机制 747 行（28 个 `====` 段）· 判定函数 + 事件源（行为触发的两本时间账：时钟 1 时辰=120 分钟 + 360 日历年）｜关键数据 `TIME_PERIODS`（时段）、`SEASONS`（四季）、`gameTime`（单一真源，save/load 与 UI 共用同一对象）、`ACTION_TIME_COSTS`（行为耗时表）、`recoveryMinuteAcc`（生理恢复累加器）、`_newDayListeners`（新日订阅队列）
  接口 `window.timeSystem`（`advanceTime` / `onNewDaySubscribe` / `getAbsoluteDay` / `getCurrentPeriod` / `getPeriodBonus` / `getSeasonBonus` / `executeTimedAction` / `getActionTimeCost`）+ 自身挂 `updateTimeDisplay` / `updateSeasonDisplay`｜依赖 currentCharData/playerEntity/phys（生理恢复）、art-effects（`_artRegen`）、GameScheduler｜事件：★发 `time:advanced`(:240) 与 **`newDay`(:360)**（全项目唯一的 `newDay` 发点，**40 个订阅方**）
  缺口 ★本文件是全项目**唯一的新日总闸**：`newDay` 只有 1 个 emit、40 个 `.on` ⇒ 40 本文件的跨日逻辑都吊在这一行上；若本文件未加载或 emit 前抛错，40 本的当日结算全部不跑（各文件多为 `timeSystem.onNewDaySubscribe` 旧接口 + EventBus 新接口**两套并存**）
  缺口 `:保存游戏时间（已禁用独立自动存档；保留空实现兼容旧调用）` ⇒ 有一段**故意留空的兼容函数**（不是 bug，但读代码会误判为存盘缺口）
  缺口 第九十六波 NEW-11 注释「时间两本账的唯一口径锚点」写明「钟归钟、历归历」，但仓库里仍有文件用绝对分钟自推日号（wave96 D3 实测「误用清单：()」为 0 ⇒ 已清零，可作正面样本）
  缺口 本文件与 `world/solar-terms.js`（24 节气）、`core/world-calendar.js`（世界历法）、`core/world-loop.js`（日结调度）是**四本历法相关文件**，职责切分未在任一处写全（**无法判定**）
- `js/travel-system.js` :: travel-system.js - 旅行系统 · 管理城市间旅行、地图探索、旅行事件
  机制 854 行（19 个 `====` 段）· 混合（旅行：8 种交通方式 + 风险事件 + 传送阵解锁 + 境界闸 + 事件对话框）｜关键数据 `TRAVEL_METHODS` **8 种**、`travelEvents`（风险事件表）、`travelState`、已解锁传送阵账、`realmOrder` 境界尺（`requiredLayer`/`realmName`）
  接口 `window.travelSystem`（`startTravel` / `completeTravel` / `triggerTravelEvent` / `checkRealmRequirement` / `isMethodAvailable` / `getMethodRestrictionText` / `unlockTeleport` / `go` 等）+ `window.onTrigger`｜依赖 mapData（距离与耗时）、天气 `getCurrentWeather`、`getActiveMount`（坐骑提速）、`__scenarioRng`（途中遭遇零直掷骰）、locationSystem、startBattle、StateRegistry｜事件：无（`newDay` 由 time-system 统一发，本文件订）
  缺口 `travel-system.js` 的 `onTrigger` 是 `travelEvents` 表的**事件处理函数字段名**（表里 8 个事件各一个 :99~:224，:684-685 统一调 `event.onTrigger()`）——不是死导出；缺的是**这张 8 条事件表的零订阅**（除随队出行外无人触发）
  缺口 本文件曾被 wave95 H 段记过「`go()` 与 `startTravel` 双扣祭阵费（200）」与「`go()` 里重复的 30 分钟传送阵蓄能」两处病灶，已修；但 `unlockTeleport` 被导出后由 `location-system.js` 的进城处调（wave95 H1 钉住）⇒ 传送与旅行两本账的边界靠这次修复划定，注释里没画清（**无法判定**）
  缺口 本文件与 `map/high-planes.js`（御剑飞行 `flyTravel` 20 真气 30 分钟）、`map/randomMap.js`（野图 `travelToRegion`）、`location-system.js`（传送阵）共四本都能「移动」，四套成本口径（**无法判定**是否有意分层：步行/御剑/传送/野图）
- `js/ui-immersive.js` :: ui-immersive.js - UI沉浸感增强系统 · 特效、伤害数字、打字机效果、获得动画、地点过渡描写 · 加载顺序：在 app.js 之后（最后加载）
  - **机制摘要**（**实测 168 行 / 9.6 KB**（`Get-Content Measure-Object -Line` 数出 146，差 22；本条以 Python 逐行读的 168 行为准）· 类型：**纯表现层** = 4 个「贴 DOM → setTimeout 回收」的动画函数 + 2 张查表 + 1 段注入 keyframes 的 IIFE；零持久化、零记账、零事件、不读任何角色字段（除 `itemById` 与 `_settings`）｜**实测骨架数字**：顶层 `function` 声明 **4 个**（`showEffect`:17 / `showDamageNumber`:52 / `showItemObtainAnimation`:81 / `showLocationTransition`:122）、顶层 `var` **2 个**（`EFFECT_DEFS`:6 / `LOCATION_TRANSITIONS`:100）、顶层 `window.` 赋值 **0 处**（6 条全在 `:161-167` 的 `if (typeof window !== 'undefined')` 块内，静态扫顶层抓不到）、`====` 分节头 **7 处**（L1/5/51/80/99/145/160）+ 末尾 1 个 IIFE `addAnimStyles`（L146-158）；运行时实测引入 **6 个 window 键**；`仙侠.html` script 序 **idx 206 / 351**
    ① 特效表（L6-14 `EFFECT_DEFS`）：**7 档**，每档 `{emoji, class, duration, particles}` —— `breakthrough` ✨/2000ms/12 粒、`battle_hit` 💥/500/5、`battle_crit` ⚡/800/8、`heal` 💚/800/6、`item_get` 🎁/1000/8、`level_up` ⬆️/1500/10、`quest_done` ✅/1200/6。
    ② `showEffect(effectType, x, y)`（L17-49）：查表未命中静默 return；建 1 个 `fixed inset-0 pointer-events-none z-[100]` 容器，按 `particles` 逐粒 `createElement('div')` + 绝对定位 + `transition: all <duration/1000>s ease-out`；`:41-44` 用 `setTimeout(fn, 50, particle)` **把粒子当参数传进去**（`:32-33` 注释自陈 F-37 修的是 `var` 闭包全捕获最后一轮 `endX/endY` 的老病灶，现已改 `let/const`）；`body.appendChild` 一次，`setTimeout(<duration>)` 后整容器移除。实测七档的 DOM 序列与 `def` 严格相符（如 `breakthrough`：createElement 13 = 1+12、appendChild 1、setTimeout 13 次、延迟集合 `[50, 2000]`）。
    ③ `showDamageNumber(target, damage, type)`（L52-78）：`:53` 先 `if (!target) return`；用 `target.getBoundingClientRect()` 取锚点（缺该方法时兜到视口中心），`left = rect.left + width/2`、`top = rect.top` + `translateX(-50%)`；`crit` → `⚡ N` + 28px + 红字 + 发光；`heal` → `+N` 绿字；其余 → `-N` 白字；`animation: damageFloat 1s ease-out forwards`，1000ms 后移除。
    ④ `showItemObtainAnimation(itemId, count)`（L81-97）：`window.itemById` 查名与 icon（未收录则降级 `📦` + 裸 id，实测输出 `+2 no_such_item`），居中弹 `+<count> <name>`，`itemAnim 1.5s` + 内层 `itemBounce 0.5s`，1500ms 后移除。
    ⑤ 地点过渡（L100-143）：`LOCATION_TRANSITIONS` **19 条** `{enter, bg}`；`showLocationTransition` 先 `.replace(/\s+/g,'')` 去空白（兼容 `帝都 · 长安` → `帝都·长安`，实测两串写法都命中），再 `:128` 查 `_settings.disableCityIntro === true` 直接跳过；命中则盖一层黑幕 + 🏯 + 城名 + `enter` 描写，`locFadeInOut 0.5s` + 内层 `locText 0.5s`，500ms 后移除。
    ⑥ 动画样式 IIFE（L146-158 `addAnimStyles`）：`getElementById('ui-immersive-style')` 幂等守卫后往 `head` 追加一个 `<style>`，定义 **5 条 `@keyframes`** —— `damageFloat`（→`:75`）、`itemAnim` + `itemBounce`（→`:88`/`:90`）、`locFadeInOut` + `locText`（→`:133`/`:135`）。`showEffect` **不用** keyframes，走内联 `style.transition`。
    接口 `window.showEffect` / `showDamageNumber` / `showItemObtainAnimation` / `showLocationTransition` / `EFFECT_DEFS` / `LOCATION_TRANSITIONS`（6 键实测）｜依赖 `document.createElement`/`document.body`/`document.head`/`document.getElementById`、`window.itemById`、`window._settings.disableCityIntro`、`window.innerWidth/innerHeight`（缺坐标参数时的默认锚点）｜事件 **无 emit、无订阅**；实测接线（已排除副本目录）：`showEffect` **26 处 `.dot-ref` / 10 个游戏文件**（`js/enhancement.js`4、`js/world-events.js`4、`js/quest/quest-system.js`4、`js/app.js`2、`js/battle.js`2、`js/beast-taming.js`2、`js/inventory.js`2、`js/location-system.js`2、`js/reputation-system.js`2、`js/cultivation/breakthrough-ritual.js`2）、`showItemObtainAnimation` 2 处（`js/inventory.js:2634-2635`）、`showLocationTransition` 2 处（`js/location-system.js:478-479`）、`showDamageNumber` 2 处（`js/battle.js:4598-4599`，与 `showEffect` 共用同一段 `typeof === 'function'` 守卫与 `try/catch`）
  - **缺口** ★①**`showDamageNumber` 唯一的调用点传的就是 `null`，这个函数从来没有真正显示过任何伤害数字** → `js/battle.js:4599` 是 `window.showDamageNumber(null, actual, isCrit ? 'crit' : 'normal')`，而 `:53` 第一行就是 `if (!target) return;` ⇒ 实测 `showDamageNumber(null,1234,'crit')` 的 `createElement` / `body.appendChild` / `setTimeout` **全部为 0 次**，函数在读 `damage` 与 `type` 之前就退出了。根因在调用方拿不到 DOM 节点：`battle.js` 那个 `defender` 是战斗实体对象（`{type,name,isAlive,physiology,…}`），没有 `getBoundingClientRect` ⇒ **要接上得先给战斗实体一个屏幕坐标或容器元素**。头注「伤害数字」这条线在游戏里目前是**纯死代码**（`:52-78` 全段 27 行不可达）。同段 `:4601-4602 showEffect(...)` 是好的（两者共用一个 `try{}`），故战斗打击感并未全失，只是少了数字。
  - **缺口** ★②**`EFFECT_DEFS[*].class` 七个 CSS 类名全仓无定义，且 `showEffect` 从不读它** → 七个值 `effect-golden / effect-impact / effect-crit / effect-heal / effect-item / effect-levelup / effect-quest` 在 `仙侠.html` 与全部 css/js 里**零出现**（只有本文件 L7-13 写着）；`:22` 把容器 `className` 写死成 `'fixed inset-0 pointer-events-none z-[100]'`，`showEffect` 全程不碰 `def.class` ⇒ 这七个类名是**预留未兑现的样式钩子**（粒子实际只靠内联 `style.transition` + `style.transform` 动）。
  - **缺口** ★③**`LOCATION_TRANSITIONS[*].bg` 19 个渐变类同样是死数据** → `:132` 把 `overlay.style.background` 写死成 `linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 100%)`，从未读 `trans.bg` ⇒ 实测 `青木城` 的 `bg` 写着 `'from-green-900/40 to-teal-800/20'`，屏上却是同一串黑幕渐变 ⇒ **19 个地区各配的背景色一次都没生效，19 座城的进城黑幕长得一模一样**。
  - **缺口** ④**`LOCATION_TRANSITIONS` 19 条，漏掉 23 城里的 6 座、另收 3 个表外地名** → 无过渡词的城市是 `碧落仙宫`、`鲛人镇` 与全部四座位面城（`灵界·蓬莱仙境`/`灵界·九天罡风带`/`魔界·九幽深渊`/`魔界·血海荒原`）；表里 `mapData` 查不到的三个是 `帝都·长安`（就是长安的另一串写法，已由 `:124` 去空白兼容）、`迷雾森林`、`新手村`（后两者是野图/旧档地名，非 `mapData` 城）。实测 `showLocationTransition('鲛人镇')` 与 `('灵界·蓬莱仙境')` 都 `createElement=0` **静默返回** ⇒ 这 6 座城玩家进城**连一句描写都没有，也无兜底文案**；位面四城尤其刺眼——`js/regions.js:12` 的注释把「跨界只走位面之门」写得很重，却正是这四城没有过场。
  - **缺口** ⑤**`showLocationTransition` 对 `locationName` 零守卫，非字符串入参直接抛错** → 实测 `showLocationTransition(undefined)` 抛 `Cannot read properties of undefined (reading 'replace')`、`showLocationTransition(123)` 抛 `locationName.replace is not a function`，都炸在 `:124`；空串安全（`createElement=0` 静默）。当前唯一调用点 `js/location-system.js:478-479` 传的是 `cityName` 且外面包了 `try/catch` ⇒ **当前不炸（核实通过），但这是个没有护栏的口子**。
  - **缺口** ⑥**`heal` 这一档特效全仓零调用，`EFFECT_DEFS` 7 档里死 1 档** → 静态扫（排除副本目录）`showEffect('heal` 在 `js/` + `仙侠.html` 里 **0 处**；其余六档都有真调用（`breakthrough` → `js/location-system.js:1354` + `js/cultivation/breakthrough-ritual.js:603-604`；`battle_hit`/`battle_crit` → `js/battle.js:4601-4602`、`js/world-events.js:310`；`item_get` → `js/inventory.js:2637-2638`、`js/world-events.js:278`、`js/enhancement.js:633`；`level_up` → `js/beast-taming.js:447`、`js/enhancement.js:294`；`quest_done` → `js/app.js:5763`、`js/reputation-system.js:568`、`js/quest/quest-system.js:1211`/`:2199`）⇒ `heal` 的 💚 六粒特效玩家看不到；治疗另有 `showDamageNumber` 的 `type:'heal'` 分支（实测能正确渲染 `+50` 绿字），但那条也被缺口①堵死 ⇒ **治疗数字与治疗特效两条一起哑**。
  - **缺口** ⑦**`showEffect(effectType, x, y)` 的坐标参数是死参数，粒子恒在视口正中炸开** → 全仓 **0 个调用点传第二、三实参**（`js/` + `仙侠.html` 里 `showEffect(` 一律单参），所以 `:30-31` 的 `(x || window.innerWidth/2)` 永远落到视口中心 ⇒ 战斗命中特效不会出现在被打者身上（实测手动传 `x=100,y=200` 时逻辑本身是对的：首粒子 `left≈87.7px top≈190.2px`，含 ±30px 抖动）。`showDamageNumber` 的 `target` 参数虽被真传了，传的却是 `null`（缺口①）。
  - **缺口** ⑧**`EFFECT_DEFS` / `LOCATION_TRANSITIONS` 两张表挂上 window 后零外部引用** → 五口径扫描本文件外 `[dot-ref]` 各 1（即本文件自己的 `window.X =` 那行）、裸词 0 ⇒ 没有任何脚本读表或加档，玩家看到的特效种类被 L6-14 这一处硬编码锁死（`tests/wave136-rep-host-style-node.js` 里那 4 处 `showItemObtainAnimation` 是测试替身，不读表）。**要加新特效只能改本文件**。
  - **缺口** ⑨**头注「加载顺序：在 app.js 之后（最后加载）」与实测不符** → `仙侠.html` 实测 `js/ui-immersive.js` 是 **idx 206 / 351**，`js/app.js` 是 **idx 272**，其后**还挂 144 个 script**（`js/cultivation/*`、`js/sects/*`、`js/quest/*`、`js/city-facilities/*`、`js/core/daily-events.js`、`js/debug-panel.js` …）。当前不构成故障，因为**全部 10 个消费点都写成 `if (window.showEffect)` / `if (typeof window.showEffect === 'function')` 的运行时守卫**（核实通过），但注释已过时，别拿它当改 manifest 的依据。
  - **缺口** ⑩`:48`/`:77`/`:96`/`:142` 四处 `setTimeout` 回收前都判了 `container.parentNode`；`:26-45` 的粒子则**不判**——理论上粒子随整容器在 `:48` 一起被移除、不漏，但若动画期间 `document.body` 被整体换掉，粒子的定时器仍会跑在已脱离文档的节点上（**影响极小，仅记录**）。另 `addAnimStyles` 的幂等守卫查 `document.getElementById`，若将来有代码清空 `<head>` 会导致重复注入（**当前无此代码，核实通过**）。
- `js/weather-effects.js` :: weather-effects.js - 天气/季节影响扩展 · 天气影响战斗、采集、事件、NPC行为 · 加载顺序：在 time-system.js 之后 · v20.43 做深：天象与灵气咬合——天时合地灵则灵气共鸣（+10%），天气不再只是战斗修正
- `js/world-events.js` :: world-events.js - 世界事件系统 v7.1 P0-5 · 可查询、可过期、有持续修正、可参与
  机制 663 行 · 混合（世界事件 v7.1 P0-5 + v20.0 P2 城市临时状态：可查询/可过期/有持续修正/可参与 + 兽潮联动 + 物价/旅行风险乘数）｜关键数据 `WORLD_EVENTS` **6 条**（beast_tide/market_boom/sect_war/beast_flood/…）、`activeWorldEvents` 运行态、`rareNames` **20 键**、城市临时修正 `cityTempModifiers`、存档 `xianxia_world_events` + `xianxia_city_temp`
  接口 34 个 window 全局（`checkWorldEvents` / `triggerWorldEvents`? / `getActiveWorldEventList` / `getActiveWorldEventModifiers` / `isWorldEventActive` / `participateWorldEvent` / `expireWorldEvents` / `exportWorldEventsState` / `resetWorldEventsState` / `getCombinedShopPriceMultiplier` / `getCombinedTravelRiskMultiplier` / `getWeatherEventRateBonus` / `getWorldEventsPanelHtml` / `getBeastTideDetailHtml` / `beginBeastTideRaid` / `restoreWorldQi` / `setCityTempModifier` …）｜依赖 `BeastEcosystem`、`BeastTide`/`BeastTideAndGarden`、`MarketDynamic`、`GoodDeeds`、WorldCalendar、`WorldLoop`、`triggerFactionConflict`、`_isInLongRetreat`、locationSystem、timeSystem｜事件：★订 `newDay`；实测**本文件 0 条 emit**（对外只暴露查询/参与/乘数函数）
  ★缺口 1（存档失败静默，有屏证）→ 实测 Node 侧日志（world-events 测试跑出）：`[静默失败] js/world-events.js:480 · 城市临时修正存档：城池 Buff 没存上，读档后本该有的加成原样丢掉 — localStorage is not defined` ⇒ `:480` 的存档写法在无 localStorage 环境（Node/沙箱）下整段失效，只留一行 console.warn；**生产浏览器有 localStorage，但该分支的失败路径从未被测试覆盖**
  缺口 `WORLD_EVENTS` 只有 6 条，而 §0.2 职责行称「可查询、可过期、有持续修正、可参与」——6 条事件里 `beast_tide` 一条就占了 `beginBeastTideRaid` / `getBeastTideDetailHtml` / `_tideRaid` 三套旁路 ⇒ **6 条表 + 1 条深账**，内容量不均衡
  缺口 本文件是 `MarketDynamic`（`market:*` 事件）、`BeastTide`（`beast:tideStarted/Ended`）、`ResourcePoints`（`resourcePoint:*`）三个模块的**共同上游**（wave20 world-loop 测试实测三条链都由它串）⇒ 它挂了，三条链一起哑（单点）
  缺口 `xianxia_world_events` / `xianxia_city_temp` 两个 localStorage 键直写，未走 StateRegistry ⇒ 与 quest/choice-memory、factions、arena、cultivation 熟练度同款「存档口径落后一代」病灶（本批共实测 6 处以上）

### js/core/（33 个）— 底座 / 引擎层

- `js/core/action-gates.js` :: v23.0 平衡急救：景点/动作共用闸门 · 全库审计发现一批「点一下白拿数值、可无限连点」的旧世代景点（渡劫台叠突破加成、 · 冰晶塔刷永久体质、灵泉无限全恢复……）。本模块提供三件共用工具： · 冷却闸（每日一次 / 每 N 日一次，随角色存档走）、资源代价（真气/精力/健康）、结果波动
  - **机制摘要**（78 行 · 判定函数 + 冷却状态）`window.actionGate` 一个对象、7 个方法：
    `day()` 取绝对日；`cooled(key,days)` 冷却中返 true（`days` 缺省 1＝每日一次）；`left(key,days)` 剩余天数；
    `mark(key)`；`once(key,days,busyMsg)` 闸门一体化（冷却中弹提示返 false，可用则记账返 true）；
    `spend(type,amount,label)` 真气/精力/健康不足即拒；`roll(min,max)` 整数区间。冷却账挂
    `currentCharData._actionCd`（随档持久、新档自动空），不另设存储。
    **调用方（实测）** `js/location-system.js` 6 · `js/app.js` 4 · `js/city-facilities/bathhouse.js` 4 ·
    `js/npcs/npc-system.js` 4 · `js/npcs/npc-bond.js` 2。**依赖** `timeSystem.getAbsoluteDay`（缺则退
    `gameTime.currentDay`，再缺返 1）/`showMessage`/`updateCharacterStatus`。**事件**：无。
  - **缺口** ①`roll()`(L873) 裸 `Math.random()` 无注入点，与 `scenario-engine.js:226` 的
    `window.__scenarioRng` 口径不一致 ⇒ 该函数无法确定性测试（疑似设计遗漏，非死码）。
    ②`cooled()` 把「`last > absDay()`（新开档日数归零导致的未来记录）」当过期放行（L833），
    注释与实现一致，但这条放行不留痕，玩家会以为自己白拿了一次（记录备查）。
- `js/core/audio-synth.js` :: audio-synth.js - v20.1 音效合成（Web Audio API） · 纯代码合成短促提示音：突破/战斗胜利/收火/炼丹/任务完成，无需音频资产文件 · 监听 EventBus 关键事件自动触发；静音偏好存 localStorage（用户偏好，非角色状态）
  - **机制摘要**（118 行 · 混合：Web Audio 合成 + EventBus 订阅 + localStorage 用户偏好）
    `SFX` **6 个**纯代码合成音效（breakthrough 上行琶音 / victory 两音 / defeat 下行 / fire 清脆叮 /
    alchemy 柔和 / quest 两音），全由 `_tone(freq,dur,type,vol,delay)` 单音拼成，无音频资产；
    `AudioContext` 懒建于首次点击/按键（`_resume`，浏览器自动播放策略）。
    **对外接口** `window.playSfx` / `setSfxMuted` / `isSfxMuted` / `toggleSfx`（4）。
    **事件** 监听 4 个：`cultivation:breakthrough` `enemy:defeated` `quest:completed` `item:crafted`
    （L105 额外要求 payload 带 `recipeId` 才放 alchemy 音；`js/crafting.js:971-978` 确实带，此路成立）。
    **持久化** 静音偏好 `xianxia_sfx_muted`（走 `window.saveToStorage`，账号级非角色状态）。
    设置页接线 `仙侠.html:1462` `onchange="toggleSfx()"`。
  - **缺口** ①`SFX.defeat`(L59-62) **无任何触发点**：全仓 `playSfx(` 的外部调用只有
    `js/crafting/fire-qte.js:55`（`fire`）与 `js/quest/main-storyline-arc.js:191`（`victory`）
    ⇒ 战败音效从上线起就没响过（6 个音效里 1 个纯死码）。
    ②`window.setSfxMuted`(L113) 与 `window.isSfxMuted`(L114) **全仓零引用**（HTML 只挂 `toggleSfx()`）⇒ 两个死导出。
    ③`window.playSfx` 也没有 HTML 内联调用，只被上述两个 js 文件用 ⇒ 覆盖面比头注释所暗示的窄。
- `js/core/auto-save.js` :: auto-save.js - v20.1 自动存档 · 防崩档底线：每 7 天 + 突破成功 + 飞升/转世 自动存入独立自动档槽 · 独立于手动档（xianxia_saves），不抢占手动槽位，静默不打扰玩家
  - **机制摘要**（180 行 · 持久化 + 周期触发）独立自动档槽：键 `xianxia_auto_saves`（L8，JSON 数组）与
    开关键 `xianxia_autosave_off`（L9）。常量 `INTERVAL_DAYS = 7`（L10）、`MAX_SLOTS = 5`（L11，只留最近 5 份）。
    两个触发点：①`timeSystem.onNewDaySubscribe(tickAutoSaveDay)`(L164) 逢 7 的倍数；
    ②保底档 `doAutoSave(trigger)`，trigger 取 `'day'|'breakthrough'|'ascension'|'reincarnation'`(L56)，
    **不受设置页开关影响**（L47 注释明说）。落盘统一走 `saveGame({autoMode:true})` 正门，不占手动档槽、不弹 toast；
    写失败由 `_quotaWarned` 保证只警告一次（L38-45）。
    **对外接口** `window.doAutoSave` / `getAutoSaveSlots` / `refreshAutoSaveSlots` / `loadAutoSaveSlot` /
    `toggleAutoSave` / `loadSaveData`（6）。**依赖** `timeSystem.getAbsoluteDay`、`saveGame`、`saveToStorage`、`GameState`。
    **事件** 不监听 EventBus，走 onNewDaySubscribe。
  - **缺口** ①`window.getAutoSaveSlots`(L168) **外部零引用**（死导出）。同组的 `loadAutoSaveSlot`(L170)
    不是死的——`refreshAutoSaveSlots` 在本文件 L140 拼了 `onclick="loadAutoSaveSlot(...)"`，经内联事件活着。
    ②自动档是**全局 5 份、不按角色筛**（L88-91 只做 `slice`），新角色的自动档会把旧角色逐份挤掉；
    `refreshAutoSaveSlots` 渲染时也不做角色过滤，每行都挂「载入」（L140）⇒ 换角色时可能载进别人的档。
    （`FIX_NOTES.md:4185` 已记，此处为代码侧复核确认。）
- `js/core/balance-config.js` :: balance-config.js — 可调平衡参数中心 · 新增系统优先从这里取值，避免把关键数值散落在 UI/业务函数中。
  - **机制摘要**（85 行 · 纯数据表 + 命名空间挂载）`BALANCE_CONFIG` **9 个分组**：
    `social`（每日社交 3 次 / 冷却 30 分 / 精力 100）、`auction`（挂单 1440 分、手续费 2%、成交税 8%、
    流拍压柜 5%、同时挂单上限 6、`saleChanceByPriceRatio` **11 档**递减 0.95→0.01）、`borrow`（3 天 / 5 情分 /
    逾期罚 10 / 归还赠 2）、`cultivation`（练功 5 真气 30 分）、`arena`（日限 5 / 精力 10 / 30 分 / 连胜奖上限 10）、
    `sectTasks`（并发 5 / 巡逻 20 精力 60 分 / 护送 30 精力 120 分）、`sectEvents`（360 分冷却 / 720 分持续 /
    触发率 0.30）、`protection`（庇护 72 小时 / 追捕 ×0.5 / 受伤 ×0.9）、`factions`（入侵基率 0.05）。
    同时挂 `window.BALANCE_CONFIG` 与 `window.XianXia.Balance`。**依赖/事件**：无。
  - **缺口** 头注释要求「新增系统优先从这里取值」，但本次**未逐组核读者**。已确认可疑的一处：
    `auction.saleChanceByPriceRatio`（L25-37，11 档）与 `js/economy/auction-service.js` 的实际接盘算法
    是否同源**无法判定**（auction 不在本批范围，未读）。
- `js/core/collection-system.js` :: collection-system.js - v20.0 2.15 图鉴收集 · 派生统计（功法/物品/NPC/击杀）+ 收集里程碑奖励（气运） · 无 bestiary 字段，敌人图鉴用击杀计数代。依赖：learnedSecrets/inventory/npcManager
  - **机制摘要**（80 行 · 派生统计 + 里程碑奖励）`window.getCollectionStats()` 从四处派生四维：
    `skills`=`window.learnedSecrets.length`；`items`=**当前行囊**去重模板数（读 `inventory.slots[].templateId`）；
    `npcs`=`npcManager.getAllNPCs()` 中 `relationship.affection > 0` 的计数；`kills`=`currentCharData._killCount`。
    `COLLECTION_MILESTONES` **6 条**：skills10(+5 气运)/skills20(+10)/items30(+5)/items60(+10)/npcs15(+5)/kills50(+5)。
    `claimMilestone(id)` 校验 → 写 `_collectionClaimed[id]` → `luck=min(100,luck+reward)` → `updateCharacterStatus()`。
    **消费方（实测）** `js/cultivation/cultivation.js:589-599`（修炼面板图鉴区，onclick 调
    `window.claimCollectionMilestone`）、`js/achievement-system.js:76`（成就档案藏品/好友数）。
  - **缺口** ①`MILESTONES`(L38-45) 档位不对称：skills 有 10/20 两档、items 有 30/60 两档，而
    **npcs 只有 15 一档、kills 只有 50 一档**——另两项无第二档可领。
    ②`items` 维只统计**此刻行囊里装着的**去重模板（L13-20），行囊会自然换货 ⇒ 要同时持有 60 种
    不同模板才够 `items60`，实际接近不可达（疑似设计缺陷）。
    ③四段取数全用 `try{}catch{}` 静默兜底（L9-34），数据源缺失时静默返 0，面板显示「0/60」而不是
    「读不到」，与 `禁止设计.md#2`「写清楚为什么锁」相悖（疑似）。
- `js/core/content-validator.js` :: content-validator.js — 内容引用/重复定义诊断 · 不修改游戏数据，只在开发阶段报告：重复ID、配方断链、制作出未实装物品等。
  - **机制摘要**（123 行 · 开发期诊断）三段校验 + 一张报告：`validateItems()`（重复 ID / 配方产物查无模板 /
    制作出未实装物品）、`validateRecipes()`（材料断链）、`validateQuestRefs()`（任务目标引用的物品/敌人是否存在；
    L58-60 记录它已从失效的 `global.playerQuestProgress` 改走 `exportQuestState()` 正式快照口）、`reportToConsole()`。
    产出 `window.CONTENT_VALIDATION_REPORT`（3 字段）。依赖 `itemById`/`allRecipes`/`recipeById`/`allQuests`/
    `exportQuestState`。加载位置在所有数据扩展之后（manifest 末段），同步诊断不用延迟猜加载顺序。
  - **缺口** 全文件**无任何外部调用方**：`validateItems`/`validateRecipes`/`validateQuestRefs`/
    `reportToConsole` 外部零引用，`CONTENT_VALIDATION_REPORT` 也只在文件内；`tests/` 里 0 命中。
    ⇒ 这套「内容断链诊断」在游戏运行时与回归里**从不执行**，只能人工跑。
- `js/core/continue-save.js` :: continue-save.js — 续档快照（DES-28：把「继续仙途」和「保存存档」解耦）
  - **机制摘要**（218 行 · 事件订阅 + 快照触发 + HUD）续档快照：只写 `xianxia_save`，走
    `saveGame({autoMode:true, silent:true, trigger:'continue:'+reason})` 正门，不占手动档槽、不弹 toast。
    常量 `FLUSH_GAME_MINUTES = 120`（L24，攒够一个时辰落一次盘）、`MIN_REAL_MS = 8000`（L25）。
    「有事发生」＝世界时间推进：`onTimeAdvanced` 记 `_pendingMinutes`，够 120 才 `maybeSnap`。
    **订阅 12 路**（L176-194，函数身份去重 + `_continueSaveSubscribed` 单次守卫）：`time:advanced` `newDay`
    `location:visited` `enemy:defeated` `quest:accepted` `sect:joined` `item:obtained` `item:crafted`
    `cultivation:breakthrough` `cultivation:completed` `dungeon:completed` `reward:applied`（后 8 路是
    v25.1·P1 补的「零时辰但有价值」变更）。另挂 `beforeunload`：脏档且落盘失败才拦人。
    **HUD** `#continue-save-state`（`仙侠.html` 内 2 处）三态：未存档（带已行时长）/ 尚未落档 / ✓ 已落档。
    **对外接口** `window.ContinueSave` 12 个成员（含 `isDirty/everSaved/pendingMinutes/lastSnapshotAt`）。
    **消费方** `app.js` 6 处、`js/quest/quest-system.js` 1 处。
  - **缺口** 未发现注释与实现相悖处。三点记档：
    ①`_everSaved`(L33) 是**模块内存态、不随档走**，只由 `onLoaded()`(L143) 置 true；若外部直接调
    `GameState.applyFullGameState` 而不经 `onLoaded`，HUD 会重新喊「尚未落档」（疑似口径缝）。
    ②`snap()` 返 `!_dirty`(L88)，而 `_dirty` 只在 `saveGame` 回调 `onSaved` 时清；若 `saveGame` 早退不回调，
    `_pendingMinutes` 已被清零（L84）⇒ 这段脚程账既没落盘也没记着（疑似）。
    ③节流按真实毫秒、落盘门槛按游戏分钟——一次闭关连跨 30 天只落一次盘，这是 L17 注释写明的意图，
    不是漏落，但读代码极易误判（记录备查）。
- `js/core/daily-events.js` :: daily-events.js - 日常/世界填充事件（v9.9） · 定位：城市街面 / 野外非战斗 / 门派生活感 —— 低价值、高沉浸 · 与 event-system 奇遇分层：奇遇=奖励抽奖；日常=世界在呼吸
  - **机制摘要**（1131 行 · 数据表 + 概率触发 + 弹窗渲染）`DAILY_EVENT_LIST` **18 条**（L191-845），
    按 `pool` 分三池（`DAILY_EVENTS` = city / wilderness / sect，L852-856）。
    **触发链** `tryTriggerDailyEvent(location, options)`(L937) → `_deInBattle()`（认 `window.currentBattle` 与
    `#battle-modal`，L103-118；v24.3 修掉三条恒假旧检查）→ `_deModalOpen()`（另挡 `#scenario-modal`
    `#xianxia-modal-overlay` `#pawn-picker-modal`，L120-131）→ 全局冷却 35 游戏分钟（L11/L951）→ 基础概率
    （野外 2% / 门派 4% / 城市 5%；时间推进时 `min(0.10, chance*(0.6+min(minutes,60)/80))`，L959-965）→
    `condition(ctx)` + 单事件 `cooldownMin` 过滤 → 权重抽取 → 记账（`lastById` / `history` 留 30 条）→
    `showDailyEventDialog`；选项走委托点击（L1050-1059），`handleDailyEventChoice` 跑 `choice.effect()` 并
    `setFlag('daily_done_'+id)`。**上下文** `getDailyEventContext()`(L167) 给 10 字段（source/minutes/period/
    raining/inSect/sectRank/sectId/terrain/realm/totalMin）。**持久化** `xianxia_daily_events`（L876 走
    `saveToStorage`），同时在 `game-state.js:37` 角色级白名单里。**另挂** `EventBus.on('newDay',
    checkOverdueBorrowItems)`（L1121-1123）做借物逾期兜底。**对外接口** `window.dailyEvents`（7 成员）
    + 8 个平铺 `window.*` = 11 个挂载点。
  - **缺口** ①**货币写入绕开 DataManager**：`_deAddCopper`(L37-43) 直接写 `currentCharData.copper`、
    `_de付灵石`(L68-72) 直接写 `inventory.currency.spiritStones`（无背包才退回 charData）。而 `js/app.js:2134`
    注释明写「铜钱统一走 DataManager（此前 charData-only，读 inventory 致数值错）」——同类双源 bug 在
    日常事件这条路没改（疑似产生双账）。
    ②**8 个平铺导出外部零引用**：`dailyEventState`(L1090)、`DAILY_EVENT_LIST`(L1092)、
    `saveDailyEventState`(L1094)、`getDailyEventContext`(L1095)、`handleDailyEventChoice`(L1098)、
    `closeDailyEventModal`(L1099) 只在本文件内被用；后两者由 L1050 的委托点击内部调用，**不是死码**。
    真正被外面读的只有 `DAILY_EVENTS` / `tryTriggerDailyEvent` / `showDailyEventDialog` / `dailyEvents`。
    ③**遮罩刻意不可关**（L1053 注释）；若某事件 `choices` 为空数组，弹窗将只剩标题描述、零枚可点钮且关不掉。
    现有 18 条都有 choices，**当前不会触发**——结构性隐患而非现行缺陷（`FIX_NOTES.md:1325` 已预警）。
    ④`:1126-1129` 的 `readyState==='loading'` 守卫写法正确（已核，不是缺口）。
- `js/core/dao-bridge.js` :: dao-bridge.js — 道侣名册的桥（v20.24）
  - **机制摘要**（213 行 · 事件桥：把道侣名册接到世界日历与每日钩子）三块：
    ①**结契登记**（L62-99）：v20.91 结契那一刻把「那个人独一份的信物」发进行囊（名册在
    `js/items-extended/17-lead-tokens.js`，幂等）；v20.48 修拼写 bug——族谱导出名是 `NpcLineage`
    （`js/npcs/npc-lineage.js`），此前误拼 `NPCLineage` 恒 undefined ⇒ 结契永远登不进族谱（现两拼写都认）。
    ②**道侣相约**（L100-190）：日历「约定」栏第一位常客；v20.25 **按日轮转**请不同道侣（旧版只请得动名册头一位，
    余者无名无分）；v20.33 赴约即到场 → 信任 +1；v20.36 深情 +1。**耗时口径**：L157-158 记了与节日桥同款的
    单位病——「文案写耗时半日、账上只收 30 分钟」，`advanceTime` 单位是分钟、半日应为 720，已改。
    ③**到期裁决**（L191-200）：日历说日子到了，这里决定「赴」与「误」；无弹窗环境（自动化）也照样把时辰
    花出去，不留悬账（L183）。每日发帖钩子挂日历同频的新日钩，另导出供测试/无总线环境直调（L200）。
    **依赖** `WorldCalendar`（5 处）、`NpcLineage`、`17-lead-tokens`、`timeSystem`。
  - **缺口** 本次只读了轮廓与关键段（211 行全文未逐行），**未发现**注释与实现相悖处；
    L68-69 那条拼写 bug 已修（有注释为证）。待核项：`EventBus` 订阅是否与 festival-bridge 同频、
    「误」的字数扣减是否与 `world-calendar.js:223-227` 的一次性语义一致。
- `js/core/delegate.js` :: 重构第4步 · 事件委托注册表（data-act） · 动机：1032 处 JS 字符串里的内联 onclick="fn(...)"——带字符串参数的最脆（文本含引号即断）， · 且错误只能靠全局兜底看不见上下文。改法：document 级委托 + 注册表
  - **机制摘要**（51 行 · 事件委托注册表）`window.XianXia.actions` 5 个方法：`register` / `unregister` /
    `get` / `names` / 外加一张闭包表 `actions`。document 级 click 监听（L261-280，非捕获阶段）解析
    `[data-act]`，取 `data-arg` 作参数调 `fn(arg, el, e)`；未注册的名字只 `console.warn('[delegate] 未注册的
    action: '+name)` 不抛不拦（L270-272）；执行异常带 action 名上报（L276-279，比全局兜底多一层上下文）。
    必须排在所有注册者之前（manifest 第 0 层），但监听是运行时查表，注册晚于监听也安全。**事件**：监听原生
    `click`（非 EventBus）。**依赖**：无业务依赖。
  - **缺口** 头注释（L232）说这套是为迁移「**1032 处** JS 字符串里的内联 onclick」而建；实测
    `XianXia.actions.register` 全仓**只有 1 处外部调用**（`js/extensions/player-sect-ui.js`）
    ⇒ 迁移几乎没开始，注册表基本空转，机制已就位但没有使用者（**不是死码**，是未启用）。
- `js/core/difficulty-config.js` :: difficulty-config.js — 战斗难度条件栏（v12.4）
  - **机制摘要**（87 行 · 数据表 + 持久化 + 读端）`DIFFICULTY_PRESETS` **3 档**：
    `easy` 宽松（敌伤 ×0.75 / 危急窗口 50 回合 / 要害 ×1.0）、`normal` 标准（×1.2 / 35 / ×1.3）、
    `hard` 凶险（×1.7 / 20 / ×1.5）。每档三个参数 `enemyDmgMul` / `criticalTurns` / `vitalMul`。
    **双写持久化**：即时写 `currentCharData.difficulty` + 独立键 `xianxia_difficulty`（`saveToStorage` 单源）；
    同时经 `StateRegistry.register('difficulty')`（L66-96，带 export/import/reset）随完整存档走，
    读档时 `importAll` 覆盖 localStorage 旧值。读端优先级：角色字段 → localStorage → 默认 `normal`（L921-929）。
    **对外接口** `window.DIFFICULTY_PRESETS` / `getDifficulty` / `setDifficulty` / `getDifficultyParam`（4）。
    **消费方** `js/battle.js:272 _getDifficultyCriticalTurns` 读 `criticalTurns`；`enemyDmgMul`/`vitalMul` 的读者未逐一核。
  - **缺口** 未发现注释与实现相悖处。记档：`xianxia_difficulty` **不在** `game-state.js:30-68` 的
    `CHARACTER_STORAGE_KEYS` 里 —— 这是**有意为之**（靠 StateRegistry 自注册），不是漏项，
    但读 game-state.js 白名单时会误判为缺键。`setDifficulty` 在 UI 上的挂点本次未核。
- `js/core/empty-state.js` :: empty-state.js — 公共空态件（UI-12 批次）
  - **机制摘要**（44 行 · 纯渲染件）`window.xEmptyHtml(cfg)` 生成公共空态卡 HTML：
    `cfg = { title, why, next, hints:[], fill }`；`fill:true` 加 `x-empty--fill` 类把卡撑到至少半屏。
    `window.renderXEmpty(el, cfg)` 就地 innerHTML 并返 true/false。全文 `esc()` 转义 `& < > "`。
    纪律（头注释）：只呈现调用方算好的事实，不读 DOM 当真值、不新造状态、不自己编玩法；文案里每个数字
    必须来自真实账本。**消费方（实测）** `js/enhanced-shop.js` 3 · `js/core/world-calendar-ui.js` 3 ·
    `js/app.js` 2 · `js/quest/quest-system.js` 2 · `js/party-system.js` 1（`xEmptyHtml`）；
    `renderXEmpty`：`js/sects/sects-system.js` 4 · `js/quest/quest-system.js` 3 · `js/app.js` 1。
  - **缺口** 未发现缺口。头注释说此前只有任务页有私有空态、其余面板是「暂无 X」；
    本次**未逐一普查**还有多少面板仍在手写「暂无」，故不做断言。
- `js/core/error-guard.js` :: error-guard.js - v20.87 全局异常兜底 · 此前全项目没有 window.onerror：任何未捕获异常都表现为「点了没反应」，玩家无从知晓。 · 这里做三件事： · 1. 捕获脚本运行时错误与 Promise 未处理拒绝，给玩家一条人话提示（节流，同一错误 10 秒只报一次）
  - **机制摘要**（53 行 · 全局异常兜底）`window.addEventListener('error', …, true)`（**捕获阶段**，L154）
    + `window.addEventListener('unhandledrejection', …)`（L171）。三件事：①给玩家一条人话提示
    「⚠️ 游戏遇到一点小问题（位置），刚才的操作可能没生效。进度不受影响，可稍后手动存档。」
    （L149）②详情进 `console.error`（含 `文件名:行号`，L160-167）③资源加载失败（`ev.target.src/.href`）
    只 `console.warn('[资源加载失败]')` 不弹窗（L155-159）。**节流**：同一错误 10 秒只报一次（L145）。
    依赖 `window.showMessage`（错误发生时才调用，届时已就绪）。**对外接口**：0（纯副作用）。**事件**：2 个 DOM 事件。
  - **缺口** 未发现缺口。记档：提示层自身坏了会静默（L151 空 catch），即「提示也报不出来」这一层没有兜底；
    另 L154 用捕获阶段监听，与 `error-guard` 必须最先加载的约定（manifest 第 0 层）配套。
- `js/core/event-bus.js` :: event-bus.js - 统一事件总线 · 为任务系统提供标准事件发射/订阅机制 · 加载顺序建议：第0.5层（game-state.js之后，quest-system.js之前）
  - **机制摘要**（86 行 · 事件总线）`var EventBus` 5 个方法：`events` 存储 + `on` / `emit` / `off` / `once`。
    三个口径细节：①`on()` 用 `indexOf` 去重（同回调挂两次只挂一次，L18）并**返回退订函数** `unsubscribe()`
    （L20-23；注释记录了改成这样的原因——`long-retreat` 的「闭关至事件」一直把旧返回值当 unsub 用，
    旧返回是总线对象 ⇒ `unsub()` 必抛 TypeError 被 try/catch 吞掉，每用一次泄漏一个 `worldCalendar:due` 监听器）。
    ②`emit()` 每个回调包 try/catch，单个订阅者抛错不影响其余，并 `console.error`（L29-34）；返回 `this` 支持链式。
    ③`window.GameEvents = EventBus` 是**同一对象的别名**（L63）——旧模块用 `GameEvents.emit('newDay')`
    与新模块用 `EventBus.on('newDay')` 走的是同一条线（`js/time-system.js:359-360` 就是这么发的）。
    `EventTypes` **14 项**标准事件名常量（L68-83），同时挂 `window.EventTypes`。**加载顺序**：game-state 之后、
    quest-system 之前。
  - **缺口** ①`EventTypes` 号称「标准事件类型…供任务系统订阅」，实测全仓 `EventBus.emit('X')` 共
    **63 个事件名，其中 49 个不在表内**（`quest:accepted` `quest:completed` `sect:joined` `sect:donation`
    `sect:vote:*` `sect:goal:*` `reward:applied` `resourcePoint:*`（5 个）`puppet:*`（5 个）`formation:*`（3 个）
    `market:*`（3 个）`npc:lineage:*`（4 个）`npc:action:done` `tournament:*` `talisman:advanced:*`
    `cave:*`（4 个）`dungeon:dynamic:*`（6 个）`beast:ecosystem:*` `lifeSkill:grew` `reputation:changed`
    `reincarnation:*` …）。表本身还被 `js/core/world-calendar.js:366-380` 运行时追加 3 个键
    （`WORLD_CALENDAR_DUE/REGISTERED/SUMMARY`）⇒ 运行时 17 项，仍是 63 个 emit 名的**真子集**。
    ⇒ 这张表不能当事件清单用，只能当「14 个老事件名」的兼容别名表。
    ②`patrol:completed`(L81) 的 emit 点是**三元表达式**（`js/sects/sects-system.js:1415`
    `EventBus.emit(obj.type === 'patrol' ? 'patrol:completed' : 'escort:completed', …)`），
    用字面量 grep 会误判成「只有订阅没有 emit」——已复核，**活的**（记此避免再误判）。
- `js/core/festival-bridge.js` :: festival-bridge.js — 节日的帖（v20.28）
  - **机制摘要**（320 行 · 事件桥：道侣节庆约）`FESTIVAL_DEFS` **4 条**（一年四节）。
    **世界历口径（L31）**：每 30 天一月、12 月一年 ⇒ 一年 360 日；month/day 折成岁内日序（doy）。
    **单位病已修（L26-28）**：文案写「占一整天」而账上只收 60 分钟——`advanceTime` 单位是分钟，
    一日=1440、1 时辰=120；旧口径陪道侣过节只花 1 小时、同日还能再干 23 小时的活，
    「时间挤不出双倍」的核心设计被架空。现按 1440 收。
    **每日钩子（L103-115）**：上一场节已过、帖还悬着没回 → 最重一档；**L115-116 豁免闭关者**——
    长期闭关的日结是同步循环，节帖弹了也点不到，不豁免则闭关跨节必吃罚（每位道侣各扣 5 好感）。
    **双向闸（L208）**：这一夜的节已许了别人，就不该再来赴第二场。
    **信任/深情涨路（L221/L223）**：陪到底比平日一约更真 → 信任 +2（0~100）、深情 +1。
    **到期弹窗（L256-283）**：无弹窗环境（自动化/测试）不做主会让帖悬着——夜只有一夜，就陪此刻情面
    最重的一个，其余如实回绝，两头不留悬账。**依赖** `WorldCalendar` 订阅、
    `js/core/world-calendar.js` 的 doy/岁序算法（festival-calendar 照抄本文件，不另立历）。
  - **缺口** 本次只读轮廓与关键段，**未发现**注释与实现相悖处。待核项：`FESTIVAL_DEFS` 4 条的
    key/doy 具体值未逐条抄录到本文（避免抄错），需要时读 `festival-bridge.js` 的 `FESTIVAL_DEFS` 定义段。
- `js/core/festival-calendar.js` :: festival-calendar.js — 节日常历（把一年四节登记进世界日历）
  - **机制摘要**（99 行 · 镜像登记）把 `festival-bridge.js` 的 `FESTIVAL_DEFS`（4 条）登记进 `WorldCalendar`。
    纪律（头注释）：**镜像不真源**——只 register，不裁决、不发奖、不改任何既有节日行为；
    历法不另造（`YEAR_DAYS = 360`，`nextOccurrence` 照抄 festival-bridge 的岁序算法，含岁尾看得见来年开年的节）；
    id 带绝对日（`festival.<key>.day<abs>`）让来年同一节能重新登进来；零新存档字段（日历本身走
    `StateRegistry('worldCalendar')`）。`sync()` 返回本次新登记条数。
    **对外接口** `window.FestivalCalendar` 3 个：`sync` / `nextOccurrence` / `nextFestival(absDay)`
    （后者给庙会摊和闭关界面共用的「下一个节」准话）。**触发**：载入时同步一次 + `DOMContentLoaded` 再一次
    + `EventBus.on('newDay')` 每次（L435-461，三重触发，靠 `WorldCalendar.register` 同 id 拒绝来幂等）。
    **消费方（实测）** `app.js` 4 处、`js/city-facilities/festival-fair.js` 1 处。
  - **缺口** 未发现缺口。记档：`sync()` 在 `newDay` 里无条件跑，每次都会对已登记的 4 个节再 register 一次，
    幂等性完全依赖 `WorldCalendar.register` 的「同 id 拒绝」（`world-calendar.js:134`）——若那处语义变了，
    这里会开始重复登记。`window.FESTIVAL_DEFS` 由 festival-bridge 挂在 window，读的是全局真源（确认成立）。
- `js/core/game-scheduler.js` :: game-scheduler.js — 游戏时间调度器 · 禁止把“7天后回来/3天后逾期”绑定到现实 setTimeout。 · 调度项只保存 type + payload + dueMinute；执行器由模块注册，天然可存档恢复。
  - **机制摘要**（133 行 · 调度器 + 持久化）`window.GameScheduler` 与 `window.XianXia.GameScheduler` **同一 api 对象**，
    10 个方法：`registerHandler` / `schedule` / `cancel` / `cancelByType` / `processDue` / `serialize` /
    `deserialize` / `reset` / `getTasks` / `nowMinute`。任务只存 `{id,type,dueMinute,payload,repeatMinutes,createdMinute}`，
    `payload` 入队前做 `JSON.parse(JSON.stringify())` 深拷(L37)，队列按 `dueMinute` 升序维护。
    **驱动**：`EventBus.on('time:advanced', ev => processDue(ev.toMinute))`(L131) —— 唯一驱动点，**不订 `newDay`**。
    **失败不丢**：`processDue` 把到期项挪出队列逐个跑，处理器返 `false` 或抛错就**重新入队**（L78-90 注释明写
    「避免加载顺序导致永久丢失」）。
    **持久化**：`StateRegistry.register('gameScheduler',{version:1,export:serialize,import:deserialize,reset})`(L128)；
    `deserialize` 读完立刻 `processDue(nowMinute())`(L105) 补跑读档期间已过期的任务。
    **实测任务类型 6 种，全部有 `registerHandler` 配对、无孤儿**：`travel:complete`(travel-system.js:490 排 / :807 执行)
    · `auction:settle`(economy/auction-service.js:89 / :667) · `protection:expire`(gameplay/protection-system.js:41 / :92)
    · `mail:auto_reply`(mail-system.js:348、:468 排 / :583 执行) · `npc_borrow:overdue`(npcs/npc-borrow-service.js:53 / :158)
    · `npc_life:return`(npcs/npc-life-system.js:266、:579 排 / :568 执行)。
    **消费方（实测 20 文件）** 排任务的 6 本 + 读 `nowMinute()` 的 8 本（app.js:4872、city-facilities/eatery.js:85、
    cultivation/cultivation.js:1657、economy/auction-service.js:39、npcs/npc-bond.js:116、npcs/npc-system.js:36、
    sects/sect-events.js:317、core/content-validator.js:91）。**依赖** `timeSystem.gameTime` → `gameTime` → `0` 三级回落。
    **事件**：★订 `time:advanced`（**不订 `newDay`**）。
  - **缺口** ★①`repeatMinutes`（周期任务）**全项目零使用**：实测 6 个 `GameScheduler.schedule(` 调用点
    （auction-service.js:89 / protection-system.js:41 / mail-system.js:348、:468 / npc-borrow-service.js:53 /
    npc-life-system.js:266、:579 / travel-system.js:490）**没有一个传 `options.repeatMinutes`**，`options` 里只有 `id`
    ⇒ L84-87 的「成功后改期重排」分支永远走不到，能力建成空转。
    ②`nowMinute()`(L13-17) 第三级回落返 **`0` 而不是抛错** ⇒ 若 `timeSystem` 未加载或 `gameTime` 未初始化，
    `schedule` 的 `Math.max(nowMinute(), …)`(L32) 会把所有到期时间压到 0，`processDue` 一律立刻触发（静默提前）。
    ③`dueMinute` 钳位同样是 `Math.max(nowMinute(), …)`：**传入的到期时间若已早于当前分钟**（读档后时钟前进、
    上游重新 schedule 同一件事），会被静默改成立即到期，无日志无注释。
    ④`handlers` 用 `Object.create(null)`，`registerHandler` 允许重复覆盖且**无告警**(L27)；
    同为注册表的 `StateRegistry.register` 重复注册会 `console.warn`(L21) ⇒ 两处同款机制，一处有重复告警一处没有。
    ⑤「失败重入队」**无退避上限**：处理器持续返 `false` 的任务会在每次 `time:advanced` 重排、永不离开队列
    （`auction:settle` 的 `settlePlayerListing` 在「非玩家货或非 active」时早退，**无法判定**它返不返 `false`）。
- `js/core/game-state.js` :: game-state.js — 统一存档世界状态（B1 停止数据损坏） · 职责： · 1. 角色级 localStorage 键清单与清理 · 2. 收集/应用完整 GameState（进存档槽） · 3. 新游戏重置各系统内存态
  - **机制摘要**（**实测 1441 行**，注：`Measure-Object` 数出 1233 是本会话早期版本，文件已被其它会话改动到 1441 行
    · 混合：存档聚合器 + 新局重置器）
    `window.GameState` / `window.XianXia.GameState`，**9 个成员**、4 个函数 + 3 张常量表 + `version:'3.1'`。
    **三张键表（实测）**：`CHARACTER_STORAGE_KEYS` **37 键**（角色级，`clearCharacterStorage` 逐键 remove）
    · `SIDE_LEDGER_KEYS` **4 键**（`xianxia_merged_skills` / `xianxia_asm_ledger` / `xianxia_collective_ledger` /
    `xianxia_rival_chain_cd`，值是 JSON 原文，随 `saveData.sideLedgers` 成对往返）
    · `ACCOUNT_KEYS` **3 键**（`xianxia_settings` / `xianxia_ngplus` / `xianxia_endings`，只在新局勾 `alsoAccount` 时清）。
    `clearCharacterStorage(options)` 另扫 **4 个动态前缀**：`xianxia_map_seed` / `xianxia_sect_cd_` /
    `xianxia_specialty_` / `npc_storyline_progress_`（先收集再删，避免遍历中改集合）。
    **`collectFullGameState(ctx)`**：`saveData` 字面量 **195 行 / 122 个顶层字段**，从
    `charData` + `inventory` + `_playerPhysiology` + `bodyDurability` + `activeBuffs` + `skillPages` +
    `partyData` + `discipleState` + `eventFlags` 等处逐字段收，末尾再把 17 本旁账
    （`xianxia_reputation`/`lifespan`/`location_data`/`travel_data`/`world_events`/`city_temp`/`factions`/
    `landmarks`/`enhancement_pity`/`choices`/`scenario_progress`/`sect_join_state`/`daily_events`/
    `arena_ranking`/`social_cooldowns`/`npc_records`…）**原样搬进 `saveData`**。
    `serializeInventorySlots` 每槽收 **11 个字段**（含 v25.1·试-07 补的 `enhancementLevel`/`refineLevel`/
    `enchantType`/`armorDurability`/`customProps`/`markedForSale`）。`buildSaveMeta` 造摘要槽用的轻量元信息。
    **`resetWorldForNewGame()`** 逐系统归零（`StateRegistry.resetAll()` → `resetQuestProgressForNewCharacter`
    → `resetWorldEventsState` → 境界/根骨/装备/运功/行囊/灵兽/洞府/任务/队伍/宗门/熟练度/NPC/旗标…），
    行囊重置为 `{copper:100, spiritStones:10}`、`maxSlots` 默认 30、`markedForSale = new Set()`，
    并清 `TradeService._buybackItems/_quotes/_quoteIdCounter`。
    **`applyFullGameState(saveData, hooks)`**：开头 `clearCharacterStorage()`（先清后灌）→ 回灌 122 字段 →
    `writeKey` **24 处**逐键写回 → 重跑 **15 个 `init*` 函数**（`:1325-1335` 名单：`initReputationSystem`
    `initProfessionSystem` `initLifespanSystem` `initLocationSystem` `initTravelSystem` `initWorldEvents`
    `initFactionSystem` `initLandmarkExplore` `loadPityData` `initChoiceMemory` **`initScenarioEngine`**
    `initSectJoinFlow` `initDailyEvents` `initBeastTaming` `initHouseSystem`）→ 补两处「落盘后立刻回灌内存」
    （`loadWorldEvents` / `loadCityTempModifiers`，v109 修会话内读档内存脱钩）。
    **持久化**：本文件不新增 localStorage 键，只搬运别人的键；模块自注册走 `core/state-registry.js`
    （实测 86 键）。
  - **缺口** ★①**`clearCharacterStorage()` 会把 `xianxia_save` 自己删掉** —— `:1416-1419` 的注释自陈：
    「本函数开头 clearCharacterStorage() 会连 `xianxia_save` 一起删（它在 CHARACTER_STORAGE_KEYS 里），
    而那一份正是此刻应用的档——读一次等于抹一次」，靠末尾 `:1420` 的 `writeKey('xianxia_save', saveData)` 补救。
    ⇒ **任何在这两行之间抛错的读档路径，都会把玩家的主档删掉且不回写**（`xianxia_save` 是
    `core/auto-save.js` 独写的那个键，自动档只活这一份）。
    ②**`resetAll()` 漏掉 `sectCrisis`**（跨文件闭环，已实测）：`resetWorldForNewGame:664` 调
    `StateRegistry.resetAll()`，而实测 86 个注册键里**只有 `sectCrisis` 没有 `reset` 处理器**
    ⇒ `resetAll()` 静默跳过它，**新开局残留上一局门派危机账**。
    ★③**账号级与角色级的边界有 4 个键靠「不在任何表里」维持**：`xianxia_map_overlay`（`:26-29` 注释明确
    「**不列**」并给了理由：它是显示偏好不是探索残留）、`xianxia_map_seed`、`xianxia_sect_cd_`、
    `xianxia_specialty_` —— 后三者在 `clearCharacterStorage` 里被**前缀扫除**（属角色级），
    但**没有被 `collectFullGameState` 收进 `saveData`**（除非它们被写进了 122 字段之一，**无法判定**——
    本批未逐键追这三个前缀的写入方与收集口）⇒ 若它们只靠自己的键存活，读档即清零。
    ④`collectFullGameState` 的 122 个字段与 `applyFullGameState` 的回灌是**两份手写清单**，
    没有任何一致性断言；`:1072` 与 `:1090`/`:1096`/`:1106`/`:1159` 等处可见
    「先 import 再裸赋 `global.playerQuestProgress = saveData.questProgress`」的双写模式
    （同一对象两个 owner）—— 与 `scenario-engine.js` 的 progress 同款「双 owner」病灶。
    ⑤`writeKey` **24 处**与 `CHARACTER_STORAGE_KEYS` **37 键**数目不等：差额靠
    「键由别人写、这里只搬运」解释（如 `xianxia_mail_system` 已由 mail 模块自注册，见 `:1249-1250` 的
    F-9 撤回注），但**两表之间没有任何断言**保证不重不漏。
    ⑥`:1325-1335` 的 15 个 `init*` 重载**全部 `try{ … }catch(e){}` 静默** ⇒ 读档后某个系统没被重新初始化，
    不会有任何提示（与本文件其它地方的 `console.warn` 风格不一致）。
    ⑦`resetWorldForNewGame` 里 `global.npcManager = new global.NPCManager()`(L815) 会**整体替换** NPC 管理器，
    任何持有旧实例引用的模块不会自动改指向（**无法判定**是否有这类持有者）。
    ⑧文件被其它会话改动中（板上 git status 显示 M）；本条所有行号取自 **1441 行版本**，与 §1 章里
    「`saveData.version = '3.1'`」一致（`:199` 与 `:1434` 两处各写一份 `'3.1'`，**版本号双写、无单一真源**）。
- `js/core/karma-retribution.js` :: karma-retribution.js - v20.0 2.23 因果/业力报应 · 高善/高恶定期触发善报/恶报（气运/灵石/轻伤），世界对品性的反馈 · 依赖：karma（既有字段）、timeSystem.onNewDaySubscribe
  - **机制摘要**（43 行 · 判定函数 + 新日钩子，全文件只有 1 个函数）`tickKarmaRetribution()` 读
    `currentCharData.karma`：≥**50** 且 `Math.random()<0.15` → 善报（`r<0.5` 气运+1 上限 100，否则
    `DataManager.addSpiritStones(10)`）；≤**−50** 且同一枚骰 → 恶报（`r2<0.5` 气运−1 下限 0，否则
    `health-5`，下限 **1** 不许死）。两条都经 `gameLog.add(msg,'success'|'error')` 记日志。
    驱动走 `timeSystem.onNewDaySubscribe`(L38)；**对外接口** `window.tickKarmaRetribution`(L41)（供测试直调）。
    **持久化**：无自有键 —— 全靠 `currentCharData` 既有字段随主档走。
    **事件**：无（订的是 `timeSystem.onNewDaySubscribe` 旧接口，不是 EventBus）。
  - **缺口** ★①**「每条新日 15%」是逐日掷骰，不是「定期」**：`karma` 高位可以长期停在 50 以上，
    每天各 15% ⇒ 期望约 6.7 天一报；头注「定期触发」未写明这个频率，玩家侧不可预期。
    ②**阈值两侧完全对称且无第三档**：|karma| 在 50 与 49 之间是断崖（全有/全无），
    而 `karma` 在游戏里是频繁小额增减的连续量（实测 `karma` 由多处系统写）
    ⇒ 大多数日子会落在「够不着阈值」的一侧，**疑似**这条账实际触发频率远低于设计预期（**无法判定**各写点的分布）。
    ③**两处 `Math.random()` 直掷骰，无注入点**（L12、L15、L25）⇒ 与 `scenario-engine.js:226` 的
    `window.__scenarioRng` 注入口径、`daily-events.js` 的权重抽取口径都不一致，这一条**无法确定性测试**。
    ④**日写入绕开 DataManager 双源问题的一部分**：灵石走 `DataManager.addSpiritStones`(L20)（正门，好），
    但气运与气血是**裸写** `cd.luck`(L17/L27) / `cd.health`(L30) ⇒ 与 `core/daily-events.js:37-43`
    「`_deAddCopper` 直接写 `currentCharData.copper`」是同款病灶（**疑似**产生双账）。
    ⑤`cd.health ?? 100` 用的是**空值合并**(L30)，而全项目其它地方大量用 `||`；
    这里若 `health` 恰为 `0`（气血已空），`??` 不会兜底，会算出 `Math.max(1, -5) = 1`
    ⇒ 恶报**救不回 0 气血的角色**（记此，`||` 与 `??` 在本文件内混用是一处口径不统一）。
- `js/core/keyboard-shortcuts.js` :: keyboard-shortcuts.js - v20.1 键盘快捷键 · 市面标配：字母键切换面板、Esc 关闭弹窗/战斗、空格战斗继续 · 仅在游戏世界中生效（角色创建输入框内不响应），复用 switchPanel / closeBattle / 移除 modal
  - **机制摘要**（167 行 · DOM 事件委托 + localStorage 偏好）`SHORTCUTS` **12 个字母键** → 面板 id：
    `c→character` `b→inventory` `m→map` `k→skills` `q→quests` `e→equipment` `f→factions`
    `h→house` `p→party` `g→beasts` `a→activities` `d→calendar`；**实测 12 个 id 全部在 `仙侠.html` 里有
    对应 `id="panel-*"` 与 `data-panel` 导航项**（`panel divs` 与 `nav data-panel` 两个集合都恰为这 12 个 +
    `achievements` + `settings`）⇒ 无空键。
    `onKeydown`(L94) 顺序：`_inInput`(INPUT/TEXTAREA/contentEditable) 早退 → **Esc**（不开关也生效：
    先 `closeBattle()`，否则 `_closeTopModal()`）→ `_shortcutsEnabled()` 闸 → `_gameWorldVisible()`
    （`#game-world` 不 `display:none`）→ 空格（点 `#battle-actions button.bg-yellow-600`）→ 字母键 `switchPanel(panel)`。
    v20.66 起字母键/空格**默认关闭**，偏好键 `xianxia_settings.shortcutsEnabled`；设置页开关在
    `仙侠.html:1417` `onchange="toggleShortcuts()"`（实测）。**对外接口 4 个**：`toggleShortcuts`(HTML 挂)
    / `isShortcutsEnabled` / `setShortcutsEnabled` / `syncShortcutsCheckbox`（`app.js:11205` initSettings 调）
    + `getKeyboardShortcuts`(展示用清单)。**事件**：原生 `keydown`（非 EventBus）。
    **`_closeTopModal`(L62) 三级回落**：`XianXia.Modal.top()` 句柄 → `.fixed.inset-0` 通配（滤掉 `hidden`
    与 `STATIC_PANEL_IDS` 3 个静态面板）→ 摘节点；`mailInboxScrim` 与 `mail-modal-scrim` 两路走
    `MailSystemUI.closeInbox()`。NEW-47 注记：`hidden` 的战斗/转世/交互三块静态面板**只能藏不能删**。
  - **缺口** ★①`getKeyboardShortcuts()` 返回 **11 条**（C B M K Q E H G D Esc 空格），
    **漏了 3 个真实生效的键** `F=势力` `P=队伍` `A=活动`（`SHORTCUTS` L18/L20/L21 有、清单 L152-164 无）
    ⇒ 设置面板展示的快捷键表与实际绑定不一致，玩家看不到这 3 个键。
    ②`window.isShortcutsEnabled`(L139) / `window.setShortcutsEnabled`(L140) **外部零引用**
    （HTML 只挂 `toggleShortcuts()`；`app.js` 只用 `syncShortcutsCheckbox`）⇒ 两个死导出。
    ③`XianXia.Modal.top()` 轨的注释（L64）说「存量 **97 处**自建弹层，逐个迁移后此轨退役」
    ⇒ 98 行文件里最优先的那条路径当前**几乎无人走**，实际生效的是 L69 的 DOM 通配兜底。
    ④`_inInput`(L25) **不区分输入类型**（`:checkbox` 也算「输入框内」），且这道早退排在 **Esc 分支之前**(L95)
    ⇒ 用鼠标点完「设置」页的复选框、焦点还留在复选框上时，**Esc 会失灵**（`FIX_NOTES.md:3046`
    已记此条，本处为代码侧复核确认）。
    ⑤`setShortcutsEnabled` 里 `window._settings` 镜像(L49) 与 `xianxia_settings` 键**双写**，
    而 `_shortcutsEnabled()` 只读 localStorage **不读** `_settings` ⇒ 镜像那份无读端（**疑似**残影）。
    ⑥`onKeydown` 不拦 `e.stopPropagation`，也不看 `defaultPrevented`
    ⇒ 快捷键与其它键位监听（**无法判定**还有没有第二份 `keydown` 监听，仓内 `addEventListener('keydown'` 未逐处核）。
- `js/core/knowledge-system.js` :: knowledge-system.js - 功法知识获取层 v9.2 · 解决：装备栏功法浏览预设全开、可直接装备的严重断层 · 唯一数据源约定： · TechniqueDefinition = skillPages（客观定义，不可直接装备）
  机制 417 行 · 状态机 + 双映射表 + 持久化（exportData/importData 走 game-state 的 `techniqueKnowledge` 键）｜关键数据 `KNOWLEDGE_STATES` **6 级**（unknown/heard/seen/studying/learned/mastered）、`STATE_LABELS` 6 键中文名、`MANUAL_TO_SKILL` **54 条**秘籍→功法映射、`NAME_TO_SKILL` **32 键**名称→功法映射、运行账 `techniqueKnowledge`（每条 8 字段：state/source/completeness/deviation/proficiency/maxProficiency/learnedAt/manualId）
  接口 `window.KnowledgeSystem` **22 键** + `window.KNOWLEDGE_STATES` + 便捷全局 `canEquipSkill` / `learnTechniqueFromManual`｜依赖 skillPages、findSkillById、`Codex.discover`（:263 学会即收进 `codex_gongfa` 图鉴）、learnedSecrets（旧账双向同步）、`game-state.js:348/1062-1080` 存读档｜外部消费者 12 个文件（equipment.js ×3、cultivation.js ×2、npcs/skill-transmission.js ×6、npcs/npc-system.js、event-system.js、city-facilities/bookshop.js、grand-legacy.js、inventory.js、party-system.js、cultivation/art-effects.js ×3、core/daily-events.js）｜事件：无
  ★缺口 1（实测：`studying` 档全仓零写入）→ 6 级阶梯第 4 级「正在研读（可修炼，不可实战装备）」的 `'studying'` 字面量**除本文件自身的枚举与 `canPractice` 外全仓 0 处写入**，而 `canPractice()` 本身又零外部调用方 ⇒ 这一档从未被激活，六级阶梯实际只有 unknown / heard / learned 三档在用，`learnFromManual` 的 `options.state` 入口（:282）无人传非默认值
  ★缺口 2（实测：`mastered` 档只被判、不被授予）→ `'mastered'` 作为 knowledge state 同样零写入点；读取方三处（`cultivation/art-effects.js:23`、`cultivation.js:1883`、`equipment.js:577` 注释）都在判「已学会或精通」，但没有任何代码路径把某条 entry 升到 mastered
  ★缺口 3（实测：54 本秘籍塌成 27 门功法）→ `MANUAL_TO_SKILL` 54 条只落到 **27** 个不同 skill id。塌缩最重的：`skill_04` ← 6 本拳掌（基础拳法/铁拳功/绵掌功/金刚掌/降龙掌/太虚拳）、`skill_05` ← 5 本剑法（基础剑法/清风剑法/**烈火剑法**/**冰霜剑法**）、`skill_09` ← 5 本刀法、`skill_18` ← 5 本（太乙剑法/太极剑法/独孤九剑/万剑归宗）、`skill_01`/`skill_03` 各 4 本 ⇒ 注释里写着「烈火剑法」「冰霜剑法」的不同秘籍，学完都是同一门清风剑法
  ★缺口 4（实测：一半功法没有秘籍入口）→ `equipment.js` 的 `skillPages` 有界解析 = **59 门**功法（按 type：内功 17 / 防御 4 / 轻功 6 / 拳掌 4 / 剑法 4 / 医术 5 / 奇门 4 / 绝技 3 / 射术 3 / 长兵 2 / 毒术 2 / 锻造 2 / 炼制 2 / 刀法 1），`MANUAL_TO_SKILL` 只覆盖其中 **27 门** ⇒ **32 门功法（54%）在物品库里找不到能学它们的秘籍**：skill_02、07、16、17、19~45、48、49、50
  ★缺口 5（实测：一张幽灵秘籍）→ `MANUAL_TO_SKILL` 的 54 个键在 512 件运行时物品里查无此物的有 **1 个**：`art_basic_cultivation`（注释写「基础修炼（扩展名）」）⇒ 该映射永远走不到
  ★缺口 6（两张表互相矛盾）→ `:141 '太极剑法': 'skill_05'` 与 `:78 art_taiji_sword` / `:79 taiji_sword` → `'skill_18'` 冲突。实测 `resolveSkillId(null,'太极剑法')` = **skill_05**（清风剑法）、`resolveSkillId('art_taiji_sword')` = **skill_18**（万剑归宗）⇒ 同一门剑法两条路两个答案，取决于秘籍还是名称进来
  缺口 7 个导出零外部调用方（实测）：`canEquipSkill`(:414)、`learnTechniqueFromManual`(:415)、`KNOWLEDGE_STATES`(:412)、`getStateLabel`(:381)、`canPractice`(:187)、命名空间上的 `STATE_LABELS`(:389)；另有 `maxProficiency` 字段写入后无读方
  缺口 `:181 canEquip` 每次调用都遍历 54 条 `MANUAL_TO_SKILL` 做「老档凭秘籍 id 也认」的兜底（O(54)），而它被 equipment.js 3 处 + event-system.js + game-state.js + cultivation.js 逐条调用（后者在读档时逐功法问一遍）
  缺口 `:41` 注释「不再使用心得（不采用）」确已不在表里，但同族的 `deviation`（偏差）字段仍逐条写入且本模块内无任何读方（全仓 48 处 `deviation` 命中均属别处同名字段）
  缺口 `:216` `resolveSkillId` 兜底「找不到则用原 id（仍可记入 knowledge，只是可能无法装备）」——实测 `resolveSkillId('nonexistent_manual')` 原样返回该串、`canEquip` 返 false、`hasDefinition` 返 false ⇒ 知识账会静默长出无法装备也无法验证的幽灵条目
  - **docA-core 补充实测**（与上段合并去重后只留本段独有的）：`resolveSkillId` 的**运行时复现**——
    `resolveSkillId('art_taiji_sword','太极剑法')` → `skill_18`，`resolveSkillId(null,'太极剑法')` → `skill_05`；
    ★**且 `npcs/skill-transmission.js:144` 恰好用 `resolveSkillId(name, name)`（名当 id 传）**
    ⇒ NPC 授艺教「太极剑法」得清风剑法，同一本秘籍给万剑归宗（上段只验了函数本身，未落到调用方）。
    ★死导出补齐（上段列 6 个，实测共 **13 个**）：另加 `techniqueKnowledge` 的 **getter/setter 一对**（:389-390
    无人读写）· `getState` · `getEntry` · `getLearnedSkillIds` · `getKnownSkillIds` · `stateIndex`；
    ⇒ `STATE_LABELS` 只能经 `getStateLabel` 用，而 `getStateLabel` 自己也零引用 ⇒ **6 级阶梯的中文名整套无读端**
    （面板多半自己写死文案，**无法判定**）。
    ★**持久化绕开 StateRegistry**：实测 86 个注册键里**没有** `techniqueKnowledge`，它是 `game-state.js:348`
    收 / `:1063-1064` 放的两处手工接线 ⇒ 与 `core/state-registry.js` 头注「GameState 只负责聚合」的路线不一致。
    ★`learnFromManual:283-286` 的「已学过」守卫写成两段且第二段与第一段条件重叠，`state!=='learned'` 时该守卫
    **恒不生效** ⇒ 残卷可无限重复研读，每次重写 entry 并重跑 `Codex.discover`（疑似可刷，图鉴/熟练度影响**无法判定**）。
    `unlock:241` 的 `meta.force` 是唯一降级口子，全仓**无调用方传 force**（实测 0 命中）⇒ 降级能力建成空转。
- `js/core/mood-system.js` :: 第六十七波 · 心境账（花钱买的开心，终于有了下文） · 心境的写入方早就齐全（茶馆/瓦舍/赌盘/酒楼/画舫/饥饿/入魔/突破失败……），读端却全空 · 死水池一汪，花钱买开心买到的只是个数字。本账接上第一个读者：打坐修炼的效率。
  - **机制摘要**（118 行 · 梯度表 + 每日归位）`window.MoodSystem` **12 个成员**。
    **三张同阈值的梯度表**（阈值一律 `90/70/40/20/-1`）：
    `CFG.TIERS`（修炼乘子 **1.10/1.05/1.00/0.95/0.90** + 五档中文名 神思不倦/心情舒畅/平平常常/心烦意乱/心灰意冷）
    · `COMBAT_MUL`（战斗乘子 **1.05/1.02/1.00/0.98/0.95**，只有玩家的刀认心）
    · `BT_BONUS`（突破加减百分点 **+0.05/+0.02/0/-0.02/-0.05**，加在既有封顶之前）。
    `CFG` 另含 `BASE=50`（常人底色/回落目标）`DAILY_DRIFT=2` `LOW=20`（报信线）`CLEAR=40`（回暖销旗线）。
    `dailyTick` 走 `timeSystem.onNewDaySubscribe`（L101-103）：**闭关豁免**（`window._isInLongRetreat` 时心气不涨不落），
    否则向 `BASE` 每日靠 2；跌破 `LOW` 且 `!_moodLowNoticed` 时弹一次 😔 提示并置旗，回到 `CLEAR` 才销旗（防门槛横跳刷屏）。
    `moodNow()` 夹在 0~100；`cultivationNote()` 只在乘子≠1 时出一句文案。**持久化**：`mood` **已入档**
    （`game-state.js:223` + `:882`，SAVE-03 修的漏白名单），零新 localStorage 键。
    **实测消费方 7 处**：`app.js:1623-1626`（面板标签+乘子）与 `app.js:1831-1835`（修炼结算单）
    · `battle.js:4247-4248`（战斗乘子）· `cultivation/breakthrough-system.js:148-149` 与
    `cultivation/breakthrough-ritual.js:225-226`（突破率 `rate += bonus`）· `cultivation/long-retreat.js:70-71/301`
    （闭关）· `house-panel.js:169-172/239`（洞府页展示）。**事件**：无。
  - **缺口** ★①**「零新存档字段」的口径需要限定**（L8-10 声明）：准确说是「零新 **localStorage 键」——
    `c._moodLowNoticed`(L96/L99) 确实是 `currentCharData` 上**新增的一个字段**，随 `xianxia_save` 走档
    （实测 `game-state.js` 白名单里**没有**它 ⇒ 每次读档重新报一次低心境提示，属轻微重复，非缺陷）。
    ②**三张梯度表无任何一致性断言**：阈值靠手抄三遍（`TIERS`/`BT_BONUS`/`COMBAT_MUL` 各 5 行），
    `pickByMood`(L63) 与 `tier()`(L36) 是两份独立的「按 min 查表」实现。改一档阈值要动三处，漏一处就静默错档。
    ③**新号默认不是「常人底色」而是「心情舒畅」**：`CFG.BASE=50`，而 `moodNow()`(L32) 在 `mood` 缺失时
    返 **80** ⇒ 新角色开局即享 `×1.05`（而不是 1.00）；`dailyTick` 随后每天把它往 50 拉 2 点。
    同一个「无 mood 底色」全项目有三个值：本文件 **80** · `satiety.js:60` 的 `?? 50` ·
    `game-state.js:223/882` 的存档默认 **80**（另 `reincarnation-system.js:53` 转世也写 `mood=80`）。
    ④**12 个导出里 5 个外部零引用**（实测 `MoodSystem.CFG|BT_BONUS|COMBAT_MUL|tier|dailyTick` 在 js/ 内 0 命中）
    ⇒ 死导出：`CFG` `BT_BONUS` `COMBAT_MUL` `tier` `dailyTick`（后两者内部自用）。
    ⑤**`combatMul` 的账只在玩家侧**（L48 注释「只有玩家的刀认心」）——`battle.js:4247` 是唯一读点，
    **无法判定**敌人是否也走了同一处（battle.js 本批才做，会回填）。
    ⑥`cultivationMul` 有两个读点但**两处算法不同**：`app.js:1832` 直接乘进结算，
    `long-retreat.js:71` 走闭关口径（且闭关期内 `dailyTick` 已豁免 ⇒ 闭关多日只有进关那一刻的心境）。 · 神思不倦（≥90）：真元 ×1.10 心情舒畅（≥70）：×1.05
- `js/core/panel-lifecycle.js` :: panel-lifecycle.js — 主导航与动态子面板的生命周期边界
  - **机制摘要**（90 行 · 生命周期管理 + 双轨注册表，两张表同住一文件）`window.PanelLifecycle` 7 个方法。
    **① transient 表**（`transients: Map`）：`register(id,{ownerPanel,removeOnSwitch})` → `beforeMainSwitch(panelId)`
    遍历所有登记项，按 `ownerPanel` 豁免、`removeOnSwitch` 决定摘节点还是只加 `hidden`。
    **② onShow 表**（重构第 5 步，`showHooks: Map`）：`registerShow(id,{onShow})` → `runShowHooks(panelId)`
    返 `true/false`，**返 true 表示已接手**、调用方回落旧 if-else 链。头注自陈动机：`switchPanel` 是巨型
    if-else 硬编码分发（13 个面板分支），新面板要改 3 处（HTML nav + panel div + switchPanel 分支）⇒
    改成面板自注册，`app.js:1075-1076` 查表优先，`app.js:1078 if(!_handled){` 是旧链。
    **实测登记数**：`registerShow` **只有 1 个使用者**（`core/world-calendar-ui.js:268-269` 注册 `'calendar'`），
    `registeredPanels()` 运行时实测返回 `['calendar']`；`register` 内部登记 2 条（见缺口）。
    **消费方** `app.js:1051-1052`（`beforeMainSwitch`）、`app.js:1075-1076`（`runShowHooks`）、
    `location-system.js:2282-2283`（`register`）。
  - **缺口** ★①**`register('quest-panel',{removeOnSwitch:true})`(L78) 登记的是一个幽灵面板** ——
    实测 `仙侠.html` 无 `id="quest-panel"`，全仓 `quest-panel` 仅 5 处：`panel-lifecycle.js:78` 本条、
    `js/quest/quest-system.js:1545/1547/1548/1739`；而 quest-system.js:1545 注释原文写着
    「HTML 任务面板容器是 `panel-quests`，**旧守卫查的 quest-panel（幽灵面板）不存在**」
    ⇒ 这条 `removeOnSwitch` 清理规则**永不命中任何节点**。L77 注释「v12.1 遗留的动态任务面板**如存在**」
    的「如存在」是自知的，但规则仍留在表里。
    ②`'sect-panel'` 被**登记两次、参数完全相同**（L76 与 `location-system.js:2283` 同为 `{ownerPanel:'map'}`）
    ⇒ `Map.set` 静默覆盖，无告警（同 `state-registry.js` 有告警、`game-scheduler.js` 没有，两处口径不一）。
    ★③`hide`(L60) / `remove`(L68) / `registeredPanels`(L36) **三个导出外部零引用**（实测 `PanelLifecycle.hide|remove|registeredPanels`
    在 js/ 内 0 命中）⇒ **三个死导出**（`registerShow`/`runShowHooks`/`register`/`beforeMainSwitch` 是活的）。
    ④`beforeMainSwitch` 只对 `transients` 里的 id 动手，**主面板自己的 `.panel-content` 显隐仍在
    `app.js:1066-1071` 手写** ⇒ 面板生命周期有**两套并行真源**（本文件管动态子面板，app.js 管主面板），
    头注宣称的「统一负责」目前只覆盖后者的一部分。
    ⑤`beforeMainSwitch` 用 `document.getElementById` 逐项查、且 `if(!el) return` 静默跳过
    ⇒ 面板还没建就登记的项会被无声跳过（L78 那条即此结局）。
- `js/core/reincarnation-system.js` :: reincarnation-system.js - v20.0 1.7 转世/轮回二周目 · 死亡/残魂态可选转世：保留前世 1 门功法记忆 + 1 个 NPC 羁绊 + 部分气运 · 转世后从凡人重修，前世功法修炼更快、对前世羁绊 NPC 有莫名亲切
  机制 83 行 · 状态重置 + 单字段持久化｜关键数据 `_pastLifeMemory` 4 字段（skill / npcId / luck / incarnations）；气运口径 `keepLuck = floor(luck * 0.5)`、转世后 `luck = 30 + keepLuck`；功法加成倍率 **1.3**（仅前世那 1 门）；宿慧门槛 `incarnations >= 3`（**只出现在文案里**，见缺口）
  接口 `window.reincarnate` / `window.pastLifeSkillBonus` / `window._inSoulState`｜依赖 SoulStateSystem.isInSoulState、currentSkills、npcManager.getAllNPCs、doAutoSave('reincarnation')；存档走 `game-state.js:288/938` 的 `_pastLifeMemory` 白名单｜调用方 `cultivation.js:472/477`（残魂态面板按钮，onclick 字符串）与 `endgame/ascension-epilogue.js:124`｜事件：无
  ★缺口 1（实测：头注承诺的 NPC 羁绊与气运两笔账写入后无人读）→ 头注写「保留前世 1 门功法记忆 + **1 个 NPC 羁绊** + 部分气运」「对前世羁绊 NPC 有莫名亲切」。实测 `_pastLifeMemory.npcId`（:46 写入）与 `.luck`（:46 写入）**全仓零读方**——外部对 `_pastLifeMemory` 的读取只有 `cultivation.js:473` 读 `.incarnations` 与 `app.js:1819` 经 `pastLifeSkillBonus` 读 `.skill` ⇒ 「莫名亲切」这条从未实现；`.luck` 写进去后也只在下次转世时被 :42 覆盖一次，等于死字段
  ★缺口 2（实测：宿慧是纯文案）→ 头注「多次转世解锁**宿慧**（incarnations>=3）」，`:62` 只在消息尾巴拼一句「宿慧初醒，前世记忆渐可回溯」——全仓**没有任何判定或数值读 `incarnations >= 3`**（`pastLifeSkillBonus` 只比 `.skill.id`）⇒ 轮回三世的收益与一世完全相同
  缺口 `:19` 前置闸 `!_inSoulState() && (cd.health ?? 100) > 0` 语义是「非残魂态且还活着」才拦；`??` 仅在 health 为 null/undefined 时兜底 100
  缺口 `:59` 转世时把 `currentSkills` 逐槽置 null，但 `equipment.js` 的 `currentSkills` 派生与 `game-state.js` 的读档顺序未在同一处收口（**无法判定**：跨文件读档顺序本批未追）
  缺口 **三套转世账并存** → 本文件（唯一被按钮与飞升尾声真正调用）、`extensions/reincarnation.js`（`window.Reincarnation`，自带 `canReincarnate` 与另一套 deeds 表）、`extensions/reincarnation-integration.js`（`window.ReincarnationIntegration`）⇒ 同一玩法三份实现（**无法判定**分工边界）
  - **docA-core 补充实测**（与上段合并去重后只留本段独有的）：★「选前世 1 门**主修**功法」**没有主修概念** ——
    `:27-29` `for (var k in skills) if (skills[k]) { …; break; }` 取的是**枚举顺序第一个 truthy 槽**，
    而 `currentSkills` 是 v9.4 后的**三个运功槽**（`equipment.js` 有 `skillSlots` 三槽）⇒ 留哪门取决于对象键序，
    可能不是玩家主修的那门。★`:38` `a > maxAff` 且 `maxAff` 初值 **0**（严格大于）⇒ **好感 ≤0 的 NPC 一个都留不下**，
    全体为 0 时 `keepNpcId` 保持 `null` 且无提示无日志。★**无幂等保护**：`cultivation.js:477` 按钮无 `disabled`，
  而转世只置 `soulState.active=false`(:57) ⇒ 连点每次 `incarnations+1`、气运再对半（`:54 luck = 30 + keepLuck` ⇒ 收敛到 30）。
  ★**重置清单不完整且未声明**：没清 `_satiety` / `_fastUntilDay`（饱食度与辟谷，见 satiety 条目）·
  `karma` / `notoriety` / `fame` / `affection` / `_killCount` / `_collectionClaimed`；行囊在 `xianxia_inventory`
  独立键里本文件根本没碰 ⇒ **转世带着满行囊重修**（疑似有意，头注只声明保留 name/灵根/attrs）。
  `:53 mood=80` 与 `mood-system.js` 的 `CFG.BASE=50` 是两套底色（详见 mood 条目）。
  `window._inSoulState`(:81) 是本条**唯一**定义点、`cultivation.js:472` 读的就是它 ⇒ **不是死导出**
  （记此以免与 `SoulStateSystem.isInSoulState` 混为两条链）。
- `js/core/reward-service.js` :: reward-service.js — 奖励/代价统一结算
  - **机制摘要**（260 行 · 统一结算通道：单一入口 + 事务包裹 + 回执生成）
    `window.RewardService` 与 `window.XianXia.RewardService` 同一对象，**2 个方法**：`normalize(spec)` / `apply(spec, ctx)`。
    **规范化 18 个字段**（L26-56，`normalize`）：`exp` `spiritStones`(别名 stones) `copper`(别名 gold) `items[]`(可带 `snap` 完整实例快照)
    `take[]`(可带 `uid` 按实例扣) `qi`(别名 qiRecovery) `energy` `health` `cityReputation`(别名 **rep**) `notoriety`(别名 noto)
    `contribution` `affection` `fame` `karma` `mood` `lifeSkill`(单对象或数组，v20.94 起可一次长多门)；全部 `Math.trunc` 取整。
    **三段执行**：①**先验非经济代价**（L97-99：真气/精力/生命任一不足即整笔不落账，返 `qi`/`energy`/`health`）
    ②有货币或物品时包 `EconomyTransaction.run()` 事务（L102-146）：`debit` 负值 → `credit` 正值 → `addSnapshot` 给物
    → `removeByUid`/`removeByTemplate` 扣货，**任一步失败整体回滚**；`take` 带 `uid` 时**扣完验明正身**
    （`:136` 查回快照的 `templateId` 是否等于要的 id，错号回滚）；③**逐项夹逼入账 + 生成回执**。
    **回执纪律**（DES-38，L80-88 `pushGain`）：写前读一次、写后读一次，触顶/见底时报「已达上限，实得+N」而非照抄开价；
    读不到账（`before/after` 为 null）才退回旧口径。**失败 reason 键 12 个**：`no_character` `qi` `energy` `health`
    `transaction_unavailable` `spiritStones` `copper` `item_no_template` `bag_full` `inventory_failed` `missing_item` `economy`
    —— DES-85 已把「背包满/物品无效」糊成一个键的老病灶拆开（依据 `window.addItemFailReason`）。
    **实测调用方 51 处 / 43 个文件**（注释 L78 写的「36 个调用点」已过时）；`STRUCTURE.md:73` 是项目硬规则
    「银钱必须走 `RewardService`，禁止裸写 `inventory.currency.*`」。
    **事件**：★发 `reward:applied`（L250-252，payload `{source, city, reward}`，source 缺省 `'unknown'`）。
  - **缺口** ★①**`affection` / `cityReputation` 会静默丢弃且仍返 `success:true`**：
    L224 要求 `ctx.npcId` + `npcManager` + `npc` 存在才入账，L183 要求 `resolveCity(ctx)` 非空；
    任一不满足就**整段跳过、不进 `messages`、不报错**，调用方拿到的是「成功」但好感/声望**一分为零**
    （`cityReputation` 的头注 L7 恰恰是「`rep` 明确解释为当前城市声望」——最容易踩这条的就是它）。
    ②**`notoriety`（恶名）完全不夹逼**：L192-193 `p.notoriety = _noto0 + r.notoriety` 无上下界，
    而同一函数里 `karma` 夹到 `[-100,100]`、`qi/energy/health/mood` 各有夹逼 ⇒ 恶名可无限累加（**疑似**有意，但口径不齐）。
    ③**灵石/铜钱是唯一不走 `pushGain` 的两项**（L154-155 直接 `messages.push('灵石+' + r.spiritStones)`）。
    DES-38 的立规是「一律写前读一次、写后读一次」，此处是例外。实测 `economy/economy-transaction.js:134 credit()`
    **只有 `Math.max(0, floor)` 下限、没有上限** ⇒ 当前不会说错话，但一旦给货币加封顶就会立刻暴露（记录备查）。
    - **v27.12 增补（2026-10-05 · 货币总闸）**：`apply()` 落账后正向灵石走出资方折付——`ctx.funding` 指明出资方（city/sect）时从对应基金扣（城市悬赏基金/宗门库），无出资方走世界市面池（`world-ledger.js` 的 `worldFloat` 20 万）；池空折付（「市面钱紧，此次只凑得 N」）+ 月度铸币 2% 缓补；每笔流水入 `fundingLedger`（上限 500）。**原子性**：池扣放 `EconomyTransaction` 成功之后（物品失败回滚则钱包不动池）；折付在事务外，不改变上述「credit 无上限」的旧账判断。缺口③「灵石不走 pushGain」的立规仍立。
    ④**`exp` 落到 `p.tempering`、回执却叫「历练」**（L150-152）：`spec.exp` 写的是 `tempering`
    （同 `game-state.js:218` 存档字段 `tempering`），标签叫「历练」——**字段名与文案不同指**，
    读代码的人极易以为 `exp` 是修为。**无法判定** `tempering` 在本项目里的确切语义（体修/历练/熟练）。
    ⑤**注释里的调用点数字过时**：L78「全仓 36 个调用点」vs 实测 51 处 / 43 文件。
    ⑥`checkSignedResource`(L72) 只查「够不够」，**不查上限** ⇒ 真气/精力/生命这类带上限的资源**扣减**走
    另一条路时不会被这条通道拦（只有本通道自己的 +入账才夹逼）。
    ⑦`normalize` 每次调用都重建 18 字段对象，`items`/`take` 各做一次 `filter` 丢弃无 id 项
    ⇒ **调用方传错字段名（`itemId`/`id` 都拼错）会被静默过滤掉**，然后整笔照 `success:true` 返回。
- `js/core/satiety.js` :: v23.1 饱食度：吃饭这件事从此存在 · 审计：食物是「点击→固定数值直加」，全库没有饱食概念，狂吃零代价；辟谷丹承诺「可数日不食」 · 却没有食可辟——假承诺。本模块补上真账： · 饱食度 0~100，随角色存档（currentCharData._satiety），每日结算自然消耗
  - **机制摘要**（73 行 · 纯数值状态机 + 新日结算）`window.satietySystem` **9 个成员**
    （`get`/`canEat`/`eat`/`isFasting`/`startFasting`/`statusText`/`dailyTick`/`FULL_THRESHOLD`/`HUNGER_THRESHOLD`）。
    **四个常量**：`FULL_THRESHOLD=85`（吃撑线）`HUNGER_THRESHOLD=20`（饥饿线）**`DAILY_DECAY=40`**（每日消耗）
    **`MEAL_GAIN=28`**（一顿的饱食）。`_satiety` 初值 **70**（`get()` 里 `== null` 时补种，L23）。
    `canEat()` = 非辟谷期 **且** `<85`；`eat(gain)` 封顶 100（`gain` 缺省走 `MEAL_GAIN`）；
    `startFasting(days)` 置 `_satiety=100` + `_fastUntilDay=absDay()+(days||3)`；`statusText()` 四态
    （辟谷中/吃撑了/饥肠辘辘/尚可）。`dailyTick` 走 `timeSystem.onNewDaySubscribe`（L64-66）：
    辟谷期直接 return，否则 `-40`，跌破 20 则 `mood-5` 并弹一条 🍚 提示。
    **实测消费方 4 处**：`inventory.js:414/418/423-424/452`（用食物物品前先过 `isFasting`/`canEat` 双闸、
    `pill_fasting` 触发 `startFasting(3)`、吃完 `eat()`）· `city-facilities/eatery.js:106-155`（下馆子闸 + 吃 + 显示肚子）
    · `npcs/npc-bond.js:389/399`（送礼「款待」吃一顿，`TUNE.TREAT_SATIETY`）。**事件**：无（订旧接口 `onNewDaySubscribe`）。
  - **缺口** ★①**头注「随角色存档」不成立** —— L4 写「饱食度 0~100，**随角色存档**（currentCharData._satiety）」，
    但 `core/game-state.js:198-300` 的 `saveData` 是**逐字段白名单**（同段 `:223` 的 `mood` 带
    「SAVE-03：心境入档（此前漏白名单）」注、`:288` 有 `_pastLifeMemory` 深拷），**实测 `_satiety` 与 `_fastUntilDay`
    在 game-state.js 里 0 命中**；全仓 grep `_satiety|_fastUntilDay` 只落在 `satiety.js` 自身 9 行
    ⇒ **饱食度与辟谷期都不入档**：存读档后 `_satiety` 丢失，`get()` 的补种把它重置回 **70**（开局值）；
    `_fastUntilDay` 丢失 ⇒ **辟谷中存档再读，辟谷立刻失效**。（与 mood 的 SAVE-03 是同族病灶，同一批修的只补了 mood。）
    ②`MEAL_GAIN` 与 `DAILY_DECAY` **没有导出**（L68-72 只挂了 `FULL_THRESHOLD`/`HUNGER_THRESHOLD`），
    而 `city-facilities/eatery.js:17` 的注释写着「与 `satietySystem.MEAL_GAIN` **同数**（一顿饭的口径）」并硬写 `HOME_SATIETY: 28`
    ⇒ 注释引用了一个**不存在的导出**，真值只能靠手抄同步（改 `MEAL_GAIN` 不会传导到 eatery）。
    ③`dailyTick` 的心情惩罚是**每天叠加**：`if (_satiety < 20)` 每新日都 `-5`，没有「已提示过」旗
    （对比 `mood-system.js:95` 的 `_moodLowNoticed` 抗刷屏）⇒ 饿了 5 天心情 -25 且**每天弹一条同样的提示**。
    ④**辟谷期不免疫心情惩罚以外的一切**：L57 `if (isFasting()) return;` 早退，`_fastUntilDay` 到期后
    当天立刻扣 40（`isFasting` 是严格大于 `absDay()`）⇒ 「三日辟谷」实得两整日多一点。
    ⑤`satiety.js:60` 用 `c.mood ?? 50` 而 `mood-system.js:32` 用 `mood != null ? mood : 80`、
    `game-state.js:223/882` 存档默认也是 **80** ⇒ **同一个「无 mood 时的底色」有 50 / 80 两个值**
    （mood 侧见其条目）。
- `js/core/scenario-engine.js` :: scenario-engine.js - 情境事件链引擎 · 独立核心模块，不依赖任何游戏模块 · 用法：定义情境数据 → 注册到引擎 → 点击"使用"自动弹出面板
  - **机制摘要**（756 行 · 剧本状态机 + 12 个账本钩子的效果总线 + 自带弹窗）
    `window.scenarioEngine`（单例对象，16 个方法）+ **5 个 window 函数**：
    `openFacilityScenario` / `closeScenarioModal` / `startScenario` / `doScenarioChoice` / `initScenarioEngine`。
    三张运行态：`facilities`（注册表）· `activeState`（当前这一出）· `progress`（`facilityId_scenarioId` → 进度）。
    **剧本形状**：`{id,name,icon,desc,startNode,nodes:{nodeId:{desc(可函数),choices:[{text,hint,require,effects,setVars,next}]}}}`。
    `choose(index)` 的执行序（**失败即整笔不落账、不进历史、不推节点**，L71-102）：
    `require` 门 → `_apply(effects)` → 记 `history` → `setVars` → 有 `next` 就推进、否则置 `done:true` 并清 `activeState`。
    **`_apply` 是效果总线**：先 `_resolveVals`（v20.19 现算函数值，`roll`/`cost` 除外；`bank`/`lifeSkill` 内层也现算）
    → `_foldCost`（把 `cost:{qi:30,stones:40}` 取负折进命中分支，函数值报价包一层「先现算再扣本」）
    → 命中分支合并（选项级键并入、分支键覆盖，**`cost` 除外**，防二次扣本）
    → **12 个账本钩子**：`bank`(deposit/withdraw/borrow/repay/lend 5 op) · `pawn`(pawn/redeem/pick 3 op)
    · `fence`(trust/deal/settle) · `peddler`(buy/sell) · `caravan`(open) · `teller`(coerce)
    · `crime`(payBounty) · `deeds`(open) · `crimeworks`(open) · `cases`(open) · `grand`(open/tour/court)
    · `facility`(`useFacility(id,{fromScenario:true})`)
    → 剥掉 12 个账本键后交给 `RewardService.apply(plain,{source:'scenario',city})`。
    **每个钩子都带同一套「其余键」纪律**：若 `eff` 里除该账本键外只剩 `msg/msgType/time`，就地收尾返 `success:true`；
    否则**继续往下走**让剩余键走统一结算。这就是 L561-563 注释说的「剥单」（`caravan` 曾被漏掉，v25.8 补）。
    **门控** `_check(req)` 支持 **8 类**：`realm`（经 `getRealmTier`）`stones` `copper` `qi` `energy` `health`
    `contribution` `items`；不满足时选项**灰掉并显示 `reason`**（不亮按钮，而不是点了才报错）。
    **随机** `_rng()` 支持注入 `window.__scenarioRng` ⇒ 成败分支可确定性测试。
    **持久化**：`save()` 走 `saveToStorage('xianxia_scenario_progress', JSON.stringify(progress))`，
    `load()` 从同名键读回；该键**同时**在 `game-state.js:59` 的 `CHARACTER_STORAGE_KEYS` 里，
    `game-state.js:609-610` 原样收进 `saveData.scenarioProgress`、`:1239` 原样写回、`:1329` 再调 `initScenarioEngine()`
    触发 `load()`（**顺序已核：1239 < 1325-1335**，往返一致）。
    **实测规模**：`register` 调用方 **17 处 / 4 文件**（`city-facilities/facility-batch2.js` 11 个设施、
    `facility-offices.js` 3 个、`facility-qin-venue.js` 1 个、`special-features.js:377` 按 f.name 批量）；
    `openFacilityScenario` 被 `app.js` **16 个 open* 函数**转发（money_house / contract_hall / escort_office /
    charity_hall / arena_stage / observatory / stele_forest / oddity_museum / pawn_shop / auction_house /
    black_market / garden_villa / goulan_washe / household_registry / tax_bureau / court）。
    `initScenarioEngine` 被 `app.js:3520` 调（并列入 `game-state.js:1329` 的重载清单）。
    **事件**：无（纯调用式）。
  - **缺口** ★★①**账本钩子与统一结算不原子**：12 个钩子都是**立刻真实成交**（`BS.deposit` / `PS.pawnItem` /
    `PD.buy` / `FC.deal` …），之后才剥键下落到 `RewardService`。若同一张效果表里既有账本键又有会被
    RewardService 拒的键（如 `items` 撞背包满），返回的是**整体失败**，但**账本那一半已经落账**
    ⇒ 「钱扣了/货出了，界面说这笔没成」。注释只交代了「剥单」，**没交代这个半程提交的口子**。
    ②**`totalSteps` 是节点数不是步数**：`getState():162` 取 `Object.keys(s.nodes).length`，
    面板 `:694` 印「第 `step`/`totalSteps` 步」⇒ 分支剧本会显示「第 1/5 步」这种**总步数虚高**的读数
    （同一剧本不同路线步数不同，不可能有一个真总数）。
    ③`xianxia_scenario_progress` **两个写入方**：本文件 `save()`（每次选完就写）与 `game-state.js:1239`
    （存槽时写）。当前两边内容一致（game-state 只做原样搬运），但这是**双 owner**，
    任何一边改 payload 形状都会静默互覆盖（与 `xianxia_world_events` 等「存档口径落后一代」同族）。
    ④`save()` 的 `saveToStorage` **返回值被丢弃**（L586），而 L585 注释刚把原来那层
    `try{…}catch{}` 以「单源自己吞异常、从不抛」为由拆掉 ⇒ 写盘失败**彻底静默**。
    `load()` 的 catch 同样空抛，JSON 坏了就保留旧 `progress`。
    ⑤**门控只有 8 类**：`notoriety` / `fame` / `luck` / `karma` **无法做 `require`**
    ⇒ 那些账只能进 `effects`，而 `effects` 是「点下去才结算」——想写「恶名 30 才亮这个选项」做不到。
    ⑥`cancel()` **全仓零调用**（实测 `scenarioEngine.cancel` 0 命中）⇒ `closeScenarioModal:739` 注释说的
    「显式『放弃』才应调 `scenarioEngine.cancel()`」**没有任何 UI 入口** ⇒ 半途的进度只能靠
    走完或读档清掉，**没有主动放弃**这条路。
    ⑦`var drest` / `var dk` 在 peddler 块（L419-420）与 deeds 块（L483-484）**同名重复声明**——
    本文件非严格模式所以合法，但两块的「其余键」扫描共用同一批变量名，改任一块易踩（记此，非缺陷）。
    ⑧`openFacilityScenario:642` 把 `info.desc` **不经 `escapeHtml`** 直接 `innerHTML` 注入，
    而选项文案 `s.name`/`s.desc`（L655）同样直出 ⇒ 剧本配置里的引号/尖括号会破版（本引擎的剧本全自写，
    未见外部注入，**无法判定**是否可被玩家输入触达）。
- `js/core/soul-state.js` :: soul-state.js - P0-5 死亡仙侠化 · 神魂系统 · 规划来源：STRUCTURE.md 第十章 系统连接层 P0-5 · 设计定稿（2026-08-24 用户确认）： · 金丹及以上境界，战斗中肉身被毁（头/颈/胸归零 或 血量耗尽）→ 神魂离体（残魂态）
  - **机制摘要**（291 行 · 状态机 + 一次重写 + 面板渲染）`window.SoulStateSystem` **9 个方法**
    + 5 个便捷全局（`isInSoulState` / `checkSoulBlock` / `maybeEnterSoulState` / `showSoulStatePanel` /
    `getRealmUnstableMultiplier`）。账本挂 `currentCharData.soulState = {active, bodyDestroyed, realmIndex,
    sinceDay, weakUntilDay, lostCultivation}`。
    **入口链**：`maybeEnterSoulState(battle)`(L90) 三道闸 —— `getRealmIndex(cd) < 2` 返 false（炼气/筑基走老流程）
    → `isBodyDestroyedLevel(battle)` 假则返 false → 已在残魂态返 true（防重复）。`isBodyDestroyedLevel`(L70) 判两件事：
    `p.physiology.bloodVolume <= 0`，或 `p.durabilities` 的 **head / neck / chest / brain** 任一 `<=0`。
    成功后覆写 `soulState` 并弹 3 条提示 + 开面板。
    **拦截** `checkSoulBlock(actionName)`：实测 **4 个动作口全部接线** —— `app.js:5138` 战斗 / `:1710` 修炼 /
    `:1542` 演武 / `cultivation/breakthrough-ritual.js:723` 突破境界（注意这条**不在** soul-state 里，
    而在 ritual 包装的 `window.performBreakthrough` 里）。
    **重塑** `reshapeBody()`(L126)：费用 `500 × (realmIndex+1)`（金丹 1500 … 渡劫 4500）→ `advanceTime(4320)`（=3 日，
    与头注「推进 3 天」一致）→ 扣 `tempering`/`essence` 各 10%（`floor`）→ `initBodyDurability(attrs)` 重生成满耐久
    并同步 4 处镜像（`bodyDurability` / `_savedDurabilities` / `_savedMaxDurabilities` / `_playerEntity.durabilities`
    + physiology 六项归位）→ 资源回满 → 覆写 `soulState` 为 `active:false, weakUntilDay: day+3`。
    **虚弱期** `getRealmUnstableMultiplier()` 返 **0.9**，实测被 `battle.js:683/797/855` 三处读
    （`this.type === 'player'` 才生效 ⇒ 只有玩家的刀认这条账）。
    **持久化** ★头注成立：实测 `game-state.js:263` 收 `soulState` 深拷、`:915` 回灌。
    **其它消费方**：`window.isInSoulState` 被 4 文件读（`economy/caravan-trade.js:222`、`extensions/cave-siege.js:70`、
    `extensions/jianghu-rank.js:157`、`npcs/rivalry-chain.js:91`——残魂不被寻仇）· `SoulStateSystem.isInSoulState`
    被 `core/reincarnation-system.js:10-11` 读 · `maybeEnterSoulState` 被 `app.js:5995` 调（战败分支）。
    **事件**：无。
  - **缺口** ★★①**境界表只抄到渡劫 ⇒ 飞升/金仙 玩家整条残魂链失效**（与 `enhanced-shop.js:1815` /
    `location-system.js:502`/`:1429` 同源的第 4 处档位表病灶）：本文件 `:14 REALM_NAMES` 9 境
    （炼气…渡劫）与 `data.js:105-114 realmLevels` 的 **9 境完全一致，两处都缺 飞升、金仙**
    （实测 飞升/金仙 在 `cultivation/cultivation.js` 出现 17/7 次，是真实境界态）
    ⇒ `getRealmIndex:20-21` 的 `indexOf` 返 **-1 → 0**，于是：
    `:93 if (getRealmIndex(cd) < 2) return false;` ⇒ **飞升/金仙 玩家肉身被毁也永远进不了残魂态**，
    走普通战败复活；`:64 getReshapeCost` 的默认 `realmIndex=2` 也就永远用不上。
    ②**重塑扣灵石是裸写**：L142-143 有 `XianXia.DataManager` 走正门，但 `else` 分支直接
    `inventory.currency.spiritStones -= cost`，而 L134/L229 的**读**也只在 DataManager 缺席时才读
    `inventory.currency` ⇒ 与 `world-loop.js:144`、`daily-events.js:383` 同族的「裸写钱」病灶，
    违反 `STRUCTURE.md:73`。
    ③**跨文件观察（不属本文件，登记备查）**：`cultivation/breakthrough-ritual.js:717` 把
    `window.performBreakthrough` 存进 `originalPerformBreakthrough`，但实测该变量**全仓仅此一处、从未被调用**
    ⇒ 那层「拦截」包装把原函数彻底换掉、从不回调。
    ④`getHour()`(L33) **定义后从未被调用**（本文件内零引用）⇒ 死函数。
    ⑤`isRealmUnstable` 与 `weakUntilDay` 都用 `getCurrentDay()`，而它读的是 `timeSystem.gameTime.currentDay`
    （**相对日**）而非 `getAbsoluteDay()`（绝对日）——本文件内部自洽，但与全项目主流的绝对日口径不同；
    若将来有「跳日/回档」类玩法，相对日会错位（**无法判定**是否有意）。
    ⑥`maybeEnterSoulState` 只在 `app.js:5995` 一处被调，而该处是**普通战败流程**里的一环
    ⇒ 天劫战败（`app.js:5863` 注释提到）是否真能走到残魂态，取决于那条路径是否也过 `:5995`（**无法判定**，未追）。
    ⑦`reshapeBody` 的扣费在**时间推进之前**：L142 扣钱 → L147 `advanceTime(4320)`（包在 try/catch 里）
    ⇒ 若 `advanceTime` 抛错，**钱已扣、天没推进**，且无回滚（`EconomyTransaction` 那条正门走的是另一套）。
    ⑧`isBodyDestroyedLevel` 的要害部位表是 `['head','neck','chest','brain']` **4 个**，而头注 L4 只写
    「头/颈/胸归零」三个 ⇒ **代码里 `brain` 是第四个要害**。**已复核：`brain` 确实存在**——
    `js/data.js:44` 的 `bodyParts` 第一条就是 `{ id:'brain', name:'脑', desc:'神识中枢…', stat:'intelligence' }`
    （全 22 项；另与 STRUCTURE §10.7 死亡单一名单 `['brain','head','neck','chest']` 四项**完全一致**）
    ⇒ **本条头注漏列「脑」，代码与 §10.7 都没错**（§10.7 早就写对了，是这条头注没跟上）。
- `js/core/state-registry.js` :: state-registry.js — 模块状态注册表
  - **机制摘要**（77 行 · 纯注册表，存档体系的汇聚点）`window.StateRegistry` 与 `window.XianXia.StateRegistry`
    **同一 api 对象**，5 个方法：`register(key,{export,import,reset,version})` / `exportAll` / `importAll` /
    `resetAll` / `diagnostics`。每项做 `JSON.parse(JSON.stringify())` 深拷进出（L14/38/53/97）
    ⇒ **注册进来的状态必须是纯 JSON**（`undefined`/函数/循环引用会静默退化为原值或抛错被吞）。
    三个聚合口各带 per-key try/catch + `console.warn`（L40/54/61）⇒ 单个模块的 export/import/reset 抛错
    **不阻断其余模块**；重复注册 `console.warn` 后覆盖（L21）；`register` 返回 `unregister()` 退订函数(L29)。
    头注自陈动机：「把『每新增一个系统就继续修改 1000 行 GameState』的石山趋势截断」——
    聚合由 `core/game-state.js` 消费（本批未核 game-state.js 的调用点）。
    **实测规模**：运行时 `diagnostics()` **86 个注册键**（`StateRegistry.register(` 在 80 个文件里 86 处），
    **86/86 都有 `export` 与 `import`**；**只有 1 个缺 `reset`**：`sectCrisis`；
    **4 个键声明了 `version>1`**：`auction=3`、`borrowRecords=2`、`npcLifeRecords=2`、`secretLeverage=2`
    （其余 82 个默认 `version:1`）。
    **事件**：无。
  - **缺口** ★①**`importAll` 不做版本迁移**：`version` 只被原样传给 `reg.import(data, version)`(L53)，
    而 4 个声明了 `version>1` 的键是否真的按版本分派，**无法判定**（未逐个核它们的 import 实现）——
    这正是 `version` 字段存在的意义所在，聚合层却完全不解释它。
    ②`sectCrisis` **只有 export/import、没有 `reset`**(实测 `diagnostics()` 里 `hasReset:false` 且是唯一一条)
    ⇒ `resetAll()` 跳过它，「新游戏重置各系统内存态」(`game-state.js` 头注职责 3)对它无效 ⇒
    **门派危机账会跨档残留**（**疑似**，需 game-state.js 侧确认是否另有清法）。
    ③`clone()`(L12) 的 catch 返**原值**而不是抛错 ⇒ 含循环引用/函数的状态会**以非深拷形式**穿过整条存档链
    （失败静默，且是「引用穿透」而非「跳过」）。
    ④`importAll` 的 `!hasOwnProperty(snapshot,key)` 判定(L50)意味着**快照里缺键 = 保留当前内存态**，
    不回落默认值 ⇒ 旧档读进来时新系统会带着出厂默认或上一局的残留跑（与 `difficulty-config.js:921-929`
    「角色字段 → localStorage → 默认」的显式三级读端是两种口径）。
    ⑤86 个键里 `export`/`import` 命名用的是 ES 保留字 `import` 作为**对象属性键**(L25)——
    写法合法但与 `import()` 动态导入同形，读代码易误读（记此，非缺陷）。
- `js/core/world-calendar-ui.js` :: world-calendar-ui.js — 世界日历 UI 渲染
  - **机制摘要**（277 行 · 纯渲染件 + 自注册面板钩子）`window.WorldCalendarUI` / `window.XianXia.WorldCalendarUI`
    **同一 api，5 个成员**：`renderPanel` · `updateNextAuctionBadge` · `updateNextBadgeByCategory` ·
    `renderCalendarPanel`（`renderPanel('calendar-list')` 的别名，给 `switchPanel` 钩子用）· `version:1`。
    两张显示元数据表：`CATEGORY_META` **11 键**（与 `world-calendar.js` 的 `ALLOWED_CATEGORIES` 一一对应，
    各带 label/icon/color）+ `SEVERITY_BADGE` **3 档**（常规/提醒/重要）。全文 `escapeHtml` 转义 5 个字符。
    `renderPanel` 拼三段：未来 60 日（按 `dueAbsoluteDay` 分桶、同日合并）· 近期 30 日（读 `summarizeRange().items`
    的**已归档 log**，因到期事件已从 events 移除）· 30 日分类汇总；三段空态都走 `core/empty-state.js` 的 `xEmptyHtml`。
    **只读不写**：只调 `WorldCalendar.list` / `getNextByCategory` / `summarizeRange`，符合头注「纯渲染」宪法。
    **接线**：①`EventBus.on('newDay', () => updateNextAuctionBadge())`(L254)——**只刷拍卖这一个角标**；
    ②`PanelLifecycle.registerShow('calendar', {onShow})`(L269)——重构第 5 步的**唯一**示范迁移，
    `onShow` 同时刷面板与拍卖角标；③`app.js:1075-1076` 查表接管，`app.js` 里**已无** `panelId === 'calendar'` 分支。
    **DOM 契约**：`仙侠.html` 静态给出 `calendar-next-auction-badge`(:361) / `calendar-current-day` +
    `calendar-upcoming-count`(:656) / `calendar-list`(:657)。**事件**：★订 `newDay`（原生 EventBus）。
  - **缺口** ★①**头注的兜底自陈失效**：L276 的 catch 注释原文「注册失败时 switchPanel 回落旧路径……
    **但旧分支已删**——此 catch 只防 API 形态突变」⇒ 若 `PanelLifecycle.registerShow` 不在位（加载顺序），
    `switchPanel('calendar')` 既没有注册钩子、也没有旧 if 分支 ⇒ **日程面板没有任何刷新入口**（静默空白面板）。
    ②**`renderHeader(now, upcoming, summary)`(L139-149) 定义了但从未被调用** —— `renderPanel` 只拼
    `renderUpcomingSection + renderRecentSection + renderSummarySection`。它那段「第 X 天 · 未来 60 日共 N 项 · **M 类**」
    的 HTML 永不注入；实际头部是 `仙侠.html:656` 的**静态重复版**（只带前两项，无「M 类」），`renderPanel:133-136`
    只回填那两个 span ⇒ **同一句头部有两份实现，JS 那份还多一项**。
    ③`summarizeRange` 被**同参调用两次**（L124 取 `.items`、L125 取整个对象）⇒ 同一区间扫两遍 log。
    ④`renderEventRow(ev, isPast)` 的 `isPast` 在唯一调用点 L171 **恒传 `false`** ⇒ 该参数与其
    `opacity-60` 分支永不触发（`renderLogRow` 已自己带 `opacity-60`）。
    ⑤`updateNextBadgeByCategory`(L97) 注释写「可用于未来扩展」，**外部零引用** ⇒ 死导出；
    其余 10 个 category 的角标元素在 `仙侠.html` 里**也不存在**（只有 `calendar-next-auction-badge`）。
    ⑥`WorldCalendarUI.` 在 js/ 内的引用**全部落在本文件内**（实测 8 处命中皆为自身）——本文件靠
    `PanelLifecycle` 闭包自驱，api 表面没有任何外部调用方（**不是死文件**，但也没有第二个消费者）。
    ⑦「近期 30 日」用的是 `Math.max(0, now-30)`，而 `world-calendar.js` 的 log 里可能有第 0 日之前的条目
    ⇒ 两者口径差一天（无实际影响，记档）。
- `js/core/world-calendar.js` :: world-calendar.js — 世界日历（WorldCalendar）单例
  - **机制摘要**（449 行 · 事件日程表 + 镜像宪法 + 存档桥）
    `window.WorldCalendar` / `window.XianXia.WorldCalendar`（同一 api），**17 个成员** + 一个
    `Object.defineProperty` 的 **非枚举 getter `day`**（L425-441：`getAbsoluteDay()` → `timeSystem.getAbsoluteDay()`
    → **都没有就返 `undefined`**；第六十七波时钟根治的补法，为的是全库读 `WorldCalendar.day` 的老读者不再恒得 0）。
    **`ALLOWED_CATEGORIES` 实测 11 类**：`auction` `sect_event` `world_event` `dungeon_window` `festival`
    `npc_appointment` `tribulation` `sect_tournament` `sect_meeting` `centennial_gathering` `other`；
    `SEVERITY_LEVELS` 3 档。`register(def)`(L126) 七道校验后入库，**同 id 直接拒绝**（L135「避免静默覆盖」）。
    `consumeDue(day)`(L213) 是唯一的到期裁决：到日事件记 log「如期」并**移出事件表**（第一百一十一波修的
    「同一事件双记账」），过期未消费的记 log「已过期」，其余留下。`pushLog` 封顶 **200 条**。
    `summarizeRange(from,to)` 按 category 分桶给「出关摘要」用；`subscribe/unsubscribe` 给「闭关至事件」用。
    **持久化** ★`StateRegistry.register('worldCalendar',{version:1, export/import/reset})`(L355)，
    `deserialize` 读档时**再做一次 category 白名单校验**，无效条目丢弃（L320-334）。
    **实测 `register` 调用方 5 处 / 4 文件**：`core/world-loop.js:106`（兽潮提醒）与 `:290`（兽潮结束）
    · `extensions/dungeon-dynamic.js:142` · `sects/sect-events.js:437` · `world-events.js:210`
    （另 `core/festival-calendar.js` 走镜像同步登记 4 条节令）。**`subscribe` 实测 2 处**：
    `dao-bridge.js:193`（道侣到期裁决）、`festival-bridge.js:300`（节庆到期裁决）——`reset()` 的注释
    L341-343 明说「订阅不清」，否则新局节帖照发、裁决弹窗不来。
    **事件**：★发 `worldCalendar:registered`(L150) 与 `worldCalendar:due`(L238)；★订 `newDay`(L390)。
    `safeEmit` 会同时发 `EventBus` 与 `GameEvents`，但 `event-bus.js:63` 的 `GameEvents` 是**同一对象** ⇒ 第二发被跳过。
  - **缺口** ★①**注释与实现相悖：过期事件其实被移除了**。L226-229 注释写「过期未消费：归档为"已过期"，
    **不移除**（保持可追溯）」，但该分支**没有** `remaining.push(e)`，而 L233 `state.events = remaining`
    ⇒ 过期事件在写完 log 后**一并从事件表消失**。注释描述的语义与代码相反。
    ②**`oneShot` 是一个存了但从不读的字段**：L145 入库、L331 读档、L122 文档注释三处提到，
    而 `consumeDue` 在第一百一十一波改成「如期即移除」之后**没有任何分支再读它**。
    可实测的反证：4 个调用方**明确按 `oneShot:false` 表达不同语义** ——
    `economy/auction-service.js:66`（注释「拍卖每天开市」）、`sects/sect-events.js:445`、
    `world-events.js:217`（注释「事件持续多日，**calendar 会在 endDay 自然归档**」——这个预期不成立）。
    ③`EventTypes.WORLD_CALENDAR_SUMMARY`(L375-377) 被注册为标准事件名，但全仓 `worldCalendar:summary`
    **零 emit** ⇒ 死事件常量（另两个 `WORLD_CALENDAR_DUE/REGISTERED` 是活的）。
    ④**`renderPanelHtml`(L292) 与 `unsubscribe`(L257) 外部零引用** ⇒ 两个死导出；
    `renderPanelHtml` 返回的 `{now, upcoming, recent, summary30}` 结构化数据由 `core/world-calendar-ui.js`
    自己重算了一份（见其条目缺口②）。
    ⑤`region` 字段入库并在 UI 上渲染成 `@地名`，但 **`list()` 不支持按 region 过滤**（只有 `fromDay/toDay/category`）
    ⇒ 分城日程查不了。
    ⑥`deserialize` 对 `state.log` 只做 `slice(-200)`，**不校验条目形状**（events 校验了、log 没校验）
    ⇒ 存档被手改时 `summarizeRange` 会在 `l.atDay` 上拿到 `undefined`。
    ⑦`register` 的 `reason` 里有 3 个是拼出来的（`invalid-category:` + 值），其余是固定字面量
    ⇒ 调用方想穷举失败原因得做前缀匹配（**无法判定**是否有调用方真在做这件事，未逐处核）。
- `js/core/world-loop.js` :: world-loop.js - 主循环真集成 (v20.0) · 把 v19.x 各模块 tickDay / 捕捉池 / 物价接到 newDay 与真实玩法。 · 单一真源：只挂 EventBus.on('newDay')，不包装 timeSystem.onNewDay
  - **机制摘要**（387 行 · 日调度总线 + 兽潮生命周期编排）`window.WorldLoop` / `window.XianXia.WorldLoop`（6 个成员）。
    `tickAll(payload)`(L77) 是全项目**唯一**把各模块 `tickDay` 接到日循环的地方，一次驱动 **13 条子系统**：
    `BeastTide` · `BeastTideAndGarden.getState`（潮息剩 ≤3 天提醒，每个 tide 只提醒一次，`_tideRemindDay` 去重）
    · `BeastEvolution.tickDayHealing` · `MarketDynamic` · `ResourcePoints` · `PlayerSect` · `PuppetSystem`
    · `CaveFacilities`（`HOUSE_TO_CAVE` 5 档映射 + 药草 DES-72 修）· `DungeonDynamic.generateDaily(day,month)`
    · `NarrativeConsequence.processDay` · `BeastEvolution.bondDay`（逐只灵兽）· `BeastGarden`/`CaveFacilities` 训练
    （`trainHousedBeasts`）· `BeastEcosystem.getActiveBeastBuff('scout')` → `DungeonDynamic.listScouted`（雷鹰回巢播报）。
    **月序** `month = floor(((day-1) % 360)/30) + 1`（一年 360 日）。每条子系统都裹 `safeCall(name, fn)`
    ——**任一抛错只 `console.warn`、不影响其余**(L68-75)。兽潮另接 `beast:tideStarted` / `beast:tideEnded`，
    编排 6 件事：登记日历结束日 → `WorldJournal.record` → `Codex.discover`（世界 + 稀有兽）
    → `MarketDynamic.applyWorldEvent('beast_flood')` → `NarrativeConsequence.applyConsequence` → 刷 3 个 UI。
    **行情归属** `mapMarketCity(location)`：`MarketDynamic.CITIES` 命中 → `locationSystem.getCityRegion`
    → `MARKET_CITY_ALIAS`（**12 键**，含「东荒→东海」的 v111 修正与 v42 补的「灵界/魔界→天空」）→ 兜底 `'中州'`。
    **实测消费方**：只有 `mapMarketCity` 被外部读（`cultivation/long-retreat.js:142`、`enhanced-shop.js:564`、`:1482`、
    `world-events.js:601`）；`tickAll` / `trainHousedBeasts` / `HOUSE_TO_CAVE` / `lastTickDay` / `resetTickGuard`
    **外部零引用**（只被事件驱动）。**事件**：★发 0 条；★订 `newDay`(L368) / `beast:tideStarted`(L369) / `beast:tideEnded`(L370)。
  - **缺口** ★①**灵兽经验被记两次、且两套等级公式打架**：`trainHousedBeasts` 先 `b.exp = (b.exp||0)+gain`(L266)
    并用**自己那套** `needed = (b.level||1)*50` 循环升级(L267-272)，紧接着又调 `BeastEvolution.addExp(bid, gain)`(L274)；
    而 `extensions/beast-evolution.js:157` 的 `addExp` **同样**做 `b.exp = (b.exp||0)+exp`，且用**另一条公式**
    `newLevel = 1 + floor(b.exp/100)`（每 100 exp 一级），会把 L267-272 刚算好的 `level` **直接覆盖**
    ⇒ 一次训练给两份经验、等级按后者重算（L267 那段纯白做）。
    ②**裸写灵石，违反项目硬规则**（`STRUCTURE.md:73`「银钱必须走 `RewardService`，禁止裸写 `inventory.currency.*`」）：
    L144 `inv.spiritStones = Math.max(0, (inv.spiritStones||0) - r.consumed)` 直接改 `inventory.currency`，
    且 L138-141 读的是 `inventory.currency.spiritStones` 而非 `DataManager`
    ⇒ 傀儡灵石这一本账**绕过** `EconomyTransaction`/`RewardService`（与 `soul-state.js:143` 同款病灶）。
    ③**洞府事件只处理第一条**：L161 `var ev0 = caveTick.events[0]` —— `CaveFacilities.tickDay` 返回多条
    `events` 时，**只有第一条**被翻译成药草发放并上屏，其余既不显示也不结算（DES-72 只修了返回值，没修「只取第一条」）。
    ★④**`_lastTickDay` 去重哨兵没有任何人复位**：`resetTickGuard()`(L373) **外部零引用**，`game-state.js` 也不调它
    ⇒ 同一页面会话里读档/开新局，只要绝对日与上一次 `tickAll` 相同，L79 就 `return {ok:true, skipped:true}`，
    **13 条子系统当天全部不结算**（无日志、无提示）。
    ⑤`tickAll` 返回的大 `results` 对象（L82/L84-217）**无人读**——唯一调用方 `EventBus` 丢弃返回值。
    ⑥**训练口径三段叠加、无总封顶**：基础 `gain=4` → `BeastGarden.getBuff(sectId).trainingPct` → `hasPen ×1.2`
    → `getCaveLeyBonus('beast')`，三段各自 `Math.round`，且**不向 UI 播报实际长进**。
    ⑦`_tideRemindDay`(L36) 同为模块内存态、**不随档走** ⇒ 读档后兽潮提醒可重复播一次（轻微，记档）。
- `js/core/world-teeth.js` :: js/core/world-teeth.js — 世界的牙齿：黑市信用簿 + 巡夜罚则（v20.21） · 黑市不看恶名压价——它吃两样：你能带来什么实惠（成交记录）、你的信用如何（有无黑吃黑前科）。 · 账本挂 _fence 字段，随存档白名单成对往返（单一真源，无平行状态、无私自 localStorage）
  - **机制摘要**（105 行 · 纯函数 + 一个懒初始化账本，共 3 个全局）
    ①**`window.FenceCredit`**（6 个方法，同时 `module.exports` 一份，Node 可直测）：账本懒建于
    `currentCharData._fence = {trust, deals, snitches}`（L18，`ledger()` 每次调用把三键 `Number()` 归一）。
    `adjust(delta, kind)`(L44) 裸加 `trust`，`kind==='snitch'` 再 `snitches+1`、`kind==='deal'` 再 `deals+1`；
    `deal(minTrust)`(L54) 先过两道闸（`trust <= -2` 黑名单直接拒 / `trust < minTrust` 信用不足），
    过关才 `deals+1` **且** `trust+1`；`settle()`(L65) 只在 `trust <= -2` 可用，一次把 `trust` 拉回 **0** 并写一条日志；
    `summary()` 返 `{trust, deals, snitches, blacklisted}`；`describe()` 出四档柜台话术（黑名单 / 信用≥4 / ≥2 / 有成交 / 无话）。
    ②**`window.patrolConsequence(noto, rng)`**(L77) 纯函数，头注声明 rng 可注入（不传则 `Math.random()`）：
    恶名 `≤25` → `{action:'none'}`；`26~60` → 50% `{action:'fine',fine:30}` 否则 `{action:'none',wary:true}`；
    `>60` → 50% `{action:'detain',fine:60,qi:15}` 否则 `{action:'fine',fine:60}`。
    ③**`window.facilityBuyMod()`**(L87) 本城买价行情：只经 `locationSystem.getCityPriceModifier(city,'buy')` 读，
    查不到退 `getCityData(city).priceModifier.buy`，再查不到落 **1**（头注「单一真源，不另立表」）。
    **持久化** ★头注成立：实测 `game-state.js:258-259` 收 `_fence` 深拷、`:911` 回灌（`:910` 带
    「旧档无字段按初来乍到处理」的注）。**实测消费方**：`describe/summary` 被
    `city-facilities/facility-batch2.js:444/460/467/468` 读；`adjust/deal/settle` 三个动作经
    `core/scenario-engine.js:390-392` 的 `eff.fence` 分发，数据侧实测 **7 处声明**
    （`facility-batch2.js:453/454/466/482/483`、`facility-batch3.js:269/271`）。
    `facilityBuyMod` 被 6 处读（`app.js:10871`、`facility-batch2.js:365/379/394/416/538`）。
    `patrolConsequence` **全仓只有 1 个调用方**：`core/daily-events.js:368`。**事件**：无。
  - **缺口** ★①**「世界的牙齿」其实只有一颗牙长在市井上**：头注说「恶名的代价在**城法**这边：恶名越重，
    盘查越狠」，但 `patrolConsequence` 的**唯一**调用点是 `core/daily-events.js:368` 里日常事件
    「拱手打招呼」的一个选项 ⇒ **城门 / 坊市 / 驿路等任何城法场景都没有盘查**（**无法判定**是设计上就这样
    还是接线漏了；已核 `app.js`、`location-system.js` 无第二次调用）。
    ②**兜底扣款是裸写**：`daily-events.js:382-383` 在 `DataManager` 缺席时直接
    `currentCharData.spiritStones -= fine`（与 `soul-state.js:143`、`world-loop.js:144` 同族的「裸写钱」病灶，
    违反 `STRUCTURE.md:73`）。本文件自身不扣款（头注「扣钱上身在调用方做」**成立**）。
    ③**两个记成交的口语义不同**：`adjust(+1,'deal')` 只 `deals+1` **不涨 trust**，而 `deal(minTrust)` 涨两样
    ⇒ 用错口会少涨信用。数据侧 7 处声明里 `facility-batch3.js:271` 用 `op:'trust', delta:-1`（办砸记一笔）
    而 `:269` 用 `op:'deal'` ⇒ 当前口径是对的，但两个近似口并存易误用（记此）。
    ④**`snitches` 字段只写不读**：`adjust` 会 `snitches+1`，而 `summary()` / `describe()` / 任何判定都只用 `trust`
    ⇒ 「有无黑吃黑前科」在判定上**等价于 trust 阈值**，`snitches` 是纯装饰账。
    ⑤`deal(minTrust)` 的第二道闸（信用不足）**没有对应话术**——`describe()` 只有四句、覆盖不到
    「需信用 N」这一档，玩家被拦下时看到的是 error 文案而非柜台话术。
    ⑥**头注「无平行状态、无私自 localStorage」成立**，但本文件**没有任何本地存档接口**——`_fence` 完全靠
    `game-state.js` 白名单成对往返，`StateRegistry` 的 86 个键里**没有** `fence`（记档）。

- `js/core/world-ledger.js` :: world-ledger.js — 世界账簿（真实小世界·账本层，v27.12 新增 2026-10-05）
- `js/core/population-ledger.js` :: population-ledger.js — 23 城人口户账（户数/出生/死亡/迁徙按月过账，灾年时疫写入；v27.13 新增 2026-10-06）
- `js/battle/beast-part-family.js` :: beast-part-family.js — 兽形部位族十五格伤势册（BS-015 兽图冻结；兽格 id↔人形槽换算/危急窗口/功能伤；battle/ 目录首件；v27.13 新增 2026-10-06）
- `js/app-city-bureaus.js` :: app-city-bureaus.js — 城署（根件；v27.13 新增 2026-10-06）
  - **机制摘要**（378 行 · 七本账 + 货币总闸）：`marketFlow`（城→当日成交）/ `shopQuota`（店→掌柜收购额度 = 昨日收货 × 0.6）/ `bountyFund`（城→悬赏基金，商税 3% 注入）/ `herbStock`（区域药藏，按旬恢复、冬季停长）/ `fameSeen` + `famePend`（名气分城 + 商旅在途扩散）/ `tickets`（钱票，兑现 2% 水费）/ `worldFloat`（世界市面池 20 万）+ `minted`（累计铸币）+ `fundingLedger`（总闸流水 ≤500）。
  - **存档/日结**：`StateRegistry 'worldLedger'`（version 1）；日结订阅 `timeSystem.onNewDaySubscribe`；依赖 `getCurrentLocation`（缺席退 `'野'`）。
  - **纪律**（头注明写）：账唯一所有者=本文件；文案数字全部出自本账，不编造；成本走世界账、不设人为日限配额——一切闸门都是经济/生态后果的影子。
  - **挂载**：`仙侠.html` + `scripts.manifest.json` 同步登记（v27.12，2026-10-05）。批次小节见《版本记录.md》v27.12；本批遗留五项（直改口定性/设施回流/宗门收入端/矿丹产出登记/行情时滞）见该小节「遗留」。
### js/city-facilities/（34 个）— 城市设施与城中玩法

- `js/city-facilities/bank-service.js` :: js/city-facilities/bank-service.js — 钱庄账房：存款按月起息、欠条到期成真、逾期有人上门 · v20.18：把牌匾上写过的话全部做实。银钱一律走统一结算事务（RewardService→EconomyTransaction）
  机制 328 行 · 混合（角色字段账本 + 新日催收钩子 + 弹窗渲染）｜关键数据 `BankService` 9 方法；账本挂在角色 `_bank`（deposit/depStart/debt/debtDue/lastCol/loansOut 六键 + loansOut 逐条 6 字段）；常量 MONTH_DAYS=30、DEPOSIT_RATE=0.05、LOAN_RATE=0.2、LOAN_TERM=30、LEND_RATE=0.2、LEND_MIN=100、LEND_MAX_EACH=500、LEND_MAX_ACTIVE=2、LEND_REPAY_P=0.80、LEND_LATE_P=0.15、LEND_CHASE_DAYS=15、LEND_CHASE_BACK_P=0.6
  接口 `window.BankService`（9）+ 自身挂 `window.getAbsoluteDay`｜依赖 RewardService.apply（source:'bank'）→EconomyTransaction、XianXia.DataManager.getSpiritStones、NpcCrime.bankBanned/bankBanDays、timeSystem.onNewDaySubscribe、playerPushDeed｜事件：无（不发不订）
  缺口 `bank-service.js:218 checkLoansOut`、`:277 checkOverdue` → 挂在 BankService 上但全仓零调用（`checkLoansOut`/`checkOverdue` 两个名字在 js/ 与 仙侠.html 里只出现在这一处定义），逾期与借出催收实际走的是新日钩子内部另一支 → 疑似改写后残留的死导出
  缺口 `bank-service.js:52` 注释写「余下 5%：卷铺盖跑路」，但 `LEND_REPAY_P=0.80 + LEND_LATE_P=0.15 = 0.95`，余数 0.05 与注释一致；然而 `LEND_CHASE_BACK_P=0.6` 乘出的坏账本金回收率未在面板文案里出现 → 玩家看不到「六成追回、四成坏账」这条明账（无法判定是否有意留白）
- `js/city-facilities/bathhouse.js` :: v25.7 市井烟火批（第一百四十九批）· 澡堂洗尘 · 此前全游戏只有灵泉能「沐浴」（一日一次、全恢复），城里人跑了三天路连个泡汤的地方都没有。 · 本账开一间市井澡堂，三档汤： · 粗澡搓背（5 铜）：小回精力心境，30 分钟——脚夫的档次
  机制 170 行 · 数据表 + 渲染层（弹窗走 showBuildingEffectDialog）｜关键数据 `TIERS` 3 档（粗澡/常汤/雅池）、`CFG` 1 组常量、`CityBath` 6 方法（CFG/TIERS/bathOk/bathe/open/panelHtml）
  接口 `window.CityBath`（6）+ 自身挂 `window.openCityBath`｜依赖 locationSystem.currentLocation、wildMapApi、actionGate、timeSystem.advanceTime、currentBattle 战斗闸、getCitizenGossip、RewardService｜事件：无
  缺口 `bathhouse.js:168 openCityBath` → 导出即死，全域零引用；真正入口是 `CityBath.open`（由 street-life.js:169 菜单按钮点名）
  缺口 `bathhouse.js:152-166 panelHtml` → 函数体两支都 `return ''`（注释自陈「澡堂不单占面板一行——收进「市井烟火」总门」），且 `CityBath.panelHtml` 全域零调用 → 导出 + 实现双死，只为留形
- `js/city-facilities/beggar-alms.js` :: v25.7 市井烟火批（第一百四十九批）· 街角施舍（丐帮眼线账） · 此前乞丐只是市民职业表里的一行装饰（location-system.js 的 CITIZEN_OCCUPATIONS），碰上了什么也做不了
  机制 336 行 · 混合（StateRegistry 账 + 判定函数 + 渲染）｜关键数据 `CFG` 15 常量、运行账 10 键（`StateRegistry.register('beggarAlms')`）、`BeggarAlms` 11 方法
  接口 `window.BeggarAlms`（11）+ 自身挂 `openBeggarAlms` / `playerPushDeed` / `getCitizenGossip` / `getAbsoluteDay` / `growLifeSkill` / `sectAddContribution` / `showBuildingEffectDialog`｜依赖 RewardService、StateRegistry、WorldCalendar、MarketDynamic、itemById/inventory、discipleState｜事件：无
  缺口 `beggar-alms.js:334 openBeggarAlms` → 零引用死导出（真入口 `BeggarAlms.open`，由 street-life.js:173 菜单与 `BeggarAlms.encounter` 调）
  缺口 `beggar-alms.js:293 panelHtml` → 恒返空串 + 全域零调用，与 bathhouse 同款留形导出
  缺口 `beggar-alms.js` 与 street-life.js / citizen-life.js / cave-siege.js 等 8 个文件各自定义了一份 `window.playerPushDeed`；加载顺序里最后一份覆盖前面全部 → 疑似多副本实现，非单一真源（各副本体量小、疑为逐文件复制）
- `js/city-facilities/bookshop.js` :: v25.7 市井烟火批（第一百四十九批）· 书肆淘书 · 功法残页此前只有两条被动路：特产撞脸、奇遇里 60% 的骰（辨认残页）。没有一处能**主动淘**。 · 本账在商埠城开一间旧书肆： · 货架按「城+日」播种现算（CityFaces/跑单帮同款口径）——同城同日翻来覆去就那五本，换城换日换货
  机制 216 行 · 数据表 + 混合（城+日播种货架 + 残页残页购买 + 弹窗）｜关键数据 `BOOKS` 14 条、`CFG` 4 常量、运行账 4 键（StateRegistry 'bookshop'）、`CityBookshop` 8 方法
  接口 `window.CityBookshop`（8）+ `openCityBookshop` / `getAbsoluteDay` / `getCurrentCityName` / `getLifeSkill` / `growLifeSkill` / `showBuildingEffectDialog`｜依赖 `Authoring`（v26.0 著书立说账，卖稿/赠书对接）、`KnowledgeSystem`（功法图鉴生产）、itemById/skillPages、RewardService｜事件：无
  缺口 `bookshop.js:214 openCityBookshop` → 零引用死导出；`bookshop.js:183 panelHtml` → 恒返空串 + 零调用
  缺口 `bookshop.js` 头注称「同城同日翻来覆去就那五本」，实测 `BOOKS` 表 14 条、按城+日播种后单日可见子集才是「五本」量级 —— 头注数字与表长不同口径（不算错，但文档读者会误读）
- `js/city-facilities/case-system.js` :: v27.4 黑道与断案批 · 断案引擎（新文件 case-system.js） · 设计方案 F 引擎：77 破命案 · 78 仵作 · 79 讼师 · 80 自己打官司 · 82 冷案 · 83 缉逃犯领赏 · 84 科场揭弊
  机制 653 行 · 混合（断案状态机 + 战斗分支 + 渲染）｜关键数据 `CFG` 57 常量、`CASE_TYPES` 3 类（命案/劫案/…」）、`BRIEFS` 3、`CLUES` 3、`TESTIFY` 4 作证分支、`SURNAMES`/`GIVEN` 各 16（NPC 名池）、运行账 9 键（StateRegistry 'caseSystem'）、`CaseSystem` 8 方法
  接口 `window.CaseSystem`（8）+ `openCaseSystem` / `settleFugitiveHunt` / `reduceReputation` / `playerPushDeed` / `__scenarioRng`｜依赖 CityJobs（东家/营生）、NpcCrime（案底）、RewardService、StateRegistry、DataManager、reduceReputation、showModal｜事件：无
  缺口 `case-system.js` 内 `enemy` 敌人模板与 `NpcCrime` 双线：缉逃犯走 `settleFugitiveHunt`（外部导出）而 `CaseSystem` 自己的 `spec.enemy` 分支也拼战斗 → 两条缉逃路径并存，是否互斥无法判定（未读到二者的先后闸）
  缺口 `case-system.js` 头注列 7 项（77 破命案/78 仵作/79 讼师/80 自诉/82 冷案/83 缉逃/84 科场），但 `CASE_TYPES` 只 3 类、`BRIEFS` 只 3 条 → 7 项设计在数据层被压成 3 类，其余靠 options 分支（无法逐项判定是否都做实）
- `js/city-facilities/citizen-life.js` :: v25.8 黑道与人情批（第一百五十批 · 用户点单）· 街面人物志 · 此前街头十一种市民（摊贩/书生/工匠/乞丐/道士/武者/老者/妇人/孩童/琴师/棋手）共用一句闲聊
  机制 420 行 · 混合（街面人物状态机 + 抢劫/弱 occupations 分支 + 渲染）｜关键数据 `TUNE` 36 常量、`TRADES` 11 行当（十一种市民的营生）、`TALES` 4、`KID_SAW` 4、`ROB_LOOT` 9、`WEAK_OCC` 2（好抢的营生）、运行账 1 键、`CitizenLife` 10 方法
  接口 `window.CitizenLife`（10）+ `openCitizenLife` / `exploreCity`（由 street-life.js:174 菜单点名 `CitizenLife.browse`）/ `settleCitizenRob` / `settleBeggarWrath` / `getCityCitizens` / `getCitizenGossip` / `playerPushDeed` / `reduceReputation`｜依赖 BeggarAlms（施舍→丐帮眼线）、MarketDynamic、NpcBond、NpcCrime、StateRegistry、inventory、WorldCalendar｜事件：无
  缺口 `citizen-life.js:418 openCitizenLife` → 零引用死导出；`citizen-life.js` 无 `panelHtml`（街面人物志只挂在 StreetLife 菜单内，不单占城市面板一行，与 bathhouse/eatery 同口径）
  缺口 `citizen-life.js` 与 beggar-alms/street-life/fortune-stall/caravan-trade/cave-siege 等 8 个文件各自定义 `window.playerPushDeed` → 后加载者覆盖前者，全仓没有单一真源
- `js/city-facilities/city-faces.js` :: 第七十四波 · 市井花名册（城里的对手，从此有名有姓） · 摆摊的过客、当差的东家、赁屋的牙人、贩货的管事——四本新账的对手全是无名氏。 · 城中人物名册里住的是画圣诗仙那样的名人，市井的脸得另立一本：本账按「城+角色」播种定死一本花名册
  机制 63 行 · 纯数据表（无状态、无持久化、无事件）｜关键数据 `SURNAMES` 24 姓、`GIVEN` 20 名、`ROLE_TITLES` 14 种身份称呼（掌柜/先生/郎中/更头/牙人/管事…）、`STREET_TITLES` 8 种街面称谓、`CityFaces` 6 方法
  接口 `window.CityFaces`（6）：按「城+角色 id」播种定死一张脸（`seedOf` 哈希，不用 Math.random）、`faceOf` 取脸、招牌写法｜依赖：无（纯函数 + 表）｜事件：无
  缺口 `city-faces.js` 是全 34 个城市设施文件里唯一零外部依赖、零持久化的一本——但 `CityFaces` 自身名字在 js/ 内被 city-jobs / city-lodging / street-stall / peddler-service / facility-peddler-contract 5 处读用，缺失时全部退回匿名老话（守卫式读，非硬依赖）
- `js/city-facilities/city-gate.js` :: v26.1 五路进城批（第一百五十二批 · 用户点单）· 城门账 · 用户点单：「过城门那道关——入城钱、守卒拿通缉册比对（正接上两档铁律：特质档难认、画像档 · 一眼就中），易容的走城门心跳加速，被拒了还能夜里翻墙，甚至塞钱买通门卒。」
  机制 276 行 · 混合（城门判定状态机 + 通缉账比对 + 新日钩子）｜关键数据 `TUNE` 18 常量（入城钱/盘查时长/翻墙判定/买通价）、运行账 6 键（StateRegistry 'cityGate'）、`CityGate` 6 方法
  接口 `window.CityGate`（6）+ `openCityGateLedger` / `refusedCity` / `updateCurrencyUI` / `playerPushDeed` / `getAbsoluteDay` / `showBuildingEffectDialog`｜依赖 NpcCrime（通缉册，比对两档铁律：特质档/画像档）、CrimeWorks、Disguise（易容→心跳加速）、RewardService、timeSystem.onNewDaySubscribe、locationSystem｜事件：无
  缺口 `city-gate.js:274 openCityGateLedger`、`:271 refusedCity` → 两枚导出全域零引用；被拒城市的记录无任何读取方（`_st` 里记了但没人看）
  缺口 `city-gate.js` 走 `StateRegistry` 落档，但 `refusedCity` 是唯一写 refused 记录的函数且无人调用 → 疑似 v26.1 接线只做了一半（无法判定是否由 location-system 的 enterCity 间接调，实测 enterCity 侧只见到 `skipGate` 选项，未见 refusedCity）
- `js/city-facilities/city-jobs.js` :: 第七十二波 · 城里长期营生（做一天吃一天的零工之外，终于有了「差事」） · 城里的活计此前全是日结的零工：善堂帮一日厨、镖局搭一趟脚、书肆抄半日书——做一天吃一天， · 没人雇你「长活」。本账把差事开出来：铺子伙计、蒙馆代课、医馆帮手、更夫巡夜 · 应募上岗、按日上工领钱，做满十个工东家涨工钱，旷工七日东家辞人
  机制 525 行 · 混合（长活岗状态机 + 涨工/旷工辞人结算 + 面板钩子）｜关键数据 `JOBS` **4 个长活岗**（铺子伙计/蒙馆代课/医馆帮手/更夫巡夜）、`JOB_ROLES` 4 键（shopkeeper/tutor/doctor/watch_head）、`GIGS` **2 个一回生大差事**（投军远征 enlist·7 日·伤率 0.35 / 护送贵人 vip）、`CFG` 5 常量、`CityJobs` 20 方法
  接口 `window.CityJobs`（20）+ `openCityJobs` / `closeModalSoft` / `showModal` / `playerPushDeed` / `__scenarioRng`｜依赖 CityFaces（东家认脸，带守卫）、RewardService、WorldCalendar、advanceTime/locationSystem、getRealmIndex｜事件：无
  缺口 `city-jobs.js:523 openCityJobs` → 零引用死导出（真入口 `CityJobs.open`，面板按钮与弹窗都点名它）
  缺口 `city-jobs.js` 与 `reputation-system.js` 的 `SPECIAL_QUEST_TEMPLATES` 同名不同物：本文件 `GIGS` 里也有 `patrol` 型差事，而 quest 事件桥的 `questObjectiveMatches` 没有 `patrol` 分支 → 城里「巡城」这类目标的进度只能靠 `_completeCityRepQuest` 手动置位（reputation-system.js:519-529）
  缺口 回归红：`tests/wave72-city-jobs-node.js` 5 条断言与现实现分叉（A6 集市城长活岗数 1≠0、F2 面板该空却有、G1 声称零骰实测 1、G7 顶薪 58≠45、G11 四岗挂既有建筑）→ 测试断言是旧口径，代码侧顶薪已不是 45（无法判定哪边是设计意图）
- `js/city-facilities/city-lodging.js` :: 第七十一波 · 城里赁屋落脚（客栈是过路的地方，不是过日子的地方） · 跑江湖的人进城永远住客栈按天结账——铜钱流水一样出去，推门是别人的门。本账把「家」开出来： · 有客栈的城里可以赁一处落脚（栈舍厢房/街边小院），按月缴租，住在赁屋的城里
  机制 256 行 · 混合（赁屋契书状态机 + 月钱跨日结算 + 面板钩子）｜关键数据 `TIERS` 2 档（栈舍厢房月钱 30 / 街边小院 80 灵石）、`CityLodging` 15 方法（契书只添角色单字段 `_lodging`，五档校验全走归一化）
  接口 `window.CityLodging`（15）+ `openCityLodging` / `closeModalSoft` / `showModal` / `getAbsoluteDay`｜依赖 CityFaces（牙人/隔壁街坊认脸）、RewardService、WorldCalendar、advanceTime/locationSystem、timeSystem.onNewDaySubscribe｜事件：无
  缺口 `city-lodging.js:254 openCityLodging` → 零引用死导出；真入口 `CityLodging.open`
  缺口 `city-lodging.js` 无 StateRegistry 注册——契书走角色单字段 `_lodging`，与本目录其他设施（走 StateRegistry）两套落档口径并存（设计如此，但同目录不一致）
- `js/city-facilities/city-voices.js` :: city-voices.js — 共享建筑分城口吻（v21.5） · 酒楼/客栈/茶馆此前 19 城共用一套话——帝都的官气、渔镇的腥鲜、剑冢的冷硬全被抹平。 · 本表按城备词：建筑弹窗开场、动作结算各一套；building-effects.js / app.js 取词，缺城缺键回落通用文案
  机制 256 行 · 纯数据表 + 取词器（无状态、无持久化、无事件）｜关键数据 `window.CITY_VOICES` 14 城（不是头注说的 19 城）、每城 4 个建筑键 tavern/inn/teaHouse/goulan_washe 中的一到四种、逐城词条 3~13 条不等；`CityVoices.vo(city,building,key,fallback)` 数组键随机取一条、缺城缺键回落
  接口 `window.CITY_VOICES`（:8 数据表）+ `window.CityVoices`（:244，取词器 `vo(city,building,key,fallback)`）｜依赖：无｜事件：无
  缺口 `city-voices.js` 头注写「此前 19 城共用一套话」，实测表里只有 14 城 → 头注数字已过时（与 §0.2 职责行同源，按头注写会误读为 19 城）
  缺口 `city-voices.js` 14 城 vs `location-system.js` `cityData` 23 城 → 9 城无词条、永远走 fallback：东海龙宫、剑阁、太虚山、极寒之地、灵界·九天罡风带、灵界·蓬莱仙境、碧落仙宫、蓬莱仙岛、魔界·血海荒原
  缺口 逐城厚度极不均：帝都·长安/洛水城/鲛人镇 各 13 条（四种建筑全备），凤凰巢/佛国遗址/万剑宗 各只有 3 条（仅 inn）→ 「千城千面」在这本账上是 14 城里的 3 城最厚、11 城残缺
- `js/city-facilities/cricket-fight.js` :: v26.1 五路进城批（第一百五十二批 · 用户点单）· 斗蛐蛐账 · 用户点单：「巷子里斗蛐蛐——郊外捉虫、养性子的蛐蛐、巷口赌局下注，虫有品相脾气， · 赢了巷子里都喊你『蛐王』。」 · 本账开一整套蛐蛐经（有市集的城才有巷口赌局）： · ① 捉虫：出城草窠蹲两个时辰（时辰真扣），五档品相全明账
  机制 312 行 · 混合（蛐蛐个体状态机 + 品相/脾气判定 + 赌局注账）｜关键数据 `GRADES` 5 档、`NAME_POOL` 10 名、`CFG` 12 常量、StateRegistry 'cricket' 存 8 键（jars/streak/best/day/fights/wins/losses/kingCries）、`Cricket` 5 方法
  接口 `window.Cricket`（5）+ `openCricketDen` / `updateCurrencyUI` / `playerPushDeed` / `getAbsoluteDay` / `getCurrentCityName`｜依赖 RewardService、WorldCalendar、locationSystem、currentBattle｜事件：无
  缺口 `cricket-fight.js:310 openCricketDen` → 零引用死导出；`Cricket` 命名空间本身被引用（Cricket.open / Cricket.catchCricket 等），但 `cricket-fight.js` 没有 `panelHtml`，斗蛐蛐只挂在 StreetLife 菜单口径之外（实测 street-life.js 菜单列了 Cricket，见 `CityBath/CityEatery/GambleDen/CityBookshop/BeggarAlms/CitizenLife/PlayerShop/StoneGamble/Brewing/Disguise` 11 项，Cricket 未在其中 → 疑似只在别处挂载，无法判定入口位置）
- `js/city-facilities/eatery.js` :: v25.7 市井烟火批（第一百四十九批）· 下馆子 · 酒楼柜上此前只有一碟「快餐」（30 铜钱、能量+40 的野外口径）和两杯情报酒——没有一桌正经饭。 · 本账在有酒楼的城里开两档吃食： · 家常饭（10 铜）：走饱食度正门（satietySystem.eat 28，与吃干粮同一本账）+ 精力小回，30 分钟
  机制 189 行 · 混合（本帮招牌菜 + 饱腹/状态 + 弹窗）｜关键数据 `FOOD_KEYS` 30 菜、`CFG` 11 常量、`CityEatery` 8 方法（CFG/FOOD_KEYS/eateryOk/specialDish/specEatenToday/eat/open/panelHtml）
  接口 `window.CityEatery`（8）+ `openCityEatery` / `closeBuildingDialog` / `showBuildingEffectDialog` / `applyBuff` / `activeBuffs` / `getAbsoluteDay` / `getCurrentCityName`｜依赖 GameScheduler、NpcBond、RewardService、WorldCalendar、`satietySystem`（外部饱腹账）、locationSystem｜事件：无
  缺口 `eatery.js:187 openCityEatery` → 零引用死导出；`eatery.js:169-174 panelHtml` → 恒返空串（注释自陈「收进市井烟火总门」）+ `CityEatery.panelHtml` 全域零调用
  缺口 `eatery.js` 直接写 `window.applyBuff` / `window.activeBuffs` 两个全局（从别处借的 buff 通道），与 `status-effects.js` 的 manager 不是同一本账 → 餐饮 buff 走的是全局裸函数，状态效果本体可能读不到（无法判定 status-effect-manager 是否也读 window.activeBuffs）
- `js/city-facilities/facility-arena-book.js` :: 第六十六波 · 斗法台台下赌盘（牌面终于名副其实） · 斗法台的牌面写着「押斗赌彩，胜负各安天命」，台上的话本也念「台下赌盘已经开了赔率」 · 可这盘口此前永远开不出来，是满城最名不副实的一块牌子。本账把盘口真开起来： · 庄家支桌挂赔率，热手冷门都能押，胜负走引擎成败签，铜钱走统一结算原子入账
  机制 126 行 · 纯数据 + 接线（给既有设施加第二出戏）｜关键数据 `FAV_NAMES` 6、`DOG_NAMES` 6；只做一件事：调 `window.facilityAugment('arena_stage', {...})` 追加一场 比武台斗狗/戏法 剧本；自身导出唯一全局 `window.facilityScenarioCity`
  接口 `window.facilityScenarioCity`（1 个函数）｜依赖 facility-batch3.js 的 `facilityAugment`、scenario-engine、timeSystem、currentCharData｜事件：无
  缺口 `facility-arena-book.js:12` 头注自陈依赖 `facility-batch3.js` 的 `facilityAugment`，但 facility-batch3.js:121 已经给 `arena_stage` 增补过一场 → 本文件是同一设施的第二份增补，两处 order 决定最终戏序（先加载者先注册，脚本加载顺序在 scripts.manifest.json，文档层无法判定最终先后）
  缺口 `facility-arena-book.js` 不导出任何 panel/open 口，全靠 `facilityAugment` 旁路 → 城市面板上看不出这个文件存在（无法判定是否有意）
- `js/city-facilities/facility-batch2.js` :: facility-batch2.js - 第二批15个设施 · 13个情境设施 + 2个官府基础设施 · 依赖：scenario-engine.js
  机制 652 行 · 混合（情境剧本注册 + 买卖判价 + 弹窗；无大写常量表，全部内联）｜关键数据：盐铁局/工曹署两个设施的完整情境（含引价、官价、走私账）、`__workRng` / `__smugRng` 两支注入式随机源；导出 10 个全局口：`openWorksBureau`、`openSaltIronOffice`、`facilitySellMod`、`facilityBuyMod`、`saltSellSmuggler`、`closeModalSoft`、`showModal` 等
  接口 `window.openWorksBureau` / `openSaltIronOffice`（城市面板动作表 app.js:1246-1247 与 location-system.js:1034 都点名这两个）/ `facilityBuyMod` / `facilitySellMod` / `saltSellSmuggler` / `__workRng` / `__smugRng` / `facilityAugment`（本文件也增补剧本）｜依赖 BankService（官价买断/抵押）、PawnService、FenceCredit（黑市放贷）、NpcCrime、RewardService、XianXia.DataManager、formatShichen、updateStatusPanel｜事件：无
  缺口 `facility-batch2.js` 652 行里 `var/const` 顶层表 0 个 —— 盐铁/工曹两套数值全散在函数体内，与同目录 `city-jobs.js`（JOBS/JOB_ROLES/GIGS）等带表文件风格不一致，无法按表对账
  缺口 `facility-batch2.js` 导出 `saltSellSmuggler` 给别处调（实测 js/ 内零引用，见死导出扫描未命中 ⇒ 该名字出现 >1 次，实为盐铁局内部互调）→ **无法判定**其是否真有外部调用方
- `js/city-facilities/facility-batch3.js` :: facility-batch3.js - 第三批次：给单剧本设施各添一出新戏 · v20.19：11 家原本只有一出戏的设施，各补第二出——每出都有真代价（精力/真气/本金/名声业障）
  机制 301 行 · 纯接线（11 个设施各加第二出戏，无状态、无持久化）｜关键数据：`facilityAugment(facilityId, scenario)` 增补通道 + 11 次调用（contract_hall / escort_office / charity_hall / arena_stage / observatory / stele_forest / oddity_museum / pawn_shop / auction_house / black_market / garden_villa）
  接口 `window.facilityAugment`（1 个通道，被 facility-arena-book.js 与 facility-peddler-contract.js 复用）+ 自身挂 `getCurrentCityName` / `getRealmTier` / `getReputationValue`｜依赖 scenario-engine（注册情境）、locationSystem、currentCharData｜事件：无
  缺口 `facility-batch3.js` 的 11 处 `facilityAugment` 与 `facility-arena-book.js:53`（arena_stage）、`facility-peddler-contract.js:62/86`（contract_hall 两处）撞同一设施 → arena_stage 被增补 2 次、contract_hall 被增补 3 次，scenarioEngine 对同 id 多次增补的处理策略未在本文件注释里写明（**无法判定**最终戏序与是否覆盖）
  缺口 `facility-batch3.js` 只管增补、不导出任何面板钩子 → 11 个设施的入口全靠 app.js 的 `BUILDING_ACTIONS` 表（`location-system.js:1034` 一带）分发，本文件不出现在任何分发表里
- `js/city-facilities/facility-offices.js` :: facility-offices.js — 三司做厚（v21.4） · 税课司/司法堂/户籍司此前是"一点就完"的空壳：烧真气→一句日志→历练+5，没有选择没有分支。 · 本文件把三司注册进情境引擎：原有的实事（查账读真源/缉查委托/流寓录）全部保留为选项之一
  机制 147 行 · 纯接线（三司情境注册）｜关键数据：向情境引擎注册 **3 个设施**（`tax_bureau`:40 / `court`:80 / `household_registry`:119），每个场景内的选项数组 `cases`（:72）收原有实事 + 有成本公务；`window.openTaxBureau/openCourt/openHouseholdRegistry` 已改为委托情境引擎
  接口 不新增独立命名空间；只调 `scenarioEngine.register`；自身挂 `getCurrentCityName` / `getLifeSkill`｜依赖 scenario-engine、NpcCrime、locationSystem、timeSystem、gameLog｜事件：无
  缺口 `facility-offices.js` 头注自陈「路由：useBuilding 的情景设施分支先于 officialOffices 命中」——但本文件只注册情境，不再定义 officialOffices 分支；该分支在 location-system.js 侧（**已核实**：本文件内 0 处 `officialOffices`）→ 头注描述的是改前形态
  缺口 本目录 34 个文件里 `facility-offices.js` / `facility-batch2.js` / `facility-batch3.js` / `facility-arena-book.js` / `facility-peddler-contract.js` / `facility-qin-venue.js` 六个是「无面板钩子的情境增补件」，它们的状态一律落 `scenarioEngine`，玩家在 §0.2 总账里看不出这六本各自加了什么戏
- `js/city-facilities/facility-peddler-contract.js` :: 第六十九波 · 商行贩货契（契约所柜台上的跑单帮） · 押镖送的是别人的货、拿的是死酬金；跑单帮贩的是自己的货、认的是活的行情。 · 契约所是立契的地方——商行在此设柜，贩货单按城+日定死，进出价全认行情真源（PeddlerService）
  机制 107 行 · 纯接线（契约所第三/四出戏 + 货郎签约文案）｜关键数据：`window.facilityAugment('contract_hall', {...})` 两处 + `marks` 3 组标点词 + CityFaces 认脸；自身导出唯一全局 `window.openCaravanBoard`
  接口 `window.openCaravanBoard`（1）｜依赖 facility-batch3.js 的 `facilityAugment`、scenario-engine、PeddlerService（货郎账）、CityFaces｜事件：无
  缺口 `facility-peddler-contract.js` 导出 `openCaravanBoard`，但 `js/economy/caravan-trade.js` 自己也导出同名 `openCaravanBoard` → 两文件抢一个全局名，加载顺序后者覆盖前者（实测两处均为 `window.openCaravanBoard = ...`，**谁最终生效取决于 scripts.manifest.json 顺序**，文档层无法判定）
  缺口 本文件 107 行里顶层面板钩子 0 个，只有两处 augment
- `js/city-facilities/facility-qin-venue.js` :: facility-qin-venue.js — 勾栏瓦舍（v20.90） · 城中卖艺场：登台抚琴/说书/压轴「摄魂音」赚打赏，台下听曲、幕后练琴长音律。 · 打赏与长进全按 QinArts 的艺册现算（音律等级 × 手中琴品相），不写死数
  机制 276 行 · 纯接线 + 渲染（勾栏瓦舍场景）｜关键数据：琴/曲/艺三类场景分支、`CityVoices`（goulan_washe 分城口吻）、`QinArts`（v20.90 音律琴心两本账）、`GoodDeeds`（打赏入善举账）、`cityReputation`；顶层无大写常量表
  接口 不新增命名空间（只调 scenarioEngine/渲染）；自身挂唯一全局 `getCurrentCityName`｜依赖 CityVoices.vo、QinArts、GoodDeeds、cityReputation、scenarioEngine、currentCharData｜事件：无
  缺口 `facility-qin-venue.js` 276 行全是场景文本与分支，`scenarioEngine.register` 的设施 id 未在本文件内出现可读的常量（头注未写明挂哪个 id）→ 无法从本文件判定它挂在 goulan_washe 还是别的键（实测城面板 `BUILDING_TYPES` 里确有 `goulan_washe` 一键）
- `js/city-facilities/festival-fair.js` :: 第六十八波 · 庙会民俗节日（日历上的节，城里真有人过） · 四时节日（上元/七夕/中秋/除夕）此前只有两条线在过：道侣发帖陪节、灯节夜的集体戏 · 都是「别人的节」。满城百姓的节没人过：进城看不见庙会，日历上的「中秋灯会」只是氛围轮播字
  机制 563 行 · 混合（庙会日历判定 + 灯谜/河灯/小吃/河工四摊 + 闲趣谱集面板钩子）｜关键数据 `FALLBACK_DEFS` 4（4 个节）、`RIDDLES` 6 条灯谜（内嵌答案数组）、`FEST_META` 4 键节名/图标、`GAIN_LABEL` 8 键彩头文本、`CFG` 14 常量、`FestivalFair` 22 方法（含 `panelHtml`）
  接口 `window.FestivalFair`（22）+ `openFestivalFair` / `openLeisureGround` / `closeModalSoft` / `showModal` / `playerPushDeed` / `__scenarioRng` / `getAbsoluteDay` / `getLifeSkill`｜依赖 `FestivalCalendar`（节庆日历真源）、`FESTIVAL_DEFS`、RewardService、WorldCalendar、locationSystem、EventBus、timeSystem｜事件：★订 `location:visited`（:533，全 34 个城市设施里唯一订 EventBus 的）
  缺口 ★`festival-fair.js:561 window.openLeisureGround` → **全域零引用**（死导出）；而同文件 `:~549` 的 `window.openFestivalFair` **不是死导出**——`panelHtml`(:259) 与庙会本体三处模板(:312/:335/:348)都用字面 `onclick="openFestivalFair()"` 点名它 ⇒ **初版扫描把它误判成死导出，已修正**（教训：`onclick` 字符串里的全局名不在标识符扫描的口径内）
  缺口 回归红：`tests/wave68-festival-fair-node.js` 2 条红（B1 平常日子面板该空却有「闲趣场」一行、F1 声称全程零骰实测 1）→ 与 `panelHtml:263-266` 无条件挂 `FestivalFair.leisure()` 一致，是测试断言与实现分叉（**无法判定**设计意图）
- `js/city-facilities/fortune-stall.js` :: v26.1 五路进城批（第一百五十二批 · 用户点单）· 卦摊账 · 用户点单：「卜卦是别人给我算，我想自己支摊给人看相——学识境界定准头，算准了赏钱+名声， · 算到城中贵人隐疾还能结善缘；砸了卦摊被人掀，偶尔真卜出一桩机缘线索。」 · 本账在市井街口支一张卦摊（有市集/铺面的城才支得起来）
  机制 226 行 · 混合（卦摊日课 + 线索判定 + 弹窗）｜关键数据 `CFG` 14 常量、`CLUES` 5 组线索文案、StateRegistry 'fortuneStall' 6 键、`FortuneStall` 5 方法
  接口 `window.FortuneStall`（5）+ `openFortuneStall` / `growLifeSkill` / `getLifeSkill` / `getRealmTier` / `updateCurrencyUI` / `playerPushDeed` / `showBuildingEffectDialog`｜依赖 RewardService、WorldCalendar、npcManager/nameGenerator（被卜者点名）、locationSystem｜事件：无
  缺口 `fortune-stall.js:224 openFortuneStall` → 零引用死导出；本文件无 `panelHtml` → 卦摊不在城市面板也不在 StreetLife 菜单（实测 street-life.js:169-179 的 11 项里没有 FortuneStall）⇒ **无法判定**卦摊的入口在哪
- `js/city-facilities/gamble-den.js` :: v25.7 市井烟火批（第一百四十九批）· 赌坊骰子 · 此前博戏散在三处（斗法台台下赌盘/契约所赌灵雨/茶馆对弈彩头），没有一间正经赌坊。 · 本账开一间：三颗骰子押大小——总点 ≥11 为大、≤10 为小，**围骰（三颗同点）庄家通吃**。 · 口径诚实（与台下赌盘同款「庄家总赢」的算学）
  机制 221 行 · 混合（骰局状态机 + 雅间连赢升级 + 弹窗）｜关键数据 `CFG` 10 常量、`DICE_GLYPH` 6 点字形、StateRegistry 'gambleDen' 9 键、`GambleDen` 7 方法
  接口 `window.GambleDen`（7）+ `openGambleDen` / `closeBuildingDialog` / `showBuildingEffectDialog` / `playerPushDeed`｜依赖 RewardService、WorldCalendar、locationSystem、currentBattle｜事件：无
  缺口 `gamble-den.js:248 openGambleDen` → 零引用死导出（真入口 `GambleDen.open`，street-life.js:171 菜单点名）
  缺口 `gamble-den.js:210 panelHtml` → 恒返空串 + `GambleDen.panelHtml` 全域零调用（同 bathhouse/eatery 口径）
- `js/city-facilities/guild-climb.js` :: v27.1 营生扩展批 · 商会夺权线（第 24 件） · 用户点单核对：商会机构已有（app.js v20.21 公会堂做实「商会」：行情代问 + 代售台抽一成半佣金）。 · 本账把玩家那条线接通：**入会 → 熬到话事 → 另立自己的商会**
  机制 304 行 · 混合（公会爬梯段位状态机 + 声望结算 + 提示）｜关键数据 `STAGES` 5 段、`CFG` 12 常量、StateRegistry 'guildClimb' 若干键、`GuildClimb` 6 方法
  接口 `window.GuildClimb`（6）+ `openGuildHall` / `addReputation` / `getReputationValue` / `updateCurrencyUI` / `playerPushDeed` / `prompt`｜依赖 StateRegistry、WorldCalendar、XianXia.DataManager、timeSystem｜事件：无
  缺口 `guild-climb.js` 的段位表只有 5 段（`STAGES`），而 `reputation-system.js` 的 `REPUTATION_LEVELS` 是另一套声望档 → 同名「爬梯」与「声望」两本档位账并存，GuildClimb 读 `getReputationValue` 但不读 `getReputationLevelIndex` → **无法判定**两套档是否同源
- `js/city-facilities/horse-market.js` :: v27.0 坐骑批（第一百五十三批 · 用户点单：坐骑并入灵兽）· 马市账 · 马太低级，就配凡人与炼气赶路——灵兽坊卖灵兽（灵石、血脉钱），马市卖牲口（铜钱、草料账）： · ① 相口齿：花一刻钟看牲口成色（好/中平/次——骑乘速度系数随之加减）；不相就是盲买
  机制 558 行 · 混合（凡兽/灵兽同栏不同册 + 蛋孵化 + 赛马投注 + 改名）｜关键数据 `HM_STOCK` 3 种凡俗牲口、`EGG_POOL` 6、`RACE_BETS` 3 玩法、`RACE_DIVS` 2 键赔率、`EGG_ITEM` 19 字段、运行账 `_rt` 6 键；对外 11 个 `hm*` 函数（hmInspect/hmHaggle/hmBuyBeast/hmBuyEgg/hmHireOut/hmBringBack/hmRaceEnter/hmRaceBet/hmRaceRun…）
  接口 `window.openHorseMarket` / `openHorseRace` + 11 个 `hm*` 动作口 + `window.HorseMarket` 命名空间（545 行）｜依赖 `BEAST_TEMPLATES` / `BEAST_TRAITS` / `tamedBeasts` / `MUNDANE_PEN_CAP` / `buyMundaneBeast`（凡兽柜）、XianXia.DataManager、inventory/itemById/allItems/extendedSpecial、RewardService、StateRegistry｜事件：无
  缺口 ★`horse-market.js:545 window.HorseMarket` → **整个命名空间全域零引用**（`HorseMarket` 这个名字在 js/ + 仙侠.html 里只出现在这一处定义）⇒ `qualityOf / eggInStock / EGG_ID / eggHatchTick` 等 9 个方法全部不可达；真入口是 `openHorseMarket` 与 11 个 `hm*`（实测 horse-market.js 内 501-503 行的 onclick 字符串直接点名 hmInspect/hmHaggle/hmBuyBeast）
  缺口 `horse-market.js` 943 行级别里同时挂 `addItem` / `addItemToInventory` / `updateInventoryUI` / `renderBeastList` / `tryRegisterTamedBeast` / `saveBeastData` / `bringBackBeast` 等 20+ 个全局口到自己的命名空间上，与 `beast-taming.js` 的同名口重复 → **无法判定**两套谁是当前真源（实测两者都存在且都被 horse-market 调用）
- `js/city-facilities/pawn-service.js` :: js/city-facilities/pawn-service.js — 当铺账房：典当有当期、凭票可赎回、过期即死当 · v20.20：把票面上写过的"当期一月，月内不赎即为死当"做实。银钱与货件一律走统一结算事务
  机制 280 行 · 混合（当铺实例状态机 + 逾期没收入口 + 自选清单）｜关键数据 `PawnService` 9 方法；实例字段挂在角色 `_pawn`，过期走新日钩子
  接口 `window.PawnService`（9）+ 自身挂 `getAbsoluteDay` / `getCurrentCityName` / `updateCurrencyUI` / `updateInventoryUI`｜依赖 EconomyTransaction（抵押走统一事务）、RewardService、XianXia.DataManager、inventory/itemById、locationSystem、timeSystem.onNewDaySubscribe｜事件：无
  缺口 `pawn-service.js` 的 `window.PawnService`（:271 `global.PawnService = PawnService`）**有 6 处外部引用**，命名空间可达（初版扫描误判为不可达）；`pawnInstance`/`forfeitCheck`/`pawnableList`/`pawnFromPicker` 四个方法在 js/ 内无外部调用方，由本文件 `PawnService.*` 内部与 `onclick` 字符串驱动；本文件**未导出** `openPawnShop` 口 ⇒ **入口由 app.js 的 `PAWN_SHOP` 动作表分发**（**无法判定**该表当前是否还挂着当铺）
- `js/city-facilities/player-shop.js` :: v26.0 六路营生批（第一百五十一批 · 用户点单）· 掌柜铺子账 · 用户点单：「我炼了一仓库丹、打了一堆装备，只能摆摊贱卖或塞拍卖行。想买间铺面自己定价、 · 雇伙计、挂招牌。」——enhanced-shop.js 里 this.playerShops = [] 从第一天起就是个
  机制 943 行 · 混合（自营铺面状态机 + 12 种铺型 + 每日开市 + 雇伙计 + 事件型来客）｜关键数据 `CFG` 26 常量、`CLERK_NAMES` 10、`SHOP_TYPES` 12 铺型、`TYPE_EVENTS` 11 类事件、StateRegistry 'playerShop'、`PlayerShop` 11 方法
  接口 `window.PlayerShop`（11）+ `openPlayerShop` / `giveWithReceipt` / `addReputation` / `reduceReputation` / `updateCurrencyUI` / `playerPushDeed` / `showBuildingEffectDialog` / `__scenarioRng`｜依赖 CityFaces（掌柜认脸）、DataManager、StateRegistry、NpcCrime、WorldCalendar、inventory/itemById、locationSystem｜事件：无
  缺口 `player-shop.js:941 openPlayerShop` → 零引用死导出（真入口 `PlayerShop.open`，street-life.js:176 菜单点名）
  缺口 `player-shop.js:4` 头注自陈「没接线的空壳（本账不去动那本旧账，新开正门，空壳留档为证）」→ 旧空壳仍留在仓库里（`location-system.js` 的 `buildingEffectsRegistry` 里同名动作），新旧两条入口并存，**无法判定**玩家实际点到的是哪一条
- `js/city-facilities/private-school.js` :: v26.1 五路进城批（第一百五十二批 · 用户点单）· 私塾账 · 用户点单：「开私塾教蒙童——学识换安稳束脩，教出的孩子几年后长成城里各行的熟人（暗线人脉）； · 『教化一方』是笔正经功德账，能抵杀孽恶名的名声亏空。」 · 本账在有市集的城开一间私塾
  机制 274 行 · 混合（蒙馆门槛判定 + 授业日结 + 弹窗）｜关键数据 `CFG` 18 常量、`TRADES` 7 种授业行当、StateRegistry 'privateSchool' 5 键、`PrivateSchool` 5 方法
  接口 `window.PrivateSchool`（5）+ `openPrivateSchool` / `growLifeSkill` / `updateCurrencyUI` / `playerPushDeed` / `showBuildingEffectDialog`｜依赖 RewardService、WorldCalendar、locationSystem｜事件：无
  缺口 `private-school.js:272 openPrivateSchool` → 零引用死导出；无 `panelHtml` → 蒙馆不在城市面板也不在 StreetLife 11 项菜单里 ⇒ **无法判定**入口
- `js/city-facilities/service-stall.js` :: v27.3 手艺与街面批 · 手艺摊引擎（新文件 service-stall.js） · 设计方案 D 引擎：43 看风水 · 44 画小像 · 45 篆刻摊（原「抄书」撞车书肆零工，换血）· 46 写墓志铭 · 49 替富户布阵 · 50 测灵根 · 51 教蒙童吐纳 · 53 保媒 · 54 婚礼司仪
  机制 318 行 · 数据表 + 混合（11 类服务摊逐城现算报价 + 面板钩子）｜关键数据 `STALLS` 11 条（每条内嵌城级/声望级报价分支）、`STALL_BY_KEY` 运行期索引、`CFG` 8 常量、`ServiceStall` 5 方法
  接口 `window.ServiceStall`（5）+ `openServiceStall` / `closeModalSoft` / `showModal` / `growLifeSkill` / `playerPushDeed` / `getReputationValue` / `getRealmIndex` / `__scenarioRng`｜依赖 RewardService、WorldCalendar、advanceTime/locationSystem｜事件：无
  缺口 `service-stall.js:316 openServiceStall` → 零引用死导出；无 `panelHtml` ⇒ 11 类服务摊不在城市面板，实测 street-life.js:169-179 的菜单 11 项里也没有 ServiceStall ⇒ **无法判定**这 11 摊的入口
- `js/city-facilities/special-features.js` :: special-features.js — 特色景致真剧本（v21.4） · 此前 24 处特色景致没有专属剧本，点击走通用兜底：一句话 + 免费历练+20 + 声望+3， · 零成本无限连点——是印钞机也是内容空洞。本文件给每一处景致写专属剧本
  机制 389 行 · 纯数据表（24 处特色景致各一整套剧本）｜关键数据 `FEATURES` 24 条，每条含 name/icon/city/desc/scene + 2~3 个 choices；每个 choice 必带 cost（精力/真气/健康/钱）或 roll 风险；概率由 `realmProb(base)=min(0.9, base+境界档×0.05)` 与 `skillProb(skill,base)=min(0.92, base+技能×0.008)` 现算
  接口 不导出命名空间；只 `scenarioEngine.register(id = 景致中文名)`；自身挂 `getLifeSkill` / `getRealmTier`｜依赖 scenario-engine、currentCharData、getLifeSkill/getRealmTier、RewardService｜事件：无
  缺口 `special-features.js:10` 若 `scenarioEngine` 不在位直接 return —— 加载顺序一旦颠倒，24 处景致剧本**静默全丢**且不留任何日志（文件内 0 处 console 提示）
  缺口 头注说「此前 24 处特色景致没有专属剧本」，现 `FEATURES` 恰 24 条 —— 但 `cityData.specialFeatures` 23 城逐城唯一（实测 23/23），两表之间**没有 id 对照字段**（只靠中文名匹配）⇒ 改名即失配（无法判定当前是否全部对得上）
- `js/city-facilities/stone-gamble.js` :: v26.0 六路营生批（第一百五十一批 · 用户点单）· 赌石摊账 · 用户点单：「书肆能淘残页、拍卖会能捡漏，但庙会集市没有赌石摊——一把切开见分晓的心跳没有。」 · 本账在市集开一间古玩摊的赌石角（有市集/铺面的城才有）
  机制 327 行 · 混合（原石三档 + 探石问深浅 + 一刀定生死 + 名品定模）｜关键数据 `TIERS` 3 档、`CFG` 9 常量、StateRegistry 'stoneGamble' 5 键、`StoneGamble` 5 方法
  接口 `window.StoneGamble`（5）+ `openStoneGamble` / `giveWithReceipt` / `addItem` / `addItemFailPhraseFor` / `growLifeSkill` / `updateCurrencyUI` / `playerPushDeed` / `showBuildingEffectDialog`｜依赖 DataManager、XianXia、StateRegistry、itemById、WorldCalendar、locationSystem｜事件：无
  缺口 `stone-gamble.js:325 openStoneGamble` → 零引用死导出；真入口 `StoneGamble.open`（street-life.js:177 菜单，且带 `StoneGamble.stallOk(ct)` 城级守卫）
  缺口 本文件自行挂 `window.addItem` / `window.addItemFailPhraseFor` 两个全局口 —— 而这两个口的正主是 `inventory.js` ⇒ 又一处同名全局覆盖（**无法判定**加载顺序影响）
- `js/city-facilities/street-life.js` :: v25.7 市井烟火批（第一百四十九批）· 烟火街口 + 街头闲逛 · 城市面板上此前有庙会/摆摊/赁屋/招工四道口，独缺一口「过日子」的总门。本账挂一行「市井烟火」： · 闲逛/沐浴/下馆子/博戏/淘书/施舍六路小玩法收进一张菜单（各家有各家的账本，菜单只递话）
  机制 242 行 · 混合（六路小玩法总门 + 面熟度三级台阶 + 行情真读）｜关键数据 `CFG` 7 常量（精力门槛/日逛上限/三级面熟线/乞丐遭遇率）、StateRegistry 'streetLife' 存 `familiar[城]` 6 键、`StreetLife` 7 方法
  接口 `window.StreetLife`（7，含 `panelHtml`）+ `openStreetLife` / `exploreCity`｜依赖 CityBath / CityEatery / GambleDen / CityBookshop / BeggarAlms / CitizenLife / PlayerShop / StoneGamble / Brewing / Disguise（菜单 11 项，各带 `typeof` 守卫）、MarketDynamic.priceMul（老街坊掏心窝子读真行情）、getCitizenGossip（回落池）、Brewing.cellarOk / StoneGamble.stallOk / Disguise.marketOk（城级守卫）｜事件：无
  缺口 `street-life.js:240 openStreetLife` → 零引用死导出（真入口 `StreetLife.open`，城市面板 `panelHtml` 与 location-system.js:738 的守卫都点名它）
  缺口 本文件是 34 个城市设施里唯一的「总门」，但它自己不导出任何具名 action（`exploreCity` 之外全靠菜单字符串）⇒ 从 §0.2 总账看不出「市井烟火」统辖另外 11 本
  缺口 头注/§0.2 职责称「六路小玩法」，实测菜单已扩到 11 项（v26.0 批加了掌柜/赌石/酿酒/易容）⇒ 职责行数字已过时
- `js/city-facilities/street-stall.js` :: 第七十波 · 街边摆摊（自己的货，卖个公道价） · 行囊里压着的战利品，此前只有一条出路：贱卖给铺子（回购只出两三成价，铺子吃的是省事钱）。 · 街边摊贩卖同样的货能卖出现钱两倍——本账把这条路开给玩家：商埠城里支个摊，货直接卖给出行的过客
  机制 326 行 · 混合（摆摊会话状态机 + 客流/认熟 + 收摊软收 + 面板钩子）｜关键数据 `CFG` 17 常量、`session` 运行态、`StreetStall` 11 方法
  接口 `window.StreetStall`（11，含 `panelHtml`）+ `openStreetStall` / `closeModalSoft` / `showModal` / `getReputationValue` / `updateInventoryUI` / `updateCurrencyUI`｜依赖 CityFaces（过客认脸）、MarketDynamic、TradeService（真回购价）、RewardService、WorldCalendar、advanceTime/locationSystem、inventory/itemById｜事件：无
  缺口 `street-stall.js:324 openStreetStall` → 零引用死导出；`street-stall.js:317 session` 是内部运行态却挂在 `StreetStall` 命名空间上（**疑似**导出内部态）
  缺口 回归基线里 `tests/wave68-festival-fair-node.js` 与 `tests/wave72-city-jobs-node.js` 都断言「终点软收面板已挂 closeModalSoft」，本文件 K20 条目已挂 ✓，但两套测试仍红 ⇒ 红因不在本文件
- `js/city-facilities/tea-storyteller.js` :: v26.1 五路进城批（第一百五十二批 · 用户点单）· 茶馆说书账 · 用户点单：「茶馆现在只能听别人说。我想把自己的生平搬上台——满堂打赏、传闻池灌自己的名头； · 还能说添油加醋的假本，台下若有知情人当场拆台。」 · 本账在老茶馆的台上开一个「说自己的书」的口子（茶馆菜单里进）
  机制 214 行 · 混合（说书人台账 + 打赏归 Biography + 弹窗）｜关键数据 `CFG` 17 常量、StateRegistry 'teaTale' 7 键、`TeaTale` 4 方法
  接口 `window.TeaTale`（4）+ `openTeaTaleStage` / `updateCurrencyUI` / `playerPushDeed` / `showBuildingEffectDialog`｜依赖 Biography（生平/名声落账）、RewardService、WorldCalendar、StateRegistry｜事件：无
  缺口 `tea-storyteller.js:212 openTeaTaleStage` → 零引用死导出；无 `panelHtml` ⇒ 说书台不在城市面板；实测 street-life.js 菜单 11 项里也没有 TeaTale，但 `teahouse-leisure.js` 引用了 `TeaTale` ⇒ 入口在茶馆侧（`visitTeaHouse` 内），**无法判定**具体挂点
- `js/city-facilities/teahouse-leisure.js` :: 第六十四波 · 茶馆消遣（一盏茶、一局棋、一页墨） · 老茶馆只有一口 10 灵石的"说书套餐"——听完就走，不能歇脚、不能对弈、不能题诗。 · 本账把茶馆做成真消遣场：听书照旧（visitTeaHouse 原样保留），另开五个口子 · 🫖 大厅粗茶（3 铜钱，坐着歇歇）/ 🎋 雅座好茶（2 灵石，静心）
  机制 277 行 · 混合（茶馆闲趣四页 + 棋/诗真判定 + 面板钩子）｜关键数据 `CFG` 23 常量、`GAIN_LEDGER` 5 档长进账、`TeaHouseLeisure` 3 方法（visitTeaHouse/closeBuildingDialog/getEffectiveMax 转发）
  接口 `window.TeaHouseLeisure`（3）+ `visitTeaHouse` / `openJianghuRank` / `closeBuildingDialog` / `getEffectiveMax` / `showBuildingEffectDialog`｜依赖 CityVoices.vo（分城口吻）、TeaTale（说书台）、XianXia、RewardService、`showBuildingEffectDialog`｜事件：无
  缺口 `teahouse-leisure.js` 自行 `window.getEffectiveMax`（转发 global-utils 的同名口）→ 又一处同名全局覆盖（**无法判定**影响）
  缺口 本文件是本目录唯一把「无面板钩子」也写进 §0.2 职责的（`visitTeaHouse` 由 building-effects 的茶馆动作调）——但它没有 `panelHtml`，与 street-life 菜单也无交集 ⇒ 茶馆入口只经 `buildingEffectsRegistry`（**无法判定**该注册表当前是否有茶馆键）

### js/combat/（1 个）— 战斗

- `js/combat/build-school.js` :: build-school.js - v20.0 2.5 剑/体/法修 build 分化 · 主功法判定流派→流派被动（剑修连击/体修反震/法修元素），与 1.2 招式配合 · 派生自主功法名，不入存档。依赖：1.2 招式、currentSkills
  机制 75 行 · 纯判定函数（构筑流派：按已学功法判流派归属与加成）｜无数据表、无 window 命名空间；只挂 2 个裸全局 `getBuildSchool` / `getSchoolBonus`
  接口 裸函数 `getBuildSchool` / `getSchoolBonus`｜依赖 `SECT_SPECIFIC_ARTS`（门派专属功法表）、currentSkills、discipleState｜事件：无
  缺口 ★本文件是 combat/ 目录唯一一本（75 行）且**不挂 window 命名空间**——与 extensions/fengshui.js 同款裸函数口径，加载顺序颠倒即 ReferenceError，调用方无 `typeof` 守卫则直接炸
  缺口 `getBuildSchool` 的流派判据读 `SECT_SPECIFIC_ARTS`，若玩家功法全非门派专属则流派为空 ⇒ `getSchoolBonus` 返回 0 还是 1（**无法判定**：未读函数体）

### js/crafting/（7 个）— 炼制（炼丹 / 酿酒 / 锻火 / 法器）

- `js/crafting/alchemy-compound.js` :: alchemy-compound.js - 药性炼丹 (v19.4 P1-1) · 对标 v18.8 路线图 §4 P1-1：炼丹从"固定配方"扩展为"主药+辅药+调和"流派。 · 不动 crafting.js 旧路径；本模块独立运行，由 executeCrafting 的 compound 分支走新函数
  机制 397 行 · 数据表 + 混合（药性炼丹：18 种药材属性 + 6 张开放丹方 + 毒性/评分双闸 + 瑕疵丹/御品）｜关键数据 `MATERIAL_PROPS` **18 键**（药性/毒性）、`COMPOUND_PILFAR_RECIPES` **6 张**（炉数 2475/270/630/360/504 由实测枚举得出）、`_moduleState` 4 键（StateRegistry 'alchemyConfig'）、`AlchemyCompound` 8 方法
  接口 `window.AlchemyCompound`（8）+ `window.XianXia.AlchemyCompound`｜依赖 `compoundMat`（材料仓）、`CaveFacilities.getBuff('player','qualityBoost')`、EventBus、StateRegistry、WorldCalendar、inventory/itemById、growLifeSkill｜事件：★发 `alchemy:compound:flaw` / `alchemy:compound:imperial` / `alchemy:compound:success`（`:309` 三名由变量 `evtName` 二选一发出 ⇒ 任何按字面量 grep 事件名的审计都会漏掉）
  缺口 `:236` 注释自陈「御品毒性线 5 → 12——全药材库最低组合毒性 5.75，**<5 永假**（3476 炉零御品）」⇒ 已归正到 12，注释留痕可查
  缺口 ★`alchemy:compound:*` 三个事件名**全仓零订阅者**（与 forging 侧 `forging:compound:success/imprint` 同病）⇒ 炼丹成品不进日志/传闻/成就；因 emit 走变量 `evtName`，这类缺口静态 grep 看不见，必须逐文件读
- `js/crafting/brewing.js` :: v26.0 六路营生批（第一百五十一批 · 用户点单）· 酿灵酒账 · 用户点单：「烹饪有整条配方线，酿酒却没有——灵米灵泉入坛、窖藏年份越久越醇，自用送礼 · 或摆进自己店里，正好和开店配套。」本账开三条酒方、四档年份： · ① 借坛：城里有食肆/铺面才借得到酒家的窖坛（坛租现付）；坛只有三口——占着不启
  机制 342 行 · 数据表 + 混合（借坛酿酒：3 张酒方 × 4 阶窖藏年份 + 新酒到神工）｜关键数据 `RECIPES` **3 条**、`STAGE_WORDS` **4 档**、`CFG` 4 常量、StateRegistry 'brewing'、`Brewing` 5 方法
  接口 `window.Brewing`（5）+ `openBrewingCellar` / `giveWithReceipt` / `addItemFailPhraseFor` / `growLifeSkill` / `updateCurrencyUI` / `showBuildingEffectDialog`｜依赖 RewardService、WorldCalendar、`extendedFood`/`extendedFoods`、inventory/itemById/allItems、removeItem、locationSystem、timeSystem｜事件：无
  缺口 ★`brewing.js:340 openBrewingCellar` → 全域零引用死导出；真入口 `Brewing.open`（street-life.js:178 菜单点名，且带 `Brewing.cellarOk(ct)` 城级守卫）
  缺口 本文件自行挂 `window.addItem` / `window.addItemFailPhraseFor` / `window.giveWithReceipt` / `window.itemById` / `window.allItems` 五个转发口 ⇒ 同名全局覆盖
  缺口 `RECIPES` 只 3 条酒方，而 §0.2 职责行称「借坛酿酒」未给量级；酒品本身在 `extendedFood` 表里（本文件只管酿造不注册物品）⇒ 酒方与酒品两本表
- `js/crafting/compound-ui.js` :: v23.0 深水区接线：开放炼丹 / 词缀炼器 / 洞府设施 / 护持阵法 / 傀儡工坊 · 审计发现三套做了深度却没有门的系统：开放炼丹（药性四维+品质五段+毒性瑕疵）、词缀炼器（19词缀池+动态命名）、
  机制 598 行 · 渲染层（三套 UI：药性炼丹 / 复合炼器 / 阵法卷轴 + 洞府设施/阵法/傀儡/部署格式化）｜关键数据 `_qColor` 10 键品质配色、`icons` 8 键；挂 34 个 window 全局（`openCompoundPilfarUI` / `openCompoundForgingUI` / `openFireQTE` / `openForgeFireQTE` / `_cp*`/`_cf*`/`_cw*` 12 个回调 + `_caveInstall`/`_caveUninstall`/`_fmtDeploy`/`_fmtWithdraw`/`_pup*` 4 个回调）
  接口 34 个 window 全局｜依赖 `AlchemyCompound`、`ForgingCompound`、`compoundMat`、`CaveFacilities`、`FormationSystem`、`HousePanelUI`、`PuppetSystem`、materials、playerHouse、`XianXia`、inventory/allItems/itemById、timeSystem｜事件：无（另设 `_alchemyFireBonus`/`_forgingFireBonus` 两个火候传递槽）
  ★缺口 1（头注点名的「三套死代码」）→ `:3` 「火候 QTE（**得分没有任何可达路径消费**）；外加三套整体死代码：洞府设施、阵法、傀儡（傀儡日结在跑，玩家却造不出第一只）」——本批实测：`_fmtDeploy`/`_fmtWithdraw`/`_pup*` 有外部调用（非死），但**「QTE 得分无可达路径消费」这一条仍成立**（`_alchemyFireBonus`/`_forgingFireBonus` 只被 alchemy-compound.js:205 与 forging-compound.js:205 各读一次，是唯一消费点 ⇒ **实际有路径**，注释口径已过时）
  ★缺口 2（回调零引用一批）→ `_cpSelect`/`_cpPick`/`_cpUnpick`/`_cpFire`/`_cpRun`（5 个）+ `_cfSelect`/`_cfPick`/`_cfUnpick`/`_cfFire`/`_cfRun`（5 个）+ `_cwTab` + `_caveInstall`/`_caveUninstall`（2 个）共 **13 个回调全域零引用**；`_pupCraft`/`_pupDeploy`/`_pupRecall`/`_pupRepair`（4 个）实测**有调用** ⇒ 本文件 19 个 UI 回调里 13 个悬空（**疑似**这些按钮由 HTML 字符串或动态模板拼出且用了别的名字；静态扫描已在 仙侠.html 一并查过，仍 0）
  ★缺口 3（同名全局互抢第 4 处）→ 本文件 `window.itemById = {...}` 整体重写转发口（NSEXP 实测 `itemById` 命中 0 键），与 extensions/formation-system.js、extensions/puppet-system.js、extensions/talisman-advanced.js、map/randomMap.js 共 **5 处** `window.itemById` 转发
  缺口 本文件把 `_alchemyFireBonus` / `_forgingFireBonus` 当**全局可变槽**传给两个炼丹/炼器模块（消费即清），跨两个模块的隐式传参，无校验（**无法判定**是否会漏清导致一炉两用）
- `js/crafting/craft-custom-pill.js` :: craft-custom-pill.js - v20.0 2.12 自创丹方 · 消耗材料+灵石自创丹方，按材料毒性/品质映射效果，记 _customPills 图鉴 · 依赖：1.9 丹毒（毒性映射效果）、inventory、DataManager
  机制 119 行 · 判定函数 + 渲染（自定义丹方：玩家自配药材 → 毒性与药效现算）｜无大写常量表；导出 7 个 window 全局（`craftCustomPill` / `craftCustomPillWith` / `openPillMaterialPicker` / `getPillToxicity` / `addPillPoison` / `removeItem` / `showModal`）
  接口 7 个 window 全局｜依赖 DataManager、inventory/itemById、currentCharData、timeSystem、showMessage｜事件：无
  缺口 `craftCustomPill` / `craftCustomPillWith` 是全仓唯一命名成对的自定义丹方入口，但与 `alchemy-compound.js` 的 6 张开放丹方、`pill-poison.js` 的毒账三处口径并存（**无法判定**分工边界）
  缺口 本文件 119 行无 StateRegistry 注册、无 localStorage ⇒ 每次现算，是本目录唯一纯计算的一本
- `js/crafting/fire-qte.js` :: fire-qte.js - v20.1 炼丹火候试炼（玩家控火 QTE）· 第二十九波添锻火试炼 · 把炼丹火候从「技能±随机」升级为玩家可操作的控火小游戏：指针来回移动，黄区收火=极佳
  机制 98 行 · 判定函数 + 渲染（火候 QTE：玩家亲手控火 → 写 `_alchemyFireBonus`/`_forgingFireBonus` 两个全局槽）｜无大写常量表；导出 6 个 window 全局（`openFireQTE` / `openForgeFireQTE` / `closeFireQTE` / `_fireQTEShoot` / `_alchemyFireBonus` / `_forgingFireBonus`）
  接口 6 个 window 全局｜依赖 currentBattle、currentCharData、gameLog、playSfx、showMessage、updateCharacterStatus｜事件：无
  ★缺口 `:3` 与 `compound-ui.js:3` 两处头注都写「火候 QTE（得分没有任何可达路径消费）」——本批实测：`_forgingFireBonus` 被 `forging-compound.js:205` 读、`_alchemyFireBonus` 被 `alchemy-compound.js` 读，**都有消费点** ⇒ 该「死路径」结论**已过时**（两处头注未同步）
  缺口 本文件把 QTE 结果写进两个全局可变槽（`_forgingFireBonus` 由 forging-compound.js:207 「消费即清」），但本文件自身不清 ⇒ 若 QTE 打完未立刻开炉，槽会残留到下次（**无法判定**是否有开局清理）
- `js/crafting/forging-compound.js` :: forging-compound.js - 炼器·材料词缀 (v19.5 P1-2) · 对标 v18.8 路线图 §4 P1-2：法器 = 器胚 + 主材 + 辅材 + 铭纹/阵纹，材料标签决定 1~3 词缀
  机制 **970 行**（审计期间被炼器批并发重写：初读 471 行 → 现 970 行）· 数据表 + 混合（炼器：28 种材料标签 → 词缀池 + 器胚 + 开放方 + 5 档品相 + 名品定模 + 极品成双 + 锻火试炼）｜关键数据 `MATERIAL_TAGS`(:14) **28 个材料 id**（每个带标签数组，同一份 id 在池表里再列一次 ⇒ 实测 56 处出现 = 28 键 × 2）、`AFFIX_POOL`(:146) 词缀表（**7 条只带 `proc` 无 `attrKey`**）、`EMBRYOS`(:262)、`COMPOUND_FORGING_RECIPES`(:271) **5 张**、`QUALITY_LADDER`(:620) **5 档**、`rollQuality`(:664)、`_moduleState`(:864) 7 键（StateRegistry `forgingConfig`:909）、`ForgingCompound` 命名空间（`rollQuality`/`getState` 等）
  接口 `window.ForgingCompound` + `window.XianXia.ForgingCompound`｜依赖 `compoundMat.consume/refund`（v23.0 材料实扣）、`CaveFacilities.getBuff('player','qualityBoost')`、StateRegistry、EventBus、WorldCalendar、itemById、addResultItem、growLifeSkill、`window._forgingFireBonus`(:641「消费即清」由 fire-qte.js 写)｜事件：★发 `forging:compound:success` / `forging:compound:imprint`
  ★缺口 1（对应「已知的坑」，**成立且名字已变**）→ 词缀 proc **数量与名字都被炼器批改过**：初读版是 5 个（`reflect2`/`stun1`/`rebirth10`/`curse3`/`aoe`，写在 :61/:64/:68/:71/:77），**当前版本是 7 个** `reflect`(:154) / `stun`(:161) / `aoe`(:166) / `wild`(:171) / `curse`(:172) / `rebirth`(:177) / `roar`(:178)。无论哪一版，实测结论一致：**7 个 proc 名在全仓只有各自那一行声明、没有任何消费方**（`battle.js` 4817 行里 0 命中）⇒ **proc 词缀至今没有战斗端实现**。旧版头注释还自陈「proc: 战斗逻辑读取时判定（**不参与本计划实际效果**）」——注释自己承认这是空挂；当前版该注释已随重写移除，**空挂事实未变**
  ★缺口 2（对应「已知的坑」，**已不成立：函数已被炼器批删掉**）→ 初读版 `:180 keepAffixBySkill` 注释写「技能越高越倾向保留高价值（**按 attrVal 排序**）词缀」而实现只做纯概率比较（`affix` 形参未用）——**当前版本该函数已不存在**（实测全文 grep `keepAffixBySkill` 命中 0），改为 `:184` 的「rank = 词缀账里的名次（**确定性排序用：同池内按名次先后，不看任何随机源**）」⇒ **这条注释与实现不符的病灶已被并发修复，记录留档**
  ★缺口 3（材料表指向不存在的物品，**重写后依然成立**）→ `MATERIAL_TAGS`(:14) 28 个材料 id 里 **2 个在物品表 608 件中查无此物**：`mat_thunder_crystal`（注释自陈「可能不存在」）、`mat_beast_soul`（注释「预留」）⇒ 这两条永远命中不了，属死表项（重写扩到 970 行也没补上这两个 id）
  缺口 `:664 rollQuality(skill, affixCount, isImprint, pointUse)` 的 craft 分由词缀数 + 铭纹 + pointUse 三项合成，而词缀数被硬砍上限 ⇒ 要满档需「满词缀 + 铭纹 + 点数」三条件同时满足（**无法判定**具体数值：新版各分项常数与旧版不同，且无专属回归测试跑品相分布）
  ★缺口 4（docC 新增：**proc 留了一个显式接线口，但只有测试调它，游戏代码零调用**）→ 新版给了 proc 一条正式接线缝：`forging-compound.js:102 registerForgeProc(procId, handler)`，:105 据此翻 `FORGE_PROCS[id].wired`，:111 的访问器把 `_forgeProcHandlers[id]` 读出来；:958 把 `registerForgeProc` 挂上 `window`。实测全仓（排除副本）**`registerForgeProc` 只有 8 处命中**：`forging-compound.js` 自身 :88(注释)/:102(定义)/:958(挂 window) + **`tests/legacy-forge-allocation-node.js:207/216/217/218/219`** ⇒ **js/ 游戏代码里除定义与挂载外零调用方，接线缝只被测试穿过**。配套实测：`FORGE_PROCS` 7 条 `wired:false` / **0 条 `wired:true`**；`_forgeProcHandlers` 实测只有 2 处写（:100 声明 / :104 赋值）与 1 处读（:111 同文件访问器内）⇒ **从战斗侧看这是一个纯写不读的袋子**。这比旧版「注释自陈空挂」更进一步：**新版把接线口、注册表、状态位（wired）三件套都备齐了，只差没人来注册**，而 `battle.js` 对 `procTags` 与 7 个 proc id 实测**全部 0 命中**
  缺口 新版表族（docC 实测行号，旧版无对应物）：`TIER_ORDER`(:61 3 档) / `TIER_META`(:62) / `AFFIX_POOLS`(:69) / `POOL_ORDER`(:76 **5 池** metal·fire·star·beast·dragon) / `UNPOOLED_TAGS`(:80 **3 键** 自陈「不归任何池的旁注」) / `FORGE_PROCS`(:91) / `AFFIX_POOL`(:146 **30 条**) / `AFFIX_BY_KEY`(:187) / `AFFIX_BY_TAG`(:194) / `AFFIX_BY_POOL`(:205) / `MATERIAL_GRADE`(:221) / `LATE_MATERIAL_DROPS`(:253) / `FORGE_SKILL_TIERS`(:334) / `GRADE_BASE_POINTS`(:359 **6 档**) / `POINT_SCALE`(=6) / `ROLE_POINT_MULT`(:364 main 1/assist 0.5/rune 1.5) / `ENV_BONUS_TABLE`(:399) ⇒ 本条上方机制行只点了 7 个常量名，实际表族已扩到 18 个（**无法判定** `:80 UNPOOLED_TAGS` 3 键会不会随新材料加入而失效：注释自陈「靠同料的其他标签进池」，是软约束）
  缺口 本文件（炼器批正在改动）**只读记录**，本次未做任何代码改动。★**docC 读到的是 `LastWriteTime 2026-10-03 16:36:00`、`SHA256 D3D90689742E8D31…`、969 行的版本**；本条上方机制行记的 970 行是 docC 读到前一版时的行数（该文件在 docC 记录后又被并发改动过 1 行，行号可能继续漂移）
- `js/crafting/pill-poison.js` :: pill-poison.js - v20.0 1.9 丹毒系统 · 服丹按毒性积累丹毒，高丹毒减修炼效率/增走火入魔风险 · 依赖：1.1 走火入魔联动 · v20.41 做深：丹毒只进不出是假账——补「解毒三途」（解毒茶/发汗排毒/延医调治，各占时辰或灵石）
  机制 144 行 · 判定函数（丹药毒副作用：毒性档 + 5 种解毒口）｜关键数据 `map` 5 键（毒性→副作用档）；导出 11 个 window 全局（`addPillPoison` / `getPillPoison` / `getPillToxicity` / `getPillPoisonPenalty` / `getPillPoisonHeartDemonChance` / `detoxifyPill` / `detoxChoice` / `sectSignaturePoisonEase` / `_detoxDoctor` / `_detoxSweat` / `_detoxTea`）
  接口 11 个 window 全局｜依赖 DataManager、itemById、showModal、timeSystem、currentCharData｜事件：无
  缺口 `getPillPoisonHeartDemonChance` 把丹药毒与 `cultivation.js` 的心魔系统连起来，但心魔那条线在 cultivation.js 侧不读本函数（**无法判定**：可能由别处转调）
  缺口 本文件与 `cultivation/qi-deviation.js`（走火）是两套「服用/修炼异常」机制，边界未在任一处写明（**无法判定**）

### js/cultivation/（10 个）— 修炼与突破

- `js/cultivation/art-effects.js` :: art-effects.js - v20.48 功法掌握通电 · 此前两层功法数据全是死账： · ① items-extended/06-arts.js 秘籍的结构化 effect（qi_regen_boost / all_attr_boost / fire_damage_boost…）
  机制 408 行 · 判定函数 + 缓存（功法元素/武器类型 → 战斗加成汇总）｜关键数据 `_ELEM_KEYS` 20 键、`_WEAPON_KEYS` 10 键、`ELEM_NAMES` 11、`_WT_TO_ART` 30 键（武器类型→功法映射）、`summarizeCache` 缓存表、`api` 14 方法（挂 `window.ArtEffects`）
  接口 `window.ArtEffects`（14）｜依赖 `KnowledgeSystem`、`extendedArts`、`learnedSecrets`、`skillPages`、currentCharData、`getEffectiveMax`/`getRealmBonus`｜事件：无
  缺口 本文件是 cultivation/ 里唯一给 battle 提供元素/武器加成的汇总口，但 cultivation.js:922 与 :1108 两处注释都写「用户铁律不准五行相克，且那本查询零调用躺了多年」⇒ 相克表（`ELEMENT_INTERACTIONS`）**仍存在但零调用**，而本文件 `_ELEM_KEYS` 20 键是另一套纯加成表（不涉相克）——两处易被误读为同一件事
  缺口 `_WT_TO_ART` 30 键把武器类型映射到功法，但 `extendedArts`（物品注册表）里的功法条目远多于此 ⇒ 30 键是白名单而非全集，未命中的功法拿不到加成（**无法判定**是否有意）
- `js/cultivation/breakthrough-ritual.js` :: breakthrough-ritual.js - 突破仪式系统 · 突破前准备→突破过程动画→突破后异象→失败副作用 · 让境界突破从"点按钮"变成"完整仪式体验" · 依赖：app.js (performBreakthrough, breakthroughRealm, currentCharData)
  机制 745 行 · 混合（突破仪式：6 阶段 × 5 段位 + 5 种异象 + 4 类副作用 + 5 种材料）｜关键数据 `BREAKTHROUGH_PHASES` 6、`BREAKTHROUGH_STAGES` 5、`BREAKTHROUGH_PHENOMENA` 5、`BREAKTHROUGH_SIDE_EFFECTS` 4、`BREAKTHROUGH_MATERIALS` 5、`_realmBonusKey` 8、`_lifeByTier` 9、`breakthroughState` 运行态
  接口 19 个 window 全局（`performBreakthrough` / `startBreakthroughRitual` / `closeBreakthroughRitual` / `burnFortuneForBreakthrough` / `extendLifespan` / `getEssenceRequired` / `getQiMax` / `getRealmEffectDescription` / `_performBreakthroughNew` …）｜依赖 `REALM_CONFIG`、`checkSoulBlock`、`CaveFacilities`、`EconomyTransaction`、`MoodSystem`、EventBus、StateRegistry、doAutoSave｜事件：★发 `cultivation:breakthrough`(:607)
  ★缺口 与 `breakthrough-system.js` **双实现**：两文件各自导出 `_performBreakthroughNew` / `getEssenceRequired` / `getQiMax` / `getRealmIndex` / `getTemperingRequired` 等**同名函数**（breakthrough-system.js 17 个全局里 8 个与本文件重名）⇒ 加载顺序后者覆盖前者，两套突破公式（随机率 vs 仪式阶段）只有最后加载的一套真正生效（**无法判定**当前谁赢，须查 scripts.manifest.json 顺序）
  缺口 本文件与 breakthrough-system.js 都调 `window.CaveFacilities.getBuff` 与 `MoodSystem`，但突破成功率公式各写一份（实测 ritual 侧 0.6×炉火式、system 侧 0.97×境界惩罚式）⇒ **数值口径分叉**（wave73 测试只钉了 system 侧那条链）
- `js/cultivation/breakthrough-system.js` :: breakthrough-system.js - 境界突破系统（v9.7） · 真气/真元分离：真气用于战斗，真元是突破修为 · 历练值：只增不减，代表阅历与战斗经验 · 依赖：REALM_CONFIG（data.js）
  机制 362 行 · 判定函数 + 状态机（突破成功率/真气/炼体三本账）｜关键数据 无大写常量表；17 个 window 全局（`calculateBreakthroughRate` / `getBaseSuccessRate` / `getRootCultivationBonus` / `getRootSpeedMultiplier` / `cultivateQi` / `addEssence` / `addTempering` / `getLifespanEndedPenalty` 等）
  接口 17 个 window 全局｜依赖 `REALM_CONFIG`、`BALANCE_CONFIG`、`CaveFacilities`、`MoodSystem`、EventBus、currentCharData、timeSystem｜事件：★发 `cultivation:breakthrough`(:261)
  ★缺口 与 `breakthrough-ritual.js` 的同名双实现（见 ritual 条目）；两份都发同名事件 `cultivation:breakthrough` ⇒ 事件桥的 `cultivation:breakthrough` 有两个生产源，但只有**实际加载的那份**会在运行时发（死实现不发）
  缺口 `getLifespanEndedPenalty` 依赖 lifespan-system 的寿元账，而 lifespan-system.js:286 也订 `cultivation:breakthrough` ⇒ 突破事件被 3 个模块消费（continue-save / lifespan / quest 桥），其中 lifespan 的寿终惩罚与突破是**互为因果的一对**，任一侧漏接线即失效
- `js/cultivation/cultivation-bottleneck.js` :: cultivation-bottleneck.js - 修炼瓶颈期系统 · 每个境界中期出现瓶颈，经验无法增长，需要特殊方式突破 · 依赖：cultivation.js (proficiencyData, checkProficiencyUpgrade)
  机制 370 行 · 状态机 + 判定函数（修炼瓶颈：8 类瓶颈 + 5 种化解方案）｜关键数据 `BOTTLENECK_CONFIG` 8 键、`BOTTLENECK_SOLUTIONS` 5 键、`playerBottleneck` 运行态 6 键（StateRegistry 'cultivationBottleneck'）、`__bottleneckHandle` 单例
  接口 14 个 window 全局（`checkBottleneck` / `attemptBreakBottleneck` / `executeBottleneckSolution` / `applyBottleneckEffect` / `applyCultivationBottleneckPenalty` / `triggerHeartDemon` / `addProficiencyExp` / `removeItem` / `insightPoints` …）｜依赖 StateRegistry、npcManager、inventory、currentSkills、insightPoints、timeSystem、showMessage｜事件：无
  ★缺口 注释与实现已对齐但病灶仍在：`:130` 与 `:247` 两处都写「`checkBottleneck` 现推恒真、`applyBottleneckEffect` 下次打坐又把旗置回，等于无限抽税」⇒ **同一瓶颈可被无限次付费化解**，两次自述都指向同一个未修问题
  缺口 本文件与 `cultivation.js`（2071 行）双向导出同名口（`applyCultivationBottleneckPenalty` / `attemptBreakBottleneck` / `addProficiencyExp` / `playerBottleneck`），而 cultivation.js 又把自己的版本挂上 window ⇒ **同名覆盖**（**无法判定**当前生效的是哪一份）
  缺口 `BOTTLENECK_SOLUTIONS` 5 种方案里至少 1 种要 `removeItem` 付材料，但本文件无物品表（走正主 `removeItem`）⇒ 材料 id 校验在别处（**无法判定**）
- `js/cultivation/cultivation.js` :: cultivation.js - 功法修炼系统（v6.2 修仙深度扩展） · 功法熟练度、突破、领悟、境界质变、功法组合、心魔系统
  机制 2071 行 · 混合（修炼总账：打坐/熟练度/悟道/心魔/功法相生/心魔战/面板渲染）｜关键数据 `REALM_UNIQUE_EFFECTS` 11 境、`PROFICIENCY_LEVELS` 10 档、`INSIGHT_TYPES` 14 类、`SKILL_COMBINATIONS` 8 套（表内 61 处嵌套写法）、`HEART_DEMON_TYPES` 5 类、`_MERGE_EFFECT_TEXT` 24 键、`_MERGE_ELEM_TEXT` 18 键、`ELEMENT_INTERACTIONS` **1 键**、`LEDGER_SKILL_ID_PREFIXES` 2；熟练度落 `localStorage('xianxia_proficiency')`
  接口 **112 个 window 全局**（全项目导出最多的文件之一）：`cultivateSkill` / `addInsight` / `checkProficiencyUpgrade` / `getProficiencyEffectMultiplier` / `doSkillMerge` / `checkHeartDemonTrigger` / `breakthroughWithHeartDemon` / `getDemonicCorruption` / `enlightenNode` / `getElementalDamageMul` / `showEffect` 等｜依赖 `ArtEffects`、`KnowledgeSystem`、`ENLIGHTEN_NODES`、`PlayerSect`、`GrandLegacy`、`SECT_SPECIFIC_ARTS`、`BALANCE_CONFIG`、`COLLECTION_MILESTONES`、EventBus、GameScheduler、quest 的 `advanceQuestObjectivesFromEvent`｜事件：★发 `cultivation:completed`(:400)；★并**主动调** `advanceQuestObjectivesFromEvent('sect:joined'/'cultivation:breakthrough')`(:568/:587/:592) 做接取回溯
  ★缺口 1（注释自陈的恒真闸）→ `:207` 「info.exp 永达不到本级门槛，此函数的「经验不足」闸恒真、按钮已从面板撤下。保留函数体仅作向后兼容（不再挂 UI）」——**死函数仍在文件里**
  ★缺口 2（零调用死函数两处）→ `:922` 与 `:1108` 都写「零调用死函数，且用户铁律不准五行相克」；`ELEMENT_INTERACTIONS` 只有 1 键 ⇒ 元素相克表是**实测仅 1 项的半成品**
  ★缺口 3（补接线留痕）→ `:1111-1112` 「v25.4 玩家乐趣闭环批接线：此函数早年写完整、挂了 window，却全仓零调用零 UI——『系统写完没接线』的经典死路（道侣名册 v20.24、悬赏榜 v20.21 同款病史）」⇒ 本文件自己承认有「写完没接线」的历史病灶
  ★缺口 4（只写不读的真死状态）→ `cultivation.js:50-51` `window._trainingInsightBonus[skillId] = { bonus:1.5, day:... }` **全仓只有这 2 处出现、没有任何读取方** ⇒ 修炼悟道加成（1.5 倍 + 当日戳）**写进一个没人读的全局袋**（实测全 js/ 目录 grep `_trainingInsightBonus` 仅命中这两行）
  缺口 本文件与 `breakthrough-system.js` / `breakthrough-ritual.js` / `cultivation-bottleneck.js` / `long-retreat.js` / `art-effects.js` 六方互相导出同名口（`getRealmIndex` / `getEssenceRequired` / `addProficiencyExp` / `getEnlightenmentFlag` / `applyCultivationBottleneckPenalty` …）⇒ cultivation/ 目录内**全局覆盖链极密**，任何一份的改动都可能被另一份静默盖掉
  缺口 熟练度走 `localStorage('xianxia_proficiency')` 直写，而同目录 enlightenment-tree / long-retreat 走角色账或 StateRegistry ⇒ 存档口径不统一（与 quest/choice-memory 同款病灶）
- `js/cultivation/divination.js` :: divination.js - 天机推演/占卜 · v20.0 2.19 落地；v20.39 做深：一按钮单卦 → 四问卦阵（命/事/灾/人）。 · 卦道纪律：卦不欺人——灾问读日历真约、人问读道侣真所在、事问读行情真价， · 凡占出来的都是账上有的；命问才涉气运增减。卦不编造，与节日余波同一宪法
  机制 217 行 · 数据表 + 判定函数（占卜：卦象池 + 危险/市价/人物三类卦）｜关键数据 `FORTUNE_HEX` 5 键、每卦 6 爻；导出 8 个 window 全局（`divineFortune` / `divineDanger` / `divineMarket` / `divinePerson` / `openDivination` / `_lastDivinationDay`）
  接口 8 个 window 全局｜依赖 DataManager、WorldCalendar、npcManager、locationSystem、showModal、timeSystem｜事件：无
  缺口 `FORTUNE_HEX` 只有 5 卦，而 `divineDanger`/`divineMarket`/`divinePerson` 三个出口各自需要不同语义的卦象 ⇒ 三类卦共用 5 条池（**无法判定**是否有意：未见按卦种分池的表）
  缺口 `_lastDivinationDay` 是当日限次闸的运行态变量，却挂在 window 上 ⇒ 外部可写、可清（改档/作弊面）
- `js/cultivation/enlightenment-tree.js` :: enlightenment-tree.js - v20.0 2.3 悟道树 · 消耗悟道点数（insightPoints）解锁永久节点，长期积累 · 依赖：0.2.1 境界、insightPoints（cultivation.js 已有 spendInsightPoint）
  机制 140 行 · 数据表 + 判定函数（悟道树：9 个节点 + 6 个基础节点 + 悟道点消费）｜关键数据 `ENLIGHTEN_NODES` **9 节点**、`BASIC_IDS` 6；导出 9 个 window 全局（`enlightenNode` / `getEnlightenedNodes` / `getEnlightenmentBonus` / `getEnlightenmentFlag` / `getEnlightenmentLockReason` / `getInsightGainBonus` / `insightPoints` / `spendInsightPoint`）
  接口 9 个 window 全局｜依赖 currentCharData、insightPoints（正主在 cultivation.js）、updateInsightUI、showMessage｜事件：无
  缺口 本文件自行挂 `window.insightPoints` 转发口，而真值在 cultivation.js ⇒ 同名覆盖（**无法判定**谁最终生效）
  缺口 `ENLIGHTEN_NODES` 9 节点是本目录最小的数据表，而 `cultivation.js` 的 `INSIGHT_TYPES` 有 14 类 ⇒ 14 类悟道只有 9 个节点可点（**无法判定**其余 5 类的去向）
- `js/cultivation/heavenly-tribulation.js` :: heavenly-tribulation.js - v20.0 1.1 天劫/渡劫战 · 渡劫期满触发：多波雷劫战斗 + 中段心魔劫 + 道侣护法分担 + 失败转世/残魂 + 成功飞升
  机制 178 行 · 状态机（天劫：多波雷劫 + 仙躯/道侣护道 + 飞升发奖）｜关键数据 `_trib` 运行态 3 键、`RETREAT_*` 不涉；导出 13 个 window 全局（`triggerHeavenlyTribulation` / `startTribWave` / `continueTribWave` / `settleTribulation` / `grantImmortality` / `onAscension` / `_hasDaoCompanionGuard` …）
  接口 13 个 window 全局｜依赖 startBattle、closeBattle、eventFlags、itemById、giveWithReceipt、addItemFailTextFor、eventFlags｜事件：无
  缺口 `:149` 注释自陈 DES-72 病灶（旧写法丢返回值——飞升喜话念完，两枚到底进没进囊屏上从不提）已修；本文件仍自行挂 `window.addItemFailTextFor` / `window.giveWithReceipt` 转发口 ⇒ 同名全局覆盖
  缺口 `grantImmortality` 与 `ascension-epilogue.js` 的同名口重复（本文件 13 个全局里至少 2 个与 endgame 那本重名）⇒ **同名覆盖**（**无法判定**当前生效者）
  缺口 本文件不走 EventBus，天劫波次完全靠 `startBattle`→`continueTribWave` 回调链 ⇒ 战斗中若走别的结算分支（逃跑/断线）则波次链断（**无法判定**是否有兜底）
- `js/cultivation/long-retreat.js` :: long-retreat.js - 长期闭关 · v18.8：把"修真无岁月"接到现有时间/NPC/寿元/世界事件系统上。 · v18.9：新增"闭关至下次事件"+ 出关世界摘要（summarizeRange）。 · 不新增持久状态：闭关只是一次长行动，结果写回既有角色、功法与世界状态
  机制 444 行 · 状态机 + 新日结算（长期闭关：3 种闭关方式 × 5 类目标 × 提前出关订阅）｜关键数据 `RETREAT_OPTIONS` **3 档**、`RETREAT_TARGET_CATEGORIES` **5 类**、`_rtNotes` 运行态；导出 23 个 window 全局（`startLongRetreat` / `startLongRetreatUntilEvent` / `openLongRetreatUI` / `getRetreatDailyYield` / `_isInLongRetreat` / `addQiDeviation` / `addProficiencyExp` 等）
  接口 23 个 window 全局｜依赖 WorldLoop（日结）、WorldCalendar、`EventBus`（订 `worldCalendar:due` :368 提前出关）、MoodSystem、MarketDynamic、`checkSoulBlock`、playerLifespan、locationSystem｜事件：★发 `cultivation:completed`(:288)；★订 `worldCalendar:due`(:368)
  缺口 `getDueFlag`(:386) 是 `startLongRetreatUntilEvent` 的**回调形参**（由 :228/:251 两处消费），不是死导出；真值在 `hit` 里——但 `hit` 只在闭包内，外部读不到 ⇒ **无法判定**外部是否需要这个标志
  缺口 `:76` 注释自陈「旧写法拿对象当熟练度键，48 点/日全记到 `'[object Object]'` 垃圾键上。对象/字符串双兼容取 .id」已修；但同一文件仍有多处裸全局转发（`_isInLongRetreat` / `_suppressTimeFlowMessages`）被 cave-life / cave-reception / world-events 三本读取 ⇒ 跨文件裸依赖无守卫
  缺口 本文件的 `RETREAT_OPTIONS` 只有 3 档，而 §0.2 职责行未提档数；`RETREAT_TARGET_CATEGORIES` 5 类与 `world-calendar.js` 的事件 category 是否同一套未声明（**无法判定**）
- `js/cultivation/qi-deviation.js` :: qi-deviation.js - v20.0 2.1 走火入魔状态 · 修炼过度（真气低时修炼）/丹毒高/心魔失控→气机紊乱，紊乱高→走火入魔（减属性） · 独立于心魔系统。依赖：0.2.3 心魔、1.9 丹毒
  机制 140 行 · 判定函数 + 状态机（真气走火：3 种平息方式）｜无大写常量表；导出 9 个 window 全局（`addQiDeviation` / `getQiDeviation` / `getQiDeviationBlocked` / `getQiDeviationPenalty` / `calmQiDeviation` / `calmQiChoice` / `_calmByGuard` / `_calmByMeditation` / `_calmByYield`）
  接口 9 个 window 全局｜依赖 npcManager、showModal、showMessage、timeSystem、currentCharData｜事件：无
  缺口 `calmQiChoice` 同时被 cultivation.js 导出 ⇒ **同名覆盖**（本文件与 cultivation.js 各一份 `calmQiChoice`）
  缺口 走火入魔的平息路径有三条（护道/冥想/放弃），但 `getQiDeviationPenalty` 的三档倍率未在文件内声明（**无法判定**：可能读 cultivation.js 的表）
  缺口 本文件与 `cultivation.js` 的 `HEART_DEMON_TYPES`（5 类心魔）是两套异常机制（走火 vs 心魔），边界未在任一文件里写明 ⇒ **疑似概念重叠**（无法判定）

### js/economy/（5 个）— 经济（拍卖 / 押货 / 原子事务 / 货担）

- `js/economy/auction-service.js` :: auction-service.js — 单机拍卖行（真实托管/结算）
  机制 670 行 · 混合（拍卖行：皇家池 5 件 + 竞拍对手 6 名 + 卖家 6 名 + 落槌价 + 声望门）｜关键数据 `ROYAL_POOL` **5 件**、`BID_RIVAL_NAMES` 6、`SELL_BUYER_NAMES` 6、`state` 6 键（StateRegistry 'auctionService'）、`api` 20 方法
  接口 `window.AuctionService` + `window.openAuctionHouse` / `openAuctionStoryScenario` / `listForAuction` / `bidOnAuction` / `addReputationFromTrade` / `getRoyalAuctionAccess`｜依赖 `EconomyTransaction`、`GameScheduler`、StateRegistry、WorldCalendar、`getReputationValue`/`getReputationLevelIndex`、`getRoyalAuctionAccess`、inventory/itemById｜事件：无
  缺口 本文件依赖 `getRoyalAuctionAccess`（reputation-system.js 的全局许可），而 wave95 测试 E/N 段已把 `hasGlobalSpecialPermit`/`getRoyalAuctionAccess` 收口 ⇒ 拍卖行是「声望解锁」这条链的唯一消费方（**无法判定**是否还有别处）
  缺口 `api` 20 方法挂在 `AuctionService` 上，实测 `window.AuctionService` **有外部引用**（非死导出）——与 horse-market / pawn-service / cave-siege 三处「命名空间零引用」形成对比，可作对照样本
- `js/economy/caravan-trade.js` :: caravan-trade.js - v25.6 押货跑商（第一百四十八批 · 玩家心愿批） · 用户点单：「跑商低买高卖——城间物价波动，押货赶路可能被截道」。 · 与既有跑单帮（peddler-service，虚拟货担、柜上现结）分账：跑单帮是柜面生意
  机制 447 行 · 混合（货担：2 条商路 × 8 段里程 + 途中伏击真战斗 + 对手竞速）｜关键数据 `TRADE_ROUTES` **2 键**、`_state` 2 键（StateRegistry 'caravanTrade'）、`CaravanTrade` 13 方法
  接口 `window.CaravanTrade`（13）+ `openCaravanBoard`（★与 city-facilities/facility-peddler-contract.js 抢同名）+ `sendVoyage` / `settleCaravanAmbush` / `maybeCaravanAmbush` / `isAtHome` / `isInSoulState` / `getRivals` / `playerPushDeed`｜依赖 EconomyTransaction、MarketDynamic、NpcBond、BeggarAlms、DataManager、StateRegistry、npcManager、startBattle、currentBattle｜事件：无
  ★缺口 同名全局冲突 → 本文件与 `city-facilities/facility-peddler-contract.js:107` 各挂一份 `window.openCaravanBoard`（后加载者覆盖前者）；`facility-peddler-contract.js` 只有 107 行却挂这个口，明显是转发 ⇒ 谁最终生效取决于 `scripts.manifest.json` 顺序（**无法判定**，须查清单）
  缺口 `sendPrompt`（:422）与 `voyages`（:417）两枚导出在死导出扫描里被标出但因同名计数 >1 未进最终名单 ⇒ 需人工确认（本批**无法判定**）
  缺口 `TRADE_ROUTES` 只 2 条商路，而 23 城的地理跨度与 `randomMap.js` 的 8 段里程不同构 ⇒ 商路与野图是两套里程口径（**无法判定**是否有意分层）
- `js/economy/economy-transaction.js` :: economy-transaction.js — 原子经济事务 · 用完整背包+货币快照提供轻量 rollback，优先保证单机存档正确性。
  机制 196 行 · 判定函数 + 持久化（原子事务：加/减钱与物品一次成功或全回滚）｜`api` 10 方法；导出 7 个 window 全局（`EconomyTransaction` / `ItemInstance` / `XianXia` / `addItem` / `restoreItemFromSnapshot` / `updateCurrencyUI` / `updateInventoryUI`）
  接口 `window.EconomyTransaction`（10 方法：debit/credit/snapshot/restore…）+ `window.ItemInstance`｜依赖 inventory（钱包真账）、currentCharData、discipleState｜事件：无
  缺口 本文件是全项目**最关键的单一真源之一**（钱与物的原子通道），却仍自行挂 `window.addItem` / `updateCurrencyUI` / `updateInventoryUI` 三个转发口 ⇒ 与 inventory.js 互相挂（**互相覆盖**）
  缺口 `XianXia` 命名空间也由本文件挂一次，而 enhanced-shop.js / auction-service.js / beast-* 等至少 10 个文件各挂一次 ⇒ `XianXia.*` 子键的最终值取决于加载序（**无法判定**）
  缺口 本文件无 StateRegistry 注册（纯函数库），但 `ItemInstance` 造出的实例要靠 inventory 落档 ⇒ 事务本体不入档、结果入档，重放安全性依赖 inventory 侧（**无法判定**）
- `js/economy/peddler-service.js` :: 第六十九波 · 跑单帮贩货（自己掏钱进货，自己认价出手） · 此前「贩货」只有两条腿是别人的：押镖是替镖局送货拿死酬金（四十一/四十三波）， · 商队行情牌只报信不做买卖（四十波）。行情真源（MarketDynamic 六区×六类供需倍率）接了店铺买卖
  机制 259 行 · 数据表 + 混合（货郎：6 类大宗货 × 逐城行情 + 签约契约所）｜关键数据 `CARGOES` **6 条**、`pool` 6、`picks` 逐次抽货、StateRegistry 'peddlerService'、`PeddlerService` 14 方法
  接口 `window.PeddlerService`（14）+ 自身挂 `getAbsoluteDay` / `getCurrentCityName`｜依赖 CityFaces（管事认脸，带守卫）、MarketDynamic（真行情）、RewardService、WorldCalendar、inventory、locationSystem、timeSystem｜事件：无
  缺口 `CARGOES` 6 条 vs `market-dynamic.js` 的 `CATEGORIES` 6 类 —— 数目相同但未见 id 映射声明（**无法判定**是否一一对应）
  缺口 `PeddlerService` 被 `facility-peddler-contract.js:7` 以 `typeof window.PeddlerService` 守卫读取（契约所增补依赖它），但本文件不感知契约所 ⇒ 依赖方向单向、可缺（缺则契约所那两出戏静默不注册）
- `js/economy/spirit-vein.js` :: spirit-vein.js - v20.0 2.13 灵脉/灵石矿经营 · 金丹+可占据灵脉，每日被动产灵石；可升级提升产出 · v35：野外图上的「灵脉之眼」可亲自布阵夺取——与菜单占脉合成一本账（任何时刻只有一处灵脉）
  机制 138 行 · 判定函数 + 新日结算（灵脉经营：菜单托管小脉 + 野外图脉眼可夺）｜关键数据 `MAP_LEY_OUTPUT` **3 档**（灵蕴一/二/三重 → 日产 25/35/50）、`CLAIM_COST`=1000、`MOVE_COST`=600（迁脉折价）；导出 7 个 window 全局（`claimSpiritVein` / `claimMapLey` / `upgradeVein` / `getSpiritVein` / `veinLocationText` / `getRealmTier`）
  接口 7 个 window 全局｜依赖 DataManager、timeSystem.onNewDaySubscribe、currentCharData、gameLog、showMessage｜事件：无
  缺口 `getSpiritVein` 被 `map/randomMap.js` 读（实测 ext=1），但本文件同时自行挂 `window.getSpiritVein` ⇒ 单一正门之外多一份暴露（低风险）
  缺口 本文件与 `extensions/resource-points.js`（30 处矿/脉/药园）**是两本灵脉账**：本文件管「我占了哪一处、日产多少」，resource-points 管「地图上有哪些无主产地、谁占的」⇒ 唯一真源在 resource-points 侧（头注「任何时刻只有一处灵脉」），本文件只是托管视图（**无法判定**是否有一致性校验）

### js/endgame/（1 个）— 终局

- `js/endgame/ascension-epilogue.js` :: ascension-epilogue.js - v20.0 1.3 飞升后世界（最小可玩版） · 香火系统 + 二段飞升目标。天界完整地图留后续扩展。 · 依赖：1.1 渡劫成功（onAscension 由 heavenly-tribulation 调用）、0.2.1 境界质变
  机制 174 行 · 状态机 + 渲染（终局：飞升 → 天界 → 二次飞升 → 转世积分）｜`enemy` 模板 13 字段；导出 10 个 window 全局（`onAscension` / `enterTianjie` / `leaveTianjie` / `tianjieSpar` / `grantImmortality` / `trySecondAscension` / `ascendedDescension` / `reincarnate` / `confirm` / `realmAtLeast`）
  接口 10 个 window 全局｜依赖 `ReincarnationIntegration`、`WorldJournal`、openWildernessMap、startBattle、currentRegionForMap、eventFlags、doAutoSave、timeSystem｜事件：无
  ★缺口 1（注释点名的死分支）→ `ascension-epilogue.js:101` 「此前转世积分表里 'ascend'(+50) 是死代码——全库没有任何路径写入 `lastDeathReason='ascend'`」⇒ 与 `extensions/reincarnation.js` 的 `DEATH_REASON_POINTS` 是同一处病灶（**该档至今拿不到**）
  ★缺口 2（同名口四处）→ `grantImmortality` 与 `cultivation/heavenly-tribulation.js` 同名；`confirm` 是通用名（与弹窗确认框极易撞名）⇒ 同名覆盖
  缺口 本文件是 endgame/ 目录唯一一本（174 行），却承担了飞升→天界→二次飞升→转世四段终局流程，而 `quest/qi-finale.js`（627 行）是另一条终局线 ⇒ **两条终局线并存**（灵气之尽 vs 飞升天界），谁触发谁**无法判定**

### js/equipment/（2 个）— 装备套装

- `js/equipment/bonded-artifact.js` :: bonded-artifact.js - v20.0 1.8 本命法宝/法宝成长 · 金丹+可炼制本命法宝（绑定不可易主），喂材料升级，战斗加成随等级 · 觉醒技能/化形留后续扩展。依赖：0.2.2 五行（法宝元素随主功法）
  机制 180 行 · 状态机（法宝阶 + 器灵阶两套等级）+ 判定 + 提示渲染（只走 showMessage，无面板代码）｜关键数据 法宝 7 字段（name/level/exp/expMax/durability/maxDurability/element）；法宝升级 `expMax = 50 + level*30`，喂 1 个材料 exp+10，上限 **10 阶**；器灵 `SPIRIT_AWAKEN_COST=200`、`SPIRIT_AWAKEN_MIN_LEVEL=3`、`SPIRIT_MAX_LEVEL=5`、`expMax = 30 + level*20`、交感一次 `10 + 法宝阶*2`、`SPIRIT_NAMES` 6 元素、`SPIRIT_VOICES` **5 级 × 2 句**；战斗倍率 `1 + (level-1)*0.05 + 器灵level*0.02`
  接口 8 个 window 全局：`forgeBondedArtifact` / `feedArtifact` / `artifactCombatMul` / `getBA` / `awakenArtifactSpirit` / `communeWithSpirit` / `SPIRIT_AWAKEN_COST` / `SPIRIT_AWAKEN_MIN_LEVEL`｜依赖 DataManager.deductSpiritStones、timeSystem.advanceTime、window.removeItem、inventory、updateCharacterStatus、`_getMainTechniqueElement`；存档走 `game-state.js:316/956` 的 `_bondedArtifact` 深拷贝白名单；入口全在 `cultivation/cultivation.js:539/548/549/554` 四个 onclick 字符串｜事件：无
  ★缺口 1（实测：器灵那 10% 加成玩家在面板看不见）→ 实测 10 阶 + 器灵 5 级 `artifactCombatMul()` = **1.55（+55%）**，而 `cultivation.js:552` 面板只印 `(level-1)*5` = **45%** ⇒ 器灵的 10% 只经 `app.js:5089` 挂上 `playerEntity._artifactMul`、再由 `battle.js:713/787` 乘进攻防，**面板永远不显示**；而 `awakenArtifactSpirit` 的成功提示（:138）却明写「法宝攻防 +2%」⇒ 提示与面板口径不一致
  ★缺口 2（死字段）→ `:33` 写入的 `durability / maxDurability` **全仓无读方**（`_bondedArtifact` 的外部命中只有 game-state 的存/读档与 cultivation 的面板）⇒ 法宝永远不会损耗，「本命法宝」不坏
  ★缺口 3（导出常量无消费方）→ `SPIRIT_AWAKEN_MIN_LEVEL` / `SPIRIT_AWAKEN_COST` 导出了，但 `cultivation.js:546/549` 写死 `_ba.level >= 3` ⇒ 改唤醒门槛要改两处，导出常量是摆设
  缺口 `forgeBondedArtifact(name)` 的唯一调用点 `cultivation.js:539` 是 `onclick="window.forgeBondedArtifact()"`——**不传参** ⇒ 玩家永远只能拿到默认名「本命法宝」，取名功能事实上不存在
  缺口 `:59` `if (typeof window.removeItem === 'function') window.removeItem(matUid, 1);` **丢弃返回值**（DES-72/89 同族病灶）——`removeItem` 失败时材料不扣而经验照 +10
  缺口 `:85` 注释称器灵等级经 `artifactCombatMul → battle.js _artifactMul` 进战斗乘区；实测 `battle.js` 只读 `this._artifactMul`，而这个字段是 `app.js:5089` 挂上去的 ⇒ 链路成立，但**注释漏了 app.js 这一跳**，照注释去 battle.js 找会扑空
  **★ v25.6 器灵瑕疵 / 性格 / 反噬层（`:208-750`）** · 类型：判定函数 + 渲染层（脾气卡）｜实测骨架：文件现 **753 行**（该层 543 行，占七成）、瑕疵键 **5 个**、计数器 2 个（`heat` / `killStreak`）、阈值 4 档（2/3/3/4）、对外 window 导出 **+6 个**、`catch` 处处带 `console.warn`（空 catch 0）
  **5 个瑕疵键**（`:224 FLAW_ORDER` 轮转序 / `:229 SPIRIT_FLAWS`，每键带 `meter/limit/onFeed/onCommune/onKill/onRefuse/boon/backlash/avoid`）：`glutton` 贪食（meter heat，limit 3，好处=鉴材）· `hasty` 性急（heat，2，**器灵 3 级起才躁得动** `needSpiritLevel:3`，好处=预告）· `bloodthirst` 嗜血（**killStreak**，3，好处=尝血，**唯一挂在战斗节拍上的**）· `lovesick` 痴情（heat，4，好处=念旧，**唯一会减本次收益**）· `suspicious` 多疑（好处=验料，判据早于 `removeItem` 故拒食材料不扣）
  **五行派映射**（`:280 FLAW_BY_ELEMENT`）wood→glutton / earth→hasty / fire→bloodthirst / water→lovesick / metal→suspicious；`neutral` 退到 `:282 _neutralFlawKey(ba.name)` 按法宝名取模 5。**零骰**，且只在 `:156` 真正写盘时固化进 `spirit.flaw`，此前一律现算（旧档在这一刻才被固化）
  **蓄势/反噬机制**（`:397 spiritFlawBeat(beat, payload)` 是消费脊柱）：好处 `boon` 先算（只落在信息/资源/时间/选择四域，**不进 mul、不给器灵经验**），`:422` 再判确定性阈值反噬（计数器 + 阈值，同条件必得同结果，**零骰**），触发即清零本账。三个代价口袋见 `:364-`：**器灵经验不入账** / **时辰流走**（`advanceTime`）/ **气血**（留 1 点底，`:369` 同 `city-gate.js:101` 守卫）。`:85-87` 特意**先算这一拍再落经验**——`lovesick` 的 `expMul=0.5` 要减的是这次的收益，必须在加之前算出 `expMul`，其余四条恒为 1
  **6 处消费口**（实测调用点行号）：`spiritFlawBeat` **4 个真节拍** —— 喂料 `:87`、交感 `:180`、拒食 `:552`（在 `_flawFeedGate:534` 内）、击杀 `:610`（`_flawOnEnemyDefeated:604`，`:743` 订阅 `EventBus 'enemy:defeated'`，带 `window._spiritFlawKillHooked` 单次守卫防双份 listener 让连斩翻倍）；**2 个面上出口** —— 脾气卡 `:335 spiritFlawProfile`（`:670 _mountFlawCard` 包住修炼面板刷新，**不改 cultivation.js**）、温养按钮 `:567 temperSpiritFlaw`（`TEMPER_STONES=120` 灵石 / `TEMPER_MINUTES=60` 分钟，把脾气顺移到 `FLAW_ORDER` 下一键并清账，**不给任何数值好处**——反噬若不可改，玩家只有「忍着」一种选择，那不叫取舍叫惩罚）
  **存档走 `_bondedArtifact.spirit`，不开新键**：`flaw` 与 `sp._flawState`（两计数器 + `backlashCount`）全塞进去，随 game-state 那条 JSON 整包深拷贝往返；**不注册 StateRegistry、不往 game-state.js 加键名**（实测真页面 `localStorage` 18 键无新增）
  **peekBA 纯读口**（`:289 peekBA()`）：本层所有「只想读」的地方一律走它，**不碰 `getBA()`** —— `getBA()` 在字段缺失时会把 `cd._bondedArtifact` 写成 null（见 `:7-12`），只想读却改了角色档是本仓反复出现的那类脏
  **新增对外口**（`:732-738`）`window.SPIRIT_FLAWS` / `FLAW_ORDER` / `spiritFlawProfile` / `spiritFlawBeat` / `temperSpiritFlaw` / `SPIRIT_TEMPER_STONES` —— 加上原有 8 个，本文件 window 全局共 14 个
  ★**硬约束：性格层不带战力**（写死在 `:197-199` 注释与代码里）→ 实测 `artifactCombatMul`(`:200-206`) **全文只有两行乘区**：`1 + (ba.level - 1) * 0.05`（法宝阶 +5%）与 `mul += (ba.spirit.level || 0) * 0.02`（器灵级 +2%），**flaw 一行都没加**。理由写明：性格若也乘进来，玩家会把「挑一件好脾气的器灵」当成第二条升级线，性格便从「这枚器灵是什么脾气」退化成「这个数更大」
  ★缺口 4（战斗中行为差异未做 · 本批有意不做）→ 五条脾气**只改表现与代价，不改战斗行为**：`:604` 只在击杀**之后**记一笔连斩，**没有塞任何假消费口**去伪造战斗中的行为差异 ⇒ 「嗜血」在战斗里的人机差异、其余四条在战斗里的手感差别**一律不存在**（宁可不做，也不做假）
  ★缺口 5（反噬口袋无回补口）→ `ba.durability` 成了四条脾气的反噬口袋（`backlash` 一律扣器身），但**全仓无回补口**（无修缮/温养回填路径）⇒ 掉到 0 就永远 0（此字段自 v20.0 起就无读方，见上面缺口 2，两条缺口同源）
  ★缺口 6（阈值全是设计值）→ 五行→脾气映射与 `limit` 2/3/3/4、`TEMPER_STONES 120` 全部阈值**都是设计值，无战斗数据支撑**（文件 `:228` 自己写了「阈值全是设计值——一轮/一天内会出现一次，不会一分钟三连」）
  ★缺口 7（缓解口生效但面板没印）→ 器灵升级清账这条缓解口（`:323 _flawLevelUpRelief`，器灵长一岁见识 ⇒ 那本账当场清零）**生效了但面板没印**，玩家看不到这件事
- `js/equipment/equipment-sets.js` :: 第七十七波 · 套装有名有魂（凑齐一身，才算个样子） · 九品谱（v20.91）把一品毕业线铺齐了：十三件「全身成套」。可凑齐了什么也没发生 · 攻防是各件各算的散账，穿齐毕业套和穿着七拼八凑，走起路来没有半分不同。 · 本账把毕业装立成三个名号（剑修「问天」四件 / 法修「合道」五件 / 体修「开天」四件
  机制 134 行 · 纯数据表 + 派生计算 + 运行时本地账（头注纪律②「零新存档字段」，脱下即散）｜关键数据 `SETS` **3 套**、成员 **13 件**（实测去重后仍 13，无重复 id）、`thresholds` 共 **10 档**（问天 2/3/4、合道 2/3/4/5、开天 2/3/4），每档带一句 `line` 文案与一份 `bonus` 键值；`achieved` 档位**累积**（四件拿满二三四三档的账）
  接口 `window.EquipmentSets` 6 键（SETS / equippedIds / activeSets / combatBonus / statusLine / noteChange）｜依赖只认 `window.currentEquipment` 装备格（塞行囊不算数，纪律④）；`combatBonus` 被 `inventory.js:2162` 的战斗加成表并入、`noteChange` 被 `equipment.js:554/561` 穿脱装备时调、`statusLine` 被 `app.js:7006` 读进面板｜事件：无
  （**正面核实**：纪律①③成立）13 件成员**在 512 件运行时物品里全部存在**——问天剑 mainHand / 问天戒 ring1 / 凌霄冠 head / 步霄履 feet / 涅槃杖 mainHand / 合道戒 ring2 / 九转仙衣 body / 鸿蒙玉佩 acc1 / 太上仙印 acc2 / 开天盾 offHand / 星河颈链 neck / 玄玉带 waist / 蛟鳞手笼 hands ⇒ 无幽灵 id，「零新物品」成立。实测空装备时 `activeSets()=[]`、`combatBonus()={}`、`statusLine()=""`（老基线一分不添，纪律③成立）；穿问天 2 件后 `combatBonus()={"crit":8}`、`statusLine()="⚔️ 问天套（2/4）"`，与 :18 阈值文案一致
  缺口 `:117` 提点只在 `a.count > before` 时报 ⇒ **脱套装一声不吭**，掉件方向完全无反馈（穿件有文案、掉件没文案）
  缺口 `:102 _lastSig` 是模块级运行态、注释自陈「读档清零」，但 `:107` 首次对账只记基线不报 ⇒ 读档后穿着毕业套进面板当天不会看到「成套」文案，要脱一件再穿回才触发
  缺口 `SETS` / `equippedIds` / `activeSets` 三键对外零引用（仅本文件内部使用），只有 `combatBonus` / `statusLine` / `noteChange` 三个口真正被外部调用
  缺口 `:82 combatBonus()` 把各档 `bonus` 的同名键直接相加（crit/attack/hit/penetrate/block/defense/dodge），这些键名与 `combat-stats.js` 的 `getDerivedCombatStats` 消费口同名 ⇒ **套装回响只在这套派生表被吃到**；若 `battle.js` 另有独立派生通路，这 10 档回响会不生效（**无法判定**：battle.js 归别的代理，本批未追）
  缺口 头注纪律③「零经济」成立，但 `combatBonus` 的键名 `hit`（命中）在套装里被当**加值**给出（问天三件 hit+10），而 `combat-stats.js:141` 的 `hit` 是**百分比并被 `_clamp(...,5,95)` 钳住** ⇒ 两处同名不同量纲，是否会被钳掉**无法判定**（取决于 `getCombatBonuses` 的合并顺序）

### js/extensions/（30 个）— 独立大系统扩展

- `js/extensions/authoring.js` :: v26.0 六路营生批（第一百五十一批 · 用户点单）· 著书立说账 · 用户点单：「我一身功法奇遇，想写成册子卖进书肆、传给徒弟、甚至故意写本错的祸害对头。 · 『立传』是系统替我写的，我自己动笔没有。」本账把笔递到玩家手里
  机制 416 行 · 混合（v26.0 六路营生批 · 著书立说账：选题→写书→评品→卖稿/赠书→伪经后果链）｜关键数据 `CFG` 28 常量（分数线 GRADE_AT=[40,70,100]、稿费 PAY_COPPER=[40,120,300]+神品 60 灵石、学识增益 SCHOL_GAIN=[1,2,3,5]、识破 FORGE_TRACE_P=0.30/误伤 0.55…）、`KINDS` 4 类选题（修行心得/功法注解/江湖行记/伪经）、`TITLES` 4 组候选书名、StateRegistry 'authoring' 3 键、`Authoring` 5 方法
  接口 `window.Authoring`（5）+ `openAuthoringDesk` / `growLifeSkill` / `getLifeSkill` / `getRealmTier` / `cityReputation` / `npcNotCoLocated` / `playerPushDeed` / `showBuildingEffectDialog` / `updateCurrencyUI`｜依赖 `NpcCrime`（书肆行会拉黑/永久黑名单）、`discipleState.sectKin`（亲传弟子真名单）、`currentSkills`（已学主修功法）、`skillPages`、RewardService、npcManager、WorldCalendar、StateRegistry｜事件：无
  缺口 `authoring.js:414 openAuthoringDesk` → 零引用死导出；真入口是 `Authoring` 命名空间（本文件唯一的 NS 出口），但 `Authoring` 的入口按钮由 bookshop.js 柜台守卫挂（头注自陈）
  缺口 口径：书是账不是物（稿本落 Authoring 账，不进物品注册表）——与 §0.2 物品库口径不同，需按本文件口径读
  缺口 回归红：`tests/v26.0-six-livelihoods-node.js` 4 条红（E33 落档至多两城、H9/H16 scripts.manifest 脚本数 341≠实测、H18 六本新账零空 catch）——本文件被该套点名，属 v26.0 批遗留
- `js/extensions/beast-ecosystem.js` :: beast-ecosystem.js - 灵兽生态·地图分布 (v19.12 P0) · 对标 v18.8 路线图 §7.2 灵兽生态 + §7.1 非战斗功能 + 修 BUG（尸体扑上来）。 · 10 灵兽 × 7 地区 × 多地形分布；6 类非战斗功能；统一 markEntityDead API
  机制 338 行 · 数据表 + 混合（按地貌分布刷兽 + 种系 buff + 埋点）｜关键数据 `BEAST_DISTRIBUTION` 19 条、`BEAST_BUFFS` 17 键、`BEAST_NAME_TO_ID` 44 条中文名→id 反查、`TEMPLATE_TO_ECO` 56 键模板→生态位、`TERRAIN_ALIASES` 6 键、StateRegistry 'beastEcosystem'、`BeastEcosystem` 16 方法
  接口 `window.BeastEcosystem`（16）+ 自身挂 `getCurrentCharData` / `isEntityDead` / `markEntityDead`｜依赖 `BEAST_TEMPLATES`、`BeastEvolution`、StateRegistry、`XianXia`、tamedBeasts、EventBus｜事件：★发 `beast:ecosystem:placed`(:154)、`beast:ecosystem:buffApplied`(:241)，**全仓零订阅者**
  缺口 ★发而无人听：`beast:ecosystem:placed` / `beast:ecosystem:buffApplied` 两个事件名在 js/ 内只有本文件 emit，无任何 `.on` → 事件总线单向（若原设计指望别处响应，此接线未完成）
  缺口 回归红：`tests/beast-ecosystem-node.js` 在 13 红名单内 → 本文件为该红唯一被点名对象
  缺口 `beast-ecosystem.js` 自行挂 `window.isEntityDead` / `window.markEntityDead` 两个全局口，而 `randomMap.js` 也导出同名 `isEntityDead` → 两文件抢同名全局（**无法判定**最终生效者）
- `js/extensions/beast-evolution.js` :: beast-evolution.js - 灵兽进化+受伤+变异 (v19.19) · 对标 v18.8 路线图 §7.2 灵兽生态：3 进化线 + 受伤/休养 + 变异/遗传
  机制 359 行 · 混合（进化线 + 伤势疗丹 + 血脉繁育 + 变异）｜关键数据 `EVOLUTION_LINES` 3 键、`PILL_HEAL` 3 键、`rareAttrs` 8 键、StateRegistry 'beastEvolution'、`BeastEvolution` 29 方法（本目录最多）
  接口 `window.BeastEvolution`（29）｜依赖 EventBus、StateRegistry、WorldCalendar、`XianXia`｜事件：★发 `beast:evolved`(:151) / `beast:healed`(:213) / `beast:mutated`(:252) / `beast:bred`(:280)，**四个全仓零订阅者**
  缺口 ★四个事件发而无人听（`beast:evolved/healed/mutated/bred`）——进化/疗伤/变异/繁育四条线的结果没有任何跨系统订阅者，日记/图鉴/传闻都没接
  缺口 `beast-evolution.js` 是本目录唯一不发 `beast:*` 生态位事件的文件，与 beast-ecosystem.js / beast-lore.js 之间**没有事件串联**（生态分布→进化→手记三本是各自独立跑）
- `js/extensions/beast-lore.js` :: beast-lore.js - 兽径手记·打听系统 (第八十七波) · 用户点账：灵兽图鉴的栖息地不该白给到「地区+地形」那么细——具体在哪，要靠打听得来， · 甚至有概率听到稀有的。于是把「知道」做成玩法： · 亲遇成识：野外真打了一场（不论胜负）→ 手记落一笔确讯（地区+地形）
  机制 162 行 · 数据表 + 混合（打听兽径：按地貌抽稀有种兽）｜关键数据 `TERRAIN_CN` 48 条地形中文名映射、`RARE_TEMPLATE_IDS` 7 种稀兽、StateRegistry 'beastLore'、`BeastLore` 12 方法
  接口 `window.BeastLore`（12）+ 自身挂 `getAbsoluteDay`｜依赖 `BEAST_TEMPLATES`、`BeastEcosystem`、StateRegistry、`XianXia`｜事件：无
  缺口 `beast-lore.js` 是 `js/extensions/` 里唯一不发任何 EventBus 事件、也不被 WorldLoop 日结调度的兽类文件 → 与 beast-ecosystem 的日结节奏不同步（**无法判定**是否有意：BeastLore 无 tickDay）
  缺口 `TERRAIN_CN` 48 键 vs `wild-terrain.js` 的 `TERRAIN` 25 键 —— 一本按中文名、一本按 key，两张地形表需人工对齐（无自动校验）
- `js/extensions/beast-tide.js` :: beast-tide.js - 兽潮世界事件 + 捕捉池 + 灵兽园 (v19.20) · 对标 v18.8 路线图 §7.2 末段：兽潮改变捕捉池 + 宗门可建兽园
  机制 327 行 · 混合（兽潮世界事件 + 捕捉池 + 灵兽园两个命名空间合一）｜关键数据 `TIDE_LEVELS` 10 档、`BASE_POOL` 10、`GARDEN_BUFF` 2 键、StateRegistry 'beastTide' / 'beastGarden'、`BeastTide` 15 方法 + `BeastGarden` 6 方法 + `BeastTideAndGarden` 15 方法（合并视图）
  接口 `window.BeastTide`（15）/ `window.BeastGarden`（6）/ `window.BeastTideAndGarden`（15）｜依赖 EventBus、StateRegistry、WorldCalendar、`XianXia`、currentCharData、inventory｜事件：发 `beast:tideStarted`/`beast:tideEnded`/`beast:gardenBuilt`/`beast:gardenRemoved`（经本文件私有 `_emit()` 包装 :38-42）
  缺口 ★`beast:tideStarted` / `beast:tideEnded` 有订阅者（`js/core/world-loop.js:369-370`），但 `beast:gardenBuilt` / `beast:gardenRemoved` **全仓零订阅者** → 灵兽园建成/拆除不进日历、不进日记、不进图鉴
  缺口 `BeastTideAndGarden` 与 `BeastTide` 15 个方法**逐一同名同形**（实测两个 NS 的方法名完全一致）→ 疑似合并视图的复制粘贴，未来改一处必漏另一处（**无法判定**是否刻意镜像）
  缺口 私有 `_emit()` 包装让静态 grep `EventBus.emit('X'` 扫不到这四本的发点 → 任何基于该写法的「死事件」审计都会误判（本次审计已修正口径）
- `js/extensions/biography.js` :: biography.js - v25.6 生平传记与称号（第一百四十八批 · 玩家心愿批） · 用户口径：「生平可以有，不过需要考虑性能，如果太耗性能建议默认关闭」。 · 性能答卷：本系统**零实时钩子**——不订阅任何事件、不挂任何每日 tick
  机制 228 行 · 混合（生平传记成书 + 称号阶梯 + 名声档）｜关键数据 `TITLES` 16 组成长称号、`getFameLevel` 名声档、`computeJianghuRank` 借 jianghu-rank 的望风榜口径｜`Biography` 7 方法
  接口 `window.Biography`（7）+ `openBiographyPanel` / `computeJianghuRank` / `getFameLevel` / `getRealmTier` / `showModal`｜依赖 `TravelJournal`、`WorldJournal`（章节与日志）、StateRegistry、esc、inventory、timeSystem｜事件：无
  缺口 `biography.js` 调 `computeJianghuRank` 但本目录 `jianghu-rank.js` 实测**没有 window 命名空间导出**（无 `window.JianghuRank`），需核对该名是否为裸函数 → 若非裸函数则 `computeJianghuRank` 是悬空引用（**无法判定**，未逐行追）
  缺口 `biography.js` 的 `TITLES` 16 条称号与 `jianghu-rank.js` 的 `PRODIGY_POOL` 12 条才俊池是两套「名」账，无交叉索引
- `js/extensions/cave-facilities.js` :: cave-facilities.js - 洞府设施 + 同伴 (v19.16 §10) · 对标 v18.8 路线图 §10：8 设施 + 4 档洞府槽位 + 道侣/弟子入住
  机制 295 行 · 数据表 + 混合（洞府 5 级 + 12 种设施 + 同伴 3 职 + 每日琐事）｜关键数据 `CAVE_LEVELS` 5 档、`FACILITIES` 12 种、`COMPANION_ROLES` 3、`DAILY_EVENTS` 7 组、`EMPTY_CAVE_EVENTS` 4 组、`CaveFacilities` 18 方法
  接口 `window.CaveFacilities`（18）+ 自身挂 `getAbsoluteDay`｜依赖 EventBus、StateRegistry、WorldCalendar、`XianXia`、timeSystem.onNewDaySubscribe｜事件：发 `cave:facilityInstalled`(:125) / `cave:companionAdded`(:153) / `cave:dailyEvent`(:200,:212) —— **三个全仓零订阅者**
  缺口 ★`cave:*` 三事件全仓零订阅 → 洞府建成设施/添同伴/每日琐事都不进 WorldJournal、不进图鉴（对比 beast:tideStarted 是接进 world-loop 的，同目录两套接线标准）
  缺口 `CaveFacilities.getBuff('player','qualityBoost')` 被 `crafting/forging-compound.js:216` 与 `alchemy-compound.js` 当作品质抬段真源读 —— 这是跨目录的隐式硬依赖（forging-compound 侧有 try/catch 兜底，缺了会静默不加段）
- `js/extensions/cave-life.js` :: cave-life.js - 洞府里的日子（第一百零六波） · 用户点账：「幻想自己是玩家，想在洞府里干各种事」——占山、修缮、安置都是账本， · 这一波让账本里长出日子：知己会登门、灵兽在院里打滚、晨昏各有山景，全记进起居注
  机制 244 行 · 混合（洞府日常：访客/灵茶/灵兽/同伴四组台词 + 灵蕴环境音）｜关键数据 `VISIT_LINES` 3 / `VISIT_TEA_LINES` 2 / `BEAST_LINES` 3 / `COMPANION_LINES` 3 / `AMBIENT_BY_LEY` 7 键（按灵蕴分环境）/ `AMBIENT_FALLBACK` 2 / `GIFT_POOL` 4 键、`CaveLife` 5 方法
  接口 `window.CaveLife`（5）+ 自身挂 `beastDisplayName` / `giveWithReceipt` / `addItemFailPhraseFor` / `getHouseSite` / `isAtHome` / `saveHouseData` / `_isInLongRetreat`｜依赖 `CaveFacilities`、`CaveReception`、WorldJournal、partySystem、tamedBeasts、npcManager、playerHouse、timeSystem.onNewDaySubscribe｜事件：订 `newDay`
  缺口 `cave-life.js:157` 注释自陈 DES-72 病灶（旧写法丢 addItem 返回值却照念「回赠了你一份 X」）已修 —— 但本文件仍自行挂 `window.addItemFailPhraseFor` / `window.giveWithReceipt` 两个全局转发口（正主在 inventory/building-effects）→ 同名全局覆盖风险
  缺口 `cave-life.js` 的洞府位置读 `getHouseSite` + `isAtHome` + `playerHouse`，而 `house-system.js` 的真源是 `CAVE_SITES` —— 洞府在野不在城的口径跨三本文件（**无法判定**是否存在双份位置真源）
- `js/extensions/cave-reception.js` :: cave-reception.js - v25.6 洞府会客 · 品茗论道（第一百四十八批 · 玩家心愿批） · 用户点单：「贵客登门，招待加风水换印象与机缘」。 · 与既有账的关系：知己登门的**触发与人选**照旧走 cave-life.js（好感≥60、客房/茶灶加成、起居注）
  机制 191 行 · 混合（会客：品茗论道 + 送礼好感 + 观相气）｜关键数据 `GIFT_POOL` 4 键、`AFF` 4 档好感、`CaveReception` 7 方法
  接口 `window.CaveReception`（7）+ 自身挂 `getFengshuiMul` / `giveWithReceipt` / `addItemFailPhraseFor` / `removeItem` / `showModal`｜依赖 `CaveFacilities`、`CaveLife`、WorldJournal、fengshui（`getFengshuiMul`）、npcManager、inventory/itemById、currentBattle 战斗闸｜事件：无
  缺口 `cave-reception.js` 直接调 `getFengshuiMul`（fengshui.js 无 window 命名空间导出，实测为裸函数）→ 跨文件裸函数调用，fengshui.js 加载顺序颠倒会 ReferenceError（本文件无 typeof 守卫）
  缺口 `cave-reception.js` 与 `cave-life.js` 都读 `_isInLongRetreat`（long-retreat.js 的裸全局）作入洞闸 —— 两处各判一次，无单一收口
- `js/extensions/cave-siege.js` :: cave-siege.js - v25.6 洞府守卫战（第一百四十八批 · 玩家心愿批） · 用户点单：「恶名太重、仇家太多时，夜里真的有人打上门」。 · 与宿敌寻仇（rivalry-chain，路上拦截单挑）分账：这一套是**打到家门口
  机制 220 行 · 混合（洞府守卫战：新日触发判定 + 真战斗 + 守库结算）｜关键数据 `_state` 4 键（StateRegistry 'caveSiege'）、`CaveSiege` 3 方法（maybeSiege/settle/state）
  接口 `window.CaveSiege`（3）+ 自身挂 `maybeCaveSiege` / `settleCaveSiege` / `addFame` / `getFengshuiReport` / `getRealmTier` / `getRivals` / `isAtHome` / `isInSoulState` / `playerPushDeed` / `removeItem`｜依赖 BeggarAlms、DataManager、StateRegistry、WorldJournal、npcManager、playerHouse、startBattle、currentBattle｜事件：★订 `newDay`（经 `timeSystem.onNewDaySubscribe`，非 EventBus）
  缺口 ★`cave-siege.js:212 window.CaveSiege` → 整个命名空间**全域零引用**（`CaveSiege` 这个名字只出现在定义处）⇒ `maybeSiege` / `settle` / `state` 三个出口全部不可达；真正在跑的是裸函数 `maybeCaveSiege`（:209 由新日订阅直接调）→ 疑似命名空间导出后忘了接线
  缺口 `cave-siege.js` 是 extensions 里唯一既发事件又订 newDay、但命名空间完全无人用的文件，与 `CaveFacilities`（18 方法全被 6 本文件引用）形成鲜明对比
- `js/extensions/codex-tutorial.js` :: codex-tutorial.js - 教程+图鉴+世界日志 (v19.17 §11) · 对标 v18.8 路线图 §11：7 步新手引导 + 6 类图鉴 + 世界大事记
  机制 325 行 · 混合（教程 7 步 + 图鉴 6 类 + 世界日志，三个命名空间）｜关键数据 `TUTORIAL_STEPS` 7 步、`CODEX_TYPES` 6 类、`KNOWLEDGE` 7 组、`CodexTutorial` 4 / `Codex` 7 / `WorldJournal` 6 方法、journal cap=100
  接口 `window.CodexTutorial`（4）/ `window.Codex`（7）/ `window.WorldJournal`（6）/ `openCodexPanel` / `openWorldJournalPanel` / `CODEX_KNOWLEDGE` / `codexHint`｜依赖 `LoreShelf`（残页册读野图账）、StateRegistry、WorldCalendar、EventBus｜事件：发 `codex:tutorialTriggered`(:63) / `codex:discovered`(:106) / `codex:seen`(:131) / `journal:recorded`(:149) —— **四个全仓零订阅者**
  缺口 ★`codex:*` 与 `journal:recorded` 四事件全仓零订阅 → 图鉴/日志的写入没有任何跨系统反应（**注意**：本文件自己就是这些事件的生产者与主要消费者，事件只作对外通告，无订阅不算功能缺失）
  缺口 `codex-tutorial.js:303 Codex.listTypes` → **全域零引用**（死导出；图鉴面板走 `getEntries`，分类筛选没做）
  缺口 `codex-tutorial.js:210` 注释自陈「此前 trigger 全库零调用——引导永远不弹」已修（现各系统首次动作打一发提示）——本批实测 `trigger` 已有外部调用，但仍是「每步只弹一次」的弱接线
- `js/extensions/dungeon-dynamic.js` :: dungeon-dynamic.js - 动态秘境 (v19.9 P1-6) · 对标 v18.8 路线图 §4 P1-6：8 个动态秘境模板 + 6 个流派解法 + 5~10 房事件池
  机制 305 行 · 数据表 + 混合（12 类秘境模板 + 8 类房间 + 每日生成）｜关键数据 `EVENT_TYPES` 6 类、`ROOM_TEMPLATES` 8、`DUNGEON_TEMPLATES` 12、`DungeonDynamic` 命名空间（含 tickDay/generateDaily）
  接口 `window.DungeonDynamic`｜依赖 EventBus、StateRegistry、WorldLoop（每日 generateDaily）、currentCharData｜事件：发 `dungeon:dynamic:enter`(:200) / `spawn`(:153) / `close`(:121) / `complete`(:243) / `leave`(:264) —— **五个全仓零订阅者**
  缺口 ★`dungeon:dynamic:*` 五个事件全仓零订阅 → 动态秘境的进入/刷怪/关闭/通关/离开都不进 WorldJournal 与日记（对比静态秘境有 `dungeon:completed` 被 quest 桥与 continue-save 消费，动态秘境这条线完全孤立）
  缺口 `DUNGEON_TEMPLATES` 12 条各带 puzzle/treasure/trap/chance/boss/combat 六类节点（实测各出现 8~11 次），但 `EVENT_TYPES` 只 6 类 —— 模板里用的节点类型多于表内枚举（**无法判定**是否有未声明类型靠裸字符串跑）
- `js/extensions/fengshui.js` :: fengshui.js — v25.5 风水布置（第一百四十七批 · 玩法立项批）
  机制 263 行 · 纯数据表 + 判定函数（洞府风水九宫）｜关键数据 `FENGSHUI_POSITIONS` 8 方位、`GRID_ORDER` 9 格、`ELEM_NAME`/`ELEM_GENERATES`/`ELEM_OVERCOMES` 三张五行生克表、`FENGSHUI_ITEMS` 5 摆件、`FURNITURE_ELEMENT` 家具五行表；无 window 命名空间，只导出裸函数 `getFengshuiMul` / `getFengshuiReport`
  接口 裸函数 `getFengshuiMul`（被 cave-reception / cave-siege / house-panel 调用）与 `getFengshuiReport`｜依赖 currentCharData、playerHouse 家具栏｜事件：无
  缺口 ★`fengshui.js` 是 extensions 里唯一**零 window 导出**的文件（实测 `window.X = {` 命中 0）→ 三个调用方都得按裸函数名硬调，加载顺序颠倒即 ReferenceError，且无 `typeof` 守卫
  缺口 用户铁律「不准五行相克」在 cultivation.js:922/1108 被明确标注，但本文件仍实现完整 `ELEM_OVERCOMES` 生克表并产出 `getFengshuiMul` 倍率 —— 只限洞府风水场景，与功法相克不是同一处（口径不冲突，但两处都在，容易被后续代理误读为违反铁律）
- `js/extensions/formation-system.js` :: formation-system.js - 阵法·布阵循环 (v19.7 P1-4) · 对标 v18.8 路线图 §4 P1-4：让"阵法"从文本/参悟变成有"布阵"这一核心动作的玩法。 · 4 类随身战阵 + 4 类洞府/宗门阵；阵旗耐久 + 灵石维持；StateRegistry v1 + 事件总线
  机制 390 行 · 数据表 + 混合（布阵→运转→崩溃循环 + 8 种阵法 + 8 类阵石）｜关键数据 `FORMATIONS` 8 套、`FORMATION_STONES` 8 种、`FormationSystem` 命名空间（含 deploy/withdraw/tick）
  接口 `window.FormationSystem` + 自身挂 `window.itemById`（转发口）｜依赖 itemById、inventory、currentCharData、EventBus、compound-ui.js（`_fmtDeploy`/`_fmtWithdraw` 由 UI 调）｜事件：发 `formation:deploy`(:187) / `formation:withdraw`(:204) / `formation:collapse`(:221,:232,:295,:339) —— **三个全仓零订阅者**
  缺口 ★`formation:*` 三事件发 6 处、零订阅 → 布阵/撤阵/崩阵不进日志与战报存档
  缺口 `formation-system.js` 自行挂 `window.itemById`（正主是 items.js / items-extended.js）→ 又一处同名全局覆盖；`puppet-system.js` / `talisman-advanced.js` 同样各挂一份（本目录 3 处 + crafting/compound-ui.js 1 处，共 4 份 `window.itemById` 转发）
  缺口 头注自陈（compound-ui.js:3）「三套整体死代码：洞府设施、阵法、傀儡（傀儡日结在跑，玩家却造不出第一只）」——本文件即阵法那一套，需与 compound-ui 的 `_fmtDeploy/_fmtWithdraw` 对读才知是否仍死（**无法判定**：实测 `_fmtDeploy`/`_fmtWithdraw` 有外部调用，非死）
- `js/extensions/jianghu-rank.js` :: jianghu-rank.js - v25.6 江湖望风榜（第一百四十八批 · 玩家心愿批） · 用户口径：「天骄可以有江湖中的口头排名，但不能有俸禄和离谱的榜单」。 · 所以这不是一张系统真榜——是茶馆酒肆口口相传的口头账： · 排名由说书人按「看得见的场面」估：境界、名气、杀戮、演武战绩、榜上胜负
  机制 242 行 · 数据表 + 渲染（江湖望风榜：按声望/境界/战绩排位）｜关键数据 `PRODIGY_POOL` 12 名才俊、`openJianghuRank` 入口；无 window 命名空间
  接口 `window.openJianghuRank`（1，被 teahouse-leisure.js 茶馆棋手页调）｜依赖 currentCharData、StateRegistry、timeSystem｜事件：无
  缺口 ★`jianghu-rank.js` 无 `window.JianghuRank` 命名空间，但 `biography.js` 调 `computeJianghuRank` —— 该名在本文件内**未见 window 挂载**（实测本文件 window 赋值 0 处，全为裸函数）⇒ 若 biography 的调用走裸函数则成立、走 window 则悬空（**无法判定**，需逐行核 biography 的调用形式）
  缺口 本文件与 biography.js、teahouse-leisure.js 三方互引，但只有 `openJianghuRank` 一个挂上了 window → 另两个方向靠裸函数隐式约定
- `js/extensions/market-dynamic.js` :: market-dynamic.js - 地区价格差+NPC需求+世界事件 (v19.11 P1-8) · 对标 v18.8 路线图 §4 P1-8：可理解的供需，不做股票模拟
  机制 284 行 · 数据表 + 判定函数（地区价格差 + NPC 需求 + 世界事件联动）｜关键数据 `CITIES` 6 大区、`CATEGORIES` 6 类、`CITY_BASE_BIAS` 6 键、`WORLD_EVENTS` 10 键、`NPC_NEEDS` 5 键、`MARKET_CITY_ALIAS` 12 键（中州/西荒/东海 别名归一）、`MarketDynamic` 命名空间
  接口 `window.MarketDynamic`（含 `priceMul` / `adjustFromTrade` / `npcNeed` / `tickDay`）｜依赖 WorldCalendar、EventBus、currentCharData｜事件：发 `market:priceChange`(:149) / `market:event:applied`(:131) / `market:npcNeed`(:236) —— **三个全仓零订阅者**
  缺口 ★三事件零订阅；且 `market:priceChange` 是全项目最该有订阅的一类（城望/传闻/货郎报价都该读）——street-life.js:74-89 的 `heartIntel` 是**轮询式**读 `MarketDynamic.priceMul` 而非订事件 ⇒ 事件总线在这条线上完全没用上
  缺口 `market-dynamic.js:153` 注释自陈「v23.2 adjustFromTrade 此前全库零调用——供需模型写好了没接线」已修（玩家买卖真动行情）；但三个事件仍是零订阅 ⇒ 接线只补了一半（**无法判定**是否有意不再用事件）
- `js/extensions/narrative-consequence.js` :: narrative-consequence.js - 事件后果接口 (v19.15 §9) · 对标 v18.8 路线图 §9：7 类长期状态接口 + 延迟反馈调度器
  机制 275 行 · 数据表 + 判定函数（世界旗 + 传闻 + NPC 关系的后果接口）｜关键数据 `APPLIERS` 7 个应用器、`worldFlag` 3 键、`rumor` 3 键、`npcRelation` 2 键、`futureEventWeight` 4 键、`NarrativeConsequence` 命名空间
  接口 `window.NarrativeConsequence`（processDay 由 WorldLoop 日结调）｜依赖 WorldCalendar、WorldJournal、StateRegistry、EventBus｜事件：发 `narrative:consequenceApplied`(:119) —— **零订阅者**
  缺口 `narrative:consequenceApplied` 零订阅 ⇒ 后果落账后无跨系统反应（传闻池/敌意信/声望都未订）
  缺口 `narrative-consequence.js` 是 extensions 里唯一以「接口」命名的文件（头注：事件后果接口 v19.15 §9），但它自带 `processDay` 日结钩子 → 名义是接口、实际是调度器，两种身份混在一本（**无法判定**是否有意）
- `js/extensions/player-sect-bootstrap.js` :: player-sect-bootstrap.js - 白手起家（立宗改造 · 从开局就能竖幡） · 此前自建宗门有两笔烂账：① 元婴修为 + 六百灵石山门才许立宗——可现实逻辑里，立派的成本是「敢竖幡」， · 不是修为；没建筑没名望，立的只是个空壳，没人会主动来投，这才是真实的世界
  机制 801 行 · 混合（白手起家改造：立宗前的城市认领 + 建筑/地脉 + 客卿雇工）｜关键数据 `CITY2REGION` 16 城→大区映射、`CLAIMS` 运行态、`STAGE_NAME` 3 阶（无名之地/有名之派/一方之宗）、裸函数口 `_psUpgradeHouse` / `_psDrive` / `_psOpenGuest` / `_psHire` / `_psFireGuest` + `sectBootstrapProbe`
  接口 挂 5 个 `window._ps*` 动作口（另 `_psDraftAlign`/`_psDraftSite` 在 player-sect-ui.js）+ 自订 `playerSect:created`(:782)｜依赖 PlayerSect、StateRegistry、WorldCalendar、npcManager、RewardService、timeSystem｜事件：★订 `playerSect:created`（本文件是订阅方之一）
  缺口 ★`player-sect-bootstrap.js:787 sectBootstrapProbe` → **全域零引用**（自陈为探针，唯一实测成立的死导出）；`:674 _psUpgradeHouse`/`:711 _psDrive`/`:717 _psOpenGuest`/`:748 _psHire`/`:754 _psFireGuest` 五枚 `window._ps*` 动作口虽无外部调用方，但**每个在本文件内有 2~5 次引用**（自身面板模板 + 定义）⇒ 接得上
  缺口 同名前缀 `_ps` 散口跨 3 个文件（bootstrap 5 + ui 14 + venture/world 的 `ps*`），全部**自驱型**（无外部调用方、内部模板点名）⇒ 整层 UI 接线在文件内闭合，但**没有任何一处能证明 venture/world 那两本的按钮接到了 ui 的面板上**（**无法判定**）
- `js/extensions/player-sect-life.js` :: player-sect-life.js - 第二十一波 · 弟子是活人（秘艺/派遣/日常/治丧） · 掌门评了四句苦：自家门没有镇山秘艺、弟子派不动、门内没有日子、病殁连场葬礼都没有。四句都接住： · 一 · 镇山秘艺：开山立门之后，掌门闭关创艺（宗库出碑刻抄经之资，一步两讫）
  机制 755 行 · 混合（弟子是活人：秘艺传授 + 派遣任务 + 日常互动 + 道侣羁绊）｜关键数据 `ART_KINDS` 6 类秘艺、`ART_UP_COST` 3 档、`MISSIONS` 3 类派遣、`ESCORT_HOUSES` 3 家护送镖局、`BOND_LADDER` 4 级羁绊、`discipleState.sectKin` 真名单
  接口 挂 `window._psTeach` 等动作口（在 player-sect-ui.js 侧）；本文件自订 `playerSect:discipleRecruited`(:728)｜依赖 npcManager（NPC 真数据）、StateRegistry、WorldCalendar、EventBus、timeSystem.onNewDaySubscribe｜事件：订 `playerSect:discipleRecruited`
  缺口 本文件 755 行**不挂任何 window 命名空间**（实测 `window.X = {` 命中 0），出口全是 `window._psXxx` 单函数；其中 `_psTeach`（player-sect-ui.js:514）等 14 个 UI 回调全域零引用（同 bootstrap 条目）
  缺口 秘艺/派遣/羁绊四本账的数据表齐（6/3/3/4），但**没有一张表声明这些弟子能力如何影响战斗或产出**——`MISSIONS` 只定义派遣种类，未见收益结算常量（**无法判定**收益是否走别的表）
- `js/extensions/player-sect-ui.js` :: player-sect-ui.js - 玩家宗门界面（v20.52） · 立派做庄：起自己的宗名、定阵营、择山门（山/城/水/漠/岛），立派当日各色人等上门。 · 宗门总册：资源产耗一目了然、政策随时切换、招收弟子、职位任命、宗门史
  机制 596 行 · 渲染层（玩家宗门面板：草稿/选址/招募/分配/授艺/毕业/解散七步）｜关键数据 `SITE_TERRAIN_TAG` 10 键、`NAME_POOL` 10 名、`RECRUIT_AFFECTION` 门槛、草稿态 `_draft`；挂 14 个 `window._ps*` 回调
  接口 14 个 `window._ps*`（`_psDraftAlign`/`_psDraftSite`/`_psSetPolicy`/`_psChooseSite`/`_psOpenRecruit`/`_psRecruit`/`_psOpenAssign`/`_psAssign`/`_psTeach`/`_psGraduate`/`_psDissolveAsk`/`_psDissolveCancel`/`_psDissolveConfirm`/`_psDissolve`）｜依赖 PlayerSect、npcManager、showModal、sect 系统｜事件：无
  缺口 ★14 个 `_ps*` 回调在 js/ 内**无外部调用方**，但每个在本文件内有 2~4 次引用（自身 `onclick` 模板 + 定义 + 转发）⇒ 面板七步是**自驱型**接线，不是悬空（初版扫描误判为「整体未接线」，已按自引用口径修正）
  缺口 14 个回调里 `_psDissolveAsk/Cancel/Confirm` 三段是同一个解散确认流程的三跳，若中间任一跳未接线则解散走不完（**无法判定**）
- `js/extensions/player-sect-venture.js` :: player-sect-venture.js - 第十八波 · 创业维艰（白手起家的日子） · 炼气散修立了幡，第二天醒来故事得接得上：住哪、吃什么、人从哪来、世界怎么看你。 · 纪律：不开新面板——所有内容长在既有界面上
  机制 914 行 · 混合（创业维艰：8 种营生 × 8 段里程 × 14 条动机）｜关键数据 `JOBS` 8 键、`MILES` 8 段、`WHY` 14 条动机文案、`PROPS` 3 类道具；本目录最长文件之一
  接口 挂 `window._psVenture*` 系列裸口（**未逐一核实命名空间**，实测本文件无 `window.X = {` 命名空间）｜依赖 PlayerSect、EconomyTransaction、MarketDynamic、npcManager、StateRegistry、timeSystem、currentBattle｜事件：无
  缺口 `WHY` 14 条动机文案是纯 flavor，未见任何判定读取它（实测 `WHY` 在本文件内只出现 1 次＝定义处）⇒ 14 条动机是**纯展示文本，无机制后果**（这是「有代码无接线」的最轻形态）
  缺口 本文件 914 行、`_ps*` 前缀散口与 bootstrap/ui 同族，但**没有一行挂 window 命名空间** ⇒ §0.2 总账看不出它对外暴露了什么
- `js/extensions/player-sect-world.js` :: player-sect-world.js - 第十七波 · 自建宗门四条线（第十九波添外交线） · 白手起家立起来的宗门，此前被挡在世界四条线外（第九波的保护性让路）：AI 不代它举幡、不代它花库银、 · 灭门册上不登它的名——保护是对的（AI 不能背着玩家行动），可保护成了绝缘：自建宗门在世界里没有下场
  机制 742 行 · 混合（自建宗门对外界：9 城驻扎 + 资源点争夺 + 声望外溢）｜关键数据 `CITIES` 9 城、`SOURCE_WORD` 词源表；自订 `playerSect:discipleRecruited`(:696)
  接口 挂 `window._psWorld*` 系列裸口（无 window 命名空间）｜依赖 PlayerSect、ResourcePoints、MarketDynamic、npcManager、StateRegistry、WorldCalendar｜事件：订 `playerSect:discipleRecruited`
  缺口 `CITIES` 9 城 vs `location-system.js` `cityData` 23 城、vs `market-dynamic.js` `CITIES` 6 大区 —— 三套城市枚举各不相同，`player-sect-world.js` 的 9 城靠 `CITY2REGION`（bootstrap 侧 16 键）折到大区 ⇒ 跨三本对齐，无自动校验
  缺口 `SOURCE_WORD` 表未见读取点（**无法判定**：可能只在本文件内拼文案用，需逐行核）
- `js/extensions/player-sect.js` :: player-sect.js - 玩家创宗 (v19.18) · 路线图 §13 第二阶段"掌门"完成：3 资源决策（扩张/内政/备战）
  机制 437 行 · 混合（创宗主账：资源/职位/政策/选址 + 事件通告）｜关键数据 `RESOURCE_TYPES` 5 键、`POSITIONS` 4 职、`POSITION_SLOTS` 4、`POLICIES` 3 键、`POLICY_DESC` 3、`FOUND_SITES` 5 处选址、`PlayerSect` 命名空间（含 create/dissolve/recruit/setPolicy/tickDay）
  接口 `window.PlayerSect`｜依赖 sect 数据（`sect-kin` 弟子账）、EventBus（私有 `_emit()` :54-58）、StateRegistry、WorldLoop（tickDay）、cultivation.js（面板互调）｜事件：发 `playerSect:created`(:101) / `dissolved`(:132) / `discipleRecruited`(:189) / `policyChanged`(:266) —— 前两个有订阅者（player-sect-bootstrap.js:782 / sect-war.js:711 / player-sect-life.js:728 / player-sect-world.js:696），后两个零订阅
  缺口 `playerSect:dissolved` / `playerSect:policyChanged` 两事件零订阅；另 `reincarnation:start` 由本文件发、被 player-sect.js:399 自订（跨文件同名前缀不一致：`reincarnation:*` 属 extensions/reincarnation.js，本文件只订不属）
  缺口 6 个 player-sect-* 文件里只有本文件挂 `window.PlayerSect` 命名空间，其余 5 个（bootstrap/life/ui/venture/world）全是裸 `window.xxx = function` 散口 → 命名空间口径不统一
- `js/extensions/puppet-system.js` :: puppet-system.js - 傀儡·玩家制造 (v19.8 P1-5) · 对标 v18.8 路线图 §4 P1-5：4 部件组装 8 类傀儡；4 类任务角色；制造/部署/召回循环
  机制 276 行 · 数据表 + 混合（傀儡制造 + 部署/召回 + 衰减日结）｜关键数据 `PARTS` 4 零件、`PUPPETS` 8 种、`PuppetSystem` 命名空间（含 tickDay）｜自身挂 `window.itemById` 转发口
  接口 `window.PuppetSystem`｜依赖 itemById、inventory、StateRegistry、EventBus、WorldLoop（tickDay）、currentCharData｜事件：发 `puppet:craft`(:163) / `deploy`(:182) / `recall`(:191,:216) / `decay`(:231) —— **四个全仓零订阅者**
  缺口 ★`crafting/compound-ui.js:3` 头注点名「三套整体死代码：洞府设施、阵法、傀儡（傀儡日结在跑，玩家却造不出第一只）」——但本文件 8 种傀儡 + 4 零件 + deploy/recall 齐全，且 compound-ui 的 `_pupCraft`/`_pupDeploy`/`_pupRecall`/`_pupRepair` 四个 UI 口实测**有外部调用**（在 ui 层）⇒ 该「死代码」结论或已过时，或指更早版本（**无法判定**）
  缺口 `puppet:*` 四事件零订阅 ⇒ 傀儡的四个生命周期节点不进日志
- `js/extensions/qiyu-encounters.js` :: qiyu-encounters.js — 奇遇（v20.94） · 行走江湖撞上的独一份机缘：十段奇遇，各有门槛（地点/境界/生活技能），各有两难取舍。 · 奖励走 RewardService 统一结算（灵石/铜钱/物品/长进/因果/声望），奇物全部自注册且打
  机制 564 行 · 数据表 + 事件桥（v20.94 奇遇：13 组奇遇 + 10 件奇遇物 + 24 条缘由 + 三档触发率）｜关键数据 `QIYU` 13 组、`QIYU_ITEMS` 10、`REASON_CN` 24、`CTX_CHANCE` 3 键、`getLuckChance` 全局概率口
  接口 挂 `window.QiyuEncounters` 相关裸口；★订 `location:visited`(:548)——本目录唯一把奇遇挂到进城事件上的文件｜依赖 npcManager、RewardService、StateRegistry、WorldJournal、randomMap（野外触发）｜事件：订 `location:visited`
  缺口 `qiyu-encounters.js:446` 注释自陈「v21.9 getLuckChance 通电：全局 API 此前定义了零调用方，这里内联重复了同款公式——现在统一走它」⇒ 修过一处同类病，但**没有全目录普查**（本批扫描在 extensions 内未再发现同类零引用，但 qiyu 自身 12 个出口的口径需逐个核）
  缺口 `REASON_CN` 24 条与 `QIYU` 13 组的映射关系未在文件内声明（**无法判定**是否一一对应）
- `js/extensions/reincarnation-integration.js` :: reincarnation-integration.js - 轮回集成 (v19.14) · v19.13 提供 API；v19.14 把 API 接入：onPlayerDeath → 模态 → applyInheritanceToNewLife → applyLegacyToNewWorld
  机制 320 行 · 混合（轮回 UI 集成：转世面板 + 属性挑选 + 遗产应用）｜关键数据 `nextLife` 占位构造（:159）、`ReincarnationIntegration` 命名空间；无大写常量表
  接口 `window.ReincarnationIntegration`｜依赖 `Reincarnation`、StateRegistry、EventBus、WorldJournal、currentCharData｜事件：发 `reincarnation:modalOpened`(:63,:70,:99) / `selectionChanged`(:145) / `confirmed`(:174) / `legacyApplied`(:249) —— **四个全仓零订阅者**
  缺口 ★五个事件零订阅；其中 `legacyApplied` 是「遗产真落账」的信号，本该是成就/传记/传闻的触发点（实测 biography / codex-tutorial 都不订）
  缺口 `reincarnation-integration.js` 与 `reincarnation.js` 的事件前缀同为 `reincarnation:` 但**发点分散两文件、订阅点只认 `start` 一个** ⇒ 事件命名空间被切成两半（**无法判定**是否有意分层）
- `js/extensions/reincarnation.js` :: reincarnation.js - 轮回/二周目 继承 (v19.13 §8) · 对标 v18.8 路线图 §8：6 类前世遗产点 + 5 类继承选择 + 世界连续性（前世传说留存）
  机制 242 行 · 数据表 + 判定函数（轮回/二周目继承）｜关键数据 `REALM_POINTS` 7 境、`SECT_POSITION_POINTS` 4 职、`DEATH_REASON_POINTS` 4 因、`INHERIT_OPTIONS` 5 项、`VALID_DEEDS` 10 种德；`Reincarnation` 命名空间
  接口 `window.Reincarnation`｜依赖 StateRegistry、EventBus（私有 `_emit()`）、currentCharData、game-state 重置链｜事件：发 `reincarnation:start`(:130) / `inherit`(:150) / `legacy`(:169) —— `start` 有订阅者（player-sect.js:399），`inherit`/`legacy` 零订阅
  缺口 `reincarnation:inherit` / `legacy` 两事件零订阅 ⇒ 继承与遗产落账后无跨系统反应
  缺口 ★与 `endgame/ascension-epilogue.js:101` 的注释冲突需并读：后者自陈「此前转世积分表里 'ascend'(+50) 是死代码——全库没有任何路径写入 lastDeathReason='ascend'」⇒ **本文件的 `DEATH_REASON_POINTS` 4 键里若有 `ascend`，那一档至今拿不到**（**无法判定**：需逐键核 `DEATH_REASON_POINTS`，本次只实测 4 键）
- `js/extensions/resource-points.js` :: resource-points.js - 灵脉/矿脉/药园 地图实体 (v19.10 P1-7) · 对标 v18.8 路线图 §4 P1-7：30 个资源点 + 占领 + 产出 + 衰减 + 恢复
  机制 216 行 · 数据表 + 混合（灵脉/矿脉/药园地图实体 + 争夺 + 产出）｜关键数据 `INITIAL_POINTS` 30 处、`ResourcePoints` 命名空间（含 claim/attack/tickDay/resolve）
  接口 `window.ResourcePoints`｜依赖 EventBus、StateRegistry、WorldLoop（tickDay）、randomMap（地图脉眼）、spirit-vein（迁脉折价）｜事件：发 `resourcePoint:claim`(:91,:151) / `ownerChange`(:92,:112,:152) / `attack`(:111,:116) / `yield`(:129) / `recovered`(:170) —— **五个全仓零订阅者**
  缺口 ★五事件零订阅 ⇒ 灵脉易主/被夺/产出/恢复都不进日志与传闻（city-facilities / reputation 两本都没订）
  缺口 `resource-points.js:134` 注释自陈「此前 claim/attack 全库零调用——「占领」是死账，无主产地永远无主」已修；但**五个事件至今仍零订阅** ⇒ 只补了功能没补事件接线（与 market-dynamic 同款半修）
- `js/extensions/root-refine.js` :: root-refine.js — v20.16 重塑灵根（后天改命线） · 玩家服用重塑灵根丹 → 本命主根占比 +6，其余五行按比例摊薄，饼总和恒 100（族谱 _pieRoots 同一把尺）。 · 设计宪法
  机制 104 行 · 判定函数 + 渲染（v20.16 重塑灵根：后天改命线）｜无大写常量表、无 window 命名空间；只导出裸函数（重塑入口 + 成功率判定）
  接口 裸函数口（**未挂 window 命名空间**，实测 `window.X = {` 命中 0）｜依赖 DataManager、getLifeSkill、currentCharData、showModal、timeSystem｜事件：无
  缺口 本目录最小的文件（104 行），却是唯一完全不挂 window 命名空间的判定文件之一 → 调用方只能裸调，加载顺序敏感
  缺口 重塑灵根属「不可逆大改」类操作，但本文件 104 行内未见任何存档迁移/StateRegistry 注册（**无法判定**：可能由 game-state 统一处理）
- `js/extensions/talisman-advanced.js` :: talisman-advanced.js - 高级符箓 (v19.6 P1-3) · 对标 v18.8 路线图 §4 P1-3：让"高级符"从锁定状态变成可制作、可使用的真实玩法
  机制 301 行 · 数据表 + 判定函数（v19.6 高级符箓 15 种）｜关键数据 `ADVANCED_TALISMANS` 15 种（含 category/quality/level/price/effect）、`TalismanAdvanced` 命名空间（getAdvState/getState/listByCategory）｜自身挂 `window.itemById` 转发口
  接口 `window.TalismanAdvanced` + `window.XianXia.TalismanAdvanced`｜依赖 itemById、inventory、StateRegistry、EventBus｜事件：发 `talisman:advanced:apply`(:176) / `talisman:advanced:sect`(:113) —— **两个全仓零订阅者**
  缺口 `talisman-advanced.js:288 listByCategory` → **全域零引用**（死导出）；另有 **三份一字不差的 `return _advState`**：:227（`TS.getAdvState`）、:285（`getAdvState`）、:286（`getState`）⇒ 同一份状态三个出口，其中 `getState` 无外部调用方（**无法判定**是有意别名还是残留）
  缺口 `talisman-advanced.js` 与 `gameplay/talisman-system.js` 是两套并行的符箓系统（一套 15 种高级符、一套 461 行的状态/战斗符）⇒ 同名概念两本账（**无法判定**分工边界）

### js/factions/（3 个）— 势力

- `js/factions/faction-invasion.js` :: enemy-invasion.js - 敌对势力主动入侵系统 · 依赖：factions.js
  机制 43 行 · 纯接线（新日订阅势力入侵判定）｜无数据表；挂 3 个 window 全局（`checkEnemyInvasion` / `openBattleWithEntity` / `realmScaledEnemyLevel`）——三个都是从别处转发
  接口 `window.checkEnemyInvasion` / `window.openBattleWithEntity` / `window.realmScaledEnemyLevel`｜依赖 `FACTIONS`、`BALANCE_CONFIG`、`PlayerProtectionService`、currentCharData、EventBus｜事件：★订 `newDay`
  ★缺口 本文件 43 行、0 张数据表、3 个导出全是**转发口**（正主在 battle.js / factions.js）⇒ 它的唯一独立逻辑就是那句 `timeSystem`/`EventBus` 的 newDay 订阅 + 一次 `checkEnemyInvasion()` 调用；把它当「势力入侵系统」读会高估内容量（**无法判定**订阅用的是 EventBus 还是 timeSystem：REFS 里有 EventBus 但 emit 名单为空）
  缺口 `realmScaledEnemyLevel` 与 `openBattleWithEntity` 的同名口在 `gameplay/arena-system.js`、`map/randomMap.js` 也各挂一份 ⇒ **同名全局三处以上**
- `js/factions/faction-stance.js` :: faction-stance.js - 势力立场博弈系统 · 加入一个势力降低对立势力声望、声望变化触发任务、多势力斡旋 · 依赖：factions.js
  机制 53 行 · 数据表 + 判定函数（势力立场：入势力时选一个立场，加成不同）｜关键数据 `FACTION_STANCES` **5 键**；挂 3 个 window 全局（`FACTION_STANCES` / `joinFactionWithStance` / `resolveFactionKey`）
  接口 `window.FACTION_STANCES`（5 立场表）/ `window.joinFactionWithStance` / `window.resolveFactionKey`｜依赖 `FACTIONS`、`factionIdByName`、`changeFactionReputation`、showMessage｜事件：无
  缺口 `FACTION_STANCES` 与 `FACTIONS`（5 个势力）数目相同但语义不同（一个是势力、一个是立场）⇒ 命名极易误读为同一张表
  缺口 本文件 53 行，`resolveFactionKey` 与 `factions.js` 导出的同名函数重复 ⇒ **同名覆盖**（**无法判定**谁赢）
  缺口 立场加成没有独立数值表（`FACTION_STANCES` 只有 id/name），倍率写在别处或根本没写（**无法判定**：本批未逐键追）
- `js/factions/factions.js` :: factions.js - 敌对势力系统 v1.0 · 魔教、妖族、势力声望、冲突
  机制 332 行 · 数据表 + 判定函数 + 持久化（势力系统：5 大势力 × 3 阶职位 × 8 级声望 + 5 类任务 + 12 组冲突）｜关键数据 `FACTIONS` **5 键**、`FACTION_RANKS` **3 键**、`FACTION_REPUTATION_LEVELS` **8 档**、`SECT_TYPE_FACTION` 6 键（哪 6 个门派算势力）、`FACTION_ID_BY_NAME` 运行期反查、冲突对象在 `triggerFactionConflict`(:231) 内**现造**（无持久化冲突表）、`missionTypes` **5 类**（暗杀/收集/侦察/护送/破坏）、存档键 `xianxia_factions`
  接口 16 个 window 全局（`FACTIONS` / `FACTION_RANKS` / `FACTION_REPUTATION_LEVELS` / `SECT_TYPE_FACTION` / `factionState` / `initFactionSystem` / `changeFactionReputation` / `getFactionReputationLevel` / `getFactionDiscount` / `generateFactionMission` / `triggerFactionConflict` / `participateInConflict` / `factionIdByName` / `factionIdOfSect` / `resolveFactionKey` …）｜依赖 `sectsData`（把 6 个门派当势力）、saveToStorage、gameLog、timeSystem｜事件：无（`triggerFactionConflict` 被 `world-events.js` 调）
  缺口 ★本文件直接写 `localStorage('xianxia_factions')`，而 factions/ 目录外的绝大多数模块已迁到 StateRegistry ⇒ 存档口径落后一代（与 quest/choice-memory、cultivation.js 熟练度同款病灶）
  缺口 `resolveFactionKey` 与 `faction-stance.js:47` 的同名函数重复 ⇒ **同名覆盖**（**无法判定**谁赢）
  缺口 冲突表**不落档**（`var conflict = {...}` 是函数内局部字面量，:231），而 `factionState`（4 键）是唯一入档的势力账 ⇒ 冲突进行到一半读档即丢（**无法判定**是否有意）

### js/gameplay/（3 个）— 玩法（竞技场 / 符箓 / 庇护）

- `js/gameplay/arena-system.js` :: arena-system.js — 竞技场闭环（从 app.js 拆出） · 负责入场成本、真实战斗结算、奖励封顶、排行与任务事件。
  机制 168 行 · 混合（竞技场：随机对手 + 排名持久化 + 胜负结算 + 统一交易扣费）｜关键数据 `ranking` 运行态、存档键 `xianxia_arena_ranking`、`_onArenaBattleEnd` 战斗回调；导出 14 个 window 全局
  接口 `window.ArenaSystem` + `window.enterArena` / `generateRandomEnemy` / `saveArenaRanking` / `showArenaRanking` / `realmScaledEnemyLevel` / `openBattleWithEntity` / `_onArenaBattleEnd` / `advanceTime`｜依赖 `EconomyTransaction`、`BALANCE_CONFIG`、EventBus、discipleState、saveToStorage、gameTime、inventory、timeSystem｜事件：★发 `arena:won`(:49)
  缺口 `arena:won` 的**唯一订阅者是 `js/npcs/jealousy-collective-node`（npcs/jealousy-collective.js:627）**；quest 事件桥也订它（批量注册）⇒ 一个事件两个语义消费方（排名推进 vs 任务目标），耦合可接受但需知会
  缺口 本文件 `realmScaledEnemyLevel` / `openBattleWithEntity` 与 factions/faction-invasion.js、map/randomMap.js 三处同名 ⇒ 同名覆盖链
  缺口 排名落 `localStorage('xianxia_arena_ranking')` 直写，未走 StateRegistry ⇒ 与 quest/choice-memory、factions、cultivation 熟练度同款存档口径落后问题（**同一批病灶，至少 5 处**）
- `js/gameplay/protection-system.js` :: protection-system.js — 玩家庇护状态 · 庇护期限只使用游戏分钟，状态可存档；到期由 GameScheduler 处理，读取时再做一次惰性校验。
  机制 95 行 · 混合（玩家保护期：新角色/转世后的免打扰窗口）｜`api` 6 方法、StateRegistry 'playerProtection'；导出 2 个 window 全局（`PlayerProtectionService` / `playerProtectionState`）
  接口 `window.PlayerProtectionService`（6 方法）+ `window.playerProtectionState`｜依赖 GameScheduler、StateRegistry、timeSystem、`XianXia`｜事件：无
  缺口 `playerProtectionState` 是运行态却挂 window（可被外部改写）；而 `PlayerProtectionService` 是被 `factions/faction-invasion.js` 读的硬依赖（势力入侵要查保护期）
  缺口 本文件 95 行只被 1 个文件读（faction-invasion.js），覆盖面极窄（**无法判定**是否本该被更多系统读：castle/sects 侧未见引用）
- `js/gameplay/talisman-system.js` :: talisman-system.js — 符箓效果边界（v12.1 / v21.9 全线实装） · v21.9：17 张 implemented:false 的符箓与门派特产陷阱/毒药全部接上真实效果 · 攻击符直伤敌人、定身/冰封让敌人跳过回合、沉默封技、隐身强制闪避、破甲加穿透、
  机制 461 行 · 状态机 + 判定函数（符箓系统：单张 13 字段战斗态账 + 18 方法战斗内消费，v21.9 把 17 张 `implemented:false` 的符箓与门派特产陷阱/毒药全部接上真实效果）｜关键数据 `state` **13 字段**（combatBonuses/bonusActionsLeft/shield/escapeBonus/enemySkipTurns/enemySilenceTurns/enemyPoison/enemyBlindTurns/invisHits/penetrateBonus/penetrateTurns/reviveCharges/divineHits，其中 v21.9 新增 6 项）、`api` **18 方法**；导出 9 个 window 全局
  接口 `window.TalismanSystem`（18）+ `window.XianXia.TalismanSystem` + 自身挂 `closeBattle`/`closeInteraction`/`getCurrentCharData`/`restoreBodyDurability`/`showMessage`/`updateBattleUI`/`updateCharacterStatus`｜依赖 `StateRegistry`、`currentBattle`、`statusEffectManager`｜事件：无
  缺口 ★`state` 是单张 13 字段运行态表，**无持久化注册**（本文件 REFS 里没有 StateRegistry/register）⇒ 战斗中的符箓状态随战斗对象生灭，不入档（设计如此，但与 `QuestRegistry`/`game-state` 的存档口径不同层）
  缺口 与 `extensions/talisman-advanced.js`（15 种高级符）是两套并行符箓系统（**无法判定**分工）
  缺口 本文件自行挂 `window.closeBattle` / `closeInteraction` / `updateBattleUI` 三个战斗口转发（正主在 battle.js / app.js）⇒ 同名覆盖
  缺口 本文件消费 `statusEffectManager`（status-effects.js 的管理器），而 `extensions/talisman-advanced.js` 另走自己的 `effect` 结构 ⇒ 符箓效果有两条进战斗的通路

### js/items-extended/（18 个）— 扩展物品库子文件

- `js/items-extended/01-pills.js` :: 扩展物品 - 丹药类（45种） · 加载到 window.extendedPills, extendedBuffPills, extendedPermPills, extendedSpecialPills
  - **机制摘要**（71 行 / 13.2 KB · 纯数据表，无逻辑）**6 张表**（实测条目数）：
    `extendedPills` **21**（恢复类，头注写 15 种）· `extendedBreakthroughPills` **9** · `extendedPermPills` **12**
    · `extendedSpecialPills` **7** · `extendedMedicalItems` **2** · `extendedBuffPills` **★0（空对象）**。
    合计 **51 条**（头注写「丹药类（45 种）」，实测多 6）。每条形状：`{id,name,type:'consumable',subtype:'pill',
    category:'consumable',quality:'PIN9'..'PIN5',level,price,effect:{hp|qi|energy_recovery:N},stackable,maxStack,desc,icon}`。
    品级实测只用 PIN9/PIN8/PIN7/PIN5 四档（**PIN6/PIN4/PIN2/PIN1 在丹药里一条都没有**）。
    注册由 `js/items-extended.js` 统一并进 `itemById`/`allItems`。
  - **缺口** ★①**`extendedBuffPills` 是一条空表**：实测 `typeof === 'object'`、键数 **0**，
    而 L2 头注明确把它列为本文件产物之一（「加载到 window.extendedPills, **extendedBuffPills**,
    extendedPermPills, extendedSpecialPills」）⇒ **「增益丹」这一档建了表、没填任何一条**，
    且全 16 张 extended 表里**只有它一条是空的**（实测 `extended_empty_tables` 仅此一项）。
    ②`food_immortal_tea` 同类道具在 07-food 里带 `mood_boost` 字段，而本文件 5 张表**没有任何
    丹药提供增益类效果** ⇒ 「增益丹」缺位的后果落到了 buff 丹药上（**无法判定**原计划是哪几条）。
    ③**品级跳档**：`level` 与 `price` 是手抄的两列，无公式、无区间校验；实测同 `PIN9` 档里
    `pill_nine_revival` 是 `level:10 / price:300`（`maxStack` 也从 99 降到 50），
    与 `PIN9` 的其它 86 条（level 1-2 / price 10-20）不在一个量级 ⇒ 玩家无法靠品级预期价格。
- `js/items-extended/02-weapons.js` :: 扩展物品 - 武器类（58种，含琴类6种） · 加载到 window.extendedWeapons · special字段已全部移除，效果合并到attrs/combatBonus/damageType/weight
  - **机制摘要**（78 行 / 20.7 KB · 纯数据表）`window.extendedWeapons` 实测 **59 条**（头注写「58 种，含琴类6 种」，
    实测 59）。全部 `slot:'mainHand'`、`type:'equipment'`、`category:'equipment'`（实测 `slot_dist` 只有
    `extendedWeapons:mainHand = 59` 一项）。L3 注明「special 字段已全部移除，效果合并到
    attrs/combatBonus/damageType/weight」。每条形状：`{id,name,subtype,slot,quality,level,price,
    attrs:{strength,dexterity,intelligence,constitution,willpower…},combatBonus:{attack,hit,crit,…},
    damageType:'slash'|'pierce'|'blunt'…,weight,…}`。分节注释：剑类 20 / （刀/枪/弓…）/ 琴类。
  - **缺口** ★①**头注「58 种」与实测 59 差 1**，且分节注释「剑类（20 种）」与实测逐条不符
    （`wpn_wooden_sword` 起 15 条连续剑类，之后插琴类 ⇒ 剑类实际不止 20，**无法判定**精确分类数，
    需按 `subtype` 逐条统计，本批未做）。
    ②**59 件武器全部是单手主武器**：实测 `slot` 只有一个值，**没有双手/副手/弓专用槽**
    ⇒ `02` 里的「琴类 6 种」与弓类都得塞进 `mainHand`，而 `battle.js` 的攻击/射程是否按
    `damageType`/`subtype` 分道（**未核 battle.js，本批回填**）。
    ③`attrs` 用的属性名（strength/dexterity/intelligence/constitution/willpower）与
    `03-armor.js` 同族，但与 `core/soul-state.js:186` 的 `attrs`（灵根五系）**同名不同义**
    ⇒ 全仓 `attrs` 一词三义（已记档，见 state-registry 条目的 `deviation` 同款命名冲突）。
    ④**无 `implemented` 标记**：本批实测 `allItems` 538 条内**无重复 id**、`itemById` 576 键、
    `dup_defs_in_allItems` 为空 ⇒ 本表内部干净；与 `10-crafting-extensions.js:129` 用到的
    `result.implemented !== false` 过滤口径**不一致**（本表不设该字段 ⇒ 恒视为已实装）。
- `js/items-extended/03-armor.js` :: 扩展物品 - 防具类（55种） · 加载到 window.extendedArmor · special字段已全部移除，效果合并到attrs/combatBonus/defense/resistance/speed
  - **机制摘要**（78 行 / 22.2 KB · 纯数据表）`window.extendedArmor` 实测 **56 条**（头注写「55 种」，
    实测 56）。L3 注明「special 字段已全部移除，效果合并到 attrs/combatBonus/defense/resistance/speed」。
    **实测槽位分布（12 个槽）**：`body` 13 · `head` 9 · `feet` 8 · `waist` 7 · `hands` 6 · `neck` 3 ·
    `offHand` 3 · `ring1` 2 · `ring2` 2 · `acc1` 2 · `acc2` 1（head 里含 `subtype:'hat'` 4 顶与 `'crown'` 5 顶）。
    每条形状：`{id,name,subtype,slot,quality,level,price,attrs:{…},defense,resistance:{slash,pierce,blunt,…},speed,…}`。
  - **缺口** ★①`ring1`/`ring2` 各 2 件、`acc1` 2 件、`acc2` **仅 1 件** ⇒ 饰品槽是**12 槽**里的 4 个，
    而 `17-lead-tokens.js` 把 36 枚主角信物**全部塞进 `acc2`**（单槽）⇒ 36 件争夺 1 个槽位，
    且 `acc2` 全表只有 2 件候选（含信物）⇒ 「人手一件」在数值上与槽位数严重不匹配（记档）。
    ②**头注「55 种」与实测 56 差 1**，同02-weapons 的同类偏差。
    ③`subtype` 有 `hat`/`crown` 两种但都进 `head` 槽 ⇒ 头盔**没有**品质/类别门槛，
    玩家可混穿（**无法判定**是否有意）。
    ④`resistance` 的键是 `slash`/`pierce`/`blunt`（伤害类型），
    而 `core/soul-state.js` 判要害用 `head/neck/chest/brain`、`battle.js` 用 `BODY_PARTS`——
    两套命名空间不同源（battle.js 本批未核，回填）。
- `js/items-extended/04-materials.js` :: 扩展物品 - 材料类（50种） · 加载到 window.extendedMaterials
  - **机制摘要**（63 行 / 11.3 KB · 纯数据表）`window.extendedMaterials` 实测 **87 条**
    （头注写「材料类（50 种）」⇒ **实测多 37**）。原因已定位：`13-missing-ids.js` 与 `16-dangling-ids.js`
    在加载时**直接 push 进同一个 `extendedMaterials`**（`16-dangling-ids.js:78`
    `if (it.type === 'material' && window.extendedMaterials) window.extendedMaterials.push(it)`，
    `13-missing-ids.js` 的 `register()` 同款），⇒ **本表不是封闭表，加载后期被别的文件续写**。
    分节：矿石/金属 14 种（头注）· （其余节）。每条形状：
    `{id,name,type:'material',subtype:'metal'|…,category:'material',quality,level,price,stackable,maxStack,desc,icon}`
    ——`maxStack` 分三档：999（普通）/ 500-200（稀有）/ 100（陨铁）。
  - **缺口** ★①**头注 50 vs 实测 87**，且**无法从本文件看出差额来自谁** —— 差额由 `13`/`16` 两个
    文件在运行期 push 造成，静态读本文件只会数到 50 左右 ⇒ **文档按文件计数必然失真**，
    跨文件追加没有登记机制（记档，本条实测 87 是运行时值）。
    ②`subtype:'metal'` 被塞进「火晶/寒铁/秘银」等**非金属**材料（L12-14）
    ⇒ `subtype` 只表达「可锻造」而非元素（火/水/金属），而 `elements` 字段在
    `06-arts.js` 里才出现 ⇒ **两套元素标注并存**（**无法判定**哪套被锻造配方读，未逐处核）。
    ③本表**没有** `implemented` 标记，而 `10-crafting-extensions.js:127-130` 会按
    `result.implemented !== false` 过滤配方结果 ⇒ 未实装的材料若被配方引用，会被静默剔除配方
    （该文件自己会打日志计数，实测 `talismanRecipes` 20 条）。
- `js/items-extended/05-talismans.js` :: 扩展物品 - 符箓类（21种） · 加载到 window.extendedTalismans · 攻击符沿用 items.js 的唯一定义；护身符/净化符/遁逃符/传送符为首批实装
  - **机制摘要**（31 行 / 6.5 KB · 纯数据表 + 接线说明）`window.extendedTalismans` 实测 **22 条**
    （头注写「21 种」，实测 22）。L3-4 是关键的**接线宪法**：「攻击符沿用 `items.js` 的唯一定义；
    护身符/净化符/遁逃符/传送符为首批实装」「v21.9：其余符箓全部实装——真实效果接在
    `gameplay/talisman-system.js`（攻击/控制/护体/复活/乾坤）」。
    每条形状：`{id:'tal_*',name,type:'consumable',subtype:'talisman',category:'consumable',quality,level,price,
    effect:{attack_damage:N, element:'fire'|'ice'|'wind'|'thunder', duration:N, defense_boost, speed_boost,
    invisibility:N,…},stackable,maxStack,desc,icon,implemented?}`。
  - **缺口** ★①**「效果接在 talisman-system.js」这条宪法无法在本文件验证**：22 条符箓的 `effect` 键
    共出现 `attack_damage`/`defense_boost`/`speed_boost`/`invisibility`/`duration`/`element` 等，
    但**是否每个键在 `gameplay/talisman-system.js` 里都有实现**（**未核**，那属 extensions/ 段，
    且 `talisman-system.js` 与 `talisman-advanced.js` 两本可能只有一本在跑）
    ⇒ 实测 15 个 `tal_*` 新 id（`tal_burst`/`tal_bind_soul`/`tal_armor_break_v2`/…）**只进了 `itemById`、
    不在 `allItems`**（见批次汇总），说明它们的注册路径与本表不同。
    ②本文件声明「攻击符沿用 items.js 的唯一定义」⇒ **`items.js` 里应另有 `tal_fireball` 等条目**，
    而本表 L8 起又从 `tal_fireball` 开始重列 ⇒ 「唯一定义」与本表重复登记**同时存在**
    （`dup_defs_in_allItems` 实测为空，说明是「后注册的没覆盖前者」而非双写，**无法判定**哪个是权威）。
    ③头注「21 种」vs 实测 22，同02/03 的 +1 偏差族。
- `js/items-extended/06-arts.js` :: 扩展物品 - 功法秘籍类（47种） · 加载到 window.extendedArts
  - **机制摘要**（62 行 / 13.1 KB · 纯数据表）`window.extendedArts` 实测 **49 条**
    （头注写「47 种」，实测 49）。分节：内功心法 13 种（头注）· （外功/轻功/绝技…）。每条形状：
    `{id:'art_*'|'secret_*',name,type:'secret_art',subtype:'internal'|…,category:'secret_art',quality,level,price,
    effect:{qi_regen_boost,max_qi_boost,hp_regen_boost,fire|ice|wood|earth|metal|water_damage_boost,all_attr_boost,…},
    desc,icon,elements:{neutral:1.0}|{water:1.0}|{fire:1.0}|…}`。
    **★这张表是 `core/knowledge-system.js` 的上游**：`MANUAL_TO_SKILL` 的 54 个键里
    17 本内功/身法秘籍取自此表（如 `art_breathing`/`art_qi_condense`/`art_hun_yuan`/`art_ice_heart`…）。
  - **缺口** ★①**`elements` 是第三套元素标注**（本表用 `elements:{five-element}`、
    `04-materials.js` 用 `subtype:'metal'`、`battle.js` 用 `damageType:'slash'`）
    ⇒ 同一条 `art_fire_heart` 同时有 `effect.fire_damage_boost` 与 `elements.fire` 两处元素信息，
    `cultivation/art-effects.js:31/59/153` 读的是 `MANUAL_TO_SKILL` 反查（本批未核它读哪个键，
    **无法判定**哪套是权威）。
    ②头注「47 种」vs 实测 49（同 +1/+2 偏差族）。
    ③**本表与 `13-missing-ids.js:306` 的 `register(missingArts)` 并行追加** ⇒ 与 04 同样的
    「文件不是封闭表」问题；实测 `dup_ids_within_extended` 为空 ⇒ 当前无冲突。
- `js/items-extended/07-food.js` :: 扩展物品 - 食物/饮品（12种） · 加载到 window.extendedFood
  - **机制摘要**（17 行 / 3.3 KB · 纯数据表）`window.extendedFood` 实测 **35 条**
    （头注写「食物/饮品（12 种）」⇒ **实测多 23**，差额来自 `13-missing-ids.js` 运行期 push；
    该文件自己的 `_missingItemsB2.food` 就是补料表）。每条形状：
    `{id:'food_*',name,type:'consumable',subtype:'food',category:'consumable',quality,level,price,
    effect:{energy_recovery,hp_recovery,qi_recovery,mood_boost,all_attr_permanent,full_recovery},
    stackable,maxStack,desc,icon}`。
    ★**这张表是 `core/satiety.js` 的唯一食物来源**：`satiety.js` 头注写「食物是『点击→固定数值直加』」，
    而 `inventory.js:414-452` 的用食流程先过 `isFasting`/`canEat` 双闸、再按 `subtype==='pill'`
    判辟谷丹 ⇒ 食物**不吃饱食度**（`MEAL_GAIN` 来自 `city-facilities/eatery.js` 的下馆子与
    `npcs/npc-bond.js` 的款待），本表 35 条都只给 `energy/hp/qi/mood`。
  - **缺口** ★①**35 条食物全部不产饱食度** —— `effect` 里没有任何 `satiety`/`full` 类字段，
    而 `core/satiety.js` 头注列的病是「狂吃零代价」；实测**吃药/吃食都不会动 `_satiety`**，
    饱食度只由「下馆子」与「NPC 款待」两条入口掉 ⇒ **野外买干粮当饭吃这条最常见的路仍然零代价**
    （**疑似**设计如此，但与 satiety 的立意直接冲突；`satiety.js` 条目里也没提这一层）。
    ②`food_peach`（蟠桃）的 `effect` 是 `{all_attr_permanent:1, full_recovery:true}`
    —— `all_attr_permanent` 与 `full_recovery` **两个键全仓是否被 `inventory.js` 的 useItem
    消费**（**无法判定**，inventory.js 本批才做，会回填）；若未被消费，蟠桃只值 500 灵石的普通口粮。
    ★③`food_immortal_tea` 与 `food_thousand_wine` 带 `mood_boost`（+10 / +30）⇒ **心境的两条食物写入方**
    在本表（另两条写入方见 `mood-system.js` 条目），而 `core/mood-system.js` 的日常回落是每天 -2
    ⇒ 一杯仙露茶（+10）要 5 天回本（记档）。
    ④头注「12 种」vs 实测 35（同 04 的跨文件追加病灶）。
- `js/items-extended/08-special.js` :: 扩展物品 - 任务/特殊物品（12种） · 加载到 window.extendedSpecialItems
  - **机制摘要**（24 行 / 4.4 KB · 纯数据表 + 一个隐含的货币阶梯）`window.extendedSpecialItems`
    实测 **17 条**（头注写「12 种」，实测 17，同样受 `13-missing-ids.js:305 register(missingSpecial)`
    影响）。头注叫「任务/特殊物品」，实测 `type/category` 分两块：
    **`type:'quest'`**（`spec_token` 信物 / `spec_token_pass` 令牌 / `spec_map_fragment` 地图残片 /
    `spec_key` 钥匙）——**全部 `price:0`**，其中地图残片的 desc 写「集齐三片可在行囊中拼成完整藏宝图，
    按图寻宝」；**`type:'material'`**（`spec_spirit_fragment` 1 → `spec_spirit_stone` 10 →
    `spec_mid_spirit_stone` 100 → `spec_high_spirit_stone` 1000 → `spec_supreme_spirit_stone` 10000 /
    `spec_spirit_crystal` 5000 / `spec_spirit_source_pearl` 10000）。
  - **缺口** ★★**「灵石」被做成了可购买、可堆叠、可进背包的实体物品**（6 个 id，`maxStack` 999/9999），
    与本项目唯一的货币口径 `inventory.currency.spiritStones` **并存** ⇒ 出现「灵石币」与「灵石物品」
    两种同义资产，而 `STRUCTURE.md:73` 的硬规则只管住了**货币**侧那条路。
    实测全仓**无任何代码消费 `spec_spirit_stone` 之类**（价格阶梯存在的唯一理由是能被买卖/掉落，
    但 §0.2 记的是「不进商店」——**无法判定**它到底能不能被 `buy/sell` 接受，
    `js/inventory.js` 与商店侧本批回填）。
    ②地图残片 desc 承诺「集齐三片可在行囊中拼成完整藏宝图，按图寻宝」—— 全仓 `spec_map_fragment`
    的消费点（**未核**，属 quest/map 段）⇒ **疑似死数据**（3 片要集齐才能用的道具却没有合成入口，
    等于一个永久凑不齐的目标）。
    ③4 件任务物品 `price:0` 且 `stackable:true / maxStack:10` ⇒ 可交易否**无法判定**（price 0 不等于禁售，
    `17-lead-tokens.js` 用的是「price 0 + UNIQUE 双重挡闸」，本表**没有 UNIQUE 标记**）。
- `js/items-extended/09-loot-sources.js` :: 【已废弃·不挂载】物品获取途径补全 v1.0 · 在app.js中定义，通过window导出，补充所有缺失物品的获取途径
  - **机制摘要**（175 行 / 9.1 KB · 数据表 + 一个掉落函数）**⚠ 本文件不在 `仙侠.html` 里**
    —— 实测 `仙侠.html` 的 `src=` 清单共 **351 个脚本**，`js/items-extended/` 下只挂了 **18 个**
    （`js/items-extended.js` 主入口 + 17 个子文件），**`09-loot-sources.js` 是唯一没挂的**（与 §2 章
    「已废弃 · 不挂载」的标注一致，另与板上 docC 的独立结论一致）。文件自身仍完整导出 6 个全局：
    `window.WEAPON_SHOP_ITEMS`（按 common/uncommon/rare/epic 四档列武器 id）·
    `window.ARMOR_SHOP_ITEMS` · `window.EXTENDED_LOOT_TABLES` · `window.CHEST_LOOT` ·
    `window.openChest` · `window.getExtendedLoot(enemyLevel)`（L162-166：按
    `EXTENDED_LOOT_TABLES[档]` 随机抽一件塞进 `loot.items`，再给
    `spiritStones = floor(enemyLevel * 3 * Math.random())`）。头注写「在 app.js 中定义，通过 window 导出」
    ——**与实际文件位置矛盾**（它在 `js/items-extended/` 下，不在 `js/app.js`）。
  - **缺口** ★★★**整个文件是死代码**：未挂载 ⇒ 6 个全局**全仓不存在**
    （实测 `window.WEAPON_SHOP_ITEMS|ARMOR_SHOP_ITEMS|EXTENDED_LOOT_TABLES|CHEST_LOOT|openChest|getExtendedLoot`
    在 351 脚本的运行时里**一个都没有**）⇒ 「物品获取途径补全」这件正事**一件都没生效**：
    商店物品池、掉落表、宝箱三件事全部只写在这份没人加载的文件里。
    ★证据：html 挂载序实测 `items-extended.js`→`13`→`14`→`15`→`16`→`17`→`18`（索引 35-41），
    `09` 直接跳过去；`10`/`11`/`12` 在索引 207-209（靠后，另见那三条）。
    ⇒ **凡是「某物品买不到/掉不出」类问题，都应先查这个文件是否已经写了答案而没接线。**
    ②头注「在 app.js 中定义」与文件实际路径矛盾（见上）。
    ③按体量给深度会低估它：175 行 9.1 KB，含 **4 张商店池 + 若干掉落表 + 一个宝箱开箱函数**
    （未逐项计数，**无法判定**各表条目数）。
- `js/items-extended/10-crafting-extensions.js` :: 扩展合成配方 v1.0 · 补充缺失的符箓合成配方，在 crafting.js 加载后自动合并
  - **机制摘要**（139 行 / 7.7 KB · 运行期向量化追加）`(function(){…})()` IIFE，
    头注「在 crafting.js 加载后自动合并」。实测挂载序：**html 索引 207**（在 `js/crafting/*` 之后），
    所以合并时序成立。逻辑只有三步（L127-138）：
    ①`extraTalismanRecipes` 先过一道闸 `window.itemById[r.result.itemId]` 存在
    **且 `implemented !== false`** ⇒ 产出 `activeRecipes`；
    ②`window.allRecipes.push(...activeRecipes)`（实测 `allRecipes` **54 条**）；
    ③`window.recipeById[r.id] = r` 逐条登记；最后打日志
    `「扩展符箓配方已载入：可制作 N/extraTalismanRecipes.length」`。
    `window.talismanRecipes` 实测 **20 条**。头注 L5 写「缺失的符箓配方（**14 种**，补齐到 20 种）」。
  - **缺口** ★①`14 + 原6 = 20` 的说法需对上：**实测 `talismanRecipes` = 20** ⇒ 与「补齐到 20 种」吻合，
    但 `allRecipes` 54 条里符箓占多少**无法判定**（未逐条分类）。
    ②★**过滤条件用 `itemById[...]` 而不是 `allItems`** —— 与批次实测的「38 个 id 只在 `itemById`、
    不在 `allItems`」是同一件事的两面：本文件的闸门只认 `itemById`，所以**那些只进 `itemById` 的物品
    也会被本文件判为「可制作」**，而任何按 `allItems` 遍历的界面看不到它们
    ⇒ 配方可做、成品在物品库里查不到条目（**疑似**不可复现，已记档）。
    ③**无去重**：只 push 不检查 `allRecipes` 里是否已有同 `id` 的配方
    （实测 `dup_defs_in_allItems` 为空是物品侧，配方的 id 重复**未逐条核，���法判定**）。
    ④`recipeById` 若不存在则第③步整体跳过（静默）⇒ 实测 `recipeById` **不是 window 属性**
    （`itemById`/`allItems` 是，但 `recipeById` 未出现在本文件的运行时探测结果里）
    ⇒ **疑似这 20 条只有 allRecipes 数组里的孤儿副本，查配方表走不通**（**无法判定**，
    `crafting/recipe-system.js` 本批未核）。
- `js/items-extended/11-event-extensions.js` :: 奇遇事件扩展 v1.0 · 在 event-system.js 加载后自动合并到 randomEvents · 新增40+个事件，总计50+个
  - **机制摘要**（**实测 91 行 / 24.9 KB** · 事件数据表 + 运行期 merge）
    `(function(){…})()` IIFE，头注「在 event-system.js 加载后自动合并」「新增 40+ 个事件，总计 50+ 个」。
    **合并时序已核**：html 挂载序 `js/event-system.js` = 索引 **56**、本文件 = 索引 **208** ⇒ 前提成立。
    L82-89 的闸门是 `typeof randomEvents !== 'undefined' && Array.isArray(randomEvents)`
    ——`randomEvents` 在 `event-system.js:30` 是 **`const` 声明的全局词法绑定**（不是 window 属性），
    但顶层 `const` 对后续经典脚本可见 ⇒ 闸门能过，随后按 `id` 去重 push，并打日志
    `「[event-ext] 已添加 N 个扩展奇遇事件，总计 M 个」`。
    ★**实测合并结果（从 `window.eventSystem.randomEvents` 读，非 window 直读）**：
    **44 条**、`id` 全唯一、无一条缺 `choices`；按 `type` 分 **12 类**：
    `treasure` 7 · `master` 5 · `herb` 5 · `battle` 5 · `trap` 4 · `spirit` 4 · `teaching` 4 ·
    `nature` 3 · `artifact` 3 · `curse` 2 · `dungeon` 1 · `boss` 1。
    事件形状：`{id,name,type,rarity:{id,name,chance,color},description,choices:[{id,text,…}]}`。
    奖励走本文件自带的 `xGive(msg,tone,id,cnt)`(L7-13)：真调 `window.addItem(id,cnt)`，
    行囊塞不下时改口播「行囊只塞得下 `got`/`cnt` 件」（DES-89 第一百二十七批补的如实播报）。
  - **缺口** ★★①**头注「新增 40+ 个，总计 50+ 个」与实测 44 条不符**（而且 44 < 50）
    ⇒ 「新增 40+」也不对（event-system 自带若干条，扩展实际只贡献了一部分，**未逐条拆分统计**）。
    ★②**44 条事件的 `choices` 里，`effects.items` 引用数实测为 0** ⇒ 事件奖励**不走声明式 effects.items**，
    而是散在 100+ 个 choice 的 JS 体里由 `xGive` 直调 `addItem`
    ⇒ 后果是 **`core/content-validator.js` 这类静态内容校验器查不到事件奖励的物品引用**
    （它只查 recipes/items 的 id 闭环）⇒ 事件奖励里写错一个 item id **只有玩家撞上时才发不出来**，
    且 `xGive` 会把它当「行囊满了」播报（L10-13 的 else 分支），**报错信息会误导**。
    ③`rarity.chance` **全表求和 = 6.46**（实测）——它被 `event-system.js:462` 的
    `availableEvents` 当作**相对权重**用（每次只抽一个），不是概率；字段名叫 `chance` 极易误读
    （同表里 `0.5` 出现 3 次、`0.3` 5 次、`0.15` 11 次、`0.04` 10 次、`0.01` 4 次）。
    ④`dungeon` 与 `boss` 两类**各只有 1 条**（44 条里的稀缺类）⇒ 与 `type` 表里 12 类的分布不匹配
    （实测 `EVENT_TYPES` 里这两类的其它 id 归在别的 type 下，**无法判定**是否归类错）。
    ⑤`xGive` 的兜底文案说「行囊只塞得下 N/M 件」——但它**不区分「行囊满」与「模板不存在」**
    （`addItem` 返回 0 时两种都走同一句）⇒ 与 `core/reward-service.js` 的 DES-85
    「`bag_full` 与 `item_no_template` 拆成两键」的口径**不一致**，本条是同款病灶的第二处。
- `js/items-extended/12-quest-extensions.js` :: 任务系统扩展 v2.0 · 从quest-system.js 加载后自动合并扩展任务 · 主线扩展20步→35步（覆盖炼气→真仙→飞升，七章完整剧情） · 新增剧情对话文本系统
  - **机制摘要**（**实测 422 行 / 46.6 KB**，本目录最大的文件 · 数据表 + 合并器 + 剧情文本库）
    `(function(){…})()` IIFE，L2 注明「**从 quest-system.js 加载后自动合并**扩展任务」，
    L420-421 显式说明「quest-system.js 已在本文件之前加载，直接合并；不再用延迟猜加载顺序」
    ——实测 html 挂载序：索引 209，`js/quest/quest-system.js` 在其之前 ⇒ **时序前提成立**。
    产物三张表（实测）：`window.allQuests` **70 条** · `window.mainQuestChain` **48 条** ·
    `window.npcStoryQuests` **22 条**。头部另带一张**剧情对话文本库 `STORY_DIALOGUES`**
    （以任务 id 为键，如 `'main_021'`）。合并器 `merge()` 做三件事（L409-416）：
    写三张 window 表 → 再调 `window.QuestRegistry.registerMany` **分别注册 main/random/npcStory 三批**
    ——注释 L410 自陈这是 F-1 修复（「merge() 之前只 push 到数组，`findQuestById → QuestRegistry.get`
    返回 null → 任务不存在」）。
    头注 L3 写「主线扩展 **20 步→35 步**（覆盖炼气→真仙→飞升，七章完整剧情）」。
  - **缺口** ★①**头注的「35 步」已被后续批次推过**：实测 `mainQuestChain` **48 条**
    ——与板上 docC 的独立结论一致（它也是 48，并指出链数组顺序是
    `main_001~005 → main_021~035 → main_006~018 → main_050~055 → main_040~045 → main_056~058`，
    与推进次序不一致）。**「35 步」是本文件写下时的数，后面别的批次继续往链里插了 13 条。**
    ②`STORY_DIALOGUES` 以任务 id 为键，而主线 id 已出现 `main_056~058`（**超出本文件头注声明的 035**）
    ⇒ **文本库与任务链已经不同步**（某个 id 有任务无对白，或反之；**无法判定**，
    未做 id 集合差）。
    ③`QuestRegistry.registerMany` 的调用**没有返回值检查、没有 try/catch**
    ⇒ 注册失败（表未就绪 / id 冲突）会静默，而 `merge()` 后面那行 `console.log` 照打
    ⇒ **日志里的条数只证明 push 成功，不证明注册成功**（这是 docC 那条 wave140 A2 断言的背景）。
    ④46.6 KB / 422 行，**单行极长**（一行一条任务），按行数估体量会严重低估
    ——本目录 18 个文件里有 9 个是这种「行少字节大」形态。
- `js/items-extended/13-missing-ids.js` :: 13-missing-ids.js — B2 补齐审查报告中缺失的物品 ID · 加载后合并进 window.extendedMaterials / food / special / arts / weapons， · 并由 items-extended.js 或本文件直接写入 itemById
  - **机制摘要**（**实测 318 行 / 12.5 KB** · 补表工厂 + 通用注册器）
    `(function(){ 'use strict'; … })()` IIFE，头注「B2 补齐审查报告中缺失的物品 ID；
    加载后合并进 `window.extendedMaterials / food / special / arts / weapons`，并由
    `items-extended.js` 或本文件**直接写入 `itemById`**」。内部有一个五参工厂
    `mat(id,name,price,icon,desc)`(L9) 与一个通用 `register()`（`已知定义不覆盖 → 写 itemById → 并入
    相应 extended 数组`）。L305-307 注册四批：`missingSpecial` / `missingArts` / `missingWeapons`
    （另有 materials/food/pills 在上文各自注册）。产物 `window._missingItemsB2` 是一个**对象**，
    实测 **6 个键**：`{materials, food, pills, special, arts, weapons}`。
    实测挂载序 html 索引 **36**（在 `js/items-extended.js` 索引 35 **之后**）
    ⇒ 「由 items-extended.js 或本文件直接写入」这句里，**主入口已经先跑完了**，本文件是**第二个写者**。
  - **缺口** ★①**这就是 04/07/08/06 四条头注「实测比声明多出若干」的真凶**：
    `_missingItemsB2` 6 个键追加进 `extendedMaterials`(+37 实测) / `extendedFood`(+23) /
    `extendedSpecialItems`(+5) / `extendedArts`(+2) ⇒ **跨文件并表没有登记机制**，
    按文件计数必然失真（记档；这是 items-extended 目录最结构性的一个问题）。
    ②**加载序反了**：头注说「由 items-extended.js **或**本文件写入」，
    但实测本文件在主入口**之后**才跑 ⇒ 「或」字掩盖了「主入口先跑完、本文件后补」的事实；
    若主入口有依赖「补表齐全」的逻辑（如按表长生成索引），它看到的是**补表之前**的表
    （**无法判定**主入口有没有这类逻辑，67 行可读但本批未逐行核）。
    ③`_missingItemsB2` 这个**带下划线前缀的内部账**被挂成 window 全局，
    而 `16-dangling-ids.js:87` 同样挂了 `_danglingItemsB16` ⇒ **两本内部账都在全局可见**，
    但**没有任何消费者**（实测全仓无 `_missingItemsB2` / `_danglingItemsB16` 的读取点）
    ⇒ 两个死导出（它们唯一的作用是留证，但代码里没有任何断言或校验读它们）。
    ④★与 `16-dangling-ids.js` 的**职责重叠**：两本都是「审计出按 id 发放但无模板 → 补模板」，
    `13` 补的是 B2 审查（泛物品库），`16` 补的是 v20.85 悬空道具（27 处发放点）
    ⇒ **两套补洞机制、两个注册器、两套并表规则**（`13` 用工厂 `mat()`，`16` 用裸对象 + 手写 push），
    且 `16:78-84` 的分派按 `type`/`subtype` 决定推进哪张表，`13` 的分派按「注册时显式指定」
    ⇒ **同一 id 若两本都补，后跑的覆盖先跑的**（实测 `dup_defs_in_allItems` 为空 ⇒ 当前无真冲突）。
- `js/items-extended/14-ability-manuals.js` :: 扩展物品 - 绝技秘籍（9种，v13.1） · 加载到 window.extendedManuals；玩家通过研读秘籍学习 COMBAT_ABILITIES 可学绝技。 · 设计哲学：游戏内容理论上任何人都能拥有——玩家与敌人共用同一套战斗机制与数值
  - **机制摘要**（64 行 / 3.9 KB · 纯数据表 + 注册）`window.extendedManuals` 实测 **9 条**，
    与头注「能力秘籍」一致。实测挂载序 html 索引 **37**。注册方式与 `15-root-refine.js` 同款：
    「`itemById` 里没有才写」+ `allItems.push` + 并进 `consumables`。
    ★**这 9 条是 `core/knowledge-system.js` 54 条 `MANUAL_TO_SKILL` 的另一半来源**
    （前 45 条来自 `02-weapons`/`03-armor`/`06-arts`，第 46-54 条那批方向秘艺/绝技秘籍来自本表）。
  - **缺口** ★①`knowledge-system.js` 的 `MANUAL_TO_SKILL`（**实测 54 键**）里，
    **只有 27 门不同功法被覆盖**，而 `skillPages` 有 **59 门** ⇒ **32 门功法在物品库里找不到秘籍**
    （与 knowledge-system 条目同一条结论，此处从上游确认：这 9 条秘籍一个也没扩到那 32 门上）。
    ②`window.consumables` 实测 **102 条** —— 本表 9 条秘籍被归进「消耗品」，
    而秘籍在 `06-arts.js` 里的 `type` 是 `'secret_art'`、`category` 是 `'secret_art'`
    ⇒ **`consumables` 数组与 `type/category` 是两套归类口径**（秘籍被算成消耗品，
    用途是「读了就进 knowledge」；**无法判定** `consumables` 是否被用作「可点击使用」清单，
    `inventory.js` 本批回填）。
    ③本表 9 条全部走 `itemById` + `allItems.push` 双写，而实测批次结论是
    **38 个 id 只进 `itemById` 不进 `allItems`**（15 个 `tal_*` + 7 个 `fmt_*` + 16 个 `pup_*`）
    ⇒ 本表走的是**正确的双写**路径，可作为那 38 条的修法样板（记档）。
- `js/items-extended/15-root-refine.js` :: 扩展物品 - 重塑灵根丹（v20.16） · 后天改命线：服用后本系主根占比 +6（其余五行按比例摊薄，饼总和恒 100 由族谱同一把尺配平）。 · 获取唯一路径=炼丹新丹方（五行灵髓主药，js/crafting/alchemy-compound.js recipe_root_refine）
  - **机制摘要**（44 行 / 2.0 KB · 单件物品 + 完整接线链）`window.rootRefineItems` 实测 **1 条**
    （`pill_root_refine` 重塑灵根丹），与头注一致。四行头注是一份完整的链路契约：
    「后天改命线：服用后**本系主根占比 +6**（其余五行按比例摊薄，饼总和恒 100 由族谱同一把尺配平）」
    「获取唯一路径 = 炼丹新丹方（五行灵髓主药，`js/crafting/alchemy-compound.js` `recipe_root_refine`）」
    「使用处理见 `inventory.js` `useItem` → `root_refine` 分支 → `window.refineRootByPill`」。
    注册方式（实测 L31-42）：`itemById` 已有则跳过 → 写 `itemById` → `allItems.push` →
    并进 `consumables`（若该数组存在）→ 全程 `known` 幂等表。
  - **缺口** ★①这条头注的链路契约是**全 items-extended 目录里写得最完整的**，
    反而凸显其它 17 条没有接线说明的事实（记档，不是本条缺陷）。
    ★②但契约本身**未验证**：`recipe_root_refine` 与 `window.refineRootByPill` 是否真的存在/被调，
    本批**未核**（分属 crafting/ 与根目录 inventory.js）⇒ **「唯一获取路径」是否成立无法判定**。
    ③「+6」的**数值与扇形切法**写在头注里，**代码里只有物品定义、没有任何逻辑**
    ⇒ 真正的平衡参数（+6 是不是随境界缩放、切完之后走什么尺子配平）**不在本文件**，
    文档读者要看懂这个改动必须跨三本文件（记档）。
    ④`allItems.push` 在实测里让 `allItems` = **538 条**、无重复 ⇒ 本件**在** allItems 里
    （与那 38 个只进 itemById 的不同）。
- `js/items-extended/16-dangling-ids.js` :: 16-dangling-ids.js - 悬空道具补洞（v20.85） · 全库审计发现：搜刮/解剖掉落、地标探索奖励、北冥挖矿、主线终局奖励、飞禽传书、 · NPC 送货任务与生活消费、资源点产出，共 27 处按 ID 发放的道具在物品库里没有模板
  - **机制摘要**（**实测 90 行 / 8.5 KB** · 补洞表 + 显式并表）`(function(){ 'use strict'; … })()`。
    头注是一份**审计结论**（v20.85）：「全库审计发现：搜刮/解剖掉落、地标探索奖励、北冥挖矿、
    主线终局奖励、飞禽传书、NPC 送货任务与生活消费、资源点产出，共 **27 处**按 ID 发放的道具在物品库里
    没有模板——`addItem` 因「物品模板不存在」**静默丢弃**，玩家白打白挖白跑（与 v20.81 九种鱼同一族问题）」
    「掉落表权重、地标进度奖励文案、任务目标皆已存在，**只缺物品本体**」
    「注册规则与 `13-missing-ids.js` 同一套」「加载顺序：在 `items-extended.js`（合并器）之后」。
    实测挂载序 html 索引 **39** ⇒ 与头注声明一致。`danglingItems` 实测 **27 条**（与头注 27 处吻合），
    L77-85 按 `type`/`subtype` **显式并表**（material→`extendedMaterials`、pill→`extendedPills`、
    secret_art→`extendedArts`、equipment+sword→`extendedWeapons`、equipment+其它→`extendedArmor`、
    talisman→`extendedTalismans`），末尾挂 `window._danglingItemsB16` 并打日志（实测有
    `「[悬空道具补洞] 注册 27 种（掉落/地标/挖矿/主线奖励/传书/送货/资源点）」`）。
  - **缺口** ★①`_danglingItemsB16`（27 条）**全仓零读取** ⇒ 死导出；它本可以当
    「这 27 处发放点现已补齐」的断言源，但没有任何测试或校验读它（与 `13` 的 `_missingItemsB2` 同款）。
    ②**分派表不完整**：L78-85 只覆盖 6 类 `type`/`subtype`。若 27 条里有 `type:'quest'` 或
    `'consumable'`+非 pill/talisman 的（如 `spec_*`、`food_*`），**不进任何 extended 表**
    ——这直接解释了批次实测的「04/07/08 头注数与实测差 23~37」里的一部分差额归属
    （**无法判定**具体哪几条没被并表，需逐条比对）。
    ★③**审计结论写的是「27 处按 ID 发放」，而本文件补的是 27 个物品模板**
    ⇒ **「处」与「个」的对应关系没有记录**（多处发同一个 id 时会补重、补漏都查不出）
    ⇒ 这是「补洞」类修复的通病：**只补了物件，没锁住发放点**（记档）。
    ④与 `13-missing-ids.js` 职责重叠、注册器两套（见 13 的缺口④）。
- `js/items-extended/17-lead-tokens.js` :: 17-lead-tokens.js — 主角信物（v20.91 特殊品级） · 「特殊」是独一份的品级：十六位男主、二十位女主，人手一件信物，天下仅此一枚。 · 不进商铺、不入掉落、不上拍卖（price 0 + UNIQUE 双重挡闸）——只在结为道侣那一刻
  - **机制摘要**（**实测 334 行 / 23.8 KB** · 特殊品级物品表 + 一套独立小账）
    `(function(){ 'use strict'; … })()`，头注是**契约式**的：「『特殊』是独一份的品级：
    **十六位男主、二十位女主，人手一件信物，天下仅此一枚**。不进商铺、不入掉落、不上拍卖
    （**price 0 + UNIQUE 双重挡闸**）——只在结为道侣那一刻，由那个人亲手放进你手里
    （`dao-bridge.ensureDaoBond` **单一写点**发放，按名册认领）。佩戴位统一 `acc2`（饰品2）：
    信物贴身，戴的是心意，不是数值」。
    **实测 `window.LEAD_TOKENS` 36 条**、`window.LEAD_TOKEN_MAP` 36 键 ⇒ **16 + 20 = 36 ✓ 与头注一致**
    （本目录少数头注与实测完全对得上的文件）。工厂 `token(id,name,icon,lead,sect,attrs,bonus,desc)`(L9)。
    导出 6 个全局：`LEAD_TOKENS` / `LEAD_TOKEN_MAP` / `grantLeadToken` / `openTokenShelf` /
    `tokenDailyTick` / （+ `__leadTokenShelf` 实测为**空对象 0 键**）。
    **自带一套 StateRegistry 登记**（L315-325）：`export` 收 `{lastReactDay}`、`import` 回填、
    `reset` 置 `-1` ——是本目录**唯一**把状态挂进 `core/state-registry.js` 的文件。
  - **缺口** ★①`__leadTokenShelf` 实测 **0 键**（空对象）⇒ 「信物柜」这条日常线（`openTokenShelf`
    / `tokenDailyTick` + `lastReactDay`）**目前没有任何信物进柜的状态**，柜子恒空
    ⇒ 整套 shelf 机制（export/import/reset + 每日 tick）**建成空转**（**无法判定** shelf 是靠
    `_fence` 那类「懒建于字段」还是真靠这个对象；`shelfState()` 实现未逐行核）。
    ②**36 枚全挤 `acc2` 一个槽**（头注自己写明）⇒ 只能同时戴 1 枚；`03-armor.js` 的
    `acc2` 全表也只有 2 件候选 ⇒ 「十六位男主、二十位女主」的收集感在数值上被单槽压死。
    ③`LEAD_TOKEN_MAP` 36 键与 `LEAD_TOKENS` 36 条一一对应，但**两份数据结构并存**
    （数组按序 + 映射按 id）⇒ 任何新增都得改两处，**无一致性断言**（记档）。
    ④「单一写点 `dao-bridge.ensureDaoBond`」这条断言**未核**（dao-bridge 在 core/ 段、
    由别人写；**无法判定**是否有第二处发信物的路径）。
- `js/items-extended/18-grade-expansion.js` :: 18-grade-expansion.js — 品级补阶与毕业装（v20.91） · 九品制改档后补齐三件事： · ① 六品/四品/二品三个新档位在各槽位铺货（旧档只占九八七五三一，新档全是空板） · ② 饰品线补厚：副手盾、项链、双戒、双饰品从低到高成完整阶梯
  - **机制摘要**（**实测 95 行 / 20.2 KB**，行少字节大 · 纯数据表）`window.extendedGradeExpansion`
    实测 **51 条**。L1-2 头注说明它补的是**品级扩展**（与 `17-lead-tokens.js` 的「特殊」品级同族）。
    实测挂载序 html 索引 **41**（本目录最后一个）。注册方式与 `14`/`15` 同款：
    `itemById` 已有则跳过 → 写 `itemById` → `allItems.push`（实测 `dup_defs_in_allItems` 为空）。
    批次实测的**品级分布（16 张 extended 表合计 437 条）**：
    `PIN9` 86 · `PIN8` 99 · `PIN7` 82 · `PIN5` 74 · `PIN3` 51 · `PIN6` 12 · `PIN4` 11 ·
    `PIN2` 9 · `PIN1` 13 ⇒ **PIN6/PIN4/PIN2 三档在扩展物品里只有 32 条**，
    而 `PIN3` 有 51 条（**反常的中间凹陷**）——本表 51 条正是 `PIN3` 的全部来源
    ⇒ **本表实际只用了 `PIN3` 一档**（`allItems` 里 PIN3 共 51 条，与本表 51 条相等，
    **高度疑似** `PIN3` 全部来自这里）。
  - **缺口** ★①**本表 51 条只用 `PIN3` 一档**（实测 `PIN3` 全库 51 条 == 本表 51 条）⇒
    「品级扩展」名不副实：**没有扩出 PIN4/PIN2 的新物品**，而是把 51 件都塞进同一个档
    ⇒ 品级阶梯在 `PIN3` 处**整层塌陷成同质区**（PIN9→PIN3 有 415 条、PIN2 及以下只有 22 条）。
    ②`03-armor.js` 里 `arm_immortal_crown` 是 `quality:'PIN3', level:25, price:8000`，
    而本表 51 条若是 PIN3 ⇒ **同档里 level/price 差几个量级**，玩家无法用品级判断价值。
    ③实测「`itemById` 576 键 vs `allItems` 538 条」差 **38**，而本表走**双写**⇒ 差额**不来自本表**
    （那 38 条是 `tal_*` 15 + `fmt_*` 7 + `pup_*` 16，见批次汇总）⇒ 本表干净。
    ④20.2 KB / 95 行，单行平均 210 字节 ⇒ **按行数判体量会低估 2 倍以上**（记档）。

### js/map/（9 个）— 地图与野外

- `js/map/high-planes.js` :: high-planes.js - 高位面：灵界/魔界 · v20.0 起有「御剑飞行 + 跨界按钮」，但位面只有一个空壳：改个 location 字符串， · 城市面板打不开、回不来、灵气按"普通区域0.8"算——比人间还稀薄
  机制 459 行 · 混合（高位面：御剑飞行 + 跨界 + 位面营生 + 每日结算 + 魔功阁 + 血池）｜关键数据 `PLANE_LOCATIONS` **2 键 / 4 个地点**（灵界：蓬莱仙境/九天罡风带；魔界：九幽深渊/血海荒原）、`PLANE_GATHER` 2 键、`CROSS_QI`=80、`CROSS_MINUTES`=120；导出 23 个 window 全局（`enterPlane` / `returnToMortal` / `flyTravel` / `openPlanePanel` / `planeCultivate` / `planeGather` / `planeExplore` / `planeTravel` / `openDemonArts` / `planeBloodPool` / `getPlaneOf` …）
  接口 23 个 window 全局｜依赖 `locationSystem.enterCity(target,{skipGate:true})`、QuestRegistry、RewardService、inventory/itemById、discipleState、startBattle、timeSystem｜事件：无（`_planeNewDayHook` 走 timeSystem 订阅）
  ★缺口（对应「已知的坑」，**成立**）→ `high-planes.js:10-13 PLANE_LOCATIONS` 只有 4 个地点（2 位面 × 2），而 `location-system.js` 的 `cityData` 有 23 城、其中含 `灵界·蓬莱仙境`/`灵界·九天罡风带`/`魔界·九幽深渊`/`魔界·血海荒原` 4 个位面城 ⇒ 位面**地点数就是 4**，位面内容量与 23 城的人间内容不对等（不是漏做，是位面只做了骨架 + 4 个营生点）
  缺口 `:200` 与 `:270` 两处 DES-86 注释自陈「旧写法丢返回值、照念开价份数」已修；但本文件仍自行挂 `window.addItem` / `window.addItemFailPhraseFor` / `closeModalSoft` 三个转发口 ⇒ 同名全局覆盖
  缺口 头注自陈「v20.0 起位面只有一个空壳，灵气按『普通区域 0.8』算」已做实；但 `planeOf()` 只认以「灵界」「魔界」开头的字符串 ⇒ 位面新增地点必须改名到这两前缀下（**无法判定**是否有意：`_demonArtsTrade` 的魔功阁不在 PLANE_LOCATIONS 里）
- `js/map/landmark-explore.js` :: landmark-explore.js - 地标探索系统 · 探索度、隐藏内容、图鉴系统 · 依赖：map-markers.js (LANDMARKS) · 加载顺序：在 map-markers.js 之后，app.js 之前 · 第三十四波
  机制 621 行 · 数据表 + 混合（地标探索：12 类地标的弹出剧情 + 隐藏奖励）｜关键数据 `LANDMARK_EXPLORE_DATA` **12 条**、`LANDMARK_ALIASES` 2 键、`TYPE_HINT` 10 键、进度落 `localStorage('xianxia_landmarks')`
  接口 13 个 window 全局（`initLandmarkExplore` / `exploreLandmark` / `showLandmarkBestiary` / `syncCharAttrsFromMain` / `addMainAttribute` / `realmAtLeast` / `_landmarkPullSword`）｜依赖 `LANDMARKS`（randomMap 侧）、`TravelJournal`、inventory/itemById、saveToStorage、timeSystem｜事件：无
  缺口 `landmark-explore.js` 的 `_landmarkPullSword`（:340 定义 + :336 按钮 `onclick` 自驱）**不是**死导出；真正的口径风险是它被 `window.` 前缀 + `&&` 守卫调用（`window._landmarkPullSword && window._landmarkPullSword(...)`）⇒ 该按钮在函数未加载时**静默不响应**
  缺口 `:264/:350/:376/:393/:450` 五处 DES-86/DES-72 注释串成一整条「先发货再立旗」纪律，说明本文件历史上至少 5 处丢返回值 ⇒ 现已逐处修过，但**没有回归测试点名本文件**（tests/ 内无 landmark-explore 专属套）
  缺口 进度走 `localStorage('xianxia_landmarks')` 直写，而同目录 randomMap.js 的野图账走 `StateRegistry('wildMap')` ⇒ 同一次探索跨两本账、两种存档口径（**无法判定**是否有意分账）
- `js/map/lore-shelf.js` :: 第七十五波 · 游历残页册（拾得的旧事，收成一册随时重读） · 洞天开匣、三张拼一段的旧事（五十七/五十八波）都是「到手那一刻现出」——飘过眼前就没了， · 捡了三十张残页的人和没捡过的人，行囊一样空。本账把册子立起来
  机制 147 行 · 数据表 + 渲染（游历残页册：按九域拼残页成完整旧事）｜关键数据 `REGIONS` **9 域**、`seen`/`list` 运行态；导出 `window.LoreShelf`（8 方法）+ `openLoreShelf`
  接口 `window.LoreShelf`（8）+ `openLoreShelf`｜依赖 `itemById`、`wildMapApi`（读野图的 grottoLoot 账）、showModal｜事件：无
  缺口 `REGIONS` 9 域 vs `location-system.js` 的 10 个地区、`market-dynamic.js` 的 6 大区 ⇒ **三套地域枚举**（本文件按 9 域，与前两者都不重合）
  缺口 本文件是 map/ 里最薄的一本（147 行），但它读的 `wildMapApi` 是 randomMap.js 的 14 分组命名空间 ⇒ 强耦合（**无法判定**是否有守卫：实测 `wildMapApi` 出现在 REFS，无 typeof 检查记录）
- `js/map/map-markers.js` :: 地标名录 + 任务目标指路 · v35 大裁剪：旧版的「地图标记系统」——26 个预设标记挂在凭空坐标上， · 渲染容器在 HTML 里根本不存在，解锁门禁读的全局状态变量全项目无人定义， · 整套是一页渲染不出来的假图。本版裁掉全部假标记，只留两样真的
  机制 117 行 · 纯接线（地图标记：把任务目标点画到野图上）｜无大写常量表；导出 7 个 window 全局（`initMapMarkers` / `syncQuestTargetMarkers` / `removeQuestTargetMarkers` / `questTargetForPoi` / `questPoiHints` / `LANDMARKS` / `gameLog`）
  接口 7 个 window 全局｜依赖 `QuestRegistry`、`playerQuestProgress`（注意 quest-system.js:387-388 注释自陈该全局「从没挂上 window」）｜事件：无
  ★缺口 本文件依赖 `window.playerQuestProgress`，而 quest-system.js 的 30 个 window 全局里**没有这个名字**（实测确认），quest-system.js:387-388 的 NEW-03 注释也自陈「此前 app.js 读 window.playerQuestProgress（**从没挂上 window**）… 槽里 questProgress 恒为空壳」⇒ app.js 已改走 StateRegistry 槽，**本文件未同步改** ⇒ 地图任务标记这一条线静态可判为断（需真浏览器屏证定性是否被别的兜底救回）
  缺口 `window.LANDMARKS` 与 `window.gameLog` 由本文件转发挂出，而正主在 randomMap.js / app.js ⇒ 又一对同名覆盖
- `js/map/randomMap.js` :: randomMap.js · 野外地图（v20.56 重做）。 · 地形生成交给 wild-terrain.js（WildTerrain，纯函数、种子确定）； · 本文件负责：状态 / SVG 渲染 / 交互（点击寻路、采集、地物互动）/ 与既有系统接线 / 存档
  机制 5477 行（55 个 `====` 段，全项目最大单文件）· 混合（程序化地图生成 + 四季渲染 + 实体/采集撒布 + 兽群游荡 + 40 余种野外动作 + 差量存档 + 侧栏 UI）｜关键数据：`window.wildMapApi` 命名空间 14 分组（swim/season/grotto/nemesis/lore/ruin/note/relief/wet/meal/ley/life/trade/escort）；`MAP_SEED_KEY` + `getMapSeed`/`setMapSeed`/`generateSeededMap`/`createSeededRandom` 一整套播种链；差量存档走 `StateRegistry('wildMap')`；`emit('escort:completed')`(:3543)
  接口 59 个 window 全局（`openWildernessMap` / `initRandomMap` / `buildWildMap` / `saveWildState` / `renderMap` / `onCellClick` / `closeRandomMap` / `travelToRegion` / `selectProvince` / `window.currentMap` / `window.playerPos` / `wildMapApi` …）｜依赖 30+ 个外部模块（`BeastEcosystem`/`BeastTide`/`ResourcePoints`/`DungeonDynamic`/`MarketDynamic`/`PSectWorld`/`QiyuEncounters`/`TravelJournal`/`WorldMap`/`partySystem`/`claimMapLey`/`EconomyTransaction`/`RewardService`/`StateRegistry`…）｜事件：★发 `escort:completed`(:3543)
  ★缺口 1（死分支已裁但留痕）→ `:4648-4649` 「v36 裁死出口：tryBeastAmbush（兽主动扑人）全项目零入口——野外的凶险已由兽群游荡（checkBandContact）与途中遭遇（rollWildEncounter）真接线，**这段死码删掉**」；`:4739` 同理「regenerateMap / openCityUI 全项目零入口，删」⇒ 文件内已无这三段，但**注释仍占位**，读者会以为代码还在
  ★缺口 2（命名空间内的死方法）→ `wildMapApi.life.bands`(:5132) 与 `wildMapApi.life.contact`(:5136) 两个方法**全域零引用**（`checkBandContact` 内部另有 3 处真调用 :2068/:4424/:4465）⇒ 导出层留了两个没人点的口
  ★缺口 3（整组命名空间不可达）→ `wildMapApi`(:4990) 的 `swim`(:5008) 与 `ground`(:5121，值即 `WildGround`) **两个分组名全域各只出现 1 次**（就是分组定义那一行；`wildMapApi` 本身有 23 处外部引用）⇒ 游泳/地面两组对外接口整组悬空
  ★缺口 4（完全死的一行）→ `randomMap.js:5183 window.REGION_TERRAIN_WEIGHTS = WildTerrain.REGION_PROFILES;` **全域只出现 1 次**（就是这一行赋值）⇒ 赋值后从未被读，是纯死赋值（它本可以直接读 `WildTerrain.REGION_PROFILES`）
  ★缺口 5（暴露但无人读的运行态）→ 实测全域出现次数 = 文件内出现次数，即**别处一次都没引**的十个口：`window.currentPois`(:879，全域 39)、`window._wildEncounterFired`(:2147，全域 3)、`window.MAP_SEED_KEY`(:5178，全域 8)、`window.getMapSeed`(:5179，全域 8)、`window.setMapSeed`(:5180，全域 3)、`window.generateSeededMap`(:5181，全域 4)、`window.initRandomMap`(:4834，全域 4)、`window.buildWildMap`(:4842，全域 4)、`window.saveWildState`(:4843，全域 29)、`window.onCellClick`(:4841，全域 9) ⇒ 挂上 window 是历史遗留（**导出面比实际外部接口大 10 个**）
  ★缺口 6（同名全局互抢）→ 本文件挂 `window.isEntityDead`，而 `extensions/beast-ecosystem.js` 也挂同名口；本文件读 `window.itemById` / `window.currentInteractionEntity` / `window.openBattleWithEntity` 等 20+ 个转发口，来源分散在 battle.js / inventory.js / npcs —— **随机序依赖风险高**
  缺口 `:1340` 注释自陈「地名避让：字号抬上来之后一格装不下并列地名，按 data-tier 从高到低贪心占位」⇒ 地名布局是启发式贪心，极端字号下可能仍有重叠（无回退）
  缺口 本文件**没有专属回归测试**（tests/ 内无 randomMap 专属套；v20.58-wild-map-hazard / wave140 间接覆盖）⇒ 5477 行的行为无直接保护
- `js/map/special-places.js` :: 仙路长青 - 特殊地点册（第一百一十一波 · 用户裁决） · 用户裁：「黑风寨这种东西就可以放进地图，地图现在进行扩展，可以通过消息（比如城市酒馆）或者自己发现 · 来看到这些特殊地点，随后它们就会出现在地区列表内作为特殊地点显示；状态会改变，比如寨子的土匪
  机制 352 行 · 数据表 + 混合（10 处秘境/禁地：进入代价 + 状态机 + 传闻 + 强攻）｜关键数据 `PLACE_DEFS` **1 条**（黑风寨 heifeng_zhai）、`ABANDON_AFTER_DAYS` / `RUMOR_CHANCE` / `ASSAULT_TRAVEL_MINUTES` 3 常量、`STATUS` 6 键状态、`SOURCE_LABEL` 8 键、StateRegistry 'specialPlaces'、`SpecialPlaces` 17 方法
  接口 `window.SpecialPlaces`（17）+ `window.XianXia.SpecialPlaces`｜依赖 StateRegistry、WorldCalendar、startBattle、formatShichen、closeModalSoft、showModal｜事件：无
  缺口 ★`PLACE_DEFS` **只有 1 条**（黑风寨），而文件有 `STATUS` 6 状态、`SOURCE_LABEL` 8 来源、`ABANDON_AFTER_DAYS` 7 天废弃、RUMOR_CHANCE 1/3 传闻率、`ASSAULT_TRAVEL_MINUTES` 120 分钟奔袭 —— **机制齐备而地点只有 1 处**，这是本批最典型的「引擎做完、内容没铺」形态；另 `PLACE_DEFS` 1 条 vs `landmark-explore.js` 的 `LANDMARK_EXPLORE_DATA` 12 条 —— 两本都是「地点可进入」的账，表数不同、id 空间未声明是否重叠（**无法判定**）
  缺口 本文件头注与 §0.2 职责均未提「传闻」与「强攻」两条支线（实测有 `RUMOR_CHANCE` 与 `ASSAULT_TRAVEL_MINUTES`）⇒ 文档层欠账
- `js/map/travel-journal.js` :: travel-journal.js — v36 游历见闻：散修走过的每一步都算数 · 三本一次性小账，全记在角色数据 _travel 上（随存档走）： · 一、初至一域（九州 + 灵界魔界，一地只记一回）→ +1 悟道点 · 二、亲至地标（十二处有名有姓的大地标，脚踩上去才算）→ +2 悟道点
  机制 196 行 · 数据表 + 判定函数（游历手账：里程里程碑 + 5 阶称号 + 成就联动）｜关键数据 `REGIONS` **9 域**、`STEP_MILESTONES` **4 档**、`TITLE_LADDER` **5 阶**；导出 `window.TravelJournal`（12 方法）+ `renderTravelJournal`
  接口 `window.TravelJournal`（12）+ `renderTravelJournal`｜依赖 currentCharData、insightPoints（悟道点奖励）、`checkAchievementsNow`、`updateInsightUI`、timeSystem、showMessage｜事件：无
  缺口 `REGIONS` 9 域与 lore-shelf.js 的 9 域同名同数，但两份表内容是否逐字一致未核（**无法判定**）；与 location-system 的 10 地区、market-dynamic 的 6 大区仍是三套枚举
  缺口 `STEP_MILESTONES` 只 4 档而 `TITLE_LADDER` 5 阶 ⇒ 五阶称号里有一阶不由里程驱动（**无法判定**走的是哪条条件）
  缺口 `TravelJournal` 被 randomMap.js / landmark-explore.js / lore-shelf.js / biography.js 四本读，是 map/ 里被依赖最多的账；一旦读档往返顺序变化，四本的口径会一起漂（**无法判定**是否有版本号：实测本文件无 StateRegistry 注册，走 currentCharData）
- `js/map/wild-terrain.js` :: wild-terrain.js - 野外地图地形生成器 · v20.56 野外重做第一块：把「逐格掷骰的随机表格」换成「有结构的真地皮」。 · 种子化分形噪声（值噪声 + 多倍频）出高度/湿度/温度三场，按阈值分层成片
  机制 785 行 · 数据表 + 判定函数（野外地貌：25 种地形 × 11 地区剖面 + 7 组地名池 + 10 种地貌特征 + 野外实体布局）｜关键数据 `TERRAIN` **25 键**、`REGION_PROFILES` **11 键**、`NAME_POOLS` **7 键**、`SIGNATURE_LANDFORMS` **10 键**；导出 `window.WildTerrain`（8 方法）
  接口 `window.WildTerrain`（8）｜依赖 `XianXia`｜事件：★订 `newDay`（`getAbsoluteDay` 自挂）
  缺口 `REGION_PROFILES` **11 键** vs `location-system.js` 的 10 个地区、`market-dynamic.js` 的 6 大区、`lore-shelf.js`/`travel-journal.js` 的 9 域 ⇒ **地图目录内就有四套地域枚举**（11/10/6/9），彼此无校验
  缺口 `NAME_POOLS` 7 键 vs 11 个地区剖面 ⇒ 至少 4 个地区共用别的地区的地名池（**无法判定**哪几个共用）
  缺口 本文件是纯生数据层（只生成地形网格与名字），**不发不订 EventBus 事件**，所有野外动作在 randomMap.js 里 ⇒ 生成与消费分两本，野外玩法的改动要同时看两处
- `js/map/world-map.js` :: world-map.js - 天下疆界（v20.63） · 九张地区野外图此前彼此不认识：列表里点哪张就开哪张，跑图跑不出「天下」的感觉。 · 这里把九州拼回一块大陆：谁与谁接壤、走哪道关隘、隔多少里、路上会出什么事
  机制 529 行 · 数据表 + 渲染（舆图：11 段国界 + 7 地区锚点 + 5 类边事 + 覆盖层开关）｜关键数据 `WORLD_BORDERS` **11 段**、`REGION_ANCHORS` **7 键**、`BORDER_INCIDENTS` **5 键**；导出 `window.WorldMap`（18 方法）+ `toggleMapOverlay` / `toggleMapOverlayFromSettings`
  接口 `window.WorldMap`（18）+ `toggleMapOverlay` / `toggleMapOverlayFromSettings`（后者是唯一有外部调用的一处，由设置页触发，实测 仙侠.html 有 1 处引用）｜依赖 `PSectWorld`、`currentMap`/`currentRegionForMap`、mapData、sectsData、locationSystem、localStorage/saveToStorage、getHouseSite、openWildernessMap｜事件：无
  缺口 `:12`/`:37`/`:280` 三处 DES-54 注释串起来记同一件事：「旧写法写死『半个时辰／一个时辰／两个时辰』，与真落笔的 30/30/60 分钟差一倍」已修 ⇒ 三处文案与 `mins` 字段曾长期不同步
  缺口 `WORLD_BORDERS` 11 段 / `REGION_ANCHORS` 7 键，与 `mapData` 的 10 个地区对不齐（锚点只 7 个）⇒ 舆图上有 3 个地区没有锚点（**无法判定**是否有意只锚玩家常去的 7 个）
  缺口 本文件直接读写 `localStorage` 与 `saveToStorage` 两套（REFS 里两者都在）⇒ 存档口径在同一文件内不统一

### js/npcs/（94 个 = 直接 91 + storylines-v2 子目录 3）— NPC

- `js/npcs/baihua-events-extra.js` :: baihua-events-extra.js - 温蘅日常/接近事件（bh_event_015~032） · 依赖：npcs/npc-personal-events.js、baihua-events-main.js（BAIHUA_NPC_ID）
  **机制**：数据表（294 行）· 关键数据 `BAIHUA_DAILY_EVENTS`(`:6`) **10 条** + `BAIHUA_APPROACH_EVENTS`(`:157`) **8 条** = **18 场 / 53 个选项**（bh_event_015~032，日常/接近向）· 对外接口 2 个（`window.BAIHUA_DAILY_EVENTS` / `BAIHUA_APPROACH_EVENTS`，`:289-292`）· 依赖 `baihua-events-main.js`（**必须在它之后加载**——本文件直接用 `BAIHUA_NPC_ID`，单独 eval 会抛 `BAIHUA_NPC_ID is not defined`，实测复现）· **缺口**：两个导出外部 0 引用
- `js/npcs/baihua-events-main.js` :: baihua-events-main.js - 温蘅主线情缘事件（bh_event_001~014） · 依赖：npcs/npc-personal-events.js · 加载顺序：在 npc-personal-events.js 之后、baihua-personal-events.js 之前
  **机制**：数据表（445 行）· 关键数据 三张子表 `BAIHUA_MAIN_EVENTS_A`(`:9`) **4 条** + `_B`(`:116`) **5 条** + `_C`(`:260`) **5 条**，在 `:431` 合并成 `BAIHUA_MAIN_EVENTS` **14 条**（bh_event_001~014 主线情缘）/ **44 个选项** · 对外接口 1 个（`window.BAIHUA_MAIN_EVENTS`）· 依赖 `npc-personal-events.js`（注册表 + `BAIHUA_NPC_ID` 由本文件 `:6` 定义 `sect_leader_百花谷`）· 加载顺序：在 `npc-personal-events.js` 之后 · **缺口**：拆成 A/B/C 三块是为了避开单文件体积，但对外仍合并成一个对象——**外部 0 引用**（只被 `:498 Object.assign(NPC_PERSONAL_EVENTS, ...)` 消费），拆分对消费者不可见
- `js/npcs/baihua-personal-events.js` :: baihua-personal-events.js - 温蘅线结局/注册/自动触发系统 v12.3 · 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
  **机制**：数据表 + 状态机（211 行）· 关键数据 `BAIHUA_ENDINGS`(`:8`) **6 个结局** · 对外接口 4 个（`window.BAIHUA_ENDINGS` / `window.maybeAutoTriggerBaihuaEvent` / `window.maybeAutoTriggerFeiLeiEvent` / 结局回调注册）· 事件 `timeSystem.onNewDaySubscribe` **2 处**（`:194` / `:197` 每日自动触发）· 依赖 `npc-personal-events.js`（`registerEndingSet` / `registerEndingCallback` / `canPlayerAccessPersonalEvent`）· **★ 本批唯一的例外**：`maybeAutoTriggerBaihuaEvent` / `maybeAutoTriggerFeiLeiEvent` 是**全部 37 个 `maybeAutoTriggerXxxEvent` 里唯二被外部文件调用的**（`sect-visit.js` 2 处）——其余 35 个只在本文件自调
- `js/npcs/city-residents-data.js` :: city-residents-data.js — 17 城具名人物（v21.5 空城补人） · 名字取自 cityData.specialNPCs 预留名单（此前只有名字没有实体），每人落成 SPECIAL_NPC_DATA 同构条目
  **机制**：纯数据表（IIFE，1420 行）· 关键数据 往 `window.CITY_RESIDENT_DATA.npcs` 写 **34 条**具名 NPC（id 形如 `cres_洛水城_1`），每人 15 字段同 `SPECIAL_NPC_DATA` 结构；覆盖 17 座人间城（洛水城/青木城/炎城/大漠孤城/冰原城/万毒谷/金城/剑阁 等），名字取自 `cityData.specialNPCs` 预留名单 · 对外接口 1 个（`window.CITY_RESIDENT_DATA`）· 依赖 无（纯数据）· 消费者 `city-residents.js`（并入注册表）、`city-residents-events.js`、`city-residents-data2.js` · **缺口**：`:1` 头注释「17 城具名人物」只说了城数没说人数——实测**每城 2 人共 34 条**
- `js/npcs/city-residents-data2.js` :: city-residents-data2.js — 6 城具名人物（v21.9 填后期空转） · v21.5 补了 17 座人间空城；本批补齐余下 6 城：帝都·长安、太虚山、四座位面城。 · 名字优先取 cityData.specialNPCs 预留名单；国师·元辰子是终局伏诛对象，不落街面
  **机制**：纯数据表（IIFE，510 行）· 关键数据 往同一个 `window.CITY_RESIDENT_DATA.npcs` 追加 **12 条**，补齐余下 6 城（帝都·长安 / 太虚山 / 四座位面城）；**国师·元辰子是终局伏诛对象，明确不落街面** · 对外接口 1 个（同上，共享 `CITY_RESIDENT_DATA`）· 依赖 `city-residents-data.js`（共享同一对象，须排在它之后）· 与 data.js 合计 **46 人 / 23 城**
- `js/npcs/city-residents-events.js` :: city-residents-events.js — 17 城进城遇人戏（v21.5 空城补人） · 每城一出一次性事件：进城次日随机撞见本城具名人物（NPC 实体由 city-residents-data.js 提供）
  **机制**：纯数据表（IIFE，457 行）· 关键数据 往 `window.CITY_RESIDENT_DATA.events` 写 **17 出**「进城遇人戏」（每城一出一次性事件，次日随机撞见本城具名人物，NPC 实体由 `city-residents-data.js` 提供）· 对外接口 1 个（共享 `window.CITY_RESIDENT_DATA`）· 依赖 `city-residents-data.js` · 缺口：`window.CITY_RESIDENT_DATA` 的具名导出外部 0 引用（只被 `city-residents.js` 读），events 子表由 `city-residents.js` 转成个人事件塞进 `NPC_PERSONAL_EVENTS`
- `js/npcs/city-residents-events2.js` :: city-residents-events2.js — 6 城进城遇人戏（v21.9 填后期空转） · v21.5 给 17 城各配了一出「进城遇人戏」；本批补齐余下 6 城（帝都·长安、太虚山、四座位面城）
  **机制**：纯数据表（IIFE，174 行）· 关键数据 **6 出**遇人戏（补帝都·长安 / 太虚山 / 四座位面城）· 对外接口 共享 `window.CITY_RESIDENT_DATA` · 依赖 `city-residents-events.js`（同一 events 表）· 与 events.js 合计 **23 出**
- `js/npcs/city-residents.js` :: city-residents.js — 城中人物接线（v21.5 空城补人） · 17 座空城此前只有 cityData.specialNPCs 里的名字，没有实体。本文件把
  **机制**：混合（接线层，92 行 · 本簇最小）· 关键数据 无自有表 · 对外接口 **3 个**：`window.getCityResidentCards`（**被 `location-system.js` 调，是本文件唯一业务出口**）/ `triggerPersonalEvent` / `hasEventTriggered`（从 `npc-personal-events.js` 搬进来给城中人物用）· 依赖 `city-residents-data.js` / `city-residents-data2.js`（NPC 实体）、`city-residents-events.js` / `events2.js`（遇人戏）· 机制：把 46 人的 `CITY_RESIDENT_DATA.npcs` 逐个并进 `SPECIAL_NPC_DATA` 注册表，并把 23 出遇人戏转成 `NPC_PERSONAL_EVENTS` 条目 —— **本文件是「城中人物」整簇与 NPC 主系统的唯一缝合点**
- `js/npcs/confession-rites.js` :: 定情之仪场景层（v26.2）· 深谈·爱情「倾诉心意」那一行文案扩成一场有幕有枝的仪：多幕推进、四结局由本体真实关系账判定（不是选项顺序，也不是骰子）· 玩家全程不说「喜欢」「爱」，只用名分/盟/信物/门规这些词 · 整册排除 37 位终章道侣，不夺主线感情线的主戏 · 加载顺序：**必须在 `js/npcs/npc-system.js` 之后**（门槛与名册都取自它），落点见下方「加载位置」
  **机制摘要**（实测 **699 行 / 36.1 KB**（`Get-Content` 数 698，差 1 为末行无换行）· 类型：判定函数 + 渲染层（IIFE，`(function(global){…})(window)`，11 段 `// ====` 分隔）｜实测骨架数字：**顶层 function 25 个 + 内嵌 2 个 = 27 个**、`window` 导出 **1 个**（`window.ConfessionRites`，**12 键**：`GATE / ENDINGS / NODES / gate / resolve / offer / pick / close / ledger / spentOf / _reset / _import`）、**场景节点 13 个**（`NODES`）、**选项 27 个**（4 条起幕各 2~3 项 + 锁屏/结局出口）、**结局 4 个**（`ENDINGS`）、**瑕疵/名分表 2 键**（`TABOO_LINES.master / .bound`）、`catch` **13 处 / 空 catch 0 处**、`console.warn('[静默失败] …')` **18 处**）
  **按系统拆**：① **门槛表**（`:23-29` `GATE` **6 个**：`MIN_AFFECTION 60`（同 `npc-system.js:132` `EMOTION_TYPES.confess`）/ `PLEDGE_AFFECTION 70`（同 `:133` intimate 档）/ `PLEDGE_TRUST 40`（同 `:104` 过往经历档）/ `PLEDGE_RESPECT 60`（同 `:1206` 追随者档）/ `HATRED_CUT 30`（同 `:1204` 恨意分界）/ `MIN_MEETS 3`）—— **不自造口径，全部挂在本体已在用的数上**；② **结局表**（`:32-53` `ENDINGS` **4 个**：pledge 盟约 `bond:true` / defer 请君先立 / taboo 名分之辨 / parting 各珍其道，各带 `ledger` 四轨增量）；③ **场景图**（`:117-…` `NODES` **13 个**：`x_lock` 锁屏 + `a_open/a_ask/a_haste/a_confide/a_oath/a_holdoff` 盟约线 7 个 + `b_open/b_probe/b_humble` 请君先立线 3 个 + `c_open/c_argue` 名分线 2 个 + `p_open` 旧恨线 1 个，**选项 27 个**）；④ **判定脊柱**（`:299-360` `resolve` → `:364-373` `endingOf` → `:653-662` `gate` / `:666-683` `offer`）；⑤ **写账**（`:376-391` `applyLedger`，只经本体正门 `changeAffection/changeTrust/changeRespect/changeLove`，**不直接赋 `relationship` 字段**）；⑥ **结账**（`:602-639` `settleEnding`：落 `dao_companion` 旗 + `_loveAccepted_confess` 承诺旗 + `ensureDaoBond` 名册 + `showMessage` 结语 + `advanceTime(60)` 占一个时辰 + 重开 NPC 对话）；⑦ **存档**（`:431-432` `StateRegistry.register('confessionRites', …)`，**不开新 localStorage 键**）；⑧ **渲染**（`:505-553` `_render/_bubble/_ledgerLine`，出 `.confession-rite-modal`）
  **接口** `window.ConfessionRites` 12 键（真出口：`offer` ← `npc-system.js:3221` 接缝、`pick` ← 面板 `onclick`、`temper`—无、`gate`/`resolve`/`spentOf` ← UI 与测试）｜**依赖** `npc-system.js`（`NPC` 类与四轨关系账、`executeEmotionInteraction` 的 confess 档、`window.BOND_DAO_FINAL_CHAPTER` 37 人名册——`:3169` 才把它从私变量挂成 window，场景层 `:74 finalChapterOf` 读的就是它）、`core/state-registry.js`（存档正门）、`core/dao-bridge.js` 的 `ensureDaoBond`（旗与册同源）、`sect-kin.js` 的 `getMyNamedDisciples`（师徒判定）、`timeSystem.getAbsoluteDay / advanceTime`、`showMessage / showNPCDialog`｜**事件** 本层**不发也不订**任何 EventBus 事件（0 处 emit / 0 处 on）—— 它由深谈子选项的 onclick 自驱
  **★ 加载位置（本批唯一改动就是把它挂上）**：`scripts.manifest.json` entries **下标 134**（`js/npcs/npc-system.js` 在 133，其后即本层）；`仙侠.html:2089`（`npc-system.js` 在 2088，第 7 层「NPC系统」内，`skill-transmission.js` 顺移到 2090）。改法走工具 `python tools/refactor/manifest-scripts.py gen --force`（HTML 整段由 manifest 重渲染，但因改前二者逐字节同步，**净变化只有新增这 1 行**，已 `Compare-Object` 逐行核过）；`check` 绿、script 数 **350 → 351**。**此前它写完却不在任何加载序列里**——上一批 109 条断言与实测都是 `fetch + eval` 注入跑的，真实页面玩家点不到任何一场仪；防摘回归见 `tests/v26.3-rites-mount-node.js`（23 条，读码 + HTML/manifest 互校）
  **缺口 1（入口太窄）** → 全工程只有**一个**入口：深谈 → 爱情 → 倾诉心意（`npc-system.js:3217`）。本层**没有可发现性提示行**——玩家不知道有这场仪；面板上「倾诉心意」仍是原来那五个子选项之一
  **缺口 2（请君先立只此一次）** → `spentOf` 判过的 NPC 再点只复述结局（`:673-679`「这一场你已开过——「请君先立」之后，夜里就不必再走这一趟了」），账涨到门槛也不重开 ⇒ 有意为之（怕开刷分口子），但也意味着**「补齐敬重与信任后转盟约」这条路在真机上走不到第二次**
  **缺口 3（可结契面窄）** → 可结契对象只有**名册外的 34 位具名城民 + 初始 NPC + 通用 NPC**；36 位掌门/终章女主整册排除（`resolve` 第一道 `final_chapter`，实测 `竺照禅` → 「这一盟由终章「骂不出」定局」）⇒ **掌门线玩家体验不到这层**
  **缺口 4（hatred 档只有单向出路）** → 恨过 30 线只给 parting 一条出路，**旧恨没有消解路径**（属 `jealousy-deep` / `npc-rel-events` 地盘）
  **缺口 5（温养式无冷却）** → `offer` 无冷却无次数上限，理论上能连点轮换
  **缺口 6（结局只在结局幕落账）** → `pick:560-564`：结局只在结局幕点「走出门去」时 `markSpent + settleEnding`；**中途按 × 关窗 → 结局不落、门不锁**，但每一步选项的 `d` 增量已即时写进关系账（`:576`）⇒ 半途中退有「半场收益」且无冷却（实测 merchant_01 / villager_01 复现）
- `js/npcs/crime-works.js` :: v27.4 黑道与断案批 · 黑道营生名册（新文件 crime-works.js） · 设计方案 E 引擎：67 扒窃 · 68 盗墓 · 69 伪造盐引（原「贩私盐」撞车盐路官私两道，换血） · 70 夹带私货过城门（v26.1 城门闸接口）· 71 落草收保护费（多日程独立名册）· 72 伪造路引
  **机制**：数据表 + 判定函数（IIFE，711 行）· 关键数据 `PICK_*` **5 项**（67 扒窃）/ `DIG_*` **5 项**（68 盗墓）/ `FS_*` **4 项**（69 伪造盐引）/ `FP_*` **4 项**（70 夹带私货过城门）/ `FF_*` **4 项**（72 伪造路引）+ 71 落草收保护费（多日程独立名册）· 对外接口 **16 个** · 依赖 `npc-crime.js`（`NpcCrime` / `settleBountyHunt`）、`npc-system.js`（`bountyRealmMul`）、`crime-works` 与 `v26.1` 城门闸接口 · 头注释「69 伪造盐引（原『贩私盐』撞车盐路官私两道，换血）」——**命名撞车的历史已处理**
- `js/npcs/daqi-events.js` :: daqi-events.js - 樊惊筹线情缘事件/结局/性别语境 v1.0（大旗门男主扩线） · 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
  **机制**：数据表 + 状态机（同构模板）· 关键数据 `DQ_MAIN_EVENTS` **14 场** + `DQ_ENDINGS` **6 个结局** + `DQ_GENDER_CTX_EVENTS` **2 场** = 运行时注册 **16 场**
  **对外接口**：`window.DQ_NPC_ID` / `DQ_MAIN_EVENTS` / `DQ_ENDINGS` / `maybeAutoTriggerDqEvent`（4 个）· **事件**：`timeSystem.onNewDaySubscribe` 每日自动触发 1 处 · **依赖**：`npc-personal-events.js`（`NPC_PERSONAL_EVENTS` / `registerEndingSet` / `registerEndingCallback` / `canPlayerAccessPersonalEvent` / `triggerPersonalEvent`）· 本线定位：大旗门男主扩线
  **已知缺口**：四个 `window` 导出外部 0 引用——但 `:53x` 的每日钩子与 `:49x` 的 `Object.assign(NPC_PERSONAL_EVENTS, ...)` 在本文件内消费，**不是死代码**（判「死」必须回原文件核调用点，倒排索引看不到字符串字面量）。　每日触发是否先判地点：**否**——35 个同构文件里只有 3 个这么写，口径不统一（不判的那 32 个靠 `npcManager.getNPC(id)` 拿不到人就 return，效果等价但多一次无用查询）
- `js/npcs/data.js` :: js/npcs/data.js - NPC预设数据 · Phase 1: 首批10个核心NPC
  **机制**：纯数据表（832 行 / 24 KB）· 关键数据 `NPC_DATA`(`:6`) **10 条**（mentor_01…mysterious_01，与 `special-npcs.js` 的 `SPECIAL_NPC_DATA` **前 10 条同名同 id**），每条 15 字段（含 `personalityBig5` / `combat` / `profession` / `preferences` / `schedule` / `dialogueTree`）· 对外接口 `window.NPC_DATA` **1 个** · 依赖 无 · **★ 已知缺口（三条都实测确认）**：① **`NPC_DATA` 全仓 0 引用** —— 832 行 / 24 KB 整体是死数据（倒排索引：只有本文件 2 处自引用）；② 与 `special-npcs.js` 的 `SPECIAL_NPC_DATA` 是**分叉后各自漂移的重复实现**：10/10 条 id 相同但**每条字节数都不同**（data.js 2094~2978 字节，special-npcs 侧 2566~3128 字节，每条多 150~360 字节），说明拆出后两边各改各的、**改一处不会带动另一处**；③ `special-npcs.js:3` 头注释「从data.js拆出，独立加载」——**拆分已完成但源文件没删**，两份同 id 数据同时挂载在 `window` 上（`NPC_DATA` 与 `SPECIAL_NPC_DATA`），后加载的 `special-npcs.js` 不会覆盖前者（不同变量名），靠 `npc-system.js` 只读 `SPECIAL_NPC_DATA` 才没出事
- `js/npcs/dayin-events.js` :: dayin-events.js - 隗九爻线情缘事件/结局/性别语境 v1.0（大隐阁隐士扩线） · 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
  **机制**：数据表 + 状态机（同构模板）· 关键数据 `DY_MAIN_EVENTS` **14 场** + `DY_ENDINGS` **6 个结局** + `DY_GENDER_CTX_EVENTS` **2 场** = 运行时注册 **16 场**
  **对外接口**：`window.DY_NPC_ID` / `DY_MAIN_EVENTS` / `DY_ENDINGS` / `maybeAutoTriggerDyEvent`（4 个）· **事件**：`timeSystem.onNewDaySubscribe` 每日自动触发 1 处 · **依赖**：`npc-personal-events.js`（`NPC_PERSONAL_EVENTS` / `registerEndingSet` / `registerEndingCallback` / `canPlayerAccessPersonalEvent` / `triggerPersonalEvent`）· 本线定位：大隐阁隐士扩线
  **已知缺口**：四个 `window` 导出外部 0 引用——但 `:53x` 的每日钩子与 `:49x` 的 `Object.assign(NPC_PERSONAL_EVENTS, ...)` 在本文件内消费，**不是死代码**（判「死」必须回原文件核调用点，倒排索引看不到字符串字面量）。　每日触发是否先判地点：**否**——35 个同构文件里只有 3 个这么写，口径不统一（不判的那 32 个靠 `npcManager.getNPC(id)` 拿不到人就 return，效果等价但多一次无用查询）
- `js/npcs/disguise-system.js` :: v26.0 六路营生批（第一百五十一批 · 用户点单）· 易容改名账 · 用户点单：「易容改名肯定要很困难，而且通缉也分类型——对方没看到脸就只能靠特质认，极难； · 脸被看到过就很麻烦了。」本账把这两句落成两本真账
  **机制**：混合（数据表 + 判定函数，307 行）· 关键数据 `HEAT_REFUSE`（热度太高不给易容）/ `REROLL_MAX`（改名次数上限）/ `SPOT_NOTO_MUL` / `SPOT_FACE_MUL` / `SPOT_BLIND_MUL` / `SPOT_HEAT` —— 实现用户点单的两句话：「对方没看到脸就只能靠特质认，极难；脸被看到过就很麻烦了」落成两本真账（通缉分「没见到脸」与「见到脸」两档）· 对外接口 **6 个 `window.` 导出**，其中真出口是 `window.Disguise` 状态对象（被 `street-life.js` / `city-gate.js` / `npc-crime.js` 读）· 依赖 `npc-crime.js`（热度）· **入口链**：`:298 window.Disguise` 对象的 `open` 方法（`:302`）→ `street-life.js:179` 的内联 `onclick="Disguise.open()"` 是面板入口；`Disguise.active` 被 `city-gate.js:93` / `npc-crime.js:228/:252/:338` 四处读（画像档戴面具减半），`Disguise.marketOk` 被 `street-life.js:179` 读· **★ 已知缺口**：`:305 window.openDisguiseAlley = function () { return open(); }` 这个别名**全仓 0 引用**（面板走的是 `Disguise.open` 对象形式）—— 是多余全局，不是死功能
- `js/npcs/duel-showcases-1.js` :: duel-showcases-1.js - 双人高光对局·卷一 v20.80 · 依赖：npc-personal-events.js（NPC_PERSONAL_EVENTS / canPlayerAccessPersonalEvent / triggerPersonalEvent）、
  **机制**：数据表（266 行 · 四卷中最厚）· 关键数据 `DUEL_SHOWCASES_1`(`:31`) **4 桩**双人高光对局（翻译大战 / 公文互批 / 对账 / 辩戒）· 对外接口 1 个 · 依赖 `npc-personal-events.js`（`NPC_PERSONAL_EVENTS` / `canPlayerAccessPersonalEvent` / `triggerPersonalEvent`）· 机制：`guestId` + `requireGuestFeelings` 双门禁（**必须先认识情敌且对方有 feelings 才放行**）、`asNpc` 琥珀气泡区分说话人 · 四卷合计 **16 桩**
- `js/npcs/duel-showcases-2.js` :: duel-showcases-2.js - 双人高光对局·卷二 v20.80 · 依赖与机制同卷一（duel-showcases-1.js）：guestId + requireGuestFeelings 门禁、asNpc 琥珀气泡、
  **机制**：数据表（214 行）· 关键数据 `DUEL_SHOWCASES_2`(`:22`) **4 桩**（茶棚旧账 / 掰腕子 / 两卦皆凶 / 剑舞正名）· 对外接口 1 个 · 机制同卷一（`guestId` + `requireGuestFeelings` 门禁、`asNpc` 琥珀气泡）
- `js/npcs/duel-showcases-3.js` :: duel-showcases-3.js - 双人高光对局·卷三 v20.83 · 依赖与机制同卷一（duel-showcases-1.js）：guestId + requireGuestFeelings 门禁、asNpc 琥珀气泡、
  **机制**：数据表（215 行）· 关键数据 `DUEL_SHOWCASES_3`(`:22`) **4 桩**（脉案双份 / 戒尺与条陈 / 剑鸣与琴音 / 空凳与缺页）· 对外接口 1 个 · 机制同卷一
- `js/npcs/duel-showcases-4.js` :: duel-showcases-4.js - 双人高光对局·卷四 v20.83 · 依赖与机制同卷一（duel-showcases-1.js）：guestId + requireGuestFeelings 门禁、asNpc 琥珀气泡、
  **机制**：数据表（214 行）· 关键数据 `DUEL_SHOWCASES_4`(`:22`) **4 桩**（火色与曙光 / 针囊与炉火 / 道别与不送 / 批注与灶）· 对外接口 1 个 · 机制同卷一 · **自动触发**：四卷共用卷一的每日兜底钩子（`duel-showcases-1.js:233 onNewDaySubscribe`），卷 2/3/4 **有意不各挂一份**（`duel-showcases-2.js:209` 注释「每日兜底钩子在卷一，两卷共用」）—— 钩子不读主人线终章，只认「人在主人门中 + 门禁全过（含来客对你有心）+ 低概率」，一天至多一桩。**这不是缺口，是刻意收敛**
- `js/npcs/emei-events.js` :: emei-events.js - 夙孤鸿线情缘事件/结局/性别语境 v1.0（v20.72 第三批扩线） · 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
  **机制**：数据表 + 状态机（同构模板）· 关键数据 `EM_MAIN_EVENTS` **14 场** + `EM_ENDINGS` **6 个结局** + `EM_GENDER_CTX_EVENTS` **2 场** = 运行时注册 **16 场**
  **对外接口**：`window.EM_NPC_ID` / `EM_MAIN_EVENTS` / `EM_ENDINGS` / `maybeAutoTriggerEmEvent`（4 个）· **事件**：`timeSystem.onNewDaySubscribe` 每日自动触发 1 处 · **依赖**：`npc-personal-events.js`（`NPC_PERSONAL_EVENTS` / `registerEndingSet` / `registerEndingCallback` / `canPlayerAccessPersonalEvent` / `triggerPersonalEvent`）· 本线定位：峨眉派女主扩线
  **已知缺口**：四个 `window` 导出外部 0 引用——但 `:53x` 的每日钩子与 `:49x` 的 `Object.assign(NPC_PERSONAL_EVENTS, ...)` 在本文件内消费，**不是死代码**（判「死」必须回原文件核调用点，倒排索引看不到字符串字面量）。　每日触发是否先判地点：**否**——35 个同构文件里只有 3 个这么写，口径不统一（不判的那 32 个靠 `npcManager.getNPC(id)` 拿不到人就 return，效果等价但多一次无用查询）
- `js/npcs/feixie-events.js` :: feixie-events.js - 拓银沙线情缘事件/结局/性别语境 v1.0（飞蝎坞扩线·反派阵营线） · 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
  **机制**：数据表 + 状态机（同构模板）· 关键数据 `XIE_MAIN_EVENTS` **14 场** + `XIE_ENDINGS` **6 个结局** + `XIE_GENDER_CTX_EVENTS` **2 场** = 运行时注册 **16 场**
  **对外接口**：`window.XIE_NPC_ID` / `XIE_MAIN_EVENTS` / `XIE_ENDINGS` / `maybeAutoTriggerXieEvent`（4 个）· **事件**：`timeSystem.onNewDaySubscribe` 每日自动触发 1 处 · **依赖**：`npc-personal-events.js`（`NPC_PERSONAL_EVENTS` / `registerEndingSet` / `registerEndingCallback` / `canPlayerAccessPersonalEvent` / `triggerPersonalEvent`）· 本线定位：飞蝎坞·反派阵营线
  **已知缺口**：四个 `window` 导出外部 0 引用——但 `:53x` 的每日钩子与 `:49x` 的 `Object.assign(NPC_PERSONAL_EVENTS, ...)` 在本文件内消费，**不是死代码**（判「死」必须回原文件核调用点，倒排索引看不到字符串字面量）。　每日触发是否先判地点：**否**——35 个同构文件里只有 3 个这么写，口径不统一（不判的那 32 个靠 `npcManager.getNPC(id)` 拿不到人就 return，效果等价但多一次无用查询）
- `js/npcs/gaibang-events.js` :: gaibang-events.js - 桑拾玖线情缘事件/结局/性别语境 v1.0（v20.76 丐帮扩线） · 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
  **机制**：数据表 + 状态机（同构模板）· 关键数据 `GAI_MAIN_EVENTS` **14 场** + `GAI_ENDINGS` **6 个结局** + `GAI_GENDER_CTX_EVENTS` **2 场** = 运行时注册 **16 场**
  **对外接口**：`window.GAI_NPC_ID` / `GAI_MAIN_EVENTS` / `GAI_ENDINGS` / `maybeAutoTriggerGaiEvent`（4 个）· **事件**：`timeSystem.onNewDaySubscribe` 每日自动触发 1 处 · **依赖**：`npc-personal-events.js`（`NPC_PERSONAL_EVENTS` / `registerEndingSet` / `registerEndingCallback` / `canPlayerAccessPersonalEvent` / `triggerPersonalEvent`）· 本线定位：丐帮扩线
  **已知缺口**：四个 `window` 导出外部 0 引用——但 `:53x` 的每日钩子与 `:49x` 的 `Object.assign(NPC_PERSONAL_EVENTS, ...)` 在本文件内消费，**不是死代码**（判「死」必须回原文件核调用点，倒排索引看不到字符串字面量）。　每日触发是否先判地点：**否**——35 个同构文件里只有 3 个这么写，口径不统一（不判的那 32 个靠 `npcManager.getNPC(id)` 拿不到人就 return，效果等价但多一次无用查询）
- `js/npcs/hengshan-beiyue-events.js` :: hengshan-beiyue-events.js - 祁清禅线情缘事件/结局/性别语境 v1.0（恒山扩线） · 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
  **机制**：数据表 + 状态机（同构模板）· 关键数据 `HENG_MAIN_EVENTS` **14 场** + `HENG_ENDINGS` **6 个结局** + `HENG_GENDER_CTX_EVENTS` **2 场** = 运行时注册 **16 场**
  **对外接口**：`window.HENG_NPC_ID` / `HENG_MAIN_EVENTS` / `HENG_ENDINGS` / `maybeAutoTriggerHengEvent`（4 个）· **事件**：`timeSystem.onNewDaySubscribe` 每日自动触发 1 处 · **依赖**：`npc-personal-events.js`（`NPC_PERSONAL_EVENTS` / `registerEndingSet` / `registerEndingCallback` / `canPlayerAccessPersonalEvent` / `triggerPersonalEvent`）· 本线定位：恒山扩线
  **已知缺口**：四个 `window` 导出外部 0 引用——但 `:53x` 的每日钩子与 `:49x` 的 `Object.assign(NPC_PERSONAL_EVENTS, ...)` 在本文件内消费，**不是死代码**（判「死」必须回原文件核调用点，倒排索引看不到字符串字面量）。　每日触发是否先判地点：**否**——35 个同构文件里只有 3 个这么写，口径不统一（不判的那 32 个靠 `npcManager.getNPC(id)` 拿不到人就 return，效果等价但多一次无用查询）
- `js/npcs/hengshan-nanyue-events.js` :: hengshan-nanyue-events.js - 奚湘筠线情缘事件/结局/性别语境 v1.0（衡山·南岳扩线） · 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
  **机制**：数据表 + 状态机（同构模板）· 关键数据 `XIANG_MAIN_EVENTS` **14 场** + `XIANG_ENDINGS` **6 个结局** + `XIANG_GENDER_CTX_EVENTS` **2 场** = 运行时注册 **16 场**
  **对外接口**：`window.XIANG_NPC_ID` / `XIANG_MAIN_EVENTS` / `XIANG_ENDINGS` / `maybeAutoTriggerXiangEvent`（4 个）· **事件**：`timeSystem.onNewDaySubscribe` 每日自动触发 1 处 · **依赖**：`npc-personal-events.js`（`NPC_PERSONAL_EVENTS` / `registerEndingSet` / `registerEndingCallback` / `canPlayerAccessPersonalEvent` / `triggerPersonalEvent`）· 本线定位：衡山·南岳扩线
  **已知缺口**：四个 `window` 导出外部 0 引用——但 `:53x` 的每日钩子与 `:49x` 的 `Object.assign(NPC_PERSONAL_EVENTS, ...)` 在本文件内消费，**不是死代码**（判「死」必须回原文件核调用点，倒排索引看不到字符串字面量）。　每日触发是否先判地点：**否**——35 个同构文件里只有 3 个这么写，口径不统一（不判的那 32 个靠 `npcManager.getNPC(id)` 拿不到人就 return，效果等价但多一次无用查询）
- `js/npcs/heroine-aftermath.js` :: heroine-aftermath.js - 道侣回访（结契后）事件 v1.0 · 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / triggerPersonalEvent /
  **机制**：数据表（628 行）· 关键数据 `AFTERMATH_EVENTS`(`:22`) **20 场**道侣回访（结契后）· 对外接口 2 个 · 事件 每日钩子 1 处 · 依赖 `heroine-rivalry.js` 的 **`window.HEROINE_ROSTER`**（读 `amId` / `finaleId`）、`npc-system.js`（`dao_companion` flag）· 加载顺序：16 位男主事件文件 + `male-lead-rivalry.js` 之后 · **依赖注释自陈历史坑**：「旧条目缺 amId/finaleId 两字段，回访事件一直触发不了的死路，此处一并修通」——**这是本批唯一一处「依赖字段缺失导致整簇事件不可达」的已修记录**
- `js/npcs/heroine-female-context.js` :: heroine-female-context.js - 女修同修语境事件 v1.0 · 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / triggerPersonalEvent /
  **机制**：数据表（171 行）· 关键数据 `FEM_CTX_EVENTS`(`:11`) **4 场**女修同修语境（**仅女玩家可见**，运行时不校验性别、靠 `canPlayerAccessPersonalEvent` 的性别门禁）· 对外接口 1 个 · 事件 每日钩子 1 处 · 依赖 `npc-personal-events.js`
- `js/npcs/heroine-male-context.js` :: heroine-male-context.js - 男修追女掌门语境事件 v1.0 · 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / triggerPersonalEvent /
  **机制**：数据表（176 行）· 关键数据 `MALE_CTX_EVENTS`(`:17`) **4 场**男修追女掌门语境（**仅男玩家**）· 对外接口 1 个 · 事件 每日钩子 1 处 · 依赖 `npc-personal-events.js` · 与 `heroine-female-context.js` 是一对性别镜像（4 vs 4 场对等）
- `js/npcs/heroine-rivalry-bridge.js` :: heroine-rivalry-bridge.js - 情敌和解/亲密系统 v1.0 · 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / triggerPersonalEvent /
  **机制**：数据表 + 判定函数（719 行）· 关键数据 `HEROINE_BRIDGE_EVENTS`(`:56`) **20 场论交/和解**（**全部 `requireRivalRomance: true`**）+ `_BRIDGE_TIER_MSGS`(`:455`) **20 人分层文案** · 对外接口 **8 个** · 依赖 `heroine-rivalry.js` / `npc-personal-events.js` · 机制：情敌和解/亲密三档（`getHeroinePairRelation`(`:18`) 读当前档 → `initHeroinePairIfNeeded`(`:32`) 补建对 → 结算后 `:625/:636` 回读前后差）· **缺口**：`getHeroinePairRelation` / `initHeroinePairIfNeeded` / `HEROINE_BRIDGE_EVENTS` 外部 0 引用（两函数在本文件内 6 处自调，属接口卫生问题）
- `js/npcs/heroine-rivalry.js` :: heroine-rivalry.js - 女主角吃醋/互动系统 v1.0 · 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / triggerPersonalEvent /
  **机制**：数据表 + 判定函数（1895 行）· 关键数据 `HEROINE_ROSTER`(`:36`) **20 位女主**（每条带 `amId` / `finaleId` 两字段，v20.73 补的——`heroine-aftermath.js` 的道侣回访钩子读的就是这本名册，旧条目缺字段导致回访事件一直触发不了）· `HEROINE_RIVALRY_EVENTS`(`:77`) **20 场对峙** + `HEROINE_RECONCILE_EVENTS`(`:949`) **20 场和好** = **40 场 / 120 个选项**，**全部 `requireRivalRomance: true`** · 对外接口 **5 个** · 依赖 `npc-personal-events.js` / `npc-system.js`（`npc.hasFlag('dao_companion')` / `npc.memory._loveAccepted_confess`）· 设计宪法：吃醋由**真实关系状态**驱动（玩家已与他人表白成功或结为道侣才触发），**无人为计数器**；每位女主对情敌只对峙一次，由 `personalEventFlags` 一次性标记；场景文本泛指「你心里那位」，具体情敌名在 effects 反应文里由 `detectRivalRomance` 动态点出
- `js/npcs/huashan-events.js` :: huashan-events.js - 竺听雨线情缘事件/结局/性别语境 v1.0（v20.72 第三批扩线） · 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
  **机制**：数据表 + 状态机（同构模板）· 关键数据 `HS_MAIN_EVENTS` **14 场** + `HS_ENDINGS` **6 个结局** + `HS_GENDER_CTX_EVENTS` **2 场** = 运行时注册 **16 场**
  **对外接口**：`window.HS_NPC_ID` / `HS_MAIN_EVENTS` / `HS_ENDINGS` / `maybeAutoTriggerHsEvent`（4 个）· **事件**：`timeSystem.onNewDaySubscribe` 每日自动触发 1 处 · **依赖**：`npc-personal-events.js`（`NPC_PERSONAL_EVENTS` / `registerEndingSet` / `registerEndingCallback` / `canPlayerAccessPersonalEvent` / `triggerPersonalEvent`）· 本线定位：华山派扩线
  **已知缺口**：四个 `window` 导出外部 0 引用——但 `:53x` 的每日钩子与 `:49x` 的 `Object.assign(NPC_PERSONAL_EVENTS, ...)` 在本文件内消费，**不是死代码**（判「死」必须回原文件核调用点，倒排索引看不到字符串字面量）。　每日触发是否先判地点：**否**——35 个同构文件里只有 3 个这么写，口径不统一（不判的那 32 个靠 `npcManager.getNPC(id)` 拿不到人就 return，效果等价但多一次无用查询）
- `js/npcs/item-tags.js` :: item-tags.js - 物品 → NPC 送礼偏好标签 · 标签一律取自物品表的显式字段（category / subtype / element），不按展示名推断； · ITEM_GIFT_TAG_OVERRIDES 只收「字段表达不出来的那几件」（药酒、解毒丹），按物品 id 声明
  **机制**：数据表 + 判定函数（140 行 · 本批最小之一）· 关键数据 6 张表：`ITEM_CATEGORY_TAGS` **7 类目** / `ITEM_SUBTYPE_TAGS` **18 子类** / `ITEM_ELEMENT_TAGS` **4** / `ELEMENT_MATERIAL_TAGS` **4** / `ITEM_GIFT_TAG_OVERRIDES` **5 件**（药酒、解毒丹等「字段表达不出来的那几件」，按物品 id 声明）/ `SWING_DAMAGE_TYPES` · 3 个函数：`elementOf` / `getItemNPCTags(itemId)` / `checkNPCLikeItem(npc, item)` · 对外接口 **5 个** `window.` 导出，**唯一被外部读的是 `checkNPCLikeItem`（app.js 调）** · 依赖 `items.js` / `items-extended.js` 的 `category` / `subtype` / `effect.element` / `damageType` 显式字段 · **纪律**：标签一律取自物品表显式字段，**不按展示名推断**；现有测试断言「在册 512 件物品零漏网」「类目×物品配对数 1043 ≥ 300」，并断言「冰属性材料/佛经/赃物/现代法器」4 类**仍无显式标签背书**（当前 0 命中）· **缺口**：4 张数据表 + `getItemNPCTags` 外部 0 引用（只被 `checkNPCLikeItem` 内部读，属正常内聚，非死代码）
- `js/npcs/jealousy-assembly.js` :: jealousy-assembly.js - 声口装配引擎（情缘二期）v20.83 · 依赖：jealousy-social.js（_jealAllRivals / _jealHasFeelings / _jealGuestInfo / _jealEnsureAcquaintance /
  **机制**：判定函数（IIFE，546 行）· 关键数据 `ASM_VOICE_BLOCKS` **声口档案 37 人 × 6 段**（每人 6 段声口，运行时 console 自报「声口档案 37 人 × 6 段」）；两个 composer：`composePairDuel`(`:357`) / `composePairAftermath`(`:440`) + 三个私有 `_asmHasVoice` / `_asmTryCompose` / `_asmLedgerAdd` · 对外接口 **13 个** · 依赖 `jealousy-social.js`（七个 `_jeal*`）、`npc-personal-events.js` · 机制：把两两吃醋现场按声口档案拼台词 · **缺口**：6 个导出的 composer 外部 0 引用，但 `:491/:512/:537` 经 `window.` 前缀**在本文件内自调**（`_asmFire(window.composePairDuel(...))`）—— 是「导了只给自己用」的多余全局，不是死代码
- `js/npcs/jealousy-collective.js` :: jealousy-collective.js - 集体大戏 + 风评传闻网（情缘三期）v20.84 · 依赖：jealousy-social.js（_jealAllRivals / _jealHasFeelings / _jealGuestInfo / _jealEnsureAcquaintance /
  **机制**：判定函数（IIFE，650 行）· 关键数据 四个集体大戏 composer：`composeLanternNight`(`:298` 灯夜撞约) / `composeArenaStand`(`:373` 看台变色) / `composeMarketClash`(`:424` 坊市撞礼) / `composeWeddingFinale`(`:490` 道侣大典) + 风评传闻网（`_rumorActive` / `_rumorTick` / `_collectiveLedgerGet` / `_collectiveDaoId` 四个私有）· 对外接口 **17 个** · 依赖 `jealousy-social.js`（含 `_jealPartySuspects`）/ `jealousy-assembly.js`（`ASM_VOICE_BLOCKS`）· console 自报「三期引擎加载完成：四幕 + 风评传闻网」 · **缺口**：四个 composer 外部 0 引用，但 `:600/:611/:618/:636` 在本文件内自调（同 jealousy-assembly，属接口卫生问题非死代码）
- `js/npcs/jealousy-deep.js` :: jealousy-deep.js - 吃醋事件扩容包 v20.30（已接线） · 已挂载：仙侠.html 中排在 male-lead-reconcile.js 之后（二十人全局 detectRivalRomance 就位后加载）
  **机制**：数据表（**6104 行 · 全批最厚**）· **5 张表 × 36 人 = 运行时注册 180 场事件 / 504 个选项**（实测）。表结构：`JEALOUSY_PROBE_EVENTS`(`:103`) **36**「试探」+ `JEALOUSY_COLD_EVENTS`(`:1585`) **36**「敲打」+ `JEALOUSY_AFTERMATH_EVENTS`(`:4300`) **36**「余波」（由 `_mkAfterEvent` 工厂生成，读 `JEAL_AFTER_NARR`/`_STATUS`/`_SPENT`/`_CHOICES` 四张 36 人文案表）+ `JEALOUSY_SULK_EVENTS`(`:4369`) **36**「小心眼」+ `JEALOUSY_NEGLECT_EVENTS`(`:5617`) **36**「被晾」（由 `_mkNeglectEvent` 生成）· 另有 `JEALOUSY_SEC_PREFIX`(`:50`) **11** 场专属前缀
  **机制**：`requireRivalRomance`（`detectRivalRomance` 检出真实情敌才放行）+ `requireFestivalWound`（节庆旧伤未愈才放行）双门禁；辅助 `_jealFindWound`(`:5679`) / `_jealFindStaleWound`(`:5909`) / `_jealLetterBody`(`:5946`) / `_jealNeglectDue`(`:5568`) / `_jealTrustDiscount` 五个下划线私有函数 · 对外接口 **12 个 `window.` 导出** · 加载顺序：`male-lead-reconcile.js` 之后（二十人全局 `detectRivalRomance` 就位后）· 依赖 `jealousy-social.js`（`_jeal*` 底层 + 36 人名册）、`npc-personal-events.js` · **★ 已知缺口**：① **门禁口径不一致** —— `requireRivalRomance: true` 全文件只出现 **108 次**（= 试探36 + 敲打36 + 小心眼36），而 `_mkAfterEvent` / `_mkNeglectEvent` 工厂生成的**余波 36 + 被晾 36 共 72 场不带该字段**；同属「吃醋线」却分两套门禁，改情敌探测逻辑时前者会跟着动、后者不会；② 5 张表 + 4 张文案表 + 4 个生成表共 **14 张表全在同一文件**，180 场事件是 36 人 × 5 档的机械复制（每档一人一条），改一个共同机制要动 36 处；③ 头注释逐批追加了 5 批共 35 人的**声口铁律**（每人禁字/信物/专用动作），这些约束**只写在注释里，代码侧没有任何断言校验**——改文案时违反铁律不会被任何测试拦下
- `js/npcs/jealousy-social.js` :: jealousy-social.js - 吃醋关系网引擎 v20.80 · 挂载于：jealousy-deep.js / heroine-aftermath.js 之后（三十六人名册与全局 detectRivalRomance 就位后加载）
  **机制**：判定函数（IIFE，330 行）· 关键数据 `JEAL_SOCIAL_PRESET_DEFS` / `JEAL_SOCIAL_VILLAIN_SECTS`（预设旧识 5 对 + 大名单含破戒僧）· 对外接口 **13 个 `window.` 导出** · 依赖 `special-npcs.js`（`SPECIAL_NPC_DATA` / `SPECIAL_NPC_DEFINITIONS` 建 36 人名册）· 加载顺序：`jealousy-deep.js` / `heroine-aftermath.js` 之后 · **本文件是整个吃醋子系统的地基**：`_jealAllRivals` / `_jealHasFeelings` / `_jealGuestInfo` / `_jealEnsureAcquaintance` / `_jealWriteback` / `_jealFactionBias` / `_jealFirstMeetingBeat` 七个底层函数被 jealousy-deep / jealousy-assembly / jealousy-collective 三家共用 · **缺口**：`_jealFactionBias` / `_jealFirstMeetingBeat` / `JEAL_SOCIAL_PRESET_DEFS` / `JEAL_SOCIAL_VILLAIN_SECTS` 外部 0 引用（疑似仅本文件内消费，**未逐行核**）
- `js/npcs/jingang-events.js` :: jingang-events.js - 赫渊线情缘事件/结局/性别语境 v1.0 · 男主·赫渊（法名净渊，金刚宗苦行僧，闭口禅，肉身证道，守戒至动情破戒）
  **机制**：数据表 + 状态机（同构模板）· 关键数据 `JG_MAIN_EVENTS` **14 场** + `JG_ENDINGS` **6 个结局** + `JG_GENDER_CTX_EVENTS` **2 场** = 运行时注册 **16 场**
  **对外接口**：`window.JG_NPC_ID` / `JG_MAIN_EVENTS` / `JG_ENDINGS` / `maybeAutoTriggerJgEvent`（4 个）· **事件**：`timeSystem.onNewDaySubscribe` 每日自动触发 1 处 · **依赖**：`npc-personal-events.js`（`NPC_PERSONAL_EVENTS` / `registerEndingSet` / `registerEndingCallback` / `canPlayerAccessPersonalEvent` / `triggerPersonalEvent`）· 本线定位：金刚宗男主线·苦行僧
  **已知缺口**：四个 `window` 导出外部 0 引用——但 `:53x` 的每日钩子与 `:49x` 的 `Object.assign(NPC_PERSONAL_EVENTS, ...)` 在本文件内消费，**不是死代码**（判「死」必须回原文件核调用点，倒排索引看不到字符串字面量）。　每日触发是否先判地点：****是**（`:473` 先判 location 再调）**——35 个同构文件里只有 3 个这么写，口径不统一（不判的那 32 个靠 `npcManager.getNPC(id)` 拿不到人就 return，效果等价但多一次无用查询）
- `js/npcs/kidnap-system.js` :: v26.0 六路营生批（第一百五十一批 · 用户点单）· 绑架勒索账 · 用户点单：「能威胁、能抢劫了，下一步自然是绑了富商或门派弟子写赎金信——带交赎金被埋伏、 · 撕票涨杀孽的后果链。」本账把这条黑道最重的一票接通
  **机制**：混合（数据表 + 判定函数，610 行）· 关键数据 `WORTH_TIER` / `WORTH_LEVEL` / `PER_NPC_DAYS` / `KID_*` **3 项** / `RANSOM_BASE_RICH` / `RANSOM_BASE_NOBLE` / `NOTO_DRAG` / `RICH_PAY_BONUS` / `PAY_HEAT` / `AMB_*` **3 项**（埋伏成败）/ `REPORT_HEAT` / `DEN_GRACE_DAYS` / `FREE_HEAT` / `FIGHT_LEVEL_AT` —— 把「绑富商/门派弟子写赎金信 → 带交赎金被埋伏 → 撕票涨杀孽」整条后果链落成真账 · 对外接口 **14 个 `window.` 导出**（真出口：`settleKidnapFight` / `settleKidnapAmbush` 均被 **`app.js`** 调；`Kidnap` 对象被 `street-life.js` / `npc-crime.js` 读）· 依赖 `npc-crime.js`（热度/通缉账）、`battle.js` · **入口链**：本文件 `:187 buildButton` 拼出内联 `onclick="window.Kidnap.kidnap(npcId)"` → `buildButton` 被 `npc-crime.js:821` 与 `street-life.js` 调 → 面板按钮挂在 NPC 对话面板与街面上；事后结算 `settleKidnapFight` / `settleKidnapAmbush` 由 **`app.js`** 调· **★ 已知缺口**：`:608 window.executeKidnapNPC = kidnap` 这个别名**全仓 0 引用**（面板走 `window.Kidnap.kidnap` 对象形式）—— 是多余全局，不是死功能
- `js/npcs/kunlun-events.js` :: kunlun-events.js - 姬云锦线情缘事件/结局/性别语境 v1.0（昆仑派扩线·女主侧） · 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
  **机制**：数据表 + 状态机（同构模板）· 关键数据 `KL_MAIN_EVENTS` **14 场** + `KL_ENDINGS` **6 个结局** + `KL_GENDER_CTX_EVENTS` **2 场** = 运行时注册 **16 场**
  **对外接口**：`window.KL_NPC_ID` / `KL_MAIN_EVENTS` / `KL_ENDINGS` / `maybeAutoTriggerKlEvent`（4 个）· **事件**：`timeSystem.onNewDaySubscribe` 每日自动触发 1 处 · **依赖**：`npc-personal-events.js`（`NPC_PERSONAL_EVENTS` / `registerEndingSet` / `registerEndingCallback` / `canPlayerAccessPersonalEvent` / `triggerPersonalEvent`）· 本线定位：昆仑派女主扩线
  **已知缺口**：四个 `window` 导出外部 0 引用——但 `:53x` 的每日钩子与 `:49x` 的 `Object.assign(NPC_PERSONAL_EVENTS, ...)` 在本文件内消费，**不是死代码**（判「死」必须回原文件核调用点，倒排索引看不到字符串字面量）。　每日触发是否先判地点：**否**——35 个同构文件里只有 3 个这么写，口径不统一（不判的那 32 个靠 `npcManager.getNPC(id)` 拿不到人就 return，效果等价但多一次无用查询）
- `js/npcs/leader-excursion.js` :: v22.1 江湖行：掌门下山游历 + 外院求见 · 问题：36 条恋爱线主角全是各派掌门，但未入派的游客在门派里够不到任何活人 · 见不到人，v22.0 打通的「交谈即入戏」对非弟子等于零。 · 方案（用户确认）： · ① 掌门按 deterministic 日程下山游历：每隔 5~7 天去本区域一座城市盘桓一日
  **机制**：状态机 + 渲染层（IIFE，229 行）· 关键数据 确定性日程：36 位掌门**每 5~7 天**下山游历一次，去本区域一座城市盘桓一日 · 对外接口 **9 个**，其中 4 个是真出口：`isLeaderAway`（← `sect-facilities.js` / `sect-visit.js`）、`leaderAwayCity`（← 同上两处）、`tryGrantSectInvitation`（← `npc-system.js`）、`renderSectLeaderAudience`（← `sect-visit.js`）；另有内联 `onclick` 消费的 `grantSectAudience`(`:196-206`) / `refuseSectAudience` · 事件 每日同步 2 处 · 依赖 `npc-system.js`（`showNPCDialog`）、`sect-visit.js` · 机制：解决「36 条恋爱线主角全是掌门，但未入派的游客在门派里够不到任何活人」——掌门按日程下山 + 外院可求见 · **缺口**：`ensureExcursionSynced` / `syncLeaderExcursions` / `grantSectAudience` / `refuseSectAudience` 四个导出外部 0 引用（后两个经 `:196-206` 内联 onclick 消费，是活的；前两个**疑似**仅本文件日结钩子内消费，未逐行核）
- `js/npcs/lieri-events.js` :: lieri-events.js - 伏璃茵线情缘事件/结局/性别语境 v1.0（烈日教扩线·反派阵营线） · 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
  **机制**：数据表 + 状态机（同构模板）· 关键数据 `LIE_MAIN_EVENTS` **14 场** + `LIE_ENDINGS` **6 个结局** + `LIE_GENDER_CTX_EVENTS` **2 场** = 运行时注册 **16 场**
  **对外接口**：`window.LIE_NPC_ID` / `LIE_MAIN_EVENTS` / `LIE_ENDINGS` / `maybeAutoTriggerLieEvent`（4 个）· **事件**：`timeSystem.onNewDaySubscribe` 每日自动触发 1 处 · **依赖**：`npc-personal-events.js`（`NPC_PERSONAL_EVENTS` / `registerEndingSet` / `registerEndingCallback` / `canPlayerAccessPersonalEvent` / `triggerPersonalEvent`）· 本线定位：烈日教·反派阵营线
  **已知缺口**：四个 `window` 导出外部 0 引用——但 `:53x` 的每日钩子与 `:49x` 的 `Object.assign(NPC_PERSONAL_EVENTS, ...)` 在本文件内消费，**不是死代码**（判「死」必须回原文件核调用点，倒排索引看不到字符串字面量）。　每日触发是否先判地点：**否**——35 个同构文件里只有 3 个这么写，口径不统一（不判的那 32 个靠 `npcManager.getNPC(id)` 拿不到人就 return，效果等价但多一次无用查询）
- `js/npcs/male-lead-aftermath.js` :: male-lead-aftermath.js - 男主道侣回访（结契后）事件 v1.0 · 依赖：npcs/npc-personal-events.js、npc-system.js（dao_companion flag） · 加载顺序：在十六位男主事件文件 + male-lead-rivalry.js 之后
  **机制**：数据表（527 行）· 关键数据 `MALE_AFTERMATH_EVENTS`(`:11`) **16 场**男主道侣回访（结契后）· 对外接口 3 个 · 依赖 `npc-personal-events.js` / `npc-system.js`（`dao_companion` flag）· 加载顺序：16 位男主事件文件 + `male-lead-rivalry.js` 之后 · 与 `heroine-aftermath.js`（20 场）性别镜像，场数差 4 对应男主 16 vs 女主 20
- `js/npcs/male-lead-bridge.js` :: male-lead-bridge.js - 男主论交（情敌和解）事件 v1.0 · 依赖：npcs/npc-personal-events.js、npcs/male-lead-rivalry.js（detectRivalRomance 已扩展含男主）
  **机制**：数据表（518 行）· 关键数据 `MALE_BRIDGE_EVENTS`(`:176`) **16 场**男主论交（情敌和解，**全部 `requireRivalRomance: true`**）+ `ML_BRIDGE_TIER_MSGS`(`:28`) **16 人**分层文案 · 对外接口 **6 个** · 依赖 `npc-personal-events.js` / `male-lead-rivalry.js` · 机制同 `heroine-rivalry-bridge.js`（guestId + requireGuestFeelings 门禁 + asNpc 琥珀气泡）
- `js/npcs/male-lead-reconcile.js` :: male-lead-reconcile.js - 男主和好事件 v1.0 · 依赖：npcs/npc-personal-events.js、npcs/male-lead-rivalry.js（detectRivalRomance 已扩展） · 加载顺序：在 male-lead-rivalry.js 之后
  **机制**：数据表（788 行）· 关键数据 `MALE_RECONCILE_EVENTS`(`:11`) **16 场**男主和好事件（**全部 `requireRivalRomance: true`**）· 对外接口 3 个 · 依赖 `male-lead-rivalry.js`（`detectRivalRomance` 已扩展含男主）· 加载顺序：在 `male-lead-rivalry.js` 之后 · **四个男主侧文件（rivalry 16 / bridge 16 / reconcile 16 / aftermath 16）场数完全对齐**
- `js/npcs/male-lead-rivalry.js` :: male-lead-rivalry.js - 男主吃醋事件 + 扩展情敌探测 v1.0 · 依赖：npcs/npc-personal-events.js、npcs/heroine-rivalry.js（detectRivalRomance/HEROINE_ROSTER）
  **机制**：数据表 + 判定函数（789 行）· 关键数据 `MALE_RIVALRY_EVENTS`(`:55`) **16 场**男主吃醋对峙（**全部 `requireRivalRomance: true`**）· 对外接口 **4 个**，含被 `npc-personal-events.js` / `heroine-rivalry-bridge.js` 读的 `detectRivalRomance`（**把 detectRivalRomance 从 20 人扩到含男主**——`heroine-rivalry.js` 的原版只认女主，这是全局情敌探测的真正入口）· 依赖 `heroine-rivalry.js`（`HEROINE_ROSTER`）/ `npc-personal-events.js`
- `js/npcs/maoshan-events.js` :: maoshan-events.js - 昴既明线情缘事件/结局/性别语境 v1.0 · 男主·昴既明（茅山派青年符箓伏魔道士，阴阳眼，见惯生死鬼神，性冷淡寡言）
  **机制**：数据表 + 状态机（同构模板）· 关键数据 `MS_MAIN_EVENTS` **14 场** + `MS_ENDINGS` **6 个结局** + `MS_GENDER_CTX_EVENTS` **2 场** = 运行时注册 **16 场**
  **对外接口**：`window.MS_NPC_ID` / `MS_MAIN_EVENTS` / `MS_ENDINGS` / `maybeAutoTriggerMsEvent`（4 个）· **事件**：`timeSystem.onNewDaySubscribe` 每日自动触发 1 处 · **依赖**：`npc-personal-events.js`（`NPC_PERSONAL_EVENTS` / `registerEndingSet` / `registerEndingCallback` / `canPlayerAccessPersonalEvent` / `triggerPersonalEvent`）· 本线定位：茅山派男主线·符箓伏魔道士
  **已知缺口**：四个 `window` 导出外部 0 引用——但 `:53x` 的每日钩子与 `:49x` 的 `Object.assign(NPC_PERSONAL_EVENTS, ...)` 在本文件内消费，**不是死代码**（判「死」必须回原文件核调用点，倒排索引看不到字符串字面量）。　每日触发是否先判地点：****是**（`:477`）**——35 个同构文件里只有 3 个这么写，口径不统一（不判的那 32 个靠 `npcManager.getNPC(id)` 拿不到人就 return，效果等价但多一次无用查询）
- `js/npcs/marriage-offspring.js` :: marriage-offspring.js - v20.0 2.8 玩家婚姻/后代/家族 · 道侣 bond>=2 可诞育后代，后代继承玩家1门功法/血脉；家族传承 · 依赖：1.4 NPC、1.7 转世（后代继承可联动）、bonds（dao_companion）
  **机制**：判定函数 + 渲染层（331 行）· 关键数据 `CHILD_TITLES`（后代称谓表）· 对外接口 **8 个**：真出口 `openChildPanel`（← `cultivation.js` 调）、`haveChild`（← `cultivation.js` / `sect-internal.js` / **`npc-lineage.js`**）、`getDaoCompanionBond`（← `family-system.js` / `grand-legacy.js` / `cultivation.js`）· 12 个函数（`childAction` / `sendChildToSect` / `dailyChildrenLife` / `checkChildrenGrown` 等）· 依赖 `npc-system.js`（`NPC` 类）、`npc-lineage.js`（道侣/后代账）· 机制：道侣 bond≥2 可诞育，后代继承玩家 1 门功法/血脉，家族传承 · **缺口**：`childAction`(self 6) / `sendChildToSect`(self 4) 外部 0 引用（疑似仅面板内联 onclick 消费，未逐行核）；`openChildPanel` / `getDaoCompanionBond` 是被 cultivation.js 反复调用的真入口，与本文件自挂的 3 处订阅并存，**两套入口都通**
- `js/npcs/name-generator.js` :: name-generator.js - 仙侠人物&野兽命名系统 · 从NPC随机名.txt提取，专为人类NPC和野兽随机取名
  **机制**：纯数据表 + 工具函数（210 行）· 关键数据 `SURNAMES` **~100 姓** / `GIVEN_RAW` **~519 条名碎片** / `GIVEN_NAMES`（派生）/ `BEAST_PREFIXES` **~20** / `BEAST_SUFFIXES` **~20** · 6 个函数：`rand` / `pick` / `generateName` / `generateBatch` / `generateBeastName` / `formatNameWithTitle` · 对外接口 1 个（`window.nameGenerator`）· **消费者最广的一个 NPC 文件**：`battle.js` / `disguise-system.js` / `npc-lineage.js` 等 · 依赖 无（纯随机源）· 机制：从名册随机取名，专为人类 NPC 和野兽随机取名。**缺口**：无 —— 这是全批少数外部引用明确的纯工具文件
- `js/npcs/npc-bond.js` :: v25.8 黑道与人情批（第一百五十批 · 用户点单）· 人情账 · 人物面板翻了底账：借物只能借不能还（归还函数写好多年，全库没有按钮调它——每笔借物必然逾期扣好感）、 · 约会只有道侣被动受邀（玩家不能主动约人，更没有提亲）、不能「向甲打听乙」、馆子只能独食、
  **机制**：混合（数据表 + 判定函数 + 渲染层，IIFE，761 行）· 关键数据 **16 个 TUNE 常量**（`DATE_AFF_AT` / `DATE_BASE` / `DATE_MIN` / `WALK_MIN` / `TEA_COPPER` / `MOON_MIN` / `PROPOSE_LOVE_AT` / `ASK_COPPER` / `TREAT_HOME` / `TREAT_MOOD` / `ESCORT_DAYS` / `ESCORT_DISCOUNT` / `ESCORT_PLUNDER_MOD` / `DIVINE_COST` / `ENTRUST_TRUST` / `TUNE`）+ **21 个 api 方法**（`openDate`/`date`/`propose`/`proposeDone`/`openAsk`/`askAbout`/`openTreat`/`treat`/`openEscortHire`/`hire`/`dismissEscort`/`pendingBorrow`/`returnItem`/`divineFull`/`entrust`/`findMasterSect`/`buildNpcBondButtons` 等）· 对外接口 **14 个**，真出口 `buildNpcBondButtons`（← `npc-system.js`）与 `NpcBond` 对象（← `eatery.js` / `caravan-trade.js` / `citizen-life.js`）· 依赖 `npc-system.js`（`getRivals` / `showSectMasters` / `getLuck`）、`npc-borrow-service.js`（借物账）· 机制：人情账——约会/提亲/向甲打听乙/请客/护送雇佣/占卜/托付，每个动作都写死 TUNE 常量 · **入口链**：`:759` 附近把 21 个方法挂上 `window.NpcBond`；面板入口有两个 —— `js/eatery.js:160` 的内联 `onclick="NpcBond.openTreat(...)"`（馆子场景）与 `buildNpcBondButtons`（← `npc-system.js`，人物面板）· **缺口**：`:759 window.openNpcBondPanel = function () { return openTreat(); }` 这个别名**全仓 0 引用**（走的是 `NpcBond.openTreat` 对象形式）—— 是多余全局，不是死功能；同文件头注释自陈的历史病根「借物只能借不能还（归还函数写好多年，全库没有按钮调它）」已由 `pendingBorrow`/`returnItem` 修通
- `js/npcs/npc-borrow-service.js` :: npc-borrow-service.js — NPC 借物契约 · 借出、归还、逾期全部绑定游戏时间；记录纳入统一存档。
  **机制**：数据表 + 判定函数（IIFE，161 行）· 关键数据 借物记录表（`sequence` + `records[]`，每条含物品/期限/是否归还）· 对外接口 **`NPCBorrowService`**（← `npc-system.js` / `core/daily-events.js` / **`npc-bond.js`**）+ 3 个：`borrowRecords`（← `core/game-state.js` / `core/daily-events.js` 存档）、`returnBorrowedItem`（← `npc-bond.js`）、`serialize`/`deserialize` · 依赖 `time-system.js`（游戏时间）、`npc-system.js`（`npcManager`）· 机制：借出/归还/逾期**全部绑游戏时间**（不是现实时间），记录纳入统一存档。18 个函数（`scheduleRecord` / `markOverdue` / `chooseNpcItem` / `borrowFromNPC` / `returnBorrowedItem` / `deserialize` / `reset` 等）· **缺口**：`markBorrowOverdue` **全仓 0 命中** —— 逾期标记函数写好了却没人调（`records` 的 `returned` 与逾期判定改由别的路径走，**疑似**已成死函数）
- `js/npcs/npc-crime.js` :: v25.8 黑道与人情批（第一百五十批 · 用户点单）· 黑道账 · 用户点单：「我能不能威胁NPC？随便挑一个抢劫？去钱庄找到柜台NPC，威胁并让她出卖钱庄？」 · 此前对具名 NPC 只有非暴力的摸包（v25.5）、拿秘密要挟（secret-leverage）、威压代付人情（v20.37）
  **机制**：混合（数据表 + 判定函数 + 渲染层，898 行）· 关键数据 4 张常量表：`THREAT_*` **11 项**（威胁：BASE/TIER/FEAR_GAIN/LOOT_MIN/FAIL_HATRED/SNITCH_P/ELDER_PUNISH_QI）、`ROB_*` **3 项**、`WANTED_AT` / `HEAT_DECAY`（通缉阈值与热度衰减）、`HUNTER_*` **4 项** + `PATROL_BOOST` / `PATROL_BOOST_BLIND` / `PATROL_MASK_FACE`（巡捕：面具/ blindness 加成）· 对外接口 **23 个 `window.` 导出**（真出口：`buildNpcCrimeButtons` ← `npc-system.js` / `kidnap-system.js`；`settleNpcRobbery` ← **`app.js`**；`NpcCrime` 对象 ← `crime-works.js` / `family-system.js` / `grand-legacy.js`）· 事件 日结 2 处 · 依赖 `npc-system.js` / `battle.js`（`openBattleWithEntity`）· **入口链**：`buildNpcCrimeButtons`(`:814`) ← `npc-system.js:3862` 挂进 NPC 对话面板 → `:818/:819` 拼出内联 `onclick="window.NpcCrime.threaten(npcId)"` / `window.NpcCrime.rob(npcId)` → 走 `:888` 挂在 `window.NpcCrime` 对象上的方法；同一函数还并排挂上 `Kidnap.buildButton`(`:821`) 与 `CrimeWorks.buildPickButton`(`:825`) 两枚按钮（各带 try/catch 守卫）· **★ 已知缺口**：① `:895 window.executeThreatenNPC = threaten` / `:896 window.executeRobNPC = rob` 这两个别名**全仓 0 引用**（面板走的是 `window.NpcCrime.*` 对象形式，不是这两个裸别名）—— 是多余全局，不是死功能；② **「抢劫」在本仓有 3 套并行实现**：本文件 `rob()`（对具名 NPC）、`js/city-facilities/citizen-life.js:181 rob()`（对城中 NPC，另有 `robFight`/`robBeggar`/`robMeek` 三个变体与独立的 `settleCitizenRob` 结算）、`js/npcs/npc-system.js:4374 executePickpocket`（v25.5 摸包）—— 三本「业障/恶名/热度」账各记各的
- `js/npcs/npc-daily-life.js` :: npc-daily-life.js - NPC日程可见性 · 地图上显示NPC路径+状态、NPC之间互动 · 依赖：npcs/npc-system.js (NPCManager, NPC) · 加载顺序：在 npc-system.js 之后
  **机制**：数据表 + 渲染层（101 行 · 本批最小）· 关键数据 `npcMeetingLog`(`:26`) NPC 相见日志 · 4 个函数：`checkNPCMeetings`(:28) / `getNearbyNPCsDescription` / `getNPCActivityDescription` / `renderNPCMapIcons`(:63) · 对外接口 **5 个**，**唯一被外部读的是重导的 `showNPCDialog`**（其余全是本文件内消费）· 依赖 `npc-system.js`（`NPCManager` / `NPC` / `showNPCDialog`）· 加载顺序：在 `npc-system.js` 之后 · **★ 已知缺口**：文件职责是「地图上显示 NPC 路径 + 状态、NPC 之间互动」，但 `:63 renderNPCMapIcons(mapContainer)` **定义后全仓从未被调用**（只有 `:100` 的 `window.renderNPCMapIcons = renderNPCMapIcons` 这条自我导出）—— **地图上没有 NPC 图标，这条功能事实上没上线**；`getNearbyNPCsDescription` / `getNPCActivityDescription` 同为内部-only（疑似仅面板内联消费）
- `js/npcs/npc-emotions.js` :: npc-emotions.js - NPC情绪状态系统 · 扩展NPC已有的mood/stress系统，让情绪影响行为、外观、对话 · 依赖：npcs/npc-system.js (NPC类, showNPCDialog)
  **机制**：数据表 + 判定函数（536 行）· 关键数据 `EMOTION_STATES` **5 档**（ecstatic 狂喜 moodRange[90,100] / happy / neutral / sad / angry，每档带 icon + color）/ `EMOTION_DIALOGUE_PREFIXES` **5 档 × 3 句** / `EMOTION_ACTIONS`（送礼/安慰/鼓励/陪伴，每个动作自带 `check(npc)` 门槛 + `execute(npc, player)`）· 14 个函数 · 对外接口 **19 个**，其中 6 个是真出口且被 `npc-system.js` 调：`getEmotionState` / `comfortNPC` / `encourageNPC` / `accompanyNPC` / `executeEmotionAction` + 存档 `exportSocialCooldowns` / `importSocialCooldowns`（← `core/game-state.js`）· 依赖 `npc-system.js`（`showNPCDialog`）· 机制：把 NPC 已有 mood/stress 扩成**情绪状态**，影响行为、外观、对话前缀；社交动作带日限（`_socialDailyCounts` / `_socialCooldowns`）· **缺口**：`getEmotionBadgeHTML` / `getEmotionDialoguePrefix` / `getEmotionAffectedResponse` / `injectEmotionToDialog` / `initEmotionSystem` / `EMOTION_STATES` 六个导出外部 0 引用 —— **`injectEmotionToDialog`（把情绪前缀注入 NPC 对话）与 `getEmotionBadgeHTML`（情绪徽章）是「让情绪被看见」的两个渲染钩子，都没接线**；`initEmotionSystem` 由 `:534` 本文件内自调（是活的），`getEmotionDialoguePrefix` / `getEmotionAffectedResponse` 疑似同文件内消费
- `js/npcs/npc-inventory.js` :: npc-inventory.js — 物品与NPC联动·一期：行囊系统（v13.9）
  **机制**：混合（数据表 + 渲染层，IIFE，378 行）· 关键数据 NPC 行囊（背包）表 + `activeWants`（NPC 想要物清单，驱动 `syncWantQuests` 接任务系统）· 4 个 api：`bagSectionHtml` / `activeWants` / `matchWant` / `syncWantQuests` · 对外接口 **7 个**，6 个是真出口：`addItemToInventory`（← `inventory.js` / `travel-system.js` / `debug-panel.js`）/ `giveGiftToNPC`（← **`npc-system.js` / `app.js`**）/ `confirmGiftToNPC`（← 同上两处）/ `getSecretDisplayHtml`（← `npc-system.js` / **`npc-personal-events.js`**）/ `NpcInventory` 对象（← `social-content.js`）· 依赖 `npc-system.js` · 机制：把 NPC 的秘密/想要物与玩家的送礼、任务系统连起来（v13.9 一期：行囊系统）· **缺口**：无 —— 7 个导出全部有外部消费者或系统内接线
- `js/npcs/npc-life-actor.js` :: npc-life-actor.js — v19.2 P0-5：NPC 自主人生
  **机制**：判定函数 + 状态机（IIFE，526 行）· 关键数据 `_store`（每日行动记录）/ `_rumors`（传闻池）/ `npcRootGrowthMul`（灵根成长倍率）· 16 个 api：`tickDay` / `pushNote` / `cultivateStep` / `dominantRootName` / `chooseAction` / `executeAction` / `spreadRumor` / `getRecent` / `getRumorLog` / `renderRumorPanel` / `showRumorPanel` 等 · 对外接口 走 `global.NPCLife`（**0 个具名 `window.` 导出**）· **消费者极广**：`player-sect-life.js` / `npc-rel-events.js` / `app.js` / `sect-internal.js` / `building-effects.js` / `sects-deep-ui.js` / `player-rumor.js` / `social-intervene.js` / `master-teach.js` 等 10+ 文件 · 事件 `EventBus` **3 处**（`npc:action:done` 等）· 依赖 `npc-system.js` / `personality-driver.js`（`P16Driver`）· 机制：NPC 每天自主选行动（修炼/采集/拜访/冲突）并把结果**变成传闻在 NPC 间扩散** —— 是 `npc-rel-events.js` 与 `player-rumor.js` 的上游 · 缺口：无
- `js/npcs/npc-life-system.js` :: npc-life-system.js - NPC生命周期系统（v12.0 P2-10）
  **机制**：状态机 + 渲染层（IIFE，608 行）· 对外接口 **7 个**，全部有外部消费者：`NPCLifeSystem`（← **`time-system.js`**）/ `_npcRecords`（← **`core/game-state.js`** 存档）/ `showMessage` / `showChoiceDialog` / `giveWithReceipt` / `addItem` / `addItemFailTextFor` · 依赖 `npc-system.js` / `core/game-state.js` · 机制：v12.0 P2-10 NPC 生命周期——生成、衰老、死亡、境界自然推进，走 `time-system.js` 的日结 · 缺口：无 —— `NPCLifeSystem` 被 time-system 调、`_npcRecords` 被 game-state 存档，是本批少数「单一入口 + 单一存档口」结构干净的文件
- `js/npcs/npc-lineage.js` :: npc-lineage.js — v19.3 P0-6：NPC 婚姻 / 后代 / 衣钵
  **机制**：判定函数 + 渲染层（IIFE，619 行）· 关键数据 家族索引 `_index` / 灵根饼 `_pieRoots` / `_guessRoots` · 19 个 api：`marry` / `haveChild` / `inheritOnDeath` / `successionOnDeath` / `getAncestors` / `getDescendants` / `isAncestorOf` / `areCloseRelatives` / `recordPlayerDaoCompanion` / `choosePlayerAfterlife` / `tickDay` / `normalizeRootPie` / `showLineagePanel` / `renderLineagePanel` · 对外接口 走 `global.NPCLineage`（**0 个具名 `window.` 导出**）· **事件 `EventBus` 5 处**：`npc:lineage:married` / `npc:lineage:childBorn` / `npc:lineage:inheritance` / `npc:lineage:succession`（各 1-2 处）· 依赖 `npc-system.js` / `personality16.js`（灵根推导）/ `name-generator.js`（取名）· 机制：v19.3 P0-6 NPC 婚姻 / 后代 / 衣钵——**本批唯一用事件总线对外广播的子系统**（其他文件都是 window 全局）· 缺口：无
- `js/npcs/npc-personal-events.js` :: npc-personal-events.js - NPC个人事件系统 v1.0 · 依赖：npcs/npc-system.js (NPC类, showNPCDialog) · 加载顺序：在 npc-system.js 之后，在 npc-milestones.js 之后
  **机制**：混合（数据表 + 判定函数 + 渲染层 + 存档，2306 行）· **全批的私人事件引擎**。`NPC_PERSONAL_EVENTS`(`:8`) 是空壳注册表，运行时由 59 个文件 `Object.assign` 填入 **938 场事件 / 2818 个选项**（实测）
  **关键数据表**：`NPC_PERSONAL_EVENTS`(`:8`) 注册表 · 修罗宫内置 6 张（`XIULUO_CONCUBINE_EVENTS` 6 / `XIULUO_DISCIPLE_EVENTS` 5 / `XIULUO_EVENTS` **15** / `XIULUO_DAILY_EVENTS` 10 / `XIULUO_APPROACH_EVENTS` 8 / `XIULUO_ENDINGS` **6**）· `NPC_ENDING_SETS`(`:1167`) 结局注册表（运行时 **37 组 / 219 个结局**）· `NPC_ENDING_CALLBACKS`(`:1168`) · `personalEventFlags`(`:1189`) 存档
  **机制链**：`initPersonalEventSystem`(:1192) 起 → `checkEventTrigger` 按好感/冷却/一次性 flag 筛 → `canPlayerAccessPersonalEvent` 门禁（好感线 + 好感度阈值）→ `triggerPersonalEvent` → `showPersonalEventScene` / `renderPersonalEventScene` 演出（琥珀气泡 `asNpc`、打字机）→ `handlePersonalEventChoice`(:1531) 把 `choice.effect` 交给 **`ev.eventDef.effects(npc, choice.effect)`** 结算 → `AffectionSystem` 写回 → `registerEndingCallback` 跑结局副作用。另挂 `timeSystem.onNewDaySubscribe` 跑 `checkDailyAffectionDecay` 每日好感衰减
  **★ 专项核实：`effect` 是自由文本还是受控枚举？** → **100% 裸字符串，零对象**。运行时扫 2818 个选项：`effect as bare string = 2818`、`effect as object = 0`、**609 个不同字符串**（其中 **340 个只出现一次**，即一次性语义）。`npc-personal-events.js:1531` 把这个裸串原样透传给每条事件自带的 `effects(npc, effect)`，**引擎层不认识任何 effect 取值**，含义由各 `*-events.js` 的 effects 函数自己 switch；全局只有 `:1550` 特判了两个值（`choice.effect === 'tell' || 'vow'` 才涨深情+1）。**`item` 字段：2818 个选项里恰好 6 个带**（`spirit_grass`×3 / `spirit_stone`×2 / `food_thousand_wine`×1），分布在 hengshan-beiyue/penglai/taishan/tangmen/emei/huashan 六个文件
  **已知缺口**：① `:1176-1177` **死分支** —— `:1176` 已写 `NPC_ENDING_SETS[npcId] || XIULUO_ENDINGS`，`:1177` 又 `|| XIULUO_ENDINGS[endingId]`，第二道回退永远走不到；② 引擎层对 609 个 effect 串**零校验**——写错一个拼写（如 `mediat`）不会报错，只是永远匹配不到分支、静默走 default，**这类错无法被现有测试发现**；③ `NPC_ENDING_SETS` / `XIULUO_ENDINGS` / `_currentPersonalEvent` / `_pendingEventComplete` / `getSecretHtml` / `handlePersonalEventChoice` / `initPersonalEventSystem` / `injectSectSecrets` / `showEndingScene` / `tryInterceptPersonalEvent` 共 10 个导出外部 0 引用（其中多数被同文件 onclick 消费，需回原文件逐个核）
- `js/npcs/npc-rel-events.js` :: npc-rel-events.js — v20.6 闭环② 关系边产事件
  **机制**：判定函数（IIFE，173 行）· 关键数据 `DUEL_CHANCE = 0.012`（每条敌对边每日读表概率）/ `VISIT_CHANCE = 0.006`（每条友好边每日回访概率）· 4 个 api：`tickDay(day, opts)` / `duelResolve(aId, bId, side)` / `duelPending()` / `version` · 对外接口 走 `global.NPCRelEvents`（**0 个具名 `window.` 导出**）· 事件 `timeSystem.onNewDaySubscribe` 1 处（`:155-159`）· 依赖 `npc-system.js`（`npcRelationships` / `adjustNPCRelationshipPair` / `setNPCRelationshipPair`）/ `personality-driver.js`（`driftPersonality`）/ `npc-life-actor.js`（`pushNote`）· 机制：v20.6 闭环② —— 每条 NPC 关系边自己长事件：敌对 strength≥40 掷骰走街头械斗（玩家可选帮左/帮右/分劝，声望<50 分劝无效）、友好掷骰回访；**rng 可注入**（`opts.randomSource`）供回归复现 · **缺口**：`duelPending()`(`:165`) 导出后全仓 0 调用 —— 械斗弹窗靠 `_pendingDuel` 全局旁路（`duelResolve` 第一行直接 `global._pendingDuel = null`），这个判定函数没人读
- `js/npcs/npc-storylines.js` :: 【已废弃·不挂载】每个核心NPC采用5段结构：认识→第一次求助→暴露矛盾/秘密→玩家关键选择→长期结果 · 加载顺序：在 npc-system.js 之后加载
  **机制**：纯数据表（558 行）· 关键数据 `NPC_STORYLINES`(`:5`) **128 条**（每个核心 NPC 5 段结构：认识→第一次求助→暴露矛盾/秘密→玩家关键选择→长期结果）· 对外接口 3 个 · **★ 本文件是全批唯一不挂载的文件**：`仙侠.html` 里 93 个 `js/npcs/` script 标签**唯独缺它**（已在 §0.2 标【已废弃·不挂载】）· 依赖 原为 `npc-system.js` · **★ 已知缺口（悬空导出）**：`js/npcs/npc-system.js` 仍保留 `window.showStorylineDialogue` / `window.checkNPCStorylines` 两个**指向本文件的活导出**——本文件的数据永远读不到，这两个导出是**指向死文件的悬空接口**（同批另有 `window.NPC_STORYLINES` 也只被 npc-system 读）
- `js/npcs/npc-system.js` :: NPC完整系统
  **机制**：混合（数据表 + 状态机 + 渲染层，**5208 行 · 全批最厚**）· 内部是 **7 个类**：`NPC`(:697) / `NPCManager`(:1746) / `DialogueSystem`(:2015) / `AffectionSystem`(:2077) / `NPCQuestSystem`(:2404) / `NPCRequestSystem`(:2447) / `NPCEventSystem`(:2472)；文件用 74 条 `// ====` 分隔注释切成 20+ 个子系统
  **关键数据表**（实测条目数）：`DEEP_TALK_CATEGORIES`(:92) **37 项** 深谈七类话题池 · `DEEP_TALK_BRANCHES`(:254) **3 组 / 34 节点** 分支对话树 · `OCCUPATION_SPECIFIC_ACTIONS`(:411) **10 项** · `FIXED_SUBOPTION_TOPIC`(:216) **8 项** · `BOND_DAO_FINAL_CHAPTER`(:3125) **37 条** 结契终章文本 · `NPC_GOAL_TYPES`(:4447) · `MEMORY_CATEGORIES`(:4542) · `DEEP_TALK_REAL_HANDLERS`(:2969) 真实处理器映射
  **七个系统怎么连**：① 数据层（`DEEP_TALK_*`/`OCCUPATION_*` 表）→ ② `DialogueSystem` 按玩家选的类目查表 → ③ `DEEP_TALK_REAL_HANDLERS` 把子选项路由到真处理器（职业交互/礼物/秘密/摸包）→ ④ `effects()` 返回 `{affection, msg}` → ⑤ `AffectionSystem` 写四轨关系（affection/trust/love/friendship）→ ⑥ `NPCManager` 的日程调度 + 自主生活心跳（每 6 小时主动行为、关系自然衰减、心情压力波动、自动修炼突破）→ ⑦ 存档走 `:1436 保存` / `:1619 恢复` + `:1725 读档一次性清洗`（幂等，条件自限）。物品侧接 `npc-inventory.js`，情感侧接 `npc-personal-events.js`
  **对外接口**：`window.` 导出 **100 个**（代表：`npcManager` / `NPC` / `showNPCDialog` / `giveGiftToNPC` / `executeDeepTalkSubOption` / `executeOccupationAction` / `executePickpocket` / `showStorylineDialogue` / `buildNpcRequestHtml`）· **依赖**：`special-npcs.js`（`SPECIAL_NPC_DATA`）、`personality16.js`（`Personality16`）、`item-tags.js`（`checkNPCLikeItem`）、`social-content.js`（问候/深谈文案）、`player-rumor.js`(`:3973 getInterventionButtons`/`:3976 getPlayerRumorSection` 注入对话面板)
  **已知缺口**：① `:4374 executePickpocket`（v25.5 摸包）与 `npc-crime.js:573 rob()` 是**两套并行的抢劫实现**，且 `rob()` 全仓 0 调用（详见 `js/npcs/npc-crime.js` 条）；② `:3430` 注释自陈「v23.2 NPC 主动请求：可应答了（旧版弹出『想要灵草/想切磋』后**全库无人消费**——纯布景）」，说明这块历史上出现过接线缺失；③ ~40 个 `window` 导出外部 0 引用，其中 `showStorylineDialogue` / `checkNPCStorylines` 指向**已废弃不挂载**的 `npc-storylines.js`，是**指向死文件的活导出**；④ 其余多为同文件内联 `onclick` 消费（假阳性），判「死」须回原文件核调用点
  **★ v26.2 confess 接缝（本批唯一改动，3 行注释 + 1 行守卫，不改原实现）** —— `executeEmotionInteraction` 的 `case 'confess'`（`:3217-3224`）现在是：`if (window.ConfessionRites && typeof window.ConfessionRites.offer === 'function' && window.ConfessionRites.offer(npc)) break;`（`:3221`）→ 到了这道门（aff≥60）就交给 `js/npcs/confession-rites.js` 那场定情之仪；**场景层缺席时（未挂载／存档来自旧局／`offer` 返回 false）逐字回落到原实现**：`:3222` 的成功分支（+5 好感 / +8 深情 / `_loveAccepted_confess` / `_markLoveCd`）与 `:3223` 的婉拒分支（-2 情面）**一个字都没改**。这是 E1~E5 仍绿的原因——`tests/v20.25-romance-fix-node.js` 是**直接 vm 抽 `executeEmotionInteraction`** 跑的，沙箱里没有 `window.ConfessionRites`，`:3221` 的三重守卫短路，走的还是原实现：**62 passed** 实测复现。另 `:3169` 新增 `window.BOND_DAO_FINAL_CHAPTER = BOND_DAO_FINAL_CHAPTER;`（37 人名册从私变量挂成 window，场景层 `:74` 要读它做整册排除）——真页面实测 `Object.keys(...).length === 37`。⚠️ **本条与加载顺序绑死**：场景层排在 `npc-system.js` 之后才读得到 `EMOTION_TYPES.confess`（`:132`）与这份名册；反过来排在前面则 `:3221` 恒假、静默退回单行文案（不报错、不变红——这正是「写完没挂」最难发现的原因）
- `js/npcs/penglai-events.js` :: penglai-events.js - 瀛晚照线情缘事件/结局/性别语境 v1.0（蓬莱扩线） · 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
  **机制**：数据表 + 状态机（同构模板）· 关键数据 `PL_MAIN_EVENTS` **14 场** + `PL_ENDINGS` **6 个结局** + `PL_GENDER_CTX_EVENTS` **2 场** = 运行时注册 **16 场**
  **对外接口**：`window.PL_NPC_ID` / `PL_MAIN_EVENTS` / `PL_ENDINGS` / `maybeAutoTriggerPlEvent`（4 个）· **事件**：`timeSystem.onNewDaySubscribe` 每日自动触发 1 处 · **依赖**：`npc-personal-events.js`（`NPC_PERSONAL_EVENTS` / `registerEndingSet` / `registerEndingCallback` / `canPlayerAccessPersonalEvent` / `triggerPersonalEvent`）· 本线定位：蓬莱扩线
  **已知缺口**：四个 `window` 导出外部 0 引用——但 `:53x` 的每日钩子与 `:49x` 的 `Object.assign(NPC_PERSONAL_EVENTS, ...)` 在本文件内消费，**不是死代码**（判「死」必须回原文件核调用点，倒排索引看不到字符串字面量）。　每日触发是否先判地点：**否**——35 个同构文件里只有 3 个这么写，口径不统一（不判的那 32 个靠 `npcManager.getNPC(id)` 拿不到人就 return，效果等价但多一次无用查询）
- `js/npcs/personality-driver.js` :: personality-driver.js — v20.5 P16 性格驱动层
  **机制**：判定函数（IIFE，211 行）· 关键数据 无表（全部现算）· 6 个 api：`compat(a, b)`（两人性格相容度）/ `actionWeights(npc)`（行动权重）/ `socialBias(npc)` / `distortRumor(npc, rumor, opts)`（传闻失真）/ `driftPersonality(npc, dim, delta, reason)`（性格漂移）/ `glossFor` / `poleWord` · 对外接口 走 `global.P16Driver`（**0 个具名 `window.` 导出**）· 消费者 **2 个**：`npc-life-actor.js`（`:16/:180`）/ `social-intervene.js`（`:11`）· 依赖 `personality16.js` · 机制：v20.5 P16 性格驱动层——让五维性格真正影响行动权重、社交倾向、传闻走样与长期漂移 · 缺口：无（`driftPersonality` 被 `npc-rel-events.js` 经 `global.driftPersonality` 调用，是跨簇接口）
- `js/npcs/personality16.js` :: personality16.js — 16Personalities 五维性格模型（v14.2）
  **机制**：判定函数（IIFE，292 行）· 关键数据 16Personalities 五维模型（大五/七维维度的常模与派生规则）· 11 个 api：`ensure` / `typeOf` / `tailFor` / `identityTailFor` / `dimLineFor` / `barsHtml` / `deriveBig5FromP16` / `deriveP16FromBig5` · 对外接口 1 个（`window.Personality16`）· 消费者：`npc-system.js`(`:1434`) / `battle.js`(`:2738`) / `personality-driver.js`(`:11/:17/:29`) / `npc-lineage.js`(`:219`) · 机制：v14.2 五维性格模型，兼做 **P16 ↔ Big5 双向换算**（老档迁移用）· 依赖 无 · 缺口：无 —— 4 个消费者跨 4 个子簇，是本批被引用最广的纯模型文件
- `js/npcs/pili-events.js` :: pili-events.js - 雷惊蛰线情缘事件/结局/性别语境 v1.0（霹雳堂扩线） · 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
  **机制**：数据表 + 状态机（同构模板）· 关键数据 `PI_MAIN_EVENTS` **14 场** + `PI_ENDINGS` **6 个结局** + `PI_GENDER_CTX_EVENTS` **2 场** = 运行时注册 **16 场**
  **对外接口**：`window.PI_NPC_ID` / `PI_MAIN_EVENTS` / `PI_ENDINGS` / `maybeAutoTriggerPiEvent`（4 个）· **事件**：`timeSystem.onNewDaySubscribe` 每日自动触发 1 处 · **依赖**：`npc-personal-events.js`（`NPC_PERSONAL_EVENTS` / `registerEndingSet` / `registerEndingCallback` / `canPlayerAccessPersonalEvent` / `triggerPersonalEvent`）· 本线定位：霹雳堂扩线
  **已知缺口**：四个 `window` 导出外部 0 引用——但 `:53x` 的每日钩子与 `:49x` 的 `Object.assign(NPC_PERSONAL_EVENTS, ...)` 在本文件内消费，**不是死代码**（判「死」必须回原文件核调用点，倒排索引看不到字符串字面量）。　每日触发是否先判地点：**否**——35 个同构文件里只有 3 个这么写，口径不统一（不判的那 32 个靠 `npcManager.getNPC(id)` 拿不到人就 return，效果等价但多一次无用查询）
- `js/npcs/player-rumor.js` :: player-rumor.js — v20.6 闭环①③ 玩家进入传闻网 + 传闻改变行为
  **机制**：判定函数（IIFE，179 行）· 关键数据 传闻存储 `knownPlayerRumors`（按 npcId 存已知传闻）+ `trustFactor(npcId)` · 6 个 api：`pushDeed` / `trustFactor` / `knownPlayerRumors` / `playerRumorAttitude` / `getPlayerRumorSection` · 对外接口 走 `global.PlayerRumor` + **3 个具名全局**：`global.playerPushDeed`（← `private-school.js` / `cricket-fight.js` / `disguise-system.js` 等多方调用，**是玩家 deeds 的统一写入口**）/ `global.playerRumorAttitude` / `global.getPlayerRumorSection`（← `npc-system.js:3976` 注入对话面板）· 事件 `EventBus` **2 处**：`quest:completed` / `cultivation:breakthrough`（玩家做大事自动进传闻网）· 依赖 `npc-life-actor.js` / `personality-driver.js` · 机制：v20.6 闭环①③ —— 传闻**改变 NPC 行为**（`playerRumorAttitude` 影响态度，`getPlayerRumorSection` 在 NPC 面板显示「他听说了你什么」）· **缺口**：`global.PlayerRumor` 对象本身全仓 0 引用（方法已逐个挂成具名全局，对象是多余包装）
- `js/npcs/qingcheng-events.js` :: qingcheng-events.js - 幽翠微线情缘事件/结局/性别语境 v1.0（青城扩线） · 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
  **机制**：数据表 + 状态机（同构模板）· 关键数据 `QING_MAIN_EVENTS` **14 场** + `QING_ENDINGS` **6 个结局** + `QING_GENDER_CTX_EVENTS` **2 场** = 运行时注册 **16 场**
  **对外接口**：`window.QING_NPC_ID` / `QING_MAIN_EVENTS` / `QING_ENDINGS` / `maybeAutoTriggerQingEvent`（4 个）· **事件**：`timeSystem.onNewDaySubscribe` 每日自动触发 1 处 · **依赖**：`npc-personal-events.js`（`NPC_PERSONAL_EVENTS` / `registerEndingSet` / `registerEndingCallback` / `canPlayerAccessPersonalEvent` / `triggerPersonalEvent`）· 本线定位：青城扩线
  **已知缺口**：四个 `window` 导出外部 0 引用——但 `:53x` 的每日钩子与 `:49x` 的 `Object.assign(NPC_PERSONAL_EVENTS, ...)` 在本文件内消费，**不是死代码**（判「死」必须回原文件核调用点，倒排索引看不到字符串字面量）。　每日触发是否先判地点：**否**——35 个同构文件里只有 3 个这么写，口径不统一（不判的那 32 个靠 `npcManager.getNPC(id)` 拿不到人就 return，效果等价但多一次无用查询）
- `js/npcs/quanzhen-events.js` :: quanzhen-events.js - 翀玉衡线情缘事件/结局/性别语境 v1.0（全真教扩线·玄门正宗线） · 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
  **机制**：数据表 + 状态机（同构模板）· 关键数据 `QZ_MAIN_EVENTS` **14 场** + `QZ_ENDINGS` **6 个结局** + `QZ_GENDER_CTX_EVENTS` **2 场** = 运行时注册 **16 场**
  **对外接口**：`window.QZ_NPC_ID` / `QZ_MAIN_EVENTS` / `QZ_ENDINGS` / `maybeAutoTriggerQzEvent`（4 个）· **事件**：`timeSystem.onNewDaySubscribe` 每日自动触发 1 处 · **依赖**：`npc-personal-events.js`（`NPC_PERSONAL_EVENTS` / `registerEndingSet` / `registerEndingCallback` / `canPlayerAccessPersonalEvent` / `triggerPersonalEvent`）· 本线定位：全真教·玄门正宗线
  **已知缺口**：四个 `window` 导出外部 0 引用——但 `:53x` 的每日钩子与 `:49x` 的 `Object.assign(NPC_PERSONAL_EVENTS, ...)` 在本文件内消费，**不是死代码**（判「死」必须回原文件核调用点，倒排索引看不到字符串字面量）。　每日触发是否先判地点：**否**——35 个同构文件里只有 3 个这么写，口径不统一（不判的那 32 个靠 `npcManager.getNPC(id)` 拿不到人就 return，效果等价但多一次无用查询）
- `js/npcs/rivalry-chain.js` :: rivalry-chain.js - v20.0 2.9 宿敌长期对抗链 · 高仇恨 NPC 定期寻仇→最终决战，跨境界长期对抗 · 复用 NPC.relationship.hatred，无新存档。依赖：1.4 NPC、battle
  **机制**：状态机（137 行）· 关键数据 无表（复用 `NPC.relationship.hatred`，**无新存档**）· 7 个函数：`duelRival`(:22) / `maybeRivalRevenge`(:87) / `isInSoulState` / `getRivals` 等 · 对外接口 **6 个**，真出口 `settleRivalDuel`（← **`app.js`**）· 依赖 `npc-system.js`（`getRivals`）/ `battle.js` / `reincarnation-system.js`（`isInSoulState`）/ `getRealmTier` · 机制：v20.0 2.9 宿敌长期对抗链——高仇恨 NPC 定期寻仇 → 最终决战，跨境界长期对抗 · **缺口**：`duelRival` / `maybeRivalRevenge` 外部 0 引用，但 `:116` / `:127` 在本文件日结钩子内自调（是活的）；真正的战斗结算是 `settleRivalDuel` 由 app.js 调
- `js/npcs/secret-leverage.js` :: secret-leverage.js — 秘密系统2.0·一期骨架（v13.6）
  **机制**：混合（数据表 + 判定函数，IIFE，700 行）· 关键数据 4 组兑换比率常量 `coerceTrustFloor` / `betrayMood` / `tradeAffection` / `tradeRespect` / `tradeTrust` / `tradeMood` / `promiseTrust` + `betrayChance`（背叛概率判定）· 13 个 api：`openMenu` / `confirmAct` / `act` / `getState` / `isHostile` / `betrayChance` 等 · 对外接口 **9 个**，全部有外部消费者：`setFlag`（← 三个 `*-events.js`）、`getReputationValue` / `reduceReputation` / `addReputation`（← `reputation-system.js` / `enhanced-shop.js` / `crime-works.js` / `grand-legacy.js`）、`SecretLeverage` 对象（← `social-content.js`）· 依赖 `npc-system.js` / `reputation-system.js` · 机制：秘密系统 2.0 —— 用秘密换四轨关系（好感/敬重/信任/心情），也承诺与背叛 · 缺口：无 —— 9 个导出全部有外部消费者
- `js/npcs/shaolin-events.js` :: shaolin-events.js - 竺照禅线情缘事件/结局/性别语境 v1.0（少林寺扩线·女主侧） · 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
  **机制**：数据表 + 状态机（同构模板）· 关键数据 `SHAO_MAIN_EVENTS` **14 场** + `SHAO_ENDINGS` **6 个结局** + `SHAO_GENDER_CTX_EVENTS` **2 场** = 运行时注册 **16 场**
  **对外接口**：`window.SHAO_NPC_ID` / `SHAO_MAIN_EVENTS` / `SHAO_ENDINGS` / `maybeAutoTriggerShaoEvent`（4 个）· **事件**：`timeSystem.onNewDaySubscribe` 每日自动触发 1 处 · **依赖**：`npc-personal-events.js`（`NPC_PERSONAL_EVENTS` / `registerEndingSet` / `registerEndingCallback` / `canPlayerAccessPersonalEvent` / `triggerPersonalEvent`）· 本线定位：少林寺女主侧
  **已知缺口**：四个 `window` 导出外部 0 引用——但 `:53x` 的每日钩子与 `:49x` 的 `Object.assign(NPC_PERSONAL_EVENTS, ...)` 在本文件内消费，**不是死代码**（判「死」必须回原文件核调用点，倒排索引看不到字符串字面量）。　每日触发是否先判地点：**否**——35 个同构文件里只有 3 个这么写，口径不统一（不判的那 32 个靠 `npcManager.getNPC(id)` 拿不到人就 return，效果等价但多一次无用查询）
- `js/npcs/shaolin-pojie-events.js` :: shaolin-pojie-events.js - 少林破戒僧·无咎线情缘事件/结局/性别语境 v1.0（特殊紧凑线：8事件3结局）
  **机制**：数据表 + 状态机（417 行）· 关键数据 `WUJIU_MAIN_EVENTS`(`:27`) **8 条** + `WUJIU_ENDINGS`(`:257`) **3 个** + `WUJIU_GENDER_CTX_EVENTS`(`:294`) **2 条** = **10 场 / 30 个选项** —— **全批唯一的「特殊紧凑线」**（其余 35 派一律 14 场 / 6 结局）· 对外接口 4 个（`WUJIU_NPC_ID` / `WUJIU_MAIN_EVENTS` / `WUJIU_ENDINGS` / `maybeAutoTriggerWujiuEvent`）· 事件 每日钩子 1 处（`:384`）· 依赖 `npc-personal-events.js` · 配套 `wujiu-jealousy.js`（灶台九桩）
- `js/npcs/shenji-events.js` :: shenji-events.js - 戚巧机线情缘事件/结局/性别语境 v1.0（神机门扩线·匠作线） · 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
  **机制**：数据表 + 状态机（同构模板）· 关键数据 `SJ_MAIN_EVENTS` **14 场** + `SJ_ENDINGS` **6 个结局** + `SJ_GENDER_CTX_EVENTS` **2 场** = 运行时注册 **16 场**
  **对外接口**：`window.SJ_NPC_ID` / `SJ_MAIN_EVENTS` / `SJ_ENDINGS` / `maybeAutoTriggerSjEvent`（4 个）· **事件**：`timeSystem.onNewDaySubscribe` 每日自动触发 1 处 · **依赖**：`npc-personal-events.js`（`NPC_PERSONAL_EVENTS` / `registerEndingSet` / `registerEndingCallback` / `canPlayerAccessPersonalEvent` / `triggerPersonalEvent`）· 本线定位：神机门·匠作线
  **已知缺口**：四个 `window` 导出外部 0 引用——但 `:53x` 的每日钩子与 `:49x` 的 `Object.assign(NPC_PERSONAL_EVENTS, ...)` 在本文件内消费，**不是死代码**（判「死」必须回原文件核调用点，倒排索引看不到字符串字面量）。　每日触发是否先判地点：**否**——35 个同构文件里只有 3 个这么写，口径不统一（不判的那 32 个靠 `npcManager.getNPC(id)` 拿不到人就 return，效果等价但多一次无用查询）
- `js/npcs/skill-transmission.js` :: skill-transmission.js — v20.88 功法传承担系 · 两条线： · 请教（NPC→玩家）：NPC 真的「会」功法（持有网），玩家挑一门，耗情分+灵石，领悟检定， · 成则学会、败则只记「听闻」线索。三品需化神以上境界
  **机制**：判定函数 + 数据表（IIFE，449 行）· 关键数据 `SECT_SKILL_POOLS`（按门派主题分派功法，如 少林=金刚伏魔/金钟罩/金刚掌，嵩山=万剑归宗/风卷残云/破天一击）+ `GRADE_COST` **按品阶定价**（九品 favor10/stones100 → 八品20/300 → 七品25/500 → 五品30/800，三品需化神以上）· api：`ensureHolders` / `npcTeachable` / `openRequestUI` / `pickRequest` / `openTeachUI` / `pickTeach` / `tierOf` · 对外接口 **6 个**，真出口 `SkillTransmission`（← `npc-system.js` / `sect-internal.js`）· 依赖 `npc-system.js`（`findSkillById` / `resetNPCSystem`）/ `cultivation.js` / `equipment.js` / `knowledge-system.js` · 机制：v20.88 两条线 —— 请教（NPC→玩家：耗情分+灵石，领悟检定，成则学会、败则只记「听闻」线索）与传授（玩家→NPC：NPC 真学会，`combat.skills` 入档、切磋可用）· **持有网 `ensureHolders` 把全部 50 门功法（尤其 23 门无主功法）分派给掌门/长老并合并 `SECT_DEEP_DATA` masters 的 skills，幂等可反复调用** · 缺口：无
- `js/npcs/social-content.js` :: social-content.js — 社交页扩展：话题×7 + 情报×5 + 动态问候（v14.0）
  **机制**：数据表 + 渲染层（IIFE，**1106 行**）· 关键数据 17 张表：`TALK_SUBIDS` / `REPEAT_TOPIC_POOL` / `REPEAT_INTEL_POOL` / `HEAVY_TOPICS` / `LIGHT_TOPICS` / `TOPIC_GENERATORS`（**7 个话题生成器**：recent/hobbies/history/future/worries/dreams/complaints）/ `INTEL_GENERATORS`（**5 个情报生成器**：market_prices/secret_realms/gossip/sect_movements/black_market）/ `FU_INTEL` / `FOLLOWUP_BUILDERS` / 问候四表 `GREET_TIME` / `GREET_REL` / `PERSONA_TAIL` / 告别两表 `FAREWELL_TIME` / `FAREWELL_REL` / `SUB_AFF_GATE`（子选项好感门槛）/ `BYSTANDER_LINES` · 对外接口 **8 个**，真出口 `getDeepTalkResponse` / `executeDeepTalkSubOption`（← `npc-system.js` / `secret-leverage.js` / `app.js`）/ `getGreeting`（← `npc-system.js` / `baihua-personal-events.js` / `storylines-v2/batch*.js`）/ `getFarewell`（← `npc-system.js`）· 依赖 `npc-system.js` / `reputation-system.js`（`getReputationDiscount`）/ `inventory.js`（`getMarkedForSaleItems`）· **本文件是「社交面板默认关闭」那句话的落点** —— 7 类话题 + 5 类情报 + 动态问候全在这里，`npc-system.js:3702` 的分层深谈面板调它 · 缺口：无（8 个导出全部有外部消费者）
- `js/npcs/social-intervene.js` :: social-intervene.js — v20.5 玩家介入 NPC 恩怨（大纲 M2）
  **机制**：判定函数 + 渲染层（IIFE，284 行）· 关键数据 无表（现算：花灵石/耗时/扣好感）· 8 个 api：`mediationTargets` / `canMediate` / `mediateNpcs` / `rumorTopics` / `playRumorAction`（stoke 添油加醋 / clear 澄清辟谣）/ `getInterventionButtons` · 对外接口 走 `global.SocialIntervene` + **1 个具名全局 `global.getInterventionButtons`（← `npc-system.js:3973` 注入对话面板，是唯一真出口）** · 依赖 `npc-system.js` / `npc-life-actor.js` / `personality-driver.js`（`P16Driver`）/ `game-state.js` · 机制：v20.5 大纲 M2 玩家介入 NPC 恩怨——远程给「需亲至」锁定条（与个人事件栏同款交互语言），亲至才给调停与递话按钮 · 机制内接线：`:250/:257/:259` 的内联 `onclick=「SocialIntervene.mediateNpcs(...)」` 消费同文件函数 · **缺口**：`global.SocialIntervene` 对象本身外部 0 引用（方法已逐个挂出，对象是多余包装）
- `js/npcs/songshan-events.js` :: songshan-events.js - 逵佩南线情缘事件/结局/性别语境 v1.0（嵩山派男主扩线） · 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
  **机制**：数据表 + 状态机（同构模板）· 关键数据 `SONG_MAIN_EVENTS` **14 场** + `SONG_ENDINGS` **6 个结局** + `SONG_GENDER_CTX_EVENTS` **2 场** = 运行时注册 **16 场**
  **对外接口**：`window.SONG_NPC_ID` / `SONG_MAIN_EVENTS` / `SONG_ENDINGS` / `maybeAutoTriggerSongEvent`（4 个）· **事件**：`timeSystem.onNewDaySubscribe` 每日自动触发 1 处 · **依赖**：`npc-personal-events.js`（`NPC_PERSONAL_EVENTS` / `registerEndingSet` / `registerEndingCallback` / `canPlayerAccessPersonalEvent` / `triggerPersonalEvent`）· 本线定位：嵩山派男主扩线
  **已知缺口**：四个 `window` 导出外部 0 引用——但 `:53x` 的每日钩子与 `:49x` 的 `Object.assign(NPC_PERSONAL_EVENTS, ...)` 在本文件内消费，**不是死代码**（判「死」必须回原文件核调用点，倒排索引看不到字符串字面量）。　每日触发是否先判地点：**否**——35 个同构文件里只有 3 个这么写，口径不统一（不判的那 32 个靠 `npcManager.getNPC(id)` 拿不到人就 return，效果等价但多一次无用查询）
- `js/npcs/special-npcs.js` :: js/npcs/special-npcs.js - 10个特殊NPC预设数据 · 从data.js拆出，独立加载 · 加载顺序：在 npc-system.js 之前
  **机制**：纯数据表（1610 行）· 关键数据 `SPECIAL_NPC_DATA` **11 条**（mentor_01 / healer_01 / warrior_01 / merchant_01 / elder_01 / rival_01 / villager_01 / alchemist_01 / craftsman_01 / mysterious_01 / **shaolin_wujiu** 破戒僧），每条 14 字段（id/name/gender/age/occupation/location/icon/appearance/background/personalityBig5/combat/profession/preferences/schedule/dialogueTree）；`SPECIAL_NPC_DEFINITIONS` **38 条**核心 NPC 固定定义（`sect_leader_修罗宫` 绯泪 等），**优先级高于 `sect-internal.js` 的随机生成**，保证读档/新游戏时核心 NPC 数据一致 · 对外接口 2 个（`window.SPECIAL_NPC_DATA` / `window.SPECIAL_NPC_DEFINITIONS`）· 依赖 无（纯数据）· 消费者：`city-residents.js`（并入注册表）、`jealousy-social.js`（36 人名册）、`npc-system.js`、`sect-internal.js` · **缺口**：① `:2` 头注释「10个特殊NPC预设数据」vs 实测 **11 条**（多一条破戒僧），且**未提同文件还有 38 条 `SPECIAL_NPC_DEFINITIONS`**；② `NPC_STORYLINES` 相关的 `npc_storylines` 命名与 `NPC_Storylines` 双写
- `js/npcs/taishan-events.js` :: taishan-events.js - 岳清晓线情缘事件/结局/性别语境 v1.0（泰山扩线） · 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
  **机制**：数据表 + 状态机（同构模板）· 关键数据 `TAI_MAIN_EVENTS` **14 场** + `TAI_ENDINGS` **6 个结局** + `TAI_GENDER_CTX_EVENTS` **2 场** = 运行时注册 **16 场**
  **对外接口**：`window.TAI_NPC_ID` / `TAI_MAIN_EVENTS` / `TAI_ENDINGS` / `maybeAutoTriggerTaiEvent`（4 个）· **事件**：`timeSystem.onNewDaySubscribe` 每日自动触发 1 处 · **依赖**：`npc-personal-events.js`（`NPC_PERSONAL_EVENTS` / `registerEndingSet` / `registerEndingCallback` / `canPlayerAccessPersonalEvent` / `triggerPersonalEvent`）· 本线定位：泰山扩线
  **已知缺口**：四个 `window` 导出外部 0 引用——但 `:53x` 的每日钩子与 `:49x` 的 `Object.assign(NPC_PERSONAL_EVENTS, ...)` 在本文件内消费，**不是死代码**（判「死」必须回原文件核调用点，倒排索引看不到字符串字面量）。　每日触发是否先判地点：**否**——35 个同构文件里只有 3 个这么写，口径不统一（不判的那 32 个靠 `npcManager.getNPC(id)` 拿不到人就 return，效果等价但多一次无用查询）
- `js/npcs/tangmen-events.js` :: tangmen-events.js - 晏万解线情缘事件/结局/性别语境 v1.0（唐门扩线） · 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
  **机制**：数据表 + 状态机（同构模板）· 关键数据 `TM_MAIN_EVENTS` **14 场** + `TM_ENDINGS` **6 个结局** + `TM_GENDER_CTX_EVENTS` **2 场** = 运行时注册 **16 场**
  **对外接口**：`window.TM_NPC_ID` / `TM_MAIN_EVENTS` / `TM_ENDINGS` / `maybeAutoTriggerTmEvent`（4 个）· **事件**：`timeSystem.onNewDaySubscribe` 每日自动触发 1 处 · **依赖**：`npc-personal-events.js`（`NPC_PERSONAL_EVENTS` / `registerEndingSet` / `registerEndingCallback` / `canPlayerAccessPersonalEvent` / `triggerPersonalEvent`）· 本线定位：唐门扩线
  **已知缺口**：四个 `window` 导出外部 0 引用——但 `:53x` 的每日钩子与 `:49x` 的 `Object.assign(NPC_PERSONAL_EVENTS, ...)` 在本文件内消费，**不是死代码**（判「死」必须回原文件核调用点，倒排索引看不到字符串字面量）。　每日触发是否先判地点：**否**——35 个同构文件里只有 3 个这么写，口径不统一（不判的那 32 个靠 `npcManager.getNPC(id)` 拿不到人就 return，效果等价但多一次无用查询）
- `js/npcs/tianlong-events.js` :: tianlong-events.js - 檀望舒线情缘事件/结局/性别语境 v1.0（天龙教扩线·反派阵营线） · 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
  **机制**：数据表 + 状态机（同构模板）· 关键数据 `LONG_MAIN_EVENTS` **14 场** + `LONG_ENDINGS` **6 个结局** + `LONG_GENDER_CTX_EVENTS` **2 场** = 运行时注册 **16 场**
  **对外接口**：`window.LONG_NPC_ID` / `LONG_MAIN_EVENTS` / `LONG_ENDINGS` / `maybeAutoTriggerLongEvent`（4 个）· **事件**：`timeSystem.onNewDaySubscribe` 每日自动触发 1 处 · **依赖**：`npc-personal-events.js`（`NPC_PERSONAL_EVENTS` / `registerEndingSet` / `registerEndingCallback` / `canPlayerAccessPersonalEvent` / `triggerPersonalEvent`）· 本线定位：天龙教·反派阵营线
  **已知缺口**：四个 `window` 导出外部 0 引用——但 `:53x` 的每日钩子与 `:49x` 的 `Object.assign(NPC_PERSONAL_EVENTS, ...)` 在本文件内消费，**不是死代码**（判「死」必须回原文件核调用点，倒排索引看不到字符串字面量）。　每日触发是否先判地点：**否**——35 个同构文件里只有 3 个这么写，口径不统一（不判的那 32 个靠 `npcManager.getNPC(id)` 拿不到人就 return，效果等价但多一次无用查询）
- `js/npcs/tianshan-events.js` :: tianshan-events.js - 琤霄凌线情缘事件/结局/自动触发 v1.0 · 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
  **机制**：数据表 + 状态机（同构模板）· 关键数据 `TIANSHAN_MAIN_EVENTS` **12 场** + `TIANSHAN_ENDINGS` **6 个结局** + `TIANSHAN_GENDER_CTX_EVENTS` **0 场** = 运行时注册 **12 场**
  **对外接口**：`window.TIANSHAN_NPC_ID` / `TIANSHAN_MAIN_EVENTS` / `TIANSHAN_ENDINGS` / `maybeAutoTriggerTianshanEvent`（4 个）· **事件**：`timeSystem.onNewDaySubscribe` 每日自动触发 1 处 · **依赖**：`npc-personal-events.js`（`NPC_PERSONAL_EVENTS` / `registerEndingSet` / `registerEndingCallback` / `canPlayerAccessPersonalEvent` / `triggerPersonalEvent`）· 本线定位：天山派扩线　**★ 缺口：本线没有性别语境事件层**——其余 34 派一律带 `TIANSHAN_GENDER_CTX_EVENTS` 2 场（按玩家性别分岔），本文件全文 0 处 `GENDER_CTX`/`gender`，女/男玩家走的是同一套 12 场主线　**另：本线 MAIN 只有 12 场而非 14 场**，与模板差 2 场
  **已知缺口**：四个 `window` 导出外部 0 引用——但 `:53x` 的每日钩子与 `:49x` 的 `Object.assign(NPC_PERSONAL_EVENTS, ...)` 在本文件内消费，**不是死代码**（判「死」必须回原文件核调用点，倒排索引看不到字符串字面量）。　每日触发是否先判地点：**否**——35 个同构文件里只有 3 个这么写，口径不统一（不判的那 32 个靠 `npcManager.getNPC(id)` 拿不到人就 return，效果等价但多一次无用查询）
- `js/npcs/tianshu-events.js` :: tianshu-events.js - 宓书言线情缘事件/结局/性别语境 v1.0（天书阁男主扩线） · 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
  **机制**：数据表 + 状态机（同构模板）· 关键数据 `SHU_MAIN_EVENTS` **14 场** + `SHU_ENDINGS` **6 个结局** + `SHU_GENDER_CTX_EVENTS` **2 场** = 运行时注册 **16 场**
  **对外接口**：`window.SHU_NPC_ID` / `SHU_MAIN_EVENTS` / `SHU_ENDINGS` / `maybeAutoTriggerShuEvent`（4 个）· **事件**：`timeSystem.onNewDaySubscribe` 每日自动触发 1 处 · **依赖**：`npc-personal-events.js`（`NPC_PERSONAL_EVENTS` / `registerEndingSet` / `registerEndingCallback` / `canPlayerAccessPersonalEvent` / `triggerPersonalEvent`）· 本线定位：天书阁男主扩线
  **已知缺口**：四个 `window` 导出外部 0 引用——但 `:53x` 的每日钩子与 `:49x` 的 `Object.assign(NPC_PERSONAL_EVENTS, ...)` 在本文件内消费，**不是死代码**（判「死」必须回原文件核调用点，倒排索引看不到字符串字面量）。　每日触发是否先判地点：**否**——35 个同构文件里只有 3 个这么写，口径不统一（不判的那 32 个靠 `npcManager.getNPC(id)` 拿不到人就 return，效果等价但多一次无用查询）
- `js/npcs/tianya-events.js` :: tianya-events.js - 狄长亭线情缘事件/结局/性别语境 v1.0（天涯海阁男主线） · 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
  **机制**：数据表 + 状态机（同构模板）· 关键数据 `TY_MAIN_EVENTS` **11 场** + `TY_ENDINGS` **6 个结局** + `TY_GENDER_CTX_EVENTS` **2 场** = 运行时注册 **13 场**
  **对外接口**：`window.TY_NPC_ID` / `TY_MAIN_EVENTS` / `TY_ENDINGS` / `maybeAutoTriggerTyEvent`（4 个）· **事件**：`timeSystem.onNewDaySubscribe` 每日自动触发 1 处 · **依赖**：`npc-personal-events.js`（`NPC_PERSONAL_EVENTS` / `registerEndingSet` / `registerEndingCallback` / `canPlayerAccessPersonalEvent` / `triggerPersonalEvent`）· 本线定位：天涯海阁男主线　**另：本线 MAIN 只有 11 场而非 14 场**，与模板差 3 场
  **已知缺口**：四个 `window` 导出外部 0 引用——但 `:53x` 的每日钩子与 `:49x` 的 `Object.assign(NPC_PERSONAL_EVENTS, ...)` 在本文件内消费，**不是死代码**（判「死」必须回原文件核调用点，倒排索引看不到字符串字面量）。　每日触发是否先判地点：**否**——35 个同构文件里只有 3 个这么写，口径不统一（不判的那 32 个靠 `npcManager.getNPC(id)` 拿不到人就 return，效果等价但多一次无用查询）
- `js/npcs/tiezhang-events.js` :: tiezhang-events.js - 裘霜莺线情缘事件/结局/性别语境 v1.0（铁掌帮扩线·女主侧） · 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
  **机制**：数据表 + 状态机（同构模板）· 关键数据 `TZ_MAIN_EVENTS` **14 场** + `TZ_ENDINGS` **6 个结局** + `TZ_GENDER_CTX_EVENTS` **2 场** = 运行时注册 **16 场**
  **对外接口**：`window.TZ_NPC_ID` / `TZ_MAIN_EVENTS` / `TZ_ENDINGS` / `maybeAutoTriggerTzEvent`（4 个）· **事件**：`timeSystem.onNewDaySubscribe` 每日自动触发 1 处 · **依赖**：`npc-personal-events.js`（`NPC_PERSONAL_EVENTS` / `registerEndingSet` / `registerEndingCallback` / `canPlayerAccessPersonalEvent` / `triggerPersonalEvent`）· 本线定位：铁掌帮女主侧
  **已知缺口**：四个 `window` 导出外部 0 引用——但 `:53x` 的每日钩子与 `:49x` 的 `Object.assign(NPC_PERSONAL_EVENTS, ...)` 在本文件内消费，**不是死代码**（判「死」必须回原文件核调用点，倒排索引看不到字符串字面量）。　每日触发是否先判地点：**否**——35 个同构文件里只有 3 个这么写，口径不统一（不判的那 32 个靠 `npcManager.getNPC(id)` 拿不到人就 return，效果等价但多一次无用查询）
- `js/npcs/wudang-events.js` :: wudang-events.js - 阙守拙线情缘事件/结局/性别语境 v1.0（v20.74 第四批扩线） · 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
  **机制**：数据表 + 状态机（同构模板）· 关键数据 `WD_MAIN_EVENTS` **14 场** + `WD_ENDINGS` **6 个结局** + `WD_GENDER_CTX_EVENTS` **2 场** = 运行时注册 **16 场**
  **对外接口**：`window.WD_NPC_ID` / `WD_MAIN_EVENTS` / `WD_ENDINGS` / `maybeAutoTriggerWdEvent`（4 个）· **事件**：`timeSystem.onNewDaySubscribe` 每日自动触发 1 处 · **依赖**：`npc-personal-events.js`（`NPC_PERSONAL_EVENTS` / `registerEndingSet` / `registerEndingCallback` / `canPlayerAccessPersonalEvent` / `triggerPersonalEvent`）· 本线定位：武当派扩线
  **已知缺口**：四个 `window` 导出外部 0 引用——但 `:53x` 的每日钩子与 `:49x` 的 `Object.assign(NPC_PERSONAL_EVENTS, ...)` 在本文件内消费，**不是死代码**（判「死」必须回原文件核调用点，倒排索引看不到字符串字面量）。　每日触发是否先判地点：**否**——35 个同构文件里只有 3 个这么写，口径不统一（不判的那 32 个靠 `npcManager.getNPC(id)` 拿不到人就 return，效果等价但多一次无用查询）
- `js/npcs/wujiu-jealousy.js` :: wujiu-jealousy.js - 破戒僧·无咎吃醋套装 v20.80（灶台九桩） · 依赖：npc-personal-events.js（NPC_PERSONAL_EVENTS / canPlayerAccessPersonalEvent / hasEventTriggered）、
  **机制**：数据表 + 状态机（368 行）· 关键数据 `WUJIU_JEAL_EVENTS`(`:28`) **9 桩**（灶台九桩：柴账/手抖/成精的锅/凉了的饭/端出灶房的那碗/灶角的眼/两双筷子/灶王爷的名帖/压实的饭）+ `WUJIU_JEAL_ORDER`(`:322`) **固定 9 条出场顺序**（j09→j06→j05→j01→j02→j04→j07→j03→j08，**不是 id 序**）· 对外接口 **5 个** · 事件 每日钩子 1 处（`:332`）· 依赖 `shaolin-pojie-events.js`（无咎线）、`npc-personal-events.js` · **特点**：全批唯一用**显式顺序表**决定事件出场序的文件（其余 35 派按 id/flag 顺序）
- `js/npcs/wuxian-events.js` :: wuxian-events.js - 蓝凤凰线情缘事件/结局/自动触发 v1.0 · 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
  **机制**：数据表 + 状态机（同构模板）· 关键数据 `WUXIAN_MAIN_EVENTS` **12 场** + `WUXIAN_ENDINGS` **6 个结局** + `WUXIAN_GENDER_CTX_EVENTS` **0 场** = 运行时注册 **12 场**
  **对外接口**：`window.WUXIAN_NPC_ID` / `WUXIAN_MAIN_EVENTS` / `WUXIAN_ENDINGS` / `maybeAutoTriggerWuxianEvent`（4 个）· **事件**：`timeSystem.onNewDaySubscribe` 每日自动触发 1 处 · **依赖**：`npc-personal-events.js`（`NPC_PERSONAL_EVENTS` / `registerEndingSet` / `registerEndingCallback` / `canPlayerAccessPersonalEvent` / `triggerPersonalEvent`）· 本线定位：五仙教扩线　**★ 缺口：本线没有性别语境事件层**——其余 34 派一律带 `WUXIAN_GENDER_CTX_EVENTS` 2 场（按玩家性别分岔），本文件全文 0 处 `GENDER_CTX`/`gender`，女/男玩家走的是同一套 12 场主线　**另：本线 MAIN 只有 12 场而非 14 场**，与模板差 2 场
  **已知缺口**：四个 `window` 导出外部 0 引用——但 `:53x` 的每日钩子与 `:49x` 的 `Object.assign(NPC_PERSONAL_EVENTS, ...)` 在本文件内消费，**不是死代码**（判「死」必须回原文件核调用点，倒排索引看不到字符串字面量）。　每日触发是否先判地点：**否**——35 个同构文件里只有 3 个这么写，口径不统一（不判的那 32 个靠 `npcManager.getNPC(id)` 拿不到人就 return，效果等价但多一次无用查询）
- `js/npcs/xiaoyao-events.js` :: xiaoyao-events.js - 闻人酌线情缘事件/结局/性别语境 v1.0（v20.75 第五批扩线） · 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
  **机制**：数据表 + 状态机（同构模板）· 关键数据 `XY_MAIN_EVENTS` **14 场** + `XY_ENDINGS` **6 个结局** + `XY_GENDER_CTX_EVENTS` **2 场** = 运行时注册 **16 场**
  **对外接口**：`window.XY_NPC_ID` / `XY_MAIN_EVENTS` / `XY_ENDINGS` / `maybeAutoTriggerXyEvent`（4 个）· **事件**：`timeSystem.onNewDaySubscribe` 每日自动触发 1 处 · **依赖**：`npc-personal-events.js`（`NPC_PERSONAL_EVENTS` / `registerEndingSet` / `registerEndingCallback` / `canPlayerAccessPersonalEvent` / `triggerPersonalEvent`）· 本线定位：逍遥派扩线
  **已知缺口**：四个 `window` 导出外部 0 引用——但 `:53x` 的每日钩子与 `:49x` 的 `Object.assign(NPC_PERSONAL_EVENTS, ...)` 在本文件内消费，**不是死代码**（判「死」必须回原文件核调用点，倒排索引看不到字符串字面量）。　每日触发是否先判地点：**否**——35 个同构文件里只有 3 个这么写，口径不统一（不判的那 32 个靠 `npcManager.getNPC(id)` 拿不到人就 return，效果等价但多一次无用查询）
- `js/npcs/xiayin-events.js` :: xiayin-events.js - 简知忆线情缘事件/结局/性别语境 v1.0（侠隐阁男主扩线） · 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
  **机制**：数据表 + 状态机（同构模板）· 关键数据 `YIN_MAIN_EVENTS` **14 场** + `YIN_ENDINGS` **6 个结局** + `YIN_GENDER_CTX_EVENTS` **2 场** = 运行时注册 **16 场**
  **对外接口**：`window.YIN_NPC_ID` / `YIN_MAIN_EVENTS` / `YIN_ENDINGS` / `maybeAutoTriggerYinEvent`（4 个）· **事件**：`timeSystem.onNewDaySubscribe` 每日自动触发 1 处 · **依赖**：`npc-personal-events.js`（`NPC_PERSONAL_EVENTS` / `registerEndingSet` / `registerEndingCallback` / `canPlayerAccessPersonalEvent` / `triggerPersonalEvent`）· 本线定位：侠隐阁男主扩线
  **已知缺口**：四个 `window` 导出外部 0 引用——但 `:53x` 的每日钩子与 `:49x` 的 `Object.assign(NPC_PERSONAL_EVENTS, ...)` 在本文件内消费，**不是死代码**（判「死」必须回原文件核调用点，倒排索引看不到字符串字面量）。　每日触发是否先判地点：**否**——35 个同构文件里只有 3 个这么写，口径不统一（不判的那 32 个靠 `npcManager.getNPC(id)` 拿不到人就 return，效果等价但多一次无用查询）
- `js/npcs/xueshou-events.js` :: xueshou-events.js - 耿雪衣线情缘事件/结局/性别语境 v1.0（血手门扩线·反派阵营线） · 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
  **机制**：数据表 + 状态机（同构模板）· 关键数据 `XUE_MAIN_EVENTS` **14 场** + `XUE_ENDINGS` **6 个结局** + `XUE_GENDER_CTX_EVENTS` **2 场** = 运行时注册 **16 场**
  **对外接口**：`window.XUE_NPC_ID` / `XUE_MAIN_EVENTS` / `XUE_ENDINGS` / `maybeAutoTriggerXueEvent`（4 个）· **事件**：`timeSystem.onNewDaySubscribe` 每日自动触发 1 处 · **依赖**：`npc-personal-events.js`（`NPC_PERSONAL_EVENTS` / `registerEndingSet` / `registerEndingCallback` / `canPlayerAccessPersonalEvent` / `triggerPersonalEvent`）· 本线定位：血手门·反派阵营线
  **已知缺口**：四个 `window` 导出外部 0 引用——但 `:53x` 的每日钩子与 `:49x` 的 `Object.assign(NPC_PERSONAL_EVENTS, ...)` 在本文件内消费，**不是死代码**（判「死」必须回原文件核调用点，倒排索引看不到字符串字面量）。　每日触发是否先判地点：**否**——35 个同构文件里只有 3 个这么写，口径不统一（不判的那 32 个靠 `npcManager.getNPC(id)` 拿不到人就 return，效果等价但多一次无用查询）
- `js/npcs/yanluo-events.js` :: yanluo-events.js - 聂明泽线情缘事件/结局/性别语境 v1.0（阎罗殿反派阵营扩线） · 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
  **机制**：数据表 + 状态机（同构模板）· 关键数据 `YAN_MAIN_EVENTS` **14 场** + `YAN_ENDINGS` **6 个结局** + `YAN_GENDER_CTX_EVENTS` **2 场** = 运行时注册 **16 场**
  **对外接口**：`window.YAN_NPC_ID` / `YAN_MAIN_EVENTS` / `YAN_ENDINGS` / `maybeAutoTriggerYanEvent`（4 个）· **事件**：`timeSystem.onNewDaySubscribe` 每日自动触发 1 处 · **依赖**：`npc-personal-events.js`（`NPC_PERSONAL_EVENTS` / `registerEndingSet` / `registerEndingCallback` / `canPlayerAccessPersonalEvent` / `triggerPersonalEvent`）· 本线定位：阎罗殿·反派阵营线
  **已知缺口**：四个 `window` 导出外部 0 引用——但 `:53x` 的每日钩子与 `:49x` 的 `Object.assign(NPC_PERSONAL_EVENTS, ...)` 在本文件内消费，**不是死代码**（判「死」必须回原文件核调用点，倒排索引看不到字符串字面量）。　每日触发是否先判地点：**否**——35 个同构文件里只有 3 个这么写，口径不统一（不判的那 32 个靠 `npcManager.getNPC(id)` 拿不到人就 return，效果等价但多一次无用查询）
- `js/npcs/yaowang-events.js` :: yaowang-events.js - 芩木线情缘事件/结局/性别语境 v1.0 · 依赖：npcs/npc-personal-events.js · 男主·芩木（药王谷谷主继承人，医毒双修，温润锋芒，温润是戒律也是藏毒的壳）
  **机制**：数据表 + 状态机（同构模板）· 关键数据 `SU_MAIN_EVENTS` **14 场** + `SU_ENDINGS` **6 个结局** + `SU_GENDER_CTX_EVENTS` **2 场** = 运行时注册 **16 场**
  **对外接口**：`window.SU_NPC_ID` / `SU_MAIN_EVENTS` / `SU_ENDINGS` / `maybeAutoTriggerSuEvent`（4 个）· **事件**：`timeSystem.onNewDaySubscribe` 每日自动触发 1 处 · **依赖**：`npc-personal-events.js`（`NPC_PERSONAL_EVENTS` / `registerEndingSet` / `registerEndingCallback` / `canPlayerAccessPersonalEvent` / `triggerPersonalEvent`）· 本线定位：药王谷男主线·医毒双修
  **已知缺口**：四个 `window` 导出外部 0 引用——但 `:53x` 的每日钩子与 `:49x` 的 `Object.assign(NPC_PERSONAL_EVENTS, ...)` 在本文件内消费，**不是死代码**（判「死」必须回原文件核调用点，倒排索引看不到字符串字面量）。　每日触发是否先判地点：****是**（`:478`）**——35 个同构文件里只有 3 个这么写，口径不统一（不判的那 32 个靠 `npcManager.getNPC(id)` 拿不到人就 return，效果等价但多一次无用查询）
- `js/npcs/zhujian-events.js` :: zhujian-events.js - 冶砚线情缘事件/结局/性别语境 v1.0 · 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
  **机制**：数据表 + 状态机（同构模板）· 关键数据 `LU_MAIN_EVENTS` **14 场** + `LU_ENDINGS` **6 个结局** + `LU_GENDER_CTX_EVENTS` **2 场** = 运行时注册 **16 场**
  **对外接口**：`window.LU_NPC_ID` / `LU_MAIN_EVENTS` / `LU_ENDINGS` / `maybeAutoTriggerLuEvent`（4 个）· **事件**：`timeSystem.onNewDaySubscribe` 每日自动触发 1 处 · **依赖**：`npc-personal-events.js`（`NPC_PERSONAL_EVENTS` / `registerEndingSet` / `registerEndingCallback` / `canPlayerAccessPersonalEvent` / `triggerPersonalEvent`）· 本线定位：铸剑山庄男主线
  **已知缺口**：四个 `window` 导出外部 0 引用——但 `:53x` 的每日钩子与 `:49x` 的 `Object.assign(NPC_PERSONAL_EVENTS, ...)` 在本文件内消费，**不是死代码**（判「死」必须回原文件核调用点，倒排索引看不到字符串字面量）。　每日触发是否先判地点：**否**——35 个同构文件里只有 3 个这么写，口径不统一（不判的那 32 个靠 `npcManager.getNPC(id)` 拿不到人就 return，效果等价但多一次无用查询）

### js/npcs/storylines-v2/（3 个）— NPC · 故事线 v2

- `js/npcs/storylines-v2/batch1.js` :: storylines-v2/batch1.js — NPC故事线重写·第一批（v12.6）
  **机制**：数据表 + 判定函数（IIFE，676 行）· 关键数据 故事线重写第一批（认识→求助→秘密→关键选择→长期结果 五段结构）· 11 个函数 · 对外接口 **6 个**，真出口：`getStorylineChoice` / `recordStorylineChoice`（← batch2 / batch3 **互相调用，形成三批闭环**）/ `getPersonalEventButtons`（← `npc-personal-events.js` / `npc-system.js`）/ `maybeAutoTriggerPersonalEvent`（← 全部 37 个 `*-events.js` 共用）/ `triggerPersonalEvent` · 依赖 `npc-system.js` / `npc-personal-events.js` · **本文件是 storylines-v2 三批的公共底座**：`maybeAutoTriggerPersonalEvent` 是 36 位掌门每日自动触发的**唯一实现**，各 `*-events.js` 只是包一层传 npcId · 缺口：无 —— 6 个导出全部有外部消费者
- `js/npcs/storylines-v2/batch2.js` :: storylines-v2/batch2.js — NPC故事线重写·第二批（v13.4）
  **机制**：数据表 + 判定函数（IIFE，469 行）· 5 个函数 · 对外接口 **5 个**（与 batch1 同款接口：`getStorylineChoice` / `recordStorylineChoice` / `getPersonalEventButtons` / `getGreeting` / `maybeAutoTriggerPersonalEvent`）· 依赖 `npc-system.js` / `storylines-v2/batch1.js` · **三批共用同一套全局接口名**（不是模块化导出，而是往同一批 `window` 名上覆盖/补充）—— batch2/3 的 `getStorylineChoice` 会与 batch1 同名共存，谁生效取决于加载顺序与内部是否做链式调用 · 缺口：**三批用同名全局而非命名空间，加载顺序敏感**，是结构性隐患（未验证是否存在互相覆盖，**疑似**）
- `js/npcs/storylines-v2/batch3.js` :: storylines-v2/batch3.js — NPC故事线重写·第三批（收官）（v13.5）
  **机制**：数据表 + 判定函数（IIFE，1009 行 · 三批中最厚，收官批）· 8 张表 · 5 个函数 · 对外接口 **5 个**（同 batch1/2 接口名）· 依赖 `npc-system.js` / `storylines-v2/batch1.js` / `batch2.js` · 机制：NPC 故事线重写第三批（收官，v13.5）· 缺口：同 batch2 —— **三批共用同名全局，加载顺序敏感**（**疑似**存在互相覆盖，未逐行核）

### js/quest/（13 个）— 任务 / 主线 / 终局弧

- `js/quest/bounty-board.js` :: bounty-board.js - v20.1 江湖悬赏榜 · 对标鬼谷八荒悬赏榜/觅长生任务榜：随机刷新的高难度讨伐悬赏，奖励丰厚 · 与日常任务区分：日常固定低难度，悬赏随机刷新高难度高奖励 · 自管击杀进度（监听 enemy:defeated，杀任意敌人推进），不依赖 quest 匹配规则，低风险
  机制 250 行 · 数据表 + 混合（悬赏榜：每日刷新 + 对手抢单竞争 + 接取/交付）｜关键数据 `BOUNTY_TEMPLATES` 5 类、`RIVAL_NAMES` 6 名对手、`_BOUNTY_REALM_MUL` 10 档境界系数；不落档（每日刷新合理，头注明写）
  接口 `window.openBountyBoard` / `getBountyBoard` / `refreshBountyBoard` / `acceptBounty` / `claimBounty` / `bountyRealmMul` / `addResultItem` / `addItemReasonPhrase`｜依赖 EventBus、DataManager、`FAME_CAP`、itemById、timeSystem、WorldCalendar｜事件：★订 `enemy:defeated`(:236)（猎杀推进对手脚程）
  缺口 ★本文件是 quest 目录里唯一主动订 `enemy:defeated` 的文件；其 `enemy:defeated` 订阅是「对手进度」而非玩家任务进度 ⇒ 同名事件两种语义并存（**无法判定**是否有意）
  缺口 头注自陈「不存档（每日刷新合理）」，但 §0.2 总账同行并列的其他任务文件全部走 StateRegistry → 存档口径在 quest/ 目录内不统一
- `js/quest/choice-memory.js` :: choice-memory.js - 选择记忆系统 · 记录玩家的重要选择，NPC会引用历史选择，累积影响结局 · 依赖：quest-system.js (GAME_ENDINGS, showEndingScreen) · 加载顺序：在 quest-system.js 之后，app.js 之前
  机制 323 行 · 持久化 + 判定函数（选择记忆：关键抉择留痕 → 影响结局判定与后段台词）｜关键数据 `IMPORTANT_CHOICES` 69 条、`tagNames` 32 键、`statNames` 8 键；存档键 `xianxia_choices`（本文件是 quest/ 里唯一自己写 localStorage 的）
  接口 `window.recordChoice` / `showChoiceHistory` / `checkEndingFromChoices` / `initChoiceMemorySystem` / `getReferencedDialogue` / `IMPORTANT_CHOICES` / `playerChoices` / `_endingModifiers`｜依赖 saveToStorage、gameTime、showMessage｜事件：无
  缺口 ★本文件用 `localStorage('xianxia_choices')` 直写，而 quest/ 其余文件（quest-system 等）走 `StateRegistry` + `saveToStorage` 两套 → **多槽存档时本文件的抉择账不会随档往返**（同类病灶在 quest-system.js:2244-2246 已由 F-11 修过一遍，本文件未修）
  缺口（docC 更正）`_endingModifiers` 挂在 window 上却被 quest-system.js 引用为结局修正源；本条旧记「`GAME_ENDINGS` 只 1 键 → 5 结局的老设计已收成 1 条」**不成立** —— docC 实测 `GAME_ENDINGS` 是 **5 键**（ascension/demon/retire/reincarnation/chaos）⇒ 69 条抉择通向 5 结局，**不是 1 个**；真正的口径不统一在别处：本文件 `_endingModifiers` 与 `quest-system.js:827` 自陈的「35 步要求」两套判定阈值（**无法判定**谁是正主）
- `js/quest/main-storyline-arc.js` :: main-storyline-arc.js - v20.1 主线叙事 + 多阶段 Boss · 在既有 5 个引导主线（main_001~005）后追加叙事主线段：魔修玄冥子夺气运，三阶段 Boss 决战
  机制 396 行 · 数据表 + 混合（主线 4 章 + 主线 BOSS 两段 + 魔教教主终局）｜关键数据 `MAIN_STORY_ARC` 4 章、`MAIN_BOSSES` 2 个、`DEMON_CULT_LORD` 15 字段、`chain` 4 步；注册进 `window.mainQuestChain`
  接口 `window.MAIN_STORY_ARC` / `openMainStoryPanel` / `acceptMainStoryQuest` / `startMainStoryBoss` / `settleMainStoryBoss` / `continueBossPhase` / `getMainBossProgress` / `demonCultLordReady` / `startDemonCultLord` / `openQiEndgamePanel`｜依赖 `QuestRegistry`、`mainQuestChain`、startBattle、eventFlags、doAutoSave、playSfx、getRealmTier｜事件：无（自己调 acceptQuest 而非走事件）
  缺口 ★`:336` 注释自陈「旧写法只接 006/007，008/009 全库没有任何接取路径，主线在第三章就断头」已修；docC 实测确认 `main_006/007/008/009` 四条**全部在 `mainQuestChain` 上**（本文件实测 push 4 条）⇒ 该注释描述的断头已修实。**但 `MAIN_STORY_ARC` 实测只有 4 条**（不是注释里的 9 条）⇒ 主线链比注释描述的 9 章少 5 章，第三章之后是否仍断头**无法判定**
  缺口（docC 运行时实测）`mainQuestChain` 实测 **48 条**、注册任务实测 **98 条**；★**「注册了却没进链」的悬空主线实测为 0 条** —— 48 条链上任务全部已注册、48 条注册的主线全部在链上 ⇒ 本批旧记的「28 条悬空主线」**不成立**（号段有 `main_019`/`main_020` 两处**空洞**，是编号跳过而非悬空）。真实顺序问题：链的**数组顺序**为 `main_001~005 → main_021~035（items-extended 旧正典）→ main_006~018 → main_050~055 → main_040~045 → main_056~058`，与主线推进次序不一致（**疑似**按 `type`/`priority` 排序消费，不按数组序，**无法判定**）
  缺口 本文件调 `acceptQuest` 直接（绕过 quest-system 的 `acceptQuestWithStory`），与 quest-system 的接取入口两套 → 剧情演出与接取回执口径可能不一致（**无法判定**）
  缺口（docC 运行时实测）qi-arc1~4 + qi-finale 与 `mainQuestChain` 的关系是**分工续号、不是悬空对撞**：五本实测 push `1+8+6+6+3 = 24` 条，落在 `main_010` / `main_011~018` / `main_050~055` / `main_040~045` / `main_056~058`，**全部 24 条在链上、零悬空**；连本文件的 4 条共 28 条（`main_006~018` + `main_040~058` 区段）⇒ 任务书所称「28 条悬空主线」的**数字恰好命中「主线正文条数」，但性质是「已接线的正文」而非「悬空」**
- `js/quest/qi-arc1.js` :: qi-arc1.js - 《灵气之尽》终局枢纽 · 账本 · 序幕 · 选路 · v25.0 推倒重写 · 批一：main_010「灵脉干了」（四场戏+初见+选路点）+ 账本四列 UI + 终局枢纽面板 · 文本逐字对齐：详稿·第一批·世界层与序幕.md B 节（含扫雷修订：初见认脸、田埂无人当场死）
  机制 427 行 · 状态机 + 渲染（灵气之尽 · 序幕 main_010：官道四场戏 + 三条路线选择）｜关键数据 `LEDGER` 4 列（占脉/恩列/搁浅/人心）、`QI_ARC1` 1 条任务（main_010）、旗标走 `eventFlags`；出口 103 个 `W.qi*` 全局（`var W = window`，:8）
  接口 `W.qiStartPrologue` / `W.qiResumePrologue` / `W.qiSceneChoice` / `W.qiToRoute` / `W.qiRouteChoice` / `W.addQiStranded` / `W.settleQiBattle` 等｜依赖 `showModal`、`gameLog`、startBattle、`W.accept`、TimeSystem.advanceTime、`W.playerPushDeed`｜事件：无
  缺口 ★`qi-arc1.js:62 qiHeartBondTitle` → **全域零引用**（唯一实测成立的死导出）；同文件 `qiHeartBondProbe`(:63) 与 `qiLedgerProbe`(:54) 虽无外部调用方，但**本文件内各引用 5 次 / 2 次**（面板文案与调试口自用），不是死导出
  缺口 本文件任务 main_010 的唯一目标是 `{ type:'custom', target:'qi_route_chosen' }`（:124）——`custom` 类型**不在 quest 事件桥的 13 类匹配里**（见 quest-system.js 条目），靠脚本旁路在 :411 直接置 `completed` ⇒ 有意旁路，但目标字段 `target` 从不被任何匹配器读
  缺口 `qi-arc1.js` 的 `W.*` 出口共 8 个全部零外部引用（终局面板 `openQiEndgamePanel` 被 main-storyline-arc.js 调，是本文件唯一的外部入口）⇒ 场景链全靠面板按钮字符串自驱（**正常**），但从 §0.2 总账看不出入口
- `js/quest/qi-arc2.js` :: qi-arc2.js - 《灵气之尽》对抗线 main_011~018 · v25.0 推倒重写 · 批二：枯萎巡 / 占脉者四仗 / 初次照面+暴涨① / 守脉盟（盟帖→构陷对质→天秘） / 聚义+中幕加信 · 文本逐字对齐：详稿·第二批·对抗线.md C1~C8
  机制 842 行 · 状态机 + 渲染（灵气之尽 · 第二卷 C11~C18：9 章 + 4 个 BOSS + 阵营选择）｜关键数据 `QI_ARC2` **32 条任务**、`SCENE_LABEL` 52 键、`HALF_STONE` 19 键、`LOSE_TEXT` 4 组、`FATE_LEAD` 8、`MOTIVE_RESP` 8、`BOSSES` 4、`CHAPTER_OF_BOSS` 4；出口 27 个 `W.qi*`
  接口 `W.qiStartC11`…`W.qiStartC18` / `W.qiAllianceChoice` / `W.qiTruthChoice` / `W.qiPreceptorChoice` / `W.qiTabletChoice` / `W.qiInterludeChoice` / `W.qiBossFight` / `W.qiTrialResolve` 等｜依赖 showModal、gameLog、startBattle、QuestRegistry、timeSystem｜事件：无
  缺口 ★27 个 `W.qi*` 出口全部零外部引用（qi-arc1.js / qi-arc3.js / main-storyline-arc.js 均不调）⇒ 第二卷完全靠自己的面板按钮串起来，跨卷衔接只经 `W.mainQuestChain` 与旗标
  缺口 `SCENE_LABEL` 52 键覆盖 32 条任务 ⇒ 平均每任务不到 2 个场景标签，而 `CHAPTER_OF_BOSS` 只有 4 键对应 32 条任务 ⇒ **无法判定** BOSS 战与章节的映射是否完整（表小任务多）
  缺口 本文件 842 行是 quest/ 最长文件，§0.2 总账写「qi-arc2」单条职责，未提及 32 条任务这一量级
- `js/quest/qi-arc3.js` :: qi-arc3.js - 《灵气之尽》无视线 忽-01~06（main_050~055；旧正典 main_021~035 存活占用，重编号避让） · v25.0 推倒重写 · 批三：衰减的日子 / 历书小决策 / 三回叩门（盟帖·灯下·屋顶邀酒） / 走到黑 / 终拍
  机制 662 行 · 状态机 + 渲染（灵气之尽 · 第三卷 H01~H06：6 章 + 敲门三连 + 五桩买卖）｜关键数据 `QI_ARC3` **24 条任务**、`SCENE_LABEL` 20 键、`WINE_ITEMS` 2 键、`enemy` 12 字段；出口 22 个 `W.qi*`
  接口 `W.qiStartH01`…`W.qiStartH06` / `W.qiKinChoice` / `W.qiKnock1Choice`/`Knock2Choice`/`Knock2Escort`/`Knock3Choice` / `W.qiLetterChoice` / `W.qiH04Life`/`H04Peddler` / `W.qiH05Fight`/`H05Gong`/`H05Teller` / `W.qiFinaleChoice`｜依赖 showModal、gameLog、startBattle、RewardService、itemById、timeSystem｜事件：无
  缺口 22 个 `W.qi*` 全部零外部引用（同 arc2 口径）
  缺口 `:44` 注释自陈 DES-72 病灶（旧写法丢 addResultItem 返回值却照念「得某物」）已修；本文件仍挂 `window.addItemFailReason` 相关全局转发 → 同名全局覆盖风险
  缺口 `WINE_ITEMS` 只有 2 键却支撑 H04「买酒/品酒」整条买卖线（**无法判定**酒品是否全部走 items-extended 的食物表）
- `js/quest/qi-arc4.js` :: qi-arc4.js - 《灵气之尽》追随线 随-01~06（main_040~045） · v25.0 推倒重写 · 批四：投海 / 拆坝差事 / 大帐点兵 / 崖边夜话+债册拍 / 危机拍 / 讨伐战+真相拍
  机制 511 行 · 状态机 + 渲染（灵气之尽 · 第四卷 S01~S06：6 章 + 3 场战 + 8 条日常池）｜关键数据 `QI_ARC4` **24 条任务**、`SCENE_LABEL` 20、`FIGHTS` 3、`DAILY_POOL` 8、`enemy` 9 字段；出口 15 个 `W.qi*`
  接口 `W.qiStartS01`…`W.qiStartS06` / `W.qiTaskChoice` / `W.qiMusterChoice` / `W.qiTalkChoice` / `W.qiDebtChoice` / `W.qiCrisisChoice` / `W.qiPurgeFight`｜依赖 showModal、gameLog、startBattle、QuestRegistry｜事件：★订 `newDay`（`DAILY_POOL` 日常生成）
  缺口 15 个 `W.qi*` 全部零外部引用
  缺口 ★`W.qiFollowButtons`（:117）与 `W.qiIgnoreButtons`（qi-arc3.js:156）是被 qi-arc1.js:167-170 用 `typeof` 守卫**探测拼接**进终局面板的两块 UI —— 这是 quest/ 目录里唯一一处跨文件 UI 拼接约定，且依赖加载顺序：qi-arc1 若先于 arc3/arc4 执行 `openQiEndgamePanel`，这两块按钮缺失（`typeof` 守卫静默跳过，不报错）⇒ **疑似顺序敏感的静默降级**
- `js/quest/qi-finale.js` :: qi-finale.js - 《灵气之尽》第三幕：汇流终战 + 犹豫拍 + 四结局 · v25.0 推倒重写 · 批五：main_056 血海坝前（三幕前夜改道/到场姿态/三方战波次/还命名单） · main_057 犹豫（原样奉还/两种笑/两种笑都不谴责）
  机制 627 行 · 状态机 + 渲染（灵气之尽 · 终卷：Eve 选择 + 三波兽潮战 + 结局分叉 + 尾声）｜关键数据 `QI_FIN` **12 条任务**、`SCENE_LABEL` 16 键、`WAVE_ENEMIES` 3 波 × 敌人模板、`enemy` 10 字段；出口 9 个 `W.qi*`
  接口 `W.qiStartFinale` / `W.qiResumeFinale` / `W.qiEveChoice` / `W.qiWaveFight` / `W.qiHesitation` / `W.qiEnding` / `W.qiShowEndingPage` / `W.qiShowStayEnding` / `W.qiCloseEnding` / `W.qiFinaleButtons`｜依赖 showModal、gameLog、startBattle、WorldJournal、QuestRegistry｜事件：无
  缺口 9 个 `W.qi*` 全部零外部引用；`W.qiFinaleButtons` 被 qi-arc1.js:170 以 typeof 守卫拼接（同 arc4 的顺序敏感问题）
  缺口 终卷 12 条任务的目标同样全是 `{type:'custom'}`（:69），由 :101 脚本旁路置位 ⇒ 结局推进完全不依赖 quest 事件桥
  缺口（docC 更正）本条旧记「`qi-finale.js` 与 quest-system 的 `GAME_ENDINGS` 只 1 键 ⇒ 两处结局表口径不统一」中的**前半句错**：`GAME_ENDINGS` 实测 **5 键**（ascension/demon/retire/reincarnation/chaos，docC 按 仙侠.html script 顺序 eval）。口径不统一确实存在，但真实形态是**两套 5 结局并存** —— 本文件自建 `qiEnding`/`qiShowStayEnding`/`qiShowEndingPage` 三处出口（8 结局口径的 `qi-street.js` 也另有一份），而 quest-system.js 的 5 键是另一份；本文件 12 条任务**实测已在 `mainQuestChain` 上（main_056~058）零悬空**，故两套结局表**没有共同的可达性闸**（**无法判定**玩家实际会看到哪一套）
- `js/quest/qi-life.js` :: qi-life.js - 《灵气之尽》日子层：城与人记得你 + 枯竭体感 · 补厚批 A+B（玩家反馈「很多地方内容很浅」后的第一批）： · A1 城景命运变体——斩/放的选择写进城景本身（进万毒谷能看见施药摊，进炎城能看见公炉）
  机制 179 行 · 数据表 + 新日钩子（灵气之尽 · 城间人物回访：每城 3 条命线 + 7 条回访）｜关键数据 `FATE_LINES` 3 键、`REVISITS` 7 条；出口 `W.qiLifeProbe`（探针）
  接口 `W.qiLifeProbe`｜依赖 npcManager、showModal、timeSystem.onNewDaySubscribe｜事件：★订 `newDay`
  缺口 ★`qi-life.js:110 W.qiLifeProbe` → **全域零引用**（探针，唯一实测成立的死导出）；`qiCityFateLine`(:45) 本文件内自用 3 次；本文件**没有跨文件入口**，只靠新日订阅自跑（正常），但 §0.2 总账看不出它挂在哪条链上
  缺口 `REVISITS` 7 条 vs qi-world.js 的 `CITY_ORDER` 8 城 ⇒ 8 城里只有 7 座有人物回访（**无法判定**缺的那城是有意留白还是漏做）
- `js/quest/qi-street.js` :: qi-street.js - 《灵气之尽》批六：街谈库 · 平民舆论弧线 · 分城腔 · v25.0 推倒重写 · 批六：回响收口——街谈库重写（骂她→困惑→长生牌→点灯→新时代，按年推进读枯萎旗与主线进度）
  机制 240 行 · 数据表 + 渲染（灵气之尽 · 街谈：天下人背后怎么说你，按结局换时代）｜关键数据 `PHASES` 5 阶段、`NEWERA_BY_ENDING` 8 结局→新时代词表、`CITY_LINES` 8 城；出口 `W.qiStreetPhase` / `W.qiStreetPhaseName`（均零引用）
  接口 `W.qiStreetPhase` / `W.qiStreetPhaseName` / `W.qiJournalNote` / `W.qiCodexNote`｜依赖 `W.qiCloseModal`（qi-arc1.js 闭窗口）、showModal｜事件：无
  缺口 ★`W.qiStreetPhaseName`(:87) **全域零引用**（唯一实测成立的死导出）；`qiStreetPhase`(:77，被 :88/:92/:181/:214/:227 五处调)、`qiJournalNote`(:21)、`qiCodexNote`(:24)、`qiOpenStreetTalk`(:180，被 qi-arc1.js:175 面板按钮点名，定义确在本文件) 均**接得上**（初版误判「按钮指向不存在的全局」，已修正）
  缺口（docC 更正）本条旧记「`NEWERA_BY_ENDING` 8 键对应 8 个结局，而 `GAME_ENDINGS` 只有 1 键 ⇒ 按结局换时代最多只有 1 条生效」的**后半句错**：`GAME_ENDINGS` 实测 **5 键**。真实缺口是**8 vs 5 的键数不匹配** —— `NEWERA_BY_ENDING` 有 8 个结局键，`GAME_ENDINGS` 只有 5 个 ⇒ **8 个里有 3 个永远匹配不到任何结局**，新时代词表按 5/8 命中率生效（**无法判定**另 3 个结局键是否由 qi-finale 自建的结局表供给；qi-finale.js 的 8 结局口径与 quest-system 的 5 结局口径并存，两表均未声明主从）
- `js/quest/qi-world.js` :: qi-world.js - 《灵气之尽》世界层 · v25.0 推倒重写 · 批一：灵气枯竭实装——总闸降档 / 枯脉八城 / 城景三段式 / 枯萎图 / 倒计时 / 时间副推进 · 纪律：账本有倒计时（三年=1080日）；世界不等玩家（每180日主线未推进则额外枯一城）
  机制 193 行 · 数据表 + 新日钩子（灵气之尽 · 天下大势：8 城枯萎度 4 阶段 + 倒计时播报）｜关键数据 `CITY_ORDER` 8 城、`CITY_SCENES` 8 键、`STAGE_QI` 4 阶段、`STAGE_NOTICE` 4 条播报；出口 `W.qiCountdownText`（零引用）
  接口 `W.qiCountdownText` / `W.qiCityOverlay`｜依赖 timeSystem.onNewDaySubscribe、showModal、gameLog｜事件：★订 `newDay`
  缺口 `W.qiCountdownText`(:139，被 :158 倒计时面板调) 与 `W.qiCityOverlay`(:123) 均**本文件内自驱**（无外部调用方）；本文件与 qi-life.js 一样**无跨文件入口**，只靠新日订阅自跑
  缺口 `STAGE_QI` 4 阶段 + `STAGE_NOTICE` 4 条，但倒计时的实际天数来源未见常量声明（**无法判定**：可能直接读 eventFlags 的旗标）
- `js/quest/quest-system.js` :: quest-system.js - 任务系统 · 借鉴《觅长生》、《剑网3》的任务设计
  机制 2263 行（44 个 `====` 段）· 混合（注册表 + 状态机 + 事件总线 + 持久化 + 渲染 + 结局判定）｜关键数据：`QuestRegistry` 5 方法（register/registerMany/get/getAll/**quests Map**）、`QUEST_TYPES`/`QUEST_STATUSES`/`QUEST_PRIORITIES`、`mainQuestChain`、`dailyQuestPool`、`collectionQuests`、`combatQuests`、`allQuests`、`GAME_ENDINGS`（**5 键**，docC 实测修正：ascension / demon / retire / reincarnation / chaos，源码 `:750-` 五个同缩进 `id:` 块，`:2052` 挂 window —— 早期文档记「1 键」有误）、`QG_PRIO_NAMES` 8、`QG_STATUS_NAMES` 8、`OBJECTIVE_TYPE_NAMES` **50 个 objective 类型名**；**实际在用 objective type 只有 18 类**（docC 运行时实测：custom 24 / kill 21 / collect 17 / talk_to_npc 14 / breakthrough_realm 7 / explore 6 / visit 4 / explore_dungeon 4 / craft 3 / escort 2 / join_sect 1 / cultivation_realm 1 / reputation 1 / complete_quests 1 / meditate 1 / sparring 1 / cultivate 1 / arena_win 1）⇒ **50 个名字里 32 个是预置未用**；`mainQuestChain` 实测 **48 条**（main_001..main_058，号段有 main_019/020 两处空洞）；注册表实测 **98 条**任务；任务进度落 `localStorage('xianxia_quest_progress')`；追踪栏同时落 `StateRegistry('questTracker')` 与 `StateRegistry('trackedQuests')` 两张同名内容的表
  接口 30 个 window 全局（`questSystem` 命名空间 + `acceptQuestWithStory` / `turnInQuestWithStory` / `updateQuestTracker` / `toggleTrackQuest` / `selectEnding` / `showEndingScreen` / `syncQuestTargetMarkers` / `exportQuestState` / `importQuestState` 等）｜依赖 EventBus、StateRegistry、RewardService、XianXia、locationSystem、npcManager、itemById、discipleState、ContinueSave、_endingModifiers（choice-memory）｜事件：★发 `quest:accepted`(:624) / `quest:completed`(:1055) / `enemy:defeated`(:1153)；★**事件桥 `registerQuestEventBridge()`(:2212-2241) 批量注册 13 类**：enemy:defeated / item:obtained / item:crafted / npc:talked / location:visited / dungeon:completed / arena:won / escort:completed / cultivation:completed / cultivation:breakthrough / sect:joined / reputation:changed / quest:completed｜★**但 `questObjectiveMatches`(:2083-2176) 实测匹配 14 类事件**——第 14 类 `sparring`(:2140) 在 matcher 里有分支、却**不在桥的 `types` 数组里**，见下条缺口
  ★缺口 1（事件桥与 objective 类型的错位）→ `quest-system.js:1624-1632 OBJECTIVE_TYPE_NAMES` 列了 50 类，但运行时**实际在用只有 18 类**（docC 实测，见机制行）⇒ **32 个类型名是纯预置**；其中 **`dungeon` / `gather` / `mine` / `fish` 四类在 `questObjectiveMatches`(:2083-2176) 里没有任何匹配分支** ⇒ 这四类目标写出来也推不动（实测四者不在 18 类在用清单里，当前无受害者，属**预置未兑现**）；另 `arenaWin`（驼峰）与 `combat` 也零使用，但 `:2139`/`:2092` 仍为它们保留了匹配分支、`:1630` 仍挂着 `arenaWin: '比武获胜'` 名字 ⇒ **两处死分支 + 一个死名字**
  ★缺口 2（13 类桥是硬约束）→ `tests/wave140-quest-event-bridge-node.js:142` 断言 A2「没有多余注册」、:144 断言 A3「必在清单本身就是 13 类」⇒ **给事件桥加第 14 类会让这套测试转红**；桥的规模是被测试钉死的，不是随手可扩
  ★缺口 2b（docC 新增：**matcher 有 14 类，桥只有 13 类，第 14 类是旁路**）→ `quest-system.js:2140` 有 `if (eventType === 'sparring') return obj.type === 'sparring';`，但 `:2220-2234` 的桥 `types` 数组**实测 13 项、不含 `sparring`**；全仓 `sparring` 仅 5 处（排除副本后）：`:215` `daily_003`「切磋武艺」目标 `{type:'sparring',count:3}`、`:1628` 名字表、`:2140` matcher、`building-effects.js:298` 注释、**`:301` 直接调 `window.advanceQuestObjectivesFromEvent('sparring',{amount:1})`** ⇒ **零处 `EventBus.emit('sparring')`**，`daily_003` 唯一的推进路径是那行**绕过事件总线的直调**。风险：改掉或删掉 `building-effects.js:301` 这一行，`daily_003` 立刻永不可推进，而 wave140 桥测试只断言 13 类注册齐全、**测不到这一条**
  ★缺口 3（custom/deliver/defend 的现状，与「已知的坑」不同）→ 实测：`deliver` 2 处、`defend` 1 处都在 `js/items-extended/12-quest-extensions.js:186/339/355-358` 且**已改成别型 + 脚本置位**（注释明写「全工程无 deliver 事件、无匹配分支」）；`custom` **5 处**（qi-arc1.js:124、qi-arc2.js:99、qi-arc3.js:96、qi-arc4.js:67、qi-finale.js:69）**由 qi-arc*.js 直接置 `completed`**（qi-arc1.js:411 等）⇒ `custom` 是**有意旁路**不是漏做，但它也不在 `OBJECTIVE_TYPE_NAMES` 里（只有 :1355 一句特判 `'经历这段剧情（自动记档）'`）；docC 实测 `custom` 目标共 **24 个**，是**在用类型里第一名**（21 个 kill 之上）⇒ 「有意旁路」这条路径承载量最大
  ★缺口 4（13 类事件的生产侧全通，但 grep 会误判）→ 实测 13 类**每类都有 ≥1 个 emit 源**（enemy:defeated 3 / item:obtained 1 / item:crafted 1 / npc:talked 1 / location:visited 3 / dungeon:completed 2 / arena:won 1 / escort:completed 2 / cultivation:completed 2 / cultivation:breakthrough 2 / sect:joined 2 / reputation:changed 1 / quest:completed 1）；但桥用 `types.forEach` **批量注册**，任何 `grep "\.on('X')"` 的审计都会判成「零监听」——本批第一版扫描就误判过 4 类，修正口径后 13 类全通
  ★缺口 5（`patrol` 是孤儿 objective 类型，docC 已复核 3 处全对）→ docC 独立复核：`sects-system.js:178` `{type:'patrol',target:'外围'}`、`:193` `{type:'patrol',target:'边境'}`、`reputation-system.js:380` `{idSuffix:'rep_patrol',type:'patrol'}` —— **全仓恰好 3 处**，与旧结论一致；`patrol` 既不在 `questObjectiveMatches` 也不在 `OBJECTIVE_TYPE_NAMES`、也不在 docC 实测的 18 类在用清单里 ⇒ 靠 `sects-system.js:817` 的 `directType` 特判与 `reputation-system.js:519 _completeCityRepQuest` 手动置位（这两处置位逻辑本批**未复核**，sects/ 不在范围）
  ★缺口 6（死导出）→ `quest-system.js:64 QuestRegistry.getAll` 全域零引用（注释自陈「用于调试」）；`updateQuestObjective`(:1175) 只被本文件 :1164 一处调，`:2034` 又把它塞进 `questSystem` 命名空间 —— 注释 :2194 明说事件桥「才有这步升级」，即**升级 quest.completed 的逻辑只在旧路径上有，事件桥在 :2195-2200 自己复制了一份**
  ★缺口 7（结局系统注释已过时，docC 实测推翻「死代码」结论）→ `:827` 注释自陈「main_006-020 完全缺失，35 步要求让 5 结局全部不可达 → 结局系统是死代码」——**docC 按 仙侠.html 真实 script 顺序 eval 实测：① `GAME_ENDINGS` 是 5 键不是 1 键（ascension/demon/retire/reincarnation/chaos），5 结局**都在表里**；② `main_006/007/008/009` 由 `main-storyline-arc.js` 注册、`main_010` 由 `qi-arc1.js` 注册、`main_011~018` 由 `qi-arc2.js` 注册，**全部已在 `mainQuestChain` 上**；真正缺的只有 `main_019`/`main_020` 两条**（号段空洞，不是悬空）**。⇒ 该注释描述的「结局系统是死代码」**已不成立**，应视为过时留痕；`choice-memory.js` 的 69 条 `IMPORTANT_CHOICES` 通向 5 结局（非 1 个）
  ★缺口 8（追踪栏数据存了三份）→ `_trackedQuests` 同时落 **三个地方**：`StateRegistry.register('questTracker')`(:2064) 与 `StateRegistry.register('trackedQuests')`(:2247)（两张表导出**同一个数组**）+ `localStorage('xianxia_tracked_quests')`(:1587/1599 经 saveToStorage)；而任务进度 `xianxia_quest_progress`(:362/410/489) 与结局史 `xianxia_endings`(:879/887) **仍只走 localStorage，压根没进 StateRegistry** ⇒ `:2245` 的 F-11 注释「已迁 StateRegistry」只迁了追踪栏一半，任务进度本体未迁
  缺口 ★`window.playerQuestProgress` 从未挂上 → `map/map-markers.js` 读的 `window.playerQuestProgress` 恒为 undefined（`:387-388` NEW-03 注释自陈 app.js 也踩过同一个坑并已改走 StateRegistry 槽，但 `map-markers.js` 未同步改）⇒ **地图任务标记这一条线疑似仍断**
- `js/quest/scene-performance.js` :: scene-performance.js - 剧情场景演出化系统 · 让剧情从"弹窗"变成"完整场景演出" · 场景描写+角色头像+表情切换+打字机效果+选择分支 · 依赖：quest-system.js (showStoryDialogue, STORY_DIALOGUES)
  机制 498 行 · 渲染层 + 打字机演出（剧情场景演出：表情/天气/时辰图标 + 选项分支）｜关键数据 `SCENE_PERFORMANCE_DATA` 8 个场景、`CHARACTER_EMOTIONS` 14 表情、`WEATHER_ICONS` 16、`TIME_ICONS` 22、`DEFAULT_SCENE` 兜底
  接口 6 个 window 全局（`showScenePerformance` / `advanceSceneDialogue` / `handleSceneChoice` / `closeScenePerformance` / `getSceneData` / `typewriterEffect` / `SCENE_PERFORMANCE_DATA`）｜依赖 仅 DOM（无其他 js/ 依赖）｜事件：无
  缺口 本文件是 quest/ 里唯一**零外部依赖**的一本（实测 REFS 为空），但 `SCENE_PERFORMANCE_DATA` 只有 8 个场景，而 qi-arc1~4 + qi-finale 共 **93 条任务** ⇒ 绝大多数剧情场景走 `DEFAULT_SCENE` 兜底或各 qi 文件自带 modal（**无法判定**是否有意：qi-* 系列并未引用本文件）
  缺口 `typewriterEffect` 与 `advanceSceneDialogue` 是纯 DOM 演出出口，与 qi-* 系列自建的 `_scene`/`modal` 体系**两套并存**（**无法判定**分工）

### js/sects/（44 个）— 门派

- `js/sects/dao-companion-deep.js` :: dao-companion-deep.js - 道侣深度互动 · 心情需求、主动互动、专属剧情 · 依赖：sects-system.js
  **机制**：判定函数（82 行，全批最小）· 关键数据 无表；心情需求阈值写在代码里 · 对外接口 `window.updateDaoCompanionDeep` + 4 个 · 事件 `EventBus.on('newDay')`（`:21` 唯一调用点）· 依赖 `sect-kin.js` 的 `needs` 账 · **缺口**：`updateDaoCompanionDeep` 外部 0 引用，但 `:21` 挂在 `EventBus.on('newDay')` 上，**是活的**——每日新日心跳会调
- `js/sects/master-teach.js` :: master-teach.js - v20.1 弟子培养体系（阶段 → 出师 → 反哺） · 对标鬼谷八荒：弟子有培养阶段（入门→小成→大成→出师），传功推进，大成+好感+玩家境界达标可出师 · 第二十一波 · 弟子真成长：培养进度改记自己的账（_teachProgress，不再与江湖演化共字段互相吃账）
  **机制**：状态机 + 数据表（472 行）· 关键数据 `STAGES` **4 阶**（入门→小成→大成→出师）/ `REALM_ORDERS` / `WORK_HOUSES` · 对外接口 **15 个 `window.` 导出 + 26 个顶层函数**（代表 `discipleBreakthrough` / `chushiFromMaster` / `discipleRealmWord`）· 依赖 `sects-system.js`（`discipleState`）· **缺口**：`discipleBreakthrough` / `discipleRealmWord` 外部 0 引用（待回本文件核 onclick，**疑似**仅面板内联使用）
- `js/sects/sect-art-channeling.js` :: sect-art-channeling.js - 第十五波 · 秘艺运功（门派功法接入运功三槽） · 门派功法表（SECT_SPECIFIC_ARTS，含开山秘艺）此前只有「被动面」：参悟掌握度自动折六维、走流派判定
  **机制**：判定函数 + 接线（198 行）· 关键数据 无自有表，读 `SECT_SPECIFIC_ARTS`（36 派 110 门）· 对外接口 0 个具名 `window.` 导出（走 `window.XianXia.*` 命名空间）· 事件 1 处订阅 · 依赖 `sect-internal.js` 的 `SECT_SPECIFIC_ARTS`、`equipment.js` 的 `SKILL_ATTACK_MOVES` · 机制：把掌握度 m>0 的门派功法折成运功栏三槽认得的功法形，绝技/身法槽生成招式注册进战斗管线。**缺口**：`window.` 具名导出 0 个，全靠命名空间，接线面窄
- `js/sects/sect-cities.js` :: 天子管凡人，仙门管香火。城市不归门派「占领」——城主理政照旧，门派争的是「香火护持」： · 城请谁护佑、香火供奉送谁家、城门楼上挂谁的幡。 · 帝都长安朝廷直辖永不可争（只可「御许」立分舵）；凡俗八城初始按地理发牌，护持是活账可易主
  **机制**：数据表 + 判定函数（725 行）· 关键数据 3 张表：城请谁护佑 / 香火供奉 / 城门幡（具体表名见源码 `:decl`）· 对外接口 0 个具名 `window.` 导出（命名空间）· 事件 **3 处订阅** · 依赖 `sects.js` / `sect-governance.js` · **缺口**：0 个具名 `window.` 导出——外部无法按名调用，只能走命名空间
- `js/sects/sect-court.js` :: sect-court.js - 高位日常（第十一波 · 坐堂早朝/断案批账/掌门威仪） · 此前职位越高日子越空：杂役每天两桩差事，长老以上日常差事为零——只剩教导/外交两桩长者差事， · 做完今天就没事了；掌门案头又只在断粮缺士气时才有内容。本模块把长老到掌门的每一天填满
  **机制**：判定函数 + 渲染层（550 行）· 关键数据 2 张表（长老以上的高位日常差事表）· 对外接口 0 具名导出（命名空间）· 事件 **3 处订阅** · 依赖 `sects-system.js` / `sect-visit.js` · 机制：把「杂役每天两桩差事、长老以上日常差事为零」的空档填满（坐堂早朝/断案批账/掌门威仪）
- `js/sects/sect-crisis-engine.js` :: sect-crisis-engine.js - v20.49 门派大事引擎 · 把「随机门派大事件」从抽签重置为账目——四条铁律： · ① 事出有因：候选事件先过「因果门禁」，门禁全读真账 · 强盛的门派不易被盗贼光顾（sectPowerValue 折战力 + 防务值）
  **机制**：状态机（酝酿→爆发→余波，425 行）· 关键数据 无自有表（从 `sect-profiles.js` 的命门表长候选）· 对外接口 **5 个 `window.` 导出**（代表 `window.SectCrisis`）· 事件 0 处 `EventBus`（走日结钩子）· 依赖 `sect-crisis-events.js`（事件池）、`sect-profiles.js`（`getSectProfile`） · **缺口**：`_sectCrisisClear` / `_sectCrisisPrepare` / `_sectCrisisResolve` 三个下划线私有函数导出到 `window` 后外部 0 引用（下划线前缀本意是内部，导出属接口卫生问题）
- `js/sects/sect-crisis-events.js` :: sect-crisis-events.js - v20.49 门派大事·因果事件池 · 每桩事件自带 causality——先看账，再看事。没有因，这条事件就不存在于候选池： · 强盛不出贼（strength.total 高则盗匪族权重趋零）；无仇不上门（外交账里没有仇家，寻仇不出）
  **机制**：数据表（967 行，因果事件池）· 关键数据 每桩事件自带 `causality`（读 strength.total / 外交仇家 / morale / profile.livelihood / season / scars / resources），`cost` 只收 stones/qi/energy、`check` 为 0-100 需求值 · 对外接口 **1 个 `window.` 导出** · 依赖 `sect-profiles.js`（命门）、`sect-crisis-engine.js`（`window.SectCrisis._applyGains`）· 机制：与 `sect-events.js` 的**通用池**是两套并行候选池，因果门禁只在这一侧生效
- `js/sects/sect-diplomacy-world.js` :: sect-diplomacy-world.js - 江湖风云（AI 门派外交档案是活的） · 外交全矩阵此前只在开局发牌一次——之后 AI 门派之间的关系就是一潭死水：不结怨、不修好、不开战。 · 本模块让档案跟着世界走
  **机制**：判定函数（415 行）· 关键数据 无表（改 `SECT_DIPLOMACY_STATE`）· 对外接口 0 具名导出（命名空间）· 事件 **3 处订阅** · 依赖 `sects.js` / `sect-visit.js` · 机制：让 AI 门派外交档案跟着世界走（开局发牌一次后不再是死水）
- `js/sects/sect-disciple-life.js` :: sect-disciple-life.js - 门里的日子（第十四波 · 弟子日子五线） · 玩家问「身为弟子还能干啥」——五条缺口一次补齐，全部走真接口真账： · 一 · 门中排行榜：贡献/差事/切磋三张月榜（自己的数字全是真账，同门的名次由执事按月报出）
  **机制**：判定函数 + 渲染层（511 行）· 关键数据 无表（三张月榜现算）· 对外接口 0 具名导出 · 事件 **3 处订阅** · 依赖 `sects-system.js`（`discipleState` / 贡献账）· 机制：贡献/差事/切磋三张月榜，自己的数字读真账、同门名次由执事按月报出
- `js/sects/sect-doom.js` :: sect-doom.js - 灭门与复兴（方案三 · 按已审详稿落地） · 详稿见《详稿·灭门与复兴.md》。三条毁灭路全有前兆、升级期、翻盘口——不无预警灭门： · 路A 血仇压山：战帖（三十日）→ 兵临山下（七日）→ 破山之战三波连环真仗
  **机制**：状态机（1004 行，三条毁灭路）· 关键数据 `CITIES` **9 座**（`:11`）；路A 血仇压山（战帖30日→兵临7日→三波连环真仗）/ 路B 灵脉枯人心散（每月「熬还是散」抉择）/ 路C 名存实亡（弟子≤3 连续60日）· 对外接口 0 具名导出 · 事件 **3 处订阅** · 依赖 `sect-governance.js`（公库清算）、`sect-roster.js`（族谱） · 纪律：掌门不死（按羁绊三分支）、一月至多灭一门 · **缺口**：0 具名导出，只能命名空间调
- `js/sects/sect-economy.js` :: sect-economy.js - 门派贡献账本（补厚批一 · 门派经济账） · 贡献是门派核心货币，但此前它只是两处裸数字：来源不记账、去处不汇总， · 最大的消费口（贡献兑换商店）还因 sectName 字段从未写入而永久锁死
  **机制**：判定函数（87 行）· 关键数据 无表 · 对外接口 0 个 · 依赖 `sect-governance.js` · 机制：贡献账本记账/汇总（补厚批一）。全批最小文件之一
- `js/sects/sect-events.js` :: sect-events.js - 门派事件系统（P3） · 门派内部事件与外部事件，影响门派状态和弟子 · 依赖：sects.js、sects-system.js、sect-internal.js
  **机制**：数据表 + 状态机（546 行）· 关键数据 `SECT_EVENT_TYPES` **4 类**（internal/external/disaster/bonus）/ `SECT_EVENTS_POOL` **19 条通用事件**（internal7/external5/disaster4/bonus3）/ `sectEventState` 3 字段 · 对外接口 **14 个 `window.` 导出 + 8 个顶层函数**（代表 `generateSectEvent` / `handleSectEvent` / `getSectEventDisplay`）· 依赖 `sects.js` / `sect-internal.js`（`getSectInternal`）/ `sect-exclusive-events.js`（`SECT_EXCLUSIVE_EVENTS` 同权混抽）· 配置读 `window.XianXia.Balance.sectEvents`（默认 cooldown 360 分 / 持续 720 分 / 触发率 0.30）· **缺口（两条都实测确认）**：① `:357` 注释「**加权随机：灾难事件概率随士气降低而增加**」，`:358` 实现是 `pool[Math.floor(Math.random() * pool.length)]` —— **纯均匀随机，零权重**；② **士气门禁近乎空操作**：19 条里 **18 条 `minMorale:0`、仅 1 条 `minMorale:20`**，19 条全 `maxMorale:100`**（士气 ≥20 时 19 条全进池）。`:391-402` 的「灾难到期=真发生了」是真机制，与此不冲突
- `js/sects/sect-exclusive-events.js` :: sect-exclusive-events.js - v20.46 门派专属事件 · 每门每派自己的戏：通用事件池是"天下门派都有的事"，这里是"只有这一家才有的事"。 · 与通用池同权混抽（sect-events.js generateSectEvent），结算走同一 handleSectEvent
  **机制**：数据表（557 行）· 关键数据 `SECT_EXCLUSIVE_EVENTS` **36 派 × 恰好 2 条 = 72 条**；条目字段只有 4 个：`type`（internal 49 / external 9 / bonus 14）/ `desc()` / `effect()` / `minMorale`+`maxMorale`；**无选项、无 choices**（与 NPC 事件的 `{text, effect}` 形态完全不同，点了直接结算）· 对外接口 **1 个 `window.` 导出**（`SECT_EXCLUSIVE_EVENTS`）· 依赖 `sect-events.js`（`generateSectEvent` 混抽、`handleSectEvent` 结算）· **缺口**：**72 条全部 `minMorale:0`、全部 `maxMorale:100`** —— 士气门禁对专属事件**完全无效**，任何士气下 2 条都进池
- `js/sects/sect-facilities.js` :: sect-facilities.js - 门派设施系统（B3 修复版） · 修复内容： · B3-1: 设施使用游戏时间而非现实时间 · B3-2: 设施从DOM读写真气 → 改为 currentCharData.qi · B3-3: 设施效果从描述改为可执行 actions
  **机制**：数据表 + 判定函数 + 渲染层（1538 行）· 关键数据 `VALID_ACTION_TYPES` **16 种可执行动作** / `FACILITY_TYPES` 6 / `facilities` **57 座** / `SECT_FACILITY_EXTRAS` **36 派** / `FACILITY_UPGRADES` **41 条** / `LIB_TIERS` **4 层**（藏经阁分层：外门阁 rank≤7 / 内门阁 ≤5 / 核心阁 ≤4 / 镇派阁 ≤3）/ `LIB_TIER_COPYPRICE` / `LIB_RANK_NAMES` / `CRAFT_WORKSHOPES`（`CRAFT_WORKSHOPS`）· 对外接口 **48 个 `window.` 导出 + 24 个顶层函数**（代表 `useSectFacility` / `doUpgradeFacility` / `openSectUpgradePanel` / `sectLibBrowse` / `sectLibCopy` / `sectLibRequestTransmit` / `updateFacilityUI`）· 依赖 `sects-system.js`（`discipleState` / `sectResourceState`）· **缺口**：`sectLibBrowse` / `sectLibCopy` / `sectLibRequestTransmit` / `doUpgradeFacility` / `openSectUpgradePanel` / `updateFacilityUI` / `initFacilityState` / `saveSectData` / `validateFacilities` / `FACILITY_TYPES` / `VALID_ACTION_TYPES` 外部 0 引用——其中藏经阁三入口与升级两入口**经本文件 `:533 / :1170 / :1387 / :1391 / :1372` 的内联 `onclick` 消费，是活的**；`updateFacilityUI` 是**真缺口**（无 onclick、无外部调用，设施升级后 UI 不刷）
- `js/sects/sect-facility-life.js` :: sect-facility-life.js - 门派建筑做出理由（补厚批三） · 批二把「特色」做成了身份；批三把「建筑」做出理由——每座基础建筑不再是一个加数按钮， · 而是一件有过程、有代价、有世界反应的事： · 演武场 → 切磋系统：挑一个有名有姓的同门真打一场（startBattle 真仗，不是掷骰子）
  **机制**：判定函数（401 行）· 关键数据 无表 · 对外接口 1 个 `window.` 具名 + 1 个常量 · 依赖 `battle.js`（`startBattle` 真仗）· 机制：把特色建筑从「加数按钮」改成有过程有代价的事（演武场→挑同门真打一场）
- `js/sects/sect-festival-succession.js` :: sect-festival-succession.js - 大典·继位·日常仪轨（改造批·第一梯队+第四梯队） · 一、开山大典（一年一度）：祭祖（上香得祖师庇佑）+ 论功行赏（真读贡献账本——今年谁挣得多， · 掌门当众念名字，赏从门库出）+ 大典宴（全门增益）。仪式感和年度账单的展示台
  **机制**：状态机 + 判定函数（383 行）· 关键数据 无表 · 对外接口 0 具名导出 · 事件 **3 处订阅** · 依赖 `sect-governance.js`（门库）、`sect-roster.js`（族谱）· 机制：开山大典（祭祖上香 + 论功行赏真读贡献账 + 大典宴全门增益）
- `js/sects/sect-gala.js` :: sect-gala.js - 盛会·广邀江湖（方案四B） · 开山大典是对内祭祖论功；盛会是对外——广邀江湖，摆的是席面，争的是脸面。 · 来贺读真账：外交关系≥30的门派才动身，立场联动（正道的盛会邪派不来，邪派的鬼宴正道不去）； · 贺礼逐家入公库（守恒），来的人少了就是翻车——席面摆了没人来，立场照样掉
  **机制**：判定函数（422 行）· 关键数据 1 张表 · 对外接口 0 具名导出 · 事件 **3 处订阅** · 依赖 `sect-diplomacy-world.js`（外交关系 ≥30 才动身）· 机制：对外盛会——贺礼逐家入公库（守恒），立场联动（正道盛会邪派不来）
- `js/sects/sect-governance.js` :: sect-governance.js - 活门派：库存、政事、管理者自治（补厚批六） · 病根：门派只有一个抽象的 resources 数字在日结里悄悄涨落——没有粮、没有铁、没有丹药， · 掌门长老是背景板，从不用库存做任何事；玩家看不见家底，也插不上手
  **机制**：数据表 + 判定函数（636 行）· 关键数据 2 张表（库存：粮/铁/丹药 + 管理者自治）· 对外接口 **3 个 `window.` 导出** · 事件 **3 处订阅** · 依赖 `sects-system.js` / `sect-internal.js` · 机制：把门派从「一个抽象 resources 数字」变成有粮有铁有丹的实体，掌门长老真用库存做决断
- `js/sects/sect-identity.js` :: sect-identity.js - 门派特色身份层（补厚批二 · 8派样板） · 旧特色是「按钮buff」：点一下、加个数、等冷却——意义不明，没有代价，没有世界反应。 · 本层把特色重做成「身份」：每派的本事从命门/地形/神功里长出来，用一次要付一次代价
  **机制**：判定函数 + 状态机（506 行）· 关键数据 `TEMPLATE_FLAVOR` / `TEMPLATE_COST`（**8 派各一个代价数值**：大隐阁30 烈日教30 天龙教40 昆仑派30 金刚宗30 逍遥派30 蓬莱派30 天涯海阁30）· 对外接口 0 具名业务导出（`window.sectIdentityProbe` 是调试探针）· 事件 **3 处订阅** · 依赖 `sect-specialties.js`（引擎钩子在 `useSectSpecialty`）· 头注释「8派样板」**成立** · **缺口**：`window.sectIdentityProbe`(`:496`) 全仓 0 调用（调试探针，非业务缺口）
- `js/sects/sect-internal.js` :: sect-internal.js - 宗门内部生态（v7.3 全门派扩展） · 弟子群体、竞争合作、门派会议、决策影响 · 依赖：sects-system.js
  **机制**：数据表 + 事件订阅（665 行）· 关键数据 `SECT_SPECIFIC_EQUIPMENT` **7 派 8 件**（少林寺 weapon+armor 两件，武当/峨眉/丐帮/铸剑/唐门/茅山各 1 件 weapon；**其余 29 派 = 0 件**）· `SECT_SPECIFIC_ARTS` **36 派 110 门**（tier1=36 / tier2=36 / tier4=37；grade 八品36 七品36 三品37；`copyPrice` 109 条全设、`wuxingReq` 37 条、`transmit` 32 条）· `SECT_NPC_TEMPLATES` 3 / `SECT_LEADER_NAMES` 9 · 对外接口 `window.SECT_SPECIFIC_EQUIPMENT` / `getSectEquipment` / `registerSectSpecificItems` / `SECT_SPECIFIC_ARTS` 等 **20 个**（代表：`getSectEquipment` 是唯一被外部读的出口，由 `sect-trials.js` 调 2 处）· 依赖 `sects.js` · **缺口**：① `:370` 注释「批次一16派；其余20派待批次二补全」与实测 **36 派 110 门**不符（注释过时）；② `:126 generateSectDisciples` / `:166 getSectSummary` / `:205 getSectMorale` 三个函数定义并 `window` 导出（`:636/638/639`），**全仓 0 调用点**；③ `SECT_SPECIFIC_EQUIPMENT` 的 `window` 导出外部 0 引用（只被本文件 `:627` 的注册循环消费）
- `js/sects/sect-join-flow.js` :: sect-join-flow.js - 门派五阶段加入流程 · 门派加入流程：发现→门槛条件→入门试炼→分配身份→试用期 · 正派无敲门砖，凭门槛条件（灵根/资质/性别）即可参加入门试炼 · v9.9：杂役弟子无境界要求——凡人可入，joinSect 仍固定 rank=7 杂役
  **机制**：混合（状态机 + 判定函数 + 渲染层，2288 行，全批第二厚）· 关键数据 `sectJoinState` / `TRIAL_RESULT` / `FULL_GUARD_TRIAL_SECTS` / `SECT_LIGHT_ENTRY_QUESTIONS` **14 派 × 3 选**（单问式：preferred=外门 / tolerated=杂役 / reject=拒绝）/ `ALIGNMENTS` **3 档** / `FAME_LEVELS` **6 档** / `CONCUBINE_FAVOR_LEVELS` **6 档** / `ENTRY_RANK` 冻结枚举（INNER4 / OUTER5 / REGISTERED6 / CHORE7，v18.7 起禁止再用 0/1 表示杂役/弟子）· 对外接口 **86 个具名 `window.` 导出 + 102 个顶层函数**（代表：`showJoinRequirements` / `checkSectRequirements` / `evaluateSectEntry` / `showSectGuardTrial` / `finishGuardTrialJoin` / `joinSect`）· 依赖 `sects.js`（`sectsData`）、`sects-system.js`（`joinSect`）、`npс-personal-events.js`（`markSectLeaderMetFromTrial`）· **入口藏得深**：36 派各有一支独立的 `XxxQ1/Q2/Resolve/Finish` 流程函数，绝大多数只被本文件内联 `onclick` 消费 · **专项核实结论**：`checkSectRequirements`(`:2003-2020`) 函数头注释「杂役弟子无条件——取消所有属性考核」与 `:2001` 完全一致，**代码里一行境界判断都没有**——只留修罗宫(女)/蓬莱派(水灵根≥20)/天山派(水+冰变异)/金刚宗(体质≥30)/铸剑山庄(锻造≥20)/正道(恶名≤30) 六条特殊限制。旧文档那句「入门强制炼气」早已作废（`STRUCTURE.md:2764` 已划掉），**此处不存在代码与注释的矛盾**。真正的境界门槛只由 `evaluateSectEntry`(`:2050`) 把关，且只对**两家**特殊：大隐阁（`getRealmTier < 4` 拒，即金丹+）、天书阁（`karma < 100` 拒 **且** `getRealmTier < 9` 拒，即渡劫+）；另有丐帮无条件外门、修罗宫女性→侍妾(`rank:-1`)或杂役两条特例
- `js/sects/sect-kin.js` :: sect-kin.js - 弟子有脸、需求做实（补厚批四） · 两条线： · 一、道侣需求做实——needs{talk,accompany,gift} 此前是写后即丢的假账（只涨不消费、mood 从不参与任何计算）
  **机制**：判定函数（272 行）· 关键数据 1 张表 · 对外接口 0 具名导出 · 事件 **3 处订阅** · 依赖 `marriage-offspring.js` · 机制：道侣 `needs{talk,accompany,gift}` 从「写后即丢」改成真消费
- `js/sects/sect-passives.js` :: sect-passives.js - 门里的底子：门派特色全被动化（改造批一） · 玩家拍板：特色按钮和冷却整套删除——冷却是街机语言，不是仙侠语言。 · 少林弟子皮肉沉，是因为从小练铁布衫，不是因为点了个按钮等二十个时辰。 · 重做原则
  **机制**：判定函数（161 行）· 关键数据 4 张表（四档成长：入门→小成→大成→圆满）· 对外接口 0 具名导出 + 1 常量 · 依赖 `battle.js`（`buildPlayerBattleEntity` 六维合并）、`discipleState._passive` · 头注释「特色按钮和冷却整套删除」**成立**——玩家拍板把街机式冷却语言全删了
- `js/sects/sect-profiles.js` :: sect-profiles.js - v20.49 门派命门档案 · 大事件重置的地基：36 门各立一张「命门表」——靠什么吃饭、怕什么、在什么地界。 · 事件不再抽签，从命门里长：药王谷怕疫病歉收、修罗宫怕盐卡官非、铸剑山庄怕矿脉断供。 · 一表三用：大事件因果门禁、既有门派专属事件的权重、故事弧取材
  **机制**：纯数据表（111 行，全批最小的门派文件）· 关键数据 `SECT_PROFILES` **36 派命门表**，字段 `livelihood`（靠什么吃饭）/ `fears`（怕什么）/ `terrain`（山/水/城/漠/岛）/ `weightMods`（各事件族权重，缺省 1.0、**0 表示该门极难出此类事**）· 对外接口 **3 个**：`window.SECT_PROFILES` / `window.getSectProfile` / `window.getSectFamilyWeight`（另挂 `window.XianXia.SectProfiles`）· 依赖 无 · **缺口**：头注释说「**一表三用**：大事件因果门禁、既有门派专属事件的权重、故事弧取材」——实测 **`getSectProfile` 全仓只被 `sect-crisis-engine.js` 调 1 处**，另两用（专属事件权重 / 故事弧取材）**零引用**；`window.SECT_PROFILES` 本体外部 0 引用（只被 `getSectProfile` 内部读）
- `js/sects/sect-resource-actions.js` :: sect-resource-actions.js - 门派地标建筑可交互功能 v1.0 · 依赖：sects/sects-deep-data.js（SECT_DEEP_DATA.specialResources）
  **机制**：数据表 + 判定函数（449 行）· 关键数据 `_HERB_POOL` / `_ORE_POOL` 各 8 / `_RESOURCE_ACTION_LABELS` **17 类** / `_INTEL_POOL` · 对外接口 **11 个 `window.` 导出 + 19 个顶层函数** · 依赖 `sects-deep-data.js`（`SECT_DEEP_DATA.specialResources`，57 条）
- `js/sects/sect-rooms.js` :: sect-rooms.js - 一栋建筑一扇门（改造批二：建筑功能整合） · 玩家拍板：建筑旁的独立按钮全删（「进入」旁边再挂一排小按钮是把新功能钉在旧界面上）。 · 重做原则：**进门就是这门里的日子，事在门里办 · 医馆：进门医师自动看你。有旧伤他先说旧伤，治病是「问诊」一件事：旧伤、伤势一起处置
  **机制**：渲染层（286 行）· 关键数据 1 张表 · 对外接口 **22 个 `window.` 导出 + 16 个顶层函数** · 依赖 `scenario-engine.js` · 机制：把建筑旁的独立小按钮全删，改成「进门就是这门里的日子」（一栋建筑一扇门）
- `js/sects/sect-roster.js` :: sect-roster.js - 门中名分（方案五：族谱 / 腰牌 / 执事养老线） · 门派有了活的座次与立场，还缺「人」的名分：谁在这门里、腰上挂的什么牌、老了去哪儿、死了记在哪。 · 族谱：从真账自动收——掌门位分、你的师承功过（读贡献账本）、在世同门、养老的、殁了的
  **机制**：判定函数 + 渲染层（317 行）· 关键数据 无表（族谱从真账自动收）· 对外接口 0 具名导出 · 事件 **3 处订阅** · 依赖 `sect-governance.js` / `sects-system.js`（贡献账）· 机制：族谱 / 腰牌 / 执事养老线
- `js/sects/sect-scenarios.js` :: sect-scenarios.js - 门派设施沉浸层（v20.86） · 病灶：门派里三十几座建筑，交互全是「点一下使用 → 一串数字弹出来」——建筑有，戏没有。 · 方子：接进城坊设施已在用的情境引擎（scenario-engine.js）。「使用」改走「进入」
  **机制**：判定函数 + 渲染层（682 行）· 关键数据 2 张表 / `SECT_SCENARIO_IDS` · 对外接口 **2 个 `window.` 导出** · 依赖 `js/core/scenario-engine.js`（城坊设施已在用的情境引擎）· **缺口**：`window.SECT_SCENARIO_IDS` 外部 0 引用
- `js/sects/sect-shield-errands.js` :: sect-shield-errands.js - 庇护·抚恤·外务·公告栏（改造批·第一梯队+第二梯队） · 一、庇护撑腰：入派最大的意义是「背后有人」——你在外头真打败了，门里会得到消息： · 执事出面（宿敌收敛，仇恨压一成），对方若有门派，两门外交关系落账（「你家弟子在外头被人打了」）
  **机制**：判定函数（320 行）· 关键数据 1 张表（公告栏）· 对外接口 0 具名导出 · 依赖 `rivalry-chain.js`（宿敌收敛）/ `sect-war.js`（外交落账）· 机制：庇护撑腰（在外头被打，门里执事出面 + 两门外交关系落账）/ 抚恤 / 外务 / 公告栏
- `js/sects/sect-signature-arts.js` :: sect-signature-arts.js - 开山秘艺（第十二波 · 门派特色升华为高级功法） · 旧「门派特色」是点一下加个数等冷却的按钮，早就退役成了「门中底子」被动层——可各派的看家本事 · （达摩洞悟道、太极演武、丹方研究、名剑铸造……）一直缺一门**功法形态**的正身
  **机制**：判定函数（287 行）· 关键数据 7 张表 · 对外接口 0 具名导出 + 1 常量 · 依赖 `sect-internal.js` 的 `SECT_SPECIFIC_ARTS` · 机制：把 36 派特色逐一升华为「开山秘艺」（tier4 三品绝学），挂进既有门派功法表，零平行数据。头注释「三十六派逐一」**与实测 36 派一致**
- `js/sects/sect-specialties.js` :: sect-specialties.js - 门派特色功能（P1） · 每个门派拥有独特的专属功能 · 依赖：sects.js（sectsData）、sects-system.js（discipleState）
  **机制**：数据表 + 状态机（724 行）· 关键数据 `SECT_SPECIALTIES` **36 派** / `sectSpecialtyState` / `_SECT_BUFF_ATTR_MAP` · 对外接口 **11 个 `window.` 导出 + 9 个顶层函数**（真入口 `useSectSpecialty`，由 `sect-visit.js:534` 的按钮调）· 依赖 `sects.js` / `time-system.js` · **缺口（两条都实测确认）**：① `:524-528` 注释自陈「`window.updateBuffUI` **全仓没有定义**，这行一直是安全空操作……门派特色增益存进了 `window.activeBuffs`（含效果与到期时辰），**玩家看不见**」，`:529` 的 `if (typeof window.updateBuffUI === 'function')` 是永久空操作；② `:533 getSectSpecialty` / `:603 getSectSpecialtyCooldown` 定义并 `:719/721` 导出，**全仓 0 调用点**（只被本文件 `useSectSpecialty` 内部读）
- `js/sects/sect-standing.js` :: sect-standing.js - 江湖地位（方案一·动态势力规模 + 方案二·动态正邪立场） · 此前门派的「实力」「正邪」是写死在数据里的标签——少林寺永远是巨擘，修罗宫永远是邪派。 · 但势力该是活的：弟子凋零、库房见底、打了败仗、灵脉枯竭，座次就会往下挪
  **机制**：判定函数（310 行）· 关键数据 5 张表（势力档 7 档 ≥400巨擘/≥280大派/≥180中等偏上/≥120中等/≥70小派/≥40式微/<40残破/弟子≤3存实亡；立场档 5 档 ≥80活菩萨/≥40正道所认/±39亦正亦邪/≤-40邪/≤-80正道公敌）· 对外接口 0 具名导出 · 事件 **3 处订阅** · 依赖 `sects.js` · 机制：按月重算每派 `powerScore`（底子分+动态分，灵脉修正）与 `align`（-100~+100），把写死的「实力/正邪」标签换成活档位。头注释的档位阈值与实现一致
- `js/sects/sect-story-arc.js` :: sect-story-arc.js - v20.45 门派故事弧 · 玩家拜入门派后，故事随贡献职级逐段展开：拜门（入门）→ 内门（贡献500）→ 亲传（贡献1000）。 · 首批三门样板：少林（禅·正道）、武当（道·阴阳）、修罗宫（账·邪道）——其余门派按同构追加
  **机制**：数据表 + 状态机（1919 行）· 关键数据 `SECT_STORY_ARCS` **36 派 × 恰好 3 段（stages）× 恰好 3 选（choices）= 108 段 324 选项**，另 `STAGE_REQ`（段位门槛：拜门→内门贡献500→亲传贡献1000）· 对外接口 **5 个 `window.` 导出 + 6 个顶层函数**（`getSectStoryPendingStage` / `playSectStory` / `_resolveSectStory` / `checkSectStory`）· 事件 `window.timeSystem.onNewDaySubscribe(checkSectStory)`(`:1909`) · 依赖 `sects-system.js`（贡献账 / `discipleState`）· **专项核实结论**：**「每派恰好 3 段 × 3 选，36 派完全一样」成立**（运行时实测 36/108/324，无一例外）；但**「effect 是自由文本」这条对门派不成立** —— 324 个选项的 `effect` **100% 是受控对象**，键只有 `contribution`（324 条全有）与 `luck`（113 条有），与 NPC 侧的裸字符串完全不同 · **缺口**：`SECT_STORY_ARCS` / `getSectStoryPendingStage` / `_resolveSectStory` 外部 0 引用；`checkSectStory` / `playSectStory` 看似 0 引用但 `:1905/:1909` 已挂每日钩子与内部链，**不是死代码**
- `js/sects/sect-throne.js` :: sect-throne.js - 掌门位（第十波 · 传位与夺位） · 此前职位表写死「掌门不可通过晋升获得」——散修熬一辈子最高到副掌门，「执掌一派」的终点幻想整条断掉。 · 本模块接通三条登位路（详稿·第十波传位夺位）
  **机制**：状态机（475 行）· 关键数据 无表 · 对外接口 0 具名导出 + 1 常量 · 事件 **3 处订阅** · 依赖 `sects-system.js`（`discipleState`）· 机制：接通传位/夺位三条登位路（旧职位表写死「掌门不可通过晋升获得」，散修熬一辈子最高到副掌门）
- `js/sects/sect-tournament.js` :: sect-tournament.js — v19.1 P0-4：宗门大比与同门竞争
  **机制**：判定函数（590 行）· 关键数据 5 张表 · 对外接口 0 具名导出 · 事件 **2 处订阅**（day%90 每季小比 / day%360 每年大比）· 依赖 `battle.js`（`buildPlayerBattleEntity`；NPC vs NPC 用简化同步模拟，不复制战斗系统）· 单一真源 `TournamentStore[sectName]` + StateRegistry `sectTournaments` v1 持久化
- `js/sects/sect-trade.js` :: sect-trade.js - 坊市商路与押运（改造批三：资源真流通） · 病根：三十六派各守各的库——药材多的和铁多的老死不相往来，资源不流通，守恒只有半本账。 · 本批： · 一、自动商路——每三十日按营生配对（药多的卖药、铁多的卖铁），商队真出发
  **机制**：判定函数（184 行）· 关键数据 1 张表（商路配对规则）· 对外接口 0 具名导出 · 事件 **3 处订阅** · 依赖 `sect-governance.js`（库存守恒）· 机制：每 30 日按营生配对（药多的卖药、铁多的卖铁），商队真出发
- `js/sects/sect-trials.js` :: sect-trials.js - 山门后的试炼（改造批·第一梯队） · 三十六座地标此前只是「点一下拿增益」——但每派山门后都该有一座试炼之地： · 少林的木人巷、剑阁的剑冢、修罗宫的血池。本模块把地标变成真闯关： · 五层，每层两场真仗（守关的不是野怪，是这座地标自己的「影」——阵影/心魔/剑意残识）
  **机制**：判定函数（181 行）· 关键数据 1 张表（36 派地标试炼 5 层）· 对外接口 0 具名导出 · 依赖 `sect-internal.js`（**`getSectEquipment` 是它读门派专属装备的出口，2 处**）、`battle.js` · 机制：36 座地标各变真闯关（每层两场真仗，守关的是地标自己的「影」）
- `js/sects/sect-visit.js` :: sect-visit.js - 门派访问系统（P0-三层访问体系） · 依赖：sects.js（SECT_FACILITY_ACCESS）、sects-system.js（discipleState） · 功能：山门场景、外院游览、内院封锁、游客/弟子视图切换
  **机制**：混合（渲染层 + 判定函数，1148 行）· 关键数据 `SECT_BULLETIN` **4 条通用公告**（按门派类型追加）/ `SECT_DIPLOMACY_STATE` / `SECT_VISIT_CFG` **7 项** · 对外接口 **54 个 `window.` 导出 + 34 个顶层函数**（代表：`showSectOuterView` / `renderSectInnerGate` / `openSectMarket` / `buySectItem` / `initiateSectConflict` / `proposeSectAlliance` / `showSectBulletins`）· 依赖 `sects.js`（`SECT_FACILITY_ACCESS`）、`sects-system.js`（`discipleState`）、`leader-excursion.js`（`isLeaderAway` / `leaderAwayCity`）、`sect-specialties.js`（`useSectSpecialty`）· **门派面板的总入口**——44 个 sect 文件里 UI 枢纽地位最高 · **缺口**：`initiateSectConflict` / `proposeSectAlliance` / `openSectMarket` / `buySectItem` 等外部 0 引用，但经 `:765 / :768 / :117 / :235` 的内联 `onclick` 消费，**是活的**
- `js/sects/sect-war.js` :: sect-war.js - 宗门战争因果 + 自建宗门入江湖（补厚批五 · 孤岛打通） · 病根：①宗门战争是一个「随机挑目标掷骰子」的死键（initiateSectWarPrompt 全仓零调用， · 仗不打真仗、胜败不靠人）；②自建宗门是化外之地——36派外交网没有它的名字，宗门史烂在面板里不入大事记
  **机制**：判定函数（746 行）· 关键数据 1 张表 · 对外接口 0 具名导出 · 事件 **4 处订阅** · 依赖 `sects.js` / `sect-governance.js` · 机制：宗门战争打真仗（胜败靠人不是掷骰子）+ 自建宗门入 36 派外交网。头注释自陈旧病根「`initiateSectWarPrompt` 全仓零调用」——已在本批修通
- `js/sects/sect-year-goal.js` :: sect-year-goal.js — v19.0 P0-3 批次 C：年度宗门目标 5 选 1
  **机制**：状态机（451 行）· 关键数据 2 张表（年度目标 5 选 1）· 对外接口 0 具名导出 · 事件 **4 处订阅** · 依赖 `sects-system.js` · 机制：年末结算放到「新年的第 1 天」（`day % 360 == 1 && day > 1`）由 `processAllSectDailyEconomy` 钩入
- `js/sects/sects-deep-data.js` :: sects-deep-data.js - 门派深度数据（v10.0） · 包含第一梯队+第二梯队共16个门派的深度数据 · 数据驱动：师徒/职务/派系/任务/事件/掌门 · 加载顺序：在sects-system.js之后，sect-visit.js之前
  **机制**：纯数据表（1692 行，零函数除 `initSectsDeepData`）· 关键数据 `SECT_DEEP_DATA` 由 `initSectsDeepData()`(`:67`) **逐派赋值注册 36 派**；逐派子表实测 `masters` **36 派共 108 条** / `factions` **29 派共 57 条** / `specialResources` **57 条** / `events` **仅 3 派共 5 条**；通用表 `COMMON_RANKS` **8 阶**（杂役7→掌门0，`promoteCondition` 贡献 100/300/800/2000/6000/12000，掌门 `promoteCondition:null` 写死不可晋升）/ `COMMON_TASKS` **10 项**（每项带 `cost:{energy,minutes}` 真耗时）/ `SECT_EVENTS` **36 派 87 事件 155 选项** · 对外接口 `window.SECT_DEEP_DATA` / `SECT_EVENTS` / `COMMON_RANKS` / `COMMON_TASKS` / `initSectsDeepData` · 依赖 `sects.js`（`sectsData`）· **缺口**：① `:2` 头注释「包含第一梯队+第二梯队共16个门派」vs 实测 **36 派**；② **`events` 只有少林寺(2)+药王谷(1)+修罗宫(2)=5 条**，其余 33 派 `SECT_DEEP_DATA[x].events` 为 `undefined`（`sects-deep-ui.js` 的事件面板对这 33 派是空的）；③ **7 派 `factions` 为空数组**（天山派/蓬莱派/五仙教/百花谷/铁掌帮/大隐阁/天书阁），派系面板对这 7 派开天窗；④ `:1370` 注释已自陈 `repSelf` 键「弟子侧没有这本账，写不进任何地方」——但表里 87 条事件仍留着该键的历史包袱
- `js/sects/sects-deep-ui.js` :: sects-deep-ui.js - 通用门派深度UI（v10.0） · 数据驱动，自动适配所有在 SECT_DEEP_DATA 中注册的门派 · 提供：拜师/职务/任务/派系/事件等通用面板 · 加载顺序：在 sects-deep-data.js 之后
  **机制**：渲染层（数据驱动 UI，1011 行）· 关键数据 无自有表，全部读 `SECT_DEEP_DATA` · 对外接口 **42 个 `window.` 导出 + 29 个顶层函数**（代表：`getSectDeepData` / `showSectDeepTasks` / `openGbFactionPanel` / `sectBecomeStudent` / `askMasterGuidance` / `chooseSectEvent`）· 依赖 `sects-deep-data.js`（`SECT_DEEP_DATA` / `COMMON_RANKS` / `COMMON_TASKS`）· **缺口**：`:991 getSectDeepButtons(sectName)` 定义并 `:1011` 导出，**全仓 0 调用点**——深度面板的按钮总表没人读，各面板各自拼 html
- `js/sects/sects-system.js` :: sects-system.js - 门派系统 · 借鉴《觅长生》、《太吾绘卷》的门派设计
  **机制**：混合（状态机 + 判定函数 + 渲染层，2250 行）· 关键数据 `SECT_RESOURCES` 4 种币（contribution/points/currency/reputation）/ `discipleState` 9 字段 / `RANKS` **8 阶** / `TASK_TYPES` 6 / `sectTasks` **76 条** / `sectResourceState` 9 字段 / `SECT_POWER_TIERS` / `SECT_VOTE_TEMPLATES` **5** / `SECT_LEADER_POLICIES` **4** · 对外接口 **75 个 `window.` 导出 + 44 个顶层函数**（代表：`joinSect` / `leaveSect` / `getPlayerRank` / `openSectVote` / `castVote` / `applyLeaderPolicy` / `getSectResource` / `resetDailyTasks`）· 事件 `EventBus` 7 处订阅 + `onNewDaySubscribe` 日结 · 依赖 `sects.js`（`sectsData` / `sectPositions`）、`sect-internal.js`（`getSectInternal`） · **缺口**：~23 个导出（`getPlayerRank` / `updateTaskUI` / `acceptElderTask` / `advanceSectTaskProgress` / `sectResourceState` / `SECT_LEADER_POLICIES` 等）**外部 0 引用**，但其中 `openSectVote`(:1923) / `castVote`(:1962) 经本文件 `:2197-2211` 的内联 `onclick` 消费，**不是死代码**——倒排索引看不到字符串字面量里的调用点，判「死」必须回原文件核
- `js/sects/sects.js` :: 仙路长青 - 门派数据
  **机制**：纯数据表 + 少量判定函数（162 行）· 关键数据 `sectsData` **36 派** / `sectPositions` **36 派** / `sectsByRegion` 分区索引 / `SECT_ACCESS_LEVEL` **6 档** / `SECT_FACILITY_ACCESS` **10 类** · 对外接口 `window.sectsData` / `sectPositions` / `SECT_ACCESS_LEVEL`（另把 `SECT_FACILITY_ACCESS` 的 6 个取值常量挂全局）· 依赖 无（纯数据，但 `init` 里用了 `mapData`，须排在地图模块之后）· **缺口**：`SECT_ACCESS_LEVEL`（6 档访问权限）与 `sects-deep-data.js:9 COMMON_RANKS`（8 阶职务）是**两套并行的职位表**，权限与职务不同源，改一处不会带动另一处

### js/vendor/（1 个）— 第三方

- `js/vendor/tailwind.js` :: ! · fill-range <https://github.com/jonschlinkert/fill-range>
  机制 84 行 · 第三方工具（Tailwind CSS CDN 运行时，占位/降级）｜无数据表；只挂 1 个 window 全局 `didYouMean`（误拼建议辅助）
  接口 `window.didYouMean`（1）｜依赖：无｜事件：无
  缺口 ★本文件是全 354 个文件里唯一第三方文件（§0.2 已标 `【已废弃·不挂载】` 的两个文件之一）；`window.didYouMean` 全域零引用且与游戏逻辑无关 ⇒ 是 CDN 加载失败时的诊断提示
  缺口 回归测试 `tests/v26.0-six-livelihoods-node.js` 的 H16 断言「HTML 342 个 js 脚本标签 = 清单 341 + vendor/tailwind.js」——**本文件是清单外的唯一一项**，任何新增脚本都必须同步改这两处计数（该断言当前红）

### js/world/（1 个）— 世界（节气）

- `js/world/solar-terms.js` :: solar-terms.js - v20.0 2.18 节气/季节限定活动 · 24节气日给气运 buff + 灵气流转提示，季节感 · 依赖：timeSystem.onNewDaySubscribe、currentDay
  机制 52 行 · 纯数据表 + 新日钩子（二十四节气：一游戏年 360 日、每 15 日一节气）｜关键数据 `SOLAR_TERMS` **24 条**；只挂 1 个 window 全局 `getCurrentSolarTerm`
  接口 `window.getCurrentSolarTerm`｜依赖 timeSystem.onNewDaySubscribe（tickSolarTerm）、currentCharData、gameLog｜事件：★订新日（经 timeSystem，非 EventBus）
  缺口 ★`solar-terms.js:45 window.getCurrentSolarTerm` → **全域零引用**（js/ + 仙侠.html 都 0）⇒ 二十四节气表算出来了却没有消费者，节气只经 `tickSolarTerm` 写进 gameLog 一条日志
  缺口 本文件是 world/ 目录唯一一本（52 行），也是全项目最小的非 vendor 文件之一；节气表与 `time-system.js` 的 `SEASONS`（四季）是两套并存的历法细分（**无法判定**是否有意：节气未与天气/作物挂钩）

---

【文档定位】本文件回答「**有什么 / 谁负责 / 挂在哪 / 依赖谁**」——是当前状态的静态快照。
**什么时候改的 / 为什么改 / 谁改的 / 验收结果**属于时间序列，全部在 [`版本记录.md`](版本记录.md)（根目录，每次更新游戏都要写）。
本文件不再承载任何更新日志；此前混在正文里的 v7.0/v9.x/v12.x/v20.x 与「第一~一百一十一波」批次记录已全部并入 `版本记录.md` 对应版本小节。

【规划文档】
- **【新增·分析】** `../游戏制作/旧计划/主流游戏对比与差距分析.md`（仓库外·已迁出） — 对标《鬼谷八荒》《觅长生》《太吾绘卷》《博德之门3》《环世界》等主流游戏的全面差距分析：完全缺失的主流标配（音频/教程/自动存档/移动端/快捷键/图片资产）、内容维度差距（主线叙事密度/支线生态/手工世界/Boss战）、玩法系统逐项对比（战斗AOE与Boss机制/闭关长修/家族传承/图鉴收集）、技术工程差距（存档迁移框架/测试覆盖）、UI/UX差距、数值平衡清单、长线留存（终局空洞/成就深度/开局多样性）与 P0~P3 优先级路线图；全部结论代码实测验证并附证据索引
- **【规划·优先】** `GPT逻辑审查报告.md`（规划已落地·文档不再维护） — 完整逻辑审计：P0×13 / P1×19 / P2×22 / P3×5；串档、存档、背包、时间、灵兽、任务、秘境等（结论已由 v9.10～v20.0 各批次修复落地，原始审计文档不在仓库内）
- **【规划·优先】** `../游戏制作/旧计划/GPT审核报告2实施计划.md`（仓库外·已迁出） — GPT二次审计报告五批修复计划：P0禁止静默失败和假成功 → P1统一任务事件 → P2人物互动优先 → P3门派内容 → P4内容完整性
- **【规划·优先】** `../游戏制作/旧计划/GPT审查待办实施计划.md`（仓库外·已迁出） — 五批修复顺序与验收：①停止数据损坏 ②统一背包货币 ③统一时间事件 ④核心玩法闭环 ⑤清理展示性内容（**B1～B5 关键已落地**（设施大规模差异化未做））
- **【新增·规划】** `../游戏制作/旧计划/基础内容补全开发计划.md`（仓库外·已迁出） — 基于路线图的完整开发计划：B1~B5已完成回顾、6个阶段路线图实施计划、每阶段工作量估算、开工顺序建议（总量约5000~7700行）
- **【新增·规划】** `../游戏制作/旧计划/GPT审核报告2实施计划.md`（仓库外·已迁出） — GPT审核报告2的五批修复实施计划：P0禁止静默失败和假成功 → P1统一任务事件 → P2人物互动优先 → P3门派内容 → P4内容完整性
- **【新增·规划】** `../游戏制作/旧计划/门派入门体系改造计划.md`（仓库外·已迁出） — 基于 `门派扩展2大纲.txt` 的门派入门体系改造：名气/心性/身份晋升/特殊门派
- `属性现状分析与修改计划.md`（规划已落地·文档不再维护） — 代码实测：主属性/战斗属性/技能/灵根实际效果与缺口（属性系统已由 combat-stats.js + v20.0 buildPlayerBattleEntity 统一注入实现，原始规划文档不在仓库内）
- `属性系统实施计划.md`（规划已落地·文档不再维护） — 基于 GPT属性修改修正.txt 的 5 批次落地计划（约 420～610 行）（5 批次已由后续版本落地，原始规划文档不在仓库内）
- 精简平衡方案原文（`GPT属性修改修正.txt`，**根级不存在·文档不再维护**；5 批次已由后续版本落地）
- **新增** [`js/combat-stats.js`](js/combat-stats.js) — 动态战斗属性 + 负荷
- **已落地 v9.9** 通用事件需求原文（`通用事件.txt`，**根级不存在·文档不再维护**；可执行批次 A～D 见下一行）
- **已落地 v9.9** `../游戏制作/旧计划/通用事件实施计划.md`（仓库外·已迁出） — 可执行批次 A～D
- **已落地 v9.10** [`js/core/game-state.js`](js/core/game-state.js) — 统一存档世界状态

【项目总览】**354 个 js 文件**（2026-10-03 实测，全量清单见 §0.2）+ 1 个 HTML + 1 个 CSS + 2 个静态校验脚本 + 288 套 node 回归。
逐目录：根 44 / npcs 94（91 + storylines-v2 3）/ sects 44 / city-facilities 34 / core 33 / extensions 30 / items-extended 18 / quest 13 / cultivation 10 / map 9 / crafting 7 / economy 5 / factions 3 / gameplay 3 / equipment 2 / combat 1 / endgame 1 / vendor 1 / world 1。
其中 **351 个挂在 `仙侠.html`**，2 个已废弃不挂载（`items-extended/09-loot-sources.js`、`npcs/npc-storylines.js`）。

版本记录.md位于根目录,每次更新游戏需写入更新内容

---

## 版本历史与修复记录

版本历史、BUG修复记录、开发事故已移至 [`版本记录.md`](版本记录.md)。

| 批次记录去哪看 | | |
|--------|-----|------|
| v7.0 ~ v20.0.2 的逐批落地记录 | [`版本记录.md`](版本记录.md) 的 `## v9.x` ~ `## v20.0.2` 小节 |
| 世界接线批·第一~一百一十一波 | [`版本记录.md`](版本记录.md) 的 `## 世界接线批·第N波` 小节 |
| v21.x ~ v27.x 各批次 | [`版本记录.md`](版本记录.md) 顶部倒序排列 |

### 属性系统（规划摘要 · 勿以 data.js combatStats.default 为准）
| 主属性 | 核心职责（修正方案） |
|:---|:---|
| 力量 | 攻击、格挡、负荷能力 |
| 灵巧 | 命中、速度、闪避 |
| 神识（原智力，键 intelligence） | 化解、精确部位惩罚减免 |
| 意志 | 疼痛抵抗、精神抗性数据、部分防御 |
| 体质 | 防御、韧性、精力、恢复、毒抗 |
| 经脉 | 真气上限、恢复倍率、内功发挥 |
| 战斗属性 | 面板与战斗统一 `getDerivedCombatStats`；闪避≤35%、格挡有条件、暴击基5%、倍率150%+、反击/破甲/毒抗实装 |
| 物理伤害 | 仅 slash/pierce/blunt；删除 sharp |
| 实施批次 | ①数据修复 ②动态战斗属性 ③三伤害 ④负荷 ⑤生活技能+灵根 |

---

【一、核心数据文件详解】
========================================

## 1.1 data.js - 基础游戏数据

### 属性分类 (attributes)
```javascript
attributes = {
    main: ['力量', '灵巧', '神识', '意志', '体质', '经脉']  // v9.8：界面显示「神识」（内部英文键仍为 intelligence）,
    combat: ['内功', '轻功', '绝技', '拳掌', '剑法', '刀法', '长兵', '奇门', '射术'],
    life: ['医术', '毒术', '学识', '口才', '采伐', '种植', '锻造', '炼制', '烹饪']
}
```

### 灵根 (rootNames, rootColors)
- 名称: ['金','木','水','火','土']
- 颜色类名: 对应Tailwind颜色

### 身体部位 (bodyParts) - 22个（与battle.js BODY_PARTS保持一致）
```javascript
[
    {id: 'brain', name: '脑', desc: '神识中枢，受损影响智力与意志', stat: 'intelligence'},
    {id: 'eyes', name: '眼', desc: '视觉所系，受损影响命中与察觉', stat: 'dexterity'},
    {id: 'jaw', name: '下颌', desc: '言语之门，受损影响口才与进食', stat: 'willpower'},
    {id: 'head', name: '头', desc: '六阳之首，受损影响整体状态'},
    {id: 'neck', name: '颈', desc: '气血通道，受损影响经脉运转', stat: 'constitution'},
    {id: 'chest', name: '胸', desc: '气息之府，受损影响内功与防御', stat: 'strength'},
    {id: 'abdomen', name: '腹', desc: '消化之器，受损影响体质与恢复', stat: 'constitution'},
    {id: 'dantian', name: '丹田', desc: '修仙根本，受损影响所有内力相关能力', stat: 'meridian'},
    {id: 'waist', name: '腰', desc: '力之枢纽，受损影响轻功与闪避', stat: 'dexterity'},
    {id: 'pelvis', name: '盆', desc: '下盘根基，受损影响平衡与稳定', stat: 'willpower'},
    {id: 'upperArmL', name: '左上臂', desc: '发力之源，受损影响力量与攻击', stat: 'strength'},
    {id: 'upperArmR', name: '右上臂', desc: '发力之源，受损影响力量与攻击', stat: 'strength'},
    {id: 'forearmL', name: '左下臂', desc: '精细操控，受损影响灵巧与技艺', stat: 'dexterity'},
    {id: 'forearmR', name: '右下臂', desc: '精细操控，受损影响灵巧与技艺', stat: 'dexterity'},
    {id: 'handL', name: '左手', desc: '触感所在，受损影响锻造与炼制', stat: 'dexterity'},
    {id: 'handR', name: '右手', desc: '触感所在，受损影响锻造与炼制', stat: 'dexterity'},
    {id: 'thighL', name: '左大腿', desc: '行动之力，受损影响移动速度', stat: 'strength'},
    {id: 'thighR', name: '右大腿', desc: '行动之力，受损影响移动速度', stat: 'strength'},
    {id: 'calfL', name: '左小腿', desc: '弹跳之基，受损影响跳跃与闪转', stat: 'constitution'},
    {id: 'calfR', name: '右小腿', desc: '弹跳之基，受损影响跳跃与闪转', stat: 'constitution'},
    {id: 'footL', name: '左脚', desc: '立身之本，受损影响站立与移动', stat: 'dexterity'},
    {id: 'footR', name: '右脚', desc: '立身之本，受损影响站立与移动', stat: 'dexterity'}
]
```

### 境界 (realmLevels) - 9境
```javascript
[
    {realm: '炼气', layers: 9, baseQi: 100},
    {realm: '筑基', layers: 9, baseQi: 300},
    {realm: '金丹', layers: 9, baseQi: 600},
    {realm: '元婴', layers: 9, baseQi: 1200},
    {realm: '化神', layers: 9, baseQi: 2500},
    {realm: '炼虚', layers: 9, baseQi: 5000},
    {realm: '合体', layers: 9, baseQi: 8000},
    {realm: '大乘', layers: 9, baseQi: 12000},
    {realm: '渡劫', layers: 9, baseQi: 15000}
]
```

### 地形 (terrainTypes) - 10种
平原、林地、山地、河流、火山、矿脉、沼泽、沙漠、雪原、湖泊

### 建筑 (buildingTypes) - 10种
小镇、坊市、寺庙、酒馆、洞府、遗迹、灵峰、灵泉、铸剑台、药园

### 战斗属性 (combatStats) - 10项
```javascript
[
    {id: 'hit', name: '命中', icon: '🎯', default: 85, tooltip: '命中率 = 基础值 + 装备加成'},
    {id: 'dodge', name: '闪避', icon: '💨', default: 10, tooltip: '闪避成功后该次攻击完全不造成伤害'},
    {id: 'block', name: '格挡', icon: '🛡️', default: 10, tooltip: '格挡成功后伤害减免50%'},
    {id: 'parry', name: '化解', icon: '🌀', default: 10, tooltip: '化解成功后伤害减免30%'},
    {id: 'crit', name: '暴击', icon: '⚡', default: 5, tooltip: '暴击伤害 = 普通伤害 × 暴击倍率'},
    {id: 'critDmg', name: '暴击倍率', icon: '💥', default: 150, suffix: '%', tooltip: '暴击时造成的伤害倍数'},
    {id: 'counter', name: '反击', icon: '↩️', default: 5, tooltip: '反击成功率 = 基础值 + 装备加成'},
    {id: 'penetrate', name: '破击', icon: '🔨', default: 5, tooltip: '破击成功后忽略敌人50%的防御力'},
    {id: 'toughness', name: '韧性', icon: '💪', default: 5, tooltip: '每1点韧性降低2%被暴击概率'},
    {id: 'poisonRes', name: '毒抗', icon: '🛡️', default: 0, tooltip: '毒抗越高，中毒后受到的持续伤害越低'}
]
```

### 回避方式 (avoidanceMethods, avoidancePriority)
3种: 闪避、格挡、化解，各有惩罚值

### 耐久度颜色 (durabilityColors, getDurabilityColor, getDurabilityLabel) — v9.8.1
与战斗 SVG / 状态面板数字统一色阶：
| 耐久 | 颜色 | 标签 |
|------|------|------|
| 100 | `#22c55e` | 完好 |
| 99–80 | `#66CC00` | 健康 |
| 79–50 | `#FFDC00` | 轻微损伤 |
| 49–30 | `#FF851B` | 中度损伤 |
| 29–11 | `#8B0000` | 重度损伤 |
| 10–1 | `#3f0000` | 濒临毁坏 |
| 0 | `#000000` | 尽毁 |

实现：[`js/data.js`](js/data.js) `getDurabilityColor` / `getDurabilityLabel`；战斗侧 [`js/app.js`](js/app.js) `_battlePartColor` / `updateBattleBodyView` 列表数字均调用同一函数。

### 击杀尸体标记 (markKilledEnemyAsCorpse) — v9.8.1
- 仅标记被击杀的那一个实体；`battle._corpseMarked` 防 onEnd+closeBattle 双次误标
- 匹配优先级：`currentInteractionEntity` 引用 → `currentInteractionIndex` → **精确**名字（禁止模糊 indexOf）→ 本格仅 1 个可战斗存活实体时才回退
- 同格多名存活时拒绝猜测，避免「杀一个全格变尸」

### 敌人 AI 自救 (Battle.enemyTurn / bandageWound) — v9.8.1
- 只包扎 `bleeding && !stabilized` 伤口；已稳定不可重复包扎
- 每场战斗最多治疗 2 次；低血且伤口已处理则继续攻击
- 包扎立即降低出血速率，轻度伤口可直接停血

## 1.2 regions.js - 地区与城市数据

## 1.2 regions.js - 地区与城市数据

### mapData - **10 个地区**（v26.2 修正：原写「7 个」已过时）
```javascript
mapData = {
    // 人间七州（7）
    '中州': {...}, '东荒': {...}, '南疆': {...}, '西漠': {...},
    '北冥': {...}, '蜀地': {...}, '东南海域': {...},
    // 位面三界（v20.65 位面闸门 / v44 飞升闭环引入，v26.2 实测补记）
    '灵界': {...}, '魔界': {...}, '天界': {...}
}
```
> `REGION_FEATURES`（区域特性表）**仍是 7 个**，只覆盖人间七州；位面三界不在此表内，这是有意的。

### 城市
**2026-10-03 复核实测：共 23 座**——人间 19 城 + 位面 4 城，全部定义在 `js/location-system.js:73` 的 `locationSystem.cityData`。
位面 4 城实为 `灵界·蓬莱仙境 / 灵界·九天罡风带 / 魔界·九幽深渊 / 魔界·血海荒原`（**原写的「太虚山 / 血池 / 魔宫 / 天门」不存在**）。
`js/regions.js` 的 `mapData.cities` 同样列 23 条（人间 19 + 位面 4），**原写「只列人间 17 城」已过时**。

## 1.3 sects.js - 门派数据

### sectsData - 36个门派
每个门派包含: type(正道/邪派/中立), location, power, weapons, desc
实际门派列表（**注意**：原文档写正道21个，实际**25个**（grep type:'正道'=25）；本节按 sects.js:4-48 实测 36 条修正）：
- **正道 25 个**（原 21 错）：少林寺、武当派、全真教、华山派、嵩山派、恒山派、衡山派、泰山派、峨眉派、丐帮、大旗门、侠隐阁、药王谷、天山派、铸剑山庄、茅山派、大隐阁、天书阁、天涯海阁、神机门、霹雳堂、昆仑派、金刚宗、青城派、蓬莱派
- **中立 5 个**：五仙教、逍遥派、唐门、百花谷、铁掌帮
- **邪派 6 个**：修罗宫、阎罗殿、血手门、飞蝎坞、烈日教、天龙教

### sectPositions - 门派坐标和颜色

### sectsByRegion - 按地区分组

## 1.5 玩家宗门（自建门派账）— js/extensions/player-sect.js

> 本节为 v26.2 补录。此前只有更新日志提到「玩家建宗确实存在」，正文无对应小节，`版本记录.md` 指向的 §1.6 是空锚点。

- 五处可选山门 `FOUND_SITES`（山/城/水/漠/岛，取自命门档案词表），安家费 600~1000，各有名目
- `chooseSite()` 择址 + `addHistory()` 记宗门史（上限 120 条）
- `tickDay()` 职位真管事：长老座镇（灵石+1/声望+0.05）、堂主管库（兵器/丹药各 +0.5）；备战流失改 `_lossAcc` 小数逐日累计
- `_importState()` 旧档补默认

同族五个文件（全在 `js/extensions/`，不在 `js/sects/`）：
| 文件 | 负责 |
|------|------|
| `player-sect.js` | 宗门本体账（山门/资源/职位/备战/宗门史） |
| `player-sect-bootstrap.js` | 白手起家：开局即可竖幡，取消「元婴+600灵石」硬门槛 |
| `player-sect-life.js` | 门内日子：镇山秘艺 / 弟子派遣 / 门内日常 / 病殁治丧 |
| `player-sect-venture.js` | 创业维艰：住哪、吃什么、人从哪来、世界怎么看（不开新面板） |
| `player-sect-world.js` | 入江湖四条线：举幡争城 / 盛会主办 / 灭门复兴 / 宗谱腰牌 |

## 1.6 玩家宗门面板 — js/extensions/player-sect-ui.js

> `版本记录.md` 的「§1.6 在案」指向本节。

- `openFoundSectPanel()` 立派流程：自拟宗名（含备选）/ 出身正-中-邪 / 五址择山门 / 开山当日来客
  （正道名宿贺喜 + 黑影伏笔、邪派黑道贺礼 + 官府登记 + 玩家声望 -1、中立两边探底）
- `openPlayerSectPanel()` 宗门总册：五资源带净额预估（与 `tickDay` 同口径）/ 方针切换 / 弟子名录 / 收徒 / 任命 / 护宗战 / 宗门史 / 解散
- 收徒规矩：好感 ≥ 20（拜山门总得先认识）
- `_defendSectRaid()` 接武库：兵器 ≥ 10 时妖兽攻势每件 -0.5%（封顶三成）+ 战后折损 30%，库空则掌门独迎

接线：`cultivation.js` 未立宗→立派流程、已立宗加「宗门总册」；`app.js` 的 `_quickFoundSect` 转发新流程。

## 1.4 items.js - 物品模板库

### 物品分类 (ITEM_CATEGORIES)
EQUIPMENT(装备), CONSUMABLE(消耗品), MATERIAL(材料), QUEST(任务物品), SECRET_ART(秘籍), FORMATION(阵法)

### 物品品质 (ITEM_QUALITIES)
COMMON(凡品x1), UNCOMMON(良品x1.5), RARE(珍品x2), EPIC(极品x3), LEGENDARY(仙品x5), MYTHIC(神品x10)

### 装备槽位 (EQUIPMENT_SLOTS) - 11类（v9.4 改：原 12 类中饰品 acc 拆分实未实现）
**注意**：items.js 定义 11 个 snake_case 键（实际仅 11 个），但 equipment.js 定义 12 个 camelCase 键（含 neck/offHand/ring2/acc1/acc2），**两套定义对不上**。
items.js 实际键：head/neck/body/waist/hands/feet/mainHand/offHand/ring1/ring2/acc
equipment.js 实际键：head/body/waist/hands/feet/mainHand/offHand/ring1/ring2/acc1/acc2/neck
**统一方案待办**：合并到一套 camelCase 12 槽（equipment.js 定义），含 5 个空槽（neck/offHand/ring2/acc1/acc2 当前无物品定义）.

### 基础物品（items.js - **40 种**，2026-10-03 复核实测；原写「41 种」已过时）
2026-10-03 复核：按 `js/items.js` 五个真实数组逐个数 `id`——`weapons` 9 / `armor` 9 / `consumables` 11 / `materials` 6 / `secretArts` 5 = **40**。
- 武器(9): 玄铁剑/御剑/雷音剑/仙人斩/钢刀/焚焰刀/灵木杖/龙魂杖/铁掌
- 防具(**9**，原写 10 已过时): 青布帽/仙灵冠/亚麻道袍/云纹甲/九天仙衣/布鞋/飞天靴/铁戒指/灵玉戒 — **原列 10 项但 `armor` 数组只 9 条**
- 消耗品(**11**，原写 11 但列了 13 个名字): 聚气丹/筑基丹/凝金丹/回灵丹/回春丹/千年人参/灵芝/血菩提/攻击符/防御符/传送符 — **原多列的「小还丹 / 大还丹」不在 items.js，在 `items-extended/01-pills.js`**
- 材料(6): 精铁/灵石/龙骨/凤凰羽/灵草/五行精华
- 秘籍(5): 基础修炼诀/基础剑法/太极剑法/九阳神功/飞天轻功

> ⚠️ 口径警告：本节 40 与 §5.1 第 4 层的「基础 61 个 id」**不是同一个口径**，别当成互相打架。
> 61 = 40 个物品模板 + 11 个 `EQUIPMENT_SLOTS` 键 + 10 个 `ITEM_QUALITIES` 键，是 `items.js` 全文 `id:` 的总数，不是「基础物品种数」。

### 扩展物品系统（v5.0新增；v26.2 实测：items-extended/ 共 17 个在用子文件、546 个 id，其中约 156 个属事件段/任务段而非物品模板，**纯物品模板约 390**；原写「~287」已过时）
**文件结构（实际 18 个子文件，2026-10-03 复核；原写「14 个」已过时——目录里实有 01～18 共 18 个 .js）：**
```
js/items-extended.js                              # 主入口
js/items-extended/
├── 01-pills.js          # 丹药类（共 45 个 id，其中 pill_ 前缀 43：恢复15/永久12/特殊7/突破9）
├── 02-weapons.js        # 武器类（wpn_ 前缀，58 种：剑20/刀9/法杖8/长兵5/暗器6/拳套5 + 其他）
├── 03-armor.js          # 防具类（arm_ 前缀，55 种：头饰9/护甲12/手套6/靴子8/腰带7 + 其他）
├── 04-materials.js      # 材料类（mat_ 前缀，51 种：矿石14/草药14/兽类15/特殊8）
├── 05-talismans.js      # 符箓类（tal_ 前缀，21 种）
├── 06-arts.js           # 功法秘籍类（art_ 前缀，**47 种**；v26.2 实测。原写38种为v5.0时代口径，已被 v20.80 方向扩库 38→47 作废——本文 5.1 节第14条早已写47，本行漏改）
├── 07-food.js           # 食物/饮品（food_ 前缀，12 种）
├── 08-special.js        # 任务/特殊物品（**共 17 个 id**：spec_ 前缀 16 + half_broken_hairpin 1）
├── 09-loot-sources.js   # 战利品表（孤儿模块——getExtendedLoot 实际未被主表调用）
├── 10-crafting-extensions.js  # 扩展符箓/丹药配方
├── 11-event-extensions.js     # 事件系统扩展
├── 12-quest-extensions.js     # 主线任务扩展（main_021-035 共 15 个）
├── 13-missing-ids.js    # 缺失物品 ID 补全
├── 14-ability-manuals.js # 战斗绝技秘籍（9 种，2026-10-03 复核逐条点 manual() 调用确认）
├── 15-root-refine.js  ·  16-dangling-ids.js  ·  17-lead-tokens.js  ·  18-grade-expansion.js
```

**加载顺序：** items.js → items-extended子文件 → items-extended.js → inventory.js

**数据合并：** items-extended.js 自动将扩展物品合并到 window.allItems / window.itemById / window.weapons / window/armor / window.consumables / window.materials / window.secretArts

**ID前缀规则（2026-10-03 逐文件 grep `id:` 复核实测）：**
- pill_  丹药（**43** 个 pill_ 前缀 / 文件内共 45 个 id）：恢复15/增益0/永久12/特殊7/突破9
- wpn_   武器（**58** 种）：剑20/刀9/法杖8/长兵5/暗器6/拳套5 + 其他
- arm_   防具（**55** 种）：头饰9/护甲12/手套6/靴子8/腰带7 + 其他
- mat_   材料（**51** 种）：矿石14/草药14/兽类15/特殊8
- tal_   符箓（**21** 种）
- art_   功法（**47** 种）：内功18/剑法9/刀法5/拳掌8/轻功7
- food_  食物（**12** 种）
- spec_  特殊（**16** 个 spec_ 前缀 / 文件内共 17 个 id）

> **2026-10-03 修订说明**：本块原有 6 组自相矛盾的数字——同一文件在同一列表里出现两个数（pill_ 43 vs 45、mat_ 51 vs 50、tal_ 21 vs 20、spec_ 15 vs 12），另有 wpn_ 53 / arm_ 42 两处整体过时。已全部按实测统一。
> 「+ 其他」表示子分类小计之和小于文件内 `id:` 总数（差额是子类归属外的条目），别拿小计当总数。
> ⚠️ 文件树末行把 4 个文件压在一行只为省篇幅，**不是漏列**；目录实有 18 个 `.js`。

### 全局导出
window.allItems, window.itemById, window.weapons, window.armor, window.consumables, window.materials, window.secretArts

========================================
【二、系统文件详解】
========================================

## 2.1 battle.js - 战斗系统（v9.5 属性与技能接入；第九十波 骑乘参战；第九十一波 百宝袋的回合账；第九十二波 行动条时间轴；第九十三波 卑鄙流仪；第九十四波 见招拆招；第九十七波 对面也是活人；第九十八波 妖兽力气账；第九十九波 江湖耳目；第一百波 连环手）

### BODY_PARTS - 22个部位(含左右对称)
头部: 脑(智力)、眼(灵巧)、下颌(意志)、头(体质)
躯干: 颈(体质)、胸(力量)、腹(体质)、丹田(经脉)、腰(灵巧)、盆(意志)
四肢: 左上臂/右上臂(力量)、左下臂/右下臂(灵巧)、左手/右手(灵巧)
下肢: 左大腿/右大腿(力量)、左小腿/右小腿(体质)、左脚/右脚(灵巧)

> ⚠️ v9.10 BUGFIX: 之前 BODY_PARTS 缺少 `head`（头），只有21个部位，导致战斗中无法选择攻击"头"。
> 现已补充，与 data.js 的 bodyParts 保持22个一致。

### WEAPON_SKILL_MAP（v9.5 批次B）
武器类型→战斗技能：sword/dagger→剑法；blade/axe→刀法；staff/spear→长兵；bow→射术；fist→拳掌；claw/whip→奇门
getWeaponSkillName(weaponId) / getPlayerWeaponSkill() - 读 currentEquipment.mainHand + combatSkills

### Entity类（v8.2 / 机体 v4.1 + v9.5 衍生属性）
constructor(data, type) - 玩家/敌人/野兽；physiology 含 bloodVolume/oxygenDebt/criticalTimer
  - v9.5 新增：spiritResist（意志*0.5，精神攻击预留）、toughness（体质*0.3）、maxStamina/stamina（100+体质*0.5）
  - v9.5 新增：dodgeBonus/blockBonus/parryBonus（由速度估算，运行时以 getSpeed 刷新）
getEffectiveAttrs() - 获取衰减后属性
getAttack() - **力量×1.0** + 内功 + 武器技能×0.15（无技能持武-5）+ 装备/道侣/年龄
getDefense() - 体质+意志+装备加成；玩家额外乘 getBondBonuses().defense（道侣+5%）
getSpeed() - 灵巧*0.7 + 轻功*0.1
takeDamage(partId, damage, damageType) - 头/脑/颈/胸耐久归零=直接死亡（肉体尽毁）
_applyPhysiologyDamage() - 丹田尽毁不死亡；depth≥4 概率 enterCriticalState
checkDeath() - bloodVolume≤0 死亡；循环/缺氧→危急；计时满死亡
getPhysiologySummary() - bloodVolume/oxygenDebt/critical*/dantianDestroyed

### 生理系统函数（v4.1 + v9.5）
initPhysiology / processPhysiology / updateConsciousness
enterCriticalState / clearCriticalState / getCriticalStatus / getPainCombatPenalties
  - 意志耐疼系数默认 **0.8**（原0.5；100意志→80疼痛削减）
bandageWound - 稳定度 = min(60, 40 + 医术/5)（F1）
hourlyRecovery(entity) - 体质自然愈合：部位耐久+体质/10、精力+2×、血量+0.2×（G）
hemostaticTreatment 可逆转危急
physiology-config：OXYGEN_DEBT_RATE 0.25（约7回合满债）；CRITICAL 5分钟=50回合

### 战斗难度条件栏（v12.4）
js/core/difficulty-config.js — DIFFICULTY_PRESETS 三档 + getDifficulty/setDifficulty/getDifficultyParam(key)
- 档位存 currentCharData.difficulty（默认 normal）；localStorage 键 xianxia_difficulty 即时持久化；StateRegistry 注册随完整存档走
- easy 宽松🟢 {enemyDmgMul:0.75, criticalTurns:50, vitalMul:1.0} / normal 标准🔵 {1.2, 35, 1.3} / hard 凶险🔴 {1.7, 20, 1.5}
- battle.js 接入：_isEnemySide 判定（排除玩家/队员/玩家方灵兽）→ _calculateDamage 敌方 atk×enemyDmgMul；
  takeDamage 要害部位(brain/head/chest/neck/dantian)伤害×vitalMul（双向，位于符箓吸收之后、护甲伤口减免之前）
- 危急窗口兜底 `||50` 全部改 _getDifficultyCriticalTurns()（battle.js×3 / battle-injuries.js×2）；
  physiology-config 新增 getCriticalTimerMinutes() 按难度换算分钟，原 CRITICAL_TIMER_MINUTES 保留为标准档参考值
- 设置页「游戏设置」内折叠式三档卡片UI（debug-panel.js 渲染，所有玩家可见），切换即存+showMessage 确认

### Battle类
constructor(playerEntity, enemyEntity)
playerAttack(partId) - 攻击指定部位
enemyTurn() - AI智能攻击要害
_calculateDamage(attacker, defender) - atk - def*0.3 + **±1微波动**（A2）；v12.4 敌方攻击先 ×enemyDmgMul 难度系数
_executeAttack() - **完整判定链（C）**：
  1. 昏迷/疼痛动作失败
  2. 命中：85+(灵巧-10)*0.3+技能*0.1，小部位-20，限幅5~95
  3. 闪避：10+速度*0.15+技能*0.08+疼痛惩罚，限幅1~60
  4. 格挡：10+速度*0.08+力量*0.1（盾+15），伤害×(0.5+韧性/200)
  5. 化解：10+速度*0.08+智力*0.1，伤害×0.7
  6. 正常伤害+暴击（韧性降低被暴击率 toughness*0.005）
10%基础暴击率，1.8倍暴击伤害

### 敌人生成
generateRandomEnemy(level, type) - 返回含部位耐久的敌人（野外人物/野兽/秘境守卫共用）

### B4 修复
- 敌人 30% 概率攻击出战灵兽（`attackTarget = this.allyBeast`）
- 灵兽倒下退出本场，人不死亡
- 灵兽经验由 battle._checkEnd 内结算，app 不再重复调用 `onBeastBattleEnd`（防止双倍经验）
- 灵兽技能名映射伤害类型：冰/冻→pierce，火/炎→blunt，风/刃→slash

### 血量体系与战斗入口矩阵（v12.7 单一权威链路）

**三层模型：**

| 层 | 字段/位置 | 职责 |
|---|---|---|
| 出战斗权威值 | `currentCharData.health`（0~100，maxHealth 恒100） | 场外唯一血量权威：客栈 restAtInn +40%上限（app.js:1067）/ 灵泉 useSpring 全恢复（app.js:1325）/ 秘境陷阱扣减（app.js:6906、:6909）/ naturalRecovery 每日恢复（time-system.js:370）/ reward-service r.health 奖励（reward-service.js:98-102）；状态栏❤️血量条显示（仙侠.html:252-256 + updateCharacterStatus app.js:5122，与战斗内「血量」同源同名） |
| 战斗中态 | `Entity.physiology.bloodVolume`（百分比制100；野兽×1.5 battle.js:330；亡灵/构装体=0 改用 integrity battle.js:334-339） | 死亡判定 checkDeath（battle.js:752）；意识阈值 <20 压意识（physiology-config.js:40）；伤口出血载体（EXTERNAL_BLEED_DAMAGE_FACTOR 0.055，battle.js:977） |
| 部位耐久 | `Entity.durabilities` / 面板镜像 `bodyDurability`（22部位各100，initBodyDurability battle.js:116） | 要害 head/neck/chest/brain 归零即死、丹田归零不死亡；v12.4 要害倍率作用层 |

**单一权威链路：** 场外恢复/伤害 → 只动 health → 进战斗 `buildPlayerBattleEntity()`（app.js:3628）：health→bloodVolume（clamp 0~100，缺失按100）+ `_playerPhysiology` 伤口始终载入 + `_savedDurabilities` 耐久延续 → 战斗中只动 bloodVolume/durabilities → 出战斗 `closeBattle` 写回 bloodVolume→health（app.js:2803）→ 读档 `applyFullGameState` 将 playerPhysiology.bloodVolume 一次性同步到 health（game-state.js:857）；战败获救 `handleDefeatRevival` 满血 cd.health=100（app.js:5595）；神魂重塑 reshapeBody 满血（soul-state.js:171/:182）。

**丹药语义（保持不变）：** useItem 的 `hp_recovery`/`health_recovery` → `restoreBodyDurability()`（inventory.js:309/336），恢复的是**部位耐久**而非血量，属「疗伤」设计定稿。

**战斗入口矩阵（v12.7 起全部走统一 helper）：**

| 入口 | 典型调用方 | 玩家实体构建 |
|---|---|---|
| `openBattleWithEntity(entityArg?)` | 地图攻击按钮 / 秘境守卫（app.js:6886）/ 心魔战（cultivation.js:926）/ 势力刺客（faction-invasion.js:28）/ 竞技场（arena-system.js:72）/ 野兽伏击（randomMap.js:500） | buildPlayerBattleEntity()；entityArg 归一化写入 currentInteractionEntity（window 属性 + 词法 let 双同步）；敌方 `_isArenaOpponent` 标记透传（app.js:3748） |
| `globalStartBattle(typeOrData)` | 旅行风险事件（travel-system.js:641）/ 任务·训练木人桩等（typeOrData 字符串映射） | 同一 helper |

**修复前历史问题（防回归对照）：**
① 主入口每次构建全新实体 → 地图/秘境/竞技场战斗满血满耐久，伤势仅 globalStartBattle 路径延续；
② 无伤掉血不延续（原逻辑仅 wounds.length>0 才载入生理快照）；
③ 三处调用方传参被无参签名静默丢弃——竞技场对手变成上一次交互残留实体、心魔战裸对象在 data.attrs 处 TypeError、势力入侵刺客数据无效；
④ closeBattle 不写回 + 状态栏无血量条 → 客栈/灵泉/陷阱操作无人读取的僵尸字段。

### 敌人类型差异化（v12.8 第一批）

**五AI行为**（enemyTurn 参数化分派：partPool/playerTargetBias/healBloodThreshold/guardChance，公共攻击路径）：

| aiBehavior | 部位池 | 自救门槛 | 特性 |
|---|---|---|---|
| aggressive 狂战 | head/chest/neck（30%全随机兜底） | 血量<25 | 多目标选玩家0.5 |
| balanced 稳健 | brain/chest/dantian/abdomen（原行为） | 血量<40 | 基线 |
| defensive 守御 | 同 balanced | 血量<40 | 血量<55且无流血→35%🛡️凝神防御：下玩家一击×0.6后消耗 |
| opportunist 游斗 | 目标耐久最低3部位随机 | 血量<40 | 制造部位残废；生成时灵巧+15% |
| poisoner 用毒 | 同 balanced | 血量<40 | 命中附加毒素 |

**毒素循环**（激活休眠字段 `physiology.poisonLoad`，initPhysiology 补 0）：poisoner/亡灵尸毒命中上毒 add=(6+level)×(1-poisonRes/100)（combat-stats.js:119 毒抗实装）；每回合 tick（battle.js `_tickPoisonLoads`）：painLoad+⌈load×6%⌉、有血者血-load/25、undead 跳过/construct 扣 integrity/elemental 扣 health、load-4 衰减；解毒丹 detoxify 清零自动生效。

**生理类型特有机制**：construct `_hardenedCharges=2` 受击×0.75消耗一层；beast 猛扑首击×1.3命中才消耗；elemental 冰(命中置 _chilledNext→目标下一击命中-10)/火(painLoad+8)；一次性标记均"命中才消耗"。

**生成器**（generateRandomEnemy）：人形六亚型加权表——山贼马匪(狂战·钝)/刀客刀匪(稳健·切)/游侠刺客飞贼(游斗·刺·灵巧+15%)/邪修魔修(狂战·切)/毒师蛊修(用毒·刺)/武僧护法(守御·钝)；rawType elite→「精英·」六维+10%、boss→「魔头·」+15%+1层硬化；返回新增 subtype 字段。非人形行为映射：undead=狂战+尸毒、construct=守御、beast=狂战、elemental=稳健。

**生成器**（generateRandomEnemy）：人形六亚型加权表——山贼马匪(狂战·钝)/刀客刀匪(稳健·切)/游侠刺客飞贼(游斗·刺·灵巧+15%)/邪修魔修(狂战·切)/毒师蛊修(用毒·刺)/武僧护法(守御·钝)；rawType elite→「精英·」六维+10%、boss→「魔头·」+15%+1层硬化；返回新增 subtype 字段。非人形行为映射：undead=狂战+尸毒、construct=守御、beast=狂战、elemental=稳健。

**第二批9亚型（v12.9）**：血修blood(命中吸血30%)/体修body(反震20%不连锁)/音修sound(lv≥4，neuralShock+灵抗减免——激活预留字段 spiritResist，走既有昏迷链)/幻术师illusion(lv≥5，迷扰≤2层每层命中-15)/遁修escapee(残血遁逃→noSpoils胜利：无尸体无奖励不计击杀，app.js 多点守卫)/采补邪修essence(lv≥5，摄取玩家真气转气血)/蛊婆gu(毒×1.5+金蚕蛊每回合啃非致命部位耐久-3)/剑修sword(暴击+12%、第3有效挥击×1.25)/叛门弟子renegade(仅 discipleState.isInSect 进池)。附带修复：`_consumeFormationBuff` 原以 Battle 身份裸调必抛错被吞——阵法增益从未实际消耗，现守卫调用玩家实体。

**技能化重构（v13.0/v13.1 绝技系统）**：机制不再焊死在亚型上——`COMBAT_ABILITIES` 注册表（window.COMBAT_ABILITIES 只读，battle.js 顶部）承载9项可学绝技+4项种系天生（hardened/pounce/chill/burn）；人形亚型=身份模板+`sig`招牌技+共享池按等级加权随机抽取；全部战斗钩子经 `Entity.hasAbility(id)` 判定，玩家与敌人共用同一数值。玩家侧：权威值 `currentCharData.combatAbilities`（GameState collect/apply 持久化），buildPlayerBattleEntity 透传进战斗实体；学习渠道=秘籍研读（items-extended/14-ability-manuals.js，useItem `learn_ability` 效果键）/会技之敌12%掉对应秘籍（loot-system.js）/流浪修士传授（tradeSkillWithWanderer 三分支）；接触钩子 `_applyContactEffects` 无阵营门控，攻防完全对称；遁术使 battleFlee 基础率0.5→0.72。**货架投放（v15.1）**：秘籍(subtype:'manual')被 pushItem 统一闸挡在城市通用货架外；功法阁(art)为正店——RARE保底1本+35%追加高阶、价×1.5；黑市(special)仅EPIC+、40%空手、至多1本、价×3；境界门 RARE←炼气/EPIC←筑基/LEGENDARY←金丹（MANUAL_SHELF_RULES/MANUAL_QUALITY_REALM，enhanced-shop.js），不足不上架。**队友绝技（v15.2）**：PartyMember.combatAbilities（随 xianxia_party_data 整包持久化）为队友侧权威值，传授源=玩家 currentCharData.combatAbilities 直接传授（escape 除外）；Battle 构造器包装成员实体时透传 combatAbilities，钩子对称生效；drain_qi 门控放宽至队员（真气直写 _partyMemberRef.qi）。**藏经阁目录（v15.7）**：SECT_SPECIFIC_ARTS 已覆盖全部36派×三档108门。

## 2.2 inventory.js - 背包系统

### INVENTORY_CONFIG
INITIAL_SLOTS: 30, MAX_SLOTS: 99, COPPER_PER_SLOT: 10
CATEGORIES: ['all', 'weapon', 'armor', 'accessory', 'consumable', 'material', 'secret_art', 'quest', 'currency']

### inventory对象
```javascript
{
    slots: [ItemInstance|null, ...],  // 背包格子
    maxSlots: 30,
    currency: { copper: 100, spiritStones: 10 }
}
```

### ItemInstance类
uid, templateId, count, durability, customProps
addCount/removeCount - 堆叠管理
getTemplate() - 获取物品模板

### 核心函数
initInventory(startItems) - 初始化
addItem(templateId, count) - 添加(支持堆叠)
removeItem(uid, count) - 移除
useItem(uid) - 使用(丹药/符箓/功法书/食物/特殊物品，支持扩展效果类型)
equipItemFromInventory(uid) - 从背包装备
unequipItemToInventory(slotId) - 卸下装备
updateEquippedStats() - 更新装备属性缓存
getFinalAttributes(baseAttrs) - 含装备加成的最终属性
getCombatBonuses(baseBonuses) - 战斗属性加成
filterInventory(category) - P0分类筛选，设置 inventory.filter 并刷新UI
updateInventoryUI() - 刷新UI（支持 filter 过滤显示）
updateCurrencyUI() - 刷新货币显示
saveInventory()/loadInventory() - localStorage存取（B1：标题页不再自动 loadInventory，避免未选角串档）
openShop(shopType) - 打开商店
buyFromShop(itemId, price) - 购买
generateLoot(enemyLevel, enemyType) - 战斗掉落(v5.1扩展：4种敌人类型+稀有度分级)
applyBattleLoot(loot) - 应用掉落
restoreBodyDurability(amount) - 恢复耐久

### 全局变量
learnedSecrets - 已学功法列表
equippedStatsCache - 装备属性缓存

### v10.0~v10.5 背包增强（2026-08-24 补录）
- **搜索/品质筛选/排序**：inventory.searchQuery / qualityFilter / sortMode；setSearchQuery()、getFilteredSlots() 统一过滤管道（[inventory.js:524](js/inventory.js:524)）
- **收藏保护**：物品可收藏，批量出售跳过收藏项
- **showItemMenu 增强**：来源提示、已拥有数量合计（[inventory.js:793](js/inventory.js:793)）
- **装备对比弹窗 showEquipmentCompareDialog（v12.5）**：物品菜单装备类加「📊 对比」→ 与 window.currentEquipment 同槽位（template.slot）逐属性对比，attrs+combatBonus 合并汇总，差值绿(+)/红(−)/灰(±0)；同槽无装备时 showMessage 提示
- **标记出售数量对话框** showMarkForSaleQuantityDialog（v10.5，[inventory.js:930](js/inventory.js:930)）
- **购买数量选择对话框** showBuyQuantityDialog（商店增强，[inventory.js:1668](js/inventory.js:1668)）

## 2.3 equipment.js - 装备与功法

### skillPages - 59个功法(老10页×5 + 第11页方向秘艺9门)
每个功法: id, name, icon, type, grade, desc, effect, element, qiCost（element 为第八十一波元素标记：五行词表内，装备时过灵根门槛、打坐时定主修元素）

### equipmentSlots - 12个槽位
头部/颈部/身体/腰部/手部/脚部/主手/副手/戒指1/戒指2/饰品1/饰品2

### skillSlots - 3个运功栏（v9.4 改为三槽）
skill_main(内功)/skill_身法(身法)/skill_绝技(绝技)

### currentEquipment - 当前装备状态
### currentSkills - 当前运功状态
### skillBrowsePage - 功法浏览页码

### 函数
getSkillPage(index)/getTotalSkillPages()
equipItem(slot, item)/unequipItem(slot)/getEquippedItem(slot)
getAllEquippedItems()
equipSkill(skillId, slot)/unequipSkill(slot)
findSkillById(skillId)

## 2.4 crafting.js - 合成系统（v5.0 全面重写）

### CRAFTING_CATEGORIES
pilfer(炼丹), forging(锻造), talismans(符箓), herb(草药加工), food(烹饪)

### CRAFT_QUALITY
FAIL(失败), POOR(劣质x0.8), NORMAL(普通x1.0), GOOD(优良x1.3), EXCELLENT(杰出x1.5)

### 配方（v5.0 全部使用扩展材料ID）
**2026-10-03 复核实测：`crafting.js` 四个真实配方数组合计 40 条**（`pilferRecipes` 18 + `forgingRecipes` 8 + `talismanRecipes` 6 + `foodRecipes` 8 = 40，与 §5.1 第 30 条口径一致）。
**炼丹配方（`pilferRecipes`，**18** 条，原写 17 已过时）：** 小还丹/大还丹/回春丹/九转还魂丹/生生造化丹/补气散/聚气丹/回灵丹/凝元丹/培元丹/筑基丹/金丹丹/洗髓丹/**绷带**/**高级绷带**/止血丹/解毒丹/辟谷丹
**锻造配方（8种）：** 玄铁剑/青钢剑/霜月剑/云纹甲/龙鳞甲/御剑/干将剑/屠龙刀
**符箓配方（6种）：** 火球符/雷击符/护身符/传送符/天雷符/净化符
**烹饪配方（`foodRecipes`，**8** 条，原写 4 已过时）：** 灵米饭/参汤/灵芝粥/仙露茶/**培元丹/筑基丹/凝元丹/结婴丹**

### 函数
checkMaterials(recipeId) - 检查材料（使用window.itemById查找）
consumeMaterials(recipeId) - 消耗材料（支持堆叠扣减）
addResultItem(itemId, count) - 添加产物（B2：走 `window.addItem`，真气从 `charData.qi` 扣，不再从DOM读取）
calculateSuccessRate(recipeId) - 成功率计算（基础70%+技能加成，最高95%）
executeCrafting(recipeId) - 执行合成（真气扣减+材料消耗+品质随机+时间推进）
finishCrafting(result) - 合成完成回调
getRecipesByCategory(category) - 按分类获取配方
renderCraftingUI(category) - 渲染合成界面（含材料不足检测）
openCraftingUI(category) - 打开合成面板

## 2.5 enhancement.js - 强化系统

### ENHANCEMENT_TYPES
STRENGTHEN(强化属性), REFINE(精炼随机属性), ENCHANT(附魔特殊效果), BREAKTHROUGH(突破品质)

### QUALITY_LEVELS - 6级
common(凡品x1.0), uncommon(良品x1.3), rare(珍品x1.6), epic(极品x2.0), legendary(仙品x2.5), mythic(神品x3.0)

### enhancementRecipes
各等级强化所需材料和成功率

### 函数
getEnhancementLevel(item)/calculateSuccessRate(type, level)
checkEnhancementMaterials()/consumeEnhancementMaterials()
performEnhancement(type)/enhanceSuccess()/enhanceFailure()
getEnhancementInfo(item)/updateEnhancementUI()/openEnhancementUI()

## 2.6 cultivation.js - 修炼系统（含 v9.5 灵根核心 + v9.7 突破系统）

### 熟练度系统
proficiencyData - {skillId: {level, exp, name}}
initProficiencyData()
breakthroughProficiency(skillId) - 突破熟练度
trainProficiency(skillId, amount) - 训练

### 领悟系统
enlightenmentPoints - 领悟点数
triggerEnlightenment() - 触发领悟

### 灵根系统核心（v9.5 批次D，并入本文件；D3元素被动不采用）
isHeavenlyRoot(roots) - 单灵根>80% 为天灵根
getDominantRoot(roots) - 返回 {element, value}
getTechniqueAffinity(roots, techniqueElement) - 灵根/100 适配度
getCultivationSpeedFromRoots(roots, techniqueElement) - 0.5 + 灵根/100（中性取平均）
calculateCultivationExpFromRoots(charData, baseExp) - baseExp × rootSpeed × 天灵根1.2
  - 接入：app.js cultivationMeditate 用 rootExpBase 替代固定30

## 2.7 quest-system.js - 任务系统

### 任务类型 (QUEST_TYPES)
MAIN(主线), DAILY(日常), COLLECTION(收集), COMBAT(讨伐), RANDOM(随机), SECT(门派)

### 任务状态 (QUEST_STATUSES)
AVAILABLE(可接取), ACTIVE(进行中), COMPLETED(已完成), TURNED_IN(已交付)

### 任务优先级 (QUEST_PRIORITIES)
LOW(普通), MEDIUM(重要), HIGH(紧急), CRITICAL(主线), URGENT(紧急)

### 任务数据
mainQuestChain - 5个主线(仙路初启→炼气筑基→首次猎妖→筑基成功→名扬九州)
dailyQuestPool - 4个日常(晨练修行/采集灵药/切磋武艺/清理山贼)
collectionQuests - 收集任务(灵药/矿石)
combatQuests - 讨伐任务(剿灭匪患/妖兽危机)

### playerQuestProgress
activeQuests[], completedQuests[], dailyResetTime, totalCompleted

### 函数
initQuestSystem()/saveQuestProgress()
acceptQuest(questId)/turnInQuest(questId)
updateQuestObjective(questId, objectiveType, extraData)
getActiveQuests()/getCompletedQuests()/getMainQuests()/getDailyQuests()
findQuestById(questId)
showQuestPanel()/updateQuestUI()

### 任务追踪系统（v10.0 新增，2026-08-24 补录；注意实际路径为 js/quest/quest-system.js）
- `_trackedQuests`：最多同时追踪 1主线+2支线；toggleTrackQuest 切换
- `updateQuestTracker()`：刷新主界面追踪栏；接取/完成/交付后自动刷新
- 任务项元素带 ★追踪 按钮（createQuestItemElement）
- 追踪状态经 StateRegistry('questTracker') 进入统一存档（v12.1）
- initQuestTracker 于 app.js DOMContentLoaded 阶段初始化

## 2.8 event-system.js - 奇遇系统

### EVENT_TYPES - 12种
TREASURE(宝箱), MASTER(高人), DUNGEON(秘境), BATTLE(战斗), HERB(灵药), TRAP(陷阱), SPIRIT(精怪), ARTIFACT(法宝), TEACHING(顿悟), CURSE(诅咒), BOSS(Boss), NATURE(自然)

### EVENT_RARITY - 5级
COMMON(50%), UNCOMMON(30%), RARE(15%), EPIC(4%), LEGENDARY(1%)

### randomEvents - 预定义事件
event_old_chest(古朴宝箱), cave_discovery(山洞秘宝)
event_mysterious_old_man(神秘老人), event_immortal_sage(仙风道士)
event_secret_realm(秘境之门), event_spirit_herb(千年灵芝)
event_trap_illusion(幻术陷阱), event_spirit_fox(九尾灵狐)
event_enlightenment(天道顿悟), event_boss_demon_king(妖王现身)
event_spirit_source(灵泉发现)

### eventHistory / eventFlags

### 函数
initEventSystem()/saveEventFlags()
setFlag(flagName)/hasFlag(flagName)/removeFlag(flagName)
triggerRandomEvent() - 5%概率触发
showEventDialog(event)/handleEventChoice(eventId, choiceId)
getEventHistory(limit)/clearEventHistory()
enterSecretRealm() - 优先 openDungeonEntrance('ruin') 进入完整副本；无则回退随机秘境事件
startSecretRealmBattle() / applyTreasureRewards() / learnRandomSkill()

## 2.9 time-system.js - 时间系统

### TIME_PERIODS - 9个时间段（v26.2 实测；原写8个已过时）
late_night(子时0-6), dawn(黎明6-7), morning(上午7-11), noon(中午11-13)
afternoon(下午13-17), dusk(黄昏17-19), evening(晚上19-21), night(深夜21-23), midnight(午夜23-24)

每个时间段有bonus: cultivation/gathering/combat/shopDiscount等

### SEASONS - 4季
spring(春: gathering+20%, cultivation+10%), summer(夏: firePower+15%, recovery+10%)
autumn(秋: combat+10%, beastHunt+15%), winter(冬: defense+10%, qiRetention+15%)

### gameTime
totalMinutes(默认360=6:00), currentDay, currentHour, currentMinute
currentSeason, currentMonth, currentYear

### ACTION_TIME_COSTS - 行为耗时定义
shop_buy: 5min, alchemy_craft: 15min, inn_rest: 120min
training_combat: 60min, cultivation_meditate: 120min
teleport: 15min, tavern_drink: 30min, spring_bathe: 60min
map_move: 10min, battle_normal: 30min...

### 函数
initTimeSystem()/saveGameTime()/resetGameTime()
advanceTime(minutes, actionName) - 推进时间并触发日/月/年事件
  - B3：recoveryMinuteAcc 累加器，不足1小时不刷完整小时恢复（12次×5分钟≈1次恢复）
  - v12.5：单次推进≥120分钟时追加「⏰ 时间流逝了X小时」长行动反馈消息
  - 每小时：hourlyPhysiologyRecovery() + **hourlyRecovery(_playerEntity)**（v9.5 G）
getCurrentPeriod()/getCurrentPeriodName()/getTimePeriodBonus()/getSeasonBonus()
naturalRecovery() - 自然恢复
hourlyPhysiologyRecovery() - 伤口凝血/稳定度/血量/疼痛/部位耐久+1
onNewDay(oldDay, newDay):
  - resetDailyQuests()
  - naturalRecovery()
  - claimDailyIncome(true)  // 自动每日收入
  - shopManager.refreshAllInventory()  // 商店每日刷新+限时特供
  - B3：调用 `timeSystem.onNewDay` 钩子 + 订阅者 + GameEvents.emit('newDay')
onNewDaySubscribe(fn) - 注册每日事件监听
getAbsoluteDay() - 返回 `gameTime.currentDay`（统一日期入口）
onNewMonth()
getCultivationSpeedBonus()/getGatheringBonus()/getCombatBonus()
performAction(actionKey, callback) - 带耗时的行为
getActionTimeCost(actionKey)/getActionName(actionKey)

### 玩家 Entity 引用（v9.5 G）
window._playerPhysiology - 战后生理延续（原有）
window._playerEntity - 战斗结束/closeBattle 写入，供 hourlyRecovery 读取

## 2.10 party-system.js - 队伍系统

### PartyMember类
属性/装备/功法/关系/战斗状态/绝技（v15.2：`combatAbilities` 数组，COMBAT_ABILITIES 注册表id权威值，随 xianxia_party_data 整包持久化）

### FORMATIONS - 6种阵型
standard(标准), attack(攻击), defense(防御), speed(速度), heal(治疗), sacrifice(牺牲)

### 函数
recruitNPC(npcId)/removeMember(memberId)/setLeader(memberId)
changeFormation(formationId)/getFormationBonuses()
usePartyInBattle(battle)/equipMember(memberId, slot, item)
teachSkillToMember(memberId, skillId)/restMember(memberId)
getPartyTotalPower() - 最多4名队员
showPartyPanel() - 显示队伍管理面板（v9.10.1：改为通过switchPanel('party')作为标准面板显示，不再直接创建独立panel）
teachAbilityToMember(memberId, abilityId)/getTeachableAbilities(memberId) - v15.2 绝技传授（源=玩家 currentCharData.combatAbilities 直接传授不耗物品；escape 不入传授池；showMemberAbilityModal/doTeachAbilityToMember 面板与入口）

### UI集成
- 左侧导航栏添加"👥 队伍"入口项（data-panel="party"）
- 主内容区添加 panel-party 容器，遵循与其他面板一致的切换模式

## 2.11 location-system.js - 城市/建筑系统

### 16个城市及其设施
### enterCity(cityName)/getCurrentLocation()
### showTeleportUI()/teleportToCity(cityName)

## 2.12 travel-system.js - 旅行系统

### 8种旅行方式（2026-10-03 复核实测；原写「4 种」已过时）
`TRAVEL_METHODS`（`js/travel-system.js:5`）共 8 键：`WALK`(步行120min) / `HORSE`(骑马60min) / `MULE_CART`(驮车) / `FLOAT_SWORD`(御剑20min) / `TELEPORT_ARRAY`(传送阵5min) / `VOID_STEP`(虚空步) / `RAINBOW_LIGHT`(虹光) / `LAW_TELEPORT`(法则传送)

### 旅行风险事件
境界要求检查, 风险事件触发

## 2.13 building-effects.js - 建筑效果系统

### buildingEffectsRegistry - **12 处直接赋值登记**（2026-10-03 复核实测）
> **2026-10-03 修订**：原写「由各建筑 `register*` 写入，14 处登记」——两处都错。
> 全仓 grep `registerBuildingEffect` / `register*` **零命中**；真实机制是 `js/building-effects.js` 里 12 行 `buildingEffectsRegistry['x'] = {...}` 直接赋值。
> 本节 12 与 §5.1 第 30 条「12种建筑效果」**一致**（原写的 14 是唯一错的一处）。
shop, alchemy, forging, quest, inn, training, teleport, tavern, cultivation, spring, temple, **market**
> ⚠️ 原写末位 `blackmarket` 也不存在；真实第 12 项是 `market`（`:760`）。

## 2.14 npc-system.js - NPC完整系统（js/npcs/npc-system.js，**实测 5207 行 / 7 个类**，原写「约3540行」已过时、上一轮标的「5208 行」已再漂 1 行，2026-10-03 复核）

### 工具函数
clamp/randomChoice/deepMerge

### 深谈大类定义（DEEP_TALK_CATEGORIES，`npc-system.js:95`）
**8 个深谈大类**（2026-10-03 复核：`:95-110` 区间内 8 个带 `id:` 的一级项，与原文一致）；**「47 个子选项」本轮无法判定**（子选项分散在各分类内且有运行时合并，未逐条数）。每个含 minAffection/affectionCost。

### 深谈2.0：分支对话树定义（DEEP_TALK_BRANCHES）
为3个核心NPC定义分支对话树，每个分支树含多个节点（intro/trust_path/respect_path/secret_hint/end等），每个节点有NPC文本+2-3个玩家选择，每个选择有不同效果（好感/信任/敬重/秘密解锁）

| NPC | 分支树 | 触发条件 | 节点数 | 秘密解锁 |
|-----|--------|----------|--------|---------|
| 清虚道人(mentor_01) | 话题 > 过往经历 | 好感≥20 | 5个节点 | mentor_secret_01（魔教圣女情缘） |
| 灵素(healer_01) | 话题 > 烦恼心事 | 好感≥40 | 6个节点 | healer_secret_01/02（身中奇毒） |
| 铁山(warrior_01) | 话题 > 吐槽抱怨 | 好感≥20 | 6个节点 | 无（触发委托任务） |

### 职业特有交互（OCCUPATION_SPECIFIC_ACTIONS）
10种职业绑定实际action函数

### NPC类（完整）
四轨关系/记忆系统/压力系统/特质系统/大五人格/序列化

### NPCManager类
NPC增删查/对话/送礼/AI调度/序列化

### DialogueSystem类
对话树/分支对话

### 其他类
AffectionSystem/NPCQuestSystem/NPCEventSystem/NPCRequestSystem

### 对话面板函数
- showNPCDialog(npcId)：主面板（头像/信息/关系条/打招呼/职业交互/深谈大类）
- showSubCategoryDialog(npcId, categoryId)：子选项展开（⚠️标记+软限制 + 秘密对话选项显示）
- executeDeepTalkSubOption(npcId, categoryId, subOptionId)：执行（分支检测 → 秘密对话检测 → 真实处理器 → 通用对话）
- getDeepTalkResponse(npc, categoryId, subOptionId, insufficientAff)：对话响应（负面对话/低好感回复/正常回复）
- getGreeting/getFarewell/executeOccupationAction

### 深谈2.0新增函数
- showBranchDialog(npcId, categoryId, subOptionId, branchKey)：分支选择对话UI（显示NPC文本+2-3个选项按钮+效果提示）
- handleBranchChoice(npcId, categoryId, subOptionId, branchKey, choiceIndex)：处理分支选择（应用效果/记录后果/推进节点/秘密解锁）
- executeSecretDialogueOption(npcId, categoryId, subOptionId)：执行秘密对话选项（根据好感度不同反应/好感变化）
- recordChoiceConsequence(npc, branchKey, nodeId, choiceIndex, effect)：记录选择后果（_choiceHistory/记忆印象/解锁检查）

### 初始化
initNPCSystem() / addSampleNPCs()→从SPECIAL_NPC_DATA加载
resetNPCSystem() → 重置NPC管理器后调用addSampleNPCs() + registerAllSectNPCs()（确保门派内院面板「👥 门派弟子」列表不为空）

### window导出（15+个）

## 2.15b poison-system.js - 毒术系统（v9.5 批次F2）

### POISON_TYPES
weak_poison / medium_poison / strong_poison（reqSkill 0/30/60，材料用现有 mat_*）

### 函数
detoxify(entity) - 毒术×0.5 清除毒素层数；完全清除时移除 poison 状态
craftPoison(poisonType) - 检查毒术门槛与材料，消耗后 addItem 毒药
getPlayerSpeechDiscount() - 返回价格乘数（口才100→0.8，最低0.5）

### 加载
仙侠.html 第6层：status-effects.js 之后、time-system.js 之前

## 2.15 status-effects.js - 状态效果系统

### StatusEffectTypes
BUFF, DEBUFF, CURSE, BLESSING, POISON, DISEASE, STUN, SLEEP, ROOT, SILENCE, BLEED, BURN, FREEZE, CHARM, FEAR, RAGE, SHIELD, REGEN, CRIT_UP, DODGE_UP

### StatusEffect类
name, type, duration, effects, description, icon, rarity, stackable, maxStacks

### PresetStatusEffects
增益: 生命再生(每回合+10HP), 暴击强化(+20%暴击), 身法灵动(+15%闪避), 护体金光(吸收30伤害), 狂暴(+50%攻击-20%防御)
减益: 中毒(-5HP/回合), 流血(-8HP/回合), 燃烧(-10HP+降防), 冰冻(无法行动), 眩晕(1回合), 睡眠(受击醒), 定身(无法移动), 沉默(无法技能), 魅惑(攻击队友), 恐惧(-20%全属性), 诅咒(永久), 祝福(永久)

### StatusEffectManager
activeEffects Map<entityId, Map<effectName, StatusEffect>>
addEffect/removeEffect/reduceStack/getEffect/getAllEffects/hasEffect/clearAllEffects
tickAll()/getStatBonuses(entityId)
serialize()/deserialize()

## 2.16 achievement-system.js - 成就和任务系统

### Achievement类
id, name, description, category, requirements, reward, icon, rarity, points
complete()/applyReward()

### Task类
id, name, description, type, objectives, rewards, status

### 预设成就
first_blood(初次胜利), level_10(初窥门径), level_50(登堂入室), collector(收藏家)...

## 2.17 map-markers.js - 地图标记系统

### MarkerTypes
LOCATION, NPC, SHOP, QUEST, DUNGEON, TREASURE, DANGER, TELEPORT, LANDMARK, PLAYER, VISITED, UNLOCKED, LOCKED

### MapMarker类
id, name, position, type, icon, color, description, visible, clickable, unlockCondition

### MapMarkerManager
addMarker/removeMarker/getMarker/getVisibleMarkers
selectMarker(markerId) - 选中标记；若 type===DUNGEON：
  - dungeon_cave → openDungeonEntrance('cave')
  - dungeon_mountain → openDungeonEntrance('mountain')
  - 其他 → openDungeonEntrance('ruin')
renderMarkerList(containerId) - 列表UI，秘境项显示 [秘境]/进入

### 预设秘境标记
dungeon_cave(幽暗洞穴), dungeon_mountain(仙山秘境)

### 故事线v2（v12.6 重写）
js/npcs/storylines-v2/batch1.js — 直接以 NPC_PERSONAL_EVENTS 格式新写五段线（相遇→交集→秘密→抉择→终章）：
- 第一批：清虚道人 mentor01_event_1~5 / 灵素 healer01_event_1~5 / 铁山 warrior01_event_1~5（各5事件共15条）
- 规范：每段=场景描写+NPC台词+2~3选项；第3段 effects 返回 secretId 解锁秘密；第4段不可回头抉择并 recordStorylineChoice 记录选择（localStorage xianxia_storyline_choices）；终章 _dynamicScenes 按第4段选择双分支收尾、无 autoTrigger 仅手动
- 链式顺序复用 isChainHead（ID序号）；自动弹出复用 maybeAutoTriggerPersonalEvent（greet 源包装 getGreeting、daily 源 onNewDaySubscribe；第1段 random 0.4、2~4段 0.3）
- 秘密定义写入 special-npcs.js 三NPC secrets 字段，batch1.js injectStorylineSecrets 幂等注入实例（包装 getPersonalEventButtons 前置调用）
- 终章动态渲染：包装 triggerPersonalEvent，触发前执行 _dynamicScenes() 重写 scenes

### 任务目标标记联动（v12.5）
syncQuestTargetMarkers() - 遍历 playerQuestProgress.activeQuests → QuestRegistry 取 objectives，
  type='visit' 且有 location/locationName/locationId 的目标按名称与现有标记模糊匹配（精确→互相包含），
  匹配到则注册 🎯 标记（id=quest_target_<questId>_<objIndex>，组 quest_targets）；无地点字段或地图无对应点则跳过
removeQuestTargetMarkers(questId) - 交付后移除该任务全部目标标记
接入：quest-system acceptQuest 成功后 sync；turnInQuest 成功后 remove+sync

## 2.18 enhanced-shop.js - 增强商店系统

### Shop类
id, name, owner, location, type(general/weapon/armor/alchemy/book/special)
inventory[], priceMultiplier, priceFluctuation, merchant(reputation/discount/creditLimit)
specialFeatures, customPrices, refreshInterval, unlockCondition
_basePriceMultiplier - 基准价倍率（季节波动用）
specialGoods[] - 当日限时商品

### 函数
getItemPrice(item)/sellItem(item, quantity)/buyItem(itemId)
  - v9.5 F3：口才折扣 = 口才/5 %（getPlayerSpeechDiscount 或内联 lifeSkills['口才']）
refreshInventory() - P1每日刷新：
  - 按季节调整 priceMultiplier（春丹药/草药0.85，秋0.9，冬1.1，夏兵器1.05）
  - 清除旧 limited 商品，随机加入最多3件限时特供
  - 特供池：筑基丹/精铁/灵草/回春丹/玄铁剑/修为丹
openShop(shopType)/showShopDialog(shop)

### ShopManager
shops Map, addShop/getShop/removeShop
refreshAllInventory() - 遍历全部商店 refreshInventory，提示限时特供
refreshAllPrices()

### PresetShops
万宝阁/神兵阁/玄甲铺/炼丹房/藏经阁

## 2.19 sects-system.js - 门派系统（v10.3 晋升重做）

### 加入/退出门派
### 弟子职位系统
### 门派任务系统
### discipleState
### 灵兽系统（v7.1 驯服/骑乘；v17.1 绝技传授+个体天赋；v17.3 逻辑收口；第八十四波 扩展层断线全接通；第八十五波 逻辑收口与残留清理；第八十六波 散修寻兽录·分布表死账清偿；第八十七波 兽径手记·栖息地靠打听；第八十八波 兽栏同栖录·放生/小名/魂印；第八十九波 翅膀与甲壳·坐骑是真脚力；第九十波 骑乘参战·驮你入阵与落马账）
> **第八十四波 扩展层收口**：生态六类非战斗增益改读 tamedBeasts 真源（旧读全库无人写过的 spiritBeasts 字段恒 0）；13 兽分布表接入 randomMap 真生成（三成兽遇出名种，收服桥名字精确命中）；兽潮「遭遇更密、收服略易」两条牌面话真兑现（密度上浮+收服+5%/稀有度级）；进化线 evolve 有真按钮（蜕变带一次变异机会，阶段增益并入生态口径、变异×1.5 持久化）；伤势真账（战倒力竭→拒出战→丹药/静养疗伤）；繁育接通（同线成年配对、特性过户真身、孤儿账当场销、三十日冷却、灵石500双写）；喂食灵草双 id 合一（野外 mat_spirit_grass 可喂）；传授谢师礼改走 DataManager 双写。详见文末补录。
> **v17.1 改良**：参战数据补 `physiologyType:'beast'` 与 `combatAbilities`（物种天生技 innate ∪ 已传授绝技）——灵兽从普攻挂件变为带技作战单位；个体天赋四选一（驯服 roll，主属性×1.12）；喂食灵草×2=好感+8经验+15，好感三档缩放出战六维；绝技传授=玩家已掌握+物种白名单+好感≥60+灵石300+每兽2门上限；满百羁绊开战反哺主人体质+3。
> **v17.3 逻辑收口**：捕捉双入口加境界压制（模板境界高出玩家两大境即拒捕，神话级必须先胜后服且境界够格）；风之精粹入 EXTENDED_LOOT_TABLES.beast.rare 补齐风狼王进化链产出；骑乘陪伴好感+2。
> **v17.1 改良**：参战数据补 `physiologyType:'beast'` 与 `combatAbilities`（物种天生技 innate ∪ 已传授绝技）——灵兽从普攻挂件变为带技作战单位；个体天赋四选一（驯服 roll，主属性×1.12）；喂食灵草×2=好感+8经验+15，好感三档缩放出战六维；绝技传授=玩家已掌握+物种白名单+好感≥60+灵石300+每兽2门上限；满百羁绊开战反哺主人体质+3。
### 派系与事件（v16.3-v16.4；v18.0 副职业删除；v18.2 bonds 退役收官；v18.3 旁观者插话；v18.6 工坊折扣；v18.7 入门收官）
> **v18.2 关系网收口**：npcRelationships 为唯一读写真源——serialize 删 bonds 兜底输出、deserialize 载入即 migrate 转换（旧档三代自然消化）、getNPCRelationship/Network/事件宿敌扫描/亲友引荐全改新源遍历（RELATION_TYPES 补 rival）；syncNPCRelationships 垫片化仅保留迁移语义。
> **v18.3 旁观者插话**：深谈成功后25%概率，同场随机他者经 showMessage 插入氛围短评（BYSTANDER_LINES 三档：关系≥40打趣/高开放搭腔/低开放冷言）。**铁律：#socialReplyBox 为文本缓冲重绘式，注入内容必须走 showMessage 通道，元素直插会被抹除。**
> **v18.6 门派工坊折扣**：锻炉/符纸坊/淬毒房使用发放 `_craftDiscountUntil`（8小时窗），getCraftCostMul()（crafting.js 模块级导出）使合成灵石需求与强化 needS ×0.6；连带修复 canAffordEnhance 的 costCopper→costGold 字段笔误死层。
> **v18.7 门派入门收官**：`sect-join-flow.js` 统一真实职位ID（4内门/5外门/6记名/7杂役，修复0/1误发掌门/副掌门）；补齐大旗门等8派共16个缺失考核处理器；为此前通用/空白的14派增加单问式特色考核；蓬莱/天山改读 `spiritualRoots/mutatedRoots` 权威字段；守卫路由只认显式配置，未知项回退通用评估。
> **v18.2 关系网收口**：npcRelationships 为唯一读写真源——serialize 删 bonds 兜底输出、deserialize 载入即 migrate 转换（旧档三代自然消化）、getNPCRelationship/Network/事件宿敌扫描/亲友引荐全改新源遍历（RELATION_TYPES 补 rival）；syncNPCRelationships 垫片化仅保留迁移语义。
> **D2 门派每日事件**：`SECT_EVENTS`（sects-deep-data.js，13派×4条）+ 通用引擎 `window.maybeSectDailyEvent/chooseSectEvent`（sects-deep-ui.js）——每日首次 updateSectUI roll 50%，未抉择挂起重弹，效果词表=贡献/积分/声望/物品/tempBuff/本派声望。武当原版三死函数已摘除（sectName 笔误致从未触发）。
> **D3 丐帮净衣/污衣两派制（v16.4，仅丐帮启用·用户定案）**：`ds._gbFaction={side,joinedPeriod,paidThroughPeriod,violations,buyMarks,...}`；净衣=进身礼钱包灵石800+旬捐200/期（欠缴三级链：提醒→训话降袋→除名贬污衣），特权=入帮授内门四袋+折抵贡献1:1每期200+晋升贡献×0.7+人脉事件选项；污衣=免费立誓守三戒（v1 接购物标记 buyMarks，抽查满3触发三级责罚），待遇=消息网65%+请益×1.5；转派代价对称。其余门派 factions 维持展示。
### 晋升系统（v10.3；v16.0 师徒收口）
> **v16.0 师徒**：拜师面板增「请益」（半时辰，`_masterBlessDay` 使当日下一次藏经阁参悟×2，用后即耗）/「出师」（条件=本派任一功法大成，贡献+200声望+10，不进黑名单）；离师入 `_leftMasters` 该师父永不再收（通用 deep-ui 与武当专属双入口守卫）；joinSect 叛离分支为世界反应链——旧派声望-40+全派NPC仇恨+30+叛师者自动入册。
- `promoteDisciple()` 委托给 `window.showSectRanks()`（sects-deep-ui.js）
- 旧晋升逻辑（贡献+境界双条件）已删除
- `updateSectUI()` 晋升按钮对侍妾(-1)和同参弟子(-2)隐藏

## 2.20 sect-facilities.js - 门派设施系统（v11.1 修复；v15.4 藏经阁；v15.5 世界反应式；v15.8-15.9 专属设施全覆盖；v16.1 设施升级线）
> **v16.1 F3 门派修葺**：`FACILITY_UPGRADES` 五座可扩建（演武/洞府/医馆/藏经阁扫阁/议事厅），Lv2贡献300/Lv3=800，长老(rank≤2)在掌门大殿「🏗️修葺」定夺；`facilityState.levels` 入快照持久化、resetFacilityState 跨天保留（曾漏字段致修葺丢失+升级崩溃双缺陷）；效果经 `effectiveActions()` 逐级累加 mod 进真实动作值（skillBoost/restoreQi/addPoints/spendContribution负向=降诊金/addInfoChance），配额类（兵器库份例/掌门晨课）不参与扩建。
> **v16.2 生理分型免疫矩阵（battle.js `_applyContactEffects`）**：毒/灼痛仅血肉(humanoid/beast)；亡灵免活人毒但受摄魂音；构装体/元素免毒免痛免摄魂免迷魂；冰元素免寒气、火元素免灼烧；首次免疫以世界观文案点破（`_immuneLog` 防刷屏）。生成器 elementType 先定类型后命名，禁从展示名反推。
> **v15.8 门派专属设施**：`SECT_FACILITY_EXTRAS[门派名]` 与基础7设施同 schema，`visibleFacilities()` 按所属门派叠加（access/useFacility/渲染/校验四触点）；新动作 `tempBuff`（六维effects+durationHours）经 window.applyBuff 入 activeBuffs，buildPlayerBattleEntity 聚合使其真实进战斗六维；rewardMaterials 支持 action.items 主题化配比。**v15.9 第二批补齐：36派全覆盖**——参禅悟道×8/淬体炼身×9(含泰山十八盘道)/采集产出×5/领料制造×3/耳目情报×3/轻身提气×4/书香文修×3/医香×1，限次设施均带制度缘由叙事文案。
> **v15.5 设计宪法（强制规则.md 同款）**：先合乎逻辑再谈平衡——`dailyUses` 仅限制度性限次（须配叙事理由，如兵器库配给制），无配额设施不写计数、UI 显示"随时可用"；医馆诊金走新动作类型 `spendContribution`；掌门大殿为**世界反应链**样板：晨课受贺→再闯守卫劝返→三闯以冒犯尊长论处（轰出+罚贡献10×递增+禁足30分）屡犯加重（trackVisits 隐藏计数驱动）；拒绝文案一律世界叙事（"库吏摆手…"），禁止"次数用完"系统腔。
> **v15.4 藏经阁·分层阅览体系**：四层楼制按职级准入（一层≤7杂役/二层≤5外门/三层≤4内门/四层镇派≤3亲传，低职级可见不可入）；SECT_SPECIFIC_ARTS 重构为 tier/bonus/copyPrice/wuxingReq 三层目录（16派已铺，余待批次二）；三交互=翻阅(30min解锁)/参悟(每日每书1次·真气20·感悟=层基数×递减速率max(0.1,1-m/100)×神识系数·威力按掌握度%发挥)/请抄本(贡献价不绕职级门)；掌握度存 discipleState.artInsights（GameState 既有路径），加成经 getSectArtAttrBonuses() 注入 buildPlayerBattleEntity；设施卡「📖阅览」独立入口；拜师不送功法（两处 skill_06 硬编码删除）。

### B3 修复清单
| 修复项 | 说明 |
|--------|------|
| B3-1 设施使用游戏时间 | 冷却从 `Date.now()` 改为 `gameTime.totalMinutes`，每日重置从 `new Date().toDateString()` 改为 `gameTime.currentDay` |
| B3-2 真气从角色数据读写 | 真气读取/修改从 `document.getElementById('qi-text')` DOM 操作改为 `currentCharData.qi` 直接读写 |
| B3-3 设施效果结构化 | 从自由 `effects` 字段改为有限 `actions: [{type, value}]` 动作类型，启动时 `validateFacilities()` 校验未知动作 |
| B3-4 议事厅固定结果 | 70%无结果修复：固定门派好感 +1 + 消耗30分钟，30% 概率追加随机情报 |
| B3-5 设施状态进入GameState | `facilityState` 通过 `getFacilityStateSnapshot()` / `loadFacilityStateFromSave()` 进入统一存档 |

### 设施动作类型注册表（VALID_ACTION_TYPES）
| 类型 | 效果 |
|------|------|
| `restoreQi` | 恢复真气（操作 `currentCharData.qi`） |
| `spendQi` | 消耗真气（检查 `currentCharData.qi`） |
| `skillBoost` | 技能提升（操作 `combatSkills`） |
| `restoreHealth` | 恢复部位耐久（调用 `window.restoreBodyDurability`） |
| `addPoints` | 增加修炼领悟（操作 `discipleState.points`） |
| `addSkillExp` | 增加技能经验（提示，待技能经验系统接入） |
| `rewardMaterials` | 领取物资（调用 `window.addItem`） |
| `addRelation` | 增加门派好感（操作 `discipleState._sectRelation`） |
| `addInfo` | 获取情报（概率触发，chance 字段控制） |
| `advanceTime` | 推进游戏时间（调用 `window.timeSystem.advanceTime`） |

### 7种设施
| 设施 | actions | rankReq | dailyUses | cooldownMinutes |
|------|---------|---------|-----------|-----------------|
| 演武场 | spendQi:10, skillBoost:+2(5技能), advanceTime:30 | null | 3 | 60 |
| 修炼洞府 | restoreQi:50, advanceTime:60 | null | 5 | 120 |
| 医馆 | spendQi:20, restoreHealth:100, advanceTime:30 | null | 2 | 60 |
| 藏经阁 | spendQi:30, addPoints:10, addSkillExp:5, advanceTime:60 | 4(内门以上) | 1 | 240 |
| 兵器库 | spendQi:50, rewardMaterials, advanceTime:30 | 3(亲传以上) | 0(∞) | 1440 |
| 议事厅 | addRelation:+1, advanceTime:30, addInfo:0.3 | null | 5 | 60 |
| 掌门大殿 | advanceTime:15 | 5(外门以上) | 1 | 1440 |

### 设施状态（基于游戏时间）
```javascript
let facilityState = {
    lastResetGameDay: 0,           // 上次重置的游戏天数
    dailyUsage: {},                // { facilityId: 今日使用次数 }
    cooldownUntilMinute: {},       // { facilityId: 冷却到哪个游戏分钟 }
    lastUsedGameMinute: {}         // { facilityId: 上次使用的游戏分钟 }
};
```

### 保存/加载接口
- `getFacilityStateSnapshot()` → 供 `GameState.collectFullGameState()` 调用
- `loadFacilityStateFromSave(savedState)` → 供 `GameState.applyFullGameState()` 调用
- `resetFacilityState()` → 供 `GameState.resetWorldForNewGame()` 调用（新游戏重置）

### 职位要求
- `rankReq: null` 表示不限职位（禁止使用 rankReq: 0，因为0代表掌门）
- 比较逻辑：`playerRank > rankReq` 时拒绝（数值越小职位越高）

### 启动校验
- `validateFacilities()` 在 `openFacilityUI()` 时自动调用
- 检查：所有设施必须有 `actions` 数组、每个 action 必须有 `type`、所有 type 必须在 `VALID_ACTION_TYPES` 中、禁止 `rankReq: 0`

## 2.21 野外地图（wild-terrain.js + randomMap.js，v20.56 重做）

### 2.21.1 wild-terrain.js - 地形生成器（纯函数、种子确定、可在 node 验收）
IIFE 暴露 `window.WildTerrain`：
- `TERRAIN`：**25** 种地形（2026-10-03 复核实测 `wild-terrain.js:18-46` 逐条点数；原写 24 已过时）{name, base/accent 色, moveCost(刻), passable, qi(灵气系数), kind}
  通用 12：PLAIN/FOREST/MOUNTAIN/SNOW/FROZEN/WATER(不可通行)/FORD/DESERT/SWAMP/VOLCANO/SPRING/ROAD(0.5刻)
  独有 12（v20.60，SIGNATURE_LANDFORMS 一地一貌，只在属地图上长）：南疆 MIASMA 瘴沼 /
  西漠 OASIS 绿洲+QUICKSAND 流沙 / 北冥 GLACIER 冰川+CREVASSE 冰隙(不可通行) / 蜀地 SWORDTOMB 剑冢 /
  中州 OLDFIELD 古战场 / 东荒 PRIMFOREST 荒古林 / 东南海域 WRECK 沉船+WHIRLPOOL 漩涡(不可通行) /
  灵界 QIPOOL 灵池 / 魔界 BONEFIELD 骨原
- `REGION_PROFILES`：九大地区（含灵界/魔界）风貌参数 sea/mount/forest/cold/arid/swamp/volcano/spring/rivers/roads/tint
- `createSeededRandom / hashStringToSeed`：Mulberry32 种子随机
- `generate({seed,region,rows,cols,landmarks,resources,dungeons})` → `{grid,pois,start,ok,stats}`
  流程：分形值噪声(高度/湿度/温度三场) → 阈值分层 → 多数表决平滑×2 → 灵泉(灵气场峰值)
  → 河流(高处下行) → carveSignatures 独有地貌(按 where 安土长片, 冰隙漩涡会切地皮) → bridgeIslands 跨海礁路 → largestComponent 主陆 → POI 落位(只落主陆)
  → carveRoads 古道连 POI(穿水成浅滩) → 验收(POI 全可达 + 连片度≥0.8)，8 个盐次取最优
- `findPath(grid,from,to)`：Dijkstra，按地形 moveCost 加权 → `{path,cost}` | null
- `passable(cell)` / `floodFill(grid,start)` / `largestComponent(grid)`
- POI 类型：town 村镇 / market 坊市 / cave 洞府 / ruin 遗迹 / landmark 图鉴地标 /
  spring 灵泉 / resource 资源点 / dungeon 秘境入口 / ferry 渡口(v20.59: waterside 摆位,
  必临水, 海区两处内河一处; carveRoads 锚点带上渡口)

### 2.21.2 randomMap.js - 野外地图状态/渲染/交互
MAP_CONFIG：ROWS 20, COLS 26, CELL_SIZE 40, VIEWPORT 9×16（SVG viewBox 640×360）
BUILDINGS：TOWN/MARKET/CAVE/RUIN（语义常量；地形表在 WildTerrain.TERRAIN）
REGION_ALIASES：地图地区 ↔ 资源点/秘境表的 region 叫法对齐（空数组视为未配置，退回本名）

状态：currentMap(格: terrainKey/terrain/qi/deco/elev/entities/fog/poiId/node) / playerPos /
viewportOffset / currentPois / wildTravel(寻路预览) / wildState{regions:[地区差量]}

迷雾三态：fog 0 未知 / 1 已见(记忆,变暗) / 2 可见；
`revealAround` 先把旧可见降为已见再点亮新视野；半径随地形(山地3.6/密林1.9)+天象(雾/雷雨-0.8)+夜(-0.5)
建图 `buildWildMap(region)`：WildTerrain.generate → 落格 → scatterGatherNodes(采集节点,
NODE_BY_TERRAIN 按地皮定品类——林泽/雪原/水域/平原=药草、山漠火山=矿苗、灵泉=灵机之物(💠)；
  池取 REGION_FEATURES resources.herb/mine/special，itemById 真源就绪时筛掉空名目（采了必有货），
  采后 regrowDay=+3~6 日) → scatterEntities(野兽循栖息地密度,
人循道途聚落; 亡灵/构装体/元素归为怪物; 兽/人名字按 HABITAT_FLAVOR×REGION_WILDLIFE 随地皮取,
entity 记 habitat) → 起点安全区净空 → applyWildState → revealAround
交互：
- `onCellClick(x,y)`：迷雾未探明→提示；相邻→stepTo；远格→findPath 出预览(虚线框)，
  侧栏「出发(N步·约X时辰)」→ `confirmTravel` 逐格走，途中 rollWildEncounter(基础5%，
  夜+6%，雷雨/雾+2%) 触发即打断行程并开战；撞上谁由脚下地皮说了算——道上多遇人，
  水泽/火山必是活物，名字从当地名录抽（v20.57）
- `stepTo`：advanceTime(moveCost×10×weatherTravelMul×seasonTravelMul)，moveCost≥2 再扣 1 精力；
  落格即结环境账 applyTerrainHazard（v20.58：TERRAIN_HAZARD 沼泽瘴气/火山灼气/雪线冻土寒气/
  荒漠暑渴/浅滩湿寒，夜 ×1.5、雨雪天瘴气 ×1.3、境界减免每境 6% 封顶六成，中招真扣气血/精力/真气，
  侧栏脚下挂 ⚠️ 提示）；日常事件(dailyEvents.wilderness)与奇遇(3%)与旧版同源
- 野兽追击 `tryBeastAmbush`：相邻野兽 30%(夜+15%) 扑入玩家格并 openBattleWithEntity
脚下动作 `poiAction(act)`（右侧栏事件委托 data-act，不内联 onclick）：
- gather 采集→addItemToInventory(按钮按品类叫名：药草/矿石/灵机之物) + 节点枯竭 / rest 打尖(4时辰, 灵石3, 没钱睡柴房恢复减半)
- shop→openCityShop('general') / cultivate→startCultivation / explore→exploreLandmark(地标)
  或就地翻遗迹(35% 惊醒守护兽) / spring 汲灵(灵气×20 真气) / meditate 打坐(灵气×8 真气)
- harvest→ResourcePoints.harvest(本门产地) 或暗采(40% 被看守撞见开战) / dungeon→DungeonDynamic.enter
- ferry 雇舟(v20.59)：站渡口列出已见过的其他渡口(ferryOptions，未见过不上船)→ ferryTravel(id)
  扣船钱 5 灵石、结行程 30+曼哈顿距离×20 分钟、水路遭遇按 WATER 地皮单独 roll 一次、直达对岸
足迹(v20.59)：markPoiVisited/poiIsVisited —— 亲脚到过的地物在差量档记 visited{poiId:1}，
  图上画金环(#fde68a 外圈)、侧栏记「已至 · N 格」、跨存档保留
渲染（v20.56 舆图化：不画格线）：drawWildCell 底色取 smoothShadeField 平滑明度场（邻格融色不逐格跳）；
  地形交界只画 wavyEdgeD 弯曲晕染（宽淡+窄实两道，水岸用浅沫色），不描方块边；古道按四邻连成
  roadConnectorD 连续线（FORD 也续线）；drawPoi(分类配色, 秘境脉冲)；drawEntities(仅可见格)；
drawPlayer(脉冲光圈)；drawPathPreview；drawTimeWeatherOverlay(昼夜色调 + 四时罩层(春嫩/夏暖/秋赭/
冬灰, 冬日无雪也飘雪沫) + 雨雪雾粒子)；drawMapDress(舆图题跋：图名随地区+地区首字小印+罗盘指北+
外粗内细边框，pointer-events:none 且一律 path 画线——「方块零描边」是格线门禁)；drawPoi 已见(fog=1)
地标留灰字名；独有地貌各有手绘印(瘴雾浮动 wild-miasma / 剑气闪烁 wild-swordqi / 漩涡旋转 wild-whirl)；
updateMinimap(#wild-minimap 全图小地图 + 视口框)；renderWildSidebar(四季/天时/脚下/动作/已见地标/图例)
地皮咬合战斗(v20.60)：TERRAIN_BATTLE_MODS 逐格攻防速闪修正（沼泽拖足 dodge-12/speed-15、
  剑冢借势 attack+12、荒古林 dodge+12/attack-10、古道 defense+5、平地无修正）——经 WildGround
  (window.WildGround 显式导出) 由 getCombatBonuses 并入玩家战斗数值，openBattleWithEntity 开场
  用 battleNote 说一句利害；本地活物不吃这亏，只有玩家吃
存档：`StateRegistry.register('wildMap')` export/import/reset —— 每地区一份差量
{fog:520字符, dead:{uid}, gathered:{'x,y':regrowDay}, px, py}；读档按种子重生成地形后回填，
战死(尸首)由 syncDeadUids 在渲染时记入；旧档无此键自然跳过，无需迁移
导出：window.openWildernessMap / initRandomMap / renderMap / closeRandomMap / travelToRegion /
getCurrentCellEntities / tryBeastAmbush / isEntityDead / onCellClick / buildWildMap / saveWildState /
wildMapApi{confirmTravel,gotoPoi,poiAction,gatherWildNode,stepTo,revealAround,...} / getMapSeed / setMapSeed
`regenerateMap` 已无意义（一域一图，重开会回到同一片山河）→ 只提示不重掷；`generateSeededMap`
保留为兼容包装（返回 WildTerrain 网格）

========================================
【三、app.js主逻辑详解】========================================
【三、app.js主逻辑详解】
========================================

## 3.1 全局状态

### gameLog - 全局日志
entries[], maxEntries: 100
add(message, type)/clear()
自动显示到#game-log容器

### gameState - 全局状态对象
player, inventory, equipment, skills, quests, party, sects, location, time, events, achievements, bodyDurability

### 模块级变量
rootValues[5] - 灵根值
selectedGender - 性别
currentCharData - 角色数据
saveSlots[] - 存档列表

## 3.2 角色创建

selectGender(gender) - 选择性别
generateAttributeInputs(category, containerId) - 生成属性输入框
initRootSystem() - 初始化灵根滑块
collectCharacterData(name) - 收集角色数据
startGame() - 开始游戏
backToCreation() - 返回创建

## 3.3 灵根系统

segments/handles/inputs/mutThunder/mutWind/mutIce
拖拽滑块联动数字输入
变异灵根: thunder(金灵根>0可选), wind(木灵根>0可选), ice(水灵根>0可选)

## 3.4 游戏世界初始化

populateGameWorld(charData) - 填充面板
- 渲染主要属性/战斗技能/生活技能/灵根
- 渲染战斗属性(combatStats)
- 渲染回避优先级(avoidancePriority)
- 初始化状态栏(精力/真气/心情/境界)
- 初始化躯体耐久(bodyDurability)
- 初始化门派UI

renderBodyDurability() - 渲染部位耐久列表+SVG
updateBodySVG() - 更新SVG颜色(getDurabilityColor)
renderAvoidancePriority() - 渲染回避优先级(可上下移动)

## 3.5 面板切换

switchPanel(panelId) - character/equipment/inventory/skills
- character: switchSubTab('status') + renderBodyDurability()
- equipment: renderEquipmentPanel() + updateEquippedStats()
- inventory: updateInventoryUI() + updateCurrencyUI()
- skills: updateCultivationUI()

switchSubTab(subId) - status/attributes/relations/karma

## 3.6 地图交互

selectProvince(name) - 高亮省份
selectCity(cityName, provinceName) - 选择城市
selectSect(name) - 选择门派
renderFacilitiesList(containerId, facilityIds, type) - 渲染设施列表
renderSectFacilitiesList(sectName) - 渲染门派设施

executeFacilityAction(action, type) - 调用window[action]()
executeSectFacilityAction(action, sectName) - 门派设施

## 3.7 城市设施函数

CITY_FACILITIES - 15种设施:
shop→openCityShop, auction→openAuctionHouse, alchemy→openAlchemyRoom
forging→openForgingShop, quest→openQuestHall, inn→restAtInn
training→startTraining, teleport→showTeleportUI, tavern→visitTavern
cultivation→startCultivation, spring→useSpring, temple→visitTemple
arena→enterArena, gathering→gatherHerbs, blackmarket→openBlackMarket

### restAtInn()
消耗10灵石, 推进时间480min（8小时住宿）, 恢复health/qi/energy到上限
- 城市休息加成（getCityBonus().recovery）
- 5%奇遇触发
- 重伤需医馆/药物，休息不自动治愈（B5）

### startTraining()
消耗20精力, 获得10-19经验, 时间+60min, 检查升级

### startCultivation()
显示修炼界面(打坐/突破)
### cultivationMeditate()
消耗20真气（半小时）, 获得30*季节bonus*变异灵根bonus*结拜bonus 修炼经验
- **v10.3.1 BUGFIX**：函数开头同步 `currentCharData = window.currentCharData`，修复存档加载后局部变量未同步导致真气检查误判"真气不足"
- 雷灵根修炼+15% / 风+10% / 冰+20%（getRootMutationBonus）
- 结拜 getBondBonuses().cultivation（每条+15%）
时间+120min, 5%奇遇

### useSpring()
完全恢复, 时间+60min

### visitTemple()
祈福祷告/寺中静修, 时间+30/60min

### visitTavern()
消耗20铜钱, 30%奇遇, 听情报, 时间+30min

### showTeleportUI()/teleportToCity(cityName)
消耗100灵石, 时间+15min, 10%奇遇

### openCityShop()
显示坊市界面, 购买调用buyFromCityShop()

### buyFromCityShop(itemId, itemName, price)
扣除灵石, 添加物品到背包, 时间+5min, 5%奇遇

### openAlchemyRoom()
显示炼丹界面, craftPill(index)炼制

### craftPill(index)
消耗真气, 调用executeCrafting(), 时间+配方耗时

### openForgingShop()
调用openEnhancementUI()

### openQuestHall()
动态获取任务(getMainQuests/getDailyQuests), 时间+5min
### acceptQuestFromHall(questId)
调用window.questSystem.acceptQuest()

### openBlackMarket()
黑市交易界面

## 3.8 存档系统

saveGame() - 存档：每个存档槽 `{meta, state}` 完整世界状态（B1）
- 优先调用 `GameState.collectFullGameState()` 收集所有子系统数据
- 同名角色覆盖最近槽，最多10个存档
- 兼容旧 `xianxia_save` 独立键

exportSave() - 导出完整 state 为 .sav 文件
importSave(event) - 导入并包装为 `{meta, state}` 格式
loadSaveSlot(index) - 加载存档（优先 `slot.state`，回退扁平摘要）
loadSaveData(saveData) - 恢复所有系统数据
- 优先 `GameState.applyFullGameState()`（0 值用 nullish 保留）
- 子系统写回独立键兼容旧模块

refreshSaveSlots() - 刷新存档列表UI（兼容 v3 `{meta,state}` 和旧扁平摘要）
showSaveToast(msg) - 显示保存提示
deleteSave() - 删除所有存档 + `GameState.clearCharacterStorage()` 清角色键

## 3.9 战斗系统

getPlayerTotalDura(durabilities) - 计算总耐久
updateBattleUI() - 更新战斗UI(总耐久+日志+人体视图)
closeBattle() - 关闭战斗

toggleBattleBodyView()/toggleEnemyBodyView()/switchBodyView(target)
updateBattleBodyView() - 更新人体SVG颜色

updateEntityMenu() - 更新实体菜单
openInteraction(index)/closeInteraction()/renderInteraction(entity)
- person：对话/详谈；merchant→游商交易；wanderer→切磋/交易功法；攻击
- building：遗迹→秘境入口；洞府→修炼；坊市/城镇→交易
interactBuilding(name) - 按建筑类型分发（秘境/修炼/交易/休息）
interactTalk() - 优先 showNPCDialog；地图临时人物创建临时NPC

openBattleWithEntity() - 构建Entity实例, 创建Battle；野兽追击也会调用
showBattleUI() - 显示战斗UI(部位按钮)
battleAttackPart(partId)/battleFlee()

## 3.10 装备与功法

renderEquipmentPanel() - 装备栏+运功栏+功法浏览
renderSkillBrowse() - 功法翻页显示
prevSkillPage()/nextSkillPage()
equipSkill(skillId)/unequipSkill(slotId)/unequipItem(slotId)

showTooltip(content) - 属性说明提示框

## 3.11 新系统集成

initNewSystems() - 初始化location/travel/quest/event/time/party系统
showCityTravelUI() - 城市旅行UI
useBuildingEffect(buildingId, action)/openBuildingUI(buildingId)
addItemToInventory(templateId, count) - B2：委托 `window.addItem`，不再空壳检查 window.inventory.addItem
openCraftingUI(category) - B2：调用 `_openCraftingUIImpl`（crafting.js 真实实现）
openCultivationUI() - B2：调用 `_openCultivationUIImpl`（cultivation.js 真实实现）
openShop(type) - B2：调用 `_openShopImpl`（inventory.js 真实实现）
openEnhancementUI() - 委托 enhancement.js 的 openEnhancementHall
buyFromShop(itemId)/performBreakthrough()
acceptQuest(questId)

## 3.12 P2-P3新功能（前提计划 v4.0 已全部落地）

### P0 核心体验
filterInventory(category) - 背包分类筛选（inventory.js）
showNPCDialog(npcId) - NPC对话面板+好感度条（npc-system.js）
getAffectionLevelInfo(affection) - 好感等级 陌生人→道侣

### P1 深度功能
talkToNPC(npcId) - 对话，好感-1~+3，时间+15min，刷新对话面板
giveGiftToNPC(npcId) / confirmGiftToNPC(npcId, slotIndex, gain)
  - 打开可赠物品列表；丹药+8/功法+20/灵石+3/默认+5
claimDailyIncome(silent) - 基础50金+10灵石，门派+20灵石，境界加成；按游戏日去重
mineOre() - 耗15精力+30min；产出 mat_iron_ore(80%)/mat_five_element_essence/dragon_bone（B5 兼容 mat_* 格式）
Shop.refreshInventory() - 每日刷新+季节价格+最多3件限时特供
shopManager.refreshAllInventory() - onNewDay 调用

### P2 玩法扩展
#### 野外游商/流浪修士
generateWanderStock() - 日更货架
openWanderMerchant(priceMul=1.2) / buyWanderItem(index, priceMul)
sparWithWanderer() - 切磋开战
tradeSkillWithWanderer() - 80灵石换修炼经验(+可能筑基丹)

#### 副本/秘境
DUNGEON_DEFS: ruin(50灵石/5层), mountain(100/7)  // cave 已移除（实际代码只含2个秘境）
openDungeonEntrance(dungeonId) - 入口UI（消耗/进度/层数）
enterDungeon(dungeonId) - 扣灵石，从 dungeonProgress 续关
exploreDungeonFloor() - v10.0 起为12种加权事件池（v12.5 重调占比：战斗38/宝箱采集25/陷阱20/灵泉恢复9/功法奇遇8）：
  combat30/elite_combat8(3层+)/treasure10/rare_treasure7/herb_garden5/treasure_map3/trap12/magic_trap8(3层+)/
  spirit_spring5/spring_echo4(灵泉回响·纯真气恢复·新v12.5)/inscription4/broken_art4(残破功法·60%概率 KnowledgeSystem 听闻级功法·新v12.5)；
  通关奖励；可退出保留进度
入口来源：遗迹建筑、地图 DUNGEON 标记、event enterSecretRealm

#### 道侣/结拜
formBond(npcId, 'dao_companion'|'sworn') - 好感门槛 80/60
getBondStatus(npcId) / getBondBonuses()
  - 道侣：战斗 attack*1.1 defense*1.05（battle.js 已接入）
  - 结拜：cultivation*1.15（cultivationMeditate 已接入）
currentCharData.bonds = { [npcId]: {type, name, since} }

#### 野兽主动攻击
tryBeastAmbush()（randomMap onCellClick 后）
相邻格野兽 30% → 移到玩家格 → openBattleWithEntity

### P3 完善
getRootMutationBonus(statType)
  thunder_power/ice_power 1.3, wind_speed 1.2
  thunder/wind/ice_cultivation 1.15/1.10/1.20
enterArena() - 竞技场（B4修复）
- 每日限5次 + 精力消耗10
- 胜率基于主属性均值+境界层数（非纯55%随机）
- 胜：贡献50+连胜*10，灵石30+连胜*5
- 败：连胜中断，评分-5
- 排名 localStorage
showArenaRanking() / saveArenaRanking(name, sect, score)
openContributionShop() 物品：
  门派功法500 / 高级丹药100 / 门派装备300 / 经验符150 / 聚气丹包80 / 精铁礼盒120
exchangeContribution(itemId, cost)

### 拍卖行
openAuctionHouse() - 拍卖行界面(list/bid)
listForAuction(slotIndex) - 上架物品
bidOnAuction(itemId) - 出价竞拍
定期清理已完成拍卖

### 相关全局导出（app.js 末尾）
talkToNPC, giveGiftToNPC, confirmGiftToNPC, claimDailyIncome, mineOre,
openWanderMerchant, buyWanderItem, sparWithWanderer, tradeSkillWithWanderer,
openDungeonEntrance, enterDungeon, exploreDungeonFloor,
formBond, getBondStatus, getBondBonuses,
enterArena, showArenaRanking, openContributionShop, exchangeContribution,
getRootMutationBonus, openBattleWithEntity, renderInteraction, interactBuilding

## 3.13 初始化

DOMContentLoaded:
- 生成属性输入框
- 初始化灵根系统
- 生成地区列表
- 刷新存档列表
- 初始化所有系统(initInventory/initNPCSystem/initStatusEffects等)
- 加载存档(loadInventory/loadEquipmentData等)
- 延迟初始化新系统(initNewSystems)

========================================
【四、数据访问规则总结】
========================================

| 数据 | 正确访问方式 | 说明 |
|------|-------------|------|
| 角色数据 | window.currentCharData（全局） | 各模块内部用词法变量，通过 `window` 同步；读档时 `Object.assign` 保持引用 |
| 灵石 | DataManager.getSpiritStones()（统一入口） | 同时继承 `inventory.currency.spiritStones` 和 `currentCharData.spiritStones` |
| 铜钱 | DataManager.getCopper()（统一入口） | 同上，双源同步 |
| 精力 | currentCharData.energy 或 DataManager | - |
| 真气 | currentCharData.qi | - |
| 生命 | currentCharData.health | **v12.7 出战斗血量权威值**：进战斗经 buildPlayerBattleEntity 覆盖 bloodVolume，出战斗由 closeBattle 写回；详见 2.1 血量体系小节 |
| 装备 | window.currentEquipment | - |
| 功法 | window.currentSkills | 知识层：`KnowledgeSystem` |
| 时间 | window.timeSystem.gameTime 或 getGameTimeSnapshot() | - |
| 任务 | window.playerQuestProgress | 存档：`exportQuestState`/`importQuestState` |
| 门派 | window.discipleState | 读档时 `Object.assign` 保留引用 |
| 事件标志 | window.eventFlags | - |
| 道侣/结拜 | currentCharData.bonds | - |
| 秘境进度 | currentCharData.dungeonProgress | - |
| 日志 | window.gameLog.add() 或 XianXia.showMessage | - |
| **完整存档** | **GameState.collectFullGameState() / applyFullGameState()** | **B1 新增：统一存档入口** |

========================================
【五、加载顺序（⚠️ v8.5 版章节已滞后，先读 5.0 实测声明）】
========================================

### 5.0 实际结构速览（**2026-10-03 全量实测**：354 个 js 文件 / 351 个 script 标签 / manifest 350 script + 25 层注释）

> **声明**：下方 5.1 的 v8.5 版加载顺序为历史记录，与当前实际有出入（大量文件已移入子目录、v10.0 之后新增的上百个模块未收录）。**权威依据以 `scripts.manifest.json` 的 `entries` 顺序为准**（entries 顺序 = defer 执行顺序 = 仙侠.html 文档顺序），复核命令见 §0.1 第 3 步。
>
> ⚠️ v26.2 已知滞后项（本节未逐条修正，仅标注）：5.1 里的 `sect-wudang-deep.js`（已于 git 历史删除）、`mail-system-styles`（已删）、`profession-system`（v18.0 删）、`enemy-invasion` / `city-life` / `npc-milestones`（从未落地或已删）等条目均为考古记录，**不要照着它们去找文件**。文件是否存在，以 §0.2 的 353 条全量清单为准。

#### 实际目录组织（js/ 下，2026-10-03 全量实测）

**逐个文件说什么职责见 §0.2（354 条全量清单）。**此处只给分层速查——判断一个新文件该挂哪层，看这张表：

```
第0层  vendor/tailwind.js（第三方）· core/error-guard（全局异常兜底，最先）
第0层  global-utils.js（命名空间 XianXia / 统一消息 / 数据访问层）
第0层  core/delegate（事件委托 data-act）· core/empty-state（公共空态件）
第0层  core/balance-config · core/state-registry（存档注册表）· core/panel-lifecycle
第0.5  core/game-state.js（统一存档）· core/difficulty-config · core/action-gates
       core/auto-save · core/continue-save · core/audio-synth · core/satiety · core/mood-system
       core/dao-bridge · core/world-calendar(+ -ui) · core/world-loop · core/keyboard-shortcuts
第1层  data.js · regions.js · sects/sects.js · items.js（核心数据，无依赖）
第2层  npcs/name-generator.js（命名，须在 randomMap/battle 之前）
第3层  physiology-config.js（生理参数）
第4层  map/randomMap + map/wild-terrain · map/world-map · battle.js · loot-system.js
       combat/combat-engine · combat/combat-abilities
物品层 items-extended/01~18（自注册进 window.itemById，另有 items-extended.js 合并器）
第5层  core/knowledge-system → inventory.js → equipment.js
第6层  status-effects · time-system · event-system · crafting(+crafting/*) · enhancement
       · cultivation/* · quest/* · party-system · location-system · travel-system
       · building-effects · achievement-system · map/map-markers · enhanced-shop
       · economy/* · factions/* · gameplay/* · equipment/* · world/solar-terms
NPC层  npcs/*（94 个）+ npcs/storylines-v2/*
门派层 sects/*（44 个）
系统层 extensions/*（30 个）· city-facilities/*（34 个）· endgame/*
主逻辑 app.js（11 738 行 · 2026-10-03 复核，只做转发与面板）
```

**刻意不挂载的 2 个文件**（文件在、标签不在，防误用）：
`items-extended/09-loot-sources.js`（v8.5 起废弃）、`npcs/npc-storylines.js`（v12.6 起废弃）。

#### v10.0~v12.3 期间新增但下文未收录的关键功能（防再次误判缺失）

| 功能 | 位置 | 说明 |
|------|------|------|
| 背包搜索/品质筛选/排序/收藏保护 | inventory.js:37、:524、:607 | searchQuery/qualityFilter/sortMode + getFilteredSlots |
| 物品菜单来源提示+已拥有数量 | inventory.js:793 showItemMenu | v10.0 增强 |
| 标记出售数量对话框 | inventory.js:930 | v10.5 |
| **购买数量选择对话框** | inventory.js:1668 showBuyQuantityDialog | 商店增强 |
| **任务追踪系统** | js/quest/quest-system.js:1049 | 追踪栏+★按钮+StateRegistry存档；initQuestTracker 于 app.js 初始化 |
| **灵兽战斗后收服** | beast-taming.js:475 canCaptureDefeatedEnemy/captureBeastAfterBattle | 战胜界面出收服按钮（app.js 战胜分支） |
| **竞技场真实战斗** | js/gameplay/arena-system.js enterArena | 接 battle.js 回合制（_isArenaOpponent），替代旧胜率结算 |
| 飞鸽传书系统 | js/mail-system.js + js/mail-system-ui.js | v12.0（原 `mail-system-styles.js` 已并入 styles.css 并删除） |
| 拍卖服务/原子交易 | js/economy/* | v12.1 |
| NPC生活系统/借物服务 | js/npcs/npc-life-system.js、npc-borrow-service.js | v11.x~v12.x |
| 门派深层UI | js/sects/sects-deep-ui.js | 晋升面板 showSectRanks 所在（注：原并列的 `sect-wudang-deep.js` 已删除） |
| 死亡仙侠化神魂系统 | js/core/soul-state.js | v12.3.2 |

### 5.1 历史记录：v8.5 版加载顺序（已滞后，仅供考古）

按依赖关系分为14层，共68个script标签（含1个Tailwind CDN + 67个本地JS文件）：

> **注意：** v8.5 已新增 `js/loot-system.js` 作为统一的搜刮/解剖系统核心文件（第3.5层，在 `battle.js` 之后），已废弃 `09-loot-sources.js`。以下为当前加载顺序。

### 第0层：全局工具函数 + 统一存档状态（v7.3 + v9.10 B1）
0. js/global-utils.js → 全局命名空间 XianXia、统一消息系统、数据访问层、工具函数
0.5. js/core/game-state.js → GameState：collectFullGameState/applyFullGameState/resetWorldForNewGame/clearCharacterStorage（B1 新增）
0.55. js/core/difficulty-config.js → 战斗难度条件栏（v12.4；依赖 StateRegistry，须在 game-state.js 后）

### 第1层：核心数据（无依赖）
1. data.js → attributes, combatStats, bodyParts, realmLevels, terrainTypes, buildingTypes
2. regions.js → mapData（**10 地区**）, REGION_FEATURES（**7 地区**）
3. js/sects/sects.js → sectsData, sectPositions, sectsByRegion（注意路径已变更）
4. items.js → ITEM_CATEGORIES, ITEM_QUALITIES, EQUIPMENT_SLOTS, 基础**40** 个物品模板（2026-10-03 复核实测）
   > ⚠️ 原文此处写「基础 61 个 id」，与 §1.4「41 种」自相打架。61 = 40 物品模板 + 11 个 EQUIPMENT_SLOTS 键 + 10 个 ITEM_QUALITIES 键，是全文 `id:` 总数口径，不是物品种数。

### 第2层：命名系统（必须在randomMap、battle之前）
5. npcs/name-generator.js → SURNAMES(100姓氏), GIVEN_NAMES(500名库), generateName

### 第3层：地图与战斗
6. qi-environment.js → 14地点灵气浓度，引导修炼
7. wild-terrain.js → WildTerrain（地形生成器，无顶层全局）→ randomMap.js → MAP_CONFIG, BUILDINGS, REGION_ALIASES, buildWildMap, tryBeastAmbush（TERRAIN 已随 WildTerrain）
8. battle.js → BODY_PARTS, Entity, Battle, generateRandomEnemy

### 第4层：扩展物品
9. items-extended/01-pills.js → 45种丹药
10. items-extended/02-weapons.js → 58种武器（2026-10-03 实测 id 数）
11. items-extended/03-armor.js → 55种防具
12. items-extended/04-materials.js → 50种材料
13. items-extended/05-talismans.js → 20种符箓
14. items-extended/06-arts.js → 47种功法秘籍
15. items-extended/07-food.js → 12种食物
16. items-extended/08-special.js → 12种特殊物品
17. items-extended.js → 合并所有扩展物品到window.allItems等
17.5. items-extended/13-missing-ids.js → 补齐审查报告28个缺失物品ID（B2 新增）

### 第5层：背包与装备
18. inventory.js → INVENTORY_CONFIG, inventory, ItemInstance, initInventory, generateLoot
19. equipment.js → skillPages, equipmentSlots, currentEquipment, currentSkills

### 第6层：核心游戏系统
20. status-effects.js → StatusEffect, StatusEffectManager, PresetStatusEffects
21. time-system.js → gameTime, advanceTime, onNewDay, TIME_PERIODS, SEASONS
22. event-system.js → randomEvents, triggerRandomEvent, EVENT_TYPES, EVENT_RARITY
23. quest/quest-system.js → QUEST_TYPES, mainQuestChain, questSystem, GAME_ENDINGS（**已迁入 js/quest/ 子目录**）
24. crafting.js → CRAFTING_CATEGORIES, 40配方（2026-10-03 实测）, executeCrafting
25. enhancement.js → ENHANCEMENT_TYPES, enhancementRecipes, performEnhancement
26. cultivation/cultivation.js → PROFICIENCY_LEVELS, REALM_UNIQUE_EFFECTS, SKILL_COMBINATIONS, HEART_DEMON_TYPES（**已迁入 js/cultivation/ 子目录**）
27. party-system.js → PartyMember, FORMATIONS, recruitNPC
28. location-system.js → cityData, enterCity, checkAccessRequirement
29. travel-system.js → TRAVEL_METHODS, travel, checkRealmRequirement
30. building-effects.js → buildingEffectsRegistry (12种建筑效果)
31. achievement-system.js → Achievement, Task, 预设成就
32. map/map-markers.js → MapMarker, MapMarkerManager, 预设秘境标记（**已迁入 js/map/ 子目录**）
33. enhanced-shop.js → Shop, ShopManager, PresetShops, 每日限时特供

### 第7层：NPC系统
34. npcs/special-npcs.js → SPECIAL_NPC_DATA (10个特殊NPC)
35. npcs/item-tags.js → ITEM_NPC_TAGS, getItemNPCTags, checkNPCLikeItem
36. npcs/npc-system.js → NPC, NPCManager, DialogueSystem, DEEP_TALK_CATEGORIES, showNPCDialog
37. npcs/data.js → 精简NPC数据

### 第8层：NPC扩展
38. npcs/npc-emotions.js → 5种情绪+主动行为+3种玩家干预（**已迁入 js/npcs/**）
39. npcs/npc-daily-life.js → NPC活动描述+同地互动检测（**已迁入 js/npcs/**）
40. npc-milestones.js → 6个好感度里程碑事件（**已于 v11.6 删除，文件不存在，此条仅为历史记录**）

### 第9层：门派系统
41. sects/sects-system.js → discipleState, joinSect, 门派任务（**已迁入 js/sects/ 子目录**）
42. sects/sect-facilities.js → 门派设施（**已迁入 js/sects/ 子目录**）
43. sects/sect-internal.js → 生成弟子+门派会议（**已迁入 js/sects/ 子目录**）
44. sects/sect-join-flow.js → 门派加入流程（守卫对话/考核/侍妾/问答；v10.2 从第14层移至此以修复加载顺序问题；**已迁入 js/sects/**）
45. sects/dao-companion-deep.js → 道侣主动互动+孤单检测（**已迁入 js/sects/**）

### 第10层：v6.0+ 新增系统
45. reputation-system.js → 城市声望（REPUTATION_LEVELS，见文件本体）
46. factions/factions.js → 5大势力+8级声望（**已迁入 js/factions/**）
47. factions/faction-stance.js → 5势力立场（**已迁入 js/factions/**）
48. enemy-invasion.js → 敌对势力主动袭击（**文件不存在，此条仅为历史规划记录**）
49. profession-system.js → 6副职业（**v18.0 副职业系统已删除，职能并入生活技能，文件不存在**）
50. beast-taming.js → 8种灵兽
51. house-system.js → 5档洞府（ruin破山洞/cave/courtyard/mansion/palace，v26.2 实测；原写4级已过时）
52. weather-effects.js → 7种天气+季节权重
53. world-events.js → 6种世界事件（天降异宝/兽潮来袭/正邪大战/坊市繁荣/灵气潮汐/疫病流行，v26.2 实测；原写5种已过时）
54. city-life.js → 14城市氛围+市民NPC（**未落地：文件不存在，此条仅为历史规划记录**；对应能力由 v21.5 的 `js/npcs/city-residents*.js` + `js/city-facilities/citizen-life.js` 承担）
55. map/landmark-explore.js → 6大地标+探索度（**已迁入 js/map/**）

### 第11层：v7.0 深度扩展
56. quest/scene-performance.js → 场景描写+角色表情+打字机效果（**已迁入 js/quest/**）
57. quest/choice-memory.js → 7组选择+8种统计+NPC引用（**已迁入 js/quest/**）
58. cultivation/cultivation-bottleneck.js → 8境界瓶颈+5种突破方式（**已迁入 js/cultivation/**）
59. ui-immersive.js → 7种特效+伤害数字+获得动画

### 第12层：扩展物品补丁（使用setTimeout延迟合并，依赖各自系统）
61. items-extended/10-crafting-extensions.js → 14个符箓配方（合并到window.allRecipes）
62. items-extended/11-event-extensions.js → 40个扩展奇遇事件（合并到randomEvents）
63. items-extended/12-quest-extensions.js → 主线35步+NPC故事线22个（合并到window.mainQuestChain）

### 第13层：主逻辑与后置系统
64. app.js → 主逻辑(角色创建/面板切换/地图交互/战斗/副本/游商/道侣/钓鱼/二周目等)
65. breakthrough-ritual.js → 5阶段突破仪式+条件检查+异象
66. lifespan-system.js → 9境界寿元+每日更新（patch timeSystem.onNewDay + performBreakthrough）

### 第14层：v9.0 情境引擎 + 第二批设施
67. core/scenario-engine.js → 情境事件链引擎（ScenarioEngine：设施注册/节点管理/条件检查/效果执行/UI面板/存档）
68. city-facilities/facility-batch2.js → 第二批15个设施（13个情境设施：钱庄/契约所/镖局/善堂/斗法台/观星台/碑林/异闻馆/当铺/拍卖行/黑市/园林别苑/新增设施；2个官府基础设施：工曹署/盐铁局）；实际包含13个情境设施+2个官府设施

========================================
【七、计划文档索引】
========================================

| 文档 | 内容 | 状态 |
|------|------|------|
| `../游戏制作/旧计划/主流游戏对比与差距分析.md`（仓库外·已迁出） | 主流游戏横向对比差距分析（2026-08-24）：十大最痛差距+P0~P3优先级路线图，全部结论代码实测验证并附证据索引 | ✅ 已制定 |
| `../游戏制作/旧计划/掉落系统优化计划.md`（仓库外·已迁出） | 战斗掉落系统优化方案v3.0：搜刮/解剖系统 | ✅ 已制定 |
| `../游戏制作/旧计划/物品扩展计划.txt`（仓库外·已迁出） | 305种物品扩展完整实施计划 | ✅ 已制定 |
| `../游戏制作/旧计划/扩展实施方案.md`（仓库外·已迁出） | 物品扩展实施状态追踪 | 🏗️ 实施中 |
| `../游戏制作/旧计划/城市扩展计划.txt`（仓库外·已迁出） | 城市扩展计划 | 🏗️ 已实施 |
| `../游戏制作/旧计划/NPC计划.txt`（仓库外·已迁出） | NPC系统扩展计划 | 🏗️ 已实施 |
| `../游戏制作/旧计划/P0模块扩充计划.txt`（仓库外·已迁出） | P0模块扩充计划 | ✅ 已实施 |
| `../游戏制作/旧计划/深度补全计划.md`（仓库外·已迁出） | 深度补全计划 | ✅ 已实施 |
| `../游戏制作/旧计划/设施与门派实施计划.md`（仓库外·已迁出） | 设施与门派系统重构完整计划（三批次） | 🏗️ 实施中 |
| `../游戏制作/旧计划/第一批实施步骤.md`（仓库外·已迁出） | 第一批核心10个城市设施具体待办步骤 | ✅ 已完成 |
| `../游戏制作/旧计划/情境引擎实施计划.md`（仓库外·已迁出） | 情境引擎文件位置规划 | ✅ 已实施 |
| `../游戏制作/旧计划/设施与门派实施计划.md`（仓库外·已迁出） | 设施与门派系统重构完整计划（三批次） | ✅ 已制定 |
| `../游戏制作/旧计划/第一批实施步骤.md`（仓库外·已迁出） | 第一批核心10个城市设施具体待办步骤 | 🏗️ 实施中（已完成3个原型） |

========================================
【七·附、NPC系统完整文档】（v4.3 历史文档；原编号与【七、计划文档索引】重复，予以区分）
========================================

## 7.1 文件结构
## 7.1 文件结构

`js/npcs/` 下共 **94 个文件**（直接 91 + `storylines-v2/` 子目录 3）。全量职责见 §0.2，此处只列骨架文件（行数为 2026-10-03 复核实测，LF 口径）：

```
js/npcs/
├── npc-system.js        # 5207 行 · NPC本体（7个类，2026-10-03 复核类起始行：
│                        #   NPC:699 / NPCManager:1746 / DialogueSystem:2015 / AffectionSystem:2077 /
│                        #   NPCQuestSystem:2404 / NPCRequestSystem:2449 / NPCEventSystem:2472）
│                        #   + DEEP_TALK_CATEGORIES(8大类) + DEEP_TALK_BRANCHES + OCCUPATION_SPECIFIC_ACTIONS
│                        #   + showNPCDialog / getGreeting / getFarewell / getDeepTalkResponse
├── data.js              # 831 行 · 精简 NPC 数据（SPECIAL_NPC_DATA 主表）
├── special-npcs.js      # 1610 行 · 10 个核心 NPC 详细定义（清虚道人/灵素/铁山/贾有道/玄冰子/
│                        #   柳随风/张大爷/丹大师/铁匠老王/神秘老者）
├── name-generator.js    # 210 行（编辑器口径；LF 口径 209） · SURNAMES(100) + GIVEN_NAMES(500) + generateName
├── item-tags.js         # 139 行 · ITEM_NPC_TAGS / getItemNPCTags / checkNPCLikeItem（送礼偏好）
├── storylines-v2/       # 3 个文件 · v12.6 故事线重写第一批（npc-storylines.js 已废弃，不挂载）
├── <门派>-events.js     # 36 个文件 · 各派恋爱线人物的情缘事件/结局/性别语境
├── {heroine,male-lead}-*.js / jealousy-*.js / duel-showcases-*.js
│                        # 情缘总线：吃醋关系网 / 双人对局四卷 / 集体大戏 / 情敌和解
└── 其余约 45 个         # 人情账(npc-bond) / 黑道账(npc-crime) / 断案钩 / 易容 / 绑架 /
                         # 城中人物(city-residents*) / 族谱(npc-lineage) / 功法传授 等
```

## 7.2 类结构

### NPC类（js/npcs/npc-system.js，原路径 js/npc-system.js 已随 v7.x 迁入子目录）
**基础字段：** id, name, gender, age, appearance, personality, occupation, location

**关系系统：** relationship.affection(-100~100), trust, respect, love, fear, hatred, flags, history

**Phase 1新增字段：**
| 字段 | 类型 | 说明 |
|------|------|------|
| background | object | origin/family/history/goal/secret |
| personalityBig5 | object | openness/conscientiousness/extraversion/agreeableness/neuroticism |
| combat | object | level/realm/layer/attack/defense/speed/skills |
| profession | object | type(level)/specialization |
| preferences | object | likedItems/dislikedItems/giftMultiplier |
| schedule | object | default: [{time, location, activity}] |
| state | object | mood/energy/health/location/currentActivity |
| memory | object | playerActions/impressions/questsGiven |

**核心方法：**
| 方法 | 说明 |
|------|------|
| getDialogue(topic, category?) | 获取对话（支持8种话题+好感度分级） |
| getAvailableTopics() | 获取可用话题列表（受好感度限制） |
| recordPlayerAction(action, result) | 记录玩家行为到记忆 |
| getPlayerImpression() | 获取对玩家的总体印象 |
| updateSchedule(gameHour) | 根据游戏时间更新位置和活动 |
| interact(type) | 执行交互（talk/gift/help） |
| serialize()/deserialize(data) | 存档序列化 |

### NPCManager类（js/npcs/npc-system.js:**1746**，2026-10-03 复核；原写 :466 已过时）
| 方法 | 说明 |
|------|------|
| addNPC(npc)/removeNPC(id)/getNPC(id) | NPC增删查 |
| getAllNPCs() | 获取所有NPC |
| getNPCsAtLocation(loc) | 获取指定位置的NPC |
| talkToNPC(id, topic?) | 与NPC对话，返回结果{dialogue, affectionChange} |
| giftToNPC(id, item) | 给NPC送礼 |
| helpNPC(id) | 帮助NPC |
| updateAll(deltaTime) | 更新所有NPC（状态效果tick+AI日程） |
| serialize()/deserialize(data) | 存档序列化 |

### DialogueSystem类（js/npcs/npc-system.js:**2015**，2026-10-03 复核；原写 :762 已过时)
| 方法 | 说明 |
|------|------|
| startDialogue(npcId, dialogueId) | 开始预设对话 |
| makeChoice(index) | 做选择 |
| registerBranchDialogue(id, tree) | 注册分支对话树 |
| startBranchDialogue(npcId, treeId) | 开始分支对话 |
| getCurrentBranchText() | 获取当前节点文本 |
| getCurrentBranchChoices() | 获取可选分支 |

### NPCQuestSystem类（js/npcs/npc-system.js:**2404**，2026-10-03 复核；原写 :838 已过时)
| 方法 | 说明 |
|------|------|
| registerQuestTemplate(template) | 注册任务模板 |
| getAvailableQuests(npcId, minAffection) | 获取可接取任务 |
| acceptQuest(questId) | 接取任务 |
| completeQuest(questId) | 完成任务 |
| registerDefaultQuests() | 注册5个默认任务 |

### NPCEventSystem类（js/npcs/npc-system.js:**2472**，2026-10-03 复核；原写 :900 已过时)
| 方法 | 说明 |
|------|------|
| checkEvents() | 检查并触发所有事件（**2026-10-03 复核：存在**） |
| triggerConflict(...) | 仇敌同地点冲突（**原写 checkNPCConflicts / checkBreakthroughs / checkDangers 三项全仓 grep 零命中，已过时**） |
| ~~getRecentEvents(count)~~ | **原写的方法全仓不存在，本轮已删** |

### AffectionSystem类（js/npcs/npc-system.js:**2077**，2026-10-03 复核；原写 :775 已过时)
| 方法 | 说明 |
|------|------|
| getLevel(affection) | 获取好感度等级（8级：死敌-100~-50/厌恶-49~-20/陌生-19~0/友好1~20/亲密21~40/喜欢41~60/爱慕61~80/挚爱81~100） |
| getColor(affection) | 获取等级颜色 |
| getName(affection) | 获取等级名称（**2026-10-03 复核：getLevel/getColor/getName 三项均在，`:2090` 起**） |
| ~~renderBar(affection, containerId)~~ | **原写的方法全仓不存在，本轮已删** |

## 7.3 四轨人际关系系统（v3.8新增）
> **v14.9 存储决策**：`npcRelationships` 为关系唯一真源（写入端8处 vs bonds 镜像1处）；serialize 在 npcRelationships 存在时不再输出 bonds 镜像，旧档 deserialize 双读兼容保留；运行时双结构与亲友引荐的 bonds 读取暂留，专项重构待关系网视图批次。

### 四轨定义
| 轨道 | 字段 | 范围 | 说明 | 获取方式 |
|------|------|------|------|----------|
| 好感度 | relationship.affection | -100~100 | 整体情感倾向 | changeAffection() |
| 仇恨度 | relationship.hatred | 0~100 | 敌意程度 | changeHatred() |
| 情分 | relationship.favor | 0~favorMax | 可消耗的情感资本 | changeFavor()/updateFavorMax() |
| 敬畏度 | relationship.respect | 0~100 | 尊重与畏惧 | changeRespect() |

### 关系状态标签（getRelationshipStatus）
| 条件 | 状态 | 标签 | 颜色 |
|------|------|------|------|
| aff≥60 && hat<30 | friend | 至交 | text-green-400 |
| hat≥60 && res<30 | enemy | 死敌 | text-red-600 |
| hat≥60 && res≥60 | fear_enemy | 敢怒不敢言 | text-orange-400 |
| aff≥60 && res≥60 | follower | 追随者 | text-purple-400 |
| aff<20 && res<30 | stranger | 路人 | text-gray-400 |
| res≥60 | awe | 敬畏 | text-yellow-400 |
| 其他 | neutral | 普通 | text-blue-400 |

### 情分系统
- **updateFavorMax()**: 情分上限 = floor((aff+100)/200*50+50)，范围50~100
- **changeFavor(amount)**: 改变情分，范围[0, favorMax]
- **canAffordRequest(cost)**: 检查情分是否足够支付请求
- **executeRequest(cost, effectFn)**: 执行请求并扣减情分

## 7.4 压力与精神状态系统（v3.9新增）

### 状态字段
| 字段 | 范围 | 说明 |
|------|------|------|
| state.stress | 0~100 | 压力值 |
| state.isBroken | boolean | 是否精神崩溃 |
| state.breakType | 'paranoid'/'rage'/null | 崩溃类型 |

### 压力机制
- **addStress(amount)**: 增加压力，≥80时触发崩溃
- **reduceStress(amount)**: 减少压力，<40时恢复
- **triggerMentalBreak()**: 精神崩溃
  - 神经质>60 → 偏执型（hatred+20, mood-30）
  - 否则 → 暴怒型（currentActivity='愤怒暴走'）
- **recoverFromBreak()**: 恢复（mood+20, 清除崩溃状态）
- **dailyStressRecovery()**: 每日恢复5点压力，心情>70额外恢复3点

## 7.5 特质系统（v3.9新增）

### 送礼特质
| 特质ID | 名称 | 送礼倍率修正 |
|--------|------|--------------|
| greedy | 贪婪 | ×0.7 |
| generous | 慷慨 | ×1.3 |
| stoic | 克制 | ×0.8 |

### 请求特质
| 特质ID | 名称 | 成功率修正 |
|--------|------|------------|
| people_pleaser | 讨好型 | +30% |
| stubborn | 固执 | -20% |
| jealous | 嫉妒 | -10% |

### 对话特质
| 特质ID | 名称 | 对话修饰 |
|--------|------|----------|
| poison_tongue | 毒舌 | "（毒舌）"前缀 |
| optimist | 乐观主义者 | "（乐观）"前缀 |
| pessimist | 悲观主义者 | "（悲观）"前缀 |

### 相关方法
- **getGiftMultiplier()**: 计算送礼倍率（基础倍率×特质修正）
- **getRequestSuccessBonus()**: 计算请求成功率加成
- **getDialogueModifier()**: 获取对话前缀修饰

## 7.6 打招呼/告别系统（v3.9新增，v12.0扩展，v14.x 组合式重构）
> **v14.0-v14.3 外层包装（social-content.js）**：window.getGreeting/getFarewell 被最外层替换——dynamicGreeting 五档分支（宿敌冷语→低落关怀→初见打量→秘密默契→心情高涨）→ composeGreeting 组合式引擎（时段桶 dawn/day/dusk/night × 关系层 cold/warm/close × 性格尾缀三层：16型签名句→五维微口吻正交池→A/T修饰→大五兜底）；composeFarewell 同构并复刻原生 recentAction 后缀。下述原生档位池为内层兜底。v15.3 人称经 ta(npc) 输出。

### getGreeting(npc, player) - 核心通用问候
**v12.0扩展**：首次见面加入名气阈值判定，后续见面每档好感度扩展为3-5条随机池

1. **时间维度**: 早安/上午好/午安/下午好/傍晚好/夜深了
2. **好感度维度**（v12.0每档扩展为随机池）:
   - ≥80: 5条随机（"见到你真好"/"今天气色不错"/"正想找你呢"/"你来了我真高兴"/"一天不见就惦记着你"）
   - ≥60: 5条随机（"很高兴又见到你"/"好久不见，近来可好"/"正等着你呢"/"你来了，坐吧"/"最近忙什么呢"）
   - ≥40: 5条随机（"最近怎么样"/"最近在忙什么"/"又见面了"/"你看起来精神不错"/"来，这边坐"）
   - ≥20: 5条随机（"你来了"/"有什么事"/"又见面了"/"有事直说"）
   - ≥0: 5条随机（"有什么事吗"/"找我有事"/"你怎么来了"/"有话直说"/"什么事"）
   - ≥-30: 5条随机（"又是你"/"你怎么又来了"/"你还没走啊"/"有什么事快说"/"阴魂不散"）
   - <-30: 4条随机（"走开，我不想理你"/"别烦我"/"走开"/"滚"）
3. **名气维度**（v12.0新增）:
   - 首次见面按fame阈值：<20不提 → ≥20"略有耳闻" → ≥50"久仰了" → ≥90"久仰大名，如雷贯耳"
   - 后续见面（好感≥0时）：≥20"听说你最近混得还行" → ≥50"你现在也算个人物了" → ≥90"天下谁人不识君啊"
4. **记忆维度**: 上次送礼/帮忙/拒绝任务会有不同回应
5. **性格维度**: 外向(!)/内向(...)
6. **心情影响**: 高心情更热情
7. **最近行为**: 根据playerActions调整

### getFeiLeiGreeting(npc, player) - 绯泪专属问候（v12.0新增）
绯泪（修罗宫主）使用独立问候函数，不走通用流程：

- **首次见面**（按名气阈值）：<20"没听说过" → ≥20"好像在哪听过" → ≥50"我知道你" → ≥90"比传闻中顺眼"
- **道侣专属**（flags.has('dao_companion') 时覆盖≥80档）：
  - 日常："正想着你，你就来了"/"……想你了"（别过脸）
  - 久别重逢："你还知道回来？"/"我以为你不回来了"/"下次出门，带上我"
  - 深夜："夜里凉，过来"/"还不睡？…那我陪你"
  - 心情差："别说话，让我靠一会儿"/"让我抱一下就好"
  - 心情好："今天心情好，陪你走走"/"你今日倒是格外顺眼"
- **后续见面**（按好感度7档，每档3-5条随机，风格冷淡→逐渐松动）

### getFarewell(npc, player)
- ≥80: "别走太久，我会担心你"
- ≥60: "有空常来找我聊天"
- ≥40: "下次见"
- ≥20: "再见，路上小心"
- 根据记忆添加感谢/遗憾等

## 7.7 话题系统
> **v15.6 对话真实性**：互动计时（话题30分/情报20分/负面池10分/复读5分/追问+15分/请托15分，spendMinutes 统一走 timeSystem.advanceTime）；情境分流（深夜且非密友拒访、劳作中拒重话头、悲恸中拒轻快类并扣好感2——世界反应式回应，不灰锁）；重复显性化（`memory.impressions['tk|<日>|<npc>|<题>']` 持久化登记，当日复读出"方才才说过么"式短应零收益）。
> **v14.0 起真实数据驱动（social-content.js 零侵入注入 DEEP_TALK_REAL_HANDLERS）**：话题×7（近况/兴趣/过往/未来/心事/梦想/抱怨——从 memory/心情压力/喜好/secrets/background.goal/行囊wants 生成）+ 情报×5（坊市行情含声望折扣与随身贵重品/秘境消息按LANDMARK探索度/人物八卦联动行囊心愿/门派动向/黑市寄售概览）。v14.5 深谈回复经 #socialReplyBox 就地面板显示 + SUB_AFF_GATE 好感门禁路由表；v14.6 复刻原生"关系不足"负面池惩罚机制（可点击、扣好感、记 forced_talk）；v15.0 追问层 FOLLOWUP_BUILDERS——每题每日一追的二级选项对话，选择入 memory.impressions 并驱动 familiarityLine 熟稔度换档开场；v15.3 人称 ta(npc)。下表为旧预设话题（DialogueSystem 内层兜底）。

### 8种话题类型
| 话题ID | 名称 | 解锁条件 | 示例 |
|--------|------|----------|------|
| greeting | 打招呼 | 无 | "你好，{playerName}。" |
| cultivation | 修炼心得 | 无 | "修炼讲究循序渐进..." |
| sect | 门派八卦 | 无 | "青云门最近又在招新了..." |
| market | 坊市物价 | 无 | "最近灵石涨价了..." |
| dungeon | 秘境探险 | 无 | "后山秘境有宝物..." |
| gossip | 闲聊八卦 | 好感≥20 | "告诉你个秘密..." |
| personal | 私人话题 | 好感≥40 | "其实我有心事..." |
| quest | 委托任务 | 好感≥30 | "我有个忙需要你帮..." |

### 对话数据结构
```javascript
dialogueTree: {
    topics: {
        greeting: {
            all: ['你好...', '很高兴见到你...'],
            angry: ['走开！'],
            cautious: ['有什么事吗？'],
            friendly: ['看到你真好！'],
            warm: ['我一直在等你。']
        },
        // ... 其他话题
    },
    topicRequirements: {
        personal: { minAffection: 40 },
        quest: { minAffection: 30 }
    }
}
```

## 7.4 预设NPC数据（js/npcs/data.js）

### 10个核心NPC
> **2026-10-03 复核重写**：下表原写的「位置」「职业」「境界N层」三列**几乎全部与代码不符**——
> 代码里没有「N层」这个字段，原表的「层」其实是 `combat.level`（25～95 的数值）被误读成了层数。
> 位置列 10 条里 9 条错（原写的「青云门·修炼室 / 医馆 / 演武场 / 寒月派 / 新手村 / 炼丹房 / 铁匠铺 / 深山」等在 `data.js` 里一个都不存在）；
> 职业列只有 `merchant_01`(商人)、`villager_01`(村民)、`mysterious_01`(隐士) 三条对。
> 现表全部按 `js/npcs/data.js` 实测字段重建，「level」列是 `combat.level` 原值，不是层数。

| ID | 姓名 | 职业(occupation) | 位置(location) | 境界(realm) | combat.level | 年龄 |
|----|------|------|------|------|------|------|
| mentor_01 | 清虚道人 | 长老 | 武当派 | 筑基 | 75 | 50 |
| healer_01 | 灵素 | 长老 | 百花谷 | 炼气 | 30 | 26 |
| warrior_01 | 铁山 | 长老 | 金刚宗 | 筑基 | 65 | — |
| merchant_01 | 贾有道 | 商人 | 帝都·长安 | 炼气 | 25 | 45 |
| elder_01 | 玄冰子 | 长老 | 天山派 | 金丹 | 90 | 65 |
| rival_01 | 柳随风 | 修士 | 野外 | 筑基 | 70 | 25 |
| villager_01 | 张大爷 | 村民 | 太虚山 | 凡人 | 5 | 60 |
| alchemist_01 | 丹大师 | 长老 | 药王谷 | 筑基 | 40 | 55 |
| craftsman_01 | 铁匠老王 | 长老 | 铸剑山庄 | 筑基 | 50 | — |
| mysterious_01 | 神秘老者 | 隐士 | 洞府 | 元婴 | 95 | 99 |

### 每个NPC包含
- background（出身/家族/历史/目标/秘密）
- personalityBig5（5维度人格）
- combat（等级/境界/属性/技能）
- profession（类型/等级/专精）
- preferences（喜好/厌恶物品）
- schedule（7个时段活动）
- dialogueTree（8话题×5条对话）

## 7.5 关系系统

### 自动生成关系
- **同门关系**：同门派NPC自动成为好友
- **师徒关系**：高等级导师 → 低等级学生
- **对手关系**：3%概率随机生成

### 关系查询
```javascript
getNPCRelationship('mentor_01', 'warrior_01'); // 'friend'/'rival'/'master'等
```

## 7.6 任务系统

### 5种预设任务
| ID | 标题 | 类型 | NPC | 要求 | 奖励 |
|----|------|------|-----|------|------|
| quest_gather_herbs | 采集草药 | collection | 灵素 | 好感≥30 | 50灵石+10好感 |
| quest_defeat_bandits | 击败山贼 | combat | 铁山 | 好感≥40,炼气3层 | 100灵石+武器 |
| quest_deliver_message | 传递消息 | delivery | 清虚道人 | 好感≥20 | 10尊重+50经验 |
| quest_mine_ore | 采集矿石 | collection | 铁匠老王 | 好感≥30 | 80灵石+8好感 |
| quest_explore_dungeon | 探索秘境 | exploration | 神秘老者 | 好感≥50,筑基 | 200灵石+功法 |

## 7.7 动态事件

### 事件类型
| 类型 | 触发条件 | 效果 |
|------|----------|------|
| conflict | 仇敌同地点 | 仇恨+10 |
| breakthrough | level≥70, 2%概率 | 战斗力+5, 心情+20 |
| danger | health<30, 5%概率 | 记录需要治疗 |

## 7.8 初始化流程
```javascript
initNPCSystem();
// 1. 创建NPCManager/DialogueSystem/AffectionSystem
// 2. 创建NPCQuestSystem + 注册默认任务
// 3. 创建NPCEventSystem
// 4. 添加示例NPC（addSampleNPCs）
// 5. 生成NPC关系网（generateNPCRelations）
```

## 7.10 使用示例
```javascript
// 与NPC对话（完整面板）
showNPCDialog('mentor_01');

// 切换话题
changeTopicDialogue('manager_01', 'cultivation');

// 获取可用任务
const quests = window.questSystem.getAvailableQuests('healer_01', 30);

// 接取任务
window.questSystem.acceptQuest('quest_gather_herbs');

// 检查NPC关系
const rel = getNPCRelationship('mentor_01', 'warrior_01');

// 更新NPC状态（每帧/场景切换调用）
window.npcManager.updateAll(window.timeSystem.gameTime.currentHour);

// 检查事件
window.eventSystem.checkEvents();

// === Phase 7: 四轨关系操作 ===
const npc = window.npcManager.getNPC('mentor_01');
npc.changeAffection(5);      // 好感+5
npc.changeFavor(10);         // 情分+10
npc.changeRespect(5);        // 敬畏+5
npc.changeHatred(10);        // 仇恨+10
npc.updateFavorMax();        // 更新情分上限
const status = npc.getRelationshipStatus();  // 获取关系状态标签

// 执行请求（扣减情分）
if (npc.canAffordRequest(20)) {
    npc.executeRequest(20, (npc) => { /* 请求效果 */ });
}

// === Phase 8: 压力系统 ===
npc.addStress(20);           // 增加压力
npc.reduceStress(10);        // 减少压力
npc.dailyStressRecovery();   // 每日压力恢复

// === Phase 9: 特质相关 ===
let giftMul = npc.getGiftMultiplier();     // 获取送礼倍率
let reqBonus = npc.getRequestSuccessBonus();  // 请求成功率加成
let dialogMod = npc.getDialogueModifier(); // 对话修饰前缀

// 打招呼/告别
const greeting = getGreeting(npc, currentCharData);
const farewell = getFarewell(npc, currentCharData);

// 执行NPC请求
executeNPCRequest('mentor_01', 'teach_skill');

// 初始化
initNPCSystem();  // 创建所有系统+添加示例NPC+生成关系网
```

## 7.11 NPC数据文件详解（js/npcs/data.js）

### 每个NPC完整数据结构
```javascript
{
    id: 'mentor_01',
    name: '清虚道人',
    gender: 'male',
    age: 50,
    occupation: '导师',
    location: '青云门·修炼室',
    icon: '🧘',
    
    // 外貌
    appearance: { hair, eyes, clothing, features },
    
    // 背景
    background: { origin, family, history, goal, secret },
    
    // 大五人格
    personalityBig5: { openness, conscientiousness, extraversion, agreeableness, neuroticism },
    
    // 战斗数据
    combat: { level, realm, layer, attack, defense, speed, skills[] },
    
    // 职业
    profession: { type, level, specialization },
    
    // 偏好
    preferences: {
        likedItems: [{category, multiplier}],
        dislikedItems: [{category, multiplier}],
        giftMultiplier
    },
    
    // 日程
    schedule: {
        default: [{time, location, activity}]
    },
    
    // 对话树
    dialogueTree: {
        topics: {
            greeting: { all[], angry[], cautious[], friendly[], warm[] },
            cultivation: { ... },
            sect: { ... },
            market: { ... },
            dungeon: { ... },
            gossip: { ... },
            personal: { ... },
            quest: { ... }
        },
        topicRequirements: {
            personal: { minAffection: 40 },
            quest: { minAffection: 30 }
        }
    }
}
```

### 10个核心NPC详情
> **2026-10-03 复核**：本表与 §7.4 那张表在改动前是**两份各自独立的过时数据**（职业/位置/境界层数三列同源同错）。
> 现已与 §7.4 合并口径——以 `js/npcs/data.js` 的 `occupation`/`location`/`realm`/`age` 为准，
> 「境界等级」列不再写「N层」（代码无此字段）。「特殊设定」列本轮**未逐条核对**，原样保留待人来看。

| ID | 姓名 | 职业 | 位置 | 境界/年龄 | 特殊设定（未核） |
|----|------|------|------|----------|----------|
| mentor_01 | 清虚道人 | 长老 | 武当派 | 筑基/50岁 | 佛道双修,年轻时与魔教圣女有过情缘 |
| healer_01 | 灵素 | 长老 | 百花谷 | 炼气/26岁 | 身患奇毒时日无多 |
| warrior_01 | 铁山 | 长老 | 金刚宗 | 筑基/30岁 | 军人世家,曾败给神秘对手 |
| merchant_01 | 贾有道 | 商人 | 帝都·长安 | 炼气/45岁 | 三代经商,暗中从事禁品交易 |
| elder_01 | 玄冰子 | 长老 | 天山派 | 金丹/65岁 | 寒冰真气反噬随时走火入魔 |
| rival_01 | 柳随风 | 修士 | 野外 | 筑基/25岁 | 魔教卧底,风度翩翩但眼神危险 |
| villager_01 | 张大爷 | 村民 | 太虚山 | 凡人/60岁 | 年轻时梦想修仙,见过很多修仙者 |
| alchemist_01 | 丹大师 | 长老 | 药王谷 | 筑基/55岁 | 曾经炼丹失败炸毁山洞 |
| craftsman_01 | 铁匠老王 | 长老 | 铸剑山庄 | 筑基 | - |
| mysterious_01 | 神秘老者 | 隐士 | 洞府 | 元婴/99岁 | - |

---

---

## 九、新增未记录功能说明（v7.2 补充）

以下功能在原始 STRUCTURE.md 中未记录，但已在实际游戏中实现：

### 9.1 境界质变系统（REALM_UNIQUE_EFFECTS）
- 每个境界有独特效果，详见 cultivation.js
- 炼气→筑基→金丹→元婴→化神→炼虚→合体→大乘→渡劫 各境界均有特殊能力

### 9.2 功法组合系统（SKILL_COMBINATIONS）
- 8种组合技：阴阳融合、太极领域、万剑归宗、风火连天、冰封万里、不动如山、生生不息、金锋锐气
- 详见 cultivation.js

### 9.3 心魔系统（HEART_DEMON_TYPES）
- 5种心魔：杀戮心魔、贪婪心魔、情欲心魔、傲慢心魔、恐惧心魔
- 每种心魔有触发条件、战斗效果和不同结局影响
- 详见 cultivation.js

### 9.4 领悟系统（INSIGHT_TYPES）
- 7种领悟类型：攻击、防御、速度、暴击、闪避、恢复、特殊
- 详见 cultivation.js

### 9.5 门派资源与战争系统
- 宗门资源状态（灵石、粮食、材料、士气、防御、弟子数）
- 宗门战争功能（initiateSectWar）
- 宗门资源收集（collectSectResources）
- 详见 sects-system.js

### 9.6 道侣深度扩展
- 双修系统（dualCultivate）
- 合击技能（getDaoCompanionCombos）
- 道侣情绪系统（updateDaoCompanionMood）
- 详见 sects-system.js

### 9.7 区域特性系统（REGION_FEATURES）
- 每个地区独立怪物池、资源分布、天气、特殊事件、区域加成
- 详见 regions.js

### 9.8 剧情演出系统
- 剧情对话系统（showStoryDialogue）
- 5种分支结局：飞升成仙、入魔称霸、隐退江湖、轮回转世、混沌之主
- 详见 quest-system.js

### 9.9 NPC深度扩展
- 四轨人际关系系统（好感度/仇恨度/情分/敬畏度）
- 压力与精神状态系统（压力值、精神崩溃）
- 特质系统（9种特质）
- 深谈系统（8大类47子选项）
- 职业特有交互（10种职业）
- 记忆系统（firstMet/meetCount/lastMeetTime等）
- 详见 npcs/npc-system.js

### 9.10 新增文件列表
- js/npcs/npc-emotions.js - NPC情绪系统
- js/npcs/npc-daily-life.js - NPC日常活动
- js/npcs/npc-milestones.js - NPC好感度里程碑事件
- js/sect-internal.js - 门派内部事务
- js/dao-companion-deep.js - 道侣深度互动
- js/enemy-invasion.js - 敌对势力入侵
- js/faction-stance.js - 势力立场系统
- js/world-events.js - 世界事件系统
- js/lifespan-system.js - 寿命系统

========================================
【十、系统连接层 v9.2 规划（待落地）】
========================================

> 核心原则：不继续横向加第N个门派/设施，而是打通「获得资格→学习→实践→承担后果→改变世界」。
> 详细步骤与验收：`../游戏制作/旧计划/系统连接实施计划.md`（仓库外·已迁出）
> 来源分析：`参考3.txt`、`GPT扩展3.txt`（**两者根级均不存在·文档不再维护**，正文仅存结论）

## 10.1 现状断层（2026-10-03 逐条复核，替换原「已用代码验证」表）

> **本表上一轮核验结论**：原表 6 条里 **4 条已随 P0 批次修复**（招式 / 客栈 / 知识门 / 装备门），
> 2 条仍成立但**措辞与代码引用都已过时**。已修复的 4 条移入《版本记录.md》对应版本小节，此处只留指针。
> 每条「仍成立」的断层都补了本轮实测 `file:line`，可复核。

| 断层 | 现状（2026-10-03 实测） | 关键代码 | 判定 |
|------|------|----------|------|
| ~~战斗无招式~~ | > **本条已随 P0-2 修复，详见《版本记录.md》**。战斗有完整招式系统：`SKILL_ATTACK_MOVES` 表 → `getActiveAttackMoves()` 汇总已装备功法招式 → `playerAttackWithMove(partId, move)` 带 `partPreference`/`damageType`/`qiCost`/`staminaCost`/`hitBonus`/`armorPenetration`/`damageMult` + `_moveCD` 回合冷却；门派绝技经 `sect-art-channeling.js` 注册进同一张表 | `equipment.js:169` `getActiveAttackMoves` · `battle.js:3281` `playerAttackWithMove` · `battle.js:3336-3339` `_moveCD` 冷却写入 · `app.js:6219` `selectBattleMove` · `js/sects/sect-art-channeling.js:153-160` 绝技注册 | **已过时** |
| ~~客栈全恢复~~ | > **本条已随 P0-4 修复，详见《版本记录.md》**。`restAtInn` 源码里就写着分级口径：真气/精力回满、生命只回 **+40% 上限**、部位耐久 `restoreBodyDurability(10)`、危急伤（流血/`severity==='critical'`）只提示就医不治 | `js/app.js:1465` `restAtInn` · `app.js:1485` 分级注释 · `app.js:1491` 生命 +40% · `app.js:1494-1500` 危急伤判定 | **已过时** |
| ~~知识全知~~ | > **本条已随 P0-1 修复，详见《版本记录.md》**。功法浏览页只列「已学 + 听闻」，装备与常用招式候选均走 `KnowledgeSystem.canEquip()` 门禁 | `equipment.js:376-381` 浏览页按 `canEquip` 过滤 · `equipment.js:651-652` 常用栏候选再过一道 · `js/core/knowledge-system.js` | **已过时** |
| 功法五套平行数据（**部分修复**） | 装备门已落地：`equipSkill` 三级门禁——门派功法凭 `sectArtChannelable` 参悟账 → `KnowledgeSystem.canEquip()`（learned/mastered）→ 老档兜底 `learnedSecrets.indexOf`；两者皆不可用则直接 `return false`。**但 `learnedSecrets` 仍是活的第二写入源**（研读秘籍 `inventory.js:775`、参悟 `grand-legacy.js:473` 直接 push，绕过 `techniqueKnowledge`），achievement-system 还拿它算成就 | `equipment.js:574-589` `equipSkill` 门禁 · `js/inventory.js:772-776` 第二写入源 · `js/grand-legacy.js:473-474` 第二写入源 · `js/app.js:318/3005` 存档仍带该字段 | **部分过时**：原写的「equipSkill 不检查 learnedSecrets」已不成立；「五套平行数据」的病根未清干净 |
| 修炼抽象（**仍成立，措辞过时**） | 打坐仍是「扣一段真气 → 算一个倍率 → 一次性入账」，**没有经脉压力 / 周天 / 吸纳过程**：全仓 grep `meridianStress` / `cycleCount` / `qiAbsorbed` **零命中**，§10.5 的 P0-3 链路一步都没落地。产出物是**真元 `essence`（`currentCharData.essence += essenceGain`），不是「修炼经验」**——原表写错。已有的只是倍率层（灵根/变异/结拜/洞府/主修功法/熟练度/心境/境界质变）与随机顿悟翻倍、气机紊乱 | `js/app.js:1697` `cultivationMeditate` · `app.js:1716` 扣气 · `app.js:1763-1777` 「P0-3 温和版」= 主修功法 +10%（仅倍率，非过程）· `app.js:1843-1853` 顿悟/紊乱随机 · `app.js:1855` 入账 essence | **仍成立**，但「消耗真气→修炼经验」与 `cultivateSkill`（**该函数全仓不存在**）两处引用过时 |
| 死亡单一（**仍成立**） | 无境界分层：致命判据对所有生理类型一视同仁。要害格归零即死，名单是 **`['brain','head','neck','chest']` 四项**（原表写「头颈胸」漏了 `brain`）。金丹与凡人同规则这一点成立——§10.7 P0-5 死亡仙侠化**未落地**：全仓共 **4 处调用、0 处定义**——`window.checkSoulBlock` 被调用于 `app.js:1535`(演武)/`:1703`(修炼)/`:5131`(战斗)，`window.SoulStateSystem` 被调用于 `app.js:5988`，两符号全仓 grep 无定义、无测试引用，四处都靠 `&&` 守卫静默空转 | `js/battle.js:1103` `checkDeath` · `battle.js:1112` `fatalParts = ['brain','head','neck','chest']` · `js/app.js:1535 / 1703 / 5131 / 5988` 四处悬空引用 | **仍成立**（措辞补正：要害 4 项非 3 项；P0-5 未落地有 4 处悬空引用作证） |

## 10.2 唯一数据源约定（工程约束，P0 起执行）

```text
TechniqueDefinition  ← skillPages + 扩展 art_*（功法客观定义）
TechniqueKnowledge   ← techniqueKnowledge / KnowledgeSystem（角色知道多少）
TechniquePractice    ← proficiency 合并进 knowledge（练到什么程度）
TechniqueLoadout     ← currentSkills（当前运转/运功栏）
ManualItem           ← secretArts 物品（载体：秘籍/玉简/口述等）
```

配方/设施同理（P1）：RecipeDefinition+RecipeKnowledge；FacilityDefinition+Instance+Access+State。
禁止再新增第 N 套「已学列表」平行数组。

## 10.3 P0-1 知识获取层（✅ v9.3 已落地）

**文件**：[`js/core/knowledge-system.js`](js/core/knowledge-system.js)

**认知状态（简化6级）**：
unknown → heard → seen → studying → learned → mastered

**API**：`KnowledgeSystem.canEquip / learnFromManual / unlock / initStarterKnowledge / migrateFromLearnedSecrets / exportData / importData / getLearnedSkillIds`

**已改造**：
- equipSkill（app.js / equipment.js）：仅 learned/mastered 可装备
- renderSkillBrowse：只显示已学（可点）+ 听闻（灰显不可装）；空则提示用秘籍
- learnSecretArt：秘籍→映射 skill id→learned
- learnRandomSkill：奇遇写入 knowledge
- 存档：techniqueKnowledge 字段；旧 learnedSecrets 自动迁移；读档卸下非法运功
- 新角色：清空运功栏 + 仅听闻 skill_01 吐纳
- 仙侠.html：knowledge-system.js 在 inventory/equipment 之前加载

**秘籍→功法映射**：MANUAL_TO_SKILL / NAME_TO_SKILL（basic_cultivation→skill_01、art_wind_sword→skill_05 等）

## 10.4 P0-2 功法招式战斗化（规划 · 约200行）

**数据**：功法定义增加 `attackMoves[]`（id/name/icon/partPreference/damageType/qiCost/staminaCost/hitBonus/armorPenetration/damageMult/description）

**首批范围**：约15~20门常用功法各2招；无 attackMoves 回退普通攻击

**战斗**：
- 新增 playerAttackWithMove(partId, moveId)
- _executeAttack 读取招式修正（命中/破甲/伤害类型/真气）
- UI：先选招式按钮（来自已装备且 learned+ 的 currentSkills），再选部位

## 10.5 P0-3 修炼过程化（规划 · 约150行）

打坐链路：
1. 吸纳 qiAbsorbed ← 灵根 + 主修功法 + 地点灵气(qi-environment) + 洞府
2. 经脉压力 meridianStress；>80 则经脉受损并中断
3. 周天 cycleCount
4. 修为 = qiAbsorbed × cycleCount × 系数
5. 主修熟练度随周天增长；写入 techniqueKnowledge.proficiency

复用：qi-environment、physiology、bottleneck、currentSkills.skill_main

## 10.6 P0-4 恢复分级化（规划 · 约50行）

取消客栈/普通灵泉无条件全满：

| 损伤 | 客栈 | 医馆 | 高阶 |
|------|------|------|------|
| 疲劳/精力/真气 | 可恢复 | 辅助 | 快速 |
| 浅表伤/生命 | 部分(+20~40) | 治疗 | 灵药 |
| 深层伤/危急伤标签 | 仅稳定 | 可处理 | 专门 |
| 部位耐久 | 少量(+5级) | 更多 | 高阶 |
| 经脉/丹田 | 无效 | 几乎无效 | 专门 |

改造 restAtInn 与 building-effects 客栈；有深伤时提示去医馆。

## 10.7 P0-5 死亡仙侠化（规划 · 约80行）

| 境界 | 结果 |
|------|------|
| 炼气/筑基 | 现有死亡 |
| 金丹+ | enterSoulState：肉身毁、神魂/元婴暂存；残魂面板+重塑/夺舍占位 |
| 元婴+ | 逃遁标记预留（P2） |

`currentCharData.soulState = { active, realmIndex, lostCultivation, bodyDestroyed }`

## 10.8 P0 实施顺序与文件清单

```text
Step1 knowledge-system.js + 存档字段
Step2 equipSkill / learnSecretArt / 浏览UI 知识检查
Step3 修炼过程化
Step4 招式数据 + playerAttackWithMove + 战斗UI
Step5 客栈/恢复分级
Step6 enterSoulState 死亡分层
Step7 回归测试 + 文档
```

| 操作 | 路径 |
|------|------|
| 新建 | js/core/knowledge-system.js |
| 修改 | js/equipment.js, js/app.js, js/inventory.js |
| 修改 | js/cultivation/cultivation.js, js/battle.js, js/building-effects.js |
| 修改 | 仙侠.html（脚本顺序） |
| 文档 | STRUCTURE.md, 版本记录.md, ../游戏制作/旧计划/系统连接实施计划.md |

**P0 合计约 680~700 行**。P0 完成前不平行新开「第33门派/第50设施」类横向内容。

## 10.9 P1 / P2 摘要（P0 之后）

**P1 世界可信**：配方知识、属性成长来源分化、出身化角色创建、物品鉴定分层、敌人信息探查。仍不做完整经济/NPC全社会/犯罪证据链。

**P2 仙侠质变**：元婴逃遁夺舍、境界改旅行/辟谷/地位/感知、残卷与自创、宗门弟子竞争、传闻调查。

## 10.10 总验收剧本（系统连接闭环）

```text
听闻功法(heard) → 获得秘籍载体 → 研读(studying) → 打坐(经脉风险)
→ 分级恢复 → 学会(learned)并装备 → 战斗打出招式 →（金丹）肉身可毁神魂尚存
```

## 10.11 明确不做（与项目规模不符）

完整经济循环、NPC完整社会闭环、物品所有权因果追踪、犯罪证据链、功法残卷补全与自创（后两者可作后续扩展）。

---

========================================
【十一、v9.9 通用事件 / 日常互动 · 规划详解】
========================================

> 状态：**已落地 v9.9**（含 sect-join-flow 杂役无境界门槛 + daily-events.js 18个日常事件）
> 需求原文：`通用事件.txt`（**根级不存在·文档不再维护**；落地记录见 `版本记录.md` v9.9）
> 实施计划：`../游戏制作/旧计划/通用事件实施计划.md`（仓库外·已迁出）

## 11.1 问题摘要（2026-10-03 复核：3 条全部已修复，原表已过时）

> **本节标题原为「代码实测」**。上一轮核验结论：3 条问题**全部**已随 v9.9 修复，
> 但正文仍写着修复前的状态。已移入《版本记录.md》v9.9 小节，此处只留指针 + 一行复核注记。

| 问题 | 2026-10-03 复核结论 | 证据 |
|------|------|------|
| ~~入门强制炼气~~ | > **已随 v9.9 修复，详见《版本记录.md》v9.9**。`checkSectRequirements` 现在**一行境界判断都没有**（函数头注释即写「杂役弟子无条件——取消所有属性考核」），只留性别/灵根/体质/锻造/恶名五类特殊门派限制。境界门槛改由 `evaluateSectEntry` 单独把关，且只对两家特殊：大隐阁（金丹+）、天书阁（大善+渡劫+）。凡人可入杂役 | `js/sects/sect-join-flow.js:2003` `checkSectRequirements` · `:2001` 无条件注释 · `:1971` 「申请入门不卡境界」 · `:2056` 大隐阁 · `:2067` 天书阁 · 原表引用的 `(player.realm \|\| 0) < 1` **全仓零命中** |
| ~~加入后职位~~ | > **本条的事实部分成立、「门槛过严」的判断已过时**。`joinSect` 默认档位确为 `rank: 7` 杂役弟子；但门槛早在 v9.9 就拆了，所以这一行不该再留在「问题摘要」里。补充：大隐阁/天书阁/逍遥派走 `rank:-2` 同参弟子，侍妾走 `-1`，其余按 `evalResult.rank` | `js/sects/sects-system.js:210` `joinSect` · `:270` `var specialRank = 7` · `:34` `RANKS[7] = 杂役弟子` · `:273-285` 特殊档分流 |
| ~~缺世界填充事件~~ | > **已随 v9.9 修复，详见《版本记录.md》v9.9**。`js/core/daily-events.js` 存在且已接线：`仙侠.html:2397` 挂载、`js/time-system.js:175-176` 时间推进时调 `window.dailyEvents.tryTriggerDailyEvent('auto', {source:'time', minutes})`。另有 16 个测试文件引用它（含专尺 `tests/v20.70-sect-daily-events-node.js`） | `js/core/daily-events.js`（1092 行）· `仙侠.html:2397` · `js/time-system.js:175-176` |

> ⚠️ 本节抬头那行「状态：已落地 v9.9（含 … daily-events.js **18 个**日常事件）」里的事件数本轮**无法判定**：
> 文件里 `id:` 字段计数 58 处，但含大量非事件项与运行时合并，未逐条甄别出「18 个日常事件」这个口径，故原样保留不改。

## 11.2 事件生态分层（落地后）

| 系统 | 文件 | 定位 |
|------|------|------|
| 奇遇 | `js/event-system.js` | 高价值随机奖励 |
| **日常** | **`js/core/daily-events.js`（新建）** | 城市街面 / 野外非战斗 / 门派生活感 |
| 门派事件 | `js/sects/sect-events.js` | 门派士气/资源宏观 |
| 情境 | `js/core/scenario-engine.js` | 设施多节点剧情 |

## 11.3 批次与文件

| 批次 | 内容 | 行数 | 文件 |
|------|------|------|------|
| A | 杂役无境界入门 | ~25 | `sect-join-flow.js` |
| B | 日常事件池+弹窗+冷却 | ~200～250 | **新建** `js/core/daily-events.js` |
| C | 触发集成 | ~40 | `time-system.js`、`randomMap.js`、`sect-visit.js`、可选 `app.js`、`仙侠.html` |
| D | 文档 | — | STRUCTURE / 版本记录 |

P0 事件量：城市6 + 野外6 + 门派6。
触发：时间推进 / 野外移动（与奇遇互斥）/ 进入门派内院。
UI：对齐 `showEventDialog` 风格。

## 11.4 Admin调试面板（v11.0）

### 概述
当角色名称为 "admin"（不区分大小写）时，设置页下方自动出现调试面板，提供完整的游戏作弊功能。

### 文件
- **新建** [`js/debug-panel.js`](js/debug-panel.js) — 调试面板完整逻辑（IIFE模式）
- **修改** [`仙侠.html`](仙侠.html) — 调试面板DOM容器 + 脚本引用（第16层）
- **修改** [`js/app.js`](js/app.js) — `switchPanel`、`startGame`、`loadSaveData` 三处加入admin检测

### 功能列表
| 分类 | 功能项 | 实现方式 |
|------|--------|----------|
| 💰 货币 | 设置灵石/铜钱、+1万 | 直接修改 `currentCharData.spiritStones`/`copper` 及 `inventory.currency` |
| 🔮 境界 | 境界+层数下拉、修炼经验/等级经验/真元历练 | 修改 `currentCharData.realm`/`layer`/`cultivationExp`/`exp`/`essence`/`tempering` |
| 📊 属性 | 力量/灵巧/体质/神识/意志/经脉、一键100 | 修改 `mainAttributes` 和 `attrs` 双字段 |
| ⚔️ 战斗技能 | 9种技能逐个修改、一键100 | 修改 `combatSkills` |
| 🔧 生活技能 | **10** 种技能逐个修改、一键100（2026-10-03 复核实测 `js/debug-panel.js:28`：`['医术','毒术','学识','口才','采伐','种植','锻造','炼制','烹饪','音律']`；原写 9 已过时） | 修改 `lifeSkills` |
| 🌿 灵根 | 金木水火土数值、雷风冰变异勾选 | 修改 `spiritualRoots` 和 `mutatedRoots` |
| 📦 物品 | 自定义ID添加、13种快捷物品、全量添加 | 调用 `window.addItem()`/`addItemToInventory()` |
| ⚡ 快捷 | 全恢复/升满级/飞升/善恶值/秩序值/名气值/清状态/重置冷却/解锁地图 | 多字段修改+localStorage清理 |
| 🕐 时间 | +1时/+1天/+7天/+30天 | 调用 `timeSystem.advanceTime()` 或直接修改 `gameTime` |

### 检测机制
- `checkAdminStatus()` 比较 `currentCharData.name.toLowerCase() === 'admin'`
- 结果写入 `window._isAdmin` 供UI显示判断
- 每次切换到设置面板时重新渲染
- 新角色创建和加载存档时均触发检测

### 安全
- 非admin角色时调试面板 `display:none`，无任何UI残留
- 所有操作函数仅在 `window.DebugPanel` 命名空间下暴露，无法通过常规游戏操作触发

## 11.5 明确不做（v9.9）

替换奇遇、完整多结局链、32 门派专属日常文案、强制切磋战斗（可 P1）、升职境界卡（可 P1）。

## 11.6 绯泪秘密系统（v11.5-v11.6）

### 问题
完成绯泪个人事件后，秘密栏不显示已解锁的秘密。

### 根因（v11.5 初步修复）
`getNpcSecretsHtml()` 函数（`npc-system.js:2317`）从 `SECT_DEEP_DATA` 读取秘密状态，而不是从 NPC 实例的 `npc.secrets` 读取。当个人事件解锁秘密后，`npc.secrets` 被更新了，但 `getNpcSecretsHtml` 仍然读取的是 `SECT_DEEP_DATA` 中未更新的原始数据。

### 根因（v11.6 补充修复）
`injectSectSecrets()` 只在 `initPersonalEventSystem()` 时调用一次，但：
- `registerAllSectNPCs()` 在 `app.js` 中通过 `setTimeout(..., 200)` 延迟调用
- `initPersonalEventSystem()` 通过 `setTimeout(..., 500)` 延迟调用
- 如果加载顺序导致 `initPersonalEventSystem()` 先于 `registerAllSectNPCs()` 执行，NPC 还不存在，秘密注入失败
- `getNpcSecretsHtml()` 在 `showNPCDialog()` 中被调用时没有先调用 `injectSectSecrets()`

### 修复（v11.6）
1. 在 `getNpcSecretsHtml()` 中优先调用 `injectSectSecrets()` 确保 NPC 实例已获得 secrets 数据
2. 导出 `window.injectSectSecrets` 供其他模块调用
3. 提取 `_renderSecretsHtml()` 公共函数，避免代码重复

### 修改文件
| 文件 | 修改内容 |
|------|----------|
| `js/npcs/npc-system.js` | `getNpcSecretsHtml()` 中优先调用 `injectSectSecrets()`；新增 `_renderSecretsHtml()` 公共函数 |
| `js/npcs/npc-personal-events.js` | 导出 `window.injectSectSecrets` |

### 架构说明
```
个人事件系统 (npc-personal-events.js)
    ↓ 事件完成时调用 npc.unlockSecret(secretId)
NPC 实例 (npc.secrets) ← 实时更新
    ↓ getNpcSecretsHtml() 优先读取（先调用 injectSectSecrets 确保注入）
对话面板显示秘密栏
    ↓ 回退
SECT_DEEP_DATA (静态数据)
```

========================================
【十二、当前缺失内容盘点（2026-08-24 代码实测核对）】
========================================

> 本章节为对全部规划文档与实际代码逐项核对后的「还缺什么」权威清单。已完成项不再罗列，仅列**未落地/部分落地/待确认**项。
>
> **2026-10-03 复核：§12.1～§12.9 各小节标题里的「（仓库外·已迁出）」措辞与事实不符。**
> 实测 `D:\Download Game\游戏制作\旧计划\` **目录仍在磁盘上**，本节标题引用的
> 剩余任务实施计划.md / GTP审计5.txt / 社交面板无用选项清理计划.md / 经验系统整合改造计划.md /
> NPC位置跟随系统实施计划.md / 战斗死亡系统分析.md / 剩余大任务实施方案.md **7 个文件全部存在**。
> 「已迁出」只表示不在本仓库内，**不等于文件丢失**。措辞待用户裁定后再统一改，本轮只留此注记，不动各标题。
> 另：本节各表的「❌未落地 / ✅已落地」结论依赖上述仓库外计划文件的正文与代码双查，
> **本轮只核了链接可达性与其中可独立验证的少数几项，未逐条重核结论**，故不算作已验证账。

## 12.1 剩余任务实施计划6项核对结果（`../游戏制作/旧计划/剩余任务实施计划.md`（仓库外·已迁出））

| # | 任务 | 状态 | 说明 |
|---|------|------|------|
| 1 | **队伍面板UI增强** | ❌ **未落地（当前最大缺口）** | [`createMemberElement()`](js/party-system.js:562) 仍只渲染：名称+境界、HP/Qi条、设队长/休息/离队三按钮。缺：①职业标签 ②忠诚度条（`member.relationship.loyalty` 字段已存在但无UI）③战斗策略选择（`targetPriority` 字段已有 enemy_strongest/enemy_weakest/random 但无可选按钮）④装备管理入口（`equipMember` 函数存在但UI无入口）⑤技能查看/传授入口（`teachSkillToMember` 同样无入口）⑥队员详情弹窗（属性/战斗属性/关系/加入时间）⑦阵型加成数值展示（`getFormationBonuses` 只显示名称不显示数值）。预估150~200行，见计划文档第1节 Step1~5 |
| 2 | 出售系统重构 | ✅ v11.8 已落地 | 标记出售/TradeService/回购Tab/货币分层 |
| 3 | NPC自主生活 | ✅ 已落地 | `checkAutoBreakthrough`([npc-system.js:1594](js/npcs/npc-system.js:1594))、`checkActiveBehavior`([npc-system.js:1644](js/npcs/npc-system.js:1644)) 接入 NPCLifeSystem |
| 4 | 深谈系统2.0 | ✅ v11.9 已落地 | DEEP_TALK_BRANCHES 分支树×3核心NPC |
| 5 | 秘密系统2.0 | ✅ 已落地 | `applySecretEffect`([npc-system.js:747](js/npcs/npc-system.js:747))/`unlockConditions`/`exposureRisk` 均在 sects-deep-data.js 与 npc-system.js 生效 |
| 6 | 物品与NPC联动 | ✅ 大部分已落地 | NPC.inventory/_wantedItems/npcEquipment 已入 serialize；委托接入 npcQuestSystem |

## 12.2 系统连接层 v9.2 P0 五步核对结果

| 步骤 | 状态 | 说明 |
|------|------|------|
| P0-1 知识获取层 | ✅ v9.3 | knowledge-system.js 六级认知 |
| P0-2 功法招式战斗化 | ✅ v10.0 | `SKILL_ATTACK_MOVES`([js/equipment.js:9](js/equipment.js:9)) + `playerAttackWithMove`([js/battle.js:1580](js/battle.js:1580)) |
| **P0-3 修炼过程化** | ✅ **v12.3.2 已落地（温和版，用户定稿不加惩罚）** | cultivationMeditate：①修复 `_bonusAll`（季节/变异灵根/结拜/洞府/灵气环境/世界事件六项加成）计算后从未使用的假效果——真实接入真元产出公式；②主修功法吸纳加成（运功栏内功槽有功法 +10%）；③周天计数展示（每半小时一周天）+ 主修功法熟练度随打坐增长（addProficiencyExp）。经脉压力机制按用户决定不做 |
| **P0-4 恢复分级化** | ✅ **v12.3.2 已补完** | [restAtInn](js/app.js:1061)：精力/真气可满、生命仅+40%上限、部位耐久+10、危急伤检测提示就医；[openMedicalClinic](js/app.js:7367)：生命+30%上限、部位耐久+25、稳定流血伤口（客栈做不到）；灵泉 useSpring 维持全恢复（高阶） |
| **P0-5 死亡仙侠化** | ✅ **v12.3.2 已落地（用户定稿：重塑不夺舍）** | 新建 [`js/core/soul-state.js`](js/core/soul-state.js)：金丹+且肉身被毁（头/颈/胸/脑归零或血量耗尽）→ 神魂离体残魂态（可行走交易，禁战斗/修炼/演武/突破，四处拦截）；重塑肉身=灵石500×(境界序+1)+推进3天+损10%当前修为，属性/灵根/功法全保留；重塑后3天「境界不稳」战斗属性×0.9（battle.js getAttack/getDefense/getSpeed 三处接入）；soulState 进 GameState 存档；残魂面板 showSoulStatePanel |

## 12.3 GPT审计5修复计划26项核对结果（`../游戏制作/旧计划/GTP审计5.txt`（仓库外·已迁出））

| 优先级 | 已确认修复 | 待确认/遗留 |
|--------|-----------|------------|
| P0×5 | P0-1 questSystem覆盖→独立命名 npcQuestSystem/npcEventSystem（[npc-system.js:2743](js/npcs/npc-system.js:2743)）；P0-2 currentLocation→currentCharData.location 同步（[location-system.js:311](js/location-system.js:311)）；P0-4 serialize 补全动态状态（[npc-system.js:1251](js/npcs/npc-system.js:1251)）；P0-5 removeMember 清除 isFollowing（[party-system.js:344](js/party-system.js:344)） | P0-3 NPC分钟累加器：未见 `_minuteAcc` 类实现，v12.1 GameScheduler 统一游戏时间后是否完全覆盖需回归验证 |
| P1×11 / P2×10 | v12.1 版本记录确认：每日社交计数key、statusEffects读档、NPC↔NPC关系存档、调解目标、假功法教学、借物期限、垂危天数漂移、制作多材料、拍卖托管等 | 商店价格波动（getItemPrice 每次随机）、回购细节等建议以 tests 回归覆盖 |

## 12.4 v12.3 官方「后续可做」（STRUCTURE.md v12.3 节尾部）

1. **绯泪线回灌自动触发机制**：xl_ 事件补 `autoTrigger` 字段即可（v12.3 框架已通用化），让绯泪线也获得世界驱动触发。
2. **百花谷弟子专线**：requireDisciple 链预留扩展（温蘅线之外的谷内弟子剧情）。

## 12.5 系统连接 P1/P2 规划（P0 之后，明确排队中）

- **P1 世界可信**：配方知识层、属性成长来源分化、出身化角色创建、物品鉴定分层、敌人信息探查。
- **P2 仙侠质变**：元婴逃遁夺舍、境界改变旅行/辟谷/地位/感知、功法残卷与自创、宗门弟子竞争、传闻调查。

## 12.6 其他明确遗留项

| 来源 | 遗留项 | 说明 |
|------|--------|------|
| GPT审查待办实施计划 | 设施大规模差异化 | B1~B5 关键已落地，但各城市设施差异化深度不足 |
| v9.9 明确不做清单 | 32门派专属日常文案 / 强制切磋战斗(P1) / 升职境界卡(P1) | 官方声明延后 |
| 战斗死亡系统分析（`../游戏制作/旧计划/战斗死亡系统分析.md`（仓库外·已迁出）） | 平衡性两因未调：①玩家部位耐久800+ vs 敌人伤害5~20（数十回合才能致死）②危急计时5游戏分钟=50回合过长 | 战败处置已落地（handleEnemyDisposal [app.js:5506](js/app.js:5506) + 队友救助），但「玩家几乎不会死」的数值根因仍在 |
| 基础内容补全开发计划 | 6阶段路线图（约5000~7700行） | 总量庞大，需按阶段排期确认进度 |

## 12.7 文档维护问题

- STRUCTURE.md 中引用的 `plans/GTP审计5修复计划.md`、`plans/百花谷温蘅感情剧情实施计划.md` 等链接指向的 plans/ 目录实际为空（文件已迁移至 旧计划/ 或 ../游戏制作/旧计划/），链接失效需修正。
- 版本记录.md 缺少 v12.2 独立条目（版本号在 STRUCTURE.md 头部出现但无对应记录段落）。

## 12.8 建议开工顺序

```text
① 队伍面板UI增强（唯一剩余P0级功能缺口，字段全部现成，纯UI工作约150~200行）
② P0-5 死亡仙侠化（金丹+神魂状态，约80行）
③ P0-3 修炼过程化（打坐链路重做，约150行）
④ P0-4 恢复分级化补完（约50行）
⑤ 绯泪线回灌 autoTrigger（数据补充为主）
⑥ 战斗数值平衡（耐久/伤害/危急时长）
```

## 12.9 过往任务未完成明细（2026-08-24 第二轮逐文档核对补充）

### A. 社交面板无用选项清理计划（`../游戏制作/旧计划/社交面板无用选项清理计划.md`（仓库外·已迁出））

| 计划项 | 状态 | 说明 |
|--------|------|------|
| 删除 🎁赠礼整类6项重复入口 | ❌ 未执行 | [`DEEP_TALK_CATEGORIES.gifts`](js/npcs/npc-system.js:134) 仍在，与 💕爱情「赠送礼物」完全重复 |
| 📜委托占位符改真实功能 | ✅ 已做 | accept_quest 接入 npcQuestSystem（[npc-system.js:2804](js/npcs/npc-system.js:2804)） |
| 修炼指导5项无差异增强 / 情报假内容注入真实系统 | ❌ 未做 | 属方案B「增强」范畴的新任务（非清理），P2 级待排期 |

> **v12.3.1 复核修正**：「删除赠礼整类」一项实际**无需执行**——gifts 已被此前重构压缩为1项 `give_gift` 且绑定真实 `giveGiftToNPC`（[npc-system.js:2799](js/npcs/npc-system.js:2799)）；💕爱情分类实际不含赠礼入口（仅表达好感/共度时光/表白/亲密/结为道侣五项），gifts 是唯一赠礼通道，删除会破坏功能。beast_news/oddities 两分类已不存在，合并项不适用。**本计划遗留清零。**

### A2. v12.3.1 本轮已落地（2026-08-24「先做简单的」批次）

| 任务 | 落地内容 |
|------|---------|
| ✅ 阵法增益真实接入战斗 | [`getDefense()`](js/battle.js:561) 玩家分支读取 `_formationBuff.def` 防御乘算；新增 `_consumeFormationBuff()` 在 `_checkEnd()` 胜负判定时按场次递减（耗尽删除并提示）；修复 GPT审核报告2 P0-3 假效果 |
| ✅ 绯泪线回灌 autoTrigger | [`maybeAutoTriggerPersonalEvent(npcId, source, opts)`](js/npcs/baihua-personal-events.js:118) 通用化（opts.finalEvents 终章封停）；绯泪28事件补 `autoTrigger`、日常/接近补 `minAffection`（20~70 梯度对齐温蘅线）；大节点 007旧物·寒烟门 / 011谁的簪 / 013真名·绯泪 / 014郗寒舟的真相 / 033终章 仅手动；三触发源接入：问候分支（[npc-system.js:2324](js/npcs/npc-system.js:2324)）、修罗宫山门（sect-visit.js）、每日兜底（currentCharData.location==='修罗宫'） |
| ✅ 队伍面板UI增强 | [`createMemberElement()`](js/party-system.js:570) 重写：职业标签（NPC职业优先/战斗技能推断兜底）、忠诚度❤️条（四档变色）、战斗策略循环按钮（攻强/攻弱/随机）、装备/技能/详情三入口；弹窗系统（详情=六维属性+战斗技能+装备总览+关系值+加入时间+队伍战绩；装备管理=三槽位装卸+背包UID级选择；技能=已掌握列表+从 KnowledgeSystem 已学功法传授）；阵型加成数值展示（updateFormationBonusDisplay 动态注入 formation-select 下方）；附带修复 PartyMember 构造函数丢弃 combatSkills 的数据流断裂 |
| ✅ 社交面板清理复核 | 见上表 A——确认遗留清零，无需代码变更 |

### B. GPT审核报告2 P0 遗留

| 计划项 | 状态 | 说明 |
|--------|------|------|
| P0-1 缺失函数补全（黑市/地图标记/深入按钮） | ✅ 已修 | buyBlackMarketItem [app.js:7428](js/app.js:7428)、renderMapMarkers [map-markers.js:782](js/map/map-markers.js:782)、openScenarioPanel [app.js:7460](js/app.js:7460) |
| P0-2 NPC高级请求假成功 | ✅ 大部分已修 | 同行/借物/庇护/介绍/调解已接UI；v12.1 又修借物期限等 |
| **P0-3 阵法增益接入战斗** | ❌ 未修 | `_formationBuff` 只写入 currentCharData（[profession-system.js:237](js/profession-system.js:237)、[location-system.js:971](js/location-system.js:971)），battle.js 从不读取，「防御+10%约5场」仍是假效果 |
| P0-4 拍卖真实化 | ✅ v12.1 已做 | 上架托管/竞拍扣款/流拍退货/成交税 |
| P0-5 门派设施静默分支 | ✅ v11.1 已做 | B3 系列 |

### C. 经验系统整合改造计划（`../游戏制作/旧计划/经验系统整合改造计划.md`（仓库外·已迁出））

| 计划项 | 状态 | 说明 |
|--------|------|------|
| 修炼时长选择（片刻/时辰…） | ✅ 已落地 | CULTIVATE_DURATIONS [app.js:1112](js/app.js:1112) |
| **删除 exp/cultivationExp 冗余字段** | ❌ 未执行 | `player.exp += expGain` 仍存在于论道等处（[npc-system.js:415](js/npcs/npc-system.js:415)）；「打坐只产真元、战斗只产历练」单一来源原则未贯彻 |

### D. NPC位置跟随/标准化（`../游戏制作/旧计划/NPC位置跟随系统实施计划.md`（仓库外·已迁出））

| 计划项 | 状态 |
|--------|------|
| isFollowing 标记+序列化 | ✅ [npc-system.js:572](js/npcs/npc-system.js:572)/1235 |
| updateNPCAI 跟随拦截 | ✅ [npc-system.js:1523](js/npcs/npc-system.js:1523) |
| 玩家移动同步队友位置 | ✅ syncPartyLocationToPlayer [party-system.js:747](js/party-system.js:747)，travelToCityFromList 已挂接 [app.js:2012](js/app.js:2012) |
| 远程互动限制 | ✅ [npc-system.js:3113](js/npcs/npc-system.js:3113) |

### E. 基础内容补全路线图批次（2026-08-24 二次复核修正——初版多处照抄 v9.10 旧文档状态，实际 v10.0 已大量落地）

| 批次 | 子项 | 状态（复核后） |
|------|------|:----:|
| 0 | 内容ID校验机制系统化 | ⚠️ 仅补28 ID，无启动校验 |
| 1 | 背包搜索+品质筛选+排序 | ✅ v10.0 已落地（[inventory.js:37](js/inventory.js:37) searchQuery/qualityFilter、607 getFilteredSlots） |
| 1 | 购买数量选择 | ✅ v10.0 已落地（[inventory.js:1668](js/inventory.js:1668) showBuyQuantityDialog） |
| 1 | 物品来源提示 | ✅ v10.0 已落地（[inventory.js:793](js/inventory.js:793) showItemMenu 来源提示）；装备对比弹窗 ✅ v12.5 已落地（showEquipmentCompareDialog） |
| 1 | 任务追踪 | ✅ v10.0 已落地（[quest-system.js:1049](js/quest/quest-system.js:1049) 追踪栏+追踪按钮+StateRegistry存档）；地图🎯目标标记 ✅ v12.5 已落地（map-markers syncQuestTargetMarkers） |
| 1 | 统一操作反馈 | ⚠️ showMessage 已统一；长行动「已过X小时」提示仍缺 |
| 2 | 灵兽战斗收服 | ✅ v10.0 已落地（[beast-taming.js:475](js/beast-taming.js:475) 战斗后收服 + [app.js:3957](js/app.js:3957) 收服按钮） |
| 2 | 竞技场真实战斗 | ✅ v10.0 已落地（[js/gameplay/arena-system.js](js/gameplay/arena-system.js) enterArena 接真实战斗） |
| 2 | 秘境事件多样性 / 任务事件连接 | ✅ v12.5 已落地：12种加权事件池（新增灵泉回响/残破功法），此前 v10.0 已扩至10种——方案"仅三类"描述过时 |
| **3** | 12核心NPC各一条5段故事线 | ⚠️ npc-storylines.js 有7条旧模型雏形（用户定：过时，重写） |
| 3 | 同行共同经历记忆 | ⚠️ processPostBattleRelationships 已有战后关系记忆，深度共同经历未做 |
| **4** | 门派深度化 | ✅ v18.7 入门层收官：修罗宫/百花谷/大隐阁/天书阁保留专属流程；18个现役门派完整守卫考核（另保留太虚剑宗兼容分支）；其余14派单问式特色考核。职位ID与灵根字段已统一。后续深度化按新需求逐派扩展。 |
| **5** | 剧情整合 | ❌ 未开始 |
| **6** | 内容批量扩充 | ❌ 未开始 |

### F. NPC社交面板改进方案核对

当前活动/喜好厌恶显示/秘密预览/关系标签均已进 showNPCDialog ✅；仅「互动记录摘要」「NPC目标醒目展示」等低优先级项未做。

### G. 剩余大任务实施方案（2026-08-24 制定，待用户检查定稿）

| 路径 | 说明 |
|------|------|
| `../游戏制作/旧计划/剩余大任务实施方案.md`（仓库外·已迁出） | 四大剩余任务的完整落地方案：一、战斗数值平衡（伤害×1.5系数+要害倍率+危急缩短50→20回合，约105行）；二、批次1基础UI（搜索排序/购买数量/装备比较来源提示/任务追踪地图标记，约320行）；三、12核心NPC故事线（实测发现 npc-storylines.js 已有7条五段雏形558行未接电，走桥接适配器救活+补3条新线，约600行）；四、4门派深度样板（武当/修罗宫/万毒谷/铸剑山庄四件套：考核链+师徒+内部派系+专属剧情，引擎+配置分两批，约1450行）。含现状代码实测、数值推算、分批验收标准与4个待确认决策点。 |

---

## 补录：社交内容生成层架构（v14.0-v15.3，2026-08-26 以代码核对补记）

### 定位与集成模式
- js/npcs/social-content.js（**1105 行**，2026-10-03 复核实测；原写「约950行」已过时）是深谈/问候/告别的**内容生成层**，与 npc-system.js 的关系为「零侵入注入」：向 window.DEEP_TALK_REAL_HANDLERS 写入12个处理器（executeDeepTalkSubOption 优先调度），并最外层包装 getGreeting/getFarewell/executeAdvancedRequest。
- 调度链：executeDeepTalkSubOption → 同地点守卫(npcNotCoLocated) → DEEP_TALK_BRANCHES 专属树(v11.9 三核心NPC) → 真实处理器(social-content) → 原生通用回退。

### 关键机制速查
| 机制 | 锚点 | 说明 |
|------|------|------|
| 回复入面板 | ensureReplyBox/writeReply + wrapExecute | 深谈执行期 showMessage 重定向至 #socialReplyBox（弹窗关闭或异步迟到退回toast） |
| 好感门禁 | SUB_AFF_GATE（subId→{need,catId}） | 不足不拒绝对话：负面回应池+扣好感-floor(need/10)+forced_talk（v14.6 复刻原生惩罚语义） |
| 每日防刷 | _dailyPaid / _fuPaid 双键空间 | 数值收益与追问机会各自每日一次 |
| 追问层 | FOLLOWUP_BUILDERS×12 + offerFollowup | 首轮成功后在回复框注入「🔍 追问一句」，二级2~3选项带好感/信任/情分/心情/calmStress 差异化效果；选择 recordPlayerAction('followup_<sub>') 入 impressions |
| 印记换档 | familiarityLine + fuCount | impressions['followup_<sub>']≥2/≥5 两档熟稔开场（话题/情报两套文案） |
| 人称 | ta(npc) | gender==='female'→她；静态池省主语（v15.3） |
| 性格 | personality16.js | Personality16.tailFor/dimLineFor/identityTailFor 三层尾缀 + NPC.personalityBig5 五维 |

### 爱情线防刷四重检查（v14.8）
confess/intimate/bond_dao 冷却3日/7日（memory._loveCd 绝对游戏日）；intimate/bond_dao 需 confess 成功前置（_loveAccepted_confess）；nature≤-55 冷面者 intimate 需好感≥85；同地点由入口守卫覆盖；失败尝试也进冷却。修罗宫/百花谷专属感情线豁免。

### request_heal 接22部位（v14.8）
包装 executeAdvancedRequest（callAdvancedRequest 恒true会吞结果）：成功后医者处置 止血稳定→浅创(depth<3)清创severity-15/depth-1→镇痛×0.6→安神×0.7；深创保留提示就医馆。需消耗情分5。

---

---

## §十九 文档死链清单（2026-09-02 首核；2026-10-03 复核）

STRUCTURE.md 内引用的 .md 文件中，以下为死链（仓库外路径或根级不存在）：

> **2026-10-03 复核结论（重要，与上一轮判断相反）**：
> `../游戏制作/旧计划/` 目录**在磁盘上仍然存在**（`D:\Download Game\游戏制作\旧计划\`），
> 本轮逐个 `Test-Path` 实测：**STRUCTURE.md 引用的 24 个旧计划文件全部存在，没有一个是死链**。
> 所以「仓库外」= 只是不在本仓库里，**不等于文件已丢失**。原清单把它们叫「死链」措辞不准，
> 真正需要处理的只是「文档里该不该继续链到仓库外路径」这一层，本轮不动正文口径（按 §0 的强约束，去链接化需用户确认）。
> 计数也已过时：原写「19 个」，实测正文引用 **24 个**——漏录 5 个，已补在下方。

### 仓库外路径（**24 个**，2026-10-03 复核实测；原写 19 个已过时。均在 `D:\Download Game\游戏制作\旧计划\` 下，**文件全部存在**）
- 原文已录 19 个：GPT审查待办实施计划.md / GPT审核报告2实施计划.md / NPC位置跟随系统实施计划.md
- 主流游戏对比与差距分析.md / 剩余任务实施计划.md / 剩余大任务实施方案.md
- 基础内容补全开发计划.md / 情境引擎实施计划.md / 战斗死亡系统分析.md
- 扩展实施方案.md / 掉落系统优化计划.md / 深度补全计划.md
- 社交面板无用选项清理计划.md / 第一批实施步骤.md / 系统连接实施计划.md
- 经验系统整合改造计划.md / 设施与门派实施计划.md / 通用事件实施计划.md / 门派入门体系改造计划.md
- **2026-10-03 补录（原清单漏掉的 5 个）**：GTP审计5.txt（§12.3 引用） / NPC计划.txt / P0模块扩充计划.txt / 城市扩展计划.txt / 物品扩展计划.txt（§20.x 引用）——实测均存在

### 根级不存在（7个，规划已落地·文档不再维护）
> 2026-10-03 复核：7 个全部实测确认**不在磁盘上**（含 3 个 .txt），此节准确。
- GPT逻辑审查报告.md（审计结论已由 v9.10～v20.0 各批次修复落地，文档不在仓库内·不再补回）
- 属性现状分析与修改计划.md（属性系统已由 combat-stats.js + v20.0 统一注入实现，文档不在仓库内·不再补回）
- 属性系统实施计划.md（5 批次已由后续版本落地，文档不在仓库内·不再补回）
- GPT属性修改修正.txt（精简平衡方案原文；5 批次已落地，文档不在仓库内）
- 通用事件.txt（v9.9 需求原文；已落地，文档不在仓库内）
- 参考3.txt（v9.2 系统连接层来源分析；P0 全部落地，文档不在仓库内）
- GPT扩展3.txt（v9.2 系统连接层来源分析；P0 全部落地，文档不在仓库内）

### 旧计划子目录（1个）
- 旧计划/百花谷温蘅感情剧情实施计划.md —— 2026-10-03 复核：**文件存在**

### 活链（核查通过）
- ✅ 版本记录.md（根级存在）

**处理建议**（待用户确认范围后再动 STRUCTURE 既有正文）：
1. 仓库外 24 个：**先改叫法**——它们不是死链，是「仓库外活链」。若要去链接化（`[text](path)` → `text（仓库外·已迁出）`）或整行删除，请用户先定范围
2. 根级 **7** 个：确认是否应补回文件，或从 STRUCTURE 移除该引用行
   > ⚠️ 原第 2 条写「根级 **3** 个」，与本节标题的「7 个」自相矛盾（2026-10-03 已订正为 7）
3. 不影响代码运行，纯文档一致性问题

---
