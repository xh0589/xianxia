// forging-compound v19.5 P1-2 测试
// 验证 5 维：材料标签 / 词缀池 / 器胚 / executeCompoundForging / 事件 / StateRegistry / 性能

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
    currentCharData: { qi: 1000, hp: 100, maxHp: 100, lifeSkills: { '锻造': 100, '炼制': 100 } },
    itemById: {},
    addItem: function (id, cnt) { return true; },
    addResultItem: function (id, cnt) { return mockWindow.addItem(id, cnt); },
    getLifeSkill: function (k) { return mockWindow.currentCharData.lifeSkills[k] || 0; },
    getCurrentCharData: function () { return mockWindow.currentCharData; },
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
    timeSystem: { advanceTime: function (n) {} },
    WorldCalendar: { day: 0 }
};
var fs = require('fs');
var src = fs.readFileSync('D:/Download Game/仙侠世界/js/crafting/forging-compound.js', 'utf8');
var wrapped = '(function(window){' + src + '})(mockWindow);';
eval(wrapped);
var F = mockWindow.ForgingCompound;
assert(!!F, 'ForgingCompound 已注册');
assert(Object.keys(F.MATERIAL_TAGS).length >= 20, '材料标签 ≥ 20 (got ' + Object.keys(F.MATERIAL_TAGS).length + ')');
assert(F.AFFIX_POOL.length >= 15, '词缀池 ≥ 15 (got ' + F.AFFIX_POOL.length + ')');
assert(Object.keys(F.EMBRYOS).length === 5, '器胚 = 5 (got ' + Object.keys(F.EMBRYOS).length + ')');
assert(F.COMPOUND_FORGING_RECIPES.length >= 5, '开放炼器方 ≥ 5 (got ' + F.COMPOUND_FORGING_RECIPES.length + ')');

// ---- 1. 材料标签映射 ----
section('1) 材料标签映射');
var t1 = F.getMaterialTags('mat_dark_iron');
assert(t1.indexOf('xuantie') >= 0, '玄铁标签 xuantie');
var t2 = F.getMaterialTags('mat_dragon_bone');
assert(t2.indexOf('long') >= 0, '龙骨标签 long');
var t3 = F.getMaterialTags('mat_meteorite');
assert(t3.indexOf('meteor') >= 0, '陨铁标签 meteor');
var t4 = F.getMaterialTags('mat_phoenix_blood');
assert(t4.indexOf('fenghuang') >= 0 && t4.indexOf('fire') >= 0, '凤血 多标签');
var t5 = F.getMaterialTags('mat_unknown_xxx');
assert(t5.length === 0, '未知材料无标签');

// ---- 2. 词缀抽取 ----
section('2) 词缀抽取');
var aff1 = F.pickAffixesForMat('mat_dark_iron', 3, 50);
assert(aff1.length >= 1 && aff1.length <= 3, '玄铁抽取 1~3 词缀 (got ' + aff1.length + ')');
var aff2 = F.pickAffixesForMat('mat_dragon_blood', 3, 80);
// 龙血是 long 标签，pickAffixes 应至少返回一个 long 词缀
var hasLongAffix = aff2.some(function (a) { return a.tag === 'long'; });
// 排序后随机切片可能截到不带 long 的（3 全为通用），多采几次确认
if (!hasLongAffix) {
    for (var _try = 0; _try < 5 && !hasLongAffix; _try++) {
        aff2 = F.pickAffixesForMat('mat_dragon_blood', 3, 80);
        hasLongAffix = aff2.some(function (a) { return a.tag === 'long'; });
    }
}
assert(hasLongAffix, '龙血含龙类词缀');
var aff3 = F.pickAffixesForMat('mat_dark_iron', 3, 5); // 技能 5 过低
assert(aff3.every(function (a) { return a.minForgeSkill <= 5; }), '低技能只能抽低门槛词缀');

// ---- 3. 器胚 ----
section('3) 器胚');
assert(F.EMBRYOS.sword.subtype === 'sword' && F.EMBRYOS.sword.baseDamage === 'slash', '剑胚属性');
assert(F.EMBRYOS.armor.slot === 'armor' && F.EMBRYOS.armor.baseDamage === null, '甲胚无伤害');
assert(F.EMBRYOS.flying.baseDamage === 'pierce', '飞剑胚穿刺');
assert(F.EMBRYOS.heavy.baseAttrs.attack === 10, '重兵胚攻 10');
assert(Object.keys(F.EMBRYOS).length === 5, '5 类器胚');

// ---- 4. 完整 executeCompoundForging ----
section('4) 完整 executeCompoundForging');
var r1 = F.executeCompoundForging('recipe_sword_open', {
    embryo: 'sword',
    main: ['mat_dark_iron'],
    assist: ['mat_mithril', 'mat_meteorite'],
    rune: []
});
assert(r1.ok, '剑器 OK (reason=' + r1.reason + ')');
assert(r1.affixes && r1.affixes.length >= 1 && r1.affixes.length <= 3, '1~3 词缀 (got ' + (r1.affixes && r1.affixes.length) + ')');
assert(r1.name && r1.name.indexOf(F.EMBRYOS.sword.name) >= 0, '名字含器胚名: ' + r1.name);

// 多器
var r2 = F.executeCompoundForging('recipe_blade_open', { embryo:'blade', main:['mat_dragon_bone'], assist:['mat_dragon_scale','mat_dark_iron'], rune:[] });
assert(r2.ok, '刀器 OK (reason=' + r2.reason + ')');
var r3 = F.executeCompoundForging('recipe_armor_open', { embryo:'armor', main:['mat_dark_iron'], assist:['mat_dragon_scale','mat_mithril'], rune:[] });
assert(r3.ok, '甲器 OK (reason=' + r3.reason + ')');
var r4 = F.executeCompoundForging('recipe_flying_open', { embryo:'flying', main:['mat_star_iron'], assist:['mat_mithril','mat_meteorite'], rune:['mat_phoenix_blood'] });
assert(r4.ok, '飞剑器 OK (reason=' + r4.reason + ')');
assert(r4.imprint === true, '飞剑带铭纹 (imprint=true)');
var r5 = F.executeCompoundForging('recipe_heavy_open', { embryo:'heavy', main:['mat_meteorite'], assist:['mat_dark_iron','mat_dark_iron'], rune:[] });
assert(r5.ok, '重兵器 OK (reason=' + r5.reason + ')');

// combatBonus 实际写入（用 高攻击词缀 mat_star_iron→通天/碎星，含 divine/critRate）
// F-25 修：注入 Mulberry32 确定性随机源（旧版用 Math.random 25% 失败）
function _mulberry32(seed) {
    return function () {
        seed = (seed + 0x6D2B79F5) | 0;
        var t = seed;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
var r_attack = F.executeCompoundForging('recipe_sword_open', { embryo:'sword', main:['mat_star_iron'], assist:['mat_mithril','mat_meteorite'], rune:[] }, { randomSource: _mulberry32(42) });
assert(r_attack.ok && (r_attack.combatBonus.divine > 0 || r_attack.combatBonus.critRate > 0), '星辰剑器带 divine/crit 加成');

// ---- 5. 失败原因 ----
section('5) 失败原因');
var f1 = F.executeCompoundForging('recipe_sword_open', { embryo:'blade', main:['mat_dark_iron'], assist:['mat_mithril','mat_meteorite'], rune:[] });
assert(!f1.ok && f1.reason.indexOf('embryo-type-mismatch') === 0, '器胚类型错拒 (got ' + f1.reason + ')');
var f2 = F.executeCompoundForging('recipe_sword_open', { embryo:'sword', main:[], assist:['mat_mithril','mat_meteorite'], rune:[] });
assert(!f2.ok && f2.reason.indexOf('main-count') === 0, '主材数错拒');
mockWindow.currentCharData.lifeSkills['锻造'] = 10;
var f3 = F.executeCompoundForging('recipe_sword_open', { embryo:'sword', main:['mat_dark_iron'], assist:['mat_mithril','mat_meteorite'], rune:[] });
assert(!f3.ok && f3.reason.indexOf('skill') === 0, '技能不足拒');
mockWindow.currentCharData.lifeSkills['锻造'] = 100;
var f4 = F.executeCompoundForging('recipe_xxx', { embryo:'sword', main:['mat_dark_iron'], assist:[], rune:[] });
assert(!f4.ok && f4.reason === 'recipe-not-found', 'recipe 不存在拒');
var f5 = F.executeCompoundForging('recipe_sword_open', null);
assert(!f5.ok && f5.reason === 'empty-embryo', '空器胚拒');

// 铭纹技能不足
mockWindow.currentCharData.lifeSkills['锻造'] = 30;
var f7 = F.executeCompoundForging('recipe_sword_open', { embryo:'sword', main:['mat_dark_iron'], assist:['mat_mithril','mat_meteorite'], rune:['mat_phoenix_blood'] });
assert(!f7.ok && f7.reason.indexOf('rune-skill') === 0, '铭纹技能 30<40 拒');
mockWindow.currentCharData.lifeSkills['锻造'] = 100;

// ---- 6. 事件总线 ----
section('6) 事件总线');
assert((listeners['forging:compound:success'] || []).length >= 4, '成功事件 ≥ 4 (got ' + (listeners['forging:compound:success'] || []).length + ')');
assert((listeners['forging:compound:imprint'] || []).length >= 1, '铭纹事件 ≥ 1 (got ' + (listeners['forging:compound:imprint'] || []).length + ')');
var lastEvt = (listeners['forging:compound:success'] || []).slice(-1)[0];
assert(lastEvt && Array.isArray(lastEvt.affixes), '事件含 affixes[]');

// ---- 7. StateRegistry ----
section('7) StateRegistry v1');
var snap = mockWindow.StateRegistry.exportAll();
assert(snap.forgingConfig, 'forgingConfig 已注册');
var fc = snap.forgingConfig && snap.forgingConfig.data;
assert(fc, 'forgingConfig.data 可访问');
assert(fc && fc.lastWeapons.length >= 5, 'lastWeapons ≥ 5 (got ' + (fc ? fc.lastWeapons.length : 0) + ')');
assert(fc && fc.lastWeapons.length <= 20, 'lastWeapons ≤ 20');
assert(fc && fc.imprintCount >= 1, 'imprintCount ≥ 1 (got ' + (fc ? fc.imprintCount : 0) + ')');
assert(fc && Object.keys(fc.preferTags).length >= 1, 'preferTags 有数据');

// ---- 8. 性能 ----
section('8) 性能 1000 次炼器');
var t0 = Date.now();
for (var pi = 0; pi < 1000; pi++) {
    F.executeCompoundForging('recipe_sword_open', { embryo:'sword', main:['mat_dark_iron'], assist:['mat_mithril','mat_meteorite'], rune:[] });
}
var dur = Date.now() - t0;
console.log('  1000 次炼器耗时: ' + dur + 'ms');
assert(dur < 1000, '1000 次炼器 < 1s');

// ---- 9. 词缀去重 ----
section('9) 词缀去重');
mockWindow.currentCharData.qi = 1000;
// 5 个玄铁：1 主 + 2 辅。词缀去重后 ≤ 3
var dup = F.executeCompoundForging('recipe_sword_open', { embryo:'sword', main:['mat_dark_iron'], assist:['mat_dark_iron','mat_dark_iron'], rune:[] });
assert(dup.ok, '同源材料炼器 OK (reason=' + dup.reason + ')');
assert(dup.affixes && dup.affixes.length <= 3, '同源材料词缀去重 ≤ 3 (got ' + (dup.affixes ? dup.affixes.length : 0) + ')');
if (dup.affixes) {
    var uniqueKeys = {};
    dup.affixes.forEach(function (a) { uniqueKeys[a.key] = 1; });
    assert(Object.keys(uniqueKeys).length === dup.affixes.length, '词缀 key 唯一');
}

console.log('\n=========================================');
console.log('forging-compound v19.5: ' + pass + ' passed, ' + fail + ' failed');
console.log('=========================================');
process.exit(fail > 0 ? 1 : 0);
