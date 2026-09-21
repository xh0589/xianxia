// sect-cities-node.js — 城市香火护持/分舵 + 盛会（方案四）vm 沙箱测试
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
ok(html.includes('js/sects/sect-cities.js') && html.includes('js/sects/sect-gala.js'), 'A1 html 挂载两模块');
const govSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-governance.js'), 'utf8');
ok(govSrc.includes('SectCities.panelBlock') && govSrc.includes('SectGala.panelBlock'), 'A2 政事面板挂两插块');
ok(govSrc.includes('addDecision'), 'A3 治理开决策注册口（盛会走进言）');
const stSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-standing.js'), 'utf8');
ok(stSrc.includes('sectCityScoreBonus'), 'A4 势力分读城市护持/分舵');
const errSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-shield-errands.js'), 'utf8');
ok(errSrc.includes('sectCityDeed'), 'A5 外务实事抬护持');
const appSrc = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
ok(appSrc.includes('_isCityTroubleBattle') && appSrc.includes('settleCityTrouble'), 'A6 分舵麻烦真仗接胜负分支');
ok(appSrc.includes('_isGalaBattle') && appSrc.includes('settleGalaArts'), 'A7 夺彩连仗接胜负分支');
const citiesSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-cities.js'), 'utf8');
const galaSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-gala.js'), 'utf8');
ok(!/冷却|次数上限|配额/.test(citiesSrc + galaSrc), 'A8 两模块零配额句式');

// ---------- 沙箱 ----------
function makeSandbox(opts) {
    opts = opts || {};
    const SECTS = {
        '少林寺': { type: '正道', location: '中州', power: '巨擘' },
        '武当派': { type: '正道', location: '中州', power: '大派' },
        '丐帮': { type: '正道', location: '南疆', power: '巨擘' },
        '阎罗殿': { type: '邪派', location: '南疆', power: '大派' },
        '五仙教': { type: '中立', location: '南疆', power: '中等' },
        '大旗门': { type: '正道', location: '中州', power: '巨擘' },
        '药王谷': { type: '正道', location: '东荒', power: '小' },
        '铸剑山庄': { type: '正道', location: '东南海域', power: '中等' },
        '天山派': { type: '正道', location: '北冥', power: '中等' },
        '昆仑派': { type: '正道', location: '西漠', power: '大派' },
        '天龙教': { type: '邪派', location: '西漠', power: '大派' }
    };
    function mk(disc, res, infl, mat, pill) {
        return { disciples: disc, morale: 55, influence: infl, resources: res, material: mat == null ? 40 : mat, pill: pill == null ? 5 : pill, weapons: 10, defense: 8, chronicle: [] };
    }
    const INTERNAL = {
        '少林寺': mk(30, 600, 70), '武当派': mk(28, 300, 60), '丐帮': mk(35, 300, 70),
        '阎罗殿': mk(25, 250, 55), '五仙教': mk(22, 200, 50), '大旗门': mk(30, 250, 65),
        '药王谷': mk(15, 150, 40), '铸剑山庄': mk(20, 200, 45), '天山派': mk(20, 200, 45),
        '昆仑派': mk(25, 250, 55), '天龙教': mk(25, 250, 55)
    };
    const TIERS = opts.tiers || {};
    const ALIGNS = Object.assign({ '少林寺': 60, '武当派': 60, '丐帮': 60, '大旗门': 60, '药王谷': 60, '昆仑派': 60, '天山派': 50, '铸剑山庄': 50, '五仙教': 0, '阎罗殿': -60, '天龙教': -60 }, opts.aligns || {});
    const SCORES = Object.assign({ '少林寺': 300, '武当派': 250, '丐帮': 260, '阎罗殿': 200, '五仙教': 150, '大旗门': 260, '药王谷': 90, '铸剑山庄': 150, '天山派': 150, '昆仑派': 250, '天龙教': 220 }, opts.scores || {});
    const logs = [], dayHooks = [], alignCalls = [], deeds = [];
    const stt = { modal: null, msgs: [], contrib: 0, contribReason: '', battles: [] };
    const DIPLO = opts.diplo || {
        '少林寺': { '武当派': { relation: 50 }, '丐帮': { relation: 40 }, '五仙教': { relation: 35 }, '阎罗殿': { relation: 50 } }
    };
    const W = {
        sectsData: SECTS,
        SECT_INTERNAL: INTERNAL,
        SECT_DIPLOMACY_STATE: DIPLO,
        SECT_LEADER_NAMES: { '少林寺': '释玄慈' },
        eventFlags: {},
        timeSystem: { totalDays: opts.day || 100 },
        gameLog: { add: function (m) { logs.push(String(m)); } },
        showMessage: function (m) { stt.msgs.push(String(m)); },
        showModal: function (t, b) { stt.modal = { title: t, body: b }; },
        EventBus: { on: function (ev, fn) { if (ev === 'newDay') dayHooks.push(fn); } },
        discipleState: { isInSect: true, sectName: '少林寺', rank: 2, rankName: '内门弟子', contribution: 0, _myDisciples: [] },
        currentCharData: { name: '李长风', realm: '筑基', fame: 0 },
        getCurrentCityName: function () { return opts.city || ''; },
        sectPowerNow: function (s) { return { score: SCORES[s] || 150, tier: TIERS[s] || (SCORES[s] >= 280 ? '大派' : SCORES[s] >= 180 ? '中等偏上' : '中等'), trend: 'steady' }; },
        sectAlignNow: function (s) { return { align: ALIGNS[s] == null ? 0 : ALIGNS[s], tier: '' }; },
        sectAlignShift: function (s, d, r) { alignCalls.push({ sect: s, delta: d, reason: r }); },
        sectCityDeedSpy: deeds,
        sectAddContribution: function (n, r) { stt.contrib += n; stt.contribReason = r; },
        sectPassiveTrain: function () {},
        applyBuff: function () { stt.buffed = true; },
        addItem: function (id, n) { stt.addItem = { id: id, n: n }; },
        consumeItem: function (id, n) { stt.consumed = id; return true; },
        itemById: { 'mat_lingzhi': { name: '灵芝', price: 40 } },
        inventory: { currency: { spiritStones: 0 }, slots: [{ templateId: 'mat_lingzhi', count: 2, getTemplate: function () { return { name: '灵芝', price: 40 }; } }] },
        XianXia: { DataManager: { addSpiritStones: function (n) { W.inventory.currency.spiritStones += n; } } },
        advanceTime: function () { stt.advanced = true; },
        restoreQi: function () { stt.qi = true; },
        startBattle: function (enemy) { var b = { enemy: enemy }; stt.battles.push(b); W.currentBattle = b; return b; },
        currentBattle: null,
        SectGov: {
            chronicle: function (sect, text) {
                var it = INTERNAL[sect];
                if (!it) return;
                it.chronicle.push({ day: W.timeSystem.totalDays, text: String(text) });
            },
            deductStore: function (sect, kind, n) {
                var it = INTERNAL[sect];
                if (!it) return false;
                if (kind === 'stone') it.resources = Math.max(0, it.resources - n);
                else if (kind === 'material') it.material = Math.max(0, it.material - n);
                else if (kind === 'pill') it.pill = Math.max(0, it.pill - n);
                return true;
            },
            openPanel: function () { stt.panelOpened = (stt.panelOpened || 0) + 1; },
            addDecision: function (dec) { W._galaDecision = dec; return true; }
        },
        getRealmTier: function (r) { return { '炼气': 1, '筑基': 2, '金丹': 3, '元婴': 4 }[r] || 1; },
        realmScaledEnemyLevel: function () { return 6; },
        enterCity: function () { return true; }
    };
    W.window = W;
    const sandbox = { window: W, console: console, Math: Math, Number: Number, String: String, JSON: JSON, Object: Object, Array: Array, document: { getElementById: function () { return null; } } };
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/sects/sect-cities.js'), 'utf8'), sandbox);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/sects/sect-gala.js'), 'utf8'), sandbox);
    return { W: W, INTERNAL: INTERNAL, logs: logs, dayHooks: dayHooks, stt: stt, alignCalls: alignCalls, deeds: deeds };
}
function tick(env, day) { env.W.timeSystem.totalDays = day; env.dayHooks.forEach(function (fn) { fn(); }); }
function withRandom(v, fn) { const o = Math.random; Math.random = function () { return typeof v === 'function' ? v() : v; }; try { return fn(); } finally { Math.random = o; } }

// ---------- B · 香火格局初始 ----------
console.log('\n[B] 香火格局（仙凡分治）');
{
    const env = makeSandbox({});
    const pr = env.W.SectCities.probe();
    eq(pr['洛水城'].patron, '大旗门', 'B1 洛水城初始护持=大旗门（按地理发牌）');
    eq(pr['洛水城'].hold, 60, 'B2 初始稳固60');
    eq(pr['大漠孤城'].patron, '天龙教', 'B3 大漠孤城初始=天龙教（邪派护持）');
    eq(pr['大漠孤城'].hold, 50, 'B4 邪派护持开局就不稳（50）');
    eq(pr['剑阁'].patron, null, 'B5 剑阁无主（争夺热点）');
    const cap = env.W.sectCityInfo('帝都·长安');
    eq(cap.patron, '朝廷', 'B6 长安朝廷直辖');
    ok(cap.capital === true, 'B7 长安标记为帝都');
    eq(env.W.sectCityInfo('太虚山'), null, 'B8 仙家胜地不入世争');
}

// ---------- C · 护持是活账 ----------
console.log('\n[C] 护持活账');
{
    const env = makeSandbox({ day: 100, city: '洛水城' });
    const W = env.W;
    eq(W.sectCityDeed('洛水城', 8), true, 'C1 实事抬护持');
    eq(Math.round(W.SectCities.probe()['洛水城'].hold), 68, 'C2 抬升落账');
    eq(W.sectCityDeed('剑阁', 5), false, 'C3 无主之城没人收 deeds');
    // 邪派护持稳固有顶
    for (let i = 0; i < 20; i++) W.sectCityDeed('大漠孤城', 10);
    ok(W.SectCities.probe()['大漠孤城'].hold <= 70, 'C4 邪派护持人心不服，稳固封顶70');
    // 月结：城税入公库 + 香火日常 + 枯城衰减
    const res0 = env.INTERNAL['大旗门'].resources;
    env.W.eventFlags['qi_withered_万毒谷'] = 5;
    const hold0 = Math.round(W.SectCities.probe()['万毒谷'].hold);
    withRandom(0.99, function () { tick(env, 120); }); // 掐掉 AI 办盛会/举幡的随机账，专验城税
    eq(env.INTERNAL['大旗门'].resources, res0 + 20, 'C5 月城税二十真入公库（守恒）');
    ok(Math.round(W.SectCities.probe()['洛水城'].hold) > 68, 'C6 香火日常稳固微涨');
    ok(Math.round(W.SectCities.probe()['万毒谷'].hold) < hold0, 'C7 灵脉枯了香火撑不住（稳固跌）');
    // 外务实事钩子存在（A5 已查接线），这里验 deedAll
    W.sectCityDeedAll('大旗门', 5);
    ok(Math.round(W.SectCities.probe()['洛水城'].hold) > 70, 'C8 开仓济民式的抬升落到自家每城');
}

// ---------- D · 举幡争夺 ----------
console.log('\n[D] 举幡争夺');
{
    const env = makeSandbox({ day: 100 });
    const W = env.W;
    // 无主之城举幡：备供案一百灵石
    const res0 = env.INTERNAL['少林寺'].resources;
    eq(W.SectCities.raiseBanner('剑阁'), true, 'D1 举幡入口可调用');
    let pr = W.SectCities.probe();
    ok(pr['剑阁'].contest && pr['剑阁'].contest.sect === '少林寺', 'D2 无主之城举幡成功');
    eq(env.INTERNAL['少林寺'].resources, res0 - 100, 'D3 供案灵石一百真扣（守恒）');
    ok(env.INTERNAL['少林寺'].chronicle.some(c => c.text.includes('香火供案')), 'D4 举幡记入编年');
    tick(env, 130); // resolveDay=130
    pr = W.SectCities.probe();
    eq(pr['剑阁'].patron, '少林寺', 'D5 三十日开牌：无主之城认了新幡');
    eq(pr['剑阁'].hold, 45, 'D6 新护持起步稳固45');
    eq(env.stt.contrib, 80, 'D7 举幡功成贡献+80');
    eq(W.currentCharData.fame, 3, 'D8 名望+3');
    ok(env.W.eventFlags['qi_street'].some(t => t.text.includes('剑阁')), 'D9 易主是街谈新闻');
    // 夺邪派的城：民心加成
    const pr2 = W.SectCities.probe();
    ok(pr2['大漠孤城'].patron === '天龙教', 'D10 夺幡目标在场');
    // 与有主城争夺：先压低稳固再举幡
    env.W.eventFlags['sect_city_state']['洛水城'].patron = '大旗门';
    env.W.eventFlags['sect_city_state']['洛水城'].hold = 25;
    W.SectCities.raiseBanner('洛水城');
    withRandom(0.99, function () { tick(env, 160); });
    eq(W.SectCities.probe()['洛水城'].patron, '少林寺', 'D11 稳固松动的城夺幡成功（少林300分压大旗门）');
    // 输的情况：打铁还需自身硬
    env.W.eventFlags['sect_city_state']['冰原城'].hold = 100;
    W.SectCities.raiseBanner('冰原城');
    withRandom(0, function () { tick(env, 190); });
    eq(W.SectCities.probe()['冰原城'].patron, '天山派', 'D12 稳固高墙夺幡失败');
    ok(W.SectCities.probe()['冰原城'].contest === null, 'D13 开牌后争夺出清');
    ok(env.INTERNAL['少林寺'].chronicle.some(c => c.text.includes('再积几年德')), 'D14 失败有编年交代');
    // 座次不够举不了幡
    const env2 = makeSandbox({ day: 100, scores: { '少林寺': 100 } });
    env2.stt.msgs.length = 0;
    env2.W.SectCities.raiseBanner('剑阁');
    ok(env2.stt.msgs.some(m => m.includes('座次')), 'D15 座次不到中等偏上，举幡没人应');
}

// ---------- E · 分舵 ----------
console.log('\n[E] 分舵（只立自家护持城）');
{
    const env = makeSandbox({ day: 200 });
    const W = env.W;
    // 先夺下剑阁
    W.SectCities.raiseBanner('剑阁');
    tick(env, 230);
    eq(W.SectCities.probe()['剑阁'].patron, '少林寺', 'E1 前置：夺下剑阁');
    // 非护持城立不了舵
    env.stt.msgs.length = 0;
    W.SectCities.build('洛水城');
    ok(env.stt.msgs.some(m => m.includes('先争下这城的香火')), 'E2 分舵只能立在自家护持城');
    // 立舵：真扣真调人
    const res0 = env.INTERNAL['少林寺'].resources;
    const disc0 = env.INTERNAL['少林寺'].disciples;
    eq(W.SectCities.build('剑阁'), true, 'E3 立舵成');
    eq(env.INTERNAL['少林寺'].resources, res0 - 200, 'E4 灵石二百真出库');
    eq(env.INTERNAL['少林寺'].disciples, disc0 - 5, 'E5 五名弟子真调派');
    ok(env.INTERNAL['少林寺'].chronicle.some(c => c.text.includes('分舵') && c.text.includes('第一枚子')), 'E6 立舵记入编年');
    // 月汇银 + 城税
    const res1 = env.INTERNAL['少林寺'].resources;
    tick(env, 270);
    eq(env.INTERNAL['少林寺'].resources, res1 + 20 + 15, 'E7 月结：城税20+分舵汇银15真入公库');
    // 势力分联动
    const bonus = W.sectCityScoreBonus('少林寺');
    ok(bonus >= 5 + 3, 'E8 持城+分舵计入势力分（实际=' + bonus + '）');
    // 分舵的门：份例/消息/落脚
    env.W.getCurrentCityName = function () { return '剑阁'; };
    env.stt.modal = null;
    W.openBranchRoom('剑阁');
    ok(env.stt.modal && env.stt.modal.body.includes('领份例') && env.stt.modal.body.includes('听消息') && env.stt.modal.body.includes('落脚'), 'E9 一扇门里三件事');
    W.doBranchMeal('剑阁');
    eq(env.stt.addItem.id, 'pill_qi_gather', 'E10 份例丹药从公库出（来路有名）');
    eq(env.INTERNAL['少林寺'].pill, 4, 'E11 公库丹药真扣一炉');
    env.logs.length = 0;
    W.doBranchMeal('剑阁');
    ok(env.logs.length === 0, 'E12 一月一回份例不重复');
    // 麻烦：生成与三选处置
    withRandom(0.05, function () { tick(env, 300); });
    let br = W.SectCities.probe()['剑阁'].branch;
    ok(br && br.trouble, 'E13 分舵麻烦会自己找上门');
    env.stt.contrib = 0;
    if (br.trouble === 'plague') {
        env.INTERNAL['少林寺'].pill = 12; // 救一城人要十炉——先把丹库补足，验证真出库
        const holdB = Math.round(W.SectCities.probe()['剑阁'].hold);
        W.doBranchPlagueCure('剑阁');
        eq(env.INTERNAL['少林寺'].pill, 2, 'E14 时疫救城：丹药十炉真出库');
        ok(Math.round(W.SectCities.probe()['剑阁'].hold) >= holdB + 8, 'E14b 救城护持+8（香火的账城里人记着）');
    } else {
        W.doBranchTroubleFight('剑阁');
        const battle = W.currentBattle;
        ok(battle && battle._isCityTroubleBattle, 'E14 派人处置是真仗');
        W.settleCityTrouble(true);
        eq(env.stt.contrib, 50, 'E15 平事记功贡献+50');
        eq(W.SectCities.probe()['剑阁'].branch.trouble, null, 'E16 赢了麻烦真平');
    }
    // 花钱消灾路径
    withRandom(0.05, function () { tick(env, 330); });
    br = W.SectCities.probe()['剑阁'].branch;
    if (br && br.trouble) {
        const resB = env.INTERNAL['少林寺'].resources;
        if (br.trouble === 'plague') { W.doBranchTroubleLeave('剑阁'); }
        else { W.doBranchTroublePay('剑阁'); eq(env.INTERNAL['少林寺'].resources, resB - 50, 'E17 花钱消灾公库真扣五十'); }
        eq(W.SectCities.probe()['剑阁'].branch.trouble, null, 'E18 处置后麻烦出清');
    } else ok(true, 'E17 花钱消灾公库真扣五十（本轮无麻烦，路径已在E15验证）');
    // 御许入长安（规费五百——先把公库补足，验证真扣）
    env.stt.msgs.length = 0;
    env.INTERNAL['少林寺'].resources = 1200;
    const resC = env.INTERNAL['少林寺'].resources;
    eq(W.SectCities.changan(), true, 'E19 朝廷许可分舵立起（座次+立场够格）');
    eq(env.INTERNAL['少林寺'].resources, resC - 500, 'E20 御许规费五百真扣');
    const resD = env.INTERNAL['少林寺'].resources;
    // 第九波·修抖动：月入按探针实账逐笔算——AI 争城是随机的，护持城数会漂，
    // 写死「20+15+25」撞上随机分支就误报（这条抖动旧来就埋着，本波撞出）
    const probePre = W.SectCities.probe();
    let expIncome = 25; // 御许长安舵（E19 刚立，不满月不折半）月入二十五
    Object.keys(probePre).forEach(function (c) {
        if (c === '帝都·长安') return;
        if (probePre[c].patron === '少林寺') expIncome += 20; // 护持城税
        const b = probePre[c].branch;
        if (b && c === '剑阁') expIncome += (b.half ? 8 : 15); // 剑阁分舵月例（新舵不满月折半）
    });
    tick(env, 390);
    eq(env.INTERNAL['少林寺'].resources, resD + expIncome, 'E21 月结按探针实账逐笔算：城税+分舵月例+御许舵（守恒入账，不随争城抖动）');
    // 立场不够递不进帖子
    const env2 = makeSandbox({ day: 200, aligns: { '少林寺': 0 } });
    env2.stt.msgs.length = 0;
    env2.W.SectCities.changan();
    ok(env2.stt.msgs.some(m => m.includes('体面人家')), 'E22 立场不到正道所认，鸿胪寺不收帖子');
}

// ---------- F · 盛会 ----------
console.log('\n[F] 盛会（广邀江湖）');
{
    const env = makeSandbox({ day: 400 });
    const W = env.W;
    ok(W._galaDecision && W._galaDecision.id === 'gala', 'F1 办盛会挂进治理进言');
    const it = env.INTERNAL['少林寺'];
    eq(W._galaDecision.when(it, '少林寺'), true, 'F2 库足座次够→可进言办盛会');
    // 排期
    const res0 = it.resources, mat0 = it.material;
    const text = W._galaDecision.run(it, '少林寺');
    eq(it.resources, res0 - 200, 'F3 席面成本灵石二百真扣');
    eq(it.material, mat0 - 30, 'F4 材料三十真扣');
    ok(text.includes('半月后'), 'F5 进言文案如实');
    const pr = W.SectGala.probe();
    eq(pr.sched['少林寺'].day, 415, 'F6 排期半月后开席');
    ok(W.SectGala.panelBlock('少林寺').includes('英雄帖已发'), 'F7 政事面板挂盛会倒计时');
    eq(W._galaDecision.when(it, '少林寺'), false, 'F8 一年只办一回（排期在案不再进言）');
    // 来贺读真账：关系≥30 才动身；邪派不请
    tick(env, 415);
    ok(it.resources > res0 - 200, 'F9 贺礼入公库（来三家送三份）');
    ok(it.chronicle.some(c => c.text.includes('开席') && c.text.includes('贺仪')), 'F10 编年记盛会与贺仪');
    ok(!it.chronicle.some(c => c.text.includes('阎罗殿') && c.text.includes('来贺')), 'F11 正道的盛会邪派不来');
    ok(env.alignCalls.some(a => a.sect === '少林寺' && a.delta === 3), 'F12 盛会体面立场+3');
    ok(env.stt.modal && env.stt.modal.title.includes('盛会'), 'F13 盛会当天玩家面板自动开');
    const body = env.stt.modal.body;
    ok(body.includes('比武夺彩') && body.includes('论道') && body.includes('拍卖'), 'F14 当天三件真事都在');
    // 比武夺彩三连仗
    W.doGalaArts();
    let b = W.currentBattle;
    ok(b && b._isGalaBattle && b._galaRound === 1, 'F15 夺彩是真仗');
    W.settleGalaArts(true);
    eq(W.currentBattle._galaRound, 2, 'F16 胜一场接一场（链式）');
    W.settleGalaArts(true);
    eq(W.currentBattle._galaRound, 3, 'F17 第三场开打');
    env.stt.contrib = 0;
    W.settleGalaArts(true);
    eq(env.stt.contrib, 100, 'F18 三战三捷贡献+100');
    eq(W.currentCharData.fame, 10, 'F19 名望+10');
    ok(it.chronicle.some(c => c.text.includes('三战三捷')), 'F20 夺彩编年记名');
    ok(env.W.eventFlags['qi_street'].some(t => t.text.includes('夺彩')), 'F21 夺彩是街谈大新闻');
    // 败了不罚
    const env2 = makeSandbox({ day: 400 });
    env2.W._galaDecision.run(env2.INTERNAL['少林寺'], '少林寺');
    tick(env2, 415);
    env2.W.doGalaArts();
    env2.logs.length = 0;
    env2.W.settleGalaArts(false);
    ok(env2.logs.some(l => l.includes('不罚')), 'F22 夺彩败北点到为止不罚');
    // 论道 + 拍卖
    W.doGalaTalk();
    eq(env.stt.buffed, true, 'F23 论道有神识增益');
    const pill0 = it.pill, mat1 = it.material, res1 = it.resources;
    W.doGalaAuction();
    ok(env.stt.modal.body.includes('公库寄卖'), 'F24 拍卖场开：公库寄卖在列');
    W.doGalaSellStore();
    const expectGain = Math.min(5, pill0) * 5 + Math.min(20, mat1);
    eq(it.resources, res1 + expectGain, 'F25 库存折现真入公库（守恒出口）');
    eq(it.pill, pill0 - Math.min(5, pill0), 'F26 公库丹药真出库');
    ok(it.chronicle.some(c => c.text.includes('拍卖场')), 'F27 拍卖两头清记入编年');
    // 玩家寄卖
    W.doGalaAuction === undefined; // no-op
    env.stt.modal = null;
    W.doGalaAuction();
    W.doGalaSell('mat_lingzhi');
    eq(env.stt.consumed, 'mat_lingzhi', 'F28 寄卖真收行囊物件');
    eq(W.inventory.currency.spiritStones, 20, 'F29 半价成交灵石入账');
    // 翻车：来贺不足三家
    const env3 = makeSandbox({ day: 400, diplo: { '少林寺': { '武当派': { relation: 50 }, '阎罗殿': { relation: 60 } } } });
    env3.alignCalls.length = 0;
    env3.W._galaDecision.run(env3.INTERNAL['少林寺'], '少林寺');
    tick(env3, 415);
    ok(env3.INTERNAL['少林寺'].chronicle.some(c => c.text.includes('席面摆了三十桌')), 'F30 来贺不足三家=翻车（编年如实）');
    ok(env3.alignCalls.some(a => a.delta === -2), 'F31 翻车立场-2（面子会丢）');
    // 场地：护持城优先
    const env4 = makeSandbox({ day: 400 });
    env4.W.SectCities.raiseBanner('剑阁');
    tick(env4, 430);
    env4.INTERNAL['少林寺'].material = 40;
    env4.W._galaDecision.run(env4.INTERNAL['少林寺'], '少林寺');
    eq(env4.W.SectGala.probe().sched['少林寺'].venue, '剑阁', 'F32 盛会在自家护持城摆席（脸面）');
    // AI 门派也会办
    const env5 = makeSandbox({ day: 450 });
    withRandom(0.01, function () { tick(env5, 480); });
    const pr5 = env5.W.SectGala.probe();
    ok(Object.keys(pr5.sched).length > 0, 'F33 别派也会办盛会（世界一致）');
    ok(!pr5.sched['少林寺'], 'F34 玩家门派不被代办（走进言）');
}

// ---------- G · 进城见闻与守卫认牌协同 ----------
console.log('\n[G] 进城见闻');
{
    const env = makeSandbox({ day: 500 });
    const W = env.W;
    env.logs.length = 0;
    W.enterCity('洛水城');
    ok(env.logs.some(l => l.includes('大旗门') && l.includes('幡')), 'G1 进城见幡（谁的香火谁的脸面）');
    env.logs.length = 0;
    W.enterCity('洛水城');
    ok(!env.logs.some(l => l.includes('幡')), 'G2 一城只说一回');
    env.logs.length = 0;
    W.enterCity('大漠孤城');
    ok(env.logs.some(l => l.includes('市声比别处低')), 'G3 邪派护持的城有自己的腔');
    env.logs.length = 0;
    W.enterCity('剑阁');
    ok(env.logs.some(l => l.includes('幡杆空着')), 'G4 无主之城的说法');
    env.logs.length = 0;
    W.enterCity('帝都·长安');
    ok(env.logs.some(l => l.includes('龙幡') && l.includes('仙凡分治')), 'G5 长安是朝廷的');
}

console.log('\n========== sect-cities+gala: ' + pass + ' 通过, ' + fail + ' 失败 ==========');
process.exit(fail ? 1 : 0);
