// talisman-advanced v19.6 P1-3 测试
// 验证 6 维：高级符模板 / TalismanSystem 扩展 effect / 跨系统钩 / 失败 / 事件 / StateRegistry / 性能

var pass = 0, fail = 0;
function assert(cond, msg) {
    if (cond) { pass++; console.log('  ✓ ' + msg); }
    else { fail++; console.log('  ✗ FAIL ' + msg); }
}
function section(s) { console.log('\n=== ' + s + ' ==='); }

// ---- mock window ----
var listeners = {};
var statusEffects = [];
var mockWindow = {
    itemById: {
        // 模拟既有 4 个 implemented:true
        tal_shield: { id:'tal_shield', name:'护身符', effect:{shield:50}, implemented:true },
        tal_purify: { id:'tal_purify', name:'净化符', effect:{cleanse:true}, implemented:true },
        tal_escape: { id:'tal_escape', name:'遁逃符', effect:{escape_boost:0.8}, implemented:true },
        tal_teleport: { id:'tal_teleport', name:'传送符', effect:{teleport:true}, implemented:true }
    },
    currentBattle: null,
    WorldCalendar: { day: 1000 },
    showMessage: function () {},
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
    EventBus: { emit: function (name, payload) { (listeners[name] = listeners[name] || []).push(payload); } },
    statusEffectManager: {
        addEffect: function (target, eff) { statusEffects.push({ target: target, eff: eff }); return true; }
    }
};
// mock TalismanSystem（最小闭包）
mockWindow.TalismanSystem = (function () {
    var _state = {
        combatBonuses: {},
        bonusActionsLeft: 0,
        shield: 0,
        escapeBonus: 0
    };
    return {
        _state: _state, // 测试中可访问
        debugState: function () { return JSON.parse(JSON.stringify(_state)); },
        apply: function (template) { return !!template && !!template.effect; },
        getCombatBonuses: function () { return Object.assign({}, _state.combatBonuses); },
        onPlayerAttackComplete: function () {},
        absorbDamage: function (a) { return a; },
        getEscapeChance: function (b) { return b; },
        consumeEscapeBoost: function () {},
        reset: function () { _state.combatBonuses = {}; _state.bonusActionsLeft = 0; _state.shield = 0; _state.escapeBonus = 0; }
    };
})();

// 加载
var fs = require('fs');
var path = require('path');
var src = fs.readFileSync(path.join(__dirname, '..', 'js/extensions/talisman-advanced.js'), 'utf8');
var wrapped = '(function(window){' + src + '})(mockWindow);';
eval(wrapped);
var TA = mockWindow.TalismanAdvanced;
assert(!!TA, 'TalismanAdvanced 已注册');
assert(TA.ADVANCED_TALISMANS.length === 15, '15 张高级符 (got ' + TA.ADVANCED_TALISMANS.length + ')');

// ---- 1. 模板按类别 ----
section('1) 高级符模板按类别');
var combat = TA.listByCategory('combat');
assert(combat.length >= 2, '战斗符 ≥ 2 (got ' + combat.length + ')');
assert(combat.some(function (t) { return t.id === 'tal_burst'; }), '含爆裂符');
var survival = TA.listByCategory('survival');
assert(survival.length >= 2, '生存符 ≥ 2 (got ' + survival.length + ')');
var explore = TA.listByCategory('explore');
assert(explore.length >= 2, '探索符 ≥ 2 (got ' + explore.length + ')');
var life = TA.listByCategory('life');
assert(life.length >= 2, '生活符 ≥ 2 (got ' + life.length + ')');
var sect = TA.listByCategory('sect');
assert(sect.length >= 2, '宗门符 ≥ 2 (got ' + sect.length + ')');

// ---- 2. itemById 注册 ----
section('2) itemById 注册 + implemented');
var burst = mockWindow.itemById['tal_burst'];
assert(burst && burst.implemented === true, '爆裂符 implemented');
var shieldGreat = mockWindow.itemById['tal_shield_great'];
assert(shieldGreat && shieldGreat.effect.shield === 200, '大护身符 effect.shield=200');
var sectGuard = mockWindow.itemById['tal_sect_guard'];
assert(sectGuard && sectGuard.effect.sect_effect && sectGuard.effect.sect_effect.key === 'sect_guard', '护山符 sect_effect 正确');

// ---- 3. TalismanSystem 扩展 ----
section('3) TalismanSystem 扩展 effect');
var TS = mockWindow.TalismanSystem;
assert(typeof TS.applyAdvanced === 'function', 'applyAdvanced 已注册');
assert(typeof TS.getSectEffect === 'function', 'getSectEffect 已注册');
assert(typeof TS.getInvisibility === 'function', 'getInvisibility 已注册');
assert(typeof TS.getPenetrateBonus === 'function', 'getPenetrateBonus 已注册');
assert(typeof TS.tickTurn === 'function', 'tickTurn 已注册');
assert(typeof TS.applySectEffect === 'function', 'applySectEffect 已注册');

// ---- 4. applyAdvanced 战斗符 ----
section('4) applyAdvanced 战斗符');
var r1 = TS.applyAdvanced(burst);
assert(r1.ok, '爆裂符 apply OK');
assert(r1.applied.some(function (a) { return a.indexOf('attack_damage:150') === 0; }), '含 attack_damage:150');
var extra = TS.getNextExtraDamage();
assert(extra && extra.value === 150 && extra.element === 'fire' && extra.aoe === true, 'extraDamage: 150 fire aoe');

// 破甲
var r2 = TS.applyAdvanced(mockWindow.itemById['tal_armor_break_v2']);
assert(r2.ok && TS.getPenetrateBonus() === 80, '破甲符 penetrate=80');

// 缚灵（root）
statusEffects.length = 0;
var r3 = TS.applyAdvanced(mockWindow.itemById['tal_bind_soul']);
assert(r3.ok && statusEffects.length === 1 && statusEffects[0].eff.type === 'root' && statusEffects[0].eff.duration === 3, '缚灵符 root 3');

// 镇魂
statusEffects.length = 0;
var r4 = TS.applyAdvanced(mockWindow.itemById['tal_soul_calm']);
assert(r4.ok && statusEffects.length === 1 && statusEffects[0].eff.type === 'silence' && statusEffects[0].eff.duration === 3, '镇魂符 silence 3');
assert(TS.getDivineShieldExtra() === 50, '镇魂符 divine_shield=50');

// ---- 5. 跨系统钩：sect_effect ----
section('5) 跨系统钩');
var r5 = TS.applyAdvanced(mockWindow.itemById['tal_sect_guard']);
assert(r5.ok, '护山符 apply OK');
assert(TS.getSectEffect('sect_guard') === 0.5, 'sect_guard 当前值 0.5');

var r6 = TS.applyAdvanced(mockWindow.itemById['tal_ripen']);
assert(r6.ok && TS.getSectEffect('field_ripen') === 0.3, '催熟 field_ripen=0.3');

var r7 = TS.applyAdvanced(mockWindow.itemById['tal_find_spirit']);
assert(r7.ok && TS.getSectEffect('spirit_detect') === 1, '寻灵 spirit_detect=1');

// 过期：day > expireDay
mockWindow.WorldCalendar.day = 2000;
assert(TS.getSectEffect('sect_guard') === 0, '过期 sect_guard 失效');
mockWindow.WorldCalendar.day = 1000;

// ---- 6. 隐身 + tickTurn ----
section('6) 隐身 + tickTurn');
var r8 = TS.applyAdvanced(mockWindow.itemById['tal_escape_ground']);
assert(r8.ok && TS.getInvisibility() === 2, '遁地符 invisibility=2');
TS.tickTurn();
assert(TS.getInvisibility() === 1, 'tickTurn 后 invisibility=1');
TS.tickTurn();
assert(TS.getInvisibility() === 0, '再 tickTurn 后 invisibility=0');

// ---- 7. 失败 ----
section('7) 失败');
var r9 = TS.applyAdvanced(null);
assert(!r9.ok && r9.reason === 'no-effect', '无 template 拒');
var r10 = TS.applyAdvanced({ id:'x', effect:null });
assert(!r10.ok && r10.reason === 'no-effect', '无 effect 拒');
var r11 = TS.applyAdvanced({ id:'x', effect:{} });
assert(r11.ok && r11.applied.length === 0, '空 effect OK 但 applied=[]');

// ---- 8. 事件总线 ----
section('8) 事件总线');
assert((listeners['talisman:advanced:apply'] || []).length >= 7, 'apply 事件 ≥ 7 (got ' + (listeners['talisman:advanced:apply'] || []).length + ')');
assert((listeners['talisman:advanced:sect'] || []).length >= 3, 'sect 事件 ≥ 3');

// ---- 9. StateRegistry ----
section('9) StateRegistry v1');
var snap = mockWindow.StateRegistry.exportAll();
assert(snap.talismanConfig, 'talismanConfig 已注册');
var tc = snap.talismanConfig && snap.talismanConfig.data;
assert(tc, 'talismanConfig.data 可访问');
assert(tc && tc.lastUsed.length >= 7, 'lastUsed ≥ 7 (got ' + (tc ? tc.lastUsed.length : 0) + ')');
assert(tc && tc.lastUsed.length <= 20, 'lastUsed ≤ 20');
assert(tc && Object.keys(tc.preferCategories).length >= 1, 'preferCategories 有数据');
assert(tc && Object.keys(tc.sectEffects).length >= 1, 'sectEffects 持久化');

// ---- 10. 性能 ----
section('10) 性能');
var t0 = Date.now();
for (var pi = 0; pi < 1000; pi++) {
    TS.applyAdvanced(burst);
}
var dur = Date.now() - t0;
console.log('  1000 次 applyAdvanced: ' + dur + 'ms');
assert(dur < 500, '1000 次 apply < 500ms');

console.log('\n=========================================');
console.log('talisman-advanced v19.6: ' + pass + ' passed, ' + fail + ' failed');
console.log('=========================================');
process.exit(fail > 0 ? 1 : 0);
