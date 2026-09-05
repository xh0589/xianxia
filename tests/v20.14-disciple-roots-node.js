/**
 * v20.14-disciple-roots-node.js — 灵根生效第二批：弟子受性看灵根 + 传闻报根骨
 *
 * 覆盖：
 *   A 传功进境按资质浮动：天才一次顶庸才五次；换算缺位按常速
 *   B 成本分文未动：灵石 30、时辰 60、好感 +5、声望 +3 与资质无关
 *   C 资质档位五档曲线 + 弟子面板如实标注
 *   D 传闻解释灵根来历：主根≥80 报"X灵根，众人称天才"；杂灵根"大器晚成"；
 *     估算饼（主根≤50）永不误标天才
 *   E 静态：同一把尺（复用灵根倍率）、基准 5 与成本常量原样在
 *
 * 运行：node tests/v20.14-disciple-roots-node.js
 */
'use strict';

var path = require('path');
var fs = require('fs');
var vm = require('vm');

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) passed++;
    else { failed++; console.error('[FAIL] ' + msg); }
}

var mockWindow = {
    console: { log: function () {}, warn: function () {} },
    JSON: JSON, Object: Object, Array: Array, Math: Math, Number: Number,
    isFinite: isFinite, String: String,
    showMessage: function (m) { mockWindow.toasts.push(m); },
    toasts: [],
    gameLog: { entries: [], add: function () {} },
    timeSystem: {
        gameTime: { currentDay: 5 },
        advanceCalls: [],
        advanceTime: function (n, why) { this.advanceCalls.push({ n: n, why: why }); },
        onNewDaySubscribe: function () {}
    },
    document: { getElementById: function () { return null; }, querySelector: function () { return null; } },
    updateCharacterStatus: function () {},
    stones: 1000,
    getRealmTier: function () { return 3; }
};
mockWindow.DataManager = {
    deductSpiritStones: function (n) { if (mockWindow.stones < n) return false; mockWindow.stones -= n; return true; },
    addSpiritStones: function (n) { mockWindow.stones += n; }
};
mockWindow.currentCharData = { name: '我', fame: 0 };

var npcMap = {};
function mkNpc(id, name, roots) {
    npcMap[id] = {
        id: id, name: name, affection: 30,
        spiritualRoots: roots,
        combat: { realm: '炼气', layer: 1 },
        changeAffection: function (d) { this.affection += d; }
    };
    return npcMap[id];
}
mkNpc('d_heaven', '小天', { metal: 100, wood: 0, water: 0, fire: 0, earth: 0 });   // 倍率 2.5
mkNpc('d_dull', '阿钝', { metal: 20, wood: 20, water: 20, fire: 20, earth: 0 });   // 倍率 0.5
mkNpc('d_mid', '小满', { metal: 60, wood: 20, water: 10, fire: 7, earth: 3 });     // 倍率 1.5
mkNpc('d_none', '无名', null);                                                     // 缺数据 → 估算/常速
mockWindow.npcManager = { getNPC: function (id) { return npcMap[id] || null; }, getAllNPCs: function () { return Object.keys(npcMap).map(function (k) { return npcMap[k]; }); } };
mockWindow.PlayerSect = { listMySects: function () { return [{ disciples: Object.keys(npcMap).map(function (k) { return { npcId: k }; }) }]; } };
mockWindow.window = mockWindow;
mockWindow.global = mockWindow;

var ctx = vm.createContext(mockWindow);
function load(rel) {
    vm.runInContext(fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8'), ctx);
}
load('js/core/event-bus.js');
load('js/core/state-registry.js');
load('js/npcs/npc-lineage.js');
load('js/npcs/npc-life-actor.js');
mockWindow.NPCLife = ctx.NPCLife;
mockWindow.NpcLineage = ctx.NpcLineage;
load('js/sects/master-teach.js');

assert(typeof mockWindow.teachDisciple === 'function' && typeof mockWindow.getDiscipleRoster === 'function',
    'L1 传功与弟子名册就绪');

// ============ A: 受性看灵根 ============
var heaven = npcMap.d_heaven, dull = npcMap.d_dull;
mockWindow.toasts.length = 0;
assert(mockWindow.teachDisciple('d_heaven') === true, 'A1 传功天才成功');
assert(Math.abs((heaven._cultivationProgress || 0) - 12.5) < 1e-9,
    'A2 天灵根一次传功感悟 +12.5（基准 5 × 2.5 倍率）');
assert(mockWindow.teachDisciple('d_dull') === true, 'A3 传功庸才成功');
assert(Math.abs((dull._cultivationProgress || 0) - 2.5) < 1e-9,
    'A4 杂灵根一次传功感悟 +2.5——同一次课，天才顶庸才五次');
assert(mockWindow.toasts[0].indexOf('一点就透') >= 0, 'A5 天才传功反馈带"一点就透"（资质玩家看得见）');
assert(mockWindow.toasts[1].indexOf('资质愚钝') >= 0, 'A6 庸才传功反馈带"需多讲几遍"');
mockWindow.teachDisciple('d_heaven');
assert(heaven._cultivationProgress >= 20 && mockWindow.toasts[2].indexOf('小成') >= 0,
    'A7 天才两次传功即入"小成"（阶段推进如实提示）');
var savedNpcLife = mockWindow.NPCLife;
mockWindow.NPCLife = null;
mockWindow.teachDisciple('d_mid');
mockWindow.NPCLife = savedNpcLife;
assert(Math.abs(npcMap.d_mid._cultivationProgress - 5) < 1e-9,
    'A8 换算缺位时按常速 +5——不拿猜测当事实，也不惩罚玩家');

// ============ B: 成本与资质无关 ============
var stonesBefore = mockWindow.stones;
var advBefore = mockWindow.timeSystem.advanceCalls.length;
var fameBefore = mockWindow.currentCharData.fame;
mockWindow.teachDisciple('d_heaven');
var costStones = stonesBefore - mockWindow.stones;
var advDelta = mockWindow.timeSystem.advanceCalls.length - advBefore;
assert(costStones === 30, 'B1 天才传功仍收 30 灵石——灵石不认人');
assert(advDelta === 1 && mockWindow.timeSystem.advanceCalls[advBefore].n === 60,
    'B2 时辰成本仍是 60 分钟——天才不多占你时辰');
assert(mockWindow.currentCharData.fame - fameBefore === 3, 'B3 声望 +3 与资质无关');
var dullAff = dull.affection;
mockWindow.teachDisciple('d_dull');
assert(dull.affection - dullAff === 5, 'B4 庸才好感同样 +5——好感不掺资质');

// ============ C: 资质档位五档 ============
var roster = mockWindow.getDiscipleRoster();
var byId = {};
roster.forEach(function (r) { byId[r.npcId] = r; });
assert(byId.d_heaven.rootTier === '天灵根', 'C1 主根 100 → 天灵根');
assert(byId.d_mid.rootTier === '上品灵根', 'C2 主根 60 → 上品灵根');
assert(byId.d_none.rootTier === '中庸之资', 'C3 无数据按境界估算（炼气主根 40）→ 中庸之资');
mkNpc('d_low', '小低', { metal: 24 });   // 0.6 → 下品
assert(mockWindow.getDiscipleRoster().filter(function (r) { return r.npcId === 'd_low'; })[0].rootTier === '下品灵根',
    'C4 主根 24（0.6 倍）→ 下品灵根');
mkNpc('d_zat', '小杂', { metal: 10 });   // 0.4 保底 → 杂灵根
assert(mockWindow.getDiscipleRoster().filter(function (r) { return r.npcId === 'd_zat'; })[0].rootTier === '杂灵根',
    'C5 保底 0.4 倍 → 杂灵根（档位覆盖全曲线）');

// ============ D: 传闻报根骨来历 ============
function driveBreak(roots, realm) {
    var n = { id: 'x', name: '张某', location: '青云山', spiritualRoots: roots, combat: { realm: realm || '炼气', layer: 1 } };
    var sum = '';
    do { sum = mockWindow.NPCLife.cultivateStep(n); } while (!(n._cultivationProgress === 0 && sum.indexOf('突破') >= 0 || sum.indexOf('化境') >= 0));
    return sum;
}
var sHeaven = driveBreak({ metal: 100 });
assert(sHeaven.indexOf('金灵根') >= 0 && sHeaven.indexOf('众人称天才') >= 0,
    'D1 金灵根天才突破：传闻报出"金灵根，众人称天才"');
var sDull = driveBreak({ metal: 20, wood: 20, water: 20, fire: 20, earth: 20 });
assert(sDull.indexOf('大器晚成') >= 0,
    'D2 五行均衡苦修者突破：传闻是"大器晚成"（慢也有慢的叙事）');
var sMid = driveBreak({ metal: 60, wood: 25, water: 15 });
assert(sMid.indexOf('灵根') < 0 && sMid.indexOf('天才') < 0,
    'D3 中庸资质突破不报根骨——只有主根≥80 才配进传闻名号');
assert(mockWindow.NPCLife.dominantRootName({ spiritualRoots: { metal: 100 } }) === '金灵根', 'D4 主根标定：100 → 金灵根');
assert(mockWindow.NPCLife.dominantRootName({ combat: { realm: '金丹' } }) === null,
    'D5 估算饼永不误标天才（无实测灵根不报名号）');

// ============ E: 静态 ============
var mtSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'sects', 'master-teach.js'), 'utf8');
assert(mtSrc.indexOf('NPCLife.npcRootGrowthMul') >= 0,
    'E1 传功资质与江湖传闻同一把尺（复用灵根倍率，不分家）');
assert(mtSrc.indexOf('TEACH_COST = 30') >= 0 && mtSrc.indexOf('5 * mul') >= 0,
    'E2 基准 5 与灵石 30 原样在——资质只浮动进境，不动成本');
assert(mtSrc.indexOf('rootTier') >= 0 && mtSrc.indexOf('d.rootTier') >= 0,
    'E3 资质已进弟子名册与面板');
var laSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'npcs', 'npc-life-actor.js'), 'utf8');
assert(laSrc.indexOf('main < 80') >= 0,
    'E4 传闻报名号的门槛硬编码在案（主根≥80）');

console.log('v20.14 disciple-roots: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
