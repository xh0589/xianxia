/**
 * ==================== v25.0 全仓一次性体检批 ====================
 * 应「一次都查查」要求做的全仓多病族交叉机扫（约 380 个候选逐一人工复核）：
 *   A. window 幽灵读 309 候选 → 复核后 285 是别名挂载(global.X=)/动态挂载误报，
 *      真病灶 1 处：app.js getCurrentRegionForGathering 读 window.currentLocation
 *      （location-system 顶层 let 的同名幽灵）——不在随机图上时采集区域反查支路死透。
 *   B. getElementById 死 id 41 候选 → 全部误报（Modal.open({id})/ensureContainer 动态建、
 *      「活头||死尾」兜底支），无真病。
 *   C. localStorage 键失配 20 候选 → 19 个走 saveToStorage/AUTO_KEY 变量封装口（误报），
 *      真失配 0；xianxia_saves_corrupt_backup 只写不读＝人工救援备份，挂账。
 *   D. HTML 内联处理器 7 候选 → 全部有挂载（window.X= 或 global.X=），误报。
 *   E. 跨文件同名顶层函数 4 组 → 全部 IIFE 局部（含 divination._gate 与 location._gate
 *      的疑似碰撞——divination 整文件裹在 (function(){ 里，不碰全局），误报。
 *   F. 裸调用未定义名 270 候选 → 类方法/字符串/正则噪声筛尽后真病 2 处：
 *      ① sect-war.js:524 裸调 street(...)——全仓只有 streetOf：盟家被兽潮围山那一刻
 *         直接 ReferenceError，连后面的风云志 chronOf 一起吞掉（不在 try 里）。
 *      ② inventory.js 两处调 updateSkillPanels——全仓无此函数，typeof 守卫恒假纯空转：
 *         读通功法后技能栏从不刷新；回退支更是连一个刷新调用都没有。接真身
 *         renderSkillSlotsInline（app.js:6830 顶层函数，真在 window 上）。
 *   G. switchPanel 目标 14 个全在册；故事线 9 个 NPC id 全可解析。无病。
 * 判决不动（记录在案）：reputation/beast-taming/daily-events 的 window.currentLocation
 *   死尾支（链条头 locationSystem.getCurrentLocation/getCurrentLocation 是活的）；
 *   time-system/global-utils 往 window.gameState 镜像 time/player（.time/.player 全仓零读方，
 *   写-only 噪声）；app.js/game-state.js 存档字段 achievementData 恒 null（成就真持久化走
 *   StateRegistry.register('achievements')）；saveSectData 即存守卫空转（discipleState 真
 *   持久化走 StateRegistry）；showGiftUI 零调用方且 giveGiftToNPC 兜底活着；recordStoryChoice
 *   守卫（事件 choiceId 与 IMPORTANT_CHOICES 键零交集，硬接线只会弹「无效的选择ID」）；
 *   updateBuffUI（一百四十二批已立案）；getWeatherTravelTimeMultiplier（天气脚程未写功能，
 *   旧挂账）；clearBodyDurability 调试钮空转（重置语义无真身可接，挂账）；__workRng 等四枚
 *   测试注入口（设计如此）；event-system allSkills 死尾支（skillPages 活头）。
 * 运行：node tests/v25.0-full-audit-node.js
 */
'use strict';

var fs = require('fs');
var path = require('path');
var ROOT = path.resolve(__dirname, '..');

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; console.log('  ✓ ' + msg); }
    else { failed++; console.error('  ✗ ' + msg); }
}
function src(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
function 剥注释(s) {
    return s.split(/\r?\n/).filter(function (l) { return l.trim().indexOf('//') !== 0; }).join('\n');
}
function sliceFn(source, sig) {
    var at = source.indexOf(sig);
    if (at < 0) return null;
    var open = source.indexOf('{', at);
    var i = open, depth = 0, end = -1;
    for (; i < source.length; i++) {
        var c = source[i];
        if (c === '{') depth++;
        else if (c === '}') { depth--; if (!depth) { end = i; break; } }
    }
    return end < 0 ? null : source.slice(open + 1, end);
}
// 从 startSig 起切一个花括号块（含首尾大括号）
function sliceBlock(source, startSig) {
    var at = source.indexOf(startSig);
    if (at < 0) return null;
    var open = source.indexOf('{', at);
    var i = open, depth = 0;
    for (; i < source.length; i++) {
        var c = source[i];
        if (c === '{') depth++;
        else if (c === '}') { depth--; if (!depth) return source.slice(open, i + 1); }
    }
    return null;
}

var SW = src('js/sects/sect-war.js');
var INV = src('js/inventory.js');
var APP = src('js/app.js');

// ============ [A] 源码接线棘轮 ============
console.log('--- [A] 源码接线 ---');
(function () {
    var sw = 剥注释(SW);
    assert(!/(?:^|[^A-Za-z_$\w.])street\s*\(/.test(sw) && /streetOf\s*\(/.test(sw),
        'A1 sect-war.js 裸调 street( 归零（真名 streetOf 健在）');
    var inv = 剥注释(INV);
    assert(inv.indexOf('updateSkillPanels') < 0 && (inv.match(/renderSkillSlotsInline/g) || []).length >= 2,
        'A2 inventory.js 幽灵名 updateSkillPanels 归零，两处都接上真身 renderSkillSlotsInline');
    var app = 剥注释(APP);
    var gBody = sliceFn(app, 'function getCurrentRegionForGathering');
    assert(!!gBody && /getCurrentLocation\(\)/.test(gBody) && gBody.indexOf('window.currentLocation') < 0,
        'A3 采集区域反查改走真 getter getCurrentLocation（window.currentLocation 幽灵读清除）');
    assert(/replace\(\/\\s\+\/g, ''\)/.test(gBody),
        'A4 城市名比对带 DES-57 去空白口径（「帝都 · 长安」vs「帝都·长安」）');
})();

// ============ [B] 行为面：兽潮围山不再当场炸 ============
console.log('--- [B] street→streetOf 行为 ---');
(function () {
    var block = sliceBlock(SW, 'if (isAlly) {');
    assert(!!block && block.indexOf('streetOf(') >= 0, 'B0 切片成功（isAlly 支）');
    function 装(blk) {
        var 街谈 = [], 风云志 = [];
        var f = {};
        var fn = new Function('f', 'victim', 'lv', 'absDay', 'log', 'streetOf', 'chronOf', 'tideName',
            'return function () { var isAlly = true;' + blk + ' };');
        fn(f, '青云门', 3, function () { return 100; }, function () {},
            function (t) { 街谈.push(t); }, function (w, t) { 风云志.push([w, t]); },
            function () { return '黑风潮'; })();
        return { 街谈: 街谈, 风云志: 风云志, f: f };
    }
    // 改前对照：streetOf 还原成裸 street —— 该名字全仓无定义，当场 ReferenceError
    var oldBlock = block.replace(/streetOf\(/g, 'street(');
    var 炸了 = false;
    try { 装(oldBlock); } catch (e) { 炸了 = (e instanceof ReferenceError); }
    assert(炸了, 'B1 改前对照：盟家被围那刻裸调 street 直接 ReferenceError（不在 try 里，病是真的）');
    var r = 装(block);
    assert(r.街谈.length === 1 && r.街谈[0].indexOf('山门告急') >= 0,
        'B2 改后：街谈巷议真落账（茶棚里传开「山门告急」）');
    assert(r.风云志.length === 1 && r.风云志[0][0] === '青云门',
        'B3 改后：紧随其后的风云志 chronOf 不再被炸掉——围山一事门派史上有名');
    assert(r.f['sect_world_tide_pending'] && r.f['sect_world_tide_pending'].resolveDay === 101,
        'B4 一日驰援窗口照旧立住（掷骰自决日 = 当日+1）');
})();

// ============ [C] 行为面：读通功法后技能栏真刷新 ============
console.log('--- [C] updateSkillPanels 接线 ---');
(function () {
    var 真行 = "if (typeof renderSkillSlotsInline === 'function') renderSkillSlotsInline();";
    var 旧行 = "if (typeof updateSkillPanels === 'function') updateSkillPanels();";
    assert(INV.indexOf(真行) >= 0, 'C0 新行在账');
    function 跑(行) {
        var 刷新 = 0;
        new Function('renderSkillSlotsInline', 行)(function () { 刷新++; });
        return 刷新;
    }
    assert(跑(旧行) === 0, 'C1 改前对照：typeof 守卫恒假——刷新 0 次，静默空转（病是真的）');
    assert(跑(真行) === 1, 'C2 改后：技能栏真刷新（renderSkillSlotsInline 有定义即被调）');
    // 未挂载时新行也安静（typeof 守卫仍在）
    var 不炸 = true;
    try { new Function(真行)(); } catch (e) { 不炸 = false; }
    assert(不炸, 'C3 renderSkillSlotsInline 缺席时新行安静跳过（守卫没拆）');
})();

// ============ [D] 行为面：采集区域反查复活 ============
console.log('--- [D] getCurrentRegionForGathering 行为 ---');
(function () {
    var body = sliceFn(APP, 'function getCurrentRegionForGathering');
    assert(!!body, 'D0 切片成功');
    var oldBody = body.replace(/var _loc = [^;]+;/, "var _loc = window.currentLocation;")
        .replace(/var _locKey[^;]+;/, '')
        .replace(/data\.cities\.some\(function \(c\) \{ return String\(c\)\.replace\(\/\\s\+\/g, ''\) === _locKey; \}\)/,
            'data.cities.includes(_loc)');
    assert(oldBody !== body && oldBody.indexOf('var _loc = window.currentLocation;') >= 0
        && !/typeof getCurrentLocation === 'function'\) \? getCurrentLocation/.test(oldBody),
        'D0b 改前对照体构造成功（读取行还原成 window 幽灵读，注释里的名字不算数）');
    function 装(b, 城市, 有随机图区域) {
        var w = {
            currentRegionForMap: 有随机图区域 || null,
            mapData: { '中原': { cities: ['帝都 · 长安', '洛水城'] }, '南疆': { cities: ['苗疆'] } }
        };
        return new Function('window', 'getCurrentLocation',
            'return function getCurrentRegionForGathering() {' + b + '};')(
            w, function () { return 城市; })();
    }
    assert(装(oldBody, '帝都·长安') === null,
        'D1 改前对照：window.currentLocation 幽灵读恒 undefined → 反查永远 null（病是真的）');
    assert(装(body, '帝都·长安') === '中原',
        'D2 改后：人在长安（账上无空格写法），反查真得出「中原」——DES-57 空白差被抹平');
    assert(装(body, '帝都 · 长安') === '中原',
        'D3 带空格写法同样命中（两边都去空白）');
    assert(装(body, '苗疆') === '南疆', 'D4 别的城市照常反查');
    assert(装(body, '帝都·长安', '东海') === '东海',
        'D5 随机图区域在册时优先照旧（活头 currentRegionForMap 不被抢）');
    assert(装(body, '') === null, 'D6 问不出所在城时诚实回 null（不瞎编区域）');
})();

console.log('\nv25.0-full-audit：' + passed + ' 通过 / ' + failed + ' 失败');
process.exit(failed ? 1 : 0);
