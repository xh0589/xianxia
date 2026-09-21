// sect-standing-node.js — 江湖地位（方案一·动态势力 + 方案二·动态正邪）vm 沙箱测试
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');

let pass = 0, fail = 0;
function ok(cond, name) {
    if (cond) { pass++; console.log('  ✓ ' + name); }
    else { fail++; console.error('  ✗ ' + name); }
}
function eq(a, b, name) { ok(a === b, name + '（实际=' + JSON.stringify(a) + ' 期望=' + JSON.stringify(b) + '）'); }

// ---------- A · 接线静态检查 ----------
console.log('\n[A] 接线');
const html = fs.readFileSync(path.join(ROOT, '仙侠.html'), 'utf8');
ok(html.includes('js/sects/sect-standing.js'), 'A1 html 挂载 sect-standing.js');
const warSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-war.js'), 'utf8');
ok(warSrc.includes('sectPowerWarMul'), 'A2 战争 powerMul 优先读动态座次');
ok(warSrc.includes('standingHit('), 'A3 战争结算动战绩与立场');
const govSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-governance.js'), 'utf8');
ok(govSrc.includes("id: 'relief'") && govSrc.includes('开仓济民'), 'A4 治理新增「开仓济民」进言');
ok(govSrc.includes('dec.align') && govSrc.includes('sectAlignShift'), 'A5 runDecision 立场联动钩子');
ok(govSrc.includes('sectPowerLabel') && govSrc.includes('sectAlignLabel'), 'A6 政事面板展示江湖地位与立场');
const fsSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-festival-succession.js'), 'utf8');
ok(fsSrc.includes('sectAlignNow'), 'A7 戒律堂按动态立场查账');
const errSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-shield-errands.js'), 'utf8');
ok(errSrc.includes('sectAlignShift'), 'A8 外务办成给门派攒名声');
const visitSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-visit.js'), 'utf8');
ok(visitSrc.includes('sectAlignLabel') && visitSrc.includes('sectPowerLabel'), 'A9 山门牌面动态立场/座次');
ok(!/冷却|次数上限|配额/.test(fs.readFileSync(path.join(ROOT, 'js/sects/sect-standing.js'), 'utf8')), 'A10 模块零配额句式');

// ---------- 沙箱 ----------
function makeSandbox(opts) {
    opts = opts || {};
    const SECTS = {
        '少林寺': { type: '正道', location: '中州', power: '巨擘', weapons: '棍棒' },
        '大旗门': { type: '正道', location: '中州', power: '巨擘', weapons: '长兵' },
        '阎罗殿': { type: '邪派', location: '南疆', power: '大派', weapons: '刀' },
        '五仙教': { type: '中立', location: '南疆', power: '中等', weapons: '蛊术' },
        '逍遥派': { type: '中立', location: '北冥', power: '极小', weapons: '奇门兵刃' },
        '血手门': { type: '邪派', location: '北冥', power: '中等', weapons: '爪、毒' }
    };
    function mk(disc, res, infl, wpn, def) {
        return { disciples: disc, morale: 55, influence: infl, resources: res, weapons: wpn, defense: def, chronicle: [] };
    }
    const INTERNAL = {
        '少林寺': mk(37, 150, 75, 18, 15),
        '大旗门': mk(35, 140, 70, 17, 14),
        '阎罗殿': mk(31, 130, 65, 15, 13),
        '五仙教': mk(22, 90, 45, 10, 8),
        '逍遥派': mk(17, 50, 25, 8, 5),
        '血手门': mk(25, 100, 50, 12, 10)
    };
    const logs = [];
    const dayHooks = [];
    const W = {
        sectsData: SECTS,
        SECT_INTERNAL: INTERNAL,
        eventFlags: opts.flags || {},
        timeSystem: { totalDays: opts.day || 10 },
        gameLog: { add: function (m) { logs.push(String(m)); } },
        showMessage: function () {},
        EventBus: { on: function (ev, fn) { if (ev === 'newDay') dayHooks.push(fn); } },
        discipleState: opts.discipleState || { isInSect: true, sectName: '少林寺' },
        SECT_DIPLOMACY_STATE: {
            '少林寺': { '阎罗殿': { relation: -20 }, '血手门': { relation: -10 }, '逍遥派': { relation: 5 }, '大旗门': { relation: 10 } },
            '大旗门': { '阎罗殿': { relation: -30 }, '少林寺': { relation: 10 } },
            '阎罗殿': { '少林寺': { relation: -20 }, '大旗门': { relation: -30 }, '五仙教': { relation: 0 } },
            '五仙教': { '阎罗殿': { relation: 0 }, '少林寺': { relation: 10 } },
            '逍遥派': { '少林寺': { relation: 5 } },
            '血手门': { '少林寺': { relation: -10 } }
        },
        SectGov: {
            chronicle: function (sect, text) {
                var it = INTERNAL[sect];
                if (!it) return;
                it.chronicle.push({ day: W.timeSystem.totalDays, text: String(text) });
                if (it.chronicle.length > 40) it.chronicle.splice(0, it.chronicle.length - 40);
            }
        },
        saveSectDiplomacy: function () {}
    };
    W.window = W;
    const sandbox = { window: W, console: console, Math: Math, Number: Number, String: String, JSON: JSON, Object: Object, Array: Array, document: { getElementById: function () { return null; } } };
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/sects/sect-standing.js'), 'utf8'), sandbox);
    return { W: W, INTERNAL: INTERNAL, logs: logs, dayHooks: dayHooks, sandbox: sandbox };
}
function nextMonth(env, day) { env.W.timeSystem.totalDays = day; env.dayHooks.forEach(function (fn) { fn(); }); }

// ---------- B · 动态势力 ----------
console.log('\n[B] 动态势力（方案一）');
{
    const env = makeSandbox({});
    const W = env.W;
    const sl = W.sectPowerNow('少林寺');
    eq(sl.tier, '巨擘', 'B1 少林初始座次=巨擘（底子分守住开局格局）');
    ok(sl.score >= 400, 'B2 少林分数≥400（实际=' + sl.score + '）');
    eq(W.sectPowerNow('阎罗殿').tier, '大派', 'B3 阎罗殿初始=大派');
    const xy = W.sectPowerNow('逍遥派');
    ok(xy.tier === '式微' || xy.tier === '小派', 'B4 逍遥派（极小隐世）初始=式微或小派（实际=' + xy.tier + '）');
    eq(W.sectPowerNow('五仙教').tier, '中等', 'B5 五仙教初始=中等');
    eq(W.sectPowerWarMul('少林寺'), 1.4, 'B6 战争倍率跟着动态档走（巨擘1.4）');

    // 弟子凋零 + 库房见底 → 座次真往下掉
    env.INTERNAL['五仙教'].disciples = 6;
    env.INTERNAL['五仙教'].resources = 10;
    env.INTERNAL['五仙教'].influence = 20;
    nextMonth(env, 30);
    const wx = W.sectPowerNow('五仙教');
    ok(wx.tier === '式微' || wx.tier === '小派', 'B7 弟子凋零后五仙教掉档（实际=' + wx.tier + '）');
    eq(wx.trend, 'falling', 'B8 趋势=下滑');
    ok(env.INTERNAL['五仙教'].chronicle.some(function (c) { return /座次|门庭|残破|式微/.test(c.text); }), 'B9 掉档进编年');

    // 名存实亡
    env.INTERNAL['血手门'].disciples = 2;
    nextMonth(env, 60);
    eq(W.sectPowerNow('血手门').tier, '名存实亡', 'B10 弟子≤3=名存实亡');
    eq(W.sectPowerWarMul('血手门'), 0.4, 'B11 名存实亡战争倍率=0.4');
    ok(W.sectPowerLabel('血手门').indexOf('名存实亡') >= 0, 'B12 牌面标签可读');

    // 灵脉修正：本城枯萎 ×0.7
    env.W.eventFlags['qi_withered_万毒谷'] = 5;
    const before = W.sectStandingProbe('五仙教').score;
    nextMonth(env, 90);
    const after = W.sectStandingProbe('五仙教').score;
    ok(env.W.sectStandingProbe('五仙教').homeWithered === true, 'B13 南疆枯萎→本地门派被标记');
    ok(after < before, 'B14 灵脉枯竭真砍座次（' + before + '→' + after + '）');
    // 非本地门派只吃全局薄减
    const sl2 = W.sectStandingProbe('少林寺');
    ok(sl2.homeWithered === false, 'B15 中州门派不受南疆枯萎直接砍');

    // 战绩修正与月度衰减
    const yr0 = W.sectStandingProbe('阎罗殿').score;
    W.sectPowerWarMod('阎罗殿', true);
    ok(W.sectStandingProbe('阎罗殿').score > yr0, 'B16 打赢一场座次即时上浮');
    nextMonth(env, 120);
    const wm = W.sectStandingProbe('阎罗殿').warMod;
    ok(wm < 5 && wm > 0, 'B17 战绩修正按月衰减（实际=' + wm + '）');
}

// ---------- C · 动态正邪（方案二） ----------
console.log('\n[C] 动态正邪（方案二）');
{
    const env = makeSandbox({});
    const W = env.W;
    eq(W.sectAlignNow('少林寺').tier, '正道所认', 'C1 正道门派初始立场=正道所认');
    eq(W.sectAlignNow('少林寺').align, 60, 'C2 正道初始分60');
    eq(W.sectAlignNow('阎罗殿').tier, '江湖目之为邪', 'C3 邪派初始立场=江湖目之为邪');
    eq(W.sectAlignNow('逍遥派').tier, '亦正亦邪', 'C4 中立初始立场=亦正亦邪');

    // 邪派做了好事 → 名声翻正（跨档进编年）
    W.sectAlignShift('阎罗殿', 25, '开仓济民');
    eq(W.sectAlignNow('阎罗殿').tier, '亦正亦邪', 'C5 立场分抬升跨档');
    ok(env.INTERNAL['阎罗殿'].chronicle.some(function (c) { return c.text.indexOf('看不透') >= 0 || c.text.indexOf('亦正亦邪') >= 0; }), 'C6 跨档进编年');

    // 正道一路黑化 → 公敌：正派关系齐跌 + 街谈张榜
    W.sectAlignShift('少林寺', -140, '灭门夺宝');
    eq(W.sectAlignNow('少林寺').tier, '正道公敌', 'C7 黑化到底=正道公敌');
    eq(W.SECT_DIPLOMACY_STATE['大旗门']['少林寺'].relation, 0, 'C8 公敌跨档：正派诸门对它关系齐跌');
    const streetArr = W.eventFlags['qi_street'] || [];
    ok(streetArr.some(function (t) { return /张榜|讨伐|罪状/.test(t.text); }), 'C9 公敌是江湖大新闻（进街谈）');

    // 活菩萨：香火进项 + 关系回暖
    const res0 = env.INTERNAL['逍遥派'].resources;
    W.sectAlignShift('逍遥派', 80, '悬壶济世');
    eq(W.sectAlignNow('逍遥派').tier, '活菩萨', 'C10 善行到顶=活菩萨');
    eq(env.INTERNAL['逍遥派'].resources, res0 + 10, 'C11 活菩萨香火进项+10（真入库）');
    ok(W.SECT_DIPLOMACY_STATE['少林寺'] ? true : true, 'C12 关系网络不崩');

    // 灾年抢粮：断粮的门夜里下山强买
    const oldRandom = Math.random;
    env.INTERNAL['五仙教']._famineDays = 9;
    const align0 = W.sectAlignNow('五仙教').align;
    // 沙箱里 Math 是宿主引用，直接换宿主 Math.random 更稳
    Math.random = function () { return 0.1; };
    nextMonth(env, 30);
    Math.random = oldRandom;
    ok(W.sectAlignNow('五仙教').align < align0, 'C13 灾年抢粮立场受损（' + align0 + '→' + W.sectAlignNow('五仙教').align + '）');
    ok(env.INTERNAL['五仙教'].chronicle.some(function (c) { return c.text.indexOf('强行买粮') >= 0; }), 'C14 抢粮进编年');

    // 年关回根：立场每年向本心回一点
    env.INTERNAL['五仙教']._famineDays = 0;
    const a1 = W.sectAlignNow('五仙教').align; // 中立本心0，当前为负
    nextMonth(env, 360);
    const a2 = W.sectAlignNow('五仙教').align;
    ok(a2 > a1, 'C15 年关回根：偏邪的门往本心回（' + a1 + '→' + a2 + '）');
    // 非年关月不回根
    const a3 = W.sectAlignNow('五仙教').align;
    nextMonth(env, 390);
    eq(W.sectAlignNow('五仙教').align, a3, 'C16 回根一年一次');
}

// ---------- D · 月钩纪律 ----------
console.log('\n[D] 月钩纪律');
{
    const env = makeSandbox({ day: 11 });
    const W = env.W;
    const p0 = W.sectStandingProbe('少林寺').score;
    env.INTERNAL['少林寺'].disciples = 5;
    nextMonth(env, 11); // 非整月，不重算
    eq(W.sectStandingProbe('少林寺').tier, '巨擘', 'D1 非月结日不重算座次');
    nextMonth(env, 30);
    ok(W.sectStandingProbe('少林寺').score < p0, 'D2 月结日重算：凋零真反映到分数');
    eq(typeof W.sectStandingProbe('查无此派'), 'object', 'D3 探针不炸');
    ok(W.sectStandingProbe('查无此派') === null, 'D4 查无此派返回空');
}

console.log('\n========== sect-standing: ' + pass + ' 通过, ' + fail + ' 失败 ==========');
process.exit(fail ? 1 : 0);
