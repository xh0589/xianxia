/**
 * v20.92-art-grades-node.js — 功法品阶归九品制验收：
 *   Q1 词表归一：五档旧名（凡品/良品/珍品/优品/仙品）全库换成九品制（九/八/七/五/三品）
 *   Q2 数据面：53 门基础功法 + 36 派门派功法的品阶全在新词表内
 *   Q3 逻辑面：请教束脩表/品阶排序/境界门/颜色/历练账全按新词走，七品补进价目表
 *   Q4 旧档兼容：normalizeGrade 折算旧名；队伍面板展示走折算；成就稀有度话术同步
 *
 * 运行：node tests/v20.92-art-grades-node.js
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

var NEW_GRADES = ['九品', '八品', '七品', '六品', '五品', '四品', '三品', '二品', '一品'];
var OLD_GRADES = ['凡品', '良品', '珍品', '优品', '仙品'];

// ============ 世界桩（只为跑 items.js 的折算函数） ============
var W = {
    console: { log: function () {}, warn: function () {}, error: function () {} },
    setTimeout: function () { return 0; },
    localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
    document: { createElement: function () { return { style: {}, classList: { add: function () {}, remove: function () {} }, dataset: {} }; }, getElementById: function () { return null; }, querySelector: function () { return null; }, addEventListener: function () {} },
    alert: function () {}
};
W.window = W;
vm.createContext(W);
vm.runInContext(loadScript('js/items.js'), W, { filename: 'js/items.js' });

// ==================== Q1 词表归一 ====================
console.log('\n[Q1] 词表归一');
(function () {
    var files = ['js/equipment.js', 'js/sects/sect-internal.js', 'js/npcs/skill-transmission.js', 'js/app.js',
        'js/loot-system.js', 'js/items-extended/09-loot-sources.js', 'js/crafting/craft-custom-pill.js',
        'js/extensions/root-refine.js', 'js/map/high-planes.js', 'js/cultivation/art-effects.js',
        'js/city-facilities/facility-batch2.js', 'js/achievement-system.js', 'js/npcs/npc-inventory.js'];
    var stray = [];
    files.forEach(function (f) {
        var src = loadScript(f);
        // 兼容表与「无分凡仙」类文字游戏除外
        var lines = src.split('\n');
        lines.forEach(function (l, i) {
            if (/GRADE_LEGACY_MAP|normalizeGrade|无分凡仙/.test(l)) return;
            OLD_GRADES.forEach(function (g) { if (l.indexOf(g) >= 0) stray.push(f + ':' + (i + 1) + ' ' + g); });
        });
    });
    ok(stray.length === 0, 'Q1 品阶词旧名该全库清零' + (stray.length ? '：' + stray.slice(0, 4).join('；') : ''));
    // 折算表本身要留住旧名（旧档要靠它认路）
    ok(OLD_GRADES.every(function (g) { return !!W.GRADE_LEGACY_MAP[g]; }), 'Q1 五档旧名都该在折算表里');
})();

// ==================== Q2 数据面 ====================
console.log('\n[Q2] 功法数据全在新词表');
(function () {
    var eqSrc = loadScript('js/equipment.js');
    var eqGrades = (eqSrc.match(/grade: '([^']+)'/g) || []).map(function (m) { return m.match(/grade: '([^']+)'/)[1]; });
    ok(eqGrades.length >= 50, 'Q2 基础功法该 50 门以上（实得 ' + eqGrades.length + '）');
    var eqStray = eqGrades.filter(function (g) { return NEW_GRADES.indexOf(g) < 0; });
    ok(eqStray.length === 0, 'Q2 基础功法品阶全在九品制内' + (eqStray.length ? '：' + eqStray.join(',') : ''));
    ok(eqGrades.indexOf('九品') >= 0 && eqGrades.indexOf('八品') >= 0 && eqGrades.indexOf('五品') >= 0 && eqGrades.indexOf('三品') >= 0,
        'Q2 基础功法该从九品铺到三品');
    var siSrc = loadScript('js/sects/sect-internal.js');
    var siGrades = (siSrc.match(/grade: '([^']+)'/g) || []).map(function (m) { return m.match(/grade: '([^']+)'/)[1]; });
    ok(siGrades.length >= 100, 'Q2 门派功法该百门上下（实得 ' + siGrades.length + '）');
    var siStray = siGrades.filter(function (g) { return NEW_GRADES.indexOf(g) < 0; });
    ok(siStray.length === 0, 'Q2 门派功法品阶全在九品制内' + (siStray.length ? '：' + siStray.join(',') : ''));
    ok(siGrades.indexOf('八品') >= 0 && siGrades.indexOf('七品') >= 0 && siGrades.indexOf('三品') >= 0, 'Q2 门派功法该有八品/七品/三品三层');
    // 门派功法抄本合成：三品功法合出来的秘籍该是三品品质
    ok(/art\.grade === '三品' \? 'PIN3' : 'PIN7'/.test(siSrc), 'Q2 功法抄本品质该按新品阶折算');
})();

// ==================== Q3 逻辑面 ====================
console.log('\n[Q3] 请教/传授按新词走');
(function () {
    var stSrc = loadScript('js/npcs/skill-transmission.js');
    ok(/GRADE_COST = \{\s*'九品': \{ favor: 10, stones: 100 \}/.test(stSrc), 'Q3 束脩价目表该按九品起价');
    ok(/'七品': \{ favor: 25, stones: 500 \}/.test(stSrc), 'Q3 门派功法的七品该有自己的价（不再落八品兜底）');
    ok(/'三品': \{ favor: 45, stones: 2000, minTier: 5 \}/.test(stSrc), 'Q3 三品束脩最重且须化神');
    ok(/GRADE_ORDER = \['九品', '八品', '七品', '五品', '三品'\]/.test(stSrc), 'Q3 品阶排序表该五档齐全升序');
    ok(/GRADE_COST\[t\.def\.grade\] \|\| GRADE_COST\['八品'\]/.test(stSrc), 'Q3 价目兜底该落八品');
    ok(stSrc.indexOf('三品功法气象浩瀚') >= 0, 'Q3 境界不够的拒绝话术该说三品');
    ok(/def\.grade === '三品' \? 60 : def\.grade === '五品' \? 40 : 25/.test(stSrc), 'Q3 教学相长历练账该按新词（三品60/五品40/其余25）');
    ok(/def\.grade === '三品' && npcTier < 3/.test(stSrc), 'Q3 传授三品该验对方金丹');
    // 掌门压箱底与长老配给按三品划线
    ok(/d\.def\.grade === '三品'/.test(stSrc) && /leader\._holdsUltimate = true/.test(stSrc), 'Q3 掌门本命三品持有标记接线还在');
    // 面板品阶颜色
    var appSrc = loadScript('js/app.js');
    ok(/sk\.grade === '三品' \? 'text-yellow-400'/.test(appSrc) && /sk\.grade === '五品' \? 'text-purple-400'/.test(appSrc), 'Q3 功法面板颜色该认三品/五品');
})();

// ==================== Q4 旧档兼容 ====================
console.log('\n[Q4] 旧档折算');
(function () {
    ok(W.normalizeGrade('仙品') === '三品' && W.normalizeGrade('凡品') === '九品' && W.normalizeGrade('珍品') === '七品', 'Q4 旧品阶名该折算到新档');
    ok(W.normalizeGrade('优品') === '五品' && W.normalizeGrade('良品') === '八品', 'Q4 优品折五品、良品折八品');
    ok(W.normalizeGrade('三品') === '三品' && W.normalizeGrade(undefined) === undefined, 'Q4 新名原样过、空值不炸');
    // 队伍面板展示持久化的 NPC 功法——旧存档里的旧名要过折算再上屏
    var psSrc = loadScript('js/party-system.js');
    ok(/normalizeGrade\(s\.grade\)/.test(psSrc), 'Q4 队伍面板该把存档里的旧品阶名折算后再显示');
    // 成就稀有度话术同步归九品制
    var achSrc = loadScript('js/achievement-system.js');
    ok(/ACH_RARITY_CN = \{ common: '九品', uncommon: '七品', rare: '五品', epic: '三品', legendary: '一品' \}/.test(achSrc), 'Q4 成就稀有度该换九品制话术');
    // v20.88 传功验收跟着换词（数据与断言同一套话）
    var t88 = loadScript('tests/v20.88-skill-transmission-node.js');
    var t88Stray = OLD_GRADES.filter(function (g) { return t88.indexOf("'" + g + "'") >= 0; });
    ok(t88Stray.length === 0, 'Q4 v20.88 验收断言该全用新品阶名' + (t88Stray.length ? '：' + t88Stray.join(',') : ''));
})();

// ==================== 结果 ====================
console.log('\n========== v20.92 功法品阶归一 ==========');
console.log('通过 ' + passed + ' / 失败 ' + failed);
process.exit(failed ? 1 : 0);
