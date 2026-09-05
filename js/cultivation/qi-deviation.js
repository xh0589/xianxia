// ==================== qi-deviation.js - v20.0 2.1 走火入魔状态 ====================
// 修炼过度（真气低时修炼）/丹毒高/心魔失控→气机紊乱，紊乱高→走火入魔（减属性）
// 独立于心魔系统。依赖：0.2.3 心魔、1.9 丹毒
//
// v20.39 做深：紊乱只进不出是假伤——补「化解三途」（静坐压制/顺势化解/道侣护法），
// 紊乱≥95 锁死突破；面板露出见 cultivation.js。化解皆占时辰——账上无白走的路。

(function () {

function getQD() {
    var cd = window.currentCharData;
    if (!cd) return 0;
    if (cd._qiDeviation == null) cd._qiDeviation = 0;
    return cd._qiDeviation;
}

function addQiDeviation(amount) {
    var cd = window.currentCharData;
    if (!cd) return;
    var before = cd._qiDeviation || 0;
    cd._qiDeviation = Math.max(0, Math.min(100, before + (amount || 0)));
    // v20.39 分级提醒：60 紊乱成形、80 走火入魔、95 紊乱已极
    if (before < 60 && cd._qiDeviation >= 60) {
        if (window.showMessage) window.showMessage('🌀 气机紊乱成形（紊乱 ' + Math.round(cd._qiDeviation) + '）——经脉里像进了别人的真气。宜早化解，拖久成患。', 'warning');
    }
    if (before < 80 && cd._qiDeviation >= 80) {
        if (window.showMessage) window.showMessage('⚠️ 气机紊乱失控，你已走火入魔！属性大损（-10%），亟需静心化解。', 'error');
    }
    if (before < 95 && cd._qiDeviation >= 95) {
        if (window.showMessage) window.showMessage('🩸 紊乱已极（' + Math.round(cd._qiDeviation) + '）——真气逆行欲裂，突破之路已然锁死，先化解，再谈精进！', 'error');
    }
}

// 走火入魔对全属性惩罚倍率（紊乱>=80 → -10%，>=95 → -20%）
function getQiDeviationPenalty() {
    var qd = getQD();
    if (qd >= 95) return 0.2;
    if (qd >= 80) return 0.1;
    return 0;
}

// v20.39 突破锁：紊乱>=95 时返回拦截文案（由 performBreakthrough 包装处读取）
function getQiDeviationBlocked() {
    var qd = getQD();
    if (qd >= 95) return '🩸 紊乱已极（' + Math.round(qd) + '），真气逆行——此刻突破，必遭大劫。先化解紊乱。';
    return null;
}

// 静心化解（旧 API 保留）
function calmQiDeviation(amount) {
    var cd = window.currentCharData;
    if (!cd) return 0;
    var before = cd._qiDeviation || 0;
    cd._qiDeviation = Math.max(0, before - (amount || 20));
    return before - cd._qiDeviation;
}

// ============ v20.39 化解三途 ============
// 静坐压制：稳，-20，半日。顺势化解：深，-40，一整日。道侣护法：需道侣，-30，半日，护你之人情分+2。
function calmQiChoice() {
    var cd = window.currentCharData;
    if (!cd) return false;
    var qd = getQD();
    if (qd <= 0) { if (window.showMessage) window.showMessage('气机平顺，无乱可化。', 'info'); return false; }
    if (typeof window.showModal !== 'function') { // 无弹窗环境兜底：直接静坐压制
        calmQiDeviation(20);
        if (window.showMessage) window.showMessage('你盘膝静坐，理顺经脉。（紊乱-20）', 'success');
        return true;
    }
    var btn = 'class="bg-red-800 hover:bg-red-700 text-red-100 text-xs px-3 py-2 rounded text-left w-full"';
    window.showModal('🌀 化解紊乱（当前 ' + Math.round(qd) + '）',
        '<p class="text-xs text-gray-400 mb-3">化解皆占时辰——真气欠下的账，得拿日子还。</p>'
        + '<div style="display:flex;flex-direction:column;gap:8px">'
        + '<button onclick="window._calmByMeditation(); this.closest(\'#xianxia-modal-overlay\').remove();" ' + btn + '>🧘 静坐压制——半日，紊乱-20（稳，不假外求）</button>'
        + '<button onclick="window._calmByYield(); this.closest(\'#xianxia-modal-overlay\').remove();" ' + btn + '>🌊 顺势化解——一整日，紊乱-40（引逆气归海，化得深）</button>'
        + '<button onclick="window._calmByGuard(); this.closest(\'#xianxia-modal-overlay\').remove();" ' + btn + '>💞 道侣护法——半日，紊乱-30（需有道侣；护你之人，情分+2）</button>'
        + '</div>');
    return true;
}

function _advance(mins, label) {
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(mins, label);
    }
}

function calmByMeditation() {
    if (getQD() <= 0) { if (window.showMessage) window.showMessage('气机平顺，无乱可化。', 'info'); return false; }
    var got = calmQiDeviation(20);
    _advance(30, '静坐化解紊乱');
    if (window.showMessage) window.showMessage('🧘 你盘膝静坐，意守丹田，一缕一缕理顺逆行的真气。（紊乱-' + Math.round(got) + '，耗时半日）', 'success');
    return true;
}

function calmByYield() {
    if (getQD() <= 0) { if (window.showMessage) window.showMessage('气机平顺，无乱可化。', 'info'); return false; }
    var got = calmQiDeviation(40);
    _advance(60, '顺势化解紊乱');
    if (window.showMessage) window.showMessage('🌊 你不与逆气相抗，引它顺着经脉归入气海——如导洪流入渠。（紊乱-' + Math.round(got) + '，耗时一整日）', 'success');
    return true;
}

function calmByGuard() {
    if (getQD() <= 0) { if (window.showMessage) window.showMessage('气机平顺，无乱可化。', 'info'); return false; }
    var cd = window.currentCharData;
    var bonds = (cd && cd.bonds) || {};
    var best = null;
    for (var k in bonds) {
        if (!bonds[k] || bonds[k].type !== 'dao_companion') continue;
        var npc = window.npcManager && window.npcManager.getNPC ? window.npcManager.getNPC(k) : null;
        if (!npc) continue;
        var aff = (npc.relationship && npc.relationship.affection) || 0;
        if (!best || aff > best.aff) best = { npc: npc, aff: aff };
    }
    if (!best) { if (window.showMessage) window.showMessage('你尚无道侣——这一途，走不得。', 'warning'); return false; }
    var got = calmQiDeviation(30);
    if (typeof best.npc.changeAffection === 'function') best.npc.changeAffection(2);
    _advance(30, '道侣护法化解紊乱');
    if (window.showMessage) window.showMessage('💞 ' + best.npc.name + '坐在你身后，掌心贴着你大椎，真气缓缓渡入——逆气一寸一寸顺了回去。（紊乱-' + Math.round(got) + '，' + best.npc.name + '情分+2，耗时半日）', 'success');
    return true;
}

// v20.39 突破锁的闸口在唯一突破路由里（breakthrough-ritual.js 的 performBreakthrough
// 读 getQiDeviationBlocked）——不在本文件包装，避免双写 performBreakthrough。

window.getQiDeviation = getQD;
window.addQiDeviation = addQiDeviation;
window.getQiDeviationPenalty = getQiDeviationPenalty;
window.getQiDeviationBlocked = getQiDeviationBlocked;
window.calmQiDeviation = calmQiDeviation;
window.calmQiChoice = calmQiChoice;
window._calmByMeditation = calmByMeditation;
window._calmByYield = calmByYield;
window._calmByGuard = calmByGuard;

})();
