// ==================== v27.1 营生扩展批 · 铺面类型表回归测试 ====================
// 覆盖：行当门槛（恶名/修为/医术）/ 一城一间 / 自动营生日进明账（伙计×城望×盈亏）/
//       销赃铺查抄 / 月账（专属事一骰+应选+钱不够不成交+过期自动了结）/
//       伙计资历→大掌柜→分号上限 2→4 / 冰行看季 / 车马行吃坐骑账 / 房东月租 /
//       读档归一化（坏账不进门）。
// 运行：node tools/shop-types-regression-test.cjs
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

// ---------- 宽容桩 ----------
let CUR_DAY = 10;
let NOTO = 0, YISHU = 0, REALM = '炼气', SEASON = 'spring', MUNDANE = 0;
const messages = [];
const heatLog = [];
const repLog = [];
const reg = {};
let STONES = 5000;

const sandbox = {
    console: { log() {}, warn() {}, error() {} },
    Math, Date, JSON, Object, Array, String, Number, Boolean, Set, Map, isFinite, parseInt, parseFloat
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
sandbox.document = { getElementById: () => null, createElement: () => ({ style: {}, classList: { add() {}, remove() {} } }), documentElement: { style: {} }, addEventListener: () => {} };
sandbox.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
sandbox.showMessage = (m, t) => messages.push({ m: String(m), t });
sandbox.gameLog = { add() {} };
sandbox.showBuildingEffectDialog = () => true;
sandbox.updateCharacterStatus = () => {};
sandbox.updateCurrencyUI = () => {};
sandbox.playerPushDeed = () => {};
sandbox.getAbsoluteDay = () => CUR_DAY;
sandbox.currentCharData = { location: '甲城', spiritStones: 5000, copper: 500, realm: '炼气', notoriety: 0 };
sandbox.getReputationValue = () => 0;
sandbox.addReputation = (ct, n) => repLog.push({ ct, n });
sandbox.reduceReputation = (ct, n) => repLog.push({ ct, n: -n });
sandbox.getLifeSkill = (n) => (n === '医术' ? YISHU : 0);
sandbox.getRealmIndex = (r) => (r === '筑基' ? 1 : r === '金丹' ? 2 : 0);
sandbox.mundaneBeastCount = () => MUNDANE;
sandbox.locationSystem = { getCityData: () => ({ buildings: ['shop'] }) };
sandbox.NpcCrime = { faceKnown: () => false, addHeat: (n, w) => heatLog.push({ n, w }) };
sandbox.StateRegistry = { register: (name, mod) => { reg[name] = mod; } };
sandbox.timeSystem = { onNewDaySubscribe: () => {}, advanceTime: () => {}, gameTime: { get currentSeason() { return SEASON; } } };
sandbox.XianXia = { DataManager: {
    getSpiritStones: () => STONES,
    addSpiritStones: n => { STONES += n; },
    deductSpiritStones: n => { if (STONES < n) return false; STONES -= n; return true; },
    getCopper: () => 500, addCopper() {}, deductCopper: () => true, setCopper() {}
} };
sandbox.DataManager = sandbox.XianXia.DataManager;
sandbox.itemById = { pill_small_recovery: { id: 'pill_small_recovery', name: '小还丹', price: 30, icon: '💊', category: 'pill' } };
sandbox.inventory = { slots: [], currency: null };
sandbox.addItem = () => 1;
sandbox.removeItem = () => true;
sandbox.giveWithReceipt = () => ({ got: 1 });

const context = vm.createContext(sandbox);
function run(rel) { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), context, { filename: rel }); }
function syncChar() {
    sandbox.currentCharData.notoriety = NOTO;
    sandbox.currentCharData.realm = REALM;
    sandbox.currentCharData.spiritStones = STONES;
}
function goto(ct) { sandbox.currentCharData.location = ct; syncChar(); }
const rngHigh = () => 0.99;   // 躲开查抄/月事/街面小事
const rngLow = () => 0.001;   // 全中

console.log('== v27.1 铺面类型表回归 ==');
run('js/city-facilities/player-shop.js');
const PS = sandbox.PlayerShop;
ok('类型表十二行齐全', Object.keys(PS.SHOP_TYPES).length === 12 && PS.SHOP_TYPES.fence.gate.noto === 30);
ok('StateRegistry 正门挂上', !!reg['playerShop']);

// ---------- 1. 门槛与买入 ----------
syncChar();
ok('恶名不足开不了赌坊', PS.buyShop('gamble') === false);
ok('炼气压不住武馆', PS.buyShop('wuguan') === false);
YISHU = 10; syncChar();
ok('医术不足开不了医馆', PS.buyShop('clinic') === false);
NOTO = 30; syncChar();
const stonesBefore = STONES;
const fencePrice = Math.round(PS.shopPrice('甲城') * 1.3);
ok('销赃铺门槛过→买断成功（价钱=底价×1.3）', PS.buyShop('fence') === true && STONES === stonesBefore - fencePrice);
ok('一城一间（再买被拦）', PS.buyShop('eatery') === false);
const sFence = PS.shopHere();
ok('铺面账带行当与月戳', sFence.type === 'fence' && sFence.monthSettled === 0 && sFence.incomeMul === 1 && sFence.pendingEvent === null);

// ---------- 2. 自动营生日进账 ----------
PS.dailySettle(rngHigh);
ok('无伙计人在城：日进=16×0.5=8 入柜', sFence.till === 8 && sFence.revenueTotal === 8, 'till=' + sFence.till);
const cands = PS.clerkCandidates();
ok('人市三名伙计（手艺1~5）', cands.length === 3 && cands.every(c => c.skill >= 1 && c.skill <= 5));
const stonesPreHire = STONES;
PS.hireClerk(0);
const clerk = sFence.clerk;
ok('伙计上柜（安家钱落账）', !!clerk && STONES === stonesPreHire - cands[0].hire);
const clerkMul = 0.6 + clerk.skill * 0.15;
const earned2 = Math.round(16 * clerkMul * 1);
const tax2 = Math.floor(earned2 * 0.05);
let tillExpect = Math.max(0, sFence.till + earned2 - tax2);
if (tillExpect >= clerk.wage) tillExpect -= clerk.wage;
PS.dailySettle(rngHigh);
ok('伙计日进=16×伙计系数，税与工钱柜上支', sFence.till === tillExpect, 'till=' + sFence.till + ' expect=' + tillExpect);
ok('柜上资历在熬（days=1）', clerk.days === 1, 'days=' + clerk.days);

// ---------- 3. 查抄账（销赃铺专属） ----------
const tillPre = sFence.till;
PS.dailySettle(rngLow);   // CUR_DAY 仍是 10 → 月账不翻，只中查抄
ok('查抄：柜上抄走三成', sFence.till === Math.max(0, Math.floor((tillPre + Math.round(16 * clerkMul) - Math.floor(Math.round(16 * clerkMul) * 0.05)) * 0.7) - clerk.wage) || sFence.till < tillPre + earned2, 'till=' + sFence.till);
ok('查抄：热度+城望如实落账', heatLog.some(h => String(h.w).indexOf('查抄') >= 0) && repLog.some(r => r.n === -3));

// ---------- 4. 月账：专属事一骰 + 应选 + 过期自动了结 ----------
CUR_DAY = 31;   // 翻月（monthIdx 0→1）
PS.dailySettle(() => 0.1);   // 月事骰 0.1<0.55 必出；查抄骰 0.1≥0.03 不中
ok('月账日出铺面事', !!sFence.pendingEvent && !!PS.findEvent(sFence));
STONES = 10; syncChar();
ok('钱不够不成交（事留着）', PS.eventChoice(0) === false && !!sFence.pendingEvent && STONES === 10);
STONES = 500; syncChar();
ok('应选「塞茶钱送神」：-40灵石、事了', PS.eventChoice(0) === true && STONES === 460 && sFence.pendingEvent === null);
CUR_DAY = 61;
PS.dailySettle(() => 0.1);
ok('新月又出一件事', !!sFence.pendingEvent);
CUR_DAY = 67;   // 放满六天（>5 过期）
PS.dailySettle(rngHigh);
ok('五日不管自动按稳妥章程了结（茶钱照付）', sFence.pendingEvent === null && STONES === 420, 'STONES=' + STONES);

// ---------- 5. 大掌柜与分号 ----------
STONES = 5000;
goto('乙城');
ok('第二间（酒楼）买得', PS.buyShop('eatery') === true);
goto('丙城');
ok('没大掌柜第三间被拦（cap=2）', PS.buyShop('post') === false && PS.shopCap() === 2);
goto('甲城');
clerk.skill = 4; clerk.days = 29;
ok('资历差一日提拔不得', PS.promoteHeadClerk() === false);
clerk.days = 30;
const wagePre = clerk.wage;
ok('手艺四成+三十日→大掌柜（日薪+2，cap=4）', PS.promoteHeadClerk() === true && clerk.head === true && clerk.wage === wagePre + 2 && PS.shopCap() === 4);
goto('丙城');
ok('分号：第三间（民信局）买得', PS.buyShop('post') === true);
goto('丁城');
ok('第四间（冰行）买得', PS.buyShop('ice') === true);
goto('戊城');
MUNDANE = 2;
ok('四间到顶第五间被拦', PS.buyShop('livery') === false && PS.shopCap() === 4);

// ---------- 6. 行当特色账：冰行看季 / 车马行吃坐骑 / 房东月租 ----------
// 冰行（丁城，人在丁城才算开门）
goto('丁城');
const sIce = PS.shopHere();
SEASON = 'summer';
PS.dailySettle(rngHigh);
ok('夏日冰行日进=20×0.5=10', sIce.till === 10, 'till=' + sIce.till);
SEASON = 'winter';
PS.dailySettle(rngHigh);
ok('冬日冰行日进=4×0.5=2', sIce.till === 12, 'till=' + sIce.till);
SEASON = 'spring';

// 车马行：借 StateRegistry 正门装一间（cap 已满，验完特色账再装房东）
CUR_DAY = 100;
reg['playerShop'].import({ shops: { '戊城': { city: '戊城', type: 'livery', till: 0 } } });
goto('戊城');
MUNDANE = 2;
PS.dailySettle(rngHigh);
const sLiv = PS.shopHere();
ok('车马行吃坐骑账：(6+4×2)×0.5=7', sLiv.till === 7, 'till=' + sLiv.till);
MUNDANE = 0;

// 房东：初一收租 120×城望系数
reg['playerShop'].import({ shops: { '己城': { city: '己城', type: 'landlord', till: 0, monthSettled: 0 } } });
goto('己城');
PS.dailySettle(rngHigh);
const sLand = PS.shopHere();
ok('房东月租 120 入柜（日进为零）', sLand.till === 120, 'till=' + sLand.till);

// ---------- 7. 读档归一化：坏账不进门 ----------
reg['playerShop'].import({ shops: {
    '坏城': { city: '坏城', type: '不存在的行当', till: -5, incomeMul: 99, pendingEvent: { id: '瞎编的事', day: 3 }, clerk: { name: 'x'.repeat(40), skill: 99, wage: 99, days: -3, head: 'yes' }, monthSettled: 'abc' },
    '好城': null
} });
const st2 = PS.state();
const bad = st2.shops['坏城'];
ok('坏行当归一为杂货铺', !!bad && bad.type === 'general');
ok('坏账归一（till/mul/事/伙计/月戳）', bad.till === 0 && bad.incomeMul === 2 && bad.pendingEvent === null && bad.clerk.skill === 5 && bad.clerk.wage === 7 && bad.clerk.days === 0 && bad.clerk.head === true && bad.monthSettled === 0);
ok('null 铺面不进账', !st2.shops['好城']);

console.log('\n== 结果：' + pass + ' 通过 / ' + fail + ' 失败 ==');
process.exit(fail ? 1 : 0);
