/**
 * wave95-core-fixes-node.js — 第九十五波 · 外包实机 BUG 修复批（核心线）验收：
 *   针对 FIX_NOTES.md 里 NEW-01/07/08/09/12/16/20/21/22/24/25/26/30/36/42/44/47/48 的核心侧修复。
 *   （NPC/邮件线见 wave95-npc-mail-fixes-node.js，经济/设施线见 wave95-economy-facility-fixes-node.js）
 *   A 钱包一本账（NEW-36/31/06/12）：角色钱包是背包钱包的转发视图，读写都落唯一权威，镜像不再漂移
 *   B 时辰口径（NEW-34）：formatShichen 一处换算，牌面/日志不再各口算出鬼账
 *   C 各修复哨兵：打坐崩溃、战斗医疗面板、弹窗误删静态面板、拍卖行入口、门派门禁、
 *     新日时序、图鉴生产者、门派面板建造者、继续仙途、功法页渲染、任务交付、入门回溯、
 *     地图点击委托、日常事件让路、硬停回执、类型中文、藏经阁回执——逐一钉在源码里
 *
 * 运行：node tests/wave95-core-fixes-node.js
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
function fakeEl() {
    return {
        style: {}, children: [], _html: '', textContent: '', dataset: {},
        classList: { _s: {}, add: function (c) { this._s[c] = 1; }, remove: function (c) { delete this._s[c]; }, contains: function (c) { return !!this._s[c]; }, toggle: function () {} },
        setAttribute: function (k, v) { this[k] = v; }, getAttribute: function (k) { return this[k] != null ? this[k] : null; },
        appendChild: function (c) { this.children.push(c); return c; }, removeChild: function () {}, remove: function () { this._removed = true; },
        addEventListener: function () {}, closest: function () { return null; }, querySelector: function () { return null; },
        querySelectorAll: function () { return []; }, getBoundingClientRect: function () { return { left: 0, top: 0, width: 100, height: 100 }; }
    };
}
var els = {};
global.document = {
    readyState: 'complete',
    createElement: function () { return fakeEl(); },
    getElementById: function (id) { if (!els[id]) els[id] = fakeEl(); return els[id]; },
    querySelector: function () { return null; }, querySelectorAll: function () { return []; },
    addEventListener: function () {}, body: { appendChild: function () {} }
};
var store = {};
global.localStorage = { getItem: function (k) { return store[k] != null ? store[k] : null; }, setItem: function (k, v) { store[k] = String(v); }, removeItem: function (k) { delete store[k]; } };
global.showMessage = function () {};
global.requestAnimationFrame = null;

// ==================== A · 钱包一本账（NEW-36）====================
console.log('\n[A] 钱包一本账（角色钱包=背包钱包的转发视图，镜像不再漂移）');
load('js/global-utils.js');
assert(typeof global.installWalletMirror === 'function', 'A1 installWalletMirror 已挂全局');
// 场景：背包钱包是唯一权威；48 处裸写 inventory.currency 后，角色字段读到的必须同步
global.inventory = { currency: { spiritStones: 100, copper: 500 } };
var cd = { spiritStones: 100, copper: 500, name: '测试散修' };
global.installWalletMirror(cd);
eq(cd.spiritStones, 100, 'A2 装上访问器后读数=背包钱包');
// 模拟一处「只写背包钱包」的裸写（捐赠/强化那类）——角色字段应立刻同步（此前会漂移）
global.inventory.currency.spiritStones -= 100;   // 裸写：捐赠 100
eq(cd.spiritStones, 0, 'A3 裸写背包钱包后角色字段同步（不再各记各的账）');
// 反向：写角色字段也落回背包钱包
cd.copper = 300;
eq(global.inventory.currency.copper, 300, 'A4 写角色字段落回背包钱包（双向一本账）');
// 序列化：JSON 存的是真账（漂移不可能再被带上存档）
var saved = JSON.parse(JSON.stringify(cd));
eq(saved.spiritStones, 0, 'A5 存档序列化读到的是背包真账（漂移账上不了档）');
// 幂等：重复安装不叠加、不报错
global.installWalletMirror(cd);
cd.spiritStones = 5;
eq(global.inventory.currency.spiritStones, 5, 'A6 重复安装幂等（访问器不叠加）');
// 背包缺席时退化到影子值，不抛错
var cd2 = { spiritStones: 7, copper: 3 };
var savedInv = global.inventory; global.inventory = null;
global.installWalletMirror(cd2);
eq(cd2.spiritStones, 7, 'A7 背包缺席时读影子值（不崩）');
cd2.spiritStones = 9;
eq(cd2.spiritStones, 9, 'A8 背包缺席时写影子值（不崩）');
global.inventory = savedInv;
// 三个写入口都挂了访问器安装
var appSrc = src('js/app.js');
assert(appSrc.indexOf('_setAppCurrentCharData = function(data) { currentCharData = data; if (data && window.installWalletMirror)') >= 0, 'A9 唯一写入口 _setAppCurrentCharData 装访问器');
assert((appSrc.match(/installWalletMirror\(/g) || []).length >= 3, 'A10 app.js 建角/两处读档都装访问器');
assert(src('js/global-utils.js').indexOf('installWalletMirror(data)') >= 0, 'A11 setCurrentCharData 统一入口装访问器');
assert(src('js/core/game-state.js').indexOf('installWalletMirror(loadedChar)') >= 0, 'A12 game-state 兜底读档路径也装');
// NEW-12：每日收入落审计账本
assert(appSrc.indexOf('每日收入入账') >= 0 && appSrc.indexOf("gameLog.add") >= 0, 'A13 每日收入入 gameLog 审计（NEW-10/12 查有对证）');

// ==================== B · 时辰口径（NEW-34）====================
console.log('\n[B] 时辰口径一处算（1 时辰=120 分钟）');
var tsSrc = src('js/time-system.js');
assert(tsSrc.indexOf('function formatShichen') >= 0 && tsSrc.indexOf('window.formatShichen = formatShichen') >= 0, 'B1 formatShichen 已定义并挂全局');
// 直接抽取纯函数验证换算口径（避免整套 time-system 的重依赖）
var fmt = (function () {
    var m = tsSrc.match(/function formatShichen\(minutes\) \{[\s\S]*?\n\}/);
    if (!m) return null;
    var f = new Function(m[0] + '; return formatShichen;');
    return f();
})();
assert(typeof fmt === 'function', 'B2 formatShichen 可独立求值');
if (fmt) {
    eq(fmt(120), '一个时辰', 'B3 120 分钟=一个时辰');
    eq(fmt(240), '两个时辰', 'B4 240 分钟=两个时辰（寻差事牌面对齐）');
    eq(fmt(60), '半个时辰', 'B5 60 分钟=半个时辰（打盹牌面对齐）');
    eq(fmt(0), '片刻', 'B6 0 分钟=片刻');
    eq(fmt(90), '90分钟', 'B7 非整除回落分钟');
}
// 三处牌面口径已对齐（经济线也改了，这里做交叉哨兵）
assert(src('js/city-facilities/city-jobs.js').indexOf('四个时辰') < 0, 'B8 寻差事牌面不再有「四个时辰」虚账');
assert(src('js/city-facilities/street-stall.js').indexOf('两个时辰') < 0, 'B9 摆摊文案不再有「两个时辰」（实扣 120=一时辰）');

// ==================== C · 各修复哨兵 ====================
console.log('\n[C] 各修复哨兵（逐一钉在源码里）');
// NEW-22 打坐崩溃：mainSkillId 补声明
assert(appSrc.indexOf('var mainSkillId = mainSkillDef ?') >= 0, 'C1 打坐 mainSkillId 已补声明（NEW-22 不再 ReferenceError）');
var medit = appSrc.slice(appSrc.indexOf('function cultivationMeditate'), appSrc.indexOf('function cultivationMeditate') + 6000);
assert(medit.indexOf('pastLifeSkillBonus(mainSkillId)') >= 0 && medit.indexOf('var mainSkillId =') >= 0, 'C2 前世功法加成引用前已声明 mainSkillId');
// NEW-20 战斗医疗面板走槽位制
assert(appSrc.indexOf('var _medCount = function (id)') >= 0, 'C3 医疗面板按槽位计数（NEW-20）');
assert(appSrc.indexOf('!inventory || !inventory.slots') >= 0, 'C4 医疗面板改判 slots（不再判不存在的 items）');
var medUse = appSrc.slice(appSrc.indexOf('function battleUseMedicalItem'), appSrc.indexOf('function battleUseMedicalItem') + 4200);
assert(medUse.indexOf('bs.templateId === itemId') >= 0, 'C5 用药按 templateId 找真槽位');
assert(medUse.indexOf('item.removeCount') >= 0, 'C6 扣数走槽位实例的账');
// NEW-47 弹窗误删静态面板
var gu = src('js/global-utils.js');
assert(gu.indexOf("STATIC_PANEL_IDS = ['battle-modal', 'reincarnation-modal', 'entity-interaction']") >= 0, 'C7 三块静态面板列入保护名单');
assert(gu.indexOf('window.closeRuntimeModals = function') >= 0, 'C8 closeRuntimeModals 只收运行时弹窗');
var ks = src('js/core/keyboard-shortcuts.js');
assert(ks.indexOf("el.classList.contains('hidden')") >= 0 && ks.indexOf('STATIC_PANEL_IDS') >= 0, 'C9 Esc 关窗跳过 hidden 与静态面板');
assert((appSrc.match(/window\.closeRuntimeModals\(\)/g) || []).length >= 4, 'C10 app.js 多处「打扫屏幕」换成保护版');
assert(appSrc.indexOf('var _bmModal = document.getElementById(\'battle-modal\')') >= 0, 'C11 closeBattle 收尾判空');
var cbSeg = appSrc.slice(appSrc.indexOf('function closeBattle'), appSrc.indexOf('function closeBattle') + 4000);
assert(cbSeg.indexOf('currentBattle = null') < cbSeg.indexOf("_bmModal.classList.add('hidden')"), 'C12 closeBattle 先清战斗状态再动 DOM（抛错也不留死账）');
assert(src('js/cultivation/long-retreat.js').indexOf("querySelector('.battle-modal')") < 0, 'C13 闭关战斗判法不再用拼错的 class（NEW-47 附带）');
// NEW-30 拍卖行入口
var lsSrc = src('js/location-system.js');
assert(lsSrc.indexOf("buildingId === 'auction_house' && typeof window.openAuctionHouse") >= 0, 'C14 拍卖行真面板优先于情景路由（NEW-30）');
// NEW-45 门派门禁不等号
assert(lsSrc.indexOf('f.rankReq != null && (ds.rank == null ? true : ds.rank > f.rankReq)') >= 0, 'C15 门派设施锁判定不等号已正（NEW-45）');
assert(lsSrc.indexOf('const locked = !canUse || f.rankReq > ds.rank;') < 0, 'C16 旧的反向不等号已清除');
// NEW-08 硬停回执
assert(lsSrc.indexOf('function _hardStop(text)') >= 0 && lsSrc.indexOf('办不成') >= 0, 'C17 余额/门槛不足改弹窗硬停回执（NEW-08）');
assert(lsSrc.indexOf('禁军横戟拦住去路') >= 0, 'C18 皇宫门槛拒绝改成看得见的弹窗');
// NEW-26 新日时序
assert(tsSrc.indexOf('gameTime.currentDay = _d;') >= 0 && tsSrc.indexOf('gameTime.currentDay = _d;') < tsSrc.indexOf('onNewDay(_d - 1, _d);'), 'C19 新日先赋值 currentDay 再派发订阅（NEW-26）');
assert(tsSrc.indexOf("console.warn('[time] newDay listener failed:'") >= 0, 'C20 订阅者抛错不再全静默');
// NEW-44 门派面板建造者
var sv = src('js/sects/sect-visit.js');
assert((sv.match(/window\.ensureSectPanel/g) || []).length >= 2, 'C21 本派内院/外派视图都走唯一建造者（NEW-44）');
assert(sv.indexOf("var panel = document.getElementById('sect-panel');\n    if (!panel) return;") < 0, 'C22 sect-visit 不再裸取节点静默返回');
// NEW-48 继续仙途
assert(appSrc.indexOf('function continueLastGame') >= 0 && appSrc.indexOf('function refreshContinueButton') >= 0, 'C23 开屏「继续仙途」入口就位（NEW-48）');
assert(src('仙侠.html').indexOf('continue-game-btn') >= 0 && src('仙侠.html').indexOf('continueLastGame()') >= 0, 'C24 登仙大典挂了继续按钮');
// NEW-24 功法页动态渲染
assert(appSrc.indexOf('function renderArtListPanel') >= 0 && appSrc.indexOf('art-list-container') >= 0, 'C25 功法页改动态渲染（NEW-24）');
assert(src('仙侠.html').indexOf('art-list-container') >= 0, 'C26 静态死占位换成渲染容器');
assert(src('仙侠.html').indexOf('<p class="text-gray-400">尚未习得任何功法。</p>') < 0, 'C27 写死的空态 HTML 已移除');
// NEW-01 任务交付升档
var qs = src('js/quest/quest-system.js');
var advSeg = qs.slice(qs.indexOf('function advanceQuestObjectivesFromEvent'), qs.indexOf('function advanceQuestObjectivesFromEvent') + 1600);
assert(advSeg.indexOf('quest.completed = true') >= 0, 'C28 事件桥推进后升 quest 级 completed（NEW-01 能交付）');
// NEW-21 入门回溯
assert(src('js/sects/sects-system.js').indexOf('alreadyMember: true') >= 0, 'C29 同门重复入门补发 sect:joined（NEW-21）');
assert(qs.indexOf("advanceQuestObjectivesFromEvent('sect:joined'") >= 0, 'C30 接取任务回溯既成入门事实');
// NEW-42 图鉴生产者
assert(src('js/core/knowledge-system.js').indexOf("Codex.discover('codex_gongfa'") >= 0, 'C31 功法图鉴有生产者（NEW-42）');
assert(src('js/crafting.js').indexOf("Codex.discover('codex_recipe'") >= 0, 'C32 丹方图鉴有生产者');
assert(src('js/sects/sects-system.js').indexOf("Codex.discover('codex_sect'") >= 0, 'C33 门派图鉴有生产者');
// NEW-07 地图点击委托
var rm = src('js/map/randomMap.js');
assert(rm.indexOf("g.setAttribute('data-cx', x)") >= 0 && rm.indexOf('_bindMapDelegation') >= 0, 'C34 地图格子点击改委托（NEW-07）');
assert(rm.indexOf('function cellFromEvent') >= 0 && rm.indexOf('closest(\'g[data-cx]\')') >= 0, 'C35 委托含 data 命中 + viewBox 坐标兜底');
// NEW-16 日常事件让路
assert(src('js/core/daily-events.js').indexOf("'scenario-modal', 'xianxia-modal-overlay'") >= 0, 'C36 日常事件不再盖在设施情境中途（NEW-16）');
// NEW-25 类型中文
assert(src('js/inventory.js').indexOf('function _typeCN(t)') >= 0 && src('js/inventory.js').indexOf('secret_art: ') >= 0, 'C37 物品详情类型过中文映射（NEW-25）');
assert(src('js/inventory.js').indexOf('类型：</span>${_typeCN(template.type)}') >= 0, 'C38 详情模板用中文名上屏');
// NEW-09 藏经阁回执
assert(appSrc.indexOf('付讫纸墨钱 3 灵石') >= 0, 'C39 藏经阁扣费有回执（NEW-09）');
// NEW-03 槽存档任务账
assert(qs.indexOf('function getQuestProgressSnapshot') >= 0, 'C40 任务系统暴露活账快照（NEW-03）');
assert(appSrc.indexOf('getQuestProgressSnapshot()') >= 0, 'C41 槽存档从任务正主取活账（不再空壳）');
// NEW-38 传送阵解锁
assert(lsSrc.indexOf('travelSystem.unlockTeleport(normalizedName)') >= 0 && appSrc.indexOf('travelSystem.unlockTeleport(cityName)') >= 0, 'C42 抵达即解锁传送阵（NEW-38 死锁解开）');

// ==================== D · 哨兵：无中英混排 / 无新人工计数器 ====================
console.log('\n[D] 收尾哨兵');
// 新话术抽检：本批新增的玩家可见中文串里不该夹生英文单词
var leak = null;
[gu.slice(gu.indexOf('installWalletMirror'), gu.indexOf('installWalletMirror') + 1200)].forEach(function (txt) {
    (txt.match(/'[^']+'/g) || []).forEach(function (q) {
        var v = q.slice(1, -1);
        if (/[+);({\[,?<>]/.test(v)) return;
        if (/^[A-Za-z0-9_\-:.\/#% ]+$/.test(v)) return;
        if (/[A-Za-z]/.test(v) && /[一-龥]/.test(v)) leak = leak || q;
    });
});
eq(leak, null, 'D1 钱包访问器新话术零中英混排（漏: ' + leak + '）');
assert(src('tests/run-all.sh').indexOf('wave95-core-fixes-node.js') >= 0, 'D2 本套已挂全量回归');

console.log('\n========== 第九十五波 · 核心修复 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
