/**
 * tests/dungeon-three-faces-node.js
 *
 * 常驻三座秘境（上古遗迹 ruin / 幽暗洞穴 cave / 仙山秘境 mountain）：
 *   A  三座各有各的事件子集与通关彩头 —— 三张脸，不是一张脸换三次名字。
 *   B  三座各有一扇玩家点得到的门（说清门在哪）；不验「三座挤在同一块石头上」。
 *   C  进度账的真语义：通关记最深层、枯竭期内进不去、复涌后从头走、
 *      再也不拿「=1」冒充「下次从哪儿进」。老档 =1 按 dungeonClearedAt 判。
 *   D  DUNGEON_COOLDOWN_DAYS 仍是 90（用户已定，不许改）。
 *   E  改前复现：把三座彩头改回同一张数组 ⇒ A 段当场报红（红完用 SHA256 还原工作树）。
 *
 * 本套只读源码 + 在 vm 沙箱里跑切出来的真函数；不写工作树（除 [E] 的还原动作本身）。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');

let passed = 0, failed = 0;
function ok(c, m) { if (c) { passed++; console.log('  ✓ ' + m); } else { failed++; console.log('  [FAIL] ' + m); } }
const load = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const src = rel => load(rel);

// ---------- 源码切片工具（沿用本仓既有套件的口径：按函数头切出真体，模板串/注释不算括号） ----------
function 扫串(s, i) {                       // 从引号处扫到配对的收尾，跳过转义与 ${}
    const q = s[i]; i++;
    while (i < s.length) {
        if (s[i] === '\\') { i += 2; continue; }
        if (q === '`' && s[i] === '$' && s[i + 1] === '{') {
            let d = 1; i += 2;
            while (i < s.length && d > 0) { if (s[i] === '{') d++; else if (s[i] === '}') d--; i++; }
            continue;
        }
        if (s[i] === q) return i;
        i++;
    }
    return i;
}
function 切函数(s, 头) {
    const i = s.indexOf(头);
    if (i < 0) throw new Error('切函数失败（找不到）：' + 头);
    let k = s.indexOf('{', i), depth = 0;
    for (; k < s.length; k++) {
        const ch = s[k];
        if (ch === '"' || ch === "'" || ch === '`') { k = 扫串(s, k); continue; }
        if (ch === '/' && s[k + 1] === '/') { k = s.indexOf('\n', k) - 1; continue; }
        if (ch === '{') depth++;
        else if (ch === '}') { depth--; if (depth === 0) break; }
    }
    return s.slice(i, k + 1);
}
const app = src('js/app.js');
const loc = src('js/location-system.js');
const wild = src('js/map/randomMap.js');
const evt = src('js/event-system.js');

console.log('\n[A] 三座秘境：三张脸（事件子集 / 宝箱单 / 通关彩头）');

// ---------- 把 dungeonFaceTable 的真体切出来，在沙箱里问它 ----------
function 建脸窗() {
    const W = {};
    W.console = { log() { }, warn() { }, error() { } };
    // 每次现读工作树：[E] 段要靠这一点去问「被改坏之后的脸长什么样」
    const 源码 = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
    const 体 = 切函数(源码, 'function dungeonFaceTable() {') + '\n'
        + 切函数(源码, 'function dungeonFaceOf(dungeonId) {') + '\n'
        + 'window.faceOf = dungeonFaceOf; window.faceTable = dungeonFaceTable;';
    vm.createContext(W);
    W.window = W;
    vm.runInContext('(function(){' + 体 + '})();', W);
    return W;
}
const 脸 = 建脸窗();
const 三座 = ['ruin', 'cave', 'mountain'];
const 脸集 = {}; 三座.forEach(id => { 脸集[id] = 脸.faceOf(id); });

ok(三座.every(id => !!脸集[id]), 'A0 三座 id 都在脸上取得到：' + 三座.join(' / '));
ok(脸.faceOf('不存在的座').clearWord === 脸集.ruin.clearWord,
    'A0b 没登记的 id 按「上古遗迹」那张脸兜底（老调用方传怪 id 不会凭空多出一张没定义的脸）');

const 事件集 = 三座.map(id => 脸集[id].events.slice().sort().join(','));
ok(事件集[0] !== 事件集[1] && 事件集[1] !== 事件集[2] && 事件集[0] !== 事件集[2],
    'A1 三座的事件子集两两不等（不全等）：\n        ruin     = ' + 事件集[0]
    + '\n        cave     = ' + 事件集[1]
    + '\n        mountain = ' + 事件集[2]);
ok(脸集.cave.events.indexOf('elite_combat') < 0 && 脸集.cave.events.indexOf('treasure_map') < 0,
    'A2 幽暗洞穴抽不到精英守卫与藏宝图（三层浅洞编不出成队精英，也没有留给行人看的图）');
ok(脸集.ruin.events.indexOf('herb_garden') < 0,
    'A3 上古遗迹抽不到药圃（塌了的神像底下长出来的是野草，不是谁种的圃子）');

const 彩头 = 三座.map(id => 脸集[id].clearItem.slice().sort().join(','));
ok(彩头[0] !== 彩头[1] && 彩头[1] !== 彩头[2] && 彩头[0] !== 彩头[2],
    'A4 ★三座的通关彩头两两不等（不再三座吐同一张单）：\n        ruin     = ' + JSON.stringify(脸集.ruin.clearItem)
    + '\n        cave     = ' + JSON.stringify(脸集.cave.clearItem)
    + '\n        mountain = ' + JSON.stringify(脸集.mountain.clearItem));
const 宝箱 = 三座.map(id => 脸集[id].chestRare.slice().sort().join(','));
ok(宝箱[0] !== 宝箱[1] && 宝箱[1] !== 宝箱[2] && 宝箱[0] !== 宝箱[2],
    'A5 ★三座「闪耀宝箱」的单子两两不等：\n        ' + 三座.map((id, i) => id + ' = ' + JSON.stringify(脸集[id].chestRare)).join('\n        '));
ok(三座.every(id => !!脸集[id].chestCommon && 脸集[id].chestCommon !== 脸集[三座.find(x => x !== id)].chestCommon),
    'A6 普通宝箱里那一份也随座走（遗迹＝丹药／洞底＝矿石／峰上＝聚气丹）');

// 掉率数字一个没动：全遭遇目录的权重与 minFloor 必须与本次改动前逐条相同
const 池 = (function () {
    const 体 = 切函数(app, 'function dungeonFaceTable() {') + '\n'
        + 'var DUNGEON_EVENTS_POOL = ' + app.slice(app.indexOf('var DUNGEON_EVENTS_POOL = [')).match(/var DUNGEON_EVENTS_POOL = \[[\s\S]*?\n\];/)[0].replace('var DUNGEON_EVENTS_POOL = ', '') + ';\n'
        + 切函数(app, 'function pickDungeonEvent(floor, dungeonId) {') + '\n'
        + 切函数(app, 'function dungeonFaceTable() {') + '\n'
        + 切函数(app, 'function dungeonFaceOf(dungeonId) {')
        + '\nwindow.pick = pickDungeonEvent; window.POOL = DUNGEON_EVENTS_POOL;';
    const W = { console: { log() { }, warn() { }, error() { } }, Math };
    vm.createContext(W);
    W.window = W;
    vm.runInContext('(function(){' + 体 + '})();', W);
    return W;
})();
const 权重原样 = 池.POOL.map(e => e.type + ':' + e.weight + '@' + e.minFloor).join('|');
ok(/combat:30@1\|elite_combat:8@3\|treasure:10@1\|rare_treasure:7@2\|herb_garden:5@1\|treasure_map:3@2\|trap:12@1\|magic_trap:8@3\|spirit_spring:5@2\|spring_echo:4@1\|inscription:4@1\|broken_art:4@2/.test(权重原样),
    'A7 ★全遭遇目录的十二类权重与 minFloor 一条没动（本批只换「各抽哪几类」）：' + 权重原样);

// 掷一亿次太慢，改成结构判据：每一座能掷出的 type 集合 == 它的子集 ∩ 目录
function 掷到(id, floor, 次数) {
    const seen = {};
    for (let i = 0; i < 次数; i++) { const e = 池.pick(floor, id); seen[e.type] = (seen[e.type] || 0) + 1; }
    return seen;
}
三座.forEach(id => {
    const seen = Object.keys(掷到(id, 9, 4000)).sort();
    const 应有 = 脸集[id].events.slice().sort();
    ok(JSON.stringify(seen) === JSON.stringify(应有),
        'A8 ' + id + ' 第 9 层掷 4000 次，出现的类型恰好等于它的子集（不多不少）：' + seen.join(','));
});
const 池1 = Object.keys(掷到('cave', 1, 4000)).sort();
const 池3 = Object.keys(掷到('cave', 3, 4000)).sort();
ok(池1.every(t => 池3.indexOf(t) >= 0) && 池3.every(t => 脸集.cave.events.indexOf(t) >= 0)
    && 池1.length < 池3.length,
    'A9 cave 的 minFloor 门槛照旧生效：一层见 ' + 池1.join(',') + '；三层多出 ' +
    池3.filter(t => 池1.indexOf(t) < 0).join(',') + '（两层门槛那两类），且都在 cave 子集内');

console.log('\n[B] 三座各一扇门（玩家点得到的，不是脚本调得到的）');

// B1 遗迹：奇遇那扇（event-system 活路，两条上游）
ok(/function enterSecretRealm\(\)[\s\S]{0,400}openDungeonEntrance\('ruin'\)/.test(evt),
    'B1 上古遗迹·奇遇门：event-system.js enterSecretRealm() → openDungeonEntrance(\'ruin\')');
ok(/event_secret_realm/.test(evt) && /'秘境之门'/.test(evt) && /type: EVENT_TYPES\.DUNGEON/.test(evt),
    'B1b 那扇门玩家点得到：奇遇表里有「秘境之门」（EVENT_TYPES.DUNGEON）');
ok(/id: 'ancient_ruins'[\s\S]{0,400}enterSecretRealm/.test(src('js/travel-system.js')),
    'B1c 第二条上游：行脚奇遇「发现遗迹」也喂同一扇门');

// B2 仙山：蓬莱仙岛的城市特色功能
ok(/'蓬莱仙岛':[\s\S]{0,900}specialFeatures: \[[^\]]*'仙山秘境'\]/.test(loc),
    'B2 仙山秘境·城门：蓬莱仙岛的特色功能里挂着「仙山秘境」');
ok(/'仙山秘境': function\(\) \{ if \(window\.openDungeonEntrance\) window\.openDungeonEntrance\('mountain'\); \}/.test(loc),
    'B2b 点它真的开 mountain（triggerSpecialFeature 的 handler 接 openDungeonEntrance）');
ok(/specialFeatures\.forEach\(feature =>[\s\S]{0,400}triggerSpecialFeature/.test(loc),
    'B2c 城市面板逐条把特色功能渲染成按钮（这条链是活的，不是死导出）');

// B2d 太虚山那扇遗迹门（与奇遇门通同一座，不是第二座遗迹）
ok(/'太虚山':[\s\S]{0,900}specialFeatures: \[[^\]]*'上古遗迹'\]/.test(loc),
    'B2d 上古遗迹·第二扇门：太虚山（城牌原文「传闻有上古仙人遗迹」）也挂着「上古遗迹」');
ok(/'上古遗迹': function\(\) \{ if \(window\.openDungeonEntrance\) window\.openDungeonEntrance\('ruin'\); \}/.test(loc),
    'B2e 点它真的开 ruin');

// B3 洞穴：野外图的天然洞窟／前人遗府底下
ok(/case 'realm-cave':[\s\S]{0,300}openDungeonEntrance\('cave'\)/.test(wild),
    'B3 幽暗洞穴·地图交互门：野外图 poiAction(\'realm-cave\') → openDungeonEntrance(\'cave\')');
ok(/poi\.variant\.key === 'heritage' \|\| poi\.variant\.key === 'natural'/.test(wild),
    'B3b 只给「前人遗府」「天然洞窟」两种来历开门（兽居改洞是妖兽的窝，底下没有秘境）');
ok(/currentRegionForMap !== '天界'/.test(wild) && /poi\.type === 'cave'/.test(wild),
    'B3c 天界那两座仙府云宫不给挂这条缝（本来就不见天日）');
ok(/case 'realm-cave'/.test(wild) && /data-act="\$\{a\.act\}"/.test(wild) && /tileActions\(cell\)/.test(wild),
    'B3d 那条缝是侧栏动作按钮（走 tileActions → data-act 委托），玩家点得到');

// B4 三座不许挤在同一块石头上：cave 那条与修炼那条是两个 act，不是一颗钮两个名字
const 洞府行 = wild.slice(wild.indexOf("if (poi.type === 'cave')"), wild.indexOf("if (poi.type === 'ruin')"));
ok(/act: 'cultivate'/.test(洞府行) && /act: 'realm-cave'/.test(洞府行)
    && 洞府行.indexOf("act: 'cultivate'") !== 洞府行.indexOf("act: 'realm-cave'"),
    'B4 洞府那条：修炼与秘境是**两个动作**（两个 act、两个按钮），不是同一颗钮两种叫法');
const 太虚山 = loc.slice(loc.indexOf("'太虚山'"), loc.indexOf("'青木城'"));
const 蓬莱 = loc.slice(loc.indexOf("'蓬莱仙岛'"), loc.indexOf("'东海龙宫'"));
ok(/上古遗迹/.test(太虚山) && !/仙山秘境/.test(太虚山) && /仙山秘境/.test(蓬莱) && !/上古遗迹/.test(蓬莱),
    'B5 太虚山只通遗迹、蓬莱只通仙山——两座仙山没把两扇门混挂');

console.log('\n[C] 进度账：最深层 / 枯竭 / 复涌 / 老档');

// 沙箱：切 dungeonDeepest / dungeonStartFloor / dungeonNoteReached / dungeonNoteCleared /
//       getDungeonCooldownLeft / enterDungeon 的真体（enterDungeon 需要 DUNGEON_DEFS，故一并切）
function 建秘境窗(初始账) {
    const W = {};
    W.console = { log() { }, warn() { }, error() { } };
    W._msgs = [];
    W.__账 = 初始账;          // 先落账再装真体：真体在装载那刻就把 currentCharData 绑到这一份上
    const defs = app.slice(app.indexOf('const DUNGEON_DEFS = {'), app.indexOf('};', app.indexOf('const DUNGEON_DEFS = {')) + 2);
    const 体 = [
        'var currentCharData = window.__账;',
        'var showMessage = function (t, ty) { window._msgs.push([String(t), ty]); };',
        defs,
        'const DUNGEON_COOLDOWN_DAYS = 90;',
        切函数(app, 'function _dungeonToday() {'),
        切函数(app, 'function getDungeonCooldownLeft(dungeonId) {'),
        切函数(app, 'function getDungeonDaysSince(dungeonId) {'),
        切函数(app, 'function dungeonDeepest(dungeonId) {'),
        切函数(app, 'function dungeonStartFloor(dungeonId) {'),
        切函数(app, 'function dungeonNoteReached(dungeonId, floor, cap) {'),
        切函数(app, 'function dungeonNoteCleared(dungeonId, cap) {'),
        'window.DUNGEON_DEFS = DUNGEON_DEFS; window.deepest = dungeonDeepest; window.startFloor = dungeonStartFloor;',
        'window.cdLeft = getDungeonCooldownLeft; window.daysSince = getDungeonDaysSince;',
        'window.noteReached = dungeonNoteReached; window.noteCleared = dungeonNoteCleared;'
    ].join('\n');
    vm.createContext(W);
    W.window = W;
    vm.runInContext(体, W);
    return W;
}
const 空档 = { dungeonProgress: {}, dungeonClearedAt: {} };

let W = 建秘境窗(空档);
ok(W.deepest('ruin') === 1 && W.startFloor('ruin') === 1, 'C0 空白档：最深层 1、从第 1 层进');
W.noteReached('mountain', 4, 7);
ok(W.__账.dungeonProgress.mountain === 4 && W.deepest('mountain') === 4 && W.startFloor('mountain') === 4,
    'C1 中途走到第 4 层就退：最深层记 4，再进接着第 4 层（这一栏此刻两义同值，不拧）');
W.noteReached('mountain', 2, 7);
ok(W.__账.dungeonProgress.mountain === 4, 'C2 高水位只升不降（退到浅处不把「最深入过 4 层」抹成 2）');

// 通关记最深层（不是 1）
W = 建秘境窗({ dungeonProgress: { cave: 2 }, dungeonClearedAt: {} });
W.noteCleared('cave', 3);
ok(W.__账.dungeonProgress.cave === 3, 'C3 ★通关把最深层记成这座的最底那一层（3），不是旧码那枚 1');
W.__账.dungeonClearedAt.cave = 100;
ok(W.deepest('cave') === 3 && W.startFloor('cave') === 1,
    'C4 ★通关后：最深层仍是 3（记录没被抹掉），但这一趟从第 1 层重走——两件事分开问');

// 枯竭期
W = 建秘境窗({ dungeonProgress: { cave: 3 }, dungeonClearedAt: { cave: 100 } });
W.timeSystem = { getAbsoluteDay: () => 100 };
ok(W.cdLeft('cave') === 90, 'C5 刚通关那天：冷却满 90 日');
W.timeSystem = { getAbsoluteDay: () => 160 };
ok(W.cdLeft('cave') === 30, 'C6 过了 60 日：还差 30 日');
W.timeSystem = { getAbsoluteDay: () => 190 };
ok(W.cdLeft('cave') === 0 && W.startFloor('cave') === 1, 'C7 第 90 日：灵气复涌，从第 1 层重走');

// 老档 =1 的两种判法（用户明令：别一律当已通最高层，也别一律当没通）
W = 建秘境窗({ dungeonProgress: { ruin: 1 }, dungeonClearedAt: {} });
ok(W.deepest('ruin') === 1 && W.startFloor('ruin') === 1,
    'C8 老档 =1 且**无**通关日 ⇒ 那是「从没进过／只到第一层」：最深层 1、从第 1 层进（不当已通最高层）');
W = 建秘境窗({ dungeonProgress: { ruin: 1 }, dungeonClearedAt: { ruin: 300 } });
ok(W.deepest('ruin') === 5,
    'C9 老档 =1 且**有**通关日 ⇒ 那一枚 1 是旧码的坏记法（既已通关必到过最底）：最深层读作 5（不当什么都没通）');
W = 建秘境窗({ dungeonProgress: { ruin: 1 }, dungeonClearedAt: { ruin: 300 } });
W.timeSystem = { getAbsoluteDay: () => 300 };
ok(W.cdLeft('ruin') === 90, 'C10 老档那枚 1 不会把冷却也抹掉：枯竭期照样进不去');

// enterDungeon 的 defense：枯竭期内即便绕过入口面板直调也拒
(function () {
    const 沙 = 建秘境窗({ dungeonProgress: { mountain: 7 }, dungeonClearedAt: { mountain: 500 } });
    沙.inventory = { currency: { spiritStones: 9999 } };
    沙.timeSystem = { getAbsoluteDay: () => 520, advanceTime() { } };
    沙.updateCurrencyUI = () => { };
    沙.codexHint = () => { };
    const 体 = 切函数(app, 'function enterDungeon(dungeonId = \'ruin\') {')
        + '\nwindow.__进 = enterDungeon;';
    vm.runInContext(体, 沙);
    沙.__进('mountain');
    const 首句 = 沙._msgs[0] ? 沙._msgs[0][0] : '';
    ok(/枯竭/.test(首句) && /距复涌尚需 70 日/.test(首句) && 沙.inventory.currency.spiritStones === 9999,
        'C11 ★枯竭期内 enterDungeon 拒绝：不扣灵石、不进秘境、话术点明还差几日（实得「' + 首句 + '」）');
})();

// 源码层：两处通关路径都写通关日、都调 dungeonNoteCleared，都不再出现「= 1」
// （先剥掉行注释再数——注释里为了说明「那行紧挨着写」也会提到这个 token）
const 无注释 = app.split('\n').map(l => { const i = l.indexOf('//'); return i >= 0 ? l.slice(0, i) : l; }).join('\n');
const 通关路径 = 无注释.split('dungeonClearedAt[dungeonState.id]').length - 1;
ok(通关路径 === 2, 'C12 两条通关路径各写一次通关日（代码里 dungeonClearedAt[dungeonState.id] 实得 ' + 通关路径 + ' 处）');
ok((无注释.match(/dungeonProgress\[dungeonState\.id\] = 1/g) || []).length === 0,
    'C13 ★源码里再也没有「dungeonProgress[id] = 1」这种写法');
ok((无注释.match(/dungeonNoteCleared\(dungeonState\.id/g) || []).length === 2,
    'C14 两条通关路径都改走 dungeonNoteCleared（记最深层）');
ok(/历史最深层/.test(app) && /本次从/.test(app) && !/历史进度：<span class="text-gray-400">第 \$\{progress\} 层/.test(app),
    'C15 入口面板把「历史最深层」与「本次从第几层进」分开念，不再合成一句含糊的「历史进度」');
ok(/灵气已复涌/.test(app) && /整座重新涌过一遍，从头走/.test(app),
    'C16 复涌后入口明写「整座重新涌过一遍，从头走」——不拿最深层那枚记录冒充起点');

console.log('\n[D] 制度没被动：冷却仍是 90');
ok(/const DUNGEON_COOLDOWN_DAYS = 90;/.test(app), 'D1 DUNGEON_COOLDOWN_DAYS 仍是 90');
ok(!/DUNGEON_COOLDOWN_DAYS\s*=\s*(?!90\b)\d+/.test(app), 'D2 全文件没有第二处给冷却赋值（不是 7 日、不是走通永不再开）');
ok(!/每日|dailyLimit|dailyCount/.test(app.slice(app.indexOf('副本/秘境系统'), app.indexOf('副本/秘境系统') + 20000)),
    'D3 秘境段里没有每日限次/人为配额');
ok(!/战力|powerGate|境界门槛/.test(app.slice(app.indexOf('副本/秘境系统'), app.indexOf('副本/秘境系统') + 20000)),
    'D4 秘境段里没有战力门槛（不会变成刷石机）');
const 掉落表 = src('js/loot-system.js');
ok(/dungeon_guard: DUNGEON_GUARD_LOOT/.test(掉落表) && /dungeon_boss: DUNGEON_BOSS_LOOT/.test(掉落表)
    && !/perDungeon|DUNGEON_FACE_LOOT/.test(掉落表),
    'D5 LOOT_TABLES 的 dungeon_guard/dungeon_boss 两档一个字节没动（分档只换候选，没换掉率数字）');

console.log('\n[E] 改前复现：三座彩头改回同一张数组 ⇒ A4/A5 当场报红（红完按 SHA256 还原）');
(function () {
    const 路径 = path.join(ROOT, 'js/app.js');
    const 原文 = fs.readFileSync(路径, 'utf8');
    const 前 = crypto.createHash('sha256').update(原文, 'utf8').digest('hex');
    let 改坏 = false;
    try {
        // 逐处把三座各自那张 clearItem 抹成同一张数组（行内替换，与换行符无关）
        const 同一张 = "clearItem: ['iron_sword', 'foundation_pill', 'mat_lingzhi']";
        let 换过 = 0;
        const 坏 = 原文.replace(/clearItem: \[[^\]]*\]/g, () => { 换过++; return 同一张; });
        if (换过 !== 3) throw new Error('该抹的彩头单不是三处，实得 ' + 换过 + ' 处——尺子已经对不上源码形状了');
        fs.writeFileSync(路径, 坏, 'utf8');
        改坏 = true;
        const 重脸 = 建脸窗();          // 重新从（被改坏的）工作树切真体
        const 三 = ['ruin', 'cave', 'mountain'].map(id => 重脸.faceOf(id).clearItem.slice().sort().join(','));
        const 宝箱三 = ['ruin', 'cave', 'mountain'].map(id => 重脸.faceOf(id).chestRare.slice().sort().join(','));
        ok(三[0] === 三[1] && 三[1] === 三[2],
            'E1 【改前复现】三座彩头被抹成同一张数组后，三张脸确实全等：' + JSON.stringify(三));
        ok(!(三[0] !== 三[1] && 三[1] !== 三[2] && 三[0] !== 三[2]),
            'E2 同一状态下 A4 的判据（三座两两不等）返回 false ⇒ A4 会报红，这把尺不是恒真');
        ok(宝箱三[0] !== 宝箱三[1],
            'E3 顺带记一条：只抹彩头救不了「三座同一张脸」——事件子集与宝箱单各是各的，'
            + '这也说明 A5/A8 不是靠 A4 撑着的（实得宝箱单 ' + JSON.stringify(宝箱三) + '）');
    } catch (e) {
        ok(false, 'E 改前复现装置出错：' + String(e && e.message || e));
    } finally {
        if (改坏) fs.writeFileSync(路径, 原文, 'utf8');
    }
    const 后 = crypto.createHash('sha256').update(fs.readFileSync(路径, 'utf8'), 'utf8').digest('hex');
    ok(前 === 后, 'E4 SHA256 还原：工作树字节级回到改前（' + 前.slice(0, 16) + '… ' + (前 === 后 ? '一致' : '不一致') + '）');
})();

console.log('\n结果：通过 ' + passed + '　失败 ' + failed);
process.exit(failed ? 1 : 0);