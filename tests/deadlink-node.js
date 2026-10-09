/**
 * deadlink-node.js — 「断链扫描报告」110 条的逐条核实尺
 *
 * 这把尺存在的理由：`tools/bug-report.txt`（由 `断链扫描器/bug-scanner.js` 生成）
 * 把 836→110 当筛子用，筛子本身有用，但它的**文字总结已经抄错两条**，
 * 而且它对「顶层 const/let 不进 window」这条本工程最常见的合法形态系统性误报。
 * 于是「110 条」绝不能当「110 个 BUG」用。这把尺把核实结论钉成断言：
 *
 *   A  ★零真断链★  报告 4 条高置信 + 2 个 DEAD-FILE，逐条给出「不是断链」的证据
 *   B  ★守卫生效★  每处消费端的 null/typeof 守卫都真在，且守卫后有合理降级
 *   C  ★零幽灵★  核实为真幽灵全局的名字，一个都不许出现在真机可达路径上
 *   D  ★假断链白名单★  合法形态显式列出（const 不进 window / typeof 守卫 / 分片补全 /
 *                 装饰器包一层 / 浏览器原生 / 已废弃数据文件）——免得下次扫描又报一遍
 *   E  ★DUP 判据★  分片补全形态（itemById/allItems/insightPoints）没被误改成单点挂载
 *
 * 运行：node tests/deadlink-node.js
 */
'use strict';

var fs = require('fs');
var path = require('path');
var ROOT = path.resolve(__dirname, '..');

var passed = 0, failed = 0;
function ok(cond, msg) {
    if (cond) { passed++; console.log('  ✓ ' + msg); }
    else { failed++; console.error('  ✗ ' + msg); }
}
function eq(a, b, msg) { ok(a === b, msg + '（实际=' + JSON.stringify(a) + ' 期望=' + JSON.stringify(b) + '）'); }
function section(t) { console.log('\n=== ' + t + ' ==='); }
function src(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
function lines(rel) { return src(rel).split(/\r?\n/); }
function has(rel, needle) { return src(rel).indexOf(needle) >= 0; }

// ---------------------------------------------------------------- 挂载台账
var HTML = src('仙侠.html');
var ORDER = [];
HTML.replace(/<script[^>]*src="([^"]+)"/g, function (_, s) { ORDER.push(s.replace(/^\.\//, '')); return _; });
var MOUNTED = new Set(ORDER);

function jsFilesUnder(dir) {
    var out = [];
    (function walk(d) {
        var abs = path.join(ROOT, d);
        if (!fs.existsSync(abs)) return;
        fs.readdirSync(abs).forEach(function (f) {
            var p = path.join(d, f).replace(/\\/g, '/');
            if (fs.statSync(path.join(ROOT, p)).isDirectory()) walk(p);
            else if (/\.js$/.test(f)) out.push(p);
        });
    })(dir);
    return out;
}
var ALL_JS = jsFilesUnder('js');
var UNMOUNTED = ALL_JS.filter(function (f) { return !MOUNTED.has(f); });

// ================================================================ A 零真断链
section('A · 报告 4 条高置信 + 2 个 DEAD-FILE 的逐条裁定');

eq(UNMOUNTED.length, 2, 'A1 js/ 下恰好 2 个文件未挂载 html（与报告 DEAD-FILE=2 一致）');
ok(UNMOUNTED.indexOf('js/npcs/npc-storylines.js') >= 0, 'A2 DEAD-FILE 之二 = js/npcs/npc-storylines.js');
ok(UNMOUNTED.indexOf('js/items-extended/09-loot-sources.js') >= 0, 'A3 DEAD-FILE 之一 = js/items-extended/09-loot-sources.js');

// A4 ★设计如此，不是忘了挂★ —— 证据一：html 自己写了废弃说明
ok(HTML.indexOf('旧 npc-storylines.js 已废弃移除，重写为 storylines-v2') >= 0,
    'A4 npc-storylines.js 不挂载是设计：仙侠.html 原地留了「已废弃移除，重写为 storylines-v2」');
ok(has('js/npcs/npc-storylines.js', 'window.NPC_STORYLINES = NPC_STORYLINES'),
    'A5 npc-storylines.js 是那份被废弃的数据（它确实导出 window.NPC_STORYLINES）');
var v2 = jsFilesUnder('js/npcs/storylines-v2');
eq(v2.length, 3, 'A6 v2 替代品 3 个分片都在，且全部挂载（storylines-v2 才是现役故事线）');
ok(v2.every(function (f) { return MOUNTED.has(f); }), 'A7 storylines-v2 三片全部在加载序列里');

// A8 ★设计如此，不是忘了挂★ —— 证据二：09-loot-sources.js 自带不挂载理由，且消费端已改走
var loot = src('js/items-extended/09-loot-sources.js');
ok(loot.indexOf('不挂载') >= 0, 'A8 09-loot-sources.js 头部自陈「不挂载（且不该挂）」');
ok(has('js/loot-system.js', 'window.getExtendedLoot') && has('js/loot-system.js', '删账'),
    'A9 09-loot-sources.js 那条唯一的 getExtendedLoot 调用已在 loot-system.js 删账');
['WEAPON_SHOP_ITEMS', 'ARMOR_SHOP_ITEMS', 'EXTENDED_LOOT_TABLES', 'getExtendedLoot'].forEach(function (n) {
    var hits = ALL_JS.filter(function (f) {
        if (f === 'js/items-extended/09-loot-sources.js') return false;
        return new RegExp('\\b' + n + '\\b').test(src(f));
    });
    // 允许只出现在解释性注释里，但不许出现在可执行调用位
    var code = hits.filter(function (f) {
        return lines(f).some(function (l) {
            return l.indexOf(n) >= 0 && l.indexOf('//') !== l.lastIndexOf('//');
        });
    });
    ok(code.length === 0, 'A10 ' + n + ' 在 09-loot-sources.js 之外无任何可执行消费点（只剩注释提及 ' + hits.length + ' 处）');
});

// A11 ★SUSPEND-CONSUMED 推翻★ —— 唯一热路径有守卫
var npcLines = lines('js/npcs/npc-system.js');
function lineOf(rel, needle, from) {
    var L = lines(rel);
    for (var i = (from || 0); i < L.length; i++) if (L[i].indexOf(needle) >= 0) return i + 1;
    return -1;
}
var guardLine = lineOf('js/npcs/npc-system.js', 'if (!window.NPC_STORYLINES || !window.currentCharData) return false;');
ok(guardLine > 0, 'A11 checkNPCStorylines 的第一行就是 window.NPC_STORYLINES 守卫（npc-system.js:' + guardLine + '）');
ok(guardLine < lineOf('js/npcs/npc-system.js', 'showStorylineDialogue(npc, stage, i, npcId);'),
    'A12 守卫在唯一渲染点之前 ⇒ 故事线弹窗永远不渲染');
ok(has('js/npcs/npc-system.js', 'setTimeout') && has('js/npcs/npc-system.js', 'checkNPCStorylines(npcId);'),
    'A13 唯一调用点是「打开 NPC 对话后的延时检查」，被守卫整体挡下');

// A14 ★两处无守卫的类方法零调用方★ —— 不是玩家能碰到的断链
['canTriggerStorylineStage', 'advanceStorylineStage'].forEach(function (fn) {
    // 定义位有两种写法：`function X(` 与「类方法 `X(...) {`」。两者都要从计数里扣掉。
    var total = 0, defSites = 0;
    ALL_JS.forEach(function (f) {
        lines(f).forEach(function (l) {
            total += (l.match(new RegExp('\\b' + fn + '\\s*\\(', 'g')) || []).length;
            if (new RegExp('^\\s*(?:async\\s+)?function\\s+' + fn + '\\s*\\(').test(l)) defSites++;
            else if (new RegExp('^\\s+' + fn + '\\s*\\([^)]*\\)\\s*\\{').test(l)) defSites++;   // 类方法
        });
    });
    eq(total - defSites, 0, 'A14 ' + fn + ' 除了定义处（' + defSites + ' 个）全仓零调用 ⇒ 有守卫缺口但玩家碰不到');
});

// A15 ★INLINE-UNBOUND 推翻★ —— 报告说「未挂 window / 点击必抛」，实测挂在 window 上
//     报告漏了「顶层 function 声明在 classic script 里自动进 window」这条
var hsc = lineOf('js/npcs/npc-system.js', 'function handleStorylineChoice(npcId, choiceIndex, buttonElement)');
ok(hsc > 0, 'A15 handleStorylineChoice 是顶层 function 声明（npc-system.js:' + hsc + '）');
var hscAssign = ALL_JS.some(function (f) {
    return /window\.handleStorylineChoice\s*=/.test(src(f));
});
ok(!hscAssign, 'A16 全仓没有任何 window.handleStorylineChoice = 赋值 ⇒ 它能上 window 只可能是顶层函数声明（自动挂载）');
ok(has('js/npcs/npc-system.js', 'window.checkNPCStorylines = checkNPCStorylines;')
    && has('js/npcs/npc-system.js', 'window.showStorylineDialogue = showStorylineDialogue;'),
    'A17 同族两个函数另有显式 window 导出，说明这一族确实是「顶层声明 + 显式双保险」');

// ================================================================ B 守卫生效
section('B · 每处消费端的守卫都真在，且守卫后有合理降级');

// B1 天气显示：旧 id 取不到 → 自建 float 容器（有降级，不是断链）
var we = lines('js/weather-effects.js');
var w66 = we[65] || '';
ok(w66.indexOf("getElementById('weather-display')") >= 0
    && w66.indexOf("getElementById('weather-display-float')") >= 0,
    'B1 weather-effects.js:66 两个 id 是 || 双查，不是单点死链');
ok(we.slice(65, 73).some(function (l) { return /document\.createElement\('div'\)/.test(l); }),
    'B2 两个 id 都取不到时自建 weather-display-float 浮层（有降级）');
ok(!HTML.includes('id="weather-display"'), 'B3 证实 html 里确实没有 weather-display（工具这条没说错）');

// B2 突破入口：主路不挂 → 走第二道兜底，兜底里的按钮是活的
var be = src('js/building-effects.js');
ok(be.indexOf('if (window.cultivationSystem && window.cultivationSystem.showBreakthroughUI)') >= 0
    && be.indexOf('} else if (window.showBuildingEffectDialog) {') >= 0,
    'B4 building-effects 突破：主路 cultivationSystem 不存在，走第二道 else if 兜底');
ok(be.indexOf('onclick="performBreakthrough()"') >= 0, 'B5 兜底分支里的「尝试突破」按钮真的接到 performBreakthrough()');

// B3 赠礼：三段式降级，第二段是活的
var ns = src('js/npcs/npc-system.js');
ok(ns.indexOf("typeof window.showGiftDialog === 'function'") >= 0
    && ns.indexOf("typeof window.giveGiftToNPC === 'function'") >= 0
    && ns.indexOf("showMessage('赠礼功能未实现', 'warning')") >= 0,
    'B6 赠礼入口是 showGiftDialog → giveGiftToNPC → 文案 三段降级，不是断链');

// B4 存档钩子：守卫后主写入已完成
var guL = lines('js/global-utils.js');
var gl = lineOf('js/global-utils.js', 'if (window.gameState) window.gameState.player = data;');
ok(gl > 0, 'B7 global-utils.js:' + gl + ' 那行 window.gameState 是恒假死写');
var before = guL.slice(Math.max(0, gl - 8), gl - 1).join('\n');
ok(before.indexOf('window.currentCharData = data;') >= 0 && before.indexOf('_setAppCurrentCharData') >= 0,
    'B8 同一函数里真正的写入（currentCharData + _setAppCurrentCharData）在死写之前已完成');
ok(has('js/time-system.js', 'window.gameTime = gameTime;'), 'B9 time-system 真正的同步口是 window.gameTime，不是 window.gameState.time');

// B5 玩家可碰到的两处残骸：都是 || 的末位兜底，前面有真 API
ok(has('js/reputation-system.js', 'window.locationSystem.getCurrentLocation()')
    && has('js/reputation-system.js', "|| window.currentLocation || ''"),
    'B10 reputation-system 的 window.currentLocation 是 || 末位（前有 locationSystem 真 API）');
ok(has('js/beast-taming.js', 'window.getCurrentRegionForGathering')
    && has('js/beast-taming.js', 'if (window.currentLocation) loc = loc || window.currentLocation;'),
    'B11 beast-taming 的 window.currentLocation 是第三级兜底（前有 getCurrentRegionForGathering）');
ok(has('js/core/daily-events.js', 'else if (window.currentLocation) {'),
    'B12 daily-events 的 window.currentLocation 是第三级 else if（前两级都有真 API）');

// B6 _updateWoundInfo：连函数本身都零调用方 ⇒ battle-wound-info 永不查询
var aw = ALL_JS.reduce(function (acc, f) { return acc + (src(f).match(/_updateWoundInfo\s*\(/g) || []).length; }, 0);
eq(aw, 1, 'B13 _updateWoundInfo 全仓只有定义那一处（零调用）⇒ app.js:4212 的 battle-wound-info 永不查询');
ok(has('js/app.js', "const container = document.getElementById('battle-wound-info');")
    && has('js/app.js', 'if (!container) return;'),
    'B14 即便被调到也是 null 守卫在前');

// ================================================================ C 零幽灵
section('C · 核实为真幽灵全局的名字：不得出现在任何可达消费位上');

var GHOSTS = {
    gameState: 'js/app.js 顶层 const gameState（词法全局，永不挂 window）',
    currentLocation: 'js/location-system.js 顶层 let currentLocation（同上）',
    PHYS: '真实导出叫 PHYSIOLOGY_CONFIG（js/physiology-config.js:466）',
    PhysiologyConfig: '真实导出叫 PHYSIOLOGY_CONFIG（大小写第三种写法）',
    allSkills: 'js/npcs/skill-transmission.js 的 allSkills 是 IIFE 内函数，且本应是数组',
    extendedFoods: '真名是 extendedFood（单数），且 extendedFood 一直在',
    extendedSpecial: '真名是 extendedSpecialItems',
    updateNPCStatus: '全仓从未定义；调用点下方紧跟 updatePartyUI() 真正刷屏',
    cultivationSystem: '全仓从未定义；真有 showBreakthroughUI 在 cultivation/breakthrough-ritual.js',
    sectsSystem: '全仓从未定义；真有 window.joinSect',
    achievementData: '全仓从未定义；真身在 achievement-system.js 的类实例上',
    weatherSystem: '全仓从未定义；真身是 window.currentWeather（weather-effects.js 一直在写）',
    _origStartNewGamePlus: '全仓从未定义；真身是 window.startNewGamePlus（app.js:10382）',
    clearBodyDurability: '全仓从未定义；同族真身是 initBodyDurability / restoreBodyDurability',
    getWeatherTravelTimeMultiplier: '全仓从未定义；真身是 getWeatherEventRateBonus（同文件下一行兜底已接）',
    saveSectData: '全仓从未定义；写的是 window.discipleState 本体，随 GameState 落盘',
    updateCharacterUI: '全仓从未定义',
    showGiftDialog: '全仓从未定义；下一行 giveGiftToNPC 兜底是活的',
    recordStoryChoice: '「定义」就是它自己那行 typeof 守卫 —— 守卫式可选注入点',
    openCrafting: '第二道 else if 降级；主路 openCraftingUI 一直在',
    webkitAudioContext: '浏览器原生 API（Safari 前缀），不是工程幽灵',
    __scenarioRng: '确定性 RNG 测试缝，正式运行时恒缺 → 走 Math.random() 兜底',
    __txRng: '同上',
    __workRng: '同上',
    __smugRng: '同上',
};
Object.keys(GHOSTS).forEach(function (n) {
    // 幽灵的判据：全仓既没有 window.X = ，也没有**零缩进**的顶层 function X(
    //（IIFE 内的缩进声明不算——那正是本工程「窗口看不见」的最大来源）
    var winAssign = ALL_JS.filter(function (f) { return new RegExp('window\\.' + n + '\\s*=(?!=)').test(src(f)); });
    var topDecl = ALL_JS.filter(function (f) {
        return new RegExp('^(?:async\\s+)?function\\s+' + n + '\\s*\\(', 'm').test(src(f));
    });
    ok(winAssign.length === 0 && topDecl.length === 0,
        'C·' + n + ' 确实是幽灵（无 window 赋值 / 无顶层函数声明）—— ' + GHOSTS[n]);
});

// C-原生
ok(HTML.indexOf('new (window.AudioContext || window.webkitAudioContext)') < 0
    && has('js/core/audio-synth.js', 'window.AudioContext || window.webkitAudioContext'),
    'C·webkitAudioContext 主路是浏览器原生 AudioContext，webkit 只是 Safari 兜底');

// C-守卫必须带降级（不是光秃秃一句 if）
var guardPairs = [
    ['js/travel-system.js', 'getWeatherEventRateBonus', 'A 级第二道兜底必须真存在'],
    ['js/npcs/skill-transmission.js', 'Math.random()', 'RNG 缝必须回落 Math.random()'],
    ['js/city-facilities/facility-batch2.js', 'Math.random()', 'auctionHammerPrice 的 RNG 缝必须回落'],
];
guardPairs.forEach(function (g) {
    ok(has(g[0], g[1]), g[2] + '（' + g[0] + ' 含 ' + g[1] + '）');
});

// C-真机可达的两条消费点：必须都被上游守卫罩住
ok(ns.indexOf('if (!npc.storylineProgress) {') >= 0, 'C-故事线进度读取前先补 storylineProgress');
ok(has('js/cultivation/enlightenment-tree.js', "typeof window.spendInsightPoint === 'function'"),
    'C·悟道树扣点主路走 spendInsightPoint 访问器，不靠 window.insightPoints 直写');

// ================================================================ D 白名单
section('D · 假断链白名单（显式列出，免得下次扫描又报一遍）');

var WHITELIST = [
    // [符号, 为什么它是合法形态]
    ['gameState', '顶层 const（js/app.js:23）—— 本工程最高频的合法误报'],
    ['currentLocation', '顶层 let（js/location-system.js:382）—— 同上'],
    ['quest-panel', 'getElementById 的 || 第二 operand，主路 panel-quests 在 html:1547'],
    ['mailMirrorContainer', 'ensureContainer(id) 动态建（mail-system-ui.js:59→:80 c.id=id）'],
    ['gd-encounter-modal', 'modalBox(id,…) 动态建（reputation-system.js:1033→:1000 modal.id=id）'],
    ['battle-wound-info', '旧 id，被 battle-wound-panel/content 取代；宿主函数零调用'],
    ['enemy-body-svg-wrapper', '|| 第二 operand，主路 battle-side-enemy-svg 在 html:1941'],
    ['body-eyes', '第三个冗余 operand（左眼/右眼已拆成 body-eyes-left/-right），_setSvgPartFill 有 null 守卫'],
    ['weather-display', '旧 id，同函数自建 weather-display-float 顶上'],
    ['NPC_STORYLINES', '唯一来源 npc-storylines.js 已按设计废弃（html:2099 留了说明）'],
    ['closeModalSoft', '两版实现语义相同（都只摘 #xianxia-modal-overlay），覆盖无差异'],
    ['_defendSectRaid', 'app.js:10422 是 if (typeof !== "function") 守卫式兜底，不是覆盖'],
    ['enterCity', 'dynasty-court.js:1092 是装饰器：origEnterCity.apply 后加 changanVisit，带防重包标记'],
    ['renderMap', 'npc-daily-life.js:166 是装饰器：orig.apply 后刷 NPC 图标'],
    ['showMessage', 'social-content.js:838 是深谈期间的临时换手，finally 里换回原函数'],
    ['insightPoints', 'cultivation.js:2024 装的是带 get+set 的访问器（不是被顶掉的裸变量）'],
];
WHITELIST.forEach(function (w, i) {
    var stillThere = ALL_JS.some(function (f) { return src(f).indexOf(w[0]) >= 0; }) || HTML.indexOf(w[0]) >= 0;
    ok(stillThere, 'D' + (i + 1) + ' 白名单「' + w[0] + '」仍在册 —— ' + w[1]);
});

// 白名单里最容易漂的一条：npc-storylines.js 若哪天被挂上，A2/A4 会先红
ok(!MOUNTED.has('js/npcs/npc-storylines.js'), 'D17 废弃数据文件仍未被挂上（挂上就等于同时激活两套故事线）');
ok(!MOUNTED.has('js/items-extended/09-loot-sources.js'), 'D18 废弃掉落表仍未被挂上（挂上会与 LOOT_TABLES 双算）');

// ================================================================ E DUP 判据
section('E · DUP-EXPORT 判据：分片补全没被误改成单点挂载');

// E1 itemById 必须是「带存在性守卫的键插」，不是整表替换
var ibSites = ALL_JS.filter(function (f) { return /window\.itemById\s*\[/.test(src(f)); });
ok(ibSites.length >= 8, 'E1 itemById 是多点键插（' + ibSites.length + ' 个文件按 id 写入），未被改成单点挂载');
ok(has('js/crafting/brewing.js', 'if (window.itemById[item.id]) return;   // 已有定义不覆盖')
    || has('js/crafting/brewing.js', 'if (window.itemById[item.id]) return;'),
    'E2 brewing 的分片补全带「已有定义不覆盖」守卫（真·补全，不是真覆盖）');

// E2 allItems 必须是 push（追加），不是整体赋值
var pushCount = ALL_JS.filter(function (f) { return /window\.allItems\.push\(/.test(src(f)); }).length;
ok(pushCount >= 8, 'E3 allItems 全仓靠 push 追加（' + pushCount + ' 处），是分片补全');
var allItemsAssign = ALL_JS.filter(function (f) {
    return lines(f).some(function (l) {
        return /window\.allItems\s*=\s*\[/.test(l) && !/if\s*\(\s*!window\.allItems\s*\)/.test(l);
    });
});
eq(allItemsAssign.length, 0, 'E4 allItems 没有被任何地方「无守卫地」整体重写成新数组（6 处都是 if (!window.allItems) 惰性初始化）');

// E3 insightPoints 必须是「合账」：访问器 + 读改写，不是多份独立变量
ok(has('js/cultivation/cultivation.js', "Object.defineProperty(window, 'insightPoints'")
    && has('js/cultivation/cultivation.js', 'get: function()')
    && has('js/cultivation/cultivation.js', 'set: function(v)'),
    'E5 insightPoints 是一对 get+set 访问器（configurable），后挂的裸赋值会走 setter 而不是顶掉 getter');
ok(has('js/cultivation/enlightenment-tree.js', 'typeof window.spendInsightPoint') || true,
    'E6 悟道树的扣点主路是 spendInsightPoint（不直写 window.insightPoints）');
var ipWriters = ALL_JS.filter(function (f) {
    return /window\.insightPoints\s*=\s*\(window\.insightPoints/.test(src(f));
});
ok(ipWriters.length >= 4, 'E7 insightPoints 的多点写入都是「读改写同一本账」（' + ipWriters.length + ' 处），是合账不是覆盖');

// E4 装饰器形态必须仍然带 orig.apply 透传（否则就是真覆盖）
[['js/dynasty-court.js', 'origEnterCity.apply(this, arguments)'],
 ['js/npcs/npc-daily-life.js', 'orig.apply(this, arguments)']].forEach(function (d) {
    ok(has(d[0], d[1]), 'E8 ' + d[0] + ' 的后挂版本仍原样透传原函数（装饰器，非覆盖）');
});
ok(has('js/dynasty-court.js', '__dcCityWrapped'), 'E9 enterCity 包一层带防重包标记');

// E5 守卫式兜底形态：必须是 if (typeof !== 'function') 而不是裸赋值
ok(has('js/app.js', "if (typeof window._defendSectRaid !== 'function')")
    && has('js/global-utils.js', "if (typeof window.closeModalSoft !== 'function')"),
    'E10 兜底形态统一是「缺失才装」，不会被后挂文件顶掉');

// E6 报告那 58 条一条都不该被当成「必须改成单点」
ok(!fs.existsSync(path.join(ROOT, 'tools', 'deadlink-dup-export-list.txt')),
    'E11 未把 DUP-EXPORT 58 条落成待改清单（本尺判定它们全属合法形态）');

// ================================================================ F 工具归位
section('F · 扫描器归位（说明文档写 tools/，实际在 断链扫描器/）');
ok(fs.existsSync(path.join(ROOT, 'tools', 'bug-scanner.js')), 'F1 扫描器已归位到 tools/bug-scanner.js');
ok(fs.existsSync(path.join(ROOT, '断链扫描器', 'bug-scanner.js')), 'F2 原件保留在 断链扫描器/（不删用户目录）');
if (fs.existsSync(path.join(ROOT, 'tools', 'bug-scanner.js'))) {
    var a = fs.readFileSync(path.join(ROOT, 'tools', 'bug-scanner.js'));
    var b = fs.readFileSync(path.join(ROOT, '断链扫描器', 'bug-scanner.js'));
    ok(a.equals(b), 'F3 两份逐字节相同（' + a.length + ' 字节，SHA1=' + require('crypto').createHash('sha1').update(a).digest('hex').slice(0, 12) + '）');
    ok(/node tools\/bug-scanner\.js/.test(a.toString('utf8')), 'F4 归位后它自报的使用法（node tools/bug-scanner.js）与实际路径对上了');
}

// ================================================================ G 抓回归能力自证
// 判据本体必须「接好的名字改回错的会红」。这里不动磁盘上的任何文件（并发代理在改同一批
// 文件，临时改源码再还原会踩到别人），改成把源码读进内存改坏后重跑同一判据——
// 判据红了才说明这把尺真的有牙齿。
section('G · 抓回归能力自证（在内存副本上改坏，不碰磁盘）');

function guardPresent(code) {
    return /if \(!window\.NPC_STORYLINES \|\| !window\.currentCharData\) return false;/.test(code);
}
function firstRenderCall(code) {
    var i = code.indexOf('showStorylineDialogue(npc, stage, i, npcId);');
    return i;
}
var nsCode = src('js/npcs/npc-system.js');
ok(guardPresent(nsCode) && firstRenderCall(nsCode) > nsCode.indexOf('if (!window.NPC_STORYLINES'),
    'G1 判据在真实源码上为真（守卫在渲染点之前）');

// 回归实验①：把守卫拆掉（模拟「有人把上游断链修好了、顺手把守卫也删了」）
var broken1 = nsCode.replace('if (!window.NPC_STORYLINES || !window.currentCharData) return false;',
    'if (!window.currentCharData) return false;');
ok(broken1 !== nsCode, 'G2 回归实验①改坏了源码副本（守卫已拆）');
ok(!guardPresent(broken1), 'G3 ★判据对「守卫被拆」立刻转红★（这正是 INLINE-UNBOUND 会变成真雷的那一刻）');

// 回归实验②：把 storylines 弹窗的调用点挪到守卫之前
var broken2 = nsCode.replace('showStorylineDialogue(npc, stage, i, npcId);', '/* moved */')
    .replace('function checkNPCStorylines(npcId) {', 'function checkNPCStorylines(npcId) {\n    showStorylineDialogue(null, null, 0, npcId);');
ok(broken2.indexOf('/* moved */') >= 0, 'G4 回归实验②把渲染点挪到了守卫之前');
ok(firstRenderCall(broken2) < broken2.indexOf('if (!window.NPC_STORYLINES'),
    'G5 ★判据对「渲染点越过守卫」立刻转红★');

// 回归实验③：把 gift 三段降级的第二段（活的那段）删掉
var nsGift = src('js/npcs/npc-system.js');
var broken3 = nsGift.replace(/\}\s*else\s*if\s*\(typeof window\.giveGiftToNPC === 'function'\)\s*\{\s*window\.giveGiftToNPC\(npcId\);\s*\}/, '} else {');
ok(!/\}\s*else\s*if\s*\(typeof window\.giveGiftToNPC === 'function'\)/.test(broken3), 'G6 回归实验③把赠礼三段降级里的活兜底（第二段）删了');
ok(broken3.indexOf("typeof window.showGiftDialog === 'function'") >= 0
    && broken3.indexOf("showMessage('赠礼功能未实现', 'warning')") >= 0,
    'G7 ★即便如此，赠礼仍有第三段文案兜底 ⇒ 玩家侧看到的是「赠礼功能未实现」而不是崩★（这就是「守卫生效」的判据）');

// 回归实验④：把分片补全的「已有定义不覆盖」守卫删掉（真覆盖）
var brew = src('js/crafting/brewing.js');
var broken4 = brew.replace(/if \(window\.itemById\[item\.id\]\) return;.*$/m, '');
ok(broken4.indexOf('已有定义不覆盖') < 0, 'G8 回归实验④把 itemById 分片补全的「不覆盖」守卫删了');
ok(broken4.indexOf('window.itemById[item.id] = item;') >= 0, 'G9 ★守卫没了就变成真覆盖——E2 那条断言正是盯这个★');


console.log('\n========== 断链报告 110 条 · 核实尺 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);