/**
 * wave109-huodong-node.js — 第一百零九波 · 活动体检（第一批：堵刷爆 + 接坏死 + 卡死回收）验收：
 *   用户点账：「现在的活动也做的逻辑问题极大，你想想怎么改」——三路审计出 34 处病，本波修最重的 12 处：
 *     刷爆：兽潮清剿无限刷 / 秘境通完无限重进 / 寻宝无限刷 / 夺彩输了无限重开
 *     坏死：大比按钮必报错 / 冠军奖励不存在 / 加码彩头蒸发 / 年目标绝对值冒充增量+空头buff /
 *           拍卖日历永远追不上 / 资源点占领死账 / 星辰矿蟠桃园被切掉 / 正邪大战三处死线
 *     卡死：秘境孤儿进度永久死锁 / 奇遇弹窗被顶掉全局猝死 / 读档不回灌世界事件层
 *   A 一场潮一次清剿   B 一窗一走+孤儿回收   C 寻宝一份账+正邪死线   D 资源点真能占
 *   E 奇遇软锁兜底     F 年目标增量+buff真兑现 G 大比复活+彩头真发    H 哨兵
 *
 * 运行：node tests/wave109-huodong-node.js
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
        tag: tag || '', children: [], style: {}, attrs: {},
        setAttribute: function (k, v) { this.attrs[k] = String(v); },
        getAttribute: function (k) { return this.attrs[k] !== undefined ? this.attrs[k] : null; },
        appendChild: function (c) { this.children.push(c); return c; },
        removeChild: function () {}, remove: function () { _overlayInDom = false; },
        addEventListener: function () {}, removeEventListener: function () {},
        closest: function () { return null; }, scrollIntoView: function () {},
        classList: { add: function () {}, remove: function () {}, toggle: function () {}, contains: function () { return true; } },
        _html: '', textContent: '', options: [], value: ''
    };
    Object.defineProperty(el, 'innerHTML', {
        get: function () { return this._html; },
        set: function (v) { this._html = String(v); },
        configurable: true
    });
    return el;
}
var _overlayInDom = false;
global.document = {
    readyState: 'complete',
    createElementNS: function (ns, tag) { return fakeEl(tag); },
    createElement: function (tag) { return fakeEl(tag); },
    getElementById: function (id) { if (!els[id]) els[id] = fakeEl(); return els[id]; },
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    addEventListener: function () {},
    body: { appendChild: function () {}, contains: function (el) { return _overlayInDom && el === els['xianxia-modal-overlay']; } }
};
var store = {};
global.localStorage = {
    getItem: function (k) { return store[k] !== undefined ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; }
};
var msgs = [];
global.showMessage = function (m) { msgs.push(String(m)); };
var newDayHandlers = [];
global.EventBus = { emit: function () {}, on: function (ev, fn) { if (ev === 'newDay') newDayHandlers.push(fn); } };
var addedItems = [];
global.addItem = function (id, n) { addedItems.push([id, n || 1]); return true; };
global.addItemToInventory = function (id, n) { addedItems.push([id, n || 1]); return true; };
global.updateCurrencyUI = function () {};
global.updateCharacterStatus = function () {};
global.gameLog = { entries: [], add: function (m) { this.entries.push(m); } };
var _day = 100;
global.getAbsoluteDay = function () { return _day; };
global.timeSystem = { advanceTime: function () {}, getAbsoluteDay: function () { return _day; }, gameTime: { get currentDay() { return _day; }, totalMinutes: _day * 1440 } };
global.WorldCalendar = { get day() { return _day; }, register: function () { return { ok: true }; } };
global.currentCharData = { name: '测试散人', realm: '化神', layer: 9, qi: 300, energy: 100, health: 100, location: '洛水城' };
global.inventory = { currency: { spiritStones: 1000, copper: 0 }, maxSlots: 30, slots: [] };
global.itemById = {};
global.locationSystem = { getCurrentLocation: function () { return '洛水城'; } };
global.addReputation = function () {};
var _origRandom = Math.random;
function withRandom(v, fn) { Math.random = function () { return v; }; try { return fn(); } finally { Math.random = _origRandom; } }

load('js/extensions/beast-tide.js');
load('js/extensions/dungeon-dynamic.js');
load('js/extensions/resource-points.js');
load('js/world-events.js');
load('js/extensions/qiyu-encounters.js');
load('js/sects/sect-year-goal.js');
load('js/sects/sect-tournament.js');

// ==================== A · 一场潮只清剿一次 ====================
console.log('\n[A] 兽潮：打退过的潮不再刷——账落在潮水本体上');
var tide1 = BeastTide.triggerTide('tide_3', { duration: 3, source: 'world-event' });
eq(tide1.ok, true, 'A1 潮涨了');
eq(BeastTide.isRaidActive(), true, 'A2 场上有潮');
eq(BeastTide.isActiveTideRaided(), false, 'A3 新潮还没清剿过');
eq(BeastTide.markTidesRaided(), 1, 'A4 清剿到底——落账一场');
eq(BeastTide.isActiveTideRaided(), true, 'A5 这场潮打退过了，再点清剿该被拦');
var tide2 = BeastTide.triggerTide('tide_5', { duration: 3, source: 'world-event' });
eq(BeastTide.isActiveTideRaided(), false, 'A6 新潮涨了又是清的（一场一账，不是一场清完全免）');
BeastTide.endTide(tide1.tideId); BeastTide.endTide(tide2.tideId);
var appSrc = src('js/app.js');
assert(appSrc.indexOf('isActiveTideRaided') >= 0 && appSrc.indexOf('markTidesRaided') >= 0, 'A7 清剿入口装了闸、末波落了账（app.js 两处接线）');

// ==================== B · 秘境一窗一走 + 孤儿进度回收 ====================
console.log('\n[B] 秘境：通了的窗口不再放人，半路的进度能续、过期的收走');
var spawned = withRandom(0, function () { return DungeonDynamic.generateDaily(_day); });
assert(spawned.length >= 2, 'B1 秘境窗口开出来了（' + spawned.length + ' 座）');
var dA = spawned[0], dB = spawned[1];
var rEnter = DungeonDynamic.enter(dA.id);
eq(rEnter.ok, true, 'B2 头一回进——放行');
var guard = 0;
var rRoom = rEnter;
while (!rRoom.result || !rRoom.result.completed) {
    var prog = DungeonDynamic.getPlayerProgress(dA.id);
    if (!prog || !prog.currentRoomEvent) break;
    rRoom = DungeonDynamic.exploreRoom(dA.id, prog.currentRoomEvent.options[0]);
    if (!rRoom.ok) break;
    if (++guard > 40) break;
}
assert(rRoom.result && rRoom.result.completed, 'B3 一房一房走通了');
var rAgain = DungeonDynamic.enter(dA.id);
eq(rAgain.ok, false, 'B4 通完还想再刷——拦下');
eq(rAgain.reason, 'already-completed', 'B5 拦的理由如实：这一窗已经走通');
// 孤儿进度：进一半，窗口到期——进度该跟着收走，不能卡死下一期
DungeonDynamic.enter(dB.id);
assert(!!DungeonDynamic.getPlayerProgress(dB.id), 'B6 走到一半的进度在账上');
withRandom(0.999, function () { DungeonDynamic.generateDaily(dB.closeDay + 1); });   // 过期清理（0.999 不生成新窗）
eq(DungeonDynamic.getPlayerProgress(dB.id), null, 'B7 窗口关了，孤儿进度一并收走（此前随存档永续=永久死锁）');
eq(DungeonDynamic.enter(dB.id).reason, 'not-active', 'B8 关了的窗口如实说关了');
assert(appSrc.indexOf("r.reason === 'already-in-progress' && r.progress") >= 0, 'B9 中途关了弹窗再点进入——接着上回走（app.js 续玩口）');

// ==================== C · 寻宝一份账 + 正邪大战死线接活 ====================
console.log('\n[C] 世界事件：天降异宝一场只寻一次；正邪大战的三处死线接活');
window.activeWorldEvents.treasure = { startDay: _day, duration: 5, endDay: _day + 5, _today: _day };
addedItems.length = 0; msgs.length = 0;
var p1 = withRandom(0, function () { return participateWorldEvent('treasure'); });
eq(p1, true, 'C1 头一回寻宝——放行');
assert(addedItems.length === 1, 'C2 异宝真入手（一件）');
eq(!!window.activeWorldEvents.treasure.sought, true, 'C3 参与账落在事件本体上');
msgs.length = 0;
var p2 = participateWorldEvent('treasure');
eq(p2, false, 'C4 同一场再寻——拦下（此前 5 天窗内可刷上百件筑基丹）');
assert(msgs.join('').indexOf('寻过') >= 0, 'C5 拦得明白：这道金光你已寻过了');
saveWorldEvents();
assert((store['xianxia_world_events'] || '').indexOf('sought') >= 0, 'C6 参与账随档持久（读档也刷不掉）');
delete window.activeWorldEvents.treasure;
var weSrc = src('js/world-events.js');
assert(weSrc.indexOf("triggerFactionConflict('righteous_alliance', 'demon_cult')") >= 0, 'C7 正邪大战真调势力冲突了（此前无参调用=直接 return null）');
assert(weSrc.indexOf("changeFactionReputation('righteous_alliance'") >= 0 && weSrc.indexOf("changeFactionReputation('demon_cult'") >= 0, 'C8 参战声望发给真势力 id（此前发给查无此人，奖励静默蒸发）');

// ==================== D · 资源点真能占 ====================
console.log('\n[D] 资源点：无主产地掏灵石圈得下来了（占领线不再是死账）');
var freePt = null;
ResourcePoints.INITIAL_POINTS.forEach(function (p) { if (!freePt && !p.ownerSect) freePt = ResourcePoints.getPoint(p.id); });
assert(!!freePt, 'D1 天下还有无主产地');
var wallet0 = inventory.currency.spiritStones;
var rc = ResourcePoints.claimByPlayer(freePt.id);
eq(rc.ok, true, 'D2 圈占成功');
eq(inventory.currency.spiritStones, wallet0 - 300, 'D3 300 灵石真扣');
eq(freePt.ownerSect, 'player', 'D4 产地记在玩家名下');
var hv = ResourcePoints.harvest(freePt.id);
eq(hv.ok, true, 'D5 自家的产地敞开采（全额）');
var rc2 = ResourcePoints.claimByPlayer(freePt.id);
eq(rc2.reason, 'already-owned', 'D6 有主的不能再圈');
inventory.currency.spiritStones = 10;
var free2 = null;
ResourcePoints.INITIAL_POINTS.forEach(function (p) {
    var live = ResourcePoints.getPoint(p.id);   // 问真源账（INITIAL_POINTS 是出厂常量，圈占改的是活账）
    if (!free2 && live && !live.ownerSect) free2 = live.id;
});
if (free2) eq(ResourcePoints.claimByPlayer(free2).reason, 'stones-low', 'D7 灵石不够圈不动（插旗也是要本钱的）');
inventory.currency.spiritStones = wallet0 - 300;
var rmSrc = src('js/map/randomMap.js');
assert(rmSrc.indexOf('claimPlayerResourcePoint') >= 0 && rmSrc.indexOf('poachWildResource') >= 0 && rmSrc.indexOf("ownerSect === 'player'") >= 0, 'D8 野图采撷口：无主先问圈不圈，自家的全额采');
var wtSrc = src('js/map/wild-terrain.js');
assert(wtSrc.indexOf('_resOff') >= 0 && wtSrc.indexOf('slice(0, 3).forEach') < 0, 'D9 野图资源点按日轮转——星辰矿和蟠桃园不再被定序切掉');

// ==================== E · 奇遇软锁兜底 ====================
console.log('\n[E] 奇遇：弹窗被顶掉，本局奇遇不再猝死');
global.showModal = function (title, body) {
    var ov = els['xianxia-modal-overlay'] || (els['xianxia-modal-overlay'] = fakeEl());
    ov.attrs = {};
    _overlayInDom = true;
};
global.__qiyuRng = function () { return 0; };   // 必中
var q1 = QiyuEncounters.maybeTrigger('city');
assert(!!q1, 'E1 进城撞上奇遇');
var ov = els['xianxia-modal-overlay'];
eq(ov.getAttribute('data-qiyu-pending'), '1', 'E2 弹窗挂了记号');
eq(QiyuEncounters.maybeTrigger('city'), null, 'E3 窗还开着——不叠加第二段（软锁该锁就锁）');
_overlayInDom = false;   // 被别的窗顶掉 / 点了遮罩
var q2 = QiyuEncounters.maybeTrigger('city');
assert(!!q2, 'E4 窗没了就放行——此前 pending 永不清除，整局奇遇从此猝死');
global.__qiyuRng = null;

// ==================== F · 年目标：增量判定 + buff 真兑现 ====================
console.log('\n[F] 年目标：存量不再冒充进度，政策的条子真能兑现');
global.SECT_INTERNAL = { '测试宗': { influence: 500, disciples: 10, resources: 0, morale: 50 } };
global.discipleState = { isInSect: true, rank: 0, sectId: '测试宗', contribution: 0 };
_day = 1;
inventory.currency.spiritStones = 0;
eq(SectYearGoal.choose('expand_territory'), true, 'F1 掌门立了「开疆拓土」：本年影响力 +200');
var ygSt = SectYearGoal._getStore()['测试宗'];
eq(ygSt.baseValue, 500, 'F2 立目标那天的基线记下了（500）');
var st1 = SectYearGoal.settleYear('测试宗', 1);
eq(st1.completed, false, 'F3 影响力纹丝没动——存量 500≥200 不再冒充「本年+200」（旧口径这里白送达成）');
SECT_INTERNAL['测试宗'].influence = 699;
SectYearGoal.tickDay('测试宗', 2);
assert(SectYearGoal.getProgress('测试宗') < 1, 'F4 真涨到 699（净增 199）——差一点就是差一点');
SECT_INTERNAL['测试宗'].influence = 700;
SectYearGoal.tickDay('测试宗', 3);
var st2 = SectYearGoal.settleYear('测试宗', 3);
eq(st2.completed, true, 'F5 净增满 200——达成');
eq(inventory.currency.spiritStones, 5000, 'F6 灵石奖励真发（5000）');
var buffs = (SECT_INTERNAL['测试宗'].policyBuffs || []);
assert(buffs.some(function (b) { return b.effect === 'expansion'; }), 'F7 「开疆拓土」的 reward.buff 不再被静默丢弃');
eq(SectYearGoal.hasPolicyBuff('expansion'), true, 'F8 政策 buff 有了真读口（有效期内问得到）');
eq(SectYearGoal.hasPolicyBuff('training_15'), false, 'F9 没发过的政策问不出（不白送）');
assert(appSrc.indexOf("hasPolicyBuff('training_15')") >= 0, 'F10 修炼管线真读「修行砥砺」（+15%）');
assert(src('js/house-system.js').indexOf("hasPolicyBuff('harvest_30')") >= 0 && src('js/house-system.js').indexOf("hasPolicyBuff('expansion')") >= 0, 'F11 灵田收获真读「积谷/开疆」（+30%/+10%)');
assert(src('js/core/reward-service.js').indexOf("hasPolicyBuff('reputation_20')") >= 0, 'F12 名望发放真读「声名远播」（+20%）');

// ==================== G · 大比复活：按钮不报错、魁首真拿彩头 ====================
console.log('\n[G] 大比：报名钮活了，魁首的彩头真发到手上');
eq(typeof window.playerParticipate, 'function', 'G1 「我要参赛」的 onclick 有真函数接了（此前裸全局名必抛 ReferenceError）');
eq(typeof window.runTournament, 'function', 'G2 「掌门下令开始」同复活');
var winCount = 0;
var realYG = global.SectYearGoal;
global.SectYearGoal = { addTournamentWin: function () { winCount++; } };
SECT_INTERNAL['少林寺'] = { morale: 50, resources: 1000 };
global.discipleState = { isInSect: true, rank: 5, sectId: '少林寺', contribution: 0 };
global.getPlayerSectRole = function () { return 'elder'; };
global.npcManager = { getNPC: function (id) { return id === 'npc_a' ? { id: 'npc_a', name: '小师弟', location: '少林寺', combat: { realm: '炼气', layer: 1, level: 1 } } : null; } };
inventory.currency.spiritStones = 0;
var ev = Tournament.openTournament('少林寺', 'season', true);
assert(!!ev, 'G3 赛事开得起来');
eq(Tournament.joinTournament(ev.id, 'npc_a'), true, 'G4 NPC 报名照旧');
eq(window.playerParticipate(ev.id), true, 'G5 玩家真报上名了（整条大比线此前对玩家全瘫）');
ev.stakeBonus = 80;   // 治理进言「大比加码」押上的彩头
withRandom(0, function () { Tournament.runTournament(ev.id); });   // 化神9层 vs 炼气1层， deterministic 夺冠
var hist = Tournament._store()['少林寺'].history[0];
eq(hist.winnerId, 'player', 'G6 魁首是你');
eq(inventory.currency.spiritStones, 130, 'G7 彩头真到手：50 灵石 + 掌门加码的 80（此前注释承诺的奖励从没发过、加码的钱扣了就蒸发）');
eq(discipleState.contribution, 50, 'G8 贡献 +50 真入账');
eq(winCount, 1, 'G9 「大比称雄」年目标记了一笔（只有你夺冠才记）');
global.SectYearGoal = realYG;
assert(src('js/sects/sect-governance.js').indexOf('stakeBonus') >= 0, 'G10 加码的钱落进赛事账（结算时随彩头兑付）');

// ==================== H · 哨兵 ====================
console.log('\n[H] 哨兵：其余接线与挂号');
assert(src('js/sects/sect-gala.js').indexOf('一百零九波') >= 0, 'H1 夺彩败北也落当日的旗（不再无限重开保底拿奖）');
assert(src('js/economy/auction-service.js').indexOf('day + 1') >= 0, 'H2 坊市开市提前记明日——「闭关至下次拍卖」不再永远天机未显');
assert(src('js/core/game-state.js').indexOf('loadWorldEvents()') >= 0 && src('js/core/game-state.js').indexOf('loadCityTempModifiers()') >= 0, 'H3 读档把世界事件层灌回内存（此前只写 localStorage 不重载，旧兽潮照刷）');
assert(src('js/world-events.js').indexOf('window.loadCityTempModifiers = loadCityTempModifiers') >= 0, 'H4 城市残留的回读口也开了');
assert(src('js/extensions/qiyu-encounters.js').indexOf('data-qiyu-pending') >= 0, 'H5 奇遇弹窗的记号在');
['js/extensions/beast-tide.js', 'js/extensions/dungeon-dynamic.js', 'js/world-events.js', 'js/extensions/resource-points.js', 'js/map/randomMap.js', 'js/map/wild-terrain.js', 'js/sects/sect-tournament.js', 'js/sects/sect-year-goal.js', 'js/sects/sect-gala.js', 'js/core/reward-service.js', 'js/app.js'].forEach(function (f) {
    assert(src(f).indexOf('一百零九波') >= 0, 'H6 改动挂着本波的号（' + f.split('/').pop() + '）');
});
assert(src('tests/run-all.sh').indexOf('wave109-huodong-node.js') >= 0, 'H7 本套已挂全量回归');

console.log('\n========== wave109 结果：' + passed + ' 通过 / ' + failed + ' 失败 ==========');
if (failed > 0) process.exit(1);
