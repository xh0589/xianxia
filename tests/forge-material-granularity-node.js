/*
 * tests/forge-material-granularity-node.js
 *
 * 第七批 · 炼器三事的事 1/2/3 断言：
 *   A 粒度到低等级（不是一料不出，也不是同料降级）
 *   B 来源可追（每一条都追得到真兽 + 真部位件，追不到的不许发）
 *   C 不动掉率（原有掉率逐项比对，一个都没改）
 *   D 选日可交互（玩家有一个可操作的入口能影响择日，且等待成本真被扣）
 *   E 不静默（条件不满足时写明原因，沿用 envMissNotes）
 *
 * 运行台照 tests/v27.10-beast-forge-drops-node.js 的路子：按 仙侠.html 真实 script 顺序
 * eval 全量 js（不造假 itemById／不造假 BeastEcosystem 账）。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

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
const F = W.ForgingCompound;
const ECO = W.BeastEcosystem;
const DD = W.DungeonDynamic;

console.log('\n========== forge-material-granularity（第七批） ==========');
eq(G.hardErr.length, 0, 'A0 全量 ' + G.mounted + ' 本 js 挂载零硬错误'
  + (G.hardErr.length ? '（' + G.hardErr.slice(0, 3).join(' | ') + '）' : ''));
ok(!!F, 'A0b ForgingCompound 已挂载');
ok(!!ECO, 'A0c BeastEcosystem 已挂载');
ok(!!DD, 'A0d DungeonDynamic 已挂载（秘境模块：全仓唯一带 suggestedRealm/appearChance/roomCount 的文件）');
if (!F || !ECO || !DD) { console.log('\n通过：' + pass + '　失败：' + fail); process.exit(1); }

const DIST = ECO.BEAST_DISTRIBUTION || [];
const PARTS = ECO.BODY_PARTS_DROPS || {};
const ROWS = F.beastPartTiers();

// ==================== A · 粒度到低等级 ====================
sec('A 粒度到低等级（玩家真会打的那一段每一级都有账，不是「一料不出」也不是「同料降级」）');
ok(ROWS.length >= 40, 'A1 部位档位账 ' + ROWS.length + ' 行（覆盖 ' + new Set(ROWS.map(r => r.beastId)).size + ' 只兽）');
var lvls = Array.from(new Set(ROWS.map(r => r.beastLevel))).sort(function (a, b) { return a - b; });
var 低段 = lvls.filter(function (l) { return l < 60; });
ok(低段.length >= 12, 'A2 60 级以下铺了 ' + 低段.length + ' 个等级档：' + 低段.join('、'));

// ★ 逐个点名任务书点的那 6 个等级：每一级都必须有**明确的答复**——
//   要么「这只兽有部位件，这是它的部位与料」，要么「这只兽在部位件账里一条也没有」+原因。
//   两种都不许是「查不到 / 空数组 / undefined」。
var 点名 = [
  { lv: 17, nm: '彼岸花妖' }, { lv: 22, nm: '玉面狐' }, { lv: 29, nm: '曼陀罗花妖' },
  { lv: 41, nm: '夹竹桃花妖' }, { lv: 46, nm: '夜来香妖' }, { lv: 58, nm: '天香藤' }
];
var 有料的 = [], 无部位的 = [];
点名.forEach(function (q) {
  var e = DIST.filter(function (x) { return x.name === q.nm; })[0];
  if (!e) { ok(false, 'A3 ' + q.nm + ' ★不在 BEAST_DISTRIBUTION 里'); return; }
  eq(e.level, q.lv, 'A3 ' + q.nm + ' 分布表等级 = ' + q.lv);
  var rep = F.beastPartReport(q.nm);
  var 答 = rep.rows.length
    ? rep.rows.map(function (r) { return r.part + '→' + r.matId; }).join('、')
    : (rep.miss || '');
  ok(!!答 && 答 !== '[]', 'A3 ' + q.nm + '（lv' + q.lv + '）有明确答复：'
    + (rep.rows.length ? '部位件 ' + 答 : '如实报缺——' + String(答).slice(0, 60) + '…'));
  if (rep.rows.length) 有料的.push({ nm: q.nm, lv: q.lv, mats: rep.rows.map(r => r.matId) });
  else 无部位的.push(q.nm + '（lv' + q.lv + '）');
});
console.log('  · 点名 6 级里有部位件的：' + (有料的.length ? 有料的.map(x => x.nm + '→' + x.mats.join('/')).join('　') : '无'));
console.log('  · 点名 6 级里部位件账为空的：' + (无部位的.length ? 无部位的.join('、') : '无'));

// ★「同两只不同兽发一样的料」降级方案，在**发放那一路**上必须为零
var 发放档 = F.LATE_MATERIAL_TIERS.filter(function (t) { return t.kind === 'beast'; });
var 每档料 = {};
发放档.forEach(function (t) { 每档料[t.key] = t.drops.map(function (d) { return d.matId; }); });
var 撞料 = [];
Object.keys(每档料).forEach(function (k1) {
  Object.keys(每档料).forEach(function (k2) {
    if (k1 >= k2) return;
    var 交 = 每档料[k1].filter(function (m) { return 每档料[k2].indexOf(m) >= 0; });
    if (交.length) 撞料.push(k1 + '×' + k2 + '→' + 交.join(','));
  });
});
eq(撞料.length, 0, 'A4 料表档位里没有两只兽发同一味料（降级方案为零）' + (撞料.length ? '：' + 撞料.join('　') : ''));
var 兽名唯一 = {};
var 重兽 = [];
发放档.forEach(function (t) { if (兽名唯一[t.beastId]) 重兽.push(t.beastId); 兽名唯一[t.beastId] = 1; });
eq(重兽.length, 0, 'A5 没有一只兽占两档（一兽一档，不靠重复挂档凑数）' + (重兽.length ? '：' + 重兽.join('、') : ''));

// ★ 部位档位账：同一只兽的同一个部位不重复出现；不同部位各自成行
var 件键 = {};
var 重件 = [];
ROWS.forEach(function (r) { var k2 = r.beastId + '|' + r.part; if (件键[k2]) 重件.push(k2); 件键[k2] = 1; });
eq(重件.length, 0, 'A6 部位档位账里没有重复的（兽·部位）' + (重件.length ? '：' + 重件.join('、') : ''));

// ==================== B · 来源可追 ====================
sec('B 来源可追（每一条档位都追得到真兽 + 真部位件；追不到的不许发）');
var 追不到 = [];
ROWS.forEach(function (r) {
  var e = DIST.filter(function (x) { return x.id === r.beastId; })[0];
  var ps = PARTS[r.beastId] || [];
  var hit = ps.some(function (p) { return p.part === r.part && p.matId === r.matId; });
  if (!e) { 追不到.push(r.key + '（兽不在分布表）'); return; }
  if (e.name !== r.beastName) 追不到.push(r.key + '（兽名对不上：' + r.beastName + '≠' + e.name + '）');
  if (Number(e.level) !== Number(r.beastLevel)) 追不到.push(r.key + '（等级对不上）');
  if (!hit) 追不到.push(r.key + '（部位件对不上 BODY_PARTS_DROPS）');
  if (!F.MATERIAL_GRADE[r.matId]) 追不到.push(r.key + '（料不在 MATERIAL_GRADE，炼不了）');
  if (!r.why) 追不到.push(r.key + '（部位件没有 why 注）');
  if (!r.basis || r.basis.indexOf('BODY_PARTS_DROPS') < 0) 追不到.push(r.key + '（basis 没指回源表）');
});
eq(追不到.length, 0, 'B1 ' + ROWS.length + ' 行档位逐行追得到「真兽 + 真部位件 + 真料 + 有品阶」'
  + (追不到.length ? '（追不到：' + 追不到.slice(0, 5).join('；') + '）' : ''));

// ★ 反向：表里挂了部位件的兽，档位账必须一条不少地长出来（不许漏、不许私造）
var 挂件兽 = Object.keys(PARTS).filter(function (b) { return DIST.some(function (x) { return x.id === b; }); });
var 漏兽 = 挂件兽.filter(function (b) { return !ROWS.some(function (r) { return r.beastId === b; }); });
eq(漏兽.length, 0, 'B2 挂了部位件的 ' + 挂件兽.length + ' 只兽在档位账里一条不少' + (漏兽.length ? '（漏：' + 漏兽.join('、') + '）' : ''));
var 私造 = ROWS.filter(function (r) { return !(PARTS[r.beastId] || []).some(function (p) { return p.part === r.part && p.matId === r.matId; }); });
eq(私造.length, 0, 'B3 档位账没有一行是私造的（每一行都能在 BODY_PARTS_DROPS 里逐字对上）');

// ★ 真发料那一路（尸体携带物）也照同一条标准核一遍
var 携带不落地 = [];
挂件兽.forEach(function (b) {
  var e = DIST.filter(function (x) { return x.id === b; })[0];
  var d = ECO.buildWildBeastData(e);
  var items = (d && d.carriedInventory && d.carriedInventory.items) || [];
  var want = (PARTS[b] || []).map(function (p) { return p.matId; }).filter(function (m) { return !!F.MATERIAL_GRADE[m]; });
  want.forEach(function (m) { if (items.indexOf(m) < 0) 携带不落地.push(b + '→' + m); });
});
eq(携带不落地.length, 0, 'B4 有品阶的部位件都真挂进了尸体的携带物（解剖那一路能到手）'
  + (携带不落地.length ? '（挂不上：' + 携带不落地.slice(0, 5).join('、') + '）' : ''));

// ==================== C · 不动掉率 ====================
sec('C 不动掉率（原有 7 档的周期与件数逐项比对，一个都没改）');
var 钉 = {
  beast_60: { everyN: 2, mats: [['mat_sky_iron', 1]] },
  beast_72: { everyN: 2, mats: [['mat_demon_beast_core', 1], ['mat_dragon_blood', 1]] },
  beast_78: { everyN: 3, mats: [['mat_star_iron', 1], ['mat_phoenix_feather', 1]] },
  beast_85: { everyN: 3, mats: [['mat_dragon_scale', 2], ['mat_dragon_crystal', 1], ['mat_dragon_scale_iron', 1]] },
  mine_80: { everyN: 8, mats: [['mat_purple_gold', 1]] },
  secret_48: { everyN: 3, mats: [['mat_phoenix_blood', 1]] },
  secret_60: { everyN: 10, mats: [['mat_five_element_essence', 2]] }
};
eq(F.LATE_MATERIAL_TIERS.length, 7, 'C1 LATE_MATERIAL_TIERS 仍 7 档（本批只加只读部位档，一档没动）');
eq(F.LATE_MATERIAL_DROPS.length, 11, 'C2 LATE_MATERIAL_DROPS 仍 11 行');
Object.keys(钉).forEach(function (k) {
  var t = F.LATE_MATERIAL_TIERS.filter(function (x) { return x.key === k; })[0];
  if (!t) { ok(false, 'C3 ' + k + ' ★档不见了'); return; }
  var got = t.drops.map(function (d) { return [d.matId, d.count]; });
  eq(t.everyN, 钉[k].everyN, 'C3 ' + k + ' 周期 everyN=' + 钉[k].everyN);
  eq(JSON.stringify(got), JSON.stringify(钉[k].mats), 'C3 ' + k + ' 料与件数逐项一致');
});
F.LATE_MATERIAL_DROPS.forEach(function (r) {
  eq(r.chance, 1, 'C4 ' + r.matId + '←' + (r.beastName || r.sourceName) + ' chance 仍 = 1');
  eq(r.guaranteed, true, 'C4 ' + r.matId + '←' + (r.beastName || r.sourceName) + ' guaranteed 仍 = true');
});
var 兽档 = F.LATE_MATERIAL_TIERS.filter(function (t) { return t.kind === 'beast'; });
var 最低档 = Math.min.apply(null, 兽档.map(function (t) { return t.fromLevel; }));
eq(最低档, 60, 'C5 料表档位的等级带仍从 60 起（无名野兽那条路一步没变宽）');
eq(F.lateMaterialTier('beast', { level: 30, isBeast: true }), null, 'C5 30 级无名野兽仍不进任何后期档');
eq(F.lateMaterialTier('beast', { level: 85, isBeast: true }).key, 'beast_85', 'C5 85 级无名野兽仍认 beast_85');
eq(F.lateMaterialTier('beast', { level: 60, isBeast: true, name: '云角鹿' }).key, 'beast_60', 'C5 云角鹿仍认 beast_60');

// ★ 秘境掉落表一个数都不动（只加标签）
var 概 = DD.DUNGEON_TEMPLATES.map(function (t) { return t.appearChance; });
var rooms = DD.DUNGEON_TEMPLATES.map(function (t) { return t.roomCount; });
var realms = {};
DD.DUNGEON_TEMPLATES.forEach(function (t) { realms[t.suggestedRealm] = 1; });
eq(DD.DUNGEON_TEMPLATES.length, 12, 'C6 秘境仍是 12 座（没动）');
eq(Math.min.apply(null, 概), 0.02, 'C6 最低出现率仍是 0.02（九幽幻境·一窗一走）');
eq(Math.max.apply(null, 概), 0.7, 'C6 最高出现率仍是 0.7（雷泽洞天）');
eq(Math.min.apply(null, rooms), 6, 'C6 最少房数仍是 6（药王遗府）');
eq(Math.max.apply(null, rooms), 12, 'C6 最多房数仍是 12（混沌潮眼）');
eq(Object.keys(realms).length, 7, 'C6 建议境界仍覆盖 7 档（筑基→大乘）：' + Object.keys(realms).join('、'));
var 宝贝 = {};
DD.DUNGEON_TEMPLATES.forEach(function (t) {
  var tr = (DD.ROOM_TEMPLATES[t.env] || []).filter(function (x) { return x.type === 'treasure'; });
  宝贝[t.id] = tr.map(function (x) { return (x.reward && x.reward.materials || []).join('/'); }).join('#');
});
eq(宝贝.dgn_thunder_cave, 'mat_thunder_crystal', 'C6 雷泽洞天的宝藏料仍是雷晶');
eq(宝贝.dgn_ghost_realm, 'mat_chaos_stone', 'C6 九幽幻境的宝藏料仍是混沌石');
eq(宝贝.dgn_chaos_sea, 'mat_five_element_essence', 'C6 混沌潮眼的宝藏料仍是五行精华');
eq(宝贝.dgn_yaowang_tomb, 'mat_thousand_lingzhi/mat_snow_lotus', 'C6 药王遗府的宝藏料仍是灵芝+雪莲');
eq(Object.keys(宝贝).filter(function (k) { return 宝贝[k]; }).length, 12, 'C6 12 座秘境逐座仍各有宝藏模板（一个没删没加）');
// ★ 每座秘境自己只有 1 条 treasure 模板 —— 这就是「掉落这一侧平铺」的病根，钉住它（不许顺手改掉落表）
var 多宝 = DD.DUNGEON_TEMPLATES.filter(function (t) {
  return (DD.ROOM_TEMPLATES[t.env] || []).filter(function (x) { return x.type === 'treasure'; }).length !== 1;
});
eq(多宝.length, 0, 'C7 每座秘境自己只挂 1 条 treasure 模板（一个 env 名下有多条，是不同境界各占一条：'
  + 'thunder×' + (DD.ROOM_TEMPLATES.thunder || []).filter(function (x) { return x.type === 'treasure'; }).length
  + '、dark×' + (DD.ROOM_TEMPLATES.dark || []).filter(function (x) { return x.type === 'treasure'; }).length
  + '）⇒ **一座秘境里第 1 房与最后一房给的是同一味料**——这才是要治的「平铺」');
// ★ 掉落值只挂 env/秘境，不挂境界：跨境界同料 ⇒ 奖励没有稀有度轴
var 五行 = DD.DUNGEON_TEMPLATES.filter(function (t) { return t.env === '5e'; }).map(function (t) { return t.suggestedRealm + '（' + t.name + '）'; });
eq(五行.length, 2, 'C8 同一个 env 下的两座秘境境界不同却给同一种料：' + 五行.join(' vs ')
  + ' ⇒ ★奖励值只挂 env、不挂 suggestedRealm，大乘与金丹同给一味——这就是「平铺」的另一半');

// ==================== D · 选日可交互 ====================
sec('D 选日可交互（玩家有一个可操作的入口能影响择日，不是只能等；等待成本真被扣）');
ok(F.HOU_MAX_DAYS >= 2, 'D1 候期上限 ' + F.HOU_MAX_DAYS + ' 日（0 不候 / 1 / 2 三档互不相同的走法）');
var cd = W.currentCharData;
cd.lifeSkills = { '锻造': 60 };
cd.qi = 9999;
W.getLifeSkill = function (k) { return (cd.lifeSkills || {})[k] || 0; };
var opts = F.forgeHouOptions({ main: ['mat_thunder_crystal'], assist: ['mat_thunder_crystal'], rune: [] });
ok(Array.isArray(opts) && opts.length === F.HOU_MAX_DAYS + 1, 'D1 候期档位账给了 ' + (opts || []).length + ' 档');
opts.forEach(function (o) {
  ok(typeof o.days === 'number' && o.qiMult === 1 + o.days && typeof o.sameLight === 'boolean'
    && (o.lock === null || typeof o.lock === 'string'),
    'D2 候 ' + o.days + ' 日：真气 ×' + o.qiMult + '，落到第 ' + o.landDay + ' 日（' + o.landText
    + '），同光=' + (o.sameLight ? '是' : '否') + (o.lock ? '，🔒 ' + o.lock.slice(0, 40) + '…' : ''));
});
var 翻面 = opts.filter(function (o) { return o.days === 1; })[0];
var 回头 = opts.filter(function (o) { return o.days === 2; })[0];
ok(翻面 && 回头 && 翻面.landPolarity !== 回头.landPolarity,
    'D3 候 1 日与候 2 日落到**不同阴阳**上（日序奇偶定阴阳）⇒ 玩家选候期真的能改择日结果');

// ★ 等待成本 ①：世界真的过那几天（**以日号为准**，不以 advanceTime 抛不抛为准）
var d0 = W.getAbsoluteDay();
var r1 = F.holdForgeForDays(1, 100, cd);
ok(r1.ok && r1.fromDay === d0 && r1.toDay === d0 + 1,
    'D4 候 1 日：第 ' + r1.fromDay + ' → 第 ' + r1.toDay + ' 日（世界真的过了一天，等候天数 ' + r1.waitedDays + '）'
    + (r1.warn ? '　※ ' + r1.warn.slice(0, 70) + '…' : ''));
var r2b = F.holdForgeForDays(2, 100, cd);
ok(r2b.ok && r2b.toDay === r1.toDay + 2 && r2b.waitedDays === 2,
    'D4 候 2 日：第 ' + r2b.fromDay + ' → 第 ' + r2b.toDay + ' 日（再过两天，逐日翻日不跳日）');
var r0 = F.holdForgeForDays(0, 100, cd);
ok(r0.ok && r0.days === 0 && W.getAbsoluteDay() === r2b.toDay, 'D4 候 0 日：不封炉、天不过（与改前逐字节相同）');
// ★ 子账抛了不许「日子没过、价钱照付」那种半吊子：要么日子真的过了，要么明说没候成
var 半吊 = F.holdForgeForDays(2, 100, cd);
ok(!半吊.ok || 半吊.waitedDays === 2,
    'D4 候 2 日要么真过满 2 日（waitedDays=' + 半吊.waitedDays + '），要么明说没候成——不许半吊子'
    + (半吊.ok && 半吊.warn ? '（并把没走完的那笔账写进 warn）' : ''));
// ★ 等待成本 ②：真气按倍数付
eq(F.houQiCost(60, 0), 60, 'D5 候 0 日真气 = 原价 60');
eq(F.houQiCost(60, 1), 120, 'D5 候 1 日真气 = 120（封炉一日空烧，双份）');
eq(F.houQiCost(60, 2), 180, 'D5 候 2 日真气 = 180（三份）');
// ★ 付不起就不许封炉（不能让玩家为一次误点白等）
var qiBefore = cd.qi, dayBefore = W.getAbsoluteDay();
cd.qi = 10;
var rNo = F.holdForgeForDays(1, 60, cd);
ok(!rNo.ok && rNo.reason === 'qi-low-for-hou',
    'D6 真气不够（有 10，要 120）⇒ 候不成：' + rNo.reason + '（要 ' + rNo.need + '，有 ' + rNo.have + '）');
eq(cd.qi, 10, 'D6 候不成功气一分没动');
eq(W.getAbsoluteDay(), dayBefore, 'D6 候不成功**一天也没过**（炉没封）');
cd.qi = qiBefore;
// ★ 无钟表 ⇒ 明说不候，不假装候过了
var 真钟 = W.timeSystem;
W.timeSystem = null;
var rNoClock = F.holdForgeForDays(1, 60, cd);
ok(!rNoClock.ok && rNoClock.reason === 'no-clock', 'D7 没有钟表 ⇒ 候不了并明说（' + rNoClock.reason + '），不假装候过');
W.timeSystem = 真钟;

// ★ 入口在屏上（真的可点，不是只导出个函数）
var uiSrc = fs.readFileSync(path.join(ROOT, 'js/crafting/compound-ui.js'), 'utf8');
ok(uiSrc.indexOf('window._cfHou') >= 0, 'D8 炼器台有候期按钮的处理口 window._cfHou');
ok(uiSrc.indexOf('_cfHou(') >= 0 && /onclick="window\._cfHou\(/.test(uiSrc), 'D8 候期按钮真的挂在 onclick 上（可点）');
ok(/forgeHouOptions/.test(uiSrc), 'D8 按钮的档位与价钱读的是 forgeHouOptions（不另写一份数）');
ok(/houQiCost/.test(uiSrc), 'D8 开锻按钮上的真气数走 houQiCost（与实扣同一口径）');
ok(/houDays:\s*\(typeof window\.ForgingCompound\.houDaysOf/.test(uiSrc), 'D8 开锻把 houDays 真传进 executeCompoundForging');
var forgeSrc = fs.readFileSync(path.join(ROOT, 'js/crafting/forging-compound.js'), 'utf8');
ok(/slotPick\.houDays/.test(forgeSrc), 'D8 executeCompoundForging 真的读 slotPick.houDays');
ok(/cd\.qi = \(cd\.qi \|\| 0\) - qiTotal/.test(forgeSrc), 'D8 实扣的是 qiTotal（含候期倍数），不是原价');
ok(!/cd\.qi = \(cd\.qi \|\| 0\) - recipe\.qiCost/.test(forgeSrc), 'D8 旧的真气原价扣法已无残留');

// ★ 真开一炉：候 1 日与候 0 日出来的这一炉，账上分得出
function 开一炉(houDays) {
  var bag = {};
  W.addItem = function (id, n) { bag[id] = (bag[id] || 0) + n; return n; };
  W.addResultItem = function (id, n) { return W.addItem(id, n); };
  W.compoundMat = { consume: function () { return true; }, refund: function () { return null; } };
  W.itemById = W.itemById || {};
  var rec = F.COMPOUND_FORGING_RECIPES.filter(function (r) { return r.slots.rune && r.slots.rune.optional; })[0] || F.COMPOUND_FORGING_RECIPES[0];
  var pick = {
    embryo: rec.slots.embryo.type,
    main: new Array(rec.slots.main.count).fill('mat_thunder_crystal'),
    assist: new Array(rec.slots.assist.count).fill('mat_beast_bone'),
    rune: [], allocation: {}, houDays: houDays
  };
  var before = W.getAbsoluteDay();
  var res = F.executeCompoundForging(rec.id, pick);
  return { res: res, dayBefore: before, dayAfter: W.getAbsoluteDay(), rec: rec };
}
var 炉0 = 开一炉(0);
ok(炉0.res && 炉0.res.ok, 'D9 候 0 日真开一炉成功（老路径没被改坏）' + (炉0.res && !炉0.res.ok ? '（reason=' + 炉0.res.reason + ' ' + (炉0.res.houNote || '') + '）' : ''));
eq(炉0.res.plan.houDays, 0, 'D9 候 0 日：plan.houDays = 0');
eq(炉0.res.plan.houQiCost, 炉0.rec.qiCost, 'D9 候 0 日：真气按原价 ' + 炉0.rec.qiCost + ' 付');
var 炉1 = 开一炉(1);
ok(炉1.res && 炉1.res.ok, 'D9 候 1 日真开一炉成功' + (炉1.res && !炉1.res.ok ? '（reason=' + 炉1.res.reason + ' ' + (炉1.res.houNote || '') + '）' : ''));
if (!炉1.res || !炉1.res.ok) { console.log('\n通过：' + pass + '　失败：' + fail); process.exit(1); }
eq(炉1.dayAfter, 炉1.dayBefore + 1, 'D9 候 1 日：世界真的过了一天（' + 炉1.dayBefore + ' → ' + 炉1.dayAfter + '）');
eq(炉1.res.plan.houDays, 1, 'D9 候 1 日：plan.houDays = 1');
eq(炉1.res.plan.houQiMult, 2, 'D9 候 1 日：plan.houQiMult = 2');
eq(炉1.res.plan.houQiCost, F.houQiCost(炉1.rec.qiCost, 1), 'D9 候 1 日：这一炉真气按 ' + 炉1.res.plan.houQiCost + ' 付（原价 ' + 炉1.rec.qiCost + '）');
eq(炉1.res.plan.houFromDay, 炉1.dayBefore, 'D9 候 1 日：plan.houFromDay = 封炉那天的日号');
var 器 = (W.itemById && W.itemById[炉1.res.itemId]) || {};
ok(器._forgePlan && 器._forgePlan.houDays === 1 && 器._forgePlan.houQiMult === 2,
    'D10 候的天数记进器里（随档往返，玩家日后查得到这一炉为什么是这个数）');
ok(炉1.res.plan.notes.some(function (n) { return n.indexOf('候天伺地') >= 0; }),
    'D10 这一炉的 notes 里念出了候天伺地');
// ★ 候 1 日与候 0 日真气的差价真被扣了
var q0 = cd.qi;
cd.qi = 99999; var x0 = cd.qi;
开一炉(0); var 扣0 = x0 - cd.qi;
cd.qi = 99999; var x1 = cd.qi;
开一炉(1); var 扣1 = x1 - cd.qi;
eq(扣0, 炉0.rec.qiCost, 'D10 候 0 日实扣真气 = ' + 扣0 + '（原价）');
eq(扣1, 炉0.rec.qiCost * 2, 'D10 候 1 日实扣真气 = ' + 扣1 + '（双份，差 ' + (扣1 - 扣0) + '）——等待成本真被扣');

// ★ 确定性：同料同技同候期，开两炉一模一样（候期不进词缀掷骰）
var a1 = 开一炉(1), a2 = 开一炉(1);
eq(JSON.stringify(a1.res.affixes.map(function (x) { return x.key + x.points; })),
  JSON.stringify(a2.res.affixes.map(function (x) { return x.key + x.points; })),
  'D11 同料同技同候期开两炉，词缀逐条一致（零随机）');

// ==================== E · 不静默 ====================
sec('E 不静默（条件不满足时写明原因）');
var env0 = F.forgeEnvFor({ main: ['mat_beast_bone'], assist: ['mat_beast_bone'], rune: [], houDays: 0 });
var notes0 = F.envMissNotes(env0);
ok(notes0.some(function (n) { return n.indexOf('未候天') >= 0; }),
    'E1 不候时也要说清「未候天」并告诉玩家可以候（' + String(notes0.filter(function (n) { return n.indexOf('候天') >= 0; })[0] || '').slice(0, 40) + '…）');
var env1 = F.forgeEnvFor({ main: ['mat_beast_bone'], assist: ['mat_beast_bone'], rune: [], houDays: 2 });
var notes1 = F.envMissNotes(env1);
ok(notes1.some(function (n) { return n.indexOf('封炉 2 日') >= 0 && n.indexOf('真气按') >= 0; }),
    'E2 候了 2 日：notes 念出封炉天数 + 真气倍数 + 世界会走什么（不许只说「候了」）');
ok(notes1.some(function (n) { return n.indexOf('第 ') >= 0 && n.indexOf('日') >= 0; }),
    'E2 候了 2 日：notes 念出封炉前后的日号');
// 无主材 / 常料 ⇒ 亮锁 + 原因
var 无主材 = F.forgeHouOptions({ main: [], assist: [], rune: [] });
ok(无主材.every(function (o) { return !!o.lock; }), 'E3 主材未定 ⇒ 三档全亮锁');
ok(无主材[0].lock.indexOf('主材') >= 0, 'E3 锁的理由写明是「主材未定」：' + 无主材[0].lock);
var 常料 = F.forgeHouOptions({ main: ['mat_iron_ore'], assist: ['mat_iron_ore'], rune: [] });
ok(常料.every(function (o) { return !!o.lock; }), 'E4 主材是常料 ⇒ 候不了，且三档都写明为什么');
ok(常料[1].lock.indexOf('常料') >= 0, 'E4 常料的锁理由：' + 常料[1].lock);
// 无部位兽的知情口
var miss17 = F.beastPartReport('彼岸花妖');
ok(miss17.miss && miss17.miss.indexOf('BODY_PARTS_DROPS') >= 0 && miss17.rows.length === 0,
    'E5 无部位件的兽：知情口明写「BODY_PARTS_DROPS 里一条也没有」（不编一个占位档）');
ok(miss17.miss.indexOf('这不是掉率') >= 0, 'E5 并说清这不是掉率问题：' + miss17.miss.slice(0, 70) + '…');
var 查无 = F.beastPartReport('查无此兽');
ok(查无.miss && 查无.rows.length === 0, 'E6 查无此兽也如实回空并写明（不拿假档位占版面）');
// 部位件的产地歧义也要说出来
var 骨 = F.forgeOriginReport(['mat_beast_bone', 'mat_beast_bone']);
ok(Array.isArray(骨.ambiguous) && 骨.ambiguous.length === 2 && 骨.samePoint === false,
    'E7 一料多兽的部位件（妖兽骨）判「分不出」而不是硬套同源：ambiguous=' + JSON.stringify(骨.ambiguous));
ok(F.originNote(骨).indexOf('分不出') >= 0, 'E7 notes 里把「分不出」逐条念给玩家听');
var 荚 = F.forgeOriginReport(['mat_tin_ore', 'mat_tin_ore', 'mat_tin_ore']);
ok(荚.samePoint === true && 荚.pointName === '曼陀罗花妖·毒种荚',
    'E8 独此一家的部位件（曼陀罗毒种荚）判得出同出一处 ⇒ 工整 ' + F.ORIGIN_CRAFT_BONUS + '（point=' + 荚.pointName + '）');

// ==================== 事 2 · 产地绝迹标签 ====================
sec('事 2 · 秘境「产地绝迹」标签（掉落表一个数不动，稀有由标签表达）');
var tres = DD.treasureLedger();
var 有宝秘境 = DD.DUNGEON_TEMPLATES.filter(function (t) {
  return (DD.ROOM_TEMPLATES[t.env] || []).some(function (x) { return x.type === 'treasure'; });
});
eq(有宝秘境.length, 12, 'F1 12 座秘境逐座都有宝藏模板');
eq(tres.length, 16, 'F1 秘境宝藏产地账 ' + tres.length + ' 行（12 座 × treasure 模板里的料逐条摊平）');
eq(new Set(tres.map(function (r) { return r.dungeonId; })).size, 12, 'F1 12 座秘境一处没漏');
var 绝迹 = tres.filter(function (r) { return r.extinct === 'extinct'; });
var 稀见 = tres.filter(function (r) { return r.extinct === 'rare'; });
var 在产 = tres.filter(function (r) { return r.extinct === 'flowing'; });
ok(绝迹.length && 稀见.length && 在产.length, 'F2 三档标签都真有人（绝迹 ' + 绝迹.length + ' 行 / 稀见 ' + 稀见.length
  + ' / 在产 ' + 在产.length + '）——不是把 12 座一律贴同一个标签');
// ★ 标签必须**由表里自己的数推出来**，不许另编一套稀有度
var 标签错 = tres.filter(function (r) {
  var c = r.appearChance;
  var want = (c <= 0.1) ? 'extinct' : ((c <= 0.3) ? 'rare' : 'flowing');
  return r.extinct !== want;
});
eq(标签错.length, 0, 'F3 标签＝f(appearChance) 逐行对得上（绝迹 ≤0.1 / 稀见 ≤0.3 / 在产 >0.3）'
  + (标签错.length ? '：' + 标签错.map(function (r) { return r.dungeonName + '(' + r.appearChance + ')→' + r.extinct; }).join('、') : ''));
var 无据 = tres.filter(function (r) { return !r.basis || r.basis.indexOf('appearChance') < 0 || r.basis.indexOf('一窗一走') < 0; });
eq(无据.length, 0, 'F4 每行 basis 都写得出「凭哪几个数判的」（appearChance + 窗口 + 一窗一走）');
var 炼不了 = tres.filter(function (r) { return !r.forgeable; });
ok(炼不了.length > 0, 'F5 如实标出炼不了的料（' + 炼不了.length + ' 行：'
  + 炼不了.map(function (r) { return r.dungeonName + '→' + r.matId; }).join('、') + '）——不悄悄留一个永远炼不了的掉落');
var 带星 = tres.filter(function (r) { return r.forgeable; });
ok(带星.every(function (r) { return r.grade != null && r.grade >= 0; }), 'F6 可炼的行都带得上品阶（现读 MATERIAL_GRADE）');
// 秘境料接进产地账
F.refreshMaterialOrigins();
var 秘产地 = 0;
tres.forEach(function (r) {
  var os = F.materialOrigins(r.matId) || [];
  if (os.some(function (o) { return o.kind === 'secret' && o.id === 'secret:' + r.dungeonId; })) 秘产地++;
});
eq(秘产地, tres.length, 'F7 ' + tres.length + ' 行秘境宝藏全部接进炼器的产地账（不再判「来路不明」）');
var 雷 = F.materialOrigins('mat_thunder_crystal') || [];
ok(雷.some(function (o) { return o.kind === 'secret' && o.extinctLabel === '产地在产'; }),
    'F8 雷晶的秘境来路带着「产地在产」标签（' + 雷.filter(function (o) { return o.kind === 'secret'; }).map(function (o) { return o.name; }).join('、') + '）');

console.log('\n========== forge-material-granularity：' + pass + ' 过 / ' + fail + ' 失败 ==========');
process.exit(fail ? 1 : 0);
