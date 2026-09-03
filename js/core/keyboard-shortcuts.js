// ==================== keyboard-shortcuts.js - v20.1 键盘快捷键 ====================
// 市面标配：字母键切换面板、Esc 关闭弹窗/战斗、空格战斗继续
// 仅在游戏世界中生效（角色创建输入框内不响应），复用 switchPanel / closeBattle / 移除 modal
// 无新状态、无存档、无迁移

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

// 关闭最上层 modal（我加的弹窗均为 .fixed.inset-0）
function _closeTopModal() {
    var modals = document.querySelectorAll('.fixed.inset-0');
    if (modals.length) {
        modals[modals.length - 1].remove();
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
