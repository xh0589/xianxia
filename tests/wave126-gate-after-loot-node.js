// 第一百二十六批 · 「先销账、后发货」这一族（DES-86）
// 上一批量的是「往外退／往下摘」，这一批量的是它的反面：**先烧闸门、后发货**——
// 尸体标了「已搜刮」、古剑标了「已拔出」、异宝标了「已寻过」、产地记了「枯竭日」、遗迹抽了「存量」、
// NPC 那一单标了「已完成」……然后才把东西往行囊里塞。行囊一满，账已经销了，货没了，而且**永不再来**。
// 契约仍是第八十二波那条：window.addItem（＝window.addItemToInventory，js/inventory.js:169／别名 :2516）返回**实收件数**。
// 证据分两档，逐条标出：vm 行为＝把真文件装进沙箱真调一次；读码＝源码形状断言。
// 另立两案：DES-87（制毒：成品三枚 id 全仓无模板，材料照扣、熟练度照涨）／DES-88（调试面板 addAllItems 引用不存在的变量）。
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

// —— 把私有函数从大文件里切出来真调（app.js／npc-inventory.js／debug-panel.js 都是 IIFE，模块内函数无导出口）
function 跳串(src, i) {           // src[i] 是引号；返回右引号所在下标
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
// 只在某个锚点之后改第一处（防「同样的字样在别处也有」误伤）
function 改一处(src, 锚, 旧, 新) {
    const i = src.indexOf(锚);
    if (i < 0) throw new Error('锚点没了：' + 锚);
    const j = src.indexOf(旧, i);
    if (j < 0) throw new Error('「' + 锚 + '」之后找不到待改的「' + 旧 + '」');
    return src.slice(0, j) + 新 + src.slice(j + 旧.length);
}

// ============ 公共沙箱 ============
function 造窗() {
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
    W._计时 = [];
    W.showMessage = function (t) { W._msgs.push(String(t)); };
    W.gameLog = { add: function () { } };
    W.log = function () { };
    W.timeSystem = { gameTime: { totalMinutes: 8 * 60, currentDay: 7 }, advanceTime: function (m, r) { W._计时.push([m, r]); } };
    W.updateCharacterStatus = function () { };
    W.updateInventoryUI = function () { };
    W.updateCurrencyUI = function () { };
    W.updateAllStatDisplays = function () { };
    W.itemById = {
        mat_lingzhi: { name: '灵药' }, mat_refined_iron: { name: '精铁' }, mat_moon_stone: { name: '明月石' },
        mat_demon_beast_core: { name: '妖兽内丹' }, mat_liquorice: { name: '甘草' }, mat_beast_fang: { name: '兽牙' },
        wpn_dark_iron_sword: { name: '玄铁古剑' }, spec_transfer_stone: { name: '传送石' }, mat_meteorite: { name: '陨铁' },
        pill_foundation: { name: '筑基丹' }, mat_purple_gold: { name: '紫精铜' }, chaos_beast_pelt: { name: '混沌兽皮' },
        mat_nine_leaf_lingzhi: { name: '九叶灵芝' }, mat_heaven_heart_flower: { name: '天心莲' },
        mat_five_element_essence: { name: '五行精华' }, mat_dark_iron: { name: '玄铁' }, mat_chaos_stone: { name: '混沌石' },
        mat_dragon_crystal: { name: '龙晶' }
    };
    W.inventory = { currency: { spiritStones: 100, copper: 0 }, slots: [] };
    W.currentCharData = {
        name: '试子', realm: '筑基', layer: 1, qi: 500, maxQi: 500, hp: 100, maxHp: 100, health: 100,
        spiritStones: 100, energy: 100, lifeSkills: { '毒术': 100 }, location: '洛水城'
    };
    W.flags = {};
    vm.createContext(W);
    W._load = function (rel, 改) {
        let src = load(rel);
        if (改) src = 改(src);
        vm.runInContext(src, W, { filename: rel });
    };
    W._load串 = function (src, tag) { vm.runInContext(src, W, { filename: tag }); };
    W._最近 = function () { return W._msgs[W._msgs.length - 1] || ''; };
    return 装说话手(W);
}

// 件数桩：按队列依次回报实收件数（耗尽后按最后一个回报）
// 第一百三十八批（DES-96）：原先这支桩只回报件数、从不写原因账，于是站点问不到账只能落回写死的「行囊已满」——
// 「满包那一屏」那几枚钉量的其实是**回退字面**。现在按 js/inventory.js:180-198 的口径把账也写进桩里：
// 每次入袋先清账，一件没进才落 bag_full（半包不落笔）。opts.不写账 留给「问不到账」那一枚控制组。
function 装通道(W, 队列, opts) {
    opts = opts || {};
    let i = 0;
    const 报 = function (n) { const v = i < 队列.length ? 队列[i] : 队列[队列.length - 1]; i++; return v; };
    W.__调用次数 = 0;
    W.addItem = function (id, n) {
        W.__调用次数++; W.__最后 = [id, n];
        W.addItemFailReason = null;                        // 与 inventory.js:180 同：进函数先清账
        const v = 报(n);
        if (!opts.不写账 && v <= 0) W.addItemFailReason = 'bag_full';   // 与 inventory.js:198 同：一件没进才是格子的事
        return v;
    };
    W.addItemToInventory = W.addItem;
    W._复位 = function () { i = 0; W.__调用次数 = 0; };
}
// 把公共说话手装进沙箱：不在测试里另抄一份措辞——直接从 js/inventory.js 切那一段真装
// （抄一份就会与真源各说各话；本批真源又添了 DES-97 的「从句」两支，镜像更追不动）
function 装说话手(W) {
    const 源 = load('js/inventory.js');
    const 起 = 源.indexOf('// DES-90（第一百二十八批）：发奖回执要说');
    const 止 = 源.indexOf('// ============ 第八十三波·实例账');
    if (起 < 0 || 止 < 0 || 止 <= 起) throw new Error('js/inventory.js 的说话手那一段没切到——锚点变了，探针要跟着改');
    W._load串(源.slice(起, 止), 'inventory-说话手');
    return W;
}
// 骰子队列：第 k 次 Math.random 取第 k 个值（耗尽后恒取最后一个）
function 定骰(W, 队列) {
    let i = 0;
    vm.runInContext('Math.random = function () { return window.__骰(); }', W);
    W.__骰 = function () { const v = i < 队列.length ? 队列[i] : 队列[队列.length - 1]; i++; return v; };
    W._骰复位 = function (q) { if (q) 定骰(W, q); i = 0; };
}

// ============ A DES-86：搜刮尸体（真调 js/app.js 里的 lootCorpse／dissectCorpse） ============
console.log('\n[A] DES-86 搜刮·解剖（从 js/app.js 切出真函数装进沙箱）');
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
        + 'window.__解 = function (e) { currentInteractionEntity = e; dissectCorpse(); };\n'
        + '})();';
    W._load串(串, 'app-尸体');
    W.__尸 = function (件数, opt) {
        opt = opt || {};
        return {
            isCorpse: true,
            corpseData: {
                looted: false, canLoot: true,
                inventory: {
                    items: ['mat_lingzhi', 'mat_refined_iron', 'chaos_beast_pelt'].slice(0, 件数),
                    spiritStones: opt.stones === undefined ? 5 : opt.stones, gold: opt.gold || 0
                }
            }
        };
    };
    return W;
}
{
    const W = 装尸();
    ok(typeof W.__搜 === 'function' && typeof W.__解 === 'function' && typeof W.__尸 === 'function',
        'A0 五支私有函数（逐件入囊／物品显示名／货账话／lootCorpse／dissectCorpse）从 app.js 切出来并接进了沙箱');

    const p = W.__尸(3); 装通道(W, [0]); W._复位(); W._msgs.length = 0;
    W.__搜(p);
    ok(p.corpseData.looted === false && p.corpseData.canLoot === true,
        'A1 行囊一件不收：尸体不许标「已搜刮」（改前一律置位 ⇒ 那三件随尸体永远消失）');
    ok(p.corpseData.inventory.items.length === 3, 'A2 三件仍在他身上（没被摘走）');
    ok(/灵石\+5/.test(W._最近()) && /另 3 件还在他身上：行囊已满/.test(W._最近()) && !/物品：/.test(W._最近()) && !/。，|。）/.test(W._最近()),
        'A3 一件没收着：现钱照念（那是真进账了），但没拿走的东西不许列进「物品：」；缘由照这本货的账念，且不许把句号钉进半截话：' + JSON.stringify(W._最近()));

    const p0 = W.__尸(3, { stones: 0 }); 装通道(W, [0]); W._复位(); W._msgs.length = 0;
    W.__搜(p0);
    ok(/一件也没进囊/.test(W._最近()) && W._最近().indexOf('搜刮到') < 0,
        'A3b 身上只有货、没钱：满包那一屏不念「搜刮到」：' + JSON.stringify(W._最近()));

    const p2 = W.__尸(3); 装通道(W, [1, 0, 1]); W._复位(); W._msgs.length = 0;
    W.__搜(p2);
    ok(p2.corpseData.looted === false, 'A4 收 2 落 1：闸门不关（还剩一件没拿走）');
    ok(p2.corpseData.inventory.items.length === 1 && p2.corpseData.inventory.items[0] === 'mat_refined_iron',
        'A5 只把真落袋的那两件从尸体上摘走（留下的那件仍在身上，读数 ' + JSON.stringify(p2.corpseData.inventory.items) + '）');
    ok(/另 1 件还在他身上/.test(W._最近()) && /灵药/.test(W._最近()) && W._最近().indexOf('混沌兽皮、精铁') < 0 && !/。，|。）/.test(W._最近()),
        'A6 回执只念落袋的两件＋一句没带走（缘由走这本货的账，不钉破句号）：' + JSON.stringify(W._最近()));

    const p3 = W.__尸(2); 装通道(W, [1]); W._复位(); W._msgs.length = 0;
    const 石0 = W.inventory.currency.spiritStones;
    W.__搜(p3);
    ok(p3.corpseData.looted === true && W.inventory.currency.spiritStones === 石0 + 5,
        'A7 全收着时照旧关闸门、灵石照进账（收口没把好的一侧改坏）');
    ok(p3.corpseData.inventory.spiritStones === 0 && p3.corpseData.inventory.gold === 0,
        'A8 领过的现钱当场清账（防「没拿完再搜一次」把同一笔灵石领两遍）');

    const p4 = W.__尸(1); 装通道(W, [0]); W._复位();
    const 石1 = W.inventory.currency.spiritStones;
    W.__搜(p4); const 一次 = W.inventory.currency.spiritStones - 石1;
    W.__搜(p4); const 二次 = W.inventory.currency.spiritStones - 一次 - 石1;
    ok(一次 === 5 && 二次 === 0,
        'A9 满包那一趟：灵石拿了就不再挂在身上——第二次搜不重复进账（读数 ' + 一次 + '／' + 二次 + '）');

    const p5 = W.__尸(2); 装通道(W, [0]); W._复位(); W._msgs.length = 0;
    W.__解(p5);
    ok(p5.corpseData.looted === false && /没带走，先留在他身上：行囊已满/.test(W._最近()) && W._最近().indexOf('解剖获得') < 0 && !/。，|。）/.test(W._最近()),
        'A10 解剖同族：一张皮没剥下来时不销尸、不念「解剖获得」，缘由照账念（旧写法这一屏自己断言「行囊已经塞到边上来了」）：' + JSON.stringify(W._最近()));

    // DES-96 控制组：桩子一件不收、但绝不写原因账 ⇒ 这两屏都不许冒认「满包」
    const p7 = W.__尸(2); 装通道(W, [0], { 不写账: true }); W._复位(); W._msgs.length = 0;
    W.__搜(p7);
    ok(!/行囊已满|腾个格子/.test(W._最近()) && /没能落进你的行囊/.test(W._最近()),
        'A12 搜刮问不到账：只报「没带走」，不替玩家的格子定罪：' + JSON.stringify(W._最近()));
    // 第一百三十九批（钉法更新，一字未松）：旧字面「缘由没落进账」已随生产码
    // js/app.js:4434 的回退文案换成词表①。实测这一屏的中性收口是
    // 「🔪 这一份皮子没带走，先留在他身上：这一件先还留在原处。」（账上没落笔 ⇒ failPhraseFor 返回空串，
    // 站点自己收口，不猜缘由、不把内部名漏给玩家，解剖尸体属野外可再来）。
    // A13 的要求本身原样保留：**解剖问不到账时，不许由站点自己断言满包**——
    // `!/行囊已满|腾个格子/` 这道反向钉一字未松，只把认不出账时的中性字面从黑话串换成真文案。
    const p8 = W.__尸(2); 装通道(W, [0], { 不写账: true }); W._复位(); W._msgs.length = 0;
    W.__解(p8);
    ok(!/行囊已满|腾个格子/.test(W._最近()) && /这一件先还留在原处/.test(W._最近()),
        'A13 解剖问不到账：同上：' + JSON.stringify(W._最近()));

    // 改前复现：把「还有没拿走就仍旧可搜」这一道判断拆掉 ⇒ A1 量的确实是本批这一笔
    const 旧 = 装尸(体 => 改一处(体, 'function lootCorpse() {', 'if (!留下.length) {', 'if (true) {'));
    const p6 = 旧.__尸(2); 装通道(旧, [0]); 旧._复位();
    旧.__搜(p6);
    ok(p6.corpseData.looted === true,
        'A11 改前复现：拆掉那一道判断后，满包搜刮照样把尸体标成「已搜刮」——两件东西当场蒸发（对照组）');
    ok(p6.corpseData.inventory.items.length === 2,
        'A11b 但东西并没进玩家手里（行囊一件没收）：蒸发只发生在闸门那侧');
}

// ============ B DES-86：岩中古剑——真拔出来了才准收闸门（真装 landmark-explore.js） ============
console.log('\n[B] DES-86 岩中古剑（真装 js/map/landmark-explore.js）');
function 装剑(改) {
    const W = 造窗();
    W._load('js/map/landmark-explore.js', 改);
    W._load串('saveLandmarkProgress = function(){ window.__落盘 = (window.__落盘||0) + 1; };', '桩-落盘');
    W._msgs.length = 0;
    return W;
}
{
    const W = 装剑();
    const 名 = '古剑峰';
    const 库 = W.LANDMARK_EXPLORE_DATA[名];
    ok(!!库, 'B0 「' + 名 + '」在探索名录里（闸门就记在这本上）');

    定骰(W, [0]); 装通道(W, [0]); W._复位(); W.__落盘 = 0; W._msgs.length = 0;
    W._landmarkPullSword(名);
    ok(!W.LANDMARK_EXPLORE_DATA[名]._swordPulled,
        'B1 掷中了却一件装不下：剑又落回岩中，闸门不落（改前在掷骰前就 saveLandmarkProgress ⇒ 唯一的玄铁古剑凭空永久消失）');
    ok(W.__落盘 === 0, 'B2 这一趟不落盘（读到 ' + W.__落盘 + '）');
    ok(/先腾个格子再来。/.test(W._最近()) && W._最近().indexOf('你得一柄') < 0, 'B3 满包那一屏说清了：' + JSON.stringify(W._最近()));

    定骰(W, [0]); 装通道(W, [1]); W._复位(); W.__落盘 = 0; W._msgs.length = 0;
    W._landmarkPullSword(名);
    ok(W.LANDMARK_EXPLORE_DATA[名]._swordPulled === true && W.__落盘 === 1,
        'B4 腾开格子再来一次：剑真落袋才关闸门并落盘（闸门没被放宽，只是挪到了结局）');
    ok(/你得一柄「玄铁古剑」/.test(W._最近()), 'B5 收着时照旧念得手：' + JSON.stringify(W._最近()));

    // 失手那一支：闸门照烧（防刷不放宽），与本批无关但必须量住
    const W2 = 装剑();
    定骰(W2, [0.99]); W2._msgs.length = 0; W2.__落盘 = 0;
    W2.currentCharData.health = 50;
    W2._landmarkPullSword('龙脉');
    ok(W2.LANDMARK_EXPLORE_DATA['龙脉']._swordPulled === true && W2.currentCharData.health === 42,
        'B6 失手那一支没被本批改口：闸门照烧、健康 -8（读数 ' + W2.currentCharData.health + '）');
    ok(/纹丝不动/.test(W2._最近()), 'B7 失手回执原样');

    const W3 = 装剑();
    定骰(W3, [0]); W3._msgs.length = 0; W3.__落盘 = 0;
    delete W3.addItemToInventory;
    W3._landmarkPullSword('天池');
    ok(W3.LANDMARK_EXPLORE_DATA['天池']._swordPulled === true,
        'B8 无行囊通道的世界（沙盒）按收下兜底——与各处 consume 那侧的「不拦」同口径');

    const 旧 = 装剑(src => 改一处(src, 'window._landmarkPullSword = function', 'if (!_剑收) {', 'if (false) {'));
    定骰(旧, [0]); 装通道(旧, [0]); 旧.__落盘 = 0; 旧._msgs.length = 0;
    旧._landmarkPullSword('剑冢');
    ok(旧.LANDMARK_EXPLORE_DATA['剑冢']._swordPulled === true && 旧.__落盘 === 1,
        'B9 改前复现：把「没收下就回头」那一道拆掉，同一枚骰子下闸门照烧、落盘照写 ⇒ B1 量的正是这一笔');
}

// ============ C DES-86：天降异宝——寻中了才准烧「本场已寻」 ============
console.log('\n[C] DES-86 天降异宝（真装 js/world-events.js）');
function 装宝(改) {
    const W = 造窗();
    W._load('js/world-events.js', 改);
    W._load串([
        'isWorldEventActive = function(){ return true; };',
        'getWorldEventDef = function(){ return { participate: { label: "寻宝", action: "seek_treasure" } }; };',
        'saveWorldEvents = function(){ window.__落盘 = (window.__落盘||0) + 1; };',
        'activeWorldEvents["ev_treasure"] = {};'
    ].join('\n'), '桩-异宝');
    W.__已寻 = function () { return !!(W.activeWorldEvents['ev_treasure'] && W.activeWorldEvents['ev_treasure'].sought); };
    return W;
}
{
    const W = 装宝();
    定骰(W, [0, 0]); 装通道(W, [0]); W._复位(); W.__落盘 = 0; W._计时.length = 0; W._msgs.length = 0;
    const 回 = W.participateWorldEvent('ev_treasure');
    ok(回 === true && !W.__已寻(),
        'C1 掷中了却装不下：这一场不算寻过（改前先烧 sought 再掷 ⇒ 宝光散了、东西没进袋）');
    ok(W.__落盘 === 0, 'C2 不落盘（读到 ' + W.__落盘 + '）');
    ok(W._计时.length === 1 && W._计时[0][0] === 60,
        'C3 时辰照付 60 分钟（本批不放宽代价，只把货与闸门的先后摆正）：' + JSON.stringify(W._计时));
    ok(/这一场还算数/.test(W._最近()) && W._最近().indexOf('寻得异宝') < 0, 'C4 满包那一屏：' + JSON.stringify(W._最近()));

    定骰(W, [0, 0]); 装通道(W, [1]); W._复位(); W._msgs.length = 0; W.__落盘 = 0;
    W.participateWorldEvent('ev_treasure');
    ok(W.__已寻() && W.__落盘 === 1 && /寻得异宝/.test(W._最近()),
        'C5 腾开格子再来：同一场里仍能寻（闸门此时才落）——防刷那道账不放宽，只是不再吞货');

    const W2 = 装宝();
    定骰(W2, [0.99]); W2._msgs.length = 0; W2.__落盘 = 0; 装通道(W2, [1]);
    const 回2 = W2.participateWorldEvent('ev_treasure');
    ok(回2 === true && W2.__已寻(),
        'C6 空手一场：闸门照烧（第一百零九波那道防刷账不因本批松动）');
    ok(/空谷余音/.test(W2._最近()), 'C7 空手回执原样：' + JSON.stringify(W2._最近()));

    const 旧 = 装宝(src => 改一处(src, 'if (action === "seek_treasure")'.replace(/"/g, "'"), 'if (!_宝收) {', 'if (false) {'));
    定骰(旧, [0, 0]); 装通道(旧, [0]); 旧.__落盘 = 0; 旧._msgs.length = 0;
    旧.participateWorldEvent('ev_treasure');
    ok(!!旧.activeWorldEvents['ev_treasure'].sought,
        'C8 改前复现：拆掉「没收下就回头」那一道，同一枚必中的骰子下 sought 被烧掉 ⇒ C1 量的正是这一笔');
}

// ============ D DES-86：野外采集节点——一件没采回就不许判枯 ============
console.log('\n[D] DES-86 野外采集（真装 wild-terrain＋randomMap）');
function 装野(改) {
    const W = 造窗();
    W._load('js/map/wild-terrain.js');
    W._load('js/map/randomMap.js', 改);
    W._load串([
        'saveWildState = function(){ window.__存 = (window.__存||0) + 1; };',
        'renderWildSidebar = function(){ window.__侧 = (window.__侧||0) + 1; };',
        'wildState = { regions: { "试域": { fog: "", dead: {}, gathered: {}, visited: {}, leySeen: {}, oasis: {}, pool: {}, grotto: {}, grottoUse: {}, grottoLoot: {}, ruinDug: {}, notes: {}, px: 0, py: 0 } } };',
        'currentRegionForMap = "试域";',
        'playerPos = { x: 0, y: 0 };',
        'currentMap = [[{ x: 0, y: 0, fog: 2, terrainKey: "GRASS", node: { kind: "herb", items: ["mat_lingzhi", "mat_refined_iron"], regrowDay: 0 } }]];'
    ].join('\n'), '桩-野外');
    W.__格 = function () { return vm.runInContext('currentMap[0][0]', W); };
    W.__域账 = function () { return vm.runInContext('wildState.regions[currentRegionForMap]', W); };
    return W;
}
{
    const W = 装野();
    ok(typeof W.WildTerrain === 'object' && vm.runInContext('typeof gatherWildNode', W) === 'function',
        'D0 装载顺序（wild-terrain → randomMap）在本套件的桩下成立——先装地形，否则 WildTerrain is not defined');
    定骰(W, [0.5, 0.5, 0.5, 0.5]); 装通道(W, [0]); W._复位(); W._msgs.length = 0; W._计时.length = 0;
    W.currentCharData.energy = 100;
    W.gatherWildNode();
    const 格 = W.__格();
    ok(格.node.regrowDay === 0,
        'D1 一株没采回：这片产地不许判枯（改前无条件写枯竭日 ⇒ 白跑一趟还毁了一处产地）');
    ok(Object.keys(W.__域账().gathered).length === 0, 'D2 本域存档的 gathered 镜像也不写（读到 ' + JSON.stringify(W.__域账().gathered) + '）');
    ok(/一株也没带回/.test(W._最近()) && W._最近().indexOf('采得') < 0, 'D3 满包那一屏：' + JSON.stringify(W._最近()));
    ok(W._计时.length === 1 && W.currentCharData.energy === 94,
        'D4 代价照付（30 分钟＋精力 6）——这一条**待裁**：货没到手时该不该收这一趟的力气，本批只如实记账不擅自放宽');

    const W2 = 装野(); 定骰(W2, [0.5, 0.5, 0.5, 0.5, 0.5]); 装通道(W2, [2]); W2._复位(); W2._msgs.length = 0;
    W2.gatherWildNode();
    const 格2 = W2.__格();
    ok(格2.node.regrowDay > 7, 'D5 真采回时照旧判枯（currentDay＝7，枯日落 ' + 格2.node.regrowDay + '）');
    ok(W2.__域账().gathered['0,0'] === 格2.node.regrowDay, 'D6 镜像账同步（第三十四波那一笔没被改回去）');
    ok(/采得/.test(W2._最近()) && /灵药×2/.test(W2._最近()), 'D7 收着时念实收件数：' + JSON.stringify(W2._最近()));

    const W3 = 装野(); 定骰(W3, [0.5, 0.5, 0.5, 0.5, 0.5]); W3._msgs.length = 0;
    delete W3.addItemToInventory;
    W3.gatherWildNode();
    ok(W3.__格().node.regrowDay > 7 && /采得/.test(W3._最近()),
        'D8 无行囊通道的世界按全收兜底（与 consume 同口径，不新增一种假失败）');

    const 旧 = 装野(src => 改一处(src, 'function gatherWildNode() {', 'if (got.length) {', 'if (true) {'));
    定骰(旧, [0.5, 0.5, 0.5, 0.5]); 装通道(旧, [0]); 旧._msgs.length = 0;
    旧.gatherWildNode();
    ok(旧.__格().node.regrowDay > 7,
        'D9 改前复现：拆掉那一道判断，满包一趟照样把产地判枯 ⇒ D1 量的正是这一笔');
}

// ============ E DES-86：无名遗迹——翻空了这一遍不算数 ============
console.log('\n[E] DES-86 无名遗迹（真装 randomMap·exploreWildRuin／退还RuinDug）');
{
    const W = 装野();
    const poi = { id: 'ruin_test_1', type: 'ruin', name: '试冢', variantName: '无名古冢', variant: { key: 'tomb', name: '无名古冢', find: '盗洞边上捡着几件剩下的明器', loot: ['mat_moon_stone'], digs: 1 } };
    ok(vm.runInContext('typeof 退还RuinDug', W) === 'function', 'E0 退还那一支确在');
    ok(W.ruinStockOf(poi) === 1, 'E1 存量由来历给：无名古冢的牌面写着「被盗过一轮」⇒  digs＝1');

    定骰(W, [0, 0, 0]); 装通道(W, [0]); W._复位(); W._msgs.length = 0; W._计时.length = 0;
    W.exploreWildRuin(poi);
    ok(vm.runInContext('ruinDugCount("ruin_test_1")', W) === 0,
        'E2 一件没带走 ⇒ 这一次翻动退还（改前存量照抽、货却蒸发：拿玩家的真永久换假收获）');
    ok(W.ruinIsDry(poi) === false, 'E2a 退还之后这一处不算枯（下次来还有得翻）');
    ok(/还没翻到底/.test(W._最近()) && W._最近().indexOf('明月石') < 0, 'E3 满包那一屏：' + JSON.stringify(W._最近()));

    定骰(W, [0, 0, 0]); 装通道(W, [1]); W._复位(); W._msgs.length = 0; W._计时.length = 0;
    W.exploreWildRuin(poi);
    ok(vm.runInContext('ruinDugCount("ruin_test_1")', W) === 1 && /翻到底了/.test(W._最近()),
        'E4 真拿走一件才算翻过一遍，且当场枯（digs＝1）：' + JSON.stringify(W._最近()));

    W._计时.length = 0; W._msgs.length = 0;
    W.exploreWildRuin(poi);
    ok(W._计时.length === 0 && /早被人翻到底了/.test(W._msgs[0] || ''),
        'E5 控制组（DES-31 那一笔）：枯了不再收时辰与精力');

    const 旧 = 装野(src => 改一处(src, 'function exploreWildRuin(poi) {', 'if (!found.length && _翻出落空) 退还RuinDug(poi);', 'void 0;'));
    const poi2 = { id: 'ruin_test_2', type: 'ruin', name: '试冢二', variantName: '塌陷古观', variant: { key: 'temple', name: '塌陷古观', find: '供桌底下压着几样没烂的旧物', loot: ['mat_moon_stone'], digs: 1 } };
    定骰(旧, [0, 0, 0]); 装通道(旧, [0]); 旧._msgs.length = 0;
    旧.exploreWildRuin(poi2);
    ok(vm.runInContext('ruinDugCount("ruin_test_2")', 旧) === 1,
        'E6 改前复现：抹掉退还那一句，同一趟满包之后存量被抽干 ⇒ E2 量的正是这一笔');
}

// ============ F DES-86：位面采撷／探幽——真气时辰已付，货按实收念 ============
console.log('\n[F] DES-86 位面两桩（真装 js/map/high-planes.js）');
function 装面(改) {
    const W = 造窗();
    W.currentCharData.location = '灵界·蓬莱仙境';
    W._load('js/map/high-planes.js', 改);
    return W;
}
{
    const W = 装面();
    ok(typeof W.planeGather === 'function' && typeof W.planeExplore === 'function', 'F0 两桩入口导出确在（IIFE 内挂到 window）');
    定骰(W, [0.9]); 装通道(W, [0]); W._复位(); W._msgs.length = 0; W._计时.length = 0;
    const 气0 = W.currentCharData.qi;
    const 回 = W.planeGather('灵界');
    ok(回 === true && /一份也没带回/.test(W._最近()) && !/得 \d+ 份灵材/.test(W._最近()),
        'F1 采撷满包：不再念「得 N 份灵材」：' + JSON.stringify(W._最近()));
    ok(W.currentCharData.qi < 气0 && W._计时.length === 1,
        'F2 真气（' + 气0 + '→' + W.currentCharData.qi + '）与时辰照付——同 D4 一并待裁');

    const W2 = 装面();
    定骰(W2, [0.9]); 装通道(W2, [1]); W2._msgs.length = 0;
    W2.planeGather('灵界');
    ok(/得 1 份灵材/.test(W2._最近()), 'F3 收着时念实收份数（不再是开价）：' + JSON.stringify(W2._最近()));

    const W3 = 装面();
    定骰(W3, [0.5, 0.6, 0.5, 0.5]); 装通道(W3, [0]); W3._复位(); W3._msgs.length = 0;
    const 回3 = W3.planeExplore();
    ok(回3 === true && /先腾个格子再来。/.test(W3._最近()) && W3._最近().indexOf('寻得') < 0,
        'F4 探幽满包：两处都落空时不念「寻得 …」那一串：' + JSON.stringify(W3._最近()));

    const W4 = 装面();
    定骰(W4, [0.5, 0.6, 0.5, 0.5]); 装通道(W4, [1]); W4._复位(); W4._msgs.length = 0;
    W4.planeExplore();
    ok(/寻得 (九叶灵芝|天心莲|五行精华|明月石)/.test(W4._最近()) && !/mat_/.test(W4._最近()),
        'F5 落袋时才把真名念进「寻得」（不是代号）：' + JSON.stringify(W4._最近()));

    // DES-96 控制组：问不到账 ⇒ 不许把缘由说死。桩子一件不收、但绝不写原因账（等价于「账被别人刷走了」）
    const W5 = 装面();
    定骰(W5, [0.5, 0.6, 0.5, 0.5]); 装通道(W5, [0], { 不写账: true }); W5._复位(); W5._msgs.length = 0;
    W5.planeExplore();
    ok(!/行囊已满|腾个格子/.test(W5._最近()) && /没能落进你的行囊/.test(W5._最近()),
        'F6 问不到账时只说中性话，不冒认「满包」：' + JSON.stringify(W5._最近()));
}

// ============ G DES-86：NPC 心愿谢礼——先落袋才准扣 NPC、才准结单 ============
console.log('\n[G] DES-86 心愿委托谢礼（从 js/npcs/npc-inventory.js 切出真函数）');
function 装愿(改) {
    const W = 造窗();
    const 源 = load('js/npcs/npc-inventory.js');
    let 体 = [切函数(源, 'function itemName(id) {'), 切函数(源, 'function completeWantQuest(npcId, itemId) {')].join('\n');
    if (改) 体 = 改(体);
    const 串 = '(function(){\n' + 体 + '\nwindow.__结 = completeWantQuest;\n})();';
    W._load串(串, 'npc-inventory-心愿');
    W.__摆 = function () {
        W.__扣 = 0; W.__好感 = 0;
        const 愿单 = { id: 'want_试匠_mat_lingzhi' };
        W.npcQuestSystem = { completedQuests: new Set(), availableQuests: [愿单], quests: new Map() };
        W.npcManager = {
            getNPC: function () {
                return {
                    name: '试匠',
                    inventory: { items: [{ templateId: 'chaos_beast_pelt', count: 3 }] },
                    removeItemFromInventory: function () { W.__扣++; },
                    changeAffection: function () { W.__好感++; }
                };
            }
        };
        W.__愿单 = 愿单;
        return 愿单;
    };
    W.__结的 = function () { return W.npcQuestSystem.completedQuests.has('want_试匠_mat_lingzhi'); };
    return W;
}
{
    const W = 装愿(); W.__摆(); 装通道(W, [0]); W._复位(); W._msgs.length = 0;
    const 钱0 = W.currentCharData.spiritStones;
    W.__结('试匠', 'mat_lingzhi');
    ok(!W.__结的(), 'G1 行囊塞不下 ⇒ 这一单不许标完成（改前 completedQuests 已加，永不再来）');
    ok(W.__扣 === 0, 'G2 NPC 那件谢礼没被扣走（改前无条件 removeItem ⇒ 他白丢一件）');
    ok(W.__好感 === 0, 'G3 好感不涨（改前无条件 +6）');
    ok(W.currentCharData.spiritStones === 钱0, 'G4 灵石兜底也没走（读数 ' + W.currentCharData.spiritStones + '）');
    ok(W.npcQuestSystem.availableQuests.indexOf(W.__愿单) >= 0,
        'G5 摘下的愿单挂回去了——下次再来还在（这一条不是「不放宽」而是「不吞货」）');
    ok(/先记着/.test(W._最近()) && W._最近().indexOf('委托达成') < 0, 'G6 满包那一屏：' + JSON.stringify(W._最近()));

    W.__摆(); 装通道(W, [1]); W._复位(); W._msgs.length = 0;
    W.__结('试匠', 'mat_lingzhi');
    ok(W.__结的() && W.__扣 === 1 && W.__好感 === 1,
        'G7 真落袋才结单：扣 NPC 一件、好感＋6、念「委托达成」');
    ok(/混沌兽皮/.test(W._最近()), 'G8 回执念的是真给出去那件：' + JSON.stringify(W._最近()));

    const 旧 = 装愿(体 => 改一处(体, 'function completeWantQuest(npcId, itemId) {', 'if (_收 > 0) {', 'if (true) {'));
    旧.__摆(); 装通道(旧, [0]); 旧._msgs.length = 0;
    旧.__结('试匠', 'mat_lingzhi');
    ok(旧.__结的() && 旧.__扣 === 1,
        'G9 改前复现：把「收着才扣」那一道拆掉，同一趟满包之后：单已结、NPC 那件已没了、玩家两手空空');

    const W2 = 装愿(); W2.__摆(); W2._msgs.length = 0;
    delete W2.addItemToInventory; delete W2.addItem;
    W2.__结('试匠', 'mat_lingzhi');
    ok(W2.__结的() && W2.__扣 === 1, 'G10 无行囊通道的世界按收下兜底（与各处同口径）');
}

// ============ H DES-87：制毒——成品全仓无模板，旧写法材料照扣、熟练度照涨 ============
console.log('\n[H] DES-87 制毒（真装 js/poison-system.js）');
function 装毒(改) {
    const W = 造窗();
    W.inventory.slots = [
        { templateId: 'mat_liquorice', count: 5 }, { templateId: 'mat_beast_fang', count: 5 }
    ];
    W.__扣 = 0;
    W.inventory.removeItem = function (id, n) {
        W.__扣++;
        const s = W.inventory.slots.filter(x => x.templateId === id)[0];
        if (s) s.count -= n;
        return true;
    };
    W.__涨 = 0;
    W.growLifeSkill = function () { W.__涨++; };
    W._load('js/poison-system.js', 改);
    W.__料 = function () { return W.inventory.slots.map(s => s.count).join('/'); };
    return W;
}
{
    const W = 装毒();
    ok(!!W.POISON_TYPES && !!W.POISON_TYPES.weak_poison, 'H0 三张毒方在（weak_poison→poison_weak）');
    const 在册 = !!(W.itemById.poison_weak || W.itemById.poison_medium || W.itemById.poison_strong);
    ok(!在册, 'H1 现场复扫：poison_weak／medium／strong 三枚成品 id **确实不在物品清册里**（DES-87 成立的前提）');

    W._msgs.length = 0;
    const 回 = W.craftPoison('weak_poison');
    ok(回 === false && /还没入册/.test(W._最近()), 'H2 无档成品 ⇒ 这一炉不开，且把缺哪一档说清楚：' + JSON.stringify(W._最近()));
    ok(W.__扣 === 0 && W.__料() === '5/5' && W.__涨 === 0,
        'H3 材料不动、熟练度不涨（改前：扣料＋涨熟练度＋念「成功制作」，玩家每配一次净亏那几味料）');

    const 旧 = 装毒(src => 改一处(src, 'function craftPoison(poisonType) {', "if (!(window.itemById && window.itemById[poisonItemId])) {", 'if (false) {'));
    旧._msgs.length = 0;
    旧.craftPoison('weak_poison');
    ok(旧.__扣 === 2 && /成功制作/.test(旧._msgs[旧._msgs.length - 1]),
        'H4 改前复现：抹掉验档那一道，同一炉之下材料扣光、还念「成功制作弱毒」（读数 ' + 旧.__料() + '）');

    const W2 = 装毒();
    W2.itemById.poison_weak = { name: '弱毒' };
    装通道(W2, [0]); W2._msgs.length = 0;
    ok(W2.craftPoison('weak_poison') === false && W2.__扣 === 0 && /行囊已满/.test(W2._最近()),
        'H5 成品有档但行囊满：材料仍不动（同族闸门一起收口）：' + JSON.stringify(W2._最近()));

    const W3 = 装毒();
    W3.itemById.poison_weak = { name: '弱毒' };
    装通道(W3, [1]); W3._msgs.length = 0;
    ok(W3.craftPoison('weak_poison') === true && W3.__扣 === 2 && W3.__涨 === 1 && /成功制作弱毒/.test(W3._最近()),
        'H6 档在、格子有 ⇒ 走通：扣料、涨熟练度、念得手（本批没把好的一侧改坏）');
}

// ============ I DES-88：调试面板 addAllItems 引用不存在的变量 ============
console.log('\n[I] DES-88 调试面板（从 js/debug-panel.js 切出真函数）');
function 装板(改) {
    const W = 造窗();
    const 源 = load('js/debug-panel.js');
    let 体 = ['function _debugAddItem(id, count) {', 'function addItem() {', 'function quickAddItem(id) {', 'function addAllItems() {']
        .map(h => 切函数(源, h)).join('\n');
    if (改) 体 = 改(体);
    const 串 = '(function(){\n'
        + 'function _showMsg(m, t) { window._msgs.push(String(m)); window.__型 = t; }\n'
        + 'function _refreshUI() { window.__刷 = (window.__刷 || 0) + 1; }\n'
        + 'function confirm() { return true; }\n'
        + 'var document = { getElementById: function () { return { value: String(window.__输入 === undefined ? "" : window.__输入) }; } };\n'
        + 体 + '\n'
        + 'window.__板 = { addItem: addItem, quickAddItem: quickAddItem, addAllItems: addAllItems, _debugAddItem: _debugAddItem };\n'
        + '})();';
    W._load串(串, 'debug-panel-切片');
    W.allItems = [{ id: 'mat_lingzhi' }, { id: 'mat_beast_fang' }, { id: 'no_such_item_x' }];
    return W;
}
{
    const W = 装板();
    装通道(W, [1]); W._复位(); W._msgs.length = 0;
    let 塌 = null;
    try { W.__板.addAllItems(); } catch (e) { 塌 = e; }
    ok(!塌, 'I1 「添加所有物品」点一次不再抛 ReferenceError（改前收尾那行引用了不存在的 count／errors）'
        + (塌 ? '｜实抛 ' + 塌.message : ''));
    ok(/成功 3 个物品/.test(W._最近()) && W.__刷 === 1,
        'I2 收尾念真数（3 成 0 败）且 _refreshUI 走得到：' + JSON.stringify(W._最近()));

    装通道(W, [1, 1, 0]); W._msgs.length = 0; W.__刷 = 0;
    W.__板.addAllItems();
    ok(/成功 2 个物品，失败 1 个/.test(W._最近()), 'I3 自证支：失败数由返回值决定，不是写死的 0：' + JSON.stringify(W._最近()));

    const W2 = 装板(); 装通道(W2, [0]); W2._msgs.length = 0;
    W2.__输入 = { value: 'mat_lingzhi' };
    W2.__板.addItem();
    ok(/失败，请检查ID/.test(W2._最近()), 'I4 单件添加也报实收（旧第三兜底硬 return true）：' + JSON.stringify(W2._最近()));

    const W3 = 装板(); let 收 = null;
    W3.addItemToInventory = function (id, n) { 收 = [id, n]; return 0; };
    ok(W3.__板._debugAddItem('mat_lingzhi', 2) === false && 收 && 收[1] === 2,
        'I5 第三兜底把实收原样报出去（不是恒 true）');

    const 源 = 去注释(load('js/debug-panel.js'));
    const 板体 = 切函数(源, 'function addAllItems() {');
    ok(!/\bcount\b/.test(板体) && !/\berrors\b/.test(板体),
        'I6 形状哨兵：addAllItems 的函数体里不许再出现 count／errors 这两个不存在的名字（DES-88 复发即红）');
    ok(/_refreshUI\(\);/.test(板体), 'I7 收尾仍走到 _refreshUI（改前那记 ReferenceError 把它跳过去了）');
}

// ============ J 棘轮：闸门顺序的形状账 ＋ 实收收口只准增 ============
console.log('\n[J] 两把棘轮');
{
    const 形状 = [
        ['js/map/landmark-explore.js', '剑真落袋 → 才关这道闸门', /if \(!_剑收\) \{[\s\S]{0,400}?\n        landmark\._swordPulled = true;/],
        ['js/world-events.js', '宝真落袋 → 才烧「本场已寻」', /if \(!_宝收\) \{[\s\S]{0,700}?_ta\.sought = true/],
        ['js/map/randomMap.js', '采着了一株 → 才判这片产地枯', /if \(got\.length\) \{\s*\n\s*cell\.node\.regrowDay =/],
        ['js/map/randomMap.js', '一件没带走 → 退还这一次翻动，且赶在回执之前（枯数现算）', /if \(!found\.length && _翻出落空\) 退还RuinDug\(poi\);\s*\n\s*const lead =/],
        ['js/npcs/npc-inventory.js', '谢礼真落袋 → 才结这一单', /if \(_收 > 0\) \{[\s\S]{0,900}?qs\.completedQuests\.add\(qid\)/],
        ['js/app.js', '身上没留货 → 才标「已搜刮」', /if \(!留下\.length\) \{\s*\n\s*corpse\.corpseData\.looted = true;/],
        ['js/poison-system.js', '成品有名分 → 才扣那一方的材料', /if \(!\(window\.itemById && window\.itemById\[poisonItemId\]\)\) \{[\s\S]{0,900}?_removeInventoryItem\(sp\.id, sp\.count\)/]
    ];
    形状.forEach(([r, 说, 型], n) => {
        ok(型.test(去注释(load(r))), 'J' + (n + 1) + ' 形状棘轮：' + r + '——' + 说 + '（这一对写法被拆开或删掉即红）');
    });

    let 收口 = 0;
    function walk(d, out) {
        for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
            const p = d + '/' + e.name;
            if (e.isDirectory()) walk(p, out);
            else if (e.name.endsWith('.js')) out.push(p);
        }
        return out;
    }
    for (const rel of walk('js', [])) {
        去注释(load(rel)).split('\n').forEach(s => {
            if (/Number\(\s*window\.(addItem|addItemToInventory|addResultItem)\s*\(/.test(s)) 收口++;
        });
    }
    ok(收口 >= 54, 'J8 「问实收」这一种写法是只准增的账：全仓现读 ' + 收口 + ' 处（第一百二十四～一百二十七批累计，一百二十七批把奇遇扩展表 42 处一并接进这条口径），删一处即红');

    // 普查两本账（与第一百二十五批同一把尺）
    const 主 = [], 副 = [];
    for (const rel of walk('js', [])) {
        去注释(load(rel)).split('\n').forEach((s, i) => {
            if (!/window\.(addItem|addResultItem|addItemToInventory)\s*\(/.test(s)) return;
            if (/=/.test(s.split(/window\.(addItem|addResultItem|addItemToInventory)/)[0])) return;
            if (/\breturn\b|!window\.|\?|&&|\|\|/.test(s)) return;
            (/\bif\s*\(/.test(s) ? 副 : 主).push(rel + ':' + (i + 1));
        });
    }
    ok(主.length === 0, 'J9 主账：一百二十四批 23 → 一百二十五批 18 → 一百二十六批 16 → 一百二十七批 15 → **第一百三十批 0**（余下 15 处全收，含两行「无 giveWithReceipt 就不认数」的兜底）：只准为 0，现读 ' + 主.length + (主.length ? '\n      ' + 主.join('\n      ') : ''));
    ok(副.length === 0, 'J10 副账（同行带 if 守卫的裸调用）：开案 48 → 38 → 一百二十七批归零钉死；现读 ' + 副.length + '，只准为 0');
}

console.log('\n=== 第一百二十六批套件：通过 ' + 通过 + ' / 失败 ' + 失败 + ' ===');
if (失败 > 0) process.exitCode = 1;
