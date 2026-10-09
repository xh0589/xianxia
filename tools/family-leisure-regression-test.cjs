// ==================== v27.5 家业与闲趣批回归测试 ====================
// 覆盖：家业名册（立宗族锁与成功/建祠堂三锁+落籍城限定/逢节自动祭祖/收义子（含托孤福儿免彩礼）/
//       乔迁宴一处一回+道侣情分/捡土狗一世一条+一日一摸/季度家事事件（族亲/孩子/祠堂/土狗四池）/
//       恩仇簿三本账只读/读档归一化）·
//       闲趣名册（风筝四季与春日加成/蹴鞠彩头骰/投壶灵巧明账胜负两路/春联腊月门锁+学识润笔/
//       闲趣谱图鉴四页/面板四时常挂+节日双行）·
//       勾栏听戏（整本大戏+戏班写戏里程碑加心境）· 深山打猎与开局布衣的接线位抽查。
// 运行：node tools/family-leisure-regression-test.cjs
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
const journalLog = [];
const modals = {};
const reg = {};
const newDaySubs = [];
let DAO = null;

// 恩仇簿三本账的桩（可变）
const DEEDS = {};   // pkCity -> {done, favors, milestones}
const CRIME = { heat: 0, wanted: false, bounty: 0 };
const CASEST = { solved: 0, caught: {} };

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
    name: '李长生', location: '甲城', realm: '炼气', spiritStones: 5000, attrs: { dexterity: 30 },
    health: 100, maxHealth: 200, qi: 100, maxQi: 1000, energy: 100, maxEnergy: 100,
    mood: 80, karma: 0, notoriety: 4, tempering: 0, lifeSkills: { '学识': 40 }, flags: {}, _children: []
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
    if (health) p.health = Math.max(0, Math.min(Number(p.maxHealth) || 100, (Number(p.health) || 0) + health));
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
sandbox.WorldJournal = { record: r => journalLog.push(r) };
sandbox.WorldCalendar = null;
// 历法桩：一年 360 日，除夕 doy 360（festival-fair FALLBACK 同款；显式给一份防漂移）
sandbox.FESTIVAL_DEFS = [
    { key: 'shangyuan', name: '上元灯节', doy: 1 },
    { key: 'qixi', name: '七夕', doy: 187 },
    { key: 'zhongqiu', name: '中秋', doy: 225 },
    { key: 'chuxi', name: '除夕', doy: 360 }
];
// 恩仇簿三本账桩（family-system 只读）
sandbox.GoodDeeds = { ledgerOf: city => DEEDS[pkCity(city)] || null };
sandbox.cityReputation = { '甲城': {}, '乙城': {} };
sandbox.NpcCrime = { heat: () => CRIME.heat, wanted: () => CRIME.wanted, bounty: () => CRIME.bounty };
sandbox.CaseSystem = { state: () => ({ solved: CASEST.solved, caught: CASEST.caught }) };
// 洞府/道侣桩
sandbox.playerHouse = null;
sandbox.getDaoCompanionBond = () => DAO;
// 勾栏瓦舍注册桩
const SCENARIOS = {};
sandbox.scenarioEngine = { register: (id, def) => { SCENARIOS[id] = def; } };
sandbox.QinArts = null;
sandbox.CityVoices = null;

const context = vm.createContext(sandbox);
function run(rel) { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), context, { filename: rel }); }
const CD = () => sandbox.currentCharData;
// seedOf 镜像（family-system 同款）：宿主机上算出「哪天挑中哪件家事」，测试不靠碰运气
function seedOf(s) { let h = 0; s = String(s || ''); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }

console.log('== v27.5 家业与闲趣批回归 ==');
run('js/city-facilities/festival-fair.js');
run('js/family-system.js');
run('js/city-facilities/facility-qin-venue.js');
const FF = sandbox.FestivalFair;
const FH = sandbox.FamilyHall;

ok('三个模块全部就位', !!FF && !!FH && !!SCENARIOS['goulan_washe']);
ok('StateRegistry 家业账挂上（familyHall）', !!reg['familyHall']);
ok('新日订阅挂上（庙会招呼+家事季度账）', newDaySubs.length >= 2);

// ---------- 1. 立宗族（94） ----------
LOC = ''; CD().location = '';
ok('城外立不了宗', FH.foundClan() === false);
LOC = '甲城'; CD().location = '甲城';
REP['甲城'] = 5;
let g = FH.clanOk();
ok('城望不足亮锁写明差多少', g.ok === false && g.why.indexOf('城望不足 10') >= 0, g.why);
REP['甲城'] = 12;
STONES = 100;
g = FH.clanOk();
ok('灵石不足亮锁', g.ok === false && g.why.indexOf('灵石不足') >= 0, g.why);
STONES = 5000;
g = FH.clanOk();
ok('门槛齐了放行', g.ok === true);
const stonesPre = STONES, karmaPre = CD().karma, repPre = REP['甲城'];
ok('立宗成功', FH.foundClan() === true);
const st1 = FH.state();
ok('宗族落账：李氏宗族 · 甲城 · 当日', !!st1.clan && st1.clan.name === '李氏宗族' && st1.clan.city === '甲城' && st1.clan.day === DAY);
ok('修谱钱一次付清（-200 灵石）+因果+1+城望+2', STONES === stonesPre - 200 && CD().karma === karmaPre + 1 && REP['甲城'] === repPre + 2);
ok('立宗入见闻账+传闻', journalLog.some(j => j.title === '立宗族') && deedLog.some(d => d.text.indexOf('立了宗族') >= 0));
ok('一生一回：再立被拒', FH.foundClan() === false && FH.clanOk().why.indexOf('只立一回宗') >= 0);

// ---------- 2. 建祠堂（95） ----------
let h = FH.hallOk();
ok('人在宗籍城才建得', h.ok === true);
LOC = '乙城'; CD().location = '乙城';
h = FH.hallOk();
ok('祠堂须建在宗族落籍城（锁就亮锁）', h.ok === false && h.why.indexOf('祖根所在') >= 0, h.why);
LOC = '甲城'; CD().location = '甲城';
const stPre2 = STONES;
ok('建祠成功', FH.buildHall() === true);
ok('砖瓦钱 -400 · 因果+2 · 城望+1', STONES === stPre2 - 400 && FH.state().hall && FH.state().hall.city === '甲城');
ok('祠堂也一生一回', FH.buildHall() === false);

// ---------- 3. 逢节自动祭祖（零按钮） ----------
const karmaPre3 = CD().karma;
DAY = 150;   // 非节令
FH.hallRiteTick();
ok('非节令不上香', CD().karma === karmaPre3 && FH.state().hall.lastRite === -1);
DAY = 360;   // 除夕（doy 360）
FH.hallRiteTick();
ok('除夕在祠堂城自动上香（因果+1 心境+3）', CD().karma === karmaPre3 + 1 && FH.state().hall.lastRite === 360);
const karmaPre3b = CD().karma;
FH.hallRiteTick();
ok('同日不重复上香', CD().karma === karmaPre3b);
LOC = '乙城'; CD().location = '乙城';
DAY = 720;   // 又一个除夕，人不在祠堂城
FH.hallRiteTick();
ok('人不在祠堂城不发账（遥祭）', FH.state().hall.lastRite === 360);
LOC = '甲城'; CD().location = '甲城';
DAY = 100;

// ---------- 4. 收义子（97） ----------
let a = FH.adoptOk();
ok('无托孤人情时收义子要彩礼 60', a.ok === true && !a.orphan);
// 先测托孤福儿路：乙城人情账里挂着一笔 orphan
DEEDS['乙城'] = { done: {}, favors: [{ kind: 'orphan', text: '福儿长大了……', repayDay: 9999, stones: 500, rep: 15, karma: 4 }], milestones: [] };
a = FH.adoptOk();
ok('托孤福儿在等——认出人情账', a.ok === true && !!a.orphan);
const stonesPre4 = STONES, karmaPre4 = CD().karma;
ok('领福儿进门', FH.adoptChild() === true);
const kid0 = CD()._children[0];
ok('福儿免彩礼（灵石分文未动）', STONES === stonesPre4);
ok('福儿入 _children 一本账（adopted 标记 · 半年长成）', kid0 && kid0.name === '福儿' && kid0.adopted === true && kid0.bornDay === DAY - 180 && kid0.grown === false);
ok('收义子因果+3', CD().karma === karmaPre4 + 3);
ok('一世一位：再领被拒', FH.adoptChild() === false && FH.adoptOk().why.indexOf('一世一位') >= 0);

// ---------- 5. 乔迁宴（98） ----------
let b = FH.banquetOk();
ok('没洞府办不了乔迁宴（锁就亮锁）', b.ok === false && b.why.indexOf('洞府') >= 0, b.why);
sandbox.playerHouse = { type: 'cave_1', location: 'site_a' };
DAO = { id: 'npc_wife', bond: { name: '阿蘅', level: 2, progress: 10 } };
b = FH.banquetOk();
ok('有洞府放行', b.ok === true && b.site === 'site_a');
const stPre5 = STONES, repPre5 = REP['甲城'];
ok('乔迁宴办成', FH.holdBanquet() === true);
ok('酒席钱 -120 · 城望+3 · 道侣情分+5', STONES === stPre5 - 120 && REP['甲城'] === repPre5 + 3 && DAO.bond.progress === 15);
ok('一处洞府一回', FH.holdBanquet() === false && FH.banquetOk().why.indexOf('已经办过') >= 0);
sandbox.playerHouse = { type: 'cave_1', location: 'site_b' };
ok('迁去新洞天再办一回', FH.holdBanquet() === true && FH.state().banquet.site_b === DAY);

// ---------- 6. 捡土狗（99） ----------
const karmaPre6 = CD().karma;
ok('捡回土狗', FH.takeDog() === true);
const st6 = FH.state();
ok('土狗落账（名字池里的一条 · 因果+1）', !!st6.dog && typeof st6.dog.name === 'string' && st6.dog.name.length > 0 && CD().karma === karmaPre6 + 1);
ok('一世一条：再捡被拒', FH.takeDog() === false);
const moodPre6 = CD().mood;
ok('摸摸狗心境+2', FH.petDog() === true && CD().mood === Math.min(100, moodPre6 + 2));
ok('一日一摸', FH.petDog() === false);
DAY = 101;
ok('次日又能摸', FH.petDog() === true);
DAY = 100;

// ---------- 7. 一季度一件家事（96 养儿育女并入 + 零按钮） ----------
const st7 = FH.state();
ok('家事日戳已立（立宗那天起算）', st7.lastFamEvt === 100);
DAY = 150;
const copperPre7 = COPPER, moodPre7 = CD().mood;
FH.familyTick();
ok('不满一季家事不来（事不追人）', COPPER === copperPre7 && CD().mood === moodPre7);
// 池子现在有 孩子/族亲/祠堂/土狗 四样——宿主机按同款种子算出各事件的日子，不靠碰运气
// 注意：季度账要求两件事隔满 90 日，所以三个日子要依次向后找
function pickOf(d) {
    const pool = [];
    if (CD()._children.length) pool.push('child');
    pool.push('clan'); pool.push('hall'); pool.push('dog');
    return pool[seedOf('fam_' + d) % pool.length];
}
function dayFor(kind, from) { for (let d = from; d < from + 400; d++) { if (pickOf(d) === kind) return d; } return 0; }
const dClan = dayFor('clan', 190);
const dChild = dayFor('child', dClan + 90);
const dDog = dayFor('dog', dChild + 90);
ok('种子池四样家事都能轮到', dClan > 0 && dChild > 0 && dDog > 0);
DAY = dClan;
const copperPre7b = COPPER;
FH.familyTick();
ok('族亲送礼（铜钱+40 · 一季一件后日戳推进）', COPPER === copperPre7b + 40 && FH.state().lastFamEvt === dClan);
FH.familyTick();
ok('同季第二件不来', COPPER === copperPre7b + 40);
DAY = dChild;
const moodPre7c = CD().mood;
FH.familyTick();
ok('孩子功课（心境+6 学识+1）', CD().mood === Math.min(100, moodPre7c + 6) && CD().lifeSkills['学识'] === 41);
DAY = dDog;
const copperPre7d = COPPER;
FH.familyTick();
ok('土狗看家刨出老钱（铜钱+15）', COPPER === copperPre7d + 15);
DAY = 100;

// ---------- 8. 恩仇簿（100，只读三本账零操作） ----------
DEEDS['甲城'] = { done: { d1: 5, d2: 7, d3: 9 }, favors: [{ kind: 'vendor', text: '卖菜老翁托人捎来一篮时鲜菜', repayDay: 999, stones: 60, rep: 3, karma: 0 }], milestones: ['paifang'] };
CRIME.heat = 12; CRIME.wanted = false; CRIME.bounty = 0;
CASEST.solved = 3; CASEST.caught = { '甲城|张三': 90, '乙城|李四': 95 };
CD().notoriety = 4;
const r8 = FH.enmityRows();
ok('恩：各城善举 3 件 + 在外人情 2 笔', r8.grace === 3 && r8.favors === 2, JSON.stringify({ g: r8.grace, f: r8.favors }));
ok('仇：民愤热度 12 · 恶名 4', r8.heat === 12 && r8.noto === 4);
ok('义：破案 3 桩 · 缉拿 2 名', r8.solved === 3 && r8.caught === 2);
CRIME.wanted = true; CRIME.bounty = 60;
const html8 = FH.enmityHtml();
ok('通缉上身后恩仇簿如实写画影悬赏', FH.enmityRows().wanted === true && html8.indexOf('画影图形悬赏 60') >= 0);

// ---------- 9. 家业名册面板（明账+锁就亮锁） ----------
ok('名册弹窗开得起', FH.open() === true && !!modals['__modal']);
const famHtml = modals['__modal'].html;
ok('面板含恩仇簿/族谱/祠堂/义子/乔迁/土狗六块', ['恩仇簿', '李氏宗族', '祠堂已建', '义子已入谱', '乔迁宴', '摸摸'].every(k => famHtml.indexOf(k) >= 0));
sandbox.playerHouse = null;
FH.open();
ok('没洞府时乔迁锁写在牌面上', modals['__modal'].html.indexOf('先置办一处家') >= 0);
sandbox.playerHouse = { type: 'cave_1', location: 'site_a' };

// ---------- 10. 读档归一化（坏账不进门） ----------
reg['familyHall'].reset();
let st10 = FH.state();
ok('reset 清空家业账', !st10.clan && !st10.hall && !st10.dog && Object.keys(st10.banquet).length === 0);
reg['familyHall'].import({
    clan: null,   // 没立宗
    hall: { city: '甲城', day: 5 },   // 却有祠堂 = 坏账
    dog: { name: '' },                 // 坏狗名
    banquet: { site_a: 50, bad: 'x', '': 3 },
    lastFamEvt: DAY + 999              // 未来日戳
});
st10 = FH.state();
ok('没宗族的祠堂剔除', st10.hall === null);
ok('坏狗名剔除', st10.dog === null);
ok('坏宴账剔除（只留 site_a）', st10.banquet.site_a === 50 && !('bad' in st10.banquet) && !('' in st10.banquet));
ok('未来日戳夹回今天', st10.lastFamEvt <= DAY);
reg['familyHall'].import({ clan: { name: '王氏宗族', city: '乙城', day: 30 }, hall: { city: '乙城', day: 31, lastRite: 355 }, dog: { day: 40, name: '大黄', petDay: -1 }, banquet: {}, lastFamEvt: 60 });
st10 = FH.state();
ok('好账成对往返', st10.clan.name === '王氏宗族' && st10.hall.lastRite === 355 && st10.dog.name === '大黄' && st10.lastFamEvt === 60);
reg['familyHall'].reset();
CD()._children.length = 0;
REP['甲城'] = 12;

// ---------- 11. 闲趣名册：风筝（11） ----------
LOC = ''; CD().location = '';
ok('城外进不了闲趣场', FF.leisure() === false);
LOC = '甲城'; CD().location = '甲城';
ok('闲趣场弹窗开得起（四时都有）', FF.leisure() === true && modals['__modal'].title.indexOf('闲趣场') >= 0);
SEASON = 'spring';
const copperPre11 = COPPER, moodPre11 = CD().mood = 50;
FF.leisureAct('kite');
ok('放风筝：-5 铜 · 春日心境 8+3', COPPER === copperPre11 - 5 && CD().mood === 61);
ok('闲趣谱记下第一页：风筝', FF.lzCount() === 1 && CD()._leisureBook.kite === 1);
ok('风筝一日一回', FF.leisureAct('kite') === undefined && COPPER === copperPre11 - 5);
SEASON = 'winter';
DAY = 101; CD().mood = 50;
const copperPre11b = COPPER;
FF.leisureAct('kite');
ok('冬风放鸢没有春加成（心境+8）', CD().mood === 58 && COPPER === copperPre11b - 5);
SEASON = 'spring';

// ---------- 12. 蹴鞠（12） ----------
DAY = 102; CD().energy = 100; CD().mood = 50;
const copperPre12 = COPPER;
patchRng([0.05]);   // 一成二的彩头运——中
FF.leisureAct('cuju');
ok('蹴鞠赢彩头：精力-10 心境+6 铜钱+20', CD().energy === 90 && CD().mood === 56 && COPPER === copperPre12 + 20);
DAY = 103; CD().energy = 100;
const copperPre12b = COPPER;
patchRng([0.9]);    // 不中
FF.leisureAct('cuju');
ok('蹴鞠没彩头也不倒贴', COPPER === copperPre12b);
restoreRng();
ok('闲趣谱第二页：蹴鞠', CD()._leisureBook.cuju === 1 && FF.lzCount() === 2);

// ---------- 13. 投壶（13，灵巧明账） ----------
const p13 = FF.potP();
ok('投壶准头明账：0.35+灵巧30×0.005=0.50', Math.abs(p13 - 0.5) < 1e-9, String(p13));
DAY = 104; CD().mood = 50;
const copperPre13 = COPPER;
patchRng([0.4]);    // < 0.5 中壶
FF.leisureAct('pot');
ok('投中：押10收25（净+15）心境+4', COPPER === copperPre13 + 15 && CD().mood === 54);
DAY = 105; CD().mood = 50;
const copperPre13b = COPPER;
patchRng([0.9]);    // 偏了
FF.leisureAct('pot');
ok('投偏：押钱归庄（-10）心境+2（乐子还在）', COPPER === copperPre13b - 10 && CD().mood === 52);
restoreRng();
ok('闲趣谱第三页：投壶', CD()._leisureBook.pot === 1 && FF.lzCount() === 3);

// ---------- 14. 卖春联（14，腊月门） ----------
DAY = 100;
ok('非腊月锁就亮锁', FF.inCoupletSeason() === false);
const copperPre14 = COPPER;
FF.leisureAct('couplet');
ok('非腊月卖不成（一个子儿不进来）', COPPER === copperPre14 && !CD()._leisureBook.couplet);
DAY = 340;   // doy 340 ≥ 331，腊月
ok('腊月里门开', FF.inCoupletSeason() === true);
const copperPre14b = COPPER;
CD().energy = 100;
FF.leisureAct('couplet');
ok('卖春联：润笔 15+学识40/4=25 铜 · 精力-15 · 学识+1', COPPER === copperPre14b + 25 && CD().energy === 85 && CD().lifeSkills['学识'] === 42);
ok('闲趣谱第四页集齐——四页顽主', FF.lzCount() === 4 && CD()._leisureBook.couplet === 1);
ok('春联一日一回', FF.leisureAct('couplet') === undefined && COPPER === copperPre14b + 25);
DAY = 100;

// ---------- 15. 城市面板：庙会行只在节日、闲趣行四时常挂 ----------
const ph15 = FF.panelHtml('甲城');
ok('非节日面板只挂闲趣场', ph15.indexOf('闲趣场') >= 0 && ph15.indexOf('庙会正开') < 0);
DAY = 360;   // 除夕
const ph15b = FF.panelHtml('甲城');
ok('节日面板双行（庙会+闲趣场）', ph15b.indexOf('庙会正开') >= 0 && ph15b.indexOf('闲趣场') >= 0);
ok('别城面板不挂（人在甲城）', FF.panelHtml('乙城').indexOf('闲趣场') < 0);
DAY = 100;
ok('庙会本体仍一年只开一日', FF.open() === false);

// ---------- 16. 勾栏听戏（9） ----------
const goulan = SCENARIOS['goulan_washe'];
const choices = goulan.scenarios[0].nodes.stage_start.choices;
ok('听大戏挂在勾栏节目单上', choices.some(c => c.text.indexOf('听一整出大戏') >= 0));
ok('老验收前五位次序没动', ['抚琴一曲', '说书一段', '摄魂音', '台下听曲', '转入幕后'].every((k, i) => choices[i].text.indexOf(k) >= 0));
const opera = choices.find(c => c.text.indexOf('听一整出大戏') >= 0);
ok('戏票 15 文 · 两个时辰 · 学识+2', opera.effects.cost.copper === 15 && opera.effects.time === 120 && opera.effects.lifeSkill.name === '学识');
ok('没立「戏班写戏」里程碑：心境 12', opera.effects.mood() === 12 && opera.effects.msg().indexOf('义人传') < 0);
DEEDS['乙城'] = { done: {}, favors: [], milestones: ['paifang', 'opera'] };
ok('里程碑立过：台上唱《义人传》心境 16', opera.effects.mood() === 16 && opera.effects.msg().indexOf('义人传') >= 0);

// ---------- 17. 接线位抽查（深山打猎 / 开局布衣） ----------
const rmSrc = fs.readFileSync(path.join(ROOT, 'js/map/randomMap.js'), 'utf8');
ok('山林格挂上打猎动作', rmSrc.indexOf("act: 'hunt-wild'") >= 0 && rmSrc.indexOf("cell.terrainKey === 'MOUNTAIN' || cell.terrainKey === 'FOREST'") >= 0);
ok('打猎接进动作分发', rmSrc.indexOf("case 'hunt-wild': huntWild(); break;") >= 0 && rmSrc.indexOf('function huntWild()') >= 0);
const appSrc = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
ok('开局布衣草鞋直接穿上（equipItem 正门）', appSrc.indexOf("_starterKit = [['body', 'arm_cloth_robe'], ['feet', 'arm_cloth_shoes']]") >= 0);
const armorSrc = fs.readFileSync(path.join(ROOT, 'js/items-extended/03-armor.js'), 'utf8');
ok('布衣草鞋两件货真在百宝册里', armorSrc.indexOf("id: 'arm_cloth_robe'") >= 0 && armorSrc.indexOf("id: 'arm_cloth_shoes'") >= 0);
const slSrc = fs.readFileSync(path.join(ROOT, 'js/city-facilities/street-life.js'), 'utf8');
ok('市井总门挂上家业名册', slSrc.indexOf('FamilyHall.open()') >= 0);

console.log('\n结果：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
