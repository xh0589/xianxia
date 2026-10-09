// legacy-forge-allocation-node.js —— 第六十波·属性点分配 / 档位 / 环境加成
// 覆盖：分配生效、未填为 0、超额截断、档位由技能封顶、环境查表加成生效且可复现。

var pass = 0, fail = 0;
function assert(cond, msg) {
    if (cond) { pass++; console.log('  ✓ ' + msg); }
    else { fail++; console.log('  ✗ FAIL ' + msg); }
}
function section(s) { console.log('\n=== ' + s + ' ==='); }

var mockWindow = {
    currentCharData: { qi: 999999, hp: 100, location: '中州·云台', lifeSkills: { '锻造': 60 } },
    itemById: {},
    addItem: function (id, cnt) { return cnt || 1; },
    addResultItem: function (id, cnt) { return mockWindow.addItem(id, cnt); },
    getLifeSkill: function (k) { return mockWindow.currentCharData.lifeSkills[k] || 0; },
    getCurrentCharData: function () { return mockWindow.currentCharData; },
    EventBus: { emit: function () {} },
    StateRegistry: { register: function () { return function () {}; } },
    timeSystem: { advanceTime: function () {}, getCurrentPeriod: function () { return { id: 'afternoon' }; } },
    gameTime: { currentSeason: 'spring' },
    getCurrentWeather: function () { return { id: 'sunny' }; },
    WorldCalendar: { day: 1 }
};
var fs = require('fs');
var ROOT = '' + (process.env.XIANXIA_ROOT || __dirname + '/..');
var src = fs.readFileSync(ROOT + '/js/crafting/forging-compound.js', 'utf8');
eval('(function(window){' + src + '})(mockWindow);');
var F = mockWindow.ForgingCompound;
assert(!!F, 'ForgingCompound 已注册');

var MAIN = ['mat_dark_iron'], ASSIST = ['mat_mithril', 'mat_meteorite'];
function forge(o) {
    o = o || {};
    mockWindow.currentCharData.lifeSkills['锻造'] = (o.skill == null ? 60 : o.skill);
    mockWindow.gameTime.currentSeason = o.season || 'spring';
    mockWindow.timeSystem.getCurrentPeriod = function () { return { id: o.period || 'afternoon' }; };
    mockWindow.getCurrentWeather = function () { return { id: o.weather || 'sunny' }; };
    mockWindow.currentCharData.location = (o.location == null ? '中州·云台' : o.location);
    return F.executeCompoundForging('recipe_sword_open', {
        embryo: 'sword', main: MAIN, assist: ASSIST, rune: o.rune || [], allocation: o.allocation
    });
}

// ---- A 段：分配规则 ----
section('A) 分配：玩家填什么就是什么，没填的＝0＝不出现');
var cands = F.listAffixOptionsForMat('mat_dark_iron', 60);
console.log('  玄铁候选（锻造 60）：' + cands.affixes.map(function (a) { return a.name + '(' + a.pool + ',门槛' + a.gate + ')'; }).join(' '));
var keyEdge = 'edge', keyTough = 'tough', keyHeavy = 'heavy';

var rA = forge({ skill: 60, allocation: { edge: 3 } });
assert(rA.affixes.length === 1, '只填 1 条 → 出 1 条（实得 ' + rA.affixes.length + '）');
assert(rA.affixes[0].key === keyEdge, '填的是锋锐，出的是锋锐');
assert(rA.affixes[0].points === 3 && rA.affixes[0].tierId === 'xian', '3 点 = 仙品（实得 ' + rA.affixes[0].tierId + ' ' + rA.affixes[0].points + '点）');
// 数值口径：resolveAffix 给的是「词缀本身」的档位值；开炉后 combatBonus 还叠了品相系数
var edgeXian = F.AFFIX_BY_KEY[keyEdge].tiers[2].val;
assert(F.resolveAffix(F.AFFIX_BY_KEY[keyEdge], 3, 60, null).attrVal === edgeXian,
    '锋锐 3 点 → 仙品档值 ' + edgeXian);
assert(rA.combatBonus.attack === Math.max(1, Math.round(edgeXian * rA.quality.mult)),
    '开炉后 attack = 档值 ' + edgeXian + ' × 品相 ' + rA.quality.name + '(' + rA.quality.mult + ') = ' + rA.combatBonus.attack);
assert(rA.plan.points === 3, '已投点数 = 3（实得 ' + rA.plan.points + '）');
assert(!rA.combatBonus.defense && !rA.combatBonus.weight, '没填的词缀不产生任何属性');

// 未填 = 0
var rA0 = forge({ skill: 60, allocation: { edge: 0, tough: 0 } });
assert(rA0.affixes.length === 0, '全填 0 点 → 出一条不出（素胚，实得 ' + rA0.affixes.length + '）');
assert(rA0.plan.points === 0, '全填 0 点 → 已投 0 点');
assert(rA0.plan.totalPoints > 0, '总点数仍在账上（可投 ' + rA0.plan.totalPoints + '）');
assert(rA0.plan.overflowPoints === rA0.plan.totalPoints, '没投出去的全记 overflow（' + rA0.plan.overflowPoints + '）');

// 不给 allocation 时走自动均摊（老调用点不受影响）
var rAuto = forge({ skill: 60 });
assert(rAuto.affixes.length >= 1 && rAuto.affixes.length <= 3, '不给 allocation：自动均摊出 1~3 条（实得 ' + rAuto.affixes.length + '）');
assert(rAuto.plan.points > 0, '自动均摊确实投了点（' + rAuto.plan.points + '）');

// 超额截断 + 备注
var rOver = forge({ skill: 25, allocation: { edge: 3 } });
assert(rOver.affixes[0].points === 1 && rOver.affixes[0].clamped === true,
    '锻造 25 投 3 点 → 压到 1 点并标 clamped（实得 ' + rOver.affixes[0].points + ' 点）');
assert(rOver.plan.notes.join('|').indexOf('档位封顶') >= 0, '截断在 notes 里说清楚：' + rOver.plan.notes.join('；'));

// 池外的 key 不认（玩家不能凭空点出材料池里没有的词缀）
var rFake = forge({ skill: 60, allocation: { dragonmight: 3, edge: 1 } });
assert(rFake.affixes.length === 1 && rFake.affixes[0].key === 'edge',
    '池外的龙威点不动（玄铁池里没有它），只有锋锐出来');

// ---- B 段：档位由技能封顶 ----
section('B) 档位：低技能拿不到仙品，高技能能拿');
// 档位封顶在 collectForgeAffixes / resolveAffix 这一层（配方本身还有一道 requiredSkills 门槛，
// 剑方要锻造 20，所以 20 以下的档位封顶走单层断言，不走开炉）
[[10,'凡品',1],[20,'凡品',1],[29,'凡品',1],[30,'灵品',2],[59,'灵品',2],[60,'仙品',3],[100,'仙品',3]].forEach(function (t) {
    var one = F.resolveAffix(F.AFFIX_BY_KEY.edge, 3, t[0], null);
    assert(one.tierName === t[1] && one.points === t[2], '锻造 ' + t[0] + ' 投 3 点 → ' + t[1] + ' ' + t[2] + ' 点（实得 ' + one.tierName + ' ' + one.points + ' 点）');
});
// 端到端再验一次（剑方门槛 20，以上）
[[20,'凡品',1],[30,'灵品',2],[60,'仙品',3]].forEach(function (t) {
    var r = forge({ skill: t[0], allocation: { edge: 3 } });
    var gotTier = r.affixes[0] ? r.affixes[0].tierName : '(无)';
    var gotPts = r.affixes[0] ? r.affixes[0].points : 0;
    assert(gotTier === t[1] && gotPts === t[2], '开炉 锻造 ' + t[0] + ' 投 3 点 → ' + t[1] + '（实得 ' + gotTier + ' ' + gotPts + ' 点）');
});
// 玩家在低技能下也拿不到仙品（自动均摊也不行）
var rLow = forge({ skill: 20 });
assert(rLow.affixes.every(function (a) { return a.tierId === 'fan'; }), '锻造 20 自动均摊全是凡品（不会白送灵品）');
// 仙品的价值确实高于灵品高于凡品（高档不是白给的）
var vals = [0, 1, 2].map(function (i) { return F.AFFIX_BY_KEY.edge.tiers[i].val; });
assert(vals[0] < vals[1] && vals[1] < vals[2], '锋锐三档递增：' + vals.join(' < '));
// 低技能连凡品都拿不满的情况不存在（1 点一定拿得到）
assert(F.maxPointsPerAffix(0) === 1, '手艺 0 也压得住 1 点（凡品人人有份）');

// ---- C 段：总点数公式 ----
section('C) 总点数 = 材料 × 技能 × 环境');
var noEnv = { pointMult: 0, attrMult: {} };
[[20,'匠人'],[40,'大师'],[60,'宗师'],[80,'天人']].forEach(function (t) {
    var b = F.computeForgeBudget(MAIN, ASSIST, [], t[0], noEnv);
    var tier = F.forgeSkillTier(t[0]);
    var want = Math.max(1, Math.round(b.rawPoints * (1 + tier.pointBonus) / 6));
    assert(b.totalPoints === want && tier.label === t[1],
        '锻造 ' + t[0] + '（' + t[1] + '）→ 总点数 ' + b.totalPoints + '（炉料 ' + b.rawPoints + ' × ' + b.skillMult + ' ÷ 6）');
});
// 总点数随技能单调不减
var mono = true;
var prev = 0;
for (var sk = 0; sk <= 100; sk++) {
    var tp = F.computeForgeBudget(MAIN, ASSIST, [], sk, noEnv).totalPoints;
    if (tp < prev) mono = false;
    prev = tp;
}
assert(mono, '总点数随锻造技能单调不减');
// 材料越好点数越多
var poor = F.computeForgeBudget(['mat_iron_ore'], ['mat_copper_ore'], [], 60, noEnv).totalPoints;
var rich = F.computeForgeBudget(['mat_five_element_essence'], ['mat_dragon_scale'], [], 60, noEnv).totalPoints;
assert(rich > poor, '高阶材料总点数更高（五行精华/龙鳞 ' + rich + ' > 粗铁/铜 ' + poor + '）');
assert(F.materialPoints('mat_iron_ore') === 3, '粗铁 3 点炉料（品阶0等级2）');
assert(F.materialPoints('mat_five_element_essence') === 30, '五行精华 30 点炉料（品阶5等级60）');

// ---- D 段：环境加成查表 ----
section('D) 环境加成：查表生效、不同环境结果不同、同一环境可复现');
function envOf(o) { return F.getEnvBonus({ period: o.period, season: o.season, weather: o.weather, location: o.location }); }
var plain = envOf({ period: 'afternoon', season: 'spring', weather: 'sunny', location: '中州·云台' });
assert(plain.pointMult === 0 && Object.keys(plain.attrMult).length === 0 && plain.hits.length === 0, '无加成环境下账是空的（不是白送 0，是真没命中）');

var winter = envOf({ period: 'afternoon', season: 'winter', weather: 'sunny', location: '中州·云台' });
assert(winter.hits.length === 1 && winter.hits[0].id === 'env_season_winter_tough', '冬锻命中 1 条（' + winter.hits[0].label + '）');
assert(winter.attrMult.defense === 0.15, '冬锻 defense +15%（实得 ' + (winter.attrMult.defense * 100) + '%）');
assert(winter.hits[0].basis && winter.hits[0].basis.indexOf('SEASONS') >= 0, '加成条目自带依据注释');

var storm = envOf({ period: 'afternoon', season: 'spring', weather: 'stormy', location: '中州·云台' });
assert(storm.attrMult.thunderDmg === 0.20, '雷雨天 thunderDmg +20%');

var fireCity = envOf({ period: 'afternoon', season: 'spring', weather: 'sunny', location: '炎城·铸剑坊' });
assert(fireCity.attrMult.fireDmg === 0.15, '炎城 fireDmg +15%');

var ley = envOf({ period: 'afternoon', season: 'spring', weather: 'sunny', location: '灵脉·玉柱下' });
assert(ley.attrMult.qiRegen === 0.15 && ley.attrMult.divine === 0.15 && ley.pointMult === 0.20, '灵脉旁 qiRegen/divine +15%、总点数 +20%');

var noon = envOf({ period: 'noon', season: 'spring', weather: 'sunny', location: '中州·云台' });
assert(noon.attrMult.fireDmg === 0.15 && noon.pointMult === 0.10, '火云时（中午）fireDmg +15%、总点数 +10%');

var stacked = envOf({ period: 'noon', season: 'winter', weather: 'stormy', location: '炎城·铸剑坊' });
assert(stacked.hits.length === 4, '四项叠加命中 4 条（实得 ' + stacked.hits.length + '）');
assert(stacked.pointMult === 0.40, '叠加点数加成 = 40%（实得 ' + (stacked.pointMult * 100) + '%）');

// 同一环境重复查表结果一致（可复现）
var rep = 0;
for (var i = 0; i < 50; i++) {
    if (JSON.stringify(envOf({ period: 'noon', season: 'winter', weather: 'stormy', location: '炎城·铸剑坊' })) === JSON.stringify(stacked)) rep++;
}
assert(rep === 50, '同一环境连查 50 次结果一致（' + rep + '/50）');

// 不同环境 → 不同成品
var coldForge = forge({ skill: 60, weather: 'sunny', season: 'spring', location: '中州·云台' });
var winterForge = forge({ skill: 60, weather: 'sunny', season: 'winter', location: '中州·云台' });
var stormForge = forge({ skill: 60, weather: 'stormy', season: 'spring', location: '中州·云台' });
var fireForge = forge({ skill: 60, weather: 'sunny', season: 'spring', location: '炎城·铸剑坊' });
assert(coldForge.plan.totalPoints !== winterForge.plan.totalPoints,
    '冬锻总点数 ≠ 平炉（' + coldForge.plan.totalPoints + ' vs ' + winterForge.plan.totalPoints + '）');
assert(JSON.stringify(coldForge.combatBonus) !== JSON.stringify(winterForge.combatBonus) || coldForge.name !== winterForge.name,
    '冬锻成品 ≠ 平炉成品');
assert(fireForge.plan.totalPoints > coldForge.plan.totalPoints, '炎城比中州多投点（' + fireForge.plan.totalPoints + ' vs ' + coldForge.plan.totalPoints + '）');
assert(coldForge.affixes[0].key === winterForge.affixes[0].key, '换环境不换池（玄铁还是金石池那条锋锐）');
console.log('  · 平炉：' + coldForge.name + ' 点' + coldForge.plan.points + '/' + coldForge.plan.totalPoints
    + ' → 冬锻：' + winterForge.name + ' 点' + winterForge.plan.points + '/' + winterForge.plan.totalPoints
    + ' → 炎城：' + fireForge.name + ' 点' + fireForge.plan.points + '/' + fireForge.plan.totalPoints);

// 环境抬的是该属性键的数值，不是全属性
var wEnv = { pointMult: 0, attrMult: { defense: 0.15 } };
var vPlain = F.resolveAffix(F.AFFIX_BY_KEY.tough, 1, 60, { attrMult: {} }).attrVal;
var vWinter = F.resolveAffix(F.AFFIX_BY_KEY.tough, 1, 60, wEnv).attrVal;
assert(vWinter > vPlain, '冬环境下坚韧数值抬高（' + vPlain + ' → ' + vWinter + '）');
var aEnv = { pointMult: 0, attrMult: { defense: 0.15 } };
var vAttack = F.resolveAffix(F.AFFIX_BY_KEY.edge, 1, 60, aEnv).attrVal;
assert(vAttack === F.AFFIX_BY_KEY.edge.tiers[0].val, '只抬 defense 不误伤 attack（attack 仍 ' + vAttack + '）');

// ---- E 段：触发型词缀＝登记标签 + 战斗侧接线口（第六十一批改口径）----
// 改口径的理由：这一段原本断言「battle.js 零引用接线钩子」——那是上一批留的「不许说谎」守门人，
//   它守的是「注释没写已接线、代码却没接线」。第六十一批把七条真接到 battle.js 之后，
//   「零引用」本身成了要修的病。守门人的**意图**（注释与实现必须一致）继续守，换一条更强的不变量：
//   ① 战斗侧确实经由本模块的接线口读 proc（不是自己另造一张表）；
//   ② 七条每一条在 battle.js 里都有真实现（FORGE_PROC_TUNING + _procXxx 方法齐全）；
//   ③ 本模块里一行战斗逻辑都没有（机制分账：炼器管「哪条词缀带哪条术」，战斗管「术怎么发生」）；
//   ④ registerForgeProc(id, null) 能把术摘掉——摘掉后战斗里真不发生（见 legacy-forge-proc-node.js）。
section('E) 触发型词缀：登记簿与战斗侧接线口一致');
var procIds = Object.keys(F.FORGE_PROCS);
assert(procIds.length === 7, '触发型登记簿 7 条（实测 ' + procIds.length + ' 条）');
procIds.forEach(function (pid) {
    var p = F.getForgeProc(pid);
    assert(!!p, 'proc ' + pid + ' 登记簿里查得到');
    assert(p.wired === false && p.handler === null,
        'proc ' + pid + '（' + p.name + '）：模块刚加载时未登记（wired=false、handler=null）——接线由战斗侧惰性补');
    assert(p.note.indexOf('battle.js') >= 0 && p.note.indexOf('_proc') >= 0,
        'proc ' + pid + ' 的 note 点名 battle.js 里的实现函数（实测「' + p.note + '」）');
});
// ① 战斗侧确实经由本模块的接线口读 proc
var battleSrc = fs.readFileSync(ROOT + '/js/battle.js', 'utf8');
var hookNames = ['procTags', 'registerForgeProc', 'getForgeProc', '_forgePlan'];
var hooked = hookNames.filter(function (h) { return battleSrc.indexOf(h) >= 0; });
assert(hooked.length === hookNames.length,
    'battle.js 四个接线钩子全用上了（实测 ' + (hooked.join(',') || '0 处') + '）——战斗侧走本模块的口子');
// ② 七条每条在 battle.js 都有真实现（数值表 + 独立方法）
var missingImpl = procIds.filter(function (pid) {
    return battleSrc.indexOf('\n    ' + pid + ': {') < 0 || battleSrc.indexOf('_proc' + pid.charAt(0).toUpperCase() + pid.slice(1)) < 0;
});
assert(missingImpl.length === 0,
    '七条 proc 在 battle.js 都有 FORGE_PROC_TUNING 条目与独立实现方法（缺 ' + (missingImpl.join(',') || '0 条') + '）');
// ③ 本模块里没有一行战斗逻辑（分账）
var battleLogic = ['_executeAttack', 'takeDamage', 'hitRate', 'new Entity(', 'EntityCls'].filter(function (k) { return src.indexOf(k) >= 0; });
assert(battleLogic.length === 0,
    '炼器模块里零战斗逻辑（实测命中 ' + (battleLogic.join(',') || '0 处') + '）——机制归战斗侧，分账没串');
// 老账上那五个悬空 id（reflect2/stun1/rebirth10/curse3）至今没人读
var legacyProcIds = ['reflect2', 'stun1', 'rebirth10', 'curse3'];
var legacyLeaked = legacyProcIds.filter(function (pid) { return battleSrc.indexOf(pid) >= 0; });
assert(legacyLeaked.length === 0, '老 proc id（reflect2/stun1/rebirth10/curse3）在 battle.js 仍是零引用（实测 ' + (legacyLeaked.join(',') || '0 处') + '）');
// 本模块里它们已被 FORGE_PROCS 收编，不再散着当标签
assert(src.indexOf("'reflect2'") < 0 && src.indexOf("'stun1'") < 0, '老 proc id 已收进 FORGE_PROCS 登记簿，源码里不再单散');
// ④ registerForgeProc 仍是活的接线口：接上能翻 true、传 null 能摘掉
var gotReg = F.registerForgeProc('reflect', function () { return 'wired'; });
assert(gotReg === true && F.getForgeProc('reflect').wired === true, 'registerForgeProc 能把 proc 接上（机制留了口子）');
F.registerForgeProc('reflect', null);
assert(F.getForgeProc('reflect').wired === false, '传 null 能摘掉（接线可回退）');

console.log('\n=========================================');
console.log('legacy-forge-allocation: ' + pass + ' passed, ' + fail + ' failed');
console.log('=========================================');
process.exit(fail > 0 ? 1 : 0);