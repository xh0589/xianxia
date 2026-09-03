// ==================== auto-save.js - v20.1 自动存档 ====================
// 防崩档底线：每 7 天 + 突破成功 + 飞升/转世 自动存入独立自动档槽
// 独立于手动档（xianxia_saves），不抢占手动槽位，静默不打扰玩家
// 依赖：timeSystem.onNewDaySubscribe、saveGame({autoMode})、GameState

(function () {

var AUTO_KEY = 'xianxia_auto_saves';
var INTERVAL_DAYS = 7;   // 每 7 天自动存一次
var MAX_SLOTS = 5;        // 保留最近 5 个自动档

var _lastAutoDay = 0;     // 上次按天自动存的绝对天数

function _currentDay() {
    try {
        if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') {
            return window.timeSystem.getAbsoluteDay();
        }
        if (window.timeSystem && window.timeSystem.gameTime) return Number(window.timeSystem.gameTime.currentDay) || 0;
    } catch (e) {}
    return 0;
}

function _loadSlots() {
    try {
        var arr = JSON.parse(localStorage.getItem(AUTO_KEY) || '[]');
        return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
}

function _saveSlots(slots) {
    try { localStorage.setItem(AUTO_KEY, JSON.stringify(slots)); } catch (e) {}
}

// 触发自动存档：trigger = 'day' | 'breakthrough' | 'ascension' | 'reincarnation'
function doAutoSave(trigger) {
    try {
        if (!window.currentCharData) return false;
        trigger = trigger || 'auto';
        // 复用 saveGame 收集逻辑，但走 autoMode：不写手动档、不弹 toast
        if (typeof window.saveGame !== 'function') return false;
        var saveData = window.saveGame({ autoMode: true, silent: true, trigger: trigger });
        if (!saveData) return false;

        var meta = (window.GameState && window.GameState.buildSaveMeta)
            ? window.GameState.buildSaveMeta(saveData)
            : {
                charName: saveData.charName,
                realm: saveData.realm,
                timestamp: saveData.timestamp,
                version: saveData.version,
                roots: saveData.roots || saveData.spiritualRoots || {}
            };

        var entry = {
            id: 'auto_' + saveData.timestamp,
            meta: meta,
            state: saveData,
            trigger: trigger,
            charName: meta.charName,
            timestamp: meta.timestamp,
            version: meta.version,
            realm: meta.realm,
            roots: meta.roots
        };

        var slots = _loadSlots();
        slots.push(entry);
        // 仅保留最近 MAX_SLOTS 个
        if (slots.length > MAX_SLOTS) slots = slots.slice(slots.length - MAX_SLOTS);
        _saveSlots(slots);

        // 更新"上次自动保存"提示（不弹 toast）
        var el = document.getElementById('last-auto-save-time');
        if (el) el.textContent = '上次自动保存: ' + new Date().toLocaleString('zh-CN');
        return true;
    } catch (e) { return false; }
}

// 每日检查：逢 INTERVAL_DAYS 倍数的天数触发
function tickAutoSaveDay() {
    try {
        var day = _currentDay();
        if (day <= 0) return;
        if (day === _lastAutoDay) return;          // 同一天内不重复
        if (day % INTERVAL_DAYS !== 0) return;       // 非 7 天倍数跳过
        _lastAutoDay = day;
        doAutoSave('day');
    } catch (e) {}
}

function getAutoSaveSlots() { return _loadSlots(); }

function refreshAutoSaveSlots() {
    var container = document.getElementById('auto-save-slots');
    if (!container) return;
    var slots = _loadSlots();
    if (slots.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm text-center">暂无自动存档</p>';
        return;
    }
    var triggerText = { day: '定期', breakthrough: '突破', ascension: '飞升', reincarnation: '转世', auto: '自动' };
    container.innerHTML = slots.slice().reverse().map(function (slot, idx) {
        var realIdx = slots.length - 1 - idx;
        var meta = slot.meta || slot;
        var roots = meta.roots || {};
        var date = new Date(meta.timestamp || slot.timestamp || Date.now());
        var dateStr = date.toLocaleString('zh-CN');
        var name = meta.charName || slot.charName || '未知';
        var realm = meta.realm != null ? meta.realm : '';
        var trig = triggerText[slot.trigger] || '自动';
        return '<div class="flex justify-between items-center bg-gray-800 p-3 rounded border border-green-700">'
            + '<div>'
            + '<p class="text-gray-200 font-bold">' + name + (realm ? ' · ' + realm : '') + ' <span class="text-xs text-green-400">[' + trig + ']</span></p>'
            + '<p class="text-xs text-gray-500">' + dateStr + ' | 灵根: 金' + (roots.metal != null ? roots.metal : '-') + '% 木' + (roots.wood != null ? roots.wood : '-') + '% 水' + (roots.water != null ? roots.water : '-') + '% 火' + (roots.fire != null ? roots.fire : '-') + '% 土' + (roots.earth != null ? roots.earth : '-') + '%</p>'
            + '</div>'
            + '<div class="flex gap-2">'
            + '<button onclick="loadAutoSaveSlot(' + realIdx + ')" class="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded transition">载入</button>'
            + '</div>'
            + '</div>';
    }).join('');
}

function loadAutoSaveSlot(index) {
    var slots = _loadSlots();
    if (index < 0 || index >= slots.length) return;
    var slot = slots[index];
    if (!slot || !slot.state) return;
    var name = (slot.meta && slot.meta.charName) || slot.charName || '自动存档';
    if (!confirm('确定要加载自动存档「' + name + '」吗？当前进度将丢失。')) return;
    // 同步写入 xianxia_save（作为最近档备份）后走标准载入流程
    try { localStorage.setItem('xianxia_save', JSON.stringify(slot.state)); } catch (e) {}
    if (typeof loadSaveData === 'function') {
        loadSaveData(slot.state);
    } else if (typeof window.loadSaveData === 'function') {
        window.loadSaveData(slot.state);
    }
}

if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
    window.timeSystem.onNewDaySubscribe(tickAutoSaveDay);
}

window.doAutoSave = doAutoSave;
window.getAutoSaveSlots = getAutoSaveSlots;
window.refreshAutoSaveSlots = refreshAutoSaveSlots;
window.loadAutoSaveSlot = loadAutoSaveSlot;

})();
