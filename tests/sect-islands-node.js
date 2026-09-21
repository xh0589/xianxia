// ==================== 门派补厚批五验收：孤岛打通 ====================
// 覆盖：A 接线 / B 大比解锁（弟子可开可参+自动开锣通知+截止准时开打+势头入战力） /
//       C 宗门战争因果（死仇自动攻山真仗+殿议兴兵门控+胜负真落外交与账本+自建宗门入外交网/宗门史入大事记） /
//       D 年目标资格叙事 / E 文案纪律
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
    ok(html.indexOf('js/sects/sect-war.js') >= 0 && html.indexOf('player-sect.js') < html.indexOf('sect-war.js'), 'A1 战争因果模块已挂脚本位（外交网/自建宗门之后）');
    const t = read('js/sects/sect-tournament.js');
    ok(t.indexOf('仅掌门可开启大比') < 0, 'A2 大比掌门锁拆除（533行系统不再是化外孤岛）');
    ok(t.indexOf('notifyPlayer') >= 0, 'A3 自家赛事开锣会通知玩家（不再静默开静默关）');
    ok(read('js/sects/sect-internal.js').indexOf('day % 90 === 0 || day % 360 === 0') < 0, 'A4 赛事调度改每日过一遍（截止即开打，不再拖83天）');
    const app = read('js/app.js');
    ok((app.match(/_isSectWarBattle/g) || []).length >= 2 && app.indexOf('settleSectWar(true)') >= 0 && app.indexOf('settleSectWar(false)') >= 0, 'A5 战争胜负接入战斗双分支');
    ok(read('js/sects/sect-year-goal.js').indexOf('议事厅提出来') >= 0, 'A6 年目标资格门带叙事（死键变活口）');
    const ui = read('js/sects/sects-deep-ui.js');
    ok(ui.indexOf('_canSetGoal') < 0 && ui.indexOf('宗门战争 · 殿议') >= 0, 'A7 年目标按钮不再按职位藏 + 殿议入口上架');
    ok(read('js/extensions/player-sect-ui.js').indexOf('openPlayerSectDiplomacy') >= 0, 'A8 自建宗门挂江湖外交入口');
    ok(read('tests/run-all.sh').indexOf('sect-islands-node.js') >= 0, 'A9 本套件已入回归清单');
}

// ============ B 大比解锁（运行时） ============
function makeTourWorld(opts) {
    opts = opts || {};
    var msgs = [], logs = [], day = opts.day || 1;
    var npcs = [
        { id: 'sect_disciple_少林寺_0', name: '沈铁衣', location: '少林寺', combat: { realm: '筑基', layer: 3, attack: 30, defense: 20, health: 100 } },
        { id: 'sect_disciple_少林寺_1', name: '裴小满', location: '少林寺', combat: { realm: '炼气', layer: 5, attack: 20, defense: 15, health: 80 } },
        { id: 'sect_disciple_少林寺_2', name: '陆沉', location: '少林寺', combat: { realm: '筑基', layer: 1, attack: 25, defense: 18, health: 90 } }
    ];
    var W = {
        console: { log: function () {}, warn: function () {} },
        Math: Math, JSON: JSON, Object: Object, Array: Array, String: String, Number: Number, isFinite: isFinite, Date: Date,
        discipleState: { isInSect: true, sectId: '少林寺', sectName: '少林寺', rank: opts.rank != null ? opts.rank : 5, rankName: '外门弟子' },
        currentCharData: { realm: '筑基', layer: 3, name: '测试' },
        getPlayerSectRole: function () { return 'disciple'; },
        getSectNPCs: function () { return npcs; },
        npcManager: { getNPC: function (id) { for (var i = 0; i < npcs.length; i++) if (npcs[i].id === id) return npcs[i]; return null; } },
        getSectSparMomentum: function () { return opts.momentum || 0; },
        getAbsoluteDay: function () { return day; },
        showMessage: function (m) { msgs.push(String(m)); },
        gameLog: { add: function (m) { logs.push(String(m)); } },
        EventBus: { emit: function () {}, on: function () {} },
        StateRegistry: { register: function () {} },
        _msgs: msgs, _logs: logs,
        _setDay: function (d) { day = d; }
    };
    W.window = W;
    var ctx = vm.createContext(W);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/sects/sect-tournament.js'), 'utf8'), ctx, { filename: 'sect-tournament' });
    return W;
}
{
    var W = makeTourWorld({ day: 5 });
    var ev = W.Tournament.openTournament('少林寺', 'season');
    ok(ev && ev.status === 'open', 'B1 弟子身份也能开小比（掌门锁已拆）');
    // 自动开锣 + 通知
    var W2 = makeTourWorld({ day: 89 });
    W2.Tournament.tickDay('少林寺', 90);
    var st2 = W2.Tournament._store()['少林寺'];
    ok(st2 && st2.currentEvent && st2.currentEvent.tier === 'season', 'B2 节令到点自动开比（不看玩家脸色）');
    ok(W2._msgs.join('').indexOf('开锣') >= 0 && W2._msgs.join('').indexOf('我要参赛') >= 0, 'B3 自家赛事开锣：通知送到，写清怎么报名');
    ok(st2.currentEvent.contestants.length >= 2, 'B4 同门自动报名（真名NPC陪打）');
    // 弟子参赛
    ok(W2.Tournament.playerParticipate(st2.currentEvent.id) === true, 'B5 外门弟子可参赛（全职位下场）');
    var me = st2.currentEvent.contestants.filter(function (c) { return c.type === 'player'; })[0];
    ok(me && me.power > 0, 'B6 玩家战力入册');
    // 势头折入战力
    var W3 = makeTourWorld({ day: 89, momentum: 5 });
    W3.Tournament.tickDay('少林寺', 90);
    var st3 = W3.Tournament._store()['少林寺'];
    W3.Tournament.playerParticipate(st3.currentEvent.id);
    var me3 = st3.currentEvent.contestants.filter(function (c) { return c.type === 'player'; })[0];
    ok(me3.power === me.power + 2, 'B7 演武场势头折入大比战力（批三预热真兑现：每两点折一点）');
    // 截止准时开打
    W2._setDay(98);
    W2.Tournament.tickDay('少林寺', 98);
    var stH = W2.Tournament._store()['少林寺'];
    ok(!stH.currentEvent && stH.history.length === 1, 'B8 截止次日赛事自动打完入史（不再拖到下季）');
    ok(stH.history[0].winnerName, 'B9 史册记下魁首名字');
    // 年度大比
    var W4 = makeTourWorld({ day: 359 });
    W4.Tournament.tickDay('少林寺', 360);
    ok(W4.Tournament._store()['少林寺'].currentEvent.tier === 'year', 'B10 每年正日自动开大比');
    var W5 = makeTourWorld({ day: 89 });
    W5.discipleState = { isInSect: true, sectId: '武当派', sectName: '武当派', rank: 5 };
    W5.Tournament.tickDay('少林寺', 90);
    ok(W5._msgs.length === 0, 'B11 别派开比不打扰你（通知只给本门）');
}

// ============ C 宗门战争因果（运行时） ============
function makeWarWorld(opts) {
    opts = opts || {};
    var msgs = [], logs = [], modals = [], journals = [], day = opts.day || 500, rand = opts.rand != null ? opts.rand : 0.5;
    var MyMath = { round: Math.round, min: Math.min, max: Math.max, floor: Math.floor, abs: Math.abs, random: function () { return rand; } };
    var dip = {
        '少林寺': {
            '血手门': { relation: -80, trade: 0, conflicts: 0, lastEvent: 0, treaties: [] },
            '铁掌帮': { relation: -50, trade: 0, conflicts: 0, lastEvent: 0, treaties: [] },
            '武当派': { relation: 30, trade: 0, conflicts: 0, lastEvent: 0, treaties: [] }
        }
    };
    var W = {
        console: { log: function () {}, warn: function () {} },
        Math: MyMath, JSON: JSON, Object: Object, Array: Array, String: String, Number: Number, isFinite: isFinite, Date: Date,
        eventFlags: opts.flags || {},
        discipleState: opts.ds || { isInSect: true, sectId: '少林寺', sectName: '少林寺', rank: 5, rankName: '外门弟子', contribution: 100 },
        currentCharData: { realm: '筑基', layer: 3, fame: 10 },
        inventory: { currency: { spiritStones: 100 } },
        sectsData: { '血手门': { type: '邪派', power: '中等' }, '铁掌帮': { type: '中立', power: '中等偏上' }, '武当派': { type: '正道', power: '大派' }, '少林寺': { type: '正道', power: '巨擘' } },
        SECT_DIPLOMACY_STATE: dip,
        saveSectDiplomacy: function () { W._dipSaved = (W._dipSaved || 0) + 1; },
        showSectDiplomacy: function (name) { W._dipPanel = name; },
        startBattle: function (enemy) { W._lastEnemy = enemy; var b = { enemy: enemy }; W.currentBattle = b; return b; },
        getRealmTier: function () { return 2; },
        realmScaledEnemyLevel: function () { return 10; },
        timeSystem: { getAbsoluteDay: function () { return day; }, onNewDaySubscribe: function (fn) { (W._dayHooks = W._dayHooks || []).push(fn); } },
        showMessage: function (m) { msgs.push(String(m)); },
        showModal: function (t, b) { modals.push({ title: String(t), body: String(b) }); },
        gameLog: { add: function (m) { logs.push(String(m)); } },
        sectAddContribution: function (n, r) { var d = W.discipleState; d.contribution += n; (W._notes = W._notes || []).push({ n: n, r: r }); },
        sectSpendContribution: function (n, r) { var d = W.discipleState; if (d.contribution < n) return false; d.contribution -= n; (W._notes = W._notes || []).push({ n: -n, r: r }); return true; },
        WorldJournal: { record: function (e) { journals.push(e); } },
        PlayerSect: {
            listMySects: function () { return opts.mySect != null ? opts.mySect : [{ id: 'ps1', name: '长青门', alignment: 'righteous' }]; },
            getSect: function () { return { name: '长青门' }; },
            addHistory: function (sid, text) { W._histCalls = (W._histCalls || 0) + 1; return true; }
        },
        EventBus: { on: function () {} },
        document: { getElementById: function () { return null; } },
        _msgs: msgs, _logs: logs, _modals: modals, _journals: journals,
        _setDay: function (d) { day = d; }, _setRand: function (r) { rand = r; },
        _bumpDay: function (n) { day += (n || 1); (W._dayHooks || []).forEach(function (fn) { fn(); }); },
        _lastMsg: function () { return msgs[msgs.length - 1] || ''; }
    };
    W.window = W;
    var ctx = vm.createContext(W);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/sects/sect-war.js'), 'utf8'), ctx, { filename: 'sect-war' });
    return W;
}
{
    // 死仇自动攻山
    var W = makeWarWorld({ rand: 0.01 });
    W._bumpDay(1);
    ok(W._lastEnemy && W.currentBattle._isSectWarBattle === true && W.currentBattle._warSide === 'defend', 'C1 死仇（关系-80）自动兵临山门：真仗开打（防守方）');
    ok(W._lastEnemy.name.indexOf('血手门') >= 0 && W._lastEnemy.name.indexOf('压山长老') >= 0, 'C2 来犯的是那家有仇的门派（不是随机野怪）');
    ok(W._logs.join('').indexOf('山门') >= 0, 'C3 开战有战书叙事');
    // 防守胜
    W.settleSectWar(true);
    ok(W.SECT_DIPLOMACY_STATE['少林寺']['血手门'].relation === -60 && W.discipleState.contribution === 160, 'C4 守胜：关系回暖+20、贡献+60');
    ok((W._notes || []).some(function (n) { return n.r === '护宗之战·击退来犯'; }), 'C5 战功走批一账本记账口');
    // 冷却
    W._lastEnemy = null; W.currentBattle = null; W._setRand(0.01);
    W._bumpDay(1);
    ok(!W._lastEnemy, 'C6 六十日喘气：刚打完不再开第二仗');
    // 宿怨(-50)不自动打
    var W2 = makeWarWorld({ rand: 0.01 });
    W2.SECT_DIPLOMACY_STATE['少林寺']['血手门'].relation = -50;
    W2._bumpDay(1);
    ok(!W2._lastEnemy, 'C7 宿怨不到死仇不动刀（战争是因果升级，不是天天打）');
    // 攻山胜
    var W3 = makeWarWorld({ ds: { isInSect: true, sectId: '少林寺', sectName: '少林寺', rank: 2, rankName: '长老', contribution: 10 } });
    W3.startWar && ok(typeof W3.doDeclareWar === 'function', 'C8 宣战入口存在');
    W3.currentBattle = { _isSectWarBattle: true, _warSect: '血手门', _warSide: 'attack', enemy: {} };
    var s0 = W3.inventory.currency.spiritStones;
    W3.settleSectWar(true);
    ok(W3.SECT_DIPLOMACY_STATE['少林寺']['血手门'].relation === -100 && W3.inventory.currency.spiritStones > s0 && W3.currentCharData.fame === 15, 'C9 攻胜：缴获灵石、名声+5、对方记仇（关系-35触底）');
    ok((W3._notes || []).some(function (n) { return n.r === '攻山之战·先登之功'; }), 'C10 攻山战功入账本');
    // 殿议门控
    var W4 = makeWarWorld();
    W4.initiateSectWarPrompt();
    ok(W4._msgs.join('').indexOf('长老以上') >= 0 && W4._modals.length === 0, 'C11 外门弟子点殿议：叙事打发（不弹死面板）');
    var W5 = makeWarWorld({ ds: { isInSect: true, sectId: '少林寺', sectName: '少林寺', rank: 2, contribution: 10 } });
    W5.initiateSectWarPrompt();
    var body = W5._modals[0].body;
    ok(body.indexOf('血手门') >= 0 && body.indexOf('铁掌帮') >= 0 && body.indexOf('武当派') < 0, 'C12 长老殿议：只列宿怨之门（交好的不上兵册）');
    ok(body.indexOf('死仇') >= 0 && body.indexOf('兴兵') >= 0, 'C13 名单标清恩怨深浅与兴兵按钮');
    // 宣战守卫
    ok(W5.doDeclareWar('武当派') === false && W5._lastMsg().indexOf('兴兵无名') >= 0, 'C14 对交好门派宣战：打回（无名之兵不出）');
    W5.eventFlags['sect_war_cd_铁掌帮'] = 99999;
    ok(W5.doDeclareWar('铁掌帮') === false && W5._lastMsg().indexOf('喘') >= 0, 'C15 冷却期内不重复动刀');
    ok(W5.doDeclareWar('血手门') === true && W5.currentBattle._warSide === 'attack', 'C16 对死仇兴兵：真仗开打（攻山方）');
    // 自建宗门入外交网
    var W6 = makeWarWorld();
    W6.openPlayerSectDiplomacy();
    ok(W6.SECT_DIPLOMACY_STATE['长青门'] && W6.SECT_DIPLOMACY_STATE['长青门']['少林寺'], 'C17 自建宗门在外交网落座（对36派各有亲疏）');
    ok(W6.SECT_DIPLOMACY_STATE['少林寺']['长青门'], 'C18 三十六派那头也认得它（双向落座）');
    ok(W6.SECT_DIPLOMACY_STATE['长青门']['少林寺'].relation > 0, 'C19 正道立宗与正道门派初始相亲（取向定亲疏）');
    ok(W6._dipPanel === '长青门', 'C20 外交面板即开');
    // 宗门史入大事记
    W6.PlayerSect.addHistory('ps1', '开山立宗');
    ok(W6._journals.some(function (j) { return j.title === '宗门史' && j.text.indexOf('长青门') >= 0; }), 'C21 宗门史每笔同步落世界大事记（化外之地入正史）');
}

// ============ D 年目标资格叙事（运行时） ============
{
    var msgs = [];
    var W = {
        console: { log: function () {}, warn: function () {} },
        Math: Math, JSON: JSON, Object: Object, Array: Array, String: String, Number: Number, isFinite: isFinite, Date: Date,
        discipleState: { isInSect: true, sectId: '少林寺', sectName: '少林寺', rank: 5, rankName: '外门弟子' },
        getAbsoluteDay: function () { return 100; },
        showMessage: function (m) { msgs.push(String(m)); },
        showModal: function () { msgs.push('MODAL'); },
        StateRegistry: { register: function () {} },
        _msgs: msgs
    };
    W.window = W;
    var ctx = vm.createContext(W);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/sects/sect-year-goal.js'), 'utf8'), ctx, { filename: 'sect-year-goal' });
    var r = W.SectYearGoal.promptChooseYearGoal('少林寺');
    ok(r === false && msgs.join('').indexOf('议事厅') >= 0 && msgs.join('').indexOf('外门弟子') >= 0, 'D1 弟子点年目标：叙事交代归谁定、路怎么走（不再静默装死）');
}

// ============ E 文案纪律 ============
{
    var W = makeWarWorld({ ds: { isInSect: true, sectId: '少林寺', sectName: '少林寺', rank: 2, contribution: 10 } });
    W.initiateSectWarPrompt();
    W.currentBattle = { _warSect: '血手门', _warSide: 'defend', enemy: {} };
    W.settleSectWar(true);
    W.openPlayerSectDiplomacy();
    var all = W._modals.map(function (m) { return m.title + m.body; }).join('|') + '|' + W._msgs.join('|') + '|' + W._logs.join('|');
    var visible = all.replace(/<[^>]*>/g, '');
    ok(!/[A-Za-z]/.test(visible), 'E1 运行期玩家可见正文零外文字母');
    ok(visible.indexOf('次数') < 0 && visible.indexOf('配额') < 0, 'E2 零配额句式');
    var tAll = makeTourWorld({ day: 89 });
    tAll.Tournament.tickDay('少林寺', 90);
    ok(!/[A-Za-z]/.test(tAll._msgs.join('|').replace(/<[^>]*>/g, '')), 'E3 大比通知零外文字母');
}

console.log('sect-islands: ' + passed + ' passed, ' + failures.length + ' failed');
if (failures.length) { failures.forEach(f => console.log('  FAIL: ' + f)); process.exit(1); }
