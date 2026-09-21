/**
 * wave95-npc-mail-fixes-node.js — 第九十五波 · NPC/社交/邮件簇缺陷修复验收
 *
 * 验收点（编号=外包测试报告编号）：
 *   NEW-39（高）：npcLastMeetGameMinute 对 null/undefined/0 一律判「从未谋面」返回 null；
 *                 关系衰减对从未谋面者跳过；读档迁移把被 Number(null)===0 写脏的好感归零
 *                 （道侣除外、真见过的仇人除外、幂等可重入）
 *   NEW-19（高）：深谈执行期拆掉弹窗后 writeReply 回落到原始提示函数，不再自递归爆栈
 *   NEW-17（低）：心情/压力读数取整，不再打出「心情 46.362351…」
 *   NEW-18（低）：好感门槛角标不再出现双负号「⚠--3」
 *   NEW-46（中）：主动行为收口为一处（npc-life-system 真邮件版），npc-system 不再重复掷骰/重复调它
 *   NEW-40（中）：邮件洪水四闸——同一 NPC 敌意信 30 游戏日冷却；收件箱封顶 200 丢最旧；
 *                 紧急件 90 天也过期；主题按事件类型出题（敌意信不再叫「问候」）
 *   NEW-41（中）：收件箱时间文案与当前游戏分钟作差（1 时辰=120 分钟），死变量删除
 *   NEW-43（高）：NPC 有家——homeLocation 落锚随档；游走目的地池只收世界地点（无设施格）；
 *                 夜里/五成概率回家；summary 出发地不被新值覆盖；读端按 home/id 判归属；
 *                 旧档迁移把漂进设施格的人送回家
 *   NEW-14（低）：NPC 注册不再写 gameLog 刷屏
 *
 * 运行：node tests/wave95-npc-mail-fixes-node.js
 */
'use strict';

var fs = require('fs');
var vm = require('vm');
var path = require('path');
var ROOT = path.resolve(__dirname, '..');

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; console.log('  ✓ ' + msg); }
    else { failed++; console.error('  ✗ ' + msg); }
}
function eq(a, b, msg) { assert(a === b, msg + '（实际=' + JSON.stringify(a) + ' 期望=' + JSON.stringify(b) + '）'); }
function load(rel) {
    vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel });
}
function src(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ==================== 测试桩 ====================
global.window = global;
var els = {};
function fakeEl(tag) {
    var el = {
        tag: tag || '', children: [], style: {}, parentNode: null, dataset: {},
        setAttribute: function () {}, getAttribute: function () { return null; },
        appendChild: function (c) { this.children.push(c); return c; },
        removeChild: function () {}, remove: function () {},
        addEventListener: function () {}, removeEventListener: function () {},
        closest: function () { return null; }, scrollIntoView: function () {},
        getBoundingClientRect: function () { return { left: 0, top: 0, width: 0, height: 0 }; },
        querySelector: function () { return null; }, querySelectorAll: function () { return []; },
        classList: { add: function () {}, remove: function () {}, toggle: function () {}, contains: function () { return false; } },
        _html: '', textContent: '', options: []
    };
    Object.defineProperty(el, 'innerHTML', {
        get: function () { return this._html; },
        set: function (v) { this._html = String(v); },
        configurable: true
    });
    return el;
}
global.document = {
    readyState: 'complete',
    createElement: function (tag) { return fakeEl(tag); },
    createElementNS: function (ns, tag) { return fakeEl(tag); },
    getElementById: function (id) { if (!els[id]) els[id] = fakeEl(); return els[id]; },
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    addEventListener: function () {},
    body: { appendChild: function () {} }
};
var store = {};
global.localStorage = {
    getItem: function (k) { return store[k] !== undefined ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; }
};
var msgs = [];
global.showMessage = function (m, t) { msgs.push({ m: String(m), t: t }); };
global.gameLog = { entries: [], add: function (m, t) { this.entries.push({ m: String(m), t: t }); } };
global.timeSystem = {
    gameTime: { totalMinutes: 57140, currentDay: 40, currentHour: 12, currentMinute: 0 },
    getAbsoluteDay: function () { return this.gameTime.currentDay; },
    advanceTime: function () {},
    onNewDaySubscribe: function () {}
};
global.currentCharData = { name: '玩家', location: '金城', realm: '金丹', layer: 1 };
global.discipleState = null;
global.itemById = {};
global.setTimeout = function () { return 0; };
global.setInterval = function () { return 0; };
global.clearInterval = function () {};
global.clearTimeout = function () {};
// 世界地点真源桩：两座城 + 两个门派（旅馆/军营等设施格不在册）
global.locationSystem = { cityData: { '金城': {}, '洛水城': {} } };
global.sectsData = { '少林寺': {}, '华山派': {} };
var FACILITY_TILES = ['旅馆', '军营', '后山', '山洞', '田地', '菜园', '讲堂', '家中'];

var origRnd = Math.random;
function stubRnd(v) { Math.random = function () { return v; }; }
function seqRnd(arr) {
    Math.random = (function () { var s = arr.slice(); return function () { return s.length > 1 ? s.shift() : s[0]; }; })();
}
function restoreRnd() { Math.random = origRnd; }

// ==================== 加载被测模块 ====================
load('js/npcs/npc-system.js');
load('js/npcs/npc-emotions.js');
load('js/core/event-bus.js');
load('js/core/state-registry.js');
load('js/npcs/npc-life-actor.js');
load('js/mail-system.js');
load('js/mail-system-ui.js');

var NPC = global.NPC;
var NPCManager = global.NPCManager;
var npcManager = new NPCManager();
global.npcManager = npcManager;

// ==================================================================
// NEW-39：从未谋面判定 + 衰减跳过 + 读档迁移
// ==================================================================
console.log('--- NEW-39 从未谋面不再被当成第0分钟见过 ---');
(function () {
    var n = new NPC('t39_1', '试甲', { location: '金城' });
    n.memory.lastMeetGameMinute = null;
    eq(global.npcLastMeetGameMinute(n), null, 'lastMeetGameMinute=null → 从未谋面（null）');
    n.memory.lastMeetGameMinute = undefined;
    eq(global.npcLastMeetGameMinute(n), null, 'lastMeetGameMinute=undefined → 从未谋面（null）');
    n.memory.lastMeetGameMinute = 0;
    eq(global.npcLastMeetGameMinute(n), null, 'lastMeetGameMinute=0 也按从未谋面处理（脏默认值不放行）');
    eq(global.npcLastMeetGameMinute(null), null, '空入参不炸');
    n.memory.lastMeetGameMinute = 4321;
    eq(global.npcLastMeetGameMinute(n), 4321, '真见过（>0）原样返回');
    // 旧档兼容分支：只有现实时间戳的老档从加载时刻重新起算
    var old = new NPC('t39_2', '试乙', { location: '金城' });
    old.memory.firstMet = true;
    old.memory.lastMeetTime = 1234567;
    eq(global.npcLastMeetGameMinute(old), 57140, '旧档（firstMet=true、无游戏分钟）从当前时刻重新起算');
    // getHoursSinceLastMeet 对从未谋面者返回 -1（不再吐出整个游戏史）
    var fresh = new NPC('t39_3', '试丙', { location: '金城' });
    eq(fresh.getHoursSinceLastMeet(), -1, '从未谋面者 getHoursSinceLastMeet()=-1（不再是 952 小时）');

    // 衰减跳过：updateNPCAI 推进 10 小时，从未谋面者好感分毫不动
    var victim = new NPC('t39_4', '受害档', { location: '金城' });
    victim.relationship.affection = -87.5;   // 被旧 bug 写脏的存档形态
    victim.memory.firstMet = false; victim.memory.meetCount = 0; victim.memory.lastMeetGameMinute = null;
    npcManager.updateNPCAI(victim, 7, 10);
    eq(victim.relationship.affection, -87.5, '衰减路径对从未谋面者跳过（好感不再每 tick 掉 0.1×小时）');
    // 真见过的仍照常衰减
    var met = new NPC('t39_5', '旧识', { location: '金城' });
    met.relationship.affection = 0;
    met.memory.firstMet = true; met.memory.meetCount = 3;
    met.memory.lastMeetGameMinute = 57140 - 10 * 1440;   // 十天前见过
    npcManager.updateNPCAI(met, 7, 10);
    assert(met.relationship.affection < 0, '真见过且久别者仍自然衰减（护栏只护从未谋面者）');

    // 读档迁移：被写脏的档归零 + 道侣除外 + 真仇人除外 + 幂等
    var dirty = new NPC('cres_金城_1', '钱万贯', { location: '金城' });
    dirty.relationship.affection = -87.5;
    dirty.memory.firstMet = false; dirty.memory.meetCount = 0;
    var s = dirty.serialize();
    s.location = '军营';                 // 模拟被旧游走冲散的存档
    delete s.homeLocation;               // 模拟没有家锚点的旧档
    var r = NPC.deserialize(JSON.parse(JSON.stringify(s)));
    eq(r.relationship.affection, 0, '迁移：从未谋面且好感<-30 → 归零（一城仇人回正）');
    eq(r.homeLocation, '金城', '迁移：cres_* 按 id 推导出家锚点');
    eq(r.location, '金城', '迁移：漂进军营（设施格）者送回家');
    // 幂等：再存再读不复发
    var r2 = NPC.deserialize(JSON.parse(JSON.stringify(r.serialize())));
    eq(r2.relationship.affection, 0, '迁移幂等：重读仍是 0');
    eq(r2.location, '金城', '迁移幂等：位置不反弹');
    // 道侣除外
    var dao = new NPC('cres_洛水城_2', '结契人', { location: '洛水城' });
    dao.relationship.affection = -50;
    dao.setFlag('dao_companion');
    dao.memory.firstMet = false; dao.memory.meetCount = 0;
    var rd = NPC.deserialize(JSON.parse(JSON.stringify(dao.serialize())));
    eq(rd.relationship.affection, -50, '迁移：道侣之盟不随未见磨蚀（好感不归零）');
    // 真见过的仇人除外
    var foe = new NPC('t39_6', '真仇人', { location: '金城' });
    foe.relationship.affection = -80;
    foe.memory.firstMet = true; foe.memory.meetCount = 5; foe.memory.lastMeetGameMinute = 50000;
    var rf = NPC.deserialize(JSON.parse(JSON.stringify(foe.serialize())));
    eq(rf.relationship.affection, -80, '迁移：真见过的仇人不归零（只清洗 bug 脏账）');
    // 合法串门不遣返：人在别的世界地点（门派/城市）不动
    var visitor = new NPC('cres_金城_2', '串门者', { location: '金城' });
    var sv = visitor.serialize(); sv.location = '少林寺';
    var rv = NPC.deserialize(JSON.parse(JSON.stringify(sv)));
    eq(rv.location, '少林寺', '迁移：串门到世界地点（门派/城市）者不遣返');
    // 就地绕行改回公共函数
    var pe = src('js/npcs/npc-personal-events.js');
    assert(pe.indexOf('window.npcLastMeetGameMinute(npc)') >= 0 && pe.indexOf('lastMeetRaw') < 0,
        'npc-personal-events 的就地绕行已改回调公共读取函数（口径统一）');
})();

// ==================================================================
// NEW-19：writeReply 回落不再自递归爆栈
// ==================================================================
console.log('--- NEW-19 深谈拆窗后回话不爆栈 ---');
(function () {
    var origCalls = [];
    var modalOpen = true;
    var containerEl = fakeEl('div');
    var modalEl = fakeEl('div');
    modalEl.querySelector = function () { return containerEl; };
    document.querySelector = function (sel) {
        return (sel === '.npc-dialog-modal' && modalOpen) ? modalEl : null;
    };
    global.showMessage = function (m, t) { origCalls.push({ m: String(m), t: t }); };
    // 仿真 DEEP_TALK_REAL_HANDLERS：先拆弹窗，再出结算话（旧版正是在这里掉进无限递归）
    global.executeDeepTalkSubOption = function () {
        modalOpen = false;                       // closeNpcModal()
        global.showMessage('请求已妥帖办结', 'info');
    };
    load('js/npcs/social-content.js');           // wrapExecute 在装载时包上面这个函数

    var threw = null;
    try {
        global.executeDeepTalkSubOption('t19', 'requests', 'request_heal');
    } catch (e) { threw = e; }
    assert(threw === null, '拆窗后回话不抛 RangeError（旧版 writeReply↔showMessage 互调爆栈）');
    eq(origCalls.length, 1, '回落打到原始提示函数恰好一次（无递归重放）');
    eq(origCalls[0] && origCalls[0].m, '请求已妥帖办结', '结算话原文送达');
    assert(typeof global.showMessage === 'function' && !global.showMessage.__writeReplyProxy,
        '执行结束后 window.showMessage 已还原');
    document.querySelector = function () { return null; };
})();

// ==================================================================
// NEW-17 / NEW-18：读数取整、角标无双负号
// ==================================================================
console.log('--- NEW-17/18 文案读数 ---');
(function () {
    var n = { id: 't17', name: '浮点人', gender: 'male', state: { mood: 46.362351043850914, stress: 12.7 } };
    global.npcManager.getNPC = function () { return n; };
    var html = global.injectEmotionToDialog('t17');
    assert(html.indexOf('46.362351') < 0 && html.indexOf('>46<') >= 0, '心情读数取整（46.362351… → 46）');
    assert(html.indexOf('12.7') < 0 && html.indexOf('>13<') >= 0, '压力读数取整（12.7 → 13）');
    assert(!/\d+\.\d{2,}/.test(html), '情绪面板全文无长浮点');
    var badge = global.getEmotionBadgeHTML(n);
    assert(badge.indexOf('压力:13') >= 0 && !/\d+\.\d{2,}/.test(badge), '情绪角标读数同样取整');
    delete global.npcManager.getNPC;

    var ns = src('js/npcs/npc-system.js');
    assert(ns.indexOf("${Math.round(mood)}") >= 0 && ns.indexOf("${Math.round(stress)}") >= 0,
        'npc-system 面板读数已取整');
    // NEW-18：角标不再双负号
    assert(ns.indexOf("'⚠-' +") < 0, 'npc-system 不再写死「⚠-」前缀接负数（双负号根子拔掉）');
    var badgeTxt = '⚠' + (30 ? -Math.floor(30 / 10) : -2);
    eq(badgeTxt, '⚠-3', '门槛角标现打「⚠-3」，不再是「⚠--3」');
    assert(/⚠' \+ \(s\.minAffection \? -Math\.floor\(s\.minAffection \/ 10\) : -2\)/.test(ns),
        '角标表达式在案（负号只留一个）');
})();

// ==================================================================
// NEW-46：主动行为收口一处
// ==================================================================
console.log('--- NEW-46 主动行为三套并一套 ---');
(function () {
    var ns = src('js/npcs/npc-system.js');
    var fnStart = ns.indexOf('checkActiveBehavior(npc) {');
    var fnBody = ns.slice(fnStart, ns.indexOf('_getCurrentDay()', fnStart));
    assert(fnBody.indexOf('executeActiveBehavior') < 0, 'checkActiveBehavior 不再无条件重复调真邮件版（免同窗双摇）');
    assert(fnBody.indexOf('托人送来了一份小礼物') < 0, '纯飘字送礼重复分支已删（假礼物不再糊脸）');
    assert(fnBody.indexOf('在背后说了你的坏话') < 0, '纯飘字敌意重复分支已删');
    assert(fnBody.indexOf('_pendingRequests.push') >= 0, '「主动求助」请求入账保留（应答面板的唯一喂数口，非重复实现）');
    var ls = src('js/npcs/npc-life-system.js');
    assert(ls.indexOf("'urgent', 'hostile'") >= 0 && ls.indexOf("'important', 'invite'") >= 0 && ls.indexOf("'normal', 'greet'") >= 0,
        '真邮件版三类来意都带上事件类型（主题按类型出题的输入端）');
    assert(ls.indexOf('executeActiveBehavior: executeActiveBehavior') >= 0, '真邮件/真物品实现（A）原样保留');
})();

// ==================================================================
// NEW-40：邮件洪水四闸
// ==================================================================
console.log('--- NEW-40 敌意信冷却 / 收件箱封顶 / 紧急件过期 / 主题分类 ---');
(function () {
    var MailSystem = global.MailSystem;
    window._mailSystemData = { inbox: [], outbox: [], favorites: [], _pending: [] };
    var hater = { id: 'sect_disciple_少林寺_1', name: '怨人', occupation: '弟子', location: '少林寺' };

    // ① 同一 NPC 敌意信 30 游戏日冷却
    stubRnd(0);
    var m1 = MailSystem.sendNPCMail(hater, '听说你在外面说我的坏话，记住。', 'urgent', 'hostile');
    restoreRnd();
    assert(m1 !== null && m1 !== undefined, '冷却窗口内第一封敌意信照发');
    eq(hater._lastHostileMailDay, 40, '发信日头记在 NPC 档上（世界内口径：游戏日）');
    var m2 = MailSystem.sendNPCMail(hater, '听说你在外面说我的坏话，记住。', 'urgent', 'hostile');
    eq(m2, null, '同一 NPC 30 游戏日内第二封敌意信被闸下');
    hater._lastHostileMailDay = 5;   // 35 日前发过 → 冷却已过
    var m3 = MailSystem.sendNPCMail(hater, '又听说你在外面说我的坏话。', 'urgent', 'hostile');
    assert(m3 !== null && m3 !== undefined, '满 30 游戏日后冷却解除');
    // 冷却随档往返
    var carrier = new NPC('t40_1', '冷却人', { location: '金城' });
    carrier._lastHostileMailDay = 12;
    var rc = NPC.deserialize(JSON.parse(JSON.stringify(carrier.serialize())));
    eq(rc._lastHostileMailDay, 12, '敌意信冷却日头随存档往返不丢');

    // ④ 主题按事件类型出题：敌意信不再叫「问候」
    assert(m1.subject.indexOf('问候') < 0, '敌意信主题不再是「问候」（实际=' + m1.subject + '）');
    assert(m1.subject.indexOf('紧急') === 0, '敌意信仍标「紧急」前缀');
    stubRnd(0);
    var greet = MailSystem.sendNPCMail({ id: 'x1', name: '泛交', occupation: '铁匠', location: '金城' }, '最近可好？', 'normal', 'greet');
    var invite = MailSystem.sendNPCMail({ id: 'x1', name: '泛交', occupation: '铁匠', location: '金城' }, '同游秘境？', 'important', 'invite');
    restoreRnd();
    assert(greet.subject.indexOf('问候') >= 0, '问候类沿用「身份+问候」措辞');
    assert(invite.subject.indexOf('问候') < 0 && invite.subject.indexOf('邀') >= 0, '邀约类另有措辞（实际=' + invite.subject + '）');

    // ② 收件箱全局封顶 200，超出丢最旧
    window._mailSystemData.inbox = [];
    for (var i = 0; i < 250; i++) {
        window._mailSystemData.inbox.push({ id: 'bulk_' + i, importance: 'normal', receivedAt: 57140 - i, subject: 's', body: 'b' });
    }
    MailSystem.cleanupExpiredMail();
    eq(window._mailSystemData.inbox.length, 200, '收件箱封顶 200 封');
    eq(window._mailSystemData.inbox[0].id, 'bulk_0', '留下的是最新的（头新）');
    eq(window._mailSystemData.inbox[199].id, 'bulk_199', '丢掉的是最旧的（尾旧）');

    // ③ 紧急件也可过期（90 天上限）
    window._mailSystemData.inbox = [
        { id: 'u_old', importance: 'urgent', receivedAt: 57140 - 91 * 1440, subject: 's', body: 'b' },
        { id: 'u_mid', importance: 'urgent', receivedAt: 57140 - 10 * 1440, subject: 's', body: 'b' }
    ];
    MailSystem.cleanupExpiredMail();
    eq(window._mailSystemData.inbox.length, 1, '紧急件 91 日即清（不再终身免死）');
    eq(window._mailSystemData.inbox[0].id, 'u_mid', '紧急件 90 日内仍在');
    window._mailSystemData = { inbox: [], outbox: [], favorites: [], _pending: [] };
})();

// ==================================================================
// NEW-41：收件箱时间文案与当前游戏分钟作差
// ==================================================================
console.log('--- NEW-41 时间文案按差值打（1 时辰=120 分钟） ---');
(function () {
    var f = global.MailSystemUI.formatTimeShort;
    global.timeSystem.gameTime.totalMinutes = 57140;
    eq(f(57138), '刚刚', '2 分钟前送达 → 刚刚');
    eq(f(57135), '5分钟前', '5 分钟前送达 → 5分钟前（旧版打「39天前」）');
    eq(f(57140 - 59), '59分钟前', '59 分钟仍按分钟打');
    eq(f(57140 - 300), '2时辰前', '300 分钟前 → 2时辰前（120 分钟=1 时辰）');
    eq(f(57140 - 1439), '11时辰前', '1439 分钟 → 11时辰前');
    eq(f(57140 - 2880), '2天前', '跨两日 → 2天前');
    eq(f(null), '?', '无时间戳照旧打「?」');
    var ui = src('js/mail-system-ui.js');
    var fnStart = ui.indexOf('function formatTimeShort');
    var fnBody = ui.slice(fnStart, ui.indexOf('}', ui.indexOf('天前', fnStart)) + 1);
    assert(fnBody.indexOf('new Date()') < 0, '死变量 new Date() 已删');
    assert(fnBody.indexOf('totalMinutes') >= 0, '与当前游戏分钟作差（不再拿绝对分钟当「几小时前」）');
    global.timeSystem.gameTime.totalMinutes = 57140;
})();

// ==================================================================
// NEW-43：NPC 有家
// ==================================================================
console.log('--- NEW-43 家锚点 / 有归宿游走 / 读端归属 / 迁移 ---');
(function () {
    // ① homeLocation 落锚 + 随档往返
    var n = new NPC('cres_金城_9', '落锚人', { location: '金城' });
    eq(n.homeLocation, '金城', '注册即落家锚点（cres_* 城中人物）');
    n.location = '少林寺';
    var rn = NPC.deserialize(JSON.parse(JSON.stringify(n.serialize())));
    eq(rn.homeLocation, '金城', 'homeLocation 随档往返不丢');
    eq(rn.location, '少林寺', '游走位置与家锚点互不覆盖');
    var addBack = new NPC('t43_add', '后补人', {});
    addBack.location = '洛水城';
    npcManager.addNPC(addBack);
    eq(addBack.homeLocation, '洛水城', 'addNPC 兜底补锚（构造时没给位置的也钉住）');
    npcManager.removeNPC('t43_add');

    // ④ 读端：按家锚点查人（NPC 出门，城面板不清空）
    var resident = new NPC('cres_金城_8', '出门的城主', { location: '金城' });
    resident.location = '华山派';   // 人在外面串门
    npcManager.addNPC(resident);
    var byHome = npcManager.getNPCsByHomeLocation('金城');
    assert(byHome.indexOf(resident) >= 0, 'getNPCsByHomeLocation：人在外串门仍算金城的人');
    assert(npcManager.getNPCsAtLocation('金城').indexOf(resident) < 0, 'getNPCsAtLocation 仍是「此刻站哪」口径（两把尺并存）');
    npcManager.removeNPC('cres_金城_8');
    var cr = src('js/npcs/city-residents.js');
    assert(cr.indexOf('getNPCsByHomeLocation') >= 0, '城中人物卡改按家锚点取数');
    var si = src('js/sects/sect-internal.js');
    assert(si.indexOf('n.location === sectName') < 0 && si.indexOf('getSectOfNpcId') >= 0,
        '门派名册改按 id 前缀/家锚点判归属（不再「谁站在这儿谁是本门的人」）');

    // ⑤ 旧档迁移：sect_* 漂进设施格送回门派
    var monk = new NPC('sect_disciple_少林寺_4', '漂走的弟子', { location: '少林寺' });
    var sm = monk.serialize();
    delete sm.homeLocation;         // 旧档没有家锚点
    sm.location = '旅馆';           // 被旧游走冲进了设施格
    var rm = NPC.deserialize(JSON.parse(JSON.stringify(sm)));
    eq(rm.homeLocation, '少林寺', 'sect_* 旧档按 id 推导出门派为家');
    eq(rm.location, '少林寺', '漂进旅馆的弟子读档即送回门派');

    // ②③ 有归宿游走（npc-life-actor）
    var NPCLife = global.NPCLife;
    var walker = {
        id: 'cres_金城_1', name: '钱万贯', location: '军营', homeLocation: '金城',
        combat: { realm: '炼气', layer: 1 }, changeAffection: function () {}
    };
    var loiterer = {
        id: 'loiter_1', name: '常客', location: '旅馆',
        combat: { realm: '炼气', layer: 1 }, changeAffection: function () {}
    };
    npcManager.getAllNPCs = function () { return [walker, loiterer]; };
    npcManager.getNPC = function (id) { return id === walker.id ? walker : loiterer; };

    // 夜归：游戏小时 20 → 直接回家
    global.timeSystem.gameTime.currentHour = 20;
    NPCLife._store()['cres_金城_1'] = { lastActionDay: 0, actionHistory: [] };
    seqRnd([0.05]);   // 行动掷出 move
    NPCLife.tickDay(201);
    restoreRnd();
    eq(walker.location, '金城', '夜里（20 时）游走直接回 homeLocation');
    var logs = NPCLife.getRumorLog(50).filter(function (r) { return r.npcId === 'cres_金城_1' && r.day === 201; });
    assert(logs.length === 1 && logs[0].summary.indexOf('离开 军营 前往 金城') >= 0,
        'summary 出发地取改写前的旧值（不再打「离开军营前往军营」，实际=' + (logs[0] && logs[0].summary) + '）');

    // 白天出门：目的地只从世界地点池里挑，设施格不进池
    global.timeSystem.gameTime.currentHour = 12;
    NPCLife._store()['cres_金城_1'] = { lastActionDay: 0, actionHistory: [] };
    seqRnd([0.05, 0.99, 0.0]);   // move → 不回家（>0.5）→ 池内挑第一处
    NPCLife.tickDay(202);
    restoreRnd();
    assert(walker.location !== '金城' && FACILITY_TILES.indexOf(walker.location) < 0,
        '白天出门串世界地点（实际=' + walker.location + '）');
    assert(['洛水城', '少林寺', '华山派'].indexOf(walker.location) >= 0,
        '目的地池只收城名+门派名（实际=' + walker.location + '）');

    // 多日随机游走：任何人都不再漂进设施格
    var drifted = false;
    for (var d = 300; d < 330; d++) {
        NPCLife._store()['cres_金城_1'] = { lastActionDay: 0, actionHistory: [] };
        NPCLife._store()['loiter_1'] = { lastActionDay: 0, actionHistory: [] };
        NPCLife.tickDay(d);
        if (FACILITY_TILES.indexOf(walker.location) >= 0 || FACILITY_TILES.indexOf(loiterer.location) >= 0) drifted = true;
    }
    assert(!drifted, '30 日随机游走无人漂进旅馆/军营/后山这类设施格');
    delete npcManager.getAllNPCs; delete npcManager.getNPC;
})();

// ==================================================================
// NEW-14：NPC 注册不再刷 gameLog
// ==================================================================
console.log('--- NEW-14 注册日志不入 gameLog ---');
(function () {
    var before = global.gameLog.entries.length;
    var n = new NPC('t14_1', '路人甲', { location: '金城' });
    npcManager.addNPC(n);
    eq(global.gameLog.entries.length, before, 'addNPC 不再写「NPC「某某」加入了游戏」（真实流水不被挤掉）');
    npcManager.removeNPC('t14_1');
    assert(global.gameLog.entries.length === before + 1, '离册仍有审计记录（低频、有价值，保留）');
})();

// ==================== 收尾 ====================
console.log('\n通过 ' + passed + ' 项，失败 ' + failed + ' 项');
process.exit(failed ? 1 : 0);
