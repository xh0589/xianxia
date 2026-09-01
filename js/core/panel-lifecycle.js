/**
 * panel-lifecycle.js — 主导航与动态子面板的生命周期边界
 *
 * 原项目部分模块把面板直接 append 到 #game-world，脱离 .panel-content，
 * 导致切换主导航后仍残留。这里统一负责主面板切换时清理/隐藏这些临时面板。
 */
(function (global) {
    'use strict';

    var transients = new Map();

    function register(id, options) {
        if (!id) return;
        options = options || {};
        transients.set(id, {
            ownerPanel: options.ownerPanel || null,
            removeOnSwitch: !!options.removeOnSwitch
        });
    }

    function beforeMainSwitch(panelId) {
        transients.forEach(function (meta, id) {
            var el = document.getElementById(id);
            if (!el) return;
            if (meta.ownerPanel && meta.ownerPanel === panelId) return;
            if (meta.removeOnSwitch && el.parentNode) el.parentNode.removeChild(el);
            else {
                el.classList.add('hidden');
                el.style.display = '';
            }
        });
    }

    function hide(id) {
        var el = document.getElementById(id);
        if (!el) return false;
        el.classList.add('hidden');
        el.style.display = '';
        return true;
    }

    function remove(id) {
        var el = document.getElementById(id);
        if (!el || !el.parentNode) return false;
        el.parentNode.removeChild(el);
        return true;
    }

    // 门派面板是地图的动态子视图；离开“地图”主面板必须隐藏。
    register('sect-panel', { ownerPanel: 'map' });
    // v12.1 遗留的动态任务面板如存在，切换时直接清掉，防止重复 ID/幽灵面板。
    register('quest-panel', { removeOnSwitch: true });

    global.PanelLifecycle = {
        register: register,
        beforeMainSwitch: beforeMainSwitch,
        hide: hide,
        remove: remove
    };
})(typeof window !== 'undefined' ? window : this);
