// ==================== market-dynamic.js - 地区价格差+NPC需求+世界事件 (v19.11 P1-8) ====================
// 对标 v18.8 路线图 §4 P1-8：可理解的供需，不做股票模拟。

(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    // ============== 1. 6 城市 ==============
    var CITIES = ['中州', '南疆', '东海', '西荒', '北冥', '天空'];

    // ============== 2. 6 类别 ==============
    var CATEGORIES = ['丹药', '药材', '矿材', '法器', '食物', '符箓'];

    // 城市基础倾向（basePriceMul 系数 < 1 = 便宜，> 1 = 贵）
    var CITY_BASE_BIAS = {
        '中州': { '丹药': 1.0, '药材': 1.0, '矿材': 1.0, '法器': 0.9, '食物': 1.0, '符箓': 0.95 },
        '南疆': { '丹药': 1.1, '药材': 0.7, '矿材': 1.0, '法器': 1.0, '食物': 1.05, '符箓': 1.1 },
        '东海': { '丹药': 1.0, '药材': 1.0, '矿材': 0.85, '法器': 1.05, '食物': 0.8, '符箓': 1.0 },
        '西荒': { '丹药': 1.05, '药材': 1.05, '矿材': 0.7, '法器': 1.1, '食物': 1.0, '符箓': 1.0 },
        '北冥': { '丹药': 1.0, '药材': 0.95, '矿材': 0.95, '法器': 1.0, '食物': 1.0, '符箓': 1.0 },
        '天空': { '丹药': 0.95, '药材': 1.0, '矿材': 0.85, '法器': 0.9, '食物': 1.05, '符箓': 1.0 }
    };

    // itemCategory 映射（itemId 前缀 → 类别）
    function getItemCategory(itemId) {
        if (!itemId) return null;
        if (itemId.indexOf('pill_') === 0) return '丹药';
        if (itemId.indexOf('tal_') === 0) return '符箓';
        if (itemId.indexOf('wpn_') === 0 || itemId.indexOf('arm_') === 0 || itemId.indexOf('flying_') === 0) return '法器';
        if (itemId.indexOf('mat_') === 0) {
            // 简单：兽/龙/凤 → 矿材；草/芝/参/莲/花/根/桃 → 药材；其他 → 矿材
            if (/beast|demon|dragon|phoenix|dark|iron|gold|crystal|copper|tin|stone|ore|ingot|steel|metal|star|meteor|cold|refined|sky_iron|secret/.test(itemId)) return '矿材';
            return '药材';
        }
        if (itemId.indexOf('food_') === 0 || itemId.indexOf('meal_') === 0) return '食物';
        return null;
    }

    // ============== 3. 10 个世界事件 ==============
    var WORLD_EVENTS = {
        spirit_tide:   { name: '灵气潮', duration: 7, mods: { '丹药': { demand: 30 } } },
        beast_flood:   { name: '兽潮',   duration: 14, mods: { '丹药': { demand: 20 }, '矿材': { supply: 10 } } },
        war_start:     { name: '宗门战起', duration: 10, mods: { '法器': { demand: 25 }, '符箓': { demand: 15 } } },
        war_end:       { name: '宗门战终', duration: 7,  mods: { '法器': { supply: 50 }, '符箓': { supply: 20 } } },
        plague:        { name: '瘟疫',   duration: 21, mods: { '药材': { demand: 20 } } },
        festival:      { name: '节庆',   duration: 5,  mods: { '食物': { demand: 15 } } },
        discovery:     { name: '秘境发现', duration: 14, mods: { '矿材': { demand: 10 } } },
        sect_sale:     { name: '宗门拍卖', duration: 5,  mods: { '法器': { supply: 30 } } },
        harvest:       { name: '丰收',   duration: 7,  mods: { '药材': { supply: 20 } } },
        cold:          { name: '大寒',   duration: 14, mods: { '药材': { demand: 20 } } }
    };

    // NPC 需求事件（per tickDay）
    var NPC_NEEDS = [
        { name: 'NPC 求购疗伤丹', city: '中州', category: '丹药', demand: 15 },
        { name: 'NPC 急需千年灵芝', city: '南疆', category: '药材', demand: 20 },
        { name: 'NPC 求购玄铁', city: '西荒', category: '矿材', demand: 18 },
        { name: 'NPC 求购法器', city: '东海', category: '法器', demand: 22 },
        { name: 'NPC 求购食物', city: '天空', category: '食物', demand: 12 }
    ];

    // ============== 4. 模块级状态 ==============
    var _state = {
        indices: {},           // {cityId: {category: {supply, demand, baseMul, eventMods}}}
        activeEvents: [],      // [{id, startDay, expireDay, mods}]
        history: []            // 最近 20 次事件
    };

    function _initIndices() {
        _state.indices = {};
        for (var i = 0; i < CITIES.length; i++) {
            var city = CITIES[i];
            _state.indices[city] = {};
            for (var j = 0; j < CATEGORIES.length; j++) {
                var cat = CATEGORIES[j];
                _state.indices[city][cat] = {
                    supply: 100,
                    demand: 100,
                    baseMul: CITY_BASE_BIAS[city][cat] || 1.0,
                    eventMods: []
                };
            }
        }
    }
    _initIndices();

    // ============== 5. 工具 ==============
    function getIndex(cityId, category) {
        if (!_state.indices[cityId]) return null;
        return _state.indices[cityId][category] || null;
    }

    function priceMul(cityId, itemCategoryOrItemId) {
        var cat = (CATEGORIES.indexOf(itemCategoryOrItemId) >= 0) ? itemCategoryOrItemId : getItemCategory(itemCategoryOrItemId);
        if (!cat) return 1.0;
        var idx = getIndex(cityId, cat);
        if (!idx) return 1.0;
        var ratio = idx.demand / idx.supply;
        var sumMods = 0;
        for (var i = 0; i < idx.eventMods.length; i++) sumMods += idx.eventMods[i].value;
        var mul = idx.baseMul * ratio * (1 + sumMods / 100);
        return Math.max(0.1, Math.min(10, mul));
    }

    function applyMod(cityId, category, mod) {
        var idx = getIndex(cityId, category);
        if (!idx) return false;
        if (mod.supply) idx.supply = Math.max(10, idx.supply + mod.supply);
        if (mod.demand) idx.demand = Math.max(10, idx.demand + mod.demand);
        return true;
    }

    // ============== 6. 公开 API ==============
    function applyWorldEvent(eventId, opts) {
        opts = opts || {};
        var def = WORLD_EVENTS[eventId];
        if (!def) return { ok: false, reason: 'event-not-found' };
        var today = (window.WorldCalendar && window.WorldCalendar.day) || 0;
        var cities = opts.cities || CITIES; // 默认影响所有城市
        var duration = opts.duration || def.duration;
        var entry = { id: eventId, name: def.name, startDay: today, expireDay: today + duration, mods: def.mods, affectedCities: cities.slice() };
        _state.activeEvents.push(entry);
        // 立即应用
        for (var ci = 0; ci < cities.length; ci++) {
            var city = cities[ci];
            for (var cat in def.mods) applyMod(city, cat, def.mods[cat]);
        }
        // 记录
        _state.history.unshift({ day: today, type: 'world-event', id: eventId, name: def.name });
        if (_state.history.length > 20) _state.history.pop();
        if (window.EventBus) window.EventBus.emit('market:event:applied', { eventId: eventId, name: def.name, mods: def.mods, cities: cities });
        return { ok: true, entry: entry };
    }

    function adjustFromTrade(cityId, category, qty, isBuy) {
        var idx = getIndex(cityId, category);
        if (!idx) return { ok: false, reason: 'no-index' };
        var delta = qty * 0.1;
        if (isBuy) {
            // 买 → 供应 -、需求 +
            idx.supply = Math.max(10, idx.supply - delta * 0.5);
            idx.demand = idx.demand + delta * 0.5;
        } else {
            // 卖 → 供应 +、需求 -
            idx.supply = idx.supply + delta * 0.5;
            idx.demand = Math.max(10, idx.demand - delta * 0.3);
        }
        var newMul = priceMul(cityId, category);
        if (window.EventBus) window.EventBus.emit('market:priceChange', { cityId: cityId, category: category, newMul: newMul, isBuy: isBuy });
        return { ok: true, newMul: newMul, supply: idx.supply, demand: idx.demand };
    }

    function tickDay() {
        var today = (window.WorldCalendar && window.WorldCalendar.day) || 0;
        // 移除过期事件
        for (var i = _state.activeEvents.length - 1; i >= 0; i--) {
            if (_state.activeEvents[i].expireDay <= today) {
                _state.activeEvents.splice(i, 1);
            }
        }
        // 自然回归
        for (var ci = 0; ci < CITIES.length; ci++) {
            var city = CITIES[ci];
            for (var cj = 0; cj < CATEGORIES.length; cj++) {
                var cat = CATEGORIES[cj];
                var idx = _state.indices[city][cat];
                // supply 回归 100
                idx.supply += (100 - idx.supply) * 0.1;
                // demand 回归 100
                idx.demand += (100 - idx.demand) * 0.1;
            }
        }
        // 概率触发 NPC 需求（低概率）
        var npcNeeds = [];
        if (Math.random() < 0.1) {
            var need = NPC_NEEDS[Math.floor(Math.random() * NPC_NEEDS.length)];
            applyMod(need.city, need.category, { demand: need.demand });
            npcNeeds.push(need);
            _state.history.unshift({ day: today, type: 'npc-need', need: need.name });
            if (_state.history.length > 20) _state.history.pop();
            if (window.EventBus) window.EventBus.emit('market:npcNeed', { need: need });
        }
        return { ok: true, npcNeeds: npcNeeds, day: today };
    }

    function listActiveEvents() { return _state.activeEvents.slice(); }

    // ============== 7. StateRegistry ==============
    function _exportState() { return JSON.parse(JSON.stringify(_state)); }
    function _importState(s) {
        if (!s) return;
        if (s.indices && Object.keys(s.indices).length > 0) _state.indices = s.indices;
        if (Array.isArray(s.activeEvents)) _state.activeEvents = s.activeEvents;
        if (Array.isArray(s.history)) _state.history = s.history.slice(0, 20);
    }
    function _resetState() {
        _initIndices();
        _state.activeEvents = [];
        _state.history = [];
    }

    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        try {
            window.StateRegistry.register('marketConfig', { version: 1, export: _exportState, import: _importState, reset: _resetState });
        } catch (e) {}
    }

    // ============== 8. 导出 ==============
    window.MarketDynamic = {
        CITIES: CITIES,
        CATEGORIES: CATEGORIES,
        CITY_BASE_BIAS: CITY_BASE_BIAS,
        WORLD_EVENTS: WORLD_EVENTS,
        NPC_NEEDS: NPC_NEEDS,
        getItemCategory: getItemCategory,
        getIndex: getIndex,
        priceMul: priceMul,
        applyWorldEvent: applyWorldEvent,
        adjustFromTrade: adjustFromTrade,
        tickDay: tickDay,
        listActiveEvents: listActiveEvents,
        getState: function () { return _state; }
    };
    if (window.XianXia) window.XianXia.MarketDynamic = window.MarketDynamic;
    try { console.log('[MarketDynamic] initialized v1 (' + CITIES.length + ' cities × ' + CATEGORIES.length + ' categories = ' + (CITIES.length * CATEGORIES.length) + ' indices, ' + Object.keys(WORLD_EVENTS).length + ' world events, ' + NPC_NEEDS.length + ' NPC needs)'); } catch (e) {}
})();
