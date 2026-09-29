/**
 * ==================== v24.7 故事线后半段复活 + 傲慢心魔现身 ====================
 * 全仓机扫「charData 字段读点 × 写点交叉比对」抓出的三处幽灵读（与 v24.5/v24.6 同病族：
 * 守卫式读法不炸不报错，功能静默关死）：
 *   ① NPC 故事线 stage2Complete 闸读 charData.quest_gather_herbs_completed——全仓零写方，
 *      带该触发的剧情阶段（npc-storylines.js 里 9+ 个 stage 3，多条故事线后半段）永远被挡死。
 *      改读故事线进度上的真字段 progress.stage2Completed（与 npc-system.js:1329 那套实现同口径），
 *      并在玩家选「我去寻药」类选项、委托真接上时写入该字段（随故事线进度持久化）。
 *   ② 顺藤摸出连环 bug：handleStorylineChoice 解析任务效果用 match(/quest_(\w+)/)[1]——
 *      把前缀剥掉，传给 acceptNPCQuest 的是 'gather_herbs'，模板 id 是 'quest_gather_herbs'，
 *      查无此单恒弹「接取失败」：玩家选了「我这就去寻药」，寻药委托从来没接上。改取带前缀整词。
 *   ③ 心魔「傲慢」触发条读 charData.realmLevel——全仓零写方（角色账上只有 realm 字符串+layer），
 *      realmLevel>=5 恒假，五种心魔里傲慢心魔从上线起没现身过。改用全仓统一境界刻度
 *      window.realmIndex（global-utils.js:870，凡人0…化神5…渡劫9），缺刻度时回退旧读法。
 * 判决不动（记录在案）：charData.strength/constitution/dexterity 心魔攻防速 bias——v21.6 已立案
 *   synthesizeEnemyAttrs 兜底合成六维，接真 attrs 属数值变化另案；sect-standing totalDays 兜底支
 *   （守卫链有活头 timeSystem.getAbsoluteDay）；app.js:4748 currentSkills 兜底（wave78 刻意留）；
 *   NPCQuestSystem.completeQuest 全仓零调用方——5 个默认委托「接得到、完不成」，子系统半成品另案。
 * 运行：node tests/v24.7-storyline-heartdemon-node.js
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

var NS = src('js/npcs/npc-system.js');
var CV = src('js/cultivation/cultivation.js');

// ============ [A] 源码接线棘轮 ============
console.log('--- [A] 源码接线 ---');
(function () {
    var ns = 剥注释(NS);
    assert(ns.indexOf('quest_gather_herbs_completed') < 0 && /stage\.trigger\.stage2Complete && !progress\.stage2Completed/.test(ns),
        'A1 stage2Complete 闸改读 progress.stage2Completed（charData 幽灵字段真代码归零）');
    assert(/match\(\/quest_\\w\+\/\) \|\| \[\]\)\[0\]/.test(ns) && ns.indexOf("match(/quest_(\\w+)/)[1]") < 0,
        'A2 任务效果解析改取带前缀整词（剥前缀旧解析清除）');
    assert(/stage2Completed = true/.test(ns) && /saveStorylineProgress\(\)/.test(ns),
        'A3 stage2Completed 有写方且随故事线进度持久化');
    var cv = 剥注释(CV);
    var hdBody = sliceFn(cv, 'function checkHeartDemonTrigger');
    assert(!!hdBody && /window\.realmIndex === 'function'/.test(hdBody) && /window\.realmIndex\(charData\.realm\)/.test(hdBody),
        'A4 傲慢心魔触发改用 realmIndex 真刻度（charData.realmLevel 只留作缺刻度回退）');
    assert((ns.match(/registerDefaultQuests\(\)/g) || []).length >= 2,
        'A5 两处实例化都注册默认委托模板（quest_gather_herbs 真在账，接单能成）');
})();

// ============ [B] 行为面：寻药委托真接上 ============
console.log('--- [B] handleStorylineChoice 行为 ---');
(function () {
    var body = sliceFn(NS, 'function handleStorylineChoice');
    assert(!!body, 'B0 切片成功');
    // 改前对照体：把整词解析还原成剥前缀旧解析（stage2 标记因 quests.has 查无此单自然不落）
    var oldBody = body.replace(
        "const questId = (choice.effect.match(/quest_\\w+/) || [])[0];",
        "const questId = choice.effect.match(/quest_(\\w+)/)[1];");
    assert(oldBody !== body, 'B0b 改前对照体构造成功');

    var acceptBody = sliceFn(NS, 'window.acceptNPCQuest = function(questId, npcId)');
    var acceptQuestBody = sliceFn(NS, 'acceptQuest(questId)');
    assert(!!acceptBody && !!acceptQuestBody, 'B0c acceptNPCQuest/acceptQuest 切片成功');

    var 寻药文案 = '「需要什么药材？我去帮你找。」';
    function 装(fnBody) {
        var msgs = [];
        var 好感 = [];
        var 存盘 = 0;
        var npc = {
            changeAffection: function (n) { 好感.push(n); },
            storylineProgress: {},
            saveStorylineProgress: function () { 存盘++; }
        };
        var questTpl = { id: 'quest_gather_herbs', title: '采集草药', npcId: 'healer_01' };
        var nqs = { quests: new Map([[questTpl.id, questTpl]]), acceptedQuests: [] };
        nqs.acceptQuest = new Function('questId', acceptQuestBody);
        var w = {
            npcManager: { getNPC: function () { return npc; } },
            NPC_STORYLINES: {
                healer_01: { story: [
                    { stage: 1, choices: [] },
                    { stage: 2, choices: [
                        { text: 寻药文案, effect: 'affection+10, quest_gather_herbs', nextStage: true },
                        { text: '「另请高明。」', effect: 'affection-5', nextStage: false }
                    ] },
                    { stage: 3, choices: [] }
                ] }
            },
            npcQuestSystem: nqs
        };
        // acceptNPCQuest 真体内读 window.*——把 w 自身喂给它
        w.acceptNPCQuest = new Function('window', 'showMessage',
            'return function(questId, npcId) {' + acceptBody + '};')(w, function (m) { msgs.push(String(m)); });
        var fn = new Function('window', 'showMessage',
            'return function handleStorylineChoice(npcId, choiceIndex, buttonElement) {' + fnBody + '};')(
            w, function (m) { msgs.push(String(m)); });
        var btn = { textContent: 寻药文案, closest: function () { return null; } };
        fn('healer_01', 0, btn);
        return { msgs: msgs, 好感: 好感, 存盘: function () { return 存盘; }, npc: npc, nqs: nqs };
    }

    var old = 装(oldBody);
    assert(old.msgs.some(function (m) { return m.indexOf('接取失败') >= 0; }) && old.nqs.acceptedQuests.length === 0,
        'B1 改前对照：剥前缀解析令 acceptQuest 查无此单——屏上弹「接取失败」，委托账空空（病是真的）');
    // v25.1·试-10：stage2Completed 写点已从「委托接单成功」放宽为「本幕任一 nextStage:true 选择即记账」。
    // 两修因此正交——即便委托解析仍是旧的剥前缀病（B1），第二幕推进也不再被它拖死（下方 B1b）。
    // 旧断言（改前 stage2Completed 也无从落笔）成立于 v24.7 那套「只认委托账」的窄口径，放宽后已失效，据实改判。
    assert(old.npc.storylineProgress['healer_01'] && old.npc.storylineProgress['healer_01'].stage2Completed === true,
        'B1b 委托解析的病不再拖死故事线：nextStage 放宽路径独立记 stage2Completed（试-10 与 v24.7 解析修互不依赖）');

    var neo = 装(body);
    assert(neo.msgs.some(function (m) { return m.indexOf('已接取委托') >= 0; }) && !neo.msgs.some(function (m) { return m.indexOf('接取失败') >= 0; }),
        'B2 改后：「我这就去寻药」真接上 quest_gather_herbs（📜 已接取委托！）');
    assert(neo.nqs.acceptedQuests.length === 1 && neo.nqs.acceptedQuests[0].id === 'quest_gather_herbs',
        'B3 委托真进账（v24.6 实例态 acceptedQuests 收下带 status 的条目）');
    var prog = neo.npc.storylineProgress['healer_01'];
    assert(prog && prog.stage2Completed === true && neo.存盘() >= 1,
        'B4 stage2Completed 真落进故事线进度并持久化（stage 3 的闸从此读得到真账）');
    assert(neo.好感.indexOf(10) >= 0,
        'B5 副效果照旧：affection+10 真加上（解析修复不误伤同串里的别的效果）');
    assert(prog.completedStages.indexOf(1) >= 0 && prog.stage === 2,
        'B6 nextStage 推进照旧：阶段完成入账、指针前移');
})();

// ============ [C] 行为面：故事线 stage 3 闸门通电 ============
console.log('--- [C] checkNPCStorylines 闸门 ---');
(function () {
    var body = sliceFn(NS, 'function checkNPCStorylines');
    assert(!!body, 'C0 切片成功');
    function 装(stage2Completed) {
        var 弹了 = [];
        var npc = {
            relationship: { affection: 50 },
            memory: {},
            storylineProgress: { healer_01: { stage: 2, completedStages: [0, 1], stage2Completed: stage2Completed } },
            loadStorylineProgress: function () {}
        };
        var w = {
            NPC_STORYLINES: { healer_01: { story: [
                // 前两阶段用好感门槛挡掉（函数是「触发一个就 return」，专测 stage 2 的闸）
                { trigger: { minAffection: 999 }, choices: [] },
                { trigger: { minAffection: 999 }, choices: [] },
                { trigger: { minAffection: 40, stage2Complete: true }, choices: [] }
            ] } },
            currentCharData: { name: '玩家' },
            npcManager: { getNPC: function () { return npc; } },
            timeSystem: { getAbsoluteDay: function () { return 10; } }
        };
        var fn = new Function('window', 'NPC_STORYLINES', 'showStorylineDialogue',
            'return function checkNPCStorylines(npcId) {' + body + '};')(
            w, w.NPC_STORYLINES, function (npcArg, stage, i) { 弹了.push(i); });
        fn('healer_01');
        return 弹了;
    }
    var 没完成 = 装(false);
    assert(没完成.indexOf(2) < 0,
        'C1 寻药承诺没立（stage2Completed 假）时 stage 3 照旧被挡——闸不是被拆了，是接了真账');
    var 完成了 = 装(true);
    assert(完成了.indexOf(2) >= 0,
        'C2 承诺立住后 stage 3 真触发（改前无论真假永远弹不出——幽灵字段恒 undefined）');
})();

// ============ [D] 行为面：傲慢心魔现身 ============
console.log('--- [D] checkHeartDemonTrigger 行为 ---');
(function () {
    var body = sliceFn(CV, 'function checkHeartDemonTrigger');
    assert(!!body, 'D0 切片成功');
    var oldBody = body.replace(/var realmLevel = \(typeof window\.realmIndex[^;]+;/,
        'var realmLevel = charData.realmLevel || 0;');
    assert(oldBody !== body, 'D0b 改前对照体构造成功');
    var HD = {
        slaughter: { id: 'slaughter' }, greed: { id: 'greed' }, emotion: { id: 'emotion' },
        pride: { id: 'pride' }, fear: { id: 'fear' }
    };
    function mk(fnBody, charData, hasRealmIndex) {
        var w = {
            currentCharData: charData,
            inventory: { currency: { spiritStones: 0 } }
        };
        if (hasRealmIndex) {
            var ORDER = ['凡人', '炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫', '飞升', '金仙'];
            w.realmIndex = function (r) { return ORDER.indexOf(String(r == null ? '' : r).trim()); };
        }
        return new Function('window', 'HEART_DEMON_TYPES',
            'return function checkHeartDemonTrigger() {' + fnBody + '};')(w, HD);
    }
    function 角色(o) {
        return Object.assign({ realm: '化神', layer: 3, _killCount: 0, bonds: {}, _failedBreakthroughs: 0 }, o || {});
    }
    var origRnd = Math.random;
    Math.random = function () { return 0.1; }; // 全触发条的概率门都放行，专测门槛本身

    assert(mk(oldBody, 角色(), true)() === null,
        'D1 改前对照：化神大能站在面前，realmLevel 幽灵读恒 0——傲慢心魔永不触发（病是真的）');
    var d2 = mk(body, 角色(), true)();
    assert(d2 && d2.id === 'pride',
        'D2 改后：化神（realmIndex=5）真触发傲慢心魔');
    assert(mk(body, 角色({ realm: '金丹' }), true)() === null,
        'D3 金丹（realmIndex=3）不触发——门槛 5 不掺水');
    var d4 = mk(body, 角色({ _killCount: 60 }), true)();
    assert(d4 && d4.id === 'slaughter',
        'D4 优先级照旧：杀孽 60 先判杀戮心魔（傲慢靠后）');
    var d5 = mk(body, 角色({ realmLevel: 7 }), false)();
    assert(d5 && d5.id === 'pride',
        'D5 realmIndex 缺失时回退旧读法 charData.realmLevel（沙箱/桩环境不炸）');
    Math.random = origRnd;
})();

// ============ [E] 刻度自证 ============
console.log('--- [E] REALM_ORDER 刻度 ---');
(function () {
    var gu = src('js/global-utils.js');
    var m = gu.match(/var REALM_ORDER = \[([^\]]+)\]/);
    assert(!!m, 'E0 REALM_ORDER 提取成功');
    var arr = m[1].split(',').map(function (s) { return s.trim().replace(/^'|'$/g, ''); });
    assert(arr.indexOf('凡人') === 0 && arr.indexOf('化神') === 5,
        'E1 刻度在账：凡人=0、化神=5（傲慢心魔门槛 realmLevel>=5 ⇔ 化神及以上，语义记录在案）');
})();

// ============ [F] 真身 showStorylineDialogue（v25.1·试-03：当年漏检正是给真函数注了桩）============
console.log('--- [F] showStorylineDialogue 真身 ---');
(function () {
    var ns = 剥注释(NS);
    assert(/function showStorylineDialogue\(npc, stage, stageIndex, npcId\)/.test(ns),
        'F1 真身形参补上 npcId（旧版形参没有它，模板串裸读 ${npcId} 即 ReferenceError）');
    assert(ns.indexOf('showStorylineDialogue(npc, stage, i, npcId)') >= 0,
        'F2 checkNPCStorylines 调用点同步传 npcId');

    // 跑真身：DOM 打桩，函数体从源码切片直跑（不注桩遮蔽——注桩正是 v24.7 漏检的原因）
    var body = sliceFn(NS, 'function showStorylineDialogue');
    assert(!!body, 'F3 切片成功');
    var appended = [];
    // v25.2·收编批：showStorylineDialogue 末尾多了一句
    //   `if (window.XianXia && window.XianXia.Modal && modal.isConnected) …`
    // 生产代码是三重守卫，浏览器里无碍；但本夹具用 new Function('document', …) 只注入
    // document，函数体里的 `window` 标识符本身就会抛 ReferenceError——
    // 那是**夹具太窄**，不是产品代码坏了。给宿主补一个最小 window 桩即可，
    // 桩里不提供 XianXia，adopt 分支自然跳过，真身逻辑照旧被验。
    // ⚠ 别在这里把 window 指向真 global：那会与「不注桩遮蔽真身」的初衷相反。
    var fakeWin = { XianXia: undefined, undefined: undefined };
    var fakeDoc = {
        createElement: function () { return { className: '', onclick: null, innerHTML: '', remove: function () {}, isConnected: true }; },
        body: { appendChild: function (el) { appended.push(el); } }
    };
    var stage = {
        title: '第一次求助',
        dialogue: ['{npc}需要帮助。'],
        choices: [{ text: '「我这就去！」' }, { text: '「改天吧。」' }]
    };
    var threw = null;
    try {
        var fn = new Function('document', 'window',
            'return function showStorylineDialogue(npc, stage, stageIndex, npcId) {' + body + '};')(fakeDoc, fakeWin);
        fn({ id: 'healer_01', name: '灵素' }, stage, 1, 'healer_01');
    } catch (e) { threw = e; }
    assert(threw === null, 'F4 真身构建弹窗不再抛 ReferenceError（旧版九条故事线全体哑火的根因）');
    assert(appended.length === 1 && appended[0].innerHTML.indexOf("handleStorylineChoice('healer_01'") >= 0,
        'F5 弹窗真 append，且选项按钮把 npcId 带进 handleStorylineChoice 回叫');

    // 改前对照：形参没有 npcId 的旧签名跑同一段模板必炸（病是真的）
    var threwOld = null;
    try {
        var fnOld = new Function('document', 'window',
            'return function showStorylineDialogue(npc, stage, stageIndex) {' +
            body.replace("const _sid = npcId || (npc && npc.id) || '';", '')
                .replace(/\$\{_sid\}/g, '${npcId}') + '};')(fakeDoc, fakeWin);
        fnOld({ id: 'healer_01', name: '灵素' }, stage, 1, 'healer_01');
    } catch (e) { threwOld = e; }
    assert(threwOld && threwOld instanceof ReferenceError,
        'F6 改前对照：旧签名裸读 ${npcId} 确抛 ReferenceError');
})();

// ============ [G] 委托注册表覆盖故事线全部 quest_ 引用（v25.1·试-10）============
console.log('--- [G] 故事线委托注册覆盖 ---');
(function () {
    var stSrc = src('js/npcs/npc-storylines.js');
    var referenced = {};
    (剥注释(stSrc).match(/quest_[a-z_]+/g) || []).forEach(function (q) { referenced[q] = true; });
    var regBody = sliceFn(NS, 'registerDefaultQuests()');
    assert(!!regBody, 'G0 注册表切片成功');
    var registered = {};
    (regBody.match(/id: '(quest_[a-z_]+)'/g) || []).forEach(function (s) {
        registered[s.replace(/^id: '|'$/g, '')] = true;
    });
    var missing = Object.keys(referenced).filter(function (q) { return !registered[q]; });
    assert(Object.keys(referenced).length >= 6 && missing.length === 0,
        'G1 故事线引用的全部 quest_ 模板都在注册表（缺失: ' + (missing.join(',') || '无') + '）——接单不再恒「接取失败」');
    // 闸门双保险：第二幕任一 nextStage:true 选择即记 stage2Completed（没 quest_ 令牌的 5 条线也走得通）
    var hBody = sliceFn(NS, 'function handleStorylineChoice');
    assert(/if \(currentStageIndex === 1\) progress\.stage2Completed = true;/.test(hBody),
        'G2 第二幕闸放宽写点在案（贾有道/柳随风/张大爷/丹大师/老王无委托线不再死锁第三幕）');
})();

// ============ [H] 非好感令牌真消费（v25.1·试-11）============
console.log('--- [H] handleStorylineChoice 令牌映射 ---');
(function () {
    var body = sliceFn(NS, 'function handleStorylineChoice');
    function 装(effectText, choiceText, opts) {
        opts = opts || {};
        var msgs = [], items = [], expGains = [], affs = [], saved = 0;
        var wallet = opts.wallet != null ? opts.wallet : 800;
        var npc = {
            changeAffection: function (n) { affs.push(n); },
            storylineProgress: {},
            saveStorylineProgress: function () { saved++; }
        };
        var w = {
            npcManager: { getNPC: function () { return npc; } },
            NPC_STORYLINES: { merchant_01: { story: [
                { stage: 1, choices: [] },
                { stage: 2, choices: [{ text: choiceText, effect: effectText, nextStage: opts.nextStage !== false }] },
                { stage: 3, choices: [] }
            ] } },
            npcQuestSystem: { quests: new Map() },
            DataManager: {
                deductSpiritStones: function (n) { if (wallet >= n) { wallet -= n; return true; } return false; },
                addSpiritStones: function (n) { wallet += n; }
            },
            currentCharData: { spiritStones: 0, karma: 95, health: 100, maxHealth: 100, qi: 100, maxQi: 100, tempering: 0 },
            addItem: function (id) { items.push(id); return 1; },
            gainExp: function (n) { expGains.push(n); },
            updateCharacterStatus: function () {}
        };
        var fn = new Function('window', 'showMessage',
            'return function handleStorylineChoice(npcId, choiceIndex, buttonElement) {' + body + '};')(
            w, function (m) { msgs.push(String(m)); });
        fn('merchant_01', 0, { textContent: choiceText, closest: function () { return null; } });
        return { msgs: msgs, items: items, expGains: expGains, affs: affs, npc: npc,
            wallet: function () { return wallet; }, cd: w.currentCharData, saved: function () { return saved; } };
    }

    var h1 = 装('affection+10, spiritStones-500', '「借你500灵石。」');
    assert(h1.wallet() === 300 && h1.affs.indexOf(10) >= 0,
        'H1 借出 500 灵石真扣账（旧版分文不扣白拿好感）');
    assert(h1.npc.storylineProgress.merchant_01.stage2Completed === true,
        'H2 无 quest_ 令牌的第二幕 nextStage 选择也记 stage2Completed（试-10 放宽路径通电）');

    var h2 = 装('affection+10, spiritStones-500', '「借你500灵石。」', { wallet: 100 });
    assert(h2.wallet() === 100 && h2.msgs.some(function (m) { return m.indexOf('囊中羞涩') >= 0; }),
        'H3 灵石不够时不扣账且如实相告（不谎报成功）');

    var h3 = 装('affection+20, item_legendary', '「多谢大师！」');
    assert(h3.items.indexOf('immortal_sword') >= 0,
        'H4 item_legendary 走 addItem 真发货（占位 id 换成库里真实存在的「仙人斩」等价物）');
    var h3b = 装('affection+10, item_secret_art', '「多谢老人家！」');
    assert(h3b.items.indexOf('taiji_sword') >= 0,
        'H5 item_secret_art 发「太极剑法」（库里真实秘籍）');

    var h4 = 装('affection+10, spiritStones+500, karma-10', '「算我一份！」');
    assert(h4.wallet() === 1300 && h4.cd.karma === 85,
        'H6 进账 spiritStones+500 与 karma-10 都真落账（95-10=85）');
    var h4b = 装('affection+5, karma+10', '「这是违法的。」');
    assert(h4b.cd.karma === 100, 'H7 karma clamp 到上限 100（95+10 不越刻度）');

    var h5 = 装('affection+5, exp+10', '「请指教！」');
    assert(h5.expGains.indexOf(10) >= 0, 'H8 exp+10 走既有 gainExp 入口（历练账）');

    var h6 = 装('affection+15, health-20', '「我帮你压制！」');
    assert(h6.cd.health === 80, 'H9 health-20 真扣且 clamp（100-20=80）');
    var h6b = 装('affection+15, qi-50', '「我运功帮你。」');
    assert(h6b.cd.qi === 50, 'H10 qi-50 真扣（100-50=50）');

    var h7 = 装('story_complete', '「丹道永传。」', { nextStage: false });
    assert(h7.npc.storylineProgress.merchant_01.story_complete === true && h7.saved() >= 1,
        'H11 story_complete 旗落进 storylineProgress 并持久化（第五幕结局分支从此有账可读）');
    var h7b = 装('affection-20, story_end_bad', '「你好自为之。」', { nextStage: false });
    assert(h7b.npc.storylineProgress.merchant_01.story_end_bad === true,
        'H12 story_end_bad 旗同样落账');
    var h7c = 装('affection+15, secret_unlocked', '「我帮你保守秘密。」', { nextStage: false });
    assert(h7c.npc.storylineProgress.merchant_01.secret_unlocked === true,
        'H13 secret_unlocked 旗落账');
})();

console.log('\nv24.7-storyline-heartdemon：' + passed + ' 通过 / ' + failed + ' 失败');
process.exit(failed ? 1 : 0);
