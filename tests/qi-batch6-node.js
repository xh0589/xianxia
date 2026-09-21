// ==================== v25.0《灵气之尽》批六验收：街谈库 · 舆论弧线 · 分城腔 · 大事记/图鉴 ====================
// 对齐：主线大纲·灵气之尽.md 第五节（骂她→困惑→长生牌→点灯→新时代；两种感激并存不裁决）+ 批二 C9 街谈分城腔 + 第十节批六
// 覆盖：A 接线 / B 舆论弧线五段推进 / C 分城腔与三十日不刷屏 / D 茶馆插块 / E 大事记+图鉴落笔 / F 账本语义收口 / G 文案纪律
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
    ok(read('仙侠.html').indexOf('js/quest/qi-street.js') >= 0, 'A1 街谈库已挂脚本位');
    const app = read('js/app.js');
    ok(app.indexOf('qiStreetTeaBlock') >= 0 && app.indexOf('endgameEchoes') < 0, 'A2 茶馆钩子已换血（旧回响系统引用清零）');
    ok(read('js/quest/qi-arc1.js').indexOf('qiOpenStreetTalk') >= 0, 'A3 终局面板挂「街谈」页签');
    const qw = read('js/quest/qi-world.js');
    ok(qw.indexOf('qiStreetCityLine') >= 0 && qw.indexOf('qiJournalNote') >= 0, 'A4 城景叠加接分城腔 + 枯脉/降档落大事记');
    ok(read('js/quest/qi-arc2.js').indexOf('qi_xuanmingzi') >= 0 && read('js/quest/qi-arc2.js').indexOf('qi_tiansuolun') >= 0 && read('js/quest/qi-finale.js').indexOf('qi_ending_') >= 0, 'A5 图鉴落笔点（她/天锁论/结局）');
    ok(read('tests/run-all.sh').indexOf('qi-batch6-node.js') >= 0, 'A6 本套件已入回归清单');
}

// ============ 运行时沙箱 ============
function makeWorld(opts) {
    opts = opts || {};
    var logs = [], modals = [], overlays = [], choices = [], journals = [], codexes = [], day = opts.day || 900;
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
        addFame: function () {}, gainCultivationBonus: function () {},
        addItem: function (id) { (W._items = W._items || []).push(id); return true; },
        itemById: {}, allItems: [], materials: [],
        WorldJournal: { record: function (e) { journals.push(e); return { ok: true }; } },
        Codex: { discover: function (t, id, info) { codexes.push({ type: t, id: id, info: info }); return { ok: true }; } },
        timeSystem: { getAbsoluteDay: function () { return day; }, onNewDaySubscribe: function (fn) { (W._dayHooks = W._dayHooks || []).push(fn); } },
        startBattle: function (e) { W._lastEnemy = e; return { _stub: true }; },
        acceptQuest: function () {}, updateQuestUI: function () {},
        QuestRegistry: (function () { var m = {}; return { registerMany: function (arr) { arr.forEach(function (q) { m[q.id] = q; }); }, get: function (id) { return m[id] || null; } }; })(),
        mainQuestChain: [], StateRegistry: { register: function () {} },
        QI_CONCENTRATION: {
            '大漠孤城': { base: 0.8, desc: '沙漠之地' }, '冰原城': { base: 1.3, desc: '冰雪' }, '万毒谷': { base: 1.2, desc: '毒瘴' },
            '青木城': { base: 1.5, desc: '木灵' }, '剑阁': { base: 1.5, desc: '剑气' }, '炎城': { base: 1.4, desc: '火灵' },
            '洛水城': { base: 1.1, desc: '水畔' }, '帝都·长安': { base: 1.0, desc: '帝都' }
        },
        globalQiLevel: 100,
        depleteQi: function (a) { W.globalQiLevel = Math.max(0, W.globalQiLevel - (a || 1)); },
        restoreWorldQi: function (a) { W.globalQiLevel = Math.min(100, W.globalQiLevel + (a || 5)); },
        document: { getElementById: function () { return null; }, body: { insertAdjacentHTML: function (pos, h) { overlays.push(String(h)); } } },
        _logs: logs, _modals: modals, _overlays: overlays, _choices: choices, _journals: journals, _codexes: codexes,
        _setDay: function (d) { day = d; }, _bumpDay: function (n) { day += n; (W._dayHooks || []).forEach(function (fn) { fn(); }); }
    };
    W.window = W;
    var ctx = vm.createContext(W);
    ['js/quest/qi-world.js', 'js/quest/qi-arc1.js', 'js/quest/qi-arc2.js', 'js/quest/qi-arc3.js', 'js/quest/qi-arc4.js', 'js/quest/qi-finale.js', 'js/quest/qi-street.js'].forEach(function (rel) {
        vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel });
    });
    return W;
}
function allText(W) {
    return W._logs.join('|') + '|' + W._modals.map(m => m.title + m.body).join('|') + '|' + W._overlays.join('|');
}
function seedRoute(W, route) {
    W.eventFlags['qi_prologue_started'] = true;
    W.eventFlags['qi_prologue_done'] = true;
    W.eventFlags['qi_route'] = route;
    W.eventFlags['qi_anchor_day'] = 100;
}
function witherN(W, n) {
    var cities = ['大漠孤城', '冰原城', '万毒谷', '青木城', '剑阁', '炎城', '洛水城', '帝都·长安'];
    cities.forEach(function (c, i) { if (i < n) W.eventFlags['qi_withered_' + c] = 500; });
}

// ============ B 舆论弧线五段推进（读枯萎旗与主线进度，不读计数器） ============
var WB = makeWorld();
{
    ok(WB.qiStreetPhase() === '', 'B1 账没翻开就静默（未选路无街谈）');
    seedRoute(WB, 'oppose');
    witherN(WB, 1);
    ok(WB.qiStreetPhase() === 'curse' && WB.qiStreetPhaseName() === '骂她', 'B2 头一段：骂她（仙人没了谁护城）');
    witherN(WB, 3);
    ok(WB.qiStreetPhase() === 'puzzle', 'B3 第二段：困惑（粮价没变仙师不来收孩子了）');
    var WB2 = makeWorld();
    seedRoute(WB2, 'oppose'); witherN(WB2, 2);
    WB2.eventFlags['qi_opinion_turned'] = true; WB2.eventFlags['qi_truth'] = 'publish';
    ok(WB2.qiStreetPhase() === 'tablets', 'B4 公示《天锁论》=舆论线提前转向（两段路程一步跨）');
    witherN(WB, 5);
    ok(WB.qiStreetPhase() === 'tablets', 'B5 第三段：长生牌（兽潮前夜香火最旺）');
    witherN(WB, 8);
    ok(WB.qiStreetPhase() === 'lamps', 'B6 第四段：点灯（兽潮那几年重新给修士点灯）');
    WB.qiOpenStreetTalk();
    var b = WB._overlays.join('');
    ok(b.indexOf('点灯') >= 0 && b.indexOf('两样香火一起烧') >= 0, 'B7 街谈面板：她的长生牌与护城灯同框（不裁决）');
    WB.eventFlags['qi_ending'] = 'ferry'; WB.eventFlags['qi_ending_route'] = 'follow';
    WB.qiOpenStreetTalk();
    b = WB._overlays.join('');
    ok(b.indexOf('新时代') >= 0 && b.indexOf('两种感激并存') >= 0 && b.indexOf('都叫「惦记」') >= 0, 'B8 第五段：新时代（两种感激并存+渡结局专属街谈）');
    // 真账区：qi_street 缓冲入面板
    WB.eventFlags['qi_street'] = [{ day: 501, text: '测试街谈一笔' }];
    WB.qiOpenStreetTalk();
    ok(WB._overlays.join('').indexOf('你的账，在街上') >= 0 && WB._overlays.join('').indexOf('测试街谈一笔') >= 0, 'B9 街谈库读真账（批二~批五缓冲当场可见）');
}

// ============ C 分城腔 + 三十日不刷屏（批D：每城三句，按枯龄60日轮换） ============
var WC = makeWorld({ day: 900 });
{
    seedRoute(WC, 'oppose');
    ok(WC.qiStreetCityLine('大漠孤城') === '', 'C1 未枯城无分城腔（静默）');
    WC.eventFlags['qi_withered_大漠孤城'] = 895; // 枯龄5日 → 第一句
    ok(WC.qiStreetCityLine('大漠孤城').indexOf('驼队改运粮') >= 0, 'C2 初枯（枯龄<60日）：分城腔头一句（驼队改运粮）');
    ok(WC.qiStreetCityLine('大漠孤城') === '', 'C3 三十日内不刷屏（同一座城沉默）');
    WC._setDay(930);
    ok(WC.qiStreetCityLine('大漠孤城') !== '', 'C4 三十日后街谈再长出来');
    WC._setDay(960); // 枯龄65 → 第二句
    ok(WC.qiStreetCityLine('大漠孤城').indexOf('捎回一句话') >= 0, 'C5 枯龄满60日：腔调换第二句（城的日子也在走）');
    WC.eventFlags['qi_withered_炎城'] = 955; // 枯龄5 → 头一句
    ok(WC.qiStreetCityLine('炎城').indexOf('头一场雪收进匣子') >= 0, 'C6 炎城初枯腔（雪与「火」字匣）');
    // 进城叠加：城景+街谈一次给全（大漠枯龄95→第二句）
    WC._setDay(990);
    var ov = WC.qiCityOverlay('大漠孤城');
    ok(ov.indexOf('井还是甜的') >= 0 && ov.indexOf('捎回一句话') >= 0, 'C7 进城叠加=城景三段式+枯龄分城腔一次给全');
    WC.eventFlags['qi_stage'] = 3;
    var ov2 = WC.qiCityOverlay('洛水城');
    ok(ov2 === '', 'C8 未枯城叠加静默（街谈不越权）');
}

// ============ D 茶馆传闻堂插块 ============
var WD = makeWorld();
{
    ok(WD.qiStreetTeaBlock('洛水城') === '', 'D1 账没翻开茶馆静默（不硬塞）');
    seedRoute(WD, 'ignore');
    witherN(WD, 5);
    WD.eventFlags['qi_withered_剑阁'] = 500;
    var html = WD.qiStreetTeaBlock('剑阁');
    ok(html.indexOf('灵气之尽 · 长生牌') >= 0, 'D2 茶馆插块：舆论段名+说书人转场');
    ok(html.indexOf('剑修们的锄头') >= 0, 'D3 茶馆分城腔（在哪座城说哪座城的事）');
}

// ============ E 大事记 + 图鉴落笔 ============
var WE = makeWorld();
{
    WE.qiWitherCity('大漠孤城');
    ok(WE._journals.some(j => j.title === '灵脉枯' && j.text.indexOf('大漠孤城') >= 0), 'E1 枯脉落大事记');
    WE.eventFlags['qi_route'] = 'oppose';
    WE.qiSetStage(1);
    ok(WE._journals.some(j => j.title === '天地灵气'), 'E2 总闸降档落大事记');
    WE.eventFlags['qi_route'] = null;
    WE.qiRouteChoice('oppose');
    ok(WE._journals.some(j => j.title === '灵气之尽' && j.text.indexOf('三年后的今日') >= 0), 'E3 选路落大事记（期限公示）');
    ok(WE._codexes.some(c => c.id === 'qi_lingqizhijin' && c.type === 'codex_world'), 'E4 图鉴「灵气之尽」条目');
    WE.qiFinishC13();
    ok(WE._codexes.some(c => c.id === 'qi_xuanmingzi' && c.info.name === '玄冥子' && c.info.desc.indexOf('梯子底下长什么样') >= 0), 'E5 图鉴「玄冥子」人物页（初次照面后解锁）');
    ok(WE._journals.some(j => j.title === '剑阁一晤'), 'E6 剑阁一晤落大事记');
    WE.qiTruthChoice('publish');
    ok(WE._codexes.some(c => c.id === 'qi_tiansuolun') && WE._journals.some(j => j.title === '天锁论'), 'E7 天锁论：图鉴+大事记双落笔（公示版）');
    var WT2 = makeWorld();
    seedRoute(WT2, 'oppose');
    WT2.qiEnding('release');
    ok(WT2._codexes.some(c => c.id === 'qi_ending_release' && c.info.name.indexOf('仙路终结') >= 0), 'E8 结局落图鉴（放·仙路终结）');
    ok(WT2._journals.some(j => j.title === '灵气之尽' && j.text.indexOf('裂缝在她身后合拢') >= 0), 'E9 结局落大事记');
    var WT3 = makeWorld();
    seedRoute(WT3, 'follow');
    WT3.qiTruthChoice('burn');
    ok(WT3._codexes.some(c => c.info.desc.indexOf('烧了') >= 0), 'E10 天锁论烧掉版图鉴措辞分流');
}

// ============ F 账本语义收口（人心簿+她的观察） ============
var WF = makeWorld();
{
    seedRoute(WF, 'follow');
    WF.qiTaskChoice('lenient');
    ok(WF.qiLedgerProbe().hearts.some(e => e.text.indexOf('她记着你每一次怎么办差') >= 0), 'F1 宽办=她的观察入人心簿（追随线语义收口）');
    var WF2 = makeWorld();
    seedRoute(WF2, 'follow');
    WF2.qiTaskChoice('refuse');
    ok(WF2.qiLedgerProbe().hearts.some(e => e.text.indexOf('这一笔叫「人」') >= 0), 'F2 不办=她的观察入人心簿（有脾气比听话值钱）');
}

// ============ G 文案纪律 ============
{
    var WB3 = makeWorld();
    seedRoute(WB3, 'oppose'); witherN(WB3, 8);
    WB3.qiOpenStreetTalk();
    WB3.eventFlags['qi_ending'] = 'stay'; WB3.eventFlags['qi_ending_route'] = 'ignore';
    WB3.qiOpenStreetTalk();
    WB3.qiStreetCityLine('大漠孤城');
    WB3.qiStreetTeaBlock('长安');
    WB3.qiStreetTeaBlock('帝都·长安');
    var t = (allText(WB) + '|' + allText(WB3) + '|' + allText(WC) + '|' + allText(WD) + '|' + allText(WE)).replace(/<[^>]+>/g, '').replace(/第\d+日入街/g, '');
    ok(!/[A-Za-z]/.test(t), 'G1 批六玩家可见文本零外文字母');
    ok(t.indexOf('次数') < 0 && t.indexOf('上限') < 0, 'G2 零配额句式');
    ok(t.indexOf('妹妹') < 0 && t.indexOf('姐姐') < 0, 'G3 年龄铁设定不破');
    ok(t.indexOf('裁决哪种') >= 0 && t.indexOf('不裁决') >= 0, 'G4 两种感激并存——街谈不裁决');
}

console.log('qi-batch6: ' + passed + ' passed, ' + failures.length + ' failed');
if (failures.length) { failures.forEach(f => console.log('  FAIL: ' + f)); process.exit(1); }
