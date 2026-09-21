/**
 * wave88-beast-bond-node.js — 第八十八波 · 兽栏同栖录 验收：
 *   A 兽栏魂印：收服/买兽/繁育都要烙魂印，魂印数随境界长（3+境界序数）——兽栏不是无底洞；
 *     旧档超额既往不咎，放生腾出栏位才接得进新兽
 *   B 放生：放走就回不来；在家乡地界放生它认得路——兽径手记落确讯、驭兽阅历+4；
 *     血脉账销册、灵兽园除名，出战/骑乘指针跟着挪，不留孤儿账
 *   C 小名：起了小名唤小名（面板/战报/话术全改口），物种账 b.name 一个字不动；随档往返
 *   D 缚兽符：spec_beast_trap 死账实体化——灵兽坊有售（80灵石），收服+25%真兑现；机关件照旧算数
 *   E 问题修复：自动进化不再偷吃材料（手动按钮确认）；缺料报中文名；力竭的兽驮不动人；
 *     买来的兽入图鉴/认uid/挂血脉线（此前铺子兽是黑户）
 *   F 哨兵：战斗文件零改动、八十六/八十七波成果原样、零新 localStorage 键、新话术零中英混排
 *
 * 运行：node tests/wave88-beast-bond-node.js
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
function src(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ==================== 世界桩 ====================
global.window = global;
var msgs = [], timeCalls = [], skillCalls = [], addedItems = [], forgotten = [], gardenRemoved = [], discovered = [], initLines = [];
global.showMessage = function (m) { msgs.push(String(m)); };
global.gameLog = { add: function (m) { msgs.push(String(m)); } };
var modalTitles = [];
global.showModal = function (t) { modalTitles.push(String(t)); };
var docEls = {};
global.document = {
    createElement: function () { return { id: '', className: '', innerHTML: '', style: {}, classList: { add: function () {}, remove: function () {}, contains: function () { return false; } }, appendChild: function () {}, remove: function () {}, onclick: null }; },
    getElementById: function (id) { return docEls[id] || null; },
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    addEventListener: function () {},
    body: { appendChild: function () {} },
    readyState: 'complete'
};
var store = {};
global.localStorage = {
    getItem: function (k) { return store[k] !== undefined ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; }
};
var CUR_DAY = 100;
global.getAbsoluteDay = function () { return CUR_DAY; };
global.WorldCalendar = { get day() { return CUR_DAY; } };
global.timeSystem = {
    gameTime: { totalMinutes: 600 },
    advanceTime: function (m, r) { timeCalls.push({ m: m, r: String(r || '') }); },
    getAbsoluteDay: function () { return CUR_DAY; },
    onNewDaySubscribe: function () {}
};
global.EventBus = { emit: function () {}, on: function () {} };
global.updateInventoryUI = function () {};
global.updateCurrencyUI = function () {};
global.updateCharacterStatus = function () {};
global.renderBeastList = function () {};
global.renderBeastTemplates = function () {};
global.getLifeSkill = function () { return 0; };
global.growLifeSkill = function (sk, n, o) { skillCalls.push({ sk: sk, n: n, reason: (o && o.reason) || '' }); };
global.addItem = function (id, n) { addedItems.push({ id: id, n: n }); return n || 1; };
global.currentCharData = { realm: '金丹', spiritStones: 1000, copper: 200, energy: 100, combatAbilities: [] };
global.inventory = { currency: { spiritStones: 1000, copper: 200 }, slots: [], maxSlots: 30 };
var REALMS = { '炼气': 0, '筑基': 1, '金丹': 2, '元婴': 3, '化神': 4, '炼虚': 5 };
global.REALM_CONFIG = REALMS;
global.getRealmIndex = function (r) { return REALMS[r] != null ? REALMS[r] : -1; };
global.XianXia = { DataManager: {
    _bal: 5000,
    deductSpiritStones: function (n) { if (this._bal >= n) { this._bal -= n; return true; } return false; },
    addSpiritStones: function (n) { this._bal += n; return true; }
} };
var registered = {};
global.StateRegistry = { register: function (key, api) { registered[key] = api; } };
// 进化/伤势桩：可开关的力竭档
var WOUND_CRITICAL = false;
global.BeastEvolution = {
    forget: function (bid) { forgotten.push(bid); return { ok: true }; },
    initBeast: function (bid, line) { initLines.push({ bid: bid, line: line }); },
    getWoundStatus: function () { return WOUND_CRITICAL ? 'critical' : null; },
    getHp: function () { return WOUND_CRITICAL ? 0 : 100; },
    getMaxHp: function () { return 100; },
    getLine: function () { return null; },
    getStage: function () { return null; },
    canEvolve: function () { return { ok: false, missing: [] }; }
};
global.Codex = { discover: function (cat, id, meta) { discovered.push({ cat: cat, id: id, name: meta && meta.name }); } };
var GARDENS = [];
global.BeastGarden = {
    listGardens: function () { return GARDENS; },
    removeBeast: function (gid, bid) { gardenRemoved.push({ gid: gid, bid: bid }); return true; }
};
var REGION_NOW = '';
global.getCurrentRegionForGathering = function () { return REGION_NOW; };
var WILD_CELL = null;
global.WildGround = {
    active: function () { return !!WILD_CELL; },
    cell: function () { return WILD_CELL; }
};

load('js/beast-taming.js');
load('js/extensions/beast-ecosystem.js');
load('js/extensions/beast-lore.js');
load('js/items-extended/13-missing-ids.js');

var LORE = global.BeastLore;
var origRnd = Math.random;
function stubRnd(v) { Math.random = function () { return v; }; }
function resetWorld() {
    global.importBeastState({ beasts: [], activeBeastIndex: -1, activeMountIndex: -1 });
    global.inventory.slots = [];
    global.XianXia.DataManager._bal = 5000;
    global.currentCharData.realm = '金丹';
    msgs.length = 0; timeCalls.length = 0; skillCalls.length = 0; addedItems.length = 0;
    forgotten.length = 0; gardenRemoved.length = 0; discovered.length = 0; initLines.length = 0;
    modalTitles.length = 0; GARDENS.length = 0;
    REGION_NOW = ''; WILD_CELL = null; WOUND_CRITICAL = false;
    Object.keys(LORE.getState().sightings).forEach(function (k) { delete LORE.getState().sightings[k]; });
}
function mkBeast(templateId, over) {
    var tpl = global.BEAST_TEMPLATES[templateId];
    return Object.assign({
        templateId: templateId, name: tpl.name, level: 1, exp: 0, affection: 50,
        skills: (tpl.skills || []).slice(), combatAbilities: [], trait: null,
        mount: tpl.mount ? Object.assign({}, tpl.mount) : null
    }, over || {});
}
function giveItem(id, n) { global.inventory.slots.push({ templateId: id, count: n }); }
function countItem(id) {
    return global.inventory.slots.reduce(function (s, x) { return s + (x && x.templateId === id ? x.count : 0); }, 0);
}
var FOX_ENEMY = { name: '灵狐', level: 5, species: 'beast', physiology: { isUnconscious: true } };

// ==================== A · 兽栏魂印 ====================
console.log('\n[A] 兽栏魂印（收服灵兽须以灵识烙印——能分几道随境界走）');
resetWorld();
eq(global.getBeastPenCap(), 5, 'A1 金丹灵识分得出 5 道魂印（3+境界序数）');
global.currentCharData.realm = '元婴';
eq(global.getBeastPenCap(), 6, 'A2 境界涨魂印涨（元婴 6 道——约束来自修为本身）');
global.currentCharData.realm = '金丹';
// 满栏：收服被拦，骰子一枚不掷
var full = [];
for (var fi = 0; fi < 5; fi++) full.push(mkBeast('wind_wolf', { uid: 'w' + fi }));
global.importBeastState({ beasts: full, activeBeastIndex: -1, activeMountIndex: -1 });
var rndCalls = 0;
Math.random = function () { rndCalls++; return 0.1; };
eq(global.captureBeastAfterBattle(FOX_ENEMY), false, 'A3 满栏收不下新兽');
Math.random = origRnd;
eq(rndCalls, 0, 'A4 满栏在掷骰之前就拦下（不白耗运气）');
assert(msgs.some(function (m) { return m.indexOf('兽栏满了') >= 0 && m.indexOf('放生') >= 0; }), 'A5 拦话说人话：先放生一只才烙得进新的');
// 满栏：买兽先拦后收钱
var balBefore = global.XianXia.DataManager._bal;
eq(global.buyBeast('wind_wolf'), false, 'A6 满栏买不进');
eq(global.XianXia.DataManager._bal, balBefore, 'A7 拦在扣钱之前（灵石分毫未动）');
eq(global.tamedBeasts.length, 5, 'A8 失败不塞兽');
// 旧档超额既往不咎
global.importBeastState({ beasts: full.concat([mkBeast('spirit_fox')]), activeBeastIndex: -1, activeMountIndex: -1 });
eq(global.tamedBeasts.length, 6, 'A9 旧档超额不清洗（只进不出，放生腾位）');
// 放生腾出栏位 → 收得进
resetWorld();
global.importBeastState({ beasts: [mkBeast('wind_wolf'), mkBeast('wind_wolf'), mkBeast('spirit_fox'), mkBeast('black_bear'), mkBeast('crane')], activeBeastIndex: -1, activeMountIndex: -1 });
global.currentCharData.realm = '金丹';
eq(global.releaseBeastNow(4), true, 'A10 放掉一只腾出魂印');
stubRnd(0.05);
eq(global.captureBeastAfterBattle(FOX_ENEMY), true, 'A11 栏位空出即收得进新兽');
Math.random = origRnd;

// ==================== B · 放生 ====================
console.log('\n[B] 放生（在家乡放它走，它认得回家的路）');
resetWorld();
var b0 = mkBeast('wind_wolf', { uid: 'wolf_0' });
var b1 = mkBeast('spirit_fox', { uid: 'fox_1' });
var b2 = mkBeast('black_bear', { uid: 'bear_2' });
global.importBeastState({ beasts: [b0, b1, b2], activeBeastIndex: 2, activeMountIndex: 2 });
GARDENS.push({ gardenId: 'g1', beasts: ['fox_1'] });
// 家乡判定：中州是灵狐分布账上的地界（灵狐住中州/南疆/蜀地），人在野外平原格
REGION_NOW = '中州';
WILD_CELL = { terrainKey: 'PLAIN' };
global.openReleaseBeastModal(1);
assert(modalTitles.some(function (t) { return t.indexOf('放生') >= 0; }), 'B1 放生先弹确认（放走就回不来了）');
eq(global.releaseBeastNow(1), true, 'B2 放走灵狐');
eq(global.tamedBeasts.length, 2, 'B3 兽栏除名');
assert(forgotten.indexOf('fox_1') >= 0, 'B4 血脉账销册（不留孤儿账）');
assert(gardenRemoved.some(function (g) { return g.gid === 'g1' && g.bid === 'fox_1'; }), 'B5 灵兽园除名（日结不再给走了的兽发经验）');
var foxLore = LORE.getLore('spirit_fox');
assert(foxLore && foxLore.region === '中州' && foxLore.terrain === 'PLAIN' && foxLore.vague === false, 'B6 家乡放生怕它迷路——手记落确讯（中州平原）');
// 指针挪位：放走的在出战兽前头 → 出战指针 -1；骑乘指针同挪
eq(global.exportBeastState().activeBeastIndex, 1, 'B7 放走前面的兽，出战指针跟着挪');
eq(global.exportBeastState().activeMountIndex, 1, 'B8 骑乘指针同挪');
resetWorld();
global.importBeastState({ beasts: [mkBeast('crane', { uid: 'c0' }), mkBeast('wind_wolf', { uid: 'w1' })], activeBeastIndex: 0, activeMountIndex: 0 });
global.releaseBeastNow(0);
eq(global.exportBeastState().activeBeastIndex, -1, 'B9 放走的正是当值兽 → 摘牌');
eq(global.exportBeastState().activeMountIndex, -1, 'B10 骑乘同摘牌');
// 异乡放生：手记不落笔，阅历照长（放生在家乡才知去处）
resetWorld();
REGION_NOW = '西漠';
WILD_CELL = { terrainKey: 'DESERT' };
global.importBeastState({ beasts: [mkBeast('crane', { uid: 'c0' })], activeBeastIndex: -1, activeMountIndex: -1 });
eq(global.releaseBeastNow(0), true, 'B11 异乡也放得（仙鹤家住中州，西漠不是它的家乡）');
eq(LORE.getLore('crane'), null, 'B12 异乡放生手记不落笔（它去向不明）');
eq(skillCalls.length, 1, 'B13 放生记一笔驭兽阅历');
eq(skillCalls[0].n, 1, 'B14 异乡放生阅历+1');
// 家乡放生（风狼·西漠·荒漠格）：确讯落账 + 阅历+4
resetWorld();
REGION_NOW = '西漠';
WILD_CELL = { terrainKey: 'DESERT' };
global.importBeastState({ beasts: [mkBeast('wind_wolf', { uid: 'w0' })], activeBeastIndex: -1, activeMountIndex: -1 });
eq(global.releaseBeastNow(0), true, 'B15 家乡放风狼（西漠是它分布账上的家）');
var wolfLore = LORE.getLore('wind_wolf');
assert(wolfLore && wolfLore.region === '西漠' && wolfLore.terrain === 'DESERT' && wolfLore.vague === false, 'B16 手记落确讯：西漠荒漠（放生放出来的账）');
eq(wolfLore && wolfLore.source, '亲手放生', 'B17 来路记「亲手放生」');
eq(skillCalls[0].n, 4, 'B18 送兽归山阅历+4');
assert(msgs.some(function (m) { return m.indexOf('一步三回头') >= 0; }), 'B19 家乡放生的话有画面');
// 城里放生（无野外地皮）：地区照样落账，地皮从缺
resetWorld();
REGION_NOW = '西漠';
WILD_CELL = null;
global.importBeastState({ beasts: [mkBeast('wind_wolf', { uid: 'w0' })], activeBeastIndex: -1, activeMountIndex: -1 });
global.releaseBeastNow(0);
var cityLore = LORE.getLore('wind_wolf');
assert(cityLore && cityLore.region === '西漠', 'B20 城郊放生地区照落（地皮从缺记大概）');
// 小名兽放生话术唤小名
resetWorld();
REGION_NOW = '';
global.importBeastState({ beasts: [mkBeast('crane', { uid: 'c0', petName: '雪翎' })], activeBeastIndex: -1, activeMountIndex: -1 });
global.releaseBeastNow(0);
assert(msgs.some(function (m) { return m.indexOf('雪翎') >= 0; }), 'B21 放走的是「雪翎」——话术唤小名不唤物种账');

// ==================== C · 小名 ====================
console.log('\n[C] 小名（你唤它，它应的是这个名字）');
resetWorld();
var wolf = mkBeast('wind_wolf', { uid: 'w0' });
global.importBeastState({ beasts: [wolf], activeBeastIndex: 0, activeMountIndex: -1 });
global.openRenameBeastModal(0);
assert(modalTitles.some(function (t) { return t.indexOf('小名') >= 0; }), 'C1 起名弹窗开得出');
docEls['beast-rename-input'] = { value: '  阿黄  ' };
eq(global.confirmRenameBeast(0), true, 'C2 落名');
eq(global.tamedBeasts[0].petName, '阿黄', 'C3 首尾空白去掉');
eq(global.tamedBeasts[0].name, '风狼', 'C4 物种账一个字不动（收服桥/图鉴/繁育全按物种账走）');
docEls['beast-rename-input'] = { value: '一二三四五六七八九十' };
global.confirmRenameBeast(0);
eq(global.tamedBeasts[0].petName, '一二三四五六', 'C5 至多六个字（再长的名字兽记不住）');
docEls['beast-rename-input'] = { value: '   ' };
global.confirmRenameBeast(0);
eq(global.tamedBeasts[0].petName, undefined, 'C6 留空则唤回本名');
eq(global.beastDisplayName({ name: '风狼', petName: '阿黄' }), '阿黄·风狼', 'C7 展示口：小名·物种');
eq(global.beastDisplayName({ name: '风狼' }), '风狼', 'C8 没起小名照旧');
// 战报唤小名
global.confirmRenameBeast; docEls['beast-rename-input'] = { value: '阿黄' };
global.confirmRenameBeast(0);
var cd = global.getActiveBeastCombatData();
assert(cd && cd.name.indexOf('阿黄') === 0 && cd.name.indexOf('（灵兽）') >= 0, 'C9 战报报名：阿黄·风狼（灵兽）——后缀原样');
// 随档往返
var snap = global.exportBeastState();
global.importBeastState(JSON.parse(JSON.stringify(snap)));
eq(global.tamedBeasts[0].petName, '阿黄', 'C10 小名随档走（骑驯养名单的整包存读）');
// 面板接线（app.js 侧哨兵）
var appSrc = src('js/app.js');
assert(appSrc.indexOf('openRenameBeastModal(') >= 0 && appSrc.indexOf('openReleaseBeastModal(') >= 0, 'C11 面板挂出小名/放生两个按钮');
assert(appSrc.indexOf('b.petName') >= 0, 'C12 兽牌头名走小名');
assert(appSrc.indexOf('getBeastPenCap') >= 0, 'C13 兽栏魂印账上面板头行');

// ==================== D · 缚兽符 ====================
console.log('\n[D] 缚兽符（死账实体化——「带符收服+25%」今天真兑现）');
resetWorld();
var trapItem = global.itemById['tal_beast_seal'];
assert(trapItem && trapItem.name === '缚兽符', 'D1 缚兽符入物品册（此前 spec_beast_trap 全库查无此物）');
// 无符：chance = 0.3 + 0.2(昏迷) - 0.05(等级5) = 0.45 → 骰 0.47 挣脱
stubRnd(0.47);
eq(global.captureBeastAfterBattle(FOX_ENEMY), false, 'D2 空手骰 0.47 > 0.45——挣脱');
// 带符：+0.25 → 0.70 → 同一骰收服，符纸用掉
giveItem('tal_beast_seal', 1);
eq(global.captureBeastAfterBattle(FOX_ENEMY), true, 'D3 带符同一骰 0.47 < 0.70——收服');
eq(countItem('tal_beast_seal'), 0, 'D4 符纸是一次性家什（用掉一道）');
// 机关件照旧算数（神机门的老家什不废）
resetWorld();
giveItem('special_mechanism', 1);
stubRnd(0.47);
eq(global.captureBeastAfterBattle(FOX_ENEMY), true, 'D5 机关件旧账照旧顶用');
eq(countItem('special_mechanism'), 0, 'D6 机关件同样用掉');
Math.random = origRnd;
// 灵兽坊买符
resetWorld();
var bal0 = global.XianXia.DataManager._bal;
eq(global.buyBeastSealFromShop(), true, 'D7 灵兽坊买符');
eq(global.XianXia.DataManager._bal, bal0 - 80, 'D8 符价 80 灵石真扣');
assert(addedItems.some(function (a) { return a.id === 'tal_beast_seal'; }), 'D9 符纸进行囊');
resetWorld();
global.XianXia.DataManager._bal = 10;
addedItems.length = 0;
eq(global.buyBeastSealFromShop(), false, 'D10 钱不够买不成');
eq(addedItems.length, 0, 'D11 失败不给货');
eq(global.XianXia.DataManager._bal, 10, 'D12 失败不扣钱');
// 柜台哨兵：灵兽坊货架挂出符纸行
assert(appSrc.indexOf('📜 缚兽符') >= 0 && appSrc.indexOf('buyBeastSealFromShop()') >= 0, 'D13 灵兽坊柜台摆上缚兽符');
assert(src('js/beast-taming.js').indexOf("s.templateId === 'tal_beast_seal'") >= 0, 'D14 收服账认新符 id');

// ==================== E · 问题修复 ====================
console.log('\n[E] 顺手修的三笔旧账');
// E1 自动进化偷吃材料（喂口灵草，兽自己把风之精华吞了）
resetWorld();
var wolf30 = mkBeast('wind_wolf', { uid: 'w0', level: 30, exp: 0 });
global.importBeastState({ beasts: [wolf30], activeBeastIndex: -1, activeMountIndex: -1 });
giveItem('mat_wind_essence', 1);
giveItem('mat_spirit_grass', 2);
global.feedBeast(0);
eq(global.tamedBeasts[0].templateId, 'wind_wolf', 'E1 喂食不再触发自动进化');
eq(countItem('mat_wind_essence'), 1, 'E2 风之精华分毫未动（材料是玩家的，兽不许偷吃）');
global.trainBeast(0);
eq(countItem('mat_wind_essence'), 1, 'E3 培养路过也不偷吃');
// 手动按钮照旧好使
eq(global.evolveBeast(0), true, 'E4 面板「进化」按钮手动确认照旧好使');
eq(global.tamedBeasts[0].templateId, 'wind_wolf_king', 'E5 手动进化成功蜕狼王');
eq(countItem('mat_wind_essence'), 0, 'E6 材料在确认后才扣');
// 缺料报中文名
resetWorld();
global.importBeastState({ beasts: [mkBeast('wind_wolf', { uid: 'w0', level: 30 })], activeBeastIndex: -1, activeMountIndex: -1 });
global.evolveBeast(0);
assert(msgs.some(function (m) { return m.indexOf('风之精华') >= 0 && m.indexOf('mat_wind_essence') < 0; }), 'E7 缺料说人话（不再甩账房 id 给玩家）');
// 力竭的兽驮不动人
resetWorld();
global.importBeastState({ beasts: [mkBeast('wind_wolf', { uid: 'w0' })], activeBeastIndex: -1, activeMountIndex: -1 });
WOUND_CRITICAL = true;
eq(global.setActiveMount(0), false, 'E8 力竭的兽骑不上去（出战口早拦了，骑乘口今天补齐）');
WOUND_CRITICAL = false;
eq(global.setActiveMount(0), true, 'E9 养好了照骑');
// 买来的兽不再是黑户（此前不入图鉴、不认 uid、不挂血脉线）
resetWorld();
discovered.length = 0; initLines.length = 0;
eq(global.buyBeast('spirit_fox'), true, 'E10 铺子买灵狐');
assert(discovered.some(function (d) { return d.id === 'spirit_fox'; }), 'E11 买入图鉴（不再是黑户）');
assert(initLines.some(function (l) { return l.line === 'line_fox'; }), 'E12 买入挂血脉线（铺子狐也走得通狐线蜕变）');
assert(!!global.tamedBeasts[0].uid, 'E13 买入认 uid（伤账/园账都对得上号）');

// ==================== F · 哨兵 ====================
console.log('\n[F] 哨兵');
assert(src('js/battle.js').indexOf('第八十八波') < 0, 'F1 战斗文件零改动（兽栏账全在驯养/铺面侧）');
var loreSrc = src('js/extensions/beast-lore.js');
eq((loreSrc.match(/Math\.random/g) || []).length, 4, 'F2 八十七波骰账原样（打听四枚骰，放生落账零骰）');
assert(loreSrc.indexOf('learnFromSighting') >= 0 && loreSrc.indexOf('ROAD') >= 0, 'F3 手记原样 + 地形中文表补齐野外全地形');
var ecoSrc = src('js/extensions/beast-ecosystem.js');
assert(ecoSrc.indexOf("TERRAIN_ALIASES.FORD = 'WATER'") >= 0 && ecoSrc.indexOf('19 兽') >= 0, 'F4 八十六波成果原样（水岸别名+19 兽）');
var newKeys = Object.keys(store).filter(function (k) { return k !== 'xianxia_beasts'; });
eq(newKeys.length, 0, 'F5 零新 localStorage 键（小名/魂印全骑驯养名单的整包存读）');
// 放生落账零骰（学是定数）
var btSrc = src('js/beast-taming.js');
var relSeg = btSrc.slice(btSrc.indexOf('window.releaseBeastNow'), btSrc.indexOf('// 导出'));
eq((relSeg.match(/Math\.random/g) || []).length, 0, 'F6 放生全程零骰（家乡判定/落账都是定数）');
// 新话术零中英混排（本波新段：兽栏同栖录 + 魂印闸）
var leak = null;
[btSrc.slice(btSrc.indexOf('// ==================== 第八十八波·兽栏同栖录'), btSrc.indexOf('// 导出'))].forEach(function (txt) {
    (txt.match(/'[^']+'/g) || []).forEach(function (s) {
        var v = s.slice(1, -1);
        if (/[+);({\[,?<>]/.test(v)) return;
        if (/^[a-z0-9_]+(?:[-_:. ][a-z0-9_]+)*$/i.test(v)) return;
        if (/^[A-Za-z0-9_\-:.\/# ]+$/.test(v)) return;
        if (/[A-Za-z]/.test(v) && /[一-龥]/.test(v)) leak = leak || s;
    });
});
eq(leak, null, 'F7 新话术零中英混排（漏: ' + leak + '）');
assert(src('tests/run-all.sh').indexOf('wave88-beast-bond-node.js') >= 0, 'F8 本套已挂全量回归');

console.log('\n========== 第八十八波 · 兽栏同栖录 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
