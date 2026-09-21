/**
 * v21.5-city-life-node.js — 空城补人 + 共享建筑分城口吻 门禁
 *
 * 批次一：17 座空城此前只有 cityData.specialNPCs 里的名字没有实体。
 *   现在 34 位具名人物落成 SPECIAL_NPC_DATA 同构实体（可对话可送礼），
 *   每城一出「进城遇人戏」并入个人事件系统（每日轮询触发，一次性），
 *   城市面板新增「城中人物」区块（getCityResidentCards）。
 * 批次二：酒楼/客栈/茶馆 19 城共用一套话 → CITY_VOICES 分城口吻包，
 *   building-effects.js / app.js 取词，缺城缺键回落通用文案。
 *
 * 运行：node tests/v21.5-city-life-node.js
 */
'use strict';

var path = require('path');
var fs = require('fs');
var vm = require('vm');

var ROOT = path.resolve(__dirname, '..');
function loadScript(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

var passed = 0, failed = 0;
function ok(cond, label) {
    if (cond) passed++;
    else { failed++; console.log('[FAIL] ' + label); }
}

var CITIES17 = ['洛水城', '青木城', '蓬莱仙岛', '东海龙宫', '炎城', '万毒谷', '凤凰巢', '金城',
    '大漠孤城', '佛国遗址', '冰原城', '极寒之地', '万剑宗', '剑阁', '青城山', '碧落仙宫', '鲛人镇'];

// 从 cityData 源码取每城 specialNPCs 名单与 buildings（花括号配平圈定 cityData 范围，
// 防止文件后段同名城市键的其他映射串进解析）
var lsSrc = loadScript('js/location-system.js');
var cityMeta = {};
var cdAt = lsSrc.indexOf('const cityData = {');
var depth = 0, cdEnd = -1;
for (var k = lsSrc.indexOf('{', cdAt); k < lsSrc.length; k++) {
    if (lsSrc[k] === '{') depth++;
    else if (lsSrc[k] === '}') { depth--; if (depth === 0) { cdEnd = k; break; } }
}
var cdBody = lsSrc.slice(cdAt, cdEnd);
var cityRe = /^\s{4}'([^']+)': \{/gm;
var marks = [], m;
while ((m = cityRe.exec(cdBody)) !== null) marks.push({ name: m[1], at: m.index });
marks.forEach(function (mk, i) {
    var end = i + 1 < marks.length ? marks[i + 1].at : cdBody.length;
    var seg = cdBody.slice(mk.at, end);
    var nm = seg.match(/specialNPCs: \[([^\]]*)\]/);
    var bm = seg.match(/buildings: \[([^\]]*)\]/);
    cityMeta[mk.name] = {
        npcs: nm ? nm[1].match(/'([^']+)'/g).map(function (x) { return x.replace(/'/g, ''); }) : [],
        buildings: bm ? bm[1].match(/'([^']+)'/g).map(function (x) { return x.replace(/'/g, ''); }) : []
    };
});

// ============ 数据世界：加载两份内容文件 ============
var DW = { console: { log: function () {}, warn: function () {} }, Math: Math, JSON: JSON, Object: Object, Array: Array, String: String, Number: Number, isFinite: isFinite };
DW.window = DW;
vm.createContext(DW);
vm.runInContext(loadScript('js/npcs/city-residents-data.js'), DW, { filename: 'data' });
vm.runInContext(loadScript('js/npcs/city-residents-events.js'), DW, { filename: 'events' });
var npcs = DW.CITY_RESIDENT_DATA.npcs;
var events = DW.CITY_RESIDENT_DATA.events;

// ============ A 人物实体 ============
var npcIds = Object.keys(npcs);
ok(npcIds.length === 34, 'A1 34 位具名人物一个不少（实得 ' + npcIds.length + '）');
var badLoc = [], badName = [], badTree = [], badCombat = [];
npcIds.forEach(function (id) {
    var n = npcs[id];
    if (n.id !== id) badLoc.push(id + '(id键不符)');
    if (CITIES17.indexOf(n.location) < 0) { badLoc.push(id); return; }
    if ((cityMeta[n.location] || {}).npcs.indexOf(n.name) < 0) badName.push(id + ':' + n.name);
    var t = n.dialogueTree || {};
    if (!t.greeting || t.greeting.length < 3 || !t.affectionLow || t.affectionLow.length < 3 ||
        !t.affectionMid || t.affectionMid.length < 3 || !t.affectionHigh || t.affectionHigh.length < 3 ||
        !t.topics || !t.topics.gossip || !t.topics.personal) badTree.push(id);
    var c = n.combat || {};
    if (!c.realm || !c.attack || !c.defense || !c.speed) badCombat.push(id);
});
ok(badLoc.length === 0, 'A2 每人 location 落在 17 城且 id 与键一致（违例: ' + badLoc.slice(0, 3) + '）');
ok(badName.length === 0, 'A3 名字全部取自各城预留名单（违例: ' + badName.slice(0, 3) + '）');
ok(badTree.length === 0, 'A4 对话树四档台词+八卦/心事话题齐备（违例: ' + badTree.slice(0, 3) + '）');
ok(badCombat.length === 0, 'A5 战斗六维按身份在案（违例: ' + badCombat.slice(0, 3) + '）');
var perCity = {};
npcIds.forEach(function (id) { perCity[npcs[id].location] = (perCity[npcs[id].location] || 0) + 1; });
ok(CITIES17.every(function (c) { return perCity[c] === 2; }), 'A6 每城恰好两位，不偏科');

// ============ B 进城遇人戏 ============
var evIds = Object.keys(events);
ok(evIds.length === 17, 'B1 17 出进城遇人戏一个不少（实得 ' + evIds.length + '）');
var badEv = [];
var leads = { p1: 0, p2: 0 };
evIds.forEach(function (eid) {
    var e = events[eid];
    var city = eid.replace('cres_ev_', '');
    if (CITIES17.indexOf(city) < 0) { badEv.push(eid + '(城名)'); return; }
    if (!npcs[e.npcId]) { badEv.push(eid + '(npcId悬空)'); return; }
    if (e.npcId.slice(-1) === '1') leads.p1++; else leads.p2++;
    if (!e.autoTrigger || e.autoTrigger.location !== city) badEv.push(eid + '(autoTrigger)');
    if (e.flag !== 'cres_ef_' + city) badEv.push(eid + '(flag)');
    var last = e.scenes[e.scenes.length - 1];
    if (!last || last.speaker !== 'player_select' || last.options.length !== 3) { badEv.push(eid + '(末段抉择)'); return; }
    var effs = last.options.map(function (o) { return o.effect; });
    if (new Set(effs).size !== 3) badEv.push(eid + '(effect重复)');
    if (!last.options.some(function (o) { return o.affection <= 3; })) badEv.push(eid + '(无不客气选项)');
    // effects 函数对每个分支都给非空回话
    last.options.forEach(function (o) {
        var r = e.effects({ name: 'x' }, o.effect);
        if (!r || !r.msg || typeof r.affection !== 'number') badEv.push(eid + '(effects:' + o.effect + ')');
    });
});
ok(badEv.length === 0, 'B2 事件结构/触发地/flag/三分支/effects 全合规（违例: ' + badEv.slice(0, 4) + '）');
ok(leads.p1 >= 5 && leads.p2 >= 5, 'B3 两位人物都当过主角（人物1 ' + leads.p1 + ' 城 / 人物2 ' + leads.p2 + ' 城）');
var flags = evIds.map(function (e) { return events[e].flag; });
ok(new Set(flags).size === 17, 'B4 17 面旗互不重名（一次性不刷）');

// ============ C 接线（运行时） ============
var fired = [];
var triggered = {};
var dayHooks = [];
var CW = {
    console: { log: function () {}, warn: function () {} },
    Math: Math, JSON: JSON, Object: Object, Array: Array, String: String, Number: Number, isFinite: isFinite,
    document: { querySelector: function () { return null; } },
    SPECIAL_NPC_DATA: {}, NPC_PERSONAL_EVENTS: {},
    npcManager: { getNPC: function (id) { return npcs[id] ? { id: id, name: npcs[id].name, relationship: { affection: 0 } } : null; } },
    currentCharData: { location: '洛水城' },
    timeSystem: { onNewDaySubscribe: function (fn) { dayHooks.push(fn); } },
    hasEventTriggered: function (eid) { return !!triggered[eid]; },
    triggerPersonalEvent: function (eid) { fired.push(eid); triggered[eid] = true; }
};
CW.window = CW;
CW.CITY_RESIDENT_DATA = DW.CITY_RESIDENT_DATA;
vm.createContext(CW);
vm.runInContext(loadScript('js/npcs/city-residents.js'), CW, { filename: 'residents' });
ok(Object.keys(CW.SPECIAL_NPC_DATA).length === 34, 'C1 34 位人物并入 SPECIAL_NPC_DATA（initNPCSystem 即实例化）');
ok(Object.keys(CW.NPC_PERSONAL_EVENTS).length === 17, 'C2 17 出戏并入个人事件系统');
ok(dayHooks.length === 1, 'C3 每日轮询已挂上新日历');
var origRandom = Math.random;
Math.random = function () { return 0.1; }; // 必中 0.35
dayHooks[0]();
ok(fired.length === 1 && fired[0] === 'cres_ev_洛水城', 'C4 住在洛水城次日撞见本城人物（触发 ' + fired.join(',') + '）');
dayHooks[0]();
ok(fired.length === 1, 'C5 一次性：已触发过的戏不重演');
CW.currentCharData.location = '剑阁';
Math.random = function () { return 0.1; };
dayHooks[0]();
ok(fired.length === 2 && fired[1] === 'cres_ev_剑阁', 'C6 换城撞见换城的人（不跨城串门）');
Math.random = origRandom;
// 城市面板人物区块
CW.npcManager.getNPCsAtLocation = function (city) {
    return Object.keys(npcs).filter(function (id) { return npcs[id].location === city; })
        .map(function (id) { return { id: id, name: npcs[id].name, occupation: npcs[id].occupation, icon: npcs[id].icon, appearance: {} }; });
};
var cards = CW.getCityResidentCards('洛水城');
ok(cards.indexOf('城中人物') >= 0 && cards.indexOf('画圣·吴道子') >= 0 && cards.indexOf('诗仙·李太白') >= 0 &&
    /showNPCDialog\('cres_洛水城_1'\)/.test(cards), 'C7 城市面板人物区块：两位都在、攀谈按钮直连对话');
ok(CW.getCityResidentCards('太虚山') === '' || CW.getCityResidentCards('太虚山').indexOf('showNPCDialog') >= 0,
    'C8 无新城人物的城市不硬造区块（太虚山只有旧实体则照常列）');
ok(/getCityResidentCards\(cityName\)/.test(lsSrc), 'C9 城市面板已接线人物区块（location-system 调用在案）');

// ============ D 分城口吻 ============
var VW = { console: { log: function () {} }, Math: Math, JSON: JSON, Object: Object, Array: Array, String: String, Number: Number };
VW.window = VW;
vm.createContext(VW);
vm.runInContext(loadScript('js/city-facilities/city-voices.js'), VW, { filename: 'voices' });
var VOICES = VW.CITY_VOICES;
var voiceCities = Object.keys(VOICES);
ok(voiceCities.length >= 12, 'D1 口吻包覆盖至少 12 城（实得 ' + voiceCities.length + '）');
var badVoice = [];
voiceCities.forEach(function (c) {
    if (!cityMeta[c]) { badVoice.push(c + '(不存在的城)'); return; }
    var bs = cityMeta[c].buildings;
    Object.keys(VOICES[c]).forEach(function (b) {
        var need = b === 'teaHouse' ? 'tea_house' : b;
        if (bs.indexOf(need) < 0) badVoice.push(c + '.' + b + '(城无此楼)');
    });
    if (VOICES[c].tavern) {
        var t = VOICES[c].tavern;
        if (!t.open || !t.meet || !Array.isArray(t.drink) || t.drink.length !== 3) badVoice.push(c + '.tavern(键不全)');
    }
    if (VOICES[c].inn) {
        var n = VOICES[c].inn;
        if (!n.open || !n.rest || !n.room) badVoice.push(c + '.inn(键不全)');
    }
    if (VOICES[c].teaHouse) {
        var h = VOICES[c].teaHouse;
        if (!h.opener || !Array.isArray(h.idle) || h.idle.length !== 2) badVoice.push(c + '.teaHouse(键不全)');
    }
});
ok(badVoice.length === 0, 'D2 每城只写自己有的楼、键齐数组足（违例: ' + badVoice.slice(0, 4) + '）');
ok(VW.CityVoices.vo('不存在城', 'inn', 'rest', '回落') === '回落', 'D3 缺城回落通用文案');
ok(VW.CityVoices.vo('帝都·长安', 'inn', '没有这个键', '回落') === '回落', 'D4 缺键回落通用文案');
var drinkLine = VW.CityVoices.vo('帝都·长安', 'tavern', 'drink', '回落');
ok(VOICES['帝都·长安'].tavern.drink.indexOf(drinkLine) >= 0, 'D5 数组键随机取一条池内词');
// 钩子在案
var beSrc = loadScript('js/building-effects.js');
["cityVoice('inn', 'rest'", "cityVoice('inn', 'room'", "cityVoice('inn', 'open'", "cityVoice('tavern', 'drink'", "cityVoice('tavern', 'meet'", "cityVoice('tavern', 'open'"].forEach(function (h) {
    ok(beSrc.indexOf(h) >= 0, 'D6 钩子在案：' + h);
});
ok(/CityVoices\.vo\(teaCity, 'teaHouse', 'opener'/.test(loadScript('js/app.js')), 'D7 茶馆说书人开场白按城取词');

// ============ E 运行时口吻 + 页面接线 ============
var BW = {
    console: { log: function () {}, warn: function () {} },
    Math: Math, JSON: JSON, Object: Object, Array: Array, String: String, Number: Number, isFinite: isFinite, Date: Date,
    document: { readyState: 'complete', addEventListener: function () {}, getElementById: function () { return null; },
        createElement: function () { return { style: {}, classList: { add: function () {}, remove: function () {} }, appendChild: function () {}, innerHTML: '' }; },
        querySelector: function () { return null; }, body: {} },
    currentCharData: { location: '鲛人镇', health: 50, maxHealth: 100, qi: 50, maxQi: 100, energy: 50, maxEnergy: 100, copper: 100 },
    XianXia: { DataManager: { getSpiritStones: function () { return 100; }, deductSpiritStones: function () { return true; }, deductCopper: function () { return true; } } },
    timeSystem: { advanceTime: function () {} },
    updateStatusPanel: function () {},
    CityVoices: VW.CityVoices, CITY_VOICES: VOICES
};
BW.window = BW;
var msgs = [];
BW.showMessage = function (t) { msgs.push(String(t)); };
vm.createContext(BW);
vm.runInContext(loadScript('js/building-effects.js'), BW, { filename: 'be' });
// v23.1 客栈睡眠分质量档（酣睡/浅眠/被吵醒）——钉住随机数验账：0.5 落酣睡档
var _origRandomE1 = Math.random;
Math.random = function () { return 0.5; };
try { BW.buildingEffects.useBuildingEffect('inn', 'rest'); } finally { Math.random = _origRandomE1; }
ok(msgs.length === 1 && msgs[0].indexOf(VOICES['鲛人镇'].inn.rest) >= 0 && msgs[0].indexOf('状态完全恢复') >= 0,
    'E1 鲛人镇住店说鲛人镇的话，恢复结算不含糊（' + msgs[0].slice(0, 24) + '…）');
// v23.1 浅眠档如实报折扣（0.05 落「被夜半动静吵醒」档）
// 第九十五波·NEW-27②：歇脚加了满状态守卫（三项全满不再收钱空推时间），E1 那一觉已睡满——
// 这里先把角色打回非满，才轮得到浅眠折扣分支（否则被守卫如实拦下，测不到六成账）
msgs.length = 0;
BW.currentCharData.health = 50; BW.currentCharData.qi = 50; BW.currentCharData.energy = 50;
Math.random = function () { return 0.05; };
try { BW.buildingEffects.useBuildingEffect('inn', 'rest'); } finally { Math.random = _origRandomE1; }
ok(msgs.length === 1 && msgs[0].indexOf('只恢复了六成') >= 0,
    'E1b 睡不安稳就只恢复六成——账目如实上屏，不再一律「完全恢复」');
ok(/city-residents-data\.js[\s\S]*city-residents-events\.js[\s\S]*city-residents\.js/.test(loadScript('仙侠.html')),
    'E2 页面加载序：数据→戏→接线');
ok(/city-voices\.js/.test(loadScript('仙侠.html')), 'E3 口吻包已挂上页面');

console.log('v21.5 城市人气: ' + passed + ' 通过, ' + failed + ' 失败');
process.exit(failed ? 1 : 0);
