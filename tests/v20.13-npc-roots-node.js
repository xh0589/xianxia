/**
 * v20.13-npc-roots-node.js — 灵根驱动 NPC 自主修炼
 *
 * 覆盖：
 *   A 灵根→进境倍率曲线：均衡饼慢、主根 40 常速、单灵根封顶、钳位、族谱估算兜底
 *   B cultivateStep 攒进度突破语义（旧版语义逐项保持：满 10 归零、升层、升境、心性回执）
 *   C 同日同行动：天才与庸才用同一份进度、同一个成本，只快慢不同
 *   E 端到端：日常行动走 cultivate 分支时灵根真实生效（经 executeAction 接线）
 *   F 静态：固定 +1 已除、单真源字段共读、api 导出齐备
 *
 * 运行：node tests/v20.13-npc-roots-node.js
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

// 固定随机源：E 段需要"必中 5% 机缘 + 必选修炼"的确定性场景（洞府地点 random<0.5）
var sRnd = function () { return 0.01; };
var seededMath = Object.create(Math);
seededMath.random = sRnd;

var mockWindow = {
    EventBus: null,
    showMessage: function () {},
    console: { log: function () {}, warn: function () {} },
    Math: seededMath, JSON: JSON, Object: Object, Array: Array,
    document: { querySelector: function () { return null; }, querySelectorAll: function () { return []; } },
    timeSystem: { gameTime: { currentDay: 1 }, advanceTime: function () {} },
    currentCharData: null,
    discipleState: null,
    npcManager: null,
    showModal: function () {},
    StateRegistry: null,
    driftCalls: []
};
mockWindow.driftPersonality = function (npc, dim, delta, note) {
    mockWindow.driftCalls.push({ npc: npc.id, dim: dim, delta: delta, note: note });
};
mockWindow.window = mockWindow;
mockWindow.global = mockWindow;
mockWindow.XianXia = {};

var ctx = vm.createContext(mockWindow);
function load(rel) {
    vm.runInContext(fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8'), ctx);
}
load('js/core/event-bus.js');
load('js/core/state-registry.js');
load('js/npcs/npc-lineage.js');
load('js/npcs/npc-life-actor.js');
mockWindow.EventBus = ctx.EventBus;
mockWindow.StateRegistry = ctx.StateRegistry;
mockWindow.NpcLineage = ctx.NpcLineage;
mockWindow.NPCLife = ctx.NPCLife;

var mul = mockWindow.NPCLife.npcRootGrowthMul;
var step = mockWindow.NPCLife.cultivateStep;
assert(typeof mul === 'function' && typeof step === 'function', 'L1 灵根倍率与修炼步进就绪');
assert(mockWindow.NpcLineage && typeof mockWindow.NpcLineage._guessRoots === 'function', 'L2 族谱灵根估算就绪');

function mkNpc(id, roots, realm, layer) {
    return {
        id: id, name: id, location: '青云山',
        spiritualRoots: roots,
        combat: { realm: realm || '炼气', layer: layer || 1, attack: 10, defense: 10 }
    };
}

// ============ A: 倍率曲线 ============
assert(mul(mkNpc('a1', { metal: 20, wood: 20, water: 20, fire: 20, earth: 20 })) === 0.5,
    'A1 五行均衡（主根 20）半速——杂灵根修炼本就艰难');
assert(mul(mkNpc('a2', { metal: 40, wood: 25, water: 15, fire: 12, earth: 8 })) === 1.0,
    'A2 主根 40 = 常速基准（与旧版 NPC 同速，世界不缩水）');
assert(mul(mkNpc('a3', { metal: 100, wood: 0, water: 0, fire: 0, earth: 0 })) === 2.5,
    'A3 单灵根封顶 2.5 倍——天才有上限，不失控');
assert(mul(mkNpc('a4', { metal: 0, wood: 0, water: 0, fire: 0, earth: 0 })) === 0.4,
    'A4 全无灵根吃保底 0.4 倍——再迟钝也在修行');
assert(mul(mkNpc('a5', { metal: 300 })) === 2.5, 'A5 异常大值仍封顶（钳位防注入脏数据）');
assert(mul(mkNpc('a6', { metal: 'x', wood: 30 })) === 0.75, 'A6 脏值按 0 计，其余如实读');
// 估算兜底：与族谱面板同一把尺（v20.10 guessRoots）
assert(mul(mkNpc('a7', null, '炼气')) === 1.0, 'A7 无灵根数据按境界估算：炼气主根 40 = 常速');
assert(mul(mkNpc('a8', null, '金丹')) === 1.25, 'A8 金丹估算主根 50 = 1.25 倍（境界越高根越纯）');
var savedLineage = mockWindow.NpcLineage;
mockWindow.NpcLineage = null;
assert(mul(mkNpc('a9', null, '炼气')) === 1.0, 'A9 族谱缺载时按常速——不拿猜测当事实');
mockWindow.NpcLineage = savedLineage;

// ============ B: 步进语义与旧版逐项一致 ============
var b1 = mkNpc('b1', { metal: 20, wood: 20, water: 20, fire: 20, earth: 20 });
var lastSum = '';
for (var i = 0; i < 19; i++) lastSum = step(b1);
assert(b1.combat.layer === 1 && Math.abs(b1._cultivationProgress - 9.5) < 1e-9,
    'B1 均衡灵根 19 步只攒 9.5：进度是分数不是整数，未满不突破');
assert(lastSum.indexOf('小有进境') >= 0, 'B2 未突破时只报小有进境（不夸大）');
lastSum = step(b1);
assert(b1.combat.layer === 2 && b1._cultivationProgress === 0 && lastSum.indexOf('进境 2 层') >= 0,
    'B3 攒满 10 归零升层（阈值与归零语义与旧版一致）');
assert(mockWindow.driftCalls.length === 1 && mockWindow.driftCalls[0].npc === 'b1',
    'B4 突破附心性回执（v20.6 道途精进者心性渐稳）');

// ============ C: 天才与庸才同成本不同速度 ============
var heaven = mkNpc('c_heaven', { metal: 100, wood: 0, water: 0, fire: 0, earth: 0 });
var dull = mkNpc('c_dull', { metal: 20, wood: 20, water: 20, fire: 20, earth: 0 });
var hSum = '';
for (var h = 0; h < 4; h++) hSum = step(heaven); // 4 步 × 2.5 = 10
assert(heaven.combat.layer === 2 && dull._cultivationProgress === undefined,
    'C1 单灵根 4 步即突破；庸才尚未起步——同一步数不同进境');
assert(hSum.indexOf('天赋异禀') === 0 || hSum.indexOf('众人称天才') >= 0,
    'C2 天才突破附带天赋文案（传闻里看得出根骨）');
lastSum = step(heaven);
assert(lastSum.indexOf('闭关苦修，进境飞快') >= 0, 'C3 天才未突破时传闻也是进境飞快');
// 升境：渡劫之前层层可升，到大乘/渡劫边界收口
var peak = mkNpc('c_peak', { metal: 100 }, '渡劫', 9);
for (var p2 = 0; p2 < 4; p2++) lastSum = step(peak);
assert(peak.combat.realm === '渡劫' && peak.combat.layer === 1 && lastSum.indexOf('化境') >= 0,
    'C4 渡劫九层封顶：再无可升时报"已臻化境"，境界不越界');
// 升境正常路径
var asc = mkNpc('c_asc', { metal: 100 }, '炼气', 9);
for (var a2 = 0; a2 < 4; a2++) lastSum = step(asc);
assert(asc.combat.realm === '筑基' && asc.combat.layer === 1 && lastSum.indexOf('晋升 筑基') >= 0,
    'C5 九层攒满升境（与旧版 _orders 序列一致）');

// ============ E: 端到端接线（executeAction → cultivate 分支） ============
// seededMath 恒 0.01：洞府地点必选修炼、5% 机缘必中——验证真实调用链而非孤立函数
var live = mkNpc('e1', { metal: 100, wood: 0, water: 0, fire: 0, earth: 0 });
live.location = '洞府乙';
live.combat.layer = 1;
// tickDay 全链路（含 executeAction + cultivate 分支 + 传闻落池）
mockWindow.npcManager = {
    getAllNPCs: function () { return [live]; },
    getNPC: function (id) { return id === live.id ? live : null; }
};
mockWindow.NPCLife.tickDay(101);
mockWindow.NPCLife.tickDay(102);
mockWindow.NPCLife.tickDay(103);
mockWindow.NPCLife.tickDay(104);
assert(live.combat.layer === 2 && live._cultivationProgress === 0,
    'E1 单灵根 NPC 连续 4 个日常行动进境一层——灵根经日常链路真实生效');
var rumors = mockWindow.NPCLife.getRumorLog(10);
assert(rumors.length >= 4 && rumors[rumors.length - 1].type === 'cultivate',
    'E2 传闻池如实记了这些修炼行动（玩家可旁观天才进境）');
// 同一 NPC 同日不重复行动（成本不变：一日一行）
mockWindow.NPCLife.tickDay(104);
assert(live.combat.layer === 2, 'E3 同日再 tick 不重复行动——没有借灵根之名偷偷加次数');
// 庸才同链路慢得多
var slowNpc = mkNpc('e4', { metal: 20, wood: 20, water: 20, fire: 20, earth: 0 });
slowNpc.location = '洞府乙';
mockWindow.npcManager = {
    getAllNPCs: function () { return [slowNpc]; },
    getNPC: function (id) { return id === slowNpc.id ? slowNpc : null; }
};
for (var d1 = 201; d1 < 217; d1++) mockWindow.NPCLife.tickDay(d1);
assert(slowNpc.combat.layer === 1 && slowNpc._cultivationProgress >= 0.4 && slowNpc._cultivationProgress < 10,
    'E4 均衡灵根 16 天还没摸到突破线——快慢差是真实世界事实');

// ============ F: 静态 ============
var actorSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'npcs', 'npc-life-actor.js'), 'utf8');
assert(actorSrc.indexOf('(Number(npc._cultivationProgress) || 0) + 1;') < 0,
    'F1 固定 +1 已除——进境速度只认灵根');
assert(actorSrc.indexOf('spiritualRoots') >= 0 && actorSrc.indexOf('_guessRoots') >= 0,
    'F2 灵根读取 + 族谱估算兜底都在');
var mtSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'sects', 'master-teach.js'), 'utf8');
assert(mtSrc.indexOf('_cultivationProgress') >= 0,
    'F3 师徒教导与自主修炼共读同一份进度（单真源没分家）');
assert(actorSrc.indexOf("Math.random() < 0.05") >= 0,
    'F4 进境机缘 5% 成本原样保留（灵根只改速度不改成本）');

console.log('v20.13 npc-roots: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
