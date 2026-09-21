// ==================== 门派改造批验收：底子被动化 / 一栋建筑一扇门 / 商路流通守恒 ====================
// 覆盖：A 接线 / B 门中底子（行为练级四档+战斗真读者+枯年打折+换派清零） /
//       C 场景屋（医馆问诊一体化吃公库丹药/膳堂一饭/铁匠开口/地标熟识织入/坐诊帮手按底子显隐） /
//       D 商路（三十日一班/守恒转移含损耗/押运真仗胜负两本账/张榜入口） / E 文案纪律
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
    ok(html.indexOf('sect-passives.js') >= 0 && html.indexOf('sect-rooms.js') >= 0 && html.indexOf('sect-trade.js') >= 0, 'A1 三个新模块已挂脚本位');
    ok(html.indexOf('sect-passives.js') < html.indexOf('sect-rooms.js'), 'A2 顺序：底子先于场景屋');
    const app = read('js/app.js');
    ok(app.indexOf('sectPassiveAttrs') >= 0, 'A3 底子六维有战斗真读者（buildPlayerBattleEntity）');
    ok(app.indexOf("sectPassiveTrain('battle')") >= 0 && app.indexOf("sectPassiveTrain('mine')") >= 0 && app.indexOf("sectPassiveTrain('gather')") >= 0, 'A4 真仗/挖矿/采药三处行为练功钩子');
    ok(app.indexOf('_isTradeEscortBattle') >= 0 && app.indexOf('settleTradeEscort(true)') >= 0 && app.indexOf('settleTradeEscort(false)') >= 0, 'A5 押运战胜负接入双分支');
    const sys = read('js/sects/sects-system.js');
    ok(sys.indexOf('_passive') >= 0 && sys.indexOf('discipleState._passive = { xp: 0 }') >= 0, 'A6 底子随档+入门清零重练');
    const v = read('js/sects/sect-visit.js');
    // 十三波修订：特色按钮由「独立清零」改为「带门的正门」——useSectSpecialty 只出现在身份卡上
    //（precheck/costText 有代价的八派活内容才亮），旧纯增益条目照旧没有按钮；熟识/深作按钮仍清零
    ok(v.indexOf('openLandmarkBondPanel') < 0 && v.indexOf('sectFacilityDeepAction') < 0, 'A7 熟识按钮/深作按钮全退役（独立按钮清零）');
    ok(v.indexOf('useSectSpecialty') >= 0 && v.indexOf('precheck') >= 0 && v.indexOf('costText') >= 0, 'A7b 旧特色按钮改带门的身份正门（只亮有代价的活内容）');
    ok(v.indexOf('openSectRoom') >= 0, 'A8 设施卡单一入口：进门就是门里的日子');
    ok(read('js/sects/sect-facilities.js').indexOf('titheWorkshop') >= 0, 'A9 地标工坊产出半数入公库（守恒来路）');
    ok(read('tests/run-all.sh').indexOf('sect-rebirth-node.js') >= 0, 'A10 本套件已入回归清单');
}

// ============ B 门中底子（运行时） ============
function makePassiveWorld(opts) {
    opts = opts || {};
    var msgs = [], logs = [], day = 100;
    var W = {
        console: { log: function () {}, warn: function () {} },
        Math: Math, JSON: JSON, Object: Object, Array: Array, String: String, Number: Number, isFinite: isFinite,
        eventFlags: opts.flags || {},
        discipleState: opts.ds || { isInSect: true, sectId: '少林寺', sectName: '少林寺', rank: 5, contribution: 0 },
        gameLog: { add: function (m) { logs.push(String(m)); } },
        showMessage: function (m) { msgs.push(String(m)); },
        timeSystem: { getAbsoluteDay: function () { return day; } },
        _msgs: msgs, _logs: logs
    };
    W.window = W;
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/sects/sect-passives.js'), 'utf8'), vm.createContext(W), { filename: 'sect-passives' });
    return W;
}
{
    var W = makePassiveWorld();
    ok(JSON.stringify(W.sectPassiveAttrs()) === '{}', 'B1 没练过就没有底子（入身的是可能性，不是白送的数值）');
    W.sectPassiveTrain('battle');
    ok(W.discipleState._passive.xp === 10, 'B2 真仗打赢长功底');
    W.sectPassiveTrain('gather');
    ok(W.discipleState._passive.xp === 10, 'B3 少林弟子采药不长外功底子（各练各的，不串功）');
    for (var i = 0; i < 9; i++) W.sectPassiveTrain('battle', true);
    ok(W.sectPassiveLevel() === 1, 'B4 功底满百：小成');
    var at = W.sectPassiveAttrs();
    ok(at.constitution === 3 && at.strength === 2, 'B5 小成底子真加六维（外功底子：体质+3力量+2）');
    W.discipleState._passive.xp = 260;
    ok(W.sectPassiveLevel() === 2 && W.sectPassiveAttrs().constitution === 6, 'B6 大成翻倍（练出来的档位）');
    W.discipleState._passive.xp = 500;
    var full = W.sectPassiveLevel();
    W.discipleState._passive.xp = 499;
    ok(full === 3 && W.sectPassiveLevel() === 2, 'B7 圆满档在500（差一分都不算）');
    W.discipleState._passive.xp = 500;
    W.eventFlags['qi_stage'] = 2;
    ok(W.sectPassiveAttrs().constitution === 6.8, 'B8 枯年底子打折（9×0.75=6.8——接主线总闸，UI卡面如实标注）');
    var W2 = makePassiveWorld({ ds: { isInSect: true, sectId: '丐帮', sectName: '丐帮', rank: 5, contribution: 0, _passive: { xp: 120 } } });
    ok(W2.sectPassiveHas('ears') === true, 'B9 丐帮百耳底子：特殊读者点亮（膳堂多听一条的真钥匙）');
    var W3 = makePassiveWorld({ ds: { isInSect: true, sectId: '丐帮', sectName: '丐帮', rank: 5, _passive: { xp: 0 } } });
    ok(W3.sectPassiveHas('ears') === false, 'B10 没练出底子就没有耳朵');
    var W4 = makePassiveWorld({ ds: { isInSect: true, sectId: '药王谷', sectName: '药王谷', rank: 5, _passive: { xp: 0 } } });
    W4.sectPassiveTrain('heal');
    ok(W4.discipleState._passive.xp === 4, 'B11 医药底子走行医练（药王谷）');
    W4.sectPassiveReset();
    ok(W4.discipleState._passive.xp === 0, 'B12 换派底子清零（旧派的功夫带不走）');
    var card = W.sectPassiveCard('少林寺');
    ok(card.indexOf('门中底子') >= 0 && card.indexOf('使用') < 0 && card.indexOf('冷却') < 0 && card.indexOf('准备就绪') < 0, 'B13 底子卡零按钮零冷却零「准备就绪」（街机语言清零）');
    ok(card.indexOf('真仗') >= 0 && card.indexOf('练武') >= 0, 'B14 卡面写清怎么练（行为指引，不是黑箱）');
}

// ============ C 场景屋（运行时） ============
function makeRoomWorld(opts) {
    opts = opts || {};
    var msgs = [], logs = [], modals = [], buffs = [], day = 200;
    var W = {
        console: { log: function () {}, warn: function () {} },
        Math: Math, JSON: JSON, Object: Object, Array: Array, String: String, Number: Number, isFinite: isFinite,
        eventFlags: opts.flags || {},
        discipleState: opts.ds || { isInSect: true, sectId: '少林寺', sectName: '少林寺', rank: 5, contribution: 100, _facLife: { oldWounds: opts.wounds || [], bond: {} } },
        currentCharData: { realm: '筑基', name: '测试侠' },
        currentEquipment: opts.equipment || { mainHand: null },
        inventory: { currency: { spiritStones: 300 }, slots: [] },
        checkFacilityAccess: function () { return { accessible: true }; },
        useFacility: function (fid, o) { W._used = (W._used || []).push(fid) && W._used; W._used = W._used || []; W._used.push(fid); return (o && o.quiet) ? { ok: true, text: '（' + fid + '例行结算）' } : true; },
        SectGov: {
            probe: function () { return { pill: opts.pill != null ? opts.pill : 20 }; },
            deductStore: function (s, k, n) { (W._storeOut = W._storeOut || []).push({ k: k, n: n }); },
            openPanel: function () { W._govPanel = (W._govPanel || 0) + 1; }
        },
        applyBuff: function (id, eff, dur) { buffs.push({ id: id, eff: eff, dur: dur }); },
        sectLedgerEntries: function () { return [{ amt: 40, reason: '差事' }, { amt: -15, reason: '淬火' }]; },
        Tournament: { showTournamentPanel: function () { W._tourPanel = true; } },
        openSparPanel: function () { W._sparPanel = true; },
        doTemperWeapon: function () { W._tempered = true; return true; },
        doDeepenBond: function () { W._deepened = true; return true; },
        openSectLibraryPanel: function () { W._library = true; },
        sectAddContribution: function (n, r) { var d = W.discipleState; d.contribution += n; (W._notes = W._notes || []).push({ n: n, r: r }); },
        sectPassiveTrain: function (k) { (W._trained = W._trained || []).push(k); },
        sectPassiveHas: function (s) { return opts.hasSpecial === s; },
        SECT_PASSIVES: opts.passives || { '少林寺': { train: ['drill', 'battle'] }, '药王谷': { train: ['gather', 'heal', 'craft'] } },
        SECT_FACILITY_EXTRAS: { '少林寺': [{ id: 'fx_sl_damo', name: '达摩洞', desc: '达摩面壁九年之地' }] },
        timeSystem: { getAbsoluteDay: function () { return day; }, advanceTime: function () {} },
        showMessage: function (m) { msgs.push(String(m)); },
        showModal: function (t, b) { modals.push({ title: String(t), body: String(b) }); },
        gameLog: { add: function (m) { logs.push(String(m)); } },
        document: { getElementById: function () { return null; } },
        _msgs: msgs, _logs: logs, _modals: modals, _buffs: buffs,
        _lastModal: function () { return modals[modals.length - 1] || { title: '', body: '' }; }
    };
    W.window = W;
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/sects/sect-rooms.js'), 'utf8'), vm.createContext(W), { filename: 'sect-rooms' });
    return W;
}
{
    // 医馆：医师先看旧伤，问诊一件事
    var W = makeRoomWorld({ wounds: [{ part: '左肩', day: 90, from: '霍无霜' }], pill: 20 });
    W.openSectRoom('sect_medical');
    var body = W._lastModal().body;
    ok(body.indexOf('左肩') >= 0 && body.indexOf('旧伤拖太久') >= 0, 'C1 进门医师先说旧伤（不是菜单，是问诊）');
    ok(body.indexOf('库现存 20 炉') >= 0 && body.indexOf('坐诊帮手') < 0, 'C2 药材出公库如实报数；少林弟子没有坐诊选项（不凑功能）');
    W.doSectMedical();
    ok(W._storeOut.some(function (x) { return x.k === 'pill' && x.n === 5; }) && W.discipleState._facLife.oldWounds.length === 0, 'C3 问诊一次结完：旧伤治好、公库丹药真扣五炉');
    // 丹药不够：只能治到哪儿算哪儿
    var W2 = makeRoomWorld({ wounds: [{ part: '左肩' }, { part: '右肋' }], pill: 6 });
    W2.doSectMedical();
    ok(W2.discipleState._facLife.oldWounds.length === 1 && W2._logs.join('').indexOf('将养') >= 0, 'C4 公库丹药不够：治一处剩一处，医师为难（库存是真约束）');
    // 药王谷弟子：坐诊帮手在
    var W3 = makeRoomWorld({ ds: { isInSect: true, sectId: '药王谷', sectName: '药王谷', rank: 5, contribution: 100, _facLife: { oldWounds: [], bond: {} } } });
    W3.openSectRoom('sect_medical');
    ok(W3._lastModal().body.indexOf('坐诊帮手') >= 0, 'C5 医药底子的弟子多一扇工——帮诊（按门派显隐，不是人人有）');
    W3.doSectClinicHelp();
    ok(W3._trained.indexOf('heal') >= 0 && (W3._notes || []).some(function (n) { return n.r === '医馆坐诊帮手'; }), 'C6 帮诊：练底子+门里记功（贡献+5入账本）');
    // 膳堂：吃饭一件事
    var W4 = makeRoomWorld();
    W4.doSectMeal();
    ok(W4._buffs.some(function (b) { return b.id === 'sect_canteen_meal'; }) && W4._msgs.join('').indexOf('席间听见') >= 0 && W4._trained.indexOf('social') >= 0, 'C7 一饭结完：饭气+街谈+社交功底，一次进门全有');
    var W5 = makeRoomWorld({ hasSpecial: 'ears' });
    W5.doSectMeal();
    ok(W5._msgs.join('').indexOf('你的耳朵比人多') >= 0, 'C8 丐帮百耳：膳堂多听一条（底子的特殊读者真兑现）');
    // 兵器库：铁匠开口
    var W6 = makeRoomWorld({ equipment: { mainHand: { name: '青锋剑', durability: 40 } } });
    W6.openSectRoom('sect_armory');
    var b6 = W6._lastModal().body;
    ok(b6.indexOf('卷了。淬一淬吧') >= 0 && b6.indexOf('让他淬火养护') >= 0 && b6.indexOf('领今日份例') >= 0, 'C9 刃卷了铁匠主动开口（淬火是铁匠的话，不是菜单）');
    // 议事厅：账本挂墙上
    var W7 = makeRoomWorld();
    W7.openSectRoom('sect_chat');
    ok(W7._lastModal().body.indexOf('墙上的账') >= 0 && W7._lastModal().body.indexOf('进账 40') >= 0, 'C10 议事厅进门先看见墙上账本（进销一眼）');
    // 地标：熟识织入场景
    var W8 = makeRoomWorld();
    W8.discipleState._facLife.bond['fx_sl_damo'] = 8;
    W8.openSectRoom('fx_sl_damo');
    var b8 = W8._lastModal().body;
    ok(b8.indexOf('亲密') >= 0 && b8.indexOf('闭着眼都找得到') >= 0 && b8.indexOf('深交') >= 0, 'C11 地标场景织进熟识档位，深交是场景里的选项');
    // 演武场三件事
    var W9 = makeRoomWorld();
    W9.openSectRoom('sect_training_ground');
    var b9 = W9._lastModal().body;
    ok(b9.indexOf('找人切磋') >= 0 && b9.indexOf('自己练') >= 0 && b9.indexOf('看大比榜') >= 0, 'C12 演武场一扇门三件真事');
    // 权限门
    var W10 = makeRoomWorld();
    W10.checkFacilityAccess = function () { return { accessible: false, reason: '内门弟子方可入' }; };
    W10.openSectRoom('sect_armory');
    ok(W10._msgs.join('').indexOf('内门弟子方可入') >= 0, 'C13 场景屋沿用设施权限（不绕门规）');
}

// ============ D 商路（运行时） ============
function makeTradeWorld(opts) {
    opts = opts || {};
    var msgs = [], logs = [], day = opts.day != null ? opts.day : 30;
    var internals = {
        '药王谷': { resources: 100, material: 30, grain: 40, pill: 10, chronicle: [] },
        '铸剑山庄': { resources: 100, material: 10, grain: 40, pill: 0, chronicle: [] }
    };
    var W = {
        console: { log: function () {}, warn: function () {} },
        Math: Math, JSON: JSON, Object: Object, Array: Array, String: String, Number: Number, isFinite: isFinite,
        eventFlags: {},
        discipleState: opts.ds || { isInSect: true, sectId: '药王谷', sectName: '药王谷', rank: 5, contribution: 0 },
        currentCharData: { realm: '筑基' },
        inventory: { currency: { spiritStones: 100 } },
        SECT_INTERNAL: internals,
        SectGov: {
            affinity: function (s) { return s === '药王谷' ? { herb: 2, mat: 0, grain: 0 } : (s === '铸剑山庄' ? { herb: 0, mat: 2, grain: 0 } : { herb: 0, mat: 0, grain: 0 }); },
            internalRef: function (s) { return internals[s] || null; },
            ensureStores: function (s) { return internals[s] || null; },
            chronicle: function (s, t) { if (internals[s]) internals[s].chronicle.push({ day: day, text: t }); }
        },
        sectAddContribution: function (n, r) { var d = W.discipleState; d.contribution += n; (W._notes = W._notes || []).push({ n: n, r: r }); },
        startBattle: function (e) { W._lastEnemy = e; var b = { enemy: e }; W.currentBattle = b; return b; },
        getRealmTier: function () { return 2; },
        realmScaledEnemyLevel: function () { return 10; },
        timeSystem: { getAbsoluteDay: function () { return day; }, onNewDaySubscribe: function (fn) { (W._dayHooks = W._dayHooks || []).push(fn); } },
        EventBus: { on: function (ev, fn) { if (ev === 'newDay') (W._dayHooks = W._dayHooks || []).push(fn); } },
        showMessage: function (m) { msgs.push(String(m)); },
        gameLog: { add: function (m) { logs.push(String(m)); } },
        _msgs: msgs, _logs: logs,
        _setDay: function (d) { day = d; },
        _bumpDay: function (n) { day += n; (W._dayHooks || []).forEach(function (f) { f(); }); },
        _internals: internals
    };
    W.window = W;
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/sects/sect-trade.js'), 'utf8'), vm.createContext(W), { filename: 'sect-trade' });
    return W;
}
{
    var W = makeTradeWorld({ day: 29 });
    W._bumpDay(1); // day 30 → 开班
    var pr = W.SectTrade.probe();
    ok(pr.routes.length === 1 && pr.routes[0].state === 'open', 'D1 三十日一班：商路按营生配对开张（药多的卖药给打铁的）');
    ok(W._internals['药王谷'].chronicle.some(function (c) { return c.text.indexOf('商路') >= 0; }), 'D2 货源方编年落笔（资源流通看得见）');
    ok(W._logs.join('').indexOf('押运') >= 0, 'D3 涉及本门：张榜通知到玩家（议事厅可接）');
    // 押运真仗
    ok(W.doTradeEscort() === true && W.currentBattle._isTradeEscortBattle === true && W._lastEnemy.name.indexOf('佣军') >= 0, 'D4 接押运即真仗（劫道的佣军，不是掷骰子）');
    W.settleTradeEscort(true);
    ok(W.discipleState.contribution === 60 && (W._notes || []).some(function (n) { return n.r === '押运商路·护货有功'; }) && W.inventory.currency.spiritStones === 140, 'D5 护住了：贡献+60入账本、酬金+40真金');
    ok(W._internals['铸剑山庄'].material === 18 && W._internals['药王谷'].material === 20 && W._internals['药王谷'].resources === 115 && W._internals['铸剑山庄'].resources === 85, 'D6 守恒转移：出十到八（路上损耗两成）、货款十五真付真收');
    ok(W._internals['药王谷'].chronicle.some(function (c) { return c.text.indexOf('押的队') >= 0; }), 'D7 弟子押的队，编年记名');
    // 战败：货折半
    var W2 = makeTradeWorld({ day: 60 });
    W2._bumpDay(0); // day 60 → 新班
    W2.doTradeEscort();
    W2.settleTradeEscort(false);
    ok(W2._internals['铸剑山庄'].material === 14 && W2._internals['药王谷'].resources === 107 && W2.discipleState.contribution === 0, 'D8 被劫了：到门只剩四成、货款折半、押运无功（世界的账照记）');
    ok(W2._internals['药王谷'].chronicle.some(function (c) { return c.text.indexOf('遭了劫') >= 0; }) && W2._internals['铸剑山庄'].chronicle.some(function (c) { return c.text.indexOf('折在半路') >= 0; }), 'D9 遭劫两头都进编年（一头记劫、一头叹气）');
    // 不押也有商队自己走（世界不等你）
    var W3 = makeTradeWorld({ day: 29, ds: { isInSect: true, sectId: '武当派', sectName: '武当派', rank: 5 } });
    W3._bumpDay(1);
    W3._setDay(38); W3._bumpDay(0); // 过七日
    ok(W3._internals['铸剑山庄'].material === 18 && W3.SectTrade.probe().routes.length === 0, 'D10 没人押运，商队雇护卫照走——安稳到货（世界不等你）');
    // 张榜面板块
    var W4 = makeTradeWorld({ day: 30 });
    W4._bumpDay(0);
    var block = W4.SectTrade.panelBlock('药王谷');
    ok(block.indexOf('商路张榜') >= 0 && block.indexOf('接押运') >= 0, 'D11 政事面板张榜+押运入口（在厅里，不在墙上钉按钮）');
    ok(W4.SectTrade.panelBlock('武当派').indexOf('接押运') < 0, 'D12 别派的货你押不了（本门弟子才行）');
}

// ============ E 文案纪律 ============
{
    var W = makeRoomWorld({ wounds: [{ part: '左肩' }], pill: 20 });
    W.openSectRoom('sect_medical'); W.doSectMedical(); W.doSectMeal();
    W.openSectRoom('sect_chat'); W.openSectRoom('sect_training_ground'); W.openSectRoom('sect_armory'); W.openSectRoom('fx_sl_damo');
    var all = W._modals.map(function (m) { return m.title + m.body; }).join('|') + '|' + W._msgs.join('|') + '|' + W._logs.join('|');
    var visible = all.replace(/<[^>]*>/g, '');
    ok(!/[A-Za-z]/.test(visible), 'E1 场景屋玩家可见正文零外文字母');
    ok(visible.indexOf('冷却') < 0 && visible.indexOf('准备就绪') < 0 && visible.indexOf('配额') < 0, 'E2 零冷却零配额句式（街机语言清零）');
}

console.log('sect-rebirth: ' + passed + ' passed, ' + failures.length + ' failed');
if (failures.length) { failures.forEach(f => console.log('  FAIL: ' + f)); process.exit(1); }
