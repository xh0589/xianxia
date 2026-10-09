// 第一百二十七批 · 「报喜先于发货」这一族（DES-89）＋ DES-72 副账归零
// 前一批治的是「先销账后发货」（闸门），这一批治的是同一枚硬币的另一面：**喜话先上屏、东西还在半空**。
// 副账＝第一百二十五批新开的那本账：同一行带 if 守卫的裸调用（`if (…) window.addItem(…)` 而返回值丢在地上）。
// 开案 48 → 38 → 本批 0。其中最大一簇是 js/items-extended/11-event-extensions.js 的 42 处奇遇彩头。
// 契约仍是第八十二波那条：window.addItem（＝window.addItemToInventory，js/inventory.js:169／别名 :2516）返回**实收件数**。
// 证据分两档，逐段标出：vm 行为＝把真文件装进沙箱真调一次；读码＝源码形状断言。
// ⚠ 本批真 Chrome 屏证 0 条：下面每句读的都是假 DOM 里的返回值与上屏字符串，玩家眼睛还没验。
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

// —— 把私有函数从大文件里切出来真调（app.js／building-effects.js 里那些方法没有导出口）
function 跳串(src, i) {
    const q = src[i]; i++;
    while (i < src.length) {
        if (src[i] === '\\') { i += 2; continue; }
        if (q === '`' && src[i] === '$' && src[i + 1] === '{') {
            let d = 1; i += 2;
            while (i < src.length && d > 0) { if (src[i] === '{') d++; else if (src[i] === '}') d--; i++; }
            continue;
        }
        if (src[i] === q) return i;
        i++;
    }
    return i;
}
function 切函数(src, 头) {
    const i = src.indexOf(头);
    if (i < 0) throw new Error('切函数失败：找不到「' + 头 + '」——源码形状变了，探针该跟着改');
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
// 单点翻转：只在锚点之后把「<=0 就收手」那一道闸门按住不走（用来复现改前的谎）
function 按死闸门(源码, 变量名) {
    const 旧 = 'if (' + 变量名 + ' <= 0) {';
    const i = 源码.indexOf(旧);
    if (i < 0) throw new Error('改前复现：找不到「' + 旧 + '」——那一支的形状变了');
    return 源码.slice(0, i) + 'if (false) {' + 源码.slice(i + 旧.length);
}

// ============ 公共沙箱 ============
function 造窗() {
    const W = {
        console: { log: function () { }, warn: function () { }, error: function () { } },
        setTimeout: function (f) { if (typeof f === 'function') f(); return 0; },
        localStorage: { getItem: function () { return null; }, setItem: function () { }, removeItem: function () { } },
        document: {
            getElementById: function () { return null; },
            querySelector: function () { return null; },
            querySelectorAll: function () { return []; },
            createElement: function () {
                return { style: {}, classList: { add() { }, remove() { }, contains() { return false; } }, dataset: {}, innerHTML: '', appendChild() { }, addEventListener() { } };
            },
            addEventListener: function () { },
            head: { appendChild() { } },
            body: { appendChild() { }, insertAdjacentHTML() { } }
        },
        alert: function () { }, confirm: function () { return false; }
    };
    W.window = W;
    W._msgs = [];
    W._tones = [];
    W._logs = [];
    W._记 = [];
    W._计时 = [];
    W.showMessage = function (t, ty) { W._msgs.push(String(t)); W._tones.push(ty); };
    W.showModal = function (h, b) { W._msgs.push(String(h) + '｜' + String(b)); W._tones.push('modal'); };
    W.gameLog = { add: function (t) { W._logs.push(String(t)); } };
    W.log = function (t) { W._logs.push(String(t)); };
    W.timeSystem = {
        gameTime: { totalMinutes: 8 * 60, currentDay: 7 },
        getAbsoluteDay: function () { return 7; },
        advanceTime: function (m, r) { W._计时.push([m, r]); }
    };
    W.updateCharacterStatus = function () { };
    W.updateInventoryUI = function () { };
    W.updateCurrencyUI = function () { };
    W.updateAllStatDisplays = function () { };
    W.updatePartyUI = function () { };
    W.EventBus = { emit(t, p) { W._记.push(['emit', t]); }, on() { } };
    W.WorldJournal = { record: function (e) { W._记.push(['journal', String(e && e.text)]); } };
    W.StateRegistry = { register: function () { return function () { }; } };
    W.itemById = {
        pill_big_recovery: { name: '大还丹' }, mat_purple_gold: { name: '紫精铜' }, mat_iron_ore: { name: '铁矿石' },
        pill_foundation: { name: '筑基丹' }, iron_sword: { name: '铁剑' }, mat_demon_beast_core: { name: '妖兽内丹' },
        mat_five_element_essence: { name: '五行精华' }, mat_dragon_crystal: { name: '龙晶' },
        spec_transfer_stone: { name: '传送石' }, spec_key: { name: '旧钥匙' }, spec_map_fragment: { name: '密图残片' },
        mat_dragon_scale: { name: '龙鳞' }, wpn_dark_iron_sword: { name: '玄铁古剑' }, food_roasted_meat: { name: '烤肉' },
        food_basic_fish: { name: '鲤鱼' }, food_carp: { name: '鲫鱼' }, food_grass_carp: { name: '草鱼' },
        mat_lingzhi: { name: '灵药' }, mat_ginseng: { name: '人参' }, mat_spirit_grass: { name: '灵草' },
        mat_meteorite: { name: '陨铁' }, foundation_pill: { name: '筑基丹' }, wpn_frost_moon: { name: '寒月刀' },
        art_taiji_sword: { name: '太极剑诀' }, pill_small_recovery: { name: '小还丹' }
    };
    W.inventory = { currency: { spiritStones: 100, copper: 0 }, slots: [] };
    W.currentCharData = {
        name: '试子', realm: '金丹', layer: 1, qi: 500, maxQi: 500, hp: 100, maxHp: 100, health: 100,
        spiritStones: 100, energy: 100, tempering: 0, essence: 0, lifeSkills: {}, location: '洛水城',
        dungeonProgress: {}, dungeonClearedAt: {}
    };
    W.flags = {};
    W.__门 = {};
    W.getFlag = function (k) { return W.flags[k]; };
    W.setFlag = function (k, v) { W.flags[k] = v === undefined ? true : v; };
    W.hasFlag = function (k) { return !!W.flags[k]; };
    W.actionGate = {
        cooled: function (k) { return !!W.__门[k]; },
        mark: function (k) { W.__门[k] = true; },
        left: function () { return 1; },
        spend: function (t, a) {
            W.__支出 = W.__支出 || [];
            if (t === 'qi') {
                if ((W.currentCharData.qi || 0) < a) { W.showMessage('真气不足', 'error'); return false; }
                W.currentCharData.qi -= a;
            }
            W.__支出.push([t, a]);
            return true;
        },
        roll: function (a, b) { return b; }
    };
    vm.createContext(W);
    W._load = function (rel, 改) {
        let src = load(rel);
        if (改) src = 改(src);
        vm.runInContext(src, W, { filename: rel });
    };
    W._load串 = function (src, tag) { vm.runInContext(src, W, { filename: tag }); };
    W._最近 = function () { return W._msgs[W._msgs.length - 1] || ''; };
    W._最近tone = function () { return W._tones[W._tones.length - 1]; };
    return 装说话手(W);
}

// 第一百三十八批（DES-96/97）：沙箱里必须有真说话手，否则 货账话 拿不到从句支、
// 站点会静默落回中性话——那种红是桩的错，不是生产码的错。切的是 js/inventory.js 原文。
function 装说话手(W) {
    const 源 = load('js/inventory.js');
    const 起 = 源.indexOf('// DES-90（第一百二十八批）：发奖回执要说');
    const 止 = 源.indexOf('// ============ 第八十三波·实例账');
    if (起 < 0 || 止 < 0 || 止 <= 起) throw new Error('js/inventory.js 的说话手那一段没切到——锚点变了，探针要跟着改');
    W._load串(源.slice(起, 止), 'inventory-说话手');
    return W;
}

// 件数桩：按队列依次回报实收件数（耗尽后恒取最后一个）
function 装通道(W, 队列) {
    let i = 0;
    const 取项 = () => (i < 队列.length ? 队列[i] : 队列[队列.length - 1]);
    const 报 = function (n) {
        const 项 = 取项(); i++;
        const 收 = Array.isArray(项) ? Number(项[0]) : Number(项);
        // DES-96：桩要照 js/inventory.js 的口径落账——满件才回 null，半件压根不落笔
        W.addItemFailReason = null;
        const 账 = (Array.isArray(项) && 项.length > 1) ? 项[1] : (收 <= 0 ? 'bag_full' : null);
        if (账) W.addItemFailReason = 账;
        return 收;
    };
    W.__调用 = [];
    W.addItem = function (id, n) { W.__调用.push([id, n]); return 报(n); };
    W.addItemToInventory = function (id, n) { W.__调用.push([id, n]); return 报(n); };
    W.addResultItem = function (id, n) { return 报(n); };
    W._复位 = function () { i = 0; W.__调用 = []; };
}
// 骰子队列：第 k 次 Math.random 取第 k 个值（耗尽后恒取最后一个）
function 定骰(W, 队列) {
    let i = 0;
    vm.runInContext('Math.random = function () { return window.__骰(); }', W);
    W.__骰 = function () { const v = i < 队列.length ? 队列[i] : 队列[队列.length - 1]; i++; return v; };
}

// ============ A 奇遇扩展表：42 枚彩头都从 xGive 这一只手过 ============
console.log('\n[A] DES-89 奇遇扩展表（真装 js/items-extended/11-event-extensions.js）');
function 装奇遇(旧形) {
    const W = 造窗();
    W.randomEvents = [];                       // 顶掉 event-system.js 那一池，本表装载时往这里合并
    W.gainExp = function (n) { W._历练 = (W._历练 || 0) + n; };
    let src = load('js/items-extended/11-event-extensions.js');
    if (旧形) {
        const 头 = src.indexOf('function xGive(');
        const 尾 = src.indexOf('var EXTRA_EVENTS');
        if (头 < 0 || 尾 < 头) throw new Error('改前复现：切不到 xGive 助手——本表形状变了');
        src = src.slice(0, 头)
            + 'function xGive(msg, tone, id, cnt) { showMessage(msg, tone); if (window.addItem) window.addItem(id, cnt); return cnt; }\n    '
            + src.slice(尾);
    }
    W._load串(src, '11-event-extensions' + (旧形 ? '-旧形' : ''));
    W.__找 = function (id) { return (W.randomEvents || []).filter(function (e) { return e.id === id; })[0]; };
    W.__走 = function (id, choiceId) {
        const e = W.__找(id);
        if (!e) throw new Error('本表里没这枚事件：' + id);
        const c = e.choices.filter(function (x) { return x.id === choiceId; })[0];
        if (!c) throw new Error('事件 ' + id + ' 没有这一支：' + choiceId);
        c.effect();
    };
    return W;
}
{
    const W = 装奇遇(false);
    ok((W.randomEvents || []).length >= 30, 'A0 本表真接进了事件池（合并 ' + (W.randomEvents || []).length + ' 枚，改前也一样能装载）');

    装通道(W, [3]); W._复位(); W._msgs.length = 0; W._tones.length = 0;
    W.__走('event_merchant_caravan', 'help');
    ok(W.__调用.length === 1 && W.__调用[0][0] === 'pill_big_recovery' && W.__调用[0][1] === 3,
        'A1 救助商人：向行囊报的是 (' + JSON.stringify(W.__调用[0]) + ')——要 3 件，件数没被这批改小');
    ok(W._msgs.length === 1 && W._msgs[0] === '商人送你物品作为报酬。' && W._tones[0] === 'success',
        'A2 三件全收下：屏上还是那一句原话、还是喜色（收口没把好的一侧改坏）：' + JSON.stringify(W._msgs));

    装通道(W, [1]); W._复位(); W._msgs.length = 0; W._tones.length = 0;
    W.__走('event_merchant_caravan', 'help');
    ok(W._msgs.length === 1 && /行囊只塞得下 1\/3 件，另 2 件没带走/.test(W._msgs[0]) && W._tones[0] === 'warning',
        'A3 只剩一格：同一屏改口念实收——' + JSON.stringify(W._msgs[0]));
    ok(W._msgs[0].indexOf('商人送你物品作为报酬。') === 0,
        'A4 半收那句仍带着原话（玩家看得懂是谁给的）：' + JSON.stringify(W._msgs[0]));

    装通道(W, [0]); W._复位(); W._msgs.length = 0; W._tones.length = 0;
    W.__走('event_merchant_caravan', 'help');
    ok(/大还丹×3 一件也没能带走：行囊已满，先腾个格子再来/.test(W._最近()) && W._最近tone() === 'warning',
        'A5 满包：报的是物品名＋要给的件数，不是「收到了」——' + JSON.stringify(W._最近()));
    ok(W._最近().indexOf('商人送你物品作为报酬。') === 0,
        'A5b 满包那句仍是「商人送你…——…」一整句，不是两条互相打脸的回执');

    装通道(W, [2, 1]); W._复位(); W._msgs.length = 0; W._tones.length = 0;
    W.__走('event_demon_cultivator', 'fight');
    ok(W._msgs.length === 2 && W._msgs[0] === '你击败了邪修！' && W._msgs[1].indexOf('🎁 行囊只塞得下 1/3 件') === 0,
        'A6 两枚彩头（紫精铜那枚原本文案是空的）：第一枚照念，第二枚用「🎁」起头补实收——' + JSON.stringify(W._msgs));

    装通道(W, [0]); W._复位(); W._msgs.length = 0; W._tones.length = 0;
    const 祭0 = W.inventory.currency.spiritStones;
    W.__走('event_ancient_altar', 'offer');
    ok(W.inventory.currency.spiritStones === 祭0 - 50,
        'A7 献祭那一支：50 灵石先扣、彩头后发货——本批只把「念」接进行囊，代价次序没动（读数 ' + W.inventory.currency.spiritStones + '）');
    ok(/祭坛发出光芒！——筑基丹×1 一件也没能带走/.test(W._最近()) && W._最近tone() === 'warning',
        'A7b 满包那一屏：喜话接上「一件也没能带走」，不再单独报喜——' + JSON.stringify(W._最近()));
}
{
    const W = 装奇遇(true);      // 改前复现：助手换回「先念喜话、再丢返回值」
    装通道(W, [0]); W._复位(); W._msgs.length = 0; W._tones.length = 0;
    W.__走('event_merchant_caravan', 'help');
    ok(W._msgs.length === 1 && W._msgs[0] === '商人送你物品作为报酬。' && W._tones[0] === 'success',
        'A8 【改前复现·沙箱】行囊一件没收下，旧写法照样念那一整句喜话、照样是 success：' + JSON.stringify(W._msgs));
    const 后 = 装奇遇(false);
    装通道(后, [0]); 后._复位(); 后._msgs.length = 0;
    后.__走('event_merchant_caravan', 'help');
    ok(/也没能带走/.test(后._msgs.join('')),
        'A9 同一枚骰、同一个通道桩：改后这一屏有「没带走」，改前那屏没有——差异只在助手那一只手');
}
{
    const 源 = 去注释(load('js/items-extended/11-event-extensions.js'));
    const 裸 = (源.match(/window\.addItem\(/g) || []).length;
    const 助 = (源.match(/xGive\(/g) || []).length;
    ok(裸 === 1 && 助 >= 43,
        'A10 读码＋形状棘轮：本表行囊字面只许出现在 xGive 内部（现 addItem ' + 裸 + ' 处、xGive ' + 助 + ' 处）——绕过助手就地丢返回值即红');
}

// ============ B 钓鱼：桶里有几条，以行囊真收下为准 ============
console.log('\n[B] goFishing（从 js/app.js 切出 FISH_SPOTS＋goFishing 真调）');
function 装钓(旧形) {
    const W = 造窗();
    const 源 = load('js/app.js');
    let 体 = ['var FISH_SPOTS = {', 'function goFishing(spotType) {', 'function 货账话(账, 名目) {'].map(h => 切函数(源, h)).join('\n');
    if (旧形) {
        const 旧1 = /var got = window\.addItem[^;]*;\n\s*if \(window\.addItem && got < count\) 鱼账\.push\(window\.addItemFailReason \|\| null\);\n\s*_入桶 \+= got;\s*if \(got > 0\) gained\.push\(f\.name \+ ' x' \+ got\);/;
        if (!旧1.test(体)) throw new Error('B改前复现：钓鱼入囊那一支形状变了（第一百三十八批抄账那一行也得在场，缺了就红）');
        体 = 体.replace(旧1, "if (window.addItem) window.addItem(f.id, count);\n                gained.push(f.name + ' x' + count);");
        const 旧2 = /var _收杆 =[\s\S]*?showMessage\('🎣 收杆：'[^;]*;/;
        if (!旧2.test(体)) throw new Error('B改前复现：收杆那一屏形状变了');
        体 = 体.replace(旧2, "showMessage('🎣 收杆：' + (gained.length > 0 ? gained.join(', ') + (_rare ? '（罕见大货，满载！）' : '') : '水桶空空——鱼也看时辰'), gained.length > 0 ? 'success' : 'info');");
    }
    W._load串('(function(){\nvar currentCharData = window.currentCharData;\nfunction showMessage(t, ty) { window._msgs.push(String(t)); window._tones.push(ty); }\n'
        + 体 + '\nwindow.__钓 = function (s) { goFishing(s); };\n})();', 'app-钓鱼' + (旧形 ? '-旧形' : ''));
    return W;
}
{
    const W = 装钓(false);
    ok(typeof W.__钓 === 'function', 'B0 FISH_SPOTS 与 goFishing 两支私有件从 app.js 切出来并接进了沙箱');

    定骰(W, [0.95, 0.0]); 装通道(W, [0]); W._复位(); W._msgs.length = 0; W._tones.length = 0;
    W.__钓('river');
    ok(W.__调用.length === 3 && W.__调用.every(c => c[1] === 2),
        'B1 骰面：三条鱼各咬钩 2 条（共 6 条），逐条问过行囊（调用 ' + W.__调用.length + ' 次）');
    ok(/一条也没装下，只得放了生/.test(W._最近()) && W._最近().indexOf('鲤鱼') < 0,
        'B2 满包那一屏不再列鱼名——' + JSON.stringify(W._最近()));
    ok(W._最近().indexOf('罕见大货，满载') < 0 && W._最近tone() === 'warning',
        'B3 「罕见大货，满载！」这条喜话要一条没跑才念得出口（tone ' + W._最近tone() + '）');

    定骰(W, [0.95, 0.0]); 装通道(W, [1, 0]); W._复位(); W._msgs.length = 0; W._tones.length = 0;
    W.__钓('river');
    // 第一百三十八批：桩落了账（首件半包不落笔、后两件零收各落一笔 bag_full）⇒ 一竿之内缘由不一，
    // 屏上只许说「各件缘由不一」，不许拿末件的满包糊整竿；半截话里更不许钉进句号（DES-97）
    ok(/^🎣 收杆：鲤鱼 x1（另 5 条脱手时跑了：各件缘由不一）$/.test(W._最近()) && W._最近().indexOf('x5') < 0 && W._最近tone() === 'warning',
        'B4 半收：只念真进桶的那 1 条，另 5 条如实说跑了（掺账不糊成一笔）——' + JSON.stringify(W._最近()));

    定骰(W, [0.95, 0.0]); 装通道(W, [2]); W._复位(); W._msgs.length = 0; W._tones.length = 0;
    const 精0 = W.currentCharData.energy, 计0 = W._计时.length;
    W.__钓('river');
    ok(/鲤鱼 x2, 鲫鱼 x2, 草鱼 x2（罕见大货，满载！）/.test(W._最近()) && W._最近tone() === 'success',
        'B5 全收那一屏照旧（读数 ' + JSON.stringify(W._最近()) + '）');
    ok(W.currentCharData.energy === 精0 - 10 && W._计时.length === 计0 + 1,
        'B6 精力 −10、时辰 +30 一笔没动（数值账）');

    定骰(W, [0.03]); 装通道(W, [0]); W._复位(); W._msgs.length = 0;
    W.__钓('river');
    ok(W.__调用.length === 0 && /线断了/.test(W._最近()),
        'B7 断线那一支不受本批影响：不叫行囊、也不念收杆');
}
{
    const W = 装钓(true);
    定骰(W, [0.95, 0.0]); 装通道(W, [0]); W._复位(); W._msgs.length = 0; W._tones.length = 0;
    W.__钓('river');
    ok(/^🎣 收杆：鲤鱼 x2, 鲫鱼 x2, 草鱼 x2（罕见大货，满载！）/.test(W._最近()) && W._最近tone() === 'success',
        'B8 【改前复现·沙箱】行囊一条没收下，旧写法仍念「鲤鱼 x2, 鲫鱼 x2, 草鱼 x2（罕见大货，满载！）」：' + JSON.stringify(W._最近()));
}

// ============ C 秘境：彩头进没进囊问行囊，通关本身照算 ============
console.log('\n[C] 秘境（exploreDungeonFloor／onDungeonBattleResolved，从 js/app.js 切出真调）');
function 装秘境(改) {
    const W = 造窗();
    const 源 = load('js/app.js');
    // 三座秘境分池后，结算那两条路径要向「取数的那只手」要本座的脸与进度账，
    //   故切片表把这四只一并切进来（数据跟着取数的手走，沙箱里才不会是 undefined）。
    let 体 = ['function exploreDungeonFloor() {', 'function onDungeonBattleResolved(won) {', 'function 货账话(账, 名目) {',
        'function dungeonFaceTable() {', 'function dungeonFaceOf(dungeonId) {',
        'function dungeonNoteReached(dungeonId, floor, cap) {', 'function dungeonNoteCleared(dungeonId, cap) {'
    ].map(h => 切函数(源, h)).join('\n');
    if (改) 体 = 改(体);
    W._load串('(function(){\nvar currentCharData = window.currentCharData;\nvar dungeonState = null;\n'
        + 'function showMessage(t, ty) { window._msgs.push(String(t)); window._tones.push(ty); }\n'
        + 'function pickDungeonEvent() { return window.__事件; }\n'
        + 'function confirm() { return false; }\n'
        + 体 + '\n'
        + 'window.__探 = function (st, ev) { dungeonState = st; window.__事件 = ev; exploreDungeonFloor(); };\n'
        + 'window.__战 = function (st, won) { dungeonState = st; onDungeonBattleResolved(won); };\n'
        + '})();', 'app-秘境');
    W.__找句 = function (re) { const i = W._msgs.findIndex(m => re.test(m)); return i < 0 ? '' : W._msgs[i]; };
    W.__找tone = function (re) { const i = W._msgs.findIndex(m => re.test(m)); return i < 0 ? undefined : W._tones[i]; };
    W.__满层 = function () {
        return { active: true, id: 'r', name: '古城秘境', floor: 3, maxFloor: 3, _awaitingBattle: true };
    };
    return W;
}
{
    const W = 装秘境();

    定骰(W, [0.0]); 装通道(W, [0]); W._复位(); W._msgs.length = 0; W._tones.length = 0;
    W.__探({ active: true, id: 'r', name: '秘境', floor: 1, maxFloor: 9 }, { type: 'rare_treasure', msg: 'x' });
    ok(/仍留在箱盖上/.test(W.__找句(/闪耀宝箱/)) && W.__找句(/闪耀宝箱/).indexOf('与七品') < 0 && W.__找tone(/闪耀宝箱/) === 'warning',
        'C1 闪耀宝箱满包：灵石照进账、那件七品改口「仍留在箱盖上」——' + JSON.stringify(W.__找句(/闪耀宝箱/)));

    定骰(W, [0.0]); 装通道(W, [1]); W._复位(); W._msgs.length = 0; W._tones.length = 0;
    W.__探({ active: true, id: 'r', name: '秘境', floor: 1, maxFloor: 9 }, { type: 'rare_treasure', msg: 'x' });
    ok(W.__找句(/闪耀宝箱/).indexOf('与七品！') > 0 && W.__找tone(/闪耀宝箱/) === 'success', 'C2 收下时照旧念「与七品！」');

    定骰(W, [0.9, 0.0]); 装通道(W, [0]); W._复位(); W._msgs.length = 0; W._tones.length = 0;
    W.__探({ active: true, id: 'r', name: '秘境', floor: 1, maxFloor: 9 }, { type: 'herb_garden', msg: 'x' });
    ok(/一株也没能带走/.test(W.__找句(/灵药/)) && W.__找句(/灵药/).indexOf('采集到') < 0 && W.__找tone(/灵药/) === 'warning',
        'C3 灵药园满包（骰出 3 株）：不念「采集到 N 株」——' + JSON.stringify(W.__找句(/灵药/)));

    定骰(W, [0.9, 0.0]); 装通道(W, [1, 0, 0]); W._复位(); W._msgs.length = 0; W._tones.length = 0;
    W.__探({ active: true, id: 'r', name: '秘境', floor: 1, maxFloor: 9 }, { type: 'herb_garden', msg: 'x' });
    ok(/采集到 1 株灵药！/.test(W.__找句(/株灵药/)) && /另有 2 株：行囊已满，先腾个格子再来）/.test(W.__找句(/株灵药/)) && W.__找tone(/株灵药/) === 'warning'
        && !/。，|。）/.test(W.__找句(/株灵药/)),
        'C4 三株只塞得下一株：念 1 株、明写另 2 株没带走（缘由问这两株自己的账，句号不落在括号里）——' + JSON.stringify(W.__找句(/株灵药/)));

    定骰(W, [0.9, 0.0]); 装通道(W, [1]); W._复位(); W._msgs.length = 0; W._tones.length = 0;
    W.__探({ active: true, id: 'r', name: '秘境', floor: 1, maxFloor: 9 }, { type: 'herb_garden', msg: 'x' });
    ok(W.__找句(/株灵药/) === '采集到 3 株灵药！' && W.__找tone(/株灵药/) === 'success',
        'C4b 三株全收下（桩子恒报 1，逐株都收到）：句子里不许有「塞不下」（读数 ' + JSON.stringify(W.__找句(/株灵药/)) + '）');

    定骰(W, [0.0]); 装通道(W, [0]); W._复位(); W._msgs.length = 0; W._tones.length = 0;
    W.__探({ active: true, id: 'r', name: '秘境', floor: 1, maxFloor: 9 }, { type: 'treasure_map', msg: 'x' });
    ok(/仍埋在土里/.test(W.__找句(/藏宝图/)) && W.__找句(/藏宝图/).indexOf('和五行精华！') < 0,
        'C5 藏宝图满包：精华改口「仍埋在土里」——' + JSON.stringify(W.__找句(/藏宝图/)));

    定骰(W, [0.0]); 装通道(W, [0]); W._复位(); W._msgs.length = 0; W._tones.length = 0;
    const 石0 = W.inventory.currency.spiritStones;
    W.__探(W.__满层(), { type: 'inscription', msg: 'x' });
    // 秘境进度那一栏的真语义已改成「历史最深层」：这座沙箱秘境 3 层（__满层 maxFloor=3），
    // 通关就是到过第 3 层 —— 旧码在这里写 1，拿最深层那栏冒充「下次从哪儿进」，
    // 于是通完关重进变第 1 层、屏上还念「历史进度：第 1 层」。现在写 3。
    ok(/仍留在秘境内/.test(W._最近()) && W.currentCharData.dungeonProgress['r'] === 3,
        'C6 通关彩头满包：那件东西留在境内，但通关是真通关（最深层记 3，不是旧码那枚骗人的 1）——' + JSON.stringify(W._最近()));

    定骰(W, [0.0]); 装通道(W, [1]); W._复位(); W._msgs.length = 0; W._tones.length = 0;
    W.__探(W.__满层(), { type: 'inscription', msg: 'x' });
    ok(W._最近tone() === 'success' && /通关！获得/.test(W._最近()) && W._最近().indexOf('仍留在秘境内') < 0,
        'C7 通关彩头收下时：念名字、不带「留在境内」那半句（读数 ' + JSON.stringify(W._最近()) + '）');
    ok(W.__调用.length === 1 && ['iron_sword', 'foundation_pill', 'mat_lingzhi'].indexOf(W.__调用[0][0]) >= 0,
        'C8 通关彩头报的仍是原来那三选一（掉落表没被这批动）：' + JSON.stringify(W.__调用[0]));

    装通道(W, [0]); W._复位(); W._msgs.length = 0; W._tones.length = 0; W._记.length = 0;
    W.__战(W.__满层(), true);
    ok(/那件稀有装备没能带走/.test(W._最近()) && W._最近tone() === 'warning',
        'C9 打赢守卫通关那一屏：装备没进囊就明说没带走——' + JSON.stringify(W._最近()));
    ok(W.currentCharData.dungeonProgress['r'] === 3 && W._记.some(x => x[1] === 'dungeon:completed'),
        'C10 同一屏：通关进度（最深层 3）与 dungeon:completed 事件照旧（彩头是附加，不是通关的门票）');
    ok(W.inventory.currency.spiritStones > 石0, 'C11 通关灵石照进账（300＋手头 100 起）');

    装通道(W, [1]); W._复位(); W._msgs.length = 0; W._tones.length = 0;
    W.__战(W.__满层(), true);
    ok(W._最近().indexOf('与稀有装备') > 0 && W._最近tone() === 'success', 'C12 装备收下时照旧念「与稀有装备」');
}
{
    // 改前复现：把 herb_garden 那一支的「问实收」按回旧形
    const W = 装秘境(体 => {
        const 锚 = /var _药收 = 0[\s\S]*?herbCount \? 'success' : 'warning'\);/;
        if (!锚.test(体)) throw new Error('C13 改前复现：地宫药田那一支形状变了（第一百三十八批之后应以「var _药收 = 0, 灵药账 = []」起头）');
        return 体.replace(锚,
            "var _药收 = 0; for (var h = 0; h < herbCount; h++) { var herb = herbs[Math.floor(Math.random() * herbs.length)]; if (typeof window.addItem === 'function') window.addItem(herb, 1); _药收++; } showMessage(_药收 > 0 ? '采集到 ' + _药收 + ' 株灵药！' : '', 'success');");
    });
    定骰(W, [0.9, 0.0]); 装通道(W, [0]); W._复位(); W._msgs.length = 0; W._tones.length = 0;
    W.__探({ active: true, id: 'r', name: '秘境', floor: 1, maxFloor: 9 }, { type: 'herb_garden', msg: 'x' });
    ok(W.__找句(/株灵药/) === '采集到 3 株灵药！' && W.__找tone(/株灵药/) === 'success',
        'C13 【改前复现·沙箱】行囊一株没收，旧写法照样念「采集到 3 株灵药！」还挂 success：' + JSON.stringify(W.__找句(/株灵药/)));
}

// ============ D 兽潮：兽核账本／逐波句／清剿句／游记本 三处一起说谎 ============
console.log('\n[D] settleBeastTideRaid（从 js/app.js 切出真调）');
function 装潮(旧形) {
    const W = 造窗();
    let 体 = ['function settleBeastTideRaid(won) {', 'function 货账话(账, 名目) {'].map(h => 切函数(load('js/app.js'), h)).join('\n');
    if (旧形) {
        体 = 体.replace(/var _核收[\s\S]*?var _核漏 = cores - _核收;/, 'var _核收 = cores, _核漏 = 0;');
        体 = 体.replace(/raid\.cores = \(raid\.cores \|\| 0\) \+ _核收;[\s\S]*?raid\.lostCores = \(raid\.lostCores \|\| 0\) \+ _核漏;/,
            'raid.cores = (raid.cores || 0) + cores;');
        if (体.indexOf('_核漏 = 0') < 0) throw new Error('D改前复现：兽潮那一支形状变了');
    }
    W._load串('(function(){\n' + 体 + '\nwindow.__潮 = function (w) { return settleBeastTideRaid(w); };\n})();', 'app-兽潮' + (旧形 ? '-旧形' : ''));
    return W;
}
{
    const W = 装潮(false);
    ok(typeof W.__潮 === 'function', 'D0 settleBeastTideRaid 从 app.js 切出来并接进了沙箱');

    W._tideRaid = { wave: 1, waves: 3, cores: 0, tempering: 0 };
    定骰(W, [0.9]); 装通道(W, [1]); W._复位(); W._msgs.length = 0; W._tones.length = 0;
    const 回1 = W.__潮(true);
    // 半包：账上压根不落笔（js/inventory.js:198 只在一件没进时才写 bag_full）⇒ 中性从句，不许断言满包
    ok(/兽核 ×1/.test(W._最近()) && /另有 1 枚滚回潮水里了，没能落进你的行囊）/.test(W._最近()) && W._最近tone() === 'warning'
        && /行囊已满/.test(W._最近()) === false,
        'D1 逐波句：骰出 2 枚、行囊收下 1 枚，屏上念 ×1 并补一句跑了 1 枚（半包不怪格子）——' + JSON.stringify(W._最近()));
    ok(W._tideRaid.cores === 1 && W._tideRaid.lostCores === 1,
        'D2 潮水账只记真进囊的数（cores ' + W._tideRaid.cores + '、lostCores ' + W._tideRaid.lostCores + '）');
    ok(回1.cores === 1, 'D3 返回值同样念实收（' + 回1.cores + '）');

    W._tideRaid = { wave: 3, waves: 3, cores: 1, tempering: 50 };
    定骰(W, [0.9]); 装通道(W, [1]); W._复位(); W._msgs.length = 0; W._tones.length = 0; W._记.length = 0;
    const 真0 = W.currentCharData.tempering;
    W.__潮(true);
    ok(/共得兽核 ×2/.test(W._最近()) && /另有 1 枚滚回潮水里了/.test(W._最近()),
        'D4 清剿句跟账本一致（1 已入账＋本波 1）——' + JSON.stringify(W._最近()));
    ok(W._记.some(x => x[0] === 'journal' && /共得兽核 2（另有 1 枚没能落进行囊，当场丢了）/.test(x[1])),
        'D5 游记本那一句与屏上同一数（三处文字一起改口，不许只改最显眼那一处）');
    ok(W.currentCharData.tempering === 真0 + 50, 'D6 历练 +50 一笔没动（数值账）');

    W._tideRaid = { wave: 1, waves: 2, cores: 0, tempering: 0 };
    定骰(W, [0.9]); 装通道(W, [2]); W._复位(); W._msgs.length = 0; W._tones.length = 0;
    W.__潮(true);
    ok(W._最近().indexOf('塞不下') < 0 && W._最近tone() === 'success' && W._tideRaid.cores === 2,
        'D7 两枚全收下：不带「塞不下」、还是喜色（读数 ' + JSON.stringify(W._最近()) + '）');
}
{
    const W = 装潮(true);
    W._tideRaid = { wave: 1, waves: 2, cores: 0, tempering: 0 };
    定骰(W, [0.9]); 装通道(W, [0]); W._复位(); W._msgs.length = 0; W._tones.length = 0; W._记.length = 0;
    W.__潮(true);
    ok(/兽核 ×2/.test(W._最近()) && W._tideRaid.cores === 2 && W._最近tone() === 'success',
        'D8 【改前复现·沙箱】行囊一枚没收着，旧写法账本记 2、逐波句念 ×2：' + JSON.stringify(W._最近()));
}

// ============ E 城里那五扇（真装 js/location-system.js） ============
console.log('\n[E] 皇宫密图／行贿／试炼塔／龙宫宝库／剑冢（真装 location-system.js）');
function 装城(改) {
    const W = 造窗();
    delete W.startBattle;
    W._load('js/location-system.js', 改);
    return W;
}
{
    const W = 装城();
    ok(typeof W._palaceSneak === 'function' && typeof W._prisonBribe === 'function'
        && typeof W.enterTrialTower === 'function' && typeof W.enterDragonVault === 'function'
        && typeof W._swordPull === 'function', 'E0 五扇都在导出的沙箱里够得着');

    定骰(W, [0.1]); 装通道(W, [0]); W._复位(); W._msgs.length = 0; W._tones.length = 0; W.flags = {};
    W._palaceSneak('帝都·长安');
    ok(!W.flags['palace_secret_帝都·长安'], 'E1 满包：残片没到手就不给这座城市立「已探」旗（改前一律立，玩家腾开格子也再也探不到）');
    // 第一百三十九批：宫城秘图满包那句的字面已从「这一处还没探到底，腾个格子再来。」
    //   改成「它却没能跟你走：行囊已满，先腾个格子再来。」（js/location-system.js:1162——尾巴那句骗人的
    //   「这一处还没探到底，腾个格子再来。」已被撤掉，回退文案统一过）。
    //   旧值「这一处还没探到底，腾个格子再来」→ 新值「它却没能跟你走：行囊已满，先腾个格子再来」。
    //   生产码是对的：E2 的核心要求（类型必须是 warning、且必须仍然出现真实缘由那句「行囊已满，先腾个格子再来」）
    //   原样保留，一字未松——tone 那一格没动，缘由那半句仍在，只是换了种说法。
    ok(/它却没能跟你走：行囊已满，先腾个格子再来/.test(W._最近()) && W._最近tone() === 'warning',
        'E2 满包那句是警告不是喜话——' + JSON.stringify(W._最近()));

    定骰(W, [0.1]); 装通道(W, [1]); W._复位(); W._msgs.length = 0; W._tones.length = 0;
    W._palaceSneak('洛水城');
    ok(W.flags['palace_secret_洛水城'] && W._最近() === '你摸到一份密图残片！' && W._最近tone() === 'success',
        'E3 收着了才立旗＋念喜话（收口没把好的一侧改坏）');

    装通道(W, [0]); W._复位(); W._msgs.length = 0; W._tones.length = 0;
    const 石 = W.inventory.currency.spiritStones;
    W._prisonBribe('帝都·长安');
    ok(W.inventory.currency.spiritStones === 石, 'E4 行贿满包：钥匙没接住，灵石分文不动（改前是「钱付了、钥匙没进囊」）');
    ok(!W.__门['prison_bribe'], 'E5 行贿满包：当日这一趟不烧（腾开格子明天不用等）');
    ok(/腾不出地方接/.test(W._最近()) && W._最近tone() === 'warning', 'E6 那句狱卒的话——' + JSON.stringify(W._最近()));

    装通道(W, [1]); W._复位(); W._msgs.length = 0; W._tones.length = 0;
    W._prisonBribe('帝都·长安');
    ok(W.inventory.currency.spiritStones === 石 - 100 && W.__门['prison_bribe']
        && W._最近() === '狱卒塞给你一把旧钥匙',
        'E7 同一天腾开格子后再点：钥匙进囊→再收 100→才烧名额（柜台规矩与 js/building-effects.js 的 buy() 同一条）');

    const W穷 = 装城();
    装通道(W穷, [1]); W穷._复位(); W穷._msgs.length = 0;
    W穷.inventory.currency.spiritStones = 50;
    W穷._prisonBribe('洛水城');
    ok(W穷.__调用.length === 0 && /灵石不足（需 100，手头 50）/.test(W穷._最近()),
        'E8 手头不够：先验再不动行囊，硬停句里带着实数——' + JSON.stringify(W穷._最近()));

    定骰(W, [0.0]); 装通道(W, [0]); W._复位(); W._msgs.length = 0; W._tones.length = 0;
    const 磨0 = W.currentCharData.tempering;
    W.enterTrialTower('帝都·长安');
    ok(W.currentCharData.tempering === 磨0 + 100 && /只好留在原地/.test(W._最近()) && W._最近tone() === 'warning',
        'E9 试炼塔：历练是真磨出来的（+100 照给），那枚丹没进囊就说留在原地——' + JSON.stringify(W._最近()));

    定骰(W, [0.1]); 装通道(W, [0]); W._复位(); W._msgs.length = 0; W._tones.length = 0;
    const 气0 = W.currentCharData.qi;
    W.enterDragonVault('东海');
    ok(W.currentCharData.qi === 气0 - 30 && /这一趟白花了真气与今日名额/.test(W._最近()) && W._最近tone() === 'warning',
        'E10 龙宫宝库满包：念的是「白花了真气与今日名额」——代价照付那一族，本批只撤谎、账等裁（读数 ' + JSON.stringify(W._最近()) + '）');

    定骰(W, [0.1]); 装通道(W, [1]); W._复位(); W._msgs.length = 0; W._tones.length = 0;
    W._swordPull();
    ok(W._最近() === '古剑认可了你！' && W._最近tone() === 'success', 'E11 剑冢收下时照旧');
    定骰(W, [0.1]); 装通道(W, [0]); W._复位(); W._msgs.length = 0; W._tones.length = 0;
    W._swordPull();
    ok(/它又落回剑冢/.test(W._最近()) && W._最近tone() === 'warning',
        'E12 剑认可你却带不走：这句现在会说实话——' + JSON.stringify(W._最近()));
}
{
    const W = 装城(src => 按死闸门(src, '_残片收'));
    定骰(W, [0.1]); 装通道(W, [0]); W._复位(); W._msgs.length = 0; W.flags = {};
    W._palaceSneak('帝都·长安');
    ok(W.flags['palace_secret_帝都·长安'] === true,
        'E13 【改前复现·沙箱】把那道「没收着就收手」的闸门按住不走：满包时残片没进囊，城市却从此不再让你探（旗已立）');
}
{
    const W = 装城(src => 按死闸门(src, '_钥匙收'));
    定骰(W, [0.1]); 装通道(W, [0]); W._复位(); W._msgs.length = 0;
    const 石 = W.inventory.currency.spiritStones;
    W._prisonBribe('帝都·长安');
    ok(W.inventory.currency.spiritStones === 石 - 100 && !!W.__门['prison_bribe'],
        'E14 【改前复现·沙箱】旧顺序：钥匙没进囊照样扣 100 灵石、照样烧掉当日名额');
}

// ============ F 声望那三扇（真装 js/reputation-system.js） ============
console.log('\n[F] 隐藏商店／秘传功法／隐藏地宫（真装 reputation-system.js）');
function 装望(改) {
    const W = 造窗();
    delete W.startBattle;
    W._load('js/reputation-system.js', 改);
    return W;
}
{
    const W = 装望();
    ok(typeof W._buyHiddenShopItem === 'function' && typeof W._buySecretArt === 'function'
        && typeof W.enterHiddenDungeon === 'function', 'F0 三扇够得着（顶层函数声明＝全局可见）');
    ['帝都·长安', '洛水城', '剑阁'].forEach(function (c) { W.setReputation(c, 10000); });
    ok(W.hasUnlockedFeature('帝都·长安', 'hidden_dungeon'),
        'F0b 沙箱先把三城声望顶到「万人敬仰」——隐藏地宫那道门槛是机制本分，本批没放宽它');

    装通道(W, [0]); W._复位(); W._msgs.length = 0; W._tones.length = 0;
    const 石 = W.inventory.currency.spiritStones;
    W._buyHiddenShopItem('pill_foundation', 80, '帝都·长安');
    ok(W.inventory.currency.spiritStones === 石, 'F1 隐藏商店满包：整单不做，灵石分文不动（改前扣 80 还念「购得隐藏商品」）');
    ok(/这一单先不做/.test(W._最近()) && W._最近tone() === 'warning', 'F2 那句退单的话——' + JSON.stringify(W._最近()));

    装通道(W, [1]); W._复位(); W._msgs.length = 0; W._tones.length = 0;
    W._buyHiddenShopItem('pill_foundation', 80, '帝都·长安');
    ok(W.inventory.currency.spiritStones === 石 - 80 && W._最近() === '购得隐藏商品',
        'F3 货进囊了才收钱（同一条柜台规矩：先交货、后收钱、再记声望）');

    装通道(W, [0]); W._复位(); W._msgs.length = 0; W._tones.length = 0;
    W.inventory.currency.spiritStones = 1000;
    const 石2 = W.inventory.currency.spiritStones;
    W._buySecretArt('art_dugu_sword', 200, '剑阁');
    ok(W.inventory.currency.spiritStones === 石2 && /又收了回去/.test(W._最近()) && W._最近tone() === 'warning',
        'F4 秘传功法满包：残卷没进囊不收钱，师父把它收回去——' + JSON.stringify(W._最近()));

    装通道(W, [1]); W._复位(); W._msgs.length = 0; W._tones.length = 0;
    W._buySecretArt('art_dugu_sword', 200, '剑阁');
    ok(W.inventory.currency.spiritStones === 石2 - 200 && W._最近() === '习得秘传残卷！',
        'F5 残卷进囊了才收钱、才念「习得」');

    定骰(W, [0.0]); 装通道(W, [0]); W._复位(); W._msgs.length = 0; W._tones.length = 0;
    const 磨 = W.currentCharData.tempering;
    W.enterHiddenDungeon('帝都·长安');
    ok(W.currentCharData.tempering === 磨 + 200 && /没能落进你的行囊/.test(W._最近()) && W._最近tone() === 'warning',
        'F6 地宫（无战斗兜底支）满包：历练照给、两件东西明说没装走——' + JSON.stringify(W._最近()));

    定骰(W, [0.5]); 装通道(W, [1]); W._复位(); W._msgs.length = 0; W._tones.length = 0;
    W.enterHiddenDungeon('洛水城');
    ok(W._最近() === '地宫探索有所收获！' && W._最近tone() === 'success',
        'F7 龙晶收下、界石那枚没掷中：念「有所收获」不带「塞不下」（骰 0.5 不中界石，读数 ' + JSON.stringify(W._最近()) + '）');

    定骰(W, [0.2]); 装通道(W, [1, 0]); W._复位(); W._msgs.length = 0; W._tones.length = 0;
    W.enterHiddenDungeon('剑阁');
    ok(/另有 1 件：行囊已满，先腾个格子再来，仍留在石室里）/.test(W._最近()) && W._最近tone() === 'warning'
        && !/。，|。）/.test(W._最近()),
        'F8 两件该收、行囊只吞得下一件：明写另 1 件留在石室里（这一屏从前钉破过句号：「再来。，仍留在」）——' + JSON.stringify(W._最近()));
}
{
    const W = 装望(src => 按死闸门(src, '_购得'));
    装通道(W, [0]); W._复位(); W._msgs.length = 0;
    const 石 = W.inventory.currency.spiritStones;
    W._buyHiddenShopItem('pill_foundation', 80, '帝都·长安');
    ok(W.inventory.currency.spiritStones === 石 - 80 && W._最近() === '购得隐藏商品',
        'F9 【改前复现·沙箱】按住那道闸门不走：旧写法扣 80 灵石、声望照记、屏上还念「购得隐藏商品」');
}

// ============ G 门派庆典 + 瓦舍柜台兜底支 ============
console.log('\n[G] 门派庆典烤肉／building-effects 柜台兜底支');
{
    const W = 造窗();
    W._load('js/sects/sect-events.js');
    W.discipleState = { isInSect: true, sectId: '青云门', contribution: 0 };
    const 效 = W.SECT_EVENTS_POOL['grand_festival'].effect;
    ok(typeof 效 === 'function', 'G0 庆典事件够得着');

    装通道(W, [0]); W._复位();
    ok(效('青云门').indexOf('（灶上的烤肉你两块也没能带走：行囊已满，先腾个格子再来）') > 0 && !/。，|。）/.test(效('青云门')),
        'G1 满包：回执里补一行没吃着（缘由在括号里，句号不许落在括号前）——' + JSON.stringify(效('青云门')));
    装通道(W, [1]); W._复位();
    ok(效('青云门').indexOf('，烤肉 ×1') > 0, 'G2 只塞得下一块：念 ×1（不念 ×2）');
    装通道(W, [2]); W._复位();
    ok(效('青云门').indexOf('，烤肉 ×2') > 0, 'G3 两块都收下：念 ×2');
}
{
    const W = 造窗();
    const 体 = 切函数(load('js/building-effects.js'), 'buy: function(itemId, price) {');
    W._load串('(function(){\nfunction showMessage(t, ty) { window._msgs.push(String(t)); window._tones.push(ty); }\nvar o = {'
        + 体 + '};\nwindow.__买 = function (i, p) { return o.buy(i, p); };\n})();', 'building-effects-buy');
    ok(typeof W.__买 === 'function', 'G4 柜台 buy 方法从 building-effects.js 切出来并接进了沙箱');
    delete W.addItem;
    装通道(W, [0]); W._复位(); W._msgs.length = 0;
    const 石 = W.inventory.currency.spiritStones;
    const 回 = W.__买('healing_pill', 20);
    ok(回 === false && W.inventory.currency.spiritStones === 石,
        'G5 兜底支（只有 addItemToInventory 时）：实收 0 件＝这一单不做、灵石不退不回（改前硬写 added = true）');
    ok(/背包已满或物品无效/.test(W._最近()), 'G6 那一屏念的是「背包已满或物品无效」：' + JSON.stringify(W._最近()));
    装通道(W, [1]); W._复位(); W._msgs.length = 0;
    ok(W.__买('healing_pill', 20) === true && W.inventory.currency.spiritStones === 石 - 20,
        'G7 兜底支收下 1 件时才扣钱');
}

// ============ H 两本账棘轮：副账归零钉死 ============
console.log('\n[H] 棘轮与普查');
{
    function walk(d, out) {
        for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
            const p = d + '/' + e.name;
            if (e.isDirectory()) walk(p, out);
            else if (e.name.endsWith('.js')) out.push(p);
        }
        return out;
    }
    const 主 = [], 副 = [];
    for (const rel of walk('js', [])) {
        去注释(load(rel)).split('\n').forEach((s, i) => {
            if (!/window\.(addItem|addResultItem|addItemToInventory)\s*\(/.test(s)) return;
            if (/=/.test(s.split(/window\.(addItem|addResultItem|addItemToInventory)/)[0])) return;
            if (/\breturn\b|!window\.|\?|&&|\|\|/.test(s)) return;
            (/\bif\s*\(/.test(s) ? 副 : 主).push(rel + ':' + (i + 1));
        });
    }
    ok(副.length === 0, 'H1 副账（同行带 if 守卫的裸调用）第一百二十七批归零：开案 48 → 38 → 0，**只准为 0**（现读 '
        + 副.length + (副.length ? '：\n      ' + 副.join('\n      ') : '') + '）');
    ok(主.length === 0, 'H2 主账 23 → 18 → 16 → 15 → **第一百三十批 0**（余 15 处全收口）：只准为 0，多一处即红（现读 ' + 主.length + (主.length ? '：\n      ' + 主.join('\n      ') : '') + '）');
    const 标 = walk('js', []).reduce((n, rel) => n + (load(rel).match(/第一百二十七批/g) || []).length, 0);
    ok(标 >= 16, 'H3 本批登记在源码里的「第一百二十七批」标记 ' + 标 + ' 处（16 个点位各一枚）——撤掉一处即红');
    const 问实收 = walk('js', []).reduce((n, rel) =>
        n + (去注释(load(rel)).match(/Number\(\s*window\.(addItem|addItemToInventory|addResultItem)\s*\(/g) || []).length, 0);
    ok(问实收 >= 54, 'H4 「问实收」这一种写法是只准增的账：全仓现读 ' + 问实收 + ' 处（一百二十四～一百二十七批累计）');
}

console.log('\n=== 第一百二十七批套件：通过 ' + 通过 + ' / 失败 ' + 失败 + ' ===');
if (失败 > 0) process.exitCode = 1;
