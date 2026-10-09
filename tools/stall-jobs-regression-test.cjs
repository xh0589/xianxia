// ==================== v27.3 手艺与街面批回归测试 ====================
// 覆盖：手艺摊引擎（十一门/门槛锁就亮锁/一日一摊/客流明账×单价/客人事件胜负两路/书院讲学/拆穿假神仙/读档归一化）·
//       差事名册扩八行（岗跟建筑走/反转位外快红包引擎骰）·
//       大差事（投军远征多日一次性+带伤/护送贵人遭截胜负/签一次/回城账不蒸发/读档归一化）。
// 运行：node tools/stall-jobs-regression-test.cjs
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

// ---------- 骰子（引擎随机源正门：__scenarioRng 不在位→退 Math.random） ----------
const origRandom = Math.random;
let rngQueue = null;
function patchRng(q) { rngQueue = q.slice(); Math.random = () => (rngQueue && rngQueue.length ? rngQueue.shift() : 0.5); }
function restoreRng() { rngQueue = null; Math.random = origRandom; }

// ---------- 宽容桩 ----------
let DAY = 100;
let STONES = 5000;
let COPPER = 1000;
let LOC = '甲城';
let RS_FAIL = false;
const REP = {};               // 城望账（pkCity → value）
const pkCity = s => String(s == null ? '' : s).replace(/\s+/g, '');
const timeLog = [];
const deedLog = [];
const modals = {};
let BUILDINGS = [];
const KNOWN_CITIES = { '甲城': true, '乙城': true };

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
sandbox.getRealmIndex = r => (r === '筑基' ? 1 : r === '金丹' ? 2 : r === '元婴' ? 3 : 0);
sandbox.playerPushDeed = (mood, text) => deedLog.push({ mood, text: String(text) });
sandbox.addReputation = (city, val) => { const k = pkCity(city); REP[k] = (REP[k] || 0) + (Number(val) || 0); };
sandbox.getReputationValue = city => REP[pkCity(city)] || 0;
sandbox.setReputation = (city, val) => { REP[pkCity(city)] = Number(val) || 0; };
sandbox.growLifeSkill = (name, exp) => {
    const p = sandbox.currentCharData; if (!p) return;
    p.lifeSkills = p.lifeSkills || {};
    p.lifeSkills[name] = Math.min(100, (Number(p.lifeSkills[name]) || 0) + (Number(exp) || 1));
};
sandbox.locationSystem = {
    getCurrentLocation: () => LOC,
    getCityData: c => (KNOWN_CITIES[c] ? { buildings: BUILDINGS } : null)
};
sandbox.timeSystem = {
    onNewDaySubscribe: () => {},
    advanceTime: (m, label) => timeLog.push({ m, label }),
    getAbsoluteDay: () => DAY,
    gameTime: { currentDay: DAY }
};
sandbox.currentCharData = {
    location: '甲城', realm: '炼气', spiritStones: 5000,
    health: 100, maxHealth: 200, qi: 100, maxQi: 1000, energy: 100, maxEnergy: 100,
    mood: 80, karma: 0, notoriety: 0, tempering: 0, lifeSkills: {}, flags: {}
};
sandbox.XianXia = { DataManager: {
    getSpiritStones: () => STONES, addSpiritStones: n => { STONES += n; },
    deductSpiritStones: n => { if (STONES < n) return false; STONES -= n; return true; },
    getCopper: () => COPPER, addCopper: n => { COPPER += n; }, deductCopper: n => { if (COPPER < n) return false; COPPER -= n; return true; }
} };
sandbox.DataManager = sandbox.XianXia.DataManager;

// RewardService 桩：一笔事务——先验非经济代价（真气/精力/生命不足整笔不成），再验经济（灵石/铜钱不足整笔不成）
const si = v => { const n = Math.floor(Number(v) || 0); return isFinite(n) ? n : 0; };
sandbox.RewardService = { apply(spec, ctx) {
    if (RS_FAIL) return { success: false, reason: 'forced' };
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

const context = vm.createContext(sandbox);
function run(rel) { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), context, { filename: rel }); }
const CD = () => sandbox.currentCharData;

// ============================================================
console.log('== v27.3-A 手艺摊引擎（service-stall.js）==');
run('js/city-facilities/service-stall.js');
const SS = sandbox.ServiceStall;
ok('手艺摊十一门齐全（含篆刻/捉鬼/测灵根）', SS.STALLS.length === 11 && SS.STALLS.some(s => s.key === 'seal') && SS.STALLS.some(s => s.key === 'ghost') && SS.STALLS.some(s => s.key === 'root'));
ok('导出口齐全', typeof SS.pitch === 'function' && typeof SS.lecture === 'function' && typeof SS.fakexian === 'function' && typeof SS.openFakexian === 'function');

// 1. stallOk：城里有街面才支得起摊
BUILDINGS = ['market'];
ok('城里有街面→支得起摊', SS.stallOk('甲城') === true);
ok('荒山野岭→支不起摊', SS.stallOk('荒野') === false);

// 2. 门槛锁就亮锁（gateFail）
CD().lifeSkills = {};
CD().realm = '炼气';
const doctor = SS.STALLS.filter(s => s.key === 'doctor')[0];
const ghost = SS.STALLS.filter(s => s.key === 'ghost')[0];
const fengshui = SS.STALLS.filter(s => s.key === 'fengshui')[0];
ok('医术不够→行医摊亮锁写原因', SS.gateFail(doctor) && SS.gateFail(doctor).indexOf('医术') >= 0);
CD().lifeSkills['医术'] = 40;
ok('医术够了→行医摊开锁', SS.gateFail(doctor) === null);
ok('炼气压不住金丹场→捉鬼摊亮锁（须金丹）', SS.gateFail(ghost) && SS.gateFail(ghost).indexOf('金丹') >= 0);
CD().realm = '金丹';
ok('金丹修为→捉鬼摊开锁', SS.gateFail(ghost) === null);
CD().realm = '炼气';

// 3. 客流明账（手艺×城望，封顶6）
CD().lifeSkills = { '学识': 40 };
REP[pkCity('甲城')] = 5000;   // floor(5000/2500)=2
ok('客流保底=手艺+城望（学识40+城望5000→1+2+2=5）', SS.customerBase(fengshui) === 5);
ok('客流区间明账（5~6，骰子加客0~2封顶6）', SS.customerRange(fengshui) === '5~6');
CD().lifeSkills = { '学识': 100 };
REP[pkCity('甲城')] = 99999;
ok('客流封顶6（摊子就巴掌大）', SS.customerBase(fengshui) === 6);

// 4. 出摊闸门
CD().location = ''; LOC = '';
ok('人在野外→支不起摊（先进城）', SS.pitch('fengshui') === false);
CD().location = '甲城'; LOC = '甲城';
CD().lifeSkills = {};
ok('手艺不够→出摊被拦', SS.pitch('doctor') === false);
CD().lifeSkills = { '医术': 40 };
const dayBak = DAY; DAY = 0;
ok('天上没钟→街面不开市', SS.pitch('doctor') === false);
DAY = dayBak;
CD().energy = 5;
ok('精力不够支摊被拦', SS.pitch('doctor') === false);
CD().energy = 100;

// 5. 出摊成功：客流×单价落袋、精力扣、时辰走、日戳落、手艺长进
REP[pkCity('甲城')] = 0;
CD().lifeSkills = { '医术': 40 };   // base = 1+2+0 = 3
const copperPre = COPPER, energyPre = CD().energy;
patchRng([0.99, 0.99]);   // 客流骰 floor(0.99*3)=2 → 5 位客；事件骰 0.99>=0.12 不触发
const pitchOk = SS.pitch('doctor');
restoreRng();
ok('出摊成功：5位客×12铜=60文落袋', pitchOk === true && COPPER === copperPre + 60, 'COPPER=' + COPPER + ' 期望' + (copperPre + 60));
ok('精力照扣（-15）', CD().energy === energyPre - 15);
ok('一日一摊日戳落账', CD()._stall && CD()._stall.lastDay === DAY);
ok('时辰如实走账（出摊·走方行医）', timeLog.some(t => t.label === '出摊·走方行医'));
ok('手艺长进益（医术+1）', CD().lifeSkills['医术'] === 41);

// 6. 一日一摊：同日再支（哪怕换门手艺）被拦
CD().lifeSkills['学识'] = 40;
const copperPre2 = COPPER;
ok('今日已出摊→换门手艺也被拦（一条街认一张摊布）', SS.pitch('fengshui') === false && COPPER === copperPre2);
ok('pitchedToday 如实回报', SS.pitchedToday() === true);

// 7. 客人事件（12%一骰）：胜路
DAY += 1;
CD()._stall = { lastDay: 0 };
CD().lifeSkills = { '学识': 40 };   // fengshui base=3
const copperPreEv = COPPER, repPreEv = sandbox.getReputationValue('甲城');
patchRng([0.5, 0.01, 0.01]);   // 客流骰 floor(0.5*3)=1→4位客(40铜)；事件骰0.01<0.12触发；胜负骰0.01<winP→胜
SS.pitch('fengshui');
restoreRng();
ok('客人事件胜路：摊钱+事件谢仪一并落账（40铜+40铜）', COPPER === copperPreEv + 40 + 40, 'COPPER=' + COPPER);
ok('客人事件胜路：城望落账（+3）', sandbox.getReputationValue('甲城') === repPreEv + 3);

// 8. 客人事件：败路（城望受损）
DAY += 1; CD()._stall = { lastDay: 0 };
CD().lifeSkills = { '学识': 40 };
const repPreLose = sandbox.getReputationValue('甲城');
patchRng([0.5, 0.01, 0.99]);   // 事件触发；胜负骰0.99>=winP→败
SS.pitch('fengshui');
restoreRng();
ok('客人事件败路：断错向城望-1', sandbox.getReputationValue('甲城') === repPreLose - 1);

// 9. 客人事件胜路带功德（测灵根→引荐孩童，deed:good）
DAY += 1; CD()._stall = { lastDay: 0 };
CD().realm = '筑基'; CD().lifeSkills = {};   // root 无手艺门槛、须筑基
deedLog.length = 0;
patchRng([0.5, 0.01, 0.01]);   // 事件触发并胜
SS.pitch('root');
restoreRng();
ok('测灵根胜路：做下好事入传闻账（deed good）', deedLog.some(d => d.mood === 'good'));
CD().realm = '炼气';

// 10. 读档归一化：坏日戳夹板
CD()._stall = { lastDay: -7 };
SS.pitchedToday();
ok('坏日戳归一（负数夹回0）', CD()._stall.lastDay === 0);
CD()._stallOnce = { lecture: -3, fakexian: 'x', 瞎编的: 9 };
SS.open();
ok('坏一次性账归一（负数/非数夹回，真键留）', CD()._stallOnce.lecture === 0);

// 11. 书院讲学（学识≥60、一生一回）
CD()._stallOnce = {};
CD().lifeSkills = { '学识': 30 };
ok('学识不够→讲台登不上', SS.lecture() === false);
CD().lifeSkills = { '学识': 70 }; CD().energy = 100;
const copperPreLec = COPPER, repPreLec = sandbox.getReputationValue('甲城');
deedLog.length = 0;
ok('书院讲学成账：束脩300铜+城望15+学识长进', SS.lecture() === true && COPPER === copperPreLec + 300 && sandbox.getReputationValue('甲城') === repPreLec + 15);
ok('讲学入传闻账', deedLog.some(d => d.mood === 'good'));
ok('一生一回（再讲被拦）', SS.lecture() === false && CD()._stallOnce.lecture > 0);

// 12. 拆穿假神仙（学识或口才≥40、胜败两路、走开也算唱完）
CD()._stallOnce = {};
CD().lifeSkills = { '学识': 10, '口才': 10 };
ok('肚里没货→拆不了台', SS.fakexian('expose') === false);
ok('假神仙弹窗开得出（明账成功率）', SS.openFakexian() === true && modals['__modal'] && modals['__modal'].title.indexOf('假神仙') >= 0 && modals['__modal'].html.indexOf('当众拆穿') >= 0);
CD().lifeSkills = { '口才': 60 };   // mouth=60, p=min(0.85,0.35+0.3)=0.65
const repPreFake = sandbox.getReputationValue('甲城'), copperPreFake = COPPER;
patchRng([0.01]);   // 必胜
deedLog.length = 0;
SS.fakexian('expose');
restoreRng();
ok('拆穿成功：苦主谢礼150铜+城望12+入传闻', sandbox.getReputationValue('甲城') === repPreFake + 12 && COPPER === copperPreFake + 150 && deedLog.some(d => d.mood === 'good'));
ok('一生一回（那出戏唱完了）', CD()._stallOnce.fakexian > 0 && SS.fakexian('expose') === false);
// 走开路线（另起一份账）
CD()._stallOnce = {};
ok('不趟浑水→也算唱完（落账、不再来）', SS.fakexian('walk') === true && CD()._stallOnce.fakexian > 0);
// 败路
CD()._stallOnce = {};
CD().lifeSkills = { '学识': 50 };
const repPreFakeLose = sandbox.getReputationValue('甲城');
patchRng([0.99]);   // 必败
SS.fakexian('expose');
restoreRng();
ok('拆台被倒打一耙：城望-4', sandbox.getReputationValue('甲城') === repPreFakeLose - 4);

// ============================================================
console.log('== v27.3-B 差事名册扩八行 + 反转位外快（city-jobs.js）==');
run('js/city-facilities/city-jobs.js');
const CJ = sandbox.CityJobs;
ok('八行新差事齐全', ['dock_hand', 'ferryman', 'pawn_appraiser', 'street_crier', 'guide', 'jailer', 'house_steward', 'gate_guard'].every(k => !!CJ.JOBS[k]));
ok('岗跟着城里实有建筑走（一个键不添）', CJ.JOBS.dock_hand.building === 'salt_iron_office' && CJ.JOBS.ferryman.building === 'granary' && CJ.JOBS.pawn_appraiser.building === 'pawn_shop' && CJ.JOBS.jailer.building === 'court' && CJ.JOBS.gate_guard.building === 'tax_bureau');
ok('反转位带外快红包（狱卒/城门卒）', !!CJ.JOBS.jailer.perk && CJ.JOBS.jailer.perk.id === 'tips' && !!CJ.JOBS.gate_guard.perk && CJ.JOBS.gate_guard.perk.id === 'seize');
ok('大差事两件齐全（投军/护送贵人）', !!CJ.GIGS.enlist && CJ.GIGS.enlist.days === 7 && !!CJ.GIGS.vip && CJ.GIGS.vip.days === 3);
ok('导出口补齐（signGig/settleGigs/gigsHere）', typeof CJ.signGig === 'function' && typeof CJ.settleGigs === 'function' && typeof CJ.gigsHere === 'function');

// 1. 应募上岗 + 反转位外快（狱卒：工钱定数 + 引擎骰红包）
CD()._employ = null; CD()._gigs = {};
BUILDINGS = ['court', 'bounty_hall', 'escort_office'];
CD().location = '甲城'; LOC = '甲城'; CD().energy = 100;
ok('应募狱卒成功', CJ.apply('jailer') === true && CD()._employ.job === 'jailer');
const copperPreWork = COPPER;
patchRng([0.1, 0.5]);   // 红包骰0.1<0.4触发；tip=10+floor(0.5*21)=20
CJ.work();
restoreRng();
ok('上工领钱：工钱40（定数）+ 外快红包20 = 60铜', COPPER === copperPreWork + 60, 'COPPER=' + COPPER + ' 期望' + (copperPreWork + 60));
ok('外快是引擎骰、工钱仍定数（红包不中则只发工钱）', (() => {
    DAY += 1; const c2 = COPPER; patchRng([0.99]); CJ.work(); restoreRng(); return COPPER === c2 + 40;
})());

// 2. 大差事闸门
CD()._gigs = {};
BUILDINGS = ['market'];   // 城里没有募兵处/镖局
ok('这地界没门脸→签不了投军', CJ.signGig('enlist') === false);
BUILDINGS = ['bounty_hall', 'escort_office'];
const dayBak2 = DAY; DAY = 0;
ok('天上没钟→契上落不了日子', CJ.signGig('enlist') === false);
DAY = dayBak2;
ok('签投军成功：落账回城日（+7）', CJ.signGig('enlist') === true && CD()._gigs.enlist.returnDay === DAY + 7);
ok('一生一回（再签被拦）', CJ.signGig('enlist') === false);

// 3. 投军回城结算：军功（不带伤）
DAY += 7;
const copperPreEnlist = COPPER, stonesPreEnlist = STONES, tempPreEnlist = CD().tempering;
patchRng([0.99]);   // 带伤骰0.99>=0.35→不带伤
CJ.settleGigs();
restoreRng();
ok('投军班师：饷钱500铜+犒赏30灵石+历练150', COPPER === copperPreEnlist + 500 && STONES === stonesPreEnlist + 30 && CD().tempering === tempPreEnlist + 150);
ok('投军结过账（一生一回）', CD()._gigs.enlist === 'done');

// 4. 投军回城结算：带旧伤（三成一五明账）
CD()._gigs = { enlist: { signedDay: DAY, returnDay: DAY, city: '甲城' } };
const healthPreWound = CD().health;
patchRng([0.01]);   // 带伤骰0.01<0.35→带伤
CJ.settleGigs();
restoreRng();
ok('随军挂了彩（伤-40，契上写明那一笔）', CD().health === healthPreWound - 40 && CD()._gigs.enlist === 'done');
CD().health = 100;

// 5. 护送贵人：平安（无截）
CD()._gigs = {};
BUILDINGS = ['escort_office'];
CJ.signGig('vip');
DAY += 3;
const copperPreVip = COPPER, stonesPreVip = STONES, repPreVip = sandbox.getReputationValue('甲城');
patchRng([0.99]);   // 遭截骰0.99>=0.3→平安
CJ.settleGigs();
restoreRng();
ok('护送贵人平安：200铜+20灵石+城望2', COPPER === copperPreVip + 200 && STONES === stonesPreVip + 20 && sandbox.getReputationValue('甲城') === repPreVip + 2 && CD()._gigs.vip === 'done');

// 6. 护送贵人：半道遭截→护住（胜，另谢30灵石+城望3+入传闻）
CD()._gigs = { vip: { signedDay: DAY, returnDay: DAY, city: '甲城' } };
CD().realm = '炼气';   // winP=min(0.85,0.5+0)=0.5
const stonesPreWin = STONES, repPreWin = sandbox.getReputationValue('甲城');
deedLog.length = 0;
patchRng([0.01, 0.01]);   // 遭截骰0.01<0.3触发；护住骰0.01<0.5→胜
CJ.settleGigs();
restoreRng();
ok('遭截护住：主家另谢30灵石（20+30）+城望再+3', STONES === stonesPreWin + 50 && sandbox.getReputationValue('甲城') === repPreWin + 5);
ok('击退截客入传闻账', deedLog.some(d => d.mood === 'good'));

// 7. 护送贵人：半道遭截→挨一下（败，镖钱折半+伤25）
CD()._gigs = { vip: { signedDay: DAY, returnDay: DAY, city: '甲城' } };
CD().health = 100;
const copperPreLose = COPPER, healthPreLose = CD().health;
patchRng([0.01, 0.99]);   // 遭截触发；护住骰0.99>=0.5→败
CJ.settleGigs();
restoreRng();
ok('遭截挨打：镖钱折半（200→100）+伤25', COPPER === copperPreLose + 100 && CD().health === healthPreLose - 25);

// 8. 回城账不蒸发（结算失败→改日再结）
CD()._gigs = { vip: { signedDay: DAY, returnDay: DAY, city: '甲城' } };
RS_FAIL = true;
CJ.settleGigs();
RS_FAIL = false;
ok('账没走通→大差事不销（还是对象、非done）', CD()._gigs.vip && CD()._gigs.vip !== 'done' && typeof CD()._gigs.vip === 'object');
const stonesPreRetry = STONES;
CJ.settleGigs();
ok('改日再结：回城账不蒸发（补结成功销账）', CD()._gigs.vip === 'done' && STONES > stonesPreRetry);

// 9. 读档归一化：坏契当没签过
CD()._gigs = { enlist: { signedDay: 5, returnDay: -3, city: '甲城' }, vip: 'done', 瞎编的: { returnDay: 9 } };
CJ.settleGigs();   // 触发归一化
ok('坏回城日归一为null（当没签过）', CD()._gigs.enlist === null);
ok('结过账的保留done', CD()._gigs.vip === 'done');

// 10. gigsHere / panelHtml
CD()._gigs = {};
BUILDINGS = ['bounty_hall'];
ok('城里有募兵处且投军未结→gigsHere真', CJ.gigsHere('甲城') === true);
CD()._gigs = { enlist: 'done', vip: 'done' };
ok('两件大差事都结了→gigsHere假', CJ.gigsHere('甲城') === false);
CD()._gigs = {}; CD()._employ = null;
BUILDINGS = ['bounty_hall', 'escort_office'];
const panel = CJ.panelHtml('甲城');
ok('城情卡摆出大差事入口（投军/护送贵人）', panel.indexOf('投军') >= 0 && panel.indexOf('护送贵人') >= 0);

restoreRng();
console.log('\n== 结果：' + pass + ' 通过 / ' + fail + ' 失败 ==');
process.exit(fail ? 1 : 0);
