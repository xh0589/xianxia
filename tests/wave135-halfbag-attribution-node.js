// 第一百三十五批 · DES-90 尾巴：把「半包」那一族接到问因手上（不许由视图层自己断言满包）
// 病根（本批类审计查出的存量 56 行）：第一百二十八批只立了一支持牌手 window.addItemFailText——
//   它只在「零收」那一档说话（原因账 addItemFailReason 也只由 addItem 在 added===0 时落笔）。
//   于是掷 3 收 1 那种半包点位，接不上这支的只能继续在源码里自写「行囊塞不下／腾不出格子」——
//   把「这一件没落进你的行囊」这件事实，和「因为你的行囊满了」这个推断，又焊回视图层。
// 改：①js/inventory.js 另导出第二支 window.addItemReasonText（半包用；账上没落笔时念中性句，不替行囊断言）；
//     ②全仓 56 行裸满包句逐点接线——零收问 addItemFailText、半包问 addItemReasonText；
//     ③丹炉／锻台把账上的原因原样透传（reason 契约不动，另加 failReason）；
//     ④【尾巴②】C2 那把 ±2 行窗会放过「前半句自断原因、后半句才问账」——按行放宽图案复扫得 29 处同行自断
//       （半包 15／零收 5／跨行自相矛盾 6／一名两义 3），全部接完新增按行判的 C5（门槛 0）与花名册 16 条；
//       其中 qiyu-encounters 与 pawn-service 那两处只撤了假话（reason 键本身一名两义，接真账要动交易通道），登记待裁。
// 手法：真物品链＋真 js/inventory.js 装进 vm 真调（同第一百二十八批口径）；形状账走全仓源码普查；
//      改前复现按源码字面回打，跑在沙箱里，不是玩家屏幕现场。
// ⚠ 本批真 Chrome 屏证 0 条：下面每句读的都是假 DOM 里的返回值与字符串。
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
    'js/items-extended/12-quest-extensions.js'
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
    return sb;
}

// 现场装包：行囊只剩 N 格
function 装包(sb, 留空格) {
    const inv = sb.window.inventory;
    inv.slots.length = 0;
    for (let i = 0; i < inv.maxSlots; i++) {
        inv.slots.push(i < 留空格 ? null : { uid: 'full_' + i, templateId: 'no_such_template_zzz', name: '占位', count: 1, icon: '·' });
    }
    sb._msgs.length = 0;
}

const W = 装沙箱();
ok(W._fails.length === 0, '⓪ 真物品链＋真背包脚本装载无异常' + (W._fails.length ? '（' + W._fails.join(' | ') + '）' : ''));
const R = W.window.itemById || {};
ok(Object.keys(R).length >= 400, '⓪b 物品表规模 ≥400（实得 ' + Object.keys(R).length + '，与第一百二十八批同口径）');
const win = W.window;
ok(typeof win.addItemFailText === 'function', '⓪c 零收那支持牌手 window.addItemFailText 仍在（本批不撤第一百二十八批那一支）');
ok(typeof win.addItemReasonText === 'function', '⓪d 本批新增的半包问因手 window.addItemReasonText 已从 js/inventory.js 导出');
const 有主 = R['iron_sword'] ? 'iron_sword' : Object.keys(R)[0];
const 无主 = 'no_such_template_zzz';
const 不堆 = Object.keys(R).find(k => R[k] && !R[k].stackable) || 有主;
ok(!!R[有主] && !R[无主] && !!R[不堆], '⓪e 自证支：「' + 有主 + '」「' + 不堆 + '」在表里、「' + 无主 + '」查无此物（对照才成立）');

// ============ A 两支读同一本账 ============
console.log('\n[A] 半包问中性、零收问账——两支不许各说各话');
{
    const 源 = load('js/inventory.js');
    const 读账 = (源.match(/window\.addItemFailReason/g) || []).length;
    ok(读账 >= 6, 'A1 两支牌手读的是同一本账：js/inventory.js 里 addItemFailReason 现读 ' + 读账 + ' 处（落笔 3＋两支各读 2＋别名 1 起底）——拆出第三本账即红');
    ok(!/window\.addItemFailReason2|window\.addFailReason\b/.test(源), 'A2 不许另起一本原因账（本批只加说话手，不加账本）');

    装包(W, 1);
    const a3 = Number(win.addItem(不堆, 3)) || 0;
    ok(a3 === 1 && win.addItemFailReason === null, 'A3 只剩一格要三件（' + 不堆 + '）：实收 ' + a3 + '、原因账仍是空的——' + JSON.stringify(win.addItemFailReason) + '（半包不是满包，账上就没落这一笔）');
    const 中性 = win.addItemReasonText('这一趟的矿');
    ok(中性 === '没能落进你的行囊。', 'A4 账上没落笔时问因手只念中性句：' + JSON.stringify(中性));
    ok(中性.indexOf('行囊已满') < 0 && 中性.indexOf('塞不下') < 0, 'A5 这一句不许替行囊断言原因（读数 ' + JSON.stringify(中性) + '）');
    ok(win.addItemFailText('这一趟的矿') === '', 'A6 对照支：零收那一支同一时刻返回空串——半包时它闭嘴是对的，本批才另开了 A4 那一支');

    装包(W, 0); win.addItem(有主, 1);
    ok(win.addItemFailReason === 'bag_full' && win.addItemReasonText('铁剑').indexOf('行囊已满') === 0,
        'A7 零收满包之后问因手：同一本账，两支念的是同一件事（读数 ' + JSON.stringify(win.addItemReasonText('铁剑')) + '）');

    装包(W, 5); win.addItem(无主, 1);
    const 话 = win.addItemReasonText('修为丹');
    ok(话.indexOf('查无此号') > 0 && 话.indexOf('行囊已满') < 0,
        'A8 查无此物时问因手也不许怪格子（读数 ' + JSON.stringify(话) + '）');

    装包(W, 5); win.addItem(有主, 1);
    ok(win.addItemFailReason === null && win.addItemReasonText('') === '没能落进你的行囊。',
        'A9 收着之后就清账：再问因手只回中性句，上一笔的原因不许留到这一笔（实读 ' + JSON.stringify(win.addItemReasonText('')) + '）');
    装包(W, 5); win.addItem(无主, 1);
    ok(win.addItemReasonText('').indexOf('那件东西') === 0,
        'A10 不报名字时问因手也有主语（与零收那一支同一条规矩）：' + JSON.stringify(win.addItemReasonText('')));
}

// ============ B 丹炉／锻台把原因原样透传 ============
console.log('\n[B] 炉子那一头：契约不动，多带一本原因');
{
    const 丹 = load('js/crafting/alchemy-compound.js');
    const 器 = load('js/crafting/forging-compound.js');
    for (const [名, 源] of [['alchemy-compound', 丹], ['forging-compound', 器]]) {
        const 块 = (() => { const i = 源.indexOf("reason: 'inventory-full'"); return i < 0 ? '' : 源.slice(i - 240, i + 300); })();
        ok(块.length > 0 && /failReason: \(typeof window\.addItemFailReason === 'string'\)/.test(块),
            名 + ' B1 落袋失败那支带回 failReason（只透传真账、不自造原因）');
        ok(/refundBack:|refundAsked:/.test(块), 名 + ' B2 退料那两本数原样在（第一百二十四批那一笔没被本批改掉）');
        ok(!/reason:\s*'bag-full'/.test(源), 名 + ' B3 对外的 reason 字面量仍是 inventory-full（调用方契约没动）');
    }
    const UI = load('js/crafting/compound-ui.js');
    const 炉块 = (() => { const i = UI.indexOf("reason === 'inventory-full'"); return i < 0 ? '' : UI.slice(i - 320, i + 560); })();
    // 【按「钉法」更新字面／窗口，要求一字未松】B4 要的是「改问说话手」这件事，
    // 而第一百四十批把这一处从**句尾支**换成了**中段支**（原句带句号钉在「+ (res.refundBack…」
    // 之前会破句）。两支都是说话手，所以这里只把「认哪一支」放宽成两支都认，**不许变成不认**。
    ok(/window\.addItem(?:Fail|Reason)Ph?rase/.test(炉块) || /window\.addItem(?:Fail|Reason)Text/.test(炉块),
        'B4 炉前那一屏改问说话手（不再由界面自己断言「背包满了」；句尾支/中段支都算说话手）');
    // B5 窗口 460→560：第一百四十批在该处上方补了一段说明「回退串原为『背包满了，丹没地方放』」
    // 的注释（约 300 字），把退款那两行推出了 460 的窗口。**只放宽取样窗口**，
    // 下面两个判据（退料要拿 `res.refundBack >= res.refundAsked`、且要念出「材料只退回 」）
    // 一个字没松，也没有从「两个都要」退成「任一个」。
    ok(/res\.refundBack >= res\.refundAsked/.test(炉块) && /材料只退回 /.test(炉块),
        'B5 退料那两本数照念（DES-84 那一笔没被本批改回去：只退一半时不许再念「已退回」）');
}

// ============ C 全仓接线账 ============
console.log('\n[C] 三本全仓尺：裸句归零、引用只准增、自相矛盾归零');
function walk(dir, out) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p, out); else if (e.name.endsWith('.js')) out.push(p);
    }
    return out;
}
{
    const 文件 = walk(path.join(ROOT, 'js'), []);
    let 引用 = 0;
    for (const f of 文件) 引用 += (fs.readFileSync(f, 'utf8').match(/addItemFailReason|addItemFailText|addItemReasonText|addItemFailPhrase|addItemReasonPhrase/g) || []).length;
    ok(引用 >= 249, 'C1 只准增：全仓问这本账的引用现读 ' + 引用 + ' 处（第一百三十五批基线 234 → 第一百三十八批把半截话一族接到从句支后 249；从句支问的是同一本账）——降回去就是有人把真话又拆了');

    let 裸句 = 0, 矛盾 = 0; const 各文件 = {};
    for (const f of 文件) {
        const 行 = fs.readFileSync(f, 'utf8').split('\n');
        let n = 0;
        行.forEach((l, i) => {
            if (/^\s*\/\//.test(l)) return;
            if (/行囊已满|行囊塞不下|腾不出格子|一件也没能带走/.test(l)) {
                if (/window\.addItemFailReason\s*===|reason === 'bag_full'/.test(l)) return;   // 说话手的定义体本身＝口径的定义，不算裸句
                const 邻 = 行.slice(Math.max(0, i - 2), i + 3).join('\n');
                if (!/addItemFailText|addItemReasonText|addItemFailPhrase|addItemReasonPhrase|addItemFailReason/.test(邻)) n++;
            }
            const 去兜底 = l.replace(/\|\|\s*'[^']*'/g, '');
            if (/addItem(Fail|Reason)(Text|Phrase)/.test(l) && /行囊已满|行囊塞不下|腾不出格子/.test(去兜底)) 矛盾++;
        });
        裸句 += n;
        if (n) 各文件[path.relative(ROOT, f).split(path.sep).join('/')] = n;
    }
    ok(裸句 === 0, 'C2 第一百三十五批把裸满包句 56 → 0：现读 ' + 裸句 + ' 行' + (Object.keys(各文件).length ? '（' + Object.entries(各文件).map(e => e[0] + '×' + e[1]).join('、') + '）' : '') + '——门槛钉死为 0，多一行即红');
    ok(矛盾 === 0, 'C3 同一句里既自断原因又问账的自相矛盾点位：现读 ' + 矛盾 + ' 行（第一百三十批登记过 reputation 那一类，本批撤净）——回一行即红');

    const 点位 = [
        ['js/party-system.js', "it.name + ' 这一件没落进你的行囊，先留在'"],
        ['js/party-system.js', "」没能落进你的行囊——先别换：'"],
        ['js/location-system.js', ": '毒核这一趟没带走：' +"],
        ['js/location-system.js', ": '试炼有所收获——那枚丹药只好留在原地，没能带走：' +"],
        ['js/reputation-system.js', "只好原样留在石室里：' +"],
        ['js/world-events.js', "可它又滑回了金光中，这一场还算数。' +"],
        ['js/app.js', "'，你没能带走——' +"],
        // 三座秘境分池后这一处的器物名随座走（遗迹＝稀有装备／洞底＝矿石／峰上＝峰顶带下来的器物），
        // 但「事实句在前、缘由问账在后」这一对写法一个字节没拆——锚点跟着改成变量形。
        ['js/app.js', "'——那件' + _通关词 + '没能带走：' +"],
        ['js/map/landmark-explore.js', "它还在等你。' +"],
        ['js/sects/sect-events.js', "'（灶上的烤肉你两块也没能带走：' +"],
        // 尾巴②（宽口径查出的那 29 处里，接上账的 13 处）
        ['js/event-system.js', "一件也没能带走：'"],
        ['js/npcs/npc-life-system.js', "这份只好还搁在他那儿：'"],
        ['js/sects/sect-cities.js', "你没能带走——'"],
        ['js/sects/sect-events.js', "一件也没带上（'"],
        ['js/app.js', "你没能带走：'"],
        ['js/sects/sects-deep-ui.js', "没能落袋（'"],
        ['js/crafting.js', "'（另 ' + (resultCount - gotCount) + ' 件：'"],
        ['js/map/randomMap.js', " 留在了原地'\n        + (话 ? '：' + 话 : '') + '）';"],
        ['js/world-events.js', "枚留在了场上：'"],
        ['js/sects/sect-governance.js', "份留在库里：'"],
        ['js/beast-taming.js', "'这张符纸没能带走：'"],
        ['js/building-effects.js', "这一瓶水没能落进你的行囊：'"],
        ['js/reputation-system.js', "留在了柜上：'"],
        // 这三处只把假话撤了（原因压根无从问账：交易通道的 reason 一名两义／发货手不在场），下一批接真账时这句要跟着改
        ['js/extensions/qiyu-encounters.js', "到手的东西没能落进你的行囊"],
        ['js/city-facilities/pawn-service.js', "这一单没走通，货仍在你柜上"],
        ['js/sects/sect-events.js', "'商人去了，你两手空空，什么也没落下'"],
    ];
    let 缺 = [];
    for (const [f, 锚] of 点位) if (!load(f).includes(锚)) 缺.push(f + ' :: ' + 锚.slice(0, 24));
    ok(缺.length === 0, 'C4 本批翻转点位的花名册（前 23 处＝事实句在前、缘由问账在后这一对写法不许拆开；末 3 处＝只撤了假话、待接真账）：缺 ' + 缺.length + ' 处' + (缺.length ? ' → ' + 缺.join(' ｜ ') : ''));

    // C5（尾巴②加的那把严尺）：C2 的 ±2 行窗会把「前半句自断原因、后半句才问账」放过去——尾巴查出 29 处，全部接线后改按行判
    const 断因 = /行囊已满|行囊已经塞满|行囊塞满|行囊塞不下|行囊搁不下|行囊腾不出|背包放不下|囊中无处|腾不出格子|腾个格子再来|行囊.{0,6}放不下|行囊满了/;
    let 自断 = 0; const 自断处 = [];
    for (const f of 文件) {
        const rel = path.relative(ROOT, f).split(path.sep).join('/');
        fs.readFileSync(f, 'utf8').split('\n').forEach((l, i) => {
            const 去注释 = l.replace(/\s+\/\/[^'"]*$/g, '');          // 代码后面挂的半截注释同属注释
            if (/^\s*(\/\/|\*|\/\*)/.test(去注释)) return;
            if (rel === 'js/inventory.js' && /window\.addItemFailReason\s*===|addItemFailText = function|addItemReasonText = function|addItemFailPhrase = function|addItemReasonPhrase = function|function failTextFor|function reasonTextFor|function failPhraseFor|reason === 'bag_full'|reason === 'no_template'|是这件东西没有名目/.test(去注释)) return;
            const 净 = 去注释.replace(/\|\|\s*'[^']*'/g, '').replace(/\|\|\s*"[^"]*"/g, '');   // 回退句只在手缺席时才念，不算自断
            if (!断因.test(净)) return;
            if (/addItemFailText|addItemReasonText|addItemFailPhrase|addItemReasonPhrase|addItemFailReason|failPhraseFor/.test(净)) return;
            // 【第一百四十二批·按「钉法」加一条窄豁免，判据未松】第一百四十二批把
            // `inventory_full_or_invalid_item` 一名两义拆成三个键，于是三张 reason 表里出现了
            //   bag_full: '行囊满了，腾出格子再取'
            // 这类**译文**。它不是「自己断言满包」—— `bag_full` 这个值本身就是
            // `js/inventory.js` 的 addItem 失败时写进 `addItemFailReason` 的**账**，
            // reason 表只把账上已确定的因翻成人话；玩家看到的仍是「账说满了」，不是「界面以为满了」。
            // 豁免只认**对象键形态**（`bag_full:` 这种），不认正文里出现 bag_full 字样 ——
            // 否则任何真·自断的站点只要顺手写个同名变量就能绕过这把尺。要求本身（自断＝0）一个字未松。
            // ⚠️ 第二版又把 `^` 后面漏了 `\s*`：`^\s*` 才认得「缩进 + 键名 + 冒号」这个形状，
            // 而 reason 表里的行全是带缩进的。漏了它，豁免形同虚设（实测仍报 2 处红）。
            if (/(^|[,{])\s*(bag_full|item_no_template|inventory_failed|missing_item)\s*:/.test(净)) return;
            自断++; 自断处.push(rel + ':' + (i + 1));
        });
    }
    ok(自断 === 0, 'C5 按行判的严尺：源码里自己断言「行囊已满／塞不下」却又没问账的句子现读 ' + 自断 + ' 处' + (自断处.length ? '（' + 自断处.slice(0, 8).join('、') + '）' : '') + '——第一百三十五批尾巴把这 29 处接了线，回一处即红');
}

// ============ D 改前复现（沙箱内，不是玩家屏幕现场） ============
console.log('\n[D] 改前复现：把中性句改回自断满包，半包那一屏就撒谎');
{
    const 原 = load('js/inventory.js');
    const 旧 = "return '没能落进你的行囊。';";
    if (!原.includes(旧)) throw new Error('改前复现：找不到「' + 旧 + '」——那一支的形状变了，套件要跟着改');
    const 拆掉 = 原.replace(旧, "return '行囊已满，先腾个格子再来。';");
    const V = 装沙箱(拆掉);
    ok(V._fails.length === 0, 'D0 把那一行拆回旧写法后仍能装载（复现不靠额外的桩）');
    装包(V, 1);
    const 收 = Number(V.window.addItem(不堆, 3)) || 0;
    const 读数 = V.window.addItemReasonText('这一趟的矿');
    ok(收 === 1 && V.window.addItemFailReason === null, 'D1 同一场景：实收 ' + 收 + '、账上仍是空的（通道没落这一笔）');
    ok(读数.indexOf('行囊已满') === 0, 'D2 改前复现（沙箱）：账上没落笔，那一支却替行囊断言——"' + 读数 + '"');
    const T = 装沙箱();
    装包(T, 1);
    const 真收 = Number(T.window.addItem(不堆, 3)) || 0;
    const 真读数 = T.window.addItemReasonText('这一趟的矿');
    ok(真收 === 1 && T.window.addItemFailReason === null && 真读数 === '没能落进你的行囊。',
        'D3 反向自证：同一场景装真源码，账上仍是空的、念的是中性句 "' + 真读数 + '"——这正是本批补的那句话');
}

console.log('\n=== 第一百三十五批套件：通过 ' + 通过 + ' / 失败 ' + 失败 + ' ===');
if (失败 > 0) process.exitCode = 1;
