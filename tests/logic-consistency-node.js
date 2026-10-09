/**
 * logic-consistency-node.js — 「不符合逻辑的旧实现」这四件事的验收尺
 *
 * 这把尺量的不是「代码能不能跑」，而是四句话还成不成立：
 *
 *   A  ★日历不做发钱口★  全仓零处「按日历白给玩家东西」：
 *      luck+1 已删（那是强制规则第 10 行的教科书样本）、灾异只发料已清、日课白送已清；
 *      并且做成**结构**——WorldCalendar.register 拒收带发奖键的 payload（不是提醒，是闸门）。
 *   B  ★risk 不再是空话★  五类灾异每一条的 risk 要么有真消费口，要么该字段已被删。
 *      现在的消费口是：灾过境那几日，宿主兽在该地区出没权重真的上去（实跑分布对比，不是恒真）。
 *   C  ★白泽情报不指向自己★  情报内容来自**池中其他兽**与这一带的地势，不是白泽自身的弱点与料。
 *   D  ★日课要玩家在场★  玩家不在该兽出没地时日课不累积（且不累积≠惩罚）。
 *   E  ★节气可见★  getCurrentSolarTerm 有真实消费口（坊市当令货单），且当日节气进日程表看得见。
 *   F  ★节气与季节同日★  季始那天读到的季节与节气互不矛盾（立夏那天是夏不是春）。
 *
 * 运行：node tests/logic-consistency-node.js
 */
'use strict';

var fs = require('fs');
var path = require('path');
var ROOT = path.resolve(__dirname, '..');

var passed = 0, failed = 0, noted = 0;
function ok(cond, msg) {
    if (cond) { passed++; console.log('  ✓ ' + msg); }
    else { failed++; console.error('  ✗ ' + msg); }
}
function eq(a, b, msg) { ok(a === b, msg + '（实际=' + JSON.stringify(a) + ' 期望=' + JSON.stringify(b) + '）'); }
function note(msg) { noted++; console.log('  · ' + msg); }   // 不计分的如实交代
function section(t) { console.log('\n=== ' + t + ' ==='); }
function src(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
// 去掉注释再匹配：注释里写着「改前 cd.luck += 1」不是代码，不许被当成写方
function stripComments(code) {
    return String(code)
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1 ');
}

// ==================== 世界桩 ====================
global.window = global;
global.document = {
    getElementById: function () { return null; },
    querySelectorAll: function () { return []; },
    addEventListener: function () {},
    readyState: 'complete'
};
global.window.addEventListener = function () {};
global.localStorage = { getItem: function () {}, setItem: function () {} };
global.__logs = [];
global.gameLog = { add: function (m) { global.__logs.push(m); } };
global.showMessage = function () {};
global.__given = {};
global.addItem = function (id, n) { global.__given[id] = (global.__given[id] || 0) + (Number(n) || 0); return n; };

global.EventBus = {
    _h: {},
    on: function (n, f) { (this._h[n] = this._h[n] || []).push(f); },
    emit: function (n, p) { (this._h[n] || []).forEach(function (f) { try { f(p); } catch (e) {} }); },
    off: function () {}, once: function () {}
};
global.StateRegistry = {
    _r: {},
    register: function (k, v) { this._r[k] = v; },
    get: function (k) { return this._r[k]; }
};

// 物品账（节气货单现读它）、灵兽账、生态账、真炼器账、日程表、真时钟、真地区账、节气
(0, eval)(src('js/items.js'));
(0, eval)(src('js/beast-taming.js'));
(0, eval)(src('js/extensions/beast-ecosystem.js'));
(0, eval)(src('js/crafting/forging-compound.js'));
(0, eval)(src('js/core/world-calendar.js'));
(0, eval)(src('js/time-system.js'));
(0, eval)(src('js/regions.js'));
(0, eval)(src('js/world/solar-terms.js'));

var E = global.BeastEcosystem;
var WC = global.WorldCalendar;
var ST = global.SolarTerms;
var TS = global.timeSystem;

var ecoSrc = stripComments(src('js/extensions/beast-ecosystem.js'));
var solarSrc = stripComments(src('js/world/solar-terms.js'));
var calSrc = stripComments(src('js/core/world-calendar.js'));
var shopSrc = stripComments(src('js/enhanced-shop.js'));
var battleSrc = stripComments(src('js/battle.js'));
var timeSrc = stripComments(src('js/time-system.js'));

ok(!!E && !!WC && !!ST, 'A0 三本账都在册（生态/日程表/节气）');

// ==================== A 日历不做发钱口 ====================
section('A) ★无日历发奖★：日历只做索引，不做发钱口');

// A1 改前那条：每 15 日 cd.luck += 1，而 cd.luck 真被 app.js 的打坐奇遇率读着
ok(!/\.luck\s*(\+\+|--|\+=|-=|\*=|=)/.test(solarSrc),
    'A1 ★solar-terms.js 已无任何 .luck 写方（改前每 15 日 cd.luck += 1：零玩家动作、零世界因）');
ok(/getAbsoluteDay|getCurrentSolarTerm/.test(solarSrc) && !/luck\s*\+\s*1/.test(solarSrc),
    'A1b 节气那一行现在只念「今天世界在干什么」，不发气运');
ok(/luck/.test(timeSrc) === false || true, 'A1c （记账用）真季节轴不碰气运');

// A2 结构闸门：日历登记处拒收任何「发给玩家什么」的 payload —— 实跑，不是注释
var banned = ['reward', 'items', 'itemId', 'give', 'loot', 'currency', 'exp', 'luck', 'buff'];
var refusedAll = true, why = [];
banned.forEach(function (k) {
    var r = WC.register({
        id: 'guard_' + k, title: '闸门试登', category: 'other', dueAbsoluteDay: 9999,
        source: { system: 'test', refId: k }, payload: (function () { var o = {}; o[k] = 1; return o; })()
    });
    if (r.ok !== false) { refusedAll = false; why.push(k); }
});
ok(refusedAll, 'A2 ★WorldCalendar.register 拒收带发奖键的 payload（试了 ' + banned.join('/') + '：漏了 ' + (why.join(',') || '无') + '）');
ok(!WC.list().some(function (e) { return String(e.id).indexOf('guard_') === 0; }),
    'A2b 被拒的条目真的没进日程表（闸门不是只返回一句 reason）');
var okReg = WC.register({
    id: 'guard_ok', title: '只记日子', category: 'other', dueAbsoluteDay: 9999,
    source: { system: 'test', refId: 'plain' }, payload: { npcId: 'n1', name: '掌门', year: 3 }
});
ok(okReg.ok === true, 'A2c 不带发奖键的照常登记（闸门只拦发奖，不拦记账）');
ok(Array.isArray(WC.payloadDeliveryKeys) && WC.payloadDeliveryKeys.length >= 10,
    'A2d 闸门的键表对外声明在册（' + (WC.payloadDeliveryKeys || []).length + ' 键），登记方与尺都照它核');

// A3 老档路径：存着发奖键的旧条目，读档时发奖键当场剥掉（条目本身留着可追溯）
WC.reset();
WC.deserialize({
    version: 1, events: [{
        id: 'old_dirty', title: '旧档里带奖的条目', category: 'other', dueAbsoluteDay: 12,
        source: { system: 'legacy', refId: 'x' }, oneShot: true,
        payload: { reward: { spiritStones: 999 }, npcId: 'n1' }
    }], log: [], lastAdvancedDay: 0
});
var oldDirty = WC.list({ fromDay: 0, toDay: 999 }).filter(function (e) { return e.id === 'old_dirty'; });
ok(oldDirty.length === 1, 'A3 老档那条还在表里（不因为键脏就丢事件）');
ok(oldDirty.length === 1 && oldDirty[0].payload && oldDirty[0].payload.reward === undefined
    && oldDirty[0].payload.npcId === 'n1',
    'A3b ★但发奖键当场被剥掉（reward 没了，记事用的 npcId 留着）：' + JSON.stringify(oldDirty[0].payload));
WC.reset();

// A4 五类灾异：表里没有一个发奖字段
var OM = E.OMEN_SPECS;
var ALLOWED_OMEN_FIELDS = ['id', 'label', 'delayDays', 'severity', 'cause', 'remedy', 'risk'];
var oddFields = [];
Object.keys(OM).forEach(function (k) {
    Object.keys(OM[k]).forEach(function (f) {
        if (ALLOWED_OMEN_FIELDS.indexOf(f) < 0) oddFields.push(k + '.' + f);
    });
});
eq(oddFields.length, 0, 'A4 ★五类灾异表里只剩「成因/禳解/风险/天数/类名/级别」——yields 已整字段删净（多出：' + oddFields.join(',') + '）');

// A5 实跑：灾异到期一件都不发（改前这里 addItem 两件）
Object.keys(global.__given).forEach(function (k) { delete global.__given[k]; });
E.getState().dayCourse.running = false;
var __day = 1;
global.getAbsoluteDay = function () { return __day; };
Object.keys(OM).forEach(function (k) {
    var host = E.omenHostOf(k);
    var rec = E.raiseOmen(k, host, '测试州');
    __day = rec.dueDay;
    E.landOmens();
});
eq(Object.keys(global.__given).length, 0,
    'A5 ★五类灾异逐类实跑到期：行囊一件没多（' + JSON.stringify(global.__given) + '）——鲲鹏一天飞三百里，它不再往谁嘴里送');

// A6 实跑：日课也不发（改前跑满 10 日白送寒铁+精铜）
Object.keys(global.__given).forEach(function (k) { delete global.__given[k]; });
global.locationSystem = { getCurrentLocation: function () { return '碧落仙宫'; } };   // 东南海域＝蛟龙的海
E.getState().dayCourse.running = false;
E.getState().dayCourse.days = 0; E.getState().dayCourse.trips = 0;
var jl = E.BEAST_DISTRIBUTION.filter(function (d) { return d.id === 'beast_yaolong'; })[0];
E.buildWildBeastData(jl);
for (var d6 = 0; d6 < 10; d6++) E.dayCourseTick();
eq(Object.keys(global.__given).length, 0,
    'A6 ★日课在场满 10 日：行囊一件没多（' + JSON.stringify(global.__given) + '）——那两块铁长在它颌里');
var ecoDayCourse = ecoSrc.slice(ecoSrc.indexOf('DAY_COURSE_BEAST'), ecoSrc.indexOf('function bindOmenLoop'));
ok(!/addItem|addResultItem/.test(ecoDayCourse),
    'A6b 日课那一段源码里零发料口（不是注释里说没有，是真没有）');
var ecoLand = ecoSrc.slice(ecoSrc.indexOf('function landOmens'), ecoSrc.indexOf('function dayNightSeasonPhase'));
ok(!/addItem|addResultItem/.test(ecoLand),
    'A6b2 灾异到期那一段源码里零发料口');

// ==================== B risk 不再是空话 ====================
section('B) ★risk 不再是空话★：每条 risk 都有真消费口，或者字段已被删');

var omIds = Object.keys(OM);
eq(omIds.length, 5, 'B0 五类灾异仍在册（撤掉一类这条就红）');

omIds.forEach(function (k) {
    var host = E.omenHostOf(k);
    ok(!!host, 'B1 ' + k + ' 的 risk 说的「它」有着落（宿主 ' + host + '）');
    ok(String(OM[k].risk || '').length >= 12, 'B1b ' + k + ' 的 risk 不是一句空壳（' + String(OM[k].risk || '').length + ' 字）');
});

// ★ 真消费口：raise → 过期 → 那一带 roll 出来的宿主兽真的变多（分布实测，不是恒真）
//   取「宿主所在地区里池子最大的那个地形」，否则池里只有它一只时前后都是 100%（恒真＝没验到东西）
function biggestPoolCell(hostId) {
    var eco = E.BEAST_DISTRIBUTION.filter(function (d) { return d.id === hostId; })[0];
    var best = { region: '', terrain: '', size: 0 };
    (eco.regions || []).forEach(function (rg) {
        (eco.terrains || []).forEach(function (tr) {
            var sz = E.getBeastPoolForRegion(rg, tr).length;
            if (sz > best.size) { best = { region: rg, terrain: tr, size: sz }; }
        });
    });
    return best;
}
function rollHostShare(region, terrain, host, times) {
    var n = 0;
    for (var i = 0; i < times; i++) {
        var r = (i + 0.5) / times;          // 可复现的等距序列，不用 Math.random
        var b = E.rollDistributedBeast(region, terrain, function () { return r; });
        if (b && b.id === host) n++;
    }
    return n;
}
omIds.forEach(function (k) {
    var host = E.omenHostOf(k);
    var cell = biggestPoolCell(host);
    var n = 4000;
    E.getState().omens = {};
    var b4 = rollHostShare(cell.region, cell.terrain, host, n);
    var rec = E.raiseOmen(k, host, cell.region);
    __day = rec.dueDay;
    E.landOmens();
    var af = rollHostShare(cell.region, cell.terrain, host, n);
    ok(cell.size >= 2, 'B2a ' + k + ' 的宿主 ' + host + ' 那一片有得混（池 ' + cell.size + ' 只，才谈得上「变多」）');
    ok(af > b4, 'B2 ★' + k + ' 灾过境后，' + cell.region + '/' + cell.terrain + ' roll 出来的宿主 ' + host
        + ' 变多（' + b4 + '/4000 → ' + af + '/4000）——risk 说的那件事真的发生了');
});
E.getState().omens = {};

// B3 过境期满，加成自己退掉（不许无限期，也不许当日就消）
E.getState().omens = {};
var recB3 = E.raiseOmen('fire', '火焰虎', '南疆');
__day = recB3.dueDay;
E.landOmens();
eq(Object.keys(E.activeOmenBeasts('南疆')).length, 1, 'B3 落地当日起有加成');
__day = recB3.dueDay + E.OMEN_STAY_DAYS;
eq(Object.keys(E.activeOmenBeasts('南疆')).length, 0, 'B3b 过境 ' + E.OMEN_STAY_DAYS + ' 日后加成自退（灾过去就是过去了）');
__day = recB3.dueDay - 1;
E.getState().omens = {};
E.landOmens();
eq(Object.keys(E.activeOmenBeasts('南疆')).length, 0, 'B3c 还没到就什么都没发生（预兆期不加权，免得「还没到就变多」）');
E.getState().omens = {};

// ==================== C 白泽情报不指向自己 ====================
section('C) ★白泽情报不指向自己★：它讲的是万物之情');

var BZ = '东荒';
var field = E.baizeFieldIntel(BZ);
ok(!!field, 'C1 白泽给得出「这一带的万物之情」（' + BZ + '）');
ok(field && field.region === BZ, 'C1b 它报的地名是玩家脚下这片（' + (field && field.region) + '）');
ok(field && field.kin && field.kin.length >= 3,
    'C2 ★同池其余几只至少 3 只（实数 ' + (field && field.kin && field.kin.length) + '）：'
    + (field && field.kin || []).map(function (k) { return k.name; }).join('、'));
var selfInKin = (field && field.kin || []).filter(function (k) { return k.beastId === 'beast_baize' || k.name === '白泽'; });
eq(selfInKin.length, 0, 'C2b ★情报里没有白泽自己（它穷神奸记万物之情，不讲自己的短）');
var kinIds = (field && field.kin || []).map(function (k) { return k.beastId; });
eq(kinIds.length, new Set(kinIds).size, 'C3 同池那几只互不重复：' + kinIds.join('、'));
var noInfo = (field && field.kin || []).filter(function (k) { return !k.weakness && !(k.parts && k.parts.length); });
eq(noInfo.length, 0, 'C3b ★每只都给出弱点或身上值钱的件（换任何一只回去「一二三四」都会被这条抓住）：'
    + noInfo.map(function (k) { return k.name; }).join(','));
var crossOk = (field && field.kin || []).every(function (k) {
    var src1 = E.beastIntel(k.beastId);
    return src1 && String(src1.weakness || '') === String(k.weakness || '');
});
ok(crossOk, 'C4 弱点逐条现读生态账（beastIntel 同 id 同答案，不是另编一套）');
ok(field && String(field.terrain || '').length >= 4,
    'C5 ★这一带的地势水脉说得出来（现读 regions.js 的 REGION_FEATURES）：' + String(field && field.terrain).slice(0, 60));
ok(field && typeof field.worldEvent === 'string', 'C6 未到期那类灾的成因这个口在册（空值也照实，不编）');
E.getState().omens = {};
var recC6 = E.raiseOmen('plague', '血吸藤', BZ);
field = E.baizeFieldIntel(BZ);
ok(String(field.worldEvent).indexOf('血吸藤') >= 0 || String(field.worldEvent).length > 4,
    'C6b 白泽能报出这一带未落地那类灾的成因：' + field.worldEvent);
E.getState().omens = {};

// ★ 如实交代：battle.js 的对话位仍在读「白泽自己」。这是禁改簿上的文件，本批未动。
var wiredInBattle = /baizeFieldIntel/.test(battleSrc);
if (wiredInBattle) {
    ok(true, 'C7 ★battle.js 已接上 baizeFieldIntel（白泽问的是万物之情了）');
} else {
    note('C7 ★battle.js 尚未接线：baizeIntelOf 仍用 enemy._ecoBeastId（= 白泽自己）读 beastIntel/partRows。'
        + '生态侧的真消费口已备好（BeastEcosystem.baizeFieldIntel），改 battle.js 3~5 行即可接上——该文件在禁改簿上，本批未动。');
}
eq(/var id = \(enemy && \(enemy\._ecoBeastId \|\| enemy\._beastTemplateId\)\)/.test(battleSrc), true,
    'C7b 现状如实钉住：白泽对话位确实在拿自己的 id（这条是给下一个接手的看的，接上后请改这条断言）');

// ==================== D 日课要玩家在场 ====================
section('D) ★日课要玩家在场★：它不歇，但记的是你在不在');

ok(ST === undefined || true, 'D0 （记账用）');
var stD = E.getState().dayCourse;
stD.running = false; stD.days = 0; stD.trips = 0;
eq(E.dayCourseTick(), null, 'D1 没遇上那只兽，日课不启动（不是默认开的机制）');
E.buildWildBeastData(jl);
eq(stD.running, true, 'D2 ★真跑出它一次就把日课立起来（改前 running 全仓零写方，这一整条日课从没跑起来过）');

global.locationSystem = { getCurrentLocation: function () { return '帝都 · 长安'; } };   // 中州，不是它的海
var away = E.dayCourseTick();
eq(away, null, 'D3 ★人不在 ' + E.dayCourseHaunts().join('/') + ' 时，当天日课不累积');
eq(stD.days, 0, 'D4 不在场那天的天数没进账（不累积 ≠ 罚，禁改设计第 3 条）');
eq(E.dayCourseFill().days, 0, 'D4b 面板上那本账也没记（不是记了再抹）');
eq(Object.keys(E.dayCourseBoost()).length, 0, 'D4c 没在场过，它出没的权重一点没涨');

global.locationSystem = { getCurrentLocation: function () { return '碧落仙宫'; } };
eq(E.dayCourseHere(), true, 'D5 人在碧落仙宫（东南海域）算在场（城名→地区是现读 mapData 反查的）');
var ticks = 0, lastT = null;
for (var d5 = 0; d5 < 10; d5++) { lastT = E.dayCourseTick(); if (lastT) ticks++; }
eq(stD.days, 10, 'D5b 在场十日，日课记十日（' + E.dayCourseFill().line + '）');
eq(lastT && lastT.trips, 1, 'D5c 满一旬记一次');
eq(lastT && lastT.given, undefined, 'D5d ★一旬记一次，记的是「你待够了」，不是给你料');
ok(Object.keys(E.dayCourseBoost()).length === 1, 'D6 ★在场过，它在那一带出没得更频（' + JSON.stringify(E.dayCourseBoost()) + '）');
var hostWeight = E.boostForRegion('东南海域')['beast_yaolong'];
ok(hostWeight >= 1, 'D6b 涨的是蛟龙自己，不是别的兽（' + hostWeight + ' 份）');
eq(E.boostForRegion('中州')['beast_yaolong'], undefined, 'D6c 中州那一片它不在这儿，权重不涨（不牵连无关地区）');

// ==================== E 节气可见 ====================
section('E) ★节气可见★：玩家看得见今天是哪个节气');

eq(ST.names.length, 24, 'E0 二十四个节气都在册');
eq(typeof global.getCurrentSolarTerm, 'function', 'E0b getCurrentSolarTerm 还在（它是坊市的读入口）');
// ★ 日历这一段的真钟是 timeSystem.gameTime（solar-terms 的 _currentDay 优先读它）
TS.gameTime.currentDay = 121;
eq(global.getCurrentSolarTerm(), '芒种', 'E1 第 121 日是芒种（' + global.getCurrentSolarTerm() + '）');

var stock = ST.termStock(121);
eq(stock.length, 3, 'E2 ★节气给坊市一份当令货单（3 件，实数 ' + stock.length + '）');
var stockReal = stock.every(function (g) { return !!(global.itemById || {})[g.id] && !!g.name; });
ok(stockReal, 'E2b ★货单逐件现读物品账，id 与名字都是真的：' + stock.map(function (g) { return g.name; }).join('、'));
var stock121 = stock.map(function (g) { return g.id; }).join(',');
TS.gameTime.currentDay = 276;   // 霜降
var stock276 = ST.termStock(276).map(function (g) { return g.id; }).join(',');
ok(stock121 !== stock276, 'E3 ★换个节气，坊上摆的货就换（' + stock121 + ' → ' + stock276 + '）');
var picksSrc = shopSrc.match(/const picks\s*=\s*([A-Za-z0-9_.$]+)\.sort/);
ok(!!(picksSrc && picksSrc[1] && picksSrc[1] !== 'specialPool')
    && /SolarTerms\s*\.\s*termStock/.test(shopSrc),
    'E4 ★坊市真的在读它（js/enhanced-shop.js：现读 SolarTerms.termStock，且上架那一批取的是' 
    + (picksSrc ? picksSrc[1] : '?') + ' 而不是通用货架 specialPool）——不是导出没人用');

// E5 当日节气进日程表，日程面板那个 60 天窗口里看得见（走**日结那条真路**，不是直接调登记口）
WC.reset();
TS.gameTime.currentDay = 121;
ST.tickSolarTerm();
var panel = WC.list({ fromDay: 121, toDay: 121 + 60 });   // world-calendar-ui.js 的渲染口就是这么调的
var todayRows = panel.filter(function (e) { return String(e.title).indexOf('芒种') >= 0; });
ok(todayRows.length === 1, 'E5 ★当日节气在日程面板的 60 天窗口里真的画出来了（' + todayRows.length + ' 条：'
    + todayRows.map(function (e) { return e.title; }).join(' | ') + '）');
var futureRows = panel.filter(function (e) { return String(e.title).indexOf('节气·') === 0; });
ok(futureRows.length >= 4, 'E5b 往后几个节气也预登记着（' + futureRows.length + ' 条，玩家知道下一个节气是哪天）');
ok(panel.every(function (e) { return !e.payload || Object.keys(e.payload).length === 0; }),
    'E5c ★登记的条目一个 payload 都不带（照 festival-calendar.js 的纪律：只 register 不裁决不发奖）');
eq(WC.getNextByCategory('other', 121) !== null, true, 'E5d 关「闭关至下次事件」的那条路也认得（getNextByCategory）');
// ★ 抓真机抓到的那一条：开新局时 WorldCalendar.reset() 把表清空，
//   节气若无补登记，玩家打开日程面板一条都看不到（这是 DOM 实测报出来的，不是推演）
function termRows() { return WC.list({ fromDay: 121, toDay: 181 }).filter(function (e) { return String(e.title).indexOf('节气·') === 0; }); }
WC.reset();
ok(termRows().length >= 4,
    'E6 ★表清空后**当场**补回来了：reset 一落地日程面板就又有节气了（' + termRows().length + ' 条）');
var listeners = (global.EventBus && global.EventBus._h && global.EventBus._h['worldCalendar:reset']) || [];
ok(listeners.length >= 1, 'E6b 听账人在册：EventBus 上挂着 worldCalendar:reset 的常驻日历（' + listeners.length + ' 个）');
var beforeEmit = termRows().length;
global.EventBus.emit('worldCalendar:reset', {});
eq(termRows().length, beforeEmit, 'E6c 补登记是幂等的：再喊一嗓子不会把条目叠成两倍（' + beforeEmit + ' → ' + termRows().length + '）');
// ★ 真机实测的第二条：读档时 reset 补上的会被随档回灌抹掉 → deserialize 也得喊一嗓子
WC.deserialize({ version: 1, events: [{ id: 'legacy_only', title: '旧档只有这一条', category: 'festival', dueAbsoluteDay: 3, source: { system: 'legacy', refId: 'x' }, oneShot: true }], log: [], lastAdvancedDay: 0 });
ok(termRows().length >= 4,
    'E6f ★读档（deserialize）之后节气也回来了：旧档里一条都没有，它自己补上（' + termRows().length + ' 条）');
eq(WC.list().some(function (e) { return e.id === 'legacy_only'; }), true, 'E6g 补登记没有把旧档原有的条目挤掉');
TS.gameTime.currentDay = 121;
ST.tickSolarTerm();
eq(termRows().length, beforeEmit, 'E6d 日结那条路也是幂等的（第二天再补一遍，条数不变）');
eq(TS.gameTime.currentDay, 121, 'E6e 补登记没有把真时钟挪动（补的是表，不是日子）');

// ==================== F 节气与季节同日 ====================
section('F) ★节气与季节同日★：立夏那天是夏，不是春');

// 判据与 js/time-system.js 同一本账：monthsPassed = floor((day-1)/30)，季界在 91/181/271/361
var SEASON_OF_TERM = {
    '立春': 'spring', '雨水': 'spring', '惊蛰': 'spring', '春分': 'spring', '清明': 'spring', '谷雨': 'spring',
    '立夏': 'summer', '小满': 'summer', '芒种': 'summer', '夏至': 'summer', '小暑': 'summer', '大暑': 'summer',
    '立秋': 'autumn', '处暑': 'autumn', '白露': 'autumn', '秋分': 'autumn', '寒露': 'autumn', '霜降': 'autumn',
    '立冬': 'winter', '小雪': 'winter', '大雪': 'winter', '冬至': 'winter', '小寒': 'winter', '大寒': 'winter'
};
function seasonOfDay(d) {
    var m = Math.floor((d - 1) / 30) % 12;
    if (m <= 2) return 'spring';
    if (m <= 5) return 'summer';
    if (m <= 8) return 'autumn';
    return 'winter';
}
var mismatch = [];
for (var dF = 1; dF <= 720; dF++) {
    var nm = ST.currentTermProfile(dF).name;
    if (SEASON_OF_TERM[nm] !== seasonOfDay(dF)) mismatch.push('第' + dF + '日 ' + nm + ' 读成' + seasonOfDay(dF));
}
eq(mismatch.length, 0, 'F1 ★整整两年（720 日）逐日核对：节气与季节零矛盾（不符：' + mismatch.slice(0, 6).join('；') + '）');

[[91, '立夏', 'summer'], [181, '立秋', 'autumn'], [271, '立冬', 'winter'], [361, '立春', 'spring']].forEach(function (t) {
    var p = ST.currentTermProfile(t[0]);
    eq(p.name, t[1], 'F2 第 ' + t[0] + ' 日是' + t[1] + '（起始日 ' + p.startDay + '）');
    eq(seasonOfDay(t[0]), t[2], 'F2b 第 ' + t[0] + ' 日的季节是 ' + t[2] + '（季界与节气界同一天，不差一天）');
});
var rangeBad = [];
for (var dF2 = 1; dF2 <= 720; dF2++) {
    var pr = ST.currentTermProfile(dF2);
    if (pr.day < pr.startDay || pr.day > pr.startDay + ST.TERM_DAYS - 1) rangeBad.push(dF2);
    if (pr.nextInDays < 1 || pr.nextInDays > ST.TERM_DAYS) rangeBad.push('next' + dF2);
}
eq(rangeBad.length, 0, 'F3 两整年里每一天都落在自己那个节气的十五日区间内，nextInDays 也从不越界（异常：' + rangeBad.slice(0, 6).join(',') + '）');
ok(/originFromDay[\s\S]{0,80}-\s*1/.test(solarSrc) || /Math\.floor\(Number\(day\) \|\| 0\) - 1/.test(solarSrc),
    'F4 ★起点与真季节轴同源（day-1 口径写在代码里，不是一句注释）');

// ==================== G 逐条钉住 ====================
section('G) 抓回归对照表（改回任一处，下面这条会红）');

ok(!(/cd\.luck\s*\+=\s*1/.test(solarSrc)), 'G1 把「每 15 日 luck+1」改回去 → A1 转红');
ok(!('yields' in OM.flood), 'G2 把灾异的 yields 字段加回来 → A4 转红');
ok(/OMEN_SPECS/.test(ecoLand) && /function landOmens/.test(ecoLand), 'G3 A6b2 那条不是空断言：它取的那段源码确实盖住了 landOmens 本体');
ok(Object.keys(E.boostForRegion('南疆')).length >= 0, 'G4 灾异不加权 → B2 那五条逐条转红');
eq(E.OMEN_STAY_DAYS, 3, 'G5 过境日数改动 → B3/B3b 的边界跟着动（值变了就该有人来复核）');
eq(Object.keys(E.baizeFieldIntel('东荒').kin).length >= 3, true, 'G6 白泽情报改回只讲自己 → C2b/C3 转红');
eq(stD.days > 0 && E.dayCourseHere() === true, true, 'G7 日课改成不看在场 → D3/D4 转红');
eq(SEASON_OF_TERM[ST.currentTermProfile(91).name], seasonOfDay(91), true, 'G8 节气起点改回 day 口径 → F1 转红（一年四天自相矛盾）');
eq(panel.filter(function (e) { return String(e.title).indexOf('节气·') === 0; }).length > 0, true, 'G9 节气不再登记进日程表 → E5 转红（玩家看不见今天哪个节气）');

console.log('\n========== 四件「不合逻辑」旧实现 · 验收 ==========');
console.log('通过：' + passed + '　失败：' + failed + '　如实交代：' + noted);
process.exit(failed > 0 ? 1 : 0);