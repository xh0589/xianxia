/**
 * v20.48-deadlinks-node.js — 断线通电验收：
 * 本批把「写好了却没通电」的一批断线接上——
 *   ① 功法掌握通电：38 部秘籍的 effect 对象 + 53 门功法的 effect 字符串，此前全库零消费，学到仙品毫无变化；
 *   ② 境界质变补电：REALM_UNIQUE_EFFECTS 十二境里只有 attack/defense/speed 三键有人读，
 *      block/dodge/penetrate/crit/cultivation/herb/teleport_cost/qi 全是摆设；
 *   ③ 门派征讨必败修复：power 是「巨擘/中等」文字档位，旧码当数字乘 → NaN → 必败，且胜负不留外交痕迹；
 *   ④ 道侣族谱断线：dao-bridge 误拼 NPCLineage（实为 NpcLineage）→ 结契永远登不进族谱；
 *   ⑤ 消防司从纯台词死按钮做实成真业务。
 *
 * 运行：node tests/v20.48-deadlinks-node.js
 */
'use strict';

var fs = require('fs');
var vm = require('vm');
var path = require('path');
var ROOT = path.resolve(__dirname, '..');

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) passed++;
    else { failed++; console.error('[FAIL] ' + msg); }
}
function load(rel) {
    vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel });
}

global.window = global;
global.document = {
    getElementById: function () { return null; },
    querySelectorAll: function () { return []; },
    addEventListener: function () {},
    removeEventListener: function () {}
};
global.localStorage = { getItem: function () { return null; }, setItem: function () {} };
global.alert = function () {};
var messages = [];
global.showMessage = function (m, t) { messages.push({ msg: m, type: t }); };
global.mapData = { 中州:{}, 东荒:{}, 南疆:{}, 西漠:{}, 北冥:{}, 蜀地:{}, 东南海域:{} };

// ============ A 功法掌握通电 ============
load('js/core/knowledge-system.js');
load('js/cultivation/cultivation.js');
load('js/cultivation/art-effects.js');
load('js/items-extended/06-arts.js');

assert(!!global.ArtEffects, 'A1 ArtEffects 汇总器已挂载');
assert(typeof global.ArtEffects.describe === 'function', 'A2 面板口径 describe 已备好');

var s0 = ArtEffects.summarize(true);
assert(s0.learned.length === 0, 'A3 未学功法时加成为空（不白送）');

KnowledgeSystem.unlock('art_nine_yang', 'learned');
var s1 = ArtEffects.summarize(true);
assert(s1.learned.length === 1, 'A4 学会九阳神功后计入掌握');
var ab = ArtEffects.attrBonus();
assert(ab.strength === 3 && ab.constitution === 3, 'A5 all_attr_boost 30 按÷10折每维+3（属性底蕴通电）');
assert(ArtEffects.elemMap().fire === 50, 'A6 fire_damage_boost 50 通电（元素伤百分点）');
assert(ArtEffects.describe().indexOf('全属性+3') >= 0, 'A7 面板如实汇报全属性+3');

// 同键取最高一门（专精）：再学混沌诀 all_attr 60 → 每维 6，不是 3+6=9
KnowledgeSystem.unlock('art_chaos', 'learned');
assert(ArtEffects.attrBonus().strength === 6, 'A8 同键取最高：混沌诀60÷10=6 取代九阳的3，不叠加');
assert(ArtEffects.describe().indexOf('全属性+6') >= 0, 'A9 面板随最高一门刷新');

// 加值层
KnowledgeSystem.unlock('art_taiji', 'learned');
assert(ArtEffects.combatBonus().defense === 20, 'A10 defense_boost 20 进战斗加成');
KnowledgeSystem.unlock('art_dugu_sword', 'learned');
assert(ArtEffects.combatBonus().counter === 50, 'A11 独孤九剑 counter 50 进战斗加成');
KnowledgeSystem.unlock('art_breathing', 'learned');
assert(ArtEffects.regenPct().qi === 10, 'A12 吐纳术 qi_regen_boost 10 → 真气恢复+10%');

// 真气上限：点数 + 字符串百分比
load('js/equipment.js');
KnowledgeSystem.unlock('art_qi_condense', 'learned');
assert(ArtEffects.maxQiBonus().flat === 10, 'A13 凝气诀 max_qi_boost 10 → 点数');
global.currentCharData = { realm: '炼气', maxQi: 100, maxHealth: 100, health: 50, qi: 50 };
assert(global.getEffectiveMax('maxQi') === 110, 'A14 有效真气上限 100+10=110（上限判断通电）');
// skillPages 字符串来源（烈焰刀 刀法伤害+25%）：同组秘籍层仅 10，同制取最高 25
KnowledgeSystem.unlock('skill_09', 'learned');
assert(ArtEffects.summarize(true).pct.dao === 25, 'A15 skillPages 字符串「刀法伤害+25%」被解析（此前只有3种字样被认）');
// 同门双层归一：混元功秘籍(+25点)与 skill_06(+20%) 是同一门——只出点数一力，不双算
KnowledgeSystem.unlock('art_hun_yuan', 'learned');
assert(ArtEffects.maxQiBonus().flat === 25 && ArtEffects.maxQiBonus().pct === 0, 'A16 同门两层表述归一：点数优先、百分比吸收（防双算）');
assert(global.getEffectiveMax('maxQi') === 125, 'A17 混元功最终上限 100+25=125（只出一力）');
// 天雷引（雷系伤害+35%）
KnowledgeSystem.unlock('skill_16', 'learned');
assert(ArtEffects.elemMap().thunder === 35, 'A18 skillPages「雷系伤害+35%」解析通电');
// 武器乘算口径：剑法取最高（诛仙150 vs 独孤80）
KnowledgeSystem.unlock('art_zhu_xian_sword', 'learned');
assert(ArtEffects.weaponPct('sword') === 150, 'A19 剑攻取最高一门 150%（乘算口径）');
assert(ArtEffects.weaponPct('fist') === 0, 'A20 未学拳法时拳类乘算为0（不串味）');
assert(ArtEffects.summarize(true).learned.length >= 9, 'A21 掌握计数如实增长');

// ============ B 战斗接线 ============
var appSrc = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
var battleSrc = fs.readFileSync(path.join(ROOT, 'js/battle.js'), 'utf8');
assert(appSrc.indexOf('ArtEffects.weaponPct') >= 0, 'B1 buildPlayerBattleEntity 读取武器功法乘算');
assert(appSrc.indexOf('ArtEffects.hasLifesteal()') >= 0, 'B2 血饮刀法 lifesteal 能力注入战斗实体');
assert(appSrc.indexOf('playerEntity._artElem = _artElem') >= 0, 'B3 元素伤表挂上战斗实体');
assert(battleSrc.indexOf('attacker._artElem') >= 0, 'B4 战斗结算读取功法元素伤表');
assert(battleSrc.indexOf("_evilFaction = true") >= 0, 'B5 邪道标透传给敌人实体');
assert(battleSrc.indexOf("this._evilFaction = data._evilFaction === true") >= 0, 'B6 Entity 构造器接收邪道标');
// getCombatBonuses 并集
load('js/inventory.js');
global.TalismanSystem = null;
var cbAll = getCombatBonuses({});
assert(cbAll.defense === 20 && cbAll.counter === 50, 'B7 getCombatBonuses 已并入功法加值（防20/反50）');

// ============ C 境界质变补电 ============
assert(typeof window.getRealmBonusPct === 'function', 'C1 getRealmBonusPct 已导出');
assert(getRealmBonusPct('金丹', 'block') === 15, 'C2 金丹「金丹护体」格挡+15% 通电');
assert(getRealmBonusPct('元婴', 'dodge') === 10, 'C3 元婴 dodge 1.1 乘数折成 +10%');
assert(getRealmBonusPct('大乘', 'dodge') === 20, 'C4 大乘 dodge 20 百分点原样');
assert(getRealmBonusPct('炼气', 'gathering') === 20, 'C5 炼气 gathering 1.2 折 +20%');
assert(getRealmBonusPct('化神', 'penetrate') === 15, 'C6 化神穿透+15% 通电');
// getCombatBonuses 并入境界百分点（渡劫 block25/penetrate25；金仙 crit35）
global.currentCharData.realm = '渡劫';
var cbRealm = getCombatBonuses({});
assert(cbRealm.block === 25 && cbRealm.penetrate === 25, 'C7 渡劫格挡+25/穿透+25 进战斗加成（此前无人读）');
global.currentCharData.realm = '金仙';
var cbXian = getCombatBonuses({});
assert(cbXian.crit === 35 && cbXian.dodge >= 40, 'C7b 金仙暴击+35/闪避+40 进战斗加成');
global.currentCharData.realm = '炼气';
// 其余键接线（静态哨兵：读取点在场）
assert(appSrc.indexOf("getRealmBonus(_rzName, 'cultivation')") >= 0, 'C8 大乘/金仙修炼乘数接入打坐');
assert(appSrc.indexOf("getRealmBonus(_ghRealm, 'herb')") >= 0, 'C9 炼气采集加成接入采药');
assert(appSrc.indexOf("getRealmBonus(_tpRealm, 'teleport_cost')") >= 0, 'C10 炼虚传送减半接入传送阵');

// ============ D 门派征讨修复 ============
var sectsSysSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sects-system.js'), 'utf8');
var stateRegSrc = fs.readFileSync(path.join(ROOT, 'js/core/state-registry.js'), 'utf8');
var warWindow = {
    console: console, Math: Math, JSON: JSON, Object: Object, Array: Array, Number: Number,
    alert: function () {}, showMessage: function (m, t) { warWindow._lastMsg = { m: m, t: t }; },
    document: { querySelector: function () { return null; }, querySelectorAll: function () { return []; }, getElementById: function () { return null; } },
    timeSystem: { gameTime: { currentDay: 7, totalMinutes: 0 }, advanceTime: function () {}, onNewDaySubscribe: function () {} },
    inventory: { currency: { spiritStones: 0 } },
    currentCharData: { spiritStones: 0, realm: '炼气' },
    mapData: { 中州: {} },
    sectsData: null,
    StateRegistry: null,
    SECT_DIPLOMACY_STATE: {
        '少林寺': {
            '逍遥派': { relation: 40, trade: 0, conflicts: 0, lastEvent: 0, treaties: [] },
            '修罗宫': { relation: -50, trade: 0, conflicts: 0, lastEvent: 0, treaties: [] }
        }
    },
    saveSectDiplomacy: function () {},
    changeFactionReputation: function (id, n) { warWindow._factionLog.push([id, n]); },
    _factionLog: []
};
warWindow.window = warWindow;
warWindow.global = warWindow;
warWindow.XianXia = {};
var warCtx = vm.createContext(warWindow);
vm.runInContext(stateRegSrc, warCtx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/sects/sects.js'), 'utf8'), warCtx);
vm.runInContext(sectsSysSrc, warCtx);

assert(typeof warWindow.sectPowerValue === 'function', 'D1 档位折值函数在册');
assert(warWindow.sectPowerValue({ power: '巨擘' }) === 100 && warWindow.sectPowerValue({ power: '极小' }) === 12, 'D2 巨擘=100 / 极小=12');
assert(warWindow.sectPowerValue({ power: '未知' }) === 40 && warWindow.sectPowerValue({}) === 40, 'D3 未知档兜底 40（不再 NaN）');

warWindow.discipleState = { isInSect: true, sectId: '少林寺' };
warWindow.sectResourceState = { morale: 80, defense: 60, memberCount: 80, lastWarTime: 0 };

var ownRandom = Math.random;
Math.random = function () { return 0.0; }; // 必胜
var win = warWindow.initiateSectWar('逍遥派'); // 极小：ourPower=320 vs theirPower=120 → 72% 胜率
assert(win === true, 'D4 征讨极小门派可以打赢（NaN 必败修复）');
assert(warWindow.inventory.currency.spiritStones > 0, 'D5 胜利缴获入账');
var relCell = warWindow.SECT_DIPLOMACY_STATE['少林寺']['逍遥派'];
assert(relCell.relation === 5 && relCell.conflicts === 1, 'D6 胜后两门关系恶化落账（40-35），冲突计数+1（外交不再只渲染）');
assert(warWindow._factionLog.some(function (f) { return f[0] === 'rogue_cultivators'; }), 'D7 讨伐中立门派声望结算走 rogue_cultivators（不再硬编码魔道）');

warWindow._factionLog.length = 0;
Math.random = function () { return 0.99; }; // 必败
warWindow.initiateSectWar('修罗宫');
assert(warWindow.SECT_DIPLOMACY_STATE['少林寺']['修罗宫'].relation === -70, 'D8 战败后关系-20落账（-50-20）');
Math.random = ownRandom;

assert(warWindow.initiateSectWar('少林寺') === false, 'D9 本门不打本门');

// ============ E 道侣族谱断线 ============
var daoSrc = fs.readFileSync(path.join(ROOT, 'js/core/dao-bridge.js'), 'utf8');
assert(daoSrc.indexOf('global.NpcLineage || global.NPCLineage') >= 0, 'E1 dao-bridge 兼容 NpcLineage 正名拼写');
assert(daoSrc.indexOf('if (global.NPCLineage &&') < 0, 'E2 旧误拼判定（恒 undefined）已拆除');
assert(daoSrc.indexOf('_lineage.recordPlayerDaoCompanion') >= 0, 'E3 结契落笔走族谱真名');
var linSrc = fs.readFileSync(path.join(ROOT, 'js/npcs/npc-lineage.js'), 'utf8');
assert(linSrc.indexOf('global.NpcLineage = api') >= 0, 'E4 族谱导出名确为 NpcLineage（断线根因在案）');

// ============ F 消防司做实 ============
assert(appSrc.indexOf('window._fireDeptAct') >= 0, 'F1 消防司不再是纯台词死按钮（真业务动作在册）');
assert(appSrc.indexOf("source: 'fire_duty'") >= 0 && appSrc.indexOf("source: 'fire_fight'") >= 0, 'F2 当差/扑救走统一结算（RewardService 认账）');
assert(appSrc.indexOf("没真气压不住水龙") >= 0, 'F3 真气不济如实拒绝（成本世界真实）');
assert(appSrc.indexOf("window.RewardService.apply({ karma: 1, rep: 2") >= 0, 'F4 当差功德+1声望+2走统一结算');

// ============ G 挂载与旧账 ============
var html = fs.readFileSync(path.join(ROOT, '仙侠.html'), 'utf8');
assert(html.indexOf('js/cultivation/art-effects.js') >= 0, 'G1 art-effects 已挂载加载链');
assert(html.indexOf('js/cultivation/art-effects.js') > html.indexOf('js/cultivation/cultivation.js'), 'G2 加载顺序在 cultivation.js 之后（依赖 getRealmBonus）');
assert(fs.readFileSync(path.join(ROOT, 'js/cultivation/cultivation.js'), 'utf8').indexOf('window.getRealmBonusPct = getRealmBonusPct') >= 0, 'G3 getRealmBonusPct 已导出');
assert(fs.readFileSync(path.join(ROOT, 'js/time-system.js'), 'utf8').indexOf('ArtEffects.regenPct()') >= 0, 'G4 自然恢复读取功法恢复加成');
assert(fs.readFileSync(path.join(ROOT, 'js/inventory.js'), 'utf8').indexOf('ArtEffects.attrBonus()') >= 0, 'G5 最终属性并入功法六维底蕴');

console.log('\n========================================');
console.log('v20.48 断线通电: ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
