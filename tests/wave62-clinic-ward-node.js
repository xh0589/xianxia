/**
 * wave62-clinic-ward-node.js — 第六十二波 · 医馆坐堂 验收：
 *   A 风寒问诊：城里大夫一炷香办完暖睡一夜的账（诊金 8，真扣）；凑不齐诊金方子留在医馆；旧钱袋子兜底
 *   B 里症问诊：毒/神魂/伤疼按病收诊金（25/20/10）、按定数压症（60/60/50）；轻症门槛之下不收钱；没病不挣冤枉钱
 *   C 接线账：app.js 医馆诊治收尾真调了坐堂账、外伤老账一字未动、按钮话术改口「15 灵石起」
 *   D 哨兵：新一节零骰、零存档、零增发（诊金只收不发）、梯度不破（大夫比床板狠、丹药比大夫狠）、话术零拉丁
 *
 * 运行：node tests/wave62-clinic-ward-node.js
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

// ==================== 共享全局桩（wave59 同源，钱袋子可摆、扣款留痕） ====================
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
    gameTime: { totalMinutes: 0, currentDay: 5, currentHour: 10, currentMinute: 0, currentSeason: 'winter', currentMonth: 11, currentYear: 1 },
    advanceTime: function (m) { global.timeSystem.gameTime.totalMinutes += m; },
    getAbsoluteDay: function () { return ABS_DAY; },
    onNewDaySubscribe: function () {}
};
global.openBattleWithEntity = function () {};
global.addItemToInventory = function () { return true; };
global.itemById = {};
global.inventory = { currency: { spiritStones: 0 }, slots: [] };
var purse = 0;
var debitCalls = [];
var creditCalls = [];
global.EconomyTransaction = {
    getBalance: function (c) { return c === 'spiritStones' ? purse : 0; },
    debit: function (c, a) { debitCalls.push({ c: c, a: a }); if (purse < a) return false; purse -= a; return true; },
    credit: function (c, a) { creditCalls.push({ c: c, a: a }); purse += a; return true; }
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
global.DataManager = { getSpiritStones: function () { return purse; }, deductSpiritStones: function () { return true; }, addSpiritStones: function () {} };
global.insightPoints = 0;

load('js/map/map-markers.js');
load('js/economy/spirit-vein.js');
load('js/map/travel-journal.js');
load('js/core/state-registry.js');
load('js/map/wild-terrain.js');
load('js/map/randomMap.js');

var api = global.wildMapApi;
var RELIEF = api.relief;
var CLINIC = RELIEF.CFG.CLINIC;
var CHILL = api.wet.chill;

function withRandom(v, fn) {
    var orig = Math.random;
    Math.random = function () { return v; };
    try { return fn(); } finally { Math.random = orig; }
}
function msgCount(word) {
    return msgs.filter(function (m) { return m.m.indexOf(word) >= 0; }).length;
}
function setPhys(poison, shock, pain) {
    global._playerPhysiology = { physiology: { poisonLoad: poison, neuralShock: shock, painLoad: pain, wounds: [] } };
    return global._playerPhysiology.physiology;
}
function catchChill() {
    global.currentCharData._chillUntil = 0;
    global.timeSystem.gameTime.currentSeason = 'winter';
    return withRandom(0.0, function () { return CHILL.roll(); });
}
function feeSum() {
    var s = 0;
    debitCalls.forEach(function (d) { s += d.a; });
    return s;
}

// ==================== A · 风寒问诊 ====================
console.log('\n[A] 风寒问诊（城里大夫一炷香，办完暖睡一夜的账）');
{
    assert(catchChill() === true, 'A0 冬天染上风寒（五十九波的老账照好使）');
    assert(CHILL.isChilled(), 'A0b 病在身上');
    purse = 100; debitCalls.length = 0; creditCalls.length = 0; msgs.length = 0;
    var out = RELIEF.doctor();
    assert(out.indexOf('chill') >= 0, 'A1 坐堂账里看了风寒');
    eq(CHILL.isChilled(), false, 'A2 大夫当场治好（施针灌药发一身汗——不用等暖睡）');
    eq(debitCalls.length, 1, 'A3 诊金真扣一笔（经济真账）');
    eq(debitCalls[0].a, CLINIC.CHILL_FEE, 'A3b 风寒诊金 ' + CLINIC.CHILL_FEE + ' 灵石');
    eq(debitCalls[0].c, 'spiritStones', 'A3c 扣的是灵石');
    eq(creditCalls.length, 0, 'A4 医馆只收钱不发钱（诊金进药柜——零增发）');
    assert(msgCount('施了几针') === 1 && msgCount('风寒散了') === 1 && msgCount('诊金 8 灵石') === 1, 'A5 看病有话术（诊金几何说得明白）');
    eq(msgCount('冤枉钱'), 0, 'A5b 有病看病：不念「没病」那句');
    // 凑不齐诊金：病还在，方子留在医馆
    catchChill();
    purse = 3; debitCalls.length = 0; msgs.length = 0;
    var out2 = RELIEF.doctor();
    assert(out2.indexOf('chill-unpaid') >= 0, 'A6 诊金凑不齐：账上记一笔欠着的');
    eq(CHILL.isChilled(), true, 'A6b 没治成：病还在身上（大夫不赊账）');
    eq(debitCalls.length, 0, 'A6c 凑不齐就一枚不扣（扣不动不强扣）');
    assert(msgCount('方子留在大夫手里') === 1, 'A7 没钱的话术也体面（方子写好了，钱不够）');
    // 旧钱袋子兜底：经济真账上没钱，随身钱袋里有
    catchChill();
    purse = 0;
    global.inventory.currency.spiritStones = 20;
    debitCalls.length = 0; msgs.length = 0;
    RELIEF.doctor();
    eq(CHILL.isChilled(), false, 'A8 真账没钱：旧钱袋子兜底（医馆的老收账路数）');
    eq(global.inventory.currency.spiritStones, 20 - CLINIC.CHILL_FEE, 'A8b 兜底也真扣（钱袋子 20 → 12）');
    global.inventory.currency.spiritStones = 0;
}

// ==================== B · 里症问诊 ====================
console.log('\n[B] 里症问诊（毒/神魂/伤疼，按病收钱按定数压症）');
{
    purse = 500; debitCalls.length = 0; msgs.length = 0;
    var phys = setPhys(80, 40, 30);
    var out = RELIEF.doctor();
    assert(out.indexOf('poison') >= 0 && out.indexOf('shock') >= 0 && out.indexOf('pain') >= 0, 'B1 三样里症一次看全（一趟诊各看各的病）');
    eq(phys.poisonLoad, 80 - CLINIC.POISON_CURE, 'B2 针引药力拔毒六成（80 → 20——剩下的靠底子将养）');
    eq(phys.neuralShock, 0, 'B3 安神汤定魂香：神魂震伤压到底（40 → 0，不留负账）');
    eq(phys.painLoad, 0, 'B4 止疼散压疼（30 → 0）');
    eq(feeSum(), CLINIC.POISON_FEE + CLINIC.SHOCK_FEE + CLINIC.PAIN_FEE, 'B5 诊金按病各收各的（25+20+10 = 55，一趟诊一本明白账）');
    eq(debitCalls.length, 3, 'B5b 三病三笔（不并成一笔糊涂账）');
    assert(msgCount('余毒') === 1 && msgCount('解毒的丹药') === 1, 'B6 毒没拔净有话术交底（要拔净还得丹药——梯度讲在明处）');
    assert(msgCount('神魂归了位') === 1, 'B7 神魂压净了是另一套话术（归了位）');
    assert(msgCount('疼头压下去了') === 1 && msgCount('药劲过了还会疼') === 1, 'B8 止疼是压不是治（话术不骗人）');
    eq(creditCalls.length, 0, 'B9 里症账也零增发');
    // 轻症门槛：这点毛病睡一觉就好
    purse = 500; debitCalls.length = 0; msgs.length = 0;
    var p2 = setPhys(CLINIC.AIL_MIN, CLINIC.AIL_MIN, CLINIC.AIL_MIN);
    var out2 = RELIEF.doctor();
    eq(out2.length, 0, 'B10 门槛之下不看（5 不算病——大夫不挣这个钱）');
    eq(debitCalls.length, 0, 'B10b 一枚不扣');
    assert(msgCount('不用花这个冤枉钱') === 1, 'B11 没病有话术（把过脉看过舌苔才说的）');
    eq(p2.poisonLoad, CLINIC.AIL_MIN, 'B11b 轻症分毫未动（不治就是不治）');
    //  gradient：睡卧 < 大夫 < 丹药拔净
    assert(CLINIC.POISON_CURE > RELIEF.CFG.INN.POISON && CLINIC.SHOCK_CURE > RELIEF.CFG.INN.SHOCK && CLINIC.PAIN_CURE > RELIEF.CFG.INN.PAIN,
        'B12 梯度不破：城中客栈睡卧（40/40/30）< 大夫针药（60/60/50）< 解毒丹拔净（丹药老账）——花钱买的是快和狠，不是唯一解');
}

// ==================== C · 接线账 ====================
console.log('\n[C] 接线账（医馆诊治收尾真调了坐堂账）');
{
    var app = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
    assert(app.indexOf('window.wildMapApi.relief.doctor()') >= 0, 'C1 app.js 医馆诊治收尾接线在册（外伤账结完看里症）');
    var cStart = app.indexOf('function openMedicalClinic');
    var cSeg = app.slice(cStart, app.indexOf('\nfunction ', cStart + 10));
    assert(cSeg.indexOf('relief.doctor()') >= 0 && cSeg.indexOf('医馆就诊') >= 0 && cSeg.indexOf('var fee = 15') >= 0,
        'C2 外伤老账一字未动（15 灵石诊治/止血/耐久照旧——里症是收尾添的一段）');
    assert(app.indexOf('外伤 15 灵石起，里症按病另收') >= 0, 'C3 就医按钮话术改口（不再只报 15——里症按病另收，账讲在明处）');
    assert(cSeg.indexOf('eClinicWard') >= 0, 'C4 坐堂账包着 try 调（里症账塌了不殃及外伤账）');
}

// ==================== D · 哨兵 ====================
console.log('\n[D] 哨兵（零骰、零存档、零增发、老切片不殃及）');
{
    var rm = fs.readFileSync(path.join(ROOT, 'js/map/randomMap.js'), 'utf8');
    var sStart = rm.indexOf('============ 第六十二波');
    var sEnd = rm.indexOf('window.wildMapApi = {');
    assert(sStart > 0 && sEnd > sStart, 'D0 六十二波段落标记有效（锚在横幅上）');
    var seg = rm.slice(sStart, sEnd);
    eq((seg.match(/Math\.random/g) || []).length, 0, 'D1 坐堂一节零骰（诊不诊得出、收多少、压多少全是定数）');
    assert(seg.indexOf('localStorage') < 0 && seg.indexOf('saveWildState') < 0 && seg.indexOf('wildState') < 0,
        'D2 坐堂零直写存档（病是运行时账——风寒旗与身子骨都不进差量档）');
    assert(seg.indexOf('.credit(') < 0 && seg.indexOf('addSpiritStones') < 0,
        'D3 医馆只收不发（诊金进药柜，零增发——守恒）');
    assert(seg.indexOf('insightPoints') < 0 && seg.indexOf('markOnce') < 0, 'D4 悟道点零发放（总闸已满）');
    // 老切片不殃及
    var w59 = rm.slice(rm.indexOf('============ 第五十九波'), rm.indexOf('============ 对外暴露'));
    eq((w59.match(/Math\.random/g) || []).length, 1, 'D5 五十九波切片仍一枚骰（风寒骰——坐堂段在切片外）');
    var rl = rm.slice(rm.indexOf('第五十三波 · 睡卧养身解状态异常'), rm.indexOf('function wildCamp'));
    eq((rl.match(/Math\.random/g) || []).length, 0, 'D6 五十三波切片仍零骰');
    var bStart = rm.indexOf('function buildWildMap');
    var buildSeg = rm.slice(bStart, rm.indexOf('\nfunction ', bStart + 10));
    assert(buildSeg.indexOf('CLINIC') < 0 && buildSeg.indexOf('clinic') < 0, 'D7 建图段无坐堂任何调用（骰序零漂移照旧）');
    assert(rm.indexOf('doctor: clinicTreatAfflictions') >= 0 && rm.indexOf('CLINIC: {') >= 0, 'D8 对账出口在册（relief.doctor / relief.CFG.CLINIC）');
    assert(rm.indexOf('clinic: prev') < 0 && rm.indexOf('prev.clinic') < 0 && seg.indexOf('prev.') < 0,
        'D9 存档白名单没收坐堂（本就是零新字段——病在身上，不在档里）');
    assert(rm.indexOf('nemesis: null, notes: {}, px: -1') >= 0, 'D10 默认域对象串一字未动');
    // 话术零拉丁（代码记号走过滤与白名单）
    var latin = /[A-Za-z]/;
    var allow = ['spiritStones'];
    var visLeak = null;
    (seg.match(/'[^']+'/g) || []).forEach(function (s) {
        var v = s.slice(1, -1);
        if (/[+);({\[,]/.test(v)) return;
        if (/^[a-z0-9]+(?:[-_: ][a-z0-9]+)*$/.test(v)) return;   // 小写代码记号（chill/poison-unpaid 之类）
        if (latin.test(v) && allow.indexOf(v) < 0) visLeak = visLeak || s;
    });
    assert(visLeak === null, 'D11 坐堂一节话术零拉丁（漏: ' + visLeak + '）');
    // 梯度常数对账
    assert(CLINIC.CHILL_FEE === 8 && CLINIC.POISON_FEE === 25 && CLINIC.SHOCK_FEE === 20 && CLINIC.PAIN_FEE === 10,
        'D12 四笔诊金与施工图对账（8/25/20/10——风寒最贱，拔毒最贵）');
    assert(CLINIC.AIL_MIN === 5, 'D13 轻症门槛 5（这点毛病睡一觉就好）');
}

console.log('\n========== 第六十二波 · 医馆坐堂 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
