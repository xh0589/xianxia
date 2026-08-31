// ==================== cave-facilities.js - 洞府设施 + 同伴 (v19.16 §10) ====================
// 对标 v18.8 路线图 §10：8 设施 + 4 档洞府槽位 + 道侣/弟子入住。

(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    // ============== 1. 4 档洞府 → 槽位 ==============
    var CAVE_LEVELS = {
        'grass_hut':  { name: '草庐', tier: 1, slots: 1 },
        'stone_room': { name: '石室', tier: 2, slots: 2 },
        'spirit_manor':{ name: '灵府', tier: 3, slots: 3 },
        'immortal_manor':{ name: '仙府', tier: 4, slots: 4 }
    };

    // ============== 2. 8 设施 ==============
    var FACILITIES = {
        fac_spirit_gathering: { name: '聚灵阵', category: 'cultivation', buff: { expBoostPct: 30, qiRegen: 5 }, desc: '闭关效率 +30%，每日 +5 灵气' },
        fac_alchemy_room:     { name: '丹房',   category: 'craft',       buff: { alchemySkill: 15, qualityBoost: 1 }, desc: '炼丹技能 +15，品质 +1 段' },
        fac_forge_table:      { name: '炼器台', category: 'craft',       buff: { forgingSkill: 15, qualityBoost: 1 }, desc: '炼器技能 +15，品质 +1 段' },
        fac_beast_pen:        { name: '灵兽栏', category: 'beast',       buff: { beastTraining: 0.2 }, desc: '灵兽训练 +20%' },
        fac_library:          { name: '藏书阁', category: 'study',       buff: { studyTimeMul: 0.8 }, desc: '研究时间 -20%' },
        fac_guest_room:        { name: '客房',   category: 'social',      buff: { affectionDecay: -0.05, affectionDecayDays: 30 }, desc: '好感衰减暂停 30 天' },
        fac_spirit_field:      { name: '灵田',   category: 'agriculture', buff: { fieldSpeedPct: 30 }, desc: '灵田作物 +30%' },
        fac_meditation:       { name: '闭关室', category: 'cultivation', buff: { breakthroughBoost: 0.15 }, desc: '突破率 +15%' }
    };

    // ============== 3. 同伴角色 ==============
    var COMPANION_ROLES = {
        dao_companion: { name: '道侣', allowedSlots: ['fac_spirit_field', 'fac_alchemy_room', 'fac_guest_room'] },
        disciple:      { name: '弟子', allowedSlots: ['fac_library', 'fac_beast_pen', 'fac_meditation'] },
        special_npc:   { name: '重要 NPC', allowedSlots: ['fac_alchemy_room', 'fac_forge_table', 'fac_library'] }
    };

    // ============== 4. 小事件 ==============
    var DAILY_EVENTS = [
        { id: 'companion_found_herb',  text: '道侣在灵田发现灵药', prob: 0.10, applies: 'fac_spirit_field', reward: { materials: 1 } },
        { id: 'disciple_insight',      text: '弟子在藏书阁有感悟', prob: 0.10, applies: 'fac_library', reward: { expBoost: 0.10, days: 1 } },
        { id: 'npc_visit',              text: '重要 NPC 来访，谈话', prob: 0.05, applies: ['fac_alchemy_room','fac_forge_table'], reward: { rumor: 1, npcRelation: 10 } },
        { id: 'meditation_surge',       text: '闭关室灵气波动', prob: 0.08, applies: 'fac_meditation', reward: { breakthroughBoost: 0.05, days: 1 } },
        { id: 'gather_spirit',          text: '聚灵阵吸收游离灵气', prob: 0.08, applies: 'fac_spirit_gathering', reward: { qiRegen: 2 } },
        { id: 'guest_thanks',           text: '客房访客道谢', prob: 0.06, applies: 'fac_guest_room', reward: { npcRelation: 5 } },
        { id: 'beast_growth',           text: '灵兽栏灵兽成长', prob: 0.07, applies: 'fac_beast_pen', reward: { beastTraining: 0.1 } }
    ];

    // ============== 5. 模块级状态 ==============
    var _state = {
        caves: {},                 // {caveId: {level, facilities:[{slot,facilityId,installedDay}], companions:[], history:[]}}
        _nextCompanionId: 1
    };

    function _today() { return (window.WorldCalendar && window.WorldCalendar.day) || 0; }

    function _emit(name, payload) {
        if (window.EventBus && typeof window.EventBus.emit === 'function') {
            window.EventBus.emit(name, payload);
        }
    }

    // ============== 6. 公开 API ==============

    function ensureCave(caveId, level) {
        if (!_state.caves[caveId]) {
            _state.caves[caveId] = { level: level || 'grass_hut', facilities: [], companions: [], history: [] };
        } else if (level && _state.caves[caveId].level !== level) {
            _state.caves[caveId].level = level;
        }
        return _state.caves[caveId];
    }

    function getAvailableSlots(caveId) {
        var cave = _state.caves[caveId];
        if (!cave) return 0;
        var level = CAVE_LEVELS[cave.level];
        if (!level) return 0;
        return level.slots;
    }

    function install(caveId, facilityId, slot) {
        var cave = ensureCave(caveId);
        if (!FACILITIES[facilityId]) return { ok: false, reason: 'unknown-facility' };
        var maxSlots = getAvailableSlots(caveId);
        if (slot === undefined || slot === null) {
            // 自动找空位
            var used = cave.facilities.map(function (f) { return f.slot; });
            for (var s = 0; s < maxSlots; s++) {
                if (used.indexOf(s) < 0) { slot = s; break; }
            }
            if (slot === undefined || slot === null) return { ok: false, reason: 'no-available-slot' };
        }
        if (slot < 0 || slot >= maxSlots) return { ok: false, reason: 'slot-out-of-range' };
        if (cave.facilities.find(function (f) { return f.slot === slot; })) return { ok: false, reason: 'slot-busy' };
        cave.facilities.push({ slot: slot, facilityId: facilityId, installedDay: _today() });
        if (window.EventBus) window.EventBus.emit('cave:facilityInstalled', { caveId: caveId, slot: slot, facilityId: facilityId });
        return { ok: true, slot: slot, facilityId: facilityId, buff: FACILITIES[facilityId].buff };
    }

    function uninstall(caveId, slot) {
        var cave = _state.caves[caveId];
        if (!cave) return { ok: false, reason: 'cave-not-found' };
        var idx = cave.facilities.findIndex(function (f) { return f.slot === slot; });
        if (idx < 0) return { ok: false, reason: 'no-facility-in-slot' };
        var removed = cave.facilities.splice(idx, 1)[0];
        return { ok: true, removed: removed };
    }

    function getFacilities(caveId) {
        var cave = _state.caves[caveId];
        if (!cave) return [];
        return cave.facilities.map(function (f) {
            return Object.assign({}, f, { name: FACILITIES[f.facilityId] && FACILITIES[f.facilityId].name, buff: FACILITIES[f.facilityId] && FACILITIES[f.facilityId].buff });
        });
    }

    function addCompanion(caveId, npcId, role) {
        var cave = ensureCave(caveId);
        if (!npcId) return { ok: false, reason: 'no-npcId' };
        if (!COMPANION_ROLES[role]) return { ok: false, reason: 'unknown-role' };
        var companionId = 'comp_' + (_state._nextCompanionId++);
        var comp = { companionId: companionId, npcId: npcId, role: role, slot: null, joinedDay: _today() };
        cave.companions.push(comp);
        if (window.EventBus) window.EventBus.emit('cave:companionAdded', { caveId: caveId, companion: comp });
        return { ok: true, companionId: companionId, companion: comp };
    }

    function removeCompanion(caveId, companionId) {
        var cave = _state.caves[caveId];
        if (!cave) return false;
        var idx = cave.companions.findIndex(function (c) { return c.companionId === companionId; });
        if (idx < 0) return false;
        cave.companions.splice(idx, 1);
        return true;
    }

    function assignCompanionToFacility(caveId, companionId, slot) {
        var cave = _state.caves[caveId];
        if (!cave) return { ok: false, reason: 'cave-not-found' };
        var comp = cave.companions.find(function (c) { return c.companionId === companionId; });
        if (!comp) return { ok: false, reason: 'companion-not-found' };
        var fac = cave.facilities.find(function (f) { return f.slot === slot; });
        if (!fac) return { ok: false, reason: 'no-facility-in-slot' };
        var role = COMPANION_ROLES[comp.role];
        if (!role || role.allowedSlots.indexOf(fac.facilityId) < 0) {
            return { ok: false, reason: 'role-facility-mismatch', role: comp.role, facility: fac.facilityId };
        }
        comp.slot = slot;
        return { ok: true, slot: slot, facilityId: fac.facilityId };
    }

    function tickDay(caveId) {
        var cave = ensureCave(caveId);
        var events = [];
        for (var i = 0; i < DAILY_EVENTS.length; i++) {
            var e = DAILY_EVENTS[i];
            // 检查该设施是否在 cave 安装
            var appliesArr = Array.isArray(e.applies) ? e.applies : [e.applies];
            var hasFacility = appliesArr.some(function (fid) {
                return cave.facilities.find(function (f) { return f.facilityId === fid; });
            });
            if (!hasFacility) continue;
            // 检查同伴（必须分配到该设施）
            var hasCompanion = cave.companions.some(function (c) { return c.slot !== null && appliesArr.indexOf(cave.facilities.find(function (f) { return f.slot === c.slot; }).facilityId) >= 0; });
            if (!hasCompanion) continue;
            if (Math.random() < e.prob) {
                events.push({ id: e.id, text: e.text, reward: e.reward, day: _today() });
                if (cave.history.length < 20) {
                    cave.history.unshift({ day: _today(), eventId: e.id, text: e.text });
                }
                if (window.EventBus) window.EventBus.emit('cave:dailyEvent', { caveId: caveId, event: events[events.length - 1] });
            }
        }
        return { ok: true, events: events, day: _today() };
    }

    function getBuff(caveId, attrKey) {
        var cave = _state.caves[caveId];
        if (!cave) return 0;
        var total = 0;
        for (var i = 0; i < cave.facilities.length; i++) {
            var fac = FACILITIES[cave.facilities[i].facilityId];
            if (!fac || !fac.buff) continue;
            if (fac.buff[attrKey] !== undefined) {
                total += fac.buff[attrKey];
            }
        }
        return total;
    }

    function getBuffList(caveId) {
        var cave = _state.caves[caveId];
        if (!cave) return [];
        var out = [];
        for (var i = 0; i < cave.facilities.length; i++) {
            var fac = FACILITIES[cave.facilities[i].facilityId];
            if (!fac) continue;
            out.push({ slot: cave.facilities[i].slot, facilityId: cave.facilities[i].facilityId, name: fac.name, buff: fac.buff });
        }
        return out;
    }

    function listFacilityTypes() {
        return Object.keys(FACILITIES).map(function (k) { return Object.assign({ id: k }, FACILITIES[k]); });
    }

    function listCaveLevels() {
        return Object.keys(CAVE_LEVELS).map(function (k) { return Object.assign({ id: k }, CAVE_LEVELS[k]); });
    }

    // ============== 7. StateRegistry ==============
    function _exportState() { return JSON.parse(JSON.stringify(_state)); }
    function _importState(s) {
        if (!s) return;
        if (s.caves) _state.caves = s.caves;
        if (typeof s._nextCompanionId === 'number') _state._nextCompanionId = s._nextCompanionId;
    }
    function _resetState() { _state.caves = {}; _state._nextCompanionId = 1; }

    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        try {
            window.StateRegistry.register('caveSystem', { version: 1, export: _exportState, import: _importState, reset: _resetState });
        } catch (e) {}
    }

    // ============== 8. 导出 ==============
    window.CaveFacilities = {
        CAVE_LEVELS: CAVE_LEVELS,
        FACILITIES: FACILITIES,
        COMPANION_ROLES: COMPANION_ROLES,
        DAILY_EVENTS: DAILY_EVENTS,
        install: install,
        uninstall: uninstall,
        getFacilities: getFacilities,
        getAvailableSlots: getAvailableSlots,
        addCompanion: addCompanion,
        removeCompanion: removeCompanion,
        assignCompanionToFacility: assignCompanionToFacility,
        tickDay: tickDay,
        getBuff: getBuff,
        getBuffList: getBuffList,
        listFacilityTypes: listFacilityTypes,
        listCaveLevels: listCaveLevels,
        getState: function () { return _state; }
    };
    if (window.XianXia) window.XianXia.CaveFacilities = window.CaveFacilities;
    try { console.log('[CaveFacilities] initialized v1 (' + Object.keys(FACILITIES).length + ' facilities, ' + Object.keys(CAVE_LEVELS).length + ' cave levels, ' + Object.keys(COMPANION_ROLES).length + ' companion roles, ' + DAILY_EVENTS.length + ' daily events)'); } catch (e) {}
})();
