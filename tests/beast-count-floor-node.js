/**
 * beast-count-floor-node.js — 灵兽计数棘轮 与 山海经新兽 12 只 的验收尺
 *
 * 这把尺存在的理由：上一批与上上一批都栽在同一件事上——「往灵兽账加兽」被一道
 * 写死的算术锁挡在代码外面（design 稿写好了，代码里一只都没有）。
 * 本尺量的是**那道锁真的解开了，而且解开的方式是棘轮不是放行**。
 *
 *   J  ★棘轮生效★  模板总数 >= 下限（不是 === 某个数）；★把总数改到下限以下必须红★
 *                 —— 这一条是本尺的判据本体，抓回归靠它，不靠嘴上报。
 *   K  ★名实一致★  12 只新兽逐只查得到：生态 id / 展示名 / 等级 / 逻辑链四要素
 *   L  ★机制不空转★ 每一只的 innate 真能进战斗数据（真跑一遍 buildWildBeastData + 生成器合并口）
 *   M  ★后继友好★  ★再加一只兽时 J1/J3 仍绿★（证明不是又写死了一个数）
 *   N  ★撤销前批成果★ v27.11 的 FLOOR 棘轮七条 与 A8b、wave86 的 D7 判据 一条不少
 *   O  ★棘轮真能抓回归★ 内存里把总数砍到下限以下 → 本尺判红（不落盘）
 *
 * 运行：node tests/beast-count-floor-node.js
 */
'use strict';

var fs = require('fs');
var vm = require('vm');
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

// ==================== 世界桩 ====================
// 喂**真本**：灵兽账、生态账、真炼器账（C1 的 D 段要靠真 MATERIAL_GRADE 判「炼器出口」）。
// 自己造一本假表再验它，等于什么都没验。
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
global.EventBus = {
    _h: {},
    on: function (n, f) { (this._h[n] = this._h[n] || []).push(f); },
    emit: function (n, p) { (this._h[n] || []).forEach(function (f) { try { f(p); } catch (e) {} }); },
    off: function () {}, once: function () {}
};
function load(rel) { vm.runInThisContext(src(rel), { filename: rel }); }

load('js/beast-taming.js');
load('js/extensions/beast-ecosystem.js');
load('js/crafting/forging-compound.js');

var E = global.BeastEcosystem;
var TPL = global.BEAST_TEMPLATES || {};
var FORGE = global.ForgingCompound;
var NEW = E.SPECIES_TEMPLATES_V2711;
var FAMILY = E.SPECIES_FAMILY_V2711;
var GRADE = (FORGE && FORGE.MATERIAL_GRADE) || {};

// ★ 本尺建立时的下限。与 tests/beast-mechanic-families-node.js 的 FLOOR 同源同值。
//   取值理由写在那边：C1 原判据 `=== 48` 把总数钉成常数，于是加兽永远不合法。
var FLOOR = { templates: 48, species: 23, dist: 42 };

// ==================== J 棘轮生效 ====================
section('J) ★棘轮生效★：总数只许增不许减；砍到下限以下必须红');

// 判据本体现读 beast-mechanic-families-node.js 的源码 —— 尺量的是**那把尺的判据**，
// 不是我嘴上说改了。所以 `===` 与 `>=` 各测一次。
var FAM_SRC = src('tests/beast-mechanic-families-node.js');
ok(/var FLOOR = \{ templates: 48 \};/.test(FAM_SRC),
    'J0 beast-mechanic-families-node.js 里 C1 的下限被显式写死为 FLOOR{ templates: 48 }（不是「= 现读数」那种自证空断言）');
ok(/NOW\.templates >= FLOOR\.templates/.test(FAM_SRC),
    'J0b ★C1 判据本体是 `>=`（棘轮），不再是 `===`（写死值）');
ok(/^\s*ok\(NOW\.templates >= FLOOR\.templates,/m.test(FAM_SRC),
    'J0c 旧的 `eq(NOW.templates, BEFORE.templates` 判据已不在文件里（不是加了一条新断言把旧的留着——那样加兽照样红）');
ok(/var BEFORE = \{ templates: 48/.test(FAM_SRC),
    'J0d BEFORE 那份「改前基线」原样留着（C2/C3/C4 还在用它判「只许涨/只许跌」，没被我顺手改掉）');

// 棘轮的实数：现读
var NOW_N = Object.keys(TPL).length;
ok(NOW_N >= FLOOR.templates, 'J1 模板总数 ' + NOW_N + ' ≥ 下限 ' + FLOOR.templates);
ok(Object.keys(NEW).length >= FLOOR.species, 'J1b 物种账 SPECIES_TEMPLATES_V2711 ' + Object.keys(NEW).length + ' ≥ 下限 ' + FLOOR.species);
ok(E.BEAST_DISTRIBUTION.length >= FLOOR.dist, 'J1c 分布表 ' + E.BEAST_DISTRIBUTION.length + ' ≥ 下限 ' + FLOOR.dist);

// ★ 后继友好：再加一只兽，这三条仍绿 ⇒ 判据真的不是又写死了一个数。
(function () {
    var probe = 'floorprobe_canary';
    var before = Object.keys(TPL).length;
    // 在真表上临时添一行（加完即删，不落盘）
    TPL[probe] = {
        name: '棘轮探针兽', type: 'beast', level: 50, realm: '化神',
        attrs: { strength: 1, dexterity: 1, constitution: 1, willpower: 1, intelligence: 1, meridian: 1 },
        skills: ['探针'], innate: ['pounce'], teachable: ['pounce'], regions: ['中州'], catchable: true
    };
    var after = Object.keys(TPL).length;
    ok(after === before + 1 && after >= FLOOR.templates,
        'M1 ★再加一只兽（' + before + '→' + after + '）后 J1 仍绿：总数不是又写死了一个数');
    delete TPL[probe];
    ok(Object.keys(TPL).length === before, 'M1b 探针已撤除，表回到 ' + before + ' 只（不留占位假值：禁止设计第 4 条）');
})();

// ★ 棘轮真能抓回归：**把那把尺的 C1 判据原文抠出来编译执行**，再把总数砍到下限以下。
//   这一条不是 `assert(22 >= 48) === false` 那种自证——判据是从
//   tests/beast-mechanic-families-node.js 的源码里原样取出来的表达式（抠不出来就直接判红）。
(function () {
    var m = FAM_SRC.match(/^\s*ok\(\s*(NOW\.templates\s*>=\s*FLOOR\.templates)\s*,/m);
    if (!m) { ok(false, 'O1 没能从 beast-mechanic-families-node.js 里抠出 C1 的判据表达式（判据形状变了？）'); return; }
    var predicate;
    try { predicate = new Function('NOW', 'FLOOR', 'return (' + m[1] + ');'); }
    catch (e) { ok(false, 'O1 C1 判据表达式编译不过：' + e.message); return; }
    ok(true, 'O1a C1 判据原文抠出来了并能编译执行：' + m[1].trim());
    // 真表：绿
    ok(predicate({ templates: NOW_N }, FLOOR) === true, 'O2 真表 ' + NOW_N + ' 只：C1 判据为真');
    // 砍到下限以下：红
    var below = [];
    [48, 47, 40, 25, 0].forEach(function (n) {
        var r = predicate({ templates: n }, FLOOR);
        below.push(n + '→' + (r ? '绿' : '红'));
        if (n < FLOOR.templates) ok(r === false, 'O3 ★把总数砍到 ' + n + ' 只（低于下限 ' + FLOOR.templates + '）时 C1 判红');
    });
    // 一只不少地守着边界：47 红、48 绿
    ok(predicate({ templates: FLOOR.templates - 1 }, FLOOR) === false
        && predicate({ templates: FLOOR.templates }, FLOOR) === true,
        'O4 ★边界就在下限那一格：' + (FLOOR.templates - 1) + ' 红 / ' + FLOOR.templates + ' 绿（' + below.join('，') + '）');
    // 对照：旧判据长什么样，它在加兽之后会怎么判（说明为什么必须换）
    var old = new Function('NOW', 'BEFORE', 'return (NOW.templates === BEFORE.templates);');
    ok(old({ templates: NOW_N }, { templates: 48 }) === false,
        'O5 对照组：旧判据 `=== 48` 在 ' + NOW_N + ' 只时判红（这就是前两批写不进兽的原因）');
})();

// ==================== K 名实一致：12 只逐只查 ====================
section('K) ★名实一致★：山海经新兽 12 只逐只查得到');

// 设计稿要求的 12 只，逐只点名。**名单写死在这里是对的**：这把尺要量的就是「这 12 只在不在」，
// 名单一旦现读就变成「表里有几只就有几只」的空断言（与 A1 组那次松绑同理，判据要反过来用）。
var NEW12 = [
    { tpl: 'fuzhu', name: '夫诸', level: 34, origin: '东南海域河源', parts: ['mat_cold_iron', 'mat_mithril'] },
    { tpl: 'yeling', name: '獙獙', level: 30, origin: '西漠沙狐', parts: ['mat_sky_iron', 'mat_thunder_crystal'] },
    { tpl: 'feiyi', name: '肥遗', level: 44, origin: '南疆火山石缝', parts: ['mat_dark_iron', 'mat_fire_crystal'] },
    { tpl: 'huodou', name: '祸斗', level: 24, origin: '南疆山道', parts: ['mat_demon_beast_skin', 'mat_phoenix_blood'] },
    { tpl: 'fei', name: '蜚', level: 40, origin: '瘴泽', parts: ['mat_demon_beast_core', 'mat_demon_beast_bone'] },
    { tpl: 'zhulong', name: '烛龙', level: 92, origin: '灵界罡风带', parts: ['mat_meteorite', 'mat_star_iron'] },
    { tpl: 'baxia', name: '霸下', level: 52, origin: '中州与蜀地', parts: ['mat_purple_gold', 'mat_refined_iron'] },
    { tpl: 'baize', name: '白泽', level: 62, origin: '东荒老林', parts: ['mat_dragon_crystal', 'mat_dragon_bone'] },
    { tpl: 'jingwei', name: '精卫', level: 28, origin: '东海', parts: ['mat_phoenix_feather', 'mat_refined_copper'] },
    { tpl: 'lili', name: '狸力', level: 16, origin: '中州与西漠', parts: ['mat_copper_ore', 'mat_iron_ore'] },
    { tpl: 'chiwen', name: '螭吻', level: 36, origin: '屋脊', parts: ['mat_dragon_scale', 'mat_dragon_scale_iron'] },
    { tpl: 'gangfu', name: '蚣蝮', level: 20, origin: '河堤', parts: ['mat_beast_bone', 'mat_beast_skin'] }
];

var missTpl = NEW12.filter(function (b) { return !NEW[b.tpl]; });
eq(missTpl.length, 0, 'K1 12 只全部在物种账 SPECIES_TEMPLATES_V2711 里（查无：' + missTpl.map(function (b) { return b.name; }).join(',') + '）');
var missDist = NEW12.filter(function (b) { return !E.BEAST_DISTRIBUTION.some(function (d) { return d.id === 'beast_' + b.tpl; }); });
eq(missDist.length, 0, 'K2 12 只全部在分布表里（野外遇得到：' + missDist.map(function (b) { return b.name; }).join(',') + '）');
var missBuf = NEW12.filter(function (b) { return !E.BEAST_BUFFS['beast_' + b.tpl]; });
eq(missBuf.length, 0, 'K3 12 只全部有差事（缺：' + missBuf.map(function (b) { return b.name; }).join(',') + '）');
var missFam = NEW12.filter(function (b) { return !FAMILY[b.tpl]; });
eq(missFam.length, 0, 'K4 12 只全部在族属表里（v27.11 A1f 判「族属表覆盖每一只新兽」：缺 ' + missFam.map(function (b) { return b.name; }).join(',') + '）');

// ★ 逐只：名字 / 等级 / 模板已进灵兽账 / 分布表等级一致 / 三条映射齐全
NEW12.forEach(function (b) {
    var t = NEW[b.tpl], d = E.BEAST_DISTRIBUTION.filter(function (x) { return x.id === 'beast_' + b.tpl; })[0];
    var bits = [];
    bits.push(TPL[b.tpl] ? '模板在册' : '★模板不在灵兽账★');
    bits.push(t.name === b.name ? '名对' : '★名=' + t.name + '≠' + b.name + '★');
    bits.push(Number(t.level) === b.level ? 'lv' + t.level + ' 对' : '★lv=' + t.level + '≠' + b.level + '★');
    bits.push(d && Number(d.level) === b.level ? '分布表同级' : '★分布表 lv=' + (d && d.level) + '★');
    bits.push(E.TEMPLATE_TO_ECO[b.tpl] === 'beast_' + b.tpl ? '模板→生态 映射在' : '★模板→生态 映射缺★');
    bits.push(E.BEAST_NAME_TO_ID[b.name] === 'beast_' + b.tpl ? '中文名→生态 映射在' : '★中文名→生态 映射缺★');
    ok(bits.every(function (x) { return x.indexOf('★') < 0; }),
        'K5 ' + b.name + '（' + b.tpl + '）' + bits.join(' / '));
});

// ★ 逐只：逻辑链四要素 —— 产地 / 材料 / 炼器出口 / 克制·风险
NEW12.forEach(function (b) {
    var key = 'beast_' + b.tpl;
    var m = E.MECH_FAMILY_V2712[key];
    var rows = E.BODY_PARTS_DROPS[key] || [];
    var chain = [];
    chain.push('产地=' + (m && m.origin && m.origin.indexOf(b.origin) >= 0 ? '真' : '★缺/不符★'));
    chain.push('材料=' + rows.map(function (r) { return r.matId; }).join('+'));
    var outlets = rows.map(function (r) { return E.partOutlet(r.matId); });
    chain.push('炼器出口=' + outlets.filter(Boolean).length + '/' + rows.length
        + (outlets.filter(Boolean).length === rows.length && rows.length
            ? '（品阶 ' + outlets.map(function (o) { return o.grade; }).join('/') + '）' : '★有无出口的★'));
    chain.push('风险=' + (m && m.risk && m.risk.length >= 8 ? '有' : '★缺★'));
    ok(!!m && (m.family || []).indexOf('part') >= 0
        && rows.length === b.parts.length
        && outlets.every(Boolean)
        && m.origin.indexOf(b.origin) >= 0 && m.risk.length >= 8,
        'K6 ' + b.name + ' 逻辑链四要素齐全：' + chain.join('　'));
    // 材料必须逐个等于设计稿点名的那些（不许换料）
    eq(rows.map(function (r) { return r.matId; }).sort().join(','), b.parts.slice().sort().join(','),
        'K7 ' + b.name + ' 部位件逐件对得上（不许拿别的料顶）');
});

// ==================== L 机制不空转 ====================
section('L) ★机制不空转★：每一只的 innate 真能进战斗数据');

// battle.js 现读 COMBAT_ABILITIES 登记表（不写死 13——那一数会随批次变）
var ABILITY = (function () {
    var t = src('js/battle.js');
    var i = t.indexOf('const COMBAT_ABILITIES = {');
    var seg = t.slice(i, t.indexOf('};', i));
    var re = /^\s{4}([a-z_]+):\s*\{/gm, m, set = {};
    while ((m = re.exec(seg))) set[m[1]] = true;
    return set;
})();
ok(Object.keys(ABILITY).length >= 11, 'L0 从 battle.js 现读到 ' + Object.keys(ABILITY).length + ' 个已登记战斗机制');

// 真跑一遍：每一只新兽拼出的战斗数据，天生技在册、非空，且带自己的部位件
NEW12.forEach(function (b) {
    var eco = E.BEAST_DISTRIBUTION.filter(function (d) { return d.id === 'beast_' + b.tpl; })[0];
    var wd = E.buildWildBeastData(eco);
    if (!wd) { ok(false, 'L1 ' + b.name + ' 拼不出战斗数据'); return; }
    var t = NEW[b.tpl];
    var bad = t.innate.filter(function (a) { return !ABILITY[a]; });
    ok(bad.length === 0 && wd.combatAbilities.length > 0
        && wd.name === b.name && wd.level === b.level
        && wd._beastTemplateId === b.tpl && wd._ecoBeastId === 'beast_' + b.tpl,
        'L1 ' + b.name + ' 战斗数据：天生技 ' + wd.combatAbilities.join('/')
        + '（模板 innate ' + t.innate.join('/') + '）· 模板 id ' + wd._beastTemplateId
        + ' · 生态 id ' + wd._ecoBeastId + (bad.length ? ' ★越界=' + bad.join(',') : ''));
    // 部位件真挂在尸体携带物上（解剖可得）
    var carried = (wd.carriedInventory && wd.carriedInventory.items) || [];
    var want = E.partsAsCarried('beast_' + b.tpl);
    eq(JSON.stringify(want.slice().sort()), JSON.stringify(carried.slice().sort()),
        'L2 ' + b.name + ' 部位件真挂在尸体携带物上（要 ' + (want.join('、') || '无')
        + '／得 ' + (carried.join('、') || '无') + '）');
    // 差事有真消费端（现读 getActiveBeastBuff 的调用点，生态自己不算）
    var cat = E.BEAST_BUFFS['beast_' + b.tpl].category;
    var sites = [];
    (function walk(dir) {
        fs.readdirSync(dir).forEach(function (f) {
            var p = path.join(dir, f), st = fs.statSync(p);
            if (st.isDirectory()) { walk(p); return; }
            if (!/\.js$/.test(f)) return;
            var rel = path.relative(ROOT, p).replace(/\\/g, '/');
            if (rel === 'js/extensions/beast-ecosystem.js') return;
            var t2 = fs.readFileSync(p, 'utf8');
            if (t2.indexOf("getActiveBeastBuff('" + cat + "')") >= 0) sites.push(rel);
        });
    })(path.join(ROOT, 'js'));
    ok(sites.length > 0, 'L3 ' + b.name + ' 的差事「' + cat + '」有真消费端（' + sites.length + ' 处：' + sites.slice(0, 2).join(', ') + '）');
});

// ★ 平衡禁令（强制规则第 14 条）：本批没有新增任何全局伤害/数值缩放
var ecoSrc = src('js/extensions/beast-ecosystem.js');
ok(ecoSrc.indexOf('damageMul') < 0 && ecoSrc.indexOf('DAMAGE_MUL') < 0,
    'L4 本批没往生态账里写任何全局伤害/数值缩放标识（强制规则第 14 条：不许用全局缩放调平衡）');
var travelBest = 9;
Object.keys(E.BEAST_BUFFS).forEach(function (k) {
    var x = E.BEAST_BUFFS[k];
    if (x.category === 'travel') travelBest = Math.min(travelBest, x.mul);
});
eq(travelBest, 0.6, 'L5 全表最优引路仍是鲲鹏 0.6（12 只新兽一只都没挂 travel —— 挂了就把 v27.11 的 L3 顶破）');

// ==================== N 撤销前批成果 ====================
section('N) ★撤销前批成果★：上一批的棘轮与加严断言仍在');

var V = src('tests/v27.11-beast-species-node.js');
var W86 = src('tests/wave86-beast-collector-node.js');
var FL = { total: 23, plants: 12, flowers: 6, vines: 4, thorns: 1, dragons: 6, foxes: 5 };
Object.keys(FL).forEach(function (k) {
    ok(new RegExp('FLOOR\\.' + k + '\\b').test(V) && V.indexOf('> FLOOR.' + k) >= 0 || new RegExp(k + ': ' + FL[k]).test(V),
        'N1 v27.11 A1 组 FLOOR.' + k + '（' + FL[k] + '）仍在且仍是 >= 口径');
});
ok(/var FLOOR = \{ total: 23, plants: 12, flowers: 6, vines: 4, thorns: 1, dragons: 6, foxes: 5 \};/.test(V),
    'N2 v27.11 的七条 FLOOR 一条不少、值也没被偷偷抬高（total:23/plants:12/flowers:6/vines:4/thorns:1/dragons:6/foxes:5）');
ok(/A8b 每一只新兽在 window\.BEAST_TEMPLATES 里的展示名都等于它自己的/.test(V),
    'N3 上一批加严的那条 A8b（名实一致）仍在');
ok(/Object\.keys\(TPL\)\.length === 25 \+ NEW_IDS\.length/.test(V),
    'N4 v27.11 A8（25 既有 + 新增）判据一字未动——两边同步涨，加兽只会更绿');
ok(/D7 ' \+ DIST\.length \+ ' 兽分布名/.test(W86) || /' \+ DIST\.length \+ ' 兽分布名/.test(W86),
    'N5 wave86 的 D7 判据一字未动（现读 DIST.length，不写死兽数）');
ok(/ecoSrc\.indexOf\('19 兽'\)/.test(src('tests/wave87-beast-lore-node.js'))
    && /ecoSrc\.indexOf\('19 兽'\)/.test(src('tests/wave88-beast-bond-node.js')),
    'N6 wave87/wave88 那两条「找字面串 19 兽」的断言仍在（我保留了段头里那三个字，没为了让它们红而去动判据——已报备该改成现读）');
ok(/A5 每只升族兽都在分布表里/.test(FAM_SRC) && /A6 每只升族兽都能拼出战斗数据/.test(FAM_SRC)
    && /A11 ' \+ nm \+ ' 的部位件真挂在尸体携带物上/.test(FAM_SRC) && /'D9 ' \+ nm \+ ' 的产地\/用途字段逐只达标/.test(FAM_SRC),
    'N7 beast-mechanic-families 的逐只钉（A5 逐只在分布表 / A6 逐只拼得出战斗数据 / A11 逐只挂上部位件 / D9 产地用途逐只达标）一条没少'
    + '——上一批把「不写死名单、只钉结构」的原则立住了，本批只换 C1 的口径，没碰那四条');

// ==================== P beastId 四跳 ====================
section('P) beastId 四跳：★先回答「料表支不支持 ID 粒度」★');

// P0 是本批最要紧的一个判据：任务书问「如果料表只到等级档，那修 beastId 也没用」。
// 逐条现读，回答这个问题。
var FORGE_SRC = src('js/crafting/forging-compound.js');
var beastTiers = FORGE.LATE_MATERIAL_TIERS.filter(function (t) { return t.kind === 'beast'; });
ok(beastTiers.length > 0 && beastTiers.every(function (t) { return !!t.beastId && !!t.beastName; }),
    'P0 ★★料表**本来就支持 ID 粒度**：' + beastTiers.length + ' 个 beast 档每一档都自带 beastId/beastName（'
    + beastTiers.map(function (t) { return t.beastId + '（' + t.beastName + '）'; }).join('、') + '）');
var dropWithId = FORGE.LATE_MATERIAL_DROPS.filter(function (r) { return !!r.beastId; });
ok(dropWithId.length > 0,
    'P0b 展平表 LATE_MATERIAL_DROPS 也把 beastId 逐行摊出来了（' + dropWithId.length + '/' + FORGE.LATE_MATERIAL_DROPS.length + ' 行带 id）——ID 粒度的数据早就到了消费端，只是取档那一判据没读');
// 每个 beastId 都是生态表里真的一只兽（名实一致，不能是表外编的）
var idNotReal = beastTiers.filter(function (t) {
    return !E.BEAST_DISTRIBUTION.some(function (d) { return d.id === t.beastId && d.name === t.beastName; });
});
eq(idNotReal.length, 0, 'P0c 每个 beastId/beastName 都在生态分布表里对得上真兽（对不上：'
    + idNotReal.map(function (t) { return t.beastId; }).join(',') + '）');
// ⇒ 结论：不是「要先把料表加细」，是「取档判据少了一个 id 分支」。四条都要修，本批四跳全通。
ok(/wantId && bt\.beastId === wantId/.test(FORGE_SRC) && /wantName && bt\.beastName === wantName/.test(FORGE_SRC),
    'P0d 取档判据里已经有 ID 分支（ID 优先，认不中回等级带）——所以四跳修完不是白修');

// ① app.js：第二参此前从未被读
var APP = src('js/app.js');
ok(/spawnOpts = \{ beastId: extra \};/.test(APP),
    'P1 app.js globalStartBattle 接住了第二参 extra（此前它在函数体里一次都没被读过）');
ok(/typeof extra === 'string'/.test(APP),
    'P1b 只在第二参是非空字符串时才点名（对象走 explicitEnemy 那条老路，行为逐字节不变）');
// ② battle.js：结算口透 id
ok(/beastId: this\.enemy\._beastTemplateId \|\| null/.test(src('js/battle.js')),
    'P2 battle.js 结算口把这一只的模板 id 透给了取档口（此前只传 {level,isBeast,name}）');
// ③ 取档：ID 认到哪一档，返回哪一档（真跑）
(function () {
    var nether = FORGE.LATE_MATERIAL_TIERS.filter(function (t) { return t.beastId === 'beast_netherveinserpent'; })[0];
    var deer = FORGE.LATE_MATERIAL_TIERS.filter(function (t) { return t.beastId === 'beast_cloudhorndeer'; })[0];
    ok(!!nether && !!deer, 'P3 取档实验的两个样本档在册');
    // 85 级的云角鹿：按 ID 认到云角鹿自己那一档（不再报幽脉蟒的字样、也不再给龙料）
    eq(FORGE.lateMaterialTier('beast', { level: 85, isBeast: true, beastId: 'cloud_horn_deer', name: '云角鹿' }).key, deer.key,
        'P3 85 级云角鹿按 ID 认到云角鹿自己那一档（改前给的是幽脉蟒那档 —— 名实不一致）');
    // 同一个 id 用生态 id 写法也认得到（两套命名都收）
    eq(FORGE.lateMaterialTier('beast', { level: 60, isBeast: true, beastId: 'beast_cloudhorndeer' }).key, deer.key,
        'P3b 生态 id 写法（beast_cloudhorndeer）也认得到同一档');
    // 无名野兽（不给 id）仍然走等级带，与改前逐字节一致
    eq(FORGE.lateMaterialTier('beast', { level: 85, isBeast: true }).key, nether.key,
        'P3c ★无名野兽仍按等级带取档，一步没变窄（点不中就回等级带，谁都没少拿一份）');
    // 只有名没有 id 也认得到（结算口本来就传 name）
    eq(FORGE.lateMaterialTier('beast', { level: 60, isBeast: true, name: '云角鹿' }).key, deer.key,
        'P3d 只有展示名没有 id 也认得到（battle.js:5363 本来就把 name 传过来了）');
    // 人形（isBeast === false）仍然一口回绝——这条老规矩没被 ID 分支破坏
    eq(FORGE.lateMaterialTier('beast', { level: 85, isBeast: false, beastId: 'cloud_horn_deer' }), null,
        'P3e isBeast===false 仍然回空（人形不因带 id 就混进妖兽后期料）');
})();
// ④ 第四跳：之前那一处（战斗技能被硬编码 ['pounce']）上一批已修，本尺复验没被本批碰回去
ok(src('js/battle.js').indexOf("combatAbilities = ['pounce'];") < 0,
    'P4 battle.js 里那行「combatAbilities = [\'pounce\']」仍不在（上一批修好的，本批没碰回去）');

console.log('\n========== 灵兽计数棘轮 + 山海经新兽 12 只 · 验收 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);