/**
 * wave83-pawn-instance-node.js — 第八十三波 · 装备典当实例账 验收：
 *   A 实例还原口：restoreItemFromSnapshot 真落地（uid/耐久/强化原样归位；满包整单不动；可堆货走正式入袋）
 *   B 统一结算通道的实例口径：take 带 uid 按件扣货（错号整体回滚）、items 带快照原物奉还
 *   C 当铺实例账：装备按件当（快照上柜）、赎回归还原物、满包赎不走钱不扣、死当销毁快照、老当票无快照照旧赎
 *   D 柜面清单：装备逐件列（带 uid）、按钮按件交割；散货聚合老路原样
 *   E 哨兵：新账零骰、双钱包同账（走统一通道）、战斗文件零改动、回购路径顺带吃到实例还原
 *
 * 运行：node tests/wave83-pawn-instance-node.js
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
var msgs = [], logs = [];
global.showMessage = function (m, t) { msgs.push(String(m)); };
global.gameLog = { add: function (m, t) { logs.push(String(m)); } };
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
global.timeSystem = { gameTime: { totalMinutes: 600 }, advanceTime: function () {}, getAbsoluteDay: function () { return CUR_DAY; }, onNewDaySubscribe: function () {} };
global.EventBus = { emit: function () {}, on: function () {} };
global.updateInventoryUI = function () {};
global.updateCurrencyUI = function () {};
global.updateCharacterStatus = function () {};
global.itemById = {};
global.currentCharData = { realm: '炼气', spiritStones: 100, copper: 100 };
global.inventory = { currency: { spiritStones: 100, copper: 100 }, slots: [], maxSlots: 30, markedForSale: new Set(), filter: 'all', searchQuery: '', qualityFilter: '' };
global.locationSystem = { getCityData: function () { return null; }, getCurrentLocation: function () { return '洛水城'; } };

load('js/economy/economy-transaction.js');
load('js/core/reward-service.js');
load('js/inventory.js');
global.initInventory([]);
load('js/city-facilities/pawn-service.js');

function regTpl(id, extra) {
    global.itemById[id] = Object.assign({ id: id, name: id, type: 'material', category: 'material', stackable: true, maxStack: 10, price: 20 }, extra || {});
}
regTpl('wpn_qingfeng', { name: '青锋剑', type: 'equipment', category: 'equipment', stackable: false, maxStack: 1, price: 1000 });
regTpl('mat_lingzhi', { name: '灵芝', price: 20 });
var PS = global.PawnService;
function wallet() { return global.inventory.currency.spiritStones; }
function mirror() { return global.currentCharData.spiritStones; }
function makeSword(uidSuffix, dur, props) {
    global.addItem('wpn_qingfeng', 1);
    var inst = global.inventory.slots.filter(function (s) { return s && s.templateId === 'wpn_qingfeng'; }).pop();
    if (uidSuffix) inst.uid = 'sword_' + uidSuffix;
    inst.durability = dur;
    inst.customProps = props || {};
    return inst;
}
function resetWorld() {
    if (global.currentCharData._pawn) global.currentCharData._pawn = { item: '', count: 0, loan: 0, due: 0 };
    global.initInventory([]);
    global.inventory.maxSlots = 30;
    global.inventory.currency = { spiritStones: 1000, copper: 100 };
    global.currentCharData.spiritStones = 1000;
    global.currentCharData.copper = 100;
    CUR_DAY = 100;
    msgs.length = 0; logs.length = 0;
}

// ==================== A · 实例还原口 ====================
console.log('\n[A] 实例还原口（两拨老调用方喊了多年，今天才真落地）');
eq(typeof global.restoreItemFromSnapshot, 'function', 'A1 restoreItemFromSnapshot 在册（交易层/商铺回购早就在调，此前全库无人实现）');
resetWorld();
var snapA = { uid: 'sword_old_1', templateId: 'wpn_qingfeng', count: 1, durability: 33, customProps: { enhance: 3 }, markedForSale: true };
eq(global.restoreItemFromSnapshot(snapA), true, 'A2 快照还原成功');
var back = global.inventory.slots.filter(Boolean)[0];
eq(back.uid, 'sword_old_1', 'A3 原 uid 认领归位（实例账的钥匙没丢）');
eq(back.durability, 33, 'A4 耐久原样');
eq(back.customProps.enhance, 3, 'A5 强化账原样');
eq(back.markedForSale, false, 'A6 经手过的货不背旧待售标');
// 满包整单不动
resetWorld();
global.inventory.slots = [null];
global.inventory.maxSlots = 1;
global.addItem('mat_lingzhi', 1);
var before = JSON.stringify(global.inventory.slots.map(function (s) { return s ? s.templateId : null; }));
eq(global.restoreItemFromSnapshot(snapA), false, 'A7 满包还原失败');
eq(JSON.stringify(global.inventory.slots.map(function (s) { return s ? s.templateId : null; })), before, 'A8 失败时整单不动（不塞半件）');
global.inventory.maxSlots = 30;
// 可堆货走正式入袋
resetWorld();
eq(global.restoreItemFromSnapshot({ templateId: 'mat_lingzhi', count: 4 }), true, 'A9 可堆货快照还原成功');
eq(global.inventory.slots.filter(function (s) { return s && s.templateId === 'mat_lingzhi'; })[0].count, 4, 'A10 数目如账');
eq(global.restoreItemFromSnapshot({ templateId: 'no_such', count: 1 }), false, 'A11 查无此货如实回绝');
eq(global.restoreItemFromSnapshot(null), false, 'A12 空快照回绝');

// ==================== B · 统一结算通道的实例口径 ====================
console.log('\n[B] 统一结算通道（take 按 uid、items 带快照）');
resetWorld();
var s1 = makeSword('one', 50, { enhance: 1 });
var s2 = makeSword('two', 80, {});
var rb = global.RewardService.apply({ stones: 10, take: [{ itemId: 'wpn_qingfeng', count: 1, uid: 'sword_one' }] }, { source: 'test' });
eq(rb.success !== false, true, 'B1 按 uid 扣货成交');
var left = global.inventory.slots.filter(function (s) { return s && s.templateId === 'wpn_qingfeng'; });
eq(left.length, 1, 'B2 扣的正是那件（一剩一）');
eq(left[0].uid, 'sword_two', 'B3 同模板的兄弟件毫发无伤（旧路 removeByTemplate 会乱扣一件）');
eq(left[0].durability, 80, 'B4 留下的那把耐久原样');
// 错号整体回滚
var stonesBefore = wallet();
var rb2 = global.RewardService.apply({ stones: 10, take: [{ itemId: 'wpn_qingfeng', count: 1, uid: 'sword_ghost' }] }, { source: 'test' });
eq(rb2.success, false, 'B5 uid 查无此件——整笔回绝');
eq(wallet(), stonesBefore, 'B6 回绝时钱分文未动（原子事务，杜绝白拿钱不交货）');
eq(global.inventory.slots.filter(function (s) { return s && s.templateId === 'wpn_qingfeng'; }).length, 1, 'B7 货也分文未动');
// items 带快照原物奉还
resetWorld();
global.inventory.slots = [null];
global.inventory.maxSlots = 1;
global.addItem('mat_lingzhi', 1);   // 占满独格
var rb3 = global.RewardService.apply({ stones: -5, items: [{ itemId: 'wpn_qingfeng', count: 1, snap: snapA }] }, { source: 'test' });
eq(rb3.success, false, 'B8 背包放不下——给物失败整笔回滚');
eq(wallet(), 1000, 'B9 钱没扣（同一事务）');

// ==================== C · 当铺实例账 ====================
console.log('\n[C] 当铺实例账（当的是哪件，赎回来就是哪件）');
resetWorld();
var sword = makeSword('hero', 42, { enhance: 5, inscription: '赠别' });
var r1 = PS.pawnInstance('sword_hero');
eq(!!r1.success, true, 'C1 装备按件当上柜');
eq(wallet(), 1000 + 700, 'C2 当金=行价1000×七折=700（本城平价）');
eq(mirror(), wallet(), 'C3 两处钱包同账（统一通道双写）');
eq(global.inventory.slots.filter(function (s) { return s && s.templateId === 'wpn_qingfeng'; }).length, 0, 'C4 那件货真离囊');
var led = global.currentCharData._pawn;
eq(led.item, 'wpn_qingfeng', 'C5 当票记名');
assert(led.snap && led.snap.uid === 'sword_hero' && led.snap.durability === 42 && led.snap.customProps.enhance === 5, 'C6 实例快照上柜（uid/耐久/强化/铭文全在）');
eq(led.snap.customProps.inscription, '赠别', 'C7 铭文这类私账也随柜保管');
// 一票一物
var r1b = PS.pawnInstance('sword_ghost');
assert(r1b.error && r1b.error.indexOf('一票一物') >= 0, 'C8 柜上有票不再收新货（一票一物原样）');
// 赎回原物奉还
CUR_DAY = 110;
var fee = Math.round(700 * 1.15);
var r2 = PS.redeem();
eq(!!r2.success, true, 'C10 当期一月内赎得回');
eq(wallet(), 1700 - fee, 'C11 赎金=当金加息一成五（805）');
eq(mirror(), wallet(), 'C12 赎金也双写');
var ret = global.inventory.slots.filter(function (s) { return s && s.templateId === 'wpn_qingfeng'; })[0];
assert(!!ret, 'C13 剑回行囊');
eq(ret.uid, 'sword_hero', 'C14 还是原来那把（uid 认领归位——不是白板新货）');
eq(ret.durability, 42, 'C15 耐久原样');
eq(ret.customProps.enhance, 5, 'C16 强化原样');
eq(ret.customProps.inscription, '赠别', 'C17 铭文原样');
eq(global.currentCharData._pawn.snap, null, 'C18 票销快照销（柜上不留客货底账）');
// 满包赎不走：钱不扣、票还在
resetWorld();
var sw2 = makeSword('full', 10, {});
PS.pawnInstance('sword_full');
global.inventory.slots = [null];
global.inventory.maxSlots = 1;
global.addItem('mat_lingzhi', 1);   // 把最后一格占掉
var stonesC = wallet();
var r3 = PS.redeem();
assert(r3.error && r3.error.indexOf('背包放不下') >= 0, 'C19 满包赎不走——如实相告');
eq(wallet(), stonesC, 'C20 赎不走钱分文不扣');
assert(global.currentCharData._pawn.item === 'wpn_qingfeng', 'C21 货还在柜上、当票还有效');
global.inventory.maxSlots = 30;
// 死当：快照随票销毁
CUR_DAY = 999;
var f1 = PS.forfeitCheck();
eq(!!(f1 && f1.forfeited), true, 'C22 过期死当销票');
eq(global.currentCharData._pawn.snap, null, 'C23 柜上不留死当货的底账（货早拍给货郎了）');
// 老当票（无快照）照旧赎——按模板补货，向后兼容
resetWorld();
global.currentCharData._pawn = { item: 'mat_lingzhi', count: 3, loan: 42, due: CUR_DAY + 20 };
var r4 = PS.redeem();
eq(!!r4.success, true, 'C24 老当票无快照照旧赎得回（模板补货老路原样）');
eq(global.inventory.slots.filter(function (s) { return s && s.templateId === 'mat_lingzhi'; })[0].count, 3, 'C25 数目如票');
// 存档往返：快照是纯对象，随 _pawn 骑角色存档
resetWorld();
var sw3 = makeSword('save', 77, { enhance: 2 });
PS.pawnInstance('sword_save');
var round = JSON.parse(JSON.stringify(global.currentCharData._pawn));
eq(round.snap.uid, 'sword_save', 'C26 当票连快照可序列化（存档往返原样）');
eq(round.snap.durability, 77, 'C27 耐久随档');
global.currentCharData._pawn = round;
CUR_DAY = 105;
var r5 = PS.redeem();
eq(!!r5.success, true, 'C28 读档回来的当票赎得动');
eq(global.inventory.slots.filter(function (s) { return s && s.uid === 'sword_save'; })[0].durability, 77, 'C29 读档赎回仍是原物');

// ==================== D · 柜面清单 ====================
console.log('\n[D] 柜面清单（装备逐件、散货聚合）');
resetWorld();
// 装备走模板路被拦（空柜状态下验——有票时一票一物先拦，那是 C8 的账）
var r1c = PS.pawnItem('wpn_qingfeng', 1, 1000);
assert(r1c.error && r1c.error.indexOf('按件当') >= 0, 'D0 装备不许按模板当（防扣错件/还白板）');
makeSword('list_a', 10, {});
makeSword('list_b', 90, {});
global.addItem('mat_lingzhi', 3);
var pl = PS.pawnableList();
eq(pl.length, 3, 'D1 两把剑两件列 + 灵芝一行聚合（同模板装备不合行——当的是具体哪把）');
var rows = pl.filter(function (r) { return r.inst; });
eq(rows.length, 2, 'D2 装备行都带实例标');
assert(rows.every(function (r) { return !!r.uid; }), 'D3 装备行都带 uid（按钮按件交割）');
var psSrc = src('js/city-facilities/pawn-service.js');
assert(psSrc.indexOf('pawnFromPicker(null, ') >= 0, 'D4 清单窗装备按钮走按件口');
assert(psSrc.indexOf('赎回来还是原来那件') >= 0, 'D5 柜面把实例账讲在明处（牌面不撒谎）');

// ==================== E · 哨兵 ====================
console.log('\n[E] 哨兵');
var segStart = psSrc.indexOf('pawnInstance: function');
var segEnd = psSrc.indexOf('// 赎回：加息一成五');
var seg = psSrc.slice(segStart, segEnd);
eq((seg.match(/Math\.random/g) || []).length, 0, 'E1 按件当零骰（当金是定数：行价×行情×七折）');
assert(seg.indexOf('localStorage') < 0, 'E2 实例账零写档（快照骑 _pawn 老字段随角色档往返，不另立键）');
var bSrc = src('js/battle.js');
assert(bSrc.indexOf('第八十三波') < 0, 'E3 战斗文件本波零改动');
var etSrc = src('js/economy/economy-transaction.js');
assert(etSrc.indexOf('global.restoreItemFromSnapshot') >= 0, 'E4 交易层还原口原样（现在真有人接了）');
var esSrc = src('js/enhanced-shop.js');
assert(esSrc.indexOf('restoreItemFromSnapshot(item.itemSnapshot)') >= 0, 'E5 商铺回购顺带吃到实例还原（强化装备卖而复合不再变白板——潜在账损同波愈合）');
var invSrc = src('js/inventory.js');
assert(invSrc.indexOf('window.restoreItemFromSnapshot = restoreItemFromSnapshot') >= 0, 'E6 还原口挂上全局（两拨老调用方都能接到）');
var rsSrc = src('js/core/reward-service.js');
assert(rsSrc.indexOf('removeByUid') >= 0 && rsSrc.indexOf('it.snap') >= 0, 'E7 统一结算通道认 uid 扣货与快照给物（老调用方形状不变，可选字段向后兼容）');
var leak = null;
[seg, psSrc.slice(psSrc.indexOf('pawnableList: function'), psSrc.indexOf('_wired: false'))].forEach(function (txt) {
    (txt.match(/'[^']+'/g) || []).forEach(function (s) {
        var v = s.slice(1, -1);
        if (/[+);({\[,?<>]/.test(v)) return;
        if (/^[a-z0-9_]+(?:[-_: ][a-z0-9_]+)*$/i.test(v)) return;
        if (/[A-Za-z]/.test(v) && /[一-龥]/.test(v)) leak = leak || s;
    });
});
eq(leak, null, 'E8 新账话术零中英混排（漏: ' + leak + '）');

console.log('\n========== 第八十三波 · 装备典当实例账 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
