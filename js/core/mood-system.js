// ==================== 第六十七波 · 心境账（花钱买的开心，终于有了下文） ====================
// 心境的写入方早就齐全（茶馆/瓦舍/赌盘/酒楼/画舫/饥饿/入魔/突破失败……），读端却全空——
// 死水池一汪，花钱买开心买到的只是个数字。本账接上第一个读者：打坐修炼的效率。
//   神思不倦（≥90）：真元 ×1.10    心情舒畅（≥70）：×1.05
//   平平常常（≥40）：×1.00          心烦意乱（≥20）：×0.95    心灰意冷（<20）：×0.90
// 心境是要养的：每日向「常人底色」50 自然回落 2 点——不去散心就会淡，想维持高效，
// 就得真去茶馆瓦舍花时辰（消遣的账与修炼的账从此通电）。心灰意冷时报一次信（运行时旗防刷屏）。
// 纪律：零新存档字段（mood 本就在角色账上）；零骰（梯度与回落全是定数）；本账不直接发心境
// （发心境仍走各消遣与统一结算通道——这里只读、只每日归位）。
(function () {
    'use strict';

    var CFG = {
        BASE: 50,           // 常人底色：心境的归处
        DAILY_DRIFT: 2,     // 每日向底色回落的点数
        LOW: 20,            // 心灰意冷的门槛（报信用）
        CLEAR: 40,          // 回暖销旗的门槛（防在门槛上来回横跳刷屏）
        TIERS: [
            { min: 90, mul: 1.10, label: '神思不倦' },
            { min: 70, mul: 1.05, label: '心情舒畅' },
            { min: 40, mul: 1.00, label: '平平常常' },
            { min: 20, mul: 0.95, label: '心烦意乱' },
            { min: -1, mul: 0.90, label: '心灰意冷' }
        ]
    };

    function cd() { return window.currentCharData || null; }
    function moodNow() {
        var c = cd();
        if (!c) return CFG.BASE;
        var m = Number(c.mood != null ? c.mood : 80);
        if (!isFinite(m)) return CFG.BASE;
        return Math.max(0, Math.min(100, m));
    }
    function tier() {
        var m = moodNow();
        for (var i = 0; i < CFG.TIERS.length; i++) {
            if (m >= CFG.TIERS[i].min) return CFG.TIERS[i];
        }
        return CFG.TIERS[CFG.TIERS.length - 1];
    }
    function cultivationMul() { return tier().mul; }
    function label() { return tier().label; }

    // ============ 第七十三波 · 境由心转：闭关/突破/战斗三本新账（梯度全定数，零骰） ============
    // 突破是加减百分点（在既有封顶之前加——不破 [0.05, 0.95] 的老闸）；
    // 战斗是乘法折头（只有玩家的刀认心——敌人没有这本账）；闭关与打坐同一本梯度。
    var BT_BONUS = [
        { min: 90, bonus: 0.05 },
        { min: 70, bonus: 0.02 },
        { min: 40, bonus: 0 },
        { min: 20, bonus: -0.02 },
        { min: -1, bonus: -0.05 }
    ];
    var COMBAT_MUL = [
        { min: 90, mul: 1.05 },
        { min: 70, mul: 1.02 },
        { min: 40, mul: 1.00 },
        { min: 20, mul: 0.98 },
        { min: -1, mul: 0.95 }
    ];
    function pickByMood(table, field) {
        var m = moodNow();
        for (var i = 0; i < table.length; i++) {
            if (m >= table[i].min) return table[i][field];
        }
        return table[table.length - 1][field];
    }
    function breakthroughBonus() { return pickByMood(BT_BONUS, 'bonus'); }
    function combatMul() { return pickByMood(COMBAT_MUL, 'mul'); }

    // 修炼结算单上的一句账（平平常常不增不减，就不开口）
    function cultivationNote() {
        var t = tier();
        if (t.mul === 1) return '';
        var pct = Math.round(Math.abs(t.mul - 1) * 100);
        return t.mul > 1
            ? '心境「' + t.label + '」，行功顺水（真元 +' + pct + '%）'
            : '心境「' + t.label + '」，坐也白坐几分（真元 -' + pct + '%）';
    }

    // 每日归位：向常人底色回落（高处的开心会淡，低处的郁结也会慢慢自己解开）
    function dailyTick() {
        // 第七十三波·闭关静心：关内不受行脚磨——心气不涨不落、也不报信；
        // 进关那天带进去的心境，就是整场闭关的心境（闭关效率在收成上认它）
        if (window._isInLongRetreat) return;
        var c = cd();
        if (!c) return;
        var m = moodNow();
        var next = m > CFG.BASE ? Math.max(CFG.BASE, m - CFG.DAILY_DRIFT)
            : (m < CFG.BASE ? Math.min(CFG.BASE, m + CFG.DAILY_DRIFT) : m);
        c.mood = next;
        // 心灰意冷报一次信（运行时旗，与力竭/湿衣的报信同法）
        if (next < CFG.LOW && !c._moodLowNoticed) {
            c._moodLowNoticed = true;
            if (window.showMessage) window.showMessage('😔 心境跌到了「心灰意冷」——打坐也坐不出个所以然（真元 -10%）。去城里散散心吧：茶馆一壶粗茶、瓦舍一场杂耍，都比干坐着强。', 'warning');
        }
        if (next >= CFG.CLEAR && c._moodLowNoticed) c._moodLowNoticed = false;
    }
    if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
        window.timeSystem.onNewDaySubscribe(dailyTick);
    }

    window.MoodSystem = {
        CFG: CFG,
        BT_BONUS: BT_BONUS,
        COMBAT_MUL: COMBAT_MUL,
        moodNow: moodNow,
        tier: tier,
        label: label,
        cultivationMul: cultivationMul,
        cultivationNote: cultivationNote,
        breakthroughBonus: breakthroughBonus,
        combatMul: combatMul,
        dailyTick: dailyTick
    };
})();
