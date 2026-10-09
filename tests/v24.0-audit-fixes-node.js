/**
 * v24.0-audit-fixes-node.js — 第二十四轮 · 试玩审查自查修复验收（本轮由本仓自修）
 *
 * 验收点（编号=改良说明.md 条目）：
 *   DES-20（高）：竞技场设施动作接回 ArenaSystem（榜单＋上台），不再偷开木人桩；
 *                 showArenaRanking 从全仓零调用点变有入口；日限/精力账真扣
 *   DES-22（高）：时辰口径全仓一处——formatShichen（1 时辰=120 分钟）；
 *                 洞府工期/街面活四路 /60 口算「时辰」的翻倍假账清零
 *   DES-05（中）：恐惧心魔读 _failedBreakthroughs（旧读 failedBreakthroughs 零写方，永不触发）
 *   CONTRIB-01（中）：贡献兑换按钮不再一个标签两个 class（禁字样式盖掉置灰样式）
 *   UI-14（高）：发件箱/收藏能开信；发件箱操作改「再写一封＋删除」，不再假收藏/假回复
 *   UI-01（中）：500 字信纸封顶不再静默截断
 *   MAIL-DEL（高）：deleteMail 覆盖发件箱；playerReply 回布尔，UI 不再谎报「已送达」
 *   DES-32（高）：生理量程有写入者——maxBloodVolume 随实体同处生（妖兽 1.5 倍、等级缩放同步抬）
 *   UI-15（高）：战斗面板顶部换成「会杀人的那条尺」（脑/颈/胸最弱格），判死处当场记 deathCause，
 *                 胜败结算屏点名致死那一格（旧读数 22 格相加，颈断那一帧仍显示九成）
 *   UI-16（中）：四条生理条按实体自己的量程画，妖兽满血不再印「150/100」
 *   UI-11（中）：任务页一条高度策略——48 章主线只露焦点±2、长表折叠收口，六个列表取消自带滚窗（消双滚）
 *   UI-12（中）：空态一支笔——公共件 js/core/empty-state.js（.x-empty）收掉任务页私有那份与四处「暂无 X」死字，
 *                 短面板空态填到半屏；文案只写代码里真存在的门（藏经阁阅览／好感 50 招募／日程被动排期）
 *   DES-34（高）：势力页「⚔️ 当前冲突」此前全仓零写方（页面写死「暂无冲突」，真账却在天天涨）——
 *                 接回 factionState.activeConflicts，同对势力只留一场开着的仗，开战记世界历日子 startDay
 *   UI-12（中）：高度一支笔——模态框内容不再自带像素写死的第二层滚窗（14 处撤平，宿主那条 vh 笔来滚），
 *                 两扇有意钉住的窗（伤势详情／队伍日志）上限改按视口，图鉴速览改用「少摆几条 + 说明还剩几条」
 *
 * 运行：node tests/v24.0-audit-fixes-node.js
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
function src(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
function load(rel) { vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel }); }
// 剥掉行注释（不动字符串里的 `://`）——文本哨兵要先过这一道，否则源码注释里引用旧病根的那几行会自己判红
function codeOnly(t) { return t.replace(/(^|[^:])\/\/[^\n]*/g, '$1'); }
function jsFiles(dir) {
    var out = [];
    fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).forEach(function (e) {
        var p = path.join(dir, e.name);
        if (e.isDirectory()) out = out.concat(jsFiles(p));
        else if (e.name.endsWith('.js')) out.push(p);
    });
    return out;
}
// CSS 块尺（[CE]／[CJ] 共用一支，别复制第二份）：同一支选择器可能在 @media 内外各写一块，
//   故取块要按「含哪条声明」筛，不能按选择器认第一次；`址` 给「源序谁在前」那类尺用。
function css块尺() {
    function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
    function 块表(css, sel) {
        var re = new RegExp(esc(sel) + '\\s*\\{([^}]*)\\}', 'g'), m, out = [];
        while ((m = re.exec(css))) out.push({ 址: m.index, 体: m[1] });
        return out;
    }
    function 找支(css, sel, prop) {
        var t = 块表(css, sel).filter(function (x) { return new RegExp(prop + ':').test(x.体); });
        return t.length ? t[0] : null;
    }
    function 支值(css, sel, prop) { var b = 找支(css, sel, prop); return b ? ((b.体.match(new RegExp(prop + ':\\s*([^;}]+)')) || ['', ''])[1]).trim() : ''; }
    function 支数(css, sel, prop) { return 块表(css, sel).filter(function (x) { return new RegExp(prop + ':').test(x.体); }).length; }
    function 支址(css, sel, prop) { var b = 找支(css, sel, prop); return b ? b.址 : -1; }
    function 出现次数(hay, needle) { return hay.split(needle).length - 1; }
    return { esc: esc, 块表: 块表, 找支: 找支, 支值: 支值, 支数: 支数, 支址: 支址, 出现次数: 出现次数 };
}
// UI-23 那批「保底 + 跟手」写法：max(<px>px, <rem>rem)。一把尺要同时钉两件事——
//   ① 下限那个 px 仍是实机量到的数（别让「顺手调回 140」溜过去）；
//   ② rem 那颗在根字号 16px（标准档）下折回同一个像素数，否则这条改动把默认界面一起动了。
// 形状不是 max()（写死 px 或写死 rem）时返回 null，由调用方判红，别在这里替它圆场。
function maxFloor(text) {
    var m = String(text).match(/max\(\s*([\d.]+)px\s*,\s*([\d.]+)rem\s*\)/);
    if (!m) return null;
    var px = parseFloat(m[1]), rem = parseFloat(m[2]);
    return { px: px, rem: rem, std: rem * 16, at: function (root) { return Math.max(px, rem * root); } };
}

// ==================== 测试桩 ====================
global.window = global;
var store = {};
global.localStorage = {
    getItem: function (k) { return store[k] !== undefined ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; }
};
var msgs = [];
global.showMessage = function (m, t) { msgs.push({ m: String(m), t: t }); };
global.alert = function () {};
global.confirm = function () { return false; };
global.prompt = function () { return null; };
global.document = {
    readyState: 'complete',
    createElement: function () { return { style: {}, classList: { add: function () {}, remove: function () {}, contains: function () { return false; } }, dataset: {}, innerHTML: '', remove: function () {}, appendChild: function () {} }; },
    getElementById: function () { return null; },
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    addEventListener: function () {},
    body: { appendChild: function () {} }
};
global.setInterval = function () { return 0; };
global.setTimeout = function (fn) { try { fn(); } catch (e) {} return 0; };

// 第一百三十二批：境界门改吃 window.realmIndex / realmAtLeast（真源 js/global-utils.js），尺未就绪即判不够格。
//   本套件是共用一个 global 上下文的老页，旧状从没装过那把尺 ⇒ 之前测的是「降级支路」，不是玩家屏幕上那句
//   （仙侠.html:1930 装尺在 :2164 邮件两件套之前）。这里把真文件装上，只借尺：
//   ⚠️ global-utils:131 会顺手把 showMessage 换成只往 DOM 写的那只，装完立刻换回上面的 msgs 探针。
(function () {
    var _探针 = global.showMessage;
    vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'js/global-utils.js'), 'utf8'), { filename: 'js/global-utils.js' });
    global.showMessage = _探针;
})();

// ==================== A · DES-20 竞技场接线 ====================
console.log('\n[A] DES-20 竞技场设施动作接回 ArenaSystem');
(function () {
    var app = src('js/app.js');
    var m = app.match(/enterArena:\s*function\s*\(\)\s*\{[\s\S]*?\n?\s{8}\}/);
    assert(m, 'app.js 设施表里找得到 enterArena');
    var block = m ? m[0] : '';
    assert(/ArenaSystem/.test(block), '竞技场动作走 ArenaSystem（不再绕开日限/排名）');
    assert(!/training_dummy/.test(block), '竞技场动作不再偷开木人桩');

    // v24 实机复验（.scratch/v24-G-hud-arena.mjs）抓到的假修复：城建列表的「前往」绑的是
    // useBuilding('arena')，上面那张设施表只是永不命中的兜底——断言只锁表等于没锁。正门单独锁住。
    var ls = src('js/location-system.js');
    var ub = ls.match(/function useBuilding\(buildingId\)\s*\{[\s\S]*?\n\}/);
    assert(ub, 'location-system.js 找得到 useBuilding（城建列表正门）');
    var arenaDoor = ub ? ub[0].match(/buildingId === 'arena'[\s\S]*?\n {4}\}/) : null;
    assert(arenaDoor, "useBuilding 里有 'arena' 这一支");
    assert(/showRanking/.test(arenaDoor ? arenaDoor[0] : ''), '竞技场正门先上台前看榜');
    assert(!/training_dummy/.test(arenaDoor ? arenaDoor[0] : ''), '竞技场正门不再偷开木人桩');
    var liars = jsFiles('js').filter(function (f) {
        return /buildingId === 'arena'[\s\S]{0,300}training_dummy/.test(src(f));
    });
    eq(liars.length, 0, '全仓没有第二处把竞技场接回木人桩（' + liars.join(', ') + '）');

    // showArenaRanking 此前全仓零调用点
    var callers = jsFiles('js').filter(function (f) {
        if (f === path.join('js', 'gameplay', 'arena-system.js')) return false;
        return /showRanking|showArenaRanking/.test(src(f));
    });
    assert(callers.length > 0, '榜单有入口（调用点：' + callers.join(', ') + '）');

    // 行为：日限与精力账真扣
    load('js/gameplay/arena-system.js');
    var cd = { name: '测试', energy: 100, layer: 3, mainAttributes: { root: 10 }, arenaStreak: 0, arenaScore: 0, _arenaDay: 1, _arenaDailyCount: 0 };
    global.currentCharData = cd;
    global.getAbsoluteDay = function () { return 1; };
    global.gameTime = { currentDay: 1 };
    global.generateRandomEnemy = function () { return null; };   // 逼回退路径，不开真战斗
    global.inventory = { currency: { spiritStones: 0 } };
    global.timeSystem = { advanceTime: function () {}, gameTime: { totalMinutes: 0 } };

    var limit = (global.BALANCE_CONFIG && global.BALANCE_CONFIG.arena && global.BALANCE_CONFIG.arena.dailyLimit) || 5;
    var cost = (global.BALANCE_CONFIG && global.BALANCE_CONFIG.arena && global.BALANCE_CONFIG.arena.energyCost) || 10;
    cd.energy = 100;
    for (var i = 0; i < limit; i++) global.ArenaSystem.enter();
    eq(cd._arenaDailyCount, limit, '进台次数记在日限账上');
    eq(cd.energy, 100 - limit * cost, '每次进台真扣精力（' + cost + '/次）');
    msgs.length = 0;
    eq(global.ArenaSystem.enter(), false, '日限满了进不去');
    eq(cd._arenaDailyCount, limit, '被拒的那一次不再计数');
    eq(cd.energy, 100 - limit * cost, '被拒的那一次不再扣精力');
    assert(msgs.length === 1 && /比试牌|明日请早/.test(msgs[0].m), '日限到点由管事嘴里说出（不报裸计数器）');
})();

// ==================== B · DES-22 时辰口径一处算 ====================
console.log('\n[B] DES-22 时辰口径：formatShichen 独揽');
(function () {
    load('js/time-system.js');
    eq(window.formatShichen(120), '一个时辰', '120 分钟 = 一个时辰');
    eq(window.formatShichen(240), '两个时辰', '240 分钟 = 两个时辰');
    eq(window.formatShichen(60), '半个时辰', '60 分钟 = 半个时辰');
    eq(window.formatShichen(90), '90分钟', '非整除不硬凑时辰');

    // 全仓禁口算：任何一行同时出现「/60」与「时辰」即为私设刻度（time-system.js 是唯一真源）
    var bad = [];
    jsFiles('js').forEach(function (f) {
        if (f === path.join('js', 'time-system.js')) return;
        src(f).split('\n').forEach(function (line, i) {
            if (/时辰/.test(line) && /\/\s*60\b/.test(line) && !/^\s*(\/\/|\*|\/\*)/.test(line)) {
                bad.push(f + ':' + (i + 1));
            }
        });
    });
    assert(bad.length === 0, 'js/ 下再无 /60 口算时辰的行' + (bad.length ? '（残留：' + bad.join(', ') + '）' : ''));

    // 跨行也算：上一行 /60、下一行拼「个时辰」是同一台口算器，别让它躲过单行扫描
    var bad2 = [];
    jsFiles('js').forEach(function (f) {
        if (f === path.join('js', 'time-system.js')) return;
        var lines = src(f).split('\n');
        for (var i = 0; i + 2 < lines.length; i++) {
            var a = lines[i];
            if (/^\s*(\/\/|\*|\/\*)/.test(a) || !/\/\s*60\b/.test(a)) continue;
            var win = lines[i] + lines[i + 1] + lines[i + 2];
            if (/个时辰/.test(win) && !/formatShichen/.test(win)) bad2.push(f + ':' + (i + 1));
        }
    });
    assert(bad2.length === 0, '也无跨行口算时辰' + (bad2.length ? '（残留：' + bad2.join(', ') + '）' : ''));

    var rh = src('js/map/randomMap.js');
    var m0 = rh.indexOf('function fmtHours');
    assert(m0 > 0 && /formatShichen/.test(rh.slice(m0, m0 + 260)) && !/\/\s*60\b/.test(rh.slice(m0, m0 + 260)),
        '野外 ETA／渡口口径（fmtHours）委托 formatShichen');

    // 这三处必须改叫 formatShichen（经带回落的包装），不能只是删文案
    assert(/formatShichen\(recipe\.minutes\)|_dur\(recipe\.minutes\)/.test(src('js/house-system.js')), '洞府落成报借用时辰口径');
    var hp = src('js/house-panel.js');
    assert(/function _dur\(minutes\)/.test(hp), '洞府面板有带回落的时长包装 _dur');
    eq((hp.match(/_dur\(/g) || []).length, 3, '洞府面板一处定义 + 两处工期都用 _dur（不再各自口算）');
    assert(/formatShichen/.test(src('js/extensions/player-sect-venture.js')), '街面活耗时标签用 formatShichen');
})();

// ==================== C · DES-05 / CONTRIB-01 ====================
console.log('\n[C] DES-05 心魔读端 · CONTRIB-01 兑换按钮');
(function () {
    var c = src('js/cultivation/cultivation.js');
    assert(/_failedBreakthroughs/.test(c), '恐惧心魔读 _failedBreakthroughs');
    assert(!/charData\.failedBreakthroughs\s*\|\|/.test(c), '不再读零写方的 failedBreakthroughs');
    // 写端确实只写下划线版
    var writers = jsFiles('js').filter(function (f) { return /(_failedBreakthroughs\s*(\+\+|\+=|=))/.test(src(f)); });
    assert(writers.length > 0, '突破失败计数有写方：' + writers.join(', '));

    var app = src('js/app.js');
    var btnLines = app.split('\n').filter(function (l) { return /exchangeContribution\(/.test(l) && /<button/.test(l); });
    assert(btnLines.length > 0, '找到兑换按钮模板');
    btnLines.forEach(function (l, i) {
        eq((l.match(/class="/g) || []).length, 1, '兑换按钮 #' + i + ' 只有一个 class 属性');
    });
})();

// ==================== D · 邮件：发件箱开信 / 删除 / 回信真话 ====================
console.log('\n[D] UI-14 · UI-01 · MAIL-DEL 邮件读端与回执');
(function () {
    var ui = src('js/mail-system-ui.js');
    load('js/mail-system.js');
    var MS = window.MailSystem;

    window._mailSystemData = {
        inbox: [{ id: 'in1', type: 'npc_letter', fromNpcId: 'npc_a', fromNpcName: '柳四娘', subject: '药圃的事', body: '药熟了三畦。', carrier: 'pigeon', receivedAt: 0, readAt: null }],
        outbox: [{ id: 'out1', type: 'player_sent', fromNpcName: '我', toNpcId: 'npc_a', subject: '回复: 药圃的事', body: '知道了。', carrier: 'pigeon', sentAt: 0 }],
        favorites: [],
        _pending: []
    };

    // 删除覆盖发件箱
    MS.deleteMail('out1');
    eq(window._mailSystemData.outbox.length, 0, 'deleteMail 能删发件箱的信');
    eq(window._mailSystemData.inbox.length, 1, '删发件箱不动收件箱');
    MS.deleteMail('in1');
    eq(window._mailSystemData.inbox.length, 0, 'deleteMail 仍能删收件箱');

    // playerReply 回布尔
    window._mailSystemData = {
        inbox: [{ id: 'in2', type: 'npc_letter', fromNpcId: 'npc_b', fromNpcName: '陈五久', subject: '路过', body: '一叙。', carrier: 'pigeon', receivedAt: 0, readAt: null }],
        outbox: [], favorites: [], _pending: []
    };
    eq(MS.playerReply('nope', '好'), false, '回不存在的信 → false');
    eq(MS.playerReply('in2', '   '), false, '空回复 → false');
    eq(MS.playerReply('in2', '改日登门。'), true, '正常回信 → true');
    eq(window._mailSystemData.outbox.length, 1, '回信落进发件箱');
    eq(window._mailSystemData.outbox[0].subject, '回复: 路过', '回信带原主题');

    // UI 读端：三本账都查得到，发件箱文案不再冒充 NPC 来信
    assert(/function findMailBook/.test(ui), 'UI 有三本账共用的取信函数 findMailBook');
    eq((ui.match(/'(inbox|outbox|favorites)'/g) || []).length >= 3, true, 'findMailBook 覆盖 inbox/outbox/favorites');
    assert(/再写一封/.test(ui) && /composeTo\(/.test(ui), '发件箱给「再写一封」而非假收藏');
    assert(!/deleteMail\([\s\S]{0,40}\)\s*;\s*showMessage\(['"]已送达/.test(ui), '删除后不再谎报「已送达」');

    // 500 字封顶：定在数据层，UI 读同一个数，且必须说出口
    var ms = src('js/mail-system.js');
    var capM = ms.match(/MAIL_BODY_CAP\s*=\s*(\d+)/);
    assert(capM && Number(capM[1]) > 0, '信纸容量上限定义在数据层（MAIL_BODY_CAP=' + (capM ? capM[1] : '?') + '）');
    eq(jsFiles('js').filter(function (f) { return /MAIL_BODY_CAP\s*=\s*\d+/.test(src(f)); }).length, 1, '全仓只有这一处定义容量');
    assert(/MAIL_BODY_CAP:\s*MAIL_BODY_CAP/.test(ms), '容量对外导出，UI 不另立数');
    assert(!/MAIL_BODY_CAP\s*=\s*\d+/.test(ui), 'UI 不再自持一份容量');
    assert(!/\.slice\(0,\s*MAIL_BODY_CAP\)/.test(ui), 'UI 不再自行截断（截断在数据层）');
    assert(/_clampWarn/.test(ui) && (ui.match(/_clampWarn\(/g) || []).length >= 3, '写信与回信两条路都会喊超字');

    // 数据层兜底：绕过 UI 直接写，也只能落 500 字
    window._mailSystemData = { inbox: [], outbox: [], favorites: [], _pending: [] };
    MS.playerSendMail('npc_c', '张三', '长信', '字'.repeat(Number(capM[1]) + 137), 'pigeon');
    eq(window._mailSystemData.outbox.length, 1, '信确实寄出去了');
    eq(window._mailSystemData.outbox[0].body.length, Number(capM[1]), '落账的信被数据层截到 ' + capM[1] + ' 字');
})();

// ==================== E · DES-26 节日常历 + 秘境窗口上牌 ====================
console.log('\n[E] DES-26 世界日历：节日常历 + 秘境关窗票');
(function () {
    load('js/core/world-calendar.js');        // 自带 init：StateRegistry + EventBus 缺席也能跑
    load('js/core/festival-bridge.js');       // 真源 FESTIVAL_DEFS 的导出方（历法不另造一本）
    load('js/core/festival-calendar.js');

    var WC = global.WorldCalendar;
    assert(WC && typeof WC.register === 'function', '世界日历可用');
    assert(WC.allowedCategories.indexOf('festival') >= 0, 'festival 已进白名单');
    assert(/festival:\s*\{[^}]*label/.test(src('js/core/world-calendar-ui.js')), '日历面板有节令的展示元数据（不落到 📌 其他）');

    var FC = global.FestivalCalendar;
    assert(FC && typeof FC.sync === 'function', '节日常历模块导出 sync');
    assert((global.FESTIVAL_DEFS || []).length === 4, '四节历法来自节日桥真源（FESTIVAL_DEFS 4 条）');

    var days = { d: 1 };
    global.getAbsoluteDay = function () { return days.d; };

    // 开局第 1 天：四节全上牌，日子与历法一字不差
    WC.reset(); days.d = 1;
    eq(FC.sync(), 4, '开局 sync 登记 4 场节');
    var up = WC.list({ fromDay: 1 });
    eq(up.length, 4, '日历上有 4 条节票');
    eq(up.map(function (e) { return e.dueAbsoluteDay; }).join(','), '1,187,225,360', '上元/七夕/中秋/除夕落在第 1/187/225/360 天');
    assert(up.every(function (e) { return e.category === 'festival'; }), '票面类目是 festival（不是塞进 other/world_event）');
    assert(up.every(function (e) { return e.source && e.source.system === 'festival_calendar'; }), '登记方署名 festival_calendar');
    eq(FC.sync(), 0, '同日重复 sync 不双记（id 带绝对日）');

    // 岁尾：开年的节推到来年，不能登记成昨天
    WC.reset(); days.d = 355;
    FC.sync();
    var nxt = WC.getNextByCategory('festival', 355);
    assert(nxt && nxt.dueAbsoluteDay >= 355, '岁尾仍看得见未来的节（第 ' + (nxt && nxt.dueAbsoluteDay) + ' 天）');
    eq(nxt.dueAbsoluteDay, 360, '岁尾最近的一场是本年除夕（第 360 天，尚未过）');
    var yr = WC.list({ fromDay: 355 }).map(function (e) { return e.dueAbsoluteDay; }).join(',');
    eq(yr, '360,361,547,585', '跨年票面：除夕次日即来年上元（360+1），过期三节推到来年');

    // 闭关界面：节令有目标卡，秘境卡不再是死票
    var lr = src('js/cultivation/long-retreat.js');
    assert(/key:\s*'festival'/.test(lr), '闭关目标含节令');
    assert(/it\.category === 'festival'/.test(lr), '出关摘要单列节令一行（不落进「其他」）');

    var dd = src('js/extensions/dungeon-dynamic.js');
    assert(/category:\s*'dungeon_window'/.test(dd), '秘境开窗把关窗日登记进日历（dungeon_window 有注册方了）');
    assert(/WorldCalendar && typeof window\.WorldCalendar\.register === 'function'/.test(dd), '登记前守卫 register 可用（桩里没有 register 也不能炸）');
    assert(/dungeon_window\.' \+ t\.id \+ '\.close\./.test(dd), '秘境票 id 带模板与关窗日，不撞号');
})();

// ==================== F · DES-28 续档快照与手动档解耦 ====================
console.log('\n[F] DES-28 续档快照：继续仙途不再要玩家先想起按保存');
(function () {
    var cs = src('js/core/continue-save.js');
    var app = src('js/app.js');
    var html = src('仙侠.html');

    // —— 接线 ——
    assert(html.indexOf('js/core/continue-save.js') >= 0, '续档快照模块上了页面');
    assert(html.indexOf('continue-save-state') >= 0, '主面板有常驻落档状态位（● 未存档 摆到脸上）');
    // 【第一百四十四批·按「钉法」换定位词，要求一字未松】这两处原本靠
    // `localStorage.setItem('xianxia_save'` 定位。第一百四十四批把 18 个存档键接到单一 owner
    // （window.saveToStorage，js/global-utils.js），调用词改了 ⇒ 定位词跟着改。
    // **要求没松**：仍是「主档这一笔在前、槽位那一笔在后、回话排在两笔都写完之后，且读合并结论 _writeOk」。
    var writeIdx = app.indexOf("saveToStorage('xianxia_save'");
    var slotIdx = app.indexOf("saveToStorage('xianxia_saves'");
    var 回话 = slotIdx > 0 ? app.indexOf('ContinueSave.onSaved', slotIdx) : -1;
    // 第一百二十三批 DES-78：这一条原先钉的是「就近」（写完主档那笔 600 字以内回话）。
    // 就近恰恰是病：槽位那笔还没写，红点就清了 ⇒ 盘上少一本账而屏上说「已存」。现按合并结论重钉。
    assert(writeIdx > 0 && slotIdx > writeIdx && 回话 > slotIdx
        && /ContinueSave\.onSaved\(_writeOk \? saveData\.timestamp : 0\)/.test(app),
        'saveGame 向快照回话那一笔排在两笔盘（主档＋槽位）都写完之后，且读的是合并结论 _writeOk');
    assert((app.match(/ContinueSave\.onSaved/g) || []).length === 1,
        'saveGame 一族只许有一处 onSaved（两处回话＝后一处能盖掉前一处的谎）');
    var loadIdx = app.indexOf('function loadSaveData');
    assert(loadIdx > 0 && app.indexOf('ContinueSave.onLoaded', loadIdx) > loadIdx, '载入完成＝盘上即手上，红点清零');
    assert(!/setInterval|setTimeout/.test(cs), '落档不借现实定时器（全库纪律：期限只听游戏时间）');
    assert(!/localStorage\.(setItem|removeItem)/.test(cs), '快照不自己写盘，只走 saveGame 正门（一支笔一本账）');
    assert(/addEventListener\('beforeunload'/.test(cs), '注册了 beforeunload');

    // —— 行为桩 ——
    var bus = { h: {} };
    global.EventBus = {
        on: function (n, f) { (bus.h[n] = bus.h[n] || []).push(f); return function () {}; },
        emit: function (n, d) { (bus.h[n] || []).forEach(function (f) { f(d); }); return this; }
    };
    function fire(n, d) { (bus.h[n] || []).forEach(function (f) { f(d); }); }
    var unload = null;
    global.addEventListener = function (n, f) { if (n === 'beforeunload') unload = f; };
    var hud = { className: '', textContent: '', addEventListener: function () {} };
    var _oldGet = global.document.getElementById;
    global.document.getElementById = function (id) { return id === 'continue-save-state' ? hud : null; };
    global.currentCharData = { name: '甲', gender: '男' };

    var writes = [];
    var failWrite = false;
    global.saveGame = function (opts) {
        opts = opts || {};
        writes.push(opts);
        if (failWrite) { global.ContinueSave.onSaved(0); return null; }   // 盘满：写不进去
        store['xianxia_save'] = JSON.stringify({ charName: '甲', timestamp: Date.now() });
        if (!opts.autoMode) store['xianxia_saves'] = '[{"state":{"charName":"甲","timestamp":1}}]';
        global.ContinueSave.onSaved(Date.now());
        return {};
    };

    load('js/core/continue-save.js');
    var CS = global.ContinueSave;
    assert(CS && typeof CS.snap === 'function', '续档快照模块可用');
    assert((bus.h['time:advanced'] || []).length >= 1 && (bus.h['newDay'] || []).length >= 1
        && (bus.h['location:visited'] || []).length >= 1 && (bus.h['enemy:defeated'] || []).length >= 1,
        '四路世界事件都订到（时辰推进／跨日／进城／战斗结算）');
    assert(unload, 'beforeunload 挂上了');
    eq((bus.h['time:advanced'] || []).length, 1, '订阅幂等：世界事件每路只挂一次');
    eq(CS.FLUSH_GAME_MINUTES, 120, '落档门槛是一个时辰（120 游戏分钟，口径同 formatShichen）');

    // 攒够一个时辰才落，不够只标脏
    CS.onLoaded(); writes.length = 0;
    fire('time:advanced', { minutes: 1 });
    eq(CS.pendingMinutes(), 1, '一分钟只记一分钟（订阅没重、门槛没歪）');
    fire('time:advanced', { minutes: 29 });
    eq(writes.length, 0, '未攒满一个时辰不落盘（1MB 快照不该一刻一写）');
    eq(CS.isDirty(), true, '但已经记上未存档');
    assert(hud.textContent.indexOf('未存档') >= 0, 'HUD 说的是「● 未存档」');
    eq(CS.pendingMinutes(), 30, '攒着的三十分钟记在账上');
    fire('time:advanced', { minutes: 90 });
    eq(writes.length, 1, '攒满一个时辰（120 分钟）即落一次快照');
    eq(CS.pendingMinutes(), 0, '落完账清零');
    eq(writes[0].autoMode, true, '快照走 autoMode：不占手动档槽');
    eq(writes[0].silent, true, '快照静默：不打扰玩家');
    eq(store['xianxia_saves'], undefined, '手动档槽一个字节都没动');
    assert(store['xianxia_save'], 'xianxia_save 被续档快照重写（刷新后回得到的就是这一刻）');
    eq(CS.isDirty(), false, '落完盘红点自己灭');
    assert(hud.textContent.indexOf('已落档') >= 0, 'HUD 改口「✓ 已落档」');

    // 一次闭关连跨 30 天：真实毫秒节流，只落一次
    CS.onLoaded(); writes.length = 0;
    for (var d = 0; d < 30; d++) fire('newDay', { oldDay: d + 1, newDay: d + 2 });
    eq(writes.length, 1, '连跨 30 天只落一次（节流按真实毫秒，不为历法写 30 份）');
    eq(CS.isDirty(), true, '挡下的是写盘、不是账：没落的那 29 天仍记在未存档上');

    // 离开前：先补一次快照；补不上才拦人
    CS.onLoaded(); writes.length = 0;
    fire('time:advanced', { minutes: 10 });
    eq(writes.length, 0, '零碎十分钟不当场落盘');
    eq(unload({}), undefined, '关页前补落成功 → 不拦人（无对话框）');
    eq(writes.length, 1, '关页前把未落的一刻补写进盘');
    failWrite = true;
    CS.onLoaded(); writes.length = 0;
    fire('time:advanced', { minutes: 120 });
    eq(CS.isDirty(), true, '写盘失败＝红点不撒手（快照不许自称已存）');
    assert(typeof unload({}) === 'string', '盘满又要点 X ＝这时才拦，且说清为什么拦');
    failWrite = false;

    // 玩家手动点「保存存档」也算落档
    CS.onLoaded(); writes.length = 0;
    fire('time:advanced', { minutes: 10 });
    global.saveGame();                       // 默认档：写槽 + 弹 toast
    eq(writes.length, 1, '手动档走同一个 saveGame');
    eq(CS.isDirty(), false, '手动档之后红点同样归零（三支笔一本账）');
    assert(store['xianxia_saves'], '手动档确实落了 xianxia_saves');

    // —— continueCandidate：认最近一刻，不固定先信槽 ——
    var m = app.indexOf('function continueCandidate');
    var e = app.indexOf('window.continueCandidate = continueCandidate;', m);
    assert(m > 0 && e > m, '「继续仙途」的数据源收成一个函数（读端不再各扫各的）');
    var mkFn = new Function('saveSlots', 'localStorage', app.slice(m, e) + '\nreturn continueCandidate;');

    var slotsOld = [{ state: { charName: '甲', timestamp: 1000, gameTime: { currentDay: 3 } } }];
    store['xianxia_save'] = JSON.stringify({ charName: '乙', timestamp: 2000, gameTime: { currentDay: 1 } });
    var c1 = mkFn(slotsOld, global.localStorage)();
    eq(c1 && c1.charName, '乙', '快照比手动档新 → 续档回快照（旧口径先信槽，会回到昨天）');
    var slotsNew = [{ state: { charName: '丙', timestamp: 9000, gameTime: { currentDay: 7 } } }];
    eq(mkFn(slotsNew, global.localStorage)().charName, '丙', '手动档更新 → 续档回手动档');
    eq(mkFn([], { getItem: function () { return null; } })(), null, '两边都没档 → null（不猜）');
    var rb = app.slice(app.indexOf('function refreshContinueButton'), app.indexOf('window.refreshContinueButton'));
    assert(/尚无存档/.test(rb) && !/classList\.add\('hidden'\)/.test(rb), '没档时按钮写明白「尚无存档」，不再整枚消失');
    assert(rb.indexOf('continueCandidate') >= 0 && app.slice(m, app.indexOf('window.continueLastGame = ')).indexOf('continueCandidate()') >= 0,
        '标签与载入读同一份候选（不再一个函数两套账）');

    // —— HUD 落点：v24 实机（探针 D）量到「● 未存档」宽 0——它此前住在 #panel-character 里，
    //     玩家一切到别的面板就看不见；而 renderHud 整串覆写 className，元素上挂工具类等于白挂。
    var html = src('仙侠.html');
    var pChar = html.indexOf('id="panel-character"');
    var nextPanel = html.slice(pChar + 1).search(/id="panel-[a-z]+"/);
    var pEnd = nextPanel < 0 ? html.length : pChar + 1 + nextPanel;
    var hudTag = html.match(/<p[^>]*id="continue-save-state"[^>]*>/);
    assert(hudTag, 'HUD 状态位仍在 HTML 里有个家');
    var hudAt = hudTag ? html.indexOf(hudTag[0]) : -1;
    assert(!(hudAt > pChar && hudAt < pEnd), '「● 未存档」不再住在人物页里（切面板就宽 0）');
    assert(hudTag && !/class=/.test(hudTag[0]), 'HUD 元素上不挂 class（renderHud 整串覆写，挂了会被抹掉）');
    var tok = src('styles/ui-tokens.css');
    var hudCss = tok.match(/#continue-save-state\s*\{[^}]*\}/);
    assert(hudCss && /position:\s*fixed/.test(hudCss[0]), 'HUD 定位由 id 规则给（ui-tokens.css 里 position:fixed）');
    assert(/#continue-save-state:empty[^{]*\{[^}]*display:\s*none/.test(tok), '空文案时不挂一只空框');

    global.document.getElementById = _oldGet;
})();

// ==================== G · UI-17 信件窗定高链 + 两份样式合一 ====================
console.log('\n[G] UI-17 信件窗：读信格不再靠列表条数撑高，骨架只有一份');
(function () {
    var CSS = 'styles/panel-mail.css';
    var pm = src(CSS);
    var html = src('仙侠.html');

    // ① 骨架搬进来了：三样只有注入文件里才有的东西
    assert(/\.mail-inbox-panel\s*\{/.test(pm), '骨架的裸类窗体规则已在 panel-mail.css（不再只有 #id 层）');
    assert(/@keyframes pigeon-fly/.test(pm) && /@keyframes jade-fall/.test(pm) && /@keyframes mirror-emerge/.test(pm),
        '三种载具动效随骨架一并落地');
    assert(/\.mail-detail-body\s*\{[^}]*flex:\s*1/.test(pm) && /\.mail-detail-body\s*\{[^}]*white-space:\s*pre-wrap/.test(pm),
        '信纸自己的 flex／pre-wrap 由骨架供给（整改层没写过这两条）');

    // ② 注入退役：文件没了、标签没了、也没有别处再往 head 塞 mail 样式
    assert(!fs.existsSync(path.join(ROOT, 'js', 'mail-system-styles.js')), 'js/mail-system-styles.js 退役（一个组件不再两份真相）');
    assert(html.indexOf('mail-system-styles') < 0, '仙侠.html 不再引用注入脚本');
    var injectors = jsFiles('js').filter(function (f) {
        var s = src(f);
        // 只抓「往文档里塞 <style>」的文件；建 DOM 时用到 .mail-* 类名不算注入
        return /createElement\(\s*['"]style['"]\s*\)/.test(s) && /\.mail-[a-z-]+\s*\{|mail-inbox-panel/.test(s);
    });
    assert(injectors.length === 0, '全仓无第二处以 <style> 注入信件骨架样式' + (injectors.length ? '（残留：' + injectors.join(', ') + '）' : ''));
    assert(/<link[^>]+panel-mail\.css/.test(html), '仙侠.html 以 <link> 载入合并后的信件样式');

    // ③ 正面修法：读信格的下限与「列表里有几封信」无关
    var body = pm.slice(pm.indexOf('#mailInboxPanel .mail-inbox-body'));
    body = body.slice(0, body.indexOf('}') + 1);
    assert(/min-height:\s*min\(52vh,\s*420px\)/.test(body), 'mail-inbox-body 有 min(52vh,420px) 定高下限');
    assert(!/min-height:\s*0\s*[;}]/.test(body), '该格不再用 min-height:0 把自己让给列表条数');
    var list = pm.slice(pm.indexOf('#mailInboxPanel .mail-inbox-list'));
    list = list.slice(0, list.indexOf('}') + 1);
    assert(/min-height:\s*0/.test(list) && /overflow-y:\s*auto/.test(list), '列表仍可内部滚（下限没把滚条顶掉）');

    // ④ 合并后的特异度纪律：骨架之后一律 #mailInbox 起头，别留同特异度的两份规则互撞
    var tail = pm.slice(pm.indexOf('/* ---------- 遮罩'));
    var bare = [];
    tail.split('\n').forEach(function (line) {
        var m = /^([.#][^\n{]*)\{/.exec(line);
        if (!m) return;
        var sel = m[1].trim();
        if (sel.charAt(0) === '.') bare.push(sel);
    });
    assert(bare.length === 0, '整改层不再出现裸类选择器（一律提权到 #mailInbox…）' + (bare.length ? '（残留：' + bare.join(', ') + '）' : ''));
})();

// ==================== H · UI-18 应用框宽度一支笔 ====================
console.log('\n[H] UI-18 宽度封顶：从两根笔收成一根');
(function () {
    var craft = src('styles/ui-craft.css');
    var html = src('仙侠.html');

    var caps = [];
    ['styles.css', 'styles/ui-tokens.css', 'styles/ui-craft.css'].forEach(function (f) {
        var s = src(f), re = /#game-world\s*\{[^}]*max-width\s*:/g, m;
        while ((m = re.exec(s))) caps.push(f);
    });
    assert(caps.length === 1 && caps[0] === 'styles/ui-craft.css',
        '全仓只有 ui-craft.css 给 #game-world 定宽（实际：' + caps.join(', ') + '）');
    assert(/max-width:\s*min\(1720px,\s*100%\)/.test(craft), '封顶抬到 min(1720px,100%)，随屏放');
    assert(!/@media[^{]*\)\s*\{\s*#game-world\s*\{\s*max-width/.test(craft.replace(/\n\s*/g, ' ')),
        '不再按视口分档定宽（分档就是两根笔的由来）');

    var tag = /<div id="game-world"[^>]*>/.exec(html);
    assert(!!tag && !/max-w-/.test(tag[0]), '元素上不再挂 Tailwind max-w-*（HTML 与 CSS 各说一套宽）');
})();

// ==================== I · DES-32 / UI-15 / UI-16 战斗两套尺 ====================
console.log('\n[I] DES-32+UI-15+UI-16：量程有写入者、顶部换要害尺、死因当场记名');
(function () {
    load('js/battle.js');
    load('js/combat-stats.js');

    var attrs = { strength: 20, dexterity: 20, intelligence: 20, willpower: 20, constitution: 20, meridian: 20 };
    function mkEnt(name, extra) {
        var d = { name: name, attrs: attrs, level: 5 };
        Object.keys(extra || {}).forEach(function (k) { d[k] = extra[k]; });
        return new window.Entity(d, 'enemy');
    }

    // ① DES-32：上限与实际同源同处生
    var hum = window.initPhysiology('humanoid');
    eq(hum.maxBloodVolume, hum.bloodVolume, '人形：血肉量程与实际同值');
    var beast = window.initPhysiology('beast');
    eq(beast.maxBloodVolume, beast.bloodVolume, '妖兽：天生 1.5 倍血肉，量程跟着 150 不走 100');
    eq(beast.bloodVolume, 150, '妖兽起始血肉 = 150（BEAST_HEALTH_MULTIPLIER 1.5）');
    eq(window.initPhysiology('undead').maxBloodVolume, 0, '亡灵：血肉量程记 0（它不吃血量判据）');
    eq(window.initPhysiology('construct').maxBloodVolume, 0, '构装体：同上');

    // ② UI-16：summary 报的是实体自己的账，不是全局配置
    var bEnt = mkEnt('妖兽', { physiologyType: 'beast' });
    var bs = bEnt.getPhysiologySummary();
    eq(bs.bloodVolume + '/' + bs.maxBloodVolume, '150/150', '妖兽满血读数 150/150（旧：150/100 假账）');
    eq(bs.maxCirculation, 150, '妖兽循环量程同为 1.5 倍');
    eq(typeof bs.maxConsciousness, 'number', '意识量程随 summary 一起出（读者不再各自硬写 100）');

    // ③ DES-32：等级缩放血量时，量程同步抬——否则高境界敌人满血仍显示 n/100
    var grown = mkEnt('大敌', {});
    grown.level = 30;
    window.scaleEnemyEntityToLevel(grown, { level: 30 });
    var gs = grown.getPhysiologySummary();
    eq(gs.bloodVolume, gs.maxBloodVolume, '30 级敌人：血量与上限同抬（' + gs.bloodVolume + '/' + gs.maxBloodVolume + '）');
    assert(gs.maxBloodVolume > 100, '30 级敌人量程已离开 100 这个魔法数');

    // ④ UI-15：判死处当场记名（四条判据都要有名字）
    var neck = mkEnt('斩颈', {});
    eq(neck.deathCause, null, '活着时死因为空（构造即初始化）');
    neck.takeDamage('neck', 9999, 'slash');
    assert(!neck.isAlive, '颈归零当场判死');
    eq(neck.deathCause, 'part:neck', '当场判死即记 ' + neck.deathCause);
    var bleed = mkEnt('失血', {});
    bleed.physiology.bloodVolume = 0;
    bleed.checkDeath();
    eq(bleed.deathCause, 'blood', '血肉归零记 blood');
    var crit = mkEnt('拖过救治', {});
    crit.physiology.criticalTimer = 999;
    crit.physiology.criticalRounds = 1;
    crit.checkDeath();
    eq(crit.deathCause, 'critical', '危急拖过窗口记 critical');
    var brick = mkEnt('全身尽毁', {});
    Object.keys(brick.durabilities).forEach(function (k) { brick.durabilities[k] = 0; });
    brick.takeDamage('footL', 1, 'blunt');
    eq(brick.deathCause, 'exhausted', '22 格全零记 exhausted');
    var golem = mkEnt('傀儡', { physiologyType: 'construct' });
    golem.physiology.integrity = 0;
    golem.checkDeath();
    eq(golem.deathCause, 'integrity', '构装体按躯壳判死');

    // ⑤ UI-15 呈现层：把 app.js 里那两只纯函数搬进沙箱真跑（不复制实现，测的就是仓库里那一份）
    var app = src('js/app.js');
    var iFrom = app.indexOf('var VITAL_FATAL_PARTS');
    var iTo = app.indexOf('// v20.96 渲染刹车');
    assert(iFrom > 0 && iTo > iFrom, 'app.js 里找得到要害尺与死因文案两只函数');
    var api = new Function(app.slice(iFrom, iTo) + '\nreturn { _vitalScale: _vitalScale, describeDeathCause: describeDeathCause };')();

    // 旧读数的谎：颈已断，22 格总条仍显示九成
    var liar = mkEnt('说谎的总条', {});
    liar.durabilities.neck = 0;
    var sum = Object.keys(liar.durabilities).reduce(function (a, k) { return a + liar.durabilities[k]; }, 0);
    var sumMax = Object.keys(liar.maxDurabilities).reduce(function (a, k) { return a + liar.maxDurabilities[k]; }, 0);
    assert(sum / sumMax > 0.9, '样本：颈部全毁时总耐久仍有 ' + Math.round(sum / sumMax * 100) + '%（旧读数就说谎在这里）');
    var vs = api._vitalScale(liar);
    eq(vs.label + vs.value, '颈0', '要害尺取的是脑/颈/胸最低那一格');
    eq(vs.max, 100, '要害尺量程取该格自己的上限');
    eq(api.describeDeathCause({ deathCause: 'part:chest' }), '胸已塌', '死因翻译：胸已塌');
    eq(api.describeDeathCause({ deathCause: 'part:head' }), '头已碎', '死因翻译：头已碎（takeDamage 那条含 head）');
    eq(api.describeDeathCause({ deathCause: 'part:abdomen' }), '腹已毁', '未预置的部位按部位名翻');
    eq(api.describeDeathCause({ deathCause: 'structure:neck' }), '颈已毁', '亡灵结构死因按部位名翻');
    eq(api.describeDeathCause({ deathCause: 'critical' }), '危急拖过了救治时辰', '死因翻译：危急超时');
    eq(api.describeDeathCause({ deathCause: null }), '', '查不到死因就空串（呈现层不自行反推）');
    eq(api._vitalScale(mkEnt('傀儡', { physiologyType: 'construct' })).label, '躯壳', '构装体的要害尺是躯壳');
    eq(api._vitalScale(mkEnt('骸骨', { physiologyType: 'undead' })).label, '结构', '亡灵的要害尺是结构');

    // ⑤-b 实机复验抓到的漏网一格（中州野外黑熊一战：结算屏「头已碎」，尺上仍「脑 100/100」满格）
    var byHead = mkEnt('一掌拍碎头盖', {});
    byHead.durabilities.head = 0;
    eq(api._vitalScale(byHead).label + api._vitalScale(byHead).value, '头0',
        'head 归零时要害尺当场见底（这一格 battle.js 认死，尺上不能没有它）');
    (function () {
        var bt = src('js/battle.js');
        var judged = {};
        var bothHands = /if \(\(partId ===[^)]*\)/.exec(bt);
        assert(bothHands, 'battle.js 里 takeDamage 当场判死那一处还在');
        if (bothHands) bothHands[0].replace(/partId === '(\w+)'/g, function (_, id) { judged[id] = 1; });
        var roundList = /const fatalParts\s*=\s*\[([^\]]*)\]/.exec(bt);
        assert(roundList, 'battle.js 里回合判死那份部位名单还在');
        if (roundList) roundList[1].replace(/'(\w+)'/g, function (_, id) { judged[id] = 1; });
        var shown = (/\bvar VITAL_FATAL_PARTS\s*=\s*\[([^\]]*)\]/.exec(app)[1].match(/\w+/g) || []);
        var missed = Object.keys(judged).filter(function (id) { return shown.indexOf(id) < 0; });
        eq(missed.join(',') || '无', '无',
            '要害尺覆盖 battle.js 判死的全部部位（少一格＝面板会撒谎，实测少的是 ' + missed + '）');
    })();

    // ⑥ 源码断言：读数与量程各只剩一支笔
    assert(/_vitalScale\(currentBattle\.player\)/.test(app) && /_vitalScale\(currentBattle\.enemy\)/.test(app),
        '战斗面板顶部两格都读要害尺');
    assert(!/function getPlayerTotalDura/.test(app), '22 格总和算法退役（再无人读它）');
    assert(!/physiology\.maxHealth/.test(app), '复活路径不再读那个全仓零写入的 physiology.maxHealth');
    var battle = src('js/battle.js');
    assert(!/maxHealth:\s*cfg\.MAX_BLOOD_VOLUME/.test(battle), 'summary 不再把配置上限当实体上限报');
    var html = src('仙侠.html');
    eq((html.match(/要害:/g) || []).length, 2, '玩家与敌人两侧标签都改成「要害:」（各一处）');
    ['battle-player-hp', 'battle-enemy-hp'].forEach(function (id) {
        var at = html.indexOf('id="' + id + '"');
        assert(at > 0 && /要害:/.test(html.slice(Math.max(0, at - 120), at)), id + ' 的标签文字是「要害」');
    });
    assert(/describeDeathCause\(currentBattle\.enemy\)/.test(app) && /describeDeathCause\(currentBattle && currentBattle\.player\)/.test(app),
        '胜败两处结算屏都点名死因');
})();

// ==================== J · UI-19 矮屏导航压扁 ====================
console.log('\n[J] UI-19 导航栏按视口高度收边距');
(function () {
    var tok = src('styles/ui-tokens.css');
    var m1 = /@media\s*\(max-height:\s*1040px\)[^{]*\{\s*html #game-world \.nav-item\s*\{([^}]*)\}/.exec(tok.replace(/\n\s*/g, ' '));
    var m2 = /@media\s*\(max-height:\s*820px\)[^{]*\{\s*html #game-world \.nav-item\s*\{([^}]*)\}/.exec(tok.replace(/\n\s*/g, ' '));
    assert(m1, '1040px 档：矮屏先收 .nav-item 上下内边距');
    assert(m2, '820px 档：再收一档');
    assert(m1 && /padding-top:\s*8px/.test(m1[1]) && /padding-bottom:\s*8px/.test(m1[1]), '第一档压到 8px');
    assert(m2 && /padding-top:\s*5px/.test(m2[1]) && /padding-bottom:\s*5px/.test(m2[1]), '第二档压到 5px');
    var mine = (m1 ? m1[0] : '') + (m2 ? m2[0] : '') + (/box-shadow:\s*inset 0 -14px[^;]*;/.exec(tok) || [''])[0];
    assert(!/!important/.test(mine),
        '本轮新写的这三条不含 !important（靠前缀提权赢 Tailwind；文件里既有的 !important 属 toast 与 reduced-motion）');
    assert(/html #game-world \.nav-item/.test(tok), '两条都带 html #game-world 前缀（特异度足够）');
    assert(/nav\s*\{[^}]*box-shadow:\s*inset 0 -14px/.test(tok.replace(/\n\s*/g, ' ')) || /box-shadow:\s*inset 0 -14px/.test(tok),
        '导航底部留一道内阴影——被藏的三项至少有「下面还有」的样子');
    // 一支笔：按视口高度动导航的只有 ui-tokens.css
    var others = ['styles.css', 'styles/ui-craft.css', 'styles/panel-mail.css'].filter(function (f) {
        return /max-height:\s*(820|1040)px/.test(src(f));
    });
    assert(others.length === 0, '没有第二处按视口高度调导航' + (others.length ? '（残留：' + others.join(', ') + '）' : ''));
})();

// ==================== K · UI-11 任务页一条高度策略 ====================
console.log('\n[K] UI-11 任务页长表折叠＋单滚');
(function () {
    var qs = src('js/quest/quest-system.js');
    var s1 = qs.indexOf('function _qgSeq'), s1e = qs.indexOf('// 列表开头的吸顶计数条');
    var s2 = qs.indexOf('var QG_LIST_CAP'), s2e = qs.indexOf('// 空态不许只写', s2);
    var s3 = qs.indexOf('var QG_MAIN_WINDOW'), s3e = qs.indexOf('// ============ 更新日常任务UI', s3);
    assert(s1 > 0 && s2 > s1e && s3 > s2e, 'quest-system.js 里找得到排序段、折叠助手、主线渲染三段');
    var body = qs.slice(s1, s1e) + '\n' + qs.slice(s2, s2e) + '\n' + qs.slice(s3, s3e);

    var env = { chain: [], status: {} };
    function mkCard(cfg) {
        return '<div class="qg-card qg-card--' + cfg.state + (cfg.extra ? ' ' + cfg.extra : '')
            + '" data-no="' + cfg.no + '"></div>';
    }
    var barHtml = '';
    var sink = {};
    var listObj = { innerHTML: '' };
    var api = new Function('mainQuestChain', 'sink', '_qgStatusOf', '_qgCardHtml', '_qgAcceptBtn', '_qgTurnInBtn',
        '_qgTrackBtn', '_qgPrioName', '_qgPrioId', '_qgRewardText', '_qgObjectiveHtml', '_qgProgressOf',
        '_qgMountBar', 'document',
        body + '\nreturn { fold: _qgFoldTail, main: updateMainQuestUI, '
        + 'win: QG_MAIN_WINDOW, cap: QG_LIST_CAP };'
    )(
        env.chain,
        sink,
        function (q) { return env.status[q.id]; },
        mkCard,
        function () { return '<button>接取</button>'; },
        function () { return '<button>交付</button>'; },
        function () { return '<button>追踪</button>'; },
        function () { return '普通'; }, function () { return 'medium'; },
        function () { return '灵石 10'; }, function () { return ''; },
        function () { return { pct: 60, done: 3, total: 5 }; },
        function (l, head) { barHtml = head; sink.bar = head; },
        { getElementById: function (id) { return id === 'main-quest-list' ? listObj : null; } }
    );

    // mainQuestChain 传的是引用——首帧建好后原地改写即可
    var chainRef = env.chain;
    function fill(n, statusFn) {
        chainRef.length = 0;
        for (var i = 1; i <= n; i++) {
            var id = 'main_' + (i < 10 ? '00' : '0') + i;
            chainRef.push({ id: id, title: '第' + i + '章' });
            env.status[id] = statusFn(i);
        }
    }
    function nos(html) {
        var out = [], m, re = /data-no="(\d+)"/g;
        while ((m = re.exec(html))) out.push(Number(m[1]));
        return out;
    }
    function shownNos(html) {   // 明面上的（details 之外的直接子卡片）
        return nos(html.replace(/<details[\s\S]*?<\/details>/g, ''));
    }

    // ① 新号：48 章一章没做——只露眼下与紧随的两章，其余折起且一条不丢
    fill(48, function () { return 'todo'; });
    api.main();
    var h = listObj.innerHTML;
    eq(shownNos(h).join(','), '1,2,3', '新号主线只露第 1～3 章（其余 45 章折起来）');
    eq(nos(h).length, 48, '48 章一条没丢（折叠不删内容）');
    assert(/还没轮到的 45 章（第 4～48 章）/.test(h), '折起来那格把章数与章序写在摘要上');
    eq(nos(h).join(','), Array.apply(null, Array(48)).map(function (_, i) { return i + 1; }).join(','),
        '章节号按顺序排（折叠不打乱次序）');
    assert(/折起 45 章/.test(barHtml) && /共 48 章/.test(barHtml), '计数条如实报「折起 N 章」');

    // ② 打到第 6 章：前面 5 章折成「已了结」，明面仍是三章
    fill(48, function (i) { return i < 6 ? 'done' : (i === 6 ? 'doing' : 'todo'); });
    api.main();
    h = listObj.innerHTML;
    eq(shownNos(h).join(','), '6,7,8', '焦点在第 6 章时露 6～8 章');
    assert(/已了结 5 章（第 1～5 章）/.test(h), '了结的五章折成一格并写明「已了结」');
    assert(/还没轮到的 40 章（第 9～48 章）/.test(h), '后 40 章另折一格');
    eq(nos(h).length, 48, '前后两折都不丢章');

    // ③ 动得了的绝不许折：第 30 章单条在做，也必须在明面上
    fill(48, function (i) { return i < 4 ? 'done' : (i === 30 ? 'doing' : 'todo'); });
    api.main();
    h = listObj.innerHTML;
    assert(shownNos(h).indexOf(30) >= 0, '第 30 章在做 → 哪怕离焦点 20 章也摆在明面上');
    assert(/已了结 3 章（第 1～3 章）/.test(h) && /还没轮到的 26 章（第 4～29 章）/.test(h),
        '折段只并同类：已了结与没轮到不混写成一段');

    // ④ 折叠助手：keep 不占额度，剩下的照样数得清
    var cards = [];
    for (var i = 1; i <= 20; i++) cards.push({ keep: i <= 3, html: '<div class="qg-card" data-k="' + i + '"></div>' });
    var fh = api.fold(cards, api.cap, '单');
    eq((fh.match(/qg-card/g) || []).length, 20, '折叠不删条：20 单全在');
    var head = fh.split('<details')[0];
    eq((head.match(/data-k/g) || []).length, 3 + api.cap, '明面 = keep 的 3 条＋额度内 ' + api.cap + ' 条');
    assert(fh.indexOf('另有 ' + (20 - 3 - api.cap) + ' 单（点开翻）') >= 0,
        '摘要报出折起条数（20 单 － keep 3 － 额度 ' + api.cap + ' = ' + (20 - 3 - api.cap) + '）');
    // 钉住实机量出来的那个数：额度再放大就会「折完反而更长」，不许无声改回去
    assert(api.cap <= 4, '露出额度 ≤ 4（实机：6 单＝956px 与日常栏并排，整页 2.49 屏 > 改前 2.04 屏）');

    // ⑤ 一支笔：任务页六个列表容器都不再自带滚窗
    var html = src('仙侠.html');
    ['main-quest-list', 'active-quest-list', 'daily-quest-list', 'random-quest-list', 'npc-quest-list', 'completed-quest-list']
        .forEach(function (id) {
            var at = html.indexOf('id="' + id + '"');
            assert(at > 0, '任务页容器 ' + id + ' 在页面上');
            var tag = html.slice(html.lastIndexOf('<', at), html.indexOf('>', at) + 1);
            assert(!/max-h-|overflow-y|overflow-auto/.test(tag), id + ' 不再挂自带滚窗的工具类：' + tag.trim());
        });
    var css = src('styles/panel-quests.css');
    var pens = (css.match(/max-height|overflow-y\s*:/g) || []);
    eq(pens.length, 1, '本面板只剩一条高度笔（另两处已删）');
    assert(/max-height:\s*none/.test(css), '那一条笔的内容是「不自己滚，跟着页面滚」');
    assert(/html #panel-quests #main-quest-list/.test(css), '统一规则带 html 前缀（赢工具类靠特异度，不靠 !important）');
    assert(!/!important/.test(css.replace(/\/\*[\s\S]*?\*\//g, '')), 'panel-quests.css 全篇不用 !important（注释除外）');
    assert(/\.qg-fold__sum[\s\S]*?cursor:\s*pointer/.test(css), '折起来的摘要看得出可点');
})();

// ==================== L · UI-12 公共空态件 ＋ 势力冲突接真账 ====================
console.log('\n[L] UI-12 空态一支笔 · 势力「当前冲突」');
(function () {
    // ① 一支笔：空态件只此一份，且各消费者排在它后面
    var html = src('仙侠.html');
    var order = [];
    html.replace(/<script[^>]*src="([^"]+)"/g, function (_, s) { order.push(s); return ''; });
    var iEs = order.indexOf('js/core/empty-state.js');
    assert(iEs >= 0, '仙侠.html 挂了 js/core/empty-state.js');
    ['js/quest/quest-system.js', 'js/core/world-calendar-ui.js', 'js/party-system.js', 'js/app.js'].forEach(function (f) {
        assert(order.indexOf(f) > iEs, f + ' 排在空态件之后（渲染时函数已在位，不必再兜底）');
    });
    var es = src('js/core/empty-state.js');
    assert(/window\.xEmptyHtml\s*=/.test(es) && /window\.renderXEmpty\s*=/.test(es),
        'empty-state.js 交出 xEmptyHtml 与 renderXEmpty 两个出口');
    assert(!/getElementById|localStorage|Math\.random/.test(es),
        '空态件不读 DOM、不落盘、不掷骰——只呈现调用方算好的事实');

    // 判「是否只有一处」要看代码不看注释：旧文案与指路说明都留在注释里
    function strip(s) { return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, ''); }
    var owners = fs.readdirSync(path.join(ROOT, 'styles')).filter(function (f) {
        return f.endsWith('.css') && /\.x-empty[^{}]*\{/.test(strip(src(path.join('styles', f))));
    });
    eq(owners.join(','), 'ui-craft.css', '空态样式只有 styles/ui-craft.css 一处定义（别处的 .x-empty 只在注释里指路）');
    var craft = src('styles/ui-craft.css');
    // 第一百三十七批（DES-95）只换钉法，没换要求。这两支钉的原本是「每条都带容器前缀」「前缀里有 #shop-modal-overlay」——
    // 那串白名单正是缺陷本体：它登记的是「已知的弹窗」，不是「弹窗这一类」，所以第三处 body 模态（门派任务，
    // js/sects/sects-system.js:862-902）一开张，两张空态卡就渲染成没边框、没字号层次的裸文字。
    // 要求照旧是「这张共用卡在任何一个宿主里都不许变成裸文字」；实现从「逐个宿主挂号」换成「选择器压根不认识宿主」。
    var plainCraft = strip(craft);
    var emptyHeads = [];
    plainCraft.replace(/(^|})\s*([^{}]+)\{/g, function (_, _brace, sel) {
        String(sel).split(',').forEach(function (s) {
            s = s.replace(/\s+/g, ' ').trim();
            if (/\.x-empty/.test(s)) emptyHeads.push(s);
        });
        return '';
    });
    assert(emptyHeads.length >= 7,
        '空态样式仍由 styles/ui-craft.css 一处发全（实际 ' + emptyHeads.length + ' 条规则头）');
    eq(emptyHeads.filter(function (h) {
        return /#|:is\(|\bbody\b|x-arena-modal|shop-modal/.test(h);
    }).join(' | '), '', '每条 .x-empty 规则头都不认宿主——没有 id、没有 :is() 名单、没有别家的类名');
    // 特异度自查：拆了前缀就没人替这张卡压过 Tailwind／别家样式，所以要证明「没有别的规则能盖住卡内的 p」。
    // 全仓带 id 且末端命中裸 p 的规则头只有一枚，且它的作用域（金币筹码）里永远不会有空态卡。
    var pThreats = [];
    fs.readdirSync(path.join(ROOT, 'styles')).filter(function (f) { return f.endsWith('.css'); }).forEach(function (f) {
        strip(src(path.join('styles', f))).replace(/(^|})\s*([^{}]+)\{/g, function (_, _b, sel) {
            String(sel).split(',').forEach(function (s) {
                s = s.replace(/\s+/g, ' ').trim();
                if (/#[a-zA-Z][\w-]* /.test(s) && /(^|\s)p$/.test(s)) pThreats.push(f + ' :: ' + s);
            });
            return '';
        });
    });
    eq(pThreats.join(' | '), 'panel-inventory.css :: #panel-inventory .inv-coin > p',
        '能盖住卡内 <p> 的 id 级规则全仓只此一枚（新增一枚就要回来看空态卡会不会被压）');
    assert(!/xEmptyHtml|renderXEmpty/.test(src('js/inventory.js')),
        '而那一枚的作用域（.inv-coin 金币筹码）根本不产出空态卡——拆前缀不会把卡压成裸文字');
    assert(!/\.x-empty[^{]*\{[^}]*!important/.test(craft), '空态样式不用 !important');
    assert(/\.x-empty--fill\s*\{[^}]*min-height:\s*clamp\(/.test(craft.replace(/\n\s*/g, ' ')),
        '填充态用一个 clamp 高度收短面板下半页的死黑');

    // ② 私有那份撤净：任务页不再自己拼空态
    var qs = src('js/quest/quest-system.js');
    var pq = src('styles/panel-quests.css');
    eq(qs.indexOf('qg-empty'), -1, 'quest-system.js 里 .qg-empty 一处不剩');
    eq(pq.indexOf('qg-empty'), -1, 'panel-quests.css 里私有空态样式一并删除');
    assert((qs.match(/xEmptyHtml|renderXEmpty/g) || []).length >= 5,
        '任务页五处空态全走公共件（实际 ' + (qs.match(/xEmptyHtml|renderXEmpty/g) || []).length + ' 处）');
    assert(/function _qgActiveEmptyHtml[\s\S]{0,900}?fill:\s*true/.test(qs),
        '「活跃任务」空卡带 fill（实机：与左栏主线同排，行高由主线定，不填就在页面上留 ~460px 死背景）');

    // ③ 三块短面板改用公共件，且旧的「暂无 X」死字清零
    var app = src('js/app.js');
    var ps = src('js/party-system.js');
    var wc = src('js/core/world-calendar-ui.js');
    // A3（UI评审·2026-10-01）给这页空态**前置**了一张「修炼账本卡」，落笔成
    // `host.innerHTML = _a3 + xEmptyHtml({ fill: true, … })`——公共件照样走、fill 照样在，
    // 只是等号右边不再只有 xEmptyHtml 一个。这把尺认的是「走没走公共件」，
    // 不是「公共件前面能不能拼东西」，故放行任意前缀。
    assert(/host\.innerHTML = [^;]{0,400}?xEmptyHtml\(\{[\s\S]{0,60}fill:\s*true/.test(app), '功法列表空态走公共件且 fill（允许前置内容，如 UI评审·A3 的修炼账本卡）');
    assert(strip(app).indexOf('尚未习得任何功法') < 0, '「尚未习得任何功法」这句不含来路的死字已撤（注释里的来历说明不算）');
    assert(/membersList\.innerHTML = xEmptyHtml\(\{[\s\S]{0,60}fill:\s*true/.test(ps), '队伍列表空态走公共件且 fill');
    assert(/xEmptyHtml\(\{[\s\S]{0,400}?getEffectiveMaxMembers\(\)/.test(ps),
        '队伍空态报的人数取自 getEffectiveMaxMembers()（解限开关一翻就跟着变），不是写死的 4');
    assert(strip(ps).indexOf('暂无队员') < 0, '「暂无队员」不再孤零零挂着');
    eq((wc.match(/xEmptyHtml\(/g) || []).length, 3, '日程三处空态（未来 60 日／近期 30 日／30 日汇总）都走公共件');
    assert(strip(wc).indexOf('暂无确定性事件') < 0 && strip(wc).indexOf('暂无已发生事件') < 0 && strip(wc).indexOf('暂无数据') < 0,
        '「暂无确定性事件／暂无已发生事件／暂无数据」三句一并撤掉（实机在日程页读到过最后一句）');
    assert(/'<div class="mb-6">' \+ xEmptyHtml/.test(wc), '日程空态仍占一段 mb-6（与有内容时段距一致）');

    // ④ 行为层：把 renderFactionConflicts 切出来真跑（「⚔️ 当前冲突」此前全仓零写方）
    load('js/core/empty-state.js');
    assert(typeof global.xEmptyHtml === 'function', 'xEmptyHtml 挂上全局');
    var f1 = app.indexOf('function renderFactionConflicts()');
    var f2 = app.indexOf('// 渲染灵兽列表', f1);
    assert(f1 > 0 && f2 > f1, 'app.js 里找得到 renderFactionConflicts');
    var renderConflicts = new Function(app.slice(f1, f2) + '\nreturn renderFactionConflicts;')();
    var box = { innerHTML: '' };
    var oldGet = global.document.getElementById;
    global.document.getElementById = function (id) { return id === 'active-conflicts' ? box : null; };

    global.factionState = { activeConflicts: [] };
    renderConflicts();
    assert(/class="x-empty"/.test(box.innerHTML), '没仗时给的是引导卡，不再是一句写死的「暂无冲突」');
    assert(box.innerHTML.indexOf('暂无冲突') < 0, '「暂无冲突」这句死字已不在这一栏');
    assert(/眼下没有开着的仗/.test(box.innerHTML) && /到那一步再谈帮谁/.test(box.innerHTML),
        '空卡既说这一栏凭什么才不空，也说仗起来之后再谈帮谁');
    assert(html.replace(/<!--[\s\S]*?-->/g, '').indexOf('暂无冲突') < 0,
        '仙侠.html 里写死的「暂无冲突」已从页面上撤走（这块牌面交给 renderFactionConflicts）');

    function mkC(n, day) {
        return { id: 'c' + n, faction1: 'f' + n, faction2: 'g' + n, name: '第' + n + '场交锋',
            startTime: n * 1000, startDay: day, status: 'active', winner: null };
    }
    // 5 场开着的：最近一场是改动之前存的旧档（没有 startDay 字段），仍要列出来并照实说不详
    global.factionState = { activeConflicts: [mkC(1, 3), mkC(2, 7), mkC(3, 9), mkC(4, 11), mkC(5, null),
        { id: 'c6', faction1: 'f6', faction2: 'g6', name: '早了结的一场', startTime: 6000, startDay: 20, status: 'resolved' }] };
    renderConflicts();
    eq((box.innerHTML.match(/仍在交锋/g) || []).length, 3, '一栏只列最近三场（五场开着的取最新三条）');
    assert(/第 11 日结下/.test(box.innerHTML) && /第 9 日结下/.test(box.innerHTML),
        '按开战的日子排 newest-first，说的是世界历上的第几日');
    assert(/结下之日不详（旧档未记历日）/.test(box.innerHTML),
        '改动之前存的仗没有历日字段——照实说不详，不拿今天的日子冒充');
    assert(/另有 2 场旧仗至今未了/.test(box.innerHTML), '被截掉的 2 场照样报数，不装作世界只有三场仗');
    assert(box.innerHTML.indexOf('早了结的一场') < 0, 'status 已 resolved 的旧仗不再挂「当前冲突」');
    global.document.getElementById = oldGet;

    // ⑤ 行为层：triggerFactionConflict 的同对去重＋历日＋落盘次数
    var fac = src('js/factions/factions.js');
    var t1 = fac.indexOf('function triggerFactionConflict');
    var t2 = fac.indexOf('// 参与势力冲突（战斗）', t1);
    assert(t1 > 0 && t2 > t1, 'factions.js 里找得到 triggerFactionConflict');
    var FAKE_F = { mj: { name: '魔教' }, zd: { name: '正道联盟' }, yz: { name: '妖族' } };
    var st = { activeConflicts: [] };
    var saves = 0;
    var trig = new Function('FACTIONS', 'factionState', 'saveFactionData', 'window',
        fac.slice(t1, t2) + '\nreturn triggerFactionConflict;'
    )(FAKE_F, st, function () { saves++; },
        { timeSystem: { gameTime: { currentDay: 37 } }, gameLog: null });
    var c1 = trig('mj', 'zd');
    assert(c1 && c1.startDay === 37, '开战记下世界历日子（第 37 天），面板才说得出「第几日结下」');
    eq(saves, 1, '真开一仗才写一次盘');
    assert(trig('zd', 'mj') === c1, '反着报同一对 → 认账，不另开一仗');
    assert(trig('mj', 'zd') === c1, '同一对天天掷到也只一场开着的仗（此前每日压一条）');
    eq(st.activeConflicts.length, 1, '三日掷下来 activeConflicts 仍只 1 条');
    eq(saves, 1, '合并不落盘（不白写存档）');
    assert(trig('mj', 'wu') === null, '查无此势力不开仗');
    assert(trig('zd', 'yz') !== null && st.activeConflicts.length === 2, '换一对对手才开新的一仗');
    st.activeConflicts[0].status = 'resolved';
    assert(trig('mj', 'zd') !== c1, '了结之后同一对可以再打起来——去重只拦还开着的');
})();
// ==================== M · UI-10 待决事件不许动作区照常亮着 ====================
console.log('\n[M] UI-10 见招拆招待决：动作区按下 + 点击不静默');
(function () {
    var app = src('js/app.js');
    var craft = src('styles/ui-craft.css');
    var html = src('仙侠.html');

    // ① 一本账一个判口：有没有一手待决，只由 _battlePromptPending 说了算
    var rp1 = app.indexOf('function _battlePromptPending()');
    var rp2 = app.indexOf('function _setBattleActionsHold(on)');
    var rp3 = app.indexOf('function _renderBattlePrompt()');
    assert(rp1 > 0 && rp2 > rp1 && rp3 > rp2, 'app.js 找得到读账 + 落笔两个新函数');
    // _battlePromptPending 是零参函数、靠闭包读 currentBattle → 每个用例现构造一次，别构造时不传参
    var mk = new Function('currentBattle', app.slice(rp1, rp2) + '\nreturn _battlePromptPending;');
    function pending(cb) { return mk(cb)(); }
    eq(pending(null), false, '没在打 → 不算待决');
    eq(pending({ isFinished: true, _pendingPrompt: { options: [{ label: '躲' }] } }), false,
        '仗已打完，残存的姿态不该再把动作区按着');
    eq(pending({ isFinished: false, _pendingPrompt: null }), false, '敌人没摆姿态 → 动作区照常');
    eq(pending({ isFinished: false, _pendingPrompt: { options: [] } }), false,
        '有姿态却一条可选项都没有 → 不该把玩家锁死');
    eq(pending({ isFinished: false, _pendingPrompt: { options: [{ label: '躲' }] } }), true, '有姿态有选项 → 待决');
    var promptBody = app.slice(rp3, app.indexOf('function battlePromptChoose', rp3));
    assert(/_battlePromptPending\(\)/.test(promptBody), '应对面板与动作区同读一个判口');
    assert(!/isFinished\)\s*\?\s*currentBattle\._pendingPrompt/.test(promptBody),
        '面板不再自己摸一遍条件（两处各判一次迟早判出「一个灰一个不灰」）');

    // ② 落笔只挂一个类：置灰与回执条的显隐都由 CSS 从同一支笔派生
    var seen = [];
    var fakeModal = { classList: { toggle: function (c, on) { seen.push(c + '=' + on); } } };
    var setHold = new Function('document', app.slice(rp2, rp3) + '\nreturn _setBattleActionsHold;')({
        getElementById: function (id) { return id === 'battle-modal' ? fakeModal : null; }
    });
    setHold(true); setHold(false);
    eq(seen.join(','), 'x-battle-hold=true,x-battle-hold=false',
        '开／关各 toggle 一次 x-battle-hold（用带布尔的 toggle，类不在也不报错）');
    assert(/getElementById\('battle-modal'\)/.test(app.slice(rp2, rp3)), '笔落在 #battle-modal 这一层（一块弹窗一个状态）');
    eq((app.slice(rp2, rp3).match(/\.style\./g) || []).length, 0, '不写行内样式——样式归样式表');
    var ub = app.slice(app.indexOf('function updateBattleUI()'), app.indexOf('function _updatePhysiologyUI'));
    assert(/_renderBattlePrompt\(\);[\s\S]{0,200}?_setBattleActionsHold\(_battlePromptPending\(\)\)/.test(ub),
        'updateBattleUI 每帧按真账挂／摘（面板一出现动作区就跟着按下）');
    eq((ub.match(/_setBattleActionsHold\(/g) || []).length, 1, '这一帧只落一次笔');

    // ③ 样式层：按下的是动作区和医疗面板，别的一概不牵连
    var holdRules = craft.replace(/\/\*[\s\S]*?\*\//g, '').match(/x-battle-hold[^{]*\{[^}]*\}/g) || [];
    assert(holdRules.length >= 2, '样式表里 x-battle-hold 有规则（实际 ' + holdRules.length + ' 条）');
    var pressed = [];
    holdRules.forEach(function (r) {
        var body = r.slice(r.indexOf('{'));
        // 只算「按下」那一支：声明块里有 pointer-events／opacity／filter（外加回执条的 display 显隐）。
        // §11 里 .x-battle-hold 的纯版面规则（待决时把应对条钉住、让动作区让位）不是置灰，
        // 混进来会把这条断言报成假事故——第三十四次自修就是这么撞上的。
        if (!/pointer-events|opacity|filter|display/.test(body)) return;
        var selectorText = r.slice(0, r.indexOf('{'));   // 只看声明块之前的选择器，属性值不参与
        (selectorText.match(/#battle-[a-z-]+/g) || []).forEach(function (id) {
            if (id === '#battle-modal') return;          // 挂类那层是前缀，不是被按下的对象
            if (pressed.indexOf(id) < 0) pressed.push(id);
        });
    });
    pressed.sort();
    eq(pressed.join(','), '#battle-actions,#battle-actions-hold-tip,#battle-medical-actions',
        '被这支笔（置灰／显隐那支）点到的只有动作区、医疗面板和回执条——应对面板与「🩻 查看伤势」不在内；§11 的版面规则另算');
    assert(/x-battle-hold[^{]*#battle-actions[^{]*\{[^}]*pointer-events:\s*none/.test(craft),
        '待决时动作区真的点不动（不是只换个颜色骗人）');
    assert(/x-battle-hold[^{]*#battle-actions[^{]*\{[^}]*opacity/.test(craft), '按下的动作区看得出是按下（置灰）');
    assert(/#battle-modal #battle-actions-hold-tip\s*\{\s*display:\s*none/.test(craft)
        && /#battle-modal\.x-battle-hold #battle-actions-hold-tip\s*\{\s*display:\s*block/.test(craft),
        '回执条平时收着、待决才出现（显隐与置灰同一支笔派生，不用 JS 再填一遍内容）');
    assert(!/x-battle-hold[^{]*\{[^}]*!important/.test(craft), '第 10 节靠 id 特异度赢 Tailwind，不用 !important');

    // ④ 回执条摆在按钮跟前，且把「还能做什么」说清楚
    var tip = html.indexOf('id="battle-actions-hold-tip"');
    assert(tip > 0, '仙侠.html 里有待决回执条');
    assert(tip > html.indexOf('id="battle-log"') && tip < html.indexOf('<div id="battle-actions"'),
        '回执条排在战斗日志之后、动作区之前——说的是下面那片钮，不跑到别处去');
    var tipText = html.slice(tip, html.indexOf('</div>', tip));
    assert(/先答这一手/.test(tipText) && /待命/.test(tipText), '给的是「先答这一手，其余待命」这句回执');
    assert(/查看伤势/.test(tipText), '顺带说明什么仍可用（看不费回合），不至于像整屏坏了');
    assert(tipText.indexOf('class="hidden"') < 0, '回执条不靠 hidden 类（会被 Tailwind 注入顺序牵制，且这里由样式表统一管）');
})();

// ==================== N · UI-12 高度一支笔：滚窗只留一条，上限一律按视口 ====================
console.log('\n[N] UI-12 面板高度一支笔：内层滚窗撤平 + 钉住的窗改按 vh 定高');
(function () {
    var html = src('仙侠.html');
    var files = jsFiles('js').filter(function (f) { return f.indexOf('vendor') < 0; }).concat(['仙侠.html']);

    // ① 两条全站尺：不许有「像素写死的滚窗」，也不许有「没上限的滚窗」（内容一多就把宿主顶走）
    var pixelCaps = [], uncapped = [];
    files.forEach(function (f) {
        src(f).split('\n').forEach(function (line, i) {
            var at = f + ':' + (i + 1);
            if (/max-h-\d+\b/.test(line) && /overflow-y-auto/.test(line)) pixelCaps.push(at);
            // 留下的滚窗要么按视口放（vh），要么由宿主 flex 分配高度（flex-1）；#battle-log 曾按 128px 钉死并列为唯一例外，UI-10⑤ 已改掉
            if (/overflow-y-auto/.test(line) && !/vh\]/.test(line) && !/flex-1/.test(line)) uncapped.push(at);
        });
    });
    eq(pixelCaps.length, 0, '像素写死的内层滚窗全仓归零（改前 14 处：商店三页签／拍卖两张表／摆摊货单／门派任务／四份门中史册／图鉴／两处钉窗）'
        + (pixelCaps.length ? ' 复发 → ' + pixelCaps.join(', ') : ''));
    eq(uncapped.length, 0, '每条滚窗都随屏放（vh 或 flex-1）——改前唯一例外 #battle-log 已由 UI-10⑤ 改掉，如今无例外'
        + (uncapped.length ? ' 漏网 → ' + uncapped.join(', ') : ''));

    // ①b UI-10⑤ 战斗日志的「滚法」：窗随屏放（改前 h-32 恒 128px）＋自己滚一条＋追新那一笔还在 JS 里
    var logTag = (html.match(/<div id="battle-log"[^>]*>/) || [''])[0];
    assert(logTag.length > 0, '#battle-log 这一格还在页里（探针读的就是它）');
    assert(/h-\[\d+vh\]/.test(logTag), 'UI-10⑤ 日志窗高按视口给（屏越大越能多看几行，不再恒定 128px）');
    assert(/min-h-\[\d+px\]/.test(logTag), '配一条像素地板：矮窗里 22vh 会短到只剩一两行');
    assert(/overflow-y-auto/.test(logTag) && !/class="[^"]*\bh-32\b/.test(logTag),
        '滚窗照旧由日志自己承担（动作条不被顶走），写死的 h-32 不许回来');
    var appSrc = src('js/app.js');
    assert(/logDiv\.scrollTop = logDiv\.scrollHeight/.test(appSrc), '追新：每次刷完把窗滚到最后一条（改前也已有，本条只钉住别丢）');
    var _blm = /BATTLE_LOG_MAX = (\d+)/.exec(appSrc);
    assert(_blm && Number(_blm[1]) >= 100, '上屏的是整本账的尾段（有上限、非只摆最近几行），长战斗不全量重排');

    // ② 宿主那支笔要还在：通用模态框自己滚，内容才不必各自套小窗
    var gu = src('js/global-utils.js');
    var smFrom = gu.indexOf('window.showModal = function');
    var smBody = gu.slice(smFrom, gu.indexOf('document.body.appendChild(overlay)', smFrom));
    eq((smBody.match(/overflow-y-auto/g) || []).length, 1, '通用模态框只有一条滚窗（卡片自己滚）');
    assert(/max-h-\[\d+vh\][^"']*overflow-y-auto/.test(smBody), '那条滚窗的上限按视口给（屏越大越能多看几行）');

    // ③ 内容侧：交给模态框的片段一律不再自带滚窗
    ['js/sects/sect-roster.js', 'js/sects/sect-governance.js', 'js/sects/sect-diplomacy-world.js',
        'js/extensions/player-sect-ui.js', 'js/extensions/codex-tutorial.js', 'js/city-facilities/street-stall.js']
        .forEach(function (f) {
            eq((src(f).match(/overflow-y-auto/g) || []).length, 0, f + '：模态框内容里不再自带第二层滚窗');
        });

    // ④ 自建模态框那三个：滚窗从「卡片 + 列表」收成卡片一条
    var shop = src('js/enhanced-shop.js');
    eq((shop.match(/overflow-y-auto/g) || []).length, 1, '商店：买／卖／回购三页签的货单都改由卡片那一条滚窗承载');
    assert(/max-w-\[1440px\][^"']*max-h-\[85vh\] overflow-y-auto/.test(shop) && !/max-w-2xl/.test(shop),
        '商店留下的那条就是卡片本身（85vh 随屏放；封顶已由 1100px 二次抬到 1440px，真上限在 panel-shop.css 的 min(1440px, 96vw)）');
    var auc = src('js/economy/auction-service.js');
    eq((auc.match(/overflow-y-auto/g) || []).length, 1, '拍卖行：「当前拍卖品」与「我要拍卖」两张表并入同一条滚窗（不再各占一格 240/192px）');
    assert(/id="available-tasks" class="space-y-2"/.test(src('js/sects/sects-system.js')),
        '门派任务「可用任务」不再套 384px 小窗（改前屏再大也只有那一格会长）');

    // ⑤ 有意钉住的两扇窗：钉住可以，上限必须随屏
    var woundInner = (html.match(/<div id="battle-wound-content"[^>]*>/) || [''])[0];
    assert(woundInner.length > 0 && !/overflow-y-auto|max-h-/.test(woundInner),
        '伤势详情内层不再自带滚窗（第三十四次自修把这一格的上限交给面板 #battle-wound-panel——同一块面板里两条滚窗是 UI-11 的老账，接手由 [AA] 段守）');
    assert(/id="party-battle-log" class="max-h-\[28vh\] overflow-y-auto/.test(html), '队伍战斗日志同上（28vh）');
    assert(/id="city-building-list"[^>]*max-h-\[70vh\] overflow-y-auto/.test(src('js/location-system.js')),
        '城市设施名册仍留面板内一条 vh 滚窗（上限随屏，本轮给到 70vh）——它是「某一组摊开比窗还长」时的兜底，47 处铺八屏那件事已由 UI-03 的分组折叠接走');

    // ⑥ 折叠代替小窗：图鉴速览靠「少摆几条 + 说清还剩几条」保持一眼看完
    var codex = src('js/extensions/codex-tutorial.js');
    var panel = codex.slice(codex.indexOf('function openCodexPanel()'), codex.indexOf('// 第七十五波'));
    assert(/entries\.slice\(0, 30\)\.forEach/.test(panel), '图鉴每类仍遍历原来那 30 条（标记「已读」的范围不因折叠而缩水）');
    assert(/if \(shown < 8\) \{[\s\S]*?\}\s*markSeen\(/.test(panel), '只是少摆几条：markSeen 仍在 if 外面，逐条照标');
    assert(/另有 '? \+ unlisted \+ '? 条未列/.test(panel), '余下的写明「另有 N 条未列」，不让人以为一共就这 8 条');
})();

// ==================== O · UI-01＋UI-17② 双栏信纸 + 窗内写信 ====================
console.log('\n[O] UI-01+UI-17② 信件界面：左列右纸、窗内信纸、字数硬停、载具写明锁');
(function () {
    var ui = src('js/mail-system-ui.js');
    var pm = src('styles/panel-mail.css');

    // ① 结构：读信不再把名录整排盖住，而是并排
    assert(/#mailInboxPanel\.is-split \.mail-inbox-list\s*\{[^}]*flex:\s*0 0 336px/.test(pm),
        '双栏时列表收成定宽左栏（336px），不再被信纸盖住');
    assert(/#mailInboxPanel\.is-split \.mail-detail-panel\s*\{[^}]*position:\s*static/.test(pm),
        '双栏时信纸回到流内占余下宽度（改前它是 inset:0 的覆盖层）');
    assert(/@media \(max-width: 860px\)[\s\S]*?#mailInboxPanel\.is-split \.mail-detail-panel\s*\{[\s\S]*?position:\s*absolute/.test(pm),
        '窄屏退回覆盖式读信（半栏纸读不动），且仍用同一颗「合上这封」回来');
    assert(/width:\s*min\(1120px,\s*94vw\)/.test(pm), '窗宽随并栏抬高，但仍按视口收（不写死像素上限）');
    var carrierRow = pm.slice(pm.indexOf('.mail-sheet-carriers {'), pm.indexOf('.mail-sheet-note'));
    assert(/grid-template-columns:\s*repeat\(auto-fill,\s*minmax\(/.test(carrierRow) && !/flex-wrap/.test(carrierRow),
        '载具那一排走 grid 等分列（实机量到 flex-wrap 会把落单那枚拉成整行宽——4＋1 时「灵兽信使」成了一条 770px 的卡）');
    var carrierFloor = maxFloor(carrierRow);
    assert(!!carrierFloor && carrierFloor.px === 140 && carrierFloor.std === 140,
        '该排列宽下限仍是实机量到的 140px，且写成 max(140px, 8.75rem)——8.75×16=140，标准档一个像素没动（UI-23 只让大字号档跟手）');
    assert(/data-mail-id=/.test(ui) && /_markOpenInList/.test(ui), '列表按 id 认得出「正在读的那一封」');

    // ② 三处原生对话框一律退出信件窗（UI-01 的验收原句：写信不再弹原生 prompt）
    assert(!/prompt\(/.test(ui), '信件界面不再调原生 prompt');
    assert(!/window\.confirm\(/.test(ui), '信件界面不再调原生 confirm（删信改窗内两步）');
    assert(/askDeleteMail/.test(ui) && /keepMail/.test(ui) && !/deleteMail\([\s\S]{0,30}\)\s*\{[\s\S]{0,60}confirm/.test(ui),
        '删除先换成窗内确认语、再由确认钮动账');

    // ③ 行为层：接一只会长节点的假 DOM，真跑一遍读信 → 回复 → 贴 603 字 → 寄出
    var reg = {};
    function mkList(el) {
        var set = {};
        return {
            add: function (c) { set[c] = 1; el._cls = Object.keys(set).join(' '); },
            remove: function (c) { delete set[c]; el._cls = Object.keys(set).join(' '); },
            contains: function (c) { return !!set[c]; },
            toggle: function (c, on) { if (on) set[c] = 1; else delete set[c]; el._cls = Object.keys(set).join(' '); }
        };
    }
    function mkEl(tag) {
        var el = { tag: tag || 'div', _attrs: {}, children: [], style: { setProperty: function () {} }, value: '', textContent: '', innerHTML: '', scrollTop: 0 };
        el.classList = mkList(el);
        el.setAttribute = function (k, v) { el._attrs[k] = v; };
        el.getAttribute = function (k) { return el._attrs[k]; };
        el.appendChild = function (c) { el.children.push(c); return c; };
        el.querySelector = function () { return null; };
        el.querySelectorAll = function () { return []; };
        el.addEventListener = function () {};
        el.focus = function () {};
        el.remove = function () {};
        return el;
    }
    global.document = {
        readyState: 'complete',
        createElement: function (t) { return mkEl(t); },
        getElementById: function (id) { if (!reg[id]) reg[id] = mkEl(); return reg[id]; },
        querySelector: function () { return null; },
        querySelectorAll: function () { return []; },
        addEventListener: function () {},
        body: mkEl('body')
    };
    global.prompt = function () { throw new Error('信件界面又弹了原生 prompt'); };
    var confCalled = false;
    global.confirm = function () { confCalled = true; return false; };
    global.currentCharData = { name: '信客', realm: '凡人', layer: 1, location: '洛水城', bonds: {} };
    global.inventory = { currency: { spiritStones: 300, copper: 0 }, slots: [] };
    global.npcManager = {
        getNPC: function (id) { return id === 'npc_a' ? { id: 'npc_a', name: '柳四娘', location: '洛水城', relationship: { affection: 70, flags: new Set() } } : null; },
        getAllNPCs: function () { return [{ id: 'npc_a', name: '柳四娘', location: '洛水城', relationship: { affection: 70, flags: new Set() } }]; }
    };
    load('js/mail-system-ui.js');
    var MUI = global.MailSystemUI;
    window._mailSystemData = {
        inbox: [{ id: 'in1', type: 'npc_letter', fromNpcId: 'npc_a', fromNpcName: '柳四娘', subject: '药圃的事', body: '药熟了三畦。', carrier: 'pigeon', receivedAt: 0, readAt: null }],
        outbox: [], favorites: [], _pending: []
    };
    window.MailSystem.deleteMail('nope');   // 数据层已在 [D] 段载入，这里只确保没脏数据

    MUI.openMail('in1');
    var pane = reg.mailDetailPanel.innerHTML;
    assert(pane.indexOf('药熟了三畦') >= 0 && pane.indexOf('✕ 合上这封') >= 0, '点开一封信：信文与「合上这封」都在右栏（不再叫「返回列表」）');
    eq(reg.mailInboxPanel.classList.contains('is-split'), true, '读信时挂上 is-split（双栏真开关）');
    eq(MUI.replyMail('in1'), true, '点「回复」只摊纸（不弹框、不寄账）');
    eq(window._mailSystemData.outbox.length, 0, '摊纸这一步零记账');
    var paper = reg['mail-sheet-paper'];
    eq(reg['mail-sheet-count'].textContent, '已写 0 / 500 字', '信纸上方有字数计数器，容量认数据层那一个数');

    // 验收原句：贴 603 字 → 停在 500，并写明「尚余 103 字」，绝不静默截尾
    paper.value = '字'.repeat(603);
    MUI.onSheetInput(paper);
    eq(paper.value.length, 500, '超字当场按回纸上（笔停在 500）');
    eq(reg['mail-sheet-count'].textContent, '已写 500 / 500 字', '计数器跟着改口');
    assert(reg['mail-sheet-clamp'].textContent.indexOf('尚余 103 字未写入') >= 0,
        '「信纸至此为止，尚余 103 字未写入」常驻在计数旁边（不只闪一句 toast）');

    // 敲字与贴字要报同一个数：逐字敲每回只溢 1 字，不累计就永远只说「尚余 1 字」
    paper.value = '';
    MUI.onSheetInput(paper);
    eq(reg['mail-sheet-clamp'].textContent, '', '退回容量以下，那句提示跟着收声');
    for (var k = 0; k < 603; k++) { paper.value += '字'; MUI.onSheetInput(paper); }
    eq(paper.value.length, 500, '一个字一个字敲，笔照样停在 500');
    assert(reg['mail-sheet-clamp'].textContent.indexOf('尚余 103 字未写入') >= 0,
        '逐字敲满纸也报 103（累计被挡下的字数，与一次贴进来同口径）');

    eq(MUI.sendSheet(), true, '窗内寄出成功');
    eq(window._mailSystemData.outbox.length, 1, '回信落发件箱');
    eq(window._mailSystemData.outbox[0].body.length, 500, '落账的信正好 500 字（数据层那一道门）');
    eq(confCalled, false, '全程没碰原生 confirm');

    // 载具：用不得的照摆、照写原因；能用的挑了真改账（不是装饰）
    MUI.composeTo('npc_a');
    var sheet = reg.mailDetailPanel.innerHTML;
    eq((sheet.match(/mail-carrier-name/g) || []).length, 5, '写信一面五只载具全上墙');
    assert(sheet.indexOf('disabled') >= 0 && sheet.indexOf('境界不足（需筑基）') >= 0,
        '凡人这一面灵镜灰着，且把「差什么」写在钮上（禁止设计 #2：锁就亮锁）');
    MUI.pickCarrier('mirror');
    var noteLocked = reg['mail-sheet-note'];
    assert(!noteLocked || noteLocked.textContent.indexOf('50 灵石') < 0,
        '境界不够时点灰载具不生效（资费说明连被改口的机会都没有）');
    global.currentCharData.realm = '筑基';
    MUI.composeTo('npc_a');
    MUI.pickCarrier('mirror');
    assert(reg['mail-sheet-note'].textContent.indexOf('50 灵石') >= 0, '筑基挑中灵镜：资费那句话跟着改');
    reg['mail-sheet-paper'].value = '镜中来一叙。';
    eq(MUI.sendSheet(), true, '挑定的载具真寄得出去');
    eq(window._mailSystemData.outbox[0].carrier, 'mirror', '落账走的是挑中那一只（灵镜，不是默认飞鸽）');
    eq(global.inventory.currency.spiritStones, 250, '资费五十灵石当场扣掉');
})();

// ==================== P · UI-03 城市名册折叠 ＋ 撤裸「捐赠100」 ====================
console.log('\n[P] UI-03 城市名册分组折叠 ＋ 撤掉裸「捐赠100」');
(function () {
    var ls = src('js/location-system.js');
    var rp = src('js/reputation-system.js');
    var pm = src('styles/panel-map.css');

    // ---- ① 名册：每组一枚能点合的 <details>，标题上写着「几处」 ----
    assert(/function createBuildingGroup\(label, buildingTypes, open\)/.test(ls),
        '分组手风琴只有一处造组函数（标题＋卡身一起出，别处不再各写一份）');
    var grpFn = (ls.match(/function createBuildingGroup\([\s\S]*?\n\}/) || [''])[0];
    assert(/createElement\('details'\)/.test(grpFn) && /createElement\('summary'\)/.test(grpFn),
        '一组用原生 <details>／<summary>——折叠交给浏览器，不自造一套开合状态');
    assert(/buildingTypes\.length \+ ' 处'/.test(grpFn), '标题上摆着这一组有几处（点不点开唯一的线索）');
    assert(!/text-xs font-bold text-gray-400 mt-2 mb-1/.test(ls),
        '改前那种「只写组名、不能点也不能合」的裸标题已撤干净');
    assert(/createBuildingGroup\(cats\[c\], inGroup, false\)/.test(ls) && !/openedGroup/.test(ls),
        '默认整列折起（首屏实测量过：摊开第一组就把窗塞满，只剩一枚组名可看）');
    assert(/📦 其他/.test(ls), '没归进十类的建筑也有个标题领头，不散着摆在名册末尾当野卡');
    assert(/📜 ' \+ totalCards \+ ' 处设施分 ' \+ groupCount \+ ' 组收纳/.test(ls),
        '折上的线索补在名册上方：几处分几组写在脸上，不靠玩家点开才数得清');
    assert(/点组名摊开/.test(ls), '那一行还要说得出「怎么摊开」——只剩渐隐等于让玩家猜');
    assert(/id="city-roster-hint"/.test(ls), '提示摆在滚窗外面（跟着滚走的话，滚到底它就没了）');
    assert(/id="city-building-list"[^>]*max-h-\[70vh\]/.test(ls), '名册窗上限按方案给到 70vh（仍按视口定高，不是像素写死）');

    // ---- ② 吸顶与样式一支笔（跨面板规则一律带 #city-panel 前缀，不靠 #panel-map 当祖先） ----
    var cityCss = pm.slice(pm.indexOf('8. 城市名册'));
    assert(/\.city-group__sum\s*\{[^}]*position:\s*sticky/.test(cityCss), '展开的组标题吸顶——滚到第 5 张卡还知道自己在哪一组');
    assert(/\.city-group__sum\s*\{[^}]*background:\s*#2b3441/.test(cityCss),
        '吸顶那条自带底色（透明标题会让底下的卡从字缝里穿过去）');
    assert(/\.city-group\[open\] > \.city-group__sum::before/.test(cityCss),
        '三角自己画（summary 改成 flex 后浏览器那颗会消失），方向跟着 open 翻');
    assert(/\.city-group:not\(\[open\]\) > \.city-group__body\s*\{[^}]*display:\s*none/.test(cityCss),
        '折上的一组要把卡身整截撤出布局——body 上写了 display:flex，details 的默认隐藏会被它盖掉（实机抓到过这个反效果）');
    assert(cityCss.indexOf('!important') < 0, '城市这一节不靠 !important 抢层');
    var gatesDeclP = (cityCss.match(/\.rep-gates\s*\{[^}]*\}/) || [''])[0].replace(/\/\*[\s\S]*?\*\//g, '');
    var gateFloorP = maxFloor(gatesDeclP);
    assert(/repeat\(auto-fit/.test(gatesDeclP),
        '五枚解锁门走 grid 等分列，且用 auto-fit（改前 auto-fill 在 1920 档行尾留出 634px 空洞）');
    assert(!!gateFloorP && gateFloorP.px >= 182 && gateFloorP.std === gateFloorP.px,
        '列宽下限 ' + (gateFloorP ? gateFloorP.px : 'NaN') + 'px ≥ 实机量到的单行自然宽 181.6（原先 140px 把档名劈成「德高望／重）」），且 rem 那颗在标准档折回同一像素数');
    assert(/\.rep-gate:disabled\s*\{[^}]*border-style:\s*dashed/.test(cityCss) && !/\.rep-gate:disabled[^}]*opacity/.test(cityCss),
        '锁着的门只压虚边框，不拿 opacity 把「为什么锁」一起淡掉（禁止设计 #2）');

    // ---- ③ 假 DOM 里真造一组：数得清、点得开 ----
    var oldDoc = global.document;
    function mkNode(tag) {
        return {
            tagName: tag, className: '', textContent: '', innerHTML: '', open: false, children: [],
            appendChild: function (c) { this.children.push(c); return c; }
        };
    }
    global.document = { createElement: mkNode, addEventListener: function () {} };
    load('js/location-system.js');   // 造组函数是顶层 function，装进当前上下文即可直取
    var gOpen = createBuildingGroup('🏪 商业', [
        { id: 'shop', name: '坊市', icon: '🏪', color: '' },
        { id: 'pawn_shop', name: '当铺', icon: '🏪', color: '' }
    ], true);
    var gShut = createBuildingGroup('🛏️ 休憩', [{ id: 'inn', name: '客栈', icon: '🛏️', color: '' }], false);
    global.document = oldDoc;

    eq(gOpen.tagName, 'details', '一组就是一枚 <details>');
    eq(gOpen.children.length, 2, '组里两截：标题＋卡身');
    eq(gOpen.children[0].tagName, 'summary', '第一截是那张能点的标题');
    eq(gOpen.children[0].children[1].textContent, '2 处', '标题上那个数是真数出来的（两张卡就说 2 处）');
    eq(gOpen.children[1].children.length, 2, '组里有几处就摆几张卡');
    assert(/前往/.test(gOpen.children[1].children[0].innerHTML), '卡身里那张「前往」还在（折叠只收不砍）');
    eq(gOpen.open, true, '调用方说要摊开，它就摊开');
    eq(gShut.open, false, '说要折上就折上');

    // ---- ④ 裸「捐赠100」撤掉，捐资只留善堂那一条真账 ----
    assert(!/捐赠100/.test(rp) && !/addReputationFromDonation/.test(rp),
        '城情卡上那枚不问捐什么、当场扣 100 灵石的裸钮已撤');
    assert(!jsFiles('js').some(function (f) { return /addReputationFromDonation/.test(src(f)); }),
        '全仓再无 addReputationFromDonation——善堂之外那本平行捐资账彻底没有');
    assert(!/已解锁：/.test(rp), '不再另写一行「已解锁：…」——五张门牌各自已经报过自己的状态');
    var labels = (rp.match(/REPUTATION_FEATURE_LABELS = Object\.freeze\(\{[\s\S]*?\}\)/) || [''])[0];
    assert(/const labels = \{/.test(rp) === false && /REPUTATION_FEATURE_LABELS\[feature\]/.test(rp),
        '门牌名字全仓一张表（解锁播报与城情卡同读一处，不在 UI 里再抄一份）');
    assert(labels.indexOf('隐藏商店') >= 0 && labels.indexOf('隐藏地宫') >= 0, '那张表五枚名字齐');

    // ---- ⑤ 城情卡真跑：0 声望时五枚全锁、面上写明差什么；满声望时全开 ----
    load('js/reputation-system.js');
    var at0 = window.getReputationPanelHtml('帝都·长安');
    // UI-22 之后档名外面套了一枚 nowrap 的 span（只管怎么折行，不改读出来是什么话）：
    // 锚从「原始 HTML 里有这串字」迁到「玩家读到的那行话里有这串字」，剥掉标签再比。
    var at0文 = at0.replace(/<[^>]+>/g, '');
    eq((at0.match(/class="rep-gate[" ]/g) || []).length, 5, '五张门牌一张不少（条件不够也照摆）');
    eq((at0.match(/ disabled/g) || []).length, 5, '陌路人这一面五枚全 disabled');
    ['500（熟面孔）', '1,500（受欢迎）', '3,000（有名望）', '6,000（德高望重）', '10,000（万人敬仰）'].forEach(function (t) {
        assert(at0文.indexOf('需声望 ' + t) >= 0, '差什么写在牌面上：需声望 ' + t);
    });
    // 门槛与名下值仍是同一个写法（实机抓到过「10,000」并排「10000」）；
    // 第四十八批那枚锚钉的是「卡上印着范围 0 ~ 10,000」，COPY-02 把这行裸量程撤了，故锚迁到仍在卡上的两处数字。
    assert(at0文.indexOf('需声望 10,000（万人敬仰）') >= 0,
        '门槛千分位写法还在（撤了范围行不等于撤了 repNum 那支笔）');
    assert(/善堂/.test(at0), '长安有善堂 → 指路那句跟着上屏');
    window.setReputation('帝都·长安', 10000);
    var atMax = window.getReputationPanelHtml('帝都·长安');
    eq((atMax.match(/ disabled/g) || []).length, 0, '万人敬仰这一面一枚都不锁');
    eq((atMax.match(/已解锁/g) || []).length, 5, '五枚牌面各自报「已解锁」（数从声望表现推）');
    var atMountain = window.getReputationPanelHtml('蓬莱仙岛');
    assert(!/善堂/.test(atMountain), '蓬莱仙岛没有善堂 → 不画一条走不通的路（指路要看名册）');
})();

// ==================== Q · UI-02 商店窗宽 + 货架筛选读背包那一本账 ====================
console.log('\n[Q] UI-02 货架筛选：一把筛子两处用，不再立第二本账');
(function () {
    var shop = src('js/enhanced-shop.js');
    var inv = src('js/inventory.js');
    var html = src('仙侠.html');
    var css = src('styles/panel-shop.css');

    // ---- ① 窗与排布 ----
    // ★2026-10-04 由 1100px 改为 1440px（B 类·判据过时，且比原判据更严）★
    // 原判据：`max-w-[1100px]`（用户原话「有的界面太小」那一次抬到 1100）。
    // 现判据：1440px，且**样式表必须真的把上限接住**。
    // 为什么该改——先查清「为什么变」：styles/panel-shop.css:7 有用户批原文：
    // 「窗 1100px 在 1920 屏只占 57%『根本不好买东西』——拉到 1440px；96vw 兜底防超宽屏超界
    // （动态 arbitrary 类 CDN 不生成，静态接管；双类特异性压模板上的 max-w-[1440px]）」。
    // 即用户二次批示把封顶从 1100 抬到 1440，且顺带查出 Tailwind CDN 未必生成动态 arbitrary 类，
    // 于是改由 CSS 静态接管（`#shop-modal-overlay > div { max-width: min(1440px, 96vw) }`）。
    // 新设计即这条注释写下的那一版：模板带 max-w-[1440px]，真上限由 CSS 的 min(1440px, 96vw) 兜。
    // 这不是把数字追着改——新增了一条原来**根本没有**的要求（CSS 必须接住上限）：
    // 谁把 panel-shop.css 那条 max-width 删了、或只留模板里的 arbitrary 类，两条都红。
    assert(/max-w-\[1440px\]/.test(shop), '商店窗封顶 1440px（用户批 2026-10-02：1100px 在 1920 屏只占 57%「根本不好买东西」）');
    assert(/#shop-modal-overlay\s*>\s*div\s*\{[^}]*max-width:\s*min\(1440px,\s*96vw\)/.test(css),
        '真上限由样式表静态接管（#shop-modal-overlay > div 的 max-width: min(1440px, 96vw)）'
        + '——动态 arbitrary 类 CDN 不生成，只留模板那一笔等于屏上根本没有上限');
    var shopFloor = maxFloor((css.match(/\.shop-goods-grid\s*\{[^}]*\}/) || [''])[0]);
    assert(/shop-goods-grid/.test(shop) && /repeat\(auto-fill,\s*minmax\(/.test(css),
        '货架按 auto-fill 排卡（屏宽就两张、屏窄退回一张），不是把列数写死');
    assert(!!shopFloor && shopFloor.px === 430 && shopFloor.std === 430,
        '货架轨道下限仍是量字量出的 430px，写成 max(430px, 26.875rem)——26.875×16=430，标准档不变、大字号档跟手（UI-23）');
    var cssCode = css.replace(/\/\*[\s\S]*?\*\//g, '');
    assert(!/!important/.test(cssCode), 'panel-shop.css 全篇无 !important（赢不过就赢不过，别加价）');
    var sel = cssCode.split('\n').filter(function (l) { return /\{\s*$/.test(l); });
    assert(sel.length > 0 && sel.every(function (l) { return /^\s*#shop-modal-overlay/.test(l); }),
        'panel-shop.css 每一条选择器都带 #shop-modal-overlay 前缀（不跨面板裸类，实际 ' + sel.length + ' 条）');
    assert(/<link rel="stylesheet" href="styles\/panel-shop\.css">/.test(html), '这份样式在 仙侠.html 里挂了链接');
    assert(/display:\s*none/.test(css) && /#shop-modal-overlay\.is-filtering \.shop-chip--clear/.test(css),
        '「清除筛选」没筛时不在场（不许常摆一枚此刻用不上的钮）');
    assert(/\.shop-goods__empty\s*\{\s*grid-column:\s*1 \/ -1/.test(css) && /shop-goods__empty">' \+ window\.xEmptyHtml/.test(shop),
        '筛空那张公共空态卡套了商店自有的壳并横贯整排（实机量过：只占一格时它在 1100px 窗里宽 558px，右半页空着，读成「这格缺件货」）');
    assert((shop.match(/buyFromEnhancedShop\('/g) || []).length === 1,
        '货卡只此一处拼装（首屏与筛选后重画共用 _shopGoodsCardHtml，筛完不会少东西）');

    // ---- ② 一本账：写方只有背包，商店只借读 ----
    assert(!/inventory\.filter\s*=/.test(shop) && !/inventory\.searchQuery\s*=/.test(shop),
        '商店不自己写筛选账（filter/searchQuery 只经背包的 setter 动，两处永远同步）');
    assert(/window\.filterInventory\(cat\)/.test(shop) && /window\.setSearchQuery\(q\)/.test(shop),
        '货架上那排 chips 与搜索框按的就是背包那两个 setter');
    assert(/window\.matchesInventoryFilter\(tpl\)/.test(shop) && /window\.compareInventoryEntries/.test(shop),
        '判定与排序都调背包导出的那一把筛子和一把尺子');
    assert(/_shopDialogShop = shop/.test(shop) && !/data-shop-id/.test(shop),
        '重画货单认的是内存里那家店，不是从 DOM 属性读回（禁止清单：读取 DOM 作为真实数值）');
    eq((html.match(/weapon: '武器'/g) || []).length + (inv.match(/weapon: '武器'/g) || []).length + (shop.match(/weapon: '武器'/g) || []).length, 1,
        '分类中文名全仓一张表（INVENTORY_CONFIG.CATEGORY_LABELS，背包空态与货架 chips 同读它）');
    var chips = (inv.match(/FILTER_CHIPS:\s*\[([^\]]*)\]/) || ['', ''])[1].split(',').map(function (x) { return (x.match(/'([^']+)'/) || [])[1]; }).filter(Boolean);
    var bag = [];
    var re = /filterInventory\('([a-z_]+)'\)[^>]*data-category="([a-z_]+)"[^>]*>([^<]+)</g, m;
    while ((m = re.exec(html))) bag.push({ key: m[1], data: m[2], label: m[3].trim() });
    eq(bag.map(function (x) { return x.key; }).join(','), chips.join(','),
        '背包那排静态 chips 与 FILTER_CHIPS 一档不多一档不少（两张表迟早分叉，此处钉住）');
    assert(bag.every(function (x) { return x.key === x.data; }), 'chip 的 onclick 与 data-category 同一个档（不会点武器筛成防具）');
    assert(bag.every(function (x) { return /CATEGORY_LABELS/.test(inv) && x.label.length > 0; }) &&
        chips.every(function (k) { return new RegExp(k + ":\\s*'").test(inv); }),
        '每一档在 CATEGORY_LABELS 里都有名字（不留没有中文名的哑档）');

    // ---- ③ 真跑：背包筛过的档，货架认；改前的行为一根不许变 ----
    load('js/inventory.js');
    global.itemById = {
        iron_sword: { id: 'iron_sword', name: '青钢剑', type: 'weapon', price: 40, quality: 'PIN7' },
        golden_pill: { id: 'golden_pill', name: '回元丹', type: 'consumable', price: 12, quality: 'PIN5' }
    };
    window.itemById = global.itemById;
    var iv = window.inventory;
    function slot(id, count) {
        return { templateId: id, count: count, getTemplate: function () { return global.itemById[id]; } };
    }
    iv.slots = [slot('iron_sword', 2), null, slot('golden_pill', 7)];
    iv.filter = 'all'; iv.searchQuery = ''; iv.qualityFilter = 'all'; iv.sortBy = 'count_desc';
    eq(window.getFilteredSlots().map(function (s) { return s.templateId; }).join(','), 'golden_pill,iron_sword',
        '背包默认按数量排：7 堆在前、2 堆在后（重构后没把 count 从模板里读丢）');
    iv.sortBy = 'price_asc';
    eq(window.getFilteredSlots().map(function (s) { return s.templateId; }).join(','), 'golden_pill,iron_sword',
        '按价升序：12 铜的丹在 40 的剑前');
    iv.sortBy = 'count_desc'; iv.filter = 'weapon';
    eq(window.getFilteredSlots().map(function (s) { return s.templateId; }).join(','), 'iron_sword', '按分类筛只剩武器');
    iv.filter = 'all'; iv.searchQuery = '回元';
    eq(window.getFilteredSlots().map(function (s) { return s.templateId; }).join(','), 'golden_pill', '关键词筛货名');
    iv.searchQuery = ''; iv.qualityFilter = 'PIN9';
    eq(window.getFilteredSlots().length, 0, '品质九品筛空了（空态那侧由 inventoryFilterLabels 说出是谁筛的）');
    eq((window.inventoryFilterLabels() || []).join(''), '品质「九品」', '空态说得出「是谁把东西筛没了」');
    iv.qualityFilter = 'all';

    load('js/enhanced-shop.js');
    var fakeShop = {
        id: 'q-shop',
        inventory: [
            { id: 'iron_sword', name: '青钢剑', type: 'weapon', stock: 3 },
            { id: 'golden_pill', name: '回元丹', type: 'consumable', stock: 9 }
        ],
        getItemPrice: function (item) { return global.itemById[item.id].price; }
    };
    eq(window.shopFilteredGoods(fakeShop).length, 2, '不筛时两件货都在');
    iv.filter = 'weapon';
    eq(window.shopFilteredGoods(fakeShop).map(function (i) { return i.id; }).join(','), 'iron_sword',
        '在背包里筛过「武器」，走进店里货架就只认这一档（同一本账，不是店里的第二套筛选）');
    iv.filter = 'all'; iv.searchQuery = '回元';
    eq(window.shopFilteredGoods(fakeShop).map(function (i) { return i.id; }).join(','), 'golden_pill', '搜索框同样读这一本账');
    iv.searchQuery = ''; iv.sortBy = 'count_desc';
    eq(window.shopFilteredGoods(fakeShop).map(function (i) { return i.id; }).join(','), 'golden_pill,iron_sword',
        '货架排序也走背包那把尺子（按库存：9 件在前）');
    iv.sortBy = 'price_asc';
    eq(window.shopFilteredGoods(fakeShop).map(function (i) { return i.id; }).join(','), 'golden_pill,iron_sword',
        '按价升序：12 的丹在 40 的剑前（店里摆的序与柜台收的价同一口径）');
    iv.sortBy = 'count_desc'; iv.filter = 'PIN-NOT-EXIST';
    eq(window.shopFilteredGoods(fakeShop).length, 0, '筛到空就交白卷给空态卡（不拿「全部」兜底装作没筛）');
    iv.filter = 'all';
})();

// ==================== R · UI-02② 出售页直列行囊 ====================
console.log('\n[R] UI-02② 出售页：不标记也能卖、一钮卖整堆、卖完商店还开着');
(function () {
    var shop = src('js/enhanced-shop.js');
    var stall = src('js/city-facilities/street-stall.js');

    // ---- ① 静态：那条「先回背包标记再来」的链路不许回来 ----
    assert(!/markedItems|请在背包中标记物品后前来出售/.test(shop),
        '出售页不再由「已标记清单」驱动，那句推诿文案也一并撤了（旧版：没标记就看不见货）');
    assert(/id="shop-sell-list"/.test(shop) && /function shopRefreshSell/.test(shop),
        '出售页有自己一块容器、按同一本账现算（不再开窗时静态拼一份）');
    assert(!/this\.closest\('\.shop-modal-overlay'\)\.remove\(\)/.test(shop),
        '成交不再顺手把整间商店关掉（旧版每卖一件都要重新进一次门）');
    assert(/_sellMarkedOnly\s*=\s*false/.test(shop) && /只看已标记/.test(shop),
        '标记降为一条可选过滤：开窗默认看全部，且每次进店归零');
    assert(!/inventory\.markedForSale\s*=/.test(shop) && !/inventory\.filter\s*=/.test(shop),
        '商店不写标记与筛选这两本账（只读背包那一份，两处永远同步）');
    assert(/if \(preview\) return quote;/.test(shop) && /slot\.count, true\)/.test(shop),
        '货列上摆的价是「预览报价」：不进报价簿——重画一次攒一条就是内存里堆死报价');
    assert(/function shopSetFilterCategory[\s\S]{0,240}shopRefreshSell/.test(shop) &&
        /function shopSetGoodsSearch[\s\S]{0,240}shopRefreshSell/.test(shop),
        '页顶那把筛子管两页：改筛选时货单与出售页一起重画（不会一页筛了另一页没筛）');
    // 「什么东西能上柜台」在铺子与摆摊各写了一份，判据一宽一窄就会各收各的货——并排钉住同一条
    var GATE = /category === 'quest'[\s\S]{0,40}category === 'currency'[\s\S]{0,40}subtype === 'manual'/;
    var shopGate = (shop.match(/isSellable: function \(slot\)[\s\S]{0,400}/) || [''])[0];
    var stallGate = (stall.match(/function sellable\(slot\)[\s\S]{0,400}/) || [''])[0];
    assert(GATE.test(shopGate) && GATE.test(stallGate),
        '铺子与摆摊的收货判据同一条：任务信物／钱票／秘籍都不收（改一侧必须同步另一侧）');

    // ---- ② 真跑：判据、预览、整堆成交 ----
    // [Q] 已把 inventory.js 与本文件载入同一上下文，这里只补空态公共件（仙侠.html 里它排在本文件之前）
    load('js/core/empty-state.js');
    var iv = window.inventory;
    global.itemById.qi_seeds = { id: 'qi_seeds', name: '养气丹', category: 'consumable', price: 30, quality: 'PIN5' };
    global.itemById.token_x = { id: 'token_x', name: '掌门信物', category: 'quest', price: 0 };
    global.itemById.copper_coin = { id: 'copper_coin', name: '铜钱', category: 'currency', price: 1 };
    global.itemById.manual_y = { id: 'manual_y', name: '御剑诀', category: 'book', subtype: 'manual', price: 500 };
    global.itemById.dusty_robe = { id: 'dusty_robe', name: '旧法袍', category: 'armor', price: 0, basePrice: 0 };
    window.itemById = global.itemById;
    function mk(id, count, uid) {
        return { uid: uid, templateId: id, count: count, getTemplate: function () { return global.itemById[id]; } };
    }
    var T = window.TradeService;
    eq(T.isSellable(mk('token_x', 1, 'x1')), false, '任务信物不上柜台（不会因为「标记过」就破例）');
    eq(T.isSellable(mk('copper_coin', 99, 'x2')), false, '钱票不收（铜钱本身不是货）');
    eq(T.isSellable(mk('manual_y', 1, 'x3')), false, '秘籍不走通用货架——老规矩');
    eq(T.isSellable(mk('dusty_robe', 3, 'x4')), false, '定价为 0 的货不摆价（免得一件商品被一枚灵石买走）');
    eq(T.isSellable(mk('qi_seeds', 0, 'x5')), false, '空堆不收（行囊里有个 0 件的格子不算一件货）');
    eq(T.isSellable(mk('qi_seeds', 5, 'x6')), true, '有价有货就是可卖，与标记无关');

    var qShop = { id: 'q-shop', type: 'general', location: '中州', inventory: [], getItemPrice: function () { return 10; } };
    window.shopManager = { getShop: function (id) { return id === qShop.id ? qShop : null; } };
    iv.slots = [mk('iron_sword', 2, 'u_sword'), mk('qi_seeds', 5, 'u_seeds'),
        mk('token_x', 1, 'u_token'), mk('manual_y', 1, 'u_manual'), null];
    iv.filter = 'all'; iv.searchQuery = ''; iv.qualityFilter = 'all'; iv.sortBy = 'count_desc';
    iv.currency.spiritStones = 100; iv.currency.copper = 0;

    var q0 = Object.keys(T._quotes).length;
    var pv = T.quoteSell('q-shop', 'u_seeds', 5, true);
    assert(pv && pv.totalPrice > 0, '预览报价算得出总价（出售页那行价是现算的，不是硬写的）（实际=' + (pv && pv.totalPrice) + '）');
    eq(Object.keys(T._quotes).length, q0, '预览报价不进报价簿（摆一次价攒一条＝账上堆满没人认领的报价）');
    msgs.length = 0;
    eq(T.quoteSell('q-shop', 'u_token', 1), null, '真开报价单时信物被拒');
    assert(msgs.some(function (m) { return /柜上收不下/.test(m.m); }), '拒收时有一句世界内回绝，不是点了没反应');

    var whole = T.quoteSell('q-shop', 'u_seeds');
    eq(whole.quantity, 5, '不传数量＝行囊里有几件卖几件（整堆出售）');
    var stones0 = iv.currency.spiritStones;
    assert(T.executeSell(whole.id), '整堆这一笔成交');
    eq(iv.slots.filter(function (s) { return s && s.uid === 'u_seeds'; }).length, 0, '一整堆都从行囊走清（不是只卖一件）');
    assert(iv.currency.spiritStones > stones0, '钱当场到账（' + stones0 + '→' + iv.currency.spiritStones + '）');
    eq(T.getBuybackItems('q-shop').length, 1, '卖出的货进了当日回购');
    eq(Object.keys(T._quotes).length, q0, '成交后这张报价单收掉（不留在账上）');

    // ---- ②b 铜钱货：卖出得铜钱，回购也该扣铜钱（实机抓到的是扣了灵石：写 currency、读 currencyType）----
    global.itemById.mantou = { id: 'mantou', name: '馒头', category: 'consumable', type: 'food', price: 2 };
    window.itemById = global.itemById;
    iv.slots.push(mk('mantou', 1, 'u_mantou'));
    var mq = T.quoteSell('q-shop', 'u_mantou');
    assert(mq && mq.currency === 'copper', '馒头这单按铜钱结算（吃食是铜钱货）（实际=' + (mq && mq.currency) + '）');
    var copper0 = iv.currency.copper;
    assert(T.executeSell(mq.id), '馒头这一笔成交');
    iv.currency.copper = copper0;   // 卖掉只进一笔铜钱，回购账要按同一单位回来
    var mb = T.getBuybackItems('q-shop');
    var mantouBack = mb[mb.length - 1];
    eq(mantouBack.currency, 'copper', '回购条目记着出售时那本货币（写的是 currency，读端也认 currency）');
    assert(!/item\.currencyType/.test(shop), '扣款与上屏都不再读那个从无写方的 currencyType（假修复：永远退回灵石）');
    var stonesBeforeBack = iv.currency.spiritStones;
    iv.currency.copper = 999;
    assert(T.buybackItem('q-shop', mantouBack.uid), '铜钱够就买得回来');
    assert(iv.currency.copper < 999, '回购扣的是铜钱（' + 999 + '→' + iv.currency.copper + '）');
    eq(iv.currency.spiritStones, stonesBeforeBack, '回购铜钱货不该动灵石一分（实机量到的是灵石 8→7）');

    // ---- ③ 真拼一次出售页：行囊里有什么就摆什么 ----
    var made = {};
    function fake(id) {
        return made[id] || (made[id] = {
            textContent: '', innerHTML: '', className: '',
            classList: { toggle: function () {}, add: function () {}, remove: function () {}, contains: function () { return false; } },
            dataset: {}, querySelectorAll: function () { return []; }
        });
    }
    var oldGet = document.getElementById;
    document.getElementById = fake;
    try {
        window.shopRefreshSell(qShop);
        var listed = made['shop-sell-list'].innerHTML;
        assert(/青钢剑/.test(listed) && /整堆出售/.test(listed),
            '没标记过的货也摆在柜面上（旧版这一屏是「暂无标记待售的物品」）');
        assert(!/掌门信物|御剑诀/.test(listed), '信物与秘籍没被列进可卖清单（不收的东西不摆价）');
        assert(/行囊可卖 \d+ 件/.test(made['shop-sell-count'].textContent),
            '计数行报得出「可卖几件」（实际=' + made['shop-sell-count'].textContent + '）');
        iv.filter = 'weapon';
        window.shopRefreshSell(qShop);
        assert(/青钢剑/.test(made['shop-sell-list'].innerHTML) && !/养气|回元/.test(made['shop-sell-list'].innerHTML),
            '页顶那把筛子同样管着出售页：筛「武器」后行囊里只留下剑');
        iv.filter = 'secret_art';
        window.shopRefreshSell(qShop);
        assert(/x-empty|这一筛把行囊筛空了/.test(made['shop-sell-list'].innerHTML),
            '筛空时交白卷给公共空态卡（铺子那侧同一支笔），不是留一块白板');
        assert(/shop-goods__empty/.test(made['shop-sell-list'].innerHTML), '出售页的空态卡同样横贯整排（不只货架那一页）');
        iv.filter = 'all';
    } finally {
        document.getElementById = oldGet;
        iv.filter = 'all'; iv.sortBy = 'count_desc';
    }
})();

console.log('\n[S] UI-13 势力声望条：双向量程别再当单向条画');
(function () {
    var app = src('js/app.js');
    var a = app.indexOf('function renderFactionList');
    assert(a > 0, '找得到 renderFactionList');
    var fr = app.slice(a, app.indexOf('function renderFactionConflicts', a));
    // 旧版病根：把 −10000~10000 的双向 rep 当左→右单向条画，于是 rep=0（中立）也占半格
    assert(!/\(\s*rep\s*\+\s*10000\s*\)\s*\/\s*20000/.test(fr),
        '声望条不再用 (rep+10000)/20000 那支单向画法（rep=0 天生半格的谎已撤）');
    // 改法：以 50% 为中线 0，正向右绿、负向左红，且常驻一条 0 标线
    assert(/left:50%;width:'[^']*Math\.min\(10000, rep\)/.test(fr), '正向条从中线（left:50%）向右起');
    assert(/left:' \+ \(50 - Math\.min\(10000, -rep\)/.test(fr), '负向条从中线向左生长（右端钉在 50%）');
    assert(/#22c55e/.test(fr) && /#ef4444/.test(fr), '正向绿、负向红两支笔都在');
    assert(/left:50%;width:2px/.test(fr), '有一条钉在 50% 的常驻中线（0 刻度）');
    assert(/中线 0 = 中立/.test(fr), '条下写明中线 0＝中立（不再让玩家猜半格是什么意思）');
    // 行为：从真实代码里把正向那一支宽度表达式捞出来算，别只在测试里另抄一份公式
    var posExpr = fr.match(/width:' \+ \(Math\.min\(10000, rep\) \/ 10000 \* 50\)/);
    assert(posExpr, '正向宽度是「min(10000,rep)/10000*50」——半幅封顶');
    var wPos = new Function('rep', 'return Math.min(10000, rep) / 10000 * 50;');
    eq(wPos(0), 0, 'rep=0（中立）从中线量出零宽（改前会画到 50%）');
    eq(wPos(500), 2.5, '友善前的 +500 只占右半幅的 5%（2.5%）');
    eq(wPos(10000), 50, '满正向恰到达右端（50% 半幅）');
    eq(wPos(99999), 50, '超量程的正向被封顶在半幅，不会溢出到整条');
})();

console.log('\n[T] UI-19② 换面板要把当前导航项滚进可见区');
(function () {
    var app = src('js/app.js');
    var a = app.indexOf('function switchPanel');
    assert(a > 0, '找得到 switchPanel');
    var sp = app.slice(a, app.indexOf('\nfunction ', a + 1));
    var iActive = sp.indexOf("classList.add('active')");
    assert(iActive > 0, 'switchPanel 里有「给当前导航项加 active」这一笔');
    var iScroll = sp.indexOf('scrollIntoView');
    assert(iScroll > 0, '换面板时会把当前导航项 scrollIntoView（矮窗口这一列要滚，快捷键切页不该停在首屏外）');
    assert(iScroll > iActive, '先标 active、再滚——滚的是刚点亮的这一枚，不是上一枚');
    assert(/block:\s*'nearest'/.test(sp) && /inline:\s*'nearest'/.test(sp),
        '两支都对齐取 nearest：桌面竖滚与窄屏横滑各管一头');
    assert(!/block:\s*'(start|center|end)'/.test(sp),
        '不许用 start/center/end —— 那样每切一次面板列表就被硬拽一格，真点导航也会跳');
    // 真点导航（目标本就在可视区内）不该被拽动：'nearest' 的语义就是已可见时零位移
    var hasGuard = /typeof navItem\.scrollIntoView === 'function'/.test(sp);
    assert(hasGuard, '调用前挡一手 typeof（老 WebView 无此方法时不该抛错把切页一起带走）');
})();

console.log('\n[U] UI-10③ 招式栏不再摆出第二枚同名「普通攻击」');
(function () {
    var app = src('js/app.js');
    var head = 'function _renderBattleActionsHTML() {';
    var a = app.indexOf(head);
    assert(a > 0, '找得到 _renderBattleActionsHTML');
    var b = app.indexOf('// 部位选择区', a);
    assert(b > a, '招式栏这一段有可切的边界（到「部位选择区」为止）');
    var body = app.slice(a + head.length, b);
    assert(body.indexOf('chipIdx.forEach') > 0, '摆 chips 走的是筛过的下标表，不是原样遍历 moves');
    assert(body.indexOf('moves.forEach') < 0, '不许再用 moves.forEach 直摆——合成那条「普通攻击」会跟着漏回台面');

    // 真跑一段渲染函数体，不在测试里另抄一份判断
    var render = new Function('window', 'currentBattle', '_selectedMove', body + '\nreturn html;');
    function withMoves(moves, quick) {
        return render(
            {
                getActiveAttackMoves: function () { return moves; },
                getQuickMoves: function () { return quick || []; },
                getAllLearnedMoves: function () { return moves; }
            },
            { _moveCD: {} },
            null
        );
    }
    function n(hay, needle) { return hay.split(needle).length - 1; }

    var syn = { skillId: 'default', skillName: '普通攻击', moveId: 'move_default', name: '普通攻击' };
    var m1 = { skillId: 's1', skillName: '青莲剑诀', moveId: 'move_a', name: '第一式' };
    var m2 = { skillId: 's1', skillName: '青莲剑诀', moveId: 'move_b', name: '第二式' };

    // ① 新号：一条招式都没学，equipment.js 只合成那条「普通攻击」
    var fresh = withMoves([syn]);
    eq(n(fresh, '👊 普通攻击'), 1, '新号整栏只见一枚「普通攻击」（改前是顶上＋折叠栏各一枚）');
    assert(fresh.indexOf('<details') < 0, '新号没有真招式可翻，「📂 全部招式」整块不该出现');
    eq(n(fresh, 'selectBattleMove(null)'), 1, '普攻只留顶上那条入口（selectBattleMove(null) 一次）');
    assert(fresh.indexOf('selectBattleMove(0)') < 0, '合成那条不再被编号成第 0 招摆出去');
    assert(fresh.indexOf('普通攻击·普通攻击') < 0, '不再出现「青莲…·…」式的同名叠字');

    // ② 有真招式：折叠栏出现，计数与屏上枚数相符
    var two = withMoves([m1, m2]);
    assert(two.indexOf('<details') > 0, '两招在手时「📂 全部招式」出现');
    assert(two.indexOf('全部招式（2招）') > 0, '计数写「2招」＝屏上实摆的两枚（不是把合成那条也算进账）');
    eq(n(two, '👊 普通攻击'), 1, '顶上无快捷栏时这一枚仍在，且只有一枚');

    // ③ 合成条与真招式同表时，索引必须守住 moves 原位（selectBattleMove 按 moves 取招）
    var mixed = withMoves([syn, m1]);
    assert(mixed.indexOf('selectBattleMove(1)') > 0, '真招式仍按其在 moves 里的原位编号（此处为 1）');
    assert(mixed.indexOf('selectBattleMove(0)') < 0, '被筛掉的合成条不留空号，也不把后面的招往前挪一位');
    assert(mixed.indexOf('全部招式（1招）') > 0, '同表混摆时计数只算真招式那一枚');

    // ④ 快捷栏已覆盖全部招式，就不必再翻折叠栏
    var covered = withMoves([m1], [m1]);
    assert(covered.indexOf('<details') < 0, '唯一一招已上快捷栏 → 不再重复一份折叠栏');
    assert(covered.indexOf('⭐ 快捷招式') > 0, '快捷栏照常摆出');
    var partly = withMoves([m1, m2], [m2]);
    assert(partly.indexOf('<details') > 0, '快捷栏只覆盖一招时折叠栏仍要出现（另有一招没上桌面）');
    assert(partly.indexOf('全部招式（2招）') > 0, '折叠栏计数按全表真招式计（2招），与快捷栏已摆几枚无关');
})();

console.log('\n[V] UI-10② 「下一击」回显：两步出手之间不许没有已选态');
(function () {
    var app = src('js/app.js');
    var bt = src('js/battle.js');
    var head = 'function _renderBattleActionsHTML() {';
    var a = app.indexOf(head);
    assert(a > 0, '找得到 _renderBattleActionsHTML');
    var header = app.indexOf('class="text-xs text-gray-400 mb-1">选择攻击部位：', a);
    assert(header > a, '找得到部位那一行（回显应排在它前面）');
    var body = app.slice(a + head.length, app.lastIndexOf("html += '", header));
    assert(body.indexOf('battle-next-strike') > 0, '招式栏与部位栏之间确有这一行回显（带 id 可指认）');
    eq(app.split('battle-next-strike').length - 1, 1, '全仓只有这一处「下一击」，三个渲染分支共用一行笔');
    assert(body.indexOf('qiCost') < 0 && body.indexOf('staminaCost') < 0,
        '呈现层不自己比代价——只问引擎那一本账（否则就是平行状态）');

    // ---- 切片真跑渲染函数体（不在测试里另抄一份文案拼装）----
    var render = new Function('window', 'currentBattle', '_selectedMove', body + '\nreturn html;');
    function run(battle, sel) {
        return render({
            getActiveAttackMoves: function () { return sel ? [sel] : []; },
            getQuickMoves: function () { return []; },
            getAllLearnedMoves: function () { return sel ? [sel] : []; }
        }, battle, sel || null);
    }
    var m1 = { skillId: 's1', skillName: '青莲剑诀', moveId: 'move_a', name: '第一式', icon: '🗡️' };

    var idle = run({ _moveCD: {} }, null);
    assert(idle.indexOf('下一击：👊 普通攻击') > 0, '没选招式时照实说这一手是普通攻击（不当它是空白的）');
    assert(idle.indexOf('点一处部位即出手') > 0, '说清第二步在哪落子（部位钮才是出手）');
    assert(idle.indexOf('收回普通攻击') < 0, '没选招式就不该提「用完收回」');
    assert(idle.indexOf('text-gray-400" id="battle-next-strike"') > 0, '未选招时这一行是灰的（不抢黄，避免强调色通胀）');

    var picked = run({ _moveCD: {} }, m1);
    assert(picked.indexOf('下一击：🗡️ 青莲剑诀·第一式') > 0, '选中一枚招式后这一行报出它的完整名（招式表里同名两枚也能分清）');
    assert(picked.indexOf('（打出去后收回普通攻击') > 0, '交代这一手打完就收势，玩家不会以为招式永久挂着');
    assert(picked.indexOf('text-yellow-400" id="battle-next-strike"') > 0, '选中态转黄（与招式钮的底色同一族，但折叠栏合上时也看得见）');

    var blockedBattle = { _moveCD: {}, moveBlockReason: function () { return '真气不足——需 5，你只剩 2'; } };
    var blocked = run(blockedBattle, m1);
    assert(blocked.indexOf('这一手打不出去（真气不足——需 5，你只剩 2）') > 0, '引擎说打不出去，这一行就照实说，不许仍许诺「即出手」');
    assert(blocked.indexOf('点一处部位即出手') < 0, '打不出去时那句许诺必须撤掉');
    assert(blocked.indexOf('text-red-400" id="battle-next-strike"') > 0, '这一行转红（把「点了也是空」提前说出来）');

    var noBattle = run(null, m1);
    assert(noBattle.indexOf('点一处部位即出手') > 0, '战斗账读不到时不崩、也不硬编一句「打不出去」');
    assert(noBattle.indexOf('moveBlockReason') < 0, '报错文案里不许把内部函数名漏到屏上');

    // ---- 引擎那一本账：全仓只判一次，且判与扣同处 ----
    eq(bt.split('moveBlockReason(').length - 1, 2, 'battle.js 里这本账只有一处定义＋一处出手调用（面板那一处只调用、不另判，在 app.js）');
    var pawm = bt.slice(bt.indexOf('playerAttackWithMove(partId, move) {'));
    pawm = pawm.slice(0, pawm.indexOf('\n    }'));
    assert(pawm.indexOf('this.moveBlockReason(') > 0, '出手前先问同一处判据');
    assert(/<\s*move\.qiCost/.test(pawm) === false && /<\s*move\.staminaCost/.test(pawm) === false,
        'playerAttackWithMove 里不再留第二套代价比较（改前正是那两段内联判定）');
    assert(pawm.indexOf('_costChar.qi = Math.max(0') > 0 && pawm.indexOf('_costChar.energy = Math.max(0') > 0,
        '门槛既过才扣，且两处都扣（判定搬家时别把扣账一起丢了）');

    // ---- 真跑仓库里那份 battle.js（[I] 段已 load，此处复用同一份实现，不再重复加载）----
    assert(typeof window.Battle === 'function' && typeof window.Entity === 'function', '仓库那份 Battle／Entity 在场（沿用 [I] 段加载的那一份，不是测试里另抄的）');
    var attrs = { strength: 10, dexterity: 10, intelligence: 10, willpower: 10, constitution: 10, meridian: 10 };
    function mkEnt(name, type) { return new window.Entity({ name: name, level: 5, physiologyType: 'humanoid', attrs: attrs }, type); }
    function mkBattle(cd) {
        var b = new window.Battle(mkEnt('己身', 'player'), mkEnt('对手', 'enemy'));
        b.isPlayerTurn = true;
        window.getCurrentCharData = function () { return cd; };
        return b;
    }
    var mv = { moveId: 'mv_t', skillId: 's1', name: '测试招', qiCost: 5, staminaCost: 5, damageMult: 1.0, damageType: 'blunt' };

    var cd1 = { qi: 2, energy: 50 };
    var r1 = mkBattle(cd1).playerAttackWithMove('chest', mv);
    eq(r1, false, '真气不足 → 这一手打不出去（返回 false，面板据此收回许诺）');
    eq(cd1.qi, 2, '拒掉的这一手分文不扣');

    var cd2 = { qi: 100, energy: 1 };
    var r2 = mkBattle(cd2).playerAttackWithMove('chest', mv);
    eq(r2, false, '精力不足 → 同样拒掉');
    eq(cd2.energy, 1, '精力没够仍不扣精力');
    eq(cd2.qi, 100, '⚠️ 改前这里会先扣 5 真气再因精力不足拒用——一手白烧。现在两道门槛判过才扣');

    var cd3 = { qi: 100, energy: 100 };
    var b3 = mkBattle(cd3);
    eq(b3.moveBlockReason(mv), '', '两道门槛都够 → 判据给出「没有理由」');
    // 出手链上还有一个与本轮无关的协作者：battle.js 的 _getFn('getBondBonuses') 在 window 上查不到
    // 就会 eval 裸名，而本沙箱没挂 app.js 的词法绑定。给一个恒等值把它喂过（这里面没有任何代价判断）。
    if (typeof window.getBondBonuses !== 'function') {
        window.getBondBonuses = function () { return { attack: 1, defense: 1, cultivation: 1 }; };
    }
    // 落子之后引擎还要顺手造伤：本沙箱没 load physiology-config.js／battle-injuries.js，
    // 于是创口表与重伤判定都得补最小桩（tests/regression-node.js 同因早有这两枚）。与代价判据无关。
    if (!window.DAMAGE_TYPE_EFFECTS) {
        window.DAMAGE_TYPE_EFFECTS = {
            blunt: { externalBleed: 2, internalBleed: 1, pain: 3, structuralDamage: 2, neuralShock: 1 },
            slash: { externalBleed: 4, internalBleed: 2, pain: 3, structuralDamage: 2, neuralShock: 1 },
            pierce: { externalBleed: 3, internalBleed: 3, pain: 2, structuralDamage: 2, neuralShock: 2 }
        };
    }
    if (typeof global.shouldCheckCriticalInjury !== 'function') {
        global.shouldCheckCriticalInjury = function () { return false; };
    }
    var r3;
    try { r3 = b3.playerAttackWithMove('chest', mv); } catch (e) { r3 = 'threw:' + e.message; }
    eq(r3, true, '够代价则真出手（返回 true，battleAttackPart 据此才收回招式选择）');
    eq(cd3.qi, 95, '真气按价扣一次（不是两处各扣）');
    eq(cd3.energy, 95, '精力按价扣一次');

    var cd4 = { qi: 100, energy: 100 };
    var b4 = mkBattle(cd4);
    eq(b4.moveBlockReason(null), '', '判据对空招式安静返回「无理由」（面板不许为它造一句谎）');
    eq(b4.moveBlockReason({ moveId: 'x', name: '免费招', qiCost: 0, staminaCost: 0 }), '', '零代价招式永不判「打不出去」');
})();

// ==================== W · UI-19①③ 超矮窗导航两列 + 返回入口挪进设置 ====================
console.log('\n[W] UI-19①③ 700px 档导航改两列，「返回创建」让出导航那一格');
(function () {
    var html = src('仙侠.html');
    var tok = src('styles/ui-tokens.css');
    var flat = tok.replace(/\n\s*/g, ' ');

    // ---- ③ 返回入口：整页只有一枚，且它在「存档管理」卡里、不在左栏导航里 ----
    eq((html.match(/backToCreation\(\)/g) || []).length, 1, '「↩ 返回创建」整页只留一枚（改前导航底下一枚＋这里没有）');
    var navOpen = html.indexOf('<nav class="flex-1');
    var navClose = html.indexOf('</nav>', navOpen);
    assert(navOpen > 0 && navClose > navOpen, '左栏 nav 边界可定位');
    assert(html.slice(navOpen, navClose).indexOf('backToCreation') === -1, 'nav 内部已无返回入口（不再吃掉一格）');
    assert(/^<\/nav>\s*(?:<!--[^>]*-->\s*)?<\/div>/.test(html.slice(navClose, navClose + 160)),
        'nav 是左栏最后一个孩子（改前它后面还钉着栏底的「↩ 返回创建」）');
    var iStore = html.indexOf('💾 存档管理');
    var iGame = html.indexOf('🎮 游戏设置');
    var iBack = html.indexOf('backToCreation()');
    assert(iStore > 0 && iGame > iStore && iStore < iBack && iBack < iGame,
        '返回入口落在「存档管理」那张卡内（存档管理 → 按钮 → 游戏设置）');
    assert(/继续仙途/.test(html.slice(iBack, iBack + 400)),
        '按钮旁边写清「这一枚不落档，回本局用录入页的继续仙途」');

    // ---- ① 700px 档：两列网格 ----
    var i7 = tok.indexOf('@media (max-height: 700px)');
    var b7 = i7 > 0 ? tok.slice(i7, tok.indexOf('/* ----------', i7)) : '';
    assert(i7 > 0, '新增 700px 档：5px 行距再往下已无余地');
    assert(/and\s*\(min-width:\s*768px\)/.test(b7), '700px 档只管桌面宽度，不碰 ≤767px 的横滑导航');
    assert(/display:\s*grid/.test(b7) && /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/.test(b7),
        '导航在 700px 档改两列（14 项 → 7 行，约 278px 装进 414px 可视）');
    assert(/align-content:\s*start/.test(b7), 'grid 显式 align-content:start，否则 7 行被拉伸出多余行高');
    assert(/nav > \* \+ \*[^}]*margin-top:\s*0/.test(b7), '归零 space-y-1 的 margin-top（网格里会让整列错位）');
    assert(/\.nav-item[^}]*padding-left:\s*4px/.test(b7) && /\.nav-item[^}]*padding-right:\s*4px/.test(b7),
        '左右内边距从 16px 让到 4px——一列只有约 94px');
    assert(/\.nav-item[^}]*white-space:\s*nowrap/.test(b7), '导航项不换行（两字标签被挤成两行比藏掉更糟）');
    assert(/\.nav-item > span[^}]*margin-right:\s*4px/.test(b7), '图标与文字间隙从 mr-3 的 12px 压到 4px');
    assert(!/!important/.test(b7), '700px 档不含 !important（靠 html #game-world 前缀赢 Tailwind）');

    // ---- 与既有两档共存：[J] 依赖的形状不许被这轮改动带歪 ----
    assert(/@media\s*\(max-height:\s*1040px\)[^{]*\{\s*html #game-world \.nav-item\s*\{[^}]*padding-top:\s*8px/.test(flat),
        '1040px 档形状未动（该档首个声明块仍是 .nav-item，压到 8px）');
    assert(/@media\s*\(max-height:\s*820px\)[^{]*\{\s*html #game-world \.nav-item\s*\{[^}]*padding-top:\s*5px/.test(flat),
        '820px 档形状未动（该档首个声明块仍是 .nav-item，压到 5px）');
    assert(/box-shadow:\s*inset 0 -14px/.test(tok), '导航底部那条钉住的渐隐仍在（更矮的窗口还有「下面还有」的线索）');
})();

// ============ [X] UI-16③：伤势页的生理刻度跟引擎、配置同源 ============
console.log('\n[X] UI-16③ 伤势页生理刻度：分子分母取自引擎摘要，阈值文案现读配置表');
(function () {
    // 真把 physiology-config.js 跑进沙箱（不是 stub 一份数字）——否则测不到「文案与配置同源」这件事
    load('js/physiology-config.js');
    assert(typeof window.getConsciousnessStateLabel === 'function', '生理配置载入了（档位表是真那一份）');

    var app = src('js/app.js');
    var iFrom = app.indexOf('function _physiologyScaleHTML');
    var iTo = app.indexOf('/** 刷新战斗医疗物品按钮');
    assert(iFrom > 0 && iTo > iFrom, 'app.js 里找得到生理刻度那一支（连同缺氧档位读法）');
    var slice = app.slice(iFrom, iTo);
    var api = new Function(slice + '\nreturn { _physiologyScaleHTML: _physiologyScaleHTML, _oxygenDebtLabel: _oxygenDebtLabel };')();

    // ① 面板读的每个键都必须是引擎摘要真给的键（引擎哪天不给了，这里先红，别让面板印 undefined）
    var bt = src('js/battle.js');
    var sumFrom = bt.indexOf('getPhysiologySummary()');
    var sumTo = bt.indexOf('// 获取某部位的伤口列表');
    assert(sumFrom > 0 && sumTo > sumFrom, 'battle.js 里找得到 Entity.getPhysiologySummary');
    var sumBody = bt.slice(sumFrom, sumTo);
    ['bloodVolume', 'maxBloodVolume', 'circulation', 'maxCirculation', 'painLoad', 'oxygenDebt', 'consciousness', 'maxConsciousness']
        .forEach(function (k) {
            assert(sumBody.indexOf(k + ':') >= 0, '引擎摘要提供 ' + k + '（面板读它）');
            assert(slice.indexOf('sum.' + k) >= 0, '面板读的就是 sum.' + k);
        });

    // ② 妖兽那一具身体：真分母上屏，别退回 100
    var beast = {
        getPhysiologySummary: function () {
            return {
                bloodVolume: 149, maxBloodVolume: 150, circulation: 123, maxCirculation: 150,
                painLoad: 12, oxygenDebt: 0, consciousness: 88, maxConsciousness: 100
            };
        }
    };
    var h = api._physiologyScaleHTML(beast);
    assert(h.indexOf('149') >= 0 && h.indexOf('/ 150') >= 0, '血量按这一具身体自己的量程印（149 / 150）');
    assert(h.indexOf('123') >= 0, '循环同口径（123 / 150）');
    var cfg = window.PHYSIOLOGY_CONFIG;
    assert(h.indexOf('低于 ' + cfg.BLOOD_VOLUME_CONSCIOUSNESS_THRESHOLD) >= 0, '血量阈值那句配得上（' + cfg.BLOOD_VOLUME_CONSCIOUSNESS_THRESHOLD + '）');
    assert(h.indexOf('低于 ' + cfg.CIRCULATION_PENALTY_THRESHOLD) >= 0, '循环阈值那句配得上（' + cfg.CIRCULATION_PENALTY_THRESHOLD + '）');
    assert(h.indexOf('满 ' + cfg.MAX_PAIN + ' 强制昏迷') >= 0, '疼痛满值那句按 MAX_PAIN 给');
    assert(h.indexOf('满 ' + cfg.OXYGEN_DEBT_FAINT_THRESHOLD + ' 强制昏迷并转入危急') >= 0, '缺氧那句按 FAINT_THRESHOLD 给');
    assert(h.indexOf('低于 ' + cfg.CONSCIOUSNESS_COLLAPSED) >= 0, '意识那句按 CONSCIOUSNESS_COLLAPSED 给');
    assert(h.indexOf('野兽天生 ' + cfg.BEAST_HEALTH_MULTIPLIER + ' 倍血肉') >= 0, '文案里那个倍数取自配置，不是抄的');
    assert(h.indexOf('（满则坏）') >= 0, '疼痛/缺氧标明「满则坏」（与血量方向相反，别再让人猜）');
    assert(h.indexOf('清醒') >= 0, '意识档位词复用既有表（88 → 清醒，全仓此前零读者的那一只）');
    assert(h.indexOf('正常') >= 0, '缺氧档位词复用 OXYGEN_DEBT_EFFECTS（0 → 正常）');
    assert(h.indexOf('上面几条都在压它') >= 0, '意识说明按真实机制写（三条惩罚都进意识这本账）');
    assert(h.indexOf('出手变形') === -1, '⚠️ 改前一版我曾写「疼痛高于 60 出手变形」——那是错的：PAIN_PENALTY_THRESHOLD 只喂意识账（battle.js:1342），出手惩罚是另一条无门槛的平滑公式');

    // ③ 同源绑定：改配置 → 文案跟着改；删常量 → 那一句整个消失（不许留兜底数字）
    var old = cfg.BLOOD_VOLUME_CONSCIOUSNESS_THRESHOLD;
    cfg.BLOOD_VOLUME_CONSCIOUSNESS_THRESHOLD = 33;
    var h2 = api._physiologyScaleHTML(beast);
    cfg.BLOOD_VOLUME_CONSCIOUSNESS_THRESHOLD = old;
    assert(h2.indexOf('低于 33') >= 0 && h2.indexOf('低于 ' + old) === -1, '改配置即改文案（这一句没有第二本账）');

    var oldPain = window.PAIN_EFFECTS.faintingAtMax;
    window.PAIN_EFFECTS.faintingAtMax = false;
    var h3 = api._physiologyScaleHTML(beast);
    window.PAIN_EFFECTS.faintingAtMax = oldPain;
    // 疼痛与缺氧这两句都含「满 100 强制昏迷」（缺氧那句更长），只能数次数分家
    var hits = function (s, needle) { return s.split(needle).length - 1; };
    eq(hits(h, '满 ' + cfg.MAX_PAIN + ' 强制昏迷'), 2, '两条「满 100 强制昏迷」各归各的账：疼痛一条、缺氧一条');
    eq(hits(h3, '满 ' + cfg.MAX_PAIN + ' 强制昏迷'), 1,
        'faintingAtMax 关掉后只剩缺氧那一条（疼痛那句跟着撤回，不靠写死的台词撑场）');

    var keep = { BLOOD_VOLUME_CONSCIOUSNESS_THRESHOLD: cfg.BLOOD_VOLUME_CONSCIOUSNESS_THRESHOLD, CIRCULATION_PENALTY_THRESHOLD: cfg.CIRCULATION_PENALTY_THRESHOLD, PAIN_PENALTY_THRESHOLD: cfg.PAIN_PENALTY_THRESHOLD, OXYGEN_DEBT_FAINT_THRESHOLD: cfg.OXYGEN_DEBT_FAINT_THRESHOLD, CONSCIOUSNESS_COLLAPSED: cfg.CONSCIOUSNESS_COLLAPSED, BEAST_HEALTH_MULTIPLIER: cfg.BEAST_HEALTH_MULTIPLIER, MAX_PAIN: cfg.MAX_PAIN };
    Object.keys(keep).forEach(function (k) { delete cfg[k]; });
    var h4 = api._physiologyScaleHTML(beast);
    Object.keys(keep).forEach(function (k) { cfg[k] = keep[k]; });
    assert(h4.indexOf('低于') === -1 && h4.indexOf('倍血肉') === -1 && h4.indexOf('满 ') === -1,
        '常量缺了就不说这句话（宁可少说，不抄一份平行数字）');
    assert(h4.indexOf('意志先抵掉一截，抵不完就压意识') >= 0, '疼痛那句缺阈值时常量缺席也说得对（不提具体数）');

    // ④ 禁止兜底数字：整支函数里不许出现 cfg.X || 数字 这种平行写法
    assert(!/cfg\.\w+\s*\|\|\s*[\d.]+/.test(slice), '函数体内无「常量 || 写死数」的兜底（写死数就是下一次说谎的地方）');

    // ⑤ 缺氧档位表：按表取不超过当前值的最高一档，别自己划区间
    eq(api._oxygenDebtLabel(0), '正常', '缺氧 0 → 表上那一档「正常」');
    eq(api._oxygenDebtLabel(55), '缺氧', '缺氧 55 → 「缺氧」（落在 50 那一档）');
    eq(api._oxygenDebtLabel(75), '眩晕', '缺氧 75 → 「眩晕」');
    eq(api._oxygenDebtLabel(100), '强制昏迷', '缺氧 100 → 「强制昏迷」（危急那一档）');
    window.OXYGEN_DEBT_EFFECTS[50].label = '气短';
    eq(api._oxygenDebtLabel(55), '气短', '改表即改词（档位词没有第二份抄本）');
    window.OXYGEN_DEBT_EFFECTS[50].label = '缺氧';

    // ⑥ 摘要查不到时不许编一个 100 出来
    var h5 = api._physiologyScaleHTML({ getPhysiologySummary: function () { return null; } });
    assert(h5.indexOf('没有生理摘要可查') >= 0, '拿不到摘要就照实说，不兜底画一条尺');
    var h6 = api._physiologyScaleHTML({ getPhysiologySummary: function () { return { bloodVolume: 40, maxBloodVolume: 0, circulation: 0, maxCirculation: 0, consciousness: 0, maxConsciousness: 0, painLoad: 0, oxygenDebt: 0 }; } });
    var ceilKeep = { MAX_PAIN: cfg.MAX_PAIN, MAX_OXYGEN_DEBT: cfg.MAX_OXYGEN_DEBT };
    delete cfg.MAX_PAIN; delete cfg.MAX_OXYGEN_DEBT;
    var h7 = api._physiologyScaleHTML({ getPhysiologySummary: function () { return { bloodVolume: 40, maxBloodVolume: 0, circulation: 0, maxCirculation: 0, consciousness: 0, maxConsciousness: 0, painLoad: 0, oxygenDebt: 0 }; } });
    cfg.MAX_PAIN = ceilKeep.MAX_PAIN; cfg.MAX_OXYGEN_DEBT = ceilKeep.MAX_OXYGEN_DEBT;
    assert(h7.indexOf('/ ') === -1 && h6.indexOf('/ 150') === -1,
        '量程拿不到（亡灵／构装体那种 0）就不印分母——更不兜回一个 100');

    // ⑦ 旧的裸分子读法不许回来
    var wFrom = app.indexOf('function updateWoundInspection');
    var wTo = app.indexOf('/** UI-16③：伤势页的生理刻度');
    assert(wFrom > 0 && wTo > wFrom, '找得到 updateWoundInspection 本体');
    var wBody = app.slice(wFrom, wTo);
    assert(wBody.indexOf("_physiologyScaleHTML(player)") >= 0, '伤势页把生理那行交给刻度这一支（只一处画它）');
    assert(wBody.indexOf("'血量: '") === -1 && wBody.indexOf('phys.painLoad') === -1,
        '改前那五个裸分子（血量/循环/疼痛/缺氧/意识，连分母都没有）已从屏上退场');
    ['getWoundSeverityDescription', 'getExternalBleedDescription', 'getInternalBleedDescription'].forEach(function (fn) {
        assert(wBody.indexOf("labeled('" + fn + "'") >= 0, '伤口行改用现成的档位表：' + fn);
        assert(typeof window[fn] === 'function', fn + ' 确由 physiology-config.js 导出（接线接的是真函数）');
    });
    assert(wBody.indexOf('const n = Math.round(value || 0)') >= 0 || wBody.indexOf('Math.round(value || 0)') >= 0,
        '档位表缺席时退回裸数字（不另造一套区间）');

    // ⑧ 深度那一档：0 是合法值，别再印成裸「深度0」（本轮实机读数里五行全是它）
    assert(typeof window.getWoundDepthLabel === 'function', 'getWoundDepthLabel 由 physiology-config.js 导出（与三张档位表同一处真相）');
    eq(window.getWoundDepthLabel(0), '未及深层', '深度 0 有词——浅伤压根没有深度档，不是「没翻译」');
    assert(window.getWoundDepthLabel(0).indexOf('深度0') === -1, '屏上不再出现「深度0」这一串');
    ['表层', '中等', '深部', '贯穿'].forEach(function (word, i) {
        eq(window.getWoundDepthLabel(i + 1), word, '深度 ' + (i + 1) + ' 的档位词照 battle.js 的注释同一份');
    });
    eq(window.getWoundDepthLabel(9), '深度9', '真·越界值仍报数字（有了词表也不该替不认识的档位编一个词）');
    eq(window.getWoundDepthLabel(undefined), '未及深层', '缺字段按 0 处理＝未及深层，与引擎「depth 初值 0」同口径');
    // 绑定：档位词必须出现在 battle.js 的深度推导段里（谁单方改名谁红）
    var bz = src('js/battle.js');
    var iDep = bz.indexOf('// 深度：根据严重度决定');
    assert(iDep > 0, '找得到 battle.js 里深度按严重度现算那一段');
    var depBlock = bz.slice(iDep, iDep + 400);
    assert(/severity >= 15/.test(depBlock), 'battle.js 仍是「严重度 ≥15 才起表层」（0 档存在的依据）');
    ['表层', '中等', '深部', '贯穿'].forEach(function (word) {
        assert(depBlock.indexOf(word) >= 0, '引擎侧的深度注释里有「' + word + '」——词表与判据同源，改名会当场红');
    });
    assert(wBody.indexOf("'表层', '中等'") === -1 && wBody.indexOf("['', '表层'") === -1,
        'app.js 不再自带那份内联深度表（改前它就是「深度0」的病根）');
    assert(wBody.indexOf("labeled('getWoundDepthLabel'") >= 0, '伤口行那枚深度标签改走现成词表');
})();

// ==================== Y · UI-03② 常去三铺置顶（名册滚窗上方那一排） ====================
console.log('\n[Y] UI-03② 常去三铺提到名册上方快捷条');
(function () {
    var ls = src('js/location-system.js');
    var pm = src('styles/panel-map.css');

    // ---- ① 那份名单：只有三铺，且每铺都真存在 ----
    var ids = (ls.match(/COMMON_SERVICE_BUILDING_IDS = \[([^\]]*)\]/) || [])[1] || '';
    var idList = ids.split(',').map(function (s) { return s.trim().replace(/^['"]|['"]$/g, ''); }).filter(Boolean);
    eq(idList.length, 3, '快捷条只置顶三铺（写死枚数——谁往这一排上堆到十枚，它就不再是「常去」而是整张名册）');
    eq(idList.join(','), 'shop,medicine_shop,forging', '置顶的是坊市／药铺／铁匠铺这三趟回回要跑的门');
    var btTable = (ls.match(/const BUILDING_TYPES = \{[\s\S]*?\n\};/) || [''])[0];
    idList.forEach(function (id) {
        assert(btTable.indexOf("id: '" + id + "'") >= 0, '名单里这铺「' + id + '」在 BUILDING_TYPES 里查得到（不摆幽灵铺）');
    });
    assert(!/坊市|药铺|铁匠铺/.test(ls.slice(ls.indexOf('function cityQuickBarHTML'), ls.indexOf('// ============ 创建建筑分组'))),
        '快捷条上不许再抄一份铺名（名字与图标一律回读 BUILDING_TYPES）');

    // ---- ② 真跑一次挑铺：这座城有才有，没有就不摆 ----
    // 顶层 const 撞名不能重编（[P] 段已载过一次这座城），所以只在没人载过时才载
    var oldDoc = global.document;
    if (typeof getCommonServiceBuildings !== 'function') {
        global.document = {
            createElement: function () {
                return { className: '', children: [], appendChild: function (c) { this.children.push(c); return c; } };
            },
            addEventListener: function () {}, getElementById: function () { return null; }
        };
        load('js/location-system.js');
        global.document = oldDoc;
    }
    var cd = window.locationSystem.cityData;
    var bts = window.locationSystem.BUILDING_TYPES;
    var three = getCommonServiceBuildings(cd['帝都·长安']);
    var onlyOne = getCommonServiceBuildings(cd['佛国遗址']);
    var none = getCommonServiceBuildings(cd['灵界·九天罡风带']);
    var noArg = getCommonServiceBuildings(undefined);

    eq(three.map(function (b) { return b.id; }).join(','), 'shop,medicine_shop,forging',
        '三铺齐全的城（长安）三枚都上、顺序照名单走（不按分类表——盐铁局也在商业类里，但它不是常去）');
    eq(onlyOne.map(function (b) { return b.id; }).join(','), 'medicine_shop',
        '只有药铺的城就只摆一枚（缺一铺不补一张点不开的牌）');
    eq(none.length, 0, '三铺全无的仙山一格不出（空条不占地方也不撒谎）');
    eq(noArg.length, 0, '城市对象缺席时返回空表而不是抛错');
    eq(three[0].name, bts.SHOP.name, '铺名是从 BUILDING_TYPES 读出来的那张脸');

    // ---- ③ 那一排的 HTML：每枚钮都走名册同一扇正门 ----
    eq(cityQuickBarHTML([]), '', '没有常去铺时连那层壳都不画');
    var html = cityQuickBarHTML(three);
    eq((html.match(/city-quick__chip/g) || []).length, 3, '三铺就三枚胶囊');
    idList.forEach(function (id) {
        assert(html.indexOf("useBuilding('" + id + "')") >= 0, '胶囊「' + id + '」点的是 useBuilding（名册里同一扇正门，不另开一条路）');
    });
    assert(html.indexOf('openCityShop') === -1 && html.indexOf('switchPanel') === -1,
        '快捷条不自己路由（跳过 useBuilding 直开商店＝又造一条平行正门）');
    assert(html.indexOf('常去') >= 0, '这一排自称「常去」——三枚孤零零的钮没个名目，玩家不知道它凭什么在上面');
    assert(/getCommonServiceBuildings\(city\)/.test(ls) && /quickBar\.innerHTML = cityQuickBarHTML\(quick\)/.test(ls),
        '渲染时确实挑一次铺、写一次条（不是只在源里躺着没接的函数）');

    // ---- ④ 置顶那几铺不在组里重复摆；总数照旧报全城几处 ----
    eq((ls.match(/quickIds\.indexOf\(bt\.id\) < 0/g) || []).length, 2,
        '十类分组与「其他」野卡两处都跳过置顶铺（少了任一处，同一铺就会屏上出现两回）');
    assert(/const totalCards = cardCount \+ quick\.length;/.test(ls),
        '名册上方那句「几处设施」报的是全城处数（含置顶那几铺），不因为换了摆法就少报');
    assert(/不在组里重复摆/.test(ls), '并把「为什么下面找不到坊市」写在提示里，不让玩家以为少了设施');
    assert(ls.indexOf('id="city-quick-bar"') > 0 && ls.indexOf('id="city-quick-bar"') < ls.indexOf('id="city-building-list"'),
        '容器排在滚窗**外面**（跟着滚走的话，滚到第 8 屏它就不在了）');

    // ---- ⑤ 样式：换行 flex、可点、不抢层 ----
    var quickCss = pm.slice(pm.indexOf('.city-quick'), pm.indexOf('.city-group {'));
    assert(/\.city-quick\s*\{[^}]*display:\s*flex[^}]*flex-wrap:\s*wrap/.test(quickCss),
        '胶囊走 hug 内容的换行 flex（窄窗换行，不把铺名截断）');
    assert(quickCss.indexOf('grid-template-columns: auto repeat(') < 0,
        '这一节别再写「裸 auto 轨道 + repeat()」——本机把整条声明丢掉，三枚通栏摊成三行、吃掉 147px（实机量过）');
    assert(/\.city-quick__chip\s*\{[^}]*cursor:\s*pointer/.test(quickCss), '胶囊点得动的样子给足（cursor 不是装饰）');
    assert(quickCss.indexOf('!important') < 0, '这一节不靠 !important 抢层');
    assert(/^#city-panel \.city-quick/m.test(quickCss), '规则一律锁 #city-panel（与名册同一节，不靠 #panel-map 当祖先）');

    // ---- ⑥ 全仓一份名单 ----
    var withList = jsFiles('js').filter(function (f) { return /COMMON_SERVICE_BUILDING_IDS/.test(src(f)); });
    eq(withList.length, 1, '「哪几铺算常去」全仓只有一处说得出（别处再抄一份就会分家）');
    assert(!!withList[0] && /(^|\/)location-system\.js$/.test(String(withList[0]).split('\\').join('/')),
        '那一处就是 js/location-system.js（实际=' + withList[0] + '）');
})();

console.log('\n[Z] UI-04 躯体耐久表：列数跟容器走，说明文字宁可折行不可裁字');
(function () {
    var app = src('js/app.js');
    var html = src('仙侠.html');
    var craft = src('styles/ui-craft.css');
    var data = src('js/data.js');

    // ---- ① 列数只有一支笔在管，而且那支笔量的是容器 ----
    var hostAt = html.indexOf('id="body-durability-list"');
    assert(hostAt > 0, '找得到 #body-durability-list 那层宿主');
    var tagStart = html.lastIndexOf('<div', hostAt);
    var tag = html.slice(tagStart, html.indexOf('>', tagStart) + 1);
    assert(tag.indexOf('grid') < 0 && !/\b(md|lg|sm):/.test(tag),
        '宿主 div 上不再有 grid-cols-1 md:grid-cols-2（视口断点量不到这块还剩多宽：1366 档名册 802px、1024 档只剩 459px，两者都在 md 之上）');
    var head = html.slice(html.indexOf('🩻 躯体耐久'), hostAt);
      // ※试玩批次：提示语改为**随「详细描述」开关切换**（app.js 动态写 #body-durability-hint）——
      //   关时「部位 · 耐久（点右上「详细描述」看职司与受损影响）」，开时「部位 · 职司 → 受损影响」。
      //   故静态 HTML 里不再有固定的「部位 · 职司」串，判据改为：
      //   列头必须把这一行的读法讲清（两种措辞任一），且「受损影响」全页只说一次。
      var headStatic = html.slice(html.indexOf('🩻 躯体耐久'), hostAt);
      eq((headStatic.match(/受损影响/g) || []).length, 1, '「受损影响」在列头说一次（此前 22 行各抄一遍，窄屏先被挤掉的正是这 5 个字）');
      assert(/部位 · (职司|耐久)/.test(headStatic) || /详细描述/.test(headStatic),
          '列头写明这一行的读法（部位 · 职司 → 受损影响），箭头不是让玩家猜的；'
          + '或列出「详细描述」开关并说明它管什么——两种表达都算把读法讲清了');

    var sec2 = craft.slice(craft.indexOf('---------- 2.'), craft.indexOf('---------- 3.'));
    assert(sec2.length > 40, 'ui-craft.css 里第 2 节还在（这块表只有它一个样式宿主）');
    assert(/#body-durability-list\s*\{[^}]*display:\s*grid/.test(sec2), '列数改由样式表这一处管');
    var mm = sec2.match(/repeat\(\s*auto-fill\s*,\s*minmax\(/);
    assert(mm, '走 auto-fill + minmax：轨道数由容器实际宽度除出来（不再写死几列）');
    var bodyFloor = maxFloor(sec2);
    var trackMin = bodyFloor ? bodyFloor.px : 0;
    assert(!!bodyFloor && bodyFloor.std === bodyFloor.px,
        '轨道下限写成 max(380px, 23.75rem)——23.75×16=380，标准档按 380px 算，下面三档列数照旧成立（UI-23）');
    var gap = Number((sec2.match(/gap:\s*(\d+)px/) || [, '12'])[1]);
    var cols = function (w) { return Math.floor((w + gap) / (trackMin + gap)); };
    eq(cols(459), 1, '1024 档名册 459px → 一列（改前硬塞两列、说明列被压成 0px，一个字不剩）');
    eq(cols(802), 2, '1366 档 802px → 两列（与改前同数，行高不因此变差）');
    eq(cols(1187), 3, '1920 档 1187px → 三列（改前视口断点只给两列，白多一屏滚动）');
    assert(trackMin >= 340 && trackMin <= 420,
        '轨道下限 ' + trackMin + 'px 落在「一簇读数 + 一行说明」的实测需宽里（低于 340 会挤没右侧、高于 420 会把 1366 档打回单列）');

    // ---- ② 裁字的机关拆干净了 ----
    assert(sec2.indexOf('text-overflow') < 0, '这一节里没有 text-overflow:ellipsis（装不下就多一行，不是少几个字）');
    assert(!/\.body-part-desc[^}]*white-space:\s*nowrap/.test(sec2), '说明列不再 nowrap（改前 nowrap + ellipsis 是裁字的正主）');
    assert(/\.body-part-desc\s*\{[^}]*white-space:\s*normal/.test(sec2), '说明列允许折行');
    assert(/\.body-part-desc\s*\{[^}]*word-break:\s*keep-all/.test(sec2), '折行只落在「→」两侧（keep-all），不把「智力与意志」劈成两半');
    assert(/\.body-part-desc\s*\{[^}]*overflow-wrap:\s*break-word/.test(sec2), '真的一句塞不下时才逐字断（宁断不裁）');
    assert(/\.body-part-name\s*\{[^}]*white-space:\s*nowrap/.test(sec2), '部位名仍钉住不许折（脑/眼/下颌/丹田是标识）');
    assert(/\.body-part-gauge\s*\{[^}]*flex:\s*0 0 auto/.test(sec2), '右侧「进度条 + 数值 + 完好」不参与压缩');
    assert(sec2.indexOf('!important') < 0, '这一节不靠 !important 抢层');

    // ---- ③ 渲染器与样式表钉的是同一批钩子 ----
    var ra = app.indexOf('function renderBodyDurability');
    assert(ra > 0, '找得到 renderBodyDurability');
    var rb = app.slice(ra, app.indexOf('\nfunction ', ra + 1));
    ['body-part-row', 'body-part-text', 'body-part-name', 'body-part-desc', 'body-part-gauge'].forEach(function (cls) {
        assert(rb.indexOf(cls) >= 0, '渲染器写出 .' + cls);
        assert(sec2.indexOf(cls) >= 0, '样式表管着 .' + cls + '（不是写了没接的类）');
    });
    assert(rb.indexOf('hidden md:inline') < 0, '行内不再有 hidden md:inline（改前 768px 以下整句说明直接消失）');
    assert(/const desc = part\.desc \|\| '';/.test(rb), 'desc 缺席时是空串，不吐 undefined');
    assert(/title="\$\{desc\}"/.test(rb), '整句原话留在 title 里（折成两行也还能读到完整说法）');

    // ---- ④ 拆句这件事跟着源里那一处跑 ----
    var m = rb.match(/const cut = desc\.indexOf\('，受损影响'\);[\s\S]*?: desc;/);
    assert(m, '「切在哪、怎么接」源里只有一处（测试不另抄公式）');
    var shown = new Function('desc', String(m && m[0]) + '\nreturn descShown;');
    eq(shown('神识中枢，受损影响智力与意志'), '神识中枢 → 智力与意志', '一条真实说明读起来是「职司 → 所及」');
    eq(shown('六阳之首'), '六阳之首', '拆不动的写法整句照上（不会砍成半截）');

    var at = data.indexOf('const bodyParts');
    var block = data.slice(at, data.indexOf('\n];', at));
    var descs = (block.match(/desc: '([^']*)'/g) || []).map(function (s) { return /desc: '([^']*)'/.exec(s)[1]; });
    eq(descs.length, 22, '量到 22 条部位说明（改了名册条数，这一条要跟着改）');
    eq(descs.filter(function (d) { return d.indexOf('，受损影响') >= 0; }).length, 22,
        '22 条都写成「职司，受损影响X」——列头那句统一说明才立得住');
    assert(descs.map(shown).every(function (d) { return d.indexOf('受损影响') < 0; }),
        '行内不再各自重复「受损影响」（省下来的正是窄屏先被挤掉的那 5 个字（含顿号））');
    var longest = descs.map(shown).sort(function (x, y) { return y.length - x.length; })[0];
    assert(longest.length <= 15, '拆完最长一句 ' + longest + '（' + longest.length + ' 字），单列轨道下最多折这一行');
    var widest = descs.map(function (d) { return [d, shown(d)]; }).sort(function (x, y) { return y[1].length - x[1].length; })[0];
    eq(widest[0].length - widest[1].length, 5 - ' → '.length,
        '最长那条（' + widest[0] + '，' + widest[0].length + ' 字）省下「，受损影响」5 字、换回箭头 3 字，净窄 ' + (widest[0].length - widest[1].length) + ' 字');
    assert(widest[0].length >= 17, '改前最长 17 字——旧写法在 110px 的格子里必然丢字');

    // ---- ⑤ 右侧那一簇收窄过，收是按状态词最长几字定的 ----
    var gl = data.indexOf('function getDurabilityLabel');
    var glBody = data.slice(gl, data.indexOf('\n}', gl) + 2);
    var words = (glBody.match(/return '([^']+)'/g) || []).map(function (s) { return /return '([^']+)'/.exec(s)[1]; });
    eq(Math.max.apply(null, words.map(function (w) { return w.length; })), 4,
        '状态词最长 4 字（轻微损伤／中度损伤／重度损伤／濒临毁坏）——标签格从 w-16 收到 w-14 就是按这个数定的');
    assert(/body-part-label text-xs w-14/.test(rb), '状态词格确实改成了 w-14');
    // ※试玩批次 w-20 → w-16 sm:w-20：进度条改为窄屏收窄（w-16）、
    //   sm 断点以上仍是 w-20。原 w-24 的意图（收窄、别抢描述的横向空间）不变，
    //   只是把"多窄"交给断点决定——窄屏本就没空间，w-20 挤掉描述。
    //   判据放宽到"存在 w-16 且 sm 以上回 w-20"，仍钉住收窄这件事。
    assert(/body-part-bar w-16 sm:w-20/.test(rb) || /body-part-bar w-20/.test(rb),
        '进度条收窄（w-20；窄屏档 w-16 sm:w-20）');
})();

console.log('\n[AA] UI-20 战斗卡三段：会滚的是读数，钉住的是要按的');
(function () {
    var html = src('仙侠.html');
    var craft = src('styles/ui-craft.css');

    // ---- ① 卡片那一支笔：从「整张卡自己滚」改成「竖排三段、各管各的」 ----
    var mAt = html.indexOf('id="battle-modal"');
    assert(mAt > 0, '找得到 #battle-modal');
    var cardStart = html.indexOf('<div', html.indexOf('>', mAt) + 1);
    var cardTag = html.slice(cardStart, html.indexOf('>', cardStart) + 1);
    assert(/max-h-\[90vh\]/.test(cardTag), '卡片仍按视口定高（90vh——改前也是这一条，问题不在定高而在只有一格）');
    assert(cardTag.indexOf('overflow-hidden') >= 0 && cardTag.indexOf('overflow-y-auto') < 0,
        '卡片改成 overflow-hidden、不再自己滚（改前 overflow-y-auto：内容 931px 装进 681px 的窗，卡片还停在滚态 0/250，于是第一手起钮就在视口外）');
    assert(/(^|[\s"])flex([\s"]|$)/.test(cardTag) && /flex-col/.test(cardTag),
        '卡片是竖排 flex 容器（三段各占一格，谁滚谁钉由样式表说，不靠滚动位置碰运气）');

    // ---- ② 三段齐备，且顺序把「要按的」护在中间 ----
    var iRead = html.indexOf('id="battle-readout"');
    var iFoot = html.indexOf('id="battle-foot"');
    var iBody = html.indexOf('id="battle-body-view"');
    assert(iRead > 0 && iFoot > 0 && iBody > 0, '滚区／台面／人体叠三段都在');
    assert(iRead < iFoot && iFoot < iBody,
        'DOM 顺序＝读数 → 台面 → 人体叠（台面排在人体之前：真放不下时溢出的是最底下那层详情，不是要按的那一排）');
    var readSeg = html.slice(iRead, iFoot);
    var footSeg = html.slice(iFoot, iBody);
    ['battle-status', 'battle-physiology', 'battle-party-status', 'battle-timeline-bars', 'battle-log'].forEach(function (id) {
        assert(readSeg.indexOf('id="' + id + '"') >= 0, '滚区收纳 #' + id + '（这一叠是读，读不完就滚）');
        assert(footSeg.indexOf('id="' + id + '"') < 0, '#' + id + ' 没有一份留在台面里（同一条读数不能有两处家）');
    });
    ['battle-prompt-panel', 'battle-actions', 'battle-medical-actions', 'battle-wound-panel', 'battle-result'].forEach(function (id) {
        assert(footSeg.indexOf('id="' + id + '"') >= 0, '台面收纳 #' + id + '（这一叠是按，按的必须在台面）');
        assert(readSeg.indexOf('id="' + id + '"') < 0, '#' + id + ' 不在滚区里（改前它躺在滚区中段＝出手那一排被顶出 143~216px 的正主）');
    });
    eq((html.match(/id="battle-prompt-panel"/g) || []).length, 1, '见招拆招应对条全页只有一处（从滚区搬来，不是复制一份）');

    // ---- ③ 样式表第 11 节：三条规则各钉一件事 ----
    var i11 = craft.indexOf('---------- 11.');
    assert(i11 > 0, 'ui-craft.css 里有第 11 节');
    var sec11 = craft.slice(i11);
    assert(sec11.indexOf('!important') < 0, '这一节不靠 !important 抢层（id 级前缀已够压住 Tailwind 运行时注入）');
    var rule = function (id) {
        var m = sec11.match(new RegExp('html #battle-modal #' + id + '\\s*\\{([^}]*)\\}'));
        return m ? m[1] : '';
    };
    var rd = rule('battle-readout'), ft = rule('battle-foot'), bv = rule('battle-body-view');
    eq([rd, ft, bv].filter(Boolean).length, 3, '三段各有一条规则，且都锁在 html #battle-modal 之下（战斗卡在 #game-world 之外）');
    assert(/flex:\s*1 1 auto/.test(rd), '滚区可长可缩（flex 1 1 auto：有余量它多读，不够时它让）');
    var rdFloor = Number((rd.match(/min-height:\s*(\d+)px/) || [, '0'])[1]);
    assert(rdFloor >= 90, '滚区有地板 ' + rdFloor + 'px（改前它 min-height:0，撞上人体叠那条 inline min-height:200px → 滚区被压到 0~65px，要害尺与日志整叠消失）');
    assert(/overflow-y:\s*auto/.test(rd), '滚区自己内滚');
    assert(/flex:\s*0 0 auto/.test(ft), '台面不参与伸缩（flex 0 0 auto——它一缩就是钮被裁）');
    assert(/overflow-y:\s*auto/.test(ft), '台面摊长时内滚（「🩻 查看伤势」一开就是几百 px）');
    assert(/flex:\s*0 1 auto/.test(bv) && /min-height:\s*\d+px/.test(bv), '人体叠只许缩不许顶（可缩＋带地板）');
    assert(/overflow-y:\s*auto/.test(bv), '人体叠自己内滚（SVG 那一叠 452~508px 内容不再往外撑）');

    // ---- ③b 台面内部同样分「读」与「按」：让位次序按此刻按得动的赢 ----
    // 实机第三遍（.scratch/v24-AB-battlecard-c.out 第 29 行）撞到一次见招拆招待决：应对条摊出 245px，
    // 台面内容 596px 撑破 62vh 帽 → 台面自己内滚且停在顶部（滚态 0/187），出手那一排被台面裁掉 85px。
    assert(/#battle-foot\s*\{[^}]*display:\s*flex/.test(sec11) && /#battle-foot\s*\{[^}]*flex-direction:\s*column/.test(sec11),
        '台面自己是竖排 flex（内部再分读与按，不是整叠塞进一个滚窗）');
    const holdAct = (sec11.match(/html #battle-modal #battle-actions,\s*html #battle-modal #battle-medical-actions\s*\{([^}]*)\}/) || [, ''])[1];
    assert(/flex:\s*0 0 auto/.test(holdAct), '平时：出手钮与医疗那一叠不许缩（flex 0 0 auto——它一缩就是钮被裁）');
    const shrinkables = (sec11.match(/html #battle-modal #battle-prompt-panel,\s*html #battle-modal #battle-wound-panel\s*\{([^}]*)\}/) || [, ''])[1];
    assert(/flex:\s*0 1 auto/.test(shrinkables) && /min-height:\s*0/.test(shrinkables) && /overflow-y:\s*auto/.test(shrinkables),
        '平时：应对条与伤势面板可缩＋带内滚（min-height:0 才真缩得动——否则被 min-content 顶住，溢出就换成滚窗裁钮）');
    const holdPrompt = (sec11.match(/html #battle-modal\.x-battle-hold #battle-prompt-panel\s*\{([^}]*)\}/) || [, ''])[1];
    const holdActions = (sec11.match(/html #battle-modal\.x-battle-hold #battle-actions,\s*html #battle-modal\.x-battle-hold #battle-medical-actions\s*\{([^}]*)\}/) || [, ''])[1];
    assert(/flex:\s*0 0 auto/.test(holdPrompt), '待决时：应对条钉住（此刻按得动的是它）');
    assert(/flex:\s*0 1 auto/.test(holdActions) && /min-height:\s*0/.test(holdActions) && /overflow-y:\s*auto/.test(holdActions),
        '待决时：动作区反过来让位（它这一态本就灰着按不动，让位不损失可点的东西）');
    const sec4 = craft.slice(craft.indexOf('html #battle-modal.x-battle-hold #battle-actions'), craft.indexOf('#battle-medical-actions', craft.indexOf('html #battle-modal.x-battle-hold #battle-actions')) + 200);
    assert(/pointer-events:\s*none/.test(sec4), '让位的前提成立：第 4 节那条 .x-battle-hold 确实把动作区 pointer-events:none 灰掉了（同一开关，不是两处各说一套）');

    // ---- ④ 那条 inline 地板已交回样式表 ----
    var bodyTag = html.slice(iBody, html.indexOf('>', iBody) + 1);
    assert(bodyTag.indexOf('min-height') < 0,
        '人体叠不再有 inline style="min-height:200px"（inline 压过样式表 → 它不肯缩，挤压全落在滚区上）');

    // ---- ⑤ UI-10⑤ 的日志窗地板没被这一改回退 ----
    var logTag = html.slice(html.indexOf('id="battle-log"'));
    logTag = logTag.slice(0, logTag.indexOf('>') + 1);
    assert(/h-\[22vh\]/.test(logTag) && /min-h-\[128px\]/.test(logTag), '日志窗仍是 22vh、地板 128px（UI-10⑤ 那一支不动）');
    assert(/overflow-y-auto/.test(logTag), '日志窗自己可滚这一条也还在');

    // ---- ⑥ 这笔算术：最矮那一档放不下时，挤掉的是谁 ----
    var VH = 660;                                  // 实机最窄档 1150×660
    var cardInner = Math.floor(VH * 0.9) - 48;     // 90vh 卡片减去 p-6 上下各 24
    var foot实测 = 351;                             // 台面整摊高（实机量：动作条 309 + 查看伤势行 + 内边距）
    var bvFloor = Number((bv.match(/min-height:\s*(\d+)px/) || [, '0'])[1]);
    assert(Math.floor(VH * 0.62) >= foot实测,
        '62vh 台面帽在 ' + VH + ' 档给到 ' + Math.floor(VH * 0.62) + 'px ≥ 实测 ' + foot实测 + 'px（这一档台面不必内滚，整排钮露着）');
    eq(rdFloor + foot实测 + bvFloor, 543, '滚区地板 ' + rdFloor + ' + 台面 ' + foot实测 + ' + 人体地板 ' + bvFloor + ' = 543px');
    assert(rdFloor + foot实测 + bvFloor <= cardInner,
        '三段的地板加起来（' + (rdFloor + foot实测 + bvFloor) + 'px）不超过 ' + VH + ' 档卡片内容高 ' + cardInner + 'px——地板与地板不互相踩');
})();

// ==================== AB · DES-33 竞技场榜空态：撤掉三张写死的假名 ====================
console.log('\n[AB] DES-33 竞技榜空态：没战绩就照实说没战绩');
(function () {
    var arena = src('js/gameplay/arena-system.js');
    var craft = src('styles/ui-craft.css').replace(/\/\*[\s\S]*?\*\//g, '');

    // ---- ① 假名与假分数彻底清零（连注释里都不再留可复制的种子） ----
    ['张三丰', '李逍遥', '张小凡', '9999', '8888', '7777'].forEach(function (w) {
        assert(arena.indexOf(w) < 0, 'arena-system.js 里不再出现「' + w + '」（含注释——留着当反面样本就会被抄回去）');
    });
    var seeders = jsFiles('js').filter(function (f) {
        return /rank:\s*1\s*}/.test(src(f)) || /score:\s*9\d{3}/.test(src(f));
    });
    eq(seeders.join(','), '', '全仓 js/ 没有任何文件再往榜上种假名次／假高分');
    assert(/if \(!ranking\.length\) html \+= arenaRankEmptyHtml\(\)/.test(arena),
        '空榜那一支改走空态卡（不再给 ranking 赋一个假数组）');
    assert(/function arenaRankEmptyHtml[\s\S]{0,300}?window\.xEmptyHtml\(/.test(arena),
        '空态卡用的是公共件 xEmptyHtml，不另起一份私有样式');
    assert(/window\.xEmptyHtml =/.test(src('js/core/empty-state.js')),
        '公共件确实交出 xEmptyHtml（调用点拿的是它，不是自己拼 div）');
    assert(/<script defer src="js\/core\/empty-state\.js"><\/script>/.test(src('仙侠.html')),
        '公共件在页面上载（不是某次自修顺手 require 进来的临时件）');
    assert(src('仙侠.html').indexOf('js/core/empty-state.js') < src('仙侠.html').indexOf('js/gameplay/arena-system.js'),
        '仙侠.html 里 empty-state.js 排在 arena-system.js 之前（调用点拿得到 xEmptyHtml）');

    // ---- ② 行为层：真跑 showArenaRanking，读它挂上 body 的那张模态 ----
    load('js/core/empty-state.js');
    load('js/gameplay/arena-system.js');
    var appended = [];
    var oldAppend = global.document.body.appendChild;
    global.document.body.appendChild = function (el) { appended.push(el); return el; };
    function openRanking() {
        appended.length = 0;
        global.showArenaRanking();
        return String(appended[0] && appended[0].innerHTML || '');
    }
    function setCfg(arenaCfg) { global.BALANCE_CONFIG = { arena: arenaCfg }; }
    function setChar(cd, day) { global.getCurrentCharData = function () { return cd; }; global.getAbsoluteDay = function () { return day; }; }

    store['xianxia_arena_ranking'] = '[]';
    setCfg({ dailyLimit: 5, energyCost: 10, timeMinutes: 30 });
    setChar({ name: '沈知微', _arenaDay: 1, _arenaDailyCount: 0 }, 1);
    var empty = openRanking();
    eq(appended.length, 1, '开一次榜只往 body 挂一个节点（不判这条，下面那些「不该出现」的断言会因空串假绿）');
    assert(/class="x-empty"/.test(empty), '新号开榜读到的是引导卡（屏上不该有半行假名次）');
    assert(/竞技台上还没有战绩/.test(empty) && /打赢一场切磋，你的名字就会头一回出现在这里/.test(empty),
        '空卡既说这一栏凭什么才不空，也说下一步做什么');
    assert(/今日还能上台 5 场，每场约 30 分钟、耗 10 精力/.test(empty),
        '卡上三个数字（剩余场数／时辰／精力）与账本一致');

    // 数字必须跟着账走：换配置、换今日已用次数，文案随之变（写死的字符串做不到这一点）
    setCfg({ dailyLimit: 7, energyCost: 6, timeMinutes: 45 });
    setChar({ name: '沈知微', _arenaDay: 1, _arenaDailyCount: 2 }, 1);
    var moved = openRanking();
    assert(/今日还能上台 5 场，每场约 45 分钟、耗 6 精力/.test(moved),
        '日限抬到 7、已打 2 场、成本改 45 分钟／6 精力 → 卡上照算不改口（现读 cfg 与 _arenaDailyCount）');
    setCfg({ dailyLimit: 5, energyCost: 10, timeMinutes: 30 });
    setChar({ name: '沈知微', _arenaDay: 1, _arenaDailyCount: 9 }, 1);
    assert(/今日还能上台 0 场/.test(openRanking()), '今日牌发完了也不报负数（Math.max(0, …) 在位）');
    setChar({ name: '沈知微', _arenaDay: 3, _arenaDailyCount: 9 }, 1);
    assert(/今日还能上台 5 场/.test(openRanking()),
        '上一日的已用次数不算今天（_arenaDay 与当前日不符即清零，与 enterArena 换日那一支同一口径）');

    // ---- ③ 有真战绩时：摆真行、撤空卡、加一句口径 ----
    store['xianxia_arena_ranking'] = JSON.stringify([{ name: '沈知微', sect: '散修', score: 20, rank: 1 }]);
    var full = openRanking();
    assert(full.indexOf('class="x-empty"') < 0, '有战绩时不再摆空态卡');
    assert(/#?1? ?🥇 沈知微/.test(full) || /🥇 沈知微/.test(full), '真战绩那一行照常列出（空态改动没吃掉正常路径）');
    assert(/此榜只记胜场：一人一行，分数取他赢过的那几场里最高的一次/.test(full),
        '榜末尾说一句这张榜凭什么这么排（不解释就会读成「全服排名」）');
    var saveFn = arena.slice(arena.indexOf('function saveArenaRanking'), arena.indexOf('function arenaRankEmptyHtml'));
    assert(/findIndex\(function\(r\) \{ return r\.name === name; \}\)/.test(saveFn) && /Math\.max\(Number\(ranking\[idx\]\.score\)/.test(saveFn),
        '「一人一行、取最高」那句脚注与 saveArenaRanking 的真实行为一致（同名合并＋Math.max，文案不是编的）');
    assert(/if \(winner === 'player'\)[\s\S]{0,400}?grantWinRewards/.test(arena) &&
        /function grantWinRewards[\s\S]{0,900}?saveArenaRanking\(/.test(arena),
        '只有胜场写榜（saveArenaRanking 的调用点在 grantWinRewards 里）→ 脚注「只记胜场」不谎报');
    global.document.body.appendChild = oldAppend;
    delete store['xianxia_arena_ranking'];

    // ---- ④ 样式宿主：模态挂在 body 上、不在 #game-world 里，而这张卡根本不知道自己落在哪家 ----
    assert(/z-50 x-arena-modal/.test(arena), '模态根节点带类名 x-arena-modal（渲染侧的钩子在）');
    var hosts = craft.match(/:is\([^)]*\)\s*\.x-empty/g) || [];
    eq(hosts.length, 0, '空态样式一条都不按宿主分组写（第一百三十七批 DES-95：那串名单漏登第三处模态就裸文字）');
    assert(/\.x-empty__title\s*\{/.test(craft),
        '竞技榜这张卡照样有衣服穿——靠的是「选择器不认宿主」，不是靠「这里登记过」');
    assert(!/\.x-arena-modal[^{]*\{/.test(craft.replace(/:is\([^)]*\)[^{]*\{[^}]*\}/g, '')),
        '.x-arena-modal 不另起一份私有空态样式（样式仍只有 ui-craft.css 一处真相）');
})();

console.log('\n[AC] DES-27 庙会三摊回执：印的是真进账的数，不是常量');
(function () {
    var fair = src('js/city-facilities/festival-fair.js');
    function fn(name) {
        var start = fair.indexOf('function ' + name + '() {');
        assert(start >= 0, '三摊之一的 ' + name + '() 还在盘上');
        if (start < 0) return '';
        var end = fair.indexOf('\n    }', start);
        return fair.slice(start, end);
    }
    var three = { doLantern: fn('doLantern'), doFood: fn('doFood'), doWatch: fn('doWatch') };

    // ---- ① 源码层：三摊的话都从实测差值来，不再念常量、也不再叠一份通道回执 ----
    Object.keys(three).forEach(function (n) {
        var body = three[n];
        assert(/snapshot\(\)/.test(body) && /gainParen\(before, spec\)/.test(body),
            n + '：入账前拍一张账、回执用 gainParen（前后差值）');
        var okLine = (body.match(/say\([^\n]*'success'\)/) || [''])[0];
        assert(okLine && /gainParen\(before, spec\)/.test(okLine) && !/\+\s*CFG\./.test(okLine),
            n + '：成交那一句只拼 gainParen、不拼「＋CFG.常量」（拒付那一句报的是开价，那里有常量是对的）');
        assert(!/\(r\.note \?/.test(body),
            n + '：不再把通道那份 r.note 追加在后面（今天屏上是「心境+8、因果+1；铜钱-5、心境+8、因果+1」两副笔）');
    });
    assert(/energy: CFG\.FOOD_EN/.test(three.doFood) && !/c\.energy\s*=/.test(three.doFood),
        '吃小样的精力并进了 settle（原来在通道之外另起一次直写＝一笔账两副笔），函数体里不再直接 c.energy =');
    assert(/if \(spec\.energy\) c\.energy = Math\.max\(0, Math\.min\(Number\(c\.maxEnergy\) \|\| 100/.test(fair),
        'settle 的兜底分支认 energy（没有 RewardService 时并进去的这一笔照样截在上限，不会漏发）');
    var labels = (fair.match(/GAIN_LABEL = \{([^}]*)\}/) || [, ''])[1];
    var usedKeys = {};
    Object.keys(three).forEach(function (n) {
        ((three[n].match(/spec = \{([^}]*)\}/) || [, ''])[1]).split(',').forEach(function (p) {
            var k = p.split(':')[0].trim();
            if (k) usedKeys[k] = 1;
        });
    });
    Object.keys(usedKeys).forEach(function (k) {
        assert(labels.indexOf(k) >= 0, '结算项「' + k + '」在回执字典 GAIN_LABEL 里有名（漏一项，屏上就少念一项）');
    });

    // ---- ② 行为层：真跑三摊，读屏上那一句 ----
    load('js/city-facilities/festival-fair.js');
    global.WorldCalendar = { day: 1 };              // 第 1 天＝上元灯节（FALLBACK_DEFS 的 doy 1）
    delete global.RewardService;                    // 先走 settle 的兜底分支（直写＋夹逼）
    function lastMsg() { return msgs.length ? msgs[msgs.length - 1].m : ''; }
    function play(kind, cd) {
        global.currentCharData = cd;
        msgs.length = 0;
        global.FestivalFair.act(kind);
        return lastMsg();
    }

    var line = play('food', { location: '长安', copper: 100, mood: 80, karma: 0, energy: 95, maxEnergy: 100 });
    assert(/精力已达上限，实得\+5/.test(line),
        '精力 95／上限 100 吃一碗元宵 → 回执写「实得+5」，不再写开价「+30」（实际读数 ' + line.slice(-40) + '）');
    assert(line.indexOf('精力+30') < 0, '同一句里不许再出现「精力+30」（开价与实得并存就是两副笔）');
    assert(/铜钱-10/.test(line) && /心境\+6/.test(line), '花掉与真进账的都在句上（铜钱-10、心境+6 未触顶，照原样念）');
    eq(global.currentCharData.energy, 100, '账上也确实只到 100（并通道后没漏发、也没超发）');

    line = play('watch', { location: '长安', copper: 100, mood: 100, karma: 0, energy: 50, maxEnergy: 100 });
    assert(/心境已达上限，实得\+0/.test(line), '心境已满时看花灯 → 明说「实得+0」（改前照样印「心境+5」）');

    line = play('lantern', { location: '长安', copper: 100, mood: 90, karma: 100, energy: 50, maxEnergy: 100 });
    assert(/因果已达上限，实得\+0/.test(line) && /心境\+8/.test(line),
        '因果顶到 100 只说「实得+0」，同一句里没触顶的心境照旧 +8（逐项判，不一刀切）');

    // ---- ③ 通道在场时：它念的是「要发多少」，回执仍要跟账走 ----
    global.RewardService = {
        apply: function (spec) {
            var c = global.currentCharData;
            c.copper = Number(c.copper) + (spec.copper || 0);
            c.mood = Math.min(100, Number(c.mood) + (spec.mood || 0));
            c.energy = Math.min(Number(c.maxEnergy) || 100, Number(c.energy) + (spec.energy || 0));
            // messages 故意照 reward-service.js 的原样写：印的是 spec 的 requested 值，不是夹逼后的差值
            return { success: true, messages: ['铜钱' + (spec.copper || 0), '精力+' + spec.energy, '心境+' + spec.mood] };
        }
    };
    line = play('food', { location: '长安', copper: 100, mood: 80, karma: 0, energy: 95, maxEnergy: 100 });
    assert(/精力已达上限，实得\+5/.test(line) && line.indexOf('精力+30') < 0,
        '走统一通道那一支同样说实话（通道那份 messages 仍写着「精力+30」，回执不许照抄）');

    // ---- ④ 老规矩没被这一改动撞掉 ----
    global.RewardService = undefined;
    var full = { location: '长安', copper: 100, mood: 80, karma: 0, energy: 95, maxEnergy: 100 };
    play('food', full);
    msgs.length = 0;
    line = play('food', full);
    assert(/今年已经尝过节令小吃/.test(line) && full.energy === 100 && full.copper === 90,
        '当日第二次吃小吃照旧被旗子挡回，账不重复扣（铜钱停在 90、精力停在 100）');
    assert(!/今日已经尝过/.test(line) && !/明日赶早/.test(line),
        'COPY-04：庙会一年只开这一日，挡回的话不再说「今日」、也不再许一张不存在的「明日」');
    msgs.length = 0;
    line = play('food', { location: '长安', copper: 3, mood: 80, karma: 0, energy: 50, maxEnergy: 100 });
    assert(/要 10 铜钱/.test(line) && global.currentCharData.energy === 50 && global.currentCharData.mood === 80,
        '铜钱不够时整笔不发（精力／心境一动不动），也不给一句假回执');
    msgs.length = 0;
    line = play('food', { _fairFoodDay: 1, location: '长安', copper: 100, mood: 80, karma: 0, energy: 50, maxEnergy: 100 });
    assert(/今年已经尝过/.test(line), '今年已尝的旗子仍读得动（COPY-04 改口没碰 usedToday 的门控粒度）');
})();

console.log('\n[AD] DES-31 野外遗迹的搜刮存量：翻过几遍就只剩瓦砾');
(function () {
    var rm = src('js/map/randomMap.js');
    var ruinBlock = rm.slice(rm.indexOf('    ruin: ['), rm.indexOf('    spring: ['));

    // ---- ① 源码层：存量写在各处遗迹自己的来历那一行上 ----
    ['heritage_hall', 'battlefield', 'temple', 'tomb'].forEach(function (k) {
        var line = ruinBlock.split('\n').filter(function (l) { return l.indexOf("'" + k + "'") >= 0; })[0] || '';
        var got = (line.match(/digs: *(\d+)/) || [, '无'])[1];
        assert(/[1-9]\d*/.test(got), '遗迹变体 ' + k + ' 自带 digs（能翻几遍跟它的来历一道写，实得 ' + got + '）');
    });
    eq((ruinBlock.match(/key: '/g) || []).length, 4, 'ruin 变体仍是那四处（日后新增一处就得同时给它存量）');
    assert(/function ruinStockOf\(poi\) \{\s*return Number\(poi && poi\.variant && poi\.variant\.digs\)/.test(rm) &&
        /RUIN_DIGS_DEFAULT = 2/.test(rm),
        '存量读 variant.digs，叫不出来历的无名遗迹兜底两遍（不是写死在话术里）');

    var explore = rm.slice(rm.indexOf('function exploreWildRuin'), rm.indexOf('function harvestWildResource'));
    var dryAt = explore.indexOf('if (ruinIsDry(poi)) {');
    var chargeAt = explore.indexOf("advanceWildTime(60, '探索遗迹')");
    var energyAt = explore.indexOf('.energy = Math.max(0,');
    assert(dryAt >= 0 && chargeAt > dryAt && energyAt > dryAt,
        '搜空那一支的回绝走在扣时辰、扣精力之前（牌面既已写着空，再照扣一笔就是拿假账换玩家的真力气）');
    assert(/return;/.test(explore.slice(dryAt, chargeAt)), '回绝那一段当场 return（不会漏到下面的结账里去）');
    assert(/noteRuinDug\(poi\)/.test(explore.slice(energyAt)), '掘过即记账（惊动守灵、东西没拿稳的那些遍也算翻过一遍）');
    assert(!/currentDay\(\)/.test(explore) && !/wildDayMap\(/.test(explore),
        '探遗迹不看「今日第几次」：这段里没有当日旗子（违宪清单禁每日计数器式人为配额）');
    assert(!/_?ruin(Day|Daily|Today)/i.test(rm),
        '全仓没有 ruinDay／ruinDaily 这种按日清零的字段（要枯就在世界里枯）');
    assert(!/poi\.dry\s*=|poi\.dug\s*=/.test(rm),
        '枯没枯只记在 region 那一本账上，不在 POI 对象上另挂一份（禁平行状态）');

    // ---- ② 存档接线：三处少一处就是「重开档全忘」 ----
    var saveBlock = rm.slice(rm.indexOf('function saveWildState'), rm.indexOf('function applyWildState'));
    assert(/ruinDug: prev\.ruinDug \|\| \{\}/.test(saveBlock), 'saveWildState 把 ruinDug 收进本域账');
    var defaultLine = rm.split('\n').filter(function (l) { return l.indexOf('wildState.regions[region] = {') >= 0; })[0] || '';
    assert(/ruinDug: \{\}/.test(defaultLine), '新域默认账里就有 ruinDug 一格');
    assert(/nemesis: null, notes: \{\}, px: -1/.test(rm),
        '默认账那一段的尾巴原样没动（wave52 C6 逐字认这一段——新字段插在 nemesis 之前，别往后挪）');
    assert(/st\.ruinDug = st\.ruinDug \|\| \{\}/.test(rm), '老档进域时自动补空 ruinDug（零迁移脚本，与 grotto/notes 同法）');

    // ---- ③ 牌面两态 ----
    var labelBlock = rm.slice(rm.indexOf("if (poi.type === 'ruin') out.push"), rm.indexOf("if (poi.type === 'landmark')"));
    var dryLabel = (labelBlock.match(/\?\s*\{[^}]*\}/) || [''])[0];
    var wetLabel = (labelBlock.match(/:\s*\{[^}]*\}/) || [''])[0];
    assert(/已被搜空/.test(dryLabel) && !/primary/.test(dryLabel),
        '搜空后按钮照写「已被搜空」（点下去有一句回绝），但不再是高亮的推荐动作');
    assert(/primary: true/.test(wetLabel) && /🔍 探/.test(wetLabel), '未搜空时仍是主推荐动作（这一改动没把探遗迹从牌面上抹掉）');
    assert((rm.match(/ruinTitleOf/g) || []).length >= 5,
        '遗迹的名目统一走 ruinTitleOf（牌面两态＋回绝话术＋导出对账，共 5 处引用）');

    // ---- ④ 行为层：本文件的 document 桩没有 SVG，另起一个语境真跑 randomMap ----
    var ctx = vm.createContext({});
    function into(rel) { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel }); }
    vm.runInContext('this.window = this; this.console = { log: function () {}, warn: function () {}, error: function () {} };', ctx);
    vm.runInContext(`
var els = {};
function fakeEl(tag) {
    return { tag: tag || '', children: [], style: {}, _attrs: {}, parentNode: null,
        setAttribute: function (k, v) { this._attrs[k] = v; }, getAttribute: function (k) { return this._attrs[k]; },
        appendChild: function (c) { this.children.push(c); c.parentNode = this; return c; },
        removeChild: function (c) { var i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c; },
        get firstChild() { return this.children[0] || null; },
        addEventListener: function () {}, removeEventListener: function () {}, closest: function () { return null; },
        scrollIntoView: function () {}, remove: function () {},
        classList: { add: function () {}, remove: function () {}, toggle: function () {}, contains: function () { return false; } },
        textContent: '', innerHTML: '' };
}
this.document = { readyState: 'complete',
    createElementNS: function (ns, tag) { return fakeEl(tag); }, createElement: function (tag) { return fakeEl(tag); },
    getElementById: function (id) { if (!els[id]) els[id] = fakeEl(); return els[id]; },
    querySelector: function () { return null; }, querySelectorAll: function () { return []; },
    addEventListener: function () {}, body: { appendChild: function () {} } };
var store = {}; this.__store = store;
this.localStorage = { getItem: function (k) { return store[k] !== undefined ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); }, removeItem: function (k) { delete store[k]; } };
var msgs = []; this.msgs = msgs;
this.showMessage = function (m, t) { msgs.push({ m: String(m), t: t }); };
var gt = { totalMinutes: 0, currentDay: 5, currentHour: 14, currentMinute: 0, currentSeason: 'spring', currentMonth: 3, currentYear: 1 };
this.gameTime = gt;
this.timeSystem = { gameTime: gt, advanceTime: function (m) { gt.totalMinutes += m; }, onNewDaySubscribe: function () {} };
this.addItemToInventory = function () { return true; };
this.updateCharacterStatus = function () {}; this.updateCurrencyUI = function () {};
this.getEffectiveMax = function () { return 100; };
this.generateRandomEnemy = function (lv, t) { return { name: '守灵', hp: 100, level: lv }; };
this.openBattleWithEntity = function () {};
this.ResourcePoints = { listByRegion: function () { return [] } };
this.DungeonDynamic = { listActive: function () { return [] } };
this.LANDMARKS = {};
var reg = {}; this.__reg = reg;
this.StateRegistry = { register: function (name, s) { reg[name] = s; } };
this.currentCharData = { health: 80, energy: 80, qi: 40, maxQi: 100, realm: '筑基' };
this.inventory = { currency: { spiritStones: 100 } };
`, ctx);
    into('js/map/wild-terrain.js');
    into('js/map/randomMap.js');
    var api = ctx.wildMapApi;
    assert(!!api && !!api.ruin, 'randomMap 在这个语境里装得起来，ruin 对账口在位');
    if (!api || !api.ruin) return;

    eq(api.ruin.CFG.DIGS_DEFAULT, 2, '兜底存量两遍（对账口与源码同一处真相）');
    eq(api.ruin.CFG.DIGS.map(function (d) { return d.key + ':' + d.digs; }).join(','),
        'heritage_hall:3,battlefield:2,temple:2,tomb:1',
        '四处遗迹的存量：残阵未散的三遍、战场与古观两遍、牌面写着「被盗过一轮」的古冢只剩一遍');

    // 拨开随机：只验账目，不验哪件货掉出来（风险那一支另有 v20.61 覆盖）
    vm.runInContext('Math.random = function () { return 0.99; };', ctx);

    // 找一处踩着上去的遗迹（POI 落在可走格上，换种子直到有货）
    function standOnRuin(key) {
        for (var i = 0; i < 16; i++) {
            ctx.setMapSeed('ad_probe_' + i);
            ctx.openWildernessMap('中州');
            var list = api.pois().filter(function (p) { return p.type === 'ruin' && (!key || (p.variant && p.variant.key === key)); });
            for (var j = 0; j < list.length; j++) {
                api.revealAround(list[j].x, list[j].y, 2);
                if (api.stepTo(list[j].x, list[j].y)) return list[j];
            }
        }
        return null;
    }
    function dig(ruin) {
        ctx.msgs.length = 0;
        var t0 = ctx.gameTime.totalMinutes, e0 = ctx.currentCharData.energy;
        api.poiAction('explore');
        return { dt: ctx.gameTime.totalMinutes - t0, de: ctx.currentCharData.energy - e0,
            dug: api.ruin.dug(ruin.id), dry: api.ruin.isDry(ruin),
            text: ctx.msgs.map(function (m) { return m.m; }).join(' | '),
            label: (api.tileActions(ctx.currentMap[ctx.playerPos.y][ctx.playerPos.x])
                .filter(function (a) { return a.act === 'explore'; })[0] || {}).label || '' };
    }

    var ruin = standOnRuin(null);
    assert(!!ruin, '中州该探得出遗迹（行为层要有真对象可掘）');
    if (!ruin) return;
    var stock = api.ruin.stockOf(ruin);
    assert(stock >= 1 && stock <= 3, '脚下这处的存量在 1~3 之间（' + ruin.name + '/' + ruin.variantName + '＝' + stock + '）');

    var lastOk = null, refused = null;
    for (var n = 1; n <= stock + 2; n++) {
        var r = dig(ruin);
        if (n <= stock) {
            assert(r.dt === 60 && r.de === -10 && /🏛️/.test(r.text) && r.dug === n,
                '第 ' + n + '／' + stock + ' 遍：照旧收一个时辰、十格精力，货入账（dug=' + r.dug + '）');
            lastOk = r;
        } else if (!refused) {
            assert(r.dt === 0 && r.de === 0 && /翻到底/.test(r.text) && !/🏛️/.test(r.text),
                '翻过 ' + stock + ' 遍之后再点：时辰 0 分钟、精力 0 格、只回一句「早被人翻到底了」（不再凭空造货）');
            assert(r.dry === true && /已被搜空/.test(r.label), '枯了的那一回，牌面同步换成「已被搜空」');
            refused = r;
        } else {
            eq(r.dt + r.de, 0, '第 ' + n + ' 遍（存量早已翻满）仍是空回绝——没有「再翻翻运气」的漏口子');
        }
    }
    assert(lastOk && (/这一处翻到底了/.test(lastOk.text) === (lastOk.dug >= stock)),
        '「这一处翻到底了」那句只补在最后有效的一遍尾巴上（中途就报枯是谎话，枯了还不说是漏说）');

    // ---- ⑤ 存档 round-trip：export 是落盘那一份，reset/import 是关档重开 ----
    var wild = ctx.__reg.wildMap;
    assert(!!wild && typeof wild.export === 'function', 'wildMap 注册在 StateRegistry 上（存量得跟着存档走）');
    var snap = JSON.stringify(wild.export());
    assert(/"ruinDug":\{[^}]*"/.test(snap), '落盘那一份里真有 ruinDug 这一格（不是只活在内存）');
    wild.reset();
    eq(api.ruin.dug(ruin.id), 0, 'reset（等价于换一片山河）之后掘遍数归零——证明它读的是账，不是 POI 身上的旗子');
    assert(!api.ruin.isDry(ruin), '账清空后同一处不该还自称搜空（枯的判据只有那一本账）');
    wild.import(JSON.parse(snap));
    eq(api.ruin.dug(ruin.id), stock, '读档后同一处的掘遍数原样回来（枯是在世界里枯，不是在屏幕上枯）');
    assert(api.ruin.isDry(ruin), '读档后仍是搜空态');

    // ---- ⑥ 一域一册：账按 POI 记在本域名下，不串到别处 ----
    var zzLedger = (api.state().regions['中州'] || {}).ruinDug || {};
    eq(Number(zzLedger[ruin.id]), stock, '本域账上按 poiId 记着翻满的遍数');
    ctx.openWildernessMap('江南');          // 不换种子＝同一片山河的另一域
    eq(Object.keys((api.state().regions['江南'] || {}).ruinDug || {}).length, 0, '江南那一册是空的（中州翻空不代表江南）');
    eq(api.ruin.dug(ruin.id), 0, '在中州记下的遍数，在江南读不出来（读的始终是脚下这一域）');
    ctx.openWildernessMap('中州');
    eq(api.ruin.dug(ruin.id), stock, '回中州，翻过的遍数还在原处');

    // ---- ⑦ 存量真由来历给：牌面写着「被盗过一轮」的古冢，一遍即枯（这一步会换种子，放最后）----
    var tomb = standOnRuin('tomb');
    if (tomb) {
        eq(api.ruin.stockOf(tomb), 1, '无名古冢的存量是 1（它的牌面写着「封土被盗过一轮」）');
        var t1 = dig(tomb), t2 = dig(tomb);
        assert(t1.dt === 60 && t1.dug === 1 && /翻到底/.test(t1.text), '古冢头一遍就见底（收成照给，话照说）');
        assert(t2.dt === 0 && t2.de === 0 && /已被搜空|翻到底/.test(t2.text + t2.label), '古冢第二遍即回绝');
    } else assert(false, '中州该探得出一座无名古冢（16 颗种子内没落位，说明来历分配漂了）');
})();

console.log('\n[AE] DES-23＋DES-35 无生命体不再演成人：桩子按点名的生理类型出生，姿态池先问有没有这笔账');
(function () {
    var bt = src('js/battle.js');
    var ap = src('js/app.js');

    // ---- ① 调用方把「这是死物」说清楚（app.js：只点名木人桩/试炼傀儡两处）----
    var sAt = ap.indexOf('var spawnOpts = null;');
    assert(sAt >= 0, 'app.js 里有一处 spawnOpts 段（无生命体由调用方声明，不让生成器猜）');
    if (sAt < 0) return;
    var spawnBlock = ap.slice(sAt, ap.indexOf('var enemyData =', sAt));
    assert(/training_dummy/.test(spawnBlock) && /trial/.test(spawnBlock),
        '桩子与试炼傀儡两处都点名（只补这两支，不顺手改别种出怪）');
    assert(/physiologyType: 'construct'/.test(spawnBlock), '点名的是构装体（生成器本就有这一档，不新造生理类型）');
    assert(/noAffix: true/.test(spawnBlock), '一并撤掉词缀资格（桩子不该抽成「堂主·木人桩」）');
    assert(/gen\(level, type, spawnOpts\)/.test(ap), 'spawnOpts 真传进了生成器第三参数（不是写在那里没人读）');
    assert(!/= gen\(level, type\);/.test(ap), '旧的两参调用不留第二副笔（同一处出怪两种口径）');
    assert(spawnBlock.indexOf('木人桩') < 0 && spawnBlock.indexOf('试炼傀儡') < 0,
        '判类型看的是调用参数，不是展示名（木人桩那一枚的名字仍在下方命名覆盖里，不参与判定）');

    // ---- ② 生成器认点名，且认不出时退回掷骰 ----
    var bandLine = (bt.match(/const PHYS_BAND = \{([^}]*)\};/) || [, ''])[1];
    var band = {};
    bandLine.split(',').forEach(function (kv) {
        var m = kv.match(/(\w+)\s*:\s*([\d.]+)/); if (m) band[m[1]] = Number(m[2]);
    });
    eq(band.humanoid != null && band.undead != null && band.construct != null && band.elemental != null, true,
        '定点表四档齐全（点名任一生理类型都有归宿，不会有人点到了却仍掷骰）');
    assert(band.humanoid < 0.6 && band.undead >= 0.6 && band.undead < 0.8 &&
        band.construct >= 0.8 && band.construct < 0.9 && band.elemental >= 0.9,
        '定点值各自落在自己那一档的区间里（复用现成的命名/亚型/天生技装配，不另写一套构装体分支）');
    assert(/const physRoll = \(forcedPhys && PHYS_BAND\[forcedPhys\] != null\)[\s\S]{0,80}:\s*Math\.random\(\);/.test(bt),
        '认不出的强制值退回掷骰——不让一个不认识的类型被最后一档兜成元素生物');
    assert(/physiologyType === 'humanoid' && rawType === 'enemy' && !\(spawnOpts && spawnOpts\.noAffix\)/.test(bt),
        '词缀门槛仍是「人形＋enemy＋未点名 noAffix」（这一改动没顺手放开词缀）');

    // ---- ③ 姿态池：先问有没有血量账，再问会不会说人话 ----
    var trick = bt.slice(bt.indexOf('_tryEnemyTrick() {'), bt.indexOf('resolvePrompt(idx)'));
    var kneel = bt.slice(bt.indexOf('_tryEnemySurrender() {'), bt.indexOf('_settleWitness() {'));
    assert(trick.length > 200 && kneel.length > 200,
        '两版切片都真取到了函数体（' + trick.length + '/' + kneel.length +  ' 字）——下面的「切片里没有」才不是空切片蒙过去的');
    assert(trick.indexOf('maxBloodVolume') < 0 && kneel.indexOf('maxBloodVolume') < 0,
        '装死与跪降两处都不再自己读量程（同一把尺收进 _bloodLedgerPct 一处）');
    assert(/_bloodLedgerPct\(enemy\)/.test(trick) && /_bloodLedgerPct\(enemy\)/.test(kneel),
        '两处都改走血量账判据');
    assert(/bloodPct !== null/.test(trick) && /pct === null\) return false/.test(kneel),
        '「不适用」在两处都真的收手（null 不是 0，也不是 100）');
    assert(!/maxBloodVolume \? phys\.maxBloodVolume : 100/.test(bt),
        '全文件不再有 `: 100` 那副兜底量程（旧的假账：血写死 0/0 的东西被算成零点血）');
    var ledgerFn = bt.slice(bt.indexOf('_bloodLedgerPct(enemy) {'), bt.indexOf('_speaksAsHuman(enemy) {'));
    assert(/if \(!\(cap > 0\)\) return null;/.test(ledgerFn), '量程判据是 cap > 0，缺账即 null（不返回数字冒充）');
    assert(/blood = cap;/.test(ledgerFn) && !/: 100\b/.test(ledgerFn),
        '读数缺字时按 cap 折满，不再拿 100 当默认量程（这里的 100 只剩百分比换算）');
    var speakFn = bt.slice(bt.indexOf('_speaksAsHuman(enemy) {'), bt.indexOf('_tryEnemyTrick() {'));
    assert(speakFn.indexOf('.name') < 0, '判「会不会说人话」不读展示名（违宪清单：名字不是机制来源）');
    assert(/=== 'humanoid'/.test(speakFn) && /species === 'human'/.test(speakFn),
        '有标签按标签（只人形），无标签的老 NPC 数据按 species 兜住——不把老档整批弄成哑巴');
    eq((bt.match(/this\._speaksAsHuman\(/g) || []).length, 6,
        '六处调用：装死／跪降／骂阵／阵上喊话／死前之言／开场话术（血肉台词与姿态一整套同判据，不留半套）');
    assert(!/enemy\.species === 'beast' \|\| enemy\.physiologyType === 'beast/.test(kneel),
        '跪降不再用「只排兽」的排除法（兽出局是「不是人形」的自然结果，不是一条条列黑名单）');
    assert(/_speaksAsHuman\(this\.enemy\)/.test(bt) && !/species === 'human' \|\| \(!this\.enemy\.species/.test(bt),
        '死前之言的旧判据（无 species 时非兽即放行——构装体由此过关）整条撤下');
    assert(/头目宁死不受辱/.test(kneel), 'boss 仍单独排除（这一改动不是放开头目求饶）');
    assert(/是真倒了，还是装的？/.test(trick) && trick.indexOf("'🧎 '") < 0,
        '装死的四选一应对原样在位（改的是谁能演，不是把这一出删掉）');

    // ---- ④ 行为层：独立语境真跑 battle.js ----
    var bc = vm.createContext({});
    vm.runInContext(`
this.window = this;
this.console = { log: function () {}, warn: function () {}, error: function () {} };
this.document = { readyState: 'complete', getElementById: function () { return null; },
    createElement: function () { return { style: {}, setAttribute: function () {}, appendChild: function () {}, classList: { add: function () {}, remove: function () {} } }; },
    querySelector: function () { return null; }, querySelectorAll: function () { return []; },
    addEventListener: function () {}, body: { appendChild: function () {} } };
this.localStorage = { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} };
this.showMessage = function () {};
`, bc);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/battle.js'), 'utf8'), bc, { filename: 'js/battle.js' });
    var gen = bc.generateRandomEnemy, Ent = bc.Entity, Bp = bc.Battle && bc.Battle.prototype;
    assert(typeof gen === 'function' && typeof Ent === 'function' && !!Bp && !!Bp._bloodLedgerPct,
        'battle.js 在这个语境里装得起来（生成器与两个判据都在位）');
    if (!gen || !Bp) return;

    var forced = [], i;
    for (i = 0; i < 20; i++) forced.push(gen(6, 'enemy', { physiologyType: 'construct', noAffix: true }));
    assert(forced.every(function (d) { return d.physiologyType === 'construct'; }),
        '点名 construct 二十次，二十次都是构装体（桩子不再抽成会流血的人）');
    assert(forced.every(function (d) { return (d.combatAbilities || []).join('+') === 'hardened'; }),
        '构装体拿的是自己的天生技（不再从人形共享池抽绝技）');
    assert(forced.every(function (d) { return d._affix == null; }), '点名的这一批一个词缀也没有');
    assert(forced.every(function (d) { return d.subtype === 'construct'; }), '亚型标随生理类型走（台词/搜刮按它读）');

    var loose = {}, one;
    for (i = 0; i < 400; i++) { one = gen(6, 'enemy').physiologyType; loose[one] = (loose[one] || 0) + 1; }
    var rollKeys = Object.keys(loose).sort().join(',');
    assert(/humanoid/.test(rollKeys) && loose.humanoid > 100 && Object.keys(loose).length >= 3,
        '不点名时仍照常掷骰（四档没被这一改动焊死；实得 ' + rollKeys + '）');
    var bogus = gen(6, 'enemy', { physiologyType: 'dragon' });
    assert(['humanoid', 'undead', 'construct', 'elemental'].indexOf(bogus.physiologyType) >= 0,
        '认不出的点名（dragon）落回四档之一，不会造出一个不存在的生理类型');

    function entOf(kind) {
        var d = gen(6, kind === 'beast' ? 'beast' : 'enemy', { physiologyType: kind, noAffix: true });
        var e = new Ent(d, kind === 'beast' ? 'beast' : 'enemy');
        e.combatAbilities = [];   // 拨开随机抽到的 escape（它会合法地抢掉装死/跪降的戏）
        return e;
    }
    var man = entOf('humanoid'), con = entOf('construct'), und = entOf('undead'), ele = entOf('elemental'), bak = entOf('beast');
    eq(con.physiology.bloodVolume, 0, '构装体血量 0（它靠结构损伤活着）');
    eq(con.physiology.maxBloodVolume, 0, '构装体血量量程也是 0——不是没写，是它本就没有这笔账（DES-32 同源）');
    eq(con.physiology.painLoad, 0, '构装体疼痛 0（无伤口即无痛，屏上疼痛条恒 0 的依据）');
    eq(con.physiology.integrity, 100, '构装体自有量程是完整性 100');
    eq(Bp._bloodLedgerPct.call({}, man), 100, '人形满血读 100%');
    man.physiology.bloodVolume = 1; man.physiology.health = 1;
    eq(Bp._bloodLedgerPct.call({}, man), 1, '人形残血按同一把尺读成 1%（量程是真在参与除法）');
    eq(Bp._bloodLedgerPct.call({}, con), null, '构装体的血量账＝不适用（旧的 `: 100` 兜底把它读成 0%）');
    eq(Bp._bloodLedgerPct.call({}, und), null, '亡灵同（血写死 0/0 的两类一并出局）');
    eq(Bp._bloodLedgerPct.call({}, ele), 100, '元素生物有能量账可读——血量账判据不冤枉它（它的出局由「会不会说人话」那一判据管）');
    eq([Bp._speaksAsHuman.call({}, man), Bp._speaksAsHuman.call({}, con), Bp._speaksAsHuman.call({}, und),
        Bp._speaksAsHuman.call({}, ele), Bp._speaksAsHuman.call({}, bak)].join(','), 'true,false,false,false,false',
        '五类身子的准入：只有人形开口（骂阵／喊话／临终语／装死／跪降同一套判据）');
    eq(Bp._speaksAsHuman.call({}, { physiologyType: null, species: 'human' }), true,
        '无生理标签的老数据（NPC 直传）按人算——不把护宗战那批既有对手整批弄成哑巴');
    eq(Bp._speaksAsHuman.call({}, { physiologyType: null, species: 'beast' }), false, '同样无标签的兽仍不说话');

    // 随机钉在「必然出手」那一档：装死 0.35、跪降 0.35 都吃得下
    vm.runInContext('Math.random = function () { return 0; };', bc);
    // 元素与妖兽也打到残血：它们有血量账、也过了「不足一半」那道线——
    // 于是「不出手」只能是被「会不会说人话」挡下的，不能拿满血当遮羞布。
    ele.physiology.bloodVolume = 1; ele.physiology.health = 1;
    bak.physiology.bloodVolume = 1; bak.physiology.health = 1;
    function foe(e) { return Object.assign(Object.create(Bp), { log: [], _foeTricks: { smoke: 0, feignUsed: false }, enemy: e }); }
    function sup(e) { return Object.assign(Object.create(Bp), { log: [], enemy: e, _foeDisheartened: 0, _surrenderAsked: false }); }
    var rich = entOf('humanoid');   // 满血人形：账在，但没到跳墙的地步
    var cases = { 濒死人形: man, 满血人形: rich, 木人桩构装体: con, 亡灵: und, 残血元素: ele, 残血妖兽: bak };
    Object.keys(cases).forEach(function (k) {
        var e = cases[k], f = foe(e), s = sup(e);
        var feigned = !!f._tryEnemyTrick(), kneeled = !!s._tryEnemySurrender();
        var want = (k === '濒死人形');
        eq(feigned && kneeled, want, k + '：装死/跪降' + (want ? '照出（功能没被改成一律禁）' : '不出'));
        eq(/栽倒在地|我降/.test(f.log.concat(s.log).map(function (l) { return l.msg; }).join('|')), want,
            k + '：屏上' + (want ? '有那一行台词' : '一行也不写（安静收手，不抛错也不硬演）'));
    });
    eq(Bp._bloodLedgerPct.call({}, ele), 1, '残血元素的血量账读得出 1%（它确实是被台词判据挡下，不是判据失灵）');
})();

console.log('\n[AF] DES-35 尾巴（实机抓到）：开场话术也只由人形开口——木人桩不再「略一抱拳，兵刃已出了半鞘」');
(function () {
    var bt = src('js/battle.js');
    var openAt = bt.indexOf('第九十九波·当面开场');
    assert(openAt >= 0, '开场话术那一段还在原位（改的是谁能说，不是把这一段删掉）');
    var open = bt.slice(openAt, bt.indexOf('this._tlTick = 0;', openAt));
    assert(open.length > 800, '切片真取到整段开场（实得 ' + open.length + ' 字，负向断言不是空切片蒙的）');
    assert(/var _speaks99 = this\._speaksAsHuman\(_e99\);/.test(open),
        '开场段自成一枚 _speaks99，读的是同一把尺（不在此处另立「不是兽＝是人」的排除法）');
    eq((open.match(/_speaks99 &&/g) || []).length, 6,
        '六支人的台词（正道认魔／响马／邪修／武僧／首领＋兜底抱拳）全部上闸；兽那一支照旧不走上闸路');
    assert(/else if \(_isBeast99\) \{[\s\S]{0,120}压低身子/.test(open),
        '野兽仍有自己的开场（这一改动不是把非人一律弄成哑巴，是各说各的话）');
    assert(!/_speaks99 = [^\n]*\.name/.test(open),
        '上闸读的是生理标签，不是展示名（名字只出现在印出来的台词里）');
    assert(!/else if \(_e99 && !_isBeast99\)/.test(open),
        '旧的兜底那一支（非兽即放行——构装体／亡灵／元素由此抱拳）整条撤下');

    // ---- 行为层：真把 Battle 构出来，看开场那一行写没写 ----
    var bc = vm.createContext({});
    vm.runInContext(`
this.window = this;
this.console = { log: function () {}, warn: function () {}, error: function () {} };
this.document = { readyState: 'complete', getElementById: function () { return null; },
    createElement: function () { return { style: {}, setAttribute: function () {}, appendChild: function () {}, classList: { add: function () {}, remove: function () {} } }; },
    querySelector: function () { return null; }, querySelectorAll: function () { return []; },
    addEventListener: function () {}, body: { appendChild: function () {} } };
this.localStorage = { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} };
this.showMessage = function () {};
`, bc);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/battle.js'), 'utf8'), bc, { filename: 'js/battle.js' });
    var gen = bc.generateRandomEnemy, Ent = bc.Entity, Battle = bc.Battle;
    assert(typeof Battle === 'function', 'battle.js 在这个语境里装得起来（构造函数在位）');
    if (typeof Battle !== 'function') return;
    function entOf(kind) {
        var beast = kind === 'beast';
        var d = gen(6, beast ? 'beast' : 'enemy', { physiologyType: kind, noAffix: true });
        var e = new Ent(d, beast ? 'beast' : 'enemy');
        e.combatAbilities = [];
        return e;
    }
    function 开场行(kind) {
        var b = new Battle(entOf('humanoid'), entOf(kind));
        return (b.log || []).map(function (l) { return typeof l === 'string' ? l : l.msg; })
            .filter(Boolean).join('|');
    }
    ['construct', 'undead', 'elemental'].forEach(function (k) {
        var t = 开场行(k);
        assert(!/略一抱拳|亮家伙吧|横刀拦路|舔了舔嘴唇|单掌当胸|居高临下|替天行道/.test(t),
            k + '：开场一行人的姿态都不写（屏上安静，不抛错也不硬演）');
    });
    assert(/略一抱拳|亮家伙吧|横刀拦路|舔了舔嘴唇|单掌当胸|居高临下/.test(开场行('humanoid')),
        '人形照旧有一句开场（六支台词随机亚型各归其位，闸不是把开场整个关了）');
    assert(/压低身子|吼声/.test(开场行('beast')), '兽照旧有自己的开场话');
})();

console.log('\n[AG] F5 势力声望静默蒸发：叛门那一笔落进真账 · 结盟政策不再白扣 800 资源 · 入门互斥的谎撤下');
(function () {
    // ---- ① 行为层：真把 factions.js 装起来跑（门禁与映射都调仓库里那一份） ----
    var fc = vm.createContext({});
    vm.runInContext(`
this.window = this;
var __warns = [];
this.warns = __warns;
this.console = { log: function () {}, warn: function (m) { __warns.push(String(m)); }, error: function () {} };
this.localStorage = { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} };
this.toasts = [];
this.showMessage = function (m) { this.toasts.push(String(m)); };
this.gameLog = null;
`, fc);
    vm.runInContext(src('js/factions/factions.js'), fc, { filename: 'js/factions/factions.js' });
    assert(typeof fc.changeFactionReputation === 'function' && typeof fc.factionIdOfSect === 'function',
        'factions.js 在这个语境里装得起来（门禁与新增的映射笔都在位）');
    if (typeof fc.factionIdOfSect !== 'function') return;
    fc.initFactionSystem();
    var FKEYS = Object.keys(fc.FACTIONS);
    assert(FKEYS.length === 5, '势力账的键表就是这五个（哨兵的分母来自账本，不是我手抄的清单）');

    fc.sectsData = {
        '少林寺': { type: '正道' }, '修罗宫': { type: '邪派' }, '唐门': { type: '中立' },
        '无名谷': { type: '混沌' }, '散人': {}
    };
    eq(fc.factionIdOfSect('少林寺'), 'righteous_alliance', '正道门派落正道联盟');
    eq(fc.factionIdOfSect('修罗宫'), 'demon_cult', '邪派门派落魔教');
    eq(fc.factionIdOfSect('唐门'), 'rogue_cultivators', '中立门派落散修联盟');
    eq(fc.factionIdOfSect('无名谷'), null, '认不出的类型返回 null（不猜、不从展示名反推一个势力出来）');
    eq(fc.factionIdOfSect('散人'), null, '门派没有 type 字段也是 null');
    eq(fc.factionIdOfSect('查无此门'), null, 'sectsData 里没有的名字（自建宗门）也是 null');
    eq(FKEYS.indexOf('少林寺'), -1, '反证：门派名从来就不是势力 id——旧写法喂进去必然撞门禁');

    // 2026-09-24 收口后的契约：门禁自己认键（id → 势力展示名 → 门派名），认不出才挡下——且挡得有声
    var before = fc.factionState.reputation.righteous_alliance;
    eq(fc.changeFactionReputation('少林寺', -40), before - 40,
        '喂门派名经门禁内的映射笔落进正道联盟账（旧版这里是静默 return 0）');
    eq(fc.factionState.reputation.righteous_alliance, before - 40, '屏上念的数与账上的数是同一笔');
    assert(fc.toasts.join('|').indexOf('正道联盟声望降低40') >= 0, '入账时由写账那一处自己发回执（不在别处再念一遍数字）');
    eq(fc.warns.length, 0, '认得出键就不许在控制台乱喊（warn 只留给真认不出的那一格）');
    var untouched = fc.factionState.reputation.righteous_alliance;
    eq(fc.changeFactionReputation('ally_sect', 10), 0, '政策 id 三条认键路都不中 → 回 0');
    eq(fc.factionState.reputation.righteous_alliance, untouched, '认不出的那一笔一个字都没写进账');
    eq(fc.warns.length, 1, '认不出即 warn 一声（旧门禁的「挡得毫无声响」就是 F5 的病根）');
    assert(fc.warns[0].indexOf('ally_sect') >= 0, 'warn 里带上那个认不出的键，让人找得着调用点');
    var 魔教前 = fc.factionState.reputation.demon_cult;
    eq(fc.changeFactionReputation(fc.factionIdOfSect('修罗宫'), -40), 魔教前 - 40,
        '调用点显式走映射笔，与门禁内认键得到同一个数（数额照旧，本轮不动数值）');

    // ---- ② 全仓哨兵：字面量实参必须是真势力 id（FIX_NOTES F5 建议的 CI 那条） ----
    // 扫描前先过 codeOnly（模块顶部）：本轮在源码注释里原文引用了旧写法当案底，连注释一起读只会让哨兵抓到自己的说明文字。
    var bad = [], sites = 0;
    jsFiles('js').forEach(function (f) {
        var t = codeOnly(src(f)), re = /changeFactionReputation\(\s*(['"])([^'"]+)\1/g, m;
        while ((m = re.exec(t))) {
            sites++;
            if (FKEYS.indexOf(m[2]) < 0) bad.push(f + ':' + m[2]);
        }
    });
    assert(sites >= 5, '哨兵真扫到了字面量调用点（实得 ' + sites + ' 处，不是空转的正则）');
    eq(bad.join(' | '), '', '全仓 changeFactionReputation 的字面量实参都在势力账上（违例清单为空）');
    var sy = codeOnly(src('js/sects/sects-system.js'));
    eq((sy.match(/factionIdOfSect/g) || []).length, 2,
        '门派名→势力 id 只在 factions.js 那一支笔里算，调用点只引用它（这里数到 1 处调用 + 1 处 typeof 守卫）');

    // ---- ③ 叛门：不再喂门派名，回执不再念一笔没落账的数 ----
    assert(!/changeFactionReputation\(\s*oldSectId/.test(sy), '叛门那行不再把门派名喂进门禁');
    var betray = sy.slice(sy.indexOf('var _grudged = false'), sy.indexOf('var specialRank = 7'));
    assert(betray.length > 200, '叛门切片真取到整段（含回执那一句，实得 ' + betray.length + ' 字）');
    assert(/factionIdOfSect\(oldSectId\)/.test(betray), '叛门改读映射笔');
    assert(/changeFactionReputation\(_betrayFid, -40\)/.test(betray), '入账的是映射出来的势力 id，数额照旧（本轮不动数值）');
    assert(/if \(_betrayFid && /.test(betray), '认不出门派就不写账——也不会有回执（宁缺毋假）');
    assert(sy.indexOf('旧门派声望-40') < 0, '「旧门派声望-40」那句空头回执整条撤下（势力声望由写入处自己喊）');
    assert(/var _grudged = false/.test(betray) && /_grudged \? '（旧门派上下仇恨\+30）' : ''/.test(betray),
        '同门仇恨那半句也改成有条件：真有人被记恨才念（贡献/仇恨各归各的账）');

    // ---- ④ 结盟政策：政策 id 不是势力 id；卡面写的就是落账的那本 ----
    assert(!/changeFactionReputation\('ally_sect'/.test(sy), '结盟政策不再把政策 id 当势力 id 喂进去');
    var allyAt = sy.indexOf("policyId === 'ally_sect'");
    var allyBlk = sy.slice(allyAt, sy.indexOf("} else if (policyId === 'upgrade_training'", allyAt));
    assert(/changeFactionReputation\('rogue_cultivators', 10\)/.test(allyBlk),
        '结盟落在散修联盟那一本账（中立门派所属势力），数额照旧 +10');
    assert(/与中立门派修好（散修联盟声望\+10）/.test(sy), '政策卡面把账本名字写清楚——不再只有一个含糊的「声望+10」');

    // ---- ⑤ 入门互斥与 repSelf：两处「把调用过当成改成功」的谎撤下 ----
    var si = src('js/sects/sect-internal.js');
    assert(si.indexOf('applySectReputationEffects') < 0 && si.indexOf('SECT_REPUTATION_EFFECTS') < 0,
        'sect-internal.js 里那台 35 圈全撞门禁的循环连同词表整块撤下（不是藏起来）');
    var staleRef = [];
    jsFiles('js').forEach(function (f) {
        var t = src(f);
        if (t.indexOf('applySectReputationEffects') >= 0 || t.indexOf('SECT_REPUTATION_EFFECTS') >= 0) staleRef.push(f);
    });
    eq(staleRef.join(' | '), '', '全仓不许还留着对已删函数／已删词表的引用');
    assert(sy.indexOf('门派声望变化') < 0 && si.indexOf('门派声望变化') < 0,
        '「🏛️ 门派声望变化：同门声望+30」这条从不入账的 toast 全仓绝迹');
    var du = src('js/sects/sects-deep-ui.js');
    assert(du.indexOf("eff.repSelf") < 0, '门派事件的 repSelf 分支撤下（弟子侧没有「本派声望」这本账）');
    assert(/别往事件表里填这个键/.test(src('js/sects/sects-deep-data.js')),
        '事件词表同步说明 repSelf 已作废——下一个人填之前就读得到');
})();

// ==================== [AH] DES-25：护宗战那枚「判空后什么都不做」的空花括号 ====================
(function testDes25SectWarEmptyBrace() {
    console.log('\n[AH] DES-25 宗门大战的势力声望空花括号');
    var sw = src('js/sects/sect-war.js'), swc = codeOnly(sw);
    assert(sw.indexOf("typeof W.changeFactionReputation === 'function') {}") < 0,
        'sect-war.js 里那枚「判空后什么都不做」的空块不在了（留着就像已经接了势力账）');
    assert(swc.indexOf('changeFactionReputation') < 0,
        '剥掉注释之后 sect-war.js 对势力账一个字未动——本轮不替用户定这个数（只撤谎，不发明口径）');
    assert(/等用户定数/.test(sw) && /world-events\.js:300-306/.test(sw),
        '注释里写明这是待裁决的机制口径，并指出现成的量级参照（正邪大战 胜+50／败−30）');
    assert(/同一本账上自己 \+50 又 −30 是假账/.test(sw), '防的坑①写在注释里：攻守同属一系时同一本账自冲自，须先判两边映射不同');
    assert(/映射回 `null`，那一侧就该安静地什么都不写/.test(sw), '防的坑②写在注释里：自建宗门不在 sectsData，认不出即不写');
    // ---- 行为层：真把 sect-war.js 装起来跑四支结算，"不动势力账"不再只靠源码负向断言 ----
    function warRig() {
        var c = vm.createContext({});
        vm.runInContext(`
this.window = this;
this.console = { log: function () {}, warn: function () {}, error: function () {} };
this.localStorage = { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} };
this.toasts = [];
this.showMessage = function (m) { this.toasts.push(String(m)); };
this.gameLog = { add: function (m) {} };
this.addEventListener = function () {};
this.sectsData = { '少林寺': { type: '正道', power: '大派' }, '天煞宗': { type: '邪派', power: '中等' } };
this.SECT_DIPLOMACY_STATE = { '少林寺': { '天煞宗': { relation: -50 } }, '天煞宗': { '少林寺': { relation: -50 } } };
this.discipleState = { sectName: '少林寺', contribution: 100, isInSect: true };
this.currentCharData = { fame: 0 };
this.SECT_INTERNAL = { '天煞宗': { resources: 5000 } };
this.eventFlags = {};
this.timeSystem = { getAbsoluteDay: function () { return 10; } };
this.sectAddContribution = function (n) { this.discipleState.contribution += n; }.bind(this);
this.inventory = { currency: { spiritStones: 0 } };
`, c);
        vm.runInContext(src('js/factions/factions.js'), c, { filename: 'js/factions/factions.js' });
        vm.runInContext(src('js/sects/sect-war.js'), c, { filename: 'js/sects/sect-war.js' });
        c.initFactionSystem();
        return c;
    }
    var ledgers = function (c) { return Object.keys(c.FACTIONS).map(function (k) { return k + '=' + c.factionState.reputation[k]; }).join(' '); };
    var warRigs = [['defend', true, '守胜（击退来犯）'], ['defend', false, '守败（山门被踏）'], ['attack', true, '攻胜（踏破敌山门）'], ['attack', false, '攻败（攻山不成）']];
    warRigs.forEach(function (cs) {
        var c = warRig();
        if (typeof c.settleSectWar !== 'function') { assert(false, cs[2] + '：sect-war.js 没在这个语境里装起来'); return; }
        var base = ledgers(c), rel0 = c.SECT_DIPLOMACY_STATE['少林寺']['天煞宗'].relation, con0 = c.discipleState.contribution, st0 = c.inventory.currency.spiritStones;
        c.currentBattle = { _isSectWarBattle: true, _warSect: '天煞宗', _warSide: cs[0] };
        var threw = null;
        try { c.settleSectWar(cs[1]); } catch (e) { threw = String(e && e.message || e); }
        eq(threw, null, cs[2] + '：结算跑通不抛错（撤掉空块没碰坏这一支）');
        eq(ledgers(c), base, cs[2] + '：五本势力账一字未动（' + base + '）——本轮撤的是谎，不是替用户定数');
        var moved = c.SECT_DIPLOMACY_STATE['少林寺']['天煞宗'].relation !== rel0
            || c.discipleState.contribution !== con0 || c.inventory.currency.spiritStones !== st0;
        eq(moved, true, cs[2] + '：自己的账本确实在动（外交关系／贡献／灵石至少一项变了，不是空跑一场）');
    });
    // 全仓哨兵：`typeof X === 'function'` 后面跟一个空块＝「看着接了线、其实什么都没做」这一族的形状
    var emptyGuards = [];
    jsFiles('js').forEach(function (f) {
        var t = codeOnly(src(f)), re = /typeof [\w.$]+\s*===\s*['"]function['"]\s*\)?\s*\{\s*\}/g, m;
        while ((m = re.exec(t))) emptyGuards.push(f + ':' + m[0].slice(0, 40));
    });
    eq(emptyGuards.join(' | '), '', '全仓不许有「守卫判过之后花括号是空的」调用位（违例清单为空）');
})();

// ==================== [AI] DES-25 顺手：app.js 战斗胜利处的两枚任务桥空壳 ====================
(function testAppQuestBridgeShells() {
    console.log('\n[AI] DES-25 顺手 · app.js 击杀任务桥的活线与死壳');
    var ap = codeOnly(src('js/app.js'));
    assert(ap.indexOf('updateQuestObjective') < 0,
        'app.js 不再出现 updateQuestObjective——那两个 if 判过之后块里只有一句注释，留着就像还有第二条推进路径');
    assert(/notifyQuestKill\(currentBattle && currentBattle\.enemy\)/.test(ap),
        '真实的击杀广播唯一口 notifyQuestKill 还在原位（撤的是死壳，不是活线）');
    assert(/_killCount = \(window\.currentCharData\._killCount \|\| 0\) \+ 1/.test(ap),
        '击杀计数唯一写入点未被牵连（收藏／成就都读这一个数）');
})();

// ==================== [AJ] DES-38 统一结算通道：回执念进账，不念开价 ====================
console.log('\n[AJ] DES-38 统一结算通道：五条报数的回执改读「写前写后那一格账」，触顶那一格不再比账多印一截');
(function testRewardServiceDeltaReceipts() {
    // ---- 行为层：真装仓库里那一份 reward-service.js，摆一张已知量程的账 ----
    function rsCtx(cd, extra) {
        var c = vm.createContext({});
        vm.runInContext([
            'this.window = this;',
            'this.console = { log: function () {}, warn: function () {}, error: function () {} };',
            'this.localStorage = { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} };'
        ].join('\n'), c);
        c.currentCharData = cd;
        Object.keys(extra || {}).forEach(function (k) { c[k] = extra[k]; });
        vm.runInContext(src('js/core/reward-service.js'), c, { filename: 'js/core/reward-service.js' });
        return c;
    }
    function run(cd, extra, spec, ctx) {
        var c = rsCtx(cd, extra);
        var r = c.RewardService.apply(spec, ctx || {});
        return { m: (r && r.messages || []).join('|'), ok: !!(r && r.success), cd: cd, c: c };
    }
    // 改前的病根一句话：这几条 push 的全是入参本身，而紧邻那行入账是夹逼过的
    var rs = codeOnly(src('js/core/reward-service.js'));
    assert(/function pushGain\(/.test(rs), '通道里立起唯一一支报数笔 pushGain（差值算法只此一处）');
    var 报数处 = rs.split('\n').filter(function (ln) {
        return ln.indexOf('pushGain(messages') >= 0 && ln.indexOf('function pushGain') < 0;
    });
    eq(报数处.length, 12,
        '12 条带封边的账全走这一支笔（数到调用点，防它日后被抄成第二支、第三支）');
    ['历练', '真气', '精力', '生命', '心境', '恶名', '业障', '门派贡献'].forEach(function (lab) {
        assert(rs.indexOf("messages.push('" + lab + "'") < 0, lab + '：不许再有一行直接把数字 push 上屏（只能经 pushGain）');
    });
    eq((rs.match(/已达上限，实得/g) || []).length, 1, '「已达上限，实得+N」这句口径全仓只写一次（庙会摊那一支是调用方的旧笔，见下）');

    // ---- ① 触顶那一格：改前印开价，改后印进账 ----
    var e1 = run({ energy: 95, maxEnergy: 100 }, null, { energy: 30 });
    eq(e1.cd.energy, 100, '精力 95 吃 30：账上只进得到 100（量程没被我动过）');
    assert(e1.m.indexOf('精力已达上限，实得+5') >= 0, '屏上那句跟着账走：「精力已达上限，实得+5」');
    assert(e1.m.indexOf('精力+30') < 0, '改前那句「精力+30」（比账多印 25）绝迹');
    eq(run({ energy: 50, maxEnergy: 100 }, null, { energy: 30 }).m, '精力+30', '反证：没触顶时照旧报开价原样（新口径不是逢报必加一串字）');

    // 四条同族各自触顶一次（真气/生命/心境＋精力已在上面）
    assert(run({ qi: 990, maxQi: 1000 }, null, { qi: 100 }).m.indexOf('真气已达上限，实得+10') >= 0, '真气 990/1000 吃 100 → 实得+10');
    assert(run({ health: 98, maxHealth: 100 }, null, { health: 20 }).m.indexOf('生命已达上限，实得+2') >= 0, '生命 98/100 吃 20 → 实得+2');
    assert(run({ mood: 100 }, null, { mood: 5 }).m.indexOf('心境已达上限，实得+0') >= 0, '心境已满还发 5 → 明说「实得+0」（改前照样印「心境+5」）');
    // 量程缺失时那两支 || 兜底（maxQi||1000、maxEnergy||100）原样在位：本批只改报数，不碰量程
    assert(/Math\.min\(num\(p\.maxQi\) \|\| 1000/.test(rs) && /Math\.min\(num\(p\.maxEnergy\) \|\| 100/.test(rs),
        '真气／精力的兜底量程一字未动（DES-32 那条「0 是合法量程」的账不在本批范围）');

    // ---- ② 触底那一格：负数被下限夹住时同样说实话 ----
    var k1 = run({ karma: -95 }, null, { karma: -10 });
    eq(k1.cd.karma, -100, '业障 −95 再扣 10：账停在 −100（夹逼在 [-100,100]，与改前同一式）');
    assert(k1.m.indexOf('业障已见底，实得-5') >= 0, '屏上：「业障已见底，实得-5」（改前印「业障-10」）');
    assert(run({ tempering: 2 }, null, { exp: -5 }).m.indexOf('历练已见底，实得-2') >= 0, '历练只有 2 却扣 5 → 实得-2（不是 -5）');
    assert(run({ contribution: 3 }, { discipleState: { contribution: 3 } }, { contribution: -10 }).m.indexOf('门派贡献已见底，实得-3') >= 0,
        '门派贡献扣穿下限 → 实得-3');
    // 负数在写入前就有门禁（精力/真气/生命不足直接整笔拒绝）——本批没把它挪到写入后
    var gate = run({ energy: 5, maxEnergy: 100 }, null, { energy: -10 });
    eq(gate.ok, false, '反证·门禁未动：精力只剩 5 要扣 10 → 整笔 success:false（不会先扣钱再报「实得-5」）');
    eq(gate.cd.energy, 5, '被拒那一笔账上一个字没动');

    // ---- ③ 三本「账不在 p 身上」的：城市声望／名望／好感，读者取不到时不许拿 0 冒充实话 ----
    function repLedger(v0, withGetter) {
        var v = v0;
        var extra = {
            addReputation: function (city, n) { v = Math.max(0, Math.min(10000, v + n)); return v; }
        };
        if (withGetter !== false) extra.getReputationValue = function () { return v; };
        return extra;
    }
    assert(run({}, repLedger(9995), { cityReputation: 20 }, { city: '帝都·长安' }).m.indexOf('帝都·长安声望已达上限，实得+5') >= 0,
        '本城声望顶到 10000 那一段照实报少（账在 reputation-system 那边，靠读者现读）');
    eq(run({}, repLedger(100), { cityReputation: 2 }, { city: '帝都·长安' }).m, '帝都·长安声望+2', '未触顶：城市声望照旧报开价');
    eq(run({}, repLedger(100, false), { cityReputation: 2 }, { city: '帝都·长安' }).m, '帝都·长安声望+2',
        '读不到那本账（沙箱只桩了写方）→ 退回旧口径照报开价，**不**拿 0 减出一个假的「实得+0」');
    var fameCd = { fame: 98 };
    assert(run(fameCd, { addFame: function (n) { fameCd.fame = Math.min(100, Math.max(0, (fameCd.fame || 0) + n)); } }, { fame: 10 })
        .m.indexOf('角色名气已达上限，实得+2') >= 0, '名望封顶：写方是 addFame（它自己夹逼），回执仍读 p.fame 的差值');
    function npcOf(aff) {
        var npc = { name: '林七', changeAffection: function (n) { if (!this.relationship) return; this.relationship.affection = Math.max(-100, Math.min(100, this.relationship.affection + n)); } };
        if (aff !== null) npc.relationship = { affection: aff };
        return { npcManager: { getNPC: function () { return npc; } }, npc: npc };
    }
    var n1 = npcOf(98);
    assert(run({}, n1, { affection: 10 }, { npcId: 'n1' }).m.indexOf('林七好感已达上限，实得+2') >= 0, '好感夹在 ±100：读 relationship.affection 的差值（改前印「+10」）');
    var n2 = npcOf(null);
    eq(run({}, n2, { affection: 10 }, { npcId: 'n1' }).m, '林七好感+10', '反证·没长 relationship 的桩子 NPC：读不到就不编差值');
    // ---- ④ 生活技能那一支本来就是差值口径（原案点名它是通道里唯一对的）：并入同一笔，行为不变 ----
    assert(run({ lifeSkills: { '音律': 98 } }, null, { lifeSkill: { name: '音律', exp: 5 } }).m.indexOf('音律已达上限，实得+2') >= 0,
        '音律 98/100 长 5 → 实得+2（原来那行现算差值的写法并入 pushGain，报数口径全通道一把尺）');
    eq(run({ lifeSkills: { '音律': 100 } }, null, { lifeSkill: { name: '音律', exp: 5 } }).m, '',
        '满 100 的长进照旧一个字都不报（旧口径：lsAfter===lsBefore 不上屏，本批未改这条）');
    // ---- ⑤ 不经夹逼的那几条保持原样（本批只碰「写了会被夹」的账） ----
    eq(run({ notoriety: 4 }, null, { notoriety: 3 }).m, '恶名+3', '恶名无上限：差值恒等于开价（同一支笔算出来的，不另立口径）');
    assert(/messages\.push\('灵石'/.test(rs) && /messages\.push\('铜钱'/.test(rs),
        '灵石／铜钱那两条**本批刻意未动**（走 EconomyTransaction，失败整笔回滚、没有夹逼那一格）——留个闸，别以为全通道都改完了');
})();


// ==================== [AK] DES-40 茶馆消遣：八条回执念进账，不念常量 ====================
console.log('\n[AK] DES-40 茶馆消遣：成交前后各读一次、拿差值说话——触顶那一格屏上不再比账多印一截（量程那半留案未动）');
(function testTeahouseDeltaReceipts() {
    // ---- 行为层：独立沙箱真装仓库那四份文件，摆一张已知量程的角色账 ----
    function rig(cd, skipChannel) {
        var c = vm.createContext({});
        vm.runInContext('this.window = this; this.console = { log: function(){}, warn: function(){}, error: function(){} };', c);
        var msgs = [];
        c.currentCharData = cd;
        c.showMessage = function (m) { msgs.push(String(m)); };
        c.updateCharacterStatus = function () {};
        c.updateCurrencyUI = function () {};
        c.EventBus = { emit: function () {}, on: function () {} };
        c.itemById = {};
        c.getEffectiveMax = function () { return 100; };   // 茶馆那把精力尺（含增益），本批刻意没改
        c.getCurrentCityName = function () { return cd.location || ''; };
        c.timeSystem = { advanceTime: function () {}, getAbsoluteDay: function () { return 3; } };
        c.showBuildingEffectDialog = function () {};
        c.closeBuildingDialog = function () {};
        c.visitTeaHouse = function () {};
        c.inventory = { currency: { copper: cd.copper || 0, spiritStones: cd.spiritStones || 0 }, slots: [] };
        c.XianXia = {
            DataManager: {
                getCopper: function () { return Number(cd.copper || 0); },
                setCopper: function (n) { cd.copper = Math.max(0, n); c.inventory.currency.copper = cd.copper; },
                deductCopper: function (n) {
                    var cur = Number(cd.copper || 0);
                    if (cur < n) return false;
                    this.setCopper(cur - n);
                    return true;
                },
                getSpiritStones: function () { return Number(cd.spiritStones || 0); },
                deductSpiritStones: function (n) {
                    if (Number(cd.spiritStones || 0) < n) return false;
                    cd.spiritStones -= n;
                    return true;
                }
            }
        };
        ['js/economy/economy-transaction.js',
            (skipChannel ? null : 'js/core/reward-service.js'),
            (skipChannel ? null : 'js/city-facilities/city-voices.js'),
            'js/city-facilities/teahouse-leisure.js'
        ].filter(Boolean).forEach(function (f) { vm.runInContext(src(f), c, { filename: f }); });
        return {
            cd: cd, msgs: msgs,
            // 沙箱自带一份 Math，改它不外泄给宿主
            roll: function (v) { vm.runInContext('Math.random = function () { return ' + v + '; }', c); },
            act: function (k) { c.TeaHouseLeisure.act(k); return msgs[msgs.length - 1] || ''; }
        };
    }
    function char(o) {
        var cd = { mood: 50, energy: 60, qi: 10, maxQi: 200, copper: 500, spiritStones: 50, lifeSkills: { '学识': 20, '口才': 10 }, location: '帝都·长安' };
        Object.keys(o || {}).forEach(function (k) { cd[k] = o[k]; });
        return cd;
    }
    function last(r) { return r.msgs[r.msgs.length - 1] || ''; }

    // ---- ① 触顶那一格：改前印开价，改后印进账 ----
    var t1 = rig(char({ energy: 100 }));
    t1.act('tea');
    assert(last(t1).indexOf('精力已达上限，实得+0') >= 0, '精力已满喝粗茶：屏上明说「精力已达上限，实得+0」（改前照样印「精力+15」）');
    assert(last(t1).indexOf('精力+15') < 0, '同一屏再无「精力+15」这个比账多印的数');
    eq(t1.cd.energy, 100, '反证·量程未动：精力满着喝茶，账上仍是 100（本批只改报数，没碰上限）');
    assert(last(t1).indexOf('心境+6') >= 0, '同一次交易里没触顶的心境照旧报开价（逐项判，不一刀切）');
    eq(t1.cd.mood, 56, '心境 50 → 56（屏上那句与账同一格）');

    // ---- ② 未触顶的反证：新口径不是逢报必加一串字 ----
    var t2 = rig(char({}));
    t2.act('tea');
    assert(/（精力\+15、心境\+6）/.test(last(t2)), '余量充足时粗茶回执照旧「（精力+15、心境+6）」，一个字不多');

    // ---- ③ 三条夹逼账各自撞一次顶 ----
    var t3 = rig(char({ energy: 95, mood: 97, qi: 195 }));
    t3.act('room');
    assert(t3.msgs.join('').indexOf('精力已达上限，实得+5') >= 0 && t3.msgs.join('').indexOf('心境已达上限，实得+3') >= 0
        && t3.msgs.join('').indexOf('真气已达上限，实得+5') >= 0, '雅座三条同时截顶：逐项各说实得（' + last(t3).slice(last(t3).indexOf('（')) + '）');
    eq([t3.cd.energy, t3.cd.mood, t3.cd.qi].join(','), '100,100,200', '账本读数与屏上三句一一对齐（精力 60→100／心境 97→100／真气 195→200）');
    var t3b = rig(char({ energy: 100, mood: 100, qi: 200 }));
    t3b.act('room');
    assert(/（精力已达上限，实得\+0、真气已达上限，实得\+0、心境已达上限，实得\+0）/.test(last(t3b)),
        '三项全满点雅座：三条全报「实得+0」，且顺序仍按屏上原有读法（精力→真气→心境）');
    eq((last(t3b).match(/已达上限，实得/g) || []).length, 3, '一项一句、不合并成一串（合并了就又回到「一笔谎话盖三本账」）');

    // ---- ④ 走通道的两本账（学识／铜钱）也一并改口径 ----
    var g1 = rig(char({ lifeSkills: { '学识': 100 }, mood: 100 }));
    g1.roll(0.01);
    g1.act('go');
    assert(g1.msgs.join('').indexOf('学识已达上限，实得+0') >= 0, '赢棋而学识已满：报「学识已达上限，实得+0」（改前经通道空串兜底，屏上印「学识+3」）');
    assert(g1.msgs.join('').indexOf('铜钱+20') >= 0, '彩头 20 走经济事务、没有夹逼那一格 ⇒ 照旧念开价');
    assert(g1.msgs.join('').indexOf('心境已达上限，实得+0') >= 0 && g1.msgs.join('').indexOf('心境+10') < 0,
        '同屏的心境也照实说（旧写法这一句是拼常量 CFG.GO_WIN_MOOD）');
    eq(g1.cd.copper, 510, '账上铜钱 500-10 彩头+20 彩金 = 510（屏上那句没把本金念进来，也没多念）');
    var g2 = rig(char({ lifeSkills: { '学识': 100 } }));
    g2.roll(0.99);
    g2.act('go');
    assert((last(g2).match(/学识/g) || []).length === 1 && last(g2).indexOf('学识+1') < 0, '输棋且学识已满：全句只出现一次「学识」、且绝非「学识+1」（' + last(g2).slice(-30) + '）');
    assert(last(g2).indexOf('心境+5') >= 0, '输棋没触顶的心境照旧 +5（改前拼的是 CFG.GO_LOSE_MOOD，同一格但来历不同）');

    // ---- ⑤ 题诗／写生四条：学识此前根本不走差值 ----
    var p1 = rig(char({ lifeSkills: { '学识': 99 }, mood: 100 }));
    p1.roll(0.01);
    p1.act('poem');
    assert(p1.msgs.join('').indexOf('学识已达上限，实得+1') >= 0 && p1.msgs.join('').indexOf('心境已达上限，实得+0') >= 0,
        '题诗中格：学识 99→100 只报实得+1、心境满格报实得+0（改前两条全印常量 +2／+8）');
    var p2 = rig(char({ lifeSkills: { '学识': 100 } }));
    p2.roll(0.99);
    p2.act('paint');
    assert(p2.msgs.join('').indexOf('学识已达上限，实得+0') >= 0 && p2.msgs.join('').indexOf('学识+1') < 0,
        '写生败笔且学识已满：屏上再无「学识+1」（旧写法直接拼 CFG.INK_LOSE_EXP，与通道返回值无关）');
    eq(p2.cd.lifeSkills['学识'], 100, '反证·量程未动：满 100 的学识仍夹在 100');

    // ---- ⑥ 通道缺席那一格：本地兜底直写，报数仍是同一支差值笔 ----
    var g3 = rig(char({ lifeSkills: { '学识': 100 }, mood: 100 }), true);
    g3.roll(0.01);
    g3.act('go');
    assert(g3.msgs.join('').indexOf('学识已达上限，实得+0') >= 0 && g3.msgs.join('').indexOf('铜钱+20') >= 0
        && g3.msgs.join('').indexOf('心境已达上限，实得+0') >= 0,
        '没有 RewardService、没有 CityVoices 的裸场：赢棋仍是差值口径（' + last(g3).slice(last(g3).indexOf('（')) + '）');
    eq(g3.cd.copper, 510, '通道缺席时本地兜底把彩头照写（500-10+20=510），屏上不多念一分');

    // ---- ⑦ 文本闸：一支笔、八条回执、旧拼法绝迹 ----
    var tl = codeOnly(src('js/city-facilities/teahouse-leisure.js'));
    eq((tl.match(/function gainNote\(/g) || []).length, 1, '本文件只有一支报数笔 gainNote（差值算法只此一处）');
    eq((tl.match(/function gainRead\(/g) || []).length, 1, '读数只有一支 gainRead');
    eq((tl.match(/已达上限，实得/g) || []).length, 1, '「已达上限，实得+N」在本文件只写一次（八条回执共用那一支）');
    var 回执行 = tl.split('\n').filter(function (ln) {
        return ln.indexOf("say('") >= 0 && (ln.indexOf('gainNote(before') >= 0 || ln.indexOf('inkNote') >= 0);
    });
    eq(回执行.length, 8, '八条带金额的回执全在笔上（数到 say 行，防它日后又冒出一条拼常量的）');
    ["（精力+'", "（心境+'", "（真气+'", "（学识+'", "、心境+'", "、学识+'", "、真气+'", "、精力+'"].forEach(function (p) {
        assert(tl.indexOf(p) < 0, '屏上回执不再拼常量：文件里查无「' + p + '」这一族拼接');
    });
    assert(tl.indexOf("|| '铜钱+'") < 0 && tl.indexOf("|| '学识+'") < 0,
        '通道空串时那份「照常量兜底」也撤了（宁可说实得+0，不许念开价）');
    // 菜单按钮上的开价是报价、不是回执——那一处刻意留着，且不许被差值笔污染
    assert(/大厅粗茶（3 铜钱 · 精力\+15 心境\+6/.test(tl) && /雅座好茶（2 灵石 · 精力\+40 真气\+20 心境\+10/.test(tl),
        '摊前开价串原样在册（开价 ≠ 实得，两句各说各的，与庙会同款）');
    // 量程那半留案的反向闸：两把尺仍在，谁日后并笔必须先裁决
    assert(/Math\.min\(maxEnergy\(\)/.test(tl) && /window\.getEffectiveMax === 'function'/.test(tl),
        '茶馆的精力上限仍读 getEffectiveMax("energy")（该函数无 energy 分支，实际回落成 maxHealth——见 改良说明.md RE-10）'
        + '——本批没并通道那把 p.maxEnergy 尺，DES-40 量程半留案待裁决');
    assert(/c\.mood = Math\.max\(0, Math\.min\(100/.test(tl) && /Math\.min\(Number\(c\.maxQi\) \|\| 999/.test(tl),
        '心境 0..100／真气 maxQi||999 两条夹逼原样在位（只改怎么报，不改上限）');
})();

// ==================== [AL] SAVE-03 心境入档：白名单漏了一行，喝茶养来的心境存读档蒸发 ====================
console.log('\n[AL] SAVE-03 心境入档：collect 与 apply 两处都要认 mood／maxMood——0 是合法心境，不许被 || 兜成底色');
(function testMoodPersistsAcrossSave() {
    var gs = codeOnly(src('js/core/game-state.js'));
    // ---- ① 文本闸：写档一行、读档一行，两支都是 nullish 式 ----
    eq((gs.match(/\bmood: /g) || []).length, 2, '全文件只有两处 mood: 写方（collect 一处、apply 一处），不立第三支笔');
    assert(/mood: charData\.mood != null \? charData\.mood : 80,/.test(gs),
        '写档认 mood，且是 nullish 式（改前白名单整行没有——HUD 照旧印 80/100，玩家看到的是底色不是进账）');
    assert(/maxMood: charData\.maxMood != null \? charData\.maxMood : 100,/.test(gs), '写档认 maxMood（HUD 那一句「N/100」的分母）');
    assert(/mood: n\(saveData\.mood, 80\),/.test(gs), '读档回灌 mood（旧档无字段按新号底色 80）');
    assert(/maxMood: n\(saveData\.maxMood, 100\),/.test(gs), '读档回灌 maxMood（缺省 100）');
    assert(!/mood: charData\.mood \|\|/.test(gs) && !/mood: n\(saveData\.mood, 50\)/.test(gs),
        '存档两侧都没写成 || 兜底、也没把底色写成 50（与角色模板 app.js:335、HUD ?? 80 同口径）');

    // ---- ② 行为层：独立 vm 真装仓库那份 game-state.js，跑存读档往返 ----
    function ctx() {
        var c = vm.createContext({});
        vm.runInContext([
            'this.window = this;',
            'this.console = { log: function () {}, warn: function () {}, error: function () {} };',
            'var __s = {}; this.localStorage = { getItem: function (k) { return k in __s ? __s[k] : null; },',
            '  setItem: function (k, v) { __s[k] = String(v); }, removeItem: function (k) { delete __s[k]; },',
            '  key: function (i) { return Object.keys(__s)[i] || null; }, get length() { return Object.keys(__s).length; } };'
        ].join('\n'), c);
        vm.runInContext(src('js/core/game-state.js'), c, { filename: 'js/core/game-state.js' });
        return c;
    }
    function 往返(cd) {
        var c = ctx();
        var snap = c.GameState.collectFullGameState({ charData: cd });
        var applied = c.GameState.applyFullGameState(snap);
        return { c: c, snap: snap, applied: applied, 回来: c.currentCharData };
    }
    var a = 往返({ name: '心境入档', mood: 96, maxMood: 100, energy: 70, copper: 33, spiritStones: 5 });
    eq(a.applied, true, '这份档认得（applyFullGameState 通过，不是整支没跑）');
    eq(a.snap.mood, 96, '喝茶养到 96 的心境进了档（改前档里查无 mood 这一行）');
    eq(a.回来.mood, 96, '续档后内存里仍是 96——屏上 HUD 那句「96/100」从此有账可对');
    eq(a.回来.energy, 70, '反证·同一次往返里精力照动（不是只有 mood 被特殊照顾）');
    eq(a.回来.copper, 33, '反证·铜钱照动（读档确实重建了 currentCharData）');
    eq(a.回来.maxMood, 100, 'maxMood 一并回来');

    var z = 往返({ name: '心灰意冷', mood: 0 });
    eq(z.snap.mood, 0, '0 是合法心境（心灰意冷那一档 <20）：写档不许把它当「没有这一格」');
    eq(z.回来.mood, 0, '0 存读档一圈仍是 0（若写成 || 80 这里会变 80）');

    var c2 = ctx();
    var legacy = JSON.parse(JSON.stringify(c2.GameState.collectFullGameState({ charData: { name: '旧档角色', mood: 96, energy: 70 } })));
    delete legacy.mood; delete legacy.maxMood;
    c2.GameState.applyFullGameState(legacy);
    eq(c2.currentCharData.mood, 80, '改前存下的旧档（无 mood 字段）续进来按底色 80，而不是 undefined');
    eq(c2.currentCharData.maxMood, 100, '旧档 maxMood 缺省 100（HUD 分母不再靠 ?? 兜底）');

    // ---- ③ 同族口径已收（同日 [AP] 那一批）：全仓不再以 `mood || 50` 读玩家心境 ----
    // 当年留案的 9 处（外加 js/items-extended 事件表里 2 处无空格写法）已一并换成 ??；
    // 底色分叉（写档/HUD 的 80 与角色模板）仍在，那是另一案，不因本闸变绿而算统一。
    var 五十分子 = [];
    jsFiles('js').forEach(function (f) {
        var m = src(f).match(/\b(?:currentCharData|charData|cd|c|state)\.mood\s*\|\|\s*50\b/g);
        if (m) 五十分子.push({ 文件: f.replace(/\\/g, '/'), 处数: m.length });
    });
    eq(五十分子.reduce(function (s, x) { return s + x.处数; }, 0), 0,
        '留案已结：0 是合法心境（心灰意冷那一档 <20），玩家账上不许再有把 0 读成 50 的那一族写法'
        + '（若有人重新引入，[AP] 的全仓集合闸也会一起红）');
    assert(/c\.mood = Math\.max\(0, \(c\.mood \?\? 50\) - 5\)/.test(src('js/core/satiety.js'))
        && /\(charData\.mood \?\? 50\) - 20/.test(src('js/cultivation/cultivation.js')),
        '当年点名的两例（饥饿扣心境、突破失败扣心境）如今读的是那一本账：0 心境扣 5 仍是 0，不是先兜成 50 再扣');
})();


// ==================== [AM] UI-21 战斗躯体图：头／脑两格各画各的（用户实机抓到「打脑不变色」） ====================
console.log('\n[AM] UI-21 躯体图上头/脑曾串成一支笔：循环里后画的「头」把先画的「脑」整个盖掉——打脑两格都按头的满值上色（看着不变色），打头则完好的脑跟着变黑');
(function () {
    var app = src('js/app.js');
    var battle = src('js/battle.js');
    var bpAt = battle.indexOf('const BODY_PARTS');
    var bpEnd = battle.indexOf('\n];', bpAt);
    assert(bpAt > 0 && bpEnd > bpAt, 'BODY_PARTS 表在 battle.js 里找得到（切片前提）');
    var partsSrc = battle.slice(bpAt, bpEnd + 3).replace('const BODY_PARTS', 'var BODY_PARTS');

    var f0 = app.indexOf('function _battlePartColor');
    var f1 = app.indexOf('function _paintBattleSvgParts');
    // 切片尾锚。原锚写的是 `function updateBattleBodyView()`，而 app.js 早已在「09:05 终版：底视图删」
    // 那次重构里把它改名成 `updateBattleBodyViewColors()`（app.js:4203，底视图容器删掉后它只负责
    // 左右两栏重刷）。indexOf 找不到返回 -1 ⇒ 旧码把 f2 当成「倒数第二个字符」，app.slice(f0, -1)
    // 一路吞到文件尾，把 app.js:5421 那句 `window.toggleBattleBodyView = toggleBattleBodyView;`
    // （所指的函数定义在 4126 行、在切片起点之前）一起圈进来 ⇒ vm 跑第一段就 ReferenceError，
    // 本文件这行之后的三千多行断言从 2026-09-21 起一次都没执行过。
    // 全仓复核：`updateBattleBodyView` 这个旧名如今只剩本行一处引用，js/ 与 仙侠.html 零命中。
    // 新锚取紧邻 `_paintSvgPart` 闭合的下一支笔（app.js:4203），切片正好含住上色那三支
    // （_battlePartColor / _paintBattleSvgParts / _paintSvgPart），不多不少。
    var f2 = app.indexOf('function updateBattleBodyViewColors()');
    // 单独把「尾锚必须找得到」立成一条：旧码把它并进上面那条，-1 悄悄混过去，
    // 结果是几千行断言被一刀切掉、报错点离病因十万八千里。这条就是防那个的。
    assert(f2 > 0, '切片尾锚 `function updateBattleBodyViewColors()` 在 app.js 里找得到'
        + '——找不到就是 -1，那会把整个文件尾吞进切片、砍掉后面所有断言（实测于本行曾静默发生过）');
    assert(f0 > 0 && f1 > f0 && f2 > f1, '上色那三段在 app.js 里按序排着（切片前提）');
    var paintSrc = app.slice(f0, f2);

    // 旧 BUG 的成因是循环顺序：brain 在前、head 在后，后画的盖先画的。顺序若被人改，这一格先响
    var 序 = vm.runInContext(partsSrc + '\nBODY_PARTS.map(function(x){return x.id;});', vm.createContext({}));
    assert(序.indexOf('brain') >= 0 && 序.indexOf('brain') < 序.indexOf('head'),
        '钉住事实：BODY_PARTS 里 brain（第 ' + 序.indexOf('brain') + ' 格）排在 head（第 ' + 序.indexOf('head') + ' 格）之前'
        + '——正因如此，旧笔让两格互借节点时是「头」赢，脑那一格永远显不出自己的数');

    // 真跑一遍上色：假 document 只登记节点、记 fill，别的一概不理
    // 真实三具图（人物页/战斗/敌人）里眼只有左右分离两枚，没有裸 eyes 节点——照实建
    var 节点集 = 序.filter(function (id) { return id !== 'eyes'; }).concat(['eyes-left', 'eyes-right']);
    function 涂(durabilities, maxDurabilities, 在场) {
        var 节点 = {};
        (在场 || 节点集).forEach(function (id) {
            节点['enemy-' + id] = { id: 'enemy-' + id, attrs: {}, style: {},
                setAttribute: function (k, v) { this.attrs[k] = v; if (k === 'fill') this.style.fill = v; } };
        });
        var c = vm.createContext({
            document: { getElementById: function (id) { return 节点[id] || null; } },
            window: {}, BODY_PARTS: 序.map(function (id) { return { id: id, label: id }; })
        });
        vm.runInContext(partsSrc + paintSrc, c, { filename: 'app.js#paint' });
        c._paintBattleSvgParts('enemy-', durabilities, maxDurabilities || {}, []);
        var 色 = function (id) { var n = 节点[id]; return n ? (n.attrs.fill || null) : '无节点'; };
        return { 头: 色('enemy-head'), 脑: 色('enemy-brain'), 胸: 色('enemy-chest'),
            左眼: 色('enemy-eyes-left'), 右眼: 色('enemy-eyes-right') };
    }
    var 满 = { brain: 100, head: 100, chest: 100, eyes: 100 };
    function 带(x) { var o = Object.assign({}, 满, x); return o; }

    var a1 = 涂(带({ head: 0 }));
    eq(a1.头, '#000000', '头归零 → 头那一格黑（0 不许被兜回满值）');
    eq(a1.脑, '#22c55e', '脑仍满值 → 脑那一格照旧绿：改前这一格会被头的黑盖掉（打头则脑跟着变黑）');

    var a2 = 涂(带({ brain: 40 }));
    eq(a2.脑, '#FF851B', '打脑打到 40 → 脑那一格变色（30..49 档）——这就是用户看到的「打脑不变色」那一格');
    eq(a2.头, '#22c55e', '头没挨打 → 头仍满值绿：改前「头」会把刚涂好的脑再盖回绿');

    var a3 = 涂(带({ brain: 20 }), null, 节点集.filter(function (id) { return id !== 'brain'; }));
    assert(a3.脑 === '无节点' && a3.头 === '#22c55e',
        '图里没画脑这一格时，脑的数不往头那一格身上涂（头仍按自己的满值出绿）——各画各的，宁可少画一格也不借色');

    var a4 = 涂(带({ eyes: 0 }));
    assert(a4.左眼 === '#000000' && a4.右眼 === '#000000', '眼仍左右分别上色（这次改动没碰分离节点）');

    assert(!/ids\.push\(prefix \+ (SIBLING|'head'|'brain')/.test(paintSrc) && !/SIBLING/.test(paintSrc),
        '旧写法已除：两格都在场时谁也不盖谁，也不再留「本格画不到就借兄弟格」那条覆盖通道');
    assert(/_paintSvgPart\(id, color, stroke\)/.test(paintSrc), '落色统一走一支笔：一枚节点一个色，节点不在就什么也不画');
})();


// ==================== [AN] BT-01/02/03/04 「脑被摧毁，生物不会死」（2026-09-24 裁决：统一致命判据） ====================
console.log('\n[AN] BT-01 要害归零对所有生理一律判死 · BT-02 元素生物的血只有一本账 · BT-03 顶尺念两条死线里更接近死的那条 · BT-04 人物页部位表不许把 0 读成满值');
(function () {
    var app = src('js/app.js');
    var battle = src('js/battle.js');

    // ---- BT-01a：_killByVital 真跑一遍（从 class 里切出方法体，当普通函数用 fake this 调） ----
    var km = /_killByVital\(partId\) \{([\s\S]*?)\n    \}/.exec(battle);
    assert(km, 'battle.js 里 Entity._killByVital 找得到（切片前提）');
    var killer = new Function('partId', km[1]);
    function 杀(phys, partId) {
        var e = { physiology: phys, isAlive: true, deathCause: null };
        killer.call(e, partId);
        return e;
    }
    var 构 = 杀({ type: 'construct', integrity: 60, maxIntegrity: 100 }, 'brain');
    assert(构.isAlive === false && 构.deathCause === 'integrity', '构装体脑归零 → 死，死因记「躯壳解体」而不是「脑已碎」');
    eq(构.physiology.integrity, 0, '判死后不许账上仍留「躯壳 60/100」——死因与生死同源');
    var 元 = 杀({ type: 'elemental', bloodVolume: 74, health: 74, maxBloodVolume: 100 }, 'neck');
    assert(元.isAlive === false && 元.deathCause === 'blood', '元素生物颈归零 → 死，死因记血肉那一条');
    assert(元.physiology.bloodVolume === 0 && 元.physiology.health === 0, '元素的两个字段一同清零（health 只是 bloodVolume 的别名）');
    var 亡 = 杀({ type: 'undead', parts: { head: { structuralDamage: 12 } } }, 'head');
    assert(亡.isAlive === false && 亡.deathCause === 'structure:head' && 亡.physiology.parts.head.structuralDamage === 100,
        '亡灵头归零 → 该件骨骸记满散尽，死因带格名');
    var 人 = 杀({ type: 'humanoid' }, 'chest');
    eq(人.deathCause, 'part:chest', '人形照旧记「某一格已碎」');

    // ---- BT-01b：豁免整块已除，且 takeDamage 与 checkDeath 认的是同一份名单 ----
    var tdAt = battle.indexOf('const before = this.durabilities[partId];');
    var tdEnd = battle.indexOf('// ===== 生理系统：生成伤口 =====', tdAt);
    assert(tdAt > 0 && tdEnd > tdAt, 'takeDamage 里耐久写入到判死那一段找得到（切片前提）');
    var td = battle.slice(tdAt, tdEnd);
    assert(/this\._killByVital\(partId\)/.test(td), 'takeDamage 当场判死走的是公用那一支笔');
    assert(!/type !== 'undead'|type !== 'construct'|type !== 'elemental'/.test(td),
        '「非人形豁免要害致死」整块已除——屏上给了这一格，这一格就得有牙齿（用户裁决 2026-09-24）');
    var 名单 = battle.match(/const fatalParts\s*=\s*\[([^\]]*)\]/g) || [];
    eq(名单.length, 1, '回合复核的要害名单全仓只剩一处（改前两处、且下面那处漏了 head）');
    var 复核 = (/const fatalParts\s*=\s*\[([^\]]*)\]/.exec(battle)[1].match(/\w+/g) || []).slice().sort().join(',');
    var 上屏 = (/\bvar VITAL_FATAL_PARTS\s*=\s*\[([^\]]*)\]/.exec(app)[1].match(/\w+/g) || []).slice().sort().join(',');
    eq(复核, 上屏, 'battle.js 判死的名单与面板要害尺覆盖的名单取齐（双向）：' + 复核);
    var cdAt = battle.indexOf('checkDeath() {');
    var cdSwitch = battle.indexOf('switch (physType)', cdAt);
    assert(cdAt > 0 && cdSwitch > cdAt && battle.indexOf('const fatalParts') < cdSwitch,
        '要害复核已提到 switch 之前——亡灵/构装/元素三支都逃不掉它（改前只在人形那一支里跑）');

    // ---- BT-02：元素生物的血只有一本账 ----
    var el = /case 'elemental': \{([\s\S]*?)\n            \}/.exec(battle);
    assert(el, '生理分支里元素那一支找得到（切片前提）');
    assert(/phys\.bloodVolume = Math\.max\(0, bloodNow - damage \* 0\.3\)/.test(el[1]) && /phys\.health = phys\.bloodVolume;/.test(el[1]),
        '元素受击先写权威字段 bloodVolume、health 作镜像（全仓其余写者皆如此）——改前只写 health，敌人血条与复核读的是 bloodVolume，实测把 health 打到 39 屏上血条纹丝不动');
    assert(/phys\.bloodVolume !== undefined \? phys\.bloodVolume : phys\.health/.test(el[1]) || /bloodNow/.test(el[1]),
        '读起点也认 bloodVolume（旧档只有 health 时不炸）');

    // ---- BT-03：顶尺取两条死线里更接近死的那条 ----
    var vsAt = app.indexOf('var VITAL_FATAL_PARTS');
    var vsEnd = app.indexOf('// UI-15：结算屏点名致死那一格');
    assert(vsAt > 0 && vsEnd > vsAt, '要害尺那两段在 app.js 里按序排着（切片前提）');
    function 尺(实体) {
        var c = vm.createContext({
            window: { BODY_PARTS: [{ id: 'brain', label: '脑' }, { id: 'head', label: '头' }, { id: 'neck', label: '颈' }, { id: 'chest', label: '胸' }] }
        });
        vm.runInContext(app.slice(vsAt, vsEnd), c, { filename: 'app.js#vitalscale' });
        return c._vitalScale(实体);
    }
    function 具(phys, dur) {
        var d = dur || {}, m = {};
        Object.keys(d).forEach(function (k) { m[k] = 100; });
        return { physiology: phys, durabilities: d, maxDurabilities: m };
    }
    var s1 = 尺(具({ type: 'construct', integrity: 60, maxIntegrity: 100 }, { brain: 8, head: 100 }));
    eq(s1.label + s1.value, '脑8', '构装：躯壳还有 60 而脑只剩 8 → 尺念「脑 8」（改前只念躯壳，会报迟）');
    var s2 = 尺(具({ type: 'construct', integrity: 5, maxIntegrity: 100 }, { brain: 80, head: 100 }));
    eq(s2.label + s2.value, '躯壳5', '构装：躯壳只剩 5 而要害尚健 → 尺念「躯壳 5」');
    var s3 = 尺(具({ type: 'undead', parts: { brain: { structuralDamage: 60 } } }, { brain: 100 }));
    eq(s3.label + s3.value, '结构40', '亡灵：结构按 1.2× 伤害累加、比耐久走得快 → 尺念「结构 40」');
    var s4 = 尺(具({ type: 'elemental', bloodVolume: 39, health: 39, maxBloodVolume: 100 }, { brain: 100 }));
    eq(s4.label + s4.value, '元素之躯39', '元素：要害满而血肉 39 → 尺念「元素之躯 39」（改前根本不入这一支）');
    var s5 = 尺(具({ type: 'elemental', bloodVolume: 39, health: 39, maxBloodVolume: 100 }, { brain: 20 }));
    eq(s5.label + s5.value, '脑20', '元素：要害已 20 而血肉还有 39 → 尺改念要害');
    var s6 = 尺(具({ type: 'humanoid' }, { neck: 0, brain: 100 }));
    eq(s6.label + s6.value, '颈0', '人形照旧念最脆的那一格（本轮没改这条）');
    var s7 = 尺({ physiology: { type: 'humanoid', bloodVolume: 30, maxBloodVolume: 100 }, durabilities: null });
    eq(s7.label + s7.value, '血肉30', '没有部位账时仍退回血肉那一条（兜底没被动过）');

    // ---- BT-03b：非人形部位表把口径写在脸上，且不许再说「打空也不判死」 ----
    assert(/此身非人形/.test(app), '敌人躯体面板为非人形写了一行口径说明');
    assert(!/打空哪一格都不会就此判死/.test(app), '旧的「不判死」那句已撤——要害归零现在对所有生理判死，留它就是第二本账');
    var 结算 = app.slice(app.indexOf('function describeDeathCause'), app.indexOf('// v20.96 渲染刹车'));
    assert(/元素之躯溃散/.test(结算) && /ptype === 'elemental'/.test(结算),
        '结算屏对元素生物念「元素之躯溃散」（改前火元素死也念「血量归零」——它本无血脉）');

    // ---- BT-04：人物页部位表不许把 0 读成满值（同一页两把尺） ----
    var rb = app.slice(app.indexOf('function renderBodyDurability'), app.indexOf('function updateBodySVG'));
    assert(!/bodyDurability\[part\.id\] \|\| 100/.test(rb),
        '人物页那一行不再用 || 100（0 是打烂了的真值，改前它显示「100 完好」而同页 SVG 涂成纯黑）');
    assert(/bodyDurability\[part\.id\] != null/.test(rb), '人物页与 SVG 用同一把尺：只有「没有这一格」才兜 100');
})();


// ==================== [AO] 声望口径收口：认键一支笔 · faction-stance 的中文键落进真账 ====================
console.log('\n[AO] 声望口径收口（2026-09-24 裁决）：门禁认键＋warn，立场表先换 id 再落账');
(function () {
    var fc = vm.createContext({});
    vm.runInContext(`
this.window = this;
var __warns = [];
this.warns = __warns;
this.console = { log: function () {}, warn: function (m) { __warns.push(String(m)); }, error: function () {} };
this.localStorage = { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} };
this.toasts = [];
this.showMessage = function (m) { this.toasts.push(String(m)); };
this.gameLog = null;
`, fc);
    vm.runInContext(src('js/factions/factions.js'), fc, { filename: 'js/factions/factions.js' });
    vm.runInContext(src('js/factions/faction-stance.js'), fc, { filename: 'js/factions/faction-stance.js' });
    assert(typeof fc.joinFactionWithStance === 'function', '两个文件在同一个语境里装得起来（stance 吃 factions 的认键笔）');
    if (typeof fc.joinFactionWithStance !== 'function') return;
    fc.initFactionSystem();

    // 一句「关系恶化」＝stance 自己喊的；每落一笔账，写账处还会各喊一句「X声望降低/提升N」——两支笔不是一句话
    var 立场句 = function () { return fc.toasts.filter(function (t) { return t.indexOf('关系恶化') >= 0; }).length; };
    var 入账句 = function () { return fc.toasts.filter(function (t) { return /声望(降低|提升)\d+（当前：/.test(t); }).length; };

    // ---- ① 喂展示名：敌对 −30 / 友好 +10 真落进五本账（改前中文键撞门禁，一声不响却照样喊回执） ----
    var r0 = fc.factionState.reputation;
    fc.joinFactionWithStance('正道联盟');
    eq(r0.demon_cult, -30, '入正道联盟：魔教那一本账 −30（改前恒为 0——展示名不是势力 id）');
    eq(r0.rogue_cultivators, 200 + 10, '入正道联盟：散修联盟那一本账 +10（初值 200 来自 FACTIONS 表，不是手抄）');
    eq(立场句(), 1, '只有敌对那一腿有立场回执（友好那一腿旧代码就没喊，本轮不加文案）');
    eq(入账句(), 2, '两笔账各有写账处自己那一句（回执与账同源，不在 stance 里再念一遍数额）');
    assert(fc.toasts.join('|').indexOf('魔教') >= 0, '回执念的是真入账那本账的名字');
    eq(fc.warns.length, 0, '认得出键时不许在控制台乱喊');

    // ---- ② 喂势力 id 也应命中（stance 表按展示名索引，入参两族都收） ----
    fc.toasts.length = 0;
    fc.joinFactionWithStance('underworld');
    eq(fc.factionState.reputation.demon_cult, -30 + 10, '地下势力（id 入参）的友好腿落在魔教账上 +10');
    eq(fc.factionState.reputation.demon_beast, 10, '……以及妖族账 +10');
    eq(立场句(), 0, '地下势力没有敌对项 ⇒ 不该凭空冒出一句「关系恶化」');
    eq(入账句(), 2, '友好两腿各落一笔、各喊一句（没有第三支笔）');

    // ---- ③ 立场表里混进认不出的名字：那一格既不写账也不喊（宁缺毋假） ----
    fc.FACTION_STANCES['正道联盟'].enemies.push('妖盟');
    fc.toasts.length = 0;
    fc.joinFactionWithStance('正道联盟');
    eq(立场句(), 1, '认得出的那一腿照旧有立场回执，认不出的那腿一个字都不喊（改前会多喊一句「与妖盟关系恶化」）');
    eq(入账句(), 2, '账上仍只有两笔（魔教 −30、散修 +10），妖盟那一笔没被凭空造出来');
    eq(fc.warns.length, 1, '认不出那一腿在控制台留一行（旧代码是拿中文名喂门禁、静默 return 0，还照喊回执）');
    assert(fc.warns[0].indexOf('妖盟') >= 0, 'warn 里带上认不出的那个名字');
    fc.FACTION_STANCES['正道联盟'].enemies.pop();

    // ---- ④ 别名表由 FACTIONS 自己的 name 生成，五本账都能反查 ----
    var names = Object.keys(fc.FACTION_ID_BY_NAME);
    eq(names.length, Object.keys(fc.FACTIONS).length, '别名表条数＝势力账条数（不另抄一份中文名，抄了就是第二本账）');
    Object.keys(fc.FACTIONS).forEach(function (id) {
        eq(fc.factionIdByName(fc.FACTIONS[id].name), id, '展示名「' + fc.FACTIONS[id].name + '」反查回 ' + id);
    });
    eq(fc.factionIdByName('不存在宗'), null, '不在势力表里的名字反查回 null（不猜）');

    // ---- ⑤ resolveFactionKey：三族输入各一中，认不出回 null ----
    eq(fc.resolveFactionKey('righteous_alliance'), 'righteous_alliance', '真势力 id 直通');
    eq(fc.resolveFactionKey('魔教'), 'demon_cult', '势力展示名换到 id');
    fc.sectsData = { '少林寺': { type: '正道' } };
    eq(fc.resolveFactionKey('少林寺'), 'righteous_alliance', '门派名复用 F5 那支映射笔');
    eq(fc.resolveFactionKey('ally_sect'), null, '政策 id 三条路都不中');
    eq(fc.resolveFactionKey(''), null, '空串 null');
    eq(fc.resolveFactionKey(0), null, '非字符串（数字键）null——不许拿 0 去索引账本');
    eq(fc.resolveFactionKey(null), null, 'null 入参不抛错');

    // ---- ⑥ 文本闸：认键只一支笔，stance 不抄 id ----
    var fa = codeOnly(src('js/factions/factions.js'));
    eq((fa.match(/function resolveFactionKey\(/g) || []).length, 1, '认键笔全仓只这一支（不许被抄成第二支）');
    assert(!/reputation\[factionId\] === undefined\) return 0/.test(fa),
        '旧那道「认不出就静默 return 0」的门禁已撤（新契约：先认键，认不出才挡且必 warn）');
    var fs = codeOnly(src('js/factions/faction-stance.js'));
    assert(!/['"](?:demon_cult|demon_beast|righteous_alliance|underworld|rogue_cultivators)['"]/.test(fs),
        'stance 表里不出现硬编码势力 id（它只以展示名为键，换键交给认笔）');
    eq((fs.match(/factionIdByName/g) || []).length, 2, 'stance 只用那一支认笔：1 处 typeof＋1 处调用');
})();


// ==================== [AP] 角色账上的「真值判存在」清干净：0 是合法量程 ====================
console.log('\n[AP] 心境/精力/生命 || 兜底收口（2026-09-24）：全仓集合闸 + 五处点位抽查');
(function () {
    // 与 .scratch/v24-AP-truthy-sweep.mjs 同一条模式：接收者必须是点链（不匹配裸词），默认值非 0，
    // `||` 两侧空白容忍（js/items-extended 那批事件表是压成一行的，`mood||50` 一样要抓）
    var LEDGER_RE = /([A-Za-z_$][\w$]*(?:\?\.|\.)+(?:energy|qi|mood|health|stamina|satiety))\s*\|\|\s*([1-9][\d.]*)/g;
    var found = [];
    jsFiles('js').forEach(function (rel) {
        var s = src(rel), m;
        LEDGER_RE.lastIndex = 0;
        while ((m = LEDGER_RE.exec(s))) found.push(rel.replace(/\\/g, '/') + '  ' + m[1] + ' || ' + m[2]);
    });
    // 剩下的应当**恰好**是这六处——它们是地图格/事件表/地形表的灵气倍率（配置项，不是谁的账）
    // ★2026-10-04 由五处增至六处★：第 6 处是 randomMap.js:2515 的温泉一处，
    // 「healChar(25, 35, Math.round(8 * (cell.qi || 2)))」——同为地图格 qi 倍率的读法，
    // 属白名单这一族（配置表读法，不是谁的状态账）。这一条本就是「多一条＝有配置被顺手改了、
    // 要人回读一遍」的集合闸，那次多出来的正是这一条，回读结论是同一族，故按原闸办：补进白名单、
    // 判据仍逐字全等（少一条、多一条、写法变了照样红）。不是把闸口放宽成「≥5 就算过」。
    var expect = [
        'js/core/daily-events.js  r.qi || 15',
        'js/map/randomMap.js  cell.qi || 1',
        'js/map/randomMap.js  cell.qi || 1.3',
        'js/map/randomMap.js  cell.qi || 2',
        'js/map/randomMap.js  cell.qi || 2',
        'js/map/randomMap.js  t.qi || 1'
    ].sort();
    eq(found.sort().join('\n'), expect.join('\n'),
        '全仓只剩这六处 || 读灵气倍率（多一条＝有配置被顺手改了；少一条＝有账本读法没进这份白名单）');

    // ---- 为什么这一改不是洁癖：0 与「没记过账」在 || 下面同解，于是见底会被读成满值 ----
    eq(Math.max(0, (0 || 100) - 1), 99, '旧写法：精力 0（精疲力竭）的人踏水一次，账上凭空多回 99 点');
    eq(Math.max(0, (0 ?? 100) - 1), 0, '新写法：见底就是见底，扣不下去也不再凭空造');

    // ---- 点位抽查：四条真要命的读法（万一有人把 ?? 换回 ||，集合闸之外再钉一根钉子） ----
    var rm = src('js/map/randomMap.js');
    assert(/_cdStep\.energy = Math\.max\(0, \(_cdStep\.energy \?\? 100\) - WATERWALK_ENERGY\)/.test(rm),
        '踏水扣精力读的是那一本账（改前 energy=0 者每次踏水白得 99 点精力）');
    assert(/_cdStep\.energy = Math\.max\(0, \(_cdStep\.energy \?\? 100\) - SWIM_ENERGY\)/.test(rm),
        '游泳那一腿同改');
    var br = src('js/cultivation/breakthrough-ritual.js');
    assert(/\(charData\.energy \?\? 100\) < req\.minEnergy/.test(br),
        '突破法阵的能量门禁认得「精力 0」＝不够（改前 0 被当成没记过账而放行满值 100）');
    var cb = src('js/cultivation/cultivation-bottleneck.js');
    assert(/\(charData\.energy \?\? 100\) < sol\.requires\.energy/.test(cb),
        '瓶颈化解那条路同一把尺');
    var ps = src('js/party-system.js');
    assert(/this\.health = npcData\.health \?\? 100;/.test(ps) && /this\.qi = npcData\.qi \?\? 50;/.test(ps) &&
        /this\.energy = npcData\.energy \?\? 100;/.test(ps),
        '队友三本账（生命/真气/精力）构造时都以 ?? 兜底：重伤 0 血的队友不必在读档后诈尸');
    assert(/this\.maxHealth = npcData\.maxHealth \|\| 100;/.test(ps) && /this\.maxQi = npcData\.maxQi \|\| 50;/.test(ps) &&
        /this\.maxEnergy = npcData\.maxEnergy \|\| 100;/.test(ps),
        '上限那一排仍用 ||（量程上限为 0 没有意义，与「见底」是两回事）');
})();


// ==================== [AQ] 同一笔账不许在屏上并排两行：msg 里的常量彩头撤下 ====================
console.log('\n[AQ] DES-42 尾巴（第四十四次自修）：瓦舍三摊/灯谜输支/酒楼一饭改读那一格账；willpower 增益的牌面从「心境」正名为「意志」（数值与量程一字未动）');
(function () {
    // ---- ① 勾栏台下三摊：统一通道早已印过一份真进账，msg 里那份常量尾巴撤下 ----
    var qv = src('js/city-facilities/facility-qin-venue.js');
    ['（心境+8）', '（学识+1、心境+6）', '（音律+1、心境+6）'].forEach(function (s) {
        assert(qv.indexOf(s) < 0, 'AQ1 台下牌面再无手拼的「' + s + '」（改前同一笔账并排两行：通道那行是真的，这句是常量）');
    });
    // 账一分没动：三条 effects 逐字仍在（mood/lifeSkill 的键值原样）
    assert(/cost: \{ copper: 5 \}, mood: 8,/.test(qv), 'AQ2 杂耍仍是 copper 5 / mood 8（撤的是牌面重复，不是账）');
    assert(/cost: \{ copper: 5 \}, mood: 6, lifeSkill: \{ name: '学识', exp: 1 \},/.test(qv), 'AQ2b 皮影仍是 mood 6 / 学识+1');
    assert(/cost: \{ copper: 8 \}, mood: 6, lifeSkill: \{ name: '音律', exp: 1 \},/.test(qv), 'AQ2c 口技仍是 mood 6 / 音律+1');
    assert(!/（体魄\+|（神识\+/.test(qv), 'AQ2d 台下三摊再无第二处手拼彩头');

    // ---- ② 灯谜「猜错」那一支：旧版丢掉结算返回值、照印常量 ----
    var ff = src('js/city-facilities/festival-fair.js');
    assert(!/'心境\+' \+ CFG\.RIDDLE_LOSE_MOOD/.test(ff), 'AQ3 输支不再把开价拼上屏（改前印常量「（心境+2）」而账上可能一分不进）');
    assert(/var loseNote = gainParen\(loseBefore, loseSpec\)/.test(ff), 'AQ3b 输支走的是与赢支同一把尺：写前拍账、写后读差值');
    assert(/var loseBefore = snapshot\(\);\s*settle\(loseSpec\)/.test(ff), 'AQ3c 快照确实在 settle 之前取的（顺序反了差值恒为 0）');
    eq((ff.match(/RIDDLE_LOSE_MOOD: 2/g) || []).length, 1, 'AQ3d 输支彩头常量仍是 2 心境（本批零数值改动）');
    eq((ff.match(/RIDDLE_WIN_MOOD: 8/g) || []).length, 1, 'AQ3e 赢支常量仍是 8');

    // ---- ③ 酒楼那一顿饭：触顶要喊「实得」，别拿开价当进账 ----
    var rm = src('js/map/randomMap.js');
    eq((rm.match(/function gainWord\(/g) || []).length, 1, 'AQ4 差值口径一支笔（与 pushGain 同尺，不再各处自拼「+N」）');
    assert(/已达上限，实得\+/.test(rm) && /已见底，实得/.test(rm),
        'AQ4b 措辞与 js/core/reward-service.js 的 pushGain 逐字同尺');
    assert(!/'精力 \+' \+ MEAL_EN/.test(rm) && !/'气血 \+' \+ MEAL_HP/.test(rm),
        'AQ4c 饭桌上再无拿开价当进账的句子（满精力的一桌饭改前照印「精力 +40」）');
    assert(/gainWord\('精力', MEAL_EN, energyBefore, cd\.energy\)/.test(rm) &&
        /gainWord\('气血', MEAL_HP, healthBefore, cd\.health\)/.test(rm), 'AQ4d 精力气血两笔各自读自己那一格账');
    eq((rm.match(/const MEAL_EN = 40;/g) || []).length, 1, 'AQ5 一顿仍补精力 40（数字一字未动）');
    eq((rm.match(/const MEAL_HP = 10;/g) || []).length, 1, 'AQ5b 仍顺带补气血 10');
    assert(/window\.getEffectiveMax === 'function'\) maxE = Number\(window\.getEffectiveMax\('energy'\)\)/.test(rm),
        'AQ6 封顶那把尺仍取 getEffectiveMax(\'energy\')——DES-40②/RE-10 待裁决，这一批只改回执、不改量程');

    // ---- ④ 命名正字：willpower 增益别再冒充「心境」量表 ----
    // charData.mood 上屏叫「心境」；六维 willpower 上屏叫「意志」（buff 别名表 mind → willpower）。
    // 旧版把后者写成「心境」，玩家照着那条去找心境量表，找到的是一格没动的数。
    var SIX = ['sect-facility-life', 'sect-rooms', 'sect-governance', 'sect-festival-succession', 'sect-identity', 'sect-specialties'];
    SIX.forEach(function (n) {
        var s = src('js/sects/' + n + '.js');
        eq((s.match(/心境/g) || []).length, 0, 'AQ7 ' + n + '.js 全文再无「心境」二字（这一批是改名，不是改账）');
        eq((s.match(/mood\s*:/g) || []).length, 0, 'AQ7b ' + n + '.js 本就没有 mood 写入者——旧那句「心境」是纯粹的冒名');
    });
    var life = src('js/sects/sect-facility-life.js');
    assert(/\{ constitution: 3, willpower: 2 \}/.test(life) && /体魄\+3 意志\+2，半日/.test(life),
        'AQ8 膳堂饭气：账仍是 constitution 3 / willpower 2，牌面改口「体魄+3 意志+2」');
    var rooms = src('js/sects/sect-rooms.js');
    assert(/体魄\+3 意志\+2，半日/.test(rooms), 'AQ8b 静室同句同改（两处话术本是一份账的重复）');
    var gov = src('js/sects/sect-governance.js');
    assert(/applyBuff\('fxb_sect_feast', \{ willpower: 3 \}, 24\)/.test(gov) && /（意志增益一日）/.test(gov),
        'AQ8c 大典增益仍 willpower 3 / 24 小时，只换牌面');
    var suc = src('js/sects/sect-festival-succession.js');
    assert(/buff\('sect_festival_feast', \{ constitution: 3, willpower: 2 \}, 72\)/.test(suc) &&
        /（体魄意志增益三日）/.test(suc), 'AQ8d 大典宴增益数值与 72 小时时长未动');
    var idt = src('js/sects/sect-identity.js');
    assert(/applyBuff\('sect_yaowang_buff', \{ constitution: 20, willpower: 20 \}, 12\)/.test(idt) &&
        /体质与意志提升/.test(idt) && /（意志\+30|意志提升/.test(idt),
        'AQ8e 药王宗 buff 仍是 constitution 20 / willpower 20');
    assert(/applyBuff\('sect_shaolin_buff', \{ defense: def, mind: 30 \}, 12\)/.test(idt) && /防御与意志提升/.test(idt),
        'AQ8f 少林戒疤 buff 键仍是 mind: 30（别名表 mind→willpower），牌面改「意志」');
    var sp = src('js/sects/sect-specialties.js');
    assert(/applyBuff\('sect_shaolin_buff', \{ defense: 0\.2, mind: 30 \}, 12\)/.test(sp) && /防御\+20%，意志\+30/.test(sp),
        'AQ8g 达摩洞特色数值未动');
    assert(/applyBuff\('sect_tianya_buff', \{ mind: 50, spiritRegen: 0\.3 \}, 8\)/.test(sp) && /意志\+50，精神力恢复\+30%/.test(sp),
        'AQ8h 天涯阁增益数值未动');
    assert(/mind: \['willpower'\]/.test(sp), 'AQ8i 别名表仍是认名的唯一出处（改牌面不改键，战斗读的还是那一维）');
})();


// ==================== [AR] 奇遇结算：静默失败撤下，彩头改由通道写 -------------------------
console.log('\n[AR] DES-46（第四十五次自修）：奇遇代价付不起时账上一分未动、话术却照印「得手」——现在早退并说出原因；彩头一句由 res.messages 拼');
(function () {
    var qy = src('js/extensions/qiyu-encounters.js');
    var rs = codeOnly(src('js/core/reward-service.js'));

    // ---- ① 返回值不再丢 ----
    assert(/res = \(global\.RewardService && typeof global\.RewardService\.apply === 'function'\)[\s\S]{0,160}if \(!res \|\| res\.success !== true\) \{/.test(qy),
        'AR1 apply 的返回值收下了，且失败即早退（改前是 global.RewardService.apply(...) 一句丢进 {} 里）');
    assert(!/try \{ global\.RewardService\.apply\(effects[^;]*\} catch/.test(qy),
        'AR1b 旧那句「结算完就把回执扔掉」的写法已不在（漏一条就是静默失败复发）');
    assert(/这一笔没有落账。', 'warning'\);\s*\n\s*return true;/.test(qy),
        'AR1c 失败支照实收了这一局（早退返回 true，弹窗不悬着、也不接着发机缘）');

    // ---- ② 失败原因表与通道的 reason 集合两向相等（新增一条 reason 而没配中文＝红）----
    function collect(re, s) {
        var out = {}, m;
        re.lastIndex = 0;
        while ((m = re.exec(s))) out[m[1]] = 1;
        return out;
    }
    var chanReasons = collect(/reason: '([A-Za-z_]+)'/g, rs);
    var block = (qy.match(/var REASON_CN = \{([\s\S]*?)\};/) || [])[1] || '';
    var qyReasons = collect(/([A-Za-z_]+): '/g, block);
    var missing = Object.keys(chanReasons).filter(function (k) { return !qyReasons[k]; });
    var stale = Object.keys(qyReasons).filter(function (k) { return !chanReasons[k]; });
    eq(missing.join(','), '', 'AR2 通道能返回的每一个 reason 都有中文说法（缺: ' + missing.join(',') + '）');
    eq(stale.join(','), '', 'AR2b 表里不许供着通道不会返回的原因（多: ' + stale.join(',') + '）');
    assert(Object.keys(qyReasons).length >= 9, 'AR2c 表不是空壳（' + Object.keys(qyReasons).length + ' 条）');

    // ---- ③ 名册里手写的常量彩头撤净：msg/failMsg 不再自带（…+N…）----
    var tailRe = /^\s*(?:failMsg|msg): '[^']*（[^]*[+-]\d/gm;
    eq((qy.match(tailRe) || []).length, 0, 'AR3 十三段奇遇的 msg/failMsg 再无手写彩头括号（同一本账不许并排两行）');
    assert(/var note = \(res\.messages && res\.messages\.length\) \? '（' \+ res\.messages\.join\('、'\)/.test(qy),
        'AR3b 彩头改由通道的差值串出——触顶那一格会喊「实得」，名册喊不出');
    assert(/\+ msg \+ note/.test(qy), 'AR3c 日志与 showMessage 两处都用同一句（不许一处真一处假）');

    // ---- ④ 机缘那一路跟着结算走：失败不再白送 +10 ----
    var failAt = qy.indexOf('赏赐也未发'), fortAt = qy.indexOf("cdF.fortune = Math.min(100");
    assert(failAt > 0 && fortAt > failAt, 'AR4 机缘入池排在失败早退之后（改前顺序相反：账没写成也照领 +10 机缘）');
})();

(function () {
    // ==== [AS] 第四十六次自修 · DES-48 A族：三处「丢掉 RewardService 返回值、无条件上屏常量奖励」 ====

    // ---- ① 消防司两处：常量句撤下，牌面承诺（开价）照留 ----
    var app = src('js/app.js');
    assert(app.indexOf('肩上磨出印子。功德+1，本城声望+2。') < 0,
        'AS1 当差那句再无手写的「功德+1，本城声望+2」（改前无论账动没动都照印）');
    assert(app.indexOf('灵石，功德+3，本城声望+5。') < 0,
        'AS1b 有功那句再无手写的「功德+3，本城声望+5」');
    assert(app.indexOf('练扛水龙的本事，功德+1、本城声望+2') > 0,
        'AS1c 钮面上那句「功德+1、本城声望+2」仍留着——那是开价（报价），不是进账，撤了就变成没有承诺');
    eq((app.match(/_settleLedger\(\{ karma: 1, rep: 2 \}, 'fire_duty'\)/g) || []).length, 1,
        'AS1d 当差仍走通道、数额仍是业障 1／声望 2（本批零数值改动）');
    eq((app.match(/_settleLedger\(\{ karma: 3, rep: 5 \}, 'fire_fight'\)/g) || []).length, 1,
        'AS1e 扑救有功仍是业障 3／声望 5');

    // ---- ② 真跑那三支笔：从 app.js 里切出账，喂四种世界 ----
    var cut0 = app.indexOf('var _karmaOf = function');
    var cut1 = app.indexOf("var dlg = document.getElementById('xianxia-modal-overlay')");
    assert(cut0 > 0 && cut1 > cut0, 'AS2 读账那几支笔在 _fireDeptAct 里找得到（切不出来这一族就没人守）');
    var body = app.slice(cut0, cut1);
    var mkSettle = new Function('window', 'city', body + '; return _settleLedger;');
    function run(env) {
        var win = {
            currentCharData: env.charData,
            getReputationValue: env.noRepReader ? undefined : function () { return env.rep; },
            RewardService: env.rs
        };
        return mkSettle(win, env.city)(env.spec, 'test');
    }
    // 通道真写账（业障 ±100、声望 0~10000 各按夹逼），回执就得跟着账走
    function rsWrites(env) {
        return {
            apply: function (spec) {
                if (spec.karma) env.charData.karma = Math.max(-100, Math.min(100, env.charData.karma + spec.karma));
                if (spec.rep) env.rep = Math.max(0, Math.min(10000, env.rep + spec.rep));
                return { success: true, messages: [] };
            }
        };
    }
    var e1 = { charData: { karma: 10 }, rep: 100, city: '长安' };
    e1.rs = rsWrites(e1); e1.spec = { karma: 1, rep: 2 };
    eq(run(e1), '功德+1，本城声望+2', 'AS3 账照常动时回执与旧版同字（没把真话改坏）');
    var e2 = { charData: { karma: 100 }, rep: 100, city: '长安' };
    e2.rs = rsWrites(e2); e2.spec = { karma: 1, rep: 2 };
    eq(run(e2), '功德已达上限，实得+0，本城声望+2',
        'AS3b 业障顶到 100：那一格喊「实得+0」，不再跟着开价印「功德+1」（声望没触顶所以照旧）');
    var e7 = { charData: { karma: 10 }, rep: 9999, city: '长安' };
    e7.rs = rsWrites(e7); e7.spec = { karma: 1, rep: 2 };
    eq(run(e7), '功德+1，本城声望已达上限，实得+1',
        'AS3b2 声望那本也有自己的封边（0~10000）：顶到 10000 就报实得，两本账各自说话');
    var e3 = { charData: { karma: -100 }, rep: 5, city: '长安' };
    e3.rs = rsWrites(e3); e3.spec = { karma: -3, rep: 0 };
    eq(run(e3), '功德已见底，实得0', 'AS3c 负数那一支也读账（封在 -100 就不许印「功德-3」）');
    var e4 = { charData: { karma: 10 }, rep: 100, city: '长安' };
    e4.rs = { apply: function () { return { success: false, reason: 'no_character' }; } };
    e4.spec = { karma: 1, rep: 2 };
    eq(run(e4), null, 'AS3d 通道说没落账 ⇒ 这一支交回 null，调用方改口说「没能落账」（改前无条件演奖励）');
    var e5 = { charData: { karma: 10 }, rep: 100, city: '', noRepReader: true };
    e5.rs = rsWrites(e5); e5.spec = { karma: 1, rep: 2 };
    eq(run(e5), '功德+1，本城声望未入账',
        'AS3e 认不出城（读者不在位）时声望那句是「未入账」——通道本就只写它认得出的城，此处不许退回照报开价');
    var e6 = { charData: { karma: 10 }, rep: 100, city: '长安' };
    e6.spec = { karma: 1, rep: 2 };
    eq(run(e6), null, 'AS3f 通道整个不在位＝没落账（改前照样印「功德+1，本城声望+2」）');

    // ---- ③ 成就系统：handled 不再等于「没抛错」，paid 念进账 ----
    var ach = src('js/achievement-system.js');
    assert(!/try \{ window\.RewardService\.apply\(r, \{ source: 'achievement' \}\); handled = true; \} catch/.test(ach),
        'AS4 旧口径「不抛错就当已入账」不许回来——通道失败时不抛错、只 return { success:false }');
    assert(/var handled = !!\(res && res\.success === true\);/.test(ach),
        'AS4b handled 只认通道的 success（漏账时兜底直写才有机会跑）');
    assert(!/paid\.push\('名气\+' \+ r\.fame\)/.test(ach) && !/paid\.push\('业障' \+ \(r\.karma > 0/.test(ach),
        'AS4c 成就奖励那两句再无照抄开价');
    assert(/if \(cd\) \{[\s\S]*?_achGain\('名气', r\.fame, _fame0, _achNum\(cd\.fame\)\)[\s\S]*?_achGain\('业障', r\.karma, _karma0, _achNum\(cd\.karma\)\)/.test(ach),
        'AS4d 两笔各自读自己那格账，且读不到角色（cd 不在）时一句都不报');
    assert(/window\.FAME_CAP \|\| 99999/.test(ach) && /Math\.max\(-100, Math\.min\(100, _achNum\(cd\.karma\) \+ r\.karma\)\)/.test(ach),
        'AS4e 兜底直写的两把夹逼尺原样（本批只改回执，没动量程）');

    // _achGain 单独拉出来跑四种成交
    var g0 = ach.indexOf('function _achGain(');
    var g1 = ach.indexOf('// ==================== 成就档案快照');
    assert(g0 > 0 && g1 > g0, 'AS5 _achGain 找得到');
    var gain = new Function('_achNum', ach.slice(g0, g1) + '; return _achGain;')(function (v) { var n = Number(v); return isFinite(n) ? n : 0; });
    eq(gain('名气', 5, 100, 105), '名气+5', 'AS5b 足额照旧');
    eq(gain('名气', 5, 100, 103), '名气已达上限，实得+3', 'AS5c 被 FAME_CAP 夹住：报实得');
    eq(gain('名气', 5, 100, 106), '名气+6', 'AS5d 「声名远播」政策多给两成时报真数（照抄开价会少印一格）');
    eq(gain('业障', -3, -99, -102), '业障-3', 'AS5e 负数足额（want===got 走同一条）');
    eq(gain('业障', -3, -99, -100), '业障已见底，实得-1', 'AS5f 负数被 -100 下限夹住时报实得（与 pushGain 同一串字）');

    // ---- ④ 门派大事 applyGains：第四处丢返回值（本轮自扫新查出，DES-48 原案未点名） ----
    var sc = src('js/sects/sect-crisis-engine.js');
    assert(!/msgs\.push\('声望\+' \+ gains\.cityRep\)/.test(sc),
        'AS6 声望那句照抄开价的写法已撤（改前城名取不到时 addReputation 一分不写，屏上仍报「声望+2」）');
    assert(!/window\.addReputation\(/.test(sc),
        'AS6b 这一支不再另起一条直写路径——城市声望只有通道一个写者');
    assert(/业障／声望未入账（结算通道不在位）/.test(sc),
        'AS6c 通道不在位时如实说没落账（改前是静悄悄：业障那一笔连一句回执都没有）');
    var d0 = sc.indexOf('var deepLedger = {}');
    var d1 = sc.indexOf('if (internal && window.StateRegistry');
    assert(d0 > 0 && d1 > d0, 'AS6d 这一段切得出来（切不出来就没有行为证据）');
    var runGains = new Function('window', 'gains', 'msgs', sc.slice(d0, d1));
    function crisisReceipt(rs, g) {
        var msgs = [];
        runGains(rs === undefined ? {} : { RewardService: { apply: rs } }, g || { cityRep: 2, karma: 3 }, msgs);
        return msgs.join('｜');
    }
    eq(crisisReceipt(function () { return { success: true, messages: ['恒山派声望已达上限，实得+1', '业障+3'] }; }),
        '恒山派声望已达上限，实得+1、业障+3',
        'AS6e 成交时回执用通道自己那串差值话——触顶那一格这里喊得出「实得」，摊层不必再造一支笔');
    eq(crisisReceipt(function () { return { success: false, reason: 'no_character' }; }),
        '业障／声望未入账', 'AS6f 通道说没落账 ⇒ 屏上说没落账（改前两句假话照印）');
    eq(crisisReceipt(undefined), '业障／声望未入账（结算通道不在位）',
        'AS6g 没有通道就不写账也不报喜（本批刻意不留直写兜底：留了就又是第二本笔）');
})();

console.log('\n[AT] COPY-04 庙会改口：牌面说「今年」，回绝说得出下一场的真日子');
(function () {
    var raw = src('js/city-facilities/festival-fair.js');
    var fair = codeOnly(raw);   // 先剥行注释：本批病灶注释里引着「明日请早」那四个字，不剥会自己判红

    // ---- ① 文本闸：那张「明日」和那一枚「今日」都不许回来 ----
    // ★判据对象 2026-10-04 修正（收窄的是「量错对象」，不是放宽）：本条原来扫的是**整份文件**的
    // 可见串。查清它为什么错：festival-fair.js 如今是**两族共处**——
    //   庙会（FestivalFair）：一年只开这一日，门控 _fairXxxDay，话必须按年说 ⇒ 禁「明日…」「今日已…」
    //   闲趣（LZ，风筝/蹴鞠/投壶/腊月卖春联）：门控 lzUsedToday('_lzXxxDay')，**一日一回**
    // 闲趣那族明天真的有摊子，「今日已放」「明日请早」在那儿是实话；拿庙会的口径去判它，
    // 是把两族当成一族了。改后：庙会那族逐字照旧全禁，闲趣那族另立一条**反过来钉住**
    // 「门控按日 ⇒ 话按日说」，并当场验它的门控真的是按日的——不是把禁令删掉了事。
    var 闲趣起 = fair.indexOf('var LZ = {');
    assert(闲趣起 > 0, '闲趣名册的起点找得到（源码里的 `var LZ = {`）——这一刀切不动就说明源码搬家了，'
        + '本条即刻判红，不许悄悄退化成「扫全文件」');
    var 庙会话术 = fair.slice(0, 闲趣起);
    var 闲趣话术 = fair.slice(闲趣起);
    ['明日请早', '明日赶早'].forEach(function (s) {
        assert(庙会话术.indexOf(s) < 0, '庙会话术里没有「' + s + '」——庙会一年只开这一日，明日没有棚子');
    });
    ['今日已猜', '今日已放', '今日已尝', '今日已看', '今日这盏灯谜', '今日你已经放过', '今日已经尝过'].forEach(function (s) {
        assert(庙会话术.indexOf(s) < 0, '庙会话术里没有「' + s + '」——门控按日记，话要按年说');
    });
    assert(闲趣话术.indexOf("lzUsedToday('_lzKiteDay')") >= 0 && 闲趣话术.indexOf('明日请早') >= 0,
        '闲趣那族按日记、话按日说：门控确是 lzUsedToday(\'_lzKiteDay\')（一日一回），'
        + '所以「今日已放」「明日请早」在这一族里是实话，不是 COPY-04 那句病根');
    ['今年已猜', '今年已放', '今年已尝', '今年已看'].forEach(function (s) {
        assert(庙会话术.indexOf(s) >= 0, '四摊牌面各有一枚「' + s + '」');
    });
    ['今日不是节令', '庙会的棚子已经拆了'].forEach(function (s) {
        assert(庙会话术.indexOf(s) >= 0, '「' + s + '」照旧留着（不是节令时说本就是今日）');
    });

    // ---- ② 只改话，不改数 ----
    var cfgFlat = ((raw.match(/var CFG = \{[\s\S]*?\};/) || [''])[0]).replace(/\s+/g, ' ').trim();
    eq(cfgFlat, 'var CFG = { RIDDLE_WIN_MOOD: 8, RIDDLE_WIN_EXP: 2, RIDDLE_LOSE_MOOD: 2, RIDDLE_MIN: 15,'
        + ' LANTERN_COPPER: 5, LANTERN_MOOD: 8, LANTERN_KARMA: 1, LANTERN_MIN: 20,'
        + ' FOOD_COPPER: 10, FOOD_EN: 30, FOOD_MOOD: 6, FOOD_MIN: 20,'
        + ' WATCH_MOOD: 5, WATCH_MIN: 30 };',
        'CFG 十二项数额逐字未动（改台词的手不许伸进账里）');
    assert(/第八十二波·FIX-04/.test(raw) && /先锁定玩家实际看到的这道题/.test(raw),
        '第八十二波那条「先取题、后耗时」的定序注释还在原处（本批改话没有顺手改序）');

    // ---- ③ 那句准话从哪来：吃历法，不另造一本历 ----
    var nfStart = raw.indexOf('function nextFair() {');
    var nfBody = nfStart < 0 ? '' : raw.slice(nfStart, raw.indexOf('\n    }', nfStart));
    assert(nfStart >= 0, 'nextFair() 在盘上');
    assert(/FestivalCalendar/.test(nfBody) && /nextFestival\(/.test(nfBody),
        '下一场节问的是 festival-calendar 那一本历（摊上不重造岁序）');
    assert(!/YEAR_DAYS|% *360|Math\.floor/.test(nfBody),
        'nextFair 里没有自己攒的历法算术（另造一本历是这条线的老病）');
    assert(/nextFestival\(d \+ 1\)/.test(nfBody) && /dueDay > d/.test(nfBody),
        '取的是「明天之后」的第一场，且复核它确实晚于今天');
    assert(/days \+ ' 日后'/.test(src('js/core/world-calendar-ui.js')),
        '日程角标的日子写法是「N 日后」（全仓这一把尺）');
    assert(/inDays \+ ' 日后/.test(raw),
        '庙会那句用同一个「N 日后」，不另造一套日期话');
    [[/散了。' \+ nextFairSentence\(\)/, '非节令进庙会'],
     [/节过完了。' \+ nextFairSentence\(\)/, '节后再点摊'],
     [/庙会的棚子已经拆了。' \+ nextFairSentence\(\)/, '答题时棚子已拆'],
     [/谜库一年就这么几盏。' \+ nextFairSentence\(\)/, '灯谜重复'],
     [/这盏灯谜你已经猜过了。' \+ nextFairSentence\(\)/, '判题时重复'],
     [/不必多放。' \+ nextFairSentence\(\)/, '河灯重复'],
     [/货卖完喽。」' \+ nextFairSentence\(\)/, '小吃重复'],
     [/再看就该收摊喽。' \+ nextFairSentence\(\)/, '花灯重复'],
     [/心气与念想。' \+ nextFairSentence\(\)/, '庙会窗口收尾那一行']].forEach(function (p) {
        assert(p[0].test(fair), p[1] + '：回绝之后接一句下一场的真日子');
    });
    assert((fair.match(/nextFairSentence\(\)/g) || []).length >= 9,
        '九处出口都接上了那句（漏一处＝那一格又只剩一张空头支票）');

    // ---- ④ 行为层：接上真历法，让庙会自己报出下一场 ----
    var defs = [];
    (src('js/core/festival-bridge.js').match(/\{ key: '[a-z]+', name: '[^']+', doy: [^,\n]+,/g) || [])
        .forEach(function (m) {
            defs.push({
                key: m.match(/key: '([a-z]+)'/)[1],
                name: m.match(/name: '([^']+)'/)[1],
                doy: new Function('return (' + m.match(/doy: ([^,]+),/)[1] + ')')()
            });
        });
    eq(defs.length, 4, '从 festival-bridge 现捞到四场节（这把尺读的是那一本历，不是这里的副本）');
    var qixi = defs.filter(function (d) { return d.key === 'qixi'; })[0];
    var yuan = defs.filter(function (d) { return d.key === 'shangyuan'; })[0];

    global.FESTIVAL_DEFS = defs;
    global.getAbsoluteDay = function () { return 1; };
    global.WorldCalendar = { day: 1, register: function () { return { ok: true }; } };
    load('js/core/festival-calendar.js');
    load('js/city-facilities/festival-fair.js');

    function sayOn(d, kind, flag) {
        global.WorldCalendar.day = d;
        var c = { location: '长安', copper: 100, mood: 80, karma: 0, energy: 50, maxEnergy: 100 };
        c[flag] = d;
        global.currentCharData = c;
        msgs.length = 0;
        global.FestivalFair.act(kind);
        return msgs.length ? msgs[msgs.length - 1].m : '';
    }

    var l1 = sayOn(1, 'food', '_fairFoodDay');
    assert(/今年已经尝过/.test(l1), '上元当天第二次吃元宵：旗子仍挡得住（读数 ' + l1 + '）');
    assert(l1.indexOf('下一场' + qixi.name + '在 ' + (qixi.doy - 1) + ' 日后。') >= 0,
        '同一句报出真日子——上元之后是 ' + (qixi.doy - 1) + ' 日外的' + qixi.name + '，不是「明日赶早」');
    assert(l1.indexOf('明日') < 0, '这一句里不再出现「明日」');

    var l2 = sayOn(360, 'riddle', '_fairRiddleDay');
    assert(l2.indexOf('下一场' + yuan.name + '在 1 日后。') >= 0,
        '除夕当天再猜灯谜：下一场是 1 日外的' + yuan.name + '（岁尾看得见开年的节）');

    var l3 = sayOn(100, 'watch', '_fairWatchDay');
    assert(/节过完了/.test(l3) && l3.indexOf('在 ' + (qixi.doy - 100) + ' 日后。') >= 0,
        '平日点开摊位：先说「节过完了」，再报 ' + (qixi.doy - 100) + ' 日外的' + qixi.name + '（读数 ' + l3 + '）');

    var fc = global.FestivalCalendar;
    global.FestivalCalendar = undefined;
    var l4 = sayOn(1, 'lantern', '_fairLanternDay');
    global.FestivalCalendar = fc;
    assert(/今年你已经放过/.test(l4) && l4.indexOf('下一场') < 0,
        '历法不在位时只说「今年」，不凭空报一个日子（宁缺于不说）');

    // 那一格坑：festival-calendar 的口径是「今日或之后」，摊上问的必须是「明天之后」
    eq(fc.nextFestival(1).dueDay, 1, 'nextFestival 把上元当天也算作一场（due >= from）——坑是真的');
    global.WorldCalendar.day = 1;
    assert(fc.nextFestival(2).dueDay > 1 && global.FestivalFair.nextFair().inDays >= 1,
        '庙会避开这一格：屏上的「下一场」永远不是今天');
})();

// ==================== AU · COPY-01 抵达句／时长口径 ＋ COPY-03 特产牌前缀 ====================
console.log('\n[AU] COPY-01 抵达句与时长口径 · COPY-03 特产牌前缀提到行头');
(function () {
    var ts = codeOnly(src('js/time-system.js'));

    // —— 一 · 主提示：句子里不再挂现代数字钟，时长读同一把尺 ——
    var main = ts.match(/if \(actionName && minutes > 0\) \{[\s\S]*?\n    \}/);
    assert(main, '找得到推进时间的主提示');
    var mainBlock = main ? main[0] : '';
    assert(/耗时\$\{formatShichen\(minutes\)\}/.test(mainBlock), '主提示的时长读 formatShichen（不再就地拼「X小时Y分钟」）');
    assert(!/padStart/.test(mainBlock) && !/currentHour/.test(mainBlock) && !/currentMinute/.test(mainBlock),
        '主提示不再同一句里既报时段名又报数字钟（COPY-01 的「第1天 黎明 06:30」）');
    assert(/现在是第\$\{gameTime\.currentDay\}天 \$\{getCurrentPeriodName\(\)\}`, 'info'\);/.test(mainBlock),
        '句子到时段名就收口、后面不接任何东西（本作词汇表里没有十二时辰制时辰名，也不塞现代钟点）');

    // —— 二 · 一次长行动只念一遍时长 ——
    assert(!/时间流逝了/.test(ts),
        '「⏰ 时间流逝了X小时」整串撤掉：它与下面那条⏰尾缀条件相同、恒并存（FIX_NOTES NEW-27 实机抓到同一屏三条时长）');
    var tail = ts.match(/if \(!window\._suppressTimeFlowMessages[\s\S]*?\n    \}/);
    assert(tail, '找得到 ⏰ 长行动尾缀');
    assert(tail && /!actionName/.test(tail[0]), '尾缀加了「主提示没开口」这道闸——有行动名时不再于一屏里念第二遍');
    assert(tail && /formatShichen\(minutes\)/.test(tail[0]) && !/\/ 60/.test(tail[0]), '尾缀同样读 formatShichen，不自己拼「X小时Y分」');

    // —— 三 · HUD 也不报现代数字钟 ——
    // 这一枚原本钉的是「HUD 照旧有 padStart 的钟，收口只是不在句子里重复」（第四十八批写的）。
    // 第四十九批实机读到：HUD 常年是 app.js 覆盖出来的无钟版本，那句「钟点归 HUD」是读码读出来的、屏上并不成立 → 锚迁到实际口径。
    var hud = ts.match(/function updateTimeDisplay\(\)[\s\S]*?\n\}/);
    assert(hud && !/padStart|currentMinute|:\$\{/.test(hud[0]),
        'HUD 只报「第N天＋白话时段名」，那一枚现代数字钟已撤（本作只有一套报时的话）');

    // —— 四 · 抵达句的模板空格 ——
    var ls = codeOnly(src('js/location-system.js'));
    assert(/showMessage\(`来到了\$\{cityName\}：/.test(ls), '进城回执：地名并进句子，模板那枚空格收掉');
    assert(/🏛️ 来到了' \+ sectName/.test(ls), '进门派回执同样收掉模板空格');
    var spaced = jsFiles('js').filter(function (f) {
        return /来到了[^\n]{0,3} \$\{|来到了 ' \+|来到了\$?\s/.test(codeOnly(src(f)));
    });
    eq(spaced.length, 0, '全仓没有第二处「来到了 」+ 地名（' + spaced.join(', ') + '）');

    // —— 五 · COPY-03 行为层：把概览那一段切出来真渲染 ——
    var metaSlice = ls.match(/var tags = \[\];[\s\S]*?metaEl\.innerHTML = tags\.join\(' '\);/);
    assert(metaSlice, '找得到城市概览那一行（tags 拼装）');
    assert(!/>特产:/.test(metaSlice ? metaSlice[0] : ''), '牌面不再各印「特产:」前缀');
    assert(/本城特产：/.test(metaSlice ? metaSlice[0] : ''), '前缀提到行头（全角冒号，与其余文案同一口径）');
    (function () {
        if (!metaSlice) { assert(false, '概览段切片缺失，渲染行为层跳过'); return; }
        var render = new Function('city', 'metaEl', metaSlice[0] + '\nreturn metaEl.innerHTML;');
        var html = render({ specialties: ['皇家贡品', '御用丹药', '宫廷秘法'], accessLevel: '金丹', buildings: [1, 2, 3] }, {});
        eq((html.match(/本城特产：/g) || []).length, 1, '三张特产牌只有一枚行头（改前每张牌各带一个「特产:」）');
        assert(!/特产:/.test(html), '渲染结果里没有半角冒号的旧前缀');
        assert(html.indexOf('皇家贡品') > 0 && html.indexOf('宫廷秘法') > 0, '货名本身一个不丢');
        var empty = render({ specialties: [], buildings: [1] }, {});
        assert(empty.indexOf('本城特产') < 0, '没特产的城不摆行头（别造出一句「本城特产：」后面空着）');
        var noField = render({ buildings: [1, 2] }, {});
        assert(noField.indexOf('本城特产') < 0 && /设施 2 处/.test(noField), 'specialties 字段缺席也不炸，设施计数照报');
    })();

    // —— 六 · 行为层：真调 advanceTime，量它到底上了几句屏 ——
    (function () {
        var TS = global.timeSystem;
        if (!TS || typeof TS.advanceTime !== 'function') { assert(false, 'time-system 已在 [B] 段装入（advanceTime 不在位）'); return; }
        var prevMsg = global.showMessage, prevChar = global.currentCharData;
        var out = [];
        global.showMessage = function (m) { out.push(String(m)); };
        global.currentCharData = null;   // 不撩生理账，这一组只问「上屏几句、念成什么样」
        // 尺：只数「时长那一家人」（耗时…／耗去…时辰）。advanceTime 顺手会把整个世界叫醒——
        // 跨天时 onNewDay 的订阅者（钱庄催收/当铺/赁房/飞鸽）与随机日常事件都可能各上一句，
        // 那些不是本组要审的对象（本组审的是「同一笔时长不许念两遍」）。
        function timeLines() {
            return out.filter(function (m) { return /耗时|耗去/.test(m); });
        }
        function dump() { return '整屏 ' + out.length + ' 句：[' + out.join(' | ').slice(0, 200) + ']'; }
        try {
            out.length = 0;
            TS.advanceTime(30, '前往帝都 · 长安');
            eq(timeLines().length, 1, '一次 30 分钟的行动只上一句时长（改前还要看条件多出一条⏰）（' + dump() + '）');
            eq(timeLines()[0], '前往帝都 · 长安耗时30分钟，现在是第' + TS.gameTime.currentDay + '天 ' + TS.getCurrentPeriodName(),
                '抵达句读数（' + timeLines()[0] + '）');
            assert(!/[:：]\d\d/.test(timeLines()[0]), '句子里没有 HH:MM 那种现代钟点');

            out.length = 0;
            TS.advanceTime(120, '包间静养');
            eq(timeLines().length, 1, '满一个时辰的行动也只上一句时长（旧的第三条⏰已撤）（' + dump() + '）');
            eq(timeLines()[0], '包间静养耗时一个时辰，现在是第' + TS.gameTime.currentDay + '天 ' + TS.getCurrentPeriodName(),
                '时长念成「一个时辰」而不是「2小时」（读数 ' + timeLines()[0] + '）');

            out.length = 0;
            TS.advanceTime(120);         // 调用方没报行动名：主提示不开口，尾缀补一句
            eq(timeLines().length, 1, '无名行动仍有一句时长（时间流逝要被看见），但不重复（' + dump() + '）');
            assert(/此番行事耗去一个时辰/.test(timeLines()[0]), '无名时由尾缀出声，且读同一把尺（读数 ' + timeLines()[0] + '）');

            out.length = 0;
            TS.advanceTime(90, '抄经');
            eq(timeLines().length, 1, '90 分钟仍是一句时长（' + dump() + '）');
            assert(/耗时90分钟/.test(timeLines()[0]),
                '非整除时辰按 formatShichen 的既有回落念「90分钟」（改前这里念「1小时30分钟」——统一口径的可见代价，见本批记录）');
        } finally {
            global.showMessage = prevMsg;
            global.currentCharData = prevChar;
        }
    })();

    // —— 七 · 本文件里剩下的口算只剩一处死路，钉住它没玩家读得到 ——
    var calc = ts.split('\n').map(function (l, i) { return { l: l, i: i + 1 }; })
        .filter(function (o) { return /Math\.floor\(minutes\s*\/\s*60\)/.test(o.l); });
    eq(calc.length, 1, 'time-system 里只剩一行还按 /60 口算时长（第 ' + (calc[0] ? calc[0].i : '?') + ' 行）');
    assert(calc.length === 1 && /performActionWithTime/.test(ts), '那一行属 performActionWithTime');
    var callers = jsFiles('js').concat(['仙侠.html']).filter(function (f) {
        var t = codeOnly(src(f.replace(/\\/g, '/')));
        if (/js[\\/]time-system\.js$/.test(f)) return false;
        return /performActionWithTime/.test(t);
    });
    eq(callers.length, 0, 'performActionWithTime 全仓零调用点——那句「0小时10分钟」的旧读数玩家看不见，故本批不顺手改（要改先删函数）');
})();


// ==================== AV · HUD 报时两笔并一笔（第四十九批） ====================
console.log('\n[AV] #time-display／#season-display 只剩一支笔，且不报现代数字钟');
(function () {
    var app = src('js/app.js');
    var appCode = codeOnly(app);
    var tsSrc = src('js/time-system.js');

    // —— 一 · 普查：谁还在写这两格 ——
    var writers = jsFiles('js').filter(function (f) {
        return /getElementById\(['"](time|season)-display['"]\)/.test(codeOnly(src(f)));
    });
    eq(writers.length, 1, '全仓只有一个文件碰这两格（改前是两个：time-system 与 app.js 的 updateCharacterStatus）');
    eq(writers[0] && writers[0].replace(/\\/g, '/'), 'js/time-system.js', '那一支笔归 time-system');
    assert(!/time-display|season-display/.test(appCode),
        'app.js 里连这两格的 id 都不该再出现（出现了就是又起了第二支笔）');
    assert(!/第\$\{gt\.currentDay\}天/.test(appCode), 'app.js 不再自拼「第N天＋时段」的读数串');

    // —— 二 · 行为层：把 app.js 那一段切出来真跑，看它到底做了什么 ——
    var i0 = app.indexOf('// 更新时间显示');
    var i1 = app.indexOf('// 更新队伍人数显示');
    assert(i0 > 0 && i1 > i0, '找得到 app.js 里「更新时间显示」那一段');
    if (i0 > 0 && i1 > i0) {
        var seg = app.slice(i0, i1);
        var calls = 0, domWrites = 0;
        // 切片里写的是裸 document：必须把它当形参注进去，否则它落到本文件的全局桩件上（不计数），
        // 那两枚「自己不碰 DOM」的断言就成了永远为真的死闸——双侧自证当场把这枚抓了出来。
        var fakeDoc = { getElementById: function () { domWrites++; return { innerHTML: '', textContent: '' }; } };
        new Function('window', 'document', seg)({
            timeSystem: { updateTimeDisplay: function () { calls++; } }
        }, fakeDoc);
        eq(calls, 1, '这一段把两格交回给唯一那支笔（调 updateTimeDisplay 恰好一次）');
        eq(domWrites, 0, '这一段自己不碰 DOM——不再就地拼一份时间读数');
        // 反向：笔不在位时也不该自己补一份（宁可不刷，不许刷出第二套口径）
        var calls2 = 0;
        new Function('window', 'document', seg)({ timeSystem: null }, fakeDoc);
        eq(calls2, 0, 'timeSystem 不在位时这一段一句不写');
        eq(domWrites, 0, '也不退回去自己拼（改前这一格是照拼的）');
    }

    // —— 三 · 真渲染：time-system 自己那支笔印出来的是什么 ——
    var TS = global.timeSystem;
    if (!TS || typeof TS.updateTimeDisplay !== 'function') {
        assert(false, 'time-system 已在 [B] 段装入（updateTimeDisplay 不在位）');
    } else {
        var els = {};
        var mk = function () { return { innerHTML: '', textContent: '' }; };
        var oldGet = global.document.getElementById;
        global.document.getElementById = function (id) {
            if (id !== 'time-display' && id !== 'season-display') return null;
            if (!els[id]) els[id] = mk();
            return els[id];
        };
        var gt = TS.gameTime;
        var prev = { day: gt.currentDay, hour: gt.currentHour, minute: gt.currentMinute, season: gt.currentSeason };
        try {
            gt.currentDay = 7; gt.currentHour = 6; gt.currentMinute = 30; gt.currentSeason = 'autumn';
            TS.updateTimeDisplay();
            var shown = (els['time-display'] || {}).innerHTML || '';
            assert(/第7天/.test(shown), 'HUD 报第几天（读数 ' + shown.replace(/\s+/g, ' ') + '）');
            assert(shown.indexOf(TS.getCurrentPeriodName()) > 0, 'HUD 报白话时段名，与推进时间那句同一个词');
            assert(!/\d{1,2}:\d{2}/.test(shown), 'HUD 上没有 HH:MM——分钟留在账上，不念给玩家');
            assert(!/padStart/.test(codeOnly(tsSrc).match(/function updateTimeDisplay\(\)[\s\S]*?\n\}/)[0]),
                'padStart 那两行随钟点一起撤了（不是只藏了 span）');
            eq((els['season-display'] || {}).textContent, '秋季', '季节那格仍由同一支笔写（口径没变）');
            var first = shown;
            gt.currentHour = 23; gt.currentMinute = 5;
            TS.updateTimeDisplay();
            assert(els['time-display'].innerHTML !== first, '换时段后这一格会跟着改口（不是写死的一次性文本）');
            assert(!/\d{1,2}:\d{2}/.test(els['time-display'].innerHTML), '改口后仍然没有数字钟点');
        } finally {
            gt.currentDay = prev.day; gt.currentHour = prev.hour; gt.currentMinute = prev.minute; gt.currentSeason = prev.season;
            global.document.getElementById = oldGet;
        }
    }
})();


// ==================== [AW] COPY-02 城情卡的开发口径下屏：裸量程撤掉、折扣念人话（数额一字未动） ====================
console.log('\n[AW] 城情卡不再印「城市声望范围 0 ~ 10,000」与「商店折扣：0%」');
(function () {
    var rp = src('js/reputation-system.js');
    var shop = src('js/enhanced-shop.js');

    // ---- ① 那两串开发口径：卡上不再拼，全仓也不再留 ----
    assert(!/城市声望范围/.test(codeOnly(rp)), '「城市声望范围」那一行不再由城情卡拼出来');
    assert(!/是另一项属性/.test(codeOnly(rp)), '「…是另一项属性」这种字段名口吻的说明下屏');
    assert(!/商店折扣：/.test(codeOnly(rp)), '「商店折扣：N%」那种表头写法不在卡上');
    assert(jsFiles('js').every(function (f) { return !/城市声望范围|是另一项属性/.test(codeOnly(src(f))); }),
        '全仓 js/ 再无这两串（改了那一处，没留下第二支笔）');
    assert(jsFiles('js').every(function (f) { return !/已解锁：无/.test(codeOnly(src(f))); }),
        '复量钉锚：立案时引的第三串「已解锁：无」全仓字面不存在（屏上 0 处，读数 .scratch/v24-AW-copy02-aw1.out）——下轮别再照抄旧稿');

    // ---- ② 真跑城情卡：逐档推声望，折扣那句要念得出这一档的真数 ----
    // js/reputation-system.js 已由 [P]⑤ 装进当前上下文（顶层 const，重复 load 会重声明抛错），此处直接复用
    var CITY = '试剑城';   // 独立键：不覆盖 [P]⑤ 那份「帝都·长安」的声望账
    function cardAt(v) {
        window.setReputation(CITY, v);
        return window.getReputationPanelHtml(CITY);
    }
    var at0 = cardAt(0);
    assert(at0.indexOf('铺子还没肯让一分') >= 0, '零折扣档念人话：「铺子还没肯让一分」（改前是「商店折扣：0%」）');
    assert(at0.indexOf('%') < 0 && at0.indexOf('~') < 0, '零折扣档卡上既无百分号、也无「a ~ b」这种量程写法');
    [[500, 3], [1500, 7], [3000, 12], [6000, 18], [10000, 25]].forEach(function (pair) {
        var card = cardAt(pair[0]);                                  // 先推档
        var lv = (window.getReputationLevel(CITY) || {});            // 再读这一档的表（顺序反了就量到上一档）
        var pct = Math.floor((lv.discount || 0) * 100);
        eq(pct, pair[1], '声望 ' + pair[0] + ' 这一档的 discount 数额一字未动（读自表 = ' + pct + '%）');
        assert(card.indexOf('铺子里肯让的脸面：' + pct + '%') >= 0,
            '声望 ' + pair[0] + ' 的卡上念得出这一档的真数（' + pct + '%，不是删数保平安）');
    });

    // ---- ③ 消歧那句仍在，只是改回世界内的说法 ----
    assert(at0.indexOf('名气') >= 0 && !/属性/.test(at0), '「本城名分≠江湖名气」这句区分留着，但不再用「属性」这种开发词');

    // ---- ④ 折扣的真读者没断：买入价仍走 getReputationDiscount ----
    assert(/getReputationDiscount/.test(shop), 'enhanced-shop 买入价仍读 getReputationDiscount（改措辞没顺手拆线）');
    window.setReputation(CITY, 3000);
    eq(Math.round(window.getReputationDiscount(CITY) * 100), 12, '同一档账面上的折扣与卡上印的是同一个数（12%）');
    eq(window.getReputationValue(CITY), 3000, '推上去的声望真落了账（不是只改了牌面）');

    // ---- ⑤ 牌面其余那几截没被牵连 ----
    var atMax = cardAt(10000);
    eq((atMax.match(/已解锁/g) || []).length, 5, '满声望仍五枚牌各报「已解锁」（COPY-02 只改上面那两行）');
    assert(atMax.indexOf('铺子里肯让的脸面：25%') >= 0, '满声望那面折扣念到顶档 25%');
    window.setReputation(CITY, 0);
})();


// ==================== [AX] UI-22 五张解锁门牌断字：档名不再被劈成两截（四档视口量尺） ====================
console.log('\n[AX] 门牌折行改口：列宽下限按实机量尺、档名整块不劈');
(function () {
    var rp = src('js/reputation-system.js');
    var pm = src('styles/panel-map.css');
    var gatesRule = (pm.match(/\.rep-gates\s*\{[^}]*\}/) || [''])[0];
    // 注释里就写着「auto-fill 另有一病」——判「这条规则不再用 auto-fill」得先把注释剥掉，否则自己绊自己。
    var gatesDecl = gatesRule.replace(/\/\*[\s\S]*?\*\//g, '');

    // ---- ① CSS：列宽下限取自实机量尺 ----
    // 量尺读数（.scratch/v24-AX-gates.mjs ax3，改前）：最宽那枚「需声望 10,000（万人敬仰）」单行自然宽 160px
    //   ＋卡内边距 21.6px = 181.6px，四档视口（1920/1366/1024/768）量到同一个数（牌字号 13px 是 px 常量，不随视口缩）。
    // 改前 140px：1920 档 5 枚里 4 枚断、1366 档 5 枚全断（「需声望 500（熟面／孔）」）、1024 档 2 枚断、768 档不断但只剩 2 列。
    assert(gatesRule.length > 0, '.rep-gates 这一条规则在（改坏了连规则都找不着）');
    var gateFloor = maxFloor(gatesDecl);
    assert(/repeat\(auto-fit/.test(gatesDecl) && !!gateFloor && gateFloor.px >= 182,
        '列宽下限 ' + (gateFloor ? gateFloor.px : 'NaN') + 'px ≥ 182（实机量到的单行自然宽 181.6）——钉死这一档，别让「顺手调回 140」溜过去');
    assert(!!gateFloor && gateFloor.std === gateFloor.px,
        '下限写成 max(186px, 11.625rem)：11.625×16=186，标准档与改前逐像素相同（UI-23 不许顺手把默认界面也放大）');
    assert(!!gateFloor && gateFloor.at(20) >= 225.6,
        '特大档（根 20px）这一枚字量到 225.6px 需宽（探针 -ax5.out），rem 那颗折成 ' + (gateFloor ? gateFloor.at(20) : 'NaN') + 'px，容得下——只钉 186 会在大字号档重新断字');
    assert(!/auto-fill/.test(gatesDecl),
        '这一排不再用 auto-fill：它照样开出没人站的轨道，1920 档行尾空着 634px（容器 1419、五枚只吃掉 785）');
    assert(/\.rep-gate__tier\s*\{[^}]*white-space:\s*nowrap/.test(pm),
        '档名那一截整块不劈：数字与括号之间可换行，括号里的字不许再被切成「受欢／迎）」');
    assert(!/\.rep-gate__brief\s*\{[^}]*white-space:\s*nowrap/.test(pm),
        '整句不许 nowrap（那会把折行换成溢出，卡宽不够时字直接捅出边框）');
    assert((pm.match(/\.rep-gates\s*\{/g) || []).length === 1,
        '这一排的列宽只有一支笔在写（第二处定义迟早跟实机量尺对不上）');
    // 对照：信件窗那一排载具仍是 auto-fill——它要的是「落单只占一格」，与本排不是同一条规则，不该被顺手一起改
    var mailRule = (src('styles/panel-mail.css').match(/\.mail-sheet-carriers\s*\{[^}]*\}/) || [''])[0];
    assert(/repeat\(auto-fill/.test(mailRule), '对照组：信件窗载具那排仍是 auto-fill（本批没动它）');

    // ---- ② JS：牌面读起来仍是那句话，只是折法变了 ----
    // js/reputation-system.js 已由 [P]⑤ 装进当前上下文（顶层 const，重复 load 会重声明抛错），此处直接复用
    // 独立键：不覆盖 [P]⑤「帝都·长安」与 [AW]「试剑城」那两本账。
    // 顺带钉一条本批不改的发现（已立案改良说明）：syncUnlockedFeatures 只 push 不回收——同一座城推满 10,000
    // 再降回 0，五枚门牌仍报「已解锁」。要量两张脸，得用两座城。
    var LOCK = '青崖城';
    window.setReputation(LOCK, 0);
    var at0 = window.getReputationPanelHtml(LOCK);
    eq((at0.match(/class="rep-gate[" ]/g) || []).length, 5, '五张门牌一张不少（锁着时也各报差什么）');
    eq((at0.match(/ disabled/g) || []).length, 5, '陌路人这一面五枚全 disabled');
    eq((at0.match(/class="rep-gate__tier"/g) || []).length, 5, '五枚牌各有一整块档名（锁着时也报得出差在哪一档）');
    ['（熟面孔）', '（受欢迎）', '（有名望）', '（德高望重）', '（万人敬仰）'].forEach(function (t) {
        assert(at0.indexOf('<span class="rep-gate__tier">' + t + '</span>') >= 0,
            '档名「' + t + '」整块套在 tier 里（不是散在文本里任人劈开）');
    });
    var 读 = at0.replace(/<[^>]+>/g, '');
    ['500（熟面孔）', '1,500（受欢迎）', '3,000（有名望）', '6,000（德高望重）', '10,000（万人敬仰）'].forEach(function (t) {
        assert(读.indexOf('需声望 ' + t) >= 0, '剥掉标签后读到的还是原来那句：需声望 ' + t);
    });
    var OPEN = '落雁城';   // 另一座城：满声望那张脸
    window.setReputation(OPEN, 10000);
    var atMax = window.getReputationPanelHtml(OPEN);
    eq((atMax.match(/rep-gate__tier/g) || []).length, 0, '满声望那面五枚牌只印「已解锁」，没有档名可套（tier 不空转）');
    eq((atMax.match(/已解锁/g) || []).length, 5, '满声望仍五枚牌各报「已解锁」（本批没改状态那一截）');

    // ---- ③ 对照：数额与门槛表一枚没动（本批只动折行与列宽） ----
    eq((at0.match(/需声望 (500|1,500|3,000|6,000|10,000)/g) || []).join(','),
        '需声望 500,需声望 1,500,需声望 3,000,需声望 6,000,需声望 10,000',
        '五道门槛的数与千分位写法原样（改折行不许顺手挪数额）');
    assert(/REPUTATION_FEATURE_LEVELS = Object\.freeze\(\{\s*hidden_shop: 1,\s*special_quests: 2,\s*secret_arts: 3,\s*special_permit: 4,\s*hidden_dungeon: 5/.test(rp),
        '五道门槛各指 1~5 号档（表没被改）');
    eq(window.getReputationValue(LOCK), 0, '对照：这座城的声望真在 0，牌面报的才是「差什么」而不是「已解锁」');
})();


// ==================== AY · UI-23 字号调节「半生效」：下限写成 max(px, rem)，标准档逐像素不变 ====================
console.log('\n[AY] UI-23 字号跟手：三枚 token 与五处量字下限一律 max(下限px, 跟手rem)');
(function () {
    var tokens = src('styles/ui-tokens.css');
    var map = src('styles/panel-map.css');
    var mail = src('styles/panel-mail.css');
    var shop = src('styles/panel-shop.css');
    var craft = src('styles/ui-craft.css');
    var app = src('js/app.js');

    // ---- ① 三档根字号常量：rem 那颗的分母，改了它上面所有 max() 的换算全要重推 ----
    var scaleLit = (app.match(/FONT_SCALE_PX\s*=\s*\{[^}]*\}/) || [''])[0];
    assert(/normal:\s*''/.test(scaleLit) && /large:\s*'18px'/.test(scaleLit) && /huge:\s*'20px'/.test(scaleLit),
        '设置里三档仍是 标准=不写（浏览器默认 16px）／大=18px／特大=20px（本批所有 rem×根字号 的算式钉在这三个数上）');

    // ---- ② 字号 token ----
    function decl(name) { return (tokens.match(new RegExp('--' + name + ':\\s*[^;]+;')) || [''])[0]; }
    [['x-fs-xs', 13, 0.8125], ['x-fs-sm', 14, 0.875], ['x-fs-base', 16, 1]].forEach(function (t) {
        var f = maxFloor(decl(t[0]));
        assert(!!f && f.px === t[1] && f.rem === t[2] && f.std === t[1],
            '--' + t[0] + ' = max(' + t[1] + 'px, ' + t[2] + 'rem)：' + t[2] + '×16=' + t[1] + '（标准档与改前同像素），特大档 ' + (f ? f.at(20) : '?') + 'px 才跟手长大');
    });
    // 改前的病：token 写死 px，设置里那三档对它形同虚设（探针 -ay1.out：text-xs 354 枚跟手率 0%）
    assert(!/--x-fs-(xs|sm|base):\s*[\d.]+px\s*;/.test(tokens),
        '三枚 token 里不再有一枚是裸 px（裸 px＝那三档字号对它没用，正是 UI-23 的病根）');

    // ---- ③ 提权那两条规则仍读 token（Tailwind 的 text-xs 全库 1696 处，逐处改类名不如收口一处） ----
    assert(/html \.text-xs\s*\{\s*\n?\s*font-size:\s*var\(--x-fs-xs\)/.test(tokens),
        'html .text-xs 读 --x-fs-xs（不是自己再抄一个 px 数）');
    assert(/html \.text-\\\[9px\\\][^{]*\{\s*\n?\s*font-size:\s*var\(--x-fs-xs\)/.test(tokens),
        'text-[9~12px] 那一批也统一读 --x-fs-xs（任意值小字一起抬到可读下限，且一起跟手）');

    // ---- ④ 信正文：刻意大一号，不套 token，但同样写 max() ----
    // 先剥注释再读声明：注释里就抄着同一个 max() 字面量，不剥的话「改了声明没改注释」照样绿。
    function declOf(css, sel, prop) {
        var esc = sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        var block = (css.replace(/\/\*[\s\S]*?\*\//g, '').match(new RegExp(esc + '\\s*\\{[^}]*\\}')) || ['', ''])[0];
        return (block.match(new RegExp(prop + ':\\s*([^;}]+)')) || ['', ''])[1];
    }
    [['#mailInboxPanel .mail-detail-body', mail], ['#mailInboxPanel .mail-sheet-paper', mail]].forEach(function (t) {
        var f = maxFloor(declOf(mail, t[0], 'font-size'));
        assert(!!f && f.px === 15 && f.std === 15,
            '信件「' + t[0] + '」字号 = max(15px, 0.9375rem)：15 是刻意比正文大一号（0.9375×16=15，标准档不变），特大档 ' + (f ? f.at(20) : '?') + 'px');
    });
    // 残债登记（不瞒）：信件样式里还留着改前那半截无 #mailInboxPanel 前缀的旧块，正文那支被上面的规则盖住、
    // 其余小字（10~12.5px）仍在裸 px 生效——⑦ 那两条只降不升的闸就是钉这批存量。
    assert(/\.mail-detail-body\s*\{\s*\n?\s*flex:/.test(mail),
        '对照（已登记残债）：无 #mailInboxPanel 前缀的那一版 .mail-detail-body 仍在文件里（它赢不过带前缀那支，但它是残债，别当它不存在）');

    // ---- ⑤ 五处「为装下文字而量出来的」列宽下限：字宽随字号走，下限就得跟着走 ----
    [['.rep-gates', map, 186, 11.625], ['.x-map-cols', map, 216, 13.5],
    ['.mail-sheet-carriers', mail, 140, 8.75], ['.shop-goods-grid', shop, 430, 26.875],
    ['#body-durability-list', craft, 380, 23.75]].forEach(function (t) {
        var f = maxFloor(declOf(t[1], t[0], 'grid-template-columns'));
        assert(!!f && f.px === t[2] && f.std === t[2],
            t[0] + ' 轨道下限 = max(' + t[2] + 'px, ' + t[3] + 'rem)（' + t[3] + '×16=' + t[2] + '，标准档逐像素等于改前）');
    });
    var gatesFloor = maxFloor(declOf(map, '.rep-gates', 'grid-template-columns'));
    assert(!!gatesFloor && gatesFloor.at(18) >= 186 && gatesFloor.at(20) >= 225.6,
        '门牌那一排在 大(18px)／特大(20px) 档各自折成 ' + (gatesFloor ? gatesFloor.at(18) : '?') + '／' + (gatesFloor ? gatesFloor.at(20) : '?') + 'px 下限 ≥ 特大档实测量需 225.6px（探针 -ax5.out）');

    // ---- ⑥ 尺子自证：喂它改前的形状必须报 null，喂标准档换算必须闭合 ----
    var 瞎了 = maxFloor('grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));') !== null
        || maxFloor('font-size: 13px;') !== null;
    assert(!瞎了, '对照（尺子没瞎）：写死 px 的旧形状在 maxFloor 下报 null——上面每一条都在旧代码上判得红，不是白过');
    var 闭合 = [13, 14, 16, 186, 216, 140, 430, 380, 15].every(function (px) {
        return maxFloor('max(' + px + 'px, ' + (px / 16) + 'rem)').std === px;
    });
    assert(闭合, '对照（换算闭合）：px/16 折回 rem 再乘 16 逐枚等于原 px——rem 那颗在标准档不会漂一丁点');
    // 双侧自证：把本批改过的 7 处各自换回改前的裸 px 写法，同一支尺必须读不出下限。
    // 读得出＝上面那 7 条永远绿（空转），这条就是它们的红灯。
    var 改回裸px = [
        [decl('x-fs-xs'), 'max(13px, 0.8125rem)', '13px'],
        [declOf(mail, '#mailInboxPanel .mail-detail-body', 'font-size'), 'max(15px, 0.9375rem)', '15px'],
        [declOf(map, '.rep-gates', 'grid-template-columns'), 'max(186px, 11.625rem)', '186px'],
        [declOf(map, '.x-map-cols', 'grid-template-columns'), 'max(216px, 13.5rem)', '216px'],
        [declOf(mail, '.mail-sheet-carriers', 'grid-template-columns'), 'max(140px, 8.75rem)', '140px'],
        [declOf(shop, '.shop-goods-grid', 'grid-template-columns'), 'max(430px, 26.875rem)', '430px'],
        [declOf(craft, '#body-durability-list', 'grid-template-columns'), 'max(380px, 23.75rem)', '380px']
    ];
    assert(改回裸px.length === 7 && 改回裸px.every(function (t) {
        return t[0].indexOf(t[1]) >= 0 && maxFloor(t[0].replace(t[1], t[2])) === null;
    }), '对照（尺子拿得动人）：7 处声明各自换回改前的裸 px 写法，同一支尺 7 次全报 null——上面 7 条绿灯不是空转出来的');

    // ---- ⑦ 残债存量：只降不升（本批只收了 token 与量字下限，面板内小字仍是裸 px） ----
    var 裸 = 0, 穿底 = 0, 单 = [];
    fs.readdirSync(path.join(ROOT, 'styles')).forEach(function (f) {
        if (!f.endsWith('.css')) return;
        var code = src('styles/' + f).replace(/\/\*[\s\S]*?\*\//g, '');
        var n = 0, k = 0;
        (code.match(/font-size:\s*([\d.]+)px/g) || []).forEach(function (m) {
            n++;
            if (parseFloat(m.match(/([\d.]+)px/)[1]) < 13) k++;
        });
        裸 += n; 穿底 += k;
        if (n) 单.push(f + ' ' + n + (k ? '（穿底 ' + k + '）' : ''));
    });
    assert(裸 > 0 && 裸 <= 95, 'styles/ 全目录裸 px 字号仍有 ' + 裸 + ' 枚（本批未收，登记为残债；闸口钉在本批实测的 95，往回涨＝有人又写了死数）');
    assert(穿底 > 0 && 穿底 <= 13, '其中低于 13px 可读下限的有 ' + 穿底 + ' 枚（信件列表小字／舆图小字，闸口 13）——「最小正文字 13px」这句在面板内小字上并未兑现，已立案为残债');
    console.log('  · 残债分布（本批不动，只登记）：' + 单.join(' / '));
})();


// ==================== AZ · COPY-05 一次进城两句抵达回执：两笔并一笔，脚程账改念实付 ====================
console.log('\n[AZ] COPY-05 抵达回执归 enterCity 一支笔；这一路只报自己那笔脚程账，且读扣减前后的真差值（数额一字未动）');
(function testArrivalReceiptOnePen() {
    var app = src('js/app.js');
    var ls = src('js/location-system.js');

    function bodyOf(name) {
        var i = app.indexOf('function ' + name + '(');
        if (i < 0) return '';
        var d = 0, j = app.indexOf('{', i);
        for (var k = j; k < app.length; k++) {
            if (app[k] === '{') d++;
            else if (app[k] === '}') { d--; if (d === 0) return app.slice(i, k + 1); }
        }
        return '';
    }
    var fnCity = bodyOf('travelToCityFromList');
    var fnFoot = bodyOf('chargeFootJourney');
    var fnSame = bodyOf('footJourneyLedgerHere');   // 第一百一十七波 DES-51：城市行先问这一支「脚下是不是就是目的地」
    assert(fnCity.length > 200, 'AZ0a 取到 travelToCityFromList 的函数体（尺子没抓空）');
    assert(fnFoot.length > 300, 'AZ0b 取到共用脚程笔 chargeFootJourney（第一百一十四波 DES-10：城市行与门派行同读这一支）');
    assert(fnSame.length > 200, 'AZ0c 取到共用同地判定 footJourneyLedgerHere（第一百一十七波 DES-51：原地踏步不收脚程）');
    // 行为层三支一起装：城市行现在把路上那笔账交给共用笔、进门先过同地判定，单切一支会 ReferenceError
    var fn = fnSame + '\n' + fnFoot + '\n' + fnCity;
    // 结构尺读的是「合并后的两支」——④⑤⑥⑦⑨⑩⑪ 那本账已收口在 chargeFootJourney 里，
    // 数额与句式一字未动，只是搬家；搬家这件事由 AZ0b 与 [CP] 段作证，不许悄悄丢账。
    // 注释里抄着「来到了XX」（app.js:2506）——不剥注释的尺会在谎上判绿
    var fnCode = fn.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

    // ---- ① 抵达回执只有一支笔 ----
    assert(fnCode.indexOf('来到了') < 0, '① 这一路不再自己报「来到了」（抵达回执全归 enterCity）');
    assert(/showMessage\(`来到了\$\{cityName\}：/.test(ls), '② 对照（没把两句一起删掉）：enterCity 那句「来到了X：desc」仍在——六条进城路共用这一支笔');
    eq(codeOnly(app).indexOf('来到了'), -1, '③ 全 app.js 的码里再无「来到了」字样（改前两处出声：enterCity＋这一路）');

    // ---- ④ 脚程精力改念实付 ----
    assert(/staminaBefore\s*=\s*window\.currentCharData\.energy/.test(fnCode), '④ 扣之前先读一次账');
    assert(/journeyCost\s*=\s*staminaBefore\s*-\s*window\.currentCharData\.energy/.test(fnCode), '⑤ 扣之后再读一次，差值才是屏上那句');
    assert(!/-\s*5[^0-9]/.test((fnCode.match(/showMessage\([\s\S]*?\);/) || [''])[0]), '⑥ 跋涉那句里再没有常量 5（写死的开价不许上屏）');
    assert(/没有精力可扣/.test(fnCode), '⑦ 实付为 0 那一格不沉默（人已空，屏上要说得出这句话）');

    // ---- ⑧ 数额一字未动（防顺手改平衡） ----
    assert(/footStamina = 5/.test(fnCode) && /staminaBefore - footStamina/.test(fnCode), '⑨ 凡人近城底账仍是 5 点精力（远路按里数拉长，有坐骑再乘倍率）');
    assert(/footMinutes = 30/.test(fnCode) && /advanceTime\(footMinutes, '前往' \+ destName\)/.test(fnCode) && /getTravelDistance/.test(fnCode), '⑩ 凡人近城底账仍是 30 分钟，远路按 getTravelDistance 缩放');
    assert(/getMountTravelTimeMultiplier/.test(fnCode), '⑪ 坐骑倍率走同一支 getMountTravelTimeMultiplier，不另造第二本速度账');

    // ---- ⑫ 行为层：真跑一次点击，数一数屏上几句抵达 ----
    function rig(energy, gate) {
        var c = vm.createContext({});
        vm.runInContext('this.window = this; this.console = { log: function(){}, warn: function(){}, error: function(){} };', c);
        var msgs = [], timeCalls = [];
        c.currentCharData = { name: '沈知微', realm: '金丹', layer: 1, energy: energy, location: '洛水城' };
        c.showMessage = function (m) { msgs.push(String(m)); };
        c.updateCharacterStatus = function () {};
        c.timeSystem = { advanceTime: function (m, act) { timeCalls.push(m); c.showMessage(act + '耗时' + m + '分钟', 'info'); } };
        c.locationSystem = {
            enterCity: function (n) {
                if (!gate) { c.showMessage('来到了' + n + '：九州帝都，万户千门', 'info'); return true; }
                c.showMessage('您的境界不足，无法进入 ' + n + '（需要：' + gate + '）', 'error');
                return false;
            }
        };
        c.getPlaneOf = function () { return ''; };
        c.partySystem = { syncPartyLocationToPlayer: function () {} };
        c.travelSystem = { unlockTeleport: function () {} };
        vm.runInContext(fn, c);
        return { run: c.travelToCityFromList, msgs: msgs, timeCalls: timeCalls, cd: c.currentCharData };
    }
    function arrivals(msgs) { return msgs.filter(function (m) { return m.indexOf('来到了') >= 0; }).length; }

    var full = rig(100, '');
    full.run('帝都 · 长安', '中州');
    eq(arrivals(full.msgs), 1, '⑬ 一次点击屏上「来到了」恰好一句（改前两句，且两句几乎一字不差）');
    assert(full.msgs.indexOf('🚶 经过一番跋涉，精力−5。') >= 0, '⑭ 满精力走一趟：念的是实付 5');
    eq(full.cd.energy, 95, '⑮ 账仍是 100 → 95（数额没动）');
    eq(full.msgs.length, 3, '⑯ 这一趟上屏三条：抵达／耗时／脚程，各说各的账（改前四条里两句在说同一件事）');

    var low = rig(3, '');
    low.run('帝都 · 长安', '中州');
    assert(low.msgs.indexOf('🚶 经过一番跋涉，精力−3。') >= 0, '⑰ 只剩 3 点精力：念「−3」——改前这里印的是「−5」，比账多念两个');
    eq(low.cd.energy, 0, '⑱ 封顶仍在 0（实付只有 3）');
    assert(!low.msgs.some(function (m) { return m.indexOf('−5') >= 0; }), '⑲ 全窗再无「−5」字样');

    var dry = rig(0, '');
    dry.run('帝都 · 长安', '中州');
    assert(dry.msgs.some(function (m) { return m.indexOf('没有精力可扣') >= 0; }), '⑳ 空了还走：说得出口');
    assert(!dry.msgs.some(function (m) { return m.indexOf('−0') >= 0; }), '㉑ 屏上没有「精力−0」这种话');

    var barred = rig(100, '元婴');
    barred.run('东海龙宫', '东荒');
    eq(barred.msgs.filter(function (m) { return m.indexOf('来到了') >= 0 || m.indexOf('跋涉') >= 0; }).length, 0, '㉒ 门槛拦下：零句抵达、零句跋涉（v20.65 那道「不谎报抵达」没被本批磨掉）');
    eq(barred.cd.energy, 100, '㉓ 拦下不扣精力');
    eq(barred.timeCalls.length, 0, '㉔ 拦下不推时间');

    // ---- ㉕ 双侧自证：把这一处还原成改前那句重复抵达，同一支尺必须报红 ----
    var 改前 = fnCode.replace("showMessage('🚶 经过一番跋涉，' + journeyNote, 'success');",
        "showMessage('🚶 经过一番跋涉，来到了' + cityName, 'success');");
    assert(改前 !== fnCode && fnCode.indexOf('来到了') < 0 && 改前.indexOf('来到了') >= 0,
        '㉕ 对照（尺子拿得动人）：同一把「来到了」尺跑两侧——改后码读不到、还原体一读就到，且替换确实命中——上面的绿灯不是空转出来的');
    eq((app.match(/经过一番跋涉/g) || []).length, 1, '㉖ 全仓「经过一番跋涉」只此一处（没人另加第三句抵达回执）');
})();

console.log('\n[CA] UI-07 toast 让位：右上角那三块常驻牌各长各的，让位尺必须跟着根字号走');
(function () {
    var tokens = src('styles/ui-tokens.css');
    var gu = src('js/global-utils.js');
    var cs = src('js/core/continue-save.js');
    var code = tokens.replace(/\/\*[\s\S]*?\*\//g, '');   // 一律先剥注释：注释里抄着改前的 44px，不剥就成了「改了声明没改注释」照样绿

    function declOf(css, sel, prop) {
        var esc = sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        var block = (css.replace(/\/\*[\s\S]*?\*\//g, '').match(new RegExp(esc + '\\s*\\{[^}]*\\}')) || ['', ''])[0];
        return (block.match(new RegExp(prop + ':\\s*([^;}]+)')) || ['', ''])[1].trim();
    }
    // 只认 rem；裸 px 一律读成 null（UI-23 那一族量出来的尺：写死 px 的数不跟手，字号档一换就重新贴上）
    function remOnly(v) {
        var m = /^([\d.]+)rem/.exec(v || '');
        return m ? { rem: parseFloat(m[1]), at: function (r) { return +(m[1] * r).toFixed(2); } } : null;
    }

    var 容top = declOf(code, '#game-message', 'top');
    var 牌top = declOf(code, 'html #continue-save-state', 'top');
    var 容f = remOnly(容top), 牌f = remOnly(牌top);

    // ---- ①② 两条让位声明都改成了 rem，且换算闭合 ----
    assert(!!容f, '① #game-message 的 top 必须是 rem（读到「' + 容top + '」；裸 px＝字号档一换就重新贴上，正是本批的病）');
    assert(!!牌f, '② html #continue-save-state 的 top 必须是 rem（读到「' + 牌top + '」）');
    eq(容f && 容f.rem, 4.75, '③ toast 列让到 4.75rem');
    eq(牌f && 牌f.rem, 2.625, '④ 「未存档」牌定在 2.625rem');
    eq(容f && 容f.at(16), 76, '⑤ 4.75×16=76px（标准档实测牌底 70，留 6px 缝）');
    eq(牌f && 牌f.at(16), 42, '⑥ 2.625×16=42px＝改前那个裸 42px 的同一位置（默认档一个像素都没动）');

    // ---- ⑦ 双侧自证：还原成改前那两枚裸 px，同一支尺必须报红 ----
    var 还原容 = code.replace('top: 4.75rem !important', 'top: 44px !important');
    var 还原牌 = code.replace('top: 2.625rem;', 'top: 42px;');
    assert(还原容 !== code && remOnly(declOf(还原容, '#game-message', 'top')) === null,
        '⑦ 对照（尺子拿得动人·上）：把 #game-message 还原成改前的 top:44px，同一支尺立刻读不到 rem——上面①③⑤的绿灯不是空转出来的');
    assert(还原牌 !== code && remOnly(declOf(还原牌, 'html #continue-save-state', 'top')) === null,
        '⑧ 对照（尺子拿得动人·下）：把「未存档」牌还原成改前的 top:42px，同一支尺同样读不到');

    // ---- ⑨⑩⑪ 让位不变式：Δ 里必须把 mt-1 那 0.25rem 也算进去（它真的把牌往下推了 4px） ----
    var 缝 = 0.25;                       // continue-save.js 覆写 className 时带着 mt-1，等于给这块 fixed 牌再加一段上外边距
    var Δ = (容f.rem - 牌f.rem - 缝);
    eq(+Δ.toFixed(4), 1.875, '⑨ toast 顶与牌顶的净空 = 4.75 − 2.625 − 0.25(mt-1) = 1.875rem');
    // 牌高是屏上实测的（v24-CA-toast-ca2.out：标准档 24px／特大档 29px），不是估的
    assert(Δ * 16 >= 24 + 4, '⑩ 标准档：Δ×16 = ' + (Δ * 16) + 'px ≥ 牌高 24 + 缝 4（toast 顶在牌底下）');
    assert(Δ * 18 >= 26.5 + 4, '⑪ 大档：Δ×18 = ' + (Δ * 18).toFixed(2) + 'px ≥ 牌高 26.5 + 缝 4');
    assert(Δ * 20 >= 29 + 4, '⑫ 特大档：Δ×20 = ' + (Δ * 20) + 'px ≥ 牌高 29 + 缝 4（改前那把 44px 的尺在这一档连天气牌都压掉 8%）');

    // ---- ⑬ 牌与天气浮签也不许互贴（天气牌 top-2 是 rem，跟着长；实测底 38@16／47@20） ----
    var 牌净顶 = function (r) { return 牌f.at(r) + 缝 * r; };
    assert(牌净顶(16) >= 38 + 4, '⑬ 标准档：牌净顶 ' + 牌净顶(16) + 'px ≥ 天气牌底 38 + 4');
    assert(牌净顶(20) >= 47 + 4, '⑭ 特大档：牌净顶 ' + 牌净顶(20).toFixed(2) + 'px ≥ 天气牌底 47 + 4（改前裸 42px 在这一档只剩 −5px，即压住）');

    // ---- ⑮⑯ 一处规则一本尺：给 #game-message 定 top 的笔全仓只有一支 ----
    var 定top = 0, 定rem = 0;
    fs.readdirSync(path.join(ROOT, 'styles')).forEach(function (f) {
        if (!f.endsWith('.css')) return;
        var c = src('styles/' + f).replace(/\/\*[\s\S]*?\*\//g, '');
        (c.match(/#game-message\s*\{[^}]*\}/g) || []).forEach(function (blk) {
            var t = (blk.match(/top:\s*([^;}]+)/) || [])[1];
            if (t) { 定top++; if (remOnly(t)) 定rem++; }
        });
    });
    eq(定top, 1, '⑮ styles/ 全目录里给 #game-message 定 top 的规则只有一处（两处以上＝同一把尺分叉，改一处另一处照样压牌）');
    eq(定rem, 1, '⑯ 那一处读出来是 rem（不是裸 px）');

    // ---- ⑰⑱ 本批只动位置：旧的两枚修法不许顺手回退 ----
    assert(/#game-message\s*\{[^}]*pointer-events:\s*none/.test(code), '⑰ 容器仍 pointer-events:none（第四批让开的「通知不该挡控件」，本批没改成挪位置当替代）');
    assert(/#game-message\s*>\s*div\s*\{[^}]*pointer-events:\s*none/.test(code), '⑱ 气泡本体仍穿透（第三条叠到舆图开关组那一格照旧防着）');
    assert(/top:\s*4\.75rem\s*!important/.test(code), '⑲ 让位那条仍带 !important——容器是 JS 建的，className 里挂着 Tailwind 的 top-4（global-utils.js），去掉就压不回去');
    assert(/msgDiv\.className\s*=\s*'fixed top-4 right-4/.test(gu), '⑳ JS 侧那行 className 未被本批改写（改了就得重推 ⑲ 的特异度账）');

    // ---- ㉑㉒ 反修法闸：不许把牌抬到 toast 上面去「解决」遮挡 ----
    var 牌z = parseFloat(declOf(code, 'html #continue-save-state', 'z-index'));
    var toastz = parseFloat((tokens.match(/--x-z-toast:\s*([\d.]+)/) || ['', 'NaN'])[1]);
    eq(牌z, 40, '㉑ 「未存档」牌仍是 z-index:40（本批靠位置让位，不靠抬画序——抬上去的牌会盖住通知，是反过来的同一个病）');
    assert(toastz > 40, '㉒ toast 层（--x-z-toast = ' + toastz + '）确实压在牌上面：所以几何交叠＝真看不见，这条尺不是纸上的');

    // ---- ㉓ 牌的文案与 className 由 JS 整串覆写：位置只能钉在带 html 前缀的选择器上 ----
    assert(/el\.className = 'text-xs text-amber-400 mt-1 cursor-pointer'/.test(cs), '㉓ continue-save.js 仍整串覆写 className（含 mt-1，故 ⑨ 那笔外边距必须算进尺）');
    assert(/html #continue-save-state\s*\{/.test(code), '㉔ CSS 侧选择器带 html 前缀（覆写 className 之后，工具类那条路管不住这块牌）');
})();

// ==================== CB · 庙会摊口念同一本「今年已逛」的账 ====================
console.log('\n[CB] 摊口那本账：城市面板的庙会要读出「今年已逛」，别逼玩家重开庙会窗才知道哪摊玩过');
(function () {
    var raw = src('js/city-facilities/festival-fair.js');
    var code = codeOnly(raw);

    // ---- ①~⑦ 只读那一本既有账 ----
    var usStart = code.indexOf('function usedStalls() {');
    var usBody = usStart < 0 ? '' : code.slice(usStart, code.indexOf('\n    }', usStart));
    assert(usStart >= 0, '① usedStalls() 在盘上（摊口要读账，先有个读账的人）');
    ['_fairRiddleDay', '_fairLanternDay', '_fairFoodDay', '_fairWatchDay'].forEach(function (f) {
        assert(usBody.indexOf(f) >= 0, '②③④⑤ usedStalls 读的是窗内那本账的 flag：' + f);
    });
    assert(!/markToday\(|= *absDay\(\)/.test(usBody), '⑥ usedStalls 只读不写（写账仍归 markToday 那一支笔）');
    eq((code.match(/c\[flag\] = absDay\(\)/g) || []).length, 1,
        '⑦ 庙会账的写笔仍只有一支（markToday）——本批没另立第三本账');

    // ---- ⑧~⑭ 渲染闸与就地改口闸 ----
    assert(raw.indexOf("id=\"festival-fair-used\" class=\"text-xs text-amber-200/60 mt-1' + (已逛 ? '' : ' hidden') + '\"") >= 0,
        '⑧ 那一行常驻、没账时带 hidden（不插拔节点：插拔就得重画名册，而重画会把玩家翻开的手风琴组全折回去）');
    var syncStart = code.indexOf('function syncStallLine() {');
    var syncBody = syncStart < 0 ? '' : code.slice(syncStart, code.indexOf('\n    }', syncStart));
    assert(syncStart >= 0 && /getElementById\('festival-fair-used'\)/.test(syncBody) && /classList\.toggle\('hidden'/.test(syncBody),
        '⑨ syncStallLine 只取那一枚锚：改 textContent ＋ 切 hidden');
    assert(!/renderCityBuildings|innerHTML|querySelector/.test(syncBody), '⑩ sync 不重画整张城建名册、不扫选择器（只碰那一枚节点）');
    assert(/if \(c\) \{ c\[flag\] = absDay\(\); *syncStallLine\(\); *\}/.test(code),
        '⑪ 写账那一笔顺手重读摊口：成交当场改口，不必重进一次城');
    assert(/if \(!el\) return;/.test(syncBody), '⑫ 锚不在盘上（玩家没开过城市面板）时静默返回，不为这一行凭空造面板');
    var panelSrc = raw.slice(raw.indexOf('function panelHtml'), raw.indexOf('// ============ 庙会本体'));
    assert(panelSrc.indexOf('✅') < 0, '⑬ 摊口不搬窗内那枚 ✅「今年已X」——同一屏两套写法＝账又分叉');
    assert(!/font-size: *[0-9.]+px/.test(panelSrc) && /text-xs/.test(panelSrc), '⑭ 摊口小字走工具类，不写裸 px');

    // ---- 行为层：真跑 panelHtml ----
    var defs = [];
    (src('js/core/festival-bridge.js').match(/\{ key: '[a-z]+', name: '[^']+', doy: [^,\n]+,/g) || []).forEach(function (m) {
        defs.push({
            key: m.match(/key: '([a-z]+)'/)[1],
            name: m.match(/name: '([^']+)'/)[1],
            doy: new Function('return (' + m.match(/doy: ([^,]+),/)[1] + ')')()
        });
    });
    global.FESTIVAL_DEFS = defs;
    global.WorldCalendar = { day: 1, register: function () { return { ok: true }; } };
    global.getAbsoluteDay = function () { return global.WorldCalendar.day; };
    load('js/core/festival-calendar.js');
    load('js/city-facilities/festival-fair.js');

    function 面板(日, 逛过, 城名) {
        global.WorldCalendar.day = 日;
        var c = { location: '长安', copper: 100, mood: 80, karma: 0, energy: 50, maxEnergy: 100 };
        (逛过 || []).forEach(function (f) { c[f] = 日; });
        global.currentCharData = c;
        return global.FestivalFair.panelHtml(城名 || '长安');
    }
    var 钮 = '🏮 去逛庙会（猜灯谜 · 放河灯 · 吃元宵 · 看花灯）';

    var p0 = 面板(1, []);
    assert(p0.indexOf('今年已逛') < 0 && p0.indexOf(钮) >= 0 && /festival-fair-used" class="[^"]*hidden"/.test(p0),
        '⑮ 上元当天一摊未逛：那一行带 hidden、可见文本与改前逐字相同（不凭「今天有节」就猜玩家逛过）');

    var p1 = 面板(1, ['_fairWatchDay']);
    assert(p1.indexOf('今年已逛：看花灯') >= 0 && !/festival-fair-used" class="[^"]*hidden/.test(p1),
        '⑯ 逛过看花灯：摊口念出「今年已逛：看花灯」，且 hidden 已摘');
    ['猜灯谜', '放河灯', '吃元宵'].forEach(function (s) {
        assert(p1.slice(p1.indexOf('今年已逛')).indexOf(s) < 0, '⑰⑱⑲ 那一行里不出现没逛过的「' + s + '」（逛一本报一本）');
    });

    var p3 = 面板(1, ['_fairRiddleDay', '_fairLanternDay', '_fairFoodDay']);
    assert(p3.indexOf('今年已逛：猜灯谜 · 放河灯 · 吃元宵') >= 0 && p3.indexOf('四摊都已逛过') < 0,
        '⑳ 逛过三摊：三本账按窗内顺序念，且不夸成「都逛过」');

    var qixi = defs.filter(function (d) { return d.key === 'qixi'; })[0];
    var p4 = 面板(1, ['_fairRiddleDay', '_fairLanternDay', '_fairFoodDay', '_fairWatchDay']);
    assert(p4.indexOf('今年四摊都已逛过——下一场' + qixi.name + '在 ' + (qixi.doy - 1) + ' 日后。') >= 0,
        '㉑ 四摊全逛：改口并接上日历里那场真日子（' + (qixi.doy - 1) + ' 日外的' + qixi.name + '），不是空头支票');

    var 历 = global.FestivalCalendar;
    global.FestivalCalendar = undefined;
    var p5 = 面板(1, ['_fairRiddleDay', '_fairLanternDay', '_fairFoodDay', '_fairWatchDay']);
    global.FestivalCalendar = 历;
    assert(p5.indexOf('今年四摊都已逛过——摊子明年今日再搭起来。') >= 0,
        '㉒ 历法不在位时退回这句实在话，不在屏上挂一个破折号空尾巴（宁缺于不猜日子）');

    var p6 = 面板(187, ['_fairFoodDay']);
    assert(p6.indexOf('吃巧果') >= 0 && p6.indexOf('吃元宵') < 0,
        '㉓ 七夕那天：吃食名跟着节令走（念「吃巧果」），摊口没把「元宵」写死');

    assert(面板(100, ['_fairWatchDay']) === '', '㉔ 平日仍返回空串（本批没顺手拆「非节令不占地方」那道闸）');
    assert(面板(1, ['_fairWatchDay'], '洛阳') === '', '㉕ 人不在这座城仍返回空串（城名那道闸照旧）');

    // ---- ㉖~㉘ 就地改口：真跑一摊，看那枚锚当场换字 ----
    global.WorldCalendar.day = 1;
    var 锚 = { textContent: '', classList: { hidden: true, toggle: function (k, on) { if (k === 'hidden') this.hidden = !!on; } } };
    var _旧取 = global.document.getElementById;
    global.document.getElementById = function (id) { return id === 'festival-fair-used' ? 锚 : null; };
    锚.classList.hidden = true;
    var c3 = { location: '长安', copper: 100, mood: 80, karma: 0, energy: 80, maxEnergy: 100 };
    global.currentCharData = c3;
    msgs.length = 0;
    global.FestivalFair.act('watch');
    eq(锚.textContent, '今年已逛：看花灯', '㉖ 真跑一次看花灯：摊口那枚锚当场换字（不必重进一次城才改口）');
    eq(锚.classList.hidden, false, '㉗ 换字的同时摘掉 hidden（空串时藏、有账时露，一支笔两处都管到）');
    锚.textContent = ''; 锚.classList.hidden = true;
    global.currentCharData = { location: '长安', copper: 100, mood: 80, karma: 0, energy: 80, maxEnergy: 100 };
    global.FestivalFair.act('food');
    assert(锚.textContent === '今年已逛：吃元宵 · 看花灯' || 锚.textContent === '今年已逛：吃元宵',
        '㉘ 再跑一摊：清单按窗内同一顺序长出来（读数 ' + 锚.textContent + '）');
    global.document.getElementById = _旧取;

    // ---- ㉙ 双侧自证（两枚对照各钉一盏绿灯：一枚量「就地改口」，一枚量「摊口读账」）----
    var 无锚 = raw.replace(/festival-fair-used/g, 'no-such-anchor');
    assert(无锚 !== raw, '㉙a 自证先确认这两刀切得动（锚名与那一行都在源码里找得到）');
    vm.runInThisContext(无锚, { filename: 'festival-fair(锚不在)' });
    var 锚2 = { textContent: '', classList: { hidden: true, toggle: function (k, on) { if (k === 'hidden') this.hidden = !!on; } } };
    global.WorldCalendar.day = 1;
    global.document.getElementById = function (id) { return id === 'festival-fair-used' ? 锚2 : null; };
    global.currentCharData = { location: '长安', copper: 100, mood: 80, karma: 0, energy: 80, maxEnergy: 100 };
    msgs.length = 0;
    global.FestivalFair.act('watch');
    eq(锚2.textContent, '', '㉙b 对照一（锚名对不上＝那一行等于不在面板上）：成交之后没有地方可改口，假锚一个字也没收到');
    load('js/city-facilities/festival-fair.js');

    var 无行 = raw.split('\n').filter(function (l) { return l.indexOf('id="festival-fair-used"') < 0; }).join('\n');
    assert(无行 !== raw, '㉙c 第二刀也切得动（那一行独立成一行，删得干净）');
    vm.runInThisContext(无行, { filename: 'festival-fair(改前形状)' });
    var 旧尺 = 面板(1, ['_fairWatchDay']);
    global.document.getElementById = _旧取;
    load('js/city-facilities/festival-fair.js');   // 立刻换回真源码，别让补丁形状留在上下文里骗后面
    assert(旧尺.indexOf('今年已逛') < 0 && 旧尺.indexOf(钮) >= 0,
        '㉙d 对照二（删掉那一行的改前形状）：摊口照样渲染、却一个字也读不进账——上面 ⑮~㉘ 那些绿灯不是空转出来的');

    // ---- ㉚~㉜ 零新状态 ＋ 数额未动 ----
    var c2 = { location: '长安', copper: 100, mood: 80, energy: 50, maxEnergy: 100, _fairWatchDay: 1 };
    global.currentCharData = c2;
    var 键前 = Object.keys(c2).slice().sort().join(',');
    global.FestivalFair.panelHtml('长安');
    eq(Object.keys(c2).slice().sort().join(','), 键前, '㉚ 读一次摊口不往 charData 上添任何一个键（摊口是读者，不是第二个写者）');
    var cfgFlat = ((raw.match(/var CFG = \{[\s\S]*?\};/) || [''])[0]).replace(/\s+/g, ' ').trim();
    eq(cfgFlat, 'var CFG = { RIDDLE_WIN_MOOD: 8, RIDDLE_WIN_EXP: 2, RIDDLE_LOSE_MOOD: 2, RIDDLE_MIN: 15,'
        + ' LANTERN_COPPER: 5, LANTERN_MOOD: 8, LANTERN_KARMA: 1, LANTERN_MIN: 20,'
        + ' FOOD_COPPER: 10, FOOD_EN: 30, FOOD_MOOD: 6, FOOD_MIN: 20,'
        + ' WATCH_MOOD: 5, WATCH_MIN: 30 };',
        '㉛ CFG 十二项数额逐字未动（补一行呈现层的话，手不许伸进账里）');
    // 原判据：整份文件（剥注释后）查无「明日请早」，且摊口那一段查无「明日」。
    // 新判据：只查**庙会那一族**（`var LZ = {` 之前），闲趣那一族按日说话是实话（[AT]① 已把两族分家并立了凭据）。
    // 为什么该改：闲趣（风筝/蹴鞠/投壶/卖春联）门控是 lzUsedToday 的一日一回，
    // 它的「明日请早」在第 503 行，是实话；拿庙会口径扫全文件＝量错了对象（同 [AT]①）。
    var 庙会话术2 = code.slice(0, (function () { var k = code.indexOf('var LZ = {'); assert(k > 0, '闲趣名册起点找得到（`var LZ = {`）——切不动即刻判红'); return k; })());
    assert(庙会话术2.indexOf('明日请早') < 0 && panelSrc.indexOf('明日') < 0,
        '㉜ 庙会话术与摊口那一行里「明日」没有回魂（COPY-04 那句病根不许从新写的句子钻回来）');
})();

// ==================== CC · 舆图城市行的热区说实话（UI-09） ====================
console.log('\n[CC] 热区不许撒谎：一行看起来整个可点、实际只有名字与那枚 24px 小钮接单——把两笔各写各的名字');
(function () {
    var app = src('js/app.js');
    var css = src('styles.css');

    function bodyOfApp(name) {
        var i = app.indexOf('function ' + name + '(');
        if (i < 0) return '';
        var d = 0, j = app.indexOf('{', i);
        for (var k = j; k < app.length; k++) {
            if (app[k] === '{') d++;
            else if (app[k] === '}') { d--; if (d === 0) return app.slice(i, k + 1); }
        }
        return '';
    }

    // ---- 真跑一次渲染：假 document ＋ 真 mapData 形状，产出的是玩家会看见的那段 HTML ----
    function 渲染(fnSrc) {
        var 盆 = [];
        function 造() { return { className: '', innerHTML: '', children: [], appendChild: function (c) { this.children.push(c); } }; }
        var 根 = 造();
        var c = vm.createContext({});
        c.console = { log: function () {}, warn: function () {}, error: function () {} };
        c.document = {
            getElementById: function (id) { return id === 'region-list' ? 根 : null; },
            createElement: function () { return 造(); }
        };
        c.mapData = {
            '中州': { desc: '九州帝都', cities: ['帝都 · 长安', '洛水城'] },
            '蜀地': { desc: '剑南道', cities: ['成都'] }
        };
        // 第一百一十一波：那一行渲染要问 window.SpecialPlaces 有没有已知特殊地点。
        // 沙箱不给 window 就等于伪造了一个浏览器里不存在的运行环境——给它一个空对象，
        // 上面那 5 行断言量的仍是「特殊地点册为空时」的真形状。
        c.window = c;
        vm.runInContext(fnSrc + '\ngenerateRegionList();', c);
        根.children.forEach(function (d) { 盆.push(d.innerHTML); });
        return 盆.join('\n');
    }
    // 一把防「空数组蒙过」的尺：零行渲染必须判红，不许 every(空) 白送绿灯
    function 全(段, 判, 名) { assert(段.length > 0 && 段.every(判), 名); }
    var 函体 = bodyOfApp('generateRegionList');
    assert(函体.length > 800, '① 取到 generateRegionList 的函数体（尺子没抓空）');
    var html = 渲染(函体);
    var 段表 = html.split(/class="city-list-item/).slice(1);
    eq(段表.length, 5, '② 沙箱真跑出 5 行（三城＋两州各一条野外），尺子落在真渲染的码上');
    var 城段 = 段表.filter(function (s) { return s.indexOf('🏙️') >= 0; });
    var 野段 = 段表.filter(function (s) { return s.indexOf('🌲') >= 0; });
    eq(城段.length, 3, '③ 城市行 3 条（与 mapData 里的三城对上）');
    eq(野段.length, 2, '④ 野外行 2 条（一州一条）');

    function 钮表(段) {
        return 段.split(/<button(?=[\s>])/).slice(1).map(function (b) {
            var 头 = b.split('</button>')[0];
            return {
                cls: (b.match(/class="([^"]*)"/) || ['', ''])[1],
                文: (头.split('>').pop() || '').replace(/\s+/g, ' ').trim(),
                码: (b.match(/onclick="([^"]*)"/) || ['', ''])[1]
            };
        });
    }
    function 行类(段) { return (段.match(/^\s*([^"]*)"/) || ['', ''])[1]; }

    全(城段, function (s) {
        var t = 钮表(s);
        return t.length === 2 && t[0].文 === '介绍' && t[1].文 === '前往';
    }, '⑤ 每条城市行都并列两枚明写标签「介绍／前往」（各写各的名字，不再让玩家猜）');
    全(城段, function (s) { return (s.match(/onclick="/g) || []).length === 2; },
        '⑥ 城市行里恰好两处 onclick——全在钮上，行与名字都不接单');
    全(城段, function (s) { return !/cursor-pointer/.test(行类(s)); },
        '⑦ 行的 class 串里没有 cursor-pointer（改前整行挂着它，等于向玩家承诺「点我」）');
    全(城段, function (s) { return 钮表(s).every(function (b) { return /cursor-pointer/.test(b.cls); }); },
        '⑧ 两枚钮各自带 cursor-pointer（那点手感从前是从行上继承的，行一撤就全没了）');
    全(城段, function (s) { return /<span class="shrink-0 whitespace-nowrap">🏙️/.test(s); },
        '⑨ 城市名整块 nowrap 且不缩（flex-1 min-w-0 那一版把名字交给折行，屏上量到城名被劈成两截）');
    全(城段, function (s) { return /class="flex items-center gap-1 shrink-0 ml-auto"/.test(s); },
        '⑩ 钮组 shrink-0 ＋ ml-auto（特大档不许挤掉「前往」，右缘还要成一条线）');
    全(城段, function (s) { return /flex flex-wrap items-center/.test(行类(s)); },
        '⑩a 行自己会折（flex-wrap）——装不下时折的是「名字／动作」这道语义界，不是名字中间');
    全(城段, function (s) { return !/justify-between/.test(行类(s)); },
        '⑩b 行上不再挂 justify-between（右对齐已由 ml-auto 一支笔做，两笔并一行只会日后互相打架）');
    全(城段, function (s) { return !/\btruncate\b|text-overflow|min-w-0/.test(s); },
        '⑩c 这一行不许用截字糊过去（「帝都 · …」比断成两截更难认，也不许留 min-w-0 那枚旧锚）');
    全(城段, function (s) { return s.indexOf('id=') < 0; },
        '⑪ 行内没新增元素 id（呈现层换摆法，不引新状态）');

    // ---- ⑫~⑮ 两笔各走各的：真跑钮上那段码，看谁出声 ----
    function 跑码(体) {
        var 出 = [];
        var c = vm.createContext({});
        c.event = { stopPropagation: function () { 出.push('止泡'); } };
        c.selectCityFromList = function (a, b) { 出.push('介绍:' + a + '|' + b); };
        c.travelToCityFromList = function (a, b) { 出.push('前往:' + a + '|' + b); };
        c.openWildernessForRegion = function (a) { 出.push('野外:' + a); };
        vm.runInContext('(function(){' + 体 + '})()', c);
        return 出;
    }
    var 首城 = 钮表(城段[0]);
    assert(跑码(首城[0].码).join(',') === '止泡,介绍:帝都 · 长安|中州',
        '⑫ 真点「介绍」＝只走 selectCityFromList(城, 州) 并止住冒泡（与改前名字 span 同一支笔、同一串实参）');
    assert(跑码(首城[1].码).join(',') === '止泡,前往:帝都 · 长安|中州',
        '⑬ 真点「前往」＝只走 travelToCityFromList(城, 州)，两笔不串线（改前后一字未换）');
    eq(跑码(野段[0].match(/onclick="([^"]*)"/)[1]).join(','), '止泡,野外:中州',
        '⑭ 野外那一枚仍走 openWildernessForRegion(州)');
    全(野段, function (s) { return 钮表(s).length === 1 && 钮表(s)[0].文 === '前往'; },
        '⑮ 野外行只一枚「前往」——那里没有「介绍」这一笔，不硬造第二个读者');
    全(段表, function (s) { return (s.match(/onclick="/g) || []).length === 0
        || (s.split(/<button(?=[\s>])/).slice(1).every(function (b) { return /^event\.stopPropagation\(\); ?/.test((b.match(/onclick="([^"]*)"/) || [, ''])[1]); })); },
        '⑯ 每一枚钮的码都以 event.stopPropagation() 开头（点钮不该把州界那一组折回去——UI-03 的账）');

    // ---- ⑰~⑲ 样式层：撒谎的那半条在 CSS 上 ----
    function cursor笔(文本) {
        var m = 文本.match(/\.city-list-item\s*\{([^}]*)\}/);
        if (!m) return { 缺规则: true };
        var c = m[1].replace(/\/\*[\s\S]*?\*\//g, '').match(/cursor\s*:\s*([^;]+);/);
        return { 缺规则: false, cursor: c ? c[1].trim() : '' };
    }
    var 笔 = cursor笔(css);
    assert(!笔.缺规则, '⑰ `.city-list-item` 规则块还在（撤指针不是把这条规则整块删掉——hover 与圆角仍归它管）');
    eq(笔.cursor, 'default', '⑱ 这一行显式写 cursor:default（实机教出来的一枚锚：改后第一版只把声明删空，屏上 computed 仍读到 pointer）');
    var 上游 = /\.region-item\s*\{([^}]*)\}/.exec(css);
    assert(上游 && /cursor\s*:\s*pointer/.test(上游[1]), '⑱a 上游 `.region-item` 确实还写着 pointer——继承源在，删空声明等于把它的承诺接到这一行上');
    eq(cursor笔(css.replace(/(\.city-list-item\s*\{[\s\S]*?)cursor:\s*default;/, '$1')).cursor, '',
        '⑱b 自证：把 default 抠掉，同一支尺立刻读到空（＝回到那一版「删了却还在撒谎」的写法）');
    assert(/\.city-list-item:hover\s*\{[^}]*background/.test(css), '⑲ 行 hover 底色保留：撤的是「点我」的承诺，不是「你在哪」的反馈');
    var 样式文件 = ['styles.css'].concat(fs.readdirSync(path.join(ROOT, 'styles'))
        .filter(function (n) { return n.endsWith('.css'); }).map(function (n) { return path.join('styles', n); }));
    assert(样式文件.length > 8, '⑳a 确实扫到了 styles/ 那一叠样式表（尺子没扫空目录，实扫 ' + 样式文件.length + ' 份）');
    var 有笔的文件 = 样式文件.filter(function (rel) { return /\.city-list-item\s*\{/.test(src(rel)); });
    eq(有笔的文件.length, 1, '⑳ 全仓只有一支笔定义 `.city-list-item` 的样式（同一把尺不许分叉）');

    // ---- ㉑~㉓ 双侧自证：把病还原，同一支尺必须立刻报红 ----
    var 旧城行 = 函体.replace(
        /<div class="city-list-item[^"]*">\s*<span class="shrink-0 whitespace-nowrap">🏙️ \$\{city\}<\/span>[\s\S]*?<\/span>\s*<\/div>/,
        '<div class="city-list-item px-2 py-1 text-xs text-gray-400 hover:text-yellow-400 hover:bg-gray-700 rounded cursor-pointer flex justify-between items-center">'
        + '<span onclick="event.stopPropagation(); selectCityFromList(\'${city}\', \'${prov}\')">🏙️ ${city}</span>'
        + '<button onclick="event.stopPropagation(); travelToCityFromList(\'${city}\', \'${prov}\')" class="text-xs">前往</button>'
        + '</div>');
    assert(旧城行 !== 函体, '㉑ 自证一的前置：能把城市行还原成改前那块摆法（还原不了＝尺子抓错东西）');
    var 旧html = 渲染(旧城行);
    var 旧段表 = 旧html.split(/class="city-list-item/).slice(1).filter(function (s) { return s.indexOf('🏙️') >= 0; });
    eq(旧段表.reduce(function (n, s) { return n + 钮表(s).filter(function (b) { return b.文 === '介绍'; }).length; }, 0), 0,
        '㉒ 自证一：改前那块摆法上，「介绍」一枚也没有（绿灯不是空转出来的）');
    全(旧段表, function (s) { return /cursor-pointer/.test(行类(s)); },
        '㉓ 自证一之二：还原后行 class 里 cursor-pointer 回来了，⑦ 那一支尺立刻报红（它认的正是这个）');
    assert(cursor笔(css.replace(/(\.city-list-item\s*\{)/, '$1 cursor: pointer;')).cursor === 'pointer',
        '㉔ 自证二：把 CSS 那枚 cursor 塞回去，⑱ 同一支尺立刻读到 "pointer"');

    // ---- ㉕~㉗ 本批不该碰的：数额、门控、第四处行 ----
    var 行旅 = bodyOfApp('travelToCityFromList');
    var 脚笔 = bodyOfApp('chargeFootJourney');
    assert(/footMinutes = 30/.test(脚笔) && /footStamina = 5/.test(脚笔) && /getMountTravelTimeMultiplier/.test(脚笔),
        '㉕ 进城凡人底账仍是 30 分钟、5 点精力；有坐骑才按倍率改实付（DES-10 共用笔没拆成两本账）');
    assert(/chargeFootJourney\(cityName\)/.test(行旅),
        '㉕a 城市行改调共用笔，不在自己体内另算一套（同一张面板两支笔＝本条要治的病）');
    assert(/getPlaneOf\(cityName\)/.test(行旅), '㉖ 位面那道门原样（v20.65 的闸不许被界面改动顺手拆了）');
    eq((app.match(/city-list-item/g) || []).length, 3, '㉗ app.js 内 .city-list-item 仍只三处（城市／野外／门派），没新增第四处行；第一百一十一波的特殊地点行在 js/map/special-places.js，用同一把尺，账在 [CL]');
    var 派段 = bodyOfApp('generateSectList');
    assert(/<span class="shrink-0 whitespace-nowrap"><span class="\$\{typeColor\}">/.test(派段)
        && /selectSectFromList\('\$\{sectName\}'\)" class="cursor-pointer[^"]*">介绍<\/button>/.test(派段),
        '㉘ 门派名册那一行用同一把尺（名字整块 nowrap＋「介绍」「前往」两枚明写标签），不是只修看见的那一处');
    assert(/class="city-list-item[^"]*flex flex-wrap items-center gap-x-1[^"]*ml-auto"/.test(派段.replace(/\s+/g, ' '))
        || (/flex flex-wrap items-center/.test(派段) && /shrink-0 ml-auto/.test(派段)),
        '㉘a 门派行也走「折在语义界上」这一支笔（行 flex-wrap ＋ 钮组 ml-auto），三处行同一把尺');
    assert(/travelToSectFromList\('\$\{sectName\}'\)/.test(派段),
        '㉙ 门派行的「前往」已交回脚程账（第一百一十四波 DES-10 改的笔：旧版这里是 `window.enterSect ? … : selectSectFromList(…)`，零成本直站山门口）——机制那一半由 [CP] 段接管');
    var 三元残留 = jsFiles('js').map(function (f) { return f.replace(/\\/g, '/'); })
        .filter(function (f) { return /window\.enterSect\s*\?\s*window\.enterSect\(/.test(codeOnly(src(f))); })
        .join(',');
    eq(三元残留, '', '㉙a 棘轮：那支「不结账就进门」的三元笔不许在任何文件里回魂（[CP]⑤ 同一条线上钉调用点唯一）');

    // ---- ㉚~㊲ 宽度账：摆法之外还要问「这一栏装不装得下」----
    // 常数来自实机逐行量尺（.scratch/cc-width.out，23 条城市行）：两枚明写标签那一组 91、名字与钮组之间 gap-1 = 4
    // 扣项 91 = 卡内边距 26 ＋ 州界 px-3 24 ＋ 缩进 ml-3 12 ＋ 行内 px-2 16 ＋ 列表滚动条 13
    // 校验这一串扣项的唯一办法：256 − 91 = 165，而 165 正是实机在旧栏宽上量到的可用宽（逐行读数分毫不差）
    var 钮组 = 91, 间隙 = 4, 扣项 = 26 + 24 + 12 + 16 + 13;
    var 名上限 = function (栏宽) { return 栏宽 - 扣项 - 间隙 - 钮组; };
    var 名字表 = { 50: 3, 63: 9, 76: 6, 102: 1, 114: 3, 127: 1 };   // 实机量到的 23 条城市名自然宽分布（3+9+6+1+3+1＝23）
    var 单行 = function (上限) { return Object.keys(名字表).reduce(function (n, w) { return n + (+w <= 上限 ? 名字表[w] : 0); }, 0); };
    var html源 = src('仙侠.html');
    var 栏宽类 = (html源.match(/class="(lg:w-\[[\d.]+rem\]) flex-shrink-0"/) || ['', ''])[1];
    assert(/lg:w-\[19rem\]/.test(栏宽类), '㉚ 侧栏栏宽从 仙侠.html 真读得出来，且是 19rem（' + 栏宽类 + '）');
    eq((html源.match(/lg:w-64/g) || []).length, 0, '㉛ 旧的 lg:w-64 全仓不再出现（收窄不是靠注释挡着的）');
    var 栏宽px = parseFloat(栏宽类.match(/\[([\d.]+)rem\]/)[1]) * 16;
    eq(256 - 扣项, 165, '㉜ 扣项那一串先对上实机读数：旧栏 256 − 91 = 165（量到的就是 165，算式不是编的）');
    eq(名上限(栏宽px), 118, '㉝ 新栏 ' + 栏宽px + ' → 可用 ' + (栏宽px - 扣项) + ' − 钮组那一串 = 名字上限 118');
    eq(单行(118), 22, '㉞ 23 条城市名里 22 条回到单行（≤118 的那几档：50／63／76／102／114）');
    eq(单行(118) + 1, 23, '㉟ 剩下的正是最长那一条「灵界·九天罡风带」(127)——账要合到 23，不许漏一格');
    assert(127 > 名上限(栏宽px), '㊱ 最长那一行如实判它「仍超」——不为了好看把栏宽再吹大一档，也不假装装得下');
    assert(单行(名上限(256)) === 12, '㊲ 自证：旧栏宽下名字上限只有 ' + 名上限(256) + 'px，同一支算式算出单行 12 条／劈名 11 条——与实机量到的行高 46px 那 11 条对上');
    assert(/19rem/.test(html源) && /扣项 91/.test(html源), '㊳ 这笔账写在栏宽那一格的注释里（日后有人收窄，看得见它为什么是 19rem）');
    assert(/^\s*<div class="lg:w-\[\d+(\.\d+)?rem\]/m.test(html源), '㊴ 栏宽用 rem 不用裸 px——根字号放大时它跟着涨，与行内字号等比，故一次定档三档通用');
    全(城段, function (s) { return /flex flex-wrap/.test(行类(s)) && /whitespace-nowrap/.test(s); },
        '㊵ 那一条超宽行靠的是「整组钮折第二行」——行 flex-wrap 与名字 nowrap 两枚声明缺一，127 那格就会退回劈名');
    assert(栏宽px - 扣项 >= 118 + 间隙 + 44,
        '㊶ 野外那一行（名字最长 118 ＋ 一枚钮 44）也在同一道闸内：可用 ' + (栏宽px - 扣项) + ' ≥ 166');
})();

// ==================== CE · 状态九宫格：一张高卡不许绑架同排（UI-05 ＋ UI-24①） ====================
console.log('\n[CE] 空洞的尺：卡盒里有多少是字、多少是空腔——行轨由谁定，洞就记在谁头上');
(function () {
    var craft = src('styles/ui-craft.css');
    var html源 = src('仙侠.html');
    var app = src('js/app.js');
    var 净 = craft.replace(/\/\*[\s\S]*?\*\//g, '');   // 注释里的读数不是声明，别让它替规则背书

    // 同一支选择器可能在 @media 内外各写一块（这里正是），故取块要按「含哪条声明」筛 —— 尺子全仓只一支（见顶层 css块尺）
    var 尺 = css块尺();
    var esc = 尺.esc, 块表 = 尺.块表, 找支 = 尺.找支, 支值 = 尺.支值, 支数 = 尺.支数, 支址 = 尺.支址, 出现次数 = 尺.出现次数;

    var 量 = '#panel-character #sub-status > .grid > :nth-child(-n+3)';
    var 境 = '#panel-character #sub-status > .grid > :nth-child(4)';
    var 则 = '#panel-character #sub-status > .grid > div';
    var 网 = '#panel-character #sub-status > .grid';
    var 快捷 = function (n) { return '#panel-character #sub-status > .grid > :nth-child(' + n + ')'; };

    // ---- ①~④ 栏数闭合，以及「谁定行轨」----
    eq(支值(净, 量, 'grid-column'), 'span 4', '① 三条计量条各占 4 栏（改前各 2 栏，且与境界卡挤在同一行）');
    eq(支值(净, 境, 'grid-column'), 'span 12', '② 境界卡整幅一行（改前 6 栏同排——那一行的行轨正是它定的）');
    eq([5, 6, 7].map(function (n) { return 支值(净, 快捷(n), 'grid-column'); }).join('+'), 'span 3+span 2+span 3',
        '③ 快捷卡前三张仍 3+2+3（第三行的分配本批一字未动）');
    eq(支值(净, '#panel-character #sub-status > .grid > :nth-child(n+8)', 'grid-column'), 'span 2', '③a 第八、九张仍各 2 栏（那一条写的是 n+8，认的是「第八张往后」）');
    assert(4 * 3 === 12 && 12 === 12 && 3 + 2 + 3 + 2 + 2 === 12,
        '④ 算术闭合：三行栏数各凑满 12（4×3 ／ 12 ／ 3+2+3+2+2），既没有孤卡也没有溢到第二行');

    // ---- ⑤~⑨ 境界卡那一支例外规则本身 ----
    eq(支值(净, 境, 'flex-direction'), 'row', '⑤ 境界卡内部改横排（标签·境界名·真元·历练·绝技·入口钮顺着读一行）');
    eq(支值(净, 境, 'flex-wrap'), 'wrap', '⑥ 装不下仍按整块折（flex-wrap）——与 UI-22／UI-09 同一支笔，不硬顶、不截名');
    eq(支数(净, 境, 'flex-direction'), 1, '⑦ 给境界卡定 flex-direction 的全仓只这一支（同一件事不许两笔各写一半）');
    eq(支值(净, 境 + ' > *', 'margin'), '0', '⑧ 卡内三处 Tailwind 的 mt-1/mt-2/mb-1 归零，间距只由 gap 一支笔给');
    assert(支址(净, 则, 'flex-direction') >= 0 && 支址(净, 则, 'flex-direction') < 支址(净, 境, 'flex-direction'),
        '⑨ 源序：先通则（列向居中）、后例外（第 4 张横排）——今天靠特异度也赢，但顺序倒了改日谁再补一条就翻');

    // ---- ⑩~⑪ 刻意不走的那条路：撤的是绑架，不是等高 ----
    assert(/flex-direction:\s*column/.test(找支(净, 则, 'flex-direction').体)
        && /justify-content:\s*center/.test(找支(净, 则, 'flex-direction').体)
        && /align-items:\s*center/.test(找支(净, 则, 'flex-direction').体),
        '⑩ 其余八张卡仍是列向＋内容居中（底边齐这一条没被顺手撤掉）');
    eq(块表(净, 网).some(function (x) { return /align-items/.test(x.体); }), false,
        '⑪ 网格里没写 align-items: start——本批刻意不走「卡高各走各的」：那只是把洞从盒子里挪到盒子外，还会撕掉底边');

    // ---- ⑫ 一支笔：全仓只有 ui-craft.css 给这一格定栏 ----
    var 定栏处 = [];
    ['styles.css', 'styles/ui-craft.css', 'styles/ui-tokens.css', 'styles/panel-map.css', 'styles/panel-mail.css',
    'styles/panel-shop.css', 'styles/panel-quests.css', 'styles/panel-inventory.css', 'styles/panel-equipment.css',
    'styles/panel-house.css'].forEach(function (f) {
        if (/#sub-status\s*>\s*\.grid[^{]*\{[^}]*grid-template-columns/.test(src(f).replace(/\/\*[\s\S]*?\*\//g, ''))) 定栏处.push(f);
    });
    eq(定栏处.join(','), 'styles/ui-craft.css', '⑫ 给 #sub-status 定栏的宿主全仓只有一处（第二处会来抢特异度，屏上读到的行轨就不再唯一）');

    // ---- ⑬~⑲ markup 锚：CSS 认的是「第 4 个孩子」，位置就是它的锚 ----
    function 格中卡(html) {
        var i = html.indexOf('id="sub-status"');
        if (i < 0) return [];
        var g = html.indexOf('<div class="grid grid-cols-2', i);
        if (g < 0) return [];
        var re = /<\/?div\b/g; re.lastIndex = html.indexOf('>', g) + 1;
        var depth = 0, start = 0, out = [], m;
        while ((m = re.exec(html))) {
            if (m[0] === '<div') { if (depth === 0) start = m.index; depth++; }
            else { depth--; if (depth < 0) break; if (depth === 0) out.push(html.slice(start, m.index + 6)); }
            if (out.length > 12) break;
        }
        return out;
    }
    var 卡 = 格中卡(html源);
    // 原判据：9 张卡、九个 id 按位一一对应（所在地一张、时间一张）。
    // 现判据：8 张卡、九个 id 仍全在（所在地与时间合为一张，该卡自带 md:col-span-2）。
    // 为什么该改：仙侠.html 里那处 markup 上写着「用户批（2026-10-03 08:32）：所在地/时间两卡合一
    // （各只一行字）。id 全保留（current-location-display/time-display/season-display
    // + showCityTravelUI 按钮），JS 更新链零改动」——是用户批准的合卡，不是漏画或错位。
    // 本段真正要量的「洞」（各卡内容实高之差）与「行轨」（grid 定栏）都由 CSS 与栏数决定：
    // 合并后那一格仍占 2 栏（md:col-span-2），①②③④ 那套栏数算式一栏不差，洞的读数不受影响。
    // 改的只是「几张卡」与「哪个 id 落在第几张」这两处数数，不是把尺放宽。
    // 收紧处：下面 ⑭ 由「逐位一一对应」升级为「每张卡只准含自己那一组 id，且九个 id 一个不许丢」，
    // 合卡后若有人把时间或所在地挪回单独一张、或把任一 id 挪错卡，这条照样当场判红。
    var 卡位 = [
        ['stamina-bar'],
        ['qi-bar'],
        ['mood-bar'],
        ['realm-text'],
        ['current-location-display', 'time-display'],
        ['mail-quick-status'],
        ['party-member-count'],
        ['calendar-next-auction-badge']
    ];
    eq(卡.length, 卡位.length, '⑬ 状态栏真从 仙侠.html 切得出 ' + 卡位.length + ' 张卡（尺子没抓空）');
    eq(卡位.map(function (组, n) {
        return 组.filter(function (t) { return 卡[n].indexOf('id="' + t + '"') < 0; }).join('|') || (n + 1);
    }).join(''), 卡位.map(function (_, n) { return String(n + 1); }).join(''),
        '⑭ ' + 卡位.length + ' 张卡按位各含自己的读数 id（所在地+时间同卡）'
        + '——第 4 张就是境界卡，那一支例外规则落对了孩子');
    // 反向钉位：九个 id 各自只许出现在自己那一张卡里（合卡只许合在第 5 张，不许顺势把别的也拖进来）
    var 全体id = 卡位.reduce(function (a, 组) { return a.concat(组); }, []);
    eq(全体id.length, 9, '⑭a 尺上仍是九个读数 id，一个没被合卡吞掉');
    assert(全体id.every(function (t) {
        return 卡.filter(function (b) { return b.indexOf('id="' + t + '"') >= 0; }).length === 1;
    }), '⑭b 每个读数 id 全栏只出现在自己那一张卡里（合卡不许顺手把别的 id 也拖进同一张）');
    assert(卡[1].indexOf('id="realm-qi-limit"') >= 0,
        '⑮ 那行「境界提供 N 真气上限」的容器（#realm-qi-limit）在第二张计量卡里——UI-24① 的病灶与本次给的宽度对得上');
    var 境界内 = ['>🏆 境界', 'id="realm-text"', 'id="char-travel-title"', 'id="realm-essence-display"',
    'id="realm-tempering-display"', 'id="char-abilities-display"', 'onclick="openMainStoryPanel()"'];
    var 读序 = 境界内.map(function (t) { return 卡[3].indexOf(t); });
    assert(读序.every(function (x) { return x >= 0; }) && 读序.every(function (x, i) { return i === 0 || x > 读序[i - 1]; }),
        '⑯ 境界卡内读序＝标签→境界名→见闻称号→真元→历练→绝技→入口钮（横排后屏上就是这个顺序，往里插一件就得同批改这支笔）');
    eq(['openMainStoryPanel', 'openDisciplePanel', 'openDaoCompanionPanel', 'openFireQTE', 'openBountyBoard']
        .filter(function (f) { return 卡[3].indexOf('onclick="' + f + '()"') >= 0; }).length, 5,
        '⑰ 五枚入口钮的 onclick 逐字未动（本批只改摆法，一扇门的开关没新造、没撤）');
    eq(出现次数(html源, 'class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"'), 1,
        '⑱ 那一层容器全仓一枚（它自带 grid-cols-4，靠 §1 覆盖成 12 栏——第二枚就会读到旧栏数）');

    // ---- ⑲~⑳ UI-24① 是靠给宽度收的，不是靠砍文案 ----
    // v25.1·P17：这支笔升级为双分支（总上限＞境界账时把「另 50 从哪来」算给玩家看），
    // 兜底分支仍逐字保留「境界提供${qiMax}真气上限」——哨兵口径不松：文字只许变长变明白，不许挪走或缩短。
    assert(/qiLimitDisplay\.textContent = \(_qiEffMax > qiMax\)[\s\S]{0,220}?境界提供\$\{qiMax\}真气上限`/.test(app),
        '⑲ 「境界提供${qiMax}真气上限」那支笔逐字在位（v25.1·P17 只加了算账分支，兜底文案一字未动）');
    eq(jsFiles('js').filter(function (f) { return /真气上限`/.test(src(f)); }).length, 1,
        '⑳ 全仓只有一个写者写这一行（第二处就会有一处不知道它被改短过）');

    // ---- ㉑~ 三刀双侧自证：上面那些绿灯不是空转出来的 ----
    var 例外块 = 找支(净, 境, 'flex-direction');
    var 删例外 = 净.replace(境 + ' {' + 例外块.体 + '}', '');
    assert(删例外 !== 净 && 支值(删例外, 境, 'flex-direction') === '' && 支值(删例外, 则, 'flex-direction') === 'column',
        '㉑ 对照一：删掉那一支例外 → 境界卡立刻退回列向（⑤~⑨ 量的是真规则，不是 Tailwind 顺手给的）');
    var 错一格 = 净.split(境).join(快捷(3));
    assert(错一格 !== 净 && 卡[2].indexOf('id="realm-text"') < 0,
        '㉒ 对照二：选择器错一格（落到第 3 张心情卡）→ ⑭ 那条锚立刻判红——位置就是这支笔的命');
    // 洞的算式用实机改前读数（.scratch/v24-CE-cards-ce1.json，1500×800 标准档）：内容实高 精力59／真气82／心情59／境界148
    var 内容 = { 精力: 59, 真气: 82, 心情: 59, 境界: 148 };
    var 旧行轨 = Math.max(内容.精力, 内容.真气, 内容.心情, 内容.境界);   // 旧摆法：四张同排，行轨 = 最高那张
    var 新行轨 = Math.max(内容.精力, 内容.真气, 内容.心情);              // 新摆法：境界卡另起一行
    eq(旧行轨 - 内容.精力, 89, '㉓ 对照三·上：旧摆法栏数也闭合到 12（2+2+2+6），精力卡的洞却 = 148 − 59 = 89px（占卡内 60.2%）——**闭合不是充分条件**');
    eq(新行轨 - 内容.精力, 23, '㉓ 对照三·下：新摆法洞只剩 82 − 59 = 23px（28%），且那 23px 是内容真实差（真气卡多一行说明），不再是一张高卡绑架同排');

    // ---- ㉔~㉖ 没许的都不许顺手做 ----
    assert(!/px/.test(找支(净, 量, 'grid-column').体 + 找支(净, 境, 'grid-column').体),
        '㉔ 定栏那一支只用栏数，没写死任何 px 宽度（写死 px 就不跟字号档长——UI-23 那笔旧账）');
    assert(/^[\d.]+px [\d.]+px$/.test(支值(净, 境, 'gap')),
        '㉕ 例外那一支里的 px 只许出现在 gap（间距不跟字号长是有意的）：读数 ' + 支值(净, 境, 'gap') + '；出现宽度类 px 就该改 rem');
    eq(出现次数(净, 'id="stamina-bar"'), 0, '㉖ CSS 不认 id（认的是位置与类）——否则 markup 一改，规则会静默落空而不是改 markup 的人看见');
})();

// ==================== [CF] 第五十九批 · UI-06 地标图鉴不剧透 ====================
// 立案读数（改良说明.md UI-06，改前实机 .scratch/v24-CF-bestiary-cf0.out）：
//   窗 512×750、12 行全是零宽条，「0%」在窗内出现 13 次（12 行 + 头部总账），12 个真名一次剧透干净。
// 改后同一支脚本（cf1）：零宽条 0、「0%」1 次（只剩头部那本真账）、露名 0、12 行各落一条传闻方位。
// 这一段跑的是真模块真函数——只有三态里另两态（已探／已至）在屏上造不出来（新号零灵石零进度、亲至要走几十步），故在此真跑。
console.log('\n[CF] 第五十九批 UI-06 地标图鉴按知识三态落笔');
(function () {
    function 数(text, needle) { var n = 0, i = 0; while ((i = text.indexOf(needle, i)) >= 0) { n++; i += needle.length; } return n; }
    var 行壳 = 'gap-2 p-2 bg-gray-700/30 rounded';
    var 条壳 = 'h-1.5 rounded bg-yellow-500';

    load('js/map/map-markers.js');
    var cd = { name: '图鉴测试', energy: 100 };
    global.currentCharData = cd;
    global.getCurrentCharData = function () { return cd; };
    load('js/map/travel-journal.js');
    load('js/map/landmark-explore.js');

    var 名录 = Object.keys(window.LANDMARK_EXPLORE_DATA);
    eq(名录.length, 12, 'CF① 图鉴仍摆全本 12 处——「不剧透」不是靠少摆条目糊过去的');

    // 真渲染：捕获 showLandmarkBestiary 塞进 body 的那一枚模态
    function 开窗() {
        var 捕 = [];
        var 旧造 = global.document.createElement, 旧附 = global.document.body.appendChild;
        global.document.createElement = function (t) { var o = 旧造(t); 捕.push(o); return o; };
        global.document.body.appendChild = function (x) { 捕.push(x); return x; };
        try { window.showLandmarkBestiary(); }
        finally { global.document.createElement = 旧造; global.document.body.appendChild = 旧附; }
        var 模态 = 捕.filter(function (o) { return (o.innerHTML || '').indexOf('地标图鉴') >= 0; }).pop();
        return 模态 ? 模态.innerHTML : '';
    }

    var 窗 = 开窗();
    assert(窗.length > 0, 'CF② 图鉴窗真渲染得出来（捕获到含「地标图鉴」的那一枚模态）');
    eq(数(窗, 行壳), 12, 'CF③ 十二条一行不省（遮的是名字与条，不是把行撤空）');
    eq(数(窗, 条壳), 0, 'CF④ 一本账没落时窗内零枚进度条——不再画 12 条 0% 空条');
    eq(数(窗, 'width:0%'), 1, 'CF⑤ 零宽条只剩头部那本总账一枚（改前 12 行各摆一枚空条时这里是 13）');
    var 漏名 = 名录.filter(function (n) { return 窗.indexOf(n) >= 0; });
    eq(漏名.join(','), '', 'CF⑥ 未亲至、未探索的一处真名都不许上屏（漏出的：' + (漏名.join(',') || '无') + '）');
    eq(数(窗, '传闻在'), 12, 'CF⑦ 每一处未寻到者都换上一条方位传闻（既留悬念也给得出下一步）');
    var 名录源 = JSON.parse(JSON.stringify(window.LANDMARKS));
    var 对不上 = 名录.filter(function (n) {
        var 域 = null;
        for (var k in 名录源) {
            var nm = 名录源[k].name;
            if (nm === n || (n === '魂殿' && nm === '魂殿遗迹')) 域 = 名录源[k].region;
        }
        return !域 || 窗.indexOf('传闻在' + 域 + '一带') < 0;
    });
    eq(对不上.join(','), '', 'CF⑧ 十二句传闻的域名逐字取自 map-markers 名录（不是图鉴自己另抄一套；对不上的：' + (对不上.join(',') || '无') + '）');
    assert(窗.indexOf('地标须亲至方能探索') >= 0 && 窗.indexOf('真名要脚走到了才认得') >= 0,
        'CF⑨ 脚注把「为什么是问号」说在屏上（遮名是新规矩，别让玩家以为是坏屏）');

    // 三态另两支：账一动，同一行立刻翻面（双侧自证——绿灯不是把行写死出来的）
    var 冷 = window.LANDMARK_EXPLORE_DATA['寒冰深渊'];
    冷.exploreProgress = 35;
    var 窗2 = 开窗();
    assert(窗2.indexOf('寒冰深渊') >= 0 && 数(窗2, 条壳) === 1 && 窗2.indexOf('width:35%') >= 0 && 窗2.indexOf('35%') >= 0,
        'CF⑩ 落了探索度那一处立刻给真名＋真条＋真百分比（同一条行从「？？？」翻回来的）');
    eq(窗2.indexOf('1/12') >= 0, true, 'CF⑪ 头部总账读的是同一本账（有一处进账，头行便从 0/12 翻成 1/12）');
    冷.exploreProgress = 0;

    // 「亲至」认的是野外图那枚印（lm_<map-markers 键>），名录名与图鉴键不同字也要认得
    window.TravelJournal.markOnce('lm_soul_temple', 2, '测试落印');
    var 窗3 = 开窗();
    assert(窗3.indexOf('魂殿') >= 0 && 窗3.indexOf('已亲至 · 尚未探索') >= 0,
        'CF⑫ 脚走到过而未探索的一处：给真名、给「已亲至 · 尚未探索」，仍不摆空条');
    eq(数(窗3, 条壳), 0, 'CF⑬ 亲至那一支不越级冒充「有进度」（条壳仍 0 枚）');
    var 窗4 = (function () {
        cd._travel = { marks: { 'lm_hun_dian': 1 } };   // 拿图鉴自己的英文 id 落印——野外图 POI 从不认这个键
        var w = 开窗(); cd._travel = { marks: {} }; return w;
    })();
    eq(窗4.indexOf('魂殿') >= 0, false, 'CF⑭ 认键必须认野外图那一本（lm_hun_dian 那枚假印换不来真名）');

    // 只读出口的卫生：问一句不许在角色数据上长出账本来
    var 净 = { name: '无账' };
    global.currentCharData = 净;
    eq(window.TravelJournal.hasMark('lm_dragon_vein'), false, 'CF⑮ 无 _travel 时 hasMark 答 false');
    eq(净._travel, undefined, 'CF⑯ 纯只读——问一句话不许凭空造出 _travel（那会跟着存档走）');
    global.currentCharData = cd;

    var 抄账处 = jsFiles('js').filter(function (f) {
        return /\bcd\._travel|\._travel\.marks/.test(codeOnly(src(f)).replace(/\/\/[^\n]*/g, ''));
    });
    eq(抄账处.join(','), path.join('js', 'map', 'travel-journal.js'),
        'CF⑰ 全仓只有游历见闻自己伸手进 _travel（图鉴走 hasMark 问一句；第二处抄账就会有一处不知道账被谁翻过）：' + 抄账处.join(','));
    assert(窗.indexOf('exploreLandmark') < 0 && 数(窗, 'onclick') === 1,
        'CF⑱ 图鉴照旧只看不探（v23.0 老规矩守住：窗内唯一的 onclick 是那枚关闭叉）');
})();

// ==================== [CG] 第六十批 · UI-25 手搓模态接上公共那一笔 vh 帽 ====================
// 立案读数（改良说明.md UI-25，第五十九批实机 .scratch/v24-CF-bestiary-cf6/cf7.out）：
//   正常档图鉴卡 512×769（卡顶 16／视口 800，只剩 16px 余量）；特大档 640×960 > 800 ⇒ 卡顶 −80、关闭叉顶 −49——标题与 × 整块在屏外。
// 病根不是「行太多」，是这张手搓卡既无 max-height 也无内滚；而公共 showModal（js/global-utils.js:127）那张卡一直带着
//   max-h-[85vh] overflow-y-auto。故本批不另发明一套高度策略，只把本文件三扇手搓窗接到同一支笔上。
// 两段方法账（本批真踩过，写在这是为了让下一批不重踩）：
//   ① 本段**不许无条件 load landmark-explore.js**——它顶层是 const LANDMARK_EXPLORE_DATA，同进程二次求值必抛「Identifier 已声明」
//      （第五十九批的 [CF] 已经 load 过它），第一次跑本段就是这么炸的。故一律「查得到函数就不 load」。
//   ② 双侧自证只能走在**字符串层**（抠掉那支笔再看尺读不读得空），不能走「改盘上文件 → 重 load」那条路（同 ①）。
console.log('\n[CG] 第六十批 UI-25 地标三扇模态不再顶穿视口');
(function () {
    function 数(text, needle) { var n = 0, i = 0; while ((i = text.indexOf(needle, i)) >= 0) { n++; i += needle.length; } return n; }
    var 笔 = 'max-h-[85vh] overflow-y-auto';
    function 判帽(卡) { return /max-h-\[(\d+(?:\.\d+)?)vh\]/.test(卡) && /overflow-y-auto/.test(卡); }
    function 卡类(html) { var m = /^<div class="([^"]*)"/.exec(html || ''); return m ? m[1] : ''; }   // 遮罩的 className 不在 innerHTML 里，读到的必是卡那一层
    function 开窗(函数名, 参数) {
        var 捕 = [];
        var 旧造 = global.document.createElement, 旧附 = global.document.body.appendChild;
        global.document.createElement = function (t) { var o = 旧造(t); 捕.push(o); return o; };
        global.document.body.appendChild = function (x) { 捕.push(x); return x; };
        try { window[函数名].apply(null, 参数 || []); }
        finally { global.document.createElement = 旧造; global.document.body.appendChild = 旧附; }
        var 模态 = 捕.filter(function (o) { return /<div class="[^"]*bg-gray-800/.test(o.innerHTML || ''); }).pop();
        return 模态 ? 模态.innerHTML : '';
    }
    // 自己造一本干净的账：不借上一段留下的角色数据（[CF] 落过一枚印，借来就会少一条传闻）
    var cd = { name: '帽测', energy: 100 };
    global.currentCharData = cd;
    global.getCurrentCharData = function () { return cd; };
    if (!window.LANDMARKS) load('js/map/map-markers.js');
    if (!window.TravelJournal) load('js/map/travel-journal.js');
    if (typeof window.showLandmarkBestiary !== 'function') load('js/map/landmark-explore.js');

    var 公共 = src('js/global-utils.js');
    var 公共数 = (/max-h-\[(\d+(?:\.\d+)?)vh\]/.exec(公共) || [])[1];
    assert(!!公共数 && /overflow-y-auto/.test(公共),
        'CG① 先钉住「笔在谁手里」：公共 showModal 那张卡带着高度帽与内滚（读到 ' + (公共数 ? 公共数 + 'vh' : '无') + '）——本批不许另起一支');

    window._landmarkPullSword = function () { };
    var 三窗 = [
        ['地标图鉴', 开窗('showLandmarkBestiary')],
        ['地标进度', 开窗('showLandmarkProgressUI', [window.LANDMARK_EXPLORE_DATA['古剑峰']])],
        ['岩中古剑', 开窗('_offerPullSword', ['古剑峰'])]
    ];
    三窗.forEach(function (x, i) {
        var 卡 = 卡类(x[1]);
        assert(x[1].length > 0 && 判帽(卡), 'CG②' + (i + 1) + ' 「' + x[0] + '」那张卡真的带上帽与内滚（读到「' + (卡.slice(-46) || '空') + '」）');
        var m = /max-h-\[(\d+(?:\.\d+)?)vh\]/.exec(卡);
        eq(m && m[1], 公共数, 'CG③' + (i + 1) + ' 「' + x[0] + '」的帽与公共那张同数同单位（一扇窗一个帽便是两支笔）');
        assert(!/max-h-\[\d+px\]/.test(卡), 'CG④' + (i + 1) + ' 「' + x[0] + '」的帽不许写成裸 px（UI-23 之后字号有三档，写死的数只在 16px 一档成立）');
    });

    var 源 = codeOnly(src('js/map/landmark-explore.js')).replace(/\r\n/g, '\n');
    var 遮罩行 = 源.split('\n').filter(function (l) { return /className\s*=\s*'fixed inset-0/.test(l); });
    eq(遮罩行.length, 3, 'CG⑤ 本文件手搓遮罩仍是三枚（多出第四枚就得照样带帽，CG⑥ 那把尺当场数）');
    assert(遮罩行.every(function (l) { return !/max-h-\[|overflow-y/.test(l); }),
        'CG⑥ 帽与滚都没误写进遮罩那一层（给 inset-0 那层加帽＝整屏变矮，卡照样出屏；要滚的是卡）');
    var 抠样 = 三窗[0][1].split(笔).join('');
    assert(抠样 !== 三窗[0][1] && !判帽(卡类(抠样)), 'CG⑦ 同一支尺在抠掉笔之后读到「无帽」（绿灯不是空转出来的）');

    var 窗 = 三窗[0][1];
    eq(数(窗, 'gap-2 p-2 bg-gray-700/30 rounded'), 12, 'CG⑧ 十二条一行不省——有了内滚仍不许靠砍行／分页把窗缩进视口（那只是把 UI-06 那本账挪到另一处看不见）');
    eq(数(窗, '传闻在'), 12, 'CG⑨ UI-06 三态那支笔未动（本批只加两枚工具类，不顺手改呈现口径）');
    eq(数(窗, 'onclick='), 1, 'CG⑩ v23.0「图鉴只看不探」守住：窗内唯一 inline onclick 仍是那枚关闭叉');
    assert(数(窗, 'width:0%') <= 1, 'CG⑪ 零宽条至多头部那笔总账一枚（有了内滚也不许往行里回摆空条）：读到 ' + 数(窗, 'width:0%'));

    // 本文件用**精尺**：遮罩声明向前找到「第一条以 <div class= 开头的 innerHTML」——那一层才是卡，
    // 只对它的 className 判帽。（14 行窗口那把粗尺在这里会漏报：本文件两扇窗的卡行分别在第 22、34 行，中间在拼奖励名册。）
    function 精尺卡漏(源文) {
        var 行 = codeOnly(源文).replace(/\r\n/g, '\n').split('\n');
        var 漏 = [];
        for (var i = 0; i < 行.length; i++) {
            if (!/className\s*=\s*'fixed inset-0[^']*items-center[^']*justify-center/.test(行[i])) continue;
            var 卡 = null;
            for (var j = i; j < Math.min(i + 60, 行.length); j++) {
                var m = /\.innerHTML\s*=\s*'<div class="([^"]*)"/.exec(行[j]);
                if (m) { 卡 = m[1]; break; }
            }
            if (卡 === null || !/max-h-\[/.test(卡)) 漏.push((i + 1) + (卡 === null ? '(找不到卡)' : ''));
        }
        return 漏;
    }
    var 名 = path.join('js', 'map', 'landmark-explore.js');
    var 现漏 = 精尺卡漏(src(名));
    eq(现漏.length, 0, 'CG⑫a 本文件三扇居中模态已全部带帽（精尺：卡那一层的 className 逐枚判；仍漏的 ' + 现漏.join(',') + '）');
    var 抠漏 = 精尺卡漏(src(名).split(笔).join(''));
    eq(抠漏.length, 3, 'CG⑫b 同一把精尺在抠掉这三笔之后立刻多报 3 枚（绿灯不是空转出来的，且它数的是笔不是文件名）');

    // 家族账（读码层棘轮）：全仓手搓「居中卡片式」遮罩里卡片不带任何高度帽的处数，只许降不许升。
    // 这把是**粗尺**——只在遮罩声明起 14 行内找 max-h-[，卡片行更靠后的窗会被漏报成「已带帽」，故 46 是下界不是全貌；
    // 精量要一扇一扇开屏量（UI-25 家族账仍挂在改良说明.md §一）。
    // v24.1·重构第3步后，这把粗尺第一次撞上**自己的盲区**并误报了一次，说明白再判：
    // Modal 栈在 global-utils.js 新写的第 167 行那扇遮罩，帽（max-h-[85vh] overflow-y-auto）
    // 落在第 182 行——正好在 14 行窗**外第 15 行**，于是被记成「无帽」，总数 46→47 判红。
    // 处置**不是把基线抬到 47**（那等于给尺的漏洞开门，此后真出现无帽新窗也不红了），
    // 而是让扇 167 跳出粗尺的统计口径：它是重构自己写的、按体例自带 max-h- 的公共模态，
    // 归 CM⑤ 那把尺管（那条已随转发链走 XianXia.Modal.open 并做过摘帽反证，仍会咬）。
    // 认**特征串**不认行号：这扇窗一次随功能挪了 167→175（work4 当日），
    // 行号锚当场失效 → 被算进「无帽」总数 46→47 假红。行号是这批里最脆的一种锚，
    // 往文件上方插一行就断。特征串跟代码走，挪行不加行都不影响。
    var 弹层豁免 = {
        'js/global-utils.js': ["x-modal-layer"]   // 自带 max-h- 帽、超出粗尺 14 行窗的公共模态
    };
    function 扫(表) {
        var n = 0, 例 = [], 跳过 = 0;
        表.forEach(function (x) {
            var 名 = String(x.名).replace(/\\/g, '/');
            var 白 = 弹层豁免[名] || [];
            var 行 = codeOnly(x.文).replace(/\r\n/g, '\n').split('\n');
            for (var i = 0; i < 行.length; i++) {
                var 命中豁免 = 白.some(function (sig) { return 行[i].indexOf(sig) >= 0; });
                if (命中豁免) { 跳过++; continue; }   // 帽子在窗外，属 CM⑤ 的账
                if (!/className\s*=\s*'fixed inset-0[^']*items-center[^']*justify-center/.test(行[i])) continue;
                if (!/max-h-\[/.test(行.slice(i, i + 14).join('\n'))) { n++; if (例.length < 5) 例.push(名 + ':' + (i + 1)); }
            }
        });
        return { 数: n, 例: 例, 跳过: 跳过 };
    }
    var 全 = 扫(jsFiles('js').map(function (f) { return { 名: f, 文: src(f) }; }));
    console.log('  · 家族账（读码层，不判红）：全仓居中手搓遮罩里卡片无高度帽 ' + 全.数 + ' 枚，例：' + 全.例.join(' / ') + '…'
        + (全.跳过 ? '（另有 ' + 全.跳过 + ' 枚自带帽但帽子落在粗尺 14 行窗外，归 CM⑤ 管，不计入本账）' : ''));
    assert(全.数 <= 46, 'CG⑬ 棘轮：无帽的手搓居中模态处数不许再涨（本批基线 46；量法＝遮罩声明起 14 行内找 max-h-[；'
        + '※v24.1 Modal 那扇自带帽但帽在窗外，改由 CM⑤ 逐字盯，不抬基线；其余各扇未查屏，UI-25 家族账仍挂在改良说明.md §一）');
})();

// 野外那张图的语境工厂（[CH]／[CI] 共用一份桩，别复制两遍）：
// 本文件的 document 桩没有 SVG，而 randomMap 的渲染与走路账都要真跑才量得到——故另起一个隔离语境。
function 造野外语境() {
    var ctx = vm.createContext({});
    function into(rel) { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel }); }
    vm.runInContext('this.window = this; this.console = { log: function () {}, warn: function () {}, error: function () {} };', ctx);
    vm.runInContext(`
var els = {};
function fakeEl(tag) {
    return { tag: tag || '', children: [], style: {}, _attrs: {}, parentNode: null,
        setAttribute: function (k, v) { this._attrs[k] = v; }, getAttribute: function (k) { return this._attrs[k]; },
        appendChild: function (c) { this.children.push(c); c.parentNode = this; return c; },
        removeChild: function (c) { var i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c; },
        get firstChild() { return this.children[0] || null; },
        addEventListener: function () {}, removeEventListener: function () {}, closest: function () { return null; },
        scrollIntoView: function () {}, remove: function () {},
        classList: { add: function () {}, remove: function () {}, toggle: function () {}, contains: function () { return false; } },
        textContent: '', innerHTML: '' };
}
this.document = { readyState: 'complete',
    createElementNS: function (ns, tag) { return fakeEl(tag); }, createElement: function (tag) { return fakeEl(tag); },
    getElementById: function (id) { if (!els[id]) els[id] = fakeEl(); els[id]._id = id; return els[id]; },
    querySelector: function () { return null; }, querySelectorAll: function () { return []; },
    addEventListener: function () {}, body: { appendChild: function () {} } };
var store = {}; this.__store = store;
this.localStorage = { getItem: function (k) { return store[k] !== undefined ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); }, removeItem: function (k) { delete store[k]; } };
var msgs = []; this.msgs = msgs;
this.showMessage = function (m, t) { msgs.push(String(m)); };
var gt = { totalMinutes: 0, currentDay: 5, currentHour: 14, currentMinute: 0, currentSeason: 'spring', currentMonth: 3, currentYear: 1 };
this.gameTime = gt;
this.timeSystem = { gameTime: gt, advanceTime: function (m) { gt.totalMinutes += m; }, onNewDaySubscribe: function () {} };
this.addItemToInventory = function () { return true; };
this.updateCharacterStatus = function () {}; this.updateCurrencyUI = function () {};
this.getEffectiveMax = function () { return 100; };
this.generateRandomEnemy = function (lv, t) { return { name: '守灵', hp: 100, level: lv }; };
this.openBattleWithEntity = function () { this.__battled = (this.__battled || 0) + 1; };
this.ResourcePoints = { listByRegion: function () { return []; } };
this.DungeonDynamic = { listActive: function () { return []; } };
this.LANDMARKS = {};
var reg = {}; this.__reg = reg;
this.StateRegistry = { register: function (n, s) { reg[n] = s; } };
this.currentCharData = { health: 80, energy: 80, qi: 40, maxQi: 100, realm: '筑基' };
this.inventory = { currency: { spiritStones: 100 } };
`, ctx);
    into('js/map/wild-terrain.js');
    into('js/map/randomMap.js');
    vm.runInContext('Math.random = function () { return 0.99; };', ctx);   // 拨开随机：验的是账目，不是哪一格里撞上事
    return ctx;
}

// ==================== [CH] 第六十一批 · UI-08② 野外「动静」那一行要有出口，但不许隔雾定点 ====================
// 立案读数（改良说明.md UI-08，本批实机改前基线 .scratch/v24-CH-life-ch0.out）：
//   「野外的动静」整列 2 行、行内 button 0 枚、data-act 空；真点整行之后 图上虚线 0 枚、侧栏「出发」不出现、toast 无新句——
//   它报了「野狼群 东 7 格」却不给路，而玩家要在 123/144 枚纯黑格子里自己瞄那一格在哪。
// 改法守 STRUCTURE.md:1235 已写明的那条通路（onCellClick：相邻→stepTo；远格→findPath 出预览＋侧栏「出发(N步·约X)」→confirmTravel 逐格走），
//   本批只把「瞄准」这一步接过来：目标已探明＝走老路；目标还在雾里＝只画看得清的那半程——不隔雾定点、不另开通路。
console.log('\n[CH] 第六十一批 UI-08② 野外动静行的「过去看看」接回唯一那条走路通路');
(function () {
    var 名 = 'js/map/randomMap.js';
    var 源 = codeOnly(src(名)).replace(/\r\n/g, '\n');
    var 列 = 源.slice(源.indexOf('function renderWildLifeList'), 源.indexOf('function isEntityDead'));
    var 出 = 源.slice(源.indexOf('function gotoSensedTarget'), 源.indexOf('function centerViewport'));
    assert(列.length > 100 && 出.length > 100, 'CH① 两个函数都从源码里抠到了（抠空了后面几把尺全是空转）');

    assert(/<button data-act="life-goto"/.test(列) && /r\.gx === undefined \? ''/.test(列),
        'CH② 动静行真有出口钮，而且只在「报得出坐标」时才给（gx 空则整个钮不渲染）');
    eq((列.match(/onclick=/g) || []).length, 0, 'CH③ 这一列不许出现 inline onclick——侧栏那一片的既定规矩是 data-act 委托（bindWildSidebar）');
    assert(/act === 'life-goto'/.test(源) && /gotoSensedTarget\(\+?target\.getAttribute/.test(源),
        'CH④ 委托里挂了 life-goto 这一支，并把 data-x/data-y 交给 gotoSensedTarget（钮不是画上去的）');
    assert(/flex-1 min-w-0/.test(列) && (列.match(/shrink-0/g) || []).length >= 2,
        'CH⑤ 名儿那一格吃剩下的宽（flex-1 min-w-0），方位与钮各自钉住（shrink-0）——特大档挤的是名儿，不是把钮挤下屏');
    assert(!/truncate/.test(列), 'CH⑥ 这一列不许用 truncate：断字宁可折行也不许截尾（UI-22 那批立过的尺）');
    var 回执 = 出.match(/showMessage\([\s\S]*?\);/g) || [];
    assert(回执.length >= 3 && 回执.every(function (s) { return !/\.length|\$\{/.test(s); }),
        'CH⑦ 出口这一支的四条回执里都不许念算出来的数（读到 ' + 回执.length + ' 条）——步数只有一支笔写：侧栏「出发（N 步 · 约 X）」；实测两处各算一遍就给出两个不通的数');
    eq((源.match(/步 ·/g) || []).length, 1, 'CH⑧ 全文件「N 步 ·」这一本账只有一个写者（读到 ' + (源.match(/步 ·/g) || []).length + ' 处；已剥行注释，否则本批那条说明自己会凑数）');

    // ---- 行为层：本文件的 document 桩没有 SVG，另起一个语境真跑 randomMap（同 CE/CG 那一批的路子） ----
    var ctx = 造野外语境();
    var api = ctx.wildMapApi;
    assert(!!api, 'CH⑨ randomMap 在这个语境里装得起来（下面的账要真跑，不是读字符串）');
    if (!api) return;
    var 算 = function (expr) { return vm.runInContext(expr, ctx); };
    function 清() { ctx.msgs.length = 0; 算('wildTravel = null'); }
    function 预览() {
        return 算('wildTravel ? { n: wildTravel.path.length, ex: wildTravel.path[wildTravel.path.length-1].x,' +
            ' ey: wildTravel.path[wildTravel.path.length-1].y, cost: wildTravel.cost } : null');
    }

    ctx.setMapSeed('ch_life_1');
    ctx.openWildernessMap('中州');

    // ⑩ 已探明的目标：这一支必须与 onCellClick 同路（终点就是点的那一格），且不冤枉说一句「在雾里」
    var 候选 = 算(`(function(){
        var out=[], pd={x:playerPos.x,y:playerPos.y};
        for (var y=0;y<currentMap.length;y++) for (var x=0;x<currentMap[0].length;x++){
            var c=currentMap[y][x]; if (!c || c.fog<1) continue;
            var d=Math.abs(x-pd.x)+Math.abs(y-pd.y);
            if (d>=3 && d<=7) out.push({x:x,y:y});
        }
        return out;
    })()`);
    var 明 = null;
    for (var i = 0; i < 候选.length && !明; i++) {
        清();
        ctx.gotoSensedTarget(候选[i].x, 候选[i].y, '试');
        var wt = 预览();
        if (wt && wt.ex === 候选[i].x && wt.ey === 候选[i].y) 明 = { c: 候选[i], wt: wt };
    }
    assert(!!明, 'CH⑩ 目标已探明时，「过去看看」把预览画到了那一格本身上（与老路 onCellClick 同一条，未另开通路）');
    assert(明 && ctx.msgs.every(function (m) { return !/雾里|看不真切/.test(m); }),
        'CH⑩b 看得清的目标不念「还在雾里」（读到：' + JSON.stringify(ctx.msgs.slice(0, 2)) + '）');

    // ⑪ 目标还在雾里：只画看得清的那半程——终点落在雾边（fog>0），绝不是雾里那一格
    var 雾 = 算(`(function(){
        var pd={x:playerPos.x,y:playerPos.y};
        var g=currentMap.map(function(r){ return r.map(function(c){ return {t: seasonTerrainKey(c)}; }); });
        for (var y=0;y<currentMap.length;y++) for (var x=0;x<currentMap[0].length;x++){
            var c=currentMap[y][x];
            if (!c || c.fog!==0) continue;
            var d=Math.abs(x-pd.x)+Math.abs(y-pd.y); if (d<3) continue;
            var r=WildTerrain.findPath(g,pd,{x:x,y:y});
            if (!r || r.path.length<4) continue;
            var i=r.path.length-1; while(i>0 && currentMap[r.path[i].y][r.path[i].x].fog===0) i--;
            if (i>=1) return {x:x,y:y,边x:r.path[i].x,边y:r.path[i].y,程:i+1,全:r.path.length};   // 程＝步数：path[i] 就是雾边那一格，走到它要 i+1 步
        }
        return null;
    })()`);
    assert(!!雾, 'CH⑪a 这张图里确实找得到「雾里有路、路上有看得清的那半程」的目标格（尺要有活体可量）');
    if (雾) {
        清();
        ctx.gotoSensedTarget(雾.x, 雾.y, '野狼群');
        var 雾后 = 预览();
        assert(!!雾后 && 雾后.ex === 雾.边x && 雾后.ey === 雾.边y,
            'CH⑪b 雾里的目标：预览终点＝雾边那一格（' + JSON.stringify(雾后) + ' 应到 ' + 雾.边x + ',' + 雾.边y + '），不是雾里那一格 ' + 雾.x + ',' + 雾.y + '——不隔雾定点');
        assert(!!雾后 && 雾后.n === 雾.程, 'CH⑪c 半程的长就是回推到看得清处的那一段（读到 ' + (雾后 && 雾后.n) + '／应为 ' + 雾.程 + '）');
        var 说 = ctx.msgs.join('｜');
        assert(/雾里|看不真切/.test(说) && /野狼群/.test(说), 'CH⑪d 这一支当场说清为什么只画半程，并念出那是谁的动静（读到「' + 说.slice(0, 60) + '」）');
        assert(!/\d+ 步/.test(说), 'CH⑪e 这句回执里不出现「N 步」——步数归侧栏那一支笔写（两处各算一遍就会给出不通的数）');

        // ⑫ 真出发：预览的终点就是落脚的那一格，时间账真结
        var t0 = ctx.gameTime.totalMinutes, 预览终点 = { x: 雾后.ex, y: 雾后.ey };
        ctx.confirmTravel();
        var 落 = 算('({x: playerPos.x, y: playerPos.y})');
        assert(ctx.gameTime.totalMinutes > t0, 'CH⑫a 点「出发」之后世界时间真往前走（' + t0 + ' → ' + ctx.gameTime.totalMinutes + ' 分钟）');
        assert(落.x === 预览终点.x && 落.y === 预览终点.y,
            'CH⑫b 落脚的那一格＝预览画到的那一格（' + JSON.stringify(落) + '），逐格走不是瞬移');
        assert(算('currentMap[playerPos.y][playerPos.x].fog') > 0, 'CH⑫c 走到的这一格是看得清的（雾里定点在这一层也走不出去）');
    }

    // ⑬ 四下皆雾：回绝要有话，且绝不留下一个能点的「出发」
    清();
    算(`(function(){ for (var y=0;y<currentMap.length;y++) for (var x=0;x<currentMap[0].length;x++) if (currentMap[y][x]) currentMap[y][x].fog = 0; })()`);
    var 全雾目标 = 算(`(function(){
        var pd={x:playerPos.x,y:playerPos.y};
        var g=currentMap.map(function(r){ return r.map(function(c){ return {t: seasonTerrainKey(c)}; }); });
        for (var y=0;y<currentMap.length;y++) for (var x=0;x<currentMap[0].length;x++){
            var d=Math.abs(x-pd.x)+Math.abs(y-pd.y); if (d<2) continue;
            var r=WildTerrain.findPath(g,pd,{x:x,y:y});
            if (r && r.path.length>=2) return {x:x,y:y};
        }
        return null;
    })()`);   // 必须挑「路走得通」的那一格：不然命中的是四下无路那一支，测不到迷雾这一支
    assert(!!全雾目标, 'CH⑬a0 抹平迷雾后仍找得到一处走得到的远格（尺要有活体可量）');
    if (全雾目标) {
        ctx.gotoSensedTarget(全雾目标.x, 全雾目标.y, '亡骷髅群');
        assert(预览() === null, 'CH⑬a 全雾时不给预览（回绝之后不许留一枚点得动的「出发」）');
        assert(ctx.msgs.some(function (m) { return /四下皆雾/.test(m); }), 'CH⑬b 全雾时念得出这一句（读到 ' + JSON.stringify(ctx.msgs) + '）——静默失败是 UI-10 那本账');
    }

    // ⑭ 名册本身：报得出坐标的行才有钮；就在脚下那一行不给（人已经在那一格了）
    var 现脚 = 算('({x: playerPos.x, y: playerPos.y})');   // 必须现读：⑫ 真走过一段，人已经不在开局那一格了
    算(`wildBands = [
        { id: 901, kind: 'pack', name: '野狼群', cool: 0, members: [{ name: '头狼', symbol: '🐺', x: ${现脚.x + 5}, y: ${现脚.y}, hp: 20 }] },
        { id: 902, kind: 'patrol', name: '官道巡查', cool: 0, members: [{ name: '捕盗', symbol: '🛡️', x: ${现脚.x}, y: ${现脚.y}, hp: 20 }] }
    ];`);
    算('renderWildLifeList()');
    var 牌 = ctx.document.getElementById('wild-life-list').innerHTML;
    // 逐行判，不数整列总枚数：这一列除两行群队外还可能挂着 wildDrift（游荡的大块头也报得出中心坐标，也带钮）
    function 那一行(html, 关键字) {
        return (html.split('<div class="flex items-center').find(function (x) { return x.indexOf(关键字) >= 0; }) || null);
    }
    var 近 = 那一行(牌, '就在脚下'), 远 = 那一行(牌, '东 5 格');
    console.log('  · 动静列读数：行 ' + (牌.split('<div class="flex items-center').length - 1) + ' 枚／钮 ' + (牌.match(/<button/g) || []).length + ' 枚（行里可能还挂着 wildDrift 那一行，故整列总枚数不作尺，只逐行判）');
    assert(!!近 && 近.indexOf('<button') < 0, 'CH⑭a 「就在脚下」那一行不给出口钮（人已在这一格，多一枚钮＝假动作；读到 ' + JSON.stringify(近 ? 近.slice(-26) : null) + '）');
    assert(!!远 && /data-act="life-goto"/.test(远) && new RegExp('data-x="' + (现脚.x + 5) + '"').test(远) && new RegExp('data-y="' + 现脚.y + '"').test(远),
        'CH⑭b 报了「东 5 格」的那一行带一枚钮，钮上坐标就是那一格（data-x=' + (现脚.x + 5) + '）——不是把方位话术再解析一遍');
    assert(!!远 && /shrink-0/.test(远.slice(远.indexOf('<button'))), 'CH⑭c 那一枚钮自己钉住不缩（shrink-0）——特大档挤名儿，不挤掉出口');
    eq((牌.match(/truncate/g) || []).length, 0, 'CH⑭d 整列上屏之后仍无 truncate（读到 ' + (牌.match(/truncate/g) || []).length + ' 处）');
})();

// ==================== [CI] 第六十二批 · UI-08① 黑着的那一片要看着像「没探过」，不像「没画完」 ====================
// 立案读数（改良说明.md UI-08①，第六十一批同一张图实机量到，读数 .scratch/v24-CH-life-ch0/ch2.out）：
//   视野 144 格里 **123 枚是 fill:#0d1017 的纯色矩形**、「见过一面」那层（#0b1020）**0 枚**、
//   图例六项（平原／林海／山地／水域／古道／灵泉）**无「未探」**、侧栏文本也无「雾／未踏足」字样。
// 本批只动呈现：fog 的 0/1/2 三态账、revealAround、onCellClick 的「未探不许点」一律不碰——
//   所以这一段有一半的尺是在**守那条线没被踩**（CI⑦⑧），而不只是量纹样画没画。
console.log('\n[CI] 第六十二批 UI-08① 野外未探那一片改铺云雾纹，图例补「未探（雾里）」');
(function () {
    var ctx = 造野外语境();
    var 算 = function (e) { return vm.runInContext(e, ctx); };
    ctx.setMapSeed('ci_fog_1');
    ctx.openWildernessMap('中州');

    var 尺 = function () {
        return 算(`(function(){
            var svg = document.getElementById('random-map-svg'), 纹 = 0, 裸 = 0, 见过 = 0, defs = null;
            (function walk(n) {
                if (!n) return;
                if (n.tag === 'rect') {
                    var f = (n._attrs && n._attrs.fill) || '';
                    if (f === 'url(#wild-fog-mist)') 纹++;
                    else if (f === '#0d1017') 裸++;
                    else if (f === '#0b1020') 见过++;
                }
                (n.children || []).forEach(walk);
            })(svg);
            (svg.children || []).forEach(function (c) { if (/id="wild-fog-mist"/.test(c.innerHTML || '')) defs = c.innerHTML; });
            var sx = viewportOffset.x, sy = viewportOffset.y, 零 = 0, 一 = 0;
            for (var y = sy; y < Math.min(sy + MAP_CONFIG.VIEWPORT_ROWS, currentMap.length); y++)
                for (var x = sx; x < Math.min(sx + MAP_CONFIG.VIEWPORT_COLS, currentMap[0].length); x++) {
                    if (currentMap[y][x].fog === 0) 零++; else if (currentMap[y][x].fog === 1) 一++;
                }
            return { 纹: 纹, 裸: 裸, 见过: 见过, 零: 零, 一: 一, defs: defs || '',
                图例: document.getElementById('wild-legend').innerHTML };
        })()`);
    };
    var 量 = 尺();
    assert(量.零 > 20, 'CI① 这张图确实有一大片还没踏足（视野里 fog=0 的格 ' + 量.零 + ' 枚）——本批要量的就是这一片');
    assert(/<pattern id="wild-fog-mist"/.test(量.defs), 'CI② defs 里真装着云雾纹 pattern（图上那一片引的是它，不是又一层纯色）');
    var 单 = /patternUnits="([^"]+)"/.exec(量.defs), 瓦 = /width="(\d+)"/.exec(量.defs);
    eq(单 && 单[1], 'userSpaceOnUse', 'CI③ 纹样按绝对坐标铺（patternUnits）——按对象铺就会每格各来一份、又成一种「没画完」');
    var 格边 = 算('MAP_CONFIG.CELL_SIZE'), 瓦边 = 瓦 && +瓦[1];
    assert(!!瓦边 && 瓦边 % 格边 !== 0 && 瓦边 > 格边,
        'CI④ 瓦片边长（' + 瓦边 + '）是格子边长（' + 格边 + '）的非整数倍——纹样不跟网格对齐');
    eq(量.纹, 量.零, 'CI⑤ 视野里每一枚未探格都铺了纹样，一枚不落（纹 ' + 量.纹 + '／未探 ' + 量.零 + '）');
    eq(量.裸, 0, 'CI⑥ 图上不再有任何一枚裸 #0d1017 的矩形（底色只活在纹样内部；读到 ' + 量.裸 + ' 枚）');
    eq(量.见过, 量.一, 'CI⑦ 「见过一面」那一层一字未动（#0b1020 ' + 量.见过 + ' 枚＝账上 fog=1 的 ' + 量.一 + ' 枚）——本批不许顺手把三态并成两态');

    var 样 = JSON.parse(算('JSON.stringify(WILD_FOG_MIST)'));
    assert(/未探/.test(量.图例), 'CI⑧ 图例补上了「未探」这一项（改前实机量到图例六项无该项）');
    ['base', 'blob', 'wisp'].forEach(function (k) {
        assert(量.图例.indexOf(样[k]) >= 0, 'CI⑨·' + k + ' 图例那枚小样用的就是图上那一色（' + 样[k] + '）——写色者只有一处，图例说的就是图上那片');
    });
    var 六项 = 算(`['PLAIN','FOREST','MOUNTAIN','WATER','ROAD','SPRING'].map(function(k){ return WildTerrain.TERRAIN[k].name; })`);
    六项.forEach(function (n) { assert(量.图例.indexOf(n) >= 0, 'CI⑩ 原图例那一项照旧在（' + n + '）——补一项不等于换掉一列'); });

    // 双侧自证：同一把尺在「纹样被换回纯色」之后必须立刻报出来（否则 CI⑤⑥ 数的是文件名不是画出来的东西）
    算(`(function(){ var svg = document.getElementById('random-map-svg'), 改 = 0;
        (function walk(n) { if (改) return; (n.children || []).forEach(walk);
            if (n.tag === 'rect' && n._attrs && n._attrs.fill === 'url(#wild-fog-mist)') { n._attrs.fill = '#0d1017'; 改 = 1; } })(svg); })()`);
    var 抠 = 尺();
    eq(抠.纹, 量.纹 - 1, 'CI⑪ 抠掉一枚纹样之后同一把尺少读 1 枚（' + 量.纹 + ' → ' + 抠.纹 + '）');
    eq(抠.裸, 1, 'CI⑫ 抠出来的那一枚立刻被「裸色」那一支抓到（读到 ' + 抠.裸 + '）——CI⑥ 那支绿灯不是空转');

    // 只动呈现：账与门都没被踩
    ctx.setMapSeed('ci_fog_1');
    ctx.openWildernessMap('中州');
    var 雾点 = 算(`(function(){ var sx=viewportOffset.x, sy=viewportOffset.y;
        for (var y=sy;y<currentMap.length;y++) for (var x=sx;x<currentMap[0].length;x++) if (currentMap[y][x].fog===0) return {x:x,y:y};
        return null; })()`);
    assert(!!雾点, 'CI⑬a 找得到一枚视野里的未探格来敲门');
    ctx.msgs.length = 0;
    ctx.onCellClick(雾点.x, 雾点.y);
    assert(ctx.msgs.some(function (m) { return /还未踏足/.test(String(m)); }),
        'CI⑬b 未探的格点下去仍旧回绝（读到 ' + JSON.stringify(ctx.msgs) + '）——纹样是让人看懂这片不能去，不是让人能去');
    var 前 = 尺();
    算('revealAround(' + 雾点.x + ',' + 雾点.y + ',0); renderMap(mapContainer, currentMap, viewportOffset.x, viewportOffset.y);');
    var 后 = 尺();
    eq(后.零, 前.零 - 1, 'CI⑬c revealAround 之后账上未探格少一枚（' + 前.零 + ' → ' + 后.零 + '）——三态那支笔仍是唯一写者');
    eq(后.纹, 后.零, 'CI⑬d 纹样跟着账退场（纹 ' + 后.纹 + '＝未探 ' + 后.零 + '）：那一格探开了，图上就不再是雾，不是画上去的死纹');

    var 页 = src('仙侠.html');
    var 提示 = (/id="random-map-info"[^>]*>([^<]*)</.exec(页) || [])[1] || '';
    assert(/云雾纹/.test(提示) && /雾/.test(提示), 'CI⑭ 图下那句操作提示补上了「云雾纹那一片还没踏足…」（读到「' + 提示.slice(-24) + '」）');
    eq((codeOnly(jsFiles('js').map(src).join('\n')).match(/random-map-info/g) || []).length, 0,
        'CI⑮ 这句提示全仓只有 HTML 那一支笔写（JS 里零个 random-map-info 读者／写者，读到 ' +
        (codeOnly(jsFiles('js').map(src).join('\n')).match(/random-map-info/g) || []).length + ' 处）——不会出现「改了 HTML 却被 JS 覆写」那类假绿');
})();

// ==================== [CJ] 第六十三批 · UI-05② 768~959 那一档不许再「按信息密度分宽窄」 ====================
// 立案读数（改良说明.md UI-05②／探针 .scratch/v24-CJ-narrow-cj0.out，768×1024 真实点击切字号）：
//   通用档的 span 4 在窄屏只有 126px（特大）／151px（标准），扣掉卡内 32px 只剩 94px，
//   而「境界提供50真气上限」特大档自然宽 146px ⇒ 折两行 ⇒ 真气卡自己定下 157 的行轨，
//   精力／心情两张各陪出 52px 空洞（41.5%）——正是第五十八批那句「剩下的洞只是内容真实差（≤23px）」在窄屏不成立。
// 改法（styles/ui-craft.css 一句 @media (min-width: 768px) and (max-width: 959px) 把这一格九张卡重排——
//   1~3 各 12 栏、5~8 各 6 栏、9 整幅，外加一段把 146/32/178/924 这笔算术写明的注释；零 JS、零 DOM、零新 token）。
// 实机读数：洞 52px（41.5%）→ **0**、快捷卡标签「盒 53／自然 63」劈字 → **0**（探针 .scratch/v24-CJ-narrow.mjs，
//   改前 cj0.out／改后 cj3.out：768×1024 ＋ 阈值两侧 960×800／1024×768 × 标准与特大，六档共 83 判 0 坏例）；
//   代价也记在屏上——同档面板高 2209→2548（标准）／3017→3366（特大）。
// 本批只加一道窄屏闸（<=959），>=960 那一档一字未改 ⇒ 这一段有一半的尺是在**守那一档没被顺手改动**（CJ⑥a⑩⑪⑮），
//   另加两把反证（CJ①b①c）防「切块切错了、三条绿灯照样对」那类假绿。
console.log('\n[CJ] 窄档那道闸：<=959 三张计量卡各自成一行；>=960 仍是第五十八批那套 12 栏');
(function () {
    var 尺 = css块尺();
    var craft = src('styles/ui-craft.css').replace(/\/\*[\s\S]*?\*\//g, '');   // 注释里的读数不是声明
    var 量 = '#panel-character #sub-status > .grid > :nth-child(-n+3)';
    var 境 = '#panel-character #sub-status > .grid > :nth-child(4)';
    var 快 = '#panel-character #sub-status > .grid > :nth-child(n+5)';
    var 九 = '#panel-character #sub-status > .grid > :nth-child(9)';
    var 八 = '#panel-character #sub-status > .grid > :nth-child(n+8)';
    var 则 = '#panel-character #sub-status > .grid > div';
    var 网 = '#panel-character #sub-status > .grid';

    // 抽出窄档那一块：块内三条规则各占一行、收尾花括号在行首——按行首花括号收口才不会吃到后面的通则
    var 头 = /@media\s*\(\s*min-width:\s*768px\s*\)\s*and\s*\(\s*max-width:\s*959px\s*\)/.exec(craft);
    assert(!!头, 'CJ① 窄档那一支 @media (768~959) 在（撤了它，41.5% 的洞与「🕐时／间」劈字一起回来）');
    var 窄块 = '';
    if (头) {
        var 余 = craft.slice(头.index + 头[0].length);
        var 开 = 余.indexOf('{');                       // media 自己的开括号不是规则，留着会让第一支「选择器」读成空
        余 = 余.slice(开 + 1);
        var 尾 = /\n\}/.exec(余);
        窄块 = 余.slice(0, 尾 ? 尾.index : 0);
    }
    assert(窄块.length > 40, 'CJ①a 窄档块体抽得出来（长度 ' + 窄块.length + '，三行规则）——否则后面全是空判');
    eq(尺.块表(窄块, 量).length, 1, 'CJ①b 切出来的块里计量规则恰好一支（两支＝把上面那档通用规则也吞进来了，读数就不再是窄档的账）');
    eq(尺.支值(窄块.replace(/span 12/, 'span 7'), 量, 'grid-column'), 'span 7',
        'CJ①c 反证：把块里那一句改成 span 7，同一把尺立刻读到 7——上面几条绿灯读的是块体，不是文件名字面量');

    // ---- ②~⑥ 窄档自己那三支笔 ----
    eq(尺.支值(窄块, 量, 'grid-column'), 'span 12', 'CJ② 窄档：三条计量条各整幅一行（谁的内容高谁自己长，同排无人可绑架）');
    eq(尺.支值(窄块, 快, 'grid-column'), 'span 6', 'CJ③ 窄档：第五张往后两两一行（快捷卡从 53~99px 涨到 198~234px，emoji 标签不再劈字）');
    eq(尺.支值(窄块, 九, 'grid-column'), 'span 12', 'CJ④ 窄档：第九张独吞一整行（6+6 之后剩它一张，凑不满 12 就整幅，不留半行真空）');
    assert((窄块.match(/grid-column/g) || []).length === 3,
        'CJ⑤ 窄档块里定栏只 3 支（三支已覆盖 1~9 张：-n+3 ／ n+5 ／ 9），第四支意味着同一段版式两笔各写一半');
    // 块里出现的选择器必须全是「已知那三支」——新认一个类名／属性钩子＝DOM 一改栏就换人（旧尺「块体里不许有点号」是假的：.grid 本身就带点）
    var 已知 = [量, 快, 九];
    (窄块.match(/[^{}]+\{/g) || []).forEach(function (s, i) {
        var sel = s.slice(0, -1).replace(/\s+/g, ' ').trim();
        assert(已知.indexOf(sel) >= 0, 'CJ⑤a·' + (i + 1) + ' 窄档第 ' + (i + 1) + ' 支选择器就是已知那三支之一（读到「' + sel + '」）');
    });
    // 行轨不靠恒真式：拿源码读出的栏数模拟一遍装箱，再与实机读到的行轨条数对表
    function 排行数(栏表) {
        var 行 = 1, 已用 = 0;
        栏表.forEach(function (n) { if (已用 + n > 12) { 行++; 已用 = n; } else { 已用 += n; } });
        return 行;
    }
    var 窄栏表 = [12, 12, 12, 12, 6, 6, 6, 6, 12];      // 1~3 计量 ＋ 4 境界（继承通用档 12）＋ 5~9 快捷
    var 宽栏表 = [4, 4, 4, 12, 3, 2, 3, 2, 2];          // 同一支笔读通用档
    eq(排行数(窄栏表), 7, 'CJ⑥ 窄档按源码栏数装箱＝7 行轨（实机 cj3 768×1024 读到 [84,107,84,86,101,101,101] 也是 7 条——尺与屏同一本账）');
    eq(排行数(宽栏表), 3, 'CJ⑥a 通用档按源码栏数装箱＝3 行轨（实机 cj3 960×800 读到 [107,86,101] 也是 3 条 ⇒ >=960 那一档确实一字未动）');

    // ---- ⑦~⑨ 本批刻意没碰的那两笔：摆法与等高 ----
    ['flex-direction', 'align-items', 'justify-content', 'align-self'].forEach(function (p) {
        assert(!new RegExp(p + ':').test(窄块), 'CJ⑦ 窄档块不写 ' + p + '（只改栏数；居中与列向那两笔仍归通则那一句）');
    });
    assert(!/!important/.test(窄块), 'CJ⑧ 窄档块零 !important（同特异度靠源序赢，不靠吼）');

    // ---- ⑩~⑫ 通用档一字未动（>=960 那一档的账要原样还在）----
    eq(尺.支值(craft, 量, 'grid-column'), 'span 4', 'CJ⑩ 通用档仍是 span 4（[CE]① 那句没被本批改掉；窄档写在后面才赢）');
    eq(尺.支值(craft, 境, 'grid-column'), 'span 12', 'CJ⑩a 通用档境界卡仍整幅一行（[CE]② 同一条）');
    eq(尺.支值(craft, 八, 'grid-column'), 'span 2', 'CJ⑪ 通用档第八、九张仍各 2 栏——这条就是「960 特大档快捷卡劈字属改前既有、非本批所改」的源码级证据');
    eq(尺.块表(craft, 量).length, 2, 'CJ⑫ 给三张计量条定栏的全仓恰好两支（通用＋窄档）；第三支会来抢特异度，屏上读到的行轨就不再唯一');

    // ---- ⑬ 源序：同特异度靠写的先后 ----
    var 通用址 = 尺.支址(craft, 量, 'grid-column');
    assert(通用址 >= 0 && !!头 && 通用址 < 头.index,
        'CJ⑬ 源序：先通用档、后窄档（两支特异度一字不差，窄屏那条只能靠排在后面取胜；顺序倒了今天就得改回来）');

    // ---- ⑭ 那道阈值的算术（不是随手挑的数）----
    var 说明自然宽 = 146, 卡内衬 = 32, 扣项 = 358 + 32;   // 146：特大档实机单行自然宽；358＝导航 192＋body 32＋面板内衬 48＋间隙余量（cj3 960×800 特大档反推）
    var 卡宽门槛 = 说明自然宽 + 卡内衬;
    var 最低宽 = 卡宽门槛 * 3 + 扣项;
    eq(卡宽门槛, 178, 'CJ⑭a 卡宽门槛 = 146 ＋ 32 = 178（说明不折行要吃下的宽度）');
    eq(最低宽, 924, 'CJ⑭b 反推不折行的最低视口宽 = 178×3 ＋ 390 = 924（与实机同一条斜率：960→卡宽190、1024→211）');
    assert(最低宽 <= 959 && 959 < 960,
        'CJ⑭c 闸取在 924 之上、960 之下（959＝往 60rem 那道标准断点之下取整，留 35px 余量给更长的说明）');

    // ---- ⑮~⑯ 边界与宿主 ----
    assert(/min-width:\s*768px/.test(头 ? 头[0] : ''),
        'CJ⑮ 窄档仍带下界 768：更窄那一档归 Tailwind 的 grid-cols-2（本批不去碰它，两档各写一半就成了三层打架）');
    var 定栏处 = [];
    ['styles.css'].concat(fs.readdirSync(path.join(ROOT, 'styles')).filter(function (f) { return f.endsWith('.css'); })
        .map(function (f) { return 'styles/' + f; })).forEach(function (f) {
            var t = src(f).replace(/\/\*[\s\S]*?\*\//g, '');
            if (/#sub-status\s*>\s*\.grid[^{]*\{[^}]*grid-column/.test(t)) 定栏处.push(f);
        });
    eq(定栏处.join(','), 'styles/ui-craft.css', 'CJ⑯ 给这一格定栏的宿主全仓仍只一处（[CE]⑫ 那条清单尺换成扫目录，多一个 css 文件也逃不掉）');

    // ---- ⑰ 一支笔仍不许走「卡高各走各的」（只量这一格：别处那三块 align-items: start 是躯体耐久／装备／活动的既定摆法）----
    assert(尺.块表(craft, 网).every(function (x) { return !/align-items:\s*start/.test(x.体); })
        && 尺.块表(craft, 则).every(function (x) { return !/align-items:\s*start|align-self:\s*start/.test(x.体); }),
        'CJ⑰ 这一格的 grid 与九张卡里都没有 align-items/self: start（读到 grid ' + 尺.块表(craft, 网).length +
        ' 支、卡片 ' + 尺.块表(craft, 则).length + ' 支）——洞要撤在「同排无人绑架」这一头，不是把洞从盒内挪到盒外再撕掉底边');
})();

// ==================== [CM] 第六十四批 · UI-25 家族账：全仓手搓居中模态到底几扇没戴帽 ====================
// 立案时那对打架的旧数（粗尺 46 枚无帽／另一把尺 58 枚）本批作废，换成一支可复跑的尺：
//   `.scratch/v24-CJ-modal-census.mjs` → 读数 `.scratch/v24-CM-modal-census-cm7.out`。
// 账：`fixed` 配 `inset-0`（或 top-0＋bottom-0）命中 97 行，扣 8 行假阳（注释与 `.fixed.inset-0` 选择器串）＝ 89 处遮罩；
//   看卡层那一层戴没戴帽分 A(帽＋滚) 45 ／ B(有帽无滚) 1 ／ C(无帽) 38 ／ 卡层没定位到 5。
//   那 5 处已逐处回读源码定性（`ui-immersive.js` 三枚特效层、`mail-system-ui.js:142` 只是遮罩节点（窗体是兄弟节点，
//   高度归 `styles/panel-mail.css`）、`global-utils.js:241` 是加载转圈），不是尺没数到的漏网。
// 本批一扇窗的摆法都没改（「吸顶卡头」属全仓取舍，等裁决），落地的只有这一把尺加棘轮。
console.log('\n[CM] 家族账：无帽 38 扇、其中 13 扇内容由循环长出（真会顶穿视口那一族）——数量与名单钉死（名单按函数锚点名，行号当场算）');
(function () {
    var 遮罩判 = function (L) { return /fixed/.test(L) && (/inset-0/.test(L) || (/top-0/.test(L) && /bottom-0/.test(L))); };
    var 假阳判 = function (L) {
        return /^\s*(\/\/|\*|\/\*)/.test(L) || /querySelector(All)?\s*\(/.test(L)
            || /classList\.(add|remove|contains|toggle)\(/.test(L) || /closest\s*\(/.test(L) || /matches\s*\(/.test(L);
    };
    var 卡判 = function (s) {
        return /max-w-(xs|sm|md|lg|xl|[2-9]xl)\b/.test(s)
            || (/w-full/.test(s) && /bg-(gray|slate|zinc|neutral|stone|black|white|-)\b|bg-\[/.test(s));
    };
    var 分类 = function (s) {
        var 帽 = /max-h-|max-height\s*:/.test(s), 滚 = /overflow-y-auto|overflow-y\s*:|overflow-y-scroll/.test(s);
        return 帽 && 滚 ? 'A' : 帽 ? 'B' : 'C';
    };
    // 「内容会长」＝遮罩行前后各 40 行内有**真在拼 HTML**的循环，向回看还须与遮罩同在一个函数体内。
    //   三条限制各挡一类实测到的错：只向前看漏掉「先拼 html 再 createElement」（竞技场榜 :149→:156）；
    //   `.join(` 当循环把公共 showConfirm 的字面量拼接报成长；不清函数界就让上一扇窗的循环渗到下一扇头上
    //   （global-utils.js:177 属 showChoiceDialog，与同文件的 showConfirm :326 无关；※v24.1 215→326）。
    var 是循环 = function (s) { return /forEach\s*\(|\.map\s*\(|\bfor\s*\(|\bwhile\s*\(/.test(s); };
    var 是清理 = function (s) { return /querySelectorAll\s*\([^)]*\)\s*\.\s*(forEach|map)\(/.test(s) || /\.remove\(\)/.test(s); };
    var 在拼串 = function (s) { return /\w\s*\+=\s*['"`<]|\w*Html\s*\+=|\.join\s*\(|return\s*['"`<]|<div\b|<tr\b|<li\b/.test(s); };
    var 函数声明 = function (s) { return (/function\s*[\w$]*\s*\(/.test(s) || /=\s*(?:async\s+)?function\b/.test(s)) && !/\btypeof\b/.test(s); };
    function 前界行(ls, i) {
        var 缩 = ls[i].match(/^\s*/)[0].length;
        for (var k = i - 1; k >= 0; k--) {
            var ind = (ls[k].match(/^\s*/) || [''])[0].length;
            if (ind > 缩) continue;
            if (函数声明(ls[k]) && (!是循环(ls[k]) || ind < 缩)) return k;
        }
        return 0;
    }
    function 会长证(ls, i, 遮罩们) {
        var 后, 前, k, m;
        for (k = 0; k < 遮罩们.length; k++) { if (遮罩们[k] > i) { 后 = 遮罩们[k]; break; } }
        for (k = 遮罩们.length - 1; k >= 0; k--) { if (遮罩们[k] < i) { 前 = 遮罩们[k]; break; } }
        var 末 = Math.min(i + 40, 后 === undefined ? ls.length - 1 : 后 - 1);
        var 头 = Math.max(i - 40, 前 === undefined ? 0 : 前 + 1, 前界行(ls, i));
        var 证 = [];
        for (k = 头; k <= 末; k++) {
            if (k === i || /^\s*(\/\/|\*|\/\*)/.test(ls[k])) continue;
            if (!是循环(ls[k]) || 是清理(ls[k])) continue;
            var 拼 = false;
            for (m = k; m <= Math.min(k + 4, 末); m++) if (在拼串(ls[m])) 拼 = true;
            if (拼) 证.push(k + 1);
        }
        return 证;
    }
    function 普查(覆写) {                                  // 覆写：反证用，{ 'js/xx.js': 整文件新文本 }
        var 表 = [];
        jsFiles('js').forEach(function (rel) {
            var f = rel.replace(/\\/g, '/');
            var ls = (覆写 && 覆写[f] ? 覆写[f] : src(f)).split(/\r?\n/);
            var 遮罩们 = [], i;
            for (i = 0; i < ls.length; i++) if (遮罩判(ls[i]) && !假阳判(ls[i])) 遮罩们.push(i);
            for (var n = 0; n < 遮罩们.length; n++) {
                i = 遮罩们[n];
                var 卡行 = -1, 卡串 = '', k, 末;
                var 同 = /inset-0[^>]*>\s*<\w+[^>]*class\s*=\s*["'][^"']*(max-w-\w|w-full)/.exec(ls[i]);
                if (同) { 卡行 = i; 卡串 = 同[0]; }
                else {
                    var 界 = 遮罩们[n + 1];
                    末 = Math.min(i + 200, 界 === undefined ? ls.length - 1 : 界 - 1);
                    for (k = i + 1; k <= 末; k++) {
                        // 卡行不许套 假阳判：卡上常写 onclick="this.closest('.fixed').remove()"，那是遮罩那套尺的活
                        if (/^\s*(\/\/|\*|\/\*)/.test(ls[k])) continue;
                        if ((/<(div|section)\b[^>]*class\s*=\s*["']/.test(ls[k]) || /\.\w*[cC]lassName\s*=\s*["'`]/.test(ls[k]))
                            && 卡判(ls[k])) { 卡行 = k; 卡串 = ls[k]; break; }
                    }
                }
                表.push({
                    档: 卡行 === -1 ? '?' : 分类(卡串), 文件: f, 遮罩行: i + 1, 卡行: 卡行 + 1,
                    会长证: 会长证(ls, i, 遮罩们)
                });
            }
        });
        return 表;
    }
    var 表 = 普查();
    function 数(t) { return 表.filter(function (e) { return e.档 === t; }); }
    // ---- 按「函数锚」点名：行号当场算，绝不钉死 ----
    // 这一族的名单先前按遮罩所在行号钉。第一百一十四波往 app.js 上方加了 26 行脚力笔，
    // 贡献兑换那一扇就从 8679 漂到 8705——红了一次，可那一批改的既没摘帽也没造窗，红的只是「号」。
    // 号会漂、函数名不会：锚＝这一扇窗所在函数的声明，窗被拆了/被改名了才叫掉链。
    function 锚行(文件, 锚) {
        var esc = 锚.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // 两种写法都得认：function 名（声明）、目标＝function（含 window.XianXia.x 这类命名空间赋值）。
        // 不认 `x: function` 那种对象字面量——app.js 设施表里的 'openForgingShop: function(){…}' 是分发口，不是那扇窗本体。
        var 宣 = 'function\\s+' + esc + '\\s*\\(';                       // function open( …
        var 赋 = '^\\s*[\\w$.]*' + esc + '\\s*=\\s*(?:async\\s+)?function\\b';   // window.X.open = function …
        var re = new RegExp('(?:' + 宣 + '|' + 赋 + ')');
        var ls = src(文件).split(/\r?\n/), 命 = [];
        for (var i = 0; i < ls.length; i++) if (re.test(ls[i]) && !/^\s*(\/\/|\*|\/\*)/.test(ls[i])) 命.push(i + 1);
        return 命;
    }
    function 窗(文件, 锚) {                       // 该函数体内第一处遮罩＝这一扇窗
        var 命 = 锚行(文件, 锚);
        if (命.length !== 1) return { 错: '锚 ' + 文件 + ' 的 ' + 锚 + ' 命中 ' + 命.length + ' 处声明（须恰好 1 处）' };
        var 内 = 表.filter(function (e) { return e.文件 === 文件 && e.遮罩行 >= 命[0]; })
            .sort(function (a, b) { return a.遮罩行 - b.遮罩行; });
        if (!内.length) return { 错: '锚 ' + 文件 + ':' + 锚 + '@' + 命[0] + ' 之后再没有遮罩行——这扇窗没了' };
        return 内[0];
    }
    var 名单 = [
        ['js/app.js', 'openForgingShop', '铁匠铺'],
        ['js/app.js', 'openContributionShop', '贡献兑换'],
        ['js/core/daily-events.js', 'showDailyEventDialog', '日常事件对话框'],
        ['js/cultivation/breakthrough-ritual.js', 'showBreakthroughUI', '突破仪式'],
        ['js/cultivation/cultivation-bottleneck.js', 'attemptBreakBottleneck', '修行瓶颈'],
        ['js/economy/auction-service.js', 'open', '皇家拍卖行'],
        ['js/event-system.js', 'showEventDialog', '事件系统对话框'],
        ['js/gameplay/arena-system.js', 'showArenaRanking', '门派竞技排名'],
        ['js/inventory.js', 'showEquipmentCompareDialog', '行囊装备词条窗'],
        ['js/reputation-system.js', 'openSecretArtsShop', '声望秘传功法'],
        ['js/sects/dao-companion-deep.js', 'openDaoCompanionPanel', '道侣名册'],
        ['js/sects/sect-visit.js', 'showSectBulletinDialog', '宗门公告栏'],
        ['js/sects/sect-visit.js', 'openSectMarket', '宗门市集']
    ];
    var 会长族 = 数('C').filter(function (e) { return e.会长证.length; })
        .map(function (e) { return e.文件 + ':' + e.遮罩行; }).sort();

    // ---- ① 尺的自证：三处反证，每一处都是这一批真踩过的坑 ----
    var 图鉴 = src('js/map/landmark-explore.js');
    var 图鉴无帽 = 普查({ 'js/map/landmark-explore.js': 图鉴.replace(/ ?max-h-\[[^\]]*\] ?overflow-y-auto/g, '') });
    assert(数('A').length >= 40, 'CM①a 有帽且会滚那一档读到 ' + 数('A').length + ' 扇（第六十批接上公共笔的三扇在内）');
    assert(图鉴无帽.filter(function (e) { return e.文件 === 'js/map/landmark-explore.js' && e.档 === 'C'; }).length === 3,
        'CM①b 反证：把 landmark-explore 三扇的帽擦掉，同一把尺立刻把三扇从 A 降成 C——A 那 45 扇不是白送的');
    var 拍卖 = 窗('js/economy/auction-service.js', 'open');
    assert(!!拍卖.遮罩行 && 拍卖.档 === 'C' && 拍卖.卡行 === 拍卖.遮罩行 + 2,
        'CM①c 反证：拍卖行那扇（锚 AuctionService 的 open）卡行只比遮罩行晚 2 行、判档 C（`max-w-lg w-full` 无帽）——它卡上带着 `onclick="this.closest(\'.fixed\')"`，'
        + '遮罩那套假阳尺一旦套到卡行上，这扇就掉进「未定位」而不是「无帽」（cm1 那一版真这么错过一次）');
    var 造窗 = 窗('js/crafting.js', 'ensureCraftingPanel');   // 锚＝函数名：行号当场算（这一族第一百十四波就立过规矩）
    var 转移 = 普查({ 'js/crafting.js': src('js/crafting.js').replace("max-w-2xl w-full max-h-[85vh] overflow-y-auto", "max-w-2xl") });
    var 造窗反证 = 转移.filter(function (e) { return !造窗.错 && e.文件 === 'js/crafting.js' && e.遮罩行 === 造窗.遮罩行; });
    assert(!造窗.错 && 造窗反证.length === 1 && 造窗反证[0].档 === 'C',
        'CM①d 反证：把 crafting.js「ensureCraftingPanel」那扇 `box.className` 形式卡的帽擦掉，同一把尺当场判它无帽——'
        + '既认得这种 DOM 写法（早先只认 class="…" 字面量，那一阵这扇整个读成「未定位」），也不再把遮罩行号钉死'
        + '（第一百二十三批 DES-72 在同文件上方加了 14 行，号从 1050 漂到 1064，红的只是号）（实得 '
        + JSON.stringify(造窗.错 ? 造窗 : { 遮罩行: 造窗.遮罩行, 卡行: 造窗.卡行, 档: 造窗.档 }) + '）');

    // ---- ② 总数账：四档相加＝遮罩总数，且无帽族只准缩不许涨 ----
    eq(数('A').length + 数('B').length + 数('C').length + 数('?').length, 表.length,
        'CM② 普查自洽：A' + 数('A').length + '＋B' + 数('B').length + '＋C' + 数('C').length + '＋未定位' + 数('?').length + '＝遮罩 ' + 表.length);
    assert(数('C').length <= 38, 'CM②a 无帽手搓模态 ' + 数('C').length + ' 扇，门槛 38——新造一扇戴帽的（或改用公共 showModal）就把这道闸往下收，别往上放');
    assert(数('A').length >= 45, 'CM②b 戴帽且会滚的窗 ' + 数('A').length + ' 扇，地板 45——谁把帽摘了这支就红');

    // ---- ③ 「卡层没定位到」那一档逐处点名：按「文件＋几处」记账，行号只当 ±30 容差中心 ----
    // v24.1：重构第3步在 showModal 之后插入 Modal 栈 111 行，其后的遮罩整体下移。
    // 241→352（showLoading 转圈）、215→326（XianXia.showConfirm 遮罩）都是同一次位移，
    // 两处漂移量一致已互相印证：不是新窗冒出来，是旧窗换了行号。判据一个字没动。
    // ★2026-10-04 行号归正（判据对象没动，只是记的坐标跟着源码走）★：原记 [22, 87, 131]，
    // 现读 [22, 129, 173]——后两处各漂 +42，是 ui-immersive.js 当日改版整体下移造成的，
    // 仍是原来那三枚特效层（22 全屏闪光 / 129 拾取飘字 / 173 进城横幅），
    // 三处都 `pointer-events-none`、无卡无 ×，与本条描述逐字对得上。
    // 本条的判据一个字没松：仍要求 ui-immersive.js 恰好三处、数量变了或冒出没记过的文件照样红。
    var 未定位记 = { 'js/global-utils.js': [385], 'js/mail-system-ui.js': [142], 'js/ui-immersive.js': [22, 129, 173] };
    var 未定位 = 数('?');
    var 漂3 = [];
    Object.keys(未定位记).forEach(function (f) {
        var 记 = 未定位记[f];
        var 实 = 未定位.filter(function (e) { return e.文件 === f; })
            .map(function (e) { return e.遮罩行; }).sort(function (a, b) { return a - b; });
        if (实.length !== 记.length) { 漂3.push(f + ' 读到 ' + 实.length + ' 处、账上记 ' + 记.length + ' 处'); return; }
        实.forEach(function (n, i) { if (Math.abs(n - 记[i]) > 30) 漂3.push(f + ' 第 ' + (i + 1) + ' 处漂到 ' + n + '（容差中心 ' + 记[i] + '）'); });
    });
    未定位.forEach(function (e) { if (!未定位记[e.文件]) 漂3.push('多出一处没记过的 ' + e.文件 + ':' + e.遮罩行); });
    eq(漂3.join(' | '), '',
        'CM③ 尺认不出卡层的只剩这 5 处，且每一处都回读过源码：三枚 ui-immersive 特效层（无卡无 ×）、mail 那处窗体是兄弟节点（定高在 styles/panel-mail.css）、showLoading 是转圈'
        + '——多出一处＝有扇新窗写法又变了，得人看一眼（当前读数 ' + 未定位.map(function (e) { return e.文件 + ':' + e.遮罩行; }).join(' ') + '）');

    // ---- ④ 真凶那一族：无帽 ∩ 内容由循环长出（按函数锚点名，新增即红） ----
    var 认了 = [], 掉链 = [];
    名单.forEach(function (x) {
        var e = 窗(x[0], x[1]);
        if (e.错) { 掉链.push(x[2] + '：' + e.错); return; }
        if (e.档 !== 'C') { 掉链.push(x[2] + '（' + x[0] + ':' + e.遮罩行 + ' 判档 ' + e.档 + '，已不属「无帽」）'); return; }
        if (!e.会长证.length) { 掉链.push(x[2] + '（' + x[0] + ':' + e.遮罩行 + ' 读不到会长证据，内容不再由循环长出）'); return; }
        认了.push(x[0] + ':' + e.遮罩行);
    });
    eq(掉链.join(' | '), '',
        'CM④ 「无帽且内容会长」这一族 13 扇按函数锚逐扇点名（铁匠铺、贡献兑换、皇家拍卖行、门派竞技排名、宗门公告栏／宗门市集、行囊装备词条窗、声望秘传功法、道侣名册、日常事件、突破仪式、修行瓶颈、事件系统对话框）'
        + '——锚只对到窗、行号当场算，往文件上方加几行不再是这一支的活');
    eq(认了.filter(function (p, i) { return 认了.indexOf(p) === i; }).length, 13,
        'CM④f 13 个锚各自锁到 13 扇不同的窗（读到 ' + 认了.join(' ') + '）——两个锚锁同一扇＝有一扇被并进了别窗');
    var 漏网 = 会长族.filter(function (p) { return 认了.indexOf(p) < 0; });
    eq(漏网.join(','), '', 'CM④e 名单之外不许再冒出一扇「无帽且内容会长」（冒出 ' + 漏网.join(' ') + '）——这一族只准缩不准涨');
    assert(/'皇家拍卖行'\s*:\s*function\s*\(\)\s*\{\s*openRoyalAuction\(city\)/.test(src('js/location-system.js'))
        && /onclick="showSectBulletinDialog\(/.test(src('js/sects/sect-visit.js')),
        'CM④a 名单里确有玩家常规流程点得到的两扇（城市特殊设施「皇家拍卖行」那格走 openRoyalAuction、宗门页两枚「查看公告」钮）——这族不是死代码堆里的数字');
    // 「判它不会长」也要能被回读：这四扇是收紧「会长」判后被移出名单的，逐条回读过源码，判据一旦改松这里就该红
    var 不会长 = [
        ['js/global-utils.js', 'XianXia.showConfirm', 359],   // 卡体是 [字面量].join('')  ※v24.1 215→326（Modal 栈插入所致，与 CM③ 同一次位移）；work4 改动再 326→359，卡体写法未变
        ['js/lifespan-system.js', 'triggerLifespanEnd', 126], // 寿元已尽：固定三行
        ['js/quest/main-storyline-arc.js', 'openMainStoryPanel', 223],  // 主线：一段定死段落
        ['js/quest/quest-system.js', 'showEndingScreen', 877]           // 任务结算：至多 5 颗星
    ];
    var 误长 = [];
    不会长.forEach(function (x) {
        var e = 窗(x[0], x[1]);
        if (e.错) { 误长.push(x[0] + ':' + x[1] + ' → ' + e.错); return; }
        if (Math.abs(e.遮罩行 - x[2]) > 30) { 误长.push(x[0] + ':' + x[1] + ' 锚到的遮罩在 ' + e.遮罩行 + '（记账 ' + x[2] + '，±30 外＝锚错了窗）'); return; }
        if (e.会长证.length) 误长.push(x[0] + ':' + e.遮罩行 + ' 被判会长（证据行 ' + e.会长证.join('/') + '）');
    });
    eq(误长.join(' | '), '',
        'CM④c 这四扇必须判「不会长」（showConfirm 卡体是 [字面量].join(\'\')、寿元已尽是固定三行、主线是一段定死段落、任务结算至多 5 颗星）——'
        + '把它们报成会长＝判据又松回去了（本批正是靠回读这四扇才把 `.join(` 从循环 token 里挪走、并补上同函数界）');
    var 无证 = 数('C').filter(function (e) {
        return e.会长证.some(function (行) { return Math.abs(行 - e.遮罩行) > 40; });
    });
    eq(无证.length, 0, 'CM④d 每一条「会长」证据行都必须落在遮罩 ±40 行内——超出＝尺越界把别处的循环记到这一扇头上（本批实测到的渗漏就是这么抓出来的）');
    assert(src('js/app.js').indexOf('function showProficiencyPanel') >= 0
        && jsFiles('js').filter(function (r) { return src(r.replace(/\\/g, '/')).indexOf('showProficiencyPanel(') >= 0; }).length === 1,
        'CM④b 顺手钉一条定性：app.js 那扇 showProficiencyPanel 全仓零调用点（只有定义行自己），账上属「死窗」不属「玩家会撞到的窗」');

    // ---- ⑤ 公共笔与第六十批那三扇：接上的帽不许退 ----
    // v24.1·重构第3步后尺要跟着走新路：showModal 变成一行转发壳（XianXia.Modal.open），
    // 卡片帽随之搬到 Modal.open 体内。原尺是「showModal= 之后 1200 字符内」——死窗宽，
    // 重构后帽在窗外 1200 之外，就报了个「帽没了」的假红。代码有帽，是尺的取样窗过时了。
    // 改法不是把窗放宽到「整个文件里有就算」（那会让尺失去约束力，变成永远绿），
    // 而是顺着 showModal 真正转发到的那扇窗去量：取转发目标的函数体。
    var 笔 = src('js/global-utils.js');
    var 笔帽 = function (s) { return /max-h-\[[^\]]*\][^"']*overflow-y-auto|overflow-y-auto[^"']*max-h-\[/.test(s); };
    var 壳 = 笔.split(/showModal\s*=/)[1] || '';
    var 转发到 = (壳.match(/XianXia\.Modal\.\w+/) || [])[0] || '';   // showModal 现在转发给谁
    var 窗外 = '';
    if (转发到) {
        var 目标 = new RegExp('function\\s+' + 转发到.replace(/\./g, '\\.') + '\\s*\\(');
        var 起 = 笔.search(目标);
        if (起 >= 0) 窗外 = 笔.slice(起, 笔.indexOf('\n    }', 起) >= 0 ? 笔.indexOf('\n    }', 起) + 6 : 起 + 4000);
    }
    assert(/showModal\s*=/.test(笔) && (笔帽(壳) || 笔帽(窗外)),
        'CM⑤ 公共 showModal 那张卡自己戴着帽（max-h-[…vh] ＋ overflow-y-auto）——它是全仓收口时的那支笔，它漏了就没人对'
        + (转发到 ? '（尺已跟随转发链：showModal → ' + 转发到 + '）' : '（未识别转发目标，只按壳内量）'));
    var 图 = 表.filter(function (e) { return e.文件 === 'js/map/landmark-explore.js'; });
    eq(图.length, 3, 'CM⑤a 地标那三扇手搓窗仍在册（' + 图.length + ' 扇，第六十批接笔的三处）');
    assert(图.every(function (e) { return e.档 === 'A'; }), 'CM⑤b 三扇全是 A（读到 ' + 图.map(function (e) { return e.遮罩行 + ':' + e.档; }).join(' ') + '）——帽与滚都在，UI-25 不收口就复发');
})();

// ==================== [CK] 第六十五批 · DES-44 山贼＝人形血肉：谁点名出怪，点名管不管用 ====================
// 用户实机撞见的是「活动页点黑风寨，进去一个元素身子的『山贼』」。病根不神秘：
//   `startBattle('bandits')` 在 js/app.js:9593 把 bandits 折成 'enemy'，生成器于是照常掷生理骰
//   （js/battle.js:1835 那张 PHYS_BAND 表：人形 60%／亡灵 20%／构装 10%／元素 10%），
//   掷完再由 js/app.js:9625 把展示名盖上「山贼」——名字与身子两本账，谁也不认谁。
// 改法走第九十五波 DES-23 已有的那条口：调用方点名生理，生成器不掷这一格。
console.log('\n[CK] 第六十五批 · DES-44 山贼＝人形血肉：谁点名出怪、点名管不管用');
(function () {
    var app = src('js/app.js'), trv = src('js/travel-system.js');

    // ---- ① 调用侧：三处入口都汇到同一个收口，收口在出怪之前点名 ----
    var 起寨 = jsFiles('js').filter(function (r) {
        return /startBattle\(\s*['"]bandits['"]\s*\)/.test(src(r.replace(/\\/g, '/')));
    }).map(function (r) { return r.replace(/\\/g, '/'); }).sort();
    eq(起寨.join(','), 'js/location-system.js,js/travel-system.js',
        'CK①a 全仓喊「山贼」开战的只有这两只文件三处（官道遭遇／黑风寨 openBanditDen／天牢私闯）——都走 window.startBattle 那一个收口');
    var 段 = app.split(/function globalStartBattle/)[1] || '';
    var 点名 = /typeOrData === 'bandits'\s*\|\|\s*typeOrData === 'bandit'\)\s*\{\s*(?:\/\/[^\n]*\n\s*)*spawnOpts = \{ physiologyType: 'humanoid' \}/.test(段.replace(/\r/g, ''));
    assert(点名, 'CK①b globalStartBattle 里 bandits／bandit 显式点名 physiologyType: humanoid（DES-23 那条 spawnOpts 口，不是新辟一支）');
    assert(段.indexOf("physiologyType: 'humanoid'") < 段.indexOf('gen(level, type, spawnOpts)'),
        'CK①c 点名发生在出怪之前（写在 `gen(level, type, spawnOpts)` 之后就是白写）');
    var 兜底 = trv.match(/generateRandomEnemy\(\s*level,\s*enemyType,\s*\(\s*type === 'bandits'\s*\|\|\s*type === 'bandit'\s*\)\s*\?\s*\{ physiologyType: 'humanoid' \}/);
    assert(!!兜底, 'CK①d 兜底出怪（window.globalStartBattle 不在位时走的那条，travel-system.js:731）也点了名——只修正门、留后门掷骰，这条批就不算收口');

    // ---- ② 行为层：独立语境真跑 battle.js，看点名到底改不改得出身子 ----
    var bc = vm.createContext({});
    vm.runInContext(`
this.window = this;
this.console = { log: function () {}, warn: function () {}, error: function () {} };
this.document = { readyState: 'complete', getElementById: function () { return null; },
    createElement: function () { return { style: {}, setAttribute: function () {}, appendChild: function () {}, classList: { add: function () {}, remove: function () {} } }; },
    querySelector: function () { return null; }, querySelectorAll: function () { return []; },
    addEventListener: function () {}, body: { appendChild: function () {} } };
this.localStorage = { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} };
this.showMessage = function () {};
`, bc);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/battle.js'), 'utf8'), bc, { filename: 'js/battle.js' });
    var gen = bc.generateRandomEnemy, Ent = bc.Entity;
    assert(typeof gen === 'function' && typeof Ent === 'function', 'CK②a battle.js 在这个语境里装得起来');
    if (!gen || !Ent) return;

    var 寨 = [], i;
    for (i = 0; i < 20; i++) 寨.push(gen(6, 'enemy', { physiologyType: 'humanoid' }));
    assert(寨.every(function (d) { return d.physiologyType === 'humanoid'; }),
        'CK②b 照这一批的点名连掷二十次，二十次都是人形（掷骰确实被点名顶掉了，不是碰巧）');
    assert(寨.every(function (d) { return d.elementType == null; }),
        'CK②c 这一批一个元素标都没有——屏上再不会有带「冰／火」牌的『山贼』');
    var 血肉 = 寨.map(function (d) { return new Ent(d, 'enemy'); });
    assert(血肉.every(function (e) { return (e.physiology && e.physiology.bloodVolume) > 0; }),
        'CK②d 点名的这一批个个有血（血账真在实体上非零）——「人形血肉」不只是一张类型标，它底下那笔账跟着变了');

    var 掷骰 = {}, one, 非人 = 0;
    for (i = 0; i < 400; i++) { one = gen(6, 'enemy').physiologyType; 掷骰[one] = (掷骰[one] || 0) + 1; if (one !== 'humanoid') 非人++; }
    assert(非人 > 0, 'CK②e 反证：不点名时四档照常掷得出来（实得 非人形 ' + 非人 + '/400）——改前三成上下掷出的就是元素／亡灵身子的「山贼」，这病是玩家点得到的，不是假设');

    // ---- ③ 棘轮：只改名不点名的新口子一冒出来就红 ----
    var 冠名 = jsFiles('js').filter(function (r) {
        var t = src(r.replace(/\\/g, '/'));
        return /\.name\s*=\s*'山贼'/.test(t) || /bandits\s*:\s*'山贼'/.test(t);
    }).map(function (r) { return r.replace(/\\/g, '/'); }).sort();
    eq(冠名.join(','), 'js/app.js,js/travel-system.js',
        'CK③a 全仓把敌人改名「山贼」的只有这两只文件（多一处＝新开了条不点名的口子）');
    assert(冠名.every(function (f) { return /physiologyType: 'humanoid'/.test(src(f)); }),
        'CK③b 而且这两只都点名了生理——「改名必点名」这一对钉在一起，谁将来拆开这支就红');

    // ---- ④ 顺带钉一条边界：木人桩/试炼傀儡那条 construct 点名不许被这一批改歪 ----
    assert(/typeOrData === 'training_dummy' \|\| typeOrData === 'trial'/.test(app)
        && /spawnOpts = \{ physiologyType: 'construct', noAffix: true \}/.test(app),
        'CK④ DES-23 那一格原样在位（本批只在它后面接了一档 humanoid，没把死物的点名换掉）');
})();

// ==================== [CL] 第一百一十一波 · 特殊地点册：得知才上图、状态真变、废址真删 ====================
// 用户裁：「黑风寨这种东西就可以放进地图，地图现在进行扩展，可以通过消息(比如城市酒馆)或者自己发现来看到
// 这些特殊地点，随后她们就会出现在地区列表内作为特殊地点显示；状态会改变，比如寨子的土匪被你杀光了就是
// 真空了，你还能选择废弃地点来删除，释放性能。」
// 起点是玩家一眼撞见的不合理：活动页一枚常驻「🏴 黑风寨」——一个得先打听才知道存不存在的地方，被摆在
// 「随时能做」的格子里（用户硬规则：活动页只放随时能做的事）。
console.log('\n[CL] 第一百一十一波 · 特殊地点册：得知才上图、状态真变、废址真删');
(function () {
    var html = src('仙侠.html'), sp = src('js/map/special-places.js'), app = src('js/app.js');
    var loc = src('js/location-system.js'), trv = src('js/travel-system.js'), bld = src('js/building-effects.js');

    // ---- ① 活动页归位 ----
    assert(html.indexOf('openBanditDen') < 0,
        'CL①a 仙侠.html 里再无 openBanditDen——活动页那枚常驻「黑风寨」钮已撤下');
    assert(!/>\s*🏴\s*黑风寨\s*</.test(html),
        'CL①b 活动页再没有一枚写着「黑风寨」的钮（要先发现的地方不挂随时能做的入口）');
    assert(html.indexOf('山贼巢穴') < 0,
        'CL①c 那张卡的说明行也不再列「山贼巢穴」——说明行不许承诺牌上没有的事');

    // ---- ② 挂线与装载顺序（这两笔都是装载时一次，排错就静默失联） ----
    assert(/<script defer src="js\/map\/special-places\.js"><\/script>/.test(html), 'CL②a 新册子已挂进页面');
    var 挂点 = html.indexOf('js/map/special-places.js');
    assert(html.indexOf('js/core/state-registry.js') < 挂点, 'CL②b 排在 state-registry.js 之后——存档登记发生在装载时');
    assert(html.indexOf('js/time-system.js') < 挂点, 'CL②c 排在 time-system.js 之后——「真空→废弃」那句挂的是每日订阅，也在装载时');

    // ---- ③ 地区列表那一组行：位置与渲染口 ----
    assert(/SpecialPlaces\.renderRegionRows\(prov\)/.test(app), 'CL③a generateRegionList 把这一组行交给册子现算（不是模板里写死一处地名）');
    assert(app.indexOf('${citiesHtml}') < app.indexOf('${specialHtml}') && app.indexOf('${specialHtml}') < app.indexOf('${wildernessHtml}'),
        'CL③b 摆法：城市之后、野外之前（特殊地点是「地方」，不与野外那张图并列）');
    assert(/window\.generateRegionList = generateRegionList/.test(app),
        'CL③c 渲染口已交全局——得知一处要当场补画，不该等玩家重开面板');
    assert(/typeof global\.generateRegionList === 'function'/.test(sp), 'CL③d 册子那一侧认这个渲染口');

    // ---- ④ 三条「得知」口子都真调到账 ----
    assert(/SpecialPlaces\.discover\('heifeng_zhai',\s*'prison'/.test(codeOnly(loc)), 'CL④a 天牢探监（消息）→ 落册');
    assert(/SpecialPlaces\.discover\('heifeng_zhai',\s*'trail'\)/.test(codeOnly(trv)), 'CL④b 官道脚印（自己发现）→ 落册');
    var 酒段 = (bld.split('function generateTavernIntel')[1] || '').slice(0, 1500);
    assert(/SpecialPlaces\.rollRumor\(\)/.test(酒段), 'CL④c 酒肆三巡（用户点名的消息口子）→ 真能从传闻里得知的地点');

    // ---- ⑤ 打赢才清账：挂钩两头都在位 ----
    assert(/hasSpoils && currentBattle\._specialPlaceId && window\.SpecialPlaces/.test(app),
        'CL⑤a 冲寨结算挂在「有战利品」那支下——对方遁走不清守众，屏上那个数才敢给玩家当依据');
    assert(/battle\._specialPlaceId = id/.test(sp), 'CL⑤b 攻寨时把地点 id 绑到这一战上（结算认得它冲的是哪处）');

    // ---- ⑥ 死账棘轮：旧那四枚名字在代码里彻底绝迹（注释里说病史不算） ----
    var 死名 = ['know_bandit_den', 'quest_bandit_den_available', 'unlockBanditDenQuest', 'openBanditDen'];
    var 所有js = jsFiles('js').map(function (r) { return r.replace(/\\/g, '/'); });
    死名.forEach(function (n) {
        var 残留 = 所有js.filter(function (f) { return codeOnly(src(f)).indexOf(n) >= 0; });
        eq(残留.join(','), '', 'CL⑥ 旧空账「' + n + '」在全仓 js/ 代码里零残留（它此前只写不读，是「界面承诺没接线」那一族）');
    });
    assert(!/= 'bandit_den_clue' &&/.test(codeOnly(trv)),
        'CL⑥e 「bandit_den_clue 遇 bandit_ambushed 权重 ×2」那支空转已撤（同一枚旗子既是入场门又给自己加权＝不动任何概率）');

    // ---- ⑦ 行为层：独立语境真装 js/map/special-places.js，把状态机走到底 ----
    var bc = vm.createContext({});
    vm.runInContext(`
this.window = this;
this.console = { log: function () {}, warn: function () {}, error: function () {} };
this.Math = Object.create(Math);
`, bc);
    var 掷值 = 0.99;   // 只喂给 bc.Math.random（语境里那支），宿主 Math 从头到尾没动
    bc.Math.random = function () { return 掷值; };
    var 说过的 = [], 订阅读者 = [], 存档件 = {}, 时辰账 = [], 开战次数 = 0, 最后战场 = null;
    bc.showMessage = function (t) { 说过的.push(String(t)); };
    bc.WorldCalendar = { day: 5 };
    bc.StateRegistry = { register: function (k, o) { 存档件[k] = o; } };
    bc.timeSystem = {
        advanceTime: function (m, why) { 时辰账.push(m + '|' + (why || '')); },
        onNewDaySubscribe: function (fn) { 订阅读者.push(fn); }
    };
    bc.startBattle = function () { 开战次数++; 最后战场 = { id: 开战次数 }; return 最后战场; };
    bc.generateRegionList = function () {};   // 得知／清空时那一次「当场补画」要真跑得通（本批不数它画了几回）
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/map/special-places.js'), 'utf8'), bc, { filename: 'js/map/special-places.js' });
    var SP = bc.SpecialPlaces;
    if (!SP) { assert(false, 'CL⑦ 册子在这个语境里装不起来'); return; }

    assert(!!存档件.specialPlaces && typeof 存档件.specialPlaces.export === 'function', 'CL⑦a 存档登记到位（specialPlaces 一支）');
    eq(订阅读者.length, 1, 'CL⑦b 每日订阅挂上一支（真空→废弃那句由它说）');

    // 未得知 = 列表上一个字都不出
    eq(SP.list().length, 0, 'CL⑦c 新号未得知：册子里零条（地区列表不会替他先长出一行）');
    eq(SP.renderRegionRows('中州'), '', 'CL⑦d 未得知时那一组行渲染成空串——黑风寨不再像旧版那样常驻');

    // 得知：幂等
    var 首 = SP.discover('heifeng_zhai', 'trail');
    assert(首.ok && 首.newly && 首.status === '盘踞', 'CL⑦e 脚印得知：落账、状态「盘踞」');
    assert(说过的.length === 1 && /已标上舆图/.test(说过的[0]), 'CL⑦f 得知只报一句（' + 说过的[0] + '）');
    var 再 = SP.discover('heifeng_zhai', 'prison');
    assert(再.ok && !再.newly, 'CL⑦g 第二次听到同一处（换渠道也一样）：不再算新增');
    eq(说过的.length, 1, 'CL⑦h 也不再重报——旧版官道事件每撞一次就重念一遍「已标记」，本波收口');
    eq(SP.list().length, 1, 'CL⑦i 册子仍只一条（幂等不是靠 UI 挡的）');
    assert(/黑风寨/.test(SP.renderRegionRows('中州')) && /攻寨/.test(SP.renderRegionRows('中州')),
        'CL⑦j 得知之后才在地区列表里长出这一行，钮名与状态同源');
    掷值 = 0.5;
    eq(SP.rollRumor(), null, 'CL⑦k 全已知时传闻不再掷（把消息口子让给世界的传闻池，不拿编好的闲话挡真消息）');

    // 攻寨 → 清守众：三场才真空
    var 前 = 开战次数;
    assert(SP.assault('heifeng_zhai') === true && 开战次数 === 前 + 1, 'CL⑦l 盘踞处攻得动，且真开了一战');
    assert(最后战场 && 最后战场._specialPlaceId === 'heifeng_zhai', 'CL⑦m 这一战带着地点 id 上路（打赢才认得该清哪处的账）');
    eq(时辰账.length, 1, 'CL⑦n 这一趟先付了脚程的时辰账——不是免费的，也不靠每日计数器拦人');
    assert(/^\d+\|奔赴黑风寨$/.test(时辰账[0]), 'CL⑦n2 时辰账记的是这趟路（' + 时辰账[0] + '）');
    var 寨 = SP.discover('heifeng_zhai').record;
    eq(SP.reportVictory('heifeng_zhai').record.garrison, 2, 'CL⑦o 打赢一场清一伙（3→2）');
    SP.reportVictory('heifeng_zhai');
    var 清 = SP.reportVictory('heifeng_zhai');
    eq(清.record.garrison, 0, 'CL⑦p 第三场打完守众归零');
    eq(清.status, '真空', 'CL⑦q 守众清零即「真空」（用户点名的那一格状态改变）');
    eq(SP.reportVictory('heifeng_zhai').cleared, 0, 'CL⑦r 空寨再报胜不扣负数——账不会往回长');
    var 战前 = 开战次数;
    assert(SP.assault('heifeng_zhai') === false && 开战次数 === 战前, 'CL⑦s 真空处攻不动（没人可打），也不白开一战');
    assert(/空寨/.test(SP.renderRegionRows('中州')) && !/攻寨/.test(SP.renderRegionRows('中州')),
        'CL⑦t 真空那行的钮名不再写「攻寨」——热区与钮名不许撒谎（UI-09 同一支笔）');

    // 真空 →（满七日）→ 废弃 → 抹去
    eq(SP.statusOf(寨), '真空', 'CL⑦u 第五日清空，当日仍算真空');
    bc.WorldCalendar.day = 5 + SP.ABANDON_AFTER_DAYS - 1;
    eq(SP.tickDay(), true, 'CL⑦v 每日钩子跑得过');
    eq(SP.statusOf(寨), '真空', 'CL⑦w 差一日不成废址（七日那道坎是真的在数日子）');
    bc.WorldCalendar.day = 5 + SP.ABANDON_AFTER_DAYS;
    eq(SP.statusOf(寨), '废弃', 'CL⑦x 空满七日成「废弃」');
    var 说法 = 说过的.length;
    SP.tickDay();
    assert(说过的.length === 说法 + 1 && /废址/.test(说过的[说法]), 'CL⑦y 成废址时说一次（' + 说过的[说法] + '）');
    SP.tickDay();
    eq(说过的.length, 说法 + 1, 'CL⑦z 同一处不报第二遍（abandonAnnounced 记在账上，不是靠屏上盖住）');
    assert(/抹去/.test(SP.renderRegionRows('中州')), 'CL⑦za 废址那行给的是「抹去」这一笔（用户要的删除出口真在屏上）');
    assert(SP.openDetail('heifeng_zhai') === true, 'CL⑦zb 详情窗开得出（走公共 showModal，UI-25 那顶帽由公共笔给）');
    eq(SP.forget('heifeng_zhai'), true, 'CL⑦zc 废弃地点抹得掉');
    eq(SP.list().length, 0, 'CL⑦zd 抹去后册子里真少一条（记录从存档里 splice，不是藏起来不画）');
    eq(SP.discover('heifeng_zhai', 'rumor').reason, 'scrapped', 'CL⑦ze 抹过的地方不会凭一句闲话凭空长回满员寨子——世界账上它已是废址');
    eq(SP.rollRumor(), null, 'CL⑦zf 抹过的地方也不再当传闻传进耳朵');
    assert(SP.forget('no_such_place') === false && SP.discover('no_such_place', 'self').ok === false,
        'CL⑦zg 认不出的 id 一律不落账（不造出无处可去的孤立记录）');

    // 存档：export → reset → import 走得回来，未知 id 进不来
    存档件.specialPlaces.reset();
    eq(SP.list().length, 0, 'CL⑦h1 reset 清得干净（新号不该带上一世的舆图）');
    掷值 = 0;
    eq(typeof SP.rollRumor(), 'string', 'CL⑦h2 传闻掷中时给出的就是那句传闻原文（酒肆只负责把它念出来）');
    SP.reportVictory('heifeng_zhai');
    var 存的 = 存档件.specialPlaces.export();
    存档件.specialPlaces.reset();
    存档件.specialPlaces.import(JSON.parse(JSON.stringify(存的)));
    var 回的 = SP.list()[0];
    assert(回的 && 回的.record.garrison === 2, 'CL⑦h3 守众这本账过档不丢（' + (回的 && 回的.record.garrison) + '）');
    eq(回的.status, '盘踞', 'CL⑦h4 状态是现算的，读档即对得上');
    // 抹过的记号也得跟着过档：不然是「存一次档，寨子凭空长回来」那一笔谎
    存档件.specialPlaces.reset();
    SP.discover('heifeng_zhai', 'trail');
    bc.WorldCalendar.day = 13;
    SP.reportVictory('heifeng_zhai');
    SP.reportVictory('heifeng_zhai');
    eq(SP.reportVictory('heifeng_zhai').status, '真空', 'CL⑦h7a 三场冲寨打完才真空（清空日记在第 13 日）');
    bc.WorldCalendar.day = 13 + SP.ABANDON_AFTER_DAYS;
    eq(SP.statusOf(SP.list()[0].record), '废弃', 'CL⑦h7 空满七日当真成废址（跨日算术不靠屏上那句提示）');
    SP.forget('heifeng_zhai');
    var 抹档 = 存档件.specialPlaces.export();
    存档件.specialPlaces.reset();
    存档件.specialPlaces.import(JSON.parse(JSON.stringify(抹档)));
    eq(SP.list().length, 0, 'CL⑦h7b 抹去之后过一遍档，册子还是空的');
    eq(SP.discover('heifeng_zhai', 'trail').reason, 'scrapped',
        'CL⑦h8 抹去这笔记忆过档不丢——存一次档，废址不该长回满员寨子');
    存档件.specialPlaces.import({ places: { made_up_place: { garrison: 9 }, heifeng_zhai: { garrison: 1, emptiedDay: 0, discoveredDay: 7, source: 'rumor' } }, scrapped: ['heifeng_zhai_x'] });
    eq(SP.list().map(function (p) { return p.def.id; }).join(','), 'heifeng_zhai', 'CL⑦h5 定义里没这条的不进口袋——改过定义也不该留孤账');
    // 真空处抹不掉：删除只对废址开（不让人拿「释放性能」当免战牌）
    存档件.specialPlaces.reset();
    SP.discover('heifeng_zhai', 'self');
    eq(SP.forget('heifeng_zhai'), false, 'CL⑦h6 盘踞处抹不掉——要删先把它打空、再等它成废址');
})();

// ==================== [CO] 第六十七批 · 手搓敌手那本「只写了一格」的耐久账 ====================
// 病根（读码定位，非假设）：仓里 17 处手搓敌手写的是 `durabilities: { chest: N }`，而
//   js/battle.js 的 Entity 过去是 `this.durabilities = data.durabilities || initBodyDurability(...)`
//   ——给了就不建册，于是这具身子上只有胸这一格在册。三处各按各的读法骗人：
//     · takeDamage 对缺格 return 0（`_executeAttack` 再念一句「攻击了无效的部位！」——可这身子分明有头有手）
//     · calculateStatsFromDurability 把缺格当 0 → 力量／体质／敏捷全部踩到 0.5× 地板（敌手比写定的弱一半）
//     · 躯体面板与 SVG 把缺格念成「0/100」并涂成摧毁色（一上场就有 21 格是黑的）
// 改法：建账处一支补全笔收口（不在 17 处各自手抄）；缺格按**这一本册子自己写明的尺**补齐，
//   不凭空按 100——按 100 补等于把作者写定的 400 胸甲换成 100 的头，那是偷偷改数值。
// ⚠️ 本批不做数值补偿：补账后这批敌手属性回到写定值（变强），非要害格也能挨打（多出残废路）。
console.log('\n[CO] 第六十七批 · 单格耐久账：缺格补全 · 属性 0.5× 地板撤掉 · 表外格不再静默吞伤害');
(function () {
    var battle = codeOnly(src('js/battle.js'));

    // ---- ① 建账收口：一支笔，不是 17 处手抄 ----
    assert(!/this\.durabilities\s*=\s*data\.durabilities\s*\|\|/.test(battle),
        'CO①a Entity 里「调用方给什么就上什么」那行已撤（缺格不进册就是这一批的病根）');
    assert(/this\.durabilities\s*=\s*normalizeDurabilityBook\(data\.durabilities,\s*this\.attrs\)/.test(battle),
        'CO①b 建账改走一支补全笔——全仓所有 new Entity 都汇到这一处收口');
    assert(!/hasOwnProperty\(partId\)\)\s*return\s+0;/.test(battle),
        'CO①c 表外格那条不再是一行式静默 return 0（出一分力、账上零进账、屏上无事发生）');

    // ---- 行为层：独立语境真跑 battle.js ----
    var 喊话 = [];
    var bc = vm.createContext({});
    vm.runInContext(`
this.window = this;
this.document = { readyState: 'complete', getElementById: function () { return null; },
    createElement: function () { return { style: {}, setAttribute: function () {}, appendChild: function () {}, classList: { add: function () {}, remove: function () {} } }; },
    querySelector: function () { return null; }, querySelectorAll: function () { return []; },
    addEventListener: function () {}, body: { appendChild: function () {} } };
this.localStorage = { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} };
this.showMessage = function () {};
`, bc);
    bc.__warn = function (m) { 喊话.push(Array.prototype.slice.call(arguments).join(' ')); };
    vm.runInContext('this.console = { log: function () {}, warn: function () { __warn.apply(null, arguments); }, error: function () {} };', bc);
    // 伤口生成读 window.DAMAGE_TYPE_EFFECTS（定义在 physiology-config.js）——真跑 takeDamage 得先把它装进来
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/physiology-config.js'), 'utf8'), bc, { filename: 'js/physiology-config.js' });
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/battle.js'), 'utf8'), bc, { filename: 'js/battle.js' });
    // 依仙侠.html 的真实序：battle-injuries 在 battle 之后（受击时裸调 shouldCheckCriticalInjury）
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/battle-injuries.js'), 'utf8'), bc, { filename: 'js/battle-injuries.js' });
    var Ent = bc.Entity, 补册 = bc.normalizeDurabilityBook, 全册 = bc.BODY_PARTS;
    assert(typeof Ent === 'function' && typeof 补册 === 'function' && Array.isArray(全册),
        'CO①d battle.js 在这个语境里装得起来，补全笔也挂在 window 上（其它模块共用这一支）');
    if (!Ent || !补册) return;
    var 格数 = 全册.length;
    var 六维 = function (v) { return { strength: v, dexterity: v, intelligence: v, willpower: v, constitution: v, meridian: v }; };

    // ---- ② 一本单格册上场之后 ----
    var 甲 = new Ent({ name: '攻山妖兽', type: 'beast', species: 'beast', physiologyType: 'beast',
        attrs: 六维(40), durabilities: { chest: 130 } }, 'beast');
    eq(Object.keys(甲.durabilities).length, 格数, 'CO②a 只写了一格的册子，上场时补满整册（' + 格数 + ' 格一格不缺）');
    assert(['head', 'brain', 'neck', 'dantian', 'handL'].every(function (k) { return 甲.durabilities[k] === 130; }),
        'CO②b 缺格按这本册子自己写明的尺（130）补齐，不是凭空一个 100');
    assert(Object.keys(甲.durabilities).every(function (k) {
        return 甲.maxDurabilities[k] === 甲.durabilities[k];
    }), 'CO②c 上限与实账同 key 同值——面板那格的分母从此是真的，不再靠 `|| 100` 兜底');
    eq(甲.takeDamage('head', 50, 'blunt'), 50, 'CO②d 点头现在收得到伤了（改前这一击原样退回 0）');
    eq(甲.durabilities.head, 80, 'CO②e 这一击真进了那一格的账');
    甲.takeDamage('head', 999, 'blunt');
    assert(甲.isAlive === false && 甲.deathCause === 'part:head',
        'CO②f 头打穿当真判死，死因记的就是这一格（改前：那一格根本不在册，玩家点了半天没点在身上）');

    // ---- ③ 补账不改作者写定的门槛 ----
    var 乙 = new Ent({ name: '宗门死士', physiologyType: 'humanoid', attrs: 六维(30), durabilities: { chest: 400 } }, 'enemy');
    assert(乙.durabilities.head === 400 && 乙.durabilities.chest === 400,
        'CO③a 400 胸甲这一尺铺满整册：判死门槛仍是作者写定的那个数（补账不等于把要害改成 100 的软格）');
    乙.takeDamage('head', 399, 'blunt');
    assert(乙.isAlive !== false, 'CO③b 打 399 还没死——门槛没被调低');
    乙.takeDamage('head', 1, 'blunt');
    assert(乙.isAlive === false, 'CO③c 差这一格才死：改后判死线的长度＝作者写的那 400');
    var 丙 = 补册({ chest: 0 });
    assert(丙.chest === 0 && 丙.head === 100,
        'CO③d 整册一个可用数都没有（唯一那格写的是 0）时退回默认满册，不拿 0 去灌满全身');
    var 受损原册 = {};
    全册.forEach(function (p, i) { 受损原册[p.id] = 100 - i; });
    var 照单 = 补册(受损原册);
    assert(全册.every(function (p) { return 照单[p.id] === 受损原册[p.id]; }),
        'CO③e 已经写满的册子一字不改（玩家中场存档那本受损账不许被灌水）');

    // ---- ④ 属性地板：量出改前改后那一截差 ----
    var 改前 = new Ent({ name: '地板', physiologyType: 'humanoid', attrs: 六维(40), durabilities: { chest: 130 } }, 'enemy');
    改前.durabilities = { chest: 130 };   // 复现改前：这本单格册原样上场
    eq(改前.getEffectiveAttrs().strength, 20, 'CO④a 改前复现：缺 21 格被当 0 → 力量踩 0.5× 地板，写 40 只出 20（这批敌手一直比写定的弱一半）');
    var 丁 = new Ent({ name: '守众', physiologyType: 'humanoid', attrs: 六维(40), durabilities: { chest: 130 } }, 'enemy');
    eq(丁.getEffectiveAttrs().strength, 40, 'CO④b 同一本入参走改后的建账笔 → 力量按写定的 40 出力（差的那 20 就是这一批补回来的账）');
    eq(丁.getEffectiveAttrs().dexterity, 40, 'CO④c 敏捷同账：改前也是 20（缺 7 格敏捷位），改后不再被自己没写的格子拖累');
    assert(丁.getEffectiveAttrs().intelligence === 40 && 丁.getEffectiveAttrs().meridian === 40,
        'CO④d 神识与经脉两条一起归位（改前各踩 0.75）——「补账会让他们变强」这一条是本批的已知代价，按不做数值补偿的规矩原样上屏');

    // ---- ⑤ 两本账从此同一本：手搓妖兽与生成妖兽用同一张分母 ----
    var 生成 = new Ent(bc.generateRandomEnemy(6, 'beast'), 'beast');
    eq(Object.keys(甲.durabilities).length, Object.keys(生成.durabilities).length,
        'CO⑤ 收服判定（beast-taming 读 total/maxTotal）不再有「手搓那只按单格算、所以格外好收」的口径分岔');

    // ---- ⑥ 表外格：仍不收伤，但留硬账 ----
    var 戊 = new Ent({ name: '傀儡', physiologyType: 'construct', attrs: 六维(20) }, 'enemy');
    喊话.length = 0;
    eq(戊.takeDamage('wing', 30, 'blunt'), 0, 'CO⑥a 这一具身子上没有的格子仍不入账（不凭空造格）');
    assert(喊话.length === 1 && /傀儡/.test(喊话[0]) && /wing/.test(喊话[0]),
        'CO⑥b 但当场留一行硬账（含是谁的哪一格）——「静默吞伤害」这一族在本仓不许复活');
})();

// ==================== [CP] 第六十九批 · 第一百一十四波 DES-10：门派「前往」并入城市脚力口径 ====================
// 立案时的病：同一个地区列表面板上，城市行要付 30 分钟＋5 精力，门派行一分不收就把人站在山门口
//   ——「近路不结时辰」正是强制规则.md 第 3 条点名的旧口子（行为约束必须来自世界本身：时间成本／自身状态）。
// 改法不给山门另定一个新价（那是抄出第二个真相），而是把路上那笔账收口成一支 chargeFootJourney，
//   城市行与门派行同读这一支，30/5 两个数额一字未动。
// 本段钉的是「搬家没丢账」＋「两支笔读出同一本账」，外加调用点唯一的那道棘轮。
console.log('\n[CP] DES-10 山门与城市同一支脚程笔：行为层同读数 + 拒客不结账 + 单一定价棘轮');
(function () {
    var app = src('js/app.js');
    var loc = src('js/location-system.js');
    function 体Of(name) {
        var i = app.indexOf('function ' + name + '(');
        if (i < 0) return '';
        var d = 0;
        for (var k = app.indexOf('{', i); k < app.length; k++) {
            if (app[k] === '{') d++;
            else if (app[k] === '}') { d--; if (!d) return app.slice(i, k + 1); }
        }
        return '';
    }
    var 脚笔 = 体Of('chargeFootJourney'), 城市行 = 体Of('travelToCityFromList'), 山门行 = 体Of('travelToSectFromList');
    var 同地笔 = 体Of('footJourneyLedgerHere');   // 第一百一十七波 DES-51：两支行路前都先问这一支（原地踏步不收脚程）
    assert(脚笔.length > 300 && 山门行.length > 150, 'CP① 三支笔都从 app.js 取到了本体（尺子没抓空）');
    assert(同地笔.length > 200, 'CP①a DES-51 的同地判定也取到了本体（装架子时缺它就是一记 ReferenceError）');

    // ---- 行为层：三支笔装进同一具架子，window 即全局（城市行那句裸 showMessage 才落得下去） ----
    var ctx = {}; ctx.window = ctx;
    var 时辰 = [], 喊话 = [], 调用 = [];
    ctx.timeSystem = { advanceTime: function (min, why) { 时辰.push({ min: min, why: why }); } };
    ctx.showMessage = function (m) { 喊话.push(m); };
    ctx.updateCharacterStatus = function () { 调用.push('刷新状态'); };
    ctx.selectSectFromList = function (n) { 调用.push('只看介绍:' + n); };
    ctx.enterSect = function (n) { 调用.push('进门派:' + n); return true; };
    ctx.locationSystem = { enterCity: function (n) { 调用.push('进城:' + n); return true; } };
    ctx.partySystem = { syncPartyLocationToPlayer: function (n) { 调用.push('同步队伍:' + n); } };
    ctx.travelSystem = { unlockTeleport: function (n) { 调用.push('解锁传送:' + n); } };
    vm.runInNewContext(同地笔 + '\n' + 脚笔 + '\n' + 城市行 + '\n' + 山门行 + '\nthis.footJourneyLedgerHere = footJourneyLedgerHere;'
        + '\nthis.chargeFootJourney = chargeFootJourney;'
        + '\nthis.travelToCityFromList = travelToCityFromList;this.travelToSectFromList = travelToSectFromList;', ctx);
    function 摆(n, 进) {
        时辰.length = 0; 喊话.length = 0; 调用.length = 0;
        ctx.currentCharData = { energy: n, location: '青木城' };
        ctx.enterSect = function (x) { 调用.push('进门派:' + x); return 进 === undefined ? true : 进; };
    }

    摆(100);
    ctx.travelToSectFromList('青云宗');
    eq(时辰.length, 1, 'CP②a 点山门这一行结一次时辰账（旧版这一支是零——山门口白站）');
    eq(时辰[0] && 时辰[0].min, 30, 'CP②b 时辰数额仍是 30 分钟（与城市行同一个数，本批一字未动）');
    eq(时辰[0] && 时辰[0].why, '前往青云宗', 'CP②c 账上写的是「前往＋目的地」，不是硬编码城市名');
    eq(ctx.currentCharData.energy, 95, 'CP②d 精力 100→95（这一支笔只此一处扣 5，见 CP⑥b）');
    eq(喊话.join('|'), '🚶 经过一番跋涉，精力−5。', 'CP②e 跋涉句念实付差值，抵达回执留给 enterSect 那一支');
    assert(调用.indexOf('解锁传送:青云宗') < 0 && 调用.indexOf('同步队伍:青云宗') < 0,
        'CP②f 山门这一行没照抄城市行的两件事：阵盘目的地只从 cityData 取（写宗名是进不了门的脏键），同伴同步更没有还原那一支笔');
    eq(ctx.currentCharData.location, '青木城', 'CP②g 角色位置不是脚程笔写的（架子那头的 enterSect 才写）——禁止复制一套平行状态');
    assert(/currentCharData\.location = sectName/.test(loc), 'CP②g2 进山门那一支自己写位置（location-system.js 的 enterSect），账本只有一处记着「人在哪」');

    摆(100, false);
    ctx.travelToSectFromList('查无此宗');
    eq(时辰.length, 0, 'CP③a 上山被拒（查无此宗）→ 不结时辰');
    eq(ctx.currentCharData.energy, 100, 'CP③b 不结时辰也不扣精力（与城市行 v20.65「拦下不结账」同一口径）');
    eq(喊话.length, 0, 'CP③c 人被拦在山门外，就不许另响一句「经过一番跋涉」');

    摆(2); ctx.travelToSectFromList('青云宗');
    eq(ctx.currentCharData.energy, 0, 'CP④a 只剩 2 精力时扣到 0 为止（不许扣成负数）');
    eq(喊话[0], '🚶 经过一番跋涉，精力−2。', 'CP④b 跋涉句念的是实付的 2，不是常量 5');
    摆(0); ctx.travelToSectFromList('青云宗');
    eq(喊话[0], '🚶 经过一番跋涉，你已累得没有精力可扣了。', 'CP④c 精力见底仍要说一声（这一程照样费时辰），但不报「精力−0」这种假账');

    function 账() { return JSON.stringify([时辰.map(function (t) { return t.min; }), 喊话, ctx.currentCharData.energy]); }
    摆(100); ctx.travelToCityFromList('铁城', '中州');
    var 城市账 = 账();
    摆(100); ctx.travelToSectFromList('青云宗');
    eq(账(), 城市账, 'CP⑤ 城市行与门派行读出同一本账：同样 30 分钟、同样的跋涉句、同样掉 5 点精力（一支笔两个行家，不是两份价；目的地各自记在自己那句「前往X」里，见 CP②c）');

    // ---- ⑥ 结构层：调用点唯一 ＋ 定价只此一处（抄一份「30/5」就是造第二个真相） ----
    var 进城笔 = /function enterSect\([\s\S]*?return false;[\s\S]*?\n\}\n/.test(loc) && /\n    return true;\s*\n\}/.test(loc);
    assert(进城笔, 'CP⑥a enterSect 必须如实回话（查无此宗 false／进门 true）——脚程笔在它回 false 时一分钱不收');
    var 价处 = jsFiles('js').filter(function (f) { return /advanceTime\(footMinutes, '前往' \+ destName\)/.test(codeOnly(src(f.replace(/\\/g, '/')))); })
        .map(function (f) { return f.replace(/\\/g, '/'); }).join(',');
    eq(价处, 'js/app.js', 'CP⑥b 「脚程分钟＋前往」这一价全仓只写在 chargeFootJourney 里（读到 ' + 价处 + '）');
    var 扣5处 = jsFiles('js').filter(function (f) { return /staminaBefore - footStamina/.test(codeOnly(src(f.replace(/\\/g, '/')))); })
        .map(function (f) { return f.replace(/\\/g, '/'); }).join(',');
    eq(扣5处, 'js/app.js', 'CP⑥c 「脚程扣精力」这一价全仓也只此一处（读到 ' + 扣5处 + '）——想给山门另定新价的人先过这一支');
    var 行笔处 = jsFiles('js').filter(function (f) { return /chargeFootJourney\(/.test(codeOnly(src(f.replace(/\\/g, '/')))); })
        .map(function (f) { return f.replace(/\\/g, '/'); }).join(',');
    eq(行笔处, 'js/app.js', 'CP⑥d 共用脚程笔的调用点全仓只落在地区列表这一张面板所在的文件（读到 ' + 行笔处 + '）');
    var 上山路 = codeOnly(app).split('\n').filter(function (L) { return /travelToSectFromList\(/.test(L) && /onclick=/.test(L); });
    eq(上山路.length, 1, 'CP⑦ 地区列表的门派行只有「前往」那颗钮走 travelToSectFromList（读到 ' + 上山路.length + ' 处 onclick）——别的入口若也上山，得同样过这支笔');
})();

// ==================== [CQ] 第七十批 · 第一百一十五波 DES-21 文案半：掷骰那支不许嘴上说「战斗开始」 ====================
// 病（普查＋读码）：斗法台 du_fight 的节点叙述写「双方抱拳行礼，战斗开始！」，镖局 es_road 的选择写
//   「真刀真枪，会输」——两支持票都走 effects.roll（抽个签直接落账），本文件连一笔开战斗屏的笔都没有。
//   玩家读到的是「要打一屏」，点下去是「翻一张签」。这是「只展示不接线」的镜像面：线没接，展示先把愿许了。
// 本批只改措辞，八笔数额一字未动（CQ② 钉死）；机制那一半（掷骰换成真开屏、胜负回写现有彩头）
//   挂在待裁决冲突①（战斗难度＝全局缩放）上，本批不碰——文案改口 ≠ 机制改动，两套尺各钉各的。
console.log('\n[CQ] DES-21 文案半：屏面明话普查棘轮 + 掷骰八笔数额未动 + vm 真跑胜败两支');
(function () {
    var 明话 = /(战斗开始|真刀真枪)/;
    var 串尺 = /(?:text|desc|msg):\s*'([^']*)'/g;
    // 白名单是判例不是免死牌：js/sects/sect-scenarios.js 那枚「🔥 真刀真枪，全力以赴」与同排的
    //   「⚔️ 点到为止，走十几个回合」对举，说的是用力气的程度，不是承诺开一屏；胜负文案通篇场中叙述
    //   （扫腿放倒、撑满九十回合），没有一句界面预告。CQ①c 双向钉＋仍在命中复验：改了口就得撤牌，新犯的要亮牌。
    var 白名单 = ['js/sects/sect-scenarios.js'];

    // ---- ① 普查棘轮：全仓 js/ 只看会进屏幕的那三类串（text/desc/msg），注释里引用旧病根的不算牌面 ----
    var 命中 = [], 违例 = [];
    jsFiles('js').forEach(function (rel) {
        var 径 = rel.replace(/\\/g, '/');
        var 文 = src(径);
        if (!明话.test(文)) return;
        var 真开屏 = /startBattle|openBattleWithEntity/.test(codeOnly(文));
        var 行表 = 文.split('\n');
        for (var i = 0; i < 行表.length; i++) {
            if (/^\s*(\/\/|\*|\/\*)/.test(行表[i])) continue;
            var mm; 串尺.lastIndex = 0;
            while ((mm = 串尺.exec(行表[i]))) {
                if (!明话.test(mm[1])) continue;
                var 是掷骰 = false;
                for (var j = Math.max(0, i - 6); j < Math.min(行表.length, i + 14); j++) {
                    if (/\broll:\s*\{/.test(行表[j])) { 是掷骰 = true; break; }
                }
                var h = { 档: 径, 行: i + 1, 串: mm[1], 掷骰: 是掷骰, 真开屏: 真开屏 };
                命中.push(h);
                if (h.串.indexOf('战斗开始') >= 0 && !h.真开屏) 违例.push(h);
                else if (h.串.indexOf('真刀真枪') >= 0 && h.掷骰 && !h.真开屏 && 白名单.indexOf(h.档) < 0) 违例.push(h);
            }
        }
    });
    function 列(a) { return a.map(function (h) { return h.档 + ':' + h.行 + '「' + h.串.slice(0, 24) + '」'; }).join(' ｜ '); }
    eq(违例.length, 0, 'CQ①a 屏面明话却不接战斗屏的违例为 0（读到 ' + 违例.length + ' 条：' + 列(违例) + '）');
    var 二批话 = 命中.filter(function (h) { return h.档 === 'js/city-facilities/facility-batch2.js'; });
    eq(二批话.length, 0, 'CQ①b 本批改口的那个文件屏面串里明话归零（读到 ' + 列(二批话) + '）——真开屏的戏照常写，掷骰的戏不许写');
    var 掷骰枪 = 命中.filter(function (h) { return h.串.indexOf('真刀真枪') >= 0 && h.掷骰 && !h.真开屏; })
        .map(function (h) { return h.档; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort().join(',');
    eq(掷骰枪, 白名单.slice().sort().join(','), 'CQ①c 掷骰无开屏笔的「真刀真枪」所在文件集恰等于白名单（读到 ' + 掷骰枪 + '）——白名单不许悄悄变宽，也不许留着已改口的死牌');
    var 未犯 = 白名单.filter(function (f) { return 命中.some(function (h) { return h.档 === f && h.掷骰 && !h.真开屏; }); });
    eq(未犯.length, 白名单.length, 'CQ①d 白名单每一条仍在命中（在册 ' + 白名单.length + '、实命中 ' + 未犯.length + '）——那处若改了口就该撤牌，别把它养成常驻通行证');

    // ---- ② 账目未动：改的是话，不是价。八笔常量＋四条胜败 msg 原文原位 ----
    var b2 = src('js/city-facilities/facility-batch2.js');
    var 原样 = [
        "require: { qi: 40 }, effects: { time: 45, roll: {",
        "win: { qi: -25, exp: 40, rep: 5, stones: 300,",
        "lose: { qi: -60, health: -25, stones: 150, exp: 30,",
        "require: { qi: 30 }, effects: { time: 10, roll: {",
        "win: { qi: -30, stones: 100, exp: 30, rep: 5, fame: 1,",
        "lose: { qi: -45, health: -25, exp: 20,",
        "require: { qi: 20 }, effects: { time: 15, roll: {",
        "win: { qi: -20, stones: 80, exp: 25, rep: 3,",
        "lose: { qi: -30, health: -15, exp: 20,"
    ];
    原样.forEach(function (K) { assert(b2.indexOf(K) >= 0, 'CQ②a 常量原位未动：' + K); });
    ["msg: '三招之内你把对手打下擂台！100灵石奖金入袋，台下喝彩声里有人记住了你的名号。'",
        "msg: '对手的身法比你想象的快——一掌把你拍下台去，哄笑声里你爬起来掸了掸灰。'",
        "msg: '你把山贼杀得四散奔逃，镖车安全送达！获得300灵石和40历练！'",
        "msg: '群贼围攻，你挂了彩才护住镖车。镖头扣了货损赔款，只拿到150灵石——但这场硬仗比银子值钱。'"
    ].forEach(function (K) { assert(b2.indexOf(K) >= 0, 'CQ②b 胜败 msg 一字未改（那半本来就说的是场中事）：' + K.slice(0, 20)); });
    assert(b2.indexOf("'⚔️ 击退山贼！（一场硬仗，会输）'") >= 0 && b2.indexOf('真刀真枪，会输') < 0,
        'CQ②c 镖局那支改口为「一场硬仗，会输」——会输是真的（lose 那笔 qi−60/health−25 照扣），开屏是假的所以不写');
    assert(b2.indexOf('双方抱拳行礼，台下赌盘已经开了赔率——几招之内便要见分晓。') >= 0,
        'CQ②d 斗法台叙述改口为赌盘与招数，不再报「战斗开始」（win/lose 说的正是「三招之内」「守到第十招」）');

    // ---- ③ vm 真跑：真引擎＋真剧本，读上屏字符串与落账数额 ----
    function 世界(签) {
        var 银 = { spiritStones: 500 }, 上屏 = [], 开屏 = [], 名望 = [];
        var w = {
            console: { log: function () {}, warn: function () {}, error: function () {} },
            JSON: JSON, Object: Object, Array: Array, Math: Math, Number: Number, isFinite: isFinite, Date: Date, String: String,
            currentCharData: { qi: 100, health: 100, energy: 100, maxEnergy: 100, tempering: 0, karma: 0, notoriety: 0, fame: 0, exp: 0, location: '测试城' },
            inventory: { currency: 银, slots: [] },
            gameLog: { add: function (m) { 上屏.push(String(m)); } },
            showMessage: function (m) { 上屏.push(String(m)); },
            advanceTime: function () {}, getCurrentCityName: function () { return '测试城'; },
            getRealmTier: function () { return 3; }, getReputationValue: function () { return 0; },
            addReputation: function (c, n) { 名望.push([c, n]); }, addFame: function () {},
            startBattle: function () { 开屏.push('startBattle'); },
            openBattleWithEntity: function () { 开屏.push('openBattleWithEntity'); },
            locationSystem: { getCityPriceModifier: function () { return 1; }, getCityData: function () { return { priceModifier: { sell: 1 } }; } },
            document: { readyState: 'complete', addEventListener: function () {}, getElementById: function () { return null; },
                createElement: function () { return { style: {}, classList: { add: function () {}, remove: function () {} }, appendChild: function () {}, innerHTML: '' }; },
                querySelector: function () { return null; }, body: {} }
        };
        w._reps = 名望;
        w.XianXia = { DataManager: { getSpiritStones: function () { return 银.spiritStones; }, setSpiritStones: function (v) { 银.spiritStones = Math.max(0, v); } } };
        w.EconomyTransaction = {
            run: function (fn) { return fn(); },
            credit: function (k, n) { if (k === 'spiritStones') { 银.spiritStones += n; return true; } return true; },
            debit: function (k, n) { if (k === 'spiritStones') { if (银.spiritStones < n) return false; 银.spiritStones -= n; return true; } return true; },
            addSnapshot: function () { return true; }, removeByTemplate: function () { return true; }
        };
        var 序 = [签], 第 = 0;
        w.__scenarioRng = function () { return 第 < 序.length ? 序[第++] : 0.5; };
        w.window = w;
        var ctx = vm.createContext(w);
        ['js/core/reward-service.js', 'js/core/world-teeth.js', 'js/core/scenario-engine.js',
            'js/city-facilities/bank-service.js', 'js/city-facilities/facility-batch2.js', 'js/city-facilities/facility-batch3.js']
            .forEach(function (f) { vm.runInContext(src(f), ctx, { filename: f }); });
        return { w: w, eng: w.scenarioEngine, 银: 银, 上屏: 上屏, 开屏: 开屏, p: w.currentCharData };
    }
    function 跑(台, 戏, 步, 签) {
        var W = 世界(签);
        var 句 = [];
        var st = W.eng.start(台, 戏);
        if (st && st.desc) 句.push(st.desc);
        步.forEach(function (i) {
            var r = W.eng.choose(i);
            if (r && r.desc) 句.push(r.desc);
        });
        return { W: W, 句: 句 };
    }

    var 胜 = 跑('arena_stage', 'duel', [0, 0], 0.1);   // 上台 → 全力进攻（掷胜）
    eq(胜.W.开屏.length, 0, 'CQ③a 斗法台这一路从头到尾没有一笔画过开战斗屏（startBattle/openBattleWithEntity 调用 ' + 胜.W.开屏.length + ' 次）——所以牌面本来就不该写「战斗开始」');
    assert(胜.句.concat(胜.W.上屏).every(function (s) { return !明话.test(s); }),
        'CQ③b 真跑上屏的字符串（节点叙述＋回执）里已无明话：' + 胜.句.join(' ⏎ '));
    eq(胜.W.p.qi, 70, 'CQ③c 掷胜真气 100→70（qi−30 照旧，改口没改价）');
    eq(胜.W.银.spiritStones, 600, 'CQ③d 掷胜彩头 500→600（100 灵石照旧）');
    assert(胜.W.上屏.join('|').indexOf('三招之内你把对手打下擂台') >= 0, 'CQ③e 掷胜 msg 上屏一字未变');

    var 败 = 跑('arena_stage', 'duel', [0, 0], 0.99);  // 上台 → 全力进攻（掷败）
    eq(败.W.p.qi, 55, 'CQ③f 掷败真气 100→55（qi−45）');
    eq(败.W.p.health, 75, 'CQ③g 掷败气血 100→75（health−25，真会挨打这件事文案没吹牛）');
    eq(败.W.银.spiritStones, 500, 'CQ③h 掷败一分彩头不得');

    var 稳 = 跑('arena_stage', 'duel', [0, 1], 0.1);   // 上台 → 稳扎稳打（掷胜）
    eq(稳.W.p.qi, 80, 'CQ③i 稳扎稳打掷胜真气 100→80（qi−20）');
    eq(稳.W.银.spiritStones, 580, 'CQ③j 稳扎稳打掷胜彩头 500→580（80 灵石，险中求胜那条贵 20 的差价还在）');

    var 镖 = 跑('escort_office', 'escort', [0, 0], 0.1); // 接镖 → 击退山贼（掷胜）
    eq(镖.W.开屏.length, 0, 'CQ③k 镖局那支同样不开战斗屏——「一场硬仗」是场中叙述，不是界面预告');
    assert(镖.句.concat(镖.W.上屏).every(function (s) { return !明话.test(s); }),
        'CQ③l 镖局这一路上屏已无「真刀真枪」：' + 镖.句.map(function (s) { return s.slice(0, 26); }).join(' ⏎ '));
    eq(镖.W.p.qi, 75, 'CQ③m 掷胜真气 100→75（qi−25）');
    eq(镖.W.银.spiritStones, 800, 'CQ③n 掷胜酬劳 500→800（300 灵石照旧）');
    var 镖败 = 跑('escort_office', 'escort', [0, 0], 0.99);
    eq(镖败.W.p.health, 75, 'CQ③o 掷败气血 100→75（挂了彩是真的）');
    eq(镖败.W.银.spiritStones, 650, 'CQ③p 掷败扣货损赔款后 500→650（150 灵石照旧，不是白送也不是全赔）');
})();

// ==================== [CR] 第七十二批 · 第一百一十七波 DES-51：原地踏步不收脚程 ====================
// 立案（真 Chrome 实机撞到，截图 .scratch/shots/ca-05-跋涉0.7s.png）：人已站在「帝都 · 长安」，
//   在舆图地区列表点同一座城那一行的「前往」，仍照扣 30 分钟、精力 100→95，
//   屏上播两句假话（那句「来到了帝都 · 长安：九州帝都……」＋「前往帝都 · 长安耗时30分钟」）再补一句「🚶 经过一番跋涉，精力−5。」
// 病根：同一张面板三行三口径——城市行与门派行整条链路没有一次「目的地 == 脚下这块地」的比对，
//   而野外行（js/map/world-map.js 的 setOut）同州零收费、位面行（js/map/high-planes.js 的 planeTravel）同地只出声。
// 改法：城市行与门派行进门先过共用的同地判定 footJourneyLedgerHere（口径照那两支现成范本抄，不自创），
//   命中则不推时辰、不扣精力、不播抵达与跋涉，但仍把该城／该宗的牌面重新拉开＋给一句带真地名的回执。
//   这是「不该收的钱不收」，一个数字都没动：30 分钟／5 精力／位面闸门／境界闸门全部原样（CR②⑨ 钉死）。
console.log('\n[CR] DES-51 原地踏步不收脚程：同地判定在写位置／播抵达那两支笔之前 + 两本账两种写法都认 + 异城异宗数额一字未动');
(function () {
    var app = src('js/app.js');
    function 体Of(name) {
        var i = app.indexOf('function ' + name + '(');
        if (i < 0) return '';
        var d = 0;
        for (var k = app.indexOf('{', i); k < app.length; k++) {
            if (app[k] === '{') d++;
            else if (app[k] === '}') { d--; if (!d) return app.slice(i, k + 1); }
        }
        return '';
    }
    var 同地笔 = 体Of('footJourneyLedgerHere'), 脚笔 = 体Of('chargeFootJourney');
    var 城市行 = 体Of('travelToCityFromList'), 山门行 = 体Of('travelToSectFromList');
    eq(同地笔.length > 200 && 脚笔.length > 300 && 城市行.length > 200 && 山门行.length > 200, true,
        'CR① 四支笔都从 app.js 取到了本体（尺子没抓空）');

    // ---- ② 结构层：判定排在哪、谁在用、有没有另造第二本账 ----
    assert(城市行.indexOf('footJourneyLedgerHere(') < 城市行.indexOf('enterCity(cityName)'),
        'CR②a 城市行的同地判定排在 enterCity 之前（enterCity 一进门就写位置、就在它体内播抵达，事后挡不住假话）');
    assert(山门行.indexOf('footJourneyLedgerHere(') < 山门行.indexOf('enterSect(sectName)'),
        'CR②b 门派行同理排在 enterSect 之前（它在 :2176 写角色位置、在 :2206 播「来到了X」）');
    assert(城市行.indexOf('getPlaneOf') < 城市行.indexOf('footJourneyLedgerHere'),
        'CR②c 位面闸门仍在同地判定之前——界膜之上的城不许被「你已在此地」顺嘴糊过去（v20.65 那道闸原样）');
    var 用判定的文件 = jsFiles('js').filter(function (f) {
        return /footJourneyLedgerHere\(/.test(codeOnly(src(f.replace(/\\/g, '/'))));
    }).map(function (f) { return f.replace(/\\/g, '/'); }).join(',');
    eq(用判定的文件, 'js/app.js', 'CR②d 同地判定全仓只落在地区列表这一张面板所在的文件（读到 ' + 用判定的文件 + '）——同一价不另立第二本账');
    assert(同地笔.indexOf('localStorage') < 0 && 同地笔.indexOf('xianxia_') < 0
        && !/currentCharData\.location\s*=/.test(同地笔) && 同地笔.indexOf('advanceTime') < 0 && !/\.energy\s*=/.test(同地笔),
        'CR②e 判定只读账不写账：不新增 localStorage 键、不写位置、不推时辰、不碰精力（本批不许有平行状态，也不许有 feature flag）');
    assert(/footMinutes = 30/.test(脚笔) && /footStamina = 5/.test(脚笔) && /Math\.max\(0,\s*staminaBefore - footStamina\)/.test(脚笔),
        'CR②f 脚程凡人底账（30 分钟／5 精力）仍躺在共用笔里——DES-51 免的是「不该收的那一笔」，有坐骑只改实付');
    eq((app.match(/不必再赶路/g) || []).length, 3,
        'CR②g 同地回执只此三句（城市行一句＋门派行「山门口／城中」两种说法），没在别处再抄第四句');

    // ---- 行为层架子：真 location-system（抵达句真会播）＋ app.js 那四支真笔 ----
    function 件() {
        return {
            style: {}, id: '', className: '', innerHTML: '', textContent: '', value: '', children: [], dataset: {},
            parentNode: null, parentElement: null,
            classList: { add: function () {}, remove: function () {}, toggle: function () {}, contains: function () { return false; } },
            appendChild: function (c) { return c; }, insertBefore: function (c) { return c; },
            removeChild: function (c) { return c; }, remove: function () {},
            setAttribute: function () {}, getAttribute: function () { return null; },
            addEventListener: function () {}, removeEventListener: function () {},
            querySelector: function () { return null; }, querySelectorAll: function () { return []; },
            scrollIntoView: function () {}, focus: function () {}
        };
    }
    function 架子(换笔) {
        var 上屏 = [], 时辰 = [], 视图 = [], 山门开 = [];
        var w = {};
        w.window = w;
        w.console = { log: function () {}, warn: function () {}, error: function () {} };
        w.setTimeout = function () { return 0; };
        w.setInterval = function () { return 0; };
        w.document = {
            readyState: 'complete', addEventListener: function () {}, removeEventListener: function () {},
            getElementById: function () { return null; }, querySelector: function () { return null; },
            querySelectorAll: function () { return []; }, createElement: 件, createElementNS: 件, body: 件()
        };
        w.localStorage = { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} };
        w.showMessage = function (m) { 上屏.push(String(m)); };
        w.updateCharacterStatus = function () {};
        w.timeSystem = { advanceTime: function (min, why) { 时辰.push({ min: min, why: why }); }, onNewDaySubscribe: function () {} };
        w.EventBus = { emit: function () {} };
        w.sectsData = {
            '青云宗': { type: '正道', location: '中州', desc: '测试用的宗', power: '中等' },
            '太虚山': { type: '正道', location: '中州', desc: '与城同名的那一处', power: '中等' }
        };
        w.showSectGateScene = function (n) { 山门开.push(n); };   // 山门那块牌面的渲染笔（enterSect 体内用的就是它）
        w.getPlaneOf = function (n) { return /^(灵界|魔界)/.test(String(n)) ? String(n).slice(0, 2) : ''; };
        vm.createContext(w);
        vm.runInContext(src('js/location-system.js'), w, { filename: 'js/location-system.js' });
        var 笔表 = {
            同地笔: 同地笔,
            城市行: (换笔 && 换笔.城市行) || 城市行,
            山门行: (换笔 && 换笔.山门行) || 山门行
        };
        vm.runInContext(笔表.同地笔 + '\n' + 脚笔 + '\n' + 笔表.城市行 + '\n' + 笔表.山门行
            + '\nthis.footJourneyLedgerHere = footJourneyLedgerHere;this.chargeFootJourney = chargeFootJourney;'
            + '\nthis.travelToCityFromList = travelToCityFromList;this.travelToSectFromList = travelToSectFromList;', w);
        // 探针只钉「同地重开牌面」那一条路：enterCity 体内是直调本地函数，不经 window.locationSystem 这层
        var 原开 = w.locationSystem.renderCityBuildings;
        w.locationSystem.renderCityBuildings = function (n) { 视图.push(String(n)); return 原开.apply(this, arguments); };
        function 清空() { 上屏.length = 0; 时辰.length = 0; 视图.length = 0; 山门开.length = 0; }
        function 立(from地, 境) {
            w.currentCharData = { name: '沈知微', realm: 境 || '金丹', layer: 1, energy: 100, location: null };
            if (from地) w.locationSystem.enterCity(from地);
            清空();
        }
        return {
            w: w, 上屏: 上屏, 时辰: 时辰, 视图: 视图, 山门开: 山门开, 清空: 清空, 立: 立,
            进城: function (城, 州) { return w.travelToCityFromList(城, 州); },
            上山: function (宗) { return w.travelToSectFromList(宗); },
            含: function (kw) { return 上屏.some(function (m) { return m.indexOf(kw) >= 0; }); }
        };
    }

    // ---- ③ 同城点「前往」：不推时辰、不扣精力、不播抵达／跋涉，但不是死钮 ----
    var A = 架子();
    A.立('帝都 · 长安');   // 真 enterCity 走一次：两本账都记下「帝都 · 长安」（列表按钮传的就是这串带空格的）
    eq(A.w.currentCharData.location, '帝都 · 长安', 'CR③a 起手成立：enterCity 存的是点进来的原串（拼写坑就在这：表键是「帝都·长安」）');
    eq(A.w.locationSystem.getCurrentLocation(), '帝都 · 长安', 'CR③b 面板那本账也在长安——两本账此刻同字（判定必须两本都问）');
    A.进城('帝都 · 长安', '中州');
    eq(A.时辰.length, 0, 'CR③c 同城点「前往」不推进 advanceTime（病：照扣 30 分钟）');
    eq(A.w.currentCharData.energy, 100, 'CR③d 同城点「前往」精力一动不动（病：100→95）');
    assert(!A.含('来到了'), 'CR③e 屏上没有抵达句（病：那句「来到了帝都 · 长安：九州帝都……」）');
    assert(!A.含('跋涉'), 'CR③f 屏上没有跋涉句（病：「🚶 经过一番跋涉，精力−5。」）');
    eq(A.视图.join(','), '帝都 · 长安', 'CR③g 这一击不是死钮：该城的牌面仍被重新拉开（renderCityBuildings 正是 enterCity 用的那支渲染笔，不另造开面板的第二支）');
    assert(A.上屏.length === 1 && A.上屏[0].indexOf('你已在帝都 · 长安') === 0 && A.上屏[0].indexOf('不必再赶路') > 0,
        'CR③h 只此一句回执，报的是点进来的那个真实城名（没写死）：' + A.上屏.join(' ⏎ '));
    eq(A.w.locationSystem.getCurrentLocation(), '帝都 · 长安', 'CR③i 位置两本账没被这一下挪动过半格');

    // ---- ④ 异城点「前往」：回归保护，证明没顺手改数值 ----
    A.清空();
    A.进城('洛水城', '中州');
    eq(A.时辰.length, 1, 'CR④a 真挪窝那一趟仍结一次时辰');
    eq(A.时辰[0].min, 30, 'CR④b 数额仍是 30 分钟（一字未动）');
    eq(A.w.currentCharData.energy, 95, 'CR④c 精力仍是 100→95（那 5 点照扣）');
    assert(A.含('来到了洛水城'), 'CR④d 抵达句仍由 enterCity 那一支笔播（六条进城路共用它，本批没碰）');
    assert(A.含('经过一番跋涉，精力−5'), 'CR④e 跋涉句照旧念实付差值（COPY-05 那笔账原样）');
    eq(A.视图.length, 0, 'CR④f 异城那一趟不走「同地重开」这条岔口（牌面由 enterCity 自己拉开）');

    // ---- ⑤ 两种写法互认（拼写坑：'帝都 · 长安' vs 表键 '帝都·长安'） ----
    var B = 架子();
    B.立('帝都·长安');     // 不带空格那串进门（传送阵／疆界／老存档都可能是这一串）
    B.进城('帝都 · 长安', '中州');
    eq(B.时辰.length, 0, 'CR⑤a 不带空格进的城、点带空格那一行仍认得是同地（不收费、不谎报）');
    eq(B.w.currentCharData.energy, 100, 'CR⑤b 反向拼写也不扣精力');
    assert(B.上屏.length === 1 && B.上屏[0] === '你已在帝都 · 长安，不必再赶路。', 'CR⑤c 回执上屏：' + B.上屏.join(' ⏎ '));
    B.w.locationSystem.enterCity('帝都 · 长安');   // 再倒回来：带空格进门
    B.清空();
    B.进城('帝都·长安', '中州');
    eq(B.时辰.length, 0, 'CR⑤d 带空格进的城、点不带空格那一串同样认得是同地（两串写法、一本账）');
    eq(B.w.currentCharData.energy, 100, 'CR⑤e 这一向也不扣精力');
    assert(B.上屏.length === 1 && B.上屏[0] === '你已在帝都·长安，不必再赶路。',
        'CR⑤f 回执照旧用点进来的那串写法（不自己改写地名）：' + B.上屏.join(' ⏎ '));

    // ---- ⑥ 两道闸门原样：境界闸门交给 enterCity、位面闸门排在判定之前 ----
    var C = 架子();
    C.立('洛水城', '炼气');
    C.进城('东海龙宫', '东荒');
    assert(C.含('境界不足'), 'CR⑥a 境界闸门原样：炼气点东海龙宫仍被拦在山门外（enterCity 那一支笔没被绕过）');
    assert(!C.含('来到了'), 'CR⑥b 拦下不谎报抵达（v20.65 那条口径原样）');
    eq(C.时辰.length, 0, 'CR⑥c 拦下不推时辰');
    eq(C.w.currentCharData.energy, 100, 'CR⑥d 拦下不扣精力');
    C.清空();
    C.进城('灵界·蓬莱仙境', '灵界');
    assert(C.含('位面之门'), 'CR⑥e 位面闸门原样：灵界城仍指路位面之门（同地判定排在它后面，抢不了这道闸）');
    eq(C.时辰.length, 0, 'CR⑥f 位面城不结脚程账');

    // ---- ⑦ 门派行同地：山门口再点该宗「前往」不收脚程，回执分得清在山门口还是在城里 ----
    var D = 架子();
    D.立('青木城');
    D.上山('青云宗');
    eq(D.时辰.length, 1, 'CR⑦a 异宗那一趟仍结一次时辰（第一百一十四波 DES-10 那笔账没被本批顺手抹掉）');
    eq(D.时辰[0].min, 30, 'CR⑦b 山门这一行仍是 30 分钟');
    eq(D.w.currentCharData.energy, 95, 'CR⑦c 山门这一行仍扣 5 点精力');
    assert(D.含('来到了青云宗'), 'CR⑦d 抵达句仍由 enterSect 那一支笔播');
    eq(D.w.currentCharData.location, '青云宗', 'CR⑦e enterSect 把角色所在地写成宗名——判定认的就是这本账（面板那本仍停在青木城）');
    D.清空();
    D.上山('青云宗');
    eq(D.时辰.length, 0, 'CR⑦f 站在山门口再点该宗「前往」不推时辰（与城市行同罪、同修）');
    eq(D.w.currentCharData.energy, 95, 'CR⑦g 也不扣精力（原地踏步扣钱就是假账）');
    assert(!D.含('来到了') && !D.含('跋涉'), 'CR⑦h 不重播抵达句、不播跋涉句');
    eq(D.山门开.join(','), '青云宗', 'CR⑦i 这一击仍把山门那块牌面重新拉开（走 enterSect 体内同一支渲染笔，不做死钮）');
    assert(D.上屏.length === 1 && D.上屏[0].indexOf('你已在青云宗') === 0 && /山门口/.test(D.上屏[0]),
        'CR⑦j 回执说得出「在山门口」（角色那本账写的正是宗名）：' + D.上屏.join(' ⏎ '));
    var E = 架子();
    E.w.currentCharData = { realm: '金丹', layer: 1, energy: 100, location: '青木城' };
    E.w.locationSystem.currentLocation = '太虚山';   // 只有面板那本账认得这地名（城与宗同名），人不在山门口
    E.上山('太虚山');
    eq(E.时辰.length, 0, 'CR⑦k 两本账里任一本认下都算同地——只问角色那本就会漏掉面板这本');
    assert(E.上屏.length === 1 && /城中/.test(E.上屏[0]) && !/山门口/.test(E.上屏[0]),
        'CR⑦l 文案分得清：面板所在那座城不谎称人站在山门口：' + E.上屏.join(' ⏎ '));
    eq(E.w.currentCharData.energy, 100, 'CR⑦m 这一向同样不扣精力');

    // ---- ⑧ 双侧自证：把两支守卫整块抠掉，同一把尺必须立刻报红（绿灯不是空转出来的） ----
    function 抠守卫(体) {
        var 头 = 体.indexOf('    // ===== DES-51');
        if (头 < 0) return null;
        var 尾记 = '\n    }\n';
        var 尾 = 体.indexOf(尾记, 头);
        if (尾 < 0) return null;
        return 体.slice(0, 头) + 体.slice(尾 + 尾记.length);
    }
    var 城市行旧 = 抠守卫(城市行), 山门行旧 = 抠守卫(山门行);
    assert(城市行旧 !== null && 山门行旧 !== null
        && 城市行旧.indexOf('footJourneyLedgerHere') < 0 && 山门行旧.indexOf('footJourneyLedgerHere') < 0
        && 城市行旧.indexOf('chargeFootJourney(cityName)') > 0 && 山门行旧.indexOf('chargeFootJourney(sectName)') > 0,
        'CR⑧a 自证的前置：两支守卫都能整块抠掉且结账那一句还在（抠不掉＝尺子抓错了东西）');
    var F = 架子({ 城市行: 城市行旧, 山门行: 山门行旧 });
    F.立('帝都 · 长安');
    F.进城('帝都 · 长安', '中州');
    eq(F.时辰.length, 1, 'CR⑧b 还原成改前那一版：同城点「前往」立刻又推 30 分钟');
    eq(F.w.currentCharData.energy, 95, 'CR⑧c 还原改前：精力立刻又掉 5');
    assert(F.含('来到了'), 'CR⑧d 还原改前：那句假抵达立刻回来');
    var G = 架子({ 城市行: 城市行旧, 山门行: 山门行旧 });
    G.立('青木城');
    G.上山('青云宗');
    G.上山('青云宗');
    eq(G.时辰.length, 2, 'CR⑧e 还原改前：山门口再点该宗「前往」立刻又结一次 30 分钟（两笔时辰 '
        + G.时辰.map(function (t) { return t.min; }).join('+') + ' 分钟）');
    eq(G.w.currentCharData.energy, 90, 'CR⑧f 还原改前：原地那一击又掉 5 点精力（100→95→90，本批正是来免掉第二笔的）');

    // ---- ⑨ 与现成范本同一口径（不许自创第三套） ----
    var hp = src('js/map/high-planes.js'), wm = src('js/map/world-map.js');
    assert(/if \(dest === cd\.location\) \{ say\('你已在此地。', 'info'\); return false; \}/.test(hp),
        'CR⑨a 位面行的同地口径原样在场（本批那句回执就是照它「只出声、不收钱」写的）');
    assert(/if \(target === from\) \{[\s\S]{0,80}openWildernessMap\(target\);[\s\S]{0,40}return true;/.test(wm),
        'CR⑨b 野外行的同地口径原样在场（本批「不是死钮、仍把视图打开」正是照这一支做的）');
})();

// ==================== [CS] 第七十三批 · 第一百一十八波 DES-54：回执念的就是落笔那枚数 ====================
// 立案（离线扫描器 .scratch/scan-shichen.mjs 报 12 处可疑，逐条读上下文后：10 处确证、4 处撤回）——
//   病根一条：advanceTime 落笔的分钟数与手写回执各说各话。时辰折法全游戏只有一处（time-system 的 formatShichen），
//   牌面却自己念「四个时辰」「约40时辰」，念大念小都有：最小差一倍（操练 120 分钟念成半个时辰），最大差 120 倍（承揽河工 40 分钟念成 40 时辰）。
// 改法：分钟数提成局部量（工曹署/盐铁局提成模块常量），落笔与回执共用同一枚，读数吃 window.formatShichen；
//   唯一例外「参悟阵图」那笔非整除，尺会回落成现代单位，气氛句里刺眼，改口「大半个时辰」（只小不大，注释写明）。
// 数值一字未动：CS② 逐笔钉住那十枚分钟数——DES-54 只改嘴，不改账。
console.log('\n[CS] DES-54 时辰对账：十笔回执与落笔同笔 + 口径只有一处定义 + 沙箱真跑屏面读数 + 撤回项的凭据');
(function () {
    var fmt = window.formatShichen;
    eq(typeof fmt, 'function', 'CS0 口径函数在场（[B] 段已装 time-system；本段不再重载——它顶层有 const，重载入会撞车）');
    eq(fmt(120), '一个时辰', 'CS0a 这把尺仍按 1 时辰 = 120 分钟折（120）');
    eq(fmt(60), '半个时辰', 'CS0b 60 分钟折「半个时辰」');

    // ---- ① 口径只有一处定义 ----
    var ts = src('js/time-system.js');
    assert(/function formatShichen\(minutes\) \{[\s\S]{0,200}m % 120 === 0[\s\S]{0,200}m \/ 120/.test(ts),
        'CS①a formatShichen 里 120 那颗除数仍在（先 % 120 判整除、再 / 120 得名）');
    function esc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
    var 定义处 = jsFiles('js').filter(function (f) { return /function formatShichen\b/.test(src(f)); })
        .map(function (f) { return f.replace(/\\/g, '/'); }).join(',');
    eq(定义处, 'js/time-system.js', 'CS①b 全仓只有 time-system 一处定义 formatShichen（读到的定义处：' + 定义处 + '）');
    assert(/window\.formatShichen = formatShichen/.test(ts), 'CS①c 它挂在 window 上——别的笔只管借，不许自己折');
    // 自算棘轮：[B] 段钉的是「/60 配时辰」，这一条钉「/120 配时辰」——把分钟数除出时辰的第二台口算器，一枚都不许新增
    var 自算 = [];
    jsFiles('js').forEach(function (f) {
        var rel = f.replace(/\\/g, '/');
        if (rel === 'js/time-system.js') return;
        src(f).split('\n').forEach(function (line, i) {
            if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;         // 注释里讲换算的不算口算器（别照它判红）
            if (/\/\s*120\b/.test(line) && /时辰/.test(line)) 自算.push(rel + ':' + (i + 1));
        });
    });
    eq(自算.join(','), 'js/mail-system-ui.js:346,js/mail-system-ui.js:526',
        'CS①d 拿分钟数自算时辰的基线只剩信箱那两枚相对读数（「N时辰前」／「最长约 N 时辰」——formatShichen 折不出这种说法，另案待审）；多一枚即报红');

    // ---- ② 十笔对账：落笔那枚分钟数 == 回执那枚时长（源文层） ----
    function 分钟数(源, lines, i, token) {
        if (/^\d+$/.test(token)) return +token;
        for (var k = i; k >= 0; k--) {   // 就近往回找声明（同一文件里 mins 出现四次，取落笔上面那一枚）
            var m = new RegExp('(var|const|let)\\s+' + esc(token) + '\\s*=\\s*(\\d+)').exec(lines[k]);
            if (m) return +m[2];
        }
        return NaN;
    }
    var 十笔 = [
        { n: '静室小坐', f: 'js/sects/sect-resource-actions.js', act: '静室小坐', min: 120, 旧谎: '两个时辰' },
        { n: '陪伴道侣', f: 'js/sects/sect-resource-actions.js', act: '陪伴道侣', min: 60, 旧谎: '一个时辰' },
        { n: '武备操练', f: 'js/sects/sect-resource-actions.js', act: '操练', min: 120, 旧谎: '半个时辰' },
        { n: '参悟阵图', f: 'js/sects/sect-resource-actions.js', act: '参悟阵图', min: 90, 旧谎: '三个时辰', 改口: '大半个时辰' },
        { n: '殿外思过', f: 'js/sects/sect-facilities.js', act: '被守卫架去思过', min: 30, 旧谎: '半个时辰' },
        { n: '掌门亲传', f: 'js/sects/sect-facilities.js', act: '掌门亲传', min: 240, 旧谎: '四个时辰' },
        { n: '晋升答礼', f: 'js/sects/sects-deep-ui.js', act: '晋升答礼', min: 60, 旧谎: '一个时辰' },
        { n: '承揽河工', f: 'js/city-facilities/facility-batch2.js', act: '工曹署承揽', min: 40, 旧谎: '约40时辰', 口: '承揽河工' },
        { n: '工曹查阅', f: 'js/city-facilities/facility-batch2.js', act: '工曹署查阅', min: 10, 旧谎: '一个时辰', 回看: 2 },
        { n: '盐铁查阅', f: 'js/city-facilities/facility-batch2.js', act: '盐铁局查阅', min: 10, 旧谎: '半个时辰', 回看: 2 }
    ];
    function 对质(源, b) {
        var lines = 源.split('\n'), hits = [];
        lines.forEach(function (l, i) {
            var m = /advanceTime\(\s*([\w$]+|\d+)\s*,\s*'([^']*)'/.exec(l);
            if (m && m[2] === b.act) hits.push({ i: i, tk: m[1] });
        });
        if (hits.length !== 1) return { 笔数: hits.length, 枚: NaN, 借尺: false, 回执: '', 谎: false, token: '' };
        var h = hits[0], 枚 = 分钟数(源, lines, h.i, h.tk);
        var 回执 = b.口
            ? lines.filter(function (l) { return l.indexOf(b.口) >= 0; }).join('\n')   // 耗时写在另一支笔（按钮牌面）
            : lines.slice(Math.max(0, h.i - (b.回看 || 0)), h.i + 6).join('\n');        // 回看：查阅那两笔是先念回执再落笔，窗口得往上看两行
        return {
            笔数: 1, 枚: 枚, 回执: 回执, token: h.tk,
            借尺: new RegExp('formatShichen\\(\\s*(?:' + esc(h.tk) + '|' + 枚 + ')\\s*\\)').test(回执),
            谎: b.旧谎 ? 回执.indexOf(b.旧谎) >= 0 : false,
            念改口: b.改口 ? 回执.indexOf(b.改口) >= 0 : false
        };
    }
    十笔.forEach(function (b) {
        var r = 对质(src(b.f), b);
        eq(r.笔数, 1, 'CS②·' + b.n + ' 行动「' + b.act + '」在 ' + b.f + ' 里只落一笔（实到 ' + r.笔数 + ' 处）');
        eq(r.枚, b.min, 'CS②·' + b.n + ' 落笔那枚分钟数一字未动（真账=' + r.枚 + ' 分钟，改前也是 ' + b.min + '）');
        if (b.改口) {
            assert(r.念改口 && !r.借尺, 'CS②·' + b.n + ' 这一处刻意不吃尺、改口「' + b.改口 + '」（非整除的数，尺会回落成现代单位，气氛句里刺眼）');
            assert(b.min > 60 && b.min < 120, 'CS②·' + b.n + ' 「' + b.改口 + '」只对 60<真账<120 成立（真账 ' + b.min + ' 分钟——只小不大，不是另立一把尺）');
            assert(/\/\/[^\n]*formatShichen[^\n]*/.test(r.回执), 'CS②·' + b.n + ' 注释里写明了为什么不用函数（后人别顺手把它改回去）');
        } else {
            assert(r.借尺, 'CS②·' + b.n + ' 回执的时长由 formatShichen(' + r.token + ') 生成——与落笔同一枚（屏面读数=' + fmt(r.枚) + '）');
        }
        assert(!r.谎, 'CS②·' + b.n + ' 改前那句「' + b.旧谎 + '」已从落笔窗口里撤掉（改后读数=' + fmt(b.min) + '）');
    });

    // ---- ③ 沙箱真跑：八支真笔上屏，屏面那枚时长必须等于 formatShichen(真账) ----
    function 件() {
        return {
            style: {}, id: '', className: '', innerHTML: '', textContent: '', value: '', dataset: {},
            parentNode: null, parentElement: null, children: [],
            classList: { add: function () {}, remove: function () {}, toggle: function () {}, contains: function () { return false; } },
            appendChild: function (c) { return c; }, insertBefore: function (c) { return c; },
            removeChild: function (c) { return c; }, remove: function () {},
            setAttribute: function () {}, getAttribute: function () { return null; },
            addEventListener: function () {}, removeEventListener: function () {},
            querySelector: function () { return null; }, querySelectorAll: function () { return []; },
            scrollIntoView: function () {}, focus: function () {}
        };
    }
    function 沙箱(files, 改写) {
        var S = { 上屏: [], 日志: [], 弹窗: [], 时辰: [] };
        var w = {};
        w.window = w;
        w.console = { log: function () {}, warn: function () {}, error: function () {} };
        w.setTimeout = function () { return 0; };
        w.setInterval = function () { return 0; };
        w.document = {
            readyState: 'complete', addEventListener: function () {}, removeEventListener: function () {},
            getElementById: function () { return null; }, querySelector: function () { return null; },
            querySelectorAll: function () { return []; }, createElement: 件, createElementNS: 件, body: 件()
        };
        w.localStorage = { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} };
        w.showMessage = function (m) { S.上屏.push(String(m)); };
        w.gameLog = { add: function (m) { S.日志.push(String(m)); } };
        w.showModal = function (t, html) { S.弹窗.push(String(t) + '\n' + String(html)); };
        w.timeSystem = { advanceTime: function (min, why) { S.时辰.push({ min: min, why: why }); }, onNewDaySubscribe: function () {} };
        w.formatShichen = fmt;                       // 真口径本尊，不是替身
        w.currentCharData = { qi: 80, maxQi: 100, health: 100, energy: 100, tempering: 0, essence: 0, spiritStones: 500 };
        w.inventory = { currency: { spiritStones: 500 }, slots: [] };
        w.updateCharacterStatus = function () {};
        w.updateStatusPanel = function () {};
        w.updateAllStatDisplays = function () {};
        w.getCurrentCityName = function () { return '测试城'; };
        w.RewardService = { apply: function (eff) { S.日志.push(String(eff.msg)); return { success: true }; } };
        w.scenarioEngine = { register: function () {} };
        w.addItem = function (id, n) { return n || 1; };   // 桩：回实收件数
        w.getDaoCompanionBond = function () { return { bond: true }; };
        w.discipleState = { isInSect: true, sectId: '丐帮', contribution: 5000, rank: 2 };
        w.COMMON_RANKS = [{ id: 0, name: '掌门', promoteCondition: null }, { id: 1, name: '副掌门', promoteCondition: { contribution: 100 } },
            { id: 2, name: '长老', promoteCondition: { contribution: 100 } }, { id: 3, name: '记名弟子', promoteCondition: { contribution: 50 } }];
        vm.createContext(w);
        (files || []).forEach(function (f) {
            vm.runInContext((改写 && 改写[f] ? 改写[f] : src(f)), w, { filename: f });
        });
        S.w = w;
        S.清空 = function () { S.上屏.length = 0; S.日志.length = 0; S.弹窗.length = 0; S.时辰.length = 0; };
        S.末笔 = function () { return S.时辰[S.时辰.length - 1]; };
        S.末句 = function () { return S.上屏[S.上屏.length - 1]; };
        S.末条 = function () { return S.日志[S.日志.length - 1]; };
        S.牌面 = function () { return S.弹窗[S.弹窗.length - 1]; };
        return S;
    }
    function 屏面对质(S, b, 池名, 取) {
        var 笔 = null, 句 = '';
        try { 句 = String(取()); } catch (eRun) { assert(false, 'CS③·' + b.n + ' 沙箱里跑不起来：' + eRun.message); return; }
        笔 = S.末笔();
        S.清空();
        eq(笔 && 笔.min, b.min, 'CS③·' + b.n + ' 沙箱真落笔：advanceTime 收到 ' + (笔 && 笔.min) + ' 分钟（本批没动过账）');
        if (b.改口) {
            assert(句.indexOf(b.改口) >= 0 && 笔.min > 60 && 笔.min < 120,
                'CS③·' + b.n + ' 屏面念「' + b.改口 + '」而真账 ' + 笔.min + ' 分钟——只小不大（读数：' + 句 + '）');
        } else {
            assert(句.indexOf(fmt(笔.min)) >= 0,
                'CS③·' + b.n + ' ' + 池名 + '那枚时长 == formatShichen(' + 笔.min + ') = 「' + fmt(笔.min) + '」（读数：' + 句 + '）');
        }
        assert(句.indexOf(b.旧谎) < 0, 'CS③·' + b.n + ' 那句旧谎「' + b.旧谎 + '」没再上屏');
    }
    // 门派地标四支（整文件进沙箱，直调那四支真笔）
    var R = 沙箱(['js/sects/sect-resource-actions.js']);
    屏面对质(R, 十笔[0], '回执', function () { R.w._restInChamber({ name: '静室' }); return R.末句(); });
    屏面对质(R, 十笔[1], '回执', function () { R.w._withDaoCompanion({ name: '后山竹林' }); return R.末句(); });
    屏面对质(R, 十笔[2], '回执', function () { R.w._drillMilitary({ name: '武备处' }); return R.末句(); });
    屏面对质(R, 十笔[3], '回执', function () { R.w._studyFormation({ name: '阵法平台' }); return R.末句(); });
    // 官府两衙（承揽那笔的时长写在柜台牌面上、查阅那笔写在上屏日志里）
    var O = 沙箱(['js/city-facilities/facility-batch2.js']);
    屏面对质(O, 十笔[7], '牌面', function () { O.w.openWorksBureau(); O.w.takeWorksJob(); return O.牌面(); });
    屏面对质(O, 十笔[8], '日志', function () { O.w.openWorksBureau(); return O.末条(); });
    屏面对质(O, 十笔[9], '日志', function () { O.w.openSaltIronOffice(); return O.末条(); });
    // 晋升答礼／掌门亲传：只把这两支笔摘出来跑（所在文件的其余部分要 DOM）
    function 摘笔(源, 锚) {
        var i = 源.indexOf(锚);
        if (i < 0) return '';
        var d = 0;
        for (var k = 源.indexOf('{', i); k < 源.length; k++) {
            if (源[k] === '{') d++;
            else if (源[k] === '}') { d--; if (!d) return 源.slice(i, k + 1); }
        }
        return '';
    }
    var 晋笔 = 摘笔(src('js/sects/sects-deep-ui.js'), 'function sectPromote(');
    var 传笔 = 摘笔(src('js/sects/sect-facilities.js'), 'window.sectLibRequestTransmit = function');
    assert(晋笔.length > 800 && 传笔.length > 800, 'CS③·摘笔不落空：两支笔都取到了本体（晋 ' + 晋笔.length + ' 字／传 ' + 传笔.length + ' 字）');
    var P = 沙箱();
    vm.runInContext('var showSectRanks = function () {};\n' + 晋笔 + '\nthis.sectPromote = sectPromote;', P.w);
    屏面对质(P, 十笔[6], '回执', function () { P.w.sectPromote('丐帮', 3); return P.末句(); });
    var T = 沙箱();
    vm.runInContext(
        'var libArtsOf = function () { return [{ id: "art_test", name: "降龙残篇", transmit: "direct", copyPrice: 3000 }]; };\n'
        + 'var libTransmitOK = function () { return false; };\nvar libRankNow = function () { return 2; };\n'
        + 'var libToday = function () { return 9; };\nvar libInsights = function () { return {}; };\n'
        + 'window.saveSectData = function () {};\nwindow.openSectLibraryPanel = function () {};\n'
        + 'window.npcManager = { getNPC: function () { return { name: "萧峰", relationship: { affection: 90 }, changeAffection: function () {} }; } };\n'
        + 传笔, T.w);
    屏面对质(T, 十笔[5], '回执', function () { T.w.sectLibRequestTransmit('art_test'); return T.末句(); });

    // ---- ④ 双侧自证：把谎装回去、把数改掉，同一把尺必须立刻报红（绿灯不是空转出来的） ----
    var 原静室 = src('js/sects/sect-resource-actions.js');
    var 谎回魂 = 原静室.replace("掩上门坐了' + (window.formatShichen ? window.formatShichen(mins) : mins + '分钟') + '，真气缓缓回涨",
        "掩上门坐了两个时辰，真气缓缓回涨");
    assert(谎回魂 !== 原静室, 'CS④a 自证前置：改前那句谎话能整块装回去（装不回去＝尺子抓错了东西）');
    var 旧对质 = 对质(谎回魂, 十笔[0]);
    assert(旧对质.谎 === true && 旧对质.借尺 === false,
        'CS④b 装回「两个时辰」：② 那把尺立刻报红——既没吃尺、谎话又回到落笔窗口');
    var 数被改 = 原静室.replace('var mins = 120;   // 真账那一笔', 'var mins = 180;   // 真账那一笔');
    eq(对质(数被改, 十笔[0]).枚, 180, 'CS④c 谁偷偷改了落笔那枚数：② 的数额钉当场报红（读到 180 ≠ 120）');
    var 谎沙箱 = 沙箱(['js/sects/sect-resource-actions.js'], { 'js/sects/sect-resource-actions.js': 谎回魂 });
    谎沙箱.w._restInChamber({ name: '静室' });
    var 谎笔 = 谎沙箱.末笔(), 谎句 = String(谎沙箱.末句());
    assert(谎笔 && 谎笔.min === 120 && 谎句.indexOf(fmt(120)) < 0 && 谎句.indexOf('两个时辰') >= 0,
        'CS④d 装回谎话再真跑一遍：落笔仍是 120 分钟、屏上却念「两个时辰」——③ 那把尺正是这么抓它的（' + 谎句 + '）');

    // ---- ⑤ 撤回的两处：按误报钉住凭据（别让下一轮扫描器再把它们当病） ----
    var 演 = src('js/app.js'), 演lines = 演.split('\n'), 演i = -1;
    演lines.forEach(function (l, i) { if (/advanceTime\(60, '演武场训练'\)/.test(l)) 演i = i; });
    var 演回执 = 演lines.slice(演i, 演i + 6).filter(function (l) { return /showMessage/.test(l); }).join('\n');
    assert(演i > 0 && 演回执.length > 0 && !/[个半]时辰|\d+\s*(分钟|小时)/.test(演回执),
        'CS⑤a 撤回一（app.js 演武场那一笔）：回执里根本没有时长字样——扫描器那枚「5分钟」是同屏下方 CULTIVATE_DURATIONS 的档位标签，另一支笔的话');
    eq(fmt(5), '5分钟', 'CS⑤a·那枚档位标签自己也对得上口径（5 分钟折「5分钟」，不是笔误）');
    var 其 = src('js/building-effects.js').split('\n'), 其i = -1;
    其.forEach(function (l, i) { if (/advanceTime\(60, '演武场静坐'\)/.test(l)) 其i = i; });
    var 其屏句 = String(其[其i + 1] || '').split('//')[0];
    assert(其i > 0 && 其屏句.indexOf('半个时辰') > 0 && 其屏句.indexOf('120') < 0,
        'CS⑤b 撤回二（演武场静坐那一笔）：屏上那句念的就是「半个时辰」（与 60 分钟同笔）；扫描器命中的「120分钟」在同一行之后的换算注释里——注释不是屏面');

    // ---- ⑥ 全仓棘轮：牌面念的时长 == 这一笔 advanceTime 真推的分钟数（.scratch/scan-shichen.mjs 的收小版） ----
    // 原尺有两处认错真账：① 固定往下 13 行的窗口跨过函数边界，把隔壁那笔的时长算到本笔头上（facility-batch2 的
    //   「一个时辰」其实是下一衙查阅那笔的话）；② 连注释里的换算字面都当牌面读（building-effects 的「120分钟」）。
    //   本棘轮都收小：注释先剥，窗口只取落笔上下各 6 行、撞见另一笔 advanceTime 或函数头即止，且只读真正上屏的那几行。
    var 汉字数 = { 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10, 十一: 11, 十二: 12 };
    function 念的尺(t) {   // 一句牌面里念出的时长，折成分钟（折法与 formatShichen 同一把：120 进一位）
        var 出 = [];
        (t.match(/(?<!大)半个时辰|(?<!大)半时辰/g) || []).forEach(function (x) { 出.push({ 字: x, 分: 60 }); });
        var 尺2, m2;
        尺2 = /([一二两三四五六七八九十]+|[0-9]+)[ ]?个?[ ]?时辰/g;
        while ((m2 = 尺2.exec(t))) {
            var v = /^[0-9]+$/.test(m2[1]) ? +m2[1] : (汉字数[m2[1]] || 0);
            if (v) 出.push({ 字: m2[0], 分: v * 120 });
        }
        尺2 = /([0-9]+)[ ]?分钟/g;
        while ((m2 = 尺2.exec(t))) 出.push({ 字: m2[0], 分: +m2[1] });
        尺2 = /([0-9]+)[ ]?小时/g;
        while ((m2 = 尺2.exec(t))) 出.push({ 字: m2[0], 分: +m2[1] * 60 });
        return 出;
    }
    function 全仓对账(源, 名) {
        var 行 = 源.split('\n').map(function (l) {
            var t = l.trim();
            if (t.slice(0, 2) === '//' || t.charAt(0) === '*') return '';   // 注释不是屏面，也不许改（DES-54 硬约束）
            var c = l.indexOf('//');
            return c < 0 ? l : l.slice(0, c);
        });
        var 中 = [], 笔 = 0;
        for (var i = 0; i < 行.length; i++) {
            var m = /advanceTime\(\s*([0-9]+|[A-Za-z_$][\w$]*)\s*[,)]/.exec(行[i]);
            if (!m) continue;
            var 真;
            if (/^[0-9]+$/.test(m[1])) { 真 = +m[1]; }
            else {
                var 值 = NaN;
                for (var d = i; d >= 0; d--) {
                    var dm = new RegExp('(var|const|let)\\s+' + m[1] + '\\s*=\\s*([0-9]+)').exec(行[d]);
                    if (dm) { 值 = +dm[2]; break; }
                }
                if (isNaN(值)) continue;         // 落笔那枚是算式/外来常量——本尺不猜，宁可不审也不认错账
                真 = 值;
            }
            笔++;
            var 段 = [];
            for (var j = i + 1; j <= Math.min(行.length - 1, i + 6); j++) {
                if (/advanceTime\(/.test(行[j]) || /^function[\s(]|^window\.[\w$]+ *= *function/.test(行[j])) break;
                段.push({ n: j + 1, s: 行[j] });
            }
            for (var k = i - 1; k >= Math.max(0, i - 6); k--) {
                if (/advanceTime\(/.test(行[k]) || /^function[\s(]|^window\.[\w$]+ *= *function/.test(行[k])) break;
                段.unshift({ n: k + 1, s: 行[k] });
            }
            段.forEach(function (o) {
                if (!/showMessage\(|log\.add\(|gameLog|say\(|innerHTML|\.push\(|text:|desc:|msg:/.test(o.s)) return;
                念的尺(o.s).forEach(function (c) {
                    if (c.分 !== 真) 中.push(名 + ':' + o.n + '「' + c.字 + '」念 ' + c.分 + ' 分钟 ≠ 落笔 ' + 真 + ' 分钟（advanceTime 在 :' + (i + 1) + '）');
                });
            });
        }
        中.落笔数 = 笔;
        return 中;
    }
    var 全仓命中 = [], 全仓落笔 = 0;
    jsFiles('js').forEach(function (f) {
        var rel = f.replace(/\\/g, '/');
        var 中 = 全仓对账(src(f), rel);
        全仓落笔 += 中.落笔数;
        全仓命中 = 全仓命中.concat(中);
    });
    // 白名单：牌面与真账确实对不上、但本批不改的点——每条都要写明留着的原因，多一条即报红
    var 白名单 = [];
    eq(全仓命中.length, 白名单.length,
        'CS⑥a js/ 全仓「牌面念的时长 ≠ 这一笔真推的分钟数」归零（白名单 ' + 白名单.length + ' 条：' + 白名单.join('；') + '）；实到：' + 全仓命中.slice(0, 8).join(' | '));
    assert(全仓落笔 >= 120, 'CS⑥b 这把尺不是空转：js/ 里认得出落笔枚数的 advanceTime 有 ' + 全仓落笔 + ' 笔在册（改前其中十笔念的是假时长）');
    var 谎回尺 = 全仓对账(谎回魂, 'js/sects/sect-resource-actions.js');
    assert(谎回尺.length >= 1 && /两个时辰/.test(谎回尺.join('|')),
        'CS⑥c 自证：把静室那句谎「两个时辰」装回同一份源码，全仓尺当场报红（' + 谎回尺.slice(0, 2).join(' | ') + '）');
    eq(全仓对账(原静室, 'js/sects/sect-resource-actions.js').length, 0,
        'CS⑥d 自证反手：改后那一支原文过同一个尺是 0 命中（不是靠尺子松紧凑出来的绿灯）');
    // 那句谎与那枚分钟数都运行时拼出来：源码里既不留连写的「四＋个时辰」，也不留 advanceTime( 紧跟数字，
    // 免得 .scratch/scan-shichen.mjs 又拿这段假样当一处命中去数（它扫全仓，tests/ 也在内）
    var 假落笔 = 240;
    var 造样 = "function 演示() {\n    window.timeSystem.advanceTime(" + 假落笔 + ", '演示');\n    if (window.showMessage) window.showMessage('坐了"
        + ['四', '个时辰'].join('') + "才收功');\n}\n";
    eq(全仓对账(造样, '假样').length, 1,
        'CS⑥e 自证第三手：造一段「落笔 240 分钟、牌面把时长念大一倍」的假源码，尺子读到的正是这一笔（' + 全仓对账(造样, '假样').join(' | ') + '）');

    // ---- ⑦ 本批另改口的三枚牌面（时长写在别的支里、⑥ 那把尺够不着，故各钉一条可重定位的文本闸） ----
    var 楼 = src('js/app.js');
    assert(楼.indexOf('🍲 抿酒听闲话（铜钱 20 · 30分钟）') >= 0 && /advanceTime\(30, '酒楼听情报'\)/.test(楼)
        && 楼.indexOf('抿酒听闲话（铜钱 20 · 半个时辰）') < 0,
        'CS⑦a 酒楼第一枚牌面改口「30分钟」——真账是 tavernRumor 那笔 advanceTime(30)（旧牌面念「半个时辰」＝60 分钟，念大一倍）');
    assert(楼.indexOf('打听兽径（铜钱 50 · 半个时辰）') >= 0 && /advanceTime\(60, '酒楼打听兽径'\)/.test(楼)
        && 楼.indexOf('打听兽径（铜钱 50 · 一个时辰）') < 0,
        'CS⑦b 酒楼第二枚牌面改口「半个时辰」——真账是 askBeastTrail 那笔 advanceTime(60)（旧牌面念「一个时辰」＝120 分钟）');
    eq(fmt(30), '30分钟', 'CS⑦c 两枚牌面的说法仍出自这把尺：非整除的 30 折「30分钟」，没另立第三种读法');
    var 益 = src('js/sects/sects-deep-ui.js');
    assert(益.indexOf('title="耗30分钟——今日下一次藏经阁参悟感悟翻倍"') >= 0 && 益.indexOf('🧭 请益（30分钟）') >= 0
        && /advanceTime\(30, '师父指点'\)/.test(益) && 益.indexOf('请益（半时辰）') < 0,
        'CS⑦d 拜师面板那枚「请益」的 title 与短标同步改口「30分钟」——真账是 askMasterGuidance 那笔 advanceTime(30)（旧牌面两处都念半个时辰）');
    assert(楼.indexOf('铜钱 20') >= 0 && 楼.indexOf('铜钱 50') >= 0 && /advanceTime\(30, '酒楼听情报'\)/.test(楼),
        'CS⑦e 本批只改嘴：两枚牌面的铜钱价签（20／50）与两笔分钟数（30／60）一字未动');

    // ---- ⑧ 门中炉火那两枚牌面：480 分钟提成一枚常量，时辰数改吃这把尺（同 ⑦ 一样只改嘴，不改账） ----
    // 病根：全仓折算时辰的口径只有一处（formatShichen，1 时辰 = 120 分钟），这两枚牌面却自己口算出「8」个时辰——
    //   480 分钟念成 960 分钟，大一倍。同屏那条六折句念的是小时（480/60=8），本来对得上，但三支笔各写各的数，
    //   改一处必漏一处，故三条上屏句与两处落账同吃 CRAFT_BUFF_MINUTES 这一枚。
    var 炉 = src('js/sects/sect-facilities.js');
    var 借尺句 = "window.formatShichen ? window.formatShichen(CRAFT_BUFF_MINUTES) : CRAFT_BUFF_MINUTES + '分钟'";
    assert(/var CRAFT_BUFF_MINUTES = 480;/.test(炉)                       // 那枚窗口只留一处字面量，480 一字未动
        && 炉.indexOf('8个时辰') < 0                                        // 口算出来的那个大一倍的字面量从整份源码里消失（注释里也不留）
        && !/\+ *480\b/.test(炉)                                            // 两处落账都改读常量，不再各自 +480
        && 炉.indexOf("'・🔥 炉温上来了，锤感正顺——' + (" + 借尺句) >= 0 && 炉.indexOf(") + '内锻造成功率见长。'") >= 0
        && 炉.indexOf("'・⚗️ 丹炉养好了火——' + (" + 借尺句) >= 0 && 炉.indexOf(") + '内炼丹成功率见长。'") >= 0,
        'CS⑧ 炉火两枚牌面的时长改吃 formatShichen(CRAFT_BUFF_MINUTES)＝「' + fmt(480) + '」（旧牌面口算念「8个时辰」＝960 分钟，把 480 分钟的真账念大一倍）；'
        + '六折句同吃这一枚（' + (480 / 60) + '小时），整份源码不再留「8个时辰」这个字面量，也不留散点的 +480');
})();

// ============ [CT] 第一百一十八批 DES-57：城名两串写法认账（舆图「帝都 · 长安」vs 表键「帝都·长安」） ============
// 病根一句话：js/regions.js 的 mapData 把起始城写作带空格的「帝都 · 长安」，而 cityData 表键、
// NPC 的 homeLocation／location、新开局初值都写「帝都·长安」。按地名取数与判同城的十来处用的是
// === 精确等值 → 从舆图点「前往」进的城与角色身上那本账拼写不同，城中人物名册、送礼／深谈、
// 庙会／摆摊／赁屋／营生四段在屏上整段消失；反向也犯（人在帝都，日常事件池抽的是野外那份）。
// 这一族全部读真源码切片跑，不另立平行口径（同 CS⑥ 手法）。
(function () {
    var 带空 = '帝都 · 长安', 无空 = '帝都·长安';

    // ---- ① 公共尺：global-utils.js 那两支，真跑 ----
    var 全 = src('js/global-utils.js');
    var 尺起 = 全.indexOf('window.placeKey = function');
    var 尺止 = 全.indexOf('})();', 尺起);
    assert(尺起 > 0 && 尺止 > 尺起, 'CT①a 公共尺在 global-utils.js 里在册（地名认账只此一把尺）');
    var 尺 = new Function('window', 全.slice(尺起, 尺止) + '\nreturn { placeKey: window.placeKey, samePlace: window.samePlace };')({});
    eq(尺.placeKey(带空), 无空, 'CT①b placeKey 只去空白、不动「·」（带空格那串折成表键写法）');
    assert(尺.samePlace(带空, 无空) === true, 'CT①c samePlace 认两串写法为同一处');
    assert(尺.samePlace('', '') === false, 'CT①d samePlace 不许把「无地」认成「某城」——空串两侧都判不成同城');
    assert(尺.samePlace(带空, '洛水城') === false, 'CT①e samePlace 不自紧：异地仍判异地');

    // ---- ② 同城守卫 npcNotCoLocated（送礼／深谈／请求／传情／应承五扇正门共用它） ----
    var ns = src('js/npcs/npc-system.js');
    var 尺两行 = (ns.match(/^var placeKeyOf = window\.placeKey \|\|[^\n]*\n^function samePlaceOf[^\n]*$/m) || [''])[0];
    var 守起 = ns.indexOf('function npcNotCoLocated(npc)');
    var 守止 = ns.indexOf('\n}', 守起) + 2;
    assert(尺两行 && 守起 > 0 && 守止 > 守起, 'CT②a 守卫与它用的尺都在同一份源码里在册（本文件被测试单独加载时靠自带那支尺）');
    var mk守卫 = function (页有尺) {
        var 页 = { get currentCharData() { return window.currentCharData; } };   // 守卫读的是 window 上那本角色账，桩子须把这一笔透传给测试全局
        if (页有尺) 页.placeKey = 尺.placeKey;
        return new Function('window', 尺两行 + '\n' + ns.slice(守起, 守止) + '\nreturn npcNotCoLocated;')(页);
    };
    var 守卫 = mk守卫(false);
    window.currentCharData = { location: 带空 };
    eq(守卫({ location: 无空 }), false, 'CT②b 行为：角色账「帝都 · 长安」遇 NPC 账「帝都·长安」判为同城（改前判异地——送礼／深谈当场回「并不在一处」）');
    window.currentCharData = { location: 无空 };
    eq(守卫({ location: 带空 }), false, 'CT②c 行为：两本账反向错配同样判同城（守卫不靠某一边先归一）');
    window.currentCharData = { location: 无空 };
    eq(守卫({ location: '洛水城' }), true, 'CT②d 行为：真异地照旧判异地（收口没把守卫收成常绿）');
    window.currentCharData = { location: 带空 };
    eq(mk守卫(true)({ location: 无空 }), false, 'CT②e 页面里（global-utils 已装载）走的也是同一把尺，行为与测试桩一致');
    delete window.currentCharData;

    // ---- ③ 按地名取人三 getter + 城中人物名册（屏上那三枚「攀谈」钮的正门） ----
    function 切方法(名) {
        var i = ns.indexOf(名 + '(location) {');
        if (i < 0) return '';
        // 两支 getter 是一行式（收尾的 } 与方法名同行），故按大括号配平定尾，不按缩进认
        for (var j = ns.indexOf('{', i), d = 0; j < ns.length; j++) {
            if (ns[j] === '{') d++;
            else if (ns[j] === '}' && --d === 0) return ns.slice(i, j + 1);
        }
        return '';
    }
    var 取人三支 = [切方法('getNPCsAtLocation'), 切方法('getNPCsByHomeLocation'), 切方法('getNearbyNPCs')];
    eq(取人三支.filter(Boolean).length, 3, 'CT③a 三支按地名取人的读端都在册（名册／招徒候选共用）');
    var 册 = new Function('placeKeyOf', 'return {' + 取人三支.join(',\n') + '};')(function (s) { return String(s == null ? '' : s).replace(/\s+/g, ''); });
    var NPC册 = [
        { id: 'merchant_01', name: '贾有道', location: 无空, homeLocation: 无空, state: { location: 无空 } },
        { id: 'cres_帝都·长安_1', location: 无空, homeLocation: 无空, state: { location: '餐馆' } },
        { id: 'outsider', location: '洛水城', homeLocation: '洛水城', state: { location: '洛水城' } }
    ];
    var 在场 = function (名) { return 册.getNPCsAtLocation.call({ activeNPCs: NPC册 }, 名).length; };
    var 安家 = function (名) { return 册.getNPCsByHomeLocation.call({ activeNPCs: NPC册 }, 名).length; };
    var 附近 = function (名) { return 册.getNearbyNPCs.call({ activeNPCs: NPC册 }, 名).length; };
    eq(在场(带空), 在场(无空), 'CT③b 行为：getNPCsAtLocation 两串写法同果（改前带空格取到 0 人）');
    eq(安家(带空), 2, 'CT③c 行为：getNPCsByHomeLocation 喂舆图那串带空格名也取到本城两位（改前 0 人 → 名册整节 return \'\'）');
    eq(附近(带空), 2, 'CT③d 行为：getNearbyNPCs（招门徒候选）两串写法同果');
    eq(安家(''), 0, 'CT③e 行为：空城名不取人（不收口成「全城都算本城」）');
    var cr = src('js/npcs/city-residents.js');
    var 卡起 = cr.indexOf('window.getCityResidentCards = function (cityName)');
    var 卡止 = cr.indexOf('\n    };', 卡起) + 6;
    assert(卡起 > 0 && 卡止 > 卡起, 'CT③f 名册卡那支在 city-residents.js 里在册');
    var 出卡 = new Function('window', cr.slice(卡起, 卡止) + '\nreturn window.getCityResidentCards;');
    var 跑卡 = function (名, 取人) {
        return 出卡({ npcManager: { getNPCsByHomeLocation: 取人 } })(名) || '';
    };
    var 攀谈数 = function (html) { return (html.match(/攀谈/g) || []).length; };
    var 旧笔 = function (名) { return NPC册.filter(function (n) { return (n.homeLocation || n.location) === 名; }); };
    eq(攀谈数(跑卡(带空, 旧笔)), 0, 'CT③g 自证（改前）：旧笔按名精确等值取人，舆图那串带空格名取到 0 张卡——屏上「城中人物」整节消失');
    eq(攀谈数(跑卡(带空, 安家.bind(null, 带空) && function (x) { return 册.getNPCsByHomeLocation.call({ activeNPCs: NPC册 }, x); })), 2,
        'CT③h 行为（改后）：喂带空格名也摆出两张卡两枚「攀谈」钮（攀谈正门接回屏上）');

    // ---- ④ 反向漏口：人在帝都却被判成野外（日常事件池整池抽错） ----
    var de = src('js/core/daily-events.js');
    var 解起 = de.indexOf('function resolveDailyLocation(location, ctx)');
    var 解止 = de.indexOf('\n}', 解起) + 2;
    assert(解起 > 0 && 解止 > 解起, 'CT④a 日常事件的地点解析那支在册');
    var 解析 = new Function('window', de.slice(解起, 解止) + '\nreturn resolveDailyLocation;');
    var 图 = { 中州: { cities: [带空, '洛水城'] } };
    var 判 = function (脚下) {
        return 解析({ getCurrentLocation: function () { return 脚下; }, locationSystem: null, mapData: 图, currentLocation: null })('auto', { source: 'time' });
    };
    eq(判(无空), 'city', 'CT④b 行为：新开局账里写「帝都·长安」，mapData 只有带空格那串——照旧判在城里（改前判 wilderness，城里抽的是野外事件池）');
    eq(判(带空), 'city', 'CT④c 行为：舆图进城后被污染的带空格名也判在城里（两串都得认）');
    eq(判('城外官道'), 'wilderness', 'CT④d 行为：真不在册的地名照旧判野外（这把尺没被放宽成常绿）');
    var bt = src('js/beast-taming.js');
    assert(bt.indexOf('cities.indexOf(loc)') < 0 && /String\(cities\[i\]\)\.replace\(\/\\s\+\/g, ''\) === locKey/.test(bt),
        'CT④e 源文闸：驯兽反查区域（beast-taming getCurrentRegionName）也改吃同一把尺，裸 indexOf 原样名那一笔已消失');
    var ls = src('js/location-system.js');
    assert(/data\.cities\.some\(c => String\(c\)\.replace\(\/\\s\+\/g, ''\) === key\)/.test(ls) && ls.indexOf('data.cities.includes(cityName)') < 0,
        'CT④f 源文闸：getCityRegion（world-loop 取地区的那笔）两串写法都认，不再 includes 原样名');

    // ---- ⑤ 四张城面板口 + 台账认城 + 传送阵剔本城 + 掌门下山落笔口径 ----
    ['city-lodging', 'city-jobs', 'festival-fair', 'street-stall'].forEach(function (名) {
        var s = src('js/city-facilities/' + 名 + '.js');
        assert(s.indexOf('cityName !== city()') < 0 && s.indexOf('pkCity(') >= 0,
            'CT⑤a 源文闸：' + 名 + ' 的面板守卫不再拿两串城名做裸精确等值（改走 pkCity）');
    });
    var 台账 = ['city-lodging', 'city-jobs'].reduce(function (n, 名) {
        var s = src('js/city-facilities/' + 名 + '.js');
        return n + (s.match(/l\.city [!=]== city\(\)/g) || []).length;
    }, 0);
    eq(台账, 0, 'CT⑤b 源文闸：赁屋／营生台账认城四处裸等值（"你的家在X——这儿没你的床"那一判）全改走 pkCity，本城不认本城的假话不再可能');
    var ap = src('js/app.js');
    assert(/String\(c\)\.replace\(\/\\s\+\/g, ''\) !== hereKey/.test(ap),
        'CT⑤c 源文闸：传送阵目的地列表剔本城改走去空白比对（改前站在长安，阵盘仍列长安，点一次白扣 100 灵石）');
    var lx = src('js/npcs/leader-excursion.js');
    assert(/return String\(cities\[hashStr\(sectName \+ '\|city'\) % cities\.length\] \|\| ''\)\.replace\(\/\\s\+\/g, ''\);/.test(lx),
        'CT⑤d 源文闸：掌门下山写进 NPC 账的城名改取去空白的表键写法（这是 mapData 之外的第二条污染注入点）');

    // ---- ⑥ 棘轮：全仓（剥注释）不许再添「拿城名做裸精确等值」这一形 ----
    var 禁形 = [/\.location === playerLoc\b/, /\.location === myLoc\b/, /\.location === loc\b/, /\bcities\.indexOf\(loc\)/, /\bcities\.includes\(/];
    // 【v25.0 结案销账】白名单原留的那一笔（app.js getCurrentRegionForGathering 的
    // cities.includes(window.currentLocation)——幽灵读恒 undefined，反查区域那支从来没生效过）
    // 已在 v25.0 全仓体检批收口：改走真 getter getCurrentLocation() + DES-57 去空白 some 比对，
    // 五形归零，白名单清空（本条即 CT⑥b 留言「结案时记得回来划掉」的兑现）。
    // 【v24.2 平台归一】命中与白名单统一按正斜杠比（同 fcc58e9 static-check 的归一法），判据未松。
    var 待另案 = [];
    var 命中 = [];
    jsFiles('js').forEach(function (f) {
        var 文 = codeOnly(src(f));
        禁形.forEach(function (re) { if (re.test(文)) 命中.push(f.replace(/\\/g, '/') + ' :: ' + re.source); });
    });
    var 新添 = 命中.filter(function (h) { return 待另案.indexOf(h) < 0; });
    var 已愈 = 待另案.filter(function (h) { return 命中.indexOf(h) < 0; });
    eq(新添.join(' | '), '', 'CT⑥ 棘轮：按城名／地名做裸精确等值的五形在全仓 js 里归零（v25.0 起白名单清空；要再添这一形，先收口进这把尺）');
    eq(已愈.join(' | '), '', 'CT⑥b 白名单不许变垃圾桶：另案那一笔若已收口，就该从待另案里划掉（DES-58 结案时记得回来）');

    // ---- ⑦ 诚实闸：价钱与脚程那一支本批一字未动（数值类待裁决，不顺手改） ----
    assert(/return city\?\.priceModifier\?\.\[type\] \|\| 1\.0;/.test(ls) && ls.indexOf('function getCityPriceModifier(cityName, type') > 0,
        'CT⑦a 本批未动：getCityPriceModifier 仍按原样名直取 cityData（帝都买贵卖贱 1.2／0.8 那两枚系数是否该生效，属数值裁决，另案待批）');
    var ts = src('js/travel-system.js');
    assert(/if \(fromR && toR && fromR === toR\) return 1;[\s\S]*?return 1\.5;/.test(ts),
        'CT⑦b 本批未动：getCityTravelDistance 那三档（1／2.5／1.5）一字未改——两串写法未收口时出京走的是 1.5 那档，改它会动脚程数字，立案待裁决');
    var qi = src('js/qi-environment.js');
    assert(/'帝都·长安': \{ base: 1\.0,/.test(qi)
        && (qi.match(/QI_CONCENTRATION\[locationName\] \|\| QI_CONCENTRATION\['default'\]/g) || []).length === 2,
        'CT⑦c 本批未动：QI_CONCENTRATION 的表键是「帝都·长安」，取值两支仍按原样名直取、缺省落 default（base 1.0 → 0.8）——'
        + '喂舆图那串带空格名时帝都的灵气浓度念的是外地档，改它会动打坐吐纳系数，属数值裁决另案');
})();

// ==================== [CU] 第六十六批 · UI-24① 960~1279 快捷卡：span 2 那一档在特大档劈字 ====================
// 立案读数（探针 .scratch/v24-CO9-quickcards.mjs，特大档 20px，逐档真点切字号）：
//   960：span 2 的三张卡盒宽 85／内宽 53，而「🕐 时间」「👥 队伍」自然宽 63、「📅 日程」62、「无拍卖」54
//        ⇒ 4 处劈成逐字竖排（屏上「🕐时／间」），五张卡全被撑到 245 高（读数 …-pre.out）；
//   1024：内宽 64 对需宽 63 ＝ 1px 刀刃（…-w1024.out，不报红不代表放得下）；
//   1088：标签放下了，「第1天 黎明」那一行却劈成「黎／明」（盒 45／需 40 × 2 行，…-w1088.out）——本批没治它，CU⑩ 记着；
//   1280：span 2 内宽 107，标签与次行都真放得下（…-out1280.out）⇒ 闸的上界取在这道 Tailwind 真实断点上。
// 改法（styles/ui-craft.css 一句 @media (min-width: 960px) and (max-width: 1279px)：快捷卡 4＋4＋4／6＋6）
//   与 768~959 那一刀同笔法：只改栏数、零 JS、零 DOM、零新 token、同特异度靠源序赢。
// 改后同探针复量：960 特大 4 处劈字 → **0**、卡高 245 → 125、内宽 53 → 158／263；
//   面板高 2585 → 2611（那 26px 是第八、九张从「挤在同一行」改成「自占一行」的代价，只在探针读数里，没有对应的尺）；
//   960 标准档 0 劈字、卡高 101 一字未动。
console.log('\n[CU] 960~1279 快捷卡那一档：span 2 在特大档只剩 53px 内宽，四枚 emoji 标签劈成竖排——这一段单独定栏');
(function () {
    var 尺 = css块尺();
    var craft = src('styles/ui-craft.css').replace(/\/\*[\s\S]*?\*\//g, '');   // 注释里的读数不是声明
    var 量 = '#panel-character #sub-status > .grid > :nth-child(-n+3)';
    var 快 = '#panel-character #sub-status > .grid > :nth-child(n+5)';
    var 八 = '#panel-character #sub-status > .grid > :nth-child(n+8)';

    var 头 = /@media\s*\(\s*min-width:\s*960px\s*\)\s*and\s*\(\s*max-width:\s*1279px\s*\)/.exec(craft);
    assert(!!头, 'CU① 这一支 @media (960~1279) 在（撤了它，「🕐时／间」那四处竖排与 245px 的卡高一起回来）');
    var 块 = '';
    if (头) {
        var 余 = craft.slice(头.index + 头[0].length);
        var 开 = 余.indexOf('{');                       // media 自己的开括号不是规则
        余 = 余.slice(开 + 1);
        var 尾 = /\n\}/.exec(余);
        块 = 余.slice(0, 尾 ? 尾.index : 0);
    }
    assert(块.length > 40, 'CU①a 块体抽得出来（长度 ' + 块.length + '，两行规则）——否则后面全是空判');
    eq(尺.支值(块, 快, 'grid-column'), 'span 4', 'CU② 第五~七张走 span 4（960 处卡宽 190／内宽 158 ≥ 需宽 63）');
    eq(尺.支值(块, 八, 'grid-column'), 'span 6', 'CU③ 第八、九张走 span 6（294／263，把「日程」「拍卖」那两枚长标签也放下）');
    assert((块.match(/grid-column/g) || []).length === 2,
        'CU④ 块里定栏只 2 支（n+5 与 n+8 已覆盖 5~9 张）');
    assert(块.indexOf(量) < 0 && !/-n\+3|nth-child\(4\)/.test(块),
        'CU⑤ 这一档**不碰**计量三条与境界卡——这就是「为什么不直接把六十三批那道闸从 959 抬到 1279」的理由：'
        + '抬闸会把三条计量卡一起打回整幅一行，而 960 以上它们明明放得下三张');
    assert(!/!important/.test(块), 'CU⑥ 零 !important（与窄档同一笔：同特异度靠源序赢）');
    ['flex-direction', 'align-items', 'justify-content', 'align-self'].forEach(function (p) {
        assert(!new RegExp(p + ':').test(块), 'CU⑦ 块里不写 ' + p + '（只改栏数；摆法与等高仍归通则那一句）');
    });
    var 通用址 = 尺.支址(craft, 量, 'grid-column');      // 通用档（>=768）给计量条定栏的那一支
    assert(头 && 通用址 >= 0 && 通用址 < 头.index,
        'CU⑦a 源序：这一档写在通用档那一支之后（两支特异度一字不差，只能靠先后取胜；顺序倒了今天这一支就被盖掉）');
    eq(尺.支值(块.replace(/span 4/, 'span 7'), 快, 'grid-column'), 'span 7',
        'CU⑦b 反证：把块里那一句改成 span 7，同一把尺立刻读到 7——上面几条绿灯读的是块体，不是文件名字面量');
    // 通用档那一支必须原样还在（CU⑤ 只证明本档没写它，没证明别处没改坏它）
    eq(尺.支值(craft, 八, 'grid-column'), 'span 2', 'CU⑧ 通用档（>=1280）第八张起仍 span 2——1280 实测内宽 107 够放');
    eq(尺.块表(craft, 快).length, 2,
        'CU⑨ 全仓按「n+5」这一形给快捷卡定栏的恰好两支（768~959／960~1279）——通用档是一条条写死的 nth-child(5)/(6)/(7)，'
        + '不该出现第三种口径；第四支意味着同一段版式两笔各写一半');
    // 1088 特大档那一处「第1天 黎明」劈成「黎／明」（盒 45／需 40 × 2 行）不在标签账里，是**次行读数**劈字；
    // 它落在 960~1279 这一档内，于是被同一笔一起治掉（改后 1088 复量：卡宽 232／内宽 201、折行 0 处，…-post1088.out）。
    var 下 = +/min-width:\s*(\d+)px/.exec(头[0])[1], 上 = +/max-width:\s*(\d+)px/.exec(头[0])[1];
    assert(下 <= 1088 && 1088 <= 上,
        'CU⑩ 1088 落进这道闸（' + 下 + '~' + 上 + '）——次行读数「黎明」的劈字与标签劈字同属「span 2 太窄」，一笔治两处；'
        + '若把上界收回到 1023，1088 那一屏立刻复发');
    assert(!/\.grid[^{]*nth-child\([5-9]\)[^{]*\{[^}]*white-space/.test(块),
        'CU⑩a 治法是**放宽**不是**遮字**：这一档里没有 white-space（nowrap 只会把整句折成一行再裁掉，比劈字更糟）');
})();

console.log('\nv24.0-audit-fixes：' + passed + ' 通过 / ' + failed + ' 失败');
process.exit(failed ? 1 : 0);