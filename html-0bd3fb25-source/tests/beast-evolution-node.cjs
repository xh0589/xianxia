// beast-evolution v19.19 测试

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
var src = fs.readFileSync(path.join(__dirname, '..', 'js/extensions/beast-evolution.js'), 'utf8');
var wrapped = '(function(window){' + src + '})(mockWindow);';
eval(wrapped);
var B = mockWindow.BeastEvolution;
assert(!!B, 'BeastEvolution 已注册');
assert(Object.keys(B.EVOLUTION_LINES).length === 3, '3 进化线');
assert(B.listLines().length === 3, 'listLines 3');
assert(Object.keys(B.PILL_HEAL).length === 3, '3 丹药等级');

// ---- 1. 3 进化线 ----
section('1) 3 进化线');
var fox = B.EVOLUTION_LINES.line_fox;
assert(fox.stages.length === 3, '灵狐 3 阶段');
assert(fox.stages[0].name === '幼狐', '幼狐');
assert(fox.stages[2].name === '九尾灵狐', '九尾灵狐');
assert(fox.stages[2].buff.treasure === 0.30, '九尾 treasure=0.30');
assert(fox.stages[2].buff.rare === '九尾寻宝', 'rare 特性');

var phoenix = B.EVOLUTION_LINES.line_phoenix;
assert(phoenix.stages[2].buff.craftFire === 0.35, '朱雀 craftFire=0.35');
assert(phoenix.stages[2].buff.rare === '朱雀业火', '朱雀业火');

var dragon = B.EVOLUTION_LINES.line_dragon;
assert(dragon.stages[2].buff.carry === 0.50, '玄龙 carry=0.50');

// ---- 2. initBeast ----
section('2) initBeast');
var i1 = B.initBeast('beast_a', 'line_fox');
assert(i1.ok && i1.line === 'line_fox' && i1.stage === 'infant', 'init OK');
var i2 = B.initBeast('beast_b', 'line_unknown');
assert(!i2.ok && i2.reason === 'unknown-line', '未知 line 拒');
assert(B.getStage('beast_a') === 'infant', 'stage=infant');
assert(B.getLine('beast_a') === 'line_fox', 'line=line_fox');
assert(B.getLevel('beast_a') === 1, 'level=1');
assert(B.getExp('beast_a') === 0, 'exp=0');
assert(B.getHp('beast_a') === 100, 'hp=100');

// ---- 3. 进化条件 ----
section('3) 进化条件');
var can1 = B.canEvolve('beast_a');
assert(!can1.ok && can1.missing.length >= 1, '初始不满足进化');
assert(can1.nextStage === 'adult', 'nextStage=adult');
assert(can1.missing.indexOf('bondDays < 50') >= 0, 'bondDays 不足');

B.setBondDays('beast_a', 50);
B.setAffection('beast_a', 0);
B.addExp('beast_a', 1900); // exp 1900, level 20
var can2 = B.canEvolve('beast_a');
// adult 要求 bondDays 50 / level 20 / exp 0 (无 affection 要求)
// 全部满足
assert(can2.ok, '满足 幼→成');
assert(can2.nextStage === 'adult', 'nextStage=adult');

// ---- 4. 进化 ----
section('4) 进化');
var e1 = B.evolve('beast_a');
assert(e1.ok, '进化 OK');
assert(e1.fromStage === 'infant' && e1.toStage === 'adult', 'infant→adult');
assert((listeners['beast:evolved'] || []).length === 1, 'evolved 事件');
assert(B.getStage('beast_a') === 'adult', 'stage=adult');
var buff = B.getBuff('beast_a');
log('灵狐 adult buff: ' + JSON.stringify(buff));
assert(buff.treasure === 0.15, 'adult treasure=0.15');

// 设置 成→王 条件：bondDays 200, level 50, exp 1000, affection 80
B.setBondDays('beast_a', 200);
B.addExp('beast_a', 5000); // level 50+, exp 6900
B.setAffection('beast_a', 85);
var can3 = B.canEvolve('beast_a');
assert(can3.ok, '满足 成→王');
assert(can3.nextStage === 'king', 'nextStage=king');

var e2 = B.evolve('beast_a');
assert(e2.ok, 'king 进化 OK');
assert(e2.toStage === 'king', 'king');
var buffK = B.getBuff('beast_a');
log('九尾 buff: ' + JSON.stringify(buffK));
assert(buffK.treasure === 0.30, 'king treasure=0.30');
assert(buffK.rare === '九尾寻宝', 'king rare');

var e3 = B.evolve('beast_a');
assert(!e3.ok, 'king 已满 stage 拒');

// ---- 5. 经验 + 等级 ----
section('5) 经验/等级');
B.initBeast('beast_exp', 'line_phoenix');
var e4 = B.addExp('beast_exp', 50);
assert(e4.exp === 50 && e4.newLevel === 1, '50 exp level 1');
var e5 = B.addExp('beast_exp', 60);
assert(e5.exp === 110 && e5.newLevel === 2, '110 exp level 2');
var e6 = B.addExp('beast_exp', 1000);
log('e6.newLevel=' + e6.newLevel);
assert(e6.newLevel === 12, '1110 exp level 12 (1+11)');

// ---- 6. 受伤/休养 ----
section('6) 受伤/休养');
B.initBeast('beast_hp', 'line_dragon');
B.setBondDays('beast_hp', 100);
assert(B.getHp('beast_hp') === 100, '初始 hp 100');
var d1 = B.damage('beast_hp', 50);
assert(d1.ok && d1.currentHp === 50, 'damage 50 → 50');
assert(d1.isWounded === true, 'isWounded (50<100)');
assert(B.getWoundStatus('beast_hp') === 'wounded', 'wounded');
var d2 = B.damage('beast_hp', 30);
assert(d2.currentHp === 20, '20 hp');
assert(B.getWoundStatus('beast_hp') === 'critical', 'critical');

// tickDay 自动恢复
B.tickDayHealing();
assert(B.getHp('beast_hp') === 21, 'tickDay +1% (20+1)');
B.tickDayHealing();
B.tickDayHealing();
B.tickDayHealing();
B.tickDayHealing();
B.tickDayHealing();
B.tickDayHealing();
B.tickDayHealing();
B.tickDayHealing();
B.tickDayHealing();
B.tickDayHealing();
B.tickDayHealing();
B.tickDayHealing();
B.tickDayHealing();
B.tickDayHealing();
B.tickDayHealing();
B.tickDayHealing();
B.tickDayHealing();
B.tickDayHealing();
B.tickDayHealing();
B.tickDayHealing();
B.tickDayHealing();
log('20 次 tickDay 后 hp=' + B.getHp('beast_hp'));
assert(B.getHp('beast_hp') > 20, 'tickDay 恢复');

// ---- 7. 治疗丹药 ----
section('7) 治疗丹药');
B.damage('beast_hp', 80); // 50 → 0
B.heal('beast_hp', 50); // 直接数值
log('heal 50 hp=' + B.getHp('beast_hp'));
assert(B.getHp('beast_hp') === 50, '50 hp');

B.damage('beast_hp', 50); // 50 → 0
assert(B.getHp('beast_hp') === 0, '0 hp critical');
var p1 = B.consumePill('beast_hp', 'minor');
log('minor pill: ' + (p1.ok ? 'OK +' + p1.amount : 'FAIL'));
assert(p1.ok, 'minor pill OK');
assert(B.getHp('beast_hp') === 20, '+20% of 100');

B.damage('beast_hp', 20); // 20 → 0
var p2 = B.consumePill('beast_hp', 'major');
assert(p2.ok, 'major pill OK');
log('major pill amount=' + p2.amount);
assert(p2.amount === 60, 'major +60%');

// 未知 pill
var p3 = B.consumePill('beast_hp', 'unknown_pill');
assert(!p3.ok, '未知 pill 拒');

// ---- 8. 变异 ----
section('8) 变异');
B.initBeast('beast_mut', 'line_phoenix');
// Math.random < 0.10 触发，多试几次
var mutated = false;
for (var mi = 0; mi < 200 && !mutated; mi++) {
    var mu = B.tryMutate('beast_mut');
    if (mu.ok) { mutated = true; break; }
}
assert(mutated, '200 次内 1 次变异 (rate=10%)');
log('变异结果: ' + (mutated ? 'OK' : 'FAIL'));
var bMut = B.getState().beasts['beast_mut'];
log('变异后 traits: ' + JSON.stringify(bMut.traits));
assert(bMut.traits.length === 1, '1 trait');
assert(bMut.mutated === true, 'mutated=true');

var mu2 = B.tryMutate('beast_mut');
assert(!mu2.ok && mu2.reason === 'already-mutated', '已变异拒');

// ---- 9. 繁育 ----
section('9) 繁育');
B.initBeast('parent_a', 'line_fox');
B.initBeast('parent_b', 'line_fox');
// 给一些 traits
B.getState().beasts.parent_a.traits = ['金睛'];
B.getState().beasts.parent_b.traits = ['火翼'];
var br1 = B.breed('parent_a', 'parent_b');
assert(br1.ok, '繁育 OK');
log('子代 inherited: ' + JSON.stringify(br1.inherited));
assert(br1.inherited.length >= 1, '至少 1 特性');
assert(B.getState().beasts[br1.childId].line === 'line_fox', '子代 line=line_fox');
assert(B.getState().beasts[br1.childId].stage === 'infant', '子代 infant');

// 不同 line
B.initBeast('parent_c', 'line_phoenix');
var br2 = B.breed('parent_a', 'parent_c');
assert(!br2.ok && br2.reason === 'different-lines', '不同 line 拒');

// ---- 10. 失败 ----
section('10) 失败');
assert(!B.initBeast('x', 'line_unknown').ok, '未知 line 拒');
assert(!B.evolve('not_exist').ok, '不存在 evolve 拒');
assert(!B.damage('x', 10).ok, '不存在 damage 拒');
assert(!B.breed('not_a', 'not_b').ok, '不存在 breed 拒');

// ---- 11. 事件总线 ----
section('11) 事件总线');
assert((listeners['beast:evolved'] || []).length >= 1, 'evolved ≥ 1');
assert((listeners['beast:healed'] || []).length >= 1, 'healed ≥ 1');
assert((listeners['beast:mutated'] || []).length >= 1, 'mutated ≥ 1');
assert((listeners['beast:bred'] || []).length >= 1, 'bred ≥ 1');

// ---- 12. StateRegistry ----
section('12) StateRegistry v1');
var snap = mockWindow.StateRegistry.exportAll();
assert(snap.beastEvolution, 'beastEvolution 已注册');
var be = snap.beastEvolution && snap.beastEvolution.data;
assert(be, 'data 可访问');
assert(be && Object.keys(be.beasts).length >= 5, '≥ 5 灵兽 (got ' + Object.keys(be.beasts).length + ')');

// ---- 13. 性能 ----
section('13) 性能');
// 100 灵兽 × 100 天
for (var pi = 0; pi < 100; pi++) {
    B.initBeast('perf_' + pi, 'line_fox');
    B.damage('perf_' + pi, 50);
}
var t0 = Date.now();
for (var pj = 0; pj < 100; pj++) B.tickDayHealing();
var dur = Date.now() - t0;
log('100 灵兽 × 100 天 tickDay: ' + dur + 'ms');
assert(dur < 200, '< 200ms');

function log(msg) { console.log('  ' + msg); }

console.log('\n=========================================');
console.log('beast-evolution v19.19: ' + pass + ' passed, ' + fail + ' failed');
console.log('=========================================');
process.exit(fail > 0 ? 1 : 0);
