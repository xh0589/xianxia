/**
 * v20.18-bank-node.js — 钱庄真业务 + 两衙真职能
 *
 * 覆盖：
 *   A 账房数学：存入扣现、未满月取回无息、满月起息（月息五）、
 *     加存先结旧息再并账、利钱只随真实经过的日子生
 *   B 欠条链路：借贷成账有到期日、欠条未销不再放贷、提前还清只还本、
 *     逾期划扣（有钱整笔划走、没钱划光+恶名+伤且同日至多一轮）、次日再来直至结清
 *   C 情境接线：钱庄剧本四笔业务全挂账本；引擎对账本失败原样报错（不吞成"结算失败"）；
 *     借贷的业障/恶名与银钱同笔结算
 *   D 两衙职能：税课司如实报本城真实物价系数与特产；司法堂委托分支耗真气给历练声望、
 *     气力不济如实婉拒、无案旁听零收益
 *   E 静态：存档白名单成对、页面接线、引擎钩子、假门道选项已除、催收同日护栏在案
 *
 * 运行：node tests/v20.18-bank-node.js
 */
'use strict';

var path = require('path');
var fs = require('fs');
var vm = require('vm');

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) passed++;
    else { failed++; console.error('[FAIL] ' + msg); }
}

// —— 单一钱包真源：currency.spiritStones（与经济事务/门槛检查共用一个数法）——
var CURDAY = 100;
function makeWorld(opts) {
    opts = opts || {};
    var currency = { spiritStones: opts.stones != null ? opts.stones : 500 };
    var logs = [];
    var newDayHooks = [];
    var w = {
        console: { log: function () {}, warn: function () {}, error: function () {} },
        JSON: JSON, Object: Object, Array: Array, Math: opts.math || Math, Number: Number,
        isFinite: isFinite, Date: Date, String: String,
        currentCharData: opts.char || { qi: 100, health: 100, tempering: 0, karma: 0, notoriety: 0, location: '帝都·长安' },
        inventory: { currency: currency, slots: opts.slots || [] },
        XianXia: {},
        getAbsoluteDay: function () { return CURDAY; },
        gameLog: { add: function (m, t) { logs.push(String(m)); } },
        showMessage: function (m) { logs.push(String(m)); },
        advanceTime: function () {},
        timeSystem: { onNewDaySubscribe: function (fn) { newDayHooks.push(fn); }, advanceTime: function () {} },
        getCurrentCityName: function () { return w.currentCharData.location; },
        addReputation: opts.repSpy || null,
        locationSystem: opts.locationSystem || null,
        document: { readyState: 'complete', addEventListener: function () {}, getElementById: function () { return null; },
            createElement: function () { return { style: {}, classList: { add: function () {}, remove: function () {} }, appendChild: function () {}, innerHTML: '' }; },
            querySelector: function () { return null; }, body: {} }
    };
    w.XianXia.DataManager = {
        getSpiritStones: function () { return currency.spiritStones; },
        setSpiritStones: function (v) { currency.spiritStones = Math.max(0, v); }
    };
    // 经济事务桩：灵石划扣失败=现银不足（与真事务同语义）
    w.EconomyTransaction = {
        run: function (fn) { return fn(); },
        credit: function (k, n) { if (k === 'spiritStones') { currency.spiritStones += n; return true; } return true; },
        debit: function (k, n) {
            if (k === 'spiritStones') { if (currency.spiritStones < n) return false; currency.spiritStones -= n; return true; }
            return true;
        },
        addSnapshot: function () { return true; },
        removeByTemplate: function () { return true; }
    };
    w.window = w;
    var ctx = vm.createContext(w);
    w._logs = logs; w._hooks = newDayHooks; w._currency = currency;
    return { w: w, ctx: ctx, currency: currency, logs: logs };
}
function loadInto(ctx, rel) { vm.runInContext(fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8'), ctx); }

// ============ A: 账房数学 ============
var W = makeWorld({ stones: 500 });
loadInto(W.ctx, 'js/core/reward-service.js');
loadInto(W.ctx, 'js/city-facilities/bank-service.js');
var B = W.w.BankService;
assert(typeof B === 'object' && typeof B.summary === 'function' && W.w._hooks.length === 1,
    'A0 账房就位且已挂上新日催收订阅');

var r = B.deposit(100);
assert(r.success && W.currency.spiritStones === 400 && B.summary().deposit === 100,
    'A1 存 100：现银 500→400、账本存款 100（银钱走统一结算事务）');
r = B.withdraw();
assert(r.success && W.currency.spiritStones === 500 && B.summary().interest === 0,
    'A2 同日取回：只还本金（未满一月无息，利息不是白送的）');
B.deposit(200);
CURDAY = 130; // 满 30 日
var s = B.summary();
assert(s.months === 1 && s.interest === 10,
    'A3 满一月起息：200×月息五 = 应息 10（实际 ' + s.interest + '）');
W.currency.spiritStones = 300; // 校验取回是纯入账
r = B.withdraw();
assert(r.success && W.currency.spiritStones === 510 && B.summary().deposit === 0,
    'A4 到期取存连息 210 全数落袋（300→510）');
CURDAY = 200; W.currency.spiritStones = 500;
B.deposit(100);
CURDAY = 235; // 旧存款 35 天 = 1 个月息 5
r = B.deposit(50);
s = B.summary();
assert(r.success && s.deposit === 150 && s.depStart === 235 && W.currency.spiritStones === 355,
    'A5 加存先结旧息：旧息 5 当场付讫、新旧并账 150、起息日重置（400+息5-存50=355，实际 ' + W.currency.spiritStones + '）');

// ============ B: 欠条链路 ============
CURDAY = 235; W.currency.spiritStones = 455;
r = B.borrow(100);
s = B.summary();
assert(r.success && s.debt === 100 && s.debtDue === 265 && W.currency.spiritStones === 555,
    'B1 借贷成账：领 100、' + s.debtDue + ' 日到期（455→555）');
r = B.borrow(100);
assert(!!r.error && r.error.indexOf('欠条未销') >= 0, 'B2 欠条未销不再放贷（借贷上限=一张欠条，不是印钞机）');
CURDAY = 250; // 未到期
// v20.53 口径变更：欠条写死借一还二成息，提前还清也按整月计息——
// 旧口径（提前还只还本）配上存款月息五，"借入即存入、月底取出还本"是无风险套利，故改。
r = B.repay();
assert(r.success && W.currency.spiritStones === 435 && B.summary().debt === 0,
    'B3 提前还清也付整月息 120（555→435；借入即存入的空转套利因此不成立）');
// 套利复测：借入即存入、满月取出、到期还清——旧口径（提前还只还本）下这是无风险白赚，现在必亏
r = B.borrow(100); CURDAY = 251;   // 435 → 535（借来的钱）
B.deposit(100);                    // 535 → 435，与旧存 150 并账，起息 251
CURDAY = 281;                      // 满 30 日
var wd = B.withdraw();             // 435 + 本金 250 + 息 13 = 698
var back = B.repay();              // 698 - 120（含整月息）= 578
// 对照：同样等到 281 日，不借钱只取旧存 = 435 + 150 + 8 = 593
assert(wd.success && back.success && W.currency.spiritStones === 578,
    'B3c 借存循环跑完 578，低于不借钱的对照 593 —— 借入即存入从此必亏');
// 逾期划扣（有钱）
B.borrow(100); CURDAY = 312; // dueAt 311，已过一天
s = B.summary();
assert(s.overdue === true && s.owed === 120, 'B4 逾期口径：应还连本带利 120');
// 逾期划扣（有钱）
W.currency.spiritStones = 500;
var col = B.checkOverdue();
assert(col && col.settled && W.currency.spiritStones === 380 && B.summary().debt === 0 && W.w.currentCharData.notoriety === 1,
    'B5 逾期有钱：账房登门划走 120、欠条撕毁、恶名+1（500→380）');
// 逾期划扣（没钱）+ 同日护栏 + 次日再来
CURDAY = 290; B.borrow(100); // dueAt 320
CURDAY = 321; W.currency.spiritStones = 50;
var cd = W.w.currentCharData;
cd.qi = 100; cd.health = 100;
col = B.checkOverdue();
assert(col && !col.settled && col.taken === 50 && W.currency.spiritStones === 0 && B.summary().debt === 100 &&
    cd.qi === 80 && cd.health === 85 && cd.notoriety === 3,
    'B6 逾期没钱：划光 50、欠款不凭空消失、挨伤（真气-20 伤-15）恶名+2');
col = B.checkOverdue();
assert(col === null && cd.qi === 80, 'B7 同日至多一轮催收（反复推门不会连环抄家）');
CURDAY = 322;
col = B.checkOverdue();
assert(col && !col.settled && cd.qi === 60, 'B8 次日再来：账不清催收不止');
W.currency.spiritStones = 120;
CURDAY = 323;
col = B.checkOverdue();
assert(col && col.settled && B.summary().debt === 0 && W.currency.spiritStones === 0,
    'B9 现银凑够即结清：划走 120 后账页注销');
// 手头不足拒还
CURDAY = 330; W.currency.spiritStones = 200; B.borrow(100);
W.currency.spiritStones = 30; CURDAY = 361;
r = B.repay();
assert(!!r.error && r.error.indexOf('不足') >= 0, 'B10 现银不够还清：如实拒绝，账不动');

// ============ C: 情境接线（引擎真跑钱庄剧本） ============
var W2 = makeWorld({ stones: 500 });
loadInto(W2.ctx, 'js/core/reward-service.js');
loadInto(W2.ctx, 'js/core/scenario-engine.js');
loadInto(W2.ctx, 'js/city-facilities/bank-service.js');
loadInto(W2.ctx, 'js/city-facilities/facility-batch2.js');
var eng = W2.w.scenarioEngine;
var mh = eng.facilities['money_house'];
(function () {
    var ops = mh.scenarios[0].nodes.loan_start.choices
        .concat(mh.scenarios[0].nodes.loan_borrow.choices)
        .map(function (c) { return c.effects && c.effects.bank ? c.effects.bank.op : null; })
        .filter(Boolean);
    var need = ['deposit', 'withdraw', 'borrow', 'repay'];
    var miss = need.filter(function (n) { return ops.indexOf(n) < 0; });
    assert(miss.length === 0, 'C1 钱庄剧本四类业务全部挂上账本（缺: ' + miss.join(',') + '）');
})();
var eng2 = eng;
var st = eng2.start('money_house', 'loan');
assert(!!st && st.done === false && st.desc.indexOf('月息五') >= 0, 'C2 推门进店：柜台话术如实（含月息口径）');
// 存 100（选项 index 1）
var res = eng2.choose(1);
assert(eng2.facilities && W2.w.currentCharData._bank && W2.w.currentCharData._bank.deposit === 100 && W2.currency.spiritStones === 400,
    'C3 店内选择"存100"真过账本（引擎→账本→结算事务全链路）');
// 再借一张、还清流程 + 欠条未销原样报错
st = eng2.start('money_house', 'loan');
eng2.choose(4); // 进借贷节点
eng2.choose(0); // 签押领 100（含 karma -3 noto +2）
var cd2 = W2.w.currentCharData;
assert(cd2._bank.debt === 100 && cd2.karma === -3 && cd2.notoriety === 2,
    'C4 借贷银钱与业障/恶名同笔结算（混挂键不丢）');
st = eng2.start('money_house', 'loan');
res = eng2.choose(5); // 还清：未到期只还本 500→400
assert(W2.currency.spiritStones === 380 && cd2._bank.debt === 0, 'C5 店内"还清欠款"连本带息 120、账页注销（500→380）');
st = eng2.start('money_house', 'loan');
res = eng2.choose(1); // 存100
res = eng2.start('money_house', 'loan');
eng2.choose(4);
res = eng2.start('money_house', 'loan');
// 双欠条拦截：先造一张欠款再试第二张
cd2._bank.debt = 100; cd2._bank.debtDue = CURDAY + 30;
st = eng2.start('money_house', 'loan');
eng2.choose(4); // loan_borrow
res = eng2.choose(0); // 再签押 → 账本原样报错
assert(res && res.error === '欠条未销，钱庄不再放贷',
    'C6 账本失败原样上屏（不被吞成笼统的"结算失败"）：' + JSON.stringify(res && res.error));

// ============ D: 两衙职能（app.js 真源码提取跑） ============
function extractFn(src, name) {
    var head = 'function ' + name + '(';
    var i = src.indexOf(head);
    if (i < 0) return null;
    var j = src.indexOf('{', i), depth = 0, k = j;
    for (; k < src.length; k++) {
        if (src[k] === '{') depth++;
        else if (src[k] === '}') { depth--; if (depth === 0) break; }
    }
    return src.slice(i, k + 1);
}
var appSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'app.js'), 'utf8');

// 税课司：如实报真实物价系数
var Wt = makeWorld({
    char: { qi: 50, health: 100, tempering: 0, location: '帝都·长安' },
    locationSystem: { getCityData: function () { return { priceModifier: { buy: 1.2 }, specialties: ['皇家贡品', '御用丹药', '宫廷秘法'] }; } }
});
vm.runInContext(extractFn(appSrc, 'openTaxBureau') + '\nopenTaxBureau();', Wt.ctx);
var taxLog = Wt.logs.join('|');
assert(Wt.w.currentCharData.qi === 40 && Wt.w.currentCharData.tempering === 5 &&
    taxLog.indexOf('贵20%') >= 0 && taxLog.indexOf('皇家贡品') >= 0,
    'D1 税课司查账如实报本城行价贵两成与课税大宗（读城建真源，不编数）');
var Wt2 = makeWorld({
    char: { qi: 50, health: 100, tempering: 0, location: '云梦泽' },
    locationSystem: { getCityData: function () { return { priceModifier: { buy: 1.0 }, specialties: [] }; } }
});
vm.runInContext(extractFn(appSrc, 'openTaxBureau') + '\nopenTaxBureau();', Wt2.ctx);
assert(Wt2.logs.join('|').indexOf('持平') >= 0, 'D2 平价城如实报持平（不硬找话说）');

// 司法堂：委托分支/婉拒分支/旁听分支
var reps = [];
var Wc = makeWorld({
    char: { qi: 50, health: 100, tempering: 0, location: '帝都·长安' },
    math: { random: function () { return 0.1; }, floor: Math.floor, max: Math.max, min: Math.min, round: Math.round },
    repSpy: function (c, n) { reps.push([c, n]); }
});
vm.runInContext(extractFn(appSrc, 'openCourt') + '\nopenCourt();', Wc.ctx);
assert(Wc.w.currentCharData.qi === 35 && Wc.w.currentCharData.tempering === 8 && reps.length === 1 && reps[0][1] === 2,
    'D3 司法堂有案：领委托耗 15 真气，历练+8、本城声望+2（真职能）');
var Wc2 = makeWorld({
    char: { qi: 10, health: 100, tempering: 0, location: '帝都·长安' },
    math: { random: function () { return 0.1; }, floor: Math.floor, max: Math.max, min: Math.min, round: Math.round }
});
vm.runInContext(extractFn(appSrc, 'openCourt') + '\nopenCourt();', Wc2.ctx);
assert(Wc2.w.currentCharData.tempering === 0 && Wc2.w.currentCharData.qi === 10 &&
    Wc2.logs.join('|').indexOf('签不了') >= 0, 'D4 气力不济：如实婉拒，分文不给');
var Wc3 = makeWorld({
    char: { qi: 50, health: 100, tempering: 0, location: '帝都·长安' },
    math: { random: function () { return 0.9; }, floor: Math.floor, max: Math.max, min: Math.min, round: Math.round }
});
vm.runInContext(extractFn(appSrc, 'openCourt') + '\nopenCourt();', Wc3.ctx);
assert(Wc3.w.currentCharData.tempering === 0 && Wc3.w.currentCharData.qi === 50,
    'D5 无案旁听：纯见闻零收益（时间成本照付，白听不白送）');

// ============ E: 静态 ============
var gsSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'core', 'game-state.js'), 'utf8');
assert(gsSrc.indexOf('bank: charData._bank') >= 0 && gsSrc.indexOf('_bank: (saveData.bank') >= 0,
    'E1 钱庄账本入档与回灌成对（唯一新字段，旧档按空账兜底）');
var htmlSrc = fs.readFileSync(path.resolve(__dirname, '..', '仙侠.html'), 'utf8');
assert(htmlSrc.indexOf('js/city-facilities/bank-service.js') >= 0, 'E2 账房已挂上页面');
var seSrc = fs.readFileSync(path.resolve(__dirname, '..' + '/js/core/scenario-engine.js'), 'utf8');
assert(seSrc.indexOf('eff.bank') >= 0 && seSrc.indexOf('applied.error') >= 0,
    'E3 引擎账本钩子与如实报错通道成对在案');
var b2Src = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'city-facilities', 'facility-batch2.js'), 'utf8');
assert(b2Src.indexOf('打听存灵石的门道') < 0 && b2Src.indexOf("op: 'deposit'") >= 0,
    'E4 "听个门道"的空头选项已拆除，换成真存取');
var bkSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'city-facilities', 'bank-service.js'), 'utf8');
assert(bkSrc.indexOf('lastCol') >= 0 && bkSrc.indexOf('onNewDaySubscribe') >= 0,
    'E5 催收同日护栏与新日订阅在案（逾期是节奏不是骚扰）');

console.log('v20.18 bank: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
