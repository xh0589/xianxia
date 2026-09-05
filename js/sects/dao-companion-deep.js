// ==================== dao-companion-deep.js - 道侣深度互动 ====================
// 心情需求、主动互动、专属剧情
// 依赖：sects-system.js

function updateDaoCompanionDeep() {
    var bonds = window.currentCharData?.bonds || {};
    for (var npcId in bonds) {
        var bond = bonds[npcId];
        if (bond.type === 'dao_companion') {
            var npc = window.npcManager?.getNPC(npcId);
            if (!npc) continue;
            if (!npc._companionData) npc._companionData = { lastInteraction: 0, mood: 70, needs: { talk: 0, accompany: 0, gift: 0 } };
            // v20.24 修计时：此前 window.gameTime 不存在、lastInteraction 恒 0，孤单提醒永不发。
            // 计时基准：结契之日（bond.day）与最近相见之日（赴约等写入的 lastMetDay/lastInteraction）取较近者。
            var todayN = 0;
            try {
                if (typeof window.getAbsoluteDay === 'function') todayN = Number(window.getAbsoluteDay()) || 0;
                else if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') todayN = Number(window.timeSystem.getAbsoluteDay()) || 0;
            } catch (e) {}
            var lastSeen = Math.max(Number(npc._companionData.lastInteraction) || 0, Number(bond.lastMetDay) || 0, Number(bond.day) || 0);
            var daysSince = (todayN && lastSeen) ? (todayN - lastSeen) : 0;
            if (!npc._companionData.lastInteraction && bond.day) npc._companionData.lastInteraction = bond.day;
            if (daysSince > 3 && Math.random() < 0.2) {
                if (window.showMessage) window.showMessage('💕 你的道侣' + npc.name + '想和你一起散步。', 'info');
                npc._companionData.needs.accompany += 10;
            }
            if (daysSince > 5 && Math.random() < 0.3) {
                if (window.showMessage) window.showMessage('💕 ' + npc.name + '感到有些孤单，希望你能陪陪TA。', 'info');
            }
        }
    }
}

if (window.EventBus && typeof window.EventBus.on === 'function') {
    window.EventBus.on('newDay', function() { updateDaoCompanionDeep(); });
}

// ============ v20.25 道侣面板：双修终于有了入口 ============
// 背景：双修是 bond 位分/情分唯一的增长路径，而它此前全游戏零调用——
// 位分永卡 1 档，子嗣（需位分≥2）、高阶合击、情缘成就整片跟着卡死。
// 入口补在境界卡工具条（弟子按钮旁），点开的就是这张名册。
function openDaoCompanionPanel() {
    var old = document.getElementById('dao-companion-panel-modal');
    if (old) old.remove();
    var cd = window.currentCharData;
    if (!cd) { if (window.showMessage) window.showMessage('先进游戏再说这些。', 'info'); return; }
    var bonds = cd.bonds || {};
    var rows = [];
    for (var id in bonds) {
        var b = bonds[id];
        if (!b || b.type !== 'dao_companion') continue;
        var npc = window.npcManager && window.npcManager.getNPC ? window.npcManager.getNPC(id) : null;
        var aff = npc && npc.relationship ? (npc.relationship.affection || 0) : 0;
        var love = npc && npc.relationship ? (Number(npc.relationship.love) || 0) : 0;
        rows.push({ id: id, name: (npc && npc.name) || b.name || id, aff: aff, love: love, level: Number(b.level) || 1, heart: Number(b.bondHeart) || 0 });
    }
    var listHtml;
    if (!rows.length) {
        listHtml = '<p class="text-gray-500 text-sm text-center py-4">名册上还没有道侣。<br>八段情缘走到定情的终章，或在深谈里结契，名字就会落在这本册子上。</p>';
    } else {
        listHtml = rows.map(function (r) {
            var next = r.level < 2 ? '攒满 10 分情分且情投意合（好感≥80）升二档——首胎灵胎需二档起。' : (r.level < 3 ? '攒满 10 分情分且情投意合可升下一档。' : '位分已高，合击诸艺皆通。');
            return '<div class="bg-gray-900/50 p-3 rounded border border-gray-700 mb-2">'
                + '<div class="flex justify-between items-center">'
                + '<div><span class="text-rose-300 font-bold">' + r.name + '</span> <span class="text-xs text-pink-400">位分 ' + r.level + ' 档</span></div>'
                + '<div class="text-xs text-gray-400">好感 ' + r.aff + ' | 深情 ' + r.love + ' | 情分 ' + r.heart + '/10</div>'
                + '</div>'
                + '<div class="mt-2">'
                + '<button onclick="window.dualCultivate && window.dualCultivate(\'' + r.id + '\'); window.openDaoCompanionPanel && window.openDaoCompanionPanel();" class="bg-pink-700 hover:bg-pink-600 text-white text-xs font-bold px-3 py-1 rounded mr-2">💞 双修（精力20，时辰60' + (r.love >= 50 ? '·深情共鸣×1.5' : '') + '）</button>'
                + '<button onclick="window.daoDateAccept && window.daoDateAccept({npcId:\'' + r.id + '\'}); window.openDaoCompanionPanel && window.openDaoCompanionPanel();" class="bg-rose-900 hover:bg-rose-800 text-gray-200 text-xs px-3 py-1 rounded">🛶 相伴半日（耗时半日，好感+5·信任+1）</button>'
                + '</div>'
                + '<p class="text-[10px] text-gray-500 mt-1">' + next + '</p>'
                + '</div>';
        }).join('');
    }
    var html = '<div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" id="dao-companion-panel-modal">'
        + '<div class="bg-gray-800 border-2 border-rose-600 rounded-xl p-6 max-w-md w-full"'
        + ' style="box-shadow:0 0 60px rgba(225,29,72,0.2)">'
        + '<h2 class="text-2xl font-bold text-rose-400 mb-4">💞 道侣名册</h2>'
        + '<p class="text-xs text-gray-400 mb-3">双修阴阳相济：得经验、聚真元、涨好感；日久生情攒下情分，攒满升位分——子嗣、合击、护法诸艺都看位分。占时辰，不白点。</p>'
        + listHtml
        + '<button onclick="document.getElementById(\'dao-companion-panel-modal\').remove()" class="mt-3 w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 rounded">关闭</button>'
        + '</div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
}

if (typeof window !== 'undefined') {
    window.updateDaoCompanionDeep = updateDaoCompanionDeep;
    window.openDaoCompanionPanel = openDaoCompanionPanel;
}