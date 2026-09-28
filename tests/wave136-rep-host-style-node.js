// 第一百三十六批 · 组件不许只在一个宿主里才长得像自己（声望五枚门牌的样式原先全锁在 #city-panel 里）
// 病根（真 Chrome 量出来的，不是读码猜的）：同一支 getReputationPanelHtml 渲染进两个宿主——
//   ①城市面板里的 #city-rep-mini（js/location-system.js:738 模板）②活动页的 #reputation-panel（仙侠.html:1631，由 js/app.js:9733 注入）。
//   而 styles/panel-map.css 里那 11 条 .rep-* 规则全部写着 `#city-panel .rep-*`。
//   改前读数（.scratch/probe-136-repstyle-改前.stdout.txt，1920×1080 真窗口）：活动页那一宿主里
//   .rep-gates 算出来 display:block、grid-template-columns:none、gap:normal，五枚门牌是 UA 默认的 inline-block、无边框、单行 22~42px 高。
//   也就是说玩家从一级导航「活动」点进去，看到的是没上妆的裸控件——而同一张卡在城里却是摆好的。
// 改：去掉 #city-panel 前缀（含 .rep-donate-note），让组件样式由组件自己拿；见 styles/panel-map.css:576 起那段注释。
// 手法：形状账走样式表与源码普查；改前复现＝把前缀加回去再用同一把尺子量（跑在字符串里，不是玩家屏幕现场）。
// 屏证：本批真 Chrome 已截 .scratch/probe-136-屏证-半包.png（同屏可见五枚门牌已成网格）与 .scratch/probe-136-屏证-零收.png。
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

let 通过 = 0, 失败 = 0;
function ok(cond, msg) {
    if (cond) { 通过++; console.log('  ✓ ' + msg); }
    else { 失败++; console.log('  [FAIL] ' + msg); }
}
function load(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// 组件自己生成的 class（从 js/reputation-system.js 的 getReputationPanelHtml 现扫，不写死）
function 组件类名() {
    const 源 = load('js/reputation-system.js');
    const i = 源.indexOf('function getReputationPanelHtml');
    if (i < 0) throw new Error('找不到 getReputationPanelHtml——组件搬走了，本套件要跟着改');
    const 尾 = 源.indexOf('\nfunction ', i + 10);
    const 块 = 尾 < 0 ? 源.slice(i) : 源.slice(i, 尾);
    const 集 = Array.from(new Set((块.match(/\brep-[A-Za-z0-9_-]+/g) || [])));
    return { 集, 块 };
}

// 样式表里所有「以某个具体宿主 id 打头、后面还跟着 class」的规则头
const 宿主前缀尺 = (css原文, 类名集) => {
    const css文本 = css原文.replace(/\/\*[\s\S]*?\*\//g, '');   // 注释里写到的类名与前缀不算规则（本批注释正写着「原先锁在 #city-panel 里」）
    const 违规 = [];
    const 漏描 = [];
    const 命中 = {};
    const 重 = /[^{}]+\{/g;
    let m;
    while ((m = 重.exec(css文本))) {
        m[0].slice(0, -1).split(',').forEach(s => {
            const 选 = s.trim();
            if (!选 || /^@/.test(选)) return;
            类名集.forEach(c => {
                const 尺 = new RegExp('\\.' + c.replace(/[-]/g, '\\-') + '(?![\\w-])');
                const 中 = 选.search(尺);
                if (中 < 0) return;
                命中[c] = (命中[c] || 0) + 1;
                const 前 = 选.slice(0, 中);
                if (/#\w[\w-]*/.test(前)) 违规.push(选.replace(/\s+/g, ' ').slice(0, 90));
            });
        });
    }
    类名集.forEach(c => { if (!命中[c]) 漏描.push(c); });
    return { 违规, 漏描 };
};

const { 集: 类名, 块: 组件源码块 } = 组件类名();
console.log('\n[⓪] 组件在册');
ok(类名.length >= 6, '⓪a getReputationPanelHtml 现扫出的组件 class ' + 类名.length + ' 个：' + 类名.join('、'));
const 样式文件 = fs.readdirSync(path.join(ROOT, 'styles')).filter(f => f.endsWith('.css')).map(f => 'styles/' + f);
const 全部样式 = load('styles.css') + '\n' + 样式文件.map(f => load(f)).join('\n');
ok(样式文件.length >= 8 && 全部样式.length > 10000, '⓪b 样式表规模：' + 样式文件.length + ' 个分文件＋styles.css，合计 ' + 全部样式.length + ' 字符（尺子量的不是空表）');

console.log('\n[A] 组件样式不许锁在某个宿主 id 里');
{
    const r = 宿主前缀尺(全部样式, 类名);
    ok(r.违规.length === 0, 'A1 全仓样式里「宿主 id 前缀 + .rep-*」的规则现读 ' + r.违规.length + ' 处' + (r.违规.length ? '（' + r.违规.slice(0, 6).join(' ｜ ') + '）' : '') + '——第一百三十六批清零，回一条即红（组件长什么样不许靠某个宿主赏饭）');
    ok(r.漏描.length === 0, 'A2 组件自己吐出的 class 每一个都得有规则接着：缺描 ' + r.漏描.length + ' 个' + (r.漏描.length ? '（' + r.漏描.join('、') + '）' : ''));

    const 表 = load('styles/panel-map.css');
    const 取 = 选择器 => { const i = 表.indexOf('\n' + 选择器 + ' {'); return i < 0 ? null : 表.slice(i, 表.indexOf('}', i)); };
    const 门牌 = 取('.rep-gates'), 一枚 = 取('.rep-gate');
    ok(门牌 && /display:\s*grid/.test(门牌) && /minmax\(/.test(门牌), 'A3 .rep-gates 本体就是网格（display:grid + minmax 自适应列）——不再是「有前缀才网格、没前缀就 block」');
    ok(一枚 && /display:\s*flex/.test(一枚) && /flex-direction:\s*column/.test(一枚), 'A4 .rep-gate 本体两行摆（flex + column）');
    ok(/\.rep-gate__tier\s*\{[^}]*white-space:\s*nowrap/.test(表), 'A5 档名 .rep-gate__tier 仍 nowrap（UI-22 那批断字修不撤）');
    ok(/\.rep-gate:disabled\s*\{[^}]*cursor:\s*not-allowed/.test(表) && /\.rep-gate:disabled \.rep-gate__brief\s*\{[^}]*color:/.test(表),
        'A6 锁着的那枚：cursor:not-allowed ＋「差什么」那行有专色——禁用不许只把颜色淡掉');
    ok(!/#city-panel\s+\.rep-/.test(表), 'A7 panel-map.css 里 .rep-* 一支笔到底再无 #city-panel 前缀（含本批摘掉的 .rep-donate-note）');
    ok(/\.rep-donate-note\s*\{/.test(表), 'A8 .rep-donate-note 以裸 class 在表（本批摘前缀的那一条）');
    ok(/#city-panel \.city-group:not\(\[open\]\)/.test(表), 'A9 对照支：真只属于城市面板的规则（折叠组收起）仍带着 #city-panel——尺子不是一刀切去前缀，只砍跨宿主那一类');
}

console.log('\n[B] 两个渲染宿主都还在册（少一个＝这条尺失去意义）');
{
    const 页 = load('仙侠.html'), 位 = load('js/location-system.js'), 应 = load('js/app.js');
    ok(/id="reputation-panel"/.test(页), 'B1 活动页宿主 #reputation-panel 仍在 仙侠.html');
    ok(/id="city-rep-mini"/.test(位), 'B2 城市面板宿主 #city-rep-mini 仍在 js/location-system.js 的模板里');
    const 调用 = (应.match(/getReputationPanelHtml/g) || []).length + (位.match(/getReputationPanelHtml/g) || []).length;
    ok(调用 >= 2, 'B3 两支渲染调用现读 ' + 调用 + ' 处（app.js 注活动页＋location-system.js 注城市卡）——「同一组件两宿主」这个前提还站着');
}

console.log('\n[C] 改前复现：把前缀加回去，同一把尺子必须抓到');
{
    const 表 = load('styles/panel-map.css');
    const 拆回 = 表.replace(/\n\.rep-gates \{/, '\n#city-panel .rep-gates {').replace(/\n\.rep-gate \{/, '\n#city-panel .rep-gate {');
    ok(拆回 !== 表, 'C0 复现改得动（找到了那两条裸规则的头）——改不动说明形状变了，本条要跟着改');
    const 旧 = 宿主前缀尺(拆回, 类名);
    ok(旧.违规.length >= 2, 'C1 改前复现（字符串里，不是玩家屏幕现场）：加回 #city-panel 前缀后同一把尺子报 ' + 旧.违规.length + ' 处 → ' + 旧.违规.slice(0, 3).join(' ｜ ') + '——尺子抓得住这个病');
    const 新 = 宿主前缀尺(表, 类名);
    ok(新.违规.length === 0, 'C2 反向自证：真表同一把尺子报 0 处——C1 报的是复现出来的病，不是尺子本身过敏');
    // 改前的屏上形状：活动页那一宿主拿不到网格（用规则可达性复现，不靠浏览器）
    const 锁住的 = 拆回.split('\n').filter(l => /^#city-panel \.rep-.*\{/.test(l));
    ok(锁住的.length >= 2 && 锁住的.every(l => !/^\.rep-/.test(l)), 'C3 复现的机理：改前有 ' + 锁住的.length + ' 条 .rep-* 规则整条挂在 #city-panel 之后（' + 锁住的.map(l => l.replace(/ \{/, '')).join('、') + '）——活动页 #reputation-panel 那棵子树一条也命中不了，屏上便退回 UA 默认（真窗口读数 display:block／inline-block 即由此来）');
}

console.log('\n[D] 本批屏证所测的那两句接线不许再拆（DES-90 收口后的现场）');
{
    const 钓 = load('js/app.js');
    const 块 = (() => { const i = 钓.indexOf('var _收杆 = gained.length === 0'); return i < 0 ? '' : 钓.slice(i, i + 700); })();
    ok(块.length > 0, 'D0 找到钓鱼收杆那一段（js/app.js goFishing）');
    // 第一百三十八批（DES-96/97）改的正是这两支的走法：收杆那一段不再就地读全局账，
    // 而是拿本站抄下的 鱼账 去问 app.js 那支 货账话——它接的还是同一本 addItemFailReason 账，
    // 只是出口换成不带句号的从句支（半截话里钉句号会把括号顶破）。要求没松：账还是要问，且不许自断。
    const 助手 = (() => { const i = 钓.indexOf('function 货账话(账, 名目) {'); return i < 0 ? '' : 钓.slice(i, i + 320); })();
    ok(助手.length > 0 && /window\.addItemFailPhraseFor/.test(助手),
        'D1 收杆那两屏的缘由仍问原因账——只是改经 货账话→从句支（同一本账，第一百二十八批那两手之一）');
    ok(/一条也没装下/.test(块) && /鱼话/.test(块) && /脱手时跑了/.test(块)
        && !/addItemFailText|addItemReasonText/.test(块),
        'D2 零收／半收那两屏都问 鱼话（本站抄的账），段内不再直接问句尾带圆点那两手（.scratch/probe-136-屏证-半包.png 与 -零收.png 上屏那两句）');
    ok(!/行囊已满，先腾个格子再来。'\s*\)/.test(块.replace(/\|\|\s*'[^']*'/g, '')), 'D3 两处都只把那句留在 || 兜底里，主句不许再自断满包（同第一百三十五批 C5 的按行口径）');
}

console.log('\n[E] 同屏第二个缺陷：获得飘字念的是「要加几条」，不是「落进包里几条」');
{
    // 真物品链＋真 js/inventory.js 装进 vm 真调（同第一百三十五批口径）；动效与撒花装成记录器
    const vm = require('vm');
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
    const 节 = () => ({
        style: { setProperty() {}, removeProperty() {} },
        classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
        dataset: {}, children: [], childNodes: [], attrs: {},
        appendChild(c) { this.children.push(c); return c; }, removeChild(c) { return c; },
        setAttribute(k, v) { this.attrs[k] = String(v); }, getAttribute(k) { return this.attrs[k] === undefined ? null : this.attrs[k]; },
        addEventListener() {}, removeEventListener() {}, dispatchEvent() {}, closest() { return null; },
        querySelector() { return null; }, querySelectorAll() { return []; },
        focus() {}, blur() {}, click() {}, remove() {}, insertBefore(c) { return c; },
        getBoundingClientRect() { return { top: 0, left: 0, width: 1, height: 1, bottom: 1, right: 1 }; },
        scrollIntoView() {}, offsetHeight: 1, offsetWidth: 1, parentNode: null,
        textContent: '', innerHTML: '', value: ''
    });
    function 装(背包源码) {
        const 飘 = [], 花 = [];
        const sb = {
            console: { log() {}, warn() {}, error() {} },
            localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
            setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
            requestAnimationFrame: () => 0, navigator: { userAgent: 'node', maxTouchPoints: 0 },
            location: { href: 'file:///xianxia.html', search: '' },
            matchMedia: () => ({ matches: false, addListener() {}, removeListener() {} }),
            alert() {}, prompt: () => null, confirm: () => true,
            parseInt, parseFloat, isNaN, Number, String, Math, Date, JSON, Set, Map, Array, Object, RegExp, Error, Promise,
            showMessage() {}, performance: { now: () => 0 },
            showItemObtainAnimation: (id, c) => { 飘.push({ id, c }); },
            showEffect: k => { 花.push(k); }
        };
        sb.window = sb; sb.globalThis = sb;
        sb.document = {
            getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
            createElement: 节, createTextNode: 节, createElementNS: 节, addEventListener() {}, body: 节(), head: 节(),
            documentElement: 节(), readyState: 'loading', activeElement: null
        };
        vm.createContext(sb);
        const fails = [];
        for (const f of ORDER) { try { vm.runInContext(load(f), sb, { filename: f }); } catch (e) { fails.push(f + ': ' + e.message); } }
        try { vm.runInContext(背包源码 || load('js/inventory.js'), sb, { filename: 'js/inventory.js' }); } catch (e) { fails.push('js/inventory.js: ' + e.message); }
        return { sb, 飘, 花, fails };
    }
    function 装包(sb, 留空格) {
        const inv = sb.window.inventory;
        inv.slots.length = 0;
        for (let i = 0; i < inv.maxSlots; i++) {
            inv.slots.push(i < 留空格 ? null : { uid: 'f' + i, templateId: 'no_such_template_zzz', name: '占位', count: 1, icon: '·' });
        }
    }
    const S = 装();
    ok(S.fails.length === 0, 'E0 真物品链＋真背包脚本装载无异常' + (S.fails.length ? '（' + S.fails.join(' | ') + '）' : ''));
    const 不堆 = Object.keys(S.sb.window.itemById || {}).find(k => S.sb.window.itemById[k] && !S.sb.window.itemById[k].stackable);
    ok(!!不堆, 'E0b 找到一件不堆叠的实物（' + 不堆 + '）来摆半包场景');

    装包(S.sb, 1); S.飘.length = 0; S.花.length = 0;
    const 收 = Number(S.sb.window.addItem(不堆, 3)) || 0;
    ok(收 === 1 && S.飘.length === 1 && Number(S.飘[0].c) === 1,
        'E1 只剩一格要三件：真收 ' + 收 + '，飘字 ' + S.飘.length + ' 次、念 ' + JSON.stringify(S.飘[0] && S.飘[0].c) + '——屏正中与回执念同一个数');
    ok(S.花.length === 1, 'E2 撒花也跟着实收（真收了才庆）：现读 ' + S.花.length + ' 次');

    装包(S.sb, 0); S.飘.length = 0; S.花.length = 0;
    const 零 = Number(S.sb.window.addItem(不堆, 3)) || 0;
    ok(零 === 0 && S.飘.length === 0 && S.花.length === 0,
        'E3 满包一件没收：实收 ' + 零 + '、飘字 ' + S.飘.length + ' 次、撒花 ' + S.花.length + ' 次——不许凭空庆一次');

    装包(S.sb, 5); S.飘.length = 0; S.花.length = 0;
    const 空 = S.sb.window.addItem(不堆, 0);
    ok(S.飘.length === 0 && S.花.length === 0, 'E4 要加 0 件（_addItemRaw 回 true 那一支）：飘字 ' + S.飘.length + ' 次、撒花 ' + S.花.length + ' 次——旧写法在这里会凭空飘一枚「+1」');

    const 原 = load('js/inventory.js');
    const 旧写法 = "window.showItemObtainAnimation(templateId, count || 1);";
    const 拆回 = 原.replace("window.showItemObtainAnimation(templateId, 实收);", 旧写法)
        .replace("if (实收 > 0 && typeof window.showItemObtainAnimation === 'function') {", "if (result && typeof window.showItemObtainAnimation === 'function') {");
    ok(拆回.includes(旧写法) && 拆回 !== 原, 'E5 改前复现改得动（找不到本批那一行说明形状变了，本条要跟着改）');
    const P = 装(拆回);
    装包(P.sb, 1); P.飘.length = 0;
    const 收旧 = Number(P.sb.window.addItem(不堆, 3)) || 0;
    ok(收旧 === 1 && P.飘.length === 1 && Number(P.飘[0].c) === 3,
        'E6 改前复现（沙箱，不是玩家屏幕现场）：同一场景实收 ' + 收旧 + ' 却飘「+' + (P.飘[0] || {}).c + '」——正是 .scratch/probe-136-屏证-半包.png 同屏那句 toast 对不上的来路');
    const Q = 装();
    装包(Q.sb, 1); Q.飘.length = 0;
    Q.sb.window.addItem(不堆, 3);
    ok(Number((Q.飘[0] || {}).c) === 1, 'E7 反向自证：真源码同一场景飘「+' + (Q.飘[0] || {}).c + '」——E6 报的是复现出来的病，不是尺子过敏');
}

console.log('\n=== 第一百三十六批套件：通过 ' + 通过 + ' / 失败 ' + 失败 + ' ===');
if (失败 > 0) process.exitCode = 1;
