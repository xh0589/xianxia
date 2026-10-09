// ==================== v27.7 朝政篇 + v27.8 长安线回归测试 ====================
// 覆盖：朝廷开衙（称帝后自动初始化）· 国库明账（税入/属城岁入/粮仓/宫城加成 · 月初自动过账 · 蠲免停税）·
//       立储（亲子/弟子吃现成账 · 无候选亮锁 · 一生一储）· 征伐邻城（真仗 _isConquestFight · 军资先付 ·
//       属城≤3 · 都城/舆图外/冷却/国库锁 · 胜入账败班师 · 城墙减半 · 续战）·
//       三大工程（各一生一回 · 国库支付）· 朝堂风波四件（自动上奏 · 间隔/开国门槛 · 各裁一回 ·
//       平叛真仗 _isRebelFight 胜负两路）· 编年史（开国/纪年/大事）· 终局三路（举国飞升须香火/禅位须储/天下鼎沸）·
//       飞升钩子包裹 · 终局后冻结 · 读档归一化（坏账不进门）· 面板牌面 · 接线位抽查。
// v27.8 增补：长安线（现皇帝的反应：开国三十日讨逆诏到阙 · 奉表称藩/扣使拒诏两断 · 讨逆军真仗
//       _isPunitiveFight 胜负 · 奉表后扩张两城必发兵 · 破军收官长安不敢东顾）·
//       号召归附（声望明账收城：号召力=名望+都城城望一半+属城×5 vs 民心按城播种 · 婉拒门槛加高冷却六十日 ·
//       他派护持的城召不动只能打 · 自家门派执幡民心减半）· 舆图口径（帝都长安不可犯 · 仙门不入世争）。
// v27.9 增补：登基礼——年号纪年（eraYear · 编年史全以「年号N年」起头 · 老档无年号退回裸纪年）·
//       帝后称谓（男主称帝女主称后 · 行文跟着走）· 中宫（皇后/皇夫上牌头）·
//       长安见闻（破讨逆军后行幸长安一次性见闻入史 · 敌对期海捕文书的眼色 · enterCity 包裹透传）。
// 运行：node tools/dynasty-court-regression-test.cjs
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

// ---------- 宽容桩（grand-legacy 同款） ----------
let DAY = 1000;
let STONES = 99999;
let COPPER = 1000;
let SEASON = 'autumn';
let LOC = '甲城';
let REALM = '元婴';
const REP = {};
const pkCity = s => String(s == null ? '' : s).replace(/\s+/g, '');
const deedLog = [];
const journalLog = [];
const modals = {};
const reg = {};
const newDaySubs = [];
const battleLog = [];
const gameLogs = [];
const enterCityCalls = [];
const store = {};
let mySects = [];
const npcMap = { n1: { name: '云童' } };   // n2 故意查无此人——测回落 npcId
let ascensionCalls = 0;

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
sandbox.locationSystem = {
    getCurrentLocation: () => LOC,
    getCityData: c => ((c === '甲城' || c === '乙城') ? { buildings: [] } : null),
    getAllCities: () => [{ name: '甲城' }, { name: '乙城' }, { name: '丙城' }, { name: '丁城' }, { name: '帝都·长安' }, { name: '太虚山' }]
};
sandbox.timeSystem = {
    onNewDaySubscribe: fn => newDaySubs.push(fn),
    advanceTime: () => {},
    getAbsoluteDay: () => DAY,
    gameTime: { get currentSeason() { return SEASON; } }
};
sandbox.currentCharData = {
    name: '李长生', location: '甲城', realm: '元婴', spiritStones: 99999, attrs: { dexterity: 30 },
    health: 100, maxHealth: 200, qi: 100, maxQi: 1000, energy: 100, maxEnergy: 100,
    mood: 80, karma: 0, notoriety: 0, fame: 0, essence: 0, tempering: 0, lifeSkills: { '学识': 88 }, flags: {}, _children: []
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
    return { success: true, messages: spec.msg ? [spec.msg] : [] };
} };
sandbox.StateRegistry = { register: (name, mod) => { reg[name] = mod; } };
sandbox.WorldJournal = { record: r => journalLog.push(r) };
sandbox.WorldCalendar = null;
sandbox.KnowledgeSystem = { canEquip: id => ['skill_01', 'skill_02', 'skill_03'].indexOf(id) >= 0 };
sandbox.learnedSecrets = ['skill_01', 'skill_02', 'skill_03'];
sandbox.skillPages = [[{ id: 'skill_01', name: '吐纳术', type: '内功' }, { id: 'skill_02', name: '铁布衫', type: '防御' }, { id: 'skill_03', name: '疾风步', type: '轻功' }]];
sandbox.Authoring = { state: () => ({ books: [{ title: '旧稿' }] }) };
sandbox.currentBattle = null;
sandbox.NpcCrime = { startFlaggedBattle: (enemy, flags, announce) => { sandbox.currentBattle = Object.assign({}, enemy, flags || {}); battleLog.push(sandbox.currentBattle); return !!sandbox.currentBattle; } };
sandbox.PlayerSect = { listMySects: () => mySects };
sandbox.npcManager = { getNPC: id => (npcMap[id] || null) };
// v27.8 舆图口径桩：吃 sect-cities 现成账（仙凡分治）——乙城他派护持、丁城自家门派、长安朝廷直辖、太虚山仙门
const SECT_CITY = {
    '帝都·长安': { patron: '朝廷', capital: true },
    '甲城': { patron: null },
    '乙城': { patron: '药王谷' },
    '丙城': { patron: null },
    '丁城': { patron: '长青宗' }
};
sandbox.sectCityInfo = c => { const k = pkCity(c); return (k in SECT_CITY) ? SECT_CITY[k] : null; };
sandbox.discipleState = null;
sandbox.PSectWorld = { homeName: () => '长青宗' };
sandbox.facilityAugment = null;
sandbox.scenarioEngine = null;
// 飞升钩子原身（ascension-epilogue 的 window.onAscension 桩）——须在 dynasty-court.js 加载前就位
sandbox.onAscension = function () { ascensionCalls++; return 'orig-ret'; };
// enterCity 原身——须在 dynasty-court.js 加载前就位（v27.9 长安见闻包裹测透传）
sandbox.enterCity = function (city) { enterCityCalls.push(city); return 'entered:' + city; };

const context = vm.createContext(sandbox);
function run(rel) { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), context, { filename: rel }); }
const CD = () => sandbox.currentCharData;
const DC = () => sandbox.DynastyCourt;

console.log('== v27.7 朝政篇回归 ==');
run('js/grand-legacy.js');
const subsBefore = newDaySubs.length;
run('js/dynasty-court.js');
const DCm = DC();

// ---------- 0. 模块就位 + 飞升钩子包裹 ----------
ok('DynastyCourt 就位', !!DCm && typeof DCm.open === 'function' && !!DCm.CFG);
ok('StateRegistry 朝政账挂上（dynastyCourt）', !!reg['dynastyCourt']);
ok('新日订阅挂上（户部月初自动过账）', newDaySubs.length === subsBefore + 1);
ok('全局出口三件（openDynastyCourt/settleConquestFight/settleRebelFight）',
    typeof sandbox.openDynastyCourt === 'function' && typeof sandbox.settleConquestFight === 'function' && typeof sandbox.settleRebelFight === 'function');
ok('飞升钩子包上了（__dcAscendHooked）', sandbox.__dcAscendHooked === true && sandbox.onAscension !== null);
ok('包裹透传：原 onAscension 照旧被调、返回值不丢', sandbox.onAscension() === 'orig-ret' && ascensionCalls === 1);
ok('v27.9 enterCity 包上了（__dcCityWrapped · 原样透传返回值）', sandbox.enterCity.__dcCityWrapped === true && sandbox.enterCity('甲城') === 'entered:甲城' && enterCityCalls[enterCityCalls.length - 1] === '甲城');

// ---------- 1. 没皇帝的守卫 + 坏账不进门 ----------
ok('没称帝进不了朝政', DCm.courtOk().ok === false && DCm.courtOk().why.indexOf('还没称帝') >= 0);
ok('没称帝开不了面板', DCm.open() === false);
DCm._import({ foundDay: 5, treasury: 999, vassals: [{ city: '乙城', day: 1 }], heir: { kind: 'child', name: 'x', day: 1 } });
let st = DCm.state();
ok('没皇帝的朝政账整本拒收（坏账不进门）', st.foundDay === 0 && st.treasury === 0 && st.vassals.length === 0 && st.heir === null);

// ---------- 2. 称帝（走 GL 现成账）+ 朝廷开衙 ----------
function glEnthrone() {
    reg['grandLegacy'].import({
        examPassed: { 1: { day: 1 }, 2: { day: 2 }, 3: { day: 3, rank: '状元' } },
        office: { city: '甲城', day: 4 },
        emperor: { city: '甲城', day: 1000, dynasty: '大李', eraName: '洪武', consort: { name: '云童', title: '后' } }
    });
}
glEnthrone();
REP['甲城'] = 80;
ok('GL 皇帝账就位', !!sandbox.GrandLegacy.state().emperor);
ok('v27.9 年号/中宫随档进（洪武 · 皇后云童）', sandbox.GrandLegacy.state().emperor.eraName === '洪武' && sandbox.GrandLegacy.state().emperor.consort.title === '后');
const subsBeforeTick = newDaySubs.length;
let gCourt = DCm.courtOk();
ok('称帝后朝廷开衙放行', gCourt.ok === true && gCourt.emp.dynasty === '大李');
st = DCm.state();
ok('开国帑银 300 入库 + 开国日 = 称帝日', st.treasury === 300 && st.foundDay === 1000);
ok('月戳对齐本月（当月不重复过账）', st.monthSettled === Math.floor(1000 / 30));
ok('编年史记下开国第一笔（元年）', st.chronicle.length >= 1 && st.chronicle[0].text.indexOf('元年') >= 0);
ok('v27.9 开国第一笔以年号纪年（洪武元年）', st.chronicle[0].text.indexOf('洪武元年') >= 0, st.chronicle[0].text);
DCm.courtOk();
ok('开衙只开一回（再翻牌面不重发帑银）', DCm.state().treasury === 300 && DCm.state().chronicle.length === st.chronicle.length);
ok('纪年公式：开国当年为元年', DCm.reignYear() === 1);
ok('v27.9 eraYear = 年号 + 在位年 + 年', DCm.eraYear() === '洪武1年', DCm.eraYear());

// ---------- 3. 国库明账（税入/常支） ----------
ok('都城税 = 城望/10', DCm.taxIncome() === 8);
ok('月入 = 税 + 属城岁入（现无属城）', DCm.incomeOf() === 8);
ok('月支 = 宫室常支 30', DCm.expenseOf() === 30);

// ---------- 4. 月初户部自动过账（零按钮）+ v27.8 长安讨逆诏到阙 ----------
DAY = 1030;
DCm.dailyTick();
st = DCm.state();
ok('翻月自动过账：300 + 8 - 30 = 278', st.treasury === 278 && st.monthSettled === Math.floor(1030 / 30), String(st.treasury));
ok('v27.8 开国满三十日：长安讨逆诏自动到阙', st.changan.phase === 'edict' && st.changan.edictDay === 1030);
DCm.dailyTick();
ok('同月不重复过账', DCm.state().treasury === 278);
ok('开国未满九十日朝堂无大事', DCm.state().pending === null);
CD().mood = 80; CD().karma = 0;
const repPreEdict = REP['甲城'];
ok('奉表称藩裁得（缓兵）', DCm.resolveEdict('submit') === true);
st = DCm.state();
ok('奉表：心境-5 因果+2 都城城望+3 相位转 submit', CD().mood === 75 && CD().karma === 2 && REP['甲城'] === repPreEdict + 3 && st.changan.phase === 'submit');
ok('回过话的诏书不再受理', DCm.resolveEdict('defy') === false);

// ---------- 5. 风波门（开国九十日 + 间隔六十日） ----------
DAY = 1050;
ok('开国 50 日灾年不上奏（门槛锁）', DCm.turmoilCond('famine') === false);
DAY = 1091;
ok('无属城藩王乱不触发', DCm.turmoilCond('rebel') === false);
ok('开国 91 日灾年可上奏', DCm.turmoilCond('famine') === true);
ok('灾年自动上奏（案头有奏折）', DCm.maybeTurmoil() === true && DCm.state().pending && DCm.state().pending.id === 'famine');
ok('奏折在案时不再叠新奏', DCm.maybeTurmoil() === false);
ok('裁错折子不受理', DCm.resolveTurmoil('heir', 'none') === false);

// ---------- 6. 灾年三策：蠲免 ----------
CD().karma = 0;
const repPreRemit = REP['甲城'];
ok('蠲免赋税裁决成', DCm.resolveTurmoil('famine', 'remit') === true);
st = DCm.state();
ok('蠲免九十日：税入立停（明账）', st.taxReliefUntil === 1091 + 90 && DCm.taxIncome() === 0);
ok('蠲免换民心：城望+8 因果+3', REP['甲城'] === repPreRemit + 8 && CD().karma === 3);
ok('灾年账收案（一生一回）', !!st.turmoilDone.famine && st.pending === null && DCm.turmoilCond('famine') === false);

// ---------- 7. 立储：锁与两条脉 ----------
CD()._children = [];
mySects = [];
ok('膝下无子门下无徒立不了储', DCm.heirOk().ok === false && DCm.heirOk().why.indexOf('膝下无子') >= 0);
ok('立储被锁时执行也拒', DCm.designateHeir('child') === false);
CD()._children = [{ name: '李小灵', parentNpcId: 'x', bornDay: 900 }];
ok('亲子入候选（吃子嗣现成账）', DCm.childHeirs().length === 1 && DCm.childHeirs()[0].name === '李小灵');
mySects = [{ name: '长青宗', disciples: [{ npcId: 'n1', joinedDay: 800 }, { npcId: 'n2', joinedDay: 850 }] }];
const dh = DCm.discipleHeirs();
ok('弟子入候选（吃宗门现成账）+ 查无此人回落 id', dh.length === 2 && dh[0].name === '云童' && dh[1].name === 'n2');
const repPreHeir = REP['甲城'];
ok('立亲子为太子', DCm.designateHeir('child') === true);
st = DCm.state();
ok('太子入账 + 都城城望+3 + 编年史记一笔', st.heir && st.heir.kind === 'child' && st.heir.name === '李小灵' && REP['甲城'] === repPreHeir + 3 && st.chronicle.some(c => c.text.indexOf('立李小灵为太子') >= 0));
ok('国本不动摇：再立被拒', DCm.designateHeir('disciple') === false && DCm.heirOk().why.indexOf('太子已立') >= 0);

// ---------- 8. 请立储风波（伏阙） ----------
DAY = 1400;
function dcImport(over) {
    const base = { foundDay: 1000, treasury: 500, monthSettled: Math.floor(DAY / 30), lastTurmoilDay: 0 };
    reg['dynastyCourt'].import(Object.assign(base, over || {}));
}
const ALL_DONE = { rebel: { day: 1, choice: 'x' }, famine: { day: 1, choice: 'x' }, heir: { day: 1, choice: 'x' }, historian: { day: 1, choice: 'x' } };
dcImport({ turmoilDone: { famine: { day: 1091, choice: 'remit' } }, lastTurmoilDay: 1091 });
ok('开国次年百官伏阙请立储（reignYear≥2）', DCm.reignYear() === 2 && DCm.maybeTurmoil() === true && DCm.state().pending.id === 'heir');
ok('伏阙立储裁决成（奏折不放丢）', DCm.resolveTurmoil('heir', 'child') === true);
st = DCm.state();
ok('伏阙后太子入账、奏折收案', st.heir && st.heir.name === '李小灵' && st.pending === null && !!st.turmoilDone.heir);
// 留中不发
DAY = 1500;
dcImport({ turmoilDone: { famine: { day: 1091, choice: 'remit' } }, lastTurmoilDay: 1091 });
DCm.maybeTurmoil();
const moodPreNone = CD().mood, notoPreNone = CD().notoriety;
ok('留中不发裁得', DCm.resolveTurmoil('heir', 'none') === true);
ok('留中不发：心境-5 恶名+1 储位仍虚', CD().mood === moodPreNone - 5 && CD().notoriety === notoPreNone + 1 && DCm.state().heir === null && !!DCm.state().turmoilDone.heir);

// ---------- 9. 史官直笔（业障深才来） ----------
CD().karma = 5;
DAY = 1550;
dcImport({ turmoilDone: { famine: { day: 1 }, heir: { day: 1 } }, lastTurmoilDay: 1091, heir: { kind: 'child', name: '李小灵', day: 1400 } });
ok('因果不黑史官不来', DCm.turmoilCond('historian') === false);
CD().karma = -5;
ok('业障深了史官捧实录入殿', DCm.turmoilCond('historian') === true && DCm.maybeTurmoil() === true && DCm.state().pending.id === 'historian');
const moodPreAllow = CD().mood;
ok('容他直笔', DCm.resolveTurmoil('historian', 'allow') === true);
ok('容直笔：因果+3 心境+5', CD().karma === -2 && CD().mood === Math.min(100, moodPreAllow + 5));
DAY = 1600;
dcImport({ turmoilDone: { famine: { day: 1 }, heir: { day: 1 } }, lastTurmoilDay: 1091, heir: { kind: 'child', name: '李小灵', day: 1400 } });
CD().karma = -5;
DCm.maybeTurmoil();
const notoPreBurn = CD().notoriety;
ok('焚毁实录裁得', DCm.resolveTurmoil('historian', 'burn') === true);
ok('焚实录：因果-2 恶名+3', CD().karma === -7 && CD().notoriety === notoPreBurn + 3 && !!DCm.state().turmoilDone.historian);

// ---------- 10. 征伐邻城：锁 ----------
CD().karma = 5;
DAY = 1800;
function calmImport(over) {   // 风波全收案的安静朝局
    dcImport(Object.assign({ turmoilDone: ALL_DONE, lastTurmoilDay: DAY, heir: { kind: 'child', name: '李小灵', day: 1400 } }, over || {}));
}
calmImport();
ok('打不了自己的都城', DCm.conquestOk('甲城').ok === false && DCm.conquestOk('甲城').why.indexOf('都城') >= 0);
ok('舆图外的城不认', DCm.conquestOk('戊城').ok === false && DCm.conquestOk('戊城').why.indexOf('舆图') >= 0);
ok('没选城不给打', DCm.conquestOk('').ok === false);
ok('国库够军资则放行', DCm.conquestOk('乙城').ok === true);

// ---------- 11. 征伐：真仗 + 胜 ----------
battleLog.length = 0;
ok('兴兵征乙城', DCm.startConquest('乙城') === true);
st = DCm.state();
ok('军资 100 先出国库（败不退）', st.treasury === 400);
ok('征伐真仗拉起（_isConquestFight 旗 + 城名 + boss 档）', st.conquering && st.conquering.city === '乙城' && battleLog.length === 1 && battleLog[0]._isConquestFight === true && battleLog[0].city === '乙城' && battleLog[0].type === 'boss');
ok('仗没打完不再兴兵', DCm.conquestOk('丙城').ok === false && DCm.conquestOk('丙城').why.indexOf('先了结') >= 0);
ok('手头打着时续战被拒', DCm.resumeConquest() === false);
sandbox.currentBattle = null;
CD().fame = 0;
const repPreYi = REP['乙城'] = 0;
DCm.settleConquestFight(true);
st = DCm.state();
ok('克城：乙城改属（属城 1/3）', st.vassals.length === 1 && st.vassals[0].city === '乙城' && st.conquering === null);
ok('克城：名望+3（走 RewardService）+ 城望+5', CD().fame === 3 && REP['乙城'] === repPreYi + 5);
ok('克城入编年史 + 传闻', st.chronicle.some(c => c.text.indexOf('克乙城') >= 0) && deedLog.length > 0);
DCm.settleConquestFight(true);
ok('没有进行中的仗时结算空转（不重复入账）', DCm.state().vassals.length === 1 && CD().fame === 3);

// ---------- 12. 征伐：败 + 三十日冷却 ----------
DCm.startConquest('丙城');
const repPreJiaLose = REP['甲城'];
const notoPreLose = CD().notoriety;
sandbox.currentBattle = null;
DCm.settleConquestFight(false);
st = DCm.state();
ok('败：残军另损 50（无城墙）+ 冷却日戳', st.treasury === 400 - 100 - 50 && st.conquestFailDay === 1800 && st.vassals.length === 1, String(st.treasury));
ok('败：恶名+2 都城城望-3', CD().notoriety === notoPreLose + 2 && REP['甲城'] === repPreJiaLose - 3);
ok('新败之余三十日不兴兵', DCm.conquestOk('丁城').ok === false && DCm.conquestOk('丁城').why.indexOf('新败之余') >= 0);
DAY = 1830;
ok('满三十日又可兴兵', DCm.conquestOk('丁城').ok === true);

// ---------- 13. 征伐：续战 ----------
battleLog.length = 0;
ok('再兴兵征丁城', DCm.startConquest('丁城') === true && DCm.state().treasury === 150);
sandbox.currentBattle = null;   // 模拟闪断后回来
ok('城下接着打（续战重拉真仗）', DCm.resumeConquest() === true && battleLog.length === 2 && battleLog[1]._isConquestFight === true && battleLog[1].city === '丁城');
sandbox.currentBattle = null;
DCm.settleConquestFight(true);
ok('续战克丁城（属城 2/3）', DCm.state().vassals.length === 2 && DCm.state().vassals.some(v => v.city === '丁城'));

// ---------- 14. 属城已满 / 军资不足 ----------
DAY = 1850;
calmImport({ vassals: [{ city: '乙城', day: 1 }, { city: '丙城', day: 1 }, { city: '丁城', day: 1 }] });
ok('已是属城不用再打', DCm.conquestOk('乙城').ok === false && DCm.conquestOk('乙城').why.indexOf('已是属城') >= 0);
calmImport({ treasury: 50 });
ok('国库不够军资亮锁（写差多少）', DCm.conquestOk('乙城').ok === false && DCm.conquestOk('乙城').why.indexOf('军资要 100') >= 0);

// ---------- 15. 三大工程 ----------
DAY = 1900;
REP['甲城'] = 80; REP['乙城'] = 20;
calmImport({ treasury: 2000 });
ok('没有的工程不认', DCm.workOk('temple').ok === false && DCm.workOk('temple').why.indexOf('没有这项工程') >= 0);
const repPreWall = REP['甲城'];
ok('修城墙（国库 300）', DCm.buildWork('wall') === true && DCm.state().treasury === 1700);
ok('城墙：都城城望+8', REP['甲城'] === repPreWall + 8);
ok('一生一回：重修被拒', DCm.buildWork('wall') === false && DCm.workOk('wall').why.indexOf('已经动工落成') >= 0);
CD().fame = 0;
ok('筑宫城（国库 500 · 名望+15）', DCm.buildWork('palace') === true && DCm.state().treasury === 1200 && CD().fame === 15);
ok('开粮仓（国库 200）', DCm.buildWork('granary') === true && DCm.state().treasury === 1000);
ok('明账月入：税 8 + 粮仓 15 + 宫城加成一成 = 25', DCm.incomeOf() === 25, String(DCm.incomeOf()));
calmImport({ treasury: 100 });
ok('国库不够工部不领旨', DCm.workOk('palace').ok === false && DCm.workOk('palace').why.indexOf('国库不够') >= 0);

// ---------- 16. 城墙减半（征伐败） ----------
DAY = 1950;
calmImport({ treasury: 500, works: { wall: 1900 } });
DCm.startConquest('乙城');
sandbox.currentBattle = null;
DCm.settleConquestFight(false);
ok('有城墙：征伐败残军损失减半（25）', DCm.state().treasury === 400 - 25, String(DCm.state().treasury));

// ---------- 17. 藩王叛乱：触发 + 招安 ----------
DAY = 2000;
CD().karma = 5;
calmImport({
    treasury: 500, vassals: [{ city: '乙城', day: 1 }],
    turmoilDone: { famine: { day: 1 }, heir: { day: 1 }, historian: { day: 1 } },
    lastTurmoilDay: 1900, monthSettled: Math.floor(DAY / 30)
});
ok('有属城才会有藩王乱', DCm.turmoilCond('rebel') === true);
ok('八百里加急自动上奏', DCm.maybeTurmoil() === true && DCm.state().pending.id === 'rebel');
ok('叛城锁定乙城（单属城无歧义）', DCm.rebelCity() === '乙城');
const repPreAppease = REP['乙城'];
ok('发抚银招安裁得', DCm.resolveTurmoil('rebel', 'appease') === true);
st = DCm.state();
ok('招安：国库-80 乙城城望-3 属城保住 账收案', st.treasury === 420 && REP['乙城'] === repPreAppease - 3 && st.vassals.length === 1 && !!st.turmoilDone.rebel && st.turmoilDone.rebel.choice === 'appease');

// ---------- 18. 藩王叛乱：御驾亲征（胜） ----------
DAY = 2100;
calmImport({
    treasury: 500, vassals: [{ city: '乙城', day: 1 }],
    turmoilDone: { famine: { day: 1 }, heir: { day: 1 }, historian: { day: 1 } },
    lastTurmoilDay: 1900, monthSettled: Math.floor(DAY / 30)
});
DCm.maybeTurmoil();
battleLog.length = 0;
ok('御驾亲征裁得（真仗转进行中）', DCm.resolveTurmoil('rebel', 'crush') === true);
st = DCm.state();
ok('平叛真仗拉起（_isRebelFight 旗 + 城名）', st.pending === null && st.pendingRebel && st.pendingRebel.city === '乙城' && battleLog.length === 1 && battleLog[0]._isRebelFight === true && battleLog[0].city === '乙城');
ok('叛乱真仗压着不许远征（内忧不除何以远征）', DCm.conquestOk('丙城').ok === false && DCm.conquestOk('丙城').why.indexOf('内忧不除') >= 0);
const notoPreRebelW = CD().notoriety, repPreRebelW = REP['乙城'];
sandbox.currentBattle = null;
DCm.settleRebelFight(true);
st = DCm.state();
ok('剿胜：抄没叛产+50 城望+3 恶名+2 属城保住', st.treasury === 550 && REP['乙城'] === repPreRebelW + 3 && CD().notoriety === notoPreRebelW + 2 && st.vassals.length === 1);
ok('剿胜收案（choice=crush-win）', st.pendingRebel === null && st.turmoilDone.rebel && st.turmoilDone.rebel.choice === 'crush-win');
DCm.settleRebelFight(true);
ok('没有叛乱时结算空转', DCm.state().treasury === 550);

// ---------- 19. 藩王叛乱：御驾亲征（败 · 城墙减半） ----------
DAY = 2200;
function rebelSetup(over) {
    calmImport(Object.assign({
        treasury: 500, vassals: [{ city: '乙城', day: 1 }],
        turmoilDone: { famine: { day: 1 }, heir: { day: 1 }, historian: { day: 1 } },
        lastTurmoilDay: 1900, monthSettled: Math.floor(DAY / 30)
    }, over || {}));
    DCm.maybeTurmoil();
    DCm.resolveTurmoil('rebel', 'crush');
    sandbox.currentBattle = null;
}
rebelSetup();
const repPreRebelL = REP['甲城'];
DCm.settleRebelFight(false);
st = DCm.state();
ok('剿败：乙城自立（属城-1）+ 国库-50 + 都城城望-5', st.vassals.length === 0 && st.treasury === 450 && REP['甲城'] === repPreRebelL - 5);
ok('剿败收案（choice=crush-lose）', st.turmoilDone.rebel.choice === 'crush-lose');
DAY = 2250;
rebelSetup({ works: { wall: 1900 } });
DCm.settleRebelFight(false);
ok('有城墙：剿败国库损失减半（25）', DCm.state().treasury === 475, String(DCm.state().treasury));

// ---------- 20. 开国纪年（编年史自动记年） ----------
DAY = 2300;
calmImport({ foundDay: 1900, treasury: 300, yearCount: 0, monthSettled: Math.floor(DAY / 30) });
DCm.dailyTick();
st = DCm.state();
ok('满一年自动记「国庆」一笔', st.yearCount === 1 && st.chronicle.some(c => c.text.indexOf('国庆') >= 0));
DCm.dailyTick();
ok('同年不重复记', DCm.state().yearCount === 1);

// ---------- 21. 终局：天下鼎沸（无储无祀） ----------
glEnthrone();   // GL 账归位（无 faith 无 earthgod）
DAY = 2400;
reg['dynastyCourt'].reset();
ok('没香火举国飞升亮锁', DCm.endingOk('ascend').ok === false && DCm.endingOk('ascend').why.indexOf('香火线') >= 0);
ok('没太子禅位亮锁', DCm.endingOk('abdicate').ok === false && DCm.endingOk('abdicate').why.indexOf('太子') >= 0);
ok('预选被锁时存不进', DCm.setEndingPref('ascend') === false && DCm.setEndingPref('abdicate') === false);
ok('没有第三条路', DCm.endingOk('nope').ok === false);
DCm.initCourt();
DCm.onAscend();
st = DCm.state();
ok('无储无祀飞升 → 天下鼎沸', st.ending === 'collapse' && journalLog.some(j => j.title === '天下鼎沸'));
ok('翻到末页：朝堂散了', DCm.courtOk().ok === false && DCm.courtOk().why.indexOf('天下鼎沸') >= 0);
const treasFreeze = st.treasury;
DAY = 2430;
DCm.dailyTick();
ok('终局后冻结：不再过账不再上奏', DCm.state().treasury === treasFreeze && DCm.state().pending === null);
ok('终局后收入支出归零', DCm.incomeOf() === 0 && DCm.expenseOf() === 0);
ok('终局后风波全停', DCm.turmoilCond('famine') === false && DCm.maybeTurmoil() === false);

// ---------- 22. 终局：禅位太子 ----------
DAY = 2400;
dcImport({ turmoilDone: ALL_DONE, lastTurmoilDay: DAY, heir: { kind: 'child', name: '李小灵', day: 1400 } });
ok('有储则禅位路开', DCm.endingOk('abdicate').ok === true);
ok('禅位预选存进 + 编年史记谕', DCm.setEndingPref('abdicate') === true && DCm.state().endingPref === 'abdicate' && DCm.state().chronicle.some(c => c.text.indexOf('禅位太子') >= 0));
const repPreAbd = REP['甲城'];
DCm.onAscend();
st = DCm.state();
ok('飞升日禅位：太子嗣位 + 都城城望+10 + 见闻账', st.ending === 'abdicate' && REP['甲城'] === repPreAbd + 10 && journalLog.some(j => j.title === '禅位太子'));

// ---------- 23. 终局：举国飞升（须香火线） ----------
REALM = '元婴'; CD().karma = 20; REP['甲城'] = 60; STONES = 99999;
ok('设坛传教（GL 现成线）', sandbox.GrandLegacy.doPreach() === true);
const followers = sandbox.GrandLegacy.state().faith.followers;
ok('香火线就位', followers > 0);
DAY = 2500;
dcImport({ turmoilDone: ALL_DONE, lastTurmoilDay: DAY, monthSettled: Math.floor(DAY / 30) });
ok('有香火则举国飞升路开', DCm.endingOk('ascend').ok === true);
ok('举国飞升预选存进', DCm.setEndingPref('ascend') === true && DCm.state().endingPref === 'ascend');
CD().incense = 0;
DCm.onAscend();
st = DCm.state();
const expInc = 100 + Math.floor(followers / 10);
ok('飞升日举国飞升：国祚化香火（100+信众/10）', st.ending === 'ascend' && CD().incense === expInc, CD().incense + ' vs ' + expInc);
ok('举国飞升入见闻账', journalLog.some(j => j.title === '举国飞升'));
// 有香火但没预选 → 仍走禅位/鼎沸分支（不抢跑）
reg['dynastyCourt'].reset();
DCm.initCourt();
DCm.onAscend();
ok('没预选飞升时不硬走举国路（无储 → 鼎沸）', DCm.state().ending === 'collapse');

// ---------- 24. 读档归一化（坏账不进门） ----------
glEnthrone();
DAY = 2600;
dcImport({
    treasury: -50,
    monthSettled: 99999,
    vassals: [{ city: '甲城', day: 1 }, { city: '乙城', day: 2 }, { city: '乙城', day: 3 }, { city: '戊城', day: 4 }, { city: '丙城', day: 5 }, { city: '丁城', day: 6 }, { city: '庚城', day: 7 }],
    heir: { kind: 'cousin', name: 'x', day: 1 },
    works: { palace: 1, temple: 2 },
    turmoilDone: { famine: { day: 1, choice: 'remit' }, plague: { day: 2 } },
    taxReliefUntil: 99999999,
    ending: 'xyz',
    conquering: { city: '甲城', day: 1 },
    pendingRebel: { city: '庚城' },
    chronicle: Array.from({ length: 65 }, (_, i) => ({ day: i, text: 'y'.repeat(300) }))
});
st = DCm.state();
ok('负国库夹回 0', st.treasury === 0);
ok('未来月戳夹回本月', st.monthSettled === Math.floor(2600 / 30));
ok('属城：剔都城/去重/剔舆图外/上限 3', st.vassals.length === 3 && st.vassals.map(v => v.city).join(',') === '乙城,丙城,丁城', JSON.stringify(st.vassals));
ok('野种太子不认（kind 白名单）', st.heir === null);
ok('没名目的工程不认', !!st.works.palace && !st.works.temple);
ok('没名目的风波账不认', !!st.turmoilDone.famine && !st.turmoilDone.plague);
ok('蠲免止日夹回合理区间', st.taxReliefUntil <= 2600 + 3600);
ok('野终局名不认', st.ending === null);
ok('征伐中的都城剔掉', st.conquering === null);
ok('非属城的叛乱剔掉', st.pendingRebel === null);
ok('编年史截 60 笔、单笔截 200 字', st.chronicle.length === 60 && st.chronicle[0].text.length === 200);
// 太子名截 12 字 + 好账成对往返
dcImport({ heir: { kind: 'disciple', name: 'd'.repeat(20), day: 5 }, conquering: { city: '乙城', day: 5 }, pendingRebel: null });
st = DCm.state();
ok('太子名截 12 字 + 合法征伐进行中保留', st.heir && st.heir.name.length === 12 && st.conquering && st.conquering.city === '乙城');
// 已裁过的风波奏折不复活；未裁且合条件的保留
dcImport({ turmoilDone: { famine: { day: 1, choice: 'remit' } }, pending: { id: 'famine', day: 2600 } });
ok('已裁过的奏折不复活', DCm.state().pending === null);
dcImport({ pending: { id: 'famine', day: 2600 } });
ok('未裁且合条件的奏折保留', DCm.state().pending && DCm.state().pending.id === 'famine');
// 终局账：进行中的仗与奏折全清 + 预选随终局作废
dcImport({ ending: 'ascend', endingPref: 'abdicate', pending: { id: 'famine', day: 2600 }, conquering: { city: '乙城', day: 1 }, pendingRebel: { city: '乙城' }, vassals: [{ city: '乙城', day: 1 }] });
st = DCm.state();
ok('翻到末页的账：进行中全清 + 预选作废', st.ending === 'ascend' && st.pending === null && st.conquering === null && st.pendingRebel === null && st.endingPref === '');

// ---------- 25. 面板牌面 ----------
DAY = 2700;
calmImport({ treasury: 800, vassals: [{ city: '乙城', day: 1 }], works: { wall: 1900 }, monthSettled: Math.floor(DAY / 30) });
ok('面板开得起', DCm.open() === true && !!modals.__modal);
let html = modals.__modal.html;
ok('牌面五区齐（国库/东宫/属城征伐/大工程/终局/编年史）',
    html.indexOf('国库') >= 0 && html.indexOf('东宫') >= 0 && html.indexOf('属城与征伐') >= 0 && html.indexOf('大工程') >= 0 && html.indexOf('终局') >= 0 && html.indexOf('编年史') >= 0);
ok('牌面写国号与纪年', html.indexOf('大李') >= 0 && html.indexOf('回大业名册') >= 0);
ok('v27.9 牌头写年号纪年 + 中宫皇后', html.indexOf('洪武') >= 0 && html.indexOf('中宫：皇后') >= 0 && html.indexOf('云童') >= 0);
ok('城墙已落成显示 ✅', html.indexOf('修城墙已落成') >= 0);
// 灾年奏折在案 → 三策按钮全列
dcImport({ pending: { id: 'famine', day: DAY }, turmoilDone: {}, monthSettled: Math.floor(DAY / 30) });
DCm.open();
html = modals.__modal.html;
ok('灾年奏折：三策明账按钮全列', html.indexOf('蠲免赋税') >= 0 && html.indexOf('开仓赈济') >= 0 && html.indexOf('置之不理') >= 0);
// 叛乱真仗进行中 → 续战按钮
calmImport({ vassals: [{ city: '乙城', day: 1 }], pendingRebel: { city: '乙城' }, turmoilDone: { famine: { day: 1 }, heir: { day: 1 }, historian: { day: 1 } }, monthSettled: Math.floor(DAY / 30) });
DCm.open();
html = modals.__modal.html;
ok('叛乱进行中：接着平叛按钮在', html.indexOf('接着平叛') >= 0 && html.indexOf('乙城') >= 0);
// 无子无徒 → 东宫亮锁
reg['dynastyCourt'].reset();
DCm.initCourt();
CD()._children = []; mySects = [];
DCm.open();
html = modals.__modal.html;
ok('东宫无候选时亮锁写缘故', html.indexOf('膝下无子、门下无徒') >= 0);

// ---------- 26. v27.8 长安线：讨逆诏 → 扣使拒诏 → 讨逆军真仗 → 城下破军收官 ----------
DAY = 3000;
calmImport({ changan: { phase: 'edict', edictDay: 3000 } });
CD().fame = 0; CD().notoriety = 0;
ok('使臣候着：风波压着不上奏', DCm.turmoilCond('famine') === false);
ok('使臣候着：征伐/号召全压着', DCm.conquestOk('丙城').ok === false && DCm.conquestOk('丙城').why.indexOf('先回诏') >= 0 && DCm.summonOk('丙城').ok === false);
ok('野回话不受理', DCm.resolveEdict('nonsense') === false && DCm.state().changan.phase === 'edict');
ok('扣使拒诏', DCm.resolveEdict('defy') === true);
st = DCm.state();
ok('拒诏：名望+3 恶名+2 讨逆军六十日到期', CD().fame === 3 && CD().notoriety === 2 && st.changan.phase === 'defy' && st.changan.warDue === 3060);
ok('拒诏入编年史（八字回书）', st.chronicle.some(c => c.text.indexOf('天命靡常') >= 0));
DAY = 3030;
DCm.dailyTick();
ok('未到兵期讨逆军不来', DCm.state().changan.phase === 'defy');
DAY = 3060;
DCm.dailyTick();
st = DCm.state();
ok('兵期到：讨逆军兵临城下', st.changan.phase === 'war' && st.changan.warDue === 0);
ok('兵临城下：征伐/号召压着', DCm.conquestOk('丙城').ok === false && DCm.conquestOk('丙城').why.indexOf('兵临城下') >= 0 && DCm.summonOk('丙城').ok === false);
battleLog.length = 0;
ok('御敌拉讨逆真仗（_isPunitiveFight 旗 + boss 档）', DCm.startPunitive() === true && battleLog.length === 1 && battleLog[0]._isPunitiveFight === true && battleLog[0].type === 'boss');
ok('城下打着不重复拉', DCm.startPunitive() === false);
sandbox.currentBattle = null;
const treasPrePunL = DCm.state().treasury, repPrePunL = REP['甲城'], notoPrePunL = CD().notoriety;
DCm.settlePunitiveFight(false);
st = DCm.state();
ok('败：赔款 200（无城墙）都城城望-5 恶名+2', st.treasury === treasPrePunL - 200 && REP['甲城'] === repPrePunL - 5 && CD().notoriety === notoPrePunL + 2, String(st.treasury));
ok('败后九十日长安再发兵', st.changan.phase === 'defy' && st.changan.warDue === 3150);
DCm.settlePunitiveFight(true);
ok('没有兵临城下时结算空转', DCm.state().changan.phase === 'defy');
DAY = 3150;
calmImport({ treasury: 500, works: { wall: 3000 }, changan: { phase: 'defy', warDue: 3150 } });
DCm.dailyTick();
ok('再至兵期讨逆军又来', DCm.state().changan.phase === 'war');
sandbox.currentBattle = null;
DCm.startPunitive();
sandbox.currentBattle = null;
const treasPrePunL2 = DCm.state().treasury;
DCm.settlePunitiveFight(false);
ok('有城墙：讨逆败赔款减半（100）', DCm.state().treasury === treasPrePunL2 - 100 && DCm.state().changan.warDue === 3240, String(DCm.state().treasury));
DAY = 3240;
calmImport({ treasury: 500, changan: { phase: 'defy', warDue: 3240 } });
DCm.dailyTick();
sandbox.currentBattle = null;
DCm.startPunitive();
sandbox.currentBattle = null;
const famePrePunW = CD().fame, repPrePunW = REP['甲城'], treasPrePunW = DCm.state().treasury;
DCm.settlePunitiveFight(true);
st = DCm.state();
ok('城下破讨逆军：名望+10 都城城望+5 犒军绢帛 100 入库', CD().fame === famePrePunW + 10 && REP['甲城'] === repPrePunW + 5 && st.treasury === treasPrePunW + 100);
ok('破军收官（beaten）+ 入见闻账', st.changan.phase === 'beaten' && st.changan.beatenDay === 3240 && journalLog.some(j => j.title === '城下破讨逆军'));
ok('破军入编年史 + 传闻', st.chronicle.some(c => c.text.indexOf('讨逆军大败') >= 0) && deedLog.length > 0);
DAY = 3400;
DCm.dailyTick();
ok('收官后长安不再发兵', DCm.state().changan.phase === 'beaten' && DCm.state().changan.warDue === 0);
ok('收官后征伐/号召畅通无阻', DCm.conquestOk('丙城').ok === true && DCm.summonOk('丙城').ok === true);

// ---------- 27. v27.8 长安线：奉表称藩 → 扩张两城长安震怒 ----------
DAY = 3500;
calmImport({ changan: { phase: 'edict', edictDay: 3500 } });
CD().mood = 80; CD().karma = 0;
const repPreSub = REP['甲城'];
ok('奉表称藩', DCm.resolveEdict('submit') === true);
st = DCm.state();
ok('奉表：心境-5 因果+2 城望+3 察访从零起、不即发兵', CD().mood === 75 && CD().karma === 2 && REP['甲城'] === repPreSub + 3 && st.changan.anger === 0 && st.changan.warDue === 0);
REP['甲城'] = 200; CD().fame = 500;
ok('并第一城：长安察访记一笔（1/2 未发兵）', DCm.summonCity('丙城') === true && DCm.state().changan.anger === 1 && DCm.state().changan.warDue === 0);
ok('并第二城：长安震怒，讨逆军三十日开拔', DCm.summonCity('丁城') === true && DCm.state().changan.anger === 2 && DCm.state().changan.warDue === 3530);
DAY = 3530;
DCm.dailyTick();
ok('察访记满：讨逆军如约兵临城下', DCm.state().changan.phase === 'war');

// ---------- 28. v27.8 号召归附：声望明账，不动刀兵 ----------
DAY = 3600;
calmImport({});
REP['甲城'] = 100; CD().fame = 20;
ok('号召力公式：名望 + 都城城望一半 + 属城×5', DCm.summonPower() === 20 + 50 + 0);
const needPreSnub = DCm.summonNeed('丙城');
ok('民心门槛按城播种（40–79 明账）', needPreSnub >= 40 && needPreSnub <= 79);
ok('自家门派执幡的城召得动且民心减半', DCm.summonOk('丁城').ok === true && DCm.summonOk('丁城').patron === '长青宗' && DCm.summonNeed('丁城') <= 39);
ok('他派护持的城召不动（香火有主城不换幡）', DCm.summonOk('乙城').ok === false && DCm.summonOk('乙城').why.indexOf('香火有主') >= 0 && DCm.summonOk('乙城').why.indexOf('药王谷') >= 0);
ok('但打得——仙凡分治，打的是赋册不是香幡', DCm.conquestOk('乙城').ok === true);
ok('帝都长安召不动也打不得（京畿）', DCm.summonOk('帝都·长安').ok === false && DCm.conquestOk('帝都·长安').ok === false && DCm.conquestOk('帝都·长安').why.indexOf('京畿') >= 0);
ok('仙家胜地不入世争（召不动也打不得）', DCm.summonOk('太虚山').ok === false && DCm.conquestOk('太虚山').ok === false && DCm.conquestOk('太虚山').why.indexOf('仙门') >= 0);
CD().fame = 0; REP['甲城'] = 0;
const treasPreSnub = DCm.state().treasury;
ok('号召力不足照样遣使（明账自负）', DCm.summonOk('丙城').ok === true && DCm.summonOk('丙城').power === 0);
ok('婉拒：礼单 50 照付不退', DCm.summonCity('丙城') === false && DCm.state().treasury === treasPreSnub - 50);
const snub = DCm.state().summons['丙城'];
ok('婉拒绝账：六十日冷却 + 门槛加高十', snub && snub.snubs === 1 && DCm.summonNeed('丙城') === needPreSnub + 10 && DCm.summonOk('丙城').ok === false && DCm.summonOk('丙城').why.indexOf('使节不常来') >= 0);
DAY = 3660;
REP['甲城'] = 100; CD().fame = 500;
ok('满六十日又可遣使', DCm.summonOk('丙城').ok === true);
const repPreSum = REP['丙城'] = 0, famePreSum = CD().fame, treasPreSum = DCm.state().treasury;
ok('丙城献籍归附（不动刀兵）', DCm.summonCity('丙城') === true);
st = DCm.state();
ok('归附：属城+1 礼单出库 该城城望+3 名望+1', st.vassals.length === 1 && st.vassals[0].city === '丙城' && st.treasury === treasPreSum - 50 && REP['丙城'] === repPreSum + 3 && CD().fame === famePreSum + 1);
ok('归附入编年史（使节一纸书贤于十万兵）', st.chronicle.some(c => c.text.indexOf('献籍归附') >= 0) && !st.summons['丙城']);
ok('已是属城不再召', DCm.summonOk('丙城').ok === false && DCm.summonOk('丙城').why.indexOf('已是属城') >= 0);
calmImport({ treasury: 10 });
ok('国库不够礼单：号召亮锁写差多少', DCm.summonOk('丙城').ok === false && DCm.summonOk('丙城').why.indexOf('礼单要 50') >= 0);

// ---------- 29. v27.8 读档归一化（长安线 / 号召账 / 属城舆图） ----------
DAY = 3700;
calmImport({ changan: { phase: 'crazy', warDue: 5, anger: 99, beatenDay: 7 }, summons: { '戊城': { day: 1, snubs: 2 }, '丙城': { day: 2, snubs: 99 }, '太虚山': { day: 3, snubs: 1 } } });
st = DCm.state();
ok('野相位不认（回未答诏）', st.changan.phase === '' && st.changan.warDue === 0 && st.changan.beatenDay === 0);
ok('怒气夹 0..9', st.changan.anger === 9);
ok('号召账：舆图外/仙门剔除、snubs 夹 0..10', !st.summons['戊城'] && !st.summons['太虚山'] && st.summons['丙城'] && st.summons['丙城'].snubs === 10);
calmImport({ changan: { phase: 'submit', warDue: 9999, anger: 1 } });
ok('奉表相位好账成对往返（兵期原样）', DCm.state().changan.phase === 'submit' && DCm.state().changan.warDue === 9999 && DCm.state().changan.anger === 1);
calmImport({ changan: { phase: 'beaten', warDue: 9999, beatenDay: 3150 } });
ok('收官相位：兵期清零、捷日保留', DCm.state().changan.phase === 'beaten' && DCm.state().changan.warDue === 0 && DCm.state().changan.beatenDay === 3150);
calmImport({ changan: { phase: 'war' } });
ok('war 相位可存（读档接着御敌，不留半仗）', DCm.state().changan.phase === 'war');
calmImport({ ending: 'ascend', changan: { phase: 'defy', warDue: 3800 } });
ok('翻到末页：长安线进行中也清', DCm.state().ending === 'ascend' && DCm.state().changan.phase === '' && DCm.state().changan.warDue === 0);
calmImport({ vassals: [{ city: '帝都·长安', day: 1 }, { city: '太虚山', day: 2 }, { city: '丙城', day: 3 }] });
ok('属城账：帝都/仙门坏账剔除', DCm.state().vassals.length === 1 && DCm.state().vassals[0].city === '丙城');

// ---------- 30. v27.8 面板牌面（长安一段 / 城单双路） ----------
DAY = 3800;
calmImport({ changan: { phase: 'edict', edictDay: 3800 } });
DCm.open();
html = modals.__modal.html;
ok('诏书在案：奉表/扣使两条回话全列', html.indexOf('奉表称藩') >= 0 && html.indexOf('扣使拒诏') >= 0);
calmImport({ changan: { phase: 'war' } });
DCm.open();
ok('兵临城下：御敌按钮在、账写明', modals.__modal.html.indexOf('御敌') >= 0 && modals.__modal.html.indexOf('讨逆军') >= 0);
calmImport({ changan: { phase: 'submit', anger: 1 } });
DCm.open();
ok('奉表牌面：察访进度写出来（1/2）', modals.__modal.html.indexOf('1/2') >= 0);
calmImport({ changan: { phase: 'beaten', beatenDay: 3700 } });
DCm.open();
ok('收官牌面：长安不敢东顾', modals.__modal.html.indexOf('长安不敢东顾') >= 0);
calmImport({});
REP['甲城'] = 100; CD().fame = 100;
DCm.open();
html = modals.__modal.html;
ok('城单双路：号召按钮带明账（号召力 vs 民心）', html.indexOf('号召丙城归附') >= 0 && html.indexOf('号召力') >= 0 && html.indexOf('民心') >= 0 && html.indexOf('征丙城') >= 0);
ok('他派护持城：号召按钮亮锁写香幡有主', html.indexOf('香火有主') >= 0 && html.indexOf('药王谷') >= 0);
ok('自家门派执幡城：牌面标注民心减半', html.indexOf('自家门派的幡，民心减半') >= 0);
ok('帝都/仙门不进城单', html.indexOf('号召帝都·长安') < 0 && html.indexOf('征太虚山') < 0);

// ---------- 31. 接线位抽查 ----------
const appSrc = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
ok('app.js 征伐钩子 _isConquestFight 胜负成对', (appSrc.match(/_isConquestFight/g) || []).length >= 2 && appSrc.indexOf('settleConquestFight(true)') >= 0 && appSrc.indexOf('settleConquestFight(false)') >= 0);
ok('app.js 平叛钩子 _isRebelFight 胜负成对', (appSrc.match(/_isRebelFight/g) || []).length >= 2 && appSrc.indexOf('settleRebelFight(true)') >= 0 && appSrc.indexOf('settleRebelFight(false)') >= 0);
ok('app.js 讨逆军钩子 _isPunitiveFight 胜负成对', (appSrc.match(/_isPunitiveFight/g) || []).length >= 2 && appSrc.indexOf('settlePunitiveFight(true)') >= 0 && appSrc.indexOf('settlePunitiveFight(false)') >= 0);
const glSrc = fs.readFileSync(path.join(ROOT, 'js/grand-legacy.js'), 'utf8');
ok('大业名册皇帝段挂「打开朝政」入口', glSrc.indexOf('openDynastyCourt') >= 0 && glSrc.indexOf('window.DynastyCourt') >= 0);
const seSrc = fs.readFileSync(path.join(ROOT, 'js/core/scenario-engine.js'), 'utf8');
ok('情境引擎 grand op 添 court 正门', seSrc.indexOf("'court'") >= 0 && seSrc.indexOf('openDynastyCourt') >= 0);
const mani = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts.manifest.json'), 'utf8'));
const maniPaths = JSON.stringify(mani);
ok('manifest 收录 js/dynasty-court.js', maniPaths.indexOf('js/dynasty-court.js') >= 0);
const htmlSrc = fs.readFileSync(path.join(ROOT, '仙侠.html'), 'utf8');
ok('主页面已挂 dynasty-court.js 脚本标签', htmlSrc.indexOf('js/dynasty-court.js') >= 0);

// ---------- 32. v27.9 登基礼：年号纪年 / 帝后称谓 / 长安见闻 ----------
DAY = 3900;
CD().gender = 'male';
glEnthrone();
// 编年史行文：年号开头 + 男主称「帝」
calmImport({ changan: { phase: 'edict', edictDay: DAY } });
ok('男主 rulerWord 为「帝」', DCm.rulerWord() === '帝');
DCm.resolveEdict('submit');
let lastChron = DCm.state().chronicle[DCm.state().chronicle.length - 1].text;
ok('编年史以「洪武N年」起头（年号纪年）', lastChron.indexOf('洪武') === 0 && /^洪武\d+年/.test(lastChron), lastChron.slice(0, 12));
ok('男主行文称「帝奉表长安」', lastChron.indexOf('帝奉表长安') >= 0);
// 女主称「后」
CD().gender = 'female';
calmImport({ changan: { phase: 'edict', edictDay: DAY } });
ok('女主 rulerWord 为「后」', DCm.rulerWord() === '后');
DCm.resolveEdict('defy');
lastChron = DCm.state().chronicle[DCm.state().chronicle.length - 1].text;
ok('女主行文称「后扣长安之使」（史书一字不改）', lastChron.indexOf('后扣长安之使') >= 0, lastChron.slice(0, 20));
CD().gender = 'male';
// 长安见闻：破讨逆军后行幸长安（一次性 · 入见闻+编年史）
calmImport({ changan: { phase: 'beaten', beatenDay: 3850 } });
gameLogs.length = 0; enterCityCalls.length = 0;
const chronPreVisit = DCm.state().chronicle.length;
ok('行幸长安：原 enterCity 照旧透传', sandbox.enterCity('帝都·长安') === 'entered:帝都·长安' && enterCityCalls[0] === '帝都·长安');
st = DCm.state();
lastChron = st.chronicle[st.chronicle.length - 1].text;
ok('破军后进长安：见闻一笔（戳记日）+ 编年史「行幸长安」', st.changan.beatenSeen === DAY && gameLogs.some(g => g.indexOf('龙幡') >= 0) && st.chronicle.length === chronPreVisit + 1 && lastChron.indexOf('行幸长安') >= 0);
gameLogs.length = 0;
sandbox.enterCity('帝都·长安');
ok('见闻只记一回（再进不重复）', DCm.state().changan.beatenSeen === DAY && !gameLogs.some(g => g.indexOf('龙幡') >= 0));
sandbox.enterCity('甲城');
ok('进的别城不误触长安见闻', !gameLogs.some(g => g.indexOf('龙幡') >= 0 || g.indexOf('海捕文书') >= 0));
// 敌对期进长安：海捕文书的眼色（一次性）
calmImport({ changan: { phase: 'defy', warDue: DAY + 60 } });
gameLogs.length = 0;
sandbox.enterCity('帝都·长安');
st = DCm.state();
ok('敌对期进长安：海捕文书的眼色（一次性）', st.changan.hostileSeen === DAY && gameLogs.some(g => g.indexOf('海捕文书') >= 0));
gameLogs.length = 0;
sandbox.enterCity('帝都·长安');
ok('敌对见闻也只记一回', !gameLogs.some(g => g.indexOf('海捕文书') >= 0));
// 没称帝不误触
reg['grandLegacy'].reset();
gameLogs.length = 0;
sandbox.enterCity('帝都·长安');
ok('没称帝时进长安不误触见闻', gameLogs.length === 0);
glEnthrone();
// 读档归一化：见闻戳夹范围
calmImport({ changan: { phase: 'beaten', beatenDay: 3850, beatenSeen: -5, hostileSeen: 1e12 } });
st = DCm.state();
ok('见闻戳归一化（负数清零 · 超界夹回）', st.changan.beatenSeen === 0 && st.changan.hostileSeen <= 1e9);
calmImport({ changan: { phase: 'beaten', beatenDay: 3850, beatenSeen: 3860, hostileSeen: 3870 } });
ok('见闻戳好账成对往返', DCm.state().changan.beatenSeen === 3860 && DCm.state().changan.hostileSeen === 3870);
// 老档兼容：皇帝没年号 → 纪年退回裸「N年」不炸
reg['grandLegacy'].import({ examPassed: { 1: { day: 1 }, 2: { day: 2 }, 3: { day: 3 } }, office: { city: '甲城', day: 4 }, emperor: { city: '甲城', day: 1000, dynasty: '大李' } });
ok('老档无年号：eraYear 退回裸纪年', DCm.eraYear() === DCm.reignYear() + '年', DCm.eraYear());
reg['grandLegacy'].reset();
glEnthrone();
// v27.9 接线：出口齐
ok('v27.9 出口齐（eraYear/rulerWord/changanVisit）', typeof DCm.eraYear === 'function' && typeof DCm.rulerWord === 'function' && typeof DCm.changanVisit === 'function');
const dcSrc = fs.readFileSync(path.join(ROOT, 'js/dynasty-court.js'), 'utf8');
ok('v27.9 万国来朝口径已清（一国天下）', dcSrc.indexOf('万国来朝') < 0);

console.log('\n结果：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
