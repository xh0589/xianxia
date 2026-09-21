/**
 * v20.94-batch-node.js — 六件事验收：
 *   Q1 熟能生巧：技能影响结果的动作全部反哺技能（统一写点 growLifeSkill + 15 处动作接线 + 长进通道收数组）
 *   Q2 奇遇：十段独一份机缘 + 十件奇物（qiyuOnly 不上货架不进拍卖），触发/冷却/一生一次/两难结算全通
 *   Q3 幽灵城开门：凤凰巢/佛国遗址/万剑宗入 cityData 户口，灵气/氛围/入城描写四本账齐
 *   Q4 信物余韵：戴自家道侣信物有暖、戴别人的有冷、独身有缘；信物架可开陈列
 *   Q5 战斗日志封顶：只留最近 200 条，渲染只画尾部
 *   Q6 门派落户：SECT_DEEP_DATA 36 派全数（17 派新入），天山/天书 ID 撞车已拆
 *
 * 运行：node tests/v20.94-batch-node.js
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

// ============ 世界桩 ============
var W = {
    console: { log: function () {}, warn: function () {}, error: function () {} },
    setTimeout: function (fn) { try { fn(); } catch (e) {} return 0; },
    localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
    document: {
        createElement: function () { return { style: {}, classList: { add: function () {}, remove: function () {}, contains: function () { return false; } }, dataset: {}, innerHTML: '', remove: function () {} }; },
        getElementById: function () { return null; },
        querySelector: function () { return null; },
        querySelectorAll: function () { return []; },
        addEventListener: function () {},
        body: { appendChild: function () {} }
    },
    alert: function () {}
};
W.window = W;
var state = { msgs: [], logs: [], minutes: 0, modals: [], added: [] };
W.timeSystem = {
    gameTime: { totalMinutes: 8 * 60, currentDay: 5 },
    advanceTime: function (m) { state.minutes += m; this.gameTime.totalMinutes += m; },
    onNewDaySubscribe: function (fn) { W.__newDayHook = fn; }
};
W.gameLog = { add: function (t, ty) { state.logs.push(String(t) + '|' + (ty || '')); } };
W.showMessage = function (t, ty) { state.msgs.push(String(t) + '|' + (ty || '')); };
W.showModal = function (title, body) { state.modals.push({ title: String(title), body: String(body) }); };
W.getRealmTier = function () { return 3; };
W.getCurrentCityName = function () { return (W.currentCharData && W.currentCharData.location) || '帝都·长安'; };
W.EventBus = {
    _h: {},
    on: function (k, fn) { (W.EventBus._h[k] = W.EventBus._h[k] || []).push(fn); },
    emit: function (k, d) { (W.EventBus._h[k] || []).forEach(function (f) { try { f(d); } catch (e) {} }); }
};
W.StateRegistry = { register: function () {} };
W.updateCurrencyUI = function () {};
W.updateCharacterStatus = function () {};
W.updateEquippedStats = function () {};

var cd = {
    name: '测试客', realm: '筑基', layer: 5, location: '冰原城',
    health: 100, maxHealth: 100, qi: 100, maxQi: 200, energy: 100, maxEnergy: 100,
    tempering: 0, karma: 0, notoriety: 0, fame: 0, luck: 50,
    combatSkills: {}, lifeSkills: { '音律': 25, '口才': 50, '锻造': 0, '医术': 0, '毒术': 0, '学识': 0 },
    bonds: {}
};
W.currentCharData = cd;
W.inventory = { currency: { spiritStones: 500, copper: 500 }, slots: [] };
W.currentEquipment = {};
W.itemById = {};
W.allItems = [];
W.addItem = function (id, n) { state.added.push(id); W.inventory.slots.push({ templateId: id, count: n || 1 }); return true; };
W.getLifeSkill = function (name) { return (cd.lifeSkills || {})[name] || 0; };
W.getEquippedItem = function (slot) { return W.currentEquipment[slot] || null; };
// 城市/区域桩：三座新城 + 北冥
var CITYDB = {
    '冰原城': { region: '北冥' }, '极寒之地': { region: '北冥' }, '万剑宗': { region: '北冥' },
    '凤凰巢': { region: '南疆' }, '佛国遗址': { region: '西漠' }, '帝都·长安': { region: '中州' }
};
W.locationSystem = {
    getCurrentLocation: function () { return cd.location; },
    getCityData: function (c) { return CITYDB[c.replace(/\s+/g, '')] || null; }
};
var NPCDB = {};
W.npcManager = {
    getNPC: function (id) { return NPCDB[id] || null; },
    getAllNPCs: function () { return Object.keys(NPCDB).map(function (k) { return NPCDB[k]; }); }
};

vm.createContext(W);
function load(rel) { vm.runInContext(loadScript(rel), W, { filename: rel }); }

load('js/items.js');
load('js/global-utils.js');
// global-utils 会把 showModal 换成真 DOM 版——测试桩重新盖回来（只验奇遇逻辑，不验弹窗渲染）
W.showModal = function (title, body) { state.modals.push({ title: String(title), body: String(body) }); };
W.showMessage = function (t, ty) { state.msgs.push(String(t) + '|' + (ty || '')); };
load('js/economy/economy-transaction.js');
load('js/core/reward-service.js');
load('js/items-extended/17-lead-tokens.js');
load('js/extensions/qiyu-encounters.js');
load('js/sects/sects-deep-data.js');

// ==================== Q1 熟能生巧 ====================
console.log('\n[Q1] 熟能生巧：练了就会长');
(function () {
    ok(typeof W.growLifeSkill === 'function', 'Q1 统一长进写点该导出');
    cd.lifeSkills['锻造'] = 0;
    ok(W.growLifeSkill('锻造', 2, { reason: '打铁' }) === 2 && cd.lifeSkills['锻造'] === 2, 'Q1 生手打铁长满份');
    cd.lifeSkills['锻造'] = 50;
    ok(W.growLifeSkill('锻造', 2) === 1 && cd.lifeSkills['锻造'] === 51, 'Q1 半数火候长进减半');
    cd.lifeSkills['锻造'] = 99;
    ok(W.growLifeSkill('锻造', 5) === 1 && cd.lifeSkills['锻造'] === 100, 'Q1 封顶前最后一点也给你');
    ok(W.growLifeSkill('锻造', 5) === 0 && cd.lifeSkills['锻造'] === 100, 'Q1 100 封顶不再长');
    state.logs.length = 0;
    cd.lifeSkills['医术'] = 10;
    W.growLifeSkill('医术', 2, { reason: '包扎' });
    ok(state.logs.join('').indexOf('包扎') >= 0, 'Q1 长进该有日志回执（带缘由）');
    // 长进通道收数组（一个动作长多门）
    cd.lifeSkills['音律'] = 0; cd.lifeSkills['口才'] = 0;
    var r = W.RewardService.apply({ lifeSkill: [{ name: '口才', exp: 2 }, { name: '音律', exp: 1 }] });
    ok(cd.lifeSkills['口才'] === 2 && cd.lifeSkills['音律'] === 1, 'Q1 一次动作该能长两门');
    ok(r.messages.join('').indexOf('口才+2') >= 0, 'Q1 双长进回执该都在');
    ok(W.RewardService.apply({ lifeSkill: { name: '音律', exp: 1 } }) && cd.lifeSkills['音律'] === 2, 'Q1 单门旧写法照旧兼容');
    ok(W.RewardService.normalize({}).lifeSkill === null, 'Q1 无长进的效果表不受扰');
    // 动作接线盘点：技能影响结果的地方，动作落地就该反哺
    var hooks = [
        ['js/crafting.js', /growRecipeSkills\(recipe, 1\)/, /growRecipeSkills\(recipe, 2\)/, '合成成败都长配方技能'],
        ['js/enhancement.js', /growLifeSkill\('锻造', 2/, /growLifeSkill\('锻造', 1/, '强化成败都长锻造'],
        ['js/crafting/forging-compound.js', /growLifeSkill\('锻造'/, null, '锻兵长锻造'],
        ['js/crafting/alchemy-compound.js', /growLifeSkill\('炼制'/, null, '炼丹长炼制'],
        ['js/battle.js', /growLifeSkill\('医术', 2/, null, '包扎长医术'],
        ['js/poison-system.js', /growLifeSkill\('毒术', 2/, /growLifeSkill\('毒术', 1/, '制毒拔毒都长毒术'],
        ['js/beast-taming.js', /growLifeSkill\('驭兽', 2/, /growLifeSkill\('驭兽', 1/, '驯服收服成败都长驭兽'],
        ['js/npcs/social-intervene.js', /growLifeSkill\('口才', 2/, /growLifeSkill\('口才', 1/, '调停递话成败都长口才'],
        ['js/enhanced-shop.js', /growLifeSkill\('口才', 1/, null, '买卖讲价偶尔长口才'],
        ['js/house-system.js', /growLifeSkill\('种植', 1/, /growLifeSkill\('种植', withered/, '下种收获都长种植'],
        ['js/app.js', /growLifeSkill\('采伐'/, null, '采矿采药长采伐'],
        ['js/sects/sect-facilities.js', /growLifeSkill\('学识', 1/, null, '阁中翻读长学识'],
        ['js/city-facilities/facility-qin-venue.js', /name: '口才', exp: 2/, null, '说书长口才']
    ];
    hooks.forEach(function (h) {
        var src = loadScript(h[0]);
        ok(h[1].test(src), 'Q1 ' + h[3] + '（成功路）');
        if (h[2]) ok(h[2].test(src), 'Q1 ' + h[3] + '（失手路）');
    });
    cd.lifeSkills['锻造'] = 0; cd.lifeSkills['医术'] = 0;
})();

// ==================== Q2 奇遇 ====================
console.log('\n[Q2] 奇遇：独一份的机缘');
(function () {
    var QE = W.QiyuEncounters;
    ok(!!QE && QE.list.length === 13, 'Q2 奇遇该有十三段（v21.9 加高境界三段）（实得 ' + (QE && QE.list.length) + '）');
    // v21.9 高境界奇遇：化神(5)/炼虚(6)/大乘(8) 门槛各一段，此前最高门槛只到筑基(2)
    ok(!!QE && ['qy_xinghai_guzhou', 'qy_gushen_zhican', 'qy_tianhe_daoguan'].every(function (id) {
        return QE.list.some(function (q) { return q.id === id; });
    }), 'Q2 星槎孤舟/古神残响/天河道痕三段在案');
    ok(QE.items.length === 10 && QE.items.every(function (it) { return it.qiyuOnly === true && W.itemById[it.id] === it; }), 'Q2 十件奇物自注册且全打 qiyuOnly');
    // qiyuOnly 双闸：商铺不上架、拍卖不入池
    ok(/if \(it\.qiyuOnly\) return;/.test(loadScript('js/enhanced-shop.js')), 'Q2 商铺货架该挡 qiyuOnly');
    ok(/if \(t\.qiyuOnly\) return false;/.test(loadScript('js/economy/auction-service.js')), 'Q2 拍卖池该挡 qiyuOnly');
    // 每段奇遇都有两难（至少两个选择），且至少一半带成败分支
    ok(QE.list.every(function (q) { return q.choices.length >= 2; }), 'Q2 每段奇遇都该有取舍');
    ok(QE.list.filter(function (q) { return q.choices.some(function (c) { return typeof c.ok === 'function'; }); }).length >= 6, 'Q2 过半奇遇该吃技能/状态门槛（练了才有好结果）');
    // 门槛：北冥遗音只认北冥 + 音律
    cd.location = '帝都·长安'; cd.lifeSkills['音律'] = 25;
    ok(QE.candidates('city').every(function (q) { return q.id !== 'qy_beiming_yiyin'; }), 'Q2 人在中州撞不上北冥遗音');
    cd.location = '冰原城';
    var cands = QE.candidates('city').map(function (q) { return q.id; });
    ok(cands.indexOf('qy_beiming_yiyin') >= 0, 'Q2 人在北冥且音律够格该撞得上');
    cd.lifeSkills['音律'] = 5;
    ok(QE.candidates('city').every(function (q) { return q.id !== 'qy_beiming_yiyin'; }), 'Q2 音律不够格也撞不上');
    cd.lifeSkills['音律'] = 25;
    // 触发：rng 注入——高 roll 不触发，低 roll 触发
    QE.state().done = {}; QE.state().lastDay = -99;
    W.__qiyuRng = function () { return 0.99; };
    ok(QE.maybeTrigger('city') === null && !QE.pending(), 'Q2 缘分不到（高 roll）不该触发');
    W.__qiyuRng = function () { return 0.001; };
    var q = QE.maybeTrigger('city');
    ok(!!q && QE.pending() === q && state.modals.length >= 1, 'Q2 缘分到了该弹窗开场');
    ok(state.modals[state.modals.length - 1].title.indexOf('奇遇') >= 0, 'Q2 弹窗该挂奇遇名号');
    // 冷却：同日再撞不上
    var before = QE.state().lastDay;
    ok(QE.maybeTrigger('city') === null || QE.state().done[q.id], 'Q2 撞过一段后冷却期不该连撞');
    ok(QE.state().lastDay >= before, 'Q2 触发日子该入账');
    // 结算：走开也记一段（一生一次）
    QE.state().done = {}; QE.state().lastDay = -99;
    QE.forceTrigger('qy_jiuxian_yuzhuo');
    state.added.length = 0; state.minutes = 0;
    cd.lifeSkills['口才'] = 50;
    ok(QE.choose(0) === true, 'Q2 该能选第一条路');
    ok(state.added.indexOf('qiyu_jiuxian_jiu') >= 0, 'Q2 口才过关该得仙家残酒');
    ok(cd.lifeSkills['口才'] === 53, 'Q2 该长口才 +3（实得 ' + cd.lifeSkills['口才'] + '）');
    ok(state.minutes === 60, 'Q2 奇遇该结一个时辰');
    ok(!QE.pending(), 'Q2 结算后该收场');
    ok(QE.forceTrigger('qy_jiuxian_yuzhuo') === false, 'Q2 一生一次的奇遇不该重来');
    // 失手路：口才不够，葫芦照样到手但没有长进
    QE.state().done = {}; QE.state().lastDay = -99;
    cd.lifeSkills['口才'] = 10;
    QE.forceTrigger('qy_jiuxian_yuzhuo');
    state.added.length = 0;
    QE.choose(0);
    ok(state.added.indexOf('qiyu_jiuxian_jiu') >= 0 && cd.lifeSkills['口才'] === 10, 'Q2 失手路该有保底物品、无长进');
    // 因果路：悄悄收葫芦要背因果
    QE.state().done = {}; QE.state().lastDay = -99;
    var karmaBefore = cd.karma;
    QE.forceTrigger('qy_jiuxian_yuzhuo');
    QE.choose(1);
    ok(cd.karma === karmaBefore - 3, 'Q2 昧心收葫芦该背因果 -3');
    // 走开：无赏无罚但记一段
    QE.state().done = {}; QE.state().lastDay = -99;
    QE.forceTrigger('qy_lanke_qiju');
    QE.choose(-1);
    ok(!!QE.state().done['qy_lanke_qiju'], 'Q2 转身走开也算见过（一生一次）');
    // 接线：进城事件、采集、打坐
    var appSrc = loadScript('js/app.js');
    ok(/QiyuEncounters\.maybeTrigger\('wild'\)/.test(appSrc) && /maybeTrigger\('cultivate'\)/.test(appSrc), 'Q2 采集与打坐该接奇遇钩子');
    ok(!!W.EventBus._h['location:visited'], 'Q2 进城事件该接奇遇钩子');
    ok(loadScript('仙侠.html').indexOf('js/extensions/qiyu-encounters.js') > 0, 'Q2 页面该加载奇遇');
    delete W.__qiyuRng;
    cd.karma = 0;
})();

// ==================== Q3 幽灵城开门 ====================
console.log('\n[Q3] 幽灵城开门');
(function () {
    var src = loadScript('js/location-system.js');
    // cityData 户口：23 城，三座新城各就各位
    var i = src.indexOf('const cityData = {');
    var depth = 0, j = src.indexOf('{', i), body = '';
    for (var k = j; k < src.length; k++) {
        if (src[k] === '{') depth++;
        else if (src[k] === '}') { depth--; if (depth === 0) { body = src.slice(j, k + 1); break; } }
    }
    var keys = (body.match(/^\s{4}'[^']+':/gm) || []).map(function (x) { return x.trim().replace(/[:']+/g, ''); });
    ok(keys.length === 23, 'Q3 cityData 该有 23 座城（实得 ' + keys.length + '）');
    ['凤凰巢', '佛国遗址', '万剑宗'].forEach(function (c) { ok(keys.indexOf(c) >= 0, 'Q3 ' + c + ' 该有户口'); });
    var fc = body.match(/'凤凰巢': \{[\s\S]*?accessLevel: '([^']+)'/);
    ok(!!fc && fc[1] === '筑基以上', 'Q3 凤凰巢该有境界门槛（凤栖之地非凡俗可入）');
    var ws = body.match(/'万剑宗': \{[\s\S]*?buildings: \[([^\]]*)\]/);
    ok(!!ws && ws[1].indexOf("'weapon_shop'") >= 0 && ws[1].indexOf("'forging'") >= 0, 'Q3 万剑宗该有兵器铺与炼器房');
    var fr = body.match(/'佛国遗址': \{[\s\S]*?buildings: \[([^\]]*)\]/);
    ok(!!fr && fr[1].indexOf("'temple'") >= 0 && fr[1].indexOf("'library'") >= 0, 'Q3 佛国遗址该有寺庙与书阁');
    // v21.4 千城千面：勾栏瓦舍是红尘买卖——帝都照挂，佛国遗址不开（按城性格裁剪）
    var gd = body.match(/'帝都·长安': \{[\s\S]*?buildings: \[([^\]]*)\]/);
    var fg = body.match(/'佛国遗址': \{[\s\S]*?buildings: \[([^\]]*)\]/);
    ok(!!gd && gd[1].indexOf("'goulan_washe'") >= 0 && !!fg && fg[1].indexOf("'goulan_washe'") < 0,
        'Q3 勾栏瓦舍按城性格挂牌（帝都留、佛国不开）');
    // 四本配套账：氛围/灵气/入城描写
    ok(/'凤凰巢': \{\s*\n\s*default:/.test(src) && /'佛国遗址': \{\s*\n\s*default:/.test(src) && /'万剑宗': \{\s*\n\s*default:/.test(src), 'Q3 三城该有氛围账');
    ok(/'凤凰巢': \{ base: 1\.6/.test(loadScript('js/qi-environment.js')), 'Q3 凤凰巢该有灵气账（火山火精 1.6）');
    ok(/'万剑宗': \{ base: 1\.5/.test(loadScript('js/qi-environment.js')), 'Q3 万剑宗该有灵气账（剑气化灵 1.5）');
    ok(/'佛国遗址': \{ base: 1\.1/.test(loadScript('js/qi-environment.js')), 'Q3 佛国遗址该有灵气账');
    var uiSrc = loadScript('js/ui-immersive.js');
    ['凤凰巢', '佛国遗址', '万剑宗'].forEach(function (c) { ok(uiSrc.indexOf("'" + c + "': { enter:") >= 0, 'Q3 ' + c + ' 该有入城描写'); });
    // 路线表早就有这三城（regions.js），户口补上即全通
    var regSrc = loadScript('js/regions.js');
    ok(/'凤凰巢': \{ '炎城': 120/.test(regSrc) && /'万剑宗': \{ '冰原城': 120/.test(regSrc), 'Q3 路线表该通三城');
})();

// ==================== Q4 信物余韵 ====================
console.log('\n[Q4] 信物余韵');
(function () {
    NPCDB['sect_leader_百花谷'] = { id: 'sect_leader_百花谷', name: '温蘅', gender: 'female', relationship: { affection: 80 }, changeAffection: function (n) { this.relationship.affection += n; } };
    NPCDB['xy_npc'] = { id: 'xy_npc', name: '闻人酌', gender: 'male', relationship: { affection: 80 }, changeAffection: function (n) { this.relationship.affection += n; } };
    cd.bonds = { 'sect_leader_百花谷': { type: 'dao_companion', name: '温蘅' } };
    W.inventory.slots = [{ templateId: 'token_wen_heng', count: 1 }];
    // 戴自家道侣的信物：暖
    W.currentEquipment = { acc2: { templateId: 'token_wen_heng' } };
    W.timeSystem.gameTime.currentDay = 10;
    state.logs.length = 0;
    ok(W.tokenDailyTick() === true, 'Q4 戴着道侣信物该有回响');
    ok(NPCDB['sect_leader_百花谷'].relationship.affection === 81, 'Q4 温蘅该心里一暖（好感+1）');
    ok(state.logs.join('').indexOf('💞') >= 0, 'Q4 暖该有暖的文案');
    ok(W.tokenDailyTick() === false, 'Q4 一天只暖一次');
    // 戴别人的信物：冷
    W.currentEquipment = { acc2: { templateId: 'token_wen_ren' } };
    W.timeSystem.gameTime.currentDay = 11;
    state.logs.length = 0;
    ok(W.tokenDailyTick() === true, 'Q4 戴着别人的信物也该有回响');
    ok(NPCDB['sect_leader_百花谷'].relationship.affection === 79, 'Q4 温蘅看在眼里（好感-2）');
    ok(state.logs.join('').indexOf('💔') >= 0, 'Q4 冷该有冷的文案');
    // 独身无缘：那个人对你还没那个意思（好感不到 50），不该硬给回响
    cd.bonds = {};
    NPCDB['sect_leader_百花谷'].relationship.affection = 30;
    W.currentEquipment = { acc2: { templateId: 'token_wen_heng' } };
    W.timeSystem.gameTime.currentDay = 12;
    ok(W.tokenDailyTick() === false, 'Q4 独身戴信物、缘分未到不该硬给回响');
    // 缘分到了（好感 50+）：独身也有一缕余韵
    NPCDB['sect_leader_百花谷'].relationship.affection = 60;
    W.timeSystem.gameTime.currentDay = 13;
    state.logs.length = 0;
    ok(W.tokenDailyTick() === true && state.logs.join('').indexOf('🎐') >= 0, 'Q4 独身但那个人心里有你，该有一缕余韵');
    // 信物架
    state.modals.length = 0;
    W.currentEquipment = {};
    W.openTokenShelf();
    var shelf = state.modals[state.modals.length - 1];
    ok(!!shelf && shelf.title.indexOf('信物架') >= 0, 'Q4 信物架该开得出来');
    ok(shelf.body.indexOf('蘅芷香囊') >= 0 && shelf.body.indexOf('温蘅') >= 0, 'Q4 架上该摆已得的信物连人带故事');
    ok(shelf.body.indexOf('虚位以待') >= 0 && shelf.body.indexOf('/ 36') >= 0, 'Q4 空位不题名、只报数');
    // 接线：人脉面板有入口按钮
    var html = loadScript('仙侠.html');
    ok(html.indexOf('openTokenShelf()') >= 0 && html.indexOf('信物架') >= 0, 'Q4 人脉面板该有信物架入口');
    cd.bonds = {};
    NPCDB['sect_leader_百花谷'].relationship.affection = 80;
})();

// ==================== Q5 战斗日志封顶 ====================
console.log('\n[Q5] 战斗日志封顶');
(function () {
    var appSrc = loadScript('js/app.js');
    ok(/BATTLE_LOG_MAX = 200/.test(appSrc), 'Q5 日志上限该立 200 条');
    ok(/state\.log\.splice\(0, state\.log\.length - BATTLE_LOG_MAX\)/.test(appSrc), 'Q5 超限该就地裁头（内存不涨）');
    ok(/slice\(-BATTLE_LOG_MAX\)/.test(appSrc), 'Q5 渲染只画尾部');
    ok(!/logDiv\.innerHTML = state\.log\.map/.test(appSrc), 'Q5 旧的全量重排该已退役');
    var partySrc = loadScript('js/party-system.js');
    ok(/battleLog\.length > 100/.test(partySrc), 'Q5 队伍战报的旧上限照旧在（两本账都封顶）');
})();

// ==================== Q6 门派落户 ====================
console.log('\n[Q6] 门派落户：36 派深度数据全数');
(function () {
    var DEEP = W.SECT_DEEP_DATA;
    ok(!!DEEP && Object.keys(DEEP).length === 36, 'Q6 深度数据该 36 派全数（实得 ' + (DEEP && Object.keys(DEEP).length) + '）');
    var NEW17 = ['武当派', '峨眉派', '华山派', '恒山派', '泰山派', '嵩山派', '青城派', '衡山派', '昆仑派', '霹雳堂', '大旗门', '血手门', '飞蝎坞', '烈日教', '神机门', '侠隐阁', '天涯海阁'];
    NEW17.forEach(function (sect) {
        var d = DEEP[sect];
        ok(!!d && Array.isArray(d.masters) && d.masters.length >= 3, 'Q6 ' + sect + ' 该有师徒名册（≥3 位）');
        ok(!!d && Array.isArray(d.factions) && d.factions.length === 2, 'Q6 ' + sect + ' 该有两条派系');
        ok(!!d && Array.isArray(d.specialResources) && d.specialResources.length >= 1 && d.specialResources[0].output > 0, 'Q6 ' + sect + ' 该有专属资源（宗门经济日结吃这本账）');
        ok(!!d && d.masters.every(function (m) { return m.id && m.name && m.realm && m.skills && m.skills.length; }), 'Q6 ' + sect + ' 名册字段该齐');
    });
    // 掌门可收徒的至少一位、祖师/高人闭门谢客
    var wud = DEEP['武当派'];
    ok(wud.masters[0].acceptStudent === false && wud.masters.some(function (m) { return m.acceptStudent && m.maxStudents >= 2; }), 'Q6 武当该有闭门祖师与可拜长老（其余各派同式）');
    // 天山派/天书阁 ID 撞车已拆
    var src = loadScript('js/sects/sects-deep-data.js');
    ok(/tsg_master_1/.test(src) && (src.match(/id: 'ts_master_1'/g) || []).length === 1, 'Q6 天山/天书 ID 撞车该已拆（tsg_ 另立门户）');
    // 玩家可见文案不漏英文
    var leaky = [];
    NEW17.forEach(function (sect) {
        var d = DEEP[sect];
        d.masters.forEach(function (m) { if (/[A-Za-z]{3}/.test((m.desc || '') + (m.personality || ''))) leaky.push(sect + '/' + m.name); });
    });
    ok(leaky.length === 0, 'Q6 新名册文案无漏翻' + (leaky.length ? '：' + leaky.join(',') : ''));
})();

// ==================== 结果 ====================
console.log('\n========== v20.94 六件事 ==========');
console.log('通过 ' + passed + ' / 失败 ' + failed);
process.exit(failed ? 1 : 0);
