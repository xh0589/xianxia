// ==================== fire-qte.js - v20.1 炼丹火候试炼（玩家控火 QTE） ====================
// 把炼丹火候从「技能±随机」升级为玩家可操作的控火小游戏：指针来回移动，黄区收火=极佳
// 得分写入 window._alchemyFireBonus，下次炼丹（alchemy-compound.craft）读取替代随机火候，消费即清
// 不重构既有 craft 同步流程；得分变量运行时临时，不存档（读档后需重新试火）

(function () {

var _pos = 0, _dir = 1, _timer = null, _moving = false;

function openFireQTE() {
    var cd = window.currentCharData;
    if (!cd) { if (window.showMessage) window.showMessage('请先创建角色进入游戏。', 'info'); return; }
    // v20.41 试火有价：盯火苗半炷香也是熬神——精力 5，不白试
    var energy = cd.energy != null ? cd.energy : 100;
    if (energy < 5) { if (window.showMessage) window.showMessage('精神不济，盯不住火苗——精力不足 5。', 'warning'); return; }
    cd.energy = energy - 5;
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    if (_timer) { clearInterval(_timer); _timer = null; }
    _pos = 0; _dir = 1; _moving = true;
    var old = document.getElementById('fire-qte-modal'); if (old) old.remove();
    var html = '<div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" id="fire-qte-modal">'
        + '<div class="bg-gray-800 border-2 border-orange-500 rounded-xl p-6 max-w-md w-full" style="box-shadow:0 0 60px rgba(249,115,22,0.3)">'
        + '<h2 class="text-2xl font-bold text-orange-400 mb-2">🔥 火候试炼</h2>'
        + '<p class="text-xs text-gray-400 mb-4">指针来回扫动，移入<span class="text-yellow-400">黄区</span>时按空格或点「收火」。命中黄区=火候极佳(80-100)，近黄次之，远则差。得分供<strong class="text-orange-300">下次炼丹</strong>用。<br>试火耗精力 5——盯火苗也是熬神。</p>'
        + '<div class="relative h-10 bg-gray-900 rounded mb-4 overflow-hidden border border-gray-600">'
        + '<div class="absolute top-0 bottom-0 bg-yellow-500/30 border-x border-yellow-500" style="left:40%;width:20%"></div>'
        + '<div class="absolute top-0 bottom-0 w-1 bg-orange-400" id="fire-qte-pointer" style="left:0%;box-shadow:0 0 8px rgba(249,115,22,0.8)"></div>'
        + '</div>'
        + '<button onclick="window._fireQTEShoot()" class="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded mb-2">🔥 收火（或空格）</button>'
        + '<button onclick="window.closeFireQTE()" class="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 rounded text-sm">取消</button>'
        + '<p class="text-xs text-gray-500 mt-2 text-center" id="fire-qte-result">尚未收火</p>'
        + '</div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
    _timer = setInterval(function () {
        if (!_moving) return;
        _pos += _dir * 2.2;
        if (_pos >= 100) { _pos = 100; _dir = -1; }
        if (_pos <= 0) { _pos = 0; _dir = 1; }
        var p = document.getElementById('fire-qte-pointer');
        if (p) p.style.left = _pos + '%';
    }, 30);
}

function _shoot() {
    if (!_moving) return;
    if (window.playSfx) window.playSfx('fire');
    _moving = false;
    if (_timer) { clearInterval(_timer); _timer = null; }
    // 黄区(40-60)=80-100，近黄(25-39/61-75)=50-79，远=0-49
    var score;
    if (_pos >= 40 && _pos <= 60) score = 80 + Math.round((1 - Math.abs(_pos - 50) / 10) * 20);
    else if (_pos >= 25 && _pos <= 75) score = 50 + Math.round((1 - Math.abs(_pos - 50) / 25) * 30);
    else score = Math.round(50 - Math.abs(_pos - 50) / 50 * 50);
    score = Math.max(0, Math.min(100, score));
    window._alchemyFireBonus = score;
    var grade = score >= 80 ? '极佳🔥' : score >= 50 ? '尚可' : score >= 30 ? '勉强' : '失手';
    var r = document.getElementById('fire-qte-result');
    if (r) r.textContent = '火候得分 ' + score + '（' + grade + '）— 下次炼丹生效';
    if (window.gameLog && window.gameLog.add) window.gameLog.add('🔥 火候试炼得分 ' + score + '（' + grade + '），下次炼丹生效', 'info');
    // 2.5 秒后自动关闭
    setTimeout(function () { var m = document.getElementById('fire-qte-modal'); if (m) m.remove(); }, 2500);
}

function closeFireQTE() {
    if (_timer) { clearInterval(_timer); _timer = null; }
    _moving = false;
    var m = document.getElementById('fire-qte-modal'); if (m) m.remove();
}

// 空格收火（仅 QTE 面板可见且非战斗时）
document.addEventListener('keydown', function (e) {
    if (document.getElementById('fire-qte-modal') && (e.key === ' ' || e.code === 'Space') && !window.currentBattle) {
        var t = e.target;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
        e.preventDefault();
        if (window._fireQTEShoot) window._fireQTEShoot();
    }
});

window.openFireQTE = openFireQTE;
window._fireQTEShoot = _shoot;
window.closeFireQTE = closeFireQTE;

})();
