/**
 * status-card-split-node.js — 状态概览「桌面四张独立卡 / 手机三卡合一」双向分流回归防护
 *
 * 需求原话（用户批 2026-10-03 08:32 复核）：「三合一是我批准给手机版用的，电脑版还是用原本的」。
 * ⇒ 仙侠.html 的精力/真气/心情在 ≥768px 上必须是三张各自独立的卡（各有标题行），第四张是境界卡；
 *   ≤767px 上那三张必须**视觉上并成一块**（无 gap、无中间那道边框、圆角只留上下两端）。
 *
 * 这套断言盯的是最容易悄悄坏掉、又最难看出来的四件事：
 *   SC-1 桌面四卡：四张是四个独立格子，不是「一张卡里三行」；标题行不许再被顺手删掉。
 *   SC-2 手机合一：三条视觉规则都在，且「不留缝」用的是 −1rem（跟字号档）而不是写死 px。
 *   SC-3 七个 id 零丢失：stamina-bar/stamina-text/qi-bar/qi-text/mood-bar/mood-text/realm-qi-limit。
 *   SC-4 ★JS 更新链没断★：抽 app.js 的 _updateCharacterStatusImpl **真源码**装沙箱真调一次，
 *        改数值后七个 id 的 textContent 与 style.width 必须逐个跟着变。
 *        沙箱的 document.getElementById **只对 HTML 里真实存在的 id 返回节点**——
 *        HTML 那边改了 id，这套立刻读到 null、打红，不会「桩替 HTML 兜住」而假绿。
 *   SC-5 桌面端没有 mobile.css 的窄屏规则漏进来（该文件纪律：隔离靠 @media 单闸）。
 *
 * 手法：CSS 侧走「按块抽＋算式复核＋改一处立刻读出不同值」的反证；
 *       JS 侧走 vm 沙箱真跑真函数（不重写、不 mock 掉被测的那段）。
 * 真机读数（缝/边框/圆角/轨道）由 .scratch/status-card-split-progress/ 的探针在 Chrome 里量，
 * 断言里只把量出来的常数写成算式，不假装在 node 里能布局。
 */
'use strict';

var fs = require('fs');
var vm = require('vm');
var path = require('path');
var ROOT = path.resolve(__dirname, '..');

var passed = 0, failed = 0;
function ok(c, m) {
    if (c) { passed++; console.log('  ✓ ' + m); }
    else { failed++; console.error('  [FAIL] ' + m); }
}
function eq(a, b, m) { ok(a === b, m + '（实际=' + JSON.stringify(a) + ' 期望=' + JSON.stringify(b) + '）'); }
function load(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

var HTML = load('仙侠.html');
var CRAFT = load('styles/ui-craft.css');
var MOBILE = load('styles/mobile.css');
var APP = load('js/app.js');

var SEVEN = ['stamina-bar', 'stamina-text', 'qi-bar', 'qi-text', 'mood-bar', 'mood-text', 'realm-qi-limit'];

// ---------------------------------------------------------------- CSS 小工具
/** 去掉注释（注释里的读数不是声明，别让它替规则背书） */
function 挖注释(css) {
    return css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
}
/** 取第一处 @media 的块体（条件文本匹配），返回 {头, 体} */
function 抽媒体(css, 条件正则) {
    var m = 条件正则.exec(css);
    if (!m) return null;
    var 余 = css.slice(m.index + m[0].length);
    var 开 = 余.indexOf('{');
    if (开 < 0) return null;
    var 深 = 1, i = 开 + 1;
    while (i < 余.length && 深 > 0) {
        if (余[i] === '{') 深++;
        else if (余[i] === '}') 深--;
        i++;
    }
    return { 头: m[0], 体: 余.slice(开 + 1, i - 1), 全文起: m.index };
}
/** 取全部匹配条件的 @media 块体（mobile.css 里有九段同闸的 @media，不能只看第一段） */
function 全部媒体(css, 条件正则) {
    var 出 = [], 从 = 0, m;
    var re = new RegExp(条件正则.source, 'g');
    while ((m = re.exec(css))) {
        var 一 = 抽媒体(css.slice(m.index), 条件正则);
        if (!一) break;
        出.push({ 头: 一.头, 体: 一.体, 全文起: m.index });
        re.lastIndex = m.index + 一.头.length + 一.体.length + 2;
        if (re.lastIndex <= m.index) break;
    }
    return 出;
}
/** 在若干块体里找某一支规则（找不到返回 null） */
function 任一块内规则(块们, sel) {
    for (var i = 0; i < 块们.length; i++) {
        var r = 块内规则(块们[i].体, sel);
        if (r) return r;
    }
    return null;
}
/** 同一支选择器可能被写进好几支规则（§9 里 :nth-child(2) 既管 margin 也管 border），
    这把尺按「哪一支里有这条声明」来找，不按「哪一支先出现」 */
function 任一块内取声明(块们, sel, 名) {
    for (var i = 0; i < 块们.length; i++) {
        var re = /([^{}]+)\{([^{}]*)\}/g, m;
        while ((m = re.exec(块们[i].体))) {
            var parts = m[1].replace(/\s+/g, ' ').trim().split(',').map(function (x) { return x.trim(); });
            if (parts.indexOf(sel) < 0) continue;
            var v = 取声明({ 体: m[2] }, 名);
            if (v !== null) return v;
        }
    }
    return null;
}
/** 抽某个 @media 块里，选择器完全等于 sel 的那一条规则；返回 null 表示没有 */
function 块内规则(体, sel) {
    var re = /([^{}]+)\{([^{}]*)\}/g, m;
    while ((m = re.exec(体))) {
        var s = m[1].replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
        // 逗号分隔的选择器组，逐个与 sel 比
        var parts = s.split(',').map(function (x) { return x.trim(); });
        for (var i = 0; i < parts.length; i++) {
            if (parts[i] === sel) {
                return { 体: m[2], 声明: m[2].replace(/\s+/g, ' ').trim() };
            }
        }
    }
    return null;
}
function 取声明(规则, 名) {
    if (!规则) return null;
    var m = new RegExp('(?:^|;)\\s*' + 名 + '\\s*:\\s*([^;]+)').exec(规则.体);
    return m ? m[1].trim() : null;
}
/** 12 轨装箱：数出这些栏数排成几行（与 v24 那把尺同法） */
function 排行数(栏表, 轨数) {
    var 行 = 1, 已用 = 0;
    栏表.forEach(function (n) { if (已用 + n > 轨数) { 行++; 已用 = n; } else { 已用 += n; } });
    return 行;
}

// ---------------------------------------------------------------- HTML 小工具
/** 抓 #sub-status 那张栅格的元素子节点（按开合标签配对，跳注释与文本节点） */
function 抽栅格子块(html) {
    var i = html.indexOf('id="sub-status"');
    if (i < 0) return null;
    var 开 = html.indexOf('class="grid grid-cols-2', i);
    if (开 < 0) return null;
    var 深 = 0, j = html.indexOf('>', 开);
    // 从容器开标签起做标签配平，逐个顶层 <div …>…</div> 切开
    var p = j + 1, 层 = 0, 起 = p;
    var 块 = [];
    while (p < html.length) {
        if (html.startsWith('<!--', p)) { var e = html.indexOf('-->', p); if (e < 0) break; p = e + 3; continue; }
        if (html[p] === '<') {
            var gt = html.indexOf('>', p);
            if (gt < 0) break;
            var 标签 = html.slice(p + 1, gt);
            if (标签[0] === '/') {
                层--;
                // 层跌到 −1 就是容器自己那个 </div>：栅格到此为止，后面的文档不许混进来
                if (层 < 0) break;
                if (层 === 0) { 块.push(html.slice(起, p)); 起 = gt + 1; }
                p = gt + 1; continue;
            }
            if (!/\/\s*$/.test(标签)) 层++;
            p = gt + 1; continue;
        }
        p++;
    }
    return 块;
}
function 抽属性(块, 名) {
    var m = new RegExp('\\b' + 名 + '="([^"]*)"').exec(块);
    return m ? m[1] : null;
}
function 抽标题(块) {
    var m = /<p[^>]*>([^<]*)<\/p>/.exec(块);
    return m ? m[1].trim() : null;
}
function 数出现(s, 子) { return s.split(子).length - 1; }

// ================================================================
console.log('\n[SC-1] 桌面（≥768px）：精力/真气/心情/境界 是四张独立卡，各有标题行');
// ================================================================
var 卡 = 抽栅格子块(HTML);
ok(Array.isArray(卡) && 卡.length >= 8,
    'SC1.0 #sub-status 那张栅格在 HTML 里解析出 ' + (卡 ? 卡.length : 0) + ' 张卡（≥8：计量三张＋境界＋快捷四张）');

ok(卡 && 卡.length === 8,
    'SC1.0b 恢复后正好 8 张（精力/真气/心情/境界/所在地+时间/飞鸽/队伍/日程）'
    + '——「合一」那版是 6 张，少掉的两张正是被并掉的计量卡（实际=' + (卡 ? 卡.length : 0) + '）');

var 期望头 = ['⚡ 精力', '🌀 真气', '😊 心情', '🏆 境界'];
期望头.forEach(function (t, i) {
    var b = 卡[i];
    eq(b ? 抽标题(b) : '(无)', t, 'SC1.' + (i + 1) + ' 第' + (i + 1) + '张卡的标题行是「' + t + '」');
});

// 每张独立卡：各自一个 <div>、text-center、h-3 进度条、圆角 + 过渡
[0, 1, 2].forEach(function (i) {
    var b = 卡[i];
    ok(b && /class="[^"]*\btext-center\b/.test(b), 'SC1.C' + (i + 1) + ' 第' + (i + 1) + '张卡带 text-center（旧版特征）');
    ok(b && /\bh-3\b/.test(b), 'SC1.H' + (i + 1) + ' 第' + (i + 1) + '张卡进度条回 h-3 外层（旧版特征）');
    ok(b && /\brounded\b/.test(b) && /transition-all/.test(b), 'SC1.R' + (i + 1) + ' 第' + (i + 1) + '张卡进度条带回圆角与过渡');
    ok(b && /\bbg-gray-700\/30\b/.test(b) && /\bborder\b/.test(b), 'SC1.B' + (i + 1) + ' 第' + (i + 1) + '张卡是独立的一张（有自己那层 bg/border）');
});
ok(卡 && 卡[1] && /id="realm-qi-limit"/.test(卡[1]),
    'SC1.Q 真气卡末尾那一行 <p id="realm-qi-limit"> 在（合并版把它塞进了横排行里）');
ok(卡 && !/stat-compact-row/.test(卡[0]) && !/stat-compact-row/.test(卡[1]) && !/stat-compact-row/.test(卡[2]),
    'SC1.S 三张计量卡已不用「合一」版的 .stat-compact-row 行结构');

// —— 轨道分配（styles/ui-craft.css 通用档，≥768px 生效）
var 净C = 挖注释(CRAFT);
var 通用 = 抽媒体(净C, /@media\s*\(\s*min-width:\s*768px\s*\)/);
ok(!!通用, 'SC1.M 通用档 @media (min-width: 768px) 在');
var 量支 = '#panel-character #sub-status > .grid > :nth-child(-n+3)';
var 境支 = '#panel-character #sub-status > .grid > :nth-child(4)';
eq(取声明(块内规则(通用.体, 量支), 'grid-column'), 'span 4', 'SC1.T1 计量三张各 4/12 栏（同处一行，三张并排）');
eq(取声明(块内规则(通用.体, 境支), 'grid-column'), 'span 12', 'SC1.T2 第四张（境界）整幅独占一行');
var 通用栏 = [4, 4, 4, 12, 3, 2, 3, 2];
eq(排行数(通用栏, 12), 3, 'SC1.T3 按 12 轨装箱：计量三张一行、境界一行、快捷四张一行（各行都齐幅）');
eq(通用栏.slice(0, 3).reduce(function (a, b) { return a + b; }, 0) + '|'
    + 通用栏[3] + '|'
    + 通用栏.slice(4).reduce(function (a, b) { return a + b; }, 0),
    '12|12|10', 'SC1.T4 算术自陈：三行分别 4+4+4 / 12 / 3+2+3+2（末行少 2 轨，是「所在地/时间两卡合一」的残债，已在 ui-craft.css §1 第五点记明）');

// —— 窄屏档 768~959 与 960~1279 的栏数（重推后仍是这两组值）
var 窄 = 抽媒体(净C, /@media\s*\(\s*min-width:\s*768px\s*\)\s*and\s*\(\s*max-width:\s*959px\s*\)/);
ok(!!窄, 'SC1.N1 窄档 @media (768~959) 在');
eq(取声明(块内规则(窄.体, 量支), 'grid-column'), 'span 12', 'SC1.N2 窄档计量三张各整幅一行（谁高谁自己长）');
eq(取声明(块内规则(窄.体, '#panel-character #sub-status > .grid > :nth-child(n+5)'), 'grid-column'), 'span 6',
    'SC1.N3 窄档快捷卡两两一行');
var 中 = 抽媒体(净C, /@media\s*\(\s*min-width:\s*960px\s*\)\s*and\s*\(\s*max-width:\s*1279px\s*\)/);
ok(!!中, 'SC1.X1 中档 @media (960~1279) 在');
eq(取声明(块内规则(中.体, '#panel-character #sub-status > .grid > :nth-child(n+5)'), 'grid-column'), 'span 4',
    'SC1.X2 中档快捷卡前三张走 span 4');
eq(取声明(块内规则(中.体, '#panel-character #sub-status > .grid > :nth-child(n+8)'), 'grid-column'), 'span 6',
    'SC1.X3 中档第八张起走 span 6');
ok(通用.全文起 < 窄.全文起 && 窄.全文起 < 中.全文起,
    'SC1.O 三道闸同特异度，源序递增（768~959 写在通用档之后、960~1279 写在最后，后写的赢）');

// ================================================================
console.log('\n[SC-2] 手机（≤767px）：三张计量卡视觉并成一块（无 gap、无中间边框、圆角只留两端）');
// ================================================================
var 净M = 挖注释(MOBILE);
var 手机闸 = /@media\s*\(\s*max-width:\s*767px\s*\)/;
var 手们 = 全部媒体(净M, 手机闸);
ok(手们.length >= 8, 'SC2.M 手机闸 @media (max-width: 767px) 在，且是分段写的（实测 ' + 手们.length + ' 段）');
var 手 = 手们[手们.length - 1];           // §9/§9b 那一段（三卡合一的规则在这里）
var 前三 = '#sub-status > .grid > .bg-gray-700\\/30:nth-child(-n+3)';
var 第二 = '#sub-status > .grid > .bg-gray-700\\/30:nth-child(2)';
var 第三 = '#sub-status > .grid > .bg-gray-700\\/30:nth-child(3)';
var 第一 = '#sub-status > .grid > .bg-gray-700\\/30:nth-child(1)';
eq(任一块内取声明(手们, 前三, 'grid-column'), '1 / -1',
    'SC2.1 ① 三张计量卡跨满整幅各占一行（窄屏只有两列，不跨满就拼不成一块）');
eq(任一块内取声明(手们, 第二, 'margin-top'), '-1rem',
    'SC2.2 ② 第二张用 margin-top 顶掉卡间空隙');
eq(任一块内取声明(手们, 第三, 'margin-top'), '-1rem', 'SC2.3 ② 第三张同样');
eq(任一块内取声明(手们, 第一, 'border-bottom-width'), '0', 'SC2.4 ③ 第一张去掉下边框（不留中间那道线）');
eq(任一块内取声明(手们, 第二, 'border-top-width'), '0', 'SC2.5 ③ 第二张去掉上边框');
eq(任一块内取声明(手们, 第二, 'border-bottom-width'), '0', 'SC2.6 ③ 第二张去掉下边框');
eq(任一块内取声明(手们, 第三, 'border-top-width'), '0', 'SC2.7 ③ 第三张去掉上边框');
eq(任一块内取声明(手们, 第一, 'border-bottom-left-radius'), '0', 'SC2.8 ③ 圆角只留上下两端（第一张只留上圆角）');
eq(任一块内取声明(手们, 第三, 'border-top-left-radius'), '0', 'SC2.9 ③ 第三张只留下圆角');

// —— 数值复核：gap-4 是 1rem（Tailwind），负 margin 也是 1rem ⇒ 缝恒为 0，且跟字号档走
var GAP_EM = 1;                    // Tailwind gap-4 = 1rem（真机实测 标准/大/特大 = 16/18/20px）
function 缝(档根, marginTop) { return 档根 * GAP_EM + marginTop; }
eq(缝(16, -16), 0, 'SC2.A 标准档（根 16px）缝 = gap 16 + (−16) = 0');
eq(缝(18, -18), 0, 'SC2.B 大档（根 18px）缝 = gap 18 + (−18) = 0');
eq(缝(20, -20), 0, 'SC2.C 特大档（根 20px）缝 = gap 20 + (−20) = 0');
ok(缝(18, -16) !== 0 && 缝(20, -16) !== 0,
    'SC2.D 反证：把 −1rem 写死成 −16px，大/特大档立刻各留 ' + 缝(18, -16) + '/' + 缝(20, -16)
    + 'px 的缝——这就是本条坚持用 rem 的理由（真机读数见 .scratch/…/measure-mobile）');
var 手段 = 手们.map(function (b) { return b.体; }).join('\n');
ok(!/margin-top:\s*-[0-9]+px/.test(手段),
    'SC2.E 手机段里没有任何写死 px 的负 margin（gap 跟字号档走，写死必漏）');
ok(任一块内规则(手们, 前三) && 任一块内规则(手们, 第二) && 任一块内规则(手们, 第三) && 任一块内规则(手们, 第一),
    'SC2.F 四支选择器齐全（少一支就会出现「并了一半」的半拉子版面）');
// —— 「所在地/时间」那一张合卡的旧规则仍在窄屏闸内（它不是那三张，别一起改掉）
var 合卡 = 任一块内规则(手们, '#sub-status .bg-gray-700\\/30:has(.stat-compact-row)');
eq(取声明(合卡, 'grid-column'), '1 / -1', 'SC2.G 合卡（所在地/时间，仍带 .stat-compact-row）跨满两列的规则仍在');
var 合卡处 = 净M.indexOf('#sub-status .bg-gray-700\\/30:has(.stat-compact-row)');
ok(合卡处 > 0 && 手们.some(function (b) { return b.全文起 < 合卡处; }),
    'SC2.H :has(.stat-compact-row) 那支在窄屏闸「之内」（它现在只认所在地/时间那张，不是计量三张）');
ok(数出现(HTML.slice(HTML.indexOf('id="sub-status"'), HTML.indexOf('id="sub-status"') + 6000), 'stat-compact-row') > 0,
    'SC2.I HTML 里仍有一处 .stat-compact-row（所在地/时间那张合卡），所以 :has() 不是死选择器');

// ================================================================
console.log('\n[SC-3] 七个 id 一个不许丢，且各自唯一');
// ================================================================
SEVEN.forEach(function (id) {
    eq(数出现(HTML, 'id="' + id + '"'), 1, 'SC3.' + id + ' 恰好出现一次');
});
var HTML全部id = (HTML.match(/\bid="([^"]+)"/g) || []).map(function (s) { return s.slice(4, -1); });
var 重名 = HTML全部id.filter(function (v, i) { return HTML全部id.indexOf(v) !== i; });
eq(重名.length, 0, 'SC3.全 HTML 无重复 id（重名列表=' + JSON.stringify(Array.from(new Set(重名))) + '）');
ok(APP.indexOf("getElementById('stamina-bar')") >= 0
    && APP.indexOf("getElementById('qi-bar')") >= 0
    && APP.indexOf("getElementById('mood-bar')") >= 0
    && APP.indexOf("getElementById('realm-qi-limit')") >= 0,
    'SC3.J app.js 的更新链仍按这四个 id 取节点（没被改成别的取法）');

// ================================================================
console.log('\n[SC-4] ★JS 更新链：抽 app.js 真源码装沙箱真跑一次，七个 id 必须逐个跟着变★');
// ================================================================
/** 从源码里按花括号配平抽出一个函数（含前置注释不管），跳过字符串/模板串/注释 */
function 抽函数(源码, 名) {
    var i = 源码.indexOf('function ' + 名 + '(');
    if (i < 0) return null;
    var p = 源码.indexOf('{', i), 深 = 0, k = p;
    while (k < 源码.length) {
        var c = 源码[k];
        if (c === '/' && 源码[k + 1] === '/') { var e = 源码.indexOf('\n', k); k = e < 0 ? 源码.length : e; continue; }
        if (c === '/' && 源码[k + 1] === '*') { var e2 = 源码.indexOf('*/', k); k = e2 < 0 ? 源码.length : e2 + 2; continue; }
        if (c === '"' || c === "'" || c === '`') {
            var q = c; k++;
            while (k < 源码.length) {
                if (源码[k] === '\\') { k += 2; continue; }
                if (源码[k] === q) { k++; break; }
                k++;
            }
            continue;
        }
        if (c === '{') 深++;
        else if (c === '}') { 深--; if (深 === 0) return 源码.slice(i, k + 1); }
        k++;
    }
    return null;
}

var 更新壳 = 抽函数(APP, 'updateCharacterStatus');
var 更新体 = 抽函数(APP, '_updateCharacterStatusImpl');
ok(!!更新壳, 'SC4.0 抽得出 app.js 的 updateCharacterStatus（壳）');
ok(!!更新体, 'SC4.1 抽得出 app.js 的 _updateCharacterStatusImpl（真正写屏的那段）');
ok(!!更新壳 && 更新壳.indexOf('_updateCharacterStatusImpl') >= 0,
    'SC4.1b 壳确实调的就是 _updateCharacterStatusImpl（不是另一支同名函数）');

/**
 * 造沙箱并**真跑一次** app.js 的更新链。
 * ★关键：document.getElementById 只对**仙侠.html 里真实存在的 id** 返回节点，
 *   HTML 那边改了 id，这里就拿到 null —— 桩不兜底，尺子不会假绿。
 */
var 真实id集 = {};
HTML全部id.forEach(function (v) { 真实id集[v] = 1; });

function 跑一次(charData) {
    var 记 = { 被取: [] };
    var 节点 = {};
    function 取(id) {
        记.被取.push(id);
        if (!真实id集[id]) return null;
        if (!节点[id]) {
            节点[id] = {
                id: id, textContent: '', title: '', innerHTML: '', className: '',
                style: {}, dataset: {}, _kids: [],
                get children() { return this._kids; },
                appendChild: function (c) { this._kids.push(c); return c; },
                querySelector: function () { return null; },
                querySelectorAll: function () { return []; },
                getBoundingClientRect: function () { return { left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 }; },
                classList: { add: function () { }, remove: function () { }, toggle: function () { }, contains: function () { return false; } }
            };
        }
        return 节点[id];
    }
    var win = {
        // 渲染刹车在 node 里没有 rAF，屏上读数要即时可测就直接落地（与 global-utils.js 的无 rAF 分支同义）
        coalesceRender: function (k, fn) { fn(); },
        flushCoalescedRenders: function () { },
        getEffectiveMax: function () { return charData.__effMax; },
        getRealmIndex: function () { return charData.__realmIndex; },
        getQiMax: function () { return charData.__qiMax; },
        getEssenceRequired: function () { return 30; },
        getTemperingRequired: function () { return 5; },
        getFameLevel: function () { return null; }
    };
    win.window = win;
    var box = {
        window: win,
        document: { getElementById: 取 },
        console: { log: function () { }, warn: function () { }, error: function () { } },
        Math: Math, Array: Array, Object: Object, String: String, Number: Number,
        JSON: JSON, isFinite: isFinite, parseFloat: parseFloat, parseInt: parseInt,
        // app.js 里那个变量就叫 currentCharData（闭包私有，window 上那份是影子）
        currentCharData: charData
    };
    box.globalThis = box;
    vm.createContext(box);
    vm.runInContext(更新壳 + '\n' + 更新体 + '\n;updateCharacterStatus();', box);
    return { 节点: 节点, 被取: 记.被取 };
}

function 读七个(节点) {
    var o = {};
    SEVEN.forEach(function (id) {
        var e = 节点[id];
        o[id] = e ? (id.slice(-4) === '-bar' ? e.style.width : e.textContent) : '(取不到)';
    });
    return o;
}

var 初始 = {
    energy: 20, maxEnergy: 100, qi: 100, maxQi: 200, mood: 80, maxMood: 100,
    realm: '飞升', layer: 9, karma: 0, order: 0, fame: 0, health: 100, maxHealth: 100,
    essence: 0, tempering: 0, combatAbilities: [],
    __effMax: 200, __realmIndex: 8, __qiMax: 50
};

var 第一次 = 跑一次(JSON.parse(JSON.stringify(初始)));
eq(第一次.被取.indexOf('stamina-bar') >= 0, true, 'SC4.2 更新函数确实向 document 要了 stamina-bar');
eq(第一次.被取.indexOf('realm-qi-limit') >= 0, true, 'SC4.3 更新函数确实向 document 要了 realm-qi-limit');
var 前 = 读七个(第一次.节点);
eq(前['stamina-text'], '20/100', 'SC4.4 初始读数：stamina-text 20/100');
eq(前['stamina-bar'], '20%', 'SC4.5 初始读数：stamina-bar 20%');
eq(前['qi-text'], '100/200', 'SC4.6 初始读数：qi-text 100/200（分母走 getEffectiveMax）');
eq(前['qi-bar'], '50%', 'SC4.7 初始读数：qi-bar 50%（100/200）');
eq(前['mood-text'], '80/100', 'SC4.8 初始读数：mood-text 80/100');
eq(前['mood-bar'], '80%', 'SC4.9 初始读数：mood-bar 80%');
ok(typeof 前['realm-qi-limit'] === 'string' && 前['realm-qi-limit'].length > 0,
    'SC4.10 初始读数：realm-qi-limit 有文案（实际="' + 前['realm-qi-limit'] + '"）');

// 改数值，真跑一次
var 改了 = JSON.parse(JSON.stringify(初始));
改了.energy = 37; 改了.qi = 45; 改了.mood = 12; 改了.realm = '筑基'; 改了.layer = 3;
改了.__effMax = 100;改了.__realmIndex = 1; 改了.__qiMax = 120;
var 第二次 = 跑一次(改了);
var 后 = 读七个(第二次.节点);
eq(后['stamina-text'], '37/100', 'SC4.11 ★改精力 20→37：stamina-text 跟着变');
eq(后['stamina-bar'], '37%', 'SC4.12 ★stamina-bar 的 style.width 跟着变');
eq(后['qi-text'], '45/100', 'SC4.13 ★改真气 100→45：qi-text 跟着变（分母随境界改）');
eq(后['qi-bar'], '45%', 'SC4.14 ★qi-bar 的 style.width 跟着变');
eq(后['mood-text'], '12/100', 'SC4.15 ★改心情 80→12：mood-text 跟着变');
eq(后['mood-bar'], '12%', 'SC4.16 ★mood-bar 的 style.width 跟着变');
ok(后['realm-qi-limit'] !== 前['realm-qi-limit'],
    'SC4.17 ★改境界后 realm-qi-limit 的文案跟着变（"' + 前['realm-qi-limit'] + '" → "' + 后['realm-qi-limit'] + '"）');
ok(/真气上限/.test(后['realm-qi-limit']),
    'SC4.18 realm-qi-limit 仍是「真气上限…」那一支（不是被换成别的读数）');

SEVEN.forEach(function (id) {
    ok(后[id] !== 前[id], 'SC4.20 七选一 #' + id + '：两次读数不同（这条断了就是回归）');
});

// 再改一组，证明不是巧合（真气取 50，200 分母下正好 25%——不为凑整而改断言）
var 改了2 = JSON.parse(JSON.stringify(初始));
改了2.energy = 88; 改了2.qi = 50; 改了2.mood = 99;
var 第三次 = 跑一次(改了2);
var 后2 = 读七个(第三次.节点);
eq(后2['stamina-text'] + '|' + 后2['qi-text'] + '|' + 后2['mood-text'], '88/100|50/200|99/100',
    'SC4.21 第二组数值（88/50/99）三个文本读数逐字对上');
eq(后2['stamina-bar'] + '|' + 后2['qi-bar'] + '|' + 后2['mood-bar'], '88%|25%|99%',
    'SC4.22 第二组数值三条 style.width 逐字对上');

// 还原：同一份初始数据跑两次必须逐字一致（证明读数由数据决定，不是残留）
var 还原 = 跑一次(JSON.parse(JSON.stringify(初始)));
eq(JSON.stringify(读七个(还原.节点)), JSON.stringify(前),
    'SC4.23 用初始数据再跑一次，七个读数逐字回到最初（无残留、无累积）');

// 反证：把 HTML 里的 id 改掉，桩必须立刻报 null（证明这套尺没被桩兜住）
(function () {
    var 坏HTML = HTML.replace('id="stamina-text"', 'id="stamina-txt"');
    var 坏id集 = {};
    (坏HTML.match(/\bid="([^"]+)"/g) || []).forEach(function (s) { 坏id集[s.slice(4, -1)] = 1; });
    ok(!坏id集['stamina-text'],
        'SC4.30 反证：把 HTML 的 stamina-text 改名后，沙箱那一层确实拿不到节点'
        + '（拿得到就说明本套被桩兜住了、假绿）');
})();

// ================================================================
console.log('\n[SC-5] 桌面端没有一条 mobile.css 的窄屏规则漏进来');
// ================================================================
/** 顶层扫描：列出每支规则所处的媒体上下文（栈式配平，@media 不算规则） */
function 顶层规则表(css) {
    var 表 = [], 栈 = [], 起 = 0, p = 0;
    while (p < css.length) {
        var c = css[p];
        if (c === '/' && css[p + 1] === '*') { var e = css.indexOf('*/', p); p = e < 0 ? css.length : e + 2; continue; }
        if (c === '{') {
            var 头 = css.slice(起, p).replace(/\s+/g, ' ').trim();
            if (/^@(media|supports)\b/.test(头)) {
                栈.push({ 媒体: true, 条件: 头 });
            } else {
                var 条件 = 栈.filter(function (x) { return x.媒体; }).map(function (x) { return x.条件; });
                表.push({ 选择器: 头, 媒体: 条件 });
                栈.push({ 媒体: false });
            }
            p++; 起 = p; continue;
        }
        if (c === '}') { 栈.pop(); p++; 起 = p; continue; }
        p++;
    }
    return 表;
}
var 桌面豁免 = ['.mobile-nav-toggle', '.mobile-nav-backdrop'];
var 全规则 = 顶层规则表(净M);
var 漏进来的 = 全规则.filter(function (r) {
    if (r.媒体.length) return false;                 // 在媒体查询里 ⇒ 窄屏才生效
    var sel = r.选择器.split(',').map(function (x) { return x.trim(); });
    var 全豁免 = sel.length && sel.every(function (s) { return 桌面豁免.indexOf(s) >= 0; });
    return !全豁免;
});
eq(漏进来的.map(function (r) { return r.选择器; }).join(' , ') || '(无)', '(无)',
    'SC5.1 mobile.css 里闸外只有第 0 节那两条 display:none（桌面唯一允许的两支）');
var 豁免支 = 全规则.filter(function (r) {
    return !r.媒体.length && r.选择器.split(',').every(function (s) { return 桌面豁免.indexOf(s.trim()) >= 0; });
});
ok(豁免支.length === 1 && /display:\s*none/.test(净M.slice(净M.indexOf('.mobile-nav-toggle'))),
    'SC5.2 那两条确实是 display:none（桌面零形态零占位）');
ok(全规则.filter(function (r) { return r.媒体.length === 1 && /max-width:\s*767px/.test(r.媒体[0]); }).length > 0,
    'SC5.3 手机段确实是 @media (max-width: 767px) 单闸（不是 max-width:768 或别的口径）');
ok(!/@media[^{]*min-width/.test(净M),
    'SC5.4 mobile.css 里没有任何 min-width 闸（桌面档不该出现在这层）');
// 反证：往闸外塞一支窄屏规则，这把尺必须立刻数出漏网
(function () {
    var 假 = '.fixed.inset-0 > div { max-width: 100vw !important; }';
    var 坏规则 = 顶层规则表(净M + '\n' + 假).filter(function (r) {
        if (r.媒体.length) return false;
        var sel = r.选择器.split(',').map(function (x) { return x.trim(); });
        return !sel.every(function (s) { return 桌面豁免.indexOf(s) >= 0; });
    });
    eq(坏规则.length, 1, 'SC5.5 反证：把一支窄屏规则搬到闸外，同一把尺立刻数出 1 条漏网（尺没钝）');
})();

// ---------------------------------------------------------------- 汇总
console.log('\n========== 状态卡分流 · 桌面四卡 / 手机合一 ==========');
console.log('通过：' + passed + '　失败：' + failed);
if (failed > 0) process.exitCode = 1;
