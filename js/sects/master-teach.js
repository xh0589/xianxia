// ==================== master-teach.js - v20.1 弟子培养体系（阶段 → 出师 → 反哺） ====================
// 对标鬼谷八荒：弟子有培养阶段（入门→小成→大成→出师），传功推进，大成+好感+玩家境界达标可出师
// 出师弟子一次性反哺师门 + 每日持续反哺（灵石/声望），形成传承闭环
// 复用 PlayerSect.disciples、NPC._cultivationProgress（1.4 演化字段）/affection、npcManager.serialize 持久化、onNewDaySubscribe

(function () {

// 培养阶段阈值（按 _cultivationProgress 划分）
var STAGES = [
    { name: '入门', threshold: 0 },
    { name: '小成', threshold: 20 },
    { name: '大成', threshold: 40 },
    { name: '圆满意（可出师）', threshold: 60 }
];
var GRAD_AFFECTION = 60;   // 出师需好感
var GRAD_PLAYER_TIER = 3;  // 出师需玩家金丹期+
var TEACH_COST = 30;       // 传功灵石成本
var DAILY_STONE_PER_GRAD = 2;  // 每日出师弟子反哺灵石
var DAILY_FAME_PER_GRAD = 0.5; // 每日出师弟子反哺声望

function _getDiscipleIds() {
    try {
        if (!window.PlayerSect || typeof window.PlayerSect.listMySects !== 'function') return [];
        var mine = window.PlayerSect.listMySects() || [];
        if (!mine.length || !mine[0].disciples) return [];
        return mine[0].disciples.map(function (d) { return d.npcId; }).filter(Boolean);
    } catch (e) { return []; }
}

function _stageIndex(npc) {
    var p = Number(npc._cultivationProgress) || 0;
    var idx = 0;
    for (var i = STAGES.length - 1; i >= 0; i--) {
        if (p >= STAGES[i].threshold) { idx = i; break; }
    }
    return idx;
}

function _stageName(npc) { return STAGES[_stageIndex(npc)].name; }

function _playerTier() {
    try {
        var cd = window.currentCharData;
        if (!cd) return 0;
        return (typeof window.getRealmTier === 'function') ? window.getRealmTier(cd.realm) : 0;
    } catch (e) { return 0; }
}

function _canGraduate(npc) {
    if (!npc || npc._graduated) return false;
    if (_stageIndex(npc) < 2) return false; // 需大成（idx>=2）
    if ((Number(npc.affection) || 0) < GRAD_AFFECTION) return false;
    if (_playerTier() < GRAD_PLAYER_TIER) return false;
    return true;
}

// 传功：推进弟子修炼进度 + 好感 + 玩家声望 + 阶段突破提示
function teachDisciple(npcId) {
    var cd = window.currentCharData;
    if (!cd) { if (window.showMessage) window.showMessage('请先创建角色', 'warning'); return false; }
    var npc = window.npcManager && window.npcManager.getNPC(npcId);
    if (!npc) { if (window.showMessage) window.showMessage('查无此弟子。', 'warning'); return false; }
    if (npc._graduated) { if (window.showMessage) window.showMessage(npc.name + '已出师，无需再传功。', 'info'); return false; }
    if (window.DataManager && window.DataManager.deductSpiritStones && !window.DataManager.deductSpiritStones(TEACH_COST)) {
        if (window.showMessage) window.showMessage('传功需 ' + TEACH_COST + ' 灵石布置。', 'warning');
        return false;
    }
    var oldStage = _stageIndex(npc);
    npc._cultivationProgress = (Number(npc._cultivationProgress) || 0) + 5;
    if (typeof npc.changeAffection === 'function') npc.changeAffection(5);
    cd.fame = Math.min(100, (cd.fame || 0) + 3);
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(60, '传功弟子');
    }
    var newStage = _stageIndex(npc);
    var msg = '📖 你为' + npc.name + '传功讲道，感悟+5，好感+5，你声望+3。';
    if (newStage > oldStage) {
        msg += '\n✨ ' + npc.name + ' 培养突破至「' + STAGES[newStage].name + '」！';
    }
    if (_canGraduate(npc)) {
        msg += '\n🌟 ' + npc.name + ' 已可出师（大成+好感足+你金丹+），可为其举行出师礼。';
    }
    if (window.showMessage) window.showMessage(msg, 'success');
    if (window.gameLog && window.gameLog.add) window.gameLog.add('📖 传功' + npc.name + '，阶段：' + _stageName(npc), 'info');
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    return true;
}

function teachFirstDisciple() {
    var ids = _getDiscipleIds();
    if (!ids.length) { if (window.showMessage) window.showMessage('你尚无弟子可传功。先招募弟子或建宗收徒。', 'warning'); return false; }
    return teachDisciple(ids[0]);
}

// 出师礼：一次性反哺师门 + 标记 _graduated
function tryGraduateDisciple(npcId) {
    var cd = window.currentCharData;
    if (!cd) { if (window.showMessage) window.showMessage('请先创建角色', 'warning'); return false; }
    var npc = window.npcManager && window.npcManager.getNPC(npcId);
    if (!npc) { if (window.showMessage) window.showMessage('查无此弟子。', 'warning'); return false; }
    if (npc._graduated) { if (window.showMessage) window.showMessage(npc.name + '已出师。', 'info'); return false; }
    if (!_canGraduate(npc)) {
        var need = [];
        if (_stageIndex(npc) < 2) need.push('培养至大成');
        if ((Number(npc.affection) || 0) < GRAD_AFFECTION) need.push('好感≥' + GRAD_AFFECTION);
        if (_playerTier() < GRAD_PLAYER_TIER) need.push('你达金丹期');
        if (window.showMessage) window.showMessage('出师条件未满：' + need.join('、') + '。', 'warning');
        return false;
    }
    npc._graduated = true;
    // 一次性反哺：灵石+声望+真元
    var stone = 200, fame = 10, ess = 50;
    if (window.DataManager && typeof window.DataManager.addSpiritStones === 'function') window.DataManager.addSpiritStones(stone);
    else cd.spiritStones = (cd.spiritStones || 0) + stone;
    cd.fame = Math.min(100, (cd.fame || 0) + fame);
    cd.essence = (cd.essence || 0) + ess;
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(120, '出师礼');
    }
    if (window.gameLog && window.gameLog.add) {
        window.gameLog.add('🎓 ' + npc.name + ' 学成出师！反哺师门：灵石+' + stone + ' 声望+' + fame + ' 真元+' + ess + '。此后每日持续反哺。', 'success');
    }
    if (window.showMessage) window.showMessage('🎓 ' + npc.name + ' 学成出师，反哺师门！此后每日为你供奉灵石与声望。', 'success');
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    return true;
}

// 每日反哺：出师弟子持续回馈师门
function dailyGraduatedFeedback() {
    try {
        var cd = window.currentCharData;
        if (!cd) return;
        var ids = _getDiscipleIds();
        if (!ids.length) return;
        var gradCount = 0;
        ids.forEach(function (nid) {
            var npc = window.npcManager && window.npcManager.getNPC(nid);
            if (npc && npc._graduated) gradCount++;
        });
        if (gradCount <= 0) return;
        var stones = gradCount * DAILY_STONE_PER_GRAD;
        var fame = gradCount * DAILY_FAME_PER_GRAD;
        if (window.DataManager && typeof window.DataManager.addSpiritStones === 'function') window.DataManager.addSpiritStones(stones);
        else cd.spiritStones = (cd.spiritStones || 0) + stones;
        cd.fame = Math.min(100, (cd.fame || 0) + fame);
        if (window.gameLog && window.gameLog.add) {
            window.gameLog.add('🎓 ' + gradCount + '名出师弟子反哺：灵石+' + stones + ' 声望+' + Math.round(fame * 10) / 10, 'info');
        }
    } catch (e) {}
}

// 弟子花名册（供 UI）
function getDiscipleRoster() {
    var ids = _getDiscipleIds();
    return ids.map(function (nid) {
        var npc = window.npcManager && window.npcManager.getNPC(nid);
        if (!npc) return null;
        return {
            npcId: nid,
            name: npc.name,
            stage: _stageName(npc),
            stageIdx: _stageIndex(npc),
            progress: Number(npc._cultivationProgress) || 0,
            affection: Number(npc.affection) || 0,
            graduated: !!npc._graduated,
            canGraduate: _canGraduate(npc)
        };
    }).filter(Boolean);
}

// 弟子培养面板
function openDisciplePanel() {
    var cd = window.currentCharData;
    if (!cd) { if (window.showMessage) window.showMessage('请先创建角色进入游戏。', 'info'); return; }
    var roster = getDiscipleRoster();
    var old = document.getElementById('disciple-panel-modal');
    if (old) old.remove();
    var listHtml;
    if (!roster.length) {
        listHtml = '<p class="text-gray-500 text-sm text-center py-4">你尚无弟子。先建立宗门或招收弟子。</p>';
    } else {
        listHtml = roster.map(function (d) {
            var btns = '';
            if (d.graduated) {
                btns = '<span class="text-green-400 text-xs">✅ 已出师·每日反哺</span>';
            } else {
                btns = '<button onclick="teachDisciple(\'' + d.npcId + '\'); window.openDisciplePanel();" class="bg-yellow-600 hover:bg-yellow-500 text-gray-900 text-xs font-bold px-3 py-1 rounded mr-2">📖 传功(30灵石)</button>';
                if (d.canGraduate) {
                    btns += '<button onclick="tryGraduateDisciple(\'' + d.npcId + '\'); window.openDisciplePanel();" class="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-3 py-1 rounded">🎓 出师</button>';
                }
            }
            return '<div class="bg-gray-900/50 p-3 rounded border border-gray-700 mb-2">'
                + '<div class="flex justify-between items-center">'
                + '<div><span class="text-gray-200 font-bold">' + d.name + '</span> <span class="text-xs text-yellow-400">[' + d.stage + ']</span></div>'
                + '<div class="text-xs text-gray-400">感悟' + d.progress + ' | 好感' + d.affection + '</div>'
                + '</div>'
                + '<div class="mt-2">' + btns + '</div>'
                + '</div>';
        }).join('');
    }
    var html = '<div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" id="disciple-panel-modal">'
        + '<div class="bg-gray-800 border-2 border-yellow-500 rounded-xl p-6 max-w-md w-full"'
        + ' style="box-shadow:0 0 60px rgba(234,179,8,0.2)">'
        + '<h2 class="text-2xl font-bold text-yellow-500 mb-4">🧑‍🎓 弟子培养</h2>'
        + '<p class="text-xs text-gray-400 mb-3">传功推进阶段（入门→小成→大成→圆满）。大成+好感≥60+你金丹期 可出师，出师弟子每日反哺灵石声望。</p>'
        + listHtml
        + '<button onclick="document.getElementById(\'disciple-panel-modal\').remove()" class="mt-3 w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 rounded">关闭</button>'
        + '</div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
}

if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
    window.timeSystem.onNewDaySubscribe(dailyGraduatedFeedback);
}

window.teachDisciple = teachDisciple;
window.teachFirstDisciple = teachFirstDisciple;
window.tryGraduateDisciple = tryGraduateDisciple;
window.getDiscipleRoster = getDiscipleRoster;
window.openDisciplePanel = openDisciplePanel;

})();
