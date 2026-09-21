// ==================== v23.0 平衡急救：景点/动作共用闸门 ====================
// 全库审计发现一批「点一下白拿数值、可无限连点」的旧世代景点（渡劫台叠突破加成、
// 冰晶塔刷永久体质、灵泉无限全恢复……）。本模块提供三件共用工具：
//   冷却闸（每日一次 / 每 N 日一次，随角色存档走）、资源代价（真气/精力/健康）、结果波动。
// 冷却记录挂在 currentCharData._actionCd 上——随档持久、新开档自动清零，不另设存储。
'use strict';

(function () {
    function absDay() {
        var t = window.timeSystem;
        if (t && typeof t.getAbsoluteDay === 'function') {
            try { var d = t.getAbsoluteDay(); if (d) return d; } catch (e) {}
        }
        if (t && t.gameTime && t.gameTime.currentDay) return t.gameTime.currentDay;
        return 1;
    }
    function cd() {
        var c = window.currentCharData;
        if (!c) return null;
        if (!c._actionCd) c._actionCd = {};
        return c._actionCd;
    }

    window.actionGate = {
        day: absDay,
        // 冷却中返回 true（不可用）；days 缺省 1 = 每日一次
        cooled: function (key, days) {
            var store = cd();
            if (!store) return false;
            var last = store[key];
            if (typeof last !== 'number') return false;
            // 新开档日数归零导致的「未来记录」视为过期
            if (last > absDay()) return false;
            return absDay() - last < (days || 1);
        },
        // 还剩几日冷却（向上取整）
        left: function (key, days) {
            var store = cd();
            if (!store || typeof store[key] !== 'number') return 0;
            var n = (days || 1) - (absDay() - store[key]);
            return n > 0 ? n : 0;
        },
        mark: function (key) {
            var store = cd();
            if (store) store[key] = absDay();
        },
        // 一次性闸：冷却中→弹提示并返回 false；可用→记录并返回 true
        once: function (key, days, busyMsg) {
            if (window.actionGate.cooled(key, days)) {
                if (window.showMessage) {
                    var l = window.actionGate.left(key, days);
                    window.showMessage(busyMsg || ('此处今日已无缘，' + (l > 1 ? l + '日后' : '明日') + '再来。'), 'info');
                }
                return false;
            }
            window.actionGate.mark(key);
            return true;
        },
        // 资源代价：不足→弹提示并返回 false
        spend: function (type, amount, label) {
            var c = window.currentCharData;
            if (!c) return false;
            var cur = Number(c[type] || 0);
            if (cur < amount) {
                if (window.showMessage) window.showMessage((label || type) + '不足（需 ' + amount + '，当前 ' + Math.floor(cur) + '）。', 'warning');
                return false;
            }
            c[type] = cur - amount;
            if (typeof window.updateCharacterStatus === 'function') { try { window.updateCharacterStatus(); } catch (e) {} }
            return true;
        },
        // 整数波动 [min, max]
        roll: function (min, max) {
            return min + Math.floor(Math.random() * (max - min + 1));
        }
    };
})();
