/**
 * v20.16-root-refine-node.js — 重塑灵根丹（后天改命线）
 *
 * 覆盖：
 *   A 物品注册：模板入物品库、自注册幂等、族谱同一把饼尺在场
 *   B 丹方唯一性：主药槽只有五行灵髓合格（混沌石药性过烈被药性上限拦下，
 *     一切高突破药材因五行不全被拦下）；辅/调槽可用常见药材
 *   C 挪饼数学：+6 目标经配平摊薄后实际递减；饼总和恒 100；
 *     主根六成封顶拒服且灵根/次数纹丝不动；时间成本 120 刻
 *   D 存档往返：重塑次数入档、回灌、旧档无字段按 0 兜底
 *   E 成就真链路：档案快照有 rootRefines 键；破而后立/洗尽铅华经真实检查点亮且只弹一条
 *   F 静态：拒服不扣丹、脚本接线、存档白名单、成就预置齐备
 *
 * 运行：node tests/v20.16-root-refine-node.js
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

// —— 世界桩 ——
var toasts = [];
var advCalls = [];
var newDayHooks = [];
var copperPool = 0, stonesPool = 0;

var mockWindow = {
    console: { log: function () {}, warn: function () {} },
    JSON: JSON, Object: Object, Array: Array, Math: Math, Number: Number,
    isFinite: isFinite, Date: Date, String: String,
    gameLog: { entries: [], add: function () {} },
    showMessage: function (m) { toasts.push(String(m)); },
    currentCharData: null,
    XianXia: {},
    timeSystem: {
        gameTime: { currentDay: 5 },
        advanceTime: function (mins, reason) { advCalls.push({ mins: mins, reason: String(reason || '') }); },
        onNewDaySubscribe: function (fn) { newDayHooks.push(fn); }
    },
    getAbsoluteDay: function () { return 0; },
    REALM_CONFIG: { realms: [
        { name: '炼气' }, { name: '筑基' }, { name: '金丹' }, { name: '元婴' },
        { name: '化神' }, { name: '炼虚' }, { name: '合体' }, { name: '大乘' }, { name: '渡劫' }
    ] },
    localStorage: {
        _m: {},
        get length() { return Object.keys(this._m).length; },
        key: function (i) { return Object.keys(this._m)[i] !== undefined ? Object.keys(this._m)[i] : null; },
        getItem: function (k) { return this._m[k] !== undefined ? this._m[k] : null; },
        setItem: function (k, v) { this._m[k] = String(v); },
        removeItem: function (k) { delete this._m[k]; }
    },
    document: { querySelector: function () { return null; }, querySelectorAll: function () { return []; } },
    // 物品库容器（供 15 号扩展自注册）
    itemById: {}, allItems: [], consumables: []
};
mockWindow.getRealmIndex = function (name) {
    return mockWindow.REALM_CONFIG.realms.findIndex(function (r) { return r.name === name; });
};
mockWindow.XianXia.DataManager = {
    getCopper: function () { return copperPool; },
    setCopper: function (v) { copperPool = v; },
    getSpiritStones: function () { return stonesPool; },
    setSpiritStones: function (v) { stonesPool = v; }
};
mockWindow.RewardService = { apply: function () { return { success: true }; } };
mockWindow.window = mockWindow;
mockWindow.global = mockWindow;

var ctx = vm.createContext(mockWindow);
function load(rel) {
    vm.runInContext(fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8'), ctx);
}
load('js/core/event-bus.js');
mockWindow.EventBus = ctx.EventBus;
load('js/core/state-registry.js');
mockWindow.StateRegistry = ctx.StateRegistry;
load('js/npcs/npc-lineage.js');            // 同一把饼尺 _pieRoots
load('js/items-extended/15-root-refine.js'); // 物品模板自注册
load('js/extensions/root-refine.js');      // refineRootByPill / rootRefineInfo
load('js/crafting/alchemy-compound.js');   // 丹方校验器
load('js/core/game-state.js');
load('js/achievement-system.js');

function pieSum(roots) {
    return ['metal', 'wood', 'water', 'fire', 'earth']
        .reduce(function (a, k) { return a + (Number(roots[k]) || 0); }, 0);
}
function allInts(roots) {
    return ['metal', 'wood', 'water', 'fire', 'earth']
        .every(function (k) { return Number.isInteger(Number(roots[k])); });
}

// ============ A: 物品注册 ============
var tpl = mockWindow.itemById['pill_root_refine'];
assert(!!tpl && tpl.subtype === 'pill' && tpl.effect && tpl.effect.root_refine === 6 && tpl.quality === 'LEGENDARY',
    'A1 重塑灵根丹模板入物品库（丹子类=自动累丹毒，主效=挪饼 +6）');
assert(mockWindow.allItems.indexOf(tpl) >= 0 && mockWindow.consumables.indexOf(tpl) >= 0,
    'A2 全物品表与消耗品表均已收录');
var nBefore = mockWindow.allItems.length;
load('js/items-extended/15-root-refine.js'); // 重复加载（热重载/双 script 模拟）
assert(mockWindow.allItems.length === nBefore, 'A3 自注册幂等：重复加载不重复入库');
assert(mockWindow.NpcLineage && typeof mockWindow.NpcLineage._pieRoots === 'function',
    'A4 族谱饼尺在场（改命与判定共用同一把尺子）');

// ============ B: 丹方唯一性 ============
var AC = mockWindow.AlchemyCompound;
var recipe = null;
AC.COMPOUND_PILFAR_RECIPES.forEach(function (r) { if (r.id === 'recipe_root_refine_open') recipe = r; });
assert(!!recipe && recipe.result.itemId === 'pill_root_refine' &&
    recipe.requiredSkills['炼制'] === 70 && recipe.qiCost === 100 && recipe.timeCost === 120,
    'B1 丹方在案：炼制 70 / 真气 100 / 两个时辰，产出即此丹');
assert(AC.checkSlotMat('mat_five_element_essence', recipe.slots.main).ok === true,
    'B2 五行灵髓主药合格（五行俱足、药性平和）');
var chaosCk = AC.checkSlotMat('mat_chaos_stone', recipe.slots.main);
assert(!chaosCk.ok && chaosCk.reason.indexOf('nature-high') === 0,
    'B3 混沌石被药性上限拦下（' + chaosCk.reason + '）——药力太烈摊不动饼');
var onlyMain = null;
Object.keys(AC.MATERIAL_PROPS).forEach(function (k) {
    var p = AC.MATERIAL_PROPS[k];
    if ((p.primary.breakthrough || 0) >= 40 && k !== 'mat_five_element_essence' &&
        AC.checkSlotMat(k, recipe.slots.main).ok) onlyMain = k;
});
assert(onlyMain === null, 'B4 高突破药材中唯五行灵髓能过主药关（漏网: ' + onlyMain + '）');
assert(AC.checkSlotMat('mat_ginseng', recipe.slots.assist).ok === true &&
    AC.checkSlotMat('mat_liquorice', recipe.slots.balancer).ok === true,
    'B5 辅药（人参培气）与调和（甘草）常见药材可用——门槛在主药不在杂药');

// ============ C: 挪饼数学 ============
mockWindow.currentCharData = null;
assert(!!mockWindow.refineRootByPill().error, 'C1 无角色时拒服（不凭空改命）');
mockWindow.currentCharData = { name: '测', spiritualRoots: {} };
assert(!!mockWindow.refineRootByPill().error, 'C2 无灵根数据拒服（全零饼视为均衡另议，缺数据不猜）');
mockWindow.currentCharData.spiritualRoots = { metal: 40, wood: 15, water: 15, fire: 15, earth: 15 };
var cd = mockWindow.currentCharData;
var advBefore = advCalls.length;
var r1 = mockWindow.refineRootByPill();
assert(r1.fromMain === 40 && r1.toMain === 44 && r1.element === '金' && r1.count === 1,
    'C3 +6 目标经摊薄实际 +4（40→44），金主根如实播报（实际 ' + r1.toMain + '）');
assert(pieSum(cd.spiritualRoots) === 100 && allInts(cd.spiritualRoots),
    'C4 挪饼后总和恒 100 且全整数（' + JSON.stringify(cd.spiritualRoots) + '）');
assert(cd._rootRefines === 1, 'C5 重塑次数计数器 +1');
assert(advCalls.length === advBefore + 1 && advCalls[advCalls.length - 1].mins === 120 &&
    advCalls[advCalls.length - 1].reason.indexOf('重塑') >= 0,
    'C6 时间成本两个时辰如实推进（无每日配额，成本即药力运行）');
var r2 = mockWindow.refineRootByPill();
var d1 = r1.toMain - 40, d2 = r2.toMain - r1.toMain;
assert(d2 < d1 && pieSum(cd.spiritualRoots) === 100,
    'C7 药力递减：第二次 +' + d2 + ' < 第一次 +' + d1 + '（摊薄机制天然递减，无需人为衰减表）');
cd.spiritualRoots = { metal: 60, wood: 10, water: 10, fire: 10, earth: 10 };
var pieBefore = JSON.stringify(cd.spiritualRoots), cntBefore = cd._rootRefines;
var rCap = mockWindow.refineRootByPill();
assert(!!rCap.error && rCap.error.indexOf('六成') >= 0, 'C8 主根六成封顶：再服如实拒绝');
assert(JSON.stringify(cd.spiritualRoots) === pieBefore && cd._rootRefines === cntBefore,
    'C9 拒服时灵根与次数纹丝不动（调用方据此不扣丹）');
var info = mockWindow.rootRefineInfo();
assert(info.mainKey === 'metal' && info.mainRatio === 60 && info.cap === 60 && info.refines === cntBefore,
    'C10 只读口径与真源一致（面板可直接引用）');

// ============ D: 存档往返 ============
var save = mockWindow.GameState.collectFullGameState();
assert(save && save.rootRefines === cntBefore, 'D1 重塑次数入档（白名单第 N 字段，无平行状态）');
assert(save && pieSum(save.roots) === 100 && save.roots.metal === 60, 'D2 灵根饼本体随 roots 字段入档且总和守恒');
var wire = JSON.parse(JSON.stringify(save));
mockWindow.currentCharData.spiritualRoots = {};
mockWindow.currentCharData._rootRefines = 0;
mockWindow.GameState.applyFullGameState(wire, {});
var rcd = mockWindow.currentCharData;
assert(rcd._rootRefines === cntBefore && rcd.spiritualRoots.metal === 60 && pieSum(rcd.spiritualRoots) === 100,
    'D3 读档回灌：次数与饼跨档守恒（JSON 落盘往返）');
var oldSave = JSON.parse(JSON.stringify(wire));
delete oldSave.rootRefines;
mockWindow.GameState.applyFullGameState(oldSave, {});
assert(mockWindow.currentCharData._rootRefines === 0, 'D4 旧档无此字段按 0 兜底（并档不炸不白送）');

// ============ E: 成就真链路（走真实读档补课 + 增量检查，不重开管理器） ============
// D 段的 applyFullGameState 已触发成就模块 import 的"静默补课"：此前重塑两次，
// 破而后立应在读档一刻点亮，洗尽铅华（需三次）此刻应仍未亮——如实考：
var mgr = mockWindow.achievementManager;
assert(!!mgr && mgr.getAchievement('root_refine_1') && mgr.getAchievement('root_refine_3'),
    'E1 成就预置两枚在案，管理器经读档链路就位（含隐藏款定义）');
assert(mgr.getAchievement('root_refine_1').isCompleted === true &&
    mgr.getAchievement('root_refine_3').isCompleted === false,
    'E2 读档补课如实点亮破而后立（重塑两次），不足三次则洗尽铅华不亮（不白送）');
var toastBase = toasts.length;
mockWindow.currentCharData._rootRefines = 3;
mockWindow.checkAchievementsNow();
assert(mgr.getAchievement('root_refine_3').isCompleted === true, 'E3 第三次重塑经真实检查点亮隐藏款洗尽铅华');
var newToasts = toasts.slice(toastBase);
assert(newToasts.length === 1 && newToasts[0].indexOf('洗尽铅华') >= 0,
    'E4 增量检查至多弹一条（实际 ' + newToasts.length + ' 条，v20.15 封顶跨版本不回退）');
assert(mgr.totalPoints >= 120, 'E5 成就积分入账（稀有 40 + 史诗 80）');
assert(mockWindow.buildAchievementProfile().rootRefines === 3, 'E6 成就档案如实读真源（防幽灵键）');

// ============ F: 静态 ============
var invSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'inventory.js'), 'utf8');
var poisonPos = invSrc.indexOf('window.addPillPoison(slot.templateId');
var refinePos = invSrc.indexOf('template.effect.root_refine');
assert(poisonPos >= 0 && refinePos > poisonPos && invSrc.indexOf('拒服：不扣丹') >= 0,
    'F1 服用分支挂在校验丹毒之后：丹照吃毒照积、拒服不扣丹');
var htmlSrc = fs.readFileSync(path.resolve(__dirname, '..', '仙侠.html'), 'utf8');
assert(htmlSrc.indexOf('js/items-extended/15-root-refine.js') >= 0 &&
    htmlSrc.indexOf('js/extensions/root-refine.js') >= 0, 'F2 页面接线：模板与服用逻辑两枚脚本均已挂载');
var gsSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'core', 'game-state.js'), 'utf8');
assert(gsSrc.indexOf('rootRefines: charData._rootRefines') >= 0 &&
    gsSrc.indexOf('_rootRefines: n(saveData.rootRefines, 0)') >= 0, 'F3 存档白名单：入档与回灌成对');
var achSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'achievement-system.js'), 'utf8');
assert(achSrc.indexOf("'root_refine_1'") >= 0 && achSrc.indexOf("'root_refine_3'") >= 0 &&
    achSrc.indexOf('p.rootRefines') >= 0, 'F4 成就预置与档案键成对（防幽灵键）');

console.log('v20.16 root-refine: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
