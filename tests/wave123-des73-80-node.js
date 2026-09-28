#!/usr/bin/env node
/**
 * 第一百二十三批（续）· DES-73 ~ DES-80 的成套取证
 * 病（一族一类，每条都由主线程回读到实现行才动刀）：
 *   DES-73 探监回执读 discover() 的 status，而「玩家自己抹过记号」那一支根本不回 status
 *          ⇒ 屏上印「眼下是undefined」，还谎称「黑风寨早在你的舆图上」；
 *   DES-74 活动页挂着「🏪 隐藏商店」，而它要城市声望「熟面孔」才开得动
 *          ⇒ 违反用户规矩「活动页只准放随时能做的事」；
 *   DES-75 角色名下 24 项账（名气／机缘／悟道点／恶名／香火／中毒／灵泉余泽／日门牌／
 *          秘籍研读／秘境层数／前世记忆／入魔程度／破境丹余益／角色 flags／战绩…）
 *          在 collect 与 apply 两头都没点名——不是「写了没读」，是两头都没写，读档即蒸发；
 *   DES-76 杀孽两本账：随档持久的是 _killCount，而结局判定与心魔读的是从不入档的 killCount
 *          ⇒ 杀人再多不判「入魔」，攒够的十点存一次档就清零；
 *   DES-77 幽灵全局两枚（与 NEW-73 同族：都是一个名字挂不上 window）：顶层 const 不挂 window，
 *          于是 window.cityData ⇒ 市民系统永远「街上没有看到什么人」；
 *          window.NAMED_NEMESES ⇒ 具名宿敌三张脸永远遇不上；
 *   DES-78 存档：槽位那笔 setItem 失败不改 _writeOk ⇒ 同一屏先「⚠️ 写入失败」后「✅ 保存成功」，
 *          HUD 还刷上「上次保存: 现在」；
 *   DES-79 updateTaskUI 的门禁读 #sect-tasks-container（全仓无人创建）⇒ 门派任务整窗空白，
 *          差事既不能接也不能交；
 *   DES-80 抉择史写盘 catch(e){} 吞掉，随后照旧念「📜 选择已记录」。
 * 手法：能 vm 装载真文件的都用行为断言（location-system / battle / sects-system /
 *      choice-memory / game-state / crafting 六份），装载不到的（app.js 整页）留源码结构断言并写明「读码」；
 *      另附白名单普查棘轮（无主键隔离名单只准缩不准涨）与控制组（未入档的键必须蒸发，否则说明探针没量到白名单）。
 * 运行：node tests/wave123-des73-80-node.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');

let passed = 0, failed = 0;
function ok(cond, msg) {
    if (cond) passed++;
    else { failed++; console.log('[FAIL] ' + msg); }
}
function load(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
// 棘轮一律先剥掉行注释：本批在几处修好的地方留了「改前长什么样」的说明，
// 那些字面量（charData.killCount／#sect-tasks-container）正是解释本身，不该被自家棘轮当成复发。
function 去注释(src) {
    return src.split('\n').map(function (line) {
        const i = line.indexOf('//');
        return i >= 0 ? line.slice(0, i) : line;
    }).join('\n');
}

// ============ vm 现场（一页最小 DOM 假人） ============
function makeNode() {
    const n = {
        style: { setProperty() {}, removeProperty() {} },
        classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
        dataset: {}, children: [], childNodes: [], attrs: {},
        appendChild(c) { this.children.push(c); c.parentNode = this; return c; },
        removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c; },
        setAttribute(k, v) { this.attrs[k] = String(v); },
        getAttribute(k) { return Object.prototype.hasOwnProperty.call(this.attrs, k) ? this.attrs[k] : null; },
        addEventListener() {}, removeEventListener() {}, dispatchEvent() {},
        closest() { return null; }, querySelector() { return null; }, querySelectorAll() { return []; },
        focus() {}, blur() {}, click() {}, remove() {}, insertBefore(c) { this.children.push(c); return c; },
        getBoundingClientRect() { return { top: 0, left: 0, width: 120, height: 120, bottom: 120, right: 120 }; },
        scrollIntoView() {}, offsetHeight: 120, offsetWidth: 120, parentNode: null,
        textContent: '', innerHTML: '', value: ''
    };
    return n;
}
function makeSandbox(extra) {
    const msgs = [];
    const sb = Object.assign({
        console: { log() {}, warn() {}, error() {} },
        localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    // 【第一百四十四批】沙箱自建 localStorage、未加载 global-utils.js ⇒ 生产码的存档单 owner
    // （window.saveToStorage）在此缺席。补同形桩，**转手调本沙箱自己的 localStorage**，
    // 以免「桩的 setItem 有没有被调到」这类探针失真。
    saveToStorage: function (k, v) {
        try { this.localStorage.setItem(k, v); return true; } catch (e) { return false; }
    },

        setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
        requestAnimationFrame: () => 0,
        navigator: { userAgent: 'node', maxTouchPoints: 0 },
        location: { href: 'file:///xianxia.html', search: '' },
        matchMedia: () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {} }),
        alert() {}, prompt: () => null, confirm: () => true,
        parseInt, parseFloat, isNaN, Number, String, Math, Date, JSON, Set, Map, Array, Object, RegExp, Error, Promise,
        performance: { now: () => 0 }
    }, extra || {});
    sb.__msgs = msgs;
    sb.showMessage = (t, k) => { msgs.push(String(t)); };
    sb.window = sb;
    sb.globalThis = sb;
    sb.document = {
        getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
        createElement: () => makeNode(), createTextNode: () => makeNode(),
        createElementNS: () => makeNode(), addEventListener() {}, removeEventListener() {},
        body: makeNode(), head: makeNode(), documentElement: makeNode(), readyState: 'loading',
        activeElement: null
    };
    vm.createContext(sb);
    return sb;
}
function loadInto(sb, rel) { vm.runInContext(load(rel), sb, { filename: rel }); }

const loaded = [];
function tryLoad(rel, extra) {
    const sb = makeSandbox(extra);
    try { loadInto(sb, rel); return { sb, err: null }; }
    catch (e) { return { sb, err: e.message }; }
}

const LOC = tryLoad('js/location-system.js');
const BAT = tryLoad('js/battle.js');
const SEC = tryLoad('js/sects/sects-system.js');
const CHM = tryLoad('js/quest/choice-memory.js');
const GS = tryLoad('js/core/game-state.js');
const CRF = tryLoad('js/crafting.js');
ok(!LOC.err, '⓪a 真 location-system 装载无异常' + (LOC.err ? '（' + LOC.err + '）' : ''));
ok(!BAT.err, '⓪b 真 battle 装载无异常' + (BAT.err ? '（' + BAT.err + '）' : ''));
ok(!SEC.err, '⓪c 真 sects-system 装载无异常' + (SEC.err ? '（' + SEC.err + '）' : ''));
ok(!CHM.err, '⓪d 真 choice-memory 装载无异常' + (CHM.err ? '（' + CHM.err + '）' : ''));
ok(!GS.err, '⓪e 真 game-state 装载无异常' + (GS.err ? '（' + GS.err + '）' : ''));
ok(!CRF.err, '⓪f 真 crafting 装载无异常' + (CRF.err ? '（' + CRF.err + '）' : ''));

// ============ A DES-73 探监回执的三种真相 ============
console.log('\n[A] DES-73 探监回执');
function 探监(discoverReturn) {
    const W = LOC.sb;
    W.SpecialPlaces = { discover: () => discoverReturn };
    W.actionGate = { isUsed: () => false, mark() {}, cooled: () => false, usedDays: () => false };
    const seen = [];
    W.showModal = (title, html) => { seen.push(String(title) + '|' + String(html)); };
    W.showMessage = (t) => { seen.push(String(t)); };
    W.__prison = seen;
    try { W._prisonVisit(); } catch (e) { return 'THREW: ' + e.message; }
    return seen.join('\n');
}
let txt = 探监({ ok: true, newly: true, def: { name: '黑风寨' }, status: '盘踞' });
ok(txt.indexOf('已标上舆图') >= 0, 'A1 新得知：念「已标上舆图」');
ok(txt.indexOf('undefined') < 0, 'A1b 三种回执里都不许出现 undefined');
txt = 探监({ ok: true, newly: false, def: { name: '黑风寨' }, record: {}, status: '真空' });
ok(txt.indexOf('早在你的舆图上') >= 0 && txt.indexOf('真空') >= 0, 'A2 册子里本就有：念现算的状态（真空）');
txt = 探监({ ok: false, reason: 'scrapped', newly: false, def: { name: '黑风寨' } });
ok(txt.indexOf('undefined') < 0, 'A3 自己抹过记号那一支：不再印「眼下是undefined」');
ok(txt.indexOf('废址') >= 0 && txt.indexOf('抹') >= 0, 'A3b 说的是实情：记号自己抹了、眼下是废址');
ok(txt.indexOf('早在你的舆图上') < 0, 'A3c 撤谎：这一支不再谎称「早在你的舆图上」（册子里根本没有它）');
// 自紧闸：新得知的口径不能被改坏
ok(/learned\.reason === 'scrapped'/.test(load('js/location-system.js')), 'A4 分支钉在案：回执按 discover 的 reason 分三路（谁合成一路必复发）');

// ============ B DES-74 活动页只挂随时能做的事 ============
console.log('\n[B] DES-74 活动页那张要声望才开得动的票');
const html = load('仙侠.html');
const act = html.slice(html.indexOf('id="panel-activities"'), html.indexOf('id="panel-activities"') + 40000);
ok(act.indexOf('openHiddenShop') < 0, 'B1 活动页里不再挂「🏪 隐藏商店」（它要「熟面孔」声望才开得动）');
ok(act.indexOf('隐藏商店') < 0 || /走城市里的黑市/.test(act), 'B2 说明行要么不提它、要么把「要看声望、走黑市」一起说清');
const 正门 = ['js/app.js', 'js/location-system.js']
    .map(f => (load(f).match(/openHiddenShop/g) || []).length)
    .reduce((a, b) => a + b, 0);
ok(正门 >= 2, 'B3 自紧闸：撤票不断唯一入口——城市与黑市那两处正门仍在（实得 ' + 正门 + ' 处引用）');
ok(/hidden_shop: 'openHiddenShop\(\)'/.test(load('js/reputation-system.js')),
    'B4 立案哨兵：门牌解锁表里仍有这一枚（解锁后由城市那一侧开门，本断言收口时转红）');

// ============ C DES-75 存档白名单：两头点名才作数 ============
console.log('\n[C] DES-75 角色账两头点名');
const W = GS.sb;
const 新账 = {
    name: '验证人', realm: '炼气', layer: 1,
    fame: 77, notoriety: 33, fortune: 40, insightPoints: 5, incense: 61,
    _poisoned: true, springBlessing: 2, lastDailyClaimDay: 18,
    _demonicCorruption: 20, _foundationBonus: 8, _coreBonus: 6, _primordialBonus: 4,
    _divineBonus: 2, _breakthroughPillBonus: 9,
    _manualProgress: { art_sword: 40 }, dungeonProgress: { dgn_a: 7 },
    _customPills: ['九转还魂丹'], _pastLifeMemory: { incarnations: 3, skill: { id: 'art_sword' } },
    flags: { special_permit: true, permit_长安: true },
    _arenaDay: 18, _arenaDailyCount: 3, arenaWins: 11, arenaStreak: 4, arenaScore: 130,
    _failedBreakthroughs: 2, dungeonClearedAt: { dgn_a: 12 },
    _没入档的对照键: '我要是活下来了，说明这条断言根本没量到白名单'
};
function 往返(cd) {
    W.currentCharData = cd;
    W.inventory = { slots: [], maxSlots: 30, currency: { copper: 100, spiritStones: 10 } };
    const raw = JSON.parse(JSON.stringify(W.GameState.collectFullGameState({})));
    let out = null;
    W.GameState.applyFullGameState(raw, { setCharData: c => { out = c; } });
    return out;
}
const back = 往返(JSON.parse(JSON.stringify(新账)));
ok(!!back, 'C0 真 collect → 真 apply 跑通（全程只走仓库那两个函数）');
const 键表 = Object.keys(新账).filter(k => k !== 'name' && k !== 'realm' && k !== 'layer' && k.indexOf('_没入档') !== 0);
let 丢 = [];
for (const k of 键表) {
    const got = k === 'flags' ? back.flags : back[k];
    const want = 新账[k];
    if (JSON.stringify(got) !== JSON.stringify(want)) 丢.push(k + '→' + JSON.stringify(got));
}
ok(丢.length === 0, 'C1 ' + 键表.length + ' 项角色账存了再读一项不丢（丢的：' + (丢.join('、') || '无') + '）');
ok(back._没入档的对照键 === undefined, 'C2 控制组：没进白名单的键必须蒸发（否则 C1 是探针说谎，不是白名单有效）');
ok(back.flags && back.flags.special_permit === true, 'C3 角色级 flags 落在 flags 名下（存侧另用 charFlags 键，两头对齐）');
// 口径钉住：角色卡上叫 name，存档字段叫 charName（collect 读 name、apply 回 name）
const 旧档 = { name: '古人', realm: '筑基' };
const 旧回 = 往返(JSON.parse(JSON.stringify(旧档)));
ok(!!旧回 && 旧回.name === '古人', 'C4a 旧档（只有名号境界）也能回灌——collect 认 charData.name，apply 认 saveData.charName，两头别名对得上');
ok(旧回.fame === 0 && 旧回.insightPoints === 0 && 旧回.arenaScore === 0, 'C4 旧档（没这些字段）按底色 0 回灌，不凭空发点发分');
ok(旧回._poisoned === false && 旧回.lastDailyClaimDay === null && 旧回._pastLifeMemory === null,
    'C5 旧档底色：没中毒／没领过俸／无前世记忆——三处 null/false 而不是 undefined 串到别处');
ok(旧回._manualProgress && Object.keys(旧回._manualProgress).length === 0 && Array.isArray(旧回._customPills),
    'C6 旧档底色：对象与数组给出空壳，读者不必再判 undefined');

// 白名单普查棘轮：全仓显式写 window.currentCharData.<键> 的地方，两头都得点名
function 普查() {
    const files = [];
    (function walk(d) {
        for (const f of fs.readdirSync(d)) {
            const p = path.join(d, f);
            const st = fs.statSync(p);
            if (st.isDirectory()) { if (f === 'node_modules' || f.charAt(0) === '.') continue; walk(p); }
            else if (/\.js$/.test(f) && !/\.bak/.test(f)) files.push(p);
        }
    })(path.join(ROOT, 'js'));
    const w = new Map();
    const re = /window\.currentCharData\.([A-Za-z_$][\w$]*)\s*(?:=[^=]|\+\+|--|[-+*/]=)/g;
    for (const f of files) {
        const src = fs.readFileSync(f, 'utf8');
        let m;
        re.lastIndex = 0;
        while ((m = re.exec(src))) {
            if (!w.has(m[1])) w.set(m[1], new Set());
            w.get(m[1]).add(path.relative(ROOT, f).replace(/\\/g, '/'));
        }
    }
    const gs = load('js/core/game-state.js');
    const 别名 = { flags: 'charFlags', _killCount: null, _npcRoutes: null };
    const out = { ok: [], miss: [] };
    for (const k of [...w.keys()].sort()) {
        const sk = 别名[k] || k;
        const inC = new RegExp('charData\\.' + k + '\\b').test(gs);
        const inA = sk === k
            ? new RegExp('saveData\\.' + k + '\\b').test(gs)
            : new RegExp('saveData\\.' + sk + '\\b').test(gs);
        // _killCount / _npcRoutes 各有自己的回灌写法（存档字段名去下划线；路线走 narrative）
        const 特例 = (k === '_killCount' && /_killCount: n\(saveData\.killCount/.test(gs))
            || (k === '_npcRoutes' && /_npcRoutes/.test(load('js/npcs/npc-personal-events.js')));
        (inC && (inA || 特例) ? out.ok : out.miss).push(k);
    }
    return out;
}
const 普 = 普查();
// C7 直接量白名单本体（不借普查的梯子：这批里有几项是「谁都没显式写 window.currentCharData.x」
// 的普通 charData.x 写法，普查够不着它们，借梯子量会把好改动误报成漏档）
const gsSrc = load('js/core/game-state.js');
function 两头点名(k) {
    const 存档别名 = { flags: 'charFlags', _killCount: 'killCount' }[k] || k;
    const inC = new RegExp('charData\\.' + k + '\\b').test(gsSrc);
    const inA = new RegExp('saveData\\.' + 存档别名 + '\\b').test(gsSrc)
        || new RegExp('saveData\\.' + k + '\\b').test(gsSrc);
    return inC && inA;
}
const 必须已入档 = ['fame', 'notoriety', 'fortune', 'insightPoints', 'incense', '_poisoned', 'springBlessing',
    'lastDailyClaimDay', '_demonicCorruption', '_foundationBonus', '_coreBonus', '_primordialBonus',
    '_divineBonus', '_breakthroughPillBonus', '_manualProgress', 'dungeonProgress', '_customPills',
    '_pastLifeMemory', 'flags', '_arenaDay', '_arenaDailyCount', 'arenaWins', 'arenaStreak', 'arenaScore',
    '_failedBreakthroughs', 'dungeonClearedAt', '_killCount'];
const 掉了 = 必须已入档.filter(k => !两头点名(k));
ok(掉了.length === 0, 'C7 棘轮：本批点名的 ' + 必须已入档.length + ' 项两头都在（掉出去的：' + (掉了.join('、') || '无') + '）');
const 隔离名单 = ['_confused', '_escort', '_formationBuff', '_heartDemon', '_heartDemonBonus',
    '_main025_asked', '_main025_stood', '_negativeEmotion', '_spentNoticed', '_wearyNoticed', 'location'];
const 新增无主 = 普.miss.filter(k => 隔离名单.indexOf(k) < 0);
ok(新增无主.length === 0, 'C8 棘轮：新写的角色账不许再漏白名单（多出来的无主键：' + (新增无主.join('、') || '无') + '）');
console.log('[口径] 显式写 window.currentCharData.<键> 的共 ' + (普.ok.length + 普.miss.length)
    + ' 枚：两头齐 ' + 普.ok.length + '、待立案（只准缩）' + 普.miss.length + ' —— ' + 普.miss.join('、'));

// 门派那本：日门牌随档走了，配套的「今日做过哪些」也必须走
// 注意：仓库里有三个模块都写了 export:/import:/reset:（同门关系、差事簿、投票册），
// 直接 indexOf('export: function') 会切到隔壁那一本，故从日门牌那一行往回找自己那扇。
const sectSrc = load('js/sects/sects-system.js');
const 日门牌 = sectSrc.indexOf('_sectTaskDay: ds._sectTaskDay');
ok(日门牌 > 0, 'C9a 找得到门派差事簿的导出那一行（找不到说明整段被搬走，C9 无从下尺）');
const 导出块 = sectSrc.slice(sectSrc.lastIndexOf('export: function', 日门牌), sectSrc.indexOf('import: function', 日门牌));
const 导入起点 = sectSrc.indexOf('import: function', 日门牌);
const 导入块 = sectSrc.slice(导入起点, sectSrc.indexOf('reset: function', 导入起点));
for (const k of ['_sectTaskDay', '_sectTaskCompleted', '_sectTaskDone', '_sectRelation']) {
    ok(导出块.indexOf(k) >= 0 && 导入块.indexOf(k) >= 0, 'C9 门派差事账 ' + k + ' 进出成对（只有日门牌入档＝同日差事可无限重领）');
}
ok(导出块.length > 100 && 导出块.length < 4000 && 导入块.length > 50,
    'C9b 两片切块确实是这一本（长度 ' + 导出块.length + '/' + 导入块.length + '，切到隔壁那本会露馅）');

// ============ D DES-76 杀孽一本账 ============
console.log('\n[D] DES-76 杀孽一本账');
const 裸账 = [];
(function scan(dir) {
    for (const f of fs.readdirSync(path.join(ROOT, dir))) {
        const p = path.join(ROOT, dir, f);
        const st = fs.statSync(p);
        if (st.isDirectory()) { if (f !== 'node_modules') scan(path.join(dir, f)); continue; }
        if (!/\.js$/.test(f) || /\.bak/.test(f)) continue;
        const src = 去注释(fs.readFileSync(p, 'utf8'));
        src.split('\n').forEach((line, i) => {
            if (/(charData|player|cd|p)\.killCount\b/.test(line) && !/_killCount/.test(line)) {
                裸账.push(path.relative(ROOT, p).replace(/\\/g, '/') + ':' + (i + 1));
            }
        });
    }
})('js');
ok(裸账.length === 0, 'D1 棘轮：全仓不再读／写那本从不入档的裸 killCount（实得 ' + 裸账.join(' | ') + '）');
ok(/var killCount = charData\._killCount \|\| 0;/.test(load('js/quest/quest-system.js')), 'D2 结局判定读持久那本');
ok(/var killCount = charData\._killCount \|\| 0;/.test(load('js/cultivation/cultivation.js')), 'D3 心魔「杀孽」那条读持久那本');
ok(/charData\._killCount = \(charData\._killCount \|\| 0\) \+ 10;/.test(load('js/cultivation/cultivation.js')),
    'D4 入魔 +10 记进持久那本（回执文案「杀戮值+10」与账同名）');
// 行为：真 collect→apply 之后杀孽不丢
const 杀 = 往返(JSON.parse(JSON.stringify({ name: '杀', _killCount: 63 })));
ok(杀._killCount === 63, 'D5 行为：存读一档杀孽仍是 63（改前这一世白杀）');

// ============ E DES-77 幽灵全局（顶层 const 不挂 window） ============
console.log('\n[E] DES-77 幽灵全局两枚');
ok(Array.isArray(BAT.sb.NAMED_NEMESES) && BAT.sb.NAMED_NEMESES.length === 3,
    'E1 真 battle 装载后 window.NAMED_NEMESES 是 3 张脸的表（改前恒 undefined，宿敌永不遭遇）');
ok(BAT.sb.NAMED_NEMESES.every(n => n.key && typeof n.minLv === 'number' && typeof n.respawnDays === 'number'),
    'E2 表上每行都带 app.js 掷宿敌那支要用的三个字段（key／minLv／respawnDays）');
const 可用 = BAT.sb.NAMED_NEMESES.filter(n => n.minLv <= 12);
ok(可用.length >= 1, 'E3 自紧闸：境界刻度 12 级至少掷得出一张脸（不是挂上了却还是筛空）');
ok(BAT.sb.NAMED_NEMESES.every(n => !/[\u4e00-\u9fa5]/.test(n.key)), 'E4 机制认 key，不认中文名（强制规则第 5 条）');
ok(LOC.sb.cityData && typeof LOC.sb.cityData === 'object' && Object.keys(LOC.sb.cityData).length >= 10,
    'E5 真 location-system 装载后 window.cityData 有整座城市表（实得 ' + Object.keys(LOC.sb.cityData || {}).length + ' 座）');
const 一座 = Object.keys(LOC.sb.cityData)[0];
LOC.sb.cityCitizens = LOC.sb.cityCitizens || {};
let 街 = null;
try { 街 = vm.runInContext('generateCitizensForCity(' + JSON.stringify(一座) + ')', LOC.sb); } catch (e) { 街 = 'ERR:' + e.message; }
ok(Array.isArray(街) && 街.length >= 1, 'E6 行为：真调用一次生成市民，街上有人了（改前恒 []⇒「街上没有看到什么人」）'
    + (Array.isArray(街) ? '' : '（实得 ' + JSON.stringify(街) + '）'));
ok(!Array.isArray(街) || 街.every(c => c.name && c.occupation), 'E6b 生成的每位市民都带名字与营生（不是空壳计数）');

// ============ F DES-78 存档两笔都落盘才算成功（读码结构断言） ============
console.log('\n[F] DES-78 存档回执（读码）');
const app = load('js/app.js');
const 存档段 = app.slice(app.indexOf("var _writeOk = true;"), app.indexOf('function exportSave'));
ok(存档段.length > 200, 'F0 取到 saveGame 那一段真源码（长度 ' + 存档段.length + '）');
    // 【第一百四十四批·按「钉法」换定位词与判据形状，要求一字未松】
    // 改前：`localStorage.setItem('xianxia_saves' … catch (e) { _writeOk = false`。
    // 第一百四十四批把 18 个存档键接到单一 owner（window.saveToStorage），它**自己吞异常、返回布尔、从不抛**
    // ⇒ 那个 catch 成为死支，不改的话槽位写失败时 `_writeOk` 不会被改假（DES-78 破）。
    // 现在的正确写法是**读返回值**。要求原文一字未松：仍是「槽位那笔写失败要把 _writeOk 改假」。
    ok(/if \(!window\.saveToStorage\('xianxia_saves'[\s\S]{0,120}_writeOk = false/.test(存档段),
        'F1 槽位那笔写失败会把 _writeOk 改假（DES-78；单一 owner 不抛，故读返回值——改前靠 catch 触发）');
ok(/if \(_writeOk\)[\s\S]{0,160}last-save-time/.test(存档段), 'F2 「上次保存: 」那枚时钟只认合并结论');
ok(/showSaveToast\('✅ 存档保存成功！'\)/.test(存档段) && /if \(!\_silent \&\& \_writeOk\) showSaveToast/.test(存档段),
    'F3 ✅ 回执有 _writeOk 那道闸：写失败时不再同一屏既报失败又报成功');
ok(存档段.indexOf("onSaved(_writeOk ? saveData.timestamp : 0)") > 存档段.indexOf("localStorage.setItem('xianxia_saves'"),
    'F4 顺序对：ContinueSave 的回话排在两笔盘都写完之后（DES-28 语义不变、结论变全）');

// ============ G DES-79 门派任务两栏真的被填 ============
console.log('\n[G] DES-79 门派任务整窗空白');
const SW = SEC.sb;
const 容器 = {};
['active-tasks', 'available-tasks'].forEach(id => { 容器[id] = makeNode(); });
SW.document.getElementById = (id) => (Object.prototype.hasOwnProperty.call(容器, id) ? 容器[id] : null);
SW.window.activeTasks = [];
SW.renderXEmpty = (el, cfg) => { el.innerHTML = '[空态]' + (cfg.title || '') + '|' + ((cfg.hints || []).join('/')); return true; };
let 抛 = null;
try { SW.updateTaskUI(); } catch (e) { 抛 = e; }
ok(!抛, 'G1 updateTaskUI 跑到底不抛' + (抛 ? '（' + 抛.message + '）' : ''));
ok(容器['available-tasks'].innerHTML.length > 0, 'G2 「可用任务」那一栏有内容了（改前门禁读不存在的 #sect-tasks-container，两栏永远空白）');
ok(容器['active-tasks'].innerHTML.length > 0, 'G3 「进行中」那一栏也给了话（空态或卡片二选一，不许静默空白）');
const 卡数 = (容器['available-tasks'].innerHTML.match(/接取|今日已完成|进行中|已完成/g) || []).length;
ok(卡数 >= 1 || /\[空态\]/.test(容器['available-tasks'].innerHTML),
    'G3b 自紧闸：要么真画出可点的差事卡，要么老实说没有（实得卡面字样 ' + 卡数 + ' 枚）');
// 第二遍：两栏都在屏上、且「进行中」那一栏挂了一件差事
容器['active-tasks'].innerHTML = '';
容器['available-tasks'].innerHTML = '';
SW.document.getElementById = (id) => (Object.prototype.hasOwnProperty.call(容器, id) ? 容器[id] : null);
SW.activeTasks = [{ taskId: 't1', task: { name: '巡山', desc: '去后山走一圈', objectives: [{ type: 'patrol', count: 1 }] }, progress: {} }];
抛 = null;
try { SW.updateTaskUI(); } catch (e) { 抛 = e; }
ok(!抛, 'G4a 有差事那一支跑到底不抛' + (抛 ? '（' + 抛.message + '）' : ''));
ok(/巡山/.test(容器['active-tasks'].innerHTML) && /交任务/.test(容器['active-tasks'].innerHTML),
    'G4 行为：有差事时卡片真画出来、带「交任务」那一枚（改前永远走不到这里）');
ok(/执行巡逻/.test(容器['active-tasks'].innerHTML),
    'G4b 单目标巡逻类差事给出直达钮（不必先去别处找那把尺）');
ok(容器['available-tasks'].innerHTML.length > 0,
    'G5 同一次刷新里「可用」那一栏也照旧填着（门禁只挡「两栏都不在屏上」）');
// 棘轮：这道门禁不许再指回那个没人创建的 id（注释里提它是本案说明，剥注释后再量）
ok(/sect-tasks-container/.test(去注释(load('js/sects/sects-system.js'))) === false,
    'G6 棘轮：#sect-tasks-container 在代码里不再被读（它从来没有创建点）');
const 全仓 = [];
(function scan(dir) {
    for (const f of fs.readdirSync(path.join(ROOT, dir))) {
        if (/\.bak/.test(f)) continue;
        const p = path.join(ROOT, dir, f);
        if (fs.statSync(p).isDirectory()) { if (f !== 'node_modules') scan(path.join(dir, f)); continue; }
        if (!/\.(js|html)$/.test(f)) continue;
        if (去注释(fs.readFileSync(p, 'utf8')).indexOf('sect-tasks-container') >= 0) 全仓.push(p);
    }
})('js');
ok(全仓.length === 0, 'G6b 上一步覆盖到 js 每一本：实得 ' + (全仓.join(' | ') || '零处'));
ok(去注释(load('仙侠.html')).indexOf('sect-tasks-container') < 0,
    'G6c 页面本体（仙侠.html）也没有那个容器的创建点——它确实是凭空读出来的 id');

// ============ H DES-80 抉择落盘才算记录 ============
console.log('\n[H] DES-80 抉择谎报已存盘');
const 表 = vm.runInContext('(function(){ var a=[]; for (var k in IMPORTANT_CHOICES) a.push(k); return a; })()', CHM.sb);
ok(Array.isArray(表) && 表.length >= 1, 'H0 仓库里的重大抉择表非空（实得 ' + (表 || []).length + ' 条）');
const 一条 = (表 || []).filter(k => /^ch_/.test(k))[0] || (表 || [])[0];
function 记(写得进) {
    const C = CHM.sb;
    const 存 = {};
    C.localStorage = {
        getItem: k => (Object.prototype.hasOwnProperty.call(存, k) ? 存[k] : null),
        setItem: (k, v) => { if (!写得进) throw new Error('QuotaExceededError'); 存[k] = String(v); },
        removeItem: k => { delete 存[k]; }
    };
    const 报 = [];
    C.showMessage = t => { 报.push(String(t)); };
    C.__报 = 报; C.__存 = 存;
    C.recordChoice(一条, '某章');
    return { 报: 报.join('\n'), 存: 存['xianxia_choices'] };
}
let 成 = 记(true);
ok(成.报.indexOf('选择已记录') >= 0, 'H1 写得进：照旧报「📜 选择已记录」');
ok(成.存 && 成.存.indexOf(一条) >= 0, 'H2 报成功的这一条真的落进了 localStorage');
let 败 = 记(false);
ok(败.报.indexOf('没能留住') >= 0, 'H3 写不进去时改口：念「这一条没能留住」（改前对着没落盘的账报成功）');
ok(败.报.indexOf('存储空间已满') >= 0, 'H3b 说清原因（浏览器存储空间已满）');
ok(败.报.indexOf('选择已记录') < 0, 'H4 自紧闸：同一句里不许既报「已记录」又报「没能留住」');
ok(!败.存, 'H4b 落盘确实没成（这条断言证明 H3 不是探针自己造的假失败）');

// ============ I DES-72 产出念实收（合成那一路） ============
console.log('\n[I] DES-72 合成产出入袋数');
const CW = CRF.sb;
CW.addItem = (id, n) => (n > 3 ? 1 : n);   // 行囊只收得下一件
CW.window.inventory = { slots: [], currency: { copper: 0, spiritStones: 0 } };
const got1 = vm.runInContext('addResultItem("iron_sword", 5)', CW);
ok(got1 === 1, 'I1 addItem 回 1 ⇒ addResultItem 如实回 1（改前恒回真数，回执念「获得 ×5」而手里只有 1）（实得 ' + got1 + '）');
CW.addItem = (id, n) => 0;
ok(vm.runInContext('addResultItem("iron_sword", 5)', CW) === 0, 'I2 一件都塞不下 ⇒ 回 0，让调用方回滚材料');
CW.addItem = (id, n) => true;   // 旧语义（布尔）：不能把 true 当成 0
ok(vm.runInContext('addResultItem("iron_sword", 4)', CW) === 4, 'I3 自紧闸：addItem 只回布尔时按开价数收下（不把你正常做的合成判成失败）');
CW.addItem = undefined;
CW.window.addItem = undefined;
ok(vm.runInContext('addResultItem("iron_sword", 2)', CW) === 0, 'I4 通道都不在时报 0（宁可回滚材料，也不装作成品发过了）');
const craftSrc = load('js/crafting.js');
ok(/var gotCount = addResultItem\(/.test(craftSrc), 'I5 executeCrafting 收下实数');
ok(/gotCount < resultCount/.test(craftSrc) && /行囊只收下/.test(craftSrc), 'I6 塞不下时回执念实收并说清差几件');
ok(/count: gotCount/.test(craftSrc), 'I7 item:crafted 事件也带实数（成就／图鉴那侧不再按开价计数）');
const 田 = load('js/house-system.js');
ok(/got <= 0/.test(田) && /没收/.test(田), 'I8 灵田同族：一件都没收着就不清畦、给真回执');

// ============ 结案哨兵（谁收口谁转红） ============
console.log('\n[J] 立案哨兵');
// DES-66 已结案（第一百三十批）：撤立案哨兵，换正向钉
ok(/function _deAddItem\([\s\S]{0,600}?Number\(window\.addItem\(id, count\)\)/.test(load('js/core/daily-events.js')),
    'J1 DES-66 已结案：每日事件封装认实收数（旧「恒 return true」那一形不许回来）');
ok(/addOk = window\.addItem\(item\.templateId, item\.quantity\);/.test(load('js/enhanced-shop.js')),
    'J2 DES-64 仍在案：回购只问「有没有加进去」。开始认件数后转红');
const 裸2 = [];
(function scan(dir) {
    for (const f of fs.readdirSync(path.join(ROOT, dir))) {
        if (/\.bak/.test(f)) continue;
        const p = path.join(ROOT, dir, f);
        if (fs.statSync(p).isDirectory()) { if (f !== 'node_modules') scan(path.join(dir, f)); continue; }
        if (!/\.js$/.test(f)) continue;
        fs.readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
            if (/window\.addItem\([^)]*\)\s*;\s*\/\/\s*不认数|if \(window\.addItem\(/.test(line)) 裸2.push(p + ':' + (i + 1));
        });
    }
})('js');
console.log('[待办口径] DES-72 同族尚未收口的调用点（本批只收了合成与灵田两处）：'
    + 'sect-resource-actions／sect-facilities／alchemy-compound／forging-compound／bounty-board，登记于 FIX_NOTES');

console.log('\n========== 第一百二十三批（续）· DES-73~DES-80 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
