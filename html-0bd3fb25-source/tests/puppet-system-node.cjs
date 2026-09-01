// puppet-system v19.8 P1-5 测试

var pass = 0, fail = 0;
function assert(cond, msg) {
    if (cond) { pass++; console.log('  ✓ ' + msg); }
    else { fail++; console.log('  ✗ FAIL ' + msg); }
}
function section(s) { console.log('\n=== ' + s + ' ==='); }

var listeners = {};
var mockWindow = {
    inventory: { slots: [] },
    itemById: {},
    WorldCalendar: { day: 1000 },
    EventBus: { emit: function (name, payload) { (listeners[name] = listeners[name] || []).push(payload); } },
    StateRegistry: {
        _handlers: {},
        register: function (k, handlers) { mockWindow.StateRegistry._handlers[k] = handlers; return function () { delete mockWindow.StateRegistry._handlers[k]; }; },
        exportAll: function () {
            var out = {};
            Object.keys(mockWindow.StateRegistry._handlers).forEach(function (k) {
                var h = mockWindow.StateRegistry._handlers[k];
                if (h.export) out[k] = { version: h.version || 1, data: h.export() };
            });
            return out;
        }
    }
};
var fs = require('fs');
var path = require('path');
var src = fs.readFileSync(path.join(__dirname, '..', 'js/extensions/puppet-system.js'), 'utf8');
var wrapped = '(function(window){' + src + '})(mockWindow);';
eval(wrapped);
var P = mockWindow.PuppetSystem;
assert(!!P, 'PuppetSystem 已注册');
assert(P.PARTS.core.length === 4, '核心 4 件 (got ' + P.PARTS.core.length + ')');
assert(P.PARTS.body.length === 3, '躯体 3 件');
assert(P.PARTS.weapon.length === 4, '武装 4 件');
assert(P.PARTS.pattern.length === 4, '灵纹 4 件');
assert(P.PUPPETS.length === 8, '傀儡 8 张 (got ' + P.PUPPETS.length + ')');

// ---- 1. 部件注册 ----
section('1) 部件注册 itemById');
assert(mockWindow.itemById['pup_core_iron'] && mockWindow.itemById['pup_core_iron'].implemented, '铁芯 implemented');
assert(mockWindow.itemById['pup_core_iron']._partCategory === 'core', '铁芯 _partCategory=core');
assert(mockWindow.itemById['pup_pattern_harvest']._partCategory === 'pattern', '采集灵纹 pattern');

// ---- 2. 傀儡数据 ----
section('2) 傀儡定义');
var w_basic = P.getPuppetTemplate('pup_warrior_basic');
assert(w_basic && w_basic.parts.core === 'pup_core_iron', '基础战斗傀儡 铁芯');
assert(w_basic.cost === 50, '基础战斗傀儡 cost 50');
var g_elite = P.getPuppetTemplate('pup_guard_elite');
assert(g_elite && g_elite.parts.core === 'pup_core_gold', '金盾守卫 金芯');
assert(g_elite.role === 'guard', 'role guard');

// ---- 3. craft 校验 ----
section('3) craft 校验');
// 材料不足
mockWindow.inventory.slots = [];
P.setSpiritStones(1000);
var c1 = P.craft('pup_warrior_basic');
assert(!c1.ok && c1.reason === 'materials-missing', '材料不足拒');

// 准备材料
mockWindow.inventory.slots = [
    { itemId: 'pup_core_iron', count: 1 },
    { itemId: 'pup_body_medium', count: 1 },
    { itemId: 'pup_weapon_sword', count: 1 },
    { itemId: 'pup_pattern_aggressive', count: 1 }
];
var c2 = P.craft('pup_warrior_basic');
assert(c2.ok, '基础战斗傀儡制造 OK (reason=' + c2.reason + ')');
assert(c2.puppet.durability === 200, '耐久 200');
assert(c2.puppet.combatPower > 0, '战力 > 0');
assert(c2.puppet.id === 'pup_inst_1', '实例 ID pup_inst_1');

// 灵石不足
mockWindow.inventory.slots = [
    { itemId: 'pup_core_silver', count: 1 },
    { itemId: 'pup_body_medium', count: 1 },
    { itemId: 'pup_weapon_dual', count: 1 },
    { itemId: 'pup_pattern_aggressive', count: 1 }
];
P.setSpiritStones(50);
var c3 = P.craft('pup_warrior_advanced');
assert(!c3.ok && c3.reason === 'spiritStones-low', '灵石不足拒');

// 不存在
var c4 = P.craft('pup_xxx');
assert(!c4.ok && c4.reason === 'puppet-not-found', '不存在拒');

// ---- 4. deploy / recall ----
section('4) deploy / recall');
var inst1 = P.getPuppet('pup_inst_1');
var d1 = P.deploy('pup_inst_1', { role: 'combat', location: '宗门大殿' });
assert(d1.ok, '部署 OK (reason=' + d1.reason + ')');
assert(inst1.deployed === true, '傀儡 deployed=true');
assert(inst1.role === 'combat', 'role=combat');

var d2 = P.deploy('pup_inst_1');
assert(!d2.ok && d2.reason === 'already-deployed', '不可重复部署');

var r1 = P.recall('pup_inst_1');
assert(r1.ok, '召回 OK');
assert(inst1.deployed === false, '已召回 deployed=false');

// 不存在
var d3 = P.deploy('pup_xxx');
assert(!d3.ok && d3.reason === 'puppet-not-found', '不存在部署拒');

// ---- 5. tickDay + 耐久 + 灵石 ----
section('5) tickDay');
P.setSpiritStones(1000);
// 重新部署
P.deploy('pup_inst_1', { role: 'combat' });
assert(inst1.durability === 200, '部署后耐久 200');
var t1 = P.tickDay();
assert(t1.consumed === 5, 'tickDay 扣 5 灵石 (combat cost 5)');
assert(inst1.durability === 198, 'combat 耐久 -2');

// 9 次 tickDay → 耐久 200-20=180
for (var i = 0; i < 9; i++) P.tickDay();
assert(inst1.durability === 180, '9 次 tickDay 后耐久 180');

// 灵石不足召回
P.setSpiritStones(3);
var t2 = P.tickDay();
assert(inst1.deployed === false, '灵石不足自动召回');

// ---- 6. 修复 ----
section('6) repair');
P.setSpiritStones(1000);
P.tickDay(); // 已是 deployed=false
var rep1 = P.repair('pup_inst_1');
assert(rep1.ok, '修复 OK');
assert(inst1.durability === inst1.maxDurability, '修复后满耐久');

// ---- 7. 多种傀儡 ----
section('7) 多种傀儡');
mockWindow.inventory.slots = [];
// 准备金盾守卫
mockWindow.inventory.slots = [
    { itemId: 'pup_core_gold', count: 1 },
    { itemId: 'pup_body_heavy', count: 1 },
    { itemId: 'pup_weapon_sword', count: 1 },
    { itemId: 'pup_pattern_defensive', count: 1 }
];
P.setSpiritStones(2000);
var c5 = P.craft('pup_guard_elite');
assert(c5.ok, '金盾守卫制造 OK');
P.deploy('pup_inst_2', { role: 'guard', location: '宗门山门' });
P.setSpiritStones(10000);
var t3 = P.tickDay();
assert(t3.consumed === 10, '单守卫傀儡扣 10 灵石 (got ' + t3.consumed + ')');

// ---- 8. 事件总线 ----
section('8) 事件总线');
assert((listeners['puppet:craft'] || []).length >= 2, 'craft 事件 ≥ 2 (got ' + (listeners['puppet:craft'] || []).length + ')');
assert((listeners['puppet:deploy'] || []).length >= 2, 'deploy 事件 ≥ 2');
assert((listeners['puppet:recall'] || []).length >= 2, 'recall 事件 ≥ 2');

// ---- 9. StateRegistry ----
section('9) StateRegistry v1');
var snap = mockWindow.StateRegistry.exportAll();
assert(snap.puppetConfig, 'puppetConfig 已注册');
var pc = snap.puppetConfig && snap.puppetConfig.data;
assert(pc, 'puppetConfig.data 可访问');
assert(pc && pc.puppets.length === 2, 'puppets 2 (got ' + (pc ? pc.puppets.length : 0) + ')');
assert(pc && pc.puppets[0].totalYield, 'totalYield 已存');

// ---- 10. 性能 ----
section('10) 性能');
// 加 5 个傀儡
for (var pi = 0; pi < 5; pi++) {
    mockWindow.inventory.slots = [
        { itemId: 'pup_core_iron', count: 1 },
        { itemId: 'pup_body_medium', count: 1 },
        { itemId: 'pup_weapon_sword', count: 1 },
        { itemId: 'pup_pattern_aggressive', count: 1 }
    ];
    P.craft('pup_warrior_basic');
    P.deploy('pup_inst_' + (pi + 3), { role: 'combat' });
}
P.setSpiritStones(10000);
var t0 = Date.now();
for (var pj = 0; pj < 1000; pj++) P.tickDay();
var dur = Date.now() - t0;
console.log('  1000 次 tickDay: ' + dur + 'ms');
assert(dur < 200, '1000 次 tickDay < 200ms');

console.log('\n=========================================');
console.log('puppet-system v19.8: ' + pass + ' passed, ' + fail + ' failed');
console.log('=========================================');
process.exit(fail > 0 ? 1 : 0);
