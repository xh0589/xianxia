# 仙路长青 — 游戏 BUG 与设计审查报告

> 审查基准：代码与 GitHub 仓库 `xh0589/xianxia` main 分支一致（已逐字节还原）。
> 对照主流：鬼谷八荒 / 觅长生 / 太吾绘卷 / 了不起的修仙模拟器。
> 审查方法：8 路并行，每条问题落到 `file:line` + 触发场景 + 修复建议，不凭印象。
> 日期：2026-09-01。

判级：🔴 P0 崩溃/流程级死锁 / 🟠 P1 功能错误或严重体验 / 🟡 P2 平衡/死代码/边界。设计类用【致命/重要/一般】。

---

## 总体统计

| 系统 | P0 | P1 | P2 | 小计 |
|---|---|---|---|---|
| 战斗系统 | 0 | 8 | 8 | 16 |
| 修炼/突破/境界 | 0 | 7 | 10 | 17 |
| 经济/物品/合成/装备 | 6 | 16 | 14 | 36 |
| NPC/社交/门派/感情线 | 3 | 13 | 28 | 44 |
| 任务/秘境/地图/奇遇 | 3 | 11 | 13 | 27 |
| 存档/状态/时间/全局 | 1 | 7 | ~14 | ~22 |
| UI/交互/反馈 | 0 | 6 | 15 | 21 |
| 仙侠设计整体（设计类） | — | 致命3/重要5/一般4 | — | 12 |
| **合计** | **~13** | **~68** | **~114** | **~195** |

骨架完整、覆盖面惊人，但**仙侠核心气韵没立起来**：境界质变/灵根五行/功法组合/心魔/瓶颈/天劫飞升六大标志系统实测全是空壳或死代码；加上主线从第一步就死锁、元婴化神突破材料 ID 写错，**实际能通关的路径目前是断的**。

---

## 🔴 第一部分：游戏流程级硬伤（P0，会让玩家卡死/无法通关）

### F-1 主线任务三连死锁（从 main_001 第一步即不可通关）
- **扩展任务未注册到 QuestRegistry**：`js/items-extended/12-quest-extensions.js:351-383` 的 `merge()` 只 push 到 `window.mainQuestChain`/`window.allQuests` 数组，**从不调用 `QuestRegistry.registerMany`**。`js/quest/quest-system.js:345-348` 只注册了最初 5 个主线。
  - 后果：`acceptQuest('main_021')` → `findQuestById` 走 `QuestRegistry.get` 返回 null → "任务不存在"。main_022-035、20 个随机任务、全部 NPC 故事线任务均无法接取/交付。
- **主线目标事件桥大面积断链**：`js/quest/quest-system.js:1411-1418` `registerQuestEventBridge` 只监听 9 类事件；`js/core/event-bus.js:66-68` 声明了 `location:visited`/`npc:talked`/`dungeon:completed`，但全工程**无任何 `EventBus.emit` 这三者**；`cultivation/breakthrough-system.js:232` 发的是 `cultivation:breakthrough`，桥监听的是 `cultivation:completed`（错位）。`questObjectiveMatches`（:1360-1387）对 `join_sect`/`cultivation_realm`/`breakthrough_realm`/`reputation`/`complete_quests`/`cultivate`/`explore`/`talk_to_npc`/`deliver`/`defend`/`sparring` 这些 objective type **完全没有 handler**。
  - 后果：main_001 目标=`visit`(门派列表)+`join_sect`——visit 无 emit、join_sect 无 handler → 永不可完成 → 整条 35 步主线从第 1 步死锁。
- **主线实际只 20 步而非 35**：`quest-system.js:70-163`（main_001-005）+ `12-quest-extensions.js:244-324`（main_021-035）共 20 个，main_006-020 **完全缺失**（筑基→金丹阶段叙事断档）。`checkEndingCondition`（:612）要求 `completedMainQuests>=35`，`turnInQuest`（:816）`questId==='main_035'`。
  - 后果：即便修好上面两点，最多完成 20 个，5 结局（飞升/入魔/隐退/轮回/混沌之主）**全部不可达**，结局系统是死代码。
- **修复**：① `merge()` 末尾 `QuestRegistry.registerMany(extraMain); registerMany(extraRandom); registerMany(extraNPCQuests);`；② 补 emit 点（location-system 城市到达 emit `location:visited`、sect 加入 emit、dungeon 通关分支 emit `dungeon:completed`）；桥增监听 `cultivation:breakthrough` 映射到 breakthrough_realm/cultivation_realm；`questObjectiveMatches` 增补上述 type 分支；③ 补 main_006-020 或把 `>=35` 改成实际链长度。

### F-2 元婴/化神突破材料丹药 ID 写错 → 两个大境界突破永久卡死
- `js/cultivation/breakthrough-ritual.js:101-102` 引用 `pill_婴变`、`pill_化神`，物品库实际定义的是 `pill_primordial`（元婴丹）、`pill_divine`（化神丹）。`hasItemInInventory` 永远查不到。
- 触发：金丹圆满冲元婴（或元婴冲化神），背包有元婴丹也提示"缺少突破材料：婴变丹×1"，突破流程彻底阻断。
- 修复：改为 `pill_primordial`/`pill_divine`。

### F-3 合成成功必抛 ReferenceError，合成流程中断
- `js/crafting.js:961` 成功发放产物后 `EventBus.emit('item:crafted', payload)` 引用了 `profId`，但 `executeCrafting` 作用域内从未声明 `profId`。
- 触发：只要 `window.EventBus` 存在，任意合成成功都在构造 payload 时抛 `ReferenceError: profId is not defined`。材料已扣、物品已发，但 `showMessage` 与 `timeSystem.advanceTime` 不执行——玩家看不到成功提示、时间不推进。
- 修复：改为 `profession: (recipe.requiredSkills && Object.keys(recipe.requiredSkills)[0]) || null` 或删该字段。

### F-4 队伍原型重写致队友无敌 + 关键方法全丢
- `js/party-system.js:1071` `PartyMember.prototype = { ...PartyMember.prototype, takeDamage: ... }` 用对象展开复制原型。class 方法定义为 non-enumerable，展开无法复制，导致 `isAlive`/`gainExp`/`levelUp`/`restore` 全部丢失；新 `takeDamage` 依赖 `this.originalTakeDamage`（从未赋值），伤害完全失效。
- 触发：任何调用 `member.takeDamage()` 的战斗 → 队友血量永不下降（无敌）；调 `member.restore()`/`isAlive()`/`levelUp()` → TypeError。
- 修复：删除该原型重写块，在 class 内直接修改 `takeDamage` 并保留原始 `this.health -= amount` 逻辑。

### F-5 爱情线冷却 `_loveCd` 未序列化，存读档绕过全部冷却
- `js/npcs/npc-system.js:2889`(set)、`:2894-2899`(check) 把 confess 3日/intimate 3日/bond_dao 7日冷却存 `npc.memory._loveCd`，但 `serialize()`（:1256-1272）的 memory 对象**不含** `_loveCd` 也不含 `_loveAccepted_confess`。
- 触发：告白成功→存档→读档→冷却清零+前置承诺标志丢失→可立即 bond_dao，一回合跑完整条感情线。
- 修复：serialize 的 memory 对象补 `_loveCd: this.memory._loveCd || {}` 和 `_loveAccepted_confess: this.memory._loveAccepted_confess || false`，deserialize 对应还原。

### F-6 门派 discipleState 存档丢失师徒/侍妾/藏经阁全部下划线字段
- `js/sects/sects-system.js:1285-1298` StateRegistry 的 `export` 仅导出 11 个基础字段 + `_gbFaction`，`_masterId`/`_masterName`/`_masterSect`/`_masterBlessDay`/`_leftMasters`/`_chshiDone`/`artInsights`/`isConcubine`/`concubineFavor`/`_sectEventDay`/`_sectTaskDay`/`_lastSalaryDay` 全未导出。
- 触发：拜师后存读档→师父关系消失可重拜同一师父；藏经阁参悟进度归零；侍妾存档后变回杂役、晋升按钮重新出现。
- 修复：export/import/reset 三处补齐所有下划线字段。

### F-7 标记出售可刷钱 + 可丢槽 + 可装备（与提示矛盾）
- `js/enhanced-shop.js:146-174` `Shop.sellItem` 固定 `basePrice*0.5` 不经 TradeService 的 0.25-0.35 回购率，同件物品此路径卖得更多、可绕过"标记出售"设计；`js/inventory.js:1162-1165` `markForSale` 部分标记找空位失败时 `inventory.slots.push(null)` 缺 `length<maxSlots` 检查 → 背包满时部分标记可突破 maxSlots；`js/inventory.js:1234`(equip)/`:1469`(discard) 未查 `isMarkedForSale` → 标记的装备仍可装备/丢弃，与 UI 文案"已标记为待售，不可使用/装备/丢弃"矛盾，且 uid 留在 Set 成泄漏。
- 修复：`Shop.sellItem` 委托 `TradeService.quoteSell`+`executeSell`；`markForSale` 加 `length>=maxSlots` 检查；equip/discard 开头加 `isMarkedForSale` 守卫。

### F-8 回购物品货币错配 + 快照 count=0 致回购数量错
- `js/enhanced-shop.js:788-816` `itemSnapshot` 在 `executeSell` 已 `slot.count -= quote.quantity`（归零时 `slots[slotIdx]=null`）后生成 → `itemSnapshot.count=0`；`item.currencyType` 从未写入，回购永远按 `spiritStones` 扣款——铜钱物品出售得铜钱，回购却扣灵石。
- 修复：`_addToBuyback` 接收并保存 `currency`；快照在扣减前生成。

### F-9 邮件系统存档全丢
- `js/core/game-state.js` `collectFullGameState` 从不收集邮件到 `saveData`（无 `mail` 字段），`applyFullGameState` :624 先清空 `xianxia_mail_system` 键，:916-918 又把"内存里上一会话的" `window.MailSystem.saveMailData()` 写回，:1012 再 `loadMailData()` 读回刚写的脏数据。
- 触发：收到一堆飞鸽传书后存档再读档→邮件全没。
- 修复：collect 增加 `mail: window.MailSystem.serialize()`；apply 用 `saveData.mail` 恢复。

### F-10 跨天单次推进只触发一次 onNewDay
- `js/time-system.js:130-137` `advanceTime` 计算 `daysPassed` 后只调一次 `onNewDay(old,new)` 不循环。`js/core/soul-state.js:147` 的 `advanceTime(4320,'重塑肉身')` 一次跨 3 天只发 1 次 `newDay`。
- 后果：漏 2 天的日常任务重置、每日收入、自然恢复、商店刷新、门派资源。
- 修复：按 `oldDay+1..newDay` 循环触发，或 onNewDay 内按天数倍增每日逻辑。

### F-11 一批独立 localStorage 键串档/丢失
- `xianxia_storyline_choices`（`game-state.js:13-46` 键清单缺该键）→ 既不清也不收 → 跨角色剧情抉择串档（B 继承 A 的故事线分支）。
- `xianxia_sect_diplomacy`（:39 在清理清单）→ 清了却不 collect/apply → 每次读档门派外交全清零。
- `xianxia_tracked_quests`（:42 同模式）→ 追踪任务读档丢失。
- `xianxia_npc_records`（:914/1001-1008）→ apply 写脏内存再读回 → 换角色读档后已死/已离开 NPC 记录是上个角色的。
- 修复：全部加入 `CHARACTER_STORAGE_KEYS`，并在 collect/apply 增字段。

---

## 🟠 第二部分：仙侠核心系统空壳化（对照主流的不合理，致命设计缺陷）

### D-1 境界质变系统全为死代码，修仙核心循环沦为纯数字递增【致命】
- `REALM_UNIQUE_EFFECTS`（`js/cultivation/cultivation.js:508-575`）定义 9 境质变（金丹 15%完全格挡、元婴出窍探索+30%、化神领域压制敌 10%、合体法天象地全属性+30%、渡劫全属性+50%），`getRealmBonus()` 已导出，但全工程除 cultivation.js 自身**零调用**——battle.js、combat-stats.js、getDerivedCombatStats 都不读。
- 对照：鬼谷/觅长生每境开新技能槽/新地图/新机制。本游戏升境只涨 maxQi 和寿元上限，玩家肉眼可见的唯一变化是数字变大、敌人变强。
- 修复：把 `getRealmBonus` 接入 `buildPlayerBattleEntity`/`_calculateDamage`；至少给金丹/元婴/化神/合体四境各实装一个战斗内可见机制。

### D-2 灵根五行/功法组合整套死代码【致命】
- `SKILL_ELEMENT_MAP`（30+功法元素标签）、`ELEMENT_INTERACTIONS`（相生相克）、`SKILL_COMBINATIONS`（8 种组合技：阴阳融合/太极领域/万剑归宗/风火连天/冰封万里/不动如山/生生不息/金锋锐气）、`getSkillCombinationBonuses`、`getElementInteraction`、`getRootEffectMultiplier`、`canUseTechniqueByRoots`——**全部零调用**。
- 此外 `cultivationMeditate`（app.js:1320-1335）算了 `rootExpBase=calculateCultivationExpFromRoots(...)`（按主修功法元素取 `getRootSpeedMultiplier`）但**该变量从未参与 essenceGain 计算**，真元产出用 `getRootCultivationBonus()`（breakthrough-system.js:55-62）取**五行平均值** `0.5+avg/100`——金灵根 100 用金系功法 vs 水系功法真元产出完全一样；天灵根(单100)与杂灵根(全20)平均都是20→同为1.2倍。
- 对照：鬼谷灵根决定功法契合度与可学性，是配 build 核心。本游戏灵根选啥战斗里毫无反馈。
- 修复：`essenceGain` 改用 `getRootSpeedMultiplier(roots, 主修功法元素)`；功法元素经 `SKILL_ELEMENT_MAP` 参与 `_calculateDamage` 克制判定；`getSkillCombinationBonuses` 接入 `buildPlayerBattleEntity`；`canUseTechniqueByRoots` 接入装备功法硬门禁。

### D-3 心魔与瓶颈两大标志系统空壳化【致命】
- **心魔字段名不匹配**：`resolveHeartDemonSuccess` 把战胜心魔奖励写 `window._heartDemonBonus`（全局），`calculateBreakthroughRate` 读 `charData._heartDemonBonus`（角色字段）→ 战胜心魔理应 +30% 突破率**永不生效**。另 `_failedBreakthroughs`（breakthrough-system.js:241 写）vs `failedBreakthroughs`（cultivation.js:854 读，无下划线）不匹配 → 恐惧心魔（连续失败3次）永不触发。`breakthroughWithHeartDemon` 函数无任何调用方。
- **瓶颈突破 UI 不可达**：`applyBottleneckEffect()`（cultivation-bottleneck.js:136 设置 `isInBottleneck=true`、递增 `heartDemonChance`）全工程无任何调用方。`applyCultivationBottleneckPenalty` 只直接查 `checkBottleneck()` 给 0.3 倍惩罚，但 `playerBottleneck.isInBottleneck` 永远 false → `attemptBreakBottleneck()`（瓶颈突破交互 UI）永远走"你当前没有遇到瓶颈"分支，5 种解法（高人指点/顿悟/强行突破…）全死。
- 修复：统一字段名到 `charData._heartDemonBonus`/`_failedBreakthroughs`；在突破成功率计算读取；`cultivationMeditate`/每日 tick 调 `applyBottleneckEffect()`；修炼面板加"遭遇瓶颈"入口调 `attemptBreakBottleneck`；`triggerHeartDemon` 接进 `performBreakthrough` 成功/失败分支。

### D-4 飞升/天劫名不副实且结局不可达【致命】
- "渡劫台"地点（`js/location-system.js:868`）只弹文案"渡劫台雷光隐现，你观摩天威，突破感悟加深"，**无任何渡劫战斗/天劫事件**。
- `GAME_ENDINGS` 5 结局，`checkEndingCondition` 要求 `completedMainQuests>=35`，但全工程主线只有约 20 个（quest-system.js 5 + 12-quest-extensions.js 15）。**ascension/retire/chaos 三个结局正常游玩不可达**。"轮回"结局条件 `realm==='炼气' && layer<=0` 也基本不可能（layer 从 1 起）。
- 飞升后无任何可玩尾声——"天界之门为你敞开"之后是黑屏。
- 修复：① 渡劫境界（9层满）实装真正天劫事件链（多波雷劫+心魔劫+可请人护法）；② 结局条件改用"达到渡劫期+完成关键主线节点"；③ 飞升后留最小可玩尾声。

### D-5 NPC 不活，世界是站桩对话树【重要】
- `js/npcs/npc-life-system.js:492` `checkAllNPCLifeSystems` 无任何调度注册（无 GameScheduler.schedule / EventBus.on('newDay') / setInterval / npc-life-actor.tickDay 调用）→ NPC 永不增长年龄、永不垂危、永不主动行为。
- `js/npcs/npc-life-actor.js:151` `executeAction` 的 cultivate 分支仅 5% 概率给 `_cultivationProgress+1`，但全文件无任何代码读取该字段触发 realm/layer 晋升 → NPC 境界永远不晋升，世界整体退化为低境界。
- `js/npcs/npc-daily-life.js:44` `checkNPCMeetings` 用 `window.gameTime.currentDay`（错误路径），正确为 `window.timeSystem.gameTime` → 多半 undefined → `0>0` 永远 false → 相遇永不记录。
- `js/npcs/npc-lineage.js:263` 衣钵继承 `inheritOnDeath` 读 `LINEAGE_INDEX.byMaster[deadNpcId]`，但全文件及武当拜师均无代码向 byMaster 写入 → 师父死亡衣钵继承静默失败。
- 对照：太吾绘卷 NPC 自主修炼突破、结仇寻仇、迁徙通婚、传承衣钵，构成"活的大世界"。本游戏 NPC 像按脚本移动的对话树。
- 修复：newDay 事件注册调 `NPCLifeSystem.checkAllNPCLifeSystems`；NPC cultivate 达阈值调 realm 晋升；修 gameTime 路径；师徒建立时写 byMaster。

### D-6 四轨社交名不副实【重要】
- `js/npcs/npc-system.js:1003-1004` `changeLove()`/`changeFear()` 已定义但全代码库**零调用**；四轨实际只有 affection（主）+ hatred（攻击时）+ favor（请求货币）有作用，love/fear 永远 0。
- `js/npcs/npc-system.js:3489`(handleBranchChoice)、`:3578`(executeSecretDialogueOption) 调 `npc.changeTrust()`，但 NPC 类只有 changeAffection/changeFavor/changeLove/changeFear/changeHatred/changeRespect，无 changeTrust → 选带 trust 效果的分支对话（如 mentor_01"过往经历"→trust_path 选项 +2 trust）→ `TypeError: npc.changeTrust is not a function`，对话效果静默失败。关系字段也无 `trust`。
- 修复：补 `changeTrust(amount)`（含 0-100 clamp 与 updateRelationship），relationship 构造器初始化 `trust:0`；或接入 love/fear 否则停止宣称四轨。

### D-7 双修/合击虚标【重要】
- `formBond`（app.js:7337-7361）只设 `currentCharData.bonds`（玩家侧），不调 `npc.setFlag('dao_companion')`；`executeEmotionInteraction('bond_dao')`（npc-system.js:2940）只设 NPC flag，不写 `currentCharData.bonds`。→ 用 formBond 走 UI：战斗有加成但 NPC 对话不识别道侣；用深谈 bond_dao：NPC 识别关系但 `getBondBonuses()` 读不到 bond 战斗无加成。
- `js/battle.js:602-608`/`636-642` bond 加成只在 `this.type==='player'` 时应用，NPC 战斗者无加成。
- `js/sects/dao-companion-deep.js` 仅 28 行 stub，`_companionData.lastInteraction` 初始化 0 后再无赋值，needs 累加但无代码消费。合击/双修战斗钩子全缺。
- 修复：两路径统一（formBond 补 setFlag，bond_dao 补写 bonds）；battle.js 加 NPC 侧 bond 检查；实装双修/合击或移除宣传。

### D-8 赠礼可无限刷好感【重要】
- `js/app.js:5564` `confirmGiftToNPC` 先 `npc.changeAffection(totalGain)`（3-20），又调 `npc.recordPlayerAction('gift')` → `updateRelationshipFromAction('gift')`（npc-system.js:842-856）再 `changeAffection(3)`。每件礼物额外多 +3（送灵石 gain=3 实得 +6，送功法 gain=20 实得 +23）。
- `confirmGiftToNPC`（app.js:5518）无每日送礼上限、无同物递减；`getGiftMultiplier()`（npc-system.js:1107-1111 贪婪×0.7/慷慨×1.3/寡言×0.8）定义但从不调用。→ 17 颗灵石即可 0→100。
- 对照：主流仙侠每日上限+递减+特质修正。本游戏三者全无。
- 修复：加每 NPC 每日送礼上限（如 3 次/日）、同物递减、调 `getGiftMultiplier` 应用特质修正；移除 `updateRelationshipFromAction` 的 gift 分支重复 changeAffection。

### D-9 文本叙事密度远逊主流【重要】
- 核心 NPC 仅 3 个有分支对话树（各 5-6 节点），主线仅 20 步，日常事件城市/野外/门派各 6 条。全工程文本万级字数，远不到鬼谷/觅长生的百万级。对话高度模板化（5 句×7 档好感池）。
- 修复：每门派至少补 1 条专属支线（32 派现仅武当有深度）；核心 NPC 分支树扩到全部特殊 NPC；突破/渡劫/入魔等关键节点加成段叙事（scene-performance.js 打字机框架已存在却几乎没用）。

### D-10 成长反馈缺乏质变，升境后世界无变化【一般】
- 升境只解锁寿元上限和数字，无"金丹期开放新地图/新功法槽/新设施权限/新敌人档位"可见解锁（门派藏经阁分层靠职级非境界）。
- 修复：每境绑定至少一项可见解锁——炼气开游商、筑基开御剑旅行、金丹开洞府自营、元婴开离体探索、化神开领域技、合体开法身、大乘开天机推演、渡劫开天劫台。

### D-11 经济/资源循环快速通胀【一般】
- 灵石来源众多（每日自动收入 50金+10灵石/采矿/搜刮/竞技场/游商），消耗口少。强化/合成消耗低，缺终端 sink（洞府扩建仅 5 座一次性）。
- 修复：加"灵脉维护"周期性灵石税；高阶强化烧大量灵石+灵材；拍卖行真实竞价通胀锚点。

### D-12 数值后期断崖【一般】
- `REALM_CONFIG` 真元 base 从炼气 30 指数增长到渡劫 24 亿，`getEssenceGainByRealm` 只从 5 线性到 1000。渡劫期一天打坐约产 35 万真元，需 ~6857 天；寿元 15000 年≈5475 天 → **真元量级在寿元内不可达**。
- 修复：`getEssenceGainByRealm` 改指数曲线；秘境奖励按境界缩放；闭关数十年（long-retreat.js 已存在）作后期主要修为来源。

### D-13 开局多样性不足 + 新手引导缺失【一般】
- 开局可调灵根/变异/性别/属性/门派，但门派日常体验高度同质；二周目只重置年龄不继承前世。进入游戏 13 个导航项+22 部位躯体图+一排状态条全量铺开，无教程箭头。
- 修复：每门派独有入门事件链；二周目继承前世 1 门功法+1 NPC 羁绊；加"入门三件事"引导任务链逐步解锁面板。

---

## 🟡 第三部分：各系统详细 BUG 清单

### 一、战斗系统（battle.js 等）

| 级别 | 问题 | 位置 |
|---|---|---|
| 🟠P1 | defensive 守御"下玩家一击×0.6"未实装：`_guardTurns` 置 1 后全库无读取点，守御=白送一回合 | battle.js:2086/2160 |
| 🟠P1 | 难度危急窗口对循环/缺氧失效：`initPhysiology` 写死 `criticalRounds:50`，读取 `phys.criticalRounds \|\| _getDifficultyCriticalTurns()` 因 50 真值短路，normal 35/hard 20 被忽略 | battle.js:356/944 |
| 🟠P1 | `getDefense` 漏接境界不稳×0.9（getAttack/getSpeed 都接了），且该代码块被错放 `_consumeFormationBuff`（676-681）引用未定义 `defense` 抛 ReferenceError 被吞 | battle.js:626-657/676-681 |
| 🟠P1 | 野兽技能被元素技能覆盖（beast 第一链赋值{爪击/撕咬/猛扑}被第二链 else 元素分支无脑覆盖成{元素之力}，beast 分支死代码） | battle.js:1795-1823 |
| 🟠P1 | 队员战斗中耐久/血量损伤无法回写 PartyMember.health：`pm.health` 始终是战斗初值，队员被打残但存活→面板显示满血，连场战斗永远满血直到阵亡 | battle.js:1953/2854-2861 |
| 🟠P1 | 敌人遁逃分支不调 `onBeastBattleEnd`，灵兽状态可能错乱 | battle.js:2864-2871 |
| 🟠P1 | 玩家败北早 return 跳过 party 同步循环，存活队员伤情不回写 | battle.js:2842-2852 |
| 🟠P1 | 招式 damageType 被武器类型无条件覆盖（`resolveWeaponDamageType` 永返非空），元素招式（火/冰/雷）退化为武器物理类型，亡灵/构装对该元素额外伤害永不触发 | battle.js:2028-2034 |
| 🟡P2 | 防御系数 `def*0.3` 过低 + 要害 vitalMul 双向放大，防御 build 几乎无效，高难度玩家比敌人死更快 | battle.js:2579/743-750 |
| 🟡P2 | 敌人 AI 单一：enemyTurn 只遁逃/自救/守御/普通攻击，所有招牌技全靠命中被动触发，敌人手感雷同 | battle.js:2063-2285 |
| 🟡P2 | "护法"名误触 DUNGEON_GUARD 掉落池（`name.includes('护法')`，但武僧亚型前缀就是['武僧','护法']），野外护法按秘境守卫表掉高 tier 奖励 | loot-system.js:364 |
| 🟡P2 | 暴击/破甲上限不一致：penetrate 招式加成 `Math.min(80,...)` 后被 `_calculateDamage` `Math.min(40,...)` 砍回 40，80 上限是死码；crit 无 aStats 路径不 clamp 上限 | battle.js:2759/2577/2799/2800 |
| 🟡P2 | `pickItems` 运算符优先级 bug：`level>=20 && poolId==='boss' \|\| ...` 因 && 优先致 boss 额外 rare 池死码 | loot-system.js:422-424 |
| 🟡P2 | 部位耐久双重惩罚过苛：per-part 线性扣减 + hand/foot<30 额外乘法（×0.8/×0.7）叠加，一残即废雪崩 | battle.js:162-186 |
| 🟡P2 | `hourlyRecovery` 野兽血量 clamp 到 100，但野兽 initPhysiology 给的是 150 → 野兽恢复永远到不了 150 | battle.js:1355 vs 367-370 |
| 🟡P2 | 反击/反震可能击杀攻击者但流程不立即结束，日志自相矛盾 | battle.js:2507-2512/2826-2828 |

### 二、修炼/突破/境界（cultivation* 等）

| 级别 | 问题 | 位置 |
|---|---|---|
| 🟠P1 | 灵根元素匹配对真元产出完全无效（rootExpBase 算了不用，essenceGain 用平均根 getRootCultivationBonus） | app.js:1320-1335; breakthrough-system.js:55-62 |
| 🟠P1 | REALM_UNIQUE_EFFECTS 从未接入任何战斗/采集/修炼数值（见 D-1） | cultivation.js:508-575 |
| 🟠P1 | 恐惧心魔字段名不匹配 `_failedBreakthroughs` vs `failedBreakthroughs`（见 D-3） | cultivation.js:854; breakthrough-system.js:241 |
| 🟠P1 | 瓶颈突破 UI 不可达：`applyBottleneckEffect` 无调用方，`attemptBreakBottleneck` 永远走"无瓶颈"分支（见 D-3） | cultivation-bottleneck.js:136/169/301 |
| 🟠P1 | 大境界仪式成功率与标准突破两套公式：仪式 `0.8-currentIndex*0.05` 完全忽略历练值，失败不清真元/不退灵石材料/不增 _failedBreakthroughs，可反复白嫖 | breakthrough-ritual.js:195-206/543-604 |
| 🟠P1 | 固定时长闭关无寿元保护：`startLongRetreat(days)` 不查 deathDay，闭关循环 advanceTime(1440) 触发 newDay→updatePlayerLifespan 只弹模态不停止 runRetreatLoop，可闭关至死后 | long-retreat.js:252-258/206-224 |
| 🟠P1 | 残魂态仍可修炼功法：`cultivateSkill`（功法熟练度修炼）未调 `checkSoulBlock`（cultivationMeditate/runRetreatLoop 都调了） | cultivation.js:331-365 |
| 🟡P2 | `getRootSpeedMultiplier` 区间过窄 `0.8+value/200`，天灵根(100) vs 废灵根(0) 仅 1.8 倍差，主流差异常 3-5 倍 | cultivation.js:1098-1106 |
| 🟡P2 | `getRootCultivationBonus`（平均）与 `getRootSpeedMultiplier`（单元素）两套灵根公式并存且语义冲突 | breakthrough-system.js:55-62 vs cultivation.js:1095 |
| 🟡P2 | PROFICIENCY_LEVELS 等级名重复（level2 与 level5 都叫"炉火纯青"，level4 与 level8 都叫"出神入化"） | cultivation.js:5-15 |
| 🟡P2 | 熟练度可纯靠 `addProficiencyExp` 自动升级，`breakthroughProficiency`（手动突破+70%成功率）形同虚设 | cultivation.js:151-179 vs 187-244 |
| 🟡P2 | 知识层（heard→learned→mastered）未接入功法修炼 gate：`cultivateSkill` 不查 `KnowledgeSystem.canPractice`，"听闻"级即可修炼涨熟练度，绕过秘籍学习 | cultivation.js:331; knowledge-system.js:170-172 |
| 🟡P2 | 仪式失败不增 `_failedBreakthroughs`，失败补偿机制不累积 | breakthrough-ritual.js:543-604 |
| 🟡P2 | 闭关每次出关真气/精力全回满，可当免费满血站 | long-retreat.js:231-232 |
| 🟡P2 | 寿元初始化 `remainingDays=0`，首日 newDay 前显示"余0天" | lifespan-system.js:18-26 |
| 🟡P2 | `cultivateQi`（breakthrough-system.js）是未接 UI 的死路径，与 cultivationMeditate 功能重叠 | breakthrough-system.js:274-308 |

### 三、经济/物品/合成/装备

| 级别 | 问题 | 位置 |
|---|---|---|
| 🔴P0 | 元婴/化神突破材料 ID 写错（见 F-2） | breakthrough-ritual.js:101-102 |
| 🔴P0 | 合成成功必崩（见 F-3） | crafting.js:961 |
| 🔴P0 | 回购物品货币错配 + count=0 快照（见 F-8） | enhanced-shop.js:788-816 |
| 🔴P0 | Shop.sellItem 固定 50% 绕过 TradeService 可刷钱（见 F-7） | enhanced-shop.js:146-174 |
| 🔴P0 | markForSale 部分标记可突破 maxSlots（见 F-7） | inventory.js:1162-1165 |
| 🔴P0 | 标记出售的装备仍可装备/丢弃（见 F-7） | inventory.js:1234/1469 |
| 🟠P1 | 灵石/铜钱双源不同步：旅行/建筑写 currentCharData、卖物/购买写 inventory.currency，DataManager 优先读 inventory → 旅行/建筑扣费可能"免费"，存档以 currentCharData 为准则丢收益 | inventory.js:1630/1866; enhanced-shop.js:167/253 |
| 🟠P1 | `ShopManager.openShop` 跨天清理回购调 `this.clearBuyback`（TradeService 方法非 ShopManager）崩溃 | enhanced-shop.js:469 |
| 🟠P1 | `Shop.buyItem` 回退入包路径写裸对象（无 uid/无 getTemplate），破坏后续 getFilteredSlots/showItemMenu/useItem | enhanced-shop.js:236 |
| 🟠P1 | `refreshInventory` 单独调用时 `_basePriceMultiplier` 未初始化，priceMultiplier 累积漂移 | enhanced-shop.js:314 |
| 🟠P1 | 拍卖 `saleChance` 用 `template.price` 基准，无价物品挂任意价都 85% 成交（无价可堆叠物套利） | auction-service.js:69 |
| 🟠P1 | 拍卖流拍退物失败时物品永久卡托管 + 上架费不退未提示 | auction-service.js:100/369 |
| 🟠P1 | `showBuyQuantityDialog` 全局无调用方，购买数量选择是死代码（玩家无法批量购买） | inventory.js:1804 |
| 🟠P1 | 装备对比弹窗不含强化/精炼属性，已强化+10 旧装备显示成基础属性，换装后属性反降 | inventory.js:1000-1001 |
| 🟠P1 | 生活技能对合成成功率/品质/耗时加成全失效：读 `recipe.skill`（单数）但配方字段是 `requiredSkills`（复数），两处取值恒 null | crafting.js:798-800/936-941 |
| 🟠P1 | 产物品质对单数产物（丹药/绝大多数配方）形同虚设：`Math.max(1, floor(1*0.8))` 拉回 1，且品质不写回物品实例，"杰出丹"="劣质丹" | crafting.js:943 |
| 🟠P1 | 强化转移可突破 maxLevel：`toItem.enhancementLevel += transferLevel` 无 `Math.min(maxLevel,...)` 钳制 | enhancement.js:595 |
| 🟠P1 | 转移等级下限让"50%转移"在低强化时变 100%：源+1 时 floor(0.5)=0 被拉到 1 | enhancement.js:592-593 |
| 🟠P1 | 元婴丹/化神丹等"成功率+X%"丹 bonus 字段写而不读（`_foundationBonus`/`_primordial_bonus` 等只写不读），用了无反应 | inventory.js:407-417 |
| 🟠P1 | 8 种突破丹 `subtype:breakthrough` 全是死物品（useItem 拦截"只能突破界面用"但无界面消费）+ 瓶颈服丹调 `inventory.removeItem`（未挂该方法）不消耗 | inventory.js:242-247; cultivation-bottleneck.js:280 |
| 🟠P1 | 装备栏 5 个槽永久空置：neck/offHand/ring2/acc1/acc2 无任何物品定义这些 slot 值，第二枚戒指永远塞 ring1 | equipment.js:305-318; inventory.js:1249 |
| 🟠P1 | 强化/耐久挂全局模板非 per-instance：equipItemFromInventory 存模板对象本身，精炼 mutate 全局模板 → 背包第二把同款玄铁剑也显示+5，同款甲耐久掉光仓库里同款也"耐久0" | inventory.js:1277; enhancement.js:230-256; battle.js:283-288 |
| 🟡P2 | `CRAFT_QUALITY.FAIL`（chance 0.3）是死代码，品质循环直接跳过 | crafting.js:15-20/919-931 |
| 🟡P2 | `pickItems` 运算符优先级 bug（同战斗表） | loot-system.js:422-424 |
| 🟡P2 | 亡灵/构装/元素携带物表只有 common 池，高等级也只掉"凡品" | loot-system.js:265-305 |
| 🟡P2 | `EXTENDED_LOOT_TABLES` 与 `getExtendedLoot` 孤儿模块，主掉落表从不调 getExtendedLoot，扩展表新增物品可能永远不掉 | items-extended/09-loot-sources.js:37-78/128-150 |
| 🟡P2 | `openChest` 不校验 `implemented`，可能发放占位物品 | items-extended/09-loot-sources.js:114-125 |
| 🟡P2 | 强化失败固定 30% 降级，"保底"名实不符（保底只加成功率不防降级） | enhancement.js:63-72 |
| 🟡P2 | `costGold` 实际扣铜钱（copper），命名误导（本游戏无 gold 货币） | enhancement.js:13/23/34/42 |
| 🟡P2 | `determineEnemyType` 纯靠名称关键词，缺 species 时分类漂移（"龙王"无 species 当人类 BOSS 掉人类兵器） | loot-system.js:359-363 |
| 🟡P2 | `showItemMenu` 用未定义 `templateId`（隐式全局） | inventory.js:753 |
| 🟡P2 | `Shop.useCredit`/`repayCredit` 引用未声明 `playerDebt`/`playerGold`，赊账即崩 | enhanced-shop.js:281/288 |
| 🟡P2 | `generateUID` 同毫秒碰撞风险 | inventory.js:60 |
| 🟡P2 | `markedForSale` 双源（Set+slot 字段）一致性脆弱，旧存档可卡住 | inventory.js:1194/1202/1533 |
| 🟡P2 | 拍卖 NPC 拍品价格上限随玩家灵石线性增长（越富越贵），反直觉 | auction-service.js:171 |
| 🟡P2 | items.js EQUIPMENT_SLOTS（11项 snake_case）与 equipment.js equipmentSlots（12项 camelCase）两套定义对不上，前者全仓无消费方 | items.js:25-37 vs equipment.js:305-318 |
| 🟡P2 | `wpn_feng_sword` 无 slot 字段无法装备且分类漏入 | items-extended/13-missing-ids.js:172-187 |
| 🟡P2 | `vitality_max` 处理仅 console.log 死分支 | inventory.js:376-378 |

### 四、NPC/社交/门派/感情线

| 级别 | 问题 | 位置 |
|---|---|---|
| 🔴P0 | 队伍原型重写致队友无敌+方法丢失（见 F-4） | party-system.js:1071 |
| 🔴P0 | 爱情线冷却不存档（见 F-5） | npc-system.js:2889/1256-1272 |
| 🔴P0 | discipleState 存档丢字段（见 F-6） | sects-system.js:1285-1298 |
| 🟠P1 | 赠礼好感双重计数 + 无上限无递减 + 特质修正死代码（见 D-8） | app.js:5564/5518; npc-system.js:842-856/1107-1111 |
| 🟠P1 | `changeTrust` 被调用却从未定义，分支对话 trust 选项直接 TypeError（见 D-6） | npc-system.js:3489/3578 vs 988-1016 |
| 🟠P1 | 绯泪霜烬/修罗结局不可达：`xl_event_033` 终章只有 4 选项无 `_negativeChoiceCount>=5` 兜底分支（对比百花谷 bh_event_014 有花冢兜底） | npc-personal-events.js:783-833 |
| 🟠P1 | 道侣/结拜两路径状态不一致（见 D-7） | app.js:7337-7361; npc-system.js:2940 |
| 🟠P1 | 战后关系结算 `processPostBattleRelationships` 多处错配：`member.isAlive` 当属性用恒 truthy、调 `member.recordPlayerAction`（PartyMember 无此方法）、读 `battleLastTakenDamage` 而原型写 `battleCurrentAmount` | party-system.js:1033/1056/1060 |
| 🟠P1 | 叛门后 `_masterId` 未清除，新门派无法拜师（leaveSect 的 Object.assign 不含下划线字段，joinSect 叛门只写 _leftMasters 不清 _masterId） | sects-system.js:244-249/339-349 |
| 🟠P1 | 修罗宫 karma<-50 女性"高分选侍妾"实际入为杂役（evalResult 不含 isConcubine 传给 joinSect 设 rank=7） | sect-join-flow.js:2017-2023/513-514 |
| 🟠P1 | 藏经阁 `addSkillExp` 动作是空操作（只 push 提示文案不写数据） | sect-facilities.js:638-642 |
| 🟠P1 | 丐帮净衣旬捐/污衣三戒检查仅在 `openGbFactionPanel` 内调用，每日循环不调 → 不开面板无降袋/除名/违戒处罚 | sects-deep-ui.js:714-715; sect-internal.js:52-100 |
| 🟠P1 | NPC 生活系统无调度注册（见 D-5） | npc-life-system.js:492 |
| 🟠P1 | NPC `_cultivationProgress` 永不触发突破（见 D-5） | npc-life-actor.js:151 |
| 🟠P1 | 衣钵继承 `inheritOnDeath` 永远返回 null（byMaster 索引从未填充） | npc-lineage.js:263 |
| 🟡P2 | `love`/`changeFear` 零调用，四轨名不副实（见 D-6） | npc-system.js:1003-1004 |
| 🟡P2 | `updateFavorMax()` 定义从不调用，favorMax 永远 50 | npc-system.js:1014 |
| 🟡P2 | 每日好感衰减只覆盖 2 个核心 NPC（硬编码修罗宫/百花谷） | npc-personal-events.js:1797 |
| 🟡P2 | 赠礼特质修正（贪婪/慷慨/寡言）从不调用 | npc-system.js:1107-1111 |
| 🟡P2 | 深谈 SUB_AFF_GATE 不足惩罚路径跳过 `markTalked`，不消耗每日次数 | social-content.js:975-984/995 |
| 🟡P2 | 感情线 greet 自动触发可刷屏（无 per-greet 冷却） | npc-system.js:2283; baihua-personal-events.js:166-171 |
| 🟡P2 | `formBond` UI 路径未对温蘅/绯泪禁用，可绕过感情线直接拿战斗加成 | app.js:7337-7351 |
| 🟡P2 | 战斗 bond 加成只对玩家生效，NPC 侧无加成；合击/双修钩子全缺 | battle.js:602-608/636-642 |
| 🟡P2 | `executeEmotionInteraction` 中 `npcNotCoLocated` 重复检查（2882/2886） | npc-system.js:2882/2886 |
| 🟡P2 | 问答分数中途关弹窗不重置，重开带旧值累加 | sect-join-flow.js:267 等 |
| 🟡P2 | 掌门大殿擅闯计数每日重置，屡犯加重不跨日 | sect-facilities.js:757-781/469-473 |
| 🟡P2 | 无设施定义 cooldownMinutes，冷却代码路径永不触发（死代码） | sect-facilities.js:559/804 |
| 🟡P2 | RANKS.contributionReq 与 COMMON_RANKS.promoteCondition 数值矛盾（两套数据并存） | sects-system.js:27-34; sects-deep-data.js:9-48 |
| 🟡P2 | 亲传弟子(rank3)镇派层准入两入口矛盾（canAccessScriptureTier 滤掉但 openSectLibraryPanel 可翻阅） | sects-system.js:1241; sect-facilities.js:1000/1051 |
| 🟡P2 | 叛门后 `_gbFaction` 残留，重入丐帮只能走转脉补 800 灵石 | sects-system.js:339-349 |
| 🟡P2 | move 动作传闻"出发地"被覆盖（先赋值 npc.location 再读作出发地） | npc-life-actor.js:127 |
| 🟡P2 | `checkNPCMeetings` 引用错误 gameTime 路径致相遇永不记录（见 D-5） | npc-daily-life.js:44 |
| 🟡P2 | 忠诚度(loyalty)为死属性（默认 50，UI 显示，无任何修改或行为影响） | party-system.js:47 |
| 🟡P2 | 战斗中倒下队员不自动移出，形成幽灵成员 | party-system.js:1028 |
| 🟡P2 | `restMember` 可无条件复活 0 血队员 | party-system.js:457 |
| 🟡P2 | 道侣需求系统为空壳（lastInteraction 初始化后不再赋值，needs 无消费） | dao-companion-deep.js:12 |
| 🟡P2 | 武当拜师用错误 id 查 NPC（`getNPC('wudang_'+master.name)` 但 masters id 形如 wd_master_2），好感加成永不生效 | sect-wudang-deep.js:199 |
| 🟡P2 | `wudangCompleteTask` 未判空 messages | sect-wudang-deep.js:324 |
| 🟡P2 | `isAncestorOf` 只沿 parents[0] 攀升，母系血脉漏检 | npc-lineage.js:76 |
| 🟡P2 | 借物服务在 NPC 无背包时凭空创建物品（返回 pill_small_recovery 且 source:null，归还时 NPC 净赚 1 颗本没有的丹药） | npc-borrow-service.js:64 |
| 🟡P2 | 借物逾期仅一次性 -好感，可无限期赖账 | npc-borrow-service.js:37 |
| 🟡P2 | sect-specialties.js applyEffect 内裸引用全局函数（applyBuff/currentCharData/addItem 无 window 前缀） | sect-specialties.js:22/61/192 |
| 🟡P2 | sect-visit.js 依赖未定义的 SECT_FACILITY_ACCESS（所审 10 文件无定义，ID 体系与 sect-facilities.js 不同） | sect-visit.js:77/112 |

### 五、任务/秘境/地图/奇遇

| 级别 | 问题 | 位置 |
|---|---|---|
| 🔴P0 | 扩展任务未注册到 QuestRegistry（见 F-1） | items-extended/12-quest-extensions.js:351-383; quest-system.js:345-348 |
| 🔴P0 | 主线目标事件桥断链：location:visited/npc:talked/dungeon:completed 从不 emit、cultivation:breakthrough 错位、9 种 objective 无 handler（见 F-1） | quest-system.js:1411-1418; event-bus.js:66-68; breakthrough-system.js:232 |
| 🔴P0 | 主线实际 20 步但结局要求 ≥35，5 结局全不可达（见 F-1） | quest-system.js:70-163/612/816; 12-quest-extensions.js:244-324 |
| 🟠P1 | 地标奖励 `_claimed`/`_hiddenFound` 不持久化 → 刷新页面后重复发放 | landmark-explore.js:118-132/134-140 |
| 🟠P1 | 地标隐藏条件 `realm===cond.realm` 精确匹配 → 进阶后永不可触发（应 isRealmAtLeast） | landmark-explore.js:249-257 |
| 🟠P1 | 地标 skill/title 奖励未接入知识系统 → "领悟古剑诀"实际无任何效果 | landmark-explore.js:219-224/226-231 |
| 🟠P1 | `updateQuestObjective` 旧路径 kill 目标字符串 vs 敌人对象错配（`obj.target !== extraData.target`，降级路径传整个敌人对象） | quest-system.js:927/901 |
| 🟠P1 | `updateQuestObjective` 无 `obj.completed` 守卫 → 超额计数（进度条溢出） | quest-system.js:919-939 |
| 🟠P1 | `building-effects.js:241` 误用 updateQuestObjective API（把 'sparring' 当 questId 传）→ daily_003 切磋永不可完成 | building-effects.js:241 |
| 🟠P1 | kill 目标依赖敌人命名匹配，部分击杀目标无对应敌人（魔教教主/长老/护法、宗门弟子、妖兽王、邪修在敌人生成表无对应）→ 永不可达 | quest-system.js:1360-1369 |
| 🟠P1 | `enterSecretRealm` 回退分支是死代码（openDungeonEntrance 恒为 function，"上古功法/守护兽/灵泉/宝藏"随机奖励分支永不执行），奇遇"秘境之门"实际只弹付费副本入口 | event-system.js:686-706 |
| 🟠P1 | scenario-engine 关闭弹窗即清空进度（closeScenarioModal 调 cancel() 删 progress），续关路径形同虚设 | scenario-engine.js:337-341/154-159 |
| 🟠P1 | scenario-engine `_check` 用 `realmLevel` 数值，角色数据用 `realm` 字符串 → 境界门控永远 disabled | scenario-engine.js:165-167 |
| 🟠P1 | 秘境通关奖励可重复刷取（通关后 `dungeonProgress[id]=1` 重置，无一次性锁/冷却，可无限刷 100*maxFloor 灵石+物品） | app.js:7106/7271 |
| 🟡P2 | `event_old_chest` 空奖励（三次随机全失败 ~31.5% 返回"什么都没有"，文案仍显示"获得了：什么都没有"） | event-system.js:600-615 |
| 🟡P2 | 多处灵石校验只查 inventory.currency 漏查 currentCharData（event_ancient_altar/event_bandit_ambush pay/daily street_vendor/roadside_traveler） | items-extended/11-event-extensions.js:11/21; daily-events.js:206-207/230-231/493-494 |
| 🟡P2 | `learnRandomSkill` 无 KnowledgeSystem 时不去重，不校验境界要求 | event-system.js:844-862 |
| 🟡P2 | 秘境两套通关/下一层提示逻辑不一致（原生 confirm vs showConfirm；通关奖励物品也不同：7104 恒给 iron_sword vs 7269 随机） | app.js:7115 vs 7278-7288; 7104 vs 7269 |
| 🟡P2 | randomMap 同格多实体堆叠（建筑+人+兽+特殊NPC 可同格，renderMap 只显示首实体图标+角标，建筑格上野兽仍可 ambush） | randomMap.js:170-243/334-358 |
| 🟡P2 | randomMap 水域困死风险（东南海域 WATER 权重40%，3x3 外圈可能全水，玩家被困 9 格） | randomMap.js:259-268 |
| 🟡P2 | randomMap.onCellClick 非相邻格用阻塞式 alert（与其他 toast 风格不一致） | randomMap.js:461 |
| 🟡P2 | tryBeastAmbush 软循环（玩家逃离后 beast 留在玩家格，移动后变相邻再 30% 追击，可连续多次） | randomMap.js:477-518 |
| 🟡P2 | daily-events stone_stele 调 `window.unlock`（不存在，应为 KnowledgeSystem.unlock），try/catch 静默吞，功法听闻不生效 | daily-events.js:534-536 |
| 🟡P2 | syncQuestTargetMarkers 模糊匹配过松（双向子串，短 locName 如"城"匹配到"修仙城"）；MapMarker.deserialize 不恢复 unlockCondition/tooltip/relatedLocation | map-markers.js:821/169-183 |
| 🟡P2 | scenario-engine 节点跳转死路无报错（choice.next 指向不存在节点静默结束） | scenario-engine.js:102-109 |
| 🟡P2 | event_sky_treasure report 选项无条件给贡献 200（不校验 isInSect） | items-extended/11-event-extensions.js:12 |
| 🟡P2 | daily-events 冷却存 localStorage，开新游戏+时间重置而旧冷却未清，早期误判冷却中 | daily-events.js:864-869/893-894 |

### 六、存档/状态/时间/全局

| 级别 | 问题 | 位置 |
|---|---|---|
| 🔴P0 | 邮件系统存档全丢（见 F-9） | game-state.js:28/916-918/1011-1020 |
| 🟠P1 | 跨天单次推进漏触发 onNewDay（见 F-10） | time-system.js:130-137 |
| 🟠P1 | xianxia_storyline_choices 不清不收致跨角色串档（见 F-11） | game-state.js:13-46; storylines-v2/batch1.js:17 |
| 🟠P1 | xianxia_sect_diplomacy 清却不收致读档丢门派外交（见 F-11） | game-state.js:39; sect-visit.js:508-548 |
| 🟠P1 | xianxia_tracked_quests 同模式致追踪任务读档丢失（见 F-11） | game-state.js:42; quest-system.js:1067-1079 |
| 🟠P1 | xianxia_npc_records 写脏读脏致生死记录串档（见 F-11） | game-state.js:914/1001-1008 |
| 🟠P1 | DataManager 双源不同步：claimDailyIncome 只写 inventory.currency 不写 currentCharData，collectFullGameState 取 charData.spiritStones（旧值）→ 存档读档两源背离 | app.js:5899-5905; game-state.js:168-169 |
| 🟠P1 | resetWorldForNewGame/deleteSave 漏清 xianxia_storyline_choices 与 xianxia_sect_diplomacy（不在 CHARACTER_STORAGE_KEYS） | game-state.js:13-46; app.js:2522-2542 |
| 🟡P2 | onNewMonth 仅打日志无业务钩子，onNewYear 未实现 | time-system.js:139-150/364-366 |
| 🟡P2 | onNewDay 在 gameTime.currentDay 更新前触发，订阅者拿到旧天号 | time-system.js:131-137 |
| 🟡P2 | recoveryMinuteAcc 不随读档重置，跨会话零碎时间恢复可能多触发一次 | time-system.js:37/85-94 |
| 🟡P2 | _newDayListeners push 无去重，重复订阅泄漏 | time-system.js:348-350 |
| 🟡P2 | 存档槽超 10 静默丢最旧 + importSave 不去重（反复导入同名挤掉其他角色槽） | app.js:2251-2253/2350-2352 |
| 🟡P2 | loadSaveData 扁平摘要回退路径在 xianxia_save 异名时静默串档（内存上一会话背包原样保留） | app.js:2385-2395 |
| 🟡P2 | applyFullGameState 对 saveData.inventory 存在但 global.inventory 未初始化时静默跳过 | game-state.js:677 |
| 🟡P2 | DOMContentLoaded 标题页初始化从 localStorage 读世界事件/城市临时等独立键，新游戏前若 UI 提前渲染显示上一角色数据 | app.js:5191-5196 |
| 🟡P2 | RewardService maxQi 兜底 1000 与全局默认 100 不一致，低境界角色 qi 上限被错算 | reward-service.js:91 |
| 🟡P2 | GameScheduler.deserialize 在处理器未注册时保留任务，下一次 time:advanced 集中爆发（时序错乱） | game-scheduler.js:100-106/130-132 |
| 🟡P2 | EventBus off 无法移除匿名闭包订阅，长期累积 | event-bus.js:34-39 |

### 七、UI/交互/反馈

| 级别 | 问题 | 位置 |
|---|---|---|
| 🟠P1 | debug-panel addAllItems 用未声明 `count/errors`（实际变量是 c/e），提示恒"成功 undefined 个物品undefined" | debug-panel.js:601 |
| 🟠P1 | showEffect 粒子 var 闭包陷阱（var endX/endY 函数级作用域，50ms 后闭包读到最后一轮值，12 粒子全飞同一点） | ui-immersive.js:30-43 |
| 🟠P1 | showEventDialog 无关闭路径 + 固定 id 重复堆叠（无 choices 时玩家无法关闭只能刷新；连续两事件第二个永远关不掉） | event-system.js:498-535 |
| 🟠P1 | typewriterEffect 无取消机制，快速点"继续"导致文本乱码（新旧两条 setTimeout 链并发追加字符） | scene-performance.js:110-127/358 |
| 🟠P1 | 角色创建无校验：属性可手输 999/-5（HTML min/max 仅软约束），灵根各自 Math.round 取整总和可能≠100 | app.js:192-308 |
| 🟠P1 | 新角色 health/energy/qi/mood/maxXxx 未在 collectCharacterData 初始化，靠到处 `??100` 兜底（mood 尤其脆弱多处无兜底） | app.js:255-308 |
| 🟡P2 | closeScenePerformance 不取消打字机 setTimeout，旧链继续写已分离节点 | scene-performance.js:435-453 |
| 🟡P2 | switchSubTab 无空指针保护（subId 无对应元素直接 null.classList 抛错） | app.js:789-798 |
| 🟡P2 | showItemMenu 弹窗可堆叠（每次新建 append 无前置清理，连续点两物品两个 z-50 叠加） | inventory.js:829-839 |
| 🟡P2 | showMessage toast 无上限累积，战斗日志/连发事件可挤出屏外 | global-utils.js:27-50 |
| 🟡P2 | fame-bar 宽度=`fame+'%'` 无 clamp，fame>100 溢出 | app.js:5317 |
| 🟡P2 | updateCharacterStatus 对 karma/order 系列元素无 null 守卫（与其余字段风格不一致） | app.js:5303-5308 |
| 🟡P2 | talkToNPC 强制移除所有 `.fixed.inset-0` 覆盖层（命中几乎所有 modal，会误关合法弹窗如设置面板） | app.js:5450 |
| 🟡P2 | updateRootUI 段落标签用 `charAt(0)` 取当前 textContent 首字符（脆弱） | app.js:179 |
| 🟡P2 | 灵根数字输入联动可产生负值中间态（sumOthers===0 时 `-diff/4` 设负，后兜成 0，但中间 width='-X%'） | app.js:154-155 |
| 🟡P2 | 邮件 replyMail 不刷新列表，deleteMail 硬编码切回 inbox 标签 | mail-system-ui.js:270-279/260-268 |
| 🟡P2 | 邮件列表渲染有死代码（dt 计算后未使用） | mail-system-ui.js:180-181 |
| 🟡P2 | showEventDialog 无 overlay 点遮罩关闭/无 ESC/无关闭按钮 | event-system.js:500-535 |
| 🟡P2 | switchPanel 的 fade-in 类只加不去（切走只加 hidden 不移除 fade-in，再切回动画不重播） | app.js:724 |
| 🟡P2 | relations-panel changeRelationsPage 不复用过滤/搜索状态（总页数按全集算与过滤后列表不一致） | relations-panel.js:242-257 |
| 🟡P2 | relations-panel 卡片 onclick 用单引号转义不充分（id 含反斜杠/双引号会断串） | relations-panel.js:172-175 |

---

## ✅ 第四部分：站得住的部分（公道话）

- **战斗**：22 部位按钮全绑定、closeBattle 恢复链完整、人体 SVG 与耐久数字同步、装备对比同槽空时已用 showMessage 兜底。
- **存档**：StateRegistry 机制本身设计合理（export/import/reset 闭环 + 重复注册告警），问题在于大量老系统没接入它、也没在 GameState 显式 collect/apply，处于"清理了但不恢复"的半吊子状态。
- **核心数据**：data.js 的境界 9×9/灵根 5/属性 6+9+9/躯体 22 部位/耐久色阶/avoidance 配置准。
- **经济**：货币分层（铜钱/灵石/拍卖）框架齐全，TradeService 报价公式（基础价×回收率×地区×商人需求×状态×口才×声望）设计合理。
- **门派**：32 派/7 通用设施/藏经阁四层分层框架/职位 ID 4-7 四处一致/杂役无境界门槛生效/师徒离师出师防双师父逻辑闭合（问题仅在叛门未清）。
- **社交内容层**：social-content.js 架构（DEEP_TALK_REAL_HANDLERS 12/SUB_AFF_GATE/FOLLOWUP_BUILDERS 12/ta(npc)/personality16 三层尾缀）核心机制准。
- **感情线**：温蘅 32 事件+6 结局+自动触发三源全准；secret-leverage 状态机单向不可逆无无限刷；npc-inventory 送礼心愿/冷却/委托桥接闭合。
- **debug**：admin 检测精确匹配（`name.toLowerCase()==='admin'`）不误判子串，非 admin 时 UI 真隐藏无残留。

骨架在，问题在"接没接通"和"空壳没填实"——大量系统定义了、导出了、却没人调用，或调用了却没接进主循环。

---

## 修复优先级建议

### 第一优先（让游戏能通关，必修 P0 簇）
1. **任务三连死锁**（F-1）：注册扩展任务 + 补事件 emit + 补 objective handler + 修结局 35 步条件。**否则从 main_001 就走不通**。
2. **元婴/化神材料 ID**（F-2）：`pill_婴变→pill_primordial`、`pill_化神→pill_divine`。一行修复解两个大境界卡死。
3. **合成成功必崩**（F-3）：删/改 `profId`。一行修复解整个合成系统。
4. **队伍原型重写**（F-4）：删 spread 重写块。恢复队伍系统。
5. **存档完整性簇**（F-5/F-6/F-9/F-11）：爱情线冷却+discipleState 字段+邮件+4 个独立 localStorage 键全部进 collect/apply/clear。否则存读档处处丢。
6. **标记出售绕过簇**（F-7/F-8）：Shop.sellItem 委托 TradeService + maxSlots 检查 + equip/discard 守卫 + 回购货币/快照。
7. **跨天 onNewDay 循环**（F-10）：按天数循环触发。

### 第二优先（让仙侠核心系统"真接入"，致命设计）
8. **境界质变接入战斗**（D-1）：getRealmBonus 进 buildPlayerBattleEntity/_calculateDamage。
9. **灵根五行/功法组合接入**（D-2）：essenceGain 用单元素根 + SKILL_ELEMENT_MAP 进伤害克制 + SKILL_COMBINATIONS 进 buildPlayerBattleEntity。
10. **心魔字段统一+瓶颈 UI 入口**（D-3）：统一 `_heartDemonBonus`/`_failedBreakthroughs` + cultivationMeditate 调 applyBottleneckEffect + 修炼面板加瓶颈入口。
11. **渡劫战+结局可达性**（D-4）：渡劫境界实装天劫事件链 + 结局条件改用"达到渡劫期+关键节点" + 飞升后尾声。

### 第三优先（让世界/NPC 活起来 + 修经济）
12. **NPC 生活系统调度**（D-5）：newDay 注册 checkAllNPCLifeSystems + NPC cultivate 达阈值晋升 + 修 gameTime 路径 + byMaster 索引。
13. **四轨+赠礼经济**（D-6/D-8）：补 changeTrust + 赠礼每日上限+递减+特质修正 + 移除双重计数。
14. **道侣双修/合击**（D-7）：两路径统一 + battle.js NPC 侧 bond + 实装双修或移除宣传。
15. **货币双源统一走 DataManager**（P1-1）：禁止裸改 inventory.currency 或 currentCharData。
16. **装备强化 per-instance**（P1）：装备栏存 ItemInstance 而非模板，强化/耐久挂实例。
17. **生活技能加成字段名**（P1）：recipe.skill→requiredSkills 取首键。

### 第四优先（叙事密度 + 新手 + 数值）
18. 每门派补专属支线 + 核心 NPC 分支树扩展 + 关键节点叙事场景（D-9）。
19. 每境绑定可见解锁（D-10）。
20. 经济 sink（灵脉维护税/高阶强化烧灵石）（D-11）。
21. 数值后期曲线指数化（D-12）。
22. 新手引导"入门三件事"（D-13）。

### 第五优先（P2 清理）
- 战利品稀有度分级补亡灵/构装/元素 uncommon/rare 池；宝箱校验 implemented；两套槽定义统一；debug-panel count/errors；showEffect var→let；showEventDialog 关闭路径；typewriter 取消机制；角色创建校验+状态初始化；死代码清理（cultivateQi/vitality_max/useCredit 等）。
