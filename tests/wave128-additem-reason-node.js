// 第一百二十八批 · DES-90：把「没入袋」的两条原因拆开——行囊已满 ／ 这件东西压根没定义
// 病根（第一百二十七批第 15 条⑦登记）：js/inventory.js 的 addItem 在「模板不存在」时 console.warn 后 `return false`，
//   与「行囊满」返回 0 在真值上同形。于是第八十二～一百二十七批改出来的那一大批「行囊塞不下／一件也没能带走」，
//   会把「物品表上查无此号」也一并怪给玩家的格子（DES-87 那三条毒正是靠这条同形才被读出来的）。
// 改：addItem 另记一本原因账 window.addItemFailReason（'no_template' | 'bag_full' | null），
//     并导出公共说话手 window.addItemFailText(名字)；奇遇扩展表的 xGive 接上它。
// 手法：真物品链＋真 js/inventory.js 装进 vm 真调（同第一百二十一批口径）；xGive 从源码切出后真调；
//      另附全仓形状棘轮与一枚单点翻转的改前复现。
// ⚠ 本批真 Chrome 屏证 0 条：下面每句读的都是假 DOM 里的返回值与上屏字符串。
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');

let 通过 = 0, 失败 = 0;
function ok(cond, msg) {
    if (cond) { 通过++; console.log('  ✓ ' + msg); }
    else { 失败++; console.log('  [FAIL] ' + msg); }
}
function load(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// —— 从大文件里按花括号配平切出私有函数（xGive 在 IIFE 内，没有导出口）
function 跳串(src, i) {
    const q = src[i]; i++;
    while (i < src.length) {
        if (src[i] === '\\') { i += 2; continue; }
        if (src[i] === q) return i;
        i++;
    }
    return i;
}
function 切函数(src, 头) {
    const i = src.indexOf(头);
    if (i < 0) throw new Error('切函数失败：找不到「' + 头 + '」——源码形状变了，套件该跟着改');
    let k = src.indexOf('{', i), depth = 0;
    for (; k < src.length; k++) {
        const ch = src[k];
        if (ch === '"' || ch === "'" || ch === '`') { k = 跳串(src, k); continue; }
        if (ch === '/' && src[k + 1] === '/') { k = src.indexOf('\n', k) - 1; continue; }
        if (ch === '{') depth++;
        else if (ch === '}') { depth--; if (depth === 0) break; }
    }
    return src.slice(i, k + 1);
}

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

function makeNode() {
    return {
        style: { setProperty() {}, removeProperty() {} },
        classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
        dataset: {}, children: [], childNodes: [], attrs: {},
        appendChild(c) { this.children.push(c); return c; },
        removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c; },
        setAttribute(k, v) { this.attrs[k] = String(v); },
        getAttribute(k) { return this.attrs[k] === undefined ? null : this.attrs[k]; },
        addEventListener() {}, removeEventListener() {}, dispatchEvent() {},
        closest() { return null; }, querySelector() { return null; }, querySelectorAll() { return []; },
        focus() {}, blur() {}, click() {}, remove() {}, insertBefore(c) { this.children.push(c); return c; },
        getBoundingClientRect() { return { top: 0, left: 0, width: 1, height: 1, bottom: 1, right: 1 }; },
        scrollIntoView() {}, offsetHeight: 1, offsetWidth: 1, parentNode: null,
        textContent: '', innerHTML: '', value: ''
    };
}

// 装一只真背包。背包源码可替换（用来做改前复现）；顺带把 xGive 从真表源码里切出来真调。
function 装沙箱(背包源码) {
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
    sb.window = sb; sb.globalThis = sb;
    sb.document = {
        getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
        createElement: () => makeNode(), createTextNode: () => makeNode(),
        createElementNS: () => makeNode(), addEventListener() {}, removeEventListener() {},
        body: makeNode(), head: makeNode(), documentElement: makeNode(), readyState: 'loading',
        activeElement: null
    };
    vm.createContext(sb);
    sb._fails = [];
    for (const f of ORDER) {
        try { vm.runInContext(load(f), sb, { filename: f }); } catch (e) { sb._fails.push(f + ': ' + e.message); }
    }
    try { vm.runInContext(背包源码 || load('js/inventory.js'), sb, { filename: 'js/inventory.js' }); }
    catch (e) { sb._fails.push('js/inventory.js: ' + e.message); }
    sb._msgs = msgs;
    // xGive：真表里那一支私有的发货手（接的就是真 addItem）
    try {
        const 源 = load('js/items-extended/11-event-extensions.js');
        const 体 = 切函数(源, 'function xGive(msg, tone, id, cnt) {');
        vm.runInContext('window.__xGive = (' + 体 + ');', sb, { filename: 'xGive' });
    } catch (e) { sb._fails.push('xGive: ' + e.message); }
    return sb;
}

// 现场装包：把行囊灌成「只剩 N 格」
function 装包(sb, 留空格) {
    const inv = sb.window.inventory;
    inv.slots.length = 0;
    for (let i = 0; i < inv.maxSlots; i++) {
        inv.slots.push(i < 留空格 ? null : { uid: 'full_' + i, templateId: 'no_such_template_zzz', name: '占位', count: 1, icon: '·' });
    }
    sb._msgs.length = 0;
}

const W = 装沙箱();
ok(W._fails.length === 0, '⓪ 真物品链＋真背包脚本＋xGive 装载无异常' + (W._fails.length ? '（' + W._fails.join(' | ') + '）' : ''));
const R = W.window.itemById || {};
ok(Object.keys(R).length >= 400, '⓪b 物品表规模 ≥400（实得 ' + Object.keys(R).length + '，与第一百二十一批同口径）');
const 有主 = R['iron_sword'] ? 'iron_sword' : Object.keys(R)[0];
const 无主 = 'no_such_template_zzz';
ok(!!R[有主] && !R[无主], '⓪c 自证支：「' + 有主 + '」在表里、「' + 无主 + '」在表里查无此物（两支的对照才成立）');
ok(typeof W.window.addItemFailText === 'function', '⓪d 新的公共说话手 window.addItemFailText 已从 js/inventory.js 导出');
ok(typeof W.__xGive === 'function' || typeof W.window.__xGive === 'function', '⓪e xGive 从真表源码里切出并装进了沙箱');

// ============ A 通道本身：两本原因账分得开吗 ============
{
    const win = W.window;
    const 取因 = () => win.addItemFailReason;

    // A1 满包（真物品、格子全占）
    装包(W, 0);
    const a1 = win.addItem(有主, 1);
    ok(Number(a1) === 0 && 取因() === 'bag_full', 'A1 满包收不下：返回值 ' + JSON.stringify(a1) + '、原因账 ' + JSON.stringify(取因()));
    ok(win.addItemFailText('铁剑').indexOf('行囊已满') === 0, 'A2 满包那支说的是格子的事：' + JSON.stringify(win.addItemFailText('铁剑')));

    // A3 模板不存在
    装包(W, 5);
    const a3 = win.addItem(无主, 1);
    ok(a3 === false && 取因() === 'no_template', 'A3 查无此物：返回值 ' + JSON.stringify(a3) + '、原因账 ' + JSON.stringify(取因()));
    const 话 = win.addItemFailText('修为丹');
    ok(话.indexOf('查无此号') > 0 && 话.indexOf('行囊已满') < 0 && 话.indexOf('不是你的行囊满了') > 0,
        'A4 这一句不许再怪给行囊：' + JSON.stringify(话));

    // A5 原因账一次调用一清：满包之后紧接查无此物
    装包(W, 0); win.addItem(有主, 1);
    win.addItem(无主, 1);
    ok(取因() === 'no_template', 'A5 上一笔的原因不许留到下一笔（满包 → 查无此物，读数 ' + JSON.stringify(取因()) + '）');

    // A6 成功之后不许留脏账
    装包(W, 5); win.addItem(无主, 1);
    const a6 = win.addItem(有主, 1);
    ok(Number(a6) === 1 && 取因() === null, 'A6 收着了就清账：实收 ' + a6 + '、原因账 ' + JSON.stringify(取因()));

    // A7 部分入袋不许谎称满
    装包(W, 1);
    const 不堆 = Object.keys(R).find(k => !R[k].stackable && R[k]) || 有主;
    const a7 = win.addItem(不堆, 3);
    ok(Number(a7) === 1 && 取因() === null, 'A7 只塞得下一件（' + 不堆 + '）：实收 ' + a7 + '，原因账保持空（' + JSON.stringify(取因()) + '）——半包不是满包');

    // A8 零枚那一支不动账
    装包(W, 5);
    const a8 = win.addItem(有主, 0);
    ok(a8 === true && 取因() === null, 'A8 要 0 件：仍返回 ' + JSON.stringify(a8) + '（旧真值口径没动）、原因账 ' + JSON.stringify(取因()));

    // A9 别名同一条通道
    ok(win.addItemToInventory === win.addItem && win.inventory.addItem === win.addItem,
        'A9 三条入口（window.addItem／addItemToInventory／inventory.addItem）指向同一支，原因账不会各记各的');

    // A10 主语缺省时不念空话
    win.addItem(无主, 1);
    ok(win.addItemFailText('').indexOf('那件东西') === 0, 'A10 不报名字时也有主语：' + JSON.stringify(win.addItemFailText('')));
    装包(W, 5); win.addItem(有主, 1);
    ok(win.addItemFailText('') === '', 'A10b 收着之后再问说话手：空串（不许凭空补一句「行囊已满」，实读 ' + JSON.stringify(win.addItemFailText('')) + '）');
}

// ============ B xGive 真接通道：那 42 处奇遇彩头的说法跟着变了没 ============
{
    const win = W.window;
    const x = win.__xGive;
    const 尾 = () => W._msgs[W._msgs.length - 1];

    W._msgs.length = 0; 装包(W, 5);
    const b1 = x('你捡到一枚铁剑。', 'success', 有主, 1);
    ok(b1 === 1 && 尾().text === '你捡到一枚铁剑。' && 尾().kind === 'success', 'B1 全收下：喜话原样上屏、tone 照旧（' + JSON.stringify(尾().text) + '）');

    装包(W, 0);
    x('你捡到一枚铁剑。', 'success', 有主, 1);
    ok(尾().text.indexOf('一件也没能带走：行囊已满，先腾个格子再来。') > 0 && 尾().kind === 'warning',
        'B2 满包：仍念格子的事（读数 ' + JSON.stringify(尾().text) + '）');

    装包(W, 1);
    const b3 = x('你捡到三枚铁剑。', 'success', 有主, 3);
    ok(b3 === 1 && 尾().text === '你捡到三枚铁剑。——行囊只塞得下 1/3 件，另 2 件没带走。' && 尾().kind === 'warning',
        'B3 半包（只剩一格、要三件）：实收 ' + b3 + '，念的是「塞得下 1/3」而不是「一件也没能带走」（读数 ' + JSON.stringify(尾().text) + '）');

    装包(W, 5);
    x('你捡到一枚修为丹。', 'success', 无主, 1);
    ok(尾().text.indexOf('查无此号') > 0 && 尾().text.indexOf('行囊已满') < 0,
        'B4 关键一案：查无此物时 xGive 不再替行囊背锅（读数 ' + JSON.stringify(尾().text) + '）');
    ok(x('拾取。', 'success', 无主, 1) === 0, 'B5 查无此物仍如实报 0（没顺手把失败改成成功）');

    装包(W, 3); win.addItem = null;
    const b6 = x('你捡到一枚铁剑。', 'success', 有主, 1);
    ok(b6 === 1 && 尾().text === '你捡到一枚铁剑。', 'B6 没有背包通道的世界：照旧按全数认（既有兜底口径没动）');
}

// ============ C 全仓形状棘轮 ============
{
    const 背包源 = load('js/inventory.js');
    const 清 = (背包源.match(/window\.addItemFailReason = null;/g) || []).length;
    const 无 = (背包源.match(/= 'no_template';/g) || []).length;
    const 满 = (背包源.match(/= 'bag_full';/g) || []).length;
    ok(清 === 1 && 无 === 1 && 满 === 1,
        'C1 原因账只有三处落笔（清零 1／查无此物 1／满包 1）：现读 ' + 清 + '/' + 无 + '/' + 满 + '——多一处说明有人在别处私改这本账');

    function walk(dir, out) {
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
            if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
            const p = path.join(dir, e.name);
            if (e.isDirectory()) walk(p, out); else if (e.name.endsWith('.js')) out.push(p);
        }
        return out;
    }
    const 文件 = walk(path.join(ROOT, 'js'), []);
    let 引用 = 0;
    for (const f of 文件) {
        const s = fs.readFileSync(f, 'utf8');
        引用 += (s.match(/addItemFailReason|addItemFailText/g) || []).length;
    }
    ok(引用 >= 6, 'C2 只准增：全仓引用原因账 ' + 引用 + ' 处（通道 3＋说话手 2＋xGive 1 起底）——降回去就是有人把真话又拆了');

    // C3 立案哨兵：全仓那些「自己写死满包句」的点位（没接原因账）——本批只登记数量，只准缩不准涨
    let 裸满包句 = 0, 同行口径 = 0; const 各文件 = {};
    for (const f of 文件) {
        const 行 = fs.readFileSync(f, 'utf8').split('\n');
        // 尺的假阳性①：说话手本体（addItemFailText／addItemReasonText 的定义处）自己就得写着那句回退话，它不是点位
        const 全文 = 行.join('\n');
        const 是本体 = /window\.addItemFailText = function|window\.addItemReasonText = function|window\.addItemFailPhrase = function|window\.addItemReasonPhrase = function/.test(全文);
        let n = 0;
        行.forEach((l, i) => {
            if (!/行囊已满|行囊塞不下|腾不出格子|一件也没能带走/.test(l)) return;
            同行口径++;                                   // 旧口径：只看本行（xGive 那类续行会被误计，仅登记不判定）
            if (是本体) return;                            // 尺的假阳性①：本体的字面就是这句，不计
            if (/^\s*(\/\/|\*|\/\*)/.test(l)) return;      // 尺的假阳性②：注释里复述满包句不算一个上屏点位
            const 邻 = 行.slice(Math.max(0, i - 2), i + 3).join('\n'); // 判定口径：语句常跨两三行，且「问原因账」可能写在上两行
            // 第一百三十五批：中性问因手 addItemReasonText 与 addItemFailText 同账——半包那一族（玩家已收进一部分）问的是它
            if (/addItemFailText|addItemReasonText|addItemFailPhrase|addItemReasonPhrase|addItemFailReason/.test(邻)) return;
            n++;
        });
        裸满包句 += n;
        if (n) 各文件[path.relative(ROOT, f).split(path.sep).join('/')] = n;
    }
    const 分档 = Object.entries(各文件).sort((a, b) => b[1] - a[1]).map(e => e[0] + '×' + e[1]).join('、');
    console.log('[尺口径] C3 两档同报——同行口径 ' + 同行口径 + ' 行（旧尺，含 xGive/openChest 那类「前半句在上行、addItemFailText 拼在下行」的续行假阳性）'
        + '／居中窗口径 ' + 裸满包句 + ' 行（判定用，分布在 ' + Object.keys(各文件).length + ' 本）：' + 分档);
    console.log('[尺口径] C3 这一格是接线换来的、不是放宽口径：第一百三十五批把 56→' + 裸满包句 + '——'
        + '①判定窗认账由「只问 addItemFailText」扩成「问两支持牌手都行」（新增的中性问因手 addItemReasonText 接的是同一本 addItemFailReason 账）；'
        + '②撤掉两类尺的假阳性（js/inventory.js 两支持牌手的定义行本体、纯注释行）——这两类从前虚计 3 行，如今仍旧不计，但门槛按接线后的真数钉死');
    ok(裸满包句 <= 6, 'C3 只准缩：全仓还有 ' + 裸满包句 + ' 行（分布在 ' + Object.keys(各文件).length + ' 本）自己在写「行囊已满」而不问原因账（＝立案存量，逐点接上后要同步把上界改小；回退句不算裸句）');

    ok(/window\.addItemFailText === 'function'/.test(load('js/items-extended/11-event-extensions.js')),
        'C4 xGive 那一句确实先问过说话手（源码里有 typeof 守卫，无通道世界不炸）');
}

// ============ D 单点翻转的改前复现（沙箱内，不是玩家屏幕现场）============
{
    const 原 = load('js/inventory.js');
    const 旧 = "window.addItemFailReason = 'no_template';";
    if (原.indexOf(旧) < 0) throw new Error('改前复现：找不到「' + 旧 + '」——那一行的形状变了');
    const 拆掉 = 原.replace(旧, ';');
    const W2 = 装沙箱(拆掉);
    ok(W2._fails.length === 0, 'D0 把这一枚标记拆掉后仍能装载（复现不靠额外的桩）');
    装包(W2, 5);
    const 收 = W2.window.addItem('no_such_template_zzz', 1);
    const 话 = W2.window.addItemFailText('修为丹');
    ok(收 === false && 话 === '', 'D1 拆掉标记：返回值仍是 false（同形没被本批以外的东西改掉），说话手只能给空串（读数 ' + JSON.stringify(话) + '）');
    const x = W2.window.__xGive;
    x('你捡到一枚修为丹。', 'success', 'no_such_template_zzz', 1);
    const 尾 = W2._msgs[W2._msgs.length - 1];
    // 第一百三十九批把这一族的回退字面中性化了：问不到账时念的是②形「它没有跟你走。」，
    // 于是「拆掉原因账就退化成满包句」这条路**当场不存在了**——本钉由「复现旧谎」翻成「旧谎再也复现不出来」。
    // 旧值「这一笔没落进账，缘由不好乱猜」→ 新值「它没有跟你走。」（词表②）。
    // 反向钉（不含『行囊已满』）原样保留，一字未松：拆掉原因账后 xGive 仍不许把查无此物念成满包。
    ok(尾.text.indexOf('行囊已满') < 0 && 尾.text.indexOf('它没有跟你走。') > 0,
        'D2 反向自证（沙箱）：拆掉那本原因账之后，xGive 也不许再把查无此物念成「行囊已满」（第一百三十九批堵死）——' + JSON.stringify(尾.text));
    ok(尾.text.indexOf('查无此号') < 0, 'D3 反向自证：这一屏里没有任何一句说到「查无此号」，正是本批要补的那句话');
}

console.log('\n=== 第一百二十八批套件：通过 ' + 通过 + ' / 失败 ' + 失败 + ' ===');
process.exit(失败 ? 1 : 0);
