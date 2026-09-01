// ==================== beast-tide.js - 兽潮世界事件 + 捕捉池 + 灵兽园 (v19.20) ====================
// 对标 v18.8 路线图 §7.2 末段：兽潮改变捕捉池 + 宗门可建兽园。

(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    // ============== 1. 10 兽潮等级 ==============
    var TIDE_LEVELS = {
        tide_1:  { name: '小兽潮', duration: 7,   rarityBoost: 1, rareAdded: [] },
        tide_2:  { name: '微兽潮', duration: 10,  rarityBoost: 1, rareAdded: [] },
        tide_3:  { name: '中兽潮', duration: 14,  rarityBoost: 1, rareAdded: ['thunder_eagle'] },
        tide_4:  { name: '强兽潮', duration: 14,  rarityBoost: 1, rareAdded: ['thunder_eagle','crane'] },
        tide_5:  { name: '大兽潮', duration: 21,  rarityBoost: 2, rareAdded: ['thunder_eagle','dragon_turtle','fire_phoenix'] },
        tide_6:  { name: '巨兽潮', duration: 21,  rarityBoost: 2, rareAdded: ['thunder_eagle','dragon_turtle','fire_phoenix','xuan_gui'] },
        tide_7:  { name: '风暴潮', duration: 30,  rarityBoost: 2, rareAdded: ['thunder_eagle','dragon_turtle','fire_phoenix','xuan_gui','thunder_beast','crane'] },
        tide_8:  { name: '天劫潮', duration: 30,  rarityBoost: 2, rareAdded: ['thunder_eagle','dragon_turtle','fire_phoenix','xuan_gui','thunder_beast','crane','black_bear'] },
        tide_9:  { name: '灭世潮', duration: 45,  rarityBoost: 3, rareAdded: ['thunder_eagle','dragon_turtle','fire_phoenix','xuan_gui','thunder_beast','crane','black_bear','five_color_deer'] },
        tide_10: { name: '仙劫潮', duration: 60,  rarityBoost: 3, rareAdded: ['thunder_eagle','dragon_turtle','fire_phoenix','xuan_gui','thunder_beast','crane','black_bear','five_color_deer','golden_crow','kunpeng'] }
    };

    // 基础池 = v19.12 BEAST_DISTRIBUTION ids
    var BASE_POOL = ['beast_lingfox','beast_thundereagle','beast_dragonturtle','beast_icesnake','beast_windwolf','beast_firephoenix','beast_xuangui','beast_thunderbeast','beast_crane','beast_blackbear'];

    // ============== 2. 灵兽园配置 ==============
    var GARDEN_COST = 100;
    var GARDEN_REFUND_RATE = 0.5;
    var GARDEN_BUFF = { trainingPct: 0.20, buffMul: 1.5 };

    // ============== 3. 模块级状态 ==============
    var _state = {
        tides: {},     // {tideId: {level, startedDay, expireDay, rareAdded: [], opts}}
        gardens: {}    // {gardenId: {sectId, builtDay, beasts: []}}
    };

    function _today() { return (window.WorldCalendar && window.WorldCalendar.day) || 0; }
    function _emit(name, payload) {
        var bus = null;
        if (typeof window !== 'undefined' && window.EventBus) bus = window.EventBus;
        else if (typeof globalThis !== 'undefined' && globalThis.EventBus) bus = globalThis.EventBus;
        if (bus && typeof bus.emit === 'function') bus.emit(name, payload);
    }

    // ============== 4. 兽潮 API ==============
    function triggerTide(level, opts) {
        opts = opts || {};
        var def = TIDE_LEVELS[level];
        if (!def) return { ok: false, reason: 'unknown-level' };
        var today = _today();
        var tideId = 'tide_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        var duration = opts.duration || def.duration;
        var rareAdded = def.rareAdded.slice();
        _state.tides[tideId] = {
            level: level,
            name: def.name,
            startedDay: today,
            expireDay: today + duration,
            rareAdded: rareAdded,
            opts: opts
        };
        if (window.EventBus) _emit('beast:tideStarted', { tideId: tideId, level: level, name: def.name, rareAdded: rareAdded, duration: duration });
        return { ok: true, tideId: tideId, duration: duration, rareAdded: rareAdded };
    }

    function endTide(tideId) {
        var t = _state.tides[tideId];
        if (!t) return { ok: false, reason: 'not-found' };
        delete _state.tides[tideId];
        if (window.EventBus) _emit('beast:tideEnded', { tideId: tideId, level: t.level });
        return { ok: true };
    }

    function tickDay() {
        var today = _today();
        var active = [];
        for (var tid in _state.tides) {
            var t = _state.tides[tid];
            if (t.expireDay <= today) {
                delete _state.tides[tid];
                if (window.EventBus) _emit('beast:tideEnded', { tideId: tid, level: t.level, reason: 'expired' });
            } else {
                active.push(t);
            }
        }
        // 园 buff
        for (var gid in _state.gardens) {
            var g = _state.gardens[gid];
            g.daysActive = (g.daysActive || 0) + 1;
        }
        return { ok: true, active: active, day: today };
    }

    function getActiveTide() {
        for (var id in _state.tides) {
            return _state.tides[id];
        }
        return null;
    }

    function isRaidActive() {
        return Object.keys(_state.tides).length > 0;
    }

    function getRarityBoost() {
        var max = 0;
        for (var tid in _state.tides) {
            var t = _state.tides[tid];
            if (!t) continue;
            var def = TIDE_LEVELS[t.level];
            if (def && def.rarityBoost > max) max = def.rarityBoost;
        }
        return max;
    }

    function getCurrentPool() {
        var pool = BASE_POOL.slice();
        for (var tid in _state.tides) {
            var t = _state.tides[tid];
            if (!t) continue;
            for (var i = 0; i < t.rareAdded.length; i++) {
                if (pool.indexOf(t.rareAdded[i]) < 0) pool.push(t.rareAdded[i]);
            }
        }
        return pool;
    }

    function listTideLevels() {
        return Object.keys(TIDE_LEVELS).map(function (k) { return Object.assign({ id: k }, TIDE_LEVELS[k]); });
    }

    // ============== 5. 灵兽园 API ==============
    function _payGardenCost(cost, skipPay) {
        if (skipPay) return { ok: true, paid: 0 };
        var inv = window.inventory && window.inventory.currency;
        if (!inv) return { ok: false, reason: 'no-inventory' };
        if ((inv.spiritStones || 0) < cost) return { ok: false, reason: 'spiritStones-low', need: cost, have: inv.spiritStones || 0 };
        inv.spiritStones -= cost;
        if (window.currentCharData) window.currentCharData.spiritStones = inv.spiritStones;
        if (typeof window.updateCurrencyUI === 'function') {
            try { window.updateCurrencyUI(); } catch (e) {}
        }
        return { ok: true, paid: cost };
    }

    function build(sectId, opts) {
        opts = opts || {};
        if (!sectId) return { ok: false, reason: 'no-sectId' };
        var existing = listGardens(sectId);
        if (existing.length >= 1 && opts.allowMultiple !== true) {
            return { ok: false, reason: 'sect-garden-full', have: existing.length };
        }
        var pay = _payGardenCost(GARDEN_COST, opts.skipPay === true);
        if (!pay.ok) return pay;
        var gardenId = 'garden_' + sectId + '_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        _state.gardens[gardenId] = {
            sectId: sectId,
            builtDay: _today(),
            daysActive: 0,
            beasts: [],
            cost: GARDEN_COST,
            opts: opts
        };
        if (window.EventBus) _emit('beast:gardenBuilt', { gardenId: gardenId, sectId: sectId });
        return { ok: true, gardenId: gardenId, cost: GARDEN_COST };
    }

    function _refundGarden(amount) {
        if (!amount) return;
        var inv = window.inventory && window.inventory.currency;
        if (!inv) return;
        inv.spiritStones = (inv.spiritStones || 0) + amount;
        if (window.currentCharData) window.currentCharData.spiritStones = inv.spiritStones;
        if (typeof window.updateCurrencyUI === 'function') {
            try { window.updateCurrencyUI(); } catch (e) {}
        }
    }

    function remove(gardenId, opts) {
        opts = opts || {};
        var g = _state.gardens[gardenId];
        if (!g) return { ok: false, reason: 'not-found' };
        var refund = 0;
        if (opts.skipRefund !== true) {
            refund = Math.floor((g.cost || GARDEN_COST) * GARDEN_REFUND_RATE);
            _refundGarden(refund);
        }
        delete _state.gardens[gardenId];
        if (window.EventBus) _emit('beast:gardenRemoved', { gardenId: gardenId, refund: refund });
        return { ok: true, refund: refund };
    }

    function addBeast(gardenId, beastId) {
        var g = _state.gardens[gardenId];
        if (!g) return false;
        if (g.beasts.indexOf(beastId) >= 0) return false;
        g.beasts.push(beastId);
        return true;
    }

    function removeBeast(gardenId, beastId) {
        var g = _state.gardens[gardenId];
        if (!g) return false;
        var idx = g.beasts.indexOf(beastId);
        if (idx < 0) return false;
        g.beasts.splice(idx, 1);
        return true;
    }

    function getBuff(sectId) {
        var gardens = listGardens(sectId);
        if (gardens.length === 0) return { trainingPct: 0, buffMul: 1.0 };
        // 多个园累加
        var totalPct = 0;
        for (var i = 0; i < gardens.length; i++) {
            totalPct += GARDEN_BUFF.trainingPct;
        }
        return {
            trainingPct: totalPct,
            buffMul: 1.0 + totalPct * 0.5
        };
    }

    function listGardens(sectId) {
        var out = [];
        for (var id in _state.gardens) {
            if (!sectId || _state.gardens[id].sectId === sectId) {
                out.push(Object.assign({ gardenId: id }, _state.gardens[id]));
            }
        }
        return out;
    }

    // ============== 6. StateRegistry ==============
    function _exportState() { return JSON.parse(JSON.stringify(_state)); }
    function _importState(s) {
        if (!s) return;
        if (s.tides) _state.tides = s.tides;
        if (s.gardens) _state.gardens = s.gardens;
    }
    function _resetState() { _state.tides = {}; _state.gardens = {}; }

    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        try {
            window.StateRegistry.register('beastTideAndGarden', { version: 1, export: _exportState, import: _importState, reset: _resetState });
        } catch (e) {}
    }

    // ============== 7. 导出 ==============
    window.BeastTide = {
        TIDE_LEVELS: TIDE_LEVELS,
        BASE_POOL: BASE_POOL,
        GARDEN_COST: GARDEN_COST,
        GARDEN_REFUND_RATE: GARDEN_REFUND_RATE,
        GARDEN_BUFF: GARDEN_BUFF,
        triggerTide: triggerTide,
        endTide: endTide,
        tickDay: tickDay,
        getActiveTide: getActiveTide,
        isRaidActive: isRaidActive,
        getRarityBoost: getRarityBoost,
        getCurrentPool: getCurrentPool,
        listTideLevels: listTideLevels
    };
    window.BeastGarden = {
        build: build,
        remove: remove,
        addBeast: addBeast,
        removeBeast: removeBeast,
        getBuff: getBuff,
        listGardens: listGardens
    };
    // 合并入口
    window.BeastTideAndGarden = {
        triggerTide: triggerTide,
        endTide: endTide,
        tickDay: tickDay,
        getActiveTide: getActiveTide,
        isRaidActive: isRaidActive,
        getRarityBoost: getRarityBoost,
        getCurrentPool: getCurrentPool,
        listTideLevels: listTideLevels,
        build: build,
        remove: remove,
        addBeast: addBeast,
        removeBeast: removeBeast,
        getBuff: getBuff,
        listGardens: listGardens,
        getState: function () { return _state; }
    };
    if (window.XianXia) window.XianXia.BeastTideAndGarden = window.BeastTideAndGarden;
    try { console.log('[BeastTide] initialized v1 (' + Object.keys(TIDE_LEVELS).length + ' tide levels, ' + BASE_POOL.length + ' base beasts)'); } catch (e) {}
})();
