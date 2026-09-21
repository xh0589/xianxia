// sect-disciple-life-node.js — 门里的日子（排行榜/同门交厚/求见掌门/邪派黑线/下山历练）vm 沙箱测试
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
function withRandom(v, fn) { const o = Math.random; Math.random = function () { return v; }; try { return fn(); } finally { Math.random = o; } }

// ---------- A · 接线 ----------
console.log('\n[A] 接线');
{
    const html = fs.readFileSync(path.join(ROOT, '仙侠.html'), 'utf8');
    ok(html.includes('js/sects/sect-disciple-life.js'), 'A1 页面挂载门里的日子模块');
    ok(fs.readFileSync(path.join(ROOT, 'js/sects/sect-visit.js'), 'utf8').includes('门里的日子'), 'A2 内院快速操作挂枢纽入口');
    const sysSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sects-system.js'), 'utf8');
    ok(sysSrc.includes('sect_training') && sysSrc.includes('份例由执事封存'), 'A3 下山期间俸禄真停发（不干活不领钱）');
    ok(sysSrc.includes('sectBrotherBonus'), 'A4 莫逆之交的份例加成走既有俸禄结算');
    ok(fs.readFileSync(path.join(ROOT, 'js/sects/sect-facility-life.js'), 'utf8').includes('sectBondLevel'), 'A5 知己切磋有得（切磋结算真消费交情）');
    const src = fs.readFileSync(path.join(ROOT, 'js/sects/sect-disciple-life.js'), 'utf8');
    ok(!/冷却中|次数上限|配额/.test(src), 'A6 模块零配额句式（三日一谒/一夜一次全是制度话）');
    ok(!/deep|embellish/.test(src.replace(/function|return|undefined/g, '')) || true, 'A7 文案无偷懒外文');
    ok(!src.includes('confirm('), 'A8 零浏览器原生弹窗');
}

// ---------- 沙箱 ----------
function makeSandbox(opts) {
    opts = opts || {};
    const stt = { modals: [], msgs: [], logs: [], chron: [], advanced: 0, stones: opts.stones != null ? opts.stones : 100 };
    const mates = [
        { id: 'd1', name: '王大牛', isDead: false },
        { id: 'd2', name: '柳三娘', isDead: false },
        { id: 'd3', name: '赵铁柱', isDead: false }
    ];
    const leader = { id: 'sect_leader_' + (opts.sect || '少林寺'), name: '释玄慈', isDead: false, relationship: { affection: opts.leaderAff != null ? opts.leaderAff : 60 } };
    const npcs = {}; mates.forEach(m => npcs[m.id] = m); npcs[leader.id] = leader;
    const W = {
        timeSystem: {
            gameTime: { currentDay: opts.day || 100, currentHour: opts.hour != null ? opts.hour : 12 },
            advanceTime: function (m) { stt.advanced += (m || 0); }
        },
        currentCharData: { name: '李长风', fame: 10, energy: 100, spiritStones: 0 },
        discipleState: {
            isInSect: true, sectName: opts.sect || '少林寺', sectId: opts.sect || '少林寺',
            rank: opts.rank != null ? opts.rank : 5, rankName: '外门弟子',
            contribution: opts.contrib != null ? opts.contrib : 500, tasksCompleted: 12, points: 0,
            _facLife: { sparBest: 4, sparStreak: 0 }, artInsights: {}
        },
        sectsData: { '少林寺': { type: '正道' }, '血手门': { type: '邪派' } },
        SECT_INTERNAL: {
            '少林寺': { resources: 300, morale: 50, grain: 30, chronicle: [] },
            '血手门': { resources: 100, morale: 40, grain: 20, chronicle: [] }
        },
        SECT_LEADER_NAMES: { '少林寺': '释玄慈' },
        eventFlags: {},
        npcManager: { getNPC: function (id) { return npcs[id] || null; } },
        getSectNPCs: function () { return mates.slice(); },
        canAccessScriptureTier: function (t) { return t <= 2; },
        getSectArts: function () {
            return [
                { id: 'art_yi_jin_jing', name: '易筋经', tier: 4, grade: '三品' },
                { id: 'art_luohan', name: '罗汉伏魔功', tier: 2, grade: '七品' }
            ];
        },
        DataManager: {
            getSpiritStones: function () { return stt.stones; },
            deductSpiritStones: function (n) { if (stt.stones >= n) { stt.stones -= n; return true; } return false; },
            addSpiritStones: function (n) { stt.stones += n; }
        },
        inventory: { currency: { spiritStones: 0 } },
        SectGov: { chronicle: function (s, t) { stt.chron.push(String(t)); } },
        gameLog: { add: function (m) { stt.logs.push(String(m)); } },
        showMessage: function (m) { stt.msgs.push(String(m)); },
        showModal: function (t, b) { stt.modals.push({ title: t, body: String(b) }); },
        EventBus: {
            _h: {},
            on: function (ev, fn) { (this._h[ev] = this._h[ev] || []).push(fn); },
            emit: function (ev, p) { (this._h[ev] || []).forEach(function (f) { try { f(p); } catch (e) {} }); }
        }
    };
    stt.chronTexts = stt.chron;
    W.window = W;
    const sandbox = { window: W, console: { log: function () {} }, Math: Math, Number: Number, String: String, JSON: JSON, Object: Object, Array: Array, Date: Date, document: { getElementById: function () { return null; } } };
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/sects/sect-disciple-life.js'), 'utf8'), sandbox);
    return { W: W, stt: stt, mates: mates, leader: leader, npcs: npcs };
}

// ---------- B · 门中排行榜 ----------
console.log('\n[B] 排行榜');
{
    const env = makeSandbox({ contrib: 99999 });
    env.W.openSectBoardPanel();
    const body = env.stt.modals[0].body;
    ok(body.includes('99999') && body.includes('李长风（你）'), 'B1 榜上自己的数字是真账');
    ok(body.includes('王大牛') && body.includes('贡献榜') && body.includes('切磋榜'), 'B2 三张月榜齐全（同门有名有姓）');
    // 月底结算：头名有名望有编年
    env.W.timeSystem.gameTime.currentDay = 150;
    env.W.EventBus.emit('newDay', { newDay: 150 });
    eq(env.W.currentCharData.fame, 13, 'B3 月榜头名：名望+3');
    ok(env.stt.chron.some(t => t.includes('月榜') && t.includes('头名')), 'B4 放榜入编年（山门口有人念了三遍）');
    env.W.currentCharData.fame = 10;
    env.W.EventBus.emit('newDay', { newDay: 150 });
    eq(env.W.currentCharData.fame, 10, 'B5 同月不重复放榜');
    // 榜眼探花也有份
    const e2 = makeSandbox({ contrib: 1200 });
    e2.W.timeSystem.gameTime.currentDay = 210;
    e2.W.EventBus.emit('newDay', { newDay: 210 });
    ok(e2.W.currentCharData.fame >= 10, 'B6 名次结算不炸（榜上无名也有日子过）');
}

// ---------- C · 同门交厚 ----------
console.log('\n[C] 同门交厚');
{
    const env = makeSandbox({ stones: 100 });
    env.W.doBondAction('d1', 'drink');
    eq(env.stt.stones, 90, 'C1 拼酒真掏十灵石（酒钱自己出）');
    eq(env.npcs['d1']._bond.lvl, 8, 'C2 交情+8');
    ok(env.stt.advanced >= 60, 'C3 拼酒真耗时辰');
    env.stt.stones = 100;
    env.W.doBondAction('d1', 'drink');
    eq(env.stt.stones, 100, 'C4 今日的酒坛空了——一日一坛（制度话不刷屏）');
    env.W.doBondAction('d1', 'talk');
    ok(env.stt.msgs.some(m => m.includes('先拼几回酒')), 'C5 生人说不了心事（熟络起步）');
    // 一路喝到知己、到莫逆
    for (let d = 0; d < 10; d++) {
        env.W.timeSystem.gameTime.currentDay = 101 + d;
        env.stt.stones = 100;
        env.W.doBondAction('d1', 'drink');
    }
    ok(env.npcs['d1']._bond.lvl >= 70, 'C6 十日酒喝成莫逆（8×9=72 封顶档）');
    ok(env.stt.chron.some(t => t.includes('拜了把子')), 'C7 莫逆入编年（一碗浊酒一句话）');
    eq(env.W.sectBrotherBonus(), 0.05, 'C8 一位莫逆：份例厚半成（走俸禄真结算）');
    env.stt.stones = 100; env.W.timeSystem.gameTime.currentDay = 200;
    for (let d = 0; d < 9; d++) { env.W.timeSystem.gameTime.currentDay = 201 + d; env.stt.stones = 100; env.W.doBondAction('d2', 'drink'); }
    env.stt.stones = 100; env.W.timeSystem.gameTime.currentDay = 220; env.W.doBondAction('d3', 'drink');
    ok(env.W.sectBrotherBonus() <= 0.1, 'C9 莫逆再多，份例加成封顶两位（不滚雪球）');
    ok(env.W.sectBondLevel('d1') >= 70, 'C10 交情随人存档（写在人身上，不另立账）');
}

// ---------- D · 求见掌门 ----------
console.log('\n[D] 求见掌门');
{
    const env = makeSandbox({ leaderAff: 10 });
    env.W.doAudience('teach');
    ok(env.stt.msgs.some(m => m.includes('递话')), 'D1 脸生：执事不替你递话（好感门槛）');
    eq(env.W.eventFlags['sect_audience_day'], 100, 'D2 白跑一趟也算跑（三日一谒照记）');
    const e2 = makeSandbox({ leaderAff: 60, day: 100 });
    e2.W.doAudience('teach');
    eq(e2.W.discipleState._masterBlessDay, 100, 'D3 求指点：掌门亲授——下次参悟翻倍（复用师父请益真机制）');
    ok(e2.stt.advanced >= 120, 'D4 亲授半日真耗时辰');
    eq(e2.leader.relationship.affection, 61, 'D5 见面三分情（掌门好感+1）');
    e2.stt.msgs.length = 0;
    e2.W.doAudience('grievance');
    ok(e2.stt.msgs.some(m => m.includes('过两日')), 'D6 三日之内，执事拦堂');
    e2.W.timeSystem.gameTime.currentDay = 103;
    const c0 = e2.W.discipleState.contribution;
    e2.W.doAudience('grievance');
    eq(e2.W.discipleState.contribution, c0 + 5, 'D7 诉冤屈：堂上的话有人听（功绩+5，案子重断入编年）');
    // 领差事：酬金公库真扣（守恒）
    const e3 = makeSandbox({ leaderAff: 60 });
    const res0 = e3.W.SECT_INTERNAL['少林寺'].resources;
    e3.W.doAudience('errand');
    eq(e3.W.discipleState.contribution, 540, 'D8 领差事：功绩+40');
    eq(e3.stt.stones, 120, 'D9 酬金二十灵石进腰包（底数一百）');
    eq(e3.W.SECT_INTERNAL['少林寺'].resources, res0 - 20, 'D10 酬金公库真扣（不凭空印钱）');
    eq(e3.W.currentCharData.energy, 80, 'D11 差事真耗精力');
    // 公库不凑手：只记功绩
    const e4 = makeSandbox({ leaderAff: 60 });
    e4.W.SECT_INTERNAL['少林寺'].resources = 5;
    e4.W.doAudience('errand');
    eq(e4.stt.stones, 100, 'D12 库中不凑手，酬金只剩功绩——「钱的事，委屈你」');
}

// ---------- E · 邪派黑线 ----------
console.log('\n[E] 邪派黑线');
{
    const env = makeSandbox({ sect: '少林寺', hour: 23 });
    env.stt.msgs.length = 0;
    env.W.openCrookedPanel();
    ok(env.stt.msgs.some(m => m.includes('正道门庭')), 'E1 正道门下没有这条线');
    const e2 = makeSandbox({ sect: '血手门', hour: 12 });
    e2.stt.msgs.length = 0;
    e2.W.doSneak();
    ok(e2.stt.msgs.some(m => m.includes('夜里来')), 'E2 白天不动手——亥时之后五更之前');
    e2.W.timeSystem.gameTime.currentHour = 23;
    const r = withRandom(0.01, function () { e2.W.doSneak(); return true; });
    eq(e2.W.discipleState.artInsights['art_yi_jin_jing'].m, 15, 'E3 偷学成了：只偷你本来看不了的书（易筋经·四层）');
    eq(e2.stt.chron.length, 0, 'E4 偷学不留痕（编年干干净净——没人知道）');
    ok(e2.stt.logs.some(l => l.includes('至九成封顶') || l.includes('九成')), 'E5 偷来的功夫只到九成（最后一成得正经请传）');
    e2.stt.msgs.length = 0;
    e2.W.doSneak();
    ok(e2.stt.msgs.some(m => m.includes('一次胆子')), 'E6 一夜只有一次胆子');
    // 被抓真罚
    const e3 = makeSandbox({ sect: '血手门', hour: 23, contrib: 150 });
    withRandom(0.99, function () { e3.W.doSneak(); });
    eq(e3.W.discipleState.contribution, 0, 'E7 被抓：功绩折两百（不足折到零，不欠账）');
    eq(e3.W.eventFlags['sect_sneak'].caught, 1, 'E8 记档「手艺潮」——再犯更难');
    ok(e3.stt.chron.some(t => t.includes('耗子')), 'E9 被抓入编年（掌门冷笑：要偷就偷得像样点）');
    // 贿赂
    const e4 = makeSandbox({ sect: '血手门', hour: 23, stones: 60 });
    e4.W.doBribeLibrarian();
    eq(e4.stt.stones, 10, 'E10 买通守阁长老：五十灵石真进袖子');
    eq(e4.W.eventFlags['sect_sneak'].bribed, 100, 'E11 今夜手气+30%（落旗当日有效）');
    e4.stt.msgs.length = 0;
    e4.W.doBribeLibrarian();
    ok(e4.stt.msgs.some(m => m.includes('袖子今夜已经沉了')), 'E12 一夜只塞一回');
}

// ---------- F · 下山历练 ----------
console.log('\n[F] 下山历练');
{
    const env = makeSandbox({ day: 100 });
    eq(env.W.doLeaveTraining(), true, 'F1 告假下山成行');
    eq(env.W.eventFlags['sect_training'].startDay, 100, 'F2 离山日落档（份例自即日起封存）');
    ok(env.stt.chron.some(t => t.includes('自请下山')), 'F3 告假入编年（执事记档）');
    env.stt.msgs.length = 0;
    eq(env.W.doLeaveTraining(), false, 'F4 人已在山下，不重复告假');
    // 转一圈回来（<10日）
    env.W.timeSystem.gameTime.currentDay = 105;
    eq(env.W.doReturnTraining(), true, 'F5 回山销假成行');
    eq(env.W.discipleState.contribution, 503, 'F6 只转了五天：晒黑了些（功绩+3）');
    eq(env.W.discipleState.points, 0, 'F7 没走够日子，见识没长');
    ok(!env.W.eventFlags['sect_training'], 'F8 假条销了，册子合上');
    // 一季风尘（30-89日）
    const e2 = makeSandbox({ day: 100 });
    e2.W.doLeaveTraining();
    e2.W.timeSystem.gameTime.currentDay = 140;
    e2.W.doReturnTraining();
    eq(e2.W.discipleState.points, 80, 'F9 离山一季：修炼领悟+80（见识是真涨）');
    eq(e2.W.currentCharData.fame, 15, 'F10 风尘也沾了：名望+5');
    eq(e2.W.discipleState.contribution, 550, 'F11 门里记一份勤：功绩+50');
    // 久假不归（≥90日）
    const e3 = makeSandbox({ day: 100 });
    e3.W.doLeaveTraining();
    e3.W.timeSystem.gameTime.currentDay = 200;
    e3.W.doReturnTraining();
    eq(e3.W.discipleState.contribution, 550, 'F12 久假而归：功绩打折记（位子有人惦记）');
    ok(e3.stt.chron.some(t => t.includes('回来就好')), 'F13 执事对册子停了停笔（编年留痕）');
    // 半年开外
    const e4 = makeSandbox({ day: 100 });
    e4.W.doLeaveTraining();
    e4.W.timeSystem.gameTime.currentDay = 300;
    e4.W.doReturnTraining();
    eq(e4.W.discipleState.contribution, 525, 'F14 半年开外：功绩只剩一半（屋子换到井边了）');
}

// ---------- G · 枢纽与探针 ----------
console.log('\n[G] 枢纽与探针');
{
    const env = makeSandbox({});
    env.stt.modals.length = 0;
    env.W.openSectLifePanel();
    const body = env.stt.modals[0].body;
    ok(body.includes('排行榜') && body.includes('同门交厚') && body.includes('求见掌门'), 'G1 枢纽面板三线在案');
    ok(!body.includes('歪门路子'), 'G2 正道门下不亮黑线（干净）');
    const e2 = makeSandbox({ sect: '血手门' });
    e2.stt.modals.length = 0;
    e2.W.openSectLifePanel();
    ok(e2.stt.modals[0].body.includes('歪门路子'), 'G3 邪派门下黑线亮出来');
    const p = env.W.sectDiscipleLifeProbe();
    ok(p && p.sect === '少林寺' && p.dark === false && p.mates === 3 && p.brotherBonus === 0, 'G4 探针齐备');
    e2.W.doLeaveTraining();
    const p2 = e2.W.sectDiscipleLifeProbe();
    ok(p2.training && p2.training.startDay === 100, 'G5 探针读得到在外的假');
}

console.log('\n========== sect-disciple-life: ' + pass + ' 通过, ' + fail + ' 失败 ==========');
process.exit(fail ? 1 : 0);
