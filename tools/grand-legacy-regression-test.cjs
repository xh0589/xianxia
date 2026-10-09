// ==================== v27.6 大业收官批回归测试 ====================
// 覆盖：科举三场（季令门/年戳/学识门/逐级链/高中/一甲名次）· 捐官城主（进士门/城望/俸银月初自动账）·
//       称帝建国（城主+元婴+城望+大典钱/国号自姓/俸银改国贡）· 设坛传教（金丹/因果/信众公式+著经加成）·
//       受封土地公（信众300/因果30/香火翻倍）· 自创功法（元婴/掌握三门/进融合注册表持久化）·
//       著经立说（元婴/学识80/写过书/一生一经）· 比武大会（城望/彩头先付/三轮真仗/全胜金顶/落败冷却）·
//       每日每月自动账 · 读档归一化 · 接线位抽查。
// v27.9 增补：登基大典六仪（劝进→筑坛→加衮冕→改元→册礼→大赦）· 年号入档（自拟截4字/留空播种回落）·
//       男女称谓（男帝女后 · 称帝建国/称制建国）· 中宫册礼（道侣册皇后/皇夫 · 读档白名单归一化）。
// 运行：node tools/grand-legacy-regression-test.cjs
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
let STONES = 99999;
let COPPER = 1000;
let SEASON = 'autumn';
let LOC = '甲城';
let REALM = '炼气';
const REP = {};
const pkCity = s => String(s == null ? '' : s).replace(/\s+/g, '');
const timeLog = [];
const deedLog = [];
const journalLog = [];
const modals = {};
const reg = {};
const newDaySubs = [];
const battleLog = [];
const gameLogs = [];
const store = {};   // localStorage 背板
let authoringBooks = [];
let daoBond = null;   // 道侣桩：{id, bond} 或 null

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
sandbox.localStorage = { getItem: k => (k in store ? store[k] : null), setItem(k, v) { store[k] = String(v); }, removeItem(k) { delete store[k]; } };
sandbox.saveToStorage = (k, v) => { store[k] = String(v); return true; };
sandbox.addEventListener = () => {};
sandbox.showMessage = () => {};
sandbox.gameLog = { add(m) { gameLogs.push(String(m)); } };
sandbox.updateCurrencyUI = () => {};
sandbox.updateCharacterStatus = () => {};
sandbox.closeModalSoft = () => {};
sandbox.showModal = (title, html) => { modals['__modal'] = { title, html: String(html) }; };
sandbox.showBuildingEffectDialog = (title, html) => { modals['__dialog'] = { title, html: String(html) }; };
sandbox.getAbsoluteDay = () => DAY;
sandbox.getCurrentCityName = () => LOC;
sandbox.getRealmTier = () => ({ '凡人': 0, '炼气': 1, '筑基': 2, '金丹': 3, '元婴': 4, '化神': 5 }[REALM] != null ? { '凡人': 0, '炼气': 1, '筑基': 2, '金丹': 3, '元婴': 4, '化神': 5 }[REALM] : 1);
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
    name: '李长生', location: '甲城', realm: '炼气', gender: 'male', spiritStones: 99999, attrs: { dexterity: 30 },
    health: 100, maxHealth: 200, qi: 100, maxQi: 1000, energy: 100, maxEnergy: 100,
    mood: 80, karma: 0, notoriety: 0, fame: 0, essence: 0, tempering: 0, lifeSkills: { '学识': 40 }, flags: {}, _children: []
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
    const fame = si(spec.fame);
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
    if (fame) p.fame = (Number(p.fame) || 0) + fame;
    if (rep && city) sandbox.addReputation(city, rep);
    const ls = spec.lifeSkill;
    if (ls) { const arr = Array.isArray(ls) ? ls : [ls]; p.lifeSkills = p.lifeSkills || {};
        arr.forEach(one => { if (one && one.name) p.lifeSkills[one.name] = (Number(p.lifeSkills[one.name]) || 0) + si(one.exp != null ? one.exp : 1); }); }
    return { success: true, messages: spec.msg ? [spec.msg] : [] };
} };
sandbox.StateRegistry = { register: (name, mod) => { reg[name] = mod; } };
sandbox.WorldJournal = { record: r => journalLog.push(r) };
sandbox.WorldCalendar = null;
// 知识册桩：canEquip 认三门基础功法；unlock 故意不给——测 learnedSecrets 回落路径
sandbox.KnowledgeSystem = { canEquip: id => ['skill_01', 'skill_02', 'skill_03'].indexOf(id) >= 0 };
sandbox.learnedSecrets = ['skill_01', 'skill_02', 'skill_03'];
sandbox.skillPages = [[{ id: 'skill_01', name: '吐纳术', type: '内功' }, { id: 'skill_02', name: '铁布衫', type: '防御' }, { id: 'skill_03', name: '疾风步', type: '轻功' }]];
sandbox.Authoring = { state: () => ({ books: authoringBooks }) };
sandbox.currentBattle = null;
sandbox.NpcCrime = { startFlaggedBattle: (enemy, flags, announce) => { sandbox.currentBattle = Object.assign({}, enemy, flags || {}); battleLog.push(sandbox.currentBattle); return !!sandbox.currentBattle; } };
sandbox.npcManager = { getNPC: id => (id === 'n1' ? { name: '云童' } : null) };
sandbox.getDaoCompanionBond = () => daoBond;
sandbox.facilityAugment = null;   // 名册正门不依赖它；aug 补挂走 load，测试不触发
sandbox.scenarioEngine = null;

const context = vm.createContext(sandbox);
function run(rel) { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), context, { filename: rel }); }
const CD = () => sandbox.currentCharData;

console.log('== v27.6 大业收官批回归 ==');
run('js/grand-legacy.js');
const GL = sandbox.GrandLegacy;

ok('GrandLegacy 就位', !!GL && typeof GL.open === 'function');
ok('StateRegistry 大业账挂上（grandLegacy）', !!reg['grandLegacy']);
ok('新日订阅挂上（香火/月俸自动账）', newDaySubs.length >= 1);
ok('window.settleTourneyFight 全局导出（app.js 钩子）', typeof sandbox.settleTourneyFight === 'function');

// ---------- 1. 科举（85）：季令门/学识门/逐级链 ----------
LOC = ''; CD().location = '';
ok('城外进不了考场', GL.examOk(1).why.indexOf('身在城外') >= 0);
LOC = '甲城'; CD().location = '甲城';
SEASON = 'spring';
ok('乡试只秋闱（季令锁）', GL.examOk(1).ok === false && GL.examOk(1).why.indexOf('秋闱') >= 0);
SEASON = 'autumn';
CD().lifeSkills['学识'] = 10;
ok('学识不足亮锁写差多少', GL.examOk(1).ok === false && GL.examOk(1).why.indexOf('学识不足') >= 0);
CD().lifeSkills['学识'] = 40;
ok('会试须先过乡试（逐级锁）', GL.examOk(2).ok === false && GL.examOk(2).why.indexOf('还没过乡试') >= 0);
ok('乡试门槛齐了放行', GL.examOk(1).ok === true);

// ---------- 2. 落第 + 同年不再进场 + 来年再考 ----------
const enPre2 = CD().energy = 100;
patchRng([0.99]);   // p≈0.5，0.99≥p → 落第
ok('乡试落第', GL.sitExam(1) === false);
ok('落第也耗了进场精力', CD().energy === enPre2 - 20);
ok('同年不再进场（年戳）', GL.examOk(1).ok === false && GL.examOk(1).why.indexOf('今年这一场') >= 0);
DAY = 460;   // 跨年（yearIdx 0→1）
ok('来年又可进场', GL.examOk(1).ok === true);
restoreRng();

// ---------- 3. 高中三级链 + 一甲名次 ----------
reg['grandLegacy'].reset();
DAY = 460; SEASON = 'autumn'; CD().lifeSkills['学识'] = 40; CD().energy = 100;
const repPreJuren = REP['甲城'] = 0;
patchRng([0.05]);   // p=0.30+0.20=0.50，0.05<0.50 高中
ok('乡试高中', GL.sitExam(1) === true);
ok('举人入账 + 城望+3', GL.state().examPassed[1] && REP['甲城'] === repPreJuren + 3);
SEASON = 'spring'; CD().lifeSkills['学识'] = 55; CD().energy = 100;
patchRng([0.05]);   // p=0.28+0.275=0.555
ok('会试高中', GL.sitExam(2) === true);
ok('贡士入账（逐级链走完两级）', !!GL.state().examPassed[2]);
SEASON = 'winter'; CD().lifeSkills['学识'] = 88; CD().energy = 100;
patchRng([0.05, 0.10]);   // 殿试 p=0.35+0.44=0.79 高中；名次 rr=0.10<0.30 且学识≥85 → 一甲
ok('殿试高中', GL.sitExam(3) === true);
const rank3 = GL.state().examPassed[3].rank;
ok('学识88+一甲骰中 → 一甲名次（状元/榜眼/探花）', ['状元', '榜眼', '探花'].indexOf(rank3) >= 0, String(rank3));
ok('进士已过后不再重考', GL.examOk(3).ok === false && GL.examOk(3).why.indexOf('已经考过') >= 0);
ok('一甲游街入见闻账+传闻', journalLog.some(j => j.title === '金榜题名' || j.title === '进士及第') && deedLog.length > 0);
restoreRng();

// ---------- 4. 捐官当城主（86）----------
REP['甲城'] = 10;
ok('城望不足当不了城主', GL.officeOk().ok === false && GL.officeOk().why.indexOf('城望不足') >= 0);
REP['甲城'] = 25;
const stonesPreOff = STONES;
ok('进士+城望够 → 捐官放行', GL.officeOk().ok === true);
ok('接印当城主', GL.takeOffice() === true);
ok('部费 800 灵石一次付清', STONES === stonesPreOff - 800);
ok('城主入账 + 城望+10', GL.state().office && GL.state().office.city === '甲城' && REP['甲城'] === 35);
const sal = GL.salaryOf();
ok('俸银明账：60 + 城望/10', sal === 60 + Math.floor(35 / 10), String(sal));
// 月初俸银自动账
STONES = 1000;
const m0 = Math.floor(DAY / 30);
GL.dailyTick();
ok('初一月俸自动到账（零按钮）', STONES === 1000 + sal && GL.state().monthSettled === m0);
const stonesAfterSal = STONES;
GL.dailyTick();
ok('同月不重复支俸', STONES === stonesAfterSal);
DAY = 460 + 30;   // 翻月
GL.dailyTick();
ok('翻月再支一次俸银', STONES === stonesAfterSal + GL.salaryOf());

// ---------- 5. 称帝建国（92）----------
REALM = '金丹';
ok('修为不到元婴称不了帝', GL.emperorOk().ok === false && GL.emperorOk().why.indexOf('元婴') >= 0);
REALM = '元婴';
REP['甲城'] = 30;
ok('都城城望不足称不了帝', GL.emperorOk().ok === false && GL.emperorOk().why.indexOf('城望不足') >= 0);
REP['甲城'] = 55; STONES = 5000;
const karmaPreEmp = CD().karma = 0;
ok('城主+元婴+城望 → 称帝放行', GL.emperorOk().ok === true);
const stonesPreEmp = STONES;
daoBond = { id: 'n1', bond: 100 };
gameLogs.length = 0;
ok('黄袍加身', GL.doProclaim() === true);
ok('大典 1500 灵石 + 国号自姓「大李」', STONES === stonesPreEmp - 1500 && GL.state().emperor.dynasty === '大李');
ok('称帝业障-3（杀伐篡位）', CD().karma === karmaPreEmp - 3);
ok('俸银改国贡 150', GL.salaryOf() === 150);
ok('称帝入见闻账（endgame）', journalLog.some(j => j.title === '称帝建国'));
ok('v27.9 年号入档（无参走播种默认 · 非空 ≤4 字）', typeof GL.state().emperor.eraName === 'string' && GL.state().emperor.eraName.length > 0 && GL.state().emperor.eraName.length <= 4, GL.state().emperor.eraName);
ok('v27.9 道侣随龙 → 册为中宫「后」', GL.state().emperor.consort && GL.state().emperor.consort.name === '云童' && GL.state().emperor.consort.title === '后');
ok('v27.9 礼成日志带建元+册后', gameLogs.some(g => g.indexOf('建元「') >= 0 && g.indexOf('册云童为皇后') >= 0));
daoBond = null;
ok('天无二日：再称被拒', GL.doProclaim() === false && GL.emperorOk().why.indexOf('天无二日') >= 0);

// ---------- 6. 著经立说（88）----------
REALM = '金丹';
ok('元婴才著得经', GL.scriptOk().ok === false && GL.scriptOk().why.indexOf('元婴') >= 0);
REALM = '元婴'; CD().lifeSkills['学识'] = 60;
ok('学识不足80著不了经', GL.scriptOk().ok === false && GL.scriptOk().why.indexOf('学识不足') >= 0);
CD().lifeSkills['学识'] = 85; authoringBooks = [];
ok('没写过书著不了经', GL.scriptOk().ok === false && GL.scriptOk().why.indexOf('没写过一部书') >= 0);
authoringBooks = [{ title: '旧稿' }]; STONES = 5000;
ok('著经放行', GL.scriptOk().ok === true);
ok('著经立说刊行', GL.writeScripture() === true);
const scr = GL.state().scripture;
ok('经名带姓氏（李氏…）+ 入见闻账', scr && scr.title.indexOf('李氏') === 0 && journalLog.some(j => j.title === '著经立说'));
ok('一生一经：再著被拒', GL.writeScripture() === false && GL.scriptOk().why.indexOf('已经刊行') >= 0);

// ---------- 7. 设坛传教（90）+ 著经加成 ----------
REALM = '筑基';
ok('不到金丹设不了坛', GL.preachOk().ok === false && GL.preachOk().why.indexOf('金丹') >= 0);
REALM = '元婴'; CD().karma = 5;
ok('因果不足设不了坛', GL.preachOk().ok === false && GL.preachOk().why.indexOf('因果不足') >= 0);
CD().karma = 20; REP['甲城'] = 50; STONES = 5000;
const expFollow = Math.min(999, Math.floor((100 + Math.floor(50 / 2) + 20 * 3 + 4 * 10) * 1.5));   // 有经 ×1.5
ok('传教放行', GL.preachOk().ok === true);
ok('设坛传教', GL.doPreach() === true);
ok('信众公式（含著经五成加成）', GL.state().faith.followers === expFollow, GL.state().faith.followers + ' vs ' + expFollow);
ok('香火日账：真元 = 信众/50', GL.incenseGain() === Math.max(1, Math.floor(expFollow / 50)));
const essPre = CD().essence = 0;
GL.dailyTick();
ok('每日香火自动回馈真元（零按钮）', CD().essence === essPre + GL.incenseGain());

// ---------- 8. 受封土地公（91）----------
CD().karma = 10;
ok('因果不足受不了封', GL.earthgodOk().ok === false && GL.earthgodOk().why.indexOf('因果不足') >= 0);
CD().karma = 30;
ok('信众够+因果够 → 受封放行', GL.earthgodOk().ok === true);
const gainBefore = GL.incenseGain();
ok('受封土地公', GL.doEarthgod() === true);
ok('封神后香火翻倍', GL.incenseGain() === gainBefore * 2 && GL.state().earthgod);
ok('神位入见闻账', journalLog.some(j => j.title === '受封土地公'));

// ---------- 9. 自创功法（87）----------
REALM = '金丹';
ok('元婴才自创得功法', GL.artOk().ok === false && GL.artOk().why.indexOf('元婴') >= 0);
REALM = '元婴'; STONES = 5000;
const mc = GL.masteredCount();
ok('掌握功法计数（三门基础）', mc === 3, String(mc));
ok('自创放行', GL.artOk().ok === true);
ok('空名不给过', GL.doCreateArt('') === false);
const learnedPre = sandbox.learnedSecrets.slice();
ok('自创功法成', GL.doCreateArt('长生诀') === true);
const art = GL.state().art;
ok('功法入账（id=legacyart_ · 名≤8）', art && art.id.indexOf('legacyart_') === 0 && art.name === '长生诀');
ok('进本会话知识账（learnedSecrets 回落）', sandbox.learnedSecrets.indexOf(art.id) >= 0 && sandbox.learnedSecrets.length === learnedPre.length + 1);
ok('进 skillPages（运功栏可见）', sandbox.skillPages.some(pg => pg.some(s => s.id === art.id)));
const registry = JSON.parse(store['xianxia_merged_skills'] || '[]');
ok('进融合注册表（重载回册持久化）', registry.some(d => d.id === art.id && d.name === '长生诀' && d.effect.indexOf('攻击+12%') >= 0));
ok('一生一部：再创被拒', GL.doCreateArt('第二部') === false && GL.artOk().why.indexOf('道不重出') >= 0);

// ---------- 10. 办比武大会（93）----------
reg['grandLegacy'].reset();
LOC = '甲城'; CD().location = '甲城'; REP['甲城'] = 10; STONES = 5000;
ok('城望不足办不了大会', GL.tourneyOk().ok === false && GL.tourneyOk().why.indexOf('城望不足') >= 0);
REP['甲城'] = 40;
const stonesPreTour = STONES;
ok('大会放行', GL.tourneyOk().ok === true);
battleLog.length = 0;
ok('开台办大会', GL.startTourney() === true);
ok('彩头 300 灵石先付', STONES === stonesPreTour - 300);
ok('第一轮真仗拉起（_isTourneyFight 旗）', GL.state().tourRound === 1 && battleLog.length === 1 && battleLog[0]._isTourneyFight === true);
ok('对手按轮次播种（初赛档）', typeof battleLog[0].name === 'string' && battleLog[0].name.length > 0);
// 三轮全胜
sandbox.currentBattle = null;
GL.settleTourneyFight(true);
ok('初赛胜 → 进复赛', GL.state().tourRound === 2);
GL.startTourneyRound();
ok('复赛真仗拉起', battleLog.length === 2 && battleLog[1]._isTourneyFight === true);
sandbox.currentBattle = null;
GL.settleTourneyFight(true);
ok('复赛胜 → 进决顶', GL.state().tourRound === 3);
GL.startTourneyRound();
ok('决顶对手是 boss 档', battleLog.length === 3 && battleLog[2].type === 'boss');
sandbox.currentBattle = null;
const stonesPreWin = STONES;
GL.settleTourneyFight(true);
ok('决顶胜 → 金顶入账（一生一回）', GL.state().tourDone && GL.state().tourDone.city === '甲城' && GL.state().tourRound === 0);
ok('全胜彩头连本带利 500 灵石奉还', STONES === stonesPreWin + 500);
ok('大会圆满入见闻账', journalLog.some(j => j.title === '比武大会'));
ok('办过就不再办', GL.tourneyOk().ok === false && GL.tourneyOk().why.indexOf('已经办过') >= 0);

// ---------- 11. 大会落败 + 三十日冷却 ----------
reg['grandLegacy'].reset();
REP['甲城'] = 40; STONES = 5000; DAY = 500;
battleLog.length = 0;
ok('再开一届（重置后）', GL.startTourney() === true && GL.state().tourRound === 1);
sandbox.currentBattle = null;
const repPreLose = REP['甲城'];
GL.settleTourneyFight(false);
ok('落败大会砸场（彩头不退 · 城望-2）', GL.state().tourRound === 0 && GL.state().tourFailDay === 500 && REP['甲城'] === repPreLose - 2);
ok('砸场后三十日内不再开台', GL.tourneyOk().ok === false && GL.tourneyOk().why.indexOf('日后再开台') >= 0);
DAY = 530;
ok('满三十日又可开台', GL.tourneyOk().ok === true);

// ---------- 12. 读档归一化（坏账不进门） ----------
reg['grandLegacy'].reset();
reg['grandLegacy'].import({
    examPassed: { 2: { day: 5 } },                 // 跳过乡试直接贡士 = 坏账
    office: { city: '甲城', day: 9 },               // 没进士官身的城主 = 坏账
    emperor: { city: '甲城', day: 10, dynasty: '大秦' },   // 没城主的皇帝 = 坏账
    faith: null,
    earthgod: { day: 11 },                          // 没传教的神位 = 坏账
    art: { id: 'legacyart_1', name: '这是一部超过八个字的功法名', day: 3 },
    scripture: { title: 'x'.repeat(40), day: 4, city: '甲城' },
    tourDone: { city: '乙城', day: 6 },
    tourRound: 2, tourCity: '乙城', tourDay: 6,     // 已办过还留着进行中的轮次 = 清掉
    monthSettled: 99999                             // 未来月戳
});
let s12 = GL.state();
ok('跳级的科举账整段剔除（无一级即无二级）', !s12.examPassed[2] && !s12.examPassed[1]);
ok('没进士的城主剔除', s12.office === null);
ok('没城主的皇帝剔除', s12.emperor === null);
ok('没传教的神位剔除', s12.earthgod === null);
ok('功法名截到 8 字', s12.art && s12.art.name.length <= 8);
ok('经名截到 20 字', s12.scripture && s12.scripture.title.length <= 20);
ok('已办过的大会清掉进行中轮次', s12.tourDone && s12.tourRound === 0);
ok('未来月戳夹回本月', s12.monthSettled <= Math.floor(DAY / 30));
// 逐级不跳的好账
reg['grandLegacy'].reset();
reg['grandLegacy'].import({ examPassed: { 1: { day: 1 }, 2: { day: 2 }, 3: { day: 3, rank: '状元' } }, office: { city: '甲城', day: 4 } });
s12 = GL.state();
ok('逐级齐全的好账成对往返（含一甲名次）', s12.examPassed[1] && s12.examPassed[2] && s12.examPassed[3].rank === '状元' && s12.office.city === '甲城');
reg['grandLegacy'].reset();

// ---------- 12b. v27.9 登基礼：六仪链 / 年号 / 帝后称谓 / 中宫册礼 ----------
const ERA_POOL = ['天授', '建初', '洪武', '永熙', '太和', '开皇', '神凤', '麟德'];
function glEnthroneSetup() {
    reg['grandLegacy'].reset();
    reg['grandLegacy'].import({ examPassed: { 1: { day: 1 }, 2: { day: 2 }, 3: { day: 3, rank: '状元' } }, office: { city: '甲城', day: 4 } });
    REALM = '元婴'; REP['甲城'] = 60; STONES = 5000; LOC = '甲城'; CD().location = '甲城'; CD().gender = 'male';
}
// 六仪弹链（男主 + 道侣在中宫）
glEnthroneSetup();
daoBond = { id: 'n1', bond: 100 };
ok('第一仪 劝进（三请一辞 · 明账：礼成才扣）', GL.proclaimPanel(1) === true && modals['__modal'].html.indexOf('伏阙劝进') >= 0 && modals['__modal'].html.indexOf('1500') >= 0);
ok('第二仪 筑坛告天（城南三层坛）', GL.proclaimPanel(2) === true && modals['__modal'].html.indexOf('三层坛') >= 0);
ok('第三仪 加衮冕（男主黄袍加身）', GL.proclaimPanel(3) === true && modals['__modal'].html.indexOf('黄袍自你肩头披下') >= 0);
ok('第四仪 改元（年号输入框 + 播种建议）', GL.proclaimPanel(4) === true && modals['__modal'].html.indexOf('legacy-era-name') >= 0 && modals['__modal'].html.indexOf('留空则用') >= 0);
modals['legacy-era-name'] = { value: '洪武中兴超长' };   // 超 4 字截断
ok('建元读输入（截 4 字）进第五仪', GL.proclaimReadEra() === true);
ok('第五仪 册礼（道侣册皇后云童）', modals['__modal'].html.indexOf('云童') >= 0 && modals['__modal'].html.indexOf('皇后') >= 0);
ok('第六仪 大赦（总账含建元 · 此刻才扣）', GL.proclaimPanel(6) === true && modals['__modal'].html.indexOf('大赦天下') >= 0 && modals['__modal'].html.indexOf('建元「洪武中兴」') >= 0);
const stonesPreCer = STONES;
ok('礼成：年号取自输入（截 4 字）', GL.doProclaim() === true && GL.state().emperor.eraName === '洪武中兴' && STONES === stonesPreCer - 1500);
ok('礼成：中宫皇后云童入档', GL.state().emperor.consort && GL.state().emperor.consort.title === '后' && GL.state().emperor.consort.name === '云童');
// 留空回落播种年号 + 无道侣中宫虚悬
glEnthroneSetup();
daoBond = null;
modals['legacy-era-name'] = { value: '   ' };
GL.proclaimReadEra();
ok('年号留空回落播种默认（年号池内）', GL.doProclaim() === true && ERA_POOL.indexOf(GL.state().emperor.eraName) >= 0, String(GL.state().emperor.eraName));
ok('无道侣 → 中宫虚悬（consort 空）', GL.state().emperor.consort === null);
// 女主：临朝称制 / 道侣册皇夫
glEnthroneSetup();
CD().gender = 'female';
daoBond = { id: 'n1', bond: 100 };
journalLog.length = 0; gameLogs.length = 0;
ok('女主第三仪：凤冠临朝称制', GL.proclaimPanel(3) === true && modals['__modal'].html.indexOf('凤冠压鬓') >= 0);
ok('女主称制建国（自拟年号「神凤」）', GL.doProclaim('神凤') === true && GL.state().emperor.eraName === '神凤');
ok('女主入见闻账「称制建国」（不写称帝）', journalLog.some(j => j.title === '称制建国') && !journalLog.some(j => j.title === '称帝建国'));
ok('女主的道侣册「皇夫」', GL.state().emperor.consort && GL.state().emperor.consort.title === '皇夫' && GL.state().emperor.consort.name === '云童');
ok('女主礼成日志是衮冕加身', gameLogs.some(g => g.indexOf('衮冕加身') >= 0));
CD().gender = 'male'; daoBond = null;
// 读档归一化：年号 / 中宫
reg['grandLegacy'].reset();
reg['grandLegacy'].import({
    examPassed: { 1: { day: 1 }, 2: { day: 2 }, 3: { day: 3 } }, office: { city: '甲城', day: 4 },
    emperor: { city: '甲城', day: 5, dynasty: '大李', eraName: '这是一个超过四个字的年号', consort: { name: 'x'.repeat(20), title: '妃' } }
});
let s12b = GL.state();
ok('年号截到 4 字', s12b.emperor && s12b.emperor.eraName === '这是一个');
ok('中宫称谓白名单外（妃）剔除', s12b.emperor.consort === null);
reg['grandLegacy'].reset();
reg['grandLegacy'].import({
    examPassed: { 1: { day: 1 }, 2: { day: 2 }, 3: { day: 3 } }, office: { city: '甲城', day: 4 },
    emperor: { city: '甲城', day: 5, dynasty: '大李', eraName: '洪武', consort: { name: 'y'.repeat(20), title: '皇夫' } }
});
s12b = GL.state();
ok('好账往返：年号原样 + 皇夫名截 12 字', s12b.emperor.eraName === '洪武' && s12b.emperor.consort.title === '皇夫' && s12b.emperor.consort.name.length <= 12);
reg['grandLegacy'].reset();
reg['grandLegacy'].import({
    examPassed: { 1: { day: 1 }, 2: { day: 2 }, 3: { day: 3 } }, office: { city: '甲城', day: 4 },
    emperor: { city: '甲城', day: 5, dynasty: '大秦' }   // 老档没有年号/中宫字段
});
s12b = GL.state();
ok('老档兼容：无年号字段 → eraName 空串不炸', s12b.emperor && s12b.emperor.eraName === '' && s12b.emperor.consort === null);
reg['grandLegacy'].reset();

// ---------- 13. 接线位抽查 ----------
const appSrc = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
ok('app.js 战斗收场钩子 _isTourneyFight 胜负成对', (appSrc.match(/_isTourneyFight/g) || []).length >= 2 && appSrc.indexOf('settleTourneyFight(true)') >= 0 && appSrc.indexOf('settleTourneyFight(false)') >= 0);
const cultSrc = fs.readFileSync(path.join(ROOT, 'js/cultivation/cultivation.js'), 'utf8');
ok('修炼面板挂上大业名册入口', cultSrc.indexOf('openGrandLegacy()') >= 0 && cultSrc.indexOf('大业名册') >= 0);
const seSrc = fs.readFileSync(path.join(ROOT, 'js/core/scenario-engine.js'), 'utf8');
ok('情境引擎 grand op 正门 + 剥单', seSrc.indexOf("eff.grand") >= 0 && seSrc.indexOf("qk === 'grand'") >= 0);
const glSrc = fs.readFileSync(path.join(ROOT, 'js/grand-legacy.js'), 'utf8');
ok('自立宗门路标读 PlayerSect（不重复建设）', glSrc.indexOf('PlayerSect') >= 0 && glSrc.indexOf('openFoundSectPanel') >= 0);
ok('v27.9 名册称帝按钮走六仪弹链（proclaimPanel(1)）', glSrc.indexOf('proclaimPanel(1)') >= 0 && glSrc.indexOf('登基大典') >= 0);
ok('v27.9 年号输入不进 onclick（proclaimReadEra 读框）', glSrc.indexOf('proclaimReadEra') >= 0 && glSrc.indexOf("onclick=\"window.GrandLegacy.doProclaim('" ) < 0);

console.log('\n结果：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
