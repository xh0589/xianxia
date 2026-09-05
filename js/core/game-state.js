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
    //           同时 xianxia_sect_diplomacy/xianxia_tracked_quests 在清单但 collect/apply 不收，读档丢失
    var CHARACTER_STORAGE_KEYS = [
        'xianxia_arena_ranking',
        'xianxia_beasts',
        'xianxia_choices',
        'xianxia_city_temp',
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
        'xianxia_npc_records',
        'xianxia_party_data',
        'xianxia_personal_event_flags',
        'xianxia_professions',
        'xianxia_proficiency',
        'xianxia_quest_progress',
        'xianxia_quick_moves',
        'xianxia_reputation',
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

    function clearCharacterStorage(options) {
        options = options || {};
        var alsoAccount = !!options.alsoAccount;
        CHARACTER_STORAGE_KEYS.forEach(function (k) {
            try { localStorage.removeItem(k); } catch (e) {}
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

        // 门派
        if (global.discipleState) {
            saveData.discipleState = JSON.parse(JSON.stringify(global.discipleState));
        } else {
            saveData.discipleState = { sectName: null, position: '散修', contribution: 0 };
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
        if (global.proficiencyData) {
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
            order: fullState.order
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
                Object.assign(global.discipleState, {
                    sectName: null,
                    position: '散修',
                    contribution: 0,
                    rank: null
                });
            } catch (e) {
                global.discipleState = { sectName: null, position: '散修', contribution: 0 };
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
        clearCharacterStorage({ alsoAccount: false });

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
            maxHealth: n(saveData.maxHealth, 100),
            maxQi: n(saveData.maxQi, 100),
            maxEnergy: n(saveData.maxEnergy, 100),
        };

        if (typeof global.setCurrentCharData === 'function') {
            global.setCurrentCharData(loadedChar);
        } else {
            global.currentCharData = loadedChar;
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

        // 知识层
        if (global.KnowledgeSystem) {
            if (saveData.techniqueKnowledge) {
                global.KnowledgeSystem.importData(saveData.techniqueKnowledge);
            } else if (saveData.learnedSecrets && saveData.learnedSecrets.length) {
                global.KnowledgeSystem.migrateFromLearnedSecrets(saveData.learnedSecrets);
            } else {
                global.KnowledgeSystem.initStarterKnowledge();
            }
            global.learnedSecrets = global.KnowledgeSystem.syncLearnedSecretsList();
        } else if (saveData.learnedSecrets) {
            global.learnedSecrets = saveData.learnedSecrets;
        }

        if (global.currentSkills && global.KnowledgeSystem) {
            Object.keys(global.currentSkills).forEach(function (slot) {
                var sk = global.currentSkills[slot];
                if (sk && sk.id && !global.KnowledgeSystem.canEquip(sk.id)) {
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
            if (val == null) {
                try { localStorage.removeItem(key); } catch (e) {}
                return;
            }
            try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
        }

        writeKey('xianxia_reputation', saveData.reputation);
        writeKey('xianxia_lifespan', saveData.lifespan);
        writeKey('xianxia_location_data', saveData.locationData);
        writeKey('xianxia_travel_data', saveData.travelData);
        writeKey('xianxia_world_events', saveData.worldEvents);
        writeKey('xianxia_city_temp', saveData.cityTemp);
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
                try { localStorage.setItem('xianxia_personal_event_flags', JSON.stringify(nData.personalEventFlags)); } catch (e) {}
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

        // v12.1：最后恢复模块自注册状态；这一步覆盖兼容 localStorage 的旧值。
        if (global.StateRegistry && typeof global.StateRegistry.importAll === 'function') {
            try { global.StateRegistry.importAll(saveData.modules || {}); }
            catch (e) { console.warn('[GameState] 模块状态恢复失败:', e); }
        }

        return true;
    }

    var GameState = {
        CHARACTER_STORAGE_KEYS: CHARACTER_STORAGE_KEYS,
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
