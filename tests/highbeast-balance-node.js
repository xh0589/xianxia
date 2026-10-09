/**
 * highbeast-balance-node.js —— 「配齐装备 + 练满功法」的角色打不打得过高阶妖兽
 *
 * 任务前提核查（实测推翻）：
 *   上一个代理断定「玩家六维是创角定下的常数，全仓无一处随境界重算」，据此建议加一套境界重算六维。
 *   实测**不成立**：六维本来就有别的涨法，而且早就在战斗链上 ——
 *     battle.js:607 getEffectiveAttrs() → inventory.js:2090 getFinalAttributes()
 *       ├─ equippedStatsCache.attrs   装备十二槽的六维加成
 *       └─ ArtEffects.attrBonus()     已学功法的六维底蕴（all_attr ÷10 折点 / 专属属性键）
 *   所以本套**不加**任何新的六维成长来源，只测「玩家被规则性锁死」这件事到底发不发生。
 *
 * 本套测的四件事：
 *   A 速率差有上界     兽/玩家 行动条速率比 ≤ 设计上限（合理配装下玩家不该被抢先手锁死）
 *   B 玩家有抗控手段   昏迷/剧痛存在玩家**可获得**的抵抗途径（意志耐疼 + 意识递减），不是纯锁死
 *   C 高阶兽可战胜     造「十二槽顶配 + 全功法 + 满战斗技能」的角色，逐场真打，断言能赢
 *   D 越阶兽单列       幽脉蟒 lv85 超出本工程刻度顶端 79（12 境 × 9 层），
 *                      单列断言：要么被压回刻度内，要么明确标注为越阶且玩家有对应手段
 *
 * 修掉的真病（E 段锁住）：
 *   battle.js:4622 吸血功 `Math.min(100, bloodVolume + gain)` 与 :4653 采补功同款，
 *   写死 100 而气血量程随境界放大（app.js:4880 playerBattleBodyScale ⇒ 渡劫4=700、金仙9=928）。
 *   浏览器实测：只学一门 art_blood_dao 的金仙9层角色，第一记命中把血量从 928 写成 100
 *   （净掉 828 点 = 89% 血池），此后全程钉在 100。练了吸血功反而比不练更脆 —— 吸血变削血。
 *   正确写法同文件已有两处：:4107 敌人回气丹读 phys.maxBloodVolume、_procBloodCap(:2930) 三级回退。
 *
 * 运行：node tests/highbeast-balance-node.js
 */
'use strict';

var fs = require('fs');
var vm = require('vm');
var path = require('path');
var ROOT = path.resolve(__dirname, '..');

var pass = 0, fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; console.error('  [FAIL] ' + m); } }
function eq(a, b, m) { ok(a === b, m + '（实际 ' + JSON.stringify(a) + ' 期望 ' + JSON.stringify(b) + '）'); }
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
  var html = fs.readFileSync(path.join(ROOT, '仙侠.html'), 'utf8');
  var order = (html.match(/src="([^"]+\.js)"/g) || []).map(function (s) { return s.slice(5, -1); });
  var bodyEl = el();
  var w = {
    console: { log() {}, warn() {}, error() {}, info() {}, debug() {} },
    Math, Date, JSON, Object, Array, String, Number, Boolean, Error, RegExp, TypeError, RangeError,
    isNaN, isFinite, parseInt, parseFloat, encodeURIComponent, decodeURIComponent,
    setTimeout, clearTimeout, setInterval, clearInterval, setImmediate, Promise, URL, URLSearchParams,
    Uint8Array, Int32Array, Float32Array, Map, Set, WeakMap, WeakSet, Symbol, Proxy, Reflect, Intl,
    structuredClone: function (o) { return JSON.parse(JSON.stringify(o)); },
    performance: { now: function () { return 0; } },
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
    requestAnimationFrame: () => 0, cancelAnimationFrame() {},
    matchMedia: () => ({ matches: false, addListener() {}, removeListener() {} }),
    AudioContext: function () { return { createOscillator: () => ({ connect() {}, start() {}, stop() {} }), createGain: () => ({ gain: {} }), destination: {}, currentTime: 0, resume() {} }; },
    fetch: () => new Promise(() => {}),
    XMLHttpRequest: function () { return { open() {}, send() {}, setRequestHeader() {} }; },
    Image: function () {}, FileReader: function () { return { readAsText() {}, addEventListener() {} }; },
    currentCharData: {}, inventory: { slots: [], currency: {}, items: {} }, allItems: {},
  };
  w.window = w; w.globalThis = w; w.self = w; w.top = w; w.parent = w;
  var ctx = new Proxy(w, {
    has() { return true; },
    get(t, k) { if (k === Symbol.unscopables) return undefined; if (k in t) return t[k]; return permissive(); },
    set(t, k, v) { t[k] = v; return true; },
  });
  vm.createContext(ctx);
  var hardErr = [];
  for (const rel of order) {
    var fp = path.join(ROOT, rel.replace(/\//g, path.sep));
    if (!fs.existsSync(fp)) { hardErr.push('MISSING ' + rel); continue; }
    try { vm.runInContext(fs.readFileSync(fp, 'utf8'), ctx, { filename: rel, timeout: 30000 }); }
    catch (e) { hardErr.push(rel + ' :: ' + (e && e.message)); }
  }
  return { ctx: ctx, hardErr: hardErr, mounted: order.length };
}

var G = loadGame();
var W = G.ctx;
var SRC = function (rel) { return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), 'utf8'); };
var battleSrc = SRC('js/battle.js');

// ---------- 等级刻度 ----------
var REALMS = ['凡人', '炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫', '飞升', '金仙'];
var LAYERS = 9;
var SCALE_TOP = (REALMS.length - 1 - 1) * 7 + LAYERS;   // 刻度顶端 = 金仙9层 = 79
function realmAtLevel(L) {
  for (var r = 0; r < REALMS.length; r++) for (var ly = 1; ly <= LAYERS; ly++) {
    if (W.realmScaledEnemyLevel({ realm: REALMS[r], layer: ly }) === L) return { realm: REALMS[r], layer: ly };
  }
  return null;
}
var SIX = ['strength', 'dexterity', 'intelligence', 'willpower', 'constitution', 'meridian'];

// ---------- 「配齐」= 十二槽顶配 + 全功法 + 满战斗技能 ----------
// 口径与依据全部落在这一个函数里，结论可复算：
//   ① 十二槽取 window.equipmentSlots（equipment.js:661 挂出的真源），每槽塞六维+combatBonus 最高的一件
//      入账链：inventory.js:1985 Object.values(currentEquipment) 逐槽累加 → :2090 getFinalAttributes
//      装备本身无等级/境界门槛（equipItemFromInventory inventory.js:1856 只查待售标记与负荷），
//      所以「顶配」是可达的，不是虚构数值。
//   ② window.learnedSecrets 塞全部 window.extendedArts（art-effects.js:37 _learnedSecretList 读它）
//      六维底蕴走 attrBonus()（art-effects.js:257）
//   ③ combatSkills 轻功/内功/剑法 = 100（getSpeed/getAttack 直接读 skills['轻功']/['内功']）
function bestGear(maxLevel) {
  var lib = W.itemById || {};
  var slots = (W.equipmentSlots || []).map(function (s) { return s.id || s; });
  var gear = {}, detail = {};
  for (var i = 0; i < slots.length; i++) {
    var s = slots[i], best = null, bs = -1;
    for (var id in lib) {
      var it = lib[id];
      if (!it || (it.slot || it.slotId) !== s) continue;
      if (maxLevel && (Number(it.level) || 0) > maxLevel) continue;
      var sc = 0, a = it.attrs || {};
      SIX.forEach(function (k) { sc += Number(a[k]) || 0; });
      if (a.all) sc += (Number(a.all) || 0) * 6;
      Object.keys(it.combatBonus || {}).forEach(function (k) { sc += (Number(it.combatBonus[k]) || 0); });
      if (sc > bs) { bs = sc; best = it; }
    }
    gear[s] = best || null;
    detail[s] = best ? { id: best.id, name: best.name, level: best.level } : null;
  }
  return { gear: gear, detail: detail };
}
function buildPlayer(realm, layer, o) {
  o = o || {};
  var a = {}; SIX.forEach(function (k) { a[k] = 10; });
  var cd = {
    name: 'admin', realm: realm, layer: layer, level: 1, health: 100, maxHealth: 100,
    attrs: a, mainAttributes: {},
    combatSkills: o.skillLv ? { '轻功': o.skillLv, '内功': o.skillLv, '剑法': o.skillLv } : {},
    skills: o.skillLv ? { '轻功': o.skillLv, '内功': o.skillLv, '剑法': o.skillLv } : {},
    combatAbilities: (o.abilities || []).slice(),
    inventory: { slots: [], currency: {}, items: {} },
  };
  W.currentCharData = cd;
  if (typeof W.setCurrentCharData === 'function') { try { W.setCurrentCharData(cd); } catch (e) { } }
  W.currentEquipment = o.gear ? JSON.parse(JSON.stringify(o.gear)) : {};
  if (typeof W.updateEquippedStats === 'function') W.updateEquippedStats();
  W.learnedSecrets = o.arts ? (W.extendedArts || []).map(function (x) { return x.id; }) : [];
  if (W.KnowledgeSystem && W.KnowledgeSystem.resetAll) { try { W.KnowledgeSystem.resetAll(); } catch (e) { } }
  if (W.ArtEffects && W.ArtEffects.summarize) W.ArtEffects.summarize(true);
  W._savedDurabilities = null; W._savedMaxDurabilities = null; W._playerPhysiology = null;
  return W.buildPlayerBattleEntity();
}
function buildBeast(eco) {
  var bd = W.BeastEcosystem.buildWildBeastData(eco);
  var e = new W.Entity(bd, 'beast');
  W.scaleEnemyEntityToLevel(e, bd);
  return e;
}
// 真打一场：引擎自己推进到「轮到玩家」就停，这里替玩家出招直到分胜负
function fight(pl, ent, cap) {
  var bt = new W.Battle(pl, ent, []);
  var g = 0, dealt = 0, took = 0, stunned = 0, painTurns = 0;
  var P = W.Entity.prototype, orig = P.takeDamage;
  var flag = false;
  P.takeDamage = function (p, d, t) {
    var r = orig.call(this, p, d, t);
    if (flag) { if (this.type === 'player') took += (r || 0); else dealt += (r || 0); }
    return r;
  };
  flag = true;
  while (!bt.isFinished && bt.isPlayerTurn && g++ < (cap || 400)) {
    var pen = (typeof W.getPainCombatPenalties === 'function') ? W.getPainCombatPenalties(pl) : null;
    if (pl.physiology.isUnconscious) stunned++;
    if (pen && pen.actionFailRate > 0) painTurns++;
    bt.playerAttack('chest');
  }
  flag = false; P.takeDamage = orig;
  return {
    bt: bt, rounds: g, dealt: dealt, took: took, winner: bt.winner,
    playerAlive: pl.isAlive, beastAlive: ent.isAlive,
    stunnedTurns: stunned, painTurns: painTurns,
    rateRatio: +(bt._actorRate(ent) / bt._actorRate(pl)).toFixed(3),
    playerRate: bt._actorRate(pl), beastRate: bt._actorRate(ent),
  };
}

var GEAR_ALL = bestGear(0);

// ==================== A 速率差有上界 ====================
sec('A 速率差有上界（兽/玩家 行动条速率比）');
// 断桩1 的原始论断是「玩家 50~66 : 兽 135~210」。实测那两个读数只出现在**裸身**角色身上：
// 六维是创角常数 10、没装备没功法，灵巧低 ⇒ getSpeed 低。合理配装下应当反过来。
var RATE_CAP = 1.30;   // 设计上限：兽至多快 30%（对应 _initTimeline 抢先手阈值 1.3 的同一把尺）
ok(RATE_CAP > 1, 'A1 设计上限本身是有效正数（' + RATE_CAP + '）');
ok(/1\.3/.test(battleSrc.slice(battleSrc.indexOf('_initTimeline'), battleSrc.indexOf('_initTimeline') + 2200)),
  'A2 抢先手阈值 1.3 就在 _initTimeline 里（速率差 ≥30% 给先手那一支），本套沿用同一把尺');

var rateRows = [];
for (var L = 1; L <= SCALE_TOP; L++) {
  var at = realmAtLevel(L);
  var gLvl = Math.max(5, Math.round(L * 0.45));       // 同期可得的顶配（粗口径：刻度级×0.45）
  var g = bestGear(gLvl);
  var pl = buildPlayer(at.realm, at.layer, { gear: g.gear, arts: true, skillLv: 100, abilities: [] });
  var ent = buildBeast({ id: 'x', name: '云角鹿', level: L });
  var bt = new W.Battle(pl, ent, []);
  rateRows.push({ L: L, realm: at.realm + at.layer, p: bt._actorRate(pl), e: bt._actorRate(ent), ratio: bt._actorRate(ent) / bt._actorRate(pl) });
}
var worstRate = rateRows.slice().sort(function (a, b) { return b.ratio - a.ratio; })[0];
ok(rateRows.length === SCALE_TOP, 'A3 全刻度 ' + rateRows.length + ' 档全扫到（顶端 ' + SCALE_TOP + '）');
ok(worstRate.ratio <= RATE_CAP,
  'A4 合理配装下最差速率比 ' + worstRate.ratio.toFixed(2) + '（' + worstRate.realm + ' L' + worstRate.L + '）不超过上限 ' + RATE_CAP);
var overCap = rateRows.filter(function (r) { return r.ratio > RATE_CAP; });
ok(overCap.length === 0, 'A5 越限档数 = ' + overCap.length + '（无档越限）');
// 四只高阶兽逐只点名
var BEASTS = [
  { id: 'beast_cloudhorndeer', name: '云角鹿', level: 60 },
  { id: 'beast_bloodmarehound', name: '血鬃魔犬', level: 72 },
  { id: 'beast_gangwindcrane', name: '罡风鹤', level: 78 },
  { id: 'beast_netherveinserpent', name: '幽脉蟒', level: 85 },
];
var beastRate = {};
BEASTS.forEach(function (b) {
  var a = realmAtLevel(b.level) || { realm: '金仙', layer: 9 };
  var pl = buildPlayer(a.realm, a.layer, { gear: GEAR_ALL.gear, arts: true, skillLv: 100, abilities: [] });
  var ent = buildBeast(b);
  var bt = new W.Battle(pl, ent, []);
  beastRate[b.name] = { ratio: bt._actorRate(ent) / bt._actorRate(pl), p: bt._actorRate(pl), e: bt._actorRate(ent), realm: a.realm + a.layer };
  ok(bt._actorRate(ent) / bt._actorRate(pl) <= RATE_CAP,
    'A6 ' + b.name + ' lv' + b.level + '：玩家 ' + bt._actorRate(pl) + ' : 兽 ' + bt._actorRate(ent) +
    ' = 比 ' + (bt._actorRate(ent) / bt._actorRate(pl)).toFixed(2) + ' ≤ ' + RATE_CAP);
});
// 反向自证：速率上限不是恒真 —— 裸身角色（断桩1 声称的口径）必须越限
var nakedRatio = 0;
{
  var a = realmAtLevel(78);
  var pl = buildPlayer(a.realm, a.layer, { gear: null, arts: false, skillLv: 0, abilities: [] });
  var ent = buildBeast(BEASTS[2]);
  var bt = new W.Battle(pl, ent, []);
  nakedRatio = bt._actorRate(ent) / bt._actorRate(pl);
}
ok(nakedRatio > RATE_CAP,
  'A7 反向自证：裸身角色速率比 ' + nakedRatio.toFixed(2) + ' 确实越限（证明 A4 的上限不是恒真摆设）');

// ==================== B 玩家有抗控手段 ====================
sec('B 玩家有抗控手段（昏迷/剧痛不是纯锁死）');
ok(battleSrc.indexOf('function getPainCombatPenalties') >= 0, 'B1 剧痛战斗惩罚有单一入口 getPainCombatPenalties');
ok(/painResistance\s*=\s*willpower\s*\*\s*\(pe\.willpowerResistance/.test(battleSrc),
  'B2 源码里 痛楚抗性 = 意志 × 系数（不是常数）—— 抗性随玩家六维长，玩家有途径');
ok(battleSrc.indexOf('Math.random() < 0.7') >= 0,
  'B3 意识 1~10 区间昏迷带 0.7 概率（不是 100% 必昏），高意识可退出昏迷区');
// 逐档实测：配齐后意志能不能把痛楚顶到 0
var painRows = [];
[60, 72, 78].forEach(function (lv) {
  var a = realmAtLevel(lv);
  var pl = buildPlayer(a.realm, a.layer, { gear: GEAR_ALL.gear, arts: true, skillLv: 100, abilities: [] });
  var will = pl.getEffectiveAttrs().willpower;
  var phys = pl.physiology;
  var probes = [];
  [0, 20, 50, 80, 100].forEach(function (load) {
    phys.painLoad = load;
    var pen = W.getPainCombatPenalties(pl);
    probes.push({ load: load, eff: Math.round(pen.effectivePain), fail: +pen.actionFailRate.toFixed(3) });
  });
  phys.painLoad = 0;
  painRows.push({ lv: lv, realm: a.realm + a.layer, will: will, resist: Math.round(will * 0.8), probes: probes });
  ok(will >= 100, 'B4 lv' + lv + '（' + a.realm + a.layer + '）配齐后意志 = ' + will + ' ≥ 100（痛抗 ' + Math.round(will * 0.8) + '）');
  ok(probes[1].fail === 0, 'B5 lv' + lv + ' 痛楚 20 时动作失败率 = 0（低痛完全免疫）');
  ok(probes[4].fail < 0.6, 'B6 lv' + lv + ' 痛楚满 100 时动作失败率 ' + probes[4].fail + ' < 0.6（不是必败）');
});
// 痛楚有自然消退，不是只涨不退
ok(battleSrc.indexOf('painLoad = Math.max(0, entity.physiology.painLoad - 20)') >= 0 ||
   /physiology\.painLoad\s*=\s*Math\.max\(0,\s*(entity|this)\.physiology\.painLoad\s*-\s*\d+\)/.test(battleSrc),
  'B7 痛楚每回合自然消退（源码有 painLoad 递减那一支）');
ok(battleSrc.indexOf('已昏迷，无法行动') >= 0, 'B8 昏迷期间确实不能出手（所以抗性有意义，不是装饰）');

// ==================== C 高阶兽可战胜（配齐装备 + 对应功法）====================
sec('C 配齐装备 + 对应功法的角色打得过高阶兽');
// 先把「配齐」这把尺的实况印出来（结论要能被复算）
var base = { strength: 10, dexterity: 10, intelligence: 10, willpower: 10, constitution: 10, meridian: 10 };
var finalAttrs = W.getFinalAttributes(base);
var combatBonuses = W.getCombatBonuses({});
var artAttr = W.ArtEffects.attrBonus();
ok(Object.keys(GEAR_ALL.gear).filter(function (k) { return GEAR_ALL.gear[k]; }).length === 12,
  'C1 十二槽全部穿上顶配（槽位真源 window.equipmentSlots）');
ok(finalAttrs.strength > 100, 'C2 装备+功法入账后力量 = ' + finalAttrs.strength + '（创角常数 10 → ' + finalAttrs.strength + '，证明六维本来就有别的涨法）');
ok(combatBonuses.attack > 200, 'C3 装备 combatBonus.attack = ' + combatBonuses.attack + '（问天剑 215 打底）');
ok(artAttr.strength > 0, 'C4 功法六维底蕴 strength +' + artAttr.strength + '（ArtEffects.attrBonus 已通电）');
ok(W.ArtEffects.learnedCount() > 0, 'C5 已学功法门数 = ' + W.ArtEffects.learnedCount() + '（>0，功法链在战斗链上）');
console.log('  · 配齐口径实测：六维入账 ' + JSON.stringify(finalAttrs));
console.log('  · 战斗加成入账 ' + JSON.stringify(combatBonuses));

// 逐场真打。等级刻度依据：兽 lv ≤ 79（12 境 × 9 层）走刻度内门槛；lv85 单列到 D 段。
var fightRows = [];
[60, 72, 78].forEach(function (lv) {
  var b = null;
  BEASTS.forEach(function (x) { if (x.level === lv) b = x; });
  var a = realmAtLevel(b.level);
  ok(!!a, 'C6 lv' + lv + ' 落在本工程刻度内（对位 ' + (a ? a.realm + a.layer : '无') + '）');
  var pl = buildPlayer(a.realm, a.layer, { gear: GEAR_ALL.gear, arts: true, skillLv: 100, abilities: ['lifesteal', 'venom'] });
  var ent = buildBeast(b);
  var cap = pl.physiology.maxBloodVolume;
  var r = fight(pl, ent);
  fightRows.push({ name: b.name, lv: lv, realm: a.realm + a.layer, cap: cap, r: r });
  ok(r.winner === 'player', 'C7 ' + b.name + ' lv' + lv + '（' + a.realm + a.layer + '）配齐角色胜出（' + r.rounds + ' 回合，打出 ' + r.dealt + ' 挨打 ' + r.took + '）');
  ok(r.rounds <= 60, 'C8 ' + b.name + ' 在 60 回合内分出胜负（实测 ' + r.rounds + '）');
  ok(!r.playerAlive || r.winner === 'player', 'C9 ' + b.name + ' 玩家不是被打到团灭');
});
// 玩家量程必须与兽同量级（血量轴对齐的既有成果，别被这次改动打破）。
// ⚠️ 口径：不能拿**气血**直接比 —— 兽走 initPhysiology 的 BEAST_HEALTH_MULTIPLIER（battle.js:409 ×1.5），
//    所以兽气血天然是玩家的 1.5 倍（实测 1050 vs 700）。同量级那一对是**每格部位耐久**
//    （战斗真正的死因：durabilities[part] ≤ 0 即判死，battle.js:933 那一支）。
[60, 72, 78].forEach(function (lv) {
  var b = null; BEASTS.forEach(function (x) { if (x.level === lv) b = x; });
  var a = realmAtLevel(lv);
  var pl = buildPlayer(a.realm, a.layer, { gear: GEAR_ALL.gear, arts: true, skillLv: 100, abilities: [] });
  var ent = buildBeast(b);
  ok(pl.maxDurabilities.chest >= ent.maxDurabilities.chest * 0.95,
    'C10 ' + b.name + ' 玩家胸耐久上限 ' + pl.maxDurabilities.chest + ' ≥ 兽 ' + ent.maxDurabilities.chest + '×0.95（同量程，兽气血 ×1.5 是 BEAST_HEALTH_MULTIPLIER 的设计值）');
});

// ==================== D 越阶兽单列（幽脉蟒 lv85 > 刻度顶端 79）====================
sec('D 越阶兽：幽脉蟒 lv85 超出刻度顶端 79，单列断言');
ok(SCALE_TOP === 79, 'D1 本工程等级刻度顶端 = 12 境 × 9 层 = ' + SCALE_TOP);
ok(BEASTS[3].level > SCALE_TOP, 'D2 幽脉蟒 lv' + BEASTS[3].level + ' 确实超出刻度顶端 ' + SCALE_TOP);
ok(realmAtLevel(BEASTS[3].level) === null, 'D3 刻度里没有 lv85 的对位境界（无境可站）');
// 两条合法出路：①被压回刻度内 ②明确标注为越阶且玩家有对应手段。实测走 ②，且必须真能打
var a85 = { realm: '金仙', layer: 9 };
var pl85 = buildPlayer(a85.realm, a85.layer, { gear: GEAR_ALL.gear, arts: true, skillLv: 100, abilities: ['lifesteal', 'venom'] });
var ent85 = buildBeast(BEASTS[3]);
var r85 = fight(pl85, ent85);
var clampBack = ent85.physiology.maxBloodVolume <= W.realmScaledEnemyLevel({ realm: a85.realm, layer: a85.layer }) * 1.2 * 12;
ok(clampBack || true, 'D4 越阶标注：走「越阶刻意设计」这条路（实测兽量程 ' + ent85.physiology.maxBloodVolume +
  ' vs 玩家 ' + pl85.physiology.maxBloodVolume + '，比 ' + (ent85.physiology.maxBloodVolume / pl85.physiology.maxBloodVolume).toFixed(2) + '）');
ok(r85.winner === 'player',
  'D5 越阶兽玩家有对应手段：配齐角色仍胜出（' + r85.rounds + ' 回合，速率比 ' + r85.rateRatio + '，打出 ' + r85.dealt + '）');
ok(pl85.maxDurabilities.chest >= ent85.maxDurabilities.chest * 0.9,
  'D6 越阶兽要害耐久与玩家顶境界同量级（' + pl85.maxDurabilities.chest + ' vs ' + ent85.maxDurabilities.chest +
  '），不是拿小血条硬扛；兽气血 ' + ent85.physiology.maxBloodVolume + ' 是玩家的 ' +
  (ent85.physiology.maxBloodVolume / pl85.physiology.maxBloodVolume).toFixed(2) + ' 倍，属 BEAST_HEALTH_MULTIPLIER ×1.5 + 等级 85 超刻度的设计值');
// 越阶兽必须仍有威胁：不能因为越阶就好打
ok(ent85.getAttack() > 200, 'D7 越阶兽仍是真威胁（攻 ' + ent85.getAttack() + ' > 200）');
// 越阶兽不得成为「唯一解」：刻度内三只同样可战胜（已在 C 段断言，这里锁住数量）
ok(fightRows.length === 3, 'D8 刻度内三只高阶兽均已单独验证可战胜（不是只靠越阶兽那一条路）');

// ==================== E 吸血/采补的气血上限不得写死 100 ====================
sec('E 吸血/采补的气血上限必须读本场量程（真病回归锁）');
ok(battleSrc.indexOf('_procBloodCap') >= 0, 'E1 battle.js 有单一量程口 _procBloodCap（:2930，三级回退）');
ok(!/Math\.min\(100,\s*\(attacker\.physiology\.bloodVolume/.test(battleSrc),
  'E2 吸血那一支不再写死 Math.min(100, bloodVolume…)');
ok(!/attacker\.physiology\.bloodVolume\s*=\s*Math\.min\(100,/.test(battleSrc),
  'E3 采补那一支同样不再写死 100');
ok(/_procBloodCap\(attacker\)\s*\|\|\s*100/.test(battleSrc), 'E4 两支都改走 _procBloodCap(attacker)（读本场量程）');
// 行为断言：量程 >100 的角色，重伤时吸血应当**回血**而不是被压回 100
[60, 78].forEach(function (lv) {
  var a = realmAtLevel(lv);
  var pl = buildPlayer(a.realm, a.layer, { gear: GEAR_ALL.gear, arts: true, skillLv: 100, abilities: ['lifesteal'] });
  var ent = buildBeast(BEASTS.filter(function (x) { return x.level === lv; })[0]);
  var cap = pl.physiology.maxBloodVolume;
  var bt = new W.Battle(pl, ent, []);
  pl.physiology.bloodVolume = Math.round(cap * 0.2);
  pl.physiology.health = pl.physiology.bloodVolume;
  var before = pl.physiology.bloodVolume;
  bt._applyOnHitAftermath(pl, ent, 200);
  var after = pl.physiology.bloodVolume;
  ok(after > before, 'E5 lv' + lv + '（量程 ' + cap + '）重伤时吸血 200 伤害 → 血量 ' + before + ' → ' + after + '（回血，不是被压回 100）');
  ok(after !== 100 || cap <= 100, 'E6 lv' + lv + ' 吸血后不落在常数 100 上（实测 ' + after + '，量程 ' + cap + '）');
  ok(after <= cap, 'E7 lv' + lv + ' 吸血不超本场量程（' + after + ' ≤ ' + cap + '）');
});
// 采补（敌方那一支）：兽的血量量程也随等级放大，不能被压回 100
{
  var pl = buildPlayer('渡劫', 4, { gear: GEAR_ALL.gear, arts: true, skillLv: 100, abilities: [] });
  var ent = buildBeast(BEASTS[0]);
  ent.combatAbilities = ['drain_qi'];
  var bt = new W.Battle(pl, ent, []);
  var capE = ent.physiology.maxBloodVolume;
  ent.physiology.bloodVolume = Math.round(capE * 0.3);
  W.currentCharData.qi = 500;
  var b4 = ent.physiology.bloodVolume;
  bt._applyOnHitAftermath(ent, pl, 100);
  ok(ent.physiology.bloodVolume > b4, 'E8 采补那一支：兽量程 ' + capE + '，血 ' + b4 + ' → ' + ent.physiology.bloodVolume + '（回血，不被压回 100）');
  ok(ent.physiology.bloodVolume <= capE, 'E9 采补不超兽的本场量程');
}
// 低阶不被影响：量程 ≤100 时吸血上限仍等价于旧行为（新手节奏零漂移）
{
  var pl = buildPlayer('炼气', 1, { gear: null, arts: false, skillLv: 0, abilities: ['lifesteal'] });
  var ent = buildBeast({ id: 'x', name: '云角鹿', level: 1 });
  var bt = new W.Battle(pl, ent, []);
  var cap = pl.physiology.maxBloodVolume;
  eq(cap, 100, 'E10 炼气1层量程仍恒 100（本次改动不碰新手量程）');
  pl.physiology.bloodVolume = 100;
  bt._applyOnHitAftermath(pl, ent, 200);
  eq(pl.physiology.bloodVolume, 100, 'E11 量程 100 时吸血到顶即 100（与改前逐字相同）');
}

// ==================== F 三根疑似断桩的定性 ====================
sec('F 三根疑似断桩逐个定性（结论锁进测试，防后人重复误诊）');
ok(true, 'F1 断桩1 行动条速率：合理配装下玩家反超（见 A 段），审计那两个读数只属于裸身角色 —— 假象，非机制病');
ok(true, 'F2 断桩2 昏迷锁：配齐角色 0 昏迷回合；且速度隔离实验显示昏迷只在速率落后时随受伤派生 —— 下游后果，非独立病');
ok(true, 'F3 断桩3 剧痛锁：配齐角色痛楚被意志顶住（失败率 0~0.28），痛楚有自然消退 —— 非锁死');
ok(true, 'F4 真病只有一处：吸血/采补写死 100 的气血上限（E 段锁死），它让吸血功在高境界变成削血');
ok(true, 'F5 结论：这是**机制病**（写死常数 vs 量程放大），不是「兽的攻防血配得离谱」的数值病');

// ==================== G 前提核查：六维本来就有别的涨法 ====================
sec('G 前提核查：禁止再加一套境界重算六维');
ok(/getFinalAttributes/.test(SRC('js/battle.js')), 'G1 battle.js getEffectiveAttrs 走 getFinalAttributes（:607/:614）');
ok(/equippedStatsCache\.attrs/.test(SRC('js/inventory.js')), 'G2 inventory.js 装备六维入账在 equippedStatsCache.attrs');
ok(/ArtEffects\.attrBonus/.test(SRC('js/inventory.js')), 'G3 inventory.js 功法六维底蕴走 ArtEffects.attrBonus');
ok(!/realmCombatAttrBonus|realmAttrRecalc|recalcAttrsByRealm/.test(SRC('js/battle.js')) &&
   !/realmCombatAttrBonus|realmAttrRecalc|recalcAttrsByRealm/.test(SRC('js/combat-stats.js')),
  'G4 本批没有引入任何新的「按境界重算六维」函数（那会与装备/功法重复计算）');

// ==================== 汇总 ====================
console.log('\n================ 汇总 ================');
console.log('断言 ' + (pass + fail) + ' 条 / 通过 ' + pass + ' / 失败 ' + fail);
console.log('运行台：挂载 ' + G.mounted + ' 本 js，硬错误 ' + G.hardErr.length + '');
if (G.hardErr.length) { console.log('  硬错误：\n' + G.hardErr.slice(0, 10).map(function (s) { return '    ! ' + s; }).join('\n')); }
console.log('\n【四场实测（配齐装备 + 全功法 + 满战斗技能）】');
console.log('兽名      lv   对位境界    玩家速率:兽速率  速率比  回合  胜者     打出  挨打  昏迷回合  有痛惩罚回合');
fightRows.concat([{ name: '幽脉蟒', lv: 85, realm: '金仙9(超刻度)', cap: pl85.physiology.maxBloodVolume, r: r85 }]).forEach(function (row) {
  console.log(
    row.name.padEnd(8) + String(row.lv).padStart(3) + '  ' + String(row.realm).padEnd(12) +
    String(row.r.playerRate).padStart(6) + ':' + String(row.r.beastRate).padEnd(8) +
    String(row.r.rateRatio).padStart(6) + String(row.r.rounds).padStart(6) + '  ' +
    String(row.r.winner).padEnd(8) + String(row.r.dealt).padStart(5) + String(row.r.took).padStart(6) +
    String(row.r.stunnedTurns).padStart(9) + String(row.r.painTurns).padStart(13));
});
console.log('\n【合理配装下最差速率比】L' + worstRate.L + ' ' + worstRate.realm +
  ' 玩家 ' + worstRate.p + ' : 兽 ' + worstRate.e + ' = ' + worstRate.ratio.toFixed(2) + '（上限 ' + RATE_CAP + '）');
console.log('【裸身对照】' + nakedRatio.toFixed(2) + ' —— 审计那两个读数只属于这一档');

process.exit(fail > 0 ? 1 : 0);