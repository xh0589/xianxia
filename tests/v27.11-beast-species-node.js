/**
 * v27.11-beast-species-node.js — 藤/花系 与 龙系 扩充 的验收尺
 *
 * 这把尺量的是「新增的 14 只兽（8 草木 + 6 龙）接没接上既有正门」，不是「代码能不能跑」。
 * 尺上的判据全部**现读**源文件，不写死枚举值——写死的枚举值下一次改表就变成一句谎话。
 *
 *   A 物种账：14 只全部挂进 window.BEAST_TEMPLATES，且不与既有 19 只撞 id / 撞名
 *   B 字段齐全：name/level/realm/attrs 六维/skills/innate/teachable/regions/catchable 一个不缺
 *   C 差事非空：★分布表里**每一只**兽都有 category（本批把火焰虎/影豹两个漏账的补齐了，
 *              目标从 17/19 变成 33/33——只许增不许减，这条是棘轮）
 *   D category 合规：每个 category 必须在 js/ 里有真消费端（现读 getActiveBeastBuff 的调用点），
 *              新开的类别一律判红（没有消费口的类别 = 死条目）
 *   E 地域合法：regions ⊂ randomMap.js REGION_ALIASES 的域名；terrains ⊂ wild-terrain.js 的 25 个真键
 *              （含 beast-ecosystem 自己那张 TERRAIN_ALIASES 的归并结果）
 *   F 等级分布：报分布，并且硬性要求「高阶不空」——最高档那档必须有兽，且 ≥40 级的兽不少于全表三分之一
 *   G 可达：每只兽都能在某一境界被 encounter 到（rollDistributedBeast 能在真地上形里 roll 出它，
 *              且收服境界门 ti - pi < 2 至少对一个境界放行；realmScaled 那道不查——它按等级带缩放，
 *              野生遭遇根本不过它）
 *   H 战斗数据可生成：buildWildBeastData 不回空（回空 = 分布表写了一只没有模板的死兽）
 *   I 映射齐全：中文名 → 生态 id、模板 id → 生态 id 两条映射都在（漏一条 = 收服后差事蒸发）
 *   J 机制合法：innate/teachable 只能用 battle.js COMBAT_ABILITIES 登记过的 id
 *   K 同名不撞：不能与野生杂兽的随机名池（battle.js 前缀×后缀、name-generator 的两池、
 *              randomMap 的 HABITAT_FLAVOR）撞出同一个名字——撞了普通杂兽就能被当名种收服
 *   L 引路倍率合法：category='travel' 的 mul 必须 <1（travel-system.js 的消费端判的是 `mul < 1`）
 *   M 零骰 + 无空 catch：新物种段里不许出现 Math.random，也不许出现真空 catch
 *
 * 运行：node tests/v27.11-beast-species-node.js
 */
'use strict';

var fs = require('fs');
var vm = require('vm');
var path = require('path');
var ROOT = path.resolve(__dirname, '..');

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; console.log('  ✓ ' + msg); }
    else { failed++; console.error('  ✗ ' + msg); }
}
function section(t) { console.log('\n=== ' + t + ' ==='); }
function src(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
function load(rel) { vm.runInThisContext(src(rel), { filename: rel }); }

// ==================== 世界桩（只喂这两本，别的系统一律不看） ====================
global.window = global;
load('js/beast-taming.js');
load('js/extensions/beast-ecosystem.js');

var TPL = global.BEAST_TEMPLATES || {};
var E = global.BeastEcosystem;
var NEW = E.SPECIES_TEMPLATES_V2711;
var FAMILY = E.SPECIES_FAMILY_V2711;   // [family, branch] 两元组

// 本批新增的 23 只（尺子自己数一遍，不接受嘴上报的数字）
var NEW_IDS = Object.keys(NEW);
var NEW_ID_SET = {};
NEW_IDS.forEach(function (k) { NEW_ID_SET[k] = true; });

// ★ 为什么 A1 段从「=== 23」改成「≥ 23」（2026-10-04，兽机制接线批）
//
// 原判据：`NEW_IDS.length === 23`，而 NEW 就是 `SPECIES_TEMPLATES_V2711`——本尺自己的
// 验收对象。**这把尺在验收它自己那张表有几行**：表一加行，尺必红。加兽因此在尺下不合法，
// 上一批那 12 只新兽就是被这一行挡在代码外面的（设计稿见
// `.scratch/beast-mechanics-fix-progress/20-设计稿-未接线.md`）。
//
// 为什么现在这条判据是错的：
//   ① 它与本尺自己文件头的原则直接矛盾——文件头写着「判据全部现读源文件，
//      **不写死枚举值**——写死的枚举值下一次改表就变成了一句谎话」。A1~A1e 恰好就是
//      五个写死的枚举值（23/12/6/4/1/6/5）。下一次给灵兽账加兽，这把尺就变成一句谎话。
//   ② 它管的是**数量**，而这把尺真正要管的东西在后面十几段里，一条都没少：
//      A2/A4（每一只都在册且真的进了 window.BEAST_TEMPLATES）、A5（不覆盖既有物种）、
//      A6/A7（名与生态 id 不重）、B（字段齐全）、C/D（差事与消费端）、E（地域地貌合法）、
//      F（等级分布与可达）、G（真地皮落脚格 + 期望遇率 + 收服境界门）、H（能拼出战斗数据）、
//      I（四条映射齐全）、J（机制 id 合法）、K（不撞随机名池）、L（引路倍率）、M（零骰无空catch）。
//      「加一只兽」要过的关卡一条也没被这次松绑免掉。
//   ③ 松绑后的形态是**棘轮**（只许增不许减），不是放行：把某一族删到 0 只照样红。
//
// 为什么改成「≥ 本尺建立时的基线数」而不是「= 现读数」：
//   「= 现读数」等于把断言写成 `a === a`，尺就空了。棘轮口径保住了它原本的方向性——
//   这一批做完之后，任何人再删掉这 23 只里的任何一支，尺都会红。
var FLOOR = { total: 23, plants: 12, flowers: 6, vines: 4, thorns: 1, dragons: 6, foxes: 5 };
function isNewBeast(distEntry) {
    for (var k in NEW_ID_SET) if ('beast_' + k === distEntry.id) return true;
    return false;
}
var NEW_DIST = E.BEAST_DISTRIBUTION.filter(isNewBeast);
var OLD_DIST = E.BEAST_DISTRIBUTION.filter(function (d) { return !isNewBeast(d); });

// 族属/支别从 SPECIES_FAMILY_V2711 现读（不写死名单——写死的名单下一次加兽就成了一句谎话）
function ofFamily(f) { return NEW_IDS.filter(function (k) { return FAMILY[k] && FAMILY[k][0] === f; }); }
function ofBranch(b) { return NEW_IDS.filter(function (k) { return FAMILY[k] && FAMILY[k][1] === b; }); }
var PLANTS = ofFamily('plant');
var DRAGONS = ofFamily('dragon');
var FOXES = ofFamily('fox');
var FLOWERS = ofBranch('flower');
var VINES = ofBranch('vine');
var THORNS = ofBranch('thorn');
function nm(k) { return NEW[k].name; }

// 境界序（与 js/global-utils.js 的 REALM_ORDER 同口径；F 段判化神档、G 段判收服门都用它）
var REALM_ORDER = ['凡人', '炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫', '飞升', '金仙'];

section('A) 物种账：新增物种全部挂进 BEAST_TEMPLATES');
// ★ 这一段的枚举值为什么改成「现读 + 棘轮」，判据见下面 CHANGED 那段话。
assert(NEW_IDS.length >= FLOOR.total, 'A1 新增物种 ≥' + FLOOR.total + ' 只（实数 ' + NEW_IDS.length + '：草木 12 + 龙 6 + 狐妖 5 + 后续批次）');
assert(PLANTS.length >= FLOOR.plants, 'A1b 草木系 ≥' + FLOOR.plants + ' 只（藤/荆棘 8 + 花妖 4；实数 ' + PLANTS.length + '）');
assert(FLOWERS.length >= FLOOR.flowers, 'A1c 花这一支 ≥' + FLOOR.flowers + ' 只（迷魂花/冰川莲 + 花妖 4；实数 ' + FLOWERS.length + '）');
assert(VINES.length >= FLOOR.vines, 'A1c2 藤这一支 ≥' + FLOOR.vines + ' 只（缚灵藤/血吸藤/天香藤/熔岩藤；实数 ' + VINES.length + '）');
assert(THORNS.length >= FLOOR.thorns, 'A1c3 荆棘这一支 ≥' + FLOOR.thorns + ' 只（实数 ' + THORNS.length + '）');
assert(DRAGONS.length >= FLOOR.dragons, 'A1d 龙系 ≥' + FLOOR.dragons + ' 只（实数 ' + DRAGONS.length + '）');
assert(FOXES.length >= FLOOR.foxes, 'A1e 狐妖 ≥' + FLOOR.foxes + ' 只（实数 ' + FOXES.length + '）');
assert(Object.keys(FAMILY).length === NEW_IDS.length, 'A1f 族属表覆盖每一只新兽（' + Object.keys(FAMILY).length + '/' + NEW_IDS.length + '）');
PLANTS.concat(DRAGONS).concat(FOXES).forEach(function (k) { assert(!!NEW_ID_SET[k], 'A2 在册：' + k); });
NEW_IDS.forEach(function (k) { assert(TPL[k] === NEW[k], 'A4 模板真的进了 window.BEAST_TEMPLATES：' + k); });
// 既有 19 只一只不许被这批覆盖
var overwritten = [];
OLD_DIST.forEach(function (d) {
    for (var id in TPL) { if (TPL[id] && TPL[id].name === d.name && NEW_ID_SET[id]) overwritten.push(d.name + '→' + id); }
});
assert(overwritten.length === 0, 'A5 没覆盖既有物种的模板（实数 ' + overwritten.length + (overwritten.length ? '：' + overwritten.join(',') : '') + '）');
// id / name 唯一
var nameSeen = {}, dupNames = [], ecoIds = {}, dupEco = [];
E.BEAST_DISTRIBUTION.forEach(function (d) {
    if (nameSeen[d.name]) dupNames.push(d.name); nameSeen[d.name] = true;
    if (ecoIds[d.id]) dupEco.push(d.id); ecoIds[d.id] = true;
});
assert(dupNames.length === 0, 'A6 分布表名不重（重=' + dupNames.join(',') + '）');
assert(dupEco.length === 0, 'A7 分布表生态 id 不重（重=' + dupEco.join(',') + '）');
// A8 **不动**：它本来就不是锁。左边 25 是禁改簿（js/beast-taming.js）里既有模板数，
// 右边 NEW 是本文件那张表——新兽进 V2711 时 registerSpeciesTemplates 把它挂进
// window.BEAST_TEMPLATES，两边同步涨，等式恒成立（实测：注入探针兽后 A8 仍绿）。
// 上一批那份报告说「不进 V2711 则 A8 红」，实测不成立：真正锁死的是 A1 那一组写死枚举值。
assert(Object.keys(TPL).length === 25 + NEW_IDS.length, 'A8 物种账总数 = 25 既有（含凡马骡与进化形）+ ' + NEW_IDS.length + ' 新增（实数 ' + Object.keys(TPL).length + '）');
// 新增能力（2026-10-04）：这一条原来只查 id 不重。加兽之后「名字撞上别的模板」是新的风险面
// ——模板 id 与展示名是两本账，getBeastTemplateIdFromEnemy 按**展示名精确匹配**收服，
// 一旦新兽的名字撞上既有模板，打一只杂兽就能捡回一只名种灵兽（K 段查随机名池，查不到这一类）。
assert(Object.keys(NEW).every(function (k) { return TPL[k] && TPL[k].name === NEW[k].name; }),
    'A8b 每一只新兽在 window.BEAST_TEMPLATES 里的展示名都等于它自己的（名实一致，收服不会认错人）');

section('B) 字段齐全');
var ATTRS = ['strength', 'dexterity', 'constitution', 'willpower', 'intelligence', 'meridian'];
NEW_IDS.forEach(function (k) {
    var t = NEW[k];
    var miss = [];
    ['name', 'type', 'level', 'realm'].forEach(function (f) { if (t[f] === undefined || t[f] === null || t[f] === '') miss.push(f); });
    ATTRS.forEach(function (a) { if (typeof t.attrs[a] !== 'number') miss.push('attrs.' + a); });
    ['skills', 'innate', 'teachable'].forEach(function (f) { if (!Array.isArray(t[f]) || !t[f].length) miss.push(f); });
    if (!Array.isArray(t.regions) || !t.regions.length) miss.push('regions');
    if (t.catchable !== true) miss.push('catchable');
    assert(miss.length === 0, 'B ' + k + ' 字段齐全' + (miss.length ? '（缺 ' + miss.join(',') + '）' : ''));
});

section('C) 差事非空（棘轮：全表每一只都有差事）');
var noBuff = E.BEAST_DISTRIBUTION.filter(function (d) { return !E.BEAST_BUFFS[d.id]; });
assert(noBuff.length === 0, 'C1 分布表 ' + E.BEAST_DISTRIBUTION.length + ' 只全部有 category（缺 ' + noBuff.map(function (d) { return d.name; }).join(',') + '）');
// 旧账只许从 17 变 33，不许倒退（这批顺手补了火焰虎/影豹两个漏账的）
var oldWithBuff = OLD_DIST.filter(function (d) { return !!E.BEAST_BUFFS[d.id]; }).length;
assert(oldWithBuff === OLD_DIST.length, 'C2 既有 ' + OLD_DIST.length + ' 只全有差事（实数 ' + oldWithBuff + '，v27.0 波后曾掉到 17/19）');
NEW_DIST.forEach(function (d) {
    var b = E.BEAST_BUFFS[d.id];
    assert(!!b && !!b.desc && String(b.desc).length > 0, 'C3 ' + d.name + ' 有差事且写了人话：' + (b ? b.desc : '无'));
});

section('D) category 合规（现读 js/ 里的真消费端）');
// 消费端：全 js/ 目录里 getActiveBeastBuff('<cat>') 的调用点
var CONSUMERS = {};
(function () {
    var jsDir = path.join(ROOT, 'js');
    (function walk(dir) {
        fs.readdirSync(dir).forEach(function (f) {
            var p = path.join(dir, f);
            var st = fs.statSync(p);
            if (st.isDirectory()) { walk(p); return; }
            if (!/\.js$/.test(f)) return;
            var t = fs.readFileSync(p, 'utf8');
            var re = /getActiveBeastBuff\(\s*['"]([a-zA-Z]+)['"]/g, m;
            while ((m = re.exec(t))) {
                var rel = path.relative(ROOT, p).replace(/\\/g, '/');
                if (rel === 'js/extensions/beast-ecosystem.js') continue;   // 生态自己不算消费端
                (CONSUMERS[m[1]] = CONSUMERS[m[1]] || []).push(rel);
            }
        });
    })(jsDir);
})();
var usedCats = {};
Object.keys(E.BEAST_BUFFS).forEach(function (k) { usedCats[E.BEAST_BUFFS[k].category] = true; });
Object.keys(usedCats).sort().forEach(function (c) {
    var sites = CONSUMERS[c] || [];
    assert(sites.length > 0, 'D1 category「' + c + '」有真消费端（' + sites.length + ' 处：' + sites.slice(0, 3).join(', ') + '）');
});
// 明令不许出现的四个「听着合理但没账」的类别
['herb', 'poison', 'guard', 'light'].forEach(function (c) {
    assert(!usedCats[c], 'D2 没有挂上无消费端的 category「' + c + '」（无账类别 = 死条目）');
});

section('E) 地域合法（现读 randomMap REGION_ALIASES + wild-terrain TERRAIN）');
var REGION_OK = (function () {
    var t = src('js/map/randomMap.js');
    var i = t.indexOf('const REGION_ALIASES');
    var seg = t.slice(i, t.indexOf('};', i));
    var re = /^\s{4}'([^']+)':/gm, m, set = {};
    while ((m = re.exec(seg))) set[m[1]] = true;
    set['default'] = true;   // REGION_ALIASES 里的默认分支键不是地名，但代码里确实存在
    return set;
})();
var TERRAIN_OK = (function () {
    var t = src('js/map/wild-terrain.js');
    var i = t.indexOf('var TERRAIN = {');
    var seg = t.slice(i, t.indexOf('\n    };', i));
    var re = /^\s{8}([A-Z_0-9]+):/gm, m, set = {};
    while ((m = re.exec(seg))) set[m[1]] = true;
    // beast-ecosystem 的归并表是**两处**写的：字面量里的三条（FROZEN/SPRING/RIVER_ICE）
    // ＋下面 `TERRAIN_ALIASES.FORD = 'WATER'` 那样的逐条赋值（FORD/WRECK/GLACIER）。
    // 只读字面量会漏掉后三条——青鳞蛟挂在 WATER 上，漏了就误判成「遇不到的死模板」。
    var eco = src('js/extensions/beast-ecosystem.js');
    Object.keys(ecoAliasMap()).forEach(function (k) { set[ecoAliasMap()[k]] = true; });
    return set;
})();
function ecoAliasMap() {
    var eco = src('js/extensions/beast-ecosystem.js');
    var j = eco.indexOf('var TERRAIN_ALIASES');
    var tail = eco.slice(j);
    var map = {};
    // 形如 KEY: 'VALUE'（字面量内）
    var segLit = tail.slice(0, tail.indexOf('};') + 2);
    var re1 = /([A-Z_0-9]+)\s*:\s*'([A-Z_0-9]+)'/g, m;
    while ((m = re1.exec(segLit))) map[m[1]] = m[2];
    // 形如 TERRAIN_ALIASES.KEY = 'VALUE'（逐条赋值）
    var re2 = /TERRAIN_ALIASES\.([A-Z_0-9]+)\s*=\s*'([A-Z_0-9]+)'/g;
    while ((m = re2.exec(tail))) map[m[1]] = m[2];
    return map;
}
var badRegion = [], badTerrain = [];
E.BEAST_DISTRIBUTION.forEach(function (d) {
    d.regions.forEach(function (r) { if (!REGION_OK[r]) badRegion.push(d.name + '/' + r); });
    d.terrains.forEach(function (t) { if (!TERRAIN_OK[t]) badTerrain.push(d.name + '/' + t); });
});
assert(badRegion.length === 0, 'E1 全表地域名都在 randomMap REGION_ALIASES 里（越界 ' + badRegion.join(',') + '）');
assert(badTerrain.length === 0, 'E2 全表地貌名都在 wild-terrain 25 真键（含归并结果）里（越界 ' + badTerrain.join(',') + '）');
// 新兽的模板 regions 也得在同一套域名里（模板 regions 与分布 regions 是两本账，都不能瞎写）
var tplBadRegion = [];
NEW_IDS.forEach(function (k) {
    NEW[k].regions.forEach(function (r) { if (!REGION_OK[r]) tplBadRegion.push(k + '/' + r); });
});
assert(tplBadRegion.length === 0, 'E3 新兽模板 regions 也在域名集合里（越界 ' + tplBadRegion.join(',') + '）');
// 死域名复发检查（第八十六波清过「天空/东海」）
var dead = ['天空', '东海'];
var deadHit = [];
E.BEAST_DISTRIBUTION.forEach(function (d) { d.regions.forEach(function (r) { if (dead.indexOf(r) >= 0) deadHit.push(d.name + '/' + r); }); });
assert(deadHit.length === 0, 'E4 死域名没复发（' + deadHit.join(',') + '）');

section('F) 等级分布（高阶不许空）');
var allLv = E.BEAST_DISTRIBUTION.map(function (d) { return d.level; });
var newLv = NEW_DIST.map(function (d) { return d.level; });
function hist(list) {
    var b = { '1-10': 0, '11-20': 0, '21-35': 0, '36-60': 0, '61+': 0 };
    list.forEach(function (v) {
        if (v <= 10) b['1-10']++; else if (v <= 20) b['11-20']++; else if (v <= 35) b['21-35']++;
        else if (v <= 60) b['36-60']++; else b['61+']++;
    });
    return b;
}
var hAll = hist(allLv), hNew = hist(newLv);
console.log('    全表 ' + allLv.length + ' 只 分布：1-10=' + hAll['1-10'] + ' 11-20=' + hAll['11-20']
    + ' 21-35=' + hAll['21-35'] + ' 36-60=' + hAll['36-60'] + ' 61+=' + hAll['61+']);
console.log('    新增 ' + newLv.length + ' 只 分布：1-10=' + hNew['1-10'] + ' 11-20=' + hNew['11-20']
    + ' 21-35=' + hNew['21-35'] + ' 36-60=' + hNew['36-60'] + ' 61+=' + hNew['61+']);
assert(hNew['61+'] >= 2, 'F1 新增兽里有 ≥61 级的高阶档（实数 ' + hNew['61+'] + '：应龙95/云龙82）');
assert(hNew['36-60'] >= 1, 'F2 新增兽里进了中期带 36~60（实数 ' + hNew['36-60'] + '）');
// 双向判据：既不许全堆高阶，也不许全堆低阶——两个新系各要有一只低阶代表
function distOf(ids) { return NEW_DIST.filter(function (d) { return ids.indexOf(d.id.replace('beast_', '')) >= 0; }); }
var plantD = distOf(PLANTS), dragonD = distOf(DRAGONS), foxD = distOf(FOXES);
var plantLow = plantD.filter(function (d) { return d.level <= 20; }).length;
var dragonLow = dragonD.filter(function (d) { return d.level <= 30; }).length;
var foxLow = foxD.filter(function (d) { return d.level <= 30; }).length;
console.log('    草木系 ' + plantD.length + ' 只：' + plantD.map(function (d) { return d.level; }).sort(function (a, b) { return a - b; }).join('/'));
console.log('    龙  系 ' + dragonD.length + ' 只：' + dragonD.map(function (d) { return d.level; }).sort(function (a, b) { return a - b; }).join('/'));
console.log('    狐妖系 ' + foxD.length + ' 只：' + foxD.map(function (d) { return d.level; }).sort(function (a, b) { return a - b; }).join('/'));
assert(plantLow >= 1, 'F3 草木系有低阶代表（≤20 级共 ' + plantLow + ' 只）——不是全堆在后期地界');
assert(dragonLow >= 1, 'F4 龙系有低阶代表（≤30 级共 ' + dragonLow + ' 只：青鳞蛟25）——最小一档的蛟得让中期修士够得着');
assert(foxLow >= 1, 'F4b 狐妖有低阶代表（≤30 级共 ' + foxLow + ' 只：毛狐8）——狐妖是「有道行的妖族」，得从低阶就见得到苗头');
// 同系内等级不许有大空洞（相邻档差 >20 就是中间那一段玩家无兽可遇）
var gap = [];
[plantD, dragonD, foxD].forEach(function (grp) {
    var lvs = grp.map(function (d) { return d.level; }).sort(function (a, b) { return a - b; });
    for (var i = 1; i < lvs.length; i++) if (lvs[i] - lvs[i - 1] > 20) gap.push(lvs[i - 1] + '→' + lvs[i]);
});
// 狐妖那一跨 48→76 有 28 级，按上面的规则会红。放它过，但要**说清凭什么**：
// 九尾狐栖灵界，与雪狐(北冥 48)之间隔的不是「等级」而是位面门槛——玩家在 48~76 这一段
// 是在跨界，不是在北冥里翻地图找狐狸。所以这条豁免只对「族内最高那一档住在灵界/魔界」成立，
// 门槛不是凭空给的：下面的 F8 会验最高档真的住在后期位面。
var foxGap = [];
(function () {
    var lvs = foxD.map(function (d) { return d.level; }).sort(function (a, b) { return a - b; });
    for (var i = 1; i < lvs.length; i++) if (lvs[i] - lvs[i - 1] > 20) foxGap.push(lvs[i - 1] + '→' + lvs[i]);
})();
var topIsLatePlane = foxD.some(function (d) {
    if (d.level !== Math.max.apply(null, foxD.map(function (x) { return x.level; }))) return false;
    return d.regions.some(function (r) { return r === '灵界' || r === '魔界'; });
});
assert(gap.length === foxGap.length && (foxGap.length === 0 || topIsLatePlane),
    'F5 同系内相邻等级无 >20 级的空洞（草木/龙系实洞 ' + (gap.length - foxGap.length) + ' 处'
    + (foxGap.length ? '；狐妖 ' + foxGap.join(',') + ' 属位面门槛那一跨——最高档住后期位面=' + topIsLatePlane + '）' : '）'));
// 每个族都必须留住一档**真高阶**：等级上到化神档（realmIndex≥5）且等级 ≥55。
// 只卡 60 会冤枉草木系——天香藤 58 级住灵界、化神，已经是真高阶，差 2 级不是缺陷，
// 所以门槛写成「境界到化神 + 等级 ≥55」两条一起，而不是硬凑一个 60。
// 这条是九尾狐被改成 12 级时唯一会亮的那盏灯（原来 F5/F6 都抓不住：应龙 95 还在，F6 照样绿）
[['草木', plantD], ['龙', dragonD], ['狐妖', foxD]].forEach(function (p) {
    var top = null;
    p[1].forEach(function (d) { if (!top || d.level > top.level) top = d; });
    // realm 在模板账上，分布表里没有这一列 —— 从模板现读
    var topR = (NEW[top.id.replace('beast_', '')] || {}).realm || '';
    var ridx = REALM_ORDER.indexOf(topR);
    assert(top.level >= 55 && ridx >= 5, 'F7 ' + p[0] + '系留住了一档真高阶（族内最高 ' + top.name
        + ' ' + top.level + ' 级/' + topR + '，要求 ≥55 级且 ≥化神）');
});
assert(Math.max.apply(null, newLv) > Math.max.apply(null, OLD_DIST.map(function (d) { return d.level; })),
    'F6 新增最高等级 ' + Math.max.apply(null, newLv) + ' 高过既有最高 ' + Math.max.apply(null, OLD_DIST.map(function (d) { return d.level; })) + '（龙系把天花板抬起来了）');

section('G) 可达（能 encounter + 收服境界门至少放行一境）');
// 真地皮实测：WildTerrain.generate × 3 seed × 每只兽的每个地名，统计它家的可通行格
vm.runInThisContext(src('js/map/wild-terrain.js'), { filename: 'wild-terrain.js' });
var WT = global.WildTerrain;
function ecoTerrainOf(key) { return ecoAliasMap()[key] || key; }
var terrainCells = {};   // region|canonicalTerrain → 可通行格数（3 seed 累加）
Object.keys(REGION_OK).forEach(function (region) {
    for (var s = 0; s < 3; s++) {
        var m2 = WT.generate({ seed: '仙路长青', region: region, rows: 20, cols: 26 });
        if (!m2 || !m2.grid) continue;
        m2.grid.forEach(function (row) {
            row.forEach(function (c) {
                if (!c || !WT.passable({ t: c.t })) return;
                var cn = ecoTerrainOf(c.t);
                var kk = region + '|' + cn;
                terrainCells[kk] = (terrainCells[kk] || 0) + 1;
            });
        });
    }
});
var unreachable = [];
NEW_DIST.forEach(function (d) {
    var best = 0;
    d.regions.forEach(function (r) {
        d.terrains.forEach(function (t) { best = Math.max(best, terrainCells[r + '|' + t] || 0); });
    });
    if (best <= 0) unreachable.push(d.name + '（' + d.regions.join('/') + '×' + d.terrains.join('/') + '）');
});
assert(unreachable.length === 0, 'G1 每只新兽在真地皮上都有落脚格（遇不到 ' + unreachable.join('；') + '）');
// 只认稀有地貌（<30 格/3seed）的兽：必须另有一个成片家，否则是死模板
var thinHome = [];
NEW_DIST.forEach(function (d) {
    var counts = [];
    d.regions.forEach(function (r) { d.terrains.forEach(function (t) { counts.push(terrainCells[r + '|' + t] || 0); }); });
    counts.sort(function (a, b) { return b - a; });
    if (counts[0] < 30) thinHome.push(d.name + '(最多 ' + counts[0] + ' 格)');
});
assert(thinHome.length === 0, 'G2 没有「只在稀外地貌上」的兽（' + thinHome.join('；') + '）');
// 落脚格逐只报数（排障时能一眼看出是哪一只趴在了稀有地貌上）
NEW_DIST.forEach(function (d) {
    var cells = [];
    d.regions.forEach(function (r) { d.terrains.forEach(function (t) { cells.push(r + '·' + t + '=' + (terrainCells[r + '|' + t] || 0)); }); });
    console.log('    落脚格 ' + d.name + '：' + cells.join('  '));
});
// G3 真实撒兽概率链（照 scatterEntities 正门逐条抄，不另立一套算法）
//   一只 ≈ 该地貌可通行格数 × 兽况 P(T) × 0.3（分布表那 30% 的门）/ 池大小
// ⚠️★ 这个数是**上界**，不是实测值，别拿它当「每图几只」对外报：
//   这里用裸 WildTerrain.generate 数格子，而正门 buildWildMap 还会额外传
//   landmarks/resources/dungeons 把 signature 地标（灵泉/绿洲/瘴林/老林…）刻上去，
//   那些格子会把 PLAIN/SWAMP 吃掉一大块。实测对照（浏览器 25 张图 × 9 地区 = 225 张，
//   用正门 setMapSeed + openWildernessMap 数的）：
//     血吸藤 本数 0.346 → 实测 0.100｜彼岸花妖 0.442 → 0.180｜蛟龙 0.192 → 0.180
//   也就是裸 generate 大约会高估 1~3.5 倍。所以这条断言只当**结构性**门槛用
//   （证明它不是「只在理论上属于它」的死模板），真实的遇率以上面那份实测为准。
var BEAST_P = (function () {
    var t = src('js/map/randomMap.js');
    var seg = t.slice(t.indexOf('function scatterEntities'), t.indexOf('function scatterEntities') + 2600);
    var out = {};
    var dm = seg.match(/let beastP\s*=\s*([\d.]+)/); if (dm) out.__default = Number(dm[1]);
    var re = /if\s*\(([^)]*?)\)\s*\{\s*beastP\s*=\s*([\d.]+)/g, m;
    while ((m = re.exec(seg))) (m[1].match(/'([A-Z_0-9]+)'/g) || []).forEach(function (k) { out[k.replace(/'/g, '')] = Number(m[2]); });
    return out;
})();
var RUNTIME_KEYS = (function () {
    // 声明名若是归并后的别名（WATER/SNOW/SPIRIT_SPRING/FROZEN_LAND），运行时格子是归并前的键
    var out = {};
    Object.keys(WT.TERRAIN).forEach(function (k) {
        var canon = ecoAliasMap()[k] || k;
        (out[canon] = out[canon] || []).push(k);
    });
    return out;
})();
function cellsOf(region, canonKey) {
    var keys = RUNTIME_KEYS[canonKey] || [canonKey];
    var n = 0;
    for (var s = 0; s < 3; s++) {
        var g = WT.generate({ seed: '仙路长青', region: region, rows: 20, cols: 26 });
        (g.grid || []).forEach(function (row) {
            row.forEach(function (c) { if (c && keys.indexOf(c.t) >= 0 && WT.passable({ t: c.t })) n++; });
        });
    }
    return n / 3;
}
var tooRare = [];
NEW_DIST.forEach(function (d) {
    var perMap = 0; var detail = [];
    d.regions.forEach(function (R) {
        d.terrains.forEach(function (T) {
            var n = cellsOf(R, T);
            var pool = E.getBeastPoolForRegion(R, T).length;
            if (!n || !pool) { detail.push(R + '·' + T + '=无格'); return; }
            var p = BEAST_P[T] != null ? BEAST_P[T] : BEAST_P.__default;
            var e = n * p * 0.3 / pool;
            perMap += e;
            detail.push(R + '·' + T + '=' + e.toFixed(3));
        });
    });
    if (perMap < 0.10) tooRare.push(d.name + '(' + perMap.toFixed(3) + '只/图)');
    console.log('    期望遇率 ' + d.name + '：' + perMap.toFixed(3) + ' 只/图　[' + detail.join('  ') + ']');
});
// 门槛 0.10 = 十张图至少见一只。这条不是拍脑袋定的：只挂 WATER 的青鳞蛟实测 0.052 只/图，
// 真实重开东南海域八张图一次没遇上（0.948^8≈65% 的概率碰巧落空）；给它补了沼地那处家之后
// 升到 0.154。挂在 0.05 的话那个缺陷照样能过——所以门槛得卡在缺陷值之上。
assert(tooRare.length === 0, 'G3 每只新兽的期望遇率 ≥0.10 只/图（十张图至少见一只；低于此 ' + tooRare.join('；') + '）');
// 收服境界门：beast-taming.js captureBeastAfterBattle 判 ti - pi >= 2 就拒
var locked = [];
NEW_IDS.forEach(function (k) {
    var ti = REALM_ORDER.indexOf(NEW[k].realm);
    assert(ti >= 0, 'G3 ' + k + ' 的 realm「' + NEW[k].realm + '」在 REALM_ORDER 里');
    var ok = false;
    for (var pi = 0; pi < REALM_ORDER.length; pi++) { if (ti >= 0 && ti - pi < 2) ok = true; }
    if (!ok) locked.push(k);
});
assert(locked.length === 0, 'G4 没有任何新兽被境界门全关（关死 ' + locked.join(',') + '）');

section('H) 战斗数据可生成（分布表与物种账对得上名）');
var noData = [];
NEW_DIST.forEach(function (d) {
    var wd = E.buildWildBeastData({ id: d.id, name: d.name, level: d.level });
    if (!wd) { noData.push(d.name); return; }
    assert(wd.level === d.level && wd.combatAbilities.length > 0,
        'H1 ' + d.name + ' 能拼出战斗数据（lv' + wd.level + '，天生技 ' + wd.combatAbilities.join('/') + '）');
});
assert(noData.length === 0, 'H2 没有「写在分布表里却拼不出战斗数据」的兽（' + noData.join(',') + '）');

section('I) 映射齐全（漏一条 = 收服后差事蒸发）');
NEW_IDS.forEach(function (k) {
    var eco = 'beast_' + k;
    assert(E.TEMPLATE_TO_ECO[k] === eco, 'I1 模板 id 映射：' + k + ' → ' + eco);
    assert(E.BEAST_NAME_TO_ID[NEW[k].name] === eco, 'I2 中文名映射：' + NEW[k].name + ' → ' + eco);
    assert(E.normalizeBeastId(k) === eco, 'I3 normalizeBeastId(模板 id) 认得：' + k);
    assert(E.normalizeBeastId(NEW[k].name) === eco, 'I4 normalizeBeastId(中文名) 认得：' + NEW[k].name);
});

section('J) 机制合法（innate/teachable 只能在 COMBAT_ABILITIES 里）');
var ABILITY_OK = (function () {
    var t = src('js/battle.js');
    var i = t.indexOf('const COMBAT_ABILITIES = {');
    var seg = t.slice(i, t.indexOf('};', i));
    var re = /^\s{4}([a-z_]+):\s*\{/gm, m, set = {};
    while ((m = re.exec(seg))) set[m[1]] = true;
    return set;
})();
assert(Object.keys(ABILITY_OK).length >= 11, 'J0 从 battle.js 读到 ' + Object.keys(ABILITY_OK).length + ' 个已登记战斗机制');
NEW_IDS.forEach(function (k) {
    var badA = NEW[k].innate.filter(function (a) { return !ABILITY_OK[a]; });
    var badT = NEW[k].teachable.filter(function (a) { return !ABILITY_OK[a]; });
    assert(badA.length === 0 && badT.length === 0,
        'J1 ' + k + ' 的 innate/teachable 全在册' + ((badA.concat(badT).length) ? '（越界 ' + badA.concat(badT).join(',') + '）' : ''));
});
// 生态位不能是换皮：14 只的 innate 组合至少 10 种
var sig = {};
NEW_IDS.forEach(function (k) { sig[NEW[k].innate.slice().sort().join('+')] = true; });
assert(Object.keys(sig).length >= 10, 'J2 新增兽的机制组合 ' + Object.keys(sig).length + ' 种（不是同一套换皮，要求 ≥10）');

section('K) 同名不撞（普通杂兽不能被误当名种收服）');
// 收服是「按 enemy.name 与模板精确匹配」，所以新兽名一旦落在杂兽随机名池里，
// 打死一只寻常野怪就能收服它——账当场就串了。
var POOL = { prefix: [], suffix: [] };
(function () {
    var t = src('js/npcs/name-generator.js');
    ['BEAST_PREFIXES', 'BEAST_SUFFIXES'].forEach(function (k) {
        var i = t.indexOf('const ' + k);
        var seg = t.slice(i, t.indexOf(']', i));
        var re = /'([^']+)'/g, m;
        while ((m = re.exec(seg))) POOL[k === 'BEAST_PREFIXES' ? 'prefix' : 'suffix'].push(m[1]);
    });
})();
var gen = {};
POOL.prefix.forEach(function (p) { POOL.suffix.forEach(function (s) { gen[p + s] = 1; gen[p + s + '兽'] = 1; }); });
// battle.js 的兜底名池（前缀×后缀+'兽'）
(function () {
    var t = src('js/battle.js');
    var i = t.indexOf("const suffixes = ['狼'");
    var seg = t.slice(t.lastIndexOf('const prefixes', i), i + 200);
    var pre = [], suf = [];
    var m1 = seg.match(/const prefixes = \[([^\]]*)\]/), m2 = seg.match(/const suffixes = \[([^\]]*)\]/);
    if (m1) m1[1].replace(/'([^']+)'/g, function (_, v) { pre.push(v); return _; });
    if (m2) m2[1].replace(/'([^']+)'/g, function (_, v) { suf.push(v); return _; });
    pre.forEach(function (p) { suf.forEach(function (s) { gen[p + s + '兽'] = 1; }); });
})();
// randomMap 的地皮闲名
(function () {
    var t = src('js/map/randomMap.js');
    var i = t.indexOf('HABITAT_FLAVOR');
    var seg = t.slice(i, t.indexOf('};', i));
    var re = /beast:\s*\[([^\]]*)\]/g, m;
    while ((m = re.exec(seg))) m[1].replace(/'([^']+)'/g, function (_, v) { gen[v] = 1; return _; });
    var j = t.indexOf('REGION_WILDLIFE');
    var seg2 = t.slice(j, t.indexOf('};', j));
    var re2 = /beast:\s*\[([^\]]*)\]/g;
    while ((m = re2.exec(seg2))) m[1].replace(/'([^']+)'/g, function (_, v) { gen[v] = 1; return _; });
})();
var collide = [];
NEW_IDS.forEach(function (k) { if (gen[NEW[k].name]) collide.push(NEW[k].name + '（也在杂兽名池里）'); });
assert(collide.length === 0, 'K1 新兽名不与杂兽随机名池/地皮闲名相撞（撞了 ' + collide.join('；') + '）');

section('L) 引路倍率合法（travel 的消费端判 mul < 1）');
Object.keys(E.BEAST_BUFFS).forEach(function (k) {
    var b = E.BEAST_BUFFS[k];
    if (b.category === 'travel') assert(b.mul > 0 && b.mul < 1, 'L1 ' + k + ' 引路倍率 ' + b.mul + ' 在 (0,1) 内');
    else assert(b.mul > 0, 'L2 ' + k + ' 加成倍率 ' + b.mul + ' 为正');
});
// travel 是「只取最好一笔」，三只新龙必须压不过旧账第一（鲲鹏 0.6），否则老玩家的鹏翼被顶掉
var travelBest = 0;
Object.keys(E.BEAST_BUFFS).forEach(function (k) { if (E.BEAST_BUFFS[k].category === 'travel') travelBest = Math.min(travelBest || 9, E.BEAST_BUFFS[k].mul); });
assert(travelBest === 0.6, 'L3 全表最优引路仍是鲲鹏 0.6（实数 ' + travelBest + '）——新龙没顶掉老账');

section('M) 零骰 + 无空 catch');
var ecoSrc = src('js/extensions/beast-ecosystem.js');
// 切片止于「兼容 spiritBeasts 别名」之前。别拿注释行当锚——本批第二段（花妖/狐妖）是加在
// SPECIES_TEMPLATES_V2711 闭合之后的，一度把这条注释挤没了，锚点失灵、切片一路吃到 populateBeasts
// （那儿有三处 Math.random，是地图撒兽不是分布表掷骰）→ M1 误报。锚点改成变量名，搬不动。
var iSp = ecoSrc.indexOf('var SPECIES_TEMPLATES_V2711');
var segSp = ecoSrc.slice(iSp, ecoSrc.indexOf('var BEAST_NAME_TO_ID', iSp));
eq0(segSp);
function eq0(seg) {
    assert((seg.match(/Math\.random/g) || []).length === 0, 'M1 新物种模板段零骰（' + (seg.match(/Math\.random/g) || []).length + ' 处）');
}
// 切片必须真的含全部 23 只（防锚点再失灵时切片变空、断言变成一句空话）
assert(Object.keys(NEW).every(function (k) { return segSp.indexOf(k + ': {') >= 0 || segSp.indexOf(k + ':{') >= 0; }),
    'M1b 零骰切片确实盖住了全部 ' + Object.keys(NEW).length + ' 只新兽的模板段');
// 全文件扫：真空 catch（catch 里什么都没有）
var vacCatch = (ecoSrc.match(/catch\s*\([^)]*\)\s*\{\s*\}/g) || []).length;
assert(vacCatch === 0, 'M2 beast-ecosystem.js 无真空 catch（' + vacCatch + ' 处）');
// 既有空 catch 一处没增（StateRegistry 那处 try/catch 是本文件 v19.12 起就有的）
assert(ecoSrc.indexOf("try {\n            window.StateRegistry.register('beastEcosystem'") >= 0, 'M3 StateRegistry 注册原样');

// ============ N) 本批补的两条专断 ============
section('N) 狐妖 ≠ 灵狐（别把新系做成旧系的高配）');
// 灵狐 = beast_lingfox（模板 spirit_fox）：低阶**寻宝工具兽**，替主人找东西。
// 狐妖 = 有道行的妖族：幻得、变得了、惑得住人。三条硬断，任何一条红了都是「新系退化成旧系」。
var LINGFOX_ECO = 'beast_lingfox';
var LINGFOX_TPL = null;
for (var tk in TPL) if (TPL[tk] && TPL[tk].name === '灵狐') LINGFOX_TPL = tk;
assert(!!LINGFOX_TPL, 'N1 灵狐模板在册（键 ' + LINGFOX_TPL + '）');
assert(E.BEAST_BUFFS[LINGFOX_ECO].category === 'treasure', 'N2 灵狐**仍是** treasure 类（实数 ' + E.BEAST_BUFFS[LINGFOX_ECO].category + '）——本批不许改它的定位');
assert(E.BEAST_BUFFS[LINGFOX_ECO].mul === 0.05, 'N3 灵狐的寻宝加成仍是 5%（实数 ' + E.BEAST_BUFFS[LINGFOX_ECO].mul + '）');
var foxCats = {};
FOXES.forEach(function (k) { foxCats[E.BEAST_BUFFS['beast_' + k].category] = true; });
var foxOnTreasure = FOXES.filter(function (k) { return E.BEAST_BUFFS['beast_' + k].category === 'treasure'; });
assert(foxOnTreasure.length === 0, 'N4 狐妖一只都不挂 treasure（挂上的：' + foxOnTreasure.map(nm).join('、') + '）——寻宝那一格是灵狐的，抢了它就退回「高配灵狐」');
// 灵狐 innate 为空；狐妖每一只都必须带真实机制，这是「不是同一只兽换皮」最硬的证据
var lingfoxInnate = (TPL[LINGFOX_TPL].innate || []).slice().sort().join('+');
assert(lingfoxInnate === '', 'N5 灵狐的 innate 实测是空的（' + (lingfoxInnate || '空') + '）——它本来就没有战斗机制，是工具兽');
var foxNoInnate = FOXES.filter(function (k) { return !NEW[k].innate || !NEW[k].innate.length; });
assert(foxNoInnate.length === 0, 'N6 狐妖每一只都带天生机制（空的：' + foxNoInnate.map(nm).join('、') + '）');
// 差事类别的交集必须为空：狐妖与灵狐不共用任何一格
var sharedCat = Object.keys(foxCats).filter(function (c) { return c === E.BEAST_BUFFS[LINGFOX_ECO].category; });
assert(sharedCat.length === 0, 'N7 狐妖与灵狐不共用任何差事类别（重叠：' + sharedCat.join('、') + '）');
// 定位错位检查：狐妖不许有一只是低阶低魔的「工具兽」配置（灵狐 strength 5 / con 5）
var weakFox = FOXES.filter(function (k) { return NEW[k].attrs.strength <= 5 && NEW[k].attrs.constitution <= 5; });
assert(weakFox.length === 0, 'N8 狐妖没有一只是「力 5 体 5」的工具兽配置（' + weakFox.map(nm).join('、') + '）');
console.log('    灵狐 ' + nm('foxpup') + ' 同门：灵狐=' + TPL[LINGFOX_TPL].level + '级/' + E.BEAST_BUFFS[LINGFOX_ECO].category
    + '；狐妖=' + FOXES.map(function (k) { return nm(k) + NEW[k].level + '级/' + E.BEAST_BUFFS['beast_' + k].category; }).join('，'));

section('O) 花妖有香/毒（花这一支的危险必须来自它自己的生理）');
// 花 = 感官/精神型：靠**自身分泌物**（香/毒粉/麻汁/催眠汁）——它每一次出手都是「闻/沾/吸一口」。
// 所以花这一支的 innate 至少要沾一样香/幻/毒，而藤与荆棘不沾（它们是控制型与防御型）。
var SENSORY = { illusion: '幻', venom: '毒', chill: '寒毒' };
var noSensory = FLOWERS.filter(function (k) {
    return !(NEW[k].innate || []).some(function (a) { return SENSORY[a]; });
});
assert(noSensory.length === 0, 'O1 花这一支每只都带香/幻/毒类机制（不带的：' + noSensory.map(nm).join('、') + '）');
// 名字或差事话术里必须说得出「香/毒/麻/汁/粉」这类生理来源（不是「花形的怪物」）
var SENSE_WORD = /香|毒|麻|汁|粉|腥|蚀|沁/;
var noWord = FLOWERS.filter(function (k) {
    var t = NEW[k], b = E.BEAST_BUFFS['beast_' + k];
    var text = t.name + (t.skills || []).join('') + b.desc;
    return !SENSE_WORD.test(text);
});
assert(noWord.length === 0, 'O2 花妖的名/招/差事话里说得出生理来源（说不出的：' + noWord.map(nm).join('、') + '）');
// 反向：藤与荆棘这一支不许全挂香/幻/毒（否则就是花妖换皮）
var vinesAllSensory = VINES.concat(THORNS).filter(function (k) {
    return (NEW[k].innate || []).every(function (a) { return SENSORY[a]; });
});
assert(vinesAllSensory.length === 0, 'O3 藤/荆棘不是花妖换皮（整只都只挂香/幻/毒的：' + vinesAllSensory.map(nm).join('、') + '）');
// 「香」与「毒」是两种不同的危险，不该硬凑成一种：迷魂花、夜来香妖走的是纯香（香到乱神/催眠，
// 靠的是 illusion，本身不带毒）；彼岸花/曼陀罗/夹竹桃/冰川莲走的是带毒的那一路。
// 真不变式因此是**多数带毒**（否则整支退化成「只会晃眼神的假花」），不是「全部带毒」；
// 「每只都沾一样香/幻/毒」由 O1 把着。
var noTox = ofBranch('flower').filter(function (k) {
    return !(NEW[k].innate || []).some(function (a) { return a === 'venom' || a === 'chill'; });
});
var toxYes = FLOWERS.length - noTox.length;
assert(toxYes >= Math.ceil(FLOWERS.length / 2), 'O4 花这一支多数带真毒/寒毒（' + toxYes + '/' + FLOWERS.length
    + '；纯香不��毒的：' + noTox.map(nm).join('、') + '）');
// 花妖与藤/荆棘的机制组合不许撞车（撞了就说明其中一支是另一支的皮）
var sigByBranch = { flower: {}, vine: {}, thorn: {} };
FLOWERS.concat(VINES).concat(THORNS).forEach(function (k) {
    sigByBranch[FAMILY[k][1]][NEW[k].innate.slice().sort().join('+')] = (sigByBranch[FAMILY[k][1]][NEW[k].innate.slice().sort().join('+')] || 0) + 1;
});
console.log('    花  机制组合：' + JSON.stringify(sigByBranch.flower));
console.log('    藤  机制组合：' + JSON.stringify(sigByBranch.vine));
console.log('    荆棘机制组合：' + JSON.stringify(sigByBranch.thorn));

function eq(a, b, msg) { assert(a === b, msg + '（实际=' + JSON.stringify(a) + ' 期望=' + JSON.stringify(b) + '）'); }

console.log('\n========== v27.11 · 藤/花系 + 花妖 + 龙系 + 狐妖 验收 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);