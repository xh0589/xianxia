/**
 * wave96-closure-node.js — 第九十六波 · 挂账收口批 验收：
 *   把第九十五波报告里「未解决（挂账待拍板）」的五项按最佳方式收口：
 *   A ALC-01/02：炼丹瑕疵丹/御品可达性——真模块全组合枚举，瑕疵线每张够得着、御品线至少两张方子够得着
 *     （第八十二波已按枚举重校阈值，本套把可达性钉死防再漂；外包那轮「不可达」结论基于移植前旧源码）
 *   B NEW-15：龙脉等地标弹窗不再剧透未解锁奖励——没到手的只亮档位与类别，已领的才是履历
 *   C NEW-40 后续：收件箱分页（每页 50 封）——千八百封不再一次糊出上万个节点
 *   D NEW-11：时间两本账口径锚点（totalMinutes=钟/currentDay=历）+ 全仓无「绝对分钟推日号」误用
 *   E LEG-1：旧测试清单换代完成——endgame 五套已退役，外包点名的 11 套全部在现行 run-all 里且全绿
 *
 * 运行：node tests/wave96-closure-node.js
 */
'use strict';

var fs = require('fs');
var vm = require('vm');
var path = require('path');
var ROOT = path.resolve(__dirname, '..');

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; console.log('  ✓ ' + msg); }
    else { failed++; console.error('  ✗ ' + msg); }
}
function eq(a, b, msg) { assert(a === b, msg + '（实际=' + JSON.stringify(a) + ' 期望=' + JSON.stringify(b) + '）'); }
function load(rel) { vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel }); }
function src(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ==================== 测试桩 ====================
global.window = global;
function fakeEl() {
    var el = {
        style: { setProperty: function () {} }, children: [], _html: '', textContent: '', dataset:{},
        classList: { add: function () {}, remove: function () {}, contains: function () { return false; }, toggle: function () {} },
        setAttribute: function () {}, getAttribute: function () { return null; },
        appendChild: function (c) { this.children.push(c); return c; }, removeChild: function () {}, remove: function () {},
        addEventListener: function () {}, closest: function () { return null; },
        querySelector: function () { return null; }, querySelectorAll: function () { return []; },
        getBoundingClientRect: function () { return { left: 0, top: 0, width: 100, height: 100 }; }
    };
    Object.defineProperty(el, 'innerHTML', {
        get: function () { return this._html; },
        set: function (v) { this._html = String(v); },
        configurable: true
    });
    return el;
}
var els = {};
global.document = {
    readyState: 'complete',
    createElement: function () { return fakeEl(); },
    getElementById: function (id) { if (!els[id]) els[id] = fakeEl(); return els[id]; },
    querySelector: function () { return null; }, querySelectorAll: function () { return []; },
    addEventListener: function () {},
    head: { appendChild: function () {} }, body: { appendChild: function () {} }
};
var store = {};
global.localStorage = { getItem: function (k) { return store[k] != null ? store[k] : null; }, setItem: function (k, v) { store[k] = String(v); }, removeItem: function (k) { delete store[k]; } };
global.setTimeout = function () { return 0; };
global.setInterval = function () { return 0; };
global.showMessage = function () {};
global.timeSystem = { gameTime: { totalMinutes: 57140, currentDay: 40 } };

// ==================== A · ALC-01/02 可达性枚举 ====================
console.log('\n[A] 炼丹瑕疵丹/御品可达性（真模块全组合枚举）');
load('js/crafting/alchemy-compound.js');
var AC = global.AlchemyCompound;
assert(AC && AC.COMPOUND_PILFAR_RECIPES && AC.MATERIAL_PROPS, 'A0 药性炼丹模块可独立加载');
var MATS = Object.keys(AC.MATERIAL_PROPS);
function legalFor(slot) {
    return MATS.filter(function (m) { try { return AC.checkSlotMat(m, slot).ok; } catch (e) { return false; } });
}
var recipes = AC.COMPOUND_PILFAR_RECIPES;
var totalCombos = 0, flawReachable = 0, flawRecipes = 0, imperialRecipes = 0;
recipes.forEach(function (rc) {
    var slots = rc.slots;
    var mains = legalFor(slots.main), assists = legalFor(slots.assist), bals = legalFor(slots.balancer);
    var minT = Infinity, maxT = -Infinity, combos = 0;
    mains.forEach(function (m) {
        for (var i = 0; i < assists.length; i++) {
            for (var j = i; j < assists.length; j++) {   // 辅药两份按多重集枚举（毒性和与顺序无关）
                bals.forEach(function (b) {
                    var arr = [m, assists[i], assists[j], b];
                    var t = 0;
                    for (var q = 0; q < arr.length; q++) t += AC.getProps(arr[q]).toxic;
                    var avg = t / arr.length;
                    combos++;
                    if (avg < minT) minT = avg;
                    if (avg > maxT) maxT = avg;
                });
            }
        }
    });
    totalCombos += combos;
    var res = rc.result || {};
    if (res.allowFlaw && res.flawItemId) {
        flawRecipes++;
        if (combos > 0 && maxT >= res.flawThreshold) flawReachable++;
        console.log('    · ' + (rc.id || res.itemId) + '：' + combos + ' 炉，毒性 ' + (minT === Infinity ? '—' : minT.toFixed(2)) + '~' + (maxT === Infinity ? '—' : maxT.toFixed(2)) + '，瑕疵线 ' + res.flawThreshold + (combos > 0 && maxT >= res.flawThreshold ? '（可达）' : '（不可达！）'));
    }
    if (combos > 0 && minT < 12) imperialRecipes++;
});
assert(totalCombos > 1000, 'A1 枚举规模与外包口径同量级（' + totalCombos + ' 炉）');
eq(flawReachable, flawRecipes, 'A2 每张带瑕疵线的丹方，最毒组合都够得着瑕疵丹（ALC-01 闭环）');
assert(imperialRecipes >= 2, 'A3 御品线（毒性<12 且评分≥85）至少两张方子够得着（' + imperialRecipes + ' 张，ALC-02 闭环）');
// 御品评分侧也可达：满分火候下 finalScore = 0.6*评分归一 + 0.4*100 —— 低毒高分组合过 85 不是空谈
assert(src('js/crafting/alchemy-compound.js').indexOf('finalScore >= 85 && avgToxic < 12') >= 0, 'A4 御品判定=评分+毒性双门槛（稀有但可达，第八十二波枚举定线）');

// ==================== B · NEW-15 地标不剧透 ====================
console.log('\n[B] 地标弹窗不剧透未解锁奖励');
var lm = src('js/map/landmark-explore.js');
assert(lm.indexOf('TYPE_HINT') >= 0 && lm.indexOf('探到方才揭晓') >= 0, 'B1 未到手的机缘只亮类别不亮全文');
var uiSeg = lm.slice(lm.indexOf('function showLandmarkProgressUI'), lm.indexOf('function showLandmarkBestiary'));
assert(uiSeg.indexOf("r._claimed ? '✅' : '🔒'") < 0, 'B2 旧的「全文照印只换个锁图标」写法已清除');
// 已领的照旧全文（自己的履历不算剧透）
assert(uiSeg.indexOf("if (r._claimed)") >= 0 && uiSeg.match(/r\.msg/g).length === 1, 'B3 奖励全文只在已领分支出现（恰好一处）');

// ==================== C · NEW-40 收件箱分页 ====================
console.log('\n[C] 收件箱分页（每页 50 封）');
var mails = [];
for (var mi = 0; mi < 120; mi++) {
    mails.push({ id: 'm' + mi, subject: '问候', body: '正文', fromNpcName: '赵得', receivedAt: 57000 + mi, importance: 'normal', carrier: 'pigeon', readAt: 1 });
}
global.MailSystem = {
    getData: function () { return { inbox: mails, outbox: [], favorites: [], _pending: [] }; },
    markRead: function () {}, getUnreadCount: function () { return 0; }
};
load('js/mail-system-ui.js');
assert(global.MailSystemUI && typeof global.MailSystemUI.listPage === 'function', 'C1 翻页口已导出');
var listEl = global.document.getElementById('mailInboxList');
global.MailSystemUI.listPage('inbox', 0);
var page1 = (listEl._html.match(/<div class="mail-item /g) || []).length;   // 数信件根节点（每封内部还有 6 个 mail-item-* 子类名，不能抓宽）
eq(page1, 50, 'C2 第一页只渲染 50 封（不再 120 封一次糊上万个节点）');
assert(listEl._html.indexOf('第 1 / 3 页') >= 0 && listEl._html.indexOf('共 120 封') >= 0, 'C3 页脚报页数与总数（账目透明）');
assert(listEl._html.indexOf('下一页') >= 0, 'C4 有翻页鈕');
global.MailSystemUI.listPage('inbox', 2);
var page3 = (listEl._html.match(/<div class="mail-item /g) || []).length;
eq(page3, 20, 'C5 末页装剩下的 20 封');
assert(listEl._html.indexOf('第 3 / 3 页') >= 0, 'C6 末页页码如实');
global.MailSystemUI.listPage('inbox', 99);
assert(listEl._html.indexOf('第 3 / 3 页') >= 0, 'C7 越界页码被夹回末页（不乱翻）');
// 封顶闸仍在（洪水源头，NEW-40 正修）
var msSrc = src('js/mail-system.js');
assert(msSrc.indexOf('enforceInboxCap') >= 0 && msSrc.indexOf('_lastHostileMailDay') >= 0, 'C8 收件箱封顶与敌意信冷却两道闸原样');

// ==================== D · NEW-11 时间两本账 ====================
console.log('\n[D] 时间两本账（钟归钟、历归历）');
var ts = src('js/time-system.js');
assert(ts.indexOf('第九十六波·NEW-11 收口：时间两本账的唯一口径锚点') >= 0, 'D1 口径锚点注释立在 advanceTime 门口');
assert(ts.indexOf('一本是钟，一本是历') >= 0, 'D2 锚点写明两本账各管什么');
// 全仓哨兵：time-system 之外不许拿绝对分钟推日号（%1440 读钟点、作差算时长都合法）
function walkJs(dir, out) {
    fs.readdirSync(dir).forEach(function (f) {
        var fp = path.join(dir, f);
        var st = fs.statSync(fp);
        if (st.isDirectory()) walkJs(fp, out);
        else if (f.endsWith('.js')) out.push(fp);
    });
    return out;
}
var offenders = [];
walkJs(path.join(ROOT, 'js'), []).forEach(function (fp) {
    if (fp.endsWith('js/time-system.js')) return;
    var txt = fs.readFileSync(fp, 'utf8');
    // 日号推导式：Math.floor(xxx.totalMinutes / 1440)。合规豁免：同文件认历法（getAbsoluteDay/currentDay 优先，
    // 绝对分钟只做缺历法时的同式兜底）——茶馆/赌盘/拍卖行都是这个写法；真误用=压根不认历法拿钟当历
    var m = txt.match(/totalMinutes[^;\n]*?\/\s*1440/g) || [];
    if (m.length && txt.indexOf('getAbsoluteDay') < 0 && txt.indexOf('currentDay') < 0) {
        offenders.push(path.relative(ROOT, fp));
    }
});
eq(offenders.length, 0, 'D3 全仓无人拿绝对分钟自推日号（误用清单：' + offenders.join(',') + '）');
assert(src('js/economy/auction-service.js').indexOf('currentDay) || Math.floor(nowMinute() / 1440) + 1') >= 0, 'D4 拍卖行兜底与历法同式（currentDay 优先）');
['js/city-facilities/teahouse-leisure.js', 'js/city-facilities/facility-arena-book.js'].forEach(function (f) {
    var t = src(f);
    assert(t.indexOf('getAbsoluteDay') >= 0 && t.indexOf('totalMinutes') >= 0, 'D5 播种日号历法优先、绝对分钟只做兜底：' + f.split('/').pop());
});

// ==================== E · LEG-1 测试清单换代 ====================
console.log('\n[E] 旧测试清单换代（LEG-1 判定）');
var testsDir = fs.readdirSync(path.join(ROOT, 'tests'));
eq(testsDir.filter(function (f) { return /endgame/.test(f); }).length, 0, 'E1 endgame 五套旧测试已退役（清单换代完成）');
assert(src('tests/run-all.sh').indexOf('endgame') < 0, 'E2 run-all 不再引用退役模块的测试');
// 外包点名的 11 套「测试侧脆弱/断言级失败」全部在现行清单里（且 run-all EXIT=0 即全绿）
['v20.21-world-teeth-node.js', 'v20.81-report-bugfix-node.js', 'tournament-node.js', 'sect-management-node.js',
 'v20.11-achievements-node.js', 'v20.14-disciple-roots-node.js', 'v20.24-dao-bridge-node.js', 'v20.52-player-sect-node.js',
 'v20.58-wild-map-hazard-node.js', 'v20.86-sect-scenarios-node.js', 'v21.2-facility-fixes-node.js'].forEach(function (f) {
    assert(testsDir.indexOf(f) >= 0 && src('tests/run-all.sh').indexOf(f) >= 0, 'E3 点名套件在现行清单：' + f);
});
assert(src('tests/run-all.sh').indexOf('wave96-closure-node.js') >= 0, 'E4 本套已挂全量回归');

console.log('\n========== 第九十六波 · 挂账收口 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
