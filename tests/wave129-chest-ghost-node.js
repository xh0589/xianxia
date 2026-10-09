// 第一百二十九批 · DES-91：宝箱掷出「百宝册上查无此号」的那一枚 ＋ 开完箱不报账
// 勘查（本批先做，结论写进 FIX_NOTES）：全仓可达奖励池 6 张、逐枚 360 条引用，真幽灵只有 1 枚
//   —— 'pill_diamond' 在 js/items-extended/09-loot-sources.js 的 CHEST_LOOT.rare 里（全仓仅此一见）。
//   旧 openChest 先掷骰后发奖、且**从不看 addItem 的实收**，也不上任何屏 ⇒ 约 1/15 的稀有宝箱
//   开了只听见事件那句「你找到了宝物！」，行囊里什么也没有（DES-89 报喜先于发货的同族）。
// 修法两刀：① 掷之前把货单对一遍百宝册（真源未就绪时不瞎筛，沿用 js/map/randomMap.js usableNodePool 那道口径），
//   整池虚标就返回 null 不演开箱；② 落袋问实收，把「得了什么×几、灵石几笔」一条念上屏，
//   一件没进时接第一百二十八批的原因账 window.addItemFailText（模板缺失不许怪给行囊）。
// 证据分两档，逐段标出：vm 行为＝真文件装进沙箱真调；读码＝源码形状断言。
// ⚠ 本批真 Chrome 屏证 0 条——下面每句读的都是假 DOM 里的返回值与上屏字符串。
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
function 去注释(src) {
    return src.split('\n').map(line => {
        const i = line.indexOf('//');
        return i >= 0 ? line.slice(0, i) : line;
    }).join('\n');
}

// ============ 沙箱：真物品链 → 真背包 → 真战利品表 ============
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
function 装沙箱(战利品改写) {
    const env = { msgs: [], node: () => ({ style: { setProperty() {}, removeProperty() {} }, classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, dataset: {}, children: [], appendChild(c) { this.children.push(c); return c; }, removeChild() {}, setAttribute() {}, getAttribute: () => null, addEventListener() {}, removeEventListener() {}, querySelector: () => null, querySelectorAll: () => [], closest: () => null, focus() {}, click() {}, remove() {}, insertBefore(c) { return c; }, getBoundingClientRect: () => ({ top: 0, left: 0, width: 0, height: 0, bottom: 0, right: 0 }), textContent: '', innerHTML: '', value: '' }) };
    const sb = {
        console: { log() {}, warn() {}, error() {} },
        localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
        setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
        requestAnimationFrame: () => 0,
        navigator: { userAgent: 'node', maxTouchPoints: 0 },
        location: { href: 'file:///xianxia.html', search: '' },
        matchMedia: () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {} }),
        alert() {}, prompt: () => null, confirm: () => true,
        performance: { now: () => 0 },
        showMessage: (t, k) => { env.msgs.push({ text: String(t), kind: k }); }
    };
    sb.window = sb; sb.globalThis = sb;
    sb.document = {
        getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
        createElement: () => env.node(), createTextNode: () => env.node(), createElementNS: () => env.node(),
        addEventListener() {}, removeEventListener() {}, body: env.node(), head: env.node(),
        documentElement: env.node(), readyState: 'loading', activeElement: null
    };
    vm.createContext(sb);
    env.loadFails = [];
    for (const f of ORDER) {
        try { vm.runInContext(load(f), sb, { filename: f }); }
        catch (e) { env.loadFails.push(f + ': ' + e.message); }
    }
    try { vm.runInContext(load('js/inventory.js'), sb, { filename: 'js/inventory.js' }); }
    catch (e) { env.loadFails.push('js/inventory.js: ' + e.message); }
    // W-1：宝箱货单与开箱手已从 09-loot-sources.js（已废弃不挂载）迁进 js/loot-system.js，
    //   故「改前复现」要按死的那一刀锚点改到 loot-system.js 上；09 那本仍在同一沙箱里装载
    //   （它还导出 EXTENDED_LOOT_TABLES／WEAPON_SHOP_ITEMS／ARMOR_SHOP_ITEMS，Ⓐ 段要逐枚过池）。
    let lsrc = load('js/loot-system.js');
    if (战利品改写) lsrc = 战利品改写(lsrc);
    try { vm.runInContext(lsrc, sb, { filename: 'js/loot-system.js' }); }
    catch (e) { env.loadFails.push('js/loot-system.js: ' + e.message); }
    try { vm.runInContext(load('js/items-extended/09-loot-sources.js'), sb, { filename: 'js/items-extended/09-loot-sources.js' }); }
    catch (e) { env.loadFails.push('09-loot-sources.js: ' + e.message); }
    env.sb = sb;
    return env;
}
const E = 装沙箱(null);
const sb = E.sb, w = sb.window;

// ============ ⓪ 尺的自证 ============
ok(E.loadFails.length === 0, '⓪ 真物品链＋真背包＋真战利品表装载无异常' + (E.loadFails.length ? '（' + E.loadFails.join(' | ') + '）' : ''));
const LIB = w.itemById || {};
ok(Object.keys(LIB).length >= 400, '⓪ 物品表规模 ≥400（实读 ' + Object.keys(LIB).length + ' 枚；全库并集 711 是第一百二十批那把尺，别混用）');
ok(typeof w.openChest === 'function' && !!w.CHEST_LOOT && !!w.EXTENDED_LOOT_TABLES,
    '⓪ 被测的 openChest／两张池确从真文件导出（不是自带抄件）');
ok(!LIB['pill_diamond'], '⓪c 自证支：\'pill_diamond\' 在真表里确实查无此物（拿它当幽灵本尊才成立）');
ok(!!LIB['pill_big_recovery'] && LIB['pill_big_recovery'].name === '大还丹',
    '⓪d 自证支：尺读到的「大还丹」来自仓库真物品表（js/items-extended/01-pills.js）');
ok(typeof w.addItemFailText === 'function', '⓪e 第一百二十八批那本原因账在场（openChest 要接它）');

// ============ Ⓐ 类审计：六张可达奖励池逐枚对真表 ============
function 扫池(名, v, 路, 账) {
    if (Array.isArray(v)) for (const x of v) {
        if (typeof x === 'string') { 账.n++; if (!LIB[x]) 账.bad.push(路 + ' → ' + x); }
        else if (x && typeof x === 'object' && typeof x.id === 'string' && /^(pill|mat|food|wpn|arm|tal|art|spec|book)_/.test(x.id)) {
            账.n++; if (!LIB[x.id]) 账.bad.push(路 + ' → ' + x.id + '（{id,weight} 形）');
        } else if (x && typeof x === 'object') 扫池(名, x, 路, 账);
    }
    else if (v && typeof v === 'object') for (const k of Object.keys(v)) 扫池(名, v[k], 路 + '/' + k, 账);
}
const 池账 = [];
for (const [名, obj] of [
    ['CHEST_LOOT（三档宝箱货单）', w.CHEST_LOOT],
    ['EXTENDED_LOOT_TABLES（扩展战斗掉落）', w.EXTENDED_LOOT_TABLES],
    ['WEAPON_SHOP_ITEMS（分城武器货单）', w.WEAPON_SHOP_ITEMS],
    ['ARMOR_SHOP_ITEMS（分城防具货单）', w.ARMOR_SHOP_ITEMS],
    ['LOOT_TABLES（loot-system 掉落表）', w.LOOT_TABLES],
    ['GRAD_LOOT_BANDS（loot-system 品阶带）', w.GRAD_LOOT_BANDS]
]) {
    const 账 = { n: 0, bad: [] };
    扫池(名, obj, 名, 账);
    池账.push({ 名, n: 账.n, bad: 账.bad });
    ok(账.bad.length === 0, 'Ⓐ ' + 名 + '：' + 账.n + ' 枚引用零幽灵' + (账.bad.length ? '（' + 账.bad.join(' | ') + '）' : ''));
}
const 池总枚数 = 池账.reduce((s, x) => s + x.n, 0);
ok(池总枚数 >= 300, 'Ⓐ 这把尺看得见 ' + 池总枚数 + ' 枚池内引用（本批勘查基线 360，掉下 300 说明尺瞎了而不是池干净了）');
console.log('[尺口径] Ⓐ 六张池逐张：' + 池账.map(x => x.名.split('（')[0] + ' ' + x.n + ' 枚').join('｜') + '；真表 ' + Object.keys(LIB).length + ' 枚（运行时装载口径，非全库并集 711）');

// debug-panel 的速达表也算一本货单：13 枚按钮 id 必须枚枚在表
(function () {
    const src = 去注释(load('js/debug-panel.js'));
    const m = src.match(/ITEM_QUICK_IDS\s*=\s*\{([\s\S]*?)\};/);
    ok(!!m, 'Ⓐb 调试面板速达表在源码里找得到（形状变了要跟着改尺）');
    if (!m) return;
    const 对 = [];
    for (const p of m[1].matchAll(/'([^']+)'\s*:\s*'([a-z0-9_]+)'/g)) 对.push({ label: p[1], id: p[2] });
    const 空 = 对.filter(x => !LIB[x.id]);
    ok(对.length >= 13, 'Ⓐb 速达表读到 ' + 对.length + ' 枚按钮（≥13 才算尺没瞎）');
    ok(空.length === 0, 'Ⓐb 速达表零幽灵：' + (空.length ? 空.map(x => x.label + '→' + x.id).join(' | ') : 对.map(x => x.id).join('、').slice(0, 40) + '…'));
    const 大还 = 对.find(x => /大还丹/.test(x.label)), 洗髓 = 对.find(x => /洗髓丹/.test(x.label));
    ok(!!(大还 && 大还.id === 'pill_big_recovery'), 'Ⓐc 「大还丹」那枚按钮发的是真在表里的 pill_big_recovery（原写 pill_great_recovery，全仓无此号）');
    ok(!!(洗髓 && 洗髓.id === 'pill_marrow_wash'), 'Ⓐd 「洗髓丹」那枚按钮发的是真在表里的 pill_marrow_wash（原写 pill_marrow_cleansing）');
})();

// ============ Ⓑ 全仓发奖调用字面量：零幽灵（棘轮，只准 0） ============
(function () {
    const files = [];
    (function walk(d) {
        for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
            const p = d + '/' + e.name;
            if (e.isDirectory()) walk(p); else if (e.name.endsWith('.js')) files.push(p);
        }
    })('js');
    const 自注册 = Object.create(null);   // 运行期自己写进 itemById 的（炼器成品那类），不算幽灵
    const 声明 = Object.create(null);     // 任何文件里 id: 'x' 声明过的，交由装载链/自注册覆盖判断
    const RE_GRANT = [
        // giveWithReceipt 也在册：第一百二十七批起一批发奖点改走这只公共说话手，漏读它 Ⓑ 的读数会从 101 掉到 51（补口径，不是降门槛）
        /\b(?:window\.|global\.)?(?:addItem|addItemToInventory|_deAddItem|_addInvItem|giveItem|addResultItem|grantItem|giveWithReceipt)\s*\(\s*'([a-z0-9_]+)'/g,
        // xGive(话术, 语气, 物品id, 件数)：id 在第三个引号里——第一百二十七批把 11-event-extensions 的 42 处改成了这一形，
        // 老尺只咬第一个参数（中文话术）⇒ 那 42 处从「零幽灵」普查里静默溜号
        /\bxGive\s*\(\s*(?:'[^']*'|"[^"]*")\s*,\s*(?:'[^']*'|"[^"]*")\s*,\s*'([a-z0-9_]+)'/g,
        /\binventory\.addItem\s*\(\s*'([a-z0-9_]+)'/g,
        /\.push\s*\(\s*\{\s*templateId:\s*'([a-z0-9_]+)'/g
    ];
    let 命中 = 0, xGive点 = 0, xGive咬中 = 0; const 落空 = [];
    const RE_XGIVE_ALL = /\bxGive\s*\(/g;
    const RE_XGIVE_ID = /\bxGive\s*\(\s*(?:'[^']*'|"[^"]*")\s*,\s*(?:'[^']*'|"[^"]*")\s*,\s*'([a-z0-9_]+)'/g;
    for (const rel of files) {
        const src = 去注释(load(rel));
        for (const m of src.matchAll(/window\.itemById\[\s*'([a-z0-9_]+)'\s*\]\s*=/g)) 自注册[m[1]] = 1;
        for (const m of src.matchAll(/\bid:\s*'([a-z0-9_]+)'/g)) 声明[m[1]] = 1;
        src.split('\n').forEach((ln, i) => {
            xGive点 += (ln.match(RE_XGIVE_ALL) || []).length;
            xGive咬中 += (ln.match(RE_XGIVE_ID) || []).length;
            for (const re of RE_GRANT) {
                re.lastIndex = 0;
                let m;
                while ((m = re.exec(ln))) {
                    命中++;
                    if (!LIB[m[1]] && !自注册[m[1]] && !声明[m[1]]) 落空.push(rel + ':' + (i + 1) + ' → ' + m[1]);
                }
            }
        });
    }
    ok(命中 >= 100, 'Ⓑ 全仓发奖调用的字面量 id 读到 ' + 命中 + ' 处（勘查基线 101）——第一百三十批复核：读数的坑是 xGive 把 id 挪到第三参数（11-event-extensions 42 处整簇溜号），补了位序模式才回账，不是代码把发奖点删了');
    ok(落空.length === 0, 'Ⓑ 发奖字面量零幽灵' + (落空.length ? '（' + 落空.join(' | ') + '）' : ''));
    ok(xGive咬中 === xGive点 - 1,
        'Ⓑc 换形对账：全仓 xGive 调用点 ' + (xGive点 - 1) + ' 枚（另 1 处是 11-event-extensions.js:7 的定义行），按位序咬到 id ' + xGive咬中 +
        ' 枚 ⇒ 一枚不许漏。将来再把发奖点改成别的形制，这条先红，别再让它静默少测 42 处');
})();

// ============ 🲐 openChest 真调：三档箱各开 120 次 ============
function 清包() {
    const inv = w.inventory;
    inv.slots.length = 0;
    for (let i = 0; i < inv.maxSlots; i++) inv.slots.push(null);
    inv.currency.spiritStones = 0;
    E.msgs.length = 0;
}
(function () {
    清包();
    let 上屏 = 0, 石头合计 = 0, 件数不足 = 0, 裸id = 0, 掷出集 = {};
    for (const 档 of ['common', 'rare', 'epic']) {
        for (let i = 0; i < 120; i++) {
            清包();
            const r = w.openChest(档);
            if (!r) { 件数不足++; continue; }
            上屏 += E.msgs.filter(m => /📦/.test(m.text)).length;
            石头合计 += w.inventory.currency.spiritStones;
            if (r.got !== r.count) 件数不足++;
            if (!LIB[r.itemId] || r.itemName !== LIB[r.itemId].name) 裸id++;
            掷出集[r.itemId] = (掷出集[r.itemId] || 0) + 1;
        }
    }
    ok(裸id === 0, '🅐 360 次开箱：掷出的每一枚都在真表里、回执照念真名（裸 id 0 例）');
    ok(件数不足 === 0, '🅐 360 次开箱：空包下实收恒等于要发的件数（差 0 例）');
    ok(上屏 === 360, '🅐 每一次开箱都上一行回执（上屏 ' + 上屏 + '/360）——旧写法 0 行');
    const 样例 = (() => { 清包(); const r = w.openChest('rare'); return { r: r, t: E.msgs.map(m => m.text).join(' ') }; })();
    ok(/📦 开箱得了 .+×\d+，另得灵石 \d+。/.test(样例.t),
        '🅐b 回执形状：「' + 样例.t + '」（念的是实收件数＋灵石笔数）');
    ok(样例.r.got === 样例.r.count && 样例.r.poolSize === w.CHEST_LOOT.rare.items.length,
        '🅐c 返回值补 got／poolSize：got=' + 样例.r.got + ' count=' + 样例.r.count + ' poolSize=' + 样例.r.poolSize);
    const 稀有档数 = Object.keys(掷出集).length;
    ok(稀有档数 >= 20, '🅐d 360 次真掷覆盖 ' + 稀有档数 + ' 枚不同物品（池筛得只剩几枚的话尺看得见）');
    ok(!掷出集['pill_diamond'], '🅐e 稀有档货单里已无 pill_diamond，真掷也从不掷它');
})();

// ============ 🲐 筛池：运行期往货单里塞一枚幽灵 ============
(function () {
    const 池 = w.CHEST_LOOT.rare.items;
    池.push('pill_diamond');
    try {
        清包();
        let 掷中幽灵 = 0;
        for (let i = 0; i < 300; i++) { 清包(); const r = w.openChest('rare'); if (r && r.itemId === 'pill_diamond') 掷中幽灵++; }
        ok(掷中幽灵 === 0, '🅑 往稀有货单塞进查无此物后连开 300 次：掷中它 0 次（掷前筛池生效）');
        清包();
        const r = w.openChest('rare');
        ok(!!r && r.poolSize === 池.length - 1, '🅑b 池长如实：货单 ' + 池.length + ' 枚、可掷 ' + r.poolSize + ' 枚（虚标那枚被记在账外）');
    } finally { 池.pop(); }
    // 整池虚标：不演开箱，也不报喜
    const 原样 = w.CHEST_LOOT.common.items.slice();
    w.CHEST_LOOT.common.items.length = 0;
    w.CHEST_LOOT.common.items.push('pill_diamond', 'exp_pill');
    清包();
    const r = w.openChest('common');
    ok(r === null, '🅑c 整池都是虚标货 → 返回 null（旧写法会掷一枚并说「找到了宝物」）');
    ok(E.msgs.length === 0, '🅑c 这一趟一行喜话也没上（屏证欠账见文末）');
    w.CHEST_LOOT.common.items.length = 0;
    原样.forEach(x => w.CHEST_LOOT.common.items.push(x));
})();

// ============ 🲐 满包：念实收、并把原因接上第一百二十八批那本账 ============
(function () {
    const inv = w.inventory;
    const 可堆 = Object.keys(LIB).find(k => LIB[k] && LIB[k].stackable && (LIB[k].maxStack || 0) >= 5);
    ok(!!可堆, '🅒0 找到一个可堆叠模板做满包／半包夹具（' + 可堆 + '，封顶 ' + (LIB[可堆] || {}).maxStack + '）');
    function 装满(格数) {
        inv.slots.length = 0;
        for (let k = 0; k < inv.maxSlots; k++) {
            inv.slots.push({
                uid: 'z' + k, templateId: 可堆, name: LIB[可堆].name,
                count: k < 格数 ? (LIB[可堆].maxStack - 2) : 99999, icon: 'x',
                getTemplate() { return LIB[可堆]; }
            });
        }
    }
    // —— 满包：一格空地也没有
    let 满包次 = 0, 说带不走 = 0, 怪错行囊 = 0;
    for (let i = 0; i < 30; i++) {
        装满(0);
        E.msgs.length = 0;
        const r = w.openChest('rare');
        if (r && r.got === 0) {
            满包次++;
            const t = E.msgs.map(m => m.text).join(' ');
            if (/一件也没能带走/.test(t)) 说带不走++;
            if (/查无此号/.test(t)) 怪错行囊++;   // 真满包不许赖到模板头上（DES-90 两本账）
        }
    }
    ok(满包次 === 30, '🅒 满包连开 30 次：30 次实收都是 0 件（夹具真的堵死了每一格）');
    ok(说带不走 === 满包次, '🅒b 零收那 ' + 满包次 + ' 次全念了「一件也没能带走」');
    ok(怪错行囊 === 0, '🅒c 真满包一次也没被念成「查无此号」（原因账两条分得开，DES-90 口径）');
    // —— 半包：只剩一格，且那一格只塞得下 2 件
    const 单 = w.CHEST_LOOT.rare.items, 数 = w.CHEST_LOOT.rare.count;
    try {
        w.CHEST_LOOT.rare.items = [可堆];
        w.CHEST_LOOT.rare.count = [3, 3];
        装满(1);
        E.msgs.length = 0;
        const r = w.openChest('rare');
        ok(!!r && r.got === 2 && r.count === 3, '🅓 半包真调：要发 3 件、行囊只吃得下 2 件（实收 ' + (r && r.got) + '）');
        const t = E.msgs.map(m => m.text).join(' ');
        ok(/只塞得下 2\/3 件/.test(t) && /灵石 \d+ 已收入/.test(t), '🅓b 回执念的是「只塞得下 2/3 件」＋灵石那一笔（' + t + '）');
    } finally {
        w.CHEST_LOOT.rare.items = 单;
        w.CHEST_LOOT.rare.count = 数;
    }
})();

// ============ 🲐 真源未就绪：筛池不许瞎筛，但仍要走原因账 ============
(function () {
    const 原表 = w.itemById;
    try {
        w.itemById = null;   // 装载顺序未就绪：这时不该把整池筛空
        w.inventory.slots.length = 0;
        for (let i = 0; i < w.inventory.maxSlots; i++) w.inventory.slots.push(null);
        E.msgs.length = 0;
        const r = w.openChest('rare');
        ok(!!r, '🅔 真源未就绪时照常掷骰（不瞎筛），返回非 null');
        const t = E.msgs.map(m => m.text).join(' ');
        ok(r.got === 0 && /查无此号/.test(t), '🅔b 此时 addItem 报 no_template ⇒ 回执如实说「查无此号」而不是怪行囊（' + t.slice(0, 46) + '…）');
    } finally { w.itemById = 原表; }
})();

// ============ 🲐 改前复现：把筛池那一刀按死，幽灵就该掷得中 ============
(function () {
    const 锚 = 'table.items.filter(function (id) { return !!lib[id]; })';
    const 原码 = load('js/loot-system.js');
    ok(原码.indexOf(锚) >= 0, '🅕 改前复现的锚点在源码里找得到（形状变了要跟着改尺）');
    const F = 装沙箱(src => src.replace(锚, 'table.items.filter(function (id) { return true; })'));
    const fw = F.sb.window;
    ok(F.loadFails.length === 0 && typeof fw.openChest === 'function', '🅕b 按死筛池后的那份沙箱装载无异常');
    fw.CHEST_LOOT.rare.items.push('pill_diamond');
    let 掷中 = 0, 裸名 = 0, 零收 = 0;
    for (let i = 0; i < 400; i++) {
        fw.inventory.slots.length = 0;
        for (let k = 0; k < fw.inventory.maxSlots; k++) fw.inventory.slots.push(null);
        F.msgs.length = 0;
        const r = fw.openChest('rare');
        if (r && r.itemId === 'pill_diamond') {
            掷中++;
            if (r.itemName === 'pill_diamond') 裸名++;
            if (r.got === 0) 零收++;
        }
    }
    ok(掷中 > 0, '🅕c 按死筛池后 400 次里掷中幽灵 ' + 掷中 + ' 次 ⇒ 这条雷真实存在，不是纸面假设');
    ok(裸名 === 掷中, '🅕d 掷中的每一次回执都在念裸 id（' + 裸名 + '/' + 掷中 + ' 次）');
    ok(零收 === 掷中, '🅕e 掷中的每一次实收都是 0 件（' + 零收 + '/' + 掷中 + ' 次）——旧写法就这样静默吞掉一整箱');
    ok(/table\.items\.filter\(function \(id\) \{ return !!lib\[id\]; \}\)/.test(原码),
        '🅕f 真源码里筛池那一刀在册（回打得动，说明改前复现换的是这一段）');
})();

console.log('\n=== 第一百二十九批套件：通过 ' + 通过 + ' / 失败 ' + 失败 + ' ===');
process.exit(失败 ? 1 : 0);