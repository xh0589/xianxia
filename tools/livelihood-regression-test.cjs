// ==================== v27.1 营生扩展批 · 下半回归测试 ====================
// 覆盖：放印子钱（额度/欠债闸/在外两张封顶/到期如约·宽限·跑路·追回·坏账五分支/汇总牌面/读档归一化）、
//       灵田雇工（安家钱/生长期七五折/翻日代收+支工钱/欠薪三日辞工/辞工按钮/随档往返）、
//       漕运茶马道（本钱夹板/两支封顶/到期平安连本带利/被截收回六成/读档归一化）。
// 运行：node tools/livelihood-regression-test.cjs
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
let pass = 0, fail = 0;
function ok(name, cond, extra) {
    if (cond) { pass++; console.log('  ✅ ' + name); }
    else { fail++; console.log('  ❌ ' + name + (extra ? ' · ' + extra : '')); }
}

// ---------- 骰子（确定性） ----------
const origRandom = Math.random;
let rngQueue = null;
function patchRng(q) { rngQueue = q.slice(); Math.random = () => (rngQueue && rngQueue.length ? rngQueue.shift() : 0.5); }
function restoreRng() { rngQueue = null; Math.random = origRandom; }

// ---------- 宽容桩 ----------
let BANK_DAY = 100;          // bank-service / house-system 走 window.getAbsoluteDay
let TRADE_DAY = 100;         // caravan _today 走 window.timeSystem.getAbsoluteDay
let STONES = 5000;
const messages = [];
const deedLog = [];
const addedItems = [];
const reg = {};
const newDaySubs = [];
const stored = {};

const sandbox = {
    console: { log() {}, warn() {}, error() {} },
    Math, Date, JSON, Object, Array, String, Number, Boolean, Set, Map, isFinite, parseInt, parseFloat
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
sandbox.document = {
    readyState: 'complete',
    getElementById: () => null,
    createElement: () => ({ style: {}, classList: { add() {}, remove() {} } }),
    documentElement: { style: {} },
    addEventListener: () => {},
    body: { appendChild() {} }
};
sandbox.localStorage = {
    getItem: k => (k in stored ? stored[k] : null),
    setItem: (k, v) => { stored[k] = String(v); },
    removeItem: k => { delete stored[k]; }
};
sandbox.showMessage = (m, t) => messages.push({ m: String(m), t });
sandbox.gameLog = { add() {} };
sandbox.updateCurrencyUI = () => {};
sandbox.updateCharacterStatus = () => {};
sandbox.playerPushDeed = (kind, text) => deedLog.push({ kind, text: String(text) });
sandbox.getAbsoluteDay = () => BANK_DAY;
sandbox.currentCharData = { location: '甲城', spiritStones: 5000, copper: 500, realm: '炼气', notoriety: 0, qi: 100, health: 100 };
sandbox.XianXia = { DataManager: {
    getSpiritStones: () => STONES,
    addSpiritStones: n => { STONES += n; },
    deductSpiritStones: n => { if (STONES < n) return false; STONES -= n; return true; },
    getCopper: () => 500, addCopper() {}, deductCopper: () => true, setCopper() {}
} };
sandbox.DataManager = sandbox.XianXia.DataManager;
sandbox.RewardService = { apply(spec) {
    const d = Number(spec && spec.stones) || 0;
    if (d < 0 && STONES < -d) return { success: false };
    STONES += d;
    return { success: true };
} };
sandbox.StateRegistry = { register: (name, mod) => { reg[name] = mod; } };
sandbox.timeSystem = {
    onNewDaySubscribe: fn => newDaySubs.push(fn),
    advanceTime: () => {},
    getAbsoluteDay: () => TRADE_DAY,
    gameTime: { currentSeason: 'spring' }
};
sandbox.inventory = { slots: [], maxSlots: 30 };
sandbox.addItem = (id, n) => { addedItems.push({ id, n }); return n; };
sandbox.itemById = {};

const context = vm.createContext(sandbox);
function run(rel) { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), context, { filename: rel }); }

// ============================================================
console.log('== v27.1-A 放印子钱（bank-service.js）==');
run('js/city-facilities/bank-service.js');
const BS = sandbox.BankService;
ok('钱庄日结订阅挂上（催收+放贷账同轮）', newDaySubs.length >= 1);

// 1. 闸门与夹板
sandbox.currentCharData._bank = { deposit: 0, depStart: 0, debt: 100, debtDue: 999, loansOut: [] };
ok('自己欠着柜上欠条→不替你作保放款', !!BS.lendOut(100).error);
sandbox.currentCharData._bank.debt = 0;
ok('不足起放线（100）被拦', !!BS.lendOut(50).error);
ok('单笔封顶（500）被拦', !!BS.lendOut(600).error);

// 2. 放款成功与两张封顶
const stonesPre = STONES;
let r = BS.lendOut(100);
ok('放100成功：灵石当场扣、欠条入账', r.success === true && STONES === stonesPre - 100);
let s = BS.summary();
ok('欠条写死：30日后到期、state=active', s.loansOut.length === 1 && s.loansOut[0].dueDay === BANK_DAY + 30 && s.loansOut[0].state === 'active');
BS.lendOut(500);
s = BS.summary();
ok('在外两张到顶（第三张被拦）', s.outActive === 2 && s.outPrincipal === 600 && !!BS.lendOut(100).error);
ok('手头不足放不出去', (STONES = 10, !!BS.lendOut(100).error));
STONES = 500;

// 3. 汇总牌面与柜台话术
ok('汇总带印子钱三口径', s.outActive === 2 && s.outChase === 0 && s.outPrincipal === 600);
ok('柜台话术如实播报放贷账', BS.describe().indexOf('你放出去的欠条') >= 0);

// 4. 未到期不动账
ok('未到期：日结不碰欠条', BS.checkLoansOut() === null && BS.summary().loansOut.length === 2);

// 5. 到期如约（十之八九）
BANK_DAY += 30;
const stonesPreRepay = STONES;
patchRng([0.5, 0.5]);
BS.checkLoansOut();
restoreRng();
ok('到期如约：两张连本带息回柜（500→600、100→120）',
    BS.summary().loansOut.length === 0 && STONES === stonesPreRepay + 600 + 120, 'STONES=' + STONES);

// 6. 到期宽限（十之一五）
BS.lendOut(200);
BANK_DAY += 30;
patchRng([0.85]);
BS.checkLoansOut();
restoreRng();
s = BS.summary();
ok('苦求宽限：账照旧、dueDay+10、lateCount=1',
    s.loansOut.length === 1 && s.loansOut[0].state === 'active' && s.loansOut[0].dueDay === BANK_DAY + 10 && s.loansOut[0].lateCount === 1);

// 7. 宽限后再拖→跑路进追债
BANK_DAY += 10;
patchRng([0.99]);
BS.checkLoansOut();
restoreRng();
s = BS.summary();
ok('卷铺盖跑路：转入追债（15日限期）',
    s.loansOut.length === 1 && s.loansOut[0].state === 'chase' && s.loansOut[0].chaseUntil === BANK_DAY + 15 && s.outChase === 1);

// 8. 追债追回（六成）：只回本金
BANK_DAY += 15;
const stonesPreChase = STONES;
patchRng([0.5]);
BS.checkLoansOut();
restoreRng();
ok('追债人追回：本金200如数、利息一个子儿没有',
    BS.summary().loansOut.length === 0 && STONES === stonesPreChase + 200, 'STONES=' + STONES);

// 9. 追不回（四成）：坏账销账+传闻
BS.lendOut(300);
BANK_DAY += 30;
patchRng([0.99]);
BS.checkLoansOut();
restoreRng();
BANK_DAY += 15;
deedLog.length = 0;
patchRng([0.99]);
BS.checkLoansOut();
restoreRng();
ok('追不回：坏账销账、茶棚传闻落账', BS.summary().loansOut.length === 0 && deedLog.some(d => d.kind === 'bad'));

// 10. 读档归一化：坏账不进门
sandbox.currentCharData._bank.loansOut = [
    null, { amount: -5, state: 'active' }, { amount: 100, state: '还清了' },
    { amount: 200.7, outDay: 'x', dueDay: 5, state: 'chase', lateCount: '三', chaseUntil: 0 }
];
s = BS.summary();
ok('坏欠条归一（只留合法一张、字段全夹板）',
    s.loansOut.length === 1 && s.loansOut[0].amount === 200 && s.loansOut[0].state === 'chase' && s.loansOut[0].lateCount === 0 && s.loansOut[0].outDay === 0);
sandbox.currentCharData._bank.loansOut = [];

// ============================================================
console.log('== v27.1-B 灵田雇工（house-system.js）==');
run('js/house-system.js');
ok('长工翻日账订阅挂上', newDaySubs.indexOf(sandbox.farmhandDaily) >= 0);

// 1. 无宅不雇
ok('连洞府都没有→雇不了长工', sandbox.hireFarmhand() === false);

// 2. 落户简易洞府（储物扩容同步）
sandbox.importHouseState({ type: 'cave', upgrades: {}, furniture: [], planted: [], storageApplied: 0 });
ok('洞府落户+坐落归一到洞天', sandbox.playerHouse.type === 'cave' && sandbox.playerHouse.location === 'taixu');
ok('储物扩容同步（30→40、storageApplied=10）',
    sandbox.inventory.maxSlots === 40 && sandbox.inventory.slots.length === 40 && sandbox.playerHouse.storageApplied === 10);

// 3. 无长工时生长期原样（人参4日）
sandbox.inventory.slots[0] = { templateId: 'mat_ginseng', count: 2 };
ok('下种人参（无长工）：生长期4日', sandbox.plantCrop('ginseng') === true && sandbox.playerHouse.planted[0].readyDay === BANK_DAY + 4);
sandbox.playerHouse.planted = [];

// 4. 雇长工：安家钱30
const stonesPreHire = STONES;
patchRng([0.1]);
ok('雇长工成功（安家钱30落账）', sandbox.hireFarmhand() === true && STONES === stonesPreHire - 30);
restoreRng();
const fh = sandbox.playerHouse.farmhand;
ok('雇工账带名姓/上工日/欠薪清零', !!fh && fh.hiredDay === BANK_DAY && fh.arrears === 0 && typeof fh.name === 'string');
ok('一田不容二锄（再雇被拦）', sandbox.hireFarmhand() === false);

// 5. 长工锄草松土：生长期×0.75（人参4→3）
ok('下种人参（有长工）：生长期 ceil(4×0.75)=3', sandbox.plantCrop('ginseng') === true && sandbox.playerHouse.planted[0].readyDay === BANK_DAY + 3);

// 6. 翻日账：代收成真+支工钱
sandbox.playerHouse.planted = [{ cropId: 'spirit_grass', name: '灵草', icon: '🌱', plantDay: BANK_DAY - 2, readyDay: BANK_DAY, yieldId: 'mat_spirit_grass', yieldCount: 3 }];
addedItems.length = 0;
const stonesPreWage = STONES;
sandbox.farmhandDaily();
ok('长工代收：熟一畦收一畦（走 addItem 正门）', addedItems.length === 1 && addedItems[0].id === 'mat_spirit_grass' && addedItems[0].n === 3 && sandbox.playerHouse.planted.length === 0);
ok('日薪2灵石翻日自动支、欠薪清零', STONES === stonesPreWage - 2 && fh.arrears === 0);

// 7. 欠薪三日辞工
STONES = 0;
sandbox.farmhandDaily();
ok('欠薪第一日：账上记欠、人还在', sandbox.playerHouse.farmhand.arrears === 1);
sandbox.farmhandDaily();
sandbox.farmhandDaily();
ok('欠满三日：长工辞工下山', sandbox.playerHouse.farmhand === null && sandbox.getFarmhand() === null);

// 8. 再雇再辞（辞工按钮正门）
STONES = 500;
patchRng([0.2]);
sandbox.hireFarmhand();
restoreRng();
ok('辞工按钮：结钱送下山', !!sandbox.getFarmhand() && sandbox.fireFarmhand() === true && sandbox.getFarmhand() === null);
ok('田里没人时辞工不空转', sandbox.fireFarmhand() === false);

// 9. 雇工账随洞府存档往返
STONES = 500;
patchRng([0.3]);
sandbox.hireFarmhand();
restoreRng();
const dump = JSON.parse(JSON.stringify(sandbox.exportHouseState()));
sandbox.importHouseState(null);
ok('无宅时雇工账随之清空', sandbox.getFarmhand() === null);
sandbox.importHouseState(dump);
ok('读档回来长工还在岗（随 playerHouse 成对往返）', !!sandbox.getFarmhand() && sandbox.getFarmhand().name === dump.farmhand.name);
sandbox.fireFarmhand();

// ============================================================
console.log('== v27.1-C 漕运/茶马道（caravan-trade.js）==');
run('js/economy/caravan-trade.js');
const CT = sandbox.CaravanTrade;
STONES = 5000;   // 前两节把家底折腾光了，商路本钱另起一份
ok('StateRegistry 正门挂上（caravan）', !!reg['caravan']);
ok('两条商路明账齐全', CT.TRADE_ROUTES.canal.days === 5 && CT.TRADE_ROUTES.canal.risk === 0.12 && CT.TRADE_ROUTES.teahorse.days === 12 && CT.TRADE_ROUTES.teahorse.capMax === 3000);

// 1. 发货闸门与夹板
ok('不认的路线发不了车', CT.send('丝绸之路', 500) === false);
ok('本钱太少装不满一船', CT.send('canal', 50) === false);
ok('本钱太多商队不敢接', CT.send('canal', 2000) === false);
const stonesPreSend = STONES;
ok('漕运发货成功：本钱当场扣、5日后回笼', CT.send('canal', 500) === true && STONES === stonesPreSend - 500);
let v = CT.voyages();
ok('商路账写死到期日', v.length === 1 && v[0].route === 'canal' && v[0].dueDay === TRADE_DAY + 5);
CT.send('teahorse', 300);
ok('两支在路上到顶（第三支被拦）', CT.voyages().length === 2 && CT.send('canal', 100) === false);

// 2. 未到期不动账
CT.settleVoyages();
ok('未到期：日结不碰商队', CT.voyages().length === 2);

// 钱闸：清空在途专验「灵石不足」
reg['caravan'].import({ cargo: [], voyages: [] });
const stonesBak = STONES; STONES = 50;
ok('灵石不足发不了车', CT.send('canal', 100) === false && CT.voyages().length === 0);
STONES = stonesBak;

// 3. 到期平安：连本带利（利幅区间内掷）
reg['caravan'].import({ cargo: [], voyages: [{ route: 'canal', capital: 500, departDay: TRADE_DAY, dueDay: TRADE_DAY }] });
const stonesPreProfit = STONES;
patchRng([0.99, 0.5]);   // 风险骰不中 → 利幅骰取中
CT.settleVoyages();
restoreRng();
// profit = round(500×(0.10+0.5×0.15)) = round(87.5) = 88
ok('平安回笼：500本+88利入袋、账清', CT.voyages().length === 0 && STONES === stonesPreProfit + 588, 'STONES=' + STONES);

// 4. 到期被截：收回六成本钱+传闻
reg['caravan'].import({ cargo: [], voyages: [{ route: 'canal', capital: 500, departDay: TRADE_DAY, dueDay: TRADE_DAY }] });
const stonesPreAmbush = STONES;
deedLog.length = 0;
patchRng([0.001]);   // 风险骰必中
CT.settleVoyages();
restoreRng();
ok('被截：镖师护住六成（300回笼）、白跑一趟', CT.voyages().length === 0 && STONES === stonesPreAmbush + 300, 'STONES=' + STONES);
ok('被截传闻落账（行商圈里传你时运不济）', deedLog.some(d => d.kind === 'bad'));

// 5. 读档归一化：不认的路线/坏本钱/坏日期一律当没发过车
reg['caravan'].import({ cargo: [], voyages: [
    { route: '丝绸之路', capital: 500, dueDay: 9 },
    { route: 'canal', capital: -10, dueDay: 9 },
    { route: 'canal', capital: 200.7, dueDay: 'x' },
    { route: 'teahorse', capital: 300.9, departDay: 'y', dueDay: 50 },
    { route: 'teahorse', capital: 400, dueDay: 60 },
    { route: 'canal', capital: 100, dueDay: 70 }
] });
v = CT.voyages();
ok('坏商队账归一（只留两支、本钱夹板取整）', v.length === 2 && v[0].route === 'teahorse' && v[0].capital === 300 && v[0].departDay === 0 && v[1].capital === 400);
reg['caravan'].reset();
ok('转世清账：商路账归零', CT.voyages().length === 0);

restoreRng();
console.log('\n== 结果：' + pass + ' 通过 / ' + fail + ' 失败 ==');
process.exit(fail ? 1 : 0);
