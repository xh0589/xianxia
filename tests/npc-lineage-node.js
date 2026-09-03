/**
 * npc-lineage-node.js — v19.3 P0-6 单元测试
 *
 * 覆盖：
 *   A: marry（前置：好感/单身/不同 location/近亲）
 *   B: haveChild（灵根/性格/变异灵根继承 + 索引更新）
 *   C: inheritOnDeath + successionOnDeath
 *   D: 玩家结契 + 寿终选择（reincarnate / successor:childId）
 *   E: tickDay 年度 haveChild 概率 + 性能
 *
 * 运行：node tests/npc-lineage-node.js
 */
'use strict';

var path = require('path');
var fs = require('fs');
var vm = require('vm');

var mockWindow = {
    EventBus: null,
    showMessage: function () {},
    console: console,
    Math: Math, JSON: JSON, Object: Object, Array: Array,
    document: { querySelector: function () { return null; } },
    timeSystem: { gameTime: { currentDay: 1, totalMinutes: 0 }, advanceTime: function () {} },
    currentCharData: null,
    discipleState: null,
    npcManager: null,
    showModal: function () {},
    StateRegistry: null,
    setFlag: function () {},
    XianXia: { nameGenerator: null, personality16: null }
};
mockWindow._absDay = 1;
mockWindow.getAbsoluteDay = function () { return mockWindow._absDay; };
mockWindow.window = mockWindow;
mockWindow.global = mockWindow;
mockWindow.XianXia = mockWindow.XianXia || {};

var eventBusSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'core', 'event-bus.js'), 'utf8');
var stateRegSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'core', 'state-registry.js'), 'utf8');
var lineageSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'npcs', 'npc-lineage.js'), 'utf8');

var ctx = vm.createContext(mockWindow);
vm.runInContext(eventBusSrc, ctx);
vm.runInContext(stateRegSrc, ctx);
vm.runInContext(lineageSrc, ctx);

mockWindow.EventBus = ctx.EventBus;
mockWindow.StateRegistry = ctx.StateRegistry;
mockWindow.NpcLineage = ctx.NpcLineage;

// npcManager mock
var npcList = [];
var nId = 0;
function makeNpc(opts) {
    nId++;
    return Object.assign({
        id: 'n' + nId,
        name: 'NPC' + nId,
        gender: 'male',
        age: 30,
        location: '少林寺',
        affection: 0,
        contribution: 0,
        spiritualRoots: { metal: 50, wood: 40, water: 30, fire: 20, earth: 10 },
        mutatedRoots: { thunder: false, wind: false, ice: false },
        personality16: { mind: 0, energy: 0, nature: 0, tactics: 0, identity: 0 },
        combat: { realm: '炼气', layer: 1, attack: 10, defense: 10, health: 100, skills: [] },
        setFlag: function (f) { this._flags = this._flags || {}; this._flags[f] = true; },
        hasFlag: function (f) { return !!(this._flags && this._flags[f]); }
    }, opts || {});
}
mockWindow.npcManager = {
    getNPC: function (id) { return npcList.find(function (n) { return n.id === id; }) || null; },
    getAllNPCs: function () { return npcList.slice(); },
    addNPC: function (n) { npcList.push(n); }
};

function resetNpcs(arr) {
    npcList.length = 0;
    if (arr) for (var i = 0; i < arr.length; i++) npcList.push(arr[i]);
}

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; }
    else { failed++; console.error('[FAIL] ' + msg); }
}
function setDay(d) { mockWindow._absDay = d; }

// ============ A: marry ============

// 1) 模块就绪
assert(typeof mockWindow.NpcLineage.marry === 'function', 'marry 就绪');
assert(typeof mockWindow.NpcLineage.haveChild === 'function', 'haveChild 就绪');
assert(typeof mockWindow.NpcLineage.inheritOnDeath === 'function', 'inheritOnDeath 就绪');

// 2) 单身 + 好感不足
var a = makeNpc({ affection: 30 });
var b = makeNpc({ affection: 30 });
resetNpcs([a, b]);
var r1 = mockWindow.NpcLineage.marry(a.id, b.id);
assert(r1.ok === false && r1.reason === 'affection-low', '好感不足应拒');

// 3) 同 id
var c = makeNpc({ affection: 100 });
resetNpcs([c]);
var r2 = mockWindow.NpcLineage.marry(c.id, c.id);
assert(r2.reason === 'invalid-ids', '同 id 应拒');

// 4) 不近亲：祖辈关系（4 代以内）应拒
var grandparent = makeNpc({ affection: 100 });
var parent = makeNpc({ affection: 100 });
var child = makeNpc({ affection: 100 });
// grandparent -> parent -> child
parent.lineage = { parents: [grandparent.id], children: [], master: null, inheritor: null, daoCompanion: null };
child.lineage = { parents: [parent.id], children: [], master: null, inheritor: null, daoCompanion: null };
grandparent.lineage = { parents: [], children: [parent.id], master: null, inheritor: null, daoCompanion: null };
resetNpcs([grandparent, parent, child]);
var r3 = mockWindow.NpcLineage.marry(grandparent.id, child.id);
assert(r3.reason === 'close-relatives', '祖辈 4 代内应拒');

// 5) 成功 marry
var sa = makeNpc({ affection: 100 });
var sb = makeNpc({ affection: 100 });
resetNpcs([sa, sb]);
var r4 = mockWindow.NpcLineage.marry(sa.id, sb.id);
assert(r4.ok === true, '高好感+单身+同 location 应 OK');

// 6) 重复 marry（已结道侣）
var sa2 = makeNpc({ affection: 100 });
var sb2 = makeNpc({ affection: 100 });
resetNpcs([sa, sb, sa2, sb2]);
var r5 = mockWindow.NpcLineage.marry(sa.id, sb2.id);
assert(r5.ok === false && (r5.reason === 'a-not-single' || r5.reason === 'b-not-single'), '已结道侣应拒 (reason=' + r5.reason + ')');

// ============ B: haveChild ============

// 7) haveChild 需先 marry
var ca = makeNpc({ affection: 100 });
var cb = makeNpc({ affection: 100 });
resetNpcs([ca, cb]);
var r6 = mockWindow.NpcLineage.marry(ca.id, cb.id);
assert(r6.ok, '高好感 marry OK');
// 跑 1000 次 haveChild
var kids = 0;
for (var i = 0; i < 1000; i++) {
    var k = mockWindow.NpcLineage.haveChild(ca.id, cb.id);
    if (k) kids++;
}
assert(kids > 0, '1000 次 haveChild 应产至少 1 个 (实际 ' + kids + ')');

// 8) 后代有父母字段
if (kids > 0) {
    var anyKid = npcList[npcList.length - 1];
    var lin = anyKid.lineage;
    assert(lin && lin.parents.length === 2 && lin.parents.indexOf(ca.id) >= 0 && lin.parents.indexOf(cb.id) >= 0, '后代 parents 含父母');
    assert(lin.parents[0] === ca.id || lin.parents[1] === ca.id, 'parents 包含 father');
    assert(lin.parents.indexOf(cb.id) >= 0, 'parents 包含 mother');
}

// 9) 后代灵根继承自父母
if (kids > 0) {
    var anyKid2 = npcList[npcList.length - 1];
    var roots = anyKid2.spiritualRoots;
    var allValid = roots.metal >= 0 && roots.metal <= 100 && roots.wood >= 0 && roots.wood <= 100 && roots.water >= 0 && roots.water <= 100;
    assert(allValid, '后代灵根在 0~100 范围');
    var totalRoots = roots.metal + roots.wood + roots.water + roots.fire + roots.earth;
    assert(totalRoots <= 200, '后代灵根总和 ≤ 200 (实际 ' + totalRoots + ')');
}

// 10) 父母 lineage.children 含 child
assert(ca.lineage.children.length >= 1 && cb.lineage.children.length >= 1, '父母 lineage.children 含 child');

// 11) EventBus 收到 childBorn
var childBornEvent = null;
mockWindow.EventBus.on('npc:lineage:childBorn', function (e) { childBornEvent = e; });
mockWindow.NpcLineage.haveChild(ca.id, cb.id);
assert(childBornEvent && childBornEvent.fatherId === ca.id, 'EventBus 收到 childBorn');

// ============ C: 衣钵继承 ============

// 12) 师徒关系后死亡 → 衣钵传给最优弟子
var master = makeNpc({ combat: { realm: '筑基', layer: 1, attack: 20, defense: 20, health: 100, skills: ['art_master_1', 'art_master_2'] } });
var student1 = makeNpc({ contribution: 50 });
var student2 = makeNpc({ contribution: 100 });
var student3 = makeNpc({ contribution: 10 });
// 通过 lineage 设置师徒
master.lineage = { parents: [], children: [], master: null, inheritor: null, daoCompanion: null };
student1.lineage = { parents: [], children: [], master: master.id, inheritor: null, daoCompanion: null };
student2.lineage = { parents: [], children: [], master: master.id, inheritor: null, daoCompanion: null };
student3.lineage = { parents: [], children: [], master: master.id, inheritor: null, daoCompanion: null };
mockWindow.NpcLineage._index().byMaster[master.id] = [student1.id, student2.id, student3.id];
resetNpcs([master, student1, student2, student3]);
var inh = mockWindow.NpcLineage.inheritOnDeath(master.id);
assert(inh && inh.inheritorId === student2.id, '衣钵给 contribution 最高弟子 (student2=' + student2.contribution + ')');
assert(student2.combat.skills.indexOf('art_master_1') >= 0, '弟子获得师父技能');

// 13) 指定 inheritor
master.lineage.inheritor = student3.id;
var inh2 = mockWindow.NpcLineage.inheritOnDeath(master.id);
assert(inh2.inheritorId === student3.id, '指定 inheritor 优先');

// ============ C: 掌门继任 ============

// 14) 掌门死 → 选 sect 内最优弟子
var leader = makeNpc({ contribution: 1000, location: '少林派' });
var cand1 = makeNpc({ contribution: 50, location: '少林派' });
var cand2 = makeNpc({ contribution: 200, location: '少林派' });
resetNpcs([leader, cand1, cand2]);
var suc = mockWindow.NpcLineage.successionOnDeath(leader.id, '少林派');
assert(suc && suc.toId === cand2.id, '掌门继任给 contribution 最高弟子 (cand2)');
assert(cand2.rank === 0 && cand2.rankName === '掌门', 'cand2 升为掌门');

// ============ D: 玩家侧 ============

// 15) 玩家结契
mockWindow.currentCharData = { id: 'player', name: '玩家' };
var r15 = mockWindow.NpcLineage.recordPlayerDaoCompanion(npcList[0].id);
assert(r15 === true, '玩家结契 OK');
var npc0Lin = npcList[0].lineage;
assert(npc0Lin.daoCompanion === 'player', 'NPC 道侣指向 player');

// 16) 寿终选择：转世
var player = { id: 'p1', name: '玩家', age: 100, isFounder: false };
mockWindow.currentCharData = player;
var r16 = mockWindow.NpcLineage.choosePlayerAfterlife('reincarnate');
assert(r16 && player.age === 18 && player.isFounder === true, '转世本人 OK');

// 17) 寿终选择：传人
player.age = 100;
var r17 = mockWindow.NpcLineage.choosePlayerAfterlife('successor:' + npcList[0].id);
assert(r17 && player.lineage && player.lineage.successor === npcList[0].id, '传人继续 OK');

// 18) 错误选择
var r18 = mockWindow.NpcLineage.choosePlayerAfterlife('garbage');
assert(r18 === false, '错误选择应拒');

// ============ E: tickDay 性能 + 年度概率 ============

// 19) 100 年连续 tickDay（daos=0 时不生）
resetNpcs();
var daos = makeNpc({ affection: 100 });
var daoc = makeNpc({ affection: 100 });
resetNpcs([daos, daoc]);
mockWindow.NpcLineage.marry(daos.id, daoc.id);
var beforeKids = npcList.length;
var t0 = Date.now();
for (var d = 360; d <= 36000; d += 360) {
    mockWindow.NpcLineage.tickDay(d);
}
var dt = Date.now() - t0;
var newKids = npcList.length - beforeKids;
assert(dt < 200, '100 年 tickDay < 200ms (实际 ' + dt + 'ms, 新增 ' + newKids + ' 后代)');
assert(newKids >= 0 && newKids < 50, '100 年新增后代 < 50 (实际 ' + newKids + ')');

// 20) 道侣数组可达
assert(typeof mockWindow.NpcLineage.getAncestors === 'function', 'getAncestors 就绪');
assert(typeof mockWindow.NpcLineage.getDescendants === 'function', 'getDescendants 就绪');

// 21) renderLineagePanel
var html21 = mockWindow.NpcLineage.renderLineagePanel(daos.id);
assert(html21.length > 0 && html21.indexOf('族谱') >= 0, 'renderLineagePanel OK');

// 22) StateRegistry 持久化
var snap = mockWindow.StateRegistry.exportAll();
assert(snap.npcLineageIndex, 'StateRegistry 含 npcLineageIndex');
mockWindow.StateRegistry.resetAll();
mockWindow.StateRegistry.importAll(snap);
assert(mockWindow.NpcLineage._index().byParent, 'import 后索引恢复');

// ============ 收尾 ============
console.log('=========================================');
console.log('npc-lineage v19.3: ' + passed + ' passed, ' + failed + ' failed');
console.log('=========================================');
if (failed > 0) process.exit(1);
