// ==================== 人脉关系面板渲染（v2.0 优化版） ====================
var RELATIONS_PAGE_SIZE = 12;
var RELATIONS_CURRENT_PAGE = 1;
var RELATIONS_SEARCH_QUERY = '';
var RELATIONS_FILTER_MODE = 'all';
var RELATIONS_ACTIVE_FILTERS = {};

function renderRelationsPanel() {
    const container = document.getElementById('relations-npc-list');
    const countDisplay = document.getElementById('relations-count');
    if (!container) return;

    // 获取所有已结识的NPC（firstMet === true 或 meetCount > 0）
    var allNPCs = [];
    if (window.npcManager && typeof window.npcManager.getAllNPCs === 'function') {
        var rawList = window.npcManager.getAllNPCs();
        for (var i = 0; i < rawList.length; i++) {
            var npc = rawList[i];
            if (npc.memory && (npc.memory.firstMet === true || (npc.memory.meetCount || 0) > 0)) {
                allNPCs.push(npc);
            }
        }
    }

    // 搜索过滤
    if (RELATIONS_SEARCH_QUERY) {
        var q = RELATIONS_SEARCH_QUERY.toLowerCase().trim();
        allNPCs = allNPCs.filter(function(npc) {
            return npc.name.toLowerCase().indexOf(q) >= 0
                || (npc.occupation || '').toLowerCase().indexOf(q) >= 0
                || (npc.location || '').toLowerCase().indexOf(q) >= 0;
        });
    }

    // 快速筛选标签
    var activeFilter = RELATIONS_ACTIVE_FILTERS;
    if (activeFilter.sameLocation) {
        var playerLoc = window.currentCharData?.location || '';
        if (playerLoc) {
            allNPCs = allNPCs.filter(function(npc) { return npc.location === playerLoc; });
        }
    }
    if (activeFilter.canInteract) {
        allNPCs = allNPCs.filter(function(npc) {
            return npc.state && npc.state.mood >= 20; // 情绪不愤怒即可互动
        });
    }
    if (activeFilter.hasNewEvents) {
        allNPCs = allNPCs.filter(function(npc) {
            var id = npc.id;
            // 检查是否有未触发的个人事件
            if (typeof window.NPC_PERSONAL_EVENTS !== 'object') return false;
            for (var key in window.NPC_PERSONAL_EVENTS) {
                var ev = window.NPC_PERSONAL_EVENTS[key];
                if (ev.npcId === id && !window.hasEventTriggered(ev.id)) return true;
            }
            return false;
        });
    }
    if (activeFilter.hasRequests) {
        allNPCs = allNPCs.filter(function(npc) {
            return npc.relationship && npc.relationship.affection >= 20;
        });
    }
    if (activeFilter.isCompanion) {
        allNPCs = allNPCs.filter(function(npc) {
            return npc.isInParty || npc.isFollowing;
        });
    }
    if (activeFilter.specialRelation) {
        allNPCs = allNPCs.filter(function(npc) {
            var aff = npc.relationship?.affection || 0;
            return aff >= 60 || aff <= -50; // 知己以上或仇人
        });
    }
    // v20.2 情缘筛选：仅显示四位女主角（无论当前好感，便于追踪吃醋/和好状态）
    if (activeFilter.isRomance) {
        var roster = (window.HEROINE_ROSTER || []).map(function(h){ return h.id; });
        allNPCs = allNPCs.filter(function(npc) { return roster.indexOf(npc.id) >= 0; });
    }

    // 排序
    const filterMode = RELATIONS_FILTER_MODE;
    if (filterMode === 'high') {
        allNPCs.sort(function(a, b) {
            return (b.relationship?.affection || 0) - (a.relationship?.affection || 0);
        });
    } else if (filterMode === 'low') {
        allNPCs.sort(function(a, b) {
            return (a.relationship?.affection || 0) - (b.relationship?.affection || 0);
        });
    } else if (filterMode === 'sect') {
        allNPCs.sort(function(a, b) {
            var sectA = getNPCSect(a);
            var sectB = getNPCSect(b);
            if (sectA < sectB) return -1;
            if (sectA > sectB) return 1;
            return 0;
        });
    } else if (filterMode === 'location') {
        allNPCs.sort(function(a, b) {
            var locA = a.location || '';
            var locB = b.location || '';
            if (locA < locB) return -1;
            if (locA > locB) return 1;
            return 0;
        });
    }

    // 更新计数
    if (countDisplay) {
        countDisplay.textContent = '共 ' + allNPCs.length + ' 人';
    }

    // 分页
    var totalPages = Math.max(1, Math.ceil(allNPCs.length / RELATIONS_PAGE_SIZE));
    if (RELATIONS_CURRENT_PAGE > totalPages) RELATIONS_CURRENT_PAGE = totalPages;
    var startIdx = (RELATIONS_CURRENT_PAGE - 1) * RELATIONS_PAGE_SIZE;
    var pageNPCs = allNPCs.slice(startIdx, startIdx + RELATIONS_PAGE_SIZE);

    // 无NPC时显示占位
    if (allNPCs.length === 0) {
        container.innerHTML = '<div class="flex justify-between items-center bg-gray-800 p-3 rounded">' +
            '<div class="flex items-center gap-3">' +
                '<span class="text-2xl">👤</span>' +
                '<div>' +
                    '<p class="font-bold text-gray-200">暂无结识之人</p>' +
                    '<p class="text-xs text-gray-500">游历四方，结识天下英豪</p>' +
                '</div>' +
            '</div>' +
        '</div>';
        return;
    }

    var html = '';
    for (var i = 0; i < pageNPCs.length; i++) {
        var npc = pageNPCs[i];
        var aff = npc.relationship?.affection || 0;
        
        var respect = npc.relationship?.respect || 0;
        var favor = npc.relationship?.favor || 0;
        var loc = npc.location || '未知';
        var occupation = npc.occupation || '未知';
        var icon = npc.appearance?.icon || '👤';
        var mood = npc.state?.mood || 50;
        var npcSect = getNPCSect(npc);

        // 好感度等级
        var affLevel = '陌生人', affColor = 'text-gray-400';
        if (aff >= 80) { affLevel = '挚爱'; affColor = 'text-red-400'; }
        else if (aff >= 60) { affLevel = '知己'; affColor = 'text-purple-400'; }
        else if (aff >= 40) { affLevel = '朋友'; affColor = 'text-green-400'; }
        else if (aff >= 20) { affLevel = '熟人'; affColor = 'text-blue-400'; }
        else if (aff >= -20) { affLevel = '陌生人'; affColor = 'text-gray-400'; }
        else if (aff >= -50) { affLevel = '厌恶'; affColor = 'text-orange-400'; }
        else { affLevel = '仇人'; affColor = 'text-red-600'; }

        // 关系状态
        var relStatus = (typeof npc.getRelationshipStatus === 'function') ? npc.getRelationshipStatus() : null;
        var relBadge = '';
        if (relStatus) {
            relBadge = '<span class="text-xs ' + relStatus.color + ' ml-1">[' + relStatus.name + ']</span>';
        }

        // 心情图标
        var moodIcon = '😐';
        if (mood >= 80) moodIcon = '😄';
        else if (mood >= 60) moodIcon = '🙂';
        else if (mood >= 40) moodIcon = '😐';
        else if (mood >= 20) moodIcon = '😞';
        else moodIcon = '😡';

        // 门派标签
        var sectTag = npcSect !== '散修' ? '<span class="text-xs text-gray-600">🏛️ ' + npcSect + '</span>' : '';

        // 点击事件
        var safeId = npc.id.replace(/'/g, "\\'");

        // 简化卡片：只显示 姓名/身份/地点/关系/状态
        html += '<div class="bg-gray-800 p-2.5 rounded hover:bg-gray-750 transition cursor-pointer" onclick="window.showNPCDialog && window.showNPCDialog(\'' + safeId + '\')">' +
            '<div class="flex items-center justify-between">' +
                '<div class="flex items-center gap-2 min-w-0 flex-1">' +
                    '<span class="text-xl flex-shrink-0">' + icon + '</span>' +
                    '<div class="min-w-0">' +
                        '<p class="font-bold text-gray-200 text-sm truncate">' + npc.name + ' ' + relBadge + '</p>' +
                        '<p class="text-xs text-gray-500 truncate">' + occupation + ' · 📍' + loc + ' ' + sectTag + '</p>' +
                    '</div>' +
                '</div>' +
                '<div class="flex items-center gap-2 flex-shrink-0 ml-2">' +
                    '<span class="text-xs ' + affColor + ' font-bold">' + affLevel + '</span>' +
                    '<span class="text-xs">' + moodIcon + '</span>' +
                '</div>' +
            '</div>' +
            '<div class="flex gap-3 text-xs text-gray-500 mt-1">' +
                '<span>💗' + aff + '</span>' +
                
                '<span>敬重' + respect + '</span>' +
                '<span>💝' + favor + '</span>' +
            '</div>' +
        '</div>';
    }

    // 分页控件
    if (totalPages > 1) {
        var prevDisabled = RELATIONS_CURRENT_PAGE <= 1 ? 'opacity-50 pointer-events-none' : '';
        var nextDisabled = RELATIONS_CURRENT_PAGE >= totalPages ? 'opacity-50 pointer-events-none' : '';
        html += '<div class="flex justify-center items-center gap-4 pt-3">' +
            '<button class="text-sm bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded ' + prevDisabled + '" onclick="changeRelationsPage(' + (RELATIONS_CURRENT_PAGE - 1) + ')">上一页</button>' +
            '<span class="text-xs text-gray-400">' + RELATIONS_CURRENT_PAGE + ' / ' + totalPages + '</span>' +
            '<button class="text-sm bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded ' + nextDisabled + '" onclick="changeRelationsPage(' + (RELATIONS_CURRENT_PAGE + 1) + ')">下一页</button>' +
        '</div>';
    }

    container.innerHTML = html;
}

// 获取NPC所属门派
function getNPCSect(npc) {
    if (!npc) return '散修';
    var id = npc.id || '';
    var knownSects = ['少林', '武当', '峨眉', '华山', '昆仑', '崆峒', '天山', '逍遥', '唐门', '丐帮', '点苍', '衡山', '泰山', '嵩山', '恒山', '全真', '古墓', '明教', '星宿', '日月', '桃花', '绝情', '灵鹫', '铁掌', '少林寺', '青云门', '修罗宫', '百花谷', '星辰阁', '天机阁', '大隐阁', '天书阁', '万宝阁', '剑阁'];
    for (var i = 0; i < knownSects.length; i++) {
        if (id.indexOf(knownSects[i]) >= 0) {
            return knownSects[i];
        }
    }
    if (npc.background && npc.background.origin) {
        var origin = npc.background.origin;
        for (var j = 0; j < knownSects.length; j++) {
            if (origin.indexOf(knownSects[j]) >= 0) {
                return knownSects[j];
            }
        }
    }
    if (npc.location) {
        var loc = npc.location;
        for (var k = 0; k < knownSects.length; k++) {
            if (loc.indexOf(knownSects[k]) >= 0) {
                return knownSects[k];
            }
        }
    }
    return '散修';
}

// 翻页
function changeRelationsPage(page) {
    var totalNPCs = 0;
    if (window.npcManager && typeof window.npcManager.getAllNPCs === 'function') {
        var rawList = window.npcManager.getAllNPCs();
        for (var i = 0; i < rawList.length; i++) {
            var npc = rawList[i];
            if (npc.memory && (npc.memory.firstMet === true || (npc.memory.meetCount || 0) > 0)) {
                totalNPCs++;
            }
        }
    }
    var totalPages = Math.max(1, Math.ceil(totalNPCs / RELATIONS_PAGE_SIZE));
    if (page < 1 || page > totalPages) return;
    RELATIONS_CURRENT_PAGE = page;
    renderRelationsPanel();
}

// 搜索输入
function onRelationsSearch(query) {
    RELATIONS_SEARCH_QUERY = query || '';
    RELATIONS_CURRENT_PAGE = 1;
    renderRelationsPanel();
}

// 切换筛选标签
function toggleRelationsFilter(filterKey) {
    if (RELATIONS_ACTIVE_FILTERS[filterKey]) {
        delete RELATIONS_ACTIVE_FILTERS[filterKey];
    } else {
        RELATIONS_ACTIVE_FILTERS[filterKey] = true;
    }
    RELATIONS_CURRENT_PAGE = 1;
    renderRelationsPanel();
    // 更新按钮状态
    updateFilterButtons();
}

function updateFilterButtons() {
    document.querySelectorAll('.relations-filter-btn').forEach(function(btn) {
        var key = btn.dataset.filterKey;
        if (key && RELATIONS_ACTIVE_FILTERS[key]) {
            btn.classList.add('bg-blue-700', 'border-blue-500', 'text-white');
            btn.classList.remove('bg-gray-700', 'border-gray-600', 'text-gray-300');
        } else {
            btn.classList.remove('bg-blue-700', 'border-blue-500', 'text-white');
            btn.classList.add('bg-gray-700', 'border-gray-600', 'text-gray-300');
        }
    });
}

// 导出
if (typeof window !== 'undefined') {
    window.renderRelationsPanel = renderRelationsPanel;
    window.changeRelationsPage = changeRelationsPage;
    window.onRelationsSearch = onRelationsSearch;
    window.toggleRelationsFilter = toggleRelationsFilter;
    window.getNPCSect = getNPCSect;
}