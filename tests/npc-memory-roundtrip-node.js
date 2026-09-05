/**
 * npc-memory-roundtrip-node.js — v20.38 存读档往返防线
 *
 * NPC 记忆是显式白名单制——漏收一个键，就是"存读档后数据静默消失"。
 * 前科：v20.31 人工肉眼挖出四个漏键（_ambientLastDay 重入日头 / _branchState /
 * _choiceHistory / _events）。本套把这类漏洞钉上机械防线：
 * 设值 → serialize → JSON 过盘 → deserialize，每个键都必须原样回来。
 *
 * 运行：node tests/npc-memory-roundtrip-node.js
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
function loadScript(rel) { return fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8'); }

// ---- 最小沙箱：npc-system.js 独立加载 ----
var noop = function () {};
var sandbox = {
    console: { log: noop, warn: noop, error: noop },
    JSON: JSON, Object: Object, Array: Array, Math: Math, Number: Number,
    String: String, Boolean: Boolean, Set: Set, Map: Map, Date: Date,
    parseInt: parseInt, isFinite: isFinite,
    setTimeout: noop, clearTimeout: noop, setInterval: noop, clearInterval: noop,
    document: { addEventListener: noop, removeEventListener: noop,
        querySelector: function () { return null; }, getElementById: function () { return null; } }
};
sandbox.window = sandbox;
sandbox.global = sandbox;
var ctx = vm.createContext(sandbox);
vm.runInContext(loadScript('js/npcs/npc-system.js'), ctx);
var NPC = vm.runInContext('NPC', ctx);

// ============ R1 四个前科键：设值 → 过盘 → 必须回来 ============
var n = new NPC('sect_leader_百花谷', '温蘅', { gender: 'female' });
n.memory.firstMet = true;
n.memory.meetCount = 7;
n.memory._ambientLastDay = { bh_event_sulk: 123, bh_event_neglect: 456 };
n.memory._branchState = { deep_01: { currentNode: 'node_b', history: ['a', 'b'] } };
n.memory._choiceHistory = { deep_01: [{ nodeId: 'n1', choiceIndex: 2 }] };
n.memory._events = [{ text: '一段记忆', importance: 8 }];

var data = n.serialize();
var json = JSON.parse(JSON.stringify(data)); // 模拟存档写盘（真存档同样过 JSON）
var r = NPC.deserialize(json);

assert(r.memory && r.memory.firstMet === true && r.memory.meetCount === 7,
    'R1a 基线记忆（结识/见面数）往返不丢');
assert(r.memory._ambientLastDay && r.memory._ambientLastDay.bh_event_sulk === 123
    && r.memory._ambientLastDay.bh_event_neglect === 456,
    'R1b 重入日头 _ambientLastDay 往返不丢——丢了则读档后日常小事（含小心眼/被晾）永不再触发（v20.31 修复点）');
assert(r.memory._branchState && r.memory._branchState.deep_01
    && r.memory._branchState.deep_01.currentNode === 'node_b'
    && r.memory._branchState.deep_01.history.length === 2,
    'R1c 深谈分支进度 _branchState 往返不丢（嵌套结构连里层一起验）');
assert(r.memory._choiceHistory && r.memory._choiceHistory.deep_01
    && r.memory._choiceHistory.deep_01.length === 1
    && r.memory._choiceHistory.deep_01[0].choiceIndex === 2,
    'R1d 选择史 _choiceHistory 往返不丢');
assert(r.memory._events && r.memory._events.length === 1 && r.memory._events[0].importance === 8,
    'R1e 记忆事件 _events 往返不丢');

// ============ R2 深拷贝纪律：存读档不得与原档共享引用 ============
assert(r.memory._branchState.deep_01 !== n.memory._branchState.deep_01,
    'R2 嵌套结构走深拷贝——读档改记忆不会反向污染原档');

// ============ R3 七色关系账往返不丢 ============
n.relationship.affection = 55; n.relationship.trust = 12; n.relationship.love = 34;
n.relationship.fear = 8; n.relationship.favor = 20; n.relationship.respect = 40;
n.relationship.hatred = 5;
var r3 = NPC.deserialize(JSON.parse(JSON.stringify(n.serialize())));
assert(r3.relationship.love === 34 && r3.relationship.fear === 8 && r3.relationship.trust === 12
    && r3.relationship.affection === 55 && r3.relationship.favor === 20
    && r3.relationship.respect === 40 && r3.relationship.hatred === 5,
    'R3 好感/信任/深情/威压/情面/敬重/怨恨七色账全部往返不丢（新通电的三本账在内）');

// ============ R4/R5 角色级账本（钱庄/当铺/节日账）源码级防线 ============
var gs = loadScript('js/core/game-state.js');
assert(gs.indexOf('charData._bank') >= 0 && gs.indexOf('charData._pawn') >= 0
    && gs.indexOf('saveData.bank') >= 0 && gs.indexOf('saveData.pawn') >= 0,
    'R4 钱庄/当铺账本在存读档白名单——出得去也回得来');
assert(gs.indexOf('JSON.parse(JSON.stringify(charData.bonds))') >= 0,
    'R5 bonds 深拷贝整体往返——节日账格/被晾旗（letterSent/neglectFiredDay）都在 bonds 内，天然随档');

console.log('---');
console.log('npc-memory-roundtrip v20.38: ' + passed + ' 通过, ' + failed + ' 失败');
process.exit(failed ? 1 : 0);
