// ==================== error-guard.js - v20.87 全局异常兜底 ====================
// 此前全项目没有 window.onerror：任何未捕获异常都表现为「点了没反应」，玩家无从知晓。
// 这里做三件事：
//   1. 捕获脚本运行时错误与 Promise 未处理拒绝，给玩家一条人话提示（节流，同一错误 10 秒只报一次）
//   2. 详情进 console，方便排查
//   3. 资源加载失败（图片/脚本 404）只记 console，不打扰玩家
// 无依赖，必须在所有脚本之前加载（showMessage 在错误发生时才调用，届时已就绪）

(function () {
    'use strict';

    var _lastMsg = '';
    var _lastTime = 0;

    function notify(detail) {
        try {
            // 节流：同样的错误 10 秒内只弹一次，避免刷屏
            var now = Date.now();
            if (detail === _lastMsg && now - _lastTime < 10000) return;
            _lastMsg = detail;
            _lastTime = now;
            if (typeof window.showMessage === 'function') {
                window.showMessage('⚠️ 游戏遇到一点小问题（' + detail + '），刚才的操作可能没生效。进度不受影响，可稍后手动存档。', 'warning');
            }
        } catch (e) { /* 提示层自己坏了就不再折腾 */ }
    }

    window.addEventListener('error', function (ev) {
        if (ev && ev.target && ev.target !== window && (ev.target.src || ev.target.href)) {
            // 资源加载失败：只记录，不弹窗
            try { console.warn('[资源加载失败]', ev.target.src || ev.target.href); } catch (e) {}
            return;
        }
        var where = '';
        try {
            if (ev && ev.filename) {
                var parts = String(ev.filename).split('/');
                where = parts[parts.length - 1] + (ev.lineno ? ':' + ev.lineno : '');
            }
        } catch (e) {}
        try { console.error('[未捕获异常]', ev && ev.error ? ev.error : ev && ev.message, where); } catch (e2) {}
        notify(where || '内部错误');
    }, true);

    window.addEventListener('unhandledrejection', function (ev) {
        var reason = ev && ev.reason;
        var text = '';
        try { text = reason && reason.message ? reason.message : String(reason || '').slice(0, 60); } catch (e) {}
        try { console.error('[Promise 未处理拒绝]', reason); } catch (e2) {}
        notify(text || '异步操作失败');
    });
})();
