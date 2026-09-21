/**
 * wave51-nemesis-node.js — 第五十一波 · 具名响马宿敌 验收：
 *   A 结仇账：打赢的野外人形带伤遁走才可能结仇、一域一个在世仇家、名号是「团伙·绰号姓」格式
 *   B 拦道账：冷却两天、遭遇骰、拦道话术随梁子层数变、越挨打越凶（等级递增）
 *   C 结算账：胜——梁子加深/三胜了结/赃物入囊（定数选件、塞不下留在山上）；
 *            败——搜身走经济真账（上限=现钱、穷鬼抢不出油水）、梁子还在
 *   D 哨兵：新一节骰数有账、零发票子、零直写存档、差量存档、建图零染、洞天骰序不殃及、
 *          悟道点零发放（总闸已满）、话术零拉丁、app.js 双路接线在册
 *
 * 运行：node tests/wave51-nemesis-node.js
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

// ==================== 共享全局桩（wave49/50 同源，另加战斗记录仪与经济真账桩） ====================
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
// 战斗记录仪：openBattleWithEntity 收到的敌人整包留档
var battles = [];
global.openBattleWithEntity = function (foe) { battles.push(foe); };
// 背包记录仪（wave50 同法）
var bagCalls = [];
var bagOk = true;
global.addItemToInventory = function (id, n) { bagCalls.push({ id: id, n: n }); return bagOk; };
global.itemById = {
    pill_qi_gather: { id: 'pill_qi_gather', name: '聚气丹' },
    pill_big_recovery: { id: 'pill_big_recovery', name: '大还丹' },
    attack_talisman: { id: 'attack_talisman', name: '攻击符' }
};
// 经济真账桩：余额可摆、扣款留痕
var purseBalance = 1000;
var debitCalls = [];
global.EconomyTransaction = {
    getBalance: function (c) { return c === 'spiritStones' ? purseBalance : 0; },
    debit: function (c, amt) { debitCalls.push({ c: c, amt: amt }); if (purseBalance < amt) return false; purseBalance -= amt; return true; },
    credit: function (c, amt) { purseBalance += amt; return true; }
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
var GANGS = ['黑风寨', '断云道', '赤鳞营', '白路堂'];

function withRandom(v, fn) {
    var orig = Math.random;
    Math.random = function () { return v; };
    try { return fn(); } finally { Math.random = orig; }
}
// 换种子=换一片山河（setMapSeed 会清差量存档）——全程只用一个种子，换域直接重开图
global.setMapSeed('天下_w51_nemesis');
function openSeed(region) {
    withRandom(0.99, function () { global.openWildernessMap(region); });
}
function msgCount(word) {
    return msgs.filter(function (m) { return m.m.indexOf(word) >= 0; }).length;
}
function ledger(region) {
    var st = api.state().regions[region || '中州'];
    return st ? st.nemesis : undefined;
}

openSeed('中州');
global.currentCharData._travel = { regions: {}, marks: {}, steps: 0 };

// ==================== A · 结仇账 ====================
console.log('\n[A] 结仇账（打赢带伤遁走的，才可能誓报仇）');
var nemName = null;
{
    msgs.length = 0;
    var forged = withRandom(0.0, function () { return NEM.forge(); });   // 骰 0.0 < 0.22：结仇必中
    assert(forged === true, 'A1 定骰必中：打赢的野外人形结下梁子');
    var n = NEM.active();
    assert(!!n, 'A2 本域有了在世仇家（activeNemesis 在册）');
    nemName = n.name;
    eq(n.wins, 0, 'A3 新仇梁子从零起');
    eq(n.born, 800, 'A4 结仇日记绝对日');
    eq(n.last, 800, 'A4b 上次照面日=结仇日');
    assert(ledger('中州') === n, 'A5 仇账落在本域差量存档（st.nemesis，与 grotto 同法）');
    assert(msgCount('结下了仇家') === 1 && msgCount('带伤遁走') === 1, 'A6 结仇有话术（回头恶狠狠瞪一眼）');
    // 名号格式：团伙·绰号姓（截镖的和结仇的本就是一拨人）
    var parts = nemName.split('·');
    eq(parts.length, 2, 'A7 名号两段式（团伙·绰号姓）：' + nemName);
    assert(GANGS.indexOf(parts[0]) >= 0, 'A7b 团伙在镖行老账里（' + parts[0] + '）');
    var epOk = CFG.EPITHETS.some(function (e) { return parts[1].indexOf(e) === 0; });
    var snOk = CFG.SURNAMES.some(function (s) { return parts[1].slice(-1) === s; });
    assert(epOk && snOk, 'A7c 绰号加姓拼得出江湖名号（' + parts[1] + '）');
    // 一域一个在世仇家
    msgs.length = 0;
    var again = withRandom(0.0, function () { return NEM.forge(); });
    eq(again, false, 'A8 旧仇未了不接新仇（一域一个在世仇家）');
    eq(msgCount('结下了仇家'), 0, 'A8b 不结新仇就不发话术');
    // 骰不中：带伤遁走也未必记仇（打死的没仇，遁走的才可能誓报仇）
    openSeed('东荒');
    var miss = withRandom(0.99, function () { return NEM.forge(); });
    eq(miss, false, 'A9 骰 0.99 不中：这一回遁走的没记仇（22% 的梁子不是回回都结）');
    eq(ledger('东荒'), null, 'A9b 东荒仇账仍是空');
    openSeed('中州');
    assert(NEM.active() && NEM.active().name === nemName, 'A10 回中州：仇家还在（差量存档跟着域走）');
}

// ==================== B · 拦道账 ====================
console.log('\n[B] 拦道账（冷却两天，遭遇骰，越挨打越凶）');
{
    // 同日不来（冷却未满）
    var r1 = withRandom(0.0, function () { return NEM.ambush(); });
    eq(r1, false, 'B1 结仇当日不拦道（冷却 ' + CFG.COOLDOWN + ' 天——梁子也要喘口气）');
    eq(battles.length, 0, 'B1b 没拦道就没开战');
    // 冷却期满但骰不中
    ABS_DAY = 802;
    var r2 = withRandom(0.99, function () { return NEM.ambush(); });
    eq(r2, false, 'B2 骰 0.99 不中：仇家今天没堵着（14% 的拦道不是回回都来）');
    // 冷却期满 + 骰中：拦道开战
    msgs.length = 0;
    var r3 = withRandom(0.0, function () { return NEM.ambush(); });
    assert(r3 === true, 'B3 骰 0.0 命中：仇家拦道');
    eq(battles.length, 1, 'B4 拦道即开战（走现成战斗通道）');
    var foe = battles[0];
    eq(foe.name, nemName, 'B5 来的是本尊（名号对得上仇账）');
    assert(foe._wildNemesis === true, 'B6 战斗实体挂着仇家旗（战后结算认旗，四十一波同法）');
    eq(foe.level, 1 * 3 + 1 + 0, 'B7 等级=境界底+1+梁子层数（头一回照面：炼气 → 4 级）');
    assert(msgCount('拦在当路') === 1 && msgCount('上回那笔账') === 1, 'B8 头一回照面的叫阵话术（可算又碰上你了）');
    eq(ledger('中州').last, 802, 'B9 照面日入账（下回冷却从这里起算）');
    // 刚照过面：冷却又起
    var r4 = withRandom(0.0, function () { return NEM.ambush(); });
    eq(r4, false, 'B10 刚照过面不再来（同一天不连环堵）');
}

// ==================== C · 结算账 ====================
console.log('\n[C] 结算账（胜——梁子加深/三胜了结；败——搜身真扣）');
{
    // 第一胜：梁子加深，人跑了
    msgs.length = 0;
    NEM.settle(true);
    eq(ledger('中州').wins, 1, 'C1 头一胜：梁子加深一层');
    assert(msgCount('梁子加深 1/3') === 1 && msgCount('下回手更重') === 1, 'C2 胜话术（滚下道去逃了，越挨打越凶）');
    assert(NEM.active() !== null, 'C2b 仇家还活着（没到三胜）');

    // 第二胜：等级涨、叫阵变口
    ABS_DAY = 804;
    msgs.length = 0; battles.length = 0;
    withRandom(0.0, function () { return NEM.ambush(); });
    eq(battles.length, 1, 'C3 二照面：仇家又来了');
    eq(battles[0].level, 1 * 3 + 1 + 1, 'C4 等级随梁子层数涨（第二回：5 级——他越挨打越凶）');
    assert(msgCount('连本带利') === 1, 'C4b 二照面叫阵换口（上回算你走运）');
    msgs.length = 0;
    NEM.settle(true);
    eq(ledger('中州').wins, 2, 'C5 第二胜：梁子两层');

    // 第三照面：决死叫阵；第三胜：了结 + 赃物
    ABS_DAY = 806;
    msgs.length = 0; battles.length = 0; bagCalls.length = 0;
    withRandom(0.0, function () { return NEM.ambush(); });
    eq(battles[0].level, 1 * 3 + 1 + 2, 'C6 三照面：6 级（决战的手最重）');
    assert(msgCount('不是你死') === 1, 'C6b 三照面叫阵是决死口（今日不是你死就是我亡）');
    global.insightPoints = 0;
    NEM.settle(true);
    eq(ledger('中州'), null, 'C7 三胜了结：仇账清（他跑不掉了）');
    assert(msgCount('梁子了结') === 1 && msgCount('重新太平') === 1, 'C7b 了结话术');
    eq(global.insightPoints, 0, 'C8 悟道点零发放（总闸已满——梁子不掺悟道账）');
    // 赃物：定数选件，货是本地特产池里的真货
    eq(bagCalls.length, 1, 'C9 了结翻出赃物一件入囊');
    var pool = api.grotto.LOOT['中州'];
    assert(pool.indexOf(bagCalls[0].id) >= 0, 'C10 赃物在中州特产池里（与洞天遗宝同池——他劫的就是本地货）');
    var h = 0;
    for (var i = 0; i < nemName.length; i++) h = (h * 31 + nemName.charCodeAt(i)) % 9973;
    eq(bagCalls[0].id, pool[h % pool.length], 'C11 选件走定数（名号哈希，与生产同一套算法，零新骰）');
    assert(msgCount('赃物里翻出') === 1 && msgCount('本地特产') === 1, 'C12 赃物话术（历年劫来的本地特产）');

    // 行囊塞不下：人死账清，赃物留在山上（死人不会等你腾地方）
    openSeed('南疆');
    withRandom(0.0, function () { return NEM.forge(); });
    ledger('南疆').wins = 2;   // 直接摆到决战前夜
    ABS_DAY = 810;
    msgs.length = 0; bagCalls.length = 0; bagOk = false;
    withRandom(0.0, function () { return NEM.ambush(); });
    NEM.settle(true);
    eq(ledger('南疆'), null, 'C13 塞不下也了结（人死账清，不能拿行囊卡着仇家不死）');
    assert(msgCount('只得留在山上') === 1, 'C13b 赃物带不走有话术（撒了一地，行囊满满当当）');
    bagOk = true;

    // 战败：搜身走经济真账
    openSeed('西漠');
    withRandom(0.0, function () { return NEM.forge(); });
    ABS_DAY = 814;
    purseBalance = 1000; debitCalls.length = 0; msgs.length = 0;
    withRandom(0.0, function () { return NEM.ambush(); });
    NEM.settle(false);
    eq(debitCalls.length, 1, 'C14 败了被搜身：经济真账扣一笔');
    eq(debitCalls[0].c, 'spiritStones', 'C14b 扣的是灵石（走 EconomyTransaction 真账，不进野路子）');
    eq(debitCalls[0].amt, CFG.ROB_BASE, 'C15 搜走基数 ' + CFG.ROB_BASE + ' 枚（新仇的手还算轻）');
    assert(msgCount('抢走灵石 30 枚') === 1 && msgCount('进了他腰包') === 1, 'C15b 搜身话术（钱进了他腰包——不凭空蒸发）');
    eq(ledger('西漠').wins, 0, 'C16 败不折梁子层数（赢的账照记）');
    assert(NEM.active() !== null, 'C16b 梁子还在（他抢完就走，下回还来）');

    // 梁子越深搜得越狠
    ledger('西漠').wins = 1;
    ABS_DAY = 816; debitCalls.length = 0;
    withRandom(0.0, function () { return NEM.ambush(); });
    NEM.settle(false);
    eq(debitCalls[0].amt, CFG.ROB_BASE + CFG.ROB_STEP, 'C17 梁子一层：搜走 ' + (CFG.ROB_BASE + CFG.ROB_STEP) + ' 枚（越熟越不客气）');

    // 上限=身上现钱
    ABS_DAY = 818; debitCalls.length = 0; purseBalance = 10; msgs.length = 0;
    withRandom(0.0, function () { return NEM.ambush(); });
    NEM.settle(false);
    eq(debitCalls[0].amt, 10, 'C18 搜身上限=现钱（只揣十枚就只丢十枚，抢不出油水）');

    // 穷鬼：一分没有
    ABS_DAY = 820; debitCalls.length = 0; purseBalance = 0; msgs.length = 0;
    withRandom(0.0, function () { return NEM.ambush(); });
    NEM.settle(false);
    eq(debitCalls.length, 0, 'C19 身无分文：账上一笔不动');
    assert(msgCount('穷酸散修') === 1 && msgCount('一枚灵石也没搜着') === 1, 'C19b 穷鬼话术（啐了声穷酸散修）');
    assert(NEM.active() !== null, 'C20 抢不着钱梁子也还在');

    // 无仇直调结算：不炸不响（先把西漠的仇账清了——五十六波起带追旗的仇家会跟人挪进新域，挪账的账在 wave56 专套里对）
    api.state().regions['西漠'].nemesis = null;
    openSeed('蜀地');
    msgs.length = 0; debitCalls.length = 0;
    NEM.settle(true); NEM.settle(false);
    eq(msgs.length, 0, 'C21 无仇家直调结算：不炸不响（账上没人就不结账）');
    ABS_DAY = 800;
}

// ==================== D · 哨兵 ====================
console.log('\n[D] 哨兵（骰数有账、零发票子、差量存档、接线在册）');
{
    var rm = fs.readFileSync(path.join(ROOT, 'js/map/randomMap.js'), 'utf8');
    var nStart = rm.indexOf('第五十一波 · 具名响马宿敌');
    var nEnd = rm.indexOf('第四十九波 · 崖壁隐藏洞天');
    assert(nStart > 0 && nEnd > nStart, 'D0 五十一波段落标记在四十九波之前（切片有效）');
    var seg = rm.slice(nStart, nEnd);
    // 骰数有账：拦道骰 1 + 结仇骰 1 + 具名骰 3（团伙/绰号/姓）= 5
    eq((seg.match(/Math\.random/g) || []).length, 5, 'D1 新一节骰数有账（拦道 1 + 结仇 1 + 具名 3 = 5，别处零随机）');
    assert(seg.indexOf('addSpiritStones') < 0 && seg.indexOf('.credit(') < 0,
        'D2 仇家一节零发票子（战败只扣不增——扣走的是进他腰包，守恒）');
    assert(seg.indexOf('localStorage') < 0, 'D3 仇账零直写存档（全走 saveWildState 差量法）');
    assert(rm.indexOf('nemesis: prev.nemesis || null') >= 0, 'D4 saveWildState 白名单收了仇账');
    assert(rm.indexOf('st.nemesis === undefined') >= 0 && rm.indexOf('nemesis: null') >= 0,
        'D5 applyWildState 老档自动补空（零迁移脚本；默认域对象串随五十二波 notes 字段变长，钉 nemesis:null 即可）');
    assert(seg.indexOf('insightPoints') < 0 && seg.indexOf('markOnce') < 0,
        'D6 悟道点零发放（总闸已满：游历+地灵+洞天 77/78，梁子不掺悟道账）');
    // 建图段依旧一字不染
    var bStart = rm.indexOf('function buildWildMap');
    var buildSeg = rm.slice(bStart, rm.indexOf('\nfunction ', bStart + 10));
    assert(buildSeg.indexOf('NEMESIS') < 0 && buildSeg.indexOf('nemesis') < 0 && buildSeg.indexOf('Nemesis') < 0,
        'D7 建图段无仇家任何调用（骰序零漂移照旧）');
    // 洞天一节的骰没被殃及（四十九波「只一枚骰」哨兵依旧成立）
    var gSeg = rm.slice(rm.indexOf('第四十九波 · 崖壁隐藏洞天'), rm.indexOf('第三十八波 · 扎营歇夜'));
    eq((gSeg.match(/Math\.random/g) || []).length, 1, 'D8 洞天一节仍只一枚骰（五十一波没把代码插错地方）');
    // 接线：遭遇通道 + app.js 双路
    assert(rm.indexOf('else if (tryNemesisAmbush()) return true;') >= 0,
        'D9 拦道接在 rollWildEncounter 常规骰之前（并进兽潮行：有潮不加码、无潮问仇家——响马也怕兽）');
    assert(rm.indexOf('if (!wantBeast && !leyTier) foe._wildFoe = true;') >= 0,
        'D10 野外人形挂结仇旗（灵脉精英/魔头不掺和）');
    var app = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
    assert(app.indexOf('currentBattle.enemy._wildNemesis && typeof window.settleWildNemesis') >= 0
        && app.indexOf('window.settleWildNemesis(true)') >= 0, 'D11 战胜结算接线在册（app.js 认旗）');
    assert(app.indexOf('window.settleWildNemesis(false)') >= 0 && app.indexOf('window.maybeForgeNemesis()') >= 0,
        'D12 战败结算与结仇接线在册（双路都通）');
    assert(rm.indexOf('梁子未了') >= 0, 'D13 侧栏挂仇家一行（游荡在本域，已了几层一目了然）');
    // 新话术零拉丁（代码记号走白名单）
    var latin = /[A-Za-z]/;
    var allow = ['spiritStones', 'enemy', 'warning', 'success', 'info'];
    var visLeak = null;
    (seg.match(/'[^']+'/g) || []).forEach(function (s) {
        var v = s.slice(1, -1);
        if (/[+);({\[,]/.test(v)) return;   // 跨串拼接的代码碎段不是话术
        if (/^[a-z][a-z0-9_]*$/.test(v)) return;   // 蛇形小写是代码记号
        if (latin.test(v) && allow.indexOf(v) < 0) visLeak = visLeak || s;
    });
    assert(visLeak === null, 'D14 仇家一节话术零拉丁（漏: ' + visLeak + '）');
    // 全局挂载在册（app.js 靠 window 口调）
    assert(rm.indexOf('window.maybeForgeNemesis = maybeForgeNemesis') >= 0 && rm.indexOf('window.settleWildNemesis = settleWildNemesis') >= 0,
        'D15 两个结算口挂上全局（战后认旗调得着）');
}

console.log('\n========== 第五十一波 · 具名响马宿敌 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
