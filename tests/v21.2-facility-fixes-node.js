/**
 * v21.2-facility-fixes-node.js — 建筑交互修复验收：
 *   Q1 单出戏设施点了没反应（真 bug）：弹窗 hidden 从未摘除——修复后运行时验证显形
 *   Q2 勾栏瓦舍简介：不再是兜底「点击使用」，有自己的描述；兜底文案也换掉
 *   Q3 建筑按钮口径：城市建筑/地图设施/门派设施「使用」全部改「前往」；物品「使用」不动
 *
 * 运行：node tests/v21.2-facility-fixes-node.js
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

// ==================== Q1 单出戏设施弹窗显形（运行时） ====================
console.log('\n[Q1] 单出戏设施点击必须显形');
(function () {
    var elems = {};
    function makeEl(id) {
        return {
            id: id || '', className: '', innerHTML: '', textContent: '', style: {},
            classList: {
                _s: {},
                add: function (c) { this._s[c] = 1; },
                remove: function (c) { delete this._s[c]; },
                contains: function (c) { return !!this._s[c]; }
            },
            appendChild: function (el) { if (el && el.id) elems[el.id] = el; },
            remove: function () {}
        };
    }
    var W = {
        console: { log: function () {}, warn: function () {}, error: function () {} },
        setTimeout: function (fn) { return 0; },
        localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
        document: {
            createElement: function () { return makeEl(''); },
            getElementById: function (id) { return elems[id] || (elems[id] = makeEl(id)); },
            querySelector: function () { return null; },
            querySelectorAll: function () { return []; },
            addEventListener: function () {},
            body: { appendChild: function (el) { if (el && el.id) elems[el.id] = el; } }
        },
        alert: function () {}
    };
    W.window = W;
    var msgs = [];
    W.showMessage = function (t) { msgs.push(String(t)); };
    W.gameLog = { add: function () {} };
    vm.createContext(W);
    vm.runInContext(loadScript('js/core/scenario-engine.js'), W, { filename: 'scenario-engine.js' });

    // 注册一出戏的设施（勾栏瓦舍同款结构）与两出戏的设施
    W.scenarioEngine.register('t_single', {
        id: 't_single', name: '单出戏', icon: '🎭', desc: '只有一出',
        scenarios: [{ id: 's1', name: '正戏', startNode: 'n1', nodes: { n1: { desc: '开场了', choices: [] } } }]
    });
    W.scenarioEngine.register('t_double', {
        id: 't_double', name: '双出戏', icon: '🎭', desc: '有两出',
        scenarios: [
            { id: 's1', name: '戏一', startNode: 'n1', nodes: { n1: { desc: '一', choices: [] } } },
            { id: 's2', name: '戏二', startNode: 'n1', nodes: { n1: { desc: '二', choices: [] } } }
        ]
    });

    // 单出戏：直开路径——此前弹窗永远 hidden（玩家看到的就是点了没反应）
    W.openFacilityScenario('t_single');
    var modal = elems['scenario-modal'];
    ok(!!modal, 'Q1 弹窗该被创建');
    ok(modal.classList.contains('hidden') === false, 'Q1 单出戏直开该摘掉 hidden（修复「点击没反应」）');
    ok(elems['sm-desc'] && elems['sm-desc'].textContent === '开场了', 'Q1 直开该渲染到正戏内容');
    ok(elems['sm-title'] && elems['sm-title'].textContent.indexOf('单出戏') >= 0, 'Q1 标题该挂设施名');

    // 双出戏：菜单路径不受修复影响
    modal.classList.add('hidden');
    W.openFacilityScenario('t_double');
    ok(modal.classList.contains('hidden') === false, 'Q1 多出戏菜单路径照常显形');
    ok(elems['sm-sub'] && elems['sm-sub'].textContent === '选择一个事件', 'Q1 多出戏仍是先选戏');

    // 未注册设施：提示而非静默
    msgs.length = 0;
    W.openFacilityScenario('t_none');
    ok(msgs.length === 1, 'Q1 没注册的设施该有提示不静默');
})();

// ==================== Q2 勾栏瓦舍简介 ====================
console.log('\n[Q2] 简介不再是「点击使用」');
(function () {
    var ls = loadScript('js/location-system.js');
    ok(ls.indexOf("'点击使用'") < 0, 'Q2 「点击使用」兜底文案该清除');
    var d = ls.slice(ls.indexOf('function getBuildingDescription'), ls.indexOf('return descriptions[buildingId]'));
    ok(d.indexOf("'goulan_washe': '登台卖艺赚打赏，幕后练琴长音律'") >= 0, 'Q2 勾栏瓦舍该有自己的简介');
    ok(ls.indexOf("|| '值得一去'") >= 0, 'Q2 兜底改成正常话（万一还有漏网的也不露怯）');
    // 描述表全覆盖：BUILDING_TYPES 每个 id 都在 descriptions 里
    var bt = ls.slice(ls.indexOf('const BUILDING_TYPES'), ls.indexOf('function getBuildingDescription'));
    var btBlock = bt.slice(0, bt.indexOf('};'));
    var ids = (btBlock.match(/id: '([a-z_]+)'/g) || []).map(function (x) { return x.slice(5, -1); });
    var keys = (d.match(/'([a-z_]+)':/g) || []).map(function (x) { return x.slice(1, -2); });
    var missing = ids.filter(function (i) { return keys.indexOf(i) < 0; });
    ok(ids.length >= 40 && missing.length === 0, 'Q2 建筑描述表该全覆盖（' + ids.length + ' 种，缺 ' + missing.length + '）');
})();

// ==================== Q3 建筑「使用」→「前往」 ====================
console.log('\n[Q3] 建筑按钮口径：前往');
(function () {
    var ls = loadScript('js/location-system.js');
    ok(ls.indexOf("'>前往</button>'") >= 0 || ls.indexOf("前往') + '</button>'") >= 0 || ls.indexOf("(isOnCooldown ? '冷却中' : '前往')") >= 0, 'Q3 城市建筑卡按钮该是「前往」');
    var app = loadScript('js/app.js');
    ok(app.indexOf('executeFacilityAction') >= 0 && /executeFacilityAction[\s\S]{0,300}前往/.test(app), 'Q3 地图设施列表按钮该是「前往」');
    ok(/executeSectFacilityAction[\s\S]{0,300}前往/.test(app), 'Q3 门派设施（地图侧）按钮该是「前往」');
    ok(/interactBuilding[\s\S]{0,200}前往<\/button>/.test(app), 'Q3 野外建筑交互按钮该是「前往」');
    var sf = loadScript('js/sects/sect-facilities.js');
    ok(sf.indexOf("return '前往';") >= 0, 'Q3 门派设施按钮兜底该是「前往」');
    var sv = loadScript('js/sects/sect-visit.js');
    ok(sv.indexOf(": '前往') + '</button>'") >= 0, 'Q3 门派走访设施按钮该是「前往」');
    // 物品的「使用」不许被误伤
    var inv = loadScript('js/inventory.js');
    ok(inv.indexOf('useItem') >= 0 && inv.indexOf('>使用</button>') >= 0, 'Q3 物品按钮仍是「使用」（物品才用使用）');
    // 改造批：门派特色「使用」按钮整套退役（被动底子无按钮无冷却）——走访页换挂「门中底子」卡
    // 十三波修订：八派身份技（有 precheck/costText 代价的活内容）有了带门的「施展」正门；旧纯增益按钮照旧退役
    var sp = loadScript('js/sects/sect-visit.js');
    ok(sp.indexOf('sectPassiveCard') >= 0, 'Q3 底子卡上岗（改造批）');
    ok(sp.indexOf('useSectSpecialty') >= 0 && sp.indexOf('precheck') >= 0 && sp.indexOf('costText') >= 0, 'Q3b 身份技带门正门（只亮有代价的活内容，旧增益按钮不复活）');
})();

// ==================== 结果 ====================
console.log('\n========== v21.2 建筑交互修复 ==========');
console.log('通过 ' + passed + ' / 失败 ' + failed);
process.exit(failed ? 1 : 0);
