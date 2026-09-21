/**
 * v21.3-sect-fixes-node.js — 门派事件与建筑修复门禁
 *
 * 玩家报障三连：
 *   ① 刚入修罗宫，「宫主召见」立刻糊脸（入门当日就 roll 每日事件）
 *   ② 事件弹窗点完选项不关闭（结果 toast 还被同层遮罩盖住，看着像没反应，且可反复点刷奖励）
 *   ③ 门派建筑点了没反应、没深度（专属建筑如寒潭根本没列进内院视图）
 *
 * 覆盖：
 *   A 抉择收场：点选项→弹窗关、结果上屏、挂起清空、无法二次点击刷奖励
 *   B 入门安静日：joinSect 落 _sectEventDay=当日 → 当日 maybeSectDailyEvent 不弹；次日照常 roll
 *   C 退派清场：leaveSect 清 _sectEventDay/_pendingSectEvent（旧门派挂起事件不跟人走）
 *   D 专属建筑可见：内院列出本派 SECT_FACILITY_EXTRAS（修罗宫·寒潭），点击入戏弹窗可见
 *   E 挂起重弹不回归：当日已有挂起事件时 maybeSectDailyEvent 仍会重弹（v16.3 行为保留）
 *
 * 运行：node tests/v21.3-sect-fixes-node.js
 */
'use strict';

var path = require('path');
var fs = require('fs');
var vm = require('vm');

var ROOT = path.resolve(__dirname, '..');
function loadScript(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

var passed = 0, failed = 0;
function ok(cond, label) {
    if (cond) passed++;
    else { failed++; console.log('[FAIL] ' + label); }
}

// ============ 迷你 DOM ============
function El(id, tag) {
    this.id = id || ''; this.tagName = (tag || 'div').toUpperCase();
    this.children = []; this.parentNode = null;
    this._classes = {}; this.style = {}; this.dataset = {};
    this._html = ''; this._text = '';
    var self = this;
    this.classList = {
        add: function (c) { self._classes[c] = 1; },
        remove: function (c) { delete self._classes[c]; },
        contains: function (c) { return !!self._classes[c]; }
    };
    this.onclick = null;
}
Object.defineProperty(El.prototype, 'className', {
    get: function () { return Object.keys(this._classes).join(' '); },
    set: function (v) { this._classes = {}; var s = this; String(v).split(/\s+/).forEach(function (c) { if (c) s._classes[c] = 1; }); }
});
Object.defineProperty(El.prototype, 'innerHTML', {
    get: function () { return this._html; },
    set: function (v) { this._html = String(v); }
});
Object.defineProperty(El.prototype, 'textContent', {
    get: function () { return this._text; },
    set: function (v) { this._text = String(v); }
});
El.prototype.appendChild = function (c) { c.parentNode = this; this.children.push(c); return c; };
El.prototype.remove = function () {
    if (this.parentNode) {
        var i = this.parentNode.children.indexOf(this);
        if (i >= 0) this.parentNode.children.splice(i, 1);
    }
    delete DOC.byId[this.id];
};
El.prototype.querySelector = function () { return null; };
El.prototype.querySelectorAll = function () { return []; };
El.prototype.closest = function () { return this.parentNode; };
El.prototype.insertAdjacentHTML = function (pos, html) { this._html += html; };

var DOC = { byId: {} };
DOC.createElement = function (tag) { return new El('', tag); };
DOC.getElementById = function (id) { return DOC.byId[id] || null; };
DOC.querySelector = function () { return null; };
DOC.querySelectorAll = function () { return []; };
DOC.addEventListener = function () {};
DOC.body = new El('body', 'body');
DOC.body.appendChild = function (c) {
    c.parentNode = this; this.children.push(c);
    if (c.id) DOC.byId[c.id] = c;
    return c;
};
// 预注册面板与剧本弹窗内部节点（真浏览器里由 innerHTML 解析产生）
['sect-panel', 'panel-map', 'game-world', 'sect-info', 'sm-title', 'sm-sub', 'sm-desc', 'sm-choices', 'sm-foot'].forEach(function (id) {
    var e = new El(id); DOC.byId[id] = e; DOC.body.appendChild(e);
});

// ============ 世界桩 ============
var W = {
    console: { log: function () {}, warn: function () {}, error: function () {} },
    document: DOC,
    setTimeout: function () { return 0; },
    localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
    alert: function () {}, confirm: function () { return true; },
    Math: Math, JSON: JSON, Number: Number, Object: Object, Array: Array, String: String, Date: Date,
    isFinite: isFinite, parseInt: parseInt, parseFloat: parseFloat
};
W.window = W;
W.navigator = { userAgent: 'node' };

var state = { msgs: [], logs: [] };
W.gameLog = { add: function (t) { state.logs.push(String(t)); } };
W.timeSystem = {
    gameTime: { totalMinutes: 8 * 60, currentDay: 3 },
    advanceTime: function (m) { this.gameTime.totalMinutes += m; },
    getAbsoluteDay: function () { return Math.floor(this.gameTime.totalMinutes / 1440) + 1; }
};
W.getAbsoluteDay = function () { return W.timeSystem.getAbsoluteDay(); };
W.currentCharData = { name: '测试子', realm: '练气', layer: 5, health: 100, maxHealth: 100, qi: 100, maxQi: 200, energy: 100, maxEnergy: 100, tempering: 0, karma: 0, notoriety: 0, fame: 0, luck: 50, combatSkills: { '内功': 10 }, lifeSkills: {} };
W.discipleState = { isInSect: true, sectId: '修罗宫', rank: 7, rankName: '记名弟子', contribution: 100, points: 0 };
W.inventory = { currency: { spiritStones: 100, copper: 500 }, slots: [] };
W.itemById = {};
W.addItem = function () { return true; };
W.applyBuff = function () {};
W.addFame = function () {};
W.EventBus = { emit: function () {}, on: function () {} };
W.StateRegistry = { register: function () {} };
W.EconomyTransaction = { run: function (fn) { return fn(); }, debit: function () { return true; }, credit: function () { return true; }, addSnapshot: function () { return true; }, removeByTemplate: function () { return true; } };
W.updateCurrencyUI = function () {}; W.updateCharacterUI = function () {}; W.updateAllStatDisplays = function () {};
W.updateFacilityUI = function () {};
W.restoreBodyDurability = function () {}; W.changeFactionReputation = function () {};
W.getLifeSkill = function () { return 0; }; W.getRealmTier = function () { return 1; };
W.getCurrentCityName = function () { return '遵义'; };
W.RANKS = [{ id: 0, name: '掌门' }, { id: 2, name: '长老' }, { id: 4, name: '内门弟子' }, { id: 5, name: '外门弟子' }, { id: 7, name: '杂役弟子' }];
W.COMMON_RANKS = W.RANKS;
W.locationSystem = { getCityData: function () { return null; } };
W.mapData = []; W.regionsData = {}; W.CITY_FACILITIES = {};

vm.createContext(W);
function load(rel, wrap) {
    var src = loadScript(rel);
    if (wrap) src = '(function(){\n' + src + '\n})();';
    vm.runInContext(src, W, { filename: rel });
}
load('js/economy/economy-transaction.js');
load('js/core/reward-service.js');
load('js/core/scenario-engine.js');
load('js/global-utils.js');
load('js/sects/sects.js');
load('js/sects/sect-facilities.js');
load('js/sects/sect-scenarios.js', true);
load('js/sects/sect-specialties.js');
load('js/sects/sects-deep-data.js');
load('js/sects/sects-deep-ui.js');
load('js/sects/sect-visit.js');
// 全部加载后重挂消息捕获（global-utils 会覆盖 showMessage 进队列）
W.showMessage = function (t, k) { state.msgs.push('[' + (k || 'info') + '] ' + String(t)); };

var origRandom = Math.random;

// ============ A 抉择收场 ============
W.discipleState._sectEventDay = null;
W.discipleState._pendingSectEvent = null;
Math.random = function () { return 0.1; }; // 必中事件
W.maybeSectDailyEvent();
var overlay = DOC.byId['xianxia-modal-overlay'];
ok(!!overlay && overlay.innerHTML.indexOf('门派事件') >= 0, 'A 每日事件弹窗正常弹出');
var pev = W.discipleState._pendingSectEvent;
ok(!!pev && pev.sect === '修罗宫', 'A 挂起事件已记录（sect=修罗宫）');
state.msgs = [];
var contribBefore = W.discipleState.contribution;
W.chooseSectEvent(pev.sect, pev.eventId, 0);
ok(!DOC.byId['xianxia-modal-overlay'], 'A 点完选项弹窗即关闭（v21.3 修复：此前永不关）');
ok(state.msgs.length === 1 && state.msgs[0].indexOf('宫主只问了三个问题') >= 0, 'A 抉择结果上屏（不再被遮罩盖住）');
ok(W.discipleState._pendingSectEvent === null, 'A 挂起事件已清空');
ok(W.discipleState.contribution > contribBefore, 'A 效果落账（贡献增加）');
// 二次点击无从发生：弹窗已移除；即便硬调，也不该重复落账——pending 已清但函数按 id 仍可结算，
// 关键防线是弹窗消失（真浏览器里按钮随 DOM 一起没了）
var contribAfterFirst = W.discipleState.contribution;
Math.random = origRandom;

// 当日再开面板：已 roll 过且无挂起 → 安静
W.maybeSectDailyEvent();
ok(!DOC.byId['xianxia-modal-overlay'], 'A 抉择后当日再开面板不再弹（不重复 roll）');
ok(W.discipleState.contribution === contribAfterFirst, 'A 无残留弹窗可供反复点击刷奖励');

// ============ B 入门安静日 ============
var sysSrc = loadScript('js/sects/sects-system.js');
ok(/_sectEventDay = _joinAbsDay/.test(sysSrc), 'B joinSect 写入入门当日标记（安静日）');
ok(/_pendingSectEvent = null;\s*\n\s*\} catch \(eJoinEvt\)/.test(sysSrc) || sysSrc.indexOf('_pendingSectEvent = null') >= 0, 'B joinSect 清旧门派挂起事件');
// 运行时口径：_sectEventDay=当日 且无挂起 → maybeSectDailyEvent 静默（模拟刚入门）
W.discipleState._sectEventDay = W.getAbsoluteDay();
W.discipleState._pendingSectEvent = null;
Math.random = function () { return 0.0; }; // 若 roll 必中
W.maybeSectDailyEvent();
ok(!DOC.byId['xianxia-modal-overlay'], 'B 入门当日开面板不弹事件（安静日运行时验证）');
// 次日 → 照常 roll
W.timeSystem.gameTime.totalMinutes += 1440;
W.maybeSectDailyEvent();
ok(!!DOC.byId['xianxia-modal-overlay'], 'B 次日开面板事件照常 roll（安静日只免一天）');
var ov = DOC.byId['xianxia-modal-overlay']; if (ov) ov.remove();
W.discipleState._pendingSectEvent = null;
Math.random = origRandom;

// ============ C 退派清场 ============
ok(/_sectEventDay: null/.test(sysSrc) && /_pendingSectEvent: null/.test(sysSrc), 'C leaveSect 重置清单含事件标记与挂起事件');

// ============ D 专属建筑可见、可点、入戏 ============
W.discipleState._sectEventDay = W.getAbsoluteDay(); // 压住事件弹窗，专注建筑
W.showSectInnerView('修罗宫');
var panelHtml = DOC.byId['sect-panel'].innerHTML;
ok(panelHtml.indexOf('寒潭') >= 0, 'D 内院列出修罗宫专属建筑「寒潭」（v21.3 修复：此前专属永不显示）');
ok(panelHtml.indexOf('本派专属之地') >= 0, 'D 专属区块有标题');
ok(/useFacility\('fx_xlg_hantan'\)/.test(panelHtml), 'D 寒潭有可点按钮（useFacility 直连）');
ok(panelHtml.indexOf('演武场') >= 0 && panelHtml.indexOf('藏经阁') >= 0, 'D 通用内院设施照旧列出（不误伤）');
var smOld = DOC.byId['scenario-modal']; if (smOld) smOld.remove();
var rH = W.useFacility('fx_xlg_hantan');
var mh = DOC.byId['scenario-modal'];
ok(rH === true && mh && !mh.classList.contains('hidden'), 'D 点寒潭 → 剧本弹窗可见（入戏）');

// 换门派：专属列表跟着换（少林寺弟子看到的就是少林的）
W.discipleState.sectId = '少林寺';
W.showSectInnerView('少林寺');
var slHtml = DOC.byId['sect-panel'].innerHTML;
var slExtras = (W.SECT_FACILITY_EXTRAS['少林寺'] || []).map(function (f) { return f.name; });
ok(slExtras.length > 0 && slExtras.every(function (n) { return slHtml.indexOf(n) >= 0; }), 'D 少林内院列出少林专属（' + slExtras.join('、') + '）');
ok(slHtml.indexOf('寒潭') < 0, 'D 专属建筑不跨派串门（少林内院无寒潭）');

// ============ E 挂起重弹不回归（v16.3 行为保留） ============
W.discipleState.sectId = '修罗宫';
W.discipleState._sectEventDay = W.getAbsoluteDay();
W.discipleState._pendingSectEvent = { day: W.getAbsoluteDay(), sect: '修罗宫', eventId: 'se_xlg_gongzhu' };
W.maybeSectDailyEvent();
ok(!!DOC.byId['xianxia-modal-overlay'], 'E 当日有未抉择挂起事件时仍会重弹（v16.3 口径不变）');
var ov2 = DOC.byId['xianxia-modal-overlay']; if (ov2) ov2.remove();

// ============ 结果 ============
console.log('v21.3 门派修复: ' + passed + ' 通过, ' + failed + ' 失败');
process.exit(failed ? 1 : 0);
