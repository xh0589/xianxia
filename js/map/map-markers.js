/**
 * xianxia-map-markers.js - 地图标记系统
 * 从Degrees of Lewdity提取的地图标记功能
 */

// 确保gameLog存在
if (typeof window !== 'undefined' && !window.gameLog) {
    window.gameLog = {
        entries: [],
        add: function(msg, type) { console.log(`[${type}] ${msg}`); }
    };
}

// ==================== 地图标记类型 ====================
const MarkerTypes = {
    LOCATION: 'location',           // 地点
    NPC: 'npc',                     // NPC
    SHOP: 'shop',                   // 商店
    QUEST: 'quest',                 // 任务点
    DUNGEON: 'dungeon',             // 副本/秘境
    TREASURE: 'treasure',           // 宝藏
    DANGER: 'danger',               // 危险区域
    TELEPORT: 'teleport',           // 传送点
    LANDMARK: 'landmark',           // 地标
    PLAYER: 'player',               // 玩家位置
    VISITED: 'visited',             // 已探索
    UNLOCKED: 'unlocked',           // 已解锁
    LOCKED: 'locked'                // 未解锁
};

// ==================== 地图标记类 ====================
class MapMarker {
    constructor(id, name, position, options = {}) {
        this.id = id;
        this.name = name;
        this.position = position || { x: 0, y: 0 };
        this.type = options.type || MarkerTypes.LOCATION;
        this.icon = options.icon || this.getDefaultIcon();
        this.color = options.color || this.getDefaultColor();
        this.description = options.description || '';
        this.visible = options.visible !== false;
        this.clickable = options.clickable !== false;
        this.tooltip = options.tooltip || '';
        
        // 条件
        this.unlockCondition = options.unlockCondition || null;
        this.isUnlocked = !options.unlockCondition || this.checkUnlockCondition();
        this.isVisited = options.isVisited || false;
        
        // 关联数据
        this.relatedQuestId = options.relatedQuestId || null;
        this.relatedNPCId = options.relatedNPCId || null;
        this.relatedLocation = options.relatedLocation || null;
        
        // 自定义数据
        this.customData = options.customData || {};
    }
    
    getDefaultIcon() {
        const icons = {
            [MarkerTypes.LOCATION]: '📍',
            [MarkerTypes.NPC]: '🧑',
            [MarkerTypes.SHOP]: '🏪',
            [MarkerTypes.QUEST]: '📜',
            [MarkerTypes.DUNGEON]: '🏔️',
            [MarkerTypes.TREASURE]: '💎',
            [MarkerTypes.DANGER]: '⚠️',
            [MarkerTypes.TELEPORT]: '✨',
            [MarkerTypes.LANDMARK]: '🗼',
            [MarkerTypes.PLAYER]: '🧙',
            [MarkerTypes.VISITED]: '✅',
            [MarkerTypes.UNLOCKED]: '🔓',
            [MarkerTypes.LOCKED]: '🔒'
        };
        return icons[this.type] || '📍';
    }
    
    getDefaultColor() {
        const colors = {
            [MarkerTypes.LOCATION]: '#3b82f6',
            [MarkerTypes.NPC]: '#22c55e',
            [MarkerTypes.SHOP]: '#eab308',
            [MarkerTypes.QUEST]: '#a855f7',
            [MarkerTypes.DUNGEON]: '#ef4444',
            [MarkerTypes.TREASURE]: '#06b6d4',
            [MarkerTypes.DANGER]: '#dc2626',
            [MarkerTypes.TELEPORT]: '#f472b6',
            [MarkerTypes.LANDMARK]: '#8b5cf6',
            [MarkerTypes.PLAYER]: '#fbbf24',
            [MarkerTypes.VISITED]: '#22c55e',
            [MarkerTypes.UNLOCKED]: '#3b82f6',
            [MarkerTypes.LOCKED]: '#6b7280'
        };
        return colors[this.type] || '#3b82f6';
    }
    
    checkUnlockCondition() {
        if (!this.unlockCondition) return true;
        
        for (const [key, requiredValue] of Object.entries(this.unlockCondition)) {
            const playerValue = this.getNestedValue(window.gameState || {}, key);
            if (typeof requiredValue === 'object' && requiredValue.operator) {
                switch (requiredValue.operator) {
                    case 'gt': if (!(playerValue > requiredValue.value)) return false; break;
                    case 'lt': if (!(playerValue < requiredValue.value)) return false; break;
                    case 'gte': if (!(playerValue >= requiredValue.value)) return false; break;
                    case 'lte': if (!(playerValue <= requiredValue.value)) return false; break;
                    case 'eq': if (!(playerValue === requiredValue.value)) return false; break;
                    default: if (playerValue < requiredValue) return false;
                }
            } else {
                if (playerValue < requiredValue) return false;
            }
        }
        return true;
    }
    
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current && current[key], obj);
    }
    
    // 标记为已访问
    markVisited() {
        this.isVisited = true;
        gameLog.add(`探索了地点: ${this.name}`, 'info');
    }
    
    // 解锁
    unlock() {
        this.isUnlocked = true;
        this.visible = true;
        gameLog.add(`解锁了新地点: ${this.name}`, 'success');
    }
    
    // 锁定
    lock() {
        this.isUnlocked = false;
        this.visible = false;
    }
    
    // 获取显示文本
    getDisplayText() {
        let text = `${this.icon} ${this.name}`;
        if (this.isVisited) text += ' ✅';
        if (!this.isUnlocked) text += ' 🔒';
        return text;
    }
    
    // 序列化
    serialize() {
        return {
            id: this.id,
            name: this.name,
            position: this.position,
            type: this.type,
            icon: this.icon,
            color: this.color,
            description: this.description,
            visible: this.visible,
            isUnlocked: this.isUnlocked,
            isVisited: this.isVisited,
            relatedQuestId: this.relatedQuestId,
            relatedNPCId: this.relatedNPCId,
            customData: this.customData
        };
    }
    
    // 反序列化
    static deserialize(data) {
        const marker = new MapMarker(data.id, data.name, data.position, {
            type: data.type,
            icon: data.icon,
            color: data.color,
            description: data.description,
            visible: data.visible,
            relatedQuestId: data.relatedQuestId,
            relatedNPCId: data.relatedNPCId,
            customData: data.customData
        });
        marker.isUnlocked = data.isUnlocked;
        marker.isVisited = data.isVisited;
        return marker;
    }
}

// ==================== 地图标记管理器 ====================
class MapMarkerManager {
    constructor() {
        this.markers = new Map();
        this.visibleMarkers = [];
        this.selectedMarker = null;
        this.markerGroups = new Map(); // groupId -> Set<markerId>
    }
    
    // 添加标记
    addMarker(marker) {
        if (marker instanceof MapMarker) {
            this.markers.set(marker.id, marker);
            this.updateVisibleMarkers();
            return true;
        }
        return false;
    }
    
    // 移除标记
    removeMarker(markerId) {
        const marker = this.markers.get(markerId);
        if (marker) {
            this.markers.delete(markerId);
            this.updateVisibleMarkers();
            return true;
        }
        return false;
    }
    
    // 获取标记
    getMarker(markerId) {
        return this.markers.get(markerId);
    }
    
    // 获取所有标记
    getAllMarkers() {
        return Array.from(this.markers.values());
    }
    
    // 获取可见标记
    getVisibleMarkers() {
        return this.visibleMarkers;
    }
    
    // 按类型获取标记
    getMarkersByType(type) {
        return this.getAllMarkers().filter(m => m.type === type && m.visible);
    }
    
    // 按组获取标记
    getMarkersByGroup(groupId) {
        const group = this.markerGroups.get(groupId);
        if (!group) return [];
        return Array.from(group).map(id => this.markers.get(id)).filter(Boolean);
    }
    
    // 添加到组
    addToGroup(groupId, markerId) {
        if (!this.markerGroups.has(groupId)) {
            this.markerGroups.set(groupId, new Set());
        }
        this.markerGroups.get(groupId).add(markerId);
    }
    
    // 从组移除
    removeFromGroup(groupId, markerId) {
        const group = this.markerGroups.get(groupId);
        if (group) {
            group.delete(markerId);
        }
    }
    
    // 更新可见标记列表
    updateVisibleMarkers() {
        this.visibleMarkers = Array.from(this.markers.values())
            .filter(m => m.visible && m.isUnlocked)
            .sort((a, b) => {
                // 按类型排序
                const typeOrder = {
                    [MarkerTypes.PLAYER]: 0,
                    [MarkerTypes.TELEPORT]: 1,
                    [MarkerTypes.QUEST]: 2,
                    [MarkerTypes.NPC]: 3,
                    [MarkerTypes.SHOP]: 4,
                    [MarkerTypes.LOCATION]: 5,
                    [MarkerTypes.LANDMARK]: 6,
                    [MarkerTypes.DUNGEON]: 7,
                    [MarkerTypes.TREASURE]: 8,
                    [MarkerTypes.DANGER]: 9
                };
                return (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
            });
    }
    
    // 选择标记
    selectMarker(markerId) {
        this.selectedMarker = this.markers.get(markerId) || null;
        const marker = this.selectedMarker;
        if (marker && marker.type === MarkerTypes.DUNGEON) {
            let dungeonId = 'ruin';
            if (marker.id.includes('cave')) dungeonId = 'cave';
            else if (marker.id.includes('mountain')) dungeonId = 'mountain';
            if (typeof window.openDungeonEntrance === 'function') {
                window.openDungeonEntrance(dungeonId);
            } else if (window.showMessage) {
                window.showMessage(`发现秘境入口：${marker.name}`, 'info');
            }
        }
        return this.selectedMarker;
    }
    
    // 取消选择
    deselectMarker() {
        this.selectedMarker = null;
    }
    
    // 获取选中的标记
    getSelectedMarker() {
        return this.selectedMarker;
    }
    
    // 标记为已访问
    markAsVisited(markerId) {
        const marker = this.markers.get(markerId);
        if (marker) {
            marker.markVisited();
            this.updateVisibleMarkers();
            return true;
        }
        return false;
    }
    
    // 解锁标记
    unlockMarker(markerId) {
        const marker = this.markers.get(markerId);
        if (marker) {
            marker.unlock();
            this.updateVisibleMarkers();
            return true;
        }
        return false;
    }
    
    // 渲染标记列表
    renderMarkerList(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const markers = this.getVisibleMarkers();
        
        if (markers.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">暂无可用标记</p>';
            return;
        }
        
        let html = '<div class="space-y-2">';
        for (const marker of markers) {
            const isSelected = this.selectedMarker && this.selectedMarker.id === marker.id;
            const isDungeon = marker.type === MarkerTypes.DUNGEON;
            html += `
                <div class="flex items-center p-2 rounded cursor-pointer hover:bg-gray-700 transition ${isSelected ? 'bg-blue-600/30 border border-blue-500' : ''}"
                     onclick="mapMarkerManager.selectMarker('${marker.id}'); mapMarkerManager.renderMarkerList('map-marker-list');">
                    <span class="text-lg mr-2">${marker.icon}</span>
                    <div class="flex-1">
                        <div class="text-sm font-bold text-gray-200">${marker.name}${isDungeon ? ' <span class="text-xs text-red-400">[秘境]</span>' : ''}</div>
                        ${marker.description ? `<div class="text-xs text-gray-400">${marker.description}</div>` : ''}
                    </div>
                    ${isDungeon ? '<span class="text-xs text-purple-400">进入</span>' : ''}
                    ${marker.isVisited ? '<span class="text-green-400 text-xs">✓</span>' : ''}
                </div>
            `;
        }
        html += '</div>';
        
        container.innerHTML = html;
    }
    
    // 渲染标记详情
    renderMarkerDetail(containerId) {
        const container = document.getElementById(containerId);
        if (!container || !this.selectedMarker) return;
        
        const marker = this.selectedMarker;
        container.innerHTML = `
            <div class="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                <div class="flex items-center mb-3">
                    <span class="text-2xl mr-2">${marker.icon}</span>
                    <h3 class="text-lg font-bold text-yellow-500">${marker.name}</h3>
                </div>
                ${marker.description ? `<p class="text-gray-300 text-sm mb-3">${marker.description}</p>` : ''}
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div class="text-gray-400">类型:</div>
                    <div class="text-gray-200">${this.getTypeName(marker.type)}</div>
                    <div class="text-gray-400">状态:</div>
                    <div class="text-gray-200">${marker.isVisited ? '已探索' : '未探索'}${!marker.isUnlocked ? ' (未解锁)' : ''}</div>
                </div>
                ${marker.tooltip ? `<div class="mt-3 p-2 bg-gray-800 rounded text-xs text-gray-400">${marker.tooltip}</div>` : ''}
            </div>
        `;
    }
    
    // 获取类型名称
    getTypeName(type) {
        const names = {
            [MarkerTypes.LOCATION]: '地点',
            [MarkerTypes.NPC]: 'NPC',
            [MarkerTypes.SHOP]: '商店',
            [MarkerTypes.QUEST]: '任务',
            [MarkerTypes.DUNGEON]: '秘境',
            [MarkerTypes.TREASURE]: '宝藏',
            [MarkerTypes.DANGER]: '危险',
            [MarkerTypes.TELEPORT]: '传送',
            [MarkerTypes.LANDMARK]: '地标',
            [MarkerTypes.PLAYER]: '玩家',
            [MarkerTypes.VISITED]: '已探索',
            [MarkerTypes.UNLOCKED]: '已解锁',
            [MarkerTypes.LOCKED]: '未解锁'
        };
        return names[type] || type;
    }
    
    // 序列化
    serialize() {
        return Array.from(this.markers.values()).map(m => m.serialize());
    }
    
    // 反序列化
    deserialize(data) {
        this.markers.clear();
        this.markerGroups.clear();
        
        for (const markerData of data) {
            const marker = MapMarker.deserialize(markerData);
            this.markers.set(marker.id, marker);
        }
        
        this.updateVisibleMarkers();
    }
}

// ==================== 地标系统（扩展） ====================
// 地标是固定在世界地图上的特殊地点，提供独特功能
const LANDMARKS = {
    'ancient_sword_peak': {
        name: '古剑峰',
        region: '蜀地',
        pos: { x: 35, y: 25 },
        desc: '传说上古剑仙在此悟道，剑意残留',
        type: 'cultivation_spot',
        bonus: { cultivation: 1.2, sword: 1.3 },
        icon: '🗡️',
        color: '#f59e0b',
        unlockCondition: { realmLevel: 2 } // 筑基解锁
    },
    'dragon_vein': {
        name: '龙脉',
        region: '中州',
        pos: { x: 50, y: 45 },
        desc: '地底龙脉汇聚之处，灵气充沛',
        type: 'qi_spot',
        bonus: { qi_regen: 2, cultivation: 1.15 },
        icon: '🐉',
        color: '#ef4444',
        unlockCondition: { realmLevel: 1 }
    },
    'soul_temple': {
        name: '魂殿遗迹',
        region: '南疆',
        pos: { x: 20, y: 65 },
        desc: '上古魂道宗门遗址，传闻有灵魂秘法',
        type: 'ruin',
        bonus: { enlightenment: 1.25 },
        icon: '💀',
        color: '#8b5cf6',
        unlockCondition: { realmLevel: 3 }
    },
    'ice_abyss': {
        name: '寒冰深渊',
        region: '北冥',
        pos: { x: 75, y: 15 },
        desc: '万年寒冰形成的深渊，冰系修炼圣地',
        type: 'cultivation_spot',
        bonus: { ice: 1.4, water: 1.2 },
        icon: '❄️',
        color: '#06b6d4',
        unlockCondition: { realmLevel: 3 }
    },
    'thunder_peak': {
        name: '雷音峰',
        region: '东荒',
        pos: { x: 60, y: 30 },
        desc: '常年雷云笼罩，雷系修炼者的天堂',
        type: 'cultivation_spot',
        bonus: { thunder: 1.4, cultivation: 1.1 },
        icon: '⚡',
        color: '#fbbf24',
        unlockCondition: { realmLevel: 2 }
    },
    'mirage_oasis': {
        name: '幻海绿洲',
        region: '西漠',
        pos: { x: 30, y: 55 },
        desc: '沙漠中的幻术绿洲，机缘与危险并存',
        type: 'special',
        bonus: { luck: 1.3 },
        icon: '🏝️',
        color: '#10b981',
        unlockCondition: { realmLevel: 2 }
    },
    'heavenly_pool': {
        name: '天池',
        region: '东南海域',
        pos: { x: 85, y: 60 },
        desc: '海外仙山天池，洗涤凡躯的圣水',
        type: 'healing_spot',
        bonus: { health_regen: 3, detox: true },
        icon: '🏞️',
        color: '#3b82f6',
        unlockCondition: { realmLevel: 4 }
    },
    'sword_grave': {
        name: '剑冢',
        region: '蜀地',
        pos: { x: 38, y: 22 },
        desc: '历代剑修埋剑之地，可寻得名剑',
        type: 'treasure_spot',
        bonus: { sword_find: 2.0 },
        icon: '⚔️',
        color: '#dc2626',
        unlockCondition: { realmLevel: 4, quest: 'sword_grave_quest' }
    },
    'spirit_well': {
        name: '灵泉古井',
        region: '中州',
        pos: { x: 48, y: 48 },
        desc: '深藏帝都地下的灵泉古井，淬体圣品',
        type: 'body_training',
        bonus: { constitution: 1.2 },
        icon: '⛲',
        color: '#0ea5e9',
        unlockCondition: { reputation: { city: '帝都·长安', level: 3 } }
    },
    'demon_abyss': {
        name: '魔渊裂隙',
        region: '南疆',
        pos: { x: 15, y: 70 },
        desc: '魔界与人间的裂隙，高阶魔物出没',
        type: 'danger_zone',
        bonus: { demon_drop: 2.0 },
        icon: '👹',
        color: '#7c3aed',
        unlockCondition: { realmLevel: 5 } // 金丹解锁
    },
    'phoenix_nest': {
        name: '凤凰巢',
        region: '南疆',
        pos: { x: 25, y: 60 },
        desc: '凤凰涅槃之地，火系至宝产地',
        type: 'treasure_spot',
        bonus: { fire: 1.3, phoenix_item: 2.0 },
        icon: '🦅',
        color: '#f97316',
        unlockCondition: { realmLevel: 3 }
    },
    'ancient_battlefield': {
        name: '上古战场',
        region: '西漠',
        pos: { x: 28, y: 50 },
        desc: '上古仙魔大战遗址，埋藏无数宝物',
        type: 'ruin',
        bonus: { loot_quality: 1.5 },
        icon: '💀',
        color: '#92400e',
        unlockCondition: { realmLevel: 4 }
    }
};

// 根据地标类型获取加成描述
function getLandmarkBonusDescription(landmark) {
    if (!landmark || !landmark.bonus) return '无特殊效果';
    const descs = [];
    const b = landmark.bonus;
    if (b.cultivation) descs.push(`修炼速度+${Math.round((b.cultivation - 1) * 100)}%`);
    if (b.qi_regen) descs.push(`真气恢复+${b.qi_regen}`);
    if (b.sword) descs.push(`剑法威力+${Math.round((b.sword - 1) * 100)}%`);
    if (b.ice) descs.push(`冰系威力+${Math.round((b.ice - 1) * 100)}%`);
    if (b.thunder) descs.push(`雷系威力+${Math.round((b.thunder - 1) * 100)}%`);
    if (b.fire) descs.push(`火系威力+${Math.round((b.fire - 1) * 100)}%`);
    if (b.water) descs.push(`水系威力+${Math.round((b.water - 1) * 100)}%`);
    if (b.luck) descs.push(`机缘+${Math.round((b.luck - 1) * 100)}%`);
    if (b.enlightenment) descs.push(`悟性+${Math.round((b.enlightenment - 1) * 100)}%`);
    if (b.health_regen) descs.push(`生命恢复+${b.health_regen}`);
    if (b.detox) descs.push('解毒效果');
    if (b.constitution) descs.push(`体质+${Math.round((b.constitution - 1) * 100)}%`);
    return descs.join('，') || '特殊效果';
}

// 初始化地标系统（将LANDMARKS添加到地图标记）
function initLandmarkSystem() {
    if (!window.mapMarkerManager) {
        console.warn('地图标记系统未初始化，跳过地标系统');
        return;
    }
    
    const manager = window.mapMarkerManager;
    const added = [];
    
    for (const [id, lm] of Object.entries(LANDMARKS)) {
        const markerId = 'landmark_' + id;
        const bonusDesc = getLandmarkBonusDescription(lm);
        const fullDesc = `${lm.desc}\n\n📍 地区：${lm.region}\n✨ 效果：${bonusDesc}`;
        
        const marker = new MapMarker(markerId, lm.name, lm.pos, {
            type: MarkerTypes.LANDMARK,
            description: fullDesc,
            icon: lm.icon || '🗼',
            color: lm.color || '#8b5cf6',
            tooltip: `地区：${lm.region} | ${bonusDesc}`,
            unlockCondition: lm.unlockCondition || null,
            customData: {
                landmarkId: id,
                region: lm.region,
                bonus: lm.bonus,
                type: lm.type
            }
        });
        
        manager.addMarker(marker);
        manager.addToGroup('landmarks', markerId);
        added.push(lm.name);
    }
    
    if (window.gameLog) {
        window.gameLog.add(`地标系统初始化完成，共 ${added.length} 个地标`, 'info');
    }
    return added;
}

// 根据玩家位置获取附近地标加成
function getNearbyLandmarkBonus(playerRegion) {
    const bonuses = {};
    for (const lm of Object.values(LANDMARKS)) {
        if (lm.region === playerRegion && lm.bonus) {
            for (const [key, val] of Object.entries(lm.bonus)) {
                if (!bonuses[key] || bonuses[key] < val) {
                    bonuses[key] = val;
                }
            }
        }
    }
    return bonuses;
}

// ==================== 预设标记 ====================
const PresetMapMarkers = [
    // 主要地点
    new MapMarker('main_city', '修仙城', { x: 50, y: 50 }, {
        type: MarkerTypes.LOCATION,
        description: '主要的修仙者聚集地',
        icon: '🏯',
        color: '#3b82f6'
    }),
    
    new MapMarker('sect_main', '宗门大殿', { x: 50, y: 30 }, {
        type: MarkerTypes.LOCATION,
        description: '宗门核心建筑',
        icon: '⛩️',
        color: '#8b5cf6'
    }),
    
    new MapMarker('market', '交易市场', { x: 60, y: 50 }, {
        type: MarkerTypes.SHOP,
        description: '购买和出售物品',
        icon: '🏪',
        color: '#eab308'
    }),
    
    new MapMarker('alchemy_shop', '丹药阁', { x: 55, y: 55 }, {
        type: MarkerTypes.SHOP,
        description: '购买和炼制丹药',
        icon: '💊',
        color: '#eab308'
    }),
    
    new MapMarker('weapon_shop', '兵器谱', { x: 45, y: 55 }, {
        type: MarkerTypes.SHOP,
        description: '购买和强化武器',
        icon: '⚔️',
        color: '#eab308'
    }),
    
    // NPC位置
    new MapMarker('npc_mentor', '清虚道人', { x: 50, y: 25 }, {
        type: MarkerTypes.NPC,
        description: '你的修炼导师',
        icon: '🧙‍♂️',
        color: '#22c55e',
        relatedNPCId: 'mentor_01'
    }),
    
    new MapMarker('npc_merchant', '万宝阁主', { x: 62, y: 52 }, {
        type: MarkerTypes.NPC,
        description: '商人NPC',
        icon: '🧑‍💼',
        color: '#22c55e',
        relatedNPCId: 'merchant_01'
    }),
    
    // 任务点
    new MapMarker('quest_first_battle', '试炼之地', { x: 70, y: 40 }, {
        type: MarkerTypes.QUEST,
        description: '完成第一场战斗的任务点',
        icon: '📜',
        color: '#a855f7',
        relatedQuestId: 'quest_first_battle'
    }),
    
    // 秘境
    new MapMarker('dungeon_cave', '幽暗洞穴', { x: 30, y: 60 }, {
        type: MarkerTypes.DUNGEON,
        description: '危险的秘境，可能有宝物',
        icon: '🏔️',
        color: '#ef4444'
    }),
    
    new MapMarker('dungeon_mountain', '仙山秘境', { x: 70, y: 70 }, {
        type: MarkerTypes.DUNGEON,
        description: '高阶修士的修炼秘境',
        icon: '🏔️',
        color: '#ef4444',
        unlockCondition: { realmLevel: 3 }
    }),
    
    // 传送点
    new MapMarker('teleport_city', '传送阵·城', { x: 50, y: 65 }, {
        type: MarkerTypes.TELEPORT,
        description: '快速旅行到修仙城',
        icon: '✨',
        color: '#f472b6'
    }),
    
    new MapMarker('teleport_sect', '传送阵·宗', { x: 50, y: 15 }, {
        type: MarkerTypes.TELEPORT,
        description: '快速旅行到宗门',
        icon: '✨',
        color: '#f472b6'
    }),
    
    // 危险区域
    new MapMarker('danger_forest', '迷雾森林', { x: 20, y: 30 }, {
        type: MarkerTypes.DANGER,
        description: '危险的森林，有野兽出没',
        icon: '⚠️',
        color: '#dc2626'
    }),
    
    new MapMarker('danger_swamp', '毒沼', { x: 80, y: 50 }, {
        type: MarkerTypes.DANGER,
        description: '充满毒气的沼泽',
        icon: '⚠️',
        color: '#dc2626',
        unlockCondition: { playerLevel: 10 }
    })
];

// ==================== 初始化 ====================
function initMapMarkers() {
    window.mapMarkerManager = new MapMarkerManager();
    window.MarkerTypes = MarkerTypes;
    
    // 添加预设标记
    for (const marker of PresetMapMarkers) {
        mapMarkerManager.addMarker(marker);
    }
    
    // 创建标记组
    mapMarkerManager.addToGroup('city', 'main_city');
    mapMarkerManager.addToGroup('city', 'market');
    mapMarkerManager.addToGroup('city', 'alchemy_shop');
    mapMarkerManager.addToGroup('city', 'weapon_shop');
    mapMarkerManager.addToGroup('city', 'teleport_city');
    
    mapMarkerManager.addToGroup('sect', 'sect_main');
    mapMarkerManager.addToGroup('sect', 'npc_mentor');
    mapMarkerManager.addToGroup('sect', 'teleport_sect');
    
    // 初始化地标系统
    initLandmarkSystem();
    
    gameLog.add('地图标记系统已初始化', 'info');
}

// ==================== 全局函数（供HTML调用） ====================
// 修复：renderMapMarkers 不存在的问题

function renderMapMarkers(containerId) {
    if (window.mapMarkerManager && typeof window.mapMarkerManager.renderMarkerList === 'function') {
        window.mapMarkerManager.renderMarkerList(containerId);
    } else {
        console.warn('mapMarkerManager 未初始化');
    }
}

// ==================== v12.4 任务目标标记联动（quest-system 接取/交付时调用） ====================
// 说明：任务数据的目标字段为 objectives[]（type='visit' 时含 location/locationName/locationId 文本），
// 多数任务只有文本目标、无地图坐标——本函数按名称与现有地图标记模糊匹配，
// 匹配不到对应地点时跳过该目标（不报错），因此只有可定位的任务会显示 🎯 标记。
function syncQuestTargetMarkers() {
    if (!window.mapMarkerManager || typeof MapMarker !== 'function') return;
    var mgr = window.mapMarkerManager;

    // 先清除现有任务目标标记
    mgr.getAllMarkers().forEach(function (m) {
        if (m && m.id && m.id.indexOf('quest_target_') === 0) {
            mgr.removeMarker(m.id);
        }
    });

    // 遍历活跃任务重新注册
    var progress = window.playerQuestProgress;
    if (!progress || !Array.isArray(progress.activeQuests)) return;
    progress.activeQuests.forEach(function (qid) {
        var quest = (window.QuestRegistry && typeof window.QuestRegistry.get === 'function')
            ? window.QuestRegistry.get(qid) : null;
        if (!quest || !Array.isArray(quest.objectives)) return;
        quest.objectives.forEach(function (obj, oi) {
            if (!obj || obj.type !== 'visit' || obj.completed) return;
            var locName = obj.locationName || obj.location || obj.locationId || null;
            if (!locName) return; // 无目标地点字段 → 跳过
            // 在现有标记中按名称匹配（精确 → 互相包含）
            var target = null;
            mgr.getAllMarkers().forEach(function (mk) {
                if (target || !mk.name) return;
                if (mk.id.indexOf('quest_target_') === 0) return;
                if (mk.name === locName || mk.name.indexOf(locName) >= 0 || locName.indexOf(mk.name) >= 0) {
                    target = mk;
                }
            });
            if (!target || !target.position) return; // 地图上无对应地点 → 跳过
            var markerId = 'quest_target_' + qid + '_' + oi;
            var marker = new MapMarker(markerId, '🎯 ' + (quest.title || qid),
                { x: target.position.x, y: target.position.y }, {
                    type: MarkerTypes.QUEST,
                    icon: '🎯',
                    description: '任务目标：' + (quest.title || qid) + ' → ' + locName
                });
            mgr.addMarker(marker);
            mgr.addToGroup('quest_targets', markerId);
        });
    });
}

// 交付任务后移除该任务的全部目标标记
function removeQuestTargetMarkers(questId) {
    if (!window.mapMarkerManager) return;
    var mgr = window.mapMarkerManager;
    var prefix = 'quest_target_' + questId + '_';
    mgr.getAllMarkers().forEach(function (m) {
        if (m && m.id && m.id.indexOf(prefix) === 0) {
            mgr.removeFromGroup('quest_targets', m.id);
            mgr.removeMarker(m.id);
        }
    });
}

// ==================== 导出 ====================
if (typeof window !== 'undefined') {
    window.MapMarker = MapMarker;
    window.MapMarkerManager = MapMarkerManager;
    window.PresetMapMarkers = PresetMapMarkers;
    window.initMapMarkers = initMapMarkers;
    window.LANDMARKS = LANDMARKS;
    window.initLandmarkSystem = initLandmarkSystem;
    window.getNearbyLandmarkBonus = getNearbyLandmarkBonus;
    window.getLandmarkBonusDescription = getLandmarkBonusDescription;
    window.renderMapMarkers = renderMapMarkers;  // 新增导出
    window.syncQuestTargetMarkers = syncQuestTargetMarkers;        // v12.4
    window.removeQuestTargetMarkers = removeQuestTargetMarkers;    // v12.4
}
