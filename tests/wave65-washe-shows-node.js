/**
 * wave65-washe-shows-node.js — 第六十五波 · 瓦舍节目单（台下三面）验收：
 *   A 位次：新三面排在「转入幕后」之后——老验收按位次点单，前五位次序动不得
 *   B 心境通道：统一结算收了心境键——封顶落底、缺省基数、老键不受扰
 *   C 看戏三口子：杂耍/皮影/口技铜钱真扣、心境真补、皮影长学识口技长音律、分城氛围词上脸
 *   D 分城 crowd：八座瓦舍城一座不落、佛国剑冢不配、零拉丁
 *   E 哨兵：新口子无骰无 roll（看戏是定数账）、口才老账未动、输赢纪律不破、零直写心境
 *
 * 运行：node tests/wave65-washe-shows-node.js
 */
'use strict';

var path = require('path');
var fs = require('fs');
var vm = require('vm');

var ROOT = path.resolve(__dirname, '..');
function loadScript(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

var passed = 0, failed = 0;
function ok(cond, label) {
    if (cond) { passed++; console.log('  ✓ ' + label); }
    else { failed++; console.error('  ✗ ' + label); }
}
function eq(a, b, label) { ok(a === b, label + '（实际=' + JSON.stringify(a) + ' 期望=' + JSON.stringify(b) + '）'); }

// ==================== 世界桩（v20.90 同式，另加口吻包） ====================
var W = {
    console: { log: function () {}, warn: function () {}, error: function () {} },
    setTimeout: function (fn) { try { fn(); } catch (e) {} return 0; },
    localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
    document: {
        createElement: function () { return { style: {}, classList: { add: function () {}, remove: function () {}, contains: function () { return false; } }, dataset: {}, innerHTML: '' }; },
        getElementById: function () { return null; },
        querySelector: function () { return null; },
        addEventListener: function () {},
        body: { appendChild: function () {} }
    },
    alert: function () {}
};
W.window = W;

var state = { logs: [], minutes: 0, city: '帝都·长安' };
W.timeSystem = {
    gameTime: { totalMinutes: 8 * 60, currentDay: 7 },
    advanceTime: function (m) { state.minutes += m; this.gameTime.totalMinutes += m; }
};
W.advanceTime = function (m) { state.minutes += m; };
W.gameLog = { add: function (t) { state.logs.push(String(t)); } };
W.showMessage = function () {};
W.getRealmTier = function () { return 3; };
W.addReputation = function () {};
W.getCurrentCityName = function () { return state.city; };

var cd = {
    name: '测试看客', realm: '筑基', layer: 3, location: '帝都·长安',
    health: 100, maxHealth: 100, qi: 100, maxQi: 200, energy: 100, maxEnergy: 100,
    mood: 80, tempering: 0, karma: 0, notoriety: 0, fame: 0,
    lifeSkills: { '音律': 0, '口才': 20, '学识': 20 }
};
W.currentCharData = cd;
W.inventory = { currency: { spiritStones: 100, copper: 500 }, slots: [] };
W.currentEquipment = {};
W.itemById = {};
W.EventBus = { emit: function () {}, on: function () {} };
W.StateRegistry = { register: function () {} };
W.updateCurrencyUI = function () {};
W.updateCharacterStatus = function () {};
W.getLifeSkill = function (name) { return (cd.lifeSkills || {})[name] || 0; };

vm.createContext(W);
function load(rel) { vm.runInContext(loadScript(rel), W, { filename: rel }); }
load('js/economy/economy-transaction.js');
load('js/core/reward-service.js');
load('js/core/scenario-engine.js');
load('js/qin-arts.js');
load('js/city-facilities/city-voices.js');
load('js/city-facilities/facility-qin-venue.js');

var SE = W.scenarioEngine;
var RS = W.RewardService;

function fresh() {
    SE.cancel();
    cd.mood = 80; cd.energy = 100;
    cd.lifeSkills = { '音律': 0, '口才': 20, '学识': 20 };
    W.inventory.currency = { spiritStones: 100, copper: 500 };
    state.minutes = 0; state.logs.length = 0; state.city = '帝都·长安';
    cd.location = '帝都·长安';
}
function logsHave(word) {
    return state.logs.some(function (l) { return l.indexOf(word) >= 0; });
}

// ==================== A · 位次 ====================
console.log('\n[A] 位次（老验收按位次点单，前五位动不得）');
fresh();
var choices = SE.facilities['goulan_washe'].scenarios[0].nodes.stage_start.choices;
eq(choices.length, 9, 'A1 台面从六面添到九面');
ok(choices[0].text.indexOf('抚琴') >= 0, 'A2 第一位仍是抚琴（v20.90 老钉）');
ok(choices[2].text.indexOf('摄魂音') >= 0 && choices[3].text.indexOf('台下听曲') >= 0, 'A3 第三四位仍是摄魂音与听曲');
ok(choices[4].text.indexOf('转入幕后') >= 0, 'A4 第五位仍是转入幕后');
ok(choices[5].text.indexOf('杂耍') >= 0 && choices[6].text.indexOf('皮影') >= 0 && choices[7].text.indexOf('口技') >= 0, 'A5 新三面排在幕后之后（杂耍/皮影/口技）');
ok(choices[8].text.indexOf('离了勾栏') >= 0, 'A6 散场仍是最后一面');
SE.start('goulan_washe', 'stage');
var r4 = SE.choose(4);
ok(r4 && !r4.error && !r4.done && /幕后/.test(r4.desc || ''), 'A7 按老位次点「转入幕后」照旧走进小院');

// ==================== B · 心境通道 ====================
console.log('\n[B] 心境通道（统一结算收了心境键）');
fresh();
eq(RS.normalize({}).mood, 0, 'B1 无心境的效果表不受扰（normalize 归零）');
var r1 = RS.apply({ mood: 8 });
eq(cd.mood, 88, 'B2 心境 80 → 88');
ok(r1.messages.join('').indexOf('心境+8') >= 0, 'B3 长进有回执文案');
cd.mood = 99;
RS.apply({ mood: 8 });
eq(cd.mood, 100, 'B4 心境封顶 100');
cd.mood = 2;
RS.apply({ mood: -5 });
eq(cd.mood, 0, 'B5 心境落底 0');
cd.mood = undefined;
RS.apply({ mood: 5 });
eq(cd.mood, 85, 'B6 没记心境的按开局基数 80 起算');
var r2 = RS.apply({ copper: 5 });
ok(r2.messages.join('').indexOf('心境') < 0, 'B7 不带心境键的老账不多嘴');
ok(RS.normalize({}).lifeSkill === null, 'B8 老纪律不破（无 lifeSkill 归 null）');

// ==================== C · 看戏三口子 ====================
console.log('\n[C] 看戏三口子（几文钱买半个时辰的热闹）');
fresh();
SE.start('goulan_washe', 'stage');
var r = SE.choose(5);
ok(r && !r.error, 'C1 杂耍看得成' + (r && r.error ? '：' + r.error : ''));
eq(W.inventory.currency.copper, 495, 'C2 杂耍 5 文钱真扣（经济事务）');
eq(cd.mood, 88, 'C3 看热闹心境 +8');
eq(state.minutes, 45, 'C4 一场 45 分钟真跳');
ok(logsHave('吞刀喷火'), 'C5 节目话术上账');
ok(logsHave('候差的官身'), 'C6 帝都的台下是帝都的看客（分城 crowd 接上）');
// 皮影
fresh();
SE.start('goulan_washe', 'stage');
r = SE.choose(6);
ok(r && !r.error, 'C7 皮影看得成');
eq(W.inventory.currency.copper, 495, 'C8 皮影 5 文钱');
eq(cd.mood, 86, 'C9 看故事心境 +6');
eq(cd.lifeSkills['学识'], 21, 'C10 看戏也长见识（学识 +1，统一通道）');
eq(state.minutes, 45, 'C11 一场 45 分钟');
ok(logsHave('白幕之后'), 'C12 皮影话术上账');
// 口技
fresh();
SE.start('goulan_washe', 'stage');
r = SE.choose(7);
ok(r && !r.error, 'C13 口技听得成');
eq(W.inventory.currency.copper, 492, 'C14 口技 8 文钱（绝活贵些）');
eq(cd.lifeSkills['音律'], 1, 'C15 听口技偷师几分（音律 +1）');
eq(cd.mood, 86, 'C16 心境 +6');
ok(logsHave('百鸟齐鸣'), 'C17 口技话术上账');
// 换城换看客
fresh();
state.city = '鲛人镇'; cd.location = '鲛人镇';
SE.start('goulan_washe', 'stage');
SE.choose(5);
ok(logsHave('谁起哄谁上台'), 'C18 鲛人镇的台下是鲛人镇的规矩（crowd 按城取词）');
// 钱不够
fresh();
W.inventory.currency.copper = 3;
SE.start('goulan_washe', 'stage');
r = SE.choose(5);
ok(r && r.error && r.error.indexOf('铜钱不足') >= 0, 'C19 钱不够如实回绝（' + (r && r.error) + '）');
eq(cd.mood, 80, 'C20 没看成心境分毫不动');
eq(W.inventory.currency.copper, 3, 'C21 没看成钱也分毫不动（原子结算）');
eq(state.minutes, 0, 'C22 没看成时间也不跳');

// ==================== D · 分城 crowd ====================
console.log('\n[D] 分城 crowd（八座瓦舍城一座不落）');
var VOICES = W.CITY_VOICES;
var WASHE_CITIES = ['帝都·长安', '洛水城', '青木城', '炎城', '万毒谷', '金城', '冰原城', '鲛人镇'];
var latin = /[A-Za-z]/;
var bad = [];
WASHE_CITIES.forEach(function (c) {
    var g = VOICES[c] && VOICES[c].goulan_washe;
    if (!g || typeof g.crowd !== 'string' || !g.crowd) bad.push(c + '(缺)');
    else if (latin.test(g.crowd)) bad.push(c + '(混拉丁)');
});
ok(bad.length === 0, 'D1 八城 crowd 词齐且全中文（违例: ' + bad.slice(0, 3) + '）');
var extra = Object.keys(VOICES).filter(function (c) { return VOICES[c].goulan_washe && WASHE_CITIES.indexOf(c) < 0; });
eq(extra.length, 0, 'D2 没挂瓦舍的城不配氛围词（多出: ' + extra.slice(0, 3) + '）');
ok(!VOICES['佛国遗址'].goulan_washe && !VOICES['万剑宗'].goulan_washe, 'D3 佛国剑冢不开瓦舍也不配词（v21.4 老口径）');
ok(W.CityVoices.vo('不存在城', 'goulan_washe', 'crowd', '') === '', 'D4 缺城回落无引子（不硬塞）');

// ==================== E · 哨兵 ====================
console.log('\n[E] 哨兵（新面干净，老面未动）');
var src = loadScript('js/city-facilities/facility-qin-venue.js');
eq((src.match(/Math\.random/g) || []).length, 0, 'E1 瓦舍剧本仍零骰（成败签全走引擎随机源）');
ok(src.indexOf("name: '口才', exp: 2") >= 0, 'E2 说书长口才的老账一字未动（v20.94 老钉）');
ok(src.indexOf('.mood =') < 0, 'E3 剧本不直写心境（全走统一结算通道）');
// 新三面：无 roll（看戏是定数账，不是赌局）
[5, 6, 7].forEach(function (i) {
    ok(!choices[i].effects.roll, 'E4-' + i + ' 看戏口子无成败签（花钱买松快，童叟无欺）');
    ok(choices[i].effects.cost && choices[i].effects.cost.copper > 0, 'E5-' + i + ' 看戏口子有票价');
    ok(choices[i].effects.time === 45, 'E6-' + i + ' 看戏口子结 45 分钟');
});
// 老纪律：所有 roll 都有输赢两分支
var badRoll = [];
(SE.facilities['goulan_washe'].scenarios || []).forEach(function (sc) {
    Object.keys(sc.nodes).forEach(function (nk) {
        (sc.nodes[nk].choices || []).forEach(function (c) {
            var eff = c.effects || {};
            if (eff.roll && (!eff.roll.win || !eff.roll.lose || !Object.keys(eff.roll.lose).length)) badRoll.push(nk);
        });
    });
});
eq(badRoll.length, 0, 'E7 成败签输赢两分支的老纪律不破');
// 玩家可见文案零漏翻（v20.90 Q5 同款）
var leaky = (src.match(/'[^'\n]*'/g) || []).filter(function (s) { return /[一-鿿]/.test(s) && /[A-Za-z]{3}/.test(s); });
eq(leaky.length, 0, 'E8 瓦舍文案零漏翻' + (leaky.length ? '：' + leaky[0] : ''));
var rsSrc = loadScript('js/core/reward-service.js');
ok(rsSrc.indexOf('mood: signedInt(spec.mood)') >= 0 && rsSrc.indexOf("messages.push('心境'") >= 0, 'E9 统一结算通道心境键在册（normalize + apply 两头）');
var cvSrc = loadScript('js/city-facilities/city-voices.js');
eq((cvSrc.match(/crowd: '/g) || []).length, 8, 'E10 口吻包添了八条瓦舍氛围词');
eq((cvSrc.match(/chess: '/g) || []).length, 5, 'E11 五座茶馆城各备了一位棋客');
eq((cvSrc.match(/idle: \[/g) || []).length, 5, 'E12 茶馆 idle 词条仍是五处（添键没挤掉老词）');

console.log('\n========== 第六十五波 · 瓦舍节目单 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
