// ==================== 《灵气之尽》批C+批D验收：无视线中段日子流 + 文本池加厚 ====================
// 批C：忽-04/05 从「各一次点击」改造成三拍/四拍日子流（营生/货郎/煮茶；河畔/晨课/说书人/接着过），
//      拍拍有选择、有真账（灵石/增益/街谈/大事记），既有落旗与枯城/降档时序不动。
// 批D：枯竭日子事件池 3档×4 → 3档×8；分城腔 8城×1 → 8城×3（按枯龄60日轮换）；街谈面板加年份层（街谈按年走，说到做到）。
// 覆盖：A 接线与池厚 / B 忽-04三拍 / C 忽-05四拍 / D 池轮换与年份层 / E 文案纪律
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');

let passed = 0; const failures = [];
function ok(cond, msg) { if (cond) { passed++; } else { failures.push(msg); console.log('  ✗ ' + msg); } }
function read(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ============ A 接线与池厚（静态） ============
{
    const a3 = read('js/quest/qi-arc3.js');
    ok(['qiH04Life', 'qiH04Peddler', 'qiH05Fight', 'qiH05Gong', 'qiH05Teller'].every(fn => a3.indexOf('W.' + fn + ' =') >= 0), 'A1 中段日子流五拍入口齐全');
    ok(['_qi_h4_life', '_qi_h4_peddler', '_qi_h5_fight', '_qi_h5_gong', '_qi_h5_teller'].every(f => a3.indexOf(f) >= 0), 'A2 拍与拍之间有落旗（断点续走不重拍）');
    const life = read('js/quest/qi-life.js');
    ok((life.match(/'🍂 /g) || []).length >= 8 && (life.match(/'🥀 /g) || []).length >= 8 && (life.match(/'🌫️ /g) || []).length >= 8, 'A3 枯竭日子事件池每档八件（12→24）');
    const st = read('js/quest/qi-street.js');
    ok((st.match(/withered_大漠|'大漠孤城': \[/g) || []).length >= 1 && st.indexOf('cityLineNow') >= 0, 'A4 分城腔改三句轮换（枯龄驱动）');
    ok(st.indexOf('历书翻红') >= 0 && st.indexOf('qi_anchor_day') >= 0, 'A5 街谈面板年份层（按选路锚点算年头）');
    ok(read('tests/run-all.sh').indexOf('qi-batchCD-node.js') >= 0, 'A6 本套件已入回归清单');
}

// ============ 运行时沙箱 ============
function makeWorld(opts) {
    opts = opts || {};
    var logs = [], modals = [], overlays = [], choices = [], buffs = [], journals = [], day = opts.day || 500;
    var realmOrder = ['凡人', '炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'];
    var W = {
        console: { log: function () {} },
        Math: Math, JSON: JSON, Object: Object, Array: Array, String: String, Number: Number, isFinite: isFinite, RegExp: RegExp,
        eventFlags: opts.flags || {},
        currentCharData: { realm: opts.realm || '化神', gender: opts.gender || 'male', name: '测试', fame: 0, essence: 0, sect: '散修', bonds: {} },
        npcManager: { getNPC: function () { return { name: '阿蘅' }; } },
        inventory: { currency: { spiritStones: opts.stones != null ? opts.stones : 500 } },
        updateCurrencyUI: function () {},
        gameLog: { add: function (m) { logs.push(String(m)); } },
        showMessage: function (m) { logs.push(String(m)); },
        showModal: function (title, body) { modals.push({ title: String(title), body: String(body) }); },
        recordChoice: function (id) { choices.push(id); },
        getRealmTier: function (r) { var i = realmOrder.indexOf(r); return i < 0 ? 6 : i; },
        addFame: function () {}, gainCultivationBonus: function () {},
        addItem: function (id) { (W._items = W._items || []).push(id); return true; },
        applyBuff: function (id, eff, dur) { buffs.push({ id: id, eff: eff, dur: dur }); },
        itemById: {}, allItems: [], materials: [],
        WorldJournal: { record: function (e) { journals.push(e); } },
        timeSystem: { getAbsoluteDay: function () { return day; }, onNewDaySubscribe: function (fn) { (W._dayHooks = W._dayHooks || []).push(fn); } },
        startBattle: function (e) { W._lastEnemy = e; return { _stub: true }; },
        acceptQuest: function () {}, updateQuestUI: function () {},
        QuestRegistry: (function () { var m = {}; return { registerMany: function (arr) { arr.forEach(function (q) { m[q.id] = q; }); }, get: function (id) { return m[id] || null; } }; })(),
        mainQuestChain: [],
        StateRegistry: { register: function () {} },
        QI_CONCENTRATION: {
            '大漠孤城': { base: 0.8, desc: '沙漠' }, '冰原城': { base: 1.3, desc: '冰雪' }, '万毒谷': { base: 1.2, desc: '毒瘴' },
            '青木城': { base: 1.5, desc: '木灵' }, '剑阁': { base: 1.5, desc: '剑气' }, '炎城': { base: 1.4, desc: '火灵' },
            '洛水城': { base: 1.1, desc: '水畔' }, '帝都·长安': { base: 1.0, desc: '帝都' }
        },
        globalQiLevel: 100,
        depleteQi: function (a) { W.globalQiLevel = Math.max(0, W.globalQiLevel - (a || 1)); },
        restoreWorldQi: function (a) { W.globalQiLevel = Math.min(100, W.globalQiLevel + (a || 5)); },
        document: { getElementById: function () { return null; }, body: { insertAdjacentHTML: function (pos, h) { overlays.push(String(h)); } } },
        _logs: logs, _modals: modals, _overlays: overlays, _choices: choices, _buffs: buffs, _journals: journals,
        _setDay: function (d) { day = d; },
        _bumpDay: function (n) { day += (n || 0); (W._dayHooks || []).forEach(function (fn) { fn(); }); },
        _all: function () { return logs.join('|') + '|' + modals.map(m => m.title + m.body).join('|') + '|' + overlays.join('|'); }
    };
    W.window = W;
    var ctx = vm.createContext(W);
    ['js/quest/qi-world.js', 'js/quest/qi-arc1.js', 'js/quest/qi-arc2.js', 'js/quest/qi-arc3.js', 'js/quest/qi-street.js', 'js/quest/qi-life.js'].forEach(function (rel) {
        vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel });
    });
    return W;
}
function seedIgnore(W) {
    W.eventFlags['qi_route'] = 'ignore';
    W.eventFlags['qi_prologue_started'] = true;
    W.eventFlags['qi_prologue_done'] = true;
    W.eventFlags['qi_anchor_day'] = 100;
    W.eventFlags['qi_h01'] = 300; W.eventFlags['qi_h02'] = 320; W.eventFlags['qi_h03'] = 340;
}

// ============ B 忽-04 三拍日子流 ============
{
    var W = makeWorld(); seedIgnore(W);
    W.qiStartH04();
    var o = W._overlays.join('');
    ok(o.indexOf('收留的那个旧识在扫落叶') >= 0 || o.indexOf('院子里只有你一个人的脚印') >= 0, 'B1 首拍保留枯竭年代原文（旧验收 N14 语义不破）');
    ok(o.indexOf('种地') >= 0 && o.indexOf('营生') >= 0 && o.indexOf('开蒙') >= 0, 'B2 营生三选（一次点击变一段日子）');
    W.qiH04Life('farm');
    ok(W.eventFlags['_qi_h4_life'] === 'farm' && W._choices.indexOf('qi_h4_life_farm') >= 0, 'B3 营生落旗+入选择记忆');
    ok(W._logs.join('').indexOf('垄都是直的') >= 0 && W.eventFlags['qi_street'].some(s => s.text.indexOf('垄都是直的') >= 0), 'B4 种地：叙事+街谈一条（世界记得你怎么过日子）');
    ok(W._buffs.some(b => b.id === 'qi_h4_farm'), 'B5 地里的活是真修行（体魄增益真上）');
    // 第二拍货郎自动接上
    ok(W._overlays.join('').indexOf('货郎的账') >= 0, 'B6 拍与拍自动相接（货郎上门）');
    var s0 = W.inventory.currency.spiritStones;
    W.qiH04Peddler('news');
    ok(W.inventory.currency.spiritStones === s0 - 20 && W.eventFlags['_qi_h4_peddler'] === 'news', 'B7 买消息：灵石二十真扣');
    ok(W._logs.join('').indexOf('认粮不认人') >= 0, 'B8 消息是真的（南边粮道）');
    // 第三拍煮茶 → 收束照旧
    ok(W._overlays.join('').indexOf('煮茶') >= 0, 'B9 末拍煮茶（收留旗有变体）');
    W.qiH04Done();
    ok(W.eventFlags['qi_h04'] && W.qiWorldProbe().withered.indexOf('剑阁') >= 0 && W.qiWorldProbe().withered.indexOf('炎城') >= 0, 'B10 收束语义原样：落旗+剑阁炎城枯（时序不破）');
    // 营生·卖剑分支
    var W2 = makeWorld({ stones: 100 }); seedIgnore(W2);
    W2.qiStartH04(); W2.qiH04Life('trade');
    ok(W2.inventory.currency.spiritStones === 160, 'B11 摆摊营生：灵石+60真入账');
    W2.qiH04Peddler('sword');
    ok(W2.inventory.currency.spiritStones === 240 && W2._logs.join('').indexOf('铁比剑贵') >= 0, 'B12 卖飞剑：灵石+80（剑进了熔炉，出来的是犁）');
    // 钱不够：打回重选，不烧拍
    var W3 = makeWorld({ stones: 5 }); seedIgnore(W3);
    W3.qiStartH04(); W3.qiH04Life('teach'); W3.qiH04Peddler('news');
    ok(W3.eventFlags['_qi_h4_peddler'] == null && W3._logs.join('').indexOf('消息不赊账') >= 0, 'B13 买不起消息：货郎赔笑打回，这一拍还在（不烧进度）');
    W3.qiH04Peddler('tea');
    ok(W3.eventFlags['_qi_h4_peddler'] === 'tea' && W3._logs.join('').indexOf('开场是要散场的') >= 0, 'B14 留他喝碗茶：白说的半个时辰也是账');
    // 断点续走
    var W4 = makeWorld(); seedIgnore(W4);
    W4.eventFlags['_qi_h4_life'] = 'farm'; W4.eventFlags['qi_h_scene'] = 'h04';
    W4.qiResumeIgnore();
    ok(W4._overlays.join('').indexOf('货郎的账') >= 0, 'B15 中途存档读档：续在货郎那拍，不重头演');
}

// ============ C 忽-05 四拍日子流 ============
{
    var W = makeWorld(); seedIgnore(W); W.eventFlags['qi_h04'] = 400;
    W.eventFlags['qi_stage'] = 2;
    W.qiStartH05();
    var o = W._overlays.join('');
    ok(o.indexOf('提粮价') >= 0, 'C1 首拍保留「她像天气」原文（旧验收 N15 语义不破）');
    ok(o.indexOf('劝一句') >= 0 && o.indexOf('站着听完') >= 0 && o.indexOf('打水回家') >= 0, 'C2 河畔三选（世俗的事，你也是世俗里的人）');
    W.qiH05Fight('part');
    ok(W.eventFlags['qi_street'].some(s => s.text.indexOf('轮流石') >= 0) && W._choices.indexOf('qi_h5_fight_part') >= 0, 'C3 劝架：街谈留下「轮流石」（你的名字没人提，事留下了）');
    ok(W._overlays.join('').indexOf('晨课') >= 0, 'C4 第二拍晨课接上');
    W.qiH05Gong();
    ok(W._buffs.some(b => b.id === 'qi_h05_gong') && W._logs.join('').indexOf('一丝清明') >= 0, 'C5 二档行功：薄气缝里摸到清明（经脉增益真上）');
    ok(W._overlays.join('').indexOf('说书人的开场') >= 0, 'C6 第三拍说书人接上');
    W.qiH05Teller('fix');
    ok(W._logs.join('').indexOf('她图平等') >= 0 && W._journals.some(j => j.title === '说书人改词'), 'C7 纠一句「她图平等」：段子改口+大事记落笔（无视线也改得了世界的措辞）');
    ok(W._overlays.join('').indexOf('接着过') >= 0, 'C8 末拍收束');
    W.qiH05Done();
    ok(W.eventFlags['qi_h05'] && W.qiWorldProbe().withered.indexOf('洛水城') >= 0 && W.globalQiLevel === 30, 'C9 收束语义原样：洛水枯+总闸30（时序不破）');
    // 三档行功变体
    var W2 = makeWorld(); seedIgnore(W2); W2.eventFlags['qi_h04'] = 400; W2.eventFlags['qi_stage'] = 3;
    W2.qiStartH05(); W2.qiH05Fight('watch'); W2.qiH05Gong();
    ok(W2._buffs.length === 0 && W2._logs.join('').indexOf('老井') >= 0, 'C10 三档行功：丹田空得像口老井（不给增益——枯竭是真枯竭）');
    // 赏钱不够
    var W3 = makeWorld({ stones: 5 }); seedIgnore(W3); W3.eventFlags['qi_h04'] = 400;
    W3.qiStartH05(); W3.qiH05Fight('leave'); W3.qiH05Gong(); W3.qiH05Teller('tip');
    ok(W3.eventFlags['_qi_h5_teller'] == null && W3._logs.join('').indexOf('凑不出十灵石') >= 0, 'C11 赏不起：拱手也算赏，这一拍不烧');
    W3.qiH05Teller('go');
    ok(W3.eventFlags['_qi_h5_teller'] === 'go' && W3._logs.join('').indexOf('挑了一棵白菜') >= 0, 'C12 转身买菜：无账可记也是一种过法（不硬造奖励）');
}

// ============ D 池轮换与年份层 ============
{
    // 事件池扩容后轮得到新句
    var W = makeWorld({ day: 900 });
    W.eventFlags['qi_route'] = 'oppose'; W.eventFlags['qi_stage'] = 1;
    W._bumpDay(0);
    ok(W._logs.join('').indexOf('凡稻') >= 0, 'D1 扩容句真轮得到（一档第5件：灵田改凡稻）');
    // 年份层
    var W2 = makeWorld({ day: 500 }); seedIgnore(W2);
    W2.eventFlags['qi_withered_大漠孤城'] = 200;
    W2.qiOpenStreetTalk();
    ok(W2._overlays.join('').indexOf('这是第二年') >= 0, 'D2 街谈面板年份层：选路次年说「第二年」（街谈按年走兑现）');
    var W3 = makeWorld({ day: 900 }); seedIgnore(W3);
    W3.eventFlags['qi_withered_大漠孤城'] = 200;
    W3.qiOpenStreetTalk();
    ok(W3._overlays.join('').indexOf('第三年往上') >= 0, 'D3 三年往后有三年的说法（日子不是原地打转）');
}

// ============ E 文案纪律 ============
{
    var W = makeWorld(); seedIgnore(W);
    W.qiStartH04(); W.qiH04Life('farm'); W.qiH04Peddler('sword'); W.qiH04Done();
    W.eventFlags['qi_stage'] = 2;
    W.qiStartH05(); W.qiH05Fight('part'); W.qiH05Gong(); W.qiH05Teller('tip');
    var t = W._all().replace(/<[^>]+>/g, '');
    ok(!/[A-Za-z]/.test(t), 'E1 中段日子流玩家文本零外文字母');
    ok(t.indexOf('次数') < 0 && t.indexOf('配额') < 0 && t.indexOf('上限') < 0, 'E2 零配额句式');
    ok(t.indexOf('妹妹') < 0 && t.indexOf('姐姐') < 0, 'E3 年龄铁设定不破');
}

console.log('qi-batchCD: ' + passed + ' passed, ' + failures.length + ' failed');
if (failures.length) { failures.forEach(f => console.log('  FAIL: ' + f)); process.exit(1); }
