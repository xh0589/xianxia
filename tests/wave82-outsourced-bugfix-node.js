/**
 * wave82-outsourced-bugfix-node.js — 第八十二波 · 外包核查修复批 验收：
 *   A 正式入袋账：堆叠入袋也发 item:obtained（任务计数不再瞎）、满包部分入袋如实报数、返回值真值兼容
 *   B 采药与渲染链：采药走 addItem 不再直写裸格子；裸格子遗毒有守卫（渲染/分类不再抛错）；读档 uid 条件覆盖
 *   C 灵泉取水：汲水真出一瓶灵泉水（事件齐）、余泽满照旧取水、背包满不扣精力；任务目标对准新物品
 *   D 任务账清零：新角色任务进度不跨角色残留；任务页导航五张列表全刷（布告不再空白）
 *   E 灯谜跨日：判题绑定玩家实际看到的那道题（先锁题、后耗时）
 *   F 双钱包：开局初值一致、店铺购买/回购/游商扣款全走双写
 *   G 医馆/客栈/药铺：先把脉后收钱、体毒医馆真能治、没病分文不取；「一晚」改口一个时辰；未实装丹不上架
 *   H 当铺自选：散货清单只收可堆材料、一票一物拦住、场景入口接上
 *   I 炼丹门槛：瑕疵五方可达、御品回春可达（真实模块全组合枚举复证）
 *   J 哨兵：tailwind 内联块已删、前往城市接活、训练弹窗先收再战、战斗文件零改动、新话术零拉丁
 *
 * 运行：node tests/wave82-outsourced-bugfix-node.js
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
var msgs = [], events = [], timeCalls = [], modals = [];
global.showMessage = function (m, t) { msgs.push({ m: String(m), t: t }); };
global.gameLog = { add: function (m, t) { msgs.push({ m: String(m), t: t }); } };
global.showModal = function (t, html) { modals.push({ t: String(t), html: String(html) }); };
global.document = {
    createElement: function () { return { id: '', className: '', innerHTML: '', style: {}, dataset: {}, classList: { add: function () {}, remove: function () {}, contains: function () { return false; } }, appendChild: function () {}, remove: function () {}, onclick: null }; },
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
    removeItem: function (k) { delete store[k]; },
    key: function (i) { return Object.keys(store)[i] || null; },
    get length() { return Object.keys(store).length; }
};
var ABS_DAY = 1;
global.timeSystem = {
    gameTime: { totalMinutes: 600 },
    advanceTime: function (m, r) { timeCalls.push({ m: m, r: String(r || '') }); },
    getAbsoluteDay: function () { return ABS_DAY; },
    onNewDaySubscribe: function () {}
};
global.EventBus = { emit: function (name, data) { events.push({ name: name, data: data }); }, on: function () {} };
global.updateCharacterStatus = function () {};
global.updateInventoryUI = function () {};
global.updateCurrencyUI = function () {};
global.updateStatusPanel = function () {};
global.itemById = {};
global.currentCharData = { realm: '炼气', layer: 1, health: 100, maxHealth: 100, qi: 100, maxQi: 100, energy: 100, maxEnergy: 100, spiritStones: 10, copper: 100, location: '帝都·长安', lifeSkills: { '学识': 20 } };
global.getCurrentCityName = function () { return '帝都·长安'; };
global.locationSystem = { getCityData: function (c) { return (c === '帝都·长安') ? { name: c, buildings: ['shop', 'market'] } : null; }, getCurrentLocation: function () { return '帝都·长安'; } };

load('js/inventory.js');
load('js/quest/quest-system.js');
load('js/items-extended/12-quest-extensions.js');
load('js/building-effects.js');
load('js/city-facilities/pawn-service.js');
load('js/economy/economy-transaction.js');
load('js/core/reward-service.js');
load('js/city-facilities/festival-fair.js');

// 测试用物品模板
function regTpl(id, extra) {
    global.itemById[id] = Object.assign({ id: id, name: id, type: 'material', category: 'material', stackable: true, maxStack: 10, price: 20 }, extra || {});
}
regTpl('mat_lingzhi', { name: '灵芝' });
regTpl('mat_iron_ore', { name: '铁矿' });
regTpl('spec_spring_water', { name: '灵泉水', type: 'consumable', category: 'consumable', price: 30 });
regTpl('mat_dragon_scale', { name: '龙鳞', price: 500 });
regTpl('wpn_test_sword', { name: '试剑', type: 'equipment', category: 'equipment', stackable: false, maxStack: 1, price: 300 });
regTpl('mat_zero', { name: '无价土', price: 0 });

var registry = vm.runInThisContext('buildingEffectsRegistry');

// ==================== A · 正式入袋账 ====================
console.log('\n[A] 正式入袋账（item:obtained 一个出口都不漏）');
global.initInventory([]);
events.length = 0;
var r1 = global.addItem('mat_lingzhi', 3);
eq(r1, 3, 'A1 新槽入袋 3 株返回 3（数字真值与老布尔兼容）');
eq(events.filter(function (e) { return e.name === 'item:obtained'; }).length, 1, 'A2 新槽路径发获得事件一次');
eq(events[events.length - 1].data.count, 3, 'A3 事件带实数 3');
events.length = 0;
var r2 = global.addItem('mat_lingzhi', 4);   // 堆进已有槽（旧版这条静默 return true，任务永远 0/N）
eq(r2, 4, 'A4 堆叠入袋返回实数 4');
eq(events.filter(function (e) { return e.name === 'item:obtained'; }).length, 1, 'A5 堆叠路径也发获得事件（FIX-01 关联修复的正是这条）');
eq(events[events.length - 1].data.count, 4, 'A6 事件按实际入袋数结算');
events.length = 0;
// 堆到上限再塞：部分入袋如实报数
var lingSlot = global.inventory.slots.filter(function (s) { return s && s.templateId === 'mat_lingzhi'; })[0];
lingSlot.count = 8;   // 上限 10，只剩 2 空位
var r3 = global.addItem('mat_lingzhi', 5);
eq(r3, 5, 'A7 旧堆只剩2位也不丢货——2进旧堆3开新格，5件全入如实报5');
eq(events[events.length - 1].data.count, 5, 'A8 事件结算总数 5（2 进旧堆 + 3 开新格）');
// 满包：一件不进
global.inventory.slots = global.inventory.slots.filter(Boolean);
global.inventory.maxSlots = global.inventory.slots.length;
events.length = 0;
var r4 = global.addItem('mat_iron_ore', 3);
eq(r4, 0, 'A9 满包一件不进返回 0（假值，与老 false 语义一致）');
eq(events.filter(function (e) { return e.name === 'item:obtained'; }).length, 0, 'A10 没入袋不发事件（不白记任务账）');
eq(global.addItem('no_such_item', 1), false, 'A11 模板不存在仍报 false（老口径不动）');
global.initInventory([]);
global.inventory.maxSlots = 30;

// ==================== B · 采药与渲染链 ====================
console.log('\n[B] 采药源头与渲染链守卫');
var appSrc = src('js/app.js');
var herbSeg = appSrc.slice(appSrc.indexOf('let _herbNoRoom'), appSrc.indexOf('采集完成：一无所获'));
assert(herbSeg.indexOf('window.addItem(r.item, count)') >= 0, 'B1 采药走正式入袋 API');
assert(herbSeg.indexOf('inventory.slots[i] = {') < 0 && herbSeg.indexOf('slot.count += count') < 0, 'B2 直写裸格子的老路连根拔掉');
assert(herbSeg.indexOf('行囊塞不下') >= 0, 'B3 装不下如实报（不再谎称全部采到手）');
var invSrc = src('js/inventory.js');
assert(invSrc.indexOf('function _slotTemplate(slot)') >= 0, 'B4 渲染链有模板守卫（裸格子回查模板库，不再抛错白屏）');
assert(invSrc.indexOf('if (slotData.uid) instance.uid = slotData.uid;') >= 0, 'B5 读档 uid 条件覆盖（裸格子不再把新 uid 覆盖回 undefined）');
var guSrc = src('js/global-utils.js');
assert((guSrc.match(/渲染异常被吞/g) || []).length === 2, 'B6 渲染合并器的空 catch 补了日志（两处）——同类断线不再静默');
// 行为：裸格子遗毒不再炸分类链
global.inventory.slots[0] = { templateId: 'mat_lingzhi', name: 'mat_lingzhi', count: 3 };   // 旧档裸格子形态
var catList = null, catErr = null;
try { catList = global.getInventoryItemsByCategory('material'); } catch (e) { catErr = e; }
eq(catErr, null, 'B7 裸格子过分类链不抛错');
eq(catList.length, 1, 'B8 裸格子凭模板库回查照常入账（老档能看能卖）');
global.initInventory([]);

// ==================== C · 灵泉取水 ====================
console.log('\n[C] 灵泉取水（任务目标终于有的放矢）');
var sp = src('js/items-extended/08-special.js');
assert(sp.indexOf("id: 'spec_spring_water'") >= 0 && sp.indexOf("name: '灵泉水'") >= 0, 'C1 灵泉水入物品库（可堆叠消耗品，喝一口回气回血）');
var qx = src('js/items-extended/12-quest-extensions.js');
assert(qx.indexOf("item: 'spec_spring_water'") >= 0 && qx.indexOf("item: 'spec_ten_thousand_milk'") < 0, 'C2 委托目标对准灵泉水（不再要 5000 灵石的万年灵乳当 100 灵石跑腿货）');
global.currentCharData.energy = 100;
global.currentCharData.springBlessing = 0;
global.initInventory([]);
events.length = 0;
var c1 = registry.spring.collect();
eq(c1, true, 'C3 汲水成功');
var bottles = global.inventory.slots.filter(function (s) { return s && s.templateId === 'spec_spring_water'; });
eq(bottles.length, 1, 'C4 真出一瓶灵泉水（正式实例，有 uid 有模板）');
assert(typeof bottles[0].getTemplate === 'function' && bottles[0].uid, 'C5 实例字段齐全（摆摊/背包/任务三处都认）');
eq(events.filter(function (e) { return e.name === 'item:obtained' && e.data.itemId === 'spec_spring_water'; }).length, 1, 'C6 获得事件发了（委托计数就认这个）');
eq(global.currentCharData.springBlessing, 1, 'C7 余泽照旧+1（老账不动）');
eq(global.currentCharData.energy, 90, 'C8 精力照旧扣 10');
// 余泽满：照旧取水，不再涨余泽
global.currentCharData.springBlessing = 3;
var c2 = registry.spring.collect();
eq(c2, true, 'C9 余泽满仍能取水（水是水、泽是泽——两本分明）');
eq(global.currentCharData.springBlessing, 3, 'C10 余泽封顶 3 不涨');
// 背包满：不扣精力
global.currentCharData.energy = 50;
global.initInventory([]);
global.inventory.maxSlots = 1;
global.inventory.slots = [null];
global.addItem('mat_iron_ore', 1);   // 独格占满（格子数=上限，真空位都没有）
events.length = 0;
var c3 = registry.spring.collect();
eq(c3, false, 'C11 背包满汲不成水');
eq(global.currentCharData.energy, 50, 'C12 没取到水不扣精力（不白收力气钱）');
global.inventory.maxSlots = 30;
global.initInventory([]);

// ==================== D · 任务账清零与布告刷新 ====================
console.log('\n[D] 任务账（新角色干干净净，布告不再空白）');
global.acceptQuest('daily_001');
var actBefore = vm.runInThisContext('playerQuestProgress.activeQuests');
assert(actBefore.indexOf('daily_001') >= 0, 'D1 接了任务在活跃账上');
global.resetQuestProgressForNewCharacter();
var actAfter = vm.runInThisContext('playerQuestProgress.activeQuests');
eq(actAfter.length, 0, 'D2 新角色任务账清零（activeQuests 空了）');
var d001 = vm.runInThisContext('allQuests').filter(function (q) { return q.id === 'daily_001'; })[0];
eq(d001.accepted, false, 'D3 任务模板复位（accepted/completed 全清）');
eq(store['xianxia_quest_progress'], undefined, 'D4 存档键也清了（不靠读档兜底）');
var swSeg = appSrc.slice(appSrc.indexOf("if (panelId === 'quests')"), appSrc.indexOf("if (panelId === 'factions')"));
assert(swSeg.indexOf('updateRandomQuestUI') >= 0 && swSeg.indexOf('updateNpcQuestUI') >= 0, 'D5 任务页导航五张列表全刷（布告委托/NPC 任务不再空白）');
var gsSrc = src('js/core/game-state.js');
assert(gsSegOk(gsSrc), 'D6 新开一局的世界重置接上任务账清零');
function gsSegOk(s) {
    var i = s.indexOf('function resetWorldForNewGame');
    var seg = s.slice(i, i + 900);
    return seg.indexOf('resetQuestProgressForNewCharacter') >= 0;
}

// ==================== E · 灯谜跨日 ====================
console.log('\n[E] 灯谜跨日（判的是你看到的那道题）');
var defsBackup = global.FESTIVAL_DEFS;
global.FESTIVAL_DEFS = [{ key: 'test_fest', name: '测试节', doy: 50 }];
ABS_DAY = 50;
delete global.currentCharData._fairRiddleDay;
var seen = global.FestivalFair.todayRiddle();
// 答题耗时会跨日：桩里把天数推到 51（旧版此刻换题判错）
var origAdv = global.timeSystem.advanceTime;
global.timeSystem.advanceTime = function (m, r) { timeCalls.push({ m: m, r: String(r || '') }); ABS_DAY = 51; };
modals.length = 0;
global.FestivalFair.answer(seen.ans);
global.timeSystem.advanceTime = origAdv;
var winModal = modals.filter(function (m) { return m.t.indexOf('猜灯谜') >= 0; })[0];
assert(winModal && winModal.t.indexOf('中了') >= 0, 'E1 跨日后仍按原题判——答对就是中了（旧版按次日新题判成「差一层」）');
eq(global.currentCharData._fairRiddleDay, 50, 'E2 次数记在出题那天（归属日不错）');
ABS_DAY = 51;
global.FESTIVAL_DEFS = defsBackup;

// ==================== F · 双钱包 ====================
console.log('\n[F] 双钱包（一处扣款、两处同账）');
assert(appSrc.indexOf('day: 1, spiritStones: 10, copper: 100,') >= 0, 'F1 创角镜像初值与背包真账一致（10灵石/100铜钱，不再开局即分叉）');
assert(gsSrc.indexOf("global.inventory.currency = { copper: 100, spiritStones: 10 };") >= 0, 'F2 背包真账初值原样（权威余额没动）');
var esSrc = src('js/enhanced-shop.js');
var buySeg = esSrc.slice(esSrc.indexOf('window.inventory.currency.spiritStones = stones - total;'), esSrc.indexOf('if (item.stock != null)'));
assert(buySeg.indexOf('currentCharData.spiritStones') >= 0, 'F3 店铺购买扣款双写（此前只扣背包，买一次分叉一回）');
var bbSeg = esSrc.slice(esSrc.indexOf('// 扣钱（P1-10'), esSrc.indexOf('// 从回购列表移除'));
assert((bbSeg.match(/currentCharData/g) || []).length >= 2, 'F4 回购扣款灵石/铜钱两线都双写');
var wanderSeg = appSrc.slice(appSrc.indexOf('function buyWanderItem'), appSrc.indexOf('function buyWanderItem') + 2200);
assert(wanderSeg.indexOf('dm.deductSpiritStones(price)') >= 0, 'F5 游商扣款走统一双写口（不再二选一）');
assert(wanderSeg.indexOf('行囊塞不下这件货') >= 0 && wanderSeg.indexOf('dm.addSpiritStones(price)') >= 0, 'F6 游商满包退钱（不再白收灵石塞裸格子）');

// ==================== G · 医馆/客栈/药铺 ====================
console.log('\n[G] 医馆先诊后收钱，客栈牌面说实话，药铺不卖死货');
var clinicSeg = appSrc.slice(appSrc.indexOf('function openMedicalClinic'), appSrc.indexOf('window.openMedicalClinic = openMedicalClinic'));
assert(clinicSeg.indexOf('needOuter') >= 0 && clinicSeg.indexOf('!needOuter && !needInner') >= 0, 'G1 先把脉后收钱（里外没病分文不取——「没病根不收钱」的话名副其实）');
assert(clinicSeg.indexOf('player._poisoned = false') >= 0, 'G2 城市体毒医馆真能治（延医这条路通了）');
assert(clinicSeg.indexOf('needInner') >= 0 && clinicSeg.indexOf('relief.doctor') >= 0, 'G3 里症账照旧按病收费（两本分明）');
var clinicChargeIdx = clinicSeg.indexOf('deductSpiritStones(fee)');
var needGuardIdx = clinicSeg.indexOf('if (needOuter) {');
assert(needGuardIdx >= 0 && clinicChargeIdx > needGuardIdx, 'G4 诊金只在真有外伤/体毒要治时才扣');
var beSrc = src('js/building-effects.js');
assert(beSrc.indexOf('打尖歇脚') >= 0 && beSrc.indexOf('休息一晚') < 0, 'G5 客栈牌面改口「打尖歇脚·一个时辰」（120分钟不再吹一晚）');
assert(beSrc.indexOf('包间静养') >= 0 && beSrc.indexOf('包间一觉到天光') < 0, 'G6 包间牌面同步改口（240分钟=两个时辰）');
assert(esSrc.indexOf('if (it.implemented === false) return;') >= 0, 'G7 未实装的东西不上架（避毒丹 79 灵石买废药的坑封了）');
assert(beSrc.indexOf("closeBuildingDialog(); } catch (eModal) {}") >= 0 && beSrc.indexOf("window.startBattle('training_dummy');") > beSrc.indexOf('closeBuildingDialog(); } catch (eModal)'), 'G8 训练弹窗先收再开战（战斗按钮不再被遮）');
var herbMsgSeg = appSrc.slice(appSrc.indexOf('☠️ 草丛里毒雾弥漫'), appSrc.indexOf('☠️ 草丛里毒雾弥漫') + 200);
assert(herbMsgSeg.indexOf('延医') >= 0, 'G9 中毒提示「延医」如今是真的（医馆能治）');

// ==================== H · 当铺自选 ====================
console.log('\n[H] 当铺自选典当');
global.initInventory([]);
global.addItem('mat_dragon_scale', 2);
global.addItem('wpn_test_sword', 1);
global.addItem('mat_zero', 1);
var plist = global.PawnService.pawnableList();
eq(plist.length, 2, 'H1 散货清单如实列货（龙鳞聚合一行 + 装备按件一行；无价土不上清单）');
eq(plist[0].itemId, 'mat_dragon_scale', 'H2 龙鳞在列（行价500，价高排前）');
eq(plist[0].count, 2, 'H3 散货数目如实聚合');
// 第八十三波·装备实例账：装备按件上清单（带 uid），当的就是那一件
var eqRow = plist.filter(function (r) { return r.itemId === 'wpn_test_sword'; })[0];
assert(eqRow && eqRow.inst === true && !!eqRow.uid, 'H3b 装备逐件列（带 uid 实例账——第八十三波）');
// 一票一物：已有当票时清单窗不开
global.currentCharData._pawn = { item: 'mat_iron_ore', count: 1, loan: 10, due: 999 };
msgs.length = 0;
global.PawnService.openPicker();
eq(msgs.filter(function (m) { return m.m.indexOf('一票一物') >= 0; }).length, 1, 'H4 柜上有票先赎再当（一票一物老规矩）');
global.currentCharData._pawn = { item: '', count: 0, loan: 0, due: 0 };
var seSrc = src('js/core/scenario-engine.js');
assert(seSrc.indexOf("eff.pawn.op === 'pick'") >= 0 && seSrc.indexOf('PS.openPicker()') >= 0, 'H5 剧本引擎认「自选清单」口子（成交仍走 pawnItem 统一结算）');
var fb2Src = src('js/city-facilities/facility-batch2.js');
assert(fb2Src.indexOf("pawn: { op: 'pick' }") >= 0, 'H6 当铺场景上了自选入口（龙鳞甲专格保留当风味）');
assert(fb2Src.indexOf('本店只收大件') < 0, 'H7 「只收大件」的谎话摘了');
global.initInventory([]);

// ==================== I · 炼丹门槛 ====================
console.log('\n[I] 炼丹两档从「永不可达」到「真能炼出来」');
load('js/crafting/alchemy-compound.js');
var AC = global.AlchemyCompound;
var mats = Object.keys(AC.MATERIAL_PROPS);
function fits(id, slot) { return AC.checkSlotMat(id, slot).ok; }
var flawRecipes = 0, flawTotal = 0, impTotal = 0;
AC.COMPOUND_PILFAR_RECIPES.forEach(function (rc) {
    var mains = mats.filter(function (m) { return fits(m, rc.slots.main); });
    var asss = mats.filter(function (m) { return fits(m, rc.slots.assist); });
    var bals = mats.filter(function (m) { return fits(m, rc.slots.balancer); });
    var flaw = 0, imp = 0;
    mains.forEach(function (m1) {
        for (var a = 0; a < asss.length; a++) for (var b = a; b < asss.length; b++) {
            bals.forEach(function (bl) {
                var t = (AC.getProps(m1).toxic + AC.getProps(asss[a]).toxic + AC.getProps(asss[b]).toxic + AC.getProps(bl).toxic) / 4;
                var norm = 0.6 * ((AC.scoreSlot(m1, rc.slots.main) + AC.scoreSlot(asss[a], rc.slots.assist) + AC.scoreSlot(asss[b], rc.slots.assist) + AC.scoreSlot(bl, rc.slots.balancer)) / 4);
                if (rc.result.allowFlaw && t >= (rc.result.flawThreshold || 60)) flaw++;
                if (t < 12 && Math.min(100, norm + 40) >= 85) imp++;
            });
        }
    });
    if (rc.result.allowFlaw) { flawRecipes++; if (flaw > 0) flawTotal++; }
    impTotal += imp;
});
eq(flawRecipes, 5, 'I1 五张丹方带瑕疵账（重塑灵根丹本就不设瑕疵，原样）');
eq(flawTotal, 5, 'I2 张张可达（乱配高毒药材真会出瑕疵丹+毒反噬——按全组合枚举 p99 定线）');
assert(impTotal >= 40, 'I3 御品可达（回春丹低毒选材+满分火候 52 炉——稀有但不再是传说）');
var alcSrc = src('js/crafting/alchemy-compound.js');
assert(alcSrc.indexOf('finalScore >= 85 && avgToxic < 12') >= 0 && alcSrc.indexOf('avgToxic < 5') < 0, 'I4 御品毒性线 5→12（全库最低组合毒性 5.75，<5 是永假式）');

// ==================== J · 哨兵 ====================
console.log('\n[J] 哨兵');
var html = src('仙侠.html');
// J1 只认「运行时还在加载」：v21.x 界面整改 P0 把 Play CDN 本地化成 js/vendor/tailwind.js（断网不塌版），域名字面串不再是必要条件
assert(html.indexOf('tailwind.config') < 0 && (html.indexOf('js/vendor/tailwind.js') >= 0 || html.indexOf('cdn.tailwindcss.com') >= 0), 'J1 tailwind 冷启动报错块删除（运行时保留：本地 vendor 或 CDN 均可，样式行为不变）');
var travelSeg = appSrc.slice(appSrc.indexOf('function showCityTravelUI'), appSrc.indexOf('function showCityTravelUI') + 900);
assert(travelSeg.indexOf('locationSystem.showCityTravelUI') < 0 && travelSeg.indexOf('enterCity') >= 0, 'J2 前往城市接活（不再等一个从不存在的函数，人在城里直接开面板）');
assert(travelSeg.indexOf('身在野外') >= 0, 'J3 野外点按钮有指路的话（静默返回的哑巴按钮修掉）');
var bSrc = src('js/battle.js');
assert(bSrc.indexOf('第八十二波') < 0, 'J4 战斗文件本波零改动（禁止全局数值缩放的老规矩）');
// 新话术零拉丁（当铺清单窗 + 医馆新段 + 灵泉新话术）
var leak = null;
function scanSeg(segText, tag) {
    (segText.match(/'[^']+'/g) || []).forEach(function (s) {
        var v = s.slice(1, -1);
        if (/[+);({\[,?<>]/.test(v)) return;
        if (/^[a-z0-9_]+(?:[-_: ][a-z0-9_]+)*$/i.test(v)) return;
        if (/^[A-Za-z0-9_\-:.\/# ]+$/.test(v)) return;   // 纯代码 token（id/类名/选择器）
        if (/[A-Za-z]/.test(v) && /[一-龥]/.test(v)) leak = leak || (tag + ':' + s);
    });
}
scanSeg(src('js/city-facilities/pawn-service.js').slice(src('js/city-facilities/pawn-service.js').indexOf('pawnableList')), 'pawn');
scanSeg(clinicSeg, 'clinic');
eq(leak, null, 'J5 新话术零中英混排（漏: ' + leak + '）');
assert(src('js/city-facilities/festival-fair.js').indexOf('先锁定玩家实际看到的这道题') >= 0, 'J6 灯谜修复有波次锚点');

// ==================== K · 跨模块真链（外包验收要求#5：采集产物→正式背包→摊面按钮同款查找→出售） ====================
console.log('\n[K] 跨模块真链：采集入袋 → 摆摊出售');
load('js/city-facilities/street-stall.js');
var SS = global.StreetStall;
global.currentCharData.location = '帝都·长安';
global.currentCharData.copper = 500;
global.currentCharData.mood = 80;
global.currentCharData.lifeSkills = { '口才': 0 };
global.initInventory([]);
regTpl('mat_herb1', { name: '灵露草', price: 40 });
var addedHerb = global.addItem('mat_herb1', 2);   // 采药同款正式入袋（修复后的唯一路径）
eq(addedHerb, 2, 'K1 采集产物走正式入袋');
var herbInst = global.inventory.slots.filter(Boolean)[0];
assert(!!herbInst.uid && typeof herbInst.getTemplate === 'function', 'K2 真实例字段齐（uid/getTemplate——旧版裸格子两样都缺）');
var origRandomK = Math.random;
Math.random = function () { return 0.5; };
var openedK = SS.open();
Math.random = origRandomK;
eq(openedK, true, 'K3 摊开得起来');
var stonesBeforeK = global.inventory.currency.spiritStones;
eq(SS.stage(herbInst.uid), true, 'K4 按 uid 上摊卖一件——旧版在这里断链（stage(undefined) 永远「货不在摊上」）');
assert(global.inventory.currency.spiritStones > stonesBeforeK, 'K5 货款真入账');
eq(herbInst.count, 1, 'K6 货真离囊（二剩一）');
try { SS.close(); } catch (eK) {}

console.log('\n========== 第八十二波 · 外包核查修复批 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
