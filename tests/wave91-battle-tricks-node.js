/**
 * wave91-battle-tricks-node.js — 第九十一波 · 百宝袋的回合账 验收：
 *   A 暗器吃行动条（第九十二波口径）：掷暗器真伤敌人（45），扣 60 点条、时间轴随即推进——
 *     轮不到你动就掷不出，战外没目标不白耗；此前进攻家什既不挑时机也不耗动作（白嫖账）
 *   B 毒吃回合：撒毒设敌毒账（3 回合×15，敌人回合结算），同样吃本回合；战外没目标不撒
 *   C 控制符吃回合：定身/冰封/沉默/隐身/乾坤——全是「趁隙摸家什」的动作，同一本经济
 *   D 护体符不吃回合：增益/护体是战前功课，用了回合照旧在手
 *   E 快手位：战斗栏摆出暗器/毒快捷钮（app.js 侧哨兵）；医疗/逃跑的回合经济原样
 *   F 哨兵：九十波骑乘参战原样、新段零人工计数器、新话术零中英混排
 *
 * 运行：node tests/wave91-battle-tricks-node.js
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
function eq(a, b, msg) { assert(a === b, msg + '（实际=' + JSON.stringify(a) + ' 期望=' + JSON.stringify(b) + '）'); }
function load(rel) {
    vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel });
}
function src(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ==================== 测试桩（多人战同款；setTimeout 不执行回调——回合停在敌方门口好验账） ====================
global.window = global;
var els = {};
function fakeEl(tag) {
    var el = {
        tag: tag || '', children: [], style: {}, parentNode: null,
        setAttribute: function () {}, getAttribute: function () { return null; },
        appendChild: function (c) { this.children.push(c); return c; },
        removeChild: function () {}, addEventListener: function () {}, removeEventListener: function () {},
        closest: function () { return null; }, scrollIntoView: function () {},
        classList: { add: function () {}, remove: function () {}, toggle: function () {}, contains: function () { return false; } },
        _html: '', textContent: '', options: []
    };
    Object.defineProperty(el, 'innerHTML', {
        get: function () { return this._html; },
        set: function (v) { this._html = String(v); },
        configurable: true
    });
    return el;
}
global.document = {
    readyState: 'complete',
    createElementNS: function (ns, tag) { return fakeEl(tag); },
    createElement: function (tag) { return fakeEl(tag); },
    getElementById: function (id) { if (!els[id]) els[id] = fakeEl(); return els[id]; },
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    addEventListener: function () {},
    body: { appendChild: function () {} }
};
var store = {};
global.localStorage = {
    getItem: function (k) { return store[k] !== undefined ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; }
};
var msgs = [];
global.showMessage = function (m, t) { msgs.push({ m: String(m), t: t }); };
global.updateCharacterStatus = function () {};
global.updateCurrencyUI = function () {};
global.updateInventoryUI = function () {};
global.updateBattleUI = function () {};
global.getEffectiveMax = function () { return 100; };
global.itemById = {};
global.EventBus = { emit: function () {}, on: function () {} };
global.getCombatBonuses = function () { return {}; };
global.getBondBonuses = function () { return {}; };
global.getPlayerWeaponSkill = function () { return 0; };
global.resolveWeaponDamageType = function () { return 'slash'; };
global.currentEquipment = {};
global.partySystem = null;
global.getCurrentCharData = function () { return global.currentCharData; };
global.currentCharData = { health: 100, energy: 100, qi: 100, maxQi: 100, level: 10, realm: '金丹', attrs: {} };
global.timeSystem = {
    gameTime: { totalMinutes: 0 },
    advanceTime: function (m) { this.gameTime.totalMinutes += m; },
    onNewDaySubscribe: function () {}
};
global.setTimeout = function () { return 0; };   // 不执行回调：敌方回合停在门口，账好验

load('js/physiology-config.js');
load('js/battle-injuries.js');
load('js/battle.js');
load('js/gameplay/talisman-system.js');

var Entity = global.Entity, Battle = global.Battle;
var TAL = global.TalismanSystem;

function mkPlayer() {
    return new Entity({
        name: '玩家', level: 10,
        attrs: { strength: 30, dexterity: 20, intelligence: 20, willpower: 20, constitution: 30, meridian: 30 },
        skills: { '内功': 40 }, loot: {}, physiologyType: 'humanoid'
    }, 'player');
}
function mkEnemy(name, level) {
    return new Entity({
        name: name || '强敌', level: level || 12,
        attrs: { strength: 35, dexterity: 20, intelligence: 15, willpower: 15, constitution: 35, meridian: 20 },
        skills: { '内功': 35 }, loot: { exp: 10, copper: 5 }, physiologyType: 'humanoid'
    }, 'enemy');
}
var HIDDEN = { name: '暗器', effect: { attack_damage: 45 } };
var POISON = { name: '毒药', effect: { poison_enemy: 3 } };
var STUN = { name: '定身符', effect: { stun: 1 } };
var GUARD = { name: '护身符·大', effect: { defense_boost: 15, duration: 3 } };
function newBattle() {
    TAL.reset();
    msgs.length = 0;
    var b = new Battle(mkPlayer(), mkEnemy());
    global.currentBattle = b;
    return b;
}
function chestOf(e) { return e.durabilities.chest; }

// ==================== A · 暗器吃回合 ====================
console.log('\n[A] 暗器吃回合（掷得出伤，也掷得出这一个回合）');
var bA = newBattle();
var chestBefore = chestOf(bA.enemy);
eq(bA.isPlayerTurn, true, 'A0 开局轮回到自己');
eq(TAL.apply(HIDDEN), true, 'A1 暗器掷得出去');
assert(chestOf(bA.enemy) < chestBefore, 'A2 敌人胸口真挨了这一下（直伤落账）');
// 第九十二波·行动条口径：掷暗器扣 60 点条，时间轴随即推进——敌主攒满条动了一次（回合边界翻篇）
eq(bA.turn, 1, 'A3 掷完时间轴真走了（敌主行动过一次＝回合翻篇，不再是白嫖动作）');
eq(bA.isPlayerTurn, true, 'A4 推进到你条满为止又停回你手上（行动条的轮流）');
assert(bA.log.some(function (l) { return l.msg.indexOf('行囊') >= 0; }), 'A5 战报写明：摸家什用掉了这一回合');
// 条没攒满（轮不到你动）时摸不出家什
bA.isPlayerTurn = false;
var appliedAgain = TAL.apply(HIDDEN);
bA.isPlayerTurn = true;
eq(appliedAgain, false, 'A6 轮不到你动——腾不出手翻行囊（apply 拒收，物品不白耗）');
assert(msgs.some(function (m) { return m.m.indexOf('腾不出手') >= 0; }), 'A7 拒得说人话');
// 战外没目标
global.currentBattle = null;
TAL.reset();
eq(TAL.apply(HIDDEN), false, 'A8 战外掷暗器——没有目标可掷（家什不白耗）');

// ==================== B · 毒吃回合 ====================
console.log('\n[B] 毒吃回合（撒出去的是毒粉，花掉的是这一回合）');
var bB = newBattle();
eq(TAL.apply(POISON), true, 'B1 毒撒得出去');
var st = TAL.debugState();
assert(st.enemyPoison && st.enemyPoison.dmg === 15 && st.enemyPoison.turns === 2, 'B2 敌毒账立起（3 回合×15；撒完时间轴推进，敌主行动时毒已发作一回 3→2）');
eq(bB.turn, 1, 'B3 撒毒同样推进时间轴（回合边界翻篇）');
// 敌人回合结算毒伤（tick 在 enemyTurn 里——真伤验一遍）
var chestP = chestOf(bB.enemy);
var pd = TAL.tickEnemyPoison(bB.enemy);
eq(pd, 15, 'B4 毒发一次 15 点');
assert(chestOf(bB.enemy) < chestP, 'B5 毒伤真落在敌人身上');
// 战外没目标
global.currentBattle = null;
TAL.reset();
eq(TAL.apply(POISON), false, 'B6 战外没目标可毒——好毒不白撒');

// ==================== C · 控制符吃回合 ====================
console.log('\n[C] 控制符吃回合（定身冰封沉默隐身乾坤——全是趁隙摸家什的动作）');
var bC = newBattle();
eq(TAL.apply(STUN), true, 'C1 定身符掷得出');
// 时间轴推进中敌主攒满条——被钉住原地跳过（skip 账在敌主行动边界消耗）
assert(bC.log.some(function (l) { return l.msg.indexOf('钉在原地') >= 0; }), 'C2 敌人真被钉住了一次（行动条满也动不了）');
eq(TAL.debugState().enemySkipTurns.length, 0, 'C3 定身账已消耗（skip 不是摆设）');
// 轮不到你动时：拒
bC.isPlayerTurn = false;
eq(TAL.apply(STUN), false, 'C4 轮不到你动就掷不出第二张（时机闸对所有进攻家什一视同仁）');
bC.isPlayerTurn = true;
// 战外
global.currentBattle = null;
TAL.reset();
eq(TAL.apply(STUN), false, 'C5 战外控制符无处施展');

// ==================== D · 护体符不吃回合 ====================
console.log('\n[D] 护体符是战前功课（增益不吃回合——回合经济只管进攻家什）');
var bD = newBattle();
eq(TAL.apply(GUARD), true, 'D1 护身符拍得开');
eq(bD.isPlayerTurn, true, 'D2 增益符不吃回合（战前拍符战前生效，回合照旧在手）');
assert(TAL.debugState().combatBonuses.defense > 0, 'D3 防御增益落账');
// 战外也能拍增益（赶路前做功课）
global.currentBattle = null;
TAL.reset();
eq(TAL.apply(GUARD), true, 'D4 战外拍增益符照旧（不是进攻家什，不挑时机）');

// ==================== E · 快手位与老账 ====================
console.log('\n[E] 快手位与老账（家什摆上战斗栏；医疗/逃跑的回合经济原样）');
var appSrc = src('js/app.js');
assert(appSrc.indexOf("battleUseQuickItem(\\'special_hidden_weapon\\')") >= 0 && appSrc.indexOf("battleUseQuickItem(\\'special_poison\\')") >= 0, 'E1 战斗栏摆出暗器/毒快手钮');
assert(appSrc.indexOf('🗡️ 暗器×') >= 0 && appSrc.indexOf('☠️ 毒×') >= 0, 'E2 快手钮带家什数（有几件摆几件）');
assert(appSrc.indexOf('canUseBattleItem') >= 0 && appSrc.indexOf('腾不出手翻行囊') >= 0, 'E3 快手口也认时机闸（不是自己回合如实回话）');
assert(appSrc.indexOf('window.useItem(slot.uid)') >= 0, 'E4 快手钮走背包真使用口（消耗/管线全归一，不另起炉灶）');
assert(appSrc.indexOf('spendActionCost(player, 100)') >= 0, 'E5 医疗动作吃行动条（100 点的大动作）');
var fleeSeg = appSrc.slice(appSrc.indexOf('function battleFlee'), appSrc.indexOf('function battleMedicalAction'));
assert(fleeSeg.indexOf('spendActionCost(currentBattle.player, 100)') >= 0 && fleeSeg.indexOf('_advanceTimeline') >= 0, 'E6 逃跑失败吃满条（100 点，时间轴接着走）');
var bSrc = src('js/battle.js');
assert(bSrc.indexOf('canUseBattleItem()') >= 0 && bSrc.indexOf('playerItemTurn(label, cost)') >= 0, 'E7 时机闸与扣条口都在战斗引擎里（符箓系统只管效果，行动账归引擎）');
assert(bSrc.indexOf('tickEnemyPoison') >= 0, 'E8 毒发结算在敌人回合开头（老账原样）');

// ==================== F · 哨兵 ====================
console.log('\n[F] 哨兵');
assert(bSrc.indexOf('_mounted') >= 0 && bSrc.indexOf('getMountCombatData') >= 0, 'F1 九十波骑乘参战原样');
var itemSeg = bSrc.slice(bSrc.indexOf('// 第九十一波·行囊动作也是动作'), bSrc.indexOf('// 第九十三波·卑鄙流仪两个引擎口'));
assert(itemSeg.indexOf('次数') < 0 && itemSeg.indexOf('每日') < 0, 'F2 回合经济不是计数器（约束来自回合本身）');
eq((itemSeg.match(/Math\.random/g) || []).length, 0, 'F3 掷家什零骰（直伤是定数，毒是定数）');
var talSrc = src('js/gameplay/talisman-system.js');
assert(talSrc.indexOf('第九十一波 · 行囊动作也是动作') >= 0 && talSrc.indexOf('playerItemTurn') >= 0, 'F4 符箓管线接上回合账');
var leak = null;
[itemSeg, talSrc.slice(talSrc.indexOf('// ===== 第九十一波'), talSrc.indexOf('// ===== v21.9 攻击符')),
 appSrc.slice(appSrc.indexOf('// 第九十一波·家什快手位'), appSrc.indexOf('function battleFlee'))].forEach(function (txt) {
    (txt.match(/'[^']+'/g) || []).forEach(function (s) {
        var v = s.slice(1, -1);
        if (/[+);({\[,?<>]/.test(v)) return;
        if (/^[a-z0-9_]+(?:[-_:. ][a-z0-9_]+)*$/i.test(v)) return;
        if (/^[A-Za-z0-9_\-:.\/# ]+$/.test(v)) return;
        if (/[A-Za-z]/.test(v) && /[一-龥]/.test(v)) leak = leak || s;
    });
});
eq(leak, null, 'F5 新话术零中英混排（漏: ' + leak + '）');
assert(src('tests/run-all.sh').indexOf('wave91-battle-tricks-node.js') >= 0, 'F6 本套已挂全量回归');
delete global.currentBattle;

console.log('\n========== 第九十一波 · 百宝袋的回合账 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
