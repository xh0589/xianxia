/**
 * sect-visit-node.js — 第三十六波 · 散修拜山三事 验收：
 *   A 递拜山帖：礼金真扣、交情真涨、一日一回、钱不够不办事
 *   B 演武切磋：精力闸、走既有 _isSpar 通道挂真标记、胜负结算落交情与彩头、对手按宗门体量分强弱
 *   C 藏经借抄：交情门槛、抄费按功法表在册价真扣、掌握度落 artInsights（运功栏真出口）、镇派神功不外传
 *   D 渲染与接线哨兵：外院待客卡、野外图山门 → 山门场景、app.js 两处结算钩子
 *
 * 运行：node tests/sect-visit-node.js
 */
'use strict';

var fs = require('fs');
var vm = require('vm');
var path = require('path');
var ROOT = path.resolve(__dirname, '..');

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; console.log('  ✓ ' + msg); }
    else { failed++; console.error('  ✗ ' + msg); }
}
function eq(a, b, msg) { assert(a === b, msg + '（实际=' + JSON.stringify(a) + ' 期望=' + JSON.stringify(b) + '）'); }

// ==================== 共享全局桩 ====================
global.window = global;
var msgs = [];
global.showMessage = function (m, t) { msgs.push({ m: String(m), t: t }); };
var absDayVal = 300;
global.timeSystem = {
    advanceTime: function () {},
    getAbsoluteDay: function () { return absDayVal; }
};
var wallet = { stones: 5000 };
global.DataManager = {
    getSpiritStones: function () { return wallet.stones; },
    deductSpiritStones: function (n) { if (wallet.stones >= n) { wallet.stones -= n; return true; } return false; },
    addSpiritStones: function (n) { wallet.stones += n; }
};
var credits = [];
global.EconomyTransaction = { credit: function (kind, n) { credits.push({ kind: kind, n: n }); wallet.stones += n; } };
var battles = [];
global.startBattle = function (enemyData) {
    var b = { enemyData: enemyData };
    battles.push(b);
    global.currentBattle = b;
    return b;
};
var REALM_TIER = { '凡人': 0, '炼气': 1, '筑基': 2, '金丹': 3, '元婴': 4, '化神': 5 };
global.getRealmTier = function (r) { return REALM_TIER[r] != null ? REALM_TIER[r] : 1; };
global.realmScaledEnemyLevel = function (c) { return (REALM_TIER[c.realm] || 1) * 3; };
global.updateCurrencyUI = function () {};
global.updateCharacterStatus = function () {};
global.currentCharData = { name: '测试散修', realm: '金丹', energy: 100, health: 100 };
global.discipleState = {};
global.sectsData = {
    '少林寺': { type: '正道', location: '中州', desc: '佛门正宗。', power: '巨擘', weapons: '棍棒、拳脚' },
    '药王谷': { type: '正道', location: '东荒', desc: '医者仁心。', power: '小', weapons: '银针、药锄' }
};
global.SECT_SPECIFIC_ARTS = {
    '少林寺': [
        { id: 'art_shaolin_quan', name: '少林长拳', type: '拳掌', grade: '八品', tier: 1, copyPrice: 300, desc: '入门拳法' },
        { id: 'art_sl_luohan', name: '罗汉伏魔功', type: '内功', grade: '七品', tier: 2, copyPrice: 800, desc: '内壮功法' },
        { id: 'art_yi_jin_jing', name: '易筋经', type: '内功', grade: '三品', tier: 4, copyPrice: 3000, desc: '无上内功' }
    ],
    '药王谷': [
        { id: 'art_yw_herb', name: '药王摄生诀', type: '内功', grade: '八品', tier: 1, copyPrice: 300, desc: '养生功' }
    ]
};
global.SECT_FACILITY_ACCESS = {};
global.document = {
    getElementById: function () { return { classList: { remove: function () {}, add: function () {} }, innerHTML: '', style: {} }; },
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    createElement: function () { return { className: '', innerHTML: '', onclick: null, remove: function () {}, firstChild: null }; },
    body: { appendChild: function () {} }
};
global.StateRegistry = { register: function () {} };
global.localStorage = { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} };

vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'js/sects/sect-visit.js'), 'utf8'), { filename: 'js/sects/sect-visit.js' });

function favor(name) { return global.sectVisitFavor(name); }
function ledger(name) { return global.currentCharData._sectVisit[name]; }

// ==================== A · 递拜山帖 ====================
console.log('\n[A] 递拜山帖（礼金真扣、交情真涨、一日一回）');
{
    msgs.length = 0;
    assert(global.sectVisitGift('少林寺') === true, 'A1 头一回递帖成礼');
    eq(wallet.stones, 4980, 'A2 礼金 20 灵石真扣');
    eq(favor('少林寺'), 1, 'A3 交情 +1 落账');
    assert(ledger('少林寺').lastGiftDay === 300, 'A4 日闸记账（今日已递）');
    assert(msgs.some(function (m) { return m.m.indexOf('拜山帖') >= 0 && m.t === 'success'; }), 'A5 成礼有话术');
    // 同日二递
    msgs.length = 0;
    assert(global.sectVisitGift('少林寺') === false, 'A6 同日再递被拒');
    eq(wallet.stones, 4980, 'A7 拒了不扣钱');
    eq(favor('少林寺'), 1, 'A8 交情不重复涨');
    assert(msgs.some(function (m) { return m.m.indexOf('礼就不必天天带') >= 0; }), 'A9 拒得有知客弟子的话术');
    // 钱不够
    wallet.stones = 5;
    absDayVal = 301;
    assert(global.sectVisitGift('少林寺') === false, 'A10 礼金不齐递不了帖');
    eq(favor('少林寺'), 1, 'A11 未成分文不动、交情不涨');
    wallet.stones = 5000;
    // 隔天可再递
    assert(global.sectVisitGift('少林寺') === true, 'A12 隔了一天又能递（日闸翻新）');
    eq(favor('少林寺'), 2, 'A13 交情接着涨');
}

// ==================== B · 演武切磋 ====================
console.log('\n[B] 演武切磋（精力闸、真战斗通道、胜负结算、体量分强弱）');
{
    // 精力闸
    global.currentCharData.energy = 5;
    battles.length = 0;
    assert(global.sectVisitSpar('少林寺') === false, 'B1 精力不足上不了场');
    eq(battles.length, 0, 'B2 拒了不开战');
    // 正常开战
    global.currentCharData.energy = 100;
    assert(global.sectVisitSpar('少林寺') === true, 'B3 切磋开战');
    eq(global.currentCharData.energy, 90, 'B4 精力真扣 10（竞技场同口径）');
    var b = battles[0];
    assert(b.enemyData.name.indexOf('少林寺') >= 0 && b.enemyData.name.indexOf('切磋') >= 0, 'B5 对手名号带着宗门与「切磋」');
    assert(b._isSpar === true && b.noSpoils === true, 'B6 挂既有切磋语义（点到为止、不搜刮）');
    assert(b._isSectVisitSpar === true && b._visitSect === '少林寺', 'B7 挂拜山切磋标记（结算找得着这本账）');
    // 同日二切磋
    assert(global.sectVisitSpar('少林寺') === false, 'B8 同日再切磋被拒');
    eq(battles.length, 1, 'B9 拒了不开第二场');
    // 胜结算
    var f0 = favor('少林寺'), cr0 = credits.length;
    global.currentBattle = { _visitSect: '少林寺' };
    global.settleSectVisitSpar(true);
    eq(favor('少林寺'), f0 + 2, 'B10 胜：交情 +2');
    assert(credits.length === cr0 + 1 && credits[credits.length - 1].n === 30, 'B11 胜：彩头 30 灵石走 EconomyTransaction 真账');
    // 败结算
    var f1 = favor('少林寺'), cr1 = credits.length;
    global.settleSectVisitSpar(false);
    eq(favor('少林寺'), f1, 'B12 败：交情不涨不跌（败而不辱）');
    eq(credits.length, cr1, 'B13 败：没有彩头');
    // 体量分强弱：巨擘少林 vs 小派药王谷
    battles.length = 0;
    global.sectVisitSpar('药王谷');
    var small = battles[0].enemyData;
    var big = b.enemyData;
    assert(big.attack > small.attack && big.level > small.level, 'B14 巨擘门下的执役弟子比小派的强（体量偏置真生效）');
    assert(big.sect === '少林寺' && small.sect === '药王谷', 'B15 对手档案挂对宗门');
}

// ==================== C · 藏经借抄 ====================
console.log('\n[C] 藏经借抄（交情门槛、在册抄费、掌握度落真出口）');
{
    // 交情不足
    wallet.stones = 5000;
    msgs.length = 0;
    assert(global.sectVisitBorrow('药王谷', 'art_yw_herb') === false, 'C1 交情不足（0/5）借不了');
    eq(wallet.stones, 5000, 'C2 拒了不扣抄费');
    assert(msgs.some(function (m) { return m.m.indexOf('交情不足') >= 0; }), 'C3 拒了有执事话术');
    // 交情 5：流通卷可抄
    global.currentCharData._sectVisit['药王谷'] = { favor: 5, borrowed: {} };
    assert(global.sectVisitBorrow('药王谷', 'art_yw_herb') === true, 'C4 交情 5 分：流通卷借抄成');
    eq(wallet.stones, 4700, 'C5 抄费按功法表在册价真扣（300）');
    var ins = global.discipleState.artInsights['art_yw_herb'];
    assert(ins && ins.m === 30 && ins.heard === true, 'C6 掌握度落 artInsights（m=30，运功栏认的真出口）');
    assert(ins.from === '借抄·药王谷', 'C7 掌握度记着来路（借抄自哪家）');
    assert(ledger('药王谷').borrowed['art_yw_herb'] === absDayVal, 'C8 借抄日记账在个人名下');
    // 重复借抄
    wallet.stones = 5000;
    assert(global.sectVisitBorrow('药王谷', 'art_yw_herb') === false, 'C9 已抄在手不重复收钱');
    eq(wallet.stones, 5000, 'C10 分文未动');
    // 真传卷门槛
    global.currentCharData._sectVisit['少林寺'] = { favor: 5, borrowed: {} };
    assert(global.sectVisitBorrow('少林寺', 'art_sl_luohan') === false, 'C11 交情 5 分抄不了真传卷（需 8）');
    global.currentCharData._sectVisit['少林寺'].favor = 8;
    assert(global.sectVisitBorrow('少林寺', 'art_sl_luohan') === true, 'C12 交情 8 分：真传卷可抄');
    eq(wallet.stones, 4200, 'C13 真传卷抄费 800 真扣');
    // 镇派神功
    global.currentCharData._sectVisit['少林寺'].favor = 99;
    wallet.stones = 99999;
    msgs.length = 0;
    assert(global.sectVisitBorrow('少林寺', 'art_yi_jin_jing') === false, 'C14 交情 99 分也抄不了镇派神功');
    assert(!global.discipleState.artInsights['art_yi_jin_jing'], 'C15 镇派神功掌握度分毫未落');
    assert(msgs.some(function (m) { return m.m.indexOf('非亲传不外授') >= 0; }), 'C16 拒得有名目（不外传）');
    // 钱不够 / 查无此卷
    wallet.stones = 10;
    global.currentCharData._sectVisit['少林寺'].favor = 8;
    assert(global.sectVisitBorrow('少林寺', 'art_shaolin_quan') === false, 'C17 抄费不齐借不成');
    assert(!global.discipleState.artInsights['art_shaolin_quan'], 'C18 未成不落掌握度');
    assert(global.sectVisitBorrow('少林寺', 'art_不存在') === false, 'C19 查无此卷安静收场');
    // 流通卷正常路径（补 C17 那卷）
    wallet.stones = 5000;
    assert(global.sectVisitBorrow('少林寺', 'art_shaolin_quan') === true, 'C20 钱齐了流通卷照抄（300）');
    eq(global.discipleState.artInsights['art_shaolin_quan'].m, 30, 'C21 掌握度同规落账');
}

// ==================== D · 渲染与接线哨兵 ====================
console.log('\n[D] 渲染与接线哨兵');
{
    // 外院待客卡
    var html = global.renderSectVisitHospitality('少林寺', false);
    assert(html.indexOf('拜山待客') >= 0 && html.indexOf('递拜山帖') >= 0 && html.indexOf('演武切磋') >= 0, 'D1 游客外院有「拜山待客」卡（递帖+切磋）');
    // 借抄清单：铺一门交情已到、卷未抄的宗（少林此时交情不足且有卷已抄，验不出按钮态）
    global.SECT_SPECIFIC_ARTS['峨眉派'] = [
        { id: 'art_em_jiuyang', name: '峨眉九阳功', type: '内功', grade: '八品', tier: 1, copyPrice: 300, desc: '入门内功' }
    ];
    global.currentCharData._sectVisit['峨眉派'] = { favor: 5, borrowed: {} };
    var html2 = global.renderSectVisitHospitality('峨眉派', false);
    assert(html2.indexOf('藏经阁借抄') >= 0 && html2.indexOf('《峨眉九阳功》') >= 0 && html2.indexOf('借抄 · 300 灵石') >= 0, 'D2 借抄清单列功法与在册抄费（交情够了出真按钮）');
    assert(html.indexOf('藏经阁借抄') >= 0 && html.indexOf('《少林长拳》') >= 0, 'D2b 交情不足的宗：卷目照列、门槛如实写');
    assert(html.indexOf('镇派神功，非亲传不外授') >= 0, 'D3 镇派卷在卡面上就写明不外授');
    eq(global.renderSectVisitHospitality('少林寺', true), '', 'D4 自家弟子不显示待客卡（本派走贡献账，不两本）');
    // 源码接线
    var sv = fs.readFileSync(path.join(ROOT, 'js/sects/sect-visit.js'), 'utf8');
    assert(sv.indexOf('renderSectVisitHospitality(sectName, isMember)') > 0 && sv.indexOf('showSectOuterView') > 0, 'D5 待客卡真挂进外院视图');
    var segNew = sv.slice(sv.indexOf('散修拜山三事'));
    assert(!segNew.includes('alert(') && !segNew.includes('confirm('), 'D6 新段零浏览器原生弹窗');
    var rm = fs.readFileSync(path.join(ROOT, 'js/map/randomMap.js'), 'utf8');
    var iGate = rm.indexOf('window.showSectGateScene(otherName)');
    var iSel = rm.indexOf('window.selectSect(poi.refId || poi.name)');
    assert(iGate > 0 && iGate < iSel, 'D7 野外图山门优先开真山门场景（介绍卡只当回退）');
    var app = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
    assert(app.indexOf('window.settleSectVisitSpar(true)') > 0 && app.indexOf('window.settleSectVisitSpar(false)') > 0, 'D8 app.js 胜负两处结算钩子都在');
    assert(app.indexOf("!currentBattle._isSectSpar && !currentBattle._isSectVisitSpar") > 0, 'D9 拜山切磋不算「真仗」——门中底子不重复计');
    var htmlFile = fs.readFileSync(path.join(ROOT, '仙侠.html'), 'utf8');
    assert(htmlFile.indexOf('js/sects/sect-visit.js') > 0, 'D10 拜山模块在页面脚本清单里');
    // 交情账不碰宗门邦交账
    assert(sv.indexOf('SECT_DIPLOMACY_STATE') < sv.indexOf('SECT_VISIT_CFG') || sv.slice(sv.indexOf('SECT_VISIT_CFG')).indexOf('SECT_DIPLOMACY_STATE') < 0, 'D11 个人交情与宗门邦交两本账互不相犯');
    eq(typeof global.SECT_VISIT_CFG, 'object', 'D12 配置常数对外可查（测试与哨兵同源）');
}

console.log('\n========== 第三十六波 · 散修拜山三事 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
