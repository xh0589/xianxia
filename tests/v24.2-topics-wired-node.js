/**
 * ==================== v24.2 topics 接线验收 ====================
 * 病（v24.0 审计点名「dialogueTree.topics 子系统未接通」）：
 *   数据文件把 457 句专属台词写在 dialogueTree.topics.<key> 下（gossip/personal/…），
 *   唯一消费点却拿 UI 分类名（topics/intel/…）去查表——两套命名永远对不上，
 *   永远 miss 永远走通用兜底池；topicRequirements 的 59 道门槛全库无人问过，
 *   getAvailableTopics() 零调用方。C4 十人池 104 句玩家一句听不到。
 * 修（js/npcs/npc-system.js 四处）：
 *   ① DATA_TOPIC_UI + getNpcDataTopics()：数据键钉上中文牌面，greeting 不掺和；
 *   ② showSubCategoryDialog：「📖 话题」下按 NPC 动态列「TA尤其想与你聊的」（dt_* 选项）；
 *   ③ executeDeepTalkSubOption：dt_* 就地造等价选项（minAffection 取 topicRequirements），
 *      消费点改按数据键取句 + FIXED_SUBOPTION_TOPIC 语义映射 + 借池过门槛 + warm 池投用；
 *   ④ showNPCDialog 分类计数把数据话题算上。
 * 运行：node tests/v24.2-topics-wired-node.js
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
function eq(a, b, msg) { assert(a === b, msg + '（实际=' + JSON.stringify(a) + ' 期望=' + JSON.stringify(b) + '）'); }
function load(rel) {
    vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel });
}
function src(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ============ A 源码接线 ============
console.log('--- A 源码接线 ---');
(function () {
    var ns = src('js/npcs/npc-system.js');
    assert(ns.indexOf('const DATA_TOPIC_UI = {') >= 0, 'A1 数据话题牌面表就位');
    var keys = ['gossip', 'personal', 'cultivation', 'sect', 'market', 'dungeon', 'quest'];
    assert(keys.every(function (k) { return new RegExp('^\\s{4}' + k + ':\\s+\\{ icon:', 'm').test(ns); }),
        'A2 七个数据键全有中文牌面（greeting 刻意不列——那是问候路径的地盘）');
    assert(ns.indexOf("const FIXED_SUBOPTION_TOPIC = {") >= 0 &&
        ns.indexOf("'intel:gossip': 'gossip'") >= 0 &&
        ns.indexOf("'topics:history': 'personal'") >= 0 &&
        ns.indexOf("'cultivation_guidance:insight_share': 'cultivation'") >= 0,
        'A3 固定子选项→数据话题的语义映射表就位');
    assert(/function getNpcDataTopics\(npc\)[\s\S]{0,700}if \(key === 'greeting'\) continue;/.test(ns),
        'A4 getNpcDataTopics 跳过 greeting、只收有句子的键');
    assert(/getNpcDataTopics[\s\S]{0,900}topicRequirements \|\| \{\}/.test(ns) &&
        /minAffection: typeof req\.minAffection === 'number'/.test(ns),
        'A5 门槛取自 topicRequirements（缺省 0）');
    assert(ns.indexOf('topics?.[categoryId]?.all') < 0,
        'A6 棘轮：旧断链写法 topics?.[categoryId] 不许回来（UI 分类名查数据键＝永远 miss）');
    assert(/if \(!subOption && categoryId === 'topics' && String\(subOptionId\)\.indexOf\('dt_'\) === 0\)[\s\S]{0,400}minAffection: dataTopic\.minAffection/.test(ns),
        'A7 executeDeepTalkSubOption 认 dt_*：就地造等价选项，门槛原样带入（v14.6 可点但有代价照旧）');
    assert(/var topicGate = npc\.dialogueTree\?\.topicRequirements\?\.\[topicKey\];[\s\S]{0,200}customDialogue = null;/.test(ns),
        'A8 固定子选项借池要过数据门槛：好感不够退回通用池');
    assert(/dataTopic\.warm && aff >= 60 && Math\.random\(\) < 0\.5/.test(ns),
        'A9 warm 池首次投用：知己（60）以上一半机会说体己话');
    assert(/if \(categoryId === 'topics'\) \{[\s\S]{0,300}getNpcDataTopics\(npc\)[\s\S]{0,900}TA尤其想与你聊的/.test(ns),
        'A10 「📖 话题」子分类动态列数据话题');
    assert(/dtWarn/.test(ns) && /⚠' \+ \(dtp\.minAffection \? -Math\.floor\(dtp\.minAffection \/ 10\) : -2\)/.test(ns),
        'A11 锁着的话题挂 v14.6 同款琥珀角标（负号只留一个，NEW-18 的教训不重犯）');
    assert(/const nSub = cat\.id === 'topics' \? cat\.subOptions\.length \+ getNpcDataTopics\(npc\)\.length/.test(ns),
        'A12 主面板「话题」项计数把数据话题算上（不许看着 7 项点进去一堆）');
})();

// ============ 测试桩（照 wave95 手法） ============
global.window = global;
var modalSlot = null;
function fakeEl(tag) {
    var el = {
        tag: tag || '', children: [], style: {}, parentNode: null, dataset: {},
        setAttribute: function () {}, getAttribute: function () { return null; },
        appendChild: function (c) { this.children.push(c); return c; },
        removeChild: function () {},
        remove: function () { if (modalSlot === el) modalSlot = null; },
        addEventListener: function () {}, removeEventListener: function () {},
        dispatchEvent: function () {},
        closest: function () { return null; }, scrollIntoView: function () {},
        getBoundingClientRect: function () { return { left: 0, top: 0, width: 0, height: 0 }; },
        querySelector: function () { return null; }, querySelectorAll: function () { return []; },
        classList: { add: function () {}, remove: function () {}, toggle: function () {}, contains: function () { return false; } },
        _html: '', textContent: '', options: []
    };
    Object.defineProperty(el, 'innerHTML', {
        get: function () { return this._html; },
        set: function (v) { this._html = String(v); },
        configurable: true
    });
    return el;
}
global.document = {
    readyState: 'complete',
    createElement: function (tag) { return fakeEl(tag); },
    createElementNS: function (ns, tag) { return fakeEl(tag); },
    getElementById: function () { return fakeEl(); },
    querySelector: function (sel) { return sel === '.npc-dialog-modal' ? modalSlot : null; },
    querySelectorAll: function () { return []; },
    addEventListener: function () {},
    body: { appendChild: function (el) { modalSlot = el; } }
};
var store = {};
global.localStorage = {
    getItem: function (k) { return store[k] !== undefined ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; }
};
var msgs = [];
global.showMessage = function (m, t) { msgs.push({ m: String(m), t: t }); };
global.gameLog = { entries: [], add: function () {} };
global.timeSystem = {
    gameTime: { totalMinutes: 57140, currentDay: 40, currentHour: 12, currentMinute: 0 },
    getAbsoluteDay: function () { return this.gameTime.currentDay; },
    advanceTime: function () {},
    onNewDaySubscribe: function () {}
};
global.currentCharData = { name: '玩家', location: '金城', realm: '金丹', layer: 1 };
global.discipleState = null;
global.itemById = {};
global.setTimeout = function () { return 0; };
global.setInterval = function () { return 0; };
global.clearInterval = function () {};
global.clearTimeout = function () {};
global.locationSystem = { cityData: { '金城': {}, '洛水城': {} } };
global.sectsData = { '少林寺': {}, '华山派': {} };

var origRnd = Math.random;
function stubRnd(v) { Math.random = function () { return v; }; }
function restoreRnd() { Math.random = origRnd; }

// ============ 装载：数据文件 + 被测模块 ============
load('js/npcs/special-npcs.js');
load('js/npcs/city-residents-data.js');
load('js/npcs/city-residents-data2.js');
load('js/npcs/npc-system.js');

var NPC = global.NPC;
var npcManager = new global.NPCManager();
global.npcManager = npcManager;

// ============ B 数据面：句数、门槛、牌面覆盖 ============
console.log('--- B 数据面 ---');
(function () {
    var pools = [window.SPECIAL_NPC_DATA || {}, (window.CITY_RESIDENT_DATA && window.CITY_RESIDENT_DATA.npcs) || {}];
    var allKeys = {}, totalLines = 0, totalGates = 0, labelMissing = [];
    var UI_KEYS = ['gossip', 'personal', 'cultivation', 'sect', 'market', 'dungeon', 'quest', 'greeting'];
    pools.forEach(function (pool) {
        Object.keys(pool).forEach(function (id) {
            var tree = pool[id] && pool[id].dialogueTree;
            if (!tree || !tree.topics) return;
            Object.keys(tree.topics).forEach(function (k) {
                var n = (tree.topics[k] && tree.topics[k].all || []).length;
                if (!n) return;
                allKeys[k] = (allKeys[k] || 0) + n;
                if (k !== 'greeting') totalLines += n;
                if (UI_KEYS.indexOf(k) < 0) labelMissing.push(id + ':' + k);
            });
            if (tree.topicRequirements) totalGates += Object.keys(tree.topicRequirements).length;
        });
    });
    eq(labelMissing.length, 0, 'B1 数据里出现的话题键全部在牌面表内（没有裸英文键漏网）：' + Object.keys(allKeys).join('、'));
    assert(totalLines >= 430, 'B2 可上桌的专属台词（除 greeting）共 ' + totalLines + ' 句，≥430（接线前玩家能听到 0 句）');
    assert(totalGates >= 55, 'B3 topicRequirements 门槛共 ' + totalGates + ' 道，≥55（接线前无人问过）');
    var mentorGossip = window.SPECIAL_NPC_DATA.mentor_01.dialogueTree.topics.gossip.all;
    assert(mentorGossip.length === 13 && mentorGossip.some(function (s) { return s.indexOf('晨课的钟听过没有') >= 0; }),
        'B4 C4 十人池样本在账：清虚道人 13 句街谈巷议（含「晨课的钟」）');
})();

// ============ C 行为面 ============
console.log('--- C 行为面 ---');
function 造NPC(id, data, locOverride) {
    var n = new NPC(id, data.name, {
        occupation: data.occupation, gender: data.gender,
        location: locOverride || '金城',
        dialogueTree: data.dialogueTree
    });
    npcManager.addNPC(n);
    return n;
}
function 重置话账() { global.currentCharData._deepTalkLog = {}; }
function 弹层HTML() { return modalSlot ? modalSlot.innerHTML : ''; }
function 说过(池, html) {
    return 池.some(function (s) { return html.indexOf(s.replace(/{playerName}/g, '玩家')) >= 0; });
}

var mentor = 造NPC('mentor_01', window.SPECIAL_NPC_DATA.mentor_01);
var tieshen = 造NPC('cres_帝都·长安_1', window.CITY_RESIDENT_DATA.npcs['cres_帝都·长安_1']);

// C1~C2 数据话题清单
(function () {
    var topics = global.getNpcDataTopics ? global.getNpcDataTopics(mentor) : null;
    // getNpcDataTopics 是模块内函数，未导出——从 window 抓不到就借 executeDeepTalkSubOption 的行为验（C3 起）
    if (typeof global.getNpcDataTopics === 'function') {
        var keys = topics.map(function (t) { return t.key; });
        assert(keys.indexOf('gossip') >= 0 && keys.indexOf('personal') >= 0, 'C1 清虚道人的数据话题上桌（gossip/personal 在列）');
        assert(keys.indexOf('greeting') < 0, 'C2 greeting 不掺和深谈（问候路径的地盘）');
        var pers = topics.filter(function (t) { return t.key === 'personal'; })[0];
        eq(pers.minAffection, 40, 'C2b personal 门槛 40 取自 topicRequirements');
    } else {
        assert(true, 'C1 （getNpcDataTopics 未导出，跳过清单断言，由 C3+ 行为兜底）');
        assert(true, 'C2 （同上）');
    }
})();

// C3 dt_gossip 真说数据里的句子
(function () {
    重置话账(); modalSlot = null;
    mentor.relationship.affection = 0;
    global.executeDeepTalkSubOption('mentor_01', 'topics', 'dt_gossip');
    var html = 弹层HTML();
    var 池 = window.SPECIAL_NPC_DATA.mentor_01.dialogueTree.topics.gossip.all;
    assert(说过(池, html), 'C3 dt_gossip 听到的是清虚道人自己的 13 句（接线前永远通用兜底）');
    assert(html.indexOf('{playerName}') < 0, 'C3b 占位符已替换成玩家名');
})();

// C4 门槛锁着：好感不足走 v14.6 代价路径，数据句不许漏出
(function () {
    重置话账(); modalSlot = null;
    mentor.relationship.affection = 0;
    global.executeDeepTalkSubOption('mentor_01', 'topics', 'dt_personal');
    var html = 弹层HTML();
    var 池 = window.SPECIAL_NPC_DATA.mentor_01.dialogueTree.topics.personal.all;
    assert(!说过(池, html), 'C4 好感 0 强开 personal（门槛40）：数据句没漏出');
    assert(mentor.relationship.affection < 0, 'C4b 强聊有代价：好感 ' + mentor.relationship.affection + '（v14.6 口径 ⚠-4）');
})();

// C5 门槛过了：听到心事
(function () {
    重置话账(); modalSlot = null;
    mentor.relationship.affection = 45;
    global.executeDeepTalkSubOption('mentor_01', 'topics', 'dt_personal');
    var html = 弹层HTML();
    var 池 = window.SPECIAL_NPC_DATA.mentor_01.dialogueTree.topics.personal.all;
    assert(说过(池, html), 'C5 好感 45 过门槛：personal 的两句心事听到了');
    mentor.relationship.affection = 0;
})();

// C6 固定子选项借池：情报>人物八卦 → gossip 数据句
(function () {
    重置话账(); modalSlot = null;
    mentor.relationship.affection = 20; // intel:gossip 固定选项自身门槛 15，先过 UI 门槛再验借池
    global.executeDeepTalkSubOption('mentor_01', 'intel', 'gossip');
    var html = 弹层HTML();
    var 池 = window.SPECIAL_NPC_DATA.mentor_01.dialogueTree.topics.gossip.all;
    assert(说过(池, html), 'C6 固定子选项「情报>人物八卦」也借到了数据池（旧写法查 topics.intel 永远 miss）');
    mentor.relationship.affection = 0;
})();

// C7 借池同样过门槛：帝都锦衣卫 topics>过往经历 → personal（门槛30）
(function () {
    重置话账(); modalSlot = null;
    tieshen.relationship.affection = 10;
    global.executeDeepTalkSubOption('cres_帝都·长安_1', 'topics', 'history');
    var html = 弹层HTML();
    var 池 = window.CITY_RESIDENT_DATA.npcs['cres_帝都·长安_1'].dialogueTree.topics.personal.all;
    assert(!说过(池, html), 'C7 好感 10 < 30：借池被门槛拦下，退回通用池（数据心事没漏）');
    重置话账(); modalSlot = null;
    tieshen.relationship.affection = 35;
    global.executeDeepTalkSubOption('cres_帝都·长安_1', 'topics', 'history');
    var html2 = 弹层HTML();
    assert(说过(池, html2), 'C7b 好感 35 过门槛：慕容铁的「狱卒的饼要分犯人一半」听到了');
    tieshen.relationship.affection = 0;
})();

// C8 城中人物自己的池子（v21.9 数据也接通）
(function () {
    重置话账(); modalSlot = null;
    global.executeDeepTalkSubOption('cres_帝都·长安_1', 'topics', 'dt_gossip');
    var html = 弹层HTML();
    var 池 = window.CITY_RESIDENT_DATA.npcs['cres_帝都·长安_1'].dialogueTree.topics.gossip.all;
    assert(说过(池, html), 'C8 长安锦衣卫的街谈巷议说的是长安的事（国师调档/科举字迹）');
})();

// C9 warm 池：知己以上说体己话
(function () {
    重置话账(); modalSlot = null;
    mentor.relationship.affection = 70;
    stubRnd(0.1); // warm 判定 0.1<0.5 → 取 warm；randomChoice 取下标 0
    global.executeDeepTalkSubOption('mentor_01', 'topics', 'dt_cultivation');
    restoreRnd();
    var html = 弹层HTML();
    var warm = window.SPECIAL_NPC_DATA.mentor_01.dialogueTree.topics.cultivation.warm;
    assert(说过(warm, html), 'C9 好感 70 触发 warm 专属句（「我可以指点你几招修炼方法」首次可闻）');
    mentor.relationship.affection = 0;
})();

// C10 UI 列表：dt_ 按钮与角标
(function () {
    modalSlot = null;
    mentor.relationship.affection = 0;
    global.showSubCategoryDialog('mentor_01', 'topics');
    var html = 弹层HTML();
    assert(html.indexOf('TA尤其想与你聊的') >= 0, 'C10 「话题」子分类出现数据话题区块');
    assert(html.indexOf("dt_gossip") >= 0 && html.indexOf('街谈巷议') >= 0, 'C10b dt_gossip 按钮带中文牌面');
    assert(html.indexOf("dt_personal") >= 0 && html.indexOf('⚠-4') >= 0, 'C10c 锁着的 personal 挂琥珀角标 ⚠-4（负号只有一个）');
    assert(html.indexOf('好感40可深聊') >= 0 || html.indexOf('⚠-4') >= 0, 'C10d 门槛对玩家可见');
    // 情报分类不该有 dt_ 按钮（只在「话题」下列）
    modalSlot = null;
    global.showSubCategoryDialog('mentor_01', 'intel');
    assert(弹层HTML().indexOf('dt_') < 0, 'C10e dt_ 按钮只挂在「话题」子分类下');
})();

// C11 无数据话题的 NPC：界面与旧版无异
(function () {
    var bare = new NPC('bare_1', '路人甲', { location: '金城', occupation: '散修' });
    npcManager.addNPC(bare);
    modalSlot = null;
    global.showSubCategoryDialog('bare_1', 'topics');
    var html = 弹层HTML();
    assert(html.indexOf('dt_') < 0 && html.indexOf('TA尤其想与你聊的') < 0, 'C11 没有数据话题的 NPC 不冒空区块');
    重置话账(); modalSlot = null;
    global.executeDeepTalkSubOption('bare_1', 'topics', 'dt_gossip');
    assert(msgs.some(function (m) { return m.m.indexOf('选项不存在') >= 0; }), 'C11b 红闸：对没数据的人硬点 dt_* → 「选项不存在」，不炸不静默');
})();

// ============ E v24.3 追补：topics.greeting 接通问候路径 ============
// 数据里 21 句人物专属问候（topics.greeting.all/warm）此前同样零消费方——
// getGreeting 只认通用池。现再见面且好感不为负时一半机会用人物自己的话。
console.log('--- E topics.greeting 接通问候路径（v24.3 追补） ---');
(function () {
    var ns = src('js/npcs/npc-system.js');
    assert(/npc\.dialogueTree && npc\.dialogueTree\.topics && npc\.dialogueTree\.topics\.greeting/.test(ns) &&
        /_npcLine\.replace\(\/\{playerName\}\/g, player\.name/.test(ns),
        'E1 getGreeting 读上 topics.greeting，专属句同样做 {playerName} 替换');
    assert(/if \(_npcGreetAll && affection >= 0 && Math\.random\(\) < 0\.5\)/.test(ns),
        'E2 好感为负不启用专属问候（厌恶/仇恨档照走通用池，人物腔不违和）');

    // 行为面：mentor 是再见面（firstMet 置真、印象桩成中性）
    mentor.memory.firstMet = true;
    mentor.getMemoryImpression = function () { return 'neutral'; };
    var 玩家 = { name: '玩家' };

    mentor.relationship.affection = 10;
    stubRnd(0.1); // 0.1<0.5 启用专属池；warm 分支因 aff<60 短路；randomChoice 取下标 floor(0.1*3)=0
    var g1 = global.getGreeting(mentor, 玩家);
    restoreRnd();
    var 专属池 = window.SPECIAL_NPC_DATA.mentor_01.dialogueTree.topics.greeting.all;
    assert(专属池.some(function (s) { return g1.indexOf(s.replace(/{playerName}/g, '玩家')) >= 0; }),
        'E3 再见面触发专属问候：「' + g1 + '」出自清虚道人自己的 3 句池（接线前永远通用池）');
    assert(g1.indexOf('{playerName}') < 0, 'E3b 专属问候同样不留占位符');

    stubRnd(0.9); // 0.9≥0.5 → 专属池让路，通用池照旧
    var g2 = global.getGreeting(mentor, 玩家);
    restoreRnd();
    assert(!专属池.some(function (s) { return g2.indexOf(s.replace(/{playerName}/g, '玩家')) >= 0; }),
        'E4 另一半机会仍走通用池（不霸屏，时段/名气/间隔后缀那套世情照旧）');

    mentor.relationship.affection = 70;
    stubRnd(0.1); // 专属池启用 + warm 判定 0.1<0.5 → warm 池唯一句
    var g3 = global.getGreeting(mentor, 玩家);
    restoreRnd();
    assert(g3.indexOf('看到你这么勤奋，为师很欣慰。') >= 0,
        'E5 知己（70）触发 greeting.warm 体己话（接线前 warm 池同为死数据）');
    mentor.relationship.affection = 0;
})();

console.log('\nv24.2-topics-wired：' + passed + ' 通过 / ' + failed + ' 失败');
process.exit(failed ? 1 : 0);
