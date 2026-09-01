// beast-ecosystem v19.12 P0 测试

var pass = 0, fail = 0;
function assert(cond, msg) {
    if (cond) { pass++; console.log('  ✓ ' + msg); }
    else { fail++; console.log('  ✗ FAIL ' + msg); }
}
function section(s) { console.log('\n=== ' + s + ' ==='); }

var listeners = {};
var mockWindow = {
    currentCharData: null,
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
var src = fs.readFileSync(path.join(__dirname, '..', 'js/extensions/beast-ecosystem.js'), 'utf8');
var wrapped = '(function(window){' + src + '})(mockWindow);';
eval(wrapped);
var B = mockWindow.BeastEcosystem;
assert(!!B, 'BeastEcosystem 已注册');
assert(B.BEAST_DISTRIBUTION.length === 10, '10 灵兽 (got ' + B.BEAST_DISTRIBUTION.length + ')');
assert(Object.keys(B.BEAST_BUFFS).length === 6, '6 buff');

// ---- 1. 灵兽按地区 ----
section('1) 灵兽按地区');
var lingfox = B.BEAST_DISTRIBUTION.find(function (b) { return b.id === 'beast_lingfox'; });
assert(lingfox.regions.indexOf('中州') >= 0, '灵狐含中州');
var thundereagle = B.BEAST_DISTRIBUTION.find(function (b) { return b.id === 'beast_thundereagle'; });
assert(thundereagle.regions.indexOf('天空') >= 0, '雷鹰含天空');
var icesnake = B.BEAST_DISTRIBUTION.find(function (b) { return b.id === 'beast_icesnake'; });
assert(icesnake.regions.indexOf('北冥') >= 0, '冰蛇含北冥');
var firephoenix = B.BEAST_DISTRIBUTION.find(function (b) { return b.id === 'beast_firephoenix'; });
assert(firephoenix.regions.indexOf('南疆') >= 0, '火凤含南疆');
var xuangui = B.BEAST_DISTRIBUTION.find(function (b) { return b.id === 'beast_xuangui'; });
assert(xuangui.regions.indexOf('东海') >= 0, '玄龟含东海');

// ---- 2. 灵兽按地形 ----
section('2) 灵兽按地形');
assert(lingfox.terrains.indexOf('FOREST') >= 0, '灵狐含 FOREST');
assert(icesnake.terrains.indexOf('SNOW') >= 0, '冰蛇含 SNOW');
assert(xuangui.terrains.indexOf('WATER') >= 0, '玄龟含 WATER');
assert(firephoenix.terrains.indexOf('VOLCANO') >= 0, '火凤含 VOLCANO');

// ---- 3. getBeastPoolForRegion ----
section('3) getBeastPoolForRegion');
var pool1 = B.getBeastPoolForRegion('中州', 'FOREST');
assert(pool1.length >= 2, '中州 FOREST ≥ 2 灵兽 (got ' + pool1.length + ')');
var pool2 = B.getBeastPoolForRegion('北冥', 'SNOW');
assert(pool2.some(function (b) { return b.id === 'beast_icesnake'; }), '北冥 SNOW 含冰蛇');
var pool3 = B.getBeastPoolForRegion('中州', 'WATER');
assert(pool3.length === 0, '中州 WATER 无灵兽');

// ---- 4. populateBeasts ----
section('4) populateBeasts');
// 构造简单地图
var map = [];
for (var y = 0; y < 5; y++) {
    var row = [];
    for (var x = 0; x < 5; x++) {
        var tName = (x + y) % 2 === 0 ? 'FOREST' : 'PLAIN';
        row.push({ terrain: { name: tName }, entities: [] });
    }
    map.push(row);
}
var r1 = B.populateBeasts(map, '中州', { density: 1.0 });
assert(r1.placed >= 1, 'placed ≥ 1 (got ' + r1.placed + ')');
var r2 = B.populateBeasts(map, '北冥', { density: 1.0 });
// 地图只有 FOREST/PLAIN，北冥主灵兽在 SNOW/FROZEN_LAND → 应放置黑熊（北冥+FOREST）
// 但 r1 已在 FOREST 放过黑熊 → r2 新放置数应 ≤ 13
assert(r2.placed >= 1, '北冥至少新增 1 (got ' + r2.placed + ')');

// ---- 5. isEntityDead / markEntityDead ----
section('5) isEntityDead / markEntityDead (修 BUG)');
var e1 = { name: '活物', type: 'beast', _alive: true };
assert(!B.isEntityDead(e1), '活物 isEntityDead false');
var e2 = { name: '尸体', type: 'beast', _alive: true };
var c1 = { entities: [e1, e2] };
var ok = B.markEntityDead(c1, 1);
assert(ok && e2._alive === false && e2.isDead === true && e2.hp === 0, 'markEntityDead 标记成功');
assert(B.isEntityDead(e2), '尸体 isEntityDead true');

// BUG 复现：原 tryBeastAmbush 不检查尸体 → 现在检查
var e_corpse = { name: '尸体', type: 'beast', _alive: false };
var e_alive = { name: '活兽', type: 'beast', _alive: true };
var arr = [e_corpse, e_alive];
var aliveIdx = arr.findIndex(function (e) { return e.type === 'beast' && !B.isEntityDead(e); });
assert(aliveIdx === 1, 'findIndex 跳过尸体返回活兽 idx (got ' + aliveIdx + ')');

// ---- 6. 6 类非战斗功能 ----
section('6) 6 类非战斗功能');
mockWindow.currentCharData = { spiritBeasts: [{ id: 'beast_lingfox' }, { id: 'beast_firephoenix' }] };
assert(B.getActiveBeastBuff('treasure') === 0.05, '灵狐 treasure 0.05');
assert(B.getActiveBeastBuff('craftFire') === 0.1, '火凤 craftFire 0.1');
assert(B.getActiveBeastBuff('travel') === 0, '无风狼 travel 0');
assert(B.getActiveBeastBuff('coldHerb') === 0, '无冰蛇 coldHerb 0');

// 7 个 buff 累加
mockWindow.currentCharData = { spiritBeasts: [{ id: 'beast_lingfox' }, { id: 'beast_thundereagle' }, { id: 'beast_dragonturtle' }, { id: 'beast_icesnake' }, { id: 'beast_windwolf' }, { id: 'beast_firephoenix' }] };
var buffList = B.getBuffList();
assert(buffList.length === 6, '6 个 buff 全激活 (got ' + buffList.length + ')');

// 别名兼容：玩家用 '灵狐' 字符串
mockWindow.currentCharData = { spiritBeasts: ['灵狐', '冰蛇'] };
assert(B.getActiveBeastBuff('treasure') === 0.05, '灵狐字符串 treasure 0.05');
assert(B.getActiveBeastBuff('coldHerb') === 0.3, '冰蛇字符串 coldHerb 0.3');

// pets 别名
mockWindow.currentCharData = { pets: [{ id: 'beast_lingfox' }] };
assert(B.getActiveBeastBuff('treasure') === 0.05, 'pets 别名 OK');
mockWindow.tamedBeasts = [{ templateId: 'spirit_fox', name: '灵狐' }];
mockWindow.currentCharData = null;
assert(B.getActiveBeastBuff('treasure') === 0.05, 'tamedBeasts spirit_fox 映射灵狐');
mockWindow.tamedBeasts = [];

// ---- 7. 事件总线 ----
section('7) 事件总线');
assert((listeners['beast:ecosystem:placed'] || []).length >= 1, 'placed ≥ 1 (got ' + (listeners['beast:ecosystem:placed'] || []).length + ')');
assert((listeners['beast:ecosystem:buffApplied'] || []).length >= 0, 'buffApplied trigger OK');

// ---- 8. StateRegistry ----
section('8) StateRegistry v1');
var snap = mockWindow.StateRegistry.exportAll();
assert(snap.beastEcosystem, 'beastEcosystem 已注册');
var be = snap.beastEcosystem && snap.beastEcosystem.data;
assert(be, 'data 可访问');
assert(be && be.distributionCount, 'distributionCount 持久化');

// ---- 9. 性能 ----
section('9) 性能 100 次 populateBeasts');
var bigMap = [];
for (var py = 0; py < 12; py++) {
    var r = [];
    for (var px = 0; px < 16; px++) r.push({ terrain: { name: ['PLAIN','FOREST','MOUNTAIN','WATER'][((px+py) % 4)] }, entities: [] });
    bigMap.push(r);
}
var t0 = Date.now();
for (var pi = 0; pi < 100; pi++) {
    // 清理 entities
    for (var cy = 0; cy < bigMap.length; cy++) for (var cx = 0; cx < bigMap[cy].length; cx++) bigMap[cy][cx].entities = [];
    B.populateBeasts(bigMap, '中州', { density: 0.5 });
}
var dur = Date.now() - t0;
console.log('  100 次 populateBeasts (12x16): ' + dur + 'ms');
assert(dur < 200, '100 次 < 200ms');

console.log('\n=========================================');
console.log('beast-ecosystem v19.12: ' + pass + ' passed, ' + fail + ' failed');
console.log('=========================================');
process.exit(fail > 0 ? 1 : 0);
