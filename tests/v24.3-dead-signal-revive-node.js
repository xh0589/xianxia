/**
 * ==================== v24.3 死信号修复验收 ====================
 * 两件（都是审计立过案、当前代码里仍活着的病灶）：
 *
 * ① _deInBattle 三条检查全死（NEW-76 丙组点名 + v24 审计运行时三查皆空）：
 *    window.battle（全仓零写方）／Battle.instance（Battle 是类、无单例）／
 *    #battle-panel（从未被创建，真身是 #battle-modal）——三条恒假 ⇒ 恒 return false，
 *    战斗中日常事件照弹不误，盖住出手时机。
 *    修：改认全仓权威信号 window.currentBattle（判活口径与 talisman-system.inBattle 同款），
 *    另拿真弹窗 #battle-modal 做 DOM 兜底（胜利结算屏 isFinished=true 但弹窗未关那段也抑制）。
 *
 * ② renderSectFacilitiesList 静默夭折（NEW-77 立案「容器不存在/函数早退」）：
 *    目标容器 #sect-facilities-list 在早前 HTML 重排时遗失，函数每次早退——
 *    八个设施按钮（v20.8 特意全部接回真实系统）从未上过屏。
 *    修：仙侠.html 补回容器；同时把语义钉正——按钮全走 useFacility（操作「自己门派」的账），
 *    只有点的是自己所在门派才渲染，别家门派保持纯介绍（selectSect 的本意）并清掉残留。
 *
 * 运行：node tests/v24.3-dead-signal-revive-node.js
 */
'use strict';

var fs = require('fs');
var path = require('path');
var ROOT = path.resolve(__dirname, '..');

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; console.log('  ✓ ' + msg); }
    else { failed++; console.error('  ✗ ' + msg); }
}
function src(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// 花括号配对切函数体（wave120 同款手法）
function sliceFn(source, sig) {
    var at = source.indexOf(sig);
    if (at < 0) return null;
    var i = source.indexOf('{', at), depth = 0, end = -1;
    for (; i < source.length; i++) {
        var c = source[i];
        if (c === '{') depth++;
        else if (c === '}') { depth--; if (!depth) { end = i; break; } }
    }
    return end < 0 ? null : source.slice(source.indexOf('{', at) + 1, end);
}

// ============ [A] _deInBattle 源码棘轮 ============
console.log('--- [A] _deInBattle 源码棘轮 ---');
(function () {
    var de = src('js/core/daily-events.js');
    // 棘轮剥注释再扫：修复说明里给死信号立墓碑提到名字不算「回来」，真代码里出现才算
    var deCode = de.split(/\r?\n/).filter(function (l) { return l.trim().indexOf('//') !== 0; }).join('\n');
    assert(deCode.indexOf('window.battle && window.battle.active') < 0, 'A1 棘轮：死信号 window.battle（全仓零写方）不许回来');
    assert(deCode.indexOf('Battle.instance') < 0, 'A2 棘轮：死信号 Battle.instance（类无单例）不许回来');
    assert(deCode.indexOf("getElementById('battle-panel')") < 0, 'A3 棘轮：死信号 #battle-panel（从未被创建）不许回来');
    assert(/var b = window\.currentBattle;\n        if \(b && !b\.isFinished && b\.enemy && b\.enemy\.isAlive\) return true;/.test(de),
        'A4 权威信号就位：window.currentBattle 判活口径与 talisman-system.inBattle 同款');
    assert(/getElementById\('battle-modal'\)[\s\S]{0,120}classList\.contains\('hidden'\)/.test(de),
        'A5 DOM 兜底认的是真弹窗 #battle-modal（仙侠.html:1672 实存）');
    var html = src('仙侠.html');
    assert((html.match(/id="battle-modal"/g) || []).length === 1, 'A6 #battle-modal 在主页面实存且唯一');
})();

// ============ [B] _deInBattle 行为面 ============
console.log('--- [B] _deInBattle 行为面 ---');
(function () {
    var de = src('js/core/daily-events.js');
    var body = sliceFn(de, 'function _deInBattle');
    assert(!!body, 'B0 切片成功');
    // 旧函数（改前原样）——用于改前对照
    var 旧函数 = new Function('window', 'document',
        'return function _deInBattle() { try {' +
        ' if (window.battle && window.battle.active) return true;' +
        ' if (window.Battle && window.Battle.instance && window.Battle.instance.running) return true;' +
        " if (document.getElementById('battle-panel') && !document.getElementById('battle-panel').classList.contains('hidden')) return true;" +
        ' } catch (e) {} return false; };');
    var 新函数 = new Function('window', 'document', 'return function _deInBattle() {' + body + '};');

    function 场(battle, modalHidden) {
        var w = { currentBattle: battle };
        if (battle === 'legacy') { // 旧信号全亮、真信号全无
            w.battle = { active: true };
            w.Battle = { instance: { running: true } };
            w.currentBattle = null;
        }
        var modal = { classList: { contains: function (c) { return c === 'hidden' ? modalHidden : false; } } };
        var d = { getElementById: function (id) {
            if (id === 'battle-modal') return modalHidden === null ? null : modal;
            return null; // battle-panel 照实境永远 null（全仓无人创建它）——旧函数拿不到这根稻草
        } };
        return { w: w, d: d };
    }
    var 真战斗 = { isFinished: false, enemy: { isAlive: true } };
    var 结算屏 = { isFinished: true, enemy: { isAlive: false } };

    var s1 = 场(null, true);
    assert(新函数(s1.w, s1.d)() === false, 'B1 没打仗：false（不误伤平时）');
    var s2 = 场(真战斗, false);
    assert(新函数(s2.w, s2.d)() === true, 'B2 真战斗（currentBattle 活着）：true——日常事件让路');
    assert(旧函数(s2.w, s2.d)() === false, 'B2b 改前对照：同一场真战斗，旧三条全死恒 false（病是真的）');
    var s3 = 场(结算屏, false);
    assert(新函数(s3.w, s3.d)() === true, 'B3 胜利结算屏（isFinished 但弹窗还开着）：true——战利品屏不被事件盖住');
    var s4 = 场(结算屏, true);
    assert(新函数(s4.w, s4.d)() === false, 'B4 战斗结束且弹窗已收：false');
    var s5 = 场('legacy', true);
    assert(新函数(s5.w, s5.d)() === false, 'B5 旧三信号全亮、真信号全无：false——死的闸门不再驱动这道判断');
    var s6 = 场({ isFinished: false, enemy: null }, false);
    assert(新函数(s6.w, s6.d)() === true, 'B6 enemy 未生成但弹窗已开：DOM 兜底接住（true）');
})();

// ============ [C] 设施列表还魂 ============
console.log('--- [C] 本派设施快捷栏还魂 ---');
(function () {
    var html = src('仙侠.html');
    assert((html.match(/id="sect-facilities-list"/g) || []).length === 1, 'C1 容器已补回 仙侠.html 且唯一（NEW-77 立案的「容器不存在」结案）');
    var app = src('js/app.js');
    assert(/if \(!\(_dsSf\.isInSect && \(_dsSf\.sectId === sectName \|\| _dsSf\.sectName === sectName\)\)\) return;/.test(app),
        'C2 成员闸就位：只有点的是自己所在门派才渲染（别家纯介绍，useFacility 认的是自家账）');
    // 行为面：切 SECT_FACILITIES 表 + 函数本体进沙箱
    var tAt = app.indexOf('const SECT_FACILITIES = [');
    var tEnd = app.indexOf('\n];', tAt);
    assert(tAt >= 0 && tEnd > tAt, 'C3 切片成功：SECT_FACILITIES 表');
    var 表源 = app.slice(tAt, tEnd + 3);
    var 体 = sliceFn(app, 'function renderSectFacilitiesList');
    assert(!!体, 'C3b 切片成功：renderSectFacilitiesList 函数体');

    function fakeEl() {
        var el = { children: [], className: '', _html: '' };
        Object.defineProperty(el, 'innerHTML', {
            get: function () { return this._html; },
            set: function (v) { this._html = String(v); if (v === '') this.children.length = 0; },
            configurable: true
        });
        el.appendChild = function (c) { this.children.push(c); return c; };
        return el;
    }
    function 渲一次(ds, 已有残留) {
        var container = fakeEl();
        if (已有残留) { container._html = '<b>上一家的残留</b>'; container.children.push(fakeEl()); }
        var d = { getElementById: function (id) { return id === 'sect-facilities-list' ? container : null; },
                  createElement: function () { return fakeEl(); } };
        var fn = new Function('window', 'document', 表源 + '\nreturn function renderSectFacilitiesList(sectName) {' + 体 + '};');
        fn({ discipleState: ds }, d)('少林寺');
        return container;
    }
    var 弟子 = { isInSect: true, sectId: '少林寺', rank: 4, contribution: 120 };
    var c1 = 渲一次(弟子);
    assert(c1.children.length === 8, 'C4 自己门派：八所设施全上桌（实得 ' + c1.children.length + '）');
    assert(c1.children.every(function (el) { return /executeSectFacilityAction\('/.test(el.innerHTML) && el.innerHTML.indexOf('前往') >= 0; }),
        'C4b 每格都带「前往」按钮且接 executeSectFacilityAction（v20.8 接回的真实系统入口）');
    var c2 = 渲一次({ isInSect: true, sectId: '武当派' });
    assert(c2.children.length === 0 && c2.innerHTML === '', 'C5 别家门派：纯介绍，一格不摆');
    var c3 = 渲一次({ isInSect: true, sectId: '武当派' }, true);
    assert(c3.children.length === 0 && c3.innerHTML === '', 'C5b 面板复用：上一家的残留被清掉（不留张冠李戴的旧按钮）');
    var c4 = 渲一次({ isInSect: false });
    assert(c4.children.length === 0, 'C6 散修：一格不摆');
    var c5 = 渲一次({ isInSect: true, sectName: '少林寺', sectId: 'shaolin_legacy' });
    assert(c5.children.length === 8, 'C7 sectName 口径的老档同样认（两串写法都收）');
})();

// ============ [D] 设施动作仍接真实系统 ============
console.log('--- [D] 设施动作棘轮 ---');
(function () {
    var app = src('js/app.js');
    var fn = sliceFn(app, 'function executeSectFacilityAction');
    assert(!!fn && fn.indexOf("useFacility('sect_training_ground')") >= 0 && fn.indexOf('openContributionShop') >= 0,
        'D1 八所设施的动作仍走真系统（演武场 useFacility／兑换 openContributionShop）——v20.8 的接线没被这批碰断');
    assert(/case 'sectHeal':[\s\S]{0,220}useFacility\('sect_medical'\)/.test(fn),
        'D2 医馆疗伤走设施系统按次扣贡献（v20.8 拆掉的免费无限满血漏洞没回来）');
})();

console.log('\nv24.3-dead-signal-revive：' + passed + ' 通过 / ' + failed + ' 失败');
process.exit(failed ? 1 : 0);
