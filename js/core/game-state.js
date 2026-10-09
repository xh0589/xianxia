/**
 * game-state.js — 统一存档世界状态（B1 停止数据损坏）
 * 职责：
 * 1. 角色级 localStorage 键清单与清理
 * 2. 收集/应用完整 GameState（进存档槽）
 * 3. 新游戏重置各系统内存态
 * 账号级保留：xianxia_settings / xianxia_ngplus / xianxia_endings（可选）
 */
(function (global) {
    'use strict';

    /** 角色/世界进度键（新游戏与删档应清除；不得跨角色继承） */
    // F-11 修复：之前漏列 xianxia_storyline_choices（既不清也不收，剧情抉择跨角色串档）
    //
    // ⚠️⚠️ 下面这行旧注记**是错的，已作废**（原文：「同时 xianxia_sect_diplomacy/xianxia_tracked_quests
    // 在清单但 collect/apply 不收，读档丢失」）。实测（差分法，见 tests/sideledger-roundtrip-node.js 的 B 段）：
    // 那两本**collect 收得好好的**——它们各自注册了 StateRegistry 模块（sect-visit.js:901 / quest-system.js:2247），
    // exportAll 照收。真正的病灶是**反过来的那一半**：模块的 `import` 只改内存、**不把键写回盘**，
    // 而 applyFullGameState 开头的 clearCharacterStorage() 早就把键从盘上删了 ⇒
    // **键从此不在盘上（清得掉），而下一次刷新时读方读到 null 就按默认值/随机数重建（收不回）**。
    // 「注册了 StateRegistry 模块」只补上了内存那一半，不等于键会回来。这两本已补进 SIDE_LEDGER_KEYS。
    //
    // 本批补 4 个漏列的角色级键（逐个读过写入方语义才点的名，见下面 SIDE_LEDGER_KEYS 的同款判据）：
    //   xianxia_merged_skills     融合功法注册表（cultivation.js:1121 / grand-legacy.js:479）
    //                              —— 存的是**完整 def**（名字/效果/图标），页面加载时 rehydrateMergedSkills
    //                              把它塞回 skillPages 并 unlock(…,'learned')。它是角色自创的功法本身，
    //                              留着就是新角色的功法册里挂着上一局的名字（目录污染）。
    //   xianxia_asm_ledger        嫉妒「双人余波」账（jealousy-assembly.js:293）——按日记录两人同框，
    //                              余波 3~10 日后待发；跨角色残留＝新角色开局就撞上一世的旧余波。
    //   xianxia_collective_ledger 集体戏账（jealousy-collective.js:66）——灯节场次/坊市与擂台冷却/
    //                              大典一次性(weddingDone)/风评队列，全是本局进度。
    //   xianxia_rival_chain_cd    宿敌寻仇冷却（rivalry-chain.js:72）——按绝对日键控，本局节流账。
    // ⚠️ **不列** xianxia_map_overlay：审计稿把它写成「已探索地图残留」，与代码实况不符——
    //    world-map.js:293-320 里这个键只存 '1'/'0'，是「九州路线标记图层显隐」的**显示偏好**
    //    （与 xianxia_settings 同族，写法也同：saveToStorage + 设置页勾选框 + toggleMapOverlay）。
    //    它该跟着账号走，不该跟着角色走。把它塞进角色级＝每开一局就替玩家关一次图面标注。
    var CHARACTER_STORAGE_KEYS = [
        'xianxia_arena_ranking',
        'xianxia_asm_ledger',
        'xianxia_beasts',
        'xianxia_choices',
        'xianxia_city_temp',
        'xianxia_collective_ledger',
        'xianxia_daily_events',
        'xianxia_enhancement_pity',
        'xianxia_event_flags',
        'xianxia_factions',
        'xianxia_game_time',
        'xianxia_house',
        'xianxia_inventory',
        'xianxia_landmarks',
        'xianxia_lifespan',
        'xianxia_location_data',
        'xianxia_mail_system',
        'xianxia_merged_skills',
        'xianxia_npc_records',
        'xianxia_party_data',
        'xianxia_personal_event_flags',
        'xianxia_professions',
        'xianxia_proficiency',
        'xianxia_quest_progress',
        'xianxia_quick_moves',
        'xianxia_reputation',
        'xianxia_rival_chain_cd',
        'xianxia_save',
        'xianxia_scenario_progress',
        'xianxia_sect_diplomacy',
        'xianxia_sect_join_state',
        'xianxia_social_cooldowns',
        'xianxia_storyline_choices',
        'xianxia_tracked_quests',
        'xianxia_travel_data',
        'xianxia_world_events',
        'borrowRecords'
    ];

    /**
     * 白名单里「**光靠 collect 收不回来**」的那几本旁账：值整体是 JSON 文本，
     * collect 取原文随槽存、apply 把原文写回 localStorage（不 writeKey——见回灌处那段注释）。
     *
     * 为什么要这张单：applyFullGameState 开头会 clearCharacterStorage()（先清后灌，灌不回来的就没了）。
     * 白名单键只有**键本身**被写回盘上，读档后的刷新才认得出账。三条回灌通路：
     *   ① writeKey('<key>', saveData.<字段>)  —— 结构化字段那条（reputation/landmarks/… 共 24 键）
     *   ② 本单：原文随槽往返
     *   ③ 别的模块自己在 apply 里 saveToStorage（如 xianxia_personal_event_flags，game-state.js:1412）
     * **三条都不覆盖的键 = 每次读档抹一次，键从此不在盘上。**
     *
     * 两类键会掉进这个坑，判据不同，分开记：
     *
     * 【甲】没有 StateRegistry 模块、collect 一点没碰它（原来那 4 本）：
     *   xianxia_merged_skills     融合功法注册表（cultivation.js:1121 / grand-legacy.js:479）
     *                             —— 完整 def，页面加载 rehydrateMergedSkills 塞回 skillPages 并 unlock。
     *                             抹掉＝这门功法再也回不来（融合早已发生、双方功法也已消耗，重融不出来）。
     *   xianxia_asm_ledger        嫉妒「双人余波」账（jealousy-assembly.js:293）——余波 3~10 日后待发。
     *   xianxia_collective_ledger 集体戏账（jealousy-collective.js:66）——灯节场次/冷却/大典一次性/风评队列。
     *   xianxia_rival_chain_cd    宿敌寻仇冷却（rivalry-chain.js:72）——按绝对日键控。
     *
     * 【乙】**有** StateRegistry 模块、collect 也收了，但那个模块的 `import` 只改内存、**不回写键**
     *      （本批新补的 5 本）。这类更隐蔽：肉眼看 collect/apply 都「有处理」，键却照样消失。
     *      逐个的模块注册处与它的 import（都不回写）：
     *   xianxia_sect_diplomacy    sect-visit.js:901 `sectDiplomacy`——import 只 Object.assign 到
     *                             SECT_DIPLOMACY_STATE，不调 saveSectDiplomacy()（:675）。
     *                             ★本族最重的一个：读档后刷新，initSectDiplomacy()（sect-visit.js:640，
     *                             由 app.js:11902 在页面加载时调）读到 null ⇒ **按 Math.random 重生成整张外交矩阵**
     *                             并立刻 saveSectDiplomacy() 写回盘上 ⇒ 玩家的结盟/仇怨/条约被随机数覆盖。
     *   xianxia_tracked_quests    quest-system.js:2247 `trackedQuests`——import 只重填 _trackedQuests，
     *                             不调 saveTrackedQuests()（:1598）。刷新后 quest-system.js:1587 读到 null ⇒
     *                             追踪栏清空并自动改追「第一个未完成的主线」。
     *   xianxia_storyline_choices storylines-v2/batch1.js:44 `storylineChoices`——import 不回写 LS_KEY。
     *                             ★不可回头抉择的记录（batch1.js:8「第4段为不可回头抉择」），丢了就再也选不回来。
     *   xianxia_mail_system       mail-system.js:592 `mail`——import 只赋 window._mailSystemData，不调
     *                             saveMailData()（:539）。寄出的信/收藏在刷新后读不到。
     *   xianxia_quick_moves       equipment.js:692 `quickMoves`——import 只重填闭包 quickMoveSlots。
     *
     * ⚠️ 判据里**不含**的键（别往这张单上乱加，各有各的道理）：
     *   xianxia_game_time  time-system.js:113 明写「禁止 xianxia_game_time 自动持久化」——
     *                      游戏时间以 saveData.gameTime 进槽，这个键是设计上就不该存在的。
     *   xianxia_professions 全仓只有白名单这一处命中，**无任何写入方也无任何读取方**（占位残留）。
     *   borrowRecords      注册了模块（npc-borrow-service.js:159）但全仓**没有任何一处往这个键写盘**，
     *                      内存账在 global.borrowRecords 上，与这条 localStorage 键无关。
     *   xianxia_map_overlay 见 CHARACTER_STORAGE_KEYS 上方那段：账号级显示偏好，两张单都不该收。
     */
    var SIDE_LEDGER_KEYS = [
        // 【甲】无模块、collect 零覆盖
        'xianxia_merged_skills',
        'xianxia_asm_ledger',
        'xianxia_collective_ledger',
        'xianxia_rival_chain_cd',
        // 【乙】有模块，但 import 只改内存、不回写键
        'xianxia_sect_diplomacy',
        'xianxia_tracked_quests',
        'xianxia_storyline_choices',
        'xianxia_mail_system',
        'xianxia_quick_moves'
    ];

    /** 账号级：删「所有存档」时默认保留；新游戏不读入角色进度 */
    var ACCOUNT_KEYS = ['xianxia_settings', 'xianxia_ngplus', 'xianxia_endings'];

    function safeJsonParse(raw, fallback) {
        if (raw == null || raw === '') return fallback;
        try {
            return JSON.parse(raw);
        } catch (e) {
            return fallback;
        }
    }

    /**
     * 清角色级键。options.protectKeys：这次**不许删**的键（见 applyFullGameState 的调用处）。
     *
     * 为什么要有这个口：白名单里混着两种性质不同的键——
     *   ①「角色键」：背包/声望/地标……换角色必须清，清了由 apply 逐条灌回来；
     *   ②「当前档键」xianxia_save：它不是角色的附属账，而是**这一刻正在被读取的那份存档本体**
     *      （app.js:3227 continueCandidate 的「继续仙途」、app.js:3286 摘要槽的同名完整档兜底、
     *        auto-save.js:155 载入自动档前先落一份备份，全靠它）。
     * 把它当 ① 那样先删后灌，等于让存档在读自己的过程中把自己删掉；而 applyFullGameState 中间
     * 有十几处**没有 try 包裹**的回灌（new ItemInstance / importQuestState / KnowledgeSystem 等），
     * 任何一处抛错都会当场断在半路——末尾那句 writeKey('xianxia_save', saveData) 根本走不到。
     * 实测（.scratch/fix-critical-progress/repro-bug1.cjs 场景 2）：档里存着已下架的物品模板时，
     * 一次读档就让 xianxia_save 变成「键不存在」，「继续仙途」随之再也认不出这个角色。
     * ⇒ 读档这条路把 ② 挂进 protectKeys：清完立刻回填，键全程在盘上；万一中途抛错，
     *   留下的还是**上一份完整档**（玩家刷新后仍能续上），而不是一颗被读档动作抹掉的空键。
     */
    function clearCharacterStorage(options) {
        options = options || {};
        var alsoAccount = !!options.alsoAccount;
        var protect = (options.protectKeys && typeof options.protectKeys.length === 'number') ? options.protectKeys : null;
        CHARACTER_STORAGE_KEYS.forEach(function (k) {
            if (protect && protect.indexOf(k) !== -1) return;   // 保护键：本次不删（理由见上方注释）
            try { localStorage.removeItem(k); } catch (e) {
                console.warn('[GameState] 角色级键删不掉：' + k + '（隐私模式或存储受限；本键的旧值会跨角色残留）', e && e.message);
            }
        });
        // 动态键：地图种子、宗门专精冷却、NPC故事线进度等
        try {
            var toRemove = [];
            for (var i = 0; i < localStorage.length; i++) {
                var key = localStorage.key(i);
                if (!key) continue;
                if (key.indexOf('xianxia_map_seed') === 0) toRemove.push(key);
                if (key.indexOf('xianxia_sect_cd_') === 0) toRemove.push(key);
                if (key.indexOf('xianxia_specialty_') === 0) toRemove.push(key);
                if (key.indexOf('npc_storyline_progress_') === 0) toRemove.push(key);
            }
            toRemove.forEach(function (k) {
                try { localStorage.removeItem(k); } catch (e) {}
            });
        } catch (e) {}
        if (alsoAccount) {
            ACCOUNT_KEYS.forEach(function (k) {
                try { localStorage.removeItem(k); } catch (e) {}
            });
        }
    }

    function serializeInventorySlots(slots) {
        if (!slots || !slots.length) return [];
        return slots.map(function (s) {
            if (!s) return null;
            // ItemInstance 或普通对象
            return {
                uid: s.uid,
                templateId: s.templateId || s.id,
                count: s.count != null ? s.count : 1,
                durability: s.durability,
                // v25.1·试-07：装在背包里的强化/精炼/附魔/护甲耐久随主存档走——
                // 白名单原先只收 6 个字段，「+5 强化剑」完整存档往返一圈强化就被剃光
                // （与 js/inventory.js saveInventory 小档侧的对称改动同款）
                enhancementLevel: s.enhancementLevel,
                refineLevel: s.refineLevel,
                enchantType: s.enchantType,
                armorDurability: s.armorDurability,
                customProps: s.customProps || null,
                markedForSale: s.markedForSale || false
            };
        });
    }

    function collectFullGameState(ctx) {
        ctx = ctx || {};
        var charData = ctx.charData || global.currentCharData;
        if (!charData) return null;
        // F-17：存档前兜底同步灵石/铜钱双源（防旁路写入致两源不一致）
        try {
            if (global.XianXia && global.XianXia.DataManager && typeof global.XianXia.DataManager.syncAll === 'function') {
                global.XianXia.DataManager.syncAll();
            } else if (window.XianXia && window.XianXia.DataManager && typeof window.XianXia.DataManager.syncAll === 'function') {
                window.XianXia.DataManager.syncAll();
            }
        } catch (e) {}

        // 收集叙事系统状态（个人事件进度等）
        var narrativeData = null;
        try {
            var peFlags = global.personalEventFlags || {};
            var peFlagsStr = localStorage.getItem('xianxia_personal_event_flags');
            if (peFlagsStr) {
                try { peFlags = JSON.parse(peFlagsStr); } catch (e) {}
            }
            narrativeData = {
                personalEventFlags: peFlags,
                eventCooldowns: global._eventCooldowns || {},
                lastInteractDay: global._lastInteractDay || {},
                negativeChoiceCount: global._negativeChoiceCount || {},
                npcRoutes: (charData._npcRoutes) ? JSON.parse(JSON.stringify(charData._npcRoutes)) : {}
            };
        } catch (e) {
            console.warn('[GameState] 叙事状态收集失败:', e);
        }

        // NPC状态序列化
        var npcState = null;
        if (global.npcManager && typeof global.npcManager.serialize === 'function') {
            try {
                npcState = global.npcManager.serialize();
            } catch (e) {
                console.warn('[GameState] NPC序列化失败:', e);
            }
        }

        var bodyDurability = ctx.bodyDurability;
        if (!bodyDurability && typeof global.bodyDurability === 'object') {
            bodyDurability = global.bodyDurability;
        }

        var inv = global.inventory;
        var saveData = {
            version: '3.1',
            timestamp: Date.now(),
            gameTime: (typeof global.getGameTimeSnapshot === 'function'
                ? global.getGameTimeSnapshot()
                : (global.timeSystem && global.timeSystem.gameTime) || global.gameTime || null),
            charName: charData.name,
            gender: charData.gender,
            mainAttributes: charData.mainAttributes,
            combatSkills: charData.combatSkills,
            // v13.1 绝技存档：玩家可学战斗绝技id数组（浅拷贝防引用串档）
            combatAbilities: (charData.combatAbilities && charData.combatAbilities.slice()) || [],
            lifeSkills: charData.lifeSkills,
            roots: charData.spiritualRoots,
            spiritualRoots: charData.spiritualRoots,
            mutatedRoots: charData.mutatedRoots,
            attrs: charData.attrs || {},
            realm: charData.realm != null ? charData.realm : '炼气',
            layer: charData.layer != null ? charData.layer : 1,
            essence: charData.essence != null ? charData.essence : 0,
            tempering: charData.tempering != null ? charData.tempering : 0,
            health: charData.health != null ? charData.health : 100,
            qi: charData.qi != null ? charData.qi : 100,
            energy: charData.energy != null ? charData.energy : 100,
            // SAVE-03：心境入档（此前漏白名单——茶馆瓦舍养起来的心境存读档蒸发，屏上照样印底色）
            mood: charData.mood != null ? charData.mood : 80,
            maxMood: charData.maxMood != null ? charData.maxMood : 100,
            spiritStones: charData.spiritStones != null ? charData.spiritStones : 0,
            copper: charData.copper != null ? charData.copper : 0,
            karma: charData.karma != null ? charData.karma : 0,
            order: charData.order != null ? charData.order : 0,
            blessing: charData.blessing != null ? charData.blessing : 0,
            // v20.39：气运与走火入魔紊乱入档（此前漏白名单——存读档气运归零、紊乱重置）
            luck: charData.luck != null ? charData.luck : 50,
            qiDeviation: charData._qiDeviation != null ? charData._qiDeviation : 0,
            // v20.11：击杀计数与收藏领奖记录入档（此前只在内存，重开档归零）
            killCount: charData._killCount != null ? charData._killCount : 0,
            collectionClaimed: charData._collectionClaimed && typeof charData._collectionClaimed === 'object'
                ? JSON.parse(JSON.stringify(charData._collectionClaimed)) : {},
            // v20.12：道侣/结拜关系与子嗣入档（此前不在白名单，重开档道侣除名、
            // 道侣战斗加成丢失、子嗣清零、"上限3"守卫形同虚设）
            bonds: charData.bonds && typeof charData.bonds === 'object'
                ? JSON.parse(JSON.stringify(charData.bonds)) : {},
            children: Array.isArray(charData._children)
                ? JSON.parse(JSON.stringify(charData._children)) : [],
            // v20.42：悟道树领悟节点入档（永久领悟，读档不得清零）
            enlightenedNodes: Array.isArray(charData._enlightenedNodes)
                ? JSON.parse(JSON.stringify(charData._enlightenedNodes)) : [],
            // v20.45：门派故事进度入档（演过的戏，读档不得重演/丢戏）
            sectStory: charData._sectStory && typeof charData._sectStory === 'object'
                ? JSON.parse(JSON.stringify(charData._sectStory)) : {},
            // v20.16：重塑灵根次数入档（灵根饼本体在 roots/spiritualRoots 字段，早已入档）
            rootRefines: charData._rootRefines != null ? charData._rootRefines : 0,
            // v20.18：钱庄账本入档（存款/起息日/欠款/到期日/催收日——单一字段，无平行状态）
            bank: charData._bank && typeof charData._bank === 'object'
                ? JSON.parse(JSON.stringify(charData._bank)) : null,
            // v20.20：当铺当票入档（货/件数/当金/赎期——单一字段，无平行状态）
            pawn: charData._pawn && typeof charData._pawn === 'object'
                ? JSON.parse(JSON.stringify(charData._pawn)) : null,
            // v20.21：黑市信用簿入档（信用/成交笔数/举报前科——单一字段，无平行状态）
            fence: charData._fence && typeof charData._fence === 'object'
                ? JSON.parse(JSON.stringify(charData._fence)) : null,
            // v20.53：渡界前的人间落脚点入档（渡回人间要知道往哪落，读档不得丢失）
            mortalOrigin: charData._mortalOrigin != null ? charData._mortalOrigin : '',
            // P0-5 死亡仙侠化：神魂/残魂状态
            soulState: charData.soulState ? JSON.parse(JSON.stringify(charData.soulState)) : null,
            // ===== 第一百二十三批 DES-75：这批角色账此前两头都没点名 =====
            // 不是「写了没读」——collect 与 apply 都零命中，于是攒了一世的东西读档即蒸发，
            // 屏上照旧念那个数（HUD 名气／机缘行／悟道点／香火信徒），玩家只当自己见鬼了。
            fame: charData.fame != null ? charData.fame : 0,
            notoriety: charData.notoriety != null ? charData.notoriety : 0,
            fortune: charData.fortune != null ? charData.fortune : 0,
            insightPoints: charData.insightPoints != null ? charData.insightPoints : 0,
            incense: charData.incense != null ? charData.incense : 0,
            _poisoned: !!charData._poisoned,
            springBlessing: charData.springBlessing != null ? charData.springBlessing : 0,
            lastDailyClaimDay: charData.lastDailyClaimDay != null ? charData.lastDailyClaimDay : null,
            _demonicCorruption: charData._demonicCorruption != null ? charData._demonicCorruption : 0,
            _demonicPower: charData._demonicPower != null ? charData._demonicPower : 0,
            _foundationBonus: charData._foundationBonus != null ? charData._foundationBonus : 0,
            _coreBonus: charData._coreBonus != null ? charData._coreBonus : 0,
            _primordialBonus: charData._primordialBonus != null ? charData._primordialBonus : 0,
            _divineBonus: charData._divineBonus != null ? charData._divineBonus : 0,
            _breakthroughPillBonus: charData._breakthroughPillBonus != null ? charData._breakthroughPillBonus : 0,
            _manualProgress: charData._manualProgress && typeof charData._manualProgress === 'object'
                ? JSON.parse(JSON.stringify(charData._manualProgress)) : {},
            dungeonProgress: charData.dungeonProgress && typeof charData.dungeonProgress === 'object'
                ? JSON.parse(JSON.stringify(charData.dungeonProgress)) : {},
            _customPills: Array.isArray(charData._customPills)
                ? charData._customPills.slice() : [],
            _pastLifeMemory: charData._pastLifeMemory && typeof charData._pastLifeMemory === 'object'
                ? JSON.parse(JSON.stringify(charData._pastLifeMemory)) : null,
            charFlags: charData.flags && typeof charData.flags === 'object'
                ? JSON.parse(JSON.stringify(charData.flags)) : {},
            // 同日牌与战绩：只有真读者、此前不入档 ⇒ 存读档即「今日还能上台 N 场」回满、
            // 秘境七日枯荣作废、榜上留旧分而本人清零。
            _arenaDay: charData._arenaDay != null ? charData._arenaDay : null,
            _arenaDailyCount: charData._arenaDailyCount != null ? charData._arenaDailyCount : 0,
            arenaWins: charData.arenaWins != null ? charData.arenaWins : 0,
            arenaStreak: charData.arenaStreak != null ? charData.arenaStreak : 0,
            arenaScore: charData.arenaScore != null ? charData.arenaScore : 0,
            _failedBreakthroughs: charData._failedBreakthroughs != null ? charData._failedBreakthroughs : 0,
            dungeonClearedAt: charData.dungeonClearedAt && typeof charData.dungeonClearedAt === 'object'
                ? JSON.parse(JSON.stringify(charData.dungeonClearedAt)) : {},
            // ===== v24.4 账本续查（DES-75 同病，全仓字段扫描抓出：写方活、读方活、两头都没点名） =====
            // 丹毒：服丹累积、丹毒闸与警告都读它——蒸发＝读档免费清毒
            pillPoison: charData.pillPoison != null ? charData.pillPoison : 0,
            // 心魔账：心魔进度与未消费的突破加成（breakthrough-system:128 真读）——蒸发＝战胜过的心魔复活、加成白攒
            _heartDemon: charData._heartDemon && typeof charData._heartDemon === 'object'
                ? JSON.parse(JSON.stringify(charData._heartDemon)) : null,
            _heartDemonBonus: charData._heartDemonBonus != null ? charData._heartDemonBonus : 0,
            // 行脚三本一次性账：travel-journal.js 自家头注承诺「随存档走」——此前两头零命中，承诺落空，
            // 一次性事件的「办过」标记丢失可读档重刷
            _travel: charData._travel && typeof charData._travel === 'object'
                ? JSON.parse(JSON.stringify(charData._travel)) : null,
            // 冰塔寒毒淬体层数：层越深蚀体越重（location-system:1482 现读）——蒸发＝寒毒白淬
            _iceTowerPerm: charData._iceTowerPerm != null ? charData._iceTowerPerm : 0,
            // 本命法宝「性命相连不可易主」——蒸发＝法宝丢、还能再契一件（不可易主形同虚设）
            _bondedArtifact: charData._bondedArtifact && typeof charData._bondedArtifact === 'object'
                ? JSON.parse(JSON.stringify(charData._bondedArtifact)) : null,
            // 占据的灵脉（日产进账）——蒸发＝灵脉丢、可再占一处
            _spiritVein: charData._spiritVein && typeof charData._spiritVein === 'object'
                ? JSON.parse(JSON.stringify(charData._spiritVein)) : null,
            // 飞升终局三件套：天界解锁旗／证道日记／渡界前来处（_mortalOrigin 早在 v20.53 入档，这三兄弟一直漏着）
            _unlockedTianjie: !!charData._unlockedTianjie,
            _ascensionDay: charData._ascensionDay != null ? charData._ascensionDay : null,
            _tianjieFrom: charData._tianjieFrom != null ? charData._tianjieFrom : '',
            // 死因记名：转世积分表按死因计分（ascend +50）——蒸发＝证道而死被读档洗成自然死
            lastDeathReason: charData.lastDeathReason != null ? charData.lastDeathReason : null,
            // 主线 025 两枚一次性剧情闸（:1030 真读 _main025_stood）——蒸发＝戏重演、闸失忆
            _main025_asked: !!charData._main025_asked,
            _main025_stood: !!charData._main025_stood,
            // 至交书信每日计数（day 键控，「来得太勤回信转短」的账）——蒸发＝读档绕过冷却
            _mailAffDay: charData._mailAffDay && typeof charData._mailAffDay === 'object'
                ? JSON.parse(JSON.stringify(charData._mailAffDay)) : null,
            // 自创丹短效增益（days 键控、到期按天判）——蒸发＝buff 凭空消失
            _customPillBuff: charData._customPillBuff && typeof charData._customPillBuff === 'object'
                ? JSON.parse(JSON.stringify(charData._customPillBuff)) : null,
            maxHealth: charData.maxHealth != null ? charData.maxHealth : 100,
            maxQi: charData.maxQi != null ? charData.maxQi : 100,
            maxEnergy: charData.maxEnergy != null ? charData.maxEnergy : 100,
            bodyDurability: bodyDurability ? Object.assign({}, bodyDurability) : {},
            inventory: {
                slots: serializeInventorySlots(inv && inv.slots),
                maxSlots: (inv && inv.maxSlots) || 30,
                currency: (inv && inv.currency) ? Object.assign({}, inv.currency) : { copper: 100, spiritStones: 10 }
            },
            equipment: global.currentEquipment ? JSON.parse(JSON.stringify(global.currentEquipment)) : {},
            skills: global.currentSkills ? JSON.parse(JSON.stringify(global.currentSkills)) : {},
            learnedSecrets: global.learnedSecrets ? global.learnedSecrets.slice() : [],
            techniqueKnowledge: (global.KnowledgeSystem && global.KnowledgeSystem.exportData)
                ? global.KnowledgeSystem.exportData()
                : {},
            questProgress: null,
            partyData: null,
            discipleState: null,
            sectFacilities: null,
            eventFlags: null,
            achievementData: global.achievementData || null,
            proficiencyData: null,
            playerPhysiology: null,
            // —— 叙事系统状态（个人事件进度等） ——
            narrative: narrativeData,
            // —— 原独立键系统，并入完整存档 ——
            beasts: null,
            house: null,
            reputation: null,
            professions: null,
            lifespan: null,
            locationData: null,
            travelData: null,
            worldEvents: null,
            cityTemp: null,
            factions: null,
            landmarks: null,
            enhancementPity: null,
            choices: null,
            scenarioProgress: null,
            sectJoinState: null,
            dailyEvents: null,
            arenaRanking: null,
            // NPC系统状态
            npcs: npcState,
            // v10.5 交易系统状态
            trade: (window.TradeService && typeof window.TradeService.serialize === 'function')
                ? window.TradeService.serialize()
                : null,
            // F-9 / F-11 撤回：mail / sectDiplomacy 已由对应模块通过 StateRegistry.register 暴露，StateRegistry.exportAll() 自动收。
            // tracked_quests / storyline_choices 接下来由 quest-system.js / storylines-v2 注册到 StateRegistry，无需 game-state.js 列键名。
            // P1-11: 社交冷却与每日次数
            social: (typeof window.exportSocialCooldowns === 'function') ? window.exportSocialCooldowns() : null,
            // v12.1：模块自注册状态。以后新增模块无需继续膨胀 GameState。
            modules: (global.StateRegistry && typeof global.StateRegistry.exportAll === 'function')
                ? global.StateRegistry.exportAll() : {}
        };

        // 任务
        if (typeof global.exportQuestState === 'function') {
            saveData.questProgress = global.exportQuestState();
        } else {
            saveData.questProgress = global.playerQuestProgress
                ? JSON.parse(JSON.stringify(global.playerQuestProgress))
                : { activeQuests: [], completedQuests: [], totalCompleted: 0 };
        }

        // 队伍
        if (typeof global.exportPartyState === 'function') {
            saveData.partyData = global.exportPartyState();
        } else if (global.partyData) {
            saveData.partyData = JSON.parse(JSON.stringify(global.partyData));
        } else {
            saveData.partyData = { members: [], formation: 'standard' };
        }

        // 旁账随槽：融合功法注册表 / 嫉妒双人余波账 / 集体戏账 / 宿敌寻仇冷却（甲类，无模块、collect 零覆盖），
        // 以及外交关系 / 追踪任务 / 剧情抉择 / 飞鸽传书 / 常用招式（乙类，有模块但 import 不回写键）。
        // 取**原文**（这几个键的值本身就是 JSON 文本，各写入方自带序列化），不在这里二次 parse 再拼，
        // 免得把谁家的账本结构焊死在存档层。缺键就不落这一格（老档没这格 ⇒ apply 侧整段跳过，
        // 不会拿空值去盖住浏览器里现役角色的账）。
        try {
            var sideLedgers = {};
            SIDE_LEDGER_KEYS.forEach(function (k) {
                try {
                    var raw = localStorage.getItem(k);
                    if (raw) sideLedgers[k] = raw;
                } catch (eOne) {
                    // 单本读不出来（隐私模式/配额满）不该连累另外几本：这一本缺席，apply 侧就不动它
                    console.warn('[GameState] 旁账读不出来：' + k, eOne && eOne.message);
                }
            });
            if (Object.keys(sideLedgers).length) saveData.sideLedgers = sideLedgers;
        } catch (eSide) {
            console.warn('[GameState] 旁账整体收集失败（读档时这几本不会被抹，但也不随槽走）:', eSide && eSide.message);
        }

        // 门派
        if (global.discipleState) {
            saveData.discipleState = JSON.parse(JSON.stringify(global.discipleState));
        } else {
            // v25.1·P24：与 sects-system.js:13 的真身结构对齐——补 isInSect/sectId/rank，去掉全仓零读者的 position
            saveData.discipleState = { isInSect: false, sectId: null, sectName: null, contribution: 0, rank: null };
        }

        // 门派设施状态（B3：设施冷却/使用次数进入统一存档）
        if (typeof global.getFacilityStateSnapshot === 'function') {
            saveData.sectFacilities = global.getFacilityStateSnapshot();
        // v18.1 出战增益快照（未过期条目；过期在消费端自然失效）
        try {
            var nowMinAb = (window.timeSystem && window.timeSystem.gameTime) ? (window.timeSystem.gameTime.totalMinutes || 0) : 0;
            var abSnap = {};
            var abSrc = window.activeBuffs || {};
            Object.keys(abSrc).forEach(function (k) { if (abSrc[k] && abSrc[k].effects && (abSrc[k].expiryGameMinute || 0) > nowMinAb) abSnap[k] = abSrc[k]; });
            saveData.activeBuffs = abSnap;
        } catch (eAbSnap) {}
        } else if (global.facilityState) {
            saveData.sectFacilities = {
                lastResetGameDay: global.facilityState.lastResetGameDay || 0,
                dailyUsage: global.facilityState.dailyUsage || {},
                cooldownUntilMinute: global.facilityState.cooldownUntilMinute || {},
                lastUsedGameMinute: global.facilityState.lastUsedGameMinute || {}
            };
        }

        // 事件
        if (global.eventFlags) {
            saveData.eventFlags = JSON.parse(JSON.stringify(global.eventFlags));
        } else {
            saveData.eventFlags = {};
        }

        // 熟练度
        // v25.2·修复：改读闭包快照——此前读 global.proficiencyData（闭包外恒 undefined）
        // → 从不进档；真实数据在 cultivation.js 闭包里
        if (typeof global.getProficiencyDataSnapshot === 'function') {
            saveData.proficiencyData = global.getProficiencyDataSnapshot();
        } else if (global.proficiencyData) {
            saveData.proficiencyData = JSON.parse(JSON.stringify(global.proficiencyData));
        }

        // 生理
        if (global._playerPhysiology && global._playerPhysiology.physiology) {
            try {
                var p = global._playerPhysiology.physiology;
                var blood = p.bloodVolume !== undefined ? p.bloodVolume : p.health;
                saveData.playerPhysiology = {
                    type: p.type,
                    health: blood,
                    bloodVolume: blood,
                    circulation: p.circulation,
                    consciousness: p.consciousness,
                    breathing: p.breathing,
                    painLoad: p.painLoad,
                    neuralShock: p.neuralShock,
                    oxygenDebt: p.oxygenDebt || 0,
                    breathlessTurns: p.breathlessTurns || 0,
                    criticalTimer: p.criticalTimer != null ? p.criticalTimer : -1,
                    criticalCause: p.criticalCause || null,
                    dantianDestroyed: !!p.dantianDestroyed,
                    criticalRounds: p.criticalRounds || 50,
                    criticalInjuries: p.criticalInjuries ? JSON.parse(JSON.stringify(p.criticalInjuries)) : null,
                    physiologyFlags: p.physiologyFlags ? JSON.parse(JSON.stringify(p.physiologyFlags)) : null,
                    wounds: (p.wounds || []).map(function (w) { return Object.assign({}, w); }),
                    parts: p.parts ? JSON.parse(JSON.stringify(p.parts)) : {},
                    state: p.state,
                    isUnconscious: !!p.isUnconscious,
                    integrity: p.integrity
                };
            } catch (e) {
                saveData.playerPhysiology = null;
            }
        }

        // 灵兽
        if (typeof global.exportBeastState === 'function') {
            saveData.beasts = global.exportBeastState();
        } else if (global.tamedBeasts) {
            saveData.beasts = {
                beasts: JSON.parse(JSON.stringify(global.tamedBeasts)),
                activeBeastIndex: global.activeBeastIndex != null ? global.activeBeastIndex : -1,
                activeMountIndex: global.activeMountIndex != null ? global.activeMountIndex : -1
            };
        }

        // 洞府
        if (typeof global.exportHouseState === 'function') {
            saveData.house = global.exportHouseState();
        } else if (global.playerHouse) {
            saveData.house = JSON.parse(JSON.stringify(global.playerHouse));
        }

        // 声望
        if (typeof global.exportReputationState === 'function') {
            saveData.reputation = global.exportReputationState();
        } else {
            try {
                var repRaw = localStorage.getItem('xianxia_reputation');
                if (repRaw) saveData.reputation = JSON.parse(repRaw);
            } catch (e) {}
        }


        // 寿命
        if (typeof global.exportLifespanState === 'function') {
            saveData.lifespan = global.exportLifespanState();
        } else {
            try {
                var lifeRaw = localStorage.getItem('xianxia_lifespan');
                if (lifeRaw) saveData.lifespan = JSON.parse(lifeRaw);
            } catch (e) {}
        }

        // 地点
        if (typeof global.exportLocationState === 'function') {
            saveData.locationData = global.exportLocationState();
        } else {
            try {
                var locRaw = localStorage.getItem('xianxia_location_data');
                if (locRaw) saveData.locationData = JSON.parse(locRaw);
            } catch (e) {}
        }

        // 旅行
        if (typeof global.exportTravelState === 'function') {
            saveData.travelData = global.exportTravelState();
        } else {
            try {
                var trRaw = localStorage.getItem('xianxia_travel_data');
                if (trRaw) saveData.travelData = JSON.parse(trRaw);
            } catch (e) {}
        }

        // 世界事件 / 城市临时
        try {
            var we = localStorage.getItem('xianxia_world_events');
            if (we) saveData.worldEvents = JSON.parse(we);
            var ct = localStorage.getItem('xianxia_city_temp');
            if (ct) saveData.cityTemp = JSON.parse(ct);
        } catch (e) {}
        if (typeof global.exportWorldEventsState === 'function') {
            var wes = global.exportWorldEventsState();
            if (wes) {
                if (wes.worldEvents != null) saveData.worldEvents = wes.worldEvents;
                if (wes.cityTemp != null) saveData.cityTemp = wes.cityTemp;
            }
        }

        // 势力
        try {
            var fac = localStorage.getItem('xianxia_factions');
            if (fac) saveData.factions = JSON.parse(fac);
        } catch (e) {}

        // 地标
        try {
            var lm = localStorage.getItem('xianxia_landmarks');
            if (lm) saveData.landmarks = JSON.parse(lm);
        } catch (e) {}

        // 强化保底
        try {
            var pity = localStorage.getItem('xianxia_enhancement_pity');
            if (pity) saveData.enhancementPity = JSON.parse(pity);
        } catch (e) {}

        // 选择记忆
        try {
            var ch = localStorage.getItem('xianxia_choices');
            if (ch) saveData.choices = JSON.parse(ch);
        } catch (e) {}

        // 情境
        try {
            var sc = localStorage.getItem('xianxia_scenario_progress');
            if (sc) saveData.scenarioProgress = JSON.parse(sc);
        } catch (e) {}

        // 入门流程
        try {
            var sj = localStorage.getItem('xianxia_sect_join_state');
            if (sj) saveData.sectJoinState = JSON.parse(sj);
        } catch (e) {}

        // 日常事件
        try {
            var de = localStorage.getItem('xianxia_daily_events');
            if (de) saveData.dailyEvents = JSON.parse(de);
        } catch (e) {}

        // 竞技场（角色向；可后续改为账号级）
        try {
            var ar = localStorage.getItem('xianxia_arena_ranking');
            if (ar) saveData.arenaRanking = JSON.parse(ar);
        } catch (e) {}

        // 交易系统状态
        if (window.TradeService && typeof window.TradeService.serialize === 'function') {
            saveData.trade = window.TradeService.serialize();
        }
        
        return saveData;
    }

    function buildSaveMeta(fullState) {
        if (!fullState) return null;
        return {
            charName: fullState.charName,
            gender: fullState.gender,
            realm: fullState.realm,
            layer: fullState.layer,
            timestamp: fullState.timestamp,
            version: fullState.version || '3.1',
            // 列表展示用摘要（完整 state 在同槽）
            mainAttributes: fullState.mainAttributes,
            karma: fullState.karma,
            order: fullState.order,
            // 第一百一十波 · NEW-107：灵根摘要进本体——此前只有手动侧在 app.js 单独打补丁，
            // 自动档直接拿 buildSaveMeta 建条目，设置页自动档列表灵根恒显「金-% 木-% …」
            roots: fullState.roots || fullState.spiritualRoots || {}
        };
    }

    /**
     * 新游戏：清空角色键 + 重置各系统内存为初始态
     */
    function resetWorldForNewGame() {
        clearCharacterStorage({ alsoAccount: false });
        if (global.StateRegistry && typeof global.StateRegistry.resetAll === 'function') {
            try { global.StateRegistry.resetAll(); } catch (e) { console.warn('[GameState] 模块状态重置失败:', e); }
        }
        // 第八十二波·SAVE-01b：任务账内存态也随新角色清零（clearCharacterStorage 只清键，
        // quest-system 的内存 playerQuestProgress 会把上个角色的 activeQuests 再写回去）
        if (typeof global.resetQuestProgressForNewCharacter === 'function') {
            try { global.resetQuestProgressForNewCharacter(); } catch (e) { console.warn('[GameState] 任务账重置失败:', e); }
        }
        // 第一百一十一波：世界事件/城市残留的内存态也随新局清零——此前只清 localStorage 键，
        // 旧档的「灵气潮汐×2 修炼」等修正会原样套在新角色身上，第一个 newDay 还把脏账写回键里
        if (typeof global.resetWorldEventsState === 'function') {
            try { global.resetWorldEventsState(); } catch (e) { console.warn('[GameState] 世界事件重置失败:', e); }
        }
        // 旁账的**内存态**也得跟键一起清（键清了、内存留着，等于没清）：
        // ① 融合功法 def：页面加载时 rehydrateMergedSkills 已把上一局的完整 def 塞进 skillPages，
        //    而秘境「残破功法」事件正是从 skillPages 随机抽一门记为「听闻」（app.js:10115），
        //    不看掌握状态 ⇒ 新角色会抽中上一局自创功法的名字（app.js:319 的 initStarterKnowledge
        //    只清知识账 techniqueKnowledge，清不到功法表本身）。
        //    「哪一类 id 算注册表条目」由 cultivation.js 的 LEDGER_SKILL_ID_PREFIXES 独家持有，这里
        //    不自己抄一份——抄一份就是两处各记一次命名规则，日后加前缀必漏一边。
        //    连带清 legacyart_（grand-legacy.js:438 的自创功法）：它与 merged_ 同属 xianxia_merged_skills
        //    一本注册表、同样被 rehydrateMergedSkills 灌进 skillPages，只清一族等于漏一半。
        // ② 嫉妒两本账各有闭包缓存（_ledger / _cled），不清缓存下一次写入就把旧条目原样写回键里。
        //    各模块都备好了「丢弃缓存、重读磁盘」的口子（_asmLedgerReload / _collectiveLedgerReload），直接用。
        try {
            if (typeof global._purgeLedgerSkillDefsFromPages === 'function') {
                global._purgeLedgerSkillDefsFromPages();
            } else if (Array.isArray(global.skillPages)) {
                // 退路（脚本顺序未到位）：只清 merged_，与本函数修前的旧行为一字不差，不算扩权
                for (var pgI = 0; pgI < global.skillPages.length; pgI++) {
                    var pg = global.skillPages[pgI];
                    if (!Array.isArray(pg)) continue;
                    for (var skI = pg.length - 1; skI >= 0; skI--) {
                        if (pg[skI] && String(pg[skI].id).indexOf('merged_') === 0) pg.splice(skI, 1);
                    }
                }
            }
        } catch (eMsPurge) {
            console.warn('[GameState] 融合功法表清空失败：上一局自创的功法名可能仍留在功法表里', eMsPurge && eMsPurge.message);
        }
        try { if (typeof global._asmLedgerReload === 'function') global._asmLedgerReload(); }
        catch (eAsPurge) { console.warn('[GameState] 嫉妒余波账内存重置失败：', eAsPurge && eAsPurge.message); }
        try { if (typeof global._collectiveLedgerReload === 'function') global._collectiveLedgerReload(); }
        catch (eClPurge) { console.warn('[GameState] 集体戏账内存重置失败：', eClPurge && eClPurge.message); }

        // 背包
        if (global.inventory) {
            var maxSlots = global.inventory.maxSlots || 30;
            global.inventory.slots = [];
            for (var i = 0; i < maxSlots; i++) global.inventory.slots.push(null);
            global.inventory.currency = { copper: 100, spiritStones: 10 };
            global.inventory.markedForSale = new Set();
            if (typeof global.updateInventoryUI === 'function') global.updateInventoryUI();
            if (typeof global.updateCurrencyUI === 'function') global.updateCurrencyUI();
        }
        
        // v10.5 重置交易系统
        if (window.TradeService && typeof window.TradeService.clearBuyback === 'function') {
            window.TradeService._buybackItems = {};
            window.TradeService._quotes = {};
            window.TradeService._quoteIdCounter = 0;
        }

        // 灵兽
        if (typeof global.importBeastState === 'function') {
            global.importBeastState({ beasts: [], activeBeastIndex: -1, activeMountIndex: -1 });
        } else {
            global.tamedBeasts = [];
            global.activeBeastIndex = -1;
            global.activeMountIndex = -1;
        }

        // 洞府
        if (typeof global.importHouseState === 'function') {
            global.importHouseState(null);
        } else {
            global.playerHouse = null;
        }

        // 任务
        if (typeof global.importQuestState === 'function') {
            global.importQuestState({ activeQuests: [], completedQuests: [], totalCompleted: 0 });
        } else if (global.playerQuestProgress) {
            global.playerQuestProgress.activeQuests = [];
            global.playerQuestProgress.completedQuests = [];
            global.playerQuestProgress.totalCompleted = 0;
        }

        // 队伍
        if (typeof global.importPartyState === 'function') {
            global.importPartyState({ members: [], formation: 'standard' });
        } else if (global.partyData) {
            global.partyData.members = [];
            global.partyData.formation = 'standard';
        }
        // 同时清空 partySystem.partyData（实际数据所在）
        if (global.partySystem && global.partySystem.partyData) {
            global.partySystem.partyData.members = [];
            global.partySystem.partyData.formation = 'standard';
        }

        // 门派
        if (global.discipleState && typeof global.discipleState === 'object') {
            try {
                Object.keys(global.discipleState).forEach(function (k) {
                    delete global.discipleState[k];
                });
                // v25.1·P24：重置结构补齐 isInSect/sectId——旧结构缺键，转世/重开后
                // 读 isInSect 的二十来处全在 undefined 上走假分支；position 是零读者死字段，删
                Object.assign(global.discipleState, {
                    isInSect: false,
                    sectId: null,
                    sectName: null,
                    contribution: 0,
                    rank: null
                });
            } catch (e) {
                global.discipleState = { isInSect: false, sectId: null, sectName: null, contribution: 0, rank: null };   // v25.1·P24
            }
        }

        // 事件标志
        if (global.eventFlags && typeof global.eventFlags === 'object') {
            Object.keys(global.eventFlags).forEach(function (k) {
                delete global.eventFlags[k];
            });
        } else {
            global.eventFlags = {};
        }

        // 熟练度
        if (typeof global.resetProficiencyData === 'function') {
            global.resetProficiencyData();
        } else if (global.proficiencyData) {
            global.proficiencyData = {};
        }

        // 装备 / 运功（由 startGame 再清运功）
        if (global.currentEquipment) {
            Object.keys(global.currentEquipment).forEach(function (k) {
                global.currentEquipment[k] = null;
            });
        }

        // 生理
        global._playerPhysiology = null;

        // NPC系统重置：重新初始化NPC管理器
        if (typeof global.resetNPCSystem === 'function') {
            try { global.resetNPCSystem(); } catch (e) {}
        } else if (global.npcManager) {
            try {
                global.npcManager = new global.NPCManager();
                global.npcManager.npcs = new Map();
                global.npcManager.activeNPCs = [];
                if (typeof global.addSampleNPCs === 'function') {
                    global.addSampleNPCs();
                } else if (typeof global.initNPCSystem === 'function') {
                    global.initNPCSystem();
                }
            } catch (e) {
                console.warn('[GameState] NPC系统重置失败:', e);
            }
        }

        // 重置叙事系统运行时状态
        global.personalEventFlags = {};
        global._eventCooldowns = {};
        global._lastInteractDay = {};
        global._negativeChoiceCount = {};
        if (global.currentCharData) {
            global.currentCharData._npcRoutes = {};
        }

        // 各系统若提供 reset，则调用
        ['resetReputationSystem', 'resetProfessionSystem', 'resetLifespanSystem',
            'resetLocationSystem', 'resetTravelSystem', 'resetWorldEvents',
            'resetFactionState', 'resetLandmarkData', 'resetEnhancementPity',
            'resetChoiceMemory', 'resetScenarioProgress', 'resetSectJoinFlow',
            'resetDailyEvents', 'resetFacilityState',
            'resetPersonalEventFlags'].forEach(function (fn) {
            if (typeof global[fn] === 'function') {
                try { global[fn](); } catch (e) {}
            }
        });
    }

    /**
     * 将完整存档应用到运行时（读档）
     * 数值字段使用 nullish：0 合法保留
     */
    function applyFullGameState(saveData, hooks) {
        hooks = hooks || {};
        if (!saveData || !saveData.charName) return false;

        // 读档前清空上一角色兼容键，杜绝 A/B 槽通过 localStorage 串状态。
        //
        // ⚠️ `xianxia_save` 必须挂进 protectKeys：它不是「上一角色的附属账」，而是**此刻正在
        // 被应用的那份档本体**（app.js:3227「继续仙途」与 :3286 摘要槽的同名完整档兜底都靠它，
        // auto-save.js:155 载入自动档前也先往它落一份备份）。当普通角色键删掉，等于读档先自毁；
        // 而本函数从这一行到末尾有十几处无 try 的回灌（new ItemInstance / importQuestState /
        // KnowledgeSystem.importData …），任何一处抛错末尾的「载入即定妆」回填就都走不到。
        // 实测证据见 .scratch/fix-critical-progress/repro-bug1.cjs 场景 2。
        //
        // 另抄一份原文做兜底：这颗键全程在盘上，正常路径末尾会被新档覆盖；万一末尾回填自己也
        // 写不进去（配额满），至少盘上留着上一份完整档，而不是一颗空键。
        var prevSaveRaw = null;
        try { prevSaveRaw = localStorage.getItem('xianxia_save'); } catch (ePrevSnap) {
            console.warn('[GameState] 读档前抄不下 xianxia_save 原文（存储受限）：本次载入中途抛错时没有本地副本可留', ePrevSnap && ePrevSnap.message);
        }
        clearCharacterStorage({ alsoAccount: false, protectKeys: ['xianxia_save'] });

        var n = function (v, d) { return v != null ? v : d; };

        var loadedChar = {
            name: saveData.charName,
            gender: saveData.gender,
            mainAttributes: saveData.mainAttributes || {},
            combatSkills: saveData.combatSkills || {},
            // v13.1 绝技读档：缺省兜底为空数组（旧档无此字段）
            combatAbilities: Array.isArray(saveData.combatAbilities) ? saveData.combatAbilities.slice() : [],
            lifeSkills: saveData.lifeSkills || {},
            spiritualRoots: saveData.roots || saveData.spiritualRoots || {},
            mutatedRoots: saveData.mutatedRoots || {},
            attrs: saveData.attrs || {},
            realm: n(saveData.realm, '炼气'),
            layer: n(saveData.layer, 1),
            essence: n(saveData.essence, 0),
            tempering: n(saveData.tempering, 0),
            health: n(saveData.health, 100),
            qi: n(saveData.qi, 100),
            energy: n(saveData.energy, 100),
            // SAVE-03：心境回灌（旧档无字段按新号底色 80／100 处理——与角色模板、HUD 兜底同口径）
            mood: n(saveData.mood, 80),
            maxMood: n(saveData.maxMood, 100),
            spiritStones: n(saveData.spiritStones, 0),
            copper: n(saveData.copper, 0),
            karma: n(saveData.karma, 0),
            order: n(saveData.order, 0),
            blessing: n(saveData.blessing, 0),
            // v20.39：气运与走火入魔紊乱回灌（旧档无字段：气运按 50、紊乱按 0）
            luck: n(saveData.luck, 50),
            _qiDeviation: n(saveData.qiDeviation, 0),
            // v20.11：击杀计数 / 收藏领奖记录回灌（旧档无字段按 0/空处理）
            _killCount: n(saveData.killCount, 0),
            _collectionClaimed: (saveData.collectionClaimed && typeof saveData.collectionClaimed === 'object')
                ? saveData.collectionClaimed : {},
            // v20.12：道侣/结拜与子嗣回灌（旧档无字段按空处理，旧档期间结的道侣
            // 已随旧版丢失，无从追溯）
            bonds: (saveData.bonds && typeof saveData.bonds === 'object') ? saveData.bonds : {},
            _children: Array.isArray(saveData.children) ? saveData.children : [],
            // v20.42：悟道树领悟节点回灌（旧档无字段按空树处理）
            _enlightenedNodes: Array.isArray(saveData.enlightenedNodes) ? saveData.enlightenedNodes.slice() : [],
            // v20.45：门派故事进度回灌（旧档无字段按未开演处理）
            _sectStory: (saveData.sectStory && typeof saveData.sectStory === 'object') ? saveData.sectStory : {},
            // v20.16：重塑灵根次数回灌（旧档无字段按 0 处理）
            _rootRefines: n(saveData.rootRefines, 0),
            // v20.18：钱庄账本回灌（旧档无字段按空账处理；账本结构由 BankService 使用时再校验）
            _bank: (saveData.bank && typeof saveData.bank === 'object') ? saveData.bank : null,
            // v20.20：当票回灌（旧档无字段按无票处理；结构由 PawnService 使用时再校验）
            _pawn: (saveData.pawn && typeof saveData.pawn === 'object') ? saveData.pawn : null,
            // v20.21：黑市信用簿回灌（旧档无字段按初来乍到处理；结构由 FenceCredit 使用时再校验）
            _fence: (saveData.fence && typeof saveData.fence === 'object') ? saveData.fence : null,
            // v20.53：渡界前的人间落脚点回灌（旧档无字段按空处理，渡回时落帝都）
            _mortalOrigin: saveData.mortalOrigin || '',
            // P0-5 死亡仙侠化：神魂/残魂状态
            soulState: saveData.soulState || null,
            // ===== 第一百二十三批 DES-75：与上方 collect 一一对应的回灌 =====
            // 旧档没这些字段时按新号底色处理（与 mood/luck 那两条同口径），不凭空发钱发点。
            fame: n(saveData.fame, 0),
            notoriety: n(saveData.notoriety, 0),
            fortune: n(saveData.fortune, 0),
            insightPoints: n(saveData.insightPoints, 0),
            incense: n(saveData.incense, 0),
            _poisoned: !!saveData._poisoned,
            springBlessing: n(saveData.springBlessing, 0),
            lastDailyClaimDay: n(saveData.lastDailyClaimDay, null),
            _demonicCorruption: n(saveData._demonicCorruption, 0),
            _demonicPower: n(saveData._demonicPower, 0),
            _foundationBonus: n(saveData._foundationBonus, 0),
            _coreBonus: n(saveData._coreBonus, 0),
            _primordialBonus: n(saveData._primordialBonus, 0),
            _divineBonus: n(saveData._divineBonus, 0),
            _breakthroughPillBonus: n(saveData._breakthroughPillBonus, 0),
            _manualProgress: (saveData._manualProgress && typeof saveData._manualProgress === 'object')
                ? saveData._manualProgress : {},
            dungeonProgress: (saveData.dungeonProgress && typeof saveData.dungeonProgress === 'object')
                ? saveData.dungeonProgress : {},
            _customPills: Array.isArray(saveData._customPills) ? saveData._customPills.slice() : [],
            _pastLifeMemory: (saveData._pastLifeMemory && typeof saveData._pastLifeMemory === 'object')
                ? saveData._pastLifeMemory : null,
            flags: (saveData.charFlags && typeof saveData.charFlags === 'object') ? saveData.charFlags : {},
            _arenaDay: n(saveData._arenaDay, null),
            _arenaDailyCount: n(saveData._arenaDailyCount, 0),
            arenaWins: n(saveData.arenaWins, 0),
            arenaStreak: n(saveData.arenaStreak, 0),
            arenaScore: n(saveData.arenaScore, 0),
            _failedBreakthroughs: n(saveData._failedBreakthroughs, 0),
            dungeonClearedAt: (saveData.dungeonClearedAt && typeof saveData.dungeonClearedAt === 'object')
                ? saveData.dungeonClearedAt : {},
            // ===== v24.4 账本续查：与上方 collect 一一对应的回灌 =====
            // 旧档没这些字段时按底色处理（与 DES-75 同口径）：不凭空发毒、发法宝、发灵脉、开天门。
            pillPoison: n(saveData.pillPoison, 0),
            _heartDemon: (saveData._heartDemon && typeof saveData._heartDemon === 'object') ? saveData._heartDemon : null,
            _heartDemonBonus: n(saveData._heartDemonBonus, 0),
            _travel: (saveData._travel && typeof saveData._travel === 'object') ? saveData._travel : null,
            _iceTowerPerm: n(saveData._iceTowerPerm, 0),
            _bondedArtifact: (saveData._bondedArtifact && typeof saveData._bondedArtifact === 'object') ? saveData._bondedArtifact : null,
            _spiritVein: (saveData._spiritVein && typeof saveData._spiritVein === 'object') ? saveData._spiritVein : null,
            _unlockedTianjie: !!saveData._unlockedTianjie,
            _ascensionDay: n(saveData._ascensionDay, null),
            _tianjieFrom: saveData._tianjieFrom || '',
            lastDeathReason: saveData.lastDeathReason || null,
            _main025_asked: !!saveData._main025_asked,
            _main025_stood: !!saveData._main025_stood,
            _mailAffDay: (saveData._mailAffDay && typeof saveData._mailAffDay === 'object') ? saveData._mailAffDay : null,
            _customPillBuff: (saveData._customPillBuff && typeof saveData._customPillBuff === 'object') ? saveData._customPillBuff : null,
            maxHealth: n(saveData.maxHealth, 100),
            maxQi: n(saveData.maxQi, 100),
            maxEnergy: n(saveData.maxEnergy, 100),
        };

        if (typeof global.setCurrentCharData === 'function') {
            global.setCurrentCharData(loadedChar);
        } else {
            global.currentCharData = loadedChar;
            // 第九十五波·NEW-36：兜底路径也装钱包访问器（背包钱包是唯一权威）
            if (typeof global.installWalletMirror === 'function') global.installWalletMirror(loadedChar);
            if (typeof global.syncCharAttrsFromMain === 'function') {
                global.syncCharAttrsFromMain(loadedChar);
            }
        }
        if (typeof hooks.setCharData === 'function') hooks.setCharData(loadedChar);

        // 躯体
        if (saveData.bodyDurability && typeof hooks.setBodyDurability === 'function') {
            hooks.setBodyDurability(Object.assign({}, saveData.bodyDurability));
        } else if (saveData.bodyDurability) {
            global._savedDurabilities = Object.assign({}, saveData.bodyDurability);
            global._savedMaxDurabilities = Object.assign({}, saveData.bodyDurability);
        }

        // 背包
        if (saveData.inventory && global.inventory) {
            global.inventory.maxSlots = saveData.inventory.maxSlots || 30;
            global.inventory.currency = saveData.inventory.currency
                ? Object.assign({}, saveData.inventory.currency)
                : { copper: 100, spiritStones: 10 };
            // 恢复标记出售集合
            if (saveData.inventory.markedForSale) {
                global.inventory.markedForSale = new Set(saveData.inventory.markedForSale);
            } else {
                global.inventory.markedForSale = new Set();
            }
            if (saveData.inventory.slots && typeof global.ItemInstance === 'function') {
                global.inventory.slots = saveData.inventory.slots.map(function (slotData) {
                    if (!slotData) return null;
                    var instance = new global.ItemInstance(slotData.templateId, slotData.count);
                    if (slotData.uid) instance.uid = slotData.uid;
                    if (slotData.durability != null) instance.durability = slotData.durability;
                    // v25.1·试-07：强化字段随主存档还原（与 serializeInventorySlots 对称，写法同 inventory.js loadInventory）
                    ['enhancementLevel', 'refineLevel', 'enchantType', 'armorDurability'].forEach(function (f) {
                        if (slotData[f] !== undefined && slotData[f] !== null) instance[f] = slotData[f];
                    });
                    instance.customProps = slotData.customProps || {};
                    instance.markedForSale = slotData.markedForSale || false;
                    return instance;
                });
            } else if (saveData.inventory.slots) {
                global.inventory.slots = saveData.inventory.slots.slice();
            }
            while (global.inventory.slots.length < global.inventory.maxSlots) {
                global.inventory.slots.push(null);
            }
            if (typeof global.updateInventoryUI === 'function') global.updateInventoryUI();
            if (typeof global.updateCurrencyUI === 'function') global.updateCurrencyUI();
        }

        // 装备
        if (saveData.equipment && global.currentEquipment) {
            Object.keys(global.currentEquipment).forEach(function (key) {
                global.currentEquipment[key] = null;
            });
            Object.keys(saveData.equipment).forEach(function (slot) {
                if (saveData.equipment[slot]) global.currentEquipment[slot] = saveData.equipment[slot];
            });
            // v20.91 九品制：旧存档装备克隆体上的旧品质串折算到新档
            if (typeof global.normalizeQuality === 'function') {
                Object.keys(global.currentEquipment).forEach(function (slot) {
                    var it = global.currentEquipment[slot];
                    if (it && it.quality) it.quality = global.normalizeQuality(it.quality);
                });
            }
            if (typeof global.updateEquippedStats === 'function') global.updateEquippedStats();
        }

        // 功法槽
        if (saveData.skills && global.currentSkills) {
            if (typeof global.migrateSkillsToThreeSlots === 'function') {
                global.migrateSkillsToThreeSlots(saveData.skills);
            } else {
                Object.keys(global.currentSkills).forEach(function (key) {
                    global.currentSkills[key] = null;
                });
                Object.keys(saveData.skills).forEach(function (slot) {
                    if (saveData.skills[slot] && global.currentSkills.hasOwnProperty(slot)) {
                        global.currentSkills[slot] = saveData.skills[slot];
                    }
                });
            }
        }

        // 知识层（功法账：knowledge-system.js 的 techniqueKnowledge 正账 ↔ 旧账 learnedSecrets 镜像）
        //
        // ★病灶一 · 读档抹掉功法账：原判据是裸 truthy `if (saveData.techniqueKnowledge)`，
        // 而 {} 在 JS 里是真值 ⇒ 档里只要落的是空对象就永远走 importData({})，
        // 旧档迁移那条腿（migrateFromLearnedSecrets）**永远走不到**。空对象并不稀有：
        // 写档侧 collectFullGameState:368 与 app.js:3026 都在「KnowledgeSystem 缺席 / 知识册还空」
        // 时写出 {}，而那份档的 learnedSecrets（:367）照样是真账。
        // 后果不可恢复：秘籍早已被 inventory.js:468 消耗掉，账再被读档抹成 0 ⇒ 玩家练的门全丢
        // （另一代理真机实测 learnedSecrets 49 → 0、ArtEffects.learnedCount 49 → 0、
        //   combatBonus() 由 {defense:30,speed:80,dodge:45,counter:50} 变成 {}）。
        // 改成「有键且非空」：缺键 / undefined / null / {} / [] / 非对象 一律落到下面那条腿。
        //
        // ★权威判据（techniqueKnowledge 与 learnedSecrets 都有值时听谁的）：**并集，只补不盖**。
        //   · techniqueKnowledge 是结构化正账（knowledge-system.js:5 的唯一数据源约定）；
        //   · learnedSecrets 虽由 syncLearnedSecretsList() 派生，但它**不是纯派生**——
        //     inventory.js:772、grand-legacy.js:473、cultivation.js:1146 三条回退腿在
        //     KnowledgeSystem 缺席（或它抛错）时直接往数组里塞 id，所以数组里可能有正账没有的门
        //     （自创/融合功法就是走这两条登记的）。只认一边都是在赌运气。
        //   · 并集方向单调：unlock 不允许降级（knowledge-system.js:239），
        //     所以读一次与读三次结果一致（幂等），且绝不清空任何一边已有的真账。
        //   · 并集**只补正账缺的那些**：已经登在册的门不再 unlock 第二遍——unlock 内部会走
        //     Codex.discover，对已有条目那是 count++（codex-tutorial.js:90），
        //     每读一次档抬一次「见过次数」是凭空长出来的账，不该有。
        if (global.KnowledgeSystem) {
            var ks = global.KnowledgeSystem;
            var tk = saveData.techniqueKnowledge;
            // 「有键且非空」，不是裸 truthy。数组/字符串这类非账本形状一律按「账本侧没内容」处理
            var tkHasEntries = !!(tk && typeof tk === 'object' && !Array.isArray(tk) && Object.keys(tk).length > 0);
            var lsSaved = Array.isArray(saveData.learnedSecrets) ? saveData.learnedSecrets : null;

            if (tkHasEntries) {
                ks.importData(tk);            // 正账进门：整体替换（本档的账就是这一份，不与上一局混合）
            } else if (lsSaved && lsSaved.length) {
                ks.migrateFromLearnedSecrets(lsSaved);   // 空对象/缺键的老档：从旧账迁移（原来永远走不到）
            } else {
                ks.initStarterKnowledge();   // 两本都空 = 新号底色（凡人只「听闻」吐纳术）
            }

            // 旧账并集：把正账侧登不到的 id 迁进来。迁完即 self-heal —— 本次载入的真账会随下一次
            // 存档以「有键」形态写回本地，那份 {} 的坏档从此不再产生（不必另加任何存档键）。
            if (lsSaved && lsSaved.length) {
                var ledger = ks.techniqueKnowledge || {};
                var covered = {};
                Object.keys(ledger).forEach(function (kid) {
                    var ent = ledger[kid] || {};
                    covered[kid] = true;
                    if (ent.manualId) covered[String(ent.manualId)] = true;   // 镜像：sync 会把 manualId 也写进旧账
                });
                var missing = [];
                lsSaved.forEach(function (sid) {
                    if (sid == null || sid === '') return;
                    var skey = String(sid);
                    if (covered[skey]) return;
                    covered[skey] = true;      // 旧账自身就有镜像重复（skillId 与其 manualId 同时在册）
                    missing.push(skey);
                });
                if (missing.length) ks.migrateFromLearnedSecrets(missing);
            }

            // ★病灶二 · 那个无条件覆盖赋值：syncLearnedSecretsList() 只收 state>=learned 的条目，
            // 且它内部已经把 global.learnedSecrets 写成了这个结果。档里明明记着 N 门、算出来却是空时，
            // 原来那句无条件赋值会把玩家真账当场抹成 0。判据：**宁可原样留旧账，也绝不允许非空 → 空**。
            var synced = ks.syncLearnedSecretsList();
            if ((!synced || !synced.length) && lsSaved && lsSaved.length) {
                global.learnedSecrets = lsSaved.slice();
                console.warn('[GameState] 知识账算不出任何「已学会」的功法，按存档里的旧账原样保留（'
                    + lsSaved.length + ' 门未被抹掉）');
            } else {
                global.learnedSecrets = synced;
            }
        } else if (saveData.learnedSecrets) {
            global.learnedSecrets = saveData.learnedSecrets;
        }

        if (global.currentSkills && global.KnowledgeSystem) {
            Object.keys(global.currentSkills).forEach(function (slot) {
                var sk = global.currentSkills[slot];
                // 第十五波：门派功法是例外——此刻弟子掌握度账还没恢复，凭结构查表放行（装备当时已验过掌握度）
                var isSectArt = (typeof global.sectArtAsSkill === 'function' && global.sectArtAsSkill(sk && sk.id));
                if (sk && sk.id && !isSectArt && !global.KnowledgeSystem.canEquip(sk.id)) {
                    global.currentSkills[slot] = null;
                }
            });
        }

        // 任务 / 队伍 / 门派 / 事件 / 熟练度 — 优先 import 接口
        if (typeof global.importQuestState === 'function' && saveData.questProgress) {
            global.importQuestState(saveData.questProgress);
        } else if (saveData.questProgress) {
            global.playerQuestProgress = saveData.questProgress;
        }

        if (typeof global.importPartyState === 'function' && saveData.partyData) {
            global.importPartyState(saveData.partyData);
        } else if (saveData.partyData) {
            global.partyData = saveData.partyData;
        }

        if (saveData.discipleState && global.discipleState && typeof global.discipleState === 'object') {
            try {
                Object.keys(global.discipleState).forEach(function (k) {
                    delete global.discipleState[k];
                });
                Object.assign(global.discipleState, saveData.discipleState);
            } catch (e) {
                global.discipleState = saveData.discipleState;
            }
        } else if (saveData.discipleState) {
            global.discipleState = saveData.discipleState;
        }

        // 门派设施状态（B3）
        if (saveData.sectFacilities) {
            if (typeof global.loadFacilityStateFromSave === 'function') {
                global.loadFacilityStateFromSave(saveData.sectFacilities);
        // v18.1 恢复出战增益（读取时再按当前时间过滤一次）
        try {
            var nowMinAb2 = (window.timeSystem && window.timeSystem.gameTime) ? (window.timeSystem.gameTime.totalMinutes || 0) : 0;
            var abRestore = {};
            var abSrc2 = saveData.activeBuffs || {};
            Object.keys(abSrc2).forEach(function (k) { if (abSrc2[k] && (abSrc2[k].expiryGameMinute || 0) > nowMinAb2) abRestore[k] = abSrc2[k]; });
            window.activeBuffs = abRestore;
        } catch (eAbRes) {}
            } else if (global.facilityState) {
                var fs = saveData.sectFacilities;
                global.facilityState.lastResetGameDay = fs.lastResetGameDay || 0;
                global.facilityState.dailyUsage = fs.dailyUsage || {};
                global.facilityState.cooldownUntilMinute = fs.cooldownUntilMinute || {};
                global.facilityState.lastUsedGameMinute = fs.lastUsedGameMinute || {};
            }
        }

        if (saveData.gameTime) {
            if (typeof global.loadGameTimeFromSave === 'function') {
                global.loadGameTimeFromSave(saveData.gameTime);
            } else if (global.timeSystem && global.timeSystem.loadGameTimeFromSave) {
                global.timeSystem.loadGameTimeFromSave(saveData.gameTime);
            } else if (global.gameTime) {
                Object.assign(global.gameTime, saveData.gameTime);
                if (global.timeSystem && global.timeSystem.updateTimeDisplay) {
                    global.timeSystem.updateTimeDisplay();
                }
            }
        }

        if (saveData.eventFlags) {
            if (global.eventFlags && typeof global.eventFlags === 'object') {
                Object.keys(global.eventFlags).forEach(function (k) { delete global.eventFlags[k]; });
                Object.assign(global.eventFlags, saveData.eventFlags);
            } else {
                global.eventFlags = saveData.eventFlags;
            }
        }

        if (saveData.proficiencyData) {
            if (typeof global.importProficiencyState === 'function') {
                global.importProficiencyState(saveData.proficiencyData);
            } else {
                global.proficiencyData = saveData.proficiencyData;
            }
        }

        // 生理（0 值用 n）
        if (saveData.playerPhysiology) {
            try {
                var physData = saveData.playerPhysiology;
                var blood = physData.bloodVolume !== undefined ? physData.bloodVolume
                    : (physData.health !== undefined ? physData.health : 100);
                global._playerPhysiology = {
                    physiology: {
                        type: physData.type || 'humanoid',
                        bloodVolume: blood,
                        health: blood,
                        circulation: n(physData.circulation, 100),
                        consciousness: n(physData.consciousness, 100),
                        breathing: n(physData.breathing, 100),
                        painLoad: n(physData.painLoad, 0),
                        neuralShock: n(physData.neuralShock, 0),
                        oxygenDebt: n(physData.oxygenDebt, 0),
                        breathlessTurns: n(physData.breathlessTurns, 0),
                        criticalTimer: physData.criticalTimer != null ? physData.criticalTimer : -1,
                        criticalCause: physData.criticalCause || null,
                        criticalRounds: physData.criticalRounds || 50,
                        criticalInjuries: physData.criticalInjuries || null,
                        physiologyFlags: physData.physiologyFlags || null,
                        dantianDestroyed: !!physData.dantianDestroyed,
                        wounds: physData.wounds || [],
                        parts: physData.parts || {},
                        state: physData.state || 'alert',
                        isUnconscious: !!physData.isUnconscious,
                        integrity: n(physData.integrity, 100)
                    }
                };
                // 单一权威链路：读档恢复生理后，一次性把存档血量同步到角色 health（clamp 0~100）
                if (global.currentCharData && isFinite(blood)) {
                    global.currentCharData.health = Math.max(0, Math.min(100, Math.round(blood)));
                }
            } catch (e) {
                console.warn('[GameState] 生理数据加载失败', e);
                global._playerPhysiology = null;
            }
        }

        // 灵兽
        if (typeof global.importBeastState === 'function') {
            global.importBeastState(saveData.beasts || { beasts: [], activeBeastIndex: -1, activeMountIndex: -1 });
        }

        // 洞府
        if (typeof global.importHouseState === 'function') {
            global.importHouseState(saveData.house != null ? saveData.house : null);
        } else if (saveData.house !== undefined) {
            global.playerHouse = saveData.house;
        }

        // 其余子系统：写回 localStorage 再 init，或 import
        function writeKey(key, val) {
            // 第一百一十波 · NEW-104：槽里缺这格（null/undefined）就跳过——绝不能删键。
            // 旧版 null 走 removeItem：载入一份老档/别的角色的档，会当场把现行角色的
            // 声望、地标、每日事件等真数据键从浏览器里删掉（现场 7 份档 6 份带删键效果）。
            var wrote = true;
            if (val == null) return;
            try {
                wrote = global.saveToStorage ? global.saveToStorage(key, JSON.stringify(val)) !== false
                    : (localStorage.setItem(key, JSON.stringify(val)), true);   // saveToStorage 自己在配额满时吞异常返回 false（并已向玩家报过警）
            } catch (e) {
                wrote = false;
                console.warn('[静默失败] js/core/game-state.js · writeKey：键写不进盘——' + key + ' 没落盘（隐私模式或存储已满）', e && e.message);
            }
            return wrote;   // 末尾「当前档」那一步要看它：写不进去时宁可把上一份完整档顶回去
        }

        writeKey('xianxia_reputation', saveData.reputation);
        writeKey('xianxia_lifespan', saveData.lifespan);
        writeKey('xianxia_location_data', saveData.locationData);
        writeKey('xianxia_travel_data', saveData.travelData);
        writeKey('xianxia_world_events', saveData.worldEvents);
        writeKey('xianxia_city_temp', saveData.cityTemp);
        // 第一百零九波：落盘之后立刻回灌内存——此前世界事件/城市残留只写 localStorage 不重载，
        // 会话内读档后内存里还是读档前的旧账（旧兽潮事件照刷、面板与真源脱钩）
        try { if (typeof window.loadWorldEvents === 'function') window.loadWorldEvents(); } catch (eWE) {}
        try { if (typeof window.loadCityTempModifiers === 'function') window.loadCityTempModifiers(); } catch (eCT) {}
        writeKey('xianxia_factions', saveData.factions);
        writeKey('xianxia_landmarks', saveData.landmarks);
        writeKey('xianxia_enhancement_pity', saveData.enhancementPity);
        writeKey('xianxia_choices', saveData.choices);
        writeKey('xianxia_scenario_progress', saveData.scenarioProgress);
        writeKey('xianxia_sect_join_state', saveData.sectJoinState);
        // F-11 撤回：sect_diplomacy / tracked_quests / storyline_choices 由对应模块的 StateRegistry.import 接管
        writeKey('xianxia_daily_events', saveData.dailyEvents);
        writeKey('xianxia_arena_ranking', saveData.arenaRanking);
        // P1-11: 社交冷却与每日次数存档
        writeKey('xianxia_social_cooldowns', saveData.social);
        // P2-10: NPC生死记录存档
        writeKey('xianxia_npc_records', window._npcRecords || { deceased: [], gone: [], protectionLevels: {} });
        // P2-10: 飞鸽传书存档
        // F-9 撤回：mail 模块已注册到 StateRegistry（mail-system.js），这里不再写脏数据也不再读回。StateRegistry.importAll 会自动处理。
        // 保留独立键兼容旧存档
        if (window.MailSystem && typeof window.MailSystem.saveMailData === 'function' && !window.StateRegistry) {
            window.MailSystem.saveMailData();
        }
        // 背包/灵兽/洞府/任务等已在内存，避免再被独立键覆盖：同步写一份兼容旧模块
        if (saveData.inventory) {
            var invState = {
                slots: serializeInventorySlots(global.inventory && global.inventory.slots),
                maxSlots: global.inventory && global.inventory.maxSlots,
                currency: global.inventory && global.inventory.currency
            };
            // v10.5 保存标记出售数据
            if (global.inventory && global.inventory.markedForSale) {
                invState.markedForSale = Array.from(global.inventory.markedForSale);
            }
            writeKey('xianxia_inventory', invState);
        }
        if (saveData.beasts) writeKey('xianxia_beasts', saveData.beasts);
        if (saveData.house != null) writeKey('xianxia_house', saveData.house);
        if (saveData.questProgress) writeKey('xianxia_quest_progress', saveData.questProgress);
        if (saveData.partyData) writeKey('xianxia_party_data', saveData.partyData);
        if (saveData.eventFlags) writeKey('xianxia_event_flags', saveData.eventFlags);
        if (saveData.proficiencyData) writeKey('xianxia_proficiency', saveData.proficiencyData);
        // v25.2·修复：熟练度档镜像落地后重灌闭包（writeKey 只写 LS，闭包变量在启动时
        // 读的是旧键——不重灌则读档后闭包与档口径分裂）；老档无此字段（=空熟练度）时
        // 显式清空，杜绝换档继承上一角色（全局 LS 键是串档通道）
        if (typeof global.initProficiencyData === 'function') {
            if (saveData.proficiencyData) global.initProficiencyData();
            else if (typeof global.resetProficiencyData === 'function') global.resetProficiencyData();
        }

        // NPC系统状态恢复
        if (saveData.npcs && global.npcManager && typeof global.npcManager.deserialize === 'function') {
            try {
                global.npcManager.deserialize(saveData.npcs);
            } catch (e) {
                console.warn('[GameState] NPC反序列化失败:', e);
            }
        }

        // v20.24 旧档补票：早年"婚礼办过、名册没写"的道侣之盟照补（只翻译旧旗，不另发好处）
        if (typeof global.daoCompanionSweep === 'function') {
            try { global.daoCompanionSweep(); } catch (e) { console.warn('[GameState] 道侣名册补票失败:', e); }
        }

        // v10.5 交易系统状态恢复
        if (saveData.trade && window.TradeService && typeof window.TradeService.deserialize === 'function') {
            try {
                window.TradeService.deserialize(saveData.trade);
            } catch (e) {
                console.warn('[GameState] TradeService反序列化失败:', e);
            }
        }

        // 叙事系统状态恢复（个人事件冷却/路线等）
        if (saveData.narrative) {
            var nData = saveData.narrative;
            // 恢复 personalEventFlags（全局变量 + localStorage）
            if (nData.personalEventFlags) {
                global.personalEventFlags = nData.personalEventFlags;
                try { if (global.saveToStorage) global.saveToStorage('xianxia_personal_event_flags', JSON.stringify(nData.personalEventFlags)); else localStorage.setItem('xianxia_personal_event_flags', JSON.stringify(nData.personalEventFlags)); } catch (e) {}
            }
            // 恢复运行时内存变量
            global._eventCooldowns = nData.eventCooldowns || {};
            global._lastInteractDay = nData.lastInteractDay || {};
            global._negativeChoiceCount = nData.negativeChoiceCount || {};
            // 恢复NPC路线（写入 charData._npcRoutes）
            if (nData.npcRoutes) {
                if (!global.currentCharData) global.currentCharData = {};
                global.currentCharData._npcRoutes = nData.npcRoutes;
            }
            console.log('[GameState] 叙事系统状态已恢复');
        }

        // 重新 init 依赖 localStorage 的模块（若存在）
        [
            'initReputationSystem', 'initProfessionSystem', 'initLifespanSystem',
            'initLocationSystem', 'initTravelSystem', 'initWorldEvents',
            'initFactionSystem', 'initLandmarkExplore', 'loadPityData',
            'initChoiceMemory', 'initScenarioEngine', 'initSectJoinFlow',
            'initDailyEvents', 'initBeastTaming', 'initHouseSystem'
        ].forEach(function (fn) {
            if (typeof global[fn] === 'function') {
                try { global[fn](); } catch (e) {}
            }
        });

        // P1-11: 恢复社交冷却与每日次数
        try {
            var socRaw = localStorage.getItem('xianxia_social_cooldowns');
            if (socRaw && typeof window.importSocialCooldowns === 'function') {
                try { window.importSocialCooldowns(JSON.parse(socRaw)); } catch (e) {}
            } else if (socRaw && saveData.social && typeof window.importSocialCooldowns === 'function') {
                try { window.importSocialCooldowns(saveData.social); } catch (e) {}
            }
        } catch (e) {}

        // P2-10: 恢复NPC生死记录
        try {
            var npcRecRaw = localStorage.getItem('xianxia_npc_records');
            if (npcRecRaw) {
                try { window._npcRecords = JSON.parse(npcRecRaw); } catch(e) {}
            } else {
                window._npcRecords = { deceased: [], gone: [], protectionLevels: {} };
            }
        } catch (e) {}

        // P2-10: 恢复飞鸽传书数据
        // F-9 撤回：mail 由 StateRegistry 接管。保留 MailSystem.loadMailData 作为旧存档兼容路径
        try {
            if (window.StateRegistry && saveData.modules && saveData.modules.mail) {
                // StateRegistry.importAll 会处理
            } else if (window.MailSystem && typeof window.MailSystem.loadMailData === 'function') {
                window.MailSystem.loadMailData();
            } else {
                var mailRaw = localStorage.getItem('xianxia_mail_system');
                if (mailRaw) {
                    try { window._mailSystemData = JSON.parse(mailRaw); } catch(e) {}
                }
            }
        } catch (e) {}

        // 旁账回灌：SIDE_LEDGER_KEYS 上那几本都在 CHARACTER_STORAGE_KEYS 里，开头的 clearCharacterStorage() 刚抹过，
        // 这里把 collect 时随槽带回来的原文写回去。**写原文不 writeKey**：writeKey 会 JSON.stringify，
        // 而这几个键的值本身已经是 JSON 文本，再套一层就写出 "[[...]]" 这种双层串，读方当场解析失败。
        // ★这一段就是乙类键（外交/追踪/抉择/邮件/常用招式）唯一的回写通路：它们的 StateRegistry 模块
        //   import 只改内存，不写键（sect-visit.js:904 / quest-system.js:2250 / mail-system.js:597 等），
        //   少了这段，读档后键就留在「已删」状态，下一次刷新读方按默认值重建 ⇒ 玩家真账被覆盖。
        // 灌完顺手把三处内存态拉回磁盘（仅甲类需要，乙类模块的 import 自己管内存）：融合功法注册表要在
        // skillPages 里重建，嫉妒两本账各有闭包缓存（不清缓存的话，下一次写入会把上一局的旧条目原样写回键里）。
        //
        // ⚠️ 换档污染：读档前**先摘**功法表里的注册表条目（上面这一步之前必须做）。
        // 页面加载那一刻 rehydrateMergedSkills 就把当时 localStorage 里的 def 灌进了 skillPages，
        // 而 skillPages 不随存档往返（equipment.js:221 的 const 表、:660 挂上）——切档只换磁盘、
        // 换不掉这张内存表。上一批只把本档账灌了回去，没先把上一局的条目摘掉，
        // 结果两局的目录条目同时挂在功法册里：看着乱，canEquip 也过不去（def 不在新档的知识账里）。
        // 摘在写入之前还有个好处：万一 writeToStorage 这一步抛了，最坏结果是功法册空着（看得见的空），
        // 而不是留着上一局的目录条目冒充本档的。
        try {
            if (typeof global._purgeLedgerSkillDefsFromPages === 'function') global._purgeLedgerSkillDefsFromPages();
        } catch (eMsPurge) {
            console.warn('[GameState] 读档：功法表里的上一局条目摘不干净（可能有重名残留）', eMsPurge && eMsPurge.message);
        }
        if (saveData.sideLedgers && typeof saveData.sideLedgers === 'object') {
            // 只认单上点过名的键：档是浏览器本地数据，但读档路径不该有能力往任意键上写东西
            //（否则一个改过的档就能顺手把 xianxia_settings 之类账号级键覆写掉）。
            SIDE_LEDGER_KEYS.forEach(function (k) {
                if (saveData.sideLedgers[k] == null) return;
                try {
                    if (global.saveToStorage) global.saveToStorage(k, saveData.sideLedgers[k]);
                    else localStorage.setItem(k, saveData.sideLedgers[k]);
                } catch (eSide) {
                    console.warn('[GameState] 旁账回灌失败：' + k, eSide && eSide.message);
                }
            });
            try { if (typeof global.rehydrateMergedSkills === 'function') global.rehydrateMergedSkills(); }
            catch (eMs) { console.warn('[GameState] 融合功法回册失败：档里的自创功法名这次没能进功法册', eMs && eMs.message); }
            try { if (typeof global._asmLedgerReload === 'function') global._asmLedgerReload(); }
            catch (eAs) { console.warn('[GameState] 嫉妒余波账回灌内存失败：', eAs && eAs.message); }
            try { if (typeof global._collectiveLedgerReload === 'function') global._collectiveLedgerReload(); }
            catch (eCl) { console.warn('[GameState] 集体戏账回灌内存失败：', eCl && eCl.message); }
        }

        // v12.1：最后恢复模块自注册状态；这一步覆盖兼容 localStorage 的旧值。
        if (global.StateRegistry && typeof global.StateRegistry.importAll === 'function') {
            try { global.StateRegistry.importAll(saveData.modules || {}); }
            catch (e) { console.warn('[GameState] 模块状态恢复失败:', e); }
        }

        // 载入即定妆：盘上的「当前档」永远等于刚应用这一份。
        // （`xianxia_save` 现在已挂进开头 clearCharacterStorage 的 protectKeys，所以这一行是**覆盖**
        //  而不是「补救被删掉的键」；但保留它仍是对的——它同时管住「盘上的当前档 = 内存里这一局」这条
        //  不变量：换档、导出、自动档备份三条路都要靠它对齐。中途抛错时末尾这行走不到，
        //  留下的仍是开头那份完整原文，见下面的兜底。）
        if (!writeKey('xianxia_save', saveData) && prevSaveRaw) {
            // 存不下新档（多半是配额满）：至少别把上一份完整档也赔进去。
            // 走单源 saveToStorage（全库纪律：存档键不裸写，告警与去重都归它）。
            try {
                if (!global.saveToStorage) localStorage.setItem('xianxia_save', prevSaveRaw);
                else global.saveToStorage('xianxia_save', prevSaveRaw);
            } catch (ePrev) {
                console.warn('[GameState] xianxia_save 新旧两份都写不进盘（存储已满）——玩家此刻刷新将无法续档，'
                    + '建议清理旧存档', ePrev && ePrev.message);
            }
        }

        return true;
    }

    var GameState = {
        CHARACTER_STORAGE_KEYS: CHARACTER_STORAGE_KEYS,
        SIDE_LEDGER_KEYS: SIDE_LEDGER_KEYS,
        ACCOUNT_KEYS: ACCOUNT_KEYS,
        clearCharacterStorage: clearCharacterStorage,
        collectFullGameState: collectFullGameState,
        buildSaveMeta: buildSaveMeta,
        resetWorldForNewGame: resetWorldForNewGame,
        applyFullGameState: applyFullGameState,
        version: '3.1'
    };

    global.GameState = GameState;
    global.XianXia = global.XianXia || {};
    global.XianXia.GameState = GameState;
})(typeof window !== 'undefined' ? window : this);
