// sect-diplomacy-world-node.js — 江湖风云（AI门派外交档案是活的）vm 沙箱测试
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

// ---------- A · 接线 ----------
console.log('\n[A] 接线');
const html = fs.readFileSync(path.join(ROOT, '仙侠.html'), 'utf8');
ok(html.includes('js/sects/sect-diplomacy-world.js'), 'A1 html 挂载');
const visitSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-visit.js'), 'utf8');
ok(visitSrc.includes('openWorldDiplomacy') && visitSrc.includes('江湖风云'), 'A2 外交面板挂风云册入口');
const warSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-war.js'), 'utf8');
ok(warSrc.includes('sectAlignNow') && warSrc.includes('myScore'), 'A3 自立宗门外交初始关系按动态立场算底色');
const modSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-diplomacy-world.js'), 'utf8');
ok(!/冷却|次数上限|配额/.test(modSrc), 'A4 模块零配额句式');

// ---------- 沙箱 ----------
function makeSandbox(opts) {
    opts = opts || {};
    const NAMES = ['少林寺', '武当派', '丐帮', '阎罗殿', '五仙教', '血手门'];
    const SECTS = {
        '少林寺': { type: '正道', location: '中州' }, '武当派': { type: '正道', location: '中州' },
        '丐帮': { type: '正道', location: '南疆' }, '阎罗殿': { type: '邪派', location: '南疆' },
        '五仙教': { type: '中立', location: '南疆' }, '血手门': { type: '邪派', location: '北冥' }
    };
    const INTERNAL = {};
    NAMES.forEach(function (n) { INTERNAL[n] = { disciples: 20, resources: 200, influence: 50, chronicle: [] }; });
    const ALIGN = Object.assign({ '少林寺': 60, '武当派': 60, '丐帮': 60, '阎罗殿': -60, '五仙教': 0, '血手门': -60 }, opts.aligns || {});
    const SCORE = Object.assign({ '少林寺': 300, '武当派': 250, '丐帮': 260, '阎罗殿': 200, '五仙教': 150, '血手门': 180 }, opts.scores || {});
    const DIP = {};
    NAMES.forEach(function (a) {
        DIP[a] = {};
        NAMES.forEach(function (b) {
            if (a === b) return;
            DIP[a][b] = { relation: (opts.rel && opts.rel[a] && opts.rel[a][b] != null) ? opts.rel[a][b] : 40, trade: 0, conflicts: 0, lastEvent: 0, treaties: [] };
        });
    });
    const logs = [], dayHooks = [], warModCalls = [], alignCalls = [];
    const stt = { modal: null, msgs: [], saved: 0 };
    const W = {
        sectsData: SECTS,
        SECT_INTERNAL: INTERNAL,
        SECT_DIPLOMACY_STATE: DIP,
        eventFlags: {},
        timeSystem: { totalDays: opts.day || 100 },
        gameLog: { add: function (m) { logs.push(String(m)); } },
        showMessage: function (m) { stt.msgs.push(String(m)); },
        showModal: function (t, b) { stt.modal = { title: t, body: b }; },
        EventBus: { on: function (ev, fn) { if (ev === 'newDay') dayHooks.push(fn); } },
        discipleState: { isInSect: true, sectName: '少林寺' },
        currentCharData: { name: '李长风', fame: 0 },
        advanceTime: function () { stt.advanced = true; },
        XianXia: { DataManager: { addSpiritStones: function (n) { stt.stones = (stt.stones || 0) + n; } } },
        sectAlignNow: function (s) { return { align: ALIGN[s] == null ? 0 : ALIGN[s] }; },
        sectPowerNow: function (s) { return { score: SCORE[s] || 150, tier: '中等' }; },
        sectPowerWarMod: function (s, win) { warModCalls.push({ sect: s, win: win }); },
        sectAlignShift: function (s, d, r) { alignCalls.push({ sect: s, delta: d, reason: r }); },
        saveSectDiplomacy: function () { stt.saved++; },
        SectGov: {
            chronicle: function (sect, text) {
                var it = INTERNAL[sect];
                if (!it) return;
                it.chronicle.push({ day: W.timeSystem.totalDays, text: String(text) });
            }
        }
    };
    W.window = W;
    const sandbox = { window: W, console: console, Math: Math, Number: Number, String: String, JSON: JSON, Object: Object, Array: Array, document: { getElementById: function () { return null; } } };
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/sects/sect-diplomacy-world.js'), 'utf8'), sandbox);
    return { W: W, INTERNAL: INTERNAL, DIP: DIP, logs: logs, dayHooks: dayHooks, stt: stt, warModCalls: warModCalls, alignCalls: alignCalls, NAMES: NAMES };
}
function tick(env, day) { env.W.timeSystem.totalDays = day; env.dayHooks.forEach(function (fn) { fn(); }); }
function withRandom(v, fn) { const o = Math.random; Math.random = function () { return typeof v === 'function' ? v() : v; }; try { return fn(); } finally { Math.random = o; } }

// ---------- B · 底色回归（档案跟着立场走） ----------
console.log('\n[B] 底色回归');
{
    // 武当(60) vs 丐帮(60)：底色 = 60 - 0 + 5(同乡? 武当中州 丐帮南疆 → 无) = 60；当前 90 → 每月-1
    const env = makeSandbox({ rel: { '武当派': { '丐帮': 90 }, '丐帮': { '武当派': 90 } } });
    withRandom(0.1, function () { tick(env, 120); }); // 月度事件固定砸到别对，不搅动本对
    eq(env.DIP['武当派']['丐帮'].relation, 89, 'B1 关系向动态底色一格一格回');
    eq(env.DIP['丐帮']['武当派'].relation, 89, 'B2 双向同步');
    withRandom(0.1, function () { tick(env, 150); });
    eq(env.DIP['武当派']['丐帮'].relation, 88, 'B3 月月都回，不是一锤子');
    // 立场变了，底色跟着变：丐帮黑化到 -60 → 底色 = (60-60)/2 - 120/3 = -40 → 关系开始往下走
    const env2 = makeSandbox({ aligns: { '丐帮': -60 }, rel: { '武当派': { '丐帮': 90 }, '丐帮': { '武当派': 90 } } });
    withRandom(0.1, function () { tick(env2, 120); });
    eq(env2.DIP['武当派']['丐帮'].relation, 89, 'B4 底色远也先回一格（旧交慢慢冷）');
    // 玩家的门派不被后台动账（自家恩怨自己走）
    const env3 = makeSandbox({ rel: { '少林寺': { '武当派': 77 }, '武当派': { '少林寺': 77 } } });
    tick(env3, 120);
    eq(env3.DIP['少林寺']['武当派'].relation, 77, 'B5 玩家门派的恩怨不被后台稀释');
}

// ---------- C · 月度江湖事 ----------
console.log('\n[C] 月度江湖事');
{
    // 摩擦（r=0.1<0.3）
    const env = makeSandbox({});
    tick(env, 120);
    withRandom(0.1, function () { tick(env, 150); });
    // 第一对 AI 组合吃了摩擦：关系-8、两家编年各记一笔
    let found = null;
    outer: for (const a of env.NAMES) for (const b of env.NAMES) {
        if (a === '少林寺' || b === '少林寺' || a === b) continue;
        if (env.INTERNAL[a].chronicle.some(c => c.text.includes('动了手') && c.text.includes(b)) &&
            env.INTERNAL[b].chronicle.some(c => c.text.includes('动了手') && c.text.includes(a))) { found = [a, b]; break outer; }
    }
    ok(found, 'C1 月度江湖事真发生（市集动手）');
    ok(found && env.DIP[found[0]][found[1]].relation < 40, 'C2 摩擦后关系真跌');
    ok(found && env.INTERNAL[found[1]].chronicle.some(c => c.text.includes('动了手')), 'C3 两家编年各记一笔');
    ok(env.stt.saved > 0, 'C4 档案落存');
    // 商队（r=0.7）：两家各入灵石十枚（守恒：贸易双赢有钱进来）
    const env2 = makeSandbox({});
    const resBefore = {};
    env2.NAMES.forEach(n => resBefore[n] = env2.INTERNAL[n].resources);
    withRandom(0.7, function () { tick(env2, 120); });
    let traders = null;
    for (const a of env2.NAMES) for (const b of env2.NAMES) {
        if (a === '少林寺' || b === '少林寺' || a === b) continue;
        if (env2.DIP[a][b].trade > 0 && env2.INTERNAL[a].chronicle.some(c => c.text.includes('商队走起来了')) && env2.INTERNAL[b].chronicle.some(c => c.text.includes('商队走起来了'))) { traders = [a, b]; break; }
    }
    ok(traders, 'C5 商队事件发生');
    ok(traders && env2.INTERNAL[traders[0]].resources === resBefore[traders[0]] + 20 && env2.INTERNAL[traders[1]].resources === resBefore[traders[1]] + 20, 'C6 商队双赢各入十枚（月度两桩都走商队→各+20，真入库）');
    // 劫掠（r=0.95）：苦主失四十，劫案的贼得三十（过手折一成）
    const env3 = makeSandbox({});
    withRandom(0.95, function () { tick(env3, 120); });
    let victim = null, raider = null;
    for (const a of env3.NAMES) {
        if (env3.INTERNAL[a].chronicle.some(c => c.text.includes('蒙面人'))) victim = a;
        if (env3.INTERNAL[a].chronicle.some(c => c.text.includes('撕去了半角'))) raider = a;
    }
    ok(victim && raider && victim !== raider, 'C7 劫掠案发生（苦主与贼各有编年）');
    eq(env3.INTERNAL[victim].resources, 200 - 80, 'C8 苦主真失灵石（两桩劫案各失四十）');
    eq(env3.INTERNAL[raider].resources, 200 + 60, 'C9 贼各得三十（过手折一成，守恒）');
    // 死仇阈值进街谈：把摩擦事件精确砸到阎罗殿-血手门那一对（pairs[8]）
    const env4 = makeSandbox({ rel: { '阎罗殿': { '血手门': -68 }, '血手门': { '阎罗殿': -68 } } });
    let qi = 0;
    const queue = [0.85, 0.1, 0.9, 0.6, 0.99, 0.99, 0.99, 0.99];
    withRandom(function () { return queue[Math.min(qi++, queue.length - 1)]; }, function () { tick(env4, 120); });
    ok(env4.DIP['阎罗殿']['血手门'].relation <= -70, 'C10a 一桩摩擦把旧怨压成死仇');
    ok((env4.W.eventFlags['qi_street'] || []).some(t => t.text.includes('死仇')), 'C10 结死仇是街谈大新闻');
}

// ---------- D · AI 战争（战云→开打，后台真打） ----------
console.log('\n[D] AI 战争');
{
    const env = makeSandbox({
        day: 120,
        rel: { '阎罗殿': { '血手门': -80 }, '血手门': { '阎罗殿': -80 } }
    });
    env.DIP['阎罗殿']['血手门'].lastEvent = 0;
    // 战云：点兵集结，街谈传开，玩家收到风云提示
    withRandom(0.01, function () { tick(env, 150); });
    let pr = env.W.sectWorldDiploProbe();
    ok(pr.pending && pr.pending.atk === '阎罗殿' && pr.pending.def === '血手门', 'D1 死仇点兵——战云落档（攻守有名）');
    ok(env.logs.some(l => l.includes('点兵') || l.includes('撕破脸')), 'D1b 战云有江湖风云提示（观战入口可被发现）');
    ok((env.W.eventFlags['qi_street'] || []).some(t => t.text.includes('点兵')), 'D1c 点兵消息进街谈');
    eq((env.W.eventFlags['sect_world_wars'] || []).length, 0, 'D2 集结期还没开打');
    // 开打：strikeDay=153，胜负按动态势力分+守方地利
    withRandom(0.01, function () { tick(env, 153); });
    const ws = env.W.eventFlags['sect_world_wars'] || [];
    eq(ws.length, 1, 'D3 战云落定，一仗打完');
    const w = ws[0];
    eq(w.winner, '阎罗殿', 'D4 胜负按动态势力分+守方地利（200压180+地利）');
    ok(env.INTERNAL[w.loser].resources < 200, 'D5 败方库房真被搬（守恒）');
    const lostN = 200 - env.INTERNAL[w.loser].resources;
    eq(env.INTERNAL[w.winner].resources, 200 + Math.round(lostN * 0.6), 'D6 胜方缴获=败方所失六成（战损折四成，账对得上）');
    ok(env.INTERNAL[w.loser].disciples < 20, 'D7 败方弟子真死伤');
    ok(env.warModCalls.some(c => c.sect === w.winner && c.win) && env.warModCalls.some(c => c.sect === w.loser && !c.win), 'D8 战绩修正真落座次（sect-standing 联动）');
    ok(env.alignCalls.some(c => c.sect === w.atk && c.delta === -3) && env.alignCalls.some(c => c.sect === w.def && c.delta === 2), 'D9 攻山损名守山长脸（立场口径一致）');
    ok(env.INTERNAL[w.winner].chronicle.some(c => c.text.includes('踏破')), 'D10 胜方编年记战功');
    ok(env.INTERNAL[w.loser].chronicle.some(c => c.text.includes('此仇')), 'D11 败方编年记仇');
    ok((env.W.eventFlags['qi_street'] || []).some(t => t.text.includes('踏破')), 'D12 开打是街谈大新闻');
    ok(Array.isArray(w.report) && w.report.length === 3, 'D13 战报三折留档（可回放）');
    eq(env.W.sectWorldDiploProbe().pending, null, 'D14 打完战云出清');
    // 冷却：九十日内同一对不再点兵
    withRandom(0.01, function () { tick(env, 180); });
    eq((env.W.eventFlags['sect_world_wars'] || []).length, 1, 'D15 九十日内同一对不再开打');
    eq(env.W.sectWorldDiploProbe().pending, null, 'D16 冷却期无新战云');
    // 玩家门派永不被动卷入
    const env2 = makeSandbox({ day: 120, rel: { '少林寺': { '阎罗殿': -90 }, '阎罗殿': { '少林寺': -90 } } });
    withRandom(0.01, function () { tick(env2, 150); });
    eq(env2.W.sectWorldDiploProbe().pending, null, 'D17 后台不点兵玩家的门派（走玩家战争线）');
}

// ---------- D2 · 观战（到场的人才有份） ----------
console.log('\n[D2] 观战');
{
    const env = makeSandbox({ day: 120, rel: { '阎罗殿': { '血手门': -80 }, '血手门': { '阎罗殿': -80 } } });
    withRandom(0.01, function () { tick(env, 150); });
    ok(env.W.sectWorldDiploProbe().pending, 'W1 战云在场');
    eq(env.W.doWatchWar(), true, 'W2 赶去观战');
    eq(env.stt.advanced, true, 'W3 观战真耗半日脚程');
    eq(env.W.sectWorldDiploProbe().pending.witnessed, true, 'W4 对面山坡占了位置');
    eq(env.W.doWatchWar(), false, 'W5 位置只有一个，不重复占');
    withRandom(0.01, function () { tick(env, 153); });
    eq(env.W.currentCharData.fame, 2, 'W6 亲眼看过的仗，名望+2');
    ok((env.W.eventFlags['qi_street'] || []).some(t => t.text.includes('亲眼看过')), 'W7 街谈里多了个在场的说书人');
    ok(env.logs.some(l => l.includes('看完了这一仗')), 'W8 战报当面讲给观战的人');
    eq(env.stt.stones || 0, 10, 'W9 无主辎重可捡（来路：战损折掉的四成）');
    // 没到场的人没有这些
    const env2 = makeSandbox({ day: 120, rel: { '阎罗殿': { '血手门': -80 }, '血手门': { '阎罗殿': -80 } } });
    withRandom(0.01, function () { tick(env2, 150); });
    withRandom(0.01, function () { tick(env2, 153); });
    eq(env2.W.currentCharData.fame, 0, 'W10 没到场，名望不涨');
    eq(env2.stt.stones || 0, 0, 'W11 没到场，辎重没份');
}

// ---------- E · 江湖风云册 ----------
console.log('\n[E] 江湖风云册');
{
    const env = makeSandbox({ rel: { '阎罗殿': { '血手门': -85 }, '血手门': { '阎罗殿': -85 }, '武当派': { '丐帮': 85 }, '丐帮': { '武当派': 85 } } });
    withRandom(0.01, function () { tick(env, 150); }); // 点兵
    env.W.openWorldDiplomacy();
    let body = env.stt.modal.body;
    ok(env.stt.modal.title.includes('江湖风云'), 'E1 风云册开卷');
    ok(body.includes('山下点兵') && body.includes('赶去观战'), 'E2 战云块挂观战入口');
    ok(body.includes('死仇簿') && body.includes('阎罗殿') && body.includes('血手门'), 'E3 死仇簿列名');
    ok(body.includes('结盟簿') && body.includes('武当派'), 'E4 结盟簿列名');
    withRandom(0.01, function () { tick(env, 156); }); // 开打
    env.W.openWorldDiplomacy();
    body = env.stt.modal.body;
    ok(body.includes('近来战事') && body.includes('踏破') && body.includes('翻战报'), 'E5 战事列表挂战报回放');
    ok(!body.includes('山下点兵'), 'E6 打完战云块收起');
    // 战报回放
    env.stt.modal = null;
    env.W.openWarReport(0);
    ok(env.stt.modal && env.stt.modal.title.includes('战报'), 'E7 战报开卷');
    const rb = env.stt.modal.body;
    ok(rb.includes('天没亮') && rb.includes('战后清点'), 'E8 战报三折有头有尾');
    ok(env.stt.modal.body.includes('阎罗殿') || env.stt.modal.body.includes('血手门'), 'E9 战报点名两家');
    ok(!body.includes('少林寺') || body.includes('自家门派'), 'E10 玩家自家恩怨不入风云册');
    const pr = env.W.sectWorldDiploProbe();
    eq(pr.missing, 0, 'E11 档案矩阵无缺页');
    ok(pr.pairs > 0 && pr.wars >= 1 && pr.pending === null, 'E12 探针可查（对数/战事/战云）');
}

console.log('\n========== sect-diplomacy-world: ' + pass + ' 通过, ' + fail + ' 失败 ==========');
process.exit(fail ? 1 : 0);
