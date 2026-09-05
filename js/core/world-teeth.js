// js/core/world-teeth.js — 世界的牙齿：黑市信用簿 + 巡夜罚则（v20.21）
// 黑市不看恶名压价——它吃两样：你能带来什么实惠（成交记录）、你的信用如何（有无黑吃黑前科）。
// 账本挂 _fence 字段，随存档白名单成对往返（单一真源，无平行状态、无私自 localStorage）。
// 巡逻罚则是纯函数（注入 rng 可测），扣钱上身在调用方做。
(function (global) {
    'use strict';

    function num(v) { return Number(v) || 0; }
    function char() { return global.currentCharData || null; }
    function log(m, t) { (global.gameLog || { add: function () {} }).add(m, t || 'info'); }

    // ============ 黑市信用簿 ============
    var FenceCredit = {
        // 账本懒初始化（trust 信用 / deals 成交笔数 / snitches 举报前科）
        ledger: function () {
            var p = char();
            if (!p) return null;
            if (!p._fence || typeof p._fence !== 'object') p._fence = { trust: 0, deals: 0, snitches: 0 };
            var f = p._fence;
            f.trust = num(f.trust);
            f.deals = num(f.deals);
            f.snitches = num(f.snitches);
            return f;
        },

        summary: function () {
            var f = this.ledger();
            if (!f) return null;
            return { trust: f.trust, deals: f.deals, snitches: f.snitches, blacklisted: f.trust <= -2 };
        },

        // 牌面话术（黑市柜台文案共用）：只报事实，不替玩家粉饰
        describe: function () {
            var f = this.ledger();
            if (!f) return '';
            if (f.trust <= -2) return '暗巷口贴着一张新条子，上头写着你的名号——黑市里没摊子接你的单，除非托人说和。';
            if (f.trust >= 4) return '斗笠人把你往暗柜里让：“老主顾了，柜底的真货只给你这样的人看。”（信用 +' + f.trust + '，成交 ' + f.deals + ' 笔）';
            if (f.trust >= 2) return '斗笠人冲你点点头：“面熟。柜底有件把真货，只当你这样的人卖。”（信用 +' + f.trust + '，成交 ' + f.deals + ' 笔）';
            if (f.deals > 0) return '你在这儿销过 ' + f.deals + ' 笔货，摊主们认你这张脸。';
            return '';
        },

        // 记一笔（举报 -2 / 被捕获手 -1 / 成交 +1）——调整本身不设失败
        adjust: function (delta, kind) {
            var f = this.ledger();
            if (!f) return { error: '黑市不与无名氏打交道' };
            f.trust += num(delta);
            if (kind === 'snitch') f.snitches += 1;
            if (kind === 'deal') f.deals += 1;
            return { ok: true, trust: f.trust };
        },

        // 做成一笔买卖：先验信用门槛（黑名单/信用不足则整笔拦下），过关才记成交
        deal: function (minTrust) {
            var f = this.ledger();
            if (!f) return { error: '黑市不与无名氏打交道' };
            if (f.trust <= -2) return { error: '告示墙上贴着你的名字——黑市里没摊子接你的单' };
            if (f.trust < num(minTrust)) return { error: '暗柜里没你的座——先来攒够交情（需信用 ' + (num(minTrust)) + '）' };
            f.deals += 1;
            f.trust += 1;
            return { ok: true, trust: f.trust };
        },

        // 托人说和：破财消嫌隙（一次摆平，信用回到桌面之上）
        settle: function () {
            var f = this.ledger();
            if (!f) return { error: '黑市不与无名氏打交道' };
            if (f.trust > -2) return { error: '你与黑市并无嫌隙，说和的门路用不上' };
            f.trust = 0;
            log('中间人揣着你的银子转了三圈话，条子从墙上揭了。“下回注意点。”', 'info');
            return { ok: true, trust: 0 };
        }
    };

    // ============ 巡夜罚则（纯函数，rng 可注入） ============
    // 恶名的代价在城法这边：恶名越重，盘查越狠——罚酒钱、动手搜身。
    window.patrolConsequence = function (noto, rng) {
        var r = (typeof rng === 'function') ? rng() : Math.random();
        noto = num(noto);
        if (noto <= 25) return { action: 'none' };
        if (noto <= 60) return r < 0.5 ? { action: 'fine', fine: 30 } : { action: 'none', wary: true };
        return r < 0.5 ? { action: 'detain', fine: 60, qi: 15 } : { action: 'fine', fine: 60 };
    };

    // ============ 本城买价行情（与 batch3 卖价系数同一真源链） ============
    // 城市数据只经 locationSystem 读，查不到落回 1——单一真源。
    window.facilityBuyMod = function () {
        var city = (typeof global.getCurrentCityName === 'function' && global.getCurrentCityName()) ||
            (global.currentCharData && global.currentCharData.location) || '';
        var m = null;
        if (city && global.locationSystem) {
            try {
                if (typeof global.locationSystem.getCityPriceModifier === 'function') m = global.locationSystem.getCityPriceModifier(city, 'buy');
            } catch (e) {}
            if (m == null) try {
                var cd = global.locationSystem.getCityData && global.locationSystem.getCityData(city);
                if (cd && cd.priceModifier) m = cd.priceModifier.buy;
            } catch (e2) {}
        }
        return (m != null && m > 0) ? m : 1;
    };

    global.FenceCredit = FenceCredit;
    if (typeof module !== 'undefined' && module.exports) module.exports = { FenceCredit: FenceCredit };
})(typeof window !== 'undefined' ? window : this);
