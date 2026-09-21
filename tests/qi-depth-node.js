// ==================== 《灵气之尽》日子层验收：城与人记得你 + 枯竭体感 ====================
// 对齐：补厚批 A+B（玩家反馈「内容浅」后的第一批）
// 覆盖：A 接线 / B 城景命运变体 / C 配角回访七段（一次性+门槛） / D 枯竭日子事件（分档+节流+结局停拍） / E 文案纪律
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
    ok(read('仙侠.html').indexOf('js/quest/qi-life.js') >= 0, 'A1 日子层已挂脚本位');
    ok(read('js/quest/qi-world.js').indexOf('qiCityFateLine') >= 0, 'A2 城景叠加接命运变体行');
    ok(read('tests/run-all.sh').indexOf('qi-depth-node.js') >= 0, 'A3 本套件已入回归清单');
}

// ============ 运行时沙箱 ============
function makeWorld(opts) {
    opts = opts || {};
    var logs = [], modals = [], overlays = [], day = opts.day || 100;
    var W = {
        console: { log: function () {} },
        Math: Math, JSON: JSON, Object: Object, Array: Array, String: String, Number: Number, isFinite: isFinite, RegExp: RegExp,
        eventFlags: {},
        currentCharData: { realm: '化神', gender: 'male', name: '测试' },
        inventory: { currency: { spiritStones: 1000 } },
        gameLog: { add: function (m) { logs.push(String(m)); } },
        showMessage: function (m) { logs.push(String(m)); },
        showModal: function (t, b) { modals.push({ title: t, body: b }); },
        recordChoice: function () {},
        getRealmTier: function () { return 5; },
        timeSystem: { getAbsoluteDay: function () { return day; }, onNewDaySubscribe: function (fn) { (W._dayHooks = W._dayHooks || []).push(fn); } },
        QuestRegistry: { registerMany: function () {}, get: function () { return null; } },
        mainQuestChain: [], StateRegistry: { register: function () {} },
        QI_CONCENTRATION: { '万毒谷': { base: 1.2, desc: '毒瘴' }, '炎城': { base: 1.4, desc: '火灵' }, '帝都·长安': { base: 1.0, desc: '帝都' } },
        globalQiLevel: 80, depleteQi: function (a) { W.globalQiLevel -= (a || 1); }, restoreWorldQi: function () {},
        document: { getElementById: function () { return null; }, body: { insertAdjacentHTML: function (p, h) { overlays.push(String(h)); } } },
        _logs: logs, _modals: modals, _overlays: overlays,
        _setDay: function (d) { day = d; }, _bumpDay: function (n) { day += n; (W._dayHooks || []).forEach(function (fn) { fn(); }); }
    };
    W.window = W;
    var ctx = vm.createContext(W);
    ['js/quest/qi-world.js', 'js/quest/qi-arc1.js', 'js/quest/qi-street.js', 'js/quest/qi-life.js'].forEach(function (rel) {
        vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel });
    });
    return W;
}

// ============ B 城景命运变体（斩/放写进城本身） ============
{
    var W = makeWorld();
    W.eventFlags['qi_route'] = 'oppose';
    W.eventFlags['qi_withered_万毒谷'] = 100;
    ok(W.qiCityFateLine('万毒谷') === '', 'B1 没打过那一仗：城景不变脸（不硬造）');
    W.eventFlags['qi_boss1_fate'] = 'spare';
    ok(W.qiCityFateLine('万毒谷').indexOf('续脉丹施') >= 0 && W.qiCityFateLine('万毒谷').indexOf('站着排，不跪了') >= 0, 'B2 放杜无忧：施药摊进了城景');
    W.eventFlags['qi_boss1_fate'] = 'slay';
    ok(W.qiCityFateLine('万毒谷').indexOf('小牌位') >= 0, 'B3 斩杜无忧：废墟牌位版（双代价可见）');
    W.eventFlags['qi_withered_炎城'] = 100; W.eventFlags['qi_boss2_fate'] = 'spare';
    ok(W.qiCityFateLine('炎城').indexOf('公炉还烧着') >= 0, 'B4 放霍无霜：公炉进了城景');
    W.eventFlags['qi_withered_帝都·长安'] = 100; W.eventFlags['qi_boss4_fate'] = 'slay';
    var ov = W.qiCityOverlay('帝都·长安');
    ok(ov.indexOf('九龙灵柱') >= 0 && ov.indexOf('长生牌') >= 0, 'B5 进城叠加=城景三段式+命运变体一次给全');
    W.eventFlags['qi_route'] = null;
    ok(W.qiCityFateLine('炎城') === '', 'B6 账没翻开静默');
}

// ============ C 配角回访（一次性+门槛+两张期票） ============
{
    // C1 柳四娘的苗（期票①：第二幕路过，苗活成一小片）
    var W1 = makeWorld({ day: 100 });
    W1.eventFlags['qi_route'] = 'oppose'; W1.eventFlags['qi_anchor_day'] = 100; W1.eventFlags['_qi_liu'] = 'move';
    W1._bumpDay(30);
    ok(W1._logs.join('').indexOf('活成了一小片') < 0, 'C1 六十日不到，苗还没长成（门槛）');
    W1._setDay(161); W1._bumpDay(0);
    ok(W1._logs.join('').indexOf('活成了一小片') >= 0 && W1.eventFlags['qi_rv_liu'] >= 1, 'C2 期票①兑现：沟里的苗活成了一小片');
    var n0 = W1._logs.length;
    W1._setDay(200); W1._bumpDay(0);
    ok(W1._logs.length === n0, 'C3 回访一次性（不刷屏）');
    // C4 陈五久教字（对抗线·暴涨后）
    var W2 = makeWorld({ day: 500 });
    W2.eventFlags['qi_route'] = 'oppose'; W2.eventFlags['qi_anchor_day'] = 400; W2.eventFlags['qi_c13'] = true;
    W2._setDay(500); W2._bumpDay(0);
    ok(W2._logs.join('').indexOf('教流民的孩子们认字') >= 0, 'C4 陈五久回访：认字比修行要紧（人不在路上蒸发）');
    // C5 旧识学厨（无视·收留）
    var W3 = makeWorld({ day: 600 });
    W3.eventFlags['qi_route'] = 'ignore'; W3.eventFlags['qi_kin'] = 'took'; W3.eventFlags['qi_h02'] = true;
    W3._bumpDay(0);
    ok(W3._logs.join('').indexOf('火候这东西跟行功一个理') >= 0, 'C5 旧识回访：日子薄了，味倒厚了');
    // C6 南边面摊（追随·夜话后）
    var W4 = makeWorld({ day: 700 });
    W4.eventFlags['qi_route'] = 'follow'; W4.eventFlags['qi_anchor_day'] = 500; W4.eventFlags['qi_s04'] = true;
    W4._bumpDay(0);
    ok(W4._logs.join('').indexOf('第二碗，你替一个八岁掉进血海的孩子吃的') >= 0, 'C6 面摊回访：热汤面的账，你替她吃');
    // C7 虞松子扫灯（渡结局+守过阵）
    var W5 = makeWorld({ day: 800 });
    W5.eventFlags['qi_route'] = 'follow'; W5.eventFlags['qi_ending'] = 'ferry'; W5.eventFlags['_qi_yu'] = 'guard';
    W5._bumpDay(0);
    ok(W5._logs.join('').indexOf('阵记得她，他记得阵') >= 0, 'C7 渡结局回访：虞松子扫院子换香');
    // C8 小镇立碑（期票②：终局后该镇立碑刻两行名字）
    var W6 = makeWorld({ day: 900 });
    W6.eventFlags['qi_route'] = 'oppose'; W6.eventFlags['qi_ending'] = 'slay'; W6.eventFlags['_qi_zhou'] = 'name'; W6.eventFlags['qi_c15'] = true;
    W6._bumpDay(0);
    ok(W6._logs.join('').indexOf('周来福，周小满') >= 0 && W6._logs.join('').indexOf('立了块碑') >= 0, 'C8 期票②兑现：碑刻两行名字');
    // C9 赎人版：灯的规矩
    var W7 = makeWorld({ day: 900 });
    W7.eventFlags['qi_route'] = 'oppose'; W7.eventFlags['qi_ending'] = 'release'; W7.eventFlags['_qi_zhou'] = 'redeem';
    W7._bumpDay(0);
    ok(W7._logs.join('').indexOf('给所有回家的人点') >= 0, 'C9 赎人版回访：年三十点灯的规矩');
    // C10 无账不回访（不设锚点，排除世界层时间副推进的正常播报）
    var W8 = makeWorld({ day: 900 });
    W8.eventFlags['qi_route'] = 'oppose'; W8.eventFlags['_qi_liu'] = 'pass';
    W8._bumpDay(0);
    ok(W8._logs.length === 0, 'C10 走开的账不硬造回访（世界不围着你转）');
}

// ============ D 枯竭日子事件（撞上，不是听说） ============
{
    var W = makeWorld({ day: 899 });
    ok((W._bumpDay(1), W._logs.length === 0), 'D1 账没翻开：日子照常，事件静默');
    W.eventFlags['qi_route'] = 'oppose'; W.eventFlags['qi_stage'] = 1;
    W._setDay(908); W._bumpDay(1);
    ok(W._logs.join('').match(/🍂/g) && W._logs.join('').indexOf('🥀') < 0, 'D2 一档事件：丹炉焦/飞舟晚点这一层（撞上）');
    var n0 = W._logs.length;
    W._setDay(910); W._bumpDay(1);
    ok(W._logs.length === n0, 'D3 九日一遇节流（薄，但不缠人）');
    W.eventFlags['qi_stage'] = 2;
    W._setDay(926); W._bumpDay(1);
    ok(W._logs.join('').indexOf('🥀') >= 0, 'D4 二档事件分流（大阵豆子色/疯兽下山这层）');
    W.eventFlags['qi_stage'] = 3;
    W._setDay(944); W._bumpDay(1);
    ok(W._logs.join('').indexOf('🌫️') >= 0, 'D5 三档事件分流（兽潮南迁/井水变甜这层）');
    W.eventFlags['qi_ending'] = 'slay';
    var n1 = W._logs.length;
    W._setDay(962); W._bumpDay(1);
    ok(W._logs.length === n1, 'D6 结局落定后事件停拍（新时代归街谈库）');
}

// ============ E 文案纪律 ============
{
    var all = '';
    var worlds = [];
    for (var st = 1; st <= 3; st++) {
        var W = makeWorld({ day: 900 + st * 9 });
        W.eventFlags['qi_route'] = 'oppose'; W.eventFlags['qi_stage'] = st;
        W._bumpDay(0);
        worlds.push(W);
    }
    var WV = makeWorld();
    WV.eventFlags['qi_route'] = 'oppose';
    ['万毒谷', '炎城', '帝都·长安'].forEach(function (c) { WV.eventFlags['qi_withered_' + c] = 1; });
    ['spare', 'slay'].forEach(function () {});
    WV.eventFlags['qi_boss1_fate'] = 'spare'; WV.eventFlags['qi_boss2_fate'] = 'slay'; WV.eventFlags['qi_boss4_fate'] = 'spare';
    WV.qiCityOverlay('万毒谷'); WV.qiCityOverlay('炎城'); WV.qiCityOverlay('帝都·长安');
    worlds.push(WV);
    all = worlds.map(function (w) { return w._logs.join('|') + '|' + w._overlays.join('|') + '|' + w._modals.map(m => m.body).join('|'); }).join('|');
    var t = all.replace(/<[^>]+>/g, '');
    ok(!/[A-Za-z]/.test(t), 'E1 日子层玩家文本零外文字母');
    ok(t.indexOf('次数') < 0 && t.indexOf('上限') < 0, 'E2 零配额句式');
    ok(t.indexOf('妹妹') < 0 && t.indexOf('姐姐') < 0, 'E3 年龄铁设定不破');
    ok(t.indexOf('鼎炉') < 0 && t.indexOf('气运') < 0, 'E4 旧设定词清零');
}

console.log('qi-depth: ' + passed + ' passed, ' + failures.length + ' failed');
if (failures.length) { failures.forEach(f => console.log('  FAIL: ' + f)); process.exit(1); }
