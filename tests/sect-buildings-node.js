/**
 * sect-buildings-node.js — v20.8 门派建筑 + 城市印钞机封堵回归
 *
 * 覆盖：
 *   A RewardService.take：缺货整体失败/交货扣物/与扣款原子性/karma 钳位
 *   B scenario-engine roll 分支（注入 rng）+ require.items 门槛 + reason 文案
 *   C facility-batch2：next 悬挂全扫描、当铺/钱庄交真货、斗法/走镖必胜印钞机消除、
 *     黑市举报与禁卷真物品、碑林冻结 rng 归零、负数 require 归零
 *   D sectBuffAttrBonus 别名翻译落六维 + cultivationSpeed 真读者
 *   E executeSectFacilityAction/building-effects 死函数名清零（静态）
 *   F 假物品 id 全仓归零（静态）
 *   G 地标真动作：personal/affection/military/torture/intel/storage + explore 真源同步
 *   H holdSectMeeting 成本与日节奏（片段求值）
 *   I 俸禄吃 _sectRelation（片段求值）
 *   J tier3 核心阁每派有货且 id 唯一（片段求值）
 *
 * 运行：node tests/sect-buildings-node.js
 */
'use strict';

var path = require('path');
var fs = require('fs');
var vm = require('vm');

var ROOT = path.resolve(__dirname, '..');
function loadScript(rel) { return fs.readFileSync(path.join(ROOT, 'js', rel), 'utf8'); }

var assertions = 0, failures = [];
function ok(cond, label) { assertions++; if (!cond) failures.push(label); }
function eq(actual, expected, label) {
    assertions++;
    if (actual !== expected) failures.push(label + ' (got ' + actual + ', want ' + expected + ')');
}

// ============ 世界桩 ============
var mockWindow = {
    console: console,
    setTimeout: function (fn) { fn(); return 0; },
    localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
    document: {
        createElement: function () { return { style: {}, classList: { add: function () {}, remove: function () {}, contains: function () { return false; } }, dataset: {} }; },
        getElementById: function () { return null; },
        addEventListener: function () {},
        body: { appendChild: function () {} }
    }
};
mockWindow.window = mockWindow;

var state = { msgs: [], logs: [], added: [], minutes: 0 };
mockWindow.timeSystem = {
    gameTime: { totalMinutes: 0, currentDay: 7 },
    advanceTime: function (m) { state.minutes += m; if (this.gameTime) this.gameTime.totalMinutes += m; }
};
mockWindow.advanceTime = function (m) { state.minutes += m; };
mockWindow.gameLog = { add: function (t, k) { state.logs.push(String(t)); } };
mockWindow.showMessage = function (t) { state.msgs.push(String(t)); };
mockWindow.getRealmTier = function () { return 3; };

var cd = {
    name: '测试子', realm: '筑基', layer: 3,
    health: 100, maxHealth: 100, qi: 100, maxQi: 100, energy: 100, maxEnergy: 100,
    tempering: 0, karma: 10, noto: 0, notoriety: 0, fame: 0,
    spiritStones: 1000, copper: 500, qi_recovery_unused: 0
};
mockWindow.currentCharData = cd;

// 背包真源：slots + currency（EconomyTransaction 依赖的形态）
var bag = {
    currency: { spiritStones: 1000, copper: 500 },
    slots: []
};
mockWindow.inventory = bag;
mockWindow.itemById = {
    mat_dragon_scale: { id: 'mat_dragon_scale', name: '龙鳞甲', price: 500 },
    mat_shihun_scroll: { id: 'mat_shihun_scroll', name: '禁术·噬魂残卷', price: 0 }
};
var _uid = 0;
mockWindow.addItem = function (id, n) {
    if (mockWindow.__bagAccept === false) return false;
    bag.slots.push({ uid: ++_uid, templateId: id, count: n || 1 });
    return true;
};
mockWindow.addReputation = function () {};
mockWindow.updateCurrencyUI = function () {};
mockWindow.updateCharacterStatus = function () {};
mockWindow.updateKarmaDisplay = function () {};

var registry = {};
mockWindow.StateRegistry = { register: function (k, d) { registry[k] = d; } };
mockWindow.EventBus = { emit: function () {}, on: function () {} };

// ============ 载入被测脚本 ============
vm.createContext(mockWindow);
vm.runInContext(loadScript('economy/economy-transaction.js'), mockWindow, { filename: 'economy-transaction.js' });
vm.runInContext(loadScript('core/reward-service.js'), mockWindow, { filename: 'reward-service.js' });
vm.runInContext(loadScript('core/scenario-engine.js'), mockWindow, { filename: 'scenario-engine.js' });
// 浏览器里 facility-batch2 与 scenario-engine 共享顶层 const；vm 各 script 顶层词法作用域会撞名，用函数包一层桥接
vm.runInContext('(function(){ const scenarioEngine = window.scenarioEngine;\n' + loadScript('city-facilities/facility-batch2.js') + '\n})();', mockWindow, { filename: 'facility-batch2.js' });
// v20.19 第三批：往已注册设施上追加第二出戏（顶层 helper 挂 context 全局，供现算报价闭包解析）
vm.runInContext(loadScript('city-facilities/facility-batch3.js'), mockWindow, { filename: 'facility-batch3.js' });
vm.runInContext(loadScript('sects/sect-resource-actions.js'), mockWindow, { filename: 'sect-resource-actions.js' });
vm.runInContext(loadScript('sects/sect-specialties.js'), mockWindow, { filename: 'sect-specialties.js' });

var RS = mockWindow.RewardService;
var EN = mockWindow.scenarioEngine;

// ============ A. RewardService.take / karma ============
bag.slots = [];
bag.currency.spiritStones = 1000;
var r1 = RS.apply({ stones: 250, take: [{ itemId: 'mat_dragon_scale', count: 1 }] }, { source: 'test' });
ok(r1.success === false && r1.reason === 'missing_item', 'A1 缺货 take 整体失败');
eq(bag.currency.spiritStones, 1000, 'A2 失败不发现金');

bag.slots.push({ uid: ++_uid, templateId: 'mat_dragon_scale', count: 1 });
var r2 = RS.apply({ stones: 250, take: [{ itemId: 'mat_dragon_scale', count: 1 }] }, { source: 'test' });
ok(r2.success === true, 'A3 交货+收款成功');
eq(bag.slots.filter(function (s) { return s && s.templateId === 'mat_dragon_scale'; }).length, 0, 'A4 鳞甲已出库');
eq(bag.currency.spiritStones, 1250, 'A5 收款250');
eq(cd.spiritStones, 1250, 'A6 charData 现金同步');
ok((r2.messages || []).some(function (m) { return m.indexOf('龙鳞甲 x-1') >= 0; }), 'A7 扣物消息可见');

bag.slots.push({ uid: ++_uid, templateId: 'mat_dragon_scale', count: 1 });
var r3 = RS.apply({ copper: -99999, take: [{ itemId: 'mat_dragon_scale', count: 1 }] }, { source: 'test' });
ok(r3.success === false, 'A8 扣款不足整体失败');
eq(bag.slots.filter(function (s) { return s && s.templateId === 'mat_dragon_scale'; }).length, 1, 'A9 失败则货不被白扣');

cd.karma = 10;
RS.apply({ karma: -3 }, { source: 'test' });
eq(cd.karma, 7, 'A10 karma 有符号入账');
RS.apply({ karma: -500 }, { source: 'test' });
eq(cd.karma, -100, 'A11 karma 钳位下界');
RS.apply({ karma: 500 }, { source: 'test' });
eq(cd.karma, 100, 'A12 karma 钳位上限');

// ============ B. scenario-engine roll / require.items ============
EN.register('_test_roll', {
    id: '_test_roll', name: 'T', icon: '🧪', desc: '',
    scenarios: [{
        id: 's', name: 'S', icon: '📌', desc: '', startNode: 'n1',
        nodes: {
            n1: {
                desc: 'd',
                choices: [
                    { text: 'win', next: null, effects: { roll: { prob: 0.4, win: { stones: 10, msg: 'W' }, lose: { stones: -10, msg: 'L' } } } },
                    { text: 'fn', next: null, effects: { roll: { prob: function () { return 1; }, win: { exp: 7 }, lose: { exp: 0 } } } },
                    { text: 'item', next: null, require: { items: { itemId: 'mat_dragon_scale', count: 1 } }, effects: { stones: 250, take: [{ itemId: 'mat_dragon_scale', count: 1 }] } }
                ]
            }
        }
    }]
});
mockWindow.__scenarioRng = function () { return 0.5; };
EN.start('_test_roll', 's');
var bRes = EN.choose(0);
ok(bRes && !bRes.error, 'B1 roll 分支可选');
ok(state.logs.indexOf('L') >= 0, 'B2 rng=0.5 > prob0.4 走败支');
// 重置
EN.progress = {};
bag.currency.spiritStones = 1000;
EN.start('_test_roll', 's');
mockWindow.__scenarioRng = function () { return 0.1; };
EN.choose(0);
ok(state.logs.indexOf('W') >= 0, 'B3 rng=0.1 < prob0.4 走胜支');
EN.progress = {};
EN.start('_test_roll', 's');
var bFn = EN.choose(1);
ok(bFn && !bFn.error, 'B4 prob 函数分支');
// require.items：无货禁用
EN.progress = {};
bag.slots = [];
bag.currency.spiritStones = 1000;
EN.start('_test_roll', 's');
var st = EN.getState();
var itemChoice = st.choices.filter(function (c) { return c.text === 'item'; })[0];
ok(itemChoice.disabled === true && itemChoice.reason.indexOf('缺少') >= 0, 'B5 无货时交割选项禁用');
bag.slots.push({ uid: ++_uid, templateId: 'mat_dragon_scale', count: 1 });
EN.start('_test_roll', 's');
var st2 = EN.getState();
ok(st2.choices.filter(function (c) { return c.text === 'item'; })[0].disabled === false, 'B6 有货解禁');
var bTake = EN.choose(2);
ok(bTake && !bTake.error, 'B7 交割成功');
eq(bag.currency.spiritStones, 1250, 'B8 交割收款');
ok(Object.keys(mockWindow.scenarioEngine.facilities).length > 10, 'B9 facility-batch2 已注册');

// ============ C. facility-batch2 静态封堵 ============
var f2src = loadScript('city-facilities/facility-batch2.js');
ok(!/msg:\s*Math\.random/.test(f2src), 'C1 冻结 rng（注册期 random 写 msg）归零');
ok(!/stones:\s*-\d+\s*,\s*require:\s*\{\s*stones:\s*-/.test(f2src), 'C2 负数 require 假门槛归零');
ok(f2src.indexOf('require: { stones: -1 }') < 0, 'C3 负数 stones 门槛归零');
// 悬挂 next 扫描
var dangling = [];
for (var fid in EN.facilities) {
    var fac = EN.facilities[fid];
    (fac.scenarios || []).forEach(function (sc) {
        for (var nid in sc.nodes) {
            ((sc.nodes[nid] || {}).choices || []).forEach(function (c) {
                if (c.next && !sc.nodes[c.next]) dangling.push(fid + '/' + nid + '→' + c.next);
            });
        }
    });
}
eq(dangling.length, 0, 'C4 next 悬挂节点归零' + (dangling.length ? ' [' + dangling.join(',') + ']' : ''));

var mh = JSON.stringify(EN.facilities.money_house);
ok(/"take":\[\{"itemId":"mat_dragon_scale"/.test(mh), 'C5 钱庄抵押真扣鳞甲');
ok(mh.indexOf('loan_mortgage') < 0, 'C6 抵押死链节点清除');
ok(mh.indexOf('"karma":-3') >= 0, 'C7 借贷有业障代价');
var pw = EN.facilities.pawn_shop;
// v20.20 起当铺一票两轨：典当（真账本，可赎）与卖断（行情现算）。断言迁移到新结构。
var pwStart = pw.scenarios[0].nodes.pw_start;
var pwSell = pwStart.choices[2];
var sellVal = typeof pwSell.effects.stones === 'function' ? pwSell.effects.stones() : pwSell.effects.stones;
eq(sellVal, 250, 'C8 当铺卖断=行情现算（无行情桩按平价 250）');
ok(sellVal < mockWindow.itemById.mat_dragon_scale.price, 'C9 卖价低于市价=无套利');
var pwGate = pwStart.choices[0];
ok(pwGate.require.items.itemId === 'mat_dragon_scale' && pwGate.effects.pawn.op === 'pawn' && pwSell.effects.take.length === 1, 'C10 当铺有货门+真交货+真当票通道');
var du = JSON.stringify(EN.facilities.arena_stage);
ok(du.indexOf('du_win_fast') < 0 && du.indexOf('du_win_steady') < 0, 'C11 必胜节点清除');
var duFight = EN.facilities.arena_stage.scenarios[0].nodes.du_fight.choices;
ok(duFight.every(function (c) { return c.effects && c.effects.roll; }), 'C12 斗法两路全走 roll');
var duProbs = duFight.map(function (c) { return typeof c.effects.roll.prob === 'function' ? c.effects.roll.prob() : c.effects.roll.prob; });
ok(duProbs.every(function (p) { return p < 0.85; }), 'C13 斗法非必胜（rng=3 境界概率<0.85）');
var esJson = JSON.stringify(EN.facilities.escort_office);
ok(esJson.indexOf('"es_fight"') < 0, 'C14 镖局必胜节点清除');
var esHit = EN.facilities.escort_office.scenarios[0].nodes.es_road.choices[0];
ok(esHit.effects.roll && esHit.effects.roll.lose && esHit.effects.roll.lose.health < 0, 'C15 走镖会输会伤');
var bm = EN.facilities.black_market.scenarios[0].nodes;
var jbt = bm.bl_start.choices.filter(function (c) { return c.text.indexOf('举报') >= 0; })[0];
ok(jbt.effects.karma > 0 && jbt.effects.noto > 0, 'C16 举报：业障正、恶名背');
var keep = bm.bl_buy.choices[0];
eq(keep.effects.stones, -500, 'C17 禁卷真扣500');
ok(keep.effects.items[0].itemId === 'mat_shihun_scroll' && keep.effects.karma < 0, 'C18 禁卷给真物+业障');
ok(loadScript('items-extended/13-missing-ids.js').indexOf('mat_shihun_scroll') >= 0, 'C19 噬魂残卷有模板');

// ============ D. buff 真翻译 ============
var tBonus = mockWindow.sectBuffAttrBonus({ defense: 30, agility: 0.2, cultivationSpeed: 0.5, executeThreshold: 0.7 }, { dexterity: 50, constitution: 40, strength: 20, intelligence: 10, willpower: 10, meridian: 10 });
eq(tBonus.constitution, 30, 'D1 defense→体魄直加');
eq(tBonus.dexterity, 10, 'D2 agility 0.2×当前身法=+10');
ok(tBonus.cultivationSpeed === undefined && tBonus.executeThreshold === undefined, 'D3 非战斗键不混进六维');
var tAll = mockWindow.sectBuffAttrBonus({ allStats: 5 }, null);
ok(['strength', 'dexterity', 'intelligence', 'willpower', 'constitution', 'meridian'].every(function (k) { return tAll[k] === 5; }), 'D4 allStats 落全六维');
mockWindow.activeBuffs = { sect_test: { effects: { cultivationSpeed: 0.5 }, expiryGameMinute: 1e9 } };
eq(Math.round(mockWindow.getSectBuffCultivationMul() * 100) / 100, 1.5, 'D5 cultivationSpeed 有真读者');
mockWindow.activeBuffs = { sect_old: { effects: { cultivationSpeed: 5 }, expiryGameMinute: 0 } };
eq(mockWindow.getSectBuffCultivationMul(), 1, 'D6 过期 buff 不计');
var appSrc = loadScript('app.js');
ok(appSrc.indexOf('sectBuffAttrBonus') >= 0, 'D7 属性合并处已接翻译器');
var beSrc = loadScript('building-effects.js');
ok(beSrc.indexOf('getSectBuffCultivationMul') >= 0, 'D8 修炼收益已接 cultivationSpeed');

// ============ E/F. 死函数与假物品 id 清零（静态） ============
ok(appSrc.indexOf('showCraftingUI') < 0, 'E1 app.js 死函数名归零');
ok(beSrc.indexOf('showCraftingUI') < 0, 'E2 building-effects 死函数名归零');
ok(appSrc.indexOf("useFacility('sect_medical')") >= 0, 'E3 医馆走有成本设施系统');
var sectFnSrc = appSrc.slice(appSrc.indexOf('function executeSectFacilityAction'), appSrc.indexOf('// ============ 设施功能函数'));
ok(/case 'sectHeal'/.test(sectFnSrc) && sectFnSrc.indexOf('maxHealth') < 0, 'E4 门派医馆免费满血漏洞语句消失');
ok(appSrc.indexOf('openContributionShop()') >= 0, 'E5 贡献兑换接线');
ok(appSrc.indexOf('openSectLibraryPanel()') >= 0, 'E6 藏经阁接线');
ok(appSrc.indexOf('openSectTaskUI()') >= 0, 'E7 门派任务接线');
var ghostIds = ['talisman_fire', 'talisman_ice', 'talisman_thunder', 'talisman_heal', 'mat_kirin_horn', 'mat_spacetime_crystal'];
function walk(dir, out) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach(function (e) {
        var p = path.join(dir, e.name);
        if (e.isDirectory()) { if (e.name !== 'node_modules') walk(p, out); }
        else if (/\.(js|html)$/.test(e.name)) out.push(p);
    });
    return out;
}
var allFiles = walk(path.join(ROOT, 'js'), []).concat([path.join(ROOT, '仙侠.html')]);
var ghostHits = [];
ghostIds.forEach(function (gid) {
    allFiles.forEach(function (f) {
        if (fs.readFileSync(f, 'utf8').indexOf(gid) >= 0) ghostHits.push(gid + '@' + path.basename(f));
    });
});
eq(ghostHits.length, 0, 'F1 假物品 id 全仓归零 [' + ghostHits.join(',') + ']');

// ============ G. 地标真动作 ============
mockWindow.SECT_DEEP_DATA = { '测试门': { specialResources: [
    { id: 'p1', name: '静室', type: 'personal' },
    { id: 'a1', name: '听泉亭', type: 'affection' },
    { id: 'm1', name: '武备库', type: 'military' },
    { id: 't1', name: '戒律房', type: 'torture' },
    { id: 'i1', name: '耳目房', type: 'intel' },
    { id: 's1', name: '库房', type: 'storage' },
    { id: 'e1', name: '后山', type: 'explore' }
] } };
mockWindow.discipleState = { isInSect: true, sectId: '测试门', contribution: 50, rank: 4 };
var USR = mockWindow.useSectResource;
mockWindow.discipleState.isInSect = false;
ok(USR('测试门', 'p1') === false, 'G1 非本门弟子拒入');
mockWindow.discipleState.isInSect = true;

cd.qi = 10; bag.currency.spiritStones = 500; cd.spiritStones = 500;
var minBefore = state.minutes;
ok(USR('测试门', 'p1') === true, 'G2 静室可用');
eq(cd.qi, 35, 'G3 静室真气+25');
eq(state.minutes - minBefore, 120, 'G4 静室吃两个时辰');

mockWindow.getDaoCompanionBond = null;
var sBefore = bag.currency.spiritStones;
ok(USR('测试门', 'a1') === false, 'G5 无道侣则不成');
eq(bag.currency.spiritStones, sBefore, 'G6 无道侣不扣钱');
mockWindow.getDaoCompanionBond = function () { return { bond: { level: 2 } }; };
var tpBefore = cd.tempering;
ok(USR('测试门', 'a1') === true, 'G7 有道侣成立');
eq(bag.currency.spiritStones, sBefore - 20, 'G8 款待道侣扣20（真源）');
eq(cd.tempering, tpBefore + 8, 'G9 陪伴换心境历练');

cd.energy = 10;
ok(USR('测试门', 'm1') === false, 'G10 精力不足操练不成');
cd.energy = 100;
var contBefore = mockWindow.discipleState.contribution;
ok(USR('测试门', 'm1') === true, 'G11 操练成立');
eq(mockWindow.discipleState.contribution, contBefore + 15, 'G12 操练换贡献+15');
eq(cd.energy, 80, 'G13 操练耗精力20');

cd.health = 20;
ok(USR('测试门', 't1') === false, 'G14 强弩之末不进刑房');
cd.health = 100; cd.qi = 50;
ok(USR('测试门', 't1') === true, 'G15 自省成立');
eq(cd.health, 85, 'G16 痛楚代价伤15');
eq(cd.qi, 90, 'G17 真气冲开+40');

bag.currency.spiritStones = 5;
ok(USR('测试门', 'i1') === false, 'G18 买消息没钱不成');
bag.currency.spiritStones = 500;
var stMsgLen = state.msgs.length;
ok(USR('测试门', 'i1') === true, 'G19 买消息成立');
eq(bag.currency.spiritStones, 490, 'G20 消息费10灵石');

// explore：cd.spiritStones 与背包真源不再双轨
cd.spiritStones = bag.currency.spiritStones;
var drift = false;
for (var it = 0; it < 30; it++) {
    USR('测试门', 'e1');
    if (cd.spiritStones !== bag.currency.spiritStones) drift = true;
}
ok(!drift, 'G21 探索灵石单轨（30 轮无漂移）');
var lbl = mockWindow._sectResourceActionLabel;
ok(['personal', 'affection', 'storage', 'military', 'intel', 'formation', 'craft', 'torture'].every(function (t) { return lbl(t).length > 0; }), 'G22 全地标类型有按钮文案（灰置消除）');

// ============ H. holdSectMeeting 片段求值 ============
function extractFn(rel, name) {
    var src = loadScript(rel);
    var m = src.match(new RegExp('function ' + name + '\\([\\s\\S]*?\\n\\}'));
    return m ? m[0] : '';
}
var hsCode = extractFn('sects/sect-internal.js', 'holdSectMeeting');
ok(hsCode.length > 0, 'H0 holdSectMeeting 可提取');
var hsCtx = vm.createContext({
    window: null, Math: Math, Date: Date, Number: Number, String: String,
    SECT_INTERNAL: { '测试门': { morale: 50, meetings: [] } },
    console: console
});
hsCtx.window = hsCtx;
hsCtx.timeSystem = mockWindow.timeSystem;
hsCtx.showMessage = function (t) { state.msgs.push(String(t)); };
vm.runInContext(hsCode, hsCtx);
hsCtx.window.discipleState = { contribution: 10 };
var dataH = hsCtx.SECT_INTERNAL['测试门'];
eq(hsCtx.holdSectMeeting('测试门'), false, 'H1 贡献不足开不了会');
eq(dataH.morale, 50, 'H2 开不成会士气不动');
hsCtx.window.discipleState.contribution = 25;
eq(hsCtx.holdSectMeeting('测试门'), true, 'H3 出贡献20开会成功');
eq(hsCtx.window.discipleState.contribution, 5, 'H4 贡献20→5');
eq(dataH.morale, 55, 'H5 士气+5');
eq(hsCtx.holdSectMeeting('测试门'), false, 'H6 同日再开不成');
eq(dataH.meetings.length, 1, 'H7 会议记录一条');

// ============ I. 俸禄吃 _sectRelation ============
var salCode = extractFn('sects/sects-system.js', 'collectSectResources');
ok(salCode.length > 0, 'I0 collectSectResources 可提取');
var iCtx = vm.createContext({ console: console, Math: Math, Number: Number, RANKS: [0, 1, 2, 3, 4, 5, 6, 7].map(function (i) { return { id: i }; }) });
iCtx.window = iCtx;
iCtx.RANKS = iCtx.RANKS;
iCtx.discipleState = null;
iCtx.showMessage = function () {};
iCtx.inventory = { currency: { spiritStones: 0 } };
iCtx.timeSystem = { gameTime: { currentDay: 7 } };
vm.runInContext(salCode, iCtx);
function salaryWith(relation) {
    iCtx.discipleState = { isInSect: true, sectId: 'X', rank: 7, contribution: 0, _lastSalaryDay: null, _sectRelation: relation };
    iCtx.inventory.currency.spiritStones = 0;
    iCtx.window.discipleState = iCtx.discipleState;
    iCtx.collectSectResources();
    return iCtx.inventory.currency.spiritStones;
}
eq(salaryWith(0), 10, 'I1 关系0=基础份例10');
eq(salaryWith(5), 11, 'I2 关系5=+10%→11');
eq(salaryWith(100), 12, 'I3 关系封顶+20%→12');
eq(salaryWith(-100), 8, 'I4 关系差封顶−20%→8');

// ============ J. tier3 每派有货 ============
var siSrc = loadScript('sects/sect-internal.js');
var artsStart = siSrc.indexOf('var SECT_SPECIFIC_ARTS');
var artsEnd = siSrc.indexOf('function getSectEquipment');
ok(artsStart >= 0 && artsEnd > artsStart, 'J0 功法数据段可定位');
var artsSlice = siSrc.slice(artsStart, artsEnd);
var jCtx = vm.createContext({ console: console, Math: Math, Object: Object, Array: Array, window: {} });
vm.runInContext(artsSlice + '; var __out = SECT_SPECIFIC_ARTS;', jCtx);
var sectNames = Object.keys(jCtx.__out);
ok(sectNames.length >= 30, 'J1 功法库门派数≥30（' + sectNames.length + '）');
var missingT3 = sectNames.filter(function (n) {
    return !jCtx.__out[n].some(function (a) { return a.tier === 3; });
});
eq(missingT3.length, 0, 'J2 核心阁空置归零 [' + missingT3.join(',') + ']');
var idSeen = {}, dupIds = [];
sectNames.forEach(function (n) {
    jCtx.__out[n].forEach(function (a) {
        if (idSeen[a.id]) dupIds.push(a.id);
        idSeen[a.id] = 1;
    });
});
eq(dupIds.length, 0, 'J3 新增功法 id 无重复');
var t3 = jCtx.__out['少林寺'].filter(function (a) { return a.tier === 3; })[0];
ok(t3 && t3.copyPrice === 1500 && Object.keys(t3.bonus).length > 0, 'J4 tier3 抄本价1500且有属性');

// ============ 汇总 ============
console.log('\n[sect-buildings] 断言 ' + assertions + '，失败 ' + failures.length);
if (failures.length) {
    failures.forEach(function (f) { console.log('  ✗ ' + f); });
    process.exit(1);
}
console.log('OK: v20.8 门派建筑 + 印钞机封堵全部通过');
