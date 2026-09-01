// reincarnation-integration v19.14 测试

var pass = 0, fail = 0;
function assert(cond, msg) {
    if (cond) { pass++; console.log('  ✓ ' + msg); }
    else { fail++; console.log('  ✗ FAIL ' + msg); }
}
function section(s) { console.log('\n=== ' + s + ' ==='); }

// ---- mock window + Reincarnation (v19.13) ----
var listeners = {};
var mockWindow = {
    currentCharData: { name: '叶辰', realm: '元婴', sectPosition: '掌门', age: 200, maxAge: 200,
        lifeSkills: { 炼制: 100, 锻造: 80 },
        relationships: [{ id: 'a', affection: 90 }, { id: 'b', affection: 80 }],
        craftAchievements: { pills: 200, weapons: 20 },
        keyEvents: ['e1','e2','e3'],
        sectFounded: true,
        childrenIds: ['c1','c2'],
        savedSect: true,
        discoveredSecret: true,
        brokeThroughMajor: true,
        daoCompanionId: 'temp_蘅',
        dungeonsCleared: ['dgn_1','dgn_2'],
        tournamentChamp: true
    },
    getCurrentCharData: function () { return this.currentCharData; },
    WorldCalendar: { day: 5000 },
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
    },
    // mock document
    document: (function () {
        var elements = {};
        return {
            getElementById: function (id) {
                if (!elements[id]) {
                    elements[id] = {
                        id: id,
                        classList: { add: function () {}, remove: function () {}, _classes: [] },
                        innerHTML: '',
                        textContent: '',
                        setAttribute: function (k, v) { this[k] = v; },
                        getAttribute: function (k) { return this[k]; },
                        querySelectorAll: function () { return []; }
                    };
                }
                return elements[id];
            }
        };
    })(),
    // mock npcManager
    npcManager: {
        createNPC: function (d) { return d.npcId; }
    }
};
// 先加载 v19.13 Reincarnation
var fs = require('fs');
var path = require('path');
var src1 = fs.readFileSync(path.join(__dirname, '..', 'js/extensions/reincarnation.js'), 'utf8');
var wrapped1 = '(function(window){' + src1 + '})(mockWindow);';
eval(wrapped1);
// 再加载 v19.14 Integration
var src2 = fs.readFileSync(path.join(__dirname, '..', 'js/extensions/reincarnation-integration.js'), 'utf8');
var wrapped2 = '(function(window){' + src2 + '})(mockWindow);';
eval(wrapped2);

var RI = mockWindow.ReincarnationIntegration;
var R = mockWindow.Reincarnation;
assert(!!RI, 'ReincarnationIntegration 已注册');
assert(!!R, 'Reincarnation 已注册');

// ---- 1. onPlayerDeath ----
section('1) onPlayerDeath');
// 重置 Reincarnation state
R.getState().legacyRecords = [];
R.getState().inheritancePool = 0;
var d1 = RI.onPlayerDeath('death-combat');
assert(d1.ok, '战死 OK (reason=' + d1.reason + ')');
// 20 (元婴) + 80 (掌门) + 0 (战死) + 10 (2 关系) + 35 (丹药15+法器20) + 9 (3 事件) = 154
assert(d1.legacyPoints === 154, '遗产 154 (got ' + d1.legacyPoints + ')');
assert(R.getState().inheritancePool === d1.legacyPoints, 'pool 134');
assert(R.getLegacyRecords().length === 1, '前世传说 1 条');
assert((listeners['reincarnation:modalOpened'] || []).length >= 1, 'modalOpened 事件触发');

// 寿终
var d2 = RI.onPlayerDeath('death-natural');
assert(d2.ok && d2.legacyPoints === d1.legacyPoints + 30, '寿终 +30 (got ' + (d2.legacyPoints - d1.legacyPoints) + ')');

// 无玩家
mockWindow.currentCharData = null;
var d3 = RI.onPlayerDeath('death-combat');
assert(!d3.ok && d3.reason === 'no-player', '无玩家拒');
mockWindow.currentCharData = { name: '叶辰', realm: '元婴' };

// 飞升
var d4 = RI.onPlayerDeath('ascend');
assert(d4.ok, '飞升 OK');
assert(d4.legacyPoints === 20 + 50, '飞升 70');

// ---- 2. 模态 ----
section('2) 模态 API');
// 先调 onPlayerDeath 重置 pool (元婴+掌门+战死 = 20+80+0 = 100)
mockWindow.currentCharData = { name: '二世', realm: '元婴', sectPosition: '掌门' };
var setup = RI.onPlayerDeath('death-combat');
assert(setup.ok && setup.legacyPoints === 100, 'setup pool = 100 (got ' + setup.legacyPoints + ')');
RI.openReincarnationModal(setup);
// 选 1 个
var t1 = RI.toggleOption('memory');
assert(t1.ok, '选 memory OK (reason=' + t1.reason + ')');
assert(RI.getState().pendingSelections.length === 1, '1 选');

var t2 = RI.toggleOption('memory');
assert(t2.ok && RI.getState().pendingSelections.length === 0, '取消 memory');

var t3 = RI.toggleOption('cave');
assert(!t3.ok && t3.reason === 'insufficient-points', 'cave 150 > 100 拒 (got ' + t3.reason + ')');
assert(RI.getState().pendingSelections.length === 0, 'cave 拒后 0 选');

var t3b = RI.toggleOption('fortune');
assert(t3b.ok, '选 fortune (100)');
var t4 = RI.toggleOption('bond');
// 100+60=160 > 100
assert(!t4.ok && t4.reason === 'insufficient-points', '超遗产拒 (100+60>100)');
assert(RI.getState().pendingSelections.length === 1, '1 选 (fortune)');

// ---- 3. confirmReincarnation ----
section('3) confirmReincarnation');
// 重新 setup (大乘+掌门+寿终 → 410)
RI.closeReincarnationModal();
mockWindow.currentCharData = { name: '二世', realm: '大乘', sectPosition: '掌门' };
var setup2 = RI.onPlayerDeath('death-natural');
RI.openReincarnationModal(setup2);
// 无选择拒
var c1 = RI.confirmReincarnation();
assert(!c1.ok && c1.reason === 'no-selection', '无选拒');

RI.toggleOption('memory');
RI.toggleOption('bond');
var c2 = RI.confirmReincarnation();
assert(c2.ok, 'confirm OK (reason=' + (c2.reason || '-') + ', applied.length=' + c2.applied.length + ')');
assert(c2.applied.length === 2, '2 继承应用 (got ' + c2.applied.length + ')');
assert(R.getState().inheritancePool === setup2.legacyPoints - 80 - 60, 'pool = setup2.legacyPoints - 140 (got ' + R.getState().inheritancePool + ')');
assert(RI.getState().appliedThisLife.length === 2, 'appliedThisLife 2 (got ' + RI.getState().appliedThisLife.length + ')');

// 无 Reincarnation mock
var R0 = mockWindow.Reincarnation;
mockWindow.Reincarnation = null;
var c3 = RI.confirmReincarnation();
assert(!c3.ok, '无 Reincarnation 拒');
mockWindow.Reincarnation = R0;

// ---- 4. applyInheritanceToNewLife ----
section('4) applyInheritanceToNewLife');
var newChar = { name: '二世', lifeSkills: {} };
var ai1 = RI.applyInheritanceToNewLife(newChar, [
    { type: 'memory', skill: '锻造', currentLevel: 80 },
    { type: 'bond', npcId: 'old_friend' }
]);
assert(ai1.ok, 'applyInheritanceToNewLife OK');
assert(newChar.lifeSkills.锻造 === 40, '二世 锻造 50% (got ' + newChar.lifeSkills.锻造 + ')');
assert(ai1.applied.length === 2, '2 applied');

// 缺失 newChar
var ai2 = RI.applyInheritanceToNewLife(null, []);
assert(!ai2.ok && ai2.reason === 'no-newChar', '无 newChar 拒');

// ---- 5. applyLegacyToNewWorld ----
section('5) applyLegacyToNewWorld');
// 不 wipe listeners（保留 section 2 的 selectionChanged 事件）
// 重置 records + Integration state
R.getState().legacyRecords = [];
RI.getState().legacyWorldEffects = { descendants: [], steles: [], flags: {} };
R.preserveWorldMemory({ name: '叶辰', realm: '元婴', sectPosition: '掌门', sectFounded: true, tournamentChamp: true,
    craftAchievements: { pills: 200, weapons: 20 },
    daoCompanionId: 'temp_蘅', childrenIds: ['c1','c2'],
    savedSect: true, discoveredSecret: true, brokeThroughMajor: true });
var records = R.getLegacyRecords();
var alw1 = RI.applyLegacyToNewWorld(records);
assert(alw1.ok, 'applyLegacyToNewWorld OK');
assert(alw1.descendants.length >= 1, '≥ 1 子嗣 (got ' + alw1.descendants.length + ')');
assert(alw1.steles.length >= 2, '≥ 2 碑文 (got ' + alw1.steles.length + ')');
assert(alw1.flags['legacy-founder-5000'] === '叶辰', 'founder 标记');
assert(alw1.flags['legacy-descendant-5000-0'], 'descendant 标记');
assert(alw1.flags['legacy-champion-5000'] === '叶辰', 'champion 标记');
assert(alw1.flags['legacy-discoverer-5000'] === '叶辰', 'discoverer 标记');
assert(alw1.flags['legacy-alchemy-grandmaster'] === '叶辰', 'alchemy master 标记');
assert(alw1.flags['legacy-forging-grandmaster'] === '叶辰', 'forging master 标记');
assert(alw1.flags['legacy-married-5000'] === '叶辰', 'married 标记');

// ---- 6. createNPCDescendant ----
section('6) createNPCDescendant');
var rec = records[0];
var d = RI.createNPCDescendant(rec, 0);
assert(d.npcId.indexOf('descendant_') === 0, 'npcId prefix');
assert(d.age >= 15 && d.age <= 24, 'age 15-24');
assert(d.legacy.indexOf('叶辰') >= 0, 'legacy 含叶辰');

// 元婴降 1 = 金丹
assert(d.realm === '金丹', '降 1 大境界: 元婴→金丹 (got ' + d.realm + ')');

// 大乘降 1 = 渡劫
var rec2 = { playerName: '李逸', finalRealm: '大乘', recordDay: 5000 };
var d2 = RI.createNPCDescendant(rec2, 0);
assert(d2.realm === '渡劫', '大乘→渡劫');

// 练气降 2 = 练气
var rec3 = { playerName: '张三', finalRealm: '练气', recordDay: 5000 };
var d3 = RI.createNPCDescendant(rec3, 0);
assert(d3.realm === '练气', '练气→练气 (下限)');

// ---- 7. markStele ----
section('7) markStele');
var st1 = RI.markStele(rec, '叶辰曾留迹于北冥', '北冥深处');
assert(st1.steleId.indexOf('stele_') === 0, 'steleId prefix');
assert(st1.text === '叶辰曾留迹于北冥', 'text');
assert(st1.location === '北冥深处', 'location');
assert(st1.refPlayer === '叶辰', 'refPlayer');

// 默认 text
var st2 = RI.markStele({ playerName: '无名', recordDay: 100 });
assert(st2.text.indexOf('无名') >= 0, '默认 text 含 playerName');

// ---- 8. 失败 ----
section('8) 失败');
// 无 records
var alw2 = RI.applyLegacyToNewWorld(null);
assert(!alw2.ok, '无 records 拒');

// 无 Reincarnation mock
var R0 = mockWindow.Reincarnation;
mockWindow.Reincarnation = null;
var t6 = RI.toggleOption('memory');
assert(!t6.ok, '无 Reincarnation toggleOption 拒');
mockWindow.Reincarnation = R0;

// 未知 type
RI.openReincarnationModal({ legacyPoints: 200, summary: { realm: { points: 0 }, relationship: { points: 0 }, sectPosition: { points: 0 }, keyEvents: { points: 0 }, craft: { points: 0 }, deathReason: { points: 0 } } });
var t7 = RI.toggleOption('unknown_xxx');
assert(!t7.ok && t7.reason === 'unknown-type', '未知 type 拒');

// ---- 9. 事件总线 ----
section('9) 事件总线');
// selectionChanged 在 section 2 已触发（toggleOption 多次）
assert((listeners['reincarnation:selectionChanged'] || []).length >= 1, 'selectionChanged ≥ 1');
// legacyApplied 在 section 5 中已触发
assert((listeners['reincarnation:legacyApplied'] || []).length >= 1, 'legacyApplied ≥ 1');
// 重新触发一次
RI.applyLegacyToNewWorld([{ playerName: '李逸', finalRealm: '筑基', recordDay: 5000, deeds: ['conquered-dungeon'] }]);

// ---- 10. StateRegistry ----
section('10) StateRegistry v1');
var snap = mockWindow.StateRegistry.exportAll();
assert(snap.reincarnationIntegration, 'reincarnationIntegration 已注册');
var ris = snap.reincarnationIntegration && snap.reincarnationIntegration.data;
assert(ris, 'data 可访问');
assert(ris && ris.legacyWorldEffects.descendants.length >= 1, 'descendants 持久化');
assert(ris && ris.legacyWorldEffects.steles.length >= 1, 'steles 持久化');
assert(ris && Object.keys(ris.legacyWorldEffects.flags).length >= 5, 'flags ≥ 5 持久化');

// ---- 11. 性能 ----
section('11) 性能 100 次 applyLegacyToNewWorld');
var t0 = Date.now();
for (var pi = 0; pi < 100; pi++) {
    RI.applyLegacyToNewWorld([{ playerName: 'test', finalRealm: '元婴', recordDay: 5000, deeds: ['had-children','founded-sect','saved-sect'] }]);
}
var dur = Date.now() - t0;
console.log('  100 applyLegacyToNewWorld: ' + dur + 'ms');
assert(dur < 200, '100 次 < 200ms');

console.log('\n=========================================');
console.log('reincarnation-integration v19.14: ' + pass + ' passed, ' + fail + ' failed');
console.log('=========================================');
process.exit(fail > 0 ? 1 : 0);
