// ==================== reincarnation.js - 轮回/二周目 继承 (v19.13 §8) ====================
// 对标 v18.8 路线图 §8：6 类前世遗产点 + 5 类继承选择 + 世界连续性（前世传说留存）。

(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    // ============== 1. 6 类遗产点 ==============
    var REALM_POINTS = {
        '练气': 1, '筑基': 3, '金丹': 8, '元婴': 20, '化神': 50, '渡劫': 120, '大乘': 300
    };

    var SECT_POSITION_POINTS = {
        '掌门': 80, '长老': 40, '堂主': 20, '弟子': 5
    };

    var DEATH_REASON_POINTS = {
        'death-natural': 30,    // 寿终
        'death-combat': 0,     // 战死
        'ascend': 50,          // 飞升
        'voluntary': 15        // 主动转世
    };

    // 5 类继承选项成本
    var INHERIT_OPTIONS = {
        memory:  { cost: 80,  name: '前世记忆', desc: '保留 1 个功法 50% 熟练度', apply: function (cd, choice) { cd.lifeSkills = cd.lifeSkills || {}; cd.lifeSkills[choice.skill] = (choice.currentLevel || 50) * 0.5; return ['lifeSkills.' + choice.skill + '=50%']; } },
        weapon:  { cost: 120, name: '本命法器', desc: '1 件传说品质法器作为开局', apply: function (cd) { return ['legendary-weapon']; } },
        bond:    { cost: 60,  name: '旧友缘分', desc: '1 个 NPC 起始好感+30', apply: function (cd, choice) { return ['friend:' + (choice.npcId || 'unknown') + '+30']; } },
        fortune: { cost: 100, name: '先天气运', desc: '1 个特殊气运', apply: function (cd, choice) { return ['fortune:' + (choice.fortuneId || 'unknown')]; } },
        cave:    { cost: 150, name: '前世洞府', desc: '1 个洞府位置解锁+部分资源', apply: function (cd, choice) { return ['cave:' + (choice.caveId || 'unknown')]; } }
    };

    // 10 种 deeds
    var VALID_DEEDS = [
        'founded-sect', 'mastered-pill', 'mastered-weapon',
        'conquered-dungeon', 'won-tournament', 'married',
        'had-children', 'saved-sect', 'discovered', 'achieved-breakthrough'
    ];

    // ============== 2. 模块级状态 ==============
    var _state = {
        inheritancePool: 0,            // 当前/最近一次前世遗产点
        lastBreakdown: {},              // 详细拆分
        legacyRecords: [],              // 历史前世记录（最多 10）
        nextLifeInheritance: {          // 待应用到下一世
            granted: [],                 // [{type, applied, cost}]
            reserved: null               // 预留：可锁定到具体 nextLifeData
        }
    };

    // ============== 3. 工具 ==============
    function getMaxRealmPoints(realm) {
        if (!realm) return 0;
        return REALM_POINTS[realm] || 0;
    }

    function getSectPositionPoints(position) {
        if (!position) return 0;
        return SECT_POSITION_POINTS[position] || 0;
    }

    function getDeathReasonPoints(reason) {
        if (!reason) return 0;
        return DEATH_REASON_POINTS[reason] || 0;
    }

    // ============== 4. 公开 API ==============
    function computeInheritancePoints(playerData) {
        if (!playerData) return { total: 0, breakdown: {} };
        var breakdown = {};

        // 1. 境界
        var realm = playerData.realm || playerData.maxRealm || '练气';
        breakdown.realm = { realm: realm, points: getMaxRealmPoints(realm) };

        // 2. 重要关系：count of NPCs with affection >= 80
        var relationships = playerData.relationships || playerData.friends || [];
        var highAffCount = 0;
        if (Array.isArray(relationships)) {
            for (var i = 0; i < relationships.length; i++) {
                if (relationships[i] && (relationships[i].affection || 0) >= 80) highAffCount++;
            }
        } else if (typeof relationships === 'object') {
            Object.keys(relationships).forEach(function (k) {
                if ((relationships[k] && relationships[k].affection) || 0 >= 80) highAffCount++;
            });
        }
        breakdown.relationship = { count: highAffCount, points: Math.min(50, highAffCount * 5) };

        // 3. 宗门职位
        var sectPos = playerData.sectPosition || playerData.sectRole;
        breakdown.sectPosition = { position: sectPos || '弟子', points: getSectPositionPoints(sectPos) };

        // 4. 大事件选择
        var keyEvents = playerData.keyEvents || playerData.worldFlags || [];
        var keyEventCount = Array.isArray(keyEvents) ? keyEvents.length : 0;
        breakdown.keyEvents = { count: keyEventCount, points: keyEventCount * 3 };

        // 5. 炼丹/炼器成就
        var craftAch = playerData.craftAchievements || {};
        var pillAch = craftAch.pills || 0;       // 炼制 100+ 品质丹药
        var weaponAch = craftAch.weapons || 0;    // 10+ 极品法器
        var pillBonus = pillAch >= 100 ? 15 : 0;
        var weaponBonus = weaponAch >= 10 ? 20 : 0;
        breakdown.craft = { pills: pillAch, weapons: weaponAch, points: pillBonus + weaponBonus };

        // 6. 寿终正寝（由 startReincarnation 决定 reason 调整）
        var reason = playerData.lastDeathReason || 'death-natural';
        breakdown.deathReason = { reason: reason, points: getDeathReasonPoints(reason) };

        // 累加
        var total = 0;
        Object.keys(breakdown).forEach(function (k) { total += breakdown[k].points || 0; });
        return { total: total, breakdown: breakdown };
    }

    function canReincarnate(playerData) {
        // 任何角色都能转世
        if (!playerData) return false;
        return !!playerData.realm || !!playerData.maxRealm;
    }

    function startReincarnation(playerData, reason) {
        reason = reason || 'death-natural';
        if (!canReincarnate(playerData)) return { ok: false, reason: 'cannot-reincarnate' };
        var pdata = Object.assign({}, playerData, { lastDeathReason: reason });
        var computed = computeInheritancePoints(pdata);
        _state.inheritancePool = computed.total;
        _state.lastBreakdown = computed.breakdown;
        if (window.EventBus) window.EventBus.emit('reincarnation:start', { reason: reason, total: computed.total, breakdown: computed.breakdown });
        return { ok: true, reason: reason, legacyPoints: computed.total, summary: computed.breakdown };
    }

    function listInheritOptions() {
        return Object.keys(INHERIT_OPTIONS).map(function (k) {
            var o = INHERIT_OPTIONS[k];
            return { type: k, name: o.name, desc: o.desc, cost: o.cost };
        });
    }

    function grantInheritance(nextLifeData, choice) {
        if (!nextLifeData) return { ok: false, reason: 'no-nextLife' };
        if (!choice || !choice.type) return { ok: false, reason: 'no-choice' };
        var opt = INHERIT_OPTIONS[choice.type];
        if (!opt) return { ok: false, reason: 'unknown-type' };
        if (_state.inheritancePool < opt.cost) return { ok: false, reason: 'insufficient-points', need: opt.cost, have: _state.inheritancePool };
        var applied = opt.apply(nextLifeData, choice || {});
        _state.inheritancePool -= opt.cost;
        _state.nextLifeInheritance.granted.push({ type: choice.type, name: opt.name, applied: applied, cost: opt.cost });
        if (window.EventBus) window.EventBus.emit('reincarnation:inherit', { type: choice.type, name: opt.name, applied: applied, cost: opt.cost });
        return { ok: true, type: choice.type, name: opt.name, applied: applied, cost: opt.cost, remaining: _state.inheritancePool };
    }

    // ============== 5. 世界连续性 ==============
    function addLegacyRecord(record) {
        if (!record) return false;
        // 校验 deeds
        var deeds = (record.deeds || []).filter(function (d) { return VALID_DEEDS.indexOf(d) >= 0; });
        var entry = {
            playerName: record.playerName || '无名修士',
            finalRealm: record.finalRealm || '练气',
            lifeSpan: record.lifeSpan || 0,
            deeds: deeds,
            worldDay: record.worldDay || 0,
            recordDay: (window.WorldCalendar && window.WorldCalendar.day) || 0
        };
        _state.legacyRecords.unshift(entry);
        if (_state.legacyRecords.length > 10) _state.legacyRecords.pop();
        if (window.EventBus) window.EventBus.emit('reincarnation:legacy', { record: entry });
        return true;
    }

    function getLegacyRecords() { return _state.legacyRecords.slice(); }

    function preserveWorldMemory(playerData) {
        if (!playerData) return { ok: false, reason: 'no-data' };
        // 收集 deeds
        var deeds = [];
        if (playerData.sectFounded) deeds.push('founded-sect');
        if ((playerData.craftAchievements && playerData.craftAchievements.pills || 0) >= 100) deeds.push('mastered-pill');
        if ((playerData.craftAchievements && playerData.craftAchievements.weapons || 0) >= 10) deeds.push('mastered-weapon');
        if ((playerData.dungeonsCleared || []).length > 0) deeds.push('conquered-dungeon');
        if (playerData.tournamentChamp) deeds.push('won-tournament');
        if (playerData.daoCompanionId) deeds.push('married');
        if ((playerData.childrenIds || []).length > 0) deeds.push('had-children');
        if (playerData.savedSect) deeds.push('saved-sect');
        if (playerData.discoveredSecret) deeds.push('discovered');
        if (playerData.brokeThroughMajor) deeds.push('achieved-breakthrough');
        var record = {
            playerName: playerData.name || '无名修士',
            finalRealm: playerData.realm || playerData.maxRealm || '练气',
            lifeSpan: playerData.lifeSpan || playerData.age || 0,
            deeds: deeds,
            worldDay: (window.WorldCalendar && window.WorldCalendar.day) || 0
        };
        addLegacyRecord(record);
        return { ok: true, legacyRecords: _state.legacyRecords.slice() };
    }

    // ============== 6. StateRegistry ==============
    function _exportState() { return JSON.parse(JSON.stringify(_state)); }
    function _importState(s) {
        if (!s) return;
        if (typeof s.inheritancePool === 'number') _state.inheritancePool = s.inheritancePool;
        if (s.lastBreakdown) _state.lastBreakdown = s.lastBreakdown;
        if (Array.isArray(s.legacyRecords)) _state.legacyRecords = s.legacyRecords.slice(0, 10);
        if (s.nextLifeInheritance) _state.nextLifeInheritance = s.nextLifeInheritance;
    }
    function _resetState() {
        _state.inheritancePool = 0;
        _state.lastBreakdown = {};
        _state.legacyRecords = [];
        _state.nextLifeInheritance = { granted: [], reserved: null };
    }

    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        try {
            window.StateRegistry.register('reincarnationConfig', { version: 1, export: _exportState, import: _importState, reset: _resetState });
        } catch (e) {}
    }

    // ============== 7. 导出 ==============
    window.Reincarnation = {
        REALM_POINTS: REALM_POINTS,
        SECT_POSITION_POINTS: SECT_POSITION_POINTS,
        DEATH_REASON_POINTS: DEATH_REASON_POINTS,
        INHERIT_OPTIONS: INHERIT_OPTIONS,
        VALID_DEEDS: VALID_DEEDS,
        computeInheritancePoints: computeInheritancePoints,
        canReincarnate: canReincarnate,
        startReincarnation: startReincarnation,
        grantInheritance: grantInheritance,
        listInheritOptions: listInheritOptions,
        addLegacyRecord: addLegacyRecord,
        getLegacyRecords: getLegacyRecords,
        preserveWorldMemory: preserveWorldMemory,
        getState: function () { return _state; }
    };
    if (window.XianXia) window.XianXia.Reincarnation = window.Reincarnation;
    try { console.log('[Reincarnation] initialized v1 (' + Object.keys(REALM_POINTS).length + ' realms, ' + Object.keys(INHERIT_OPTIONS).length + ' inherit options, ' + VALID_DEEDS.length + ' deeds)'); } catch (e) {}
})();
