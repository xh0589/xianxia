// ==================== 重构第4步 · 事件委托注册表（data-act） ====================
// 动机：1032 处 JS 字符串里的内联 onclick="fn(...)"——带字符串参数的最脆（文本含引号即断），
// 且错误只能靠全局兜底看不见上下文。改法：document 级委托 + 注册表。
//
// 用法（新代码一律走此轨；存量 onclick 在迁移完之前双轨共存，转一个删一个，严禁双写双触发）：
//   JS 侧：XianXia.actions.register('ps-draft-align', function (arg, el, e) { ... });
//   HTML 侧：<button data-act="ps-draft-align" data-arg="正道">正道</button>
//   参数取值：el.getAttribute('data-arg') 由本层传入——属性值含引号天然安全，
//   生成侧拼属性时一律 window.esc() 转义。
//
// 注意：
//   - 本文件必须排在所有注册者之前加载（manifest 第 0 层）；但监听是运行时查表，
//     注册晚于监听挂载也安全（点击发生时才 resolve）。
//   - data-act 元素请用 button（天然键盘可达/可聚焦），别用 div 裸点击。
(function () {
    'use strict';
    var actions = {};

    window.XianXia.actions = {
        register: function (name, fn) {
            if (typeof name !== 'string' || !name) return false;
            actions[name] = fn;
            return true;
        },
        unregister: function (name) { delete actions[name]; },
        get: function (name) { return actions[name] || null; },
        names: function () { return Object.keys(actions); }
    };

    document.addEventListener('click', function (e) {
        var t = e.target;
        if (!t || !t.closest) return;
        var el = t.closest('[data-act]');
        if (!el || !el.getAttribute) return;
        var name = el.getAttribute('data-act');
        if (!name) return;
        var fn = actions[name];
        if (typeof fn !== 'function') {
            // 未注册的 data-act：点名提示（新代码拼错名字在这里现形），不抛不拦
            if (window.console && console.warn) console.warn('[delegate] 未注册的 action: ' + name);
            return;
        }
        try {
            fn(el.getAttribute('data-arg'), el, e);
        } catch (err) {
            // 带上下文上报（比全局兜底多一层「哪个 action 炸了」的信息）
            if (window.console && console.error) console.error('[delegate] action "' + name + '" 执行失败:', err);
        }
    });
})();
