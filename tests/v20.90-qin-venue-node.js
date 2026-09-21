/**
 * v20.90-qin-venue-node.js — 琴韵流芳验收：
 *   Q1 琴入兵器谱：六具琴在册（钝击/主手/奇门），35 级断层也补了一具；battle 映射接线
 *   Q2 音律入生活技能册：名册三处齐；RewardService.lifeSkill 统一长进通道（封边 0~100）
 *   Q3 琴心映剑：持琴时音律折进攻击命中，空手/持别家伙分文不给；艺册底分带琴更肥
 *   Q4 勾栏瓦舍开台：登台抚琴赢/输两路真结算（打赏/长进/时间/精力），听曲、幕后练琴、传艺都在
 *   Q5 接线：城中 16 座城挂牌、卡面、入口函数、HTML 加载序、引擎 lifeSkill 现算
 *
 * 运行：node tests/v20.90-qin-venue-node.js
 */
'use strict';

var path = require('path');
var fs = require('fs');
var vm = require('vm');

var ROOT = path.resolve(__dirname, '..');
function loadScript(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

var passed = 0, failed = 0;
function ok(cond, label) {
    if (cond) passed++;
    else { failed++; console.log('[FAIL] ' + label); }
}

// ============ 世界桩（v20.86 同式） ============
var W = {
    console: { log: function () {}, warn: function () {}, error: function () {} },
    setTimeout: function (fn) { try { fn(); } catch (e) {} return 0; },
    localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
    document: {
        createElement: function () { return { style: {}, classList: { add: function () {}, remove: function () {}, contains: function () { return false; } }, dataset: {}, innerHTML: '' }; },
        getElementById: function () { return null; },
        querySelector: function () { return null; },
        addEventListener: function () {},
        body: { appendChild: function () {} }
    },
    alert: function () {}
};
W.window = W;

var state = { msgs: [], logs: [], minutes: 0 };
W.timeSystem = {
    gameTime: { totalMinutes: 8 * 60, currentDay: 7 },
    advanceTime: function (m) { state.minutes += m; this.gameTime.totalMinutes += m; }
};
W.advanceTime = function (m) { state.minutes += m; };
W.gameLog = { add: function (t) { state.logs.push(String(t)); } };
W.showMessage = function (t) { state.msgs.push(String(t)); };
W.getRealmTier = function () { return 3; };
W.addReputation = function () {};
W.getCurrentCityName = function () { return '帝都·长安'; };

var cd = {
    name: '测试伶人', realm: '筑基', layer: 3, location: '帝都·长安',
    health: 100, maxHealth: 100, qi: 100, maxQi: 200, energy: 100, maxEnergy: 100,
    tempering: 0, karma: 0, notoriety: 0, fame: 0,
    combatSkills: { '内功': 10, '奇门': 10 },
    lifeSkills: { '音律': 0, '口才': 20 }
};
W.currentCharData = cd;
W.inventory = { currency: { spiritStones: 100, copper: 500 }, slots: [] };
W.currentEquipment = {};
W.itemById = {};
W.EventBus = { emit: function () {}, on: function () {} };
W.StateRegistry = { register: function () {} };
W.updateCurrencyUI = function () {};
W.updateCharacterStatus = function () {};
// 生活技能读取桩（与 global-utils.getLifeSkill 同语义）
W.getLifeSkill = function (name) { return (cd.lifeSkills || {})[name] || 0; };
// 装备读取桩（与 equipment.getEquippedItem 同语义）
W.getEquippedItem = function (slot) { return W.currentEquipment[slot] || null; };

vm.createContext(W);
function load(rel, wrap) {
    var src = loadScript(rel);
    if (wrap) src = '(function(){\n' + src + '\n})();';
    vm.runInContext(src, W, { filename: rel });
}

load('js/items-extended/02-weapons.js');
// 兵器谱灌进物品库（浏览器里由 items-extended.js 合并，这里同式手工灌）
(W.extendedWeapons || []).forEach(function (it) { W.itemById[it.id] = it; });
load('js/economy/economy-transaction.js');
load('js/core/reward-service.js');
load('js/core/scenario-engine.js');
load('js/qin-arts.js');
load('js/city-facilities/facility-qin-venue.js');

var SE = W.scenarioEngine;
var QA = W.QinArts;

// ==================== Q1 琴入兵器谱 ====================
console.log('\n[Q1] 琴入兵器谱');
(function () {
    var qins = (W.extendedWeapons || []).filter(function (i) { return i.subtype === 'qin'; });
    ok(qins.length >= 6, 'Q1 琴类至少六具（实得 ' + qins.length + '）');
    ok(qins.every(function (q) { return q.slot === 'mainHand' && q.damageType === 'blunt' && q.type === 'equipment'; }),
        'Q1 琴皆主手钝击（琴砸是钝击，伤在音里）');
    ok(qins.some(function (q) { return q.level >= 35; }), 'Q1 35 级断层该有琴顶上（天蚕丝琴）');
    var quals = qins.map(function (q) { return q.quality; });
    ok(quals.indexOf('PIN9') >= 0 && quals.indexOf('PIN3') >= 0 && quals.indexOf('PIN5') >= 0,
        'Q1 琴的品质该从九品铺到三品');
    ok(qins.every(function (q) { return W.itemById[q.id] === q; }), 'Q1 每具琴都在物品库可查');
    // 兵器池白名单放行琴（否则坊市兵器铺根本进不了货）
    var ixSrc = loadScript('js/items-extended.js');
    ok(/'claw','qin'/.test(ixSrc), 'Q1 扩展武器合并白名单该收 qin');
    // battle.js 接线：奇门归类 + 钝击解析 + subtype 兜底（扩展武器全用 subtype 记器型）
    var bSrc = loadScript('js/battle.js');
    ok(/'qin': '奇门'/.test(bSrc), 'Q1 琴该归奇门武艺');
    ok(/qin: 'blunt'/.test(bSrc), 'Q1 琴的伤害类型解析该落 blunt');
    ok(/template\.weaponType \|\| template\.subtype/.test(bSrc), 'Q1 兵器武艺该认扩展库的 subtype 器型');
})();

// ==================== Q2 音律入册 + 长进通道 ====================
console.log('\n[Q2] 音律入生活技能册');
(function () {
    ok(/life: \[[^\]]*'音律'/.test(loadScript('js/data.js')), 'Q2 创角名册（data.js）该收音律');
    ok(/LIFE_SKILLS = \[[^\]]*'音律'/.test(loadScript('js/debug-panel.js')), 'Q2 调试面板名册该收音律');
    ok(/'音律': '/.test(loadScript('js/app.js')), 'Q2 角色面板该有音律说明');
    // 统一长进通道：RewardService.lifeSkill
    var r1 = W.RewardService.apply({ lifeSkill: { name: '音律', exp: 5 } });
    ok(r1.success === true && cd.lifeSkills['音律'] === 5, 'Q2 lifeSkill 结算该长音律（实得 ' + cd.lifeSkills['音律'] + '）');
    ok(r1.messages.join('').indexOf('音律+5') >= 0, 'Q2 长进该有回执文案');
    cd.lifeSkills['音律'] = 99;
    W.RewardService.apply({ lifeSkill: { name: '音律', exp: 5 } });
    ok(cd.lifeSkills['音律'] === 100, 'Q2 音律封顶 100（实得 ' + cd.lifeSkills['音律'] + '）');
    W.RewardService.apply({ lifeSkill: { name: '音律', exp: -200 } });
    ok(cd.lifeSkills['音律'] === 0, 'Q2 音律封底 0');
    ok(W.RewardService.normalize({}).lifeSkill === null, 'Q2 无 lifeSkill 的效果表不受扰');
})();

// ==================== Q3 琴心映剑 ====================
console.log('\n[Q3] 琴心映剑：音律 × 琴 → 战斗加成');
(function () {
    cd.lifeSkills['音律'] = 50;
    W.currentEquipment = {};
    var b0 = QA.combatBonus();
    ok(Object.keys(b0).length === 0, 'Q3 空手不给加成');
    W.currentEquipment = { mainHand: { templateId: 'wpn_iron_sword' } };
    ok(Object.keys(QA.combatBonus()).length === 0, 'Q3 持剑不给琴的加成（剑有剑的路）');
    W.currentEquipment = { mainHand: { templateId: 'wpn_lvqi' } };   // 绿绮琴 RARE tier3
    var b1 = QA.combatBonus();
    ok(b1.attack === Math.round(50 * 0.6) + 3, 'Q3 绿绮+音律50 攻击加成 ' + b1.attack + '（该 33）');
    ok(b1.hit === Math.round(50 * 0.2), 'Q3 命中加成随音律');
    cd.lifeSkills['音律'] = 0;
    var b2 = QA.combatBonus();
    ok(b2.attack === 3 && b2.hit === 0, 'Q3 音律归零只剩琴的底子');
    // 艺册：带琴底分远高于清唱
    cd.lifeSkills['音律'] = 50;
    var withQin = QA.performanceScore();
    W.currentEquipment = {};
    var bare = QA.performanceScore();
    ok(withQin > bare * 2, 'Q3 艺册底分带琴该远肥于清唱（' + withQin + ' vs ' + bare + '）');
    // 战斗面板接线
    ok(/QinArts\.combatBonus/.test(loadScript('js/inventory.js')), 'Q3 getCombatBonuses 该接琴心加值');
})();

// ==================== Q4 勾栏瓦舍开台 ====================
console.log('\n[Q4] 勾栏瓦舍：登台、听曲、练琴、传艺');
(function () {
    var fac = SE.facilities['goulan_washe'];
    ok(!!fac && fac.name === '勾栏瓦舍', 'Q4 勾栏瓦舍该注册进情境引擎');
    ok(!!fac && (fac.scenarios || []).length >= 1 && fac.scenarios[0].id === 'stage', 'Q4 主剧本「瓦舍登台」在册');

    // 赢路：音律 50 + 绿绮琴，抚琴一曲满堂彩
    cd.lifeSkills['音律'] = 50;
    cd.energy = 100;
    W.currentEquipment = { mainHand: { templateId: 'wpn_lvqi' } };
    W.inventory.currency = { spiritStones: 100, copper: 500 };
    state.minutes = 0;
    W.__scenarioRng = function () { return 0.01; };
    var st = SE.start('goulan_washe', 'stage');
    ok(st && !st.done && /音律：50/.test(st.desc) && /绿绮琴/.test(st.desc), 'Q4 开场白该报音律与手中琴');
    var copperBefore = W.inventory.currency.copper;
    var res = SE.choose(0);
    ok(res && !res.error, 'Q4 抚琴一曲该能出手' + (res && res.error ? '：' + res.error : ''));
    ok(W.inventory.currency.copper > copperBefore + 100, 'Q4 满堂彩该有像样打赏（铜钱 ' + copperBefore + '→' + W.inventory.currency.copper + '）');
    ok(cd.lifeSkills['音律'] === 53, 'Q4 带琴登台长进 +3（实得 ' + cd.lifeSkills['音律'] + '）');
    ok(cd.energy === 80, 'Q4 登台该耗精力 20（实得 ' + cd.energy + '）');
    ok(state.minutes === 90, 'Q4 一场该结 90 分钟（实得 ' + state.minutes + '）');

    // 输路：生手清唱，只有零星赏钱——但摔打也是长进
    SE.cancel();
    cd.lifeSkills['音律'] = 0; cd.energy = 100;
    W.currentEquipment = {};
    W.inventory.currency = { spiritStones: 100, copper: 500 };
    state.minutes = 0;
    W.__scenarioRng = function () { return 0.99; };
    SE.start('goulan_washe', 'stage');
    res = SE.choose(0);
    ok(res && !res.error, 'Q4 清唱也该能登台');
    ok(W.inventory.currency.copper > 500 && W.inventory.currency.copper < 560, 'Q4 砸场只有零星赏钱（实得 +' + (W.inventory.currency.copper - 500) + '）');
    ok(cd.lifeSkills['音律'] === 1, 'Q4 砸场也长一点记性（音律 ' + cd.lifeSkills['音律'] + '）');
    ok(state.minutes === 90 && cd.energy === 80, 'Q4 砸场一样结时间耗精力');

    // 台下听曲：花 10 文偷师 1 点
    SE.cancel();
    W.inventory.currency = { spiritStones: 100, copper: 500 };
    cd.lifeSkills['音律'] = 0;
    SE.start('goulan_washe', 'stage');
    res = SE.choose(3);
    ok(res && !res.error && W.inventory.currency.copper === 490 && cd.lifeSkills['音律'] === 1,
        'Q4 听曲花 10 文长 1 点（铜钱 ' + W.inventory.currency.copper + '，音律 ' + cd.lifeSkills['音律'] + '）');

    // 幕后：练琴赢路 +4，传艺有束脩
    SE.cancel();
    cd.energy = 100; cd.lifeSkills['音律'] = 60;
    W.currentEquipment = { mainHand: { templateId: 'wpn_jiuxiao' } };   // 九霄环佩 LEGENDARY
    W.__scenarioRng = function () { return 0.01; };
    SE.start('goulan_washe', 'stage');
    res = SE.choose(4);   // 转入幕后
    ok(res && !res.done && /幕后/.test(res.desc || ''), 'Q4 该走进幕后小院');
    res = SE.choose(0);   // 闭门练琴
    ok(res && !res.error && cd.lifeSkills['音律'] === 64 && cd.energy === 75,
        'Q4 带琴苦练长进 +4 耗精力 25（音律 ' + cd.lifeSkills['音律'] + '，精力 ' + cd.energy + '）');

    SE.cancel();
    var stonesBefore = W.inventory.currency.spiritStones;
    cd.energy = 100;
    SE.start('goulan_washe', 'stage');
    SE.choose(4);
    res = SE.choose(1);   // 教琴师
    ok(res && !res.error && W.inventory.currency.spiritStones > stonesBefore,
        'Q4 传艺该有束脩（灵石 ' + stonesBefore + '→' + W.inventory.currency.spiritStones + '）');

    // 压轴摄魂音： Legendary 琴 + 音律 60 该有把握；赢路赏钱翻倍级
    SE.cancel();
    cd.energy = 100;
    W.inventory.currency = { spiritStones: 100, copper: 0 };
    state.logs.length = 0;
    SE.start('goulan_washe', 'stage');
    res = SE.choose(2);
    ok(res && !res.error && W.inventory.currency.copper > 1000,
        'Q4 压轴摄魂音满堂彩该是重赏（铜钱 +' + W.inventory.currency.copper + '）');
    ok(state.logs.join('').indexOf('音修') >= 0 || W.inventory.currency.spiritStones > 100,
        'Q4 压轴赢路该惊动雅座音修/落灵石赏');

    // 纪律：所有 roll 都有输赢两分支，输路不许空手白挨
    var badRoll = [];
    (SE.facilities['goulan_washe'].scenarios || []).forEach(function (sc) {
        Object.keys(sc.nodes).forEach(function (nk) {
            (sc.nodes[nk].choices || []).forEach(function (c) {
                var eff = c.effects || {};
                if (eff.roll && (!eff.roll.win || !eff.roll.lose || !Object.keys(eff.roll.lose).length)) badRoll.push(nk);
            });
        });
    });
    ok(badRoll.length === 0, 'Q4 每个成败签都该有输赢两分支（无必胜印钞机）');
    delete W.__scenarioRng;
    SE.cancel();
})();

// ==================== Q5 接线 ====================
console.log('\n[Q5] 接线：城、卡面、入口、加载序');
(function () {
    var appSrc = loadScript('js/app.js');
    ok(/'goulan_washe': \{ name: '勾栏瓦舍'/.test(appSrc), 'Q5 城市设施卡面该挂勾栏瓦舍');
    ok(/function openGoulanWashe\(\)/.test(appSrc) && /window\.openGoulanWashe = openGoulanWashe/.test(appSrc), 'Q5 入口函数该写好并导出');
    var locSrc = loadScript('js/location-system.js');
    ok(/GOU_LAN: \{ id: 'goulan_washe'/.test(locSrc), 'Q5 建筑图鉴该有勾栏瓦舍卡面');
    var cityCount = (locSrc.match(/'goulan_washe'/g) || []).length;
    // v21.4 千城千面：勾栏瓦舍是红尘营生，只在有市井人烟的城挂牌（帝都等 8 城），仙山佛窟不开
    ok(cityCount >= 9, 'Q5 市井城照挂勾栏瓦舍（goulan_washe 出现 ' + cityCount + ' 次，含图鉴/简介 2 次）');
    var cdImperial = locSrc.match(/'帝都·长安': \{[\s\S]*?buildings: \[([^\]]*)\]/);
    ok(!!cdImperial && cdImperial[1].indexOf("'goulan_washe'") >= 0, 'Q5 帝都勾栏瓦舍仍在（裁剪不误伤）');
    var htmlSrc = loadScript('仙侠.html');
    ok(htmlSrc.indexOf('js/qin-arts.js') > 0, 'Q5 页面该加载音律琴心');
    ok(htmlSrc.indexOf('js/city-facilities/facility-qin-venue.js') > 0, 'Q5 页面该加载勾栏瓦舍剧本');
    ok(htmlSrc.indexOf('js/qin-arts.js') < htmlSrc.indexOf('js/city-facilities/facility-qin-venue.js'), 'Q5 琴心该在瓦舍剧本之前加载');
    ok(/k === 'lifeSkill'/.test(loadScript('js/core/scenario-engine.js')), 'Q5 引擎效果表该支持 lifeSkill 现算');
    // 文案纪律：玩家可见字符串不许漏英文（中文串里不得混 3 连字母）
    var venueSrc = loadScript('js/city-facilities/facility-qin-venue.js');
    var strings = venueSrc.match(/'[^'\n]*'/g) || [];
    var leaky = strings.filter(function (s) { return /[一-鿿]/.test(s) && /[A-Za-z]{3}/.test(s); });
    ok(leaky.length === 0, 'Q5 玩家可见文案无漏翻' + (leaky.length ? '：' + leaky[0] : ''));
    ok(!!QA && typeof QA.performanceScore === 'function', 'Q5 QinArts 门面完整');
})();

// ==================== 结果 ====================
console.log('\n========== v20.90 琴韵流芳 ==========');
console.log('通过 ' + passed + ' / 失败 ' + failed);
process.exit(failed ? 1 : 0);
