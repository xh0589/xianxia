// ==================== v27.2 善举与声望批回归测试 ====================
// 覆盖：善举名册（每城一次/银钱不足整笔不成/疫年施药闸门/账面办不成的救孩）·
//       人情账（穷书生到期自动报恩/未到期不动）· 里程碑链（双门槛/逐级不越级）·
//       低频街面事（被拐孩子赎/抢/报官、路见不平、受托孤——事不追人：全局隔日+每城冷却）·
//       城情卡加行 · 读档归一化（坏账不进门）。
// 运行：node tools/good-deeds-regression-test.cjs
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

// ---------- 骰子（引擎随机源正门：__scenarioRng） ----------
let rngQueue = null;
const origRandom = Math.random;
function patchRng(q) { rngQueue = q.slice(); Math.random = () => (rngQueue && rngQueue.length ? rngQueue.shift() : 0.5); }
function restoreRng() { rngQueue = null; Math.random = origRandom; }

// ---------- 宽容桩 ----------
let DAY = 100;
let STONES = 5000;
let KARMA = 0;
let LOC = '甲城';
let PLAGUE = false;
const timeLog = [];
const deedLog = [];
const modals = {};

const sandbox = {
    console: { log() {}, warn() {}, error() {} },
    Math, Date, JSON, Object, Array, String, Number, Boolean, Set, Map, isFinite, parseInt, parseFloat
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
sandbox.document = {
    readyState: 'complete',
    getElementById: id => modals[id] || null,
    createElement: () => {
        const el = { innerHTML: '', style: {}, className: '', onclick: null, id: '' };
        el.remove = () => { delete modals[el.id]; };
        return el;
    },
    documentElement: { style: {} },
    addEventListener: () => {},
    body: { appendChild(el) { modals[el.id] = el; } }
};
sandbox.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
sandbox.showMessage = () => {};
sandbox.gameLog = { add() {} };
sandbox.updateCurrencyUI = () => {};
sandbox.getAbsoluteDay = () => DAY;
sandbox.currentCharData = { location: '甲城', spiritStones: 5000, realm: '炼气', karma: 0, health: 100, qi: 100, flags: {} };
sandbox.getRealmIndex = r => (r === '筑基' ? 1 : r === '金丹' ? 2 : 0);
sandbox.playerPushDeed = (mood, text) => deedLog.push({ mood, text: String(text) });
sandbox.locationSystem = {
    getCurrentLocation: () => LOC,
    getCityData: c => (c === '甲城' || c === '乙城' ? { buildings: ['charity_hall'] } : null)
};
sandbox.EventBus = { on() {}, emit() {} };
sandbox.timeSystem = {
    onNewDaySubscribe: () => {},
    advanceTime: (m, label) => timeLog.push({ m, label }),
    getAbsoluteDay: () => DAY,
    gameTime: { currentDay: DAY }
};
sandbox.XianXia = { DataManager: {
    getSpiritStones: () => STONES,
    addSpiritStones: n => { STONES += n; },
    deductSpiritStones: n => { if (STONES < n) return false; STONES -= n; return true; }
} };
sandbox.DataManager = sandbox.XianXia.DataManager;
// RewardService 桩：一笔事务——灵石不足整笔不成；rep 走真 addReputation（reputation-system 正门）
sandbox.RewardService = { apply(spec, opts) {
    const st = Number(spec.stones) || 0;
    if (st < 0 && STONES < -st) return { success: false, reason: 'insufficient_stones' };
    STONES += st;
    if (spec.rep) sandbox.addReputation((opts && opts.city) || LOC, spec.rep);
    if (spec.karma) KARMA += spec.karma;
    if (spec.health) sandbox.currentCharData.health += spec.health;
    if (spec.qi) sandbox.currentCharData.qi += spec.qi;
    return { success: true, messages: spec.msg ? [spec.msg] : [] };
} };

const context = vm.createContext(sandbox);
function run(rel) { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), context, { filename: rel }); }

console.log('== v27.2 善举与声望批回归 ==');
run('js/reputation-system.js');
run('js/world-events.js');
const GD = sandbox.GoodDeeds;

// ---------- 1. 名册与世界事件接线 ----------
ok('善举名册九件齐全', GD.GOOD_DEEDS.length === 9 && GD.GOOD_DEEDS.some(d => d.id === 'scholar'));
ok('里程碑五座（牌坊→写戏→地方志→国史→御匾）', GD.MILESTONES.map(m => m.id).join() === 'paifang,opera,gazette,history,plaque');
const plagueDef = sandbox.WORLD_EVENTS.filter(e => e.id === 'plague')[0];
ok('疫病世界事件挂上（可参与：施药设棚）', !!plagueDef && plagueDef.participate.action === 'dispense_medicine');

// ---------- 2. 读档归一化：坏账不进门 ----------
let led = GD.ledgerOf('甲城');
led.done = { tea: 105, bridge: -3, 瞎编的善举: 9 };
led.favors = [{ kind: 'x' }, { kind: 'scholar', repayDay: 280, stones: 300, text: '报恩' }];
led.milestones = ['paifang', '不存在的碑'];
led = GD.ledgerOf('甲城');
ok('坏善举账归一（假键/负日剔除，真键留下）', led.done.tea === 105 && !led.done.bridge && !led.done['瞎编的善举']);
ok('坏人情账归一（无到期日不进账）', led.favors.length === 1 && led.favors[0].kind === 'scholar');
ok('坏里程碑归一（不认的碑不立）', led.milestones.length === 1 && led.milestones[0] === 'paifang');
led.done = {}; led.favors = []; led.milestones = [];

// ---------- 3. 行善正门：一笔事务 ----------
LOC = '荒山野岭';
ok('人在野外行不了善（先进城）', GD.doGoodDeed('tea') === false);
LOC = '甲城';
const stonesPreTea = STONES;
const repPre = sandbox.getReputationValue('甲城');
ok('城门施茶成账：-20灵石、城望+8、账上落日戳', GD.doGoodDeed('tea') === true && STONES === stonesPreTea - 20 && sandbox.getReputationValue('甲城') === repPre + 8 && GD.ledgerOf('甲城').done.tea === DAY);
ok('耗时如实走时辰账', timeLog.some(t => t.label === '行善'));
ok('风声入传闻账', deedLog.some(d => d.mood === 'good' && d.text.indexOf('城门施茶') >= 0));
ok('一城一件（重做被拦、不再扣钱）', GD.doGoodDeed('tea') === false && STONES === stonesPreTea - 20);
STONES = 5;
ok('灵石不足整笔不成（桥没修、钱没扣、账没记）', GD.doGoodDeed('bridge') === false && STONES === 5 && !GD.ledgerOf('甲城').done.bridge);
STONES = 5000;
ok('救孩账面上办不成（得真撞上）', GD.doGoodDeed('child') === false && !GD.ledgerOf('甲城').done.child);
ok('疫年施药：太平年头药棚支不起来', GD.doGoodDeed('medicine') === false && !GD.ledgerOf('甲城').done.medicine);
sandbox.isWorldEventActive = id => (id === 'plague' ? PLAGUE : false);
PLAGUE = true;
ok('疫病流行中：施药办得成（世界事件正门同路）', GD.doGoodDeed('medicine') === true && !!GD.ledgerOf('甲城').done.medicine);
PLAGUE = false;

// ---------- 4. 人情账：资助穷书生 → 到期自动报恩 ----------
GD.doGoodDeed('scholar');
let ledA = GD.ledgerOf('甲城');
ok('穷书生人情入账（180日后报恩）', ledA.favors.length === 1 && ledA.favors[0].repayDay === DAY + 180 && ledA.favors[0].stones === 300);
ok('未到期：翻日不动人情账', GD.favorTick() === 0 && GD.ledgerOf('甲城').favors.length === 1);
DAY += 180;
const stonesPreFavor = STONES;
const repPreFavor = sandbox.getReputationValue('甲城');
ok('到期自动上门报恩：+300灵石+城望10、账销', GD.favorTick() === 1 && STONES === stonesPreFavor + 300 && sandbox.getReputationValue('甲城') === repPreFavor + 10 && GD.ledgerOf('甲城').favors.length === 0);

// ---------- 5. 里程碑链：双门槛 + 逐级不越级 ----------
sandbox.setReputation('甲城', 10000);
['tree', 'well', 'bridge'].forEach(id => GD.markDeed('甲城', id));   // 加上 tea/medicine/scholar 共 6 件
let earned = GD.checkMilestones('甲城');
ok('善举6件+城望满万：牌坊与写戏连立两座', GD.ledgerOf('甲城').milestones.join() === 'paifang,opera');
ok('地方志要8件——差两件就是不立', GD.ledgerOf('甲城').milestones.indexOf('gazette') < 0);
GD.markDeed('甲城', 'granary'); GD.markDeed('甲城', 'ransom');
sandbox.setReputation('甲城', 5000);
GD.checkMilestones('甲城');
ok('城望跌回5000：地方志立了、国史（要8000）不越级', GD.ledgerOf('甲城').milestones.join() === 'paifang,opera,gazette');
sandbox.setReputation('甲城', 10000);
GD.checkMilestones('甲城');
ok('城望够但善举8件：国史（要9件）仍不立', GD.ledgerOf('甲城').milestones.join() === 'paifang,opera,gazette');
GD.markDeed('甲城', 'child');   // 第九件（真实玩法里这件只能街面上救出来——测试直接记账验门槛）
GD.checkMilestones('甲城');
ok('九件齐+城望满万：国史与御匾同日立（逐级过档）', GD.ledgerOf('甲城').milestones.join() === 'paifang,opera,gazette,history,plaque');
ok('立过的不重立', GD.checkMilestones('甲城').length === 0);
delete GD.ledgerOf('甲城').done.child;   // 还原：第6节要验「救孩还没做过」的街面遭遇

// ---------- 6. 低频街面事：事不追人 ----------
// 全局隔日戳 + 每城冷却戳 + 一骰 12%
sandbox.currentCharData.flags = {};
DAY = 400;
patchRng([0.99]);   // 骰不中
GD.encounterTick();
restoreRng();
ok('骰不中：街面太平', !modals['gd-encounter-modal']);
patchRng([0.01, 0.5]);   // 骰中；池 [child,bully,orphan]，0.5×3→index1=bully
GD.encounterTick();
restoreRng();
ok('街面事弹窗开了（低频、带明账选项）', !!modals['gd-encounter-modal'] && modals['gd-encounter-modal'].innerHTML.indexOf('恶霸') >= 0);
ok('全局隔日戳落账（五日内不再撞）', sandbox.currentCharData.flags._gdLastEncDay === 400);
const stonesPreBully = STONES;
patchRng([0.01]);   // 喝止必胜
GD.encChoice('stop');
restoreRng();
ok('路见不平喝止成功：城望落账、卖菜翁人情入簿、一生一回', sandbox.getReputationValue('甲城') > 0 && GD.ledgerOf('甲城').favors.some(f => f.kind === 'vendor') && sandbox.currentCharData.flags._gdBully === 400);
ok('弹窗点完即关', !modals['gd-encounter-modal']);
DAY = 401;
patchRng([0.0, 0.0]);
GD.encounterTick();
restoreRng();
ok('隔日不足五日：不再撞事（事不追人）', !modals['gd-encounter-modal']);

// 被拐孩子：赎/抢/报官三条路
DAY = 410;
sandbox.currentCharData.flags._gdLastEncDay = 400;   // 隔满五日
GD.ledgerOf('甲城').seen = { bully: 400 };           // bully 冷却中，池=[child, orphan]
patchRng([0.01, 0.1]);   // 骰中；0.1×2=0.2→index0=child
GD.encounterTick();
restoreRng();
ok('撞上人牙子拖孩子（善举39的正门）', !!modals['gd-encounter-modal'] && modals['gd-encounter-modal'].innerHTML.indexOf('人牙子') >= 0);
const stonesPreChild = STONES;
GD.encChoice('pay');
ok('花钱赎回：-150灵石、善举39销账、城望功德落账', STONES === stonesPreChild - 150 && !!GD.ledgerOf('甲城').done.child);

// 受托孤：接了 → 长线人情360日
DAY = 430;
sandbox.currentCharData.flags._gdLastEncDay = 410;
GD.ledgerOf('甲城').seen = { bully: 400, child: 410 };
patchRng([0.01, 0.9]);   // 池只剩 [orphan]
GD.encounterTick();
restoreRng();
ok('老汉托孤弹窗开了', !!modals['gd-encounter-modal'] && modals['gd-encounter-modal'].innerHTML.indexOf('福儿') >= 0);
GD.encChoice('take');
ok('接过孩子：功德落账、360日长线人情入簿、一生一回', GD.ledgerOf('甲城').favors.some(f => f.kind === 'orphan' && f.repayDay === DAY + 360) && sandbox.currentCharData.flags._gdOrphan === 430);

// ---------- 7. 城情卡加行（wrapper 正门） ----------
const panel = sandbox.getReputationPanelHtml('甲城');
ok('城情卡摆出善举簿与里程碑', panel.indexOf('善举簿') >= 0 && panel.indexOf('御赐匾额') >= 0 && panel.indexOf('已立') >= 0);

// ---------- 8. 疫年施药的世界事件参与口 ----------
sandbox.activeWorldEvents['plague'] = { startDay: DAY, duration: 5, endDay: DAY + 5, _today: DAY };
PLAGUE = true;
LOC = '乙城';
ok('世界事件面板「施药设棚」直通善举账（乙城首记）', sandbox.participateWorldEvent('plague') === true && !!GD.ledgerOf('乙城').done.medicine);
ok('乙城再施被拦（一城一回）', sandbox.participateWorldEvent('plague') === false);
delete sandbox.activeWorldEvents['plague'];
PLAGUE = false;
LOC = '甲城';

restoreRng();
console.log('\n== 结果：' + pass + ' 通过 / ' + fail + ' 失败 ==');
process.exit(fail ? 1 : 0);
