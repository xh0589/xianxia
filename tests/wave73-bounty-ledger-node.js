/**
 * wave73-bounty-ledger-node.js — 第七十三波 · 宝藏发奖改「先记账、再念账」验收（DES-59）＋两笔同族账
 *   A 掉落是记录不是中文串：generateTreasureLoot / generateCaveLoot 产出 {id|currency, count}
 *   B 落袋：applyTreasureRewards 真的把每一件交给背包（玄铁剑/御剑此前只出声）、灵石走货币通道
 *   C 念账：上屏那一行由物品表现名现拼，名字与件数不再有两本账
 *   D 哨兵：源码里不再按展示名反解奖励；全仓字面量发奖零幽灵 id
 *   E 送礼基础分认显式字段（subtype==='currency'），不再 name.includes('灵石')
 *   F 炼丹房那页「卡片一本账、炼制另一本账」钉成死分支（DES-62：屏上不可达，只设闸不改 js/）
 *
 * 手法：读仓库真文件切片 + vm 跑行为（不另立平行口径）。自证支先钉「桩子里 Math.random 可控」。
 * 运行：node tests/wave73-bounty-ledger-node.js
 */
'use strict';

var fs = require('fs');
var vm = require('vm');
var path = require('path');
var ROOT = path.resolve(__dirname, '..');

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; console.log('  ✓ ' + msg); }
    else { failed++; console.error('  ✗ ' + msg); }
}
function eq(a, b, msg) { assert(JSON.stringify(a) === JSON.stringify(b), msg + '（实际=' + JSON.stringify(a) + ' 期望=' + JSON.stringify(b) + '）'); }
function src(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// 按大括号配平切一个顶层函数（[CT] 那支笔：一行式与 try 顶行都会骗过 indexOf 定尾）
function sliceFn(code, name) {
    var i = code.indexOf('function ' + name + '(');
    if (i < 0) return null;
    for (var j = code.indexOf('{', i), d = 0; j < code.length; j++) {
        if (code[j] === '{') d++;
        else if (code[j] === '}' && --d === 0) return code.slice(i, j + 1);
    }
    return null;
}

// ==================== 物品表（真源） ====================
var tab = { console: { log() { }, warn() { }, error() { } }, window: null, document: undefined };
tab.window = tab; tab.globalThis = tab;
vm.createContext(tab);
var runIn = rel => vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), tab, { filename: rel });
runIn('js/items.js');
fs.readdirSync(path.join(ROOT, 'js/items-extended')).sort().forEach(f => runIn('js/items-extended/' + f));
if (fs.existsSync(path.join(ROOT, 'js/items-extended.js'))) runIn('js/items-extended.js');
var itemById = tab.itemById;
assert(itemById && Object.keys(itemById).length > 400, '物品表在册 ' + Object.keys(itemById || {}).length + ' 件（本套所有 id 判定读的是这本账）');

// ==================== 掉落三兄弟（真源切片） ====================
var EV = src('js/event-system.js');
var NAMES = ['generateTreasureLoot', 'generateCaveLoot', 'lootNameOf', 'lootLedgerText', 'applyTreasureRewards'];
var 切片 = NAMES.map(n => {
    var s = sliceFn(EV, n);
    assert(!!s, '切得到 ' + n + '（源在 event-system.js:' + (s ? EV.slice(0, EV.indexOf(s)).split('\n').length : '?') + '）');
    return s || '';
});
var grants, stones, toasts, 可入袋;
var ls = {
    console: { log() { }, warn() { }, error() { } },
    itemById: itemById,
    addItemToInventory: function (id, n) { grants.push([id, n]); return 可入袋 ? n : 0; },
    addSpiritStones: function (n) { stones.push(n); },
    showMessage: function (m, t) { toasts.push(m); }
};
ls.window = ls; ls.globalThis = ls;
vm.createContext(ls);
vm.runInContext('Math.random = function () { return globalThis.__r; };', ls);
vm.runInContext(切片.join('\n'), ls);
const 清账 = () => { grants = []; stones = []; toasts = []; 可入袋 = true; };
const 掷 = v => { ls.__r = v; };
const 全中 = () => { 清账(); 掷(0); };
const 全不中 = () => { 清账(); 掷(0.999); };

// ==================== 自证：桩子的骰子真可控 ====================
全中(); 掷(0);
eq(ls.generateTreasureLoot().length, 3, '自证：Math.random 恒 0 时宝箱三条全中（骰子若不受控，下面全部读数为空）');
全不中(); 掷(0.999);
eq(ls.generateTreasureLoot().length, 0, '自证：Math.random 恒 0.999 时宝箱一条不中');

// ==================== A 掉落是记录不是中文串 ====================
全中(); 掷(0);
var 宝 = ls.generateTreasureLoot();
assert(Array.isArray(宝), 'A1 宝箱掉落是数组（不是拼好的中文串）');
宝.forEach((r, i) => assert(!!(r.id || r.currency) && r.count > 0, 'A2 宝箱第 ' + (i + 1) + ' 条带 id|currency 与正件数：' + JSON.stringify(r)));
var 洞 = ls.generateCaveLoot();
eq(洞.length, 4, 'A3 山洞四条（灵石/筑基丹/妖兽内丹/御剑）');
洞.concat(宝).forEach(r => assert(!r.id || !!itemById[r.id], 'A4 在册：' + (r.id || '货币 ' + r.currency)));
eq(宝.filter(r => r.currency === 'spiritStones').length, 1, 'A5 灵石记的是货币通道，不再混在物品里');
eq(宝.filter(r => r.currency === 'spiritStones')[0].count, 50, 'A6 宝箱灵石 50（数额写在账上，不从「x50」那几个字里抠）');
eq(洞.filter(r => r.currency === 'spiritStones')[0].count, 100, 'A7 山洞灵石 100');

// ==================== B 落袋 ====================
全中(); 掷(0);
ls.applyTreasureRewards(宝);
grants.forEach(g => assert(!!itemById[g[0]], 'B1 入袋的 id 在册：' + g[0]));
eq(grants.some(g => g[0] === 'vitality_pill' && g[1] === 3), true, 'B2 疗伤丹三粒进背包');
eq(grants.some(g => g[0] === 'iron_sword' && g[1] === 1), true, 'B3 玄铁剑真进背包（改前只 showMessage「获得了武器：…」，一件没落袋）');
eq(stones.length, 1, 'B4 灵石走 addSpiritStones，一次');
eq(stones[0], 50, 'B5 到账数额 = 账上数额');
eq(toasts.some(t => t.indexOf('获得了武器') >= 0), false, 'B6 「获得了武器」那句谎撤了（东西进背包，不再只出声）');
全中(); 掷(0);
ls.applyTreasureRewards(ls.generateCaveLoot());
eq(grants.some(g => g[0] === 'mat_demon_beast_core' && g[1] === 3), true, 'B7 妖兽内丹三枚进背包（改前喂的是查无此物的 beast_core，只留一行 console.warn）');
eq(grants.some(g => g[0] === 'flying_sword' && g[1] === 1), true, 'B8 御剑真进背包');
eq((itemById['mat_demon_beast_core'] || {}).name, '妖兽内丹', 'B9 新 id 的表上名与文案那三个物同名（防再次漂到别的丹上去）');
全中(); 掷(0.999);
ls.applyTreasureRewards(ls.generateCaveLoot());
eq(grants.length + stones.length, 0, 'B10 空账不发奖、也不抛错');
全中(); 掷(0);
可入袋 = false;
ls.applyTreasureRewards(宝);
// 第一百三十九批：问不到账时那一句改成了中性话，本钉认的是**两件各出一条落袋失败回执**，
// 并且两件都不许被念成已得——措辞可以换，这一条要求不换。
eq(toasts.filter(t => /行囊已满|留在原处|没落进|没能带走|没带走/.test(t)).length, 2, 'B11 行囊满时逐件认账（不再谎称已得）');
eq(toasts.filter(t => /入袋|已获得|收进/.test(t)).length, 0, 'B11b 一件也没进囊时，两条回执里不许有一条念成已得');
toasts.forEach(t => assert(t.indexOf('行囊已满') < 0 || t.indexOf('x') < 0, 'B12 那句只说清「哪一件没进」，不念一个已入库的数：' + t));

// ==================== C 念账 ====================
全中(); 掷(0);
eq(itemById['vitality_pill'].name, '回春丹', 'C0 表上名是「回春丹」——改前那行手抄成「疗伤丹」，而全仓没有一枚物品的表上名叫疗伤丹（只有 app.js:2064 那张写死的方子）');
eq(ls.lootLedgerText(ls.generateTreasureLoot()), '回春丹 x3, 灵石 x50, 玄铁剑 x1', 'C1 宝箱那行念的是表上名 + 账上数（不再手抄第二本名账）');
eq(ls.lootLedgerText(ls.generateCaveLoot()), '灵石 x100, 筑基丹 x1, 妖兽内丹 x3, 御剑 x1', 'C2 山洞那行同尺');
eq(ls.lootLedgerText([]), '', 'C3 空账念空串，由调用方决定那句「什么都没有」');
eq((EV.match(/lootLedgerText\(loot\) \|\| '什么都没有'/g) || []).length, 1, 'C4 宝箱空账仍念「什么都没有」');
assert(/lootLedgerText\(loot\)/.test(EV), 'C5 两处 caller 都改走 lootLedgerText，不再直接拼 loot');
eq((EV.match(/古老的遗迹，一无所获/g) || []).length, 0, 'C6 山洞事件不再念「古老的遗迹」（人在洞口，遗迹那句是别处的台词）');

// ==================== D 哨兵 / 棘轮 ====================
var 反解 = 切片[4].match(/\.includes\('[^']+'\)/g) || [];
eq(反解.length, 0, 'D1 applyTreasureRewards 里不再按展示名反解奖励：' + JSON.stringify(反解));
eq((EV.match(/'beast_core'|'spirit_water'/g) || []).length, 0, 'D2 两枚幽灵 id 从本文件绝迹（带引号的裸字面量；mat_demon_beast_core 那种子串不算命中）');
assert(/id:\s*'mat_demon_beast_core'/.test(EV), 'D3 掉落写的是表上真 id（字面量在源里，不是跑出来才拼的）');

// 全仓字面量发奖零幽灵：读真文件，不靠记忆里的名单
function walkJs(d, acc) {
    fs.readdirSync(d).forEach(n => {
        var p = path.join(d, n);
        if (fs.statSync(p).isDirectory()) walkJs(p, acc);
        else if (n.endsWith('.js')) acc.push(p);
    });
    return acc;
}
var 所有 = walkJs(path.join(ROOT, 'js'), []);
var CALL = /\b(?:addItemToInventory|addItem|giveItem|addResultItem|grantItem)\s*\(\s*['"]([a-zA-Z0-9_]+)['"]/g;
// 第一百二十七批跟随：11-event-extensions.js 把 42 处发奖收进了表内助手 xGive(喜话, tone, itemId, 件数)，
// 字面 id 挪到第三个参数——尺不跟着换形就会「看不见」，幽灵 id 那道防反而被绕开（不是把门槛调低）。
var XLIT = /\bxGive\s*\(\s*(?:'[^']*'|"[^"]*")\s*,\s*(?:'[^']*'|"[^"]*")\s*,\s*['"]([a-zA-Z0-9_]+)['"]/g;
var SELF = /itemById\s*\[[^\]]+\]\s*=|itemById\s*&&/;
var IDLIT = /\bid:\s*'([a-zA-Z0-9_]+)'/g;
var 幽灵 = [], 命中数 = 0, x命中 = 0;
所有.forEach(f => {
    var s = fs.readFileSync(f, 'utf8');
    var 自注册 = {};
    if (SELF.test(s)) { let g; IDLIT.lastIndex = 0; while ((g = IDLIT.exec(s))) 自注册[g[1]] = 1; }
    let m; CALL.lastIndex = 0;
    while ((m = CALL.exec(s))) {
        命中数++;
        if (!itemById[m[1]] && !自注册[m[1]]) 幽灵.push(path.relative(ROOT, f).replace(/\\/g, '/') + ' → ' + m[1]);
    }
    XLIT.lastIndex = 0;
    while ((m = XLIT.exec(s))) {
        命中数++; x命中++;
        if (!itemById[m[1]] && !自注册[m[1]]) 幽灵.push(path.relative(ROOT, f).replace(/\\/g, '/') + ' → xGive:' + m[1]);
    }
});
assert(命中数 > 60, 'D4 这把尺确实扫到了发奖调用：' + 命中数 + ' 处字面量发奖（其中第一百二十七批新形的 xGive ' + x命中 + ' 处）');
eq(幽灵.length, 0, 'D5 全仓字面量发奖零幽灵 id（' + 命中数 + ' 处逐一核过物品表）：' + JSON.stringify(幽灵));

// ==================== E 送礼基础分认字段 ====================
var APP = src('js/app.js');
assert(!/name\.includes\('灵石'\)/.test(APP), 'E1 选物窗不再拿展示名「灵石」定分');
var 段 = (APP.match(/let gain = 5;[\s\S]{0,400}?\n\s*if \(tpl\?\.subtype === 'currency'[\s\S]*?\n/) || [''])[0];
assert(段.length > 0, 'E2 切到真源那四行分档（读的是 js/app.js 本体）');
var 分档 = new Function('tpl', 'slot', 'return (function(){' + 段 + 'return gain;})()');
const 模板 = id => Object.assign({ id: id }, itemById[id] || {});
// 这枚不在物品表里，由 js/quest/qi-arc2.js:49-50 在加载时自注册；字段照抄 :47 那行声明
const 阵眼灵石 = { id: 'qi_half_array_stone', name: '半块阵眼灵石', type: 'material', subtype: 'special', category: 'material', quality: 'PIN1', level: 30, price: 0 };
eq(分档(阵眼灵石, { templateId: 'qi_half_array_stone' }), 5,
    'E3 「半块阵眼灵石」（material／special／PIN1／等级 30）回到通用档 5——改前因名字里那两个字第 5 条被误降成 3');
eq(分档(模板('spec_spirit_stone'), { templateId: 'spec_spirit_stone' }), 3, 'E4 真货币（subtype=currency）仍是 3 分，一档没动');
eq(分档(模板('spirit_stone'), { templateId: 'spirit_stone' }), 3, 'E5 老 spirit_stone 靠 id 直认，仍 3 分');
eq(分档(模板('pill_spring_recovery'), { templateId: 'pill_spring_recovery' }), 8, 'E6 丹药档 8 不受影响');
var 秘 = Object.keys(itemById).find(k => itemById[k].type === 'secret_art');
eq(分档(模板(秘), { templateId: 秘 }), 20, 'E7 秘籍档 20 不受影响：' + 秘);
// 立案中的事实钉：两件同名异价。谁收口了它，这条会判红，提醒把下面改成反向钉（DES-60）
eq([itemById['spirit_stone'].name, itemById['spec_spirit_stone'].name].join(), '灵石,灵石',
    'E8〔DES-60 立案哨兵〕「灵石」这一名有两个 id（spirit_stone 价 100／spec_spirit_stone 价 10）——收口后请把本条改成反向钉');

// ==================== F 炼丹房那页「两本账」被钉成死分支（DES-62） ====================
// js/app.js:2062 openAlchemyRoom 用本地写死的三张方子排卡片，js/app.js:2101 craftPill 却按下标读
// window.pilferRecipes（js/crafting.js:23）——屏上念「疗伤丹／灵芝 x2／20 真气」，点下去炼的是「小还丹」、
// 扣的是它自己的料。本批回读后判定它在交付树上不可达（两条入口都先认 window.openCraftingUI），
// 于是**不改 js/**，只把「不可达」这个前提钉成闸：一旦有人绕过兜底直接叫它，F1/F2 当场红。
var ALC = sliceFn(APP, 'openAlchemyRoom') || '';
assert(ALC.length > 0 && !!sliceFn(APP, 'craftPill'), 'F0 两支都切得到（源在 js/app.js）');

var 叫页 = [];
所有.forEach(f => {
    var s = fs.readFileSync(f, 'utf8');
    s.split('\n').forEach((ln, i) => {
        if (!/openAlchemyRoom\s*\(/.test(ln) || /^\s*(\/\/|\*)/.test(ln) || /function openAlchemyRoom\(/.test(ln)) return;
        var 窗 = s.split('\n').slice(Math.max(0, i - 6), i + 1).join('\n');
        // 合法形态只有两种：openCraftingUI 存在的兜底分支里、或分发口自转（action 名不算调用）
        if (!/openCraftingUI/.test(窗)) 叫页.push(path.relative(ROOT, f).replace(/\\/g, '/') + ':' + (i + 1) + ' → ' + ln.trim());
    });
});
eq(叫页.length, 0, 'F1 每一处 openAlchemyRoom() 调用都关在「window.openCraftingUI 存在」的兜底里（漏网的 ' + 叫页.length + ' 处：' + JSON.stringify(叫页) + '）');
assert(/openAlchemyRoom:\s*function\(\)\s*\{\s*if \(window\.openCraftingUI\)\s*window\.openCraftingUI\('pilfer'\);\s*\}/.test(APP),
    'F1b 城里那颗「⚗️ 炼丹房」按钮走的是分发口，分发口自转成 openCraftingUI(\'pilfer\')，不落到那页假方子');
var 丹call = (APP.match(/craftPill\s*\(/g) || []).length - (APP.match(/function craftPill\(/g) || []).length;
eq(丹call, 1, 'F2 craftPill 全仓只有那页卡片上的 onclick 一个调用方（多一处＝有人把谎称成功的降级支接活）');
assert(/if \(typeof window\.openCraftingUI === 'function'\)/.test(src('js/npcs/npc-system.js').slice(src('js/npcs/npc-system.js').indexOf("'炼丹师'"), src('js/npcs/npc-system.js').indexOf("'炼丹师'") + 700)),
    'F3 炼丹师那一扇真先走 openCraftingUI（NPC 面板上的「⚗️ 炼丹」不是那页假方子）');
assert(/window\.openCraftingUI = openCraftingUI/.test(src('js/crafting.js')), 'F4 交付路径上 openCraftingUI 由 crafting.js 注册到全局 ⇒ 兜底永不被触发');

// 反向钉（DES-62 结案时请撤掉这两条）：两本账只要还在，就必须仍然对不上——
// 若哪天卡片改成读真配方，名字会撞上，这条转红提醒把整页撤掉而不是留着半同步。
var 假方子 = (ALC.match(/\{ name: '([^']+)'[\s\S]*?qiCost: (\d+)/g) || []).map(s => {
    var m = s.match(/\{ name: '([^']+)'[\s\S]*?qiCost: (\d+)/);
    return { name: m[1], qi: +m[2] };
});
var 配方源 = (src('js/crafting.js').match(/const pilferRecipes = \[[\s\S]*?\n\];/) || [''])[0];
assert(配方源.length > 0, 'F5a 真配方表切到了（js/crafting.js 的 pilferRecipes）');
var 真配方 = 配方源.split(/\n    \{\n/).slice(1).map(ch => {
    var m = ch.match(/name: '([^']+)'/), q = ch.match(/qiCost: (\d+)/);
    return m && q ? { name: m[1], qi: +q[1] } : null;
}).filter(Boolean);
eq(假方子.length, 3, 'F5 那页仍写死三张方子（张数一旦变，回读这条段）：' + JSON.stringify(假方子.map(x => x.name)));
assert(真配方.length >= 3, 'F5b 真配方头三条切到了：' + JSON.stringify(真配方.slice(0, 3).map(x => x.name)));
// 逐位对：卡片 i 的「方子名＋真气价」必须与 craftPill(i) 真炼的那条不同名不同价——同一下标两本账
var 错位 = [0, 1, 2].filter(i => 假方子[i].name !== 真配方[i].name || 假方子[i].qi !== 真配方[i].qi);
eq(错位.length, 3, 'F6〔DES-62 立案哨兵〕三张卡逐位全错位（卡片／真配方：' +
    [0, 1, 2].map(i => i + '「' + 假方子[i].name + '·' + 假方子[i].qi + '」vs「' + 真配方[i].name + '·' + 真配方[i].qi + '」').join('｜') +
    '）——两本账并成一本后请把本条改成反向钉');
assert(假方子[0].name === '疗伤丹' && 真配方[0].name === '小还丹', 'F7 首张卡念「疗伤丹／灵芝 x2／20 真气」，点下去炼的是第 0 条真配方「小还丹」（甘草 x2＋黄芩 x1／10 真气）');

console.log('\nwave73-bounty-ledger：' + passed + ' 通过 / ' + failed + ' 失败');
process.exit(failed ? 1 : 0);
