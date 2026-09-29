/**
 * v25.1-cultivation-cluster-node.js — v25.1「修炼/突破/寿元」簇验收：
 *   B 段 · 试-02：飞升/金仙/凡人（realmIndex<0）点突破被拦截，maxQi 不塌、境界不降级；返回值契约
 *   P 段 · 试-13：熟练度乘数消费口 getProficiencyEffectMultiplier + addProficiencyExp 自动升级真返回
 *   N 段 · 试-12：瓶颈化解落持久账（_bottleneckCleared），checkBottleneck/惩罚对已破境界放行，StateRegistry 随档
 *
 * 不依赖真实 DOM：vm + window mock。
 * 运行：node tests/v25.1-cultivation-cluster-node.js
 */
'use strict';

var path = require('path');
var fs = require('fs');
var vm = require('vm');

var ROOT = path.resolve(__dirname, '..');
function loadScript(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) passed++;
    else { failed++; console.error('[FAIL] ' + msg); }
}

// 可控 Math：random 读 __rand，其余委托真 Math
function makeMath(w) {
    return {
        random: function () { return (w.__rand != null) ? w.__rand : 0.5; },
        min: Math.min, max: Math.max, round: Math.round, floor: Math.floor,
        ceil: Math.ceil, pow: Math.pow, abs: Math.abs, sqrt: Math.sqrt
    };
}

// ========================================================================
// B 段 · 试-02：breakthrough-system.js 飞升/金仙/凡人拦截 + 返回值契约
// ========================================================================
function makeBtWorld() {
    var msgs = [], statusCalls = 0;
    var w = {
        console: { log: function () {}, warn: function () {}, error: function () {} },
        JSON: JSON, Object: Object, Array: Array, Number: Number, String: String, Boolean: Boolean,
        isFinite: isFinite, parseInt: parseInt,
        REALM_CONFIG: {
            realms: [
                { name: '炼气', index: 0, qiBase: 50, essenceBase: 30, temperingBase: 5, layers: 9 },
                { name: '筑基', index: 1, qiBase: 100, essenceBase: 900, temperingBase: 70, layers: 9 },
                { name: '金丹', index: 2, qiBase: 200, essenceBase: 10000, temperingBase: 430, layers: 9 },
                { name: '元婴', index: 3, qiBase: 400, essenceBase: 90000, temperingBase: 1600, layers: 9 },
                { name: '化神', index: 4, qiBase: 800, essenceBase: 700000, temperingBase: 6500, layers: 9 },
                { name: '炼虚', index: 5, qiBase: 1600, essenceBase: 5000000, temperingBase: 28000, layers: 9 },
                { name: '合体', index: 6, qiBase: 3200, essenceBase: 38000000, temperingBase: 130000, layers: 9 },
                { name: '大乘', index: 7, qiBase: 6400, essenceBase: 300000000, temperingBase: 650000, layers: 9 },
                { name: '渡劫', index: 8, qiBase: 12800, essenceBase: 2400000000, temperingBase: 3200000, layers: 9 }
            ],
            layerMultipliers: [1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.3, 2.6, 3.0]
        },
        currentCharData: null,
        showMessage: function (m) { msgs.push(String(m)); },
        confirm: function () { return true; },
        updateCharacterStatus: function () { statusCalls++; },
        __msgs: msgs,
        __statusCalls: function () { return statusCalls; }
    };
    w.window = w;
    w.Math = makeMath(w);
    var ctx = vm.createContext(w);
    vm.runInContext(loadScript('js/cultivation/breakthrough-system.js'), ctx);
    return w;
}

// B1 飞升期点突破：拦截，maxQi 不塌回 50、境界不降回炼气、返回 false
(function () {
    var W = makeBtWorld();
    W.currentCharData = { realm: '飞升', layer: 1, maxQi: 23040, qi: 23040, essence: 1e12, tempering: 1e9, energy: 100 };
    var r = W._performBreakthroughNew();
    assert(r === false, 'B1a 飞升期突破返回 false（被拦截，不进入结算）');
    assert(W.currentCharData.maxQi === 23040, 'B1b 飞升期 maxQi 不塌回 50（仍 23040）');
    assert(W.currentCharData.realm === '飞升' && W.currentCharData.layer === 1, 'B1c 飞升期境界不降级');
    assert(W.__msgs.some(function (m) { return m.indexOf('二段飞升') >= 0 || m.indexOf('飞升') >= 0; }),
        'B1d 拦截文案指向飞升链（二段飞升/回入尘世），不是干瘪报错');
})();

// B2 金仙期点突破：拦截
(function () {
    var W = makeBtWorld();
    W.currentCharData = { realm: '金仙', layer: 3, maxQi: 99999, qi: 99999, essence: 1e15, tempering: 1e12, energy: 100 };
    var r = W._performBreakthroughNew();
    assert(r === false && W.currentCharData.realm === '金仙' && W.currentCharData.maxQi === 99999,
        'B2 金仙期突破被拦截——境界/真气上限原样，不落入 realms[0] 或 maxQi=50');
})();

// B3 飞升九层点突破：不得"晋升"回炼气一层（旧病灶）
(function () {
    var W = makeBtWorld();
    W.currentCharData = { realm: '飞升', layer: 9, maxQi: 23040, qi: 23040, essence: 1e12, tempering: 1e9, energy: 100 };
    W._performBreakthroughNew();
    assert(W.currentCharData.realm === '飞升' && W.currentCharData.layer === 9,
        'B3 飞升九层不"晋升"回炼气一层（realmIndex<0 全程拦截）');
})();

// B4 凡人（不在九境表）：拦截，不炸
(function () {
    var W = makeBtWorld();
    W.currentCharData = { realm: '凡人', layer: 1, maxQi: 10, qi: 10, essence: 0, tempering: 0, energy: 100 };
    var r = W._performBreakthroughNew();
    assert(r === false && W.currentCharData.realm === '凡人', 'B4 凡人点突破被拦截（realmIndex<0），境界原样');
})();

// B5 返回值契约：前置不足 → false（真元不够）
(function () {
    var W = makeBtWorld();
    W.currentCharData = { realm: '炼气', layer: 1, maxQi: 50, qi: 50, essence: 0, tempering: 0, energy: 100 };
    var r = W._performBreakthroughNew();
    assert(r === false, 'B5a 真元不足返回 false');
    assert(W.__msgs.some(function (m) { return m.indexOf('真元不足') >= 0; }), 'B5b 逐条报数（真元不足）');
})();

// B6 返回值契约：confirm 取消 → false
(function () {
    var W = makeBtWorld();
    W.confirm = function () { return false; };
    W.currentCharData = { realm: '炼气', layer: 1, maxQi: 50, qi: 50, essence: 100, tempering: 100, energy: 100 };
    var r = W._performBreakthroughNew();
    assert(r === false, 'B6 confirm 取消返回 false（不进入结算）');
})();

// B7 返回值契约：进入结算且成功 → true，升层、maxQi 随境界
(function () {
    var W = makeBtWorld();
    W.__rand = 0;   // roll=0 < rate → 成功
    W.currentCharData = { realm: '炼气', layer: 1, maxQi: 50, qi: 50, essence: 100, tempering: 100, energy: 100 };
    var r = W._performBreakthroughNew();
    assert(r === true, 'B7a 成功结算返回 true');
    assert(W.currentCharData.layer === 2, 'B7b 炼气一层 → 二层');
    assert(W.currentCharData.maxQi === 55, 'B7c maxQi 随层上升到 55（50×1.1），非塌回 50');
    assert(W.__statusCalls() >= 1, 'B7d 成功结算刷新状态栏（updateCharacterStatus 被调）');
})();

// B8 返回值契约：进入结算但失败 → 仍返回 true（主控据此关窗）
(function () {
    var W = makeBtWorld();
    W.__rand = 0.99;   // roll=0.99 >= rate → 失败
    W.currentCharData = { realm: '炼气', layer: 1, maxQi: 50, qi: 50, essence: 100, tempering: 100, energy: 100 };
    var r = W._performBreakthroughNew();
    assert(r === true, 'B8a 失败也进入了结算 → 返回 true（区别于前置不足/拦截的 false）');
    assert(W.currentCharData.layer === 1, 'B8b 失败不升层');
    assert(W.currentCharData._failedBreakthroughs === 1, 'B8c 失败计数 +1');
    assert(W.__statusCalls() >= 1, 'B8d 失败结算也刷新状态栏');
})();

// B9 最高境界（渡劫九层）：拦截返回 false
(function () {
    var W = makeBtWorld();
    W.currentCharData = { realm: '渡劫', layer: 9, maxQi: 12800, qi: 12800, essence: 1e12, tempering: 1e9, energy: 100 };
    var r = W._performBreakthroughNew();
    assert(r === false, 'B9 渡劫九层（九境表封顶）返回 false');
})();

// ========================================================================
// P 段 · 试-13：cultivation.js 熟练度乘数 helper + addProficiencyExp 真返回
// ========================================================================
function makeCultWorld() {
    var alerts = [];
    var w = {
        console: { log: function () {}, warn: function () {}, error: function () {} },
        JSON: JSON, Object: Object, Array: Array, Number: Number, String: String, Boolean: Boolean,
        isFinite: isFinite, parseInt: parseInt,
        localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
        saveToStorage: function () {},
        document: { getElementById: function () { return null; }, createElement: function () { return { style: {}, innerHTML: '' }; }, body: { appendChild: function () {} } },
        alert: function (m) { alerts.push(String(m)); },
        __alerts: alerts
    };
    w.window = w;
    w.Math = makeMath(w);
    var ctx = vm.createContext(w);
    vm.runInContext(loadScript('js/cultivation/cultivation.js'), ctx);
    return w;
}

// P1 getProficiencyEffectMultiplier：无功法/查不到 → 1
(function () {
    var W = makeCultWorld();
    assert(typeof W.getProficiencyEffectMultiplier === 'function', 'P1a helper 已导出');
    assert(W.getProficiencyEffectMultiplier('nonexistent') === 1, 'P1b 查不到功法 → 乘数 1');
    assert(W.getProficiencyEffectMultiplier(null) === 1 && W.getProficiencyEffectMultiplier(undefined) === 1,
        'P1c 无功法（null/undefined）→ 乘数 1');
})();

// P2 按等级返回 multiplier；对象/字符串双兼容
(function () {
    var W = makeCultWorld();
    W.proficiencyData['sk_p2'] = { level: 3, exp: 0, breakthroughAttempts: 0 };   // 登堂入室 ×1.8
    assert(W.getProficiencyEffectMultiplier('sk_p2') === W.PROFICIENCY_LEVELS[3].multiplier,
        'P2a 字符串 id → 按等级返回 multiplier（lv3=×1.8）');
    assert(W.getProficiencyEffectMultiplier({ id: 'sk_p2' }) === W.PROFICIENCY_LEVELS[3].multiplier,
        'P2b 对象槽双兼容取 .id → 同一乘数');
    W.proficiencyData['sk_max'] = { level: 9, exp: 0, breakthroughAttempts: 0 };   // 返璞归真 ×5.0
    assert(W.getProficiencyEffectMultiplier('sk_max') === 5.0, 'P2c 满级 ×5.0（乘数不再是空头条）');
})();

// P3 addProficiencyExp 自动升级 + 返回真实升级结果（cultivateSkill:367 死枝复活）
(function () {
    var W = makeCultWorld();
    var r = W.addProficiencyExp('sk_p3', 150);   // lv1 需 100 → 升级、扣 100、余 50
    assert(r && r.upgraded === true, 'P3a 攒满自动升级，addProficiencyExp 返回 upgraded:true（旧版返回 info，result.upgraded 恒 undefined）');
    assert(r.newLevel === 1 && r.multiplier === W.PROFICIENCY_LEVELS[1].multiplier, 'P3b 返回 newLevel/multiplier 供升级提示');
    assert(W.proficiencyData['sk_p3'].exp === 50, 'P3c 升级扣掉本级所需，余 50 exp');
    assert(W.getProficiencyEffectMultiplier('sk_p3') === W.PROFICIENCY_LEVELS[1].multiplier, 'P3d 升级后乘数即涨（×1.2）');
    // 未攒满 → upgraded:false（不再是裸 false）
    var r2 = W.addProficiencyExp('sk_p3', 10);
    assert(r2 && r2.upgraded === false, 'P3e 未攒满返回 {upgraded:false}（一致对象，调用方读 .upgraded 不炸）');
})();

// P4 满级 checkProficiencyUpgrade 回对象不回裸 false
(function () {
    var W = makeCultWorld();
    W.proficiencyData['sk_p4'] = { level: 9, exp: 0, breakthroughAttempts: 0 };
    var r = W.checkProficiencyUpgrade('sk_p4');
    assert(r && typeof r === 'object' && r.upgraded === false && r.maxLevel === true,
        'P4 满级返回 {upgraded:false,maxLevel:true}（不再裸 false）');
})();

// P5 cultivateSkill 升级提示复活（读 addProficiencyExp 真返回）+「悟道：修炼速度+20%」在文件内被消费
(function () {
    var W = makeCultWorld();
    W.discipleState = { isInSect: true, rank: 5 };
    W.currentCharData = { qi: 100 };
    W.timeSystem = { advanceTime: function () {} };
    W.__rand = 0.9;   // 避开 0.05 的领悟点弹窗
    // 预置：差一点就升级 → cultivateSkill 加经验后触发升级提示
    W.proficiencyData['sk_p5'] = { level: 0, exp: 99, breakthroughAttempts: 0 };
    // 悟道领悟（SPECIAL）应在本文件被消费进 efficiency——放一条，验它不改乘数接口但参与产出
    W.insights.push({ type: 'SPECIAL', name: '悟道', desc: '修炼速度+20%', effect: { cultivation_speed: 20 } });
    var okRun = W.cultivateSkill('sk_p5', 10);
    assert(okRun === true, 'P5a cultivateSkill 正常结算返回 true');
    assert(W.__alerts.some(function (a) { return a.indexOf('功法升级') >= 0; }),
        'P5b 自动升级时弹「功法升级」——升级提示不再是死枝（读 checkProficiencyUpgrade 真返回）');
})();

// ========================================================================
// N 段 · 试-12：cultivation-bottleneck.js 化解落持久账、放行已破境界、StateRegistry 随档
// ========================================================================
function makeBnWorld() {
    var msgs = [], profCalls = [], srReg = {};
    var w = {
        console: { log: function () {}, warn: function () {}, error: function () {} },
        JSON: JSON, Object: Object, Array: Array, Number: Number, String: String, Boolean: Boolean,
        isFinite: isFinite, parseInt: parseInt,
        document: { querySelector: function () { return null; }, createElement: function () { return { style: {}, innerHTML: '' }; }, body: { appendChild: function () {} } },
        currentCharData: { realm: '炼气', layer: 5, energy: 100, qi: 100 },
        currentSkills: { skill_main: { id: 'art_bn', name: '测试功法' } },
        showMessage: function (m) { msgs.push(String(m)); },
        addProficiencyExp: function (id, e) { profCalls.push({ id: id, e: e }); },
        timeSystem: { advanceTime: function () {} },
        insightPoints: 10,
        StateRegistry: {
            register: function (key, handlers) { srReg[key] = handlers; },
            exportAll: function () {}, importAll: function () {}, resetAll: function () {}
        },
        __msgs: msgs, __profCalls: profCalls, __srReg: srReg
    };
    w.window = w;
    w.Math = makeMath(w);
    var ctx = vm.createContext(w);
    vm.runInContext(loadScript('js/cultivation/cultivation-bottleneck.js'), ctx);
    return w;
}

// N1 未化解前 checkBottleneck 命中、惩罚生效
(function () {
    var W = makeBnWorld();
    assert(W.checkBottleneck('炼气', 5) === true, 'N1a 炼气五层命中瓶颈');
    W.__rand = 0.99;   // 让心魔判定不触发
    var pen = W.applyCultivationBottleneckPenalty(100);
    assert(pen === 30, 'N1b 未化解时惩罚生效（100→30，仅 30%）');
})();

// N2 化解成功 → 落持久账、checkBottleneck 放行、惩罚不再抽税
(function () {
    var W = makeBnWorld();
    W.playerBottleneck.isInBottleneck = true;
    W.playerBottleneck.bottleneckRealm = '炼气';
    W.__rand = 0.1;   // 静坐顿悟成功率 0.7 → random 0.1 < 0.7 成功
    W.executeBottleneckSolution(3);   // index 3 = 静坐顿悟
    assert(W.playerBottleneck.isInBottleneck === false, 'N2a 化解后 isInBottleneck 清零');
    assert(W._bottleneckCleared && W._bottleneckCleared['炼气'] === true, 'N2b 化解落持久账 _bottleneckCleared[炼气]=true');
    assert(W.checkBottleneck('炼气', 5) === false, 'N2c 已破境界 checkBottleneck 放行（不再恒真）');
    assert(W.checkBottleneck('炼气', 9) === false, 'N2d 同境界更高层也放行（一次化解，本境界不再抽税）');
    assert(W.applyCultivationBottleneckPenalty(100) === 100, 'N2e 已破境界惩罚放行（100→100，不再 30%）');
    assert(W.__profCalls.some(function (p) { return p.id === 'art_bn'; }), 'N2f 化解奖励的熟练度落在真 id（试-06 双兼容）');
})();

// N3 换境界后新境界瓶颈照常（放行只针对已破境界）
(function () {
    var W = makeBnWorld();
    W._bottleneckCleared['炼气'] = true;
    assert(W.checkBottleneck('炼气', 5) === false, 'N3a 炼气已破放行');
    assert(W.checkBottleneck('筑基', 4) === true, 'N3b 筑基（新境界）瓶颈照常命中');
})();

// N4 applyBottleneckEffect：已破境界不再重新置入瓶颈（旧病灶：每次打坐重回瓶颈）
(function () {
    var W = makeBnWorld();
    W._bottleneckCleared['炼气'] = true;
    W.playerBottleneck.isInBottleneck = false;
    var r = W.applyBottleneckEffect();   // currentCharData realm 炼气 layer 5
    assert(r === false && W.playerBottleneck.isInBottleneck === false,
        'N4 已破境界打坐不再被 applyBottleneckEffect 重新置入瓶颈');
})();

// N5 StateRegistry：化解账随完整存档存/读、新游戏清空
(function () {
    var W = makeBnWorld();
    var reg = W.__srReg['bottleneck'];
    assert(!!reg && typeof reg.export === 'function' && typeof reg.import === 'function' && typeof reg.reset === 'function',
        'N5a 瓶颈账注册进 StateRegistry（export/import/reset 齐）');
    W._bottleneckCleared['炼气'] = true;
    var snap = reg.export();
    assert(snap && snap.cleared && snap.cleared['炼气'] === true, 'N5b export 带上已化解境界');
    reg.reset();
    assert(!W._bottleneckCleared['炼气'], 'N5c reset（新游戏）清空化解账');
    reg.import({ cleared: { '筑基': true } });
    assert(W._bottleneckCleared['筑基'] === true && W.checkBottleneck('筑基', 4) === false,
        'N5d import（读档）回填化解账，checkBottleneck 认账');
})();

console.log('---');
console.log('v25.1 cultivation-cluster: ' + passed + ' 通过, ' + failed + ' 失败');
process.exit(failed ? 1 : 0);
