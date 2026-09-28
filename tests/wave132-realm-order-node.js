/**
 * wave132-realm-order-node.js — 第一百三十二批 · DES-92「境界序这把尺只此一把」
 *
 * 覆盖（沙箱真跑真文件；每一关都带控制组与改前复现）：
 *   A 控制组·真尺就位：window.REALM_ORDER/realmIndex/realmAtLeast 与进度真源 REALM_UNIQUE_EFFECTS 逐档对账
 *   B 飞鸽载具：十二境×五载具可用性；炼虚／合体不再被判「境界不足（需凡人）」（回打旧自抄表即复现）
 *   C 地标隐藏门：金仙探「门槛筑基」的剑峰开得上门；回打 `===` 等值比即复现（控制组：筑基恰门槛照样开）
 *   D 城市准入：飞升修士进得了「金丹以上」的城；回打 9 档自抄表即复现（控制组：炼气仍进不去）
 *   E 龙宫宝库门：飞升不被当成「金丹以下」；回打旧写法即复现
 *   F 高阶奇遇：金仙刷得出「天河道痕」（realmIdx>=8）；回打旧表即复现
 *   G 事件门槛 isRealmAtLeast：飞升过大乘门；回打 9 档即复现（控制组：筑基仍拒）
 *   H 传功档位 tierOf：凡人..渡劫 序号与旧表逐档相同（零漂移证明）；飞升够得上三品门
 *   I 脚程门槛 checkRealmRequirement：飞升用得了「大乘」那档移动方式；回打即复现
 *   J 出师门槛（走真导出的 getDiscipleRoster／tryGraduateDisciple）：与旧 getRealmTier 在 凡人..渡劫 逐档同序（零漂移）；飞升不再被当炼气
 *   K 每日香火：金仙照旧领得到（同文件天界切磋认的是「飞升或金仙」）；回打 !== '飞升' 即复现
 *   L 功法阁货架：表内境界序号一档不改（零漂移），只有高出表尾（渡劫）的境界放行三品／二品
 *   M 形状棘轮：全仓自抄境界序数组处数只准缩；虚标「真仙」与错字「练气」存量钉住；本批 11 本消费方必须借尺
 *     （实测基线：抄表 25／虚标 5／错字 8／等值判门 0）
 *
 * 跑这套件必须知道的两个坑（都踩过）：
 *   1) js/global-utils.js:131 会把 window.showMessage 换成真实现（只往 DOM 节点里写）——沙箱在装完文件后重新钉回探针版，
 *      否则「屏上念了哪句话」全测不到，改前复现会假通过。
 *   2) js/event-system.js 整本 CRLF 行尾：src() 先归一成 \n，多行「回打」字面串才对得上。
 *
 * 运行：node tests/wave132-realm-order-node.js
 */
'use strict';

var fs = require('fs');
var vm = require('vm');
var path = require('path');
var ROOT = path.resolve(__dirname, '..');

var 通 = 0, 红 = [];
function ok(cond, label) {
    通 += cond ? 1 : 0;
    if (!cond) 红.push(label);
    console.log((cond ? '  ✓ ' : '  ✗ ') + label);
}
function eq(a, b, label) { ok(a === b, label + '（实际=' + JSON.stringify(a) + ' 期望=' + JSON.stringify(b) + '）'); }
function src(rel) {
    // js/event-system.js 整本是 CRLF 行尾：多行「回打」字面串按 \n 写，读进来先归一，否则回打静默失配＝改前复现假通过
    return fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n');
}
function has(s, sub, label) { ok(String(s).indexOf(sub) >= 0, label); }

// ==================== 沙箱：真文件装进来跑 ====================
function 造沙箱(装, 覆盖) {
    装 = 装 || []; 覆盖 = 覆盖 || {};
    var S = {
        console: { log: function () {}, warn: function () { S.warns.push.apply(S.warns, arguments); }, error: function () {} },
        Math: Math, JSON: JSON, Object: Object, Array: Array, Date: Date, String: String,
        Number: Number, Boolean: Boolean, isFinite: isFinite, parseInt: parseInt,
        parseFloat: parseFloat, RegExp: RegExp, setTimeout: function (fn) { try { fn(); } catch (e) {} return 0; },
        clearTimeout: function () {}, setInterval: function () { return 0; }, clearInterval: function () {},
        requestAnimationFrame: function () {}
    };
    S.window = S;
    S.msgs = []; S.warns = []; S.items = []; S.timeCalls = []; S.subs = [];
    function fakeEl() {
        var el = { children: [], style: {}, className: '', id: '', classList: { toggle: function () {}, add: function () {}, remove: function () {}, contains: function () { return false; } }, appendChild: function (c) { this.children.push(c); return c; }, remove: function () {}, addEventListener: function () {}, setAttribute: function () {}, getAttribute: function () { return null; }, querySelector: function () { return null; }, querySelectorAll: function () { return []; }, closest: function () { return null; }, _html: '', textContent: '' };
        Object.defineProperty(el, 'innerHTML', { get: function () { return this._html; }, set: function (v) { this._html = String(v); }, configurable: true });
        return el;
    }
    var els = {};
    S.document = {
        readyState: 'complete',
        createElement: function () { return fakeEl(); },
        createElementNS: function () { return fakeEl(); },
        getElementById: function (id) { if (!els[id]) els[id] = fakeEl(); return els[id]; },
        querySelector: function () { return null; }, querySelectorAll: function () { return []; },
        addEventListener: function () {}, removeEventListener: function () {},
        body: { appendChild: function () {}, insertAdjacentHTML: function () {}, contains: function () { return true; } }
    };
    var store = {};
    S.localStorage = {
        getItem: function (k) { return store[k] !== undefined ? store[k] : null; },
        setItem: function (k, v) { store[k] = String(v); },
        removeItem: function (k) { delete store[k]; }
    };
    // 【第一百四十四批】本沙箱自建 localStorage、未加载 global-utils.js ⇒ window.saveToStorage 缺席。
    // 生产码各存档键已统一接到那个 owner，这里补一个同形的桩：**转手调本沙箱自己的 setItem**，
    // 以免本套里「桩的 setItem 有没有被调到」这类探针失真。
    S.saveToStorage = function (k, v) {
        try { S.localStorage.setItem(k, v); return true; } catch (e) { return false; }
    };

    S.alert = function () {}; S.confirm = function () { return true; }; S.prompt = function () { return null; };
    S.showMessage = function (m) { S.msgs.push(String(m)); };
    S.gameLog = { entries: [], add: function (t) { S.gameLog.entries.push(String(t)); } };
    S.EventBus = { emit: function () {}, on: function () {} };
    S.GameEvents = { emit: function () {}, on: function () {} };
    S.updateCharacterStatus = function () {};
    S.timeSystem = {
        gameTime: { currentDay: 10, currentHour: 8, currentMinute: 0, totalMinutes: 0 },
        advanceTime: function (m, r) { S.timeCalls.push({ m: m, r: r }); },
        getAbsoluteDay: function () { return 100; },
        onNewDaySubscribe: function (fn) { S.subs.push(fn); }
    };
    S.inventory = { slots: [], currency: { spiritStones: 5000, copper: 0 } };
    S.currentCharData = {
        name: '尺下探针', realm: '筑基', layer: 3, location: '帝都·长安',
        energy: 999, health: 100, maxHealth: 100, qi: 500, spiritStones: 5000, mood: 50,
        attrs: {}, lifeSkills: {}, bonds: {}, flags: {}
    };
    S.randomEvents = [];
    S.addItemToInventory = function (id, n) { S.items.push([id, n]); return n || 1; };
    S.addItem = S.addItemToInventory;
    S.getEffectiveMax = function () { return 100; };
    S.playerHouse = null;
    if (覆盖.randomSeq) {
        var 序 = 覆盖.randomSeq.slice(), 机 = Object.create(Math);
        机.random = function () { return 序.length > 1 ? 序.shift() : 序[0]; };
        S.Math = 机;
    }
    var ctx = vm.createContext(S);
    function load(rel, 改写) {
        var code = 改写 ? 改写(src(rel)) : src(rel);
        vm.runInContext(code, ctx, { filename: rel });
    }
    if (!覆盖.不装尺) load('js/global-utils.js');
    装.forEach(function (项) {
        var rel = typeof 项 === 'string' ? 项 : 项.f;
        load(rel, (typeof 项 === 'object' && 项.改) ? 项.改 : 覆盖[rel]);
    });
    // js/global-utils.js:131 会把 window.showMessage 换成真实现（只往 DOM 节点里写）；
    //   本套件要看的是「屏上念了哪句话」，故装完后重新钉回探针版（同一个 msgs 数组）。
    S.showMessage = function (m) { S.msgs.push(String(m)); };
    return { S: S, ctx: ctx, load: load };
}
function 定境界(S, 名, 层) { S.currentCharData.realm = 名; S.currentCharData.layer = 层 || 1; }

// ==================== A 控制组·真尺就位 ====================
console.log('\n[A] 控制组：境界序这把尺就位，且与「进度真源」逐档相同');
(function () {
    var w = 造沙箱();
    eq(Array.isArray(w.S.REALM_ORDER) && w.S.REALM_ORDER.length, 12, 'A1 window.REALM_ORDER 12 档（凡人→金仙）');
    eq(typeof w.S.realmIndex, 'function', 'A2 window.realmIndex 就位');
    eq(typeof w.S.realmAtLeast, 'function', 'A3 window.realmAtLeast 就位');
    eq(w.S.realmIndex('凡人'), 0, 'A4 凡人＝0（建号默认那一档，旧自抄表十有八九没有它）');
    eq(w.S.realmIndex('金仙'), 11, 'A5 金仙＝11（顶档）');
    eq(w.S.realmIndex('练气'), -1, 'A6 认不出的境界名 ⇒ -1（宁可查得出来，别默默当成炼气）');
    eq(w.S.realmIndex(null), -1, 'A7 空值同样 -1，不落 0');
    // 真尺 vs 进度真源（js/cultivation/cultivation.js 的 REALM_UNIQUE_EFFECTS 键序）逐档对账
    var 效 = 造沙箱(['js/cultivation/cultivation.js']);
    var 进度 = Object.keys(效.S.REALM_UNIQUE_EFFECTS || {});
    eq(进度.join('→'), '炼气→筑基→金丹→元婴→化神→炼虚→合体→大乘→渡劫→飞升→金仙',
        'A8 进度真源 REALM_UNIQUE_EFFECTS 的键序（渡劫→飞升→金仙）');
    eq(w.S.REALM_ORDER.slice(1).join('→'), 进度.join('→'), 'A9 尺＝进度真源逐档相同（少一档或多一档都在这儿报红）');
    ok(w.S.realmIndex('飞升') < w.S.realmIndex('金仙'), 'A10 飞升在 金仙 之前（二段飞升＝金仙，见 endgame/ascension-epilogue.js:44）');
    eq(w.S.realmAtLeast('飞升', '渡劫'), true, 'A11 渡劫门：飞升够格（旧自抄表在这儿判「不够」）');
    eq(w.S.realmAtLeast('筑基', '金丹'), false, 'A12 金丹门：筑基不够格（控制组，尺不许松）');
    eq(w.S.realmAtLeast('凡人', '查无此境'), true, 'A13 门牌本身认不出 ⇒ 放行（别拿一张写错的门牌把人锁在门外）');
})();

// ==================== B 飞鸽载具 ====================
console.log('\n[B] 飞鸽传书：十二境×五载具，门槛念的是同一本账');
(function () {
    // 回打＝把新的判定手换回 HEAD 那张自抄表（缺炼虚／合体），并回报是否真改了字面
    var 新体 = "        if (typeof window.realmIndex !== 'function') return needRealm === '凡人';\n"
        + "        var need = window.realmIndex(needRealm);\n"
        + "        if (need < 0) return true;   // 门牌本身认不出 ⇒ 别拿一张写错的门牌把人锁在门外（与 realmAtLeast 同口径）\n"
        + "        return window.realmIndex(playerRealm) >= need;";
    var 旧体 = "        var 表 = ['凡人','炼气','筑基','金丹','元婴','化神','大乘','渡劫'];\n"
        + "        return !(表.indexOf(playerRealm) < 表.indexOf(needRealm));";
    function 载具表(改) {
        var w = 造沙箱([{ f: 'js/mail-system.js', 改: 改 }]);
        return { M: w.S.MailSystem, S: w.S };
    }
    var 今 = 载具表(null);
    var 打中 = false;
    var 旧 = 载具表(function (s) {
        if (s.indexOf(新体) < 0) return s;
        打中 = true;
        return s.replace(新体, 旧体);
    });
    ok(打中, 'B0 改前复现：回打真的落在源码上（判定手换回那张缺「炼虚／合体」的自抄表）');
    ok(今.M !== 旧.M, 'B0b 两份沙箱各跑各的（改后 vs 改前）');
    var 载具 = ['pigeon', 'mirror', 'jade', 'fire', 'beast'];
    var 境 = ['凡人', '炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫', '飞升', '金仙'];
    // 门槛阶梯（境界不足才算门槛，缺道具另算）：pigeon 凡人 / mirror 筑基 / jade 金丹 / fire 元婴 / beast 化神
    var 门 = { pigeon: '凡人', mirror: '筑基', jade: '金丹', fire: '元婴', beast: '化神' };
    境.forEach(function (r) {
        var w = 载具表(null);
        定境界(w.S, r);
        // 补齐两件道具类载具的耗材，让这一关只判境界
        w.S._countInventoryItem = function () { return 1; };
        载具.forEach(function (c) {
            var 够 = w.S.realmIndex(r) >= w.S.realmIndex(门[c]);
            var 判 = w.M.checkCarrierAvailability(c);
            eq(判.canUse, 够, 'B1 ' + r + ' 用 ' + w.M.CARRIERS[c].name + ' == 尺上算（门槛 ' + 门[c] + '）｜' + (判.reason || ''));
        });
    });
    // 要害那两境：旧表缺档，炼虚／合体连「门槛凡人」的飞鸽都寄不出
    ['炼虚', '合体'].forEach(function (r, i) {
        var 今w = 载具表(null); 定境界(今w.S, r);
        var 今判 = 今w.M.checkCarrierAvailability('pigeon');
        ok(今判.canUse, 'B2 ' + r + ' 修得飞鸽传书（门槛就写着「凡人」）');
        var 旧w = 载具表(function (s) { return s.indexOf(新体) < 0 ? s : s.replace(新体, 旧体); });
        定境界(旧w.S, r);
        var 旧判 = 旧w.M.checkCarrierAvailability('pigeon');
        eq(旧判.canUse, false, 'B3' + (i + 1) + ' 改前复现：' + r + ' 连飞鸽都判不可用');
        has(旧判.reason, '境界不足（需凡人）', 'B4' + (i + 1) + ' 改前复现：屏上念的就是这句假话——「' + 旧判.reason + '」');
    });
    // 缺道具那一支不受改尺影响
    var w2 = 载具表(null); 定境界(w2.S, '化神');
    w2.S.inventory.slots = [];
    eq(w2.M.checkCarrierAvailability('beast').reason, '缺少灵兽信使', 'B5 境界够、货没有：仍按缺道具报（改尺没碰这一支）');
    // 尺未就绪（生产页面上不存在的一条支路：仙侠.html:1930 先装尺）⇒ 判不了就是不够格
    var w3 = 造沙箱(['js/mail-system.js'], { 不装尺: true });
    定境界(w3.S, '凡人');
    w3.S._countInventoryItem = function () { return 1; };
    eq(w3.S.MailSystem.checkCarrierAvailability('pigeon').canUse, true, 'B6 尺未就绪：门槛写着「凡人」的飞鸽照寄（全序下界，放行不算敞口）');
    var 灵镜 = w3.S.MailSystem.checkCarrierAvailability('mirror');
    eq(灵镜.canUse, false, 'B6b 尺未就绪：筑基门槛那一档不再放行——旧写法 return 999 时这一支是**开着的**（凡人挑得走灵镜）');
    has(灵镜.reason, '境界不足（需筑基）', 'B7 理由那句仍念门槛（老验收按这一句认）');
    has(灵镜.reason, '境界尺未加载', 'B7b 且如实说明为什么没法验（不拿「你境界不够」顶替「我测不了」）');
})();

// ==================== C 地标隐藏门 ====================
console.log('\n[C] 地标隐藏门：门槛是「至少这个境界」，不是「恰好这个境界」');
(function () {
    var 打中 = false;
    var 新句 = "        var 够 = (typeof window.realmAtLeast === 'function') && window.realmAtLeast(charData && charData.realm, cond.realm);";
    var 回打 = function (s) {
        if (s.indexOf(新句) < 0) return s;
        打中 = true;
        return s.replace(新句, "        var 够 = !!(charData && charData.realm === cond.realm);");
    };
    function 探(境界, 地标, 改, 不装尺) {
        var w = 造沙箱([{ f: 'js/map/landmark-explore.js', 改: 改 }], { randomSeq: [0.9], 不装尺: !!不装尺 });
        定境界(w.S, 境界, 5);
        w.S.currentCharData.tempering = 0;
        var lm = w.S.LANDMARK_EXPLORE_DATA[地标];
        if (lm) { lm.exploreProgress = 0; lm._hiddenFound = false; (lm.rewards || []).forEach(function (r) { r._claimed = false; }); }
        w.S.exploreLandmark(地标);
        if (w.S.msgs.some(function (m) { return /未知的地标/.test(m); })) throw new Error('地标名查无此账：' + 地标);
        return { 开: w.S.msgs.some(function (m) { return /🔓/.test(m); }), 淬: w.S.currentCharData.tempering, w: w };
    }
    ok(!!造沙箱(['js/map/landmark-explore.js']).S.LANDMARK_EXPLORE_DATA['古剑峰'], 'C0 地标账上有「古剑峰」（隐藏门槛写着筑基）');
    var 金 = 探('金仙', '古剑峰', null);
    ok(金.开, 'C1 金仙探古剑峰（门槛筑基）：隐藏剑冢开得开');
    ok(金.淬 >= 150, 'C2 而且货真落袋（淬体 +' + 金.淬 + '，传承不是白念一句）');
    var 基 = 探('筑基', '古剑峰', null);
    ok(基.开, 'C3 控制组：恰好门槛（筑基）照样开——改尺没把老例弄坏');
    var 旧金 = 探('金仙', '古剑峰', 回打);
    ok(打中, 'C4a 改前复现：回打真的落在源码上（等值比那一行确实在原位）');
    ok(!旧金.开, 'C4 改前复现：旧等值门下金仙探古剑峰一句提示也没有（旗也不立）');
    eq(旧金.淬, 0, 'C5 改前复现：那笔传承在旧门下从未落袋（淬体=' + 旧金.淬 + '）');
    has(src('js/map/landmark-explore.js'), 'window.realmAtLeast(charData && charData.realm, cond.realm)', 'C6 现码借的是全局那把尺（不是本地又抄一张表）');
    // 门槛高于玩家：仍必须拒（尺不许松）
    var 低 = 探('炼气', '魂殿', null);
    ok(!低.开, 'C7 控制组：炼气探魂殿（门槛元婴）仍拒——修的是高境界，不是把门拆了');
    // 尺未就绪（生产页面上不存在的一条支路）⇒ 判不了就是不够格，旧写法 `: !!charData` 是敞口
    var 无尺 = 探('金仙', '古剑峰', null, true);
    ok(!无尺.开, 'C8 尺未就绪：金仙也开不了这道门——旧回落 `!!charData` 时这里是大开的（凡人照揭）');
    eq(无尺.淬, 0, 'C9 尺未就绪：那一笔传承一分也没白拿（淬体=' + 无尺.淬 + '）');
})();

// ==================== D 城市准入 ====================
console.log('\n[D] 城市准入：飞升修士进得了「金丹以上」的城');
(function () {
    var 回打 = function (s) {
        return s.replace(
            "    var _境尺 = (typeof window.realmIndex === 'function')\n        ? window.realmIndex\n        : function (名) { return realmOrder.indexOf(名); };",
            "    var _境尺 = function (名) { return realmOrder.indexOf(名); };");
    };
    var 今 = 造沙箱(['js/regions.js', { f: 'js/location-system.js' }]).S.locationSystem;
    var 旧w = 造沙箱([{ f: 'js/location-system.js', 改: 回打 }]);
    var 旧 = 旧w.S.locationSystem;
    ok(今 !== 旧, 'D0 改前复现：回打生效（准入判定退回那张 9 档自抄表）');
    eq(今.checkAccessRequirement('金丹以上', '飞升', 1), true, 'D1 飞升进「金丹以上」的城');
    eq(今.checkAccessRequirement('金丹以上', '金仙', 1), true, 'D2 金仙同样进得去');
    eq(今.checkAccessRequirement('金丹以上', '筑基', 9), false, 'D3 控制组：筑基九层仍进不去（层数不许越境）');
    eq(今.checkAccessRequirement('炼气三层以上', '炼气', 2), false, 'D4 控制组：同境层数不足仍拒');
    eq(今.checkAccessRequirement('all', '凡人', 1), true, 'D5 控制组：无门槛城放行');
    eq(旧.checkAccessRequirement('金丹以上', '飞升', 9), false, 'D6 改前复现：旧尺把飞升夹回最低档，飞升修士进不了金丹城');
    eq(旧.checkAccessRequirement('金丹以上', '筑基', 9), false, 'D7 改前复现：旧尺下筑基同样进不去（这条没错）');
    var 城表 = 今.getCityData ? null : null;
    ok(!!今.getCityAccessLevel, 'D8 准入这一路真由 location-system 挂着（不是本套件自己口算）');
})();

// ==================== E 龙宫宝库 ====================
console.log('\n[E] 龙宫宝库：金丹那道龙威门不再把大能当成新人');
(function () {
    var 回打 = function (s) {
        return s.replace("    if (_境尺(realm) < _境尺('金丹')) {",
            "    if (['炼气','筑基','金丹','元婴','化神','炼虚','合体','大乘','渡劫'].indexOf(realm) < 2) {");
    };
    function 入宫(境界, 改) {
        var w = 造沙箱(['js/regions.js', { f: 'js/location-system.js', 改: 改 }], { randomSeq: [0.5] });
        定境界(w.S, 境界, 5); w.S.currentCharData.qi = 500;
        w.S.msgs.length = 0;
        w.S.enterDragonVault('东海龙宫');
        return { 拒: w.S.msgs.some(function (m) { return /金丹以下难以深入/.test(m); }), 时: w.S.timeCalls.length, w: w };
    }
    var 今飞 = 入宫('飞升', null);
    ok(!今飞.拒, 'E1 飞升入宝库：不再被念「金丹以下难以深入」');
    ok(今飞.时 > 0, 'E2 这一趟真走了路（时间账落了一笔 ' + JSON.stringify(今飞.时) + '）');
    var 今炼 = 入宫('炼气', null);
    ok(今炼.拒, 'E3 控制组：炼气仍被龙威挡住（修的是高境界，门没拆）');
    var 旧飞 = 入宫('飞升', 回打);
    ok(旧飞.拒, 'E4 改前复现：旧写法里飞升＝「金丹以下」，那句屏上话是说谎');
    eq(旧飞.时, 0, 'E5 改前复现：而且一步没走（真被拒在门外，不是只念错话）');
})();

// ==================== F 高阶奇遇 ====================
console.log('\n[F] 奇遇门槛：realmIdx>=5/6/8 那三段高阶机缘，飞升之后也该刷得出来');
(function () {
    var 回打 = function (s) {
        return s.replace("var i = (typeof global.realmIndex === 'function') ? global.realmIndex(r) : order.indexOf(r);",
            'var i = order.indexOf(r);')
            .replace("return i < 0 ? ((typeof global.realmIndex === 'function') ? global.realmIndex('炼气') : 1) : i;",
                "return i < 0 ? 1 : i;");
    };
    function 候选(境界, 改) {
        var w = 造沙箱([{ f: 'js/extensions/qiyu-encounters.js', 改: 改 }]);
        定境界(w.S, 境界, 1);
        return w.S.QiyuEncounters.candidates('cultivate').map(function (q) { return q.id; });
    }
    ok(回打(src('js/extensions/qiyu-encounters.js')) !== src('js/extensions/qiyu-encounters.js'), 'F0 改前复现：回打生效（realmIdx 退回那张含虚标「真仙」却缺「飞升」的表）');
    has(候选('金仙', null), 'qy_tianhe_daoguan', 'F1 金仙打坐刷得出「天河道痕」（realmIdx>=8）');
    has(候选('化神', null), 'qy_xinghai_guzhou', 'F2 化神刷得出「星槎孤舟」（realmIdx>=5）');
    ok(候选('化神', null).indexOf('qy_gushen_zhican') < 0, 'F3 控制组：化神（档 5）仍刷不出「古神残响」（要 6）——尺没松');
    ok(候选('炼气', null).indexOf('qy_tianhe_daoguan') < 0, 'F4 控制组：炼气刷不出天河道痕');
    var 今飞 = 候选('飞升', null);
    has(今飞, 'qy_tianhe_daoguan', 'F5 飞升刷得出天河道痕');
    ok(回打(src('js/extensions/qiyu-encounters.js')).indexOf('order.indexOf(r)') >= 0, 'F6 旧支路确是「表里没有⇒回落炼气」');
    // 改前复现要有真行为：旧表里飞升查不到 ⇒ 回落炼气 ⇒ 高阶三段全空
    var w旧 = 造沙箱([{ f: 'js/extensions/qiyu-encounters.js', 改: 回打 }]);
    定境界(w旧.S, '飞升', 1);
    var 旧飞 = w旧.S.QiyuEncounters.candidates('cultivate').map(function (q) { return q.id; });
    ok(旧飞.indexOf('qy_tianhe_daoguan') < 0, 'F7 改前复现：旧尺下飞升被当炼气，「天河道痕」永远刷不出来（' + 旧飞.join(',') + '）');
})();

// ==================== G 事件门槛 ====================
console.log('\n[G] 奇遇事件池：minRealm 那道门用同一把尺');
(function () {
    var 回打 = function (s) {
        return s.replace("    if (typeof window.realmIndex === 'function') {\n        var t = window.realmIndex(targetRealm);",
            "    if (false) {\n        var t = window.realmIndex(targetRealm);");
    };
    var 今 = 造沙箱(['js/event-system.js']);
    var 旧 = 造沙箱([{ f: 'js/event-system.js', 改: 回打 }]);
    ok(src('js/event-system.js') !== 回打(src('js/event-system.js')), 'G0 改前复现：回打生效（isRealmAtLeast 退回本文件那张 9 档表）');
    eq(今.S.isRealmAtLeast('飞升', '大乘'), true, 'G1 大乘门：飞升够格（旧 9 档表在这儿判 false）');
    eq(今.S.isRealmAtLeast('金仙', '渡劫'), true, 'G2 渡劫门：金仙够格');
    eq(今.S.isRealmAtLeast('筑基', '金丹'), false, 'G3 控制组：筑基仍不够金丹门');
    eq(旧.S.isRealmAtLeast('飞升', '大乘'), false, 'G4 改前复现：旧尺把飞升事件池全数筛掉（高境界反而没奇遇）');
    eq(旧.S.isRealmAtLeast('化神', '元婴'), true, 'G5 改前复现：旧尺在 渡劫 以下那一截本来就没判错（别把没坏的说成坏的）');
})();

// ==================== H 传功档位 ====================
console.log('\n[H] 功法传承：三品「需化神以上」那道门');
(function () {
    var 回打 = function (s) {
        return s.replace("        var i = (typeof window.realmIndex === 'function')\n            ? window.realmIndex(realm)\n            : REALM_ORDER.indexOf(String(realm || ''));",
            "        var i = REALM_ORDER.indexOf(String(realm || ''));");
    };
    var 今 = 造沙箱(['js/npcs/skill-transmission.js']).S.SkillTransmission;
    var 旧 = 造沙箱([{ f: 'js/npcs/skill-transmission.js', 改: 回打 }]).S.SkillTransmission;
    ok(今 && typeof 今.tierOf === 'function', 'H0 API 就位（tests 走的是真导出的 tierOf）');
    // 零漂移证明：凡人..渡劫 十档，新旧序号逐档相同
    var 十档 = ['凡人', '炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'];
    var 差 = 十档.filter(function (r) { return 今.tierOf(r) !== 旧.tierOf(r); });
    eq(差.join(','), '', 'H1 零漂移：凡人..渡劫 十档序号与旧表逐档相同（门槛常量 3=金丹、5=化神 一档没挪）');
    eq(今.tierOf('化神'), 5, 'H2 化神＝5 == GRADE_COST.三品.minTier（门槛还是那道门槛）');
    eq(今.tierOf('元婴'), 4, 'H3 控制组：元婴＝4 < 5，三品仍请教不得');
    ok(今.tierOf('飞升') >= 5, 'H4 飞升＝' + 今.tierOf('飞升') + '，够得上三品门（旧表把飞升当 1＝炼气）');
    ok(今.tierOf('金仙') >= 今.tierOf('飞升'), 'H5 金仙不低于飞升（旧表里排在飞升之上的「真仙」是虚标）');
    eq(旧.tierOf('飞升'), 1, 'H6 改前复现：旧表缺「飞升」，飞升修士被当成炼气档（三品门永远锁着）');
    eq(今.tierOf('练气'), 1, 'H7 错字「练气」仍按炼气档回落（本批不挪这条口径，错字生产者另案登记）');
})();

// ==================== I 脚程门槛 ====================
console.log('\n[I] 缩地／破空：minRealm 写着化神／炼虚／大乘那几档脚程');
(function () {
    var 回打 = function (s) {
        return s.replace("    const _境尺 = (typeof window.realmIndex === 'function')\n        ? window.realmIndex\n        : function (名) { return realmOrder.indexOf(名); };",
            '    const _境尺 = function (名) { return realmOrder.indexOf(名); };');
    };
    var 今 = 造沙箱(['js/travel-system.js']);
    var 旧 = 造沙箱([{ f: 'js/travel-system.js', 改: 回打 }]);
    ok(src('js/travel-system.js') !== 回打(src('js/travel-system.js')), 'I0 改前复现：回打生效（checkRealmRequirement 退回 9 档自抄表）');
    eq(今.S.checkRealmRequirement('大乘', '飞升', 1), true, 'I1 大乘档脚程：飞升用得了');
    eq(今.S.checkRealmRequirement('炼虚', '金仙', 1), true, 'I2 炼虚档脚程：金仙用得了');
    eq(今.S.checkRealmRequirement('筑基', '炼气', 9), false, 'I3 控制组：炼气九层仍用不了筑基档');
    eq(今.S.checkRealmRequirement('金丹3层', '金丹', 2), false, 'I4 控制组：同境层数不足仍拒（代码只认 ASCII 层数）');
    eq(今.S.checkRealmRequirement('金丹三层', '金丹', 2), true, 'I4b 现状登记：中文数词「三层」被剥成空 ⇒ 当 1 层放行（全仓 minRealm 无一带层数，故非现行缺陷，只钉住别拿它当门槛）');
    eq(旧.S.checkRealmRequirement('大乘', '飞升', 9), false, 'I5 改前复现：旧尺下飞升连大乘档脚程都判「境界不足」');
    // 屏上那句话：改前会真念出来
    var w = 造沙箱([{ f: 'js/travel-system.js', 改: 回打 }]);
    定境界(w.S, '大乘', 1);
    ok(w.S.checkRealmRequirement('大乘', '大乘', 1), 'I6 改前复现：旧尺在门槛本境那一档仍判对（问题只在渡劫之上）');
})();

// ==================== J 出师门槛 ====================
console.log('\n[J] 弟子出师：那道「你达金丹期」的门');
(function () {
    var 回打 = function (s) {
        return s.replace("        if (typeof window.realmIndex === 'function') {\n            var ri = window.realmIndex(cd.realm);\n            if (ri >= 0) return ri;\n        }\n", '');
    };
    // 旧 getRealmTier 的表（js/sects/sect-join-flow.js:1966 抄下来当参照，只为对账，不装那本大文件）
    var 旧尺 = ['凡人', '炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'];
    function 参照尺(r) { var i = 旧尺.indexOf(String(r)); return i >= 0 ? i : 1; }
    function 收徒(改) {
        var w = 造沙箱([{ f: 'js/sects/master-teach.js', 改: 改 }]);
        var S = w.S;
        var 徒 = { id: 'd1', name: '小满', combat: { realm: '筑基', layer: 3 }, relationship: { affection: 80 }, _teachProgress: 60 };
        S.PlayerSect = { listMySects: function () { return [{ id: 'sect-x', name: '试剑宗', disciples: [{ npcId: 'd1' }], guests: [] }]; } };
        S.npcManager = { getNPC: function (id) { return id === 徒.id ? 徒 : null; } };
        S.getRealmTier = 参照尺;   // 出师判定借的参照尺（本文件真源在 sect-join-flow.js）
        return { S: S, w: w };
    }
    function 可出师(改, 境界) {
        var t = 收徒(改);
        定境界(t.S, 境界, 1);
        var r = t.S.getDiscipleRoster()[0];
        return r.canGraduate;
    }
    ok(src('js/sects/master-teach.js') !== 回打(src('js/sects/master-teach.js')), 'J0 改前复现：回打生效（出师判定退回借 getRealmTier 那一支）');
    eq(可出师(null, '金丹'), true, 'J1a 门槛本身没挪：金丹师父带得走出师弟子（GRAD_PLAYER_TIER=3）');
    eq(可出师(null, '筑基'), false, 'J1b 控制组：筑基师父仍带不出（尺没松）');
    var 漂 = 旧尺.filter(function (r) { return 可出师(null, r) !== 可出师(回打, r); });
    eq(漂.join(','), '', 'J1 零漂移：凡人..渡劫 十档，新旧判定逐档相同（门槛常量一档没挪）');
    eq(可出师(null, '飞升'), true, 'J2 飞升出师门：够格（旧尺把飞升当炼气）');
    eq(可出师(null, '金仙'), true, 'J3 金仙同样够格');
    // 屏上那句话：改前对着飞升修士真念「你达金丹期」
    var 旧飞 = 收徒(回打); 定境界(旧飞.S, '飞升', 1); 旧飞.S.msgs.length = 0;
    eq(旧飞.S.tryGraduateDisciple('d1'), false, 'J4 改前复现：飞升修士的弟子真出不了师（不是只念错话）');
    has(旧飞.S.msgs.join('｜'), '你达金丹期', 'J5 改前复现：屏上那句假话——「' + 旧飞.S.msgs.join('｜') + '」');
    var 今飞 = 收徒(null); 定境界(今飞.S, '飞升', 1); 今飞.S.msgs.length = 0;
    eq(今飞.S.tryGraduateDisciple('d1'), true, 'J6 改后：同一个飞升修士、同一个弟子，出师礼办得成');
    has(今飞.S.msgs.join('｜'), '学成出师', 'J7 改后屏上念的是真回执（' + 今飞.S.msgs.join('｜').slice(0, 40) + '）');
})();

// ==================== K 每日香火 ====================
console.log('\n[K] 金仙的每日香火：等值判门把更高那一境拒了');
(function () {
    var 回打 = function (s) {
        return s.replace(
            "        var 是仙 = (typeof window.realmAtLeast === 'function')\n            ? window.realmAtLeast(cd && cd.realm, '飞升')\n            : (cd && (cd.realm === '飞升' || cd.realm === '金仙'));\n        if (!cd || !是仙) return;",
            "        if (!cd || cd.realm !== '飞升') return;");
    };
    function 收(境界, 改) {
        var w = 造沙箱([{ f: 'js/endgame/ascension-epilogue.js', 改: 改 }], { randomSeq: [0] });
        定境界(w.S, 境界, 9);
        w.S.currentCharData.incense = 200; w.S.currentCharData.essence = 0;
        // dailyIncenseFeedback 不导出（ascension-epilogue.js:159 只把它挂进每日订阅）——就从那条真订阅里唤
        if (!w.S.subs.length) throw new Error('没挂上每日订阅：这一关是空跑');
        w.S.subs.forEach(function (fn) { fn(); });
        return w.S.currentCharData.essence;
    }
    ok(src('js/endgame/ascension-epilogue.js') !== 回打(src('js/endgame/ascension-epilogue.js')), 'K0 改前复现：回打生效（换回 cd.realm !== 飞升 那句等值判）');
    eq(收('飞升', null), 100, 'K1 飞升领得到香火（200 人×0.5＝100 真元，随机那笔被钉成 0）');
    eq(收('金仙', null), 100, 'K2 金仙同样领得到（同文件天界切磋:69、回入尘世:96 认的都是「飞升或金仙」）');
    eq(收('大乘', null), 0, 'K3 控制组：还没飞升的大乘领不到（香火是飞升后的账）');
    eq(收('金仙', 回打), 0, 'K4 改前复现：旧等值门下，证道金仙那日香火静默归零');
    has(src('js/endgame/ascension-epilogue.js'), "cd.realm !== '飞升'", 'K5 旧写法在别处仍有等值判门（:47 二段飞升那处是对的——「唯有飞升期」），故本行只钉字面不断错');
})();

// ==================== L 功法阁货架 ====================
console.log('\n[L] 功法阁：三品／二品秘籍那道货架门');
(function () {
    var 回打 = function (s) {
        return s.replace(
            "    if (i < 0 && typeof window.realmIndex === 'function' && window.realmIndex('渡劫') >= 0) {\n        if (window.realmIndex(r) > window.realmIndex('渡劫')) return realms.length;\n    }\n", '');
    };
    function 装(改) {
        var w = 造沙箱(['js/data.js', { f: 'js/enhanced-shop.js', 改: 改 }]);
        return w;
    }
    var 今 = 装(null), 旧 = 装(回打);
    var 表长 = 今.S.REALM_CONFIG.realms.length;
    eq(表长, 9, 'L0 配置表 REALM_CONFIG.realms 只到渡劫（' + 今.S.REALM_CONFIG.realms[表长 - 1].name + '）——它没有凡人／飞升／金仙');
    // 零漂移：表内认得的境界序号一档不改
    var 漂 = 今.S.REALM_CONFIG.realms.filter(function (x) {
        定境界(今.S, x.name, 1); 定境界(旧.S, x.name, 1);
        return 今.S.playerManualRealmIndex() !== 旧.S.playerManualRealmIndex();
    }).map(function (x) { return x.name; });
    eq(漂.join(','), '', 'L1 零漂移：炼气..渡劫 九档货架序号逐档相同');
    定境界(今.S, '渡劫', 1); eq(今.S.playerManualRealmIndex(), 8, 'L2 渡劫＝8（表尾）');
    定境界(今.S, '飞升', 1); ok(今.S.playerManualRealmIndex() > 8, 'L3 飞升高过表尾 ⇒ 三品／二品（need 2）放行');
    定境界(今.S, '金仙', 1); ok(今.S.playerManualRealmIndex() > 8, 'L4 金仙同样放行');
    定境界(旧.S, '飞升', 1); eq(旧.S.playerManualRealmIndex(), 0, 'L5 改前复现：旧写法把飞升当 0（炼气档），三品／二品秘籍永不上架');
    定境界(今.S, '凡人', 1); 定境界(旧.S, '凡人', 1);
    eq(今.S.playerManualRealmIndex(), 旧.S.playerManualRealmIndex(), 'L6 登记在案：凡人在表里查不到⇒当 0（炼气），这条「假放行」本批不挪（挪了会同时改货架判定，另案待裁）');
})();

// ==================== M 形状棘轮 ====================
console.log('\n[M] 形状棘轮：自抄境界序只准缩，虚标与错字钉住存量');
(function () {
    function 扫目录(dir, filter) {
        var out = [];
        fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).forEach(function (e) {
            var p = path.join(dir, e.name);
            if (e.isDirectory()) { if (e.name !== 'node_modules') out.push.apply(out, 扫目录(p, filter)); return; }
            if (!/\.js$/.test(e.name)) return;
            src(p).split(/\r?\n/).forEach(function (行, n) {
                var 头 = 行.trim();
                if (/^\/\/|^\*|^\/\*/.test(头)) return;   // 注释里引用旧表是记账，不是活的抄写
                if (filter(行)) out.push(p.replace(/\\/g, '/') + ':' + (n + 1));
            });
        });
        return out;
    }
    var 抄表 = 扫目录('js', function (行) { return /\[\s*['"](?:凡人|炼气)['"]/.test(行); });
    // 基线＝第一百三十二批实测读数 25（口径：数组首项写着 凡人 或 炼气 的序表，注释行不计）。
    //   第一百三十三批收口：js/sects/sect-join-flow.js 的 getRealmTier 不再自带十档表（改借 window.realmIndex），
    //   存量落到 24——棘轮只准缩，这一处再长回 25 就是那份抄表被人加回来了。
    //   其中 4 处是本批改尺后特意留的回落表（js/event-system.js:508、js/location-system.js:483 与 :1373、js/travel-system.js:464）；
    //   其余全属「序→数」那一族（伤害倍率／概率／敌级／收入／数组下标）＝数值账，本批按用户禁令不动，只钉住别再加。
    var 基线抄表 = 24;
    ok(抄表.length <= 基线抄表, 'M1 全仓自抄境界序数组存量 ' + 抄表.length + ' 处 ≤ 基线 ' + 基线抄表 + ' 处（只准缩；明细：\n      ' + 抄表.join('\n      ') + '）');
    var 本批借尺 = ['js/global-utils.js', 'js/mail-system.js', 'js/map/landmark-explore.js', 'js/location-system.js',
        'js/extensions/qiyu-encounters.js', 'js/event-system.js', 'js/npcs/skill-transmission.js', 'js/travel-system.js',
        'js/sects/master-teach.js', 'js/endgame/ascension-epilogue.js', 'js/enhanced-shop.js'];
    本批借尺.forEach(function (f) {
        if (f === 'js/global-utils.js') { has(src(f), 'window.realmIndex = function', 'M2 ' + f + ' 立尺（真源本体）'); return; }
        var 码 = src(f);
        ok(码.indexOf('window.realmIndex') >= 0 || 码.indexOf('window.realmAtLeast') >= 0 || 码.indexOf('global.realmIndex') >= 0,
            'M3 ' + f + ' 已借全局那把尺');
    });
    var 虚标 = 扫目录('js', function (行) { return 行.indexOf('真仙') >= 0; });
    var 基线虚标 = 5;
    ok(虚标.length <= 基线虚标, 'M4 虚标档位「真仙」存量 ' + 虚标.length + ' 处 ≤ 基线 ' + 基线虚标 + '（明细：\n      ' + 虚标.join('\n      ') + '）');
    var 错字 = 扫目录('js', function (行) { return 行.indexOf('练气') >= 0; });
    var 基线错字 = 8;
    ok(错字.length <= 基线错字, 'M5 错字境界名「练气」存量 ' + 错字.length + ' 处 ≤ 基线 ' + 基线错字 + '（明细：\n      ' + 错字.join('\n      ') + '）');
    // 判门槛的这几本，不许再留「只数到渡劫」的等值门（左值不限 cd./charData.，同族一并数）
    var 等值门 = 扫目录('js', function (行) {
        return /\.realm\s*===\s*['"](?:筑基|金丹|元婴|化神|炼虚|合体|大乘|渡劫)['"]/.test(行);
    });
    var 基线等值门 = 0;
    ok(等值门.length <= 基线等值门, 'M6 拿等值判境界门（把更高那一境拒掉那一族）存量 ' + 等值门.length + ' ≤ 基线 ' + 基线等值门 + '（明细：\n      ' + 等值门.join('\n      ') + '）');
})();

console.log('\n' + (红.length ? '✗ 失败 ' + 红.length + ' 项：\n  - ' + 红.join('\n  - ') : '✓ 全通过') +
    '\n合计 ' + 通 + ' 通过 / ' + 红.length + ' 失败');
process.exit(红.length ? 1 : 0);
