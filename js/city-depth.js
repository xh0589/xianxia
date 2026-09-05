/**
 * city-depth.js — v20.7 建筑补齐包（一次性全做批次）
 *
 * 把盘点报告里"坏/薄"的建筑机制补成真系统，全部落既有真源：
 *   ① 试炼塔层数制（window.TrialTower）：每层挑战耗精力+灵石，胜率吃道途强度，
 *      层数/最高层经 StateRegistry 'cityProgress' 持久化（旧档空对象，零迁移）
 *   ② 剑冢剑意成长线（window.SwordIntent）：悟剑攒剑意（钳位30），剑意解锁拔剑、
 *      提升挑战剑灵胜率，并以 +0.6%/点攻击参战（battle.js 与阵法增益同款读取）
 *   ③ 僵尸字段接真消费：
 *      - blessing（寺庙祈福）→ 毒洞试毒时挡一次毒（tryBlockPoison）
 *      - springBlessing（灵泉）→ 修炼 ×1.15 余泽，逐次消耗（building-effects 读取）
 *      - _poisoned → 每日气血受损 15%，直到服解毒丹（inventory 既有清除路径）
 *   ④ 黄金宫/珍珠市场专属货架：真实扣款发货（DataManager + addItem）
 *
 * 设计宪法：成本全部来自世界（精力/灵石/时辰），无日限配额、无计数器门；
 * rng 可注入（opts.randomSource）供回归复现。
 *
 * 加载顺序：time-system.js 之后（毒发订阅世界日历）；运行时无其它加载依赖。
 */
(function (global) {
    'use strict';

    var VERSION = 1;
    var REALM_ORDER = ['凡人', '炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'];
    var SWORD_CAP = 30;

    // 唯一新存档键（旧档 import 空对象 → 字段全默认，零迁移）
    var PROGRESS = {
        swordIntent: 0,
        trialFloor: 0,
        trialBest: 0,
        hasAncientSword: false
    };

    function num(v) { return typeof v === 'number' && isFinite(v) ? v : 0; }
    function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
    function rngOf(opts) { return (opts && typeof opts.randomSource === 'function') ? opts.randomSource : Math.random; }
    function cd() { return global.currentCharData || {}; }
    function msg(t, kind) { if (global.showMessage) global.showMessage(t, kind || 'info'); }
    function dm() { return (global.XianXia && global.XianXia.DataManager) || null; }
    function addTime(min, why) { if (global.timeSystem && global.timeSystem.advanceTime) { try { global.timeSystem.advanceTime(min, why); } catch (e) {} } }
    function grantItem(itemId, n) {
        if (typeof global.addItem === 'function') return !!global.addItem(itemId, n || 1);
        if (global.addItemToInventory) { global.addItemToInventory(itemId, n || 1); return true; }
        return false;
    }
    // 真源扣灵石：不足返回 false 并提示（不静默）
    function payStones(n, what) {
        var d = dm();
        if (d && typeof d.deductSpiritStones === 'function') {
            if (!d.deductSpiritStones(n)) { msg(what + '需 ' + n + ' 灵石，你手头灵石不够。', 'warning'); return false; }
            return true;
        }
        var have = num(cd().spiritStones);
        if (have < n) { msg(what + '需 ' + n + ' 灵石，你手头灵石不够。', 'warning'); return false; }
        cd().spiritStones = have - n;
        return true;
    }

    function realmScore() {
        var c = cd();
        var idx = REALM_ORDER.indexOf(c.realm || '凡人');
        if (idx < 0) idx = 0;
        return idx * 10 + num(c.layer) * 2 + Math.floor(num(c.tempering) / 20);
    }

    // ============ ④ 专属货架（黄金宫/珍珠市场） ============
    // 货品条目：itemId 必须是全库真实模板 id；price 为该店明码价
    var GOLD_WARES = [
        { id: 'mat_gold_sand', name: '金砂一両', price: 60, note: '炼金世家的入门料' },
        { id: 'mat_pearl', name: '南海海珠', price: 150, note: '含灵气的整珠，磨粉入药' },
        { id: 'foundation_pill', name: '筑基丹', price: 450, note: '黄金宫贴钱价，比坊市略惠' }
    ];
    var PEARL_WARES = [
        { id: 'mat_pearl', name: '串珠（三枚）', price: 80, note: '渔市批来的小珠' },
        { id: 'mat_pearl', name: '夜光贝珠', price: 130, note: '夜里自带微光' }
    ];
    function buyWare(list, idx, opts) {
        var w = list && list[idx];
        if (!w) return false;
        if (!payStones(w.price, '买下「' + w.name + '」')) return false;
        if (!grantItem(w.id, 1)) {
            // 背包放不下则原路退款（不白扣钱）
            var d = dm();
            if (d && typeof d.addSpiritStones === 'function') d.addSpiritStones(w.price);
            else cd().spiritStones = num(cd().spiritStones) + w.price;
            msg('背包放不下，「' + w.name + '」只好留柜上，灵石原样退回。', 'warning');
            return false;
        }
        addTime(10, '逛街采买');
        msg('购入「' + w.name + '」，' + w.price + ' 灵石。', 'success');
        return true;
    }
    function renderWares(list) {
        var html = '<div class="space-y-2">';
        for (var i = 0; i < list.length; i++) {
            var w = list[i];
            html += '<button onclick="CityDepth.buyWare(\'' + (list === GOLD_WARES ? 'gold' : 'pearl') + '\',' + i + ')" ' +
                'class="w-full bg-yellow-900 hover:bg-yellow-800 text-white text-left text-xs rounded p-2">' +
                '「' + w.name + '」— ' + w.price + ' 灵石 <span class="text-gray-400">·' + w.note + '</span></button>';
        }
        html += '</div>';
        return html;
    }
    function openWaresPanel(kind) {
        var list = kind === 'gold' ? GOLD_WARES : PEARL_WARES;
        var title = kind === 'gold' ? '🏵️ 黄金宫内库' : '🫧 珍珠市场';
        if (typeof global.showBuildingEffectDialog === 'function') global.showBuildingEffectDialog(title, renderWares(list));
        else if (typeof global.showModal === 'function') global.showModal(title, renderWares(list));
    }

    // ============ ③ blessing：挡毒消费（寺庙祈福的真牙齿） ============
    function tryBlockPoison() {
        var c = cd();
        if (num(c.blessing) > 0) {
            c.blessing = num(c.blessing) - 1;
            msg('🙏 佛门庇佑护住心脉，将一缕毒气化于无形（庇佑余 ' + c.blessing + '）。', 'success');
            return true;
        }
        return false;
    }
    // 毒发：每日气血 15%，直到服解毒丹（inventory 既有清除 _poisoned 的路径）
    function poisonTick() {
        var c = cd();
        if (!c._poisoned) return false;
        var mx = num(c.maxHealth) || 100;
        var dmg = Math.max(1, Math.round(mx * 0.15));
        c.health = Math.max(1, num(c.health) - dmg);
        msg('☠️ 毒气在经脉里发作，气血暗损 ' + dmg + '——寻常丹药不解，需寻解毒丹。', 'danger');
        if (global.updateStatusPanel) global.updateStatusPanel();
        return true;
    }

    // ============ ② 剑冢：剑意成长线 ============
    var SwordIntent = {
        get value() { return PROGRESS.swordIntent; },
        // 悟剑：耗 20 真气 + 1 时辰，剑意+1~2（钳位 30）
        comprehend: function (opts) {
            var c = cd();
            if (num(c.qi) < 20) { msg('真气不足，参不透剑碑残意。', 'warning'); return false; }
            if (PROGRESS.swordIntent >= SWORD_CAP) { msg('剑意已圆，再悟无进。', 'info'); return false; }
            c.qi = num(c.qi) - 20;
            var gain = rngOf(opts)() < 0.3 ? 2 : 1;
            PROGRESS.swordIntent = clamp(PROGRESS.swordIntent + gain, 0, SWORD_CAP);
            addTime(60, '剑冢悟剑');
            msg('⚔️ 剑碑残意入怀，剑意 +' + gain + '（现 ' + PROGRESS.swordIntent + '）。', 'success');
            return true;
        },
        // 试拔古剑：剑意≥8 才有资格；成功率随剑意涨，成则全江湖仅此一把
        pull: function (opts) {
            if (PROGRESS.hasAncientSword) { msg('古剑已认你为主，冢中再无第二把。', 'info'); return false; }
            if (PROGRESS.swordIntent < 8) { msg('剑意尚浅（需 8），剑身看都不看你。', 'warning'); return false; }
            var prob = clamp((PROGRESS.swordIntent - 8) * 5 + 10, 5, 80);
            if (rngOf(opts)() * 100 < prob) {
                if (!grantItem('wpn_dark_iron_sword', 1)) { msg('背包放不下，古剑嗡了一声缩回土里。', 'warning'); return false; }
                PROGRESS.hasAncientSword = true;
                PROGRESS.swordIntent = clamp(PROGRESS.swordIntent + 2, 0, SWORD_CAP);
                msg('🗡️ 古剑出泥，嗡鸣认主！剑意 +2。', 'success');
                return true;
            }
            var c = cd();
            c.energy = Math.max(0, num(c.energy) - 5);
            msg('剑身纹丝不动，反震得你虎口发麻（精力 -5）。', 'info');
            return false;
        },
        // 挑战剑灵：剑意≥5 可战，胜则剑意大涨、名声外传
        challenge: function (opts) {
            if (PROGRESS.swordIntent < 5) { msg('剑灵无视了你——剑意不足 5，虚影都摸不着。', 'warning'); return false; }
            var prob = clamp(15 + PROGRESS.swordIntent * 2, 5, 75);
            if (rngOf(opts)() * 100 < prob) {
                PROGRESS.swordIntent = clamp(PROGRESS.swordIntent + 3, 0, SWORD_CAP);
                var c = cd();
                c.essence = num(c.essence) + 50;
                if (typeof global.addFame === 'function') global.addFame(3);
                msg('🌟 你胜了剑灵！剑意 +3、真元 +50，冢外已有修士记下你的名。', 'success');
                return true;
            }
            var c2 = cd();
            c2.energy = Math.max(0, num(c2.energy) - 20);
            c2.tempering = num(c2.tempering) + 15;
            msg('剑灵一鞘把你拍飞——疼归疼，这一鞘也是剑课（历练 +15，精力 -20）。', 'info');
            return false;
        },
        // 战斗加成入口：每点剑意 +0.6% 攻击（battle.js 读取）
        attackMul: function () { return 1 + PROGRESS.swordIntent * 0.006; }
    };

    // ============ ① 试炼塔 ============
    var TrialTower = {
        get floor() { return PROGRESS.trialFloor; },
        get best() { return PROGRESS.trialBest; },
        // 挑战下一层：耗 20 精力 + 30 灵石（塔前香火），胜率吃道途强度 vs 层难
        challenge: function (opts) {
            var c = cd();
            var next = PROGRESS.trialFloor + 1;
            if (num(c.energy) < 20) { msg('进塔需 20 精力，你现在的状态上去就是挨打。', 'warning'); return false; }
            if (!payStones(30, '第 ' + next + ' 层的塔前香火')) return false;
            c.energy = num(c.energy) - 20;
            addTime(60, '闯试炼塔');
            var score = realmScore();
            var diff = next * 8;
            var prob = clamp(50 + (score - diff) * 3, 5, 90);
            if (rngOf(opts)() * 100 < prob) {
                PROGRESS.trialFloor = next;
                PROGRESS.trialBest = Math.max(PROGRESS.trialBest, next);
                c.essence = num(c.essence) + 30 + next * 5;
                if (typeof global.addFame === 'function') global.addFame(1 + Math.floor(next / 3));
                if (next % 5 === 0 && grantItem('vitality_pill', 2)) {
                    msg('🏮 过第 ' + next + ' 层！塔中赐药两枚，真元大涨（第 ' + next + ' 层）。', 'success');
                } else {
                    msg('🏮 过第 ' + next + ' 层，塔梯在你面前加长了一截。', 'success');
                }
                if (global.updateStatusPanel) global.updateStatusPanel();
                return { success: true, floor: next, prob: prob };
            }
            c.mood = clamp(num(c.mood) - 5, 0, 100);
            c.tempering = num(c.tempering) + 10;
            msg('第 ' + next + ' 层把你轰了出来——挨的打也是历练（历练 +10）。', 'warning');
            return { success: false, floor: PROGRESS.trialFloor, prob: prob };
        },
        openPanel: function () {
            var html = '<p class="text-sm text-gray-300 mb-2">当前第 ' + PROGRESS.trialFloor + ' 层 · 最深 ' + PROGRESS.trialBest + ' 层</p>' +
                '<p class="text-xs text-gray-500 mb-3">每次挑战耗 20 精力 + 30 灵石塔前香火；层越高越吃道行。</p>' +
                '<button onclick="CityDepth.trialChallenge()" class="w-full bg-red-800 hover:bg-red-700 text-white text-xs rounded p-2">⚔️ 挑战第 ' + (PROGRESS.trialFloor + 1) + ' 层</button>';
            if (typeof global.showBuildingEffectDialog === 'function') global.showBuildingEffectDialog('🗼 试炼塔', html);
            else if (typeof global.showModal === 'function') global.showModal('🗼 试炼塔', html);
        }
    };

    // ============ 世界日历挂载：毒发 ============
    if (global.timeSystem && typeof global.timeSystem.onNewDaySubscribe === 'function') {
        global.timeSystem.onNewDaySubscribe(poisonTick);
    }

    // ============ 持久化 ============
    if (global.StateRegistry && typeof global.StateRegistry.register === 'function') {
        global.StateRegistry.register('cityProgress', {
            version: VERSION,
            export: function () {
                return { swordIntent: PROGRESS.swordIntent, trialFloor: PROGRESS.trialFloor, trialBest: PROGRESS.trialBest, hasAncientSword: !!PROGRESS.hasAncientSword };
            },
            import: function (data) {
                if (data && typeof data === 'object') {
                    PROGRESS.swordIntent = clamp(num(data.swordIntent), 0, SWORD_CAP);
                    PROGRESS.trialFloor = Math.max(0, Math.floor(num(data.trialFloor)));
                    PROGRESS.trialBest = Math.max(0, Math.floor(num(data.trialBest)));
                    PROGRESS.hasAncientSword = !!data.hasAncientSword;
                }
            },
            reset: function () {
                PROGRESS.swordIntent = 0; PROGRESS.trialFloor = 0; PROGRESS.trialBest = 0; PROGRESS.hasAncientSword = false;
            }
        });
    }

    var api = {
        version: VERSION,
        sword: SwordIntent,
        tower: TrialTower,
        goldWares: GOLD_WARES,
        pearlWares: PEARL_WARES,
        swordComprehend: function (o) { return SwordIntent.comprehend(o); },
        swordPull: function (o) { return SwordIntent.pull(o); },
        swordChallenge: function (o) { return SwordIntent.challenge(o); },
        trialChallenge: function (o) { return TrialTower.challenge(o); },
        openTrialPanel: function () { TrialTower.openPanel(); },
        openWaresPanel: openWaresPanel,
        buyWare: function (kind, idx) { return buyWare(kind === 'gold' ? GOLD_WARES : PEARL_WARES, idx); },
        tryBlockPoison: tryBlockPoison,
        poisonTick: poisonTick,
        getSwordIntentMul: SwordIntent.attackMul,
        progress: function () { return PROGRESS; }
    };
    global.CityDepth = api;
    global.XianXia = global.XianXia || {};
    global.XianXia.CityDepth = api;
    // battle.js 战斗钩子用（与阵法增益同款：直接函数调用，缺载返回 1）
    global.getSwordIntentAttackMul = function () { return PROGRESS.swordIntent ? SwordIntent.attackMul() : 1; };

    console.log('[CityDepth] initialized v' + VERSION);
})(typeof window !== 'undefined' ? window : this);
