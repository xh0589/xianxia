// ==================== v23.1 饱食度：吃饭这件事从此存在 ====================
// 审计：食物是「点击→固定数值直加」，全库没有饱食概念，狂吃零代价；辟谷丹承诺「可数日不食」
// 却没有食可辟——假承诺。本模块补上真账：
//   · 饱食度 0~100，随角色存档（currentCharData._satiety），每日结算自然消耗
//   · 吃撑（>85）拒食——食物不白扣，肚子不白撑；饿着（<20）心情受损、提示觅食
//   · 辟谷丹兑现承诺：服下饱食置满并开三日辟谷期（期间不饿不耗）
'use strict';

(function () {
    var FULL_THRESHOLD = 85;   // 超过这个数就吃不下了
    var HUNGER_THRESHOLD = 20; // 低于这个数就饿得慌
    var DAILY_DECAY = 40;      // 每日自然消耗
    var MEAL_GAIN = 28;        // 一顿饭的饱食

    function cd() { return window.currentCharData || null; }
    function absDay() {
        var t = window.timeSystem;
        if (t && typeof t.getAbsoluteDay === 'function') { try { var d = t.getAbsoluteDay(); if (d) return d; } catch (e) {} }
        return (t && t.gameTime && t.gameTime.currentDay) || 1;
    }
    function get() {
        var c = cd(); if (!c) return 70;
        if (c._satiety == null) c._satiety = 70; // 开局不饿不撑
        return c._satiety;
    }
    function isFasting() {
        var c = cd();
        return !!(c && c._fastUntilDay && c._fastUntilDay > absDay());
    }
    // v27.13：①-新增-4 辟谷——仙凡之别，从「忘了吃饭」开始。
    // 三档（境界判定用现有境界序 window.REALM_ORDER 一把尺，层次读 charData.layer；认不出一律退 0 照旧吃饭）：
    //   0 照旧：凡人/炼气初期（1-3 层）——日耗 40，饿肚子扣心境（原账不动）；
    //   1 半辟：炼气中期（4 层起，含筑基）——进食需求减半（日耗 20），该吃不吃也无碍（饿着不掉心境，只留一句辟谷态话）；
    //   2 全辟：金丹起——饥饿类需求不再扣（日结不耗、不提示）；「路过闹市闻见炊烟，像闻见一段前尘」。
    // 兜底：REALM_ORDER/realmIndex 缺席或境界名认不出 → 0（辟谷不生效=照旧吃饭）；本函数只读不写。
    function fastingTier() {
        var c = cd();
        try {
            if (!c || !c.realm) return 0;
            var order = (typeof window !== 'undefined' && window.REALM_ORDER) ? window.REALM_ORDER : null;
            if (!order || typeof window.realmIndex !== 'function') return 0;
            var i = window.realmIndex(c.realm);
            if (i < 0) return 0; // 认不出的境界名：宁可当凡人，也别默默封人的口腹
            var jindan = order.indexOf('金丹');
            var zhuji = order.indexOf('筑基');
            var lianqi = order.indexOf('炼气');
            if (jindan >= 0 && i >= jindan) return 2;                 // 金丹起全辟（飞升/金仙序更高，自然在内）
            if (zhuji >= 0 && i >= zhuji) return 1;                   // 筑基在炼气中期之上，同享半辟
            if (i === lianqi && (Number(c.layer) || 1) >= 4) return 1; // 练气中期（4 层起，含后期）
            return 0;
        } catch (e) {
            console.warn('[静默失败] js/core/satiety.js · fastingTier：境界尺没量出来，按凡人照旧吃饭', e && e.message);
            return 0;
        }
    }
    // 吃得下吗：辟谷丹期内不需要吃；吃撑了塞不进。
    // v27.13：赴宴豁免的正门——辟谷改的是「需求」不是「能力」。全辟（金丹起）肚子账整个作废：
    //   饱食不再涨落，「吃撑了塞不进」的闸也随之无意义——只留辟谷丹的药力封喉（isFasting）照旧拦。
    //   这扇门一开，请客/赴宴/节庆宴的人情照旧、属性照吃（npc-bond treat / eatery / festival 都吃 canEat 这一口）。
    function canEat() {
        if (isFasting()) return false;
        if (fastingTier() >= 2) return true; // v27.13：全辟——肚子不设闸
        return get() < FULL_THRESHOLD;
    }
    function eat(gain) {
        var c = cd(); if (!c) return;
        c._satiety = Math.min(100, get() + (gain || MEAL_GAIN));
    }
    // 辟谷丹：饱食置满 + 三日不饥
    function startFasting(days) {
        var c = cd(); if (!c) return;
        c._satiety = 100;
        c._fastUntilDay = absDay() + (days || 3);
        if (window.showMessage) window.showMessage('💊 辟谷丹力化开——腹中饱足，接下来三日不饥不饿。', 'success');
    }
    function statusText() {
        if (isFasting()) return '辟谷中';
        // v27.13：境中辟谷也在肚子状态里说人话——金丹全辟「不饥不渴」，半辟按饱食账照旧走
        if (fastingTier() >= 2) return '不饥不渴';
        var s = get();
        if (s >= FULL_THRESHOLD) return '吃撑了';
        if (s < HUNGER_THRESHOLD) return '饥肠辘辘';
        return '尚可';
    }

    // 每日结算：辟谷期不耗；饿肚子掉心情。
    // v27.13：①-新增-4 辟谷三档——全辟（金丹起）饥饿类需求不再扣（不耗不提示，直接早退）；
    //   半辟（炼气中期起）日耗减半、该吃不吃也无碍（掉心境的账免了，只留一句辟谷态话）；
    //   凡人/炼气初期照旧原账。
    function dailyTick() {
        var c = cd(); if (!c) return;
        var _tier = fastingTier();
        if (_tier >= 2) return;                                  // 全辟：闻见炊烟，像闻见一段前尘——账上无事
        if (isFasting()) return;
        c._satiety = Math.max(0, get() - (_tier >= 1 ? DAILY_DECAY / 2 : DAILY_DECAY)); // 半辟：需求减半
        if (c._satiety < HUNGER_THRESHOLD) {
            if (_tier >= 1) {
                // 半辟：该吃不吃也无碍——心境不动，辟谷态话替掉饿肚子警告
                if (window.showMessage) window.showMessage('🍚 今日忘了吃午饭——不是没钱，是不饿。（辟谷渐深，谷气可有可无）', 'info');
            } else {
                c.mood = Math.max(0, (c.mood ?? 50) - 5);
                if (window.showMessage) window.showMessage('🍚 肚子咕咕叫——饿着肚子修行，心情好不起来。（心情-5，找点吃的吧）', 'warning');
            }
        }
    }
    if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
        window.timeSystem.onNewDaySubscribe(dailyTick);
    }

    window.satietySystem = {
        get: get, canEat: canEat, eat: eat, isFasting: isFasting,
        startFasting: startFasting, statusText: statusText, dailyTick: dailyTick,
        fastingTier: fastingTier, // v27.13：辟谷三档读口（0 照旧/1 半辟/2 全辟）——各吃饭面按档换文案
        FULL_THRESHOLD: FULL_THRESHOLD, HUNGER_THRESHOLD: HUNGER_THRESHOLD
    };
})();
