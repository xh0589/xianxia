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
    // 吃得下吗：辟谷期内不需要吃；吃撑了塞不进
    function canEat() {
        if (isFasting()) return false;
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
        var s = get();
        if (s >= FULL_THRESHOLD) return '吃撑了';
        if (s < HUNGER_THRESHOLD) return '饥肠辘辘';
        return '尚可';
    }

    // 每日结算：辟谷期不耗；饿肚子掉心情
    function dailyTick() {
        var c = cd(); if (!c) return;
        if (isFasting()) return;
        c._satiety = Math.max(0, get() - DAILY_DECAY);
        if (c._satiety < HUNGER_THRESHOLD) {
            c.mood = Math.max(0, (c.mood || 50) - 5);
            if (window.showMessage) window.showMessage('🍚 肚子咕咕叫——饿着肚子修行，心情好不起来。（心情-5，找点吃的吧）', 'warning');
        }
    }
    if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
        window.timeSystem.onNewDaySubscribe(dailyTick);
    }

    window.satietySystem = {
        get: get, canEat: canEat, eat: eat, isFasting: isFasting,
        startFasting: startFasting, statusText: statusText, dailyTick: dailyTick,
        FULL_THRESHOLD: FULL_THRESHOLD, HUNGER_THRESHOLD: HUNGER_THRESHOLD
    };
})();
