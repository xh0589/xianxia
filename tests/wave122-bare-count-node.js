#!/usr/bin/env node
/**
 * 第一百二十二批 · DES-67：那一枚「模板在表上的历史裸格子」，点「使用」仍然会炸
 * 病（真 Chrome 实机点到，见 .scratch/v24-CO5-bareuse.out）：
 *   第一百二十一批把「读模板」统一走了 _slotTemplate，但「扣数」那一刀仍是裸调 slot.removeCount(n)——
 *   历史裸格子是 plain 对象、没有这个方法 ⇒ 玩家点「使用」→ Uncaught TypeError: slot.removeCount is not a function
 *   → 全局兜底在那条回执后面缀一句「⚠️ 游戏遇到一点小问题（内部错误），刚才的操作可能没生效」。
 *     真相反着：useItem 消耗支先 applyConsumableEffect（:440 涨气＋念「使用了 X」）后扣数（:443），
 *     那一刀炸在最后 ⇒ 药上了身、丹却不扣，同一枚点一次涨一次。**这半句已由本套 [F] 在 vm 行为层量到**
 *     （两份全新语境只差那一刀：改前抛 TypeError、count 3→3→3→3、格子还在，真气却 55→103→159 连点连涨）；
 *     真 Chrome 那一屏（真气正顶满）只证到「不扣＋抛错」两件事，「白吃」的屏证照欠。
 *   同一条裸调用在 js/inventory.js 有 8 处（含通用移除口 removeItem），js/app.js 战斗用符 1 处；
 *   而仓库别处（app.js:5944/6070/6502、crafting.js:694、cultivation-bottleneck.js:283）早就写了 typeof 守卫——**同一件事两种笔法**。
 * 改：新增 _slotRemoveCount(slot, n)（有方法走方法，保留 ItemInstance 的堆叠语义；没有则按同一语义减 count 并夹到 0），
 *     9 处裸调全部收口，并导出到 window。
 * 手法：真物品链＋真 js/inventory.js 进 vm 跑行为；另附全仓棘轮（裸调 removeCount 归零）与三枚立案哨兵。
 * 运行：node tests/wave122-bare-count-node.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');

let passed = 0, failed = 0;
function ok(cond, msg) {
    if (cond) passed++;
    else { failed++; console.log('[FAIL] ' + msg); }
}
function load(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ============ 真文件装载 ============
function makeNode() {
    const n = {
        style: { setProperty() {}, removeProperty() {} },
        classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
        dataset: {}, children: [], childNodes: [], attrs: {},
        appendChild(c) { this.children.push(c); c.parentNode = this; return c; },
        removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c; },
        setAttribute(k, v) { this.attrs[k] = String(v); },
        getAttribute(k) { return Object.prototype.hasOwnProperty.call(this.attrs, k) ? this.attrs[k] : null; },
        addEventListener() {}, removeEventListener() {}, dispatchEvent() {},
        closest() { return null; }, querySelector() { return null; }, querySelectorAll() { return []; },
        focus() {}, blur() {}, click() {}, remove() {}, insertBefore(c) { this.children.push(c); return c; },
        getBoundingClientRect() { return { top: 0, left: 0, width: 120, height: 120, bottom: 120, right: 120 }; },
        scrollIntoView() {}, offsetHeight: 120, offsetWidth: 120, parentNode: null,
        textContent: '', innerHTML: '', value: ''
    };
    return n;
}

// 一份语境一套沙箱：js/inventory.js 里有顶层 const，同一个语境装第二遍会「already declared」，
// 所以 [F] 那段「改前对照」要另开一份全新的装。
function newCtx() {
    const msgs = [];
    const sb = {
        console: { log() {}, warn() {}, error() {} },
        localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
        setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
        requestAnimationFrame: () => 0,
        navigator: { userAgent: 'node', maxTouchPoints: 0 },
        location: { href: 'file:///xianxia.html', search: '' },
        matchMedia: () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {} }),
        alert() {}, prompt: () => null, confirm: () => true,
        parseInt, parseFloat, isNaN, Number, String, Math, Date, JSON, Set, Map, Array, Object, RegExp, Error, Promise,
        showMessage: (t, k) => { msgs.push({ text: String(t), kind: k }); },
        performance: { now: () => 0 }
    };
    sb.window = sb;
    sb.globalThis = sb;
    sb.document = {
        getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
        createElement: () => makeNode(), createTextNode: () => makeNode(),
        createElementNS: () => makeNode(), addEventListener() {}, removeEventListener() {},
        body: makeNode(), head: makeNode(), documentElement: makeNode(), readyState: 'loading',
        activeElement: null
    };
    vm.createContext(sb);
    return { sb, msgs };
}

// 主语境那套沙箱（[F] 段另开两份新的，不共用）
const { sb, msgs } = newCtx();

const ORDER = [
    'js/items.js',
    'js/items-extended/01-pills.js', 'js/items-extended/02-weapons.js', 'js/items-extended/03-armor.js',
    'js/items-extended/04-materials.js', 'js/items-extended/05-talismans.js', 'js/items-extended/06-arts.js',
    'js/items-extended/07-food.js', 'js/items-extended/08-special.js',
    'js/items-extended.js',
    'js/items-extended/13-missing-ids.js', 'js/items-extended/14-ability-manuals.js',
    'js/items-extended/15-root-refine.js', 'js/items-extended/16-dangling-ids.js',
    'js/items-extended/17-lead-tokens.js', 'js/items-extended/18-grade-expansion.js',
    'js/items-extended/10-crafting-extensions.js', 'js/items-extended/11-event-extensions.js',
    'js/items-extended/12-quest-extensions.js',
    'js/extensions/talisman-advanced.js'
];
const loadFails = [];
for (const f of ORDER) {
    try { vm.runInContext(load(f), sb, { filename: f }); }
    catch (e) { loadFails.push(f + ': ' + e.message); }
}
try { vm.runInContext(load('js/inventory.js'), sb, { filename: 'js/inventory.js' }); }
catch (e) { loadFails.push('js/inventory.js: ' + e.message); }
ok(loadFails.length === 0, '⓪ 真物品链＋真背包脚本装载无异常' + (loadFails.length ? '（' + loadFails.join(' | ') + '）' : ''));

const R = sb.window.itemById || {};
console.log('[尺口径] 本套件装载序 ' + ORDER.length + ' 份物品文件，实读 itemById=' + Object.keys(R).length + ' 枚（与第一百二十一批同一把尺，别与全库并集 711 混用）');

// 一枚真消耗品：模板在表、subtype 走通用消耗品管线、effect 只动真气（不牵扯疗伤／饱食那些闸）
const PILL = Object.keys(R).find(id => {
    const t = R[id];
    return t && t.type === 'consumable' && t.subtype === 'pill' && t.effect && typeof t.effect.qi_recovery === 'number';
});
ok(!!PILL, '⓪a 找到一枚真「补真气丹」模板做实验品（' + PILL + '＝' + (R[PILL] && R[PILL].name) + '）');
ok(!!R[PILL] && R[PILL].implemented !== false, '⓪b 自证支：这枚模板不是 implemented:false（否则 useItem 会在闸前就返回，测不到扣数那一刀）');
ok(typeof sb.window._slotRemoveCount === 'function', '⓪c 新的统一扣数尺已导出到 window');
ok(typeof sb.window.useItem === 'function' && typeof sb.window.removeItem === 'function',
    '⓪d 被测两扇门确从真背包脚本导出（useItem／removeItem）');

// ============ [A] 尺本身 ============
console.log('[A] 统一扣数尺');
const mkBare = (tid, cnt) => ({ uid: 'bare_' + tid + '_' + cnt, templateId: tid, count: cnt });
const _rc = sb.window._slotRemoveCount;

// A1 自证支：plain 格子真的没有那个方法（否则这一批的病是我编的）
const probeBare = mkBare(PILL, 3);
ok(typeof probeBare.removeCount !== 'function', 'A1 自证支：plain 格子确实没有 removeCount 方法（裸调必抛，病是真的）');
sb.window.inventory.slots.length = 0;
for (let i = 0; i < 30; i++) sb.window.inventory.slots.push(null);
sb.window.addItem(PILL, 2);
const realInst = sb.window.inventory.slots.find(x => !!x);
ok(!!realInst && typeof realInst.removeCount === 'function', 'A1b 对照：走 addItem 拿到的真实例有这个方法（两条路都得留着）');

ok(_rc(mkBare(PILL, 3), 1) === false && _rc(mkBare(PILL, 3), 3) === true, 'A2/A3 裸格子：没扣空返回假、扣到空返回真');
const half = mkBare(PILL, 5);
_rc(half, 2);
ok(half.count === 3, 'A4 裸格子扣 2 → count 5→3（念得出账）');
_rc(half, 99);
ok(half.count === 0, 'A5 扣超持有夹在 0，不许成负数（实得 ' + half.count + '）');
const odd = mkBare(PILL, 2);
_rc(odd, 0);
ok(odd.count === 1, 'A6 n 传 0 按 1 处理——不许「点了却没扣」也不许扣成 NaN（实得 ' + odd.count + '）');
const odd2 = mkBare(PILL, undefined);
_rc(odd2, 1);
ok(odd2.count === 0, 'A7 裸格子连 count 都没有时按 1 枚起算（实得 ' + odd2.count + '）');
ok(_rc(null, 1) === false && _rc(undefined, 1) === false, 'A8 空格子不抛错、返回假');
const inst2 = mkBare(PILL, 1);
void inst2;
// 真实例走自己的方法：语义由类负责，尺不许另造一套
const stackTpl = R[PILL];
const before = realInst.count;
const r5 = _rc(realInst, 1);
ok(realInst.count === before - 1 && r5 === false, 'A9 真实例仍走它自己的 removeCount（count ' + before + '→' + realInst.count + '，尺没插手）');

// ============ [B] 行为层：两扇门在裸格子上不再炸 ============
console.log('[B] 真 useItem／removeItem 落在裸格子上');
sb.window.currentCharData = { qi: 0, maxQi: 100, energy: 50, maxEnergy: 100 };
sb.window.timeSystem = { advanceTime() {} };
function resetBag(slotsArr) {
    sb.window.inventory.slots.length = 0;
    for (let i = 0; i < 30; i++) sb.window.inventory.slots.push(null);
    slotsArr.forEach((s, i) => { sb.window.inventory.slots[i] = s; });
    sb.window.inventory.filter = 'all';
    sb.window.inventory.qualityFilter = 'all';
    sb.window.inventory.searchQuery = '';
    if (sb.window.inventory.markedForSale && sb.window.inventory.markedForSale.clear) sb.window.inventory.markedForSale.clear();
}

// B1：裸格子点「使用」——本批最硬的一条
const bare = mkBare(PILL, 2);
resetBag([bare]);
msgs.length = 0;
let threw = '';
let usedRet;
try { usedRet = sb.window.useItem(bare.uid); } catch (e) { threw = e.message; }
ok(threw === '', 'B1 裸格子点「使用」不再抛错（改前正是这里：' + (threw || 'Uncaught TypeError: slot.removeCount is not a function') + '）' + (threw ? '（实抛 ' + threw + '）' : ''));
ok(usedRet === true, 'B1b 使用返回真回执（真把丹吃下去了）');
ok(bare.count === 1, 'B1c 丹扣了一枚：count 2→1（实得 ' + bare.count + '）');
ok(sb.window.currentCharData.qi > 0, 'B1d 药力真进账：qi 0→' + sb.window.currentCharData.qi + '（改前这里既没扣也没进）');

// B2：最后一枚用完 → 那一格该空出来（裸格子也得遵守同一条规矩）
sb.window.currentCharData.qi = 0;
let threw2 = '';
try { sb.window.useItem(bare.uid); sb.window.useItem(bare.uid); } catch (e) { threw2 = e.message; }
ok(threw2 === '' && sb.window.inventory.slots[0] === null,
    'B2 扣到空时那一格被抹平（不留下 count:0 的僵尸格）' + (threw2 ? '（实抛 ' + threw2 + '）' : ''));

// B3：通用移除口 removeItem 也在同一把刀上——旧档裸格子卖不出去／交不了任务的那条路
const bare2 = mkBare(PILL, 4);
resetBag([bare2]);
let threw3 = '';
let rmRet;
try { rmRet = sb.window.removeItem(bare2.uid, 3); } catch (e) { threw3 = e.message; }
ok(threw3 === '' && rmRet === true && bare2.count === 1,
    'B3 removeItem(裸格子, 3) → 返回真、count 4→1（改前这里同样抛）' + (threw3 ? '（实抛 ' + threw3 + '）' : ''));
let threw4 = '';
try { sb.window.removeItem(bare2.uid, 1); } catch (e) { threw4 = e.message; }
ok(threw4 === '' && sb.window.inventory.slots[0] === null, 'B3b removeItem 扣到空 → 格子归 null' + (threw4 ? '（实抛 ' + threw4 + '）' : ''));

// B4 自紧闸：真实例那条路不许被改坏（有方法就用方法，堆叠语义仍归类）
sb.window.addItem(PILL, 3);
const real2 = sb.window.inventory.slots.find(x => !!x);
const uid2 = real2.uid;
const qi0 = sb.window.currentCharData.qi;
let threw5 = '';
try { sb.window.useItem(uid2); } catch (e) { threw5 = e.message; }
ok(threw5 === '' && real2.count === 2 && sb.window.currentCharData.qi >= qi0,
    'B4 自紧闸：真实例照旧用得动（count 3→2、真气只增不减）——尺没把正常账堵死' + (threw5 ? '（实抛 ' + threw5 + '）' : ''));

// B5 自紧闸：表上查无此物那一格仍走第一百二十一批的诚实回执，不许被这把新尺顺手「用起来」
const dead = { uid: 'dead_pill_x', templateId: 'exp_pill_not_in_table', name: '修为丹', count: 1 };
resetBag([dead]);
msgs.length = 0;
let threw6 = '';
let deadRet;
try { deadRet = sb.window.useItem(dead.uid); } catch (e) { threw6 = e.message; }
ok(threw6 === '' && deadRet === false && dead.count === 1 &&
    msgs.some(m => /物品表上查无此物/.test(m.text)),
    'B5 自紧闸：查无此物那一格仍是「用不了＋念得出口的回执＋一枚不扣」' + (threw6 ? '（实抛 ' + threw6 + '）' : ''));

// ============ [C] 全仓棘轮：裸调 removeCount 归零 ============
console.log('[C] 棘轮');
function walk(dir, out) {
    for (const name of fs.readdirSync(dir)) {
        if (name === 'node_modules' || name.startsWith('.')) continue;
        const full = path.join(dir, name);
        const st = fs.statSync(full);
        if (st.isDirectory()) walk(full, out);
        else if (name.endsWith('.js')) out.push(full);
    }
    return out;
}
const allJs = walk(path.join(ROOT, 'js'), []);
function unguarded(rel) {
    const src = load(rel).split('\n');
    const hits = [];
    src.forEach((line, i) => {
        if (!/\.removeCount\(/.test(line)) return;
        if (/function removeCount|removeCount\(remove\)/.test(line)) return;          // 类自己的定义
        if (/typeof\s+\S*\.?removeCount\s*===\s*'function'/.test(line)) return;        // 同行守卫
        if (/^\s*if \(typeof slot\.removeCount === 'function'\)\s*$/.test(line)) return; // 上一行守卫的下一行（bottleneck 那处）
        const prev = (src[i - 1] || '');
        if (/typeof\s+\S*\.?removeCount\s*===\s*'function'/.test(prev)) return;
        if (/this\.removeCount\(/.test(line)) return;                                  // 类内部
        hits.push(rel + ':' + (i + 1) + '  ' + line.trim().slice(0, 70));
    });
    return hits;
}
// 尺自己那一行（_slotRemoveCount 内部）与类定义是合法的，其余全算裸调
const bad = [];
for (const f of allJs) {
    const rel = path.relative(ROOT, f).replace(/\\/g, '/');
    for (const h of unguarded(rel)) {
        if (/^\s*(if \(typeof slot\.removeCount === 'function'\) )?return slot\.removeCount\(n\);/.test(h.split('  ')[1] || '')) continue;
        bad.push(h);
    }
}
ok(bad.length === 0, 'C1 全仓裸调 slot.removeCount 归零（实得 ' + bad.length + ' 处：' + bad.slice(0, 4).join(' | ') + '）');
const invSrc = load('js/inventory.js');
const appSrc = load('js/app.js');
ok((invSrc.match(/_slotRemoveCount\(/g) || []).length >= 9,
    'C2 背包这一根线上至少 9 处（8 处收口＋尺定义）（实得 ' + (invSrc.match(/_slotRemoveCount\(/g) || []).length + '）');
ok(/window\._slotRemoveCount = _slotRemoveCount/.test(invSrc), 'C3 尺已导出（别的文件不必再抄一份守卫）');
ok(/window\._slotRemoveCount\(slot, 1\)/.test(appSrc), 'C4 战斗用符那一刀也接上了同一根线');
ok(!/slot\.removeCount\(1\);\s*\n\s*if \(slot\.count <= 0\) window\.inventory\.slots\[slotIdx\] = null;/.test(appSrc),
    'C5 app.js 那一处不许退回裸调（红闸：谁改回去当场红）');

// ============ [D] 立案哨兵（只钉不动）============
console.log('[D] 立案哨兵');
const craftSrc = load('js/crafting.js');
// 取名字用捕获组，别拿 slice 数偏移（上一稿 slice(8,-1) 咬掉首字，把小还丹/大还丹错并成一对假同名）
const craftNames = [...craftSrc.matchAll(/name: '([^']+)'/g)].map(m => m[1]);
const dupUniq = [...new Set(craftNames.filter((n, i) => craftNames.indexOf(n) !== i))];
ok(dupUniq.length === 3 && ['培元丹', '筑基丹', '凝元丹'].every(n => dupUniq.indexOf(n) >= 0),
    'D1 立案·DES-68：炼丹房屏上有三对同名不同货的方子（' + dupUniq.join('/') + '）——收口要改展示名，待裁决');
// 自证「不同货」不是话术：每一对同名方子的产出 itemId 确实两样
const craftPairs = [...craftSrc.matchAll(/name: '([^']+)'[\s\S]*?result: \{ itemId: '([^']+)'/g)];
const craftOut = {};
for (const m of craftPairs) (craftOut[m[1]] = craftOut[m[1]] || new Set()).add(m[2]);
const sameNameDiffGoods = dupUniq.filter(n => (craftOut[n] || new Set()).size >= 2);
ok(sameNameDiffGoods.length === dupUniq.length,
    'D1a 自证：这三对同名方子各出各的货（' + sameNameDiffGoods.map(n => n + '→' + [...craftOut[n]].join('＋')).join('；') + '）');
const pillsSrc = load('js/items-extended/01-pills.js');
const pidNames = [...pillsSrc.matchAll(/name: '([^']+)'/g)].map(m => m[1]);
const pdup = [...new Set(pidNames.filter((n, i) => pidNames.indexOf(n) !== i))];
ok(pdup.length >= 3, 'D1b 立案·DES-68：物品表里同名两枚的确实存在（' + pdup.join('/') + '）——行囊卡面只印名字，玩家分不出');
// 机制层没跟着坏：消耗与判定认的是 subtype/effect 字段，不是名字（强制规则第 5 条）
ok(!/name\s*===\s*['"](培元丹|筑基丹|凝元丹)['"]/.test(invSrc + appSrc + load('js/cultivation/cultivation.js')),
    'D1c 自证：没有一处按这三个中文名反推机制（同名只是牌面问题，不是账目问题）');
ok(/typeof window\._slotTemplate === 'function'|window\._slotTemplate/.test(invSrc),
    'D2 第一百二十一批那把读模板的尺仍在（本批只是补上扣数那一刀，没换掉它）');
// buyFromCityShop 死函数（第一百二十一批登记）
const allSrc = allJs.map(f => load(path.relative(ROOT, f).replace(/\\/g, '/'))).join('\n');
const calls = (allSrc.match(/buyFromCityShop\(/g) || []).length
    - (appSrc.match(/function buyFromCityShop\(/g) || []).length;
ok(calls === 0, 'D3 立案·死函数：buyFromCityShop 除定义外全仓零调用（实得 ' + calls + ' 处调用）——里面仍是 DES-64 那本第二账');

// ============ [E] DES-69：同一张表在一个文件里赋两次，后一次把前一次改口回去 ============
console.log('[E] DES-69 整表重复赋值');
// 病：01-pills.js 里 window.extendedMedicalItems 先后赋两次，items-extended.js 在这之后才合并
//     ⇒ 赢家是最后那份旧抄件，「新增 useContext」那一份白写。useContext 是菜单真读的字段
//       （别的货会印「使用场景：世界、战斗」），但这两枚绷带先被 subtype==='medical' 那一支拦下，
//       所以屏上改前改后同一句「⚠ 请在疗伤界面使用」——钉的是「后一份静默盖掉前一份」这个坑，不是一张新屏。
const bandage = R['med_bandage'];
ok(bandage && Array.isArray(bandage.useContext) && bandage.useContext.indexOf('medical') >= 0,
    'E1 绷带进表的确实带上了那份被盖掉的 useContext（实得 ' + JSON.stringify(bandage && bandage.useContext) + '）——改前这里是 undefined');
function doubledAssignments(src) {
    const map = {};
    src.split('\n').forEach(line => {
        const m = line.match(/^\s*window\.([A-Za-z_$][\w$]*)\s*=\s*\[/);
        if (m) (map[m[1]] = map[m[1]] || []).push(1);
    });
    return Object.keys(map).filter(k => map[k].length > 1);
}
// 自证支：这把尺不是哑的——拿一份假的两次赋值喂它，它得报出来
ok(doubledAssignments("window.foo = [1];\nwindow.bar = [2];\nwindow.foo = [3];").join() === 'foo',
    'E2 自证·尺自己会响（造一份重复赋值，它报出 foo）');
const doubleHits = [];
for (const f of allJs) {
    const rel = path.relative(ROOT, f).replace(/\\/g, '/');
    for (const k of doubledAssignments(load(rel))) doubleHits.push(rel + ':' + k);
}
ok(doubleHits.length === 0, 'E3 全仓「同一 window 数组整表赋值两次」归零（实得 ' + doubleHits.length + ' 处：' + doubleHits.slice(0, 4).join(' | ') + '）');

// ============ [F] 改前对照：两份全新语境，只差那一刀，同一枚裸格连点三次 ============
console.log('[F] 改前对照（复现病）');
const preSrc = load('js/inventory.js').replace(
    /function _slotRemoveCount\(slot, n\) \{[\s\S]*?\n\}/,
    'function _slotRemoveCount(slot, n) { return slot.removeCount(n); }');
ok(!/typeof slot\.removeCount === 'function'/.test(preSrc.split('function _slotRemoveCount')[1]),
    'F0 自证支：对照版真的被换回了裸调（不是拿改后代码演一遍旧病）');
function loadCtx(invSrc, tag) {
    const c = newCtx();
    const fails = [];
    for (const f of ORDER) {
        try { vm.runInContext(load(f), c.sb, { filename: f }); } catch (e) { fails.push(f + ': ' + e.message); }
    }
    try { vm.runInContext(invSrc, c.sb, { filename: tag }); } catch (e) { fails.push(tag + ': ' + e.message); }
    ok(fails.length === 0, 'F0b 语境「' + tag + '」装载无异常' + (fails.length ? '（' + fails.join(' | ') + '）' : ''));
    c.sb.window.inventory.slots.length = 0;
    for (let i = 0; i < 30; i++) c.sb.window.inventory.slots.push(null);
    c.sb.window.currentCharData = { qi: 0, maxQi: 500, energy: 50, maxEnergy: 100 };
    c.sb.window.timeSystem = { advanceTime() {} };
    return c;
}
// 三个语境各跑三击：改前（裸调）／改后（真文件）——同一把尺、同一枚丹，只换那一刀
function 三连点(ctx, 标签) {
    const bare = mkBare(PILL, 3);
    ctx.sb.window.inventory.slots[0] = bare;
    const 气 = [];
    const 数 = [];
    let 抛 = '';
    for (let k = 0; k < 3; k++) {
        数.push(bare.count);
        try { ctx.sb.window.useItem(bare.uid); } catch (e) { 抛 = e.constructor.name + ': ' + e.message; }
        气.push(ctx.sb.window.currentCharData.qi);
    }
    数.push(bare.count);
    return { 标签, 抛, 气, 数, 还在吗: !!ctx.sb.window.inventory.slots[0] };
}
const 前 = 三连点(loadCtx(preSrc, 'js/inventory.js(pre-fix 对照)'), '改前');
const 后 = 三连点(loadCtx(load('js/inventory.js'), 'js/inventory.js(改后)'), '改后');
console.log('  ' + JSON.stringify(前) + '\n  ' + JSON.stringify(后));
ok(/slot\.removeCount is not a function/.test(前.抛), 'F1 改前：裸格子点「使用」抛的正是「' + 前.抛 + '」');
ok(前.数.every(c => c === 3) && 前.还在吗, 'F2 改前：三击之后 count 一路 3→3→3→3、格子还在（丹没扣，实得 ' + 前.数.join('→') + '）');
ok(前.气[0] > 0 && 前.气[1] > 前.气[0] && 前.气[2] > 前.气[1],
    'F3 改前：真气却连点连涨（' + 前.气.join('→') + '）⇒「一枚丹吃不完」是行为层实测，不是读码推测');
ok(后.抛 === '' && 后.数.join('→') === '3→2→1→0' && !后.还在吗,
    'F4 改后（同一把尺对照）：同一条路不抛错、count 3→2→1→0、最后一击腾空（实得 ' + 后.数.join('→') + '，抛错「' + (后.抛 || '无') + '」）');
ok(后.气[0] > 0 && 后.气[1] > 后.气[0] && 后.气[2] > 后.气[1],
    'F5 改后：三击照样次次涨气（' + 后.气.join('→') + '）⇒ 本批只动了「扣不扣」，药效一个字没改（两段的绝对值不可比——恢复量本身带随机，改前那一趟还是白赚三次）');

console.log('\n========== 第一百二十二批 · 裸格子扣数那一刀 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
