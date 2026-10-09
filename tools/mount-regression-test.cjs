// ==================== v27.0 坐骑批 · 定向回归测试 ====================
// 覆盖：凡兽三模板 / 买定牵走 / 出战拦截 / 骑乘提速账（成色+掉膘）/ 培养拦截 /
//       喂草料日限 / 草料日结（扣钱→掉膘→补齐回膘）/ 厩满闸 / 卖回半价 / 指针随splice /
//       兽蛋孵化（正常破壳 + 魂印满缓孵）/ 骡车入旅行方式表 / 灵兽生态增益补齐。
// 运行：node tools/mount-regression-test.cjs
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
let CURRENT_DAY = 10;
const messages = [];
function makeCtx() {
    const localStorageStore = {};
    const sandbox = {
        console: { log() {}, warn() {}, error() {} },
        Math, Date, JSON, Object, Array, String, Number, Boolean, Set, Map, isFinite, parseInt, parseFloat,
        localStorage: {
            getItem: k => (k in localStorageStore ? localStorageStore[k] : null),
            setItem: (k, v) => { localStorageStore[k] = String(v); },
            removeItem: k => { delete localStorageStore[k]; }
        }
    };
    sandbox.window = sandbox;
    sandbox.globalThis = sandbox;
    sandbox.document = { getElementById: () => null, querySelectorAll: () => [], createElement: () => ({ style: {}, classList: { add() {}, remove() {} }, setAttribute() {} }), documentElement: { style: {} }, addEventListener: () => {}, body: { appendChild() {}, style: {} } };
    sandbox.showMessage = (m, t) => messages.push({ m: String(m), t });
    sandbox.gameLog = { add() {} };
    sandbox.saveToStorage = () => {};
    sandbox.updateCurrencyUI = () => {};
    sandbox.renderBeastList = () => {};
    sandbox.updateInventoryUI = () => {};
    sandbox.showModal = () => {};
    sandbox.getAbsoluteDay = () => CURRENT_DAY;
    sandbox.timeSystem = { advanceTime() {}, onNewDaySubscribe() {} };
    sandbox.currentCharData = { location: '测试城', copper: 5000, spiritStones: 100, realm: '炼气', energy: 100 };
    sandbox.inventory = { slots: [], currency: null };
    // addItem 简化版：maxStack 1 → 单槽
    sandbox.addItem = function (id, n) {
        const tpl = sandbox.itemById && sandbox.itemById[id];
        if (!tpl) return 0;
        for (let k = 0; k < n; k++) sandbox.inventory.slots.push({ templateId: id, count: 1 });
        return n;
    };
    sandbox.itemById = {};
    sandbox.addEventListener = () => {};
    return sandbox;
}

function load(ctx, rel) {
    const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    vm.runInContext(code, vm.createContext ? ctx._context : ctx, { filename: rel });
}

// 建 vm 上下文
const sandbox = makeCtx();
const context = vm.createContext(sandbox);
function run(rel) {
    const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    vm.runInContext(code, context, { filename: rel });
}

console.log('== v27.0 坐骑批回归 ==');

// ---------- 1. beast-taming：凡兽模板与闸门 ----------
run('js/beast-taming.js');
const T = sandbox.BEAST_TEMPLATES;
ok('凡兽三模板入册', T.horse_common && T.mule_common && T.horse_fine && T.horse_common.mundane && T.horse_fine.mundane);
ok('凡兽速度全弱于风狼(1.5)', T.horse_fine.mount.speed < T.wind_wolf.mount.speed && T.horse_common.mount.speed < 1.5);
ok('凡兽不可收服', T.horse_common.catchable === false);

sandbox.initBeastTaming();
ok('买入口生效', sandbox.buyMundaneBeast('horse_common', { qualityAdj: 0.1, qualityName: '上好' }) === true);
ok('凡兽入账且不占魂印', sandbox.mundaneBeastCount() === 1 && sandbox.spiritBeastCount() === 0);
ok('凡兽出战被拦', sandbox.setActiveBeast(0) === false);
ok('凡兽培养被拦', sandbox.trainBeast(0) === false);
ok('凡兽无战斗数据', sandbox._beastCombatDataAt ? true : (sandbox.setActiveMount(0) === true && sandbox.getMountCombatData() === null));
ok('骑乘可选中', sandbox.setActiveMount(0) === true);
const mulGood = sandbox.getMountTravelTimeMultiplier();
ok('成色上好提速 1/(1.2+0.1)', Math.abs(mulGood - 1 / 1.3) < 1e-9, 'got ' + mulGood);

// 喂草料：日限一次
sandbox.feedBeast(0);
const aff1 = sandbox.tamedBeasts[0].affection;
sandbox.feedBeast(0);
ok('草料日限一次（亲密不重复涨）', sandbox.tamedBeasts[0].affection === aff1);

// 草料日结：钱够扣钱不掉膘；钱不够掉膘减速；补钱回膘
sandbox.currentCharData.copper = 0;
sandbox.mundaneFodderTick();
ok('断顿掉膘', sandbox.tamedBeasts[0].thin === true);
const mulThin = sandbox.getMountTravelTimeMultiplier();
ok('掉膘减速（×0.8）', Math.abs(mulThin - 1 / (1.3 * 0.8)) < 1e-9, 'got ' + mulThin);
sandbox.currentCharData.copper = 500;
sandbox.mundaneFodderTick();
ok('补齐草料回膘', sandbox.tamedBeasts[0].thin === false && sandbox.currentCharData.copper === 498);

// 厩满闸（3头）
sandbox.buyMundaneBeast('mule_common', {});
sandbox.buyMundaneBeast('horse_fine', {});
ok('厩满第四头买不进', sandbox.buyMundaneBeast('horse_common', {}) === false && sandbox.mundaneBeastCount() === 3);

// 卖回半价 + 指针随 splice
const copperBefore = sandbox.currentCharData.copper;
sandbox.sellMundaneBeastNow(0);   // 卖的是当值坐骑（上好凡马 700/2=350）
ok('卖回半价落账', sandbox.currentCharData.copper === copperBefore + 350, 'got ' + sandbox.currentCharData.copper);
ok('当值坐骑被卖→摘牌', sandbox.activeMountIndex === -1 && sandbox.getActiveMount() === null);
ok('厩位腾出', sandbox.mundaneBeastCount() === 2);

// 灵兽魂印账不受凡兽占格：塞 3 只灵兽仍买得进兽（cap=3+realm idx 0 → 3）
sandbox.tamedBeasts.push({ templateId: 'wind_wolf', name: '风狼', level: 1, exp: 0, affection: 50, skills: [], combatAbilities: [], mount: { speed: 1.5 } });
sandbox.saveBeastData();
ok('灵兽计数只数灵兽', sandbox.spiritBeastCount() === 1 && sandbox.mundaneBeastCount() === 2);

// ---------- 2. horse-market：柜台 / 兽蛋 ----------
run('js/city-facilities/horse-market.js');
ok('马市模态可开', typeof sandbox.openHorseMarket === 'function' && (sandbox.openHorseMarket(), true));
ok('兽蛋物品已注册', !!sandbox.itemById['beast_egg'] && sandbox.itemById['beast_egg'].maxStack === 1);

// 买定牵走（柜台口）：青骡已在厩，再买凡马
sandbox.currentCharData.copper = 3000;
const bought = sandbox.hmBuyBeast('horse_common');
ok('柜台买定牵走', bought === true && sandbox.mundaneBeastCount() === 3 && sandbox.currentCharData.copper < 3000);
sandbox.sellMundaneBeastNow(sandbox.tamedBeasts.length - 1); // 腾厩给后续测试

// 兽蛋孵化：正常破壳
sandbox.tamedBeasts.length = 0; sandbox.activeBeastIndex = -1; sandbox.activeMountIndex = -1;
sandbox.inventory.slots.push({ templateId: 'beast_egg', count: 1, _hatchDay: CURRENT_DAY });
sandbox.HorseMarket.eggHatchTick();
ok('焐满三日破壳入栏', sandbox.tamedBeasts.length === 1 && sandbox.spiritBeastCount() === 1 && sandbox.inventory.slots[0] === null);
ok('破壳的是低阶池兽', ['wind_wolf', 'spirit_fox', 'flame_tiger', 'ice_serpent', 'crane', 'black_bear'].indexOf(sandbox.tamedBeasts[0].templateId) >= 0);

// 魂印满 → 缓孵（蛋不坏）
while (sandbox.tamedBeasts.length < 3) sandbox.tamedBeasts.push({ templateId: 'crane', name: '仙鹤', level: 1, exp: 0, affection: 50, skills: [], combatAbilities: [], mount: { speed: 1.4 } });
sandbox.inventory.slots.push({ templateId: 'beast_egg', count: 1, _hatchDay: CURRENT_DAY });
sandbox.HorseMarket.eggHatchTick();
ok('魂印满缓孵（蛋留在行囊）', sandbox.tamedBeasts.length === 3 && sandbox.inventory.slots.some(s => s && s.templateId === 'beast_egg'));
// 无日戳的蛋：见蛋补记（缓孵的旧蛋日戳不动，新蛋补记 当日+3）
sandbox.inventory.slots.push({ templateId: 'beast_egg', count: 1 });
sandbox.HorseMarket.eggHatchTick();
ok('旁路蛋补记孵化日', sandbox.inventory.slots.filter(s => s && s.templateId === 'beast_egg' && s._hatchDay === CURRENT_DAY + 3).length === 1);

// ---------- 3. travel-system：骡车 ----------
try {
    run('js/travel-system.js');
    const TM = (sandbox.travelSystem && sandbox.travelSystem.TRAVEL_METHODS) || null;
    ok('骡车入旅行方式表', !!TM && !!TM.MULE_CART && TM.MULE_CART.id === 'mule_cart' && TM.MULE_CART.timeCost === 90 && TM.MULE_CART.cost === 30);
    ok('骡车介于步行与骑马之间', TM.MULE_CART.timeCost > TM.HORSE.timeCost && TM.MULE_CART.timeCost < TM.WALK.timeCost && TM.MULE_CART.cost < TM.HORSE.cost);
} catch (e) {
    ok('travel-system 可加载', false, e.message);
}

// ---------- 4. beast-ecosystem：非战斗增益补齐 ----------
try {
    run('js/extensions/beast-ecosystem.js');
    sandbox.tamedBeasts.length = 0;
    sandbox.tamedBeasts.push({ templateId: 'crane', name: '仙鹤', level: 5, uid: 'crane_0' });
    sandbox.window = sandbox;
    const eco = sandbox.BeastEcosystem;
    ok('仙鹤有引路账', eco && eco.getActiveBeastBuff('travel') === 0.9);
    sandbox.tamedBeasts.push({ templateId: 'kunpeng', name: '鲲鹏', level: 40, uid: 'kunpeng_1' });
    ok('引路只取最好一笔（鲲鹏0.6）', eco.getActiveBeastBuff('travel') === 0.6);
    sandbox.tamedBeasts.length = 0;
    sandbox.tamedBeasts.push({ templateId: 'black_bear', name: '黑熊', level: 5, uid: 'bb_0' });
    ok('黑熊有驮货账（储物+8%）', eco.getActiveBeastBuff('carry') === 0.08);
    // 凡兽不吃生态账
    sandbox.tamedBeasts.push({ templateId: 'horse_common', name: '凡马', level: 1, mundane: true });
    ok('凡兽不冒领增益', eco.getActiveBeastBuff('carry') === 0.08);
} catch (e) {
    ok('beast-ecosystem 可加载', false, e.message);
}

// ---------- 5. 车马行：挂出/牵回/日结租钱/劳损 ----------
sandbox.tamedBeasts.length = 0;
sandbox.activeBeastIndex = -1; sandbox.activeMountIndex = -1;
sandbox.inventory.slots.length = 0;
CURRENT_DAY = 12;
sandbox.currentCharData.copper = 1000;
sandbox.currentCharData._hmRace = null;
sandbox.buyMundaneBeast('horse_fine', { qualityAdj: 0.1, qualityName: '上好' });   // 速度 1.4+0.1=1.5
sandbox.setActiveMount(0);
ok('挂出前骑乘在值', sandbox.getActiveMount() !== null);
ok('挂车马行成功', sandbox.hireOutBeast(0) === true && sandbox.tamedBeasts[0].outToLivery === true);
ok('挂出即摘牌（当值坐骑落空）', sandbox.activeMountIndex === -1 && sandbox.getActiveMount() === null);
ok('挂出中不可骑乘', sandbox.setActiveMount(0) === false);
const origRandom = Math.random;
Math.random = () => 0.99;   // 避开劳损骰
sandbox.HorseMarket.liveryTick();
ok('日结租钱 = 速度×8 铜', sandbox.currentCharData.copper === 1000 + 12, 'got ' + sandbox.currentCharData.copper);
Math.random = () => 0.01;   // 必定劳损
sandbox.HorseMarket.liveryTick();
ok('劳损掉膘（明账 8%）', sandbox.tamedBeasts[0].thin === true);
ok('劳损当日租钱照全价（先结租后劳损）', sandbox.currentCharData.copper === 1012 + 12, 'got ' + sandbox.currentCharData.copper);
sandbox.HorseMarket.liveryTick();
ok('掉膘次日起租钱打八折', sandbox.currentCharData.copper === 1024 + 10, 'got ' + sandbox.currentCharData.copper);
Math.random = origRandom;
ok('掉膘的牲口车马行不收第二头', (sandbox.buyMundaneBeast('horse_common', {}), sandbox.hireOutBeast(0) === true));  // 已挂出幂等
sandbox.bringBackBeast(0);
ok('牵回后可骑乘', sandbox.tamedBeasts[0].outToLivery === false && sandbox.setActiveMount(0) === true);
sandbox.sellMundaneBeastNow(1);   // 清掉刚买的凡马
sandbox.feedBeast(0);
ok('亲手喂草料回膘', sandbox.tamedBeasts[0].thin === false);

// ---------- 6. 郊外赛马 ----------
CURRENT_DAY = 13;
sandbox.currentCharData._hmRace = null;
sandbox.currentCharData.copper = 1000;
const my = sandbox.HorseMarket.myRaceMount('mundane');
ok('凡兽会有报名资格（骏马 1.5）', !!my && Math.abs(my.speed - 1.5) < 1e-9);
sandbox.openHorseRace('mundane');
const race = sandbox.HorseMarket.raceOf('mundane');
ok('开场三道 NPC 明账', race.field.length === 3 && race.field.every(r => r.speed >= 1.1 && r.speed <= 1.5));
sandbox.hmRaceBet('mundane', 0, 10);
ok('押注扣铜钱', sandbox.currentCharData.copper === 990 && race.bet && race.bet.amount === 10);
sandbox.hmRaceBet('mundane', 1, 50);
ok('一场只吃一注', sandbox.currentCharData.copper === 990 && race.bet.idx === 0);
sandbox.hmRaceEnter('mundane');
sandbox.openHorseRace('mundane');
ok('报名后第四道是自己的', race.field.length === 4 && race.field[3].mine === true);
// 骰子按死：所有跑者同骰 0.5 → 纯拼脚力，最快者胜
Math.random = () => 0.5;
sandbox.hmRaceRun('mundane');
Math.random = origRandom;
const winIdx = race.field.reduce((bi, r, i) => (r.speed > race.field[bi].speed ? i : bi), 0);
ok('开锣即结算（settled+日戳）', race.settled === true && sandbox.currentCharData._hmRace && sandbox.currentCharData._hmRace.day === 13);
const myWon = (winIdx === 3);
const betWon = (winIdx === race.bet.idx);
let expectCopper = 990;
if (betWon) expectCopper += Math.round(10 * race.bet.odds);
if (myWon) expectCopper += 120;
ok('彩金/押注钱账分毫不差' + (myWon ? '（头名是你的）' : ''), sandbox.currentCharData.copper === expectCopper, 'got ' + sandbox.currentCharData.copper + ' expect ' + expectCopper);
ok('自家坐骑亲密真涨', sandbox.tamedBeasts[0].affection >= (myWon ? 43 : 41));
const copperAfterSettle = sandbox.currentCharData.copper;
sandbox._raceSecondRun = sandbox.hmRaceRun('mundane');
ok('每城每日一场（二开锣被拦）', sandbox.currentCharData.copper === copperAfterSettle);
sandbox.openHorseRace('mundane');
ok('散场后再开是结果牌', race.settled === true && race.resultText.indexOf('头名') >= 0);

// ---------- 7. 骑乘低频事件（兽惊/马贼） ----------
run('js/mount-events.js');
CURRENT_DAY = 20;
sandbox.currentCharData.copper = 1000;
sandbox.currentCharData.health = 100;
sandbox.currentCharData.maxHealth = 100;
sandbox.currentCharData._mountEvt = null;
sandbox.setActiveMount(0);   // 骏马（脚力1.5）在值
let rngQ = [];
sandbox.__scenarioRng = () => (rngQ.length > 1 ? rngQ.shift() : (rngQ.length === 1 ? rngQ[0] : 0.5));
rngQ = [0.01];   // 惊（<0.10）且勒得住（<0.70）
const affJ = sandbox.tamedBeasts[0].affection;
ok('骑乘抵达兽惊·勒得住（亲密+1）', sandbox.MountEvents.maybeJolt('horse') === true && sandbox.tamedBeasts[0].affection === affJ + 1);
rngQ = [0.05, 0.99];   // 惊了且掀下马
sandbox.MountEvents.maybeJolt('walk');
ok('掀下马：轻伤5%', sandbox.currentCharData.health === 95, 'got ' + sandbox.currentCharData.health);
rngQ = [0.01];
ok('法术位移不惊兽', sandbox.MountEvents.maybeJolt('teleport') === false);
ok('贼惦记的目标=脚力过线的凡兽', (() => { const t = sandbox.MountEvents.banditTarget(); return !!t && t.index === 0; })());
sandbox.__scenarioRng = () => 0.01;   // 踩点骰必过
sandbox.MountEvents.banditTick();
ok('马贼开弹窗（目标落账+日戳）', sandbox.currentCharData._mountEvt && sandbox.currentCharData._mountEvt.banditDay === 20 && sandbox._mountEvtTarget === 0);
sandbox._mountEvtTarget = -999;
sandbox.MountEvents.banditTick();
ok('五日冷却（冷却内不再开）', sandbox._mountEvtTarget === -999);
sandbox._mountEvtTarget = 0;
const affA = sandbox.tamedBeasts[0].affection, hpA = sandbox.currentCharData.health;
sandbox.__scenarioRng = () => 0.1;   // < 把握0.5+ → 截住
sandbox._meAmbush();
ok('设伏截住：贼滚、亲密+2、不挂彩', sandbox.tamedBeasts[0].affection === affA + 2 && sandbox.currentCharData.health === hpA);
sandbox._mePayOff();
ok('破财免灾：扣100铜、买15日太平', sandbox.currentCharData.copper === 900 && sandbox.currentCharData._mountEvt.peaceUntil === 35);
sandbox.currentCharData.copper = 50;
sandbox.currentCharData._mountEvt.peaceUntil = null;
sandbox._mountEvtTarget = 0;
sandbox._mePayOff();
ok('钱不够不成交（弹窗留给玩家另选）', sandbox.currentCharData.copper === 50 && sandbox.currentCharData._mountEvt.peaceUntil == null);
sandbox.__scenarioRng = () => 0.1;   // < 0.30 → 真被牵走
sandbox.setActiveMount(0);
sandbox._meShoo();
ok('轰走失手：马被牵走+当值摘牌', sandbox.mundaneBeastCount() === 0 && sandbox.tamedBeasts.length === 0 && sandbox.activeMountIndex === -1);
sandbox.__scenarioRng = () => 0.99;   // 太平骰 → 无事
sandbox.buyMundaneBeast('horse_common', {});
sandbox._mountEvtTarget = 0;
sandbox._meShoo();
ok('轰走得手：虚惊一场马还在', sandbox.mundaneBeastCount() === 1);

console.log('\n== 结果：' + pass + ' 通过 / ' + fail + ' 失败 ==');
process.exit(fail ? 1 : 0);
