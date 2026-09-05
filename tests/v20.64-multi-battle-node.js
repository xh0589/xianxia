/**
 * v20.64-multi-battle-node.js — 多人战验收：
 *   M1 敌方一组：兽群同伙真的进场，每轮都动手，主敌倒了由下一只补位
 *   M2 兽群围人：撞上兽群，整群一起围上来，不再站着看戏
 *   M3 生理按回合记账：一轮全场每人只走 6 秒，不再队伍越大烂得越快
 *   M4 队员像个人：出手伤害类型跟着本事走，掩护真的挡刀，自保真的先止血
 *   M5 阵亡有后事：战死除名入名录，牺牲阵的遗志真的转移
 *   M6 关系记忆活着：队员挨的刀记得到账上，战后关系真会变
 *   M7 补丁必还原：疼痛减伤的猴子补丁，攻击抛错也不会留在敌人身上
 *   M8 行动经济：敌方一组后，双方出手次数同一量级，不再是 6 打 1
 *
 * 运行：node tests/v20.64-multi-battle-node.js
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

// ==================== 测试桩 ====================
global.window = global;

var els = {};
function fakeEl(tag) {
    var el = {
        tag: tag || '', children: [], style: {}, _attrs: {}, parentNode: null,
        setAttribute: function (k, v) { this._attrs[k] = v; },
        getAttribute: function (k) { return this._attrs[k]; },
        appendChild: function (c) { this.children.push(c); c.parentNode = this; return c; },
        removeChild: function (c) { var i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c; },
        get firstChild() { return this.children[0] || null; },
        addEventListener: function () {}, removeEventListener: function () {},
        closest: function () { return null; },
        scrollIntoView: function () {},
        querySelector: function () { return null; },
        querySelectorAll: function () { return []; },
        // classList 记真账：野外面板靠「没挂 hidden」判断人站在哪一州
        _classes: [],
        classList: {
            add: function (c) { var cs = String(c).split(/\s+/); for (var i = 0; i < cs.length; i++) if (cs[i] && this._cls().indexOf(cs[i]) < 0) this._cls().push(cs[i]); },
            remove: function (c) { var cs = String(c).split(/\s+/); for (var i = 0; i < cs.length; i++) { var a = this._cls(), k = a.indexOf(cs[i]); if (k >= 0) a.splice(k, 1); } },
            toggle: function (c) { var a = this._cls(), k = a.indexOf(c); if (k >= 0) a.splice(k, 1); else a.push(c); },
            contains: function (c) { return this._cls().indexOf(c) >= 0; },
            _cls: function () { return el._classes; }
        },
        _html: '',
        textContent: '',
        options: []   // <select> 桩：formationSelect.options 得读得着
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
global.showMessage = function (m, t) { msgs.push({ m: m, t: t }); };
global.window.showMessage = global.showMessage;
global.window.alert = function () {};
global.updateCharacterStatus = function () {};
global.updateCurrencyUI = function () {};
global.updatePartyUI = function () {};
global.updateBattleUI = function () {};
global.getEffectiveMax = function () { return 100; };
global.itemById = {};
global.window.itemById = global.itemById;
global.EventBus = { emit: function () {}, on: function () {} };
global.window.EventBus = global.EventBus;
global.getCombatBonuses = function () { return {}; };
global.getBondBonuses = function () { return {}; };
global.getPlayerWeaponSkill = function () { return 0; };
global.resolveWeaponDamageType = function () { return 'slash'; };
global.currentEquipment = {};
global.window.currentEquipment = global.currentEquipment;
global.window.TalismanSystem = null;
global.getCurrentCharData = function () { return global.currentCharData; };
global.currentCharData = { health: 100, energy: 100, qi: 100, maxQi: 100, level: 10, realm: '筑基', attrs: {} };
global.timeSystem = {
    gameTime: { totalMinutes: 0 },
    advanceTime: function (m) { this.gameTime.totalMinutes += m; },
    onNewDaySubscribe: function () {}
};
// 同步执行 setTimeout：一轮跑完再回来
global.setTimeout = function (fn) { fn(); return 0; };

// 固定种子的伪随机：战斗是随机的事，测试得可复现
var _rngState = 20260905;
function seededRandom() {
    _rngState = (Math.imul(_rngState, 1103515245) + 12345) >>> 0;
    return _rngState / 4294967296;
}
function withSeed(seed, fn) {
    var orig = Math.random;
    Math.random = seededRandom;
    _rngState = seed >>> 0;
    try { return fn(); } finally { Math.random = orig; }
}

// 队伍：3 名队员，各有所长
function mkMember(id, name, skills, dex) {
    return {
        id: id, name: name, level: 10, health: 100, maxHealth: 100, qi: 100, maxQi: 100,
        attributes: { strength: 20, dexterity: dex == null ? 15 : dex, intelligence: 15, willpower: 15, constitution: 20 },
        combatSkills: skills || {}, combatAbilities: [], equipment: {},
        relationship: { affection: 0, trust: 0, loyalty: 50 },
        battleState: {},
        actions: [],
        recordPlayerAction: function (k) { this.actions.push(k); },
        isAlive: function () { return this.health > 0; }
    };
}
global.window.partySystem = {
    partyData: {
        members: [
            mkMember('m1', '剑客', { '剑法': 40, '内功': 20 }),
            mkMember('m2', '棍僧', { '长兵': 35, '内功': 15 }),
            mkMember('m3', '杂役', {}, 12)
        ],
        formation: 'default',
        fallen: [],
        battleLog: []
    },
    processPostBattleRelationships: function () {}
};

load('js/physiology-config.js');
load('js/battle-injuries.js');
load('js/battle.js');

var Entity = global.Entity, Battle = global.Battle;

function mkPlayer() {
    return new Entity({
        name: '玩家', level: 10,
        attrs: { strength: 30, dexterity: 20, intelligence: 20, willpower: 20, constitution: 30, meridian: 30 },
        skills: { '内功': 40 }, loot: {}, physiologyType: 'humanoid'
    }, 'player');
}
function mkEnemy(name, level, attrs) {
    return new Entity({
        name: name || '强敌', level: level || 12,
        attrs: attrs || { strength: 35, dexterity: 20, intelligence: 15, willpower: 15, constitution: 35, meridian: 20 },
        skills: { '内功': 35 }, loot: { exp: 10, copper: 5 }, physiologyType: 'humanoid'
    }, 'enemy');
}
function mkAllyData(name) {
    return { data: { name: name || '野狼', level: 3, type: 'beast', attrs: { strength: 12, dexterity: 14, intelligence: 4, willpower: 6, constitution: 12, meridian: 2 }, skills: {} }, type: 'beast', uid: 'u_' + (name || '野狼') };
}
// 一轮打完（玩家普攻起头，敌方与队员自动接龙）
function playRound(b) {
    if (b.isFinished) return;
    b.playerAttack('chest');
}

// ==================== M1 敌方一组 ====================
console.log('\n[M1] 敌方一组：同伙真的进场、真的动手');
withSeed(11, function () {
    var b = new Battle(mkPlayer(), mkEnemy('头狼', 10), [mkAllyData('野狼甲'), mkAllyData('野狼乙')]);
    var wolfA = b.enemyAllies[0], wolfB = b.enemyAllies[1];
    assert(b.enemyAllies.length === 2, '两只同伙该都进了场（实得 ' + b.enemyAllies.length + '）');
    assert(b.enemyAllies.every(function (a) { return a.type === 'beast'; }), '兽群同伙该按兽的生理结算');
    assert(b.enemyAllies.every(function (a) { return (a.loot.exp || 0) === 0 && (a.loot.copper || 0) === 0; }), '同伙不带战利品，人多不该让赏钱翻倍');
    assert(b.enemyAllies[0].level >= 10, '同伙该跟头兽一个量级（实得 ' + b.enemyAllies[0].level + '）');
    // 同伙每轮也动手
    var allyHits = 0;
    var origExec = Battle.prototype._executeAttack;
    Battle.prototype._executeAttack = function (atk, def, part, dt) {
        if (b.enemyAllies.indexOf(atk) >= 0) allyHits++;
        return { msg: '跳过' };
    };
    b.enemyTurn();
    Battle.prototype._executeAttack = origExec;
    assert(allyHits === 2, '两只同伙该各出手一次（实得 ' + allyHits + '）');
    // 主敌倒下 → 补位，战斗不结束
    b.enemy.physiology.health = 0;
    b.enemy.isAlive = false;
    var head = b.enemy;
    assert(b._checkEnd() === false, '主敌倒了但同伙还在，战斗该继续');
    assert(b.enemy === wolfA, '该由下一只补位当主敌');
    assert(b.enemyAllies.length === 1 && b.enemyAllies[0] === wolfB, '补位的那只该从同伴名单里挪走');
    assert(b._fallenEnemies.indexOf(head) >= 0, '倒下的头兽该记入战后名录');
    // 全倒下才算赢
    wolfA.isAlive = false;
    assert(b._checkEnd() === false, '还剩一只同伙，战斗该继续');
    wolfB.isAlive = false;
    assert(b._checkEnd() === true && b.winner === 'player', '全倒下了才该算赢');
    assert(b._fallenEnemies.length === 3, '头兽加两只同伙都该记入战后名录（实得 ' + b._fallenEnemies.length + '）');
    assert(b._fallenEnemies.indexOf(head) >= 0 && b._fallenEnemies.indexOf(wolfA) >= 0
        && b._fallenEnemies.indexOf(wolfB) >= 0, '三只该各记一笔，不该重复记账');
    console.log('    两只同伙进场 · 各出手一次 · 主敌倒下有人补位 · 全倒才赢');
});

// ==================== M2 兽群围人 ====================
console.log('\n[M2] 兽群围人：整群一起围上来');
withSeed(22, function () {
    load('js/regions.js');
    load('js/core/state-registry.js');
    load('js/map/wild-terrain.js');
    load('js/map/randomMap.js');
    global.inventory = { currency: { spiritStones: 100 } };
    var captured = null;
    global.openBattleWithEntity = function (e) { captured = e; };

    var pack = null, seedNo = -1;
    for (var i = 0; i < 14 && !pack; i++) {
        global.setMapSeed('东荒_pack_' + i);
        global.openWildernessMap('东荒');
        pack = (global.wildMapApi.life.bands() || []).filter(function (b) {
            return b.kind === 'pack' && b.members.length >= 2;
        })[0] || null;
        if (pack) seedNo = i;
    }
    assert(!!pack, '东荒应能探出成群的兽（探了 14 个种子）');
    if (pack) {
        var head = pack.members[0];
        global.bandContact(pack, head);
        assert(captured === head, '撞上兽群该跟头兽开打');
        var mates = head._packMates || [];
        assert(mates.length === pack.members.length - 1, '同伙该一起进场（实得 ' + mates.length + '，群 ' + pack.members.length + ' 只）');
        assert(mates.every(function (m) { return m !== head; }), '头兽不该把自己也算进同伙');
        if (head.data && head.data.level) {
            assert(mates.every(function (m) { return (m.data.level || 0) >= head.data.level; }), '同伙该跟头兽一个量级');
        }
        // 进场：战斗里真能看到这群兽
        var pb = new Battle(mkPlayer(), mkEnemy(head.name || '头狼', (head.data && head.data.level) || 3), mates);
        assert(pb.enemyAllies.length === mates.length, '兽群该整群站在你对面（实得 ' + pb.enemyAllies.length + '）');
        console.log('    ' + pack.name + ' · ' + pack.members.length + ' 只一起围上来（种子 ' + seedNo + '）');
    }
});

// ==================== M3 生理按回合记账 ====================
console.log('\n[M3] 生理按回合记账：一轮每人只走 6 秒');
withSeed(33, function () {
    var physCalls = {};
    var orig = global.processPhysiology;
    global.processPhysiology = function (ent, sec) {
        var k = ent ? (ent.name || '?') : '?';
        physCalls[k] = (physCalls[k] || 0) + 1;
        if (sec !== 6) physCalls._badSec = (physCalls._badSec || 0) + 1;
        return orig(ent, sec);
    };
    // 独闯
    var solo = new Battle(mkPlayer(), mkEnemy());
    solo.partyMembers = [];
    physCalls = {};
    playRound(solo);
    assert(physCalls['玩家'] === 1 && physCalls['强敌'] === 1, '独闯一轮该各走一次生理（实得 ' + JSON.stringify(physCalls) + '）');
    // 带 3 队员 + 2 同伙
    var team = new Battle(mkPlayer(), mkEnemy('头狼', 10), [mkAllyData('野狼甲'), mkAllyData('野狼乙')]);
    physCalls = {};
    playRound(team);
    var names = ['玩家', '头狼', '野狼甲', '野狼乙', '剑客', '棍僧', '杂役'];
    var bad = names.filter(function (n) { return physCalls[n] !== 1; });
    assert(bad.length === 0, '带满人一轮也该每人只走一次（异常：' + bad.join(',') + ' 实得 ' + JSON.stringify(physCalls) + '）');
    assert(!physCalls._badSec, '每一步都该按 6 秒结（实得有非 6 秒的结算）');
    // 第二轮也要重新记账
    physCalls = {};
    if (!team.isFinished) playRound(team);
    assert(physCalls['玩家'] === 1, '第二轮该重新记账（实得 ' + JSON.stringify(physCalls) + '）');
    global.processPhysiology = orig;
    console.log('    独闯 1 次/人 · 带满 7 个参战者仍是 1 次/人');
});

// ==================== M4 队员像个人 ====================
console.log('\n[M4] 队员像个人：出手看本事，指令听得懂');
withSeed(44, function () {
    // 伤害类型跟着本事走
    var b = new Battle(mkPlayer(), mkEnemy());
    var seen = {};
    var origExec = Battle.prototype._executeAttack;
    Battle.prototype._executeAttack = function (atk, def, part, dt) {
        if (atk._partyMemberRef) seen[atk.name] = dt;
        return origExec.call(this, atk, def, part, dt);
    };
    playRound(b);   // 默认强攻：剑客该出 slash，棍僧该出 blunt，杂役赤手该出 blunt
    Battle.prototype._executeAttack = origExec;
    assert(seen['剑客'] === 'slash', '练剑的该用砍（实得 ' + seen['剑客'] + '）');
    assert(seen['棍僧'] === 'blunt', '使棍的该用砸（实得 ' + seen['棍僧'] + '）');
    assert(seen['杂役'] === 'blunt', '什么都没练的该赤手砸（实得 ' + seen['杂役'] + '）');

    // 指令：自保 → 不抢人头，先止血或摆架势
    var b2 = new Battle(mkPlayer(), mkEnemy());
    b2.partyOrder = 'guard';
    b2.partyMembers.forEach(function (m) { m._partyOrder = 'guard'; });
    var attacked = 0;
    Battle.prototype._executeAttack = function (atk, def, part, dt) {
        if (atk._partyMemberRef) attacked++;
        return origExec.call(this, atk, def, part, dt);
    };
    // 给剑客安一道流血的伤，看他是不是先去包扎
    var w = b2.partyMembers[0].physiology.wounds;
    w.push({ id: 'w1', partId: 'upperArmL', bleeding: true, externalBleedRate: 6, stabilization: 0, clottingProgress: 0, severity: 'moderate', damageType: 'slash' });
    playRound(b2);
    Battle.prototype._executeAttack = origExec;
    assert(attacked === 0, '自保指令下队员不该抢人头（实得 ' + attacked + ' 次攻击）');
    assert(w[0].stabilization > 0, '带伤的自保队员该先包扎（稳定度 ' + w[0].stabilization + '）');
    assert(b2.log.some(function (l) { return /剑客/.test(l.msg) && /包扎|自守/.test(l.msg); }), '该说清剑客做了什么');

    // 指令：掩护 → 敌人的刀真会被挡走
    var playerHits = 0, coverHits = 0, rounds = 300;
    for (var r = 0; r < rounds; r++) {
        var b3 = new Battle(mkPlayer(), mkEnemy());
        b3.partyOrder = 'cover';
        b3.partyMembers.forEach(function (m) { m._partyOrder = 'cover'; });
        Battle.prototype._executeAttack = function (atk, def) {
            if (atk === b3.enemy && def === b3.player) playerHits++;
            else if (atk === b3.enemy && def._partyMemberRef) coverHits++;
            return { msg: '跳过' };
        };
        b3.enemyTurn();
    }
    Battle.prototype._executeAttack = origExec;
    assert(coverHits > playerHits, '掩护指令该把大多数攻击挡过去（玩家挨 ' + playerHits + ' / 队员挡 ' + coverHits + '）');
    console.log('    剑客砍 / 棍僧砸 / 自保先止血 / 掩护真挡刀（' + playerHits + ':' + coverHits + '）');
});

// ==================== M5 阵亡有后事 ====================
console.log('\n[M5] 阵亡有后事：除名入名录，遗志真的转移');
withSeed(55, function () {
    load('js/party-system.js');   // 用真的队伍系统结算，不用桩
    var ps = global.window.partySystem;
    ps.partyData.members = [
        mkMember('m1', '剑客', { '剑法': 40 }),
        mkMember('m2', '棍僧', { '长兵': 35 })
    ];
    ps.partyData.fallen = [];
    ps.partyData.battleLog = [];
    ps.partyData.formation = 'sacrifice';
    // 剑客战死
    ps.partyData.members[0].health = 0;
    ps.partyData.members[0]._diedThisBattle = true;
    var beforeStr = ps.partyData.members[1].attributes.strength;
    var out = ps.finalizeBattleOutcome({ enemy: {} });
    assert(out.fallen.indexOf('剑客') >= 0, '战死者该被记入后事（实得 ' + JSON.stringify(out.fallen) + '）');
    assert(ps.partyData.members.length === 1, '阵亡者该从队伍名单除名（余 ' + ps.partyData.members.length + '）');
    assert(ps.partyData.fallen.length === 1 && ps.partyData.fallen[0].name === '剑客', '阵亡名录该记下他');
    assert(ps.partyData.members[0].attributes.strength > beforeStr, '牺牲阵该把遗志分给活人（' + beforeStr + ' → ' + ps.partyData.members[0].attributes.strength + '）');
    // 没死人：不动名录
    var n0 = ps.partyData.members.length;
    ps.finalizeBattleOutcome({ enemy: {} });
    assert(ps.partyData.members.length === n0 && ps.partyData.fallen.length === 1, '没死人不该误除名');
    console.log('    剑客战死 → 除名入名录 · 棍僧力气 +' + (ps.partyData.members[0].attributes.strength - beforeStr));
});

// ==================== M6 关系记忆活着 ====================
console.log('\n[M6] 关系记忆活着：挨的刀记得到账上');
withSeed(66, function () {
    var ps = global.window.partySystem;
    ps.partyData.members = [mkMember('m1', '剑客', { '剑法': 40 })];
    ps.partyData.fallen = [];
    ps.partyData.battleLog = [];
    ps.partyData.formation = 'default';
    var b = new Battle(mkPlayer(), mkEnemy());
    // 敌人往队员身上招呼，直到账上记够
    for (var i = 0; i < 40 && b.partyMembers[0].isAlive && (b.partyMembers[0]._partyMemberRef.battleLastTakenDamage || 0) < 30; i++) {
        b._executeAttack(b.enemy, b.partyMembers[0], 'chest', 'slash');
    }
    var taken = b.partyMembers[0]._partyMemberRef.battleLastTakenDamage || 0;
    assert(taken > 0, '队员挨的刀该记到账上（实得 ' + taken + '）');
    // 战后结算：重伤未治关系该降
    var affBefore = ps.partyData.members[0].relationship.affection;
    ps.finalizeBattleOutcome(b);
    var affAfter = ps.partyData.members[0].relationship.affection;
    assert(affAfter < affBefore, '重伤未治关系该下降（' + affBefore + ' → ' + affAfter + '）');
    assert((ps.partyData.members[0].battleLastTakenDamage || 0) === 0, '结完账该把伤害标记清零');
    // 战死者好感大幅下降
    ps.partyData.members = [mkMember('m1', '剑客', {})];
    ps.partyData.members[0]._diedThisBattle = true;
    var aff0 = ps.partyData.members[0].relationship.affection;
    ps.processPostBattleRelationships(b);
    assert(ps.partyData.members[0].relationship.affection <= aff0 - 20, '战死该重挫关系（' + aff0 + ' → ' + ps.partyData.members[0].relationship.affection + '）');
    console.log('    挨刀记账 ' + taken + ' · 关系 ' + affBefore + ' → ' + affAfter);
});

// ==================== M7 补丁必还原 ====================
console.log('\n[M7] 补丁必还原：攻击抛错也不留下减伤补丁');
withSeed(77, function () {
    var b = new Battle(mkPlayer(), mkEnemy());
    b.enemy.physiology.painLoad = 80;   // 疼痛高 → 挂减伤补丁
    var orig = b.enemy.getAttack;
    var origExec = Battle.prototype._executeAttack;
    Battle.prototype._executeAttack = function () { throw new Error('炸了'); };
    var threw = false;
    try { b.enemyTurn(); } catch (e) { threw = true; }
    Battle.prototype._executeAttack = origExec;
    assert(threw, '该让异常原样抛出去');
    assert(b.enemy.getAttack === orig, '补丁该被还原，不该永久留在敌人身上');
    console.log('    炸过一轮，敌人的攻击力没被偷偷砍掉');
});

// ==================== M8 行动经济 ====================
console.log('\n[M8] 行动经济：不再是 6 打 1');
withSeed(88, function () {
    function countEnemyActions(withPack) {
        var b = new Battle(mkPlayer(), mkEnemy('头狼', 10), withPack ? [mkAllyData('野狼甲'), mkAllyData('野狼乙')] : []);
        b.partyMembers = [];
        var acts = 0;
        var origExec = Battle.prototype._executeAttack;
        Battle.prototype._executeAttack = function (atk) {
            if (atk === b.enemy || (b.enemyAllies || []).indexOf(atk) >= 0) acts++;
            return { msg: '跳过' };
        };
        b.enemyTurn();
        Battle.prototype._executeAttack = origExec;
        return acts;
    }
    var solo = countEnemyActions(false), pack = countEnemyActions(true);
    assert(solo === 1, '独闯时敌方该只出手一次（实得 ' + solo + '）');
    assert(pack === 3, '兽群围上来敌方该出手三次（实得 ' + pack + '）');
    console.log('    独闯 1 次出手 · 兽群 3 次出手');
});

// ==================== M9 收场接线：倒下的同伙在任何结局都不该站起来 ====================
console.log('\n[M9] 收场接线：胜/逃/败都把倒下的同伙标成尸体');
(function () {
    var app = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
    assert(/function markFallenEnemyCorpses\(/.test(app), '该有独立的一道标尸账');
    assert(/markKilledEnemyAsCorpse\(currentBattle\)[\s\S]*?markFallenEnemyCorpses\(currentBattle, _cell/.test(app),
        'closeBattle 该在胜/逃/败两条路上都收这道账');
    assert(/finalizeBattleOutcome\(currentBattle\)/.test(app), '战后统一结算该挂在 closeBattle 上');
    assert(/_packMates/.test(fs.readFileSync(path.join(ROOT, 'js/map/randomMap.js'), 'utf8')),
        '兽群撞见时该把同伙一并递进战斗');
    assert(/new Battle\(playerEntity, enemyEntity, packMates\)/.test(app), '战斗入口该把同伙递给 Battle');
    console.log('    胜利标主敌与同伙 · 逃走败北也标倒下的同伙 · 队员后事统一结算');
})();

// ==================== 结果 ====================
console.log('\n========== v20.64 多人战 ==========');
console.log('通过 ' + passed + ' / 失败 ' + failed);
process.exit(failed ? 1 : 0);
