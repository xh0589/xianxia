/**
 * wave61-caravan-companion-node.js — 第六十一波 · 搭商队同行 验收：
 *   A 搭伙账：近旁商队喊得着才搭得上、搭伙有话术把得失讲明、散伙随时、重复搭不炸
 *   B 脚程账：搭伙陆地每格行程 ×1.5（驮货的车马比人慢）、散伙脚程回来、水路不吃这笔账
 *   C 守更账：搭伙扎营摸营概率降一成（同一枚骰，定数加减）、守更有话术、散伙没话术
 *   D 随行账：商队跟着你走（定数挪窝零骰）、跟到近旁不挤、挪不动原地等、散伙报账、随行天天白听行情（一天一回）
 *   E 侧栏账：搭伙中动静一栏置顶一行
 *   F 哨兵：新一节零骰、零存档、零经济；tickWildLife/stepTo/moveBand 骰数不涨；遭遇账与落位段零染；接线在册
 *
 * 运行：node tests/wave61-caravan-companion-node.js
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

// ==================== 共享全局桩（wave60 同源，另加行情桩） ====================
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
var timeCalls = [];
var ABS_DAY = 800;
global.timeSystem = {
    gameTime: { totalMinutes: 0, currentDay: 5, currentHour: 10, currentMinute: 0, currentSeason: 'spring', currentMonth: 3, currentYear: 1 },
    advanceTime: function (m, r) { timeCalls.push({ m: m, r: r }); global.timeSystem.gameTime.totalMinutes += m; },
    getAbsoluteDay: function () { return ABS_DAY; },
    onNewDaySubscribe: function () {}
};
var battles = [];
global.openBattleWithEntity = function (foe) { battles.push(foe); };
global.addItemToInventory = function () { return true; };
global.itemById = {};
global.inventory = { currency: { spiritStones: 100 }, slots: [] };
global.EconomyTransaction = { getBalance: function () { return 100; }, debit: function () { return true; }, credit: function () { return true; } };
// 行情桩：药材洛北贱金城贵（价差 0.7，过得起 0.1 的门槛——随行的白听行情有话可说）
global.MarketDynamic = {
    CITIES: ['洛北', '金城'],
    CATEGORIES: ['药材'],
    priceMul: function (city) { return city === '洛北' ? 0.7 : 1.4; }
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
global.DataManager = { getSpiritStones: function () { return 100; }, deductSpiritStones: function () { return true; }, addSpiritStones: function () {} };
global.insightPoints = 0;

load('js/map/map-markers.js');
load('js/economy/spirit-vein.js');
load('js/map/travel-journal.js');
load('js/core/state-registry.js');
load('js/map/wild-terrain.js');
load('js/map/randomMap.js');

var WT = global.WildTerrain;
var api = global.wildMapApi;
var LIFE = api.life;
var COMP = LIFE.companion;
var CCFG = COMP.CFG;

function withRandom(v, fn) {
    var orig = Math.random;
    Math.random = function () { return v; };
    try { return fn(); } finally { Math.random = orig; }
}
// 全程一个种子（换种子=换山河清差量档）
global.setMapSeed('天下_w61_comp');
function openSeed(region) {
    withRandom(0.99, function () { global.openWildernessMap(region); });
}
function msgCount(word) {
    return msgs.filter(function (m) { return m.m.indexOf(word) >= 0; }).length;
}
function cellAt(x, y) { return (global.currentMap[y] || [])[x] || null; }
function headOf(band) {
    for (var i = 0; i < band.members.length; i++) if (!global.isEntityDead(band.members[i])) return band.members[i];
    return null;
}
function placeAt(m, x, y) {
    var from = cellAt(m.x, m.y);
    if (from) { var i = from.entities.indexOf(m); if (i >= 0) from.entities.splice(i, 1); }
    m.x = x; m.y = y;
    var c = cellAt(x, y);
    if (c) { c.poiId = null; if (c.entities.indexOf(m) < 0) c.entities.push(m); }
}
function forceWater(x, y) {
    var c = cellAt(x, y);
    if (!c) return null;
    c.terrainKey = 'WATER';
    c.terrain = WT.TERRAIN.WATER;
    c.poiId = null;
    c.entities.length = 0;
    return c;
}
function forcePlain(x, y) {
    var c = cellAt(x, y);
    if (!c) return null;
    c.terrainKey = 'PLAIN';
    c.terrain = WT.TERRAIN.PLAIN;
    c.poiId = null;
    c.entities.length = 0;
    return c;
}
// 把商队头一个摆到玩家近旁（四邻挑一格空地）
function bringNear(band) {
    var h = headOf(band);
    var p = global.playerPos;
    var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [0, 0]];
    for (var i = 0; i < dirs.length; i++) {
        var c = cellAt(p.x + dirs[i][0], p.y + dirs[i][1]);
        if (!c) continue;
        if (c.terrainKey === 'WATER') continue;
        var others = (c.entities || []).filter(function (e) { return e !== h && !global.isEntityDead(e); });
        if (others.length) continue;
        placeAt(h, p.x + dirs[i][0], p.y + dirs[i][1]);
        return true;
    }
    return false;
}
function findBand(kind) {
    return LIFE.bands().filter(function (b) { return b.kind === kind && headOf(b); })[0] || null;
}

global.timeSystem.gameTime.currentSeason = 'spring';
openSeed('中州');
global.currentCharData._travel = { regions: {}, marks: {}, steps: 0 };

// ==================== A · 搭伙账 ====================
console.log('\n[A] 搭伙账（同路一段，有个照应）');
var cv = null;
{
    cv = findBand('caravan');
    assert(!!cv, 'A0 图上有商队（活物是建图时撒的老账）');
    eq(CCFG.PACE, 1.5, 'A0b 脚程的账：陆地每格行程 ×1.5');
    eq(CCFG.WATCH, 0.10, 'A0c 守更的账：摸营概率 -10%');
    // 商队在远处：喊不着（先把头一个摆远，免得这张图刚好生在脚边）
    var h0 = headOf(cv);
    var far = null;
    for (var fy = 1; fy < global.currentMap.length - 1 && !far; fy++) {
        for (var fx = 1; fx < global.currentMap[0].length - 1; fx++) {
            var fc = cellAt(fx, fy);
            var pp = global.playerPos;
            if (fc && !fc.poiId && !(fc.entities || []).length && fc.terrainKey !== 'WATER'
                && Math.max(Math.abs(fx - pp.x), Math.abs(fy - pp.y)) > 5) { far = { x: fx, y: fy }; break; }
        }
    }
    assert(!!far, 'A0d 图上摆得开一个远处（摆局用地）');
    placeAt(h0, far.x, far.y);
    msgs.length = 0;
    eq(COMP.nearby(), null, 'A1 商队隔着远：喊不着（搭伙要走到近旁）');
    var r0 = COMP.join();
    eq(r0, false, 'A1b 喊不着就搭不上（不炸不响空账）');
    assert(msgCount('只有风应你') === 1, 'A1c 搭不上有话术（野地里喊一嗓子，只有风应你）');
    // 走到近旁：搭得上
    assert(bringNear(cv), 'A2 商队摆到近旁（四邻一格内）');
    assert(COMP.nearby() === cv, 'A2b 近旁的商队喊得着');
    msgs.length = 0;
    eq(COMP.join(), true, 'A3 搭伙成了');
    assert(msgCount('搭上了商队') === 1 && msgCount(cv.name) >= 1, 'A3b 搭伙话术报得出幌子（' + cv.name + '）');
    assert(msgCount('脚程随车队') === 1 && msgCount('守更') === 1, 'A3c 话术把得失讲明（慢脚程换守更与行情——先说清后搭伙）');
    eq(COMP.active(), true, 'A4 搭伙账立起来了');
    assert(COMP.band() === cv, 'A4b 搭的就是近旁这一队');
    assert(msgCount('行情') >= 1, 'A4c 话术里也提了行情（天天有得听）');
    // 已搭伙：不再重复搭
    eq(COMP.nearby(), null, 'A5 搭着伙不再找别的队（一次一队）');
    eq(COMP.join(), false, 'A5b 重复搭伙不炸不响');
    // 动作菜单：搭着伙给道别口
    var acts = api.tileActions(cellAt(global.playerPos.x, global.playerPos.y));
    assert(acts.some(function (a) { return a.act === 'leave-caravan'; }), 'A6 搭着伙：脚下菜单有道别口');
    assert(!acts.some(function (a) { return a.act === 'join-caravan'; }), 'A6b 搭着伙不再给搭伙口');
    // 散伙
    msgs.length = 0;
    eq(COMP.leave(), true, 'A7 散伙随时（言语一声就走）');
    assert(msgCount('各走各路') === 1 && msgCount('路上仔细') === 1, 'A7b 散伙话术（拱手道别——好聚好散）');
    eq(COMP.active(), false, 'A8 散伙账清了');
    eq(COMP.leave(), false, 'A8b 没搭伙再道别：不炸不响');
    var acts2 = api.tileActions(cellAt(global.playerPos.x, global.playerPos.y));
    assert(acts2.some(function (a) { return a.act === 'join-caravan'; }), 'A9 散了伙商队还在近旁：搭伙口回来了');
}

// ==================== B · 脚程账 ====================
console.log('\n[B] 脚程账（车马慢，驮着货呢）');
{
    // 独行基线：邻格平原一步
    var p = global.playerPos;
    var b0 = forcePlain(p.x + 1, p.y);
    assert(!!b0, 'B0 邻格摆成平原');
    timeCalls.length = 0;
    withRandom(0.99, function () { api.stepTo(b0.x, b0.y); });
    var base = timeCalls[0].m;
    eq(base, 10, 'B1 独行平原一格 10 分钟（老账）');
    // 搭伙再走：×1.5
    assert(bringNear(cv), 'B2 商队再摆到近旁');
    msgs.length = 0;
    COMP.join();
    var b1 = forcePlain(global.playerPos.x, global.playerPos.y + 1);
    timeCalls.length = 0;
    withRandom(0.99, function () { api.stepTo(b1.x, b1.y); });
    eq(timeCalls[0].m, 15, 'B3 搭伙走同格：15 分钟（×1.5——驮货的车马比人慢）');
    // 散伙脚程回来
    COMP.leave();
    var b2 = forcePlain(global.playerPos.x + 1, global.playerPos.y);
    timeCalls.length = 0;
    withRandom(0.99, function () { api.stepTo(b2.x, b2.y); });
    eq(timeCalls[0].m, 10, 'B4 散伙脚程回来（10 分钟——账随搭伙走）');
}

// ==================== C · 守更账 ====================
console.log('\n[C] 守更账（夜里有人守更，摸营的少）');
{
    // 平原扎营摸营率 0.15-0.05=0.10：骰 0.05 独行必中
    forcePlain(global.playerPos.x, global.playerPos.y);
    msgs.length = 0; battles.length = 0;
    withRandom(0.05, function () { api.poiAction('camp'); });
    assert(msgCount('帐外有东西摸营') === 1, 'C1 独行骰 0.05：摸营中（平原夜袭率 0.10）');
    // 搭伙同骰：0.10-0.10=0，不中
    assert(bringNear(cv), 'C2 商队摆到近旁');
    msgs.length = 0;
    COMP.join();
    forcePlain(global.playerPos.x, global.playerPos.y);
    withRandom(0.05, function () { api.poiAction('camp'); });
    eq(msgCount('帐外有东西摸营'), 0, 'C3 搭伙同一枚骰：摸营不中（守更把风险降了一成——定数加减，零新骰）');
    assert(msgCount('轮着守更') === 1, 'C3b 守更有话术（篷车停在近旁，睡得踏实些）');
    // 散伙扎营：没守更话术
    COMP.leave();
    msgs.length = 0;
    forcePlain(global.playerPos.x, global.playerPos.y);
    withRandom(0.99, function () { api.poiAction('camp'); });
    eq(msgCount('轮着守更'), 0, 'C4 散伙扎营没守更话术（没搭伙不念叨）');
}

// ==================== D · 随行账 ====================
console.log('\n[D] 随行账（商队跟着你走，行情天天白听）');
{
    assert(bringNear(cv), 'D0 商队摆到近旁');
    msgs.length = 0;
    COMP.join();
    // 摆远三格：每步跟一格（骰 0.999：别的队伍速度骰全不中，只随行的商队动——定数账干干净净）
    var p = global.playerPos;
    var h = headOf(cv);
    forcePlain(p.x + 1, p.y); forcePlain(p.x + 2, p.y); forcePlain(p.x + 3, p.y);
    placeAt(h, p.x + 3, p.y);
    cv.cool = 0;
    withRandom(0.999, function () { LIFE.tick(); });
    eq(h.x, p.x + 2, 'D1 你走一步商队跟一步（三格变两格——定数挪窝）');
    withRandom(0.999, function () { LIFE.tick(); });
    eq(h.x, p.x + 1, 'D2 再跟一步（两格变一格）');
    withRandom(0.999, function () { LIFE.tick(); });
    eq(h.x, p.x + 1, 'D3 跟到近旁不往前挤（一格之内就是同行，不踩人）');
    // 随行行情：当天不重复，隔天再听
    ABS_DAY = 801;
    msgs.length = 0;
    withRandom(0.999, function () { LIFE.tick(); });
    assert(msgCount('伙计压低声音') === 1, 'D4 隔天随队听行情（真行情账——洛北贱金城贵）');
    msgs.length = 0;
    withRandom(0.999, function () { LIFE.tick(); });
    eq(msgCount('伙计压低声音'), 0, 'D5 同一天不重复念叨（一天一回）');
    ABS_DAY = 802;
    msgs.length = 0;
    withRandom(0.999, function () { LIFE.tick(); });
    assert(msgCount('伙计压低声音') === 1, 'D5b 又隔天：再听一句');
    // 挪不动原地等：四邻做成水（春天车马过不得）
    h = headOf(cv);
    placeAt(h, p.x + 3, p.y);
    [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(function (d) { forceWater(h.x + d[0], h.y + d[1]); });
    var hx = h.x, hy = h.y;
    withRandom(0.999, function () { LIFE.tick(); });
    eq(h.x, hx, 'D6 车马被水隔着：原地等你（春天商队不泅水——挪不动不硬挪）');
    eq(h.y, hy, 'D6b 一格没动');
    // 散伙报账：队伍从图上没了
    var bands = LIFE.bands();
    var idx = bands.indexOf(cv);
    bands.splice(idx, 1);
    msgs.length = 0;
    withRandom(0.99, function () { LIFE.tick(); });
    assert(msgCount('幌子看不见了') === 1, 'D7 商队散了伙：报一声（账自动清，不挂死账）');
    eq(COMP.active(), false, 'D7b 搭伙账清了');
    // 归队再搭（老队伍塞回图里）
    bands.splice(idx, 0, cv);
    ABS_DAY = 800;
}

// ==================== E · 侧栏账 ====================
console.log('\n[E] 侧栏账（搭伙中，动静一栏置顶一行）');
{
    assert(bringNear(cv), 'E0 商队摆到近旁');
    COMP.join();   // join 内部会重画侧栏
    var html = els['wild-life-list'] ? els['wild-life-list']._html : '';
    assert(html.indexOf('搭伙同行中') >= 0 && html.indexOf(cv.name) >= 0, 'E1 动静一栏有搭伙行（幌子名号在册）');
    assert(html.indexOf('脚程随车队') >= 0 && html.indexOf('守更') >= 0, 'E1b 搭伙行把得失挂着（一眼看清这笔账）');
    assert(html.indexOf('搭伙同行中') >= 0 && html.indexOf('搭伙同行中') < 400, 'E2 搭伙行置顶（排在动静一栏头一行——d=-1 压过所有动静）');
    COMP.leave();
    var html2 = els['wild-life-list'] ? els['wild-life-list']._html : '';
    assert(html2.indexOf('搭伙同行中') < 0, 'E3 散伙后侧栏收了搭伙行');
}

// ==================== F · 哨兵 ====================
console.log('\n[F] 哨兵（零骰、零存档、老切片不殃及）');
{
    var rm = fs.readFileSync(path.join(ROOT, 'js/map/randomMap.js'), 'utf8');
    var sStart = rm.indexOf('============ 第六十一波');
    var sEnd = rm.indexOf('// ---- 每走一步');
    assert(sStart > 0 && sEnd > sStart, 'F0 六十一波段落标记有效（锚在横幅上）');
    var seg = rm.slice(sStart, sEnd);
    eq((seg.match(/Math\.random/g) || []).length, 0, 'F1 搭伙一节零骰（搭不搭、跟不跟、守不守更全是定数——骰还是老那几枚）');
    assert(seg.indexOf('localStorage') < 0 && seg.indexOf('saveWildState') < 0 && seg.indexOf('wildState') < 0,
        'F2 搭伙零直写存档（运行时账，开图即清——商队不落存档，与湿衣风寒同法）');
    assert(seg.indexOf('addSpiritStones') < 0 && seg.indexOf('.credit(') < 0 && seg.indexOf('.debit(') < 0 && seg.indexOf('EconomyTransaction') < 0,
        'F3 搭伙零经济（同行不要钱——票子只有房钱镖费那些老账）');
    assert(seg.indexOf('insightPoints') < 0 && seg.indexOf('markOnce') < 0, 'F4 悟道点零发放（总闸已满）');
    // tickWildLife：骰数不涨、随行接线在册
    var tStart = rm.indexOf('function tickWildLife');
    var tSeg = rm.slice(tStart, rm.indexOf('\nfunction ', tStart + 10));
    eq((tSeg.match(/Math\.random/g) || []).length, 1, 'F5 tickWildLife 仍一枚骰（挪不挪窝的速度骰——随行是定数）');
    assert(tSeg.indexOf('_caravanCompanion') >= 0 && tSeg.indexOf('caravanMarketTip') >= 0 && tSeg.indexOf('_iceCaravanNoticed') >= 0,
        'F6 随行/行情/冰道见闻三线都在巡查账里（六十波的老接线没被挤掉）');
    // stepTo：骰数不涨、脚程接线在册
    var stStart = rm.indexOf('function stepTo');
    var stSeg = rm.slice(stStart, rm.indexOf('\nfunction ', stStart + 10));
    eq((stSeg.match(/Math\.random/g) || []).length, 1, 'F7 stepTo 仍一枚骰（护镖夜袭骰）');
    assert(stSeg.indexOf('companionPaceMul()') >= 0, 'F8 脚程接线在册（陆地分钟账里乘上车队倍率）');
    assert(stSeg.indexOf('companionPaceMul()') >= 0 && (stSeg.match(/companionPaceMul/g) || []).length === 1,
        'F9 车队倍率只挂在陆地分钟账上（水路不吃这笔账——冰行/泅渡/踏水照旧，车马又不在水上驮你）');
    // 扎营：守更加减接线在册、骰还是那一枚
    assert(rm.indexOf('- (companionActive() ? CARAVAN_WATCH_MOD : 0)') >= 0, 'F10 守更加减接线在册（同一枚夜袭骰，定数加减）');
    assert(rm.indexOf('轮着守更') >= 0, 'F10b 守更话术在册');
    // 遭遇账零染：bandContact 一字未动（搭伙不塞进遭遇通道）
    var bcStart = rm.indexOf('function bandContact');
    var bcSeg = rm.slice(bcStart, rm.indexOf('\nfunction ', bcStart + 10));
    eq((bcSeg.match(/Math\.random/g) || []).length, 1, 'F11 bandContact 仍一枚骰（行情闲话骰——老账原样，传闻骰在 shareRumor 自己家里）');
    assert(bcSeg.indexOf('_caravanCompanion') < 0 && bcSeg.indexOf('joinCaravan') < 0, 'F12 遭遇账零染（撞见商队照旧拱手，搭伙走脚下的菜单）');
    // moveBand 零染（六十波的账原样）
    var mStart = rm.indexOf('function moveBand');
    var mSeg = rm.slice(mStart, rm.indexOf('\nfunction ', mStart + 10));
    eq((mSeg.match(/Math\.random/g) || []).length, 1, 'F13 moveBand 仍一枚骰');
    eq((mSeg.match(/bandOnIce/g) || []).length, 3, 'F13b 冰道三处接线原样');
    // 落位与建图零染
    var sdStart = rm.indexOf('function seedWildLife');
    var sdSeg = rm.slice(sdStart, rm.indexOf('\nfunction ', sdStart + 10));
    assert(sdSeg.indexOf('companion') < 0 && sdSeg.indexOf('joinCaravan') < 0, 'F14 落位段零染（商队出生照旧沿古道——建图骰序不漂）');
    var bStart = rm.indexOf('function buildWildMap');
    var buildSeg = rm.slice(bStart, rm.indexOf('\nfunction ', bStart + 10));
    assert(buildSeg.indexOf('companion') < 0 && buildSeg.indexOf('COMPANION') < 0 && buildSeg.indexOf('CARAVAN_PACE') < 0, 'F15 建图段无搭伙任何调用');
    // 复位、出口、动作分发、零新存档字段
    assert((rm.match(/_caravanCompanion = null;/g) || []).length >= 2, 'F16 开图复位接线在册（声明+复位至少两处）');
    assert(rm.indexOf('join: joinCaravan') >= 0 && rm.indexOf('leave: leaveCaravan') >= 0 && rm.indexOf('follow: followPlayer') >= 0,
        'F17 对账出口在册（life.companion.join / leave / follow / active / nearby / band）');
    assert(rm.indexOf("case 'join-caravan': joinCaravan(); break;") >= 0 && rm.indexOf("case 'leave-caravan': leaveCaravan(); break;") >= 0,
        'F18 动作分发两口接线在册');
    assert(rm.indexOf('companion: prev') < 0 && rm.indexOf('prev.companion') < 0, 'F19 存档白名单没收搭伙（本就是零新字段）');
    assert(rm.indexOf('nemesis: null, notes: {}, px: -1') >= 0, 'F20 默认域对象串一字未动');
    // 话术零拉丁（代码记号走过滤）
    var latin = /[A-Za-z]/;
    var visLeak = null;
    (seg.match(/'[^']+'/g) || []).forEach(function (s) {
        var v = s.slice(1, -1);
        if (/[+);({\[,]/.test(v)) return;
        if (/^[a-z0-9]+(?:[-_: ][a-z0-9]+)*$/.test(v)) return;   // 小写代码记号
        if (latin.test(v)) visLeak = visLeak || s;
    });
    assert(visLeak === null, 'F21 搭伙一节话术零拉丁（漏: ' + visLeak + '）');
}

console.log('\n========== 第六十一波 · 搭商队同行 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
