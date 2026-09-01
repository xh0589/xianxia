# STRUCTURE.md 逐条核对报告

> 核对基准：GitHub 仓库 `xh0589/xianxia` main 分支（本地工作区已逐字节还原，与上游一致）。
> 核对方法：8 路并行核查，每条声明落到实际代码 `file:line` 实测，不凭印象。
> 核对范围：STRUCTURE.md 全文 2609 行。
> 判级：✅ 完全属实 / ❌ 错误 / ⚠️ 部分不符·行号偏移·命名差异 / ❓ 无法独立验证。
> 日期：2026-09-01。

---

## 总体统计

| 核对段落（STRUCTURE.md 行号） | 核对项 | ✅ | ❌ | ⚠️ | ❓ |
|---|---|---|---|---|---|
| 一·核心数据（135–321） | 46 | 25 | 14 | 3 | 0 |
| 二·战斗系统（322–446） | 50 | 31 | 7 | 12 | 1 |
| 二·背包/装备/合成/任务/时间（447–695） | 132 | 93 | 11 | 26 | 2 |
| 二·门派/设施/地图/NPC系统（696–1004） | 48 | 32 | 4 | 11 | 0 |
| 三·app.js 主逻辑（1006–1282） | 72 | 51 | 4 | 15 | 2 |
| 四+五·数据访问+加载顺序（1283–1471） | 94 | 64 | 8 | 22 | 0 |
| 七·NPC 完整文档（1493–1960） | 76 | 41 | 18 | 16 | 1 |
| 八+九+十+十一+十二+补录（1963–2609） | 76 | 44 | 8 | 20 | 4 |
| **合计** | **~594** | **~381** | **~74** | **~125** | **~10** |

约 1/3 条目有问题（74 硬错 + 125 部分错/行号失效）。详见各段明细表。

---

## 一、核心数据（STRUCTURE.md 135–321）

| 行号 | 文档声明 | 判定 | 实际值/证据 |
|---|---|---|---|
| 140-146 | attributes main(6)/combat(9)/life(9) | ✅ | data.js:4-9 |
| 143 | 显示「神识」键仍为 intelligence | ✅ | data.js:5 |
| 149-151 | rootNames 5 / rootColors Tailwind 类 | ✅ | data.js:36-37 |
| 153-178 | bodyParts 22 个含 id/name/desc/stat | ✅ | data.js:42-65 共22项 |
| 181-194 | realmLevels 9 境界 layers 均9 | ✅ | data.js:104-114 |
| 184-192 | baseQi 100/300/600/1200/2500/5000/8000/12000/15000 | ✅ | data.js:105-113 |
| 196-197 | terrainTypes 10 种 | ✅ | data.js:117-128 |
| 199-200 | buildingTypes 10 种 | ✅ | data.js:131-142 |
| 202-216 | combatStats 10 项及 default | ✅ | data.js:12-23 hit85/dodge10/block10/parry10/crit5/critDmg150/counter5/penetrate5/toughness5/poisonRes0 |
| 218-219 | avoidanceMethods 3 种含惩罚值 | ✅ | data.js:26-30 dodge20/block40/parry10 |
| 221-231 | durabilityColors 7 档色阶 | ✅ | data.js:69-101 |
| 233 | 实现于 data.js getDurabilityColor/Label、app.js _battlePartColor/updateBattleBodyView | ✅ | data.js:79,91 |
| 235-238 | markKilledEnemyAsCorpse 仅标被杀者/_corpseMarked 防双标/优先级链 | ✅ | app.js:3151,3219-3229 |
| 240-243 | 敌人AI自救 只包扎bleeding&&!stabilized 最多2次 | ✅ | battle.js:2121,2123 |
| 247 | mapData 7 个地区 | ✅ | regions.js:4-12 |
| 250-256 | mapData 代码块各地区城市列表 | ⚠️ | regions.js:5-11：东荒实际['青木城','蓬莱仙岛','东海龙宫']（文档L251写含太虚山，太虚山属中州）；东南海域实际['碧落仙宫','鲛人镇']（文档L256写含蓬莱仙岛/东海龙宫，二者均属东荒） |
| 260 | 共17个城市及分拆 | ✅ | regions.js:5-11 3+3+3+3+3+2+2=17 |
| 264 | sectsData 36 个门派 | ✅ | sects.js:4-48 共36条 |
| 265 | 每门派含 type/location/power/weapons/desc | ✅ | sects.js:6 等 |
| 266 | 正道 21 个 | ❌ | 实际25个（grep type:'正道'=25） |
| 266 | 中立 5 个 | ✅ | sects.js:27-29,39,44 |
| 266 | 邪派 6 个 | ✅ | sects.js:30,31,35,36,40,47 |
| 268-270 | sectPositions/sectsByRegion | ✅ | sects.js:51-104 |
| 274-275 | ITEM_CATEGORIES 6 类 | ✅ | items.js:5-12 |
| 277-278 | ITEM_QUALITIES 6 级倍率1/1.5/2/3/5/10 | ✅ | items.js:15-22 |
| 280-281 | EQUIPMENT_SLOTS 12 类 | ❌ | 实际11类（items.js:25-37 共11键），文档L281自己也只列11项 |
| 283 | 基础物品 38 种 | ❌ | 实际41：武器9+防具10+消耗品11+材料6+秘籍5=41（items.js:40-715） |
| 284 | 武器 9 | ✅ | items.js:40-199 共9 |
| 285 | 防具 8 | ❌ | 实际10（items.js:202-381），文档自己列了10项却写"8" |
| 286 | 消耗品 10（含小还丹/大还丹） | ❌ | 实际11（items.js:384-558）；且小还丹/大还丹不在 items.js，在 items-extended/01-pills.js:6,9 |
| 287 | 材料 6 | ✅ | items.js:561-646 共6 |
| 288 | 秘籍 5 | ✅ | items.js:649-715 共5 |
| 290 | 扩展物品系统 305 种 | ❌ | 实际约287（01-08 共278+13-missing-ids 9）；文档自身子目合计294亦非305 |
| 292-303 | items-extended 子文件为 01~08 共8个 | ⚠️ | 实际14个（多出09-14 共6个：09-loot-sources/10-crafting-extensions/11-event-extensions/12-quest-extensions/13-missing-ids/14-ability-manuals） |
| 295 | 01-pills 丹药 45 种 | ✅ | 01-pills.js pill_+med_ 共45 |
| 296 | 02-weapons 武器 60 种 | ❌ | 实际53（wpn_ 前缀53个） |
| 297 | 03-armor 防具 55 种 | ❌ | 实际42（arm_ 前缀42个） |
| 298 | 04-materials 材料 50 种 | ❌ | 实际51（mat_ 前缀51个） |
| 299 | 05-talismans 符箓 20 种 | ❌ | 实际21（tal_ 前缀21个） |
| 300 | 06-arts 功法 40 种 | ❌ | 实际38（art_ 前缀38个） |
| 301 | 07-food 食物 12 种 | ✅ | food_ 前缀12个 |
| 302 | 08-special 特殊 12 种 | ❌ | 实际15（spec_ 前缀15个） |
| 305 | 加载顺序 items.js→子文件→items-extended.js→inventory.js | ✅ | items-extended.js:4 注释 |
| 307 | 合并到 allItems/itemById/weapons/armor/consumables/materials/secretArts | ✅ | items-extended.js:42-64 |
| 310 | pill_ 丹药45 恢复15/增益8/永久13/特殊7 | ❌ | pill_ 仅43。恢复15✅；增益8❌实际0(extendedBuffPills=[])；永久13❌实际12；特殊7✅；漏突破类9个 |
| 311 | wpn_ 武器60 剑20/刀9/法杖8/长兵5/暗器6/拳套5 | ❌ | 总53非60。子项均✅ |
| 312 | arm_ 防具55 头饰9/护甲12/手套6/靴子8/腰带7 | ❌ | 总42非55。子项均✅，合计42 |
| 313 | mat_ 材料50 矿石14/草药14/兽类15/特殊8 | ⚠️ | 总51非50（文档子项合计51自相矛盾）。子项均✅ |
| 314 | tal_ 符箓20 | ❌ | 实际21 |
| 315 | art_ 功法40 内功13/剑法9/刀法5/拳掌6/轻功5 | ❌ | 总38非40。子项均✅，合计38 |
| 316 | food_ 食物12 | ✅ | 12 |
| 317 | spec_ 特殊12 | ❌ | 实际15 |
| 319-320 | 全局导出 allItems/itemById/weapons/armor/consumables/materials/secretArts | ✅ | items.js:753-766、items-extended.js:42-64 |

**本段小结**：46项，✅25/❌14/⚠️3。问题集中在数量虚高（扩展物品305实~287，各子文件种数高估2-13）、基础物品38实41、EQUIPMENT_SLOTS 12实11、正道21实25、mapData代码块地域错位、遗漏items-extended 09-14 共6子文件。

---

## 二·战斗系统（STRUCTURE.md 322–446）

| 行号 | 文档声明 | 判定 | 实际值/证据 |
|---|---|---|---|
| 328 | BODY_PARTS 22个 | ✅ | battle.js:9-32 |
| 329-332 | 各部位绑定属性 | ✅ | battle.js:10-31 |
| 334-335 | v9.10 补 head 共22 | ✅ | battle.js:13 |
| 338 | WEAPON_SKILL_MAP 映射 | ✅ | battle.js:38-70 |
| 339 | getWeaponSkillName/getPlayerWeaponSkill | ✅ | battle.js:72-91 |
| 342 | constructor physiology 含 bloodVolume/oxygenDebt/criticalTimer | ✅ | battle.js:474-532；initPhysiology:336-383 |
| 343 | spiritResist=意志*0.5, toughness=体质*0.3, maxStamina=100+体质*0.5 | ✅ | battle.js:521-526 |
| 344 | dodgeBonus/blockBonus/parryBonus 由速度估算运行时刷新 | ⚠️ | 构造时一次赋值(battle.js:528-531)，未运行时刷新 |
| 345 | getEffectiveAttrs() | ✅ | battle.js:540-556 |
| 346 | getAttack=力量×1.0+内功+武器技能×0.15 | ⚠️ | 内功项实为内功×0.1×(1+经脉/500)(battle.js:573)，文档省略0.1系数与经脉因子 |
| 347 | getDefense=体质+意志+装备；玩家×getBondBonuses().defense(道侣+5%) | ⚠️ | 实为体质×0.4+意志×0.2(battle.js:628)，省略系数 |
| 348 | getSpeed=灵巧*0.7+轻功*0.1 | ✅ | battle.js:701 |
| 349 | takeDamage 头/脑/颈/胸耐久归零=直接死亡 | ✅ | battle.js:758-760 fatalParts=brain/head/chest/neck |
| 350 | _applyPhysiologyDamage 丹田尽毁不死;depth≥4概率enterCriticalState | ✅ | battle.js:864-872,854-856 |
| 351 | checkDeath | ✅ | battle.js:894-968 |
| 352 | getPhysiologySummary | ✅ | battle.js:978-1000 |
| 355-356 | 生理函数均存在 | ✅ | battle.js:336/1013/1151/1413/1434/1449/1250 |
| 357 | 意志耐疼系数默认0.8(原0.5) | ❌ | PAIN_EFFECTS.willpowerResistance=0.5(physiology-config.js:102) |
| 358 | bandageWound 稳定度=min(60,40+医术/5) | ✅ | battle.js:1291 |
| 359 | hourlyRecovery 部位耐久+体质/10、精力+2×、血量+0.2× | ❌ | 部位恢复率=0.5+体质/25(battle.js:1319)，非体质/10；精力×2/血量×0.2✓ |
| 360 | hemostaticTreatment 可逆转危急 | ✅ | battle.js:1370-1373 |
| 361 | OXYGEN_DEBT_RATE 0.25; CRITICAL 5分钟=50回合 | ✅ | physiology-config.js:51,59,60 |
| 364-366 | DIFFICULTY_PRESETS 三档 + getDifficulty/setDifficulty/getDifficultyParam | ✅ | difficulty-config.js:20-36,39-62 |
| 365 | 档位存 currentCharData.difficulty;localStorage xianxia_difficulty;StateRegistry | ✅ | difficulty-config.js:17-18,65-80 |
| 367 | _isEnemySide→_calculateDamage 敌方×enemyDmgMul | ✅ | battle.js:2473-2478,2568-2575 |
| 368 | takeDamage 要害×vitalMul 双向，符箓后护甲前 | ✅ | battle.js:731-750 |
| 369 | 兜底\|\|50 全改 _getDifficultyCriticalTurns() | ✅ | battle.js:944,1112,1455;injuries:135,235-236 |
| 370 | physiology-config getCriticalTimerMinutes() | ✅ | physiology-config.js:440-450 |
| 371 | 设置页三档卡片UI(debug-panel.js) | ❓ | 未核 debug-panel.js |
| 374-376 | Battle constructor/playerAttack/enemyTurn | ✅ | battle.js:1888,1980,2063 |
| 377 | _calculateDamage = atk-def*0.3+±1; v12.4敌方×enemyDmgMul | ✅ | battle.js:2579,2568-2575 |
| 379 | 步1 昏迷/疼痛失败 | ✅ | battle.js:2606-2614 |
| 380 | 步2 命中 85+(灵巧-10)*0.3+技能*0.1 小部位-20 限5~95 | ⚠️ | 公式✓(2647-2649)；"小部位-20"实为20-神识×0.1下限10(2654-2656) |
| 381 | 步3 闪避 10+速度*0.15+技能*0.08 限1~60 | ❌ | 实为10+速度*0.15+轻功*0.03(battle.js:2681)；限1~35(2686) |
| 382 | 步4 格挡 10+速度*0.08+力量*0.1(盾+15) 伤害×(0.5+韧性/200) | ❌ | 实为5+速度*0.05+力量*0.1(battle.js:2702)；伤害×(1-blockReduction)，blockReduction=0.5+韧性*0.005(2721-2724) |
| 383 | 步5 化解 10+速度*0.08+智力*0.1 伤害×0.7 | ❌ | 实为10+速度*0.05+智力*0.08(battle.js:2736)；×0.7✓(2741) |
| 384 | 步6 韧性降低被暴击 toughness*0.005 | ❌ | 实为toughness*0.001(battle.js:2799)/toughness*0.1(combat-stats.js:151) |
| 385 | 10%基础暴击 1.8倍 | ❌ | 基础5%(battle.js:2789)；倍率1.5x=150%(2802) |
| 388 | generateRandomEnemy | ✅ | battle.js:1512 |
| 391 | 敌人30%概率攻击灵兽 | ❌ | 实为20%(roll<playerTargetBias+0.20)(battle.js:2184) |
| 392 | 灵兽倒下退出本场人不死亡 | ✅ | battle.js:2230-2233 |
| 393 | 灵兽经验_checkEnd结算 app不重复onBeastBattleEnd | ✅ | battle.js:2847-2848,2892-2893;app.js:4168 |
| 394 | 灵兽技能名映射 冰/冻→pierce 火/炎→blunt 风/刃→slash | ✅ | battle.js:2270-2273 |
| 402 | 出战斗权威 currentCharData.health 各处读写 | ⚠️ | 事实✓；行号偏差：restAtInn doc1067→1084/+40%在1110;useSpring doc1325→1370;陷阱doc6906→7214;naturalRecovery doc370→378 |
| 403 | bloodVolume 野兽×1.5 亡灵/构装=0用integrity | ⚠️ | 事实✓；行号偏差：野兽×1.5→367-368;亡灵/构装→371-377;checkDeath→894;EXTERNAL_BLEED→1043 |
| 404 | 部位耐久22×100 initBodyDurability battle.js:116 | ⚠️ | 事实✓；initBodyDurability实际battle.js:153 |
| 406 | 单一权威链路各点 | ⚠️ | 事实✓；行号偏差：buildPlayerBattleEntity→3682;closeBattle写回→2857;applyFullGameState→game-state.js:868;handleDefeatRevival→5743;reshapeBody→soul-state.js:126/182 |
| 408 | 丹药hp_recovery→restoreBodyDurability inventory.js:309/336 | ⚠️ | 事实✓；行号310/337 |
| 414 | openBattleWithEntity 调用方列表 | ⚠️ | 事实✓；行号偏差：秘境守卫→6952/7172/7191;野兽伏击→509;_isArenaOpponent→3808/3839 |
| 415 | globalStartBattle 调用方 | ⚠️ | 事实✓；travel-system→649 |
| 425-429 | aggressive/balanced 表 | ✅ | battle.js:2081-2083 |
| 431 | defensive 守御 下玩家一击×0.6后消耗 | ❌ | 部位池/血门槛/guardChance0.35✓(2084,2159)；但"×0.6减伤"未实装，_guardTurns只置1(2160) |
| 432 | opportunist | ✅ | battle.js:2098-2103,1620 |
| 433 | poisoner | ✅ | battle.js:1622,2335-2352 |
| 435 | 毒素循环 poisonLoad | ✅ | battle.js:348,2343,2417-2433;poison-system.js:139;combat-stats.js:119 |
| 437 | construct/beast/elemental 特有机制 | ✅ | battle.js:724-730,2774-2778,2356-2368 |
| 439/441 | 生成器人形六亚型 | ⚠️ | 内容✓(1617-1635,1734-1745,1873)；L439与L441为完全重复段落 |
| 443 | 第二批9亚型v12.9 | ✅ | battle.js:1625-1634,2096-2119,2846;loot-system.js:500-506 |
| 445 | COMBAT_ABILITIES 9+4/hasAbility/玩家化/学习渠道/货架/队友/藏经阁108 | ✅ | battle.js:120-146,535-537,3771;app.js:4460;loot-system.js:506;enhanced-shop.js:1355-1359,1447-1465;sect-internal.js:36派108门 |

**本段小结**：50项，✅31/❌7/⚠️12/❓1。最严重：闪避/格挡/化解/暴击/韧性公式与数值全错、意志耐疼0.8实0.5、敌人30%攻灵兽实20%、hourlyRecovery部位恢复公式错、defensive减伤未实装。

---

## 二·背包/装备/合成/修炼/任务/事件/时间（STRUCTURE.md 447–695）

| 行号 | 文档声明 | 判定 | 实际值/证据 |
|---|---|---|---|
| 449 | INVENTORY_CONFIG 30/99/10 | ✅ | inventory.js:6-8 |
| 451 | CATEGORIES 9类 | ✅ | inventory.js:9 |
| 456 | inventory.slots/maxSlots/currency | ✅ | inventory.js:28-34 |
| 463 | ItemInstance 字段 | ✅ | inventory.js:52-56 |
| 464 | addCount/removeCount | ✅ | inventory.js:70,95 |
| 465 | getTemplate() | ✅ | inventory.js:65 |
| 468-479 | initInventory/addItem/removeItem/useItem/equipItemFromInventory/unequipItemToInventory/updateEquippedStats/getFinalAttributes/getCombatBonuses/filterInventory/updateInventoryUI/updateCurrencyUI/saveInventory/loadInventory | ✅ | 均在 inventory.js |
| 482 | buyFromShop(itemId,price) | ⚠️ | inventory.js 无定义；onclick调buyFromShop(1592)但定义在 enhanced-shop.js:1165 签名不同 |
| 483 | generateLoot(enemyLevel,enemyType) v5.1扩展 | ⚠️ | inventory.js:1654 实际3参(enemyLevel,enemyType,region)；函数体仅返回空结构，v5.1描述过时 |
| 484 | applyBattleLoot | ✅ | inventory.js:1665 |
| 485 | restoreBodyDurability | ✅ | inventory.js:1693 |
| 488-489 | learnedSecrets/equippedStatsCache | ✅ | inventory.js:15,21 |
| 493 | searchQuery/qualityFilter/sortMode | ⚠️ | 实际字段 searchQuery/qualityFilter/**sortBy**(非sortMode) inventory.js:38-40 |
| 493 | setSearchQuery/getFilteredSlots[inventory.js:524] | ⚠️ | 函数存在(643)，行号524≠643 |
| 494 | 收藏保护 | ✅ | inventory.js:1779 |
| 495 | showItemMenu[inventory.js:793] | ⚠️ | 函数在829，行号793≠829 |
| 496 | showEquipmentCompareDialog v12.5 | ⚠️ | 函数在976；代码注释标v12.4 |
| 497 | showMarkForSaleQuantityDialog v10.5[inventory.js:930] | ⚠️ | 函数在1065，行号930≠1065 |
| 498 | showBuyQuantityDialog[inventory.js:1668] | ⚠️ | 函数在1804，行号1668≠1804 |
| 502 | skillPages 50(10页x5) | ✅ | equipment.js:221-302 |
| 503 | 功法字段 | ✅ | equipment.js:224 |
| 505 | equipmentSlots 12 | ✅ | equipment.js:305-318 |
| 506 | 槽位列表 | ✅ | equipment.js:306-317 |
| 508 | skillSlots 3(v9.4) | ✅ | equipment.js:321-325 |
| 509 | skill_main/skill_身法/skill_绝技 | ⚠️ | 实际id为 skill_main/skill_sub1/skill_sub2(equipment.js:322-324) |
| 511-520 | currentEquipment/currentSkills/skillBrowsePage/各函数 | ✅ | 均在 equipment.js |
| 525 | CRAFTING_CATEGORIES 5类 | ✅ | crafting.js:5-11 |
| 528 | CRAFT_QUALITY | ✅ | crafting.js:14-20 |
| 531 | 炼丹配方17种 | ⚠️ | 实际21条(含3医疗物品)；foodRecipes内另有4突破丹归PILFAR |
| 532 | 锻造8 | ✅ | crafting.js:328-445 |
| 533 | 符箓6 | ✅ | crafting.js:448-536 |
| 534 | 烹饪4 | ✅ | crafting.js:539-592 |
| 537 | checkMaterials(recipeId) | ⚠️ | 实际签名 checkMaterials(recipe)(crafting.js:682) |
| 538 | consumeMaterials(recipeId) | ⚠️ | 实际 consumeMaterials(recipe)(721) |
| 539 | addResultItem 走window.addItem | ✅ | crafting.js:754-765 |
| 540 | calculateSuccessRate(recipeId) | ⚠️ | 实际 calculateSuccessRate(recipe)(777)；baseRate0.7/min0.95✓ |
| 541-545 | executeCrafting/finishCrafting/getRecipesByCategory/renderCraftingUI/openCraftingUI | ✅ | 均在 crafting.js |
| 550 | ENHANCEMENT_TYPES 4(STRENGTHEN/REFINE/ENCHANT/BREAKTHROUGH) | ❌ | enhancement.js 无此常量；实际 ENHANCE_CONFIG(enhancement.js:7)键 strengthen/refine/enchant/breakthrough |
| 553 | QUALITY_LEVELS 6级 | ❌ | enhancement.js 无；品质名仅在 inventory.js:919 |
| 556 | enhancementRecipes | ❌ | enhancement.js 无；消耗内嵌于 ENHANCE_CONFIG.costSpirit/costGold |
| 559 | getEnhancementLevel(item) | ⚠️ | 实际 getItemEnhanceLevel(item,type)(enhancement.js:112) |
| 559 | calculateSuccessRate(type,level) | ⚠️ | 实际 getEnhanceSuccessRate(type,level)(91) |
| 560 | checkEnhancementMaterials()/consumeEnhancementMaterials() | ❌ | 均不存在；实际 canAffordEnhance(202)/payEnhanceCost(214) |
| 561 | performEnhancement(type) | ⚠️ | 实际 performEnhancement(action,slotId)(299) |
| 561 | enhanceSuccess()/enhanceFailure() | ✅ | enhancement.js:74,68 |
| 562 | getEnhancementInfo(item) | ⚠️ | 实际 getEnhancementDescription(item)(608) |
| 562 | updateEnhancementUI() | ❌ | 不存在 |
| 562 | openEnhancementUI() | ✅ | enhancement.js:437，导出openEnhancementHall(644) |
| 568 | proficiencyData {level,exp,name} | ⚠️ | 实际 {level,exp,breakthroughAttempts}(cultivation.js:58)，无name |
| 569 | initProficiencyData | ✅ | cultivation.js:109 |
| 570 | breakthroughProficiency | ✅ | cultivation.js:187 |
| 571 | trainProficiency | ❌ | 实际 cultivateSkill(skillId,amount)(cultivation.js:331) |
| 574 | enlightenmentPoints | ⚠️ | 实际 insightPoints(cultivation.js:62) |
| 575 | triggerEnlightenment() | ⚠️ | 实际在 event-system.js:731 |
| 578 | isHeavenlyRoot(roots) | ❌ | cultivation.js 无；天灵根逻辑内嵌于 getRootSpeedMultiplier(value>80→mul*=1.1) |
| 579 | getDominantRoot(roots) | ❌ | 不存在 |
| 580 | getTechniqueAffinity(roots,techniqueElement) | ❌ | 不存在 |
| 581 | getCultivationSpeedFromRoots 0.5+灵根/100 | ⚠️ | 实际 getRootSpeedMultiplier(roots,element)(cultivation.js:1095)；公式 0.8+value/200 |
| 582 | calculateCultivationExpFromRoots 天灵根1.2 | ⚠️ | 函数在1131；天灵根倍率实际1.1非1.2 |
| 583 | app.js cultivationMeditate 用 rootExpBase 替代固定30 | ❓ | 需查 app.js |
| 588 | QUEST_TYPES 6种 | ⚠️ | 实际8种(另含 ESCORT/EXPLORATION)(quest-system.js:5-14) |
| 591 | QUEST_STATUSES 4种 | ⚠️ | 实际5种(另含 FAILED)(17-23) |
| 594 | QUEST_PRIORITIES 5种(含URGENT) | ⚠️ | 实际4种(LOW/MEDIUM/HIGH/CRITICAL)，无URGENT(26-31) |
| 597 | mainQuestChain 5 | ✅ | quest-system.js:70-163 |
| 598 | dailyQuestPool 4 | ✅ | 166-245 |
| 599 | collectionQuests | ✅ | 248-289 |
| 600 | combatQuests | ✅ | 292-330 |
| 603 | playerQuestProgress 字段 | ✅ | 351-356 |
| 606-611 | initQuestSystem/saveQuestProgress/acceptQuest/turnInQuest/updateQuestObjective/getActiveQuests等 | ✅ | 均在 quest-system.js |
| 615-619 | _trackedQuests 1主+2支/toggleTrackQuest/updateQuestTracker/★按钮/StateRegistry/initQuestTracker | ✅ | quest-system.js:1064,1082,1083,1171,1340;app.js:8125 |
| 624 | EVENT_TYPES 12 | ✅ | event-system.js:5-18 |
| 627 | EVENT_RARITY 5级及百分比 | ✅ | 21-27 |
| 630-635 | randomEvents 11条 | ✅ | 30-385 |
| 637 | eventHistory/eventFlags | ✅ | 388-389 |
| 640-646 | initEventSystem/saveEventFlags/setFlag等/triggerRandomEvent 5%/enterSecretRealm等 | ✅ | event-system.js |
| 651 | TIME_PERIODS 8个 | ⚠️ | 实际9个(列了late_night/dawn/morning/noon/afternoon/dusk/evening/night/midnight)(time-system.js:5-15) |
| 654 | 每时段bonus | ✅ | 6-14 |
| 657 | SEASONS 4 | ✅ | 18-23 数值全一致 |
| 661 | gameTime 字段 | ✅ | 26-34 |
| 665 | ACTION_TIME_COSTS | ✅ | 515-567 数值全一致 |
| 671-676 | initTimeSystem/saveGameTime/resetGameTime/advanceTime/recoveryMinuteAcc/每小时hourlyPhysiologyRecovery+hourlyRecovery | ✅ | time-system.js |
| 674 | v12.5 单次≥120分钟追加⏰反馈 | ⚠️ | 功能存在(189-192)；代码注释标v12.4 |
| 675 | 每小时 hourlyRecovery(_playerEntity) | ⚠️ | 实际取 _playerEntity\|\|_playerPhysiology(166-172) |
| 676 | getCurrentPeriod等 | ✅ | 245,262,268,274 |
| 677 | naturalRecovery() | ✅ | 378 |
| 678 | hourlyPhysiologyRecovery | ✅ | 412-489 |
| 679 | onNewDay | ✅ | 280 |
| 680 | resetDailyQuests() | ⚠️ | 调 window.questSystem.resetDailyQuests()(282-284)；quest-system.js 实际为 checkDailyReset+resetQuest |
| 681-686 | naturalRecovery/claimDailyIncome/shopManager.refreshAllInventory/onNewDay钩子/onNewDaySubscribe/getAbsoluteDay/onNewMonth | ✅ | time-system.js |
| 688 | getCultivationSpeedBonus()/getGatheringBonus()/getCombatBonus() | ❌ | 本文件均无定义；app.js:1273 typeof守卫调用但全局从未赋值 |
| 689 | performAction(actionKey,callback) | ⚠️ | 实际 performActionWithTime(actionKey,callback)(577) |
| 690 | getActionTimeCost/getActionName | ✅ | 570,597 |
| 693-694 | window._playerPhysiology/_playerEntity | ✅ | 393,168 |

**本段小结**：132项，✅93/❌11/⚠️26/❓2。最严重：enhancement.js 三个常量+三函数全不存在（虚构）、cultivation 灵根4函数不存在且公式不同、QUEST_TYPES/STATUSES/PRIORITIES 计数错、TIME_PERIODS 8实9、字段名 sortMode实sortBy、多处 inventory.js 行号引用错。

---

## 二·门派/设施/地图/NPC系统（STRUCTURE.md 696–1004）

| 行号 | 文档声明 | 判定 | 实际值/证据 |
|---|---|---|---|
| 698-699 | PartyMember 类/combatAbilities v15.2 | ✅ | party-system.js:5-59；combatAbilities L38 |
| 701-702 | FORMATIONS 6种 standard/attack/defense/speed/heal/sacrifice | ⚠️ | 6种数对；实际id default/attack/defense/speed/healing/sacrifice |
| 705-710 | 各函数 | ✅ | 均在 party-system.js |
| 711 | teachAbilityToMember/getTeachableAbilities v15.2 | ✅ | L894-956；escape不入池 L896 |
| 719 | 16个城市 | ✅ | cityData 实为16城（注意：data是17，location-system此处16对） |
| 720-721 | enterCity/getCurrentLocation/showTeleportUI/teleportToCity | ⚠️ | showTeleportUI/teleportToCity 在 app.js 非 location-system.js |
| 725-726 | 4方式 walk120/horse60/sword20/teleport5 | ⚠️ | 时长对；御剑实际id float_sword 非 sword |
| 728-729 | 旅行风险事件 | ✅ | travel-system.js:401,467 |
| 733-734 | buildingEffectsRegistry 12种含blackmarket | ⚠️ | 12种但最后一项id是 market(黑市)非 blackmarket |
| 736 | npc-system.js 约3540行 | ⚠️ | 实际4255行 |
| 739 | clamp/randomChoice/deepMerge | ✅ | npc-system.js:7,11,16 |
| 742 | DEEP_TALK_CATEGORIES 8大类47子选项 | ❌ | 8大类✅；子选项实34非47 |
| 745 | DEEP_TALK_BRANCHES 3核心NPC | ✅ | 3树✓ |
| 749 | 清虚道人 5节点 | ⚠️ | 实际6节点(intro/trust_path/respect_path/secret_hint/deep_understanding/end) |
| 750 | 灵素 6节点 | ✅ | 6节点✓ |
| 751 | 铁山 6节点 | ✅ | 6节点✓ |
| 753-754 | OCCUPATION_SPECIFIC_ACTIONS 10种 | ✅ | L317-443 |
| 756-766 | NPC类及6个子系统类 | ✅ | 均存在 |
| 768-783 | showNPCDialog系列/initNPCSystem/resetNPCSystem/window导出15+ | ✅ | 实际导出30+ |
| 789-795 | POISON_TYPES 3/detoxify/craftPoison/getPlayerSpeechDiscount | ✅ | poison-system.js |
| 798 | 加载顺序 | ✅ | 仙侠.html 顺序一致 |
| 803 | StatusEffectTypes 20类 | ✅ | status-effects.js:15-36 |
| 805-806 | StatusEffect 字段 | ✅ | 40-56 |
| 809-810 | PresetStatusEffects 增益/减益 | ⚠️ | "狂暴"实际预设名"暴怒"(RAGE L197) |
| 813-816 | StatusEffectManager 方法 | ✅ | L315-478 |
| 820-822 | Achievement 类 | ✅ | achievement-system.js:15-32 |
| 824-825 | Task 类 | ⚠️ | Task类已迁移至 quest-system.js，不在此文件 |
| 828 | 预设成就 first_blood等 | ✅ | L273,282,291,300 |
| 832-847 | MarkerTypes 13/MapMarker/MapMarkerManager/预设标记 | ✅ | map-markers.js |
| 849-855 | v12.6 storylines-v2/batch1 15事件/secretId/_dynamicScenes/injectStorylineSecrets | ✅ | batch1.js 全验 |
| 857-862 | v12.5 syncQuestTargetMarkers/removeQuestTargetMarkers | ⚠️ | 功能对(L794-850)；代码注释标v12.4 |
| 866-888 | Shop类/refreshInventory季节价/特供池6件/ShopManager/PresetShops 5 | ⚠️ | openShop实在inventory.js非enhanced-shop.js；其余✓ |
| 892-895 | joinSect/leaveSect/discipleState | ✅ | sects-system.js |
| 896-899 | 灵兽 v17.1/v17.3 | ⚠️ | 内容全✓；实在 beast-taming.js/09-loot-sources.js/battle.js 非 sects-system.js |
| 900-907 | 派系 v16.3-v18.7 | ✅ | 散见各 sects/* 文件 |
| 908-912 | 晋升 v10.3/v16.0 师徒 | ✅ | sects-deep-ui.js |
| 914-919 | sect-facilities v11.1/v15.4/v15.5/v15.8-15.9/v16.1/v16.2 | ✅ | sect-facilities.js |
| 921-928 | B3 修复清单 | ✅ | 全验 |
| 930-942 | VALID_ACTION_TYPES 10种 | ⚠️ | 基线10✓；实际已扩展至13(加 openLibrary/spendContribution/tempBuff) |
| 944-953 | 7设施表(actions/rankReq/dailyUses/cooldownMinutes) | ❌ | 多处不符：演武场 spendQi实15(doc10)/advanceTime实90(doc30)；医馆 实 spendContribution:10(doc spendQi:20)；藏经阁 rankReq实7(doc4)；兵器库 dailyUses实1(doc0∞)；dailyUses/cooldownMinutes 多不在设施定义里 |
| 955-976 | facilityState结构/保存加载接口/职位要求/启动校验 | ✅ | sect-facilities.js |
| 980-985 | MAP_CONFIG/TERRAIN/REGION_TERRAIN_WEIGHTS | ✅ | randomMap.js:10-48 |
| 987-988 | BUILDINGS TOWN/SECT/RUIN/CAVE/MARKET | ❌ | 实际仅4种(TOWN/RUIN/CAVE/MARKET)，无SECT |
| 990-995 | generateRandomMap 实体比例15%/20%/15%等 | ✅ | L170,184,234 |
| 997-1004 | renderMap/onCellClick/tryBeastAmbush 30%/导出 | ✅ | randomMap.js |

**本段小结**：48项，✅32/❌4/⚠️11。最严重：DEEP_TALK子选项47实34、sect-facilities 7设施表数值多处不符、VALID_ACTION_TYPES 10已过时(实13)、randomMap BUILDINGS 列SECT实际无、FORMATIONS id不符。

---

## 三·app.js 主逻辑（STRUCTURE.md 1006–1282）

| 行号 | 文档声明 | 判定 | 实际值/证据 |
|---|---|---|---|
| 1013-1024 | gameLog/gameState/rootValues[5]/selectedGender/currentCharData/saveSlots | ✅ | app.js |
| 1028-1033 | 角色创建函数 | ✅ | app.js:69,76,94,255,192,250 |
| 1037-1039 | 灵根系统 segments/handles/inputs/mutThunder/mutWind/mutIce/变异条件 | ✅ | app.js:90,186-188 |
| 1043-1053 | populateGameWorld/renderBodyDurability/updateBodySVG/renderAvoidancePriority | ✅ | app.js |
| 1047 | 初始化状态栏(精力/真气/心情/境界) | ⚠️ | 注释委托updateCharacterStatus；心情未见显式初始化 |
| 1057-1063 | switchPanel/switchSubTab | ✅ | app.js:712-798 |
| 1067-1074 | 地图交互函数 | ✅ | app.js |
| 1078 | CITY_FACILITIES 15种 | ⚠️ | 实际37+条目；15条映射均存在正确但"15种"总数不符 |
| 1079-1083 | 15条 action 映射 | ✅ | app.js:824-850 |
| 1086 | restAtInn 耗10灵石/480min/恢复health/qi/energy到上限 | ⚠️ | cost10✓/480✓/qi,energy满✓；但health仅+40%max非到上限(1110) |
| 1088-1089 | 城市休息加成/5%奇遇/重伤不自动治愈 | ✅ | app.js |
| 1092 | startTraining 耗20精力/10-19经验/60min/检查升级 | ⚠️ | 未见"检查升级"调用(仅累加tempering) |
| 1095 | startCultivation 显示打坐/突破 | ✅ | app.js:1195-1226 |
| 1097 | cultivationMeditate 耗20真气(半小时) | ⚠️ | 函数时长参数化；20真气对应'half'(qiCost20)✓，但同时存在5/60/200/400等档非固定20 |
| 1098 | v10.3.1 BUGFIX 同步currentCharData | ✅ | app.js:1261 |
| 1099 | 雷灵根+15%/风+10%/冰+20% | ❌ | 注释为+5%；getRootMutationBonus(6606-6611) thunder/wind/ice_cultivation 均1.05 |
| 1100 | 结拜getBondBonuses().cultivation每条+15% | ✅ | app.js:7383 |
| 1101 | 时间+120min,5%奇遇 | ⚠️ | 120min对应'hour'档(qiCost60)非20真气档 |
| 1097 | 30*季节*变异*结拜 修炼经验 | ⚠️ | 产出为真元(essence)非"修炼经验"，rootExpBase重赋值后未直接使用 |
| 1104 | useSpring 全恢复+60min | ✅ | app.js:1370-1381 |
| 1107 | visitTemple | ✅ | 1492-1554 |
| 1110 | visitTavern 20铜/30%奇遇/+30min | ✅ | 1556-1573 |
| 1113 | showTeleportUI/teleportToCity 100灵石/15min/10%奇遇 | ⚠️ | 扣灵石逻辑未见(仅enterCity) |
| 1116-1119 | openCityShop/buyFromCityShop 5min/5%奇遇 | ✅ | app.js |
| 1122-1125 | openAlchemyRoom/craftPill | ✅ | 1613-1692 |
| 1128 | openForgingShop 调openEnhancementUI() | ⚠️ | 实际优先调 openEnhancementHall() |
| 1131-1136 | openQuestHall/acceptQuestFromHall/openBlackMarket | ✅ | app.js |
| 1140-1154 | saveGame{meta,state}最多10/exportSave/importSave/loadSaveSlot/loadSaveData/refreshSaveSlots/deleteSave+clearCharacterStorage | ✅ | app.js |
| 1158-1174 | 战斗函数/getPlayerTotalDura/updateBattleUI/closeBattle/toggleBattleBodyView/openInteraction/renderInteraction | ✅ | app.js |
| 1167 | person/merchant/wanderer/building 分发 | ✅ | 3430-3437 |
| 1168 | building 遗迹/洞府/坊市/城镇分发 | ⚠️ | renderInteraction只匹配'坊市'不含'城镇'；interactBuilding含'城镇' |
| 1170 | interactTalk 优先showNPCDialog | ⚠️ | interactTalk仅问候+创建临时NPC不调showNPCDialog；showNPCDialog在openNpcDeepTalk |
| 1172-1174 | openBattleWithEntity/showBattleUI/battleAttackPart/battleFlee | ✅ | app.js |
| 1178-1183 | renderEquipmentPanel/renderSkillBrowse/showTooltip | ✅ | app.js |
| 1180 | prevSkillPage/nextSkillPage | ✅ | 5119-5120(空实现) |
| 1181 | equipSkill/unequipSkill/unequipItem | ⚠️ | 实际 equipSkillToSlot/unequipSkillFromPanel/unequipItemToBag |
| 1187-1195 | initNewSystems/showCityTravelUI/useBuildingEffect/addItemToInventory/openCraftingUI委托/openCultivationUI委托/openShop委托/openEnhancementUI委托/buyFromShop/performBreakthrough/acceptQuest | ✅ | 均在 app.js |
| 1201-1203 | filterInventory/showNPCDialog/getAffectionLevelInfo | ⚠️ | getAffectionLevelInfo 最高"挚爱"非"道侣"(道侣属bond) |
| 1206-1208 | talkToNPC/giveGiftToNPC/confirmGiftToNPC | ✅ | app.js gain值全对 |
| 1209 | claimDailyIncome 50金+10灵石+门派20+境界加成 | ✅ | 5872-5911 |
| 1210 | mineOre 15精力+30min/iron_ore 80% | ✅ | app.js |
| 1211-1212 | Shop.refreshInventory/shopManager.refreshAllInventory | ✅ | enhanced-shop/time-system |
| 1216-1219 | generateWanderStock/openWanderMerchant 1.2/sparWithWanderer | ✅ | app.js |
| 1219 | tradeSkillWithWanderer 80灵石换修炼经验(+筑基丹) | ⚠️ | 给真元+60/历练+40(非"修炼经验")；25%筑基丹✓+25%绝技分支(doc未提) |
| 1222 | DUNGEON_DEFS ruin(50/5)/mountain(100/7) cave已移除只2个秘境 | ❌ | 实际含3个:ruin(50/5)+cave(30/3)+mountain(100/7)；cave未移除 |
| 1223-1229 | openDungeonEntrance/enterDungeon/exploreDungeonFloor 12种加权事件池 v12.5 | ✅ | app.js:7022,7052,7135-7153 |
| 1225 | 占比 战斗38/宝箱采集25/陷阱20/灵泉9/功法8 | ✅ | 全中 |
| 1226-1227 | 12事件项及weight/minFloor | ✅ | 全一致 |
| 1227 | broken_art 60% KnowledgeSystem听闻级 | ✅ | app.js:7246-7256 |
| 1228 | 通关奖励/退出保留进度 | ✅ | 7266-7288 |
| 1232-1236 | formBond 80/60/getBondStatus/getBondBonuses 道侣attack1.1defense1.05/结拜cultivation1.15/bonds字段 | ✅ | app.js |
| 1239-1240 | tryBeastAmbush 30% | ✅ | randomMap.js |
| 1244 | getRootMutationBonus thunder_power/ice_power 1.3, wind_speed 1.2 | ❌ | 实际1.10/1.10/1.08(app.js:6600-6605) |
| 1245 | thunder/wind/ice_cultivation 1.15/1.10/1.20 | ❌ | 实际三者均=1.05(6606-6611) |
| 1246-1252 | enterArena 每日5次/精力10/胜率公式/胜奖励/败评分-5/排名 | ✅ | arena-system.js |
| 1253-1254 | openContributionShop 物品价 | ⚠️ | 实际19项；价格不符:功法300-800(无统一500)/丹药80-300/装备300-1500/精铁礼盒80(非120) |
| 1255 | exchangeContribution | ✅ | app.js:6684 |
| 1258-1260 | openAuctionHouse/listForAuction/bidOnAuction | ✅ | auction-service.js |
| 1264-1269 | 全局导出清单 | ✅ | app.js:7294-7330 |
| 1268 | enterArena/showArenaRanking 在app.js末尾导出 | ⚠️ | 实由arena-system.js导出 |
| 1273-1280 | DOMContentLoaded 初始化 | ⚠️ | "加载存档"实际被注释掉；"延迟初始化"实际直接调initNewSystems(注释明言禁止延时) |

**本段小结**：72项，✅51/❌4/⚠️15/❓2。最严重：变异灵根加成数值(1.3/1.2实1.1/1.08；1.15/1.1/1.2实全1.05)、DUNGEON_DEFS cave实际未移除、cultivationMeditate时长参数化致"20真气/120min"组合不成立、贡献商店清单简化失真、函数名equipSkill等对不上。

---

## 四+五·数据访问+加载顺序（STRUCTURE.md 1283–1471）

### (1) 数据访问规则表

| 行号 | 文档声明 | 判定 | 实际值/证据 |
|---|---|---|---|
| 1288 | 角色数据 window.currentCharData | ✅ | 多文件读写 |
| 1289 | 灵石 DataManager.getSpiritStones() 双源 | ✅ | global-utils.js:169 |
| 1290 | 铜钱 DataManager.getCopper() | ✅ | global-utils.js:205 |
| 1291 | 精力 currentCharData.energy | ✅ | travel-system/building-effects |
| 1292 | 真气 currentCharData.qi | ✅ | building-effects.js:174 |
| 1293 | 生命 currentCharData.health buildPlayerBattleEntity覆盖/closeBattle写回 | ✅ | app.js:3682,2827 |
| 1294 | 装备 window.currentEquipment | ✅ | equipment.js:328 |
| 1295 | 功法 window.currentSkills+KnowledgeSystem | ✅ | equipment.js:344,534 |
| 1296 | 时间 window.timeSystem.gameTime/getGameTimeSnapshot() | ✅ | time-system.js:26,97,685 |
| 1297 | 任务 window.playerQuestProgress+exportQuestState/importQuestState | ⚠️ | playerQuestProgress✅(game-state.js:235/513)；**exportQuestState/importQuestState 全仓未定义**，仅typeof守卫从不触发，存档实际走playerQuestProgress直接序列化 |
| 1298 | 门派 window.discipleState | ✅ | 多处引用 |
| 1299 | 事件标志 window.eventFlags | ✅ | event-system.js:883 |
| 1300 | 道侣/结拜 currentCharData.bonds | ✅ | app.js:7333 |
| 1301 | 秘境进度 currentCharData.dungeonProgress | ✅ | app.js:7024 |
| 1302 | 日志 gameLog.add/XianXia.showMessage | ✅ | app.js:4,32 |
| 1303 | 完整存档 GameState.collectFullGameState/applyFullGameState | ✅ | core/game-state.js:104/619 |

### (2) 5.0 实际目录速览

| 行号 | 文档声明 | 判定 | 实际值/证据 |
|---|---|---|---|
| 1317-1323 | 根目录含 profession-system | ❌ | js/profession-system.js 不存在；全仓仅注释/字段名引用，html 0引用 |
| 1317-1323 | 根目录其余文件 | ✅ | 全部命中 ls js/*.js |
| 1324 | city-facilities/facility-batch2 | ✅ | 存在 |
| 1325-1327 | core/ 列表 | ⚠️ | 均存在；**遗漏** scenario-engine/world-calendar/world-calendar-ui/world-loop |
| 1340 | core/ v12.4 difficulty-config | ✅ | 存在 |
| 1328 | cultivation/ 列表 | ⚠️ | 遗漏 long-retreat.js |
| 1329 | economy/ | ✅ | 一致 |
| 1330 | factions/ | ✅ | 一致 |
| 1331 | gameplay/ | ✅ | 一致 |
| 1332 | items-extended/ 01~13 | ⚠️ | 遗漏 14-ability-manuals.js |
| 1333 | map/ | ✅ | 一致 |
| 1334-1338 | npcs/ 清单 | ⚠️ | 遗漏 npc-inventory/npc-life-actor/npc-lineage/storylines-v2/batch2.js/batch3.js |
| 1339 | quest/ | ✅ | 一致 |
| 1341-1343 | sects/ 清单 | ⚠️ | 遗漏 sect-tournament/sect-year-goal |
| — | js/crafting/ 子目录 | ❌ | 速览未收录(alchemy-compound/forging-compound)，html引用 |
| — | js/extensions/ 子目录 | ❌ | 速览未收录(16个文件)，html全部引用 |

### (3) 5.0 v10~v12.3 行号表

| 行号 | 文档声明 | 判定 | 实际值/证据 |
|---|---|---|---|
| 1350 | 背包搜索 inventory.js:37/:524/:607 字段searchQuery/qualityFilter/sortMode+getFilteredSlots | ⚠️ | :37注释；实际字段:38/39/:40(**sortBy**非sortMode)；getFilteredSlots在:643；:524空行；:607是labels表 |
| 1351 | showItemMenu inventory.js:793 | ❌ | 实际:829；:793是批量出售按钮 |
| 1352 | 出售数量对话框 inventory.js:930 | ❌ | :930是使用场景标签表 |
| 1353 | showBuyQuantityDialog inventory.js:1668 | ❌ | 实际:1804；:1668是applyBattleLoot函数体 |
| 1354 | 任务追踪 quest-system.js:1049 | ⚠️ | 追踪块起于:1062；initQuestTracker@1066；★@1171；StateRegistry@1340。偏移+13以上 |
| 1355 | 灵兽收服 beast-taming.js:475 | ⚠️ | canCaptureDefeatedEnemy@540；captureBeastAfterBattle@574。偏移+65 |
| 1356 | 竞技场真实战斗 arena-system.js enterArena | ✅ | 路径正确 |
| 1357-1361 | 飞鸽/拍卖/NPC生活/武当深度/神魂系统 | ✅ | 文件均存在 |

### (4) 5.1 历史加载顺序 v8.5

实测 仙侠.html 共 **142 个 script 标签**（1 Tailwind + 141 本地 JS），文档声称"14层共68标签(67本地JS)"——数量严重滞后。逐层文件存在性核对：

| 层 | 文档声明 | 判定 | 实际 |
|---|---|---|---|
| 0/0.5/0.55 | global-utils/game-state/difficulty-config | ✅ | 存在 |
| 1 | data/regions/sects/items | ✅ | 存在 |
| 2 | name-generator | ✅ | 存在 |
| 3-7 | qi-environment/randomMap/battle | ⚠️ | randomMap路径已迁 js/map/ |
| 4 | items-extended 01~08+13 | ✅ | 存在 |
| 5 | inventory/equipment | ✅ | 存在 |
| 6-20~33 | 各系统文件 | ⚠️ | quest-system/cultivation/map-markers路径已迁子目录；culturing/中cultivation-bottleneck/breakthrough-ritual路径迁 |
| 7 | npcs/* | ✅ | 存在 |
| 8 | npc-emotions/npc-daily-life | ⚠️ | 路径迁 js/npcs/ |
| 8-40 | npc-milestones(v11.6删除) | ✅ | 确实不存在，文档自标 |
| 9 | sects-* 5文件 | ⚠️ | 路径迁 js/sects/ |
| 10-49 | enemy-invasion | ⚠️ | 路径迁并改名 js/factions/faction-invasion.js |
| 10-49 | profession-system | ❌ | 全仓不存在 |
| 10-54 | city-life(未落地) | ✅ | 确实不存在，文档自标 |
| 10-55 | landmark-explore | ⚠️ | 路径迁 js/map/ |
| 11 | scene-performance/choice-memory | ⚠️ | 路径迁 js/quest/ |
| 12 | items-extended 10/11/12 | ✅ | 存在 |
| 13 | app/breakthrough-ritual/lifespan | ⚠️ | breakthrough-ritual迁 js/cultivation/ |
| 14 | scenario-engine/facility-batch2 | ✅ | 存在 |
| 总数 | 68标签/67本地JS | ❌ | 实测142标签/141本地JS，差74 |

**本段小结**：94项，✅64/⚠️22/❌8。关键失实：profession-system.js幽灵条目、5.1标签总数68实142、5.0速览遗漏 crafting/与 extensions/两个子目录(共18文件)、5.0表行号引用大面积错误、exportQuestState/importQuestState不存在、字段名sortMode实sortBy、5.1路径迁移14处未更新。

---

## 七·NPC 完整文档（STRUCTURE.md 1493–1960）

### 7.1 文件结构

| 行号 | 文档声明 | 判定 | 实际值/证据 |
|---|---|---|---|
| 1499 | special-npcs.js「22479字节320行」 | ❌ | 37933字节/572行 |
| 1499 | 含10特殊NPC | ✅ | SPECIAL_NPC_DATA 10条 |
| 1510 | item-tags.js「4834字节130行」 | ⚠️ | 4834字节✅；129行(差1) |
| 1511 | name-generator.js「9334字节210行」 | ⚠️ | 9334字节✅；209行(差1) |
| 1512 | npc-system.js「75170字节1226行10类」 | ❌ | 220245字节/4255行；实际7类 |
| 1513 | 工具函数 clamp/randomChoice/deepMerge | ✅ | npc-system.js:7/11/16 |
| 1514 | DEEP_TALK_CATEGORIES 8大类47子选项 | ⚠️ | 8大类✅；子选项34非47 |
| 1515 | OCCUPATION_SPECIFIC_ACTIONS 10种 | ✅ | 实测10键 |
| 1529 | data.js「11343字节148行」 | ❌ | 29916字节/831行 |
| 1534等 | 路径写作 js/npc-system.js | ⚠️ | 实际 js/npcs/npc-system.js |

### 7.2 类结构

| 行号 | 文档声明 | 判定 | 实际值/证据 |
|---|---|---|---|
| 1534 | NPC类位于 npc-system.js:21 | ❌ | 实际 line 562 |
| 1535 | 基础字段 | ✅ | constructor 563-570 |
| 1537 | 关系 affection/trust/respect/love/fear/hatred/flags/history | ❌ | 实有 affection/hatred/favor/favorMax/respect/love/fear/flags/history；**无 trust** |
| 1542-1549 | Phase1新增字段 | ✅ | 全存在 |
| 1554 | getDialogue(topic, category?) | ❌ | 实际 getDialogue(category='greeting')(797) |
| 1555 | getAvailableTopics() | ✅ | 807 |
| 1556 | recordPlayerAction | ✅ | 818 |
| 1557 | getPlayerImpression() | ❌ | 不存在 |
| 1558 | updateSchedule(gameHour) | ❌ | 不存在 |
| 1559 | interact(type) | ✅ | 1072 |
| 1560 | serialize()/deserialize(data) | ⚠️ | NPC.serialize(1225)+static deserialize(1340)；实例无deserialize |
| 1562 | NPCManager类 npc-system.js:466 | ❌ | 实际 line 1494 |
| 1565-1572 | NPCManager 方法 | ✅ | 全存在 |
| 1574 | DialogueSystem类 npc-system.js:762 | ❌ | 实际 line 1803 |
| 1577-1582 | DialogueSystem 方法 | ✅ | 全存在 |
| 1584 | NPCQuestSystem类 npc-system.js:838 | ❌ | 实际 line 2192 |
| 1587-1591 | NPCQuestSystem 方法 | ✅ | 全存在 |
| 1593 | NPCEventSystem类 npc-system.js:900 | ❌ | 实际 line 2248 |
| 1596 | checkEvents() | ✅ | 2249 |
| 1597 | checkNPCConflicts(npcs) | ❌ | 不存在 |
| 1598 | checkBreakthroughs(npcs) | ❌ | 不存在 |
| 1599 | checkDangers(npcs) | ❌ | 不存在 |
| 1600 | getRecentEvents(count) | ❌ | 不存在(仅有triggerConflict) |
| 1602 | AffectionSystem类 npc-system.js:775 | ❌ | 实际 line 1865 |
| 1605 | 8级好感 | ✅ | levels数组一致 |
| 1606 | getColor(affection) | ✅ | 1879 |
| 1607 | getName(affection) | ✅ | 1880 |
| 1608 | renderBar(affection,containerId) | ❌ | 不存在 |

### 7.3-7.5 四轨/压力/特质

| 行号 | 文档声明 | 判定 | 实际值/证据 |
|---|---|---|---|
| 1614-1636 | 四轨定义/getRelationshipStatus 7条件/updateFavorMax公式/changeFavor/canAffordRequest/executeRequest | ✅ | npc-system.js:988-1017,1024-1031,1014 |
| 1643-1654 | 压力 stress/addStress≥80/triggerMentalBreak 神经质>60偏执/recoverFromBreak/dailyStressRecovery每日5点心情>70额外3 | ✅ | 1086-1104 |
| 1649 | reduceStress <40恢复 | ⚠️ | 仅减压力isBroken调recover，无"<40恢复"阈值 |
| 1661-1682 | 特质3组9种/getGiftMultiplier/getRequestSuccessBonus/getDialogueModifier | ✅ | 1107/1112/1117 |

### 7.6 打招呼/告别

| 行号 | 文档声明 | 判定 | 实际值/证据 |
|---|---|---|---|
| 1685 | social-content.js外层包装/dynamicGreeting五档/composeGreeting三层 | ✅ | social-content.js:712,761,1024 |
| 1685 | composeFarewell复刻recentAction | ✅ | 745 |
| 1688 | getGreeting 时间维度 | ✅ | npc-system.js:2300-2306 |
| 1692-1698 | 好感7档随机池 | ⚠️ | 档位✓；≥20档文档列4条实际5条 |
| 1700-1701 | 名气阈值 | ✅ | 2309-2326 |
| 1707-1717 | getFeiLeiGreeting 绯泪专属 | ✅ | 2423 |
| 1720-1724 | getFarewell 阈值 | ✅ | 2671-2675 |

### 7.7 话题系统

| 行号 | 文档声明 | 判定 | 实际值/证据 |
|---|---|---|---|
| 1731-1740 | 8话题 | ✅ | data.js 8键齐全 |
| 1738 | gossip解锁≥20 | ❓ | data.js仅personal≥40/quest≥30硬约束 |
| 1739-1740 | personal≥40/quest≥30 | ✅ | data.js topicRequirements |

### 7.4(重复)预设NPC数据/7.5关系/7.6任务/7.7动态事件

| 行号 | 文档声明 | 判定 | 实际值/证据 |
|---|---|---|---|
| 1767-1776 | 10核心NPC | ✅ | data.js 10条一致 |
| 1785 | dialogueTree 8话题×5条 | ⚠️ | 8话题✅；每层条数未必5 |
| 1790 | 同门关系自动好友 | ✅ | generateNPCRelations |
| 1791 | 师徒 高等级导师→低等级学生 | ⚠️ | 实际40%概率(diff>15且random<0.4)，非无条件 |
| 1792 | 对手3%概率随机生成 | ❌ | 全文无0.03或对手随机生成逻辑(rival仅手动set) |
| 1804 | quest_gather_herbs 灵素≥30 50灵石+10好感 | ✅ | registerDefaultQuests一致 |
| 1805 | quest_defeat_bandits 铁山≥40 100灵石+武器 | ⚠️ | 奖励仅spiritStones:100，无"武器" |
| 1806 | quest_deliver_message 清虚≥20 10尊重+50经验 | ⚠️ | 奖励仅respect:10，无"50经验" |
| 1807 | quest_mine_ore 铁匠≥30 80灵石+8好感 | ⚠️ | 奖励仅spiritStones:80，无"8好感" |
| 1808 | quest_explore_dungeon 神秘老者≥50 200灵石+功法 | ⚠️ | 奖励仅spiritStones:200，无"功法" |
| 1815 | conflict 仇敌同地点→仇恨+10 | ⚠️ | 实际10%概率(random<0.1)非必然 |
| 1816 | breakthrough level≥70 2%→战斗力+5心情+20 | ❌ | 方法不存在，未实现 |
| 1817 | danger health<30 5%→记录需治疗 | ❌ | 方法不存在，未实现 |
| 1821-1827 | initNPCSystem流程 | ✅ | 2690一致(多NPCRequestSystem.registerDefaultRequests) |

### 7.10 使用示例 / 7.11 数据文件详解

| 行号 | 文档声明 | 判定 | 实际值/证据 |
|---|---|---|---|
| 1832 | showNPCDialog('mentor_01') | ✅ | npc-system.js:3097 |
| 1835 | changeTopicDialogue | ❌ | 不存在 |
| 1838 | window.questSystem.getAvailableQuests | ⚠️ | 实际 window.npcQuestSystem |
| 1841 | window.questSystem.acceptQuest | ⚠️ | 实际 window.npcQuestSystem |
| 1844 | getNPCRelationship | ✅ | 1958 |
| 1847 | window.npcManager.updateAll | ✅ | 存在 |
| 1850 | window.eventSystem.checkEvents() | ⚠️ | 实际 window.npcEventSystem |
| 1854-1874 | changeAffection等四轨/压力/特质方法 | ✅ | 全存在 |
| 1881 | executeNPCRequest | ✅ | 2237 |
| 1898 | mentor_01 icon '🧘' | ✅ | data.js:15 |
| 1900-1943 | NPC完整结构 | ✅ | data.js 各NPC块 |
| 1948-1959 | 10核心NPC详情(含特殊设定) | ✅ | 与data.js一致 |

**本段小结**：76项，✅41/❌18/⚠️16/❓1。问题聚类：文件体积/行数全失真(v4.3快照)、类行号全失效、6处方法不存在(getPlayerImpression/updateSchedule/renderBar/checkNPCConflicts等，breakthrough/danger事件根本没实现)、关系字段无trust、getDialogue签名不符、深谈子选项47实34、对手3%未实现、5预设任务奖励字段缺、挂载名questSystem/eventSystem实为npcQuestSystem/npcEventSystem。核心数值(四轨/updateFavorMax/getRelationshipStatus/8级/压力特质/打招呼阈值)准确。

---

## 八+九+十+十一+十二+补录（STRUCTURE.md 1963–2609）

### 八·v7.0扩展18文件

| 行号 | 文档声明 | 判定 | 实际 |
|---|---|---|---|
| 1973 | js/npcs/npc-milestones.js P0新增 | ❌ | 不存在 |
| 1974 | js/breakthrough-ritual.js | ⚠️ | 实际 js/cultivation/breakthrough-ritual.js |
| 1975 | js/scene-performance.js | ⚠️ | 实际 js/quest/scene-performance.js |
| 1976 | js/npcs/npc-emotions.js | ✅ | 存在 |
| 1977 | js/city-life.js 未落地 | ✅(声明准确) | 确实不存在 |
| 1978 | js/choice-memory.js | ⚠️ | 实际 js/quest/choice-memory.js |
| 1979 | js/cultivation-bottleneck.js | ⚠️ | 实际 js/cultivation/ |
| 1980 | js/landmark-explore.js | ⚠️ | 实际 js/map/ |
| 1981 | js/ui-immersive.js | ✅ | 存在 |
| 1982 | js/npc-daily-life.js | ⚠️ | 实际 js/npcs/ |
| 1983-1986 | weather/qi-environment/lifespan/world-events | ✅ | 存在 |
| 1987 | js/faction-stance.js | ⚠️ | 实际 js/factions/ |
| 1988 | js/sect-internal.js | ⚠️ | 实际 js/sects/ |
| 1989 | js/dao-companion-deep.js | ⚠️ | 实际 js/sects/ |
| 1990 | js/enemy-invasion.js P5 | ❌ | 不存在；实际 js/factions/faction-invasion.js |
| 1996-1998 | 修改3文件表 | ⚠️ | npc-milestones不存在致集成可疑；仙侠.html 67标签实142 |

### 九·未记录功能

| 行号 | 文档声明 | 判定 | 实际值/证据 |
|---|---|---|---|
| 2019 | 9.1 REALM_UNIQUE_EFFECTS 在cultivation.js | ✅ | cultivation.js:508,1172 |
| 2023 | 9.2 SKILL_COMBINATIONS 8种 | ✅ | cultivation.js:609 实测8条 |
| 2027 | 9.3 HEART_DEMON_TYPES 5种 | ✅ | cultivation.js:802 实测5条 |
| 2032 | 9.4 INSIGHT_TYPES 7种 | ✅ | cultivation.js:65 实测7键 |
| 2036 | 9.5 initiateSectWar/collectSectResources | ✅ | sects-system.js:859,828 |
| 2042 | 9.6 dualCultivate/getDaoCompanionCombos/updateDaoCompanionMood | ✅ | sects-system.js:907,970,995 |
| 2048 | 9.7 REGION_FEATURES | ✅ | regions.js:16 |
| 2052 | 9.8 showStoryDialogue+5结局 | ✅ | quest-system.js:447；5结局546/557/568/579/590 |
| 2057-2063 | 9.9 四轨/压力/特质9/深谈8类47/职业10/记忆 | ⚠️ | 深谈子选项47实34；其余✓ |
| 2067-2076 | 9.10 文件列表 | ⚠️ | npc-milestones/enemy-invasion不存在；其余路径多迁子目录 |

### 十·系统连接 v9.2 P0五步

| 行号 | 文档声明 | 判定 | 实际值/证据 |
|---|---|---|---|
| 2109-2127 | P0-1 知识层六级+API+MANUAL_TO_SKILL | ✅ | knowledge-system.js:15-20,166,248,301,313,43 |
| 2129-2138 | P0-2 SKILL_ATTACK_MOVES(equipment.js:9)+playerAttackWithMove(battle.js:1580) | ⚠️ | equipment.js:9✅；playerAttackWithMove实为battle.js:**2006**(文档1580偏移426) |
| 2140-2149 | P0-3 修炼过程化 | ✅ | 12.2确认v12.3.2已落地 |
| 2151-2163 | P0-4 恢复分级 | ✅ | restAtInn(app.js:1084)+openMedicalClinic(app.js:7666) |
| 2165-2173 | P0-5 死亡仙侠化 soul-state.js | ✅ | js/core/soul-state.js(291行) |
| 2177-2184 | P0实施顺序7步 | ✅ | 与落地一致 |

### 十一·v9.9通用事件+Admin

| 行号 | 文档声明 | 判定 | 实际值/证据 |
|---|---|---|---|
| 2237 | daily-events.js 城市6/野外6/门派6 | ✅ | js/core/daily-events.js(1045行)；DAILY_EVENT_LIST 18事件各6 |
| 2254-2285 | 11.4 debug-panel.js admin检测 | ✅ | debug-panel.js:69,71,73；app.js:245/783/2497 |

### GPT审计5(2328-2370)

| 行号 | 文档声明 | 判定 | 实际值/证据 |
|---|---|---|---|
| 2346 | P0-1 npc-system.js L2307-2315 initNPCSystem覆盖 | ❌ | L2307-2315实为getGreeting名气分支 |
| 2347 | P0-4 L1118-1196 serialize缺字段 | ⚠️ | serialize在大致区域但行号偏移 |
| 2348 | P0-5 L1342-1348 isFollowing跳过日程 | ❌ | L1342为反序列化npc.location |
| 2349 | P1-3 L2366 request_guidance | ❌ | L2366为对话文本 |
| 2350 | P1-4 L3358-3367 ADVANCED_REQUEST_TYPES门槛 | ⚠️ | 相邻但非门槛代码 |
| 2351 | P1-5 L3392-3393 先扣情分后执行 | ❌ | L3392为if(!tree)showMessage |
| 2353-2354 | P1-1/P1-2 npc-emotions L208/L216 | ✅ | 已修位置正确 |
| 2356 | P1-7 enhanced-shop L89 getItemPrice随机 | ✅ | 已改day-based priceCache |
| 2357 | P1-8 L772-780 buyback | ⚠️ | 邻近 |
| 2364 | P0-2 location-system L251/L284 | ⚠️ | 修复点实为L311 |
| 2365 | P0-3 time-system L188 minutes>=60 | ❌ | L188现为长行动≥120提示 |
| 2366 | P0-5 party-system L312-344 removeMember | ⚠️ | isFollowing=false实为L352(偏移8) |
| 2367 | P1-6 relations-panel L175 | ✅ | 位置正确 |
| 2368 | P1-6 app.js L5344 giveGiftToNPC远程 | ❌ | L5344为队伍人数；giveGiftToNPC实为app.js:5455 |

### v12.3温蘅(2373-2437)

| 行号 | 文档声明 | 判定 | 实际值/证据 |
|---|---|---|---|
| 2391-2393 | baihua三文件 主线001-014/015-032/6结局 | ✅ | 14+18=32事件✓；6结局✓ |
| 2397 | 32事件+6结局 | ✅ | 全验 |
| 2404-2412 | 自动触发三源(greet/sect/daily) | ✅ | npc-system.js:2279/sect-visit.js:243/L189 |
| 2417-2422 | npc-personal-events.js通用化6点 | ✅ | 均在 |
| 2427-2431 | special-npcs/npc-system/sects-deep-data/sect-internal/sect-visit 各修改 | ✅ | 全验 |

### 十二·缺失内容盘点(2441-2585)

| 行号 | 文档声明 | 判定 | 实际值/证据 |
|---|---|---|---|
| 2450 | 12.1#1 队伍面板UI ❌未落地 | ❌(声明过时) | 12.3.1-A2(2527)已标✅；party-system.js:570实测含职业标签/忠诚条/策略/详情弹窗。**自相矛盾**：2450❌ vs 2527✅，代码确认✅ |
| 2451-2455 | 12.1#2-6 各状态 | ✅ | 声明与代码一致 |
| 2461-2465 | 12.2 P0五步 | ✅ | 见十节(行号有偏移：restAtInn 1061→1084；openMedicalClinic 7367→7666) |
| 2469-2471 | 12.3 GPT审计5核对 | ⚠️ | npcQuestSystem 2743→2695；removeMember 344→352；P0-3 _minuteAcc自标需回归验证 |
| 2488 | 12.6 handleEnemyDisposal app.js:5506 | ⚠️ | 函数在app.js:5792(偏移286) |
| 2515 | 12.9-A 删除赠礼整类❌ | ⚠️(声明矛盾) | 2519复核修正"无需执行"；代码npc-system.js:2799确有give_gift。2515过时 |
| 2525 | 12.3.1-A2 阵法增益接入 getDefense(battle.js:561) | ⚠️ | 功能✓(battle.js:644-670读_formationBuff.def)；getDefense实为L626 |
| 2526 | maybeAutoTriggerPersonalEvent(baihua-personal-events.js:118) | ✅ | L117确认 |
| 2527 | createMemberElement(party-system.js:570) | ✅ | 功能已落地 |
| 2534 | buyBlackMarketItem(app.js:7428)/openScenarioPanel(app.js:7460) | ⚠️ | 实为7806/7838(偏移378) |
| 2536 | 12.9-B P0-3 阵法假效果 _formationBuff(profession-system.js:237) | ❌(过时/矛盾) | profession-system.js不存在；_formationBuff写入实为location-system.js:970；battle.js现已读取(644-670)✓。**自相矛盾**：2536❌ vs 2525✅，代码确认✅ |
| 2544 | CULTIVATE_DURATIONS app.js:1112 | ⚠️ | 实为1171(偏移59) |
| 2545 | player.exp+=expGain npc-system.js:415 | ✅ | L415确认 |
| 2551-2553 | 12.9-D isFollowing(572)/updateNPCAI(1523)/远程限制(3113)/syncPartyLocationToPlayer(747)/travelToCityFromList(2012) | ⚠️ | L572✓；updateNPCAI实1540(偏17)；L3113为modal非远程限制；syncPartyLocationToPlayer实party-system.js:1120(偏373)；travelToCityFromList实app.js:2070(偏58) |
| 2561-2566 | 12.9-E 批次1 各项 | ⚠️ | inventory.js:1668→1804；:793→829；quest-system.js:1049偏移；beast-taming.js:475偏移 |
| 2569 | 批次3 npc-storylines.js 7条558行 | ⚠️ | 7条✓；557行≈558✓ |
| 2571-2573 | 批次4门派深度✅v18.7；批次5/6❌ | ✅ | 声明诚实 |

### 补录·社交内容层(2587-2609)

| 行号 | 文档声明 | 判定 | 实际值/证据 |
|---|---|---|---|
| 2590 | social-content.js 约950行 零侵入DEEP_TALK_REAL_HANDLERS 12处理器 | ✅ | 实测1060行；L1003-1005注入；12处理器确认 |
| 2591 | 调度链 | ✅ | 结构一致 |
| 2596-2602 | ensureReplyBox/SUB_AFF_GATE/_dailyPaid/_fuPaid/FOLLOWUP_BUILDERS×12/familiarityLine/ta(npc)/personality16三层 | ✅ | 全验 |
| 2604-2605 | 爱情线防刷四重检查 | ⚠️ | 机制存在但**在npc-system.js非social-content.js**(npc-system.js:2889-2929)；归属描述不准 |
| 2606 | 修罗宫/百花谷专属线豁免 | ✅ | npc-system.js:2902 |
| 2607-2608 | request_heal接22部位 | ✅ | social-content.js:862-875/835 |

**本段小结**：76项，✅44/⚠️20/❌8/❓4。关键：npc-milestones.js/enemy-invasion.js不存在、18文件中9个路径已迁子目录、三处自相矛盾(队伍UI/阵法/赠礼)、行号普遍偏移(playerAttackWithMove 1580→2006偏426；syncPartyLocationToPlayer 747→1120偏373；openMedicalClinic 7367→7666偏299)、深谈子选项47实34、爱情线防刷归属描述不准。功能存在性声明(9.1-9.10常量/P0五步/日常事件/admin/温蘅32事件6结局/social-content架构)大体准确。

---

## 重大问题汇总（按严重度）

### 1. 幽灵文件（文档引用了根本不存在的文件）
- `profession-system.js`：5.0树(1317)/5.1第10层(1444)/12.9-B(2536)/加载顺序均引用，全仓不存在（v18.0副职业删除）。
- `js/npcs/npc-milestones.js`：八(1973)/9.10(2069)列为新增/现存，不存在。
- `js/enemy-invasion.js`：八(1990)/9.10(2072)/5.1(1443)引用，实际为 `js/factions/faction-invasion.js`（改名）。
- `js/city-life.js`：八(1977)列~430行新增，从未落地（部分处自标，自相矛盾）。

### 2. 整段虚构 API（文档与代码模块对不上）
- **enhancement.js（2.5节）**：`ENHANCEMENT_TYPES`/`QUALITY_LEVELS`/`enhancementRecipes` 三常量不存在（实际 `ENHANCE_CONFIG`）；`checkEnhancementMaterials`/`consumeEnhancementMaterials`/`updateEnhancementUI` 三函数不存在；`getEnhancementLevel`/`calculateSuccessRate`/`getEnhancementInfo` 名字全错。
- **cultivation.js（2.6灵根核心）**：`isHeavenlyRoot`/`getDominantRoot`/`getTechniqueAffinity` 三函数不存在；`getCultivationSpeedFromRoots` 实为 `getRootSpeedMultiplier` 公式不同(0.8+value/200非0.5+灵根/100)；天灵根倍率1.2实1.1；`trainProficiency`实`cultivateSkill`；`enlightenmentPoints`实`insightPoints`；`proficiencyData`字段`name`实`breakthroughAttempts`。

### 3. 战斗公式数值大面积错误（battle.js）
- 意志耐疼系数 0.8 → 实际0.5（physiology-config.js:102）
- hourlyRecovery 部位 +体质/10 → 实际0.5+体质/25（battle.js:1319）
- 闪避 10+速度*0.15+技能*0.08 限1~60 → 实际10+速度*0.15+轻功*0.03 限1~35（:2681）
- 格挡 10+速度*0.08+力量*0.1 伤害×(0.5+韧性/200) → 实际5+速度*0.05+力量*0.1 ×(1-(0.5+韧性*0.005))（:2702）
- 化解 10+速度*0.08+智力*0.1 → 实际10+速度*0.05+智力*0.08（:2736）
- 韧性降被暴击 toughness*0.005 → 实际toughness*0.001/*0.1
- 暴击 10%基础1.8倍 → 实际5%基础1.5倍
- 敌人30%攻灵兽 → 实际20%（:2184）
- defensive「下玩家一击×0.6」未实装（_guardTurns只置1）

### 4. 计数错误
- 扩展物品305种 → 实际~287（各子文件数全错：武器60→53/防具55→42/材料50→51/符箓20→21/功法40→38/特殊12→15）
- 基础物品38种 → 实际41（防具8→10/消耗品10→11）
- EQUIPMENT_SLOTS 12类 → 实际11
- 深谈子选项47 → 实际34
- QUEST_TYPES 6→8（漏ESCORT/EXPLORATION）；STATUSES 4→5（漏FAILED）；PRIORITIES 5→4（多列URGENT）
- TIME_PERIODS 8 → 实际9（文档该行自己列9个却标8）
- randomMap BUILDINGS 5含SECT → 实际4无SECT
- 正道21 → 实际25（故"32派"错，36才对）
- 5.1加载顺序68标签 → 实际142

### 5. NPC文档（七、7.x）几乎整段是历史快照
- 文件体积/行数全失真：special-npcs.js 22479/320 → 37933/572；npc-system.js 75170/1226/10类 → 220245/4255/7类；data.js 11343/148 → 29916/831
- 所有类行号全失效（NPC 21→562、NPCManager 466→1494、DialogueSystem 762→1803、AffectionSystem 775→1865、NPCQuestSystem 838→2192、NPCEventSystem 900→2248）
- 方法不存在：`getPlayerImpression`/`updateSchedule`/`AffectionSystem.renderBar`/`NPCEventSystem.checkNPCConflicts/checkBreakthroughs/checkDangers/getRecentEvents`（后两者意味着breakthrough/danger动态事件**根本没实现**）/`changeTopicDialogue`
- 关系字段文档列 `trust`，实际没有（是 favor/favorMax）
- 示例 `window.questSystem`/`window.eventSystem` 实际叫 `npcQuestSystem`/`npcEventSystem`

### 6. 行号引用普遍失效（最大的一类，~80处）
代表性偏差：`playerAttackWithMove battle.js:1580`→实际:2006（偏426）；`openMedicalClinic app.js:7367`→:7666（偏299）；`syncPartyLocationToPlayer party-system.js:747`→:1120（偏373）；`inventory.js:793/930/1668`→:829/标签行/:1804；GPT审计5行号(2344-2369)大多指向无关代码。**结论：文档里所有 file:line 引用都不能再当导航用，需整体重排或删除。**

### 7. 函数名/全局名对不上
- `equipSkill/unequipSkill/unequipItem`(app.js)实际 `equipSkillToSlot/unequipSkillFromPanel/unequipItemToBag`
- `performAction`实际 `performActionWithTime`
- `openForgingShop→openEnhancementUI`实际调 `openEnhancementHall`
- travel `sword`实际 `float_sword`；FORMATIONS id `standard/heal`实际 `default/healing`；building-effects `blackmarket`实际 `market`

### 8. 数值错误（app.js 变异灵根等）
- 变异战斗加成 thunder/ice 1.3、wind 1.2 → 实际1.10/1.10/1.08
- 变异修炼加成 1.15/1.10/1.20 → 实际三者都1.05
- 「雷灵根+15%/风+10%/冰+20%」→ 实际都+5%
- DUNGEON_DEFS「cave已移除只2秘境」→ 实际cave(30/3)存在共3个

### 9. 幽灵存储 API + 自相矛盾
- 数据访问表(1297) `exportQuestState`/`importQuestState` **全仓未定义**，仅typeof守卫从不触发，存档实际走 `playerQuestProgress` 直接序列化。
- 队伍面板UI：12.1(2450)❌ vs 12.9-A2(2527)✅ → 代码确认✅已落地，2450过时。
- 阵法增益：B表P0-3(2536)❌ vs A2(2525)✅ → 代码确认✅已修（battle.js:644-670读_formationBuff），2536过时且引了不存在的profession-system.js。
- 赠礼整类：12.9-A(2515)❌ vs (2519)无需执行 → 2515过时。

---

## 站得住的部分（给个公道）

核心数据 data.js（属性数组/bodyParts 22/realm 9/baseQi/terrain 10/combatStats 10 default/durability色阶/avoidance）基本全对；四轨关系公式 `updateFavorMax=floor((aff+100)/200*50+50)`、`getRelationshipStatus` 7条件、AffectionSystem 8级、压力/特质数值全准；9.1-9.10 cultivation 常量（REALM_UNIQUE_EFFECTS/SKILL_COMBINATIONS 8/HEART_DEMON 5/INSIGHT 7）全准；v12.3 温蘅32事件+6结局+自动触发三源全准；P0五步落地状态全准；社交内容层 social-content.js 架构（DEEP_TALK_REAL_HANDLERS 12/SUB_AFF_GATE/FOLLOWUP_BUILDERS 12/ta(npc)）全准；门派36、城市17、地图地形建筑等核心数据计数准。

---

## 修复建议优先级

1. **删/改幽灵文件引用**：profession-system(4处)/enemy-invasion(3处)/npc-milestones(2处)/city-life(1处)。
2. **重写虚构API段**：enhancement.js 2.5节整段、cultivation.js 2.6灵根核心段。
3. **修战斗公式数值**：9处全错（闪避/格挡/化解/暴击/韧性/耐疼/hourlyRecovery/灵兽概率/defensive减伤）。
4. **修计数**：扩展物品各子文件数、基础物品41、EQUIPMENT_SLOTS 11、深谈子选项34、QUEST_TYPES 8/STATUSES 5/PRIORITIES 4、TIME_PERIODS 9、BUILDINGS 4、正道25、5.1标签142。
5. **整体重排或删除所有 file:line 引用**（~80处失效）。
6. **修NPC文档7.x**：文件体积/行数/类行号/6个不存在方法/字段trust/挂载名。
7. **修自相矛盾3处**：队伍UI(2450)、阵法(2536)、赠礼(2515)。
8. **修函数名/全局名/数值**：equipSkill等5处、变异灵根加成、DUNGEON_DEFS cave。
9. **修5.0速览遗漏**：js/crafting/、js/extensions/两子目录(18文件)、core/cultivation/items-extended/npcs/sects 各遗漏文件。
