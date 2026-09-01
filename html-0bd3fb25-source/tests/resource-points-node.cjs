// resource-points v19.10 P1-7 测试

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
var path = require('path');
var src = fs.readFileSync(path.join(__dirname, '..', 'js/extensions/resource-points.js'), 'utf8');
var wrapped = '(function(window){' + src + '})(mockWindow);';
eval(wrapped);
var R = mockWindow.ResourcePoints;
assert(!!R, 'ResourcePoints 已注册');
assert(R.INITIAL_POINTS.length === 30, '30 资源点 (got ' + R.INITIAL_POINTS.length + ')');
assert(R.listByType('spirit_vein').length === 10, '10 灵脉');
assert(R.listByType('mine').length === 10, '10 矿脉');
assert(R.listByType('herb_garden').length === 10, '10 药园');

// ---- 1. 数据 ----
section('1) 数据校验');
var p1 = R.getPoint('vein_beiming_01');
assert(p1 && p1.type === 'spirit_vein', '北冥灵脉');
assert(p1.output.spiritStone === 30, '产出 30 灵石/天');
assert(p1.defense === 120, 'defense 120');
var p2 = R.getPoint('mine_xuantie_01');
assert(p2 && p2.output.mat_dark_iron === 5, '玄铁矿 mat_dark_iron 5');
var p3 = R.getPoint('herb_xuelian_01');
assert(p3 && p3.output.mat_snow_lotus === 5, '雪莲谷 mat_snow_lotus 5');

// ---- 2. 初始归属 ----
section('2) 初始归属');
var unowned = R.INITIAL_POINTS.filter(function (p) { return !p.ownerSect; });
var owned = R.INITIAL_POINTS.filter(function (p) { return p.ownerSect; });
assert(unowned.length >= 15, '无主 ≥ 15 (got ' + unowned.length + ')');
assert(owned.length >= 8, '有主 ≥ 8 (got ' + owned.length + ')');

// ---- 3. claim ----
section('3) claim 占领');
R.setSpiritStones(1000);
var c1 = R.claim('vein_beiming_01', '玩家宗门');
assert(c1.ok, '占领北冥灵脉 OK (reason=' + c1.reason + ')');
assert(c1.owner === '玩家宗门' && c1.cost === 100, 'owner/cost 正确');

var c2 = R.claim('vein_beiming_01', '其他宗门');
assert(!c2.ok && c2.reason === 'already-owned', '已占领不能 claim');

var c3 = R.claim('vein_xihuang_01', '');
assert(!c3.ok && c3.reason === 'no-sect', '空 sectId 拒');

var c4 = R.claim('vein_xihuang_01', null);
assert(!c4.ok && c4.reason === 'no-sect', 'null sectId 拒');

R.setSpiritStones(50);
var c5 = R.claim('vein_xihuang_01', '玩家宗门');
assert(!c5.ok && c5.reason === 'spiritStones-low', '灵石不足拒');

// ---- 4. attack ----
section('4) attack 攻击');
// vein_donghai_01 是蜀山派，defense 180
var a1 = R.attack('玩家宗门', '蜀山派', 'vein_donghai_01', 100);
assert(a1.ok && !a1.victory, '100 < 180 失败');
var a2 = R.attack('玩家宗门', '蜀山派', 'vein_donghai_01', 200);
assert(a2.ok && a2.victory, '200 > 180 胜利');
assert(R.getPoint('vein_donghai_01').ownerSect === '玩家宗门', 'owner 变更为玩家');

// 自攻
var a3 = R.attack('玩家宗门', '玩家宗门', 'vein_donghai_01', 200);
assert(!a3.ok && a3.reason === 'self-attack', '自攻拒');

// 攻无主
var a4 = R.attack('玩家宗门', '蜀山派', 'vein_xihuang_01', 100);
assert(!a4.ok && a4.reason === 'not-owned', '攻无主拒');

// 不存在
var a5 = R.attack('玩家宗门', '蜀山派', 'rp_xxx', 100);
assert(!a5.ok && a5.reason === 'point-not-found', '不存在拒');

// ---- 5. harvest ----
section('5) harvest 产出 + 衰减');
var before = R.getPoint('vein_beiming_01').exhausted;
var h1 = R.harvest('vein_beiming_01');
assert(h1.ok, '采 OK');
assert(h1.output.spiritStone > 0, '有产出 (got ' + h1.output.spiritStone + ')');
var after = R.getPoint('vein_beiming_01').exhausted;
assert(after > before, 'exhausted 增加 (before=' + before + ', after=' + after + ')');

// 衰减到 max
R.getPoint('vein_beiming_01').exhausted = 0.79;
var h2 = R.harvest('vein_beiming_01');
assert(h2.ok, '采接近满档 OK');
assert(R.getPoint('vein_beiming_01').exhausted >= 0.8, '过 0.8');

// 已停产
R.getPoint('vein_beiming_01').exhausted = 0.8;
var h3 = R.harvest('vein_beiming_01');
assert(!h3.ok && h3.reason === 'exhausted', '停产拒');

// 无主不能采
var h4 = R.harvest('vein_xihuang_01');
assert(!h4.ok && h4.reason === 'not-owned', '无主不能采');

// ---- 6. tickDay 恢复 ----
section('6) tickDay 恢复');
R.getPoint('vein_beiming_01').exhausted = 0.5;
var beforeR = R.getPoint('vein_beiming_01').exhausted;
// 跑 50 天 → -0.005*50 = -0.25
for (var i = 0; i < 50; i++) R.tickDay();
var afterR = R.getPoint('vein_beiming_01').exhausted;
assert(afterR < beforeR, '50 天后 exhausted 降低 (before=' + beforeR + ', after=' + afterR.toFixed(3) + ')');

// 减到 0
R.getPoint('vein_beiming_01').exhausted = 0.001;
R.tickDay();
assert(R.getPoint('vein_beiming_01').exhausted === 0, '到 0 截止');

// ---- 7. listBy* ----
section('7) 列表查询');
var donghai = R.listByRegion('东海');
assert(donghai.length === 3, '东海 3 个 (got ' + donghai.length + ')');
var mines = R.listByType('mine');
assert(mines.length === 10, '10 矿脉');
var playerOwned = R.listByOwner('玩家宗门');
assert(playerOwned.length >= 2, '玩家宗门 ≥ 2 (got ' + playerOwned.length + ')');

// ---- 8. 事件总线 ----
section('8) 事件总线');
assert((listeners['resourcePoint:claim'] || []).length >= 1, 'claim ≥ 1 (got ' + (listeners['resourcePoint:claim'] || []).length + ')');
assert((listeners['resourcePoint:attack'] || []).length >= 2, 'attack ≥ 2');
assert((listeners['resourcePoint:ownerChange'] || []).length >= 2, 'ownerChange ≥ 2');
assert((listeners['resourcePoint:yield'] || []).length >= 1, 'yield ≥ 1');

// ---- 9. StateRegistry ----
section('9) StateRegistry v1');
var snap = mockWindow.StateRegistry.exportAll();
assert(snap.resourcePointConfig, 'resourcePointConfig 已注册');
var rpc = snap.resourcePointConfig && snap.resourcePointConfig.data;
assert(rpc, 'data 可访问');
assert(rpc && rpc.points.length === 30, 'points 30 持久化');
assert(rpc && rpc.history.length >= 3, 'history ≥ 3 (got ' + (rpc ? rpc.history.length : 0) + ')');

// ---- 10. 性能 ----
section('10) 性能 1000 tickDay');
R.setSpiritStones(10000);
// 全 exhausted=0.5
for (var pi = 0; pi < 30; pi++) R.getPoint(R.INITIAL_POINTS[pi].id).exhausted = 0.5;
var t0 = Date.now();
for (var pj = 0; pj < 1000; pj++) R.tickDay();
var dur = Date.now() - t0;
console.log('  1000 tickDay: ' + dur + 'ms');
assert(dur < 200, '1000 tickDay < 200ms');

console.log('\n=========================================');
console.log('resource-points v19.10: ' + pass + ' passed, ' + fail + ' failed');
console.log('=========================================');
process.exit(fail > 0 ? 1 : 0);
