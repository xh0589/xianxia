// ==================== resource-points.js - 灵脉/矿脉/药园 地图实体 (v19.10 P1-7) ====================
// 对标 v18.8 路线图 §4 P1-7：30 个资源点 + 占领 + 产出 + 衰减 + 恢复。

(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    // ============== 1. 30 个资源点 ==============
    var INITIAL_POINTS = [
        // 灵脉 10
        { id: 'vein_beiming_01', type: 'spirit_vein', name: '北冥灵脉', region: '北冥', ownerSect: null, tier: 3, output: { spiritStone: 30, waterEssence: 2 }, defense: 120, discovered: true, exhausted: 0.05, maxExhausted: 0.8, recoverRate: 0.005 },
        { id: 'vein_donghai_01', type: 'spirit_vein', name: '东海灵脉', region: '东海', ownerSect: '蜀山派', tier: 4, output: { spiritStone: 50, waterEssence: 3 }, defense: 180, discovered: true, exhausted: 0.1, maxExhausted: 0.85, recoverRate: 0.004 },
        { id: 'vein_xihuang_01', type: 'spirit_vein', name: '西荒灵脉', region: '西荒', ownerSect: null, tier: 2, output: { spiritStone: 20 }, defense: 80, discovered: true, exhausted: 0.0, maxExhausted: 0.8, recoverRate: 0.006 },
        { id: 'vein_zhongzhou_01', type: 'spirit_vein', name: '中州灵脉', region: '中州', ownerSect: '少林寺', tier: 5, output: { spiritStone: 100, qiEssence: 5 }, defense: 250, discovered: true, exhausted: 0.2, maxExhausted: 0.9, recoverRate: 0.003 },
        { id: 'vein_nanjiang_01', type: 'spirit_vein', name: '南疆灵脉', region: '南疆', ownerSect: '百花谷', tier: 3, output: { spiritStone: 30, woodEssence: 2 }, defense: 110, discovered: true, exhausted: 0.05, maxExhausted: 0.8, recoverRate: 0.005 },
        { id: 'vein_jibei_01', type: 'spirit_vein', name: '极北灵脉', region: '极北', ownerSect: null, tier: 2, output: { spiritStone: 18, iceEssence: 2 }, defense: 75, discovered: true, exhausted: 0.0, maxExhausted: 0.8, recoverRate: 0.006 },
        { id: 'vein_tiankong_01', type: 'spirit_vein', name: '天空灵脉', region: '天空', ownerSect: '武当派', tier: 4, output: { spiritStone: 45, cloudEssence: 3 }, defense: 160, discovered: true, exhausted: 0.15, maxExhausted: 0.85, recoverRate: 0.004 },
        { id: 'vein_shenyuan_01', type: 'spirit_vein', name: '深渊灵脉', region: '秘境虚空', ownerSect: null, tier: 5, output: { spiritStone: 80, voidEssence: 4 }, defense: 220, discovered: false, exhausted: 0.0, maxExhausted: 0.85, recoverRate: 0.005 },
        { id: 'vein_youming_01', type: 'spirit_vein', name: '幽冥灵脉', region: '秘境虚空', ownerSect: '修罗宫', tier: 4, output: { spiritStone: 40, ghostEssence: 3 }, defense: 170, discovered: true, exhausted: 0.1, maxExhausted: 0.85, recoverRate: 0.004 },
        { id: 'vein_jiutian_01', type: 'spirit_vein', name: '九天灵脉', region: '天空', ownerSect: null, tier: 5, output: { spiritStone: 90, skyEssence: 5 }, defense: 240, discovered: false, exhausted: 0.0, maxExhausted: 0.9, recoverRate: 0.003 },

        // 矿脉 10
        { id: 'mine_xuantie_01', type: 'mine', name: '玄铁矿脉', region: '西荒', ownerSect: '青城派', tier: 3, output: { mat_dark_iron: 5, mat_iron_ore: 10 }, defense: 100, discovered: true, exhausted: 0.1, maxExhausted: 0.8, recoverRate: 0.005 },
        { id: 'mine_leijing_01', type: 'mine', name: '雷晶矿', region: '东海', ownerSect: null, tier: 4, output: { mat_meteorite: 3, mat_thunder_crystal: 2 }, defense: 150, discovered: true, exhausted: 0.0, maxExhausted: 0.85, recoverRate: 0.004 },
        { id: 'mine_miying_01', type: 'mine', name: '秘银矿', region: '北冥', ownerSect: null, tier: 3, output: { mat_mithril: 4, mat_refined_silver: 8 }, defense: 120, discovered: true, exhausted: 0.05, maxExhausted: 0.8, recoverRate: 0.005 },
        { id: 'mine_zhuque_01', type: 'mine', name: '朱雀矿', region: '南疆', ownerSect: '百花谷', tier: 4, output: { mat_fire_crystal: 5, mat_phoenix_blood: 1 }, defense: 160, discovered: true, exhausted: 0.1, maxExhausted: 0.85, recoverRate: 0.004 },
        { id: 'mine_hantie_01', type: 'mine', name: '寒铁矿', region: '极北', ownerSect: null, tier: 3, output: { mat_cold_iron: 4, mat_refined_iron: 6 }, defense: 110, discovered: true, exhausted: 0.0, maxExhausted: 0.8, recoverRate: 0.005 },
        { id: 'mine_fenghuang_01', type: 'mine', name: '凤凰矿', region: '南疆', ownerSect: null, tier: 5, output: { mat_phoenix_blood: 2, mat_fire_crystal: 8 }, defense: 220, discovered: false, exhausted: 0.0, maxExhausted: 0.85, recoverRate: 0.003 },
        { id: 'mine_zijin_01', type: 'mine', name: '紫金矿', region: '中州', ownerSect: '少林寺', tier: 3, output: { mat_purple_gold: 3, mat_refined_copper: 6 }, defense: 130, discovered: true, exhausted: 0.1, maxExhausted: 0.8, recoverRate: 0.005 },
        { id: 'mine_yunshi_01', type: 'mine', name: '陨铁矿', region: '天空', ownerSect: '武当派', tier: 4, output: { mat_meteorite: 5, mat_star_iron: 2 }, defense: 170, discovered: true, exhausted: 0.15, maxExhausted: 0.85, recoverRate: 0.004 },
        { id: 'mine_xingchen_01', type: 'mine', name: '星辰矿', region: '天空', ownerSect: null, tier: 5, output: { mat_star_iron: 4, mat_sky_iron: 3 }, defense: 230, discovered: false, exhausted: 0.0, maxExhausted: 0.85, recoverRate: 0.003 },
        { id: 'mine_longlin_01', type: 'mine', name: '龙鳞矿', region: '东海', ownerSect: '蜀山派', tier: 4, output: { mat_dragon_scale: 3, mat_dragon_scale_iron: 5 }, defense: 180, discovered: true, exhausted: 0.2, maxExhausted: 0.85, recoverRate: 0.004 },

        // 药园 10
        { id: 'herb_qianlingzhi_01', type: 'herb_garden', name: '千灵芝园', region: '南疆', ownerSect: '百花谷', tier: 3, output: { mat_thousand_lingzhi: 4, mat_lingzhi: 10 }, defense: 90, discovered: true, exhausted: 0.15, maxExhausted: 0.8, recoverRate: 0.005 },
        { id: 'herb_wannianrenshen_01', type: 'herb_garden', name: '万年人参谷', region: '北冥', ownerSect: null, tier: 4, output: { mat_ten_thousand_ginseng: 3, mat_ginseng: 8 }, defense: 130, discovered: true, exhausted: 0.0, maxExhausted: 0.85, recoverRate: 0.004 },
        { id: 'herb_xuelian_01', type: 'herb_garden', name: '雪莲谷', region: '极北', ownerSect: null, tier: 3, output: { mat_snow_lotus: 5, mat_liquorice: 10 }, defense: 100, discovered: true, exhausted: 0.0, maxExhausted: 0.8, recoverRate: 0.005 },
        { id: 'herb_heshouwu_01', type: 'herb_garden', name: '何首乌园', region: '中州', ownerSect: '少林寺', tier: 2, output: { mat_he_shou_wu: 6, mat_liquorice: 8 }, defense: 80, discovered: true, exhausted: 0.1, maxExhausted: 0.8, recoverRate: 0.005 },
        { id: 'herb_tianxinhua_01', type: 'herb_garden', name: '天心花田', region: '中州', ownerSect: null, tier: 5, output: { mat_heaven_heart_flower: 2, mat_nine_leaf_lingzhi: 1 }, defense: 200, discovered: false, exhausted: 0.0, maxExhausted: 0.85, recoverRate: 0.003 },
        { id: 'herb_dilingen_01', type: 'herb_garden', name: '地灵根田', region: '西荒', ownerSect: '青城派', tier: 3, output: { mat_earth_spirit_root: 4, mat_ginseng: 8 }, defense: 110, discovered: true, exhausted: 0.05, maxExhausted: 0.8, recoverRate: 0.005 },
        { id: 'herb_jiuyelingzhi_01', type: 'herb_garden', name: '九叶灵芝园', region: '秘境虚空', ownerSect: null, tier: 5, output: { mat_nine_leaf_lingzhi: 2, mat_ten_thousand_ginseng: 2 }, defense: 220, discovered: false, exhausted: 0.0, maxExhausted: 0.85, recoverRate: 0.003 },
        { id: 'herb_pantao_01', type: 'herb_garden', name: '蟠桃园', region: '天空', ownerSect: '武当派', tier: 5, output: { mat_peach_fruit: 3, mat_heaven_heart_flower: 1 }, defense: 240, discovered: true, exhausted: 0.2, maxExhausted: 0.9, recoverRate: 0.003 },
        { id: 'herb_fengxuecao_01', type: 'herb_garden', name: '凤凰血草原', region: '南疆', ownerSect: null, tier: 4, output: { mat_phoenix_blood_grass: 4, mat_phoenix_blood: 1 }, defense: 150, discovered: true, exhausted: 0.0, maxExhausted: 0.85, recoverRate: 0.004 },
        { id: 'herb_wuxingtian_01', type: 'herb_garden', name: '五行药田', region: '中州', ownerSect: null, tier: 4, output: { mat_five_element_essence: 5, mat_nine_leaf_lingzhi: 1 }, defense: 160, discovered: true, exhausted: 0.0, maxExhausted: 0.85, recoverRate: 0.004 }
    ];

    // ============== 2. 模块级状态 ==============
    var _state = {
        points: INITIAL_POINTS.map(function (p) { return JSON.parse(JSON.stringify(p)); }),
        history: [],
        spiritStones: 10000  // 宗门公共灵石
    };

    // ============== 3. 工具 ==============
    function getPoint(id) {
        for (var i = 0; i < _state.points.length; i++) if (_state.points[i].id === id) return _state.points[i];
        return null;
    }

    function listByRegion(region) { return _state.points.filter(function (p) { return p.region === region; }); }
    function listByType(type) { return _state.points.filter(function (p) { return p.type === type; }); }
    function listByOwner(sectId) { return _state.points.filter(function (p) { return p.ownerSect === sectId; }); }

    function calcYield(p) {
        if (p.exhausted >= p.maxExhausted) return {};
        var out = {};
        var rate = 1 - p.exhausted;
        for (var k in p.output) {
            out[k] = Math.max(0, Math.floor(p.output[k] * rate));
        }
        return out;
    }

    function recordHistory(entry) {
        _state.history.unshift(entry);
        if (_state.history.length > 20) _state.history.pop();
    }

    // ============== 4. 公开 API ==============
    function claim(id, sectId) {
        var p = getPoint(id);
        if (!p) return { ok: false, reason: 'point-not-found' };
        if (!sectId) return { ok: false, reason: 'no-sect' };
        if (p.ownerSect) return { ok: false, reason: 'already-owned', owner: p.ownerSect };
        var cost = 100;
        if (_state.spiritStones < cost) return { ok: false, reason: 'spiritStones-low', need: cost, have: _state.spiritStones };
        _state.spiritStones -= cost;
        p.ownerSect = sectId;
        recordHistory({ day: (window.WorldCalendar && window.WorldCalendar.day) || 0, type: 'claim', pointId: id, sectId: sectId });
        if (window.EventBus) {
            window.EventBus.emit('resourcePoint:claim', { pointId: id, sectId: sectId, point: p });
            window.EventBus.emit('resourcePoint:ownerChange', { pointId: id, newOwner: sectId });
        }
        return { ok: true, owner: sectId, cost: cost };
    }

    function attack(sectFrom, sectTo, pointId, power) {
        power = power || 100;
        var p = getPoint(pointId);
        if (!p) return { ok: false, reason: 'point-not-found' };
        if (!p.ownerSect) return { ok: false, reason: 'not-owned' };
        if (p.ownerSect !== sectTo) return { ok: false, reason: 'not-target-owner', actual: p.ownerSect };
        if (sectFrom === sectTo) return { ok: false, reason: 'self-attack' };
        var victory = power > p.defense;
        var result = { ok: true, victory: victory, defense: p.defense, power: power, casualties: Math.floor(Math.random() * (p.defense / 4)) };
        if (victory) {
            var oldOwner = p.ownerSect;
            p.ownerSect = sectFrom;
            recordHistory({ day: (window.WorldCalendar && window.WorldCalendar.day) || 0, type: 'attack-victory', pointId: pointId, sectFrom: sectFrom, sectTo: sectTo });
            if (window.EventBus) {
                window.EventBus.emit('resourcePoint:attack', { pointId: pointId, attacker: sectFrom, defender: sectTo, victory: true });
                window.EventBus.emit('resourcePoint:ownerChange', { pointId: pointId, newOwner: sectFrom, oldOwner: oldOwner });
            }
        } else {
            recordHistory({ day: (window.WorldCalendar && window.WorldCalendar.day) || 0, type: 'attack-fail', pointId: pointId, sectFrom: sectFrom, sectTo: sectTo });
            if (window.EventBus) window.EventBus.emit('resourcePoint:attack', { pointId: pointId, attacker: sectFrom, defender: sectTo, victory: false });
        }
        return result;
    }

    function harvest(pointId) {
        var p = getPoint(pointId);
        if (!p) return { ok: false, reason: 'point-not-found' };
        if (!p.ownerSect) return { ok: false, reason: 'not-owned', output: {} };
        if (p.exhausted >= p.maxExhausted) return { ok: false, reason: 'exhausted', output: {}, exhausted: p.exhausted };
        var out = calcYield(p);
        // 衰减
        p.exhausted = Math.min(p.maxExhausted, p.exhausted + 0.05);
        if (window.EventBus) window.EventBus.emit('resourcePoint:yield', { pointId: pointId, output: out, newExhausted: p.exhausted });
        return { ok: true, output: out, newExhausted: p.exhausted };
    }

    function tickDay() {
        var recovered = [];
        for (var i = 0; i < _state.points.length; i++) {
            var p = _state.points[i];
            if (p.exhausted > 0) {
                p.exhausted = Math.max(0, p.exhausted - (p.recoverRate || 0.005));
                if (p.exhausted === 0 || Math.random() < 0.01) {
                    recovered.push({ id: p.id, newExhausted: p.exhausted });
                }
            }
            // 满产恢复时发事件
            if (p.exhausted === 0) {
                if (window.EventBus) window.EventBus.emit('resourcePoint:recovered', { pointId: p.id });
            }
        }
        return { ok: true, recovered: recovered.length, day: (window.WorldCalendar && window.WorldCalendar.day) || 0 };
    }

    // ============== 5. StateRegistry ==============
    function _exportState() { return JSON.parse(JSON.stringify(_state)); }
    function _importState(s) {
        if (!s) return;
        if (Array.isArray(s.points)) _state.points = s.points;
        if (Array.isArray(s.history)) _state.history = s.history.slice(0, 20);
        _state.spiritStones = s.spiritStones || 0;
    }
    function _resetState() {
        _state.points = INITIAL_POINTS.map(function (p) { return JSON.parse(JSON.stringify(p)); });
        _state.history = [];
        _state.spiritStones = 10000;
    }

    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        try {
            window.StateRegistry.register('resourcePointConfig', { version: 1, export: _exportState, import: _importState, reset: _resetState });
        } catch (e) {}
    }

    // ============== 6. 导出 ==============
    window.ResourcePoints = {
        INITIAL_POINTS: INITIAL_POINTS,
        getPoint: getPoint,
        listByRegion: listByRegion,
        listByType: listByType,
        listByOwner: listByOwner,
        calcYield: calcYield,
        claim: claim,
        attack: attack,
        harvest: harvest,
        tickDay: tickDay,
        getState: function () { return _state; },
        setSpiritStones: function (n) { _state.spiritStones = n; }
    };
    if (window.XianXia) window.XianXia.ResourcePoints = window.ResourcePoints;
    try { console.log('[ResourcePoints] initialized v1 (' + INITIAL_POINTS.length + ' points: ' + listByType('spirit_vein').length + ' veins / ' + listByType('mine').length + ' mines / ' + listByType('herb_garden').length + ' gardens)'); } catch (e) {}
})();
