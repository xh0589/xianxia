/**
 * wave76-family-letter-node.js — 第七十六波 · 家书邮路 验收：
 *   A 门账：写信一页挂在收件箱页签上、出口在册、老导出一个不缺
 *   B 名录账：道侣置顶、好感二十以下生人不寄信、排序、空名录指路结善缘
 *   C 寄信账：走驿路老账（资费真扣/修书费时/信落发件箱/回音按好感排程）、空信不寄、灵镜凡人用不得
 *   D 老账无恙：回复老路、待收推进、好感回信账（v23.3）原样
 *   E 哨兵：本波只添门不添账——零新存档字段、新段零骰零拉丁、邮路正典（mail-system.js）一字未动
 *
 * 运行：node tests/wave76-family-letter-node.js
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

// ==================== 世界桩 ====================
global.window = global;
var els = {};
function fakeEl(tag) {
    var el = {
        tag: tag || '', children: [], style: { setProperty: function () {} }, dataset: {}, _attrs: {}, parentNode: null,
        getBoundingClientRect: function () { return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }; },
        setAttribute: function (k, v) { this._attrs[k] = v; },
        getAttribute: function (k) { return this._attrs[k]; },
        appendChild: function (c) { this.children.push(c); c.parentNode = this; return c; },
        removeChild: function (c) { var i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c; },
        remove: function () {},
        addEventListener: function () {}, removeEventListener: function () {},
        querySelector: function () { return null; },
        querySelectorAll: function () { return []; },
        closest: function () { return null; },
        classList: { add: function () {}, remove: function () {}, toggle: function () {} },
        _html: '', textContent: ''
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
var msgs = [], timeCalls = [], scheduled = [], toasts = [];
global.showMessage = function (m) { msgs.push(String(m)); };
global.setTimeout = function (fn) { return 0; };
global.setInterval = function () { return 0; };
global.timeSystem = {
    gameTime: { totalMinutes: 100000, currentDay: 70 },
    advanceTime: function (m, r) { timeCalls.push({ m: m, r: String(r || '') }); this.gameTime.totalMinutes += m; },
    getAbsoluteDay: function () { return 800; }
};
global.PROMPT_RET = '见字如面。山中岁月长，一切安好，勿念。';
global.prompt = function () { return global.PROMPT_RET; };
global.CONFIRM_RET = false;
global.confirm = function () { return global.CONFIRM_RET; };
global.GameScheduler = {
    registerHandler: function (id, fn) { global.__mailReplyHandler = fn; },
    schedule: function (id, when, payload) { scheduled.push({ id: id, when: when, payload: payload }); },
    nowMinute: function () { return global.timeSystem.gameTime.totalMinutes; }
};
var NPCS = {};
global.npcManager = {
    getAllNPCs: function () { return Object.keys(NPCS).map(function (k) { return NPCS[k]; }); },
    getNPC: function (id) { return NPCS[id] || null; }
};
global.currentCharData = {
    name: '测试信客', realm: '凡人', layer: 1, location: '洛水城',
    mood: 80, bonds: {}, lifeSkills: {}
};
global.inventory = { currency: { spiritStones: 200, copper: 500 }, slots: [] };
global.updateCurrencyUI = function () {};
global.updateCharacterStatus = function () {};

load('js/mail-system.js');
load('js/mail-system-ui.js');

var MS = global.MailSystem;
var MUI = global.MailSystemUI;
var origRandom = Math.random;
function withRandom(v, fn) {
    Math.random = function () { return v; };
    try { return fn(); } finally { Math.random = origRandom; }
}
function fresh() {
    global._mailSystemData = { inbox: [], outbox: [], favorites: [], _pending: [] };
    NPCS = {
        npc_yun: { id: 'npc_yun', name: '云娘', location: '洛水城', relationship: { affection: 30, flags: new Set() }, changeAffection: function (d) { this.relationship.affection += d; } },
        npc_lu: { id: 'npc_lu', name: '陆行舟', location: '炎城', relationship: { affection: 66, flags: new Set() }, changeAffection: function (d) { this.relationship.affection += d; } },
        npc_mo: { id: 'npc_mo', name: '莫生人', location: '金城', relationship: { affection: 5, flags: new Set() }, changeAffection: function (d) { this.relationship.affection += d; } }
    };
    global.currentCharData.bonds = {};
    delete global.currentCharData._mailAffDay;
    global.currentCharData.realm = '凡人';
    global.currentCharData.location = '洛水城';
    global.inventory.currency = { spiritStones: 200, copper: 500 };
    msgs.length = 0; timeCalls.length = 0; scheduled.length = 0;
    global.PROMPT_RET = '见字如面。山中岁月长，一切安好，勿念。';
    global.CONFIRM_RET = false;
}
function sent() { return global._mailSystemData.outbox; }

// ==================== A · 门账 ====================
console.log('\n[A] 门账（写信的门开在收件箱里）');
fresh();
eq(typeof MUI.composeTo, 'function', 'A1 写信出口在册');
eq(typeof MUI.writableRecipients, 'function', 'A2 名录出口在册（测试可对账）');
eq(typeof MUI.renderComposeInto, 'function', 'A3 写信页渲染出口在册');
var uiSrc = fs.readFileSync(path.join(ROOT, 'js/mail-system-ui.js'), 'utf8');
assert(uiSrc.indexOf('data-tab="compose"') >= 0 && uiSrc.indexOf('✍️ 写信') >= 0, 'A4 收件箱页签添了「写信」一页（门开在老面板里）');
assert(uiSrc.indexOf("if (tab === 'compose')") >= 0, 'A5 写信页走真渲染（页签切换接上了）');
assert(['openInbox', 'openMail', 'replyMail', 'toggleFav', 'deleteMail', 'renderInboxList'].every(function (k) { return typeof MUI[k] === 'function'; }), 'A6 收件箱老出口一个不缺');
assert(['send', 'playerSendMail', 'playerReply', 'checkCarrierAvailability', 'advancePendingMail'].every(function (k) { return typeof MS[k] === 'function'; }), 'A7 驿路老出口一个不缺');

// ==================== B · 名录账 ====================
console.log('\n[B] 名录账（生人不寄信）');
fresh();
var rec1 = MUI.writableRecipients();
eq(rec1.length, 2, 'B1 好感五分的生人不上名录（云娘三十、陆行舟六十六在）');
assert(rec1.map(function (r) { return r.id; }).indexOf('npc_mo') < 0, 'B2 生人确实不在');
global.currentCharData.bonds = { npc_yun: { type: 'dao_companion', name: '云娘' } };
var rec2 = MUI.writableRecipients();
eq(rec2[0].id, 'npc_yun', 'B3 道侣置顶（好感再高也排在前头）');
eq(rec2[0].dao, true, 'B4 道侣认出来了');
eq(rec2[1].id, 'npc_lu', 'B5 置顶之后按好感排（六十六在前）');
NPCS['npc_flag'] = { id: 'npc_flag', name: '旗娘', location: '北冥', relationship: { affection: 0, flags: new Set(['dao_companion']) } };
var rec3 = MUI.writableRecipients();
eq(rec3.filter(function (r) { return r.dao; }).length, 2, 'B6 旗记的道侣也算道侣（两套老账都认）');
delete NPCS['npc_flag'];
global.currentCharData.bonds = {};
NPCS = {};
eq(MUI.writableRecipients().length, 0, 'B7 一个故人也没有——名录如实空着');
var listEl = fakeEl();
MUI.renderComposeInto(listEl);
assert(listEl.innerHTML.indexOf('结善缘') >= 0 && listEl.innerHTML.indexOf('好感二十') >= 0, 'B8 空名录指路（去结善缘，信才有处寄）');
fresh();
var listEl2 = fakeEl();
MUI.renderComposeInto(listEl2);
assert(listEl2.innerHTML.indexOf('陆行舟') >= 0 && listEl2.innerHTML.indexOf('好感 66') >= 0, 'B9 名录页写着名字与好感');
assert(listEl2.innerHTML.indexOf('composeTo') >= 0, 'B10 每人一支笔（写信按钮在册）');

// ==================== C · 寄信账 ====================
console.log('\n[C] 寄信账（信随驿路走，账是老账）');
fresh();
eq(MUI.composeTo('npc_lu'), true, 'C1 给挚友寄信成功');
eq(sent().length, 1, 'C2 信落发件箱');
eq(sent()[0].type, 'player_sent', 'C3 发件箱老格式（type 不变）');
assert(sent()[0].subject.indexOf('寄自洛水城') >= 0, 'C4 信皮写着寄信的城');
eq(sent()[0].body, global.PROMPT_RET, 'C5 信文原样（一字不改）');
eq(sent()[0].carrier, 'pigeon', 'C6 默认飞鸽（免费的那只）');
eq(timeCalls[timeCalls.length - 1].m, 10, 'C7 修书一封费时一刻（老账）');
eq(global.inventory.currency.spiritStones, 200, 'C8 飞鸽不要钱（分文未动）');
// 回音排程（好感 66 → 概率 0.85，骰 0.1 必中）
fresh();
global.currentCharData.bonds = {};
withRandom(0.1, function () { MUI.composeTo('npc_lu'); });
eq(scheduled.length, 1, 'C9 回音排上了程（驿路的骰是老骰——本波一枚不添）');
eq(scheduled[0].id, 'mail:auto_reply', 'C10 排的是老回执（mail:auto_reply）');
assert(scheduled[0].payload.originalMail.fromNpcId === 'npc_lu', 'C11 回执带着收信人（回信找得到人）');
// 空信不寄
fresh();
global.PROMPT_RET = '   ';
eq(MUI.composeTo('npc_lu'), false, 'C12 白纸一张不寄（空信拦下）');
eq(sent().length, 0, 'C13 发件箱没落信');
eq(timeCalls.length, 0, 'C14 没寄出也不费时');
// 查无此人
fresh();
eq(MUI.composeTo('npc_ghost'), false, 'C15 查无此人如实拒');
// 灵镜：凡人用不得
fresh();
global.CONFIRM_RET = true;
eq(MUI.composeTo('npc_lu'), true, 'C16 凡人想要灵镜——飞鸽照寄（灵镜用不得就不问）');
eq(sent()[0].carrier, 'pigeon', 'C17 落回飞鸽');
// 灵镜：筑基可用、资费真扣
fresh();
global.currentCharData.realm = '筑基';
global.CONFIRM_RET = true;
eq(MUI.composeTo('npc_lu'), true, 'C18 筑基寄灵镜成功');
eq(sent()[0].carrier, 'mirror', 'C19 走的灵镜');
eq(global.inventory.currency.spiritStones, 150, 'C20 资费五十灵石真扣（价目表不是装饰——v23.2 老账）');
// 灵镜资费不够
fresh();
global.currentCharData.realm = '筑基';
global.CONFIRM_RET = true;
global.inventory.currency.spiritStones = 10;
eq(MUI.composeTo('npc_lu'), false, 'C21 囊中羞涩灵镜寄不出（老账如实拒）');
eq(sent().length, 0, 'C22 拒了就不落信');
assert(msgs.some(function (m) { return m.indexOf('换只飞鸽') >= 0; }), 'C23 拒语还是那句老话');

// ==================== D · 老账无恙 ====================
console.log('\n[D] 老账无恙（回信的路一寸没动）');
fresh();
// 造一封 NPC 来信（骰定在半开——不截不误）
withRandom(0.5, function () {
    MS.send({ fromNpcId: 'npc_lu', fromNpcName: '陆行舟', subject: '久别', body: '一别经年，见字如面。', carrier: 'mirror', importance: 'normal' });
});
MS.advancePendingMail();
eq(global._mailSystemData.inbox.length, 1, 'D1 待收信照旧入箱（灵镜即达）');
MS.advancePendingMail();
MS.advancePendingMail();
eq(global._mailSystemData.inbox.length, 1, 'D1b 即达信不入箱两次（双份老虫当场拔掉——轮询三遍也只有一封）');
global.PROMPT_RET = '一切都好，勿念。';
MUI.replyMail(global._mailSystemData.inbox[0].id);
assert(sent().length === 1 && sent()[0].subject.indexOf('回复') === 0, 'D2 回复老路照走（回复: 前缀）');
// 好感回信账（v23.3）：至交回信情分+1（一日两封封顶）
fresh();
withRandom(0.5, function () {
    global.__mailReplyHandler({ originalMail: { fromNpcId: 'npc_lu', fromNpcName: '陆行舟', subject: '旧信', location: '炎城' } });
});
eq(NPCS['npc_lu'].relationship.affection, 67, 'D3 至交回信暖情分（66→67，老账）');
// 信来得勤：第二封还涨、第三封封顶不涨，回信在路上
withRandom(0.5, function () {
    global.__mailReplyHandler({ originalMail: { fromNpcId: 'npc_lu', fromNpcName: '陆行舟', subject: '又信', location: '炎城' } });
    global.__mailReplyHandler({ originalMail: { fromNpcId: 'npc_lu', fromNpcName: '陆行舟', subject: '三信', location: '炎城' } });
});
eq(NPCS['npc_lu'].relationship.affection, 68, 'D4 一日两封封顶——第三封不再涨（老闸还在）');
global.timeSystem.gameTime.totalMinutes += 2000;
MS.advancePendingMail();
assert(global._mailSystemData.inbox.length >= 3, 'D5 三封回信都到了箱（飞鸽路慢，但都到了）');

// ==================== E · 哨兵 ====================
console.log('\n[E] 哨兵（本波只添门，不添账）');
var msSrc = fs.readFileSync(path.join(ROOT, 'js/mail-system.js'), 'utf8');
eq((msSrc.match(/第七十六波/g) || []).length, 1, 'E1 邮路正典只动了一处（即达信摘出待收队列——双份老虫），其余一字未动');
assert(msSrc.indexOf('第七十六波·顺手拔一根刺') >= 0, 'E1b 拔刺的注脚在案');
var seg = uiSrc.slice(uiSrc.indexOf('第七十六波'), uiSrc.indexOf('// 暴露到全局'));
eq((seg.match(/Math\.random/g) || []).length, 0, 'E2 新段零骰（驿路的老骰一枚不添）');
var latin = /[A-Za-z]/;
var leak = null;
(seg.match(/'[^']+'/g) || []).forEach(function (s) {
    var v = s.slice(1, -1);
    if (/[+);({\[,?<>]/.test(v)) return;
    if (v.indexOf('\\') >= 0) return;
    if (/typeof|===|!==/.test(v)) return;
    if (/^[a-z0-9]+(?:[-_: ][a-z0-9]+)*$/.test(v)) return;
    if (latin.test(v)) leak = leak || s;
});
eq(leak, null, 'E3 新段话术零拉丁（漏: ' + leak + '）');
assert(seg.indexOf('_mailSystemData') < 0 && seg.indexOf('localStorage') < 0, 'E4 新段不立账不写档（名录现编，信走老档）');
fresh();
var cdKeys = Object.keys(global.currentCharData).sort().join(',');
MUI.writableRecipients();
MUI.composeTo('npc_lu');
eq(Object.keys(global.currentCharData).sort().join(','), cdKeys, 'E5 角色账零新字段（寄信只动驿路老档）');
var htmlSrc = fs.readFileSync(path.join(ROOT, '仙侠.html'), 'utf8');
assert(htmlSrc.indexOf('js/mail-system.js') >= 0 && htmlSrc.indexOf('js/mail-system-ui.js') >= 0, 'E6 驿路两件套挂载原样（本波不加新文件）');
assert(msSrc.indexOf('function playerSendMail(') >= 0 && msSrc.indexOf('function sendAutoReplyFromNPC(') >= 0, 'E7 老寄信与老回信函数都在原地（源码钉位）');
assert(msSrc.indexOf('v23.2 价目表不是装饰') >= 0 && msSrc.indexOf('v23.3 回信看交情') >= 0, 'E8 资费与回音两段老账注脚俱在');

console.log('\n========== 第七十六波 · 家书邮路 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
