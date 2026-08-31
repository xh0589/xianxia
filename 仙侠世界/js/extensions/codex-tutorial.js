// ==================== codex-tutorial.js - 教程+图鉴+世界日志 (v19.17 §11) ====================
// 对标 v18.8 路线图 §11：7 步新手引导 + 6 类图鉴 + 世界大事记。

(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    // ============== 1. 7 步新手引导 ==============
    var TUTORIAL_STEPS = [
        { id: 'tut_first_cultivation', title: '第一次修炼', text: '点击"闭关"或"修炼"开始你的第一次修炼。灵气在洞府中积蓄，闭关可加速积累。' },
        { id: 'tut_first_combat',      title: '第一次战斗', text: '点击"外出历练"或"战斗"按钮，与一只野兽或散修对战。失败不丢人，多试几次。' },
        { id: 'tut_first_trade',       title: '第一次买卖', text: '在"坊市"购买或出售物品，记住卖价有地区差异（v19.11）。' },
        { id: 'tut_first_npc',         title: '第一次 NPC 互动', text: '与 NPC 对话，送礼可加好感（v19.6 NpcLineage）。' },
        { id: 'tut_first_sect',        title: '第一次加入门派', text: '点击"宗门"选择加入 36 个门派之一，职位从弟子开始（v19.0）。' },
        { id: 'tut_first_craft',       title: '第一次炼丹/炼器', text: '在"炼丹"或"炼器"中合成第一颗丹 / 第一件法器（v19.4 / v19.5）。' },
        { id: 'tut_first_dungeon',     title: '第一次秘境', text: '点击"秘境"进入动态秘境（v19.9 8 个模板）。' }
    ];

    // ============== 2. 6 类图鉴 ==============
    var CODEX_TYPES = [
        { id: 'codex_gongfa',   name: '功法图鉴', desc: '已习得的功法' },
        { id: 'codex_beast',    name: '灵兽图鉴', desc: '已发现的灵兽' },
        { id: 'codex_recipe',   name: '丹方图鉴', desc: '已炼制的丹/器/符/阵/傀儡' },
        { id: 'codex_sect',     name: '门派图鉴', desc: '已加入/了解的门派' },
        { id: 'codex_dungeon',  name: '秘境发现', desc: '已探索的秘境' },
        { id: 'codex_world',    name: '世界大事', desc: '影响世界的事件' }
    ];

    // ============== 3. 模块级状态 ==============
    var _state = {
        dismissed: {},          // {stepId: true}
        codex: {                // {codexId: {itemId: entry}}
            codex_gongfa: {},
            codex_beast: {},
            codex_recipe: {},
            codex_sect: {},
            codex_dungeon: {},
            codex_world: {}
        },
        journal: { entries: [] }   // [{id, type, day, title, text, refs}]
    };

    var MAX_JOURNAL = 100;
    var MAX_CODEX_PER_TYPE = 200;

    function _today() { return (window.WorldCalendar && window.WorldCalendar.day) || 0; }
    function _emit(name, payload) {
        var bus = null;
        if (typeof window !== 'undefined' && window.EventBus) bus = window.EventBus;
        else if (typeof globalThis !== 'undefined' && globalThis.EventBus) bus = globalThis.EventBus;
        if (bus && typeof bus.emit === 'function') {
            bus.emit(name, payload);
        }
    }

    // ============== 4. 教程 API ==============

    function trigger(stepId) {
        if (!_state.dismissed[stepId]) {
            var step = TUTORIAL_STEPS.find(function (s) { return s.id === stepId; });
            if (step) {
                _emit('codex:tutorialTriggered', { step: step });
                return { ok: true, dismissed: false, step: step };
            }
        }
        return { ok: true, dismissed: true };
    }

    function dismiss(stepId) {
        if (TUTORIAL_STEPS.find(function (s) { return s.id === stepId; })) {
            _state.dismissed[stepId] = true;
            return true;
        }
        return false;
    }

    function isDismissed(stepId) { return !!_state.dismissed[stepId]; }

    function listSteps() { return TUTORIAL_STEPS.slice(); }

    // ============== 5. 图鉴 API ==============

    function discover(codexId, itemId, info) {
        if (!CODEX_TYPES.find(function (c) { return c.id === codexId; })) return { ok: false, reason: 'unknown-codex' };
        if (!itemId) return { ok: false, reason: 'no-itemId' };
        _state.codex[codexId] = _state.codex[codexId] || {};
        var existing = _state.codex[codexId][itemId];
        if (existing) {
            existing.count = (existing.count || 1) + 1;
            existing.lastSeenDay = _today();
            return { ok: true, entry: existing, already: true };
        }
        if (Object.keys(_state.codex[codexId]).length >= MAX_CODEX_PER_TYPE) {
            return { ok: false, reason: 'codex-full' };
        }
        var entry = {
            itemId: itemId,
            info: info || {},
            firstSeenDay: _today(),
            lastSeenDay: _today(),
            seen: false,
            count: 1
        };
        _state.codex[codexId][itemId] = entry;
        _emit('codex:discovered', { codexId: codexId, itemId: itemId, entry: entry });
        return { ok: true, entry: entry, already: false };
    }

    function getEntries(codexId) {
        var dict = _state.codex[codexId] || {};
        return Object.keys(dict).map(function (k) { return dict[k]; });
    }

    function getEntry(codexId, itemId) {
        var dict = _state.codex[codexId] || {};
        return dict[itemId] || null;
    }

    function getProgress(codexId) {
        var dict = _state.codex[codexId] || {};
        var discovered = Object.keys(dict).length;
        // 总数未知（动态），用 discovered as numerator
        return { codexId: codexId, discovered: discovered, percent: 0, _note: 'total dynamic' };
    }

    function markSeen(codexId, itemId) {
        var dict = _state.codex[codexId] || {};
        if (!dict[itemId]) return false;
        dict[itemId].seen = true;
        _emit('codex:seen', { codexId: codexId, itemId: itemId });
        return true;
    }

    // ============== 6. 世界大事记 API ==============

    function record(event) {
        if (!event || !event.type) return { ok: false, reason: 'no-type' };
        var entry = {
            id: 'j_' + _today() + '_' + (_state.journal.entries.length || 0) + '_' + Math.random().toString(36).slice(2, 6),
            type: event.type,
            day: event.day || _today(),
            title: event.title || event.type,
            text: event.text || '',
            refs: event.refs || {}
        };
        _state.journal.entries.unshift(entry);
        if (_state.journal.entries.length > MAX_JOURNAL) _state.journal.entries.pop();
        _emit('journal:recorded', { entry: entry });
        return { ok: true, entry: entry };
    }

    function getJournalEntries(type) {
        if (!type) return _state.journal.entries.slice();
        return _state.journal.entries.filter(function (e) { return e.type === type; });
    }

    function getByDayRange(startDay, endDay) {
        return _state.journal.entries.filter(function (e) { return e.day >= startDay && e.day <= endDay; });
    }

    function getByType(type) { return getJournalEntries(type); }

    function getRecent(limit) {
        return _state.journal.entries.slice(0, limit || 10);
    }

    // ============== 7. StateRegistry ==============

    function _exportState() { return JSON.parse(JSON.stringify(_state)); }
    function _importState(s) {
        if (!s) return;
        if (s.dismissed) _state.dismissed = s.dismissed;
        if (s.codex) {
            CODEX_TYPES.forEach(function (c) {
                if (s.codex[c.id]) _state.codex[c.id] = s.codex[c.id];
            });
        }
        if (s.journal && Array.isArray(s.journal.entries)) _state.journal.entries = s.journal.entries.slice(0, MAX_JOURNAL);
    }
    function _resetState() {
        _state.dismissed = {};
        CODEX_TYPES.forEach(function (c) { _state.codex[c.id] = {}; });
        _state.journal = { entries: [] };
    }

    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        try {
            window.StateRegistry.register('codexTutorial', { version: 1, export: function () { return { dismissed: _state.dismissed }; }, import: function (s) { if (s && s.dismissed) _state.dismissed = s.dismissed; }, reset: function () { _state.dismissed = {}; } });
            window.StateRegistry.register('codex', { version: 1, export: function () { return { codex: _state.codex }; }, import: function (s) { if (s && s.codex) { CODEX_TYPES.forEach(function (c) { if (s.codex[c.id]) _state.codex[c.id] = s.codex[c.id]; }); } }, reset: function () { CODEX_TYPES.forEach(function (c) { _state.codex[c.id] = {}; }); } });
            window.StateRegistry.register('worldJournal', { version: 1, export: function () { return _state.journal; }, import: function (s) { if (s && Array.isArray(s.entries)) _state.journal.entries = s.entries.slice(0, MAX_JOURNAL); }, reset: function () { _state.journal = { entries: [] }; } });
        } catch (e) {}
    }

    // ============== 8. 导出 ==============
    window.CodexTutorial = {
        trigger: trigger,
        dismiss: dismiss,
        isDismissed: isDismissed,
        listSteps: listSteps
    };
    window.Codex = {
        discover: discover,
        getEntries: getEntries,
        getEntry: getEntry,
        getProgress: getProgress,
        markSeen: markSeen,
        listTypes: function () { return CODEX_TYPES.slice(); },
        getState: function () { return _state.codex; }
    };
    window.WorldJournal = {
        record: record,
        getEntries: getJournalEntries,
        getByDayRange: getByDayRange,
        getByType: getByType,
        getRecent: getRecent,
        getState: function () { return _state.journal; }
    };
    window.XianXia = window.XianXia || {};
    window.XianXia.CodexTutorial = window.CodexTutorial;
    window.XianXia.Codex = window.Codex;
    window.XianXia.WorldJournal = window.WorldJournal;
    try { console.log('[CodexTutorial] initialized v1 (' + TUTORIAL_STEPS.length + ' tutorial steps, ' + CODEX_TYPES.length + ' codex types, journal cap=' + MAX_JOURNAL + ')'); } catch (e) {}
})();
