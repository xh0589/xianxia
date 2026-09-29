/**
 * ==================== v24.2 事务快照扩容验收 ====================
 * 病（FIX_NOTES 第一百四十三批 ② 立案，当时「只记不修」）：
 *   EconomyTransaction.capture() 只快照 slots/maxSlots/currency/charCurrency 四项，
 *   qi/energy/health/contribution/discipleState/mood/karma/fame/lifeSkills 九字段落在快照外
 *   ⇒ 一笔事务里「扣了 100 灵石又花了 30 精力」后抛异常，灵石退了、精力不退。
 * 连带病（本批修事务层时抓出）：
 *   npc-life-system.js healNPC 按想象 API 调用 run('名字', function(tx){tx.debit…})——
 *   run 真签名是 run(work)，work 收到的实参是快照不是 tx；字符串被当函数调用必抛、
 *   被 catch 吞掉返回 {success:false}，而判据读 paid.ok（永远 undefined）
 *   ⇒ NPC 垂危急救 100% 走「救治失败」分支，钱分文不动、人永远救不回来。
 * 修：
 *   ① capture 扩到九字段（只记「当时真有」的值，null=当时没有，restore 对它一个字不动）；
 *   ② restore 回写六标量 + lifeSkills 深拷 + discipleState 逐键并回原对象（保引用、
 *      快照里没有的键＝事务里新冒的，回滚抹掉）；
 *   ③ healNPC 改按真 API（与 breakthrough-ritual.js 同款）：run(function(){…}) === true。
 * 运行：node tests/v24.2-tx-snapshot-node.js
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
function load(rel) { vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel }); }
function src(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ============ A 源码接线 ============
console.log('--- A 源码接线 ---');
(function () {
    var tx = src('js/economy/economy-transaction.js');
    assert(/charState: cd \? \{[\s\S]{0,400}qi:[\s\S]{0,300}energy:[\s\S]{0,300}health:[\s\S]{0,300}mood:[\s\S]{0,300}karma:[\s\S]{0,300}fame:[\s\S]{0,300}lifeSkills: cd\.lifeSkills \? clone\(cd\.lifeSkills\) : null/.test(tx),
        'A1 capture 收下六标量 + lifeSkills（深拷，不与活对象共引用）');
    assert(/discipleState: global\.discipleState \? clone\(global\.discipleState\) : null/.test(tx),
        'A2 capture 收下 discipleState 整本（深拷；contribution 就在本里）');
    assert(/if \(_cs\[_ks\[_ki\]\] != null\) _cd\[_ks\[_ki\]\] = _cs\[_ks\[_ki\]\];/.test(tx),
        'A3 restore 只回写「当时真记下的」——null 那档一个字不动，不凭空造值');
    assert(/!Object\.prototype\.hasOwnProperty\.call\(_snap, _k\)\) delete _ds\[_k\];/.test(tx) &&
        /_ds\[_k\] = _snap\[_k\];/.test(tx),
        'A4 discipleState 逐键并回原对象（保引用）；快照里没有的键回滚抹掉');
    assert(/function run\(work\)/.test(tx),
        'A5 run(work) 签名一字未动——breakthrough-ritual 等既有调用方的 `=== true` 判据不破');
    var nl = src('js/npcs/npc-life-system.js');
    assert(/window\.EconomyTransaction\.run\(function \(\) \{[\s\S]{0,200}!window\.EconomyTransaction\.debit\('spiritStones', cost\)\) return false;[\s\S]{0,80}return true;/.test(nl),
        'A6 healNPC 改按真 API：run(function(){…})，work 里用模块级 debit');
    // 棘轮剥注释再扫：修复说明里引述旧写法不算残迹，真代码里出现才算
    var nlCode = nl.split(/\r?\n/).filter(function (l) { return l.trim().indexOf('//') !== 0; }).join('\n');
    assert(/if \(paid !== true\) \{/.test(nl) && nlCode.indexOf('paid.ok') < 0 && nlCode.indexOf('tx.debit') < 0,
        'A7 棘轮：想象 API 的残迹（paid.ok／tx.debit）不许回到真代码里（注释引述不算）');
})();

// ============ B 行为面（真 economy-transaction.js 进沙箱） ============
console.log('--- B 行为面 ---');
global.window = global;
global.console.warn = global.console.warn; // 保持原样
function FakeItem(id, n) { this.templateId = id; this.count = n; this.uid = 'u_' + id; this.customProps = {}; }
FakeItem.prototype.toJSON = function () { return { uid: this.uid, templateId: this.templateId, count: this.count, customProps: {} }; };
global.ItemInstance = FakeItem;
function 重置账本() {
    global.inventory = { maxSlots: 3, slots: [new FakeItem('mat_a', 3), null, null], currency: { spiritStones: 1000, copper: 0 } };
    global.currentCharData = {
        spiritStones: 1000, copper: 0,
        qi: 100, energy: 80, health: 90, mood: 60, fame: 5,
        lifeSkills: { '口才': 10 }
        // karma 刻意不造——B5 验「当时没有的字段 restore 不碰」
    };
    global.discipleState = { isInSect: true, sectId: 'qingyun', contribution: 500, points: 3 };
}
重置账本();
load('js/economy/economy-transaction.js');
var TX = global.EconomyTransaction;
var cd = global.currentCharData, ds = global.discipleState;

// B1 失败回滚：钱、精力、真气、贡献、技艺、心境一次全退（旧版只退钱和格子）
(function () {
    var r = TX.run(function () {
        TX.debit('spiritStones', 100);
        cd.energy -= 30; cd.qi -= 20; cd.mood = 10;
        ds.contribution += 50; ds.points += 1;
        cd.lifeSkills['口才'] += 1;
        return false;
    });
    eq(r, false, 'B1a 返回 false 照旧（run 口径未变）');
    eq(global.inventory.currency.spiritStones, 1000, 'B1b 灵石退回');
    eq(cd.energy, 80, 'B1c 精力退回（旧快照下这一格就是「灵石退了、精力不退」）');
    eq(cd.qi, 100, 'B1d 真气退回');
    eq(cd.mood, 60, 'B1e 心境退回');
    eq(ds.contribution, 500, 'B1f 贡献退回');
    eq(ds.points, 3, 'B1g 积分退回');
    eq(cd.lifeSkills['口才'], 10, 'B1h 生活技艺退回');
    eq(global.currentCharData.spiritStones, 1000, 'B1i 角色镜像钱包同步退回');
})();

// B2 中途抛异常：同样全退
(function () {
    var r = TX.run(function () {
        TX.debit('spiritStones', 200);
        cd.energy -= 50;
        throw new Error('炉子炸了');
    });
    assert(r && r.success === false && r.error && r.error.message === '炉子炸了', 'B2a 异常口径未变（{success:false,error}）');
    eq(global.inventory.currency.spiritStones, 1000, 'B2b 抛错后灵石退回');
    eq(cd.energy, 80, 'B2c 抛错后精力退回');
})();

// B3 成功提交：改动留下
(function () {
    var r = TX.run(function () { TX.debit('spiritStones', 100); cd.energy -= 30; return true; });
    eq(r, true, 'B3a 成功返回 true');
    eq(global.inventory.currency.spiritStones, 900, 'B3b 扣款落账');
    eq(cd.energy, 50, 'B3c 耗力落账（成功的事务不回滚）');
    重置账本(); cd = global.currentCharData; ds = global.discipleState;
})();

// B4 discipleState 逐键并回：引用不换、事务里新冒的键抹掉
(function () {
    var dsRef = global.discipleState;
    TX.run(function () { ds.contribution = 999; ds._事务临时键 = 'x'; return false; });
    assert(global.discipleState === dsRef, 'B4a 回滚不换对象本体（各系统手里的引用不悬空）');
    eq(ds.contribution, 500, 'B4b 贡献照快照退回');
    eq(ds._事务临时键, undefined, 'B4c 事务里新冒出来的键，回滚抹掉');
})();

// B5 当时没有的字段：restore 一个字不动（口径：不凭空造值、也不删事后冒出来的）
(function () {
    eq(cd.karma, undefined, 'B5a 前置：karma 当时不存在');
    TX.run(function () { cd.karma = 99; return false; });
    eq(cd.karma, 99, 'B5b capture 没记下的字段回滚不碰——「只回写当时真有的」口径钉死');
    delete cd.karma;
})();

// B6 lifeSkills 是深拷：快照不与活对象共引用
(function () {
    var snap = TX.capture();
    cd.lifeSkills['口才'] = 77;
    eq(snap.charState.lifeSkills['口才'], 10, 'B6a 改活对象不渗进快照（深拷成立）');
    TX.restore(snap);
    eq(cd.lifeSkills['口才'], 10, 'B6b restore 把手艺退回快照值');
})();

// B7 旧形复现（改前对照）：想象 API 在真模块上必产 {success:false} 且 .ok 永不存在
(function () {
    var 旧形 = TX.run('npc-critical-heal', function (tx) { tx.debit('spiritStones', 1); });
    assert(旧形 && 旧形.success === false && 旧形.ok === undefined,
        'B7 改前对照：run(字符串,…) 被当函数调用必抛、返回 {success:false}、.ok 永无——旧判据 !paid.ok 恒真 ⇒ 急救永远「救治失败」');
})();

// B8 healNPC 真救治（真 npc-life-system.js 进沙箱）
(function () {
    global.showMessage = function () {};
    global.timeSystem = { gameTime: { totalMinutes: 0, currentDay: 1 }, advanceTime: function () {}, getAbsoluteDay: function () { return 1; } };
    global.npcManager = { getNPC: function () { return null; } };
    global.EventBus = { on: function () {}, emit: function () {}, off: function () {} };
    try { load('js/npcs/npc-life-system.js'); } catch (e) { assert(false, 'B8a npc-life-system 装载失败：' + e.message); return; }
    var SYS = global.NPCLifeSystem;
    assert(SYS && typeof SYS.healNPC === 'function', 'B8a NPCLifeSystem.healNPC 可达');
    var npc = { name: '试三', physiology: { maxHealth: 100, health: 5, bloodVolume: 5 }, _isCritical: true, _criticalDays: 3 };
    // 余额 1000 ⇒ 急救费 = floor(1000*0.5) = 500
    var ok = SYS.healNPC(npc, 0.5);
    eq(ok, true, 'B8b 救治成功（旧写法在这里 100% 返回 false）');
    eq(global.inventory.currency.spiritStones, 500, 'B8c 急救费 500 真扣（旧写法钱分文不动）');
    eq(global.currentCharData.spiritStones, 500, 'B8d 角色镜像钱包同步');
    eq(npc.physiology.health, 50, 'B8e 人真救回来了：血量 5 → 50%');
    eq(npc._isCritical, false, 'B8f 垂危状态解除');
})();

console.log('\nv24.2-tx-snapshot：' + passed + ' 通过 / ' + failed + ' 失败');
process.exit(failed ? 1 : 0);
