#!/usr/bin/env node
/**
 * 第一百二十三批 · NEW-73 结案：灵石这本账在守卫前「压根不存在」（DES-71 这个号已被躯体图那条占了）
 * 病：全仓 `window.DataManager` 字面命中 85 处／20 本（31 行为纯裸名调用、27 行是守卫那一形），写的都是 `window.DataManager && window.DataManager.deductSpiritStones(n)`，
 *     可这层统一访问器只挂在 window.XianXia.DataManager 上（js/global-utils.js:294），
 *     `window.DataManager` 从来没人定义 ⇒ 那一串 `&&` 恒假：
 *       · 该收费的**一律放行**（延医 200／自创丹方 50／占卜／灵脉认领／拜师／入门 10／婚配…），
 *         而屏上回执照念「灵石-200」——说的是假话；
 *       · 该发钱的**一律落空**（悬赏赏金／宿敌终战 200／子嗣每日孝敬／灵脉收益／ karma 回礼…），
 *         而屏上照念「+50」——也是假话；
 *       · 读钱的那几处（法阵／门派据点 UI／randomMap 劫道）恒读到 0 或走兜底假账。
 * 改：global-utils.js 里访问层定义完之后补一行别名 `window.DataManager = window.XianXia.DataManager;`
 *     （用的三个方法 get/add/deductSpiritStones 本对象全有，指同一对象而非副本，两本账不会分叉）
 * 手法：真文件 vm 装载 js/global-utils.js，现场拿钱袋跑行为；另附三条棘轮
 *      （别名唯一／用到的方法名必须真在对象上／定义点只许一处）与一支自证支（摘掉别名后守卫确实放行，
 *       证明本套件不是在空转——仓里 wave 套件多是源码文本匹配，那条口径这里不用）。
 * 运行：node tests/wave123-wallet-alias-node.js
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
function walk(dir, out) {
    out = out || [];
    for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        const st = fs.statSync(full);
        if (st.isDirectory()) { if (name !== 'node_modules' && name !== '.git') walk(full, out); }
        else if (/\.js$/.test(name)) out.push(full);
    }
    return out;
}

// ============ 装载：真 global-utils.js ============
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
    performance: { now: () => 0 }
};
sb.window = sb;
sb.globalThis = sb;
sb.document = {
    getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
    createElement: () => ({ style: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, dataset: {}, appendChild() {}, remove() {}, setAttribute() {}, addEventListener() {} }),
    createTextNode: () => ({}), addEventListener() {}, removeEventListener() {},
    body: { appendChild() {}, removeChild() {} }, head: {}, documentElement: {}, readyState: 'loading', activeElement: null
};
vm.createContext(sb);
let loadErr = null;
try { vm.runInContext(load('js/global-utils.js'), sb, { filename: 'js/global-utils.js' }); }
catch (e) { loadErr = e; }
ok(!loadErr, '⓪ 真 js/global-utils.js 装载无异常' + (loadErr ? '（' + loadErr.message + '）' : ''));

const W = sb.window;
const DM = W.XianXia && W.XianXia.DataManager;
ok(!!DM, '⓪b 统一数据访问层确在 window.XianXia.DataManager');

// 钱袋：本仓唯一权威账本是 inventory.currency（global-utils 的 installWalletMirror 也认它）
function 设灵石(n) { W.inventory = { currency: { spiritStones: n, copper: 0 } }; }

// ============ A 别名在册，且是同一个对象 ============
console.log('\n[A] 别名在册');
ok(typeof W.DataManager === 'object' && W.DataManager !== null, 'A1 window.DataManager 如今真存在（改前恒 undefined，这就是那些死线的根）');
ok(W.DataManager === DM, 'A2 别名指的就是那一份访问器（同一对象，不是抄一份——两本账不会分叉）');

// ============ B 三条路真动钱 ============
console.log('\n[B] 真动钱袋');
设灵石(1000);
ok(W.DataManager.getSpiritStones() === 1000, 'B1 读钱读的是真账（getSpiritStones）');
W.DataManager.addSpiritStones(50);
ok(W.inventory.currency.spiritStones === 1050, 'B2 发钱真入袋：+50 后账上 1050（改前悬赏／宿敌／孝敬那批全走这条路，钱从来没到过）');
const 扣成了 = W.DataManager.deductSpiritStones(200);
ok(扣成了 === true && W.inventory.currency.spiritStones === 850, 'B3 收钱真扣：延医那笔 200 如今扣得动（改前这条守卫直接放行）');
设灵石(30);
ok(W.DataManager.deductSpiritStones(200) === false && W.inventory.currency.spiritStones === 30, 'B4 手头不足时返回假且分文不动（门槛活了，不是把玩家账扣成负数）');

// NEW-73 文档里那条次生风险：补上别名之后，sect-disciple-life.js:68-70 那种「手工把两个钱包一起镜像」
// 的兜底支就不再执行了（第一跳如今活的）。这一族能不能安全收口，取决于访问器自己有没有双写——
// 这一条就是那枚闸：谁把 setSpiritStones 改成只写一个钱包，这里立刻转红。
设灵石(1000);
W.currentCharData = { spiritStones: 7, copper: 0 };
W.DataManager.addSpiritStones(50);
ok(W.inventory.currency.spiritStones === 1050 && W.currentCharData.spiritStones === 1050,
    'B5 双写：加钱同时落到 inventory.currency 与 currentCharData 两本账（别名复活后不再有人手工镜像，就靠它）');
ok(W.DataManager.deductSpiritStones(50) === true && W.inventory.currency.spiritStones === 1000
    && W.currentCharData.spiritStones === 1000, 'B6 双写：扣钱也两本一起动（不然 HUD 那侧会读到旧数）');

// ============ C 自证支：摘掉别名，守卫确实放行（证明上面几条不是空转） ============
console.log('\n[C] 自证支：改前行为复现');
设灵石(1000);
const 守卫式 = function (成本) {
    // 与 js/crafting/pill-poison.js:122 同形：`window.DataManager && deductSpiritStones(n)` 挡不住就往下走
    let 拦住 = false;
    if (W.DataManager && W.DataManager.deductSpiritStones && !W.DataManager.deductSpiritStones(成本)) 拦住 = true;
    return 拦住;
};
ok(守卫式(200) === false && W.inventory.currency.spiritStones === 800, 'C1 有别名时：付得起就放行、且钱真扣了 200');
const 临时摘掉 = W.DataManager;
delete W.DataManager;                       // 回到改前现场
设灵石(1000);
ok(守卫式(200) === false && W.inventory.currency.spiritStones === 1000,
    'C2 摘掉别名（＝改前）：同一条守卫放行、**灵石分文未动**——屏上却念「灵石-200」，这就是那处假话');
设灵石(0);
ok(守卫式(200) === false, 'C3 改前连「手头不足」都拦不住：灵石 0 也照样放行（白拿效果）');
W.DataManager = 临时摘掉;
设灵石(1000);
ok(守卫式(200) === false && W.inventory.currency.spiritStones === 800, 'C4 装回去后又动钱了（本支只验别名与行为之差，不留残留）');
设灵石(0);
ok(守卫式(200) === true && W.inventory.currency.spiritStones === 0, 'C5 灵石 0 时如今拦得住（付不起就别想白拿）');

// ============ D 棘轮：用到的方法名必须真在对象上 ============
console.log('\n[D] 棘轮：别再用对象上没有的方法');
const files = walk(path.join(ROOT, 'js'));
const 用法 = new Map();          // 方法名 → [文件:行]
const 死线点 = [];               // 全部 window.DataManager 守卫命中处
const 定义点 = [];
for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    const rel = path.relative(ROOT, f).replace(/\\/g, '/');
    src.split('\n').forEach((line, i) => {
        if (/(window|W|global|self)\.DataManager\s*=[^=]/.test(line)) 定义点.push(rel + ':' + (i + 1));
        if (/(?:window|W|global|self)\.DataManager/.test(line)) 死线点.push(rel + ':' + (i + 1));
        const m = line.match(/(?:window|W|global|self)\.DataManager\.([a-zA-Z_$][\w$]*)/g);
        if (!m) return;
        m.forEach(x => {
            const name = x.split('.').pop();
            if (!用法.has(name)) 用法.set(name, []);
            用法.get(name).push(rel + ':' + (i + 1));
        });
    });
}
const 用到的 = [...用法.keys()].sort();
const 对象上有 = ['getSpiritStones', 'setSpiritStones', 'addSpiritStones', 'deductSpiritStones',
    'getCopper', 'setCopper', 'addCopper', 'deductCopper', 'getCharAttr', 'getRealm', 'syncAll'];
const 不在册 = 用到的.filter(n => typeof DM[n] !== 'function' && 对象上有.indexOf(n) < 0);
ok(不在册.length === 0, 'D1 全仓挂在 window.DataManager 上被调的方法名，如今一个不落都真存在（用到：' + 用到的.join('／') + '；查无：' + (不在册.join('／') || '无') + '）');
ok(定义点.length === 1 && /global-utils\.js:\d+$/.test(定义点[0]),
    'D2 定义点全仓只许一处（防止第二份实现把别名盖掉）：实得 ' + 定义点.join('、'));
ok(死线点.length >= 40, 'D3 自证规模：这一族确有 ' + new Set(死线点).size + ' 处命中（下面报按文件计）');
const 按文件 = new Map();
[...new Set(死线点)].forEach(s => { const f = s.split(':')[0]; 按文件.set(f, (按文件.get(f) || 0) + 1); });
console.log('[口径] 命中 ' + 按文件.size + ' 份文件／' + new Set(死线点).size + ' 处：' +
    [...按文件.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([f, n]) => f + '×' + n).join('、') +
    (按文件.size > 12 ? '…' : ''));

// ============ E 立案哨兵（结案时转红） ============
console.log('\n[E] 立案哨兵');
const 覆写命名空间 = [];
for (const f of files) {
    const rel = path.relative(ROOT, f).replace(/\\/g, '/');
    fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
        if (/window\.XianXia\s*=\s*\{/.test(line) && rel !== 'js/global-utils.js') 覆写命名空间.push(rel + ':' + (i + 1));
    });
}
ok(覆写命名空间.length === 0, 'E1 没有别处整包覆写 window.XianXia（那样会把挂在它上面的 DataManager 抹掉，别名随之变孤儿）：实得 ' + (覆写命名空间.join('、') || '无'));
ok(/window\.DataManager\s*=\s*window\.XianXia\.DataManager/.test(load('js/global-utils.js')),
    'E2 别名钉在访问层定义之后（加载序：本文件是静态 <script>，早于所有调用点）');

console.log('\n========== 第一百二十三批 · NEW-73 灵石账的线头 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
