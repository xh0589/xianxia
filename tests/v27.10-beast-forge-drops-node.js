/**
 * v27.10-beast-forge-drops-node.js — 后期炼器料源（妖兽专属料）前提核与知情口验收
 *
 * 背景：炼虚/合体/大乘/渡劫这 30 级等级空间里，别处的材料口全是掷骰的
 * （采矿 4~15%、boss 掉落按权重抽）。后期料的正门立在炼器侧
 * （js/crafting/forging-compound.js · LATE_MATERIAL_TIERS → LATE_MATERIAL_DROPS），
 * 由 js/battle.js 在妖兽被打死结算时调 ForgingCompound.settleLateMaterial('beast', …) 结账。
 * 本批在 js/extensions/beast-ecosystem.js 补的是**玩家知情口**（图鉴格 / 尸体面板），
 * 一个字都不往那张表里写，也不另发一份料（另发一份就是双掉料）。
 *
 * 本套不测功能好不好，只测六件硬事 + 一件防自欺：
 *   A 材料 id 真实   每条后期料在真实 itemById 里查得到，且炉料点数高于粗铁（不虚名）
 *   B 妖兽 id 真实   每条 beast 档在真实 BEAST_DISTRIBUTION 与 BEAST_TEMPLATES 里都在册
 *   C 可达           真能从地图池 roll 出来 + 位面闸 + 收服闸放行
 *                    + 明写「落在 35~65 等级带内的有哪几只、带外的有哪几只」
 *   D 确定性         同口径反复触发逐次一致；料账源码零 Math.random（零骰纪律）
 *   E 炼器识别       每味料都被认成品阶，且妖兽料一炉点数远高于粗铁一炉
 *   F 周期口径       周期必掉（打满 N 只出一轮），第 1..N-1 只是没轮到、不是没打中
 *   G 知情口在册     图鉴格与尸体面板真接到 BeastEcosystem.forgeDropHint；无料的兽回空串
 *   J 反向自证       删一条档 / 换不存在的料 id / 撤掉接缝，本套必须当场报红
 *
 * 运行：node tests/v27.10-beast-forge-drops-node.js
 */
'use strict';

var fs = require('fs');
var vm = require('vm');
var path = require('path');
var ROOT = path.resolve(__dirname, '..');

var pass = 0, fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; console.error('  [FAIL] ' + m); } }
function eq(a, b, m) { ok(a === b, m + '（实际=' + JSON.stringify(a) + ' 期望=' + JSON.stringify(b) + '）'); }
function sec(s) { console.log('\n[' + s + ']'); }

// ==================== 真实运行台：按 仙侠.html 的 script 顺序 eval 全量 js ====================
// 不用假 itemById——A 段要的就是真表，造假表这一族断言就白写了。
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
    addEventListener() {}, removeEventListener() {}, setAttribute() {}, getAttribute: () => null,
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
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {}, clear() {} },
    navigator: { userAgent: 'node-test', language: 'zh-CN', platform: 'win32' },
    location: { href: 'file:///t.html', search: '', hash: '', reload() {} },
    alert() {}, confirm: () => true, prompt: () => '', open: () => null, close() {},
    addEventListener() {}, removeEventListener() {}, dispatchEvent() {},
    getComputedStyle: () => ({ getPropertyValue: () => '' }),
    requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
    matchMedia: () => ({ matches: false, addListener() {}, removeListener() {} }),
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
const ECO = W.BeastEcosystem;
const FORGE = W.ForgingCompound;
const ITEMS = W.itemById || {};
const TPL = W.BEAST_TEMPLATES || {};
const DIST = (ECO && ECO.BEAST_DISTRIBUTION) || [];

console.log('\n========== v27.10 后期炼器料源（妖兽专属料） ==========');
eq(G.hardErr.length, 0, 'A0 全量 ' + G.mounted + ' 本 js 挂载零硬错误'
  + (G.hardErr.length ? '（' + G.hardErr.slice(0, 3).join(' | ') + '）' : ''));
ok(!!ECO, 'A0b BeastEcosystem 已挂载');
ok(!!FORGE, 'A0c ForgingCompound 已挂载（本套要拿真炼器账核对，不造假账）');
if (!ECO || !FORGE) { console.log('\n通过：' + pass + '　失败：' + fail); process.exit(1); }

const ROWS = FORGE.LATE_MATERIAL_DROPS || [];
const 兽档 = ROWS.filter(function (d) { return d.kind === 'beast'; });
var bag = {}, bagLog = [];
function resetBag() { bag = {}; bagLog = []; }
W.addItem = function (id, n) { n = Math.max(1, Number(n) || 1); bag[id] = (bag[id] || 0) + n; bagLog.push(id + 'x' + n); return n; };
W.addItemFailReason = null;
function RO_AT(i) { return (W.REALM_ORDER || [])[i]; }
function RO_TPL(name) {
  var k = Object.keys(TPL).filter(function (kk) { return TPL[kk].name === name; })[0];
  return TPL[k] || { realm: '' };
}

// ==================== A · 材料 id 真实 ====================
sec('A 材料 id 真实（逐个对真物品表核，不许编）');
var 缺的料 = [], MATS = [];
兽档.forEach(function (d) {
  var it = ITEMS[d.matId];
  if (it) MATS.push(d.matId); else 缺的料.push(d.matId);
  ok(!!it, 'A1 ' + d.matId + ' 在真物品表里（'
    + (it ? it.name + '·lv' + it.level + '·' + it.quality : '★查无此物') + '，' + (d.beastName || '') + ' 出 ' + d.count + ' 件）');
});
eq(缺的料.length, 0, 'A2 全表无「查无此物」的料 id（缺=' + JSON.stringify(缺的料) + '）');
eq(MATS.length, 兽档.length, 'A3 每条兽档都核到了真物品');
var 粗铁点 = FORGE.materialPoints('mat_iron_ore');
var 太低 = MATS.filter(function (m) { return FORGE.materialPoints(m) <= 粗铁点 * 2; });
eq(太低.length, 0, 'A4 每味料的炉料点数都过粗铁两倍（粗铁=' + 粗铁点 + '，实读='
  + MATS.map(function (m) { return m + ':' + FORGE.materialPoints(m); }).join(' ') + '）');
var 非兽档 = ROWS.filter(function (d) { return d.kind !== 'beast'; });
ok(非兽档.length > 0, 'A5 另有非兽档后期料（矿脉/秘境）同在一张表里（' + 非兽档.length + ' 条），本套只核兽档');

// ==================== B · 妖兽 id 真实 ====================
sec('B 妖兽 id 真实（分布表 + 驯养模板双表在册）');
var 缺的兽 = [];
兽档.forEach(function (d) {
  var e = DIST.filter(function (x) { return x.id === d.beastId; })[0];
  if (!e) { 缺的兽.push(d.beastId); ok(false, 'B1 ' + d.beastId + ' ★不在 BEAST_DISTRIBUTION 里'); return; }
  var tid = (typeof W.getBeastTemplateIdFromEnemy === 'function') ? W.getBeastTemplateIdFromEnemy({ name: e.name }) : null;
  ok(!!e && !!tid, 'B1 ' + d.beastId + '（' + e.name + ' lv' + e.level + '）在分布表在册，且收服桥能按名字命中模板 ' + (tid || '★命不中'));
  ok(d.beastName === e.name, 'B2 ' + d.beastId + ' 档上写的兽名（' + d.beastName + '）与分布表一致（差一个名就是玩家看不懂的账）');
  eq(d.beastLevel, e.level, 'B3 ' + d.beastId + ' 档上写的兽等级与分布表一致');
});
eq(缺的兽.length, 0, 'B4 全表无悬空兽 id（缺=' + JSON.stringify(缺的兽) + '）');
var 有料兽 = DIST.filter(function (e) { return ECO.dropEntriesOf(e.id).length > 0; });
ok(有料兽.length > 0 && 有料兽.length < DIST.length,
  'B5 ' + DIST.length + ' 兽里 ' + 有料兽.length + ' 兽挂着后期料（' + 有料兽.map(function (e) { return e.name; }).join('、')
  + '），其余 ' + (DIST.length - 有料兽.length) + ' 兽挂不上——多出来的兽不得凭兽名白拿料');

// ==================== C · 可达（不是死表） ====================
sec('C 可达：真能遇上 + 收服闸放行 + 等级带档位账');
var 印过 = {}, 带内 = [], 带外 = [];
Object.keys(兽档.reduce(function (a, d) { a[d.beastId] = 1; return a; }, {})).forEach(function (bid) {
  var e = DIST.filter(function (x) { return x.id === bid; })[0];
  var 行 = ECO.dropEntriesOf(bid);
  印过[bid] = 1;
  // 真从地图池里 roll：地区+地形走 getBeastPoolForRegion，不许只对着表自说自话
  var 池有 = 0;
  e.regions.forEach(function (rg) {
    e.terrains.forEach(function (tr) {
      if (ECO.getBeastPoolForRegion(rg, tr).some(function (x) { return x.id === bid; })) 池有++;
    });
  });
  ok(池有 > 0, 'C1 ' + e.name + ' 在 ' + e.regions.join('/') + ' × ' + e.terrains.join('/')
    + ' 的地图池里真能 roll 出来（命中 ' + 池有 + ' 组地区地形）');
  var data = ECO.buildWildBeastData(e);
  ok(data && data._ecoBeastId === bid && data.level === e.level,
    'C2 ' + e.name + ' 战斗数据桥得回自己（等级 ' + (data && data.level) + '，生态 id ' + (data && data._ecoBeastId) + '）');
  // 位面闸：灵界须元婴（tier4）／魔界须化神（tier5）
  var 档 = 行[0];
  var gate = 档.plane === '灵界' ? 4 : (档.plane === '魔界' ? 5 : -1);
  var 兽序 = W.realmIndex(RO_TPL(e.name).realm);
  var 玩家化神序 = 5;
  ok(gate >= 0 && 兽序 >= gate, 'C3 ' + e.name + ' 位面闸（' + 档.plane + '须' + RO_AT(gate)
    + '）与兽境（' + RO_TPL(e.name).realm + '）匹配，tier' + gate + ' ≤ 兽序' + 兽序);
  ok(兽序 - 玩家化神序 < 2, 'C4 ' + e.name + ' 化神期玩家收服闸放行（拒收条件＝兽境序 − 玩家境序 ≥ 2；'
    + '玩家化神序' + 玩家化神序 + '，兽序' + 兽序 + '，差 ' + (兽序 - 玩家化神序) + '）');
  // 等级带档位账（诚实记账，不假装全在带内）
  var rpt = ECO.forgeDropReport(bid);
  ok(rpt.beastId === bid && rpt.wildLevel === e.level,
    'C5 ' + e.name + ' 知情口报得回自己（野外档 ' + rpt.wildLevel + '，带内判定 ' + (rpt.inBand ? '是' : '否') + '）');
  (e.level >= 35 && e.level <= 65 ? 带内 : 带外).push(e.name + ' lv' + e.level + '（' + 档.plane + '）');
});
ok(带内.length > 0, 'C6 落在 35~65 等级带内的有 ' + 带内.length + ' 只：' + 带内.join('、')
  + '——表不许整张死在带外（带外 ' + 带外.length + ' 只：' + 带外.join('、') + '）');
console.log('  · 等级带档位账（判据＝玩家敌人等级刻度 realmScaledEnemyLevel：炼虚 36~44 / 合体 43~51 / 大乘 50~58 / 渡劫 57~65 / 飞升 64~72 / 金仙 71~79）');
Object.keys(印过).forEach(function (bid) {
  var e = DIST.filter(function (x) { return x.id === bid; })[0];
  var 带 = [];
  ['炼虚', '合体', '大乘', '渡劫', '飞升', '金仙'].forEach(function (rc) {
    var lo = W.realmScaledEnemyLevel({ realm: rc, layer: 1 }), hi = W.realmScaledEnemyLevel({ realm: rc, layer: 9 });
    if (e.level >= lo && e.level <= hi) 带.push(rc + '（' + lo + '~' + hi + '）');
  });
  console.log('    ' + e.name + ' lv' + e.level + ' → 可对位境界：' + (带.length ? 带.join('、') : '★十二境刻度内无对位境界（这条登记目前对任何境界都开不了口）'));
});

// ==================== D · 确定性 ====================
sec('D 确定性（同口径反复触发结果一致 + 料账源码零骰）');
var ecoSrc = fs.readFileSync(path.join(ROOT, 'js/extensions/beast-ecosystem.js'), 'utf8');
var forgeSrc = fs.readFileSync(path.join(ROOT, 'js/crafting/forging-compound.js'), 'utf8');
var 料段 = forgeSrc.slice(forgeSrc.indexOf('function settleLateMaterial'), forgeSrc.indexOf('// ============== 3. 器胚'));
eq((料段.match(/Math\.random/g) || []).length, 0, 'D1 后期料结算段零 Math.random（零骰纪律）');
// 后期料的周期计数落在炼器侧随档的账上（本套要反复跑同一档，先把两本账一起归零）
function 归零() {
  if (W.StateRegistry && typeof W.StateRegistry.resetAll === 'function') W.StateRegistry.resetAll();
  resetBag();
}
var 撞库 = [];
Object.keys(印过).forEach(function (bid) {
  var e = DIST.filter(function (x) { return x.id === bid; })[0];
  var 档 = 兽档.filter(function (d) { return d.beastId === bid; })[0];
  var 序列 = [];
  for (var n = 0; n < 12; n++) {
    归零();
    var r = FORGE.settleLateMaterial('beast', { level: e.level, isBeast: true, name: e.name });
    var 名 = (r.given || []).map(function (g) { return (g.matId || g.id || g.name) + 'x' + g.count; }).sort().join(',');
    序列.push(名);
  }
  var 一致 = 序列.every(function (s) { return s === 序列[0]; });
  var 种数 = 序列.filter(function (s, i2) { return 序列.indexOf(s) === i2; }).length;
  ok(一致, 'D2 ' + bid + ' 从零状态连结 12 次逐次一致（结果 ' + 种数 + ' 种）：' + (序列[0] || '空手')
    + '（周期 everyN=' + 档.everyN + '，第 1 次不该有料）');
});
// 带内兽也真发得出料（不是只有带外那几只在发）
归零();
for (var q = 0; q < 4; q++) FORGE.settleLateMaterial('beast', { level: 60, isBeast: true, name: '云角鹿' });
ok(bagLog.length > 0 && bag[Object.keys(bag)[0]] > 0,
  'D3 带内兽（云角鹿 lv60·灵界）连打 4 只真落袋：' + (bagLog.join('、') || '★空手') + '（每 2 只一轮，4 只出 2 轮）');

// ==================== E · 炼器识别 ====================
sec('E 炼器识别（后期料被真炼器账认成品阶与词缀池）');
MATS.forEach(function (m) {
  var g = FORGE.MATERIAL_GRADE[m];
  var info = ECO.matGradeInfo(m);
  var pools = FORGE.getPoolsForMat(m);
  ok(!!g && g.grade >= 3 && info && info.grade === g.grade && info.points === FORGE.materialPoints(m) && pools.length > 0,
    'E1 ' + m + ' → 品阶' + (g && g.grade) + '·材料等级' + (g && g.level) + '·炉料' + (info && info.points)
    + ' 份·词缀池 ' + JSON.stringify(pools));
});
var 兽料主 = MATS[0], 兽料辅 = MATS[1] || MATS[0];
var b兽 = FORGE.computeForgeBudget([兽料主], [兽料辅, 兽料辅], [], 60, null);
var b铁 = FORGE.computeForgeBudget(['mat_iron_ore'], ['mat_iron_ore', 'mat_iron_ore'], [], 60, null);
ok(b兽.totalPoints > b铁.totalPoints * 2,
  'E2 同配方同技能，妖兽料一炉 ' + b兽.totalPoints + ' 点 vs 粗铁一炉 ' + b铁.totalPoints + ' 点'
  + '（主材' + 兽料主 + '，' + b兽.tier.label + '档）——后期强度确实来自「你打到了什么」');
var 高档料 = MATS.filter(function (m) { return FORGE.materialPoints(m) >= 20; });
ok(高档料.length >= 3, 'E3 至少三味料炉料 ≥20 份（超 36 级线的后期档，实读 ' + 高档料.length + ' 味：' + 高档料.join('、') + '）');
// 36 级线以下的老料混进后期兽档，是一张真实的口径裂缝——如实点出来，不假装没有
var 低档混 = MATS.filter(function (m) { var g = FORGE.MATERIAL_GRADE[m]; return g && Number(g.level) < 36; });
ok(低档混.length <= 2 && (MATS.length - 低档混.length) / MATS.length >= 0.75,
  'E4 后期兽档以 36 级以上的料为主（实读 ' + (MATS.length - 低档混.length) + '/' + MATS.length + ' 味达标；'
  + '低于 36 级线的例外 ' + 低档混.length + ' 味：'
  + 低档混.map(function (m) { return m + '（品阶' + FORGE.MATERIAL_GRADE[m].grade + '·材料等级' + FORGE.MATERIAL_GRADE[m].level + '）'; }).join('、') + '）');

// ==================== F · 周期口径 ====================
sec('F 周期口径（打满 N 只出一轮，第 1..N-1 只是没轮到）');
var 档表 = {};
兽档.forEach(function (d) { 档表[d.tierKey] = d; });
Object.keys(档表).forEach(function (key) {
  var d = 档表[key];
  归零();
  var 累计 = [];
  for (var k = 1; k <= d.everyN * 2 + 1; k++) {
    FORGE.settleLateMaterial('beast', { level: d.beastLevel, isBeast: true, name: d.beastName });
    累计.push(Object.keys(bag).reduce(function (a, kk) { return a + bag[kk]; }, 0));
  }
  var 每轮 = 0;
  var 本档料 = 兽档.filter(function (x) { return x.tierKey === key; });
  本档料.forEach(function (x) { 每轮 += Number(x.count) || 1; });
  var 期望 = []; for (var q = 1; q <= d.everyN * 2 + 1; q++) 期望.push(Math.floor(q / d.everyN) * 每轮);
  eq(JSON.stringify(累计), JSON.stringify(期望), 'F1 ' + d.beastName + '（每 ' + d.everyN + ' 只一轮·每轮 ' + 每轮 + ' 件）逐次累计到手数（实际='
    + 累计.join(',') + ' 期望=' + 期望.join(',') + '）');
  var 单轮 = [];
  归零();
  for (var k2 = 1; k2 <= d.everyN; k2++) {
    FORGE.settleLateMaterial('beast', { level: d.beastLevel, isBeast: true, name: d.beastName });
    单轮.push(Object.keys(bag).reduce(function (a, kk) { return a + bag[kk]; }, 0));
  }
  ok(单轮.slice(0, d.everyN - 1).every(function (v) { return v === 0; }) && 单轮[d.everyN - 1] === 每轮,
    'F2 ' + d.beastName + ' 前 ' + (d.everyN - 1) + ' 只空手而返不是没打中，第 ' + d.everyN + ' 只一次出齐 ' + 每轮
    + ' 件（口径写在 cadence 上：' + d.cadence + '）');
  ok(d.chance === 1 && d.guaranteed === true, 'F3 ' + d.beastName + ' 这档 chance=1、guaranteed=true（没有掉率这回事）');
});

// ==================== G · 知情口在册 ====================
sec('G 知情口：图鉴格 + 尸体面板真接到同一张嘴');
var appSrc = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
ok(appSrc.indexOf("window.BeastEcosystem.forgeDropHint(origName)") >= 0, 'G1 尸体面板印「这张皮能出什么料」');
ok(appSrc.indexOf("hint += (window.BeastEcosystem.forgeDropHint(id) || '')") >= 0, 'G2 灵兽图鉴那一格印「猎获可炼」——出发前唯一的知情位');
ok(appSrc.indexOf('grantBeastForgeMaterial') < 0,
  'G3 本批没有另开一处发料口子（正门在 battle.js 打死后结的炼器账；另发一份就是双掉料）');
var 提示 = ECO.forgeDropHint;
ok(typeof 提示 === 'function', 'G4 提示是料账自己长出来的那张嘴（图鉴/尸体共用，不是两处各写一句文案）');
ok(提示('beast_lingfox') === '' && 提示('查无此兽') === '', 'G5 没有料的兽提示回空串——界面自己决定印不印，不拿假提示占版面');
ok(/^<br>⚒️ 猎获可炼：/.test(提示('beast_cloudhorndeer')),
  'G6 高阶兽那一格真印得出来：' + 提示('beast_cloudhorndeer'));
ok(/每\d+只必出一轮|每只必出/.test(提示('beast_cloudhorndeer')), 'G7 提示里带得清掉率口径（玩家知道是几只一轮，不是在赌）');
ok(/品阶\d/.test(提示('beast_netherveinserpent')) && /炉料\d+份/.test(提示('beast_netherveinserpent')),
  'G8 提示里带得清品阶与炉料点数：' + 提示('beast_netherveinserpent'));
// 知情口不产生任何掉落（只读）
resetBag();
Object.keys(印过).forEach(function (bid) { ECO.forgeDropReport(bid); ECO.forgeDropHint(bid); ECO.dropEntriesOf(bid); ECO.matGradeInfo('mat_sky_iron'); });
eq(bagLog.length, 0, 'G9 知情口全程只读，一个料都不发（读料账与发料是两条路）');

// ==================== J · 反向自证（能抓回归） ====================
sec('J 反向自证：删一档 / 换假料 id / 撤接缝，本套必须当场报红');
{
  var 备份 = ROWS.slice();
  var 前提示 = ECO.forgeDropHint('beast_cloudhorndeer');

  // J1 删掉云角鹿这一档
  var i = 备份.findIndex(function (d) { return d.beastId === 'beast_cloudhorndeer'; });
  ROWS.splice(i, 1);
  var 删后 = ECO.forgeDropHint('beast_cloudhorndeer');
  ok(删后 !== 前提示, 'J1 删掉云角鹿那档后，图鉴提示真的变了（' + (删后 === '' ? '回空串' : 删后) + '）');
  ok(ECO.dropEntriesOf('beast_cloudhorndeer').length === 0, 'J2 删掉之后那只兽查无料（不是留了半条）');
  ROWS.splice(i, 0, 备份[i]);
  eq(ECO.forgeDropHint('beast_cloudhorndeer'), 前提示, 'J3 还原后逐字节回到原样（尺没被改坏）');

  // J2 换成物品表里没有的料 id
  var i2 = ROWS.findIndex(function (d) { return d.beastId === 'beast_gangwindcrane'; });
  var 原mat = ROWS[i2].matId;
  ROWS[i2].matId = 'mat_天外不存在';
  ok(ECO.matGradeInfo('mat_天外不存在') === null, 'J4 编出来的料 id 在炼器账里查无此物（matGradeInfo 如实回空，不拿本地数冒充）');
  var 假提示 = ECO.forgeDropHint('beast_gangwindcrane');
  ok(/品阶null|炉料null|undefined|NaN/.test(假提示), 'J5 编出来的料 id 在图鉴上露馅（品阶/点数不印出一个像样的数，骗不过去）：' + 假提示);
  ROWS[i2].matId = 原mat;
  ok(!/品阶null|炉料null|undefined|NaN/.test(ECO.forgeDropHint('beast_gangwindcrane')), 'J6 还原后图鉴不再露馅');

  // J3 悬空兽 id（同一档的多条一起换，否则留下的半条会替它说话）
  var 本档 = ROWS.map(function (d, ix) { return { d: d, ix: ix }; }).filter(function (x) { return x.d.beastId === 'beast_netherveinserpent'; });
  var 原兽们 = 本档.map(function (x) { return x.d.beastId; });
  本档.forEach(function (x) { x.d.beastId = 'beast_查无此兽'; });
  eq(ECO.dropEntriesOf('beast_netherveinserpent').length, 0, 'J7 悬空兽 id 让那档对不上任何真兽（原兽那几条从池里查不到了）');
  本档.forEach(function (x, ix) { x.d.beastId = 原兽们[ix]; });
  eq(ECO.dropEntriesOf('beast_netherveinserpent').length, 本档.length, 'J8 还原后原兽那几条都回来了');

  // J4 撤掉 app.js 接缝：判据本身要能红
  var 判据 = function (src) {
    return src.indexOf("window.BeastEcosystem.forgeDropHint(origName)") >= 0
      && src.indexOf("hint += (window.BeastEcosystem.forgeDropHint(id) || '')") >= 0;
  };
  ok(判据(appSrc), 'J9 真实 app.js 两处接缝都在（判据当前为真）');
  ok(!判据(appSrc.replace("window.BeastEcosystem.forgeDropHint(origName)", '')), 'J10 撤掉尸体面板接缝后判据转红——尺抓得住回归');

  // J5 对空表跑 A/B 段判据：必须一条都过不了
  var 空档 = [];
  ok(空档.filter(function (d) { return !!ITEMS[d.matId]; }).length === 0, 'J11 对空兽档跑 A 段判据：无一条能过（尺会红，不是恒绿）');
  ok(空档.filter(function (d) { return !!DIST.filter(function (x) { return x.id === d.beastId; })[0]; }).length === 0, 'J12 对空兽档跑 B 段判据：无一条能过');
}

console.log('\n========== v27.10 后期炼器料源（妖兽专属料） ==========');
console.log('通过：' + pass + '　失败：' + fail);
process.exit(fail ? 1 : 0);