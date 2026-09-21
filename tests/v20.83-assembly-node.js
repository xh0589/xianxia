#!/usr/bin/env node
/**
 * v20.83 情缘二期门禁：声口装配引擎 + 双人对局卷三卷四 + 双人余波
 * ① 装配引擎（jealousy-assembly.js）：三十七人声口档案齐备（六段制）/ 装配对局结构 /
 *    三方账与代价选项 / 再会判定 / 余波账本 / 每日钩子（余波优先、门禁齐全、一天至多一桩）
 * ② 声口纪律抽查：檀望舒全段调子标注、伏璃茵不哭、隗九爻山楂不吃、赫渊短句、宓书言四字批、
 *    雷惊蛰「我说了」、翀玉衡零酒字、无咎禁 motif、意象不串用
 * ③ 卷三卷四八桩：门禁字段 / asNpc 双人气泡 / 三选项三方账 / 代价选项 / 声口 motif 抽查
 * ④ 接线：HTML 加载序 / 卷一每日钩子池扩至四卷 / 事件 id 全局唯一
 * 运行：node tests/v20.83-assembly-node.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');

let passed = 0, failed = 0;
function ok(cond, msg) {
    if (cond) passed++;
    else { failed++; console.log('[FAIL] ' + msg); }
}
function load(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ============ 名册基准（37 人） ============
const ROSTER = [
    ['sect_leader_百花谷', '温蘅', '百花谷'], ['sect_leader_修罗宫', '绯泪', '修罗宫'],
    ['sect_leader_天山派', '琤霄凌', '天山派'], ['sect_leader_五仙教', '蓝凤凰', '五仙教'],
    ['sect_leader_峨眉派', '夙孤鸿', '峨眉派'], ['sect_leader_唐门', '晏万解', '唐门'],
    ['sect_leader_蓬莱派', '瀛晚照', '蓬莱派'], ['sect_leader_恒山派', '祁清禅', '恒山派'],
    ['sect_leader_泰山派', '岳清晓', '泰山派'], ['sect_leader_青城派', '幽翠微', '青城派'],
    ['sect_leader_衡山派', '奚湘筠', '衡山派'], ['sect_leader_血手门', '耿雪衣', '血手门'],
    ['sect_leader_飞蝎坞', '拓银沙', '飞蝎坞'], ['sect_leader_烈日教', '伏璃茵', '烈日教'],
    ['sect_leader_天龙教', '檀望舒', '天龙教'], ['sect_leader_神机门', '戚巧机', '神机门'],
    ['sect_leader_铁掌帮', '裘霜莺', '铁掌帮'], ['sect_leader_昆仑派', '姬云锦', '昆仑派'],
    ['sect_leader_全真教', '翀玉衡', '全真教'], ['sect_leader_少林寺', '竺照禅', '少林寺'],
    ['sect_leader_华山派', '竺听雨', '华山派'], ['sect_leader_铸剑山庄', '冶砚', '铸剑山庄'],
    ['sect_leader_药王谷', '芩木', '药王谷'], ['sect_leader_茅山派', '昴既明', '茅山派'],
    ['sect_leader_武当派', '阙守拙', '武当派'], ['sect_leader_金刚宗', '赫渊', '金刚宗'],
    ['sect_leader_嵩山派', '逵佩南', '嵩山派'], ['sect_leader_逍遥派', '闻人酌', '逍遥派'],
    ['sect_leader_天涯海阁', '狄长亭', '天涯海阁'], ['sect_leader_大旗门', '樊惊筹', '大旗门'],
    ['sect_leader_阎罗殿', '聂明泽', '阎罗殿'], ['sect_leader_大隐阁', '隗九爻', '大隐阁'],
    ['sect_leader_侠隐阁', '简知忆', '侠隐阁'], ['sect_leader_天书阁', '宓书言', '天书阁'],
    ['sect_leader_霹雳堂', '雷惊蛰', '霹雳堂'], ['sect_leader_丐帮', '桑拾玖', '丐帮'],
    ['shaolin_wujiu', '无咎', '少林寺']
];
const NAME_OF = {}; const SECT_OF = {};
ROSTER.forEach(([id, n, s]) => { NAME_OF[id] = n; SECT_OF[id] = s; });

// ============ ① 装配引擎沙盒 ============
const asmSrc = load('js/npcs/jealousy-assembly.js');
let dayNow = 10;
const timeouts = [];
const store = {};
const newDayCbs = [];
const NPCS = {};
ROSTER.forEach(([id, name]) => {
    NPCS[id] = { id, name, gender: '', location: SECT_OF[id], memory: { firstMet: true }, relationship: { affection: 60 }, npcRelationships: {}, hasFlag: () => false };
});
const w = {
    currentCharData: { location: '百花谷', energy: 50 },
    inventory: { currency: { copper: 100, spiritStones: 0 } },
    updateCurrencyUI() {},
    npcManager: { getNPC: id => NPCS[id] || null },
    timeSystem: {
        gameTime: { get currentDay() { return dayNow; } },
        onNewDaySubscribe: cb => newDayCbs.push(cb)
    },
    _jealGuestInfo: id => ({ name: NAME_OF[id] || id, icon: '👤', gender: '' }),
    _jealHasFeelings: () => true,
    _jealAllRivals: (excludeId) => ROSTER.filter(r => r[0] !== excludeId).map(([id]) => ({ id, name: NAME_OF[id], sect: SECT_OF[id], affection: 60 })),
    _jealRosterAll: () => ROSTER.map(([id, name, sect]) => ({ id, name, sect })),
    _jealEnsureAcquaintance: () => null,
    _jealWriteback: () => ({ relation: 'neutral', strength: 10, text: '' })
};
const PE = {};
const sandbox = {
    window: w, console: { log() {}, warn() {}, error() {} },
    document: { querySelector: () => null },
    setTimeout: (fn, ms) => { timeouts.push({ fn, ms }); return timeouts.length; },
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } },
    NPC_PERSONAL_EVENTS: PE
};
vm.createContext(sandbox);
vm.runInContext(asmSrc, sandbox, { filename: 'jealousy-assembly.js' });

const VB = w.ASM_VOICE_BLOCKS;
ok(!!VB, '① 声口档案表已导出');
ok(Object.keys(VB).length === 37, '① 声口档案恰好 37 人（实得 ' + Object.keys(VB).length + '）');
let rosterOk = true, nameOk = true, sixOk = true;
const FIELDS = ['open_first', 'open_again', 'probe', 'concede', 'exit', 'aftermath'];
ROSTER.forEach(([id, name]) => {
    if (!VB[id]) { rosterOk = false; return; }
    if (VB[id].name !== name) nameOk = false;
    FIELDS.forEach(f => { if (typeof VB[id][f] !== 'string' || VB[id][f].length < 6) sixOk = false; });
});
ok(rosterOk, '① 37 人名册全员在档（含无咎）');
ok(nameOk, '① 档案名与名册一致');
ok(sixOk, '① 每人六段声口齐全（初见/再会/暗刺/让步/离场/余波）');
ok(!Object.keys(VB).some(k => !NAME_OF[k]), '① 档案表没有名册外的野条目');
ok(typeof w.composePairDuel === 'function' && typeof w.composePairAftermath === 'function', '① 装配出口已导出');
ok(typeof w._asmLedgerAdd === 'function' && typeof w._asmLedgerGet === 'function', '① 余波账本读写已导出');
ok(newDayCbs.length === 1, '① 每日钩子已订阅');

// 装配一场对局
const ev = w.composePairDuel('sect_leader_百花谷', 'sect_leader_药王谷');
ok(!!ev && ev.npcId === 'sect_leader_百花谷' && ev.guestId === 'sect_leader_药王谷', '① 装配对局主客归位');
ok(ev && ev.requireGuestFeelings === true && ev.minAffection === 45, '① 装配对局带双人门禁（来客有心 + 好感线）');
ok(ev && ev.scenes.length === 7 && ev.scenes[6].speaker === 'player_select', '① 装配对局七幕收在抉择');
{
    const guestBubbles = ev ? ev.scenes.filter(s => s.asNpc === 'sect_leader_药王谷').length : 0;
    ok(guestBubbles >= 2, '① 来客琥珀气泡开口 ≥2 次（实得 ' + guestBubbles + '）');
}
ok(ev && ev.scenes[6].options.length === 3, '① 三选项');
ok(ev && ev.scenes.every(s => !s.text || s.text.indexOf('undefined') < 0), '① 装配文本无 undefined 漏拼');
{
    const hostName = ev.scenes[1].text;
    ok(hostName.indexOf('脉') >= 0, '① 百花谷开场用温蘅声口（脉）');
    ok(ev.scenes[2].text.indexOf('脉枕') >= 0, '① 药王谷开场用芩木声口（脉枕）');
    ok(ev.scenes[0].text.indexOf('从未照面') >= 0, '① 初见场旁白认「从未照面」');
    ok(ev.scenes[0].text.indexOf('百花谷') >= 0 && ev.scenes[0].text.indexOf('药王谷') >= 0, '① 由头带两家门派名（公事登门，不写偶遇）');
}
// 三方账：三个选项都跑一遍
{
    const rH = ev.effects({}, 'side_host');
    const rG = ev.effects({}, 'side_guest');
    const rB = ev.effects({}, 'both');
    ok(rH.affection > 0 && rH.others[0].id === 'sect_leader_药王谷' && rH.others[0].affection < 0 && rH.pair.with === 'sect_leader_药王谷' && rH.pair.delta < 0, '① 向着主家：主人加分、来客扣分、主客关系转冷');
    ok(rG.affection < 0 && rG.others[0].affection > 0 && rG.pair.delta < 0, '① 向着来客：账目对称');
    ok(rB.affection > 0 && rB.others[0].affection > 0 && rB.pair.delta > 0, '① 两头都认：三方全入账、关系交深');
    ok(rB.msg.indexOf('铜钱') >= 0 || w.inventory.currency.copper === 50, '① 代价选项真扣铜钱（100→50）');
    ok(rH.msg.indexOf('温蘅') >= 0 && rH.msg.indexOf('芩木') >= 0, '① 结算文里两人各自用本名收尾（让步+离场）');
    const ledger = w._asmLedgerGet();
    ok(ledger.length === 3 && ledger[0].h === 'sect_leader_百花谷' && ledger[0].g === 'sect_leader_药王谷', '① 每场对局落一笔余波账');
}
// 铜钱不足 → 折精力
{
    w.inventory.currency.copper = 10;
    const before = w.currentCharData.energy;
    const ev2 = w.composePairDuel('sect_leader_百花谷', 'sect_leader_药王谷');
    const r = ev2.effects({}, 'both');
    ok(w.currentCharData.energy === Math.max(0, before - 20), '① 囊中羞涩时代价折精力二十');
    ok(r.msg.length > 50, '① 折价路线结算文完整');
    w.inventory.currency.copper = 100; w.currentCharData.energy = 50;
}
// 再会判定：账本有旧照面 → 旁白改口
{
    const ev3 = w.composePairDuel('sect_leader_百花谷', 'sect_leader_药王谷');
    ok(ev3.scenes[0].text.indexOf('照过面') >= 0, '① 账上有旧照面 → 再会旁白');
    ok(ev3.scenes[1].text.indexOf('上回') >= 0 || ev3.scenes[1].text === VB['sect_leader_百花谷'].open_again, '① 再会开场用 open_again 段');
}
// 余波装配
{
    const af = w.composePairAftermath('sect_leader_百花谷', 'sect_leader_药王谷', 10, 'both');
    ok(!!af && af.npcId === 'sect_leader_百花谷', '① 余波桩以当事一方为主人');
    ok(af.scenes[1].text === VB['sect_leader_百花谷'].aftermath, '① 余波桩用专属余波声口');
    ok(af.scenes[0].text.indexOf('芩木') >= 0 && af.scenes[0].text.indexOf('照面') >= 0, '① 余波旁白点旧照面的日子与对手名');
    const rT = af.effects({}, 'together'), rL = af.effects({}, 'light');
    ok(rT.affection === 5 && rL.affection === 1 && rT.msg.length > 10 && rL.msg.length > 10, '① 余波三选项各有好感账与收尾文');
}
// 每日钩子：余波优先
{
    // 清空账本重种一笔 5 天前的照面（今日 15）
    store['xianxia_asm_ledger'] = JSON.stringify([{ h: 'sect_leader_百花谷', g: 'sect_leader_药王谷', day: 10, choice: 'both', after: false }]);
    w._asmLedgerReload();
    dayNow = 15;
    Object.keys(PE).forEach(k => delete PE[k]);
    timeouts.length = 0;
    vm.runInContext('Math.random = function(){ return 0.05; };', sandbox);
    newDayCbs[0]();
    const afterIds = Object.keys(PE).filter(k => k.indexOf('asm_after') === 0);
    ok(afterIds.length === 1, '① 每日钩子：余波窗口内优先装配余波桩');
    ok(timeouts.length === 1 && timeouts[0].ms === 1200, '① 发射走 1200ms 延迟（与手写桩同拍）');
    ok(w._asmLedgerGet().every(e => e.after === true), '① 余波演过即销账（不重演）');
    // 弹前门禁二次校验：触发一次 timeout 回调，事件应注册且可触发（canPlayerAccess 缺桩环境 → 静默跳过）
    timeouts[0].fn();
    ok(true, '① 发射回调执行不抛错');
}
// 每日钩子：无余波 → 新开对局
{
    dayNow = 40;
    Object.keys(PE).forEach(k => delete PE[k]);
    timeouts.length = 0;
    newDayCbs[0]();
    const duelIds = Object.keys(PE).filter(k => k.indexOf('asm_duel') === 0);
    ok(duelIds.length === 1 && PE[duelIds[0]].npcId === 'sect_leader_百花谷', '① 无余波时装配新对局（主人在所在门派）');
    ok(PE[duelIds[0]].guestId === 'sect_leader_药王谷' || !!NAME_OF[PE[duelIds[0]].guestId], '① 来客从「对你有心」名册里选');
    // 十二日内照过面的这对人不再同框——冷却期内换一位来客
    store['xianxia_asm_ledger'] = JSON.stringify([{ h: 'sect_leader_百花谷', g: 'sect_leader_药王谷', day: 40, choice: 'both', after: true }]);
    w._asmLedgerReload();
    dayNow = 45;
    Object.keys(PE).forEach(k => delete PE[k]);
    newDayCbs[0]();
    const cds = Object.keys(PE).filter(k => k.indexOf('asm_duel') === 0);
    ok(cds.length === 1 && PE[cds[0]].guestId !== 'sect_leader_药王谷', '① 十二日冷却：刚照过面的一对不重开，来客换人');
}
// 玩家不在任何名册门派 → 不装配
{
    w.currentCharData.location = '帝都·长安';
    dayNow = 60;
    Object.keys(PE).forEach(k => delete PE[k]);
    newDayCbs[0]();
    ok(Object.keys(PE).length === 0, '① 玩家不在名册门派时不装配（装配场只在门中发生）');
    w.currentCharData.location = '百花谷';
}
// _asmTryCompose 手动入口
{
    Object.keys(PE).forEach(k => delete PE[k]);
    timeouts.length = 0;
    const got = w._asmTryCompose('sect_leader_少林寺');
    ok(!!got && got.npcId === 'sect_leader_少林寺' && !!PE[got.id], '① 手动装配入口：给主人当场配一位来客并注册');
    ok(got.guestId !== 'sect_leader_少林寺', '① 手动装配不把自己配给自己');
}

// ============ ② 声口纪律抽查 ============
{
    const tws = VB['sect_leader_天龙教'];
    ok(FIELDS.every(f => tws[f].indexOf('（用') >= 0), '② 檀望舒六段全带「（用XX的调子）」标注');
    ok(!/她(自己|本)的?声音/.test(FIELDS.map(f => tws[f]).join('')), '② 檀望舒不写「她自己的声音」——六段全在借调里');
    ok((tws.probe.match(/（用/g) || []).length >= 2, '② 檀望舒暗刺段中途换调（≥2 处标注）');
    ok(tws.concede.indexOf('失言') >= 0 && tws.concede.indexOf('候过渡口') >= 0, '② 檀望舒让步段沿用正典失言梗');
}
{
    const fly = VB['sect_leader_烈日教'];
    ok(FIELDS.every(f => fly[f].indexOf('哭') < 0 && fly[f].indexOf('泪') < 0), '② 伏璃茵六段零哭零泪');
    ok(fly.probe.indexOf('客字栏') >= 0 && fly.aftermath.indexOf('灯') >= 0, '② 伏璃茵只用仪轨/灯芯/客字栏语');
}
{
    const k = VB['sect_leader_大隐阁'];
    ok(k.probe.indexOf('莫尽') >= 0 && k.probe.indexOf('山楂') >= 0, '② 隗九爻卦辞认「莫尽」');
    ok(!/把山楂[^，。]*吃了|山楂[^，。]*入口/.test(FIELDS.map(f => k[f]).join('')), '② 隗九爻的山楂照旧不吃');
    ok(k.aftermath.indexOf('差点') >= 0 && k.aftermath.indexOf('没吃') >= 0, '② 余波段守住「差点吃了＝没吃」');
}
{
    const h = VB['sect_leader_金刚宗'];
    ok(FIELDS.every(f => h[f].length <= 65), '② 赫渊六段全是短句（闭口禅）');
    ok(h.open_first.length <= 25, '② 赫渊初见开口不过十余字');
}
{
    const m = VB['sect_leader_天书阁'];
    ok(m.aftermath.indexOf('两读，皆存') >= 0, '② 宓书言批语四字（破例只为你）');
    ok(m.concede.indexOf('十年校讎') >= 0 && m.concede.indexOf('存疑') >= 0, '② 宓书言让步段守「存疑不改」');
}
{
    const l = VB['sect_leader_霹雳堂'];
    const cnt = FIELDS.filter(f => l[f].indexOf('我说了。我真的说了') >= 0).length;
    ok(cnt >= 2, '② 雷惊蛰自补「……我说了。我真的说了。」≥2 段');
    ok(FIELDS.every(f => l[f].indexOf('轻') >= 0 || l[f].indexOf('我说了') >= 0 || l[f].indexOf('火药') >= 0), '② 雷惊蛰段段带轻/火药底色');
}
{
    const c = VB['sect_leader_全真教'];
    ok(FIELDS.every(f => c[f].indexOf('酒') < 0), '② 翀玉衡六段零酒字');
    ok(c.probe.indexOf('只进不出') >= 0 && c.concede.indexOf('此债记账') >= 0, '② 翀玉衡账房腔（只进不出/此债记账）');
    ok(FIELDS.every(f => c[f].indexOf('全押') < 0), '② 「全押」是翀玉衡终章题眼——装配场只呼应、不抢说');
}
{
    const wj = VB['shaolin_wujiu'];
    const banned = ['酒', '木鱼', '批注经', '念珠', '山楂', '百衲衣', '偈'];
    ok(banned.every(b => FIELDS.every(f => wj[f].indexOf(b) < 0)), '② 无咎六段禁 motif 零出现');
    ok(wj.concede.indexOf('不欺心') >= 0 && wj.concede.indexOf('佛看见') >= 0, '② 无咎让步段守第五百零一条');
    ok(wj.probe.indexOf('柴账') >= 0 || wj.probe.indexOf('火') >= 0, '② 无咎暗刺走灶理');
}
{
    // 意象不串用抽查
    ok(FIELDS.every(f => VB['sect_leader_百花谷'][f].indexOf('脉枕') < 0), '② 温蘅不碰芩木的脉枕');
    ok(FIELDS.every(f => VB['sect_leader_药王谷'][f].indexOf('药碾') < 0), '② 芩木不碰温蘅的药碾子');
    ok(FIELDS.every(f => VB['sect_leader_修罗宫'][f].indexOf('私账') < 0), '② 绯泪不碰竺听雨的私账');
    ok(FIELDS.every(f => VB['sect_leader_华山派'][f].indexOf('行踪簿') < 0), '② 竺听雨不碰绯泪的行踪簿');
    ok(FIELDS.every(f => VB['sect_leader_昆仑派'][f].indexOf('琴') < 0 && VB['sect_leader_昆仑派'][f].indexOf('笛') < 0), '② 姬云锦零乐器');
    ok(VB['sect_leader_铁掌帮'].probe.indexOf('哨语') >= 0 && VB['sect_leader_铁掌帮'].exit.indexOf('苇滩') >= 0 || VB['sect_leader_铁掌帮'].exit.indexOf('哨') >= 0, '② 裘霜莺哨语语汇');
    ok(VB['sect_leader_武当派'].concede.indexOf('不入数') >= 0, '② 阙守拙白石数目话');
    ok(VB['sect_leader_衡山派'].open_again.indexOf('拉错') >= 0, '② 奚湘筠认错式表白');
}

// ============ ③ 卷三卷四八桩 ============
const PE2 = {};
const sandbox2 = { window: { }, console: { log() {}, warn() {}, error() {} }, NPC_PERSONAL_EVENTS: PE2 };
vm.createContext(sandbox2);
vm.runInContext(load('js/npcs/duel-showcases-3.js'), sandbox2, { filename: 'duel-showcases-3.js' });
vm.runInContext(load('js/npcs/duel-showcases-4.js'), sandbox2, { filename: 'duel-showcases-4.js' });
const V3 = sandbox2.window.DUEL_SHOWCASES_3, V4 = sandbox2.window.DUEL_SHOWCASES_4;
ok(V3 && Object.keys(V3).length === 4, '③ 卷三四桩');
ok(V4 && Object.keys(V4).length === 4, '③ 卷四四桩');
ok(Object.keys(PE2).length === 8, '③ 八桩全部并入事件池');

const EXPECT = {
    'bh_event_duel_su': ['脉', '脉枕', '双营'],
    'em_event_duel_song': ['签在人在', '待勘', '第一百零八条'],
    'xiang_event_duel_ts': ['潇湘夜雨', '霜鸣', '十二年'],
    'hs_event_duel_xl': ['行踪簿', '不设结账日', '缺页'],
    'tai_event_duel_qing': ['上顶日子', '火色', '十八盘'],
    'tm_event_duel_lu': ['火候', '手套', '碑'],
    'ty_event_duel_xy': ['归期', '藏舟于壑', '封泥'],
    'shao_event_duel_wujiu': ['阿弥陀佛', '压实', '筷子']
};
Object.keys(EXPECT).forEach(eid => {
    const pool = V3[eid] ? V3 : V4;
    const ev = pool[eid];
    ok(!!ev, '③ ' + eid + ' 在卷中存在');
    if (!ev) return;
    ok(!!ev.npcId && !!ev.guestId && ev.guestId !== ev.npcId, '③ ' + eid + ' 主客归位');
    ok(ev.requireGuestFeelings === true && ev.minAffection === 45, '③ ' + eid + ' 双人门禁');
    ok(ev.autoTrigger && ev.autoTrigger.location === SECT_OF[ev.npcId], '③ ' + eid + ' 自动触发地=主人门派');
    ok(!!ev.flag && ev.scenes.length >= 7, '③ ' + eid + ' 一次性旗 + 七幕以上');
    const last = ev.scenes[ev.scenes.length - 1];
    ok(last.speaker === 'player_select' && last.options.length === 3, '③ ' + eid + ' 收在三选项');
    ok(last.options.every(o => o.text && o.effect), '③ ' + eid + ' 选项文本与账路齐全');
    const guestBubbles = ev.scenes.filter(s => s.asNpc === ev.guestId).length;
    ok(guestBubbles >= 2, '③ ' + eid + ' 来客琥珀气泡 ≥2（实得 ' + guestBubbles + '）');
    ok(ev.scenes.every(s => !s.asNpc || s.asNpc === ev.guestId), '③ ' + eid + ' asNpc 只指来客');
    // 三方账 + 代价选项
    let hasCost = false, allLedger = true;
    last.options.forEach(o => {
        const r = ev.effects({}, o.effect);
        if (typeof r.affection !== 'number' || !r.msg || !r.others || !r.others[0] || r.others[0].id !== ev.guestId || !r.pair || r.pair.with !== ev.guestId || typeof r.pair.delta !== 'number') allLedger = false;
        if (o.text.indexOf('代价') >= 0 || r.affection < 0 || r.others[0].affection < 0) hasCost = true;
        if (r.msg.indexOf('undefined') >= 0) allLedger = false;
    });
    ok(allLedger, '③ ' + eid + ' 三选项全带三方账（好感+来客+pair）');
    ok(hasCost, '③ ' + eid + ' 至少一个付出代价的选项');
    // motif 抽查
    const full = ev.scenes.map(s => s.text || '').join('') + last.options.map(o => o.text).join('') +
        last.options.map(o => ev.effects({}, o.effect).msg).join('');
    EXPECT[eid].forEach(m => ok(full.indexOf(m) >= 0, '③ ' + eid + ' 声口 motif「' + m + '」在场'));
});
// 无咎桩专检
{
    const ev = V4['shao_event_duel_wujiu'];
    ok(ev.guestId === 'shaolin_wujiu', '③ 批注与灶的来客是无咎（不入名册的那一位）');
    ok(ev.scenes.filter(s => s.asNpc === 'shaolin_wujiu').length >= 2, '③ 无咎琥珀气泡开口 ≥2');
    const full = ev.scenes.map(s => s.text || '').join('');
    ['锔钵', '柴账', '灶王爷', '佛看见'].forEach(m => ok(full.indexOf(m) >= 0 || ev.effects({}, 'cook').msg.indexOf(m) >= 0 || ev.effects({}, 'witness').msg.indexOf(m) >= 0 || ev.effects({}, 'take_chopsticks').msg.indexOf(m) >= 0, '③ 无咎桩信物「' + m + '」在场'));
    ok(full.indexOf('戒堂问话') >= 0 || ev.scenes[0].text.indexOf('三十年') >= 0, '③ 主客是预设旧识（戒堂问话三十年）');
}
// 事件 id 全局唯一（对卷一卷二）
{
    const src1 = load('js/npcs/duel-showcases-1.js'), src2 = load('js/npcs/duel-showcases-2.js');
    const old = [...src1.matchAll(/'([a-z]+_event_duel_[a-z_]+)'/g), ...src2.matchAll(/'([a-z]+_event_duel_[a-z_]+)'/g)].map(m => m[1]);
    const cur = Object.keys(V3).concat(Object.keys(V4));
    ok(cur.every(id => old.indexOf(id) < 0) && new Set(cur).size === cur.length, '③ 八桩 id 与卷一卷二不撞、彼此不撞');
}

// ============ ④ 接线 ============
{
    const html = load('仙侠.html');
    const i2 = html.indexOf('duel-showcases-2.js');
    const i3 = html.indexOf('duel-showcases-3.js');
    const i4 = html.indexOf('duel-showcases-4.js');
    const ia = html.indexOf('jealousy-assembly.js');
    ok(i2 > 0 && i3 > i2 && i4 > i3 && ia > i4, '④ HTML 加载序：卷二 → 卷三 → 卷四 → 装配引擎');
    const isoc = html.indexOf('jealousy-social.js');
    ok(isoc > 0 && isoc < i3, '④ 装配引擎在关系网引擎之后');
    const hook = load('js/npcs/duel-showcases-1.js');
    ok(hook.indexOf('DUEL_SHOWCASES_3') >= 0 && hook.indexOf('DUEL_SHOWCASES_4') >= 0, '④ 卷一每日兜底钩子的池扩到四卷');
    ok(asmSrc.indexOf('_jealAllRivals') >= 0 && asmSrc.indexOf('_jealGuestInfo') >= 0, '④ 装配引擎读关系网真源（选人/名片）');
    ok(asmSrc.indexOf('xianxia_asm_ledger') >= 0 && asmSrc.indexOf('slice(-60)') >= 0, '④ 余波账本持久化且封顶 60 笔');
}

console.log('passed=' + passed + ' failed=' + failed);
process.exit(failed > 0 ? 1 : 0);
