// ==================== v22.3 恩怨链验收：宿敌寻仇接通 + 战败后续可见 ====================
// 玩家报告「被击败的后续没反应」。诊断：①宿敌链（v20.0）只有决战与结算，「定期寻仇」全库无调用者，
// 且玩家与人动手从不记恨（攻击只记怕/压力）——仇恨源与触发器两头断；②战败后续（昏迷半日/被搜刮/获救）
// 的飘字在战斗结算面板还开着时就弹完了，点「继续」前早已消散——体感等于没发生。
// 修复：跨日调度扫高仇恨名单低概率拦路寻仇（同人冷却5日）；切磋/遁走结仇入账；切磋败轻结算；
// 战败后续延迟到面板收起后上演；实体战同步 window.currentBattle。
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');

let passed = 0; const failures = [];
function ok(cond, msg) { if (cond) { passed++; } else { failures.push(msg); console.log('  ✗ ' + msg); } }
function eq(a, b, msg) { ok(a === b, msg + '（实得 ' + a + '，期望 ' + b + '）'); }
function read(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ============ A 源码接线 ============
{
    const rc = read('js/npcs/rivalry-chain.js');
    ok(rc.indexOf('function maybeRivalRevenge()') >= 0 && rc.indexOf('window.maybeRivalRevenge = maybeRivalRevenge;') >= 0,
        'A1 寻仇调度器存在且导出');
    ok(rc.indexOf('onNewDaySubscribe') >= 0, 'A2 寻仇挂上跨日结算（旧版无任何调度——仇恨堆满也没人上门）');
    ok(rc.indexOf('REVENGE_COOLDOWN_DAYS') >= 0 && rc.indexOf('xianxia_rival_chain_cd') >= 0, 'A3 同一宿敌冷却入账（不连环刷屏）');
    ok(rc.indexOf('window.currentBattle) return false') >= 0 && rc.indexOf('isInSoulState') >= 0, 'A4 战斗中/残魂态不被寻仇');

    const app = read('js/app.js');
    ok(app.indexOf('enemyEntity._linkedNpcId = currentInteractionEntity.npcId;') >= 0, 'A5 对手档案号随实体进场');
    ok(/currentBattle\._isSpar[\s\S]{0,200}changeHatred\(12\)/.test(app), 'A6 切磋赢了：对方不服记仇（+12）');
    ok(/!hasSpoils && typeof _lnpc\.recordPlayerAction === 'function'[\s\S]{0,200}recordPlayerAction\('attack', 'negative'\)/.test(app),
        'A7 真打没打死（遁走）：按老账记攻击（恨+15/好感-15/怕你）');
    ok(/_isSpar[\s\S]{0,400}return;/.test(app) && app.indexOf('切磋落败——点到为止') >= 0, 'A8 切磋败轻结算：不昏迷不被搜刮');
    ok(app.indexOf("currentBattle._isSpar = true;") >= 0 && app.indexOf('sparWithWanderer') >= 0, 'A9 切磋战挂旗');
    ok(app.indexOf('window._pendingDefeatRevival = currentBattle;') >= 0, 'A10 战败后续改为挂起（不再在结算面板底下白弹）');
    ok(/if \(window\._pendingDefeatRevival\) \{[\s\S]{0,400}handleDefeatRevival\(_pdb\)/.test(app), 'A11 面板收起后补演战败后续');
    ok(app.indexOf('function handleDefeatRevival(battleOverride)') >= 0 && app.indexOf('var battle = battleOverride || currentBattle;') >= 0,
        'A12 复活函数接受事后传入的战局（closeBattle 已清空 currentBattle）');
    ok(/currentBattle = battle;\s*\n\s*window\.currentBattle = battle;/.test(app), 'A13 实体战同步 window.currentBattle（场外系统认它）');
    // 第九十五波·NEW-47：closeBattle 收尾改为「先清战斗状态、再判空动 DOM」——
    // 此前裸取 battle-log 无守卫，面板万一不在会在 currentBattle=null 之前抛错，把陈旧战局永远留下。
    ok(/currentBattle = null;\s*\n\s*window\.currentBattle = null;[\s\S]{0,340}_bmLog = document\.getElementById\('battle-log'\);\s*\n\s*if \(_bmLog\) _bmLog\.innerHTML = '';/.test(app),
        'A14 关面板先清 window 引用再判空清日志（不再留陈旧战局，且面板缺失不抛错）');

    // 仇恨老账未动：攻击记恨的规则本来就在，只是从没有人触发过
    ok(read('js/npcs/npc-system.js').indexOf("if (action === 'attack') this.changeHatred(Math.abs(baseChange));") >= 0,
        'A15 攻击记恨的老规则原样保留');
}

// ============ B 运行时：跨日扫仇 → 拦路寻仇 ============
function makeWorld(opts) {
    opts = opts || {};
    const dayHooks = [];
    const sb = {
        console: { log() {}, warn() {}, error() {} },
        setTimeout: function (f) { if (opts.runTimers !== false) { try { f(); } catch (e) {} } return 0; },
        clearTimeout() {}, setInterval: () => 0, clearInterval: () => 0,
        JSON, Date, Object, Array, String, Number, Boolean, RegExp, Error, parseInt, parseFloat, isNaN, isFinite
    };
    sb.window = sb; sb.globalThis = sb;
    sb.__random = opts.random === undefined ? 0.1 : opts.random; // 强制命中 35% 寻仇概率
    sb.Math = Object.assign(Object.create(Math), { random: () => sb.__random });
    sb.localStorage = { _s: {}, getItem(k) { return Object.prototype.hasOwnProperty.call(this._s, k) ? this._s[k] : null; }, setItem(k, v) { this._s[k] = String(v); }, removeItem(k) { delete this._s[k]; } };
    sb.__day = opts.day || 1;
    sb.timeSystem = { gameTime: { get currentDay() { return sb.__day; } }, getAbsoluteDay: () => sb.__day, onNewDaySubscribe(cb) { dayHooks.push(cb); } };
    sb.__dayHooks = dayHooks;
    sb.__msgs = [];
    sb.showMessage = function (t) { sb.__msgs.push(String(t)); };
    sb.__battles = [];
    sb.startBattle = function (data) { const b = { enemyData: data }; sb.__battles.push(b); sb.currentBattle = b; return b; };
    sb.currentBattle = null;
    sb.currentCharData = { name: '测试修士', realm: '金丹', health: 100 };
    sb.__npcs = {};
    sb.npcManager = { getNPC: (id) => sb.__npcs[id] || null, getAllNPCs: () => Object.values(sb.__npcs) };
    sb.getRealmTier = () => 3;
    vm.createContext(sb);
    return sb;
}
function fakeRival(id, name, hatred) {
    return {
        id, name, isDead: false, isMissing: false,
        relationship: { hatred: hatred, affection: 0 },
        recordPlayerAction() {}, changeHatred(d) { this.relationship.hatred = Math.max(0, Math.min(100, this.relationship.hatred + d)); }
    };
}
{
    const w = makeWorld({ day: 1 });
    vm.runInContext(read('js/npcs/rivalry-chain.js'), w, { filename: 'rivalry-chain.js' });
    const rival = fakeRival('sect_elder_嵩山派_0', '赵长老', 80);
    w.__npcs[rival.id] = rival;

    eq(w.__dayHooks.length, 1, 'B1 跨日钩子已挂');
    w.__dayHooks[0]();
    eq(w.__battles.length, 1, 'B2 仇恨80的宿敌：跨日拦路寻仇，决战开打');
    ok(w.__battles[0] && w.__battles[0]._isRivalDuel === true && w.__battles[0]._rivalNpcId === rival.id, 'B2b 战局挂着宿敌标记（结算认得出）');
    ok(w.__msgs.some(m => m.indexOf('前来寻仇') >= 0), 'B2c 寻仇有喝阵话术');

    // 同日再跨（同一天内多次结算）：冷却拦住
    w.__battles.length = 0; w.currentBattle = null;
    w.__dayHooks[0]();
    eq(w.__battles.length, 0, 'B3 同一宿敌冷却未过：不连环寻仇');

    // 五日后：仇还在（仇恨未清），再寻
    w.__day = 6;
    w.__dayHooks[0]();
    eq(w.__battles.length, 1, 'B4 冷却过后旧仇再上门');

    // 仇恨不足 60：不算宿敌
    w.__day = 20; rival.relationship.hatred = 50;
    w.__battles.length = 0; w.currentBattle = null;
    w.__dayHooks[0]();
    eq(w.__battles.length, 0, 'B5 仇恨未过线：无人寻仇');

    // 战斗中不叠台
    rival.relationship.hatred = 90;
    w.__day = 30; w.currentBattle = { dummy: 1 };
    w.__battles.length = 0;
    w.__dayHooks[0]();
    eq(w.__battles.length, 0, 'B6 战斗中不叠台');
    w.currentBattle = null;

    // 残魂态不被寻仇
    w.isInSoulState = () => true;
    w.__dayHooks[0]();
    eq(w.__battles.length, 0, 'B7 残魂之体不被趁人之危');
    w.isInSoulState = () => false;

    // 死人不寻仇
    rival.isDead = true;
    w.__day = 40;
    w.__dayHooks[0]();
    eq(w.__battles.length, 0, 'B8 仙逝者不寻仇');
    rival.isDead = false;

    // 仇恨≥90：死敌决战规格
    w.__day = 50;
    w.__battles.length = 0;
    w.__dayHooks[0]();
    eq(w.__battles.length, 1, 'B9a 仇恨90：最终决战上门');
    ok(w.__battles[0]._rivalFinal === true && w.__battles[0].enemyData.name.indexOf('【死敌】') === 0, 'B9b 死敌规格：名号带【死敌】');

    // 结算：打赢降仇恨+灵石（既有逻辑回归）
    w.DataManager = { addSpiritStones() {} };
    let stones = 0; w.DataManager.addSpiritStones = (n) => { stones += n; };
    w.currentBattle = w.__battles[0];
    w.settleRivalDuel(true);
    eq(rival.relationship.hatred, 0, 'B10 死敌伏诛：仇恨清账');
    eq(stones, 200, 'B10b 恩怨了结有彩头（灵石200）');
}

// ============ C 概率纪律：随机数不偏不倚 ============
{
    const w = makeWorld({ day: 1, random: 0.99 }); // 强制不命中寻仇概率
    vm.runInContext(read('js/npcs/rivalry-chain.js'), w, { filename: 'rivalry-chain.js' });
    w.__npcs['r1'] = fakeRival('r1', '仇家甲', 75);
    w.__dayHooks[0]();
    eq(w.__battles.length, 0, 'C1 概率未中：今日风平浪静（寻仇不是每日打卡）');
    // 冷却未被消耗：明日再掷
    w.__day = 2; w.__random = 0.1;
    w.__dayHooks[0]();
    eq(w.__battles.length, 1, 'C2 概率未中不吃冷却：改日仇照样上门');
}

// ============ 汇总 ============
console.log('v22.3-rival-chain: ' + passed + ' passed, ' + failures.length + ' failed');
if (failures.length > 0) process.exit(1);
console.log('v22.3-rival-chain: all green');
