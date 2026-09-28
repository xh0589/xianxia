/**
 * wave131-journey-hours-node.js — 第一百三十一批 · 「脚程时长念真账」＋「开箱落空要有下一句」
 *
 * 覆盖（全沙箱真跑：真 time-system.js 落笔、真 regions.js 出图、真 world-map.js 上路）：
 *   A 控制组·真尺就位：formatShichen 用的是 js/time-system.js 那一只（不是本套件自己口算）
 *   B 全条线出关句：11 条关隘 × 双向 22 次真上路，屏上那句时长 == formatShichen(时间账真跳的分钟)
 *   C 改前复现：把 :251 回打成旧「约两个时辰十里」，同一世界同一尺下它当场念错
 *   D 支路不口算：真源没就绪时 shichenText 只念分钟，绝不自己除 120（形状棘轮：全仓此文件 `/120`＝0）
 *   E 关隘事的时辰对账：光景行不再自己写死时辰（旧三件写「半个／一个时辰」都错一倍），那笔耽搁由时间通道那句念对
 *   F 形状棘轮：全仓「里 · 约」后面不许再跟写死的时辰字面
 *   G 洞府路引图例：60 里≈那句现推自同一把尺（真渲染上屏），旧写死常量回打即报红
 *   H 开箱两支：openChest 返回空（无箱表／整池虚标）时落空句必须上屏；回打裸调用则只剩发现句
 *
 * 运行：node tests/wave131-journey-hours-node.js
 */
'use strict';

var fs = require('fs');
var vm = require('vm');
var path = require('path');
var ROOT = path.resolve(__dirname, '..');

var 通 = 0, 红 = [];
function ok(cond, label) {
    通 += cond ? 1 : 0;
    if (!cond) 红.push(label);
    console.log((cond ? '  ✓ ' : '  ✗ ') + label);
}
function eq(a, b, label) { ok(a === b, label + '（实际=' + JSON.stringify(a) + ' 期望=' + JSON.stringify(b) + '）'); }
function src(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
function has(s, sub, label) { ok(String(s).indexOf(sub) >= 0, label); }

// ==================== 沙箱：真文件装进来跑 ====================
function 造世界(覆盖) {
    覆盖 = 覆盖 || {};
    var S = {
        console: { log: function () {}, warn: function () {}, error: function () {} },
        Math: Math, JSON: JSON, Object: Object, Array: Array, Date: Date, String: String,
        Number: Number, Boolean: Boolean, isFinite: isFinite, parseInt: parseInt,
        parseFloat: parseFloat, RegExp: RegExp, setTimeout: function () {}, clearTimeout: function () {},
        requestAnimationFrame: function () {}
    };
    S.window = S;
    S.msgs = [];
    S.timeCalls = [];
    S.items = [];
    S.wildOpens = [];
    S.document = {
        readyState: 'complete',
        createElement: function () { return { style: {}, classList: { add: function () {}, remove: function () {}, toggle: function () {}, contains: function () { return false; } }, appendChild: function () {} }; },
        createElementNS: function (ns, t) { return { style: {}, classList: { add: function () {}, remove: function () {}, contains: function () { return false; } } }; },
        getElementById: function () { return null; },
        querySelector: function () { return null; },
        querySelectorAll: function () { return []; },
        addEventListener: function () {},
        body: { appendChild: function () {}, insertAdjacentHTML: function () {} }
    };
    var store = {};
    S.localStorage = {
        getItem: function (k) { return store[k] !== undefined ? store[k] : null; },
        setItem: function (k, v) { store[k] = String(v); },
        removeItem: function (k) { delete store[k]; }
    };
    S.showMessage = function (m, t) { S.msgs.push(String(m)); };
    S.updateCharacterStatus = function () {};
    S.updateCurrencyUI = function () {};
    S.openWildernessMap = function (r) { S.wildOpens.push(r); };
    S.addItemToInventory = function (id, n) { S.items.push([id, n]); return n || 1; };
    S.addItem = S.addItemToInventory;
    S.getEffectiveMax = function () { return 100; };
    S.generateRandomEnemy = function () { return { name: '野狼', hp: 100, physiologyType: 'beast' }; };
    S.openBattleWithEntity = function () {};
    S.EventBus = { emit: function () {}, on: function () {} };
    S.GameEvents = { emit: function () {}, on: function () {} };
    S.currentCharData = { name: '测试', realm: '筑基', layer: 5, location: null, energy: 999, health: 100, qi: 100, spiritStones: 500, mood: 50 };
    S.randomEvents = [];
    if (覆盖.randomSeq) {
        var 序 = 覆盖.randomSeq.slice(), 机 = Object.create(Math);
        机.random = function () { return 序.length > 1 ? 序.shift() : 序[0]; };
        S.Math = 机;
    }
    var ctx = vm.createContext(S);
    function load(rel, 改) {
        var code = 改 ? 改(src(rel)) : src(rel);
        vm.runInContext(code, ctx, { filename: rel });
    }
    if (!覆盖.不装时辰) {
        load('js/time-system.js');
        // 只加一只监听表，账本身仍由真 advanceTime 落
        var 原 = S.timeSystem && S.timeSystem.advanceTime;
        if (typeof 原 === 'function') {
            S.timeSystem.advanceTime = function (m, r) { S.timeCalls.push({ m: m, r: r }); return 原.call(S.timeSystem, m, r); };
        }
    }
    load('js/regions.js');
    load('js/map/world-map.js', 覆盖.改疆界);
    if (覆盖.装洞府) { load('js/house-system.js'); load('js/house-panel.js', 覆盖.改洞府); }
    return { S: S, ctx: ctx, load: load };
}

function 城of(S, reg) { var cs = (S.mapData[reg] && S.mapData[reg].cities) || []; return cs[0] || null; }
function 站在(S, reg) {
    S.currentCharData.location = 城of(S, reg);
    // 本批量的是「时长念得对不对」，不是脚力账：真 time-system 跨日会按生理钟回压 energy，
    // 一路跑 22 趟会被「脚力不济」挡下来，那不是这里要的东西。
    S.currentCharData.energy = 999;
    S.locationSystem = { getCurrentLocation: function () { return S.currentCharData.location; } };
}
function 出关句(S) {
    var 行 = S.msgs.filter(function (m) { return /🧭 出/.test(m); });
    return 行.length ? 行[行.length - 1] : '';
}

// ==================== A 控制组·真尺就位 ====================
console.log('\n[A] 控制组：尺子是 js/time-system.js 那一只');
(function () {
    var w = 造世界();
    ok(typeof w.S.formatShichen === 'function', 'A1 真 time-system 装载后 window.formatShichen 就位');
    eq(w.S.formatShichen(120), '一个时辰', 'A2 120 分钟＝一个时辰（1 时辰＝120 分钟的全仓口径）');
    eq(w.S.formatShichen(240), '两个时辰', 'A3 240 分钟＝两个时辰');
    eq(w.S.formatShichen(180), '3小时', 'A4 180 分钟折不出整时辰，尺子自己回落');
    eq(w.S.formatShichen(60), '半个时辰', 'A5 60 分钟＝半个时辰');
    // 反证尺子不是本套件口算：旧硬写的「60 里≈两个时辰」按真尺应是 120 分钟＝一个时辰
    ok(w.S.formatShichen(120) !== '两个时辰', 'A6 控制组：真尺不把 120 分钟念成两个时辰');
})();

// ==================== B 全条线出关句 ====================
console.log('\n[B] 全条线：22 次真上路，屏上时长 == 时间账真跳的分钟');
(function () {
    var w = 造世界({ randomSeq: [0.99] });   // 0.99 ≥ 0.45：路上不出事，账面干净
    var S = w.S, WM = S.WorldMap, 对 = 0, 错 = [];
    WM.borders.forEach(function (bd) {
        [[bd.a, bd.b], [bd.b, bd.a]].forEach(function (pair) {
            站在(S, pair[0]);
            S.msgs.length = 0; S.timeCalls.length = 0;
            var 起点总 = S.timeSystem.gameTime.totalMinutes;
            var 成 = WM.setOut(pair[1]);
            var 句 = 出关句(S);
            var 真跳 = S.timeSystem.gameTime.totalMinutes - 起点总;
            var 该念 = S.formatShichen(真跳);
            var 期望 = '（' + bd.li + ' 里 · 约 ' + 该念 + '）';
            if (成 && 句.indexOf(期望) >= 0 && 真跳 === S.WorldMap.journeyMinutes(bd) && 真跳 === bd.li * 2) 对++;
            else 错.push(pair[0] + '→' + pair[1] + '｜成=' + 成 + '｜真跳 ' + 真跳 + '｜期望「' + 期望 + '」｜屏上[' + S.msgs.join(' ⏐ ') + ']');
        });
    });
    eq(错.length, 0, 'B1 条线条线全对上（对 ' + 对 + '/22）' + (错.length ? '\n      ' + 错.join('\n      ') : ''));
    // 抽查三条不同里数：旧写法对它们念同一句
    站在(S, '中州'); S.msgs.length = 0; WM.setOut('蜀地');
    has(出关句(S), '180 里 · 约 ' + S.formatShichen(360), 'B2 剑阁栈道 180 里念真账（' + S.formatShichen(360) + '）');
    站在(S, '中州'); S.msgs.length = 0; WM.setOut('北冥');
    has(出关句(S), '360 里 · 约 ' + S.formatShichen(720), 'B3 寒江关 360 里念真账（' + S.formatShichen(720) + '）');
    站在(S, '中州'); S.msgs.length = 0; WM.setOut('西漠');
    has(出关句(S), '300 里 · 约 ' + S.formatShichen(600), 'B4 玉门古道 300 里念真账（' + S.formatShichen(600) + '）');
    ok(出关句(S).indexOf('两个时辰十里') < 0, 'B5 屏上不再有「两个时辰十里」那句旧话');
})();

// ==================== C 改前复现 ====================
console.log('\n[C] 改前复现：:251 回打旧硬写，同一世界当场念错');
(function () {
    var 旧 = function (s) {
        return s.replace("'（' + border.li + ' 里 · 约 ' + shichenText(mins) + '）……'", "'（' + border.li + ' 里 · 约两个时辰十里）……'");
    };
    var w = 造世界({ randomSeq: [0.99], 改疆界: 旧 });
    var S = w.S;
    var 码 = src('js/map/world-map.js');
    ok(旧(码) !== 码, 'C1 回打生效：:251 那句换回了旧的写死时长（改前后源码字面确有不同）');
    ok(旧(码).indexOf("'（' + border.li + ' 里 · 约两个时辰十里）") >= 0 && 码.indexOf("'（' + border.li + ' 里 · 约两个时辰十里）") < 0, 'C1b 只有回打出来的那份源码把硬写接在了出关句里');
    站在(S, '中州'); S.msgs.length = 0; S.timeCalls.length = 0;
    S.WorldMap.setOut('蜀地');
    var 句 = 出关句(S);
    var 真跳 = S.timeCalls.reduce(function (a, c) { return a + c.m; }, 0);
    has(句, '约两个时辰十里', 'C2 旧写法照样上屏（回打生效）');
    ok(句.indexOf(S.formatShichen(真跳)) < 0, 'C3 旧句与真账对不上：真跳 ' + 真跳 + ' 分钟＝' + S.formatShichen(真跳) + '，屏上却念「两个时辰」');
    站在(S, '中州'); S.msgs.length = 0;
    S.WorldMap.setOut('北冥');
    ok(出关句(S).indexOf('两个时辰十里') >= 0 && 出关句(S).indexOf(S.formatShichen(720)) < 0, 'C4 旧句在 360 里那条上照样念同一句（三条线一个数——这正是 DES-54）');
})();

// ==================== D 支路不口算 ====================
console.log('\n[D] 支路：真源没就绪只念分钟，绝不自己除 120');
(function () {
    var w = 造世界({ randomSeq: [0.99], 不装时辰: true });
    var S = w.S;
    ok(typeof S.formatShichen === 'undefined', 'D1 沙箱里确实没有 formatShichen（逼出支路）');
    站在(S, '中州'); S.msgs.length = 0;
    S.WorldMap.setOut('北冥');
    has(出关句(S), '约 720 分钟', 'D2 支路念分钟：720 分钟（不是自己口算的「六个时辰」）');
    var 码 = src('js/map/world-map.js');
    eq((码.match(/\/\s*120/g) || []).length, 0, 'D3 形状棘轮：world-map.js 里不出现「/ 120」自算（' + (码.match(/\/\s*120/g) || []).length + ' 处）');
    has(码, 'global.formatShichen', 'D4 折法只借 time-system 那一处');
})();

// ==================== E 关隘事的时辰对账 ====================
console.log('\n[E] 关隘事：牌面不再自己写时辰，那笔耽搁由时间通道念对');
(function () {
    var 时长字面 = /半个时辰|[一二三四五六七八九十]个时辰|[0-9]+分钟|[0-9]+小时/;
    // pass[0] 盘查 30 分；bridge[2] 湿桥 30 分；sea[2] 海雾 60 分；sea[1] 渔火 time:-40（被 passTime 夹成 0）
    var 例 = [
        { 起: '中州', 终: '北冥', 掷: [0.1], 名: /关卒盘查/, 分: 30 },
        { 起: '中州', 终: '南疆', 掷: [0.1, 0.75], 名: /桥面湿滑/, 分: 30 },
        { 起: '东荒', 终: '东南海域', 掷: [0.1, 0.75], 名: /海雾里迷了方向/, 分: 60 },
        { 起: '东荒', 终: '东南海域', 掷: [0.1, 0.45], 名: /渔火引路/, 分: -40 }
    ];
    例.forEach(function (T, i) {
        var w = 造世界({ randomSeq: T.掷 });
        var S = w.S;
        站在(S, T.起); S.msgs.length = 0; S.timeCalls.length = 0;
        S.WorldMap.setOut(T.终);
        var 事句 = S.msgs.filter(function (m) { return T.名.test(m); });
        var 通道句 = S.msgs.filter(function (m) { return /耗时/.test(m); });
        var 落笔 = S.timeCalls.map(function (c) { return c.m; });
        eq(事句.length, 1, 'E' + (i + 1) + ' ' + T.名.source + ' 真上路时恰好一句光景上屏');
        var 句 = 事句[0] || '';
        ok(!时长字面.test(句), 'E' + (i + 1) + 'b 光景那行不再自己写时长（各算各的是 DES-54，念两遍是 DES-42）｜' + 句);
        if (T.分 > 0) {
            var 该 = '耗时' + S.formatShichen(T.分);
            ok(通道句.some(function (m) { return m.indexOf(该) >= 0; }), 'E' + (i + 1) + 'c 那笔耽搁由时间通道念对：「' + 该 + '」');
            ok(落笔.indexOf(T.分) >= 0, 'E' + (i + 1) + 'd 账上确实落了这 ' + T.分 + ' 分钟（' + 落笔.join(',') + '）');
        } else {
            ok(句.indexOf('省') < 0, 'E' + (i + 1) + 'c 负数那支不许在牌面许诺节省（账上没动）｜' + 句);
            ok(!通道句.some(function (m) { return /省|40分钟/.test(m); }), 'E' + (i + 1) + 'd 通道也不许念一笔没发生的省时（' + 通道句.join(' ⏐ ') + '）');
            ok(落笔.filter(function (m) { return m > 0; }).length === 1, 'E' + (i + 1) + 'e 正数只有赶路那一笔，省时那笔被夹成 0（登记：time:-40 从未入账，要真减属待裁）｜' + 落笔.join(','));
        }
    });
    // 改前复现：旧文案写死「半个时辰」，同一趟通道念的却是「耗时30分钟」——两句话同屏当面打架
    var 旧 = function (s) { return s.replace("'关卒盘查行囊，一件件抖开看。'", "'关卒盘查行囊，磨了半个时辰。'"); };
    var wo = 造世界({ randomSeq: [0.1], 改疆界: 旧 });
    站在(wo.S, '中州'); wo.S.msgs.length = 0; wo.S.timeCalls.length = 0;
    wo.S.WorldMap.setOut('北冥');
    var 旧句 = (wo.S.msgs.filter(function (m) { return /关卒盘查/.test(m); })[0] || '');
    var 旧通道 = wo.S.msgs.filter(function (m) { return /关隘耽搁/.test(m); });
    ok(旧(src('js/map/world-map.js')) !== src('js/map/world-map.js'), 'E5 改前复现：回打生效（盘查文案换回写死的「半个时辰」）');
    has(旧句, '半个时辰', 'E6 改前复现：旧牌面把「半个时辰」写死在光景里');
    ok(旧通道.length === 1 && 旧通道[0].indexOf('耗时30分钟') >= 0, 'E7 改前复现：同一趟通道念的是「耗时30分钟」——牌面与账差一倍，两句还同屏打架（' + 旧通道.join(' ⏐ ') + '）');
})();

// ==================== F 形状棘轮 ====================
console.log('\n[F] 形状棘轮：全仓「里 · 约」后面不许跟写死的时辰');
(function () {
    var 犯 = [];
    function 扫(dir) {
        fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).forEach(function (e) {
            var p = path.join(dir, e.name);
            if (e.isDirectory()) { if (e.name !== 'node_modules') 扫(p); return; }
            if (!/\.js$/.test(e.name)) return;
            var 码 = src(p);
            码.split(/\r?\n/).forEach(function (行, n) {
                var 头 = 行.trim();
                if (/^\/\/|^\*|^\/\*/.test(头)) return;   // 注释里引用旧硬写是记账，不是上屏的字面
                if (/里\s*[·・.、]\s*约\s*['"“]?[^'"]*个时辰/.test(行) && !/shichenText|formatShichen|_dur\(/.test(行)) 犯.push(p + ':' + (n + 1) + ' ' + 行.trim().slice(0, 90));
            });
        });
    }
    扫('js');
    eq(犯.length, 0, 'F1 写死时长句存量 0（' + 犯.join('\n      ') + '）');
    var 码 = src('js/map/world-map.js');
    has(码, "约 ' + shichenText(mins)", 'F2 出关句走 shichenText(mins)');
    has(码, "function shichenText(minutes)", 'F3 shichenText 定义在本文件，折法借 global.formatShichen');
})();

// ==================== G 洞府路引图例 ====================
console.log('\n[G] 洞府路引：图例那句「60 里≈」现推自同一把尺');
(function () {
    function 路引html(改洞府) {
        var w = 造世界({ randomSeq: [0.99], 装洞府: true, 改洞府: 改洞府 });
        var S = w.S;
        var 表 = S.CAVE_SITES || {};
        var id = Object.keys(表)[0];
        if (!id) return { S: S, html: 'ERR:CAVE_SITES 没装载' };
        S.playerHouse = { type: 'cave', upgrades: {}, furniture: [], planted: [], storageApplied: 0, location: id };
        站在(S, 表[id].region);
        var c = { innerHTML: '', className: '', children: [], style: {}, appendChild: function () {}, setAttribute: function () {} };
        var s2 = { innerHTML: '', className: '', children: [], appendChild: function () {} };
        try {
            if (!S.renderHouseStatus) S.renderHouseStatus = function () {};
            S.HousePanelUI._toggleRoads();       // 路引板默认收起——不展开就没有那一行
            S.HousePanelUI.render(c, s2);
            return { S: S, html: String(c.innerHTML) + String(s2.innerHTML), 上屏: true };
        } catch (e) { return { S: S, html: 'ERR:' + e.message }; }
    }
    var 今 = 路引html(null);
    var 尺 = 今.S.WorldMap.shichenText(今.S.WorldMap.journeyMinutes({ li: 60 }));
    eq(尺, '一个时辰', 'G1 同一把尺：60 里＝' + 今.S.WorldMap.journeyMinutes({ li: 60 }) + ' 分钟＝' + 尺);
    ok(今.上屏 && 今.html.indexOf('里数与耗时走') >= 0, 'G2 洞府路引真渲染并展开（' + String(今.html).slice(0, 60) + '）');
    has(今.html, '（60 里≈' + 尺 + '）', 'G3 图例那句上屏 == 尺子现推（60 里≈' + 尺 + '）');
    ok(今.html.indexOf('60 里≈两个时辰') < 0, 'G4 图例不再写死「两个时辰」');
    // 图例与它下面各行念的必须是同一本账：抽查一条他州脚程行
    var 里行 = 今.html.match(/(\d+) 里 · 约 (\d+) 分钟/);
    ok(!!里行, 'G5 路引下面每行仍印真分钟数（被 wave102 E2 钉住，本批未动）');

    var 码 = src('js/house-panel.js');
    var 旧 = function (s) { return s.replace("（60 里≈' + 里尺话 + '）", "（60 里≈两个时辰）"); };
    ok(旧(码) !== 码, 'G6 改前复现：回打生效（图例换回写死的「两个时辰」）');
    var 昔 = 路引html(旧);
    has(昔.html, '（60 里≈两个时辰）', 'G7 改前复现：旧图例照样上屏');
    ok(昔.html.indexOf('（60 里≈' + 昔.S.WorldMap.shichenText(昔.S.WorldMap.journeyMinutes({ li: 60 })) + '）') < 0,
        'G8 改前复现：写死的「两个时辰」与同一把尺算出的「' + 尺 + '」当场对不上');
})();

// ==================== H 开箱两支 ====================
console.log('\n[H] 开箱：openChest 落空时必须有下一句');
(function () {
    function 造开箱(箱返回, 有函数) {
        var S = {
            console: { log: function () {}, warn: function () {}, error: function () {} },
            Math: Math, JSON: JSON, Object: Object, Array: Array, Date: Date, String: String, Number: Number, Boolean: Boolean,
            isFinite: isFinite, parseInt: parseInt, parseFloat: parseFloat, RegExp: RegExp,
            msgs: [], randomEvents: [], itemById: { pill_diamond: undefined },
            gainExp: function () {}, addItem: function (id, n) { S.msgs.push('ADD:' + id + '×' + n); return n; },
            addItemFailText: function () { return ''; },
            currentCharData: { mood: 50 }
        };
        S.window = S;
        S.showMessage = function (m, t) { S.msgs.push(String(m)); };
        if (有函数) S.openChest = function (型) { return 箱返回; };
        var ctx = vm.createContext(S);
        vm.runInContext(src('js/items-extended/11-event-extensions.js'), ctx, { filename: 'js/items-extended/11-event-extensions.js' });
        return S;
    }
    function 触发(S, id, 选项) {
        var e = S.randomEvents.filter(function (x) { return x.id === id; })[0];
        ok(!!e, '  事件 ' + id + ' 已装载');
        e.choices[选项].effect();
        return S.msgs.slice();
    }
    // 无箱表：走旧的兜底句（本来就出声）
    var S0 = 造开箱(null, false);
    var m0 = 触发(S0, 'event_desert_treasure', 0);
    ok(m0.some(function (m) { return /纹丝不动/.test(m); }), 'H1 没有 openChest 时仍念旧兜底句（沙漠遗迹）');
    // 有函数但落空（无箱表／整池虚标——openChest 自己一句话不念）
    var S1 = 造开箱(null, true);
    var m1 = 触发(S1, 'event_desert_treasure', 0);
    ok(m1.some(function (m) { return /摸到一处暗格/.test(m); }), 'H2 发现句照念（看见暗格≠得到东西）');
    ok(m1.some(function (m) { return /暗格是空的/.test(m); }), 'H3 落空必须有下一句（旧写法此后一片安静）');
    var S2 = 造开箱(null, true);
    var m2 = 触发(S2, 'event_underwater_cave', 0);
    ok(m2.some(function (m) { return /匣子全被水沤烂了/.test(m); }), 'H4 水下洞窟落空同理有下一句');
    // 真开了箱：不许混进落空句
    var S3 = 造开箱({ items: [] }, true);
    var m3 = 触发(S3, 'event_desert_treasure', 0);
    ok(m3.length === 1 && /摸到一处暗格/.test(m3[0]), 'H5 开箱成功时只念发现句，不落空话（' + m3.join('|') + '）');
    // 改前复现：裸调用丢返回值
    var 旧 = function (s) {
        return s
            .replace("chestOr('rare','暗格是空的——里头什么也没留下。');", "window.openChest('rare');")
            .replace("chestOr('epic','匣子全被水沤烂了——一只手就塌成泥。');", "window.openChest('epic');");
    };
    var 码 = src('js/items-extended/11-event-extensions.js');
    ok(旧(码) !== 码, 'H6 改前复现：回打生效（两处换回裸 window.openChest 调用）');
    var S4 = 造开箱(null, true);
    S4.randomEvents = [];
    var ctx4 = vm.createContext(S4);
    vm.runInContext(旧(码), ctx4, { filename: 'js/items-extended/11-event-extensions.js(旧)' });
    var e4 = S4.randomEvents.filter(function (x) { return x.id === 'event_desert_treasure'; })[0];
    e4.choices[0].effect();
    eq(S4.msgs.length, 1, 'H7 改前复现：旧写法落空时屏上只有一句发现话，玩家不知道箱是空的（' + S4.msgs.join('|') + '）');
    ok(S4.msgs.join('').indexOf('暗格是空的') < 0, 'H8 改前复现：落空句确实没有');
})();

// ==================== 收尾 ====================
console.log('\n[R] 汇总');
eq(红.length, 0, '未通过项 0（' + 红.length + '）' + (红.length ? '\n      ' + 红.join('\n      ') : ''));
console.log('通过 ' + 通 + ' / 失败 ' + 红.length);
try { fs.writeFileSync(path.join(ROOT, '.scratch/wave131-self.out'), '通过 ' + 通 + ' / 失败 ' + 红.length + '\n' + 红.join('\n')); } catch (e) {}
process.exit(红.length ? 1 : 0);
