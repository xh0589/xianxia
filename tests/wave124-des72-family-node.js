// 第一百二十四批 · DES-72 同族收口：产出与奖励那一族「念的是开价、不是实收」
// 契约来自第八十二波：window.addItem（＝window.addItemToInventory，js/inventory.js:169/:2516）返回**实收件数**；
// js/crafting.js:717 的 addResultItem 自第一百二十三批起同样返回实收数。
// 本批改动 6 本 js ＋ app.js 六处；证据分两档，逐段标出：vm 行为＝把真文件装进沙箱真调一次；读码＝源码结构断言。
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

// ============ 公共沙箱 ============
function 造窗() {
    const W = {
        console: { log: function () { }, warn: function () { }, error: function () { } },
        setTimeout: function () { return 0; },
        localStorage: { getItem: function () { return null; }, setItem: function () { }, removeItem: function () { } },
        document: {
            getElementById: function () { return null; },
            querySelector: function () { return null; },
            createElement: function () { return { style: {}, classList: { add() { }, remove() { }, contains() { return false; } }, dataset: {}, innerHTML: '' }; },
            addEventListener: function () { },
            body: { appendChild() { }, insertAdjacentHTML() { } }
        },
        alert: function () { }
    };
    W.window = W;
    W._msgs = [];
    W._logs = [];
    W.showMessage = function (t) { W._msgs.push(String(t)); };
    W.gameLog = { add: function (t) { W._logs.push(String(t)); } };
    W.timeSystem = {
        gameTime: { totalMinutes: 8 * 60, currentDay: 7 },
        advanceTime: function () { }
    };
    W.updateCharacterStatus = function () { };
    W.updateInventoryUI = function () { };
    W.updateCurrencyUI = function () { };
    W.updateAllStatDisplays = function () { };
    W.EventBus = { emit() { }, on() { } };
    W.StateRegistry = { register: function () { return function () { }; } };
    W.itemById = {
        mat_liquorice: { name: '甘草' }, mat_iron_ore: { name: '铁矿石' },
        iron_ore: { name: '铁矿石' }, spirit_grass: { name: '灵草' }, spirit_stone: { name: '灵石' },
        mat_chaos_stone: { name: '混沌石' }, mat_demon_beast_core: { name: '妖兽内丹' }
    };
    W.inventory = { currency: { spiritStones: 100, copper: 0 }, slots: [] };
    W.currentCharData = { name: '试子', realm: '筑基', layer: 1, qi: 500, maxQi: 500, hp: 100, maxHp: 100, spiritStones: 100, lifeSkills: {} };
    vm.createContext(W);
    W._load = function (rel, wrap) {
        let src = load(rel);
        if (wrap) src = '(function(){\n' + src + '\n})();';
        vm.runInContext(src, W, { filename: rel });
    };
    W._定骰 = function (v) { vm.runInContext('Math.random = function(){return ' + v + ';}', W); };
    W._最近 = function () { return W._msgs[W._msgs.length - 1] || ''; };
    return 装说话手(W);   // 第一百三十九批：每一段都得有真说话手，否则站点问不到账只能念回退句
}

// 件数桩：按队列依次回报实收件数（队列耗尽后按最后一次回报）
function 装通道(W, 队列) {
    let i = 0;
    // 第一百三十八批（DES-96）：这支桩原先只回报件数、从不写原因账，站点问不到账只能落回写死的回退句。
    // 现在照 js/inventory.js:180／:198 的真口径落笔：进函数先清账，一件没进才是格子的事（半包不落笔）。
    const 报 = function (n) {
        const v = i < 队列.length ? 队列[i] : 队列[队列.length - 1]; i++;
        W.addItemFailReason = null;
        if (v <= 0) W.addItemFailReason = 'bag_full';
        return v;
    };
    W.addItem = function (id, n) { return 报(n); };
    W.addItemToInventory = W.addItem;
    W.addResultItem = function (id, n) { return 报(n); };
    W._队列 = 队列;
    W._复位 = function () { i = 0; };
}

// 第一百三十八批（DES-97）：沙箱里得有真说话手，否则从句支缺席、站点静默落回写死的回退句——
// 那种红是桩的错。切的是 js/inventory.js 说话手那一段原文（锚点变了就抛，别让尺悄悄失效）。
function 装说话手(W) {
    const 源 = load('js/inventory.js');
    const 起 = 源.indexOf('// DES-90（第一百二十八批）：发奖回执要说');
    const 止 = 源.indexOf('// ============ 第八十三波·实例账');
    if (起 < 0 || 止 < 0 || 止 <= 起) throw new Error('js/inventory.js 的说话手那一段没切到——锚点变了，探针要跟着改');
    vm.runInContext(源.slice(起, 止), W, { filename: 'inventory-说话手' });
    return W;
}

// ============ A 门派地标采集（vm 行为） ============
console.log('\n[A] 门派采药／采矿／探索（真调 useSectResource）');
{
    const W = 造窗();
    W.discipleState = { isInSect: true, sectId: '试门', rank: 5, contribution: 0 };
    W.SECT_DEEP_DATA = {
        '试门': {
            specialResources: [
                { id: 'r_herb', type: 'herb', name: '试药圃', output: 10 },
                { id: 'r_ore', type: 'mine', name: '试矿脉', output: 10 },
                { id: 'r_exp', type: 'explore', name: '试秘境', output: 10 }
            ]
        }
    };
    W._load('js/sects/sect-resource-actions.js');
    ok(typeof W.useSectResource === 'function', 'A0 地标动作入口确在 window.useSectResource');
    W._定骰(0.01);                       // 采药 count=1+1=2、采矿 count=2、探索走材料支
    装通道(W, [0, 0]);

    W._msgs.length = 0; W._复位();
    W.useSectResource('试门', 'r_herb');
    const 满包 = W._最近();
    ok(满包.indexOf('采得') < 0 && /也没能带走/.test(满包),
        'A1 行囊一件不收时不念「采得」，改口「一株也没能带走」（屏上读数：' + JSON.stringify(满包) + '）');
    ok(满包.indexOf('undefined') < 0 && !/×[1-9]/.test(满包), 'A2 撤谎自证：这一屏不许再凭空念株数（改前恒念「×2」）');

    W._msgs.length = 0; W._复位();
    装通道(W, [1, 0]); W._复位();
    W.useSectResource('试门', 'r_herb');
    const 半包 = W._最近();
    const 念着的 = (半包.match(/×(\d+)/g) || []).reduce((a, s) => a + Number(s.slice(1)), 0);
    // 第一百三十九批（钉法更新，一字未松）：旧字面「另 1 株…没能带走/没带走」已随生产码
    // js/sects/sect-resource-actions.js:207 的回退文案换成词表口径。实测这一屏的落袋未成实话是
    // 「另 1 株：行囊已满，先腾个格子再来。」（账上落了 bag_full 一笔 ⇒ failPhraseFor 命中「行囊已满，先腾个格子再来」，
    // 从句支不带句号，句尾的「。」是模板自己补的）。核心要求原样保留：
    // ①念着的 === 1（实收 1，不是掷出的 2）②必须有「另 1 株」那一句落袋未成的实话 ③旧谎话「行囊塞不下」不许出现。
    // 生产码是对的：它念的是 addItem 的实收数与原因账上的真缘由，不是黑话串。
    ok(念着的 === 1 && /另 1 株.*行囊已满/.test(半包) && 半包.indexOf('行囊塞不下') < 0,
        'A3 只吞 1 株时：回执里念出的总株数＝实收 1（不是掷出的 2），并补一句「另 1 株…行囊已满，先腾个格子再来。」（读数 ' + JSON.stringify(半包) + '）');

    W._msgs.length = 0; 装通道(W, [1, 1]); W._复位();
    W.useSectResource('试门', 'r_herb');
    const 全收 = W._最近();
    ok(全收.indexOf('采得') >= 0 && 全收.indexOf('没带走') < 0 && (全收.match(/×(\d+)/g) || []).length === 1,
        'A4 全收着时照旧念「采得」、不加多余的塞不下话头（别把修好的那侧也念成病灶）');

    W._msgs.length = 0; 装通道(W, [0, 0]); W._复位();
    W.useSectResource('试门', 'r_ore');
    ok(W._最近().indexOf('一块也没能带走') >= 0, 'A5 采矿同族收口：' + JSON.stringify(W._最近()));

    W._msgs.length = 0; 装通道(W, [0]); W._复位();
    W.useSectResource('试门', 'r_exp');
    ok(/没能带走/.test(W._最近()) && /行囊已满，先腾个格子再来。/.test(W._最近()) && W._最近().indexOf('×1') < 0,
        'A6 探索拾得：一件没收着时不再闭眼念「×1」，缘由由原因账念（读数 ' + JSON.stringify(W._最近()) + '）');

    W._msgs.length = 0; 装通道(W, [3, 3]); W._复位();     // 自证支：故意让通道报 3
    W.useSectResource('试门', 'r_herb');
    ok((W._最近().match(/×(\d+)/g) || []).some(s => s === '×3' || s === '×6'),
        'A7 自证支：把通道回报改成 3，屏上就念 3——证明上面的数字确实来自返回值，不是探针自己算的（读数 ' + JSON.stringify(W._最近()) + '）');

    W._msgs.length = 0;
    delete W.addItem; delete W.addItemToInventory; delete W.addResultItem;
    W.useSectResource('试门', 'r_exp');
    ok(W._最近().length > 0, 'A8 背包通道缺席（沙箱／无行囊世界）时不崩、按旧口径回执——这条兜底支在册');
}

// ============ B 门派工坊发物资（vm 行为） ============
console.log('\n[B] 门派设施 rewardMaterials（真调 useFacility）');
{
    const W = 造窗();
    W.discipleState = { isInSect: true, sectId: '试门', rank: 5, contribution: 0 };
    W._load('js/sects/sect-facilities.js');
    const 库 = W.facilities;
    ok(Array.isArray(库) && 库.length > 0, 'B0 设施清册确在 window.facilities（数组本体，插一条即生效）');
    库.push({
        id: 'zz_test_store', name: '试库房', type: 'storage', rankReq: null, dailyUses: 0,
        desc: '探针用', actions: [{ type: 'rewardMaterials', name: '领物资', items: [{ itemId: 'iron_ore', count: 5 }, { itemId: 'spirit_grass', count: 3 }] }]
    });
    W._定骰(0.01);
    装通道(W, [5, 3]); W._复位();
    let r = W.useFacility('zz_test_store', { fromScenario: true, quiet: true });
    ok(r && r.ok && /铁矿石x5/.test(r.text) && /灵草x3/.test(r.text) && r.text.indexOf('没领到') < 0,
        'B1 全收着：物资行按实收念 x5／x3，不加「没领到」话头');
    装通道(W, [2, 0]); W._复位();
    r = W.useFacility('zz_test_store', { fromScenario: true, quiet: true });
    // 第一百三十九批（钉法更新，一字未松）：旧字面「另 6 件…没…」已随生产码
    // js/sects/sect-facilities.js:867 的回退文案换成词表口径。实测这一屏的落袋未成实话是
    // 「另 6 件：行囊已满，先腾个格子再来）」（账上落了 bag_full 一笔 ⇒ failPhraseFor 命中「行囊已满，先腾个格子再来」，
    // 机构交付用③形，括号内不带句号）。核心要求原样保留：
    // ①铁矿石x2（实收 2，不是开价 5）②灵草x0（一件没收着）③必须有「另 6 件」那一句落袋未成的实话
    // ④旧谎话「没领到」不许出现。生产码是对的：它念的是 addItem 的实收数与原因账上的真缘由。
    ok(r && r.ok && /铁矿石x2/.test(r.text) && /灵草x0/.test(r.text) && /另 6 件[^)]*行囊已满/.test(r.text) && r.text.indexOf('没领到') < 0,
        'B2 半收＋一件没收着：念 x2 与 x0，并补「另 6 件」那一句落袋未成的实话（改前两句都念开价 x5／x3）');
    ok(r && r.text.indexOf('undefined') < 0, 'B3 撤谎自证：这一屏没有 undefined 漏上来');
    装通道(W, [5, 3]); W._复位();
    库.length = 库.findIndex(f => f.id === 'zz_test_store');   // 拆掉探针设施，别留脏清册
    ok(W.facilities.filter(f => f.id === 'zz_test_store').length === 0, 'B4 收尾自紧：探针设施不留在清册里（本套件不改仓库状态）');
}

// ============ C 两炉合成（读码＋契约） ============
console.log('\n[C] 炼丹／锻兵出炉回执（读码档：契约链）');
{
    const 丹 = 去注释(load('js/crafting/alchemy-compound.js'));
    const 器 = 去注释(load('js/crafting/forging-compound.js'));
    ok(/var addGot = _asked;/.test(丹) && /addGot = Number\(window\.addResultItem\(itemId, _asked\)\) \|\| 0;/.test(丹),
        'C1 炼丹：addGot 由 addResultItem 的返回值算出（旧写法把返回值压成布尔 addOk）');
    ok(/count: addGot, asked: _asked/.test(丹), 'C2 炼丹成功返回同时带 count（实收）与 asked（开价）');
    ok(/var addedGot = outCount;/.test(器) && /count: addedGot, asked: outCount/.test(器),
        'C3 锻兵：同样带回实收与开价两个数（旧写法 return 的是 outCount 开价）');
    ok(!/addedOk = window\.addResultItem/.test(器) && !/addOk = window\.addResultItem/.test(丹),
        'C4 棘轮：两炉都不许再把 addResultItem 的返回值当布尔用（复发即红）');
    ok(/if \(!addGot\)/.test(丹) && /if \(!addedGot\)/.test(器),
        'C5 一件没收着时仍走原回滚支（材料退回＋reason inventory-full），本批没放宽失败口径');

    const UI = 去注释(load('js/crafting/compound-ui.js'));
    ok(/res\.count < res\.asked/.test(UI) && /这一炉收下 /.test(UI), 'C6 丹炉那屏念实收粒数，塞不下时补「另 N 粒没处放」');
    ok(/极品本该成双，行囊只收下/.test(UI), 'C7 锻兵那屏：「极品出炉成双」这句要两件真进囊才念得出口');
    const 两扇 = UI.split('res.ok').length - 1;
    ok(两扇 >= 2, 'C8 自紧闸：两处成功分支都还在（' + 两扇 + ' 处），别把其中一扇改回开价口径');
}

// ============ D 悬赏领奖（vm 行为） ============
console.log('\n[D] 江湖悬赏榜领奖（真调 claimBounty）');
{
    const W = 装说话手(造窗());
    W._load('js/quest/bounty-board.js');
    ok(typeof W.claimBounty === 'function', 'D0 领奖口确在 window.claimBounty');
    const board = W.getBountyBoard();
    ok(Array.isArray(board) && board.length > 0, 'D1 榜上有单（' + board.length + ' 条）');
    const b = board[0];
    b.accepted = true; b.completed = true; b.claimed = false;
    b.items = [{ itemId: 'mat_chaos_stone', count: 2 }];
    b.stones = 200;
    装通道(W, [1]); W._复位();
    W._msgs.length = 0; W._logs.length = 0;
    ok(W.claimBounty(0) === true, 'D2 领奖走通');
    const 屏 = W._最近();
    // 掷 2 收 1 是**半包**：js/inventory.js:198 只在一件没进时才落 bag_full，半包账上没这一笔
    // ⇒ 缘由只许说中性从句（第一百三十五批定下的口径），句号也不许落进括号（DES-97）
    ok(/混沌石×1/.test(屏) && /（另 1 件：没能落进你的行囊）/.test(屏) && !/。，|。）/.test(屏) && /行囊已满/.test(屏) === false,
        'D3 材料那笔从此上屏（改前整条回执只念灵石，材料无声蒸发；第一百三十八批起缘由问这一笔的账）：' + JSON.stringify(屏));
    ok(W._logs.join('|').indexOf('混沌石×1') >= 0, 'D4 日志那一行也带实收（两处同源，不分两本口径）');
    ok(W.currentCharData.spiritStones === 300, 'D4b 自紧闸：灵石那笔仍走账（NEW-73 别名在册时 200 要真进袋，本批没动钱的路径）');
    b.claimed = false; 装通道(W, [2]); W._复位(); W._msgs.length = 0;
    W.claimBounty(0);
    ok(W._最近().indexOf('没领到') < 0 && /混沌石×2/.test(W._最近()), 'D5 全收着时不多念一句塞不下');
    b.claimed = false; 装通道(W, [0]); W._复位(); W._msgs.length = 0;
    W.claimBounty(0);
    ok(/（另 2 件：行囊已满，先腾个格子再来）/.test(W._最近()) && W._最近().indexOf('混沌石×') < 0,
        'D6 一件没收着：不凭空念「混沌石×N」，只报这一笔的账（读数 ' + JSON.stringify(W._最近()) + '）');
}

// ============ E 家族普查棘轮：返回值不许再丢在地上 ============
// 第一百三十批改口（修尺）：旧尺只认 `window.addItem(` 一种写法，把 W.addItem／裸 addItem／npc.addItemToInventory／
// 一行多调用／三元续行全当成「不存在」——它读出 0 处的那天，宽口径同日读出十几处。
// 新尺按「语句位」判定：调用式的头部前面是行首／;／{／} 之一，就是返回值丢在地上；
// 函数/方法定义与字符串里的调用（onclick）单列归档，既不算裸、也不算已收口。
console.log('\n[E] 全仓发奖调用普查（第一百三十批·语句位宽口径，只准缩不准涨）');
{
    const 已收口 = ['js/sects/sect-resource-actions.js', 'js/sects/sect-facilities.js', 'js/crafting/alchemy-compound.js', 'js/crafting/forging-compound.js', 'js/quest/bounty-board.js', 'js/app.js',
        'js/city-depth.js', 'js/quest/qi-arc2.js', 'js/quest/qi-arc3.js', 'js/extensions/cave-life.js', 'js/sects/sect-war.js', 'js/sects/sect-governance.js', 'js/sects/sect-trials.js',
        'js/sects/sect-cities.js', 'js/cultivation/heavenly-tribulation.js', 'js/map/randomMap.js'];
    function walk(d, out) {
        for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
            const p = d + '/' + e.name;
            if (e.isDirectory()) walk(p, out);
            else if (e.name.endsWith('.js')) out.push(p);
        }
        return out;
    }
    const NAME = /(addItem|addItemToInventory|addResultItem|giveWithReceipt)\s*\(/g;
    const 裸 = [], 定义 = [], 串中 = [], 认数 = [], 旧窄尺 = [];
    for (const rel of walk('js', [])) {
        load(rel).split('\n').forEach((s0, i) => {
            const s = s0.split('//')[0];
            if (/window\.(addItem|addResultItem|addItemToInventory)\s*\(/.test(s)
                && !/=/.test(s.split(/window\.(addItem|addResultItem|addItemToInventory)/)[0])
                && !/\breturn\b|!window\.|\?|&&|\|\||if\s*\(/.test(s)) 旧窄尺.push(rel + ':' + (i + 1));
            NAME.lastIndex = 0;
            let m;
            while ((m = NAME.exec(s))) {
                let 头 = m.index;
                while (头 > 0 && /[A-Za-z0-9_$.]/.test(s[头 - 1])) 头--;
                const before = s.slice(0, 头).trimEnd();
                const at = rel + ':' + (i + 1) + '  ' + s.trim().slice(0, 110);
                if (/['"`]$/.test(before)) { 串中.push(at); continue; }
                if (/\bfunction\b\s*[A-Za-z_$]*\s*$/.test(before)) { 定义.push(at); continue; }
                if (头 === s.search(/\S/) && /^\s*[\w$]+\s*\([^)]*\)\s*\{?\s*$/.test(s)) { 定义.push(at); continue; }
                if (before === '' || /[;{}]$/.test(before) || before.slice(-1) === '}') { 裸.push(at); continue; }
                认数.push(at);
            }
        });
    }
    console.log('  [E 读数] 语句位裸 ' + 裸.length + '／定义 ' + 定义.length + '／字符串 ' + 串中.length + '／认数 ' + 认数.length
        + '（调用点共 ' + (裸.length + 定义.length + 串中.length + 认数.length) + ' 处）；旧窄尺同屏读数 ' + 旧窄尺.length + ' 处——两把尺差出来的那几处，就是旧尺的盲区');
    ok(裸.length === 0, 'E1 全仓语句位裸调用归零（第一百三十批：窄尺 23→18→16→15→0，宽尺同日再收 city-depth 货架／剑冢／塔赐、qi-arc2 阵眼灵石、qi-arc3 两坛酒、app 动态秘境材料＋NPC 换装旧件，现读 ' + 裸.length + '）'
        + (裸.length ? '，清单：\n      ' + 裸.join('\n      ') : ''));
    const 已收口裸 = 裸.filter(x => 已收口.includes(x.split(':')[0]));
    ok(已收口裸.length === 0, 'E2 已收口的 ' + 已收口.length + ' 本文件里，发东西的返回值一处不许再丢在地上（实得 ' + 已收口裸.length + '：' + 已收口裸.join(', ') + '）');
    ok(裸.length + 定义.length + 串中.length + 认数.length >= 180,
        'E3 尺没瞎自检（本批新钉）：宽口径在全仓可见的发奖调用点 ' + (裸.length + 定义.length + 串中.length + 认数.length)
        + ' 处，少于一百八十处即红——尺读空了比尺读出 0 更危险（第一百三十批的教训：窄尺报 0，宽尺同日报 15）');
    console.log('  [E 备注] 「认数」＝返回值被接进了变量或表达式，这一层尺看不出是否真被读过——那由本套件的沙箱段逐点验');
}

// ============ F app.js 六处（读码档） ============
console.log('\n[F] 野外采矿／伐木／贡献商店／NPC 回礼／宝箱／筑基丹（app.js，读码档）');
{
    const src = 去注释(load('js/app.js'));
    // F6 的锚写在 // 注释里，去注释会把它一起抹掉 ⇒ 这一段在原始源码上定位
    const raw = load('js/app.js');
    const 块 = (锚, 长) => { const i = src.indexOf(锚); return i < 0 ? '' : src.slice(i, i + 长); };
    const 原块 = (锚, 长) => { const i = raw.indexOf(锚); return i < 0 ? '' : raw.slice(i, i + 长); };
    const 采 = 块('采矿完成：', 400);
    ok(块('let gained = [];\n    let 没带走 = 0;', 2000).indexOf('Number(window.addItem(r.item, count))') >= 0,
        'F1 采矿：gained 记的是实收数（旧写法先 push 开价再调 addItem）');
    ok(采.indexOf('没带走') >= 0, 'F2 采矿回执带「没带走」尾巴：' + JSON.stringify(采.slice(0, 60)));
    ok(块('伐木完成：', 400).indexOf('没带走') >= 0 && src.indexOf('got = Number(window.addItem(r.item, count))') > 0,
        'F3 伐木同形收口（同一支笔，两处不再各写各的）');
    const 换 = 块('贡献商店·' , 2600);
    ok(/got <= 0/.test(换) && /贡献已退回/.test(换),
        'F4 贡献商店：一件没落袋时退贡献、认「这一单没做成」（改前白扣一笔还念「兑换成功」）');
    ok(换.indexOf('兑换成功！获得 ${itemName} ×${count}') < 0, 'F5 棘轮：那句按开价念的「兑换成功」不许回来');
    const 礼 = 去注释(原块('高价值赠礼可能获得回礼', 900));
    ok(礼.indexOf('if (收下 > 0) rewardMsg') >= 0, 'F6 NPC 回礼：落袋才念「回赠了」');
    ok(/else rewardMsg = .*没能带走/.test(礼) && /addItemFailText/.test(礼), 'F6b 一件没收着时不装没事：如实说「回赠了…你没能带走」，缘由交给原因账');
    const 药 = (() => { const i = raw.indexOf('并额外得到筑基丹'); return i < 0 ? '' : raw.slice(i - 400, i + 400); })();
    ok(/_fpGot > 0 \? '交易成功/.test(药) && /没能带走/.test(药) && /addItemFailText/.test(药),
        'F7 流浪修士那笔筑基丹：实收才念「并额外得到筑基丹」，满包时改口并问原因账（改前返回值丢在地上）');
    const 箱 = (() => { const i = raw.indexOf('打开宝箱获得疗伤丹'); return i < 0 ? '' : raw.slice(i - 400, i + 400); })();
    ok(/_pillGot > 0 \? '打开宝箱/.test(箱) && /没能带走/.test(箱),
        'F8 宝箱疗伤丹同形：摸到手不等于进得了囊，没落袋时说「没能带走」（第一百一十九批 DES-59 那一族的下半）');
}

console.log('\n=== 第一百二十四批 DES-72 同族套件：通过 ' + 通过 + ' / 失败 ' + 失败 + ' ===');
if (失败 > 0) process.exitCode = 1;
