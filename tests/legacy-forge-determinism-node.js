// legacy-forge-determinism-node.js —— 第六十波·炼器确定性守门人
// 核心断言：同样材料 + 同样技能 + 同样环境，连调 100 次，结果逐字节相同。
// 外加：零骰探针（炼器路径一次 Math.random 都不许碰）、池限制、条数上限。
//
// 跑法：node tests/legacy-forge-determinism-node.js
// 回归验证：把 js/crafting/forging-compound.js 的 pickAffixesForMat 排序改回
//   `uniq.sort(function () { return _rng() - 0.5; })`（并恢复 _rng 变量），
//   本套件会红在「100 次完全一致」与「零骰」两条上；改回即绿。

var pass = 0, fail = 0;
function assert(cond, msg) {
    if (cond) { pass++; console.log('  ✓ ' + msg); }
    else { fail++; console.log('  ✗ FAIL ' + msg); }
}
function section(s) { console.log('\n=== ' + s + ' ==='); }

// ---- mock window（对齐 tests/forging-compound-node.js 的那套，不多不少）----
var mockWindow = {
    inventory: { slots: [] },
    currentCharData: { qi: 999999, hp: 100, maxHp: 100, location: '炎城·铸剑坊', lifeSkills: { '锻造': 80 } },
    itemById: {},
    addItem: function (id, cnt) { return cnt || 1; },
    addResultItem: function (id, cnt) { return mockWindow.addItem(id, cnt); },
    getLifeSkill: function (k) { return mockWindow.currentCharData.lifeSkills[k] || 0; },
    getCurrentCharData: function () { return mockWindow.currentCharData; },
    EventBus: { emit: function () {}, on: function () {} },
    StateRegistry: { register: function () { return function () {}; } },
    timeSystem: {
        advanceTime: function () {},
        getCurrentPeriod: function () { return { id: 'noon', name: '中午', startHour: 11, endHour: 13 }; }
    },
    gameTime: { currentSeason: 'winter', currentHour: 12 },
    getCurrentWeather: function () { return { id: 'stormy', name: '雷雨' }; },
    WorldCalendar: { day: 3 }
};

var fs = require('fs');
var ROOT = '' + (process.env.XIANXIA_ROOT || __dirname + '/..');
var src = fs.readFileSync(ROOT + '/js/crafting/forging-compound.js', 'utf8');

// ---- 零骰探针：在加载前把 Math.random 换成会记账的假源 ----
var randomCalls = 0;
var realRandom = Math.random;
Math.random = function () { randomCalls++; return realRandom(); };
eval('(function(window){' + src + '})(mockWindow);');
var F = mockWindow.ForgingCompound;
Math.random = realRandom;   // 探针只覆盖加载期；后面各段再单独装一次

assert(!!F, 'ForgingCompound 已注册');
assert(randomCalls === 0, '模块加载期未调 Math.random（探针计数 ' + randomCalls + '）');

function forge(opts) {
    var o = opts || {};
    mockWindow.currentCharData.lifeSkills['锻造'] = (o.skill == null ? 80 : o.skill);
    if (o.season) mockWindow.gameTime.currentSeason = o.season;
    if (o.weather) mockWindow.getCurrentWeather = function () { return { id: o.weather, name: o.weather }; };
    if (o.location != null) mockWindow.currentCharData.location = o.location;
    return F.executeCompoundForging('recipe_sword_open', {
        embryo: 'sword',
        main: o.main || ['mat_dark_iron'],
        assist: o.assist || ['mat_mithril', 'mat_meteorite'],
        rune: o.rune || [],
        allocation: o.allocation
    });
}
// 只看炼器结果，不看背包/模板这些副作用
function forgePrint(o) {
    var r = forge(o);
    if (!r.ok) return 'FAIL:' + r.reason;
    var line = r.name + ' | ' + JSON.stringify(r.combatBonus) + ' | ' + r.quality.id + '/' + r.score
        + ' | 点' + r.plan.points + '/' + r.plan.totalPoints
        + ' | ' + r.affixes.map(function (a) { return a.name + '(' + a.tierName + a.points + '点,' + a.attrKey + a.attrVal + ')'; }).join(',');
    return line;
}

// ---- A 段：100 次完全一致（核心断言）----
section('A) 确定性：同样材料+技能+环境，连调 100 次完全一致');
var base = forgePrint({ skill: 80 });
console.log('  首炉：' + base);
var sameCount = 0;
for (var i = 0; i < 100; i++) { if (forgePrint({ skill: 80 }) === base) sameCount++; }
assert(sameCount === 100, '100 次连炼与首炉逐字符相同（命中 ' + sameCount + '/100）');

// 换几个不同组合各打 20 次
var combos = [
    { name: '玄铁剑（金属池）', opts: { skill: 80, main: ['mat_dark_iron'], assist: ['mat_cold_iron', 'mat_meteorite'], rune: [] } },
    { name: '龙血剑（龙凤池）', opts: { skill: 95, main: ['mat_dragon_blood'], assist: ['mat_dragon_scale', 'mat_star_iron'], rune: ['mat_dragon_scale'] } },
    { name: '兽芯剑（兽材池）', opts: { skill: 60, main: ['mat_demon_beast_core'], assist: ['mat_beast_bone', 'mat_beast_skin'], rune: [] } },
    { name: '星铁剑（星辰池）', opts: { skill: 100, main: ['mat_star_iron'], assist: ['mat_five_element_essence', 'mat_mithril'], rune: ['mat_phoenix_blood'] } },
    { name: '匠人剑（剑方门槛 20）', opts: { skill: 20, main: ['mat_iron_ore'], assist: ['mat_copper_ore', 'mat_tin_ore'], rune: [] } }
];
combos.forEach(function (c) {
    var first = forgePrint(c.opts);
    var hit = 0;
    for (var k = 0; k < 20; k++) if (forgePrint(c.opts) === first) hit++;
    console.log('  · ' + c.name + '：' + first);
    assert(hit === 20, c.name + ' 连打 20 次完全一致（' + hit + '/20）');
});

// ---- B 段：零骰探针（炼器执行期一次 Math.random 都不许碰）----
section('B) 零骰：炼器路径不调 Math.random');
randomCalls = 0;
Math.random = function () { randomCalls++; return realRandom(); };
for (var j = 0; j < 50; j++) forgePrint({ skill: 80 });
Math.random = realRandom;
assert(randomCalls === 0, '连开 50 炉未调 Math.random（探针计数 ' + randomCalls + '）');

// 传 randomSource 也不该改变任何东西（老 API 保留但已作废）
var withRs = F.executeCompoundForging('recipe_sword_open', { embryo:'sword', main:['mat_dark_iron'], assist:['mat_mithril','mat_meteorite'], rune:[] },
    { randomSource: function () { return 0.42; } });
assert(withRs.name && withRs.affixes && withRs.affixes.length > 0, '传 randomSource 仍能开炉（旧 API 未删）');
var again1 = forgePrint({ skill: 80 });
var again2 = (function () {
    mockWindow.currentCharData.lifeSkills['锻造'] = 80;
    var r = F.executeCompoundForging('recipe_sword_open', { embryo:'sword', main:['mat_dark_iron'], assist:['mat_mithril','mat_meteorite'], rune:[] }, { randomSource: function () { return 0.99; } });
    return r.name + ' | ' + JSON.stringify(r.combatBonus) + ' | ' + r.quality.id;
})();
assert(again2 === again1 || again2.indexOf(again1.split(' | ')[0]) >= 0, 'randomSource 注入不改结果（注入前 ' + again1.split(' | ')[0] + ' / 注入后 ' + again2.split(' | ')[0] + '）');

// 源码层面也不该再有 _rng 变量
assert(src.indexOf('_rng') < 0, '源码里已无 _rng 随机源变量（注释里的说明字样除外需人工过一眼）');
assert(src.indexOf('Math.random()') < 0, '源码里已无 Math.random() 调用');

// ---- C 段：材料决定池，池外一律不出 ----
section('C) 池限制：材料 X 出的词缀一定在池内');
var poolOf = {};
F.POOL_ORDER.forEach(function (pid) { F.AFFIX_BY_POOL[pid].forEach(function (a) { poolOf[a.key] = pid; }); });
var poolTag = {};
F.POOL_ORDER.forEach(function (pid) { F.AFFIX_POOLS[pid].tags.forEach(function (t) { poolTag[t] = pid; }); });
// 词缀归池看 pools 数组（跨池共享的词缀 pools 有多项），不是看它的「本家池」pool 字段
function inPools(a, pools) { for (var i = 0; i < pools.length; i++) if (a.pools.indexOf(pools[i]) >= 0) return true; return false; }
Object.keys(F.MATERIAL_TAGS).forEach(function (matId) {
    var pools = F.getPoolsForMat(matId);
    assert(pools.length >= 1, matId + ' 至少落一个池（' + pools.join('/') + '）');
    F.getMaterialTags(matId).forEach(function (t) {
        assert(poolTag[t] || F.UNPOOLED_TAGS[t],
            matId + ' 的标签 ' + t + ' 归池或已登记为不进池的旁注');
    });
});
console.log('  · 已核对 ' + Object.keys(F.MATERIAL_TAGS).length + ' 种材料的池归属；'
    + '不进池的旁注标签：' + Object.keys(F.UNPOOLED_TAGS).join('/'));

// 五池各自的具体断言
var probes = [
    { mat: 'mat_dark_iron', pools: ['metal'] },
    { mat: 'mat_cold_iron', pools: ['metal'] },
    { mat: 'mat_meteorite', pools: ['metal', 'star'] },   // 标签 ['meteor','star'] → 金石池先(声明序)、星辰池后
    { mat: 'mat_thunder_crystal', pools: ['fire'] },
    { mat: 'mat_phoenix_blood', pools: ['fire'] },
    { mat: 'mat_star_iron', pools: ['star', 'metal'] },
    { mat: 'mat_five_element_essence', pools: ['star'] },
    { mat: 'mat_demon_beast_core', pools: ['beast', 'fire'] },
    { mat: 'mat_dragon_scale', pools: ['dragon'] },
    { mat: 'mat_dragon_blood', pools: ['dragon', 'fire'] }
];
probes.forEach(function (p) {
    var got = F.getPoolsForMat(p.mat);
    assert(got.join(',') === p.pools.join(','), p.mat + ' 落池 = ' + p.pools.join('/') + '（实得 ' + got.join('/') + '）');
    var list = F.listAffixOptionsForMat(p.mat, 100);
    var outside = list.affixes.filter(function (a) { return !inPools(a, p.pools); });
    assert(outside.length === 0, p.mat + ' 候选全在池内（池外 ' + outside.length + ' 条）');
    // 通用词缀是补位，不算池外，但必须走 universal 名单
    assert(list.universal.length === 3, p.mat + ' 通用补位 3 条（锋利/轻灵/精密）');
});
// 抽出来的东西也必须在池内
var gotAff = F.pickAffixesForMat('mat_dragon_blood', 3, 80);
assert(gotAff.every(function (a) { return a.pool === '*' || inPools(a, F.getPoolsForMat('mat_dragon_blood')); }), '龙血抽出的 3 条都在龙凤/雷火/通用里');
// 五池都真能出东西（每池 ≥6 条候选，且都含触发型）
F.POOL_ORDER.forEach(function (pid) {
    var arr = F.AFFIX_BY_POOL[pid];
    var withProc = arr.filter(function (a) { return !!a.proc; }).length;
    assert(arr.length >= 6, F.AFFIX_POOLS[pid].name + '（' + pid + '）≥ 6 条，实得 ' + arr.length);
    assert(withProc >= 1, F.AFFIX_POOLS[pid].name + ' 至少 1 条触发型（实得 ' + withProc + '）');
    arr.forEach(function (a) {
        assert(a.tiers.length === 3, a.name + ' 三档齐（凡/灵/仙）');
        assert(F.COMBAT_BONUS_KEYS.indexOf(a.attrKey) >= 0 || a.attrKey === 'weight' || !a.attrKey,
            a.name + ' 属性键复用既有字段（' + a.attrKey + '）');
        // 三档数值必须是有限整数（NaN 过一次 JSON 往返就变 null，词缀账会烂）
        a.tiers.forEach(function (t) {
            assert(typeof t.val === 'number' && isFinite(t.val), a.name + ' ' + t.name + ' 档值是有限整数（' + t.val + '）');
        });
    });
});

// ---- D 段：条数上限 ----
section('D) 条数上限：技能低上限低、技能高上限高');
[[0,'学徒',2],[15,'学徒',2],[20,'匠人',3],[40,'大师',4],[60,'宗师',5],[80,'天人',6],[100,'天人',6]].forEach(function (t) {
    assert(F.affixSlotLimit(t[0]) === t[2] && F.forgeSkillTier(t[0]).label === t[1],
        '锻造 ' + t[0] + ' → ' + t[1] + '档，上限 ' + t[2] + ' 条（实得 ' + F.affixSlotLimit(t[0]) + '）');
});
assert(F.affixSlotLimit(10) < F.affixSlotLimit(90), '低技能上限 < 高技能上限');
// 每条能投的点数也随技能涨（档位封顶）
assert(F.maxPointsPerAffix(10) === 1 && F.maxPointsPerAffix(40) === 2 && F.maxPointsPerAffix(70) === 3,
    '每条点数上限：技能10→1点 / 40→2点 / 70→3点');
// 实际开炉条数不越上限
var r5 = forge({ skill: 20 });
assert(r5.affixes.length <= 3, '技能 20 开炉 3 槽方，词缀 ≤ 3（实得 ' + r5.affixes.length + '）');

console.log('\n=========================================');
console.log('legacy-forge-determinism: ' + pass + ' passed, ' + fail + ' failed');
console.log('=========================================');
process.exit(fail > 0 ? 1 : 0);