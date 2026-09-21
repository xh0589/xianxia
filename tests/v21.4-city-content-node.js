/**
 * v21.4-city-content-node.js — 城市内容批次门禁
 *
 * 城市审计三连修（玩家批准的"三个一起修"）：
 *   ① 24 处特色景致是"免费白嫖印钞机"（一句话+历练20+声望3，零成本无限连点）
 *      → special-features.js 给每处景致写专属真剧本（场景+选择+成本+成败分支）
 *   ② 税课司/司法堂/户籍司是"一点就完"的空壳 → facility-offices.js 三司公务牌各三块
 *   ③ 千城一面：19 座人间城拖着同一条 23 建筑大尾巴 → cityData 按城市性格重裁
 *
 * 覆盖：
 *   A 景致真剧本：24 处全注册；每个选项必有成本或风险（没有白拿的历练）；引擎真跑；气力不济婉拒
 *   B 兜底探访收口：未知景致真耗精力15、每处每日一次、奖励削薄（历练+5/声望+1）
 *   C 三司接线：剧本注册、app.js 委托、页面加载序
 *   D 千城千面：尾部签名不再千人一面；帝都全留；海底不设消防司；佛国剑冢不开勾栏；每城留 quest
 *
 * 运行：node tests/v21.4-city-content-node.js
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

// ============ 引擎世界（与 v20.18 D 段同款桩） ============
function engWorld(opts) {
    opts = opts || {};
    var logs = [], reps = [];
    var currency = { spiritStones: opts.stones != null ? opts.stones : 500, copper: 0 };
    var w = {
        console: { log: function () {}, warn: function () {}, error: function () {} },
        JSON: JSON, Object: Object, Array: Array, Math: Math, Number: Number,
        isFinite: isFinite, Date: Date, String: String,
        currentCharData: opts.char || { qi: 100, energy: 100, health: 100, tempering: 0, karma: 0, notoriety: 0, location: '帝都·长安' },
        inventory: { currency: currency, slots: [] },
        XianXia: { DataManager: {
            getSpiritStones: function () { return currency.spiritStones; },
            setSpiritStones: function (v) { currency.spiritStones = Math.max(0, v); }
        } },
        getAbsoluteDay: function () { return 100; },
        gameLog: { add: function (m) { logs.push(String(m)); } },
        showMessage: function (m) { logs.push(String(m)); },
        advanceTime: function () {},
        timeSystem: { advanceTime: function () {}, getAbsoluteDay: function () { return 100; }, onNewDaySubscribe: function () {} },
        getCurrentCityName: function () { return w.currentCharData.location; },
        addReputation: function (c, n) { reps.push([c, n]); },
        getLifeSkill: function () { return 0; },
        getRealmTier: function () { return 1; },
        EventBus: { emit: function () {}, on: function () {} },
        StateRegistry: { register: function () {} },
        locationSystem: null,
        document: { readyState: 'complete', addEventListener: function () {}, getElementById: function () { return null; },
            createElement: function () { return { style: {}, classList: { add: function () {}, remove: function () {} }, appendChild: function () {}, innerHTML: '' }; },
            querySelector: function () { return null; }, body: {} }
    };
    w.EconomyTransaction = {
        run: function (fn) { return fn(); },
        credit: function (k, n) { if (currency[k] != null) currency[k] += n; return true; },
        debit: function (k, n) { if (currency[k] != null) { if (currency[k] < n) return false; currency[k] -= n; } return true; },
        addSnapshot: function () { return true; },
        removeByTemplate: function () { return true; }
    };
    w.window = w;
    var ctx = vm.createContext(w);
    function load(rel) { vm.runInContext(loadScript(rel), ctx, { filename: rel }); }
    load('js/core/reward-service.js');
    load('js/core/scenario-engine.js');
    (opts.extra || []).forEach(load);
    w._logs = logs; w._reps = reps; w._currency = currency;
    return w;
}

// ============ A 特色景致真剧本 ============
var W = engWorld({ extra: ['js/city-facilities/special-features.js'] });
var SE = W.scenarioEngine;
var facIds = Object.keys(SE.facilities);
ok(facIds.length === 24, 'A1 24 处特色景致全部注册专属剧本（实得 ' + facIds.length + '）');

// 每个选项必有成本（require+cost）或明确风险（roll 成败分支）——没有白拿的大历练。
// 例外口径：明确标注无耗的小选项（如「见好就收」历练+1、灵泉客礼恢复）必须以时间为价（time>0 且 exp≤2）
var free = [];
facIds.forEach(function (id) {
    var sc = SE.facilities[id].scenarios[0];
    var node = sc.nodes[sc.startNode];
    node.choices.forEach(function (c, i) {
        var e = c.effects || {};
        var paid = !!(e.cost || e.roll);
        var cheapExit = (e.time || 0) > 0 && (e.exp || 0) <= 2;
        if (!paid && !cheapExit) free.push(id + '#' + i);
        // 有 roll 必须有败分支（不许只写赢面）
        if (e.roll && !e.roll.lose) free.push(id + '#' + i + '(无败分支)');
    });
});
ok(free.length === 0, 'A2 每个选项都有成本或成败风险，没有白拿的历练（违例: ' + free.slice(0, 5).join(',') + '）');

// 引擎真跑：木灵塔感应（真气20，roll 必胜注入）
W.__scenarioRng = function () { return 0.01; };
var st = SE.start('木灵塔', 'visit');
ok(!!st && st.done === false && st.desc.indexOf('藤纹') >= 0, 'A3 木灵塔推门入戏：场景文案在案');
SE.choose(0);
ok(W.currentCharData.qi === 80 && W.currentCharData.tempering === 6 && W._logs.join('|').indexOf('木灵认了你这个客') >= 0,
    'A4 登塔感应成真：真气-20、历练+6、赢面文案上屏');

// 气力不济 → 引擎门槛如实婉拒
var W2 = engWorld({ extra: ['js/city-facilities/special-features.js'], char: { qi: 5, energy: 100, health: 100, tempering: 0, karma: 0, notoriety: 0, location: '青木城' } });
W2.scenarioEngine.start('木灵塔', 'visit');
var r2 = W2.scenarioEngine.choose(0);
ok(!!r2 && !!r2.error && W2.currentCharData.tempering === 0, 'A5 真气不济如实婉拒，历练分文不涨');

// ============ B 兜底探访收口（未注册景致不再白给） ============
var lsSrc = loadScript('js/location-system.js');
ok(/genericFeatureVisits\[key\]/.test(lsSrc) && /name \+ '\|' \+ day/.test(lsSrc),
    'B1 兜底探访每处景致每日一次（日历键在案）');
ok(/\(p\.energy \|\| 0\) < 15/.test(lsSrc) && /p\.energy = \(p\.energy \|\| 0\) - 15/.test(lsSrc),
    'B2 兜底探访真耗精力 15（门槛与扣减成对）');
ok(/p\.tempering = \(p\.tempering \|\| 0\) \+ 5/.test(lsSrc) && /addReputation\(city, 1\)/.test(lsSrc),
    'B3 兜底奖励削薄：历练+5、声望+1（旧版白给 20/3 已拆）');
var gfvBody = lsSrc.slice(lsSrc.indexOf('function genericFeatureVisit'), lsSrc.indexOf('// ============ 关闭城市面板'));
ok(gfvBody.indexOf('+ 20') < 0 && gfvBody.indexOf('tempering = (p.tempering || 0) + 5') >= 0,
    'B4 兜底函数体内旧「历练+20」白给已拆净');

// ============ C 三司接线 ============
var W3 = engWorld({ extra: ['js/city-facilities/facility-offices.js'] });
['tax_bureau', 'court', 'household_registry'].forEach(function (id) {
    ok(!!W3.scenarioEngine.facilities[id], 'C1 ' + id + ' 公务剧本已注册');
});
var appSrc = loadScript('js/app.js');
[['openTaxBureau', 'tax_bureau'], ['openCourt', 'court'], ['openHouseholdRegistry', 'household_registry']].forEach(function (p) {
    ok(new RegExp('function ' + p[0] + '\\(\\)\\s*\\{[\\s\\S]{0,200}openFacilityScenario\\(\'' + p[1] + '\'\\)').test(appSrc),
        'C2 app.js ' + p[0] + ' 委托情境引擎');
});
var htmlSrc = loadScript('仙侠.html');
ok(htmlSrc.indexOf('js/city-facilities/special-features.js') > 0 && htmlSrc.indexOf('js/city-facilities/facility-offices.js') > 0,
    'C3 两份新剧本已挂上页面');
ok(htmlSrc.indexOf('js/core/scenario-engine.js') < htmlSrc.indexOf('js/city-facilities/special-features.js'),
    'C4 引擎先于剧本加载（注册不扑空）');
// 司法堂堂审按城+日定死（同一天不换个案子说谎）
ok(/seedOf\(cityName\(\) \+ '_court_' \+ absDay\(\)\)/.test(loadScript('js/city-facilities/facility-offices.js')),
    'C5 堂审案件按城+日播种（确定性在案）');

// ============ D 千城千面 ============
ok(/v21\.4 千城千面/.test(lsSrc), 'D1 裁剪意图注释在案');
var TAIL = ['household_registry', 'fire_department', 'bounty_hall', 'tax_bureau', 'granary', 'court', 'exorcist_bureau',
    'medical_clinic', 'money_house', 'contract_hall', 'escort_office', 'charity_hall', 'arena_stage', 'observatory',
    'stele_forest', 'oddity_museum', 'pawn_shop', 'auction_house', 'black_market', 'garden_villa', 'goulan_washe',
    'works_bureau', 'salt_iron_office'];
// 从源码逐城取 buildings
var cityRe = /^\s{4}'([^']+)': \{/gm;
var marks = [], m;
while ((m = cityRe.exec(lsSrc)) !== null) marks.push({ name: m[1], at: m.index });
var cdStart = lsSrc.indexOf('const cityData = {');
marks = marks.filter(function (x) { return x.at > cdStart; });
var cityBuildings = {};
marks.forEach(function (mk, i) {
    var end = i + 1 < marks.length ? marks[i + 1].at : lsSrc.length;
    var seg = lsSrc.slice(mk.at, end);
    var bm = seg.match(/buildings: \[([^\]]*)\]/);
    if (bm) cityBuildings[mk.name] = bm[1].match(/'([^']+)'/g).map(function (x) { return x.replace(/'/g, ''); });
});
// cityData 共 23 城：19 座人间城 + 4 座位面城（灵界/魔界前缀，本就精裁，不在本批口径内）
var mortal = Object.keys(cityBuildings).filter(function (c) { return c.indexOf('灵界') !== 0 && c.indexOf('魔界') !== 0; });
var planes = Object.keys(cityBuildings).filter(function (c) { return c.indexOf('灵界') === 0 || c.indexOf('魔界') === 0; });
ok(planes.length === 4, 'D2a 四座位面城另立户口（灵界/魔界前缀）');
ok(mortal.length === 19, 'D2 19 座人间城户口齐全（实得 ' + mortal.length + '）');

// 尾部签名：每城保留的 23 建筑组合
var sigs = {};
mortal.forEach(function (c) {
    var sig = TAIL.filter(function (t) { return cityBuildings[c].indexOf(t) >= 0; }).join(',');
    sigs[c] = sig;
});
var uniq = {};
mortal.forEach(function (c) { if (c !== '帝都·长安') uniq[sigs[c]] = 1; });
ok(Object.keys(uniq).length >= 8, 'D3 18 城尾部签名至少 8 种花样（此前 19 城一个模子，实得 ' + Object.keys(uniq).length + ' 种）');
ok(sigs['太虚山'] !== sigs['洛水城'] && sigs['东海龙宫'] !== sigs['青城山'], 'D4 仙山与市井、海底与道场各不相同');

// 帝都全留（首都该有的衙门市井一样不少）
ok(TAIL.every(function (t) { return cityBuildings['帝都·长安'].indexOf(t) >= 0; }), 'D5 帝都·长安 23 建筑全留（首善之区）');
// 逐城性格抽查
ok(cityBuildings['东海龙宫'].indexOf('fire_department') < 0, 'D6 海底不设消防司');
ok(cityBuildings['极寒之地'].indexOf('fire_department') >= 0, 'D7 极寒之地留消防司（冰原火患最要命）');
ok(cityBuildings['佛国遗址'].indexOf('goulan_washe') < 0 && cityBuildings['万剑宗'].indexOf('goulan_washe') < 0,
    'D8 佛国剑冢不开勾栏瓦舍');
ok(cityBuildings['帝都·长安'].indexOf('goulan_washe') >= 0 && cityBuildings['鲛人镇'].indexOf('goulan_washe') >= 0,
    'D9 帝都鲛人镇照挂勾栏瓦舍（红尘营生不误伤）');
ok(cityBuildings['太虚山'].indexOf('tax_bureau') < 0 && cityBuildings['太虚山'].indexOf('stele_forest') >= 0,
    'D10 太虚山不设税课司、留碑林（仙山性格）');
// 基本盘：每城必有 quest（进城总有事做）
ok(mortal.every(function (c) { return cityBuildings[c].indexOf('quest') >= 0; }), 'D11 每座城都留了悬赏 quest 入口');
// 裁掉的都是尾巴，头部特色建筑一个没动（抽查三城头部）
ok(cityBuildings['万剑宗'].indexOf('weapon_shop') >= 0 && cityBuildings['万剑宗'].indexOf('forging') >= 0,
    'D12 万剑宗兵器铺炼器房原样');
ok(cityBuildings['佛国遗址'].indexOf('temple') >= 0 && cityBuildings['佛国遗址'].indexOf('library') >= 0,
    'D13 佛国遗址寺庙书阁原样');
ok(cityBuildings['东海龙宫'].indexOf('forging') >= 0 && cityBuildings['东海龙宫'].indexOf('weapon_shop') >= 0,
    'D14 东海龙宫头部营生原样');

console.log('v21.4 城市内容: ' + passed + ' 通过, ' + failed + ' 失败');
process.exit(failed ? 1 : 0);
