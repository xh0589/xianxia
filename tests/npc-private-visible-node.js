/**
 * npc-private-visible-node.js — NPC 个人事件入口「默认看得见」验收
 *
 * 病根（本批实测）：NPC 个人事件清单被一道「默认关」的设置闸整栏挡在门外——
 *   js/npcs/npc-personal-events.js 的 getPersonalEventButtons 里
 *   `if (!(window._settings && window._settings.socialEventPanel === true)) return '';`
 *   于是新档（从没写过这个键）连一条按钮都拿不到；已接线的 8 面 pe_open_ 消费端
 *   （NPC_OPEN_ROUTE_FOLLOWS）也只能靠交谈拦截那条概率路撞见，玩家无从找入口。
 *   「看不见」不是沉浸，是丢内容：禁止设计.md 第 2 条要求锁要亮、写清为什么锁，而不是整栏消失。
 *
 * 本套件断言三件事（对应任务书验收）：
 *   ① 默认（没写过 socialEventPanel）个人事件入口真的渲染出按钮，不是整栏空；
 *   ② 条件不够时给的是 🔒 + 原因文案，不是 display:none 整栏；
 *   ③ 至少 1 条 pe_open_ 路线在对话面板 / 人脉面板的 HTML 里搜得到（旗标不能只写进存档）。
 * 另附 ④ 已接线的 8 面消费端事件在默认态真的点得到（可触发按钮里带它的 id）。
 *
 * 手法：按 仙侠.html 全部 script 的真实挂载顺序装进 vm 沙箱真跑，事件池/消费端表都是真的；
 *       个人事件的旗标由真结算函数 settleNpcEventConsequence 落下，不用手工塞。
 * 抓回归：把闸改回「永关」（=== true 才放行）→ 本套件 B1/B2/D1/D2 立刻打红。
 */
'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var ROOT = path.resolve(__dirname, '..');

var passed = 0, failed = 0;
function ok(c, m) { if (c) { passed++; console.log('  ✓ ' + m); } else { failed++; console.log('  [FAIL] ' + m); } }
function head(t) { console.log('\n===== ' + t + ' ====='); }
function read(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ================================================================ A 源码接线
head('[A] 源码接线 —— 闸门的极性翻过来了吗');
{
    var npe = read('js/npcs/npc-personal-events.js');
    ok(/function isPersonalEventListShown\(\)\s*\{\s*return !\(window\._settings && window\._settings\.socialEventPanel === false\);/.test(npe),
        'A1 有唯一判定口 isPersonalEventListShown()：只认「显式 false」（没写过＝罗列）');
    ok(/function getPersonalEventButtons\(npc, npcId\)[\s\S]{0,900}if \(!isPersonalEventListShown\(\)\) return '';/.test(npe),
        'A2 getPersonalEventButtons 的闸改成 isPersonalEventListShown()');
    ok(npe.indexOf('socialEventPanel === true)) return \'\';') < 0,
        'A3 旧的「=== true 才放行」永关写法已从清单函数里消失');
    ok(/if \(!isPersonalEventListShown\(\)\) \{\s*\n\s*if \(tryInterceptPersonalEvent\(npc, npcId\)\) return true;/.test(npe),
        'A4 交谈总闸：只有沉浸模式（显式关掉）才拦面板开场');
    ok(npe.indexOf('window.isPersonalEventListShown = isPersonalEventListShown;') >= 0, 'A5 判定口已挂 window');
    // 秘密补注入必须仍在闸前面：懒注册掌门的秘密不能因为闸翻面就断供
    ok(npe.indexOf('injectSectSecrets();') < npe.indexOf('if (!isPersonalEventListShown()) return \'\';'),
        'A6 秘密补注入先于闸（懒注册掌门的秘密不断供）');

    var app = read('js/app.js');
    ok(/sepCb[\s\S]{0,160}socialEventPanel === false\)/.test(app), 'A7 initSettings 默认把勾选回填为「开」（与 A1 同一口径）');
    ok(/function toggleSocialEventPanel\(\)[\s\S]{0,400}window\._settings\.socialEventPanel = !!cb\.checked[\s\S]{0,200}xianxia_settings/.test(app),
        'A8 开关仍写 _settings 并持久化');
    // 禁止设计.md 第 3 条：好感衰减不许被顺手改成默认开
    ok(/var decayCb[\s\S]{0,160}affectionDecay === true/.test(app) && /function checkDailyAffectionDecay\(\)[\s\S]{0,1200}affectionDecay === true/.test(npe),
        'A9 好感衰减仍是「必须显式 true 才开」，本批没碰它');

    var html = read('仙侠.html');
    ok(html.indexOf('id="setting-social-event-panel"') >= 0 && /默认开启：面板逐桩列出事件清单/.test(html),
        'A10 设置页帮助文案已改成「默认开启 / 勾掉才是沉浸模式」');

    var rp = read('js/relations-panel.js');
    ok(rp.indexOf('function relationsOpenRoutesHtml(npc)') >= 0 && rp.indexOf('function relationsPrivateLineHtml(npc)') >= 0,
        'A11 人脉面板多两段常驻可见：已开的路 / 私人线');
    ok(/relationsOpenRoutesHtml\(npc\)[\s\S]{0,200}relationsPrivateLineHtml\(npc\)[\s\S]{0,200}relationsJealousyBellHtml\(npc\)/.test(rp),
        'A12 两段都挂在卡片上（铃铛仍在，整卡不会被抽空）');
}

// ================================================================ 沙盒基建
function fakeEl(tag) {
    var el = {
        tagName: tag || 'div', style: {}, dataset: {}, children: [], className: '',
        classList: { _s: {}, add: function (c) { this._s[c] = 1; }, remove: function (c) { delete this._s[c]; }, contains: function (c) { return !!this._s[c]; } },
        _html: '', _text: '', value: '', checked: false, scrollTop: 0, scrollHeight: 0,
        appendChild: function (c) { this.children.push(c); return c; },
        removeChild: function () {}, remove: function () {},
        setAttribute: function () {}, getAttribute: function () { return null; },
        addEventListener: function () {}, focus: function () {},
        closest: function () { return null; }, onclick: null
    };
    Object.defineProperty(el, 'innerHTML', { get: function () { return this._html; }, set: function (v) { this._html = v; } });
    Object.defineProperty(el, 'textContent', { get: function () { return this._text; }, set: function (v) { this._text = v; } });
    el.querySelector = function (sel) {
        if (!el._qs) el._qs = {};
        if (!el._qs[sel]) el._qs[sel] = fakeEl('qs:' + sel);
        return el._qs[sel];
    };
    el.querySelectorAll = function () { return []; };
    return el;
}

// 按 仙侠.html 的真实 script 顺序装全项目（事件池 988 桩与消费端表都是真的）
var 装载问题 = [];
var W = null;
function 建沙箱() {
    var noop = function () { };
    var 册 = {};
    var body = fakeEl('body');
    var 弹窗 = [];
    var w = {
        console: { log: noop, warn: noop, error: noop, info: noop },
        Math: Math, Date: Date, JSON: JSON, Object: Object, Array: Array, String: String,
        Number: Number, Boolean: Boolean, Error: Error, RegExp: RegExp, Symbol: Symbol,
        Set: Set, Map: Map, WeakMap: WeakMap, Proxy: Proxy, Reflect: Reflect, Intl: Intl,
        isNaN: isNaN, parseInt: parseInt, parseFloat: parseFloat, isFinite: isFinite,
        setTimeout: noop, clearTimeout: noop, setInterval: noop, clearInterval: noop, Promise: Promise,
        NPC_PERSONAL_EVENTS: {}, NPC_ENDING_SETS: {}, NPC_ENDING_CALLBACKS: {}, eventFlags: {},
        timeSystem: { onNewDaySubscribe: noop, gameTime: { currentDay: 1, currentHour: 12, totalMinutes: 0 }, getAbsoluteDay: function () { return 1; }, advanceTime: noop },
        currentCharData: { name: '测试道人', gender: 'male', location: '少林寺', realm: '金丹', layer: 5, flags: {}, energy: 100 },
        discipleState: { isInSect: false },
        sectsData: {},
        showMessage: noop, showModal: noop, esc: function (x) { return String(x == null ? '' : x); },
        addItem: function () { return true; }, hasItem: function () { return false; },
        giveWithReceipt: function () { return { got: 1, count: 1, name: 'x' }; },
        addItemFailPhraseFor: function () { return ''; }, addItemReasonPhrase: function () { return ''; },
        addItemToInventory: noop, removeItemFromInventory: noop,
        applyBuff: noop, startBattle: noop, showChoiceDialog: noop, getAbsoluteDay: function () { return 1; },
        driftPersonality: noop, EventBus: { on: noop, emit: noop },
        playerName: '测试道人',
        detectRivalRomance: function () { return null; }, _rivalSexFlavor: function () { return ''; },
        _jealTrustDiscount: noop, _jealWriteback: function () { return {}; }, _jealGuestInfo: function () { return null; },
        localStorage: { _s: {}, getItem: function (k) { return Object.prototype.hasOwnProperty.call(this._s, k) ? this._s[k] : null; }, setItem: function (k, v) { this._s[k] = String(v); }, removeItem: function (k) { delete this._s[k]; } },
        saveToStorage: function () { return true; }, loadFromStorage: function () { return null; },
        navigator: { userAgent: 'node', language: 'zh-CN' }, performance: { now: function () { return Date.now(); } },
        location: { href: 'http://127.0.0.1/', search: '', hash: '' }, innerWidth: 1280, innerHeight: 720,
        npcManager: {
            getNPC: function (id) { return 册[id] || null; },
            getAllNPCs: function () { return Object.keys(册).map(function (k) { return 册[k]; }); },
            detectRivalRomance: function () { return null; },
            _册: 册
        },
        _settings: {}
    };
    w.__册 = 册; w.__弹窗 = 弹窗;
    w.window = w; w.globalThis = w; w.global = w; w.self = w;
    w.document = {
        readyState: 'complete',
        createElement: fakeEl,
        getElementById: function () { return null; },
        querySelector: function () { return null; },
        querySelectorAll: function () { return []; },
        body: body, head: fakeEl('head'), addEventListener: noop, removeEventListener: noop,
        documentElement: { style: {} }
    };
    body.appendChild = function (c) { 弹窗.push(c); return c; };
    var ctx = vm.createContext(w);
    var html = read('仙侠.html');
    var 全部 = (html.match(/src="([^"]+\.js)"/g) || []).map(function (s) { return s.slice(5, -1); });
    全部.forEach(function (rel) {
        var fp = path.join(ROOT, rel.replace(/\//g, path.sep));
        if (!fs.existsSync(fp)) { 装载问题.push(rel + ' :: 文件不存在'); return; }
        try { vm.runInContext(fs.readFileSync(fp, 'utf8'), ctx, { filename: rel, timeout: 60000 }); }
        catch (e) { 装载问题.push(rel + ' :: ' + e.message); }
    });
    return w;
}

function 造NPC(id, 名, 好感, 已结识, 所在) {
    var flags = new Set();
    var npc = {
        id: id, name: 名 || id, gender: 'female', occupation: '旧识',
        location: 所在 || id, appearance: { icon: '👤' },
        relationship: { affection: 好感 === undefined ? 0 : 好感, hatred: 0, favor: 0, favorMax: 50, respect: 0, love: 0, fear: 0, trust: 0, flags: flags, history: [] },
        memory: { playerActions: [], impressions: {}, questsGiven: [], firstMet: 已结识 !== false, meetCount: 已结识 === false ? 0 : 3 },
        secrets: {}, unlockSecret: function () { return false; },
        setFlag: function (f) { flags.add(f); }, hasFlag: function (f) { return flags.has(f); },
        removeFlag: function (f) { flags.delete(f); },
        getRelationshipStatus: function () { return null; }, recordPlayerAction: function () { }
    };
    W.__册[id] = npc;
    return npc;
}

W = 建沙箱();
var E = W.NPC_PERSONAL_EVENTS;

head('[B] 装载 —— 事件池与消费端表都是真的');
var 意外 = 装载问题.filter(function (m) { return m.indexOf('MutationObserver') < 0 && m.indexOf('addEventListener') < 0 && m.indexOf('::') >= 0; });
ok(意外.length === 0, 'B1 全部脚本装载无意外错误' + (意外.length ? '：' + 意外.slice(0, 3).join(' | ') : ''));
ok(Object.keys(E || {}).length > 900, 'B2 事件池 ' + Object.keys(E || {}).length + ' 桩（真实全池，非桩件）');
ok(typeof W.getPersonalEventButtons === 'function' && typeof W.isPersonalEventListShown === 'function',
    'B3 面板清单函数与判定口都在 window 上');

// ================================================================ C 默认可见
head('[C] ★默认可见 —— 没写过这个键的档，个人事件入口要真的画出按钮');
var 无咎 = 造NPC('shaolin_wujiu', '无咎', 30, true, '少林寺');
W.currentCharData.location = '少林寺';
W._settings = {};                                  // ← 从没写过 socialEventPanel 的档
var 默认Html = W.getPersonalEventButtons(无咎, 'shaolin_wujiu');
ok(typeof 默认Html === 'string' && 默认Html.length > 200,
    'C1 默认（未写 socialEventPanel）返回的不是空串：' + (typeof 默认Html === 'string' ? 默认Html.length + ' 字符' : typeof 默认Html));
ok(默认Html.indexOf('个人事件') >= 0, 'C2 栏目标题在（📜 个人事件）');
ok(默认Html.indexOf('triggerPersonalEvent(') >= 0, 'C3 清单里真的带可点按钮（triggerPersonalEvent 调用串）');
ok(/🔒/.test(默认Html) && /尚未结识|需亲至|好感≥|需先|需要|条件未满足|仅女修|仅男修/.test(默认Html),
    'C4 锁着的那几桩给的是 🔒 + 原因文案，不是空白');
ok(!/display\s*:\s*none/.test(默认Html) && 默认Html.indexOf('<details') >= 0,
    'C5 整栏没被 display:none 掉，是可展开的 <details>');
ok(W.isPersonalEventListShown() === true, 'C6 判定口：空 _settings → 罗列');
W._settings.socialEventPanel = true;
ok(W.isPersonalEventListShown() === true && W.getPersonalEventButtons(无咎, 'shaolin_wujiu').length > 200,
    'C7 显式 true → 罗列（v22.0 老玩家勾选过的那批不受影响）');
W._settings.socialEventPanel = false;
var 沉浸Html = W.getPersonalEventButtons(无咎, 'shaolin_wujiu');
ok(沉浸Html === '', 'C8 显式 false → 沉浸模式（这是玩家自己勾的，不是条件不满足）');
W._settings.socialEventPanel = true;                // v22.0 时代写下的 true 也照样是「开」
W._settings = {};
ok(W.isPersonalEventListShown() === true, 'C9 没有这个键的档一律按「开」算（新档与从没碰过开关的老档同口径）');

// ================================================================ D 条件不够：锁 + 原因，不是整栏消失
head('[D] ★条件不够 —— 锁要亮、写清为什么锁');
var 生人 = 造NPC('sect_leader_华山派', '岳不群', 0, false, '华山派');
var 生人Html = W.getPersonalEventButtons(生人, 'sect_leader_华山派');
ok(生人Html.length > 200 && 生人Html.indexOf('个人事件') >= 0,
    'D1 尚未结识：整栏照旧在（不是空串）');
ok(/🔒/.test(生人Html) && 生人Html.indexOf('尚未结识') >= 0, 'D2 尚未结识 → 逐条写明「尚未结识」');
ok(生人Html.indexOf('尚未与此人结识') >= 0, 'D3 标题旁另给一句总括提示（玩家一眼知道自己卡在哪）');

W.currentCharData.location = '百花谷';                 // 人在别处
var 异地 = 造NPC('sect_leader_少林寺', '竺照禅师', 10, true, '少林寺');
var 异地Html = W.getPersonalEventButtons(异地, 'sect_leader_少林寺');
ok(异地Html.length > 200 && /🔒/.test(异地Html), 'D4 人在别处：整栏在，逐条锁着');
ok(异地Html.indexOf('需亲至「少林寺」') >= 0, 'D5 异地原因写明去处（需亲至「少林寺」）');
W.currentCharData.location = '少林寺';
var 在场Html = W.getPersonalEventButtons(异地, 'sect_leader_少林寺');
ok(在场Html.length > 200 && !/display\s*:\s*none/.test(在场Html),
    'D6 人在其门内：整栏仍在（从「锁」到「可触发」是同一栏，不是两套 UI）');
ok(/好感≥/.test(在场Html), 'D7 好感不足的桩给「好感≥X（当前Y）」');

// ================================================================ E 已开的路看得见
head('[E] ★已开的路（pe_open_*）不能只写进存档');
var 真Ev = E['wujiu_event_008'];
ok(!!真Ev && 真Ev.npcId === 'shaolin_wujiu', 'E1 取一桩真的 open 事件做结算：wujiu_event_008 × friend');
W.eventFlags = {};
无咎.relationship.affection = 30;
W.settleNpcEventConsequence(无咎, 真Ev, 'friend', { trustTouched: false, loveTouched: false });
ok(无咎.hasFlag('pe_open_shaolin_wujiu_friend'), 'E2 真结算把旗落到了关系旗上');
var 原话 = W.openRouteLabel('shaolin_wujiu', 'friend');
ok(!!原话, 'E3 注账里有「约的原话」：' + JSON.stringify(原话));
var 路Html = W.getPersonalEventButtons(无咎, 'shaolin_wujiu');
ok(路Html.indexOf('已开的路') >= 0, 'E4 对话面板里有一块「已开的路」');
ok(路Html.indexOf('pe_open') < 0 && 路Html.indexOf('friend') >= 0 && 路Html.indexOf(原话.slice(0, 6)) >= 0,
    'E5 那条路的旗值与约的原话都在 HTML 里（旗标落成看得见的字）');
ok(/已开 1 条路/.test(路Html), 'E6 收起状态下标题行也写着「已开 N 条路」（不点开也知道里面有东西）');

// 人脉面板那一侧（常驻卡片）
var 卡面 = W.relationsOpenRoutesHtml(无咎);
ok(卡面.indexOf('已开的路') >= 0 && 卡面.indexOf('friend') >= 0 && 卡面.indexOf(原话.slice(0, 6)) >= 0,
    'E7 人脉面板卡片上同样看得见这条路与约的原话');
var 私人线 = W.relationsPrivateLineHtml(无咎);
ok(私人线.length > 0 && /私人线/.test(私人线), 'E8 人脉面板卡片上写明这条私人线的桩数与进度');

// 整块面板真渲染一次（容器桩 + 真卡片），确认两段都进了 DOM
// （上面 D 段动过别人，这里重造一个已结识的无咎，免得卡面被未结识那版顶掉）
var 无咎卡 = 造NPC('shaolin_wujiu', '无咎', 30, true, '少林寺');
无咎卡.setFlag('pe_open_shaolin_wujiu_friend');
var 容器 = fakeEl('relations-npc-list');
W.document.getElementById = function (id) { return id === 'relations-npc-list' ? 容器 : null; };
W.currentCharData.location = '少林寺';
W.renderRelationsPanel();
var 卡面Html = 容器.innerHTML;
ok(卡面Html.indexOf('open-routes') >= 0 && 卡面Html.indexOf('friend') >= 0,
    'E9 renderRelationsPanel 真渲染出的 HTML 里带着「已开的路」');
ok(卡面Html.indexOf('private-line') >= 0, 'E10 同一张卡上还有私人线进度段');
ok(卡面Html.indexOf('无咎') >= 0, 'E11 卡片本身照旧在（没有为了塞新段把整卡抽掉）');

// ================================================================ F 已接线的 8 面消费端：默认点得到
head('[F] ★已接线的 pe_open_ 消费端 —— 默认态能在清单里点到，不靠概率撞见');
var FOLLOWS = W.NPC_OPEN_ROUTE_FOLLOWS || {};
var 消费事件 = Object.keys(FOLLOWS);
ok(消费事件.length >= 6, 'F1 消费端事件 ' + 消费事件.length + ' 条（8 面旗 / ' + 消费事件.length + ' 桩事件）');

// 「没写这个键」与「写了 true」必须逐字相同——这是玩家不会看到两套 UI 的保证
W.resetPersonalEventFlags();
var 干净人 = 造NPC('shaolin_wujiu', '无咎', 30, true, '少林寺');
W._settings = {};
var 默认态 = W.getPersonalEventButtons(干净人, 'shaolin_wujiu');
W._settings.socialEventPanel = true;
var 写true = W.getPersonalEventButtons(干净人, 'shaolin_wujiu');
ok(默认态 === 写true, 'F2 「没写这个键」与「写了 true」渲染逐字相同（不存在两套 UI）');
W._settings = {};

// 把前置（情缘/同行/来客也上心）全部满足，好感拉满、门内站定，只留「本桩是不是链头」这一条由本桩自己成立
W.detectRivalRomance = function () { return { id: 'rival_x', gender: 'female', name: '某某' }; };
W._jealAllRivals = function () { return [{ id: 'rival_x' }]; };
W._jealHasFeelings = function () { return true; };
W._jealPartySuspects = function () { return true; };
var 逐条 = [];
消费事件.forEach(function (evId) {
    var ev = E[evId];
    if (!ev) { ok(false, 'F3 消费端事件在池里：' + evId); return; }
    // 事件完成标记是全局的一本账：逐条验之前先清干净，否则上一条会把这一条标成「已完成」
    W.resetPersonalEventFlags();
    var 人 = 造NPC(ev.npcId, ev.npcId, 100, true, ev.npcId);
    var 门 = ev.npcId.indexOf('sect_leader_') === 0 ? ev.npcId.slice('sect_leader_'.length) : (人.location || '少林寺');
    W.currentCharData.location = 门;
    W.currentCharData.gender = ev.requirePlayerFemale ? 'female' : 'male';
    W.discipleState = { isInSect: !!ev.requireDisciple, sectId: ev.requireDisciple ? 门 : null };
    人.relationship.affection = 100;
    人.relationship.trust = 60;
    人.memory.firstMet = true; 人.memory.meetCount = 3;
    // 道侣旗：这批消费端里有几桩（j07、tm_event_aftermath）本身要求「需先结为道侣」，
    // 把身份前置摆齐，验的才是「面板给不给入口」这一件事
    if (ev.requireDaoCompanion) 人.setFlag('dao_companion');
    // 把这个人别的桩全标完成 ⇒ 本桩成为链头（这正是「前情已了」的真实状态）
    Object.keys(E).forEach(function (k) {
        var o = E[k];
        if (o && o.npcId === ev.npcId && o.id !== evId) { try { W.markEventTriggered(o.id); } catch (e) {} }
    });
    var h = W.getPersonalEventButtons(人, ev.npcId);
    var 点得到 = h.indexOf("triggerPersonalEvent('" + evId + "')") >= 0;
    逐条.push(evId + (点得到 ? ' ✔' : ' ✘'));
    ok(点得到, 'F3 消费端 ' + evId + '（' + ev.npcId + '）在默认态清单里是可点按钮');
});
console.log('        逐条：' + 逐条.join(' / '));
ok(逐条.every(function (s) { return s.indexOf('✘') < 0; }), 'F4 八面已接线消费端在默认态全部点得到');

// 反证：显式 false（沉浸模式）时清单确实不罗列——这条是玩家自己选的，不是条件不满足
W._settings.socialEventPanel = false;
var 沉浸下面板 = W.getPersonalEventButtons(干净人, 'shaolin_wujiu');
ok(沉浸下面板 === '', 'F5 沉浸模式（显式 false）清单确实不罗列');
W._settings = {};

console.log('\n------------------------------------------');
console.log('通过 ' + passed + ' / 失败 ' + failed);
if (failed > 0) { console.log('本套件红。'); process.exit(1); }
console.log('本套件全绿。');
process.exit(0);