/**
 * v20.28-festival-time-node.js — 节日的帖：
 * 四节定点每年发帖、节前两天人人有帖（不再轮转不掷骰）、
 * 到期一张帖面只能陪一人、四种亏欠各归其档（-3/-4/-5/-6）、
 * v20.29 现实化：游玩不榨精力（时辰是唯一真代价）、跨年循环、双节相邻夜、名册账格零新增存档键
 *
 * 运行： node tests/v20.28-festival-time-node.js
 */
'use strict';

var path = require('path');
var fs = require('fs');

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) passed++;
    else { failed++; console.error('[FAIL] ' + msg); }
}
function loadScript(rel) { return fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8'); }

function makeNpc(id, name, opts) {
    opts = opts || {};
    return {
        id: id, name: name, gender: opts.gender || 'female',
        relationship: { affection: opts.aff != null ? opts.aff : 50, flags: new Set(), history: [] },
        memory: {}, affDelta: 0,
        setFlag: function () {}, hasFlag: function () { return false; },
        changeAffection: function (n) { this.affDelta += n; this.relationship.affection += n; }
    };
}
function daoBond(name) { return { type: 'dao_companion', name: name, day: 3, lastMetDay: 3 }; }

function makeWorld(opts) {
    opts = opts || {};
    var npcs = opts.npcs || {};
    var logs = [], modal = [], advanced = [];
    var w = {
        console: { log: function () {}, warn: function () {}, error: function () {} },
        JSON: JSON, Object: Object, Array: Array, Math: Math, Number: Number, Boolean: Boolean,
        String: String, Set: Set, parseInt: parseInt, isFinite: isFinite, Date: Date,
        currentCharData: { bonds: opts.bonds || {}, energy: opts.energy != null ? opts.energy : 100 },
        npcManager: { getNPC: function (id) { return npcs[id] || null; }, getAllNPCs: function () { return Object.keys(npcs).map(function (k) { return npcs[k]; }); } },
        gameLog: { add: function (m) { logs.push(String(m)); } },
        getAbsoluteDay: function () { return w.__day; },
        timeSystem: { getAbsoluteDay: function () { return w.__day; },
            advanceTime: function (n) { advanced.push(n); } },
        __day: opts.day != null ? opts.day : 185,
        __dateRng: opts.rng != null ? function () { return opts.rng; } : undefined,
        showModal: function (t, b) { modal.push({ title: t, body: b }); },
        EventBus: null, StateRegistry: null, NPCLineage: null
    };
    w.window = w;
    var vm = require('vm');
    var ctx = vm.createContext(w);
    vm.runInContext(loadScript('js/core/world-calendar.js'), ctx);
    vm.runInContext(loadScript('js/core/dao-bridge.js'), ctx);
    vm.runInContext(loadScript('js/core/festival-bridge.js'), ctx);
    if (opts.noModal) w.showModal = undefined;
    return { w: w, logs: logs, modal: modal, advanced: advanced };
}
function festIds(W) {
    return W.w.WorldCalendar.list({ category: 'npc_appointment' }).filter(function (e) {
        return e.source && e.source.system === 'dao_companion_festival';
    });
}
function twoDao() {
    return {
        npcs: { 'sect_leader_百花谷': makeNpc('sect_leader_百花谷', '温蘅', { aff: 60 }), 'sect_leader_金刚宗': makeNpc('sect_leader_金刚宗', '赫渊', { aff: 70, gender: 'male' }) },
        bonds: { 'sect_leader_百花谷': daoBond('温蘅'), 'sect_leader_金刚宗': daoBond('赫渊') }
    };
}

// ============ A 节前发帖：人人有帖，不轮转不掷骰 ============
var W = makeWorld(Object.assign({ day: 185, rng: 0.05 }, twoDao()));
assert(W.w.festivalTick() === true, 'A1 七夕前两日，帖按时发出');
var fe = festIds(W);
assert(fe.length === 2 && fe.every(function (e) { return e.dueAbsoluteDay === 187; }),
    'A2 两位道侣各得一帖（2 帖、同到期 187 日）——旧约会帖轮转只请得动一个人的日子，节帖不学它');
assert(fe.map(function (e) { return e.id; }).sort().join('|') === 'fest_0_qixi_sect_leader_百花谷|fest_0_qixi_sect_leader_金刚宗',
    'A3 帖上落款按人按年挂号（fest_0_qixi_*），明年此时还能再发');
assert(W.w.currentCharData.bonds['sect_leader_百花谷'].festival.qixi_0.status === 'invited' &&
    W.w.currentCharData.bonds['sect_leader_金刚宗'].festival.qixi_0.status === 'invited',
    'A4 名册账格记「帖已收到」——账写在既有的道侣条目里，零新增存档键');
assert(W.w.festivalTick() === false && festIds(W).length === 2,
    'A5 次日再tick不重复发帖（同人同节同年只有一帖）');
var W0 = makeWorld(Object.assign({ day: 180 }, twoDao()));
assert(W0.w.festivalTick() === false && festIds(W0).length === 0,
    'A6 离节还有七日，帖还没到递的时候——不会提前一月轰炸');
assert(W.w.daoDateTick() === false,
    'A7 节帖在身时，平日约会帖不叠加（日历约定栏认所有帖，不是只认自己的）');
var Wno = makeWorld({ day: 185, npcs: {}, bonds: {} });
assert(Wno.w.festivalTick() === false, 'A8 名册无人，不发空头帖');

// ============ B 到期帖面：一张帖、只陪得一个 ============
W.w.__day = 187;
var fired = W.w.WorldCalendar.consumeDue(187);
assert(fired.length === 2, 'B1 节当日两帖同时到期——时间挤不出双倍，这就是冲突的全部来源');
assert(W.modal.length === 1, 'B2 多人帖合成一张帖面，只弹一次（旧版一人一弹窗刷 N 遍的话，玩家会以为有 N 个夜晚）');
assert(W.modal[0].title.indexOf('七夕') >= 0 && W.modal[0].body.indexOf('温蘅') >= 0 &&
    W.modal[0].body.indexOf('赫渊') >= 0, 'B3 帖面点齐两个邀约人的名');
assert(W.modal[0].body.indexOf('好感+8') >= 0 && W.modal[0].body.indexOf('好感-3') >= 0 &&
    W.modal[0].body.indexOf('一夜只陪得一个') >= 0, 'B4 帖面明码：陪谁+8、推谁-3，且把「只陪得一个」写在脸上');
assert(W.modal[0].body.indexOf('谁也不陪') >= 0, 'B5 两人以上时给"这一夜谁也不陪"的退路（各-3）');

// ============ C 陪一推余 ============
assert(W.w.festivalAcceptBy('sect_leader_百花谷', 'qixi_0') === true, 'C1 陪温蘅过节，落笔即定');
assert(W.w.currentCharData.energy === 100 && W.advanced.length === 1 && W.advanced[0] === 60,
    'C2 赴节的代价是日子本身：占一整日时辰（60），比平日湖上一约（30）重；精力纹丝不动——去玩不榨精力，赶路的累让赶路自己去收（v20.29 现实化）');
assert(W.w.npcManager.getNPC('sect_leader_百花谷').affDelta === 8,
    'C3 陪到的那位好感+8——比平日一约（+5）重，这一整天是你的');
assert((W.w.npcManager.getNPC('sect_leader_百花谷').relationship.trust || 0) === 2,
    'C3b v20.33 信任涨路：节是当众之约，陪到底更真——信任+2（到场即真）');
assert((W.w.npcManager.getNPC('sect_leader_百花谷').relationship.love || 0) === 1,
    'C3c v20.36 深情涨路：当众之约陪到底是真诚里程碑——深情+1');
assert(W.w.currentCharData.bonds['sect_leader_百花谷'].festival.qixi_0.status === 'spent' &&
    W.w.currentCharData.bonds['sect_leader_百花谷'].lastMetDay === 187,
    'C4 账格记「陪过」、见面日记真日');
assert(W.w.npcManager.getNPC('sect_leader_金刚宗').affDelta === -4 &&
    W.w.currentCharData.bonds['sect_leader_金刚宗'].festival.qixi_0.status === 'declined',
    'C5 陪了这个人，另两位当场收到回信：那夜已许给别人（-4，比先推更伤，帖子你先递的）');
assert(W.logs.join('|').indexOf('「应该。」') >= 0, 'C6 被许别人者的回执只有两个字——不闹，但疼');
assert(W.logs.join('|').indexOf('鹊桥') >= 0 && W.logs.join('|').indexOf('（占一整天，好感+8，信任+2，深情+1）') >= 0,
    'C7 赴节文案是七夕专属（鹊桥两盏茶），并如实标账');
assert(W.w.festivalAcceptBy('sect_leader_金刚宗', 'qixi_0') === false &&
    W.w.npcManager.getNPC('sect_leader_金刚宗').affDelta === -4,
    'C8 回绝已落定的人再来第二场：不允、不二次扣账');
assert(W.w.festivalAcceptBy('sect_leader_百花谷', 'qixi_0') === false &&
    W.w.currentCharData.energy === 100, 'C9 同一场节不能陪两遍（陪过的人再邀也不重开，精力也未动）');

// ============ D 装死不回（最重的常规档）与不误伤 ============
var WD = makeWorld(Object.assign({ day: 185 }, twoDao()));
WD.w.festivalTick();
WD.w.WorldCalendar.consumeDue(187);
assert(WD.modal.length === 1 && WD.w.npcManager.getNPC('sect_leader_百花谷').affDelta === 0,
    'D1 帖面弹出而无人落子：到期当夜先不扣——给一晚的机会');
WD.w.__day = 188;
WD.w.festivalTick();
assert(WD.w.npcManager.getNPC('sect_leader_百花谷').affDelta === -5 &&
    WD.w.npcManager.getNPC('sect_leader_金刚宗').affDelta === -5,
    'D2 过了节还装死：每人-5——从日头等到掌灯，比好言推掉（-3）重');
assert(WD.logs.join('|').indexOf('掌灯') >= 0 && WD.logs.join('|').indexOf('连一句推辞都没有') >= 0,
    'D3 装死的账说得明：人等到掌灯，你连推辞都没给');
assert(WD.w.currentCharData.bonds['sect_leader_百花谷'].festival.qixi_0.status === 'stood', 'D4 账格记「等到散」');
var before = W.w.npcManager.getNPC('sect_leader_百花谷').affDelta;
W.w.__day = 200; W.w.festivalTick();
assert(W.w.npcManager.getNPC('sect_leader_百花谷').affDelta === before &&
    W.w.npcManager.getNPC('sect_leader_金刚宗').affDelta === -4,
    'D5 已陪过/已回绝的旧账，秋后扫账不再二次追罚（只扫悬帖）');

// ============ E 两头都应的闸（防御性背闸） ============
var heN = makeNpc('sect_leader_金刚宗', '赫渊', { aff: 70, gender: 'male' });
var WDB = makeWorld({ day: 185,
    npcs: { 'sect_leader_百花谷': makeNpc('sect_leader_百花谷', '温蘅', { aff: 60 }), 'sect_leader_金刚宗': heN },
    bonds: { 'sect_leader_百花谷': daoBond('温蘅') } });
WDB.w.festivalTick();
WDB.w.__day = 187;
assert(WDB.w.festivalAcceptBy('sect_leader_百花谷', 'qixi_0') === true, 'E0 先许了温蘅');
// 模拟竞态背闸：赫渊的帖也到了、旧帖面还摆在案上（裁决却只认一个主）
WDB.w.currentCharData.bonds['sect_leader_金刚宗'] = daoBond('赫渊');
WDB.w.currentCharData.bonds['sect_leader_金刚宗'].festival = { qixi_0: { status: 'invited', dueDay: 187, fname: '七夕' } };
assert(WDB.w.festivalAcceptBy('sect_leader_金刚宗', 'qixi_0') === false,
    'E1 这一夜的节已许了别人，第二场不许赴——两头占好日子的路从闸上就断了');
assert(heN.affDelta === -6 && WDB.w.currentCharData.energy === 100,
    'E2 两头都应=最重档：好感-6，账上再无别的动作（人根本没去成第二场）');
assert(WDB.logs.join('|').indexOf('拆开卖的') >= 0, 'E3 「原来你的节，是拆开卖的」——亏欠说在明处');

// ============ F 精力不再拦节（v20.29 现实化：游玩不榨精力） ============
var WE = makeWorld(Object.assign({ day: 185, energy: 10 }, twoDao()));
WE.w.festivalTick();
assert(WE.w.festivalAcceptBy('sect_leader_百花谷', 'qixi_0') === true,
    'F1 只剩 10 点精力也照赴节——过节是游玩不是劳作，"精力不支误了节"这种假账从规矩里删了');
assert(WE.w.npcManager.getNPC('sect_leader_百花谷').affDelta === 8 && WE.w.currentCharData.energy === 10 &&
    WE.w.currentCharData.bonds['sect_leader_百花谷'].festival.qixi_0.status === 'spent' &&
    WE.logs.join('|').indexOf('精力不支') < 0,
    'F2 赴成：+8、账格 spent、精力分文不动，也再不编"精力不支"的失约借口');

// ============ G 无弹窗环境兜底：不留悬账 ============
var WG = makeWorld(Object.assign({ day: 185, noModal: true }, twoDao()));
WG.w.festivalTick();
WG.w.__day = 187;
WG.w.WorldCalendar.consumeDue(187);
assert(WG.w.npcManager.getNPC('sect_leader_金刚宗').affDelta === 8 && WG.w.currentCharData.energy === 100,
    'G1 自动化环境无人做主：夜只有一夜，就陪情面最重的一位（赫渊 70 > 温蘅 60）');
assert(WG.w.npcManager.getNPC('sect_leader_百花谷').affDelta === -4 && WG.w.currentCharData.energy === 100,
    'G2 第二位两帖连爆也只回绝一次——不重复裁决、不多做任何动作');

// ============ H 文案与历法 ============
var WH = makeWorld({ day: 185, npcs: { 'sect_leader_金刚宗': makeNpc('sect_leader_金刚宗', '赫渊', { aff: 60, gender: 'male' }) }, bonds: { 'sect_leader_金刚宗': daoBond('赫渊') } });
WH.w.festivalTick();
WH.w.festivalDeclineBy('sect_leader_金刚宗', 'qixi_0');
assert(WH.logs.join('|').indexOf('把两盏茶都喝了') >= 0 && WH.logs.join('|').indexOf('他说') >= 0 &&
    WH.logs.join('|').indexOf('她说') < 0, 'H1 男主道侣的孤单文案写"他"——人称随人走');
var DEFS = WG.w.FESTIVAL_DEFS;
assert(DEFS.length === 4 && DEFS.map(function (d) { return d.doy; }).join(',') === '1,187,225,360',
    'H2 四节定点：上元初一/七夕七月初七/中秋八月十五/除夕腊月三十（世界历每 30 日一月）');
assert(DEFS.map(function (d) { return d.name; }).join('、') === '上元灯节、七夕、中秋、除夕', 'H3 四节名目在案');
var fsrc = loadScript('js/core/festival-bridge.js');
assert(fsrc.indexOf('上元灯节') >= 0 && fsrc.indexOf('走马灯') >= 0 && fsrc.indexOf('两副碗筷') >= 0,
    'H4 四节文案各是各的节（灯/茶/饼/岁），不是一套壳换四个名');

// ============ I 跨年循环与双节相邻夜 ============
var WI = makeWorld({ day: 185, npcs: { 'sect_leader_百花谷': makeNpc('sect_leader_百花谷', '温蘅', { aff: 60 }) }, bonds: { 'sect_leader_百花谷': daoBond('温蘅') } });
WI.w.festivalTick(); WI.w.__day = 187; WI.w.festivalAcceptBy('sect_leader_百花谷', 'qixi_0');
WI.w.__day = 545; // 第二年七夕（547）前两日
WI.w.festivalTick();
assert(WI.w.currentCharData.bonds['sect_leader_百花谷'].festival.qixi_1 &&
    WI.w.currentCharData.bonds['sect_leader_百花谷'].festival.qixi_1.status === 'invited' &&
    festIds(WI).some(function (e) { return e.dueAbsoluteDay === 547; }),
    'I1 明年七夕帖照发（账按「节_年」分格，旧账不挡新帖）——节是年年都来的');
assert(WI.w.currentCharData.bonds['sect_leader_百花谷'].festival.qixi_0.status === 'spent',
    'I2 旧年账目原样留底：陪过就是陪过');
var W2F = makeWorld(Object.assign({ day: 359 }, twoDao()));
W2F.w.festivalTick();
assert(festIds(W2F).length === 4, 'I3 除夕（360）与来年上元（361）帖同窗发出——相邻两夜是两个夜，各赴各的');
W2F.w.__day = 360; W2F.w.WorldCalendar.consumeDue(360);
assert(W2F.modal.length === 1 && W2F.modal[0].title.indexOf('除夕') >= 0, 'I4 除夕帖面先弹');
W2F.w.__day = 361; W2F.w.WorldCalendar.consumeDue(361);
assert(W2F.modal.length === 2 && W2F.modal[1].title.indexOf('上元') >= 0, 'I5 上元帖面隔天再弹，互不吞并');
W2F.w.festivalAcceptBy('sect_leader_百花谷', 'chuxi_0');
W2F.w.festivalAcceptBy('sect_leader_金刚宗', 'shangyuan_1');
assert(W2F.w.npcManager.getNPC('sect_leader_百花谷').affDelta === 4 &&
    W2F.w.npcManager.getNPC('sect_leader_金刚宗').affDelta === 4 &&
    W2F.w.currentCharData.energy === 100,
    'I6 两夜各陪一人：各自 +8、各占一夜，另一位的-4 也照记——夜够了就不是罪过，但每一夜都有账（精力全程未动）');

// ============ J 纪律与旧桥未伤 ============
assert(fsrc.indexOf('localStorage') < 0 && fsrc.indexOf('.stones') < 0, 'J1 节日零旁路：不碰灵石、不开新存档键');
var html = loadScript('仙侠.html');
assert(html.indexOf('festival-bridge.js') > html.indexOf('dao-bridge.js') &&
    html.indexOf('festival-bridge.js') < html.indexOf('sect-year-goal'),
    'J2 节日桥在日历桥之后加载（顺序有依赖）');
assert(typeof WG.w.festivalTick === 'function' && typeof WG.w.festivalAcceptBy === 'function' &&
    typeof WG.w.festivalDeclineAllBy === 'function', 'J3 三组入口导出齐备（弹窗按钮找得到人）');
var WJ = makeWorld(Object.assign({ day: 10, rng: 0.05 }, twoDao()));
assert(WJ.w.daoDateTick() === true, 'J4 平日约会帖照常（节帖不挡平帖，v20.25 轮转旧账未伤）');
var pe = WJ.w.WorldCalendar.getNextByCategory('npc_appointment');
assert(pe && pe.payload.npcId === 'sect_leader_百花谷' && pe.dueAbsoluteDay === 12,
    'J5 平日帖仍按日轮转发、两日后到期——旧约制原样');
assert(WJ.w.daoDateAccept({ npcId: 'sect_leader_百花谷' }) === true &&
    WJ.w.npcManager.getNPC('sect_leader_百花谷').affDelta === 5 && WJ.w.currentCharData.energy === 100,
    'J6 平日赴约 +5、耗半日时辰、精力分文不动——两条桥同一规矩（v20.29），节是加法不是替换');

console.log('v20.28 festival-time: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
