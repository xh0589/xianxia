// sect-roster-node.js — 门中名分（方案五：族谱/腰牌/执事养老线）vm 沙箱测试
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
ok(html.includes('js/sects/sect-roster.js'), 'A1 html 挂载 sect-roster.js');
const govSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-governance.js'), 'utf8');
ok(govSrc.includes('openSectRoster') && govSrc.includes('门中族谱'), 'A2 政事面板挂族谱入口');
ok(govSrc.includes('sectCanSettleDown') && govSrc.includes('花甲安顿'), 'A3 政事面板条件挂安顿入口');
const roomsSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-rooms.js'), 'utf8');
ok(roomsSrc.includes('openSectRoster'), 'A4 议事厅场景里翻族谱');
const npcSrc = fs.readFileSync(path.join(ROOT, 'js/npcs/npc-system.js'), 'utf8');
ok(npcSrc.includes('_retired: !!this._retired'), 'A5 养老状态随档序列化');
ok(npcSrc.includes('if (data._retired)'), 'A6 读档恢复养老状态');
const sysSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sects-system.js'), 'utf8');
ok(sysSrc.includes('sect_betrayed_recent'), 'A7 叛门链落另册标记');
const flSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-facility-life.js'), 'utf8');
ok(flSrc.includes('n._retired'), 'A8 切磋名单不列养老的人');
const rosterSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-roster.js'), 'utf8');
ok(!/冷却|次数上限|配额/.test(rosterSrc), 'A9 模块零配额句式');
ok(rosterSrc.includes('sect_token') && rosterSrc.includes('sect_settled'), 'A10 腰牌与安顿全落旗（随档）');

// ---------- 沙箱 ----------
function makeSandbox(opts) {
    opts = opts || {};
    const npcs = [
        { id: 'sect_disciple_少林寺_0', name: '释慧聪', age: 58, location: '少林寺', combat: { realm: '炼气' }, isDead: false },
        { id: 'sect_disciple_少林寺_1', name: '释慧明', age: 22, location: '少林寺', combat: { realm: '筑基' }, isDead: false, _masterIsPlayer: true },
        { id: 'sect_disciple_少林寺_2', name: '释慧苦', age: 64, location: '少林寺', combat: { realm: '金丹' }, isDead: false },
        { id: 'sect_disciple_少林寺_3', name: '释慧寂', age: 30, location: '少林寺', combat: { realm: '炼气' }, isDead: true },
        { id: 'sect_disciple_少林寺_4', name: '释慧空', age: 61, location: '少林寺', combat: { realm: '炼气' }, isDead: false, occupation: '弟子' }
    ];
    const INTERNAL = { '少林寺': { disciples: 30, influence: 60, resources: 120, chronicle: [] }, '武当派': { disciples: 20, influence: 50, resources: 100, chronicle: [] } };
    const logs = [];
    const dayHooks = [];
    const state = { modal: null, msgs: [], contrib: 0 };
    const W = {
        sectsData: { '少林寺': { type: '正道', power: '巨擘' }, '武当派': { type: '正道', power: '大派' } },
        SECT_INTERNAL: INTERNAL,
        SECT_LEADER_NAMES: { '少林寺': '释玄慈', '武当派': '清虚真人' },
        eventFlags: {},
        timeSystem: { totalDays: opts.day || 800 },
        gameLog: { add: function (m) { logs.push(String(m)); } },
        showMessage: function (m) { state.msgs.push(String(m)); },
        showModal: function (t, b) { state.modal = { title: t, body: b }; },
        EventBus: { on: function (ev, fn) { if (ev === 'newDay') dayHooks.push(fn); } },
        discipleState: { isInSect: true, sectName: '少林寺', rankName: '内门弟子', contribution: 100, _masterName: '释玄慈', _myDisciples: ['sect_disciple_少林寺_1'] },
        currentCharData: { name: '李长风' },
        playerLifespan: { currentAge: opts.age != null ? opts.age : 30 },
        npcManager: null,
        getSectNPCs: function (sect) { return npcs.filter(function (n) { return n.location === sect; }); },
        getRealmTier: function (r) { return { '炼气': 1, '筑基': 2, '金丹': 3, '元婴': 4 }[r] || 1; },
        sectLedgerEntries: function () { return [{ day: 790, amt: 60, reason: '护宗之战·击退来犯' }, { day: 780, amt: 40, reason: '试炼·通第一层' }]; },
        sectAddContribution: function (n, r) { state.contrib += n; state.contribReason = r; },
        sectPowerLabel: function (s) { return '巨擘 ↗ 上升'; },
        sectAlignLabel: function (s) { return '正道所认'; },
        SectGov: {
            chronicle: function (sect, text) {
                var it = INTERNAL[sect];
                if (!it) return;
                it.chronicle.push({ day: W.timeSystem.totalDays, text: String(text) });
            }
        },
        enterCity: function (city) { return true; },
        joinSect: function () { W.discipleState.isInSect = true; return true; },
        leaveSect: function () { W.discipleState.isInSect = false; return true; },
        _closeModal: function () {}
    };
    W.window = W;
    const sandbox = { window: W, console: console, Math: Math, Number: Number, String: String, JSON: JSON, Object: Object, Array: Array, document: { getElementById: function () { return null; } } };
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/sects/sect-roster.js'), 'utf8'), sandbox);
    return { W: W, npcs: npcs, INTERNAL: INTERNAL, logs: logs, dayHooks: dayHooks, state: state };
}
function nextMonth(env, day) { env.W.timeSystem.totalDays = day; env.dayHooks.forEach(function (fn) { fn(); }); }

// ---------- B · 腰牌 ----------
console.log('\n[B] 腰牌');
{
    const env = makeSandbox({});
    const W = env.W;
    // 入门即时发牌（joinSect 包装）
    W.discipleState.isInSect = false;
    delete W.eventFlags['sect_token'];
    W.joinSect('少林寺');
    let t = W.sectTokenNow();
    ok(t && t.sect === '少林寺', 'B1 入门即发腰牌');
    eq(t.rank, '内门弟子', 'B2 牌上錾着名分');
    ok(env.INTERNAL['少林寺'].chronicle.some(function (c) { return c.text.indexOf('发了腰牌') >= 0 && c.text.indexOf('李长风') >= 0; }), 'B3 发票记入编年（具名）');
    ok(env.logs.some(function (l) { return l.indexOf('腰牌') >= 0; }), 'B4 玩家看得见发票');

    // 进城认牌：一城一回
    env.logs.length = 0;
    W.enterCity('洛水城');
    ok(env.logs.some(function (l) { return l.indexOf('兵丁') >= 0; }), 'B5 进城守卫认牌');
    eq(W.eventFlags['sect_token_city_洛水城'], 800, 'B6 认牌落旗');
    env.logs.length = 0;
    W.enterCity('洛水城');
    ok(!env.logs.some(function (l) { return l.indexOf('兵丁') >= 0; }), 'B7 同一城不重复惊动');

    // 升职重新鎏字
    W.discipleState.rankName = '真传弟子';
    env.INTERNAL['少林寺'].chronicle.length = 0;
    t = W.sectTokenNow();
    eq(t.rank, '真传弟子', 'B8 升职后牌面更新');
    ok(env.INTERNAL['少林寺'].chronicle.some(function (c) { return c.text.indexOf('重新鎏了字') >= 0; }), 'B9 鎏字记入编年');

    // 退派缴回（leaveSect 包装）
    env.INTERNAL['少林寺'].chronicle.length = 0;
    W.leaveSect();
    eq(W.eventFlags['sect_token'], undefined, 'B10 退派腰牌缴回');
    ok(env.INTERNAL['少林寺'].chronicle.some(function (c) { return c.text.indexOf('缴回了执事堂') >= 0; }), 'B11 缴回记入编年');

    // 叛门另册：内部静默离门（不走包装），次日由 tokenEnsure 察觉
    W.joinSect('少林寺');
    W.eventFlags['sect_betrayed_recent'] = '少林寺';
    W.discipleState.isInSect = true;
    W.discipleState.sectName = '武当派';
    env.INTERNAL['少林寺'].chronicle.length = 0;
    t = W.sectTokenNow();
    eq(t.sect, '武当派', 'B12 改投后新门发新牌');
    ok(env.INTERNAL['少林寺'].chronicle.some(function (c) { return c.text.indexOf('另册') >= 0; }), 'B13 叛门旧牌挪另册');
    eq(W.eventFlags['sect_betrayed_recent'], undefined, 'B14 另册标记用后即清');

    // 内部静默退派：面板一开/月钩一到即察觉
    W.discipleState.isInSect = false;
    W.sectTokenNow();
    eq(W.eventFlags['sect_token'], undefined, 'B15 静默退派也被察觉缴回');
}

// ---------- C · 族谱 ----------
console.log('\n[C] 族谱');
{
    const env = makeSandbox({});
    const W = env.W;
    env.npcs[4]._retired = true; // 释慧空已养老
    W.openSectRoster('少林寺');
    const body = env.state.modal.body;
    ok(env.state.modal.title.indexOf('族谱') >= 0, 'C1 族谱面板开');
    ok(body.indexOf('释玄慈') >= 0 && body.indexOf('位分永记于此') >= 0, 'C2 掌门位分在首页（恋爱角色掌门不换）');
    ok(body.indexOf('李长风') >= 0 && body.indexOf('内门弟子') >= 0, 'C3 你的名分一页');
    ok(body.indexOf('释玄慈') >= 0 && body.indexOf('拜在') >= 0, 'C4 师承有名字');
    ok(body.indexOf('护宗之战') >= 0, 'C5 功绩读真账本');
    ok(body.indexOf('腰牌') >= 0 && body.indexOf('入册') >= 0, 'C6 腰牌信息在页');
    ok(body.indexOf('释慧聪') >= 0, 'C7 在世同门列名');
    ok(body.indexOf('你亲传') >= 0, 'C8 亲传弟子标注');
    ok(body.indexOf('释慧寂') >= 0 && body.indexOf('殁录') >= 0, 'C9 殁录有名');
    ok(body.indexOf('释慧空') >= 0 && body.indexOf('后山养老') >= 0, 'C10 养老名单独立一页');
    ok(body.indexOf('巨擘') >= 0 && body.indexOf('正道所认') >= 0, 'C11 门派座次立场在谱首');
    // 未入门翻不了谱
    W.discipleState.isInSect = false;
    env.state.modal = null; env.state.msgs.length = 0;
    W.openSectRoster();
    eq(env.state.modal, null, 'C12 未入门不开谱');
    ok(env.state.msgs.length > 0, 'C13 未入门有回话');
}

// ---------- D · 执事养老线 ----------
console.log('\n[D] 执事养老线');
{
    const env = makeSandbox({ day: 800 });
    env.npcs[0].age = 60; // 第九波：npc.age 就是真年龄（寿元系统逐年自增）——旧公式再叠全局天数是双重计数，人已按真年龄出题
    const W = env.W;
    const oldRandom = Math.random;
    Math.random = function () { return 0.1; }; // 必触发
    env.INTERNAL['少林寺'].chronicle.length = 0;
    nextMonth(env, 810);
    Math.random = oldRandom;
    // 释慧聪 60 炼气 → 退休；释慧苦 64 金丹 → 不退；释慧明 22 → 不退
    eq(env.npcs[0]._retired, true, 'D1 花甲且根骨到头 → 挂牌养老');
    eq(env.npcs[0].occupation, '养老', 'D2 养老的人不当差');
    eq(!!env.npcs[2]._retired, false, 'D3 金丹寿元悠长不退休');
    eq(!!env.npcs[1]._retired, false, 'D4 年轻人不退休');
    eq(!!env.npcs[3]._retired, false, 'D5 殁了的人不再退一遍');
    ok(env.INTERNAL['少林寺'].chronicle.some(function (c) { return c.text.indexOf('老墙') >= 0 && c.text.indexOf('释慧聪') >= 0; }), 'D6 养老记入编年（具名）');
    // 亲传弟子养老有专门戏
    const env2 = makeSandbox({ day: 43200 });
    env2.npcs[0].age = 20; env2.npcs[1].age = 60; env2.npcs[2].age = 20; env2.npcs[4].age = 20; // 只留亲传一位花甲（筑基）——年龄按真年龄出题，不再靠全局天数凑
    const oldR2 = Math.random;
    Math.random = function () { return 0.1; };
    env2.INTERNAL['少林寺'].chronicle.length = 0;
    env2.W.timeSystem.totalDays = 43230;
    env2.dayHooks.forEach(function (fn) { fn(); });
    Math.random = oldR2;
    eq(env2.npcs[1]._retired, true, 'D7 亲传弟子也会老');
    ok(env2.logs.some(function (l) { return l.indexOf('亲传') >= 0 && l.indexOf('喝茶') >= 0; }), 'D8 亲传养老有专门的戏给玩家');
    // 一月至多两桩
    const env3 = makeSandbox({ day: 43200 });
    for (let i = 0; i < env3.npcs.length; i++) { env3.npcs[i].age = 61; env3.npcs[i].combat.realm = '炼气'; }
    const oldR3 = Math.random;
    Math.random = function () { return 0.1; };
    env3.W.timeSystem.totalDays = 43230;
    env3.dayHooks.forEach(function (fn) { fn(); });
    Math.random = oldR3;
    const retiredCount = env3.npcs.filter(function (n) { return n._retired && !n.isDead; }).length;
    ok(retiredCount <= 2, 'D9 一月至多两桩养老（实际=' + retiredCount + '，不刷屏）');
}

// ---------- E · 玩家花甲安顿 ----------
console.log('\n[E] 玩家花甲安顿');
{
    const young = makeSandbox({ age: 40 });
    young.state.msgs.length = 0;
    eq(young.W.doSectSettleDown(), false, 'E1 未到花甲安顿不了');
    ok(young.state.msgs.some(function (m) { return m.indexOf('花甲') >= 0; }), 'E2 有回话');
    eq(young.W.sectCanSettleDown(), false, 'E3 安顿资格如实');

    const old = makeSandbox({ age: 62 });
    eq(old.W.sectCanSettleDown(), true, 'E4 花甲在门可安顿');
    old.state.contrib = 0;
    eq(old.W.doSectSettleDown(), true, 'E5 安顿成');
    ok(old.W.eventFlags['sect_settled'] > 0, 'E6 安顿落旗');
    eq(old.state.contrib, 50, 'E7 半生功绩真入账（贡献+50）');
    ok(old.INTERNAL['少林寺'].chronicle.some(function (c) { return c.text.indexOf('荣养执事') >= 0; }), 'E8 安顿记入编年');
    eq(old.W.doSectSettleDown(), false, 'E9 一生只安顿一回');
    old.W.openSectRoster('少林寺');
    ok(old.state.modal.body.indexOf('荣养执事') >= 0, 'E10 族谱名分页见荣养');
    ok(old.state.modal.body.indexOf('晨钟暮鼓') >= 0, 'E11 族谱尾注山中岁月');
}

console.log('\n========== sect-roster: ' + pass + ' 通过, ' + fail + ' 失败 ==========');
process.exit(fail ? 1 : 0);
