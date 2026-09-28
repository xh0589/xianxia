#!/usr/bin/env node
/**
 * 第一百二十一批 · DES-65：行囊里「来历不明的一格」
 * 病：物品表上查无此物的格子（旧档遗留，以及第一百二十波之前坊市虚标货由兜底分支手写进 slots 的死格子）
 *   ① 被筛子丢掉（matchesInventoryFilter(null)=false）、被渲染跳过（if (!template) continue），
 *      却仍被 _invUsedSlots 计进容量 ⇒ 屏上「30 格中已用 8」而只有 7 张卡，那一格看不见；
 *   ② 背包八扇正门（使用／开菜单／装备对比／标记数量窗／标记出售／取消标记／丢弃／批量标记）
 *      裸调 slot.getTemplate()——历史**裸格子**（plain 对象，根本没有这个方法）点一下直接 TypeError；
 *   ③ 唯一的出口 showDiscardConfirm 也在 `if (!template) return` 处死掉 ⇒ 用不了、卖不掉、又丢不掉，永久占一格。
 * 改：读模板统一走 _slotTemplate（背包早就为这件事写过这把尺）；「全部」那一档如实带出死格子；
 *     渲染画一枚诚实的格子（❓＋残留名字＋「物品表上查无此物」）并把丢弃挂在点击上；
 *     丢弃不再要求认识它；使用／标记出售给真回执而不是静默或抛错。
 * 手法：真文件 vm 装载（items 链 → js/inventory.js），现场造三种格子（真实例／裸格子但模板在／死格子）跑行为；
 *      另附全仓源码棘轮（裸调 getTemplate 归零）与三枚立案哨兵（DES-64/66/展示名反推）。
 * 运行：node tests/wave121-dead-slot-node.js
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

const msgs = [];
const confirms = [];
let confirmAnswer = true;
const sb = {
    console: { log() {}, warn() {}, error() {} },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    requestAnimationFrame: () => 0,
    navigator: { userAgent: 'node', maxTouchPoints: 0 },
    location: { href: 'file:///xianxia.html', search: '' },
    matchMedia: () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {} }),
    alert() {}, prompt: () => null,
    confirm: (t) => { confirms.push(t); return confirmAnswer; },
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
ok(Object.keys(R).length >= 400, '⓪ 物品表规模 ≥400（实得 ' + Object.keys(R).length + '）');
console.log('[尺口径] 本套件装载序 ' + ORDER.length + ' 份物品文件，实读 itemById=' + Object.keys(R).length + ' 枚（全库并集口径 711 见第一百二十批，别混用）');
const REAL = R['iron_sword'] ? 'iron_sword' : (Object.keys(R)[0]);
ok(!!R[REAL], '⓪c 自证支：尺读到的「' + REAL + '」来自仓库真物品表（' + (R[REAL] && R[REAL].name) + '），不是自带抄件');
ok(!R['exp_pill'] && !R['beast_core'], '⓪d 自证支：exp_pill／beast_core 在真表里确实查无此物（拿它们当死格子的模板才成立）');
ok(typeof sb.window._slotTemplate === 'function', '⓪e 那把统一的尺已导出到 window（商铺要用它）');
ok(typeof sb.window.getFilteredSlots === 'function' && typeof sb.window.showDiscardConfirm === 'function',
    '⓪f 被测函数确从真背包脚本导出（getFilteredSlots／showDiscardConfirm）');

// ============ 现场造三种格子 ============
const slots = sb.window.inventory.slots;
function resetBag(extra) {
    slots.length = 0;
    for (let i = 0; i < sb.window.inventory.maxSlots; i++) slots.push(null);
    slots[0] = extra.instance;
    slots[1] = extra.bare;
    slots[2] = extra.dead;
    sb.window.inventory.filter = 'all';
    sb.window.inventory.searchQuery = '';
    sb.window.inventory.qualityFilter = 'all';
    sb.window.inventory.sortBy = 'count_desc';
    msgs.length = 0; confirms.length = 0;
}
const fixture = {
    instance: null,   // 正常：ItemInstance，模板在表
    bare: null,       // 历史裸格子：plain 对象、没有 getTemplate，但模板在表
    dead: null        // 死格子：plain 对象，模板查无此物（第一百二十波之前坊市虚标货写的那种）
};
function buildFixture() {
    sb.window.addItem(REAL, 1);                       // 真物品：走真 addItem，拿到真 ItemInstance
    fixture.instance = slots.find(s => s && typeof s.getTemplate === 'function');
    fixture.bare = { uid: 'bare_ok', templateId: REAL, name: R[REAL].name, count: 2, icon: '🗡' };
    fixture.dead = { uid: 'dead_1', templateId: 'exp_pill', name: '修为丹', count: 1, icon: '🧪' };
    slots[0] = fixture.instance;
    slots[1] = fixture.bare;
    slots[2] = fixture.dead;
}
resetBag(fixture);
buildFixture();
ok(!!fixture.instance && typeof fixture.instance.getTemplate === 'function', '⓪g 真实例格子造出来了');
ok(fixture.bare && typeof fixture.bare.getTemplate === 'undefined',
    '⓪h 自证支：裸格子真的**没有** getTemplate 这个方法（否则「TypeError」那几条全是空转）');

// ============ A 读模板统一走一把尺 ============
console.log('\n[A] 尺统一');
const _st = sb.window._slotTemplate;
ok(_st(fixture.instance) && _st(fixture.instance).id === REAL, 'A1 真实例：_slotTemplate 认得');
ok(_st(fixture.bare) && _st(fixture.bare).id === REAL, 'A2 裸格子（模板在表）：_slotTemplate 也能如实回查——这正是它存在的理由');
let threw = null;
try { ok(_st(fixture.dead) === null, 'A3 死格子：_slotTemplate 返回 null 而不是抛错'); } catch (e) { threw = e; }
ok(!threw, 'A3b 上一步没抛异常' + (threw ? '（' + threw.message + '）' : ''));

function rawGetTemplateCount(rel) {
    const src = load(rel);
    let hits = 0;
    src.split('\n').forEach(line => {
        if (!/\.getTemplate\(\)/.test(line)) return;
        if (/this\.getTemplate\(\)/.test(line)) return;                     // 类自己读自己的方法，不是裸格子
        if (/typeof\s+\w+\.getTemplate\s*===/.test(line)) return;         // 守卫过的
        if (/slot\.getTemplate\s*&&/.test(line)) return;                   // 短路过的
        if (/try\s*{[\s\S]*?\.getTemplate\(\)/.test(line) || /catch\s*\(/.test(line)) return; // 兜在 try 里的
        if (/function _slotTemplate/.test(line)) return;
        if (/_slotTemplate/.test(line)) return;
        hits++;
    });
    return hits;
}
ok(rawGetTemplateCount('js/inventory.js') === 0, 'A4 棘轮：背包脚本里从格子上裸取模板的调用归零（实得 ' + rawGetTemplateCount('js/inventory.js') + '）');
ok(rawGetTemplateCount('js/enhanced-shop.js') === 0, 'A5 棘轮：商铺回购不再裸调 slot.getTemplate（实得 ' + rawGetTemplateCount('js/enhanced-shop.js') + '）');

// ============ B 那一格不再隐形 ============
console.log('\n[B] 隐形 → 如实带出');
resetBag(fixture); buildFixture();
let vis = sb.window.getFilteredSlots();
const used = slots.filter(s => !!s).length;
ok(vis.some(s => s && s.uid === 'dead_1'), 'B1 「全部」那一档现在看得见死格子（改前它被筛子丢掉、被渲染跳过）');
ok(vis.length === used, 'B2 计数与屏面相符：已用 ' + used + ' 格 ＝ 实卡 ' + vis.length + ' 张（改前 8 vs 7 那一类撒谎不再可能）');
sb.window.inventory.filter = 'weapon';
vis = sb.window.getFilteredSlots();
ok(!vis.some(s => s && s.uid === 'dead_1'), 'B3 死格子不混进「武器」筛（它没有模板字段，混进去就是撒谎）');
sb.window.inventory.filter = 'all';
sb.window.inventory.searchQuery = R[REAL].name.slice(0, 2);
vis = sb.window.getFilteredSlots();
ok(!vis.some(s => s && s.uid === 'dead_1'), 'B4 搜索时也不混带（只在「全部」那一档露相）');
sb.window.inventory.searchQuery = '';
vis = sb.window.getFilteredSlots();
ok(vis.some(s => s && s.uid === 'dead_1') && vis[vis.length - 1].uid === 'dead_1',
    'B5 自紧闸：清掉筛选后死格子回到末位，真物品的排序照旧在前（没把正常账搅乱）');

// ============ C 丢弃那一扇门真的开 ============
console.log('\n[C] 出口：丢弃');
resetBag(fixture); buildFixture();
confirmAnswer = true;
sb.window.showDiscardConfirm('dead_1');
ok(slots[2] === null, 'C1 死格子真被丢掉（改前这一行 `if (!template) return` 直接死掉，永远占一格）');
ok(confirms.length === 1 && confirms[0].indexOf('物品表上查无此物') >= 0,
    'C2 确认框讲的是实情：' + JSON.stringify(confirms[0] || ''));
ok(confirms.length === 1 && confirms[0].indexOf('修为丹') >= 0, 'C3 名字用格子上残留的那本（没名字才说「来历不明」）');

resetBag(fixture); buildFixture();
confirmAnswer = false;
sb.window.showDiscardConfirm('dead_1');
ok(!!slots[2], 'C4 自紧闸：玩家点「取消」就不许丢——不擅自动行囊');
confirmAnswer = true;
resetBag(fixture); buildFixture();
const realUid = fixture.instance.uid;
sb.window.showDiscardConfirm(realUid);
ok(slots.indexOf(fixture.instance) < 0 || slots[0] === null, 'C5 真物品丢弃路径未动（确认即清格）');

// ============ D 四扇正门：不抛错＋给真回执 ============
console.log('\n[D] 正门不抛错、给真回执');
function noThrow(fn) { try { return { r: fn(), e: null }; } catch (e) { return { r: null, e }; } }
msgs.length = 0;
let o = noThrow(() => sb.window.useItem('dead_1'));
ok(!o.e, 'D1 「使用」死格子不再 TypeError' + (o.e ? '（' + o.e.message + '）' : ''));
ok(o.r === false, 'D2 「使用」返回假（没装作成功）');
ok(msgs.some(m => m.text.indexOf('来历不明') >= 0), 'D3 回执讲的是「这一格来历不明」，不是骗人的「背包已满」');

msgs.length = 0;
o = noThrow(() => sb.window.showItemMenu('dead_1'));
ok(!o.e, 'D4 点格子开菜单不再 TypeError（改前历史裸格子在这直接抛，菜单压根开不了）' + (o.e ? '（' + o.e.message + '）' : ''));
ok(msgs.some(m => m.text.indexOf('丢掉') >= 0), 'D5 菜单那一扇至少告诉玩家怎么腾格子');

msgs.length = 0;
o = noThrow(() => sb.window.markForSale('dead_1'));
ok(!o.e && o.r === false, 'D6 标记出售：不抛、返回假');
ok(msgs.some(m => m.text.indexOf('商铺不收') >= 0 || m.text.indexOf('查无此物') >= 0), 'D7 商铺拒收说得出口（改前静默 false＝点了没反应）');

o = noThrow(() => sb.window.showMarkForSaleQuantityDialog('dead_1'));
ok(!o.e, 'D8 数量窗不抛' + (o.e ? '（' + o.e.message + '）' : ''));
o = noThrow(() => sb.window.showEquipmentCompareDialog('dead_1'));
ok(!o.e, 'D9 装备对比窗不抛' + (o.e ? '（' + o.e.message + '）' : ''));
o = noThrow(() => sb.window.unmarkForSale('dead_1'));
ok(!o.e, 'D10 取消标记不抛（它在回执里读名字，裸格子以前会炸在这里）' + (o.e ? '（' + o.e.message + '）' : ''));

// 正常路径自紧闸：裸格子但模板在表里，也必须照样标得上
resetBag(fixture); buildFixture();
msgs.length = 0;
o = noThrow(() => sb.window.markForSale('bare_ok'));
ok(!o.e && o.r === true, 'D11 自紧闸：裸格子只要模板在表，标记出售照旧成功（闸门没把正常买卖一起堵死）');
o = noThrow(() => sb.window.useItem('bare_ok'));
ok(!o.e, 'D12 自紧闸：裸格子的「使用」不抛（非消耗品返回假是正常答复）' + (o.e ? '（' + o.e.message + '）' : ''));

// ============ E 那枚诚实格子长什么样 ============
console.log('\n[E] 诚实格子');
const mk = vm.runInContext('(function(){ return typeof _invUnknownSlot === "function"; })()', sb);
ok(mk === true, 'E0 格子构造函数在册（_invUnknownSlot）');
if (mk) {
    const card = vm.runInContext('_invUnknownSlot({ uid: "x1", templateId: "exp_pill", name: "修为丹", count: 3 })', sb);
    const spans = (card.children || []).map(c => c.textContent);
    ok(String(card.className).indexOf('inv-slot') >= 0, 'E1 复用背包格子那套类（不再另造一种卡）');
    ok(spans.indexOf('❓') >= 0, 'E2 图标如实是 ❓，不是拿残留图标装懂');
    ok(spans.indexOf('修为丹') >= 0, 'E3 名字用格子上残留的那本');
    ok(spans.indexOf('×3') >= 0, 'E4 多件时数量照念');
    ok(String(card.title || card.getAttribute('title') || '').indexOf('物品表上查无此物') >= 0, 'E5 title 说清它是什么、能怎么办');
    const card2 = vm.runInContext('_invUnknownSlot({ uid: "x2", templateId: "mystery_x", count: 1 })', sb);
    ok((card2.children || []).map(c => c.textContent).indexOf('来历不明的一格') >= 0, 'E6 连名字都没有时叫「来历不明的一格」');
    resetBag(fixture); buildFixture();
    confirmAnswer = true;
    sb.globalThis.__probeSlot = slots[2];
    const card3 = vm.runInContext('_invUnknownSlot(__probeSlot)', sb);
    delete sb.globalThis.__probeSlot;
    card3.onclick();
    ok(slots[2] === null, 'E7 点这张卡＝走丢弃确认，真把那一格腾出来');
}

// ============ F 立案哨兵（结案时应当转红） ============
console.log('\n[F] 立案哨兵');
const shopSrc = load('js/enhanced-shop.js');
const deSrc = load('js/core/daily-events.js');
// DES-66 已结案（第一百三十批）：_deAddItem 改认实收、返回 {got,count,name}——原来的立案哨兵按自订规矩撤掉，换成正向钉
ok(/function _deAddItem\([\s\S]{0,600}?Number\(window\.addItem\(id, count\)\)/.test(deSrc)
    && !/_deAddItem[\s\S]{0,220}window\.addItem\(id, count\);\s*return true;/.test(deSrc),
    'F1 DES-66 已结案：每日事件封装认实收数（旧「不看返回值一律 return true」不许回来）');
ok(/addOk = window\.addItem\(item\.templateId, item\.quantity\);[\s\S]{0,160}if \(!addOk\)/.test(shopSrc),
    'F2 DES-64 立案中：回购那笔仍只问「有没有加进去」——部分入袋也当真成功（只进 1 件也照收全款）。收口后转红');
ok(!/addOk\s*[<>]|addOk\s*[!=]==\s*item\.quantity/.test(shopSrc),
    'F2b DES-64 立案中：整条回购链上没有任何一处拿实收件数和 item.quantity 比过。谁开始认数，这里转红');
const appSrc = load('js/app.js');
ok(/function interactBuilding\(name\)[\s\S]{0,80}includes\('遗迹'\)/.test(appSrc),
    'F3 展示名反推在册：地标按名字里那两个字决定开秘境／修炼／商人（待裁决）。收口后转红');
ok(/name\.includes\('首领'\)/.test(load('js/loot-system.js')),
    'F4 展示名反推在册：掉落表按中文名认敌手种类（待裁决）。收口后转红');

console.log('\n========== 第一百二十一批 · 行囊里来历不明的那一格 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
