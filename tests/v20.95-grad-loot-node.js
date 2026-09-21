/**
 * v20.95-grad-loot-node.js — 毕业装掉落验收：
 *   Q1 掉落梯：四本压箱账（六品/四品/二品/一品）全在册且件件可查，无一枚信物/奇物混入
 *   Q2 强敌压箱：等级与灵蕴双轨开闸——15+精英出六品、20+首领出四品、26+出二品、灵脉三重魔头与30+深层首领出一品；小怪一文不沾
 *   Q3 灵蕴透传：灵脉强敌生成时灵蕴就递进掉落账（battle/randomMap 三处接线）
 *   Q4 兽潮顶货：灭世潮/仙劫潮清剿到底必得二品以上、一成半一品；巨兽潮档三成四品
 *   Q5 幽灵神兽落地：仙劫潮点名的兽全在灵兽谱（含鲲鹏35/金乌32/五色鹿28），野外生态破22级封顶
 *
 * 运行：node tests/v20.95-grad-loot-node.js
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

// ============ 世界桩 ============
var W = {
    console: { log: function () {}, warn: function () {}, error: function () {} },
    setTimeout: function (fn) { try { fn(); } catch (e) {} return 0; },
    localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
    document: {
        createElement: function () { return { style: {}, classList: { add: function () {}, remove: function () {} }, dataset: {}, innerHTML: '', remove: function () {} }; },
        getElementById: function () { return null; },
        querySelector: function () { return null; },
        querySelectorAll: function () { return []; },
        addEventListener: function () {},
        body: { appendChild: function () {} }
    },
    alert: function () {}
};
W.window = W;
W.EventBus = { emit: function () {}, on: function () {} };
W.StateRegistry = { register: function () {} };
W.gameLog = { add: function () {} };
W.showMessage = function () {};
W.inventory = { currency: { spiritStones: 0, copper: 0 }, slots: [] };
W.currentCharData = { realm: '金丹', layer: 3 };
W.addItem = function () { return true; };

vm.createContext(W);
function load(rel) { vm.runInContext(loadScript(rel), W, { filename: rel }); }

// 物品库全量装配（页面加载序同式）+ 战利品系统 + 灵兽谱
load('js/items.js');
['01-pills', '02-weapons', '03-armor', '04-materials', '05-talismans', '06-arts', '07-food', '08-special'].forEach(function (f) { load('js/items-extended/' + f + '.js'); });
load('js/items-extended.js');
['13-missing-ids', '14-ability-manuals', '15-root-refine', '16-dangling-ids', '17-lead-tokens', '18-grade-expansion'].forEach(function (f) { load('js/items-extended/' + f + '.js'); });
load('js/extensions/qiyu-encounters.js');
load('js/loot-system.js');
load('js/beast-taming.js');

// 可控骰子（vm 内 Math.random 注入）
var M = {};
Object.getOwnPropertyNames(Math).forEach(function (k) { try { M[k] = Math[k]; } catch (e) {} });
var __roll = 0.5;
M.random = function () { return __roll; };
W.Math = M;
function roll(v) { __roll = v; }

// ==================== Q1 掉落梯在册 ====================
console.log('\n[Q1] 毕业装掉落梯');
(function () {
    var B = W.GRAD_LOOT_BANDS;
    ok(!!B && !!B.pin6 && !!B.pin4 && !!B.pin2 && !!B.pin1, 'Q1 四本压箱账都该在');
    ['pin6', 'pin4', 'pin2', 'pin1'].forEach(function (b) {
        ok(B[b].length >= 8, 'Q1 ' + b + ' 账该有至少八件货（实得 ' + B[b].length + '）');
        var missing = B[b].filter(function (id) { return !W.itemById[id]; });
        ok(missing.length === 0, 'Q1 ' + b + ' 账内件件可查' + (missing.length ? '，缺：' + missing.join(',') : ''));
    });
    // 信物与奇遇奇物是独一份的，永远不许混进掉落账
    var all = [].concat(B.pin6, B.pin4, B.pin2, B.pin1);
    ok(all.every(function (id) { return id.indexOf('token_') !== 0 && id.indexOf('qiyu_') !== 0; }), 'Q1 信物/奇物不许混进掉落账');
    // 一品账全是 30+ 毕业装
    ok(B.pin1.every(function (id) { var t = W.itemById[id]; return t.quality === 'PIN1' && t.level >= 30; }), 'Q1 一品账该全是 30+ 一品毕业装');
    ok(B.pin2.every(function (id) { return W.itemById[id].quality === 'PIN2'; }), 'Q1 二品账该全是二品');
    ok(B.pin4.every(function (id) { return W.itemById[id].quality === 'PIN4'; }), 'Q1 四品账该全是四品');
    ok(B.pin6.every(function (id) { return W.itemById[id].quality === 'PIN6'; }), 'Q1 六品账该全是六品');
})();

// ==================== Q2 强敌压箱 ====================
console.log('\n[Q2] 谁配带毕业装');
(function () {
    function gradCount(inv) {
        var B = W.GRAD_LOOT_BANDS;
        var all = [].concat(B.pin6, B.pin4, B.pin2, B.pin1);
        return inv.items.filter(function (id) { return all.indexOf(id) >= 0; });
    }
    // 33 级 boss + 必中骰：四档全开
    roll(0.01);
    var inv = W.generateEnemyInventory({ name: '深渊魔头', level: 33, type: 'boss', species: 'human', physiologyType: 'humanoid', combatAbilities: [] });
    var g = gradCount(inv);
    ok(g.length >= 4, 'Q2 33 级首领四档压箱全该开（实得 ' + g.length + ' 件顶货）');
    // 灵脉三重魔头（20 级也出一品）
    roll(0.01);
    inv = W.generateEnemyInventory({ name: '灵脉·魔头', level: 20, type: 'elite', species: 'human', physiologyType: 'humanoid', _leyElite: 3, combatAbilities: [] });
    g = gradCount(inv);
    ok(g.some(function (id) { return W.GRAD_LOOT_BANDS.pin1.indexOf(id) >= 0; }), 'Q2 灵脉三重魔头该带一品毕业装');
    ok(g.some(function (id) { return W.GRAD_LOOT_BANDS.pin2.indexOf(id) >= 0; }), 'Q2 灵脉三重魔头该带二品货');
    // 30 级秘境 boss：一品闸开
    roll(0.01);
    inv = W.generateEnemyInventory({ name: '秘境守主', level: 30, type: 'dungeon_boss', species: 'human', physiologyType: 'humanoid', combatAbilities: [] });
    ok(gradCount(inv).some(function (id) { return W.GRAD_LOOT_BANDS.pin1.indexOf(id) >= 0; }), 'Q2 30 级秘境首领该有一品压箱');
    // 15 级精英：只够六品档
    roll(0.01);
    inv = W.generateEnemyInventory({ name: '山道精英', level: 15, type: 'elite', species: 'human', physiologyType: 'humanoid', combatAbilities: [] });
    g = gradCount(inv);
    ok(g.length >= 1 && g.every(function (id) { return W.GRAD_LOOT_BANDS.pin6.indexOf(id) >= 0; }), 'Q2 15 级精英只该摸到六品档');
    // 5 级小贼：一文顶货不沾
    roll(0.01);
    inv = W.generateEnemyInventory({ name: '小毛贼', level: 5, type: 'bandit', species: 'human', physiologyType: 'humanoid', combatAbilities: [] });
    ok(gradCount(inv).length === 0, 'Q2 小怪不该沾顶货');
    // 必不中骰：33 级 boss 也不掉顶货（概率闸真在算）
    roll(0.99);
    inv = W.generateEnemyInventory({ name: '深渊魔头', level: 33, type: 'boss', species: 'human', physiologyType: 'humanoid', combatAbilities: [] });
    ok(gradCount(inv).length === 0, 'Q2 缘分不到（高骰）顶货不出');
    roll(0.5);
})();

// ==================== Q3 灵蕴透传 ====================
console.log('\n[Q3] 灵蕴递进掉落账');
(function () {
    var bSrc = loadScript('js/battle.js');
    ok(/_leyElite: \(spawnOpts && spawnOpts\.leyTier\) \|\| 0/.test(bSrc), 'Q3 敌人生成该把灵蕴透传进携带物账');
    var mSrc = loadScript('js/map/randomMap.js');
    ok((mSrc.match(/leyTier: c\.ley|leyTier: leyTier/g) || []).length >= 2, 'Q3 灵脉两处生成点都该随生成递灵蕴');
})();

// ==================== Q4 兽潮顶货 ====================
console.log('\n[Q4] 兽潮清剿的潮头遗宝');
(function () {
    var aSrc = loadScript('js/app.js');
    ok(/_boost >= 3\) tidePrize = _pick\(Math\.random\(\) < 0\.15 \? 'pin1' : 'pin2'\)/.test(aSrc), 'Q4 灭世潮/仙劫潮清剿到底必得二品以上、一成半一品');
    ok(/_boost >= 2 && Math\.random\(\) < 0\.3\) tidePrize = _pick\('pin4'\)/.test(aSrc), 'Q4 稀有度+2 的大潮三成得四品');
    ok(/潮头遗宝/.test(aSrc), 'Q4 顶货该有潮头遗宝的名目');
    // 赏赐在打完最后一波才给（清剿半途而废没有）——限定在 settle 函数体内查先后
    var fnStart = aSrc.indexOf('function settleBeastTideRaid');
    var fnEnd = aSrc.indexOf('function enterScoutedDungeon');
    var fnSrc = aSrc.slice(fnStart, fnEnd > fnStart ? fnEnd : fnStart + 4000);
    ok(fnSrc.indexOf('if (more)') >= 0 && fnSrc.indexOf('tidePrize') > fnSrc.indexOf('if (more)'), 'Q4 顶货只随清剿到底发放（半途而废没有）');
})();

// ==================== Q5 幽灵神兽落地 ====================
console.log('\n[Q5] 仙劫潮点名的兽全在谱');
(function () {
    var BT = W.BEAST_TEMPLATES;
    var POOL = ['thunder_eagle', 'dragon_turtle', 'fire_phoenix', 'xuan_gui', 'thunder_beast', 'crane', 'black_bear', 'five_color_deer', 'golden_crow', 'kunpeng'];
    var missing = POOL.filter(function (id) { return !BT[id]; });
    ok(missing.length === 0, 'Q5 兽潮稀有池十个名号灵兽谱全该有' + (missing.length ? '，缺：' + missing.join(',') : ''));
    ok(BT.kunpeng && BT.kunpeng.level === 35 && BT.kunpeng.mount && BT.kunpeng.mount.speed >= 3, 'Q5 鲲鹏 35 级可乘（天下最快的坐骑）');
    ok(BT.golden_crow && BT.golden_crow.level === 32, 'Q5 金乌 32 级在册');
    ok(BT.five_color_deer && BT.five_color_deer.level === 28, 'Q5 五色鹿 28 级在册');
    ok(['crane', 'xuan_gui', 'thunder_beast', 'black_bear'].every(function (id) { return BT[id] && BT[id].catchable; }), 'Q5 中段四兽可收服');
    // 野外生态破 22 级封顶
    var eSrc = loadScript('js/extensions/beast-ecosystem.js');
    ok(/beast_kunpeng[\s\S]{0,120}level: 35/.test(eSrc) && /beast_goldencrow[\s\S]{0,120}level: 32/.test(eSrc) && /beast_fivecolordeer[\s\S]{0,120}level: 28/.test(eSrc), 'Q5 野外生态该栖三只传说级（28/32/35）');
    ok(/'五色鹿': 'beast_fivecolordeer'/.test(eSrc) && /kunpeng: 'beast_kunpeng'/.test(eSrc), 'Q5 生态双映射该收三只新兽');
    // 传说级只栖后期地界（新手村外碰不着）
    var kd = eSrc.match(/beast_kunpeng[\s\S]{0,200}?regions: \[([^\]]*)\]/);
    ok(!!kd && kd[1].indexOf('中州') < 0, 'Q5 鲲鹏不栖中州新手地界');
})();

// ==================== 结果 ====================
console.log('\n========== v20.95 毕业装掉落 ==========');
console.log('通过 ' + passed + ' / 失败 ' + failed);
process.exit(failed ? 1 : 0);
