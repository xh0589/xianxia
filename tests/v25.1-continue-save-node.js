/**
 * tests/v25.1-continue-save-node.js — v25.1「存档标脏/任务系统/商店引导」簇回归
 *
 * 钉住四件事：
 *   [A] P1 续档标脏：零时辰变更（建号/接任务/拜师/得宝/合成/突破/通关/受赏）不再漏出订阅表；
 *       acceptQuest 成功路径补发 quest:accepted + 防御式 markDirty；
 *       HUD「尚未落档（点此保存）」——已建号但这一世从未落过档时说真话、可点击走 saveGame 正门。
 *   [B] P24/试-07 game-state.js 半边：discipleState 重置结构补 isInSect/sectId、去死字段 position；
 *       serializeInventorySlots 与读档还原对称补 enhancementLevel/refineLevel/enchantType/armorDurability。
 *   [C] P2/P18 文案：main_001 描述直指「地图→地区列表→门派」页签；quest-system.js 代码里「赏格」绝迹。
 *   [D] 试-18/试-26：Shop.buyItem 与 TradeService.executeSell 各有一处 codexHint('tut_first_trade')；
 *       codex-tutorial.js 引导文案不再指向不存在的「外出历练/战斗/闭关」按钮。
 *
 * 手法照抄 tests/v24.0-audit-fixes-node.js [F] 段与 tests/wave140-quest-event-bridge-node.js：
 * 真源码装进沙箱真跑 + 源码文本哨兵。运行：node tests/v25.1-continue-save-node.js
 */
'use strict';

var fs = require('fs');
var vm = require('vm');
var path = require('path');
var ROOT = path.resolve(__dirname, '..');

var passed = 0, failed = 0;
function ok(c, m) { if (c) { passed++; console.log('  ✓ ' + m); } else { failed++; console.error('  [FAIL] ' + m); } }
function eq(a, b, m) { ok(a === b, m + '（实际=' + JSON.stringify(a) + ' 期望=' + JSON.stringify(b) + '）'); }
function src(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
function load(rel) { vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel }); }
// 剥行注释（不动字符串里的 `://`）——文本哨兵先过这一道，免得注释里引用旧病根的行自己判红
function codeOnly(t) { return t.replace(/(^|[^:])\/\/[^\n]*/g, '$1'); }

console.log('\n========== v25.1 存档标脏/任务/商店引导 簇回归 ==========');

// ============ [A1] continue-save.js 订阅表（文本哨兵） ============
console.log('\n[A1] continue-save.js 订阅表扩充');
(function () {
    var cs = codeOnly(src('js/core/continue-save.js'));
    ['quest:accepted', 'sect:joined', 'item:obtained', 'item:crafted',
     'cultivation:breakthrough', 'cultivation:completed', 'dungeon:completed', 'reward:applied'
    ].forEach(function (name) {
        ok(cs.indexOf("B.on('" + name + "'") >= 0, '订阅了 ' + name);
    });
    ok(/function markDirty/.test(cs) && /renderHud\(\);/.test(cs), 'markDirty 当场刷 HUD（外部调用方不必自己再喊）');
    ok(cs.indexOf('尚未落档') >= 0, 'HUD 有「尚未落档」分支');
    ok(/global\.ContinueSave = \{[\s\S]*markDirty: markDirty/.test(cs), 'ContinueSave.markDirty 挂在全局可被 app.js startGame 调用');
    ok(!/setInterval|setTimeout/.test(cs), '老纪律不破：落档不借现实定时器');
    ok(!/localStorage\.(setItem|removeItem)/.test(cs), '老纪律不破：快照不自己写盘');
})();

// ============ [A2] acceptQuest 补发事件 + 标脏（沙箱真跑） ============
console.log('\n[A2] acceptQuest → quest:accepted + ContinueSave.markDirty');
(function () {
    var qsSrc = src('js/quest/quest-system.js');
    ok(qsSrc.indexOf("emit('quest:accepted'") >= 0, 'quest-system.js 有 quest:accepted 发射点（源码哨兵）');
    ok(/if \(window\.ContinueSave && ContinueSave\.markDirty\) ContinueSave\.markDirty\(\);/.test(qsSrc),
        'acceptQuest 成功路径有防御式 markDirty（源码哨兵）');

    // —— 沙箱真跑（手法同 wave140）——
    var listeners = {};
    var 账 = {};
    var markDirtyCalls = 0;
    function 宽松() {
        var o = {
            innerHTML: '', textContent: '', className: '', value: '', id: '', href: '',
            style: new Proxy({}, { get: function () { return ''; }, set: function () { return true; } }),
            dataset: new Proxy({}, { get: function () { return ''; }, set: function () { return true; } }),
            classList: { add: function () {}, remove: function () {}, toggle: function () {}, contains: function () { return false; } },
            children: [], childNodes: [], firstChild: null, lastChild: null, parentNode: null,
            appendChild: function () {}, removeChild: function () {}, insertBefore: function () {}, replaceChild: function () {},
            remove: function () {}, setAttribute: function () {}, getAttribute: function () { return null; }, removeAttribute: function () {},
            addEventListener: function () {}, removeEventListener: function () {}, dispatchEvent: function () {},
            querySelector: function () { return 宽松(); }, querySelectorAll: function () { return []; }, closest: function () { return null; },
            getBoundingClientRect: function () { return { top: 0, left: 0, width: 0, height: 0 }; },
            scrollIntoView: function () {}, focus: function () {}, blur: function () {}, click: function () {}
        };
        return o;
    }
    var 沙 = {
        console: { log: function () {}, warn: function () {}, error: function () {} },
        setTimeout: setTimeout, clearTimeout: clearTimeout,
        localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
        showMessage: function () {},
        ContinueSave: { markDirty: function () { markDirtyCalls++; } }
    };
    沙.saveToStorage = function (k, v) { try { this.localStorage.setItem(k, v); return true; } catch (e) { return false; } };
    沙.window = 沙; 沙.globalThis = 沙; 沙.global = 沙;
    沙.document = {
        getElementById: function () { return 宽松(); },
        querySelector: function () { return 宽松(); },
        querySelectorAll: function () { return []; },
        createElement: function () { return 宽松(); },
        createDocumentFragment: function () { return 宽松(); },
        body: 宽松(), documentElement: 宽松(),
        addEventListener: function () {}, removeEventListener: function () {}
    };
    沙.EventBus = {
        on: function (type, fn) { (listeners[type] = listeners[type] || []).push(fn); },
        emit: function (type, data) { (listeners[type] || []).forEach(function (fn) { fn(data); }); }
    };
    vm.createContext(沙);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/quest/quest-system.js'), 'utf8'), 沙, { filename: 'js/quest/quest-system.js' });
    // 推进之后的下游渲染不许说话（同 wave140 的教训：渲染炸了会误判成「桥没干活」）
    vm.runInContext('updateQuestUI = function () {}; updateQuestTracker = function () {};' +
        'updateMainQuestUI = function () {}; updateDailyQuestUI = function () {};' +
        'updateRandomQuestUI = function () {}; updateNpcQuestUI = function () {};', 沙);

    // 自己支一个 quest:accepted 的耳朵，验证 acceptQuest 真发
    var accepted = [];
    沙.EventBus.on('quest:accepted', function (d) { accepted.push(d); });

    沙.QuestRegistry.register({ id: 'v251_t1', title: '测试题', type: 'main', objectives: [], accepted: false, completed: false, turnedIn: false });
    var r = 沙.acceptQuest('v251_t1');
    eq(r, true, 'acceptQuest 成功返回 true');
    eq(accepted.length, 1, 'quest:accepted 事件发出来了（continue-save 订阅的就是它）');
    ok(accepted[0] && accepted[0].questId === 'v251_t1', '事件负载带 questId');
    ok(markDirtyCalls >= 1, 'ContinueSave.markDirty 被防御式调用');
    // 重复接取不再发事件（失败路径不该标脏）
    accepted.length = 0; markDirtyCalls = 0;
    eq(沙.acceptQuest('v251_t1'), false, '重复接取被拦');
    eq(accepted.length, 0, '失败路径不发 quest:accepted');
    eq(markDirtyCalls, 0, '失败路径不标脏');
})();

// ============ [A3] continue-save 行为桩：尚未落档 HUD + 零时辰事件标脏 ============
console.log('\n[A3] 行为桩：建号未落档说真话；quest:accepted/sect:joined 真标脏');
(function () {
    var bus = { h: {} };
    global.EventBus = {
        on: function (n, f) { (bus.h[n] = bus.h[n] || []).push(f); return function () {}; },
        emit: function (n, d) { (bus.h[n] || []).forEach(function (f) { f(d); }); return this; }
    };
    function fire(n, d) { (bus.h[n] || []).forEach(function (f) { f(d); }); }
    var unload = null;
    global.addEventListener = function (n, f) { if (n === 'beforeunload') unload = f; };
    var hud = {
        className: '', textContent: '', _click: null,
        addEventListener: function (n, f) { if (n === 'click') this._click = f; }
    };
    global.document = { getElementById: function (id) { return id === 'continue-save-state' ? hud : null; }, addEventListener: function () {} };
    global.currentCharData = { name: '新号', gender: '男' };   // 模拟建号完成

    var writes = [];
    var failWrite = false;
    global.saveGame = function (opts) {
        opts = opts || {};
        writes.push(opts);
        if (failWrite) { global.ContinueSave.onSaved(0); return null; }
        global.ContinueSave.onSaved(Date.now());
        return {};
    };

    load('js/core/continue-save.js');
    var CS = global.ContinueSave;

    // 订阅表：零时辰事件都订到
    ['quest:accepted', 'sect:joined', 'item:obtained', 'item:crafted',
     'cultivation:breakthrough', 'cultivation:completed', 'dungeon:completed', 'reward:applied'
    ].forEach(function (n) {
        ok((bus.h[n] || []).length === 1, '运行时订阅了 ' + n + '（且只挂一次）');
    });

    // —— 建号后不发四事件、也没落过档：HUD 必须说「尚未落档」，可点 ——
    eq(CS.isDirty(), false, '建号即刷新场景：没事件就没标脏（正是旧版丢档的根因）');
    CS.renderHud();
    ok(hud.textContent.indexOf('尚未落档') >= 0, 'HUD 显示「● 尚未落档（点此保存）」');
    ok(hud.className.indexOf('cursor-pointer') >= 0, '「尚未落档」可点击');
    ok(typeof hud._click === 'function', 'HUD 点击处理挂上了');
    writes.length = 0;
    hud._click();                                   // 玩家点「点此保存」
    eq(writes.length, 1, '点击走 saveGame 正门落了一笔');
    ok(!writes[0].autoMode, '点出来的是手动档（不占 autoMode 口径）');
    eq(CS.everSaved(), true, '落过一次，everSaved 置真');
    CS.renderHud();
    ok(hud.textContent.indexOf('已落档') >= 0, '落过档后恢复「✓ 已落档」现行逻辑');

    // —— 零时辰事件真标脏：写盘失败时红点不撒手 ——
    failWrite = true;
    CS.onLoaded(); writes.length = 0;
    fire('quest:accepted', { questId: 'main_001' });
    eq(CS.isDirty(), true, 'quest:accepted → _dirty（写盘失败红点不撒手）');
    ok(hud.textContent.indexOf('未存档') >= 0, 'HUD 亮起「● 未存档」');
    ok(typeof unload({}) === 'string', '此刻关页会被拦（不再静默丢角色）');
    CS.onLoaded(); writes.length = 0;
    fire('sect:joined', { sectId: '少林寺' });
    eq(CS.isDirty(), true, 'sect:joined → _dirty');
    failWrite = false;

    // —— 写盘通畅时：零时辰事件当场落一次快照 ——
    CS.onLoaded(); writes.length = 0;
    fire('item:obtained', { itemName: 'lingzhi' });
    eq(writes.length, 1, 'item:obtained 当场落快照（autoMode）');
    eq(writes[0].autoMode, true, '快照走 autoMode：不占手动档槽');
    eq(CS.isDirty(), false, '落完盘红点自己灭');

    // —— 外部 markDirty（app.js startGame 将调 window.ContinueSave.markDirty()）——
    CS.onLoaded();
    CS.markDirty();
    eq(CS.isDirty(), true, '外部 markDirty() 立即标脏');
    ok(hud.textContent.indexOf('未存档') >= 0, '外部 markDirty() 当场刷 HUD，不必等下一次世界事件');
    CS.onSaved(Date.now());                          // 收尾，别把脏状态漏给别的测试
    delete global.ContinueSave;
    delete global._continueSaveSubscribed;
    delete global._continueSaveUnloadWired;
})();

// ============ [B] game-state.js：discipleState 结构 + 背包强化字段对称 ============
console.log('\n[B] game-state.js：discipleState 重置结构与背包序列化白名单');
(function () {
    var gs = codeOnly(src('js/core/game-state.js'));
    ok(gs.indexOf("position: '散修'") < 0, 'game-state.js 里死字段 position 绝迹');
    var resets = gs.match(/isInSect: false, sectId: null, sectName: null, contribution: 0, rank: null/g) || [];
    ok(resets.length >= 2, '导出兜底与重置两处都换成新结构（找到 ' + resets.length + ' 处单行写法）');
    ok(/Object\.assign\(global\.discipleState, \{\s*isInSect: false,\s*sectId: null,\s*sectName: null,\s*contribution: 0,\s*rank: null\s*\}\)/.test(gs),
        'resetGameState 的 Object.assign 分支也是新结构');

    // 试-07 主存档半边：存读两侧对称收 4 个强化字段
    var ser = gs.slice(gs.indexOf('function serializeInventorySlots'), gs.indexOf('function collectFullGameState'));
    ['enhancementLevel', 'refineLevel', 'enchantType', 'armorDurability'].forEach(function (f) {
        ok(ser.indexOf(f + ': s.' + f) >= 0, 'serializeInventorySlots 收 ' + f);
        ok(gs.indexOf("if (slotData[f] !== undefined && slotData[f] !== null) instance[f] = slotData[f];") >= 0
            && gs.indexOf("'" + f + "'") >= 0, '读档还原侧对称还原 ' + f);
    });
    var restore = gs.match(/\['enhancementLevel', 'refineLevel', 'enchantType', 'armorDurability'\]\.forEach/g) || [];
    eq(restore.length, 1, '还原侧字段清单恰一处（与 inventory.js loadInventory 同款写法）');
})();

// ============ [C] quest-system.js 文案：P2 指路 + P18 口径统一 ============
console.log('\n[C] quest-system.js 文案哨兵');
(function () {
    var qs = codeOnly(src('js/quest/quest-system.js'));
    ok(qs.indexOf('赏格') < 0, '代码里「赏格」绝迹（统一为「酬劳」）');
    ok(qs.indexOf('赏钱') < 0, '代码里「赏钱」绝迹（同族口径一并收）');
    ok(/description: '浏览门派列表（「地图」面板 →「地区列表」卡片 →「门派」页签）'/.test(qs),
        'main_001 首目标 description 直说页签位置（追踪条同串带提示）');
    ok(/门派列表在「地图」面板左下「地区列表」卡片的「门派」页签里/.test(qs),
        'main_001 任务描述补了指路');
    ok(qs.indexOf("locationId: 'sect_list'") >= 0, '判定逻辑没动：仍认 locationId=sect_list');
})();

// ============ [D] 试-18 商店触点 + 试-26 引导文案 ============
console.log('\n[D] enhanced-shop.js 触点 / codex-tutorial.js 文案');
(function () {
    var es = codeOnly(src('js/enhanced-shop.js'));
    var hints = es.match(/window\.codexHint\('tut_first_trade'\)/g) || [];
    eq(hints.length, 2, 'buyItem 成功分支与 executeSell 成交处各一处 codexHint');
    var buySeg = es.slice(es.indexOf('buyItem(itemId'), es.indexOf('canUseCredit(amount)'));
    ok(buySeg.indexOf("codexHint('tut_first_trade')") >= 0, '购买链触点在 buyItem 成功分支内');
    var sellSeg = es.slice(es.indexOf('executeSell: function'), es.indexOf('_addToBuyback(shopId, itemSnapshot, template, quantity, sellPrice, currency) {'));
    ok(sellSeg.indexOf("codexHint('tut_first_trade')") >= 0, '出售链触点在 executeSell 成交处');

    var ct = codeOnly(src('js/extensions/codex-tutorial.js'));
    ok(ct.indexOf('外出历练') < 0, '引导文案不再指向不存在的「外出历练」按钮');
    ok(ct.indexOf('点击"闭关"') < 0, '「第一次修炼」不再让新手点找不到的「闭关」');
    ok(/tut_first_cultivation[\s\S]{0,200}打坐修炼（真元）/.test(ct), '修炼引导改指「功法」页真实按钮「🧘 打坐修炼（真元）」');
    ok(/tut_first_combat[\s\S]{0,260}演武场/.test(ct), '战斗引导改指真实入口（地图赶路遭遇/演武场）');
})();

console.log('\n========== 结果：' + passed + ' 过 / ' + failed + ' 红 ==========');
process.exit(failed ? 1 : 0);
