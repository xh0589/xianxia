// ==================== beast-ecosystem.js - 灵兽生态·地图分布 (v19.12 P0) ====================
// 对标 v18.8 路线图 §7.2 灵兽生态 + §7.1 非战斗功能 + 修 BUG（尸体扑上来）。
// 10 灵兽 × 7 地区 × 多地形分布；6 类非战斗功能；统一 markEntityDead API。

(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    // ============== 1. 10 灵兽 × 7 地区 × 多地形 ==============
    var BEAST_DISTRIBUTION = [
        { id: 'beast_lingfox',     name: '灵狐',  level: 5,  regions: ['中州', '南疆', '蜀地'],   terrains: ['PLAIN', 'FOREST'],            type: 'beast' },
        { id: 'beast_thundereagle',name: '雷鹰',  level: 12, regions: ['天空', '东荒', '东南海域'],terrains: ['MOUNTAIN'],                  type: 'beast' },
        { id: 'beast_dragonturtle',name: '龙龟',  level: 18, regions: ['东海', '东南海域'],         terrains: ['WATER'],                     type: 'beast' },
        { id: 'beast_icesnake',    name: '冰蛇',  level: 15, regions: ['北冥'],                     terrains: ['SNOW', 'FROZEN_LAND'],        type: 'beast' },
        { id: 'beast_windwolf',    name: '风狼',  level: 8,  regions: ['西漠', '蜀地', '中州'],     terrains: ['PLAIN', 'DESERT'],            type: 'beast' },
        { id: 'beast_firephoenix', name: '火凤',  level: 22, regions: ['南疆'],                     terrains: ['VOLCANO'],                   type: 'beast' },
        { id: 'beast_xuangui',     name: '玄龟',  level: 16, regions: ['东海'],                     terrains: ['WATER'],                     type: 'beast' },
        { id: 'beast_thunderbeast',name: '雷兽',  level: 20, regions: ['天空'],                     terrains: ['MOUNTAIN'],                  type: 'beast' },
        { id: 'beast_crane',       name: '仙鹤',  level: 10, regions: ['天空', '中州'],             terrains: ['SPIRIT_SPRING', 'PLAIN'],    type: 'beast' },
        { id: 'beast_blackbear',   name: '黑熊',  level: 6,  regions: ['北冥', '中州', '东荒'],     terrains: ['FOREST'],                    type: 'beast' }
    ];

    // ============== 2. 6 类非战斗功能（路线图 §7.1） ==============
    var BEAST_BUFFS = {
        beast_lingfox:      { category: 'treasure',  mul: 0.05,  desc: '寻宝概率 +5%' },
        beast_thundereagle: { category: 'scout',     mul: 1.0,   desc: '可侦察秘境/敌宗' },
        beast_dragonturtle: { category: 'carry',     mul: 0.1,   desc: '储物 +10%' },
        beast_icesnake:     { category: 'coldHerb',  mul: 0.3,   desc: '寒性药材 +30%' },
        beast_windwolf:     { category: 'travel',    mul: 0.8,   desc: '陆路旅行 -20%' },
        beast_firephoenix:  { category: 'craftFire', mul: 0.1,   desc: '炼器/炼丹火候 +10%' }
    };

    // 兼容 spiritBeasts 别名
    var BEAST_NAME_TO_ID = {
        '灵狐': 'beast_lingfox', '雷鹰': 'beast_thundereagle', '龙龟': 'beast_dragonturtle',
        '冰蛇': 'beast_icesnake', '风狼': 'beast_windwolf', '火凤': 'beast_firephoenix',
        '玄龟': 'beast_xuangui', '雷兽': 'beast_thunderbeast', '仙鹤': 'beast_crane', '黑熊': 'beast_blackbear'
    };

    // ============== 3. 工具 ==============
    function getPlaceableCells(map, terrainTypes) {
        if (!map) return [];
        var out = [];
        for (var y = 0; y < map.length; y++) {
            if (!map[y]) continue;
            for (var x = 0; x < map[y].length; x++) {
                var cell = map[y][x];
                if (!cell || !cell.terrain) continue;
                var tName = cell.terrain.name || (cell.terrain.symbol === '⬜' ? 'PLAIN' : '');
                if (terrainTypes.indexOf(tName) >= 0) out.push({ x: x, y: y, terrain: cell.terrain });
            }
        }
        return out;
    }

    function getBeastPoolForRegion(region, terrainName) {
        var pool = BEAST_DISTRIBUTION.filter(function (b) {
            if (b.regions.indexOf(region) < 0) return false;
            if (terrainName && b.terrains.indexOf(terrainName) < 0) return false;
            return true;
        });
        if (window.BeastTide && typeof window.BeastTide.isRaidActive === 'function' && window.BeastTide.isRaidActive()) {
            var extra = window.BeastTide.getCurrentPool ? window.BeastTide.getCurrentPool() : [];
            var have = {};
            for (var i = 0; i < pool.length; i++) have[pool[i].id] = true;
            for (var j = 0; j < extra.length; j++) {
                var eid = extra[j];
                if (have[eid]) continue;
                var found = BEAST_DISTRIBUTION.filter(function (b) { return b.id === eid; })[0];
                if (found) {
                    pool.push(found);
                    have[eid] = true;
                } else {
                    pool.push({ id: eid, name: eid, level: 20, regions: [region], terrains: terrainName ? [terrainName] : [], type: 'beast', _tideRare: true });
                    have[eid] = true;
                }
            }
        }
        return pool;
    }

    function getTerrainName(cell) {
        if (!cell || !cell.terrain) return null;
        if (typeof cell.terrain === 'string') return cell.terrain;
        return cell.terrain.name || null;
    }

    // ============== 4. 公开 API ==============
    function populateBeasts(map, region, opts) {
        opts = opts || {};
        if (!map) return { placed: 0, byBeast: {} };
        var density = opts.density || 0.04; // 默认 4% 格子放灵兽
        if (window.BeastTide && typeof window.BeastTide.isRaidActive === 'function' && window.BeastTide.isRaidActive()) {
            var boost = window.BeastTide.getRarityBoost ? window.BeastTide.getRarityBoost() : 1;
            density = Math.min(0.25, density * (1 + 0.4 * boost));
        }
        var maxPerCell = opts.maxPerCell || 2;
        var byBeast = {};
        var placed = 0;
        for (var y = 0; y < map.length; y++) {
            if (!map[y]) continue;
            for (var x = 0; x < map[y].length; x++) {
                if (Math.random() > density) continue;
                var cell = map[y][x];
                if (!cell) continue;
                var tName = getTerrainName(cell);
                if (!tName) continue;
                var pool = getBeastPoolForRegion(region, tName);
                if (pool.length === 0) continue;
                var beast = pool[Math.floor(Math.random() * pool.length)];
                cell.entities = cell.entities || [];
                if (cell.entities.length >= maxPerCell) continue;
                var existing = cell.entities.find(function (e) { return e && e.id === beast.id; });
                if (existing) continue;
                cell.entities.push({
                    id: beast.id,
                    name: beast.name,
                    type: beast.type,
                    level: beast.level,
                    _alive: true
                });
                byBeast[beast.id] = (byBeast[beast.id] || 0) + 1;
                placed++;
                if (window.EventBus) window.EventBus.emit('beast:ecosystem:placed', { beastId: beast.id, x: x, y: y, region: region });
            }
        }
        return { placed: placed, byBeast: byBeast };
    }

    function markEntityDead(cellRef, entityIdx) {
        if (!cellRef || !cellRef.entities || entityIdx < 0 || entityIdx >= cellRef.entities.length) return false;
        var e = cellRef.entities[entityIdx];
        if (!e) return false;
        e._alive = false;
        e.isDead = true;
        e.hp = 0;
        return true;
    }

    function isEntityDead(e) {
        if (!e) return true;
        if (e.isDead || e.isCorpse) return true;
        if (typeof e.hp === 'number' && e.hp <= 0) return true;
        if (e._alive === false) return true;
        return false;
    }

    // 玩家当前 spiritBeasts（兼容 currentCharData 多种结构）
    var TEMPLATE_TO_ECO = {
        spirit_fox: 'beast_lingfox', wind_wolf: 'beast_windwolf', ice_serpent: 'beast_icesnake',
        thunder_eagle: 'beast_thundereagle', dragon_turtle: 'beast_dragonturtle', fire_phoenix: 'beast_firephoenix',
        beast_lingfox: 'beast_lingfox', beast_windwolf: 'beast_windwolf', beast_icesnake: 'beast_icesnake',
        beast_thundereagle: 'beast_thundereagle', beast_dragonturtle: 'beast_dragonturtle', beast_firephoenix: 'beast_firephoenix'
    };

    function getPlayerBeasts() {
        if (window.tamedBeasts && window.tamedBeasts.length) return window.tamedBeasts;
        var cd = (typeof window.getCurrentCharData === 'function') ? window.getCurrentCharData() : window.currentCharData;
        if (!cd) return [];
        return cd.spiritBeasts || cd.pets || cd.spiritPets || [];
    }

    function normalizeBeastId(b) {
        if (!b) return null;
        if (typeof b === 'string') return BEAST_NAME_TO_ID[b] || TEMPLATE_TO_ECO[b] || b;
        var raw = b.templateId || b.id || b.species || b.name || null;
        if (!raw) return null;
        return TEMPLATE_TO_ECO[raw] || BEAST_NAME_TO_ID[raw] || raw;
    }

    // 6 类非战斗功能 getter
    function getActiveBeastBuff(category) {
        var beasts = getPlayerBeasts();
        var total = 0;
        for (var i = 0; i < beasts.length; i++) {
            var id = normalizeBeastId(beasts[i]);
            var buff = BEAST_BUFFS[id];
            if (buff && buff.category === category) {
                total += buff.mul;
            }
        }
        return total;
    }

    function getBuffList() {
        var beasts = getPlayerBeasts();
        var out = [];
        for (var i = 0; i < beasts.length; i++) {
            var id = normalizeBeastId(beasts[i]);
            var buff = BEAST_BUFFS[id];
            if (buff) {
                out.push({ beastId: id, category: buff.category, mul: buff.mul, desc: buff.desc });
                if (window.EventBus) window.EventBus.emit('beast:ecosystem:buffApplied', { beastId: id, category: buff.category });
            }
        }
        return out;
    }

    // ============== 5. StateRegistry ==============
    var _state = {
        distributionCount: {}  // region → beastId → count（最新 populateBeasts 结果）
    };

    function _exportState() { return JSON.parse(JSON.stringify(_state)); }
    function _importState(s) {
        if (!s) return;
        if (s.distributionCount && typeof s.distributionCount === 'object') _state.distributionCount = s.distributionCount;
    }
    function _resetState() { _state.distributionCount = {}; }

    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        try {
            window.StateRegistry.register('beastEcosystem', { version: 1, export: _exportState, import: _importState, reset: _resetState });
        } catch (e) {}
    }

    // ============== 6. 暴露 + 导出 ==============
    // v19.12 修 BUG: 提供统一 isEntityDead，让 app.js 战斗胜利后调用 markEntityDead
    window.isEntityDead = isEntityDead;
    window.markEntityDead = markEntityDead;

    window.BeastEcosystem = {
        BEAST_DISTRIBUTION: BEAST_DISTRIBUTION,
        BEAST_BUFFS: BEAST_BUFFS,
        BEAST_NAME_TO_ID: BEAST_NAME_TO_ID,
        getPlaceableCells: getPlaceableCells,
        getBeastPoolForRegion: getBeastPoolForRegion,
        populateBeasts: populateBeasts,
        markEntityDead: markEntityDead,
        isEntityDead: isEntityDead,
        getPlayerBeasts: getPlayerBeasts,
        normalizeBeastId: normalizeBeastId,
        getActiveBeastBuff: getActiveBeastBuff,
        getBuffList: getBuffList,
        getState: function () { return _state; }
    };
    if (window.XianXia) window.XianXia.BeastEcosystem = window.BeastEcosystem;
    try { console.log('[BeastEcosystem] initialized v1 (' + BEAST_DISTRIBUTION.length + ' beasts, ' + Object.keys(BEAST_BUFFS).length + ' buffs)'); } catch (e) {}
})();
