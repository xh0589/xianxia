// formation-system v19.7 P1-4 测试
// 验证 5 维：阵碑 / 阵法 / 布阵 / tickTurn / buff / 事件 / StateRegistry / 性能

var pass = 0, fail = 0;
function assert(cond, msg) {
    if (cond) { pass++; console.log('  ✓ ' + msg); }
    else { fail++; console.log('  ✗ FAIL ' + msg); }
}
function section(s) { console.log('\n=== ' + s + ' ==='); }

// ---- mock window ----
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
var src = fs.readFileSync(path.join(__dirname, '..', 'js/extensions/formation-system.js'), 'utf8');
var wrapped = '(function(window){' + src + '})(mockWindow);';
eval(wrapped);
var F = mockWindow.FormationSystem;
assert(!!F, 'FormationSystem 已注册');
assert(F.FORMATION_STONES.length === 8, '阵碑 8 张 (got ' + F.FORMATION_STONES.length + ')');
assert(F.FORMATIONS.length === 8, '阵法 8 张 (got ' + F.FORMATIONS.length + ')');

// ---- 1. 阵碑 ----
section('1) 阵碑注册');
assert(mockWindow.itemById['fmt_stone_basic'] && mockWindow.itemById['fmt_stone_basic'].implemented, '基础阵石 implemented');
assert(mockWindow.itemById['fmt_core_5e'] && mockWindow.itemById['fmt_core_5e']._stoneType === 'core', '五行阵心 type=core');
assert(F.FORMATION_STONES.filter(function (s) { return s.tier === 1; }).length === 2, 'tier 1 阵碑 2 张');
assert(F.FORMATION_STONES.filter(function (s) { return s.tier === 3; }).length === 3, 'tier 3 阵碑 3 张');

// ---- 2. 阵法 ----
section('2) 阵法按类型');
assert(F.listFormations('combat').length === 4, '随身战阵 4 张');
assert(F.listFormations('field').length === 2, '洞府阵 2 张');
assert(F.listFormations('sect').length === 2, '宗门阵 2 张');
var three = F.getFormation('fmt_three_talent');
assert(three && three.maxDurability === 10, '三才阵耐久 10');
var dipper = F.getFormation('fmt_dipper');
assert(dipper && dipper.buff.critPct === 15, '北斗阵 buff.critPct=15');

// ---- 3. 布阵校验 ----
section('3) 布阵校验');
// 准备材料：三才阵需要 3 基础 + 3 铁
mockWindow.inventory.slots = [
    { itemId: 'fmt_stone_basic', count: 5 },
    { itemId: 'fmt_flag_iron', count: 5 },
    { itemId: 'fmt_stone_basic', count: 5 } // 多个槽位
];
F.setSpiritStones(1000);
var d1 = F.deployFormation('fmt_three_talent');
assert(d1.ok, '三才阵布阵 OK (reason=' + d1.reason + ')');
assert(d1.durability === 10, '耐久 10');
assert(d1.expireDay === 1010, '10 天后到期');

// 不可重复
var d2 = F.deployFormation('fmt_three_talent');
assert(!d2.ok && d2.reason === 'slot-busy', '同槽位不可重复');

// 拆掉
var w1 = F.withdrawFormation('fmt_three_talent');
assert(w1.ok, '撤销 OK');
mockWindow.inventory.slots = [
    { itemId: 'fmt_stone_basic', count: 5 },
    { itemId: 'fmt_flag_iron', count: 5 }
];
var d3 = F.deployFormation('fmt_three_talent');
assert(d3.ok, '撤销后重新布 OK (reason=' + d3.reason + ')');

// 材料不足
mockWindow.inventory.slots = [{ itemId: 'fmt_stone_basic', count: 1 }];
F.withdrawFormation('fmt_three_talent');
var d4 = F.deployFormation('fmt_three_talent');
assert(!d4.ok && d4.reason === 'materials-missing', '材料不足拒');

// 不存在的阵
var d5 = F.deployFormation('fmt_xxx');
assert(!d5.ok && d5.reason === 'formation-not-found', '不存在阵拒');

// ---- 4. tickTurn + 耐久 + 灵石 ----
section('4) tickTurn');
mockWindow.inventory.slots = [
    { itemId: 'fmt_stone_basic', count: 5 },
    { itemId: 'fmt_flag_iron', count: 5 }
];
F.setSpiritStones(1000);
F.deployFormation('fmt_three_talent'); // 首期扣 3 灵石
assert(F.getState().combat.durability === 10, '布阵后耐久 10');
assert(F.getState().spiritStones === 997, '布阵后灵石 1000-3=997');
var t1 = F.tickTurn();
assert(t1.consumed === 3, 'tickTurn 扣 3 灵石');
assert(F.getState().combat.durability === 9, 'tickTurn 耐久 9');
assert(F.getState().spiritStones === 994, 'tickTurn 后 994');

// 10 次后耐久归 0 → 崩溃
for (var i = 0; i < 10; i++) F.tickTurn();
assert(F.getState().combat.formationId === null, '耐久耗尽自动崩溃');
assert((listeners['formation:collapse'] || []).length >= 1, '崩溃事件触发');

// ---- 5. 灵石不足崩溃 ----
section('5) 灵石不足崩溃');
mockWindow.inventory.slots = [
    { itemId: 'fmt_stone_basic', count: 5 },
    { itemId: 'fmt_flag_iron', count: 5 }
];
F.setSpiritStones(1000);
F.deployFormation('fmt_three_talent'); // 997
F.setSpiritStones(2); // 不足 3
var t2 = F.tickTurn();
assert(t2.collapsed.length === 1, '灵石不足 tickTurn 崩溃');
assert(F.getState().combat.formationId === null, '崩溃后清空');

// ---- 6. getBuff ----
section('6) getBuff');
mockWindow.inventory.slots = [
    { itemId: 'fmt_stone_basic', count: 10 },
    { itemId: 'fmt_core_5e', count: 1 },
    { itemId: 'fmt_flag_iron', count: 5 }
];
F.setSpiritStones(1000);
F.withdrawFormation('fmt_three_talent');
F.deployFormation('fmt_five_element');
assert(F.getBuff('combat', 'mainElementBoostPct') === 25, '五行阵 mainElementBoostPct=25');
assert(F.hasBuff('combat', 'mainElementBoostPct'), 'hasBuff true');
assert(F.getActiveFormation('combat').id === 'fmt_five_element', '当前战阵 五行阵');
assert(F.getBuff('combat', 'mainElementBoostPct') === 25, '五行阵 mainElementBoostPct=25');
assert(F.hasBuff('combat', 'mainElementBoostPct'), 'hasBuff true');
assert(F.getActiveFormation('combat').id === 'fmt_five_element', '当前战阵 五行阵');

// ---- 7. 多槽位 ----
section('7) 多槽位');
mockWindow.inventory.slots = [
    { itemId: 'fmt_stone_basic', count: 30 },
    { itemId: 'fmt_eye_spirit', count: 2 },
    { itemId: 'fmt_flag_iron', count: 10 },
    { itemId: 'fmt_flag_gold', count: 4 }
];
F.setSpiritStones(1000);
// 先撤掉之前的
F.withdrawFormation('fmt_five_element');
var d6 = F.deployFormation('fmt_spirit_gather'); // field
assert(d6.ok, '聚灵阵 OK (reason=' + d6.reason + ')');
assert(F.getState().field.formationId === 'fmt_spirit_gather', '洞府阵就位');
var d7 = F.deployFormation('fmt_mountain_guard'); // sect
assert(d7.ok, '护山阵 OK');
assert(F.getBuff('field', 'expBoostPct') === 30, '聚灵 expBoostPct=30');
assert(F.getBuff('sect', 'sectAttackReducePct') === 50, '护山 sectAttackReducePct=50');

// ---- 8. 事件总线 ----
section('8) 事件总线');
assert((listeners['formation:deploy'] || []).length >= 3, 'deploy 事件 ≥ 3 (got ' + (listeners['formation:deploy'] || []).length + ')');
assert((listeners['formation:withdraw'] || []).length >= 2, 'withdraw 事件 ≥ 2');
assert((listeners['formation:collapse'] || []).length >= 1, 'collapse 事件 ≥ 1');

// ---- 9. StateRegistry ----
section('9) StateRegistry v1');
var snap = mockWindow.StateRegistry.exportAll();
assert(snap.formationConfig, 'formationConfig 已注册');
var fc = snap.formationConfig && snap.formationConfig.data;
assert(fc, 'formationConfig.data 可访问');
assert(fc && fc.history.length >= 3, 'history ≥ 3 (got ' + (fc ? fc.history.length : 0) + ')');
assert(fc && fc.history.length <= 10, 'history ≤ 10');
assert(fc && fc.field && fc.field.formationId === 'fmt_spirit_gather', 'field 持久化');

// ---- 10. 性能 ----
section('10) 性能 1000 次 tickTurn');
F.withdrawFormation('fmt_spirit_gather');
F.withdrawFormation('fmt_mountain_guard');
mockWindow.inventory.slots = [
    { itemId: 'fmt_stone_basic', count: 30 },
    { itemId: 'fmt_eye_spirit', count: 2 },
    { itemId: 'fmt_flag_iron', count: 10 },
    { itemId: 'fmt_flag_gold', count: 4 }
];
F.setSpiritStones(1000);
F.deployFormation('fmt_three_talent');
F.deployFormation('fmt_spirit_gather');
F.deployFormation('fmt_mountain_guard');
var t0 = Date.now();
for (var pi = 0; pi < 1000; pi++) F.tickTurn();
var dur = Date.now() - t0;
console.log('  1000 次 tickTurn: ' + dur + 'ms');
assert(dur < 200, '1000 次 tickTurn < 200ms');

console.log('\n=========================================');
console.log('formation-system v19.7: ' + pass + ' passed, ' + fail + ' failed');
console.log('=========================================');
process.exit(fail > 0 ? 1 : 0);
