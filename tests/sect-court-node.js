// sect-court-node.js — 高位日常（坐堂早朝/批账/巡山讲道/身份改版）vm 沙箱测试
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
{
    const html = fs.readFileSync(path.join(ROOT, '仙侠.html'), 'utf8');
    ok(html.includes('js/sects/sect-court.js'), 'A1 页面挂载高位日常模块');
    ok(html.indexOf('sect-court.js') > html.indexOf('sect-throne.js'), 'A2 挂载在掌门位之后（案头引用巡山讲道）');
    const courtSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-court.js'), 'utf8');
    ok(!/冷却|次数上限|配额/.test(courtSrc), 'A3 模块零配额句式（一日一堂是制度话）');
    ok(!courtSrc.includes('confirm(') && !courtSrc.includes('alert('), 'A4 零浏览器原生弹窗');
    const sysSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sects-system.js'), 'utf8');
    ok(sysSrc.includes('openCourtPanel'), 'A5 门派面板挂坐堂/早朝入口');
    ok(sysSrc.includes('点到即止'), 'A6 长者差事有日子口径（一天一回，不是流水线）');
    ok(fs.readFileSync(path.join(ROOT, 'js/sects/sect-governance.js'), 'utf8').includes('督耕半日'), 'A7 长老以上灵田入口改「督耕」（身份与辈分对齐）');
    const throneSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-throne.js'), 'utf8');
    ok(throneSrc.includes('doSectPatrol') && throneSrc.includes('doSectPreach'), 'A8 掌门案头挂巡山与讲道');
}

// ---------- 沙箱 ----------
function makeSandbox(opts) {
    opts = opts || {};
    const stt = { modals: [], msgs: [], logs: [], chron: [], advanced: 0 };
    const W = {
        timeSystem: {
            gameTime: { currentDay: opts.day || 150, currentHour: opts.hour != null ? opts.hour : 9 },
            advanceTime: function (m) { stt.advanced += (m || 0); }
        },
        currentCharData: { name: '李长风', realm: '元婴', fame: 10 },
        discipleState: { isInSect: true, sectName: '少林寺', sectId: '少林寺', rank: opts.rank != null ? opts.rank : 2, rankName: '长老', contribution: 100 },
        SECT_INTERNAL: { '少林寺': { resources: 200, morale: 50, weapons: 30, defense: 5, influence: 40, grain: 20, material: 10, chronicle: [] } },
        eventFlags: {},
        SectGov: { chronicle: function (s, t) { stt.chron.push(String(t)); } },
        sectLedgerEntries: function () { return [{ reason: '采买灵材', amt: -40 }, { reason: '月俸', amt: -12 }]; },
        gameLog: { add: function (m) { stt.logs.push(String(m)); } },
        showMessage: function (m) { stt.msgs.push(String(m)); },
        showModal: function (t, b) { stt.modals.push({ title: t, body: String(b) }); },
        EventBus: {
            _h: {},
            on: function (ev, fn) { (this._h[ev] = this._h[ev] || []).push(fn); },
            emit: function (ev, p) { (this._h[ev] || []).forEach(function (f) { try { f(p); } catch (e) {} }); }
        },
        // 身份改版的包装对象：先立桩，模块加载时包上去
        doMorningClass: function () { stt.morningCalls = (stt.morningCalls || 0) + 1; return true; },
        doEveningClass: function () { return true; },
        doSectFarmWork: function () { return true; }
    };
    W.window = W;
    const sandbox = { window: W, console: { log: function () {} }, Math: Math, Number: Number, String: String, JSON: JSON, Object: Object, Array: Array, Date: Date, document: { getElementById: function () { return null; } } };
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/sects/sect-court.js'), 'utf8'), sandbox);
    function setDay(d, h) { W.timeSystem.gameTime.currentDay = d; if (h != null) W.timeSystem.gameTime.currentHour = h; }
    return { W: W, stt: stt, setDay: setDay };
}

// ---------- B · 坐堂 / 早朝 ----------
console.log('\n[B] 坐堂早朝');
{
    const env = makeSandbox({ rank: 4, hour: 9 });
    env.W.openCourtPanel();
    ok(env.stt.msgs.some(m => m.includes('熬上来')), 'B1 内门弟子坐不了堂（先把位子熬上来）');
    const e2 = makeSandbox({ rank: 2, hour: 15 });
    e2.W.openCourtPanel();
    ok(e2.stt.msgs.some(m => m.includes('堂就散了')), 'B2 过了时辰不开堂（时辰为门，制度话）');
    const env3 = makeSandbox({ rank: 2, hour: 9, day: 150 });
    const p = env3.W.sectCourtProbe();
    eq(p.cases.length, 2, 'B3 长老坐堂：一天两件案');
    ok(p.open, 'B4 辰巳时在堂');
    const e4 = makeSandbox({ rank: 0, hour: 9, day: 150 });
    eq(e4.W.sectCourtProbe().cases.length, 3, 'B5 掌门早朝：一天三件案（含掌门专属的官府案池）');
    // 断一件：真耗时辰、真落账
    env3.W.openCourtPanel();
    const body0 = env3.stt.modals[env3.stt.modals.length - 1].body;
    ok(body0.includes('_courtResolve'), 'B6 案卷带处置选项');
    const contribBefore = env3.W.discipleState.contribution;
    env3.W._courtResolve(0, 0);
    eq(env3.W.sectCourtProbe().resolved.length, 1, 'B7 断过的案记档（已结）');
    ok(env3.stt.advanced >= 30, 'B8 断案真耗时辰');
    ok(env3.stt.logs.some(l => l.includes('堂上') || l.length > 5), 'B9 断案有回话');
    // 同日重复断不生效
    env3.W._courtResolve(0, 1);
    eq(env3.W.sectCourtProbe().resolved.length, 1, 'B10 结过的案不重开');
    // 断完散堂
    env3.W._courtResolve(1, 0);
    env3.W.openCourtPanel();
    ok(env3.stt.modals[env3.stt.modals.length - 1].body.includes('散堂'), 'B11 堂上事了——散堂');
    // 定数：同日同门案卷一致；换日重开
    const p2 = env3.W.sectCourtProbe();
    const e5 = makeSandbox({ rank: 2, hour: 9, day: 150 });
    eq(e5.W.sectCourtProbe().cases.join(','), p.cases.join(','), 'B12 同日同门，案卷是定数（读档不重摇）');
    env3.setDay(151);
    eq(env3.W.sectCourtProbe().resolved.length, 0, 'B13 换了日子，堂上重新开案');
}

// ---------- C · 挂账（下月来报的许诺真兑现） ----------
console.log('\n[C] 挂账');
{
    // 找一个「旧门人求济」上案的日子
    const env = makeSandbox({ rank: 2, hour: 9 });
    let found = -1;
    for (let d = 100; d <= 200; d++) {
        env.setDay(d);
        if (env.W.sectCourtProbe().cases.indexOf('old_disc') >= 0) { found = d; break; }
    }
    ok(found > 0, 'C1 案池轮得到「旧门人求济」（第' + found + '日）');
    env.setDay(found);
    const idx = env.W.sectCourtProbe().cases.indexOf('old_disc');
    const before = env.W.SECT_INTERNAL['少林寺'].resources;
    env.W._courtResolve(idx, 0);
    const pend = env.W.eventFlags['sect_court_pend'] || [];
    eq(pend.length, 1, 'C2 济出去的银子挂了账（下月来报，不是口头戏）');
    ok(env.W.SECT_INTERNAL['少林寺'].resources === before - 30, 'C3 公库真扣三十（守恒）');
    ok(pend[0].stones === 50 || pend[0].stones === 30, 'C4 挂账有名目：成了双倍还（+50），赔了原数还（+30）');
    // 到期兑现（先把这笔账抄下来——兑现即销账）
    const pd = pend[0];
    env.setDay(pd.due);
    env.W.EventBus.emit('newDay', { newDay: pd.due });
    eq(env.W.SECT_INTERNAL['少林寺'].resources, before - 30 + pd.stones, 'C5 到期真入账（许诺兑现）');
    eq((env.W.eventFlags['sect_court_pend'] || []).length, 0, 'C6 兑现一笔销一笔');
    ok(env.stt.chron.some(t => t.includes('旧门人')), 'C7 挂账与兑现都入编年');
}

// ---------- D · 批账（副掌门实权） ----------
console.log('\n[D] 批账');
{
    const env = makeSandbox({ rank: 1, hour: 9, day: 150 });
    env.W.openCourtPanel();
    ok(env.stt.modals[env.stt.modals.length - 1].body.includes('批账'), 'D1 副掌门案头有账可批');
    ok(env.stt.modals[env.stt.modals.length - 1].body.includes('采买灵材'), 'D2 批的是真账本（读既有进出）');
    const c0 = env.W.discipleState.contribution;
    env.W._courtAudit();
    ok(env.W.eventFlags['sect_audit_month'] === Math.floor(150 / 30), 'D3 批账落旗（一月一回）');
    ok(env.W.discipleState.contribution > c0, 'D4 批账是差事不是白看（功绩真涨）');
    ok(env.stt.msgs.some(m => m.includes('亏空') || m.includes('干净')), 'D5 批出来有结果：查出亏空追回，或账目干净');
    env.stt.msgs.length = 0;
    env.W._courtAudit();
    ok(env.stt.msgs.some(m => m.includes('初一再来')), 'D6 本月批过了——回话是江湖话');
    const e2 = makeSandbox({ rank: 2, hour: 9 });
    e2.stt.msgs.length = 0;
    e2.W._courtAudit();
    ok(e2.stt.msgs.some(m => m.includes('副掌门以上')), 'D7 长老批不了账（权柄分明）');
    // 追回的钱真入库（六成概率分支——用同日重开沙箱验证一支）
    const e3 = makeSandbox({ rank: 1, hour: 9, day: 150 });
    const res0 = e3.W.SECT_INTERNAL['少林寺'].resources;
    e3.W._courtAudit();
    const gained = e3.W.SECT_INTERNAL['少林寺'].resources - res0;
    ok(gained === 20 || gained === 0, 'D8 查出亏空追回二十入库，查不出分文不动（不凭空）');
}

// ---------- E · 掌门威仪：巡山 / 讲道 ----------
console.log('\n[E] 巡山讲道');
{
    const env = makeSandbox({ rank: 0, hour: 9, day: 150 });
    eq(env.W.doSectPatrol(), true, 'E1 掌门巡山成行');
    ok(env.stt.advanced >= 60, 'E2 巡山真耗一个时辰');
    eq(env.W.doSectPatrol(), false, 'E3 一天巡一遍就够（山道上的雪，一天扫一遍）');
    ok(env.W.discipleState.contribution > 100, 'E4 巡山有功绩（三分支都有账）');
    const e2 = makeSandbox({ rank: 1, hour: 9 });
    e2.stt.msgs.length = 0;
    eq(e2.W.doSectPatrol(), false, 'E5 巡山是掌门的功课（副掌门不越位）');
    ok(e2.stt.msgs.some(m => m.includes('掌门')), 'E6 回话说明白是谁的功课');
    const e3 = makeSandbox({ rank: 0, hour: 9, day: 150 });
    const morale0 = e3.W.SECT_INTERNAL['少林寺'].morale;
    const fame0 = e3.W.currentCharData.fame;
    eq(e3.W.doSectPreach(), true, 'E7 开坛讲道成行');
    eq(e3.W.SECT_INTERNAL['少林寺'].morale, morale0 + 3, 'E8 全派士气真涨（+3）');
    eq(e3.W.currentCharData.fame, fame0 + 1, 'E9 掌门的名望真涨（+1）');
    ok(e3.stt.chron.some(t => t.includes('讲道')), 'E10 讲道入编年');
    eq(e3.W.doSectPreach(), false, 'E11 一月一会——经义要温，不要贪');
    e3.setDay(180);
    eq(e3.W.doSectPreach(), true, 'E12 下月法座再开');
}

// ---------- F · 身份改版（领众/讲经/督耕） ----------
console.log('\n[F] 身份改版');
{
    const env = makeSandbox({ rank: 2, hour: 6, day: 150 });
    const c0 = env.W.discipleState.contribution;
    env.W.doMorningClass();
    eq(env.stt.morningCalls, 1, 'F1 原早课照常跑（包装不破原账）');
    eq(env.W.discipleState.contribution, c0 + 5, 'F2 长老领众早课：功绩另记（+5）');
    ok(env.stt.chron.some(t => t.includes('领')), 'F3 编年记的是「在前头领」，不是「挨板子」');
    const e2 = makeSandbox({ rank: 4, hour: 6 });
    const c2 = e2.W.discipleState.contribution;
    e2.W.doMorningClass();
    eq(e2.W.discipleState.contribution, c2, 'F4 内门弟子还是弟子——不加领众的功绩');
    const e3 = makeSandbox({ rank: 1, hour: 9 });
    e3.W.doSectFarmWork();
    ok(e3.stt.chron.some(t => t.includes('督')), 'F5 副掌门下田是督耕（文案与辈分对齐）');
}

// ---------- G · 探针 ----------
console.log('\n[G] 探针');
{
    const env = makeSandbox({ rank: 0, hour: 9, day: 150 });
    const p = env.W.sectCourtProbe();
    ok(p && p.open && p.cases.length === 3 && Array.isArray(p.resolved)
        && p.auditDone === false && p.patrolDone === false && p.preachDone === false && p.pend === 0, 'G1 探针齐备（堂况/批账/巡山/讲道/挂账）');
    env.W.doSectPatrol();
    env.W.doSectPreach();
    env.W._courtAudit();
    const p2 = env.W.sectCourtProbe();
    ok(p2.patrolDone && p2.preachDone && p2.auditDone, 'G2 探针如实报今日功课');
}

// ---------- H · 第十三波 · 建筑与身份接线 ----------
console.log('\n[H] 建筑与身份接线');
{
    const facSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-facilities.js'), 'utf8');
    ok(facSrc.includes('sect_precept_hall') && facSrc.includes('戒律堂'), 'H1 戒律堂落成（坐堂的实体入口，长老以上）');
    ok(facSrc.includes('sect_spirit_field') && facSrc.includes('灵田'), 'H2 灵田落成（督耕/帮工的实体入口）');
    ok(facSrc.includes('浴池') && facSrc.includes('客房') && facSrc.includes('兽栏'), 'H3 浴池/客房/兽栏三座齐');
    ok(facSrc.includes('openCourt: true') && facSrc.includes('sectFarm: true'), 'H4 两个新动作类型入白名单');
    ok(facSrc.includes("case 'openCourt'") && facSrc.includes("case 'sectFarm'"), 'H5 动作分发接上（戒律堂开堂、灵田下田）');
    ok(facSrc.includes('田把头') && facSrc.includes('畜生也要歇晌'), 'H6 新建筑份例用尽走制度话');
    ok(facSrc.includes('升堂办事') && facSrc.includes('下田耕作'), 'H7 设施按钮有动作标签');
    const visitSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-visit.js'), 'utf8');
    ok(visitSrc.includes('门派身份') && visitSrc.includes('useSectSpecialty'), 'H8 八派身份技在内院有正门（此前是活内容死入口）');
    ok(visitSrc.includes('precheck') && visitSrc.includes('costText'), 'H9 身份卡只亮有代价有状态的活内容（旧增益按钮不复活）');
}

console.log('\n========== sect-court: ' + pass + ' 通过, ' + fail + ' 失败 ==========');
process.exit(fail ? 1 : 0);
