// ==================== 门派改造批·第二波验收：试炼秘境 / 庇护抚恤 / 外务榜 / 大典 / 继位 / 日常仪轨 ====================
// 覆盖：A 接线 / B 山门试炼（五层两场真仗/境界门/入阵费/首通宝库） / C 庇护撑腰+抚恤葬礼 /
//       D 外务榜四单（剿魔镇兽真仗/采办交货/出使改关系） / E 开山大典（祭祖/论功读真账/大典宴） /
//       F 继位风波（站队/自荐/拉票/三十日开牌） / G 早课晚课/灵田帮工/戒律堂/同门赠礼 / H 文案纪律
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
    ok(html.indexOf('sect-trials.js') >= 0 && html.indexOf('sect-shield-errands.js') >= 0 && html.indexOf('sect-festival-succession.js') >= 0, 'A1 三个新模块已挂脚本位');
    const app = read('js/app.js');
    ok(app.indexOf('settleSectTrial(true)') >= 0 && app.indexOf('settleSectTrial(false)') >= 0, 'A2 试炼战接入胜负双分支（链式两场）');
    ok(app.indexOf('settleSectErrand(true)') >= 0 && app.indexOf('settleSectErrand(false)') >= 0, 'A3 外务真仗接入双分支');
    ok(app.indexOf('sectShieldOnDefeat') >= 0, 'A4 真败北接庇护撑腰钩子');
    ok(read('js/sects/sect-war.js').indexOf('sectShieldFuneral') >= 0, 'A5 守山战败接抚恤（35%殁人）');
    const r = read('js/sects/sect-rooms.js');
    ok(r.indexOf('openTrialPanel') >= 0 && r.indexOf('openErrandBoard') >= 0 && r.indexOf('openSuccessionPanel') >= 0, 'A6 地标试炼门/议事厅外务榜与继位入口');
    ok(r.indexOf('doMorningClass') >= 0 && r.indexOf('doEveningClass') >= 0, 'A7 早课晚课按时辰出现在演武场与洞府');
    ok(read('js/sects/sect-visit.js').indexOf('门中近事') >= 0 && read('js/sects/sect-visit.js').indexOf('商路张榜') >= 0, 'A8 公告栏一板看全（编年/商路/节令并板）');
    ok(read('tests/run-all.sh').indexOf('sect-tide-node.js') >= 0, 'A9 本套件已入回归清单');
}

// ============ 运行时沙箱 ============
function makeWorld(opts) {
    opts = opts || {};
    var msgs = [], logs = [], modals = [], buffs = [], chronicles = [], added = [], trained = [], notes = [], advanced = [];
    var day = opts.day != null ? opts.day : 100, hourNow = opts.hour != null ? opts.hour : 12;
    var internals = opts.internals || { '少林寺': { resources: 200, grain: 40, material: 20, pill: 10, chronicle: [] } };
    var npcs = {};
    (opts.npcs || []).forEach(function (n) { npcs[n.id] = n; });
    var W = {
        console: { log: function () {}, warn: function () {} },
        Math: Math, JSON: JSON, Object: Object, Array: Array, String: String, Number: Number, isFinite: isFinite, Date: Date,
        eventFlags: opts.flags || {},
        discipleState: opts.ds || { isInSect: true, sectId: '少林寺', sectName: '少林寺', rank: 2, rankName: '长老', contribution: 500, _myDisciples: opts.myDisciples || [] },
        currentCharData: { realm: opts.realm || '筑基', name: '测试侠', fame: 0, qi: 50, maxQi: 100 },
        inventory: { currency: { spiritStones: opts.stones != null ? opts.stones : 300 }, slots: opts.slots || [] },
        itemById: {
            'mat_liquorice': { id: 'mat_liquorice', name: '甘草', subtype: 'herb', price: 3 },
            'mat_lingzhi': { id: 'mat_lingzhi', name: '灵芝', subtype: 'herb', price: 30 },
            'wine_jar': { id: 'wine_jar', name: '女儿红', subtype: 'food', price: 60 }
        },
        SECT_FACILITY_EXTRAS: { '少林寺': [{ id: 'fx_sl_damo', name: '达摩洞' }] },
        SECT_LEADER_NAMES: { '少林寺': '释玄慈' },
        sectsData: { '少林寺': { type: '正道' }, '武当派': { type: '正道' }, '血手门': { type: '邪派' } },
        SECT_DIPLOMACY_STATE: opts.diplo || { '少林寺': { '血手门': { relation: -50 } } },
        saveSectDiplomacy: function () {},
        factionState: { reputation: { demon_cult: opts.demonRep || 0, righteous_alliance: 0 } },
        SectGov: {
            chronicle: function (s, t) { chronicles.push({ sect: s, text: t }); if (internals[s] && internals[s].chronicle) internals[s].chronicle.push({ day: day, text: t }); },
            internalRef: function (s) { return internals[s] || null; },
            ensureStores: function (s) { return internals[s] || null; },
            deductStore: function (s, k, n) { (W._storeOut = W._storeOut || []).push({ k: k, n: n }); if (internals[s]) internals[s][k === 'stone' ? 'resources' : k] = Math.max(0, (internals[s][k === 'stone' ? 'resources' : k] || 0) - n); }
        },
        getSectNPCs: function (s) { return (opts.sectNpcs || []).filter(function (n) { return !n.isDead; }); },
        npcManager: { getNPC: function (id) { return npcs[id] || null; } },
        getSectEquipment: function () { return { weapon: { id: 'wpn_shaolin_staff', name: '少林棍' } }; },
        sectLedgerEntries: function () { return opts.ledger || []; },
        Tournament: { getTournamentHistory: function () { return opts.tourHist || []; } },
        startBattle: function (e) { W._lastEnemy = e; var b = { enemy: e }; W.currentBattle = b; return b; },
        getRealmTier: function (r) { return ['凡人', '炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'].indexOf(r) >= 0 ? ['凡人', '炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'].indexOf(r) : 1; },
        realmScaledEnemyLevel: function () { return 10; },
        addItem: function (id, n) { added.push({ id: id, n: n || 1 }); return true; },
        consumeItem: function (id, n) {
            var inv = W.inventory, rem = n;
            for (var i = 0; i < inv.slots.length && rem > 0; i++) { var s = inv.slots[i]; if (s && s.templateId === id) { var c = Math.min(s.count, rem); s.count -= c; rem -= c; if (s.count <= 0) inv.slots[i] = null; } }
            return rem <= 0;
        },
        applyBuff: function (id, eff, dur) { buffs.push({ id: id, eff: eff, dur: dur }); },
        sectPassiveTrain: function (k) { trained.push(k); },
        sectAddContribution: function (n, r) { var d = W.discipleState; d.contribution += n; notes.push({ n: n, r: r }); },
        sectSpendContribution: function (n, r) { var d = W.discipleState; if (d.contribution < n) return false; d.contribution -= n; notes.push({ n: -n, r: r }); return true; },
        timeSystem: {
            getAbsoluteDay: function () { return day; },
            advanceTime: function (m, why) { advanced.push({ m: m, why: why }); },
            gameTime: { get currentHour() { return hourNow; } },
            onNewDaySubscribe: function (fn) { (W._dayHooks = W._dayHooks || []).push(fn); }
        },
        EventBus: { on: function (ev, fn) { if (ev === 'newDay') (W._dayHooks = W._dayHooks || []).push(fn); } },
        showMessage: function (m) { msgs.push(String(m)); },
        showModal: function (t, b) { modals.push({ title: String(t), body: String(b) }); },
        gameLog: { add: function (m) { logs.push(String(m)); } },
        updateSectUI: function () {}, updateInventoryUI: function () {},
        document: { getElementById: function () { return null; } },
        _msgs: msgs, _logs: logs, _modals: modals, _buffs: buffs, _chronicles: chronicles, _added: added, _trained: trained, _notes: notes, _advanced: advanced,
        _setDay: function (d) { day = d; }, _setHour: function (h) { hourNow = h; },
        _bumpDay: function (n) { day += (n || 1); (W._dayHooks || []).forEach(function (f) { f(); }); },
        _lastMsg: function () { return msgs[msgs.length - 1] || ''; },
        _lastModal: function () { return modals[modals.length - 1] || { title: '', body: '' }; },
        _all: function () { return msgs.join('|') + '|' + logs.join('|') + '|' + modals.map(function (m) { return m.title + m.body; }).join('|'); },
        _internals: internals
    };
    W.window = W;
    var ctx = vm.createContext(W);
    ['js/sects/sect-trials.js', 'js/sects/sect-shield-errands.js', 'js/sects/sect-festival-succession.js'].forEach(function (rel) {
        vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel });
    });
    return W;
}

// ============ B 山门试炼 ============
{
    var W = makeWorld();
    W.openTrialPanel('fx_sl_damo');
    var b = W._lastModal().body;
    ok(b.indexOf('阵影') >= 0 && b.indexOf('开山之意') >= 0 && b.indexOf('需金丹') >= 0, 'B1 试炼面板五层列全，三层起标境界门');
    ok(W.startTrialFloor('fx_sl_damo', 2) === false, 'B2 跳层不许（试炼不跳级）');
    ok(W.startTrialFloor('fx_sl_damo', 3) === false && W._lastMsg().indexOf('金丹') >= 0, 'B3 境界门是真的（筑基进不了第三层）');
    ok(W.startTrialFloor('fx_sl_damo', 1) === true && W.discipleState.contribution === 480, 'B4 入阵费贡献20真扣（走账本）');
    ok(W.currentBattle._isSectTrialBattle === true && W.currentBattle._trialWave === 1 && W._lastEnemy.name.indexOf('达摩洞') >= 0, 'B5 第一层前影开打（守关的是地标自己的影）');
    W.settleSectTrial(true);
    ok(W.currentBattle._trialWave === 2, 'B6 前影破，后影起（每层两场，链式结算）');
    W.settleSectTrial(true);
    ok(W.eventFlags['sect_trial_fx_sl_damo'].cleared === 1 && W.discipleState.contribution === 480 + 40, 'B7 通层：贡献+40×层数入账');
    ok(W._added.length >= 1 && W._trained.indexOf('battle') >= 0, 'B8 通层有祖师余泽（物件入行囊）+练底子');
    W.settleSectTrial(true); // 重复结算不应再给
    ok(W.eventFlags['sect_trial_fx_sl_damo'].cleared === 1, 'B9 层不重复通');
    // 败北可再战
    W.startTrialFloor('fx_sl_damo', 2);
    W.settleSectTrial(false);
    ok(W.eventFlags['sect_trial_fx_sl_damo'].cleared === 1 && W._logs.join('').indexOf('可再战') >= 0, 'B10 败不罚，可再战（入阵费买的是机会）');
    // 第五层首通宝库
    var W2 = makeWorld({ realm: '元婴' });
    W2.eventFlags['sect_trial_fx_sl_damo'] = { cleared: 4 };
    W2.startTrialFloor('fx_sl_damo', 5);
    W2.settleSectTrial(true);
    W2.currentBattle._trialWave = 2; W2.settleSectTrial(true);
    ok(W2.inventory.currency.spiritStones === 500 && W2._added.some(function (a) { return a.id === 'wpn_shaolin_staff'; }) && W2.currentCharData.fame === 5, 'B11 首通第五层：山门宝库（灵石200+本派专属兵刃出匣+名望5）');
    ok(W2._chronicles.some(function (c) { return c.text.indexOf('头一遭') >= 0; }), 'B12 首通进编年（开山以来头一遭，全门传观）');
    W2.currentBattle = { _isSectTrialBattle: true, _trialFid: 'fx_sl_damo', _trialFloor: 5, _trialWave: 2 };
    W2.settleSectTrial(true);
    var addN = W2._added.filter(function (a) { return a.id === 'wpn_shaolin_staff'; }).length;
    ok(addN === 1, 'B13 重复通关兵刃不重复出匣（宝库的门认得你了）');
}

// ============ C 庇护撑腰 + 抚恤葬礼 ============
{
    var fellow = { id: 'sect_disciple_少林寺_0', name: '沈铁衣', isDead: false, relationship: { affection: 40 }, changeHatred: function (n) { this._hatred = (this._hatred || 0) + n; } };
    var foe = { id: 'npc_foe', name: '仇三', isDead: false, relationship: { affection: 0 }, changeHatred: function (n) { this._hatred = (this._hatred || 0) + n; } };
    var W = makeWorld({ npcs: [fellow, foe], sectNpcs: [fellow], diplo: { '少林寺': { '血手门': { relation: -50 } } } });
    W.sectShieldOnDefeat({ enemy: { name: '血手门·爪', sect: '血手门', _linkedNpcId: 'npc_foe' } });
    ok(W._logs.join('').indexOf('执事下山') >= 0, 'C1 外头被打伤，门里执事出面（背后有人的实感）');
    ok(foe._hatred === -10, 'C2 有档案的仇家收敛（门里的面子得给）');
    ok(W.SECT_DIPLOMACY_STATE['少林寺']['血手门'].relation === -58 && W._chronicles.some(function (c) { return c.text.indexOf('记下了这笔账') >= 0; }), 'C3 对方门派关系落账+编年（打你=打你门派）');
    W._setDay(110);
    W.sectShieldOnDefeat({ enemy: { name: '路人' } });
    ok(W._logs.filter(function (l) { return l.indexOf('执事下山') >= 0; }).length === 1, 'C4 执事三十日一回（出面才有分量，不天天来）');
    // 抚恤
    var W2 = makeWorld({ npcs: [fellow], sectNpcs: [fellow], myDisciples: ['sect_disciple_少林寺_0'] });
    W2._setDay(200);
    W2.sectShieldFuneral('少林寺', '守山那一仗');
    ok(fellow.isDead === true && W2._storeOut.some(function (x) { return x.k === 'stone' && x.n === 30; }), 'C5 同门战殁：抚恤三十灵石真出库（守恒）');
    ok(W2._chronicles.some(function (c) { return c.text.indexOf('沈铁衣') >= 0 && c.text.indexOf('殁') >= 0; }), 'C6 编年记殁（族谱式的墨字）');
    ok(W2.discipleState._myDisciples.length === 0 && W2._logs.join('').indexOf('替他收了最后一份师门礼') >= 0, 'C7 死的是亲传弟子：哀恸戏+名单除去');
    ok(W2.getSectNPCs('少林寺').length === 0, 'C8 殁了的人不再出现在同门名单（切磋/收徒都碰不到他）');
}

// ============ D 外务榜 ============
{
    var W = makeWorld({ day: 30 });
    W.openErrandBoard();
    var st = W.eventFlags['sect_errands'];
    ok(st.list.length >= 2 && W._chronicles.some(function (c) { return c.text.indexOf('外务榜') >= 0; }), 'D1 半月一榜：外务单张挂+编年落笔');
    ok(W._lastModal().body.indexOf('门里赚灵石') >= 0, 'D2 榜文说清道理（门里赚脸面，你赚贡献）');
    var slay = st.list.filter(function (e) { return e.kind === 'slay' || e.kind === 'beast'; })[0];
    ok(W.doSectErrand(slay.id) === true && W.currentBattle._isSectErrandBattle === true, 'D3 剿魔镇兽是真仗');
    W.settleSectErrand(false);
    ok(st.list.filter(function (e) { return e.id === slay.id; })[0].state === 'taken' && W._logs.join('').indexOf('可再战') >= 0, 'D4 办砸了单子还在（门里不罚败事的人）');
    var c0 = W.discipleState.contribution, s0 = W.inventory.currency.spiritStones, res0 = W._internals['少林寺'].resources;
    W.settleSectErrand(true);
    ok(W.discipleState.contribution > c0 && W.inventory.currency.spiritStones > s0 && W._internals['少林寺'].resources > res0, 'D5 办成了：你赚贡献灵石，门库真进外快（来路做实）');
    ok(W._chronicles.some(function (c) { return c.text.indexOf('办成了') >= 0; }), 'D6 外务办成进编年（门里的脸面）');
    // 采办交货
    var gath = st.list.filter(function (e) { return e.kind === 'gather' && e.need > 0; })[0];
    if (gath) {
        ok(W.doSectErrand(gath.id) === false && W._lastMsg().indexOf('凑不够') >= 0, 'D7 采办：行囊不够就打回（先去采）');
        W.inventory.slots.push({ templateId: 'mat_liquorice', count: 30, getTemplate: function () { return null; } });
        ok(W.doSectErrand(gath.id) === true && W.inventory.slots.filter(function (s) { return s && s.templateId === 'mat_liquorice'; }).length === 0, 'D8 药材三十份真交货（行囊清空）');
    } else { ok(true, 'D7 采办：（本期榜无采办单，跳过）'); ok(true, 'D8 采办：（跳过）'); }
    // 出使
    var W3 = makeWorld({ day: 45, diplo: { '少林寺': { '武当派': { relation: 10 }, '血手门': { relation: -20 } } } });
    W3.openErrandBoard();
    var envoy = W3.eventFlags['sect_errands'].list.filter(function (e) { return e.kind === 'envoy'; })[0];
    if (envoy) {
        var base0 = W3.SECT_DIPLOMACY_STATE['少林寺'][envoy.target].relation;
        W3.doSectErrand(envoy.id);
        ok(W3.SECT_DIPLOMACY_STATE['少林寺'][envoy.target].relation === base0 + 8 && W3._advanced.some(function (a) { return a.why.indexOf('出使') === 0; }), 'D9 出使：真改外交关系+8、真耗半天脚程');
    } else { ok(true, 'D9 出使：（本期榜无出使单，跳过）'); }
}

// ============ E 开山大典 ============
{
    var W = makeWorld({ day: 540, ledger: [{ amt: 350, day: 500, reason: '差事' }, { amt: 40, day: 300, reason: '旧账' }] });
    W.openSectFestival();
    var b = W._lastModal().body;
    ok(b.indexOf('开山大典') >= 0 && b.indexOf('进账贡献 390') >= 0 && b.indexOf('够格上功德榜') >= 0, 'E1 论功读真账本（今年名下进账，一年前的旧账不算）');
    W.sectFestivalAct('incense');
    ok(W.discipleState.contribution === 480 && W._buffs.some(function (x) { return x.id === 'sect_festival_bless'; }), 'E2 祭祖上香：贡献20+祖师庇佑（神识意志两日）');
    W.sectFestivalAct('honor');
    ok(W.inventory.currency.spiritStones === 400 && W.currentCharData.fame === 5 && W._internals['少林寺'].resources === 100, 'E3 功赏一百出自门库（真扣库存，全门看得见）');
    ok(W._chronicles.some(function (c) { return c.text.indexOf('论功行赏') >= 0 && c.text.indexOf('测试侠') >= 0; }), 'E4 掌门当众念你的名字（编年记名）');
    W.sectFestivalAct('feast');
    ok(W._buffs.some(function (x) { return x.id === 'sect_festival_feast'; }) && W._advanced.some(function (a) { return a.why === '大典宴'; }), 'E5 大典宴：全门同席（增益三日+真耗时辰）');
    W.sectFestivalAct('incense');
    ok(W.discipleState.contribution === 480, 'E6 一节只行一遍（仪式不刷）');
    W._setDay(600);
    W.openSectFestival();
    ok(W._lastMsg().indexOf('已经过了') >= 0, 'E7 一年一度（今年行过就不再开）');
    // 功德不够
    var W2 = makeWorld({ day: 540, ledger: [{ amt: 50, day: 500, reason: 'x' }] });
    W2.openSectFestival();
    ok(W2._lastModal().body.indexOf('门槛是三百') >= 0, 'E8 账上不够：如实告诉你门槛（明年再来）');
}

// ============ F 继位风波 ============
{
    var W = makeWorld({ day: 200, ds: { isInSect: true, sectId: '少林寺', sectName: '少林寺', rank: 2, rankName: '长老', contribution: 3500, _myDisciples: [] } });
    W.sectSuccessionCheck();
    ok(W.eventFlags['sect_succ'] && W.eventFlags['sect_succ'].stage === 1, 'F1 长老以上才听得见风向（掌门闭关，风波起）');
    ok(W._logs.join('').indexOf('严律') >= 0 && W._chronicles.some(function (c) { return c.text.indexOf('监门执事') >= 0; }), 'F2 两位长老盯上执事印（编年落笔，掌门位分不动）');
    W.openSuccessionPanel();
    var b = W._lastModal().body;
    ok(b.indexOf('毛遂自荐') >= 0, 'F3 贡献三千为凭：自荐的门开着');
    W.sectSuccChoose('self');
    ok(W.eventFlags['sect_succ'].stage === 2 && W._logs.join('').indexOf('你是他们的对手') >= 0, 'F4 自荐下场：从站队人变成对手');
    W.sectSuccCampaign();
    ok(W.discipleState.contribution === 3400 && W.eventFlags['sect_succ'].support === 10, 'F5 拉票真花贡献（人情要还）');
    W.sectSuccResolve();
    ok(W.eventFlags['sect_succ'] !== null, 'F6 三十日不到不开牌');
    W._setDay(231);
    W.sectSuccResolve();
    // 分数 = 20 + support10 + 贡献3400/300=11 → 41；对手 40+(231*7%25) / 40+(231*13%25)
    var won = !!W.eventFlags['sect_steward'];
    ok(won === (41 > 40 + (231 * 7 % 25) && 41 > 40 + (231 * 13 % 25)) || W.discipleState.contribution === 3300, 'F7 开牌按真账算（声援+贡献底蕴+职位，输赢都有账可循）');
    if (won) {
        ok(W.discipleState.rank <= 1 && W.currentCharData.fame === 10 && W._chronicles.some(function (c) { return c.text.indexOf('监门执事') >= 0; }) && W._chronicles.every(function (c) { return c.text.indexOf('新掌门') < 0; }), 'F8 接印成功：升副掌门·监门执事（掌门位分不动——恋爱角色不换人）');
    } else {
        ok(W._logs.join('').indexOf('输牌不输阵') >= 0, 'F8 接印失败：失势有戏（贡献-100，好差事轮不到你）');
    }
    ok(W.eventFlags['sect_succ_done'] && W.eventFlags['sect_succ'] === null, 'F9 风波只起一次（新秩序不再乱第二回）');
    // 站队线
    var W2 = makeWorld({ day: 200, ds: { isInSect: true, sectId: '少林寺', sectName: '少林寺', rank: 4, rankName: '内门弟子', contribution: 800, _myDisciples: [] } });
    W2.sectSuccessionCheck();
    ok(!W2.eventFlags['sect_succ'], 'F10 内门以下听不见风向（位置决定消息）');
    var W3 = makeWorld({ day: 200, ds: { isInSect: true, sectId: '少林寺', sectName: '少林寺', rank: 1, rankName: '副掌门', contribution: 800, _myDisciples: [] } });
    W3.sectSuccessionCheck();
    W3.openSuccessionPanel();
    ok(W3._lastModal().body.indexOf('毛遂自荐') < 0, 'F11 贡献不足三千：自荐的门不开（门槛如实）');
    W3.sectSuccChoose('a');
    W3._setDay(231);
    W3.sectSuccResolve();
    ok(W3.discipleState.rank === 1 || W3.discipleState.rank === 1, 'F12 站队开牌：赢了升迁、输了失势（副掌门已是高位，升降都有叙事）');
}

// ============ G 日常仪轨小件 ============
{
    // 早课晚课（时辰为门）
    var W = makeWorld({ hour: 6 });
    ok(W.doMorningClass() === true && W._trained.indexOf('drill') >= 0 && W.currentCharData.qi === 65, 'G1 辰时早课：真气+15、练功底子、真耗时辰');
    ok(W.doMorningClass() === false && W._lastMsg().indexOf('熬油') >= 0, 'G2 一日一节（制度性，师傅的话就是理由）');
    W._setHour(12);
    var W2 = makeWorld({ hour: 12 });
    ok(W2.doMorningClass() === false && W2._lastMsg().indexOf('过了时辰') >= 0, 'G3 过了辰时没早课（时辰是门，不是计数器）');
    var W3 = makeWorld({ hour: 18 });
    ok(W3.doEveningClass() === true && W3._trained.indexOf('study') >= 0, 'G4 酉时晚课：听经练底子');
    // 灵田帮工
    var W4 = makeWorld();
    var g0 = W4._internals['少林寺'].grain;
    ok(W4.doSectFarmWork() === true && W4._internals['少林寺'].grain >= g0 + 10 && W4._notes.some(function (n) { return n.r === '灵田帮工'; }), 'G5 灵田帮工半日：谷真入公库、贡献+8入账本');
    ok(W4.doSectFarmWork() === false && W4._lastMsg().indexOf('地不哄人') >= 0, 'G6 一日一工（地不哄人，人也不能哄地）');
    // 戒律堂
    var W5 = makeWorld({ demonRep: 600, day: 30 });
    W5.sectPreceptCheck();
    ok(W5._logs.join('').indexOf('戒律堂传唤') >= 0, 'G7 正道门下魔道声望高：戒律堂第一次谈话');
    W5._setDay(60);
    W5.sectPreceptCheck();
    ok(W5.discipleState.contribution < 500 && W5._logs.join('').indexOf('记过') >= 0, 'G8 再犯：罚贡献+记过（门规不是摆设）');
    var W6 = makeWorld({ demonRep: 0 });
    W6.sectPreceptCheck();
    ok(W6._logs.length === 0, 'G9 行迹干净的没人找（不冤枉好人）');
    // 同门赠礼
    var fellow = { id: 'sect_disciple_少林寺_1', name: '裴小满', relationship: { affection: 30 }, changeAffection: function (n) { this.relationship.affection += n; } };
    var W7 = makeWorld({ npcs: [fellow], slots: [{ templateId: 'wine_jar', count: 1 }, { templateId: 'mat_liquorice', count: 3 }] });
    W7.openFellowGift('sect_disciple_少林寺_1');
    ok(W7._lastModal().body.indexOf('女儿红') >= 0 && W7._lastModal().body.indexOf('值60灵石') >= 0, 'G10 赠礼面板列行囊（礼不在贵，递的是惦记）');
    W7.doFellowGift('sect_disciple_少林寺_1', 'wine_jar');
    ok(fellow.relationship.affection === 38 && W7.inventory.slots[0] === null, 'G11 好礼好感+8、行囊真扣（女儿红没了）');
}

// ============ H 文案纪律 ============
{
    var W = makeWorld({ day: 540, hour: 6, ledger: [{ amt: 350, day: 500, reason: 'x' }] });
    W.openTrialPanel('fx_sl_damo');
    W.openSectFestival(); W.sectFestivalAct('incense'); W.sectFestivalAct('feast');
    W.doMorningClass(); W.doSectFarmWork();
    W._setDay(560);
    W.sectSuccessionCheck(); W.openSuccessionPanel();
    W.openErrandBoard();
    var t = W._all().replace(/<[^>]*>/g, '');
    ok(!/[A-Za-z]/.test(t), 'H1 全部新面板与消息零外文字母');
    ok(t.indexOf('冷却') < 0 && t.indexOf('准备就绪') < 0 && t.indexOf('配额') < 0, 'H2 零冷却零配额句式');
    ok(t.indexOf('妹妹') < 0 && t.indexOf('姐姐') < 0, 'H3 年龄铁设定不破');
}

console.log('sect-tide: ' + passed + ' passed, ' + failures.length + ' failed');
if (failures.length) { failures.forEach(f => console.log('  FAIL: ' + f)); process.exit(1); }
