// alchemy-compound v19.4 P1-1 测试
// 验证 5 维：药性映射 / 槽位校验 / 评分 / 品质段位 / 毒扣 / 事件总线 / StateRegistry / 性能

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
    currentCharData: { qi: 1000, hp: 100, maxHp: 100, lifeSkills: { '炼制': 100 } },
    itemById: {
        pill_zhuji: { name: '筑基丹', maxStack: 99 },
        pill_nine_revival: { name: '九转还魂丹', maxStack: 99 },
        pill_spring_recovery: { name: '回春丹', maxStack: 99 },
        pill_qi_powder: { name: '补气散', maxStack: 99 },
        pill_big_recovery: { name: '大还丹', maxStack: 99 }
    },
    addItem: function (id, cnt) { return true; },
    addResultItem: function (id, cnt) { return mockWindow.addItem(id, cnt); },
    getLifeSkill: function (k) { return mockWindow.currentCharData.lifeSkills[k] || 0; },
    getCurrentCharData: function () { return mockWindow.currentCharData; },
    EventBus: { emit: function (name, payload) { (listeners[name] = listeners[name] || []).push(payload); } },
    StateRegistry: {
        _data: {},
        _handlers: {},
        register: function (k, handlers) {
            mockWindow.StateRegistry._handlers[k] = handlers;
            return function () { delete mockWindow.StateRegistry._handlers[k]; };
        },
        exportAll: function () {
            var out = {};
            Object.keys(mockWindow.StateRegistry._handlers).forEach(function (k) {
                var h = mockWindow.StateRegistry._handlers[k];
                if (h.export) out[k] = { version: h.version || 1, data: h.export() };
            });
            return out;
        }
    },
    timeSystem: { advanceTime: function (n) {} },
    WorldCalendar: { day: 0 }
};
// 在 node 端通过 eval 加载 alchemy-compound
var fs = require('fs');
var src = fs.readFileSync('D:/Download Game/仙侠世界/js/crafting/alchemy-compound.js', 'utf8');
// 改 IIFE：注入 mockWindow
var wrapped = '(function(window){' + src + '})(mockWindow);';
eval(wrapped);
var A = mockWindow.AlchemyCompound;
assert(!!A, 'AlchemyCompound 已注册');
assert(Object.keys(A.MATERIAL_PROPS).length >= 18, '药材属性表 ≥ 18 种 (got ' + Object.keys(A.MATERIAL_PROPS).length + ')');
assert(A.COMPOUND_PILFAR_RECIPES.length >= 5, '开放丹方 ≥ 5 张 (got ' + A.COMPOUND_PILFAR_RECIPES.length + ')');

// ---- 1. 药性映射 ----
section('1) 药性映射');
var pLingzhi = A.getProps('mat_lingzhi');
assert(pLingzhi.element.wood >= 0.5, '灵芝木行高 (got ' + pLingzhi.element.wood + ')');
assert(pLingzhi.nature === 45, '灵芝平温 (got ' + pLingzhi.nature + ')');
assert(pLingzhi.primary.heal >= 40, '灵芝疗伤高 (got ' + pLingzhi.primary.heal + ')');
var pPhoenix = A.getProps('mat_phoenix_blood_grass');
assert(pPhoenix.element.fire >= 0.7, '凤血草火行高 (got ' + pPhoenix.element.fire + ')');
assert(pPhoenix.nature === 90, '凤血草烈 (got ' + pPhoenix.nature + ')');
assert(pPhoenix.primary.body >= 70, '凤血草炼体高 (got ' + pPhoenix.primary.body + ')');
var pHeav = A.getProps('mat_heaven_heart_flower');
assert(pHeav.primary.breakthrough >= 80, '天心花突破 ≥80 (got ' + pHeav.primary.breakthrough + ')');
var pDefault = A.getProps('mat_unknown_xxx');
assert(pDefault.nature === 50, '未知药材默认平性 (got ' + pDefault.nature + ')');

// ---- 2. 槽位校验 ----
section('2) 槽位校验');
var mainSlot = A.COMPOUND_PILFAR_RECIPES[0].slots.main; // 筑基
var r1 = A.checkSlotMat('mat_thousand_lingzhi', mainSlot);
assert(r1.ok, '千年灵芝应能进筑基主药槽 (reason=' + r1.reason + ')');
var r2 = A.checkSlotMat('mat_liquorice', mainSlot);
assert(!r2.ok, '甘草不可进筑基主药槽 (突破主效不足)');
var r3 = A.checkSlotMat('mat_phoenix_blood_grass', mainSlot);
assert(!r3.ok, '凤血草不可进筑基主药槽 (木行/毒性超)');
var r4 = A.checkSlotMat('mat_snow_lotus', mainSlot);
assert(!r4.ok, '雪莲不可进筑基主药槽 (寒性,低于 50)');
var r5 = A.checkSlotMat(null, mainSlot);
assert(!r5.ok && r5.reason === 'empty', '空材料拒');

// ---- 3. 辅药/调和 ----
section('3) 辅药/调和槽校验');
var assistSlot = A.COMPOUND_PILFAR_RECIPES[0].slots.assist;
var ba1 = A.checkSlotMat('mat_ginseng', assistSlot);
assert(ba1.ok, '人参可进辅药 (回气) (reason=' + ba1.reason + ')');
var ba2 = A.checkSlotMat('mat_phoenix_blood_grass', assistSlot);
assert(!ba2.ok, '凤血草毒高不可进辅药');
var balSlot = A.COMPOUND_PILFAR_RECIPES[0].slots.balancer;
var bl1 = A.checkSlotMat('mat_liquorice', balSlot);
assert(bl1.ok, '甘草可进调和 (毒低)');

// ---- 4. 完整 execute ----
section('4) executeCompoundPilfar 完整路径');
mockWindow.currentCharData.lifeSkills['炼制'] = 80; // 筑基要求 50
var ok1 = A.executeCompoundPilfar('recipe_zhuji_open', {
    main: ['mat_thousand_lingzhi'],
    assist: ['mat_ginseng', 'mat_lingzhi'],
    balancer: ['mat_liquorice']
});
assert(ok1.ok, '筑基丹合成 OK (reason=' + ok1.reason + ')');
assert(ok1.itemId === 'pill_zhuji', 'itemId=筑基丹 (got ' + ok1.itemId + ')');
assert(ok1.quality && ok1.quality.id, '有品质段 (got ' + (ok1.quality && ok1.quality.id) + ')');

// 毒性过高 → flaw
var ok2 = A.executeCompoundPilfar('recipe_zhuji_open', {
    main: ['mat_thousand_lingzhi'],
    assist: ['mat_ginseng', 'mat_lingzhi'],
    balancer: ['mat_chaos_stone'] // 毒 55
});
// chaos_stone 毒 55 > balancer maxToxic 30 → 应被 reject
assert(!ok2.ok && ok2.reason.indexOf('toxic') >= 0, '毒性超 balancer 拒 (got ' + ok2.reason + ')');

// 主效不足
var ok3 = A.executeCompoundPilfar('recipe_zhuji_open', {
    main: ['mat_liquorice'],
    assist: ['mat_ginseng', 'mat_lingzhi'],
    balancer: ['mat_liquorice']
});
assert(!ok3.ok, '主药主效不足应拒');

// 槽位数错
var ok4 = A.executeCompoundPilfar('recipe_zhuji_open', {
    main: ['mat_thousand_lingzhi'],
    assist: ['mat_ginseng'],
    balancer: ['mat_liquorice']
});
assert(!ok4.ok && ok4.reason.indexOf('count') === 0, '辅药数错应拒');

// 不存在的 recipe
var ok5 = A.executeCompoundPilfar('recipe_xxx', { main: [], assist: [], balancer: [] });
assert(!ok5.ok && ok5.reason === 'recipe-not-found', '不存在的 recipe 拒');

// 技能不足
mockWindow.currentCharData.lifeSkills['炼制'] = 30;
var ok6 = A.executeCompoundPilfar('recipe_zhuji_open', {
    main: ['mat_thousand_lingzhi'],
    assist: ['mat_ginseng', 'mat_lingzhi'],
    balancer: ['mat_liquorice']
});
assert(!ok6.ok && ok6.reason.indexOf('skill') === 0, '技能不足拒');
mockWindow.currentCharData.lifeSkills['炼制'] = 100;

// ---- 5. 多丹路径 ----
section('5) 多丹 execute');
// 回春丹
var ok7 = A.executeCompoundPilfar('recipe_healing_open', {
    main: ['mat_snow_lotus'],
    assist: ['mat_lingzhi', 'mat_ginseng'],
    balancer: ['mat_liquorice']
});
assert(ok7.ok, '回春丹合成 OK (reason=' + ok7.reason + ')');
// 回气散
var ok8 = A.executeCompoundPilfar('recipe_qi_open', {
    main: ['mat_ginseng'],
    assist: ['mat_lingzhi', 'mat_ginseng'],
    balancer: ['mat_liquorice']
});
assert(ok8.ok, '回气散合成 OK (reason=' + ok8.reason + ')');
// 大还丹
var ok9 = A.executeCompoundPilfar('recipe_big_recovery_open', {
    main: ['mat_phoenix_blood_grass'], // 毒 50 < 60 maxToxic
    assist: ['mat_ginseng', 'mat_lingzhi'],
    balancer: ['mat_liquorice']
});
assert(ok9.ok, '大还丹合成 OK (reason=' + ok9.reason + ')');
// 九转
var ok10 = A.executeCompoundPilfar('recipe_jindan_open', {
    main: ['mat_nine_leaf_lingzhi'],
    assist: ['mat_ten_thousand_ginseng', 'mat_ginseng'],
    balancer: ['mat_dragon_saliva'] // divine 80 ≥ 20, 毒 35 ≤ 30? 仍超, 换九叶灵芝辅助
});
if (!ok10.ok) {
    ok10 = A.executeCompoundPilfar('recipe_jindan_open', {
        main: ['mat_nine_leaf_lingzhi'],
        assist: ['mat_ten_thousand_ginseng', 'mat_ginseng'],
        balancer: ['mat_nine_leaf_lingzhi']
    });
}
assert(ok10.ok, '金丹合成 OK (reason=' + ok10.reason + ')');

// ---- 6. 事件总线 ----
section('6) 事件总线');
assert((listeners['alchemy:compound:success'] || []).length >= 4, '成功事件触发 ≥ 4 次 (got ' + (listeners['alchemy:compound:success'] || []).length + ')');
var lastEvt = (listeners['alchemy:compound:success'] || []).slice(-1)[0];
assert(lastEvt && lastEvt.score >= 0 && lastEvt.score <= 100, '事件含 score');

// ---- 7. StateRegistry ----
section('7) StateRegistry v1');
var snap = mockWindow.StateRegistry.exportAll();
assert(snap.alchemyConfig, 'alchemyConfig 已注册');
var ac = snap.alchemyConfig && snap.alchemyConfig.data ? snap.alchemyConfig.data : null;
assert(ac, 'alchemyConfig.data 可访问');
assert(ac && ac.lastRecipes.length >= 5, 'lastRecipes ≥ 5 (got ' + (ac ? ac.lastRecipes.length : 0) + ')');
assert(ac && ac.lastRecipes.length <= 20, 'lastRecipes ≤ 20');
assert(ac && ac.recipeStats, 'recipeStats 已存');
assert(ac && ac.recipeStats['recipe_zhuji_open'], '筑基丹有统计');

// ---- 8. 性能 ----
section('8) 性能 100 次合成');
var t0 = Date.now();
for (var pi = 0; pi < 100; pi++) {
    A.executeCompoundPilfar('recipe_zhuji_open', {
        main: ['mat_thousand_lingzhi'],
        assist: ['mat_ginseng', 'mat_lingzhi'],
        balancer: ['mat_liquorice']
    });
}
var dur = Date.now() - t0;
console.log('  100 次合成耗时: ' + dur + 'ms');
assert(dur < 200, '100 次合成 < 200ms');

// ---- 9. listAvailableMatsForSlot ----
section('9) 库存匹配');
mockWindow.inventory.slots = [
    { itemId: 'mat_thousand_lingzhi', count: 3 },
    { itemId: 'mat_ginseng', count: 5 },
    { itemId: 'mat_iron_ore', count: 2 }, // 非药材
    { itemId: 'mat_phoenix_blood_grass', count: 1 } // 毒高
];
var availMain = A.listAvailableMatsForSlot(A.COMPOUND_PILFAR_RECIPES[0].slots.main, mockWindow.inventory.slots);
assert(availMain.length === 1 && availMain[0].itemId === 'mat_thousand_lingzhi', '筑基主药槽仅千灵芝匹配 (got ' + availMain.length + ')');

console.log('\n=========================================');
console.log('alchemy-compound v19.4: ' + pass + ' passed, ' + fail + ' failed');
console.log('=========================================');
process.exit(fail > 0 ? 1 : 0);
