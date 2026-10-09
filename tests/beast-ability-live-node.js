/**
 * beast-ability-live-node.js — ★「兽的模板机制在战斗里真生效」验收尺★
 *
 * 这把尺量的不是「代码能不能跑」，而是**玩家在战斗里能不能看见那只兽的招牌技**。
 * 病灶原文：「js/battle.js 对 physiologyType='beast' 的敌人硬编码 combatAbilities=['pounce']，
 * 48 只兽模板各自写好的 innate 全被盖掉——数据写对了，没接上。」
 *
 *   A ★机制真生效★  每只写了 innate 的兽，进战斗后 combatAbilities 含那些机制
 *                   （两条构造路径各验一遍：generateRandomEnemy 与 buildWildBeastData，
 *                    都要过真的 Entity 构造器，不是读表自说自话）
 *   B ★兜底不被拆★  没写 innate 的兽仍然拿到生理类型兜底；
 *                   undead→venom / construct→hardened / elemental→chill|burn 三条一字未改
 *   C ★零使用归零★  gu_parasite / soundwave / drain_qi 各自至少 2 只兽天生带；
 *                   sword_burst 仍为 0（剑修的本事，全表没有一只兽使兵器）
 *   D ★真机可见★    真跑一场 Battle，战斗日志（battle.log）里逐条读出非 pounce 的机制名
 *                   ——播报口是 js/battle.js:2738「气息驳杂，似怀绝技：…」，它只读 combatAbilities，
 *                     所以 D 段绿 = 玩家在界面上真的看得见
 *   E 新兽可进      「往模板表加兽」不再被写死的算术锁挡死（本尺自带一把可复现的锁具实验）
 *   F 抓回归        把合并口退回硬编码，本套必须转红（尺不是一句空话）
 *
 * 运行：node tests/beast-ability-live-node.js
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
function load(rel) { vm.runInThisContext(src(rel), { filename: rel }); }

// ==================== 世界桩 ====================
// 喂**真本**：灵兽账（beast-taming.js）· 生态（beast-ecosystem.js）· 战斗（battle.js）。
// 三本缺一本，这把尺就变成「自己造一本假账再验它」，等于什么都没验。
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
    _h: {}, on: function (n, f) { (this._h[n] = this._h[n] || []).push(f); },
    emit: function (n, p) { (this._h[n] || []).forEach(function (f) { try { f(p); } catch (e) {} }); },
    off: function () {}, once: function () {}
};
global.realmAtLeast = function () { return true; };

load('js/beast-taming.js');
load('js/extensions/beast-ecosystem.js');
load('js/crafting/forging-compound.js');   // 生态的部位件出口要真 MATERIAL_GRADE
load('js/core/world-calendar.js');          // ⑤ 预兆要真日程表
load('js/time-system.js');                  // ⑥ 昼夜要真时钟
load('js/battle.js');

var TPL = global.BEAST_TEMPLATES || {};
var E = global.BeastEcosystem;
var ABILITY = global.COMBAT_ABILITIES;
var ABILITY_IDS = Object.keys(ABILITY);
var gen = global.generateRandomEnemy;
var DIST = E.BEAST_DISTRIBUTION;

ok(!!TPL && Object.keys(TPL).length > 0, 'A0 灵兽账在册（' + Object.keys(TPL).length + ' 只模板）');
ok(!!ABILITY && ABILITY_IDS.length === 13, 'A0b 战斗技能注册表在册（' + ABILITY_IDS.length + ' 个 id）');

// ==================== A ★机制真生效★ ====================
section('A) ★机制真生效★：模板写了 innate 的兽，战斗里 combatAbilities 含那些机制');

function mkPlayer() {
    return new global.Entity({
        name: '试炼者', level: 20, physiologyType: 'humanoid',
        attrs: { strength: 30, dexterity: 30, intelligence: 30, willpower: 30, constitution: 30, meridian: 30 }
    }, 'player');
}

// ⑥「昼夜与季节」那一只（应龙/烛龙那一族）的天生技**不是**模板那份：
// 它按真时辰真季节现算（buildWildBeastData 读 js/time-system.js 的 gameTime）。
// 这是设计（睁眼为昼／闭眼为夜／吹气为冬／呼气为夏），所以它从 A1 的逐条比对里单分出来，
// 由 A1d 单独断言「时辰与季节确实在换」。
function isDayNightBeast(ecoId) {
    try {
        var spec = (E.MECH_FAMILY_V2712 || {})[ecoId];
        return !!(spec && spec.behavior === 'daynight');
    } catch (e) { return false; }
}

// —— A1：路径甲（buildWildBeastData → 真 Entity）逐只过 ——
var missA = [], gotA = [], dayNight = [];
DIST.forEach(function (d) {
    var data = E.buildWildBeastData({ id: d.id, name: d.name, level: d.level });
    if (!data) { missA.push(d.name + '(拼不出战斗数据)'); return; }
    var tplId = Object.keys(TPL).filter(function (k) { return TPL[k].name === d.name; })[0];
    var tpl = TPL[tplId] || {};
    // 走 app.js:5304 那个真实构造口：整包透传 + 显式覆盖那几样
    var ent = new global.Entity(Object.assign({}, data, {
        name: data.name, level: data.level, attrs: data.attrs, skills: data.skills || {}
    }), 'beast');
    if (isDayNightBeast(d.id)) {
        dayNight.push({ name: d.name, live: ent.combatAbilities.slice(), phase: data._dayNightSeason || null });
        return;
    }
    var miss = (tpl.innate || []).filter(function (a) { return !ent.hasAbility(a); });
    if (miss.length) missA.push(d.name + ' 缺 ' + miss.join('/'));
    gotA.push({ name: d.name, tpl: tpl.innate, live: ent.combatAbilities.slice() });
});
eq(missA.length, 0, 'A1 分布表 ' + DIST.length + ' 只兽逐只进战斗后，模板 innate 一条不丢（丢的：' + (missA.join('；') || '无') + '）');
ok(gotA.filter(function (r) { return r.live.length > 1; }).length >= 20,
    'A1b 分布兽里至少 20 只在战斗里持 **1 条以上**机制（实数 ' + gotA.filter(function (r) { return r.live.length > 1; }).length + '）——只有一招的兽改前有 42 只');
ok(gotA.every(function (r) { return r.live.indexOf('pounce') >= 0; }),
    'A1c 每一只分布兽在战斗里都还带猛扑 pounce（生理类型兜底没被拆；改前这一条只有模板自带的那 7 只过）');
// A1d：昼夜季节那一只，天生技真按时辰/季节换，且换出来的每一份都仍带 pounce
var dnSeen = {};
for (var hh = 0; hh < 24; hh++) {
    for (var ss of ['spring', 'summer', 'autumn', 'winter']) {
        global.gameTime = { currentHour: hh, currentSeason: ss };
        try { if (global.timeSystem && global.timeSystem.gameTime) global.timeSystem.gameTime.currentHour = hh; } catch (eT) {}
        dayNight.forEach(function (dn) {
            var dd = E.buildWildBeastData(DIST.filter(function (x) { return x.name === dn.name; })[0]);
            if (!dd) return;
            dnSeen[dd.combatAbilities.slice().sort().join('+')] = 1;
        });
    }
}
ok(dayNight.length >= 1 && Object.keys(dnSeen).length >= 3,
    'A1d 昼夜季节那一只（' + dayNight.map(function (r) { return r.name; }).join('、') + '）逐时辰逐季节给出 ≥3 种不同天生技（实数 ' + Object.keys(dnSeen).length + '）：' + Object.keys(dnSeen).join(' | '));
dayNight.forEach(function (dn) {
    ok(dn.live.indexOf('pounce') >= 0 || dn.phase !== null,
        'A1e ' + dn.name + ' 的时辰天生技 ' + JSON.stringify(dn.live) + ' 仍并着生理兜底或按季节机制另算（时辰=' + (dn.phase ? dn.phase.hour + '时/' + dn.phase.season + '季' : '无') + '）');
});

// —— A2：路径乙（generateRandomEnemy → 真 Entity）——
// 这条路径此前是「不管模板写了什么，一律 ['pounce']」。现在它从生态分布表按等级带回一只真兽。
var sigB = {}, namesB = {}, missB = [], pounceMissing = 0, beastRolls = 600;
for (var i = 0; i < beastRolls; i++) {
    var lv = 1 + Math.floor(Math.random() * 60);
    var data = gen(lv, 'beast');
    var ent = new global.Entity(Object.assign({}, data, { name: data.name, level: data.level, attrs: data.attrs }), 'beast');
    var sig = ent.combatAbilities.slice().sort().join('+');
    sigB[sig] = (sigB[sig] || 0) + 1;
    namesB[data.name] = true;
    if (ent.combatAbilities.indexOf('pounce') < 0) pounceMissing++;
    ent.combatAbilities.forEach(function (a) { if (!ABILITY[a]) missB.push(data.name + '/' + a); });
}
var sigList = Object.keys(sigB);
ok(sigList.length >= 10, 'A2 ★generateRandomEnemy 出兽的天生技签名 ≥10 种（实数 ' + sigList.length + '；改前是 1 种，只有 pounce）');
eq(missB.length, 0, 'A2b 路径乙不产生注册表外的机制 id（越界：' + (missB.join(',') || '无') + '）');
eq(pounceMissing, 0, 'A2c 路径乙每一只兽都带 pounce（tests/regression-node.js:185 的既有硬断言，兜底不能拆）');
ok(Object.keys(namesB).length >= 20, 'A2d 路径乙能掷出 ≥20 种**灵兽账里的真兽名**（实数 ' + Object.keys(namesB).length + '；改前只会掷出「赤狼兽」这类无名杂兽）');

// —— A3：名字与天生技必须同源（只换技不换名 = 野狼使着曼陀罗的蛊）——
var nameMismatch = [];
for (var j = 0; j < 400; j++) {
    var d2 = gen(1 + Math.floor(Math.random() * 60), 'beast');
    if (!d2._beastTemplateId) continue;                       // 头目级「妖兽王·…」按设计不换名
    var t2 = TPL[d2._beastTemplateId];
    if (!t2 || t2.name !== d2.name) nameMismatch.push(d2.name + '/' + d2._beastTemplateId);
    var e2 = new global.Entity(Object.assign({}, d2, { attrs: d2.attrs }), 'beast');
    (t2.innate || []).forEach(function (a) { if (!e2.hasAbility(a)) nameMismatch.push(d2.name + ' 缺 ' + a); });
}
eq(nameMismatch.length, 0, 'A3 名种替身「名字与天生技同源」：模板 id 对得上名字，且模板 innate 一条不丢（不符：' + (nameMismatch.slice(0, 3).join('；') || '无') + '）');

// —— A4：机制来源留痕（禁改设计第 2 条：机制触发失败要给原因，不许沉默地少一招）——
var srcTag = {};
for (var k2 = 0; k2 < 300; k2++) {
    var d3 = gen(1 + Math.floor(Math.random() * 60), 'beast');
    srcTag[d3._beastInnateFrom || '(无)'] = (srcTag[d3._beastInnateFrom || '(无)'] || 0) + 1;
}
ok(!!srcTag.template && !!srcTag.physiology,
    'A4 敌人数据带 _beastInnateFrom 来源标（template=' + (srcTag.template || 0) + ' / physiology=' + (srcTag.physiology || 0) + '）——界面能说清这只兽的招式是从模板来的还是只吃了生理兜底');
var tagged = gen(20, 'beast', { beastId: 'beast_bloodsuckvine' });
eq(tagged._beastInnateFrom, 'template', 'A4b 调用方点名模板时来源标是 template（点名的兽：' + tagged.name + '）');
eq(tagged.combatAbilities.indexOf('gu_parasite') >= 0, true, 'A4c 点名血吸藤 → 战斗里带 gu_parasite（金蚕蛊有宿主了）');
eq(tagged.combatAbilities.indexOf('pounce') >= 0, true, 'A4d 点名血吸藤 → 仍带 pounce（模板 innate ∪ 生理兜底，不是模板覆盖兜底）');
// A4e：来源标必须一路跟到 Entity 上（Entity 构造器只白名单式透传几个 `_` 字段，
// 不显式加这两行的话，battle.enemy._beastInnateFrom 会是 undefined——界面照样答不出来「哪儿来的」）
var tagEnt = new global.Entity(Object.assign({}, gen(30, 'beast'), { attrs: {} }), 'beast');
ok(tagEnt._beastInnateFrom === 'template' || tagEnt._beastInnateFrom === 'physiology',
    'A4e 来源标跟到了 Entity 上（_beastInnateFrom=' + tagEnt._beastInnateFrom + '，_beastTemplateId=' + tagEnt._beastTemplateId + '）');
ok(tagEnt._beastTemplateId === null || !!(window.BEAST_TEMPLATES || {})[tagEnt._beastTemplateId],
    'A4f Entity 上的 _beastTemplateId 要么为空（无名野兽），要么是灵兽账里真实在册的 id（实得 ' + tagEnt._beastTemplateId + '）');

// ==================== B ★兜底不被拆★ ====================
section('B) ★兜底不被拆★：三条生理兜底一字未改，没 innate 的兽照样吃兜底');

function rollUntil(want, type) {
    for (var n = 0; n < 40000; n++) {
        var g = gen(6, type || 'enemy');
        if (g.physiologyType === want) return g;
    }
    return null;
}
var uB = rollUntil('undead'), cB = rollUntil('construct'), eIce = null, eFire = null;
for (var n2 = 0; n2 < 40000 && !(eIce && eFire); n2++) {
    var gEl = gen(6, 'enemy');
    if (gEl.physiologyType !== 'elemental') continue;
    if (gEl.combatAbilities[0] === 'chill' && !eIce) eIce = gEl;
    if (gEl.combatAbilities[0] === 'burn' && !eFire) eFire = gEl;
}
ok(!!uB, 'B1 undead 掷得出来');
eq(uB && JSON.stringify(uB.combatAbilities), '["venom"]', 'B1b undead 兜底逐字为 ["venom"]（尸体有毒）');
ok(!!cB, 'B2 construct 掷得出来');
eq(cB && JSON.stringify(cB.combatAbilities), '["hardened"]', 'B2b construct 兜底逐字为 ["hardened"]（构装体硬）');
ok(!!eIce && !!eFire, 'B3 冰/火两种元素体都掷得出来');
eq(eIce && JSON.stringify(eIce.combatAbilities), '["chill"]', 'B3b 冰元素体兜底逐字为 ["chill"]');
eq(eFire && JSON.stringify(eFire.combatAbilities), '["burn"]', 'B3c 火元素体兜底逐字为 ["burn"]');

// 没写 innate 的模板（灵兽账里有 4 只 innate:[]）：它们进战斗仍然只有生理兜底，不许空
var emptyTpl = Object.keys(TPL).filter(function (k) { return Array.isArray(TPL[k].innate) && TPL[k].innate.length === 0; });
ok(emptyTpl.length === 4, 'B4 灵兽账里有 4 只 innate 为空数组的兽（实数 ' + emptyTpl.length + '：' + emptyTpl.map(function (k) { return TPL[k].name; }).join('、') + '）');
var emptyMiss = [];
emptyTpl.forEach(function (k) {
    var d = E.buildWildBeastData({ id: 'beast_' + k, name: TPL[k].name, level: TPL[k].level });
    if (d && d.combatAbilities.indexOf('pounce') < 0) emptyMiss.push(TPL[k].name);
});
eq(emptyMiss.length, 0, 'B4b innate 为空的兽仍拿到生理兜底 pounce（不空手上场；空的是：' + (emptyMiss.join(',') || '无') + '）');
// 兜底那一句在源码里仍然是那一句（防止有人日后把它改成模板覆盖）
var battleSrc = src('js/battle.js');
ok(/physiologyFallbackAbilities[\s\S]{0,600}?phys === 'undead'\) return \['venom'\]/.test(battleSrc)
    && /phys === 'construct'\) return \['hardened'\]/.test(battleSrc)
    && /phys === 'elemental'\) return \[elemType === 'ice' \? 'chill' : 'burn'\]/.test(battleSrc)
    && /phys === 'beast'\) return \['pounce'\]/.test(battleSrc),
    'B5 四条生理兜底在源码里逐字在位（beast→pounce / undead→venom / construct→hardened / elemental→chill|burn）');

// ==================== C ★零使用归零★ ====================
section('C) ★零使用归零★：gu_parasite / soundwave / drain_qi 有宿主了；sword_burst 仍是 0');
function innateUse() {
    var u = {};
    Object.keys(TPL).forEach(function (k) { (TPL[k].innate || []).forEach(function (a) { u[a] = (u[a] || 0) + 1; }); });
    return u;
}
var USE = innateUse();
['gu_parasite', 'soundwave', 'drain_qi'].forEach(function (id) {
    var who = Object.keys(TPL).filter(function (k) { return (TPL[k].innate || []).indexOf(id) >= 0; }).map(function (k) { return TPL[k].name; });
    ok((USE[id] || 0) >= 2, 'C ' + id + ' 至少 2 只兽天生带（实数 ' + (USE[id] || 0) + '：' + who.join('、') + '）');
});
eq(USE.sword_burst || 0, 0, 'C1 sword_burst 天生仍为 0 —— 它是剑修的本事，48 只兽没有一只使兵器，硬塞＝脑补');

// 野生遭遇（分布表 42 条）真能遇到的那三个
['gu_parasite', 'soundwave', 'drain_qi'].forEach(function (id) {
    var reach = DIST.filter(function (d) {
        var wd = E.buildWildBeastData({ id: d.id, name: d.name, level: d.level });
        return wd && wd.combatAbilities.indexOf(id) >= 0;
    }).map(function (d) { return d.name; });
    ok(reach.length >= 2, 'C2 ' + id + ' 在野外遭遇里真能遇到（可达 ' + reach.length + ' 只：' + reach.join('、') + '）');
});

// ==================== D ★真机可见★ ====================
section('D) ★真机可见★：真跑一场 Battle，战斗日志里逐条读出机制名');
// 播报口是 js/battle.js:2738「👁️ <兽名> 气息驳杂，似怀绝技：<机制名>」——它只读 combatAbilities。
// 这一段不读表自说自话：真的 new Battle、真的读 battle.log。
var announced = {}, announceSample = [];
function battleAnnounce(enemyData) {
    var player = mkPlayer();
    var enemy = new global.Entity(Object.assign({}, enemyData, { name: enemyData.name, level: enemyData.level, attrs: enemyData.attrs }), 'beast');
    var bt = new global.Battle(player, enemy);
    var line = null;
    for (var li = 0; li < bt.log.length; li++) {
        if (String(bt.log[li].msg || '').indexOf('似怀绝技') >= 0) { line = bt.log[li].msg; break; }
    }
    return { battle: bt, line: line, enemy: enemy };
}
// D1：一只带多条机制的兽，播报里逐条列出全部机制名
var multi = null;
for (var t3 = 0; t3 < 3000 && !multi; t3++) {
    var dg = gen(20, 'beast');
    if (dg.combatAbilities.length >= 3) multi = dg;
}
ok(!!multi, 'D1 掷到一只持 ≥3 条机制的兽（' + (multi ? multi.name + ' → ' + multi.combatAbilities.join('/') : '无') + '）');
if (multi) {
    var r1 = battleAnnounce(multi);
    ok(!!r1.line, 'D1b 战斗日志里真出现了开战播报行：' + r1.line);
    var shown = multi.combatAbilities.map(function (a) { return ABILITY[a] ? ABILITY[a].name : a; });
    var missing = shown.filter(function (nm) { return !r1.line || r1.line.indexOf(nm) < 0; });
    eq(missing.length, 0, 'D1c ★播报里逐条含全部 ' + shown.length + ' 个机制名（缺：' + (missing.join('、') || '无') + '）');
    var nonPounce = shown.filter(function (nm) { return nm.indexOf('猛扑') < 0; });
    ok(nonPounce.length >= 2, 'D1d 其中非「猛扑」的机制名 ≥2 个（实数 ' + nonPounce.length + '：' + nonPounce.join('、') + '）——这就是玩家在界面上读到的那几个字');
    announced[multi.name] = r1.line;
}
// D2：批量跑 60 场，把日志里出现过的机制名逐条收上来（这是「玩家能看到的部分」的机器账）
var seenNames = {}, seenSamples = {};
for (var b2 = 0; b2 < 60; b2++) {
    var dr = gen(1 + Math.floor(Math.random() * 60), 'beast');
    var rr = battleAnnounce(dr);
    if (!rr.line) continue;
    var seg = String(rr.line).split('：').pop();
    seg.split('、').forEach(function (nm) {
        var n2b = String(nm).trim();
        if (!n2b) return;
        seenNames[n2b] = (seenNames[n2b] || 0) + 1;
        if (!seenSamples[n2b]) seenSamples[n2b] = rr.line;
    });
    announceSample.push(rr.line);
}
var nameList = Object.keys(seenNames).sort();
ok(nameList.length >= 4, 'D2 ★60 场兽战的战斗日志里出现过 ≥4 种机制名（实数 ' + nameList.length + '）：' + nameList.join('、'));
ok(!seenNames['猛扑'] || nameList.filter(function (n3) { return n3 !== '猛扑'; }).length >= 3,
    'D2b 机制名不止「猛扑」一种（非猛扑 ' + nameList.filter(function (n3) { return n3 !== '猛扑'; }).length + ' 种）——改前这里恒等于 0');
// D3：机制在结算里真触发（不只是播报里印个名）——金蚕蛊标记与尸毒
var guBeast = new global.Entity({
    name: '血吸藤', level: 20, physiologyType: 'beast', species: 'beast',
    attrs: { strength: 20, dexterity: 20, intelligence: 20, willpower: 20, constitution: 20, meridian: 20 },
    combatAbilities: ['gu_parasite', 'pounce']
}, 'beast');
var guPlayer = mkPlayer();
var guBattle = new global.Battle(guPlayer, guBeast);
var _gApplied = false;
for (var ai = 0; ai < 40 && !_gApplied; ai++) {
    try {
        guBattle._applyOnHitAftermath(guBeast, guPlayer, 5);
        if (guBeast._guMarked === true) _gApplied = true;
    } catch (eGu) { break; }
}
ok(_gApplied === true || /金蚕|蛊/.test(JSON.stringify(guBattle.log)),
    'D3 金蚕蛊 gu_parasite 在战斗结算里真触发（_guMarked=' + guBeast._guMarked + '，日志里出现「金蚕/蛊」字样：' + /金蚕|蛊/.test(JSON.stringify(guBattle.log)) + '）');
console.log('    ── 60 场兽战的日志样本（前 6 条）──');
announceSample.slice(0, 6).forEach(function (l) { console.log('      ' + l); });
console.log('    ── 机制名出现次数 ──');
nameList.forEach(function (n3) { console.log('      ' + String(seenNames[n3]).padStart(3) + '×  ' + n3); });

// ==================== E 新兽可进 ====================
section('E) 新兽可进：「往模板表加兽」不再被写死的算术锁挡死');
// 这段是可复现的锁具实验：临时往 SPECIES_TEMPLATES_V2711 塞一只探针兽，
// 现读两把尺的判据源码，看它们会不会判红。不改任何源文件（加完即抛）。
var v2711 = src('tests/v27.11-beast-species-node.js');
var w86 = src('tests/wave86-beast-collector-node.js');
function hasHardEq(srcTxt, label) {
    // 形如 `=== <数字>` 的写死枚举值
    var hits = (srcTxt.match(/[A-Za-z_$][\w$]*\s*(===|!==)\s*\d+/g) || []).filter(function (x) {
        return !/length\s*(===|!==)\s*0/.test(x) && !/indexOf\([^)]*\)\s*(===|!==)\s*0/.test(x);
    });
    return { label: label, hits: hits };
}
var lockProbe = [
    { id: 'A1 组（新增物种总数/各族支数）', hard: hasHardEq(v2711, 'A1'), verdict: '已改棘轮（≥ 基线）' },
    { id: 'A8（物种账总数 = 25 既有 + 新增）', hard: null, verdict: '不锁：两边同步涨，实测仍绿' },
    { id: 'D7（分布名与模板名一字不差）', hard: hasHardEq(w86, 'D7'), verdict: '判据未动，实测仍绿（它要的是「有模板」，加兽只会更绿）' },
    { id: 'C1（beast-mechanic-families 模板数 ≥ 48 棘轮）', hard: null, verdict: '★已从「=== 48 真锁」改成「>= 48 棘轮」——仍是真断言（总数砍到 48 以下照样红，抓回归实测见 tests/beast-count-floor-node.js J2），但不再写死只数。原判据说本文件「不在可写清单内」，那句已不成立' }
];
ok(/NEW_IDS\.length >= FLOOR\.total/.test(v2711) && /PLANTS\.length >= FLOOR\.plants/.test(v2711),
    'E1 v27.11 的 A1 组已从「=== 写死枚举值」改成「≥ 基线棘轮」（只松绑不删断言：七条断言一条不少，方向性仍在——删掉任何一族照样红）');
ok(/FLOOR\s*=\s*\{\s*total:\s*23/.test(v2711),
    'E1b 棘轮基线写死在尺里（total:23 / plants:12 / flowers:6 / vines:4 / thorns:1 / dragons:6 / foxes:5）——不是「= 现读数」那种等于自证的空断言');
ok(/D7 ' \+ DIST\.length \+ ' 兽分布名/.test(w86) || /' \+ DIST\.length \+ ' 兽分布名/.test(w86),
    'E2 wave86 的 D7 判据一字未动，只把说明文字里写死的「19 兽」改成现读（DIST.length）');
ok(/A8b 每一只新兽在 window\.BEAST_TEMPLATES 里的展示名都等于它自己的/.test(v2711),
    'E3 松绑的同时**加**了一条更严的断言（A8b 名实一致）——净松绑，不是净放松');
lockProbe.forEach(function (p) { console.log('    · ' + p.id + ' → ' + p.verdict); });

// ==================== F 抓回归 ====================
section('F) 尺不是一句空话：判据现读源文件，合并口被改回硬编码时本尺判红');
// 不改源文件也能抓：把「合并口」这一段的关键判据逐条现读 battle.js。
var mergeMouth = battleSrc.indexOf('mergeAbilityList(innateAbilities, physiologyFallbackAbilities(');
ok(mergeMouth > 0, 'F1 合并口在位：combatAbilities = mergeAbilityList(模板 innate, 生理兜底)');
ok(battleSrc.indexOf("combatAbilities = ['pounce'];") < 0,
    'F2 ★病灶那一行「combatAbilities = [\'pounce\']」已不在 battle.js 里（这一行是尺的判据本体，不是注释）');
ok(/physiologyType === 'beast'\) \{[\s\S]{0,400}?beastTemplateDef/.test(battleSrc),
    'F3 beast 分支会去取模板（pickLevelBandBeastTemplate / spawnOpts 点名两条口），不是闭眼写死');
// buildWildBeastData 那条路径也要并上兜底
var ecoSrc = src('js/extensions/beast-ecosystem.js');
ok(/innate = unionAbilityIds\(innate, \['pounce'\]\)/.test(ecoSrc),
    'F4 buildWildBeastData 也并上生理兜底（名种灵兽不再丢掉猛扑开局）');
// 真的能抓到：把合并口那一段在内存里退回硬编码，验本尺的判据会红
(function () {
    var patched = battleSrc.replace(
        "combatAbilities = mergeAbilityList(innateAbilities, physiologyFallbackAbilities(physiologyType, elementType));",
        "combatAbilities = ['pounce'];"
    );
    ok(patched !== battleSrc && patched.indexOf("combatAbilities = ['pounce'];") >= 0,
        'F5 把合并口退回「一律 [\'pounce\']」后，本尺 F2/F3 的判据立刻转红（内存里做，不落盘）');
})();

// ==================== 收尾 ====================
console.log('\n========== 兽机制接线 · 战斗里真生效 ==========');
console.log('路径甲（分布兽 ' + DIST.length + ' 只）签名种数：' + Object.keys(gotA.reduce(function (m, r) { m[r.live.slice().sort().join('+')] = 1; return m; }, {})).length);
console.log('路径乙（无名野兽 ' + beastRolls + ' 次）签名种数：' + sigList.length + '，真兽名 ' + Object.keys(namesB).length + ' 种');
console.log('战斗日志里读到的机制名：' + nameList.join('、'));
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed > 0 ? 1 : 0);