/**
 * tests/legacy-party-panel-node.js
 * 遗留缺陷批 · BUG-2：panel-party 没有 onShow 刷新
 *
 * 事实（修前）：
 *   仙侠.html:243  导航有「👥 队伍」入口 → switchPanel('party')
 *   仙侠.html:661  <div id="panel-party"> 容器在
 *   js/party-system.js:601  updatePartyUI() 写总战力/阵型/队员数/上限
 *   js/app.js switchPanel() 的 13 个分支里独缺 party —— updatePartyUI 只在**数据变更**时被调
 *   （party-system.js 12 处 + app.js 设置页「解除队伍人数上限」开关），进面板不刷新。
 *
 * 症状：切走 → 招募/调阵型/改人数上限 → 切回队伍面板，看到的还是旧数；
 *      首屏若没触发任何变更，面板停在 HTML 写死的 0 / 4。
 *
 * 修法与归属：switchPanel 里补 party 分支调 updatePartyUI()。
 *      为什么跟旧 if-else 链而不是 PanelLifecycle.registerShow：
 *      registerShow 全仓只有 world-calendar-ui.js:268 一处（v18.9 注释自称「示范迁移」），
 *      switchPanel 里 12/13 个面板仍走旧链——那是多数派，本批不引入第三套机制。
 *      本套 [C] 段专门钉这件事：即使 PanelLifecycle 在场且 runShowHooks('party') 返 false，
 *      队伍面板照样刷——钉的是行为，不是某一处写法。
 *
 * 手法：从 js/app.js 里**原样切出 switchPanel 函数体**（字符串级精确抽取，带注释/字符串感知的括号配平），
 *      装进 vm 沙箱真调用。不加载整个 app.js（它有大量顶层副作用），也不抄一份判定逻辑。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');

let passed = 0, failed = 0;
function ok(c, m) { if (c) { passed++; console.log('  ✓ ' + m); } else { failed++; console.log('  [FAIL] ' + m); } }
const APP = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');

// 从源码里精确切出 `function switchPanel(panelId) { ... }`。
// ⚠️ 不能用「找到第一个 \n} 就切」——函数体里有嵌套花括号，也有带花括号的行内注释。
// 这里做一遍字符串/注释感知的状态机，遇到引号或注释就跳过，配平到 depth 归零为止。
function 切函数(src, 签名) {
    const 起 = src.indexOf(签名);
    if (起 < 0) return null;
    let i = src.indexOf('{', 起), depth = 0, 引 = null;
    for (; i < src.length; i++) {
        const c = src[i];
        if (引) {
            if (c === '\\') { i++; continue; }
            if (c === 引) 引 = null;
            continue;
        }
        if (c === '"' || c === "'" || c === '`') { 引 = c; continue; }
        if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
        if (c === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i) + 1; continue; }
        if (c === '{') depth++;
        else if (c === '}') { depth--; if (depth === 0) return src.slice(起, i + 1); }
    }
    return null;
}

function 建沙箱(函数源码, 可选PanelLifecycle) {
    const 刷过 = [];
    const 元素 = id => ({
        id: id, innerHTML: '', textContent: '', className: '', value: '',
        style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
        scrollIntoView() {}, querySelectorAll: () => [], querySelector: () => null,
    });
    const 沙 = {
        console: { log() {}, warn() {}, error() {} },
        document: {
            getElementById: id => 元素(id),
            querySelector: () => null,
            querySelectorAll: () => [],
        },
    };
    沙.window = 沙;
    沙.updatePartyUI = function () { 刷过.push('party'); };
    if (可选PanelLifecycle) {
        沙.PanelLifecycle = {
            beforeMainSwitch() {},
            runShowHooks: () => false,
        };
    }
    vm.createContext(沙);
    vm.runInContext(函数源码, 沙, { filename: 'switchPanel' });
    return { 沙, 刷过 };
}

console.log('\n========== 遗留批 · BUG-2 队伍面板进面板不刷新 ==========');

const 函数体 = 切函数(APP, 'function switchPanel(panelId)');
ok(!!函数体, 'A1 从 js/app.js 里切出了 switchPanel 函数体（' + (函数体 ? 函数体.length + ' 字符' : '没切到') + '）');

// ============ [B] 行为：切到 party 会刷，切别的面板不会 ============
console.log('\n[B] 行为断言');
{
    const B = 建沙箱(函数体, false);
    B.沙.switchPanel('party');
    ok(B.刷过.length === 1, 'B1 switchPanel(\'party\') 调了一次 updatePartyUI（实读 ' + B.刷过.length
        + ' 次）——进面板即刷新，不再停在 HTML 写死的 0 / 4');
    B.沙.switchPanel('map');
    B.沙.switchPanel('quests');
    ok(B.刷过.length === 1, 'B2 切去别的面板**不会**顺带刷队伍（现读 ' + B.刷过.length
        + ' 次）——证明 B1 是 party 专属分支，不是无脑挂在了切面板的公共路径上');
    B.沙.switchPanel('party');
    ok(B.刷过.length === 2, 'B3 再切一次 party 又刷一次（现读 ' + B.刷过.length
        + ' 次）——「切走→数据变了→切回」这个正是修前看不到新数的场景');
}

// ============ [C] 归属：即使 PanelLifecycle 在场也照样刷（没引入第三套机制）============
console.log('\n[C] 与 PanelLifecycle 双轨共存');
{
    const C = 建沙箱(函数体, true);
    C.沙.switchPanel('party');
    ok(C.刷过.length === 1, 'C1 PanelLifecycle 在场且 runShowHooks(\'party\') 返 false（旧链的常态）时，'
        + '队伍面板仍走 if 分支刷新（实读 ' + C.刷过.length + ' 次）');
}

// ============ [D] 改前复现：把 party 分支从同一份源码里抹掉，这把尺必须报红 ============
console.log('\n[D] 改前复现（抹掉 party 分支 ⇒ B1 立刻不成立）');
{
    const 抹掉 = 函数体.replace(/\n\s*if \(panelId === 'party'\) \{[^}]*\}/, '');
    ok(抹掉 !== 函数体, 'D1 注入成功（把同一份函数体里的 party 分支整段抹掉，长度 ' + 函数体.length
        + ' → ' + 抹掉.length + '）');
    const D = 建沙箱(抹掉, false);
    D.沙.switchPanel('party');
    ok(D.刷过.length === 0, 'D2 抹掉分支后 switchPanel(\'party\') 不再刷新（实读 ' + D.刷过.length
        + ' 次）——这就是修前的状态，B1 不是恒真');
    // 复原再验一次，证明不是被别的因素（沙箱/桩）卡住
    const E = 建沙箱(函数体, false);
    E.沙.switchPanel('party');
    ok(E.刷过.length === 1, 'D3 同一把尺在未抹掉的源码上又刷了（实读 ' + E.刷过.length + ' 次）');
}

// ============ [E] 写死的首屏值：核对它们与默认状态一致，不另动 仙侠.html ============
console.log('\n[E] 仙侠.html 面板初始值（本批不改那个文件，只核对）');
{
    const HTML = fs.readFileSync(path.join(ROOT, '仙侠.html'), 'utf8');
    const 取 = id => {
        const m = new RegExp('id="' + id + '"[^>]*>([^<]*)<').exec(HTML);
        return m ? m[1].trim() : null;
    };
    ok(取('party-member-count-display') === '0', 'E1 队员数初始写死 ' + 取('party-member-count-display')
        + '（默认队伍没人，与真值一致 ⇒ 不会闪出错数；本批不碰该文件，手机屏批次在改它）');
    ok(取('party-max-members-display') === '4', 'E2 上限初始写死 ' + 取('party-max-members-display')
        + '（默认上限 4；开了设置页「解除人数上限」的档，这一格在**进入面板时**已被 B1 覆盖掉）');
    ok(/id="party-power-display"[^>]*>总战力: 0/.test(HTML), 'E3 总战力初始写死 0（进入面板即被覆盖）');
}

console.log('\n通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
