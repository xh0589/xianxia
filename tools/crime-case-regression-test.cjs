// ==================== v27.4 黑道与断案批回归测试 ====================
// 覆盖：黑道营生（扒窃成败两路/盗墓三路+守墓傀战结/伪造盐引路引假灵石/夹带私货城门联动/落草七日账/
//       卖情报三源+丐帮加成/安暗桩+暴露/读档归一化）·
//       断案引擎（捕快权限锁/案件低频生成/验看问人指认三步/仵作验尸钱/冷案上浮/办砸/归档上限/
//       海捕牌缉逃真仗+胜负两结/讼师利益回避/告状胜败/传票三路+缺席定谳/coolHeat 减热度正门/读档归一化）。
// 运行：node tools/crime-case-regression-test.cjs
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

// ---------- 骰子 ----------
const origRandom = Math.random;
let rngQueue = null;
function patchRng(q) { rngQueue = q.slice(); Math.random = () => (rngQueue && rngQueue.length ? rngQueue.shift() : 0.5); }
function restoreRng() { rngQueue = null; Math.random = origRandom; }

// ---------- 宽容桩 ----------
let DAY = 100;
let STONES = 5000;
let COPPER = 1000;
let SEASON = 'spring';
let LOC = '甲城';
const REP = {};
const pkCity = s => String(s == null ? '' : s).replace(/\s+/g, '');
const timeLog = [];
const deedLog = [];
const modals = {};
const reg = {};
const newDaySubs = [];
const battleLog = [];

const sandbox = {
    console: { log() {}, warn() {}, error() {} },
    Math, Date, JSON, Object, Array, String, Number, Boolean, Set, Map, isFinite, parseInt, parseFloat
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
sandbox.document = {
    readyState: 'complete',
    getElementById: id => modals[id] || null,
    createElement: () => { const el = { innerHTML: '', style: {}, className: '', id: '' }; el.remove = () => { delete modals[el.id]; }; return el; },
    querySelector: () => null,
    documentElement: { style: {} },
    addEventListener: () => {},
    body: { appendChild(el) { if (el && el.id) modals[el.id] = el; } }
};
sandbox.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
sandbox.showMessage = () => {};
sandbox.gameLog = { add() {} };
sandbox.updateCurrencyUI = () => {};
sandbox.updateCharacterStatus = () => {};
sandbox.closeModalSoft = () => {};
sandbox.showModal = (title, html) => { modals['__modal'] = { title, html: String(html) }; };
sandbox.showBuildingEffectDialog = (title, html) => { modals['__dialog'] = { title, html: String(html) }; };
sandbox.getAbsoluteDay = () => DAY;
sandbox.getCurrentCityName = () => LOC;
sandbox.getRealmIndex = r => (r === '筑基' ? 1 : r === '金丹' ? 2 : 0);
sandbox.getRealmTier = r => (r === '炼气' ? 1 : r === '筑基' ? 2 : r === '金丹' ? 3 : 4);
sandbox.playerPushDeed = (mood, text) => deedLog.push({ mood, text: String(text) });
sandbox.addReputation = (city, val) => { const k = pkCity(city); REP[k] = (REP[k] || 0) + (Number(val) || 0); };
sandbox.reduceReputation = (city, val) => { const k = pkCity(city); REP[k] = (REP[k] || 0) - (Number(val) || 0); };
sandbox.getReputationValue = city => REP[pkCity(city)] || 0;
sandbox.growLifeSkill = (name, exp) => { const p = sandbox.currentCharData; if (!p) return; p.lifeSkills = p.lifeSkills || {}; p.lifeSkills[name] = Math.min(100, (Number(p.lifeSkills[name]) || 0) + (Number(exp) || 1)); };
sandbox.getLifeSkill = name => { const p = sandbox.currentCharData; return (p && p.lifeSkills && Number(p.lifeSkills[name])) || 0; };
sandbox.locationSystem = { getCurrentLocation: () => LOC, getCityData: c => ((c === '甲城' || c === '乙城') ? { buildings: [] } : null) };
sandbox.timeSystem = {
    onNewDaySubscribe: fn => newDaySubs.push(fn),
    advanceTime: (m, label) => timeLog.push({ m, label }),
    getAbsoluteDay: () => DAY,
    gameTime: { get currentSeason() { return SEASON; } }
};
sandbox.currentCharData = {
    location: '甲城', realm: '炼气', spiritStones: 5000, attrs: { dexterity: 30 },
    health: 100, maxHealth: 200, qi: 100, maxQi: 1000, energy: 100, maxEnergy: 100,
    mood: 80, karma: 0, notoriety: 0, tempering: 0, lifeSkills: {}, flags: {}
};
sandbox.XianXia = { DataManager: {
    getSpiritStones: () => STONES, addSpiritStones: n => { STONES += n; },
    deductSpiritStones: n => { if (STONES < n) return false; STONES -= n; return true; },
    getCopper: () => COPPER, addCopper: n => { COPPER += n; }, deductCopper: n => { if (COPPER < n) return false; COPPER -= n; return true; }
} };
sandbox.DataManager = sandbox.XianXia.DataManager;
const si = v => { const n = Math.floor(Number(v) || 0); return isFinite(n) ? n : 0; };
sandbox.RewardService = { apply(spec, ctx) {
    spec = spec || {};
    const p = sandbox.currentCharData;
    if (!p) return { success: false, reason: 'no_character' };
    const city = (ctx && ctx.city) || '';
    const rep = si(spec.cityReputation != null ? spec.cityReputation : spec.rep);
    const stones = si(spec.spiritStones != null ? spec.spiritStones : spec.stones);
    const copper = si(spec.copper != null ? spec.copper : spec.gold);
    const exp = si(spec.exp);
    const qi = si(spec.qiRecovery != null ? spec.qiRecovery : spec.qi);
    const energy = si(spec.energy);
    const health = si(spec.health);
    const mood = si(spec.mood);
    const karma = si(spec.karma);
    const noto = si(spec.notoriety != null ? spec.notoriety : spec.noto);
    if (qi < 0 && (Number(p.qi) || 0) + qi < 0) return { success: false, reason: 'qi' };
    if (energy < 0 && (Number(p.energy) || 0) + energy < 0) return { success: false, reason: 'energy' };
    if (health < 0 && (Number(p.health) || 0) + health < 0) return { success: false, reason: 'health' };
    if (stones < 0 && STONES < -stones) return { success: false, reason: 'spiritStones' };
    if (copper < 0 && COPPER < -copper) return { success: false, reason: 'copper' };
    STONES += stones; COPPER += copper;
    if (exp) p.tempering = Math.max(0, (Number(p.tempering) || 0) + exp);
    if (qi) p.qi = Math.max(0, Math.min(Number(p.maxQi) || 1000, (Number(p.qi) || 0) + qi));
    if (energy) p.energy = Math.max(0, Math.min(Number(p.maxEnergy) || 100, (Number(p.energy) || 0) + energy));
    if (health) p.health = Math.max(0, Math.min(Number(p.maxHealth) || Math.max(1, Number(p.health) || 1), (Number(p.health) || 0) + health));
    if (mood) p.mood = Math.max(0, Math.min(100, (Number(p.mood) != null ? Number(p.mood) : 80) + mood));
    if (karma) p.karma = Math.max(-100, Math.min(100, (Number(p.karma) || 0) + karma));
    if (noto) p.notoriety = (Number(p.notoriety) || 0) + noto;
    if (rep && city) sandbox.addReputation(city, rep);
    const ls = spec.lifeSkill;
    if (ls) { const arr = Array.isArray(ls) ? ls : [ls]; p.lifeSkills = p.lifeSkills || {};
        arr.forEach(one => { if (one && one.name) p.lifeSkills[one.name] = (Number(p.lifeSkills[one.name]) || 0) + si(one.exp != null ? one.exp : 1); }); }
    return { success: true, messages: spec.msg ? [spec.msg] : [] };
} };
sandbox.StateRegistry = { register: (name, mod) => { reg[name] = mod; } };
// NPC 桩（扒窃/takeItems 用）
const NPCS = {};
sandbox.npcManager = { getNPC: id => NPCS[id] || null };
sandbox.npcNotCoLocated = () => false;
sandbox.itemById = {};
sandbox.giveWithReceipt = null;
sandbox.addItem = () => 0;   // 行囊接不住——顺货那支静默留原处
// 战斗桩
sandbox.currentBattle = null;
sandbox.startBattle = enemy => { sandbox.currentBattle = Object.assign({}, enemy); battleLog.push(sandbox.currentBattle); return sandbox.currentBattle; };
// 情报三源桩
sandbox.getGossipInfo = () => '丐帮消息·TEST';
sandbox.MarketDynamic = { CITIES: ['中州'], CATEGORIES: ['丹药'], priceMul: () => 1.5 };
sandbox.getCitizenGossip = () => [{ text: '街坊闲话TEST' }];
sandbox.BeggarAlms = { goodwill: () => 0 };

const context = vm.createContext(sandbox);
function run(rel) { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), context, { filename: rel }); }
const CD = () => sandbox.currentCharData;

console.log('== v27.4 黑道与断案批回归 ==');
run('js/npcs/npc-crime.js');
run('js/npcs/crime-works.js');
run('js/city-facilities/city-jobs.js');
run('js/city-facilities/case-system.js');
const NC = sandbox.NpcCrime;
const CW = sandbox.CrimeWorks;
const CJ = sandbox.CityJobs;
const CS = sandbox.CaseSystem;

ok('四个模块全部就位', !!NC && !!CW && !!CJ && !!CS);
ok('StateRegistry 两本新账挂上（crimeWorks/caseSystem）', !!reg['crimeWorks'] && !!reg['caseSystem']);
ok('黑道日账订阅挂上（落草/暗桩/传票自动结）', newDaySubs.length >= 3);

// ---------- 0. coolHeat 减热度正门（CaseSystem 官司胜诉用） ----------
NC.addHeat(35, '测试罪行');
ok('热度35进通缉（悬赏牌挂上）', NC.wanted() === true && NC.bounty() > 0);
NC.coolHeat(3, '测试减热');
ok('coolHeat 减热度（35→32，仍在通缉线上）', NC.heat() === 32 && NC.wanted() === true);
NC.coolHeat(27, '测试销案');
ok('冷到线下自动销案揭画影（热度5、赏金清、脸出册）', NC.heat() === 5 && NC.wanted() === false && NC.bounty() === 0 && NC.faceKnown() === false);
reg['crimeLedger'].reset();

// ---------- 1. 扒窃（67） ----------
NPCS['npc1'] = { name: '张三', isDead: false, relationship: { affection: 0, fear: 0 }, inventory: { items: [] }, changeAffection() {}, recordPlayerAction() {} };
NPCS['npcFriend'] = { name: '挚友', isDead: false, relationship: { affection: 90 }, inventory: { items: [] }, changeAffection() {}, recordPlayerAction() {} };
LOC = ''; CD().location = '';
ok('人在野外摸不了包', CW.pick('npc1') === false);
LOC = '甲城'; CD().location = '甲城';
ok('亲近的人下不去手（好感90）', CW.pick('npcFriend') === false);
CD().energy = 2;
ok('精力不够被拦', CW.pick('npc1') === false);
CD().energy = 100;
// 成功率 = 0.40 + 灵巧30*0.003 + 境界1档*0.04 = 0.53
ok('成功率明账（灵巧+境界，0.53）', Math.abs(CW.pickRate() - 0.53) < 1e-9, 'rate=' + CW.pickRate());
const copperPre = COPPER, karmaPre = CD().karma;
patchRng([0.01, 0.5, 0.99]);   // 得手；铜 20+floor(0.5*41)=40；不顺货
ok('扒窃得手：铜钱入袖、无人察觉热度不涨', CW.pick('npc1') === true && COPPER === copperPre + 40 && NC.heat() === 0);
restoreRng();
ok('业障-1、精力-5', CD().karma === karmaPre - 1 && CD().energy === 95);
ok('同一人一日一次（再摸被拦）', CW.pick('npc1') === false);
// 失手：脸进画影册
NPCS['npc2'] = { name: '李四', isDead: false, relationship: { affection: 0 }, inventory: { items: [] }, changeAffection() {}, recordPlayerAction() {} };
patchRng([0.99]);
CW.pick('npc2');
restoreRng();
ok('失手被当场按住：热度+2、脸进画影册、恶名+1', NC.heat() === 2 && NC.faceKnown() === true && CD().notoriety === 1);
ok('一日三回封顶', (() => {
    NPCS['npc3'] = { name: '王五', isDead: false, relationship: { affection: 0 }, inventory: { items: [] }, changeAffection() {}, recordPlayerAction() {} };
    patchRng([0.99]); const r1 = CW.pick('npc3'); restoreRng();
    NPCS['npc4'] = { name: '赵六', isDead: false, relationship: { affection: 0 }, inventory: { items: [] }, changeAffection() {}, recordPlayerAction() {} };
    const r2 = CW.pick('npc4');
    return r1 === true && r2 === false;
})());
reg['crimeLedger'].reset();
DAY = 101;

// ---------- 2. 盗墓（68）三路 + 守墓傀战结 ----------
CD().energy = 100;
const stonesPreDig = STONES;
patchRng([0.1, 0.5]);   // 五成起货；冥器 15+floor(0.5*31)=30
ok('盗墓起货：+30灵石、损阴德账落齐', CW.digGrave() === true && STONES === stonesPreDig + 30 && CD().karma <= -3 && NC.heat() === 2);
restoreRng();
ok('一日一夜（同日再刨被拦）', CW.digGrave() === false);
DAY = 102;
patchRng([0.6]);   // 空坟
const stonesPreEmpty = STONES;
ok('空坟白刨：只折精力', CW.digGrave() === true && STONES === stonesPreEmpty);
restoreRng();
DAY = 103; CD().energy = 100;
patchRng([0.95, 0.1, 0.5]);   // 惊动→守墓傀真仗；傀战利 25+floor(0.5*26)=38
battleLog.length = 0;
CW.digGrave();
restoreRng();
ok('惊动守墓傀：真仗拉起（_isTombFight 旗+战利明账）', battleLog.length === 1 && sandbox.currentBattle && sandbox.currentBattle._isTombFight === true && sandbox.currentBattle._tombLoot === 38);
const stonesPreTomb = STONES;
CW.settleTombFight(true);
ok('打翻守墓傀：冥器38灵石入袋', STONES === stonesPreTomb + 38);
sandbox.currentBattle = null;
DAY = 104; CD().energy = 100;
reg['crimeLedger'].reset();
patchRng([0.95, 0.9]);   // 惊动→火把照脸
CW.digGrave();
restoreRng();
ok('被守墓人拿住：热度+4、脸进画影册', NC.heat() === 4 && NC.faceKnown() === true);
reg['crimeLedger'].reset();
DAY = 105;

// ---------- 3. 伪造盐引（69） ----------
CD().lifeSkills = {};
ok('锻造不够亮锁（要30）', CW.forgeSalt() === false);
CD().lifeSkills = { '锻造': 40 };   // 仿成率 0.35+0.24=0.59
ok('仿成率明账（锻造40→59%）', Math.abs(CW.fsRate() - 0.59) < 1e-9);
CD().energy = 100;
patchRng([0.99]);
const forgePre = CD().lifeSkills['锻造'];
ok('仿砸了：白忙一夜、手艺磨一分', CW.forgeSalt() === true && CD().lifeSkills['锻造'] === forgePre + 1);
restoreRng();
ok('一日一票（同日再仿被拦）', CW.forgeSalt() === false);
DAY = 106; CD().energy = 100;
const stonesPreFs = STONES;
patchRng([0.1, 0.99]);   // 仿成+巡查不中
ok('假盐引出货：+70灵石', CW.forgeSalt() === true && STONES === stonesPreFs + 70);
restoreRng();
DAY = 107; CD().energy = 100;
const stonesPreBust = STONES;
patchRng([0.1, 0.01]);   // 仿成+盐课司查验
CW.forgeSalt();
restoreRng();
ok('私盐大案：罚50、热度+8、脸进画影册', STONES === stonesPreBust - 50 && NC.heat() >= 8 && NC.faceKnown() === true);
reg['crimeLedger'].reset();
DAY = 108;

// ---------- 4. 伪造路引（72） ----------
CD().energy = 100; CD().lifeSkills = { '口才': 50 };   // 成算 0.5+0.2=0.7
const stonesPreFp = STONES;
patchRng([0.1, 0.5]);   // 成；出货 25+floor(0.5*16)=33
ok('假路引出货：+33灵石', CW.forgePass() === true && STONES === stonesPreFp + 33);
restoreRng();
DAY = 109; CD().energy = 100;
patchRng([0.99]);
const repPreFp = sandbox.getReputationValue('甲城');
ok('被买主识破：热度+2、声望-3', CW.forgePass() === true && NC.heat() === 2 && sandbox.getReputationValue('甲城') === repPreFp - 3);
restoreRng();
reg['crimeLedger'].reset();
DAY = 110;

// ---------- 5. 私铸假灵石（76，抄家级） ----------
CD().lifeSkills = { '锻造': 40 };
ok('锻造不够50亮锁', CW.forgeFake() === false);
CD().lifeSkills = { '锻造': 55 };   // 过手率 0.30+0.275=0.575
STONES = 10; CD().energy = 100;
ok('药料钱不足整笔不成（20灵石先付）', CW.forgeFake() === false && STONES === 10);
STONES = 500;
const karmaPreFf = CD().karma;
patchRng([0.1]);
ok('假灵石过手：+80回笼（药料已扣，净+60）、业障-2', CW.forgeFake() === true && STONES === 500 - 20 + 80 && CD().karma === karmaPreFf - 2);
restoreRng();
DAY = 111; CD().energy = 100;
STONES = 60;
patchRng([0.99]);
CW.forgeFake();
restoreRng();
ok('败露抄家级：药料20+尽力赔付罚银（60−20=40全填进去）、热度+15、脸进画影册', STONES === 0 && NC.heat() >= 15 && NC.faceKnown() === true);
ok('罚银交不齐罪加一等（恶名8+5）', CD().notoriety >= 13);
reg['crimeLedger'].reset();
STONES = 500;
DAY = 112;

// ---------- 6. 夹带私货（70，城门联动） ----------
CD().energy = 100;
patchRng([0.5]);   // 脚钱 50+floor(0.5*41)=70
ok('接夹带的活：脚钱70明账、一票在手', CW.takeSmuggle() === true && CW.state().smuggle && CW.state().smuggle.pay === 70);
restoreRng();
ok('一票未了不接第二票', CW.takeSmuggle() === false);
CW.gateContraband('甲城');
ok('本城打转不算闯关（没掷骰）', CW.state().smuggle && CW.state().smuggle.gateRoll === 0);
patchRng([0.99]);   // 过乙城门：搜查不中
CW.gateContraband('乙城');
restoreRng();
ok('过关搜了一回没搜出（这一票的城门关过了）', CW.state().smuggle.gateRoll === 1);
CW.gateContraband('乙城');
ok('过关条只掷一回（不重复搜）', CW.state().smuggle.gateRoll === 1 && NC.heat() === 0);
LOC = '乙城'; CD().location = '乙城';
ok('本城交不了货（原路退回算违约）', (() => { LOC = '甲城'; CD().location = '甲城'; return CW.deliverSmuggle() === false; })());
LOC = '乙城'; CD().location = '乙城';
const stonesPreDeliver = STONES;
ok('落地柜上交货：+70灵石、账清', CW.deliverSmuggle() === true && STONES === stonesPreDeliver + 70 && CW.state().smuggle === null);
// 被搜出
patchRng([0.5]); CW.takeSmuggle(); restoreRng();
const stonesPreBust2 = STONES;
patchRng([0.01]);   // 搜查命中
CW.gateContraband('甲城');
restoreRng();
ok('城门搜出夹带：货没收、罚30、热度+5、脸进画影册、票销', CW.state().smuggle === null && STONES === stonesPreBust2 - 30 && NC.heat() >= 5 && NC.faceKnown() === true);
reg['crimeLedger'].reset();
LOC = '甲城'; CD().location = '甲城';
DAY = 113;

// ---------- 7. 落草（71，七日多日程） ----------
NC.addHeat(25, '测试高热度');
ok('热度≥20落不了草（锁就亮锁）', CW.goBandit() === false);
NC.coolHeat(25, '测试冷下来');
ok('风头冷了才上得了山', CW.goBandit() === true && CW.state().bandit && CW.state().bandit.end === DAY + 7);
ok('山上不落第二伙', CW.goBandit() === false);
// 第1日：保护费 8+floor(0.5*13)=14
DAY = 114;
patchRng([0.5]);
CW.dailyTick();
restoreRng();
ok('落草日结：保护费+14（自动入账零按钮）、热度+2', CW.state().bandit.take === 14 && NC.heat() === 2);
// 第3日起官兵进剿：胜
DAY = 116;
patchRng([0.5, 0.01, 0.01]);   // 保护费；进剿骰中；打赢（winP=0.4+0.1=0.5，0.01<0.5）
CW.dailyTick();
restoreRng();
ok('官兵进剿打退：搜出军资+15（take 14+14+15=43）', CW.state().bandit.take === 43 && CW.state().bandit.raidWin === 1);
// 进剿失利：take 折半
DAY = 117;
const healthPreRaid = CD().health;
patchRng([0.5, 0.01, 0.99]);   // 保护费14；进剿中；打输
CW.dailyTick();
restoreRng();
ok('进剿失利：保护费折半、气血-30', CW.state().bandit.take === (43 + 14) - Math.floor((43 + 14) / 2) && CD().health === healthPreRaid - 30 && CW.state().bandit.raidLose === 1);
// 提前下山
const stonesPreDown = STONES;
const takeNow = CW.state().bandit.take;
ok('提前下山：拿上已收的保护费走人', CW.comeDown(true) === true && STONES === stonesPreDown + takeNow && CW.state().bandit === null);
ok('落草的业障与声望账落齐（业障-5）', CD().karma <= -5);
reg['crimeLedger'].reset();
DAY = 118;

// ---------- 8. 卖情报（73，getGossipInfo 复活）+ 安暗桩（74） ----------
CD().energy = 100; CD().lifeSkills = {};
const stonesPreIntel = STONES;
patchRng([0.5, 0.5]);   // 情报源掷 0.5→行情源；报酬 8+floor(0.5*13)=14
CW.sellIntel();
restoreRng();
ok('卖情报（真行情源）：+14灵石、精力-10', STONES === stonesPreIntel + 14 && CD().energy === 90);
ok('一日一条（同日再卖被拦）', CW.sellIntel() === false);
DAY = 119; CD().energy = 100;
sandbox.BeggarAlms = { goodwill: () => 20 };
const stonesPreGb = STONES;
patchRng([0.1, 0.5]);   // 0.1<0.34→丐帮消息网源（getGossipInfo 复活正门）；14×1.2≈17
CW.sellIntel();
restoreRng();
ok('丐帮消息网有真买主（getGossipInfo 复活）+缘分加成两成', STONES === stonesPreGb + 17, 'gain=' + (STONES - stonesPreGb));
sandbox.BeggarAlms = { goodwill: () => 0 };
DAY = 120;
const stonesPreSpy = STONES;
ok('安暗桩：安家费40当场扣', CW.plantSpy() === true && STONES === stonesPreSpy - 40);
ok('一城一桩（再安被拦）', CW.plantSpy() === false);
DAY = 121;
patchRng([0.5]);   // 暴露骰不中
CW.dailyTick();
restoreRng();
ok('人在桩城：暗桩每日递真行情（不暴露则桩还在）', !!CW.state().spies['甲城']);
patchRng([0.01]);   // 暴露
CW.dailyTick();
restoreRng();
ok('暗桩暴露：线断、热度+1', !CW.state().spies['甲城'] && NC.heat() === 1);
reg['crimeLedger'].reset();
DAY = 122;

// ---------- 9. 黑道账读档归一化 ----------
reg['crimeWorks'].import({ digs: -5, forgeSalt: 'x', smuggle: { from: '', pay: 'y' }, bandit: { start: 5, end: 3 }, spies: { '甲城': 'z', '乙城': 88 } });
let cws = CW.state();
ok('坏账不进门（负日戳/坏契/坏桩归一，真桩留下）', cws.digs === 0 && cws.forgeSalt === 0 && cws.smuggle === null && cws.bandit === null && !cws.spies['甲城'] && cws.spies['乙城'] === 88);
reg['crimeWorks'].reset();

// ---------- 10. 断案引擎：生成与捕快权限 ----------
ok('捕快岗在差事名册（司法堂）', !!CJ.JOBS.constable && CJ.JOBS.constable.building === 'court');
CD()._employ = null;
SEASON = 'spring';
patchRng([0.01, 0.5]);   // 生成骰中；案型骰 0.5→失窃案（春时无科场案）
const gen1 = CS.genCaseTick();
restoreRng();
ok('案件低频生成（失窃案、三名嫌疑人、真凶暗定）', !!gen1 && gen1.type === 'theft' && gen1.culprits.length === 3 && gen1.real >= 0 && gen1.real <= 2);
ok('隔三日一骰（同日再生成不中）', CS.genCaseTick() === null);
ok('没穿号衣翻不了案卷（锁就亮锁）', CS.examine(gen1.id) === false && CS.isConstable('甲城') === false);
CD()._employ = { job: 'constable', city: '甲城', signedDay: DAY, lastWorkDay: DAY - 1, shifts: 0 };
ok('上岗捕快：案卷权限开', CS.isConstable('甲城') === true);

// ---------- 11. 三步流程：验看（仵作）→ 问人 → 指认 ----------
CD().lifeSkills = { '医术': 45, '口才': 50, '学识': 40 };
CD().energy = 100;
const stonesPreEx = STONES;
ok('验看（仵作眼力）：必得证+验尸钱15', CS.examine(gen1.id) === true && gen1.clues === 1 && gen1.examined === 1 && STONES === stonesPreEx + 15);
ok('验看只有这一回', CS.examine(gen1.id) === false);
patchRng([0.1]);   // 问人成算 0.45+0.25=0.7
ok('走访问人：口供+1（两条证到手，真凶只剩一个）', CS.question(gen1.id) === true && gen1.clues === 2);
restoreRng();
ok('问人只有这一回', CS.question(gen1.id) === false);
const wrongIdx = gen1.ex[0];   // 被排除的人——指着他就是办砸
const rightP = CS.accuseP(gen1, gen1.real), wrongP = CS.accuseP(gen1, wrongIdx);
ok('指认成算明账（真凶95%封顶 vs 排除者低成算）', rightP > 0.7 && wrongP < 0.4, rightP + '/' + wrongP);
const stonesPreSolve = STONES, copperPreSolve = COPPER, repPreSolve = sandbox.getReputationValue('甲城');
deedLog.length = 0;
patchRng([0.01]);
ok('当堂指认真凶：案破', CS.accuse(gen1.id, gen1.real) === true && gen1.state === 'solved');
restoreRng();
ok('破案赏格落账（40灵石+功绩钱100铜+声望3+历练20）', STONES === stonesPreSolve + 40 && COPPER === copperPreSolve + 100 && sandbox.getReputationValue('甲城') === repPreSolve + 3 && CD().tempering >= 20);
ok('破案入传闻账', deedLog.some(d => d.mood === 'good'));
ok('画过押改不了口', CS.accuse(gen1.id, gen1.real) === false);

// ---------- 12. 办砸 + 冷案上浮 ----------
DAY += 3;
patchRng([0.01, 0.1]);   // 新案生成（murder roll 0.1<0.38）
const gen2 = CS.genCaseTick();
restoreRng();
ok('命案生成', !!gen2 && gen2.type === 'murder');
const repPreBotch = sandbox.getReputationValue('甲城');
patchRng([0.99]);
CS.accuse(gen2.id, gen2.ex[0]);   // 指被排除的人——必砸
restoreRng();
ok('指错人案子办砸：案卷标记、声望-3', gen2.state === 'botched' && sandbox.getReputationValue('甲城') === repPreBotch - 3);
// 冷案
DAY += 3;
patchRng([0.01, 0.99]);   // 秋闱外，0.99→失窃案
const gen3 = CS.genCaseTick();
restoreRng();
gen3.filedDay = DAY - 25;   // 二十日不破转冷案
ok('二十日不破转冷案', CS.isCold(gen3) === true);
const stonesPreCold = STONES, repPreCold = sandbox.getReputationValue('甲城');
patchRng([0.01]);
CS.accuse(gen3.id, gen3.real);
restoreRng();
ok('冷案赏格上浮五成（40→60）+声望加成', gen3.state === 'solved' && STONES === stonesPreCold + 60 && sandbox.getReputationValue('甲城') === repPreCold + 5);
// 科场案只秋闱出
SEASON = 'autumn';
DAY += 3;
patchRng([0.01, 0.1]);   // 秋闱 0.1<0.20 → 科场舞弊案（84）
const gen4 = CS.genCaseTick();
restoreRng();
ok('秋闱时节才有科场舞弊案（84）', !!gen4 && gen4.type === 'exam');
SEASON = 'spring';
// 案卷架轮换：架满销卷冷案腾位（案山不无限堆）
ok('案卷架上新案（gen5 上架）', (() => {
    DAY += 3;
    patchRng([0.01, 0.5]);
    const r = !!CS.genCaseTick();
    restoreRng();
    return r;
})());
DAY += 3;
ok('案卷架满、无冷案：不再报新案', CS.genCaseTick() === null);
ok('最老一桩已成冷案：销卷归档、新案照常报上来', (() => {
    const opens = CS.casesOf('甲城').filter(c => c.state === 'open');
    opens[0].filedDay = DAY - 25;   // 把最老一桩熬成冷案
    DAY += 3;
    patchRng([0.01, 0.5]);
    const gen6 = CS.genCaseTick();
    restoreRng();
    return opens[0].state === 'archived' && !!gen6 && gen6.state === 'open';
})());

// ---------- 13. 海捕牌缉逃（83，人人可揭、真仗） ----------
CD()._employ = null;   // 不当差也能揭海捕牌
const fugs = CS.fugitiveOf('甲城');
ok('海捕牌按周播种（1~2名逃犯、赏金明账）', fugs.length >= 1 && fugs.length <= 2 && fugs[0].bounty >= 50);
battleLog.length = 0;
ok('揭牌拉真仗（_isFugitiveHunt 旗+赏金随身）', CS.huntFug(0) === true && sandbox.currentBattle && sandbox.currentBattle._isFugitiveHunt === true && sandbox.currentBattle._fugBounty === fugs[0].bounty);
const stonesPreFug = STONES, repPreFug = sandbox.getReputationValue('甲城');
CS.settleFugitiveHunt(true);
ok('拿住逃犯：赏金当堂兑付+声望+2、这一号销牌', STONES === stonesPreFug + fugs[0].bounty && sandbox.getReputationValue('甲城') === repPreFug + 2 && CS.fugitiveOf('甲城').every(f => f.name !== fugs[0].name));
sandbox.currentBattle = null;
// 败走五日风头
const fugs2 = CS.fugitiveOf('甲城');
if (fugs2.length) {
    battleLog.length = 0;
    CS.huntFug(0);
    const qiPre = CD().qi;
    CS.settleFugitiveHunt(false);
    ok('没拿住：真气-15、TA躲五日风头（牌上空了）', CD().qi === qiPre - 15 && CS.fugitiveOf('甲城').length === fugs2.length - 1);
    sandbox.currentBattle = null;
} else {
    ok('没拿住：真气-15、TA躲五日风头（牌上空了）', true);   // 本周只播了一名且已拿获
}

// ---------- 14. 讼师（79）与告状（80） ----------
CD()._employ = { job: 'constable', city: '甲城', signedDay: DAY, lastWorkDay: DAY - 1, shifts: 0 };
ok('公门中人不得兼充讼师（利益回避锁）', CS.sueFor() === false);
CD()._employ = null;
CD().lifeSkills = { '学识': 10 };
ok('学识不够25当不了讼师（亮锁）', CS.sueFor() === false);
CD().lifeSkills = { '学识': 30, '口才': 40 };   // 胜诉率 0.40+0.12+0.12=0.64
CD().energy = 100;
const stonesPreLaw = STONES;
patchRng([0.1]);
ok('代讼胜诉：谢仪30+声望2', CS.sueFor() === true && STONES === stonesPreLaw + 30);
restoreRng();
ok('一日只接一位主顾', CS.sueFor() === false);
DAY += 1; CD().energy = 100;
const stonesPreSuit = STONES, moodPre = CD().mood;
patchRng([0.1]);   // 胜诉率 0.35+0.16+0.09=0.60
ok('递状告人胜诉：判赔净得20、心境+2', CS.fileSuit() === true && STONES === stonesPreSuit + 20 && CD().mood === Math.min(100, moodPre + 2));
restoreRng();
ok('一人一日一状', CS.fileSuit() === false);
DAY += 1;
const stonesPreLose = STONES;
patchRng([0.99]);
ok('状纸被驳：状纸费10打水漂', CS.fileSuit() === true && STONES === stonesPreLose - 10);
restoreRng();

// ---------- 15. 堂上传票（黑道账的连带后果） ----------
reg['crimeLedger'].reset();
DAY += 1;
CS.summonsTick();
ok('热度不足8没人敢告你（传票不来）', CS.state().summons === null);
NC.addHeat(10, '测试民愤');
patchRng([0.01]);
CS.summonsTick();
restoreRng();
ok('热度招来官司：传票落账+过堂弹窗（三路明账）', !!CS.state().summons && modals['__modal'] && modals['__modal'].title.indexOf('传票') >= 0);
STONES = 10;
ok('请讼师谢仪不足被拦（还能自辩/认罪）', CS.answerSummons('lawyer') === false);
STONES = 500;
const heatPreSelf = NC.heat();
patchRng([0.01]);   // 自辩胜诉率 0.30+max(口才40,学识30)*0.004=0.46
ok('自己上堂辩赢：热度-5（coolHeat 正门）', CS.answerSummons('self') === true && NC.heat() === heatPreSelf - 5 && CS.state().summons === null);
restoreRng();
// 认罪画押
DAY += 10;
NC.addHeat(10, '测试民愤');   // 辩赢那阵把热度降到了5，重新攒够传票线
patchRng([0.01]);
CS.summonsTick();
restoreRng();
const heatPrePlead = NC.heat(), stonesPrePlead = STONES;
const fineExpect = CS.summonsFine();
ok('认罪画押：罚银当场缴清、热度-8、脸不进画影册', CS.answerSummons('plead') === true && STONES === stonesPrePlead - fineExpect && NC.heat() === Math.max(0, heatPrePlead - 8) && NC.faceKnown() === false);
// 缺席定谳
DAY += 10;
NC.addHeat(5, '测试民愤');   // 认罪把热度减到了7，重新过线
patchRng([0.01]);
CS.summonsTick();   // nudges=1
restoreRng();
ok('传票再催（抗传画卯计数）', CS.state().summons && CS.state().summons.nudges === 1);
CS.summonsTick();   // 2
CS.summonsTick();   // 3
ok('催满三次未到庭', CS.state().summons.nudges === 3);
const stonesPreDefault = STONES;
CS.summonsTick();   // 4 > 3 → 缺席定谳
ok('缺席定谳：罚银照缴、传票销', CS.state().summons === null && STONES < stonesPreDefault);
reg['crimeLedger'].reset();

// ---------- 16. 断案账读档归一化 ----------
reg['caseSystem'].import({
    cases: [null, { city: 5 }, { city: '甲城', type: '瞎编的案', culprits: ['a', 'b', 'c'], real: 0 },
        { city: '甲城', type: 'theft', filedDay: 10, culprits: ['甲', '乙', '丙'], real: 5, clues: 99, state: '瞎编' },
        { city: '乙城', type: 'murder', filedDay: 12, culprits: ['丁', '戊', '己'], real: 1, clues: 99, state: '瞎编', ex: 'bad' },
        { id: 'case_ok', city: '乙城', type: 'murder', filedDay: 20, brief: 'b', culprits: ['A', 'B', 'C'], real: 1, ex: [2, 0], clues: 2, examined: 1, state: 'open' }],
    caught: { bad: 'x', ok: 5 },
    summons: { filedDay: 'y' }
});
let css = CS.state();
ok('坏案卷不进门（假城/假案型/坏真凶剔除，坏证数坏状态夹板，真卷留下）',
    css.cases.length === 2 && css.cases[0].clues === 9 && css.cases[0].state === 'open' && Array.isArray(css.cases[0].ex) && css.cases[0].ex.indexOf(1) < 0 && css.cases[1].id === 'case_ok');
ok('坏拿获账归一（非数剔除）', !css.caught.bad && css.caught.ok === 5);
ok('坏传票不进门', css.summons === null);
reg['caseSystem'].reset();
ok('转世清账：案卷架清空', CS.state().cases.length === 0);

restoreRng();
console.log('\n== 结果：' + pass + ' 通过 / ' + fail + ' 失败 ==');
process.exit(fail ? 1 : 0);
