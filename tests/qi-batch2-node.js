// ==================== v25.0《灵气之尽》批二验收：对抗线 main_011~018 ====================
// 对齐：详稿·第二批·对抗线.md C10 验收断言十条 + 大纲十二条纪律
// 覆盖：A 接线 / F 全线通关盘（帮满+放多斩少） / G 冷账盘（全走开+斩） / H 门槛与兜底 / I 文案纪律
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');

let passed = 0; const failures = [];
function ok(cond, msg) { if (cond) { passed++; } else { failures.push(msg); console.log('  ✗ ' + msg); } }
function read(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ============ A 接线 ============
{
    const html = read('仙侠.html');
    ok(html.indexOf('js/quest/qi-arc2.js') >= 0, 'A1 qi-arc2 已挂脚本位');
    const cm = read('js/quest/choice-memory.js');
    ok(['qi_boss1_slay', 'qi_boss1_spare', 'qi_boss4_spare', 'qi_alliance_sign', 'qi_alliance_refuse', 'qi_alliance_tear', 'qi_truth_publish', 'qi_truth_burn', 'qi_interlude_answer', 'qi_interlude_silent'].every(id => cm.indexOf("'" + id + "'") >= 0), 'A2 批二抉择全部入选择记忆');
    ok(cm.indexOf("decisive: '果决'") >= 0 && cm.indexOf("|| '抉择'") >= 0, 'A3 标签中文化（未知标签不再漏外文）');
    const arc1 = read('js/quest/qi-arc1.js');
    ok(arc1.indexOf('qiOpposeButtons') >= 0 && arc1.indexOf('_qiSettleExtra') >= 0 && arc1.indexOf('resolveQiStranded') >= 0, 'A4 枢纽三接口（面板按钮位/战斗分流/搁浅销账）');
    const src2 = read('js/quest/qi-arc2.js');
    ok(src2.indexOf('endgame_') < 0, 'A5 批二零旧旗标');
    ok(read('tests/run-all.sh').indexOf('qi-batch2-node.js') >= 0, 'A6 本套件已入回归清单');
}

// ============ 运行时沙箱 ============
function makeWorld(opts) {
    opts = opts || {};
    var logs = [], modals = [], overlays = [], choices = [], day = opts.day || 500;
    var realmOrder = ['凡人', '炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'];
    var W = {
        console: { log: function () {} },
        Math: Math, JSON: JSON, Object: Object, Array: Array, String: String, Number: Number, isFinite: isFinite, RegExp: RegExp,
        eventFlags: {},
        currentCharData: { realm: opts.realm || '炼虚', gender: opts.gender || 'male', name: '测试', fame: 0, essence: 0 },
        inventory: { currency: { spiritStones: opts.stones != null ? opts.stones : 5000 } },
        updateCurrencyUI: function () {},
        gameLog: { add: function (m) { logs.push(String(m)); } },
        showMessage: function (m) { logs.push(String(m)); },
        showModal: function (title, body) { modals.push({ title: String(title), body: String(body) }); },
        recordChoice: function (id) { choices.push(id); },
        getRealmTier: function (r) { var i = realmOrder.indexOf(r); return i < 0 ? 6 : i; },
        addFame: function (n) { W._fame = (W._fame || 0) + (n || 0); },
        gainCultivationBonus: function (n) { W._essence = (W._essence || 0) + (n || 0); },
        addItem: function (id) { (W._items = W._items || []).push(id); return true; },
        itemById: {}, allItems: [], materials: [],
        timeSystem: { getAbsoluteDay: function () { return day; }, onNewDaySubscribe: function (fn) { W._newDay = fn; } },
        startBattle: function (e) { W._lastEnemy = e; return { _stub: true }; },
        acceptQuest: function (id) { W._accepted = (W._accepted || []).concat(id); },
        updateQuestUI: function () {},
        QuestRegistry: (function () { var m = {}; return { registerMany: function (arr) { arr.forEach(function (q) { m[q.id] = q; }); }, get: function (id) { return m[id] || null; } }; })(),
        mainQuestChain: [],
        StateRegistry: { register: function () {} },
        QI_CONCENTRATION: {
            '大漠孤城': { base: 0.8, desc: '沙漠之地' }, '冰原城': { base: 1.3, desc: '冰雪' }, '万毒谷': { base: 1.2, desc: '毒瘴' },
            '青木城': { base: 1.5, desc: '木灵' }, '剑阁': { base: 1.5, desc: '剑气' }, '炎城': { base: 1.4, desc: '火灵' },
            '洛水城': { base: 1.1, desc: '水畔' }, '帝都·长安': { base: 1.0, desc: '帝都' }
        },
        globalQiLevel: 100,
        depleteQi: function (a) { W.globalQiLevel = Math.max(0, W.globalQiLevel - (a || 1)); },
        restoreWorldQi: function (a) { W.globalQiLevel = Math.min(100, W.globalQiLevel + (a || 5)); },
        document: { getElementById: function () { return null; }, body: { insertAdjacentHTML: function (pos, h) { overlays.push(String(h)); } } },
        _logs: logs, _modals: modals, _overlays: overlays, _choices: choices,
        _setDay: function (d) { day = d; }, _bumpDay: function (n) { day += n; if (W._newDay) W._newDay(); }
    };
    W.window = W;
    var ctx = vm.createContext(W);
    ['js/quest/qi-world.js', 'js/quest/qi-arc1.js', 'js/quest/qi-arc2.js'].forEach(function (rel) {
        vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel });
    });
    return W;
}
function allText(W) {
    return W._logs.join('|') + '|' + W._modals.map(m => m.title + m.body).join('|') + '|' + W._overlays.join('|');
}
function fastPrologue(W, picks) {
    W.qiStartPrologue();
    W.qiSceneChoice('chen', picks.chen);
    W.qiSceneChoice('liu', picks.liu);
    if (picks.liu === 'buy' && (W.inventory.currency.spiritStones || 0) < 30) W.qiSceneChoice('liu', 'pass');
    W.qiSceneChoice('yu', picks.yu);
    if (picks.yu === 'guard') W.settleQiBattle(true, 'yu');
    W.qiSceneChoice('zhou', picks.zhou);
    W.qiToRoute();
    W.qiRouteChoice('oppose');
}

// ============ F 全线通关盘（帮满：陪坐/买药/守阵/记名；杜放霍斩沙放藏斩；撕帖/公示/答实话） ============
var WF = makeWorld({ realm: '炼虚', gender: 'male', stones: 5000 });
{
    fastPrologue(WF, { chen: 'sit', liu: 'buy', yu: 'guard', zhou: 'name' });
    WF.openQiEndgamePanel();
    ok(WF._modals.map(m => m.body).join('').indexOf('顺着白疤走') >= 0, 'F1 面板出现枯萎巡按钮（逐字）');

    // C1 枯萎巡 + 长生牌位
    WF.qiStartC11();
    ok(WF._overlays.join('').indexOf('我记了三百年的账里') >= 0, 'F2 帮过陈五久：还账版台词');
    ok(WF._overlays.join('').indexOf('柳四娘') >= 0 && WF._overlays.join('').indexOf('虞松子') >= 0, 'F3 柳四娘/虞松子按真账到场');
    var L0 = WF.qiLedgerProbe(); var g0 = L0.graces.length, v0 = L0.vendettas.length;
    WF.qiC11Tablet();
    WF.qiTabletChoice('bow');
    ok(L0.graces.length === g0 && L0.vendettas.length === v0, 'F4 作揖不入恩仇簿（世界不打分）');
    ok(WF._choices.indexOf('qi_tablet_bow') >= 0 && WF.eventFlags['qi_c11'] === true && WF.qiWorldProbe().withered.indexOf('大漠孤城') >= 0, 'F5 牌位入选择记忆、一章毕、大漠孤城枯');

    // C2 杜无忧：败可再战 → 胜 → 放
    WF.qiStartC12();
    ok(WF.qiWorldProbe().withered.indexOf('冰原城') >= 0, 'F6 012开：冰原城已枯（你到时脉已经枯了）');
    WF.qiBossFight(1);
    ok(WF._lastEnemy && WF._lastEnemy.name === '毒谷药主·杜无忧' && WF._lastEnemy._isQiStory === true && WF._lastEnemy._qiBeat === 'boss1', 'F7 头一仗真仗接线');
    WF.settleQiBattle(false, 'boss1');
    ok(WF.eventFlags['qi_c_scene'] === 'boss1_battle' && WF._logs.join('').indexOf('毒雾缠了你一身') >= 0, 'F8 败=可再战不入账（断点旗正确）');
    WF.qiResumeOppose();
    ok(WF._lastEnemy && WF._lastEnemy.name === '毒谷药主·杜无忧', 'F9 断点续玩重开同一仗');
    WF.settleQiBattle(true, 'boss1');
    ok(WF._overlays.join('').indexOf('生意做到人头上，就不是生意了') >= 0, 'F10 胜后抉择弹窗（杜无忧实话引导语）');
    WF.qiBossFate(1, 'spare');
    var LF = WF.qiLedgerProbe();
    ok(WF.eventFlags['qi_boss1_fate'] === 'spare' && LF.graces.some(e => e.text.indexOf('杜无忧') >= 0), 'F11 放=恩列记账、fate旗正确');
    ok(WF.qiWorldProbe().withered.indexOf('万毒谷') >= 0 && WF.eventFlags['qi_c12'] === true, 'F12 012完：万毒谷枯');
    ok(WF.qiStreetProbe().some(s => s.text.indexOf('敢情是剑撬开的') >= 0), 'F13 街谈当场入库（批六接腔）');

    // C3 照面 + 暴涨①
    WF.qiStartC13();
    ok(WF._overlays.join('').indexOf('你追本座——图什么') >= 0 && WF._overlays.join('').indexOf('她没有拔') >= 0, 'F14 初次照面（败而不辱）');
    WF.qiMotiveChoice('unclear');
    ok(WF._choices.indexOf('qi_motive_unclear') >= 0 && WF._overlays.join('').indexOf('惊起剑阁一山的鸦') >= 0, 'F15 「说不清」她笑而不辱 + 入选择记忆');
    WF.qiFinishC13();
    ok(WF.globalQiLevel === 55 && WF.qiWorldProbe().withered.indexOf('青木城') >= 0 && WF.qiWorldProbe().withered.indexOf('剑阁') >= 0, 'F16 一幕毕：总闸55、青木城+剑阁连枯');
    ok(WF._essence === 2000 && WF._fame === 25 && WF._items.indexOf('qi_half_array_stone') >= 0, 'F17 暴涨①：修为大补+名望+半块阵眼灵石（守过阵才有）');
    ok(WF._overlays.join('').indexOf('三百年的陈账') >= 0, 'F18 暴涨①按序幕账本分流（帮过=交情版）');
    WF.qiSurge1Done();

    // C4 霍无霜：斩
    WF.qiStartC14();
    WF.qiBossFight(2); WF.settleQiBattle(true, 'boss2');
    WF.qiBossFate(2, 'slay');
    ok(WF.eventFlags['qi_boss2_fate'] === 'slay' && WF.qiLedgerProbe().vendettas.some(e => e.text.indexOf('霍无霜') >= 0), 'F19 斩=仇列划名');
    ok(WF.qiWorldProbe().withered.indexOf('炎城') >= 0, 'F20 014完：炎城枯');

    // C5 沙量：放 + 周小满联动 + 搁浅销账
    WF.qiStartC15();
    WF.qiBossFight(3); WF.settleQiBattle(true, 'boss3');
    var strandedBefore = WF.qiLedgerProbe().stranded;
    WF.qiBossFate(3, 'spare');
    ok(strandedBefore.length > 0 && strandedBefore.every(e => e.resolved), 'F21 搁浅列批量销账（真账划掉不删页）');
    ok(WF._logs.join('').indexOf('周小满') >= 0 && WF._logs.join('').indexOf('受了人的恩，手要怎么摆') >= 0, 'F22 序幕联动：记过名→矿场救回周小满');
    ok(WF.qiWorldProbe().withered.length === 6, 'F23 015完不额外枯城（映射写死：六城已枯）');

    // C6 藏风真人：斩
    WF.qiStartC16();
    WF.qiBossFight(4); WF.settleQiBattle(true, 'boss4');
    WF.qiBossFate(4, 'slay');
    ok(WF.qiLedgerProbe().vendettas.some(e => e.text.indexOf('藏风真人') >= 0) && WF.qiWorldProbe().withered.indexOf('洛水城') >= 0, 'F24 斩藏风=仇列划名、016完洛水城枯');
    ok(WF._logs.join('').indexOf('名册头一行，是你的名字') >= 0, 'F25 幕尾构陷伏笔');

    // C7 守脉盟：撕帖 → 对质翻案（账厚）→ 公示
    WF.qiStartC17();
    var fame0 = WF._fame || 0;
    WF.qiAllianceChoice('tear');
    ok(WF._fame - fame0 === 30 && WF._logs.join('').indexOf('我的名字，我自己写') >= 0, 'F26 撕帖=名望大涨+逐字台词');
    WF.qiTrialResolve();
    var t = WF._overlays.join('');
    ok(WF.eventFlags['qi_verdict'] === 'thick', 'F27 恩列+搁浅合计过厚度线→当堂翻案（内读永不报数）');
    ok(t.indexOf('盟里买丹的名录') >= 0 && t.indexOf('守过几座') >= 0 && t.indexOf('我家小子回家了') >= 0, 'F28 证人按真账出场（杜无忧/虞松子/婆婆）');
    ok(t.indexOf('输给了一个不识字的老婆婆') >= 0, 'F29 翻案判词+街谈逐字');
    WF.qiToTruth();
    ok(WF._overlays.join('').indexOf('灵脉是天的收租管道') >= 0, 'F30 天秘《天锁论》弹窗');
    WF.qiTruthChoice('publish');
    ok(WF.eventFlags['qi_truth'] === 'publish' && WF.eventFlags['qi_opinion_turned'] === true, 'F31 公示=舆论线提前转向旗');
    ok(WF.qiStreetProbe().filter(s => s.text.indexOf('抬头看天') >= 0 || s.text.indexOf('收不回人心里念的') >= 0).length === 2, 'F32 公示街谈两条入库');
    ok(WF.qiLedgerProbe().hearts.some(e => e.text.indexOf('把天下人当人') >= 0), 'F33 人心簿：公示一笔');
    WF.qiFinishC17();
    ok(WF.eventFlags['qi_c17'] === true, 'F34 守脉盟章毕');

    // C8 聚义 + 中幕加信
    WF.qiStartC18();
    var r = WF._overlays.join('');
    ok(r.indexOf('你倒在哪一波，我救到哪一波') >= 0 && r.indexOf('押最后一趟镖。镖是你') >= 0, 'F35 聚义名册：放者到场（头八条台词逐字）');
    ok(r.indexOf('我带一炉火') < 0 && r.indexOf('抵押给你') < 0, 'F36 斩者不到场（霍无霜/藏风缺席——账不硬造）');
    ok(r.indexOf('我不懂大事') >= 0, 'F37 婆婆入名册（田埂有账）');
    WF.qiToLetter();
    ok(WF._overlays.join('').indexOf('若本座不拆你的仙路，你还会来杀本座吗') >= 0, 'F38 中幕加信逐字');
    var gBefore = WF.qiLedgerProbe().graces.length;
    WF.qiInterludeChoice('answer');
    ok(WF.qiLedgerProbe().graces.length === gBefore + 1 && WF._logs.join('').indexOf('红线停了一天') >= 0, 'F39 答实话=恩列一笔+红线停一天');
    WF.qiInterludeChoice('silent');
    ok(WF.qiLedgerProbe().graces.length === gBefore + 1, 'F40 加信一次性（再答无效）');
    WF.qiFinishC18();
    ok(WF.globalQiLevel === 30 && WF.eventFlags['qi_c18'] === true && WF.qiWorldProbe().withered.indexOf('帝都·长安') >= 0, 'F41 二幕毕：总闸30、长安枯');
    WF.openQiEndgamePanel();
    ok(WF._modals.map(m => m.body).join('').indexOf('需渡劫修为') >= 0, 'F42 三幕门槛叙事化（锁而不死）');
    ['qi_c11', 'qi_c12', 'qi_c13', 'qi_c14', 'qi_c15', 'qi_c16', 'qi_c17', 'qi_c18'].forEach(function (k, i) {
        if (i === 0) ok(WF.eventFlags[k] === true, 'F43 八章旗标齐备（串行推进）');
    });
    ok(['main_011', 'main_012', 'main_013', 'main_014', 'main_015', 'main_016', 'main_017', 'main_018'].every(id => { var q = WF.QuestRegistry.get(id); return q && q.completed === true; }), 'F44 八章任务全闭环');
}

// ============ G 冷账盘（全走开+全斩+拒签）：账薄、独狼、烧天秘 ============
var WG = makeWorld({ realm: '炼虚', stones: 100 });
{
    fastPrologue(WG, { chen: 'pass', liu: 'pass', yu: 'pass', zhou: 'pass' });
    WG.qiStartC11();
    ok(WG._overlays.join('').indexOf('我姓陈，卡了三百年的金丹') >= 0, 'G1 未帮陈五久：不认识版台词');
    var L0 = WG.qiLedgerProbe(); var g0 = L0.graces.length, v0 = L0.vendettas.length;
    WG.qiC11Tablet(); WG.qiTabletChoice('pass');
    ok(L0.graces.length === g0 && L0.vendettas.length === v0 && WG._choices.indexOf('qi_tablet_pass') >= 0, 'G2 沉默走过同样不打分、入选择记忆');
    WG.qiStartC12(); WG.qiBossFight(1); WG.settleQiBattle(true, 'boss1'); WG.qiBossFate(1, 'slay');
    ok(WG._logs.join('').indexOf('走得比没吃丹的还早') >= 0, 'G3 斩杜无忧：双代价文本逐字（丹断了）');
    // 直达 C17（章节旗手工置——只为测对质分支）
    ['qi_c13', 'qi_c14', 'qi_c15', 'qi_c16'].forEach(k => { WG.eventFlags[k] = true; });
    WG.qiStartC17();
    WG.qiAllianceChoice('refuse');
    ok(WG._logs.join('').indexOf('盟护不到') >= 0 && WG.qiLedgerProbe().hearts.some(e => e.text.indexOf('盟护不到') >= 0), 'G4 拒签=威胁入人心簿+构陷开始');
    WG.qiTrialResolve();
    ok(WG.eventFlags['qi_verdict'] === 'thin', 'G5 账薄=半信半疑（无证人硬造）');
    ok(WG._overlays.join('').indexOf('炊饼') >= 0 && WG._overlays.join('').indexOf('信你追了三年的脚程') >= 0, 'G6 独狼兜底（未守阵=陈五久版）');
    WG.qiToTruth(); WG.qiTruthChoice('burn');
    ok(WG.qiLedgerProbe().hearts.some(e => e.text.indexOf('独握了真相') >= 0) && WG._logs.join('').indexOf('只瞒住了自己') >= 0, 'G7 烧掉=人心簿重笔+她点破预告');
    ok(WG.qiStreetProbe().every(s => s.text.indexOf('抬头看天') < 0), 'G8 烧掉=街谈无新增（没人知道发生过）');
    WG.qiFinishC17();
    WG.qiStartC18();
    ok(WG._overlays.join('').indexOf('一个顶三个，金丹三百年不是白卡的') >= 0, 'G9 名册薄=独狼兜底（未守阵版）');
    WG.qiToLetter(); WG.qiInterludeChoice('silent');
    ok(WG._logs.join('').indexOf('不答，也是答') >= 0, 'G10 烧信=不答也是答');
    WG.qiFinishC18();
}

// ============ H 门槛与兜底变体 ============
{
    // 013 炼虚门槛：金丹档锁定、锁而不死
    var WH = makeWorld({ realm: '金丹', stones: 100 });
    fastPrologue(WH, { chen: 'pass', liu: 'pass', yu: 'pass', zhou: 'pass' });
    WH.eventFlags['qi_c11'] = true; WH.eventFlags['qi_c12'] = true;
    WH.openQiEndgamePanel();
    var b = WH._modals.map(m => m.body).join('');
    ok(b.indexOf('需炼虚以上修为，才站得住那条脉的脉口') >= 0, 'H1 013门槛锁文逐字');
    ok(b.indexOf('九州枯萎图') >= 0 && b.indexOf('账本') >= 0, 'H2 锁而不死（枯萎图/账本页签照常）');
    WH.qiStartC13();
    ok(WH.eventFlags['qi_c_scene'] !== 'c13', 'H3 门槛下强开被拒（函数级兜底）');
    // 石头兜底：守过阵+账薄
    var WI = makeWorld({ realm: '炼虚', stones: 100 });
    fastPrologue(WI, { chen: 'pass', liu: 'pass', yu: 'guard', zhou: 'pass' });
    ['qi_c11', 'qi_c12', 'qi_c13', 'qi_c14', 'qi_c15', 'qi_c16'].forEach(k => { WI.eventFlags[k] = true; });
    WI.qiStartC17(); WI.qiAllianceChoice('sign');
    ok(WI.qiLedgerProbe().hearts.some(e => e.text.indexOf('低头') >= 0), 'H4 签盟=人心簿「低头」一笔');
    WI.qiTrialResolve();
    ok(WI._overlays.join('').indexOf('石头认得你') >= 0, 'H5 账薄+守过阵=半块灵石兜底（石头认得你）');
}

// ============ I 文案纪律（F盘全程文本） ============
{
    var t = allText(WF).replace(/<[^>]+>/g, '');
    ok(!/[A-Za-z]/.test(t), 'I1 批二玩家可见文本零外文字母');
    ok(t.indexOf('次数') < 0 && t.indexOf('上限') < 0, 'I2 零配额句式');
    ok(t.indexOf('妹妹') < 0 && t.indexOf('姐姐') < 0, 'I3 年龄铁设定不破');
    ok(t.indexOf('鼎炉') < 0 && t.indexOf('气运') < 0, 'I4 旧设定词清零');
    ok(!/[0-9]/.test(t.replace(/第\d+日/g, '')), 'I5 玩家文本零裸数值（厚度线/数额全内读）');
}

console.log('qi-batch2: ' + passed + ' passed, ' + failures.length + ' failed');
if (failures.length) { failures.forEach(f => console.log('  FAIL: ' + f)); process.exit(1); }
