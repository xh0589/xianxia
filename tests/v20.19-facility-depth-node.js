/**
 * v20.19-facility-depth-node.js — 设施厚一层：现算价 + 原子代价 + 11 本新戏
 *
 * 覆盖：
 *   A 引擎现算：函数值报价结算一刻取值；cost 折进掷签分支原子结算（赢扣本净额、输只扣本）；
 *     函数报价与 cost 复合；钱庄账本金额函数解析；无掷签时 cost 直扣
 *   B 11 家设施全部双剧本、新戏 id 唯一且为预期集
 *   C 每本新戏胜/败双分支真跑：不报错、代价真实落账（掷败不白拿、掷胜净得为正）
 *   D 现算真源：同一出戏在贵价城/贱价城落袋不同；赔率随本城声望浮动
 *   E 无一白送审计：凡有新收益的分支，同笔必有真代价（钱/真气/精力/伤/业障/恶名）
 *   F 静态：页面接线、做过即永锁已拆、契约护送补上真精力、钱庄旧账未动
 *
 * 运行：node tests/v20.19-facility-depth-node.js
 */
'use strict';

var path = require('path');
var fs = require('fs');
var vm = require('vm');

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) passed++;
    else { failed++; console.error('[FAIL] ' + msg); }
}

// —— 世界桩：单一钱包真源 + 行情/声望可注入 ——
function makeWorld(opts) {
    opts = opts || {};
    var currency = { spiritStones: opts.stones != null ? opts.stones : 1000 };
    var logs = [];
    var w = {
        console: { log: function () {}, warn: function () {}, error: function () {} },
        JSON: JSON, Object: Object, Array: Array, Math: Math, Number: Number,
        isFinite: isFinite, Date: Date, String: String,
        currentCharData: {
            qi: opts.qi != null ? opts.qi : 100, health: 100,
            energy: opts.energy != null ? opts.energy : 100, maxEnergy: 100,
            tempering: 0, karma: 0, notoriety: 0, fame: 0,
            location: '测试城'
        },
        inventory: { currency: currency, slots: opts.slots || [] },
        XianXia: {},
        gameLog: { add: function (m, t) { logs.push(String(m)); } },
        showMessage: function (m) { logs.push(String(m)); },
        advanceTime: function () {},
        getCurrentCityName: function () { return '测试城'; },
        getRealmTier: function () { return 3; },
        getReputationValue: function () { return opts.rep || 0; },
        addReputation: function (c, n) { w._reps.push([c, n]); },
        addFame: null,
        locationSystem: {
            getCityPriceModifier: function (city, type) {
                if (type === 'sell') return opts.sellMod != null ? opts.sellMod : 1;
                return 1;
            },
            getCityData: function () { return { priceModifier: { sell: opts.sellMod != null ? opts.sellMod : 1 } }; }
        },
        document: { readyState: 'complete', addEventListener: function () {}, getElementById: function () { return null; },
            createElement: function () { return { style: {}, classList: { add: function () {}, remove: function () {} }, appendChild: function () {}, innerHTML: '' }; },
            querySelector: function () { return null; }, body: {} }
    };
    w._reps = [];
    w.XianXia.DataManager = {
        getSpiritStones: function () { return currency.spiritStones; },
        setSpiritStones: function (v) { currency.spiritStones = Math.max(0, v); }
    };
    w.EconomyTransaction = {
        run: function (fn) { return fn(); },
        credit: function (k, n) { if (k === 'spiritStones') { currency.spiritStones += n; return true; } return true; },
        debit: function (k, n) {
            if (k === 'spiritStones') { if (currency.spiritStones < n) return false; currency.spiritStones -= n; return true; }
            return true;
        },
        addSnapshot: function () { return true; },
        removeByTemplate: function () { return true; }
    };
    if (opts.rng) w.__scenarioRng = opts.rng;
    w.window = w;
    var ctx = vm.createContext(w);
    return { w: w, ctx: ctx, currency: currency, logs: logs };
}
function loadInto(ctx, rel) { vm.runInContext(fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8'), ctx); }
function rngQueue(vals) {
    var i = 0;
    return function () { return i < vals.length ? vals[i++] : 0.5; };
}

// 全量世界：真引擎 + 真结算 + 账房 + 二批/三批剧本
function fullWorld(opts) {
    var W = makeWorld(opts);
    loadInto(W.ctx, 'js/core/reward-service.js');
    loadInto(W.ctx, 'js/core/world-teeth.js'); // v20.21：黑市剧本挂上信用簿后需带上底座
    loadInto(W.ctx, 'js/core/scenario-engine.js');
    loadInto(W.ctx, 'js/city-facilities/bank-service.js');
    loadInto(W.ctx, 'js/city-facilities/facility-batch2.js');
    loadInto(W.ctx, 'js/city-facilities/facility-batch3.js');
    W.eng = W.w.scenarioEngine;
    return W;
}

// ============ A: 引擎现算与原子代价 ============
var W = fullWorld({ stones: 500, rng: rngQueue([0.1]) });
var eng = W.eng;

// A1 函数值报价：结算一刻现算（临时剧本需注册进每一个新世界——引擎/配置是各世界独立的）
function regDyn(e) {
    e.register('t_dyn', tDynCfg());
}
function tDynCfg() { return {
    id: 't_dyn', name: '测试', icon: 'x', desc: 'x',
    scenarios: [{ id: 's', name: 's', desc: 's', startNode: 'n', nodes: {
        n: { desc: 'x', choices: [
            { text: '报价', next: null, effects: { stones: function () { return 42; }, msg: '报价成交' } },
            { text: 'cost+roll 掷胜', next: null, effects: { cost: { stones: 50 }, roll: {
                prob: 0.5, win: { stones: 120 }, lose: { karma: -1 } } } },
            { text: '函数报价+cost', next: null, effects: { cost: { stones: 30 }, stones: function () { return 100; } } },
            { text: '真气代价', next: null, effects: { cost: { qi: 25 } } },
            { text: '账本金额函数', next: null, effects: { bank: { op: 'deposit', amount: function () { return 60; } } } }
        ] }
    } }]}
; }
regDyn(eng);
var st = eng.start('t_dyn', 's');
var res = eng.choose(0);
assert(W.currency.spiritStones === 542 && !(res && res.error), 'A1 函数值报价结算时取值（500→542，写死数字才是不对的）');

// A2 cost 折进胜分支：得 120 扣本 50 → 净 +70（rng 0.1 < 0.5 掷胜）
st = eng.start('t_dyn', 's');
res = eng.choose(1);
assert(W.currency.spiritStones === 612 && W.w.currentCharData.karma === 0 && !(res && res.error),
    'A2 掷胜：赢120与扣本50同一笔事务，净+70（542→612），不是先白拿后补票');

// A2b 掷败：只扣本金，赌资不凭空退
var W2 = fullWorld({ stones: 500, rng: rngQueue([0.99]) });
regDyn(W2.eng);
st = W2.eng.start('t_dyn', 's');
res = W2.eng.choose(1);
assert(W2.currency.spiritStones === 450 && W2.w.currentCharData.karma === -1 && !(res && res.error),
    'A2b 掷败：本金50照扣、业障+，赌局不包输退本（500→450）');

// A3 函数报价与 cost 复合：100-30=+70
st = eng.start('t_dyn', 's');
res = eng.choose(2);
assert(W.currency.spiritStones === 682, 'A3 函数报价与代价复合：先现算100再扣本30（612→682）');

// A4 无掷签的 cost 直落
st = eng.start('t_dyn', 's');
res = eng.choose(3);
assert(W.w.currentCharData.qi === 75 && !(res && res.error), 'A4 纯 cost 选项：真气 100→75 真实扣减');

// A5 账本金额也吃函数值
st = eng.start('t_dyn', 's');
res = eng.choose(4);
assert(W.w.currentCharData._bank && W.w.currentCharData._bank.deposit === 60 && W.currency.spiritStones === 622,
    'A5 bank.amount 函数解析：存60起账、现银 682→622');

// A6 剧本配置不被结算污染：同剧本再跑报价仍是 42（函数值未回写死值）
st = eng.start('t_dyn', 's');
var before = W.currency.spiritStones;
res = eng.choose(0);
assert(W.currency.spiritStones === before + 42, 'A6 配置零污染：同剧本第二次掷出同一报价（回写配置=复读机印钞）');

// ============ B: 11 家双剧本 ============
var W3 = fullWorld({});
var NEW_IDS = {
    contract_hall: 'contract_bet', escort_office: 'escort_hitch', charity_hall: 'charity_kitchen',
    arena_stage: 'arena_wildcard', observatory: 'observatory_rain', stele_forest: 'stele_rubbing',
    oddity_museum: 'museum_errand', pawn_shop: 'pawn_appraise', auction_house: 'auction_snipe',
    black_market: 'black_fence', garden_villa: 'villa_poetry'
};
var facIds = Object.keys(NEW_IDS);
facIds.forEach(function (fid) {
    var f = W3.eng.facilities[fid];
    assert(!!f && f.scenarios.length >= 2, 'B1 ' + fid + ' 已有第二出戏（现 ' + (f ? f.scenarios.length : 0) + ' 出）');
    var ids = f.scenarios.map(function (s) { return s.id; });
    var dup = ids.length !== new Set(ids).size;
    assert(!dup && ids.indexOf(NEW_IDS[fid]) >= 0, 'B2 ' + fid + ' 新戏「' + NEW_IDS[fid] + '」在册且无重号');
});

// ============ C: 每本新戏胜/败真跑 ============
function findRollChoice(scenario) {
    var node = scenario.nodes[scenario.startNode];
    for (var i = 0; i < node.choices.length; i++) {
        var e = node.choices[i].effects;
        if (e && e.roll) return { index: i, eff: e, choice: node.choices[i] };
    }
    return null;
}
function snapshot(p, currency) {
    return { qi: p.qi, energy: p.energy, health: p.health, stones: currency.spiritStones, karma: p.karma, noto: p.notoriety };
}
function branchNum(v) { return typeof v === 'function' ? v() : (Number(v) || 0); }
function findCostChoice(scenario) {
    var node = scenario.nodes[scenario.startNode];
    for (var i = 0; i < node.choices.length; i++) {
        var e = node.choices[i].effects;
        if (e && e.cost) return { index: i, eff: e, choice: node.choices[i] };
    }
    return null;
}
function runBranch(fid, rollVal) {
    var Wx = fullWorld({ rng: rngQueue([rollVal]) });
    var sc = Wx.eng.facilities[fid].scenarios[1];
    var rc = findRollChoice(sc) || findCostChoice(sc); // 帮工类无掷签：跑确定性出力选项
    if (!rc) return null;
    // 补足门槛（require 是门槛不是代价，测试只管代价）
    Wx.w.currentCharData.qi = 100; Wx.w.currentCharData.energy = 100;
    var before = snapshot(Wx.w.currentCharData, Wx.currency);
    Wx.eng.start(fid, sc.id);
    var out = Wx.eng.choose(rc.index);
    return { before: before, p: Wx.w.currentCharData, cur: Wx.currency, out: out, eff: rc.eff, reps: Wx.w._reps };
}
facIds.forEach(function (fid) {
    var win = runBranch(fid, 0.0);
    var lose = runBranch(fid, 0.99);
    assert(!!win && !!lose, 'C0 ' + fid + ' 第二出戏有掷签或出力选项');
    assert(!(win.out && win.out.error) && !(lose.out && lose.out.error),
        'C1 ' + fid + ' 双分支推演不报错（胜:' + (win.out && win.out.error) + ' 败:' + (lose.out && lose.out.error) + '）');
    var cost = win.eff.cost || {};
    var dQi = win.p.qi - win.before.qi, dEn = win.p.energy - win.before.energy;
    if (cost.qi) assert(dQi <= -cost.qi, 'C2 ' + fid + ' 胜分支真气代价落账（Δ' + dQi + ' ≤ -' + cost.qi + '）');
    if (cost.energy) assert(dEn <= -cost.energy, 'C2 ' + fid + ' 胜分支精力代价落账（Δ' + dEn + ' ≤ -' + cost.energy + '）');
    if (win.eff.roll && cost.stones) {
        // 净得口径：胜=分支所得-本金，败=分支所得(多为0)-本金，分毫不差
        var wg = branchNum(win.eff.roll.win.stones), lg = branchNum(lose.eff.roll.lose.stones);
        assert(win.cur.spiritStones === win.before.stones + wg - cost.stones,
            'C2 ' + fid + ' 胜分支净额=所得' + wg + '-本金' + cost.stones + '（Δ' + (win.cur.spiritStones - win.before.stones) + '）');
        assert(lose.cur.spiritStones === lose.before.stones + lg - cost.stones,
            'C3 ' + fid + ' 败分支本金照扣不退（Δ' + (lose.cur.spiritStones - lose.before.stones) + '）');
    }
    if (!cost.qi && !cost.energy && !cost.stones) {
        // 无本金的（黑市代销）：代价=名声业障伤气，胜败都必有付出
        assert(win.p.karma < win.before.karma || win.p.notoriety > win.before.notoriety || lose.p.qi < lose.before.qi,
            'C2 ' + fid + ' 无本金戏的代价是名声/业障/皮肉，总有一样真落账');
    }
});

// ============ D: 现算真源 ============
// D1 同一出掌眼戏：贵价城 vs 贱价城落袋不同
function appraiseStones(sellMod) {
    var Wx = fullWorld({ rng: rngQueue([0.0]), sellMod: sellMod });
    Wx.w.currentCharData.qi = 100;
    Wx.eng.start('pawn_shop', 'pawn_appraise');
    Wx.eng.choose(0); // 掷胜
    return Wx.currency.spiritStones;
}
var hi = appraiseStones(1.2), lo = appraiseStones(0.8);
assert(hi !== lo && (hi - lo) === Math.round(40 * 1.2) - Math.round(40 * 0.8),
    'D1 同一件掌眼谢仪随本城收购系数现算：贵价城多落 ' + (hi - lo) + ' 灵石（48 vs 32 口径）');

// D2 赔率随本城声望浮动（直接问剧本的 prob 函数）
var Wd = fullWorld({ rep: 0 });
var probFn = Wd.eng.facilities['pawn_shop'].scenarios[1].nodes.pa_start.choices[0].effects.roll.prob;
var p0 = probFn();
Wd.w.getReputationValue = function () { return 100; };
var p100 = probFn();
assert(p100 > p0, 'D2 本城声望 0→100，掌眼成算 ' + p0.toFixed(2) + '→' + p100.toFixed(2) + '（名声当得越响越有人信你）');

// ============ E: 无一白送审计 ============
function branchHasCost(branch, eff) {
    var gain = 0, costSeen = false;
    ['stones', 'qi', 'energy', 'health', 'rep', 'fame', 'karma'].forEach(function (k) {
        var v = branch[k];
        if (typeof v === 'function') { gain += 1; return; } // 函数报价必是进钱
        v = Number(v) || 0;
        if (v > 0 && ['stones', 'qi', 'energy', 'health', 'rep', 'fame'].indexOf(k) >= 0) gain += v;
        if (v < 0 || (k === 'karma' && v < 0)) costSeen = true;
    });
    if ((Number(branch.notoriety) || Number(branch.noto) || 0) > 0) costSeen = true; // 恶名也是代价
    if (gain === 0) return true;
    if (costSeen) return true;
    if (eff && eff.cost) return true; // 选项级代价（本金/精力/真气）覆盖全分支
    return false;
}
facIds.forEach(function (fid) {
    var sc = W3.eng.facilities[fid].scenarios[1];
    var ok = true, bad = '';
    Object.keys(sc.nodes).forEach(function (nid) {
        sc.nodes[nid].choices.forEach(function (c) {
            var e = c.effects;
            if (!e) return;
            if (e.roll) {
                ['win', 'lose'].forEach(function (bk) {
                    if (!branchHasCost(e.roll[bk] || {}, e)) { ok = false; bad = nid + '/' + bk; }
                });
            } else if (!branchHasCost(e, e)) { ok = false; bad = nid; }
        });
    });
    assert(ok, 'E ' + fid + ' 每一笔收益同笔都有真代价' + (bad ? '（违例: ' + bad + '）' : ''));
});

// ============ F: 静态 ============
var htmlSrc = fs.readFileSync(path.resolve(__dirname, '..', '仙侠.html'), 'utf8');
assert(htmlSrc.indexOf('js/city-facilities/facility-batch3.js') >= 0, 'F1 第三批剧本已挂上页面（排在二批之后）');
var seSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'core', 'scenario-engine.js'), 'utf8');
assert(seSrc.indexOf('_resolveVals') >= 0 && seSrc.indexOf('_foldCost') >= 0 && seSrc.indexOf('_mergeCost') >= 0,
    'F2 引擎三件套（现算/折价/并笔）在案');
assert(seSrc.indexOf("if (!done) {") < 0 && seSrc.indexOf('btn.onclick = function() { startScenario(facilityId, s.id); };') >= 0,
    'F3 做过即永锁已拆：✅ 只是记号，戏可以再入');
var b2Src = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'city-facilities', 'facility-batch2.js'), 'utf8');
assert(b2Src.indexOf("cost: { energy: 30 }, time: 60") >= 0, 'F4 契约护送补上真精力（过门槛≠白送）');
assert(b2Src.indexOf("op: 'deposit'") >= 0, 'F5 钱庄旧账未动');
var b3Src = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'city-facilities', 'facility-batch3.js'), 'utf8');
assert(b3Src.indexOf('facilitySellMod') >= 0 && (b3Src.match(/facilityAugment\('/g) || []).length === 11,
    'F6 第三批恰好 11 家，报价函数在案');

console.log('v20.19 facility-depth: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
