/**
 * v21.6-realm-curve-node.js — 全境界数值实测批 门禁
 *
 * 病根：charData.level 创角写死 1 后无任何正常玩法更新它，主战斗入口
 *   `level = charData.level || layer` 永远出 1 级怪——筑基起敌人只打得动 1 点血，
 *   金丹起彻底沦为木桩；胜利奖励钉死 +2 历练 +1 真元，与指数级修为需求差 5-8 个数量级。
 *
 * 修法：combat-stats.js 三件套
 *   realmScaledEnemyLevel  敌人等级接回境界刻度（炼气1→1 … 渡劫9→65，斜率 7/境）
 *   synthesizeEnemyAttrs   手造 {level,attack,defense} 敌人按曲线合成六维（手写值作偏置钳 0.5~2）
 *   scaleEnemyEntityToLevel 血肉/部位耐久随等级长（≤10 级不动，保新手节奏）
 * 接线：app.js globalStartBattle + openBattleWithEntity + 真元奖励境界倍率表，
 *   travel-system / arena-system / faction-invasion / cultivation(心魔) 四个旁路入口。
 *
 * 运行：node tests/v21.6-realm-curve-node.js
 */
'use strict';

var path = require('path');
var fs = require('fs');
var vm = require('vm');

var ROOT = path.resolve(__dirname, '..');
function loadScript(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

var passed = 0, failed = 0;
function ok(cond, label) {
    if (cond) passed++;
    else { failed++; console.log('[FAIL] ' + label); }
}

// ============ 运行时世界：加载 combat-stats.js ============
var W = { console: { log: function () {}, warn: function () {} }, Math: Math, JSON: JSON, Object: Object, Array: Array, String: String, Number: Number, isFinite: isFinite };
W.window = W;
vm.createContext(W);
vm.runInContext(loadScript('js/combat-stats.js'), W, { filename: 'combat-stats' });

// ============ A 境界刻度曲线 ============
ok(typeof W.realmScaledEnemyLevel === 'function', 'A0 realmScaledEnemyLevel 已导出');
ok(W.realmScaledEnemyLevel({ realm: '炼气', layer: 1 }) === 1, 'A1 炼气一层→1 级怪（开局不变）');
ok(W.realmScaledEnemyLevel({ realm: '炼气', layer: 9 }) === 9, 'A2 炼气九层→9');
ok(W.realmScaledEnemyLevel({ realm: '筑基', layer: 1 }) === 8, 'A3 筑基一层→8（边界允许 1 级回落，刚突破碾压上一层）');
ok(W.realmScaledEnemyLevel({ realm: '金丹', layer: 5 }) === 19, 'A4 金丹五层→19');
ok(W.realmScaledEnemyLevel({ realm: '渡劫', layer: 1 }) === 57, 'A5 渡劫一层→57');
ok(W.realmScaledEnemyLevel({ realm: '渡劫', layer: 9 }) === 65, 'A6 渡劫九层→65（封顶：base=2L+5=135，伤害带可控）');
ok(W.realmScaledEnemyLevel({ realm: '凡人', layer: 1 }) === 1, 'A7 凡人兜底 1');
ok(W.realmScaledEnemyLevel({}) === 1 && W.realmScaledEnemyLevel(null) === 1, 'A8 空数据兜底 1 不炸');
ok(W.realmScaledEnemyLevel({ realm: '渡劫', layer: 99 }) === 65 &&
   W.realmScaledEnemyLevel({ realm: '炼气', layer: 0 }) === 1, 'A9 层数钳 1~9');
// 全程单调不减（境界内逐层 +1；跨境界 炼气9=9 → 筑基1=8 是唯一 1 级回落，属设计）
var REALMS = ['炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'];
var mono = true;
for (var ri = 0; ri < REALMS.length; ri++) {
    var prev = 0;
    for (var ly = 1; ly <= 9; ly++) {
        var v = W.realmScaledEnemyLevel({ realm: REALMS[ri], layer: ly });
        if (v <= prev) mono = false;
        prev = v;
    }
}
ok(mono, 'A10 每个境界内逐层严格递增');
// 与 getRealmTier（sect-join-flow.js）口径一致：同一张境界表
var sjf = loadScript('js/sects/sect-join-flow.js');
ok(sjf.indexOf("'凡人', '炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'") >= 0,
    'A11 境界表与 getRealmTier 同源同序');

// ============ B 无六维敌人兜底合成 ============
ok(typeof W.synthesizeEnemyAttrs === 'function', 'B0 synthesizeEnemyAttrs 已导出');
var at10 = W.synthesizeEnemyAttrs({ level: 10 });            // base=25
ok(at10.strength === 25 && at10.constitution === 30 && at10.meridian === 25,
    'B1 无手写攻防→按 base=2L+5 曲线合成（L10→base25，体质×1.2=30）');
var biased = W.synthesizeEnemyAttrs({ level: 10, attack: 50, defense: 12 }); // a=2(钳顶) d=0.5(钳底… 12/25=0.48→0.5)
ok(biased.strength === 50, 'B2 手写 attack 作力量偏置（50/25=2 倍封顶生效）');
ok(biased.constitution === Math.floor(25 * 0.5 * 1.2) && biased.willpower === Math.floor(25 * 0.5 * 0.8),
    'B3 手写 defense 作体质/意志偏置（0.48 钳到 0.5 下限）');
var at1 = W.synthesizeEnemyAttrs({ level: 1, attack: 1000, speed: 1000 });
ok(at1.strength <= 14 && at1.dexterity <= 14, 'B4 偏置钳 2 倍封顶：1 级手填千攻也翻不了天（base=7→≤14）');
var at65 = W.synthesizeEnemyAttrs({ level: 65 });            // base=135
ok(at65.strength === 135 && at65.intelligence === 135, 'B5 渡劫刻度 L65→base=135');
var junk = W.synthesizeEnemyAttrs({ level: 5, attack: -3, defense: 'abc', speed: null });
ok(junk.strength === 15 && junk.willpower === 12 && junk.dexterity === 15,
    'B6 非法手写值（负数/字符串/null）按无偏置处理不炸');
ok(W.synthesizeEnemyAttrs({ level: 2, attack: 0 }).strength === 9, 'B7 attack=0 视为无偏置（不钳到 0.5）');

// ============ C 血肉随等级长 ============
ok(typeof W.scaleEnemyEntityToLevel === 'function', 'C0 scaleEnemyEntityToLevel 已导出');
function mockEnt(L, withPhysio) {
    var e = {
        level: L,
        physiology: withPhysio ? { bloodVolume: 100, health: 100 } : null,
        durabilities: { head: 100, torso: 100, leftArm: 100 },
        maxDurabilities: { head: 100, torso: 100, leftArm: 100 }
    };
    if (!e.physiology) e.physiology = { bloodVolume: 100, health: 100 };
    return e;
}
var e6 = mockEnt(6);
W.scaleEnemyEntityToLevel(e6, {});
ok(e6.physiology.bloodVolume === 100 && e6.durabilities.head === 100, 'C1 ≤10 级血肉不动（新手节奏不变）');
var e65 = mockEnt(65);
W.scaleEnemyEntityToLevel(e65, {});
ok(e65.physiology.bloodVolume === Math.round(100 * (1 + 55 * 0.12)) && e65.physiology.health === e65.physiology.bloodVolume,
    'C2 L65 血量 ×7.6（100→760，高境界不再一刀一个）');
ok(e65.durabilities.torso === 760 && e65.maxDurabilities.torso === 760, 'C3 部位耐久同步放大且 max 对齐');
var eSelf = mockEnt(50);
W.scaleEnemyEntityToLevel(eSelf, { physiology: { bloodVolume: 999 } });
ok(eSelf.physiology.bloodVolume === 100, 'C4 调用方自带生理账的剧情 boss 不越权改写');
ok(W.scaleEnemyEntityToLevel(null, {}) === null, 'C5 空实体不炸');
var eBad = mockEnt('abc');
W.scaleEnemyEntityToLevel(eBad, {});
ok(eBad.physiology.bloodVolume === 100, 'C6 等级非法按 1 处理不动血肉');

// ============ D 伤害带纸面推演（钉公式） ============
// generateRandomEnemy（battle.js）：base=2L+5，每维 floor(base*(0.8+rand*0.4))→[0.8b,1.2b)，技能 L*2+rand(10)
// 敌方 attack（combat-stats 非玩家支）：floor(str + bestSkill*0.12)
// 伤害公式：floor(atk - def*0.3 + rand±1)，min 1
function enemyAtkBand(L) {
    var b = 2 * L + 5;
    var sMin = Math.floor(b * 0.8), sMax = Math.ceil(b * 1.2);
    var kMin = L * 2, kMax = L * 2 + 10;
    return [Math.floor(sMin + kMin * 0.12), Math.floor(sMax + kMax * 0.12)];
}
function dmg(atk, def) { return Math.max(1, Math.floor(atk - def * 0.3)); }
var lo1 = enemyAtkBand(1), hi65 = enemyAtkBand(65);
ok(lo1[0] <= 9 && lo1[1] <= 12, 'D1 炼气一层怪攻击 ≤12（开局体验与旧版一致）');
ok(hi65[0] >= 115 && hi65[1] <= 200, 'D2 渡劫怪攻击带 [' + hi65[0] + ',' + hi65[1] + '] ⊂ [115,200]');
// 旧病灶：1 级怪打筑基+玩家（realmDef=3+1=4 起，def≥10）→ 恒 1 点血
ok(dmg(9, 10) === 6 && dmg(7, 30) === 1, 'D3 旧口径复现：低级怪对高防恒 1（木桩病根）');
// 新口径：渡劫怪 vs 满装渡劫玩家（realmDef=8*3+5=29 + con100*0.4+will100*0.2=60 + 装备 def≈180 → ≈269）
var endDef = 29 + 60 + 180;
var dLo = dmg(hi65[0], endDef), dHi = dmg(hi65[1], endDef);
ok(dLo >= 20 && dHi <= 140, 'D4 渡劫怪对满装玩家每击 [' + dLo + ',' + dHi + '] ⊂ [20,140]（有来有回，非 1 也非秒杀）');
// 裸装渡劫玩家（def≈89）挨打更疼但仍是多回合战斗（血肉 760 vs 玩家攻击四五百 → 2 回合上下击杀）
ok(dmg(hi65[1], 89) < 200 && e65.physiology.health >= 500, 'D5 裸装不秒死、敌人血够厚（战斗存在）');

// ============ E 五个入口接线在案（源码断言） ============
var appSrc = loadScript('js/app.js');
ok(/Number\(charData\.level\) > 1[\s\S]{0,120}realmScaledEnemyLevel\(charData\)/.test(appSrc),
    'E1 globalStartBattle：显式高 level 照收，否则走境界刻度');
ok(/new EntityCls\(enemyData[\s\S]{0,200}scaleEnemyEntityToLevel\(enemyEntity, enemyData\)/.test(appSrc),
    'E2 globalStartBattle：出怪后血肉放大');
ok(/data\.attrs \|\|[\s\S]{0,160}synthesizeEnemyAttrs\(data\)/.test(appSrc),
    'E3 openBattleWithEntity：无六维敌人兜底合成');
ok(/scaleEnemyEntityToLevel\(enemyEntity, data\)/.test(appSrc), 'E4 openBattleWithEntity：血肉放大');
ok(/_rmulTable = \[1, 2, 4, 8, 16, 32, 64, 128, 256\]/.test(appSrc) &&
   /getRealmTier\(window\.currentCharData\.realm\)/.test(appSrc) &&
   /Math\.max\(1, Math\.min\(9, _rtier\)\)/.test(appSrc),
    'E5 真元奖励境界倍率表（每境×2，渡劫×256，段位钳 1~9）');
ok(/plLv2 = \(typeof window\.realmScaledEnemyLevel/.test(appSrc), 'E6 宿敌链 plLv2 同走境界刻度');
ok(/realmScaledEnemyLevel\(cd\)/.test(loadScript('js/travel-system.js')), 'E7 travel  fallback 入口接线');
ok(/global\.realmScaledEnemyLevel\(cd\)[\s\S]{0,80}\+ Math\.floor\(Math\.random\(\) \* 3\)/.test(loadScript('js/gameplay/arena-system.js')),
    'E8 竞技场：境界刻度 + 0~2 随机浮动');
ok(/realmScaledEnemyLevel\(window\.currentCharData\)/.test(loadScript('js/factions/faction-invasion.js')),
    'E9 势力刺客接线（level+5 → 适配器按等级合成六维）');
var culSrc = loadScript('js/cultivation/cultivation.js');
ok(/_hdBase = \(typeof window\.realmScaledEnemyLevel[\s\S]{0,200}level: _hdBase \+ 5/.test(culSrc),
    'E10 心魔等级接境界刻度 +5');
ok(/health: 100 \+ _hdBase \* 5/.test(culSrc), 'E11 心魔血量随刻度');
ok(/exp: 500 \+ \(typeof window\.realmScaledEnemyLevel/.test(culSrc), 'E12 心魔战胜奖励历练随刻度');

// ============ F 奖励曲线自动跟上 ============
ok(/enemyLevel > 10\) temperingGain = 5[\s\S]{0,60}enemyLevel > 20\) temperingGain = 10/.test(appSrc),
    'F1 历练奖励按敌人等级分档（敌人真长大→奖励自动跟涨）');
ok(/essenceGain = Math\.floor\(enemyLevel \* 0\.3\) \+ 1/.test(appSrc), 'F2 真元基数随敌人等级');
// 数量级核对：渡劫怪 L65 → 基数 floor(65*0.3)+1=20，×256=5120/战；
// 渡劫突破需求 essenceBase 2.4e9 × layerMultipliers——战斗只是收入之一（打坐 1000/次、灵脉、丹药），
// 但相比旧口径（恒 1 点）已是四个数量级的修正
var endGain = Math.max(1, Math.round((Math.floor(65 * 0.3) + 1) * 256));
ok(endGain === 5120, 'F3 渡劫一战真元 5120（旧口径 1 → ×5120）');

// ============ G 静态检查 ============
['js/combat-stats.js', 'js/travel-system.js', 'js/gameplay/arena-system.js',
 'js/factions/faction-invasion.js', 'js/cultivation/cultivation.js', 'js/app.js'].forEach(function (f) {
    try {
        new vm.Script(loadScript(f), { filename: f });
        ok(true, 'G ' + f + ' 语法通过');
    } catch (e) {
        ok(false, 'G ' + f + ' 语法通过（' + e.message + '）');
    }
});

console.log('v21.6 境界数值: ' + passed + ' 通过, ' + failed + ' 失败');
process.exit(failed ? 1 : 0);
