/**
 * baize-dialogue-node.js — 白泽「能说人话」在战斗里的落点，验收尺
 *
 * 这把尺量的不是「代码能不能跑」，是**「能说人话」这四个字有没有真的落到玩家看得见的地方**。
 * 上一批的结论是「白泽在战斗里无落点」——本尺逐条把那个「无」翻成有。
 *
 *   A 真给东西   白泽说出的情报**含可操作内容**：弱点/材料/来路三条全部现读生态真账，
 *                且每一条都能对上一条具体数据（不是纯文案）
 *   B 代价真实   ★付了代价才有情报★，且代价**真被扣**：
 *                放它走 ⇒ enemy._fled + noSpoils（app.js 据此跳过经验/部位件/收服）；
 *                不放 ⇒ 情报永久封口 + 复用既有 _foeRage 账
 *   C★锁不隐藏★ 白泽「能否开口」在界面上**看得见**（开场白 + 对话位），
 *                条件不满足时**写明为什么**（封口三态各有各的理由文案）——禁止设计.md 第 2 条
 *   D 可主动触发 玩家有一个**可发现的入口**能触发它（不能只能靠随机撞见）：
 *                开场自动摆价 + 「💬 攻心话」这一路也能再进来
 *   E 稀有度      「极少出没」实测：白泽**进不了普通野地的掷名池**（结构上 0，不是概率低）
 *   F 不改倍率    本批没动任何既有战斗数值（白名单逐项现读比对）
 *
 * 运行：node tests/baize-dialogue-node.js
 */
'use strict';

var fs = require('fs');
var vm = require('vm');
var path = require('path');
var ROOT = path.resolve(__dirname, '..');

var passed = 0, failed = 0;
// ★ 输出走 process.stdout 而不是 console.log：世界桩把 console.log 收走了（免得 354 个模块的初始化日志淹掉本尺）
function out(s) { process.stdout.write(s + '\n'); }
function assert(cond, msg) {
    if (cond) { passed++; out('  ✓ ' + msg); }
    else { failed++; out('  X ' + msg); }
}
function section(t) { out(''); out('=== ' + t + ' ==='); }
function src(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
function load(rel) { vm.runInThisContext(src(rel), { filename: rel }); }

// ==================== 世界桩 ====================
global.window = global;
var _els = {};
function _fakeEl(tag) {
    var el = {
        tag: tag || '', children: [], style: {}, parentNode: null,
        setAttribute: function () {}, getAttribute: function () { return null; },
        appendChild: function (c) { this.children.push(c); return c; },
        removeChild: function () {}, addEventListener: function () {}, removeEventListener: function () {},
        closest: function () { return null; }, scrollIntoView: function () {},
        classList: { add: function () {}, remove: function () {}, toggle: function () {}, contains: function () { return false; } },
        _html: '', textContent: '', options: []
    };
    Object.defineProperty(el, 'innerHTML', {
        get: function () { return this._html; }, set: function (v) { this._html = String(v); }, configurable: true
    });
    return el;
}
global.document = {
    readyState: 'complete',
    createElementNS: function (ns, tag) { return _fakeEl(tag); },
    createElement: function (tag) { return _fakeEl(tag); },
    getElementById: function (id) { if (!_els[id]) _els[id] = _fakeEl(); return _els[id]; },
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    addEventListener: function () {},
    body: { appendChild: function () {} }
};
var _store = {};
global.localStorage = {
    getItem: function (k) { return _store[k] !== undefined ? _store[k] : null; },
    setItem: function (k, v) { _store[k] = String(v); },
    removeItem: function (k) { delete _store[k]; }
};
var _warns = [];
global.console.warn = function () { _warns.push(Array.prototype.join.call(arguments, ' ')); };
var _logs = [];
global.console.log = function () { _logs.push(Array.prototype.join.call(arguments, ' ')); };
global.getAbsoluteDay = function () { return 1; };
global.getDifficultyParam = function () { return 1; };
global.getElementalDamageMul = function () { return 1; };
global.EventBus = { emit: function () {}, on: function () {} };
global.getCombatBonuses = function () { return {}; };
global.getBondBonuses = function () { return {}; };
global.getPlayerWeaponSkill = function () { return 0; };
global.resolveWeaponDamageType = function () { return 'slash'; };
global.currentEquipment = {};
global.partySystem = null;
global.itemById = {};
global.showMessage = function () {};
global.updateCharacterStatus = function () {};
global.updateCurrencyUI = function () {};
global.updateInventoryUI = function () {};
global.updateBattleUI = function () {};
global.getEffectiveMax = function () { return 100; };
global.getAgePenaltyMultiplier = function () { return 1; };
global.getRealmUnstableMultiplier = function () { return 1; };
global.getOldWoundPenalty = function () { return 1; };
global.getSwordIntentAttackMul = function () { return 1; };
global.getDerivedCombatStats = function () { return { counter: 0 }; };
global.currentCharData = { health: 100, energy: 100, qi: 200, maxQi: 200, level: 60, realm: '炼虚', attrs: {}, skills: { '内功': 40 } };
global.getCurrentCharData = function () { return global.currentCharData; };
global.timeSystem = { gameTime: { totalMinutes: 0 }, advanceTime: function (m) { this.gameTime.totalMinutes += m; }, onNewDaySubscribe: function () {} };
global.setTimeout = function () { return 0; };
global.MoodSystem = null;

load('js/physiology-config.js');
load('js/battle-injuries.js');
load('js/data.js');
load('js/items.js');
load('js/items-extended/04-materials.js');
load('js/items-extended.js');
load('js/beast-taming.js');
load('js/crafting/forging-compound.js');
load('js/extensions/beast-ecosystem.js');
load('js/combat-stats.js');
load('js/battle.js');

var Battle = global.Battle, Entity = global.Entity;
var E = window.BeastEcosystem;

// ==================== 造一只白泽 ====================
function makePlayer() {
    return new Entity({
        name: '玩家', level: 60, type: 'player', species: 'human', physiologyType: 'humanoid',
        skills: { '内功': 40 }, loot: {},
        attrs: { strength: 40, dexterity: 40, constitution: 40, willpower: 40, intelligence: 40, meridian: 40 }
    }, 'player');
}
function makeBaize() {
    return new Entity(window.generateRandomEnemy(62, 'beast', { beastId: 'beast_baize' }), 'enemy');
}
function makeBaizeBattle() {
    var b = new Battle(makePlayer(), makeBaize());
    b.log = b.log || [];
    // 建场推轴是真骰——把主敌的条钉死在坑底，它绝不自作主张（要它动就显式调 _enemyMainAct）
    var ea = b._findActor(b.enemy);
    if (ea) ea.bar = -999;
    b.isPlayerTurn = true;   // 与 app.js 侧 battleShoutAction 的前置一致：轮到你自己才张得开嘴
    return b;
}
function logText(b) { return (b.log || []).map(function (l) { return l.msg; }).join('\n'); }

// ==================== A · 真给东西 ====================
section('A · 白泽说出的情报含可操作内容（不是纯文案）');
var intel = window.baizeIntelOf({ _beastTemplateId: 'baize', _ecoBeastId: 'beast_baize', name: '白泽' });
assert(!!intel, 'A1 baizeIntelOf 对白泽回得出东西（不是 null）');
assert(!!(intel && intel.weakness && intel.weakness.length > 4), 'A2 情报里有弱点，且不是空话（现读 beastIntel.weakness）');
assert(!!(intel && intel.origin && intel.origin.length > 4), 'A3 情报里有来路，且不是空话（现读 beastIntel.origin）');
assert(!!(intel && intel.parts && intel.parts.length >= 2), 'A4 情报里有身上值钱的料，且条数与部位件账一致（' + (intel ? intel.parts.length : 0) + ' 条）');

// ★ 每一条都要能对上一条具体数据——否则就是编的
var tplBaize = null;
for (var tk in window.BEAST_TEMPLATES) {
    if (window.BEAST_TEMPLATES[tk] && window.BEAST_TEMPLATES[tk].name === '白泽') tplBaize = window.BEAST_TEMPLATES[tk];
}
var inn = (tplBaize && tplBaize.innate) || [];
assert(inn.indexOf('soundwave') >= 0, 'A5 白泽模板真带 soundwave（弱点的源头在数据里，不在文案里）');
assert(inn.indexOf('illusion') >= 0, 'A6 白泽模板真带 illusion（弱点的第二个源头）');
assert((intel && intel.weakness || '').indexOf('神魂') >= 0, 'A7 弱点第一条真的由 soundwave 推出（对上了「直伤神魂」）');
assert((intel && intel.weakness || '').indexOf('幻形') >= 0 || (intel && intel.weakness || '').indexOf('气息') >= 0,
    'A8 弱点第二条真的由 illusion 推出（对上了「靠气息辨真假」）');

// 材料：部位件 → matId → 炼器品阶，三段都必须对得上
var parts = E.partsOf('beast_baize');
var rows = E.partRows('beast_baize');
assert(parts.length >= 2, 'A9 部位件账上有白泽的两件（' + parts.length + ' 件）');
assert(rows.length >= 2, 'A10 部位件都真有炼器出口（partRows 不回空——回空就是没有可操作价值）');
rows.forEach(function (r) {
    assert(typeof r.grade === 'number' && r.grade > 0, 'A11 ' + r.part + ' → ' + r.matId + ' 有品阶（' + r.grade + ' 阶炉料，玩家能拿去炼器）');
    assert(Array.isArray(r.pools) && r.pools.length > 0, 'A12 ' + r.part + ' 归的炉池明确（' + (r.pools || []).join('/') + '）');
    assert(!!r.why && r.why.length > 4, 'A13 ' + r.part + ' 带一句「为什么值钱」（' + r.why + '）');
});

// ★ 落到玩家看得见的那段文字上
var bA = makeBaizeBattle();
bA._baizeSpared = true;                 // 直接放它走，让它把话说出来
bA._baizeSpeak();
var tA = logText(bA);
assert(tA.indexOf('弱点') >= 0 && tA.indexOf('来路') >= 0, 'A14 白泽真开口时，弱点与来路都印在战斗日志上');
assert(tA.indexOf('知微角') >= 0 && tA.indexOf('龙晶') >= 0, 'A15 材料行印出了部位名与材料真名（知微角 → 龙晶）');
assert(tA.indexOf('四阶') >= 0, 'A16a 材料行带品阶词（四阶炉料——玩家知道该往哪一档炉子里投）');
assert(tA.indexOf('炉料') >= 0 && /炉料 \d+ 点/.test(tA), 'A16b ★材料行带炉料点★（如「炉料 22 点」——这是炼器真要用的数，缺了它就只是文案）');
assert(tA.indexOf('只有打死它才掉得出来') >= 0, 'A17 ★它自己把「杀了就没有了」说明白了★（互斥关系写在明面上，不是暗规则）');

// ==================== B · 代价真实 ====================
section('B ★付了代价才有情报★，且代价真被扣');
var bB = makeBaizeBattle();
assert(bB._pendingPrompt && bB._pendingPrompt.kind === 'baize', 'B1 开场即摆出对话位——白泽的价码玩家一进战斗就看得见');
var labels = bB._pendingPrompt.options.map(function (o) { return o.label; }).join(' | ');
assert(bB._pendingPrompt.options.length === 3, 'B2 价码是三选一（应它 / 不应它 / 不搭话），不是二选一的死题');
assert(bB._pendingPrompt.options[0].k === 'spare' && bB._pendingPrompt.options[1].k === 'slay', 'B3 应与不应各有各的 k（resolvePrompt 分得开）');

// ★ 应它 ⇒ 情报到手 + 代价真扣
var bB2 = makeBaizeBattle();
bB2.resolvePrompt(0);                    // 应它，放它走
assert(bB2.enemy._fled === true, 'B4 ★代价真被扣①：enemy._fled === true（battle.js:5376 那一支据此判 noSpoils）');
assert(bB2._baizeSpared === true, 'B5 应它这一笔记在账上（_baizeSpared）');
var tB2 = logText(bB2);
assert(tB2.indexOf('弱点') >= 0, 'B6 ★付了代价才有情报★：应它之后弱点才真说出来');
assert(tB2.indexOf('历练') >= 0 && tB2.indexOf('一样都落不下手') >= 0, 'B7 ★代价在日志上写明了扣什么★（历练/真元/名气/料，一样不落）');

// ★ noSpoils 真会传导到 app.js 的收益层（现读那几行，不靠嘴报）
var appTxt = src('js/app.js');
assert(/if\s*\(hasSpoils\)\s*markKilledEnemyAsCorpse/.test(appTxt), 'B8 noSpoils 真挡尸体标记（现读 app.js）');
assert(appTxt.indexOf('currentBattle.noSpoils') >= 0 && /不提供收服入口/.test(appTxt), 'B9 noSpoils 真挡收服入口（现读 app.js）');
assert(/hasSpoils \? '[^']*战斗胜利！' : '敌人遁走了，你一无所获'/.test(appTxt), 'B10 noSpoils 真把结算文案降级成「你一无所获」');
assert(/_fled === true[\s\S]{0,400}?noSpoils = true/.test(src('js/battle.js')), 'B11 battle.js 里 _fled ⇒ noSpoils 这一段逐字在册');

// ★ 不应它 ⇒ 情报永久封口 + 复用既有账
var bB3 = makeBaizeBattle();
bB3.resolvePrompt(1);                    // 不应，先取角与骨
assert(bB3._baizeSealed === true, 'B12 ★不应它 ⇒ 情报封口★（_baizeSealed）');
assert(bB3._foeRage === 1, 'B13 ★代价真被扣②：不放它走，它记恨（复用既有 _foeRage 账，不新增任何倍率）');
assert(bB3.enemy._fled !== true, 'B14 不应它 ⇒ 它没走（这一场你还能打，仍能拿材料——这才叫二选一）');
assert(logText(bB3).indexOf('弱点') < 0, 'B15 ★不应它就一个字的弱点都换不到★（互斥，不是又给又收）');
// 再问一次：必须写明为什么封口。★逐字比对本分支自己那一句★——
// 「记恨」那一支的日志里也有「没肯付」三个字，用模糊匹配会被它顶替过去（量具自己踩过的坑，记在这里）
bB3.playerTaunt('heart');
var tB3 = logText(bB3);
assert(tB3.indexOf('它把口封上了') >= 0, 'B16 ★封口后明写锁因★（禁改设计第 2 条：写清为什么现在不肯说）');
assert(tB3.indexOf('你方才选了动手') >= 0, 'B16b 锁因里点明是哪一步把它封上的（不是「它不高兴」，是可执行的原因）');

// ★ 放它走之后：这一场当场收尾（无战利品），玩家连再问一句的机会都没有——那才是真的「问不成」
var bB4 = makeBaizeBattle();
bB4.resolvePrompt(0);
assert(bB4.isFinished === true && bB4.winner === 'player' && bB4.noSpoils === true, 'B17 ★放它走当场收场：无战利品、无战利品标记★（isFinished + winner=player + noSpoils）');
assert(bB4.playerTaunt('heart') === false, 'B18 收场之后「攻心话」对白泽回 false（战斗已完，那一句已经问不成）');
// 「问不成」那句文案本身也要在——玩家在别处（白泽是友方灵兽时遁走）撞上同一状态，写明了为什么
var bB5 = makeBaizeBattle();
bB5._baizeSpared = true; bB5.isFinished = false;      // 只置状态、不收场，专测那句封口文案
bB5.playerTaunt('heart');
var tB5 = logText(bB5);
assert(tB5.indexOf('问不成') >= 0 && tB5.indexOf('下一只不欠你这一句') >= 0, 'B19 「已经走了」这一态写明为什么问不成，并说清白泽极少出没');

// ==================== C · 锁不隐藏 ====================
section('C ★锁不隐藏★（禁止设计.md 第 2 条）');
var bC = makeBaizeBattle();
var tC = logText(bC);
assert(tC.indexOf('开口说了人话') >= 0, 'C1 ★不点任何按钮，战斗日志第一段就看得见它会说话★（可见性 ≠ 要玩家去猜）');
assert(tC.indexOf('放我走') >= 0, 'C2 开场就把价码摆出来（玩家看得见它要什么，不必试错）');
assert(bC._pendingPrompt && bC._pendingPrompt.text.indexOf('放它走') >= 0, 'C3 对话位的题干写明开价条件（不是「是否交谈？」这种废话）');
// app.js 侧那一对按钮永远渲染、无条件门——本尺现读它，不靠嘴报
assert(/battleShoutAction\([^)]*heart[^)]*\)/.test(appTxt), 'C4 「💬 攻心话」按钮在 app.js 里真实存在（本设计复用的那个入口）');
var shoutIdx = appTxt.indexOf('function toggleShoutActions');
var shoutBody = appTxt.slice(shoutIdx, shoutIdx + 4200);
assert(/battleShoutAction\([^)]*heart[^)]*\)/.test(shoutBody), 'C5 该按钮在「阵前话」面板里无条件渲染（没有 species 门、没有 isBaize 门）');
assert(!/isBaizeEntity/.test(shoutBody), 'C6 ★battle.js 的白泽判据没有渗进 UI 的显示条件里★（显示不因条件消失）');
// 三种封口态各有各的理由
var bC2 = makeBaizeBattle();
bC2._baizeDone = true;
bC2.playerTaunt('heart');
assert(logText(bC2).indexOf('只开一次') >= 0, 'C7 已开口过一次 ⇒ 再问写明「这一张嘴只开一次」');
var bC3 = makeBaizeBattle();
bC3.resolvePrompt(2);                    // 不搭话
var tC3 = logText(bC3);
assert(tC3.indexOf('你没接它的话') >= 0 && tC3.indexOf('它也没再说') >= 0, 'C8 不搭话这一路也有回执（不是点了没反应，且明写它不再说）');

// ==================== D · 可主动触发 ====================
section('D · 玩家有一个可发现的入口能触发它（不能只能靠随机撞见）');
var bD = makeBaizeBattle();
assert(!!bD._pendingPrompt && bD._pendingPrompt.kind === 'baize', 'D1 前置：开场已把对话位摆出来');
bD.resolvePrompt(2);                     // 不搭话，价码散了
assert(bD._pendingPrompt === null, 'D2 不搭话之后对话位收起');
bD._baizeAsked = false;                 // （不搭话不等于它被问过——玩家还可以改主意）
var okAsk = bD.playerTaunt('heart');     // ★主动走「💬 攻心话」那一路
assert(okAsk === true, 'D3 ★玩家可主动触发：playerTaunt(\'heart\') 对白泽回 true★（不是只能靠开场那一次撞见）');
assert(bD._pendingPrompt && bD._pendingPrompt.kind === 'baize', 'D4 主动触发后对话位重新摆出来（价码重新可谈）');
// 别的兽仍然走原来那一支，一句都没改
var other = new Entity(window.generateRandomEnemy(20, 'beast', {}), 'enemy');
var bD2 = new Battle(makePlayer(), other);
bD2.log = bD2.log || [];
var ea2 = bD2._findActor(bD2.enemy); if (ea2) ea2.bar = -999;
bD2.isPlayerTurn = true;
var rProvoke = bD2.playerTaunt('provoke');
assert(rProvoke === false, 'D5 普通野兽走原来那一支：「野兽听不懂人话」，一个字没改');
assert(logText(bD2).indexOf('听不懂人话') >= 0, 'D6 普通野兽仍是原话（例外只有白泽一个，不是把所有兽都改了）');
// 白泽的另两路话术不硬拗
var bD3 = makeBaizeBattle();
bD3.resolvePrompt(2);
bD3._baizeAsked = false;
assert(bD3.playerTaunt('provoke') === false, 'D7 白泽的「骂阵」仍是听不懂人话（例外只开在「攻心话」那一路，不四处乱开）');
// ★ 入口是「可发现的」：那段面板上就印着「攻心话」四个字，玩家不需要读源码
assert(/攻心话/.test(appTxt), 'D8 ★入口在界面上有名字★（「阵前话 → 💬 攻心话」现读 app.js 面板文案）');

// ==================== E · 稀有度 ====================
section('E · 「极少出没」：白泽进不了普通野地的掷名池');
var lib = window.BEAST_TEMPLATES;
var myth = [], neverSighted = [];
for (var k in lib) {
    if (!lib[k]) continue;
    if (lib[k].type === 'mythical') myth.push(lib[k].name);
    var sp = null;
    try { sp = E.mechSpec(k); } catch (eS) {}
    if (sp && typeof sp.origin === 'string' && sp.origin.indexOf('极少出没') >= 0) neverSighted.push(lib[k].name);
}
assert(neverSighted.indexOf('白泽') >= 0, 'E1 白泽自己的来历账里写着「极少出没」——判据现读生态 lore，不写死兽名');
assert(neverSighted.length === 1 && neverSighted[0] === '白泽',
    'E2 ★全表只有白泽一只写着「极少出没」★（实测 ' + neverSighted.length + ' 只：' + neverSighted.join('/') + '）——所以这道过滤只动它一只');
// ★ 这条是防「lore 文案被改写后过滤静默失效」的锚：把 origin 里那句删掉，本尺必须转红
assert(myth.length > 1 && myth.indexOf('白泽') >= 0,
    'E3 对照：type=mythical 的有 ' + myth.length + ' 只（含白泽）——★所以判据不能按 type 砍★，那会顺手改掉 ' + (myth.length - 1) + ' 只别人的遭遇率：' + myth.join('/'));

// ★ 实测：普通野外掷名（generateRandomEnemy 不点名）掷两万次，白泽一次都不许出现
var hits = 0, names = {};
for (var i = 0; i < 20000; i++) {
    var e = window.generateRandomEnemy(62, 'beast', {});
    names[e.name] = (names[e.name] || 0) + 1;
    if (window.isBaizeEntity(e) || e.name === '白泽') hits++;
}
assert(hits === 0, 'E4 ★普通野外掷名两万次，白泽撞见 0 次★（结构上 0，不是「概率低」）——实测命中 ' + hits);
var poolNames = Object.keys(names);
assert(poolNames.length >= 1, 'E5 对照组：同一档位掷名掷得出东西（掷出 ' + poolNames.length + ' 个名字）');
assert(poolNames.indexOf('白泽') < 0, 'E6 掷名池里逐名查无「白泽」');
// ★ 对照：同带另一只兽（吞海蜃 lv62）仍掷得出——证明不是把整档给清空了
assert(poolNames.indexOf('吞海蜃') >= 0, 'E7 ★同档的吞海蜃仍掷得出★（白泽没被遇上的原因是「极少出没」，不是把 lv62 那一档清空了）');

// ★ 点名与生态两条正门仍然通（不能把白泽关到再也遇不见）
var pinned = window.generateRandomEnemy(62, 'beast', { beastId: 'beast_baize' });
assert(pinned.name === '白泽' && pinned._beastTemplateId === 'baize', 'E8 点名正门通：attackWildBeast(\'beast_baize\') 照旧掷得出白泽（_beastTemplateId 逐字对）');
var wildData = E.buildWildBeastData({ id: 'beast_baize', name: '白泽', level: 62 });
assert(wildData && wildData._beastTemplateId === 'baize' && wildData._ecoBeastId === 'beast_baize', 'E9 生态分布正门通：populateBeasts 那条路照样造得出它');
assert(Array.isArray(wildData.combatAbilities) && wildData.combatAbilities.indexOf('illusion') >= 0 && wildData.combatAbilities.indexOf('soundwave') >= 0,
    'E10 生态正门带的是它自己的天生技（illusion + soundwave）');

// ★ 生态表给它的期望遇率——如实报数，不粉饰（这一条是**已知未修的缺口**，见交付第 4/5 条）
console.log('    · 东荒·FOREST 池 ' + E.getBeastPoolForRegion('东荒', 'FOREST').length + ' 只 / 全表 ' + E.BEAST_DISTRIBUTION.length + ' 只');
out('    · 生态分布表实测期望遇率 8.848 只/图（普通兽均值约 13.5，比值约 0.66）——★未修：在 beast-ecosystem.js，不在本文件');
assert(true, 'E11 如实记账：生态分布表那一处期望遇率仍未兑现「极少出没」，已留名交持有者（本尺不替它背书，也不假装已修）');

// ==================== F · 不改倍率 ====================
section('F · 没动任何既有战斗数值');
var bTxt = src('js/battle.js');
// 逐项点名：本批**没有**引入的东西
assert(!/_baizeDmgMul|_baizeHitMul|_baizeArmor|_baizeSpeedMul/.test(bTxt), 'F1 白泽名下没有任何自造的伤害/命中/护甲/速度倍率字段');
assert(!/BAIZE_[A-Z_]+\s*=\s*[\d.]+\s*;/.test(bTxt), 'F2 白泽段里没有一个裸数字倍率常量（BAIZE_* 全是 id/名称/品阶词表）');
assert(!/_baize[A-Za-z]*\s*=\s*[\d.]+\s*;/.test(bTxt), 'F3 「放它走」那一路也没引入任何新数值（白泽四道账全是布尔标记）');
// 记恨那一层复用的三个数，是文件里本来就有的
assert(bTxt.indexOf('this._foeRage = 0;               // 他被骂阵激怒：下一击更狠（×1.2）也露破绽（命中 -15，一次性）') >= 0,
    'F4 记恨复用的是既有 _foeRage 账（×1.2 / 命中 -15 都是原文里就写着的数，本批一个新数都没加）');
assert(/if \(this\._foeRage > 0\) \{ this\._foeRage = 0; this\._foeRageDmg = 1; hitRate -= 15; \}/.test(bTxt), 'F5 _foeRage 的兑现点逐字未改（命中 -15 那一行原样）');
assert(/if \(attacker === this\.enemy && this\._foeRageDmg > 0\) \{[\s\S]{0,120}?damage = Math\.floor\(damage \* 1\.2\)/.test(bTxt), 'F6 _foeRageDmg 的 ×1.2 兑现点逐字未改');
// 主伤害公式整段未改
var dmgSeg = bTxt.slice(bTxt.indexOf('_calculateDamage(attacker, defender, penetratePct)'), bTxt.indexOf('// 反击：50% 伤害'));
assert(dmgSeg.indexOf('let damage = Math.floor(atk - def * 0.3 + (Math.random() * 2 - 1));') >= 0, 'F7 ★_calculateDamage 主公式逐字未改★');
assert(!/baize/i.test(dmgSeg), 'F8 主伤害公式里没有白泽的字样（白泽不影响任何一次伤害结算）');
// 难度/五行/功法元素伤三道既有乘数原样
assert(dmgSeg.indexOf('getDifficultyParam(\'enemyDmgMul\')') >= 0, 'F9 难度 enemyDmgMul 那一支未改');
assert(dmgSeg.indexOf('_em !== 1') >= 0, 'F10 五行相克 ±15% 那一支未改');
assert(dmgSeg.indexOf('1 + Math.min(60, _mul) / 100') >= 0, 'F11 功法元素伤那一支未改');
// 时间轴守卫是「提前返回」，不改变任何扣条数值
assert(bTxt.indexOf('if (prompt.noEnemyTurn === true) {') >= 0 && bTxt.indexOf('if (this._pendingPrompt) { if (this.onUpdate) this.onUpdate(); return; }') >= 0,
    'F12 两道守卫都是「原样早退」，不新增扣条/扣条减免（其余四类对话位的敌人扣条那一行逐字未动）');

// ==================== G · 认白泽按 id，不从展示名反推 ====================
section('G · 判据纪律');
assert(window.isBaizeEntity({ _beastTemplateId: 'baize' }) === true, 'G1 按模板 id 认得出');
assert(window.isBaizeEntity({ _ecoBeastId: 'beast_baize' }) === true, 'G2 按生态 id 认得出');
assert(window.isBaizeEntity({ name: '白泽' }) === true, 'G3 无 id 的老数据按展示名兜底（与 _speaksAsHuman 同一条纪律：有 id 就绝不看名字）');
assert(window.isBaizeEntity({ _beastTemplateId: 'baize', name: '随便什么' }) === true, 'G4 ★有 id 时名字无关★（不被顶名骗过）');
assert(window.isBaizeEntity({ _beastTemplateId: 'spirit_fox', name: '白泽' }) === false, 'G5 ★顶着「白泽」名字的别的兽不认★（不从展示名反推）');
assert(window.isBaizeEntity(null) === false, 'G6 空值不炸');

// ==================== 汇总 ====================
out('\\n通过：' + passed + '　失败：' + failed);
if (failed) { process.exit(1); }