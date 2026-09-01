// ==================== npc-daily-life.js - NPC日程可见性 ====================
// 地图上显示NPC路径+状态、NPC之间互动
// 依赖：npcs/npc-system.js (NPCManager, NPC)
// 加载顺序：在 npc-system.js 之后

// ============ NPC状态描述 ============
function getNPCActivityDescription(npc) {
    if (!npc) return '';
    var activity = npc.state?.currentActivity || '空闲';
    var location = npc.state?.location || npc.location || '未知';
    var mood = npc.state?.mood || 50;
    var moodStr = mood > 70 ? '心情不错' : (mood < 30 ? '情绪低落' : '平静');
    return npc.name + '（' + moodStr + '）在' + location + '【' + activity + '】';
}

// ============ 获取附近NPC列表 ============
function getNearbyNPCsDescription(currentLocation) {
    if (!window.npcManager) return [];
    var all = window.npcManager.getAllNPCs() || [];
    return all.filter(function(n) {
        return n.location === currentLocation || n.state?.location === currentLocation;
    });
}

// ============ NPC之间互动检测 ============
var npcMeetingLog = {};

function checkNPCMeetings() {
    if (!window.npcManager) return;
    var npcs = window.npcManager.getAllNPCs() || [];
    // 按地点分组
    var byLocation = {};
    for (var i = 0; i < npcs.length; i++) {
        var loc = npcs[i].state?.location || npcs[i].location || 'unknown';
        if (!byLocation[loc]) byLocation[loc] = [];
        byLocation[loc].push(npcs[i]);
    }
    // 检查同一地点是否有多个NPC
    for (var loc in byLocation) {
        var group = byLocation[loc];
        if (group.length >= 2) {
            var pairKey = group[0].id + '_' + group[1].id;
            var lastMeeting = npcMeetingLog[pairKey] || 0;
            var gameDay = window.gameTime ? window.gameTime.currentDay : 0;
            if (gameDay > lastMeeting) {
                npcMeetingLog[pairKey] = gameDay;
                var meetingText = group[0].name + '和' + group[1].name + '在' + loc + '相遇了。';
                if (window.showMessage) {
                    // 10%概率显示
                    if (Math.random() < 0.1) {
                        window.showMessage('👥 ' + meetingText, 'info');
                    }
                }
                // 轻微影响情绪
                if (group[0].state) group[0].state.mood = Math.min(100, (group[0].state.mood || 50) + 1);
                if (group[1].state) group[1].state.mood = Math.min(100, (group[1].state.mood || 50) + 1);
            }
        }
    }
}

// ============ 在地图上渲染NPC位置 ============
function renderNPCMapIcons(mapContainer) {
    if (!mapContainer || !window.npcManager) return;
    var npcs = window.npcManager.getAllNPCs() || [];
    var currentLoc = window.currentCharData?.location || '';
    for (var i = 0; i < npcs.length; i++) {
        var n = npcs[i];
        if (n.location === currentLoc || n.state?.location === currentLoc) {
            var icon = document.createElement('div');
            icon.className = 'absolute text-lg cursor-pointer hover:scale-125 transition-transform';
            icon.style.left = (10 + Math.random() * 80) + '%';
            icon.style.top = (10 + Math.random() * 80) + '%';
            icon.title = n.name + ' - ' + (n.state?.currentActivity || '空闲');
            icon.textContent = n.appearance?.icon || '👤';
            icon.onclick = function() { if (typeof window.showNPCDialog === 'function') window.showNPCDialog(n.id); };
            mapContainer.appendChild(icon);
        }
    }
}

// ============ 集成到NPC AI更新中 ============
(function patchNPCUpdate() {
    var origUpdate = window.npcManager?.updateAll;
    if (origUpdate) {
        var manager = window.npcManager;
        manager.updateAll = function(deltaTime) {
            var result = origUpdate.call(this, deltaTime);
            try { checkNPCMeetings(); } catch(e) {}
            return result;
        };
    }
})();

// ============ 导出 ============
if (typeof window !== 'undefined') {
    window.getNPCActivityDescription = getNPCActivityDescription;
    window.getNearbyNPCsDescription = getNearbyNPCsDescription;
    window.checkNPCMeetings = checkNPCMeetings;
    window.renderNPCMapIcons = renderNPCMapIcons;
}