/**
 * v20.86-sect-scenarios-node.js — 门派设施沉浸层门禁
 *
 * 覆盖：
 *   A 注册面：基础 8 座（掌门大殿除外）+ 全部 36 派专属设施都有剧本；五处手写戏点名
 *   B 结构：startNode/next 可达、facility 钩子指向真设施、roll 必有输赢两分支、奖励物品在册
 *   C 路由与结算：「使用」入戏不落账；剧本「例行」经钩子回原管道（真气/时间/次数照扣）；
 *     quiet 失败原样交回（份例拒绝/真气不足）；贡献前置门；掌门大殿不入戏、反应链原样
 *   D 膳堂：第 8 座基础设施在册，一日两膳 + 拒绝文案
 *   E 接线：HTML 加载序、引擎钩子与 reasonMap、EXTRAS 导出、按钮文案助手
 *   F 文案纪律：玩家可见字符串无 3 连英文字母漏翻
 *
 * 运行：node tests/v20.86-sect-scenarios-node.js
 */
'use strict';

var path = require('path');
var fs = require('fs');
var vm = require('vm');

var ROOT = path.resolve(__dirname, '..');
function loadScript(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

var passed = 0, failed = 0;
function ok(cond, label) {
    if (cond) passed++;
    else { failed++; console.log('[FAIL] ' + label); }
}

// ============ 世界桩 ============
var W = {
    console: { log: function () {}, warn: function () {}, error: function () {} },
    setTimeout: function (fn) { try { fn(); } catch (e) {} return 0; },
    localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
    document: {
        createElement: function () { return { style: {}, classList: { add: function () {}, remove: function () {}, contains: function () { return false; } }, dataset: {}, innerHTML: '' }; },
        getElementById: function () { return null; },
        querySelector: function () { return null; },
        addEventListener: function () {},
        body: { appendChild: function () {} }
    },
    alert: function () {}
};
W.window = W;

var state = { msgs: [], logs: [], minutes: 0, panelOpened: [] };
W.timeSystem = {
    gameTime: { totalMinutes: 8 * 60, currentDay: 7 },
    advanceTime: function (m) { state.minutes += m; this.gameTime.totalMinutes += m; }
};
W.advanceTime = function (m) { state.minutes += m; };
W.gameLog = { add: function (t) { state.logs.push(String(t)); } };
W.showMessage = function (t) { state.msgs.push(String(t)); };
W.getRealmTier = function () { return 3; };
W.currentWeather = { id: 'rainy', name: '雨天', icon: '🌧️' };

var cd = {
    name: '测试子', realm: '筑基', layer: 3,
    health: 100, maxHealth: 100, qi: 100, maxQi: 200, energy: 100, maxEnergy: 100,
    tempering: 0, karma: 0, notoriety: 0, fame: 0,
    combatSkills: { '内功': 10, '拳掌': 10, '剑法': 10, '刀法': 10, '射术': 10 }
};
W.currentCharData = cd;
W.discipleState = { isInSect: true, sectId: '少林寺', rank: 5, rankName: '外门弟子', contribution: 50, points: 0 };
W.inventory = { currency: { spiritStones: 100, copper: 500 }, slots: [] };
W.itemById = { spirit_grass: { id: 'spirit_grass', name: '灵草' }, iron_ore: { id: 'iron_ore', name: '铁矿石' } };
W.addItem = function (id, n) { W.inventory.slots.push({ templateId: id, count: n || 1 }); return true; };
W.EventBus = { emit: function () {}, on: function () {} };
W.StateRegistry = { register: function () {} };
W.EconomyTransaction = {
    run: function (fn) { return fn(); },
    debit: function (k, n) { W.inventory.currency[k] = (W.inventory.currency[k] || 0) - n; return W.inventory.currency[k] >= 0; },
    credit: function (k, n) { W.inventory.currency[k] = (W.inventory.currency[k] || 0) + n; return true; },
    addSnapshot: function () { return true; },
    removeByTemplate: function () { return true; }
};
W.updateCurrencyUI = function () {};
W.updateCharacterStatus = function () {};
W.restoreBodyDurability = function () {};
W.applyBuff = function () {};
W.playerPushDeed = function () {};
W.openFacilityScenario = function (fid) { state.panelOpened.push(fid); };

// ============ 载入被测脚本 ============
vm.createContext(W);
function load(rel, wrap) {
    var src = loadScript(rel);
    if (wrap) src = '(function(){\n' + src + '\n})();';
    vm.runInContext(src, W, { filename: rel });
}
load('js/economy/economy-transaction.js');
load('js/core/reward-service.js');
load('js/core/scenario-engine.js');
load('js/sects/sect-facilities.js');
load('js/sects/sect-scenarios.js', true);

// 引擎加载时会用自己的实现覆盖桩——路由断言要验的是 useFacility 有没有把玩家交给剧本面板，
// 这里重新挂捕获桩（浏览器里真面板由引擎自己弹）
W.openFacilityScenario = function (fid) { state.panelOpened.push(fid); };

var SE = W.scenarioEngine;
var baseFacs = W.facilities || [];
var extras = W.SECT_FACILITY_EXTRAS || {};

// ============ A 注册面 ============
['sect_training_ground', 'sect_cave', 'sect_medical', 'sect_library', 'sect_armory', 'sect_chat', 'sect_canteen'].forEach(function (fid) {
    ok(SE.facilities[fid] && (SE.facilities[fid].scenarios || []).length >= 1, 'A 基础设施工厂注册剧本：' + fid);
});
ok(!SE.facilities['sect_leader'], 'A 掌门大殿不注册剧本（守卫反应链本身就是戏）');

var extraIds = [];
Object.keys(extras).forEach(function (s) { (extras[s] || []).forEach(function (f) { extraIds.push(f.id); }); });
var missExtra = extraIds.filter(function (id) { return !SE.facilities[id] || !(SE.facilities[id].scenarios || []).length; });
ok(extraIds.length >= 30 && missExtra.length === 0, 'A 全部 ' + extraIds.length + ' 座门派专属设施都有剧本' + (missExtra.length ? '（缺 ' + missExtra.join(',') + '）' : ''));

ok((SE.facilities['fx_xsm_xuechi'].scenarios[0] || {}).name === '血池淬身', 'A 血池手写戏「血池淬身」');
ok((SE.facilities['fx_sl_damo'].scenarios[0] || {}).name === '面壁', 'A 达摩洞手写戏「面壁」');
ok((SE.facilities['fx_zj_dulu'].scenarios[0] || {}).name === '炉边看火', 'A 锻炉手写戏「炉边看火」');
ok((SE.facilities['fx_yw_baicao'].scenarios[0] || {}).name === '园中侍草', 'A 百草园手写戏「园中侍草」');
ok((SE.facilities['fx_gb_xiaoxi'].scenarios[0] || {}).name === '听风', 'A 消息网手写戏「听风」');

// ============ B 结构 ============
var allFids = {};
baseFacs.forEach(function (f) { allFids[f.id] = 1; });
extraIds.forEach(function (id) { allFids[id] = 1; });

var badNext = [], badHook = [], badRoll = [], nodeCount = 0, choiceCount = 0;
Object.keys(SE.facilities).forEach(function (fid) {
    if (!allFids[fid]) return;
    (SE.facilities[fid].scenarios || []).forEach(function (sc) {
        if (!sc.nodes[sc.startNode]) badNext.push(fid + '/' + sc.id + ' startNode 悬空');
        Object.keys(sc.nodes).forEach(function (nk) {
            nodeCount++;
            (sc.nodes[nk].choices || []).forEach(function (c) {
                choiceCount++;
                if (c.next && !sc.nodes[c.next]) badNext.push(fid + '/' + sc.id + '/' + nk + ' next→' + c.next);
                var eff = c.effects || {};
                if (eff.facility && !allFids[eff.facility.id]) badHook.push(fid + '/' + nk + ' facility→' + eff.facility.id);
                if (eff.roll && (!eff.roll.win || !eff.roll.lose || !Object.keys(eff.roll.lose).length)) badRoll.push(fid + '/' + nk);
            });
        });
    });
});
ok(badNext.length === 0, 'B startNode/next 全部可达（' + nodeCount + ' 节点 ' + choiceCount + ' 选项）' + (badNext.length ? '：' + badNext.join(';') : ''));
ok(badHook.length === 0, 'B facility 钩子全部指向在册设施' + (badHook.length ? '：' + badHook.join(';') : ''));
ok(badRoll.length === 0, 'B 所有 roll 都有输赢两分支（无必胜印钞机）' + (badRoll.length ? '：' + badRoll.join(';') : ''));
ok(choiceCount >= 100, 'B 选项总量成规模（实得 ' + choiceCount + '）');

// 奖励物品必须在物品库（静态扫描剧本源 + 桩库验证）
var scSrc = loadScript('js/sects/sect-scenarios.js');
var itemRefs = [];
var reItem = /itemId: '([a-z0-9_]+)'/g, mI;
while ((mI = reItem.exec(scSrc))) itemRefs.push(mI[1]);
var itemStack = ['js/items.js', 'js/items-extended/04-materials.js', 'js/items-extended/07-food.js']
    .map(function (f) { try { return loadScript(f); } catch (e) { return ''; } }).join('\n');
var missItem = itemRefs.filter(function (id) { return itemStack.indexOf("'" + id + "'") < 0 && itemStack.indexOf('"' + id + '"') < 0; });
ok(itemRefs.length > 0 && missItem.length === 0, 'B 剧本奖励物品全部在册' + (missItem.length ? '（查无 ' + missItem.join(',') + '）' : ''));

// ============ C 路由与结算 ============
// C1 「使用」入戏不落账
cd.qi = 100; state.panelOpened = [];
var routed = W.useFacility('sect_training_ground');
ok(routed === true && state.panelOpened[0] === 'sect_training_ground' && cd.qi === 100,
    'C 「使用」被路由进剧本面板，未直接落账');

// C2 剧本「例行」选项经钩子回原管道：真气-15、时间+90、结算原文进戏文日志
// 文案按天轮换：把游戏日拨到第 6 天，命中「演武场+天气」那条开场
W.timeSystem.gameTime.currentDay = 6;
W.facilityState.lastResetGameDay = 6;
var st = SE.start('sect_training_ground', 'tg_ground');
ok(st && !st.done && st.desc.indexOf('演武场') >= 0 && st.desc.indexOf('檐外雨声') >= 0, 'C 开场戏文含场地名且随晨昏天气成文（desc 为函数现算）');
var routineIdx = st.choices.findIndex(function (c) { return c.text.indexOf('例行动作') >= 0; });
state.logs = []; state.minutes = 0;
cd.qi = 100;
var after = SE.choose(routineIdx);
ok(cd.qi === 85, 'C 例行选项真扣真气 15（实得 ' + cd.qi + '）');
ok(state.minutes >= 90, 'C 例行选项真推进时间 90 分钟（实得 ' + state.minutes + '）');
ok(state.logs.join('\n').indexOf('真气') >= 0 || state.logs.join('\n').indexOf('内功') >= 0, 'C 设施结算原文记进戏文日志');
ok(cd.combatSkills['内功'] === 12, 'C 武艺提升照旧管道落地（内功 10→12）');
ok(after && after.done === true, 'C 例行选项走完即收戏');

// C3 quiet 失败原样交回：兵器库份例已领（兵器库=内门弟子 rank≤4，先把职位拨到位）
W.discipleState.rank = 4;
W.facilityState.lastResetGameDay = 6;
W.facilityState.dailyUsage['sect_armory'] = 1;
var q1 = W.useFacility('sect_armory', { fromScenario: true, quiet: true });
ok(q1 && q1.ok === false && String(q1.reason).indexOf('份例') >= 0, 'C quiet 模式失败交回叙事拒绝文案（' + (q1 && q1.reason) + '）');
st = SE.start('sect_armory', 'ar_raid');
var rIdx = st.choices.findIndex(function (c) { return c.text.indexOf('例行动作') >= 0; });
var err = SE.choose(rIdx);
ok(err && err.error && err.error.indexOf('份例') >= 0, 'C 剧本内例行被拒：整笔不成交，拒绝原文上屏');
W.facilityState.dailyUsage['sect_armory'] = 0;

// C4 真气不足：quiet 交回，剧本层不吞
cd.qi = 5;
var q2 = W.useFacility('sect_training_ground', { fromScenario: true, quiet: true });
ok(q2 && q2.ok === false && String(q2.reason).indexOf('真气不足') >= 0, 'C 真气不足 quiet 交回原因');
cd.qi = 100;

// C5 贡献前置门（_check 扩展）
var ck = SE._check({ contribution: 999 });
ok(ck.ok === false && ck.msg.indexOf('门派贡献') >= 0, 'C req.contribution 前置门生效');
W.discipleState.contribution = 50;
ok(SE._check({ contribution: 50 }).ok === true, 'C 贡献足量放行');

// C6 掌门大殿不入戏：直接走反应链结算
state.panelOpened = [];
W.discipleState.rank = 2; W.discipleState.contribution = 50;
var leaderRes = W.useFacility('sect_leader', { fromScenario: true, quiet: true });
ok(state.panelOpened.length === 0 && leaderRes && leaderRes.ok === true, 'C 掌门大殿绕过剧本直落结算');
ok(W.discipleState.contribution === 30, 'C 掌门大殿贡献礼 -20 照扣（实得 ' + W.discipleState.contribution + '）');
W.discipleState.rank = 5;

// C7 按钮文案助手
ok(W.sectFacilityActionLabel('sect_training_ground') === '进入', 'C 有戏的设施按钮文案「进入」');
ok(W.sectFacilityActionLabel('sect_leader') === '前往', 'C 掌门大殿按钮文案「前往」（v21.2 建筑口径：物品才用使用）');

// ============ D 膳堂 ============
var canteen = baseFacs.find(function (f) { return f.id === 'sect_canteen'; });
ok(!!canteen && canteen.dailyUses === 2, 'D 膳堂在案，一日两膳');
ok(baseFacs.length === 15, 'D 基础设施共 15 座（十二波补炼丹房锻造坊、十三波补戒律堂/灵田/浴池/客房/兽栏；实得 ' + baseFacs.length + '）');
var facSrc = loadScript('js/sects/sect-facilities.js');
ok(facSrc.indexOf('sect_canteen:') > 0 || facSrc.indexOf("sect_canteen: '") >= 0 || /sect_canteen: '/.test(facSrc) || facSrc.indexOf('灶上封了火') >= 0, 'D 膳堂份例拒绝文案入叙事表');
W.facilityState.dailyUsage['sect_canteen'] = 2;
var q3 = W.useFacility('sect_canteen', { fromScenario: true, quiet: true });
ok(q3 && q3.ok === false && String(q3.reason).indexOf('灶上封了火') >= 0, 'D 膳堂第三顿被灶火拦下');
W.facilityState.dailyUsage['sect_canteen'] = 0;

// ============ E 接线 ============
var html = loadScript('仙侠.html');
var iEngine = html.indexOf('js/core/scenario-engine.js');
var iFac = html.indexOf('js/sects/sect-facilities.js');
var iScen = html.indexOf('js/sects/sect-scenarios.js');
var iBatch3 = html.indexOf('facility-batch3.js');
ok(iScen > iBatch3 && iBatch3 > iEngine && iEngine > iFac && iFac > 0, 'E HTML 加载序：设施→引擎→城坊剧本→门派剧本');
var engSrc = loadScript('js/core/scenario-engine.js');
ok(engSrc.indexOf('eff.facility') >= 0 && engSrc.indexOf('fromScenario: true, quiet: true') >= 0, 'E 引擎 facility 结算钩子在位');
ok(engSrc.indexOf("facility: '设施那边行不通'") >= 0, 'E reasonMap 有 facility 词条');
ok(engSrc.indexOf('req.contribution') >= 0, 'E _check 支持贡献前置门');
ok(engSrc.indexOf('info.scenarios.length === 1') >= 0, 'E 单剧本设施免菜单直接开戏');
ok(facSrc.indexOf('window.SECT_FACILITY_EXTRAS') >= 0, 'E EXTRAS 清单导出供剧本层遍历');
ok(facSrc.indexOf('window.sectFacilityActionLabel') >= 0, 'E 按钮文案助手导出');
['js/sects/sect-visit.js', 'js/location-system.js'].forEach(function (f) {
    ok(loadScript(f).indexOf('sectFacilityActionLabel') >= 0, 'E ' + f + ' 渲染点接入按钮文案');
});

// ============ F 文案纪律 ============
var visible = [];
var reMsg = /msg: '([^']+)'/g, m2;
while ((m2 = reMsg.exec(scSrc))) visible.push(m2[1]);
var reTxt = /text: '([^']+)'/g;
while ((m2 = reTxt.exec(scSrc))) visible.push(m2[1]);
var reName = /name: '([^']+)'/g;
while ((m2 = reName.exec(scSrc))) visible.push(m2[1]);
var leaks = visible.filter(function (s) { return /[a-zA-Z]{3,}/.test(s); });
ok(visible.length >= 60 && leaks.length === 0, 'F 玩家可见文案无英文漏翻（' + visible.length + ' 条）' + (leaks.length ? '：' + leaks.slice(0, 3).join(' | ') : ''));

console.log('passed=' + passed + ' failed=' + failed);
process.exit(failed > 0 ? 1 : 0);
