/**
 * tests/wave140-quest-event-bridge-node.js
 * 第一百四十批 · 任务事件桥端到端验收
 *
 * 为什么要这一套：
 *   2026-09-27 这一天，同一个「事件桥」的问题上错了两次——
 *     ① 一支只读代理断言「quest:completed／reputation:changed／npc:talked／item:obtained
 *        不在事件桥的 types 数组里，事件桥只写了一半」，并把它当头条结论报上来；
 *     ② 我自己的第一版尺也误判了 4 条 —— 它只 grep 其它文件的 EventBus.on('X') 字面量，
 *        而任务桥是用 types.forEach **批量注册**的。
 *   两把尺都错在**同一处**：没有人验证过「事件真的发出去 → 桥真的收到 → 目标真的推进」这一段。
 *   本套把这一段变成可执行的断言：谁再动桥、谁再删 listener，这里当场报红。
 *
 * 手法：真 js/quest/quest-system.js 装进 vm 沙箱真跑（不是抄一份判定逻辑），
 *      桩 EventBus 记录 on()、桩 QuestRegistry 供题，事件经**桥自己注册的 listener** 走一遍。
 * ⚠️ 本套 0 条真 Chrome 屏证：读的都是沙箱里的返回值与源码普查结果。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');

let passed = 0, failed = 0;
function ok(c, m) { if (c) { passed++; console.log('  ✓ ' + m); } else { failed++; console.log('  [FAIL] ' + m); } }
function eq(a, b, m) { ok(a === b, m + '（实际=' + JSON.stringify(a) + ' 期望=' + JSON.stringify(b) + '）'); }
// ⚠️ load() 必须能吃绝对路径：[E] 段传进来的是 path.join(ROOT,'js') 拼出来的绝对路径，
//    而这个 load() 原来无脑 path.join(ROOT, f) ⇒ 又拼一遍成
//    "...\仙侠世界\D:\...\js\x.js" ⇒ ENOENT。**这是我今天第四次栽在同一个坑**
//    （前面 census-story.cjs、economy 各一次，答复那次一次）。写在这里，别再犯第五次。
const load = rel => {
    const p = path.isAbsolute(rel) ? rel : path.join(ROOT, rel);
    return fs.readFileSync(p, 'utf8');
};

// ============ 沙箱：真源码 + 桩 EventBus / QuestRegistry ============
function 建沙箱() {
    const listeners = {};                 // 事件名 -> [fn]
    const 账 = {};                        // 桩里的题册：id -> quest
    const 沙 = {
        console: { log() {}, warn() {}, error() {} },
        setTimeout, clearTimeout,
        localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    // 【第一百四十四批】沙箱自建 localStorage、未加载 global-utils.js ⇒ 生产码的存档单 owner
    // （window.saveToStorage）在此缺席。补同形桩，**转手调本沙箱自己的 localStorage**，
    // 以免「桩的 setItem 有没有被调到」这类探针失真。
    saveToStorage: function (k, v) {
        try { this.localStorage.setItem(k, v); return true; } catch (e) { return false; }
    },

    };
    沙.window = 沙;
    沙.globalThis = 沙;
    沙.global = 沙;
    // 最小 DOM 桩：advanceQuestObjectivesFromEvent(:2136) 在推进之后会调 updateQuestUI()，
    // 后者一路摸到 createQuestItemElement(:1668) 的 `.firstChild`。
    // **不给桩，事件桥的 listener 会在这里抛，让人误以为「桥没把目标推进」——其实推进完了、刷屏那一步炸了。**
    // ⚠️ 第二版仍炸：桩里 querySelector 返回 null，`null.firstChild` 又挂。
    //    现在改成**一切皆可用**：任何选择器都给同一个宽松对象，getter 一律兜底。
    // 这个坑我连踩两次才记牢：**验「事件是否推进了目标」时，别让推进之后的下游渲染有机会说话。**
    const 宽松 = () => {
        const o = {
            innerHTML: '', textContent: '', className: '', value: '', id: '', href: '',
            style: new Proxy({}, { get: () => '', set: () => true }),
            dataset: new Proxy({}, { get: () => '', set: () => true }),
            classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
            children: [], childNodes: [], firstChild: null, lastChild: null, parentNode: null,
            appendChild() {}, removeChild() {}, insertBefore() {}, replaceChild() {},
            remove() {}, setAttribute() {}, getAttribute: () => null, removeAttribute() {},
            addEventListener() {}, removeEventListener() {}, dispatchEvent() {},
            querySelector: () => 宽松(), querySelectorAll: () => [], closest: () => null,
            getBoundingClientRect: () => ({ top: 0, left: 0, width: 0, height: 0 }),
            scrollIntoView() {}, focus() {}, blur() {}, click() {},
        };
        return o;
    };
    沙.document = {
        getElementById: () => 宽松(),
        querySelector: () => 宽松(),
        querySelectorAll: () => [],
        createElement: () => 宽松(),
        createDocumentFragment: () => 宽松(),
        body: 宽松(),
        documentElement: 宽松(),
        addEventListener() {}, removeEventListener() {},
    };
    沙.EventBus = {
        on(type, fn) { (listeners[type] = listeners[type] || []).push(fn); },
        emit(type, data) { (listeners[type] || []).forEach(fn => { try { fn(data); } catch (e) { throw e; } }); },
    };
    沙.QuestRegistry = {
        get(id) { return 账[id] || null; },
        all() { return Object.keys(账).map(k => 账[k]); },
        register(q) { 账[q.id] = q; },
    };
    // ⚠️ 上一版把 QuestRegistry 桩掉了，白费劲：quest-system.js:36 是 **模块本地的 `var QuestRegistry`**，
    //    findQuestById(:1079) 走的是它，不看 window.QuestRegistry。
    //    而顶层 `var` 在 vm 沙箱里**就是**上下文全局 ⇒ 跑完源码后 `沙.QuestRegistry` 拿到的是真的，
    //    用它自己的 register() 铺题即可。（第一版探针栽在这：铺了题却 get 不到。）
    vm.createContext(沙);
    vm.runInContext(load('js/quest/quest-system.js'), 沙, { filename: 'js/quest/quest-system.js' });
    // ⚠️ 桩到这儿已经救不了了：createQuestItemElement(:1668) 摸的是 `tpl.content.firstChild`，
    //    那个 tpl 来自**真 innerHTML 模板解析**（<template>.content），裸 vm 里没有 HTML 解析器，
    //    任何桩都给不出一个有 .content 的东西。
    //    而本套要验的是「事件有没有把目标推进」，**推进之后那步刷屏不该有机会说话**——
    //    它炸了只会让人误判成「桥没干活」（我为此连栽三次：document → querySelector → tpl.content）。
    //    顶层 function 声明在 vm 里就是全局绑定，可覆写 ⇒ 把这两个渲染函数静默掉。
    //    ⚠️ 这不是「把尺改松」：C1 验的是 objectives[].completed 有没有被置上，
    //       渲染在 :2136 之后、且不参与置位判定。判据没松，只是不让下游渲染搅局。
    try {
        vm.runInContext('updateQuestUI = function () {}; updateQuestTracker = function () {};', 沙);
    } catch (eUI) { /* 覆写失败就照旧，让下面的断言自己说话 */ }
    return { 沙, listeners, 真册: 沙.QuestRegistry };
}

// 造一条最小任务：只带 objectives。⚠️ 铺进**真注册表**（见上面 建沙箱 的注释），桩册没用。
function 造题(册, id, objectives) {
    const q = { id: id, title: '测试题', type: 'main', objectives: objectives, accepted: true, turnedIn: false, completed: false };
    册.register(q);
    return q;
}

console.log('\n========== 第一百四十批 · 任务事件桥端到端验收 ==========');

// ============ [A] 桥注册完整性：13 类一个不许少 ============
console.log('\n[A] 桥注册完整性（谁删了 listener 这里就红）');
const A = 建沙箱();
{
    const 听 = Object.keys(A.listeners).sort();
    // 这 13 类是 quest-system.js:2152-2165 明列的；少任何一类，对应的 objective 类型就永不推进。
    // ⚠️ 2026-09-27 那天有代理断言其中 4 类「不在数组里」—— 那是误报（:2154/:2156/:2164/:2165 全在）。
    //    本段把这件事钉死：类型清单与注册结果逐项对照，不再靠人眼读数组。
    const 必在 = [
        'enemy:defeated', 'item:obtained', 'item:crafted', 'npc:talked', 'location:visited',
        'dungeon:completed', 'arena:won', 'escort:completed', 'cultivation:completed',
        'cultivation:breakthrough', 'sect:joined', 'reputation:changed', 'quest:completed',
    ];
    const 缺 = 必在.filter(t => 听.indexOf(t) < 0);
    ok(缺.length === 0, 'A1 桥注册了 ' + 听.length + ' 类，13 类必在项一个不缺'
        + (缺.length ? '（缺: ' + 缺.join('、') + '）' : ''));
    const 多 = 听.filter(t => 必在.indexOf(t) < 0);
    ok(多.length === 0, 'A2 没有多余注册（多: ' + (多.join('、') || '无') + '）——'
        + '多注册不会让任务错，但会掩盖「该桥的事件被桥漏了」这类问题');
    ok(必在.length === 13, 'A3 必在清单本身就是 13 类（现 ' + 必在.length + '）——'
        + 'quest-system.js:2152-2165 的数组若增删，本段要跟着改，别让两处悄悄跑偏');
}

// ============ [B] 每类事件的匹配逻辑（eventType × objective.type）============
console.log('\n[B] 匹配逻辑：事件与目标的对应表');
{
    // 这些正是 quest-system.js:2026-2088 各支所认的组合。
    // ⚠️ 抄这一张表**不是**抄判定逻辑——判定逻辑在沙箱里真跑，这里只给样本数据。
    // 样本字段名按 quest-system.js 各支的**真判据**写，不是拍脑袋：
    //   :2030 enemy:defeated 的 actual 取 [enemyId,enemyType,species,name]+tags ⇒ 目标写汉字就得用 name 撞
    //   :2074 cultivation:completed 认 meditate/practice/… ⇒ **不含** cultivation_realm
    //   :2081-2083 cultivation_realm 走 breakthrough，且要 data.toRealm / data.toLayer
    const 样本 = [
        ['enemy:defeated', { type: 'kill', target: '妖狼' }, { name: '妖狼' }],
        ['item:obtained', { type: 'collect', itemId: 'herb' }, { itemId: 'herb' }],
        ['item:crafted', { type: 'craft' }, {}],
        ['npc:talked', { type: 'talk_to_npc', npcId: 'n1' }, { npcId: 'n1' }],
        ['location:visited', { type: 'visit', location: '灵界' }, { locationName: '灵界·洞天' }],
        ['dungeon:completed', { type: 'explore_dungeon', dungeon: 'mt' }, { dungeonId: 'mt' }],
        ['arena:won', { type: 'arenaWin' }, {}],
        ['escort:completed', { type: 'escort', target: '商队' }, { target: '商队' }],
        ['cultivation:completed', { type: 'meditate' }, { minutes: 30 }],
        ['cultivation:breakthrough', { type: 'cultivation_realm', realm: '筑基' }, { toRealm: '筑基' }],
        ['cultivation:breakthrough', { type: 'breakthrough_realm' }, { toRealm: '金丹' }],
        ['sect:joined', { type: 'join_sect' }, { sect: '少林' }],
        ['reputation:changed', { type: 'reputation', amount: 10 }, { amount: 10 }],
        ['quest:completed', { type: 'complete_quests', count: 3 }, { count: 1 }],
    ];
    const 沙 = 建沙箱().沙;
    // 把判定函数掏出来（quest-system.js 顶层 function 声明 ⇒ 落在沙箱作用域的全局）
    const f = new vm.Script('typeof questObjectiveMatches === "function" ? questObjectiveMatches : null');
    const 判 = f.runInContext(沙);
    if (typeof 判 !== 'function') {
        ok(false, 'B0 沙箱里取不到 questObjectiveMatches —— 本段判据失效，后面的 B1 必须重取');
    } else {
        ok(true, 'B0 沙箱里取到真判定函数 questObjectiveMatches（不是抄的）');
        const 不对 = [];
        for (const [ev, obj, data] of 样本) {
            if (!判(obj, ev, data)) 不对.push(ev + '/' + obj.type);
        }
        ok(不对.length === 0, 'B1 ' + 样本.length + ' 组「事件×目标」全部匹配得上'
            + (不对.length ? '（对不上: ' + 不对.join('、') + '）' : ''));
        // 反向自证：拿错事件去撞，必须撞不上（否则 B1 是恒真的）
        const 撞错 = [];
        for (const [ev, obj] of 样本) {
            if (判(obj, 'quest:__never__', {})) 撞错.push(obj.type);
        }
        ok(撞错.length === 0, 'B2 反向自证：拿一个不存在的事件去撞 ' + 样本.length
            + ' 组目标，一个都撞不上' + (撞错.length ? '（竟然撞上了: ' + 撞错.join('、') + '）' : '') + '——证明 B1 不是恒真');
    }
}

// ============ [C] 端到端：事件真发出去 → 桥真收到 → 目标真推进 ============
console.log('\n[C] 端到端 round-trip（今天两次错的就是这一段）');
{
    const C = 建沙箱();
    const 沙 = C.沙, 册 = C.真册;
    // 铺 14 道题，每道一个目标
    const 谱 = [
        ['q_kill', 'enemy:defeated', { type: 'kill', target: '妖狼' }, { name: '妖狼' }],
        ['q_collect', 'item:obtained', { type: 'collect', itemId: 'herb' }, { itemId: 'herb' }],
        ['q_craft', 'item:crafted', { type: 'craft' }, {}],
        ['q_talk', 'npc:talked', { type: 'talk_to_npc', npcId: 'n1' }, { npcId: 'n1' }],
        ['q_visit', 'location:visited', { type: 'visit', location: '灵界' }, { locationName: '灵界·洞天' }],
        ['q_dun', 'dungeon:completed', { type: 'explore_dungeon', dungeon: 'mt' }, { dungeonId: 'mt' }],
        ['q_arena', 'arena:won', { type: 'arenaWin' }, {}],
        ['q_escort', 'escort:completed', { type: 'escort', target: '商队' }, { target: '商队' }],
        ['q_med', 'cultivation:completed', { type: 'meditate' }, { minutes: 30 }],
        ['q_rea', 'cultivation:breakthrough', { type: 'cultivation_realm', realm: '筑基' }, { toRealm: '筑基' }],
        ['q_bre', 'cultivation:breakthrough', { type: 'breakthrough_realm' }, { toRealm: '金丹' }],
        ['q_sect', 'sect:joined', { type: 'join_sect' }, { sect: '少林' }],
        ['q_rep', 'reputation:changed', { type: 'reputation', amount: 5 }, { amount: 5 }],
        ['q_done', 'quest:completed', { type: 'complete_quests', count: 2 }, { count: 1 }],
    ];
    谱.forEach(([id, , obj]) => 造题(册, id, [JSON.parse(JSON.stringify(obj))]));
    沙.questSystem.importQuestProgress({ activeQuests: 谱.map(x => x[0]), completedQuests: [], totalCompleted: 0 });

    // 逐类：经**桥自己注册的 listener** 发出去
    // ⚠️ 第一版把 C1 写成「14 道全部 completed」，可 q_done 要 2 个、只发 1 次 —— 它**本就不该完成**。
    //    于是 C1 与 C3 互相矛盾，量出 13 过 1 不过。判据分开：13 道该完成的完成，
    //    第 14 道「本轮不该完成、且进度要停在 1」正是 C2/C3 要说的。
    const 不该动 = 'q_done';
    const 不动 = [];
    for (const [id, ev, , data] of 谱) {
        const 目标 = 册.get(id).objectives[0];
        try { 沙.EventBus.emit(ev, data); } catch (e) { 不动.push(id + '(抛:' + e.message + ')'); continue; }
        if (id === 不该动) continue;
        if (!目标.completed) 不动.push(id + '(' + (目标.type || '?') + ')');
    }
    ok(不动.length === 0, 'C1 13 组「事件→桥→目标」逐一真发出去，13 道题的目标**全部推进到 completed**'
        + (不动.length ? '（没动: ' + 不动.join('、') + '）' : '') + '——这段就是今天两把尺都漏掉的');
    const qc = 册.get('q_done').objectives[0];
    ok(qc.currentCount === 1 && !qc.completed, 'C2/C3 累计型目标按数推进且**不越界**（complete_quests 要 2、发 1 次 ⇒ currentCount='
        + qc.currentCount + '、completed=' + qc.completed + '）——防「一交就满」');
}

// ============ [D] 改前复现：拆掉一个 listener，这把尺必须当场报红 ============
console.log('\n[D] 改前复现（拆桥 ⇒ 尺要红；不拆就是恒真）');
{
    const D = 建沙箱();
    const 沙 = D.沙, 册 = D.真册;
    造题(册, 'q_rep2', [{ type: 'reputation', amount: 5 }]);
    沙.questSystem.importQuestProgress({ activeQuests: ['q_rep2'], completedQuests: [], totalCompleted: 0 });
    // 拆掉 reputation:changed 的 listener（模拟「有人把桥改漏了」）
    const 原 = D.listeners['reputation:changed'];
    D.listeners['reputation:completed'] = null;
    D.listeners['reputation:changed'] = [];
    沙.EventBus.emit('reputation:changed', { amount: 5 });
    const 拆后 = 册.get('q_rep2').objectives[0].completed;
    // ⚠️ 第一版断言 `=== false`，量出来是 `undefined` —— 目标从没被推进过时 completed 是 undefined 不是 false。
    //    判据用「falsy」，别把「没推进」和「推进了但值是 false」混成一件事。
    ok(!拆后, 'D1 拆掉 reputation:changed 的 listener 后，声望目标**不再推进**（completed=' + 拆后 + '）'
        + '——证明 C1 那句「13 组全部推进」是桥真的在干活，不是恒真');
    // 复原再验一次，证明不是被别的因素卡住
    D.listeners['reputation:changed'] = 原;
    沙.EventBus.emit('reputation:changed', { amount: 5 });
    ok(册.get('q_rep2').objectives[0].completed === true, 'D2 把 listener 装回去，同一个目标又推进了（completed=' + 册.get('q_rep2').objectives[0].completed + '）'
        + '——D1 的「不动」是桥被拆造成的，不是别的原因');
}

// ============ [E] 生产侧 emit 源存在性（桥听的必须真有地方发）============
console.log('\n[E] 生产侧 emit 源：桥在听的事件必须真有地方发');
{
    const SKIP = new Set(['node_modules', '.git', '.kilo', '.scratch', '剧情导出']);
    const 文件 = [];
    (function w(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (SKIP.has(e.name)) continue; const p = path.join(d, e.name); if (e.isDirectory()) w(p); else if (/\.js$/.test(e.name)) 文件.push(p); } })(path.join(ROOT, 'js'));
    const 桥听 = Object.keys(建沙箱().listeners);
    const 无源 = [];
    for (const ev of 桥听) {
        const re = new RegExp("\\.emit\\(\\s*['\"]" + ev.replace(/[:]/g, '\\:') + "['\"]");
        let 有 = false;
        for (const f of 文件) { if (re.test(load(f.replace(/\\/g, '/')))) { 有 = true; break; } }
        if (!有) 无源.push(ev);
    }
    ok(无源.length === 0, 'E1 桥听的 ' + 桥听.length + ' 类事件，生产码里都有 emit 源'
        + (无源.length ? '（无源: ' + 无源.join('、') + '）' : '')
        + '——2026-09-27 实测：escort:completed 曾是「桥在听、全库零 emit」，'
        + 'sects-system.js:83 的 task_combat_3「护送商队」目标因此永不推进，已在 randomMap.js 送达兑付口补 emit');
}

console.log('\n通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
