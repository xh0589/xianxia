/**
 * v20.26-text-thicken-node.js — 恋爱文本去复读加厚：
 * 终章七句一人一样、离别话与交还印逐人重写、两线日常阶梯分家、
 * 撞名标题各归各位、死分支与错账清除、六线中段真取舍（信物落包/甜点换位）
 *
 * 运行：node tests/v20.26-text-thicken-node.js
 */
'use strict';

var path = require('path');
var fs = require('fs');
var vm = require('vm');

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) passed++;
    else { failed++; console.error('[FAIL] ' + msg); }
}
function loadScript(rel) { return fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8'); }
function evSlice(src, evId) {
    var a = src.indexOf("'" + evId + "': {");
    if (a < 0) a = src.indexOf("'" + evId + "'");
    var m = src.slice(a + 5).match(/\n    '(?:jg|ms|su|lu|wx|ts|bh|xl)_event_/);
    var b = m ? a + 5 + m.index : src.length;
    return src.slice(a, b);
}
function runEffects(src, eventId, choice, extraGlobals) {
    var seg = evSlice(src, eventId);
    var eIdx = seg.indexOf('effects: function(npc, choice)');
    if (eIdx < 0) return { error: 'no-effects' };
    var j = seg.indexOf('{', eIdx), depth = 0, k = j;
    for (; k < seg.length; k++) {
        if (seg[k] === '{') depth++;
        else if (seg[k] === '}') { depth--; if (depth === 0) break; }
    }
    var g = { Math: Math };
    if (extraGlobals) for (var key in extraGlobals) g[key] = extraGlobals[key];
    var ctx = vm.createContext(g);
    vm.runInContext('__f=' + 'function(npc, choice) ' + seg.slice(j, k + 1) + ';', ctx);
    return ctx.__f({ relationship: {} }, choice);
}

// ============ A 模板句式清零 + 新句逐线在案 ============
var FINALE = [
    { file: 'js/npcs/jingang-events.js', sig: '断在谁手里' },
    { file: 'js/npcs/maoshan-events.js', sig: '名讳也归你' },
    { file: 'js/npcs/yaowang-events.js', sig: '两个字：同归' },
    { file: 'js/npcs/zhujian-events.js', sig: '改看你' },
    { file: 'js/npcs/wuxian-events.js', sig: '哪儿就是你的家' },
    { file: 'js/npcs/tianshan-events.js', sig: '跟着声响走' },
    { file: 'js/npcs/baihua-events-main.js', sig: '收聘礼' }
];
var allText = FINALE.map(function (F) { return loadScript(F.file); }).join('\n');
FINALE.forEach(function (F) {
    var s = loadScript(F.file);
    assert(s.indexOf('连同') < 0 && s.indexOf('你要不要？') < 0 && s.indexOf(F.sig) >= 0,
        'A[' + F.file + '] 填空式告白已拆，换成本人说法（' + F.sig + '）');
});
assert(allText.indexOf('做个常客，行吗') < 0, 'A+ 「做个常客，行吗」三连印拆除');
['js/npcs/baihua-events-main.js', 'js/npcs/wuxian-events.js', 'js/npcs/tianshan-events.js'].forEach(function (f) {
    var s = loadScript(f);
    assert(s.indexOf('嫌我烦为止') >= 0 || s.indexOf('算五仙教的') >= 0 || s.indexOf('听响我一定到') >= 0,
        'A+[' + f + '] 留一条路的新说法在案');
});
['把法王继承人之印交还鸠摩智。', '把伏魔首席之印交还茅山老祖。', '把谷主继承人之印交还李时珍。',
 '把代掌门的印信交还童姥。', '把少庄主之印交还欧冶子。'].forEach(function (old) {
    assert(allText.indexOf(old) < 0, 'A+ 公文式交还印「' + old.slice(1, 8) + '…」原文退役');
});
['念不起我这本经了', '符好人坏', '留一道缝', '你得在', '想铸了回来'].forEach(function (sig) {
    assert(allText.indexOf(sig) >= 0, 'A+ 交还印新后事在案：' + sig);
});

// ============ B 标题分家与阶梯分家 ============
var xsrc = loadScript('js/npcs/npc-personal-events.js');
var bsrc = loadScript('js/npcs/baihua-events-extra.js');
function ladders(src, pref, out) {
    var re = new RegExp("'" + pref + "_event_0(\\d+)'[^\\n]*?title: '([^']*)'[^\\n]*?minAffection: (\\d+)", 'g');
    var m;
    while ((m = re.exec(src))) {
        var n = Number(m[1]);
        out.push({ n: n, title: m[2], aff: Number(m[3]) });
    }
    return out;
}
var XL = [], BH = [];
ladders(xsrc, 'xl', XL); ladders(bsrc, 'bh', BH);
var xlT = XL.map(function (e) { return e.title; }), bhT = BH.map(function (e) { return e.title; });
var clash = xlT.filter(function (t) { return bhT.indexOf(t) >= 0; });
assert(clash.length === 0, 'B1 两条线 18+18 个小事件再无同名（曾撞：一对杯盏/她记得/她承认了）' + (clash.length ? ' 现存:' + clash.join() : ''));
function dupWithin(arr) { var seen = {}, d = []; arr.forEach(function (t) { if (seen[t]) d.push(t); seen[t] = 1; }); return d; }
assert(dupWithin(bhT).length === 0 && dupWithin(xlT).length === 0, 'B2 线内也不再一题两用（bh_024/029 曾都叫「她记得」）');
var l1 = XL.filter(function (e) { return e.n >= 15 && e.n <= 32; }).map(function (e) { return e.n + ':' + e.aff; }).join(',');
var l2 = BH.filter(function (e) { return e.n >= 15 && e.n <= 32; }).map(function (e) { return e.n + ':' + e.aff; }).join(',');
assert(l1 !== l2 && l1.length > 0 && l2.length === l1.length, 'B3 两条线的靠近节奏不再同梯（18 级全同数字的日子过去了）');
var bh30 = BH.filter(function (e) { return e.n === 30; })[0];
var bh17 = BH.filter(function (e) { return e.n === 17; })[0];
assert(bh30 && bh30.aff === 52 && bh17 && bh17.aff === 22, 'B4 温蘅侧改档落账（017→22、030→52）');

// ============ C xl_004 死分支与错账 ============
assert(evSlice(xsrc, 'xl_event_004').indexOf("subOption: 'like'") < 0 &&
    evSlice(xsrc, 'xl_event_004').indexOf("case 'like':") < 0,
    'C1 「断裂的玉簪」永不可达的假分支与两页死剧本删除');
var xl4 = runEffects(xsrc, 'xl_event_004', 'depends');
assert(xl4 && xl4.affection === 4, 'C2 第三选账目对齐：说什么就是什么价（4），不再标 8 给 4');
var xl4b = runEffects(xsrc, 'xl_event_004', 'doubt');
assert(xl4b && xl4b.affection === 5, 'C3 其余选项原账未动（不信「永远」= 5）');

// ============ D 接簪事件数字不再撒谎 ============
var hsrc = loadScript('js/npcs/heroine-rivalry.js');
var recSeg = evSlice(hsrc, 'xl_event_reconcile');
assert(recSeg.indexOf('affection: 12') < 0 && recSeg.indexOf('affection: 8') < 0 && recSeg.indexOf('以 effects 真源为准') >= 0,
    'D1 接簪三选不再标误导性数字（真源在 effects：有道侣/无道侣两档）');
var daoStub = function () { return { name: '那人', isDaoCompanion: true, gender: 'female' }; };
var noStub = function () { return null; };
var rFix1 = runEffects(hsrc, 'xl_event_reconcile', 'fix', { detectRivalRomance: daoStub });
var rFix2 = runEffects(hsrc, 'xl_event_reconcile', 'fix', { detectRivalRomance: noStub });
assert(rFix1 && rFix1.affection === 4 && rFix2 && rFix2.affection === 12,
    'D2 两档真源各验：她已有道侣时接簪只 +4，清白时 +12——后果随世界状态，不随选项贴纸');

// ============ E 六线中段：信物落包与甜点换位 ============
var MID = [
    { file: 'js/npcs/jingang-events.js', ev: 'jg_event_005', ch: 'touch', aff: 5, item: 'mat_pearl' },
    { file: 'js/npcs/jingang-events.js', ev: 'jg_event_006', ch: 'ask', aff: 9, item: null },
    { file: 'js/npcs/jingang-events.js', ev: 'jg_event_006', ch: 'self', aff: 8, item: null },
    { file: 'js/npcs/maoshan-events.js', ev: 'ms_event_005', ch: 'help', aff: 6, item: 'tal_shield' },
    { file: 'js/npcs/maoshan-events.js', ev: 'ms_event_006', ch: 'probe', aff: 10, item: null },
    { file: 'js/npcs/yaowang-events.js', ev: 'su_event_005', ch: 'return', aff: 5, item: 'mat_thousand_lingzhi' },
    { file: 'js/npcs/yaowang-events.js', ev: 'su_event_006', ch: 'side', aff: 11, item: null },
    { file: 'js/npcs/zhujian-events.js', ev: 'lu_event_005', ch: 'strike', aff: 6, item: 'mat_cold_iron' },
    { file: 'js/npcs/zhujian-events.js', ev: 'lu_event_006', ch: 'promise', aff: 9, item: null },
    { file: 'js/npcs/wuxian-events.js', ev: 'wx_event_005', ch: 'let', aff: 6, item: 'mat_beast_fang' },
    { file: 'js/npcs/wuxian-events.js', ev: 'wx_event_006', ch: 'regret', aff: 10, item: null },
    { file: 'js/npcs/wuxian-events.js', ev: 'wx_event_006', ch: 'forget', aff: 4, item: null },
    { file: 'js/npcs/tianshan-events.js', ev: 'ts_event_007', ch: 'share', aff: 5, item: 'mat_snow_lotus' },
    { file: 'js/npcs/tianshan-events.js', ev: 'ts_event_005', ch: 'half', aff: 9, item: null }
];
var itemPool = '';
['js/items-extended/13-missing-ids.js'].forEach(function (f) { itemPool += loadScript(f); });
MID.forEach(function (M) {
    var r = runEffects(loadScript(M.file), M.ev, M.ch);
    assert(r && r.affection === M.aff && (M.item ? r.item === M.item : !r.item),
        'E[' + M.ev + '/' + M.ch + '] 结算 = 好感' + M.aff + (M.item ? ' + 信物' : '（无信物）') + '，得 ' + JSON.stringify(r && { a: r.affection, i: r.item }));
    if (M.item) assert((function () {
        var found = false;
        (function walk(dir) {
            if (found) return;
            fs.readdirSync(dir, { withFileTypes: true }).forEach(function (ent) {
                if (found) return;
                var fp = path.join(dir, ent.name);
                if (ent.isDirectory()) { walk(fp); return; }
                if (/\.js$/.test(ent.name) && fs.readFileSync(fp, 'utf8').indexOf("id: '" + M.item + "'") >= 0) found = true;
            });
        })(path.resolve(__dirname, '../js'));
        return found;
    })(), 'E 信物 ' + M.item + ' 在物品表真实存在（进背包不落空）');
});
['js/npcs/jingang-events.js', 'js/npcs/maoshan-events.js', 'js/npcs/yaowang-events.js',
 'js/npcs/zhujian-events.js', 'js/npcs/wuxian-events.js', 'js/npcs/tianshan-events.js'].forEach(function (f) {
    var s = loadScript(f);
    assert(/item: item/.test(s), 'E+[' + f + '] 该线中段信物通道已开');
});

// ============ F 旧断言防护：v20.25 系统账未被文本编辑误伤 ============
assert(xsrc.indexOf("negCount >= 3 && (choice === 'lover_carry'") >= 0, 'F1 修罗宫坏结局闸完好');
assert(loadScript('js/npcs/baihua-events-main.js').indexOf("negCount >= 3") >= 0, 'F2 百花谷闸完好');

console.log('v20.26 text-thicken: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
