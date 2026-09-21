/**
 * wave95-economy-facility-fixes-node.js — 第九十五波 · 经济/设施/情境簇外包修复 验收
 *
 * 验收点（编号=外包测试报告 FIX_NOTES 编号）：
 *   A NEW-28：带 roll 的选项，选项级 time 不再被吞；分支内 time 优先；cost 折叠不被合并破坏
 *   B NEW-29：拍卖「奋力跟价」一次摇点定落槌价——播报价 === 实扣价
 *   C NEW-31：强化扣费走 EconomyTransaction.debit（镜像回填）；余额不足整笔不成交；无事务模块兜底双写
 *   D NEW-32：声望城名 repKey 归一；带空格旧档合并迁移（value 取较大）；reputation:changed 带 normalized
 *   E NEW-33：卖出声望修正真调 getReputationValue（城名先去空格）；每100点+1%、封顶+10%
 *   F NEW-34：时辰口径三处（寻差事两个时辰 / 摆摊一个时辰 / 打盹半个时辰）与 1时辰=120分钟 一致
 *   G NEW-37：开放丹方选材认 templateId 格子——辅药/调和列出甘草，主药该拒仍拒
 *   H NEW-38：travelSystem.unlockTeleport 导出且归一落键；传送 go() 不再双扣费/双推时间；途中遭遇走 __scenarioRng
 *   I NEW-23：长期闭关可点行无 🔒、弹窗标题 🧘、空日程给说明文案；.battle-modal 误判清零（改判 window.currentBattle）
 *   J NEW-27：全满歇脚不扣钱不推时间；歇脚推进带「打尖歇脚」名号；客栈台词无整夜口径
 *   K NEW-35：流程终点（收摊/自动收摊/上工/打盹/庙会结算/河工承揽/盐引成交）挂上 closeModalSoft
 *   L NEW-04/05/13/25/灯谜重复：建筑窗不叠罗汉、当铺清单窗调用侧去重、悬赏接取即重绘、
 *     情境终态延迟软收挂上（中间步不收）、店招类型中文名映射（映射不到隐藏该行）、灯谜彩头账只拼一次
 *
 * 运行：node tests/wave95-economy-facility-fixes-node.js
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

// ==================== 测试桩（wave94 同款结构） ====================
global.window = global;

var els = {};        // id → fakeEl（不在 body 里的元素缓存）
var bodyKids = [];   // 真挂到 body 的节点（可被 remove/querySelectorAll）
function fakeEl(tag) {
    var el = {
        tag: tag || '', id: undefined, children: [], style: {}, parentNode: null,
        setAttribute: function () {}, getAttribute: function () { return null; },
        appendChild: function (c) { this.children.push(c); return c; },
        removeChild: function () {}, addEventListener: function () {}, removeEventListener: function () {},
        closest: function () { return null; }, scrollIntoView: function () {},
        classList: { added: [], add: function (c) { this.added.push(c); }, remove: function () {}, toggle: function () {}, contains: function () { return false; } },
        _html: '', textContent: '', options: [], onclick: null,
        remove: function () {
            var i = bodyKids.indexOf(el);
            if (i >= 0) bodyKids.splice(i, 1);
        }
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
    getElementById: function (id) {
        for (var i = 0; i < bodyKids.length; i++) { if (bodyKids[i].id === id) return bodyKids[i]; }
        if (!els[id]) els[id] = fakeEl();
        return els[id];
    },
    querySelectorAll: function (sel) {
        if (typeof sel === 'string' && sel.charAt(0) === '#') {
            var want = sel.slice(1);
            return bodyKids.filter(function (el) { return el.id === want; });
        }
        return [];
    },
    querySelector: function () { return null; },
    addEventListener: function () {},
    body: { appendChild: function (el) { bodyKids.push(el); return el; }, insertAdjacentHTML: function () {} }
};
var store = {};
global.localStorage = {
    getItem: function (k) { return store[k] !== undefined ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; }
};
var timeouts = [];
global.setTimeout = function (fn, ms) { timeouts.push({ fn: fn, ms: ms }); return timeouts.length; };

var msgs = [];
global.showMessage = function (m, t) { msgs.push({ m: String(m), t: t }); };
var modalCalls = [];
global.showModal = function (title, html) { modalCalls.push({ title: String(title), html: String(html) }); };
var softCloseCalls = 0;
global.closeModalSoft = function () { softCloseCalls++; };

global.gameLog = { entries: [], add: function (m, t) { this.entries.push({ m: String(m), t: t }); } };
global.EventBus = { sent: [], emit: function (ev, payload) { this.sent.push({ ev: ev, payload: payload }); }, on: function () { return function () {}; } };
global.updateCharacterStatus = function () {};
global.updateCurrencyUI = function () {};
global.updateInventoryUI = function () {};
global.confirm = function () { return true; };
global.itemById = {};
global.addItem = function () { return 1; };
global.getRealmTier = function () { return 1; };
global.XianXia = {};

var tsCalls = [];    // timeSystem.advanceTime
var advCalls = [];   // window.advanceTime（情境引擎口径）
var dayVal = 2;
global.getAbsoluteDay = function () { return dayVal; };
global.timeSystem = {
    gameTime: { totalMinutes: 0, currentDay: 1 },
    advanceTime: function (m, name) { tsCalls.push({ m: m, name: name }); this.gameTime.totalMinutes += m; },
    onNewDaySubscribe: function () {},
    getAbsoluteDay: function () { return dayVal; },
    getCultivationSpeedBonus: function () { return 1; }
};
global.advanceTime = function (m, name) { advCalls.push({ m: m, name: name }); };
global.WorldCalendar = { day: 0 };

var arrivals = [];
global.locationSystem = {
    getCurrentLocation: function () { return (global.currentCharData && global.currentCharData.location) || '帝都·长安'; },
    getCityData: function () { return { region: '中州', buildings: ['shop', 'inn'], priceModifier: { sell: 1, buy: 1 } }; },
    getCityPriceModifier: function () { return 1; },
    travelToCity: function (c) { arrivals.push(c); }
};
global.getCurrentCityName = function () { return global.locationSystem.getCurrentLocation(); };

var dmDeducts = [];
global.XianXia.DataManager = {
    getSpiritStones: function () { return global.inventory.currency.spiritStones; },
    deductSpiritStones: function (n) {
        dmDeducts.push(n);
        if (global.inventory.currency.spiritStones < n) return false;
        global.inventory.currency.spiritStones -= n;
        if (global.currentCharData) global.currentCharData.spiritStones = global.inventory.currency.spiritStones;
        return true;
    },
    getCopper: function () { return global.inventory.currency.copper; },
    addSpiritStones: function (n) { global.inventory.currency.spiritStones += n; return true; }
};

global.inventory = { currency: { spiritStones: 5000, copper: 5000 }, slots: [], maxSlots: 30 };
global.currentCharData = {
    name: '测试侠', realm: '炼气', layer: 1, location: '测试城',
    health: 100, maxHealth: 100, qi: 100, maxQi: 100, energy: 100, maxEnergy: 100,
    tempering: 0, karma: 0, notoriety: 0, fame: 0, mood: 80, lifeSkills: {}, flags: {}
};

var origRnd = Math.random;
function stubRnd(v) { Math.random = function () { return v; }; }
function restoreRnd() { Math.random = origRnd; }
function rngQueue(arr) { var i = 0; return function () { return i < arr.length ? arr[i++] : 0.5; }; }

// ==================== 加载被测模块 ====================
load('js/economy/economy-transaction.js');
load('js/core/reward-service.js');
load('js/core/scenario-engine.js');
load('js/city-facilities/facility-batch2.js');
load('js/reputation-system.js');
load('js/enhanced-shop.js');
load('js/enhancement.js');
load('js/crafting/alchemy-compound.js');
load('js/travel-system.js');
load('js/building-effects.js');
load('js/quest/bounty-board.js');
load('js/cultivation/long-retreat.js');
load('js/city-facilities/street-stall.js');
load('js/city-facilities/city-jobs.js');
load('js/city-facilities/city-lodging.js');
load('js/city-facilities/festival-fair.js');

var eng = global.scenarioEngine;

// ==================== A · NEW-28 选项级 time 带 roll 也生效 ====================
console.log('\n[A] NEW-28 情境引擎：roll 分支不再吞选项级耗时');
eng.register('t_n28', {
    id: 't_n28', name: '测试', icon: 'x', desc: 'x',
    scenarios: [{ id: 's', name: 's', desc: 's', startNode: 'n', nodes: {
        n: { desc: 'x', choices: [
            { text: '选项级time+roll', next: null, effects: { time: 15, roll: { prob: 1, win: { exp: 1, msg: '赢了' }, lose: {} } } },
            { text: '分支内time优先', next: null, effects: { time: 15, roll: { prob: 1, win: { time: 30, exp: 1 }, lose: {} } } },
            { text: 'cost折进分支', next: null, effects: { cost: { stones: 50 }, time: 10, roll: { prob: 1, win: { stones: 120 }, lose: {} } } },
            { text: '败分支也带选项time', next: null, effects: { time: 25, roll: { prob: 0, win: {}, lose: { exp: 2 } } } },
            { text: '分支无time继承选项级', next: null, effects: { time: 40, roll: { prob: 1, win: { exp: 3 }, lose: {} } } }
        ] }
    } }]
});
advCalls.length = 0;
eng.start('t_n28', 's');
var rA1 = eng.choose(0);
assert(!rA1.error && advCalls.some(function (c) { return c.m === 15; }), 'A1 带 roll 的选项，选项级 time:15 真推进了');
eng.start('t_n28', 's');
advCalls.length = 0;
eng.choose(1);
assert(advCalls.some(function (c) { return c.m === 30; }) && !advCalls.some(function (c) { return c.m === 15; }),
    'A2 分支内写了 time:30 就用分支的（分支优先，不被选项级 15 覆盖）');
var stonesBeforeA3 = global.inventory.currency.spiritStones;
eng.start('t_n28', 's');
advCalls.length = 0;
var rA3 = eng.choose(2);
eq(global.inventory.currency.spiritStones - stonesBeforeA3, 70, 'A3 cost 折叠不被破坏：得120扣本50净+70（只扣一次本）');
assert(!rA3.error && advCalls.some(function (c) { return c.m === 10; }), 'A4 cost+roll 复合时选项级 time:10 照样生效');
eng.start('t_n28', 's');
advCalls.length = 0;
eng.choose(3);
assert(advCalls.some(function (c) { return c.m === 25; }), 'A5 掷中败分支，选项级 time:25 也不丢');
assert(src('js/core/scenario-engine.js').indexOf("ek !== 'roll' && ek !== 'cost'") >= 0, 'A6 引擎合并按报告补丁口径（roll/cost 除外，分支覆盖选项级）');

// ==================== B · NEW-29 拍卖播报价=实扣价 ====================
console.log('\n[B] NEW-29 拍卖落槌价一次摇点');
global.inventory.currency.spiritStones = 5000;
var rngCallsB = 0;
var qB = rngQueue([0.1, 0.5]);
global.__scenarioRng = function () { rngCallsB++; return qB(); };
global.gameLog.entries.length = 0;
eng.start('auction_house', 'auction');
eng.choose(0);                       // 参与竞拍 → au_bid（desc 清缓存）
var beforeB = global.inventory.currency.spiritStones;
advCalls.length = 0;
var rB = eng.choose(0);              // 奋力跟价：prob 摇 0.1 中胜；hammer 摇 0.5 → round(500*1.3)=650
assert(!rB.error, 'B1 竞拍成交无报错');
eq(rngCallsB, 2, 'B2 全场只摇两次点（一次定成败、一次定落槌价——不再各摇各的）');
eq(beforeB - global.inventory.currency.spiritStones, 650, 'B3 实扣 650 灵石（500×1.3）');
var logB = global.gameLog.entries.map(function (e) { return e.m; }).join('|');
assert(logB.indexOf('650灵石，成交') >= 0, 'B4 播报价 === 实扣价（日志喊的也是 650）');
assert(advCalls.some(function (c) { return c.m === 15; }), 'B5 「奋力跟价」的选项级 time:15 也真推进了（NEW-28 联动）');
delete global.__scenarioRng;

// ==================== C · NEW-31 强化扣费走 debit ====================
console.log('\n[C] NEW-31 强化扣费走经济事务（镜像不再漂移）');
var realET = global.EconomyTransaction;
var debitCalls = [], creditCalls = [];
global.EconomyTransaction = {
    run: function (fn) { return realET.run(fn); },
    capture: realET.capture, restore: realET.restore, getBalance: realET.getBalance,
    debit: function (k, n) { debitCalls.push([k, n]); return realET.debit(k, n); },
    credit: function (k, n) { creditCalls.push([k, n]); return realET.credit(k, n); },
    removeByUid: realET.removeByUid, removeByTemplate: realET.removeByTemplate,
    addSnapshot: realET.addSnapshot, slotSnapshot: realET.slotSnapshot
};
global.inventory.currency = { spiritStones: 41, copper: 3180 };
global.currentCharData.spiritStones = 41; global.currentCharData.copper = 2940;   // 报告里的漂移现场
global.currentEquipment = { weapon: { name: '铁掌' } };
stubRnd(0.1);   // 强化成功
var rC1 = global.enhanceEquipmentSlot('strengthen', 'weapon');
restoreRnd();
eq(rC1.success, true, 'C1 强化成交');
assert(debitCalls.some(function (c) { return c[0] === 'spiritStones' && c[1] === 20; }) &&
       debitCalls.some(function (c) { return c[0] === 'copper' && c[1] === 10; }),
    'C2 扣费走 EconomyTransaction.debit（灵石20/铜钱10），不再裸写钱包');
eq(global.inventory.currency.spiritStones, 21, 'C3 真账扣了（41→21）');
eq(global.currentCharData.spiritStones, 21, 'C4 镜像同步回填（41→21，两本账并成一本）');
eq(global.currentCharData.copper, 3170, 'C5 铜钱镜像也从 2940 拉回真账 3170');
// 余额不足：整笔不成交
global.inventory.currency = { spiritStones: 41, copper: 5 };
global.currentCharData.spiritStones = 41; global.currentCharData.copper = 5;
global.currentEquipment = { weapon: { name: '铁掌' } };
debitCalls.length = 0; creditCalls.length = 0;
tsCalls.length = 0;
var rC6 = global.enhanceEquipmentSlot('strengthen', 'weapon');
eq(rC6.success, false, 'C6 铜钱不足——整笔不成交');
eq(debitCalls.length, 0, 'C7 一笔都没扣（先查够再扣）');
eq(global.inventory.currency.spiritStones, 41, 'C8 灵石分文未动');
assert(tsCalls.length === 0, 'C9 没成交就不进炉（时间也没推）');
// 直接验 payEnhanceCost 的回补纪律：灵石腿扣成、铜钱腿失败 → 回补灵石
var spyET = {
    debit: function (k, n) { debitCalls.push([k, n]); return k !== 'copper'; },
    credit: function (k, n) { creditCalls.push([k, n]); return true; }
};
var savedET = global.EconomyTransaction;
global.EconomyTransaction = spyET;
debitCalls.length = 0; creditCalls.length = 0;
var rC10 = global.payEnhanceCost(20, 10);
global.EconomyTransaction = savedET;
eq(rC10, false, 'C10 铜钱腿付不成 → payEnhanceCost 报 false');
assert(creditCalls.some(function (c) { return c[0] === 'spiritStones' && c[1] === 20; }), 'C11 已扣的灵石腿当场回补（不留半笔账）');
// 兜底路径：事务模块未加载 → 双写
global.EconomyTransaction = undefined;
global.inventory.currency = { spiritStones: 30, copper: 20 };
global.currentCharData.spiritStones = 999; global.currentCharData.copper = 999;
var rC12 = global.payEnhanceCost(10, 5);
eq(rC12, true, 'C12 无事务模块时兜底扣费成功');
eq(global.inventory.currency.spiritStones, 20, 'C13 兜底扣真账（30→20）');
eq(global.currentCharData.spiritStones, 20, 'C14 兜底同笔写镜像（不留第二本账）');
eq(global.payEnhanceCost(9999, 0), false, 'C15 兜底也先查够再扣（不足报 false）');
eq(global.inventory.currency.spiritStones, 20, 'C16 不足时兜底分文未动');
global.EconomyTransaction = realET;
assert(src('js/enhancement.js').indexOf('currency.spiritStones -=') < 0, 'C17 enhancement.js 里裸写钱包减法清零');

// ==================== D · NEW-32 声望一本账 ====================
console.log('\n[D] NEW-32 城名归一（repKey）+ 旧档迁移');
global.mapData = { '中州': { cities: ['帝都 · 长安', '洛水城'] } };
store['xianxia_reputation'] = JSON.stringify({
    '帝都 · 长安': { value: 13, flags: ['旧旗'], unlockedFeatures: [], specialQuests: [{ id: 'q1' }] },
    '帝都·长安': { value: 24 },
    '洛水城': { value: 7 }
});
global.initReputationSystem();
eq(global.cityReputation['帝都 · 长安'], undefined, 'D1 带空格键迁移后被删');
eq(global.cityReputation['帝都·长安'].value, 24, 'D2 value 取两者较大（13/24→24；两本账是重复记账，求和会凭空放大）');
assert(global.cityReputation['帝都·长安'].flags.indexOf('旧旗') >= 0, 'D3 flags 并入');
eq(global.cityReputation['帝都·长安'].specialQuests[0].id, 'q1', 'D4 specialQuests 并入');
assert(Object.keys(JSON.parse(store['xianxia_reputation'])).indexOf('帝都 · 长安') < 0, 'D5 迁移结果已落档（存档里也只剩一本账）');
global.EventBus.sent.length = 0;
global.addReputation('帝都 · 长安', 5);
eq(global.getReputationValue('帝都·长安'), 29, 'D6 带空格拼写加声望，落到无空格那本（24+5=29）');
var evD = global.EventBus.sent.filter(function (e) { return e.ev === 'reputation:changed'; }).pop();
assert(evD && evD.payload.cityName === '帝都 · 长安', 'D7 事件保留原拼写 cityName');
assert(evD && evD.payload.normalized === '帝都·长安', 'D8 事件附带 normalized 归一城名（任务桥两种口径都对得上）');
global.setReputation('帝都 · 长安', 600);
eq(global.getReputationValue('帝都·长安'), 600, 'D9 setReputation 也过归一');
assert(global.getUnlockedFeatures('帝都 · 长安').indexOf('hidden_shop') >= 0, 'D10 解锁查询带空格拼写同样命中');
global.setReputation('洛水城', 1600);
var sq = global.getOrCreateSpecialQuests('洛水 城');
assert(sq.length === 3 && sq[0].id.indexOf('cityrep_洛水城_') === 0, 'D11 专属任务按归一城名建（id 不再带空格）');
global.reduceReputation('帝都 · 长安', 100);
eq(global.getReputationValue('帝都·长安'), 500, 'D12 reduceReputation 同口径（带空格拼写扣到同一本账：600-100=500）');
eq(global.repKey(' 帝都 · 长安 '), '帝都·长安', 'D13 repKey 导出口径正确');
assert(Object.keys(global.cityReputation).indexOf('洛水城') >= 0, 'D14 城市册里的带空格城名初始落键也归一');

// ==================== E · NEW-33 声望卖价加成接对线 ====================
console.log('\n[E] NEW-33 getReputationModifier 接真函数');
assert(src('js/enhanced-shop.js').indexOf('getCityReputation') < 0, 'E1 不存在的 getCityReputation 引用清零');
var grvCalls = [];
var realGRV = global.getReputationValue;
global.getReputationValue = function (c) { grvCalls.push(c); return realGRV(c); };
global.setReputation('帝都·长安', 0);
eq(global.TradeService.getReputationModifier('帝都·长安'), 1.0, 'E2 声望 0 → 倍率 1.0');
global.setReputation('帝都·长安', 500);
eq(global.TradeService.getReputationModifier('帝都 · 长安'), 1.05, 'E3 声望 500 → +5%（每100点+1%）');
eq(grvCalls[grvCalls.length - 1], '帝都·长安', 'E4 传入的带空格城名先去空格再查账');
global.setReputation('帝都·长安', 1000);
eq(global.TradeService.getReputationModifier('帝都·长安'), 1.1, 'E5 声望 1000 → 封顶 +10%');
global.setReputation('帝都·长安', 5000);
eq(global.TradeService.getReputationModifier('帝都·长安'), 1.1, 'E6 封顶不破（5000 也是 +10%）');
eq(global.TradeService.getReputationModifier(null), 1.0, 'E7 无地点 → 1.0');
global.getReputationValue = realGRV;

// ==================== F · NEW-34 时辰口径（1时辰=120分钟） ====================
console.log('\n[F] NEW-34 三处时辰口径');
var srcJobs = src('js/city-facilities/city-jobs.js');
var srcStall = src('js/city-facilities/street-stall.js');
var srcLodg = src('js/city-facilities/city-lodging.js');
var srcBE = src('js/building-effects.js');
assert(srcJobs.indexOf('四个时辰') < 0 && srcJobs.indexOf('上工（两个时辰') >= 0, 'F1 寻差事牌面改「两个时辰」（240分钟=2时辰）');
eq(global.CityJobs.CFG.SHIFT_MIN, 240, 'F2 minutes 不动（SHIFT_MIN 仍 240）');
eq(global.CityJobs.JOBS.shop_assistant.minutes, 240, 'F3 岗册工时不动');
assert(srcStall.indexOf('两个时辰') < 0 && srcStall.indexOf('一个时辰') >= 0, 'F4 摆摊注释与日志改「一个时辰」（120分钟=1时辰）');
eq(global.StreetStall.CFG.STALL_MIN, 120, 'F5 STALL_MIN 不动（仍 120）');
assert(srcLodg.indexOf('免费 · 半个时辰') >= 0 && srcLodg.indexOf('免费 · 一个时辰') < 0, 'F6 打盹牌面改「半个时辰」（60分钟）');
assert(srcBE.indexOf('(10灵石 · 一个时辰)') >= 0 && srcBE.indexOf("advanceTime(120, '打尖歇脚')") >= 0,
    'F7 客栈歇脚「一个时辰」=120分钟，牌面与账本就一致（NEW-02 核实项：数值不改）');
assert(srcBE.indexOf('(50灵石 · 两个时辰)') >= 0, 'F8 包间静养「两个时辰」=240分钟口径也对得上');

// ==================== G · NEW-37 开放丹方选材认 templateId ====================
console.log('\n[G] NEW-37 listAvailableMatsForSlot 宽容取值');
var qiOpen = global.AlchemyCompound.COMPOUND_PILFAR_RECIPES.filter(function (r) { return r.id === 'recipe_qi_open'; })[0];
var invG = [
    { uid: 'u1', templateId: 'mat_liquorice', count: 2 },
    { uid: 'u2', templateId: 'mat_scutellaria', count: 1 },
    null
];
var listAssist = global.AlchemyCompound.listAvailableMatsForSlot(qiOpen.slots.assist, invG);
assert(listAssist.some(function (m) { return m.itemId === 'mat_liquorice' && m.count === 2; }),
    'G1 辅药槽列出 templateId 格子里的甘草（旧版恒空）');
var listBal = global.AlchemyCompound.listAvailableMatsForSlot(qiOpen.slots.balancer, invG);
assert(listBal.some(function (m) { return m.itemId === 'mat_liquorice'; }) &&
       listBal.some(function (m) { return m.itemId === 'mat_scutellaria'; }),
    'G2 调和槽甘草黄芩都列得出');
var listMain = global.AlchemyCompound.listAvailableMatsForSlot(qiOpen.slots.main, invG);
eq(listMain.length, 0, 'G3 主药槽该拒仍拒（甘草回气 20<40——药性校验没被放水）');
var listOld = global.AlchemyCompound.listAvailableMatsForSlot(qiOpen.slots.assist, [{ itemId: 'mat_liquorice', count: 2 }]);
eq(listOld.length, 1, 'G4 itemId 合成数组口径兼容不回归');
eq(global.AlchemyCompound.checkSlotMat('mat_liquorice', qiOpen.slots.main).ok, false, 'G5 checkSlotMat 本尊口径未动');

// ==================== H · NEW-38 传送阵解锁与单扣费 ====================
console.log('\n[H] NEW-38 unlockTeleport 导出 + go() 不再双扣');
eq(typeof global.travelSystem.unlockTeleport, 'function', 'H1 unlockTeleport 已导出（进城处可调）');
global.currentCharData.location = '帝都·长安';
global.inventory.currency.spiritStones = 500;
global.currentCharData.spiritStones = 500;
dmDeducts.length = 0; tsCalls.length = 0; msgs.length = 0; arrivals.length = 0;
var goTele = global.buildingEffects.buildingEffectsRegistry.teleport.go;
eq(goTele('洛水城'), false, 'H2 未解锁的目的地照旧被拒（不扣费）');
eq(dmDeducts.length, 0, 'H3 被拒时分文未扣');
global.travelSystem.unlockTeleport('帝都 · 长安');
assert(global.travelSystem.unlockedTeleports.has('帝都·长安'), 'H4 带空格拼写容忍——存的是归一后的去空格形式');
var rngCallsH = 0;
global.__scenarioRng = function () { rngCallsH++; return 0.99; };   // 不触发途中事件
global.travelSystem.unlockTeleport('洛水城');
var okH = goTele('洛水城');
delete global.__scenarioRng;
eq(okH, true, 'H5 解锁后传送成行');
eq(dmDeducts.length, 1, 'H6 只扣一次祭阵费（旧版 go+startTravel 各扣 100 = 200）');
eq(dmDeducts[0], 100, 'H7 扣的就是牌面写的 100 灵石（与 method.cost 一致）');
assert(!tsCalls.some(function (c) { return c.name === '传送阵蓄能'; }), 'H8 go() 里重复的 30 分钟「传送阵蓄能」已删');
eq(tsCalls.length, 1, 'H9 时间只由 startTravel 推一次');
assert(arrivals.indexOf('洛水城') >= 0, 'H10 人真到了洛水城');
assert(rngCallsH >= 1, 'H11 途中遭遇判定走 __scenarioRng（零直掷骰口径）');
assert(src('js/building-effects.js').indexOf('传送阵蓄能') < 0, 'H12 building-effects 里双推时间的残渣清零');
global.currentCharData.location = '测试城';

// ==================== I · NEW-23 长期闭关门禁图标 ====================
console.log('\n[I] NEW-23 闭关门禁图标与战斗判法');
global.inventory.currency.spiritStones = 5000;
global.WorldCalendar = { day: 2, getNextByCategory: function () { return null; } };
modalCalls.length = 0;
global.openLongRetreatUI();
var lr = modalCalls[modalCalls.length - 1];
eq(lr.title, '🧘 长期闭关', 'I1 弹窗标题不再是 🔒');
assert(lr.html.indexOf('七日小闭关') >= 0 && lr.html.indexOf('🔒 七日小闭关') < 0, 'I2 能点的档位行没有装饰锁');
assert(lr.html.indexOf('天机未显') >= 0, 'I3 空日程行给说明文案（不再是干巴巴的「暂无」）');
assert(lr.html.indexOf('🔒 至下次拍卖') >= 0, 'I4 真没日程的行保留 🔒 且置灰（disabled）');
var srcLR = src('js/cultivation/long-retreat.js');
assert(srcLR.indexOf(".battle-modal") < 0, 'I5 class 拼错恒 false 的 .battle-modal 判法清零');
assert(srcLR.indexOf('global.currentBattle') >= 0, 'I6 改判 window.currentBattle 非空');
global.currentBattle = { dummy: 1 };
msgs.length = 0;
var rI7 = global.startLongRetreat(7);
eq(rI7, null, 'I7 战斗中不许闭关');
assert(msgs.some(function (m) { return m.m.indexOf('战斗中无法闭关') >= 0; }), 'I8 拦下时有明确回执');
delete global.currentBattle;

// ==================== J · NEW-27 歇脚满状态与名号 ====================
console.log('\n[J] NEW-27 打尖歇脚');
global.currentCharData.health = 100; global.currentCharData.maxHealth = 100;
global.currentCharData.qi = 100; global.currentCharData.maxQi = 100;
global.currentCharData.energy = 100; global.currentCharData.maxEnergy = 100;
dmDeducts.length = 0; tsCalls.length = 0; msgs.length = 0;
var restFn = global.buildingEffects.buildingEffectsRegistry.inn.rest;
eq(restFn(), false, 'J1 三项全满时歇脚不成交');
eq(dmDeducts.length, 0, 'J2 全满不扣钱');
eq(tsCalls.length, 0, 'J3 全满不推时间');
assert(msgs.some(function (m) { return m.m.indexOf('客官精神焕发，何必破费') >= 0; }), 'J4 如实回话「客官精神焕发，何必破费」');
global.currentCharData.energy = 50;
msgs.length = 0;
eq(restFn(), true, 'J5 有缺口时照常歇脚');
eq(dmDeducts[0], 10, 'J6 收 10 灵石');
assert(tsCalls.length === 1 && tsCalls[0].m === 120 && tsCalls[0].name === '打尖歇脚', 'J7 推进 120 分钟且带名号「打尖歇脚」');
var srcCV = src('js/city-facilities/city-voices.js');
['睡了一整夜', '一觉睡到天亮', '一夜未熄', '一夜像浮在海上', '睡半夜里', '一夜无梦'].forEach(function (kw) {
    assert(srcCV.indexOf(kw) < 0, 'J8 台词整夜口径清零：「' + kw + '」');
});

// ==================== K · NEW-35 流程终点收面板 ====================
console.log('\n[K] NEW-35 流程终点软收面板');
// K1-K3 街边摆摊：收摊 / 自动收摊
global.currentCharData.energy = 100;
global.currentCharData._fairWatchDay = undefined;
global.inventory.currency = { spiritStones: 5000, copper: 5000 };
global.itemById.mat_bamboo = { id: 'mat_bamboo', name: '竹子', price: 2, category: 'material', quality: 'PIN9' };
global.inventory.slots = [{ uid: 'b1', templateId: 'mat_bamboo', count: 9 }];
stubRnd(0.99);   // 开摊掷事件：晴
var openOk = global.StreetStall.open();
restoreRnd();
assert(openOk === true && !!global.StreetStall.session(), 'K1 摊子支起来了');
var sc0 = softCloseCalls;
global.StreetStall.close();
eq(softCloseCalls, sc0 + 1, 'K2 手动收摊——面板随流程软收');
eq(global.StreetStall.session(), null, 'K3 会话清了');
stubRnd(0.99);
global.StreetStall.open();
restoreRnd();
var foot0 = global.StreetStall.session().foot;
var sc1 = softCloseCalls;
stubRnd(0.5);
for (var ki = 0; ki < foot0; ki++) global.StreetStall.stage('b1');
restoreRnd();
eq(global.StreetStall.session(), null, 'K4 客流耗尽自动收摊');
eq(softCloseCalls, sc1 + 1, 'K5 自动收摊 close(true) 同样收面板');
global.inventory.slots = [];
// K6 寻差事「今日已上工」终点
global.currentCharData._employ = { job: 'shop_assistant', city: '测试城', signedDay: 1, lastWorkDay: 1, shifts: 0 };
global.currentCharData.energy = 100;
global.currentCharData.location = '测试城';
modalCalls.length = 0;
global.CityJobs.render();   // 上工前的面板：按钮牌面现渲染核对
var jobHtml = modalCalls.length ? modalCalls[modalCalls.length - 1].html : '';
assert(jobHtml.indexOf('两个时辰') >= 0 && jobHtml.indexOf('四个时辰') < 0, 'K8 上工按钮牌面「两个时辰」（NEW-34 现渲染核对）');
var sc2 = softCloseCalls;
var workOk = global.CityJobs.work();
eq(workOk, true, 'K6 上工成交');
eq(softCloseCalls, sc2 + 1, 'K7 上工终点（今日已上工）软收面板');
// K9 赁房打盹终点
global.currentCharData._lodging = { city: '测试城', tier: 'side', signedDay: 1, nextDueDay: 31 };
global.currentCharData.energy = 50;
modalCalls.length = 0;
var sc3 = softCloseCalls;
eq(global.CityLodging.nap(), true, 'K9 打盹成交');
eq(softCloseCalls, sc3 + 1, 'K10 打盹终点软收面板');
var lodgHtml = modalCalls.length ? modalCalls[modalCalls.length - 1].html : '';
assert(lodgHtml.indexOf('半个时辰') >= 0, 'K11 打盹牌面「半个时辰」（现渲染核对）');
// K12-K14 庙会各结算终点
global.WorldCalendar = { day: 1 };   // 上元灯节
dayVal = 1;
var sc4 = softCloseCalls;
global.FestivalFair.act('watch');
eq(softCloseCalls, sc4 + 1, 'K12 看花灯结算终点软收面板');
var sc5 = softCloseCalls;
global.FestivalFair.act('lantern');
eq(softCloseCalls, sc5 + 1, 'K13 放河灯结算终点软收面板');
var sc6 = softCloseCalls;
global.FestivalFair.act('food');
eq(softCloseCalls, sc6 + 1, 'K14 吃节令小吃结算终点软收面板');
// K15 灯谜彩头账只拼一次
modalCalls.length = 0;
var riddle = global.FestivalFair.todayRiddle();
global.FestivalFair.answer(riddle.ans);
var rHtml = modalCalls.length ? modalCalls[modalCalls.length - 1].html : '';
eq((rHtml.match(/心境\+8/g) || []).length, 1, 'K15 灯谜中奖彩头文本只拼一次（不再「心境+8、学识+2；心境+8、学识+2」）');
// K16 工曹署承揽终点
dayVal = 2;
global.currentCharData.qi = 100;
stubRnd(0.5);
var sc7 = softCloseCalls;
var wjOk = global.takeWorksJob();
restoreRnd();
eq(wjOk, true, 'K16 河工承揽成交');
eq(softCloseCalls, sc7 + 1, 'K17 承揽台成交即软收面板（facility-batch2 点名处一）');
// K18 盐铁局领引终点
var sc8 = softCloseCalls;
var saltOk = global.saltBuyCharter ? global.saltBuyCharter() : true;
eq(saltOk, true, 'K18 官价领盐引成交');
eq(softCloseCalls, sc8 + 1, 'K19 盐引窗口成交即软收面板（facility-batch2 点名处二）');
['street-stall.js', 'city-jobs.js', 'city-lodging.js', 'festival-fair.js', 'facility-batch2.js'].forEach(function (f) {
    assert(src('js/city-facilities/' + f).indexOf('closeModalSoft') >= 0, 'K20 ' + f + ' 终点收口已挂 closeModalSoft');
});

// ==================== L · NEW-04/05/13/25 杂项 ====================
console.log('\n[L] NEW-04 建筑窗不叠罗汉 / NEW-05 悬赏重绘 / NEW-13 终态软收 / NEW-25 店招中文');
// L1-L4 NEW-04
bodyKids.length = 0;
global.buildingEffects.showBuildingEffectDialog('寺庙', '<p>甲</p>');
global.buildingEffects.showBuildingEffectDialog('茶馆', '<p>乙</p>');
var beNodes = document.querySelectorAll('#building-effect-modal');
eq(beNodes.length, 1, 'L1 连开两个建筑，DOM 里只有一扇窗（开新窗前清旧窗）');
assert(beNodes[0].innerHTML.indexOf('茶馆') >= 0, 'L2 留下的是最新那扇（新界面不再被压在旧界面下面）');
global.buildingEffects.closeBuildingDialog();
eq(document.querySelectorAll('#building-effect-modal').length, 0, 'L3 关闭删的就是顶上这扇');
// L4-L5 当铺清单窗调用侧去重（pawn-service.js 不在本批改动清单，去重挂在剧本引擎调用侧）
global.PawnService = { openPicker: function () { var m = document.createElement('div'); m.id = 'pawn-picker-modal'; document.body.appendChild(m); } };
eng._apply({ pawn: { op: 'pick' } });
eng._apply({ pawn: { op: 'pick' } });
eq(document.querySelectorAll('#pawn-picker-modal').length, 1, 'L4 自选典当清单窗连开两次只留一扇（调用侧先收旧窗）');
assert(src('js/core/scenario-engine.js').indexOf('pawn-picker-modal') >= 0, 'L5 去重口径落在引擎调用侧');
// L6-L7 NEW-05 悬赏接取即重绘
var board = global.getBountyBoard();
eq(board.length, 3, 'L6 悬赏榜开张三条');
var listEl = document.getElementById('bounty-board-list');
listEl.innerHTML = '';
eq(global.acceptBounty(0), true, 'L7 接取成功');
assert(listEl.innerHTML.indexOf('进度 0/') >= 0, 'L8 接取后列表当场重绘（已接的行显示进度，不再是「接取」按钮）');
eq(global.acceptBounty(0), false, 'L9 重复接取照旧拦回');
// L10-L13 NEW-13 情境终态延迟软收
timeouts.length = 0;
var sc9 = softCloseCalls;
global.renderScenario(null);
eq(timeouts.length, 1, 'L10 「事件已结束」终态挂了延迟自动收窗');
eq(timeouts[0].ms, 1500, 'L11 延迟 1500ms（留足读完结算文案）');
timeouts[0].fn();
eq(softCloseCalls, sc9 + 1, 'L12 到点真收（closeModalSoft 被调）');
timeouts.length = 0;
global.renderScenario({ done: false, facilityId: 'x', scenarioName: 's', facilityName: 'f', desc: 'd', step: 1, totalSteps: 3,
    choices: [{ index: 0, text: '继续', disabled: false, reason: '', hint: '' }] });
eq(timeouts.length, 0, 'L13 多步流程中间步不收窗');
timeouts.length = 0;
global.renderScenario({ done: false, facilityId: 'x', scenarioName: 's', facilityName: 'f', desc: 'd', step: 2, totalSteps: 2, choices: [] });
eq(timeouts.length, 1, 'L14 无后续选项的节点同样按终态收');
// L15-L18 NEW-25 店招类型中文名
var talShop = new global.Shop('s_tal', '符箓店', { type: 'talisman', location: '帝都·长安', inventory: [] });
bodyKids.length = 0;
global.showShopDialog(talShop);
var shopNode = null;
for (var li = 0; li < bodyKids.length; li++) { if (bodyKids[li].id === 'shop-modal-overlay') shopNode = bodyKids[li]; }
assert(shopNode && shopNode.innerHTML.indexOf('类型: 符箓') >= 0, 'L15 符箓店店招上屏是「类型: 符箓」（不再直出 talisman）');
assert(shopNode && shopNode.innerHTML.indexOf('talisman') < 0, 'L16 内部字符串不漏上屏');
var bookShop = new global.Shop('s_book', '功法阁', { type: 'book', location: '帝都·长安', inventory: [] });
bodyKids.length = 0;
global.showShopDialog(bookShop);
var bookNode = null;
for (var lj = 0; lj < bodyKids.length; lj++) { if (bodyKids[lj].id === 'shop-modal-overlay') bookNode = bodyKids[lj]; }
assert(bookNode && bookNode.innerHTML.indexOf('丹书·秘籍') >= 0, 'L17 功法阁店招是「丹书·秘籍」');
var unkShop = new global.Shop('s_unk', '无名铺', { type: 'xyz_unknown', location: 'x', inventory: [] });
bodyKids.length = 0;
global.showShopDialog(unkShop);
var unkNode = null;
for (var lk = 0; lk < bodyKids.length; lk++) { if (bodyKids[lk].id === 'shop-modal-overlay') unkNode = bodyKids[lk]; }
assert(unkNode && unkNode.innerHTML.indexOf('类型:') < 0 && unkNode.innerHTML.indexOf('xyz_unknown') < 0, 'L18 映射不到的类型整行隐藏（内部串不上屏）');

console.log('\n========== 第九十五波 · 经济/设施/情境簇修复 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
