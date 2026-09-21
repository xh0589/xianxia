// ==================== beast-ecosystem.js - 灵兽生态·地图分布 (v19.12 P0) ====================
// 对标 v18.8 路线图 §7.2 灵兽生态 + §7.1 非战斗功能 + 修 BUG（尸体扑上来）。
// 10 灵兽 × 7 地区 × 多地形分布；6 类非战斗功能；统一 markEntityDead API。

(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    // ============== 1. 灵兽分布表：19 兽 × 地区 × 多地形（v19.12 十三兽 + 第八十五波位面四兽 + 第八十六波收口两只） ==============
    // 第八十六波·寻兽账收口：① 死地区名修正——「东海」「天空」从来不是舆图上的域名（东海是东荒地界的城，
    //    天空是灵界的旧称），挂在上面的兽野外永远遇不到：玄龟无铺无野等于绝户、雷兽只剩高级兽潮一条缝、
    //    龙龟只卖 1800 灵石。现改认真实域名。② 火焰虎/影豹入表——灵兽坊八只货架兽里就这两只野外绝迹
    //    （其余六只坊市野外两扇门都有），补齐一致性，野外收服与坊市购入并行不悖。
    var BEAST_DISTRIBUTION = [
        { id: 'beast_lingfox',     name: '灵狐',  level: 5,  regions: ['中州', '南疆', '蜀地'],   terrains: ['PLAIN', 'FOREST'],            type: 'beast' },
        { id: 'beast_thundereagle',name: '雷鹰',  level: 12, regions: ['东荒', '东南海域'],        terrains: ['MOUNTAIN'],                  type: 'beast' },
        { id: 'beast_dragonturtle',name: '龙龟',  level: 18, regions: ['东荒', '东南海域'],        terrains: ['WATER'],                     type: 'beast' },
        { id: 'beast_icesnake',    name: '冰蛇',  level: 15, regions: ['北冥'],                     terrains: ['SNOW', 'FROZEN_LAND'],        type: 'beast' },
        { id: 'beast_windwolf',    name: '风狼',  level: 8,  regions: ['西漠', '蜀地', '中州'],     terrains: ['PLAIN', 'DESERT'],            type: 'beast' },
        { id: 'beast_firephoenix', name: '火凤',  level: 22, regions: ['南疆'],                     terrains: ['VOLCANO'],                   type: 'beast' },
        { id: 'beast_xuangui',     name: '玄龟',  level: 16, regions: ['东荒', '东南海域'],         terrains: ['WATER'],                     type: 'beast' },
        { id: 'beast_thunderbeast',name: '雷兽',  level: 20, regions: ['蜀地', '北冥'],             terrains: ['MOUNTAIN'],                  type: 'beast' },
        { id: 'beast_crane',       name: '仙鹤',  level: 10, regions: ['中州'],                     terrains: ['SPIRIT_SPRING', 'PLAIN'],    type: 'beast' },
        { id: 'beast_blackbear',   name: '黑熊',  level: 6,  regions: ['北冥', '中州', '东荒'],     terrains: ['FOREST'],                    type: 'beast' },
        // v20.95 破 22 级封顶：三只传说级野兽只栖后期地界——灵泉寻五色鹿、火山见金乌、北冥天际望鲲鹏
        { id: 'beast_fivecolordeer', name: '五色鹿', level: 28, regions: ['东荒', '蜀地'],          terrains: ['SPIRIT_SPRING'],             type: 'beast' },
        { id: 'beast_goldencrow',    name: '金乌',  level: 32, regions: ['南疆'],                    terrains: ['VOLCANO', 'MOUNTAIN'],       type: 'beast' },
        { id: 'beast_kunpeng',       name: '鲲鹏',  level: 35, regions: ['北冥'],                    terrains: ['WATER', 'MOUNTAIN', 'SNOW'], type: 'beast' },
        // 第八十五波·位面兽入分布表：v20.53 四只灵界/魔界灵兽此前只挂在过渡版捕捉链上
        //（拆了那条链就得给正门）——只在自己位面出没，等级从模板账（60~85，高位面本就是后期地界）
        { id: 'beast_cloudhorndeer',   name: '云角鹿',   level: 60, regions: ['灵界'], terrains: ['SPIRIT_SPRING', 'PLAIN', 'FOREST'], type: 'beast' },
        { id: 'beast_gangwindcrane',   name: '罡风鹤',   level: 78, regions: ['灵界'], terrains: ['MOUNTAIN'],                          type: 'beast' },
        { id: 'beast_bloodmarehound',  name: '血鬃魔犬', level: 72, regions: ['魔界'], terrains: ['DESERT', 'PLAIN'],                     type: 'beast' },
        { id: 'beast_netherveinserpent', name: '幽脉蟒', level: 85, regions: ['魔界'], terrains: ['SWAMP', 'WATER'],                      type: 'beast' },
        // 第八十六波·坊市独苗补齐：火焰虎踏火山荒漠（模板账：南疆/西漠），影豹潜林（模板账：南疆/迷雾森林）
        { id: 'beast_flametiger',    name: '火焰虎', level: 20, regions: ['南疆', '西漠'],          terrains: ['VOLCANO', 'DESERT'],          type: 'beast' },
        { id: 'beast_shadowpanther', name: '影豹',   level: 30, regions: ['南疆', '蜀地'],          terrains: ['FOREST'],                    type: 'beast' }
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
        '玄龟': 'beast_xuangui', '雷兽': 'beast_thunderbeast', '仙鹤': 'beast_crane', '黑熊': 'beast_blackbear',
        '五色鹿': 'beast_fivecolordeer', '金乌': 'beast_goldencrow', '鲲鹏': 'beast_kunpeng',
        '云角鹿': 'beast_cloudhorndeer', '罡风鹤': 'beast_gangwindcrane', '血鬃魔犬': 'beast_bloodmarehound', '幽脉蟒': 'beast_netherveinserpent',
        '火焰虎': 'beast_flametiger', '影豹': 'beast_shadowpanther'
    };
    // v20.0：模板名 → 生态 id 双映射（tamedBeasts 用模板名，生态用 beast_ 前缀）
    var TEMPLATE_TO_ECO = {
        spirit_fox: 'beast_lingfox', wind_wolf: 'beast_windwolf', ice_serpent: 'beast_icesnake',
        thunder_eagle: 'beast_thundereagle', dragon_turtle: 'beast_dragonturtle', fire_phoenix: 'beast_firephoenix',
        crane: 'beast_crane', xuan_gui: 'beast_xuangui', thunder_beast: 'beast_thunderbeast', black_bear: 'beast_blackbear',
        five_color_deer: 'beast_fivecolordeer', golden_crow: 'beast_goldencrow', kunpeng: 'beast_kunpeng',
        cloud_horn_deer: 'beast_cloudhorndeer', gangwind_crane: 'beast_gangwindcrane',
        bloodmare_hound: 'beast_bloodmarehound', nethervein_serpent: 'beast_netherveinserpent',
        flame_tiger: 'beast_flametiger', shadow_panther: 'beast_shadowpanther',
        beast_lingfox: 'beast_lingfox', beast_windwolf: 'beast_windwolf', beast_icesnake: 'beast_icesnake',
        beast_thundereagle: 'beast_thundereagle', beast_dragonturtle: 'beast_dragonturtle', beast_firephoenix: 'beast_firephoenix'
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
        return BEAST_DISTRIBUTION.filter(function (b) {
            if (b.regions.indexOf(region) < 0) return false;
            if (terrainName && b.terrains.indexOf(terrainName) < 0) return false;
            return true;
        });
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
    // 第八十四波·真源接线：驯养名单的唯一真源是 beast-taming 的 window.tamedBeasts——
    // 旧版只读 currentCharData.spiritBeasts/pets/spiritPets 三个全库无人写过的字段，
    // 导致六类非战斗增益（寻宝/侦察/负重/寒药/引路/火候）的消费端全部恒读 0（死线）。
    function getPlayerBeasts() {
        if (Array.isArray(window.tamedBeasts) && window.tamedBeasts.length) return window.tamedBeasts;
        var cd = (typeof window.getCurrentCharData === 'function') ? window.getCurrentCharData() : window.currentCharData;
        if (!cd) return [];
        return cd.spiritBeasts || cd.pets || cd.spiritPets || [];
    }

    function normalizeBeastId(b) {
        if (!b) return null;
        if (typeof b === 'string') return TEMPLATE_TO_ECO[b] || BEAST_NAME_TO_ID[b] || b;
        var raw = b.templateId || b.id || b.species || b.name || null;
        if (!raw) return null;
        return TEMPLATE_TO_ECO[raw] || BEAST_NAME_TO_ID[raw] || raw;
    }

    // 6 类非战斗功能 getter
    // 第八十四波：进化线阶段增益（灵狐系寻宝/火凤系火候/龙龟系负重）并入同一口径——
    // 此前 BeastEvolution 的 stage.buff 全库无消费端，进化了也白进化。
    function _lineBuffOf(b, i, category) {
        try {
            if (!window.BeastEvolution || typeof window.BeastEvolution.getBuff !== 'function') return 0;
            var bid = b.uid || ((b.templateId || '') + '_' + i);
            // 血脉成年才显——幼体阶段不叠加（物种账已在 BEAST_BUFFS 里记过一遍，不双算）
            var st = (typeof window.BeastEvolution.getStage === 'function') ? window.BeastEvolution.getStage(bid) : null;
            if (!st || st === 'infant') return 0;
            var buf = window.BeastEvolution.getBuff(bid) || {};
            var v = Number(buf[category]);
            return (isFinite(v) && v > 0) ? v : 0;
        } catch (e) { return 0; }
    }

    function getActiveBeastBuff(category) {
        var beasts = getPlayerBeasts();
        // 第八十九波·两种账两本算法：加成的账（寻宝/侦察/负重/寒药/火候）兽多力量大，照旧求和；
        // 倍率的账（travel 引路 ×0.8）只取最好的一笔——旧版求和，两只风狼 0.8+0.8=1.6，
        // 消费端「wolfMul<1 才提速」的判断整个失效，狼越多走得越慢，不成体统。引路的狼，一只就够。
        var total = 0;
        var best = 0;
        for (var i = 0; i < beasts.length; i++) {
            var id = normalizeBeastId(beasts[i]);
            var v = 0;
            var buff = BEAST_BUFFS[id];
            if (buff && buff.category === category) v += buff.mul;
            v += _lineBuffOf(beasts[i] || {}, i, category);
            if (!(v > 0)) continue;
            if (category === 'travel') { if (best === 0 || v < best) best = v; }
            else total += v;
        }
        return category === 'travel' ? best : total;
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

    // ============== 4b. 第八十四波·地图分布真生成 ==============
    // BEAST_DISTRIBUTION（13 兽 × 地区 × 地形）此前从未被任何地图生成器消费——
    // 可收服的名种灵兽在野外根本遇不到，只有随机杂兽（战后靠名字里带「狼/虎/蛇」瞎桥接）。
    // 现在给 randomMap 两个真接口：按地区+地形roll一只名种灵兽，并拼出能直接进战斗的敌人数据。
    var TERRAIN_ALIASES = { FROZEN: 'FROZEN_LAND', SPRING: 'SPIRIT_SPRING', RIVER_ICE: 'SNOW' };
    // 第八十六波·水岸账：舆图的深水格（WATER）不可通行，野兽只撒在能落脚的格子上——
    // 栖息水域的兽（龙龟/玄龟/鲲鹏/幽脉蟒）此前一格也生成不出来，等于分布表写了白写。
    // 水兽的现实落脚点是浅滩与沉船（可通行的水岸格），冰川与雪线同理是一家子：
    TERRAIN_ALIASES.FORD = 'WATER';      // 浅滩——水兽近岸
    TERRAIN_ALIASES.WRECK = 'WATER';     // 沉船——东南海域的水上落脚点
    TERRAIN_ALIASES.GLACIER = 'SNOW';    // 冰川——北冥雪线兽的另一个家

    function rollDistributedBeast(region, terrainKey, rngFn) {
        if (!region) return null;
        var rnd = (typeof rngFn === 'function') ? rngFn : Math.random;
        var tName = TERRAIN_ALIASES[terrainKey] || terrainKey;
        var pool = getBeastPoolForRegion(region, tName);
        if (!pool.length) return null;
        return pool[Math.floor(rnd() * pool.length)];
    }

    // eco 分布条目 → 战斗就绪的敌人数据（与 getActiveBeastCombatData 同尺度：六维随等级 ×0.08/级）
    function buildWildBeastData(ecoEntry) {
        if (!ecoEntry) return null;
        var tpl = null, tplId = null;
        var templates = window.BEAST_TEMPLATES || {};
        for (var id in templates) {
            if (templates[id] && templates[id].name === ecoEntry.name) { tpl = templates[id]; tplId = id; break; }
        }
        if (!tpl) return null;
        var base = tpl.attrs || { strength: 8, dexterity: 8, constitution: 8, willpower: 5, intelligence: 5, meridian: 5 };
        var lv = ecoEntry.level || tpl.level || 1;
        var scale = 1 + (lv - 1) * 0.08;
        var attrs = {};
        for (var k in base) attrs[k] = Math.max(1, Math.floor(base[k] * scale));
        return {
            name: tpl.name, level: lv, attrs: attrs,
            species: 'beast', physiologyType: 'beast', type: 'beast',
            combatAbilities: (tpl.innate || []).slice(),
            skills: (tpl.skills || []).slice(),
            realm: tpl.realm || '',
            aiBehavior: 'aggressive',
            loot: { exp: lv * 8, copper: lv * 3 },
            _beastTemplateId: tplId, _ecoBeastId: ecoEntry.id
        };
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
        TEMPLATE_TO_ECO: TEMPLATE_TO_ECO,
        getPlaceableCells: getPlaceableCells,
        getBeastPoolForRegion: getBeastPoolForRegion,
        populateBeasts: populateBeasts,
        rollDistributedBeast: rollDistributedBeast,
        buildWildBeastData: buildWildBeastData,
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
