// ==================== v25.0《灵气之尽》批五验收：汇流终战 + 犹豫拍 + 四结局 ====================
// 对齐：主线大纲·灵气之尽.md 第三幕节 + 8.3 终幕决策 + 8.4 补丁⑤改道 + 11.1/11.4②③④⑤⑦ + 十二条纪律
// 覆盖：A 接线 / P 对抗盘·斩 / Q 追随盘·渡 / R 无视盘·放（她替你挡一波） / S 不飞升三变体 / T 前夜改道两版 / E 文案纪律
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
    ok(html.indexOf('js/quest/qi-finale.js') >= 0, 'A1 终幕已挂脚本位');
    const cm = read('js/quest/choice-memory.js');
    ok(['qi_eve_keep', 'qi_eve_switch', 'qi_hesitation_strike', 'qi_hesitation_wait', 'qi_ending_slay', 'qi_ending_ferry', 'qi_ending_release', 'qi_ending_stay'].every(id => cm.indexOf("'" + id + "'") >= 0), 'A2 终幕抉择全部入选择记忆');
    ok(read('js/quest/qi-arc1.js').indexOf('qiFinaleButtons') >= 0, 'A3 枢纽面板注入终幕按钮位');
    ok(read('js/quest/qi-arc4.js').indexOf('_qiSettleExtraD') >= 0 && read('js/quest/qi-finale.js').indexOf('endgame_') < 0, 'A4 战斗四路分流到底 + 终幕零旧旗标');
    ok(read('tests/run-all.sh').indexOf('qi-batch5-node.js') >= 0, 'A5 本套件已入回归清单');
}

// ============ 运行时沙箱 ============
function makeWorld(opts) {
    opts = opts || {};
    var logs = [], modals = [], overlays = [], choices = [], day = opts.day || 900;
    var realmOrder = ['凡人', '炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'];
    var W = {
        console: { log: function () {} },
        Math: Math, JSON: JSON, Object: Object, Array: Array, String: String, Number: Number, isFinite: isFinite, RegExp: RegExp,
        eventFlags: {},
        currentCharData: { realm: opts.realm || '渡劫', gender: opts.gender || 'male', name: '测试', fame: 0, sect: '散修', bonds: {} },
        npcManager: { getNPC: function () { return { name: '阿蘅' }; } },
        inventory: { currency: { spiritStones: 5000 } },
        updateCurrencyUI: function () {},
        gameLog: { add: function (m) { logs.push(String(m)); } },
        showMessage: function (m) { logs.push(String(m)); },
        showModal: function (title, body) { modals.push({ title: String(title), body: String(body) }); },
        recordChoice: function (id) { choices.push(id); },
        getRealmTier: function (r) { var i = realmOrder.indexOf(r); return i < 0 ? 6 : i; },
        addFame: function (n) { W._fame = (W._fame || 0) + (n || 0); },
        gainCultivationBonus: function () {},
        addItem: function (id) { (W._items = W._items || []).push(id); return true; },
        itemById: {}, allItems: [], materials: [],
        timeSystem: { getAbsoluteDay: function () { return day; }, onNewDaySubscribe: function (fn) { (W._dayHooks = W._dayHooks || []).push(fn); } },
        startBattle: function (e) { W._lastEnemy = e; return { _stub: true }; },
        acceptQuest: function () {},
        updateQuestUI: function () {},
        QuestRegistry: (function () { var m = {}; return { registerMany: function (arr) { arr.forEach(function (q) { m[q.id] = q; }); }, get: function (id) { return m[id] || null; } }; })(),
        mainQuestChain: [],
        StateRegistry: { register: function () {} },
        QI_CONCENTRATION: {
            '大漠孤城': { base: 0.8, desc: '沙漠之地' }, '冰原城': { base: 1.3, desc: '冰雪' }, '万毒谷': { base: 1.2, desc: '毒瘴' },
            '青木城': { base: 1.5, desc: '木灵' }, '剑阁': { base: 1.5, desc: '剑气' }, '炎城': { base: 1.4, desc: '火灵' },
            '洛水城': { base: 1.1, desc: '水畔' }, '帝都·长安': { base: 1.0, desc: '帝都' }
        },
        globalQiLevel: 30,
        depleteQi: function (a) { W.globalQiLevel = Math.max(0, W.globalQiLevel - (a || 1)); },
        restoreWorldQi: function (a) { W.globalQiLevel = Math.min(100, W.globalQiLevel + (a || 5)); },
        document: { getElementById: function () { return null; }, body: { insertAdjacentHTML: function (pos, h) { overlays.push(String(h)); } } },
        _logs: logs, _modals: modals, _overlays: overlays, _choices: choices,
        _setDay: function (d) { day = d; }, _bumpDay: function (n) { day += n; (W._dayHooks || []).forEach(function (fn) { fn(); }); }
    };
    W.window = W;
    var ctx = vm.createContext(W);
    ['js/quest/qi-world.js', 'js/quest/qi-arc1.js', 'js/quest/qi-arc2.js', 'js/quest/qi-arc3.js', 'js/quest/qi-arc4.js', 'js/quest/qi-finale.js'].forEach(function (rel) {
        vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel });
    });
    return W;
}
function allText(W) {
    return W._logs.join('|') + '|' + W._modals.map(m => m.title + m.body).join('|') + '|' + W._overlays.join('|');
}
function seedCommon(W, route) {
    W.eventFlags['qi_prologue_started'] = true;
    W.eventFlags['qi_prologue_done'] = true;
    W.eventFlags['qi_route'] = route;
    W.eventFlags['qi_anchor_day'] = 100;
    W.eventFlags['qi_stage'] = 3;
    ['大漠孤城', '冰原城', '万毒谷', '青木城', '剑阁', '炎城', '洛水城', '帝都·长安'].forEach(c => { W.eventFlags['qi_withered_' + c] = 500; });
}

// ============ P 对抗盘 · 斩（帮满+两放两斩+签盟+公示+作揖+中幕答实话） ============
var WP = makeWorld({ realm: '渡劫', gender: 'male' });
{
    seedCommon(WP, 'oppose');
    var f = WP.eventFlags;
    f['_qi_chen'] = 'stone'; f['_qi_liu'] = 'buy'; f['_qi_yu'] = 'guard'; f['_qi_zhou'] = 'name';
    f['qi_c11'] = f['qi_c12'] = f['qi_c13'] = f['qi_c14'] = f['qi_c15'] = f['qi_c16'] = f['qi_c17'] = f['qi_c18'] = true;
    f['qi_boss1_fate'] = 'spare'; f['qi_boss2_fate'] = 'slay'; f['qi_boss3_fate'] = 'spare'; f['qi_boss4_fate'] = 'slay';
    f['qi_motive'] = 'life'; f['qi_tablet'] = 'bowed'; f['qi_alliance'] = 'sign';
    f['qi_truth'] = 'publish'; f['qi_opinion_turned'] = true; f['qi_interlude'] = 'answer';
    WP.addQiGrace('测试恩一笔'); // 柳四娘等恩列由名册读旗生成，这里只垫账
    WP.openQiEndgamePanel();
    ok(WP._modals.map(m => m.body).join('').indexOf('脉尽头前夜') >= 0, 'P1 面板终幕入口（八章毕+渡劫修为）');
    WP.qiStartFinale();
    ok(WP._overlays.join('').indexOf('只此一夜，你还可以换一条路') >= 0, 'P2 三幕前夜：唯一改道窗口逐字');
    WP.qiEveChoice('keep');
    var t = WP._overlays.join('');
    ok(t.indexOf('杜无忧') >= 0 && t.indexOf('沙量') >= 0 && t.indexOf('霍无霜') < 0, 'P3 到场姿态：名册到场站你身后（斩者不到场）');
    ok(t.indexOf('他们收的是税，不是公道') >= 0 && t.indexOf('最后一茬不肯跪的') >= 0, 'P4 三方战背靠背开场（11.4⑦对抗线逐字）');
    ok(t.indexOf('你也在盟的保护之列') >= 0, 'P5 签盟讽刺：盟军助战但被保护的人说不出保护');
    ok(t.indexOf('转身离开——账，不是非清不可') >= 0, 'P6 终战前任一时点可转身（不飞升入口）');
    WP.qiWaveFight();
    ok(WP._lastEnemy && WP._lastEnemy.name === '管事·执镰者' && WP._lastEnemy._isQiStory === true, 'P7 首波真仗（主要来杀她——收税的）');
    WP.settleQiBattle(false, 'fin_w1');
    ok(WP.eventFlags['qi_e_scene'] === 'e_w1_battle' && WP.eventFlags['qi_fin_fought'] == null, 'P8 波次败=可再战');
    WP.qiResumeFinale();
    WP.settleQiBattle(true, 'fin_w1');
    t = WP._overlays.join('');
    ok(t.indexOf('门后要是有好东西，本座六成——骗你的，五五分') >= 0, 'P9 首波打退后男版专属一句（11.4⑦）');
    ok(t.indexOf('一刀之恩，今日还') >= 0 && t.indexOf('镖是你') >= 0, 'P10 还命：被放者逐波各一句（杜无忧/沙量）');
    ok(t.indexOf('那枚灵石我没能用上，但收着了') >= 0, 'P11 还命：塞灵石版陈五久（序幕账兑现）');
    ok(t.indexOf('我不懂大事。他们去哪儿，我去哪儿') >= 0, 'P12 还命：记过名且矿场救回→婆婆到场');
    WP.qiWaveFight();
    ok(WP._lastEnemy && WP._lastEnemy.name === '管事·拽锁人', 'P13 名册厚=波数省（两波账，界面只见名字不见数字）');
    WP.settleQiBattle(true, 'fin_w2');
    ok(WP.eventFlags['qi_fin_fought'] === true && WP.QuestRegistry.get('main_056').completed, 'P14 三方战毕、章节闭环');
    t = WP._overlays.join('');
    ok(t.indexOf('为那些被截断的命') >= 0 && t.indexOf('你护住了吗') >= 0, 'P15 犹豫拍：「图什么」原样奉还（补丁①）');
    ok(t.indexOf('本座不躲——本座想看看，你会不会犹豫') >= 0, 'P16 她站定不躲逐字');
    WP.qiHesitation('strike');
    t = allText(WP);
    ok(t.indexOf('肯亲手拆自己脚下这一级的') >= 0 && t.indexOf('替本座看看') >= 0, 'P17 刺下去：男版笑（11.4③换皮定稿）');
    ok(t.indexOf('你还是选了那把梯子') >= 0 && t.indexOf('说完，是笑的') >= 0, 'P18 她死前看着你不看天（结局表逐字）');
    ok(WP.eventFlags['qi_ending'] === 'slay' && WP.globalQiLevel === 50 && WP._choices.indexOf('qi_ending_slay') >= 0, 'P19 斩结局入档：坝溃气归脉（总闸回补）但不回上古');
    t = WP._overlays.join('');
    ok(t.indexOf('末法时代') >= 0 && t.indexOf('梯子还在，收割照旧') >= 0, 'P20 斩结局页：末法时代世界段');
    ok(t.indexOf('盟册上写着，你也在盟的保护之列') >= 0 && t.indexOf('说书人的开场白') >= 0 && t.indexOf('多喝了一杯') >= 0, 'P21 账单页脚：签盟讽刺+公示+作揖三笔小字（结局×关键账分流）');
    ok(['main_056', 'main_057', 'main_058'].every(id => WP.QuestRegistry.get(id).completed), 'P22 三幕章节全闭环');
    WP.qiShowEndingPage();
    ok(WP._overlays.join('').indexOf('斩 · 末法时代') >= 0, 'P23 结局页可回望（面板「回望那一页」）');
}

// ============ Q 追随盘 · 渡（交心八十分：认真答+写名+宽办+劝改道） ============
var WQ = makeWorld({ realm: '渡劫', gender: 'female' });
{
    seedCommon(WQ, 'follow');
    var f = WQ.eventFlags;
    f['qi_s01'] = f['qi_s02'] = f['qi_s03'] = f['qi_s04'] = f['qi_s05'] = f['qi_s06'] = true;
    f['qi_task'] = 'lenient'; f['qi_muster'] = 'divert'; f['qi_talk'] = 'earnest';
    f['qi_debt_choice'] = 'write'; f['qi_debt_name'] = true; f['qi_crisis'] = 'detour';
    f['qi_truth_told'] = true; f['qi_s06_won'] = true;
    WQ.addQiHeartBond(20); WQ.addQiHeartBond(20); WQ.addQiHeartBond(20); WQ.addQiHeartBond(20);
    ok(WQ.qiHeartBondProbe() === 80 && WQ.qiHeartBondTitle() === '知心', 'Q1 交心账：只报称号不报数（知心档）');
    WQ.qiStartFinale();
    ok(WQ._overlays.join('').indexOf('改立她对面') >= 0, 'Q2 前夜改道窗口：追随→对抗入口在（最重的背叛戏）');
    WQ.qiEveChoice('keep');
    ok(WQ._overlays.join('').indexOf('她就站在你身边，半步没离开') >= 0, 'Q3 到场姿态：追随线她并肩');
    WQ.qiWaveFight(); WQ.settleQiBattle(true, 'fin_w1');
    WQ.qiWaveFight(); WQ.settleQiBattle(true, 'fin_w2');
    var t = WQ._overlays.join('');
    ok(t.indexOf('梯子倒了以后的世界，你懂吗') >= 0 && t.indexOf('本座请你看到底') >= 0, 'Q4 犹豫拍回响：崖边夜话+债册写名双兑现');
    WQ.qiHesitation('wait');
    ok(WQ._logs.join('').indexOf('犹豫就对了') >= 0 && WQ._logs.join('').indexOf('后来都成了管事') >= 0, 'Q5 犹豫一瞬：她笑而不谴责（两种笑都不改结局池）');
    ok(WQ._overlays.join('').indexOf('渡——留她性命，废她修为') >= 0 && WQ._overlays.join('').indexOf('没吃过一碗') < 0, 'Q6 渡门槛过（吃过一碗/看过债册的人走得到）——按钮不锁');
    WQ.qiEnding('ferry');
    t = WQ._overlays.join('');
    ok(t.indexOf('一家一块，没有一块是整的') >= 0, 'Q7 无阵眼灵石版：囚阵用百姓凑的灵石点（渡门槛另有路径）');
    ok(t.indexOf('你是头一个对本座说『你要负责』的人') >= 0, 'Q8 她不反抗：问责=把她当人（11.1）');
    ok(t.indexOf('最后一页不再是空白') >= 0, 'Q9 债册写名专属变体兑现');
    ok(t.indexOf('概不退换') >= 0 && t.indexOf('本座被她调戏了很多年') >= 0, 'Q10 深交心变体：血玉段（11.4④）+页脚留白（女版代词分流）');
    ok(t.indexOf('你隔三差五去送饭') >= 0 && t.indexOf('坝未开，蓄气百年缓渗') >= 0, 'Q11 渡世界段：灵气半回、末法减轻');
    ok(WQ.globalQiLevel === 42 && WQ.eventFlags['qi_ending'] === 'ferry', 'Q12 渡结局入档+总闸缓渗回补');
}

// ============ R 无视盘 · 放（接酒：她替你挡一波；三百口还命） ============
var WR = makeWorld({ realm: '渡劫', gender: 'male' });
{
    seedCommon(WR, 'ignore');
    var f = WR.eventFlags;
    f['qi_h01'] = f['qi_h02'] = f['qi_h03'] = f['qi_h04'] = f['qi_h05'] = f['qi_h06'] = true;
    f['qi_kin'] = 'took'; f['qi_knock1'] = 'went'; f['qi_knock2'] = 'escort'; f['qi_knock3'] = 'wine';
    f['qi_finale_ignore'] = 'go';
    WR.addQiHeartBond(20);
    WR.qiStartFinale();
    WR.qiEveChoice('keep');
    var t = WR._overlays.join('');
    ok(t.indexOf('你带着那坛酒来的') >= 0 && t.indexOf('有一波，她会替你挡') >= 0, 'R1 到场姿态：无视线带酒（她替你挡一波预告）');
    WR.qiWaveFight(); WR.settleQiBattle(true, 'fin_w1');
    t = WR._overlays.join('');
    ok(t.indexOf('灯下半日，今日还') >= 0 && t.indexOf('家里那双筷子，今日用上了') >= 0, 'R2 还命：三百口走千里+收留的旧识拎菜刀（无视线账兑现）');
    WR.qiWaveFight();
    ok(WR._lastEnemy == null || WR._lastEnemy.name !== '管事·拽锁人', 'R3 次波她替你挡（接酒兑现——这一波不开战）');
    ok(WR._logs.join('').indexOf('这一波，两清') >= 0, 'R4 挡波台词：那坛酒，本座记着');
    WR.qiWaveFight();
    ok(WR._lastEnemy && WR._lastEnemy.name === '管事之首·司稼者', 'R5 末波管事之首亲至');
    WR.settleQiBattle(true, 'fin_w3');
    ok(WR._overlays.join('').indexOf('你来，就有你一份') >= 0 && WR._overlays.join('').indexOf('本座留到了现在') >= 0, 'R6 犹豫拍回响：接酒版「你的一份」');
    WR.qiHesitation('wait');
    WR.qiEnding('release');
    t = WR._overlays.join('');
    ok(t.indexOf('她没有回头') >= 0 && t.indexOf('这一界再没有人知道了') >= 0, 'R7 放：裂缝在她身后合拢');
    ok(t.indexOf('本座欠过谁一碗面') < 0 && t.indexOf('平民的孩子不再被宗门抱走') >= 0, 'R8 交心未到深档：无半坛变体（情分实质化，不白给）+仙路终结世界段');
    ok(WR.globalQiLevel === 30 && WR.eventFlags['qi_ending'] === 'release', 'R9 放结局：灵脉永空（总闸不回补）');
}

// ============ S 不飞升三变体 ============
{
    // S1 无视·终拍不去（旁观·过客 + 窗台新坛字条）
    var WS = makeWorld({ realm: '大乘', gender: 'male' });
    seedCommon(WS, 'ignore');
    WS.eventFlags['qi_h06'] = true; WS.eventFlags['qi_finale_ignore'] = 'stay'; WS.eventFlags['qi_knock3'] = 'window';
    WS.openQiEndgamePanel();
    ok(WS._modals.map(m => m.body).join('').indexOf('你没去') >= 0, 'S1 终拍不去：面板给「把那天的账结了吧」（锁去不锁不去）');
    WS.qiShowStayEnding();
    var t = WS._overlays.join('');
    ok(t.indexOf('旁观 · 过客') >= 0 && t.indexOf('后来他去买了菜') >= 0, 'S2 不飞升·旁观变体：买菜与十八个版本');
    ok(t.indexOf('新时代缺个见证人。替本座活着看看') >= 0 && t.indexOf('从「不舍得」，变成了「受托」') >= 0, 'S3 窗台换新坛+字条逐字（新增余韵）');
    ok(t.indexOf('可窗台上那坛酒，比什么账都沉') >= 0, 'S4 账单页脚余韵最重一行');
    // S2 对抗·坝前转身
    var WS2 = makeWorld({ realm: '渡劫', gender: 'male' });
    seedCommon(WS2, 'oppose');
    ['qi_c11', 'qi_c12', 'qi_c13', 'qi_c14', 'qi_c15', 'qi_c16', 'qi_c17', 'qi_c18'].forEach(k => { WS2.eventFlags[k] = true; });
    WS2.qiStartFinale(); WS2.qiEveChoice('keep');
    WS2.qiEnding('stay');
    t = WS2._overlays.join('');
    ok(t.indexOf('站到了血海坝前，最后没有写那一笔') >= 0 && t.indexOf('账，不是非清不可') >= 0, 'S5 对抗版不飞升：追了半生，账两讫');
    // S3 追随·下山开面馆
    var WS3 = makeWorld({ realm: '渡劫', gender: 'female' });
    seedCommon(WS3, 'follow');
    ['qi_s01', 'qi_s02', 'qi_s03', 'qi_s04', 'qi_s05', 'qi_s06'].forEach(k => { WS3.eventFlags[k] = true; });
    WS3.qiStartFinale(); WS3.qiEveChoice('keep');
    WS3.qiEnding('stay');
    t = WS3._overlays.join('');
    ok(t.indexOf('你在山下开了一间面馆') >= 0 && t.indexOf('你总多摆一双筷子') >= 0, 'S6 追随版不飞升：那碗热汤面煮给自己吃');
    ok(t.indexOf('不飞升 · 山下面馆') >= 0, 'S7 三线专属变体名（结局即关系）');
}

// ============ T 三幕前夜改道 ============
{
    // T1 对抗→追随：债册多一页「他来得晚」
    var WT = makeWorld({ realm: '渡劫', gender: 'male' });
    seedCommon(WT, 'oppose');
    ['qi_c11', 'qi_c12', 'qi_c13', 'qi_c14', 'qi_c15', 'qi_c16', 'qi_c17', 'qi_c18'].forEach(k => { WT.eventFlags[k] = true; });
    WT.qiStartFinale();
    WT.qiEveChoice('follow');
    ok(WT.eventFlags['qi_route'] === 'follow' && WT.eventFlags['qi_came_late'] === true, 'T1 改道：对抗→追随（债册「他来得晚」旗）');
    ok(WT._logs.join('').indexOf('来得晚，也是来了') >= 0, 'T2 她收你：来得晚也是来了');
    ok(WT._overlays.join('').indexOf('她就站在你身边') >= 0, 'T3 改道后到场姿态即换（追随版）');
    // T2 追随→对抗：背叛戏专属犹豫拍
    var WT2 = makeWorld({ realm: '渡劫', gender: 'male' });
    seedCommon(WT2, 'follow');
    ['qi_s01', 'qi_s02', 'qi_s03', 'qi_s04', 'qi_s05', 'qi_s06'].forEach(k => { WT2.eventFlags[k] = true; });
    WT2.eventFlags['qi_truth_told'] = true;
    WT2.qiStartFinale();
    WT2.qiEveChoice('oppose');
    ok(WT2.eventFlags['qi_betrayal'] === true && WT2._logs.join('').indexOf('她依旧不躲') >= 0, 'T4 改道：追随→对抗=最重背叛戏（预告）');
    WT2.addQiHeartBond(60);
    WT2.qiWaveFight(); WT2.settleQiBattle(true, 'fin_w1');
    WT2.qiWaveFight(); WT2.settleQiBattle(true, 'fin_w2');
    WT2.qiWaveFight(); WT2.settleQiBattle(true, 'fin_w3');
    var t = WT2._overlays.join('');
    ok(t.indexOf('本座早知道会有这一天。还是想看看') >= 0, 'T5 背叛专属犹豫拍逐字（11.5）');
    ok(t.indexOf('你替本座拆过坝') >= 0, 'T6 改道者回响兜底（没有剑阁旧话，还的是另一笔账）');
    WT2.qiHesitation('wait');
    ok(WT2._overlays.join('').indexOf('渡——留她性命') >= 0, 'T7 追随旧账仍在：改道者渡门槛按交心账过');
}

// ============ E 文案纪律 ============
{
    var t = [WP, WQ, WR, WT, WT2].map(allText).join('|').replace(/<[^>]+>/g, '').replace(/第\d+日/g, '');
    ok(!/[A-Za-z]/.test(t), 'E1 批五玩家可见文本零外文字母');
    ok(t.indexOf('次数') < 0 && t.indexOf('上限') < 0, 'E2 零配额句式');
    ok(t.indexOf('妹妹') < 0 && t.indexOf('姐姐') < 0, 'E3 年龄铁设定不破');
    ok(t.indexOf('鼎炉') < 0 && t.indexOf('气运') < 0, 'E4 旧设定词清零');
    ok(t.indexOf('轮回') < 0 && t.indexOf('下周目') < 0 && t.indexOf('转世') < 0, 'E5 零轮回暗示（纪律⑦：仅主线无轮回）');
    ok(!/[0-9]/.test(t), 'E6 玩家文本零裸数值（波数/折敌/交心全内读）');
    ok(t.indexOf('被收') < 0, 'E7 「被收」结局已删（纪律：四结局之外无立场）');
}

// ============ U 批七补缺：终战兑现六处 + 盘问国师 + 结局页四件呈示 ============
{
    // U1 公示→她到场第一句
    var U1 = makeWorld({ realm: '渡劫', gender: 'female' });
    seedCommon(U1, 'oppose');
    U1.eventFlags['qi_c18'] = true; U1.eventFlags['qi_truth'] = 'publish';
    U1.qiStartFinale(); U1.qiEveChoice('keep');
    ok(U1._overlays.join('').indexOf('你是会说出去的人') >= 0 && U1._overlays.join('').indexOf('等了三万年') >= 0, 'U1 公示兑现：她到场第一句「你是会说出去的人」');
    // U2 烧掉→犹豫拍当面点破 + U3 加信答实话→她想起那句
    var U2 = makeWorld({ realm: '渡劫', gender: 'male' });
    seedCommon(U2, 'oppose');
    U2.eventFlags['qi_c18'] = true; U2.eventFlags['qi_truth'] = 'burn'; U2.eventFlags['qi_interlude'] = 'answer'; U2.eventFlags['qi_motive'] = 'city';
    U2.qiStartFinale(); U2.qiEveChoice('keep');
    U2.qiWaveFight(); U2.settleQiBattle(true, 'fin_w1');
    U2.qiWaveFight(); U2.settleQiBattle(true, 'fin_w2');
    U2.qiWaveFight(); U2.settleQiBattle(true, 'fin_w3');
    var t2 = U2._overlays.join('');
    ok(t2.indexOf('你烧掉的那卷东西，本座背得出来') >= 0, 'U2 烧掉兑现：终战她当面点破（不再只躺在页脚）');
    ok(t2.indexOf('这句话，本座记了三年') >= 0 && t2.indexOf('红线停的那一天') >= 0, 'U3 加信答实话兑现：定账时她想起那句');
    // U4 情分至深×刺下去=专属一句
    U2.addQiHeartBond(80);
    U2.qiHesitation('strike');
    ok(U2._logs.join('').indexOf('别难过太久——一天就够了') >= 0 && U2._logs.join('').indexOf('陪到了本座心里') >= 0, 'U4 情分≥深×刺下去：专属一句（天下只有你听过）');
    // U5 危机沉默→还命人群里有炎城逃出来的人
    var U5 = makeWorld({ realm: '渡劫', gender: 'male' });
    seedCommon(U5, 'follow');
    U5.eventFlags['qi_s06'] = true; U5.eventFlags['qi_crisis'] = 'silent'; U5.eventFlags['qi_crisis_fallen'] = true;
    U5.qiStartFinale(); U5.qiEveChoice('keep');
    U5.qiWaveFight(); U5.settleQiBattle(true, 'fin_w1');
    ok(U5._overlays.join('').indexOf('从炎城逃出来的人') >= 0 && U5._overlays.join('').indexOf('他们替着来了') >= 0, 'U5 危机沉默兑现：三千口的账，逃出来的人替着到场');
    // U6 无视看过名册→到场变体+街谈一条
    var U6 = makeWorld({ realm: '渡劫', gender: 'male' });
    seedCommon(U6, 'ignore');
    U6.eventFlags['qi_h06'] = true; U6.eventFlags['qi_finale_ignore'] = 'go'; U6.eventFlags['qi_knock1'] = 'went';
    U6.qiStartFinale(); U6.qiEveChoice('keep');
    ok(U6._overlays.join('').indexOf('守脉盟那份名册，你去看过') >= 0 && U6._overlays.join('').indexOf('让你看个真的') >= 0, 'U6 看名册旗兑现：三幕到场变体');
    ok(U6.qiStreetProbe().some(x => x.text.indexOf('站在血海坝前') >= 0), 'U6b 到场变体配街谈一条');
    // U7 盘问国师：拦路拍→追内情→终战少一波
    var U7 = makeWorld({ realm: '渡劫', gender: 'male' });
    seedCommon(U7, 'oppose');
    for (var gi = 0; gi < 5; gi++) U7.addQiGrace('垫账第' + gi + '笔');
    U7.eventFlags['qi_alliance'] = 'refuse';
    U7.qiTrialResolve();
    ok(U7._overlays.join('').indexOf('拦住去路——元辰子还没走远') >= 0, 'U7a 翻案后拦路拍入口（账厚线专属）');
    U7.qiPreceptorChoice('press');
    ok(U7.eventFlags['qi_preceptor_intel'] === 2 && U7.qiLedgerProbe().hearts.some(e => e.text.indexOf('请你留在门内') >= 0), 'U7b 追内情：两笔内情旗+人心簿');
    ok(U7._overlays.join('').indexOf('天锁论') >= 0 || U7._overlays.join('').indexOf('收租管道') >= 0, 'U7c 内情拍接上当夜密档库（时序不断）');
    var U7b = makeWorld({ realm: '渡劫', gender: 'male' });
    seedCommon(U7b, 'oppose');
    U7b.eventFlags['qi_c18'] = true; U7b.eventFlags['qi_preceptor_intel'] = 2;
    U7b.qiStartFinale(); U7b.qiEveChoice('keep');
    U7b.qiWaveFight(); U7b.settleQiBattle(true, 'fin_w1');
    U7b.qiWaveFight(); U7b.settleQiBattle(true, 'fin_w2');
    ok(U7b.eventFlags['qi_fin_fought'] === true, 'U7d 内情满两笔=终战少一波（三波账打成两波，界面不报数）');
    // U7e 问罪版：名望+人心簿讨回
    var U7c = makeWorld({ realm: '渡劫', gender: 'male' });
    seedCommon(U7c, 'oppose');
    U7c.eventFlags['qi_alliance'] = 'tear';
    for (var gj = 0; gj < 5; gj++) U7c.addQiGrace('垫账第' + gj + '笔');
    U7c.qiTrialResolve(); U7c.qiPreceptorChoice('condemn');
    ok(U7c._fame >= 20 && U7c.qiLedgerProbe().hearts.some(e => e.text.indexOf('讨了回来') >= 0), 'U7e 问罪：名望涨+构陷笔亲手讨回');
    // U8 结局页四件呈示（修为/宗门/建筑/道侣）
    var U8 = makeWorld({ realm: '渡劫', gender: 'female', bonds: { npc_x: { type: 'dao_companion' } } });
    U8.currentCharData.sect = '七霞派';
    seedCommon(U8, 'oppose');
    U8.qiEnding('ferry');
    var t8 = U8._overlays.join('');
    ok(t8.indexOf('尾声 · 你的下场') >= 0 && t8.indexOf('修为') >= 0 && t8.indexOf('七霞派') >= 0 && t8.indexOf('建筑') >= 0 && t8.indexOf('道侣') >= 0, 'U8 渡结局页：四件呈示齐（宗门读真名）');
    ok(t8.indexOf('去井边的那条绕路') >= 0, 'U8b 渡版修为呈示（送饭绕路——只叙事不扣数值）');
    var U8b = makeWorld({ realm: '渡劫', gender: 'male' });
    seedCommon(U8b, 'ignore');
    U8b.eventFlags['qi_h06'] = true; U8b.eventFlags['qi_finale_ignore'] = 'stay';
    U8b.qiShowStayEnding();
    var t8b = U8b._overlays.join('');
    ok(t8b.indexOf('修为一天天废下去') >= 0 && t8b.indexOf('散修') >= 0 && t8b.indexOf('烟囱') >= 0, 'U8c 放/不飞升版呈示：修为废下去+散修宗门变体+建筑烟火');
    ok(t8b.indexOf('人间都在等你') >= 0, 'U8d 无道侣变体（不硬造家里人）');
    // U9 纪律：新增文本零外文字母
    var tu = ([U1, U2, U5, U6, U7, U7b, U7c, U8, U8b].map(allText).join('|')).replace(/<[^>]+>/g, '').replace(/第\d+日/g, '').replace(/垫账第笔/g, '');
    ok(!/[A-Za-z]/.test(tu), 'U9 补缺文本零外文字母');
}

console.log('qi-batch5: ' + passed + ' passed, ' + failures.length + ' failed');
if (failures.length) { failures.forEach(f => console.log('  FAIL: ' + f)); process.exit(1); }
