# 第一百四十一批 · 空 catch 分诊定案（2026-09-27）

> 本表**不含任何插桩**。它把「2125 处盲区」变成「一份点名的账」，并由 `tests/wave141-empty-catch-node.js` 上棘轮锁住。
> 一次性全量插桩已试过并**整体回滚**——理由见该套件第 3 段。

| 档 | 处数 | 判据 | 处理 |
|---|---|---|---|
| A | 286 | 有站点名，且前文命中账务动作（灵石／发货／存档／时辰／事件／角色属性） | 逐批人工插桩，**从 A 档最上面开始** |
| B | 1642 | 有站点名，前文没匹配到账务动作 | 同 A，但优先级低 |
| C | 114 | 纯能力探测（`getElementById` 之类本来就可能不存在） | **原样不动**——这是正确兜底写法，不是病灶 |
| ? | 66 | 推不出站点名 | 必须人工点名 |

## A 档全表（最要紧的一批）

| 文件 | 行 | 站点 | 命中账 |
|---|---|---|---|
| `js/app.js` | 65 | `parseSaveSlotsSafe` | 取物 |
| `js/app.js` | 298 | `startGame` | 存档 |
| `js/app.js` | 1326 | `restAtInn` | 时辰／角色属性 |
| `js/app.js` | 1341 | `restAtInn` | 角色属性 |
| `js/app.js` | 1816 | `buyFromCityShop` | 灵石／角色属性 |
| `js/app.js` | 2198 | `performEnhancementAction` | 时辰 |
| `js/app.js` | 2352 | `switchListMode` | 事件 |
| `js/app.js` | 3197 | `deleteSave` | 取物 |
| `js/app.js` | 3198 | `deleteSave` | 取物 |
| `js/app.js` | 3199 | `deleteSave` | 取物 |
| `js/app.js` | 3200 | `deleteSave` | 取物 |
| `js/app.js` | 3664 | `closeBattle` | 角色属性 |
| `js/app.js` | 4525 | `interactTalk` | 时辰 |
| `js/app.js` | 4586 | `openNpcDeepTalk` | 时辰 |
| `js/app.js` | 5436 | `showBattleUI` | 角色属性 |
| `js/app.js` | 5437 | `showBattleUI` | 角色属性 |
| `js/app.js` | 5535 | `showBattleUI` | 角色属性 |
| `js/app.js` | 5604 | `showBattleUI` | 时辰 |
| `js/app.js` | 7887 | `claimDailyIncome` | 角色属性 |
| `js/app.js` | 9150 | `haggleWanderItem` | 时辰 |
| `js/app.js` | 9152 | `haggleWanderItem` | 时辰 |
| `js/app.js` | 9425 | `onDungeonBattleResolved` | 事件 |
| `js/app.js` | 9631 | `exploreDungeonFloor` | 事件／角色属性 |
| `js/app.js` | 10209 | `openFireDepartment` | 灵石／角色属性 |
| `js/app.js` | 10959 | `settleBeastTideRaid` | 发货 |
| `js/battle.js` | 2432 | `generateRandomEnemy` | 时辰 |
| `js/battle.js` | 2439 | `generateRandomEnemy` | 时辰 |
| `js/battle.js` | 2999 | `generateRandomEnemy` | 时辰 |
| `js/beast-taming.js` | 308 | `saveBeastData` | 存档 |
| `js/beast-taming.js` | 1275 | `buyBeast` | 存档 |
| `js/building-effects.js` | 286 | `cityVoice` | 角色属性 |
| `js/building-effects.js` | 722 | `cityVoice` | 角色属性 |
| `js/city-depth.js` | 41 | `addTime` | 时辰 |
| `js/city-facilities/city-jobs.js` | 100 | `spendTime` | 时辰 |
| `js/city-facilities/city-jobs.js` | 102 | `refresh` | 时辰 |
| `js/city-facilities/city-lodging.js` | 72 | `spendTime` | 时辰 |
| `js/city-facilities/city-lodging.js` | 74 | `refresh` | 时辰 |
| `js/city-facilities/festival-fair.js` | 171 | `spendTime` | 时辰 |
| `js/city-facilities/street-stall.js` | 208 | `open` | 时辰 |
| `js/city-facilities/street-stall.js` | 209 | `open` | 时辰 |
| `js/city-facilities/teahouse-leisure.js` | 141 | `spendTime` | 时辰 |
| `js/city-facilities/teahouse-leisure.js` | 143 | `say` | 时辰 |
| `js/city-facilities/teahouse-leisure.js` | 144 | `refresh` | 时辰 |
| `js/core/daily-events.js` | 78 | `_deAddContribution` | 角色属性 |
| `js/core/daily-events.js` | 97 | `_deAdvance` | 时辰 |
| `js/core/daily-events.js` | 99 | `_deAdvance` | 时辰 |
| `js/core/daily-events.js` | 108 | `_deInBattle` | 时辰 |
| `js/core/daily-events.js` | 869 | `saveDailyEventState` | 存档 |
| `js/core/daily-events.js` | 996 | `tryTriggerDailyEvent` | 存档 |
| `js/core/game-state.js` | 67 | `clearCharacterStorage` | 取物 |
| `js/core/game-state.js` | 81 | `clearCharacterStorage` | 取物 |
| `js/core/game-state.js` | 83 | `clearCharacterStorage` | 取物 |
| `js/core/game-state.js` | 86 | `clearCharacterStorage` | 取物 |
| `js/core/soul-state.js` | 147 | `reshapeBody` | 灵石／时辰 |
| `js/core/world-loop.js` | 279 | `trainHousedBeasts` | 存档 |
| `js/crafting/alchemy-compound.js` | 303 | `validateArr` | 时辰 |
| `js/crafting/compound-ui.js` | 57 | `_nameOf` | 发货 |
| `js/crafting/compound-ui.js` | 474 | `_facHtml` | 时辰 |
| `js/crafting/forging-compound.js` | 371 | `_forgingInner` | 时辰 |
| `js/cultivation/breakthrough-ritual.js` | 604 | `showBreakthroughResult` | 时辰 |
| `js/cultivation/heavenly-tribulation.js` | 148 | `雷收入` | 发货 |
| `js/cultivation/long-retreat.js` | 160 | `buildRetreatSummary` | 角色属性 |
| `js/cultivation/long-retreat.js` | 263 | `runRetreatLoop` | 事件 |
| `js/debug-panel.js` | 754 | `resetCooldowns` | 取物 |
| `js/enhancement.js` | 80 | `savePityData` | 存档 |
| `js/enhancement.js` | 87 | `loadPityData` | 存档 |
| `js/enhancement.js` | 278 | `enhanceEquipmentSlot` | 时辰 |
| `js/event-system.js` | 602 | `handleEventChoice` | 存档 |
| `js/extensions/beast-tide.js` | 164 | `_payGardenCost` | 角色属性 |
| `js/extensions/beast-tide.js` | 206 | `_refundGarden` | 角色属性 |
| `js/extensions/cave-life.js` | 55 | `addDiary` | 存档 |
| `js/extensions/cave-life.js` | 156 | `tickDay` | 发货 |
| `js/extensions/cave-life.js` | 160 | `tickDay` | 发货 |
| `js/extensions/player-sect-bootstrap.js` | 335 | `doRecruit` | 时辰 |
| `js/extensions/player-sect-venture.js` | 73 | `advance` | 时辰 |
| `js/extensions/player-sect-venture.js` | 114 | `addC` | 存档 |
| `js/extensions/player-sect-world.js` | 80 | `advance` | 时辰 |
| `js/extensions/player-sect-world.js` | 81 | `advance` | 时辰 |
| `js/extensions/player-sect-world.js` | 89 | `syncMirror` | 时辰 |
| `js/extensions/player-sect-world.js` | 350 | `saveDip` | 存档 |
| `js/extensions/player-sect-world.js` | 609 | `settlePsWar` | 角色属性 |
| `js/extensions/player-sect-world.js` | 612 | `settlePsWar` | 角色属性 |
| `js/extensions/player-sect-world.js` | 615 | `settlePsWar` | 角色属性 |
| `js/extensions/player-sect-world.js` | 668 | `settlePsWar` | 存档 |
| `js/extensions/qiyu-encounters.js` | 522 | `qiyuChoose` | 时辰 |
| `js/extensions/resource-points.js` | 154 | `claimByPlayer` | 事件 |
| `js/factions/factions.js` | 293 | `saveFactionData` | 存档 |
| `js/global-utils.js` | 694 | `_renderMessage` | 事件 |
| `js/global-utils.js` | 696 | `_renderMessage` | 事件 |
| `js/house-system.js` | 46 | `importHouseState` | 取物 |
| `js/house-system.js` | 55 | `initHouseSystem` | 取物 |
| `js/house-system.js` | 62 | `initHouseSystem` | 存档 |
| `js/house-system.js` | 66 | `saveHouseData` | 存档 |
| `js/house-system.js` | 328 | `repairHouse` | 时辰 |
| `js/house-system.js` | 644 | `cleanDwelling` | 时辰／事件 |
| `js/lifespan-system.js` | 47 | `saveLifespan` | 存档 |
| `js/location-system.js` | 443 | `enterCity` | 事件／角色属性 |
| `js/location-system.js` | 447 | `enterCity` | 存档／事件 |
| `js/location-system.js` | 2238 | `enterSect` | 事件／角色属性 |
| `js/location-system.js` | 2241 | `enterSect` | 事件／角色属性 |
| `js/location-system.js` | 2279 | `closeSectPanel` | 角色属性 |
| `js/mail-system.js` | 441 | `playerSendMail` | 时辰 |
| `js/mail-system.js` | 540 | `saveMailData` | 存档 |
| `js/map/landmark-explore.js` | 359 | `_offerPullSword` | 存档 |
| `js/map/randomMap.js` | 2187 | `spendSpiritStones` | 灵石 |
| `js/map/randomMap.js` | 2209 | `itemNameOf` | 时辰 |
| `js/map/randomMap.js` | 2658 | `maybeForgeNemesis` | 存档 |
| `js/map/randomMap.js` | 2910 | `tryGrantGrottoLoot` | 存档 |
| `js/map/randomMap.js` | 2912 | `tryGrantGrottoLoot` | 存档 |
| `js/map/randomMap.js` | 2913 | `tryGrantGrottoLoot` | 存档 |
| `js/map/randomMap.js` | 3115 | `wildCamp` | 角色属性 |
| `js/map/randomMap.js` | 3117 | `wildCamp` | 角色属性 |
| `js/map/randomMap.js` | 3377 | `spawnEscortRaiders` | 存档 |
| `js/npcs/jealousy-assembly.js` | 427 | `_blk` | 角色属性 |
| `js/npcs/jealousy-collective.js` | 355 | `composeLanternNight` | 铜钱／角色属性 |
| `js/npcs/jealousy-collective.js` | 407 | `composeArenaStand` | 角色属性 |
| `js/npcs/jealousy-collective.js` | 472 | `composeMarketClash` | 角色属性 |
| `js/npcs/jealousy-collective.js` | 544 | `suspectLine` | 角色属性 |
| `js/npcs/leader-excursion.js` | 150 | `audienceGranted` | 时辰 |
| `js/npcs/leader-excursion.js` | 160 | `refuseAudience` | 时辰 |
| `js/npcs/marriage-offspring.js` | 107 | `_addStones` | 角色属性 |
| `js/npcs/npc-life-actor.js` | 312 | `pushNote` | 事件 |
| `js/npcs/npc-life-actor.js` | 332 | `pushRumor` | 事件 |
| `js/npcs/npc-life-actor.js` | 398 | `spreadRumor` | 事件 |
| `js/npcs/npc-lineage.js` | 145 | `marry` | 事件 |
| `js/npcs/npc-lineage.js` | 258 | `haveChild` | 事件 |
| `js/npcs/npc-lineage.js` | 325 | `inheritOnDeath` | 事件 |
| `js/npcs/npc-lineage.js` | 375 | `successionOnDeath` | 事件 |
| `js/npcs/npc-lineage.js` | 442 | `choosePlayerAfterlife` | 事件 |
| `js/npcs/npc-personal-events.js` | 1227 | `resetPersonalEventFlags` | 取物／角色属性 |
| `js/npcs/npc-personal-events.js` | 1232 | `savePersonalEventFlags` | 取物／存档／角色属性 |
| `js/npcs/npc-personal-events.js` | 1422 | `renderPersonalEventScene` | 时辰 |
| `js/npcs/npc-system.js` | 418 | `markNPCMetNow` | 灵石 |
| `js/npcs/npc-system.js` | 3312 | `respondNpcRequest` | 时辰 |
| `js/npcs/npc-system.js` | 3315 | `respondNpcRequest` | 时辰 |
| `js/npcs/npc-system.js` | 3319 | `respondNpcRequest` | 时辰 |
| `js/npcs/npc-system.js` | 3322 | `respondNpcRequest` | 时辰 |
| `js/npcs/npc-system.js` | 3326 | `respondNpcRequest` | 时辰 |
| `js/npcs/npc-system.js` | 3364 | `executeDeepTalkSubOption` | 时辰 |
| `js/npcs/npc-system.js` | 3552 | `showNPCDialog` | 事件 |
| `js/npcs/npc-system.js` | 3837 | `showBranchDialog` | 时辰 |
| `js/npcs/npc-system.js` | 4281 | `executeAdvancedRequest` | 时辰 |
| `js/npcs/rivalry-chain.js` | 79 | `saveRevengeCd` | 存档 |
| `js/npcs/rivalry-chain.js` | 83 | `currentDayNum` | 存档 |
| `js/npcs/rivalry-chain.js` | 117 | `maybeRivalRevenge` | 存档 |
| `js/npcs/skill-transmission.js` | 129 | `advance` | 灵石／时辰 |
| `js/npcs/social-content.js` | 37 | `spendMinutes` | 时辰 |
| `js/npcs/storylines-v2/batch1.js` | 54 | `getStorylineChoice` | 取物 |
| `js/party-system.js` | 263 | `importPartyState` | 存档 |
| `js/party-system.js` | 961 | `assignBagItemToMember` | 取物 |
| `js/party-system.js` | 1250 | `syncWithWorld` | 存档 |
| `js/quest/qi-arc1.js` | 21 | `record` | 角色属性 |
| `js/quest/qi-arc1.js` | 23 | `_close` | 角色属性 |
| `js/quest/qi-arc2.js` | 60 | `_收阵石` | 发货 |
| `js/quest/qi-arc2.js` | 64 | `_石在册` | 发货 |
| `js/quest/qi-arc2.js` | 65 | `_石在册` | 发货 |
| `js/quest/qi-arc3.js` | 20 | `record` | 角色属性 |
| `js/quest/qi-arc3.js` | 48 | `addItem` | 发货 |
| `js/quest/qi-arc3.js` | 72 | `stonesAdd` | 灵石 |
| `js/quest/qi-arc3.js` | 75 | `buff` | 灵石 |
| `js/quest/qi-finale.js` | 22 | `record` | 角色属性 |
| `js/quest/quest-system.js` | 455 | `importQuestProgress` | 存档 |
| `js/quest/quest-system.js` | 456 | `importQuestProgress` | 存档 |
| `js/quest/quest-system.js` | 471 | `resetQuestProgressForNewCharacter` | 取物 |
| `js/quest/quest-system.js` | 472 | `resetQuestProgressForNewCharacter` | 取物 |
| `js/quest/quest-system.js` | 473 | `resetQuestProgressForNewCharacter` | 取物 |
| `js/quest/quest-system.js` | 474 | `resetQuestProgressForNewCharacter` | 取物 |
| `js/quest/quest-system.js` | 986 | `turnInQuest` | 存档／事件 |
| `js/quest/quest-system.js` | 991 | `turnInQuest` | 事件 |
| `js/quest/quest-system.js` | 994 | `turnInQuest` | 事件 |
| `js/quest/quest-system.js` | 2135 | `advanceQuestObjectivesFromEvent` | 存档 |
| `js/reputation-system.js` | 165 | `addReputation` | 事件 |
| `js/sects/sect-cities.js` | 235 | `resolveContest` | 角色属性 |
| `js/sects/sect-cities.js` | 239 | `resolveContest` | 角色属性 |
| `js/sects/sect-cities.js` | 344 | `branchMonthly` | 发货 |
| `js/sects/sect-cities.js` | 385 | `branchMonthly` | 时辰 |
| `js/sects/sect-cities.js` | 386 | `branchMonthly` | 时辰／角色属性 |
| `js/sects/sect-court.js` | 33 | `advance` | 时辰 |
| `js/sects/sect-crisis-engine.js` | 243 | `stonesTake` | 时辰 |
| `js/sects/sect-diplomacy-world.js` | 35 | `save` | 存档 |
| `js/sects/sect-diplomacy-world.js` | 37 | `chron` | 存档 |
| `js/sects/sect-diplomacy-world.js` | 257 | `resolveAiWar` | 角色属性 |
| `js/sects/sect-diplomacy-world.js` | 265 | `resolveAiWar` | 灵石 |
| `js/sects/sect-diplomacy-world.js` | 276 | `resolveAiWar` | 时辰 |
| `js/sects/sect-disciple-life.js` | 34 | `advance` | 时辰 |
| `js/sects/sect-doom.js` | 83 | `playerStones` | 灵石 |
| `js/sects/sect-doom.js` | 103 | `setRel` | 存档 |
| `js/sects/sect-doom.js` | 113 | `npcsOf` | 存档 |
| `js/sects/sect-doom.js` | 287 | `startDoomBattle` | 角色属性 |
| `js/sects/sect-doom.js` | 729 | `reviveCandidates` | 灵石 |
| `js/sects/sect-doom.js` | 812 | `reviveSect` | 角色属性 |
| `js/sects/sect-doom.js` | 824 | `reviveSect` | 角色属性 |
| `js/sects/sect-doom.js` | 845 | `reviveSect` | 灵石 |
| `js/sects/sect-doom.js` | 846 | `reviveSect` | 灵石 |
| `js/sects/sect-facilities.js` | 993 | `fail` | 时辰 |
| `js/sects/sect-facilities.js` | 999 | `fail` | 时辰 |
| `js/sects/sect-facilities.js` | 1010 | `fail` | 时辰 |
| `js/sects/sect-facilities.js` | 1423 | `libToday` | 时辰 |
| `js/sects/sect-facilities.js` | 1474 | `libToday` | 时辰 |
| `js/sects/sect-facilities.js` | 1530 | `libToday` | 时辰 |
| `js/sects/sect-facility-life.js` | 37 | `realmTier` | 灵石 |
| `js/sects/sect-festival-succession.js` | 34 | `chron` | 灵石 |
| `js/sects/sect-festival-succession.js` | 35 | `buff` | 灵石 |
| `js/sects/sect-festival-succession.js` | 37 | `advance` | 时辰 |
| `js/sects/sect-gala.js` | 270 | `galaEnemy` | 角色属性 |
| `js/sects/sect-gala.js` | 363 | `galaEnemy` | 灵石 |
| `js/sects/sect-governance.js` | 31 | `支收` | 发货 |
| `js/sects/sect-governance.js` | 58 | `leaderName` | 灵石 |
| `js/sects/sect-governance.js` | 246 | `hasDiploFoe` | 存档 |
| `js/sects/sect-identity.js` | 43 | `addStones` | 灵石 |
| `js/sects/sect-join-flow.js` | 72 | `saveSectJoinState` | 存档 |
| `js/sects/sect-kin.js` | 39 | `advance` | 灵石／时辰 |
| `js/sects/sect-rooms.js` | 235 | `openLandmarkRoom` | 时辰 |
| `js/sects/sect-rooms.js` | 237 | `openLandmarkRoom` | 时辰 |
| `js/sects/sect-shield-errands.js` | 31 | `chron` | 灵石 |
| `js/sects/sect-shield-errands.js` | 59 | `realmTier` | 存档 |
| `js/sects/sect-shield-errands.js` | 219 | `findErrand` | 时辰 |
| `js/sects/sect-shield-errands.js` | 226 | `findErrand` | 时辰 |
| `js/sects/sect-shield-errands.js` | 263 | `findErrand` | 存档 |
| `js/sects/sect-standing.js` | 222 | `diploNudge` | 存档 |
| `js/sects/sect-story-arc.js` | 1827 | `_save` | 存档 |
| `js/sects/sect-tournament.js` | 127 | `openTournament` | 事件 |
| `js/sects/sect-tournament.js` | 300 | `runTournament` | 事件 |
| `js/sects/sect-tournament.js` | 332 | `applyTournamentOutcome` | 灵石／角色属性 |
| `js/sects/sect-trade.js` | 27 | `addC` | 灵石 |
| `js/sects/sect-trials.js` | 28 | `试发` | 发货 |
| `js/sects/sect-trials.js` | 38 | `chron` | 灵石 |
| `js/sects/sect-trials.js` | 163 | `buildGuardian` | 角色属性 |
| `js/sects/sect-visit.js` | 660 | `saveSectDiplomacy` | 存档 |
| `js/sects/sect-visit.js` | 813 | `initiateSectConflict` | 时辰 |
| `js/sects/sect-visit.js` | 825 | `initiateSectConflict` | 存档 |
| `js/sects/sect-visit.js` | 829 | `initiateSectConflict` | 角色属性 |
| `js/sects/sect-visit.js` | 852 | `proposeSectAlliance` | 时辰 |
| `js/sects/sect-visit.js` | 931 | `sectVisitPassTime` | 时辰 |
| `js/sects/sect-visit.js` | 936 | `sectVisitDeduct` | 时辰 |
| `js/sects/sect-war.js` | 28 | `addC` | 灵石 |
| `js/sects/sect-war.js` | 125 | `startWar` | 存档 |
| `js/sects/sect-war.js` | 168 | `startWar` | 角色属性 |
| `js/sects/sect-war.js` | 179 | `startWar` | 存档 |
| `js/sects/sect-war.js` | 181 | `startWar` | 存档 |
| `js/sects/sect-war.js` | 408 | `tideSiegeDayTick` | 发货 |
| `js/sects/sect-war.js` | 416 | `tideSiegeDayTick` | 角色属性 |
| `js/sects/sect-war.js` | 417 | `tideSiegeDayTick` | 角色属性 |
| `js/sects/sect-war.js` | 419 | `tideSiegeDayTick` | 角色属性 |
| `js/sects/sect-war.js` | 420 | `tideSiegeDayTick` | 角色属性 |
| `js/sects/sect-war.js` | 607 | `resolveTidePending` | 发货 |
| `js/sects/sect-war.js` | 614 | `resolveTidePending` | 角色属性 |
| `js/sects/sect-war.js` | 615 | `resolveTidePending` | 角色属性 |
| `js/sects/sect-war.js` | 640 | `resolveTidePending` | 存档 |
| `js/sects/sect-war.js` | 643 | `chronOf` | 存档 |
| `js/sects/sect-war.js` | 702 | `ensurePlayerSectDiplomacy` | 存档 |
| `js/sects/sect-war.js` | 710 | `ensurePlayerSectDiplomacy` | 存档 |
| `js/sects/sect-year-goal.js` | 235 | `choose` | 事件 |
| `js/sects/sect-year-goal.js` | 263 | `tickDay` | 事件 |
| `js/sects/sect-year-goal.js` | 273 | `tickDay` | 事件 |
| `js/sects/sect-year-goal.js` | 301 | `settleYear` | 角色属性 |
| `js/sects/sect-year-goal.js` | 334 | `settleYear` | 事件 |
| `js/sects/sects-deep-ui.js` | 166 | `sectBecomeStudent` | 时辰 |
| `js/sects/sects-deep-ui.js` | 198 | `askMasterGuidance` | 时辰 |
| `js/sects/sects-deep-ui.js` | 464 | `sectPromote` | 时辰 |
| `js/sects/sects-deep-ui.js` | 474 | `sectPromote` | 事件 |
| `js/sects/sects-deep-ui.js` | 825 | `gbVowCheck` | 时辰 |
| `js/sects/sects-system.js` | 226 | `joinSect` | 事件 |
| `js/sects/sects-system.js` | 338 | `joinSect` | 事件 |
| `js/sects/sects-system.js` | 345 | `joinSect` | 事件 |
| `js/sects/sects-system.js` | 980 | `collectSectResources` | 铜钱／角色属性 |
| `js/sects/sects-system.js` | 1055 | `_settleRelation` | 存档 |
| `js/sects/sects-system.js` | 1074 | `_settleRelation` | 灵石／角色属性 |
| `js/sects/sects-system.js` | 1794 | `acceptElderTask` | 灵石／角色属性 |
| `js/sects/sects-system.js` | 1798 | `acceptElderTask` | 角色属性 |
| `js/sects/sects-system.js` | 1854 | `donateSectStones` | 事件 |
| `js/sects/sects-system.js` | 1895 | `openSectVote` | 事件 |
| `js/sects/sects-system.js` | 1928 | `castVote` | 事件 |
| `js/sects/sects-system.js` | 1972 | `closeSectVote` | 事件 |
| `js/sects/sects-system.js` | 2042 | `tryAutoOpenWeeklyVote` | 事件 |
| `js/time-system.js` | 47 | `initTimeSystem` | 取物 |
| `js/time-system.js` | 55 | `resetTimeSystem` | 取物 |
| `js/time-system.js` | 246 | `advanceTime` | 事件 |
| `js/time-system.js` | 349 | `onNewDay` | 事件 |
| `js/travel-system.js` | 253 | `unlockTeleport` | 存档 |
| `js/world-events.js` | 265 | `participateWorldEvent` | 存档／时辰 |
| `js/world-events.js` | 269 | `participateWorldEvent` | 存档／时辰 |
| `js/world-events.js` | 430 | `saveWorldEvents` | 存档 |
| `js/world-events.js` | 451 | `resetWorldEventsState` | 存档 |
| `js/world-events.js` | 452 | `resetWorldEventsState` | 存档 |
| `js/world-events.js` | 480 | `saveCityTempModifiers` | 存档 |

## ? 档（必须人工点名）

| 文件 | 行 |
|---|---|
| `js/city-facilities/city-jobs.js` | 229 |
| `js/city-facilities/city-lodging.js` | 180 |
| `js/city-facilities/festival-fair.js` | 405 |
| `js/core/audio-synth.js` | 10 |
| `js/core/auto-save.js` | 16 |
| `js/core/festival-calendar.js` | 94 |
| `js/core/scenario-engine.js` | 463 |
| `js/core/scenario-engine.js` | 469 |
| `js/core/world-loop.js` | 386 |
| `js/crafting/alchemy-compound.js` | 393 |
| `js/crafting/forging-compound.js` | 438 |
| `js/extensions/beast-ecosystem.js` | 316 |
| `js/extensions/beast-evolution.js` | 357 |
| `js/extensions/beast-lore.js` | 160 |
| `js/extensions/beast-tide.js` | 325 |
| `js/extensions/cave-facilities.js` | 293 |
| `js/extensions/cave-life.js` | 229 |
| `js/extensions/cave-life.js` | 231 |
| `js/extensions/codex-tutorial.js` | 322 |
| `js/extensions/dungeon-dynamic.js` | 303 |
| `js/extensions/formation-system.js` | 363 |
| `js/extensions/formation-system.js` | 388 |
| `js/extensions/market-dynamic.js` | 282 |
| `js/extensions/narrative-consequence.js` | 273 |
| `js/extensions/player-sect-bootstrap.js` | 198 |
| `js/extensions/player-sect-bootstrap.js` | 606 |
| `js/extensions/player-sect-bootstrap.js` | 783 |
| `js/extensions/player-sect-ui.js` | 580 |
| `js/extensions/player-sect-venture.js` | 856 |
| `js/extensions/player-sect-venture.js` | 882 |
| `js/extensions/player-sect-world.js` | 704 |
| `js/extensions/player-sect.js` | 435 |
| `js/extensions/puppet-system.js` | 274 |
| `js/extensions/reincarnation-integration.js` | 318 |
| `js/extensions/reincarnation.js` | 240 |
| `js/extensions/resource-points.js` | 214 |
| `js/extensions/talisman-advanced.js` | 299 |
| `js/party-system.js` | 1438 |
| `js/quest/qi-arc2.js` | 54 |
| `js/quest/qi-arc3.js` | 90 |
| `js/quest/qi-arc4.js` | 507 |
| `js/quest/qi-life.js` | 175 |
| `js/quest/qi-world.js` | 184 |
| `js/sects/sect-cities.js` | 163 |
| `js/sects/sect-cities.js` | 605 |
| `js/sects/sect-court.js` | 531 |
| `js/sects/sect-diplomacy-world.js` | 395 |
| `js/sects/sect-disciple-life.js` | 492 |
| `js/sects/sect-doom.js` | 966 |
| `js/sects/sect-festival-succession.js` | 378 |
| `js/sects/sect-gala.js` | 198 |
| `js/sects/sect-gala.js` | 419 |
| `js/sects/sect-governance.js` | 365 |
| `js/sects/sect-identity.js` | 472 |
| `js/sects/sect-identity.js` | 492 |
| `js/sects/sect-kin.js` | 156 |
| `js/sects/sect-roster.js` | 134 |
| `js/sects/sect-roster.js` | 155 |
| `js/sects/sect-roster.js` | 302 |
| `js/sects/sect-standing.js` | 293 |
| `js/sects/sect-throne.js` | 301 |
| `js/sects/sect-trade.js` | 101 |
| `js/sects/sect-war.js` | 224 |
| `js/sects/sect-war.js` | 713 |
| `js/sects/sect-war.js` | 729 |
| `js/status-effects.js` | 218 |

---

## 插桩进度账

### v24.2 批（2026-09-28）：A 档头部两块落桩，共 43 处

按定案「从 A 档最上面开始」，本批把表头部两大块全部落桩（同行原位改写，零行号漂移）：

- **js/app.js 全量 25 处**（parseSaveSlotsSafe／startGame／restAtInn×2／buyFromCityShop／
  performEnhancementAction／switchListMode／deleteSave×4／closeBattle／interactTalk／
  openNpcDeepTalk／showBattleUI×4／claimDailyIncome／haggleWanderItem×2／
  onDungeonBattleResolved／exploreDungeonFloor／_fireDeptAct._pay／settleBeastTideRaid）
- **次批 18 处**：battle.js（constructor 时间线）、beast-taming.js（importBeastState／releaseBeastNow）、
  city-depth.js（addTime 中枢）、city-jobs／city-lodging／festival-fair／street-stall／teahouse-leisure
  的 spendTime·refresh·say、daily-events.js（_deAddContribution／_deAdvance×2／saveDailyEventState）

**人工判决跳过的 4 处**（按 FIX_NOTES「有意守卫（不动）」口径，不插桩不刷数）：

| 位置 | 判决理由 |
|---|---|
| `js/building-effects.js:286` | 第八十二批·FIX-05 特意加的守卫（开战前收训练弹窗，尽力而为） |
| `js/building-effects.js:722` | 吃饭 feed 失败有诚实兜底（老写法补账＋showMessage 报数），守卫是正确写法 |
| `js/core/daily-events.js:108` | 战斗中探测（getElementById/classList 能力探测族），实质 C 档 |
| `js/core/daily-events.js:996` | catch 包的是 console.warn 本身（报警路径的最后兜底），再包一层无意义 |

**读数**（wave141 棘轮，全绿）：真空 catch 总 1974→1956（本批 -43，v24.1 合并已自行收掉一批）、
A 档 288 基线 → 现读 **170**、C 档 111 未动、留痕 73→**116**。
每处留痕带站点名＋玩家损失描述＋`e && e && e.message` 空值守卫，过 F3/F4 两把尺。
