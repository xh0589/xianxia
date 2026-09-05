/**
 * city-depth-node.js — v20.7 建筑补齐回归
 *
 * 覆盖：
 *   A 传送阵 go：travelSystem 拒绝不扣费；成行扣 100 灵石 + 30 分钟；useBuildingEffect 透传参数
 *   B 客栈包间：灵石门槛；清 statusEffects/_poisoned
 *   C 演武场静坐 / D 洞府修炼（5 灵石香火 + 灵泉余泽×1.15 逐坐消耗）
 *   E 灵泉收集（10 精力、存 3 止）/ F 寺庙祈福（20 灵石）与静修
 *   G 酒楼 drink 吃 RUMOR_LOG 真源（🌀 前缀）+ 静态兜底；meet_npc 同地 +2 好感/空座照付
 *   H 剑冢：悟剑耗真气钳位 30；拔剑资格/唯一性/失败反震；挑战剑灵胜负两路；攻击加成
 *   I 试炼塔：精力+灵石门槛、胜升层、败不升、第 5 层赐药
 *   J blessing 挡毒 / poisonTick 每日 −15% 气血 / 世界日历订阅挂载
 *   K 货架真实扣款发货 + 背包满退款
 *   L StateRegistry 'cityProgress' 注册与往返
 *   M 静态集成：battle 剑意钩、HTML 挂载、location-system/app.js 委托接线
 *
 * 运行：node tests/city-depth-node.js
 */
'use strict';

var path = require('path');
var fs = require('fs');
var vm = require('vm');

function loadScript(rel) {
    return fs.readFileSync(path.resolve(__dirname, '..', 'js', rel), 'utf8');
}

var assertions = 0, failures = [];
function ok(cond, label) {
    assertions++;
    if (!cond) failures.push(label);
}
function eq(actual, expected, label) {
    assertions++;
    if (actual !== expected) failures.push(label + ' (got ' + actual + ', want ' + expected + ')');
}

// ============ 世界桩 ============
var mockWindow = {
    console: console,
    Math: Math, JSON: JSON, Object: Object, Array: Array, Date: Date, String: String, Number: Number, Boolean: Boolean, isFinite: isFinite, parseInt: parseInt, parseFloat: parseFloat,
    setTimeout: function (fn) { fn(); return 0; },
    document: {
        createElement: function () { return {}; },
        getElementById: function () { return null; },
        addEventListener: function () {},
        body: { appendChild: function () {} }
    }
};
mockWindow.window = mockWindow;

var state = { minutes: 0, msgs: [], modals: [], fame: 0, addedItems: [], dialogsOpened: [] };
mockWindow.timeSystem = {
    minutesAdvanced: 0,
    subs: [],
    getAbsoluteDay: function () { return 100; },
    advanceTime: function (m) { state.minutes += m; this.minutesAdvanced += m; },
    getCultivationSpeedBonus: function () { return 1; },
    onNewDaySubscribe: function (fn) { state.subs = (state.subs || []).concat([fn]); }
};
mockWindow.showMessage = function (t, k) { state.msgs.push(String(t)); };
mockWindow.showModal = function (title, html) { state.modals.push({ title: title, html: String(html) }); };
mockWindow.addFame = function (n) { state.fame += n; };
mockWindow.addItem = function (id, n) { state.addedItems.push({ id: id, n: n || 1 }); return mockWindow.__bagAccept !== false; };
mockWindow.showNPCDialog = function (id) { state.dialogsOpened.push(id); };
mockWindow.eventSystem = null; // 屏蔽随机事件干扰

var cd = {
    name: '测试子', realm: '筑基', layer: 3,
    health: 50, maxHealth: 100, qi: 100, maxQi: 100, energy: 100, maxEnergy: 100,
    essence: 0, tempering: 0, mood: 50, karma: 10,
    spiritStones: 1000, copper: 500,
    statusEffects: [{ id: 'daze' }],
    _poisoned: false, blessing: 0, springBlessing: 0,
    location: '帝都'
};
mockWindow.currentCharData = cd;

// DataManager 真源镜像：扣款同时改 charData，供断言
mockWindow.XianXia = {};
mockWindow.XianXia.DataManager = {
    getSpiritStones: function () { return cd.spiritStones; },
    deductSpiritStones: function (n) {
        if (cd.spiritStones < n) return false;
        cd.spiritStones -= n; return true;
    },
    addSpiritStones: function (n) { cd.spiritStones += n; },
    deductCopper: function (n) {
        if (cd.copper < n) return false;
        cd.copper -= n; return true;
    }
};

// StateRegistry 桩
var registry = {};
mockWindow.StateRegistry = {
    register: function (key, def) { registry[key] = def; }
};

// travelSystem 桩
mockWindow.travelSystem = {
    result: true,
    lastCall: null,
    startTravel: function (to, mode) {
        this.lastCall = { to: to, mode: mode };
        if (this.result === false) { mockWindow.showMessage('传送阵尚未解锁', 'warning'); return false; }
        return true;
    }
};

// npcManager 桩（酒楼结识）
function mkNpc(id, name, loc, alive) {
    return {
        id: id, name: name, location: loc, isDead: !alive, isMissing: false,
        affSpy: 0,
        changeAffection: function (d) { this.affSpy += d; }
    };
}
var npcHere = mkNpc('npc_here', '同地客', '帝都', true);
var npcDead = mkNpc('npc_dead', '死人', '帝都', false);
var npcElse = mkNpc('npc_else', '外地客', '百花谷', true);
mockWindow.npcManager = { getAllNPCs: function () { return [npcHere, npcDead, npcElse]; } };

// NPCLife 桩（传闻真源）
mockWindow.NPCLife = {
    log: [
        { id: 'r1', summary: '剑冢方向夜半剑鸣', distorted: true, npcId: 'npc_here' }
    ],
    getRumorLog: function (n) { return this.log.slice(0, n); }
};

// ============ 载入被测脚本 ============
vm.createContext(mockWindow);
vm.runInContext(loadScript('building-effects.js'), mockWindow, { filename: 'building-effects.js' });
vm.runInContext(loadScript('city-depth.js'), mockWindow, { filename: 'city-depth.js' });

var CityDepth = mockWindow.CityDepth;
var Registry = mockWindow.buildingEffects.buildingEffectsRegistry;
var useB = mockWindow.useBuildingEffect;

function resetChar() {
    cd.health = 50; cd.qi = 100; cd.energy = 100; cd.essence = 0; cd.tempering = 0;
    cd.mood = 50; cd.karma = 10; cd.spiritStones = 1000; cd.copper = 500;
    cd.statusEffects = [{ id: 'daze' }]; cd._poisoned = false; cd.blessing = 0; cd.springBlessing = 0;
    state.msgs = []; state.addedItems = []; state.dialogsOpened = []; state.fame = 0;
    CityDepth.progress().swordIntent = 0;
    CityDepth.progress().trialFloor = 0;
    CityDepth.progress().trialBest = 0;
    CityDepth.progress().hasAncientSword = false;
}
function rng(v) { return function () { return v; }; }

// ============ A 传送阵 ============
{
    resetChar();
    // 拒绝：startTravel false → 不扣费
    mockWindow.travelSystem.result = false;
    var r1 = useB('teleport', 'go', '百花谷');
    ok(r1 === false, 'A1 未解锁时 go 返回 false');
    eq(cd.spiritStones, 1000, 'A2 被拒不扣祭阵费');
    eq(mockWindow.travelSystem.lastCall.mode, 'teleport', 'A3 以 teleport 方式发起');

    // 成行：扣 100 灵石 + 30 分钟
    resetChar();
    mockWindow.travelSystem.result = true;
    var r2 = useB('teleport', 'go', '帝都');
    ok(r2 === true, 'A4 go 成行返回 true（useBuildingEffect 透传第 3 参）');
    eq(cd.spiritStones, 900, 'A5 成行扣 100 灵石');
    eq(state.minutes % 30, 0, 'A6 蓄能耗时计入世界钟');
    ok(state.msgs.join('|').indexOf('100 灵石') >= 0, 'A7 扣费文案明示');

    // 灵石不足：startTravel 已放行，但扣费失败 → false
    resetChar();
    cd.spiritStones = 50;
    var r3 = useB('teleport', 'go', '帝都');
    ok(r3 === false, 'A8 灵石不足 go 返回 false');
    eq(cd.spiritStones, 50, 'A9 不足时余额不动');
}

// ============ B 客栈包间 ============
{
    resetChar();
    cd.spiritStones = 20;
    ok(useB('inn', 'room_upgrade') === false, 'B1 灵石不足包间被拒');
    eq(cd.spiritStones, 20, 'B2 被拒不扣款');

    resetChar();
    cd.health = 12; cd._poisoned = true;
    var r = useB('inn', 'room_upgrade');
    ok(r === true, 'B3 包间休息成功');
    eq(cd.spiritStones, 950, 'B4 包间扣 50 灵石');
    eq(cd.health, 100, 'B5 气血全恢复');
    eq(cd.statusEffects.length, 0, 'B6 负面状态清空');
    eq(cd._poisoned, false, 'B7 体毒暂退');
    ok(state.msgs.join('|').indexOf('暂退') >= 0, 'B8 暂退文案提示需解毒丹根除');
}

// ============ C 演武场静坐 ============
{
    resetChar();
    cd.qi = 10;
    ok(useB('training', 'meditate') === false, 'C1 真气不足静坐被拒');
    resetChar();
    var before = cd.essence;
    ok(useB('training', 'meditate') === true, 'C2 静坐成功');
    eq(cd.qi, 70, 'C3 静坐耗 30 真气');
    eq(cd.essence - before, 10, 'C4 静坐得 10 真元');
}

// ============ D 洞府修炼：香火 + 灵泉余泽 ============
{
    resetChar();
    cd.spiritStones = 2;
    ok(useB('cultivation', 'cultivate') === false, 'D1 香火钱不足修炼被拒');
    eq(cd.qi, 100, 'D2 被拒不耗真气');

    resetChar();
    var e0 = cd.essence;
    ok(useB('cultivation', 'cultivate') === true, 'D3 正常修炼');
    eq(cd.spiritStones, 995, 'D4 修炼扣 5 灵石香火');
    eq(cd.essence - e0, 30, 'D5 无余泽真元 +30');

    resetChar();
    cd.springBlessing = 2;
    var e1 = cd.essence;
    useB('cultivation', 'cultivate');
    eq(cd.essence - e1, 34, 'D6 余泽×1.15（floor 34.5 = 34）');
    eq(cd.springBlessing, 1, 'D7 余泽逐坐消耗');
    ok(state.msgs.join('|').indexOf('灵泉余泽') >= 0, 'D8 余泽在文案里显形');
}

// ============ E 灵泉收集 ============
{
    resetChar();
    cd.energy = 5;
    ok(useB('spring', 'collect') === false, 'E1 精力不足被拒');
    resetChar();
    ok(useB('spring', 'collect') === true, 'E2 收集成功');
    eq(cd.springBlessing, 1, 'E3 余泽 +1');
    eq(cd.energy, 90, 'E4 耗 10 精力');
    cd.springBlessing = 3;
    ok(useB('spring', 'collect') === false, 'E5 存满 3 止');
    eq(cd.springBlessing, 3, 'E6 满时不再增加');
}

// ============ F 寺庙 ============
{
    resetChar();
    cd.spiritStones = 10;
    ok(useB('temple', 'pray') === false, 'F1 香火不足被拒');
    resetChar();
    cd.statusEffects = [{ id: 'curse' }];
    ok(useB('temple', 'pray') === true, 'F2 祈福成功');
    eq(cd.spiritStones, 980, 'F3 祈福扣 20 灵石');
    eq(cd.blessing, 1, 'F4 庇佑 +1');
    eq(cd.statusEffects.length, 0, 'F5 祈福净化负面');

    resetChar();
    cd.qi = 5;
    ok(useB('temple', 'meditate') === false, 'F6 真气不足静修被拒');
    resetChar();
    var e2 = cd.essence, k2 = cd.karma;
    ok(useB('temple', 'meditate') === true, 'F7 寺中静修成功');
    eq(cd.essence - e2, 12, 'F8 静修 +12 真元');
    eq(cd.karma - k2, 1, 'F9 静修 +1 佛缘');
}

// ============ G 酒楼 ============
{
    resetChar();
    cd.copper = 10;
    ok(useB('tavern', 'drink') === false, 'G1 铜钱不足酒被拒');
    resetChar();
    useB('tavern', 'drink');
    eq(cd.copper, 480, 'G2 酒钱 20 铜走 DataManager');
    var drinkMsg = state.msgs.filter(function (m) { return m.indexOf('情报') >= 0; }).join('|');
    ok(drinkMsg.indexOf('🌀') >= 0 && drinkMsg.indexOf('剑鸣') >= 0, 'G3 情报取自真传闻池且带 🌀 走形标记');

    // 池空 → 静态兜底
    var savedLog = mockWindow.NPCLife.log;
    mockWindow.NPCLife.log = [];
    resetChar();
    useB('tavern', 'drink');
    ok(state.msgs.filter(function (m) { return m.indexOf('情报') >= 0; }).length === 1, 'G4 池空时仍有静态兜底情报');
    mockWindow.NPCLife.log = savedLog;

    // 结识：同地 +2 好感 + 开对话
    resetChar();
    npcHere.affSpy = 0;
    ok(useB('tavern', 'meet_npc') === true, 'G5 做东成功');
    eq(cd.copper, 460, 'G6 做东扣 40 铜');
    eq(npcHere.affSpy, 2, 'G7 只与同地活人结识 +2');
    eq(npcDead.affSpy || 0, 0, 'G8 死人不入席');
    eq(state.dialogsOpened.indexOf('npc_here') >= 0, true, 'G9 结识后直接开对话');

    // 空座：照付不退款
    resetChar();
    cd.location = '无人城';
    ok(useB('tavern', 'meet_npc') === true, 'G10 空座日仍成交（成本不退）');
    eq(cd.copper, 460, 'G11 空座照样扣 40 铜');

    // 钱不够
    resetChar();
    cd.copper = 5;
    ok(useB('tavern', 'meet_npc') === false, 'G12 做东钱不够被拒');

    // 注册表键与按钮字符串一致
    ok(typeof Registry.inn.room_upgrade === 'function', 'G13 注册表含 room_upgrade');
    ok(typeof Registry.tavern.meet_npc === 'function', 'G14 注册表含 meet_npc');
    ok(typeof Registry.teleport.go === 'function', 'G15 注册表含 teleport.go');
}

// ============ H 剑冢 ============
{
    resetChar();
    cd.qi = 10;
    ok(CityDepth.swordComprehend({ randomSource: rng(0) }) === false, 'H1 真气不足悟剑被拒');
    resetChar();
    ok(CityDepth.swordComprehend({ randomSource: rng(0.1) }) === true, 'H2 悟剑成功');
    eq(cd.qi, 80, 'H3 悟剑耗 20 真气');
    eq(CityDepth.progress().swordIntent, 2, 'H4 灵光乍现得 2 剑意');
    resetChar();
    CityDepth.swordComprehend({ randomSource: rng(0.9) });
    eq(CityDepth.progress().swordIntent, 1, 'H5 平常只得 1 剑意');
    resetChar();
    CityDepth.progress().swordIntent = 30;
    ok(CityDepth.swordComprehend({ randomSource: rng(0) }) === false, 'H6 剑意满 30 不再涨');

    // 拔剑
    resetChar();
    ok(CityDepth.swordPull({ randomSource: rng(0) }) === false, 'H7 剑意<8 无资格拔剑');
    resetChar();
    CityDepth.progress().swordIntent = 8;
    ok(CityDepth.swordPull({ randomSource: rng(0.99) }) === false, 'H8 拔剑失败');
    eq(cd.energy, 95, 'H9 拔剑失败反震精力 -5');
    resetChar();
    CityDepth.progress().swordIntent = 8;
    ok(CityDepth.swordPull({ randomSource: rng(0) }) === true, 'H10 拔剑成功');
    ok(state.addedItems.some(function (a) { return a.id === 'wpn_dark_iron_sword'; }), 'H11 古剑入手');
    eq(CityDepth.progress().hasAncientSword, true, 'H12 认主标记');
    eq(CityDepth.progress().swordIntent, 10, 'H13 认主剑意 +2');
    var n1 = state.addedItems.length;
    ok(CityDepth.swordPull({ randomSource: rng(0) }) === false, 'H14 全江湖仅此一把，再拔被拒');
    eq(state.addedItems.length, n1, 'H15 二次拔剑不再发剑');

    // 挑战剑灵
    resetChar();
    ok(CityDepth.swordChallenge({ randomSource: rng(0) }) === false, 'H16 剑意<5 战不了剑灵');
    resetChar();
    CityDepth.progress().swordIntent = 10;
    var e3 = cd.essence;
    ok(CityDepth.swordChallenge({ randomSource: rng(0) }) === true, 'H17 胜剑灵');
    eq(CityDepth.progress().swordIntent, 13, 'H18 胜后剑意 +3');
    eq(cd.essence - e3, 50, 'H19 胜得真元 +50');
    eq(state.fame, 3, 'H20 胜剑灵名声外传');
    resetChar();
    CityDepth.progress().swordIntent = 10;
    ok(CityDepth.swordChallenge({ randomSource: rng(0.99) }) === false, 'H21 败于剑灵');
    eq(cd.energy, 80, 'H22 败北精力 -20');
    eq(cd.tempering, 15, 'H23 败也是剑课 +15 历练');

    // 战斗加成
    resetChar();
    eq(mockWindow.getSwordIntentAttackMul(), 1, 'H24 无剑意时倍率恒 1');
    CityDepth.progress().swordIntent = 10;
    ok(Math.abs(mockWindow.getSwordIntentAttackMul() - 1.06) < 1e-9, 'H25 剑意×0.6% 攻击加成');
}

// ============ I 试炼塔 ============
{
    resetChar();
    cd.energy = 10;
    ok(CityDepth.trialChallenge({ randomSource: rng(0) }) === false, 'I1 精力不足被拒');
    resetChar();
    cd.spiritStones = 10;
    ok(CityDepth.trialChallenge({ randomSource: rng(0) }) === false, 'I2 香火钱不足被拒');
    eq(cd.energy, 100, 'I3 香火被拒不扣精力');

    resetChar();
    var e4 = cd.essence;
    var res = CityDepth.trialChallenge({ randomSource: rng(0) }); // 筑基三层 score 26 vs 层难 8 → prob 90，rng0 必胜
    ok(res && res.success === true, 'I4 胜率内挑战成功');
    eq(CityDepth.progress().trialFloor, 1, 'I5 升到第 1 层');
    eq(CityDepth.progress().trialBest, 1, 'I6 最深纪录同步');
    eq(cd.essence - e4, 35, 'I7 首层赏 35 真元');
    eq(cd.spiritStones, 970, 'I8 香火扣 30 灵石');

    resetChar();
    var f0 = CityDepth.progress().trialFloor;
    cd.mood = 50;
    var res2 = CityDepth.trialChallenge({ randomSource: rng(0.99) }); // 败局路径
    ok(res2 && res2.success === false, 'I9 败局返回 success:false');
    eq(CityDepth.progress().trialFloor, f0, 'I10 败局层数不涨');
    eq(cd.mood, 45, 'I11 败局心情 -5');
    eq(cd.tempering, 10, 'I12 败局历练 +10');

    resetChar();
    CityDepth.progress().trialFloor = 4;
    CityDepth.trialChallenge({ randomSource: rng(0) }); // 第 5 层：筑基三层 diff 40 score 26 → prob 50+(-14)*3 < 50…rng0 仍 < prob(=5)？5>0 → 胜
    eq(CityDepth.progress().trialFloor, 5, 'I13 连攀到第 5 层');
    ok(state.addedItems.some(function (a) { return a.id === 'vitality_pill' && a.n === 2; }), 'I14 五层整赏赐药两枚');
}

// ============ J 毒与庇佑 ============
{
    resetChar();
    ok(CityDepth.tryBlockPoison() === false, 'J1 无庇佑挡不住毒');
    resetChar();
    cd.blessing = 1;
    ok(CityDepth.tryBlockPoison() === true, 'J2 庇佑挡毒');
    eq(cd.blessing, 0, 'J3 庇佑一次消耗');

    resetChar();
    cd._poisoned = true;
    cd.health = 100;
    ok(CityDepth.poisonTick() === true, 'J4 带毒则每日发作');
    eq(cd.health, 85, 'J5 毒发气血 -15%');
    cd.health = 100;
    ok(CityDepth.poisonTick() === true, 'J6 毒不死人（下限 1 血仍续毒）');
    cd._poisoned = false;
    cd.health = 40;
    ok(CityDepth.poisonTick() === false, 'J7 解毒后不再发作');
    eq(cd.health, 40, 'J8 解毒后气血不再暗损');

    ok(state.subs.length >= 1, 'J9 毒发已挂世界日历（onNewDaySubscribe）');
    cd._poisoned = true; cd.health = 100;
    state.subs[0](); // 走日历回调而非直调
    eq(cd.health, 85, 'J10 日历回调确实触发毒发');
    cd._poisoned = false;
}

// ============ K 货架 ============
{
    resetChar();
    cd.spiritStones = 30;
    ok(CityDepth.buyWare('gold', 0) === false, 'K1 钱不够买不了金砂');
    eq(cd.spiritStones, 30, 'K2 钱不够不扣款');
    resetChar();
    ok(CityDepth.buyWare('gold', 0) === true, 'K3 金砂成交');
    eq(cd.spiritStones, 940, 'K4 扣 60 灵石');
    ok(state.addedItems.some(function (a) { return a.id === 'mat_gold_sand'; }), 'K5 真实模板 id 发货');
    resetChar();
    ok(CityDepth.buyWare('pearl', 1) === true, 'K6 珍珠市场货品可买');
    ok(state.addedItems.some(function (a) { return a.id === 'mat_pearl'; }), 'K7 海珠发货');
    // 背包满 → 原路退款
    resetChar();
    mockWindow.__bagAccept = false;
    ok(CityDepth.buyWare('gold', 0) === false, 'K8 背包满购买失败');
    eq(cd.spiritStones, 1000, 'K9 背包满灵石原路退回');
    mockWindow.__bagAccept = true;
    // 非法下标
    resetChar();
    ok(CityDepth.buyWare('gold', 99) === false, 'K10 非法货位返回 false');
}

// ============ L 持久化 ============
{
    ok(!!registry.cityProgress, 'L1 注册了 cityProgress 新键');
    resetChar();
    CityDepth.swordComprehend({ randomSource: rng(0) });
    CityDepth.progress().trialFloor = 7;
    CityDepth.progress().hasAncientSword = true;
    var snap = registry.cityProgress.export();
    eq(snap.swordIntent, 2, 'L2 导出含剑意');
    eq(snap.trialFloor, 7, 'L3 导出含层数');
    registry.cityProgress.reset();
    eq(CityDepth.progress().trialFloor, 0, 'L4 reset 清零');
    registry.cityProgress.import(snap);
    eq(CityDepth.progress().swordIntent, 2, 'L5 往返恢复剑意');
    eq(CityDepth.progress().trialBest, 0, 'L6 旧档缺字段容错（best 落默认 0）');
    registry.cityProgress.import({ swordIntent: 999, trialFloor: -3 });
    eq(CityDepth.progress().swordIntent, 30, 'L7 脏数据钳位 30');
    eq(CityDepth.progress().trialFloor, 0, 'L8 负层数钳 0');
    registry.cityProgress.import(null);
    eq(CityDepth.progress().swordIntent, 30, 'L9 import(null) 不炸档');
}

// ============ M 静态集成接线 ============
{
    var battleSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'battle.js'), 'utf8');
    ok(battleSrc.indexOf('getSwordIntentAttackMul') >= 0, 'M1 battle.js 读取剑意攻击倍率');
    var htmlSrc = fs.readFileSync(path.resolve(__dirname, '..', '仙侠.html'), 'utf8');
    ok(htmlSrc.indexOf('js/city-depth.js') >= 0, 'M2 HTML 已挂载 city-depth.js');
    var locSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'location-system.js'), 'utf8');
    ok(locSrc.indexOf("openWaresPanel('gold')") >= 0, 'M3 黄金宫接专属货架');
    ok(locSrc.indexOf("openWaresPanel('pearl')") >= 0, 'M4 珍珠市场接专属货架');
    ok(locSrc.indexOf('tryBlockPoison') >= 0, 'M5 毒洞接庇佑挡毒');
    ok(locSrc.indexOf('CityDepth.openTrialPanel') >= 0, 'M6 试炼塔接层数制');
    ok((locSrc.match(/window\.CityDepth/g) || []).length >= 6, 'M7 剑冢三按钮全委托');
    var appSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'app.js'), 'utf8');
    var teaIdx = appSrc.indexOf('function visitTeaHouse');
    var teaSeg = appSrc.slice(teaIdx, teaIdx + 1800);
    ok(teaSeg.indexOf('renderRumorPanel') >= 0 && teaSeg.indexOf('deductSpiritStones') >= 0, 'M8 茶馆接传闻真源且收茶资');
    // v20.21 三栋楼各司其职：公会堂做实商会代售台（不再借用悬赏楼门面），悬赏楼接公共悬赏榜真源
    var ghIdx = appSrc.indexOf('function openGuildHall');
    var ghSeg = appSrc.slice(ghIdx, appSrc.indexOf('function openLibrary'));
    ok(ghSeg.indexOf('guildSellPrice') >= 0 && ghSeg.indexOf('openBountyHall') < 0, 'M9 公会堂做实商会代售台（去别名）');
    var bhIdx = appSrc.indexOf('function openBountyHall');
    ok(appSrc.slice(bhIdx, bhIdx + 600).indexOf('window.openBountyBoard') >= 0, 'M9b 悬赏楼接上公共悬赏榜真源');
    var libIdx = appSrc.indexOf('function openLibrary');
    ok(appSrc.slice(libIdx, libIdx + 900).indexOf('deductSpiritStones(3)') >= 0, 'M10 藏经阁收纸墨钱堵免费刷');
}

// ============ 汇总 ============
console.log('assertions: ' + assertions + ', failures: ' + failures.length);
if (failures.length) {
    failures.forEach(function (f) { console.log('  ✗ ' + f); });
    process.exit(1);
}
console.log('city-depth: all green');
