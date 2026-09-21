/**
 * wave111-zhangmu-node.js — 第一百一十一波 · 账目错批次（一百零九波审计的下半场）验收：
 *   A 事件总线退订口   B 世界事件（排期总闸/死修正/新局清账/城市残留分槽/载入回灌）
 *   C 世界日历（双记账/订阅不清）  D 市价到期回冲   E 节帖时间账与闭关豁免
 *   F 大比周期与战力   G 门派灾难到期坐实   H 哨兵
 *
 * 运行：node tests/wave111-zhangmu-node.js
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
function near(a, b, msg) { assert(Math.abs(a - b) < 1e-9, msg + '（实际=' + a + ' 期望≈' + b + '）'); }
function load(rel) { vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel }); }
function src(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ==================== 测试桩 ====================
global.window = global;
global.XianXia = {};
var els = {};
function fakeEl() {
    return { style: {}, attrs: {}, children: [], setAttribute: function () {}, getAttribute: function () { return null; }, appendChild: function (c) { this.children.push(c); }, remove: function () {}, addEventListener: function () {}, classList: { add: function () {}, remove: function () {}, contains: function () { return true; } }, innerHTML: '', textContent: '', options: [] };
}
global.document = {
    readyState: 'complete',
    createElement: fakeEl, createElementNS: function (ns, t) { return fakeEl(); },
    getElementById: function (id) { if (!els[id]) els[id] = fakeEl(); return els[id]; },
    querySelector: function () { return null; }, querySelectorAll: function () { return []; },
    addEventListener: function () {}, body: { appendChild: function () {} }
};
var store = {};
global.localStorage = {
    getItem: function (k) { return store[k] !== undefined ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; }
};
var msgs = [];
global.showMessage = function (m) { msgs.push(String(m)); };
global.gameLog = { entries: [], add: function (m) { this.entries.push(m); } };
global.updateCurrencyUI = function () {};
global.updateCharacterStatus = function () {};
global.itemById = {};
global.inventory = { currency: { spiritStones: 100, copper: 100 }, maxSlots: 30, slots: [] };
var _day = 100;
var _min = _day * 1440;
global.getAbsoluteDay = function () { return _day; };
global.timeSystem = { advanceTime: function () {}, getAbsoluteDay: function () { return _day; }, gameTime: { get currentDay() { return _day; }, get totalMinutes() { return _day * 1440; } }, onNewDaySubscribe: function () {} };
global.GameScheduler = { nowMinute: function () { return _min; } };
global.currentCharData = { name: '核账人', realm: '筑基', layer: 3, location: '洛水城', lifeSkills: {}, bonds: {} };
global.locationSystem = { getCurrentLocation: function () { return '洛水城'; } };
var _origRandom = Math.random;
function withRandom(v, fn) { Math.random = function () { return v; }; try { return fn(); } finally { Math.random = _origRandom; } }

load('js/core/event-bus.js');

// ==================== A · 事件总线退订口 ====================
console.log('\n[A] 事件总线：on() 的返回值是真退订函数');
var hits = 0;
var unsub = EventBus.on('wave111:probe', function () { hits++; });
eq(typeof unsub, 'function', 'A1 返回的是函数（此前返回总线对象，unsub() 必抛 TypeError 被吞）');
EventBus.emit('wave111:probe', {});
eq(hits, 1, 'A2 订阅照常生效');
unsub();
EventBus.emit('wave111:probe', {});
eq(hits, 1, 'A3 退订真摘除——「闭关至事件」每用一次泄漏一个监听器的病根拔了');
assert(src('js/cultivation/long-retreat.js').indexOf('unsub = global.EventBus.on(') >= 0, 'A4 long-retreat 的调用姿势原样能用了（不用改它）');

load('js/core/world-calendar.js');
load('js/world-events.js');

// ==================== B · 世界事件 ====================
console.log('\n[B] 世界事件：排期按各自 interval、死修正摘牌、新局清账、城市残留分槽');
withRandom(0, function () { checkWorldEvents(15); });
eq(isWorldEventActive('market_boom'), true, 'B1 第 15 天坊市繁荣真触发（旧 %10 总闸要拖到第 30 天——interval 15 名不副实）');
eq(isWorldEventActive('treasure'), false, 'B2 interval 10 的事件第 15 天不触发（各走各的排期，没有乱账）');
var mods = getActiveWorldEventModifiers();
eq('combatExp' in mods, false, 'B3 combatExp 死修正摘牌（全库零消费者，牌面不挂空账）');
eq('factionConflict' in mods, false, 'B4 factionConflict 死修正摘牌');
// 城市残留分槽：boom（坊市，3天）与 scar（兽潮，5天）叠在同城，各记各的到期日
setCityTempModifier('洛水城', { flag: 'beast_tide_scar', travelRisk: 1.4, security: 0.6, days: 5 });
var ct = getCityTempModifier('洛水城');
near(ct.shopPrice, 0.85, 'B5 坊市 boom 的价账在');
near(ct.travelRisk, 1.4, 'B6 兽潮 scar 的险账也在（旧版单槽互踩，后设的会把先设的整槽顶掉）');
_day = 104;   // boom 的 endDay=103 已过，scar 的 endDay=105 还没
var ct2 = getCityTempModifier('洛水城');
assert(ct2 && ct2.shopPrice == null && near2(ct2.travelRisk, 1.4), 'B7 到期各删各的：boom 平了，scar 还在（不再被邻居提前带走）');
function near2(a, b) { return Math.abs(a - b) < 1e-9; }
// 载入回灌与真出口
var ref = window.activeWorldEvents;
store['xianxia_world_events'] = JSON.stringify({ spirit_tide: { startDay: 1, duration: 2, endDay: 3 } });
loadWorldEvents();
eq(window.activeWorldEvents === ref, true, 'B8 载入就地灌——window 引用不再变陈旧指针');
eq(isWorldEventActive('spirit_tide'), true, 'B9 键真灌进来了');
var ex = exportWorldEventsState();
assert(ex && ex.worldEvents && ex.cityTemp, 'B10 exportWorldEventsState 有真身（game-state 的死引用活了，存档取内存真源）');
// 新局清账
resetWorldEventsState();
eq(isWorldEventActive('spirit_tide'), false, 'B11 新局清账：旧档的灵气潮汐不再套在新角色身上');
eq(Object.keys(window.cityTempModifiers).length, 0, 'B12 城市残留一并清');
_day = 100;

// ==================== C · 世界日历 ====================
console.log('\n[C] 世界日历：触发过不再双记账，新局不清订阅');
var dueHits = [];
EventBus.on('worldCalendar:due', function (p) { dueHits.push(p.event.id); });
WorldCalendar.register({ id: 'cal_t1', title: '探账', category: 'auction', dueAbsoluteDay: 100, source: { system: 't' }, severity: 'info', oneShot: false });
var fired1 = WorldCalendar.consumeDue(100);
eq(fired1.length, 1, 'C1 到期日照常触发');
var fired2 = WorldCalendar.consumeDue(101);
eq(fired2.length, 0, 'C2 次日不再触发');
var logT1 = (WorldCalendar.serialize().log || []).filter(function (l) { return l.title === '探账'; });
eq(logT1.length, 1, 'C3 日志只记一笔「如期」——旧版非 oneShot 次日必再记一笔「已过期」，摘要与分类汇总全虚高');
var subHits = 0;
WorldCalendar.subscribe(function () { subHits++; });
WorldCalendar.reset();
WorldCalendar.register({ id: 'cal_t2', title: '-reset后', category: 'auction', dueAbsoluteDay: 100, source: { system: 't' }, severity: 'info', oneShot: true });
WorldCalendar.consumeDue(100);
eq(subHits, 1, 'C4 新局 reset 不清订阅——节帖/道侣约的裁决弹窗不再从此失聪');

// ==================== D · 市价到期回冲 ====================
console.log('\n[D] 市价：「持续 N 天」不再是装饰账');
load('js/extensions/market-dynamic.js');
var baseMul = MarketDynamic.priceMul('中州', '食物');
MarketDynamic.applyWorldEvent('festival');
var hotMul = MarketDynamic.priceMul('中州', '食物');
assert(hotMul > baseMul, 'D1 节庆生效日冲击真落地（' + baseMul.toFixed(3) + '→' + hotMul.toFixed(3) + '）');
_day = 106;   // festival duration 5 → expireDay 105
withRandom(0.99, function () { MarketDynamic.tickDay(); });
var backMul = MarketDynamic.priceMul('中州', '食物');
near(backMul, baseMul, 'D2 到期日冲击原样回冲——事件天数与行情真对上账（旧版靠自然回归磨两三天就平了）');
_day = 100;

// ==================== E · 节帖时间账与闭关豁免 ====================
console.log('\n[E] 节帖：一整天就是一整天，闭关的人不判罪');
var affChanges = [];
global.npcManager = {
    getNPC: function (id) {
        return id === 'np1' ? { id: 'np1', name: '云娘', changeAffection: function (d) { affChanges.push(d); } } : null;
    },
    getAllNPCs: function () { return []; }
};
load('js/core/festival-bridge.js');
global.currentCharData.bonds = { np1: { type: 'dao_companion', name: '云娘', level: 1, festival: { 'shangyuan_1': { status: 'invited', dueDay: _day - 1, fname: '上元灯节' } } } };
global._isInLongRetreat = true;
festivalTick();
eq(affChanges.length, 0, 'E1 闭关跨节不扣分（旧版死关里弹窗物理上点不到，出关必吃「装死不回」-5）');
eq(global.currentCharData.bonds.np1.festival['shangyuan_1'].status, 'retreat', 'E2 帖子如实记「闭关误节」，出关也不再追罚');
global._isInLongRetreat = false;
global.currentCharData.bonds.np1.festival['duanwu_1'] = { status: 'invited', dueDay: _day - 1, fname: '端阳' };
festivalTick();
eq(affChanges.length, 1, 'E3 醒着的人装死不回——照旧记罚（豁免只给闭关）');
eq(affChanges[0], -5, 'E4 罚账还是那笔 -5');
assert(src('js/core/festival-bridge.js').indexOf('ACCEPT_TIME = 1440') >= 0, 'E5 「占一整天」真收一整天（1440 分钟；旧版只收 60，时间代价被单位错误架空）');
assert(src('js/core/dao-bridge.js').indexOf("advanceTime(720, '湖上赴约')") >= 0, 'E6 湖上约「耗时半日」真收半日（720 分钟，旧版 30）');

// ==================== F · 大比周期与战力 ====================
console.log('\n[F] 大比：周期不跳拍、战力不双标不吃陈旧快照');
var stSrc = src('js/sects/sect-tournament.js');
assert(stSrc.indexOf('st.lastSeason = ev.closesDay') < 0, 'F1 结算不再把周期账覆写成 closesDay（旧版小比实际 180 天一届、大比 720 天）');
assert(stSrc.indexOf('powerA += 1') < 0, 'F2 玩家 +1 只算一次（playerPower 里那一次，双标拆了）');
assert(stSrc.indexOf('c.power = playerPower()') >= 0, 'F3 开打才称斤两——报名期里的修炼不再白练');
assert(stSrc.indexOf('Math.random() < 0.5 ? a : b') >= 0, 'F4 平局掷硬币，不再判先手胜');

// ==================== G · 门派灾难到期坐实 ====================
console.log('\n[G] 门派事件：没人管的灾难到期真发生（不再只领福利不接灾）');
global.SECT_INTERNAL = { '测试宗': { morale: 50, resources: 100, disciples: 20 } };
load('js/sects/sect-events.js');
_min = _day * 1440 + 1000;
window.sectEventState.activeEvents['测试宗'] = {
    event: { id: 'demon_beast_rampage', name: '妖兽肆虐' },
    expiryGameMinute: _min - 1
};
msgs.length = 0;
withRandom(0.99, function () { window.checkSectEvents('测试宗'); });
eq(SECT_INTERNAL['测试宗'].morale, 20, 'G1 过期没人处置——士气 -30 真扣（旧版静默删除、零损失）');
eq(SECT_INTERNAL['测试宗'].resources, 50, 'G2 资源 -50 真扣');
assert(msgs.join('').indexOf('真发生了') >= 0, 'G3 如实播报：事情真发生了');

// ==================== H · 哨兵 ====================
console.log('\n[H] 哨兵');
assert(src('js/core/world-loop.js').indexOf("'东荒': '东海'") >= 0, 'H1 东荒行情归属三本账并一本（买价/记账/野图同认东海）');
assert(src('js/sects/sect-festival-succession.js').indexOf('(absDay() - 1) / 360') >= 0, 'H2 年纪元统一（与节日桥/年目标同款，第 360 天不再各认各的年）');
assert(src('js/core/game-state.js').indexOf('resetWorldEventsState') >= 0, 'H3 新局清账接进了 resetWorldForNewGame');
var _resetFn = (src('js/core/world-calendar.js').match(/function reset\(\) \{[\s\S]*?\n    \}/) || [''])[0];
assert(_resetFn.indexOf('subscribers = []') < 0 && _resetFn.indexOf('freshState') >= 0, 'H4 reset 不再清订阅（事件账清了，听账的人还在）');
['js/world-events.js', 'js/core/world-calendar.js', 'js/core/festival-bridge.js', 'js/core/dao-bridge.js', 'js/extensions/market-dynamic.js', 'js/core/world-loop.js', 'js/sects/sect-tournament.js', 'js/sects/sect-events.js', 'js/core/event-bus.js', 'js/sects/sect-festival-succession.js', 'js/core/game-state.js'].forEach(function (f) {
    assert(src(f).indexOf('一百一十一波') >= 0, 'H5 改动挂着本波的号（' + f.split('/').pop() + '）');
});
assert(src('tests/run-all.sh').indexOf('wave111-zhangmu-node.js') >= 0, 'H6 本套已挂全量回归');

console.log('\n========== wave111 结果：' + passed + ' 通过 / ' + failed + ' 失败 ==========');
if (failed > 0) process.exit(1);
