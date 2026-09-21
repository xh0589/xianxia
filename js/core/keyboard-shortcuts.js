// ==================== keyboard-shortcuts.js - v20.1 键盘快捷键 ====================
// 市面标配：字母键切换面板、Esc 关闭弹窗/战斗、空格战斗继续
// 仅在游戏世界中生效（角色创建输入框内不响应），复用 switchPanel / closeBattle / 移除 modal
// v20.66：字母键/空格容易误触——默认关闭，开关键在设置面板（偏好存 xianxia_settings.shortcutsEnabled）。
//         Esc 是「取消」不是「快捷键」，不受开关影响；无存档迁移。

(function () {

// 字母键 → 面板 id
var SHORTCUTS = {
    c: 'character',   // 角色
    b: 'inventory',   // 背包
    m: 'map',         // 地图
    k: 'skills',      // 功法
    q: 'quests',      // 任务
    e: 'equipment',   // 装备
    f: 'factions',    // 势力
    h: 'house',       // 洞府
    p: 'party',       // 队伍
    g: 'beasts',      // 灵兽
    a: 'activities',  // 活动事件
    d: 'calendar'     // 日程
};

function _inInput(e) {
    var t = e.target;
    if (!t) return false;
    return t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable;
}

function _gameWorldVisible() {
    var gw = document.getElementById('game-world');
    return !!(gw && gw.style.display !== 'none');
}

// v20.66 快捷键开关：偏好存 xianxia_settings.shortcutsEnabled，默认关（防误触）
function _shortcutsEnabled() {
    try {
        var s = JSON.parse(localStorage.getItem('xianxia_settings') || '{}');
        return !!(s && s.shortcutsEnabled === true);
    } catch (e) { return false; }
}

function setShortcutsEnabled(on) {
    var s = {};
    try { s = JSON.parse(localStorage.getItem('xianxia_settings') || '{}') || {}; } catch (e) {}
    s.shortcutsEnabled = !!on;
    try { localStorage.setItem('xianxia_settings', JSON.stringify(s)); } catch (e) {}
    if (window._settings) window._settings.shortcutsEnabled = !!on;
    var cb = document.getElementById('setting-shortcuts');
    if (cb) cb.checked = !!on;
}

function syncShortcutsCheckbox() {
    var cb = document.getElementById('setting-shortcuts');
    if (cb) cb.checked = _shortcutsEnabled();
}

// 关闭最上层 modal（我加的弹窗均为 .fixed.inset-0）
// 第九十五波·NEW-47：hidden 的面板不是「开着的窗」；战斗/转世/实体交互三块静态面板只能藏不能删——
// 此前空屏上按 Esc 会把藏着的 #battle-modal 当最上层弹窗删掉，本局从此再也打不了仗
function _closeTopModal() {
    var modals = [].filter.call(document.querySelectorAll('.fixed.inset-0'), function (el) {
        if (!el || !el.remove) return false;
        if (el.classList && el.classList.contains('hidden')) return false;
        // 飞鸽遮罩是独立节点、靠 .open 开关（没有 hidden 类）：没开时它不算一扇窗，别让它冒充最上层
        if (el.id === 'mailInboxScrim') return el.classList && el.classList.contains('open');
        if (el.id && window.STATIC_PANEL_IDS && window.STATIC_PANEL_IDS.indexOf(el.id) >= 0) return false;
        return true;
    });
    if (modals.length) {
        var top = modals[modals.length - 1];
        // 遮罩与窗体是两个节点：单独摘遮罩会留下「窗开着却不暗、点外面也不收」的半死态，走它自己的关窗口
        if (top.classList && top.classList.contains('mail-modal-scrim')
            && window.MailSystemUI && typeof window.MailSystemUI.closeInbox === 'function') {
            try { window.MailSystemUI.closeInbox(); return true; } catch (eMail) {}
        }
        top.remove();
        return true;
    }
    return false;
}

function onKeydown(e) {
    if (_inInput(e)) return; // 输入框内不响应
    var key = (e.key || '').toLowerCase();

    // Esc：关闭战斗 / 弹窗
    if (key === 'escape') {
        if (window.currentBattle && typeof window.closeBattle === 'function') {
            try { window.closeBattle(); } catch (err) {}
            e.preventDefault();
            return;
        }
        if (_closeTopModal()) { e.preventDefault(); return; }
        return;
    }

    if (!_shortcutsEnabled()) return; // v20.66 字母键/空格默认关闭，防误触
    if (!_gameWorldVisible()) return; // 角色创建界面不响应面板快捷键

    // 空格：战斗中点击"继续"按钮
    if (key === ' ' || e.code === 'Space') {
        if (window.currentBattle) {
            var btn = document.querySelector('#battle-actions button.bg-yellow-600');
            if (btn) { btn.click(); e.preventDefault(); }
            return;
        }
    }

    // 字母键切换面板
    var panel = SHORTCUTS[key];
    if (panel && typeof window.switchPanel === 'function') {
        try { window.switchPanel(panel); e.preventDefault(); } catch (err) {}
    }
}

document.addEventListener('keydown', onKeydown);

// 设置面板开关键
window.toggleShortcuts = function () {
    var cb = document.getElementById('setting-shortcuts');
    var on = cb ? !!cb.checked : !_shortcutsEnabled();
    setShortcutsEnabled(on);
    if (window.showMessage) window.showMessage(on
        ? '⌨️ 键盘快捷键已开启：C/B/M 等字母键可切换面板，空格战斗继续。'
        : '⌨️ 键盘快捷键已关闭：字母键不再切面板（Esc 关弹窗不受影响）。', 'info');
};
window.isShortcutsEnabled = _shortcutsEnabled;
window.setShortcutsEnabled = setShortcutsEnabled;
window.syncShortcutsCheckbox = syncShortcutsCheckbox;

// 初始化 checkbox 反映当前偏好（DOM 就绪后）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncShortcutsCheckbox);
} else {
    syncShortcutsCheckbox();
}

// 供设置面板查询展示
window.getKeyboardShortcuts = function () {
    return [
        { key: 'C', desc: '角色面板' },
        { key: 'B', desc: '背包' },
        { key: 'M', desc: '地图' },
        { key: 'K', desc: '功法' },
        { key: 'Q', desc: '任务' },
        { key: 'E', desc: '装备' },
        { key: 'H', desc: '洞府' },
        { key: 'G', desc: '灵兽' },
        { key: 'D', desc: '日程' },
        { key: 'Esc', desc: '关闭弹窗/战斗' },
        { key: '空格', desc: '战斗继续' }
    ];
};

})();
