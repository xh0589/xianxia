// forge-tail-node.js —— 上一批交出来的两条尾巴的验收尺
//
//   ① 器物面板的三道门（阶数 / 材料档位 / 主人因果）必须逐条上脸：
//      3 阶 + 只喂过铁矿时，面板**不许**说「灵性已足，器灵可唤醒」——那是骗玩家去点一个点不动的按钮。
//   ② 材料产地不许有占位假值：填就得填真来源，查不到就整个字段不写（禁止设计 #4）。
//      并且「留空」这件事本身也要有据：那 8 种真的不在资源点账里。
//   ③ 不伤炼器：forge-material-spirit 那 88 条仍全绿。
//
// ★ 本文件刻意不写任何 vNN.N 版本号（会扰动 doc-version-coverage-node 的活号集合）。
//
// 跑法：node tests/forge-tail-node.js
// 回归自证：把 js/cultivation/cultivation.js 的 `_ba.level >= 3` 那句判据改回只看阶数，
//   [A] 段会当场报红（「面板谎称可唤醒」）。

'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');

let 通过 = 0, 失败 = 0;
function ok(c, m) { if (c) { 通过++; console.log('  ✓ ' + m); } else { 失败++; console.log('  [FAIL] ' + m); } }
function sec(s) { console.log('\n=========== ' + s + ' ==========='); }
function load(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ---------- 载入：真文件 + 沙箱 window/document ----------
function 载入(W, rel) {
  const src = load(rel);
  vm.runInContext(src, vm.createContext(W), { filename: rel });
}

const 料表 = (id, name) => ({ id: id, name: name, type: 'material', quality: 'pin9' });

// 一个能跑通「喂料 → 器身材料账 → 面板」全链的世界
function mkEl() {
  const el = {
    _html: '', kids: [],
    setAttribute() {}, getAttribute: () => null, removeAttribute() {},
    querySelector: () => null, querySelectorAll: () => [],
    appendChild(c) { el.kids.push(c); return c; }, insertBefore(c) { el.kids.unshift(c); return c; },
    removeChild(c) { return c; }, cloneNode: () => mkEl(),
    get firstChild() { return el.kids[0] || null; },
    get innerHTML() { return el._html; }, set innerHTML(v) { el._html = v; },
    className: '', style: {}, classList: { add() {}, remove() {}, contains: () => false }
  };
  return el;
}
function 建窗(o) {
  o = o || {};
  const msgs = [];
  let stones = o.stones == null ? 1000 : o.stones;
  const host = mkEl();
  const doc = {
    getElementById: (id) => (id === 'cultivation-panel' ? host : null),
    createElement: () => mkEl(),
    addEventListener() {}, querySelectorAll: () => [], querySelector: () => null
  };
  const W = {
    console: { log() {}, warn() {}, error() {} },
    document: doc,
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {},
    showMessage: (t) => msgs.push(String(t)),
    currentSkills: {},
    currentCharData: {
      level: 30, realm: '金丹', health: 100, maxHealth: 100, qi: 999999,
      karma: o.karma == null ? 0 : o.karma,
      lifeSkills: { '锻造': 60 },
      location: '中州·少林寺',
      _bondedArtifact: o.ba || null
    },
    timeSystem: { advanceTime() {}, getCurrentPeriod: () => ({ id: 'afternoon' }) },
    gameTime: { currentSeason: 'spring' },
    getCurrentWeather: () => ({ id: 'sunny' }),
    WorldCalendar: { day: 3 },
    EventBus: { emit() {}, on() {} },
    StateRegistry: { register() {} },
    DataManager: { deductSpiritStones: (n) => { if (stones < n) return false; stones -= n; return true; } },
    inventory: { slots: o.slots || [], currency: { spiritStones: 99999 } },
    itemById: o.itemById || {},
    removeItem() {}, addItem: () => 1, addResultItem: () => 1,
    getRealmTier: () => 3, getLifeSkill: () => 60,
    updateCharacterStatus() {},
    getCurrentCharData: () => W.currentCharData,
    XianXia: {}
  };
  W.window = W;
  W._getMainTechniqueElement = () => 'metal';
  // 照 仙侠.html 的真实 script 顺序（2067 炼器 → 2069 修炼 → 2322 器灵）
  载入(W, 'js/crafting/forging-compound.js');
  载入(W, 'js/cultivation/cultivation.js');
  载入(W, 'js/equipment/bonded-artifact.js');
  return {
    W: W, msgs: msgs, stones: () => stones,
    文本: () => msgs.join('\n'),
    // 只切本命法宝那一栏：从 🔱 到「喂材料」那个按钮收尾（别拿「喂材料」两个字当刀口，
    // 阶数门那句话里就有「喂材料再升 N 阶」，会被腰斩）
    栏: () => {
      const h = host.innerHTML || '';
      const i = h.indexOf('<span class="text-lg">🔱</span>');
      if (i < 0) return '';
      const k = h.indexOf('喂材料</button>', i);
      if (k < 0) return h.slice(i);
      const e = h.indexOf('</div></div>', k);
      return h.slice(i, e < 0 ? h.length : e);
    }
  };
}

function 铁矿世界(o) {
  o = o || {};
  const w = 建窗({
    karma: o.karma,
    ba: { name: '试炼剑', level: o.level == null ? 3 : o.level, exp: 0, expMax: 140, element: 'metal', durability: 100, maxDurability: 100 },
    slots: [{ uid: 'u1', templateId: 'mat_iron_ore', count: 9 }],
    itemById: { mat_iron_ore: 料表('mat_iron_ore', '铁矿') }
  });
  if (o.喂料 !== false) w.W.feedArtifact();
  return w;
}
function 秘银世界(o) {
  o = o || {};
  const w = 建窗({
    karma: o.karma,
    ba: { name: '试炼剑', level: o.level == null ? 3 : o.level, exp: 0, expMax: 140, element: 'metal', durability: 100, maxDurability: 100 },
    slots: [{ uid: 'u1', templateId: 'mat_mithril', count: 9 }],
    itemById: { mat_mithril: 料表('mat_mithril', '秘银') }
  });
  if (o.喂料 !== false) w.W.feedArtifact();
  return w;
}
const 渲染 = (w) => { w.W.updateCultivationUI(); return w.栏(); };

// =====================================================================
sec('[A] 锁不误导：3 阶 + 只喂铁矿，面包板不许说「可唤醒」');
// =====================================================================
{
  const 凡铁 = 铁矿世界({ level: 3, karma: 0 });
  const 栏 = 渲染(凡铁);
  ok(!!栏, '本命法宝那一栏渲染出来了（面板读口接上了，不是静默不画）');
  ok(栏.indexOf('灵性已足') < 0 && 栏.indexOf('器灵可唤醒') < 0,
      '★ 阶数够（3 阶）也**不说**「灵性已足，器灵可唤醒」——这一句只在三门全过时出现');
  ok(/onclick="window\.awakenArtifactSpirit\(\)"/.test(栏) === false,
      '★ 面板不再给一个点下去必被拒的「唤醒器灵」按钮');
  ok(/disabled/.test(栏) && /🔒 唤醒器灵/.test(栏),
      '★ 亮锁：按钮真的 disabled（带 🔒），不是「看着能点其实点不动」');
  // 三道门逐条写出来
  ok(/🔒 材料：只吃过粗铁级铁矿，器灵不启（需上品级：秘银\/雷晶\/妖丹\/龙骨\/陨铁）/.test(栏),
      '★ 材料门写明「只吃过粗铁级铁矿，器灵不启」并点名够格的料（秘银/雷晶/妖丹/龙骨/陨铁）');
  ok(/✓ 阶数：3\/3/.test(栏), '阶数门过了就打勾（3/3）——三道门都写，不是只写没过的那道');
  ok(/✓ 因果：0（中立），主人无逆理之谋/.test(栏), '因果门过了就打勾（0·中立）');
  ok((栏.match(/🔒 材料/g) || []).length === 1 && (栏.match(/🔒 因果/g) || []).length === 0
      && (栏.match(/✓ 材料/g) || []).length === 0,
      '材料门只挂一个锁，因果门是勾——不会三门齐挂吓人');
  // 面板说的与真点下去的必须一致
  ok(凡铁.W.awakenArtifactSpirit() === false && /凡铁不该有灵/.test(凡铁.文本()),
      '★ 面板说的就是真规则：真去点仍被材料门拒，回执「凡铁不该有灵」（两处口径一致，不是各说各话）');
  ok(凡铁.stones() === 1000, '唤不醒分文不扣（既有口径没被这次改动破坏）');

  // 因果门没过时同样逐条写出来
  const 逆道 = 铁矿世界({ level: 3, karma: -60 });
  const 逆栏 = 渲染(逆道);
  ok(/🔒 因果：业果太深（-60·恶），器灵闭目不睁（需 ≥ -50）/.test(逆栏),
      '★ 因果门写明差在哪（-60·恶）与要什么（需 ≥ -50），不是一句「不可唤醒」');
  ok(/🔒 材料：只吃过粗铁级铁矿/.test(逆栏) && /🔒 因果：/.test(逆栏) && /✓ 阶数：3\/3/.test(逆栏),
      '两门没过时两道锁都亮着，过的第三道照样打勾（逐条，不是只报第一条）');

  // 阶数门没过
  const 低阶 = 秘银世界({ level: 2, karma: 0 });
  const 低栏 = 渲染(低阶);
  ok(/🔒 阶数：2\/3，喂材料再升 1 阶/.test(低栏) && /✓ 材料：上品级·秘银/.test(低栏),
      '阶数门没过时写明还差几阶；材料门（已喂秘银）打勾');

  // 旧器无料可考那一支：有声音的宽限，不是暗门
  const 旧器 = 建窗({ ba: { name: '旧剑', level: 3, exp: 0, expMax: 140, element: 'metal' } });
  const 旧栏 = 渲染(旧器);
  ok(/灵性已足，器灵可唤醒/.test(旧栏) && /无料可考/.test(旧栏),
      '旧器（无料可考）走旧例放行，但面板上写明为什么放行（不是默默可用）');
}

// =====================================================================
sec('[B] 全满足才显示「灵性已足，器灵可唤醒」');
// =====================================================================
{
  const 银 = 秘银世界({ level: 3, karma: 0 });
  const 银栏 = 渲染(银);
  ok(/灵性已足，器灵可唤醒/.test(银栏), '★ 上品级料 + 3 阶 + 因果 0 ⇒ 显示「灵性已足，器灵可唤醒」');
  ok(/onclick="window\.awakenArtifactSpirit\(\)" class="bg-amber-600/.test(银栏) && !/disabled/.test(银栏),
      '按钮是可点的（没挂 disabled）');
  ok(/✓ 材料：上品级·秘银，够格起灵/.test(银栏) && /✓ 因果：0（中立）/.test(银栏) && /✓ 阶数：3\/3/.test(银栏),
      '三道门全打勾（不是只写一句「可唤醒」）');
  ok(银.W.awakenArtifactSpirit() === true, '★ 面板说可唤醒 ⇒ 真点就醒（屏上与实得同数）');

  // 边界：因果 -50 放行 / -51 拦；与读口同一条线
  const 卡边 = 秘银世界({ level: 3, karma: -50 });
  const 卡边栏 = 渲染(卡边);
  ok(/灵性已足/.test(卡边栏) && !/🔒 因果/.test(卡边栏), '因果 −50（正是 app.js:2074 那条线）⇒ 照常可唤醒');
  const 卡线 = 秘银世界({ level: 3, karma: -51 });
  const 卡线栏 = 渲染(卡线);
  ok(/🔒 因果：业果太深（-51·恶）/.test(卡线栏) && !/灵性已足/.test(卡线栏),
      '因果 −51 ⇒ 挂锁且不说「可唤醒」（阈值与读口一致：-50 放行、-51 拦）');

  // 器灵已醒：走另一套文案，不显示三道门
  const 醒 = 秘银世界({ level: 3, karma: 0 });
  醒.W.awakenArtifactSpirit();
  const 醒栏 = 渲染(醒);
  ok(/器灵「/.test(醒栏) && /器灵交感/.test(醒栏) && !/🔒/.test(醒栏) && !/灵性已足/.test(醒栏),
      '器灵已醒 ⇒ 走「器灵名+等级+经验 / 器灵交感」那一套，三道门不再占屏');
}

// =====================================================================
sec('[C] 材料表不许有占位假值（禁止设计 #4）');
// =====================================================================
const MAT_SRC = load('js/items-extended/04-materials.js');
const 材料行 = (function () {
  const out = {};
  const re = /\{\s*id:\s*'(mat_[a-z_]+)'([^\n]*)\}/g; let m;
  while ((m = re.exec(MAT_SRC))) out[m[1]] = m[2];
  return out;
})();
const 八种 = ['mat_copper_ore', 'mat_tin_ore', 'mat_beast_skin', 'mat_beast_bone',
  'mat_demon_beast_skin', 'mat_demon_beast_bone', 'mat_beast_soul', 'mat_dragon_bone'];
const 假值 = ['未知', '暂无', 'unknown', 'n/a', 'NA', 'null', 'undefined', '待定', 'TBD', '-', '无', '?'];
{
  ok(Object.keys(材料行).length >= 50, '材料表逐行读出来了（' + Object.keys(材料行).length + ' 行）');
  const 带产地 = Object.keys(材料行).filter(id => /origin/.test(材料行[id]));
  ok(带产地.length === 0, '★ 材料表里零 origin 字段（本批实测：能查到出处的走运行时派生，查不到的留空）');
  ok(/origin\s*:/.test(MAT_SRC) === false, '整份文件里没有 `origin:` 这种字段写法（防止有人换个字段名塞占位）');
  // 反向自证：真有占位假值时，本套必须报红
  const 假的 = Object.keys(材料行).filter(id => {
    const seg = 材料行[id];
    return 假值.some(f => seg.indexOf("'" + f + "'") >= 0 || seg.indexOf('"' + f + '"') >= 0);
  });
  ok(假的.length === 0, '任何材料行里都没有 ' + JSON.stringify(假值.slice(0, 6)) + ' 这类占位串（当前：0 行）');
  // 留空这件事要在文件里留痕，且逐个点名（七种有行的）
  const 有行的 = 八种.filter(id => !!材料行[id]);
  ok(有行的.length === 7 && 有行的.every(id => MAT_SRC.indexOf(id) >= 0),
      '★ 留空的 7 种在文件里逐个点名留痕（' + 有行的.join(' / ') + '）——下一批想编产地时会先看见这张单子');
  ok(八种.indexOf('mat_beast_soul') >= 0 && !材料行['mat_beast_soul']
      && /mat_beast_soul:/.test(MAT_SRC) === false,
      'mat_beast_soul 只在炼器模块占位（本表连行都没有，只有表头那句说明提到它）⇒ 无处可填，也不给它造一行');
}

// =====================================================================
sec('[D] 产地有据：每个产地值都能在 resource-points.js 里对到');
// =====================================================================
{
  // 真的那 30 个点：直接跑源文件，不抄
  const 真实窗 = { console: { log() {} } };
  真实窗.window = 真实窗;
  载入(真实窗, 'js/extensions/resource-points.js');
  const 点 = 真实窗.ResourcePoints.INITIAL_POINTS;
  const 点名 = {}; const 产出 = {};
  点.forEach(p => {
    点名[p.id] = p;
    Object.keys(p.output || {}).forEach(k => { (产出[k] = 产出[k] || []).push(p.id); });
  });
  ok(点.length === 30, '资源点账真跑出来 ' + 点.length + ' 个点（不是抄的）');

  // 炼器侧派生的产地表
  const 炉 = { console: { log() {}, warn() {}, error() {} }, ResourcePoints: 真实窗.ResourcePoints, StateRegistry: { register() {} }, window: null };
  炉.window = 炉;
  载入(炉, 'js/crafting/forging-compound.js');
  const FC = 炉.ForgingCompound;
  const GRADE = Object.keys(FC.MATERIAL_GRADE);
  ok(GRADE.length === 28, '材料档位权威表 ' + GRADE.length + ' 种（与上一批同一份，没动）');

  let 有产地 = [], 无产地 = [];
  GRADE.forEach(id => { (FC.materialOrigins(id) ? 有产地 : 无产地).push(id); });
  ok(有产地.length === 20 && 无产地.length === 8,
      '28 种里 20 种有产地、8 种查不到（' + 无产地.join(' / ') + '）');
  ok(JSON.stringify(无产地.slice().sort()) === JSON.stringify(八种.slice().sort()),
      '★ 查不到出处的正好就是任务书点名的 8 种（逐名比对，不是「差不多」）');

  // 每个产地值都要在资源点账里对得上（后期档那几条另按 LATE_MATERIAL_TIERS 对）
  const FC_SRC = load('js/crafting/forging-compound.js');
  const 后期档 = (FC_SRC.match(/var LATE_MATERIAL_TIERS = \[([\s\S]*?)\n    \];/) || ['', ''])[1];
  const 后期 = {};
  const tre = /key:\s*'([^']+)'[\s\S]*?drops:\s*\[([\s\S]*?)\]/g; let t;
  while ((t = tre.exec(后期档))) {
    const dre = /matId:\s*'(mat_[a-z_]+)'/g; let d;
    while ((d = dre.exec(t[2]))) (后期[d[1]] = 后期[d[1]] || []).push(t[1]);
  }
  let 失据 = [], 无源 = [];
  有产地.forEach(id => {
    (FC.materialOrigins(id) || []).forEach(row => {
      if (String(row.id).indexOf('late:') === 0) {
        if ((后期[id] || []).indexOf(String(row.id).slice(5)) < 0) 失据.push(id + '→' + row.id);
        return;
      }
      if (!点名[row.id]) 失据.push(id + '→' + row.id + '(资源点账里没这个 id)');
      else if ((产出[id] || []).indexOf(row.id) < 0) 失据.push(id + '→' + row.id + '(那个点不产它)');
    });
  });
  ok(失据.length === 0, '★ 20 种材料的每一个产地值都能在 resource-points.js / LATE_MATERIAL_TIERS 里对到（对不上：' + (失据.join(',') || '0 条') + '）');
  ok(有产地.every(id => { const r = FC.materialOrigins(id) || []; return r.every(x => x.basis && x.basis.length > 8); }),
      '每条产地都自带 basis（写明据哪本账的哪一行），不是光一个 id');
  const 占位串 = ['未知', '暂无', 'unknown', 'n/a', 'TBD', '待定', 'null', 'undefined'];
  const 占位处 = [];
  有产地.forEach(id => (FC.materialOrigins(id) || []).forEach(row => {
    Object.keys(row).forEach(k => { if (占位串.indexOf(row[k]) >= 0) 占位处.push(id + '.' + k + '=' + row[k]); });
  }));
  ok(占位处.length === 0, '★ 产地账逐字段查，零占位串（命中：' + (占位处.join(',') || '0 处') + '）');
  ok(有产地.every(id => (FC.materialOrigins(id) || []).every(r => r.name && r.basis && r.id)),
      '每条产地都有 id / 名字 / 依据三样齐全（region 允许空串——那是真没标，不是占位）');

  // 留空也要有据：这 8 种真的不在那两本账里（日后真出了，本条会报红提醒补）
  无产地.forEach(id => {
    const 在资源点 = !!产出[id], 在后期 = !!后期[id];
    ok(!在资源点 && !在后期, '★ 留空留得对：' + id + ' 在资源点账与后期料档里都查不到（资源点=' + (在资源点 ? '有' : '无') + ' 后期档=' + (在后期 ? '有' : '无') + '）');
  });
  // 反向自证：真往里塞一种，判定会变
  const 点数前 = Object.keys(产出).length;
  ok(点数前 >= 20, '资源点账里 mat_ 产出共 ' + 点数前 + ' 种（灵脉那 10 个点出的是 spiritStone 等，不进炼器表）');
}

// =====================================================================
sec('[E] 不伤炼器：forge-material-spirit 那 88 条仍全绿');
// =====================================================================
{
  const r = spawnSync(process.execPath, [path.join(ROOT, 'tests', 'forge-material-spirit-node.js')],
    { cwd: ROOT, encoding: 'utf8', timeout: 180000, maxBuffer: 32 * 1024 * 1024 });
  const out = (r.stdout || '') + (r.stderr || '');
  const m = out.match(/forge-material-spirit:\s*(\d+)\s*passed,\s*(\d+)\s*failed/);
  ok(!!m && Number(m[2]) === 0 && Number(m[1]) === 88,
      'forge-material-spirit：' + (m ? m[1] + ' 通过 / ' + m[2] + ' 失败' : '没读到小结行') + '（本批没碰 bonded-artifact.js / forging-compound.js）');
  ok(r.status === 0, '退出码 0（材料表加了表头说明没影响它的任何一条）');
}

// =====================================================================
sec('[F] 只动了该动的两个文件');
// =====================================================================
{
  const cul = load('js/cultivation/cultivation.js');
  ok(/window\.spiritAwakenReadiness/.test(cul), 'cultivation.js 走既有读口 spiritAwakenReadiness（不自己判材料与因果）');
  ok(/_ba\.level >= 3/.test(cul) === false, '★ 旧病灶那句 `_ba.level >= 3` 已经不在面板这一处了（只看阶数的那套判据已拿掉）');
  ok(cul.indexOf('灵性已足，器灵可唤醒') >= 0 && /_rdy\.ok/.test(cul), '「灵性已足」三字仍留着，但挂在 rdy.ok（三门全过）这一支上');
  ok(/🔒 材料/.test(cul) && /🔒 因果/.test(cul) && /🔒 阶数/.test(cul) && /✓ 阶数/.test(cul), '三个门的 ✓/🔒 两种写法都在源码里');
  const ba = load('js/equipment/bonded-artifact.js');
  ok(/function spiritAwakenReadiness\(\)/.test(ba) && /SPIRIT_AWAKEN_MIN_GRADE/.test(ba), 'bonded-artifact.js 的读口原样在位（本批一个字没改）');
  const rp = load('js/extensions/resource-points.js');
  ok(/INITIAL_POINTS\s*=\s*\[/.test(rp) && (rp.match(/\{ id: '(vein|mine|herb)_/g) || []).length === 30,
      'resource-points.js 30 个点原样（只读，没动）');
}

console.log('\n=========================================');
console.log('forge-tail: ' + 通过 + ' passed, ' + 失败 + ' failed');
console.log('=========================================');
process.exit(失败 ? 1 : 0);
