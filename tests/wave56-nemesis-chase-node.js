/**
 * wave56-nemesis-chase-node.js — 第五十六波 · 仇家跨域追杀 验收：
 *   A 追旗账：被仇家打赢的那一刻挂追旗（记绝对日）、有话术、有效期三十天
 *   B 进域挪账：一进新域（仇位空、旗未过期）仇账整个挪过去——名号梁子原样带着、旧域位空出来、
 *            新域照旧拦道、追完还能再追（链式）、旧域腾得开新仇
 *   C 不挪的账：新域仇位被占不挪（一域一仇两头守）、追旗过期不挪（风头过了他蹲回老地盘）
 *   D 哨兵：挪账零骰、零直写存档、五十一波切片骰数不涨、建图零染、接线在册、话术零拉丁
 *
 * 运行：node tests/wave56-nemesis-chase-node.js
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

// ==================== 共享全局桩（wave51 同源） ====================
global.window = global;
var els = {};
function fakeEl(tag) {
    var el = {
        tag: tag || '', children: [], style: {}, _attrs: {}, parentNode: null,
        setAttribute: function (k, v) { this._attrs[k] = v; },
        getAttribute: function (k) { return this._attrs[k]; },
        appendChild: function (c) { this.children.push(c); c.parentNode = this; return c; },
        removeChild: function (c) { var i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c; },
        remove: function () {},
        get firstChild() { return this.children[0] || null; },
        addEventListener: function () {}, removeEventListener: function () {},
        closest: function () { return null; },
        scrollIntoView: function () {},
        classList: { add: function () {}, remove: function () {}, toggle: function () {} },
        _html: '', textContent: ''
    };
    Object.defineProperty(el, 'innerHTML', {
        get: function () { return this._html; },
        set: function (v) { this._html = String(v); },
        configurable: true
    });
    return el;
}
global.document = {
    readyState: 'complete',
    createElementNS: function (ns, tag) { return fakeEl(tag); },
    createElement: function (tag) { return fakeEl(tag); },
    getElementById: function (id) { if (!els[id]) els[id] = fakeEl(); return els[id]; },
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    addEventListener: function () {},
    body: { appendChild: function () {} }
};
var store = {};
global.localStorage = {
    getItem: function (k) { return store[k] !== undefined ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; }
};
var msgs = [];
global.showMessage = function (m, t) { msgs.push({ m: String(m), t: t }); };
var ABS_DAY = 800;
global.timeSystem = {
    gameTime: { totalMinutes: 0, currentDay: 5, currentHour: 10, currentMinute: 0, currentSeason: 'spring', currentMonth: 3, currentYear: 1 },
    advanceTime: function (m) { global.timeSystem.gameTime.totalMinutes += m; },
    getAbsoluteDay: function () { return ABS_DAY; },
    onNewDaySubscribe: function () {}
};
var battles = [];
global.openBattleWithEntity = function (foe) { battles.push(foe); };
global.addItemToInventory = function () { return true; };
global.itemById = {};
var purseBalance = 1000;
var debitCalls = [];
global.EconomyTransaction = {
    getBalance: function (c) { return c === 'spiritStones' ? purseBalance : 0; },
    debit: function (c, amt) { debitCalls.push({ c: c, amt: amt }); if (purseBalance < amt) return false; purseBalance -= amt; return true; },
    credit: function () { return true; }
};
global.updateCharacterStatus = function () {};
global.updateCurrencyUI = function () {};
global.updateInsightUI = function () {};
global.getEffectiveMax = function () { return 100; };
global.generateRandomEnemy = function (level, type) { return { name: '敌' + level, type: type, hp: 100, level: level }; };
global.ResourcePoints = { listByRegion: function () { return []; } };
global.DungeonDynamic = { listActive: function () { return []; } };
global.StateRegistry = { register: function () {} };
var REALM_TIER = { '凡人': 0, '炼气': 1, '筑基': 2, '金丹': 3, '元婴': 4, '化神': 5 };
global.getRealmTier = function (r) { return REALM_TIER[r] != null ? REALM_TIER[r] : 1; };
global.currentCharData = { health: 100, energy: 100, qi: 0, maxQi: 999, realm: '炼气', luck: 50 };
global.eventFlags = {};
global.PSectWorld = { homeName: function () { return null; } };
global.sectsData = {};
global.DataManager = { getSpiritStones: function () { return purseBalance; }, deductSpiritStones: function () { return true; }, addSpiritStones: function () {} };
global.insightPoints = 0;

load('js/map/map-markers.js');
load('js/economy/spirit-vein.js');
load('js/map/travel-journal.js');
load('js/core/state-registry.js');
load('js/map/wild-terrain.js');
load('js/map/randomMap.js');

var api = global.wildMapApi;
var NEM = api.nemesis;
var CFG = NEM.CFG;

function withRandom(v, fn) {
    var orig = Math.random;
    Math.random = function () { return v; };
    try { return fn(); } finally { Math.random = orig; }
}
// 全程一个种子（换种子=换山河清差量档），换域直接重开图
global.setMapSeed('天下_w56_chase');
function openSeed(region) {
    withRandom(0.99, function () { global.openWildernessMap(region); });
}
function msgCount(word) {
    return msgs.filter(function (m) { return m.m.indexOf(word) >= 0; }).length;
}
function ledger(region) {
    var st = api.state().regions[region];
    return st ? st.nemesis : undefined;
}

openSeed('中州');
global.currentCharData._travel = { regions: {}, marks: {}, steps: 0 };

// ==================== A · 追旗账 ====================
console.log('\n[A] 追旗账（打赢你的人，认准了你）');
var nemName = null;
{
    withRandom(0.0, function () { NEM.forge(); });
    nemName = NEM.active().name;
    ABS_DAY = 802;
    battles.length = 0; msgs.length = 0; debitCalls.length = 0;
    withRandom(0.0, function () { NEM.ambush(); });
    eq(battles.length, 1, 'A0 仇家拦道（四十九……不，五十一波的老账照好使）');
    NEM.settle(false);
    eq(ledger('中州').chase, 802, 'A1 被仇家打赢：追旗挂上（记绝对日）');
    assert(msgCount('收刀冷笑') === 1 && msgCount('你跑到哪儿，我跟到哪儿') === 1, 'A2 追旗有话术（他放出了狠话）');
    assert(msgCount('跟着你出域') === 1, 'A2b 话术把规矩说明白（这梁子要跟你出域）');
    eq(CFG.CHASE_DAYS, 30, 'A3 追旗三十天作数（风头过了他也懒得多跑）');
}

// ==================== B · 进域挪账 ====================
console.log('\n[B] 进域挪账（人跟着你走，账跟着人挪）');
{
    ledger('中州').wins = 1;   // 摆一层旧梁子，验证挪账带不带走
    msgs.length = 0;
    openSeed('东荒');
    var nd = ledger('东荒');
    assert(!!nd, 'B1 一进东荒：仇家跟到了（本域仇位落了账）');
    eq(nd.name, nemName, 'B2 跟来的是本尊（名号分毫未变）');
    eq(nd.wins, 1, 'B3 旧梁子原样带着（他记得上回挨的那一记）');
    eq(nd.chased, 1, 'B4 挪账记了一回追杀（chased 1）');
    assert(!nd.chase, 'B5 追旗随挪账销了（人已经到了，旗就不用再挂着）');
    eq(ledger('中州'), null, 'B6 旧域仇位空出来（人走了，账随人走）');
    assert(msgCount('一路跟了过来') === 1 && msgCount(nemName) >= 1, 'B7 进域有话术（后颈泛起熟悉的寒意）');

    // 新域照旧拦道，梁子接着数
    ABS_DAY = 804;
    battles.length = 0; msgs.length = 0;
    withRandom(0.0, function () { NEM.ambush(); });
    eq(battles.length, 1, 'B8 跟到东荒也照旧拦道');
    eq(battles[0].name, nemName, 'B8b 拦道的还是本尊');
    eq(battles[0].level, 1 * 3 + 1 + 1, 'B9 等级带着旧梁子涨（1 层 → 5 级——跨域账不断篇）');
    NEM.settle(true);
    eq(ledger('东荒').wins, 2, 'B10 在东荒打赢：梁子接着数（2/3）');

    // 链式追杀：再输一回，再跟一域
    ABS_DAY = 806;
    withRandom(0.0, function () { NEM.ambush(); });
    NEM.settle(false);
    eq(ledger('东荒').chase, 806, 'B11 又输了：追旗再挂（追完还能追）');
    msgs.length = 0;
    openSeed('蜀地');
    eq(ledger('蜀地').chased, 2, 'B12 跟到蜀地：追杀记两回（chased 2）');
    eq(ledger('东荒'), null, 'B12b 东荒的位也空了');

    // 旧域腾得开新仇
    openSeed('中州');
    msgs.length = 0;
    var forged = withRandom(0.0, function () { return NEM.forge(); });
    assert(forged === true, 'B13 中州的位空了：腾得开新仇（旧仇未了不接新仇的规矩没破——了结/追走都算腾位）');
}

// ==================== C · 不挪的账 ====================
console.log('\n[C] 不挪的账（位被占不挪，旗过期不挪）');
{
    // 中州新仇 N2：打赢一回挂追旗
    var n2 = NEM.active().name;
    ABS_DAY = 808;
    withRandom(0.0, function () { NEM.ambush(); });
    NEM.settle(false);
    eq(ledger('中州').chase, 808, 'C0 新仇也认追旗的账');
    // 蜀地还蹲着老仇（B12 挪过去的）——位被占，不挪
    msgs.length = 0;
    openSeed('蜀地');
    eq(ledger('蜀地').name, nemName, 'C1 蜀地位上有老仇：新仇挤不进来（一域一个在世仇家，两头都守）');
    assert(!!ledger('中州') && ledger('中州').name === n2, 'C2 挤不进来就蹲在原地（中州的仇还是中州的）');
    eq(msgCount('一路跟了过来'), 0, 'C3 没挪就不发挪账话术');
    // 蜀地老仇了结腾位后，中州新仇才跟得进来
    ledger('蜀地').wins = 2;
    ABS_DAY = 810;
    withRandom(0.0, function () { NEM.ambush(); });
    NEM.settle(true);
    eq(ledger('蜀地'), null, 'C4 蜀地老仇三胜了结（位腾出来了）');
    msgs.length = 0;
    openSeed('中州');   // 先回中州（人在中州时不挪——他就在这儿）
    openSeed('蜀地');
    eq(ledger('蜀地').name, n2, 'C5 位一空，蹲着追旗的新仇跟进蜀地');
    eq(ledger('中州'), null, 'C5b 中州的位随之空出');
    // 追旗过期：风头过了，他蹲回老地盘
    ABS_DAY = 812;
    withRandom(0.0, function () { NEM.ambush(); });
    NEM.settle(false);
    eq(ledger('蜀地').chase, 812, 'C6 蜀地再输：追旗又挂');
    ledger('蜀地').chase = 812 - CFG.CHASE_DAYS - 1;   // 把旗做旧到过期
    msgs.length = 0;
    openSeed('南疆');
    eq(ledger('南疆'), null, 'C7 追旗过期：南疆干干净净（三十天风头过了，他懒得再追）');
    assert(!!ledger('蜀地'), 'C8 过期旗不挪账——他蹲回老地盘（蜀地的仇还在蜀地）');
    eq(msgCount('一路跟了过来'), 0, 'C9 没挪就没话术');
}

// ==================== D · 哨兵 ====================
console.log('\n[D] 哨兵（挪账零骰、切片不殃及、接线在册）');
{
    var rm = fs.readFileSync(path.join(ROOT, 'js/map/randomMap.js'), 'utf8');
    var sStart = rm.indexOf('============ 第五十六波');
    var sEnd = rm.indexOf('第五十一波 · 具名响马宿敌');
    assert(sStart > 0 && sEnd > sStart, 'D0 五十六波段落标记有效（锚在横幅上）');
    var seg = rm.slice(sStart, sEnd);
    eq((seg.match(/Math\.random/g) || []).length, 0, 'D1 挪账零骰（挪不挪、跟去谁，全是定数）');
    assert(seg.indexOf('localStorage') < 0 && seg.indexOf('saveWildState') < 0, 'D2 挪账零直写存档（改的是 wildState 内存对象，随整包存读档）');
    assert(seg.indexOf('addSpiritStones') < 0 && seg.indexOf('.credit(') < 0 && seg.indexOf('.debit(') < 0, 'D3 追杀零经济（他的盘缠自己出，不动玩家的票子）');
    assert(seg.indexOf('insightPoints') < 0 && seg.indexOf('markOnce') < 0, 'D4 悟道点零发放（总闸已满）');
    // 五十一波切片骰数不涨（追旗写入是定数）
    var nSeg = rm.slice(rm.indexOf('第五十一波 · 具名响马宿敌'), rm.indexOf('第四十九波 · 崖壁隐藏洞天'));
    eq((nSeg.match(/Math\.random/g) || []).length, 5, 'D5 五十一波切片仍五枚骰（追旗没添新骰）');
    assert(rm.indexOf('n.chase = wildAbsDay();') >= 0, 'D6 战败挂追旗接线在册（settleWildNemesis 败路里）');
    assert(rm.indexOf('nemesisFollowHere(regionName);') >= 0, 'D7 进域挪账接线在册（开图函数里）');
    var bStart = rm.indexOf('function buildWildMap');
    var buildSeg = rm.slice(bStart, rm.indexOf('\nfunction ', bStart + 10));
    assert(buildSeg.indexOf('nemesisFollow') < 0 && buildSeg.indexOf('CHASE') < 0, 'D8 建图段无追杀任何调用（骰序零漂移照旧）');
    // 话术零拉丁（代码记号走过滤）
    var latin = /[A-Za-z]/;
    var visLeak = null;
    (seg.match(/'[^']+'/g) || []).forEach(function (s) {
        var v = s.slice(1, -1);
        if (/[+);({\[,]/.test(v)) return;
        if (/^[a-z0-9]+(?:[-_: ][a-z0-9]+)*$/.test(v)) return;   // 小写代码记号
        if (latin.test(v)) visLeak = visLeak || s;
    });
    assert(visLeak === null, 'D9 追杀一节话术零拉丁（漏: ' + visLeak + '）');
    var cStart = rm.indexOf('// 第五十六波 · 跨域追杀');
    var cEnd = rm.indexOf('try { if (window.updateCurrencyUI)', cStart);   // 从句首往后找，别撞上文件前头的同款行
    var seg51new = rm.slice(cStart, cEnd);
    assert(seg51new.indexOf('Math.random') < 0 && seg51new.indexOf('n.chase = wildAbsDay()') >= 0, 'D10 败路里新添的追旗账零骰且真在切片里');
}

console.log('\n========== 第五十六波 · 仇家跨域追杀 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
