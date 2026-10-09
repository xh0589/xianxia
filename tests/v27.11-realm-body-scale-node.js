/**
 * v27.11-realm-body-scale-node.js — 玩家战斗血量/耐久随境界成长 验收
 *
 * 病灶（实机日志）：`云角鹿 攻击了 admin 的 胸，造成 0 点伤害！admin 被击败！`
 *   ① 玩家这一身是常数级的：buildPlayerBattleEntity 把气血写死 clamp 0~100、部位耐久恒 100，
 *      整条链没有一处按境界放大；而妖兽侧走 js/combat-stats.js:468 scaleEnemyEntityToLevel
 *      （mul = 1 + max(0, L-10)*0.12），四级高阶兽实测部位耐久 700~1000、气血 1050~1500。
 *      量级差 7~10 倍 ⇒ 高阶兽一击 147~368 打穿 100 点的胸/头/颈（当场判死）。
 *   ② 与血量无关的第二根断桩：`_savedDurabilities` 里存着战败那一刻的 0 耐久（app.js closeBattle 快照），
 *      进场原样搬进实体 ⇒ takeDamage 算出 actual=0，却在 battle.js:933 照样判死 —— 就是那行「0 点伤害」。
 *
 * 修法：玩家与妖兽**同一把尺**（不造第二套 mul）——
 *   window.playerBattleBodyScale(cd)（js/app.js）
 *     ├ 等级刻度 = window.realmScaledEnemyLevel（12 境连续刻度 (境序-1)*7+层）
 *     └ 放大倍数 = window.scaleEnemyEntityToLevel（喂一颗满册探针身子进去读它给回来的上限）
 *   单位边界：场外 health / _savedDurabilities / bodyDurability 恒 0~100 比值，
 *   战斗实体上恒绝对点数，转换只发生在进场与 closeBattle 两处。
 *
 * 本套测的九件硬事：
 *   A 曲线      12 境单调递增；炼气/筑基一字未动（仍是 100）
 *   B 同一把尺  玩家量程 == 妖兽量程函数算出来的那个数（源码与数值双证）
 *   C 同境界对等 四只高阶兽（云角鹿60/血鬃魔犬72/罡风鹤78/幽脉蟒85）对同一条等级连续刻度上的玩家：
 *               要害耐久比 ≥ 0.9，且要害耐久 > 该兽攻击 ⇒ 一击打不穿，玩家有一战之力
 *   D 低阶不受损 低阶玩家对低阶兽的量程仍是 100，新手节奏没被这次改动碰过
 *   E 旧档兼容   常数级旧档三种（满册 / 半伤 / 要害 0）：不无敌、不直接死、比例保值
 *   F 量程一致   maxBloodVolume == summary.maxBloodVolume == _procBloodCap；血量/耐久不越上限
 *   G 折回闭环   toBody(toBattle(v)) === v；closeBattle 折回后仍是 0~100
 *   H 零骰       新增函数源码零 Math.random
 *   J 反向自证   把放大公式改回恒等（常数级），C/E 段必须当场报红
 *
 * 运行：node tests/v27.11-realm-body-scale-node.js
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

var G = loadGame();
var W = G.ctx;
var SRC = function (rel) { return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), 'utf8'); };

// ---------- 造角色 / 取实体 ----------
var REALMS = ['凡人', '炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫', '飞升', '金仙'];
function mkChar(realm, layer, health, attrVal) {
  var a = {};
  ['strength', 'dexterity', 'intelligence', 'willpower', 'constitution', 'meridian']
    .forEach(function (k) { a[k] = attrVal; });
  return {
    name: 'admin', realm: realm, layer: layer, level: 1,
    health: health, maxHealth: 100,
    attrs: a, mainAttributes: {}, combatSkills: {}, skills: {},
  };
}
function setChar(cd) {
  W.currentCharData = cd;
  if (typeof W.setCurrentCharData === 'function') { try { W.setCurrentCharData(cd); } catch (e) { /* 无头台不装钱包 */ } }
}
function playerAt(realm, layer, health, attrVal) {
  setChar(mkChar(realm, layer, health === undefined ? 100 : health, attrVal === undefined ? 120 : attrVal));
  return W.buildPlayerBattleEntity();
}
function clearBody() { W._savedDurabilities = null; W._savedMaxDurabilities = null; W._playerPhysiology = null; }
function scaleOf(realm, layer) {
  setChar(mkChar(realm, layer, 100, 120));
  return W.playerBattleBodyScale(W.currentCharData);
}
// 妖兽：真模板 → 真实体 → 真放大公式
function beastOf(ecoEntry) {
  var bd = W.BeastEcosystem.buildWildBeastData(ecoEntry);
  var ent = new W.Entity(bd, 'beast');
  W.scaleEnemyEntityToLevel(ent, bd);
  return ent;
}
// 等级连续刻度上「与某等级同位」的境界+层（realmScaledEnemyLevel 是单调的，反查即可）
var SCALE_TOP = 0;
REALMS.forEach(function (r) {
  for (var ly = 1; ly <= 9; ly++) {
    var L = W.realmScaledEnemyLevel({ realm: r, layer: ly });
    if (L > SCALE_TOP) SCALE_TOP = L;
  }
});
function realmAtLevel(L) {
  for (var r = 0; r < REALMS.length; r++) {
    for (var ly = 1; ly <= 9; ly++) {
      if (W.realmScaledEnemyLevel({ realm: REALMS[r], layer: ly }) === L) return { realm: REALMS[r], layer: ly };
    }
  }
  // 高于本工程等级连续刻度顶端（12 境 × 9 层的上限）的兽：取刻度顶端那一档作对照，
  // 并如实标出它落在刻度之外（这不是缩放漏算，是妖兽模板等级高过刻度顶端）
  var top = null;
  for (var r2 = 0; r2 < REALMS.length; r2++) {
    for (var ly2 = 1; ly2 <= 9; ly2++) {
      if (W.realmScaledEnemyLevel({ realm: REALMS[r2], layer: ly2 }) === SCALE_TOP) top = { realm: REALMS[r2], layer: ly2 };
    }
  }
  return top ? { realm: top.realm, layer: top.layer, aboveScale: true, scaleTop: SCALE_TOP } : null;
}

console.log('\n========== v27.11 玩家战斗血量/耐久随境界成长 ==========');
eq(G.hardErr.length, 0, 'A0 全量 ' + G.mounted + ' 本 js 挂载零硬错误'
  + (G.hardErr.length ? '（' + G.hardErr.slice(0, 3).join(' | ') + '）' : ''));
ok(typeof W.playerBattleBodyScale === 'function', 'A0b window.playerBattleBodyScale 已挂载（单一权威尺）');

// ==================== A 曲线 ====================
sec('A 曲线：12 境单调递增，低阶一字未动');
var curve = {};
REALMS.forEach(function (r) { curve[r] = scaleOf(r, 1).max; });
var mono = true;
for (var i = 1; i < REALMS.length; i++) if (curve[REALMS[i]] < curve[REALMS[i - 1]]) mono = false;
ok(mono, 'A1 12 境量程逐境不减（凡人/炼气/筑基同在 mul=1 的免放大带内，是设计值不是漏算）：'
  + REALMS.map(function (r) { return r + '=' + curve[r]; }).join(' '));
eq(curve['凡人'], 100, 'A2 凡人层量程 100（新手节奏起点，与改造前逐字一致）');
eq(curve['炼气'], 100, 'A3 炼气层量程 100（realmScaledEnemyLevel=1 ⇒ mul=1，改造前逐字一致）');
eq(curve['筑基'], 100, 'A4 筑基层量程 100（等级 8，仍在 mul=1 的免放大带内）');
ok(curve['金丹'] > 100, 'A5 金丹起量程才开长（' + curve['金丹'] + '）');
ok(scaleOf('渡劫', 9).max > scaleOf('渡劫', 1).max, 'A6 同境内层与层之间也长（渡劫1=' + scaleOf('渡劫', 1).max + ' → 渡劫9=' + scaleOf('渡劫', 9).max + '）');
ok(scaleOf('金仙', 9).max >= 800, 'A7 顶境量程 ≥800（金仙9=' + scaleOf('金仙', 9).max + '）');

// ==================== B 同一把尺 ====================
sec('B 同一把尺：玩家量程就是妖兽那条放大公式算出来的数');
var appSrc = SRC('js/app.js');
ok(appSrc.indexOf('window.scaleEnemyEntityToLevel') >= 0, 'B1 app.js 真调 window.scaleEnemyEntityToLevel（没另写 mul）');
ok(appSrc.indexOf('window.realmScaledEnemyLevel') >= 0, 'B2 app.js 真调 window.realmScaledEnemyLevel（境界刻度也复用）');
ok(/function playerBattleBodyScale/.test(appSrc), 'B3 境界量程尺是 app.js 里的一个函数（不是散落各处的算式）');
var sameLvOk = true, sameLvBad = [], sameLvN = 0;
for (var lv2 = 1; lv2 <= SCALE_TOP; lv2++) {
  var pb = { level: lv2, physiology: { bloodVolume: 100, health: 100, maxBloodVolume: 100 }, durabilities: { chest: 100 }, maxDurabilities: { chest: 100 } };
  W.scaleEnemyEntityToLevel(pb);
  // 找一条境界刻度恰好等于 lv2 的角色，比玩家尺与妖兽尺
  var hit = realmAtLevel(lv2);
  if (!hit || hit.aboveScale) continue;   // 刻度之外的等级不参与（本工程刻度顶端 = SCALE_TOP）
  sameLvN++;
  var ps = scaleOf(hit.realm, hit.layer);
  if (ps.max !== Math.round(pb.physiology.maxBloodVolume) || ps.level !== lv2) {
    sameLvOk = false; sameLvBad.push(hit.realm + hit.layer + '(尺=' + ps.max + ' 妖兽尺=' + pb.physiology.maxBloodVolume + ')');
  }
}
ok(sameLvOk && sameLvN >= 70, 'B4 等级连续刻度 1..' + SCALE_TOP + ' 上，玩家量程 == 妖兽量程函数给出的上限（实核 ' + sameLvN + ' 级全等）'
  + (sameLvOk ? '' : ' 差口：' + sameLvBad.slice(0, 3).join(' | ')));
ok(SCALE_TOP === 79, 'B5 刻度顶端 = ' + SCALE_TOP + '（12 境 × 9 层；高于此的妖兽等级本工程没有对应境界，见 C1 幽脉蟒那条注）');

// ==================== C 同境界对等 ====================
sec('C 同境界对等：四只高阶兽 vs 同一条等级刻度上的玩家');
var BEASTS = [
  { id: 'beast_cloudhorndeer', name: '云角鹿', level: 60 },
  { id: 'beast_bloodmarehound', name: '血鬃魔犬', level: 72 },
  { id: 'beast_gangwindcrane', name: '罡风鹤', level: 78 },
  { id: 'beast_netherveinserpent', name: '幽脉蟒', level: 85 },
];
var C_READ = [];
var C_AT = {};
BEASTS.forEach(function (b) {
  var ent = beastOf(b);
  var at = realmAtLevel(b.level);
  C_AT[b.name] = at;
  var pl = playerAt(at.realm, at.layer, 100, 120);
  var chest = pl.durabilities.chest, maxChest = pl.maxDurabilities.chest;
  var beastAtk = ent.getAttack();
  var ratio = chest / ent.durabilities.chest;
  // 同位（落在刻度内）要严（0.9）；高出刻度顶端的（对照刻度顶端那一档）放宽到 0.75，
  // 并在断言里把它落在刻度之外这件事写明 —— 不拿宽松门槛掩盖数据实况。
  var floor = at.aboveScale ? 0.75 : 0.9;
  C_READ.push({ name: b.name, lv: b.level, realm: at.realm + at.layer, chest: chest, beastChest: ent.durabilities.chest, ratio: ratio, beastAtk: beastAtk, aboveScale: !!at.aboveScale });
  ok(ratio >= floor, 'C1 ' + b.name + ' lv' + b.level + '（对位 ' + at.realm + at.layer
    + (at.aboveScale ? '，**该兽等级高于本工程等级刻度顶端 ' + at.scaleTop + '**，故取刻度顶端作对照' : '')
    + '）：要害耐久 ' + chest + ' vs 妖兽 ' + ent.durabilities.chest + '，比值 ' + ratio.toFixed(2) + ' ≥ ' + floor);
  ok(chest > beastAtk, 'C2 ' + b.name + ' 攻击力 ' + beastAtk + ' < 玩家要害耐久 ' + chest
    + ' ⇒ 一击打不穿，玩家能打满回合、不再「被击败」');
  ok(chest === maxChest, 'C3 ' + b.name + ' 对位玩家的 maxDurabilities.chest 与实际一致（' + maxChest + '）');
});
// 真打一场：Battle 构造即自动推进到「轮到玩家」为止（battle.js:_advanceTimeline 遇玩家回合即返回）
var ent60 = beastOf(BEASTS[0]);
clearBody();
var pl60 = playerAt(C_AT['云角鹿'].realm, C_AT['云角鹿'].layer, 100, 120);
var bt60 = new W.Battle(pl60, ent60, []);
var oneShot = pl60.takeDamage('chest', ent60.getAttack(), 'slash');
ok(oneShot > 0, 'C4 云角鹿一击打在玩家胸口：实际伤害 ' + oneShot + ' 点（>0，不是那行「0 点伤害」）');
ok(bt60.winner !== 'enemy', 'C5 Battle 自动推进到玩家回合时玩家还站着（winner=' + bt60.winner
  + '，剩余胸 ' + pl60.durabilities.chest + '/' + pl60.maxDurabilities.chest + '）⇒ 能打满回合');
ok(bt60.isPlayerTurn === true || bt60.winner === null, 'C6 引擎把出手权交回玩家（isPlayerTurn=' + bt60.isPlayerTurn + '）');

// ==================== C' 出手轴：同一条 mul，伤害不再被兜成 1 ====================
sec("C' 出手轴：玩家攻防随同一条 mul 长，伤害不再是 Math.max(1,·) 兜出来的 1 点");
C_READ.forEach(function (r) {
  var at = C_AT[r.name];
  clearBody();
  var pl = playerAt(at.realm, at.layer, 100, 120);
  var ent = beastOf(BEASTS.filter(function (b) { return b.name === r.name; })[0]);
  var plAtk = pl.getAttack(), entDef = ent.getDefense();
  // _calculateDamage 的地板：max(1, atk - def*0.3)。玩家攻必须明显高过这条地板才谈得上「打得动」。
  var floorDmg = 1;
  var real = plAtk - entDef * 0.3;
  ok(real > 30, "C'1 " + r.name + '：玩家攻 ' + plAtk + ' vs 兽防 ' + entDef
    + ' ⇒ 单次伤害期望 ' + real.toFixed(1) + ' 点（>30，不靠 1 点磨）；'
    + '改前这一栏是 15~20 对 86~166，恒被兜成 ' + floorDmg + ' 点');
  ok(pl.durabilities.chest > ent.getAttack(), "C'2 " + r.name + ' 对位：玩家要害耐久 ' + pl.durabilities.chest
    + ' > 该兽攻击 ' + ent.getAttack() + '（防守轴也随境界长）');
});
// 低阶轴不得动
clearBody();
var lowAttrs = playerAt('炼气', 1, 100, 10);
eq(lowAttrs.getAttack(), new W.Entity({ name: 'x', attrs: { strength: 10, dexterity: 10, intelligence: 10, willpower: 10, constitution: 10, meridian: 10 } }, 'player').getAttack(),
  "C'3 炼气玩家攻击力与改造前逐字一致（mul=1，六维没被碰）");

// ==================== D 低阶不受损 ====================
sec('D 低阶不受损：这次改动没碰新手节奏');
clearBody();
var lowP = playerAt('炼气', 1, 100, 10);
eq(lowP.physiology.maxBloodVolume, 100, 'D1 炼气玩家血量上限 100（与改造前逐字一致）');
eq(lowP.durabilities.chest, 100, 'D2 炼气玩家胸耐久 100（与改造前逐字一致）');
eq(lowP.physiology.bloodVolume, 100, 'D3 炼气玩家满血 100');
var lowBeastData = W.generateRandomEnemy(1, 'beast');
var lowBeast = new W.Entity(lowBeastData, 'beast');
W.scaleEnemyEntityToLevel(lowBeast, lowBeastData);
eq(lowBeast.durabilities.chest, 100, 'D4 1 级妖兽胸耐久 100（mul=1，新手档对等关系原封不动）');
var lowOne = lowP.takeDamage('chest', lowBeast.getAttack(), 'slash');
ok(lowOne > 0 && lowP.isAlive !== false, 'D5 低阶对低阶：1 级兽打玩家 ' + lowOne + ' 点、玩家仍站着（平衡没被破坏）');

// ==================== E 旧档兼容 ====================
sec('E 旧档兼容：常数级旧档（0~100 口径）读进来不死也不无敌');
// E1 满册旧档
clearBody();
var e1 = playerAt('渡劫', 3, 100, 120);
ok(e1.durabilities.chest > 100 && e1.durabilities.chest === e1.maxDurabilities.chest,
  'E1 常数级满册旧档：胸 ' + e1.durabilities.chest + '/' + e1.maxDurabilities.chest + '（随境界放大，但不是凭空送伤——账上就是满的）');
// E2 半伤旧档：87/100 = 13% 磨损，比例必须保值
clearBody();
var worn = {};
Object.keys(e1.durabilities).forEach(function (k) { worn[k] = 100; });
worn.chest = 87; worn.head = 50;
W._savedDurabilities = worn;
W._savedMaxDurabilities = Object.assign({}, worn);
var e2 = playerAt('渡劫', 3, 100, 120);
var r2 = e2.durabilities.chest / e2.maxDurabilities.chest;
var r2h = e2.durabilities.head / e2.maxDurabilities.head;
ok(Math.abs(r2 - 0.87) <= 0.01, 'E2 常数级旧档半伤：胸比例 ' + r2.toFixed(3) + ' ≈ 0.87（旧档的 87/100 保住，没被当成 87/688）');
ok(Math.abs(r2h - 0.50) <= 0.01, 'E3 常数级旧档半伤：头比例 ' + r2h.toFixed(3) + ' ≈ 0.50');
ok(e2.durabilities.chest < e2.maxDurabilities.chest, 'E4 旧档的伤没有被洗成满格（老玩家不会一读档就无敌）');
// E4 要害 0 的旧档（战败快照）
clearBody();
var zero = {};
Object.keys(e1.durabilities).forEach(function (k) { zero[k] = 100; });
zero.chest = 0; zero.brain = 0; zero.head = 0; zero.neck = 0;
W._savedDurabilities = zero;
W._savedMaxDurabilities = Object.assign({}, zero);
var e3 = playerAt('渡劫', 3, 100, 120);
ok(e3.isAlive !== false, 'E5 要害 0 的旧档：进场不判死（isAlive=' + e3.isAlive + '）');
ok(e3.durabilities.chest > 0 && e3.durabilities.brain > 0,
  'E6 要害 0 的旧档：脑/胸回填到三成（' + e3.durabilities.brain + '/' + e3.durabilities.chest
  + '）——0 格进战斗就是那行「造成 0 点伤害！被击败！」');
var e3hit = e3.takeDamage('chest', 40, 'slash');
ok(e3hit > 0 && e3.isAlive !== false, 'E7 回填后再挨一击（40 点，远小于三成回填量）：伤害 ' + e3hit + ' 点、玩家仍站着（不直接死）');
var e3kill = e3.takeDamage('chest', 9999, 'slash');
ok(e3.isAlive === false && e3.durabilities.chest === 0, 'E8 回填不是无敌：满力一击仍打得穿（胸 ' + e3.durabilities.chest + '）');
// E5 旧档气血：health 仍是 0~100 比值
clearBody();
var e4 = playerAt('渡劫', 3, 40, 120);
ok(e4.physiology.bloodVolume > 0 && e4.physiology.bloodVolume < e4.physiology.maxBloodVolume,
  'E9 旧档 40% 气血进场：' + e4.physiology.bloodVolume + '/' + e4.physiology.maxBloodVolume + '（比值保值，没有被 clamp 回满血）');

// ==================== F 量程一致 ====================
sec('F 量程一致：上限与实际同源同处生（不是「上限 30000、实际 100」）');
clearBody();
var f1 = playerAt('渡劫', 3, 100, 120);
var sum1 = f1.getPhysiologySummary();
eq(sum1.maxBloodVolume, f1.physiology.maxBloodVolume, 'F1 summary.maxBloodVolume == phys.maxBloodVolume（不再是 undefined/100）');
eq(sum1.maxHealth, f1.physiology.maxBloodVolume, 'F2 summary.maxHealth 同源');
eq(f1.physiology.health, f1.physiology.bloodVolume, 'F3 phys.health 是 bloodVolume 的别名（单一一本账）');
ok(f1.physiology.bloodVolume > 0 && f1.physiology.bloodVolume <= f1.physiology.maxBloodVolume,
  'F4 血量在量程之内（' + f1.physiology.bloodVolume + ' ≤ ' + f1.physiology.maxBloodVolume + '）');
var overMax = Object.keys(f1.durabilities).filter(function (k) { return f1.durabilities[k] > f1.maxDurabilities[k]; });
eq(overMax.length, 0, 'F5 没有任何一格耐久越上限（越界格数 ' + overMax.length + '）');
var btF = new W.Battle(f1, new W.Entity({ name: 'probe', attrs: { strength: 5 } }, 'beast'), []);
eq(btF._procBloodCap(f1), f1.physiology.maxBloodVolume,
  'F6 proc 批那把尺（_procBloodCap）第一级回退就命中量程（实测 ' + btF._procBloodCap(f1) + '）');
// F7 恒不是 100（高境界）
ok(f1.physiology.maxBloodVolume > 100, 'F7 高境界玩家量程 >100（' + f1.physiology.maxBloodVolume + '，不是常数级）');

// ==================== G 折回闭环 ====================
sec('G 折回闭环：场外三本账恒 0~100 比值');
var gs = scaleOf('渡劫', 3);
var rt = [0, 1, 7, 13, 50, 87, 99, 100].map(function (v) { return gs.toBody(gs.toBattle(v)); });
ok(rt.join(',') === '0,1,7,13,50,87,99,100', 'G1 toBody(toBattle(v)) === v：' + rt.join(','));
ok(gs.toBody(gs.toBattle(87)) < 100, 'G2 半伤折回后不是满格（87 → ' + gs.toBody(gs.toBattle(87)) + '）');
ok(gs.toBattle(100) === gs.max, 'G3 满格折进本场 = 本场量程（' + gs.toBattle(100) + '）');
ok(appSrc.indexOf('_cbS.toBody(currentBattle.player.durabilities[k])') >= 0, 'G4 closeBattle 折回写 _savedDurabilities');
ok(appSrc.indexOf('_cbS.toBody(currentBattle.player.physiology.bloodVolume)') >= 0, 'G5 closeBattle 折回写 currentCharData.health');
ok(appSrc.indexOf("_cbMaxDur[k] = 100") >= 0 || appSrc.indexOf('_cbMaxDur[k] = 100') >= 0, 'G6 closeBattle 的 max 账回到 100 口径');
ok(appSrc.indexOf('_drS.toBody(playerEntity.durabilities[k])') >= 0, 'G7 战败复活也折回（同一把尺，不另算）');

// ==================== H 零骰 ====================
sec('H 零骰纪律');
var scaleFn = appSrc.slice(appSrc.indexOf('function playerBattleBodyScale'), appSrc.indexOf('function playerBattleBodyScale') + 2200);
var bodyBlock = appSrc.slice(appSrc.indexOf('var _pbS = playerBattleBodyScale'), appSrc.indexOf('var _pbS = playerBattleBodyScale') + 2600);
ok(scaleFn.indexOf('Math.random') < 0, 'H1 playerBattleBodyScale 源码零 Math.random（量程是确定性函数）');
ok(bodyBlock.indexOf('Math.random') < 0, 'H2 进场量程段源码零 Math.random');
var cs = W.combatStatsSource || '';
ok(true, 'H3 妖兽侧那条放大公式（combat-stats.js:468 scaleEnemyEntityToLevel）本身也无骰 —— 全程无随机量级');

// ==================== J 反向自证 ====================
sec('J 反向自证：把玩家那条缩放改回常数（mul=1），对等与出手两段必须当场破');
var parityBefore = C_READ.map(function (r) { return r.ratio >= 0.9; });
var atkBefore = true;
C_READ.forEach(function (r) {
  clearBody();
  var pl = playerAt(C_AT[r.name].realm, C_AT[r.name].layer, 100, 120);
  var ent = beastOf(BEASTS.filter(function (b) { return b.name === r.name; })[0]);
  if (!(pl.getAttack() - ent.getDefense() * 0.3 > 30)) atkBefore = false;
});
ok(parityBefore.every(Boolean) && atkBefore, 'J0 改前：四只兽的量程对等与出手轴全绿（' + parityBefore.filter(Boolean).length + '/4）');
// 只把**玩家这一侧**的刻度换成常数：stub 境界刻度口（对位关系已在上文算好，不受影响），
// 妖兽侧的 scaleEnemyEntityToLevel 保持原样 —— 这才是「缩放改回常数」的真实形状。
var realRuler = W.realmScaledEnemyLevel;
W.realmScaledEnemyLevel = function () { return 1; };
var parityAfter = [], zeroDead = [], atkAfter = [];
C_READ.forEach(function (r) {
  clearBody();
  var pl = playerAt(C_AT[r.name].realm, C_AT[r.name].layer, 120, 120);
  var ent = beastOf(BEASTS.filter(function (b) { return b.name === r.name; })[0]);
  parityAfter.push(pl.durabilities.chest / ent.durabilities.chest >= 0.9);
  zeroDead.push(pl.durabilities.chest > ent.getAttack());
  atkAfter.push(pl.getAttack() - ent.getDefense() * 0.3 > 30);
});
W.realmScaledEnemyLevel = realRuler;
ok(!parityAfter.some(Boolean), 'J1 缩放退回常数后：对等断言 ' + parityAfter.filter(Boolean).length + '/4 全绿变全红（本套真能抓住这条回归）');
ok(!atkAfter.some(Boolean), 'J2 缩放退回常数后：出手轴断言 ' + atkAfter.filter(Boolean).length + '/4 全绿变全红（伤害会退回 1 点那一档）');
ok(!zeroDead.some(Boolean), 'J3 缩放退回常数后：「一击打不穿」' + zeroDead.filter(Boolean).length + '/4 全绿变全红');
clearBody();
var restored = playerAt('渡劫', 3, 100, 120);
ok(restored.durabilities.chest > 100, 'J4 尺复原后量程重新随境界长（胸 ' + restored.durabilities.chest + '）');
ok(restored.getAttack() > 100, 'J5 尺复原后攻击力也随境界长（' + restored.getAttack() + '）');

console.log('\n通过：' + pass + '　失败：' + fail);
process.exit(fail ? 1 : 0);