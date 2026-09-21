#!/usr/bin/env node
/**
 * v20.84 情缘三期门禁：四幕集体大戏 + 风评传闻网 + 同行嫌疑全面接入
 * 沙盒里叠三层真引擎：jealousy-social（关系网真源）→ jealousy-assembly（声口档案+装配）→
 * jealousy-collective（集体戏+风评网），全部走真代码，桩只做世界。
 * ① 风评网：只从真实账起风（帖/照面/人多/连胜/道侣）/ 同型三十日一阵 / 封顶三则 / 过期自清 /
 *    城里听风（茶馆弹窗）/ 风进山门（当事人用本行暗刺声口问到你脸上）
 * ② 四幕：灯夜撞约（推帖实据点名）/ 看台变色（擂台真事件为凭）/ 坊市撞礼（再会判定）/
 *    道侣大典（道侣为主人、风评收官结旧话、席间旧友关系落真源）——结构、声口段引用、三方多方账、代价扣款
 * ③ 钩子：灯节夜当年当节至多一幕 / 坊市十二日冷却 / 擂台七日冷却 / 大典一生一幕 / 余波送风优先
 * ④ 同行嫌疑：装配对局与集体戏都认队伍快照（带的正是来客则不成嫌疑）
 * ⑤ 接线：加载序 / anyLocation 闸口手术
 * 运行：node tests/v20.84-collective-node.js
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

// ============ 名册 ============
const HEROES = [
    ['sect_leader_百花谷', '温蘅', '百花谷'], ['sect_leader_修罗宫', '绯泪', '修罗宫'],
    ['sect_leader_天山派', '琤霄凌', '天山派'], ['sect_leader_五仙教', '蓝凤凰', '五仙教'],
    ['sect_leader_峨眉派', '夙孤鸿', '峨眉派'], ['sect_leader_唐门', '晏万解', '唐门'],
    ['sect_leader_蓬莱派', '瀛晚照', '蓬莱派'], ['sect_leader_恒山派', '祁清禅', '恒山派'],
    ['sect_leader_泰山派', '岳清晓', '泰山派'], ['sect_leader_青城派', '幽翠微', '青城派'],
    ['sect_leader_衡山派', '奚湘筠', '衡山派'], ['sect_leader_血手门', '耿雪衣', '血手门'],
    ['sect_leader_飞蝎坞', '拓银沙', '飞蝎坞'], ['sect_leader_烈日教', '伏璃茵', '烈日教'],
    ['sect_leader_天龙教', '檀望舒', '天龙教'], ['sect_leader_神机门', '戚巧机', '神机门'],
    ['sect_leader_铁掌帮', '裘霜莺', '铁掌帮'], ['sect_leader_昆仑派', '姬云锦', '昆仑派'],
    ['sect_leader_全真教', '翀玉衡', '全真教'], ['sect_leader_少林寺', '竺照禅', '少林寺']
];
const MALES = [
    ['sect_leader_华山派', '竺听雨', '华山派'], ['sect_leader_铸剑山庄', '冶砚', '铸剑山庄'],
    ['sect_leader_药王谷', '芩木', '药王谷'], ['sect_leader_茅山派', '昴既明', '茅山派'],
    ['sect_leader_武当派', '阙守拙', '武当派'], ['sect_leader_金刚宗', '赫渊', '金刚宗'],
    ['sect_leader_嵩山派', '逵佩南', '嵩山派'], ['sect_leader_逍遥派', '闻人酌', '逍遥派'],
    ['sect_leader_天涯海阁', '狄长亭', '天涯海阁'], ['sect_leader_大旗门', '樊惊筹', '大旗门'],
    ['sect_leader_阎罗殿', '聂明泽', '阎罗殿'], ['sect_leader_大隐阁', '隗九爻', '大隐阁'],
    ['sect_leader_侠隐阁', '简知忆', '侠隐阁'], ['sect_leader_天书阁', '宓书言', '天书阁'],
    ['sect_leader_霹雳堂', '雷惊蛰', '霹雳堂'], ['sect_leader_丐帮', '桑拾玖', '丐帮']
];
const NAME = {}, SECT = {};
HEROES.concat(MALES, [['shaolin_wujiu', '无咎', '少林寺']]).forEach(([i, n, s]) => { NAME[i] = n; SECT[i] = s; });

// ============ 沙盒世界 ============
function setPair(a, b, rel, strength) {
    const s = Math.max(0, Math.min(100, Math.round(strength || 0)));
    if (!a.npcRelationships) a.npcRelationships = {};
    if (!b.npcRelationships) b.npcRelationships = {};
    a.npcRelationships[b.id] = { relation: rel, strength: s };
    const inv = rel === 'master' ? 'student' : rel === 'student' ? 'master' : rel;
    b.npcRelationships[a.id] = { relation: inv, strength: s };
}
function adjustPair(a, b, delta) {
    const cur = a.npcRelationships[b.id] || { relation: 'neutral', strength: 0 };
    let rel = cur.relation, ns;
    if (rel === 'enemy' && delta > 0) {
        ns = Math.max(0, (Number(cur.strength) || 0) - delta);
        if (ns <= 20) { rel = 'neutral'; ns = Math.max(0, 20 - ns); }
    } else {
        ns = Math.max(0, Math.min(100, (Number(cur.strength) || 0) + delta));
        if (rel === 'neutral' && ns >= 40) rel = 'friend';
    }
    setPair(a, b, rel, ns);
    return { relation: rel, strength: ns };
}
let absDay = 5;
const store = {};
const modals = [];
const messages = [];
const newDayCbs = [];
const busHandlers = {};
const NPCS = {};
const AFF = { 'sect_leader_百花谷': 95, 'sect_leader_药王谷': 85, 'sect_leader_修罗宫': 75 };
HEROES.concat(MALES, [['shaolin_wujiu', '无咎', '少林寺']]).forEach(([id, name]) => {
    NPCS[id] = {
        id, name, gender: '', location: SECT[id],
        relationship: { affection: AFF[id] || 60, trust: 0 },
        memory: { firstMet: true }, npcRelationships: {}, appearance: {},
        _flags: id === 'sect_leader_百花谷' ? { dao_companion: true } : {},
        hasFlag(f) { return !!this._flags[f]; },
        setFlag(f) { this._flags[f] = true; }
    };
});
const w = {
    HEROINE_ROSTER: HEROES.map(([id, name, sect]) => ({ id, name, sect, gender: 'female' })),
    MALE_LEAD_ROSTER: MALES.map(([id, name, sect]) => ({ id, name, sect, gender: 'male' })),
    npcManager: { getNPC: id => NPCS[id] || null },
    currentCharData: {
        name: '测试侠', location: '帝都·长安', energy: 100, arenaStreak: 0, flags: {},
        bonds: {
            'sect_leader_药王谷': {
                type: 'dao_companion', name: '芩木',
                festival: { shangyuan_1: { status: 'declined', dueDay: 3, fname: '上元灯节' } }
            }
        }
    },
    inventory: { currency: { copper: 500, spiritStones: 10 } },
    updateCurrencyUI() {},
    timeSystem: {
        getAbsoluteDay: () => absDay,
        gameTime: { get currentDay() { return absDay; } },
        onNewDaySubscribe: cb => newDayCbs.push(cb),
        advanceTime() {}
    },
    EventBus: { on: (t, cb) => { busHandlers[t] = cb; } },
    FESTIVAL_DEFS: [
        { key: 'shangyuan', name: '上元灯节', doy: 1 },
        { key: 'qixi', name: '七夕', doy: 187 },
        { key: 'zhongqiu', name: '中秋', doy: 225 },
        { key: 'chuxi', name: '除夕', doy: 360 }
    ],
    showModal: (t, b) => modals.push({ t, b }),
    showMessage: (t, k) => messages.push({ t, k }),
    partySystem: null,
    detectRivalRomance: () => null
};
const PE = {};
const sandbox = {
    window: w, console: { log() {}, warn() {}, error() {} },
    document: { querySelector: () => null },
    setTimeout: (fn, ms) => 0,
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } },
    NPC_PERSONAL_EVENTS: PE,
    setNPCRelationshipPair: setPair,
    adjustNPCRelationshipPair: adjustPair
};
vm.createContext(sandbox);
vm.runInContext(load('js/npcs/jealousy-social.js'), sandbox, { filename: 'jealousy-social.js' });
vm.runInContext(load('js/npcs/jealousy-assembly.js'), sandbox, { filename: 'jealousy-assembly.js' });
vm.runInContext(load('js/npcs/jealousy-collective.js'), sandbox, { filename: 'jealousy-collective.js' });
vm.runInContext('Math.random = function(){ return 0.05; };', sandbox);

const VB = w.ASM_VOICE_BLOCKS;
const BH = 'sect_leader_百花谷', SU = 'sect_leader_药王谷', XL = 'sect_leader_修罗宫', TS = 'sect_leader_天山派';

// ============ ① 引擎与手术 ============
ok(typeof w.composeLanternNight === 'function' && typeof w.composeArenaStand === 'function' &&
   typeof w.composeMarketClash === 'function' && typeof w.composeWeddingFinale === 'function', '① 四幕装配出口齐全');
ok(typeof w._rumorTick === 'function' && typeof w._rumorActive === 'function' && typeof w._collectiveLedgerGet === 'function', '① 风评网与集体账本出口齐全');
ok(load('js/npcs/npc-personal-events.js').indexOf('!eventDef.anyLocation') >= 0, '① 事件系统 anyLocation 闸口手术在位');
ok(newDayCbs.length >= 2, '① 装配与集体戏各自订阅每日钩子');
ok(typeof busHandlers['arena:won'] === 'function', '① 擂台真事件已挂监听');

// ============ ② 风评传闻网 ============
{
    const r1 = w._rumorTick();
    ok(!!r1 && r1.type === 'snub' && r1.about[0] === SU, '② 帖子的账起风：推帖实据 → 风评点名当事人');
    ok(r1 && r1.origin && r1.text.indexOf('等一个没来的人') >= 0, '② 风评有来路、话本腔');
    const before = w._rumorActive().length;
    w._rumorTick();
    const rs = w._rumorActive();
    ok(rs.length > before && new Set(rs.map(r => r.type)).size === rs.length, '② 同型风评三十日内不重刮（再起的是别型）');
    w._rumorTick(); w._rumorTick(); w._rumorTick();
    ok(w._rumorActive().length <= 3, '② 风评封顶三则（风不能满城都是）');
    // 过期自清
    const led = w._collectiveLedgerGet();
    led.rumors[0].day = absDay - 31;
    w._rumorTick();
    ok(w._rumorActive().every(r => absDay - r.day <= 30), '② 三十日无人传，风自己停');
    ok(w._rumorActive().some(r => !r.heardPlayer), '② 有未听过的风（等着人在城里听）');
}
// 听风与送风走每日钩子（优先级：送风 > 听风 > 大戏）
{
    // 城里：听风弹窗
    const m0 = modals.length;
    newDayCbs[newDayCbs.length - 1]();
    ok(modals.length === m0 + 1 && modals[modals.length - 1].t.indexOf('茶馆风评') >= 0, '② 人在城里，茶馆听风（弹窗报到）');
    ok(w._rumorActive().some(r => r.heardPlayer), '② 听过的风记账，不重复听');
    // 进山门：风评送到当事人脸上（百花谷有温蘅，multi/dao 风评点她）
    w.currentCharData.location = '百花谷';
    Object.keys(PE).forEach(k => delete PE[k]);
    newDayCbs[newDayCbs.length - 1]();
    const deliverId = Object.keys(PE).find(k => k.indexOf('col_rumor') === 0);
    ok(!!deliverId, '② 风进山门：当事人门派里弹出问话桩');
    if (deliverId) {
        const ev = PE[deliverId];
        ok(ev.npcId === BH && ev.scenes[1].text === VB[BH].probe, '② 问话用当事人本行暗刺声口（温蘅的脉）');
        ok(ev.scenes[0].text.indexOf('带进山门') >= 0, '② 风评带来路（谁带进山门的说得明白）');
        const rA = ev.effects({}, 'admit'), rD = ev.effects({}, 'deny');
        ok(rA.affection === 4 && rA.msg.indexOf(VB[BH].concede) >= 0, '② 认账 → 让步声口收尾');
        ok(rD.affection === -3 && rD.msg.indexOf(VB[BH].exit) >= 0, '② 抵赖 → 离场声口收尾');
        ok(NPCS[BH].memory._rumorHeard && NPCS[BH].memory._rumorHeard.origin, '② 风评落进当事人记忆（来路一并落）');
        const led2 = w._collectiveLedgerGet();
        ok(led2.rumors.some(r => r.delivered[BH]), '② 送讫销账：同一阵风不刮第二回到同一人');
    }
    w.currentCharData.location = '帝都·长安';
}

// ============ ③ 四幕集体大戏 ============
{
    // 幕一：灯夜撞约
    const lan = w.composeLanternNight('上元灯节');
    ok(!!lan && lan.npcId === BH && lan.guestId === SU, '③ 灯夜撞约：好感前两位入戏（主客归位）');
    ok(lan.anyLocation === true && lan.requireGuestFeelings === true && lan._collective === 'lantern', '③ 灯夜幕不限地点、带双人门禁');
    ok(lan.scenes[0].text.indexOf('推了帖') >= 0, '③ 推帖实据在旁白点名（帖子的账为证，零编造）');
    ok(lan.scenes[1].text === VB[BH].open_again && lan.scenes[2].asNpc === SU && lan.scenes[2].text === VB[SU].open_first, '③ 声口段直引装配档案（人换了调子不换）');
    ok(lan.scenes.filter(s => s.asNpc === SU).length >= 2, '③ 第二位琥珀气泡开口 ≥2');
    const lH = lan.effects({}, 'host_walk'), lG = lan.effects({}, 'guest_walk');
    ok(lH.affection === 6 && lH.others[0].id === SU && lH.others[0].affection === -4 && lH.pair.with === SU, '③ 灯夜三方账');
    ok(lG.affection === -4 && lG.others[0].affection === 6, '③ 灯夜账目对称');
    const copper0 = w.inventory.currency.copper;
    const lA = lan.effects({}, 'lantern_all');
    ok(copper0 - w.inventory.currency.copper === 80 && lA.msg.indexOf('走马灯') >= 0, '③ 代价选项真扣八十文买走马灯');
    ok(NPCS[BH].npcRelationships[SU], '③ 集体戏一场种多对：主客初见当场落社交真源');
}
{
    // 幕二：看台变色
    const energy0 = w.currentCharData.energy;
    const st = w.composeArenaStand(3);
    ok(!!st && st._collective === 'stand' && st.anyLocation === true, '③ 看台幕装配');
    ok(st.scenes[0].text.indexOf('第3场') >= 0, '③ 擂台连胜真数据进旁白');
    ok(st.scenes[1].text === VB[BH].open_again && st.scenes[2].asNpc === SU, '③ 看台声口引装配档案');
    const stAll = st.effects({}, 'all');
    ok(energy0 - w.currentCharData.energy === 40 && stAll.others[0].affection === 3, '③ 连战三场代价：精力扣四十');
    const stE = st.effects({}, 'east');
    ok(stE.affection === 6 && stE.others[0].affection === -4, '③ 看台三方账');
    w.currentCharData.energy = 100;
}
{
    // 幕三：坊市撞礼（灯夜种过关系 → 再会判定）
    const mk = w.composeMarketClash();
    ok(!!mk && mk._collective === 'market', '③ 坊市幕装配');
    ok(mk.scenes[0].text.indexOf('照过面') >= 0, '③ 坊市认旧识（灯夜种的关系账读得到）');
    const copper1 = w.inventory.currency.copper;
    const mkAll = mk.effects({}, 'buy_all');
    ok(copper1 - w.inventory.currency.copper === 120 && mkAll.others[0].affection === 4 && mkAll.pair.delta === 8, '③ 三件并买代价一百二十文 + 三方全入账');
    const mkH = mk.effects({}, 'to_host');
    ok(mkH.affection === 6 && mkH.others[0].affection === -5, '③ 坊市账目：礼给谁，账跟谁走');
    // 铜钱不够 → 赊账进角色 flags
    w.inventory.currency.copper = 50;
    mk.effects({}, 'buy_all');
    ok(w.currentCharData.flags.marketDebt === 120 && messages.some(m => m.t.indexOf('赊账') >= 0), '③ 囊中羞涩 → 坊市赊账记账');
    w.inventory.currency.copper = 500;
}
{
    // 幕四：道侣大典
    const led = w._collectiveLedgerGet();
    led.rumors = [{ id: 'x', type: 'multi', text: 't', about: [BH], day: absDay, origin: 'o', heardPlayer: true, delivered: {} }];
    const wd = w.composeWeddingFinale();
    ok(!!wd && wd.npcId === BH && wd.guestId === SU, '③ 大典以道侣为主人、旧友入席');
    ok(wd._collective === 'wedding' && wd.anyLocation === true, '③ 大典幕不限地点');
    const guestBubbles = wd.scenes.filter(s => s.asNpc === SU || s.asNpc === XL).length;
    ok(guestBubbles >= 3, '③ 两位不请自来的旧友各有开口与贺词（气泡 ' + guestBubbles + '）');
    ok(wd.scenes.some(s => s.asNpc === SU && s.text === VB[SU].concede) && wd.scenes.some(s => s.asNpc === XL && s.text === VB[XL].concede), '③ 贺词即让步声口——心事在大典上各自结清');
    ok(wd.scenes[1].text === VB[BH].open_again, '③ 道侣开口用再会声口');
    const energy1 = w.currentCharData.energy;
    const wE = wd.effects({}, 'earth');
    ok(energy1 - w.currentCharData.energy === 50, '③ 三杯齐举洒地：醉到三更，精力扣五十');
    ok(wE.others.length === 2 && wE.others.every(o => o.affection === 4), '③ 席上旧友各自入好感账');
    ok(wE.msg.indexOf('旧话') >= 0 && w._rumorActive().length === 0, '③ 大典收官：满城风评结为旧话');
    ok(NPCS[SU].npcRelationships[XL], '③ 席间照面的旧友，关系当场落真源');
    const wS = wd.effects({}, 'spouse');
    ok(wS.affection === 8 && wS.others.every(o => o.affection === -2), '③ 先敬眼前人：道侣大加分，旧友各黯一分');
    w.currentCharData.energy = 100;
}

// ============ ④ 钩子（优先级：送风 > 听风 > 大典 > 灯节 > 坊市） ============
{
    const cb = newDayCbs[newDayCbs.length - 1];
    const led = w._collectiveLedgerGet();
    function capRumors(day) {
        led.rumors = [1, 2, 3].map(i => ({ id: 'cap' + i + '_' + day, type: 't' + i, text: 'x', about: [], day: day, origin: 'o', heardPlayer: true, delivered: {} }));
    }
    function fresh(tag) { Object.keys(PE).forEach(k => delete PE[k]); return tag; }
    function has(tag) { return Object.keys(PE).some(k => k.indexOf('col_' + tag) === 0); }

    // 1) 大典：红帖已下、旧账未清 → 一生一幕（排在灯节之前）
    absDay = 5; capRumors(5); w.currentCharData.location = '洛水城';
    fresh(); cb();
    ok(has('wedding'), '④ 红帖已下旧账未清 → 大典终局戏开锣');
    ok(w._collectiveLedgerGet().weddingDone === true, '④ 大典落账');
    fresh(); cb();
    ok(!has('wedding'), '④ 大典一生只有一场');

    // 2) 灯节夜（doy=1，第二年）：人在城里 → 灯市撞约；当年当节至多一幕
    absDay = 361; capRumors(361);
    fresh(); cb();
    ok(has('lantern'), '④ 灯节夜人在城里 → 灯市撞约开场');
    fresh(); cb();
    ok(!has('lantern'), '④ 当年当节至多一幕（账本记场次）');

    // 3) 擂台：真事件驱动 + 七日冷却
    fresh();
    busHandlers['arena:won']({ streak: 2 });
    ok(has('stand'), '④ 擂台赢了一场 → 看台变色当场装配');
    fresh();
    busHandlers['arena:won']({ streak: 3 });
    ok(!has('stand'), '④ 看台幕七日冷却');

    // 4) 坊市：人在城里 + 十二日冷却
    absDay = 380; capRumors(380);
    fresh(); cb();
    ok(has('market'), '④ 坊市撞礼开场（冷却期外）');
    fresh(); cb();
    ok(!has('market'), '④ 坊市十二日冷却');

    // 5) 人在门派里：灯市坊市都不赶（第三年上元，doy=1）
    absDay = 721; capRumors(721); w.currentCharData.location = '百花谷';
    fresh(); cb();
    ok(!has('lantern') && !has('market') && !has('wedding'), '④ 人在门派里不赶灯市坊市（戏只在城里发生）');
    w.currentCharData.location = '帝都·长安';
}

// ============ ⑤ 同行嫌疑全面接入 ============
{
    w.partySystem = { getMembers: () => [{ id: XL }] };
    // 装配对局：带的不是来客 → 旁白点嫌疑
    const ev = w.composePairDuel(BH, SU);
    ok(ev.scenes[0].text.indexOf('绯泪') >= 0 && ev.scenes[0].text.indexOf('带谁登的门') >= 0, '⑤ 装配对局认队伍快照：同行即嫌疑进旁白');
    // 带的正是来客 → 不构成第三方嫌疑
    const ev2 = w.composePairDuel(BH, XL);
    ok(ev2.scenes[0].text.indexOf('更不用说') < 0, '⑤ 带的正是来客，不另起嫌疑拍');
    // 集体戏同样接入
    const st = w.composeArenaStand(2);
    ok(st.scenes[0].text.indexOf('同行的绯泪') >= 0, '⑤ 看台幕认队伍快照');
    w.partySystem = null;
}

// ============ ⑥ 接线与纪律 ============
{
    const html = load('仙侠.html');
    const ia = html.indexOf('jealousy-assembly.js');
    const ic = html.indexOf('jealousy-collective.js');
    const isoc = html.indexOf('jealousy-social.js');
    ok(isoc > 0 && ia > isoc && ic > ia, '⑥ HTML 加载序：关系网 → 装配 → 集体戏');
    const src = load('js/npcs/jealousy-collective.js');
    ok(src.indexOf('ASM_VOICE_BLOCKS') >= 0, '⑥ 集体戏声口取装配档案（不另开腔）');
    ok(src.indexOf('_jealPartySuspects') >= 0 && src.indexOf('_jealWriteback') >= 0 && src.indexOf('_jealEnsureAcquaintance') >= 0, '⑥ 集体戏全走关系网真源');
    ok(src.indexOf('bonds') >= 0 && src.indexOf('FESTIVAL_DEFS') >= 0, '⑥ 灯节读既有节历与帖子账（零新增事实源）');
    ok(!/檀望舒[^（]*「(?!（用)/.test(src), '⑥ 集体戏不替檀望舒开本声（声口档案自带调子标注）');
}

console.log('passed=' + passed + ' failed=' + failed);
process.exit(failed > 0 ? 1 : 0);
