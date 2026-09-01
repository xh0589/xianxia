// ==================== randomMap.js ====================
// 随机地图生成器（v2.0 - 支持种子固定地图）

// 地图种子（用于固定地图生成）
let MAP_SEED = null;
const MAP_SEED_KEY = 'xianxia_map_seed';
const DEFAULT_SEED = '仙路长青';

// 全局配置
const MAP_CONFIG = {
    ROWS: 12,          // 地图行数
    COLS: 16,          // 地图列数
    CELL_SIZE: 40,     // 每个格子像素大小（SVG单位）
    VIEWPORT_ROWS: 8,  // 可见区域行数（可滚动）
    VIEWPORT_COLS: 10, // 可见区域列数
};

// 地形类型
const TERRAIN = {
    PLAIN: { name: '平原', color: '#7cb342', moveCost: 1, symbol: '⬜' },
    FOREST: { name: '森林', color: '#2e7d32', moveCost: 2, symbol: '🌲' },
    MOUNTAIN: { name: '山地', color: '#8d6e63', moveCost: 3, symbol: '⛰️' },
    WATER: { name: '水域', color: '#42a5f5', moveCost: 4, symbol: '🌊' },
    DESERT: { name: '沙漠', color: '#e6c44d', moveCost: 2, symbol: '🏜️' },
    SNOW: { name: '雪地', color: '#e0e0e0', moveCost: 2, symbol: '❄️' },
    FROZEN_LAND: { name: '冻土', color: '#90a4ae', moveCost: 2, symbol: '🧊' },
    VOLCANO: { name: '火山', color: '#d32f2f', moveCost: 3, symbol: '🌋' },
    SWAMP: { name: '沼泽', color: '#558b2f', moveCost: 3, symbol: '🌿' },
    SPIRIT_SPRING: { name: '灵泉', color: '#00bcd4', moveCost: 1, symbol: '⛲' }
};

// 各地区野外地图的地形权重配置
const REGION_TERRAIN_WEIGHTS = {
    // 中州 - 均衡型
    '中州': { PLAIN: 35, FOREST: 20, MOUNTAIN: 15, WATER: 15, DESERT: 10, SNOW: 3, FROZEN_LAND: 2 },
    // 东荒 - 森林多
    '东荒': { PLAIN: 15, FOREST: 40, MOUNTAIN: 15, WATER: 15, SPIRIT_SPRING: 10, SWAMP: 5 },
    // 南疆 - 沼泽火山多
    '南疆': { PLAIN: 10, FOREST: 20, VOLCANO: 20, SWAMP: 25, WATER: 15, MOUNTAIN: 10 },
    // 西漠 - 沙漠多
    '西漠': { DESERT: 45, PLAIN: 20, MOUNTAIN: 15, WATER: 5, FOREST: 5, SWAMP: 10 },
    // 北冥 - 雪地冻土多
    '北冥': { SNOW: 35, FROZEN_LAND: 30, WATER: 15, MOUNTAIN: 10, PLAIN: 5, FOREST: 5 },
    // 蜀地 - 山地多
    '蜀地': { MOUNTAIN: 40, FOREST: 25, PLAIN: 15, WATER: 10, SPIRIT_SPRING: 10, SWAMP: 5 },
    // 东南海域 - 水域多
    '东南海域': { WATER: 40, PLAIN: 15, FOREST: 15, SPIRIT_SPRING: 15, MOUNTAIN: 10, SWAMP: 5 }
};

// 建筑类型（野外地图随机生成，门派已归属城市系统，不在野外生成）
const BUILDINGS = {
    TOWN: { name: '城镇', color: '#ffb300', effect: '休息恢复', symbol: '🏘️' },
    RUIN: { name: '遗迹', color: '#6d4c41', effect: '探索宝物', symbol: '🏛️' },
    CAVE: { name: '洞府', color: '#4e342e', effect: '修炼', symbol: '🕳️' },
    MARKET: { name: '坊市', color: '#fdd835', effect: '交易', symbol: '🏪' },
};

// 全局状态
let currentMap = [];           // 二维数组，每个格子 { terrain, building, explored, x, y }
let playerPos = { x: 0, y: 0 };// 玩家坐标
let viewportOffset = { x: 0, y: 0 }; // 滚动偏移（格子数）
let mapContainer = null;       // SVG容器引用

// 当前所在地区
let currentRegionForMap = null;

// ============ 种子随机数生成器 (Mulberry32) ============
// 使用32位种子生成确定性随机数序列
function createSeededRandom(seed) {
    let s = typeof seed === 'number' ? seed : hashStringToSeed(String(seed));
    return function() {
        s |= 0;
        s = s + 0x6D2B79F5 | 0;
        let t = Math.imul(s ^ s >>> 15, 1 | s);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

// 将字符串哈希为32位整数种子
function hashStringToSeed(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // 转换为32位整数
    }
    return Math.abs(hash);
}

// 获取当前地图种子
function getMapSeed() {
    if (!MAP_SEED) {
        // 尝试从localStorage读取
        try {
            const saved = localStorage.getItem(MAP_SEED_KEY);
            if (saved) {
                MAP_SEED = saved;
            } else {
                MAP_SEED = DEFAULT_SEED + '_' + Date.now().toString(36);
                localStorage.setItem(MAP_SEED_KEY, MAP_SEED);
            }
        } catch(e) {
            MAP_SEED = DEFAULT_SEED + '_' + Math.random().toString(36).substr(2, 8);
        }
    }
    return MAP_SEED;
}

// 设置地图种子（用于新游戏或导入）
function setMapSeed(seed) {
    MAP_SEED = seed;
    try {
        localStorage.setItem(MAP_SEED_KEY, seed);
    } catch(e) {}
    return MAP_SEED;
}

// ============ 种子地图生成（固定种子→固定地图） ============
// 使用种子确保每次生成相同的地图
function generateSeededMap(rows, cols, region, seed) {
    currentRegionForMap = region || null;
    const seedStr = seed || getMapSeed();
    const rng = createSeededRandom(seedStr + '_' + (region || 'default'));
    const map = [];
    
    // 获取该地区的地形权重配置
    const terrainWeights = region && REGION_TERRAIN_WEIGHTS[region]
        ? REGION_TERRAIN_WEIGHTS[region]
        : null;
    
    for (let y = 0; y < rows; y++) {
        const row = [];
        for (let x = 0; x < cols; x++) {
            let terrainKey;
            let terrain;
            
            if (terrainWeights) {
                // 使用地区特定的权重
                const keys = Object.keys(terrainWeights);
                const weights = Object.values(terrainWeights);
                let total = weights.reduce((a, b) => a + b, 0);
                let r = rng() * total;
                let idx = 0;
                for (let i = 0; i < weights.length; i++) {
                    r -= weights[i];
                    if (r <= 0) { idx = i; break; }
                }
                terrainKey = keys[idx];
                terrain = TERRAIN[terrainKey];
            } else {
                // 默认权重
                const terrainKeys = Object.keys(TERRAIN);
                const weights = [35, 25, 15, 15, 10, 5, 3, 3, 2, 2];
                let total = weights.reduce((a, b) => a + b, 0);
                let r = rng() * total;
                let idx = 0;
                for (let i = 0; i < weights.length; i++) {
                    r -= weights[i];
                    if (r <= 0) { idx = i; break; }
                }
                terrainKey = terrainKeys[idx];
                terrain = TERRAIN[terrainKey];
            }

            // 实体生成（使用种子rng保持确定性）
            const entities = [];

            // 建筑（15%概率）
            if (rng() < 0.15) {
                const buildingKeys = Object.keys(BUILDINGS);
                const bKey = buildingKeys[Math.floor(rng() * buildingKeys.length)];
                const bData = BUILDINGS[bKey];
                entities.push({
                    type: 'building',
                    name: bData.name,
                    symbol: bData.symbol,
                    effect: bData.effect,
                    data: bData
                });
            }

            // 人物（20%概率）— 排除亡灵/构装体/元素生物，它们不是可对话的"人"
            if (rng() < 0.20 && typeof generateRandomEnemy === 'function') {
                const level = 1 + Math.floor(rng() * 3);
                const enemyData = generateRandomEnemy(level);
                // 亡灵、构装体、元素生物→归类为怪物，不显示为可对话人物
                const physType = enemyData.physiologyType || 'humanoid';
                if (physType === 'undead' || physType === 'construct' || physType === 'elemental') {
                    entities.push({
                        type: 'beast',
                        name: enemyData.name,
                        symbol: '💀',
                        data: Object.assign({}, enemyData, { isMonster: true })
                    });
                } else {
                    const roll = rng();
                    let personType = 'normal';
                    let symbol = '🧙';
                    let name = enemyData.name;
                    if (roll < 0.25) {
                        personType = 'merchant';
                        symbol = '🛒';
                        name = '游商·' + (enemyData.name || '无名');
                    } else if (roll < 0.45) {
                        personType = 'wanderer';
                        symbol = '🗡️';
                        name = '流浪修士·' + (enemyData.name || '无名');
                    }
                    entities.push({
                        type: 'person',
                        personType: personType,
                        name: name,
                        symbol: symbol,
                        data: Object.assign({}, enemyData, { name: name, personType: personType })
                    });
                }
                // 极小概率(1%)刷新特殊NPC：柳随风
                if (rng() < 0.01 && window.npcManager) {
                    var rivalNpc = window.npcManager.getNPC('rival_01');
                    if (rivalNpc) {
                        entities.push({
                            type: 'person',
                            personType: 'special',
                            name: '柳随风',
                            symbol: '🎭',
                            data: { npcId: 'rival_01', name: '柳随风', personType: 'special', isSpecial: true }
                        });
                    }
                }
            }

            // 野兽（15%概率）
            if (rng() < 0.15 && typeof generateRandomEnemy === 'function') {
                const level = 1 + Math.floor(rng() * 2);
                const beastData = generateRandomEnemy(level, 'beast');
                entities.push({
                    type: 'beast',
                    name: beastData.name,
                    symbol: '🐾',
                    data: beastData
                });
            }

            row.push({
                terrain: terrain,
                entities: entities,
                explored: false,
                x: x,
                y: y,
            });
        }
        map.push(row);
    }

    // 确保玩家起始点周围是平原
    const startX = Math.floor(cols / 2);
    const startY = Math.floor(rows / 2);
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const ny = startY + dy;
            const nx = startX + dx;
            if (ny >= 0 && ny < rows && nx >= 0 && nx < cols) {
                map[ny][nx].terrain = TERRAIN.PLAIN;
                map[ny][nx].entities = [];
            }
        }
    }
    map[startY][startX].explored = true;
    playerPos = { x: startX, y: startY };

    return map;
}

// ============ 兼容旧版：使用Math.random的随机地图生成（保留但标记为deprecated） ============
function generateRandomMap(rows, cols, region) {
    return generateSeededMap(rows, cols, region, getMapSeed());
}

// ============ 渲染地图到SVG ============
function renderMap(svgElement, map, viewX, viewY) {
    if (!svgElement) return;
    const svg = svgElement;
    // 清空svg（保留背景）
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    // 设置viewBox
    const rows = map.length;
    const cols = map[0].length;
    const cellSize = MAP_CONFIG.CELL_SIZE;
    const totalWidth = cols * cellSize;
    const totalHeight = rows * cellSize;

    // 背景
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('width', totalWidth);
    bg.setAttribute('height', totalHeight);
    bg.setAttribute('fill', '#1a1f2e');
    svg.appendChild(bg);

    // 计算可见范围（视口）
    const startX = viewX;
    const startY = viewY;
    const endX = Math.min(startX + MAP_CONFIG.VIEWPORT_COLS, cols);
    const endY = Math.min(startY + MAP_CONFIG.VIEWPORT_ROWS, rows);

    // 绘制每个格子
    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const cell = map[y][x];
            const cx = x * cellSize;
            const cy = y * cellSize;

            // 地形填充
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', cx);
            rect.setAttribute('y', cy);
            rect.setAttribute('width', cellSize);
            rect.setAttribute('height', cellSize);
            rect.setAttribute('fill', cell.terrain.color);
            rect.setAttribute('stroke', '#374151');
            rect.setAttribute('stroke-width', '1');
            if (!cell.explored) {
                rect.setAttribute('fill', '#2d3748'); // 未探索区域暗色
                rect.setAttribute('opacity', '0.7');
            }
            rect.setAttribute('data-x', x);
            rect.setAttribute('data-y', y);
            rect.style.cursor = 'pointer';
            rect.addEventListener('click', () => onCellClick(x, y));
            svg.appendChild(rect);

            // 实体标记（已探索区域）
            if (cell.explored && cell.entities && cell.entities.length > 0) {
                // 显示第一个实体的图标
                const firstEntity = cell.entities[0];
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', cx + cellSize / 2);
                text.setAttribute('y', cy + cellSize / 2 + 4);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('font-size', '16');
                text.setAttribute('pointer-events', 'none');
                text.textContent = firstEntity.symbol;
                svg.appendChild(text);

                // 如果有多个实体，显示数量角标
                if (cell.entities.length > 1) {
                    const badge = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    badge.setAttribute('x', cx + cellSize - 6);
                    badge.setAttribute('y', cy + 12);
                    badge.setAttribute('text-anchor', 'middle');
                    badge.setAttribute('font-size', '10');
                    badge.setAttribute('fill', '#fbbf24');
                    badge.setAttribute('font-weight', 'bold');
                    badge.setAttribute('pointer-events', 'none');
                    badge.textContent = `+${cell.entities.length - 1}`;
                    svg.appendChild(badge);
                }
            } else if (cell.explored) {
                // 显示地形符号
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', cx + cellSize / 2);
                text.setAttribute('y', cy + cellSize / 2 + 4);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('font-size', '12');
                text.setAttribute('pointer-events', 'none');
                text.textContent = cell.terrain.symbol;
                svg.appendChild(text);
            }

            // 玩家标记
            if (x === playerPos.x && y === playerPos.y) {
                const playerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                playerCircle.setAttribute('cx', cx + cellSize / 2);
                playerCircle.setAttribute('cy', cy + cellSize / 2);
                playerCircle.setAttribute('r', '8');
                playerCircle.setAttribute('fill', '#fbbf24');
                playerCircle.setAttribute('stroke', '#fff');
                playerCircle.setAttribute('stroke-width', '2');
                playerCircle.setAttribute('filter', 'url(#glow)');
                svg.appendChild(playerCircle);

                // 玩家文字
                const pText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                pText.setAttribute('x', cx + cellSize / 2);
                pText.setAttribute('y', cy + cellSize / 2 + 2);
                pText.setAttribute('text-anchor', 'middle');
                pText.setAttribute('font-size', '10');
                pText.setAttribute('fill', '#000');
                pText.setAttribute('font-weight', 'bold');
                pText.textContent = '🧙';
                svg.appendChild(pText);
            }
        }
    }

    // 更新信息显示
    updateInfo();
}

// ============ 点击单元格 ============
function onCellClick(x, y) {
    const cell = currentMap[y]?.[x];
    if (!cell) return;

    // 计算距离（曼哈顿距离）
    const dx = Math.abs(x - playerPos.x);
    const dy = Math.abs(y - playerPos.y);
    const dist = dx + dy;

    // 只能移动到相邻格（距离1）
    if (dist === 1) {
        // 检查地形是否可通行（水域不可通行）
        if (cell.terrain === TERRAIN.WATER) {
            showMessage('🌊 水域无法通行！', 'warning');
            return;
        }
        // 移动
        playerPos = { x, y };
        window.playerPos = playerPos; // 同步到全局
        cell.explored = true; // 探索新区域
        
        // 显示相邻水域格子（让玩家看到周围水域，避免撞上）
        const dirs = [{x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0}];
        for (var d = 0; d < dirs.length; d++) {
            var nx = x + dirs[d].x;
            var ny = y + dirs[d].y;
            var neighbor = currentMap[ny]?.[nx];
            if (neighbor && neighbor.terrain === TERRAIN.WATER && !neighbor.explored) {
                neighbor.explored = true;
            }
        }

        // ===== P1-2.1: 消耗时间 =====
        if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
            const moveCost = cell.terrain.moveCost || 1;
            window.timeSystem.advanceTime(moveCost * 10, '野外移动');
        }

        // ===== v9.9: 日常事件（野外）——与奇遇互斥，优先日常 =====
        var dailyFired = false;
        if (window.dailyEvents && typeof window.dailyEvents.tryTriggerDailyEvent === 'function') {
            dailyFired = !!window.dailyEvents.tryTriggerDailyEvent('wilderness', { source: 'move', skipGlobalCd: false });
        }
        // ===== P1-2.2: 触发奇遇（3%概率）——日常未触发时才尝试 =====
        if (!dailyFired && Math.random() < 0.03 && window.eventSystem && typeof window.eventSystem.triggerRandomEvent === 'function') {
            window.eventSystem.triggerRandomEvent();
        }

        // ===== 野兽主动追击（相邻格30%概率） =====
        tryBeastAmbush();

        // 重新渲染地图
        renderMap(mapContainer, currentMap, viewportOffset.x, viewportOffset.y);

        // 更新右侧实体菜单
        if (typeof updateEntityMenu === 'function') {
            updateEntityMenu();
        }
    } else if (dist > 1) {
        alert('每次只能移动一格！');
    } else {
        // 已在原地
    }
}

// ============ 野兽主动追击 ============
// v19.12 P0: 过滤尸体（isDead/hp<=0/isCorpse/_alive===false）
function isEntityDead(e) {
    if (!e) return true;
    if (e.isDead || e.isCorpse) return true;
    if (typeof e.hp === 'number' && e.hp <= 0) return true;
    if (e._alive === false) return true;
    return false;
}

function tryBeastAmbush() {
    if (!currentMap || !playerPos) return;
    const dirs = [
        { x: 0, y: -1 }, { x: 0, y: 1 },
        { x: -1, y: 0 }, { x: 1, y: 0 }
    ];
    for (const d of dirs) {
        const nx = playerPos.x + d.x;
        const ny = playerPos.y + d.y;
        const ncell = currentMap[ny]?.[nx];
        if (!ncell || !ncell.entities) continue;
        // v19.12: 过滤掉尸体，避免尸体扑上来
        const beastIdx = ncell.entities.findIndex(e => e.type === 'beast' && !isEntityDead(e));
        if (beastIdx < 0) continue;
        // 30% 概率主动追击
        if (Math.random() >= 0.3) continue;

        const beast = ncell.entities.splice(beastIdx, 1)[0];
        const cur = currentMap[playerPos.y][playerPos.x];
        cur.entities = cur.entities || [];
        cur.entities.push(beast);
        cur.explored = true;

        if (window.showMessage) {
            window.showMessage(`⚠️ ${beast.name || '野兽'}向你扑来！`, 'warning');
        } else {
            alert(`${beast.name || '野兽'}向你扑来！`);
        }

        // 重新渲染后自动开战
        setTimeout(() => {
            window.currentInteractionEntity = beast;
            if (typeof window.openBattleWithEntity === 'function') {
                window.openBattleWithEntity(beast);
            } else if (typeof openInteraction === 'function') {
                const idx = cur.entities.indexOf(beast);
                if (idx >= 0) openInteraction(idx);
            }
        }, 250);
        break;
    }
}

window.isEntityDead = isEntityDead;

// ============ 获取当前格子实体 ============
function getCurrentCellEntities() {
    const cell = currentMap[playerPos.y]?.[playerPos.x];
    return cell ? (cell.entities || []) : [];
}
window.getCurrentCellEntities = getCurrentCellEntities;
window.tryBeastAmbush = tryBeastAmbush;

// ============ 建筑效果 ============
function triggerBuildingEffect(building) {
    if (!building) return;
    const name = building.name || '建筑';
    const effect = building.effect || '无特殊效果';
    var msg = `${building.symbol || '🏠'} 你来到【${name}】！\n效果：${effect}`;
    
    // 洞府有极小概率遇到神秘老者
    if (building.type === 'CAVE' || name === '洞府') {
        if (Math.random() < 0.05 && window.npcManager) {
            var oldNpc = window.npcManager.getNPC('mysterious_01');
            if (oldNpc) {
                msg += '\n\n🧙 一位神秘老者正在洞府中修炼，他缓缓睁开眼看向你……';
                // 同格添加神秘老者实体
                var cell = window.currentMap && window.playerPos ?
                    window.currentMap[window.playerPos.y]?.[window.playerPos.x] : null;
                if (cell) {
                    cell.entities.push({
                        type: 'person',
                        personType: 'special',
                        name: '神秘老者',
                        symbol: '🧙',
                        data: { npcId: 'mysterious_01', name: '神秘老者', personType: 'special', isSpecial: true }
                    });
                }
            }
        }
    }
    
    if (typeof window.showMessage === 'function') {
        window.showMessage(msg, 'info');
    } else {
        alert(msg);
    }
}

// ============ 更新信息栏 ============
function updateInfo() {
    const infoDiv = document.getElementById('map-info');
    if (!infoDiv) return;
    const cell = currentMap[playerPos.y]?.[playerPos.x];
    const terrainName = cell ? cell.terrain.name : '未知';
    const entityCount = cell && cell.entities ? cell.entities.length : 0;
    infoDiv.textContent = `📍 当前位置 (${playerPos.x}, ${playerPos.y}) | 地形: ${terrainName} | 实体: ${entityCount}`;
}

// ============ 初始化地图 ============
// svgId: SVG容器ID
// region: 地区名称，用于决定地形权重
function initRandomMap(svgId, region) {
    const svg = document.getElementById(svgId);
    if (!svg) {
        console.error('SVG容器未找到');
        return;
    }
    mapContainer = svg;
    // 生成地图（传入地区参数）
    currentMap = generateRandomMap(MAP_CONFIG.ROWS, MAP_CONFIG.COLS, region);
    // 同步到全局（供app.js战斗胜利后标记尸体）
    window.currentMap = currentMap;
    window.playerPos = playerPos;
    // 设置视口居中
    viewportOffset = {
        x: Math.max(0, playerPos.x - Math.floor(MAP_CONFIG.VIEWPORT_COLS / 2)),
        y: Math.max(0, playerPos.y - Math.floor(MAP_CONFIG.VIEWPORT_ROWS / 2)),
    };
    // 确保不超出边界
    viewportOffset.x = Math.min(viewportOffset.x, MAP_CONFIG.COLS - MAP_CONFIG.VIEWPORT_COLS);
    viewportOffset.y = Math.min(viewportOffset.y, MAP_CONFIG.ROWS - MAP_CONFIG.VIEWPORT_ROWS);
    renderMap(svg, currentMap, viewportOffset.x, viewportOffset.y);
    // 初始化实体菜单
    if (typeof updateEntityMenu === 'function') {
        updateEntityMenu();
    }
}

// ============ 区域列表生成（包含“前往”按钮） ============
function generateRegionListWithButtons() {
    // 假设我们为每个区域生成一个随机地图子区域（这里简化，我们将整个地图划分为几个大区）
    // 实际需求：点击“前往”时，将视口移动到对应区域
    const container = document.getElementById('region-list');
    if (!container) return;

    // 定义几个区域名称和坐标范围（基于地图大小）
    const regions = [
        { name: '中州', x: 2, y: 2 },
        { name: '东荒', x: 10, y: 3 },
        { name: '南疆', x: 5, y: 8 },
        { name: '西漠', x: 1, y: 5 },
        { name: '北冥', x: 8, y: 1 },
        { name: '蜀地', x: 3, y: 9 },
    ];

    container.innerHTML = '';
    regions.forEach(region => {
        const item = document.createElement('div');
        item.className = 'region-item px-3 py-2 border-l-3 border-transparent flex justify-between items-center';
        item.innerHTML = `
            <span class="text-sm font-bold text-gray-200">${region.name}</span>
            <button class="text-xs bg-yellow-600 hover:bg-yellow-500 text-gray-900 px-3 py-1 rounded transition" data-target-x="${region.x}" data-target-y="${region.y}">
                前往
            </button>
        `;
        const btn = item.querySelector('button');
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            // 移动视口到该区域
            const targetX = parseInt(btn.dataset.targetX);
            const targetY = parseInt(btn.dataset.targetY);
            // 计算视口偏移使目标在中央
            let newX = targetX - Math.floor(MAP_CONFIG.VIEWPORT_COLS / 2);
            let newY = targetY - Math.floor(MAP_CONFIG.VIEWPORT_ROWS / 2);
            newX = Math.max(0, Math.min(newX, MAP_CONFIG.COLS - MAP_CONFIG.VIEWPORT_COLS));
            newY = Math.max(0, Math.min(newY, MAP_CONFIG.ROWS - MAP_CONFIG.VIEWPORT_ROWS));
            viewportOffset = { x: newX, y: newY };
            renderMap(mapContainer, currentMap, viewportOffset.x, viewportOffset.y);
            // 可选：高亮该区域
        });
        container.appendChild(item);
    });
}

// ============ 前往区域（从地区列表调用） ============
function travelToRegion(regionName) {
    openWildernessMap(regionName);
}

// ============ 打开野外地图（隐藏地区列表+显示地图） ============
function openWildernessMap(regionName) {
    // 显示随机地图区域
    const section = document.getElementById('random-map-section');
    if (section) {
        section.classList.remove('hidden');
    }
    
    // 更新标题
    const titleEl = document.getElementById('random-map-title');
    if (titleEl) {
        titleEl.textContent = '📍 ' + regionName + ' · 野外探索';
    }
    
    // 只隐藏左侧列表（地区/门派列表），保留右侧SVG地图
    var leftSidebar = document.querySelector('.lg\\:w-64');
    if (leftSidebar) {
        leftSidebar._savedDisplay = leftSidebar.style.display;
        leftSidebar.style.display = 'none';
    }
    var md = document.getElementById('map-detail');
    if (md) md.classList.add('hidden');
    var sd = document.getElementById('sect-detail');
    if (sd) sd.classList.add('hidden');
    
    // 初始化/重新生成地图（传入地区参数）
    initRandomMap('random-map-svg', regionName);
    
    // 滚动到地图区域
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ============ 打开城市界面 ============
// cityName: 城市名称
function openCityUI(cityName) {
    if (window.locationSystem && window.locationSystem.travelToCity) {
        window.locationSystem.travelToCity(cityName);
    }
}

// ============ 重新生成地图 ============
function regenerateMap() {
    if (!mapContainer) {
        initRandomMap('random-map-svg', currentRegionForMap);
    } else {
        currentMap = generateRandomMap(MAP_CONFIG.ROWS, MAP_CONFIG.COLS, currentRegionForMap);
        viewportOffset = {
            x: Math.max(0, playerPos.x - Math.floor(MAP_CONFIG.VIEWPORT_COLS / 2)),
            y: Math.max(0, playerPos.y - Math.floor(MAP_CONFIG.VIEWPORT_ROWS / 2)),
        };
        viewportOffset.x = Math.min(viewportOffset.x, MAP_CONFIG.COLS - MAP_CONFIG.VIEWPORT_COLS);
        viewportOffset.y = Math.min(viewportOffset.y, MAP_CONFIG.ROWS - MAP_CONFIG.VIEWPORT_ROWS);
        renderMap(mapContainer, currentMap, viewportOffset.x, viewportOffset.y);
    }
}

// ============ 关闭随机地图（恢复地区列表） ============
function closeRandomMap() {
    const section = document.getElementById('random-map-section');
    if (section) {
        section.classList.add('hidden');
    }
    // 恢复左侧列表
    var leftSidebar = document.querySelector('.lg\\:w-64');
    if (leftSidebar) {
        leftSidebar.style.display = leftSidebar._savedDisplay || '';
    }
}

// ============ 对外暴露函数 ============
window.initRandomMap = initRandomMap;
window.generateRegionListWithButtons = generateRegionListWithButtons;
window.travelToRegion = travelToRegion;
window.regenerateMap = regenerateMap;
window.closeRandomMap = closeRandomMap;
window.openWildernessMap = openWildernessMap;
window.openCityUI = openCityUI;
// 导出到全局，供 app.js 战斗胜利后标记尸体
window.currentMap = currentMap;
window.playerPos = playerPos;
window.currentRegionForMap = currentRegionForMap;
window.REGION_TERRAIN_WEIGHTS = REGION_TERRAIN_WEIGHTS;
window.MAP_SEED_KEY = MAP_SEED_KEY;
window.getMapSeed = getMapSeed;
window.setMapSeed = setMapSeed;
window.generateSeededMap = generateSeededMap;
window.createSeededRandom = createSeededRandom;