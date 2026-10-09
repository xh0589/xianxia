/**
 * tests/quest-finale-ids-node.js
 * 主线终局并轨 + 秘境死 id（第一批 · 2026-10-05 实测定案）
 *
 * ── 一、三套结局，谁在何时给 ──────────────────────────────────────
 * 全部按 仙侠.html 真实 script 顺序 eval 352 个脚本实测（.scratch/docA-core-progress/_measure-core.cjs）：
 *
 *   套  定义处                        触发点                      mainQuestChain 位置      改不改世界
 *   ──  ───────────────────────────  ──────────────────────────  ─────────────────────  ──────────────────────────
 *   A   quest-system.js GAME_ENDINGS  turnInQuest('main_035')      数组第 20 / 面板第 33    ✗ 只弹屏 + 写账号级结局史
 *   B   dynasty-court.js onAscend     window.onAscension           与 A 同期（渡劫那一刻）   ✓ 国祚化香火 / 城望 / 国碎
 *   C   js/quest/qi-finale.js        main_056~058（需渡劫）        数组第 46~48（链尾）      ✓ restoreWorldQi + WorldJournal endgame
 *
 * 判定：**玩家走到头该看的是 C**（链尾 + 唯一真改世界 + 四结局互斥）。
 * A 在 C 前面 15 章就自称「结局·继续游戏」，B 又在渡劫那一刻另给一套 —— 这就是「连弹三套屏」。
 * 本批改法：A 降级为章节点过场（showChapterInterlude，中段给、明说「不是结局」、不入结局史）；
 *           B 与 C 互斥（onAscend 见 eventFlags.qi_ending）；
 *           C 独占真终局，判词屏挂在 C 账单页尾部**玩家点才弹**（showGrandVerdict），不自动叠。
 *
 * ── 二、死 id 的真相（与任务书前提不同，如实记） ────────────────────
 * 任务书写「main_021/main_027 写了 mountain/ruin，真动态秘境是 dgn_*，永远做不完」。
 * 实测**只对一半**：mountain/ruin 都在 app.js 的 DUNGEON_DEFS 里，app.js 也确实
 *   emit('dungeon:completed', {dungeonId:'mountain'})，事件桥按 obj.dungeon===data.dungeonId 判得中。
 * 病根在**入口**：全工程三处秘境入口（app.js:4478 建筑交互 / app.js:4716 interactBuilding /
 *   event-system.js:736 enterSecretRealm）全部硬写 openDungeonEntrance('ruin')，
 *   由 travel-system.js:131「发现遗迹」与 event-system.js:148「秘境之门」两条活路喂它。
 * ⇒ DUNGEON_DEFS 的 cave/mountain 曾是玩家永远进不去的死内容 ⇒ 指到它们的题（main_021 /
 *   npc_mysterious_02 / random_013）永远交不掉。main_027 指 ruin（可达），但 count:3 是无叙事
 *   依据的人为计数器，且走战斗通关那条路会吃 7 日灵气复涌冷却（app.js:10004）＝两周起步的死重。
 *
 * 【2026-10-05 补记·入口已开】上面那句「三处入口全部写死 ruin」已不成立：三座各开了自己的门
 *   （ruin＝奇遇「秘境之门」＋太虚山「上古遗迹」／cave＝野外图天然洞窟底下的裂口／
 *   mountain＝蓬莱仙岛「仙山秘境」）。本套的 A6/C1 两条断言当时把「cave/mountain 是死内容」
 *   当事实记着，故一并改成新事实（C1 的反例改用一个不存在的 id，A5 这把尺继续有牙）；
 *   扫描名单补上 js/map/randomMap.js——尺子漏掉它，cave 就会因为「不在名单里」而假装不可达。
 *
 * 本套件的 A/B 段把「可达集」从源码抽出来当尺子 —— 只判「id ⊆ DUNGEON_DEFS ∪ dgn 模板」是不够的，
 * 那个判据改前就是绿的（死 id 也全在那张表里）；真正抓得住的是**可达性**。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');

let passed = 0, failed = 0;
function ok(c, m) { if (c) { passed++; console.log('  ✓ ' + m); } else { failed++; console.log('  [FAIL] ' + m); } }
const load = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const src = rel => load(rel);

// ============ 源码抽尺：真秘境表 / 真可达集 ============
// DUNGEON_DEFS 是 app.js 的顶层 const（脚本作用域，不挂 window），只能从源码抽。
function 抽常驻秘境() {
    const s = src('js/app.js');
    const m = /const DUNGEON_DEFS = \{([\s\S]*?)\n\};/.exec(s);
    if (!m) return [];
    const ids = [];
    const re = /^\s{4}([A-Za-z_$][\w$]*):\s*\{\s*id:\s*'([^']+)'/gm;
    let r;
    while ((r = re.exec(m[1])) !== null) ids.push(r[2]);
    return ids;
}
// 可达集 = 全仓所有把字面量 id 交给 openDungeonEntrance / enterDungeon 的调用点。
// 这是「玩家点得到哪个按钮」的**唯一真源**。模板字符串里 `openDungeonEntrance('${def.id}')`
// 那一条是入口 modal 内部的「进入秘境」钮——它的上游必然是某个字面量调用点，不算独立入口，
// 故按含 `$`/`{` 剔掉（否则「可达集」会凭空多出一个没人能从面板点到的伪 id）。
function 抽可达秘境() {
    const ids = [];
    // js/map/randomMap.js 已列入：幽暗洞穴那扇门在野外图的天然洞窟底下（poiAction 'realm-cave'）。
    // 尺子要真的量可达性——漏掉它，cave 就会因为「不在扫描名单里」而假装不可达。
    const files = ['js/app.js', 'js/event-system.js', 'js/location-system.js', 'js/travel-system.js',
        'js/quest/quest-system.js', 'js/extensions/dungeon-dynamic.js', 'js/map/randomMap.js'];
    files.forEach(rel => {
        const s = src(rel);
        const re = /(?:openDungeonEntrance|enterDungeon)\(\s*'([^']+)'\s*\)/g;
        let r;
        while ((r = re.exec(s)) !== null) {
            if (/[\${}]/.test(r[1])) continue;   // 模板串，不是独立入口
            ids.push(r[1]);
        }
    });
    return Array.from(new Set(ids));
}
const 常驻秘境 = 抽常驻秘境();
const 可达秘境 = 抽可达秘境();

// ============ 沙箱 ============
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

function 建沙箱(装王朝, 装终幕) {
    const listeners = {};
    const 存 = {};
    const 弹层 = [];   // 只记真正的模态窗（.fixed 遮罩），style/head 追加不计
    const 沙 = {
        console: { log() {}, warn() {}, error() {} },
        setTimeout, clearTimeout,
        localStorage: {
            _d: 存,
            getItem(k) { return (k in 存) ? 存[k] : null; },
            setItem(k, v) { 存[k] = String(v); }, removeItem(k) { delete 存[k]; },
            clear() { for (const k in 存) delete 存[k]; },
        },
        saveToStorage: function (k, v) { try { 存[k] = String(v); return true; } catch (e) { return false; } },
        currentCharData: { name: '测', gender: 'male', realm: '大乘', layer: 1, sect: '散修', bonds: {}, _killCount: 0 },
        inventory: { slots: [], currency: { spiritStones: 999999 }, items: {} },
        // 交付要过 RewardService（quest-system.js giveQuestRewards：非空 rewards 必走它）
        RewardService: { apply: function () { return { success: true, messages: [] }; } },
        addReputationFromQuest: function () { return 0; },
        updateCurrencyUI() {}, updateCharacterStatus() {}, showEffect() {},
        removeQuestTargetMarkers() {}, syncQuestTargetMarkers() {},
        gameLog: { add() {} },
        msgs: [],
    };
    沙.showMessage = function (m, t) { 沙.msgs.push(String(m)); };
    沙.window = 沙; 沙.globalThis = 沙; 沙.global = 沙;
    沙.document = {
        getElementById: () => null, querySelector: () => 宽松(), querySelectorAll: () => [],
        createElement: () => {
            const el = 宽松();
            el.className = '';
            return el;
        },
        createDocumentFragment: () => 宽松(),
        body: { ...宽松(), insertAdjacentHTML(p, h) { 弹层.push(String(h)); } },
        head: 宽松(),
        documentElement: 宽松(),
        addEventListener() {}, removeEventListener() {},
    };
    // appendChild 只收 className 带 fixed 的（= 真模态窗）
    沙.document.body.appendChild = function (el) {
        if (el && typeof el.className === 'string' && el.className.indexOf('fixed') >= 0) 弹层.push(String(el.innerHTML || ''));
        return el;
    };
    沙.document.body.insertAdjacentHTML = function (p, h) { 弹层.push(String(h)); };
    沙.EventBus = {
        on(type, fn) { (listeners[type] = listeners[type] || []).push(fn); },
        emit(type, data) { (listeners[type] || []).forEach(fn => fn(data)); },
    };
    vm.createContext(沙);
    vm.runInContext(load('js/quest/quest-system.js'), 沙, { filename: 'js/quest/quest-system.js' });
    vm.runInContext('updateQuestUI = function () {}; updateQuestTracker = function () {}; updateMainQuestUI = function () {}; updateDailyQuestUI = function () {}; updateRandomQuestUI = function () {}; updateNpcQuestUI = function () {};', 沙);
    // ⚠️ 不要覆盖 window.mainQuestChain / window.allQuests：quest-system.js:343-344 自己挂了真身
    // （main_001~005 在 quest-system.js 内，main_021~035 由 12-quest-extensions push 进来）。
    // 覆成空数组会把 18 条主线悄悄弄丢——本套件 D 段要靠主线数把 checkEndingCondition 顶到阈值。
    沙.QuestRegistry.registerMany = function (list) { (list || []).forEach(q => 沙.QuestRegistry.register(q)); };
    vm.runInContext(load('js/items-extended/12-quest-extensions.js'), 沙, { filename: 'js/items-extended/12-quest-extensions.js' });
    if (装王朝) {
        沙.GrandLegacy = { state: () => ({ emperor: { dynasty: '大衍', city: '帝都·长安' } }) };
        沙.showConfirm = () => Promise.resolve(false);
        vm.runInContext(load('js/dynasty-court.js'), 沙, { filename: 'js/dynasty-court.js' });
    }
    if (装终幕) {
        // qi-finale 是自足 IIFE（只读 window），单挂它即可验账单页与判词钮
        沙.npcManager = { getNPC: () => ({ name: '阿蘅' }) };
        vm.runInContext(load('js/quest/qi-finale.js'), 沙, { filename: 'js/quest/qi-finale.js' });
    }
    return { 沙, listeners, 册: 沙.QuestRegistry, 弹层, 存 };
}

// 把一条任务推到「可交付」，并真的交掉（不含奖励失败的分支）
function 交掉(沙, id) {
    const q = 沙.QuestRegistry.get(id);
    if (!q) return false;
    沙.acceptQuest(id);
    (q.objectives || []).forEach(o => { o.completed = true; o.currentCount = o.count; });
    q.completed = true;
    return !!沙.turnInQuest(id);
}
// 主线交够 N 条，让 checkEndingCondition 判得出结局
function 交够主线(沙, 正则) {
    const ids = (沙.mainQuestChain || []).map(q => q.id).filter(id => 正则.test(id));
    let n = 0;
    ids.forEach(id => { if (交掉(沙, id)) n++; });
    return n;
}

console.log('\n========== 主线终局并轨 + 秘境死 id ==========');

// ══════════════════ [A] 秘境 id 普查：⊆（DUNGEON_DEFS ∪ dgn 模板） ══════════════════
console.log('\n[A] 秘境 id 普查：引用的 id 必须在真表里，且必须**玩家进得去**');
{
    const A = 建沙箱(false);
    const dgn = (A.沙.DungeonDynamic && A.沙.DungeonDynamic.DUNGEON_TEMPLATES) || null;
    // 动态秘境模板：只从源码抽（sandbox 里 DungeonDynamic 不在），并且它们 emit 的是
    // 'dungeon:dynamic:complete'（dungeon-dynamic.js:328），**不是** 'dungeon:completed'
    // ⇒ quest-system.js 的桥根本听不见 ⇒ 指到 dgn_* 的题一定推不动。这一点单独断言。
    const dd = src('js/extensions/dungeon-dynamic.js');
    const dgnIds = [];
    const re = /\{ id:'(dgn_[^']+)'/g;
    let r;
    while ((r = re.exec(dd)) !== null) dgnIds.push(r[1]);

    const 真表 = 常驻秘境.concat(dgnIds);
    ok(常驻秘境.length === 3 && 常驻秘境.indexOf('ruin') >= 0,
        'A1 从 app.js 源码抽到 DUNGEON_DEFS ＝ ' + JSON.stringify(常驻秘境) + '（真表 3 座）');
    ok(dgnIds.length === 12,
        'A2 从 dungeon-dynamic.js 抽到动态秘境模板 ' + dgnIds.length + ' 座（dgn_*）');
    ok(dd.indexOf("emit('dungeon:dynamic:complete'") >= 0 && src('js/quest/quest-system.js').indexOf("'dungeon:completed'") >= 0,
        'A3 动态秘境走的是 dungeon:dynamic:complete，任务桥听的是 dungeon:completed —— '
        + '两条事件不同名，所以**任何任务的秘境目标都不能指 dgn_***（本批没指，这是读出来的规矩不是猜的）');

    // 全任务册（主线 + 随机 + NPC 故事线）里所有 explore / explore_dungeon 目标
    const 引用 = [];
    (A.沙.allQuests || []).forEach(q => (q.objectives || []).forEach(o => {
        if (o && (o.type === 'explore' || o.type === 'explore_dungeon') && (o.dungeon || o.dungeonId)) {
            引用.push({ id: q.id, type: q.type, did: o.dungeon || o.dungeonId });
        }
    }));
    const 不在表 = 引用.filter(x => 真表.indexOf(x.did) < 0);
    ok(不在表.length === 0,
        'A4 全任务册 ' + 引用.length + ' 条带秘境名的目标，id 全部落在（DUNGEON_DEFS ∪ dgn 模板）里'
        + (不在表.length ? '（不在表: ' + 不在表.map(x => x.id + '→' + x.did).join('、') + '）' : ''));

    // ★真正的尺子：可达性。改前 main_021 指 mountain（真表里有、玩家进不去），
    // 上面 A4 是绿的，本条是红的。
    const 不可达 = 引用.filter(x => 可达秘境.indexOf(x.did) < 0);
    ok(可达秘境.length > 0 && 不可达.length === 0,
        'A5 ★可达性：' + 引用.length + ' 条秘境目标指向的秘境，玩家点得到入口（可达集＝'
        + JSON.stringify(可达秘境) + '）'
        + (不可达.length ? '（进不去: ' + 不可达.map(x => x.id + '→' + x.did).join('、') + '）' : ''));
    ok(可达秘境.length >= 常驻秘境.length
        && 常驻秘境.every(id => 可达秘境.indexOf(id) >= 0),
        'A6 记档：常驻 ' + 常驻秘境.length + ' 座现在**每一座**都有玩家点得到的入口（可达集＝'
        + JSON.stringify(可达秘境) + '）——'
        + 'ruin＝奇遇「秘境之门」＋太虚山「上古遗迹」；cave＝野外图天然洞窟底下的裂口；'
        + 'mountain＝蓬莱仙岛「仙山秘境」。三座各一扇门，不挤在同一块石头上。'
        + '（改前这条记的是相反的事实：三处入口全写死 ruin，cave/mountain 是玩家进不去的死内容。）');
}

// ══════════════════ [B] 那两章目标可完成 ══════════════════
console.log('\n[B] main_021 / main_027：mock 秘境进度后 turnIn 为真');
{
    const B = 建沙箱(false);
    const 沙 = B.沙, 册 = B.册;
    const 两章 = ['main_021', 'main_027'];
    const 半 = {};
    两章.forEach(id => {
        const q = 册.get(id);
        ok(!!q && q.objectives[0].type === 'explore_dungeon',
            'B0 ' + id + '「' + (q ? q.title : '缺题') + '」在真册里，目标类型 explore_dungeon');
        半[id] = q ? q.objectives[0] : null;
    });
    ok(半.main_021 && 半.main_021.dungeon === 'ruin',
        'B1 main_021 目标秘境＝ ruin（上古遗迹。改前是 mountain：那张表里有，但全工程三处入口都写死 ruin，玩家进不去）');
    ok(半.main_027 && 半.main_027.dungeon === 'ruin' && 半.main_027.count === 1,
        'B2 main_027 目标秘境＝ ruin ×1（改前 ruin ×3：同一座五层秘境连刷三趟是人为计数器，'
        + '且走战斗通关那条路会吃 7 日灵气复涌冷却，合计两周起步）');

    两章.forEach(id => {
        沙.acceptQuest(id);
        const o = 册.get(id).objectives[0];
        // 生产侧那次事件：app.js:10343 emit('dungeon:completed', {dungeonId, dungeonName})
        沙.EventBus.emit('dungeon:completed', { dungeonId: o.dungeon, dungeonName: '上古遗迹' });
    });
    ok(两章.every(id => 册.get(id).objectives[0].completed === true),
        'B3 两章目标都真推进到 completed（走的是桥自己注册的 listener，不是抄一份判定）');
    ok(两章.every(id => 册.get(id).completed === true),
        'B4 两章任务都升 completed（升 completed 才有交付按钮——这正是改前玩家永远看不到的那一步）');

    const 交一 = 沙.turnInQuest('main_021');
    const 交二 = 沙.turnInQuest('main_027');
    ok(交一 === true && 交二 === true,
        'B5 turnInQuest 两章都返回 true（实得 ' + 交一 + ' / ' + 交二 + '）——目标可完成，交得掉');
    ok((册.get('main_021').turnedIn === true) && (册.get('main_027').turnedIn === true),
        'B6 两章都真进了「已交付」态（不是只点了按钮）');
    // 注意 getCompletedQuests() 的口径是「已完成但**未**交付」（quest-system.js:1352-1365），
    // 交付过的题按设计就不在里面了 —— 要读真账得读进度快照的 completedQuests。
    const 账 = (沙.questSystem.getQuestProgressSnapshot().completedQuests) || [];
    ok(账.indexOf('main_021') >= 0 && 账.indexOf('main_027') >= 0,
        'B7 两章都进了 playerQuestProgress.completedQuests 账（真账实到 ' + 账.length + ' 条）');
}

// ══════════════════ [C] 改前复现：把死 id 写回去，这把尺当场报红 ══════════════════
console.log('\n[C] 改前复现（把目标改指一座**不存在**的秘境 ⇒ A5/C1 红）');
{
    // 只在沙箱内存里改 —— 一个字都不写工作树。
    // 复现用的 id 从 'mountain' 换成 'nowhere_realm'：三座都开门之后 mountain 已不是死 id，
    // 再拿它当反例就变成恒真。用一个压根不存在的 id，A5 这把尺才继续有牙。
    const A2 = 建沙箱(false);
    const 半 = A2.册.get('main_021').objectives[0];
    半.dungeon = 'nowhere_realm';
    ok(可达秘境.indexOf('nowhere_realm') < 0,
        'C1 编出来的死 id 确实不在可达集内（可达集＝' + JSON.stringify(可达秘境) + '）——A5 不是恒真');
    // 桥层面它其实判得中（emit 侧确实会发这个 id）——但玩家发不出来，因为没有这么一座秘境。
    A2.沙.acceptQuest('main_021');
    A2.沙.EventBus.emit('dungeon:completed', { dungeonId: 'nowhere_realm', dungeonName: '不存在的秘境' });
    ok(A2.册.get('main_021').objectives[0].completed === true,
        'C2 诚实记一条反直觉事实：桥层面不存在的 id 也判得中（emit 侧确实会发这个名字），'
        + '所以「id 对不上真表」这个说法不准确——死因是**入口**，不是 id。'
        + '正因如此 A5 才必须单独立一条可达性尺子，否则这条缺陷永远测不出来');
    // 工作树 byte-level 复核：真册里已无 mountain/cave 目标
    const W = 建沙箱(false);
    const 死id = [];
    ['main_021', 'main_027', 'npc_mysterious_02', 'random_013'].forEach(id => {
        const q = W.册.get(id);
        if (q) (q.objectives || []).forEach(o => {
            const d = o.dungeon || o.dungeonId;
            if (d && 可达秘境.indexOf(d) < 0) 死id.push(id + '→' + d);
        });
    });
    ok(死id.length === 0,
        'C3 工作树复核：这四条目标全部指向可达秘境'
        + (死id.length ? '（仍有死 id: ' + 死id.join('、') + '）' : ''));
}

// ══════════════════ [D] 交 main_035 不再弹第二套世界终局 ══════════════════
console.log('\n[D] 交 main_035（灵气之尽未决）＝章节点过场，不是「游戏结束」');
{
    const D = 建沙箱(false);
    const 沙 = D.沙, 册 = D.册;
    // 先把主线账铺到阈值前一条（**不含 main_035 本身**——它要单独交，好观察交付那一刻弹了什么）。
    // 走 importQuestProgress 而不是一条条真交：沙箱只挂了 quest-system + 12-quest-extensions，
    // main_006~018 住在 main-storyline-arc.js 里（未挂），真交只能交到 13 条，够不到 20 线。
    // 这里要验的是「交付那一刻弹不弹结局屏」，与前 19 条怎么来的无关 —— 账是真的就够。
    const 链 = (沙.mainQuestChain || []).map(q => q.id);
    const 前段 = 链.filter(id => id !== 'main_035');
    ok(前段.length >= 19, 'D1 沙箱真链上有 ' + 前段.length + ' 条 main_*（不含 main_035）');
    沙.questSystem.importQuestProgress({
        activeQuests: [], completedQuests: 前段, totalCompleted: 前段.length
    });
    const 判词前 = 沙.checkEndingCondition();
    ok(判词前 === null,
        'D2 交完前 ' + 前段.length + ' 条时 checkEndingCondition＝null（阈值是 20，' + 前段.length + ' 还差一条）——'
        + '如实记这条：改前的 allCompleted 门槛同样是 20，本段没动它（v24.6-endings-revive 的 B2~B4 依赖它）；'
        + '交 main_035 那一刻正好越过（见 D3b）');

    // 桩掉 showEndingScreen：数它被调了几次
    let 真结局屏 = 0;
    const 真身 = 沙.showEndingScreen;
    沙.showEndingScreen = function () { 真结局屏++; return 真身.apply(this, arguments); };
    // 桩掉 setTimeout 让 main_035 的 500ms 钩子当场跑（沙箱里 setTimeout 是真定时器，等不起）
    const 定时 = 沙.setTimeout;
    沙.setTimeout = function (fn) { if (typeof fn === 'function') { fn(); return 0; } return 定时(fn); };

    const b0 = D.弹层.length;
    ok(册.get('main_035') && 交掉(沙, 'main_035') === true, 'D3 交 main_035「渡劫飞升」成功');
    const 判词2 = 沙.checkEndingCondition();
    const 新弹 = D.弹层.slice(b0);
    const 新屏 = 新弹.join('|');
    ok(!!判词2, 'D3b 交付那一刻 checkEndingCondition 判出「' + 判词2 + '」（判词有内容，过场才有东西可给）');

    ok(真结局屏 === 0,
        'D4 ★交 main_035 一次也没有调 showEndingScreen（计数＝' + 真结局屏 + '）——'
        + '改前这里直接弹【飞升成仙】并自称「游戏结束」，而它身后还压着 15 章（含真终局 main_056~058）');
    ok(沙.showGrandVerdict() === false,
        'D5 ★灵气之尽未决时，终局判词口 showGrandVerdict() 拒绝发（返 false，不弹第二套世界终局）');
    ok(D.弹层.length === b0 + 1,
        'D6 交 main_035 只弹一层（新增 ' + (D.弹层.length - b0) + ' 层）——是一页过场，不是结局屏');
    ok(新屏.indexOf('这是判词，不是结局') >= 0 && 新屏.indexOf('渡劫之前') >= 0,
        'D7 那一页明说「这是判词，不是结局」，标题是「渡劫之前 · 一页判词」');
    ok(新屏.indexOf('继续游戏') < 0 && 新屏.indexOf('游戏结束') < 0,
        'D8 那一页里既无「继续游戏」也无「游戏结束」——中段不许出现这两句');
    ok(新屏.indexOf('天界之门为你敞开') >= 0 || 新屏.indexOf('邪派') >= 0,
        'D9 GAME_ENDINGS 的判词正文一个字没删（仍能在过场里读到 ascension 那段原文）');
    ok(D.存['xianxia_endings'] === undefined,
        'D10 中段过场不写 xianxia_endings（那本账是结局史，一页过场混进去会把结局史洗成假的）');
    沙.setTimeout = 定时;

    // 改前对照：直接调 showEndingScreen（改前 main_035 走的就是这条）——必须真的弹 + 真的写结局史
    沙.showEndingScreen(判词2);
    ok(真结局屏 === 1 && (D.存['xianxia_endings'] || '').indexOf('endingId') >= 0,
        'D11 改前对照：旧路径（直接调 showEndingScreen）确实弹屏且写结局史——D4/D10 不是恒真');
}

// ══════════════════ [E] 灵气之尽是真终局：判词只在它落定后给，且只给一次 ══════════════════
console.log('\n[E] 灵气之尽落定 ⇒ 真终局独占判词，中段过场闭嘴，且不连弹');
{
    const E = 建沙箱(false);
    const 沙 = E.沙;
    交够主线(沙, /^main_0(0[1-9]|1[0-8]|2[1-9]|3[0-5])$/);
    沙.eventFlags = 沙.eventFlags || {};

    const b1 = E.弹层.length;
    沙.eventFlags['qi_ending'] = 'slay';
    ok(沙.qiFinaleDecided() === true, 'E1 qi_ending 落定 ⇒ qiFinaleDecided() 为真');
    ok(沙.showChapterInterlude('ascension') === false && E.弹层.length === b1,
        'E2 中段过场闭嘴（返 false、零弹层）——同一生不给两次判词');
    const b2 = E.弹层.length;
    ok(沙.showGrandVerdict() === true && E.弹层.length === b2 + 1,
        'E3 真终局判词这才给（返 true、弹一层）');
    ok(E.弹层[E.弹层.length - 1].indexOf('收下这一页') >= 0,
        'E4 判词屏按钮是「收下这一页」，不是「继续游戏」');
    const b3 = E.弹层.length;
    ok(沙.showGrandVerdict() === false && E.弹层.length === b3,
        'E5 一次性闸：再点一次返 false、零弹层（回望走 C 账单页，不重复弹）');
}

// ══════════════════ [F] 判词挂在 C 账单页尾部：玩家点才弹，不自动叠 ══════════════════
console.log('\n[F] qi-finale 账单页挂判词钮（这是「不连弹三套屏」的关键）');
{
    const F = 建沙箱(false, true);
    const 沙 = F.沙;
    沙.eventFlags = { qi_ending: 'ferry', qi_route: 'oppose' };
    const b = F.弹层.length;
    沙.qiShowEndingPage();
    const 页 = F.弹层.slice(b).join('|');
    ok(F.弹层.length === b + 1, 'F1 qiShowEndingPage 只弹一层（账单页本体）');
    ok(页.indexOf('这一生的判词') >= 0,
        'F2 账单页尾部挂了「这一生的判词」按钮');
    ok(页.indexOf('合上账单') >= 0 && 页.indexOf('灵气之尽') >= 0,
        'F3 账单页本体一字未动（合上账单 + 灵气之尽标题都在）——判词是加进去的一节，不是替换');
    ok(!/showGrandVerdict\(\)/.test(页) || 页.indexOf('onclick="window.showGrandVerdict()"') >= 0,
        'F4 判词钮是 onclick 手动触发（页面上没有自动调 showGrandVerdict 的语句）⇒ 不叠屏');
    // 文本纪律：判词钮文案不含外文字母
    const 钮文案 = (/<button onclick="window\.showGrandVerdict\(\)"[^>]*>([^<]*)<\/button>/.exec(页) || [, ''])[1];
    ok(!/[A-Za-z]/.test(钮文案), 'F5 玩家可见判词钮文案零外文字母（实得「' + 钮文案 + '」）');
}

// ══════════════════ [G] 三套结局互斥矩阵 ══════════════════
console.log('\n[G] 三套结局互斥：朝政（B）与灵气之尽（C）只活一套');
{
    const G = 建沙箱(true);
    const 沙 = G.沙;
    沙.eventFlags = {};

    // 未落定：B 照旧走它那三笔（举国飞升 / 禅位太子 / 天下鼎沸）
    沙.DynastyCourt._reset(); 沙.DynastyCourt.initCourt();
    沙.DynastyCourt.onAscend();
    const 未落 = 沙.DynastyCourt.state().ending;
    ok(['ascend', 'abdicate', 'collapse'].indexOf(未落) >= 0,
        'G1 改前对照：灵气之尽未落定时，朝政仍走原三笔（ending＝' + 未落 + '）——本批没削它的正文');

    // 已落定：B 只留末页一笔，不再叠一套终局
    沙.eventFlags['qi_ending'] = 'slay';
    沙.DynastyCourt._reset(); 沙.DynastyCourt.initCourt();
    const b = G.弹层.length;
    沙.DynastyCourt.onAscend();
    const 已落 = 沙.DynastyCourt.state().ending;
    ok(已落 === 'qi', 'G2 灵气之尽落定后，朝政落 \'qi\'（ending＝' + 已落 + '），不再走 ascend/abdicate/collapse');
    ok(G.弹层.length === b, 'G3 朝政这一笔不弹屏（只写纪年与大事记）——B 本来就不弹，这是回归护栏');
    // 'qi' 必须进 _import 白名单，否则读档洗掉末页、dailyTick 又开始过账
    ok(沙.DynastyCourt.state().ending === 'qi'
        && src('js/dynasty-court.js').indexOf("['ascend', 'abdicate', 'collapse', 'qi']") >= 0,
        'G4 \'qi\' 进了 _import 白名单（读档后末页不丢，「翻到末页就不再过账」才继续成立）');
    ok(src('js/dynasty-court.js').indexOf("e === 'qi' ? '另有一本更大的账'") >= 0,
        'G5 endingName 认识 \'qi\'（面板上的【终局：…】有话可说，不会印空白）');

    // A 与 C 互斥已在 E2 验过；这里补一条「A 与 B 也不再叠」的读账断言：
    // main_035 的过场不写结局史 ⇒ 一生只有真终局那一页进 xianxia_endings。
    const H = 建沙箱(false);
    交够主线(H.沙, /^main_0(0[1-9]|1[0-8]|2[1-9]|3[0-5])$/);
    H.沙.eventFlags = {};
    H.沙.showChapterInterlude('ascension');
    ok(H.存['xianxia_endings'] === undefined,
        'G6 一生只有真终局那一页进 xianxia_endings（中段过场与朝政都不写）——旧五结局不再自己往结局史里塞');
}

// ══════════════════ [H] 回归清单接线 ══════════════════
console.log('\n[H] 接线与源码棘轮');
{
    ok(load('tests/run-all.sh').indexOf('quest-finale-ids-node.js') >= 0,
        'H1 本套件已入 tests/run-all.sh');
    const qs = src('js/quest/quest-system.js');
    ok(/questId === 'main_035'/.test(qs) && /checkEndingCondition\(\)/.test(qs),
        'H2 触发链棘轮仍在账：交 main_035 → checkEndingCondition（v24.6-endings-revive 的 A2 依赖这两枚）');
    ok(qs.indexOf('showChapterInterlude') >= 0 && qs.indexOf('showGrandVerdict') >= 0,
        'H3 三出口分权在账（showEndingScreen / showChapterInterlude / showGrandVerdict）');
    ok(Object.keys(load('js/quest/quest-system.js') && src('js/quest/quest-system.js').match(/GAME_ENDINGS = \{[\s\S]*?\n\};/g)[0].match(/^\s{4}(\w+):/gm) || []).length === 5,
        'H4 GAME_ENDINGS 五条判词一条没删（判词文本全在，只是改了它在叙事里的身份）');
    const qe = src('js/quest/qi-finale.js');
    ok(qe.indexOf('showGrandVerdict') >= 0 && qe.indexOf('qiEndingDirect') >= 0,
        'H5 真终局（qi-finale）持有判词入口——「玩家走到头该看的那一套」只有它');
    ok(qe.indexOf('这一生的判词') >= 0 && qe.indexOf('合上账单') >= 0,
        'H6 判词钮加在 C 的账单页尾部，与「合上账单」并存');
}

console.log('\n通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);