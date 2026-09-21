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
 *   D 三司公务剧本（v21.4）：税课司查账如实报本城物价真源；下乡协征/缉查委托耗成本抽签给对价；
 *     真气不济引擎如实婉拒；司法堂堂审按城+日定死；户籍司翻档旧规矩原样进剧本
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

// ============ D: 三司公务剧本（v21.4：facility-offices.js 进情境引擎真跑） ============
// 税课司/司法堂/户籍司不再是 app.js 里"烧10真气换一句日志"的死函数——
// 委托进情境引擎后，成本/成败/对价全在剧本选项里，这里按引擎口径逐牌验收。
function officeWorld(opts) {
    opts = opts || {};
    var reps = [];
    var copper = { n: 0 };
    var Wx = makeWorld({
        char: opts.char || { qi: 50, energy: 100, health: 100, tempering: 0, karma: 0, notoriety: 0, location: opts.city || '帝都·长安' },
        locationSystem: opts.locationSystem || null,
        repSpy: function (c, n) { reps.push([c, n]); }
    });
    // makeWorld 的经济事务桩只认真金白银里的灵石——铜钱也记上账
    var origCredit = Wx.w.EconomyTransaction.credit;
    Wx.w.EconomyTransaction.credit = function (k, n) { if (k === 'copper') copper.n += n; return origCredit(k, n); };
    Wx.w.timeSystem.getAbsoluteDay = function () { return opts.day != null ? opts.day : CURDAY; };
    Wx.w.getLifeSkill = function () { return 0; };
    Wx.w.getRealmTier = function () { return 1; };
    Wx.w.EventBus = { emit: function () {}, on: function () {} };
    Wx.w.StateRegistry = { register: function () {} };
    loadInto(Wx.ctx, 'js/core/reward-service.js');
    loadInto(Wx.ctx, 'js/core/scenario-engine.js');
    loadInto(Wx.ctx, 'js/city-facilities/facility-offices.js');
    Wx.reps = reps; Wx.copper = copper;
    return Wx;
}

// D1/D2 税课司查账：如实读本城物价真源
var Wo = officeWorld({
    locationSystem: { getCityData: function () { return { priceModifier: { buy: 1.2 }, specialties: ['皇家贡品', '御用丹药', '宫廷秘法'] }; } }
});
var stO = Wo.w.scenarioEngine.start('tax_bureau', 'duty');
assert(!!stO && stO.done === false && stO.desc.indexOf('三块公务牌') >= 0,
    'D0 税课司推门进戏：三块公务牌挂牌（不再是点一下就完的空壳）');
Wo.w.scenarioEngine.choose(0);
var cdO = Wo.w.currentCharData;
var logO = Wo.logs.join('|');
assert(cdO.qi === 40 && cdO.tempering === 5 && logO.indexOf('贵20%') >= 0 && logO.indexOf('皇家贡品') >= 0,
    'D1 税课司查账如实报本城行价贵两成与课税大宗（读城建真源，不编数）');
var Wo2 = officeWorld({
    locationSystem: { getCityData: function () { return { priceModifier: { buy: 1.0 }, specialties: [] }; } }
});
Wo2.w.scenarioEngine.start('tax_bureau', 'duty');
Wo2.w.scenarioEngine.choose(0);
assert(Wo2.logs.join('|').indexOf('持平') >= 0, 'D2 平价城如实报持平（不硬找话说）');

// D3 税课司下乡协征：耗精力、抽签定成败、赢面给铜钱+历练+本城声望
Wo = officeWorld({});
Wo.w.__scenarioRng = function () { return 0.1; }; // 必成
Wo.w.scenarioEngine.start('tax_bureau', 'duty');
Wo.w.scenarioEngine.choose(1);
cdO = Wo.w.currentCharData;
assert(cdO.energy === 80 && cdO.tempering === 5 && Wo.reps.length === 1 && Wo.reps[0][1] === 2 && Wo.copper.n === 300,
    'D3 下乡协征成：精力-20、历练+5、本城声望+2、工食钱300铜（有成本有对价）');

// D4 真气不济：引擎门槛如实婉拒，分文不给
Wo = officeWorld({ char: { qi: 5, energy: 100, health: 100, tempering: 0, karma: 0, notoriety: 0, location: '帝都·长安' } });
Wo.w.scenarioEngine.start('tax_bureau', 'duty');
var resO = Wo.w.scenarioEngine.choose(0);
cdO = Wo.w.currentCharData;
assert(!!resO && !!resO.error && cdO.qi === 5 && cdO.tempering === 0,
    'D4 气力不济：如实婉拒（' + (resO && resO.error) + '），分文不给');

// D5 司法堂缉查委托：耗真气抽签，赢面历练+8、声望+2、跑腿钱200铜
Wo = officeWorld({});
Wo.w.__scenarioRng = function () { return 0.1; };
Wo.w.scenarioEngine.start('court', 'duty');
Wo.w.scenarioEngine.choose(1);
cdO = Wo.w.currentCharData;
assert(cdO.qi === 35 && cdO.tempering === 8 && Wo.reps.length === 1 && Wo.reps[0][1] === 2 && Wo.copper.n === 200,
    'D5 司法堂缉查委托成：真气-15、历练+8、本城声望+2、200铜（真职能）');

// D6 堂审按城+日定死：同城同日两次开堂是同一件案子（不靠掷骰说谎）
var Wa = officeWorld({ city: '帝都·长安', day: 7 });
var Wb = officeWorld({ city: '帝都·长安', day: 7 });
var da = Wa.w.scenarioEngine.start('court', 'duty').desc;
var db = Wb.w.scenarioEngine.start('court', 'duty').desc;
assert(da === db && da.indexOf('司法堂今日开堂') >= 0, 'D6 同城同日堂审同一案（ seeded 确定性）');

// D7 户籍司翻《流寓录》：与七衙门同一规矩——10 真气门槛与扣减成对
Wo = officeWorld({});
Wo.w.scenarioEngine.start('household_registry', 'duty');
Wo.w.scenarioEngine.choose(0);
cdO = Wo.w.currentCharData;
assert(cdO.qi === 40 && cdO.tempering === 5 && Wo.logs.join('|').indexOf('流寓录') >= 0,
    'D7 户籍司翻档：10 真气换历练+5（旧规矩原样进剧本）');

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
