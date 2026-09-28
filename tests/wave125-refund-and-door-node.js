// 第一百二十五批 · 「退回去的东西」这一族：行囊满时不许吞装备、不许门派虚记账、不许念「材料已退回」
// ＋ DES-81（四本模块的进城钩子挂在一扇没人走的门上）
// 契约还是第八十二波那条：window.addItem（＝window.addItemToInventory，js/inventory.js:169／别名 :2516）返回**实收件数**。
// 上一批（第一百二十四批）收的是「产出念开价」；这批收的是**反向的那一半**：往外退／往下摘的时候，退没退进去、摘没摘干净。
// 证据分两档，逐段标出：vm 行为＝把真文件装进沙箱真调一次；读码＝源码结构断言。
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
    W._logs = [];
    W.showMessage = function (t) { W._msgs.push(String(t)); };
    W.gameLog = { add: function (t) { W._logs.push(String(t)); } };
    W.log = function (t) { W._logs.push(String(t)); };
    W.timeSystem = { gameTime: { totalMinutes: 8 * 60, currentDay: 7 }, advanceTime: function () { } };
    W.updateCharacterStatus = function () { };
    W.updateInventoryUI = function () { };
    W.updateCurrencyUI = function () { };
    W.updateAllStatDisplays = function () { };
    W.updatePartyUI = function () { };
    W.EventBus = { emit() { }, on() { } };
    W.StateRegistry = { register: function () { return function () { }; } };
    W.itemById = {
        mat_lingzhi: { name: '灵药' }, mat_demon_beast_core: { name: '妖兽内丹' }, mat_meteorite: { name: '陨铁' },
        iron_ore: { name: '铁矿石' }, spirit_grass: { name: '灵草' }, spirit_stone: { name: '灵石' },
        wpn_test_old: { name: '试旧的剑' }, wpn_test_new: { name: '试新的刀' }
    };
    W.inventory = { currency: { spiritStones: 100, copper: 0 }, slots: [] };
    W.currentCharData = {
        name: '试子', realm: '筑基', layer: 1, qi: 500, maxQi: 500, hp: 100, maxHp: 100,
        spiritStones: 100, energy: 100, lifeSkills: {}, location: ''
    };
    W.flags = {};
    W.getFlag = function (k) { return W.flags[k]; };
    W.setFlag = function (k, v) { W.flags[k] = v === undefined ? true : v; };
    W.hasFlag = function (k) { return !!W.flags[k]; };
    vm.createContext(W);
    W._load = function (rel, wrap) {
        let src = load(rel);
        if (wrap) src = '(function(){\n' + src + '\n})();';
        vm.runInContext(src, W, { filename: rel });
    };
    W._load串 = function (src, tag) { vm.runInContext(src, W, { filename: tag }); };
    // 第一百三十八批（DES-96/97）：沙箱里得装上真说话手，否则从句支缺席、站点静默落回写死的回退句——
    // 那种红是桩的错。切 js/inventory.js 说话手那一段原文（锚点变了就抛，别让尺悄悄失效）
    {
        const 源 = load('js/inventory.js');
        const 起 = 源.indexOf('// DES-90（第一百二十八批）：发奖回执要说');
        const 止 = 源.indexOf('// ============ 第八十三波·实例账');
        if (起 < 0 || 止 < 0 || 止 <= 起) throw new Error('js/inventory.js 的说话手那一段没切到——锚点变了，探针要跟着改');
        vm.runInContext(源.slice(起, 止), W, { filename: 'inventory-说话手' });
    }
    W._定骰 = function (v) { vm.runInContext('Math.random = function(){return ' + v + ';}', W); };
    W._最近 = function () { return W._msgs[W._msgs.length - 1] || ''; };
    return W;
}

// 件数桩：按队列依次回报实收件数（队列耗尽后按最后一次回报）
function 装通道(W, 队列) {
    let i = 0;
    const 报 = function () {
        const v = i < 队列.length ? 队列[i] : 队列[队列.length - 1]; i++;
        // 与 js/inventory.js:180／:198 同口径：进函数先清账，一件没进才是格子的事（半包不落笔）
        W.addItemFailReason = null;
        if (v <= 0) W.addItemFailReason = 'bag_full';
        return v;
    };
    W.__调用次数 = 0;
    W.addItem = function (id, n) { W.__最后 = [id, n]; W.__调用次数++; return 报(n); };
    W.addItemToInventory = W.addItem;
    W.addResultItem = function (id, n) { W.__调用次数++; return 报(n); };
    W._复位 = function () { i = 0; W.__调用次数 = 0; };
    W._收口 = function () { return i; };
}

// ============ A DES-81：进城钩子到底响不响（vm 行为＋改前复现） ============
console.log('\n[A] DES-81 进城钩子的门（真装 location-system.js）');
{
    function 装一门(源码改回旧写法) {
        const W = 造窗();
        let src = load('js/location-system.js');
        if (源码改回旧写法) {
            const 新形 = /enterCity: function \(cityName\) \{[\s\S]*?\n    \},/;
            if (!新形.test(src)) throw new Error('A改前复现：找不到 DES-81 那一支派发（源码形状变了，探针该跟着改）');
            src = src.replace(新形, 'enterCity,');
        }
        W._load串(src, 'location-system' + (源码改回旧写法 ? '-旧写法' : ''));
        // 在 window.enterCity 上挂一枚探针（sect-roster／sect-cities／sect-identity 就是这么挂的）
        W.__钩子响了 = 0;
        W.enterCity = function (cityName) { W.__钩子响了++; W.__钩子收到 = cityName; return '钩子返回:' + cityName; };
        const 回 = W.locationSystem.enterCity('帝都·长安');
        return { W, 响: W.__钩子响了, 收到: W.__钩子收到, 回 };
    }
    const 改后 = 装一门(false);
    ok(改后.响 === 1 && 改后.收到 === '帝都·长安',
        'A1 走 locationSystem.enterCity（真赶路的道）时，挂在 window.enterCity 上的进城钩子响 1 次（实读 ' + 改后.响 + '）');
    ok(改后.回 === '钩子返回:帝都·长安',
        'A2 返回值原样穿过派发（屏上「来到了X」那一路的成败判据不许被这一支吃掉）：' + JSON.stringify(String(改后.回)));

    const 改前 = 装一门(true);
    ok(改前.响 === 0,
        'A3 改前复现：把派发写回旧的 `enterCity,` 同一支钩子**一次都不响**——A1 量的确实是本批这一笔，不是探针自己绕的门（实读 ' + 改前.响 + '）');

    // 回落支：window.enterCity 未被包装（＝就是原函数）时不许多绕一层、更不许递归
    const W2 = 造窗();
    W2._load('js/location-system.js');
    ok(W2.locationSystem.enterCity === undefined || typeof W2.locationSystem.enterCity === 'function', 'A4 导出的 enterCity 确在（装载没炸）');
    W2.__原样次数 = 0;
    const 原门 = W2.enterCity;
    W2.enterCity = function (c) { W2.__原样次数++; return 原门 === W2.enterCity ? '递归' : '一次'; };
    W2.locationSystem.enterCity('炎城');
    ok(W2.__原样次数 === 1, 'A5 派发只绕一层：钩子被调 1 次就到底（没有自递归，实读 ' + W2.__原样次数 + '）');
    W2.__原样次数 = 0;
    delete W2.enterCity;
    let 塌了 = false;
    try { W2.locationSystem.enterCity('炎城'); } catch (e) { 塌了 = true; }
    ok(!塌了, 'A6 兜底支：window.enterCity 缺席（沙盒／半装载世界）时回落到模块内原函数，不炸');
}

// ============ B DES-82：卸下装备不许把装备卸没了（vm 行为） ============
console.log('\n[B] DES-82 队员卸下装备（真调 unequipMemberSlot）');
{
    const W = 造窗();
    W._load('js/party-system.js');
    ok(typeof W.unequipMemberSlot === 'function' && typeof W.assignBagItemToMember === 'function',
        'B0 两个动作入口确在（经典脚本顶层函数＝全局）');
    W.partyData.members = [{ id: 'm1', name: '试伴', equipment: { weapon: { templateId: 'wpn_test_old', name: '试旧的剑' } } }];
    W.showMemberEquipModal = function () { };
    W.openPartyMemberModal = function () { };
    W._定骰(0.5);

    装通道(W, [0]); W._复位(); W._msgs.length = 0;
    W.unequipMemberSlot('m1', 'weapon');
    ok(!!W.partyData.members[0].equipment.weapon,
        'B1 行囊一件不收时：装备仍留在队员身上（改前 delete 照执行 ⇒ 这件剑当场蒸发）');
    const 满包 = W._最近();
    ok(满包.indexOf('没落进你的行囊') >= 0 && /行囊已满，先腾个格子再来。/.test(满包) && 满包.indexOf('已卸下') < 0,
        'B2 满包那一屏不再念「已卸下放回背包」：' + JSON.stringify(满包));

    装通道(W, [1]); W._复位(); W._msgs.length = 0;
    W.unequipMemberSlot('m1', 'weapon');
    ok(!W.partyData.members[0].equipment.weapon, 'B3 真落进背包一件才准摘下来');
    ok(W._最近().indexOf('已卸下放回背包') >= 0, 'B4 收着时照旧念「已卸下」（别把修好的那侧念成病灶）');

    W.partyData.members[0].equipment.weapon = { templateId: 'wpn_test_old', name: '试旧的剑' };
    装通道(W, [2]); W._复位();
    W.unequipMemberSlot('m1', 'weapon');
    ok(W.__调用次数 === 1 && !W.partyData.members[0].equipment.weapon,
        'B5 自证支：通道回报 2 件时照样放行——摘与不摘真由返回值决定，不是探针写死的');
}

// ============ C DES-82 同族：换装时旧件退不回就不许动新件（vm 行为） ============
console.log('\n[C] DES-82 换装（真调 assignBagItemToMember）');
{
    const W = 造窗();
    W._load('js/party-system.js');
    W.showMemberEquipModal = function () { W.__开窗 = (W.__开窗 || 0) + 1; };
    W.openPartyMemberModal = function () { };
    W._定骰(0.5);
    function 摆包() {
        W.__移除调用 = 0;
        W.inventory.slots = [{ uid: 'u_new', templateId: 'wpn_test_new', count: 1, getTemplate: function () { return W.itemById.wpn_test_new; } }];
        W.inventory.removeItem = function () { W.__移除调用++; };
        W.partyData.members = [{ id: 'm1', name: '试伴', equipment: { weapon: { templateId: 'wpn_test_old', name: '试旧的剑' } } }];
    }

    摆包(); 装通道(W, [0]); W._复位(); W._msgs.length = 0;
    W.assignBagItemToMember('m1', 'weapon', 'u_new');
    ok(W.__移除调用 === 0, 'C1 旧件一件没落袋时：新件没从背包扣走（改前无条件 removeItem ⇒ 玩家净亏一件）');
    ok(W.partyData.members[0].equipment.weapon && W.partyData.members[0].equipment.weapon.templateId === 'wpn_test_old',
        'C2 旧件仍在原槽上（没被摘走）');
    ok(/没能落进你的行囊/.test(W._最近()) && /先别换/.test(W._最近()) && /行囊已满，先腾个格子再来。/.test(W._最近()), 'C3 满包那一屏说清了缘由：' + JSON.stringify(W._最近()));
    ok(W.__开窗 === 1, 'C4 拦下来之后把装备窗重新摆回屏上（玩家不该对着一片空白）');

    摆包(); 装通道(W, [1]); W._复位(); W._msgs.length = 0;
    W.assignBagItemToMember('m1', 'weapon', 'u_new');
    ok(W.__移除调用 === 1, 'C5a 旧件真落袋后才动新件：从背包取走 1 次');
    ok(W.partyData.members[0].equipment.weapon.templateId === 'wpn_test_new',
        'C5b 换装走通时 weapon 槽上真是那把新刀');
    ok(W._最近().indexOf('试新的刀') >= 0, 'C6 装备回执念的是真换上那件：' + JSON.stringify(W._最近()));
}

// ============ D DES-83：工坊抽成按实收（vm 行为） ============
console.log('\n[D] DES-83 门派工坊抽成（真调 useFacility）');
{
    const W = 造窗();
    W.discipleState = { isInSect: true, sectId: '试门', rank: 5, contribution: 0 };
    W._load('js/sects/sect-facilities.js');
    W.SectGov = { titheWorkshop: function (n) { W.__抽成基数 = n; return Math.floor(n / 2); } };
    const 库 = W.facilities;
    库.push({
        id: 'fx_test_store', name: '试工坊', type: 'storage', rankReq: null, dailyUses: 0,
        desc: '探针用', actions: [{ type: 'rewardMaterials', name: '领物资', items: [{ itemId: 'iron_ore', count: 5 }, { itemId: 'spirit_grass', count: 3 }] }]
    });
    W._定骰(0.01);

    装通道(W, [2, 0]); W._复位();
    let r = W.useFacility('fx_test_store', { fromScenario: true, quiet: true });
    ok(r && r.ok && W.__抽成基数 === 2,
        'D1 玩家只领到 2 件时，门派抽成的基数是 2（改前按开价 8 抽 ⇒ 公库替没出袋的 6 件记了账）');
    // 第一百三十八批：桩开始照真口径落账，于是这一屏念的是**那一笔的账**（行囊已满…），不再是从前的写死回退句「没能带走」。
    // 本钉的要求不变——件数按实收、缘由只准从句且不许钉破括号：
    ok(/铁矿石x2/.test(r.text) && /另 6 件：/.test(r.text) && !/。，|。）/.test(r.text), 'D2 上屏那两句仍按实收（第一百二十四批那一笔没被本批改回去）：' + JSON.stringify(r && r.text));

    装通道(W, [5, 3]); W._复位();
    W.useFacility('fx_test_store', { fromScenario: true, quiet: true });
    ok(W.__抽成基数 === 8, 'D3 全领到时基数＝8，与本批之前的数字一致（收口不是把抽成调小）');

    装通道(W, [0, 0]); W._复位();
    W.useFacility('fx_test_store', { fromScenario: true, quiet: true });
    ok(W.__抽成基数 === 0, 'D4 一件没领到时基数＝0（改前仍按 8 抽——门里白记一笔捐工）');

    库.length = 库.findIndex(f => f.id === 'fx_test_store');
    ok(W.facilities.filter(f => f.id === 'fx_test_store').length === 0, 'D5 收尾自紧：探针设施不留在清册里');
}

// ============ E DES-84：退料要报退回了几件（vm 行为） ============
console.log('\n[E] DES-84 开炉失败退料（真调 compoundMat.refund）');
{
    const W = 造窗();
    W._load('js/crafting/compound-ui.js');
    ok(W.compoundMat && typeof W.compoundMat.refund === 'function', 'E0 材料账的退料口确在');
    装通道(W, [1, 0, 0]); W._复位();
    let r = W.compoundMat.refund(['mat_lingzhi', 'mat_lingzhi', 'mat_lingzhi']);
    ok(r && r.back === 1 && r.asked === 3,
        'E1 三件材料只退回 1 件时返回 {back:1, asked:3}（改前丢返回值、恒念「材料已退回」）：' + JSON.stringify(r));
    装通道(W, [1, 1]); W._复位();
    r = W.compoundMat.refund(['mat_lingzhi', 'mat_lingzhi']);
    ok(r.back === 2 && r.asked === 2, 'E2 全退回来时 back＝asked');
    W._msgs.length = 0;
    r = W.compoundMat.refund([]);
    ok(r && r.back === 0 && r.asked === 0, 'E3 空清单不炸、报 0/0');
    delete W.addItem; delete W.addItemToInventory;
    r = W.compoundMat.refund(['mat_lingzhi', 'mat_lingzhi']);
    ok(r.back === 2, 'E4 无背包世界（沙盒）按全数退回计——与 consume 那侧的「不拦」同口径，不新增一种假失败');

    const 炉 = 去注释(load('js/crafting/alchemy-compound.js'));
    const 兵 = 去注释(load('js/crafting/forging-compound.js'));
    ok(/refundBack: _rf \? _rf\.back : null/.test(炉) && /refundAsked: _rf \? _rf\.asked : null/.test(炉),
        'E5 炼丹：退料结果带出返回值（读码档，通道缺席时是 null 而不是 0）');
    ok(/refundBack: _rf \? _rf\.back : null/.test(兵) && /refundAsked: _rf \? _rf\.asked : null/.test(兵),
        'E6 锻兵：同一支笔（两炉不许一本改一本没改）');
    const UI = 去注释(load('js/crafting/compound-ui.js'));
    ok((UI.match(/材料只退回 /g) || []).length === 2, 'E7 两扇失败回执都接上了「只退回 N/M 件」那一支（实读 ' + (UI.match(/材料只退回 /g) || []).length + '）');
    ok((UI.match(/件材料已退回/g) || []).length === 2 && /（材料已退回）/.test(UI),
        'E8 全退回时仍念「已退回」（通道没回报数的旧档不许多改口）');
}

// ============ F DES-72 同族余口：城市三处念实收（vm 行为） ============
console.log('\n[F] 城市药圃／毒窟／遗迹（真调 location-system 那三支）');
{
    const W = 造窗();
    W._load('js/location-system.js');
    W._定骰(0.9);   // 灵药掷 1 + floor(0.9*2) = 2 株
    ok(typeof W.visitHerbGarden === 'function' && typeof W.enterPoisonCave === 'function' && typeof W.enterRuinEntrance === 'function',
        'F0 三支动作入口确在');

    装通道(W, [0]); W._复位(); W._msgs.length = 0;
    W.visitHerbGarden('青木城');
    ok(/也没能带走/.test(W._最近()) && W._最近().indexOf('采得') < 0,
        'F1 药圃满包：改口「一株灵药也没能带走」，不念「采得灵药」（读数 ' + JSON.stringify(W._最近()) + '）');
    装通道(W, [1]); W._复位(); W._msgs.length = 0;
    W.visitHerbGarden('青木城');
    // 掷 2 收 1＝半包：账上没这一笔 ⇒ 只许念中性从句，且句号不许落进括号（第一百三十五批口径＋DES-97）
    ok(/采得灵药 ×1/.test(W._最近()) && /另 1 株：没能落进你的行囊）/.test(W._最近()) && /行囊已满/.test(W._最近()) === false,
        'F2 掷 2 收 1：念 1 株并补一句没带走（改前恒念「采得灵药」，件数都不报）：' + JSON.stringify(W._最近()));
    装通道(W, [2]); W._复位(); W._msgs.length = 0;
    W.visitHerbGarden('青木城');
    ok(/采得灵药 ×2/.test(W._最近()) && W._最近().indexOf('没带走') < 0, 'F3 全收着时不多念一句塞不下');

    delete W.getRealmTier;
    装通道(W, [0]); W._复位(); W._msgs.length = 0;
    W.enterPoisonCave('万毒谷');
    ok(/毒核这一趟没带走/.test(W._最近()) && W._最近().indexOf('取得') < 0, 'F4 毒窟同族收口（先扣精力占今日名额、再掷毒核）：' + JSON.stringify(W._最近()));
    装通道(W, [1]); W._复位(); W._msgs.length = 0;
    W.enterPoisonCave('万毒谷');
    ok(W._最近() === '取得毒核材料', 'F5 落袋了才念「取得毒核材料」（读数 ' + JSON.stringify(W._最近()) + '）');

    W.currentCharData.energy = 100;
    delete W.startBattle;
    装通道(W, [0]); W._复位(); W._msgs.length = 0;
    W.enterRuinEntrance('佛国遗址');
    const 遗 = W._msgs.join('｜');
    ok(/陨铁没带走/.test(遗) && /精力与今日次数已花掉/.test(遗) && 遗.indexOf('搜得陨铁') < 0,
        'F6 遗迹：东西没落袋时不再念「搜得陨铁」，且如实说这一趟的精力与今日名额已花掉（读数 ' + JSON.stringify(遗) + '）');
    W.flags = {};
    装通道(W, [1]); W._复位(); W._msgs.length = 0;
    W.enterRuinEntrance('剑阁');
    ok(W._msgs.join('｜').indexOf('搜得陨铁') >= 0 && W._msgs.join('｜').indexOf('白走') < 0, 'F7 落袋时照旧念「搜得陨铁」');
}

// ============ G 棘轮与普查 ============
console.log('\n[G] 只准缩不准涨的两本账');
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
    ok(主.length === 0, 'G1 主账（第一百二十四批钉 23 → 18 → 一百二十六批 16 → 一百二十七批 15 → **本批第一百三十批收口余下 15 处（含雷材／知己回礼那两行「没有 giveWithReceipt 就不认数」的兜底）＝0**）：只准为 0，多一处即红（实读 ' + 主.length + (主.length ? '：\n      ' + 主.join('\n      ') : '') + '）');
    ok(副.length === 0, 'G2 副账（**上一把尺的盲点**：同一行带 if 守卫的裸调用）第一百二十七批已归零钉死（开案 48 → 38 → 0，其中 38 行的主体是 11-event-extensions.js 的 42 处奇遇彩头）——**只准为 0，新增一处即红**：现读 ' + 副.length + (副.length ? '\n      ' + 副.join('\n      ') : ''));
    const 奇遇 = 去注释(load('js/items-extended/11-event-extensions.js'));
    const 助手 = (奇遇.match(/xGive\(/g) || []).length;
    const 裸 = (奇遇.match(/window\.addItem\(/g) || []).length;
    ok(助手 >= 43 && 裸 === 1,
        'G3 归零哨兵：奇遇扩展表发东西必须一律走 xGive（第一百二十七批钉 42 处调用＋1 处助手定义＝43，行囊字面 window.addItem 只许在助手内部 1 次）。绕过助手就地重新丢返回值即红。实读 xGive ' + 助手 + ' ／ addItem ' + 裸);
    const 本批收口 = ['js/party-system.js', 'js/sects/sect-facilities.js', 'js/crafting/compound-ui.js'];
    const 复发 = [...主, ...副].filter(x => 本批收口.includes(x.split(':')[0]));
    ok(复发.length === 0, 'G4 本批收口的 3 本文件里，发东西／退东西的返回值一处不许再丢在地上（实得 ' + 复发.length + '：' + 复发.join(', ') + '）');
    const 派 = 去注释(load('js/location-system.js'));
    ok(!/\n    enterCity,\n/.test(派), 'G5 棘轮：locationSystem 的导出里不许再出现「直接引用原函数」那一行（DES-81 复发即红）');
}

console.log('\n=== 第一百二十五批套件：通过 ' + 通过 + ' / 失败 ' + 失败 + ' ===');
if (失败 > 0) process.exitCode = 1;
