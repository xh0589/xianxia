// 第一百三十八批 · 账要跟到货身上（DES-96）＋ 半截话不许钉破句号（DES-97）
// 上一批（一百三十五）量的是「问得到账时有没有照账念」；这一批量的是**账能不能活着走到那一句**：
//   全局只有 addItemFailReason 一条（js/inventory.js:180 进函数先清、:198 一件没进才落 bag_full），
//   于是三种场合必然错账——① 一问多件（循环外只读得到末件的账）；
//   ② 半包（账上压根不落笔，视图层却照念「行囊已满」）；
//   ③ 先发货后拼串（passTime→推世界时钟→别人的发货把这条全局账刷走）。
// DES-97 是同一刀的文案半：缘由常被拼进「（另 3 件…）」这种半截话里，
//   而句尾带圆点的说话手会在屏上留下「再来。，」「行囊。）」——今日实机屏上就有这几处。
// 证据分两档，逐条标出：vm 行为＝真文件／真函数装进沙箱真调；读码＝源码形状断言。
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
function 有(rel) { return fs.existsSync(path.join(ROOT, rel)); }
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
        if (ch === '{') depth++;
        else if (ch === '}') { depth--; if (!depth) return src.slice(i, k + 1); }
    }
    throw new Error('切函数失败：「' + 头 + '」没有闭合');
}
function 改一处(src, 锚, 旧, 新) {
    const i = src.indexOf(锚);
    if (i < 0) throw new Error('改前复现失败：找不到锚「' + 锚 + '」');
    const j = src.indexOf(旧, i);
    if (j < 0) throw new Error('改前复现失败：「' + 锚 + '」之后找不到待改的「' + 旧 + '」');
    return src.slice(0, j) + 新 + src.slice(j + 旧.length);
}
// 说话手不在测试里另抄一份措辞——直接从 js/inventory.js 切那一段真装（抄一份就会与真源各说各话）
const 说话手段 = (function () {
    const 源 = load('js/inventory.js');
    const 起 = 源.indexOf('// DES-90（第一百二十八批）：发奖回执要说');
    const 止 = 源.indexOf('// ============ 第八十三波·实例账');
    if (起 < 0 || 止 < 0 || 止 <= 起) throw new Error('js/inventory.js 的说话手那一段没切到——锚点变了，探针要跟着改');
    return 源.slice(起, 止);
})();

// ============ 公共沙箱 ============
function 造窗(改) {
    const W = {
        console: { log: function () { }, warn: function () { }, error: function () { } },
        setTimeout: function () { return 0; },
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
        alert: function () { }
    };
    W.window = W;
    W._msgs = [];
    W.showMessage = function (t) { W._msgs.push(String(t)); };
    W.gameLog = { add: function () { } };
    W.log = function () { };
    W.timeSystem = { gameTime: { totalMinutes: 8 * 60, currentDay: 7 }, advanceTime: function () { } };
    W.updateCharacterStatus = function () { };
    W.updateInventoryUI = function () { };
    W.updateCurrencyUI = function () { };
    W.updateAllStatDisplays = function () { };
    W.itemById = {
        mat_lingzhi: { name: '灵药' }, mat_refined_iron: { name: '精铁' }, mat_moon_stone: { name: '明月石' },
        mat_beast_fang: { name: '兽牙' }, chaos_beast_pelt: { name: '混沌兽皮' }, mat_nine_leaf_lingzhi: { name: '九叶灵芝' },
        mat_heaven_heart_flower: { name: '天心莲' }, mat_five_element_essence: { name: '五行精华' }, pill_small_recovery: { name: '回气丹' }
    };
    W.inventory = { currency: { spiritStones: 100, copper: 0 }, slots: [] };
    W.currentCharData = {
        name: '试子', realm: '化神', layer: 1, qi: 9999, maxQi: 9999, hp: 100, maxHp: 100, health: 100,
        spiritStones: 100, energy: 100, location: '灵界·蓬莱仙境'
    };
    W.flags = {};
    vm.createContext(W);
    W._load = function (rel, 改2) {
        let src = load(rel);
        if (改2) src = 改2(src);
        vm.runInContext(src, W, { filename: rel });
    };
    W._load串 = function (src, tag) { vm.runInContext(src, W, { filename: tag }); };
    W._最近 = function () { return W._msgs[W._msgs.length - 1] || ''; };
    W._load串(说话手段, 'inventory-说话手');
    if (改) 改(W);
    return W;
}
// 入库通道桩：队列项＝[实收件数] 或 [实收件数, 账]。
// 账缺省时按 js/inventory.js:180／:198 的真口径推：进函数先清账，一件没进才落 bag_full，半包不落笔。
function 装通道(W, 队列) {
    let i = 0;
    W.__调用 = 0;
    W.addItem = function (id, n) {
        const 项 = i < 队列.length ? 队列[i] : 队列[队列.length - 1]; i++;
        W.__调用++; W.__最后 = [id, n];
        W.addItemFailReason = null;
        const 收 = Array.isArray(项) ? Number(项[0]) : Number(项);
        const 账 = (Array.isArray(项) && 项.length > 1) ? 项[1] : (收 <= 0 ? 'bag_full' : null);
        if (账) W.addItemFailReason = 账;
        return 收;
    };
    W.addItemToInventory = W.addItem;
    W._复位 = function () { i = 0; W.__调用 = 0; };
}
function 定骰(W, 队列) {
    let i = 0;
    vm.runInContext('Math.random = function () { return window.__骰(); }', W);
    W.__骰 = function () { const v = i < 队列.length ? 队列[i] : 队列[队列.length - 1]; i++; return v; };
}

// ============ A 真源说话手：快照层／从句层各管一段 ============
console.log('\n[A] 说话手两层（js/inventory.js 那一段真装进沙箱）');
{
    const W = 造窗();
    ok(typeof W.addItemFailTextFor === 'function' && typeof W.addItemReasonTextFor === 'function'
        && typeof W.addItemFailPhraseFor === 'function' && typeof W.addItemReasonPhraseFor === 'function',
        'A0 快照层两支＋从句层两支都在（薄封装另有两支，见 A5）');
    ok(W.addItemFailTextFor('bag_full', '灵药') === '行囊已满，先腾个格子再来。'
        && W.addItemFailTextFor('no_template', '灵药') === '灵药在百宝册上查无此号——是这件东西没有名目，不是你的行囊满了。',
        'A1 零收支照账点名：满包怪格子，缺档怪名目（不再是同一句）');
    ok(W.addItemFailTextFor(null, '灵药') === '' && W.addItemFailTextFor(undefined) === '',
        'A2 零收支问不到账 ⇒ 空串（缘由不归这一屏说，站点自己收口）：' + JSON.stringify(W.addItemFailTextFor(null, '灵药')));
    ok(W.addItemReasonTextFor(null, '灵药') === '没能落进你的行囊。' && W.addItemReasonTextFor('bag_full', '灵药') === '行囊已满，先腾个格子再来。',
        'A3 半包支有自己的中性话（半包时账上不落笔，问错支就落回「行囊已满」）');
    const 句尾 = ['bag_full', 'no_template', null].map(r => W.addItemFailPhraseFor(r, '灵药'));
    ok(句尾.every(s => s === '' || !/[。，]$/.test(s)),
        'A4（DES-97）从句支一支都不带句号——它是拼进「（另 N 件…）」里用的：' + JSON.stringify(句尾));
    ok(W.addItemFailPhraseFor(['bag_full', 'bag_full'], '灵药') === W.addItemFailPhraseFor('bag_full', '灵药')
        && W.addItemFailPhraseFor(['bag_full'], '灵药') === '行囊已满，先腾个格子再来'
        && W.addItemFailPhraseFor(['bag_full', 'no_template'], '灵药') === '各件缘由不一'
        && W.addItemFailPhraseFor([null, 'bag_full'], '灵药') === '各件缘由不一'
        && W.addItemFailPhraseFor([null, null], '灵药') === '',
        'A5 从句支认**一堆货的账**：全同一笔才点名，掺账（含没落笔的）就说不一，全空回空串');
    // 掺账那一笔的「不一」要先问：没落账的不是哑巴，让没落账的排在前头就把后一笔的缘由吞了（第一版真有此坑）
    ok(W.addItemFailPhraseFor(['bag_full', null], '灵药') === W.addItemFailPhraseFor([null, 'bag_full'], '灵药')
        && W.addItemFailPhraseFor([null, 'bag_full'], '灵药') === '各件缘由不一',
        'A5b 掺账的答与顺序无关：没落账那笔不当哑巴，也不许让一笔的缘由替整堆定罪');
    W.addItemFailReason = 'no_template';
    ok(W.addItemFailText('灵药') === W.addItemFailTextFor('no_template', '灵药'),
        'A6 薄封装＝读当下全局账（与快照层同措辞，两层的分工就只在账从哪儿来）');
    // 改前复现：抹掉 bag_full 那一支 ⇒ A1 量的确实是这一笔
    const 旧段 = 改一处(说话手段, 'function failTextFor(reason, label) {',
        "if (reason === 'bag_full') return '行囊已满，先腾个格子再来。';", '');
    const 旧 = 造窗();
    旧._load串('(function(){' + 旧段 + '})();', 'inventory-说话手-改前');
    ok(旧.addItemFailTextFor('bag_full', '灵药') === '',
        'A7 改前复现：拆掉 bag_full 那一支，同一笔账就没人认了（对照组）');
}

// ============ B 收据带账：giveWithReceipt 当场抄 ============
console.log('\n[B] giveWithReceipt 把账抄进收据（js/global-utils.js 真调）');
function 装收据手(W) {
    W._load串('(function(){\n' + 切函数(load('js/global-utils.js'), 'window.giveWithReceipt = function (id, count, opts) {') + '\n})();', 'giveWithReceipt');
    return W;
}
{
    const W = 装收据手(造窗());
    装通道(W, [[0, 'no_template']]);
    const 据 = W.giveWithReceipt('mat_lingzhi', 2, { quiet: true });
    ok(据.got === 0 && 据.reason === 'no_template',
        'B1 一件没进＋缺档：收据带着这一笔的账走（屏上拼串时不必回头读全局）：' + JSON.stringify(据));
    const W2 = 装收据手(造窗());
    装通道(W2, [[1, null]]);
    const 据2 = W2.giveWithReceipt('mat_lingzhi', 2, { quiet: true });
    ok(据2.got === 1 && 据2.reason === null,
        'B2 半包：账上不落笔，收据的 reason 也就是 null（不许凭空造一次「满包」）：' + JSON.stringify(据2));
    const W3 = 装收据手(造窗());
    装通道(W3, [[0, 'bag_full'], [1, null]]);   // 本件落空，紧接着别人发一件货把全局账刷成 null
    const 据3 = W3.giveWithReceipt('mat_lingzhi', 1);
    W3.addItem('mat_beast_fang', 1);
    ok(据3.reason === 'bag_full' && W3.addItemFailReason === null,
        'B3 发货之后全局账被刷走，收据里那一笔仍是本件自己的（DES-96 的机制本体）');
    ok(/一件也没能带走：行囊已满/.test(W3._最近()),
        'B4 收据自己上屏那一句也照快照念，不读被刷走的活账：' + JSON.stringify(W3._最近()));
    const W5 = 造窗();   // 没有入库通道的世界
    const 据5 = 装收据手(W5).giveWithReceipt('mat_lingzhi', 2, { quiet: true });
    ok(据5.got === 2 && 据5.reason === null,
        'B5 无入库通道＝全数认（与 xGive 同口径），不新增一种假失败：' + JSON.stringify(据5));
}

// ============ C 账要活过 passTime（js/map/high-planes.js 真装）============
console.log('\n[C] 先发货→推时钟→再拼串：账得活着走到那一句');
{
    const W = 装面();
    定骰(W, [0.9]); 装通道(W, [[0, 'bag_full'], [1, null]]);
    W.timeSystem.advanceTime = function () { W.addItem('mat_beast_fang', 1); };   // 日常事件顺手发一件（真链路里的常客）
    W.planeGather('灵界');
    ok(/一份也没带回/.test(W._最近()) && /行囊已满/.test(W._最近()),
        'C1 采撷落空：时钟里别人的发货刷空了全局账，屏上仍照这一趟自己的账念：' + JSON.stringify(W._最近()));

    const 旧 = 装面(src => 改一处(src, "say('🌿 ' + cfg.msg + '——采下的灵材一份也没带回",
        "货账话(采账, '这批灵材')", "货账话([window.addItemFailReason], '这批灵材')"));
    定骰(旧, [0.9]); 装通道(旧, [[0, 'bag_full'], [1, null]]);
    旧.timeSystem.advanceTime = function () { 旧.addItem('mat_beast_fang', 1); };
    旧.planeGather('灵界');
    ok(/一份也没带回/.test(旧._最近()) && !/行囊已满/.test(旧._最近()),
        'C2 改前复现：同一屏改成回头读活账（＝第一百三十八批之前的形状），缘由就又丢了（C1 量的正是这一笔）：' + JSON.stringify(旧._最近()));

    const W2 = 装面();
    定骰(W2, [0.2, 0.9, 0.9]); 装通道(W2, [[0, 'no_template'], [0, 'bag_full']]);
    W2.planeGather('灵界');
    ok(/一份也没带回/.test(W2._最近()) && /各件缘由不一/.test(W2._最近()) && !/行囊已满/.test(W2._最近()),
        'C3 一趟两笔、两笔缘由不同 ⇒ 只说「各件缘由不一」，不许拿末件的满包糊整趟：' + JSON.stringify(W2._最近()));
}
function 装面(改) {
    const W = 造窗();
    W._load('js/map/high-planes.js', 改);
    return W;
}

// ============ D 一堆货各归各账（js/app.js 逐件入囊／采药＋js/map/randomMap.js 短缺话）============
console.log('\n[D] 一问多件：一件缘由归一件');
function 装尸(改) {
    const W = 造窗();
    const 源 = load('js/app.js');
    const 体 = ['function 逐件入囊(ids) {', 'function 物品显示名(id) {', 'function 货账话(账, 名目) {', 'function lootCorpse() {', 'function dissectCorpse() {']
        .map(h => 切函数(源, h)).join('\n');
    const 串 = '(function(){\n'
        + 'var currentInteractionEntity = null;\n'
        + 'function showMessage(t, ty) { window._msgs.push(String(t)); }\n'
        + 'function renderInteraction() { window.__画 = (window.__画 || 0) + 1; }\n'
        + (改 ? 改(体) : 体) + '\n'
        + 'window.__搜 = function (e) { currentInteractionEntity = e; lootCorpse(); };\n'
        + 'window.__账 = 逐件入囊;\n'
        + '})();';
    W._load串(串, 'app-尸体');
    W.__尸 = function (件数) {
        return { isCorpse: true, corpseData: { looted: false, canLoot: true, inventory: { items: ['mat_lingzhi', 'mat_refined_iron', 'chaos_beast_pelt'].slice(0, 件数), spiritStones: 0, gold: 0 } } };
    };
    return W;
}
{
    const W = 装尸();
    装通道(W, [[0, 'no_template'], [0, 'bag_full']]);
    const 分 = W.__账(['mat_lingzhi', 'mat_refined_iron']);
    ok(分.塞不下.length === 2 && 分.账.length === 2 && 分.账[0] === 'no_template' && 分.账[1] === 'bag_full',
        'D1 逐件入囊把账与「塞不下」等长并排交出去（两件两笔，不是末件那一笔）：' + JSON.stringify(分.账));
    装通道(W, [[0, 'no_template'], [0, 'bag_full']]); W._复位(); W._msgs.length = 0;
    W.__搜(W.__尸(2));
    ok(/各件缘由不一/.test(W._最近()) && !/。，|。）/.test(W._最近()),
        'D2 掺账的一堆货：只说「各件缘由不一」，不拿末件的满包糊整堆：' + JSON.stringify(W._最近()));

    const W2 = 装尸();
    装通道(W2, [[0, 'bag_full'], [1, null], [1, null]]); W2._msgs.length = 0;
    W2.__搜(W2.__尸(3));
    ok(/行囊已满/.test(W2._最近()) && /另 1 件还在他身上/.test(W2._最近()),
        'D3 首件落空、后两件全收：账不能被末件刷掉（旧写法此处落回中性话）：' + JSON.stringify(W2._最近()));

    const 旧 = 装尸(体 => 改一处(体, 'function 货账话(账, 名目) {', 'window.addItemFailPhraseFor(账, 名目)', 'window.addItemFailPhraseFor(window.addItemFailReason, 名目)'));
    装通道(旧, [[0, 'bag_full'], [1, null], [1, null]]); 旧._msgs.length = 0;
    旧.__搜(旧.__尸(3));
    ok(!/行囊已满/.test(旧._最近()),
        'D4 改前复现：让站点回头读活账，同一屏的缘由就又没了（D3 量的正是「账跟着货走」）：' + JSON.stringify(旧._最近()));
}
{
    // randomMap 的短缺那一串（_短缺话／缘话 在 IIFE 内，切出来真调）
    const 源 = load('js/map/randomMap.js');
    const 体 = ['function itemNameOf(id) {', 'function 缘话(缺, 名目) {', 'function _短缺话(缺) {'].map(h => 切函数(源, h)).join('\n');
    function 装短(改) {
        const W = 造窗();
        W._load串('(function(){\n' + (改 ? 改(体) : 体) + '\nwindow.__短 = _短缺话;\n})();', 'randomMap-短缺');
        return W;
    }
    const W = 装短();
    const 全满 = [{ id: 'mat_lingzhi', 少: 2, 账: 'bag_full' }, { id: 'mat_beast_fang', 少: 1, 账: 'bag_full' }];
    ok(W.__短(全满) === '（灵药×2、兽牙×1 留在了原地：行囊已满，先腾个格子再来）',
        'D5 短缺话：全同一笔才点名（从句、不带句号，所以括号不会被顶破）：' + JSON.stringify(W.__短(全满)));
    ok(W.__短([{ id: 'mat_lingzhi', 少: 2, 账: 'bag_full' }, { id: 'mat_refined_iron', 少: 1, 账: 'no_template' }]).indexOf('各件缘由不一') >= 0,
        'D6 掺账 ⇒ 不一（不报件数，免得拿组数冒充件数）：' + JSON.stringify(W.__短([{ id: 'mat_lingzhi', 少: 2, 账: 'bag_full' }, { id: 'mat_refined_iron', 少: 1, 账: 'no_template' }])));
    ok(W.__短([{ id: 'mat_lingzhi', 少: 2, 账: null }]) === '（灵药×2 留在了原地）' && W.__短([]) === '',
        'D7 问不到账 ⇒ 只报短缺本身，半个字也不替玩家的格子定罪：' + JSON.stringify(W.__短([{ id: 'mat_lingzhi', 少: 2, 账: null }])));
    const 旧 = 装短(体2 => 改一处(体2, 'function 缘话(缺, 名目) {', '缺.map(d => d.账)', 'window.addItemFailReason'));
    ok(/各件缘由不一|行囊已满/.test(旧.__短([{ id: 'mat_lingzhi', 少: 2, 账: 'no_template' }, { id: 'mat_beast_fang', 少: 1, 账: 'bag_full' }])) === false,
        'D8 改前复现：拿一条活账糊两处短缺（此处桩没账⇒只能说空话），D5/D6 量的就是这一笔');
}

// ============ E 棘轮 ============
console.log('\n[E] 两把棘轮（本批名单＋文案分工）');
{
    // E1 形状账：本批把「账抄在发货这一站」做实的那些锚点，删一处即红
    const 名单 = [
        ['js/global-utils.js', 'var 账 = (typeof window.addItem === \'function\') ? (window.addItemFailReason || null) : null;'],
        ['js/global-utils.js', 'return { got: got, count: count, name: nm, reason: 账 };'],
        ['js/app.js', '账.push(有通道 ? (window.addItemFailReason || null) : null);'],
        ['js/app.js', 'function 货账话(账, 名目) {'],
        ['js/app.js', '这一笔账 = window.addItemFailReason || null;'],
        ['js/map/high-planes.js', 'if (有通道 && _采收 < pick.n) 采账.push(window.addItemFailReason || null);'],
        ['js/map/high-planes.js', 'if (有通道 && _探收 < pick.n) 探账.push(window.addItemFailReason || null);'],
        ['js/map/randomMap.js', 'if (进 < 要) { 缺.push({ id: k, 少: 要 - 进, 账: 账 }); 末账 = 账; }'],
        ['js/sects/sects-system.js', '_赏.push({ n: nm, got: 收.got, 要: 要, 账: 收.reason'],
        // 【第一百三十八批按「钉法」更新锚点字面，不改要求】原锚点字面是
        //   `W.addItemFailTextFor(收 && 收.reason, 名)`（句尾带句号支），
        // 生产码已把 `支原因` 从句尾支换成从句支（DES-97）：
        //   `js/sects/sect-governance.js:44` 现在是 `W.addItemFailPhraseFor(收 && 收.reason, 名) || '没能落进你的行囊'`，
        //   其返回值被 `:461`／`:462`／`:475`／`:482` 拼进「…：支原因(…)」的句子中段，带句号会读成破句。
        // ⇒ 本条只把清单里的匹配字面从 TextFor 换成 PhraseFor；「25 枚一枚不许少」的数量与闸门本身一字未松。
        ['js/sects/sect-governance.js', 'W.addItemFailPhraseFor(收 && 收.reason, 名)'],
        ['js/city-depth.js', 'return { got: 得, count: n, name: 名, reason: global.addItemFailReason || null };'],
        ['js/cultivation/heavenly-tribulation.js', 'return { got: 得, count: n, name: 名, reason: window.addItemFailReason || null };'],
        ['js/npcs/npc-life-system.js', 'reason: window.addItemFailReason || null'],
        ['js/reputation-system.js', 'var _购账 ='],
        ['js/inventory.js', 'window.addItemFailPhraseFor = failPhraseFor;'],
        ['js/inventory.js', 'window.addItemFailPhrase = function (label) {'],
        ['js/inventory.js', 'window.addItemReasonPhrase = function (label) {'],
        ['js/app.js', 'if (window.addItem && got < count) 鱼账.push(window.addItemFailReason || null);'],
        ['js/app.js', 'if (got < count) { 没带走 += (count - got); 矿账.push(这一笔账); }'],
        ['js/app.js', 'if (got < count) { 没带走 += (count - got); 木账.push(这一笔账); }'],
        ['js/app.js', 'var _药收 = 0, 灵药账 = [];'],
        ['js/app.js', "if (_核漏 > 0) raid.漏账 = (raid.漏账 || []).concat([核账]);"],
        ['js/world-events.js', "name: (window.itemById && window.itemById['mat_demon_beast_core'] && window.itemById['mat_demon_beast_core'].name) || '妖兽内丹', reason: window.addItemFailReason || null }"],
        ['js/extensions/cave-life.js', '赠 = { got: 收, count: 1, name: gift, reason: window.addItemFailReason || null };'],
        ['js/sects/sect-war.js', "W.addItemFailPhrase(核名)"]
    ];
    let 缺 = [];
    名单.forEach(function (项) {
        if (!有(项[0])) { 缺.push(项[0] + '（文件没了）'); return; }
        if (load(项[0]).indexOf(项[1]) < 0) 缺.push(项[0] + ' :: ' + 项[1].slice(0, 28));
    });
    ok(缺.length === 0, 'E1 账抄在发货这一站：本批做实锚点 ' + 名单.length + ' 枚一枚不许少（缺：' + (缺.join(' | ') || '无') + '）');

    // E2 分工哨兵：拼在句中／用连接符接起来的那几处，只准吃从句支
    const 拼接点 = [
        ['js/sects/sects-system.js', 'var _赏 = [];', 'discipleState.tasksCompleted++'],
        ['js/app.js', 'if (短.length) {', 'if (window.showMessage) window.showMessage((res.room'],
        ['js/map/randomMap.js', 'function _短缺话(缺) {', 'function gatherWildNode()'],
        ['js/app.js', 'function 货账话(账, 名目) {', 'function lootCorpse()']
    ];
    let 违规 = [];
    拼接点.forEach(function (项) {
        const 源 = load(项[0]);
        const 起 = 源.indexOf(项[1]), 止 = 源.indexOf(项[2], 起);
        if (起 < 0 || 止 < 0) throw new Error('E2 锚点变了：' + 项[0] + ' 的「' + 项[1].slice(0, 20) + '」');
        const 段 = 源.slice(起, 止).split('\n').map(l => { const i = l.indexOf('//'); return i >= 0 ? l.slice(0, i) : l; }).join('\n');
        if (/addItem(Reason|Fail)Text(For)?\(/.test(段)) 违规.push(项[0]);
    });
    ok(违规.length === 0, 'E2（DES-97）半截话点位只准吃从句支：句尾带圆点的那两支出现在这些段里即红（违规：' + (违规.join(' | ') || '无') + '）');

    // E3 回退字面基线：问不到账却断言满包的那一族（第一百三十九批的靶子）
    let 字面 = 0, 文件 = {};
    (function 走(dir) {
        fs.readdirSync(path.join(ROOT, dir)).forEach(name => {
            const p = path.join(dir, name);
            if (fs.statSync(path.join(ROOT, p)).isDirectory()) { if (name !== 'node_modules') 走(p); return; }
            if (!/\.js$/.test(name)) return;
            const 数 = (load(p).match(/\|\| '行囊已满，先腾个格子再来。'/g) || []).length;
            if (数) { 字面 += 数; 文件[p] = 数; }
        });
    })('js');
    ok(字面 <= 54, 'E3 回退字面「|| \'行囊已满…\'」＝' + 字面 + ' 处（开案 66 → 第一百三十八批把 12 处半截话点位换成从句支、顺手摘掉它们句尾的圆点，基线降到 54，只准再减）；本批动过的文件里不许有新的：'
        + Object.keys(文件).filter(k => /app\.js|high-planes|randomMap|sects-system|sect-governance|city-depth|heavenly-tribulation|npc-life-system|reputation-system|global-utils/.test(k)).join(' | '));

    // E4（DES-97 全仓棘轮）：句尾带圆点那四支持牌手，只要被拼进「（…）」或紧跟标点，屏上就是「再来。，」这种破句。
    // 这把尺认别名（W.addItemFailText／global.addItemReasonText），按**全文**判（语句常跨两三行），门槛恒为 0。
    const 名单文件 = (function 走(dir) {
        const 出 = [];
        fs.readdirSync(path.join(ROOT, dir)).forEach(function (name) {
            if (name === 'node_modules' || name.startsWith('.')) return;
            const p = dir + '/' + name;
            if (fs.statSync(path.join(ROOT, p)).isDirectory()) 走(p).forEach(x => 出.push(x));
            else if (/\.js$/.test(name)) 出.push(p);
        });
        return 出;
    })('js');
    function 扫破句(读) {
        const 支RE = /[A-Za-z_$][\w$.]*\.addItem(?:Fail|Reason)Text(?:For)?\(/g;
        function 跳串(s, i) { const q = s[i]; i++; while (i < s.length && s[i] !== q) { if (s[i] === '\\') i++; i++; } return i + 1; }
        function 右括(s, i) {
            let d = 0;
            for (; i < s.length; i++) {
                const c = s[i];
                if (c === "'" || c === '"' || c === '`') { i = 跳串(s, i) - 1; continue; }
                if (c === '(') d++; else if (c === ')') { d--; if (!d) return i; }
            }
            return -1;
        }
        function 出括号(s, i) {
            for (let g = 0; g < 6; g++) {
                let j = i + 1;
                while (/\s/.test(s[j]) || s[j] === ')') j++;
                const m = s.slice(j).match(/^\|\|\s*('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`\s*(?:[^`\\]|\\.)*`\s*)\s*\)/);
                if (m) { i = j + m[0].length - 1; continue; }
                return j;
            }
            return i + 1;
        }
        const 破 = [];
        名单文件.forEach(function (rel) {
            const s = 读(rel);
            let m; 支RE.lastIndex = 0;
            while ((m = 支RE.exec(s))) {
                const close = 右括(s, m.index + m[0].length - 1);
                if (close < 0) continue;
                const 尾 = s.slice(出括号(s, close), 出括号(s, close) + 14).replace(/\s+/g, ' ');
                if (/^[）)，、：。]/.test(尾) || /^\+\s*['"`][）)，、：。]/.test(尾)) 破.push(rel + ':' + (s.slice(0, m.index).split('\n').length) + ' → ' + JSON.stringify(尾));
            }
        });
        return 破;
    }
    const 现破 = 扫破句(load);
    ok(现破.length === 0, 'E4（DES-97 棘轮）全仓现读句尾支被拼进括号／标点前的点位：' + 现破.length + ' 处，门槛 0（现破：' + (现破.slice(0, 6).join(' ｜ ') || '无') + '）');

    // E5 改前复现：把石室那一处按回旧写法（句尾支＋紧跟「）」），同一把尺必须报红——否则 E4 量的是空气
    // ⚠️【第一百三十九批按「钉法」更新锚点字面，不改要求】要求原文一字未松：
    // 「这一处必须是从句支形状，换回句尾支那把尺就要报红」。本批把该处回退文案由
    // 「行囊塞不下，没带走」换成词表①「这一件先还留在原处」，所以下面这串匹配字面跟着更新；
    // 换回旧形的动作、报红门槛（恒 1 处）、以及扫的那把尺本身都原样未动。
    const 旧形文件 = 'js/reputation-system.js';
    const 旧形源 = load(旧形文件).replace(
        "+ ((typeof window.addItemReasonPhrase === 'function' && window.addItemReasonPhrase('石室里的东西')) || '这一件先还留在原处') + '，仍留在石室里）'",
        "+ ((typeof window.addItemReasonText === 'function' && window.addItemReasonText('石室里的东西')) || '这一件先还留在原处。') + '，仍留在石室里）'");
    if (旧形源 === load(旧形文件)) throw new Error('E5 改前复现锚点变了：' + 旧形文件 + ' 石室那一支不再是从句支形状');
    const 复现破 = 扫破句(function (rel) { return rel === 旧形文件 ? 旧形源 : load(rel); });
    ok(复现破.length === 1 && 复现破[0].indexOf(旧形文件) === 0,
        'E5 改前复现：同一处换回句尾支，这把尺就报 1 处（实报 ' + 复现破.length + '：' + 复现破.join(' ｜ ') + '）——E4 的 0 是量出来的，不是放宽出来的');
}

console.log('\n========== 第一百三十八批套件（账跟着货走／半截话不钉破句号） ==========');
console.log('通过：' + 通过 + '　失败：' + 失败);
process.exitCode = 失败 ? 1 : 0;
