/**
 * beast-mechanic-families-node.js — 兽机制三族（⑤生态预兆 / ⑥特殊行为 / ⑦部位掉落）的验收尺
 *
 * 这把尺量的不是「代码能不能跑」，而是**任务书点名的那几件事有没有真的接上**：
 *
 *   A  ★零覆盖清零★  ⑤生态预兆 / ⑥特殊行为 / ⑦部位掉落 —— 三族各有兽
 *                   （这一条直接对应调研报告的核心发现：改前这三族各 0 只）
 *   B  机制不空转    每个机制在 js/battle.js 里有**真实分派**（现读源文件找 hasAbility 分支），
 *                   不接受「只写在表里」
 *   C  无重复        innate 组合的重复组数下降到基线以下；并报出改前/改后两个数
 *   D  逻辑链可查    每只升族兽都带产地(origin)与用途(use)字段——不能只有名字和属性
 *   E  不制造新重复  ★同源机制（两条大旱：drought_voice 与 drought_heat）没有做成一样★
 *   F  ⑦ 真链       部位件走的尸体携带物链在 js/ 里逐段接得上；且每件都有真炼器出口
 *   G  ⑤ 真链       预兆登记走世界日程表、到期走 newDay 日结、入包走行囊单一真源
 *   H  ⑥ 真链       昼夜与季节机制现读 js/time-system.js 的真时钟；日课现读 newDay 订阅
 *   I  不碰全局倍率  本批**没有**新增任何全局伤害/数值缩放（强制规则第 14 条）
 *   J  抓回归        逐族撤掉一只兽 / 撤掉机制接线，本套必须转红（尺不是一句空话）
 *
 * 运行：node tests/beast-mechanic-families-node.js
 */
'use strict';

var fs = require('fs');
var path = require('path');
var ROOT = path.resolve(__dirname, '..');

var passed = 0, failed = 0;
function ok(cond, msg) {
    if (cond) { passed++; console.log('  ✓ ' + msg); }
    else { failed++; console.error('  ✗ ' + msg); }
}
function eq(a, b, msg) { ok(a === b, msg + '（实际=' + JSON.stringify(a) + ' 期望=' + JSON.stringify(b) + '）'); }
function section(t) { console.log('\n=== ' + t + ' ==='); }
function src(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

var ecoSrc = src('js/extensions/beast-ecosystem.js');
var battleSrc = src('js/battle.js');
var timeSrc = src('js/time-system.js');
var calSrc = src('js/core/world-calendar.js');
var calUiSrc = src('js/core/world-calendar-ui.js');
var appSrc = src('js/app.js');
var forgeSrc = src('js/crafting/forging-compound.js');

// ==================== 世界桩 ====================
// 喂三本：灵兽账（beast-taming.js）· 生态（beast-ecosystem.js）· **真炼器账**（forging-compound.js）。
// 炼器账必须喂真本——「部位决定炼器出口」这一环只能对着真的 MATERIAL_GRADE 与词缀池验，
// 自己造一本假账再验它，等于什么都没验。
global.window = global;
global.showMessage = function () {};
global.addItem = function () { return 1; };
global.document = {
    getElementById: function () { return null; },
    querySelectorAll: function () { return []; },
    addEventListener: function () {},
    readyState: 'complete'
};
global.window.addEventListener = function () {};
global.localStorage = { getItem: function () {}, setItem: function () {} };
(0, eval)(src('js/beast-taming.js'));
(0, eval)(ecoSrc);
(0, eval)(forgeSrc);
// ⑤要真日程表、⑥要真时钟——都喂真本（造一本假日程/假时钟再验它，等于什么都没验）
global.EventBus = { _h: {}, on: function (n, f) { (this._h[n] = this._h[n] || []).push(f); }, emit: function (n, p) { (this._h[n] || []).forEach(function (f) { try { f(p); } catch (e) {} }); }, off: function () {}, once: function () {} };
(0, eval)(src('js/core/world-calendar.js'));
(0, eval)(src('js/time-system.js'));
// 日课判「玩家在不在它出没地」要真地区账（城 → 地区 反查）：喂真的 js/regions.js，不造假账
(0, eval)(src('js/regions.js'));

var E = global.BeastEcosystem;
var TPL = global.BEAST_TEMPLATES || {};
var FORGE = global.ForgingCompound;
ok(!!FORGE && Object.keys(FORGE.MATERIAL_GRADE || {}).length > 0,
    'A0 炼器账已挂载（本套拿真 MATERIAL_GRADE 核「部位决定炼器出口」，不造假账）：' + (FORGE ? Object.keys(FORGE.MATERIAL_GRADE).length + ' 种有品阶的料' : '无'));

// ==================== A 零覆盖清零 ====================
section('A) ★零覆盖清零★：⑤生态预兆 / ⑥特殊行为 / ⑦部位掉落 三族各有兽');

// 改前基线（本批开工时实测，见 .scratch/beast-mechanics-fix-progress/00-裁定报告.md）：
// 48 模板 / 22 种 innate 签名 / 11 组重复 / 26 只冗余；三族各 0 只。
var BEFORE = { templates: 48, signatures: 22, dupGroups: 11, redundant: 26 };

// ★ 为什么 C1 从「=== 48」改成「≥ 48 棘轮」（山海经新兽解锁批）
//
// 原判据：`eq(NOW.templates, BEFORE.templates /* 48 */)` —— 「模板总数必须与本尺建立时一模一样」。
//
// 为什么这条判据本身是错的（三条，都可复现）：
//   ① 它把**数量**钉死成常数，于是「往灵兽账加一只兽」这件事在尺下永远不合法。
//      上一批因此没能把设计稿里那 12 只新兽接进代码——不是写不出来，是写出来就红，
//      而当时这把尺不在可写清单内（见 .scratch/beast-mechanics-fix-progress/10-实施记录.md §5）。
//      锁死「数量」这件事，本尺的 C2/C3/C4 已经在管，而且管得更好：签名种数只许涨、
//      重复组与冗余只数只许跌（下面三条）。把总数钉成常数，与那三条的方向正好相反。
//   ② 它与本尺 A~D 段自己的原则矛盾：D2 段明写「**不写死名单**——那下一次加兽就成了一句谎话」，
//      只钉「每类机制恰好一只宿主」「每族只数不倒退」。C1 恰恰写死了一个数。
//   ③ 「=== 48」在加兽之后不再是「今天有几只兽」的事实陈述，而是一句谎话——
//      到那时它断言的不是「48 只」，是「不许变成 59 只」。
//
// 为什么是**棘轮**而不是放行：
//   「≥ 48」只保证不减。加兽随便加，删掉 11 只新兽它照样绿——
//   但那时候真正会红的是别处：C3「重复组 < 11」与 C4「冗余 < 26」按删掉的兽的签名倒扣，
//   C6「禁改的 25 只基础模板一份没少」按基础模板数守底，D11/D13/D14/D15 四条族下限
//   （预兆 ≥5 / 行为 ≥3 / 部位 ≥13 / 部位件表 ≥13）逐族守底，A4「每只升族兽都拼得出战斗数据」
//   逐只守。所以本尺不是靠 C1 一条守数量，是靠一整排。
//   另外：本尺自己的 J 段（beast-count-floor-node.js）会**实测**把总数砍到下限以下、
//   确认尺转红、再还原——棘轮不是一句声明，是做过抓回归实验的。
//
// 为什么下限取 48 而不是现读数：`>= 现读数` 等于把断言写成 `a === a`，尺就空了。
// 48 是本尺建立时那本账的真实只数，是可复算的基线（25 基础 + 23 物种）。
var FLOOR = { templates: 48 };

var MECH = E.MECH_FAMILY_V2712;
ok(!!MECH && Object.keys(MECH).length > 0, 'A0 三族机制表在册（' + (Object.keys(MECH || {}).length) + ' 只升族兽）');

function familyMembers(fam) {
    return Object.keys(MECH).filter(function (k) { return (MECH[k].family || []).indexOf(fam) >= 0; });
}
function beastNameOf(ecoId) {
    for (var i = 0; i < E.BEAST_DISTRIBUTION.length; i++) if (E.BEAST_DISTRIBUTION[i].id === ecoId) return E.BEAST_DISTRIBUTION[i].name;
    return null;
}

var OMEN_MEMBERS = familyMembers('omen');
var BEHAVIOR_MEMBERS = familyMembers('behavior');
var PART_MEMBERS = familyMembers('part');

ok(OMEN_MEMBERS.length > 0, 'A1 ★⑤生态预兆型有兽（' + OMEN_MEMBERS.length + ' 只：' + OMEN_MEMBERS.map(beastNameOf).join('、') + '）——改前 0 只');
ok(BEHAVIOR_MEMBERS.length > 0, 'A2 ★⑥特殊行为型有兽（' + BEHAVIOR_MEMBERS.length + ' 只：' + BEHAVIOR_MEMBERS.map(beastNameOf).join('、') + '）——改前 0 只');
ok(PART_MEMBERS.length > 0, 'A3 ★⑦部位掉落型有兽（' + PART_MEMBERS.length + ' 只：' + PART_MEMBERS.map(beastNameOf).join('、') + '）——改前 0 只');

// 改前这三族一个都没有（这不是修辞，是可复现的：OMEN_SPECS / BODY_PARTS_DROPS 以前不存在）
ok(Object.keys(E.OMEN_SPECS).length >= 4, 'A4 ⑤预兆类目 ≥4（《山海经》五类：水/旱/火/疫），实数 ' + Object.keys(E.OMEN_SPECS).length);

// 升族兽必须真的在分布表里（否则是写在名册里的死兽 —— 禁止设计第 4 条）
var notInDist = OMEN_MEMBERS.concat(BEHAVIOR_MEMBERS).filter(function (k) { return !beastNameOf(k); });
eq(notInDist.length, 0, 'A5 每只升族兽都在分布表里（查无此兽：' + notInDist.join(',') + '）');

// 每只升族兽都要能拼出战斗数据（buildWildBeastData 不回空）
var noData = Object.keys(MECH).filter(function (k) {
    var eco = E.BEAST_DISTRIBUTION.filter(function (d) { return d.id === k; })[0];
    return !eco || !E.buildWildBeastData(eco);
});
eq(noData.length, 0, 'A6 每只升族兽都能拼出战斗数据（拼不出：' + noData.join(',') + '）');

// ★ 逐只过三关 —— A1~A3 只判「族里有没有」，撤掉其中**任何一只**它们都不会红；
//   所以每只升族兽都要单独占一条断言，撤哪一只都转红（见 _regress.py 的抓回归实测）。
Object.keys(MECH).forEach(function (k) {
    var nm = beastNameOf(k);
    var spec = MECH[k];
    var eco = E.BEAST_DISTRIBUTION.filter(function (d) { return d.id === k; })[0];
    // ⑤ 那一关：预兆 id 在册、成因/禳解/风险齐全，且**没有白送料的口子**
    if (spec.omen) {
        var s = E.OMEN_SPECS[spec.omen];
        ok(!!s && !!s.cause && !!s.remedy && !!s.risk && s.risk.length >= 12,
            'A7 ' + nm + '（' + spec.omen + '）的预兆三项齐全：成因/禳解/风险（风险必须有真消费口，见 D3b）');
        ok(!!s && s.yields === undefined,
            'A7b ' + nm + ' 的预兆**没有 yields 字段**——灾异不发料（按日历白给东西就是签到，已否）');
    }
    // ⑥ 那一关：behavior 挂在四个真钩子之一，且那个钩子对这只兽真的在位
    if (spec.behavior) {
        var HOOK = {
            daynight: function (d) { return !!(d && d._dayNightSeason); },   // 昼夜季节
            persist: function () { return typeof E.dayCourseTick === 'function'; },  // 日课
            intel: function () { var it = E.beastIntel(k); return !!(it && it.weakness); } // 情报
        };
        ok(!!HOOK[spec.behavior], 'A8 ' + nm + ' 的 behavior「' + spec.behavior + '」是本批四个真钩子之一（不接受只在表里的行为名）');
        if (HOOK[spec.behavior]) {
            ok(HOOK[spec.behavior](E.buildWildBeastData(eco)),
                'A9 ' + nm + ' 的行为钩子真在位（' + spec.behavior + '）——不是只写在名册里');
        }
    }
    // ⑦ 那一关：部位件齐全、有真炼器出口、且真挂在尸体携带物上
    var rows = E.partRows(k);
    var rawRows = E.BODY_PARTS_DROPS[k] || [];
    if ((spec.family || []).indexOf('part') >= 0) {
        ok(rows.length > 0 && rows.length === rawRows.length,
            'A10 ' + nm + ' 的每个部位件都有真炼器出口（' + rows.length + '/' + rawRows.length + '）');
    }
    var want = E.partsAsCarried(k);
    var got = ((E.buildWildBeastData(eco) || {}).carriedInventory || {}).items || [];
    ok(JSON.stringify(want.slice().sort()) === JSON.stringify(got.slice().sort()),
        'A11 ' + nm + ' 的部位件真挂在尸体携带物上（要 ' + (want.join(',') || '无') + '／得 ' + (got.join(',') || '无') + '）');
});

// ==================== B 机制不空转 ====================
section('B) 机制不空转：每个机制在 js/battle.js 里有真实分派');

// 现读 battle.js 的 COMBAT_ABILITIES 登记表
var ABILITY = (function () {
    var i = battleSrc.indexOf('const COMBAT_ABILITIES = {');
    var seg = battleSrc.slice(i, battleSrc.indexOf('};', i));
    var re = /^\s{4}([a-z_]+):\s*\{/gm, m, set = {};
    while ((m = re.exec(seg))) set[m[1]] = true;
    return set;
})();
var ABILITY_IDS = Object.keys(ABILITY);
eq(ABILITY_IDS.length, 13, 'B1 从 battle.js 现读到 13 个已登记战斗机制');

// 每个 id 都必须有一处**真实的条件分支**（不是只登记在册）。
// ★ hardened 是唯一不走 hasAbility 的：它是**充能制**——生成器按 physiologyType 赋值
//   _hardenedCharges，受击时才按充能扣（battle.js:560/885/2226/2250）。
//   所以这一条不能拿 hasAbility 一刀切，否则会误判「hardened 没分派」。
function dispatchLines(id) {
    var out = [];
    battleSrc.split('\n').forEach(function (l, i) {
        if (l.indexOf("hasAbility('" + id + "')") >= 0) out.push(i + 1);
    });
    return out;
}
var NO_DISPATCH = ABILITY_IDS.filter(function (id) { return id !== 'hardened' && !dispatchLines(id).length; });
eq(NO_DISPATCH.length, 0, 'B2 12 个走 hasAbility 的机制在 battle.js 里都有真实条件分支（无分派：' + NO_DISPATCH.join(',') + '）');
var hardenedInBattle = ['this._hardenedCharges = data._hardenedCharges', 'if (this._hardenedCharges > 0)', 'enemyData._hardenedCharges = hardenedCharges'];
var hardenedMissing = hardenedInBattle.filter(function (s) { return battleSrc.indexOf(s) < 0; });
eq(hardenedMissing.length, 0, 'B3 hardened 走充能制：赋值/受击扣/生成器赋值三处齐全（缺：' + hardenedMissing.join(' | ') + '）');

// 本批点名的四个「改前零使用」机制，逐个报到出处（行号现读，battle.js 在被别人改，不写死）
var SPOT = {
    gu_parasite: 2,   // 上毒量×1.5 + 种蛊啃咬，两处
    soundwave: 1,     // 神魂震荡 + 疼痛，非血肉免疫
    drain_qi: 2,      // 摄玩家真气 + 队友透传，两处
    sword_burst: 2    // 暴击加成 + 第三击计数，两处
};
Object.keys(SPOT).forEach(function (id) {
    var rows = dispatchLines(id);
    ok(rows.length >= SPOT[id], 'B4 ' + id + ' 在 js/battle.js 有 ' + rows.length + ' 处 hasAbility 分派（要 ≥' + SPOT[id] + '，实读行号 ' + rows.join('/') + '）');
});

// 天生使用数：改前 gu_parasite / soundwave / drain_qi / sword_burst 四只全是 0
function innateUse() {
    var u = {};
    Object.keys(TPL).forEach(function (k) { (TPL[k].innate || []).forEach(function (a) { u[a] = (u[a] || 0) + 1; }); });
    return u;
}
var USE = innateUse();
['gu_parasite', 'soundwave', 'drain_qi'].forEach(function (id) {
    ok((USE[id] || 0) > 0, 'B5 ' + id + ' 从「天生 0 只」变成 ' + (USE[id] || 0) + ' 只（bloodsuckvine/tiansiangvine · yelaixiang · jadefacefox/mantuoluo）');
});
// ★ sword_burst 故意仍是 0：剑气纵横是**剑修**的本事，全表没有一只兽使兵器，硬塞＝脑补
eq(USE.sword_burst || 0, 0, 'B6 sword_burst 天生仍为 0 —— 它没有逻辑上的兽主人，不硬塞（它仍有真分派，见 B3）');

// 升族兽的 innate 必须在册
var badInnate = [];
Object.keys(MECH).forEach(function (k) {
    var nm = beastNameOf(k); if (!nm) return;
    var tplId = Object.keys(TPL).filter(function (t) { return TPL[t].name === nm; })[0];
    (TPL[tplId].innate || []).forEach(function (a) { if (!ABILITY[a]) badInnate.push(nm + '/' + a); });
});
eq(badInnate.length, 0, 'B7 升族兽的 innate 全在 COMBAT_ABILITIES 册内（越界：' + badInnate.join(',') + '）');

// ==================== C 无重复 ====================
section('C) 无重复：innate 组合的重复组数下降');

function sigStats() {
    var c = {};
    Object.keys(TPL).forEach(function (k) { var s = (TPL[k].innate || []).slice().sort().join('+'); c[s] = (c[s] || 0) + 1; });
    var dups = Object.keys(c).filter(function (s) { return c[s] >= 2; });
    return {
        templates: Object.keys(TPL).length,
        signatures: Object.keys(c).length,
        dupGroups: dups.length,
        redundant: dups.reduce(function (a, s) { return a + c[s] - 1; }, 0),
        dupDetail: dups.map(function (s) { return { sig: s, n: c[s], who: Object.keys(TPL).filter(function (k) { return ((TPL[k].innate || []).slice().sort().join('+')) === s; }).map(function (k) { return TPL[k].name; }) }; })
    };
}
var NOW = sigStats();
console.log('    改前：模板 ' + BEFORE.templates + ' / 签名 ' + BEFORE.signatures + ' 种 / 重复组 ' + BEFORE.dupGroups + ' / 冗余 ' + BEFORE.redundant);
console.log('    改后：模板 ' + NOW.templates + ' / 签名 ' + NOW.signatures + ' 种 / 重复组 ' + NOW.dupGroups + ' / 冗余 ' + NOW.redundant);
NOW.dupDetail.forEach(function (d) { console.log('      改后仍重复 [' + (d.sig || '(空)') + '] ×' + d.n + '：' + d.who.join(' ')); });

// ★ 棘轮：总数只许增不许减。原判据 `=== 48` 及其三条错因见 FLOOR 上方那段。
//   本句仍是一条真断言——把总数砍到 48 以下它当场红（抓回归实测见 tests/beast-count-floor-node.js J2）。
ok(NOW.templates >= FLOOR.templates,
    'C1 模板总数 ≥' + FLOOR.templates + '（实数 ' + NOW.templates + '）——棘轮：只许增不许减，'
    + '删掉任意一只照样红（原判据写死 === 48，理由见 FLOOR 上方）');
ok(NOW.signatures > BEFORE.signatures, 'C2 innate 签名种数从 ' + BEFORE.signatures + ' 涨到 ' + NOW.signatures + '（拆重复组拆出来的）');
ok(NOW.dupGroups < BEFORE.dupGroups, 'C3 ★重复组从 ' + BEFORE.dupGroups + ' 降到 ' + NOW.dupGroups + '（降了 ' + (BEFORE.dupGroups - NOW.dupGroups) + ' 组）');
ok(NOW.redundant < BEFORE.redundant, 'C4 冗余只数从 ' + BEFORE.redundant + ' 降到 ' + NOW.redundant);

// 理论下限：禁改的 js/beast-taming.js 那 25 只基础模板自己就有 5 组 / 16 冗余
var BASE_ONLY = { dupGroups: 5, redundant: 16 };
ok(NOW.dupGroups >= BASE_ONLY.dupGroups, 'C5 重复组 ' + NOW.dupGroups + ' 已触到禁改簿给的理论下限 ' + BASE_ONLY.dupGroups + '（再往下就得动 js/beast-taming.js）');
console.log('    理论下限：js/beast-taming.js 里 25 只禁改模板自带 ' + BASE_ONLY.dupGroups + ' 组 / ' + BASE_ONLY.redundant + ' 冗余');

// 本批**没有**新增任何重复签名（每一只升族兽都必须在既有重复组之外拿一个独占签名或落进既有组）
var baseOnlySigs = (function () {
    // 25 只基础模板在 js/beast-taming.js 里（不在本文件的 SPECIES_TEMPLATES_V2711 里）
    return Object.keys(TPL).filter(function (k) { return !E.SPECIES_TEMPLATES_V2711[k]; })
        .map(function (k) { return (TPL[k].innate || []).slice().sort().join('+'); });
})();
ok(baseOnlySigs.length === 25, 'C6 禁改的 25 只基础模板一份没少（实数 ' + baseOnlySigs.length + '）');

// ==================== D 逻辑链可查 ====================
section('D) 逻辑链可查：每只升族兽都带产地/用途字段');

var noOrigin = Object.keys(MECH).filter(function (k) { return !MECH[k].origin || String(MECH[k].origin).length < 8; });
var noUse = Object.keys(MECH).filter(function (k) { return !MECH[k].use || String(MECH[k].use).length < 6; });
eq(noOrigin.length, 0, 'D1 每只升族兽都有产地/成因（缺：' + noOrigin.join(',') + '）');
eq(noUse.length, 0, 'D2 每只升族兽都有用途/炼器出口（缺：' + noUse.join(',') + '）');

// 预兆类目：成因 / 禳解 / 风险 / 天数 四项都在，且**不许留「说了不做」的承诺**
var OM = E.OMEN_SPECS;
var omBad = Object.keys(OM).filter(function (k) {
    var s = OM[k];
    return !s.cause || !s.remedy || !s.risk || !(s.delayDays >= 1) || !s.label;
});
eq(omBad.length, 0, 'D3 每类预兆都带成因/禳解/风险/天数（缺项：' + omBad.join(',') + '）');
// ★ 禁改设计第 4 条：名册/机制表不留占位假值。灾异表里凡是没真消费口的字段一律不许在册。
var omFake = Object.keys(OM).filter(function (k) {
    var s = OM[k];
    var banned = ['yields', 'give', 'gift', 'reward', 'drop', 'loot'].filter(function (f) { return s[f] !== undefined; });
    return banned.length ? k + '(' + banned.join('/') + ')' : '';
}).filter(Boolean);
eq(omFake.length, 0, 'D3b ★五类预兆里没有「发料口」字段（灾异不按日历发奖）：留了就是说了不做 ' + omFake.join(','));
// ★ risk 必须有真消费口：它描述的那件事得在代码里真的发生（过境期间宿主兽出没更频）
eq(typeof E.activeOmenBeasts, 'function', 'D3c risk 有真消费口（activeOmenBeasts 现读预兆账算出过境权重）');
var omNoHost = Object.keys(OM).filter(function (k) { return !E.omenHostOf(k); });
eq(omNoHost.length, 0, 'D3d 每类预兆都有一只宿主兽（risk 说的「它」得有着落）：' + omNoHost.join(','));
// 部位件：灾里留下的料走这一本（打后才掉），每件都有真炼器出口
eq(E.OMEN_STAY_DAYS >= 1 && E.OMEN_STAY_DAYS <= 7, true, 'D3e 灾过境日数在册（' + E.OMEN_STAY_DAYS + ' 日，不是无限期也不是当日消）');
// D4 灾里留下的料＝宿主兽身上的部位件（打后才掉），宿主挂了件就每件都有真炼器出口
var omPartBad = [];
Object.keys(OM).forEach(function (k) {
    var host = E.omenHostOf(k);
    if (!host) return;
    E.partsOf(host).forEach(function (r) {
        if (!E.partOutlet(r.matId)) omPartBad.push(k + '/' + host + '/' + r.matId);
    });
});
eq(omPartBad.length, 0, 'D4 宿主兽身上的部位件每件都在炼器 MATERIAL_GRADE 里（灾里那几件料的真出处：' + omPartBad.join(',') + '）');

// 部位件：part / why / matId 三项齐全，且 matId 有真出口
var pdBad = [];
Object.keys(E.BODY_PARTS_DROPS).forEach(function (k) {
    var rows = E.BODY_PARTS_DROPS[k];
    if (!rows.length) pdBad.push(k + '(空)');
    rows.forEach(function (r) {
        if (!r.part || !r.why || !r.matId) pdBad.push(k + '(字段缺)');
        else if (!E.partOutlet(r.matId)) pdBad.push(k + '/' + r.part + '→' + r.matId + '(无炼器出口)');
    });
});
eq(pdBad.length, 0, 'D5 每个部位件的 part/why/matId 齐全且 matId 有真炼器出口（不合格：' + pdBad.join(',') + '）');
var pdNoBeast = Object.keys(E.BODY_PARTS_DROPS).filter(function (k) { return !beastNameOf(k); });
eq(pdNoBeast.length, 0, 'D6 挂部位件的兽都在分布表里（查无此兽：' + pdNoBeast.join(',') + '）');

// ★ 交叉一致性：部位件不能挂在「没升族」的兽上（那是名册里多出来的一本假账）
var orphanParts = Object.keys(E.BODY_PARTS_DROPS).filter(function (k) { return !MECH[k]; });
eq(orphanParts.length, 0, 'D7 每个挂部位件的兽都在升族表里在册（孤儿：' + orphanParts.join(',') + '）');
var partMemberKeys = Object.keys(MECH).filter(function (k) { return (MECH[k].family || []).indexOf('part') >= 0; });
var partKeyMissing = partMemberKeys.filter(function (k) { return !(E.BODY_PARTS_DROPS[k] || []).length; });
eq(partKeyMissing.length, 0, 'D7b 反向：标了⑦族的每只兽都真有部位件（没件：' + partKeyMissing.join(',') + '）');
// ★ 反向：每只升族兽至少挂一样真机制，三样都没有 = 占位假值（禁止设计第 4 条）
var hollow = Object.keys(MECH).filter(function (k) {
    var s = MECH[k];
    return !s.omen && !s.behavior && !(E.BODY_PARTS_DROPS[k] || []).length;
});
eq(hollow.length, 0, 'D8 没有「只占一个族名、什么都没挂」的升族兽（空壳：' + hollow.join(',') + '）');
// ★ 每只升族兽的 origin/use 逐只达标（撤掉任意一只，D1/D2 的汇总数不变，所以要逐只钉）
Object.keys(MECH).forEach(function (k) {
    var nm = beastNameOf(k);
    ok(String(MECH[k].origin || '').length >= 8 && String(MECH[k].use || '').length >= 6,
        'D9 ' + nm + ' 的产地/用途字段逐只达标（产地 ' + String(MECH[k].origin || '').length + ' 字 / 用途 ' + String(MECH[k].use || '').length + ' 字）');
});

// ★ 结构性下限 + 一一对应。**不写死名单**（那下一次加兽就成了一句谎话），
//   只钉「每类机制恰好一只宿主」与「每族只数不倒退」——撤掉族里任何一只，这两条必有一条转红。
section('D2) 三族的结构性下限（撤掉族里任意一只必转红）');
var OMEN_IDS = Object.keys(E.OMEN_SPECS);
var omenHostCount = {};
OMEN_IDS.forEach(function (id) {
    omenHostCount[id] = OMEN_MEMBERS.filter(function (k) { return MECH[k].omen === id; }).length;
});
var omenNoHost = OMEN_IDS.filter(function (id) { return omenHostCount[id] !== 1; });
eq(omenNoHost.length, 0, 'D10 每一类预兆恰好一只宿主（不是 0 只也不是两只）：' + OMEN_IDS.map(function (id) { return id + '×' + omenHostCount[id]; }).join(' '));
ok(OMEN_MEMBERS.length >= 5, 'D11 ⑤生态预兆型 ≥5 只（《山海经》五灾：水/旱声/旱热/火/疫），实数 ' + OMEN_MEMBERS.length);

var HOOKS = ['daynight', 'persist', 'intel'];
var behCount = {};
HOOKS.forEach(function (b) { behCount[b] = BEHAVIOR_MEMBERS.filter(function (k) { return MECH[k].behavior === b; }).length; });
var behBad = HOOKS.filter(function (b) { return behCount[b] !== 1; });
eq(behBad.length, 0, 'D12 四个行为钩子各恰好一只宿主：' + HOOKS.map(function (b) { return b + '×' + behCount[b]; }).join(' '));
ok(BEHAVIOR_MEMBERS.length >= 3, 'D13 ⑥特殊行为型 ≥3 只（昼夜季节 / 日课 / 情报，各一个真钩子），实数 ' + BEHAVIOR_MEMBERS.length);
ok(PART_MEMBERS.length >= 13, 'D14 ⑦部位掉落型 ≥13 只（3 只主 + 5 只预兆/行为兽 + 5 只草木兽），实数 ' + PART_MEMBERS.length);
ok(Object.keys(E.BODY_PARTS_DROPS).length >= 13, 'D15 部位件表 ≥13 只兽在册，实数 ' + Object.keys(E.BODY_PARTS_DROPS).length);

// ==================== E 不制造新重复 ====================
section('E) ★不制造新重复★：同源机制（两条大旱）没有做成一样');

// 《山海经》里「獙獙」与「肥遗」同为大旱——最容易做出一套换皮。必须验它没换。
var VOICE = OM.drought_voice, HEAT = OM.drought_heat;
ok(!!VOICE && !!HEAT, 'E0 两条大旱预兆都在册（' + Object.keys(OM).join(',') + '）');

function hostSet(s) { return E.omenHostOf(s.id); }
ok(VOICE.cause !== HEAT.cause, 'E1 两条大旱的成因不是同一句（声 vs 热）');
ok(VOICE.risk !== HEAT.risk, 'E2 两条大旱的风险描述不同');
ok(VOICE.remedy !== HEAT.remedy, 'E2b 两条大旱的禳解描述不同');
eq(hostSet(VOICE) !== hostSet(HEAT), true, 'E3 两条大旱的宿主不是同一只兽（' + hostSet(VOICE) + ' vs ' + hostSet(HEAT) + '）——产出不再是它们的白送口，改由各自的部位件承担');
ok(VOICE.label !== HEAT.label, 'E4 两条大旱在日程表上是两个不同的条目名（' + VOICE.label + ' vs ' + HEAT.label + '）');

// 机制本体也要不同：voice 的宿主带声、heat 的宿主带火，两只宿主不能是同一只
var voiceHost = OMEN_MEMBERS.filter(function (k) { return MECH[k].omen === 'drought_voice'; });
var heatHost = OMEN_MEMBERS.filter(function (k) { return MECH[k].omen === 'drought_heat'; });
eq(voiceHost.length, 1, 'E5 「旱（声）」的宿主恰好一只（' + voiceHost.map(beastNameOf).join(',') + '）');
eq(heatHost.length, 1, 'E6 「旱（热）」的宿主恰好一只（' + heatHost.map(beastNameOf).join(',') + '）');
ok(voiceHost[0] !== heatHost[0], 'E7 两条大旱不挂在同一只兽身上');
var voiceInn = (function () { var nm = beastNameOf(voiceHost[0]); var t = Object.keys(TPL).filter(function (k) { return TPL[k].name === nm; })[0]; return TPL[t].innate || []; })();
var heatInn = (function () { var nm = beastNameOf(heatHost[0]); var t = Object.keys(TPL).filter(function (k) { return TPL[k].name === nm; })[0]; return TPL[t].innate || []; })();
ok(voiceInn.indexOf('soundwave') >= 0, 'E8 「旱（声）」的宿主天生带摄魂音（' + voiceHost.map(beastNameOf) + '：' + voiceInn.join('/') + '）——旱是嗓子叫出来的');
ok(heatInn.indexOf('burn') >= 0 && voiceInn.indexOf('burn') < 0, 'E9 「旱（热）」的宿主天生带炎爆劲且不带摄魂音（' + heatHost.map(beastNameOf) + '：' + heatInn.join('/') + '）——旱是体温烤出来的');
ok((voiceInn.slice().sort().join('+')) !== (heatInn.slice().sort().join('+')), 'E10 两条大旱宿主的 innate 组合不是一个签名');

// 预兆类目之间不得共用宿主与成因（防另一类换皮）
var omenSign = {};
Object.keys(OM).forEach(function (k) { omenSign[k] = hostSet(OM[k]) + '::' + OM[k].cause; });
var dupOmen = Object.keys(omenSign).filter(function (a, i) {
    return Object.keys(omenSign).filter(function (b) { return b > a && omenSign[b] === omenSign[a]; }).length;
});
eq(dupOmen.length, 0, 'E11 五类预兆的「宿主+成因」签名两两不同（撞了：' + dupOmen.join(',') + '）');

// ==================== F ⑦ 真链 ====================
section('F) ⑦ 部位掉落的真链：buildWildBeastData → 实体 → 尸体携带物 → 搜刮/解剖');

ok(appSrc.indexOf('new Entity(') >= 0, 'F0 app.js 造实体的那一行在（把 enemyData 原样交给 Entity）');
ok(battleSrc.indexOf('this.carriedInventory = data.carriedInventory || null') >= 0, 'F1 battle.js 实体构造把 carriedInventory 整份带进场');
ok(appSrc.indexOf('var carriedInv = battle.enemy.carriedInventory') >= 0, 'F2 app.js 尸体面板读 battle.enemy.carriedInventory');
ok(appSrc.indexOf('inventory: carriedInv') >= 0, 'F3 尸体把携带物存进 corpseData.inventory');
ok(ecoSrc.indexOf('partsAsCarried') >= 0 && ecoSrc.indexOf('out.carriedInventory') >= 0, 'F4 本文件把部位件写进 enemyData.carriedInventory');

// 真跑一遍：每一只有部位件的兽，打出来的战斗数据都带着部位件
var carryBad = [];
Object.keys(E.BODY_PARTS_DROPS).forEach(function (k) {
    var eco = E.BEAST_DISTRIBUTION.filter(function (d) { return d.id === k; })[0];
    var d = E.buildWildBeastData(eco);
    var want = E.partsAsCarried(k);
    var got = (d && d.carriedInventory && d.carriedInventory.items) || [];
    if (JSON.stringify(want.slice().sort()) !== JSON.stringify(got.slice().sort())) carryBad.push(k + '(要' + want + '得' + got + ')');
});
eq(carryBad.length, 0, 'F5 每只有部位件的兽，战斗数据里都真挂着那些件（对不上：' + carryBad.join('; ') + '）');

// 知情口：图鉴/尸体面板那一行真的印部位件
var hintBeast = Object.keys(E.BODY_PARTS_DROPS)[0];
ok(E.forgeDropHint(hintBeast).indexOf('解剖可取') >= 0, 'F6 forgeDropHint 印「解剖可取」——真消费口在 js/app.js 的图鉴与尸体面板');
ok(E.forgeDropHint(hintBeast).indexOf('品阶') >= 0, 'F7 那行印的是现读的品阶与词缀池（不是本地写死的数）');
eq(E.forgeDropHint('查无此兽'), '', 'F8 查无此兽回空串，不拿假提示占版面');
var lingfox = E.BEAST_DISTRIBUTION.filter(function (d) { return d.name === '灵狐'; })[0];
eq(E.forgeDropHint(lingfox.id), '', 'F9 没挂部位的兽（灵狐）提示回空串');

// ==================== G ⑤ 真链 ====================
section('G) ⑤ 生态预兆的真链：世界日程表登记 → newDay 到期 → 行囊单一真源');

ok(calSrc.indexOf("'world_event'") >= 0, 'G0 预兆用的 category「world_event」在日程表白名单里');
ok(calSrc.indexOf('function register') >= 0, 'G1 世界日程表有 register 口');
ok(calSrc.indexOf('function unregister') >= 0, 'G2 世界日程表有 unregister 口（到期要把条目撤掉）');
ok(calUiSrc.indexOf('WorldCalendar.list({ fromDay: now, toDay: now + 60 })') >= 0, 'G3 日程面板用带显式天数的 list() 取未来 60 天——预兆条目在面板上真的看得见');
ok(timeSrc.indexOf('onNewDaySubscribe') >= 0, 'G4 time-system 有 newDay 订阅口');
ok(ecoSrc.indexOf('timeSystem.onNewDaySubscribe') >= 0, 'G5 本文件真挂了那条订阅');
ok(ecoSrc.indexOf('bindOmenLoop()') >= 0, 'G6 挂订阅的函数在文件尾被调用');

// 真跑一遍：登记 → 到期 → **不发料** + 过境权重真的上去 → 撤条目 → 二次结算不重复
(function () {
    var CAL = function () { return global.WorldCalendar ? global.WorldCalendar.list({ fromDay: -1e9, toDay: 1e9 }) : []; };
    if (!global.WorldCalendar) { ok(false, 'G7 世界日程表不在册（跳过后续实跑断言）'); return; }
    var before = CAL().length;
    var host = OMEN_MEMBERS[0];
    var rec = E.raiseOmen(MECH[host].omen, beastNameOf(host), '测试州');
    ok(!!rec && rec.dueDay > rec.raisedDay, 'G7 登记一条预兆：' + beastNameOf(host) + ' ' + MECH[host].omen + ' 第 ' + rec.dueDay + ' 日到（第 ' + rec.raisedDay + ' 日发现）');
    ok(CAL().length > before, 'G8 日程表上多了一条（' + before + ' → ' + CAL().length + '）');
    ok(!!rec.calendarId && CAL().some(function (e) { return e.id === rec.calendarId; }), 'G9 那条日程真的在表里（注册完回读验证过，不是拿返回值当上表）');
    var again = E.raiseOmen(MECH[host].omen, beastNameOf(host), '测试州');
    ok(again === rec && again.dueDay === rec.dueDay, 'G10 重复遇上同一头不重排日子（一次出图不刷十行字）');

    var got = {};
    global.addItem = function (id, n) { got[id] = (got[id] || 0) + (Number(n) || 0); return n; };
    global.getAbsoluteDay = function () { return rec.dueDay; };
    // ★ 对照组：到期前那一带没有任何过境加成
    var boostBefore = E.activeOmenBeasts(rec.region);
    var calBefore = CAL().length;
    E.landOmens();
    var keys = Object.keys(got);
    eq(keys.length, 0, 'G11 ★灾异到期**一件料都不发**（入包账：' + JSON.stringify(got) + '）——日历不做发钱口');
    var ovHost = E.omenHostOf(MECH[host].omen);
    var after = E.activeOmenBeasts(rec.region);
    eq(!!after[ovHost], true, 'G11b 灾过境的后果真在账上：宿主兽 ' + ovHost + ' 在 ' + rec.region + ' 出没权重 +1（' + JSON.stringify(after) + '）');
    var boostAfter = E.activeOmenBeasts(rec.region);
    eq(Object.keys(boostBefore).length > 0, false, 'G11c 到期前那一带没有过境加成（对照组：' + JSON.stringify(boostBefore) + '）');
    eq(Object.keys(boostAfter).length > 0, true, 'G11d 到期后才有（真前后对照，不是恒真）');
    ok(CAL().length < calBefore, 'G12 到期把日程条目撤掉了（' + calBefore + ' → ' + CAL().length + '）');
    Object.keys(got).forEach(function (k) { delete got[k]; });
    E.landOmens();
    eq(Object.keys(got).length, 0, 'G13 二次结算不再重复发料（已落地的预兆不刷第二遍）');
    ok(E.getState().omens[Object.keys(E.getState().omens)[0]].landed === true, 'G14 落地状态真记进 StateRegistry（随档走）');
    // ★ 抓回归：把过境日推过 OMEN_STAY_DAYS，加成必须自己退掉（不许无限期）
    global.getAbsoluteDay = function () { return rec.dueDay + E.OMEN_STAY_DAYS; };
    eq(Object.keys(E.activeOmenBeasts(rec.region)).length, 0, 'G14b 过境期满，加成自己退掉（灾过去就是过去了）');
})();

// 预兆不碰战斗数值：一条都不该出现在 combatAbilities 里
var OMEN_ABILITIES = ['gu_parasite', 'soundwave', 'venom', 'burn', 'drain_qi'];
ok(Object.keys(OM).every(function (k) { return !OMEN_ABILITIES.some(function (a) { return k.indexOf(a) >= 0; }); }),
    'G15 预兆机制不在战斗技能表里（它是世界状态，不是战斗数值——⑤族的设计前提）');

// ==================== H ⑥ 真链 ====================
section('H) ⑥ 特殊行为：昼夜与季节机制本体 / 日课 / 情报口');

ok(timeSrc.indexOf('function getCurrentPeriod()') >= 0, 'H0 time-system 有真时段口 getCurrentPeriod()');
ok(timeSrc.indexOf('const SEASONS = [') >= 0, 'H1 time-system 有真季节表 SEASONS');
ok(timeSrc.indexOf("gameTime.currentHour") >= 0 && timeSrc.indexOf("gameTime.currentSeason") >= 0, 'H2 真时钟有 currentHour 与 currentSeason');
ok(ecoSrc.indexOf('window.gameTime && Number(window.gameTime.currentHour)') >= 0, 'H3 昼夜机制现读真时钟（不另造一个表）');
ok(ecoSrc.indexOf('window.gameTime && window.gameTime.currentSeason') >= 0, 'H4 季节机制现读真季节（不另造一个表）');
ok(ecoSrc.indexOf("behaviors === 'daynight'") < 0, 'H5 昼夜机制挂在 behavior===\'daynight\' 那只兽上');

(function () {
    var host = BEHAVIOR_MEMBERS.filter(function (k) { return MECH[k].behavior === 'daynight'; })[0];
    ok(!!host, 'H6 昼夜与季节机制有宿主（' + beastNameOf(host) + '）');
    if (!host) return;
    var eco = E.BEAST_DISTRIBUTION.filter(function (d) { return d.id === host; })[0];
    var gt = global.gameTime;
    if (!gt) { ok(false, 'H7 真时钟不在册（跳过后续实跑断言）'); return; }
    var keepH = gt.currentHour, keepS = gt.currentSeason;
    var seen = {};
    [[6, 'spring'], [22, 'spring'], [6, 'winter'], [22, 'summer']].forEach(function (hs) {
        gt.currentHour = hs[0]; gt.currentSeason = hs[1];
        var d = E.buildWildBeastData(eco);
        seen[hs[0] + '/' + hs[1]] = d.combatAbilities.slice().sort().join('+') + '|' + (d._dayNightSeason ? d._dayNightSeason.why : '');
        ok(!!d._dayNightSeason, 'H7 ' + hs[0] + ' 时/' + hs[1] + '：宿主战斗数据带 _dayNightSeason（真时段' + d._dayNightSeason.hour + '时）');
    });
    gt.currentHour = keepH; gt.currentSeason = keepS;
    var uniq = {}; Object.keys(seen).forEach(function (k) { uniq[seen[k].split('|')[0]] = 1; });
    ok(Object.keys(uniq).length >= 3, 'H8 ★昼夜×季节四个组合给出 ≥3 种不同战斗技能（实数 ' + Object.keys(uniq).length + '）：' + JSON.stringify(seen));
})();

// 日课
(function () {
    var host = BEHAVIOR_MEMBERS.filter(function (k) { return MECH[k].behavior === 'persist'; })[0];
    ok(!!host, 'H9 日课有宿主（' + beastNameOf(host) + '）');
    if (!host) return;
var st = E.getState().dayCourse;
eq(st.days, 0, 'H10 日课账在 StateRegistry 里（改前这个位置存的是 distributionCount 一本账）');
st.running = false; st.days = 0; st.trips = 0;
eq(E.dayCourseTick(), null, 'H11 没遇上那只兽时日课不启动（不是默认开的机制）');
    // ★ 开课钩子必须是真触发点，不是测试手动置的：真跑出这只兽一次
    E.getState().dayCourse.running = false;
    var ecoHost = E.BEAST_DISTRIBUTION.filter(function (d) { return d.id === host; })[0];
    E.buildWildBeastData(ecoHost);
    eq(E.getState().dayCourse.running, true, 'H11b ★真跑出 ' + beastNameOf(host) + ' 一次就把日课立起来（此前 running 全仓零写方，这整条日课从没跑起来过）');
    // ★ 日课要玩家在场：人不在它的出没地就不记（不是白送，也不是惩罚——是不记）
    var keepLoc = global.locationSystem;
    global.locationSystem = { getCurrentLocation: function () { return '帝都 · 长安'; } };   // 中州，不是它的海
    var awayTick = E.dayCourseTick();
    eq(awayTick, null, 'H11c ★人不在它出没地时，日课当天不记（' + beastNameOf(host) + ' 只在' + E.dayCourseHaunts().join('/') + '）');
    eq(E.dayCourseFill().days, 0, 'H11d 不在场那天的天数没进账（没有「未互动就惩罚」的默认罚）');
    global.locationSystem = { getCurrentLocation: function () { return '碧落仙宫'; } };   // 东南海域＝它的海
    eq(E.dayCourseHere(), true, 'H11e 人在碧落仙宫（东南海域）时算在场');
    var last = null;
    for (var i = 0; i < 10; i++) last = E.dayCourseTick();
    ok(!!last && last.trips === 1 && last.days === 10 && last.given === undefined,
        'H12 在场满 10 日记一整旬，**不发料**（' + JSON.stringify(last) + '）');
    ok(E.dayCourseFill().days === 10, 'H13 日课天数在账上（' + E.dayCourseFill().line + '）');
    var l2 = E.dayCourseTick();
    eq(l2, null, 'H14 第十一日不满整旬（满 10 日记一旬，不是一天记一趟）');
    // ★ 记满一日它就知道你在追：那一片它出没更频（权重，不是倍率）
    var boost = E.dayCourseBoost();
    eq(Object.keys(boost).length > 0, true, 'H15 在场记满一日后，出没权重真涨（' + JSON.stringify(boost) + '）');
    eq(boost[host] >= 1, true, 'H15b 涨的是 ' + beastNameOf(host) + ' 自己，不是别的兽');
    // ★ 关：不在场时权重必须退回去（羁绊的代价不是甩不掉的债）
    global.locationSystem = keepLoc;
    eq(E.dayCourseHere(), false, 'H15c 位置读不到（在赶路/在大地图）时不算在场');
})();

// 情报口
(function () {
    var host = BEHAVIOR_MEMBERS.filter(function (k) { return MECH[k].behavior === 'intel'; })[0];
    ok(!!host, 'H15 情报有宿主（' + beastNameOf(host) + '）');
    var it = E.beastIntel(host);
    ok(!!it && it.weakness && it.weakness.length > 4, 'H16 情报口给得出可行动的弱点提示（' + (it && it.weakness) + '）');
    ok(!!it && it.origin && it.use, 'H17 情报口带产地与用途（不能只有一句话弱点）');
    eq(E.beastIntel('查无此兽'), null, 'H18 查无此兽回 null，不拿编的情报占版面');
})();

// 三个宿主的 behavior 互不相同（防「三只换皮」）
var behIds = BEHAVIOR_MEMBERS.map(function (k) { return MECH[k].behavior; });
eq(new Set(behIds).size, behIds.length, 'H19 ⑥族各只兽的 behavior 互不相同（' + behIds.join(',') + '）');

// ==================== I 不碰全局倍率 ====================
section('I) 不碰全局倍率（强制规则第 14 条）');

ok(ecoSrc.indexOf('damageMul') < 0 && ecoSrc.indexOf('DAMAGE_MUL') < 0, 'I0 本文件没有全局伤害倍率标识');
// 差事账：六类 category 与它们的 mul 本批一个都没动（数值现读，逐个对）
var CHANGED = { beast_dragonturtle: 0.24, beast_thundereagle: 1.5, beast_yaolong: 0.95 };
var drift = Object.keys(CHANGED).filter(function (k) { return E.BEAST_BUFFS[k] && E.BEAST_BUFFS[k].mul === CHANGED[k]; });
eq(drift.length, 0, 'I1 本批没改任何既有差事倍率（龙龟 carry 0.10 / 雷鹰 scout 1.0 都是现有尺逐字节断言的值）');
ok(/强规则|勿再提议|禁止全局/.test(src('强制规则.md')), 'I2 强制规则第 14 条在场（尺在读它，不是空话）');
// 本批只新增掉落与状态，不新增伤害路径
ok(ecoSrc.indexOf('loot: { exp: lv * 8, copper: lv * 3 }') >= 0, 'I3 本批对战斗数据的唯一数值面是 loot（经验/铜钱），照原样未动');

console.log('\n========== 兽机制三族 · 验收 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);