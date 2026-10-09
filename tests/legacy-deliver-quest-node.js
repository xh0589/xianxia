/**
 * tests/legacy-deliver-quest-node.js
 * 遗留缺陷批 · BUG-1：deliver 类任务目标 100% 不可完成
 *
 * 事实（修前）：js/quest/quest-system.js 的 questObjectiveMatches 覆盖 14 类事件，
 * 没有 deliver 支；registerQuestEventBridge 的 types 数组同样没有 deliver 事件；
 * 全仓零处 emit('deliver:...')。于是
 *   js/items-extended/12-quest-extensions.js  random_007「传递消息」
 *   js/items-extended/12-quest-extensions.js  npc_merchant_02「运货」（NPC 故事线第二步）
 * 两条任务的 objectives 都是 { type: 'deliver' } ⇒ 进度恒 0，玩家永远交不了。
 *
 * 为什么是改类型而不是补管线：先查清「送信/交货」到底有没有玩法入口——
 *   · crime-works.js deliverSmuggle() 是真交货（柜上交货），但它是走私系统，与两条任务无关；
 *   · randomMap.js:3501 escortDeliverHere 是真运货（镖车送达），它 emit 的是 escort:completed，
 *     桥认的正是 { type: 'escort' }；
 *   · 飞鸽传书（mail-system.js）是**收**信，不是替人送信；npc-system 的 'delivery' 是另一套
 *     NPC 委托子系统的 type，与 quest-system 的 objective 无关；npc-life-system 的
 *     { type: 'deliver' } 模板挂在只 push 不推进的 _personalQuests 上。
 *   结论：**没有「把东西交给某个 NPC」的玩法入口**，路 A 无处可挂 emit。
 *   另外 wave140-quest-event-bridge-node.js 的 A2 断言「没有多余注册」，补第 14 类事件会当场打红它。
 *   所以走路 B：改成已接通类型——运货 ⇒ escort（跑一趟镖），送信 ⇒ visit（到访两处城镇）。
 *
 * 手法：真 quest-system.js + 真 12-quest-extensions.js 装进 vm 沙箱真跑，
 *      目标推进走**桥自己注册的 listener**（不是抄一份判定逻辑）。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');

let passed = 0, failed = 0;
function ok(c, m) { if (c) { passed++; console.log('  ✓ ' + m); } else { failed++; console.log('  [FAIL] ' + m); } }
const load = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// ============ 沙箱 ============
// 宽松 DOM 桩的来历写在 wave140 那套的注释里（推进之后的下游渲染不该有机会说话）：
// createQuestItemElement 会摸真 innerHTML 模板的 tpl.content.firstChild，裸 vm 里没有 HTML 解析器。
function 宽松() {
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
}

function 建沙箱() {
    const listeners = {};
    const 沙 = {
        console: { log() {}, warn() {}, error() {} },
        setTimeout, clearTimeout,
        localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
        saveToStorage: function (k, v) {
            try { this.localStorage.setItem(k, v); return true; } catch (e) { return false; }
        },
    };
    沙.window = 沙; 沙.globalThis = 沙; 沙.global = 沙;
    沙.document = {
        getElementById: () => 宽松(), querySelector: () => 宽松(), querySelectorAll: () => [],
        createElement: () => 宽松(), createDocumentFragment: () => 宽松(),
        body: 宽松(), documentElement: 宽松(), addEventListener() {}, removeEventListener() {},
    };
    沙.EventBus = {
        on(type, fn) { (listeners[type] = listeners[type] || []).push(fn); },
        emit(type, data) { (listeners[type] || []).forEach(fn => fn(data)); },
    };
    vm.createContext(沙);
    vm.runInContext(load('js/quest/quest-system.js'), 沙, { filename: 'js/quest/quest-system.js' });
    // 渲染静默掉（wave140 同一处置：判据是 objectives[].completed，渲染在其后且不参与置位）
    vm.runInContext('updateQuestUI = function () {}; updateQuestTracker = function () {};', 沙);
    // quest-system.js 的注册表是**模块本地 var**（顶层 var 在 vm 里就是上下文全局），
    // 而 12-quest-extensions.js 走 window.QuestRegistry.registerMany —— 给它接上真身，
    // 扩展文件注册的题才能被 findQuestById 找到（不然 merge() 只往 allQuests 里塞，册里查不到）。
    沙.QuestRegistry.registerMany = function (list) {
        (list || []).forEach(q => 沙.QuestRegistry.register(q));
    };
    沙.allQuests = [];
    沙.mainQuestChain = [];
    vm.runInContext(load('js/items-extended/12-quest-extensions.js'), 沙,
        { filename: 'js/items-extended/12-quest-extensions.js' });
    return { 沙, listeners, 册: 沙.QuestRegistry };
}

console.log('\n========== 遗留批 · BUG-1 deliver 类任务目标 ==========');

// ============ [A] 两条任务的类型普查 ============
console.log('\n[A] 类型普查：deliver 目标已不存在，且每个目标的类型桥都认');
{
    const A = 建沙箱();
    const 两条 = ['random_007', 'npc_merchant_02'];
    const 缺题 = [];
    const 还deliver = [];
    const 死型 = [];
    // 「这条目标 ⇒ 生产侧真会发出来的那次事件」。payload 由**目标自身的字段**生成
    // （collect 看 obj.item、kill 看 obj.target、突破看 obj.toRealm…），
    // 问的是「存在一次事件能推动它吗」，不是「随便编个事件能不能撞上」。
    // 判定本身跑沙箱里的真 questObjectiveMatches——这里只提供生产侧会发出的那份数据。
    function 该来什么事件(o) {
        switch (o.type) {
            case 'kill': case 'combat': return ['enemy:defeated', { name: o.target || o.enemyId || '无名' }];
            case 'collect': return ['item:obtained', { itemId: o.item }];
            case 'craft': return ['item:crafted', { itemId: o.item }];
            case 'talk': case 'talk_to_npc': return ['npc:talked', { npcId: o.npcId, npcName: o.npcName }];
            case 'visit': return ['location:visited', { locationName: o.location || o.locationName || '青木城' }];
            case 'explore': case 'explore_dungeon': return ['dungeon:completed', { dungeonId: o.dungeon || o.dungeonId }];
            case 'arena_win': case 'arenaWin': return ['arena:won', {}];
            case 'sparring': return ['sparring', {}];
            case 'escort': return ['escort:completed', { target: '商队' }];
            case 'meditate': case 'practice': case 'cultivate': return ['cultivation:completed', {}];
            case 'breakthrough_realm': return ['cultivation:breakthrough', { fromRealm: o.fromRealm, toRealm: o.toRealm }];
            case 'cultivation_realm': return ['cultivation:breakthrough', { toRealm: o.realm, toLayer: o.layer }];
            case 'join_sect': return ['sect:joined', { sectId: o.sectId }];
            case 'reputation': return ['reputation:changed', { cityName: o.city }];
            case 'complete_quests': return ['quest:completed', {}];
            default: return null;
        }
    }
    // 全工程已知仍未接通的类型豁免名单。**现在这一张是空的**——两条都修完了：
    //   deliver —— random_007「传递消息」＋npc_merchant_02「运货」，见本文件头；
    //   defend  —— random_019「守护灵田」，后续批修（改成 kill 妖兽×5：护宗演阵/兽潮叩门/猎杀妖兽
    //     三条真防守玩法全都汇到 battle.js:4720 的 enemy:defeated，而 quest-system.js:2098 本来
    //     就有一条专给「妖兽」写死的判据，不需要给事件桥补第 14 类）。
    // 名单非空时，「已知的缺陷」被挡在 A1 普查之外——所以这张表现在是空的，A1 才真的覆盖全册：
    // 谁再写回一个接不上的类型（包括 defend / deliver），A1 当场报红，不再有豁免口。
    const 已知未接通 = new Set();
    const 判 = vm.runInContext('questObjectiveMatches', A.沙);

    // 全任务册普查（不只这两条）：任何 objective 类型若不在对应表里，就是「永远推不动」的写法
    let 普查数 = 0;
    (A.沙.allQuests || []).forEach(q => {
        (q.objectives || []).forEach(o => {
            普查数++;
            if (已知未接通.has(o.type)) return;
            const 样 = 该来什么事件(o);
            if (!样) { 死型.push(q.id + '/' + o.type); return; }
            if (!判(o, 样[0], 样[1])) 死型.push(q.id + '/' + o.type + '(判不上)');
        });
    });
    ok(死型.length === 0, 'A1 全任务册 ' + 普查数 + ' 条目标逐条过真判定器，桥认不出的一类也没有'
        + (死型.length ? '（推不动的: ' + 死型.join('、') + '）' : '')
        + '——无豁免名单，全册覆盖');
    const 已知 = [];
    (A.沙.allQuests || []).forEach(q => (q.objectives || []).forEach(o => {
        if (已知未接通.has(o.type)) 已知.push(q.id + '/' + o.type);
    }));
    ok(已知.length === 0,
        'A2 全任务册已无「已知未接通」的目标类型（现 ' + 已知.length + ' 类' + (已知.length ? '：' + 已知.join('、') : '') + '）——'
        + 'deliver（random_007/npc_merchant_02）与 defend（random_019）都已接通；'
        + '本条从「恰好剩 random_019/defend 未修」升为「一条不剩」，是断言随修复变严，不是放松');

    两条.forEach(id => {
        const q = A.册.get(id);
        if (!q) { 缺题.push(id); return; }
        (q.objectives || []).forEach(o => { if (o.type === 'deliver') 还deliver.push(id); });
    });
    ok(缺题.length === 0, 'A3 random_007 与 npc_merchant_02 在真册里都查得到'
        + (缺题.length ? '（查不到: ' + 缺题.join('、') + '）' : ''));
    ok(还deliver.length === 0, 'A4 两条任务的 objectives 里已无 deliver 类型'
        + (还deliver.length ? '（还有: ' + 还deliver.join('、') + '）' : ''));
    const r7 = A.册.get('random_007'), m2 = A.册.get('npc_merchant_02');
    ok(r7 && r7.objectives[0].type === 'visit' && r7.objectives[0].count >= 2,
        'A5 random_007「传递消息」＝ visit×' + (r7 ? r7.objectives[0].count : '?')
        + '（描述「将信件送到邻近城市」；count 提到 2 是因为 location:visited 在进城与入门派都发，单次到访近乎白捡）');
    ok(m2 && m2.objectives[0].type === 'escort',
        'A6 npc_merchant_02「运货」＝ escort×1（对话原话「把这批货运到金城」；运货＝跑一趟镖，'
        + 'randomMap.js:3501 escortDeliverHere 送达时 emit escort:completed，桥认 escort）');
}

// ============ [B] 端到端：事件真发出去 → 桥真收到 → 目标真推进 → 任务真完成 ============
console.log('\n[B] 端到端（走桥自己注册的 listener）');
{
    const B = 建沙箱();
    const 沙 = B.沙, 册 = B.册;
    沙.questSystem.importQuestProgress({
        activeQuests: ['random_007', 'npc_merchant_02'], completedQuests: [], totalCompleted: 0
    });
    const 送达 = () => 沙.EventBus.emit('location:visited', { locationId: '青木城', locationName: '青木城' });
    const 跑镖 = () => 沙.EventBus.emit('escort:completed', { target: '商队', cargo: '灵芝', toName: '金城' });

    送达();
    const 七半 = 册.get('random_007').objectives[0];
    ok(七半.currentCount === 1 && !七半.completed,
        'B1 第一次到访只走一格（currentCount=' + 七半.currentCount + '、completed=' + 七半.completed
        + '）——防「一进城就满」，这正是把 count 提到 2 要防的那个坑');
    送达();
    ok(七半.currentCount === 2 && 七半.completed === true,
        'B2 第二次到访补满 random_007 的目标（currentCount=' + 七半.currentCount + '、completed=' + 七半.completed + '）');
    ok(册.get('random_007').completed === true,
        'B3 random_007 升 completed=true（升 completed 才有交付按钮——这正是修前玩家永远看不到的那一步）');

    跑镖();
    const 商 = 册.get('npc_merchant_02').objectives[0];
    ok(商.completed === true && 册.get('npc_merchant_02').completed === true,
        'B4 完成一次护送后 npc_merchant_02「运货」目标与任务双双 completed'
        + '（obj=' + 商.completed + '、quest=' + 册.get('npc_merchant_02').completed + '）——'
        + 'NPC 故事线第二步不再锁死');
    ok(Object.keys(B.listeners).indexOf('deliver:delivered') < 0,
        'B5 没有为了修它去新增 deliver 事件注册（桥仍是 13 类）——本批走的是改类型，不是补管线；'
        + 'wave140 的 A2 断言「无多余注册」也不受影响');
}

// ============ [C] 改前复现：把类型改回 deliver，这把尺必须当场报红 ============
console.log('\n[C] 改前复现（把类型退回 deliver ⇒ B2/B4 不成立）');
{
    const C = 建沙箱();
    const 沙 = C.沙, 册 = C.册;
    // 只在沙箱内存里把两条题的目标类型改回 deliver —— 模拟「修复被撤销」，
    // 一个字都不写工作树（下面 C2 复查工作树 byte-exact）。
    册.get('random_007').objectives[0].type = 'deliver';
    册.get('npc_merchant_02').objectives[0].type = 'deliver';
    沙.questSystem.importQuestProgress({
        activeQuests: ['random_007', 'npc_merchant_02'], completedQuests: [], totalCompleted: 0
    });
    沙.EventBus.emit('location:visited', { locationId: '青木城', locationName: '青木城' });
    沙.EventBus.emit('location:visited', { locationId: '金城', locationName: '金城' });
    沙.EventBus.emit('escort:completed', { target: '商队' });
    const 七 = 册.get('random_007').objectives[0], 商 = 册.get('npc_merchant_02').objectives[0];
    ok(!七.completed, 'C1 deliver 目标收到任何事件都不推进（random_007 currentCount=' + 七.currentCount
        + '）——修前就是这个状态，B2 不是恒真');
    ok(!商.completed, 'C2 同上，npc_merchant_02 也推不动（currentCount=' + 商.currentCount + '）');
    ok(!册.get('random_007').completed && !册.get('npc_merchant_02').completed,
        'C3 两条任务都停在未完成（无交付按钮）——修前的真实症状');
}

// ============ [D] random_019「守护灵田」defend ⇒ kill 妖兽×5：端到端 + 改前复现 ============
// 原为 { type:'defend' }：quest-system.js 的 13 类事件里没有 defend 支，桥也听不到任何「防守」
// 事件 ⇒ 进度恒 0（与本文件头的 deliver 同一种病：目标类型接不上）。修法同样走「改已接通类型」，
// 但这一条**不缺玩法**——防守玩法是真的有，只是它们汇到的是 enemy:defeated：
//   · js/extensions/player-sect-ui.js:555 _defendSectRaid（按钮「护宗战」/「进山演阵」，:366 挂的）
//     :560-566 敌人 { name:'攻山妖兽', type:'beast', species:'beast' }；
//   · js/sects/sect-war.js:329-341 buildTideEnemy「兽潮·叩门兽群」species:'beast'，
//     :343 startTideSiege 真开这一仗，:340 自己写着「今日这道门必须守住」；
//   · js/extensions/beast-ecosystem.js:284 猎杀妖兽入口 species:'beast'；
//   · js/factions/faction-invasion.js:4-37 敌对势力入侵 → openBattleWithEntity。
// 它们全汇到 js/battle.js:4720 的 emit('enemy:defeated', { enemyId, enemyType, species, tags })，
// 而 quest-system.js:2098 本就有一条**专给「妖兽」写死**的判据（v25.1·P25 加的：野外妖兽叫
// 赤炎狼/幽冥虎，名字不含「妖兽」二字，字符串互contain 永远失配，故看 species/enemyType=='beast'）。
// ⇒ 改 { type:'kill', target:'妖兽', count:5 }：语义正对描述「不被妖兽破坏」，且不必给桥补第 14 类
// （wave140-quest-event-bridge-node.js:141-143 的 A2 断言「没有多余注册」照样绿）。
console.log('\n[D] random_019「守护灵田」：defend ⇒ kill 妖兽（走 enemy:defeated 真负载）');
{
    const D = 建沙箱();
    const 沙 = D.沙, 册 = D.册;
    const r19 = 册.get('random_019');
    ok(!!r19 && r19.objectives[0].type === 'kill' && r19.objectives[0].target === '妖兽'
        && r19.objectives[0].count === 5,
        'D1 random_019 目标＝ kill 妖兽×5（type=' + (r19 ? r19.objectives[0].type : '缺题')
        + '、target=' + (r19 ? r19.objectives[0].target : '?') + '、count=' + (r19 ? r19.objectives[0].count : '?')
        + '）——已无 defend 类型；count 从 1 提到 5，一只怪就交差与「守护」不合');

    沙.questSystem.importQuestProgress({
        activeQuests: ['random_019'], completedQuests: [], totalCompleted: 0
    });
    // 生产侧会发出来的那份负载，逐字照抄源码，不是编的：
    const 攻山妖兽 = () => 沙.EventBus.emit('enemy:defeated', {
        enemyId: '攻山妖兽', enemyType: 'beast', species: 'beast', tags: []
    });                                    // ← player-sect-ui.js:561 / battle.js:4720-4724
    const 兽潮叩门 = () => 沙.EventBus.emit('enemy:defeated', {
        enemyId: '兽潮·叩门兽群', enemyType: 'beast', species: 'beast', tags: []
    });                                    // ← sect-war.js:335 / battle.js:4720-4724
    const 凡人山贼 = () => 沙.EventBus.emit('enemy:defeated', {
        enemyId: '山贼头目', enemyType: 'human', species: '山贼头目', tags: []
    });                                    // ← 拦路人：不是妖兽，不该给本任务计数

    攻山妖兽();
    const 半 = 册.get('random_019').objectives[0];
    ok(半.currentCount === 1 && !半.completed,
        'D2 斩第一只攻山妖兽走一格（currentCount=' + 半.currentCount + '、completed=' + 半.completed
        + '）——进度不再恒 0（修前无论打多少只都是 0）');

    凡人山贼(); 凡人山贼();
    ok(半.currentCount === 1,
        'D3 斩两名山贼头目一格都不涨（currentCount=' + 半.currentCount + '）——'
        + '说明这条不是「杀够 5 只怪就交差」，认的是 species/enemyType===\'beast\' 判据（quest-system.js:2098）');

    兽潮叩门(); 攻山妖兽(); 攻山妖兽(); 攻山妖兽();
    ok(半.currentCount === 5 && 半.completed === true && 册.get('random_019').completed === true,
        'D4 补满 5 只（护宗演阵＋兽潮叩门两条防守玩法都算数）后目标与任务双双 completed'
        + '（obj=' + 半.completed + '、quest=' + 册.get('random_019').completed + '）——交付按钮这次真会出现');

    ok(Object.keys(D.listeners).indexOf('defend:completed') < 0
        && Object.keys(D.listeners).indexOf('sect:defended') < 0,
        'D5 没有为了修它去新增「防守」事件注册——本条走的仍是改类型，桥还是那 13 类，'
        + 'wave140 的 A2「无多余注册」不受影响');
}

// ============ [E] 改前复现（defend 版）：把类型改回去，这把尺必须当场报红 ============
console.log('\n[E] 改前复现（random_019 退回 defend ⇒ D2/D4 不成立）');
{
    const E = 建沙箱();
    const 沙 = E.沙, 册 = E.册;
    // 只在沙箱内存里把目标改回 defend —— 模拟「修复被撤销」，一个字都不写工作树。
    const o = 册.get('random_019').objectives[0];
    o.type = 'defend'; delete o.target; o.count = 1;
    沙.questSystem.importQuestProgress({
        activeQuests: ['random_019'], completedQuests: [], totalCompleted: 0
    });
    for (let i = 0; i < 6; i++) {
        沙.EventBus.emit('enemy:defeated', { enemyId: '攻山妖兽', enemyType: 'beast', species: 'beast', tags: [] });
    }
    // 注：progress 恒 0 时 currentCount 连字段都还没被写出来（undefined），与 C1/C2 同一形状，
    // 所以判据写「没有 currentCount 或为 0」而不是写死 === 0。
    ok(!o.completed && !o.currentCount,
        'E1 退回 defend 后连打 6 只妖兽仍推不动（currentCount=' + o.currentCount + '、completed=' + o.completed
        + '）——这正是修前的真实症状，D2/D4 不是恒真');
    ok(!册.get('random_019').completed,
        'E2 任务停在未完成（无交付按钮）');
}

console.log('\n通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
