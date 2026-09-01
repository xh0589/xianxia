// ==================== narrative-consequence.js - 事件后果接口 (v19.15 §9) ====================
// 对标 v18.8 路线图 §9：7 类长期状态接口 + 延迟反馈调度器。

(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    // ============== 1. 模块级状态 ==============
    var _state = {
        consequences: [],          // 最近 50 条已应用
        scheduled: [],             // [{scheduledId, consequence, fireDay, applied, createdDay}]
        worldFlags: {},             // {flagName: value}
        rumors: [],                 // [{id, text, day, radius}]
        npcRelations: {},           // {npcId: [{delta, day, source}]}
        sectRelations: {},          // {sectId: [{delta, day, source}]}
        cityStates: {},             // {cityId: [{state, day, source}]}
        futureWeights: {},          // {eventId: delta}
        _nextScheduledId: 1
    };

    var MAX_CONSEQUENCES = 50;
    var MAX_RUMORS = 30;

    function _today() { return (window.WorldCalendar && window.WorldCalendar.day) || 0; }

    function _emit(name, payload) {
        if (window.EventBus && typeof window.EventBus.emit === 'function') {
            window.EventBus.emit(name, payload);
        }
    }

    function _pushConsequenceRecord(rec) {
        _state.consequences.unshift(rec);
        if (_state.consequences.length > MAX_CONSEQUENCES) _state.consequences.pop();
    }

    // ============== 2. 7 类 setter ==============

    function _applyNpcRelation(c) {
        if (!c.npcId) return { ok: false, reason: 'no-npcId' };
        var arr = _state.npcRelations[c.npcId] = _state.npcRelations[c.npcId] || [];
        arr.push({ delta: c.delta || 0, day: c.day || _today(), source: c.source || 'event' });
        return { ok: true, type: 'npcRelation', npcId: c.npcId, delta: c.delta };
    }

    function _applySectRelation(c) {
        if (!c.sectId) return { ok: false, reason: 'no-sectId' };
        var arr = _state.sectRelations[c.sectId] = _state.sectRelations[c.sectId] || [];
        arr.push({ delta: c.delta || 0, day: c.day || _today(), source: c.source || 'event' });
        return { ok: true, type: 'sectRelation', sectId: c.sectId, delta: c.delta };
    }

    function _applyCityState(c) {
        if (!c.cityId) return { ok: false, reason: 'no-cityId' };
        var arr = _state.cityStates[c.cityId] = _state.cityStates[c.cityId] || [];
        arr.push({ state: c.state || 'unknown', day: c.day || _today(), source: c.source || 'event' });
        return { ok: true, type: 'cityState', cityId: c.cityId, state: c.state };
    }

    function _applyResourceNode(c) {
        if (!c.nodeId) return { ok: false, reason: 'no-nodeId' };
        // 调用 v19.10 ResourcePoints API（如已加载）
        if (window.ResourcePoints && typeof window.ResourcePoints.getPoint === 'function') {
            var p = window.ResourcePoints.getPoint(c.nodeId);
            if (p && typeof p.exhausted === 'number') {
                p.exhausted = Math.max(0, Math.min(p.maxExhausted || 1, p.exhausted + (c.delta || 0)));
                return { ok: true, type: 'resourceNode', nodeId: c.nodeId, newExhausted: p.exhausted };
            }
        }
        // 没有 ResourcePoints：仅记录
        return { ok: true, type: 'resourceNode', nodeId: c.nodeId, delta: c.delta, _note: 'no-resourcepoints-loaded' };
    }

    function _applyWorldFlag(c) {
        if (!c.flag) return { ok: false, reason: 'no-flag' };
        _state.worldFlags[c.flag] = c.value !== undefined ? c.value : true;
        return { ok: true, type: 'worldFlag', flag: c.flag, value: _state.worldFlags[c.flag] };
    }

    function _applyRumor(c) {
        if (!c.text) return { ok: false, reason: 'no-text' };
        var entry = {
            id: c.id || ('rumor_' + _today() + '_' + (_state.rumors.length || 0)),
            text: c.text,
            day: c.day || _today(),
            radius: c.radius || 'region'  // 'region' / 'sect' / 'world'
        };
        _state.rumors.unshift(entry);
        if (_state.rumors.length > MAX_RUMORS) _state.rumors.pop();
        return { ok: true, type: 'rumor', id: entry.id, text: entry.text };
    }

    function _applyFutureEventWeight(c) {
        if (!c.eventId) return { ok: false, reason: 'no-eventId' };
        _state.futureWeights[c.eventId] = (_state.futureWeights[c.eventId] || 0) + (c.delta || 0);
        return { ok: true, type: 'futureEventWeight', eventId: c.eventId, delta: c.delta, total: _state.futureWeights[c.eventId] };
    }

    var APPLIERS = {
        npcRelation: _applyNpcRelation,
        sectRelation: _applySectRelation,
        cityState: _applyCityState,
        resourceNode: _applyResourceNode,
        worldFlag: _applyWorldFlag,
        rumor: _applyRumor,
        futureEventWeight: _applyFutureEventWeight
    };

    // ============== 3. 公开 API ==============

    function applyConsequence(c) {
        if (!c || !c.type) return { ok: false, reason: 'no-type' };
        var applier = APPLIERS[c.type];
        if (!applier) return { ok: false, reason: 'unknown-type', type: c.type };
        c.day = c.day || _today();
        var result = applier(c);
        if (result.ok) {
            _pushConsequenceRecord({ type: c.type, payload: c, day: c.day, result: result });
            _emit('narrative:consequenceApplied', { consequence: c, result: result });
        }
        return result;
    }

    function applyConsequences(list) {
        if (!Array.isArray(list)) return { ok: false, reason: 'no-list' };
        var results = [];
        for (var i = 0; i < list.length; i++) {
            var r = applyConsequence(list[i]);
            results.push(r);
        }
        return { ok: true, applied: results };
    }

    function scheduleDelayed(consequence, fireDay) {
        if (!consequence) return { ok: false, reason: 'no-consequence' };
        if (typeof fireDay !== 'number') return { ok: false, reason: 'no-fireDay' };
        var entry = {
            scheduledId: 'sch_' + (_state._nextScheduledId++),
            consequence: consequence,
            fireDay: fireDay,
            applied: false,
            createdDay: _today()
        };
        _state.scheduled.push(entry);
        return { ok: true, scheduledId: entry.scheduledId, fireDay: fireDay };
    }

    function processDay(currentDay) {
        currentDay = currentDay || _today();
        var fired = [];
        for (var i = _state.scheduled.length - 1; i >= 0; i--) {
            var s = _state.scheduled[i];
            if (s.applied) continue;
            if (s.fireDay <= currentDay) {
                var r = applyConsequence(s.consequence);
                s.applied = true;
                s.appliedDay = currentDay;
                fired.push({ scheduledId: s.scheduledId, result: r });
            }
        }
        return { ok: true, fired: fired, day: currentDay };
    }

    function cancelScheduled(scheduledId) {
        for (var i = 0; i < _state.scheduled.length; i++) {
            if (_state.scheduled[i].scheduledId === scheduledId) {
                _state.scheduled.splice(i, 1);
                return true;
            }
        }
        return false;
    }

    function getFlag(flagName) {
        return _state.worldFlags[flagName];
    }

    function getRumor(rumorId) {
        for (var i = 0; i < _state.rumors.length; i++) {
            if (_state.rumors[i].id === rumorId) return _state.rumors[i];
        }
        return null;
    }

    function listNpcRelations(npcId) {
        return (_state.npcRelations[npcId] || []).slice();
    }

    // ============== 4. 示例 hook（路线图 §9 末段） ==============

    function exampleSaveScatteredCultivator(player) {
        player = player || { name: '玩家' };
        var today = _today();
        // 立即：NPC 关系 +50，世界标记，传闻，未来权重
        applyConsequences([
            { type: 'npcRelation', npcId: 'scattered_cultivator_' + today, delta: 50, source: 'save_event' },
            { type: 'worldFlag', flag: 'saved_scattered_cultivator', value: player.name + '_' + today },
            { type: 'rumor', text: player.name + '于' + today + '日救下被追杀的散修', radius: 'region' },
            { type: 'futureEventWeight', eventId: 'cultivator_joins_sect', delta: 30 }
        ]);
        // 延迟：5 年后该散修拜入某宗
        scheduleDelayed({ type: 'npcRelation', npcId: 'scattered_cultivator_' + today, delta: 30, source: 'joined_sect_callback' }, today + 365 * 5);
        // 延迟：10 年后"故人相逢"
        scheduleDelayed({ type: 'rumor', text: '某散修已拜入' + (player.sectName || '某宗') + '，为十年前恩人立传', radius: 'world' }, today + 365 * 10);
        return { ok: true, immediate: 4, scheduled: 2 };
    }

    function exampleSpareKingOffspring(player) {
        player = player || { name: '玩家' };
        var today = _today();
        // 立即：世界标记 + 传闻
        applyConsequences([
            { type: 'worldFlag', flag: 'spared_king_offspring', value: player.name + '_' + today },
            { type: 'rumor', text: player.name + '于' + today + '日放过妖王幼崽', radius: 'region' },
            { type: 'futureEventWeight', eventId: 'demon_king_awakened', delta: 20 }
        ]);
        // 延迟：3~5 年后妖王觉醒为 Boss
        scheduleDelayed({ type: 'worldFlag', flag: 'demon_king_awakened', value: 'awakened' }, today + 365 * 3);
        scheduleDelayed({ type: 'futureEventWeight', eventId: 'demon_invasion', delta: 25 }, today + 365 * 3);
        // 延迟：0~5 年后遇险偿还
        var randomDelay = Math.floor(Math.random() * 365 * 5);
        scheduleDelayed({ type: 'futureEventWeight', eventId: 'demon_rescue', delta: 25 }, today + randomDelay);
        return { ok: true, immediate: 3, scheduled: 3 };
    }

    // ============== 5. StateRegistry ==============
    function _exportState() { return JSON.parse(JSON.stringify(_state)); }
    function _importState(s) {
        if (!s) return;
        if (Array.isArray(s.consequences)) _state.consequences = s.consequences.slice(0, MAX_CONSEQUENCES);
        if (Array.isArray(s.scheduled)) _state.scheduled = s.scheduled;
        if (s.worldFlags) _state.worldFlags = s.worldFlags;
        if (Array.isArray(s.rumors)) _state.rumors = s.rumors.slice(0, MAX_RUMORS);
        if (s.npcRelations) _state.npcRelations = s.npcRelations;
        if (s.sectRelations) _state.sectRelations = s.sectRelations;
        if (s.cityStates) _state.cityStates = s.cityStates;
        if (s.futureWeights) _state.futureWeights = s.futureWeights;
        if (typeof s._nextScheduledId === 'number') _state._nextScheduledId = s._nextScheduledId;
    }
    function _resetState() {
        _state.consequences = [];
        _state.scheduled = [];
        _state.worldFlags = {};
        _state.rumors = [];
        _state.npcRelations = {};
        _state.sectRelations = {};
        _state.cityStates = {};
        _state.futureWeights = {};
        _state._nextScheduledId = 1;
    }

    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        try {
            window.StateRegistry.register('narrativeConsequence', { version: 1, export: _exportState, import: _importState, reset: _resetState });
        } catch (e) {}
    }

    // ============== 6. 导出 ==============
    window.NarrativeConsequence = {
        applyConsequence: applyConsequence,
        applyConsequences: applyConsequences,
        scheduleDelayed: scheduleDelayed,
        processDay: processDay,
        cancelScheduled: cancelScheduled,
        getFlag: getFlag,
        getRumor: getRumor,
        listNpcRelations: listNpcRelations,
        exampleSaveScatteredCultivator: exampleSaveScatteredCultivator,
        exampleSpareKingOffspring: exampleSpareKingOffspring,
        getState: function () { return _state; }
    };
    if (window.XianXia) window.XianXia.NarrativeConsequence = window.NarrativeConsequence;
    try { console.log('[NarrativeConsequence] initialized v1 (7 consequence types, delayed feedback, 2 example hooks)'); } catch (e) {}
})();
