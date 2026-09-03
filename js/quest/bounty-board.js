// ==================== bounty-board.js - v20.1 江湖悬赏榜 ====================
// 对标鬼谷八荒悬赏榜/觅长生任务榜：随机刷新的高难度讨伐悬赏，奖励丰厚
// 与日常任务区分：日常固定低难度，悬赏随机刷新高难度高奖励
// 自管击杀进度（监听 enemy:defeated，杀任意敌人推进），不依赖 quest 匹配规则，低风险
// 每日刷新未接取的悬赏，保留已接取的；不存档（每日刷新合理）

(function () {

// 悬赏模板池（讨伐 N 只任意敌人，奖励递增）
var BOUNTY_TEMPLATES = [
    { id: 'bty_1', title: '清剿妖物', desc: '近期妖物作乱，清剿 5 只任意妖物。', count: 5, stones: 200, items: [{ itemId: 'mat_demon_beast_core', count: 2 }] },
    { id: 'bty_2', title: '荡除魔修', desc: '魔修横行，讨伐 8 只任意敌人。', count: 8, stones: 350, items: [{ itemId: 'mat_demon_beast_core', count: 3 }] },
    { id: 'bty_3', title: '扫荡妖巢', desc: '捣毁妖巢，斩杀 12 只任意敌人。', count: 12, stones: 550, items: [{ itemId: 'mat_demon_beast_core', count: 5 }] },
    { id: 'bty_4', title: '镇魔卫道', desc: '镇魔大任，斩杀 16 只任意敌人。', count: 16, stones: 800, items: [{ itemId: 'mat_chaos_stone', count: 1 }] },
    { id: 'bty_5', title: '荡平魔窟', desc: '深入魔窟，斩杀 20 只任意敌人。', count: 20, stones: 1200, items: [{ itemId: 'mat_chaos_stone', count: 2 }] }
];

var _board = null; // [{id,title,desc,count,stones,items,progress,accepted,completed,claimed}]

function _today() {
    try {
        if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') {
            return window.timeSystem.getAbsoluteDay();
        }
    } catch (e) {}
    return 0;
}

// 随机抽 3 个不同模板生成悬赏榜
function generateBountyBoard() {
    var pool = BOUNTY_TEMPLATES.slice();
    var picked = [];
    for (var i = 0; i < 3 && pool.length; i++) {
        var idx = Math.floor(Math.random() * pool.length);
        var t = pool.splice(idx, 1)[0];
        picked.push({
            id: t.id + '_' + _today(), // 每日唯一
            title: t.title,
            desc: t.desc,
            count: t.count,
            stones: t.stones,
            items: t.items,
            progress: 0,
            accepted: false,
            completed: false,
            claimed: false
        });
    }
    _board = picked;
    return _board;
}

function getBountyBoard() {
    if (!_board) generateBountyBoard();
    return _board;
}

function acceptBounty(idx) {
    var b = getBountyBoard()[idx];
    if (!b || b.accepted) {
        if (window.showMessage) window.showMessage('该悬赏已接取或不存在。', 'info');
        return false;
    }
    b.accepted = true;
    if (window.gameLog && window.gameLog.add) window.gameLog.add('📜 接取悬赏「' + b.title + '」：' + b.desc, 'info');
    if (window.showMessage) window.showMessage('已接取悬赏「' + b.title + '」。', 'success');
    return true;
}

function claimBounty(idx) {
    var b = getBountyBoard()[idx];
    if (!b || !b.completed || b.claimed) {
        if (window.showMessage) window.showMessage('该悬赏未完成或已领取。', 'info');
        return false;
    }
    var cd = window.currentCharData;
    if (cd) {
        if (window.DataManager && typeof window.DataManager.addSpiritStones === 'function') window.DataManager.addSpiritStones(b.stones);
        else cd.spiritStones = (cd.spiritStones || 0) + b.stones;
        cd.fame = Math.min(100, (cd.fame || 0) + Math.floor(b.count / 2));
        if (b.items && typeof window.addResultItem === 'function') {
            b.items.forEach(function (it) { try { window.addResultItem(it.itemId, it.count); } catch (e) {} });
        }
    }
    b.claimed = true;
    if (window.gameLog && window.gameLog.add) window.gameLog.add('🏆 悬赏「' + b.title + '」完成！获得灵石+' + b.stones, 'success');
    if (window.showMessage) window.showMessage('悬赏「' + b.title + '」完成，领得灵石+' + b.stones + '！', 'success');
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    return true;
}

// 监听 enemy:defeated：推进已接取未完成的悬赏
function _onEnemyDefeated() {
    try {
        if (!_board) return;
        var changed = false;
        _board.forEach(function (b) {
            if (b.accepted && !b.completed) {
                b.progress++;
                if (b.progress >= b.count) {
                    b.completed = true;
                    if (window.gameLog && window.gameLog.add) window.gameLog.add('🌟 悬赏「' + b.title + '」已完成，可去悬赏榜领奖！', 'success');
                }
                changed = true;
            }
        });
        if (changed && window.refreshBountyBoard) window.refreshBountyBoard();
    } catch (e) {}
}

// 每日刷新：重置未接取的悬赏（保留已接取未完成的）
function dailyBountyRefresh() {
    try {
        if (!_board) { generateBountyBoard(); return; }
        // 全部已领/无未接取 → 重新生成
        var hasActive = _board.some(function (b) { return b.accepted && !b.claimed; });
        if (!hasActive) {
            generateBountyBoard();
            if (window.gameLog && window.gameLog.add) window.gameLog.add('📜 悬赏榜已刷新，3 条新悬赏待接取。', 'info');
        }
    } catch (e) {}
}

function refreshBountyBoard() {
    var container = document.getElementById('bounty-board-list');
    if (!container) return;
    var board = getBountyBoard();
    container.innerHTML = board.map(function (b, idx) {
        var state;
        if (b.claimed) state = '<span class="text-gray-500 text-xs">已领取</span>';
        else if (b.completed) state = '<button onclick="claimBounty(' + idx + ')" class="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-3 py-1 rounded">🏆 领奖</button>';
        else if (b.accepted) state = '<span class="text-yellow-400 text-xs">进度 ' + b.progress + '/' + b.count + '</span>';
        else state = '<button onclick="acceptBounty(' + idx + ')" class="bg-yellow-600 hover:bg-yellow-500 text-gray-900 text-xs font-bold px-3 py-1 rounded">接取</button>';
        return '<div class="bg-gray-900/50 p-3 rounded border border-gray-700 mb-2">'
            + '<div class="flex justify-between items-center">'
            + '<div><span class="text-gray-200 font-bold text-sm">' + b.title + '</span> <span class="text-xs text-gray-400">· 斩' + b.count + '只</span></div>'
            + '<div>' + state + '</div>'
            + '</div>'
            + '<div class="text-xs text-gray-400 mt-1">' + b.desc + '</div>'
            + '<div class="text-xs text-yellow-500 mt-1">奖励：灵石+' + b.stones + (b.items && b.items.length ? ' +材料' : '') + ' 声望+' + Math.floor(b.count / 2) + '</div>'
            + '</div>';
    }).join('');
}

function openBountyBoard() {
    var cd = window.currentCharData;
    if (!cd) { if (window.showMessage) window.showMessage('请先创建角色进入游戏。', 'info'); return; }
    var old = document.getElementById('bounty-board-modal'); if (old) old.remove();
    var html = '<div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" id="bounty-board-modal">'
        + '<div class="bg-gray-800 border-2 border-yellow-500 rounded-xl p-6 max-w-md w-full" style="box-shadow:0 0 60px rgba(234,179,8,0.2)">'
        + '<h2 class="text-2xl font-bold text-yellow-500 mb-3">📜 江湖悬赏榜</h2>'
        + '<p class="text-xs text-gray-400 mb-3">每日刷新的讨伐悬赏，奖励灵石+材料+声望。已接取的悬赏杀敌自动累计进度。</p>'
        + '<div id="bounty-board-list" class="space-y-2"></div>'
        + '<button onclick="document.getElementById(\'bounty-board-modal\').remove()" class="mt-3 w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 rounded">关闭</button>'
        + '</div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
    refreshBountyBoard();
}

// EventBus 监听击杀推进
if (window.EventBus && typeof window.EventBus.on === 'function') {
    try { window.EventBus.on('enemy:defeated', _onEnemyDefeated); } catch (e) {}
}
// 每日刷新
if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
    window.timeSystem.onNewDaySubscribe(dailyBountyRefresh);
}

window.getBountyBoard = getBountyBoard;
window.acceptBounty = acceptBounty;
window.claimBounty = claimBounty;
window.openBountyBoard = openBountyBoard;
window.refreshBountyBoard = refreshBountyBoard;

})();
