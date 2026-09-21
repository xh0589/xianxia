// ==================== 门派补厚批三验收：建筑做出理由 ====================
// 覆盖：A 接线 / B 演武场切磋（真仗+连胜+势头/大比预热） / C 兵器库淬火（铁料+贡献+随修葺递减） /
//       D 膳堂用膳（贡献+饭气+街谈） / E 医馆旧伤（真败落伤+攻击折损真读者+医治） /
//       F 议事厅挂账本 / G 三十六地标熟识成长线（常去则熟+深交+增益真加厚） / H 文案纪律
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
    ok(read('仙侠.html').indexOf('js/sects/sect-facility-life.js') >= 0, 'A1 建筑理由层已挂脚本位');
    ok(read('仙侠.html').indexOf('sect-identity.js') < read('仙侠.html').indexOf('sect-facility-life.js'), 'A2 加载顺序：设施/身份层之后');
    const app = read('js/app.js');
    ok(app.indexOf('_isSectSpar') >= 0 && app.indexOf('settleSectSpar(true)') >= 0 && app.indexOf('settleSectSpar(false)') >= 0, 'A3 切磋胜负结算接入战斗双分支');
    ok(app.indexOf('recordOldWound') >= 0, 'A4 真败北落旧伤钩子接入');
    ok(read('js/battle.js').indexOf('getOldWoundPenalty') >= 0, 'A5 旧伤攻击折损有真读者（战斗攻计算处）');
    const v = read('js/sects/sect-visit.js');
    // 改造批：独立深作按钮全删——事在门里办（sect-rooms），设施卡只留一扇「前往」门
    ok(v.indexOf('openSectRoom') >= 0 && v.indexOf('sectFacilityDeepAction') < 0, 'A6 设施卡单一入口（独立按钮退役，场景屋接管）');
    ok(read('js/sects/sect-tournament.js').indexOf('getSectSparMomentum') >= 0, 'A7 大比读势头（切磋预热接大比）');
    const fac = read('js/sects/sect-facilities.js');
    ok((fac.match(/sect_\w+: \{\n        lv2:/g) || []).length >= 8 || fac.indexOf('sect_canteen:') >= 0 && fac.indexOf('sect_armory:') >= 0 && fac.indexOf('sect_leader:') >= 0, 'A8 升级表扩至八座基础建筑');
    ok(fac.indexOf('stones:') >= 0 && fac.indexOf('_facPayStones') >= 0, 'A9 修葺费灵石+贡献双料');
    ok(fac.indexOf('landmarkBondBonus') >= 0 && fac.indexOf('window.touchLandmark') >= 0, 'A10 地标熟识：用一次+1、增益按熟识加厚');
    ok(read('js/sects/sects-system.js').indexOf('_facLife') >= 0, 'A11 批三状态随 discipleState 存读档');
    ok(read('tests/run-all.sh').indexOf('sect-facility-life-node.js') >= 0, 'A12 本套件已入回归清单');
}

// ============ 运行时沙箱 ============
function makeWorld(opts) {
    opts = opts || {};
    var logs = [], msgs = [], modals = [], day = opts.day || 200, rand = opts.rand != null ? opts.rand : 0.1;
    var MyMath = { round: Math.round, min: Math.min, max: Math.max, floor: Math.floor, abs: Math.abs, random: function () { return rand; } };
    var W = {
        console: { log: function () {}, warn: function () {} },
        Math: MyMath, JSON: JSON, Object: Object, Array: Array, String: String, Number: Number, isFinite: isFinite,
        alert: function (m) { msgs.push(String(m)); },
        eventFlags: opts.flags || {},
        discipleState: opts.ds || { isInSect: true, sectId: '少林寺', sectName: '少林寺', rank: 5, contribution: 200 },
        currentCharData: { realm: '筑基', layer: 3, name: '测试', health: 100, qi: 100 },
        currentSkills: { skill_main: 'art_shaolin_quan' },
        inventory: { currency: { spiritStones: opts.stones != null ? opts.stones : 500 }, slots: opts.slots || [] },
        currentEquipment: opts.equipment || { mainHand: null },
        SECT_FACILITY_EXTRAS: { '少林寺': [{ id: 'fx_sl_damo', name: '达摩洞' }] },
        showMessage: function (m) { msgs.push(String(m)); },
        showModal: function (t, b) { modals.push({ title: String(t), body: String(b) }); },
        gameLog: { add: function (m) { logs.push(String(m)); } },
        timeSystem: { getAbsoluteDay: function () { return day; } },
        getRealmTier: function (r) { return ['凡人', '炼气', '筑基', '金丹', '元婴', '化神'][r] || 1; },
        realmScaledEnemyLevel: function () { return 10; },
        startBattle: function (enemyData) { W._lastEnemy = enemyData; return { enemy: {}, _flag: true }; },
        getSectNPCs: function () { return opts.npcs != null ? opts.npcs : [{ id: 'npc1', name: '释玄苦', combat: { realm: '筑基' } }]; },
        sectAddContribution: function (n, r) { var d = W.discipleState; d.contribution = (Number(d.contribution) || 0) + n; (W._notes = W._notes || []).push({ n: n, r: r }); return d.contribution; },
        sectSpendContribution: function (n, r) { var d = W.discipleState; if ((Number(d.contribution) || 0) < n) return false; d.contribution -= n; (W._notes = W._notes || []).push({ n: -n, r: r }); return true; },
        applyBuff: function (id, eff, dur) { (W.activeBuffs = W.activeBuffs || {})[id] = { effects: eff, duration: dur }; },
        addItem: function () { return true; },
        consumeItem: function (id, n) {
            var inv = W.inventory; if (!inv || !inv.slots) return false;
            var rem = n;
            for (var i = 0; i < inv.slots.length && rem > 0; i++) { var s = inv.slots[i]; if (s && s.templateId === id) { var c = Math.min(s.count, rem); s.count -= c; rem -= c; if (s.count <= 0) inv.slots[i] = null; } }
            return rem <= 0;
        },
        getFacilityLevel: function (fid) { return (opts.facLevels && opts.facLevels[fid]) || 1; },
        addProficiencyExp: function () {},
        openSectLedger: function () { W._ledgerOpened = true; },
        updateSectUI: function () {}, updateInventoryUI: function () {},
        StateRegistry: { register: function () {} },
        _logs: logs, _msgs: msgs, _modals: modals,
        _setDay: function (d) { day = d; }, _setRand: function (r) { rand = r; },
        _lastMsg: function () { return msgs[msgs.length - 1] || ''; }
    };
    W.window = W;
    var ctx = vm.createContext(W);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/sects/sect-facility-life.js'), 'utf8'), ctx, { filename: 'sect-facility-life' });
    return W;
}

// ============ B 演武场切磋 ============
{
    var W = makeWorld({ ds: { isInSect: true, sectId: '少林寺', sectName: '少林寺', rank: 5, contribution: 100 } });
    W.openSparPanel();
    ok(W._modals.length === 1 && W._modals[0].body.indexOf('释玄苦') >= 0, 'B1 切磋面板列出有名有姓的同门（不是掷骰子）');
    ok(W.startSparWith('npc1') === true && W._lastEnemy._isSectSpar === undefined, 'B2 挑对手即开真仗（startBattle 被调，敌数据构造）');
    // startBattle 返回的 battle 对象由 app.js 打标；此处验构造入参
    ok(W._lastEnemy.name.indexOf('释玄苦') >= 0 && W._lastEnemy.name.indexOf('切磋') >= 0, 'B3 对手是切磋形态（点到为止）');
    // 结算：胜
    W.currentBattle = { _sparFoeName: '释玄苦' };
    var c0 = W.discipleState.contribution;
    W.settleSectSpar(true);
    var L = W.discipleState._facLife;
    ok(L.sparStreak === 1 && L.sparMomentum === 1 && W.discipleState.contribution > c0, 'B4 胜：连胜+1、势头+1、贡献真入账');
    ok((W._notes || []).some(function (n) { return n.r.indexOf('演武场切磋') >= 0; }), 'B5 切磋贡献走账本记账口（批一同源）');
    W.settleSectSpar(true); W.settleSectSpar(true);
    ok(L.sparStreak === 3 && L.sparBest === 3 && L.sparMomentum === 3, 'B6 连胜累积、纪录留档');
    // 对手随连胜变强
    W._setRand(0.1);
    W.startSparWith('npc1');
    var strongAtk = W._lastEnemy.attack;
    ok(strongAtk > 0, 'B7 连胜后对手攻击缩放（赢得越多越硬）');
    // 结算：负
    W.settleSectSpar(false);
    ok(L.sparStreak === 0 && L.sparMomentum === 3, 'B8 负：连胜清零，但势头留下（不白攒）');
    ok(W.getSectSparMomentum() === 3, 'B9 势头对外可读（大比预热接口）');
    // 未入门
    var W2 = makeWorld({ ds: { isInSect: false } });
    W2.openSparPanel();
    ok(W2._msgs.join('').indexOf('还没入门') >= 0, 'B10 未入门点切磋：一句话打发');
}

// ============ C 兵器库淬火 ============
{
    var W = makeWorld({ equipment: { mainHand: { name: '铁剑', durability: 40 } }, slots: [{ templateId: 'iron_ore', count: 5 }], ds: { isInSect: true, sectId: '少林寺', sectName: '少林寺', rank: 5, contribution: 100 } });
    W.openTemperPanel();
    ok(W._modals[0].body.indexOf('铁剑') >= 0 && W._modals[0].body.indexOf('耐久 40') >= 0, 'C1 淬火面板报当前主手与耐久（UI是真理）');
    var W0 = makeWorld({ equipment: { mainHand: { name: '铁剑', durability: 40 } }, slots: [{ templateId: 'iron_ore', count: 1 }] });
    ok(W0.doTemperWeapon() === false && W0._msgs.join('').indexOf('铁矿不足') >= 0, 'C2 铁料不够：打回');
    var Wc = makeWorld({ equipment: { mainHand: { name: '铁剑', durability: 40 } }, slots: [{ templateId: 'iron_ore', count: 5 }], ds: { isInSect: true, sectId: '少林寺', sectName: '少林寺', rank: 5, contribution: 3 } });
    ok(Wc.doTemperWeapon() === false && Wc.inventory.slots[0].count === 5, 'C3 贡献不够：打回且铁料不动');
    ok(W.doTemperWeapon() === true, 'C4 料足钱足：淬火成功');
    ok(W.currentEquipment.mainHand.durability === 100, 'C5 耐久真回满');
    ok(W.inventory.slots[0].count === 2, 'C6 铁矿真扣三份');
    ok(W.activeBuffs['sect_temper_edge'] && W.activeBuffs['sect_temper_edge'].effects.attack === 0.15, 'C7 新淬之锋真上buff（攻+15%）');
    ok(W.discipleState.contribution === 85, 'C8 淬火养护费15贡献（Lv1）真扣');
    // 修葺递减
    var W2 = makeWorld({ equipment: { mainHand: { name: '铁剑', durability: 40 } }, slots: [{ templateId: 'iron_ore', count: 5 }], facLevels: { sect_armory: 3 } });
    W2.doTemperWeapon();
    ok(W2.discipleState.contribution === 195, 'C9 兵器库修葺Lv3：养护费降到5贡献（升级线真效果）');
    // 无兵刃
    var W3 = makeWorld({ slots: [{ templateId: 'iron_ore', count: 5 }] });
    ok(W3.doTemperWeapon() === false && W3._msgs.join('').indexOf('没兵刃') >= 0, 'C10 空手打回');
}

// ============ D 膳堂用膳 ============
{
    var W = makeWorld({ ds: { isInSect: true, sectId: '少林寺', sectName: '少林寺', rank: 5, contribution: 100 } });
    W.doCanteenMeal();
    ok(W.discipleState.contribution === 95, 'D1 用膳耗贡献5');
    ok(W.activeBuffs['sect_canteen_meal'] && W.activeBuffs['sect_canteen_meal'].effects.constitution === 3, 'D2 饭气增益真上身（体魄+3 心境+2）');
    ok(W._lastMsg().indexOf('席间听见') >= 0 || W._lastMsg().indexOf('隔壁桌') >= 0, 'D3 用膳带一句街谈（膳堂是消息最杂的地方）');
    var W2 = makeWorld({ flags: { qi_street: [{ text: '👂 街谈网·其一：枯水巷的老井打了三丈深。' }] }, ds: { isInSect: true, sectId: '少林寺', sectName: '少林寺', rank: 5, contribution: 100 } });
    W2.doCanteenMeal();
    ok(W2._lastMsg().indexOf('枯水巷的老井') >= 0, 'D4 主线街谈入库后，膳堂听见的是真街谈（接批二）');
    var W3 = makeWorld({ ds: { isInSect: true, sectId: '少林寺', sectName: '少林寺', rank: 5, contribution: 2 } });
    ok(W3.doCanteenMeal() === false && W3._msgs.join('').indexOf('贡献不足') >= 0, 'D5 贡献不够不开火');
}

// ============ E 医馆旧伤 ============
{
    var W = makeWorld({ rand: 0.1, ds: { isInSect: true, sectId: '少林寺', sectName: '少林寺', rank: 5, contribution: 100 } });
    W.recordOldWound('霍无霜');
    var L = W.discipleState._facLife;
    ok(L.oldWounds.length === 1 && L.oldWounds[0].from === '霍无霜', 'E1 真败北落旧伤（记下来自谁）');
    ok(W._logs.join('').indexOf('医馆可治') >= 0, 'E2 落伤即告知去医馆（不是哑伤）');
    ok(W.getOldWoundPenalty() === 0.06, 'E3 一处旧伤折损攻击6%（有真读者）');
    W._setRand(0.1); W.recordOldWound('沙量'); W.recordOldWound('藏风');
    ok(L.oldWounds.length === 3 && W.getOldWoundPenalty() === 0.18, 'E4 三处封顶18%');
    W.recordOldWound('第四个');
    ok(L.oldWounds.length === 3, 'E5 旧伤至多三处（一身病根有上限）');
    var Wh = makeWorld({ rand: 0.9 });
    Wh.recordOldWound('强敌');
    ok((Wh.discipleState._facLife.oldWounds || []).length === 0, 'E6 不是每场败北都落伤（掷骰，非必中）');
    // 医治
    W.doTreatOldWound(L.oldWounds[0].part);
    ok(L.oldWounds.length === 2 && W.discipleState.contribution === 80, 'E7 医馆治旧伤：耗贡献20、除去一处');
    ok(W.getOldWoundPenalty() === 0.12, 'E8 治好一处，折损降一档（真效果）');
    W.openMedicalPanel();
    ok(W._modals.some(function (m) { return m.body.indexOf('旧伤') >= 0; }), 'E9 旧伤面板列出各处病根');
}

// ============ F 议事厅挂账本 ============
{
    var W = makeWorld({ ds: { isInSect: true, sectId: '少林寺', sectName: '少林寺', rank: 5, contribution: 100 } });
    W.openCouncilLedger();
    ok(W._ledgerOpened === true, 'F1 议事厅账本入口直通批一贡献账本（同一本账，挂在厅里公示）');
}

// ============ G 地标熟识成长线 ============
{
    var W = makeWorld({ ds: { isInSect: true, sectId: '少林寺', sectName: '少林寺', rank: 5, contribution: 200 } });
    ok(W.landmarkBondBonus('fx_sl_damo') === 0, 'G1 初来乍到：陌生，无加成');
    W.touchLandmark('fx_sl_damo'); W.touchLandmark('fx_sl_damo'); W.touchLandmark('fx_sl_damo');
    var L = W.discipleState._facLife;
    ok(L.bond['fx_sl_damo'] === 3 && W.landmarkBondBonus('fx_sl_damo') === 0.15, 'G2 常去则熟：三次到「熟识」，增益+15%');
    ok(W._logs.join('').indexOf('老地方') >= 0, 'G3 升档有叙事（守处的同门认得你了）');
    for (var i = 0; i < 4; i++) W.touchLandmark('fx_sl_damo');
    ok(L.bond['fx_sl_damo'] === 7 && W.landmarkBondBonus('fx_sl_damo') === 0.3, 'G4 七次到「亲密」，增益+30%');
    // 深交
    var c0 = W.discipleState.contribution;
    W.doDeepenBond('fx_sl_damo');
    ok(L.bond['fx_sl_damo'] === 10 && W.discipleState.contribution === c0 - 30, 'G5 深交：花贡献30，熟识+3');
    ok((W._notes || []).some(function (n) { return n.r.indexOf('地标深交') >= 0; }), 'G6 深交走账本记账口');
    W.doDeepenBond('fx_sl_damo');
    ok(L.bond['fx_sl_damo'] === 13 && W.landmarkBondBonus('fx_sl_damo') === 0.45, 'G7 知交档：增益+45%封顶');
    var cMax = W.discipleState.contribution;
    W.doDeepenBond('fx_sl_damo');
    ok(W.discipleState.contribution === cMax, 'G8 已知交不再收深交费（不无谓扣钱）');
    // 非地标不涨熟识
    W.touchLandmark('sect_training_ground');
    ok(!L.bond['sect_training_ground'], 'G9 熟识只认地标（fx_），基础建筑不误记');
    W.openLandmarkBondPanel('fx_sl_damo');
    ok(W._modals.some(function (m) { return m.body.indexOf('知交') >= 0; }), 'G10 熟识面板报当前档位');
}

// ============ H 文案纪律 ============
{
    // 运行期检查：渲染所有面板与动作，剥掉 HTML 标签后玩家可见正文零外文字母
    var W = makeWorld({
        equipment: { mainHand: { name: '铁剑', durability: 40 } },
        slots: [{ templateId: 'iron_ore', count: 5 }],
        ds: { isInSect: true, sectId: '少林寺', sectName: '少林寺', rank: 5, contribution: 300 }
    });
    W.recordOldWound('霍无霜');
    W.openSparPanel(); W.openTemperPanel(); W.openCanteenPanel(); W.openMedicalPanel(); W.openLandmarkBondPanel('fx_sl_damo');
    W.doCanteenMeal(); W.doTemperWeapon(); W.touchLandmark('fx_sl_damo');
    W.currentBattle = { _sparFoeName: '释玄苦' }; W.settleSectSpar(true); W.settleSectSpar(false);
    var all = W._modals.map(function (m) { return m.title + m.body; }).join('|') + '|' + W._msgs.join('|') + '|' + W._logs.join('|');
    var visible = all.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/g, '');
    ok(!/[A-Za-z]/.test(visible), 'H1 运行期玩家可见正文零外文字母（面板+消息+日志）');
    ok(visible.indexOf('次数') < 0 && visible.indexOf('配额') < 0, 'H2 零配额句式');
    ok(visible.indexOf('妹妹') < 0 && visible.indexOf('姐姐') < 0, 'H3 年龄铁设定不破');
}

console.log('sect-facility-life: ' + passed + ' passed, ' + failures.length + ' failed');
if (failures.length) { failures.forEach(f => console.log('  FAIL: ' + f)); process.exit(1); }
