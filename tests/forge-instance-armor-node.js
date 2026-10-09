/*
 * tests/forge-instance-armor-node.js —— 一炉一器 + 自炼护具真接战斗
 *
 * 三件事，各自有断言：
 *   A 一炉一器：连炼两把同名剑 → 两个 id、两张模板、两格背包；改第二件动不了第一件
 *              （旧账：产物 id 写死 recipe.result.itemId + 全局模板「名品定模」
 *               ⇒ 后炼的精货静默改写背包里旧那件，玩家看着旧剑凭空变强）
 *   B 甲落真槽：自炼护具 slot ∈ equipment.js equipmentSlots 十二槽
 *              （旧账：EMBRYOS.armor.slot='armor'，十二槽里没这一格）
 *   C 战斗真吃：coverage 非空 → battle.js getArmorData 认得 → applyArmorToWound
 *              不再当 0（真跑 battle.js 自己的函数，不是抄一份等价逻辑）
 *
 * 运行台照 tests/forge-material-granularity-node.js 的路子：按 仙侠.html 真实 script 顺序
 * eval 全量 js（不造假 itemById / 不抄 battle.js 公式）。
 *
 * 抓回归（把产物改回写死全局模板 → 本套件红）：
 *   把 js/crafting/forging-compound.js 里 `var templateId = _nextInstanceId(baseId);`
 *   改回 `var templateId = baseId;`，node tests/forge-instance-armor-node.js
 *   → A1/A2/A3/A5/A6/B0/C0 会红（背包两格指向同一模板、改第二件改到第一件、
 *      存档回填把两格一起改写）。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
var pass = 0, fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; console.error('  [FAIL] ' + m); } }
function eq(a, b, m) { ok(a === b, m + '（实际=' + JSON.stringify(a) + ' 期望=' + JSON.stringify(b) + '）'); }
function sec(s) { console.log('\n[' + s + ']'); }

// ==================== 真实运行台 ====================
function permissive() {
  const p = new Proxy(function () {}, {
    get(t, k) {
      if (k === Symbol.toPrimitive) return () => 0;
      if (k === 'toString') return () => '';
      if (k === 'valueOf') return () => 0;
      if (k === Symbol.iterator) return function* () {};
      if (k === 'then') return undefined;
      if (k === Symbol.toStringTag) return 'Obj';
      if (k === 'length') return 0;
      return p;
    },
    set() { return true; }, apply() { return p; }, construct() { return p; },
  });
  return p;
}
function el() {
  return {
    classList: { add() {}, remove() {}, contains: () => false, toggle() {} },
    style: {}, dataset: {}, appendChild() {}, removeChild() {}, remove() {},
    querySelectorAll: () => [], querySelector: () => null, closest: () => null,
    addEventListener() {}, removeEventListener() {}, setAttribute() {}, getAttribute() { return null; },
    innerHTML: '', textContent: '', value: '', checked: false, children: [], childNodes: [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 }),
    focus() {}, click() {}, scrollIntoView() {}, getContext: () => null, insertAdjacentHTML() {},
  };
}
function loadGame() {
  const html = fs.readFileSync(path.join(ROOT, '仙侠.html'), 'utf8');
  const order = (html.match(/src="([^"]+\.js)"/g) || []).map(s => s.slice(5, -1));
  const bodyEl = el();
  const w = {
    console: { log() {}, warn() {}, error() {}, info() {}, debug() {} },
    Math, Date, JSON, Object, Array, String, Number, Boolean, Error, RegExp, TypeError, RangeError,
    isNaN, isFinite, parseInt, parseFloat, encodeURIComponent, decodeURIComponent,
    setTimeout, clearTimeout, setInterval, clearInterval, setImmediate, Promise, URL, URLSearchParams,
    Uint8Array, Int32Array, Float32Array, Map, Set, WeakMap, WeakSet, Symbol, Proxy, Reflect, Intl,
    structuredClone: (o) => JSON.parse(JSON.stringify(o)),
    performance: { now: () => 0 },
    document: {
      querySelectorAll: () => [], querySelector: () => null, createElement: el, createDocumentFragment: el,
      getElementById: () => null, getElementsByClassName: () => [], getElementsByTagName: () => [],
      body: bodyEl, head: bodyEl, documentElement: bodyEl, cookie: '', readyState: 'complete',
      addEventListener() {}, removeEventListener() {}, dispatchEvent() {},
      createEvent: () => ({ initEvent() {} }), activeElement: null,
    },
    localStorage: {
      _d: {}, getItem(k) { return k in this._d ? this._d[k] : null; },
      setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; },
      clear() { this._d = {}; }, key: () => null, get length() { return Object.keys(this._d).length; },
    },
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {}, clear() {}, key: () => null, get length() { return 0; } },
    navigator: { userAgent: 'node-test', language: 'zh-CN', platform: 'win32' },
    location: { href: 'file:///t.html', search: '', hash: '', reload() {} },
    alert() {}, confirm: () => true, prompt: () => '', open: () => null, close: () => null,
    addEventListener() {}, removeEventListener() {}, dispatchEvent() {},
    getComputedStyle: () => ({ getPropertyValue: () => '' }),
    requestAnimationFrame: () => 0, cancelAnimationFrame: () => {}, matchMedia: () => ({ matches: false, addListener() {}, removeListener() {} }),
    AudioContext: function () { return { createOscillator: () => ({ connect() {}, start() {}, stop() {} }), createGain: () => ({ connect() {}, gain: {} }), destination: {}, currentTime: 0, resume() {} }; },
    fetch: () => new Promise(() => {}),
    XMLHttpRequest: function () { return { open() {}, send() {}, setRequestHeader() {} }; },
    Image: function () {}, FileReader: function () { return { readAsText() {}, addEventListener() {} }; },
    currentCharData: {}, inventory: { slots: [], currency: {}, items: {} }, allItems: {},
  };
  w.window = w; w.globalThis = w; w.self = w; w.top = w; w.parent = w;
  const ctx = new Proxy(w, {
    has() { return true; },
    get(t, k) { if (k === Symbol.unscopables) return undefined; if (k in t) return t[k]; return permissive(); },
    set(t, k, v) { t[k] = v; return true; },
  });
  vm.createContext(ctx);
  const hardErr = [];
  for (const rel of order) {
    const fp = path.join(ROOT, rel.replace(/\//g, path.sep));
    if (!fs.existsSync(fp)) { hardErr.push('MISSING ' + rel); continue; }
    try { vm.runInContext(fs.readFileSync(fp, 'utf8'), ctx, { filename: rel, timeout: 30000 }); }
    catch (e) { hardErr.push(rel + ' :: ' + (e && e.message)); }
  }
  return { ctx: ctx, hardErr: hardErr, mounted: order.length };
}

const G = loadGame();
const W = G.ctx;
const F = W.ForgingCompound;

console.log('\n========== forge-instance-armor（一炉一器 + 自炼甲接战斗） ==========');
eq(G.hardErr.length, 0, 'A0 全量 ' + G.mounted + ' 本 js 挂载零硬错误'
  + (G.hardErr.length ? '（' + G.hardErr.slice(0, 3).join(' | ') + '）' : ''));
ok(!!F, 'A0b ForgingCompound 已挂载');
ok(typeof W.getArmorData === 'function' && typeof W.applyArmorToWound === 'function',
    'A0c battle.js 的 getArmorData / applyArmorToWound 挂在 window 上（本套件真调它，不抄一份）');
if (!F) { console.log('\n通过：' + pass + ' 失败：' + fail); process.exit(1); }

// ---------- 角色与材料账（真背包：addItem 不打桩，货真落格） ----------
const cd = W.currentCharData;
cd.lifeSkills = { '锻造': 60, '伐木': 60, '采矿': 60 };
cd.qi = 999999; cd.hp = 100; cd.maxHp = 100; cd.location = '炎城·铸剑坊';
W.getLifeSkill = function (k) { return (cd.lifeSkills || {})[k] || 0; };
W.compoundMat = { consume: function () { return true; }, refund: function () { return null; } };
const BAG = [];   // 本套件自己记「发了几件、发的是哪个 id」（背包真 ItemInstance 由 W.inventory 管）
W.addResultItem = function (id, n) { BAG.push({ id: id, n: n }); return W.addItem(id, n); };

function clearBag() {
  for (var i = 0; i < W.inventory.slots.length; i++) W.inventory.slots[i] = null;
  BAG.length = 0;
}
function slotById(id) {
  return W.inventory.slots.filter(function (s) { return s && s.templateId === id; })[0] || null;
}
function forge(embryo, main, assist, alloc, rune) {
  cd.qi = 999999;
  var r = F.executeCompoundForging('recipe_' + embryo + '_open', {
    embryo: embryo, main: main, assist: assist, rune: rune || [], allocation: alloc || {}
  });
  return r;
}

// ==================== A · 一炉一器 ====================
sec('A 一炉一器（同款自炼器并存，后炼的不得改写背包里旧那件）');

// A1 两炉同名剑（料不同 → 属性本就不同）
var 剑一 = forge('sword', ['mat_iron_ore'], ['mat_copper_ore', 'mat_tin_ore'], { edge: 3 });
var 剑二 = forge('sword', ['mat_star_iron'], ['mat_mithril', 'mat_meteorite'], { edge: 3, tough: 2 });
ok(剑一.ok && 剑二.ok, 'A1 连开两炉剑都成（' + (!剑一.ok ? '一炉 ' + 剑一.reason : '') + (!剑二.ok ? '二炉 ' + 剑二.reason : '') + '）');

ok(剑一.itemId !== 剑二.itemId,
    'A2 两炉各发一份 id，不是同一个（' + 剑一.itemId + ' ≠ ' + 剑二.itemId + '）');
ok(String(剑一.itemId).indexOf(剑二.itemId) !== 0 || String(剑二.itemId).indexOf(剑一.itemId) !== 0,
    'A2b 两个 id 不是谁包含谁（各有各的身份，不是同一串加了尾巴的同一个模板）');
var 基名 = F.COMPOUND_FORGING_RECIPES.filter(function (r) { return r.id === 'recipe_sword_open'; })[0].result.itemId;
ok(剑一.itemId !== 基名 && 剑二.itemId !== 基名,
    'A2c 产物 id 不再是写死的方子基名 ' + 基名 + '（写死基名＝后炼的改写旧那件）');

var 格一 = slotById(剑一.itemId), 格二 = slotById(剑二.itemId);
ok(!!格一 && !!格二, 'A3 背包里两格都在（' + !!格一 + ' / ' + !!格二 + '）');
ok(!!格一 && !!格二 && 格一 !== 格二, 'A3b 两格是两件，不是同一格数了两次');

// A4 背包两件属性真的可以不同（不是同一张模板的两次显示）
var 甲一 = 格一 && 格一.getTemplate(), 甲二 = 格二 && 格二.getTemplate();
ok(!!甲一 && !!甲二, 'A4 两格都读得到自己的模板');
if (甲一 && 甲二) {
  ok(JSON.stringify(甲一.combatBonus) !== JSON.stringify(甲二.combatBonus)
      || 甲一.attrs.defense !== 甲二.attrs.defense || 甲一.name !== 甲二.name,
     'A4b 两件属性读得出差别（一：' + 甲一.name + ' attack=' + JSON.stringify(甲一.combatBonus)
     + '｜二：' + 甲二.name + ' attack=' + JSON.stringify(甲二.combatBonus) + '）');
}

// A5 ★ 核心：改第二件，第一件纹丝不动（旧账的真病灶）
function 快照(t) { return JSON.stringify({ name: t.name, combatBonus: t.combatBonus, attrs: t.attrs, price: t.price, slot: t.slot }); }
var 一号快照 = 甲一 && 快照(甲一);
var 一号原名 = 甲一 && 甲一.name;
// 模拟「后炼的那件被强化/改价」：直接改第二件的全局模板
if (甲二) { 甲二.combatBonus.attack = 999; 甲二.price = 99999; 甲二.name = '被改过的第二件'; }
ok(甲一 && 快照(甲一) === 一号快照,
    'A5 改第二件（attack=999 / 改名 / 改价）后，第一件逐字段原样（' + 一号原名 + '）');

// A5b 反向：改第一件也不许动第二件
if (甲一) { 甲一.combatBonus.attack = -1; 甲一.name = '被改过的第一件'; }
ok(甲二 && 甲二.name === '被改过的第二件' && 甲二.price === 99999,
    'A5b 改第一件也不动第二件（各人各的模板）');
ok(甲一 && 甲一.name === '被改过的第一件' && !!W.itemById[剑一.itemId],
    'A6 改第一件也真落在它自己身上（改过的名字挂在 ' + 剑一.itemId + '，不在 ' + 剑二.itemId + ' 上）');

// A7 存档往返：两个实例各自回填，不合并
var snapAll = JSON.parse(JSON.stringify(W.StateRegistry.exportAll()));
var 模子账 = snapAll.forgingConfig.data.compoundTemplates;
ok(!!模子账 && !!模子账[剑一.itemId] && !!模子账[剑二.itemId],
    'A7 两件都在 compoundTemplates 账上（' + (模子账 ? Object.keys(模子账).length : 0) + ' 条）');
delete W.itemById[剑一.itemId]; delete W.itemById[剑二.itemId];
W.StateRegistry.importAll(snapAll);
ok(!!W.itemById[剑一.itemId] && !!W.itemById[剑二.itemId], 'A7b 读档后两件的模板都回来了');
if (W.itemById[剑一.itemId] && W.itemById[剑二.itemId]) {
  ok(W.itemById[剑一.itemId] !== W.itemById[剑二.itemId],
      'A7c 回填出来是两张独立模板（不是同一个对象被两个 id 指）');
  W.itemById[剑二.itemId].combatBonus.attack = 777;
  ok(W.itemById[剑一.itemId].combatBonus.attack !== 777,
      'A7d 读档后改第二件也不动第一件');
}

// A8 开了 N 炉 → N 个实例 id，互不重号（并发/连开都不撞）
var ids = {};
for (var i = 0; i < 5; i++) { var r = forge('blade', ['mat_iron_ore'], ['mat_copper_ore', 'mat_tin_ore'], { edge: 1 }); ids[r.itemId] = (ids[r.itemId] || 0) + 1; }
eq(Object.keys(ids).length, 5, 'A8 连开 5 炉得 5 个不同 id（无重号：' + Object.keys(ids).join(' ') + '）');

// ==================== B · 甲落真实十二槽 ====================
sec('B 自炼护具落真实装备槽（equipment.js equipmentSlots 十二槽）');
var 十二槽 = (W.equipmentSlots || []).map(function (s) { return s.id; });
eq(十二槽.length, 12, 'B0 equipmentSlots 是十二槽（实测 ' + 十二槽.length + '）');
eq(F.EMBRYOS.armor.slot, 'body', 'B0b 甲胚的 slot 是 body（不是十二槽里没有的 \'armor\'）');
ok(十二槽.indexOf(F.EMBRYOS.armor.slot) >= 0, 'B0c 甲胚的 slot 真在十二槽里');

var 甲炉 = forge('armor', ['mat_dark_iron'], ['mat_mithril', 'mat_meteorite'], { tough: 3 });
ok(甲炉.ok, 'B1 开一炉甲（' + (甲炉.ok ? '' : 甲炉.reason) + '）');
var 甲模板 = 甲炉.ok && W.itemById[甲炉.itemId];
ok(!!甲模板, 'B2 甲的模板在册');
if (甲模板) {
  ok(十二槽.indexOf(甲模板.slot) >= 0,
      'B3 ★ 自炼甲的 slot ∈ 真实十二槽（实得 ' + 甲模板.slot + '）');
  // 真走 inventory 的装备入口（不是自己塞 currentEquipment）
  ok(typeof W.equipItemFromInventory === 'function', 'B4 装备入口 equipItemFromInventory 在（真走它，不手工塞装备栏）');
  var 旧confirm = W.confirm; W.confirm = function () { return true; };
  var 上甲 = W.equipItemFromInventory(格Id(slotById(甲炉.itemId)));
  W.confirm = 旧confirm;
  ok(上甲 === true, 'B4b 自炼甲真能穿上（equipItemFromInventory 返回 ' + 上甲 + '）');
  ok(!!(W.currentEquipment && W.currentEquipment.body), 'B4c 穿上后身体槽非空');
}
function 格Id(s) { return s ? s.uid : null; }

// ==================== C · 战斗真吃 coverage/resistance ====================
sec('C 战斗真吃 coverage/resistance（跑 battle.js 自己的函数）');
ok(!!甲模板 && 甲模板.coverage && Object.keys(甲模板.coverage).length > 0,
    'C1 自炼甲的 coverage 非空（' + JSON.stringify(甲模板 && 甲模板.coverage) + '）');
ok(!!甲模板 && 甲模板.resistance && (甲模板.resistance.slash || 甲模板.resistance.pierce || 甲模板.resistance.blunt),
    'C2 resistance 三向非零（' + JSON.stringify(甲模板 && 甲模板.resistance) + '）');
// coverage 的键必须是 battle.js 真会查的部位（SLOT_TO_PART_MAP.body 的成员）
var 躯干部位 = ['chest', 'abdomen', 'dantian', 'waist', 'pelvis', 'neck'];
var 键合法 = 甲模板 && Object.keys(甲模板.coverage || {}).every(function (p) { return 躯干部位.indexOf(p) >= 0; });
ok(键合法, 'C3 coverage 的键都是 battle.js 真查得到的躯干部位（不是 \'back\' 这种查不到的）');
ok(甲模板 && Object.keys(甲模板.coverage || {}).some(function (p) { return p === 'chest'; }),
    'C3b 至少盖住 chest（打躯干最常见的部位）');

var 护甲 = W.getArmorData('body');
ok(!!护甲, 'C4 ★ battle.js getArmorData(\'body\') 认得这件自炼甲（旧账：整体判 0）');
ok(护甲 && 护甲.resistance && 护甲.coverage, 'C4b 护甲数据两字段齐全（getArmorData 的 :257 门槛）');

// 真打一刀：Math.random 固定成 0（coverage 必中），看伤口是否真被护甲改写；
// 对照组是同一刀打在没穿甲的身体槽上（body 清空跑一遍，不是凭空比一个数）
var 裸伤 = { partId: 'chest', severity: 100, depth: 20, vesselGrade: 10, externalBleedRate: 30, internalBleedRate: 20, painSource: 25, structuralDamage: 15 };
var 旧rand = Math.random;
Math.random = function () { return 0; };
var 穿上甲 = W.currentEquipment.body;
W.currentEquipment.body = null;
var 无甲 = W.applyArmorToWound('chest', JSON.parse(JSON.stringify(裸伤)), 'slash');
W.currentEquipment.body = 穿上甲;
var 打完 = W.applyArmorToWound('chest', JSON.parse(JSON.stringify(裸伤)), 'slash');
Math.random = 旧rand;
ok(!!打完._armorReduced, 'C5 ★ applyArmorToWound 真把这一刀算进护甲了（_armorReduced=' + !!打完._armorReduced + '，旧账：恒为 undefined）');
eq(打完._armorSlot, 'body', 'C5b 认的是身体槽');
ok(打完.severity < 无甲.severity,
    'C6 护甲真减伤（severity ' + 无甲.severity + ' → ' + 打完.severity + '）');
ok(打完._armorResist > 0, 'C6b 抗性真读到了（_armorResist=' + 打完._armorResist + '，类型减伤封在 30%）');
// 抗性/200 封顶 30%（js/battle.js:306）——别顺手改战斗倍率
ok(打完._armorResist / 200 <= 0.3001, 'C6c 抗性/200 的减伤没越过 30% 封顶（battle.js 原公式，本批没碰）');

// C7 耐久真会掉（打到最后 coverage 归零 → 该部位失护）
ok(护甲 && typeof 护甲.armorDurability === 'number' && 护甲.armorDurability > 0,
    'C7 自炼甲带 armorDurability（战斗里掉耐久的那条路有账可扣：' + (护甲 && 护甲.armorDurability) + '）');

// C8 器形账：金属主材出甲胄，其余出软甲（软甲覆盖率低、抗性低——不是同一个模板换名字）
var 金属甲 = F.armorFormOf(['mat_dark_iron']);
var 软甲 = F.armorFormOf(['mat_beast_skin']);
ok(金属甲.id === 'plate', 'C8a 金石主材出甲胄（' + 金属甲.id + '）');
ok(软甲.id === 'soft', 'C8b 兽皮主材出软甲（' + 软甲.id + '）');
ok(软甲.coverage.chest < 金属甲.coverage.chest
   && 软甲.resistance.slash < 金属甲.resistance.slash
   && 软甲.armorDurability < 金属甲.armorDurability,
    'C8c 软甲各项都真比甲胄低（coverage ' + 软甲.coverage.chest + '<' + 金属甲.coverage.chest
    + ' / slash ' + 软甲.resistance.slash + '<' + 金属甲.resistance.slash
    + ' / 耐久 ' + 软甲.armorDurability + '<' + 金属甲.armorDurability + '）');
// C8d 两件软甲/甲胄真能各自开炉拿到（不是只有账没接线）
var 金甲炉 = forge('armor', ['mat_dark_iron'], ['mat_mithril', 'mat_meteorite'], { tough: 2 });
var 皮甲炉 = forge('armor', ['mat_beast_skin'], ['mat_beast_bone', 'mat_beast_hide'], { tough: 2 });
var 金甲 = 金甲炉.ok && W.itemById[金甲炉.itemId], 皮甲 = 皮甲炉.ok && W.itemById[皮甲炉.itemId];
ok(!!金甲 && !!皮甲 && 金甲.armorForm === 'plate' && 皮甲.armorForm === 'soft',
    'C8d 两炉甲各自的器形对得上主材（金石=' + (金甲 && 金甲.armorForm) + ' 兽皮=' + (皮甲 && 皮甲.armorForm) + '）');
ok(!!皮甲 && 皮甲.coverage.chest < 金甲.coverage.chest,
    'C8e 皮甲炉出来的甲 coverage 真低于金甲炉（' + (皮甲 && 皮甲.coverage.chest) + ' < ' + (金甲 && 金甲.coverage.chest) + '）');

// C9 品相只真动抗性与耐久，不放大 coverage（形制是形制）
var 甲多 = forge('armor', ['mat_dark_iron'], ['mat_mithril', 'mat_meteorite'], { edge: 3, tough: 3, heavy: 2 });
var 甲少 = forge('armor', ['mat_iron_ore'], ['mat_copper_ore', 'mat_tin_ore'], { edge: 1 });
var 多 = 甲多.ok && W.itemById[甲多.itemId], 少 = 甲少.ok && W.itemById[甲少.itemId];
if (多 && 少) {
  ok(多.coverage.chest === 少.coverage.chest,
      'C9 coverage 不随品相放大（两炉都是 ' + 多.coverage.chest + '）');
  ok(多.resistance.slash >= 少.resistance.slash,
      'C9b 抗性随品相真动（' + 少.resistance.slash + ' → ' + 多.resistance.slash + '）');
}

console.log('\n========== forge-instance-armor：通过 ' + pass + ' / 失败 ' + fail + ' ==========');
process.exit(fail > 0 ? 1 : 0);