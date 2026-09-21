/**
 * wave85-beast-logic-node.js — 第八十五波 · 灵兽逻辑收口与残留清理 验收：
 *   A 羁绊反哺摘除：兽亲密度不再凭空改写主人先天体质（体魄账只留在出战兽六维缩放里）
 *   B 过渡版捕捉链拆除：图鉴「捕捉」按钮/主动捕捉三件套/白话提示全清（收服只走战后正门与灵兽坊）
 *   C 物种账：名字瞎猜桥摘除——杂兽（野狼/雪狼）不再被当成风狼收服，只认精确匹配
 *   D 血脉谱收口：狐线只收狐、凤线收凤（含成年火凤）、龟线收龟（含玄龟）；风狼黑熊不入线；旧档错挂开机洗册
 *   E 位面兽正门：四只灵界/魔界灵兽入分布表（拆了过渡链就得给正门），17 兽全桥得回模板
 *   F 骑乘陪伴按天记账：连点按钮不再白刷亲密度
 *   G 哨兵：新话术零混排、第八十四波接线原样、存档注册原样
 *
 * 运行：node tests/wave85-beast-logic-node.js
 */
'use strict';

var fs = require('fs');
var vm = require('vm');
var path = require('path');
var ROOT = path.resolve(__dirname, '..');

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; console.log('  ✓ ' + msg); }
    else { failed++; console.error('  ✗ ' + msg); }
}
function eq(a, b, msg) { assert(a === b, msg + '（实际=' + JSON.stringify(a) + ' 期望=' + JSON.stringify(b) + '）'); }
function load(rel) {
    vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel });
}
function src(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ==================== 世界桩 ====================
global.window = global;
var msgs = [], timeCalls = [];
global.showMessage = function (m, t) { msgs.push(String(m)); };
global.gameLog = { add: function (m) { msgs.push(String(m)); } };
global.showModal = function (t) { msgs.push('[modal]' + t); };
global.document = {
    createElement: function () { return { id: '', className: '', innerHTML: '', style: {}, classList: { add: function () {}, remove: function () {}, contains: function () { return false; } }, appendChild: function () {}, remove: function () {}, onclick: null }; },
    getElementById: function () { return null; },
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    addEventListener: function () {},
    body: { appendChild: function () {} },
    readyState: 'complete'
};
var store = {};
global.localStorage = {
    getItem: function (k) { return store[k] !== undefined ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; }
};
var CUR_DAY = 100;
global.getAbsoluteDay = function () { return CUR_DAY; };
global.WorldCalendar = { get day() { return CUR_DAY; } };
global.timeSystem = {
    gameTime: { totalMinutes: 600 },
    advanceTime: function (m, r) { timeCalls.push({ m: m, r: String(r || '') }); },
    getAbsoluteDay: function () { return CUR_DAY; },
    onNewDaySubscribe: function () {}
};
global.EventBus = { emit: function () {}, on: function () {} };
global.updateInventoryUI = function () {};
global.updateCurrencyUI = function () {};
global.updateCharacterStatus = function () {};
global.renderBeastList = function () {};
global.getLifeSkill = function () { return 0; };
global.growLifeSkill = function () {};
global.itemById = {};
global.currentCharData = { realm: '金丹', spiritStones: 1000, copper: 0, combatAbilities: [] };
global.inventory = { currency: { spiritStones: 1000, copper: 0 }, slots: [], maxSlots: 30 };
var REALMS = { '炼气': 0, '筑基': 1, '金丹': 2, '元婴': 3, '化神': 4, '炼虚': 5 };
global.REALM_CONFIG = REALMS;
global.getRealmIndex = function (r) { return REALMS[r] != null ? REALMS[r] : -1; };

load('js/beast-taming.js');
load('js/extensions/beast-ecosystem.js');
load('js/extensions/beast-evolution.js');

var ECO = global.BeastEcosystem;
var EVO = global.BeastEvolution;
function clearBeasts() {
    global.importBeastState({ beasts: [], activeBeastIndex: -1, activeMountIndex: -1 });
    Object.keys(EVO.getState().beasts).forEach(function (k) { EVO.forget(k); });
    msgs.length = 0; timeCalls.length = 0;
}
function addBeast(templateId, over) {
    var tpl = global.BEAST_TEMPLATES[templateId];
    var b = Object.assign({
        templateId: templateId, name: tpl.name, level: 1, exp: 0, affection: 50,
        skills: (tpl.skills || []).slice(), combatAbilities: [], trait: null,
        mount: tpl.mount ? Object.assign({}, tpl.mount) : null
    }, over || {});
    global.tamedBeasts.push(b);
    global.tryRegisterTamedBeast(global.tamedBeasts.length - 1);
    return b;
}

// ==================== A · 羁绊反哺摘除 ====================
console.log('\n[A] 羁绊反哺摘除（兽再亲也不凭空改写主人先天体质）');
var battleSrc = src('js/battle.js');
assert(battleSrc.indexOf('fxb_petbond') < 0, 'A1 反哺 buff 键全库绝迹');
assert(battleSrc.indexOf('羁绊反哺') < 0 || battleSrc.indexOf('第八十五波·逻辑收口') >= 0, 'A2 反哺账注销有波次说明（不是悄悄删的）');
eq((battleSrc.match(/constitution: 3/g) || []).length, 0, 'A3 「体质+3」的凭空账没了');
assert(battleSrc.indexOf('灵兽「') >= 0 && battleSrc.indexOf('加入战斗') >= 0, 'A4 灵兽参战本体原样（只摘反哺，不动出战）');
var btSrc = src('js/beast-taming.js');
assert(btSrc.indexOf('心意相通') >= 0, 'A5 羁绊的正账还在：心意相通缩放的是出战兽自己的六维');

// ==================== B · 过渡版捕捉链拆除 ====================
console.log('\n[B] 过渡版捕捉链拆除（收服只走正门）');
eq(typeof global.captureBeast, 'undefined', 'B1 captureBeast 出口已拆');
eq(typeof global.canCaptureInCurrentLocation, 'undefined', 'B2 地点判定出口已拆');
eq(typeof global.getCatchableBeastsHere, 'undefined', 'B3 可捕清单出口已拆');
assert(btSrc.indexOf('过渡版') < 0 || btSrc.indexOf('过渡版主动捕捉已拆除') >= 0 || btSrc.indexOf('过渡版「主动捕捉」三件套') >= 0, 'B4 「过渡版捕捉」提示语绝迹（只留拆除说明）');
assert(btSrc.indexOf('function captureBeast(') < 0, 'B5 函数本体拆净');
var appSrc = src('js/app.js');
assert(appSrc.indexOf('onclick="captureBeast(') < 0, 'B6 图鉴「捕捉」按钮拆净');
assert(appSrc.indexOf('未收服') >= 0, 'B7 图鉴未收服的兽如实标灰字（不再挂假按钮）');
assert(btSrc.indexOf('captureBeastAfterBattle') >= 0 && btSrc.indexOf('window.captureBeastAfterBattle') >= 0, 'B8 战后收服正门原样');
assert(btSrc.indexOf('window.buyBeast') >= 0, 'B9 灵兽坊买兽正门原样');

// ==================== C · 物种账（瞎猜桥摘除） ====================
console.log('\n[C] 物种账：杂兽是杂兽，灵兽是灵兽');
eq(global.getBeastTemplateIdFromEnemy({ name: '灵狐' }), 'spirit_fox', 'C1 名种精确命中');
eq(global.getBeastTemplateIdFromEnemy({ name: '野狼' }), null, 'C2 野狼不再被瞎猜成风狼');
eq(global.getBeastTemplateIdFromEnemy({ name: '雪狼' }), null, 'C3 雪狼不是冰蛇也不是风狼');
eq(global.getBeastTemplateIdFromEnemy({ name: '毒蟒' }), null, 'C4 毒蟒不是冰蛇');
eq(global.getBeastTemplateIdFromEnemy({ name: '白狐' }), null, 'C5 白狐不是灵狐（名种自报家门才认）');
eq(global.getBeastTemplateIdFromEnemy({ name: '云角鹿' }), 'cloud_horn_deer', 'C6 位面名种精确命中');
eq(global.getBeastTemplateIdFromEnemy(null), null, 'C7 空敌回空');
var guessSrc = btSrc.slice(btSrc.indexOf('function getBeastTemplateIdFromEnemy'), btSrc.indexOf('function captureBeastAfterBattle'));
eq((guessSrc.match(/indexOf\('/g) || []).length, 0, 'C8 八条「名里带X就算Y」的猜桥一条不留');
// 收服闸口如实回绝杂兽
msgs.length = 0;
eq(global.captureBeastAfterBattle({ name: '野狼', level: 2, species: 'beast', physiology: { isUnconscious: true } }), false, 'C9 打赢野狼也收不成灵兽（寻常野味不入谱）');
assert(msgs.some(function (m) { return m.indexOf('无法收服') >= 0; }), 'C10 回绝时有实话');

// ==================== D · 血脉谱收口 ====================
console.log('\n[D] 血脉谱：狐线只收狐，不再「万兽皆狐」');
clearBeasts();
var fox = addBeast('spirit_fox');
eq(EVO.getLine(fox.uid), 'line_fox', 'D1 灵狐入狐线');
clearBeasts();
var wolf = addBeast('wind_wolf');
eq(EVO.getLine(wolf.uid), null, 'D2 风狼不入狐线（狼蜕九尾灵狐是笑话）');
clearBeasts();
var bear = addBeast('black_bear');
eq(EVO.getLine(bear.uid), null, 'D3 黑熊不入线（旧版兜底全记狐线）');
clearBeasts();
var gui = addBeast('xuan_gui');
eq(EVO.getLine(gui.uid), 'line_dragon', 'D4 玄龟归龟线（幼龟→灵龟→玄龙本就是龟的谱）');
clearBeasts();
var phx = addBeast('fire_phoenix_adult');
eq(EVO.getLine(phx.uid), 'line_phoenix', 'D5 成年火凤接续凤线');
// 无线兽的进化口如实回话（不亮假提示）
clearBeasts();
addBeast('black_bear');
global.evolveBeastLine(0);
assert(msgs.some(function (m) { return m.indexOf('血脉未入册') >= 0; }), 'D6 无线兽点血脉进化如实回「血脉未入册」');
// 旧档洗册：错挂狐线的黑熊开机清册，灵狐的册不动
clearBeasts();
var bear2 = addBeast('black_bear');
var fox2 = addBeast('spirit_fox');
EVO.initBeast(bear2.uid, 'line_fox');   // 模拟旧版兜底错挂
EVO.setBondDays(bear2.uid, 80);
eq(EVO.getLine(bear2.uid), 'line_fox', 'D7 洗册前：黑熊错挂狐线（旧档形态）');
var swept = global.sweepInvalidBeastLines();
eq(swept, 1, 'D8 开机洗册清掉一笔错账');
eq(EVO.getLine(bear2.uid), null, 'D9 黑熊错挂已清');
eq(EVO.getLine(fox2.uid), 'line_fox', 'D10 灵狐的正册分毫未动');
assert(btSrc.indexOf("|| 'line_fox'") < 0, 'D11 狐线兜底源码绝迹');
// initBeastTaming 接了洗册（读档路径自动清）
assert(btSrc.indexOf('sweepInvalidBeastLines(); } catch (eSweep)') >= 0, 'D12 开机/读档入口接上洗册');

// ==================== E · 位面兽正门 ====================
console.log('\n[E] 位面兽入分布表（拆了过渡链，正门给足）');
eq(ECO.BEAST_DISTRIBUTION.length, 19, 'E1 分布表 13+4+2=19 兽（第八十六波补火焰虎/影豹）');
function poolNames(region, terrain) {
    return ECO.getBeastPoolForRegion(region, terrain).map(function (d) { return d.name; });
}
assert(poolNames('灵界', 'SPIRIT_SPRING').indexOf('云角鹿') >= 0, 'E2 灵界灵泉遇云角鹿');
assert(poolNames('灵界', 'MOUNTAIN').indexOf('罡风鹤') >= 0, 'E3 灵界山线遇罡风鹤');
assert(poolNames('魔界', 'DESERT').indexOf('血鬃魔犬') >= 0, 'E4 魔界沙原遇血鬃魔犬');
assert(poolNames('魔界', 'SWAMP').indexOf('幽脉蟒') >= 0, 'E5 魔界沼泽遇幽脉蟒');
assert(poolNames('中州', 'PLAIN').every(function (n) { return ['云角鹿', '罡风鹤', '血鬃魔犬', '幽脉蟒'].indexOf(n) < 0; }), 'E6 位面兽不越界到人间');
assert(poolNames('灵界', 'MOUNTAIN').indexOf('血鬃魔犬') < 0, 'E7 灵界遇不上魔界兽（两界分明）');
var allBridge = ECO.BEAST_DISTRIBUTION.every(function (e) { return !!ECO.buildWildBeastData(e); });
eq(allBridge, true, 'E8 17 兽全部桥得回模板（战斗数据+收服精确匹配）');
var deerData = ECO.buildWildBeastData(ECO.BEAST_DISTRIBUTION.filter(function (e) { return e.name === '云角鹿'; })[0]);
eq(deerData.level, 60, 'E9 位面兽等级从模板账（60 级元婴档，不是杂兽的 1-3 级）');
eq(deerData._beastTemplateId, 'cloud_horn_deer', 'E10 反向映射精确');

// ==================== F · 骑乘陪伴按天 ====================
console.log('\n[F] 骑乘陪伴按天记账（连点按钮刷不出心意相通）');
clearBeasts();
var mw = addBeast('wind_wolf', { affection: 50 });
CUR_DAY = 100;
eq(global.setActiveMount(0), true, 'F1 骑乘照常');
eq(mw.affection, 52, 'F2 当日头一回骑乘记陪伴 +2');
global.setActiveMount(0);
global.setActiveMount(0);
global.setActiveMount(0);
eq(mw.affection, 52, 'F3 同日连点不再涨（旧版点三十下就白刷满）');
CUR_DAY = 101;
global.setActiveMount(0);
eq(mw.affection, 54, 'F4 隔天再骑再记一笔（陪伴按天算）');
assert(btSrc.indexOf('_lastMountPetDay') >= 0, 'F5 陪伴日账随兽身存档（uid 同款骑角色档往返）');

// ==================== G · 哨兵 ====================
console.log('\n[G] 哨兵');
var ecoSrc = src('js/extensions/beast-ecosystem.js');
assert(ecoSrc.indexOf('rollDistributedBeast') >= 0 && ecoSrc.indexOf('buildWildBeastData') >= 0, 'G1 第八十四波分布接口原样');
assert(src('js/map/randomMap.js').indexOf('rollDistributedBeast(currentRegionForMap, t, rng)') >= 0, 'G2 地图接线原样');
assert(ecoSrc.indexOf("StateRegistry.register('beastEcosystem'") >= 0 && src('js/extensions/beast-evolution.js').indexOf("StateRegistry.register('beastEvolution'") >= 0, 'G3 随档注册原样');
var rt = JSON.parse(JSON.stringify(global.tamedBeasts));
eq(rt[0]._lastMountPetDay, 101, 'G4 陪伴日账可序列化（随档往返）');
var leak = null;
[btSrc.slice(btSrc.indexOf('function sweepInvalidBeastLines'), btSrc.indexOf('// v20.0：驯服成功后注册'))].forEach(function (txt) {
    (txt.match(/'[^']+'/g) || []).forEach(function (s) {
        var v = s.slice(1, -1);
        if (/[+);({\[,?<>]/.test(v)) return;
        if (/^[a-z0-9_]+(?:[-_:. ][a-z0-9_]+)*$/i.test(v)) return;
        if (/^[A-Za-z0-9_\-:.\/# ]+$/.test(v)) return;
        if (/[A-Za-z]/.test(v) && /[一-龥]/.test(v)) leak = leak || s;
    });
});
eq(leak, null, 'G5 新话术零中英混排（漏: ' + leak + '）');
eq((btSrc.match(/Math\.random/g) || []).length <= 4, true, 'G6 驯养档骰点未增（收服/天赋/繁育老骰位原样）');

console.log('\n========== 第八十五波 · 灵兽逻辑收口与残留清理 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
