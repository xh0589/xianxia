/**
 * wave107-duiwu-node.js — 第一百零七波 · 队伍体检 验收：
 *   用户点账：「你再看看队伍机制够不够」——审出五本病账三笔缺账，全修：
 *     病一 六阵型全是死账（getFormationBonuses 全库无人读）→ 攻/防/速/疗四本账真进战斗结算
 *     病二 队友永不成长（gainExp/levelUp 零调用）→ 战后真分历练 + 随世界日结同步 NPC 本体成长
 *     病三 装备是摆设（只读伤害类型）→ 兵刃防具的攻防与属性点真上身，战力不再虚高
 *     病四 死了还能再招（名录与人头对不上）→ 逝者已矣；NPC 侧也画线
 *     病五 忠诚是装饰条 → 随玩家行为真涨跌，凉透了连夜走
 *     缺账 起居注无同伴 / 队伍无成就 / 跨州不同步 → 全补
 *   A 阵型通电   B 装备做实   C 队友成长   D 生死忠诚   E 起居注同伴   F 队伍成就   G 哨兵
 *
 * 运行：node tests/wave107-duiwu-node.js
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
        _html: '', textContent: '', options: [], value: ''
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
global.switchPanel = function () {};
global.updateCurrencyUI = function () {};
global.updateCharacterStatus = function () {};
global.updateNPCStatus = function () {};
var newDayHandlers = [];
global.EventBus = { emit: function () {}, on: function (ev, fn) { if (ev === 'newDay') newDayHandlers.push(fn); } };
global.addItem = function () { return true; };
var advanced = [];
var _day = 200;
global.getAbsoluteDay = function () { return _day; };
global.timeSystem = { advanceTime: function (m, r) { advanced.push([m, r]); }, getAbsoluteDay: function () { return _day; } };
global.locationSystem = { getCurrentLocation: function () { return '洛水城'; } };
global.openWildernessMap = function () {};
global.currentCharData = { qi: 300, energy: 100, health: 100, location: '洛水城' };
global.inventory = { currency: { spiritStones: 50000 }, maxSlots: 30, slots: [], removeItem: function () {} };
global.MoodSystem = { label: function () { return '心平气和'; }, moodNow: function () { return 60; }, cultivationMul: function () { return 1; }, cultivationNote: function () { return ''; } };
global.CULTIVATE_DURATIONS = [{ id: 'short', label: '5分钟', shortLabel: '5m', minutes: 5, multiplier: 1, qiCost: 5 }];
global.itemById = {
    wpn_iron_sword: { id: 'wpn_iron_sword', name: '铁剑', attrs: { strength: 3, dexterity: 1 }, combatBonus: { attack: 6 }, damageType: 'slash' },
    arm_cloud_armor: { id: 'arm_cloud_armor', name: '云纹甲', attrs: { constitution: 15 }, defense: 40, combatBonus: { dodge: 20 } }
};
global.WorldJournal = { record: function () { return { ok: true }; } };

// NPC 桩：李青莲（可招募），王樵夫（好感不够）
var npcStore = {};
function makeNpc(id, name, affection, combat) {
    var n = {
        id: id, name: name, gender: 'male',
        relationship: { affection: affection, trust: 0 },
        combat: combat || { level: 3, realm: '炼气', layer: 2 },
        state: { health: 100, qi: 50, location: '洛水城' },
        mainAttributes: { strength: 12, dexterity: 10, intelligence: 10, constitution: 11, willpower: 9 },
        combatSkills: { '内功': 8, '剑法': 10 },
        skills: [], location: '洛水城', isFollowing: false, isDead: false,
        _actions: [],
        recordPlayerAction: function (a, t) { this._actions.push([a, t]); }
    };
    npcStore[id] = n;
    return n;
}
makeNpc('npc_li', '李青莲', 60);
makeNpc('npc_wang', '王樵夫', 30);
global.npcManager = {
    getNPC: function (id) { return npcStore[id] || null; },
    getAllNPCs: function () { return Object.keys(npcStore).map(function (k) { return npcStore[k]; }); }
};

load('js/regions.js');
load('js/map/world-map.js');
load('js/house-system.js');
load('js/extensions/cave-facilities.js');
load('js/extensions/cave-life.js');
load('js/party-system.js');

var PS = global.partySystem;
function member(id) { return PS.partyData.members.find(function (m) { return m.id === id; }); }
function lastMsg() { return msgs[msgs.length - 1] || ''; }
function rngQueue(vals) {
    var i = 0;
    CaveLife.setRng(function () { return i < vals.length ? vals[i++] : 0.99; });
}

// ==================== A · 阵型通电 ====================
console.log('\n[A] 阵型通电：队伍页面上的乘区，战斗改算单里真兑现');
msgs.length = 0;
eq(PS.recruitNPC('npc_wang'), false, 'A1 好感 30 请不动人（招募门槛 50 未破）');
eq(PS.recruitNPC('npc_li'), true, 'A2 好感 60 的李青莲入队');
var li = member('npc_li');
var mods0 = PS.getMemberBattleMods(li);
near(mods0.atkMul, 1, 'A3 标准阵不加不减（乘区 1）');
PS.changeFormation('attack');
var modsA = PS.getMemberBattleMods(li);
near(modsA.atkMul, 1.2, 'A4 攻击阵：攻 ×1.2 真进改算单');
near(modsA.defMul, 0.9, 'A5 攻击阵：防 ×0.9（有得必有失）');
near(modsA.spdMul, 1.1, 'A6 攻击阵：速 ×1.1');
PS.changeFormation('defense');
near(PS.getMemberBattleMods(li).defMul, 1.2, 'A7 防御阵：防 ×1.2');
PS.changeFormation('healing');
li.health = 40; li.qi = 10;
PS.restMember('npc_li');
eq(li.health, 40 + Math.round(30 * 1.3), 'A8 治疗阵：休息恢复真吃 ×1.3（此前 healing 全库无人读）');
PS.changeFormation('default');
var bSrc = src('js/battle.js');
assert((bSrc.match(/_memberMods/g) || []).length >= 5, 'A9 战斗侧三处乘区+实体挂载都消费改算单（_memberMods ≥5 处）');
assert(bSrc.indexOf('getMemberBattleMods') >= 0, 'A10 建队员实体真调改算单出口');

// ==================== B · 装备做实 ====================
console.log('\n[B] 装备做实：兵刃防具真上身，战力不再虚高');
PS.equipMember('npc_li', 'mainHand', { templateId: 'wpn_iron_sword', name: '铁剑' });
var modsB = PS.getMemberBattleMods(li);
eq(modsB.atkFlat, 6, 'B1 铁剑的攻击 +6 进改算单（此前只被读了伤害类型）');
eq(modsB.attrAdd.strength, 3, 'B2 剑上的力量 +3 也算（属性点真上身）');
PS.equipMember('npc_li', 'body', { templateId: 'arm_cloud_armor', name: '云纹甲' });
var modsB2 = PS.getMemberBattleMods(li);
eq(modsB2.defFlat, 40, 'B3 云纹甲的防御 +40 进改算单');
eq(modsB2.attrAdd.constitution, 15, 'B4 甲上的体质 +15 也算');
var power = PS.getPartyTotalPower();
assert(power > 0, 'B5 面板战力与实战改算从此一本账（战力 ' + power + '）');

// ==================== C · 队友成长 ====================
console.log('\n[C] 队友成长：打赢吃足历练，打输长记性，世界日结不掉队');
var lv0 = li.level, expMax0 = li.expMax;
var leveled = PS.grantBattleExp({ winner: 'player', enemy: { level: 5 } });
eq(li.exp, 30, 'C1 打赢 5 级敌——历练真分（5×6=30，此前 gainExp 全库零调用）');
eq(leveled.length, 0, 'C2 一场还升不了级（历练未满 300）');
for (var gi = 0; gi < 9; gi++) PS.grantBattleExp({ winner: 'player', enemy: { level: 5 } });
eq(li.level, lv0 + 1, 'C3 历练攒满真升级（levelUp 兑现：' + lv0 + '→' + li.level + '）');
assert(li.maxHealth > 100, 'C4 升级真长身体（maxHealth ' + li.maxHealth + '）');
var expAfterWin = li.exp;
PS.grantBattleExp({ winner: 'enemy', enemy: { level: 5 } });
eq(li.exp, expAfterWin + 10, 'C5 打输也长记性（败场历练减半：5×2=10）');
var expAfterLose = li.exp;
PS.grantBattleExp({ winner: 'player', noSpoils: true, enemy: { level: 5 } });
eq(li.exp, expAfterLose + 10, 'C6 敌人遁走一无所获——不算赢的账');
// 随世界日结同步：NPC 本体修到 5 级筑基，队伍分身跟上
npcStore['npc_li'].combat = { level: 5, realm: '筑基', layer: 3 };
var grew = PS.syncWithWorld();
eq(li.level, 5, 'C7 NPC 本体长进——队伍分身同步跟上（5 级）');
eq(li.realm, '筑基', 'C8 境界账也同步（筑基）');
assert(grew.length === 1, 'C9 长进了就如实报一声');
// 战绩账
var tb0 = PS.partyData.totalBattles, wb0 = PS.partyData.wonBattles;
PS.finalizeBattleOutcome({ winner: 'player', enemy: { level: 1 } });
eq(PS.partyData.totalBattles, tb0 + 1, 'C10 队伍战绩真记账（此前 totalBattles 全库无人写）');
eq(PS.partyData.wonBattles, wb0 + 1, 'C11 赢的也记');

// ==================== D · 生死忠诚 ====================
console.log('\n[D] 生死忠诚：逝者已矣，凉透了的人连夜走');
// 再招两位凑生死账
makeNpc('npc_zhao', '赵铁衣', 70); makeNpc('npc_sun', '孙小蝶', 55);
PS.recruitNPC('npc_zhao'); PS.recruitNPC('npc_sun');
var zhao = member('npc_zhao');
var loy0 = zhao.relationship.loyalty;
zhao.battleLastTakenDamage = 60; zhao.health = 20; zhao.maxHealth = 100;
PS.processPostBattleRelationships({ winner: 'enemy' });
eq(zhao.relationship.loyalty, loy0 - 5, 'D1 重伤没人管——忠诚真跌 5');
zhao.battleLastTakenDamage = 0;
PS.processPostBattleRelationships({ winner: 'player' });
eq(zhao.relationship.loyalty, loy0 - 5 + 1, 'D2 并肩打赢一场——人心热一点（+1）');
// 战死：除名、入名录（带 id）、NPC 侧画线
var sun = member('npc_sun');
sun._diedThisBattle = true; sun.health = 0;
msgs.length = 0;
var out = PS.finalizeBattleOutcome({ winner: 'enemy', enemy: { level: 9 } });
eq(out.fallen.length, 1, 'D3 战死者从名单除名');
var fallenRec = PS.partyData.fallen[PS.partyData.fallen.length - 1];
eq(fallenRec.id, 'npc_sun', 'D4 名录记 id——不再是一笔对不上人头的糊涂账');
eq(npcStore['npc_sun'].isDead, true, 'D5 NPC 那一侧也画线：人不能在世界里照常活蹦乱跳');
eq(npcStore['npc_sun'].isFollowing, false, 'D6 跟随状态一并收掉');
eq(PS.recruitNPC('npc_sun'), false, 'D7 逝者已矣——好感再满也招不回来');
assert(lastMsg().indexOf('逝者已矣') >= 0, 'D8 拦得明白（⚰️ 逝者已矣）');
var liLoy = member('npc_li').relationship.loyalty;
assert(liLoy >= 40 && liLoy <= 55, 'D9 活下来的人心里记一笔（忠诚在合理区间涨跌：' + liLoy + '）');
// 忠诚见底：连夜走
var zhaoLoy = zhao.relationship.loyalty;
zhao.relationship.loyalty = 0;
msgs.length = 0;
var left = PS.checkLoyaltyDaily();
eq(left.length, 1, 'D10 心凉透（忠诚 0）——当夜就走');
eq(member('npc_zhao'), undefined, 'D11 走了就是真走了（名单除名）');
assert(msgs.join('').indexOf('离心离德') >= 0, 'D12 如实播报：同行是情分，强留不来');
assert(npcStore['npc_zhao']._actions.some(function (a) { return a[0] === 'left_party_loyalty'; }), 'D13 这笔账记进 NPC 的关系记忆');
// 忠诚 20：两成五的概率，掷不中就走不了
makeNpc('npc_qian', '钱掌柜', 80);
PS.recruitNPC('npc_qian');
var qian = member('npc_qian');
qian.relationship.loyalty = 20;
var _origRandom = Math.random;
Math.random = function () { return 0.1; };   // [0,0,0,1] 抽第 0 位 → 不走
eq(PS.checkLoyaltyDaily().length, 0, 'D14 忠诚 20 未到绝路——掷不中（0.1）就还愿意留下');
Math.random = function () { return 0.99; };  // 抽第 3 位 → 走
eq(PS.checkLoyaltyDaily().length, 1, 'D15 掷中了（0.99）——收拾行囊');
Math.random = _origRandom;
// 忠诚 50 的人安稳如山
var li2 = member('npc_li');
li2.relationship.loyalty = 50;
eq(PS.checkLoyaltyDaily().length, 0, 'D16 忠诚 50 的人不动（≥30 压根不掷）');

// ==================== E · 起居注里的同伴 ====================
console.log('\n[E] 起居注：屋檐下住着人，就该露脸');
resetHouseForTest();
function resetHouseForTest() { importHouseState(null); claimRuin(); }
eq(PS.recruitNPC('npc_li') || !!member('npc_li'), true, 'E1 李青莲还在队里（或重新入队）');
_day = 201;
rngQueue([0.99, 0.1]);   // 破山洞话头不触发（0.99>0.3），同伴话头触发（0.1<0.35）
var tick = CaveLife.tickDay();
var diary = CaveLife.getDiary();
var lastD = diary[diary.length - 1];
eq(lastD.kind, 'companion', 'E2 起居注记的是「同伴」这一笔');
assert(lastD.text.indexOf('李青莲') >= 0, 'E3 用的是他的名（' + lastD.text.slice(0, 18) + '…）');
eq(tick.scenes, 1, 'E4 今天这一桩就是同伴的日子');

// ==================== F · 队伍成就（隔离沙盒） ====================
console.log('\n[F] 队伍成就：同行的人有了名分');
var elStore2 = {};
function fakeEl2(id) {
    if (!elStore2[id]) elStore2[id] = { id: id, innerHTML: '', textContent: '' };
    return elStore2[id];
}
var mockWindow = {
    console: { log: function () {} },
    JSON: JSON, Object: Object, Array: Array, Math: Math, Number: Number, isFinite: isFinite,
    gameLog: { entries: [], add: function () {} },
    showMessage: function () {},
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
mockWindow.XianXia.DataManager = { getCopper: function () { return 0; }, setCopper: function () {}, getSpiritStones: function () { return 0; }, setSpiritStones: function () {} };
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
eq(AS.buildAchievementProfile().partySize, 0, 'F1 空世界队伍 0 人（幽灵键防线：是数不是洞）');
AS.partySystem = { getMembers: function () { return [{ id: 'a', name: '甲' }, { id: 'b', name: '乙' }]; } };
AS.checkAchievementsNow();
eq(mgr.getAchievement('party_first').isCompleted, true, 'F2 有同伴同行——同道中人点亮');
eq(mgr.getAchievement('party_full').isCompleted, false, 'F3 两人行还不算「四人成众」');
AS.partySystem = { getMembers: function () { return [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }]; } };
AS.checkAchievementsNow();
eq(mgr.getAchievement('party_full').isCompleted, true, 'F4 四人成众点亮');
AS.partySystem = undefined;

// ==================== G · 哨兵 ====================
console.log('\n[G] 哨兵：各处挂号、老账未动、行路带人、挂全量回归');
['js/party-system.js', 'js/battle.js', 'js/achievement-system.js', 'js/extensions/cave-life.js', 'js/location-system.js', 'js/map/randomMap.js'].forEach(function (f) {
    assert(src(f).indexOf('一百零七波') >= 0, 'G1 改动挂着本波的号（' + f.split('/').pop() + '）');
});
assert(src('js/location-system.js').indexOf('syncPartyLocationToPlayer') >= 0, 'G2 进城这条路带人');
assert(src('js/map/randomMap.js').indexOf('syncPartyLocationToPlayer') >= 0, 'G3 出关隘跨州这条路也带人');
var psSrc = src('js/party-system.js');
assert(psSrc.indexOf("EventBus.on('newDay'") >= 0, 'G4 成长/忠诚日结接的是世界钟（不自造日历）');
assert(newDayHandlers.length >= 1, 'G5 世界钟的钩子真挂上了（' + newDayHandlers.length + ' 道）');
assert(psSrc.indexOf('好感度不足，无法招募') >= 0 && psSrc.indexOf('队伍已满') >= 0, 'G6 老招募口径未动（好感 50 / 上限 4）');
assert(src('tests/v20.11-achievements-node.js').indexOf('getMembers') >= 0, 'G7 满配世界已喂队伍真源');
assert(src('tests/wave105-achv-node.js').indexOf('已点亮 0/9') >= 0, 'G8 人事类账已随扩容更新（9 枚）');
assert(src('tests/run-all.sh').indexOf('wave107-duiwu-node.js') >= 0, 'G9 本套已挂全量回归');
assert(psSrc.indexOf('_memberRecordAction') >= 0 && psSrc.indexOf('member.recordPlayerAction') < 0, 'G10 战后记忆改写到 NPC 真源——PartyMember 上不存在的幽灵方法已拆（此前 TypeError 被吞、关系账静默空转）');

console.log('\n========== wave107 结果：' + passed + ' 通过 / ' + failed + ' 失败 ==========');
if (failed > 0) process.exit(1);
