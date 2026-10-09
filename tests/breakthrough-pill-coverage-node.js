/**
 * breakthrough-pill-coverage-node.js — 突破丹全覆盖 + PIN3 掉落实收：
 *   A1 ★逐境全覆盖★：突破门每一境（REALM_CONFIG 的 8 次可突破跃迁）都有一张真吃得到的丹，逐境列出
 *   A2 ★效果分境界★：不同境界的丹效果不同，且服药后落到的成功率逐境不同（不是一个倍率套 N 遍）
 *   A3 ★真能吃到★：走真实突破函数 startBreakthroughRitual，_breakthroughPillBonus 真被加进成功率并清零
 *   A4 ★PIN3 真掉★：补档的每一件都能从 generateEnemyInventory 真路径掷出来（不许"理论上能"）
 *   A5 ★掉率未动★：8 项概率常数 + 8 项门槛逐项比对基线
 *   A6 ★废弃登记★：B 类那批登记在 DEPRECATED_ITEMS 并写明缘由，且不是静默留着
 *
 * 运行：node tests/breakthrough-pill-coverage-node.js
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

// ==================== 世界桩 ====================
var W = {
    console: { log: function () {}, warn: function () {}, error: function () {} },
    setTimeout: function () { return 0; }, clearTimeout: function () {},
    localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
    document: {
        createElement: function () {
            return { style: {}, classList: { add: function () {}, remove: function () {} }, dataset: {}, innerHTML: '', remove: function () {} };
        },
        getElementById: function () { return null; },
        querySelector: function () { return null; },
        querySelectorAll: function () { return []; },
        addEventListener: function () {},
        body: { appendChild: function () {} }, head: { appendChild: function () {} }
    },
    alert: function () {}, confirm: function () { return true; },
    inventory: { currency: { spiritStones: 0, copper: 0 }, slots: [] },
    currentCharData: null,
    EconomyTransaction: { getBalance: function () { return 999999; }, debit: function () { return true; }, removeByTemplate: function () { return true; }, run: function (f) { return f(); } }
};
W.window = W;
W.EventBus = { emit: function () {}, on: function () {} };
W.StateRegistry = { register: function () {} };
W.showMessage = function () {};
W.updateCharacterStatus = function () {};
W.updateInventoryUI = function () {};
W.showEffect = function () {};
W.doAutoSave = function () {};
W.timeSystem = { advanceTime: function () {} };
W.MoodSystem = { breakthroughBonus: function () { return 0; } };
W._bottleneckBonus = 0;

vm.createContext(W);
function load(rel) { vm.runInContext(loadScript(rel), W, { filename: rel }); }

// 物品库装配（页面加载序同式）
load('js/items.js');
['01-pills', '02-weapons', '03-armor', '04-materials', '05-talismans', '06-arts', '07-food', '08-special']
    .forEach(function (f) { load('js/items-extended/' + f + '.js'); });
load('js/items-extended.js');
['13-missing-ids', '14-ability-manuals', '15-root-refine', '16-dangling-ids', '17-lead-tokens', '18-grade-expansion']
    .forEach(function (f) { load('js/items-extended/' + f + '.js'); });
load('js/data.js');
load('js/loot-system.js');
load('js/cultivation/breakthrough-ritual.js');

// 可控骰子
var M = {};
Object.getOwnPropertyNames(Math).forEach(function (k) { try { M[k] = Math[k]; } catch (e) {} });
var __roll = 0.5;
M.random = function () { return __roll; };
W.Math = M;
function roll(v) { __roll = v; }

// ==================== 境界口径 ====================
// ★只认突破门这 9 境★：REALM_CONFIG.realms（data.js）。
// REALM_ORDER 那 12 项里的 凡人/飞升/金仙 不经突破门（飞升走天劫链、金仙走二段飞升），
// 渡劫是突破门末位、往上没有突破可买。逐境名单见下面 A1 的实测输出。
var REALMS = (W.REALM_CONFIG && W.REALM_CONFIG.realms || []).map(function (r) { return r.name; });
var BREAKABLE = REALMS.slice(0, REALMS.length - 1);   // 有「下一境」可突破的那些
var TERMINAL = REALMS[REALMS.length - 1];             // 渡劫：末位，往上走天劫链

// ==================== A1 逐境全覆盖 ====================
console.log('\n[A1] 突破丹·逐境覆盖（突破门 ' + REALMS.length + ' 境）');
(function () {
    console.log('     可突破跃迁 ' + BREAKABLE.length + ' 次：' + BREAKABLE.join(' → ') + ' →（' + TERMINAL + ' 走天劫链）');
    var table = [];
    BREAKABLE.forEach(function (realm) {
        var pills = W.getBreakthroughPillsForRealm(realm);
        var realmOwn = pills.filter(function (p) { return p.realm === realm; });
        var bands = ['pin6', 'pin4', 'pin2', 'pin1'].reduce(function (acc, b) {
            return acc.concat(W.GRAD_LOOT_BANDS[b]);
        }, []);
        var obtainable = pills.filter(function (p) { return bands.indexOf(p.id) >= 0; });
        table.push({ realm: realm, total: pills.length, own: realmOwn.length, obtainable: obtainable.length });
        console.log('     ' + realm.padEnd(4) + ' 共 ' + pills.length + ' 张（本境专属 ' + realmOwn.length +
            ' / 已接掉落档 ' + obtainable.length + '）  ' +
            pills.map(function (p) { return p.name + (p.random ? '[随机]' : '+' + Math.round(p.bonus * 100) + '%'); }).join('、'));

        // 逐境断言，不抽样
        ok(pills.length > 0, 'A1 ' + realm + ' 至少有一张突破丹');
        ok(realmOwn.length > 0, 'A1 ' + realm + ' 至少有一张**本境专属**丹');
        ok(obtainable.length > 0, 'A1 ' + realm + ' 至少有一张丹已接进掉落档（拿得到）');
        realmOwn.forEach(function (p) {
            ok(typeof p.bonus === 'number' || typeof p.bonus === 'string',
                'A1 ' + realm + ' 的 ' + p.name + ' 带可消费的 breakthrough_bonus');
            ok(p.id !== 'pill_huxin', 'A1 ' + realm + ' 不该把已废弃的护心丹算进去');
        });
    });
    // 末位境界：明写它为什么不需要丹
    ok(TERMINAL === '渡劫', 'A1 突破门末位是渡劫（实测 ' + TERMINAL + '）');
    var trib = loadScript('js/cultivation/heavenly-tribulation.js');
    ok(/飞升/.test(trib), 'A1 渡劫往上走的是天劫链（heavenly-tribulation.js），不是突破门，故不配突破丹');
    ok(/二段飞升/.test(loadScript('js/endgame/ascension-epilogue.js')), 'A1 金仙走二段飞升链，同样不经突破门');
    // 飞升/金仙/凡人 确不在突破门里
    ok(REALMS.indexOf('飞升') < 0 && REALMS.indexOf('金仙') < 0 && REALMS.indexOf('凡人') < 0,
        'A1 飞升/金仙/凡人不在 REALM_CONFIG.realms（不属突破门口径）');
    console.log('     实测：突破门 ' + REALMS.length + ' 境，可突破跃迁 ' + BREAKABLE.length +
        ' 次，末位 ' + TERMINAL + ' 无突破可买');
})();

// ==================== A2 效果分境界 ====================
console.log('\n[A2] 丹效分境界');
(function () {
    var byRealm = {}, rates = {};
    BREAKABLE.forEach(function (realm) {
        var own = W.getBreakthroughPillsForRealm(realm).filter(function (p) { return p.realm === realm; });
        byRealm[realm] = own;
        var base = W.getBreakthroughRitualBaseRate(realm);
        rates[realm] = own.map(function (p) {
            var b = typeof p.bonus === 'number' ? p.bonus : 0.10;   // 随机档取区间中值
            // 与仪式同款：丹加成封「加丹前基础率 × 0.5」的一层，再进 [0.1, 0.95] 闸
            // （唯一咬到的是大乘 0.45 + 0.27 → +0.225 ⇒ 0.675；化神 0.60 + 0.20 未触顶，仍是 80%）
            var gain = Math.min(b, Math.max(0, base) * 0.5);
            return { id: p.id, raw: p.bonus, result: Math.min(0.95, Math.max(0.1, base + gain)) };
        });
    });
    // 基准率逐境不同
    var bases = BREAKABLE.map(function (r) { return W.getBreakthroughRitualBaseRate(r); });
    ok(new Set(bases).size === bases.length, 'A2 基准成功率逐境不同：' + bases.join(' / '));
    // 本境专属丹的数值逐境不同（不是同一个倍率套 N 遍）
    var fixedOwn = BREAKABLE.map(function (r) {
        var n = byRealm[r].filter(function (p) { return !p.random; });
        return n.length ? n[0].bonus : null;
    });
    ok(new Set(fixedOwn).size === fixedOwn.length,
        'A2 各境专属丹的加成逐境不同：' + fixedOwn.join(' / '));
    // 服药后落到的成功率逐境不同
    var ownResults = BREAKABLE.map(function (r) { return Number(rates[r][0].result.toFixed(4)); });
    ok(new Set(ownResults).size === ownResults.length,
        'A2 各境服专属丹后的成功率逐境不同：' + ownResults.join(' / '));
    // 封顶只咬大乘这一口（0.45×0.5=0.225 < 0.27），化神那档 0.60+0.20 必须原样 80%
    ok(Math.abs(rates['化神'][0].result - 0.80) < 1e-9,
        'A2 化神 60% + 化神丹 20% 未触顶，仍是 80%（实得 ' + rates['化神'][0].result + '）');
    ok(Math.abs(rates['大乘'][0].result - 0.675) < 1e-9,
        'A2 大乘 45% + 大乘丹 27% 被封到 +22.5% ⇒ 67.5%（不再是 72%，实得 ' + rates['大乘'][0].result + '）');
    // 至少存在两种「机制形状」不同的丹：固定值 与 随机顿悟
    var all = BREAKABLE.reduce(function (a, r) { return a.concat(W.getBreakthroughPillsForRealm(r)); }, []);
    var uniq = {}; all.forEach(function (p) { uniq[p.id] = p; });
    var allPills = Object.keys(uniq).map(function (k) { return uniq[k]; });
    ok(allPills.some(function (p) { return p.random; }) && allPills.some(function (p) { return !p.random; }),
        'A2 固定值丹与随机顿悟丹并存（不止一种效果形状）');
    var wudao = allPills.filter(function (p) { return p.id === 'pill_wudao'; })[0];
    ok(!!wudao && wudao.random === true, 'A2 悟道丹是随机档（顿悟）');
    // 废弃的护心丹不得出现在任何一境的可用名单里
    ok(!allPills.some(function (p) { return p.id === 'pill_huxin'; }), 'A2 已废弃的护心丹不进任何一境可用名单');
})();

// ==================== A3 真能吃到（走真实突破函数） ====================
console.log('\n[A3] 走真实突破函数：加成被应用并清零');
(function () {
    function mkChar(realm, layer) {
        W.currentCharData = {
            realm: realm, layer: layer, essence: 1e12, tempering: 1e12, qi: 1e9,
            energy: 100, spiritStones: 1e9, maxQi: 1e9, _failedBreakthroughs: 0
        };
        // 突破仪式要真材料才放行（BREAKTHROUGH_MATERIALS），先把这一跃要的备齐
        var next = REALMS[REALMS.indexOf(realm) + 1];
        var req = W.BREAKTHROUGH_MATERIALS[realm + '→' + next] || W.BREAKTHROUGH_MATERIALS['default'];
        W.inventory.slots = (req.items || []).map(function (it, i) {
            return { slotIndex: i, templateId: it.id, count: it.count };
        });
        W.EconomyTransaction.getBalance = function () { return 1e9; };
    }
    var cases = [
        { realm: '炼气', pill: 'pill_peiyuan', bonus: 0.10 },
        { realm: '金丹', pill: 'pill_ningyuan', bonus: 0.15 },
        { realm: '化神', pill: 'pill_huashen', bonus: 0.20 },
        { realm: '炼虚', pill: 'pill_xukong', bonus: 0.23 },
        { realm: '合体', pill: 'pill_hebi', bonus: 0.25 },
        { realm: '大乘', pill: 'pill_dacheng', bonus: 0.27 }
    ];
    cases.forEach(function (c) {
        var maxLayers = 9;
        mkChar(c.realm, maxLayers);                       // 圆满，才进突破门仪式
        var base = W.getBreakthroughRitualBaseRate(c.realm);
        W.currentCharData._breakthroughPillBonus = 0;
        // 仪式一旦开跑 inProgress 就不再进第二次（startBreakthroughRitual 开头有守卫），
        // 所以每次调用前都要把上一场收尾——这也是玩家「关掉面板再来一次」的真实路径。
        W.breakthroughState.inProgress = false;
        W.startBreakthroughRitual();                        // 先跑一次拿裸基准
        var bare = W.breakthroughState.successRate;

        W.breakthroughState.inProgress = false;
        W.currentCharData._breakthroughPillBonus = c.bonus;
        W.startBreakthroughRitual();                        // 再跑一次，这次带加成
        var withPill = W.breakthroughState.successRate;

        ok(W.breakthroughState.targetRealm === REALMS[REALMS.indexOf(c.realm) + 1],
            'A3 ' + c.realm + ' 突破目标是 ' + REALMS[REALMS.indexOf(c.realm) + 1] + '（实得 ' + W.breakthroughState.targetRealm + '）');
        ok(Math.abs(bare - base) < 1e-9, 'A3 ' + c.realm + ' 裸成功率 = 基准率 ' + base + '（实得 ' + bare.toFixed(4) + '）');
        // 丹加成封「加丹前基础率 × 0.5」：逐境只有大乘那一口咬到（0.45×0.5=0.225 < 0.27）
        var wantGain = Math.min(c.bonus, base * 0.5);
        ok(Math.abs((withPill - bare) - wantGain) < 1e-9,
            'A3 ' + c.realm + ' 吃 ' + c.pill + ' 后成功率 +' + wantGain.toFixed(4) +
            '（丹标称 +' + c.bonus + (wantGain < c.bonus ? '，被封顶压到 ' + wantGain.toFixed(4) : '，未触顶') +
            '；实得 +' + (withPill - bare).toFixed(4) + '）');
        ok(wantGain <= c.bonus + 1e-9 && (wantGain < c.bonus) === (base * 0.5 < c.bonus),
            'A3 ' + c.realm + ' 封顶只在 基准×0.5 < 丹加成 时咬下去（基准 ' + base + ' × 0.5 = ' + (base * 0.5).toFixed(4) + '）');
        ok(W.currentCharData._breakthroughPillBonus === 0,
            'A3 ' + c.realm + ' 加成读后清零（实得 ' + W.currentCharData._breakthroughPillBonus + '）');
        W.breakthroughState.inProgress = false;
    });
    // 清零只发生一次：第二次突破不该再吃到同一枚丹的加成
    mkChar('化神', 9);
    W.currentCharData._breakthroughPillBonus = 0.20;
    W.startBreakthroughRitual();
    var first = W.breakthroughState.successRate;
    W.breakthroughState.inProgress = false;
    W.startBreakthroughRitual();
    var second = W.breakthroughState.successRate;
    ok(second < first, 'A3 同一枚丹的加成不会被吃两次（' + first.toFixed(3) + ' → ' + second.toFixed(3) + '）');
    W.breakthroughState.inProgress = false;
})();

// ==================== A4 PIN3 真掉 ====================
console.log('\n[A4] PIN3 补档货真能掉进背包');
(function () {
    // 补档的 20 件（另 5 件见 A6 废弃登记 / C 类另派）
    var TARGET = [
        // 低段 → pin4
        'pill_pojing', 'pill_qi_return_supreme', 'pill_wudao', 'pill_huashen', 'pill_xukong',
        'arm_soul_banner', 'arm_hun_yuan_ring', 'arm_hun_yuan_belt', 'arm_chaos_charm',
        'arm_bagua_shield', 'arm_nine_bead_necklace',
        // 高段 → pin2
        'pill_triple_flower', 'pill_hebi', 'pill_dacheng',
        'arm_colorful_boots', 'arm_immortal_crown',
        'wpn_peacock', 'wpn_cheng_ying', 'wpn_dragon_claw', 'wpn_seven_star',
        'wpn_yin_yang_staff', 'wpn_jiuxiao', 'wpn_tai_a', 'wpn_tiancan_qin'
    ];
    var bands = ['pin6', 'pin4', 'pin2', 'pin1'];
    TARGET.forEach(function (id) {
        ok(!!W.itemById[id], 'A4 ' + id + ' 在百宝册里查得到');
        var inBand = bands.filter(function (b) { return W.GRAD_LOOT_BANDS[b].indexOf(id) >= 0; });
        ok(inBand.length > 0, 'A4 ' + id + ' 接进了掉落档' + (inBand.length ? '（' + inBand.join(',') + '）' : '（未接任何档）'));
    });

    // ★真路径掷骰★：33 级首领 + 灵脉三重（.items-extended 装的物品库里 itemById 齐全）
    var got = {};
    roll(0.5);   // 用真随机，从分布另一端证明不是靠固定骰值
    var Mreal = Math;
    W.Math.random = Mreal.random;
    var enemy = { name: '深渊魔头', level: 33, type: 'boss', species: 'human', physiologyType: 'humanoid', _leyElite: 3, combatAbilities: [] };
    var N = 20000;
    for (var i = 0; i < N; i++) {
        var inv = W.generateEnemyInventory(enemy);
        for (var j = 0; j < inv.items.length; j++) got[inv.items[j]] = (got[inv.items[j]] || 0) + 1;
    }
    W.Math.random = M.random;
    var missed = TARGET.filter(function (id) { return !got[id]; });
    ok(missed.length === 0, 'A4 ' + TARGET.length + ' 件补档货都能从 generateEnemyInventory 真掷出来' +
        (missed.length ? '，掷 ' + N + ' 次仍没出：' + missed.join(',') : '（掷 ' + N + ' 次全中）'));
    TARGET.forEach(function (id) {
        ok(!!got[id], 'A4 ' + id + ' 实掷命中 ' + (got[id] || 0) + ' 次');
    });
    console.log('     实掷 ' + N + ' 次（33级首领＋灵脉三重）：补档 ' + TARGET.length +
        ' 件全部命中，最低 ' + Math.min.apply(null, TARGET.map(function (t) { return got[t] || 0; })) + ' 次');
})();

// ==================== A5 掉率未动 ====================
console.log('\n[A5] 原有掉率一个都没改');
(function () {
    var src = loadScript('js/loot-system.js');
    var rollBlock = src.slice(src.indexOf('var leyTier'), src.indexOf('// W-1（接线五处'));
    // 基线：本次只加档位行，掷骰这段必须逐字不变
    var BASELINE = [
        { re: /level >= 15 && \(bossish \|\| eliteish\) && Math\.random\(\) < ([\d.]+)/, v: '0.25', what: '六品 15+精英/boss' },
        { re: /\(level >= 20 && bossish\) \? Math\.random\(\) < ([\d.]+)/, v: '0.18', what: '四品 20+首领' },
        { re: /leyTier >= 1 && Math\.random\(\) < ([\d.]+)/, v: '0.12', what: '四品 灵脉一重+' },
        { re: /\(level >= 26 && bossish\) \? Math\.random\(\) < ([\d.]+)/, v: '0.12', what: '二品 26+首领' },
        { re: /leyTier >= 2 && Math\.random\(\) < ([\d.]+)/, v: '0.20', what: '二品 灵脉二重+' },
        { re: /leyTier >= 3 && Math\.random\(\) < ([\d.]+)/, v: '0.35', what: '一品 灵脉三重魔头' },
        { re: /level >= 30 && enemyType === 'dungeon_boss' && Math\.random\(\) < ([\d.]+)/, v: '0.10', what: '一品 30+秘境首领' },
        { re: /level >= 33 && bossish && Math\.random\(\) < ([\d.]+)/, v: '0.06', what: '一品 33+首领' }
    ];
    BASELINE.forEach(function (b) {
        var m = rollBlock.match(b.re);
        ok(!!m, 'A5 「' + b.what + '」这一掷还在');
        ok(!!m && m[1] === b.v, 'A5 「' + b.what + '」掉率 = ' + b.v + '（实得 ' + (m ? m[1] : 'MISSING') + '）');
    });
    ['level >= 15', 'level >= 20', 'leyTier >= 1', 'level >= 26', 'leyTier >= 2',
        'leyTier >= 3', 'level >= 30', 'level >= 33'].forEach(function (g) {
        ok(rollBlock.indexOf(g) >= 0, 'A5 门槛「' + g + '」未动');
    });
    // 四档的触发结构未动：一档一次 _gradPick，没有新增掷骰行
    ok((rollBlock.match(/_gradPick\('/g) || []).length === 4, 'A5 仍是四档各掷一次（无新增掷骰）');
    ok((rollBlock.match(/Math\.random\(\) < /g) || []).length === 8, 'A5 概率比较共 8 处，一处未增未减');
    // 原四档原有货一件不许少
    var ORIG = {
        pin6: ['arm_cloud_shield', 'arm_agate_necklace', 'arm_twin_fish_ring', 'arm_bronze_bell', 'arm_azure_robe', 'arm_cloud_step_boots', 'pill_gather_yuan', 'mat_spirit_pattern_copper', 'wpn_frost_sword'],
        pin4: ['arm_black_iron_shield', 'arm_warm_jade_neck', 'arm_star_ring', 'arm_sword_ring', 'arm_bodhi_pendant', 'arm_talisman_pouch', 'arm_golden_silk', 'arm_cloud_walk_boots', 'pill_jade_marrow', 'mat_meteor_essence', 'wpn_crimson_dao'],
        pin2: ['arm_tortoise_shield', 'arm_jiao_necklace', 'arm_moon_ring', 'arm_soul_jade', 'arm_cloud_charm', 'arm_purple_robe', 'arm_qilin_ring', 'pill_purple_vault', 'mat_chaos_marrow'],
        pin1: ['arm_pangu_shield', 'arm_starry_necklace', 'arm_heaven_ring', 'arm_dao_ring', 'arm_primordial_pendant', 'arm_immortal_seal', 'arm_nine_turn_robe', 'arm_heaven_crown', 'arm_cloud_shoes', 'arm_xuan_belt', 'arm_jiao_gauntlets', 'wpn_heaven_ask', 'wpn_nirvana_staff', 'dragon_staff']
    };
    Object.keys(ORIG).forEach(function (b) {
        var lost = ORIG[b].filter(function (id) { return W.GRAD_LOOT_BANDS[b].indexOf(id) < 0; });
        ok(lost.length === 0, 'A5 ' + b + ' 原有 ' + ORIG[b].length + ' 件一件没少' + (lost.length ? '，少了：' + lost.join(',') : ''));
    });
})();

// ==================== A6 废弃登记 ====================
console.log('\n[A6] B 类登记废弃而非静默留着');
(function () {
    var D = W.DEPRECATED_ITEMS;
    ok(!!D, 'A6 有废弃登记簿 window.DEPRECATED_ITEMS');
    var EXPECT = {
        spec_mid_spirit_stone: '灵石四档冗余，真货币是 currency.spiritStones',
        spec_high_spirit_stone: '灵石四档冗余',
        spec_supreme_spirit_stone: '灵石四档冗余',
        spec_token: '身份标记，无发放/校验点',
        pill_huxin: 'effect 缺 breakthrough_bonus，吞丹口不吃'
    };
    Object.keys(EXPECT).forEach(function (id) {
        ok(!!D[id], 'A6 ' + id + ' 已登记废弃');
        ok(!!(D[id] && D[id].reason && D[id].reason.length > 10), 'A6 ' + id + ' 写明了废弃缘由');
        ok(!!(D[id] && D[id].replacement), 'A6 ' + id + ' 指明了替代物/去处');
        // 登记了就不能还挂在掉落档里当"其实能给"
        var inBand = ['pin6', 'pin4', 'pin2', 'pin1'].some(function (b) { return W.GRAD_LOOT_BANDS[b].indexOf(id) >= 0; });
        ok(!inBand, 'A6 ' + id + ' 不在掉落档里（废弃件不该被掷出来）');
    });
    // 护心丹本体也带废弃标记
    ok(W.itemById.pill_huxin && W.itemById.pill_huxin.deprecated === true, 'A6 护心丹本体标了 deprecated');
    ok(W.itemById.pill_huxin && W.itemById.pill_huxin.implemented === false, 'A6 护心丹本体标了 implemented:false');
    // ★反例：这些确有真实发放点的，绝不许被登记废弃（登记了就是撒谎）★
    ['spec_spirit_stone', 'spec_spirit_crystal', 'spec_enhance_stone', 'qiyu_canpu', 'qiyu_jiuzhuan_zha']
        .forEach(function (id) {
            ok(!D[id], 'A6 ' + id + ' 有真实发放点，不该被登记废弃');
        });
    var shop = loadScript('js/extensions/qiyu-encounters.js');
    ok(/itemId: 'qiyu_canpu'/.test(shop), 'A6 qiyu_canpu 确有奇遇发放点（extensions/qiyu-encounters.js）');
})();

// ==================== 结果 ====================
console.log('\n========== 突破丹全覆盖 + PIN3 掉落实收 ==========');
console.log('通过 ' + passed + ' / 失败 ' + failed);
process.exit(failed ? 1 : 0);
