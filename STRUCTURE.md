========================================
    仙路长青 - 项目完整结构说明 v20.0.2
========================================

【v20.0.2 文档更新（2026-09-01）】基于外包审查的两份报告修正与详细化：
- **STRUCTURE 核对报告**：594 条核对项中 ~199 条有误（74 硬错 + 125 部分错），本节按实测修正
- **BUG 审查报告**：13 P0 / 68 P1 / 114 P2 / 12 设计缺陷
- **P0 全部已修**（F-1~F-11，详见 §十七 修复记录）
- 修正条目：① 装备槽 12→11，基础物品 38→41；② 扩展物品 305→~287，子文件 8→14；③ 门派正道 21→25；④ 大量行号/计数/API 名字修正
- 详见：每节末尾加注"**[v20.0.2 修正]**"；§十七 集中记录 11 个 P0 修复

【版本】 v18.9 - 世界日历（WorldCalendar）单例 + 长期闭关"闭关至事件" + 出关世界摘要（见 `v18.9_世界日历实施计划.md`·本地 D:/Download Game/游戏制作/旧计划/）；v15.3 - 社交文案人称修正（social-content.js ta(npc) 按性别输出他/她，静态池省主语）；v15.2 - 队友学绝技（PartyMember.combatAbilities 权威+玩家已掌握即可传授+采补功队友对称放宽；修复 Battle 构造器 forEach this 绑定致队员入战从未生效的存量bug）；v15.1 - 秘籍货架过滤（功法阁正店RARE保底+35%高阶×1.5价/黑市仅EPIC+40%空手×3价/境界门炼气-筑基-金丹）；v15.0 - 深谈追问层（12话题每题每日一追的二级选项对话，选择入 memory.impressions 驱动熟稔度换档开场）；v14.x - 社交页扩展（social-content.js 零侵入：话题×7+情报×5真实数据驱动、组合式问候告别时段×关系层×性格尾缀、16型性格模型personality16.js+五维微口吻、深谈回复入面板#socialReplyBox、SUB_AFF_GATE好感门禁与负面池惩罚复刻、同地点守卫npcNotCoLocated四入口、爱情动作防刷四重检查、随机对话池扩容）+ 审计5尾巴清零（NPC读档_goal恢复、npcRelationships关系唯一真源决策、同行死块/死buff/假按钮清理）；v12.3 - 温蘅（百花谷主）感情线落地（32事件+6结局+自动触发系统）+ 个人事件系统通用化（多NPC感情线支持）；v12.2 - 稳定性迭代；v12.1 - 稳定性/深度框架/石山治理（StateRegistry/GameScheduler/EconomyTransaction/EventBus/内容校验）；v12.0 - NPC问候系统扩展（首次见面名气阈值判定/后续问候每档3-5条随机池/绯泪专属问候含道侣情话）；v11.9 深谈系统2.0；v11.8 - 出售系统重构；v11.7 - NPC社交系统P0-P1修复；v11.6 修复绯泪秘密栏不显示问题；v11.5 修复resetNPCSystem未注册门派NPC；v11.4 P0/P1遗留问题修复；v11.3 NPC互动系统修复；v11.2 门派设施运行时修复；v11.1 物品系统全面修复；v10.3 门派晋升系统完整重做；v10.2 门派入门体系改造；v12.7 - 血量单一权威链路（currentCharData.health 为场外唯一血量权威，buildPlayerBattleEntity 统一战斗入口，closeBattle 写回，状态栏新增血量条）；v12.8 - 敌人类型差异化第一批（五AI行为真实生效/毒素循环poisonLoad/构装硬化/野兽猛扑/元素冰火/人形六亚型/精英魔头修饰）；v12.9 - 敌人第二批9亚型（吸血/反震/音修灵抗/幻术迷扰/遁逃noSpoils/摄气真气/金蚕蛊/剑修连击/叛徒门控）+ 修复 _consumeFormationBuff 身份错调用休眠缺陷；v13.0 - 战斗技能系统重构（COMBAT_ABILITIES注册表13项，机制从亚型解耦为招牌技+共享随机池，Entity.hasAbility 对称钩子）；v13.1 - 绝技玩家化（currentCharData.combatAbilities 权威+GameState存档，秘籍研读/敌人掉落/流浪修士传授三渠道，接触钩子门控移除实现攻防完全对称）
【v12.1 已落地】状态注册表、游戏时间调度器、经济事务、真实拍卖、借物服务、竞技场拆分、符箓基础效果、玩家庇护、内容校验；修复制作只扣第一材料、NPC生命周期调用次数漂移、宗门事件查看即结算、突破跨境/材料不扣/寿元误触发等高风险问题；顶层全局声明冲突清零并锁定关键 API 唯一拥有者；新增 tests 自动回归。
【当前已落地基线】v9.10：B1 GameState；B2 背包堆叠/出售/入口/缺失物品；B3 小时恢复累加/onNewDay 钩子/currentDay；v9.9 日常事件；v9.8.1 战斗修复；v10.0.2 面板hidden遗漏修复
【修正说明】v9.5 属性技能接入；v9.6 装备/运功槽内选择；v9.7 真气/真元/历练突破。v9.8 已落地：数据同步、getDerivedCombatStats、反击/破甲/毒抗、slash/pierce/blunt、负荷、炼制/灵根/种植。v9.8.1：躯体耐久色阶统一、击杀仅标记单体尸体、敌人AI有限自救。
【v9.9 已落地】① sect-join-flow.js 杂役入门取消炼气硬门槛（凡人可入，getRealmTier 统一境界参考）② 新建 js/core/daily-events.js（城市/野外/门派各 6 个日常事件，带冷却/权重/条件/弹窗）③ time-system 时间推进 / randomMap 野外移动（与奇遇互斥）/ sect-visit 门派内院 三处集成 ④ 仙侠.html 引用
【v9.10 B1 已落地】① 新建 js/core/game-state.js（collect/apply/reset/clear 角色键）② 存档槽 {meta,state} 完整进度 ③ startGame 重置世界 ④ deleteSave 清角色键 ⑤ 灵兽/洞府 export/import ⑥ 标题页不自动 loadInventory / 不灌灵兽洞府 ⑦ 仙侠.html 第0.5层引用。详见 版本记录.md v9.10
【v11.8 已落地】出售系统重构：① 背包出售改为"标记出售"（`markForSale`/`unmarkForSale`/`isMarkedForSale`/`getMarkedForSaleItems`），标记物品不可使用/装备/丢弃，显示🏷️图标 ② 创建 `TradeService` 统一报价公式（基础价格×回收率×地区倍率×商人需求×物品状态×口才×声望），货币分层（普通→铜钱，丹药灵石→灵石，高阶→灵石/拍卖） ③ 商店界面增加出售Tab（显示已标记物品+报价明细+一键出售）、回购Tab（120%价格回购）、Tab切换 ④ game-state.js 集成 trade 字段序列化/反序列化，resetWorld 重置标记状态
【v9.10 B2 已落地】inventory 堆叠/出售×数量；crafting addItem+角色真气；app 入口委托；13-missing-ids.js 补 28 ID
【v9.10 B3 已落地】time-system recoveryMinuteAcc；年月推导；onNewDay 导出钩子；house/shop/world-events 用 currentDay
【v9.10 B4 已落地】灵兽可被攻击/经验单次/页内无直接捕捉；秘境战斗推进；竞技场日限；宝箱日限；任务UI；宗门门槛
【v9.10 B5 已落地】currentLocation 存档；getCityBonus 导出；旅行先事件后抵达+距离+传送校验；客栈/医馆/采集出售；任务击杀/成就奖励；灵兽技能伤害类型
【规划文档】
- **【新增·分析】** `主流游戏对比与差距分析.md`·本地 D:/Download Game/游戏制作/旧计划/ — 对标《鬼谷八荒》《觅长生》《太吾绘卷》《博德之门3》《环世界》等主流游戏的全面差距分析：完全缺失的主流标配（音频/教程/自动存档/移动端/快捷键/图片资产）、内容维度差距（主线叙事密度/支线生态/手工世界/Boss战）、玩法系统逐项对比（战斗AOE与Boss机制/闭关长修/家族传承/图鉴收集）、技术工程差距（存档迁移框架/测试覆盖）、UI/UX差距、数值平衡清单、长线留存（终局空洞/成就深度/开局多样性）与 P0~P3 优先级路线图；全部结论代码实测验证并附证据索引
- **【规划·优先】** `GPT逻辑审查报告.md`·本地 D:/Download Game/游戏制作/旧计划/ — 完整逻辑审计：P0×13 / P1×19 / P2×22 / P3×5；串档、存档、背包、时间、灵兽、任务、秘境等
- **【规划·优先】** `GPT审核报告2实施计划.md`·本地 D:/Download Game/游戏制作/旧计划/ — GPT二次审计报告五批修复计划：P0禁止静默失败和假成功 → P1统一任务事件 → P2人物互动优先 → P3门派内容 → P4内容完整性
- **【规划·优先】** `GPT审查待办实施计划.md`·本地 D:/Download Game/游戏制作/旧计划/ — 五批修复顺序与验收：①停止数据损坏 ②统一背包货币 ③统一时间事件 ④核心玩法闭环 ⑤清理展示性内容（**B1～B5 关键已落地**（设施大规模差异化未做））
- **【新增·规划】** `基础内容补全开发计划.md`·本地 D:/Download Game/游戏制作/旧计划/ — 基于路线图的完整开发计划：B1~B5已完成回顾、6个阶段路线图实施计划、每阶段工作量估算、开工顺序建议（总量约5000~7700行）
- **【新增·规划】** `GPT审核报告2实施计划.md`·本地 D:/Download Game/游戏制作/旧计划/ — GPT审核报告2的五批修复实施计划：P0禁止静默失败和假成功 → P1统一任务事件 → P2人物互动优先 → P3门派内容 → P4内容完整性
- **【新增·规划】** `门派入门体系改造计划.md`·本地 D:/Download Game/游戏制作/旧计划/ — 基于 `门派扩展2大纲.txt` 的门派入门体系改造：名气/心性/身份晋升/特殊门派
- `属性现状分析与修改计划.md`·本地 D:/Download Game/游戏制作/旧计划/ — 代码实测：主属性/战斗属性/技能/灵根实际效果与缺口
- `属性系统实施计划.md`·本地 D:/Download Game/游戏制作/旧计划/ — 基于 GPT属性修改修正.txt 的 5 批次落地计划（约 420～610 行）
- [`GPT属性修改修正.txt`](GPT属性修改修正.txt) — 精简平衡方案原文
- **新增** [`js/combat-stats.js`](js/combat-stats.js) — 动态战斗属性 + 负荷
- **已落地 v9.9** [`通用事件.txt`](通用事件.txt) — 需求原文
- **已落地 v9.9** `通用事件实施计划.md`·本地 D:/Download Game/游戏制作/旧计划/ — 可执行批次 A～D
- **已落地 v9.10** [`js/core/game-state.js`](js/core/game-state.js) — 统一存档世界状态

【项目总览】60个JS文件 + 1个HTML + 1个CSS + 12个items-extended子文件 + 8个npcs子文件 + 3个cultivation子文件 + 9个sects子文件 + 3个quest子文件 + 3个map子文件 + 3个factions子文件 + 4个core子文件（scenario/knowledge/daily-events/**game-state**）+ 1个city-facilities子文件（共约87+个JS文件）

- v18.8：新增 `js/cultivation/long-retreat.js`（长期闭关）；`sect-internal.js` 增加宗门资源真实日结+StateRegistry持久化；个人事件新增 `canPlayerAccessPersonalEvent` 统一资格门禁。
- v7.3 新增 js/global-utils.js（全局命名空间、统一消息系统、数据访问层、工具函数）
- v7.3 门派扩展：沉浸式面板（enterSect）、全门派NPC（~250个）、专属装备功法、声望互斥
- v8.0 新增 js/physiology-config.js（生理系统配置）+ 重写 js/battle.js（机体扩展版）
- v8.1 护甲穿透系统（中等方案）：items.js防具新增resistance/coverage/armorDurability，battle.js新增护甲判断逻辑
- v8.2 机体扩展 v4.1：bloodVolume/oxygenDebt/危急计时/疼痛重做；头颈胸耐久归零=直接死亡
- v8.3 新增 js/battle-injuries.js（关键伤标签系统）+ 机体扩展 v4.2：CRITICAL_INJURIES/CRITICAL_EFFECTS配置表、不同危急时间（15~50回合）、仙侠修为接入（getCultivationModifiers）
- v8.4 机体扩展 v4.3：战后恢复（hourlyPhysiologyRecovery 每小时恢复+部位耐久+1）、医疗物品接入战斗（绷带/止血丹）、伤口UI查看面板、敌人AI疼痛反应+自救医疗；补丁：部位耐久跨战斗保存、SVG颜色随伤势变化、3个数据同步缺口修复
- v8.5 新增 js/loot-system.js（战利品系统 v1.0）：重构战斗掉落体系——战斗胜利不掉落物品，物品通过搜刮(人类)/解剖(野兽)获得；敌人携带物在生成时预设，由其类型/身份/等级决定；12种携带物表覆盖所有扩展物品；废弃 09-loot-sources.js；修改 battle.js/app.js/inventory.js
- v8.6 门派系统修复：joinSect()/leaveSect() 改用 Object.assign 保留 discipleState 引用修复设施无法使用；showSectPanel 增强（门派概况/成员状态/贡献兑换按钮）
- v8.6 P0 三层访问体系：sects.js 新增 SECT_FACILITY_ACCESS 权限配置；创建 sect-visit.js（山门场景/守卫对话/外院设施/内院封锁/坊市/公告栏）；location-system.js enterSect 接入新系统；sects-system.js joinSect 刷新使用新视图
- v8.7 P1 门派特色功能：创建 sect-specialties.js（32个门派各有一项独特专属功能，含buff/skill/items/quest四大类型）；内院视图新增门派特色展示区
- v8.7 P2 门派关系网+NPC对话：内院视图新增门派关系显示（同气连枝/势不两立）；新增门派弟子列表（掌门/长老/弟子可点击对话）；修复NPC命名使用 randomNameGenerator
- v8.9 P3 门派事件系统：创建 sect-events.js（14种事件，4大类型：内部/外部/灾难/福利）；内院视图新增事件面板；每5分钟检测30%概率触发
- v9.0 新增城市设施+情境引擎+门派加入流程：创建js/core/scenario-engine.js（情境事件链引擎）；创建js/city-facilities/facility-batch2.js（第二批15个设施：13个情境+2个基础）；创建js/sects/sect-join-flow.js（门派门槛条件检查）；新增首批8个基础设施；17城全部接入新设施；sect-visit.js中"加入门派"改为"申请入门"（检查灵根/性别/资质/恶名）
- v9.1 修正统计数据与游戏实际一致（门派32/城市17/基础物品38/第二批设施15）；移除废弃09-loot-sources引用
- v9.2 【规划】系统连接：知识获取层 + 功法招式战斗化 + 修炼过程化 + 恢复分级化 + 死亡仙侠化（约700行，详见 `系统连接实施计划.md`·本地 D:/Download Game/游戏制作/旧计划/）
- v9.3 【已落地 P0-1】功法知识层：js/core/knowledge-system.js；浏览UI只显示已学/听闻；equipSkill强制 canEquip；learnSecretArt/learnRandomSkill/存档 techniqueKnowledge；新角色仅听闻吐纳不可裸装
- v9.4 【已落地】运功栏改为内功/身法/绝技三槽；运功/装备均在对应栏槽内点「选择」展开；旧五槽存档 migrateSkillsToThreeSlots
- v9.5 【已落地】属性与技能全面接入：battle.js A/B/C/F1；cultivation.js 灵根核心 D1/D2（D3不采用）；poison-system.js 毒术；口才商店折扣；time-system 自然愈合 G；创建预算 E 按决策不动
- v9.6 【已落地】装备栏/运功栏槽内直接选择；移除独立运功选择与装备选择面板
- v9.6.1 【修复】战斗查看人体/SVG变色；击杀尸体灰名与详情面板
- v9.8.1 【修复】问题.txt 三项：①躯体 SVG 与耐久数字色阶同步（100/#66CC00/#FFDC00/#FF851B/#8B0000/#3f0000/黑）；②击杀仅标记当前目标尸体，禁止同格批量变尸；③敌人低血不再无限包扎（未稳定伤口 + 每场最多2次治疗）
- v9.8.1 【交互】地图人物「对话」改为「问候」：仅消息寒暄、不打开 NPC 详谈面板；「详谈」单独走 openNpcDeepTalk → showNPCDialog
- v9.9 【已落地】通用事件系统：①`sect-join-flow.js` 杂役入门取消炼气硬门槛（凡人可入，getRealmTier 统一）；②新建 `js/core/daily-events.js`（城市6/野外6/门派6日常事件，冷却/权重/条件/弹窗）；③集成 `time-system.advanceTime`（≥5min触发）/ `randomMap` 移动（与奇遇互斥,优先日常）/ `sect-visit` 内院（延时500ms）；④ `仙侠.html` 第15层引用。详见 `通用事件实施计划.md`·本地 D:/Download Game/游戏制作/旧计划/
- v11.3 【已落地】P0/P1遗留问题修复：①12-quest-extensions.js UTF-8编码损坏修复（中文字符被截断为`?`，已用正确UTF-8重写保存）；②TRIAL_RESULT枚举(PASS/FAIL/ABORT)统一各门派考核判断逻辑，`setTrialResult()`设置`trialResult`字段，未知值按失败处理。详见 [`版本记录.md`](版本记录.md) v11.3
- v11.2 【已落地】NPC互动系统修复（基于GPT审核3.txt）：①深谈选项绑定真实处理器（赠礼/请求/委托/情感互动等）；②赠礼功能从NPC深谈调用`giveGiftToNPC()`；③高级请求系统接入UI（借物/疗伤/庇护/同行等）；④NPC状态进入GameState统一存档（`npcManager.serialize()`）；⑤故事线进度纳入GameState（移除独立localStorage）；⑥同行NPC作为Battle实体参与回合制战斗（队员可被攻击/自动攻击/状态同步）。详见 [`版本记录.md`](版本记录.md) v11.2
- v11.1 【已落地】门派设施运行时修复（基于GPT审核3.txt）：B3-1设施使用游戏时间/B3-2真气改角色数据读写/B3-3效果结构化actions/B3-4议事厅固定结果/B3-5设施状态进入GameState。详见 [`版本记录.md`](版本记录.md) v11.1
- v11.0 【已落地】物品系统全面修复（基于GPT审核3.txt）：①消耗品效果键别名修复（约40种，spirit_recovery→qi_recovery, health_recovery→hp_recovery等）；②删除8种无效buff丹和转生丹/定颜丹；③20种符箓中17种标记`implemented:false`，仅保留5种实现；④新建`tal_escape`遁逃符（逃跑成功率+30%）；⑤突破丹标记`subtype:breakthrough`禁止背包使用；⑥医疗物品添加`useContext:['medical']`；⑦`learnSecretArt()`返回`{success,consumed}`，失败不消耗秘籍；⑧全部115件装备移除`special`字段，效果合并到`attrs`/`combatBonus`/`defense`/`resistance`/`speed`/`damageType`/`weight`；⑨`MANUAL_TO_SKILL`按运功/招式分类优化（太极剑法→skill_18）；⑩NPC故事线增加兼容导出名。详见 [`版本记录.md`](版本记录.md) v11.0
- v10.3 【已落地】门派晋升系统完整重做（2026-08-02）
- v10.2 【已落地】门派入门体系改造（2026-08-01）

版本记录.md位于根目录,每次更新游戏需写入更新内容

---

## 版本历史与修复记录

版本历史、BUG修复记录、开发事故已移至 [`版本记录.md`](版本记录.md)。

| 版本 | 主要内容 | 日期 |
|------|----------|------|
| v12.3 | 温蘅（百花谷主）感情线：32事件+6结局+自动触发系统（世界驱动）；个人事件系统通用化（isChainHead多NPC/结局注册表/secretId按选择解锁/好感衰减扩展） | 2026-08-24 |
| v12.0 | NPC问候系统扩展：首次见面名气阈值判定(20/50/90)/后续问候每档3-5条随机池/绯泪专属问候含道侣情话 | 2026-08-03 |
| v11.9 | 深谈系统2.0：分支对话树（3个NPC各含4-6个节点）/分支选择UI/秘密对话选项显示/选择后果记录系统 | 2026-08-03 |
| v11.8 | 出售系统重构：背包出售改为标记出售/创建TradeService统一报价公式/商店出售标签页+报价明细+回购功能/货币分层 | 2026-08-03 |
| v11.7 | NPC社交系统P0-P1修复：个人事件纳入GameState/固定核心NPC定义/关系栏面板优化/社交按钮条件限制/NPC关系网闭环 | 2026-08-03 |
| v11.6 | 秘密栏修复+里程碑删除+事件系统修复（injectSectSecrets调用时机修复） | 2026-08-02 |
| v11.5 | 修复resetNPCSystem未注册门派NPC | 2026-08-02 |
| v11.4 | P0/P1遗留问题修复 | 2026-08-02 |
| v11.3 | NPC互动系统修复：深谈选项绑定真实处理器/赠礼接入NPC页面/高级请求接入UI/NPC状态进入GameState/故事线进度纳入GameState/同行NPC真实战斗角色 | 2026-08-02 |
| v11.2 | 门派设施运行时修复：B3-1~B3-5 | 2026-08-02 |
| v11.1 | 物品系统全面修复 | 2026-08-02 |
| v10.3.1 | 修复打坐修炼真气不足误判：cultivationMeditate 中局部变量 currentCharData 未同步，存档加载后始终为 null，导致真气检查失败 | 2026-08-02 |
| v10.3 | 门派晋升系统完整重做：仅贡献晋升/通用面板/特殊身份隐藏/武当委托/设施rankReq修正 | 2026-08-02 |
| v10.2 | 门派入门体系改造：修罗宫侍妾/大隐阁/天书阁/四守卫考核 + rootValues教训 | 2026-08-01 |
| v9.10.1 | 三项Bug修复：管理队伍按钮/战斗伤势复原/负荷问号提示 | 2026-07-30 |
| v9.10 | B1～B5 逻辑审查修复 + P1-6 进化修复 | 2026-07-30 |
| v9.9 | 通用日常事件 + 杂役无境界入门（已落地） | 2026-07-30 |
| v9.8.1 | 躯体色阶同步 / 单体尸体标记 / 敌人AI有限自救 | 2026-07-30 |
| v5.0~v5.4 | 物品扩展、经济闭环、任务系统 | 前期 |
| v6.0~v6.4 | 世界构建、故事剧情、修仙深度、社交势力 | 前期 |
| v7.0 | 境界体系修订、JS文件重组织 | 2026-07-27 |
| v7.1 | 深度补全 P0-P2（强化/特效/灵兽/洞府/世界事件/声望/副职业/天气/寿命/联动） | 2026-07-28 |
| v7.2 | 城市扩展（设施25种/16城buildings≥10/分城动态坊市/交互重做） | 2026-07-28 |
| v7.3 | 结构修复 + 门派沉浸式面板（enterSect全32门派/全门派内部数据） | 2026-07-28 |
| v8.0 | 机体扩展系统（生理模板/伤口/意识/出血/医疗） | 2026-07-28 |
| v8.1 | 护甲穿透系统（中等方案：三属性抗性/部位覆盖/耐久） | 2026-07-28 |
| v8.2 | 机体扩展 v4.1（bloodVolume/缺氧/危急5分钟/疼痛；头颈胸归零即死） | 2026-07-29 |
| v8.3 | 机体扩展 v4.2（关键伤标签系统/不同危急时间/仙侠修为接入） | 2026-07-29 |
| v8.4 | 机体扩展 v4.3（战后恢复/医疗物品接入/伤口UI/敌人AI疼痛） | 2026-07-29 |
| v8.5 | 战利品系统 v1.0（搜刮/解剖系统已实施：战斗胜利不掉物，搜刮/解剖获得） | 2026-07-29 |
| v8.6 | 门派系统修复：discipleState引用断裂修复 + 面板内容增强 + P0三层访问体系 | 2026-07-29 |
| v8.7 | 门派系统重构 P1：32个门派特色功能 | 2026-07-29 |
| v8.8 | 门派系统重构 P2：关系网+NPC对话 | 2026-07-29 |
| v8.9 | 门派系统重构 P3：门派事件系统 | 2026-07-29 |
| v9.0 | 城市设施扩展+情境引擎+门派加入流程（23个新设施+门槛条件检查） | 2026-07-29 |
| v9.1 | 统计数据修正与实际一致 | 2026-07-29 |
| v9.2 | 系统连接规划（知识层/招式/修炼过程/恢复分级/死亡仙侠化） | 2026-07-29 |
| v9.3 | P0-1 功法知识层落地（堵住预设功法直接装备） | 2026-07-29 |
| v9.4 | 运功栏三槽+运功选择/装备选择折叠UI | 2026-07-29 |
| v9.5 | 属性与技能系统全面接入（战斗判定/灵根修炼/生活技能/自然愈合） | 2026-07-29 |
| v9.6 | 装备/运功槽内直接选择（取消独立选择面板） | 2026-07-29 |
| v9.7 | 境界突破系统重构：真气/真元分离、历练值、突破丹药、突破成功率系统 | 2026-07-29 |
| v9.8【规划】 | 属性系统精简平衡：数据同步、getDerivedCombatStats、反击/破甲/毒抗、三物理伤害、负荷、生活技能/灵根 | 2026-07-30 |

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

### mapData - 7个地区
```javascript
mapData = {
    '中州': {desc: '...', cities: ['帝都·长安', '洛水城', ...]},
    '东荒': {desc: '...', cities: ['太虚山', '青木城', ...]},
    '南疆': {desc: '...', cities: ['炎城', '万毒谷', ...]},
    '西漠': {desc: '...', cities: ['金城', '大漠孤城', ...]},
    '北冥': {desc: '...', cities: ['冰原城', '极寒之地', ...]},
    '蜀地': {desc: '...', cities: ['剑阁', '青城山', ...]},
    '东南海域': {desc: '...', cities: ['蓬莱仙岛', '东海龙宫', ...]}
}
```

共17个城市：中州3个（帝都·长安、洛水城、太虚山）、东荒3个（青木城、蓬莱仙岛、东海龙宫）、南疆3个（炎城、万毒谷、凤凰巢）、西漠3个（金城、大漠孤城、佛国遗址）、北冥3个（冰原城、极寒之地、万剑宗）、蜀地2个（剑阁、青城山）、东南海域2个（碧落仙宫、鲛人镇）

## 1.3 sects.js - 门派数据

### sectsData - 36个门派
每个门派包含: type(正道/邪派/中立), location, power, weapons, desc
实际门派列表（**注意**：原文档写正道21个，实际**25个**（grep type:'正道'=25）；本节按 sects.js:4-48 实测 36 条修正）：
- **正道 25 个**（原 21 错）：少林寺、武当派、全真教、华山派、嵩山派、恒山派、衡山派、泰山派、峨眉派、丐帮、大旗门、侠隐阁、药王谷、天山派、铸剑山庄、茅山派、大隐阁、天书阁、天涯海阁、神机门、霹雳堂、昆仑派、金刚宗、青城派、蓬莱派
- **中立 5 个**：五仙教、逍遥派、唐门、百花谷、铁掌帮
- **邪派 6 个**：修罗宫、阎罗殿、血手门、飞蝎坞、烈日教、天龙教

### sectPositions - 门派坐标和颜色

### sectsByRegion - 按地区分组

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

### 基础物品（items.js - 41种，文档原写38实41）
- 武器(9): 玄铁剑/御剑/雷音剑/仙人斩/钢刀/焚焰刀/灵木杖/龙魂杖/铁掌
- 防具(10): 青布帽/仙灵冠/亚麻道袍/云纹甲/九天仙衣/布鞋/飞天靴/铁戒指/灵玉戒/五行戒
- 消耗品(11): 聚气丹/筑基丹/凝金丹/回灵丹/回春丹/千年人参/灵芝/血菩提/小还丹/大还丹/攻击符/防御符/传送符
- 材料(6): 精铁/灵石/龙骨/凤凰羽/灵草/五行精华
- 秘籍(5): 基础修炼诀/基础剑法/太极剑法/九阳神功/飞天轻功

### 扩展物品系统（v5.0新增 - 实际~287种，文档原写305实数偏差）
**文件结构（实际 14 个子文件，文档原列 8 个）**：
```
js/items-extended.js                              # 主入口
js/items-extended/
├── 01-pills.js          # 丹药类（pill_ 前缀，43 种：恢复15/永久12/特殊7/突破9 + 其他）
├── 02-weapons.js        # 武器类（wpn_ 前缀，53 种：剑20/刀9/法杖8/长兵5/暗器6/拳套5）
├── 03-armor.js          # 防具类（arm_ 前缀，42 种：头饰9/护甲12/手套6/靴子8/腰带7）
├── 04-materials.js      # 材料类（mat_ 前缀，51 种：矿石14/草药14/兽类15/特殊8）
├── 05-talismans.js      # 符箓类（tal_ 前缀，21 种）
├── 06-arts.js           # 功法秘籍类（art_ 前缀，38 种：内功13/剑法9/刀法5/拳掌6/轻功5）
├── 07-food.js           # 食物/饮品（food_ 前缀，12 种）
├── 08-special.js        # 任务/特殊物品（spec_ 前缀，15 种）
├── 09-loot-sources.js   # 战利品表（孤儿模块——getExtendedLoot 实际未被主表调用）
├── 10-crafting-extensions.js  # 扩展符箓/丹药配方
├── 11-event-extensions.js     # 事件系统扩展
├── 12-quest-extensions.js     # 主线任务扩展（main_021-035 共 15 个）
├── 13-missing-ids.js    # 缺失物品 ID 补全
└── 14-ability-manuals.js # 战斗绝技秘籍（v13.1 接入）
```

**加载顺序：** items.js → items-extended子文件 → items-extended.js → inventory.js

**数据合并：** items-extended.js 自动将扩展物品合并到 window.allItems / window.itemById / window.weapons / window.armor / window.consumables / window.materials / window.secretArts

**ID前缀规则（实际数）：**
- pill_  丹药（43 种）：恢复15/增益0/永久12/特殊7/突破9
- wpn_   武器（53 种）：剑20/刀9/法杖8/长兵5/暗器6/拳套5
- arm_   防具（42 种）：头饰9/护甲12/手套6/靴子8/腰带7
- mat_   材料（51 种）：矿石14/草药14/兽类15/特殊8
- tal_   符箓（21 种）
- art_   功法（38 种）：内功13/剑法9/刀法5/拳掌6/轻功5
- food_  食物（12 种）
- spec_  特殊（15 种）
- art_      - 功法（40种）：内功13/剑法9/刀法5/拳掌6/轻功5
- food_     - 食物（12种）：恢复/增益
- spec_     - 特殊（12种）：任务/货币

### 全局导出
window.allItems, window.itemById, window.weapons, window.armor, window.consumables, window.materials, window.secretArts

========================================
【二、系统文件详解】
========================================

## 2.1 battle.js - 战斗系统（v9.5 属性与技能接入）

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

### skillPages - 50个功法(10页x5)
每个功法: id, name, icon, type, grade, desc, effect, qiCost

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
**炼丹配方（17种）：** 小还丹/大还丹/回春丹/九转还魂丹/生生造化丹/补气散/聚气丹/回灵丹/凝元丹/培元丹/筑基丹/金丹丹/洗髓丹/金刚丹/虎力丹/龙虎丹/解毒丹/辟谷丹
**锻造配方（8种）：** 玄铁剑/青钢剑/霜月剑/云纹甲/龙鳞甲/御剑/干将剑/屠龙刀
**符箓配方（6种）：** 火球符/雷击符/护身符/传送符/天雷符/净化符
**烹饪配方（4种）：** 灵米饭/参汤/灵芝粥/仙露茶

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

### TIME_PERIODS - 8个时间段
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

### 4种旅行方式
walk(步行120min), horse(骑马60min), sword(御剑20min), teleport(传送阵5min)

### 旅行风险事件
境界要求检查, 风险事件触发

## 2.13 building-effects.js - 建筑效果系统

### buildingEffectsRegistry - 12种建筑效果注册表
shop, alchemy, forging, quest, inn, training, teleport, tavern, cultivation, spring, temple, blackmarket

## 2.14 npc-system.js - NPC完整系统（约3540行）

### 工具函数
clamp/randomChoice/deepMerge

### 深谈大类定义（DEEP_TALK_CATEGORIES）
8个深谈大类，47个子选项，每个含minAffection/affectionCost

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
### 灵兽系统（v7.1 驯服/骑乘；v17.1 绝技传授+个体天赋；v17.3 逻辑收口）
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

## 2.21 randomMap.js - 随机野外地图

### MAP_CONFIG
ROWS:12, COLS:16, CELL_SIZE:40, VIEWPORT_ROWS/COLS

### TERRAIN
PLAIN/FOREST/MOUNTAIN/WATER/DESERT/SNOW/FROZEN_LAND/VOLCANO/SWAMP/SPIRIT_SPRING
REGION_TERRAIN_WEIGHTS - 七大地区地形权重

### BUILDINGS
TOWN(城镇/休息), SECT(门派), RUIN(遗迹/探索宝物), CAVE(洞府/修炼), MARKET(坊市/交易)

### generateRandomMap(rows, cols, region)
实体生成：
- 建筑 15%
- 人物 20%：personType = normal | merchant(游商约25%) | wanderer(流浪修士约20%)
  游商 symbol🛒 名称前缀「游商·」；流浪修士🗡️「流浪修士·」
- 野兽 15% type=beast

### 交互与移动
renderMap / onCellClick(x,y) - 仅相邻格移动；耗时 moveCost*10；3%奇遇
tryBeastAmbush() - 相邻野兽30%追击：移入玩家格 → 提示 → openBattleWithEntity 自动开战
getCurrentCellEntities() - 当前格实体列表
triggerBuildingEffect(building)

### 导出
window.getCurrentCellEntities, window.tryBeastAmbush, initRandomMap...

========================================
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

### 5.0 实际结构速览（2026-08-24 以 list_files + 仙侠.html 实测核对）

> **声明**：下方 5.1 的 v8.5 版加载顺序为历史记录，与当前实际有出入（部分文件已移入子目录、v10.0~v12.3 新增模块未收录）。**权威依据以 仙侠.html 的 script 标签顺序与实际文件系统为准。**

#### 实际目录组织（js/ 下，2026-08-24 实测）

```
js/
├── 根目录：achievement-system / app / battle-injuries / battle / beast-taming /
│   building-effects / combat-stats / crafting / data / debug-panel / enhanced-shop /
│   enhancement / equipment / event-system / global-utils / house-system / inventory /
│   items-extended.js / items.js / lifespan-system / location-system / loot-system /
│   mail-system(-ui/-styles) / party-system / physiology-config / poison-system /
│   profession-system / qi-environment / regions / relations-panel / reputation-system /
│   status-effects / time-system / travel-system / ui-immersive / weather-effects / world-events
├── city-facilities/   facility-batch2
├── core/              balance-config / content-validator / daily-events / event-bus /
│                      game-scheduler / game-state / knowledge-system / panel-lifecycle /
│                      reward-service / scenario-engine / soul-state(v12.3.2) / state-registry
├── cultivation/       breakthrough-ritual / breakthrough-system / cultivation-bottleneck / cultivation
├── economy/           auction-service / economy-transaction          （v12.1 拍卖/原子交易）
├── factions/          faction-invasion / faction-stance / factions   （自根目录迁入）
├── gameplay/          arena-system(真实战斗竞技场) / protection-system(势力庇护) / talisman-system(符箓)
├── items-extended/    01~13（09-loot-sources 文件仍在但已废弃不引用）
├── map/               landmark-explore / map-markers / randomMap     （自根目录迁入）
├── npcs/              baihua-events-extra/-main / baihua-personal-events / data / item-tags /
│                      name-generator / npc-borrow-service / npc-daily-life / npc-emotions /
│                      npc-life-system / npc-personal-events / npc-system / personality16(v14.2 十六型+五维) /
│                      secret-leverage(v13.6-13.8 筹码系统) / social-content(v14.0-v15.3 社交内容生成层) /
│                      special-npcs / storylines-v2/(batch1.js — v12.6 故事线重写第一批；npc-storylines.js 已废弃，html 引用移除，文件暂留)
├── quest/             choice-memory / quest-system(任务追踪v10.0) / scene-performance（自根目录迁入）
（core/ 目录 v12.4 追加：difficulty-config 战斗难度条件栏）
└── sects/             dao-companion-deep / sect-events / sect-facilities / sect-internal /
                       sect-join-flow / sect-specialties / sect-visit / sect-wudang-deep /
                       sects-deep-data / sects-deep-ui / sects-system / sects
```

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
| 飞鸽传书系统 | js/mail-system(-ui/-styles).js | v12.0 |
| 拍卖服务/原子交易 | js/economy/* | v12.1 |
| NPC生活系统/借物服务 | js/npcs/npc-life-system.js、npc-borrow-service.js | v11.x~v12.x |
| 武当深度/门派深层UI | js/sects/sect-wudang-deep.js、sects-deep-ui.js | 晋升面板 showSectRanks 所在 |
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
2. regions.js → mapData, REGION_FEATURES
3. js/sects/sects.js → sectsData, sectPositions, sectsByRegion（注意路径已变更）
4. items.js → ITEM_CATEGORIES, ITEM_QUALITIES, EQUIPMENT_SLOTS, 基础38种物品

### 第2层：命名系统（必须在randomMap、battle之前）
5. npcs/name-generator.js → SURNAMES(100姓氏), GIVEN_NAMES(500名库), generateName

### 第3层：地图与战斗
6. qi-environment.js → 14地点灵气浓度，引导修炼
7. randomMap.js → MAP_CONFIG, TERRAIN, BUILDINGS, generateRandomMap, tryBeastAmbush
8. battle.js → BODY_PARTS, Entity, Battle, generateRandomEnemy

### 第4层：扩展物品
9. items-extended/01-pills.js → 45种丹药
10. items-extended/02-weapons.js → 60种武器
11. items-extended/03-armor.js → 55种防具
12. items-extended/04-materials.js → 50种材料
13. items-extended/05-talismans.js → 20种符箓
14. items-extended/06-arts.js → 40种功法秘籍
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
23. quest-system.js → QUEST_TYPES, mainQuestChain, questSystem, GAME_ENDINGS
24. crafting.js → CRAFTING_CATEGORIES, 35配方, executeCrafting
25. enhancement.js → ENHANCEMENT_TYPES, enhancementRecipes, performEnhancement
26. cultivation.js → PROFICIENCY_LEVELS, REALM_UNIQUE_EFFECTS, SKILL_COMBINATIONS, HEART_DEMON_TYPES
27. party-system.js → PartyMember, FORMATIONS, recruitNPC
28. location-system.js → cityData, enterCity, checkAccessRequirement
29. travel-system.js → TRAVEL_METHODS, travel, checkRealmRequirement
30. building-effects.js → buildingEffectsRegistry (12种建筑效果)
31. achievement-system.js → Achievement, Task, 预设成就
32. map-markers.js → MapMarker, MapMarkerManager, 预设秘境标记
33. enhanced-shop.js → Shop, ShopManager, PresetShops, 每日限时特供

### 第7层：NPC系统
34. npcs/special-npcs.js → SPECIAL_NPC_DATA (10个特殊NPC)
35. npcs/item-tags.js → ITEM_NPC_TAGS, getItemNPCTags, checkNPCLikeItem
36. npcs/npc-system.js → NPC, NPCManager, DialogueSystem, DEEP_TALK_CATEGORIES, showNPCDialog
37. npcs/data.js → 精简NPC数据

### 第8层：NPC扩展
38. npc-emotions.js → 5种情绪+主动行为+3种玩家干预
39. npc-daily-life.js → NPC活动描述+同地互动检测
40. npc-milestones.js → 6个好感度里程碑事件（**已于 v11.6 删除该文件，js/npcs/ 下不存在，此条仅为历史记录**）

### 第9层：门派系统
41. sects-system.js → discipleState, joinSect, 门派任务
42. sect-facilities.js → 7种门派设施（已修正）
43. sect-internal.js → 生成弟子+门派会议
44. sect-join-flow.js → 门派加入流程（守卫对话/考核/侍妾/问答；v10.2 从第14层移至此以修复加载顺序问题）
45. dao-companion-deep.js → 道侣主动互动+孤单检测

### 第10层：v6.0+ 新增系统
45. reputation-system.js → 城市声望6级
46. factions.js → 5大势力+8级声望
47. faction-stance.js → 5势力立场
48. enemy-invasion.js → 敌对势力主动袭击
49. profession-system.js → 6副职业
50. beast-taming.js → 8种灵兽
51. house-system.js → 4级洞府
52. weather-effects.js → 7种天气+季节权重
53. world-events.js → 5种世界事件
54. city-life.js → 14城市氛围+市民NPC（**未落地：js/city-life.js 实际不存在，此条仅为历史规划记录**）
55. landmark-explore.js → 6大地标+探索度

### 第11层：v7.0 深度扩展
56. scene-performance.js → 场景描写+角色表情+打字机效果
57. choice-memory.js → 7组选择+8种统计+NPC引用
58. cultivation-bottleneck.js → 8境界瓶颈+5种突破方式
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
| `主流游戏对比与差距分析.md`·本地 D:/Download Game/游戏制作/旧计划/ | 主流游戏横向对比差距分析（2026-08-24）：十大最痛差距+P0~P3优先级路线图，全部结论代码实测验证并附证据索引 | ✅ 已制定 |
| `掉落系统优化计划.md`·本地 D:/Download Game/游戏制作/旧计划/ | 战斗掉落系统优化方案v3.0：搜刮/解剖系统 | ✅ 已制定 |
| `物品扩展计划.txt`·本地 D:/Download Game/游戏制作/旧计划/ | 305种物品扩展完整实施计划 | ✅ 已制定 |
| `扩展实施方案.md`·本地 D:/Download Game/游戏制作/旧计划/ | 物品扩展实施状态追踪 | 🏗️ 实施中 |
| `城市扩展计划.txt`·本地 D:/Download Game/游戏制作/旧计划/ | 城市扩展计划 | 🏗️ 已实施 |
| `NPC计划.txt`·本地 D:/Download Game/游戏制作/旧计划/ | NPC系统扩展计划 | 🏗️ 已实施 |
| `P0模块扩充计划.txt`·本地 D:/Download Game/游戏制作/旧计划/ | P0模块扩充计划 | ✅ 已实施 |
| `深度补全计划.md`·本地 D:/Download Game/游戏制作/旧计划/ | 深度补全计划 | ✅ 已实施 |
| `设施与门派实施计划.md`·本地 D:/Download Game/游戏制作/旧计划/ | 设施与门派系统重构完整计划（三批次） | 🏗️ 实施中 |
| `第一批实施步骤.md`·本地 D:/Download Game/游戏制作/旧计划/ | 第一批核心10个城市设施具体待办步骤 | ✅ 已完成 |
| `情境引擎实施计划.md`·本地 D:/Download Game/游戏制作/旧计划/ | 情境引擎文件位置规划 | ✅ 已实施 |
| `设施与门派实施计划.md`·本地 D:/Download Game/游戏制作/旧计划/ | 设施与门派系统重构完整计划（三批次） | ✅ 已制定 |
| `第一批实施步骤.md`·本地 D:/Download Game/游戏制作/旧计划/ | 第一批核心10个城市设施具体待办步骤 | 🏗️ 实施中（已完成3个原型） |

========================================
【七·附、NPC系统完整文档】（v4.3 历史文档；原编号与【七、计划文档索引】重复，予以区分）
========================================

## 7.1 文件结构
```
js/npcs/
├── special-npcs.js  # 10个特殊NPC数据（22479字节, 320行）
│   ├── mentor_01 清虚道人（导师/筑基7层）
│   ├── healer_01 灵素（治疗师/炼气3层）
│   ├── warrior_01 铁山（战士/筑基5层）
│   ├── merchant_01 贾有道（商人/炼气2层）
│   ├── elder_01 玄冰子（长老/金丹5层）
│   ├── rival_01 柳随风（竞争对手/筑基8层）
│   ├── villager_01 张大爷（村民/凡人）
│   ├── alchemist_01 丹大师（炼丹师/筑基2层）
│   ├── craftsman_01 铁匠老王（铁匠/筑基3层）
│   └── mysterious_01 神秘老者（隐士/元婴1层）
├── item-tags.js     # 物品NPC偏好标签（4834字节, 130行）
├── name-generator.js # 仙侠命名系统（9334字节, 210行）
├── npc-system.js    # NPC完整系统（75170字节, 1226行, 10个类+辅助函数）
│   ├── 工具函数: clamp/randomChoice/deepMerge
│   ├── DEEP_TALK_CATEGORIES      # 深谈大类（8大类47子选项）
│   ├── OCCUPATION_SPECIFIC_ACTIONS  # 职业交互（10种+action函数）
│   ├── NPC class                  # NPC类（四轨关系/记忆/压力/特质）
│   ├── NPCManager class           # NPC管理器
│   ├── DialogueSystem class       # 对话系统
│   ├── AffectionSystem class      # 好感度系统
│   ├── NPCQuestSystem class       # 任务系统
│   ├── NPCEventSystem class       # 事件系统
│   ├── NPCRequestSystem class     # 请求系统
│   ├── getGreeting/getFarewell    # 打招呼/告别
│   ├── getDeepTalkResponse        # 深谈响应（含负面对话）
│   ├── showNPCDialog              # 主对话面板
│   ├── showSubCategoryDialog      # 子选项展开面板
│   ├── executeDeepTalkSubOption   # 子选项执行
│   └── executeOccupationAction    # 职业交互执行
└── data.js          # 精简NPC数据（11343字节, 148行）
```

## 7.2 类结构

### NPC类（js/npc-system.js:21）
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

### NPCManager类（js/npcs/npc-system.js:466）
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

### DialogueSystem类（js/npc-system.js:762）
| 方法 | 说明 |
|------|------|
| startDialogue(npcId, dialogueId) | 开始预设对话 |
| makeChoice(index) | 做选择 |
| registerBranchDialogue(id, tree) | 注册分支对话树 |
| startBranchDialogue(npcId, treeId) | 开始分支对话 |
| getCurrentBranchText() | 获取当前节点文本 |
| getCurrentBranchChoices() | 获取可选分支 |

### NPCQuestSystem类（js/npc-system.js:838）
| 方法 | 说明 |
|------|------|
| registerQuestTemplate(template) | 注册任务模板 |
| getAvailableQuests(npcId, minAffection) | 获取可接取任务 |
| acceptQuest(questId) | 接取任务 |
| completeQuest(questId) | 完成任务 |
| registerDefaultQuests() | 注册5个默认任务 |

### NPCEventSystem类（js/npc-system.js:900）
| 方法 | 说明 |
|------|------|
| checkEvents() | 检查并触发所有事件 |
| checkNPCConflicts(npcs) | 检测仇敌冲突 |
| checkBreakthroughs(npcs) | 检测境界突破 |
| checkDangers(npcs) | 检测危险状态 |
| getRecentEvents(count) | 获取最近事件 |

### AffectionSystem类（js/npcs/npc-system.js:775）
| 方法 | 说明 |
|------|------|
| getLevel(affection) | 获取好感度等级（8级：死敌-100~-50/厌恶-49~-20/陌生-19~0/友好1~20/亲密21~40/喜欢41~60/爱慕61~80/挚爱81~100） |
| getColor(affection) | 获取等级颜色 |
| getName(affection) | 获取等级名称 |
| renderBar(affection, containerId) | 渲染好感度条（含进度条+等级名称） |

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
| ID | 姓名 | 职业 | 位置 | 境界 |
|----|------|------|------|------|
| mentor_01 | 清虚道人 | 导师 | 青云门·修炼室 | 筑基7层 |
| healer_01 | 灵素 | 治疗师 | 医馆 | 炼气3层 |
| warrior_01 | 铁山 | 战士 | 演武场 | 筑基5层 |
| merchant_01 | 贾有道 | 商人 | 坊市 | 炼气2层 |
| elder_01 | 玄冰子 | 长老 | 寒月派 | 金丹5层 |
| rival_01 | 柳随风 | 竞争对手 | 各门派 | 筑基8层 |
| villager_01 | 张大爷 | 村民 | 新手村 | 凡人 |
| alchemist_01 | 丹大师 | 炼丹师 | 炼丹房 | 筑基2层 |
| craftsman_01 | 铁匠老王 | 铁匠 | 铁匠铺 | 筑基3层 |
| mysterious_01 | 神秘老者 | 隐士 | 深山 | 元婴1层 |

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
| ID | 姓名 | 职业 | 位置 | 境界等级 | 特殊设定 |
|----|------|------|------|----------|----------|
| mentor_01 | 清虚道人 | 导师 | 青云门·修炼室 | 筑基7层/50岁 | 佛道双修,年轻时与魔教圣女有过情缘 |
| healer_01 | 灵素 | 治疗师 | 医馆 | 炼气3层/26岁 | 身患奇毒时日无多 |
| warrior_01 | 铁山 | 战士 | 演武场 | 筑基5层/30岁 | 军人世家,曾败给神秘对手 |
| merchant_01 | 贾有道 | 商人 | 坊市 | 炼气2层/45岁 | 三代经商,暗中从事禁品交易 |
| elder_01 | 玄冰子 | 长老 | 寒月派 | 金丹5层/65岁 | 寒冰真气反噬随时走火入魔 |
| rival_01 | 柳随风 | 竞争对手 | 各门派 | 筑基8层/25岁 | 魔教卧底,风度翩翩但眼神危险 |
| villager_01 | 张大爷 | 村民 | 新手村 | 凡人/60岁 | 年轻时梦想修仙,见过很多修仙者 |
| alchemist_01 | 丹大师 | 炼丹师 | 炼丹房 | 筑基2层/55岁 | 曾经炼丹失败炸毁山洞 |
| craftsman_01 | 铁匠老王 | 铁匠 | 铁匠铺 | 筑基3层 | - |
| mysterious_01 | 神秘老者 | 隐士 | 深山 | 元婴1层 | - |

---

## 八、v7.0 深度化扩展（2026-07-27）

**基于**：[`扩展计划.txt`](扩展计划.txt) — 分析结论：所有系统都是"可触发"的，但都不是"可沉浸"的

**总览**：18个新增JS文件 + 3个修改文件，约4000行代码，5阶段24子项全部完成

### 新增文件（18个）

| 阶段 | 文件 | 行数 | 功能 |
|------|------|------|------|
| P0 | js/npcs/npc-milestones.js | ~400 | 6个好感度里程碑事件+场景演出+分支选择+奖励 |
| P0 | js/breakthrough-ritual.js | ~400 | 5阶段突破仪式+条件检查+异象+副作用 |
| P0 | js/scene-performance.js | ~350 | 场景描写+角色表情+打字机效果+分支选择 |
| P1 | js/npcs/npc-emotions.js | ~350 | 5种情绪+主动行为+3种玩家干预 |
| P1 | js/city-life.js | ~430 | 14城市氛围+市民NPC+闲聊情报（**未落地，文件不存在**） |
| P1 | js/choice-memory.js | ~300 | 7组选择+8种统计+NPC引用+结局影响 |
| P2 | js/cultivation-bottleneck.js | ~300 | 8境界瓶颈+5种突破方式+心魔滋生 |
| P2 | js/landmark-explore.js | ~350 | 6大地标+探索度+奖励+隐藏内容+图鉴 |
| P2 | js/ui-immersive.js | ~250 | 7种特效+伤害数字+获得动画+地点过渡 |
| P3 | js/npc-daily-life.js | ~120 | NPC活动描述+同地互动检测 |
| P3 | js/weather-effects.js | ~100 | 7种天气+季节权重+战斗/采集修正 |
| P3 | js/qi-environment.js | ~100 | 14地点灵气浓度+引导修炼+灵气枯竭 |
| P4 | js/lifespan-system.js | ~80 | 9境界寿元+突破增加寿元+每日更新 |
| P4 | js/world-events.js | ~50 | 5种世界事件+每10天触发 |
| P5 | js/faction-stance.js | ~50 | 5势力立场+加入自动降低敌对声望 |
| P5 | js/sect-internal.js | ~50 | 生成弟子+门派会议 |
| P5 | js/dao-companion-deep.js | ~45 | 道侣主动互动+孤单检测 |
| P5 | js/enemy-invasion.js | ~30 | 敌对势力主动袭击战斗 |

### 修改文件（3个）

| 文件 | 修改内容 |
|------|---------|
| js/npcs/npc-system.js | changeAffection集成里程碑检查 + 对话框里程碑进度条 + 情绪状态条 + 干预按钮 + AI情绪行为 |
| js/cultivation.js | 新增PROFICIENCY_MASTERIES 5大阶段 + getProficiencyMastery/getMasteryProgress/triggerTrainingInsight |
| 仙侠.html | 保留原始DOM结构，新增18个JS文件加载（共67个script标签） |

### 沉浸感提升对比

| 维度 | 扩展前 | 扩展后 |
|------|--------|--------|
| NPC对话 | 8大类47子选项+好感度门槛 | 里程碑事件+情绪影响+日程可见+道侣互动 |
| 主线剧情 | 35步+剧情演出+结局 | 场景描写+角色演出+分支选择+选择记忆 |
| 修炼 | 熟练度10级+领悟+境界质变 | 突破仪式+瓶颈期+5阶段可视化+灵气环境 |
| 城市 | 16城市+特色建筑+专属NPC | 市民NPC+氛围+日常事件+闲聊情报 |
| 势力 | 5大势力+8级声望+冲突 | 立场博弈+主动入侵+声望互斥 |
| 交互 | 静态面板+alert弹窗 | 特效粒子+伤害数字+获得动画+过渡描写 |

### 总完成度：24/24子项 ✅ 100%

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
> 详细步骤与验收：`系统连接实施计划.md`·本地 D:/Download Game/游戏制作/旧计划/
> 来源分析：[`参考3.txt`](参考3.txt)、[`GPT扩展3.txt`](GPT扩展3.txt)

## 10.1 现状断层（已用代码验证）

| 断层 | 现状 | 关键代码 |
|------|------|----------|
| 功法五套平行数据 | skillPages / secretArts / learnedSecrets / proficiencyData / currentSkills 互不强制校验 | equipSkill 不检查 learnedSecrets |
| 战斗无招式 | 仅 playerAttack(partId) 选部位 | battle.js |
| 修炼抽象 | 消耗真气→修炼经验 | cultivationMeditate / cultivateSkill |
| 客栈全恢复 | 生命/真气/精力直接=100 | restAtInn / building-effects inn |
| 死亡单一 | 头颈胸归零即死，金丹与凡人同规则 | checkDeath |
| 知识全知 | 功法浏览页可直接装备任意定义 | skillPages UI |

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
> 需求原文：[`通用事件.txt`](通用事件.txt)
> 实施计划：`通用事件实施计划.md`·本地 D:/Download Game/游戏制作/旧计划/

## 11.1 问题摘要（代码实测）

| 问题 | 位置 | 说明 |
|------|------|------|
| 入门强制炼气 | [`js/sects/sect-join-flow.js`](js/sects/sect-join-flow.js) `checkSectRequirements`：`(player.realm \|\| 0) < 1` | realm 实为字符串；杂役本应凡人可入 |
| 加入后职位 | [`js/sects/sects-system.js`](js/sects/sects-system.js) `joinSect` → `rank: 7` 杂役 | 职位正确，门槛过严 |
| 缺世界填充事件 | 无 `daily-events` | 仅有奇遇（奖励型）、sect-events（门派宏观）、scenario（设施剧情） |

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
| 🔧 生活技能 | 9种技能逐个修改、一键100 | 修改 `lifeSkills` |
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

## GPT审计5修复计划

| 路径 | 说明 |
|------|------|
| `GTP审计5.txt`·本地 D:/Download Game/游戏制作/旧计划/ | 审计原文（1408行）；配套的《GTP审计5修复计划.md》原文档已移除，修复项已随 v12.1 等版本落地 |

### 问题分类（共26项）

| 优先级 | 数量 | 核心问题 |
|--------|:----:|---------|
| **P0（崩溃级）** | 5 | questSystem/eventSystem被覆盖、玩家位置分裂、NPC无分钟累加器、NPC读档丢失数据、离队跟随未清除 |
| **P1（功能损坏）** | 11 | 精力0误判、每日次数共享、请求指点失败、门槛不一致、先扣情分后执行、远程互动、商店价格波动、回购丢失装备属性/钱物两空/固定灵石、冷却不进存档 |
| **P2（体验问题）** | 10 | 情报假内容、治疗不治伤势、传功与NPC无关、借物不可靠、介绍不从关系网、调解未调解双方、庇护用现实时间、clearBuyback未调用、两套关系结构、NPC主动行为仅通知 |

### 关键文件涉及

```
js/npcs/npc-system.js
  ├── P0-1: L2307-2315 initNPCSystem覆盖questSystem/eventSystem
  ├── P0-4: L1118-1196 serialize()缺schedule/dialogueTree/inventory等
  ├── P0-5: L1342-1348 isFollowing跳过日程
  ├── P1-3: L2366 request_guidance->guidance不存在
  ├── P1-4: L3358-3367 ADVANCED_REQUEST_TYPES门槛
  └── P1-5: L3392-3393 先扣情分后执行

js/npcs/npc-emotions.js
  ├── P1-1: L208 charData.energy || 100
  ├── P1-2: L216 dailyKey无npcId
  └── P1-11: L214/224 _socialCooldowns/_socialDailyCounts不进存档

js/enhanced-shop.js
  ├── P1-7: L89 getItemPrice()每次Math.random()
  ├── P1-8: L772-780 buyback不保存装备实例
  ├── P1-9: L813-822 先扣钱后加物品
  └── P1-10: L947 回购固定灵石

js/location-system.js -> P0-2: L251/L284-307 currentLocation不更新currentCharData.location
js/time-system.js -> P0-3: L188 minutes>=60才更新NPC
js/party-system.js -> P0-5: L312-344 removeMember未清除isFollowing
js/relations-panel.js -> P1-6: L175 远程打开showNPCDialog
js/app.js -> P1-6: L5344 giveGiftToNPC远程赠礼
```

---

## v12.3 温蘅（百花谷主）感情线 + 个人事件系统通用化

### 概述
第二条完整感情线。与绯泪线（修罗宫主·复仇者）形成极端反差：温蘅是"温柔面具下的孤独医者"。核心矛盾——一个能看穿所有人的人，却二十年没人看穿过她。
完整剧本：`百花谷温蘅感情剧情实施计划.md`·本地 D:/Download Game/游戏制作/旧计划/

### 人物定稿
| 项目 | 内容 |
|------|------|
| NPC ID | `sect_leader_百花谷` |
| 姓名 | 温蘅（江湖称号"花仙子"） |
| 年龄 | 36岁（天赋异禀，三十余岁已至金丹；容貌如二十许人，琥珀色眼睛） |
| 位置 | 百花谷（白鹿泽） |
| 境界 | 金丹4层 |
| 性格 | 轻声细语、笑眼弯弯、洞察力极强、不信任任何人 |

### 文件结构
```
js/npcs/baihua-events-main.js        主线情缘链 bh_event_001~014（BAIHUA_MAIN_EVENTS_A/B/C 合并）
js/npcs/baihua-events-extra.js       她的日常 015~024 + 她的靠近 025~032（合并注册进 NPC_PERSONAL_EVENTS）
js/npcs/baihua-personal-events.js    BAIHUA_ENDINGS 六结局 + 结局注册 + maybeAutoTriggerBaihuaEvent 自动触发系统
```
加载顺序：npc-personal-events.js → baihua-events-main.js → baihua-events-extra.js → baihua-personal-events.js（仙侠.html 第15层区域引用）

### 剧情结构（32事件 + 6结局）
- **主线链**（严格链式，好感20→85）：药很苦→花圃的规矩→试毒的人→夜诊(限21~5时)→她的手→迷幻术→恩将仇报🔓秘密01→医者病了→花语→面具🔓秘密02→牡丹的酒→质问→看穿我🔓秘密03→终章·花开
- **日常**（"做了但不说"）：提神药茶/伤药/花粥/驱虫香囊/手绘地图/留灯的药庐/一对杯盏/暖房旁的院子/药膳/她记得你的忌口
- **接近**（"主动但不承认"）：恰好浇水/借你医经/谷口散步/送花糕/她记得/门边的药筐/她承认了/递药时的指尖
- **六结局**：并肩🌸恋人同行 / 归谷🏡恋人守护 / 知己🤝朋友同行 / 药庐🍵朋友守护 / 花冢🥀辜负(负面≥5兜底) / 面具😊错过；恋人结局自动 setFlag('dao_companion')
- **三层秘密**：bh_secret_01温柔的来历 / bh_secret_02医者的刀 / bh_secret_03看穿孤独（定义于 sects-deep-data.js 百花谷 master.secrets）

### v12.3 自动触发系统（世界驱动而非菜单驱动）
```
maybeAutoTriggerBaihuaEvent(source)
  source='greet' : getGreeting() 百花谷分支调用（主要途径，玩家找她互动时概率弹出）
  source='sect'  : sect-visit.js showSectGateScene 进入百花谷时调用
  source='daily' : timeSystem.onNewDaySubscribe 且玩家在百花谷（概率×0.4 兜底）
筛选条件：autoTrigger 标记 + 未完成 + isChainHead 链头 + 好感达标 + 冷却完毕 + timeRange/location 校验
仪式感保留：007/010/013/014 四个大节点无 autoTrigger，仅手动触发
```

### npc-personal-events.js 通用化改造（向后兼容）
| 改造点 | 说明 |
|--------|------|
| `isChainHead()` | xl_ 前缀拼接 → 按 npcId+链分组找序号前驱判断，任意NPC可用 |
| 秘密解锁 | `eventDef.unlockSecret` 字段 + effects 返回 `result.secretId`（按选择解锁）优先，旧硬编码兜底 |
| 结局注册表 | `NPC_ENDING_SETS` + `registerEndingSet(npcId, set)`；`showEndingScene(endingId, npcId)` 多NPC查找 |
| 结局回调 | `NPC_ENDING_CALLBACKS` + `registerEndingCallback(npcId, cb)`；修罗宫副门主副作用限定其NPC |
| 终章映射 | `eventDef.endingMap` 字段声明结局名→结局ID映射，回退修罗宫映射 |
| 好感衰减 | `checkDailyAffectionDecay()` 扩展至 [sect_leader_修罗宫, sect_leader_百花谷] |

### 其他修改文件
| 文件 | 修改内容 |
|------|----------|
| `js/npcs/special-npcs.js` | `SPECIAL_NPC_DEFINITIONS['sect_leader_百花谷']` 固定定义（含 trueName/title/background） |
| `js/npcs/npc-system.js` | `getGreeting()` 百花谷分支（问候后调 maybeAutoTriggerBaihuaEvent('greet')）；新增 `getWenHengGreeting()`（名气阈值/道侣池/七档好感池）；`bond_dao` 对温蘅禁用 |
| `js/sects/sects-deep-data.js` | 百花谷谷主 `花仙子48岁`→`温蘅36岁`+secrets 定义；牡丹 40→28岁 |
| `js/sects/sect-internal.js` | 掌门映射 `'百花谷':'花满楼'`(错误)→`'温蘅'` |
| `js/sects/sect-visit.js` | `showSectGateScene()` 百花谷时调 maybeAutoTriggerBaihuaEvent('sect') |
| `仙侠.html` | 引用三个新文件（npc-personal-events.js 之后） |

### 后续可做
- 玩家验证自动触发手感后，可将同一机制回灌绯泪线（xl_ 事件补 autoTrigger 字段即可，框架已通用）
- 百花谷弟子专线（requireDisciple 链）预留扩展

---

========================================
【十二、当前缺失内容盘点（2026-08-24 代码实测核对）】
========================================

> 本章节为对全部规划文档与实际代码逐项核对后的「还缺什么」权威清单。已完成项不再罗列，仅列**未落地/部分落地/待确认**项。

## 12.1 剩余任务实施计划6项核对结果（`剩余任务实施计划.md`·本地 D:/Download Game/游戏制作/旧计划/）

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

## 12.3 GPT审计5修复计划26项核对结果（`GTP审计5.txt`·本地 D:/Download Game/游戏制作/旧计划/）

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
| 战斗死亡系统分析（`战斗死亡系统分析.md`·本地 D:/Download Game/游戏制作/旧计划/） | 平衡性两因未调：①玩家部位耐久800+ vs 敌人伤害5~20（数十回合才能致死）②危急计时5游戏分钟=50回合过长 | 战败处置已落地（handleEnemyDisposal [app.js:5506](js/app.js:5506) + 队友救助），但「玩家几乎不会死」的数值根因仍在 |
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

### A. 社交面板无用选项清理计划（`社交面板无用选项清理计划.md`·本地 D:/Download Game/游戏制作/旧计划/）

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

### C. 经验系统整合改造计划（`经验系统整合改造计划.md`·本地 D:/Download Game/游戏制作/旧计划/）

| 计划项 | 状态 | 说明 |
|--------|------|------|
| 修炼时长选择（片刻/时辰…） | ✅ 已落地 | CULTIVATE_DURATIONS [app.js:1112](js/app.js:1112) |
| **删除 exp/cultivationExp 冗余字段** | ❌ 未执行 | `player.exp += expGain` 仍存在于论道等处（[npc-system.js:415](js/npcs/npc-system.js:415)）；「打坐只产真元、战斗只产历练」单一来源原则未贯彻 |

### D. NPC位置跟随/标准化（`NPC位置跟随系统实施计划.md`·本地 D:/Download Game/游戏制作/旧计划/）

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
| `剩余大任务实施方案.md`·本地 D:/Download Game/游戏制作/旧计划/ | 四大剩余任务的完整落地方案：一、战斗数值平衡（伤害×1.5系数+要害倍率+危急缩短50→20回合，约105行）；二、批次1基础UI（搜索排序/购买数量/装备比较来源提示/任务追踪地图标记，约320行）；三、12核心NPC故事线（实测发现 npc-storylines.js 已有7条五段雏形558行未接电，走桥接适配器救活+补3条新线，约600行）；四、4门派深度样板（武当/修罗宫/万毒谷/铸剑山庄四件套：考核链+师徒+内部派系+专属剧情，引擎+配置分两批，约1450行）。含现状代码实测、数值推算、分批验收标准与4个待确认决策点。 |

---

## 补录：社交内容生成层架构（v14.0-v15.3，2026-08-26 以代码核对补记）

### 定位与集成模式
- js/npcs/social-content.js（约950行）是深谈/问候/告别的**内容生成层**，与 npc-system.js 的关系为「零侵入注入」：向 window.DEEP_TALK_REAL_HANDLERS 写入12个处理器（executeDeepTalkSubOption 优先调度），并最外层包装 getGreeting/getFarewell/executeAdvancedRequest。
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

## 十七、v20.0.2 P0 修复记录（2026-09-01）

按用户偏好**"结构最合理"**而非最小改动，11 个 P0 全部修复。**结构合理原则**：
1. **用 StateRegistry 收状态，不在 game-state.js 列键名**（避免"每新增模块都改 game-state.js"的石山）
2. **走 EventBus 事件总线，不在调用方补丁式调 updateQuestObjective**（保持数据流一致）
3. **守卫方法抽到 ItemInstance 内部，不散落 3 处**（单一职责）
4. **死代码直接删，不保留旧逻辑兜底**（清晰胜过兼容）

### F-1 主线三连死锁 → 重构为完整事件桥
**根因**：
- 12-quest-extensions.js merge() 只 push 数组，未注册到 QuestRegistry → `findQuestById` 返 null
- registerQuestEventBridge 监听 9 类事件，缺 join_sect + breakthrough_realm
- location-system / npc-system / dungeon 通关 全无 EventBus.emit
- 结局条件 `completedMainQuests >= 35`，但主线仅 20 个，5 结局全部不可达

**修复**：
| 文件 | 改动 |
|------|------|
| `12-quest-extensions.js` | merge() 末尾补 `QuestRegistry.registerMany(extraMain/extraRandom/extraNPCQuests)` |
| `quest-system.js` | ① 桥监听 13 类事件（含 sect:joined/reputation:changed/quest:completed）；② questObjectiveMatches 补全 9 个 type handler；③ 结局 35→20 |
| `sects-system.js` | joinSect 末尾 `EventBus.emit('sect:joined', {sectId, rank})` |
| `location-system.js` | enterCity 末尾 `EventBus.emit('location:visited', {locationId, locationName})` |
| `npcs/npc-system.js` | showNPCDialog recordPlayerAction 旁 `EventBus.emit('npc:talked', {npcId, npcName})` |
| `app.js` | dungeon 通关点 line 7129/7294 `EventBus.emit('dungeon:completed', {dungeonId, dungeonName})` |
| `reputation-system.js` | addReputation 末尾 `EventBus.emit('reputation:changed', {cityName, amount, total})` |
| `quest-system.js` | turnInQuest 末尾 `EventBus.emit('quest:completed', {questId, questType})` |

### F-2 突破材料 ID 写错
- `breakthrough-ritual.js`: `'金丹→元婴'` `pill_婴变` → `pill_primordial`；`'元婴→化神'` `pill_化神` → `pill_divine`

### F-3 合成成功 ReferenceError
- `crafting.js:961`: `profession: profId` → `profession: (typeof qSkill === 'string' && qSkill) ? qSkill : null`（用作用域内已有 qSkill 替代未定义 profId）

### F-4 队伍原型重写致队友无敌 → 改单方法覆写
- `party-system.js`: 删除 `PartyMember.prototype = {...PartyMember.prototype, ...}` 整体替换（spread 不复制 class non-enumerable 方法），
  改为 `const __origTakeDamage = PartyMember.prototype.takeDamage; PartyMember.prototype.takeDamage = function(amount) {... __origTakeDamage.call(this, amount);}` + 幂等守卫 `__patchedBattleTracking` 避免重复覆盖

### F-5 爱情线冷却未序列化
- `npcs/npc-system.js`: serialize memory 补 `_loveCd` + `_loveAccepted_confess` 字段；deserialize 对应还原

### F-6 discipleState 存档丢失 13 个下划线字段
- `sects/sects-system.js`: StateRegistry register('discipleState') 的 export/import/reset 三处全补 13 字段：`_masterId/_masterName/_masterSect/_masterBlessDay/_leftMasters/_chushiDone/artInsights/isConcubine/concubineFavor/_sectEventDay/_pendingSectEvent/_sectTaskDay/_lastSalaryDay`

### F-7 标记出售 3 处绕过 → 抽守卫方法 + 删死代码
**重构**（不再散落 3 处）：
- `inventory.js` ItemInstance 类内新增 3 个方法：`isMarkedForSale() / canBeUsed(reason) / canBeEquipped() / canBeDiscarded()`，统一检查 markedForSale 字段
- `equipItemFromInventory` / `showDiscardConfirm` 改用 `slot.canBeEquipped()` / `slot.canBeDiscarded()` 调用
- `markForSale` maxSlots 守卫保留（属背包容量而非 canBeX 守卫）
- **删除 enhanced-shop.js dead code Shop.sellItem**（v10.5 已废弃走 inventory.sellItem → markForSale → TradeService，grep 全 js/ 无 .sellItem() 调用方）

### F-8 回购物品货币错配 + count=0 快照
- `enhanced-shop.js`: executeSell 改为"先快照再扣减"；_addToBuyback 签名增 `currency` 参数并保存到 item 条目（之前 currency 从未写入，回购永远按 spiritStones 扣款）

### F-9 / F-11 邮件/独立 localStorage 键 → 走 StateRegistry
**重构**（不再 hardcode 键名）：
- mail 已由 mail-system.js 注册 StateRegistry('mail')，game-state.js 撤回 saveData.mail 字段
- sect_diplomacy 已由 sect-visit.js 注册 StateRegistry('sectDiplomacy')，撤回 game-state.js 字段
- quest-system.js 末尾**新增** StateRegistry('trackedQuests') 注册
- storylines-v2/batch1.js **新增** StateRegistry('storylineChoices') 注册，缓存到 `_choicesCache` 内存 + 同步 localStorage
- CHARACTER_STORAGE_KEYS 补 `xianxia_storyline_choices`
- game-state.js 删 collect 字段 + writeKey 路径

### F-10 跨天只触发一次 onNewDay
- `time-system.js`: 改为 `for (var _d = gameTime.currentDay + 1; _d <= newDay; _d++) { onNewDay(_d - 1, _d); }` 循环触发

### 改动文件清单（12 个）
`js/cultivation/breakthrough-ritual.js` / `js/crafting.js` / `js/party-system.js` / `js/npcs/npc-system.js` / `js/sects/sects-system.js` / `js/enhanced-shop.js` / `js/inventory.js` / `js/time-system.js` / `js/core/game-state.js` / `js/quest/quest-system.js` / `js/items-extended/12-quest-extensions.js` / `js/location-system.js` / `js/reputation-system.js` / `js/npcs/storylines-v2/batch1.js`

### 回归测试
✅ 28 个 Node.js 测试套件 0 failed（2692+83+19+28 分套件），包括 npc-life-actor 20 passed（重跑后稳定）。  
⚠️ tests/static-check.py 报 FAIL：8 个 public API 行号 mismatch（STRUCTURE 报告"行号漂移"问题，硬编码旧行号与实际不符，非代码 bug）。

---

## 二十、v20.0 内容扩展实施记录（2026-09-02，外包交付，本轮移植自 html-0bd3fb25-source/）

### 二十.1 内容扩展（第0层/第1层/D-13/第2层/F-15/F项核查/机制设计原则）

基于《计划/v20.0_内容扩展总计划.md》系统落地，端口 8000 全程验证通过，每项 node --check。

### 第0层·接线（让既有死代码通电）
- 0.2.1 境界质变：`buildPlayerBattleEntity` 读 `getRealmBonus(realm)` 注入 attack/defense/speed 乘数（app.js + battle.js getAttack/getDefense/getSpeed）
- 0.2.2 灵根五行：① cultivationMeditate/cultivateQi 改单元素根倍率（`getRootSpeedMultiplier(roots, _getMainTechniqueElement())`）；② 组合技 `getSkillCombinationBonuses` 注入战斗（all_attr 落六维，attack/defense 作乘数）；③ 五行相克 `getElementalDamageMul` 对元素生物 ±15%；④ `canUseTechniqueByRoots` 已在 equipSkill 唯一入口硬校验（核查确认通）
- 0.2.3 心魔+瓶颈：心魔 bonus 统一存 `currentCharData._heartDemonBonus`；`applyBottleneckEffect`/`attemptBreakBottleneck` 此前零调用→cultivationMeditate 末尾首次触发弹面板 + 修炼面板常驻"突破瓶颈"入口
- 0.2.4 love四轨：`changeLove` 接入 5 个爱情互动成功分支（express_like+3/spend_time+4/confess+8/intimate+10/bond_dao+20）；`changeAffection` 调 `updateFavorMax`
- 0.2.6 双修合击：`getDaoCompanionCombos` 注入 `buildPlayerBattleEntity`（_daoComboBonus，all→六维，attack/defense→乘数）
- 0.2.7 loot/cultivateQi：UNDEAD/CONSTRUCT/ELEMENTAL 补 uncommon/rare；`generateEnemyInventory` 接通 `getExtendedLoot`（EXTENDED_LOOT_TABLES 断线修复）；`cultivateQi` 改单元素根 + 仙侠.html 加"运功炼气"按钮；scenario 续关+境界门控

### 第1层·十大标志玩法（新建系统）
| 项 | 文件 | 核心机制 |
|---|---|---|
| 1.1 天劫战 | `js/cultivation/heavenly-tribulation.js` | 渡劫期满多波雷劫(3-9波)+中段心魔劫+道侣护法减免30%+失败走残魂+成功飞升 |
| 1.2 主动招式 | `js/battle.js` | 普攻回气(6+缺气比)+CD制(damageMult≥1.5→2回合/≥1.8→3)+UI灰显⏳ |
| 1.3 飞升后 | `js/endgame/ascension-epilogue.js` | 香火(名气折算信徒)+每日回馈真元+二段飞升(金仙)+天界切磋 |
| 1.4 NPC演化 | `js/npcs/npc-life-actor.js` | cultivate case 自主突破(progress≥10→layer++/升境) |
| 1.5 气运机缘 | `js/app.js` | `luck`/`fortune` 字段+影响奇遇触发率+`getLuckChance`/`spendLuck` |
| 1.6 玩家建宗 | 复用 `js/extensions/player-sect.js` | updateCultivationUI 建宗入口+_quickFoundSect+护宗战 |
| 1.7 转世轮回 | `js/core/reincarnation-system.js` | 残魂态转世保留1功法+1羁绊+部分气运+前世功法+30%buff |
| 1.8 本命法宝 | `js/equipment/bonded-artifact.js` | 金丹+炼制绑定+喂材料升级(每阶+5%攻防) |
| 1.9 丹毒 | `js/crafting/pill-poison.js` | 服丹按毒性积累(0-100)+高丹毒降修炼(50→-25%/100→-50%)+解毒接口 |
| 1.10 高位面+御剑 | `js/map/high-planes.js` | 筑基+御剑(耗真气减时)+元婴入灵界+化神入魔界 |

### D-13 名声×善恶→门派考核（`js/sects/sect-join-flow.js` evaluateSectEntry）
4档名声(<20冷淡杂役/20-50正常/50-90礼遇外门/>90掌门亲迎内门)+善恶相悖+低名声拒收有文案+相悖但有声望加严+中立不问善恶。不入新存档（fame/karma 既有）。

### 第2层·深度内容（14项）
- 2.1 走火入魔 `js/cultivation/qi-deviation.js`：紊乱0-100，>=80→-10%/>=95→-20%全六维
- 2.3 悟道树 `js/cultivation/enlightenment-tree.js`：7节点消耗 insightPoints 解锁永久六维
- 2.4 修仙延寿 `js/cultivation/breakthrough-ritual.js`：突破大境界自动延寿(筑基+100...渡劫+30000)
- 2.5 build分化 `js/combat/build-school.js`：主功法判定流派(剑/体/法)→被动(法修攻+10%/体修防+15%)
- 2.8 婚姻后代 `js/npcs/marriage-offspring.js`：道侣bond≥2诞育后代继承主功法+360天成年
- 2.9 宿敌链 `js/npcs/rivalry-chain.js`：仇恨>60可寻仇决战+>90最终决战+胜负结算
- 2.12 自创丹方 `js/crafting/craft-custom-pill.js`：消耗材料按毒性映射效果+图鉴+临时buff
- 2.13 灵脉经营 `js/economy/spirit-vein.js`：金丹+占据灵脉每日产灵石+升级1-5阶
- 2.15 图鉴 `js/core/collection-system.js`：派生统计(功法/物品/NPC/击杀)+6里程碑领气运
- 2.18 节气 `js/world/solar-terms.js`：24节气日(每15天)luck+1+灵气流转
- 2.19 天机占卜 `js/cultivation/divination.js`：元婴+占卜按气运5档buff/损运
- 2.20 双修产真元 `js/sects/sects-system.js` dualCultivate：加 essence+=经验*0.5
- 2.21 师徒传功 `js/sects/master-teach.js`：传功弟子好感+5/进度+5/玩家fame+3
- 2.23 因果报应 `js/core/karma-retribution.js`：onNewDay karma>=50善报/<=-50恶报

### F-15 装备槽补全（`js/items-extended/03-armor.js`）
补13件饰品填5空槽：neck(玉项链/灵珠项链/龙凤项链)/ring1(铁戒/灵戒)/ring2(龙戒/混元戒)/acc1(玉佩/混沌护符)/acc2(灵符)/offHand(木盾/铁盾/灵盾)，覆盖COMMON~LEGENDARY。

### F 项核查结论（F-12~F-41）
- 已落地19项：F-12/13/14/15/17/18/19/21/23/24/29/31/33/35/36/37/38/39/40
- 核查无需改6项：F-16(代码公式合理)/F-20(20%设计保持)/F-22(保持)/F-27(kill活路径)/F-30(无漏)/F-34(合理)
- 无法做/跳过：F-25(tests删)/F-32(设计)/F-41(傀儡核查复杂)

### 机制设计原则（用户要求）
- 代码结构合理：复用既有兽潮多波模式/PlayerSect/StateRegistry/onNewDaySubscribe，不复制平行状态
- 现实逻辑：交流不限制次数而模仿厌烦(赠礼疲劳/爱情冷却CD/瓶颈首次弹)、善恶有报应、修仙延寿、瓶颈自检
- 机制平衡：境界门槛+灵石成本+CD+概率上限，无全局数值缩放、不读DOM作真值、不新增独立localStorage角色数据

---

### 二十.2 文档链接处理记录（2026-09-02 已处理）

STRUCTURE.md 内的 37 个死链已全部去链接化，改为 `X.md·本地 D:/Download Game/游戏制作/旧计划/` 格式：
- 31 个仓库外 `[`X`](../游戏制作/旧计划/X.md)` → `X.md·本地 D:/Download Game/游戏制作/旧计划/`
- 3 个根级不存在 `[`X`](X.md)` → `X.md·本地 D:/Download Game/游戏制作/旧计划/`
- 1 个旧计划/子目录 `[`旧计划/X`](旧计划/X.md)` → `X.md·本地 D:/Download Game/游戏制作/旧计划/`
- 2 个行内反引号 `见 `X`` → `见 `X`·本地 D:/Download Game/游戏制作/旧计划/`

**活链保留**：版本记录.md（根级存在）

**去链接化原因**：
- 23 个文件**全部存在**于 `D:\Download Game\游戏制作\旧计划\`（用户本地私有文档）
- GitHub 仓库 `xh0589/xianxia` 无父目录，`../` 链接在 GitHub 渲染失效
- 去链接化后：本地能搜到文件信息，GitHub 不再显示失效链接，文字内容保留

**未动**：
- STRUCTURE.md 整体结构（2704 行）
- 文件顺序和章节编号
- 活链（版本记录.md）
