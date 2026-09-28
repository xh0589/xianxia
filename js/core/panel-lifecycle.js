/**
 * panel-lifecycle.js — 主导航与动态子面板的生命周期边界
 *
 * 原项目部分模块把面板直接 append 到 #game-world，脱离 .panel-content，
 * 导致切换主导航后仍残留。这里统一负责主面板切换时清理/隐藏这些临时面板。
 */
(function (global) {
    'use strict';

    var transients = new Map();

    // ===== 重构第5步 · 主面板刷新注册表 =====
    // 动机：switchPanel 是巨型 if-else 硬编码分发（13 个面板分支），新面板要改 3 处
    // （HTML nav + panel div + switchPanel 分支）。改法：面板自己注册 onShow，
    // switchPanel 先查注册表，未注册的走旧路径（双轨共存，迁移完一个删一个 if 分支）。
    // 与上面 transients 同住本文件：都是「主面板切换生命周期」的职责，语义同宗。
    var showHooks = new Map();

    function registerShow(id, options) {
        if (!id) return false;
        options = options || {};
        if (typeof options.onShow !== 'function') return false;
        showHooks.set(id, { onShow: options.onShow });
        return true;
    }

    function runShowHooks(panelId) {
        var meta = showHooks.get(panelId);
        if (!meta) return false;          // 未注册：调用方回落旧路径
        try { meta.onShow(panelId); } catch (e) {
            if (global.console && global.console.error) global.console.error('[panel-lifecycle] onShow("' + panelId + '") 失败:', e);
        }
        return true;                      // 已接手：调用方不必再走旧分支
    }

    function registeredPanels() { return Array.from(showHooks.keys()); }

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
        remove: remove,
        // 重构第5步：主面板刷新注册（面板文件自注册 onShow；switchPanel 查表优先）
        registerShow: registerShow,
        runShowHooks: runShowHooks,
        registeredPanels: registeredPanels
    };
})(typeof window !== 'undefined' ? window : this);
