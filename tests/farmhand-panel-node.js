/**
 * farmhand-panel-node.js — 灵田雇工接到新面板（洞府·灵田圃）验收：
 *   用户点账：「雇工那对按钮一直只写在 getHouseStatusHtml 的老整页里，可 app.renderHouseStatus 一进来
 *   HousePanelUI.render 就 return 了——旧页永不展示，玩家从头到尾没见过雇工入口。」
 *   A 入口在灵田圃：没长工显示雇长工，有长工显示辞工（行恒在，不因条件不满足整栏消失）
 *   B 复用：面板 onclick 直调现成的 hireFarmhand/fireFarmhand（点得到、刷得了；不新开一套雇工账）
 *   C 真账：安家钱真扣、日薪翻日真扣、欠薪记账与欠满辞工、代收成走 harvestCrop 正门
 *   D 哨兵：老 getHouseStatusHtml 兜底页原样留着；面板不亮锁写缘由；无人工计数器
 *
 * 运行：node tests/farmhand-panel-node.js
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
function load(rel) { vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel }); }
function src(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ==================== 测试桩 ====================
global.window = global;
var els = {};
function fakeEl(tag) {
    var el = {
        tag: tag || '', children: [], style: {}, parentNode: null, className: '',
        setAttribute: function () {}, getAttribute: function () { return null; },
        appendChild: function (c) { this.children.push(c); return c; },
        removeChild: function () {}, remove: function () {}, addEventListener: function () {}, removeEventListener: function () {},
        closest: function () { return null; }, scrollIntoView: function () {},
        classList: { add: function () {}, remove: function () {}, toggle: function () {}, contains: function () { return true; } },
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
    createElementNS: function (ns, tag) { return fakeEl(tag); },
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
var msgs = [];
global.showMessage = function (m, t) { msgs.push({ m: String(m), t: t }); };
global.updateCurrencyUI = function () {};
global.updateCharacterStatus = function () {};
global.EventBus = { emit: function () {}, on: function () {} };
var addedItems = [];
global.addItem = function (id, n) { addedItems.push([id, n]); return n || 1; };
global.growLifeSkill = function () {};
global.getLifeSkill = function () { return 0; };
var logged = [];
global.gameLog = { add: function (m) { logged.push(String(m)); } };

var _day = 100;
global.getAbsoluteDay = function () { return _day; };
// 翻日订阅簿：照 time-system 的 onNewDaySubscribe 协议，日结账从此处发
var newDaySubs = [];
global.timeSystem = {
    advanceTime: function () {},
    getAbsoluteDay: function () { return _day; },
    onNewDaySubscribe: function (fn) { newDaySubs.push(fn); }
};
function rollDay() {
    _day += 1;
    for (var i = 0; i < newDaySubs.length; i++) newDaySubs[i]();
}

var _cur = '洛水城';
global.locationSystem = { getCurrentLocation: function () { return _cur; } };
global.inventory = { currency: { spiritStones: 200000 }, maxSlots: 30, slots: [] };
global.currentCharData = { qi: 300, energy: 100, health: 100, spiritStones: 200000, location: '洛水城' };

load('js/regions.js');
load('js/map/world-map.js');
load('js/house-system.js');
load('js/house-panel.js');

// 钱包：照抄 js/global-utils.js:434-457 的 DataManager 真源（读背包现金、写背包与角色两面）
global.XianXia = {
    fmt: { num: function (v) { return String(v); } },
    DataManager: {
        getSpiritStones: function () {
            var inv = window.inventory;
            if (inv && inv.currency && typeof inv.currency.spiritStones === 'number') return inv.currency.spiritStones;
            var cd = window.currentCharData;
            return (cd && typeof cd.spiritStones === 'number') ? cd.spiritStones : 0;
        },
        setSpiritStones: function (a) {
            var v = Math.max(0, a);
            if (window.inventory && window.inventory.currency) window.inventory.currency.spiritStones = v;
            if (window.currentCharData) window.currentCharData.spiritStones = v;
        },
        addSpiritStones: function (a) { this.setSpiritStones(this.getSpiritStones() + a); },
        deductSpiritStones: function (a) {
            var c = this.getSpiritStones();
            if (c < a) return false;
            this.setSpiritStones(c - a);
            return true;
        }
    }
};

var HP = global.HousePanelUI;
// 照 app.renderHouseStatus 的正门：新面板整页接管后，雇/辞完面板自己重绘（老 HTML 不复活）
var liveC = fakeEl('div'), liveS = fakeEl('div');
global.renderHouseStatus = function () { HP.render(liveC, liveS); };
function liveHtml() { return String(liveC.innerHTML || ''); }
function renderPanel() {
    var c = fakeEl('div'), s = fakeEl('div');
    HP.render(c, s);
    return { html: c.innerHTML, shopHtml: s.innerHTML };
}
function tianHtml() { HP.selectTab('tian'); return renderPanel().html; }
/** 从面板 HTML 里把某个按钮的 onclick 表达式抠出来（模拟玩家点到这一下） */
function onclickOf(html, label) {
    var m = html.match(new RegExp('<button[^>]*onclick="([^"]*)"[^>]*>[^<]*' + label));
    return m ? m[1] : '';
}
function stones() { return global.XianXia.DataManager.getSpiritStones(); }
function setStones(v) { global.XianXia.DataManager.setSpiritStones(v); }

// 有府：占一处破山洞（house-system 自己的占山口，不走灵石）
claimRuin();
eq(global.playerHouse.type, 'ruin', '前置：占了一处破山洞（灵田一畦）');

// ==================== A · 入口在灵田圃 ====================
console.log('\n[A] 入口：灵田圃里有一行雇/辞');
var a1 = tianHtml();
assert(a1.indexOf('🧑‍🌾') >= 0, 'A1 灵田圃页里有雇工一行（🧑‍🌾）');
assert(a1.indexOf('雇长工') >= 0, 'A2 没长工时给的是「雇长工」入口');
assert(a1.indexOf('fireFarmhand()') < 0, 'A3 没长工时不摆辞工口（不是两排按钮）');
assert(a1.indexOf('hireFarmhand()') >= 0, 'A4 雇工钮的 onclick 直指 hireFarmhand()');
assert(a1.indexOf('安家 30 灵石') >= 0, 'A5 安家钱上脸（照 house-system 的 FARMHAND_HIRE，视图不写死数字）');
assert(a1.indexOf('日薪 2 灵石') >= 0, 'A6 日薪上脸（照 FARMHAND_WAGE）');
assert(a1.indexOf('熟后 3 日不采就蔫') >= 0, 'A7 没人看田的后果写在脸上（蔫账）');

var stonesA = stones();
eq(global.hireFarmhand(), true, 'A8 从面板这个钮真的雇成了');
assert(!!(getFarmhand() && getFarmhand().name) && getFarmhand().hiredDay === _day, 'A9 长工上工落账（名字 + 上工日）');
eq(stones(), stonesA - 30, 'A10 安家 30 灵石真扣（一分不少）');
var a2 = tianHtml();
assert(a2.indexOf('辞工') >= 0 && a2.indexOf('fireFarmhand()') >= 0, 'A11 有长工时显示的是「辞工」入口');
assert(a2.indexOf('hireFarmhand()') < 0, 'A12 在工时不还摆雇工钮');
assert(a2.indexOf('在工') >= 0 && a2.indexOf(getFarmhand().name) >= 0, 'A13 长工名与在工状态上脸');
assert(a2.indexOf('上工 0 日') >= 0, 'A14 上工几日如实（今天刚雇就是 0 日——hiredDay 这条死账有了读者）');
assert(a2.indexOf('生长期×0.75') >= 0, 'A15 长工的活写清：锄草松土生长期×0.75、代收不蔫');
assert(a2.indexOf('灵田没雇长工') < 0, 'A16 换了口就换了话术（没雇的话术不在）');

eq(global.fireFarmhand(), true, 'A17 辞工真的辞掉了');
eq(getFarmhand(), null, 'A18 田里没人了（账清空）');
var a3 = tianHtml();
assert(a3.indexOf('雇长工') >= 0 && a3.indexOf('fireFarmhand()') < 0, 'A19 辞完又回到「雇长工」口（两个口来回换，不是同时都在）');

// ==================== B · 复用原函数 ====================
console.log('\n[B] 复用：面板点到的是 house-system 现成的那两个函数');
eq(typeof global.hireFarmhand, 'function', 'B1 hireFarmhand 挂在 window 上（面板字符串能点到）');
eq(typeof global.fireFarmhand, 'function', 'B2 fireFarmhand 挂在 window 上');
eq(typeof global.getFarmhand, 'function', 'B3 getFarmhand 挂在 window 上（面板读账走它，不自己读 DOM）');
eq([global.FARMHAND_HIRE, global.FARMHAND_WAGE, global.FARMHAND_ARREARS_QUIT, global.FARMHAND_GROW_MUL].join('/'),
    '30/2/3/0.75', 'B4 四个雇工常数都从 house-system 导出（视图不另抄一份）');

setStones(200000);
var onHire = onclickOf(tianHtml(), '雇长工');
eq(onHire, 'hireFarmhand()', 'B5 面板上那一句就是 hireFarmhand()');
eq(eval(onHire), true, 'B6 把面板上的 onclick 原样执行 → 雇成了（点得到，不是摆设）');
assert(!!getFarmhand(), 'B6b 雇工真在账上');
assert(liveHtml().indexOf('fireFarmhand()') >= 0, 'B7 雇完面板自己重绘成「辞工」口（刷新走 HousePanelUI，不走老整页）');
var onFire = onclickOf(liveHtml(), '辞工');
eq(onFire, 'fireFarmhand()', 'B8 辞工钮同理（点得到）');
eq(eval(onFire), true, 'B9 辞工钮执行成功');
eq(getFarmhand(), null, 'B9b 辞完账清空');
assert(liveHtml().indexOf('hireFarmhand()') >= 0, 'B10 辞完重绘回「雇长工」口');

var hpSrc = src('js/house-panel.js');
eq((hpSrc.match(/function hireFarmhand/g) || []).length, 0, 'B11 面板里没有第二套雇工逻辑（不重复声明已有全局函数）');
eq((hpSrc.match(/function fireFarmhand/g) || []).length, 0, 'B12 同上：fireFarmhand 只有一处、且在 house-system');
assert(hpSrc.indexOf('window.hireFarmhand =') < 0 && hpSrc.indexOf('window.fireFarmhand =') < 0, 'B13 面板不重新赋值这两个全局（原函数一个字节没动）');

// ==================== C · 真账：日结 ====================
console.log('\n[C] 真账：安家/日薪/欠薪辞工/代收成');
setStones(200000);
global.inventory.slots.push({ uid: 9001, templateId: 'mat_ginseng', count: 4 });
global.playerHouse.planted.length = 0;
plantCrop('spirit_grass');
var grass = global.playerHouse.planted[0];
eq(grass.readyDay, _day + 2, 'C1 灵草 2 日熟（无长工）');
global.playerHouse.planted.length = 0;
plantCrop('ginseng');
var readyNo = global.playerHouse.planted[0].readyDay;
eq(readyNo, _day + 4, 'C2 人参 4 日熟（无长工）');
global.playerHouse.planted.length = 0;
global.hireFarmhand();
plantCrop('ginseng');
eq(global.playerHouse.planted[0].readyDay, readyNo - 1, 'C3 雇了长工，人参 3 日熟（七五折真落到 readyDay 上）');

global.playerHouse.planted.length = 0;
plantCrop('spirit_grass');
var ripe = global.playerHouse.planted[0];
_day = ripe.readyDay;
var slotsBefore = addedItems.length;
var stonesC = stones();
assert(newDaySubs.length >= 1, 'C4 farmhandDaily 挂在 onNewDay 上（雇了工，日结才有活干）');
rollDay();
eq(global.playerHouse.planted.length, 0, 'C5 熟的那畦被长工代收了（走 harvestCrop 正门，不私藏）');
assert(addedItems.length > slotsBefore && addedItems[addedItems.length - 1][0] === 'mat_spirit_grass', 'C6 代收的灵植真入账（不是凭空消失）');
eq(stones(), stonesC - 2, 'C7 日薪 2 灵石翻日真扣');
eq(getFarmhand().arrears, 0, 'C8 发了工钱，欠薪账清零');

setStones(1);
rollDay();
eq(getFarmhand().arrears, 1, 'C9 支不出工钱 → 欠 1 日（不白嫖）');
rollDay();
eq(getFarmhand().arrears, 2, 'C10 欠 2 日仍在工（还没到三日）');
assert(msgs.some(function (m) { return m.m.indexOf('已欠 2 日') >= 0 && m.m.indexOf('欠满 3 日') >= 0; }), 'C11 欠薪当日屏上说得明白（欠几日、欠满几日辞工）');
rollDay();
eq(getFarmhand(), null, 'C12 欠满三日，长工真的辞工下山了（账清空）');
assert(logged.some(function (m) { return m.indexOf('下山') >= 0; }), 'C13 辞工这件事在 gameLog 里留了痕');

setStones(200000);
var stonesC2 = stones();
rollDay();
eq(stones(), stonesC2, 'C14 没雇长工时翻日不扣任何工钱（空转而非白拿）');
var tianC = tianHtml();
assert(tianC.indexOf('雇长工') >= 0, 'C15 长工自己辞工后，面板又回到「雇长工」口（不用重开面板）');

// ==================== D · 哨兵 ====================
console.log('\n[D] 哨兵：老页留着、面板不亮锁、无新计数器');
var hsSrc = src('js/house-system.js');
assert(hsSrc.indexOf('function getHouseStatusHtml') >= 0 && hsSrc.indexOf('onclick="hireFarmhand()"') >= 0,
    'D1 老兜底页原样留着（HousePanelUI 没加载出来时仍能雇——不删老账）');
var appSrc = src('js/app.js');
assert(appSrc.indexOf('window.HousePanelUI.render(container, shop); return;') >= 0,
    'D2 渲染仍由 HousePanelUI 整页接管（老 HTML 不复活）');
assert(hpSrc.indexOf('每日限') < 0 && hpSrc.indexOf('次数已用完') < 0, 'D3 无人工计数器口径');

setStones(0);
var poorHtml = tianHtml();
assert(poorHtml.indexOf('雇长工') >= 0, 'D4 身无分文时雇工口照旧在（不因条件不满足消失）');
assert(poorHtml.indexOf('还差') < 0 && poorHtml.indexOf('x-lock') < 0,
    'D5 面板不预先亮锁写缘由（缘由归 hireFarmhand 那句提示，不在面板上第二遍说）');
msgs.length = 0;
eq(global.hireFarmhand(), false, 'D6 点不动：灵石不够真的没雇成');
assert(msgs.length > 0 && msgs[msgs.length - 1].m.indexOf('30') >= 0, 'D7 点了如实回话：安家钱要多少说清楚');
setStones(200000);

// 人在他乡：跟收菜/下种同一口径（按不动，回府再做），但口本身不消失
_cur = '金城';
global.currentCharData.location = '金城';
var awayHtml = tianHtml();
assert(awayHtml.indexOf('雇长工') >= 0, 'D8 人在他乡雇工行也在（不整栏消失）');
assert(awayHtml.indexOf('HousePanelUI._away()') >= 0, 'D9 人在他乡按不动（屋里的事先回府做，与收菜下种同一口径）');
_cur = '洛水城';
global.currentCharData.location = '洛水城';

var runAll = src('tests/run-all.sh');
assert(runAll.indexOf('farmhand-panel-node.js') >= 0, 'D10 本套已挂全量回归');

console.log('\n========== farmhand-panel 结果：' + passed + ' 通过 / ' + failed + ' 失败 ==========');
if (failed > 0) process.exit(1);