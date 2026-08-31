// cave-facilities v19.16 §10 测试

var pass = 0, fail = 0;
function assert(cond, msg) {
    if (cond) { pass++; console.log('  ✓ ' + msg); }
    else { fail++; console.log('  ✗ FAIL ' + msg); }
}
function section(s) { console.log('\n=== ' + s + ' ==='); }

var listeners = {};
var mockWindow = {
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
var src = fs.readFileSync('D:/Download Game/仙侠世界/js/extensions/cave-facilities.js', 'utf8');
var wrapped = '(function(window){' + src + '})(mockWindow);';
eval(wrapped);
var C = mockWindow.CaveFacilities;
assert(!!C, 'CaveFacilities 已注册');
assert(Object.keys(C.FACILITIES).length === 8, '8 设施 (got ' + Object.keys(C.FACILITIES).length + ')');
assert(Object.keys(C.CAVE_LEVELS).length === 4, '4 档洞府 (got ' + Object.keys(C.CAVE_LEVELS).length + ')');
assert(Object.keys(C.COMPANION_ROLES).length === 3, '3 同伴角色');
assert(C.DAILY_EVENTS.length === 7, '7 小事件');

// ---- 1. 4 档洞府 → 槽位 ----
section('1) 4 档洞府槽位');
assert(C.CAVE_LEVELS['grass_hut'].slots === 1, '草庐 1 槽');
assert(C.CAVE_LEVELS['stone_room'].slots === 2, '石室 2 槽');
assert(C.CAVE_LEVELS['spirit_manor'].slots === 3, '灵府 3 槽');
assert(C.CAVE_LEVELS['immortal_manor'].slots === 4, '仙府 4 槽');
assert(C.getAvailableSlots('cave_1') === 0, 'cave_1 初始 0 槽（未确保）');
C.install('cave_1', 'fac_spirit_gathering');
assert(C.getAvailableSlots('cave_1') === 1, '草庐 1 槽');

// 升级到灵府
C.install('cave_1', 'fac_alchemy_room', 1);
assert(C.install('cave_1', 'fac_forge_table', 2).reason === 'slot-out-of-range', '草庐 2 槽超 拒');
C.uninstall('cave_1', 1);
// 升级到灵府（3 槽）
C.getState().caves['cave_1'].level = 'spirit_manor';
var i3 = C.install('cave_1', 'fac_forge_table', 2);
assert(i3.ok, '灵府 2 槽 OK');

// ---- 2. 8 设施 ----
section('2) 8 设施');
assert(C.FACILITIES['fac_spirit_gathering'].buff.expBoostPct === 30, '聚灵阵 buff');
assert(C.FACILITIES['fac_alchemy_room'].buff.alchemySkill === 15, '丹房 buff');
assert(C.FACILITIES['fac_forge_table'].buff.forgingSkill === 15, '炼器台 buff');
assert(C.FACILITIES['fac_beast_pen'].buff.beastTraining === 0.2, '灵兽栏 buff');
assert(C.FACILITIES['fac_library'].buff.studyTimeMul === 0.8, '藏书阁 buff');
assert(C.FACILITIES['fac_guest_room'].buff.affectionDecayDays === 30, '客房 30 天');
assert(C.FACILITIES['fac_spirit_field'].buff.fieldSpeedPct === 30, '灵田 buff');
assert(C.FACILITIES['fac_meditation'].buff.breakthroughBoost === 0.15, '闭关室 buff');

// ---- 3. install/uninstall ----
section('3) install/uninstall');
var f1 = C.install('cave_2', 'fac_unknown_xxx');
assert(!f1.ok && f1.reason === 'unknown-facility', '未知设施拒');

// 灵府 3 槽
C.getState().caves['cave_2'] = { level: 'spirit_manor', facilities: [], companions: [], history: [] };
C.install('cave_2', 'fac_alchemy_room');  // 自动 0 槽
C.install('cave_2', 'fac_spirit_field');  // 自动 1 槽
C.install('cave_2', 'fac_meditation');    // 自动 2 槽
var f2 = C.install('cave_2', 'fac_library');  // 自动应失败（无空槽）
assert(!f2.ok && f2.reason === 'no-available-slot', '无空槽拒');

// 已占用
var f3 = C.install('cave_2', 'fac_library', 0);
assert(!f3.ok && f3.reason === 'slot-busy', '占用拒');

// 槽位越界
var f4 = C.install('cave_2', 'fac_library', 5);
assert(!f4.ok && f4.reason === 'slot-out-of-range', '越界拒');

var f5 = C.uninstall('cave_2', 1);
assert(f5.ok, 'uninstall 0 槽 OK');
var f6 = C.uninstall('cave_2', 1);
assert(!f6.ok && f6.reason === 'no-facility-in-slot', '空槽 uninstall 拒');

// ---- 4. getFacilities ----
section('4) getFacilities');
var list = C.getFacilities('cave_2');
assert(list.length === 2, '2 设施 (got ' + list.length + ')');
assert(list[0].name === '丹房' || list[0].name === '闭关室', 'name 含中文');
assert(list[0].buff, 'buff 包含');

// ---- 5. 同伴 ----
section('5) 同伴入住');
C.getState().caves['cave_3'] = { level: 'immortal_manor', facilities: [], companions: [], history: [] };
var c1 = C.addCompanion('cave_3', 'npc_x', 'dao_companion');
assert(c1.ok, '道侣入住 OK');
assert(c1.companionId.indexOf('comp_') === 0, 'companionId 前缀');

var c2 = C.addCompanion('cave_3', 'npc_y', 'disciple');
assert(c2.ok, '弟子入住 OK');

var c3 = C.addCompanion('cave_3', 'npc_z', 'special_npc');
assert(c3.ok, 'special_npc 入住 OK');

var c4 = C.addCompanion('cave_3', null, 'dao_companion');
assert(!c4.ok && c4.reason === 'no-npcId', '无 npcId 拒');

var c5 = C.addCompanion('cave_3', 'npc_w', 'unknown_role');
assert(!c5.ok && c5.reason === 'unknown-role', '未知 role 拒');

// 移除
assert(C.removeCompanion('cave_3', c2.companionId), 'removeCompanion OK');
assert(C.removeCompanion('cave_3', c2.companionId) === false, '再删拒');
assert(C.removeCompanion('cave_3', 'invalid') === false, '无效 id');

// ---- 6. 分配设施 ----
section('6) 分配设施');
// cave_3 4 槽（仙府），装 4 个设施
C.install('cave_3', 'fac_spirit_field', 0);
C.install('cave_3', 'fac_alchemy_room', 1);
C.install('cave_3', 'fac_library', 2);
C.install('cave_3', 'fac_meditation', 3);

// 道侣 (c1) → 灵田 (0) OK
var a1 = C.assignCompanionToFacility('cave_3', c1.companionId, 0);
assert(a1.ok, '道侣分配灵田 OK');

// 道侣 → 灵田 失败重复
var a2 = C.assignCompanionToFacility('cave_3', c1.companionId, 0);
assert(a2.ok, '重复分配 OK（覆盖）');

// 道侣 → 丹房 (1) 允许
var a3 = C.assignCompanionToFacility('cave_3', c1.companionId, 1);
assert(a3.ok, '道侣→丹房 OK');

// 道侣 → 藏书阁 (2) 不允许（角色 mismatch）
var a4 = C.assignCompanionToFacility('cave_3', c1.companionId, 2);
assert(!a4.ok && a4.reason === 'role-facility-mismatch', '道侣→藏书阁 mismatch');

// 无效 slot
var a5 = C.assignCompanionToFacility('cave_3', c1.companionId, 10);
assert(!a5.ok && a5.reason === 'no-facility-in-slot', '无效 slot');

// 不存在 cave
var a6 = C.assignCompanionToFacility('cave_xxx', c1.companionId, 0);
assert(!a6.ok && a6.reason === 'cave-not-found', '不存在 cave');

// 不存在 companion
var a7 = C.assignCompanionToFacility('cave_3', 'comp_invalid', 0);
assert(!a7.ok && a7.reason === 'companion-not-found', '不存在 companion');

// ---- 7. tickDay ----
section('7) tickDay 小事件');
listeners = {};
// cave_3 4 设施 + 2 同伴已分配
var td1 = C.tickDay('cave_3');
assert(td1.ok, 'tickDay OK');
// 7 个事件 × 概率 0.05~0.10，期望 ~0.5 触发/天；跑 200 天
var triggered = 0;
for (var di = 0; di < 200; di++) {
    var t = C.tickDay('cave_3');
    triggered += t.events.length;
}
console.log('  200 天 tickDay cave_3 触发: ' + triggered);
assert(triggered >= 1, '至少 1 触发 (got ' + triggered + ')');

// 无同伴的 cave 不应触发
C.getState().caves['cave_4'] = { level: 'spirit_manor', facilities: [], companions: [], history: [] };
C.install('cave_4', 'fac_spirit_gathering', 0);
listeners = [];
for (var dj = 0; dj < 100; dj++) C.tickDay('cave_4');
assert((listeners['cave:dailyEvent'] || []).length === 0, '无同伴 0 事件');

// ---- 8. getBuff / getBuffList ----
section('8) getBuff / getBuffList');
// 4 槽已满，替换 1 个为聚灵阵测试 expBoostPct
C.uninstall('cave_3', 3); // 移除闭关室
C.install('cave_3', 'fac_spirit_gathering', 3); // 装聚灵阵
var buffExp = C.getBuff('cave_3', 'expBoostPct');
assert(buffExp === 30, 'expBoostPct = 聚灵阵 30 (got ' + buffExp + ')');
var buffAlchemy = C.getBuff('cave_3', 'alchemySkill');
assert(buffAlchemy === 15, 'alchemySkill = 丹房 15');
var buffField = C.getBuff('cave_3', 'fieldSpeedPct');
assert(buffField === 30, 'fieldSpeedPct = 灵田 30');
var buffZero = C.getBuff('cave_3', 'unknownAttr');
assert(buffZero === 0, '未知 attr 0');

var bl = C.getBuffList('cave_3');
assert(bl.length === 4, '4 设施 buff 列表 (got ' + bl.length + ')');
assert(bl[0].name && bl[0].buff, 'buff 项含 name+buff');

// ---- 9. 事件总线 ----
section('9) 事件总线');
assert((listeners['cave:dailyEvent'] || []).length === 0, 'cave_4 0 事件 (上面)');
// 重新监听 cave_3
listeners = {};
for (var dk = 0; dk < 100; dk++) C.tickDay('cave_3');
assert((listeners['cave:dailyEvent'] || []).length >= 1, 'cave_3 ≥ 1 事件');

// ---- 10. StateRegistry ----
section('10) StateRegistry v1');
var snap = mockWindow.StateRegistry.exportAll();
assert(snap.caveSystem, 'caveSystem 已注册');
var cs = snap.caveSystem && snap.caveSystem.data;
assert(cs, 'data 可访问');
assert(cs && Object.keys(cs.caves).length >= 3, '≥ 3 洞府 (got ' + Object.keys(cs.caves).length + ')');

// ---- 11. 性能 ----
section('11) 性能');
// 100 个洞府 × 100 天 tickDay
for (var ci = 0; ci < 100; ci++) {
    C.getState().caves['perf_' + ci] = { level: 'immortal_manor', facilities: [], companions: [], history: [] };
    C.install('perf_' + ci, 'fac_spirit_gathering', 0);
    C.install('perf_' + ci, 'fac_alchemy_room', 1);
    C.install('perf_' + ci, 'fac_library', 2);
    C.addCompanion('perf_' + ci, 'npc_' + ci, 'disciple');
    C.assignCompanionToFacility('perf_' + ci, C.getState().caves['perf_' + ci].companions[0].companionId, 2);
}
var t0 = Date.now();
for (var ck = 0; ck < 100; ck++) {
    for (var cj = 0; cj < 100; cj++) {
        C.tickDay('perf_' + cj);
    }
}
var dur = Date.now() - t0;
console.log('  100 洞府 × 100 天 tickDay: ' + dur + 'ms');
assert(dur < 200, '< 200ms');

console.log('\n=========================================');
console.log('cave-facilities v19.16: ' + pass + ' passed, ' + fail + ' failed');
console.log('=========================================');
process.exit(fail > 0 ? 1 : 0);
