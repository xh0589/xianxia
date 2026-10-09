// ==================== auto-save.js - v20.1 自动存档 ====================
// 防崩档底线：每 7 天 + 突破成功 + 飞升/转世 自动存入独立自动档槽
// 独立于手动档（xianxia_saves），不抢占手动槽位，静默不打扰玩家
// 依赖：timeSystem.onNewDaySubscribe、saveGame({autoMode})、GameState

(function () {

var AUTO_KEY = 'xianxia_auto_saves';
var OFF_KEY = 'xianxia_autosave_off';   // v20.87 设置页开关的持久化键
var INTERVAL_DAYS = 7;   // 每 7 天自动存一次
var MAX_SLOTS = 5;        // 保留最近 5 个自动档

var _lastAutoDay = 0;     // 上次按天自动存的绝对天数
var _quotaWarned = false; // v20.87 存储写满只警告一次
var _enabled = true;      // v20.87 定期自动存档开关（突破/飞升保底档不受此开关影响）
try { _enabled = localStorage.getItem(OFF_KEY) !== '1'; } catch (e) {}

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
    // v27.21（sol 审 A-3，P1）：写失败要如实返回 false——doAutoSave 拿到它才不更新"上次自动保存"、
    // 不返回 true。旧版吞掉结果照报成功，玩家以为存上了实际丢了（比存不上更坏）。
    try {
        localStorage.setItem(AUTO_KEY, JSON.stringify(slots));
        return true;
    } catch (e) {
        // v20.87 自动档写失败不再静默——玩家以为存上了实际丢了是最坏情况
        if (!_quotaWarned && window.showMessage) {
            _quotaWarned = true;
            window.showMessage('⚠️ 自动存档写入失败：浏览器存储空间可能已满，建议删掉旧存档（删除会连同自动档一起清）', 'error');
        }
        return false;
    }
}

// v20.87 设置页开关：只管「每 7 游戏日」的定期档；突破/飞升/转世的保底档始终执行
function toggleAutoSave(on) {
    _enabled = !!on;
    try { if (window.saveToStorage) window.saveToStorage(OFF_KEY, _enabled ? '0' : '1'); else localStorage.setItem(OFF_KEY, _enabled ? '0' : '1'); } catch (e) {}
    if (window.showMessage) {
        window.showMessage(_enabled ? '已开启定期自动存档（每 7 游戏日）' : '已关闭定期自动存档（突破/飞升时仍会保底存档）', 'info');
    }
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
        var _slotsOk21 = _saveSlots(slots);   // v27.21：槽位写失败=这轮自动档没存上，如实往下走

        // v27.21（sol 审 A-3）：主档（saveGame 内部已写 xianxia_save）与自动槽**双成才算成功**——
        // 槽位失败不更新"上次自动保存"、返回 false（UI 与触发方都拿得到真话）。时间戳不假走。
        if (!_slotsOk21) return false;

        // 更新"上次自动保存"提示（不弹 toast）
        var el = document.getElementById('last-auto-save-time');
        if (el) el.textContent = '上次自动保存: ' + new Date().toLocaleString('zh-CN');
        return true;
    } catch (e) { return false; }
}

// 每日检查：逢 INTERVAL_DAYS 倍数的天数触发
function tickAutoSaveDay() {
    try {
        if (!_enabled) return;                       // v20.87 设置页关了定期档就不存
        var day = _currentDay();
        if (day <= 0) return;
        if (day === _lastAutoDay) return;          // 同一天内不重复
        if (day % INTERVAL_DAYS !== 0) return;       // 非 7 天倍数跳过
        // v27.23（sol 外审回流·已实锤收刀）：只有 doAutoSave('day') 真写成功才记当天——
        // 旧序「先记后存」在写失败（配额满/隐私模式）时当天标记照立、后续 tick 全跳过，
        // 当天再无重试。修后失败允许同日下个 tick 重试（间隔一个游戏 tick，非风暴）；
        // day%7 节奏不受影响（day8 跳、day14 照常）。返回值语义=v27.21 立的「主档+槽位双成才 true」。
        if (doAutoSave('day')) _lastAutoDay = day;
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
    // 第一百四十四批：原式是 `try { … } catch (e) {}`。接入 saveToStorage 后那层 catch 成为死支（单源自己吞异常、返回布尔、从不抛）——留着它等于假装还有一层守卫。已拆。
    window.saveToStorage('xianxia_save', JSON.stringify(slot.state));
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
window.toggleAutoSave = toggleAutoSave;

// v20.87 设置页复选框回显真实开关状态（此前那个「每5分钟」勾选框是死的，没有任何代码读它）
try {
    var _cb = document.getElementById('auto-save');
    if (_cb) _cb.checked = _enabled;
} catch (e) {}

})();
