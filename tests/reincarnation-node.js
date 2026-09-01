// reincarnation v19.13 §8 测试

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
var src = fs.readFileSync('D:/Download Game/仙侠世界/js/extensions/reincarnation.js', 'utf8');
var wrapped = '(function(window){' + src + '})(mockWindow);';
eval(wrapped);
var R = mockWindow.Reincarnation;
assert(!!R, 'Reincarnation 已注册');
assert(Object.keys(R.REALM_POINTS).length === 7, '7 境界 (got ' + Object.keys(R.REALM_POINTS).length + ')');
assert(Object.keys(R.INHERIT_OPTIONS).length === 5, '5 继承选项');
assert(R.VALID_DEEDS.length === 10, '10 deeds');

// ---- 1. 6 类遗产点 ----
section('1) 6 类遗产点');
assert(R.REALM_POINTS['练气'] === 1, '练气 1');
assert(R.REALM_POINTS['筑基'] === 3, '筑基 3');
assert(R.REALM_POINTS['金丹'] === 8, '金丹 8');
assert(R.REALM_POINTS['元婴'] === 20, '元婴 20');
assert(R.REALM_POINTS['化神'] === 50, '化神 50');
assert(R.REALM_POINTS['渡劫'] === 120, '渡劫 120');
assert(R.REALM_POINTS['大乘'] === 300, '大乘 300');
assert(R.SECT_POSITION_POINTS['掌门'] === 80, '掌门 80');
assert(R.DEATH_REASON_POINTS['death-natural'] === 30, '寿终 +30');
assert(R.DEATH_REASON_POINTS['death-combat'] === 0, '战死 +0');
assert(R.DEATH_REASON_POINTS['ascend'] === 50, '飞升 +50');

// ---- 2. computeInheritancePoints ----
section('2) computeInheritancePoints');
var p1 = R.computeInheritancePoints({ realm: '元婴', lastDeathReason: 'death-combat' });
assert(p1.total === 20, '元婴+战死 20 遗产 (got ' + p1.total + ')');
assert(p1.breakdown.realm.points === 20, 'breakdown.realm=20');

var p2 = R.computeInheritancePoints({ realm: '金丹', sectPosition: '长老', lastDeathReason: 'death-combat' });
assert(p2.total === 8 + 40, '金丹+长老+战死 48 (got ' + p2.total + ')');

var p3 = R.computeInheritancePoints({ realm: '大乘', sectPosition: '掌门', lastDeathReason: 'death-natural', keyEvents: ['e1','e2','e3'], craftAchievements: { pills: 200, weapons: 20 } });
// 300+80+30+9+15+20 = 454
assert(p3.total === 454, '大乘+掌门+寿终+3事件+丹药+法器 = 454 (got ' + p3.total + ')');
assert(p3.breakdown.relationship.points === 0, '无关系 0');

// 关系 ≥ 80
var p4 = R.computeInheritancePoints({
    realm: '金丹',
    relationships: [
        { id: 'a', affection: 90 },
        { id: 'b', affection: 80 },
        { id: 'c', affection: 50 }
    ]
});
assert(p4.breakdown.relationship.count === 2, '2 个高关系 (got ' + p4.breakdown.relationship.count + ')');
assert(p4.breakdown.relationship.points === 10, '关系 10 (2*5)');

// 关系上限 50
var p5 = R.computeInheritancePoints({
    realm: '练气',
    relationships: new Array(20).fill({ affection: 100 })
});
assert(p5.breakdown.relationship.points === 50, '关系上限 50 (got ' + p5.breakdown.relationship.points + ')');

// ---- 3. canReincarnate ----
section('3) canReincarnate');
assert(R.canReincarnate({ realm: '练气' }), '有 realm 可转世');
assert(!R.canReincarnate(null), 'null 不可转世');
assert(!R.canReincarnate({}), '无 realm 不可转世');

// ---- 4. startReincarnation ----
section('4) startReincarnation');
var s1 = R.startReincarnation({ realm: '元婴', sectPosition: '长老', lastDeathReason: 'death-natural' }, 'death-natural');
assert(s1.ok, '转世 OK (reason=' + s1.reason + ')');
assert(s1.legacyPoints === 20 + 40 + 30, '遗产 90 (got ' + s1.legacyPoints + ')');
assert(R.getState().inheritancePool === 90, 'pool 90');

var s2 = R.startReincarnation({ realm: '练气', sectPosition: '弟子' }, 'death-combat');
assert(s2.ok && s2.legacyPoints === 1 + 5 + 0, '战死 6 (got ' + s2.legacyPoints + ')');

// ---- 5. 5 继承选项 ----
section('5) 5 继承选项');
var opts = R.listInheritOptions();
assert(opts.length === 5, '5 继承选项');
var memoryOpt = opts.find(function (o) { return o.type === 'memory'; });
assert(memoryOpt.cost === 80, '前世记忆 80');
var weaponOpt = opts.find(function (o) { return o.type === 'weapon'; });
assert(weaponOpt.cost === 120, '本命法器 120');
var bondOpt = opts.find(function (o) { return o.type === 'bond'; });
assert(bondOpt.cost === 60, '旧友缘分 60');
var fortuneOpt = opts.find(function (o) { return o.type === 'fortune'; });
assert(fortuneOpt.cost === 100, '先天气运 100');
var caveOpt = opts.find(function (o) { return o.type === 'cave'; });
assert(caveOpt.cost === 150, '前世洞府 150');

// ---- 6. grantInheritance ----
section('6) grantInheritance');
R.startReincarnation({ realm: '元婴', sectPosition: '掌门', lastDeathReason: 'death-natural' }, 'death-natural');
// 元婴+掌门+寿终 = 20+80+30 = 130
var nextLife = { name: '二世', realm: '练气', lifeSkills: {} };
var g1 = R.grantInheritance(nextLife, { type: 'memory', skill: '炼制', currentLevel: 100 });
assert(g1.ok, '前世记忆继承 OK');
assert(nextLife.lifeSkills.炼制 === 50, '功法 50% 保留 (got ' + nextLife.lifeSkills.炼制 + ')');
assert(R.getState().inheritancePool === 130 - 80, 'pool 50');

var g2 = R.grantInheritance(nextLife, { type: 'bond', npcId: 'npc_master' });
assert(!g2.ok && g2.reason === 'insufficient-points', '遗产 50 < 60 bond 拒');
assert(R.getState().inheritancePool === 50, 'pool 仍 50');

// 遗产不足拒
var g3 = R.grantInheritance(nextLife, { type: 'weapon' });
assert(!g3.ok && g3.reason === 'insufficient-points', '遗产不足拒');

// 未知类型
var g4 = R.grantInheritance(nextLife, { type: 'unknown' });
assert(!g4.ok && g4.reason === 'unknown-type', '未知类型拒');

// nextLifeData 缺失
var g5 = R.grantInheritance(null, { type: 'memory' });
assert(!g5.ok && g5.reason === 'no-nextLife', '缺失 nextLife 拒');

// ---- 7. 10 deeds ----
section('7) 10 deeds');
assert(R.VALID_DEEDS.indexOf('founded-sect') >= 0, 'founded-sect');
assert(R.VALID_DEEDS.indexOf('mastered-pill') >= 0, 'mastered-pill');
assert(R.VALID_DEEDS.length === 10, '10 deeds');

// ---- 8. preserveWorldMemory ----
section('8) preserveWorldMemory');
R.startReincarnation({ realm: '元婴', sectPosition: '掌门' }, 'death-natural');
var playerData = { name: '叶辰', realm: '元婴', sectFounded: true, sectPosition: '掌门',
    craftAchievements: { pills: 200, weapons: 20 }, daoCompanionId: 'temp_蘅',
    childrenIds: ['c1','c2'], savedSect: true, discoveredSecret: true, brokeThroughMajor: true };
var pwm1 = R.preserveWorldMemory(playerData);
assert(pwm1.ok, 'preserveWorldMemory OK');
assert(pwm1.legacyRecords.length === 1, '1 条记录');
var rec = pwm1.legacyRecords[0];
assert(rec.playerName === '叶辰', 'name=叶辰');
assert(rec.finalRealm === '元婴', 'finalRealm=元婴');
assert(rec.deeds.indexOf('founded-sect') >= 0, '含 founded-sect');
assert(rec.deeds.indexOf('mastered-pill') >= 0, '含 mastered-pill');
assert(rec.deeds.indexOf('mastered-weapon') >= 0, '含 mastered-weapon');
assert(rec.deeds.indexOf('married') >= 0, '含 married');
assert(rec.deeds.indexOf('had-children') >= 0, '含 had-children');
assert(rec.deeds.indexOf('saved-sect') >= 0, '含 saved-sect');
assert(rec.deeds.indexOf('discovered') >= 0, '含 discovered');
assert(rec.deeds.indexOf('achieved-breakthrough') >= 0, '含 achieved-breakthrough');
assert(rec.deeds.length === 8, '8 deeds (got ' + rec.deeds.length + ')');

// addLegacyRecord
var r2 = R.addLegacyRecord({ playerName: '李逸', finalRealm: '筑基', lifeSpan: 80, deeds: ['conquered-dungeon', 'won-tournament'] });
assert(r2, 'addLegacyRecord OK');
assert(R.getLegacyRecords().length === 2, '2 条记录');

// 上限 10
for (var i = 0; i < 12; i++) R.addLegacyRecord({ playerName: 'n' + i, deeds: [] });
assert(R.getLegacyRecords().length === 10, '上限 10 (got ' + R.getLegacyRecords().length + ')');

// 非法 deed 过滤
R.addLegacyRecord({ playerName: 'test', deeds: ['founded-sect', 'invalid-deed', 'married'] });
var lastRec = R.getLegacyRecords()[0];
assert(lastRec.deeds.indexOf('invalid-deed') < 0, '非法 deed 过滤');

// ---- 9. 事件总线 ----
section('9) 事件总线');
assert((listeners['reincarnation:start'] || []).length >= 2, 'start ≥ 2');
// 在 section 6 中 memory 继承成功 1 次 + section 4 中 2 次 start → 至少 1 个 inherit 事件
// 再触发 1 次成功继承
R.startReincarnation({ realm: '大乘' }, 'death-natural');  // 300 遗产
var nextLife2 = { name: '三世' };
R.grantInheritance(nextLife2, { type: 'memory', skill: '锻造' });
assert((listeners['reincarnation:inherit'] || []).length >= 2, 'inherit ≥ 2 (got ' + (listeners['reincarnation:inherit'] || []).length + ')');
assert((listeners['reincarnation:legacy'] || []).length >= 1, 'legacy ≥ 1');

// ---- 10. StateRegistry ----
section('10) StateRegistry v1');
var snap = mockWindow.StateRegistry.exportAll();
assert(snap.reincarnationConfig, 'reincarnationConfig 已注册');
var rc = snap.reincarnationConfig && snap.reincarnationConfig.data;
assert(rc, 'data 可访问');
assert(rc && rc.legacyRecords.length === 10, 'legacyRecords 持久化');
assert(rc && Array.isArray(rc.nextLifeInheritance.granted), 'granted 数组');

// ---- 11. 性能 ----
section('11) 性能 1000 次 computeInheritancePoints');
var t0 = Date.now();
for (var pi = 0; pi < 1000; pi++) {
    R.computeInheritancePoints({ realm: '元婴', sectPosition: '长老', lastDeathReason: 'death-natural', relationships: [{affection:90},{affection:80}] });
}
var dur = Date.now() - t0;
console.log('  1000 computeInheritancePoints: ' + dur + 'ms');
assert(dur < 200, '1000 次 < 200ms');

console.log('\n=========================================');
console.log('reincarnation v19.13: ' + pass + ' passed, ' + fail + ' failed');
console.log('=========================================');
process.exit(fail > 0 ? 1 : 0);
