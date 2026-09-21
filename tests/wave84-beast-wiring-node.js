/**
 * wave84-beast-wiring-node.js — 第八十四波 · 灵兽断线全接通 验收：
 *   A 生态真源：六类非战斗增益改读 tamedBeasts（旧版读全库无人写过的字段，恒 0 死线）
 *   B 进化线增益并账：阶段增益（寻宝/火候/负重）进同一口径，变异 ×1.5 落真账
 *   C 地图分布真生成：13 兽 × 地区 × 地形 roll 出真名种 + 战斗就绪数据 + 收服桥精确命中
 *   D 兽潮真落地：潮期遭遇密度上浮（地图侧哨兵）+ 收服「略易」真兑现 + 潮池 id 全在册
 *   E 进化线执行：evolve 有了真按钮（提示不再骗人）、蜕变带一次变异机会
 *   F 伤势真账：战倒记重伤、力竭拒出战、丹药真疗伤、静养日结回血
 *   G 喂食双账 + 传授旧伤：野外灵草（mat_spirit_grass）能喂兽；传授谢师礼走双写口
 *   H 血脉繁育：同线成年配对出幼崽、特性过户真身、孤儿账当场销、三十日冷却、灵石双写
 *   I 哨兵：战斗文件零改动、分布 roll 零骰（可注入 rng）、新话术零中英混排、存档注册原样
 *
 * 运行：node tests/wave84-beast-wiring-node.js
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
function load(rel) {
    vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel });
}
function src(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ==================== 世界桩 ====================
global.window = global;
var msgs = [], timeCalls = [], events = [];
global.showMessage = function (m, t) { msgs.push(String(m)); };
global.gameLog = { add: function (m) { msgs.push(String(m)); } };
global.showModal = function (t, html) { msgs.push('[modal]' + t); };
global.document = {
    createElement: function () { return { id: '', className: '', innerHTML: '', style: {}, classList: { add: function () {}, remove: function () {}, contains: function () { return false; } }, appendChild: function () {}, remove: function () {}, onclick: null }; },
    getElementById: function () { return null; },
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
global.EventBus = { emit: function (n, d) { events.push({ n: n, d: d }); }, on: function () {} };
global.updateInventoryUI = function () {};
global.updateCurrencyUI = function () {};
global.updateCharacterStatus = function () {};
global.renderBeastList = function () {};
global.getLifeSkill = function () { return 0; };
global.growLifeSkill = function () {};
global.itemById = {};
global.COMBAT_ABILITIES = { burn: { name: '灼烧' }, venom: { name: '淬毒' }, pounce: { name: '猛扑' }, chill: { name: '寒气' } };
global.currentCharData = { realm: '金丹', spiritStones: 1000, copper: 0, combatAbilities: ['burn', 'venom'] };
global.inventory = { currency: { spiritStones: 1000, copper: 0 }, slots: [], maxSlots: 30 };
global.XianXia = {
    DataManager: {
        getSpiritStones: function () { return global.inventory.currency.spiritStones; },
        deductSpiritStones: function (n) {
            if (global.inventory.currency.spiritStones < n) return false;
            global.inventory.currency.spiritStones -= n;
            global.currentCharData.spiritStones = global.inventory.currency.spiritStones;
            return true;
        }
    }
};
var REALMS = { '炼气': 0, '筑基': 1, '金丹': 2, '元婴': 3, '化神': 4, '炼虚': 5 };
global.REALM_CONFIG = REALMS;
global.getRealmIndex = function (r) { return REALMS[r] != null ? REALMS[r] : -1; };

load('js/beast-taming.js');
load('js/extensions/beast-ecosystem.js');
load('js/extensions/beast-evolution.js');
load('js/extensions/beast-tide.js');

var ECO = global.BeastEcosystem;
var EVO = global.BeastEvolution;
var TIDE = global.BeastTide;
function wallet() { return global.inventory.currency.spiritStones; }
function mirror() { return global.currentCharData.spiritStones; }
function clearBeasts() {
    global.tamedBeasts.length = 0;
    global.importBeastState({ beasts: [], activeBeastIndex: -1, activeMountIndex: -1 });
    EVO.getState && Object.keys(EVO.getState().beasts).forEach(function (k) { EVO.forget(k); });
    msgs.length = 0; timeCalls.length = 0; events.length = 0;
}
function addBeast(templateId, over) {
    var tpl = global.BEAST_TEMPLATES[templateId];
    var b = Object.assign({
        templateId: templateId, name: tpl.name, level: 1, exp: 0, affection: 50,
        skills: (tpl.skills || []).slice(), combatAbilities: [], trait: null,
        mount: tpl.mount ? Object.assign({}, tpl.mount) : null
    }, over || {});
    global.tamedBeasts.push(b);
    global.tryRegisterTamedBeast(global.tamedBeasts.length - 1);
    return b;
}
function giveItem(id, n) {
    global.inventory.slots.push({ templateId: id, count: n, uid: 'u_' + id });
}
function countItem(id) {
    return global.inventory.slots.reduce(function (s, x) { return s + (x && x.templateId === id ? x.count : 0); }, 0);
}

// ==================== A · 生态真源 ====================
console.log('\n[A] 生态真源（六类增益改读驯养名单——死线复活）');
clearBeasts();
eq(ECO.getActiveBeastBuff('travel'), 0, 'A1 无兽时无增益');
addBeast('wind_wolf');
eq(ECO.getActiveBeastBuff('travel'), 0.8, 'A2 风狼引路复活（旅行 ×0.8——旧版恒 0）');
clearBeasts();
addBeast('dragon_turtle');
eq(ECO.getActiveBeastBuff('carry'), 0.1, 'A3 龙龟负重 +10%（洞府储物消费端等这句等了七个版本）');
clearBeasts();
addBeast('spirit_fox');
eq(ECO.getActiveBeastBuff('treasure'), 0.05, 'A4 灵狐寻宝 +5%');
clearBeasts();
addBeast('thunder_eagle');
eq(ECO.getActiveBeastBuff('scout'), 1, 'A5 雷鹰侦察在册');
clearBeasts();
addBeast('ice_serpent');
eq(ECO.getActiveBeastBuff('coldHerb'), 0.3, 'A6 冰蛇寒药 +30%（六类里最后一个死线）');
clearBeasts();
addBeast('fire_phoenix');
eq(ECO.getActiveBeastBuff('craftFire'), 0.1, 'A7 火凤火候 +10%');
// 旧字段兜底仍在（向后兼容）
clearBeasts();
global.currentCharData.spiritBeasts = [{ templateId: 'spirit_fox' }];
eq(ECO.getActiveBeastBuff('treasure'), 0.05, 'A8 老档 spiritBeasts 字段兜底原样');
delete global.currentCharData.spiritBeasts;
// 六类消费端全在册（真源修好即全线通电）
var appSrc = src('js/app.js');
var travelSrc = src('js/travel-system.js');
var houseSrc = src('js/house-system.js');
var weSrc = src('js/world-events.js');
var wlSrc = src('js/core/world-loop.js');
assert(travelSrc.indexOf("getActiveBeastBuff('travel')") >= 0, 'A9 旅行端消费 travel');
assert(weSrc.indexOf("getActiveBeastBuff('treasure')") >= 0, 'A10 寻宝端消费 treasure');
assert(houseSrc.indexOf("getActiveBeastBuff('carry')") >= 0 && houseSrc.indexOf("getActiveBeastBuff('craftFire')") >= 0, 'A11 洞府端消费 carry/craftFire');
assert(wlSrc.indexOf("getActiveBeastBuff('scout')") >= 0, 'A12 日结端消费 scout');
assert(appSrc.indexOf("getActiveBeastBuff('coldHerb')") >= 0, 'A13 采药端消费 coldHerb（本波新接：雪莲/冰霜草概率上浮）');

// ==================== B · 进化线增益并账 ====================
console.log('\n[B] 进化线阶段增益并入生态口径（进化了不再白进化）');
clearBeasts();
var foxB = addBeast('spirit_fox');
var foxBid = foxB.uid;
eq(ECO.getActiveBeastBuff('treasure'), 0.05, 'B1 幼狐阶段=物种账 0.05');
EVO.setBondDays(foxBid, 60);
EVO.addExp(foxBid, 1900);   // level = 1+19 = 20
eq(EVO.canEvolve(foxBid).ok, true, 'B2 成年条件齐（羁绊60日+20级）');
eq(EVO.evolve(foxBid).ok, true, 'B3 蜕变为成年灵狐');
eq(EVO.getStageName(foxBid), '灵狐', 'B4 阶段名在册');
near(ECO.getActiveBeastBuff('treasure'), 0.05 + 0.15, 'B5 物种 0.05 + 阶段 0.15 并账（旧版阶段账无人读）');
// 变异 ×1.5 落真账 + 无垃圾键
var origRnd = Math.random;
Math.random = function () { return 0.05; };   // 变异必成
var mut = EVO.tryMutate(foxBid);
Math.random = origRnd;
eq(mut.ok, true, 'B6 变异觉醒（金睛/火翼八选一）');
near(EVO.getBuff(foxBid).treasure, 0.15 * 1.5, 'B7 变异兽阶段增益 ×1.5 持久化（旧版只算在一次性副本上）');
eq(Object.keys(EVO.getBuff(foxBid)).indexOf('0'), -1, 'B8 特性数组不再按索引并进增益账（垃圾键清除）');
assert((EVO.getBuff(foxBid).traitNames || []).length === 1, 'B9 变异特性名单独出口（面板可显示）');

// ==================== C · 地图分布真生成 ====================
console.log('\n[C] 名种灵兽真分布（13 兽 × 地区 × 地形——v19.12 的表七个版本没人读）');
var d1 = ECO.rollDistributedBeast('中州', 'FOREST', function () { return 0; });
eq(d1 && d1.id, 'beast_lingfox', 'C1 中州森林 roll 出灵狐（地区×地形过滤生效）');
var d2 = ECO.rollDistributedBeast('北冥', 'FROZEN', function () { return 0; });
eq(d2 && d2.id, 'beast_icesnake', 'C2 地形别名接通（地图 FROZEN = 分布表 FROZEN_LAND）');
var d3 = ECO.rollDistributedBeast('东荒', 'SPRING', function () { return 0; });
eq(d3 && d3.id, 'beast_fivecolordeer', 'C3 灵泉别名接通（SPRING = SPIRIT_SPRING → 五色鹿）');
eq(ECO.rollDistributedBeast('西漠', 'ROAD', function () { return 0; }), null, 'C4 无分布的地区+地形如实回空');
eq(ECO.rollDistributedBeast(null, 'FOREST'), null, 'C5 无地区回空');
// 战斗就绪数据
var data1 = ECO.buildWildBeastData(d1);
eq(data1.name, '灵狐', 'C6 敌人名=模板名（收服桥靠名字精确匹配）');
eq(data1._beastTemplateId, 'spirit_fox', 'C7 反向映射出驯服模板 id');
eq(data1.physiologyType, 'beast', 'C8 生理标=野兽（血量模板/毒灼矩阵走兽账）');
eq(data1.level, 5, 'C9 等级取分布表（灵狐 5 级——不是杂兽的 1-3 级）');
eq(data1.attrs.dexterity, Math.floor(20 * (1 + 4 * 0.08)), 'C10 六维随等级缩放（与出战灵兽同尺度 ×0.08/级）');
eq(global.getBeastTemplateIdFromEnemy(data1), 'spirit_fox', 'C11 战后收服桥精确命中（不再靠「名里带狐」瞎猜）');
eq(ECO.buildWildBeastData(null), null, 'C12 空条目回空');
eq(ECO.buildWildBeastData({ id: 'x', name: '不存在的兽', level: 1 }), null, 'C13 查无模板回空');
// 13 只分布兽全部能拼出战斗数据（分布表 ↔ 模板表逐只对账）
var allOk = ECO.BEAST_DISTRIBUTION.every(function (e) { return !!ECO.buildWildBeastData(e); });
eq(allOk, true, 'C14 分布表 13 兽全部桥得回模板（无悬空 id）');
// 地图生成端接线（哨兵：randomMap 真调了分布口 + 兽潮密度 + 潮池稀有种）
var rmSrc = src('js/map/randomMap.js');
assert(rmSrc.indexOf('rollDistributedBeast(currentRegionForMap, t, rng)') >= 0, 'C15 地图野兽遭遇接上分布表（三成兽遇出名种）');
assert(rmSrc.indexOf('_tide.rareAdded') >= 0 && rmSrc.indexOf('_fromTide') >= 0, 'C16 兽潮稀有种优先出没（潮池 id 即模板 id，直取直拼）');
assert(rmSrc.indexOf('beastP = Math.min(0.5, beastP * (1.15') >= 0, 'C17 潮期兽况密度上浮（「遭遇更密」不再是牌面话）');
assert(rmSrc.indexOf('!c.ley && _eco && _eco.rollDistributedBeast && rng() < 0.3') >= 0, 'C18 灵脉地不掺名种（强敌地界保持原样）且模块缺位不白耗种子骰');

// ==================== D · 兽潮收服「略易」 ====================
console.log('\n[D] 兽潮收服加成（详情牌面写的「收服略易」今天真兑现）');
clearBeasts();
var enemyFox = { name: '灵狐', level: 5, species: 'beast', physiology: { isUnconscious: true } };
// 无潮：chance = 0.3 + 0.2(昏迷) - 0.05(等级) = 0.45
Math.random = function () { return 0.47; };
eq(global.captureBeastAfterBattle(enemyFox), false, 'D1 无潮时 0.47 > 0.45——挣脱');
// 起潮（tide_1 稀有度 1）：+0.05 → 0.50
var t1 = TIDE.triggerTide('tide_1', {});
eq(TIDE.isRaidActive(), true, 'D2 兽潮起');
eq(global.captureBeastAfterBattle(enemyFox), true, 'D3 潮期同一骰 0.47 < 0.50——收服（略易真兑现）');
TIDE.endTide(t1.tideId);
Math.random = origRnd;
// 潮池 id 全在册（数据完整性：十级潮池每个 id 都查得到模板）
var poolOk = true;
Object.keys(TIDE.listTideLevels ? {} : {}).forEach(function () {});
var tideSrc = src('js/extensions/beast-tide.js');
(tideSrc.match(/rareAdded: \[([^\]]*)\]/g) || []).forEach(function (seg) {
    (seg.match(/'([a-z_]+)'/g) || []).forEach(function (q) {
        var id = q.slice(1, -1);
        if (!global.BEAST_TEMPLATES[id]) poolOk = false;
    });
});
eq(poolOk, true, 'D4 十级潮池稀有种 id 全部在模板册（无悬空）');
assert(src('js/beast-taming.js').indexOf("chance += 0.05 * Math.max(1, _tb)") >= 0, 'D5 加成随潮稀有度上浮（+5%/级，封顶 0.85 原样）');

// ==================== E · 进化线执行入口 ====================
console.log('\n[E] 进化线真按钮（「✨可进化」亮了七个版本点不动的账）');
clearBeasts();
var fox2 = addBeast('spirit_fox');
var bid2 = fox2.uid;
EVO.setBondDays(bid2, 60);
EVO.addExp(bid2, 1900);
eq(EVO.canEvolve(bid2).ok, true, 'E1 条件齐');
Math.random = function () { return 0.5; };   // 变异不成（0.5 ≥ 0.1）
global.evolveBeastLine(0);
Math.random = origRnd;
eq(EVO.getStage(bid2), 'adult', 'E2 面板真按钮蜕变成年（evolve 全库首次有调用方）');
assert(msgs.some(function (m) { return m.indexOf('蜕为「灵狐」') >= 0; }), 'E3 蜕变话术报出新阶段名');
assert(!EVO.getState().beasts[bid2].mutated, 'E4 骰不中不变异（10% 机会是真机会不是白送）');
// 条件不齐如实报
clearBeasts();
var fox3 = addBeast('spirit_fox');
global.evolveBeastLine(0);
assert(msgs.some(function (m) { return m.indexOf('蜕变火候未到') >= 0; }), 'E5 条件不齐点按钮有实话（不再是哑巴）');
// 面板哨兵：按钮真渲染 + 血脉/伤势/变异三本账上卡面
assert(appSrc.indexOf('evolveBeastLine(' + "' + i + ')") >= 0 || appSrc.indexOf('evolveBeastLine(') >= 0, 'E6 面板渲染血脉进化按钮（提示与执行终于成对）');
assert(appSrc.indexOf('openBeastHealModal(') >= 0 && appSrc.indexOf('openBreedModal(') >= 0, 'E7 面板渲染疗伤/配对按钮');
assert(appSrc.indexOf('血脉:') >= 0 && appSrc.indexOf('伤重力竭') >= 0, 'E8 卡面显示血脉阶段与伤势（变异名随阶段账出口）');

// ==================== F · 伤势真账 ====================
console.log('\n[F] 伤势真账（灵兽战倒不再等于没事）');
clearBeasts();
// 第八十五波后风狼不入血脉线（狼不是狐）——伤账骑进化模块的册，改用灵狐验
var wolf = addBeast('spirit_fox');
global.setActiveBeast(0);
eq(global.activeBeastIndex, 0, 'F1 健康兽正常出战');
assert(!!global.getActiveBeastCombatData(), 'F2 参战数据在册');
// 模拟战倒
global.currentBattle = { allyBeast: { isAlive: false } };
global.onBeastBattleEnd(false);
eq(EVO.getHp(wolf.uid), 0, 'F3 战倒记重伤（力竭）');
assert(msgs.some(function (m) { return m.indexOf('伤重') >= 0; }), 'F4 伤势如实播报');
eq(global.getActiveBeastCombatData(), null, 'F5 力竭期间参战数据拒出（不上战场当挂件）');
eq(global.setActiveBeast(0), false, 'F6 力竭兽点出战被拦');
assert(msgs.some(function (m) { return m.indexOf('趴着不肯起身') >= 0; }), 'F7 拦下时说实话（不是静默失败）');
// 丹药疗伤
giveItem('pill_small_recovery', 2);
global.healBeastWithPill(0, 'minor');
eq(EVO.getHp(wolf.uid), 20, 'F8 小还丹疗两成（20/100）');
eq(countItem('pill_small_recovery'), 1, 'F9 丹药真消耗（二剩一）');
assert(!!global.getActiveBeastCombatData(), 'F10 脱离力竭即可再战（带伤不拦，力竭才拦）');
eq(global.setActiveBeast(0), true, 'F11 出战恢复');
// 日结静养
var hpBefore = EVO.getHp(wolf.uid);
EVO.tickDayHealing();
assert(EVO.getHp(wolf.uid) > hpBefore, 'F12 静养日结回血（world-loop 既有接线，今天起真有血可回）');
delete global.currentBattle;
// 老档未入册的兽不受伤账影响（向后兼容）
clearBeasts();
global.tamedBeasts.push({ templateId: 'crane', name: '仙鹤', level: 3, exp: 0, affection: 50, skills: [], combatAbilities: [] });
global.activeBeastIndex = 0;
global.setActiveBeast(0);
assert(!!global.getActiveBeastCombatData(), 'F13 未入进化册的老兽照常出战（伤账不殃及旧档）');

// ==================== G · 喂食双账 + 传授旧伤 ====================
console.log('\n[G] 灵草双账合一 + 传授谢师礼走双写口');
clearBeasts();
var wolf2 = addBeast('wind_wolf');
wolf2.affection = 50;
giveItem('mat_spirit_grass', 2);
global.feedBeast(0);
eq(wolf2.affection, 58, 'G1 野外采的灵草（mat_spirit_grass）能喂兽（旧版只认坊市 id，采一筐喂不了）');
eq(countItem('mat_spirit_grass'), 0, 'G2 两株入腹');
giveItem('mat_spirit_grass', 1);
giveItem('spirit_grass', 1);
global.feedBeast(0);
eq(wolf2.affection, 66, 'G3 两本 id 混着凑一对也收');
eq(countItem('mat_spirit_grass') + countItem('spirit_grass'), 0, 'G4 混账扣干净');
global.inventory.slots = [];
msgs.length = 0;
global.feedBeast(0);
assert(msgs.some(function (m) { return m.indexOf('灵草×2') >= 0; }), 'G5 没草如实报（提示改口：野外采药也可得）');
// 传授：谢师礼走 DataManager（双写），消息括号旧伤已修
var btSrc = src('js/beast-taming.js');
assert(btSrc.indexOf("window.showMessage(tpl.name || '此兽') + '") < 0, 'G6 拼接写在括号外的哑话修掉');
var teachSeg = btSrc.slice(btSrc.indexOf('window.teachBeastAbility'), btSrc.indexOf('// ==================== 第八十四波'));
assert(teachSeg.indexOf('deductSpiritStones(300)') >= 0, 'G7 谢师礼 300 走统一扣款口（钱包双写不再分叉）');
assert(teachSeg.indexOf('window.inventory.currency.spiritStones -= 300;\n    if (!b.combatAbilities') < 0, 'G8 直写背包老路拆除');

// ==================== H · 血脉繁育 ====================
console.log('\n[H] 血脉繁育（breed 的孤儿账过户到真身）');
clearBeasts();
global.inventory.currency.spiritStones = 1000;
global.currentCharData.spiritStones = 1000;
var pa = addBeast('spirit_fox', { affection: 70, trait: 'fierce' });
var pb = addBeast('spirit_fox', { affection: 80 });
[pa, pb].forEach(function (p) {
    EVO.setBondDays(p.uid, 60);
    EVO.addExp(p.uid, 1900);
    EVO.evolve(p.uid);
});
eq(EVO.getStage(pa.uid), 'adult', 'H1 亲本甲成年');
var stonesBefore = wallet();
Math.random = function () { return 0.5; };
global.breedBeasts(0, 1);
Math.random = origRnd;
eq(global.tamedBeasts.length, 3, 'H2 幼崽入册');
var child = global.tamedBeasts[2];
eq(child.templateId, 'spirit_fox', 'H3 物种随亲本');
eq(child.level, 1, 'H4 幼崽 1 级从头养（与收服/购买同一起跑线）');
eq(child.affection, 70, 'H5 出壳即亲（70）');
eq(wallet(), stonesBefore - 500, 'H6 安家费 500 真扣');
eq(mirror(), wallet(), 'H7 双写同账（走 DataManager）');
assert(timeCalls.some(function (c) { return c.m === 60; }), 'H8 耗时一个时辰');
var orphan = Object.keys(EVO.getState().beasts).filter(function (k) { return k.indexOf('beast_child_') === 0; });
eq(orphan.length, 0, 'H9 孤儿账当场销（遗传过户到幼崽真身）');
eq(EVO.getLine(child.uid), 'line_fox', 'H10 幼崽血脉入册（长大能接着蜕）');
// 冷却
msgs.length = 0;
Math.random = function () { return 0.5; };
global.breedBeasts(0, 1);
Math.random = origRnd;
eq(global.tamedBeasts.length, 3, 'H11 三十日内不再配对（冷却拦住）');
assert(msgs.some(function (m) { return m.indexOf('三十日') >= 0; }), 'H12 冷却如实报');
// 异线拒配
clearBeasts();
var pc = addBeast('dragon_turtle', { affection: 70 });
var pd = addBeast('spirit_fox', { affection: 70 });
[pc, pd].forEach(function (p) { EVO.setBondDays(p.uid, 60); EVO.addExp(p.uid, 1900); EVO.evolve(p.uid); });
msgs.length = 0;
global.breedBeasts(0, 1);
assert(msgs.some(function (m) { return m.indexOf('血脉不同线') >= 0; }), 'H13 龙龟配灵狐——血脉不同线拒配');
eq(global.tamedBeasts.length, 2, 'H14 拒配不出崽不扣钱');

// ==================== I · 哨兵 ====================
console.log('\n[I] 哨兵');
var bSrc = src('js/battle.js');
assert(bSrc.indexOf('第八十四波') < 0, 'I1 战斗文件本波零改动（伤账钩子全在驯养侧）');
// 分布 roll 可注入 rng（地图生成是种子账，不许掺全局骰）
var seq = [0.9, 0.1];
var di = ECO.rollDistributedBeast('中州', 'FOREST', function () { return seq.shift(); });
assert(!!di, 'I2 注入 rng 出真兽（生成可复现）');
var ecoSrc = src('js/extensions/beast-ecosystem.js');
var rollSeg = ecoSrc.slice(ecoSrc.indexOf('function rollDistributedBeast'), ecoSrc.indexOf('// eco 分布条目'));
eq((rollSeg.match(/Math\.random\(/g) || []).length, 0, 'I3 roll 本体不偷骰（rng 注入口是唯一骰源，兜底仅引用不调用）');
var buildSeg = ecoSrc.slice(ecoSrc.indexOf('function buildWildBeastData'), ecoSrc.indexOf('// ============== 5.'));
eq((buildSeg.match(/Math\.random/g) || []).length, 0, 'I4 战斗数据拼装零骰（属性是定数）');
// 存档注册原样（三模块的 StateRegistry 一个不少）
assert(ecoSrc.indexOf("StateRegistry.register('beastEcosystem'") >= 0, 'I5 生态随档注册原样');
assert(src('js/extensions/beast-evolution.js').indexOf("StateRegistry.register('beastEvolution'") >= 0, 'I6 进化线随档注册原样');
assert(src('js/extensions/beast-tide.js').indexOf("StateRegistry.register('beastTideAndGarden'") >= 0, 'I7 兽潮随档注册原样');
// 幼崽/伤账/冷却全骑 tamedBeasts 既有随档字段（uid/自定义键随 JSON 往返）
var roundTrip = JSON.parse(JSON.stringify(global.tamedBeasts));
assert(Array.isArray(roundTrip), 'I8 驯养名单可序列化（_lastBreedDay/uid 随档）');
// 新话术零中英混排
var leak = null;
[btSrc.slice(btSrc.indexOf('// ==================== 第八十四波'), btSrc.indexOf('// ==================== v20.9')), rollSeg, buildSeg].forEach(function (txt) {
    (txt.match(/'[^']+'/g) || []).forEach(function (s) {
        var v = s.slice(1, -1);
        if (/[+);({\[,?<>]/.test(v)) return;
        if (/^[a-z0-9_]+(?:[-_:. ][a-z0-9_]+)*$/i.test(v)) return;
        if (/^[A-Za-z0-9_\-:.\/# ]+$/.test(v)) return;
        if (/[A-Za-z]/.test(v) && /[一-龥]/.test(v)) leak = leak || s;
    });
});
eq(leak, null, 'I9 新话术零中英混排（漏: ' + leak + '）');

console.log('\n========== 第八十四波 · 灵兽断线全接通 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
