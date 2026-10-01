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

var _board = null; // [{id,title,desc,count,stones,items,progress,accepted,completed,claimed,rival,rivalProgress,snatched}]

// v25.5 抢单竞争（第一百四十七批 · 玩法立项批）：旧榜每日整版重刷、悬赏永远等着你——
// 「手慢无」只是说说。现在未接取的榜上有真对手：每日按各自脚程推进猎杀，猎完就把单子抢走；
// 已接取的照旧归你（先来后到，接了对手就撤）。被抢/已领的空位随每日刷新补新单。
var RIVAL_NAMES = ['铁面客', '独臂刀娘', '赏金猎户', '青衣剑奴', '夜枭', '独行客'];
var _uidSeq = 0;

function _today() {
    try {
        if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') {
            return window.timeSystem.getAbsoluteDay();
        }
    } catch (e) {}
    return 0;
}

// v21.9 悬赏奖励随境界走：此前写死 200-1200 灵石——渡劫修士杀 20 只敌人换 1200 灵石是打发叫花子。
// 倍率表与真元收益同口径（炼气×1 → 渡劫×256），按开榜时的境界定档，接取后不随突破变。
var _BOUNTY_REALM_MUL = [1, 1, 2, 4, 8, 16, 32, 64, 128, 256];
function bountyRealmMul() {
    try {
        if (typeof window.getRealmTier === 'function' && window.currentCharData) {
            var tier = window.getRealmTier(window.currentCharData.realm);
            if (typeof tier === 'number' && tier >= 0) return _BOUNTY_REALM_MUL[Math.min(9, tier)] || 1;
        }
    } catch (e) {}
    return 1;
}
window.bountyRealmMul = bountyRealmMul;

// 随机抽 3 个不同模板生成悬赏榜
function _generateOne(excludeBaseIds) {
    var mul = bountyRealmMul();
    var pool = BOUNTY_TEMPLATES.filter(function (t) { return !excludeBaseIds || excludeBaseIds.indexOf(t.id) < 0; });
    if (!pool.length) pool = BOUNTY_TEMPLATES.slice();
    var t = pool[Math.floor(Math.random() * pool.length)];
    _uidSeq += 1;
    return {
        id: t.id + '_' + _today() + '_' + _uidSeq, // 每日唯一（补位单同模板同日也不撞号）
        tplId: t.id,
        title: t.title,
        desc: t.desc + (mul > 1 ? '（高阶悬赏，赏金随境界上浮）' : ''),
        count: t.count,
        stones: t.stones * mul,
        items: t.items,
        progress: 0,
        accepted: false,
        completed: false,
        claimed: false,
        // 竞争对手：脚程 25%~70%/日——快刀客两三日内就能把单抢走
        rival: { name: RIVAL_NAMES[Math.floor(Math.random() * RIVAL_NAMES.length)], rate: 0.25 + Math.random() * 0.45 },
        rivalProgress: 0,
        snatched: false
    };
}

function generateBountyBoard() {
    var picked = [];
    var used = [];
    for (var i = 0; i < 3; i++) {
        var b = _generateOne(used);
        used.push(b.tplId);
        picked.push(b);
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
    // v25.5 抢单：对手已经猎完的单，接不了——手慢无
    if (b.snatched) {
        if (window.showMessage) window.showMessage('手慢无——「' + ((b.rival && b.rival.name) || '同行') + '」已把「' + b.title + '」抢了先。', 'warning');
        return false;
    }
    b.accepted = true;
    if (window.gameLog && window.gameLog.add) window.gameLog.add('📜 接取悬赏「' + b.title + '」：' + b.desc + '（已接的单对手即撤——先来后到）', 'info');
    if (window.showMessage) window.showMessage('已接取悬赏「' + b.title + '」。', 'success');
    // 第九十五波·NEW-05：接取成功即重绘榜单——旧版不重绘，按钮仍显示「接取」、
    // 已接的两条也不见「进度 0/N」，玩家只能关掉重开悬赏榜才看得清
    try { refreshBountyBoard(); } catch (e) {}
    return true;
}

function claimBounty(idx) {
    var b = getBountyBoard()[idx];
    if (!b || !b.completed || b.claimed) {
        if (window.showMessage) window.showMessage('该悬赏未完成或已领取。', 'info');
        return false;
    }
    var cd = window.currentCharData;
    var gotItems = [];
    var missed = 0;
    if (cd) {
        if (window.DataManager && typeof window.DataManager.addSpiritStones === 'function') window.DataManager.addSpiritStones(b.stones);
        else cd.spiritStones = (cd.spiritStones || 0) + b.stones;
        cd.fame = Math.min((window.FAME_CAP || 99999), (cd.fame || 0) + Math.floor(b.count / 2));
        if (b.items && typeof window.addResultItem === 'function') {
            b.items.forEach(function (it) {
                try {
                    // DES-72 同族：addResultItem 报的是实收件数，旧写法整个丢在地上
                    var got = Number(window.addResultItem(it.itemId, it.count)) || 0;
                    if (got > 0) {
                        var nm = (window.itemById && window.itemById[it.itemId] && window.itemById[it.itemId].name) || it.itemId;
                        gotItems.push(nm + '×' + got);
                    }
                    if (got < it.count) missed += (it.count - got);
                } catch (e) {}
            });
        }
    }
    // DES-90（第一百三十九批）：账上没落笔时不许由站点断言满包（悬赏材料属机构交付，用③形，括号内不带句号）
    var itemTxt = (gotItems.length ? '，材料 ' + gotItems.join('、') : '') + (missed > 0 ? '（另 ' + missed + ' 件：' + ((typeof window.addItemReasonPhrase === 'function' && window.addItemReasonPhrase('悬赏的材料')) || '这一件没能交到你手上') + '）' : '');
    b.claimed = true;
    if (window.gameLog && window.gameLog.add) window.gameLog.add('🏆 悬赏「' + b.title + '」完成！获得灵石+' + b.stones + itemTxt, 'success');
    if (window.showMessage) window.showMessage('悬赏「' + b.title + '」完成，领得灵石+' + b.stones + '！' + itemTxt, 'success');
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

// 每日刷新（v25.5 改版）：对手先推进——未接取的悬赏每日被竞争者按脚程猎杀，猎完即被抢走；
// 已领取/被抢的摘榜，空位补新单；已接取的照旧保留（接了对手就撤，无时限）
function dailyBountyRefresh() {
    try {
        if (!_board) { generateBountyBoard(); return; }
        _board.forEach(function (b) {
            if (b.accepted || b.claimed || b.snatched || !b.rival) return;
            b.rivalProgress = (b.rivalProgress || 0) + Math.max(1, Math.ceil(b.rival.rate * b.count));
            if (b.rivalProgress >= b.count) {
                b.snatched = true;
                if (window.gameLog && window.gameLog.add) window.gameLog.add('⚡ 悬赏「' + b.title + '」被「' + b.rival.name + '」抢先猎完——手慢无。', 'warning');
            }
        });
        _board = _board.filter(function (b) { return !b.claimed && !b.snatched; });
        var used = _board.map(function (b) { return b.tplId; }).filter(Boolean);
        while (_board.length < 3) {
            var nb = _generateOne(used);
            used.push(nb.tplId);
            _board.push(nb);
        }
        if (window.gameLog && window.gameLog.add) window.gameLog.add('📜 悬赏榜已刷新——榜上的单不止你盯着，脚程慢的会被抢。', 'info');
        if (window.refreshBountyBoard) window.refreshBountyBoard();
    } catch (e) {}
}

function refreshBountyBoard() {
    var container = document.getElementById('bounty-board-list');
    if (!container) return;
    var board = getBountyBoard();
    container.innerHTML = board.map(function (b, idx) {
        var state;
        if (b.claimed) state = '<span class="text-gray-500 text-xs">已领取</span>';
        else if (b.snatched) state = '<span class="text-red-400 text-xs">被「' + ((b.rival && b.rival.name) || '同行') + '」抢了</span>';
        else if (b.completed) state = '<button onclick="claimBounty(' + idx + ')" class="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-3 py-1 rounded">🏆 领奖</button>';
        else if (b.accepted) state = '<span class="text-yellow-400 text-xs">进度 ' + b.progress + '/' + b.count + '</span>';
        else state = '<button onclick="acceptBounty(' + idx + ')" class="bg-yellow-600 hover:bg-yellow-500 text-gray-900 text-xs font-bold px-3 py-1 rounded">接取</button>';
        // v25.5 抢单竞争：未接取的单亮出对手脚程——看着它一天天逼近，接不接自己掂量
        var rivalTxt = (!b.accepted && !b.claimed && !b.snatched && b.rival)
            ? '<div class="text-xs text-red-300/80 mt-1">⚔️ 「' + b.rival.name + '」也在猎这单，已斩 ' + Math.min(b.count - 1, b.rivalProgress || 0) + '/' + b.count + '——手慢无</div>'
            : '';
        return '<div class="bg-gray-900/50 p-3 rounded border border-gray-700 mb-2">'
            + '<div class="flex justify-between items-center">'
            + '<div><span class="text-gray-200 font-bold text-sm">' + b.title + '</span> <span class="text-xs text-gray-400">· 斩' + b.count + '只</span></div>'
            + '<div>' + state + '</div>'
            + '</div>'
            + '<div class="text-xs text-gray-400 mt-1">' + b.desc + '</div>'
            + '<div class="text-xs text-yellow-500 mt-1">奖励：灵石+' + b.stones + (b.items && b.items.length ? ' +材料' : '') + ' 声望+' + Math.floor(b.count / 2) + '</div>'
            + rivalTxt
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
        + '<p class="text-xs text-gray-400 mb-3">讨伐悬赏，奖励灵石+材料+声望。已接取的悬赏杀敌自动累计进度。榜上的单不止你盯着——对手每日都在猎，猎完就被抢走；接了的单对手即撤。</p>'
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
