// ==================== 门派补厚批六验收：活门派（库存/政事/管理者自治） ====================
// 覆盖：A 接线 / B 多类库存与断粮后果 / C 管理者自治决策（真花库存、真落编年、自家通知） /
//       D 玩家参与（捐献/进言/支取） / E 战争与面板联动 / F 文案纪律
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
    ok(html.indexOf('js/sects/sect-governance.js') >= 0 && html.indexOf('sect-internal.js') < html.indexOf('sect-governance.js'), 'A1 治理模块已挂脚本位（门派内政之后）');
    ok(read('js/sects/sects-deep-ui.js').indexOf('门中政事') >= 0, 'A2 门派详情页挂政事入口');
    const sys = read('js/sects/sects-system.js');
    ok(sys.indexOf('SectGov.famine') >= 0 && sys.indexOf('俸禄减半') >= 0, 'A3 断粮门派俸禄减半（世界咬到玩家）');
    ok(sys.indexOf("deductStore(_govSect, 'stone', baseStones)") >= 0, 'A4 俸禄真从门派库里扣（不再凭空印钱）');
    ok(read('js/sects/sect-war.js').indexOf('SectGov.onWar') >= 0, 'A5 战争胜负联动兵器库/大阵');
    ok(read('tests/run-all.sh').indexOf('sect-governance-node.js') >= 0, 'A6 本套件已入回归清单');
}

// ============ 运行时沙箱 ============
function makeWorld(opts) {
    opts = opts || {};
    var msgs = [], logs = [], modals = [], buffs = [], day = opts.day || 100;
    var randSeq = (opts.randSeq || []).slice();
    var randDefault = opts.rand != null ? opts.rand : 0;
    var MyMath = {
        round: Math.round, min: Math.min, max: Math.max, floor: Math.floor, ceil: Math.ceil, abs: Math.abs,
        random: function () { return randSeq.length ? randSeq.shift() : randDefault; }
    };
    var internals = opts.internals || {
        '少林寺': { disciples: 20, morale: 50, influence: 50, resources: 300, meetings: [], decisions: [] }
    };
    var W = {
        console: { log: function () {}, warn: function () {} },
        Math: MyMath, JSON: JSON, Object: Object, Array: Array, String: String, Number: Number, isFinite: isFinite, Date: Date, RegExp: RegExp,
        SECT_INTERNAL: internals,
        sectsData: opts.sectsData || {
            '少林寺': { type: '正道', power: '巨擘', weapons: '棍棒、拳脚', desc: '佛门正宗，位于嵩山，禅武合一。' },
            '药王谷': { type: '正道', power: '小', weapons: '银针、药锄', desc: '医者仁心。' },
            '铸剑山庄': { type: '正道', power: '中等', weapons: '各类刀剑、锤', desc: '天下锻造师聚集地。' }
        },
        SECT_LEADER_NAMES: { '少林寺': '释玄慈', '药王谷': '药老人' },
        SECT_DIPLOMACY_STATE: opts.diplo || { '少林寺': { '血手门': { relation: -50, conflicts: 0 } } },
        saveSectDiplomacy: function () { W._dipSaved = (W._dipSaved || 0) + 1; },
        discipleState: opts.ds || { isInSect: true, sectId: '少林寺', sectName: '少林寺', rank: 5, rankName: '外门弟子', contribution: 200 },
        currentCharData: { name: '测试侠', realm: '筑基' },
        eventFlags: {},
        inventory: { currency: { spiritStones: opts.stones != null ? opts.stones : 500 }, slots: opts.slots || [] },
        itemById: {
            'mat_liquorice': { id: 'mat_liquorice', name: '甘草', subtype: 'herb' },
            'iron_ore': { id: 'iron_ore', name: '铁矿', subtype: 'ore' }
        },
        addItem: function (id, n) { (W._added = W._added || []).push({ id: id, n: n }); return true; },
        applyBuff: function (id, eff, dur) { buffs.push({ id: id, eff: eff, dur: dur }); },
        getSectNPCs: function (sect) { return [{ id: 'sect_disciple_少林寺_0', name: '沈铁衣', location: sect }]; },
        Tournament: opts.tournament || null,
        sectAddContribution: function (n, r) { var d = W.discipleState; d.contribution += n; (W._notes = W._notes || []).push({ n: n, r: r }); return d.contribution; },
        sectSpendContribution: function (n, r) { var d = W.discipleState; if (d.contribution < n) return false; d.contribution -= n; (W._notes = W._notes || []).push({ n: -n, r: r }); return true; },
        showMessage: function (m) { msgs.push(String(m)); },
        showModal: function (t, b) { modals.push({ title: String(t), body: String(b) }); },
        gameLog: { add: function (m) { logs.push(String(m)); } },
        timeSystem: { getAbsoluteDay: function () { return day; }, onNewDaySubscribe: function () {} },
        EventBus: { on: function () {} },
        updateInventoryUI: function () {},
        _msgs: msgs, _logs: logs, _modals: modals, _buffs: buffs,
        _setDay: function (d) { day = d; },
        _lastMsg: function () { return msgs[msgs.length - 1] || ''; }
    };
    W.window = W;
    var ctx = vm.createContext(W);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/sects/sect-governance.js'), 'utf8'), ctx, { filename: 'sect-governance' });
    return W;
}

// ============ B 多类库存与断粮后果 ============
{
    var W = makeWorld({ rand: 1, internals: {
        '少林寺': { disciples: 20, morale: 50, influence: 50, resources: 300 },
        '药王谷': { disciples: 10, morale: 60, influence: 30, resources: 100 },
        '铸剑山庄': { disciples: 15, morale: 55, influence: 40, resources: 150 }
    } });
    W.SectGov.ensureStores('少林寺'); W.SectGov.ensureStores('药王谷'); W.SectGov.ensureStores('铸剑山庄');
    var sl = W.SectGov.probe('少林寺'), yw = W.SectGov.probe('药王谷'), zj = W.SectGov.probe('铸剑山庄');
    ok(sl.grain > 0 && sl.material >= 0 && sl.weapons >= 10 && sl.defense === 10, 'B1 库存四栏+兵器+大阵初始化（单一真源：灵石仍走 resources 旧账）');
    ok(yw.pill === 10 && sl.pill === 0, 'B2 营生定产出：药王谷有丹药库存，少林没有（affinity 真读门派数据）');
    ok(zj.material > sl.material - 5, 'B3 铸剑山庄材料厚（锻造营生）');
    // 日产出与消耗
    var g0 = sl.grain;
    W.SectGov.govDayTick();
    var sl2 = W.SectGov.probe('少林寺');
    ok(sl2.grain === g0 + (2 + Math.ceil(20 / 10) + 0) - Math.ceil(20 / 6), 'B4 每日谷产出=营生+人头，消耗=弟子吃饭（账算得清）');
    // 断粮后果
    var W2 = makeWorld({ rand: 1, internals: { '少林寺': { disciples: 20, morale: 50, influence: 50, resources: 300, grain: 0, _govInit: 1, _famineDays: 0, pill: 0, material: 0, weapons: 10, defense: 10 } } });
    W2.SECT_INTERNAL['少林寺'].grain = 0;
    // 让日结补不回：把产出抵消（grain 产 4 耗 4 → 0）——直接置负场景：弟子多产出少
    W2.SECT_INTERNAL['少林寺'].disciples = 60; // 产2+6=8 耗10 → 净-2，起始0则保持0
    W2.SECT_INTERNAL['少林寺'].grain = 0;
    W2.SectGov.govDayTick();
    var p2 = W2.SectGov.probe('少林寺');
    ok(p2.famineDays >= 1 && p2.morale < 50, 'B5 断粮：饥荒计日、士气真掉');
    ok(W2.SectGov.famine('少林寺') === true, 'B6 俸禄减半探针亮起（sects-system 真读）');
    ok(p2.chronicle.some(function (c) { return c.text.indexOf('粮仓见底') >= 0; }), 'B7 断粮进编年（掌门下令省饭）');
    ok(W2._logs.join('').indexOf('俸禄') >= 0, 'B8 自家断粮通知到玩家（俸禄会受影响）');
    // 七日走人
    W2.SECT_INTERNAL['少林寺']._famineDays = 6;
    var d0 = W2.SECT_INTERNAL['少林寺'].disciples;
    W2.SectGov.govDayTick();
    ok(W2.SectGov.probe('少林寺').disciples < d0 && p2.chronicle, 'B9 饥荒满七日：弟子连夜下山（真掉人头）');
    ok(W2.SECT_INTERNAL['少林寺'].chronicle.some(function (c) { return c.text.indexOf('趁夜下了山') >= 0; }), 'B10 走人进编年（掌门站在山门口，没拦）');
    // 丹药稳心
    var W3 = makeWorld({ rand: 1, internals: { '药王谷': { disciples: 60, morale: 50, influence: 30, resources: 100, grain: 0, pill: 20, material: 0, _govInit: 1, _famineDays: 0 } } });
    W3.SectGov.govDayTick();
    var p3 = W3.SectGov.probe('药王谷');
    ok(p3.morale === 48 && p3.pill < 20, 'B11 有丹药的门派断粮掉士气减半（药房搬出压箱底——每样库存都有用场）');
}

// ============ C 管理者自治决策 ============
{
    // 籴粮（缺粮优先）
    var W = makeWorld({ rand: 0, internals: { '少林寺': { disciples: 20, morale: 50, influence: 50, resources: 300, grain: 5, material: 10, pill: 0, weapons: 10, defense: 10, _govInit: 1, _famineDays: 0 } } });
    W.SectGov.govDayTick();
    var p = W.SectGov.probe('少林寺');
    ok(p.grain === 5 + (2 + 2 - 4) + 40 && p.stone === 300 - 40, 'C1 缺粮先籴粮：灵石-40、谷+40（决策按急需排序）');
    ok(p.chronicle.some(function (c) { return c.text.indexOf('籴粮') >= 0 && c.text.indexOf('长老') >= 0; }), 'C2 编年落笔且有经手人（长老具名，不是「门派做了某事」）');
    ok(W._logs.join('').indexOf('籴粮') >= 0, 'C3 自家门派的政事通知到玩家眼前');
    // 别派静默
    var W2 = makeWorld({ rand: 0, ds: { isInSect: true, sectId: '武当派', sectName: '武当派', rank: 5, contribution: 0 }, internals: { '少林寺': { disciples: 20, morale: 50, influence: 50, resources: 300, grain: 5, material: 10, pill: 0, weapons: 10, defense: 10, _govInit: 1, _famineDays: 0 } } });
    W2.SectGov.govDayTick();
    ok(W2._logs.length === 0, 'C4 别派政事不打扰你（编年里有，面板能看）');
    // 大典（士气低）+ 玩家在场沾光
    var W3 = makeWorld({ rand: 0, internals: { '少林寺': { disciples: 20, morale: 40, influence: 50, resources: 300, grain: 60, material: 10, pill: 0, weapons: 10, defense: 10, _govInit: 1, _famineDays: 0 } } });
    W3.SectGov.govDayTick();
    var p3 = W3.SectGov.probe('少林寺');
    ok(p3.morale > 40 && p3.grain < 60 && p3.chronicle.some(function (c) { return c.text.indexOf('大典') >= 0 && c.text.indexOf('释玄慈') >= 0; }), 'C5 士气低开大典：掌门具名、粮食真耗、士气真涨');
    ok(W3._buffs.some(function (b) { return b.id === 'fxb_sect_feast'; }), 'C6 自家大典：玩家同席沾光（心境增益一日，真buff）');
    // 外交送礼（接批五因果）
    var W4 = makeWorld({ rand: 0, internals: { '少林寺': { disciples: 25, morale: 60, influence: 50, resources: 300, grain: 60, material: 5, pill: 5, weapons: 20, defense: 50, _govInit: 1, _famineDays: 0 } } });
    W4.SectGov.govDayTick();
    var p4 = W4.SectGov.probe('少林寺');
    var relNow = W4.SECT_DIPLOMACY_STATE['少林寺']['血手门'].relation;
    // 决策池按序：籴粮不需要（grain 60 充足）、大典不需要（morale 60）、收徒看 cap、铸造看 weapons<disc/2=10? weapons20 否、炼丹 pill<20 且 material>=15? material5 否、修阵 defense<40? 50 否、送礼 resources>=40 且 foe(-50<=-30) → 是
    ok(relNow === -38 && p4.stone === 300 - 40, 'C7 管理者给宿怨之门送礼：关系+12、灵石-40（外交网真联动）');
    ok(W4._dipSaved >= 1 && p4.chronicle.some(function (c) { return c.text.indexOf('血手门') >= 0; }), 'C8 送礼落编年并存档（江湖没有解不开的死仇）');
    // 历练挂彩用真名弟子
    var W5 = makeWorld({ randSeq: [0, 0.5], diplo: { '少林寺': { '血手门': { relation: 0, conflicts: 0 } } }, internals: { '少林寺': { disciples: 25, morale: 60, influence: 50, resources: 120, grain: 60, material: 5, pill: 25, weapons: 20, defense: 50, _govInit: 1, _famineDays: 0 } } });
    W5.SectGov.govDayTick();
    var p5 = W5.SectGov.probe('少林寺');
    ok(p5.chronicle.some(function (c) { return c.text.indexOf('沈铁衣') >= 0 && c.text.indexOf('伤') >= 0; }), 'C9 遣弟子历练挂彩：编年写的是真名同门（批四的脸继续用）');
    ok(p5.morale === 55, 'C10 弟子受伤，士气真掉');
    // 大比加码（接批五）
    var W6 = makeWorld({ rand: 0, tournament: { _store: function () { return { '少林寺': { currentEvent: { id: 't1' } } }; } }, diplo: { '少林寺': { '血手门': { relation: 0, conflicts: 0 } } }, internals: { '少林寺': { disciples: 14, morale: 46, influence: 10, resources: 300, grain: 60, material: 5, pill: 25, weapons: 20, defense: 50, _govInit: 1, _famineDays: 0 } } });
    W6.SectGov.govDayTick();
    var p6 = W6.SectGov.probe('少林寺');
    ok(p6.chronicle.some(function (c) { return c.text.indexOf('彩头') >= 0; }) && p6.stone === 220 && p6.morale === 54, 'C11 大比期间掌门加码彩头：灵石-80、士气+8（库存给赛事供弹药）');
}

// ============ D 玩家参与 ============
{
    var W = makeWorld({ rand: 1 });
    W.SectGov.ensureStores('少林寺');
    // 捐灵石
    var s0 = W.inventory.currency.spiritStones, r0 = W.SectGov.probe('少林寺').stone;
    ok(W.SectGov.donateStones('少林寺') === true && W.inventory.currency.spiritStones === s0 - 100 && W.SectGov.probe('少林寺').stone === r0 + 100, 'D1 捐灵石百枚：钱包真扣、公库真进');
    ok((W._notes || []).some(function (n) { return n.r === '捐献宗门·灵石百枚'; }), 'D2 捐献走批一账本记账口');
    ok(W.SECT_INTERNAL['少林寺'].chronicle.some(function (c) { return c.text.indexOf('测试侠') >= 0; }), 'D3 大额捐献进编年、掌门殿上点名（玩家在世界留痕）');
    var Wp = makeWorld({ rand: 1, stones: 50 });
    ok(Wp.SectGov.donateStones('少林寺') === false && Wp._lastMsg().indexOf('凑不齐') >= 0, 'D4 灵石不够：捐献打回');
    // 捐材料
    var W2 = makeWorld({ rand: 1, slots: [{ templateId: 'mat_liquorice', count: 2, getTemplate: function () { return null; } }, { templateId: 'iron_ore', count: 2, getTemplate: function () { return null; } }] });
    W2.SectGov.ensureStores('少林寺');
    var m0 = W2.SectGov.probe('少林寺').material;
    ok(W2.SectGov.donateMaterials('少林寺') === true && W2.SectGov.probe('少林寺').material === m0 + 15, 'D5 捐药材矿石：行囊真扣三份、材料+15');
    ok((W2._notes || []).some(function (n) { return n.r === '捐献宗门·药材物料' && n.n === 9; }), 'D6 捐献贡献+9入账本');
    var W3 = makeWorld({ rand: 1 });
    ok(W3.SectGov.donateMaterials('少林寺') === false && W3._lastMsg().indexOf('空手') >= 0, 'D7 行囊没料：打回（公库不收空手人情）');
    // 进言
    var W4 = makeWorld({ rand: 1, ds: { isInSect: true, sectId: '少林寺', sectName: '少林寺', rank: 5, rankName: '外门弟子', contribution: 200 } });
    W4.SectGov.ensureStores('少林寺');
    ok(W4.SectGov.propose('少林寺', 'buy_grain') === false && W4._lastMsg().indexOf('内门') >= 0, 'D8 外门弟子进言：资格叙事打回');
    W4.discipleState.rank = 4;
    W4.SECT_INTERNAL['少林寺'].grain = 5; // 制造籴粮需求
    ok(W4.SectGov.propose('少林寺', 'buy_grain') === true && W4.discipleState.contribution === 170, 'D9 内门进言：贡献30真扣、条子递上去');
    ok(W4.SectGov.propose('少林寺', 'feast') === false && W4._lastMsg().indexOf('案头') >= 0, 'D10 一次只递一条');
    W4._setDay(101);
    W4.SectGov.govDayTick();
    var p4 = W4.SectGov.probe('少林寺');
    ok(p4.proposal === null && p4.chronicle.some(function (c) { return c.text.indexOf('进言') >= 0 && c.text.indexOf('测试侠') >= 0; }), 'D11 次日采纳：编年记下「此策出自测试侠的进言」');
    // 进言搁置退回
    var W5 = makeWorld({ rand: 1, ds: { isInSect: true, sectId: '少林寺', sectName: '少林寺', rank: 3, contribution: 100 } });
    W5.SectGov.ensureStores('少林寺');
    W5.SECT_INTERNAL['少林寺'].grain = 5;
    W5.SectGov.propose('少林寺', 'buy_grain');
    W5.SECT_INTERNAL['少林寺'].resources = 10; // 库不够了
    W5._setDay(101);
    W5.SectGov.govDayTick();
    ok(W5.discipleState.contribution === 100 && (W5._notes || []).some(function (n) { return n.r === '进言搁置·原数退回'; }), 'D12 库中不凑手：进言搁置、贡献原数退回（不坑玩家）');
    // 支取
    var W6 = makeWorld({ rand: 1, ds: { isInSect: true, sectId: '少林寺', sectName: '少林寺', rank: 5, contribution: 500 } });
    ok(W6.SectGov.drawMaterial('少林寺') === false && W6._lastMsg().indexOf('长老') >= 0, 'D13 支取是长老特权');
    W6.discipleState.rank = 2;
    W6.SectGov.ensureStores('少林寺');
    W6.SECT_INTERNAL['少林寺'].material = 20;
    ok(W6.SectGov.drawMaterial('少林寺') === true && W6.SectGov.probe('少林寺').material === 5 && W6.discipleState.contribution === 460, 'D14 长老支取材料：库存真扣、贡献真扣、行囊真进');
    ok((W6._added || []).some(function (a) { return a.id === 'iron_ore'; }), 'D15 支取到手的是真物品');
    W6.SECT_INTERNAL['少林寺'].pill = 5;
    ok(W6.SectGov.drawPill('少林寺') === false && W6._lastMsg().indexOf('糖豆') >= 0, 'D16 丹药不足十炉：掌门的话挡回来');
}

// ============ E 战争联动与面板 ============
{
    var W = makeWorld({ rand: 1, ds: { isInSect: true, sectId: '少林寺', sectName: '少林寺', rank: 5, contribution: 0 } });
    W.SectGov.ensureStores('少林寺');
    W.SECT_INTERNAL['少林寺'].weapons = 25;
    W.SectGov.onWar('少林寺', false, 'defend');
    var p = W.SectGov.probe('少林寺');
    ok(p.weapons === 15 && p.defense === 5 && p.chronicle.some(function (c) { return c.text.indexOf('踏破') >= 0; }), 'E1 守山战败：兵器折损、大阵受损、进编年（库存不是面板数字）');
    var W2 = makeWorld({ rand: 1, ds: { isInSect: true, sectId: '少林寺', sectName: '少林寺', rank: 5, contribution: 0 } });
    W2.SectGov.ensureStores('少林寺');
    W2.SECT_INTERNAL['少林寺'].weapons = 25;
    W2.SectGov.onWar('少林寺', true, 'defend');
    ok((W2._notes || []).some(function (n) { return n.r === '武库充盈·守山有功'; }), 'E2 武库充盈守山胜：贡献+20（攒库存有回报）');
    // 面板
    var W3 = makeWorld({ rand: 1 });
    W3.SectGov.openPanel('少林寺');
    var body = W3._modals[0].body;
    ok(body.indexOf('灵石') >= 0 && body.indexOf('灵谷') >= 0 && body.indexOf('材料') >= 0 && body.indexOf('丹药') >= 0, 'E3 政事面板库存四栏一目了然');
    ok(body.indexOf('门中政事') >= 0 && body.indexOf('捐灵石') >= 0 && body.indexOf('进言') >= 0, 'E4 编年+捐献+进言入口都在');
    ok(body.indexOf('支取材料') < 0, 'E5 外门弟子看不到长老支取按钮（权限如实呈现）');
}

// ============ F 文案纪律 ============
{
    var W = makeWorld({ rand: 0, internals: { '少林寺': { disciples: 20, morale: 40, influence: 50, resources: 300, grain: 5, material: 30, pill: 0, weapons: 5, defense: 10, _govInit: 1, _famineDays: 0 } } });
    W.SectGov.govDayTick();
    W.SectGov.openPanel('少林寺');
    var all = W._modals.map(function (m) { return m.title + m.body; }).join('|') + '|' + W._msgs.join('|') + '|' + W._logs.join('|') + '|' + W.SECT_INTERNAL['少林寺'].chronicle.map(function (c) { return c.text; }).join('|');
    var visible = all.replace(/<[^>]*>/g, '');
    ok(!/[A-Za-z]/.test(visible), 'F1 运行期玩家可见正文零外文字母');
    ok(visible.indexOf('次数') < 0 && visible.indexOf('配额') < 0, 'F2 零配额句式');
}

console.log('sect-governance: ' + passed + ' passed, ' + failures.length + ' failed');
if (failures.length) { failures.forEach(f => console.log('  FAIL: ' + f)); process.exit(1); }
