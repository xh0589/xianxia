/**
 * wave106-shanli-node.js — 第一百零六波 · 山里有日子 验收：
 *   用户点账：「你觉得还缺少啥」→ 全选「都做」——四块空白一次补：
 *     一 洞府里有生活：知己登门、灵兽入驻、晨昏山景，全记起居注（随宅子存档）
 *     二 七处洞天各有脾气：每座山一条地脉，落户/迁址成为真抉择
 *     三 采集线做深：地脉管采药/采矿/伐木/灵兽训练；星辰铁多一个老矿工的眼力口子
 *     四 成就墙补完：知己档+采集档成就、隐藏成就给剪影、旧档白送的两枚复审熄灭
 *   A 地脉：七座山各有一条脉；吃哪条脉看宅基；迁址即换脉
 *   B 采集线：三处采集与灵兽训练都接地脉；星辰铁认手艺不认白捡
 *   C 起居注：破山洞请不起客；知己登门有茶灶才有回礼；人在他乡日子不写给你看
 *   D 面板：静室挂起居注、倍率签挂地脉、择址卡把山的脾气写在脸上
 *   E 成就墙：知己档/采集档真点亮；隐藏剪影给方向；白送复审摘名分不追缴奖励
 *   F 哨兵：各处改动挂本波号、老口径未动、挂全量回归
 *
 * 运行：node tests/wave106-shanli-node.js
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
function near(a, b, msg) { assert(Math.abs(a - b) < 1e-9, msg + '（实际=' + a + ' 期望≈' + b + '）'); }
function load(rel) { vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel }); }
function src(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ==================== 第一间沙盒：山居世界（global 直载，与 wave104 同款桩） ====================
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
global.showMessage = function (m) { msgs.push(String(m)); };
global.updateCurrencyUI = function () {};
global.updateCharacterStatus = function () {};
var newDayHandlers = [];
global.EventBus = { emit: function () {}, on: function (ev, fn) { if (ev === 'newDay') newDayHandlers.push(fn); } };
var addedItems = [];
global.addItem = function (id, n) { addedItems.push([id, n]); return true; };
global.addItemToInventory = function (id, n) { addedItems.push([id, n]); return true; };
global.growLifeSkill = function () {};
global.addProfessionExp = function () {};
global.getLifeSkill = function () { return 0; };
var journalRecs = [];
global.WorldJournal = { record: function (e) { journalRecs.push(e); return { ok: true }; } };
global.itemById = { mat_lingzhi: { name: '灵芝' }, mat_spirit_grass: { name: '灵草' }, mat_ginseng: { name: '人参' }, mat_bamboo: { name: '灵竹' } };

var _day = 100;
global.getAbsoluteDay = function () { return _day; };
var advanced = [];
global.timeSystem = { advanceTime: function (m, r) { advanced.push([m, r]); }, getAbsoluteDay: function () { return _day; } };

var _cur = '洛水城';
global.locationSystem = { getCurrentLocation: function () { return _cur; } };
global.openWildernessMap = function () {};

global.inventory = { currency: { spiritStones: 200000 }, maxSlots: 30, slots: [] };
for (var _i = 0; _i < 8; _i++) global.inventory.slots.push({ templateId: 'mat_lingzhi', count: 2 });
function give(itemId, count) { global.inventory.slots.push({ itemId: itemId, templateId: itemId, count: count }); }

global.CULTIVATE_DURATIONS = [
    { id: 'short', label: '5分钟', shortLabel: '5m', minutes: 5, multiplier: 1, qiCost: 5 }
];
global.currentCharData = { qi: 300, energy: 100, health: 100 };
global.MoodSystem = {
    label: function () { return '心平气和'; },
    moodNow: function () { return 62; },
    cultivationMul: function () { return 1.1; },
    cultivationNote: function () { return ''; }
};

load('js/regions.js');
load('js/map/world-map.js');
load('js/house-system.js');
load('js/extensions/cave-facilities.js');
load('js/extensions/cave-life.js');
load('js/house-panel.js');

var HP = global.HousePanelUI;
function renderPanel() {
    var c = fakeEl('div'), s = fakeEl('div');
    HP.render(c, s);
    return c.innerHTML;
}
function resetHouse() { importHouseState(null); }
// 可控的随机：按队列出数，用尽后一律 0.99（什么都触发不了）
function rngQueue(vals) {
    var i = 0;
    CaveLife.setRng(function () { return i < vals.length ? vals[i++] : 0.99; });
}

// ==================== A · 地脉：七座山各有脾气 ====================
console.log('\n[A] 地脉：住哪座山吃哪条脉，迁址即换脉');
var SITES = global.CAVE_SITES;
var siteIds = Object.keys(SITES);
eq(siteIds.length, 7, 'A1 天下洞天七处不变');
var leyKinds = {};
var leyOk = siteIds.every(function (sid) {
    var l = SITES[sid].ley;
    if (!l || !l.kind || !(l.pct > 0) || !l.name || !l.text) return false;
    leyKinds[l.kind] = (leyKinds[l.kind] || 0) + 1;
    return true;
});
assert(leyOk, 'A2 七座山各有一条地脉（kind/pct/name/text 齐全）');
eq(Object.keys(leyKinds).length, 7, 'A3 七条脉各养一桩营生，互不重样');
resetHouse();
eq(claimRuin(), true, 'A4 洛水城起步——宅基落中州太虚山麓');
eq(getCaveLey().name, '中脉', 'A5 自家洞天的地脉：中脉');
near(getCaveLeyBonus('cultivation'), 1.05, 'A6 中脉养修炼（+5%）');
near(getHouseBonus('cultivation'), 1.05, 'A7 破山洞底子是 1.0——修炼倍率里真算进了地脉');
near(getCaveLeyBonus('mining'), 1, 'A8 中脉不管采矿——别的营生如实回 1');
eq(relocateHouse('hanshuang'), true, 'A9 迁去寒霜崖窟（破山洞迁址免费）');
near(getCaveLeyBonus('mining'), 1.15, 'A10 换山即换脉：矿脉养采矿（+15%）');
near(getHouseBonus('cultivation'), 1.0, 'A11 中脉的修炼加成随迁址走了');
relocateHouse('danxia');
near(getHouseBonus('alchemy'), 1.08, 'A12 丹霞的丹火养丹炉（炼丹 +8%）');
relocateHouse('taixu');

// ==================== B · 采集线接线（源码哨兵：消费端在 app.js / world-loop.js） ====================
console.log('\n[B] 采集线：地脉接到镐头斧头药篓上，星辰铁认手艺');
var appSrc = src('js/app.js');
var wlSrc = src('js/core/world-loop.js');
assert(appSrc.indexOf("getCaveLeyBonus('herb')") >= 0, 'B1 采药吃地脉（苍林药香 +15%）');
assert(appSrc.indexOf("getCaveLeyBonus('mining')") >= 0, 'B2 采矿吃地脉（寒霜矿脉 +15%）');
assert(appSrc.indexOf("getCaveLeyBonus('wood')") >= 0, 'B3 伐木吃地脉（青城林海 +15%）');
assert(wlSrc.indexOf("getCaveLeyBonus('beast')") >= 0, 'B4 灵兽训练吃地脉（雾屿兽缘 +20%）');
assert(appSrc.indexOf('miningSkill >= 60') >= 0 && appSrc.indexOf("mat_star_iron'") >= 0, 'B5 星辰铁多了个口子：采伐手艺 60 往上才认得出矿脉深处的星辉');
assert(src('js/items-extended/04-materials.js').indexOf('mat_star_iron') >= 0, 'B6 星辰铁的物品账原本就在（不用新造）');
assert(appSrc.indexOf('一百零六波') >= 0 && wlSrc.indexOf('一百零六波') >= 0, 'B7 采集两处接线都挂着本波的号');

// ==================== C · 起居注：洞府里的日子 ====================
console.log('\n[C] 起居注：知己登门、灵兽打滚、晨昏山景——人在他乡不写给你看');
var closeCrowd = {
    getAllNPCs: function () {
        return [
            { id: 'n1', name: '李青莲', relationship: { affection: 65 } },
            { id: 'n2', name: '王樵夫', relationship: { affection: 30 } }
        ];
    }
};
global.npcManager = closeCrowd;
resetHouse();
var t0 = CaveLife.tickDay();
eq(t0.skipped, 'no-house', 'C1 无宅之人没有洞府的日子');
claimRuin();
CaveLife.getDiary().length = 0;
rngQueue([0.1]);
_day = 101;
var t1 = CaveLife.tickDay();
eq(t1.scenes, 1, 'C2 破山洞的日子：石壁漏风（请不起客也养不住兽）');
assert(CaveLife.getDiary()[0].text.indexOf('石壁漏风') >= 0 && CaveLife.getDiary()[0].kind === 'scene', 'C3 漏风的账记进了起居注');
relocateHouse('hanshuang');
var diaryBefore = CaveLife.getDiary().length;
rngQueue([0.01, 0.01, 0.01]);
var t2 = CaveLife.tickDay();
eq(t2.skipped, 'away', 'C4 人在中州、宅在北冥——洞府的日子不写给你看');
eq(CaveLife.getDiary().length, diaryBefore, 'C5 他乡的日子里起居注一笔未添');
// 迁回来、修成真宅院、备下茶灶客房兽栏
relocateHouse('taixu');
give('mat_wood', 20); give('mat_iron_ore', 10);
eq(repairHouse('cave'), true, 'C6 修缮成简易洞府——这才请得起客');
CaveFacilities.ensureCave('player', 'spirit_manor');
CaveFacilities.install('player', 'fac_tea_stove');
CaveFacilities.install('player', 'fac_guest_room');
CaveFacilities.install('player', 'fac_beast_pen');
addedItems.length = 0; journalRecs.length = 0; msgs.length = 0;
rngQueue([0.1]);   // 访 0.1<0.5（客房提了概率）必来；余数 0.99 都触发不了
_day = 102;
var t3 = CaveLife.tickDay();
eq(t3.scenes, 1, 'C7 知己登门——今天这一桩是访');
var diary3 = CaveLife.getDiary();
var last3 = diary3[diary3.length - 1];
eq(last3.kind, 'visit', 'C8 起居注如实记：知己来访');
assert(last3.text.indexOf('李青莲') >= 0, 'C9 来的是好感≥60 的李青莲（好感 30 的王樵夫还不够知己）');
assert(last3.text.indexOf('回赠') >= 0, 'C10 茶灶待客——知己带了山货回礼');
eq(addedItems.length, 1, 'C11 回礼真入行囊（一件）');
eq(journalRecs.length, 1, 'C12 登门是大事——记进天下见闻');
eq(journalRecs[0].type, 'cave_visit', 'C13 见闻账的类目：cave_visit');
assert(msgs.some(function (m) { return m.indexOf('🏡') >= 0; }), 'C14 当天的日子也弹一条给你看');
// 没有茶灶：来了也只有清谈，没有回礼
CaveFacilities.uninstall('player', CaveFacilities.getFacilities('player').filter(function (f) { return f.facilityId === 'fac_tea_stove'; })[0].slot);
addedItems.length = 0;
rngQueue([0.05]);
var t4 = CaveLife.tickDay();
eq(t4.scenes, 1, 'C15 拆了茶灶客还来（两成五的机会撞上了）');
assert(addedItems.length === 0, 'C16 没茶灶就没回礼——待客之道看设施');
// 灵兽的日子
global.tamedBeasts = [{ templateId: 'fox', name: '赤狐', petName: '小红' }];
rngQueue([0.99, 0.1]);   // 客不来（0.99>0.25），兽栏里有动静（0.1<0.35）
var t5 = CaveLife.tickDay();
var last5 = CaveLife.getDiary()[CaveLife.getDiary().length - 1];
eq(last5.kind, 'beast', 'C17 灵兽在院里打滚——记的是兽栏里住着的');
assert(last5.text.indexOf('小红') >= 0, 'C18 用的是你叫它的名');
// 起居注封顶
for (var di = 0; di < 40; di++) CaveLife.addDiary('第' + di + '笔', 'scene');
eq(CaveLife.getDiary().length, 30, 'C19 起居注记满 30 条滚动（旧账挪出去，新账记得下）');
assert(CaveLife.getDiary()[29].text.indexOf('39') >= 0, 'C20 滚出去的是最早的，留下的是最近的');
// 晨昏山景随山走：宅迁去青城后山，人也得跟着到蜀地——在家才有日子
relocateHouse('qingcheng');
_cur = '剑阁';
CaveFacilities.getFacilities('player').slice().forEach(function (f) { CaveFacilities.uninstall('player', f.slot); });
global.tamedBeasts = [];
rngQueue([0.99, 0.1]);   // 无客无兽，只出山景
var t6 = CaveLife.tickDay();
var last6 = CaveLife.getDiary()[CaveLife.getDiary().length - 1];
eq(last6.kind, 'scene', 'C21 青城后山的日子——晨昏山景');
assert(/松|雾|木香/.test(last6.text), 'C22 山景写的是这座山的性子（林海脉的话头）');
_cur = '洛水城';
relocateHouse('taixu');

// ==================== D · 面板 ====================
console.log('\n[D] 面板：起居注挂静室、地脉挂签、择址卡把山的脾气写在脸上');
HP._cancelSite(); HP.selectTab('jing');
var htmlD = renderPanel();
assert(htmlD.indexOf('📜 起居注') >= 0, 'D1 静室里挂着起居注');
assert(htmlD.indexOf('地脉·中脉 +5%') >= 0, 'D2 修炼倍率的明细签上多了地脉这一项');
HP._pickSite('relocate');
var htmlS = renderPanel();
['中脉', '药香', '丹火', '金气', '矿脉', '林海', '兽缘'].forEach(function (ln) {
    assert(htmlS.indexOf('地脉「' + ln + '」') >= 0, 'D3 择址卡把「' + ln + '」的脾气写在脸上');
});
HP._cancelSite();

// ==================== E · 成就墙（第二间沙盒：与 wave105 同款隔离口径） ====================
console.log('\n[E] 成就墙：知己档、采集档、隐藏剪影、白送复审');
var copperPool = 0, stonesPool = 0;
var toasts = [];
var elStore2 = {};
function fakeEl2(id) {
    if (!elStore2[id]) elStore2[id] = { id: id, innerHTML: '', textContent: '' };
    return elStore2[id];
}
var mockWindow = {
    console: { log: function () {} },
    JSON: JSON, Object: Object, Array: Array, Math: Math, Number: Number, isFinite: isFinite,
    gameLog: { entries: [], add: function () {} },
    showMessage: function (m) { toasts.push(String(m)); },
    currentCharData: {},
    XianXia: {},
    timeSystem: { onNewDaySubscribe: function () {} },
    REALM_CONFIG: { realms: [{ name: '炼气' }, { name: '筑基' }, { name: '金丹' }, { name: '元婴' }, { name: '化神' }, { name: '炼虚' }, { name: '合体' }, { name: '大乘' }, { name: '渡劫' }] },
    document: {
        querySelector: function () { return null; },
        querySelectorAll: function () { return []; },
        getElementById: function (id) { return fakeEl2(id); }
    },
    dayNow: 0
};
mockWindow.getRealmIndex = function (name) { return mockWindow.REALM_CONFIG.realms.findIndex(function (r) { return r.name === name; }); };
mockWindow.getAbsoluteDay = function () { return mockWindow.dayNow; };
mockWindow.XianXia.DataManager = {
    getCopper: function () { return copperPool; },
    setCopper: function (v) { copperPool = v; },
    getSpiritStones: function () { return stonesPool; },
    setSpiritStones: function (v) { stonesPool = v; }
};
mockWindow.RewardService = { apply: function () { return { success: true }; } };
mockWindow.window = mockWindow;
mockWindow.global = mockWindow;
var ctx = vm.createContext(mockWindow);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/core/event-bus.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/core/state-registry.js'), 'utf8'), ctx);
mockWindow.EventBus = ctx.EventBus;
mockWindow.StateRegistry = ctx.StateRegistry;
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/achievement-system.js'), 'utf8'), ctx);
var AS = mockWindow;
AS.initAchievementSystem();
var mgr = AS.achievementManager;

var pEmpty = AS.buildAchievementProfile();
eq(pEmpty.closeFriends, 0, 'E1 空世界知己 0 位（幽灵键防线：是数不是洞）');
eq(pEmpty.gatherSkill, 0, 'E2 空世界手艺 0（账读角色身上的生活技能）');
assert(!!mgr.getAchievement('friends_close') && !!mgr.getAchievement('gather_60') && !!mgr.getAchievement('gather_100'), 'E3 三枚新成就都在册（知己档+采集两档）');
eq(mgr.getAchievement('friends_close').requirements.closeFriends, 5, 'E4 海内存知己：五位知己的门槛');
AS.renderAchievementPanel();
var htmlE = elStore2['achievement-list'].innerHTML;
assert(htmlE.indexOf('？？？') >= 0 && htmlE.indexOf('线索藏在「游历」里') >= 0, 'E5 隐藏成就给了剪影——名字保密，方向如实（手识山河藏在游历里）');

function crowdOf(closeN, midN) {
    var arr = [];
    for (var i = 0; i < closeN; i++) arr.push({ name: '知己' + i, relationship: { affection: 60 + i } });
    for (var j = 0; j < midN; j++) arr.push({ name: '旧识' + j, relationship: { affection: 25 } });
    return { getAllNPCs: function () { return arr; } };
}
AS.npcManager = crowdOf(4, 10);
AS.checkAchievementsNow();
eq(mgr.getAchievement('friends_close').isCompleted, false, 'E6 四位知己差一位——不亮');
AS.npcManager = crowdOf(5, 10);
AS.checkAchievementsNow();
eq(mgr.getAchievement('friends_close').isCompleted, true, 'E7 第五位处成知己——海内存知己点亮');
AS.currentCharData = { lifeSkills: { '采伐': 60 } };
AS.checkAchievementsNow();
eq(mgr.getAchievement('gather_60').isCompleted, true, 'E8 采伐 60——老于山林点亮');
AS.currentCharData = { lifeSkills: { '采伐': 100 } };
AS.checkAchievementsNow();
eq(mgr.getAchievement('gather_100').isCompleted, true, 'E9 采伐圆满——手识山河点亮');

// 白送复审：旧档里被老口径点亮的两枚，按真交情复审后熄灭；奖励不追缴
AS.initAchievementSystem();
var mgr2 = AS.achievementManager;
AS.npcManager = crowdOf(0, 5);   // 五位旧识、零位知己——真实世界不够 10 位交好（旧档的点亮是白送的）
var sb = mgr2.getAchievement('social_butterfly');
sb.isCompleted = true; sb.isUnlocked = true; mgr2.recount();   // 模拟旧档：白送点亮过
var ptsBefore = mgr2.totalPoints;
var copperBefore = copperPool;
toasts.length = 0;
AS.checkAchievementsNow();
eq(sb.isCompleted, false, 'E10 复审后熄灭——名分摘了');
assert(mgr2.totalPoints === ptsBefore - sb.points, 'E11 积分账跟着完成集重算');
eq(copperPool, copperBefore, 'E12 已发的奖励不追缴（铜钱一分没动）');
assert(toasts.some(function (t) { return t.indexOf('复审') >= 0; }), 'E13 复审如实告诉你摘了哪枚');
// 人事账没就位时不许动手
AS.initAchievementSystem();
var mgr3 = AS.achievementManager;
var sb3 = mgr3.getAchievement('social_butterfly');
sb3.isCompleted = true; sb3.isUnlocked = true; mgr3.recount();
AS.npcManager = undefined;
AS.checkAchievementsNow();
eq(sb3.isCompleted, true, 'E14 人事账没就位——复审推迟，不误摘真成就');
eq(!!mgr3._freeAudited, false, 'E15 推迟就是推迟——复审旗没落');
AS.npcManager = crowdOf(0, 0);
AS.checkAchievementsNow();
eq(sb3.isCompleted, false, 'E16 人事账就位——复审补上');

// ==================== F · 哨兵 ====================
console.log('\n[F] 哨兵：各处挂号、老口径未动、挂全量回归');
assert(src('js/house-system.js').indexOf('一百零六波') >= 0, 'F1 地脉在 house-system 挂着本波的号');
assert(src('js/extensions/cave-life.js').indexOf('一百零六波') >= 0, 'F2 起居注模块挂着本波的号');
assert(src('js/house-panel.js').indexOf('一百零六波') >= 0, 'F3 面板挂着本波的号');
assert(src('js/achievement-system.js').indexOf('一百零六波') >= 0, 'F4 成就墙挂着本波的号');
var hsSrc = src('js/house-system.js');
assert(hsSrc.indexOf('price: 1000') >= 0 && hsSrc.indexOf('UPGRADE_RECIPES') >= 0, 'F5 老账未动（宅价/修缮图样原样）');
assert(newDayHandlers.length >= 1, 'F6 起居注接的是世界钟的 newDay（不自造日历）');
var v11 = src('tests/v20.11-achievements-node.js');
assert(v11.indexOf('ni < 65') >= 0 && v11.indexOf("'采伐': 100") >= 0, 'F7 满配世界已喂新真源（65 位侠客+采伐圆满）');
assert(src('tests/wave105-achv-node.js').indexOf('已点亮 0/9') >= 0, 'F8 上一波的类账口径已随人事类扩容更新');
assert(src('tests/run-all.sh').indexOf('wave106-shanli-node.js') >= 0, 'F9 本套已挂全量回归');

console.log('\n========== wave106 结果：' + passed + ' 通过 / ' + failed + ' 失败 ==========');
if (failed > 0) process.exit(1);
