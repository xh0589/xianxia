// ==================== beast-lore.js - 兽径手记·打听系统 (第八十七波) ====================
// 用户点账：灵兽图鉴的栖息地不该白给到「地区+地形」那么细——具体在哪，要靠打听得来，
// 甚至有概率听到稀有的。于是把「知道」做成玩法：
//   · 亲遇成识：野外真打了一场（不论胜负）→ 手记落一笔确讯（地区+地形）
//   · 酒楼打听：请兽贩子喝酒（铜钱+工夫）→ 听得一条兽径；一成五概率是稀有传闻
//     （五色鹿/金乌/鲲鹏/位面四兽）——稀有的只说得个大概地区，确切位置兽贩子也讲不准
//   · 图鉴只写手记里有的：确讯标地区+地形，传闻标「传闻在X」，没听过的如实标「行踪不明」
// 账本随档（StateRegistry 'beastLore'），零新 localStorage 键。
// 不设打听次数限制——每回都是真金白银加真工夫，成本就是闸（设计宪法：约束来自世界本身）。

(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    // 地形中文（与图鉴渲染同一张口——WATER 写「水岸」，浅滩沉船都算）
    // 第八十八波补齐野外全地形：放生/亲遇可能落在 ROAD、FORD 之流的格子上，
    // 表里缺谁，图鉴就把英文键名甩给玩家——一个不留。
    var TERRAIN_CN = {
        PLAIN: '平原', FOREST: '林海', MOUNTAIN: '山地', SNOW: '雪线', WATER: '水岸',
        FROZEN_LAND: '冻土', DESERT: '荒漠', SWAMP: '沼泽', VOLCANO: '火山', SPIRIT_SPRING: '灵泉',
        ROAD: '官道', FORD: '浅滩', WRECK: '沉船', GLACIER: '冰川', MIASMA: '瘴林',
        OASIS: '绿洲', QUICKSAND: '流沙', SWORDTOMB: '剑冢', OLDFIELD: '旧田', PRIMFOREST: '老林',
        QIPOOL: '灵池', BONEFIELD: '骨原', FROZEN: '冻土', SPRING: '灵泉'
    };
    function terrainCn(k) { return TERRAIN_CN[k] || k || ''; }

    // 稀有种名录（传闻档）：v20.95 三只传说级 + 第八十五波位面四兽——
    // 这些兽的行踪是江湖传闻级别的，兽贩子只说得个大概地区
    var RARE_TEMPLATE_IDS = [
        'five_color_deer', 'golden_crow', 'kunpeng',
        'cloud_horn_deer', 'gangwind_crane', 'bloodmare_hound', 'nethervein_serpent'
    ];
    var RARE_CHANCE = 0.15;   // 每回打听听到稀有传闻的概率
    // 第八十九波·鹰眼助访：随行带着能侦察的灵兽（雷鹰），兽贩子的话有天上的眼睛印证——
    // 稀有传闻的概率上浮一成。增益读生态账（getActiveBeastBuff('scout')），不另立名册。
    var SCOUT_RARE_BONUS = 0.10;
    function _scoutAboard() {
        try {
            return !!(window.BeastEcosystem && typeof window.BeastEcosystem.getActiveBeastBuff === 'function'
                && window.BeastEcosystem.getActiveBeastBuff('scout') > 0);
        } catch (e) { return false; }
    }

    var _state = {
        sightings: {}   // templateId → { region, terrain(可空), day, source, vague }
    };

    // ---------- 内部：分布表反查（名字 → 模板 id / 分布条目） ----------
    function _distEntries() {
        var eco = window.BeastEcosystem;
        return (eco && Array.isArray(eco.BEAST_DISTRIBUTION)) ? eco.BEAST_DISTRIBUTION : [];
    }
    function _templateIdByName(name) {
        var tpls = window.BEAST_TEMPLATES || {};
        for (var id in tpls) { if (tpls[id] && tpls[id].name === name) return id; }
        return null;
    }
    // 模板 id → 分布条目（野外可遇的 19 兽才有；进化形态/铺子独有兽查无 = 打听问不出）
    function _distOfTemplate(templateId) {
        var tpls = window.BEAST_TEMPLATES || {};
        var tpl = tpls[templateId];
        if (!tpl) return null;
        var list = _distEntries();
        for (var i = 0; i < list.length; i++) { if (list[i].name === tpl.name) return list[i]; }
        return null;
    }

    // ---------- 学：亲遇成识 ----------
    // 确讯（region+terrain）永远盖过传闻；传闻不降格已有的确讯。
    function learnFromSighting(templateId, region, terrainKey, source) {
        if (!templateId || !region) return null;
        var vague = !terrainKey;
        var old = _state.sightings[templateId];
        if (old && !old.vague && vague) return old;   // 手里有确讯，不收模糊话
        _state.sightings[templateId] = {
            region: region,
            terrain: vague ? '' : String(terrainKey),
            day: (typeof window.getAbsoluteDay === 'function') ? window.getAbsoluteDay() : 0,
            source: source || '听闻',
            vague: vague
        };
        return _state.sightings[templateId];
    }

    // ---------- 问：酒楼打听 ----------
    // 返回 { ok, line, templateId, name, region, terrain, vague }；骰子只在玩家主动打听时掷（不掺地图种子账）。
    function askBeastLore(regionNow) {
        var all = _distEntries();
        if (!all.length) return { ok: false, line: '兽贩子摊手：「这几年山里野兽都少了，没什么可说的。」' };
        var rare = Math.random() < (RARE_CHANCE + (_scoutAboard() ? SCOUT_RARE_BONUS : 0));
        var pool = [];
        for (var i = 0; i < all.length; i++) {
            var tid = _templateIdByName(all[i].name);
            if (!tid) continue;
            var isRare = RARE_TEMPLATE_IDS.indexOf(tid) >= 0;
            if (isRare === rare) pool.push({ entry: all[i], tid: tid });
        }
        if (!pool.length) pool = all.map(function (e) { return { entry: e, tid: _templateIdByName(e.name) }; }).filter(function (x) { return x.tid; });
        // 兽贩子走南闯北，但近来的见闻多半是本地脚程里的（有本地兽优先说本地）
        var local = [];
        if (regionNow && !rare) {
            local = pool.filter(function (x) { return x.entry.regions.indexOf(regionNow) >= 0; });
        }
        var pickFrom = local.length ? local : pool;
        var pick = pickFrom[Math.floor(Math.random() * pickFrom.length)];
        var entry = pick.entry;
        var region = entry.regions[Math.floor(Math.random() * entry.regions.length)];
        var terrain = rare ? null : entry.terrains[Math.floor(Math.random() * entry.terrains.length)];
        learnFromSighting(pick.tid, region, terrain, rare ? '兽贩子传闻' : '兽贩子指路');
        var line;
        if (rare) {
            line = '🐾 兽贩子把声音压低：「' + region + '有人见过' + entry.name + '——稀罕物，确切在哪，谁也说不准。」（稀有兽径，手记只记了个大概）';
            if (_scoutAboard()) line += '（🦅 你随行的雷鹰在天际盘旋一圈，长唳落下——兽贩子的话有鹰眼印证，比寻常可靠几分。）';
        } else {
            line = '🐾 兽贩子喝干碗里酒，拿筷子蘸着酒水在桌上画：「' + region + '的' + terrainCn(terrain) + '，前几日有人撞见过' + entry.name + '——要赶早。」';
        }
        return { ok: true, line: line, templateId: pick.tid, name: entry.name, region: region, terrain: terrain, vague: !!rare };
    }

    // ---------- 查：图鉴渲染口 ----------
    function getLore(templateId) { return _state.sightings[templateId] || null; }
    function knownCount() { return Object.keys(_state.sightings).length; }
    // 图鉴栖息地行：确讯/传闻/未知三档，进化形态与铺子门不在此列（那是公开知识）
    function loreLineFor(templateId) {
        var s = _state.sightings[templateId];
        if (!s) return '❓ 行踪不明 · 酒楼请兽贩子喝一壶可打听';
        if (s.vague) return '🗺️ 传闻在「' + s.region + '」· 确切处不明';
        return '🗺️ ' + s.region + '（' + terrainCn(s.terrain) + '）· ' + (s.source || '亲见');
    }

    // ---------- 随档 ----------
    function _exportState() { return JSON.parse(JSON.stringify(_state)); }
    function _importState(s) {
        if (!s) return;
        _state.sightings = (s.sightings && typeof s.sightings === 'object') ? s.sightings : {};
    }
    function _resetState() { _state.sightings = {}; }

    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        try {
            window.StateRegistry.register('beastLore', { version: 1, export: _exportState, import: _importState, reset: _resetState });
        } catch (e) {}
    }

    window.BeastLore = {
        TERRAIN_CN: TERRAIN_CN,
        terrainCn: terrainCn,
        RARE_TEMPLATE_IDS: RARE_TEMPLATE_IDS,
        RARE_CHANCE: RARE_CHANCE,
        SCOUT_RARE_BONUS: SCOUT_RARE_BONUS,
        learnFromSighting: learnFromSighting,
        askBeastLore: askBeastLore,
        getLore: getLore,
        loreLineFor: loreLineFor,
        knownCount: knownCount,
        distOfTemplate: _distOfTemplate,
        getState: function () { return _state; }
    };
    if (window.XianXia) window.XianXia.BeastLore = window.BeastLore;
    try { console.log('[BeastLore] initialized v1 (' + RARE_TEMPLATE_IDS.length + ' rare rumor beasts)'); } catch (e) {}
})();
