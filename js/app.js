// ==================== 仙路长青 - 应用逻辑 ====================

// ===== 全局游戏日志系统 =====
const gameLog = {
    entries: [],
    maxEntries: 100,
    add(message, type = 'info') {
        this.entries.unshift({ message, type, timestamp: Date.now() });
        if (this.entries.length > this.maxEntries) {
            this.entries = this.entries.slice(0, this.maxEntries);
        }
        // 更新UI显示
        const logContainer = document.getElementById('game-log');
        if (logContainer) {
            const entry = document.createElement('div');
            const colors = { success: 'text-green-400', error: 'text-red-400', warning: 'text-yellow-400', info: 'text-gray-300' };
            entry.className = `text-sm ${colors[type] || colors.info} mb-1`;
            entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
            logContainer.insertBefore(entry, logContainer.firstChild);
            // 限制显示数量
            while (logContainer.children.length > 20) {
                logContainer.removeChild(logContainer.lastChild);
            }
        }
    },
    clear() {
        this.entries = [];
        const logContainer = document.getElementById('game-log');
        if (logContainer) logContainer.innerHTML = '';
    }
};
window.gameLog = gameLog;

// ===== gameState 全局状态对象 =====
const gameState = {
    player: null,           // currentCharData
    inventory: null,        // inventory对象
    equipment: null,        // currentEquipment
    skills: null,           // currentSkills
    quests: null,           // playerQuestProgress
    party: null,            // partyData
    sects: null,            // discipleState
    location: null,         // currentLocation
    time: null,             // gameTime
    events: null,           // eventFlags
    achievements: null,     // achievementData
    bodyDurability: null    // bodyDurability
};

// 全局状态
let rootValues = [20, 20, 20, 20, 20];
let selectedGender = 'male';
let currentCharData = null;
let saveSlots = JSON.parse(localStorage.getItem('xianxia_saves') || '[]');

// v9.8：供 global-utils setCurrentCharData / getCurrentCharData 同步词法变量
window._setAppCurrentCharData = function(data) { currentCharData = data; };
window._getAppCurrentCharData = function() { return currentCharData; };

// ==================== 全局依赖导入 ====================
// 注意：data.js, regions.js, sects.js, battle.js 已经将变量导出到 window 对象
// 我们直接使用这些全局变量，不再重新声明 const/let/var
// 以下变量定义在 data.js 中: attributes, combatStats, avoidanceMethods, avoidancePriority, bodyParts, getDurabilityColor, getDurabilityLabel
// 以下变量定义在 regions.js 中: mapData
// 以下变量定义在 sects.js 中: sectsData, sectPositions, sectsByRegion
// 以下变量定义在 battle.js 中: BODY_PARTS, PART_IDS, Entity, Battle, initBodyDurability, generateRandomEnemy

// ==================== 性别选择 ====================
function selectGender(gender) {
    selectedGender = gender;
    document.getElementById('gender-male').classList.toggle('selected', gender === 'male');
    document.getElementById('gender-female').classList.toggle('selected', gender === 'female');
}

// ==================== 属性生成 ====================
function generateAttributeInputs(category, containerId) {
    const container = document.getElementById(containerId);
    attributes[category].forEach(attr => {
        const div = document.createElement('div');
        div.className = 'flex justify-between items-center bg-gray-800 p-2 rounded';
        div.innerHTML = `
            <span class="text-sm text-gray-300">${attr}</span>
            <input type="number" min="0" max="100" value="10" data-attr="${attr}" class="w-16 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-center text-white focus:outline-none focus:border-yellow-500">
        `;
        container.appendChild(div);
    });
}

// ==================== 灵根系统 ====================
let segments, handles, inputs, mutThunder, mutWind, mutIce;
let activeHandleIndex = -1;
let sliderContainer;

function initRootSystem() {
    segments = [
        document.getElementById('seg-metal'), document.getElementById('seg-wood'),
        document.getElementById('seg-water'), document.getElementById('seg-fire'), document.getElementById('seg-earth')
    ];
    handles = [
        document.getElementById('handle-0'), document.getElementById('handle-1'),
        document.getElementById('handle-2'), document.getElementById('handle-3')
    ];
    inputs = Array.from(document.querySelectorAll('.root-input'));
    mutThunder = document.getElementById('mut-thunder');
    mutWind = document.getElementById('mut-wind');
    mutIce = document.getElementById('mut-ice');
    sliderContainer = document.getElementById('root-slider');

    // 拖拽滑块
    handles.forEach(handle => {
        handle.addEventListener('mousedown', (e) => {
            activeHandleIndex = parseInt(e.target.dataset.index);
            e.target.classList.add('active');
            document.body.style.cursor = 'col-resize';
        });
    });

    window.addEventListener('mousemove', (e) => {
        if (activeHandleIndex === -1) return;
        const rect = sliderContainer.getBoundingClientRect();
        let percentage = ((e.clientX - rect.left) / rect.width) * 100;
        percentage = Math.max(0, Math.min(100, percentage));
        let prevCumulative = 0;
        for (let i = 0; i < activeHandleIndex; i++) prevCumulative += rootValues[i];
        let nextCumulative = 100;
        for (let i = 4; i > activeHandleIndex + 1; i--) nextCumulative -= rootValues[i];
        if (percentage < prevCumulative) percentage = prevCumulative;
        if (percentage > nextCumulative) percentage = nextCumulative;
        rootValues[activeHandleIndex] = percentage - prevCumulative;
        rootValues[activeHandleIndex + 1] = nextCumulative - percentage;
        updateRootUI();
    });

    window.addEventListener('mouseup', () => {
        if (activeHandleIndex !== -1) {
            handles[activeHandleIndex].classList.remove('active');
            activeHandleIndex = -1;
            document.body.style.cursor = 'default';
        }
    });

    // 数字输入联动
    inputs.forEach(input => {
        input.addEventListener('change', (e) => {
            let index = parseInt(e.target.dataset.index);
            let newValue = parseFloat(e.target.value);
            if (isNaN(newValue) || newValue < 0) newValue = 0;
            if (newValue > 100) newValue = 100;
            // BUG-5 修复：用整数比例分配 + 最后一项吃差值，保证总和严格=100
            newValue = Math.round(newValue);
            let diff = newValue - rootValues[index];
            if (diff === 0) return;
            let otherIndices = [0, 1, 2, 3, 4].filter(i => i !== index);
            // 其他 4 项需要凑出的目标总和（整数运算）
            let othersTarget = 100 - newValue;
            let currentOthers = otherIndices.reduce((s, i) => s + rootValues[i], 0);
            if (currentOthers < 0.01) {
                // 其他都是 0，平均分配，最后一项吃 round 误差
                let each = Math.floor(othersTarget / 4);
                let lastVal = othersTarget - each * 3;
                otherIndices.forEach((i, idx) => {
                    rootValues[i] = idx === 3 ? lastVal : each;
                });
            } else {
                // 按比例缩放（整数），最后一项吸收差值
                let allocated = 0;
                for (let k = 0; k < 3; k++) {
                    let i = otherIndices[k];
                    let proportion = rootValues[i] / currentOthers;
                    rootValues[i] = Math.round(othersTarget * proportion);
                    allocated += rootValues[i];
                }
                // 最后一项 = 目标 - 已分配（保证总和精确 = 100）
                rootValues[otherIndices[3]] = othersTarget - allocated;
                if (rootValues[otherIndices[3]] < 0) {
                    // 极端情况：已分配 > 目标，需要从已分配的项中扣回
                    // 简单保护：把超出按比例从已分配中减回
                    let excess = -rootValues[otherIndices[3]];
                    for (let k = 0; k < 3 && excess > 0; k++) {
                        let i = otherIndices[k];
                        if (rootValues[i] > 0) {
                            let take = Math.min(rootValues[i], excess);
                            rootValues[i] -= take;
                            excess -= take;
                        }
                    }
                    rootValues[otherIndices[3]] = 0;
                }
            }
            rootValues[index] = newValue;
            updateRootUI();
        });
    });

    updateRootUI();
}

function updateRootUI() {
    let cumulative = 0;
    rootValues.forEach((val, i) => {
        segments[i].style.width = `${val}%`;
        segments[i].textContent = val > 5 ? segments[i].textContent.charAt(0) : '';
    });
    for (let i = 0; i < 4; i++) {
        cumulative += rootValues[i];
        handles[i].style.left = `${cumulative}%`;
    }
    inputs.forEach((input, i) => { input.value = Math.round(rootValues[i]); });
    if (rootValues[0] <= 0) { mutThunder.checked = false; mutThunder.disabled = true; } else { mutThunder.disabled = false; }
    if (rootValues[1] <= 0) { mutWind.checked = false; mutWind.disabled = true; } else { mutWind.disabled = false; }
    if (rootValues[2] <= 0) { mutIce.checked = false; mutIce.disabled = true; } else { mutIce.disabled = false; }
}

// ==================== 游戏世界切换 ====================
function startGame() {
    const charName = document.getElementById('char-name').value.trim();
    if (!charName) {
        alert('请输入修仙者姓名！');
        return;
    }

    // B1：新游戏清空角色级世界状态，避免串档
    if (window.GameState && typeof window.GameState.resetWorldForNewGame === 'function') {
        window.GameState.resetWorldForNewGame();
    } else if (window.GameState && typeof window.GameState.clearCharacterStorage === 'function') {
        window.GameState.clearCharacterStorage({ alsoAccount: false });
    }

    const charData = collectCharacterData(charName);
    // v9.8：统一入口，同步 window.currentCharData + attrs
    if (typeof window.setCurrentCharData === 'function') {
        window.setCurrentCharData(charData);
    } else {
        currentCharData = charData;
        window.currentCharData = charData;
    }

    // v9.2：新角色清空运功栏 + 初始化知识（仅听闻吐纳，不可裸装预设功法）
    if (window.currentSkills) {
        Object.keys(window.currentSkills).forEach(function (k) {
            window.currentSkills[k] = null;
        });
    }
    if (window.KnowledgeSystem && typeof window.KnowledgeSystem.initStarterKnowledge === 'function') {
        window.KnowledgeSystem.initStarterKnowledge();
    } else {
        window.learnedSecrets = [];
    }

    // 新开局：时间重置到第1天 6:00（不读自动时间存档）
    if (typeof window.resetTimeSystem === 'function') {
        window.resetTimeSystem();
    } else if (window.timeSystem?.resetGameTime) {
        window.timeSystem.resetGameTime();
        if (window.timeSystem.updateTimeDisplay) window.timeSystem.updateTimeDisplay();
    }

    document.getElementById('char-creation').style.display = 'none';
    document.getElementById('game-world').style.display = 'flex';

    populateGameWorld(charData);
    switchPanel('character');
    // v9.7 开局刷新真元/历练/真气上限显示
    if (typeof updateCharacterStatus === 'function') {
        updateCharacterStatus();
    }
    // v11.0：Admin检测
    if (window.DebugPanel && typeof window.DebugPanel.checkAdminStatus === 'function') {
        window.DebugPanel.checkAdminStatus();
    }
}

function backToCreation() {
    document.getElementById('game-world').style.display = 'none';
    document.getElementById('char-creation').style.display = 'block';
}

function collectCharacterData(name) {
    const data = {
        name: name,
        gender: selectedGender,
        mainAttributes: {},
        combatSkills: {},
        combatAbilities: [], // v13.1 绝技（COMBAT_ABILITIES 可学池）创建角色兜底空数组
        lifeSkills: {},
        spiritualRoots: {},
        mutatedRoots: {},
        attrs: {},
        // F-13：新角色状态栏字段显式初始化（此前靠 ??100 兜底，mood 偶尔无）
        health: 100, maxHealth: 100,
        energy: 100, maxEnergy: 100,
        qi: 100, maxQi: 100,
        mood: 80, maxMood: 100,
        // 1.5 气运/机缘：luck 影响奇遇触发率与稀有度，fortune 可消耗破机缘
        luck: 50, fortune: 0,
        // F-13 完整版：修真境界/层级/经验/道侣/子嗣/师父/天数/灵石/位置
        // 此前靠散落 `|| '炼气'`/`|| 100` 兜底，集中初始化便于测试与存档
        realm: '炼气', layer: 1, level: 1, exp: 0,
        // 关系
        bonds: {}, _children: [], _masterId: null,
        // 时间/资源
        day: 1, spiritStones: 100, copper: 50,
        // 位置
        currentMap: 'main'
    };
    document.querySelectorAll('#main-attributes-container input').forEach(input => {
        var attrName = input.dataset.attr;
        var val = parseInt(input.value, 10);
        if (isNaN(val)) val = 10;
        // F-12：属性 clamp [0,100]，防手输 999/-5 等非法值
        val = Math.max(0, Math.min(100, val));
        // v9.8：创角界面「智力」写入为「神识」
        if (attrName === '智力') attrName = '神识';
        data.mainAttributes[attrName] = val;
    });
    // 若只有智力无神识，补齐
    if (data.mainAttributes['神识'] == null && data.mainAttributes['智力'] != null) {
        data.mainAttributes['神识'] = data.mainAttributes['智力'];
        delete data.mainAttributes['智力'];
    }
    document.querySelectorAll('#combat-skills-container input').forEach(input => {
        data.combatSkills[input.dataset.attr] = parseInt(input.value, 10) || 0;
    });
    document.querySelectorAll('#life-skills-container input').forEach(input => {
        data.lifeSkills[input.dataset.attr] = parseInt(input.value, 10) || 0;
    });
    data.spiritualRoots = {
        metal: Math.round(rootValues[0]),
        wood: Math.round(rootValues[1]),
        water: Math.round(rootValues[2]),
        fire: Math.round(rootValues[3]),
        earth: Math.round(rootValues[4])
    };
    // F-12：灵根总和归一到 100（防滑块四舍五入致总和 99/101）
    var _rSum = data.spiritualRoots.metal + data.spiritualRoots.wood
        + data.spiritualRoots.water + data.spiritualRoots.fire + data.spiritualRoots.earth;
    if (_rSum !== 100 && _rSum > 0) {
        var _rKeys = ['metal', 'wood', 'water', 'fire', 'earth'];
        var _scale = 100 / _rSum;
        for (var _ri = 0; _ri < _rKeys.length; _ri++) {
            data.spiritualRoots[_rKeys[_ri]] = Math.round(data.spiritualRoots[_rKeys[_ri]] * _scale);
        }
        // 四舍五入误差塞到最大项，保证总和精确=100
        var _rAfter = data.spiritualRoots.metal + data.spiritualRoots.wood
            + data.spiritualRoots.water + data.spiritualRoots.fire + data.spiritualRoots.earth;
        if (_rAfter !== 100) {
            var _mKey = _rKeys[0], _mVal = data.spiritualRoots[_mKey];
            for (var _mj = 1; _mj < _rKeys.length; _mj++) {
                if (data.spiritualRoots[_rKeys[_mj]] > _mVal) { _mVal = data.spiritualRoots[_rKeys[_mj]]; _mKey = _rKeys[_mj]; }
            }
            data.spiritualRoots[_mKey] += (100 - _rAfter);
        }
    }
    data.mutatedRoots = {
        thunder: mutThunder.checked,
        wind: mutWind.checked,
        ice: mutIce.checked
    };
    // v9.8：生成 attrs 英文键
    if (typeof window.syncCharAttrsFromMain === 'function') {
        window.syncCharAttrsFromMain(data);
    } else {
        var am = { '力量': 'strength', '灵巧': 'dexterity', '神识': 'intelligence', '意志': 'willpower', '体质': 'constitution', '经脉': 'meridian' };
        Object.keys(am).forEach(function(cn) {
            data.attrs[am[cn]] = data.mainAttributes[cn] || 10;
        });
    }
    // v20.1 开局出身+天赋：应用资源写入 cd + 存 origin/talent 标识
    if (typeof window.applyOriginTalentToCharData === 'function') {
        try { window.applyOriginTalentToCharData(data); } catch (e) {}
    }
    return data;
}

function populateGameWorld(charData) {
    if (charData?.name) window.playerName = charData.name;

    document.getElementById('display-name').textContent = charData.name;
    document.getElementById('display-gender').textContent = charData.gender === 'male' ? '♂ 男修' : '♀ 女修';

    const mainContainer = document.getElementById('char-main-attr');
    const combatContainer = document.getElementById('char-combat-attr');
    const lifeContainer = document.getElementById('char-life-attr');
    const rootsContainer = document.getElementById('char-roots');

    mainContainer.innerHTML = '';
    combatContainer.innerHTML = '';
    lifeContainer.innerHTML = '';
    rootsContainer.innerHTML = '';

    // 渲染战斗属性（v9.8：动态 getCombatStatsForPanel，禁止 default）
    const combatStatsContainer = document.getElementById('char-combat-stats');
    if (combatStatsContainer) {
        combatStatsContainer.innerHTML = '';
        var panelStats = null;
        if (typeof window.getCombatStatsForPanel === 'function') {
            panelStats = window.getCombatStatsForPanel(null);
        }
        // 战斗属性说明
        var combatStatTooltips = {
            'attack': '基础攻击力，受力量/武器/功法影响',
            'defense': '基础防御力，受体质/护甲/功法影响',
            'speed': '影响战斗行动顺序和闪避',
            'hit': '攻击命中目标的概率',
            'dodge': '闪避敌人攻击的概率',
            'block': '格挡成功时减免部分伤害，需持盾或特定武器',
            'parry': '化解攻击，完全规避伤害并可能触发反击',
            'crit': '触发暴击的概率，暴击造成额外伤害',
            'critDmg': '暴击时造成的伤害倍率',
            'counter': '成功闪避/格挡后发动反击的概率',
            'penetrate': '无视目标护甲防御的百分比',
            'toughness': '降低敌人暴击对自己的伤害和暴击率',
            'poisonRes': '对毒素伤害和负面效果的抗性'
        };
        if (panelStats && panelStats.length) {
            panelStats.forEach(function(stat) {
                var val = stat.value;
                var suffix = stat.suffix || '';
                var note = stat.note || '';
                var barMax = (suffix === '%') ? 100 : Math.max(100, val);
                var tooltipText = combatStatTooltips[stat.id] || stat.name + '属性';
                combatStatsContainer.innerHTML +=
                    '<div class="flex justify-between items-center bg-gray-800 p-2 rounded">' +
                    '<div class="flex items-center gap-2">' +
                    '<span class="text-gray-300 text-sm">' + (stat.icon || '') + ' ' + stat.name + '</span>' +
                    '<button onclick="showTooltip(\'' + stat.name + ': ' + tooltipText + '\')" class="w-3.5 h-3.5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center hover:bg-blue-400 cursor-help" style="font-size:9px;line-height:1">?</button>' +
                    (note ? '<span class="text-xs text-gray-500">' + note + '</span>' : '') +
                    '</div>' +
                    '<div class="flex items-center gap-2">' +
                    '<div class="w-24 h-2 bg-gray-600 rounded overflow-hidden">' +
                    '<div class="h-full bg-red-500 rounded" style="width:' + Math.min(100, (val / barMax) * 100) + '%"></div>' +
                    '</div>' +
                    '<span class="text-red-400 font-bold w-14 text-right text-xs">' + val + suffix + '</span>' +
                    '</div></div>';
            });
        } else if (typeof combatStats !== 'undefined') {
            // 回退：旧 default（仅 combat-stats 未加载时）
            combatStats.forEach(function(stat) {
                var val = stat.default;
                var suffix = stat.suffix || '';
                combatStatsContainer.innerHTML +=
                    '<div class="flex justify-between items-center bg-gray-800 p-2 rounded">' +
                    '<span class="text-gray-300 text-sm">' + stat.icon + ' ' + stat.name + '</span>' +
                    '<span class="text-red-400 font-bold text-xs">' + val + suffix + '</span></div>';
            });
        }
    }

    // 渲染回避优先级
    renderAvoidancePriority();

    // 主要属性说明（v9.8：智力显示为神识）
    const mainAttrTooltips = {
        '力量': '物理攻击、格挡概率、装备负荷能力',
        '灵巧': '命中、速度、闪避',
        '神识': '化解攻击、精确部位命中（原智力）',
        '智力': '化解攻击、精确部位命中（已更名为神识）',
        '意志': '部分防御、疼痛抵抗、精神抗性',
        '体质': '防御、韧性、精力、自然恢复、毒抗',
        '经脉': '真气上限、真气恢复、内功发挥'
    };
    for (const [key, val] of Object.entries(charData.mainAttributes)) {
        const tooltip = mainAttrTooltips[key] || '';
        mainContainer.innerHTML += `
            <div class="flex justify-between items-center bg-gray-800 p-2 rounded">
                <div class="flex items-center gap-2">
                    <span class="text-gray-300">${key}</span>
                    ${tooltip ? `<button onclick="showTooltip('${key}: ${tooltip}')" class="w-3.5 h-3.5 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-400 cursor-help" style="font-size:9px;line-height:1">?</button>` : ''}
                </div>
                <div class="flex items-center gap-2">
                    <div class="w-32 h-2 bg-gray-600 rounded overflow-hidden">
                        <div class="h-full bg-yellow-500 rounded" style="width:${val}%"></div>
                    </div>
                    <span class="text-yellow-400 font-bold w-8 text-right">${val}</span>
                </div>
            </div>`;
    }
    
    // 战斗技能说明
    const combatSkillTooltips = {
        '内功': '提升内功攻击力和真气运用',
        '轻功': '提升移动速度和闪避率',
        '绝技': '特殊技能，造成高额伤害',
        '拳掌': '拳脚功夫，近战攻击',
        '剑法': '剑术技巧，精准攻击',
        '刀法': '刀术技巧，威力巨大',
        '长兵': '长枪、长矛等长武器技巧',
        '奇门': '奇门兵器技巧（斧、钺等）',
        '射术': '弓箭等远程攻击技巧'
    };
    for (const [key, val] of Object.entries(charData.combatSkills)) {
        const tooltip = combatSkillTooltips[key] || '';
        combatContainer.innerHTML += `
            <div class="flex justify-between items-center bg-gray-800 p-2 rounded">
                <div class="flex items-center gap-2">
                    <span class="text-gray-300">${key}</span>
                    ${tooltip ? `<button onclick="showTooltip('${key}: ${tooltip}')" class="w-3.5 h-3.5 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-400 cursor-help" style="font-size:9px;line-height:1">?</button>` : ''}
                </div>
                <div class="flex items-center gap-2">
                    <div class="w-32 h-2 bg-gray-600 rounded overflow-hidden">
                        <div class="h-full bg-green-500 rounded" style="width:${val}%"></div>
                    </div>
                    <span class="text-green-400 font-bold w-8 text-right">${val}</span>
                </div>
            </div>`;
    }
    
    // 生活技能说明
    const lifeSkillTooltips = {
        '医术': '治疗伤势，炼制丹药',
        '毒术': '配制和使用毒药',
        '学识': '提升领悟力和鉴定物品',
        '口才': '影响NPC交互和交易价格',
        '采伐': '采集木材，建造材料',
        '种植': '种植灵药和农作物',
        '锻造': '打造和强化武器防具',
        '炼制': '炼制丹药和符箓',
        '烹饪': '制作食物提供临时增益'
    };
    for (const [key, val] of Object.entries(charData.lifeSkills)) {
        const tooltip = lifeSkillTooltips[key] || '';
        lifeContainer.innerHTML += `
            <div class="flex justify-between items-center bg-gray-800 p-2 rounded">
                <div class="flex items-center gap-2">
                    <span class="text-gray-300">${key}</span>
                    ${tooltip ? `<button onclick="showTooltip('${key}: ${tooltip}')" class="w-3.5 h-3.5 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-400 cursor-help" style="font-size:9px;line-height:1">?</button>` : ''}
                </div>
                <div class="flex items-center gap-2">
                    <div class="w-32 h-2 bg-gray-600 rounded overflow-hidden">
                        <div class="h-full bg-blue-500 rounded" style="width:${val}%"></div>
                    </div>
                    <span class="text-blue-400 font-bold w-8 text-right">${val}</span>
                </div>
            </div>`;
    }

    // 灵根 - 共用一条百分比条
    const rootNamesFull = ['金', '木', '水', '火', '土'];
    const rootColorClasses = ['text-yellow-400', 'text-green-400', 'text-blue-400', 'text-red-400', 'text-amber-500'];
    const rootBgClasses = ['bg-metal', 'bg-wood', 'bg-water', 'bg-fire', 'bg-earth'];
    const mutations = ['雷', '风', '冰', null, null];
    const mutChecked = [charData.mutatedRoots.thunder, charData.mutatedRoots.wind, charData.mutatedRoots.ice, false, false];
    const rootValuesArr = [charData.spiritualRoots.metal, charData.spiritualRoots.wood, charData.spiritualRoots.water, charData.spiritualRoots.fire, charData.spiritualRoots.earth];

    // 更新共用条
    const charSegs = ['char-seg-metal', 'char-seg-wood', 'char-seg-water', 'char-seg-fire', 'char-seg-earth'];
    rootValuesArr.forEach((val, i) => {
        const seg = document.getElementById(charSegs[i]);
        if (seg) {
            seg.style.width = `${val}%`;
            seg.textContent = val > 5 ? rootNamesFull[i] : '';
        }
    });

    // 下方文字列表
    rootValuesArr.forEach((val, i) => {
        let mutationHtml = '';
        if (mutations[i] && mutChecked[i]) {
            mutationHtml = `<span class="text-purple-400 text-xs ml-2">✦ 异变:${mutations[i]}</span>`;
        }
        rootsContainer.innerHTML += `
            <div class="flex justify-between items-center bg-gray-800 p-2 rounded">
                <span class="${rootColorClasses[i]} font-bold text-sm">${rootNamesFull[i]}灵根</span>
                <div class="flex items-center gap-2">
                    <span class="${rootColorClasses[i]} font-bold w-10 text-right">${val}%</span>
                    ${mutationHtml}
                </div>
            </div>`;
    });

    // 初始化状态 → 委托给 updateCharacterStatus 统一管理
    // 各栏初始值由 charData 提供，不再硬编码

    // 初始化身体耐久度
    renderBodyDurability();
    
    // 初始化门派UI
    if (typeof updateSectUI === 'function') {
        updateSectUI();
    }
}

// ==================== 身体状态渲染 ====================
let bodyDurability = {}; // { brain: 100, eyes: 100, ... }

// 初始化身体耐久度（用于人物面板显示）
// 躯体耐久默认100/100，与属性无关
function initCharacterBodyDurability() {
    bodyParts.forEach(part => {
        bodyDurability[part.id] = 100;
    });
}

function renderBodyDurability() {
    if (Object.keys(bodyDurability).length === 0) initCharacterBodyDurability();

    // v13.2：战斗外伤势摘要（流血/中毒/疼痛/神魂震荡——数据源 _playerPhysiology，与存档同源）
    (function updateWoundStatusLine() {
        var el = document.getElementById('wound-status-line');
        if (!el) return;
        var ent = window._playerPhysiology;
        var phys = ent && ent.physiology;
        if (!phys) { el.textContent = '✅ 气血通畅'; el.style.color = '#94a3b8'; return; }
        var bleeding = 0;
        (phys.wounds || []).forEach(function (w) {
            if (w && w.bleeding && !w.stabilized) bleeding++;
        });
        var parts = [];
        if (bleeding > 0) parts.push('🩸 流血×' + bleeding);
        if ((phys.poisonLoad || 0) > 0) parts.push('☠️ 中毒 ' + Math.round(phys.poisonLoad));
        if ((phys.painLoad || 0) >= 30) parts.push('😣 疼痛 ' + Math.round(phys.painLoad));
        if ((phys.neuralShock || 0) >= 30) parts.push('💫 神魂震荡 ' + Math.round(phys.neuralShock));
        var deepCount = 0;
        (phys.wounds || []).forEach(function (w) {
            if (w && !w.bleeding && (w.depth || 0) >= 3 && (w.severity || 0) > 20) deepCount++;
        });
        if (deepCount > 0) parts.push('🩹 深伤×' + deepCount + '（需就医馆）');
        if (parts.length > 0) {
            el.textContent = '当前伤势：' + parts.join(' · ');
            el.style.color = '#f87171';
        } else {
            el.textContent = '✅ 气血通畅，无活动伤势';
            el.style.color = '#94a3b8';
        }
    })();

    // 渲染部位耐久列表（列表缺失时仍更新 SVG）
    const listContainer = document.getElementById('body-durability-list');
    if (listContainer) {
        listContainer.innerHTML = '';
        bodyParts.forEach(part => {
            const value = bodyDurability[part.id] || 100;
            const color = getDurabilityColor(value);
            const label = getDurabilityLabel(value);
            listContainer.innerHTML += `
            <div class="flex justify-between items-center bg-gray-800 p-2 rounded">
                <div class="flex items-center gap-2">
                    <span class="text-gray-300 text-sm font-bold">${part.name}</span>
                    <span class="text-xs text-gray-500 hidden md:inline">${part.desc || ''}</span>
                </div>
                <div class="flex items-center gap-2">
                    <div class="w-24 h-2 bg-gray-600 rounded overflow-hidden">
                        <div class="h-full rounded" style="width:${value}%; background:${color};"></div>
                    </div>
                    <span class="font-bold w-8 text-right text-xs" style="color:${color}">${Math.round(value)}</span>
                    <span class="text-xs w-16 text-right" style="color:${color}">${label}</span>
                </div>
            </div>`;
        });
    }

    // 更新状态面板 SVG 人体图颜色（必须执行）
    updateBodySVG();
}

function _setSvgPartFill(el, color, extraStroke) {
    if (!el) return;
    try {
        el.setAttribute('fill', color);
        // 同时写 style，避免被 CSS/旧 style 覆盖
        el.style.fill = color;
        if (extraStroke) {
            el.setAttribute('stroke', extraStroke);
            el.style.stroke = extraStroke;
        }
    } catch (e) {}
}

function updateBodySVG() {
    if (Object.keys(bodyDurability).length === 0) return;
    const colorFn = (typeof getDurabilityColor === 'function')
        ? getDurabilityColor
        : (typeof window.getDurabilityColor === 'function' ? window.getDurabilityColor : function () { return '#22c55e'; });

    // 同步 head：无独立 head 耐久时用 brain 近似
    if (bodyDurability.head == null && bodyDurability.brain != null) {
        bodyDurability.head = bodyDurability.brain;
    }

    bodyParts.forEach(part => {
        const value = bodyDurability[part.id] != null ? bodyDurability[part.id] : 100;
        const color = colorFn(value);

        if (part.id === 'eyes') {
            _setSvgPartFill(document.getElementById('body-eyes-left'), color);
            _setSvgPartFill(document.getElementById('body-eyes-right'), color);
            _setSvgPartFill(document.getElementById('body-eyes'), color);
        } else if (part.id === 'dantian') {
            _setSvgPartFill(document.getElementById('body-dantian'), color, value >= 50 ? '#fbbf24' : '#ef4444');
        } else {
            _setSvgPartFill(document.getElementById('body-' + part.id), color);
        }
    });
}

// ==================== 回避优先级系统 ====================
function renderAvoidancePriority() {
    const container = document.getElementById('avoidance-priority-list');
    if (!container) return;
    container.innerHTML = '';

    // 使用模块级别的 avoidancePriority 和 avoidanceMethods 变量
    const localPriority = [...avoidancePriority]; // 创建副本以避免修改原始引用
    const localMethods = avoidanceMethods;
    
    localPriority.forEach((methodId, index) => {
        const method = localMethods.find(m => m.id === methodId);
        if (!method) return;

        // 计算累计惩罚
        let totalPenalty = 0;
        for (let i = 0; i < index; i++) {
            const prevMethod = localMethods.find(m => m.id === localPriority[i]);
            if (prevMethod) totalPenalty += prevMethod.penalty;
        }

        const div = document.createElement('div');
        div.className = 'flex items-center gap-2 bg-gray-800 p-2 rounded';
        div.innerHTML = `
            <span class="text-xs text-gray-500 w-4">${index + 1}</span>
            <span class="flex-1 text-sm text-gray-200 font-bold">${method.icon} ${method.name}</span>
            <span class="text-xs text-gray-500 w-16 text-right">惩罚: -${totalPenalty}%</span>
            <button class="text-xs bg-gray-600 hover:bg-gray-500 text-gray-300 px-1.5 py-0.5 rounded avoidance-up-btn" data-index="${index}" ${index === 0 ? 'disabled style="opacity:0.3"' : ''}>▲</button>
            <button class="text-xs bg-gray-600 hover:bg-gray-500 text-gray-300 px-1.5 py-0.5 rounded avoidance-down-btn" data-index="${index}" ${index === localPriority.length - 1 ? 'disabled style="opacity:0.3"' : ''}>▼</button>
        `;
        container.appendChild(div);

        // 上移按钮
        const upBtn = div.querySelector('.avoidance-up-btn');
        if (upBtn && index > 0) {
            upBtn.addEventListener('click', () => {
                // 与上一个位置交换
                const temp = localPriority[index - 1];
                localPriority[index - 1] = localPriority[index];
                localPriority[index] = temp;
                // 同步回模块级别变量和 window
                avoidancePriority.splice(0, avoidancePriority.length, ...localPriority);
                window.avoidancePriority = localPriority;
                renderAvoidancePriority();
            });
        }

        // 下移按钮
        const downBtn = div.querySelector('.avoidance-down-btn');
        if (downBtn && index < localPriority.length - 1) {
            downBtn.addEventListener('click', () => {
                // 与下一个位置交换
                const temp = localPriority[index + 1];
                localPriority[index + 1] = localPriority[index];
                localPriority[index] = temp;
                // 同步回模块级别变量和 window
                avoidancePriority.splice(0, avoidancePriority.length, ...localPriority);
                window.avoidancePriority = localPriority;
                renderAvoidancePriority();
            });
        }
    });

    // 显示总惩罚说明
    const totalPenalty = localPriority.reduce((sum, id, i) => {
        const m = localMethods.find(m => m.id === id);
        return sum + (m ? m.penalty : 0);
    }, 0);
    const infoEl = document.getElementById('avoidance-info');
    if (!infoEl) {
        const info = document.createElement('p');
        info.id = 'avoidance-info';
        info.className = 'text-xs text-gray-500 mt-2';
        info.textContent = `总惩罚基数: ${totalPenalty}% | 实际成功率 = 基础回避率 - 累计惩罚`;
        container.parentElement.appendChild(info);
    } else {
        infoEl.textContent = `总惩罚基数: ${totalPenalty}% | 实际成功率 = 基础回避率 - 累计惩罚`;
    }
}

// ==================== 面板切换 ====================
function switchPanel(panelId) {
    if (window.PanelLifecycle && typeof window.PanelLifecycle.beforeMainSwitch === 'function') {
        window.PanelLifecycle.beforeMainSwitch(panelId);
    }
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    var navItem = document.querySelector('.nav-item[data-panel="' + panelId + '"]');
    if (navItem) navItem.classList.add('active');

    document.querySelectorAll('.panel-content').forEach(function(p) { p.classList.add('hidden'); });
    var panel = document.getElementById('panel-' + panelId);
    if (panel) {
        panel.classList.remove('hidden');
        panel.classList.add('fade-in');
    }

    if (panelId === 'character') {
        switchSubTab('status');
        if (typeof renderBodyDurability === 'function') renderBodyDurability();
    }
    if (panelId === 'equipment') {
        if (typeof renderEquipmentPanel === 'function') renderEquipmentPanel();
        if (typeof updateEquippedStats === 'function') updateEquippedStats();
    }
    if (panelId === 'inventory') {
        if (typeof updateInventoryUI === 'function') updateInventoryUI();
        if (typeof updateCurrencyUI === 'function') updateCurrencyUI();
    }
    if (panelId === 'skills') {
        if (typeof updateCultivationUI === 'function') updateCultivationUI();
    }
    // 新面板刷新
    if (panelId === 'quests') {
        if (typeof updateQuestUI === 'function') updateQuestUI();
        if (typeof updateMainQuestUI === 'function') updateMainQuestUI();
        if (typeof updateDailyQuestUI === 'function') updateDailyQuestUI();
    }
    if (panelId === 'factions') {
        renderFactionList();
    }
    if (panelId === 'beasts') {
        renderBeastList();
        renderBeastTemplates();
    }
    if (panelId === 'house') {
        renderHouseStatus();
    }
    if (panelId === 'activities') {
        refreshActivitiesPanel();
    }
    // 地图主视图恢复：进入门派/城市会隐藏地图 flex 容器，切走再切回时兜底恢复（防空白）
    if (panelId === 'map') {
        if (typeof restoreMapMainView === 'function') {
            try { restoreMapMainView(); } catch (eRestore) {}
        }
    }
    // v18.9 世界日程面板
    if (panelId === 'calendar') {
        if (window.WorldCalendarUI && typeof window.WorldCalendarUI.renderCalendarPanel === 'function') {
            window.WorldCalendarUI.renderCalendarPanel();
        }
        if (window.WorldCalendarUI && typeof window.WorldCalendarUI.updateNextAuctionBadge === 'function') {
            window.WorldCalendarUI.updateNextAuctionBadge();
        }
    }
    // v11.0：Admin调试面板检测
    if (panelId === 'settings') {
        if (window.DebugPanel && typeof window.DebugPanel.renderDebugPanel === 'function') {
            window.DebugPanel.renderDebugPanel();
        }
        var debugPanel = document.getElementById('debug-panel');
        if (debugPanel) {
            var isAdmin = window._isAdmin || (window.currentCharData && window.currentCharData.name && window.currentCharData.name.toLowerCase() === 'admin');
            debugPanel.style.display = isAdmin ? 'block' : 'none';
        }
    }
}

function switchSubTab(subId) {
    // 人脉子标签切换时渲染关系面板
    if (subId === 'relations' && typeof renderRelationsPanel === 'function') {
        renderRelationsPanel();
    }
    document.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.sub-tab[data-sub="${subId}"]`).classList.add('active');
    document.querySelectorAll('.sub-content').forEach(c => c.classList.add('hidden'));
    document.getElementById('sub-' + subId).classList.remove('hidden');
}

// ==================== 地图交互 ====================
function selectProvince(name) {
    const data = mapData[name];
    if (!data) return;
    document.getElementById('map-detail').classList.remove('hidden');
    document.getElementById('map-detail-title').textContent = name;
    document.getElementById('map-detail-sub').textContent = '主要城市: ' + data.cities.join('、');
    document.getElementById('map-detail-desc').textContent = data.desc;

    document.querySelectorAll('.map-province').forEach(p => {
        p.style.opacity = '0.5';
        p.style.stroke = '#4b5563';
        p.style.strokeWidth = '1.5';
    });
    const provEl = document.querySelector(`[data-province="${name}"]`);
    if (provEl) {
        provEl.style.opacity = '1';
        provEl.style.stroke = '#fbbf24';
        provEl.style.strokeWidth = '3';
    }
}

// ============ 城市/门派设施定义 ============
const CITY_FACILITIES = {
    'shop': { name: '坊市', icon: '💰', color: 'text-yellow-400', action: 'openCityShop', desc: '购买和出售物品' },
    'medicine_shop': { name: '药铺', icon: '💊', color: 'text-green-400', action: 'openMedicineShop', desc: '丹药草药' },
    'talisman_shop': { name: '符箓店', icon: '📜', color: 'text-purple-400', action: 'openTalismanShop', desc: '符箓道具' },
    'weapon_shop': { name: '兵器铺', icon: '⚔️', color: 'text-red-400', action: 'openWeaponShopCity', desc: '兵器刀剑' },
    'armor_shop': { name: '防具铺', icon: '🛡️', color: 'text-blue-400', action: 'openArmorShopCity', desc: '防具护甲' },
    'art_shop': { name: '功法阁', icon: '📚', color: 'text-indigo-400', action: 'openArtShop', desc: '功法秘籍' },
    'beast_shop': { name: '灵兽坊', icon: '🐾', color: 'text-amber-400', action: 'openBeastShop', desc: '灵兽相关' },
    'auction': { name: '拍卖行', icon: '🔨', color: 'text-pink-400', action: 'openAuctionHouse', desc: '挂牌拍卖物品' },
    'alchemy': { name: '炼丹房', icon: '⚗️', color: 'text-lime-400', action: 'openAlchemyRoom', desc: '炼制丹药' },
    'forging': { name: '铁匠铺', icon: '⚒️', color: 'text-orange-400', action: 'openForgingShop', desc: '锻造和强化装备' },
    'enchant_shop': { name: '附魔店', icon: '✨', color: 'text-pink-400', action: 'openEnchantShop', desc: '装备附魔' },
    'quest': { name: '任务堂', icon: '📜', color: 'text-blue-400', action: 'openQuestHall', desc: '接取和交付任务' },
    'inn': { name: '客栈', icon: '🏨', color: 'text-purple-400', action: 'restAtInn', desc: '休息恢复状态' },
    'training': { name: '演武场', icon: '⚔️', color: 'text-red-400', action: 'startTraining', desc: '练习战斗获取经验' },
    'teleport': { name: '传送阵', icon: '🌀', color: 'text-cyan-400', action: 'showTeleportUI', desc: '传送到其他城市' },
    'tavern': { name: '酒楼', icon: '🍶', color: 'text-amber-400', action: 'visitTavern', desc: '与NPC交谈获取情报' },
    'tea_house': { name: '茶馆', icon: '🍵', color: 'text-emerald-400', action: 'visitTeaHouse', desc: '品茶听闻' },
    'guild_hall': { name: '公会大厅', icon: '🏛️', color: 'text-yellow-300', action: 'openGuildHall', desc: '公会与悬赏' },
    'cultivation': { name: '洞府', icon: '🧘', color: 'text-indigo-400', action: 'startCultivation', desc: '静心修炼提升修为' },
    'library': { name: '藏经阁', icon: '📖', color: 'text-cyan-300', action: 'openLibrary', desc: '阅览典籍' },
    'spring': { name: '灵泉', icon: '⛲', color: 'text-teal-400', action: 'useSpring', desc: '沐浴灵泉全面恢复' },
    'temple': { name: '寺庙', icon: '🛕', color: 'text-yellow-600', action: 'visitTemple', desc: '祈福祷告净化身心' },
    'arena': { name: '竞技场', icon: '🏟️', color: 'text-red-500', action: 'enterArena', desc: '与其他修士切磋' },
    'gathering': { name: '药园', icon: '🌿', color: 'text-green-500', action: 'gatherHerbs', desc: '采集灵药' },
    'mining': { name: '矿脉', icon: '⛏️', color: 'text-amber-500', action: 'mineOre', desc: '开采矿石' },
    'market': { name: '黑市', icon: '🌙', color: 'text-gray-400', action: 'openBlackMarket', desc: '非法交易' },
    'blackmarket': { name: '黑市', icon: '🌙', color: 'text-gray-400', action: 'openBlackMarket', desc: '非法交易' },
    // === 第一批：新增设施（基础功能，8个） ===
    'household_registry': { name: '户籍司', icon: '📋', color: 'text-amber-300', action: 'openHouseholdRegistry', desc: '查询居民户籍信息' },
    'fire_department': { name: '消防司', icon: '🔥', color: 'text-red-400', action: 'openFireDepartment', desc: '消防安全咨询' },
    'bounty_hall': { name: '悬赏楼', icon: '🎯', color: 'text-yellow-400', action: 'openBountyHall', desc: '查看悬赏任务' },
    'tax_bureau': { name: '税课司', icon: '💰', color: 'text-green-400', action: 'openTaxBureau', desc: '税务管理与咨询' },
    'granary': { name: '粮仓', icon: '🌾', color: 'text-amber-600', action: 'openGranary', desc: '粮食储备查看' },
    'court': { name: '司法堂', icon: '⚖️', color: 'text-blue-400', action: 'openCourt', desc: '纠纷调解与诉讼' },
    'exorcist_bureau': { name: '镇邪司', icon: '⛩️', color: 'text-purple-400', action: 'openExorcistBureau', desc: '处理邪祟异常' },
    'medical_clinic': { name: '医馆', icon: '🏥', color: 'text-green-400', action: 'openMedicalClinic', desc: '诊断治疗疑难杂症' },
    // === 第二批：情境设施（13个） ===
    'money_house': { name: '钱庄', icon: '🏦', color: 'text-yellow-500', action: 'openMoneyHouse', desc: '抵押贷款、存储灵石' },
    'contract_hall': { name: '契约所', icon: '📜', color: 'text-amber-400', action: 'openContractHall', desc: '签订法契，保障交易' },
    'escort_office': { name: '镖局', icon: '🚩', color: 'text-red-400', action: 'openEscortOffice', desc: '押送货物赚取酬劳' },
    'charity_hall': { name: '善堂', icon: '🏮', color: 'text-red-300', action: 'openCharityHall', desc: '捐赠获取功德' },
    'arena_stage': { name: '斗法台', icon: '⚔️', color: 'text-orange-400', action: 'openArenaStage', desc: '公开比武赢取奖金' },
    'observatory': { name: '观星台', icon: '🔭', color: 'text-indigo-400', action: 'openObservatory', desc: '观测天象预知机缘' },
    'stele_forest': { name: '碑林', icon: '🪦', color: 'text-gray-400', action: 'openSteleForest', desc: '参悟先贤碑文' },
    'oddity_museum': { name: '异闻馆', icon: '📚', color: 'text-purple-400', action: 'openOddityMuseum', desc: '查阅奇闻异事' },
    'pawn_shop': { name: '当铺', icon: '🔨', color: 'text-amber-600', action: 'openPawnShop', desc: '典当物品换取灵石' },
    'auction_house': { name: '拍卖行', icon: '🔨', color: 'text-pink-400', action: 'openAuctionHouse', desc: '寄售、竞拍与查看成交' },
    'black_market': { name: '黑市', icon: '🌙', color: 'text-gray-400', action: 'openBlackMarket2', desc: '高风险非法交易' },
    'garden_villa': { name: '园林别苑', icon: '🌺', color: 'text-green-400', action: 'openGardenVilla', desc: '高端社交以文会友' },
    // === 第二批：官府设施（基础功能，2个） ===
    'works_bureau': { name: '工曹署', icon: '🏗️', color: 'text-stone-400', action: 'openWorksBureau', desc: '工程营造与地脉规划' },
    'salt_iron_office': { name: '盐铁局', icon: '⚒️', color: 'text-cyan-400', action: 'openSaltIronOffice', desc: '战略物资管控' }
};

// 门派设施定义
const SECT_FACILITIES = [
    { id: 'sect_training', name: '演武场', icon: '⚔️', desc: '练习门派武学，提升熟练度', action: 'sectTrain' },
    { id: 'sect_cultivation', name: '修炼洞府', icon: '🧘', desc: '消耗贡献租用洞府修炼', action: 'sectCultivate' },
    { id: 'sect_alchemy', name: '炼丹房', icon: '💊', desc: '使用门派资源炼制丹药', action: 'openCraftingUI' },
    { id: 'sect_forging', name: '铸剑阁', icon: '⚒️', desc: '锻造门派专属装备', action: 'openEnhancementUI' },
    { id: 'sect_library', name: '藏经阁', icon: '📚', desc: '学习门派功法和秘籍', action: 'openSectLibrary' },
    { id: 'sect_quest', name: '任务堂', icon: '📜', desc: '接取门派任务获得贡献', action: 'openSectQuestUI' },
    { id: 'sect_medical', name: '医馆', icon: '🏥', desc: '恢复状态，治疗伤势', action: 'sectHeal' },
    { id: 'sect_exchange', name: '贡献兑换', icon: '🔄', desc: '用贡献兑换稀有物品', action: 'openSectExchange' }
];

// ============ 选择城市（点击城市名只显示简介） ============
function selectCity(cityName, provinceName) {
    // 高亮省份
    document.querySelectorAll('.map-province').forEach(p => {
        p.style.opacity = '0.5';
        p.style.stroke = '#4b5563';
        p.style.strokeWidth = '1.5';
    });
    const provEl = document.querySelector(`[data-province="${provinceName}"]`);
    if (provEl) {
        provEl.style.opacity = '1';
        provEl.style.stroke = '#fbbf24';
        provEl.style.strokeWidth = '3';
    }

    // 标准化城市名（去除空格，HTML中"帝都 · 长安"→cityData中"帝都·长安"）
    const normalizedName = cityName.replace(/\s+/g, '');
    const cityInfo = window.locationSystem && window.locationSystem.cityData
        ? window.locationSystem.cityData[normalizedName] || window.locationSystem.cityData[cityName] : null;

    // 隐藏门派详情
    document.getElementById('sect-detail')?.classList.add('hidden');

    // 只显示城市简介：名称 + 所属 + 描述
    document.getElementById('map-detail').classList.remove('hidden');
    const data = mapData[provinceName];
    document.getElementById('map-detail-title').textContent = cityName;
    document.getElementById('map-detail-sub').textContent = '所属: ' + provinceName;
    // 城市描述优先使用 cityData，回退到 mapData 地区描述
    var descText = cityInfo ? cityInfo.desc : (data ? data.desc : '');
    document.getElementById('map-detail-desc').textContent = descText;
    document.getElementById('facilities-list').innerHTML = '';
}

// ============ 选择门派（点击门派名只显示介绍，不进入面板） ============
function selectSect(name) {
    // 只显示门派介绍（类似大地区点击显示介绍），不进入面板
    const sect = sectsData[name];
    if (!sect) return;
    document.getElementById('sect-detail').classList.remove('hidden');
    document.getElementById('sect-detail-name').textContent = name;
    document.getElementById('sect-detail-type').textContent = sect.type;
    document.getElementById('sect-detail-type').className = `inline-block px-3 py-1 rounded-full text-xs font-bold mt-2 ${
        sect.type === '正道' ? 'bg-green-900 text-green-400' :
        sect.type === '邪派' ? 'bg-red-900 text-red-400' :
        'bg-yellow-900 text-yellow-400'
    }`;
    document.getElementById('sect-detail-location').textContent = sect.location;
    document.getElementById('sect-detail-power').textContent = sect.power;
    document.getElementById('sect-detail-weapons').textContent = sect.weapons;
    document.getElementById('sect-detail-desc').textContent = sect.desc;
    renderSectFacilitiesList(name);
    document.querySelectorAll('.map-sect').forEach(s => { s.style.opacity = '0.4'; });
    document.querySelectorAll('.map-city').forEach(c => { c.style.opacity = '0.4'; });
    document.querySelectorAll('.map-province').forEach(p => { p.style.opacity = '0.4'; });
}

// ============ 渲染设施列表 ============
function renderFacilitiesList(containerId, facilityIds, type) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!facilityIds || facilityIds.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm">暂无可用设施</p>';
        return;
    }
    
    facilityIds.forEach(facilityId => {
        const facility = CITY_FACILITIES[facilityId];
        if (!facility) return;
        
        const div = document.createElement('div');
        div.className = 'p-3 bg-gray-800 rounded border border-gray-700 hover:border-yellow-600 transition cursor-pointer';
        div.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <span class="text-xl">${facility.icon}</span>
                    <div>
                        <p class="font-bold ${facility.color}">${facility.name}</p>
                        <p class="text-xs text-gray-500">${facility.desc}</p>
                    </div>
                </div>
                <button onclick="executeFacilityAction('${facility.action}', '${type}')"
                        class="bg-yellow-600 hover:bg-yellow-500 text-gray-900 px-3 py-1 rounded text-sm font-bold">
                    使用
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

// ============ 渲染门派设施列表 ============
function renderSectFacilitiesList(sectName) {
    const container = document.getElementById('sect-facilities-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    SECT_FACILITIES.forEach(facility => {
        const div = document.createElement('div');
        div.className = 'p-3 bg-gray-800 rounded border border-gray-700 hover:border-yellow-600 transition cursor-pointer';
        div.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <span class="text-xl">${facility.icon}</span>
                    <div>
                        <p class="font-bold text-blue-400">${facility.name}</p>
                        <p class="text-xs text-gray-500">${facility.desc}</p>
                    </div>
                </div>
                <button onclick="executeSectFacilityAction('${facility.action}', '${sectName}')"
                        class="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm font-bold">
                    使用
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

// ============ 执行设施动作（城市） ============
function executeFacilityAction(action, type) {
    console.log('[设施] 调用动作:', action, '类型:', type);
    var map = {
        openShop: function() { if (window.openShop) window.openShop(type || 'general'); },
        openForgingShop: function() { if (window.openEnhancementHall) window.openEnhancementHall(); else if (window.openEnhancementUI) window.openEnhancementUI(); },
        openEnhancementUI: function() { if (window.openEnhancementHall) window.openEnhancementHall(); else if (window.openEnhancementUI) window.openEnhancementUI(); },
        openCraftingUI: function() { if (window.openCraftingUI) window.openCraftingUI(type || 'pilfer'); },
        openAlchemyRoom: function() { if (window.openCraftingUI) window.openCraftingUI('pilfer'); },
        openQuestHall: function() { if (window.openQuestHall) window.openQuestHall(); },
        startCultivation: function() { if (typeof startCultivation === 'function') startCultivation(); },
        performBreakthrough: function() { if (window.performBreakthrough) window.performBreakthrough(); },
        startTraining: function() { if (typeof startTraining === 'function') startTraining(); },
        enterArena: function() { if (window.startBattle) window.startBattle('training_dummy'); },
        gatherHerbs: function() { if (window.gatherHerbs) window.gatherHerbs(); },
        mineOre: function() { if (window.mineOre) window.mineOre(); },
        openBlackMarket: function() { if (window.openHiddenShop) window.openHiddenShop(); else if (window.openShop) window.openShop('special'); },
        goFishing: function() { if (window.goFishing) window.goFishing('river'); }
    };
    if (map[action]) { map[action](); return; }
    if (typeof window[action] === 'function') {
        window[action]();
    } else {
        showMessage('暂无对应设施动作：' + action, 'info');
    }
}


function executeSectFacilityAction(action, sectName) {
    switch(action) {
        case 'sectTrain':
            startTraining();
            break;
        case 'sectCultivate':
            startCultivation();
            break;
        case 'openCraftingUI':
            if (window.showCraftingUI) {
                window.showCraftingUI('pilfer');
            }
            break;
        case 'openEnhancementUI':
            if (window.openEnhancementUI) {
                window.openEnhancementUI();
            }
            break;
        case 'openSectLibrary':
            showMessage(`打开${sectName}藏经阁...`, 'info');
            break;
        case 'openSectQuestUI':
            if (window.questSystem && window.questSystem.showQuestPanel) {
                window.questSystem.showQuestPanel();
            }
            break;
        case 'sectHeal':
            showMessage(`${sectName}医馆为您治疗...`, 'info');
            if (window.currentCharData) {
                currentCharData.health = currentCharData.maxHealth || 100;
                currentCharData.qi = currentCharData.maxQi || 100;
                if (window.updateCharacterStatus) window.updateCharacterStatus();
            }
            break;
        case 'openSectExchange':
            showMessage(`打开${sectName}贡献兑换...`, 'info');
            break;
        default:
            showMessage(`执行 ${action}...`, 'info');
    }
}

// ============ 设施功能函数 ============
function restAtInn() {
    if (!currentCharData) {
        showMessage('请先创建角色', 'warning');
        return;
    }
    // B5：小憩 2 小时部分恢复；住宿推进到次日并恢复资源（不自动治重伤）
    const cost = 10;
    var stones = 0;
    if (window.XianXia && window.XianXia.DataManager) stones = window.XianXia.DataManager.getSpiritStones();
    else stones = (window.inventory && window.inventory.currency && window.inventory.currency.spiritStones) || 0;
    if (stones < cost) {
        showMessage('需要' + cost + '灵石（当前：' + stones + '）', 'error');
        return;
    }
    if (window.XianXia && window.XianXia.DataManager) window.XianXia.DataManager.deductSpiritStones(cost);
    else if (window.inventory && window.inventory.currency) window.inventory.currency.spiritStones -= cost;

    var maxH = currentCharData.maxHealth || 100;
    var maxQ = currentCharData.maxQi || 100;
    var maxE = currentCharData.maxEnergy || 100;
    // P0-4 恢复分级化：客栈=精力/真气可满，生命部分恢复(+40%上限)，部位耐久少量(+10)，危急伤仅提示就医
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(480, '客栈住宿');
    }
    currentCharData.qi = maxQ;
    currentCharData.energy = maxE;
    currentCharData.health = Math.min(maxH, (currentCharData.health || 0) + Math.floor(maxH * 0.4));
    try { if (typeof window.restoreBodyDurability === 'function') window.restoreBodyDurability(10); } catch (e) {}
    // 危急伤检测（流血/危重伤口非睡觉可愈）
    var _hasCriticalWound = false;
    try {
        var _peW = window._playerEntity && window._playerEntity.physiology && window._playerEntity.physiology.wounds;
        if (_peW) {
            _hasCriticalWound = _peW.some(function (w) { return w && (w.bleeding || w.severity === 'critical'); });
        }
    } catch (e) {}
    // 城市休息加成
    try {
        var bonus = (typeof window.getCityBonus === 'function') ? window.getCityBonus() : {};
        if (bonus && bonus.recovery) {
            currentCharData.energy = Math.min(maxE, currentCharData.energy + Math.floor(10 * (bonus.recovery - 1)));
        }
    } catch (e) {}
    if (Math.random() < 0.05 && window.eventSystem && typeof window.eventSystem.triggerRandomEvent === 'function') {
        window.eventSystem.triggerRandomEvent();
    }
    showMessage(
        _hasCriticalWound
            ? '客栈住了一宿，精力真气尽复——但身上有危急伤势，安睡无法痊愈，请尽快前往医馆！'
            : '客栈住了一宿，精力真气尽复，伤势略有好转（重伤请前往医馆诊治）',
        _hasCriticalWound ? 'warning' : 'success'
    );
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    if (window.updateCurrencyUI) window.updateCurrencyUI();
}

function startTraining() {
    if (!currentCharData) {
        showMessage('请先创建角色', 'warning');
        return;
    }
    // P0-5：残魂态禁止演武
    if (window.checkSoulBlock && window.checkSoulBlock('演武')) return;
    
    const energy = currentCharData.energy !== undefined ? currentCharData.energy : 100;
    
    if (energy < 20) {
        showMessage(`精力不足（当前：${energy}）`, 'error');
        return;
    }
    
    currentCharData.energy = energy - 20;
    const expGain = 10 + Math.floor(Math.random() * 10);
    currentCharData.tempering = (currentCharData.tempering || 0) + expGain;
    
    // P1-2.1: 时间推进
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(60, '演武场训练');
    }
    // 演武场训练获得历练
    
    showMessage(`在演武场训练获得 ${expGain} 点经验`, 'success');
    if (window.updateCharacterStatus) window.updateCharacterStatus();
}

// ============ 洞府界面 ============
// 修炼时长配置
var CULTIVATE_DURATIONS = [
    { id: 'short', label: '5分钟', shortLabel: '5m', minutes: 5, multiplier: 1, qiCost: 5 },
    { id: 'half', label: '半小时', shortLabel: '30m', minutes: 30, multiplier: 6.5, qiCost: 20 },
    { id: 'hour', label: '一时辰', shortLabel: '2h', minutes: 120, multiplier: 27, qiCost: 60 },
    { id: 'five_hour', label: '五时辰', shortLabel: '10h', minutes: 600, multiplier: 140, qiCost: 200 },
    { id: 'day', label: '一天', shortLabel: '24h', minutes: 1440, multiplier: 350, qiCost: 400 }
];

var _selectedDuration = CULTIVATE_DURATIONS[0]; // 默认5分钟
window.CULTIVATE_DURATIONS = CULTIVATE_DURATIONS;

// 展开/收起时长选择
function toggleDurationGrid() {
    window._durExpanded = !window._durExpanded;
    var grid = document.getElementById('dur-grid');
    if (grid) grid.classList.toggle('hidden');
}

// 选择时长并开始修炼
function selectDuration(id) {
    window._durExpanded = false;
    cultivationMeditate(id);
}

function startCultivation() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    
    var durHtml = _renderDurationSelector();
    var content = '<p class="text-gray-300 mb-4">选择修炼方式：</p>';
    content += '<div class="mb-3">' + durHtml + '</div>';
    content += `
        <button onclick="this.closest('.fixed').remove(); if(typeof window._performBreakthroughNew==='function')window._performBreakthroughNew(); else if(typeof performBreakthrough==='function')performBreakthrough();" class="w-full bg-yellow-700 hover:bg-yellow-600 p-3 rounded text-left">
            <span class="text-yellow-400 font-bold">⬆️ 尝试突破</span><br>
            <span class="text-xs text-gray-400">真元达标+历练达标+真气≥80%</span>
        </button>
        <button onclick="this.closest('.fixed').remove(); if(window.openGuideQiMiniGame)openGuideQiMiniGame(); else if(window.guideQiCultivation)guideQiCultivation();" class="w-full bg-cyan-700 hover:bg-cyan-600 p-3 rounded text-left mt-2">
            <span class="text-cyan-400 font-bold">🌊 引导灵气</span><br>
            <span class="text-xs text-gray-400">提升本次修炼效率</span>
        </button>
        <button onclick="this.closest('.fixed').remove(); if(window.openLongRetreatUI)window.openLongRetreatUI();" class="w-full bg-indigo-900 hover:bg-indigo-800 p-3 rounded text-left mt-2">
            <span class="text-indigo-300 font-bold">🔒 长期闭关</span><br>
            <span class="text-xs text-gray-400">七日 / 一月 / 一季，世界与NPC照常运转</span>
        </button>
    `;
    
    modal.innerHTML = `
        <div class="bg-gray-900 border-2 border-indigo-500 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 class="text-xl font-bold text-indigo-400 mb-4">🧘 洞府</h3>
            ${content}
            <button onclick="this.closest('.fixed').remove()" class="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded mt-3">关闭</button>
        </div>
    `;
    document.body.appendChild(modal);
}

// 渲染时长选择器
function _renderDurationSelector() {
    var sel = _selectedDuration;
    var shortLabel = sel.shortLabel;
    var expanded = window._durExpanded ? '' : 'hidden';
    var gridHtml = '<div id="dur-grid" class="grid grid-cols-2 gap-1.5 mt-1 ' + expanded + '">';
    CULTIVATE_DURATIONS.forEach(function(d, idx) {
        if (idx === 0) {
            // 第一列第一格已被展开按钮占位，跳过
            return;
        }
        gridHtml += '<button onclick="selectDuration(\'' + d.id + '\')" class="bg-indigo-700 hover:bg-indigo-600 text-white py-1.5 px-2 rounded text-xs text-center">' + d.label + '</button>';
    });
    gridHtml += '</div>';
    
    return '<div class="bg-gray-800 rounded-lg p-2">' +
        '<button onclick="toggleDurationGrid()" class="flex items-center gap-2 w-full text-left">' +
        '<span class="text-indigo-400 font-bold text-sm">🧘 打坐修炼</span>' +
        '<span class="text-xs text-gray-400 ml-auto">' + (window._durExpanded ? '▲' : '▼') + ' <span class="text-indigo-300">' + shortLabel + '</span></span>' +
        '</button>' +
        gridHtml +
        '</div>';
}

// 修炼主体函数（带时长参数）
function cultivationMeditate(durationId) {
    if (!window.currentCharData) {
        showMessage('请先创建角色', 'warning');
        return;
    }
    // P0-5：残魂态禁止修炼
    if (window.checkSoulBlock && window.checkSoulBlock('修炼')) return;
    // 同步局部变量，防止存档加载后数据不同步
    currentCharData = window.currentCharData;
    var dur = durationId ? CULTIVATE_DURATIONS.find(function(d) { return d.id === durationId; }) : _selectedDuration;
    if (!dur) dur = CULTIVATE_DURATIONS[0];
    
    var qiCost = dur.qiCost;
    if ((currentCharData.qi || 0) < qiCost) {
        showMessage('真气不足！需要至少' + qiCost + '真气', 'error');
        return;
    }
    currentCharData.qi -= qiCost;
    
    let bonus = 1.0;
    if (window.timeSystem && typeof window.timeSystem.getCultivationSpeedBonus === 'function') {
        bonus = window.timeSystem.getCultivationSpeedBonus();
    }
    // 灵根变异修炼加成
    let mutationBonus = 1.0;
    let mutationText = '';
    if (currentCharData.mutatedRoots?.thunder) {
        mutationBonus *= (typeof getRootMutationBonus === 'function' ? getRootMutationBonus('thunder_cultivation') : 1.05);
        mutationText += '雷灵根+5% ';
    }
    if (currentCharData.mutatedRoots?.wind) {
        mutationBonus *= (typeof getRootMutationBonus === 'function' ? getRootMutationBonus('wind_cultivation') : 1.05);
        mutationText += '风灵根+5% ';
    }
    if (currentCharData.mutatedRoots?.ice) {
        mutationBonus *= (typeof getRootMutationBonus === 'function' ? getRootMutationBonus('ice_cultivation') : 1.05);
        mutationText += '冰灵根+5% ';
    }
    // 结拜加成
    if (typeof getBondBonuses === 'function') {
        const bond = getBondBonuses();
        if (bond.cultivation > 1) {
            mutationBonus *= bond.cultivation;
            mutationText += '结拜+15% ';
        }
    }
    let _bonusAll = bonus * mutationBonus;
    if (typeof window.getHouseBonus === 'function') {
        try { _bonusAll *= (window.getHouseBonus('cultivation') || 1); } catch(e) {}
    }
    if (typeof window.getCultivationSpeedBonusFromQi === 'function') {
        try { _bonusAll *= (window.getCultivationSpeedBonusFromQi() || 1); } catch(e) {}
    }
    if (typeof window.getActiveWorldEventModifiers === 'function') {
        try {
            var _wm2 = window.getActiveWorldEventModifiers();
            if (_wm2 && _wm2.cultivation) _bonusAll *= _wm2.cultivation;
        } catch(e) {}
    }
    // P0-3 修炼过程化（温和版）：主修功法吸纳加成（运功栏内功槽有功法则+10%）
    var mainSkillId = (window.currentSkills && window.currentSkills.skill_main) || null;
    var mainSkillDef = (mainSkillId && typeof window.findSkillById === 'function') ? window.findSkillById(mainSkillId) : null;
    if (mainSkillDef) {
        _bonusAll *= 1.10;
        mutationText += '主修功法+10% ';
    }
    // v9.6.2 灵根简化：灵根值% = 修炼速度%
    let rootExpBase = 30;
    if (typeof window.calculateCultivationExpFromRoots === 'function') {
        try {
            rootExpBase = window.calculateCultivationExpFromRoots(currentCharData, 30);
            const roots = currentCharData.spiritualRoots;
            const element = (typeof window.getRootSpeedMultiplier === 'function')
                ? (function() { try { return window._getMainTechniqueElement ? window._getMainTechniqueElement() : 'neutral'; } catch(e) { return 'neutral'; } })()
                : 'neutral';
            if (roots && element !== 'neutral') {
                var val = roots[element] || 0;
                if (val > 0) mutationText += '匹配灵根+' + val + '% ';
            }
        } catch (e) {
            rootExpBase = 30;
        }
    }
    // 修炼产出真元（按时长倍率）
    let essenceGain = 0;
    if (typeof window.getEssenceGainByRealm === 'function' && typeof window.getRealmIndex === 'function') {
        const realmIndex = window.getRealmIndex(currentCharData.realm);
        const baseGain = window.getEssenceGainByRealm(realmIndex);
        // 0.2.2：灵根元素匹配——改用单元素根倍率（主修功法元素），替代平均根
        // 此前 rootExpBase 算了单元素但 essenceGain 用 getRootCultivationBonus(平均)，金灵根100用金系/水系功法真元产出一样
        // rootExpBase = 30 * getRootSpeedMultiplier(roots, 主修元素)，提取倍率
        const rootMul = (rootExpBase && rootExpBase > 0) ? (rootExpBase / 30) : (typeof window.getRootCultivationBonus === 'function' ? window.getRootCultivationBonus() : 1.0);
        // P0-3 修复：季节/变异灵根/结拜/洞府/灵气环境/世界事件/主修功法加成此前计算后从未使用（假效果），现真实接入
        essenceGain = Math.floor(baseGain * rootMul * dur.multiplier * _bonusAll);
        // 1.7 前世记忆：主修功法是前世功法则修炼更快（+30%）
        var _plmMul = (typeof window.pastLifeSkillBonus === 'function') ? window.pastLifeSkillBonus(mainSkillId) : 1.0;
        if (_plmMul !== 1) essenceGain = Math.floor(essenceGain * _plmMul);
        // v20.1 出身天赋：灵机真元 +10%
        var _teMul = (typeof window.talentEssenceMul === 'function') ? window.talentEssenceMul(currentCharData) : 1.0;
        if (_teMul !== 1) essenceGain = Math.floor(essenceGain * _teMul);
        // 1.9 丹毒惩罚：高丹毒降修炼效率（50丹毒-25%、100丹毒-50%）
        var _ppPen = (typeof window.getPillPoisonPenalty === 'function') ? window.getPillPoisonPenalty() : 0;
        if (_ppPen > 0) essenceGain = Math.floor(essenceGain * (1 - _ppPen));
        currentCharData.essence = (currentCharData.essence || 0) + essenceGain;
        // 2.1 走火入魔：真气枯竭强行修炼/丹毒侵蚀→气机紊乱
        if (typeof window.addQiDeviation === 'function') {
            var _qdAdd = 0;
            if ((currentCharData.qi || 0) < 20) _qdAdd += 5;
            if (typeof window.getPillPoison === 'function' && window.getPillPoison() > 50) _qdAdd += 3;
            // v20.1 出身天赋：道心走火 -30%
            if (_qdAdd > 0 && typeof window.talentHeartDemonMul === 'function') {
                _qdAdd = Math.max(0, Math.round(_qdAdd * window.talentHeartDemonMul(currentCharData)));
            }
            if (_qdAdd > 0) window.addQiDeviation(_qdAdd);
        }
    }
    // 时间推进
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(dur.minutes, '打坐修炼');
    }
    // 奇遇触发（根据时长概率 × 气运：luck 50→1.0倍，100→1.5倍，0→0.5倍）
    var _lk = (currentCharData.luck != null ? currentCharData.luck : 50);
    if (Math.random() < (0.05 * (0.5 + _lk / 100)) * dur.multiplier && window.eventSystem && typeof window.eventSystem.triggerRandomEvent === 'function') {
        window.eventSystem.triggerRandomEvent();
    }
    // P0-3：周天计数与主修功法熟练度增长（每半小时一个周天）
    var cycles = Math.max(1, Math.round(dur.minutes / 30));
    var cycleText = '';
    if (mainSkillId && typeof window.addProficiencyExp === 'function') {
        try {
            window.addProficiencyExp(mainSkillId, cycles);
            cycleText = '，运转周天×' + cycles + '（' + (mainSkillDef ? mainSkillDef.name : '主修功法') + ' 熟练+' + cycles + '）';
        } catch (e) {}
    }
    showMessage(`打坐修炼 ${dur.label} 完成，真元+${essenceGain}${cycleText}${mutationText ? '（' + mutationText.trim() + '）' : ''}`, 'success');
    if (window.updateCharacterStatus) window.updateCharacterStatus();

    const modal = document.querySelector('.fixed.inset-0.bg-black\\/70');
    if (modal) modal.remove();

    // 0.2.3 瓶颈接线：修炼后自检是否进入瓶颈（applyBottleneckEffect 此前零调用，瓶颈形同虚设）
    // 仅在首次进入瓶颈时弹出突破方式面板，避免已在瓶颈中每次修炼都弹窗打扰
    try {
        var _wasIn = window.playerBottleneck && window.playerBottleneck.isInBottleneck;
        if (typeof window.applyBottleneckEffect === 'function' && window.applyBottleneckEffect() &&
            !_wasIn && typeof window.attemptBreakBottleneck === 'function') {
            window.attemptBreakBottleneck();
        }
    } catch (e) {}
}

function useSpring() {
    if (!window.currentCharData) return;
    currentCharData.health = currentCharData.maxHealth || 100;
    currentCharData.qi = currentCharData.maxQi || 100;
    currentCharData.energy = currentCharData.maxEnergy || 100;
    // P1-2.1: 时间推进
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(60, '灵泉沐浴');
    }
    showMessage('沐浴灵泉，状态完全恢复！', 'success');
    if (window.updateCharacterStatus) window.updateCharacterStatus();
}

// P1-2.5: 使用enhanced-shop.js的商店系统
// ============ 城市商店界面（v7.2 分城动态货架） ============
function openCityShop(shopType) {
    shopType = shopType || 'general';
    var city = (window.locationSystem && window.locationSystem.getCurrentLocation && window.locationSystem.getCurrentLocation())
        || (window.currentCharData && window.currentCharData.location) || '帝都·长安';

    if (typeof window.ensureCityShop === 'function' && window.shopManager) {
        if (!window.shopManager.getShop || !window.shopManager.getAllShops || window.shopManager.getAllShops().length === 0) {
            if (typeof window.initShopSystem === 'function') window.initShopSystem();
        }
        var shopId = window.ensureCityShop(city, shopType);
        if (shopId && window.shopManager.openShop(shopId)) return;
    }

    // 仍可打开通用店
    if (window.shopManager && typeof window.shopManager.openShop === 'function') {
        if (typeof window.initShopSystem === 'function' && !window.shopManager.getShop('shop_general')) {
            window.initShopSystem();
        }
        var fallback = shopType === 'weapon' ? 'shop_weapon'
            : shopType === 'armor' ? 'shop_armor'
            : shopType === 'alchemy' || shopType === 'medicine' ? 'shop_alchemy'
            : shopType === 'art' || shopType === 'book' ? 'shop_book'
            : 'shop_general';
        if (window.shopManager.getShop(fallback)) {
            window.shopManager.openShop(fallback);
            return;
        }
        window.shopManager.openShop('shop_general');
        return;
    }

    showMessage('商店系统未就绪', 'error');
}

function openTypedCityShop(shopType) {
    openCityShop(shopType || 'general');
}


// ============ 从城市商店购买 ============
function buyFromCityShop(itemId, itemName, price) {
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(5, '坊市购买');
    }
    if (Math.random() < 0.05 && window.eventSystem && typeof window.eventSystem.triggerRandomEvent === 'function') {
        window.eventSystem.triggerRandomEvent();
    }

    if (!window.inventory) {
        showMessage('背包系统未初始化', 'error');
        return;
    }
    if (!window.inventory.currency) {
        window.inventory.currency = { copper: 0, spiritStones: 0 };
    }

    const stones = window.inventory.currency.spiritStones || 0;
    if (stones < price) {
        showMessage(`灵石不足！（需要${price}，当前${stones}）`, 'error');
        return;
    }

    let added = false;
    if (typeof window.addItem === 'function') {
        added = !!window.addItem(itemId, 1);
    }
    if (!added && window.inventory.slots) {
        for (const slot of window.inventory.slots) {
            if (slot && slot.templateId === itemId) {
                slot.count += 1;
                added = true;
                break;
            }
        }
        if (!added) {
            for (let i = 0; i < window.inventory.slots.length; i++) {
                if (!window.inventory.slots[i]) {
                    window.inventory.slots[i] = { templateId: itemId, name: itemName, count: 1 };
                    added = true;
                    break;
                }
            }
        }
    }
    if (!added) {
        showMessage('背包已满！', 'error');
        return;
    }

    window.inventory.currency.spiritStones = stones - price;
    if (window.currentCharData) currentCharData.spiritStones = window.inventory.currency.spiritStones;
    // v16.4 丐帮污衣戒律标记：「不行银钱购物」——真实购买行为留痕，供戒律抽查判定
    try {
        var gbfMark = window.discipleState && window.discipleState._gbFaction;
        if (gbfMark && gbfMark.side === 'dirty') gbfMark.buyMarks = (gbfMark.buyMarks || 0) + 1;
    } catch (eGbf) {}

    showMessage(`购买了 ${itemName}（-${price}灵石）`, 'success');
    if (window.updateInventoryUI) window.updateInventoryUI();
    if (window.updateCurrencyUI) window.updateCurrencyUI();
    if (window.updateCharacterStatus) window.updateCharacterStatus();

    document.querySelectorAll('.fixed.inset-0').forEach(m => m.remove());
    openCityShop();
}

// ============ 寺庙界面 ============
function visitTemple() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    
    let content = '<p class="text-gray-300 mb-4">选择要进行的操作：</p>';
    content += `
        <button onclick="templePray(); this.closest('.fixed').remove();" class="w-full bg-yellow-700 hover:bg-yellow-600 p-3 rounded mb-2 text-left">
            <span class="text-yellow-400 font-bold">🙏 祈福祷告</span><br>
            <span class="text-xs text-gray-400">净化负面状态，获得神明庇佑</span>
        </button>
        <button onclick="templeMeditate(); this.closest('.fixed').remove();" class="w-full bg-orange-700 hover:bg-orange-600 p-3 rounded text-left">
            <span class="text-orange-400 font-bold">🧘 寺中静修</span><br>
            <span class="text-xs text-gray-400">获得真元</span>
        </button>
    `;
    
    modal.innerHTML = `
        <div class="bg-gray-900 border-2 border-yellow-600 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 class="text-xl font-bold text-yellow-500 mb-4">🛕 寺庙</h3>
            ${content}
            <button onclick="this.closest('.fixed').remove()" class="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded mt-3">关闭</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function templePray() {
    if (!window.currentCharData) {
        showMessage('请先创建角色', 'warning');
        return;
    }
    const karma = currentCharData.karma || 0;
    if (karma < -50) {
        showMessage('恶孽深重，无法祈福...', 'warning');
        return;
    }
    currentCharData.blessing = (currentCharData.blessing || 0) + 1;
    // P1-2.1: 时间推进
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(30, '寺庙祈福');
    }
    showMessage('在寺庙中祈福，获得神明庇佑！', 'success');
}

function templeMeditate() {
    if (!window.currentCharData) {
        showMessage('请先创建角色', 'warning');
        return;
    }
    if ((currentCharData.qi || 0) < 10) {
        showMessage('真气不足！', 'error');
        return;
    }
    currentCharData.qi -= 10;
    currentCharData.essence = (currentCharData.essence || 0) + 20;
    // P1-2.1: 时间推进
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(60, '寺中静修');
    }
    showMessage('在寺中静修，获得20点真元', 'success');
    if (window.updateCharacterStatus) window.updateCharacterStatus();
}

function visitTavern() {
    if ((currentCharData.copper || 0) < 20) {
        showMessage('需要20铜钱', 'error');
        return;
    }
    // F-17：铜钱统一走 DataManager（此前 charData-only，读 inventory 致数值错）
    if (window.XianXia && window.XianXia.DataManager && typeof window.XianXia.DataManager.deductCopper === 'function') {
        window.XianXia.DataManager.deductCopper(20);
    } else {
        currentCharData.copper = Math.max(0, (currentCharData.copper || 0) - 20);
    }
    // P1-2.2: 奇遇触发（30%概率）
    if (Math.random() < 0.3 && window.eventSystem && typeof window.eventSystem.triggerRandomEvent === 'function') {
        window.eventSystem.triggerRandomEvent();
    }
    const intel = ['最近山贼活动频繁', '听说某地发现了秘境', '坊市物价上涨', '某门派正在招收弟子', '北方出现了稀有灵药'];
    showMessage(`在酒楼听到了情报：${intel[Math.floor(Math.random() * intel.length)]}`, 'info');
    // P1-2.1: 时间推进
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(30, '酒楼听情报');
    }
    if (window.updateCharacterStatus) window.updateCharacterStatus();
}

function showTeleportUI() {
    const cities = Object.keys(window.locationSystem.cityData || {}).filter(c => c !== window.locationSystem.getCurrentLocation());
    if (cities.length === 0) {
        showMessage('没有其他城市可传送', 'warning');
        return;
    }
    let html = '<p class="text-sm text-gray-400 mb-2">选择传送目的地（100灵石/次）：</p><div class="space-y-2">';
    cities.forEach(city => {
        html += `<button onclick="teleportToCity('${city}')" class="w-full bg-cyan-700 hover:bg-cyan-600 p-2 rounded text-left text-sm">
            ${city} <span class="text-xs text-gray-400">[${window.locationSystem.cityData[city].region}]</span>
        </button>`;
    });
    html += '</div>';
    if (typeof window.showBuildingEffectDialog === 'function') window.showBuildingEffectDialog('传送阵', html);
}

function teleportToCity(cityName) {
    // F-40：传送扣 100 灵石（此前 showTeleportUI 显示成本但 teleportToCity 不扣）
    var _tpCost = 100;
    if (window.XianXia && window.XianXia.DataManager && typeof window.XianXia.DataManager.deductSpiritStones === 'function') {
        if (!window.XianXia.DataManager.deductSpiritStones(_tpCost)) {
            showMessage('灵石不足，传送需 ' + _tpCost + ' 灵石', 'error');
            return;
        }
    } else if (window.inventory?.currency) {
        if ((window.inventory.currency.spiritStones || 0) < _tpCost) { showMessage('灵石不足', 'error'); return; }
        window.inventory.currency.spiritStones -= _tpCost;
        if (currentCharData) currentCharData.spiritStones = window.inventory.currency.spiritStones;
    } else if (currentCharData) {
        if ((currentCharData.spiritStones || 0) < _tpCost) { showMessage('灵石不足', 'error'); return; }
        currentCharData.spiritStones -= _tpCost;
    }
    if (window.updateCurrencyUI) window.updateCurrencyUI();
    // P1-2.1: 时间推进
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(15, '传送');
    }
    // P1-2.2: 奇遇触发（10%概率）
    if (Math.random() < 0.10 && window.eventSystem && typeof window.eventSystem.triggerRandomEvent === 'function') {
        window.eventSystem.triggerRandomEvent();
    }
    if (window.locationSystem && window.locationSystem.enterCity) {
        window.locationSystem.enterCity(cityName);
    }
    if (typeof window.closeBuildingDialog === 'function') window.closeBuildingDialog();
}

function openQuestUI() {
    if (window.questSystem && window.questSystem.showQuestPanel) {
        window.questSystem.showQuestPanel();
    }
}

// ============ 炼丹房界面 ============
function openAlchemyRoom() {
    const recipes = [
        { name: '疗伤丹', icon: '❤️', materials: '灵芝 x2', result: '疗伤丹 x1', qiCost: 20 },
        { name: '聚气丹', icon: '💊', materials: '灵草 x3, 五行精华 x1', result: '聚气丹 x2', qiCost: 30 },
        { name: '筑基丹', icon: '✨', materials: '人参 x3, 五行精华 x2, 龙骨 x1', result: '筑基丹 x1', qiCost: 100 }
    ];
    
    let itemsHtml = recipes.map((r, i) => `
        <div class="bg-gray-700/30 p-3 rounded mb-2">
            <div class="flex justify-between items-center">
                <div class="flex items-center gap-2">
                    <span class="text-2xl">${r.icon}</span>
                    <div>
                        <p class="font-bold text-green-400">${r.name}</p>
                        <p class="text-xs text-gray-400">材料: ${r.materials}</p>
                        <p class="text-xs text-yellow-400">获得: ${r.result} | 消耗: ${r.qiCost}真气</p>
                    </div>
                </div>
                <button onclick="craftPill(${i})" class="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm">炼制</button>
            </div>
        </div>
    `).join('');
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    modal.innerHTML = `
        <div class="bg-gray-800 border-2 border-green-500 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto mx-4">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-green-500">💊 炼丹房</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div>${itemsHtml}</div>
        </div>
    `;
    document.body.appendChild(modal);
}

// P1-2.4: 使用crafting.js的配方系统
function craftPill(index) {
    // 获取pilferRecipes
    const recipes = window.pilferRecipes || [];
    if (index >= recipes.length) {
        showMessage('配方不存在！', 'error');
        return;
    }
    const recipe = recipes[index];
    
    if (!window.currentCharData) {
        showMessage('请先创建角色', 'warning');
        return;
    }
    if ((currentCharData.qi || 0) < recipe.qiCost) {
        showMessage('真气不足！', 'error');
        return;
    }
    
    // P1-2.1: 时间推进
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(recipe.timeCost || 15, '炼丹');
    }
    
    // 调用crafting.js的executeCrafting
    if (window.executeCrafting) {
        const success = window.executeCrafting(recipe.id);
        if (success) {
            showMessage(`成功炼制 ${recipe.name}！`, 'success');
        } else {
            showMessage(`炼制 ${recipe.name} 失败！`, 'error');
        }
    } else {
        // 降级方案：直接消耗真气
        currentCharData.qi -= recipe.qiCost;
        showMessage(`成功炼制 ${recipe.name}！`, 'success');
    }
    
    const modal = document.querySelector('.fixed.inset-0.bg-black\\/70');
    if (modal) modal.remove();
    if (window.updateCharacterStatus) window.updateCharacterStatus();
}

// ============ 铁匠铺界面（v7.1: 完整强化系统） ============
function openForgingShop() {
    // 优先使用 enhancement.js 完整大厅（app 后加载会覆盖 openEnhancementUI，故用 Hall 别名）
    if (typeof window.openEnhancementHall === 'function') {
        window.openEnhancementHall();
        return;
    }
    if (typeof window.openEnhanceSlotPicker === 'function') {
        window.openEnhanceSlotPicker('strengthen');
        return;
    }
    
    // 降级方案：显示基础选项
    const items = [
        { name: '强化装备', icon: '⚒️', desc: '消耗灵石提升装备属性', action: 'strengthen' },
        { name: '精炼装备', icon: '💎', desc: '提升属性与暴击', action: 'refine' },
        { name: '附魔', icon: '✨', desc: '为装备添加特殊效果', action: 'enchant' },
        { name: '装备突破', icon: '🌟', desc: '质变提升全属性', action: 'breakthrough' },
        { name: '锻造武器', icon: '🗡️', desc: '使用材料锻造新武器', action: 'forge' }
    ];
    
    let itemsHtml = items.map(item => `
        <div class="bg-gray-700/30 p-3 rounded mb-2 flex items-center gap-3">
            <span class="text-2xl">${item.icon}</span>
            <div class="flex-1">
                <p class="font-bold text-orange-400">${item.name}</p>
                <p class="text-xs text-gray-400">${item.desc}</p>
            </div>
            <button onclick="performEnhancementAction('${item.action}')" class="bg-orange-600 hover:bg-orange-500 text-white px-3 py-1 rounded text-sm">操作</button>
        </div>
    `).join('');
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    modal.innerHTML = `
        <div class="bg-gray-800 border-2 border-orange-500 rounded-xl p-6 max-w-2xl w-full mx-4">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-orange-500">⚒️ 铁匠铺</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div>${itemsHtml}</div>
        </div>
    `;
    document.body.appendChild(modal);
}

function performEnhancementAction(action) {
    // 时间推进
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(15, '铁匠铺操作');
    }
    
    // 关闭当前降级弹窗
    document.querySelectorAll('.fixed.inset-0').forEach(function(el) {
        if (el.querySelector && el.querySelector('h3') && /铁匠铺/.test(el.textContent || '')) {
            try { el.remove(); } catch (e) {}
        }
    });

    if (typeof window.performEnhancement === 'function') {
        window.performEnhancement(action);
    } else {
        showMessage('强化系统未加载，请刷新页面', 'error');
    }
}

// ============ 任务堂界面（P1-2.3: 动态获取任务） ============
function openQuestHall() {
    // 尝试使用quest-system.js的动态任务数据
    let availableQuests = [];
    if (window.questSystem) {
        // 获取可接取的任务（主线+日常+收集+讨伐）
        if (typeof window.questSystem.getMainQuests === 'function') {
            const mainQuests = window.questSystem.getMainQuests().filter(q => !q.accepted);
            availableQuests = availableQuests.concat(mainQuests.map(q => ({
                id: q.id,
                title: q.title,
                desc: q.description,
                reward: `经验+${q.rewards?.exp || 0} 灵石+${q.rewards?.spiritStones || 0}`,
                type: '主线',
                questData: q
            })));
        }
        if (typeof window.questSystem.getDailyQuests === 'function') {
            const dailyQuests = window.questSystem.getDailyQuests().filter(q => !q.accepted);
            availableQuests = availableQuests.concat(dailyQuests.map(q => ({
                id: q.id,
                title: q.title,
                desc: q.description,
                reward: `经验+${q.rewards?.exp || 0} 灵石+${q.rewards?.spiritStones || 0}`,
                type: '日常',
                questData: q
            })));
        }
    }
    
    // 如果没有动态任务，使用默认任务
    if (availableQuests.length === 0) {
        availableQuests = [
            { id: 'daily_001', title: '晨练修行', desc: '完成每日晨练', reward: '历练+50', type: '日常' },
            { id: 'daily_002', title: '采集灵药', desc: '采集10株灵草', reward: '灵石+50', type: '日常' },
            { id: 'combat_001', title: '剿灭山贼', desc: '消灭5名山贼', reward: '历练+100, 灵石+100', type: '讨伐' },
            { id: 'combat_002', title: '猎杀妖兽', desc: '消灭3头妖兽', reward: '贡献+100', type: '讨伐' }
        ];
    }
    
    // P1-2.1: 时间推进（接取任务耗时）
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(5, '接取任务');
    }
    
    let questsHtml = availableQuests.map(q => `
        <div class="bg-gray-700/30 p-3 rounded mb-2">
            <div class="flex justify-between items-start">
                <div>
                    <p class="font-bold text-blue-400">${q.title} <span class="text-xs ${q.type === '日常' ? 'text-green-400' : q.type === '主线' ? 'text-red-400' : 'text-orange-400'}">[${q.type}]</span></p>
                    <p class="text-xs text-gray-400 mt-1">${q.desc}</p>
                    <p class="text-xs text-yellow-400 mt-1">奖励: ${q.reward}</p>
                </div>
                <button onclick="acceptQuestFromHall('${q.id}')" class="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm">接取</button>
            </div>
        </div>
    `).join('');
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    modal.innerHTML = `
        <div class="bg-gray-800 border-2 border-blue-500 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto mx-4">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-blue-500">📜 任务堂</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div>${questsHtml}</div>
        </div>
    `;
    document.body.appendChild(modal);
}

function acceptQuestFromHall(questId) {
    // 调用quest-system.js的acceptQuest
    if (window.questSystem && typeof window.questSystem.acceptQuest === 'function') {
        window.questSystem.acceptQuest(questId);
    } else {
        showMessage(`已接取任务：${questId}`, 'success');
    }
    const modal = document.querySelector('.fixed.inset-0.bg-black\\/70');
    if (modal) modal.remove();
}

// ============ 黑市界面 ============
function openBlackMarket() {
    const items = [
        { name: '神秘宝物', icon: '🎁', desc: '可能是珍宝也可能是陷阱', price: 500 },
        { name: '禁术功法', icon: '📕', desc: '威力巨大但有副作用', price: 1000 },
        { name: '毒药', icon: '☠️', desc: '各种致命毒药', price: 300 }
    ];
    
    let itemsHtml = items.map(item => `
        <div class="bg-gray-800/50 p-3 rounded border border-gray-600 mb-2">
            <div class="flex justify-between items-center">
                <div class="flex items-center gap-2">
                    <span class="text-2xl">${item.icon}</span>
                    <div>
                        <p class="font-bold text-gray-300">${item.name}</p>
                        <p class="text-xs text-gray-500">${item.desc}</p>
                        <p class="text-xs text-yellow-600">价格: ${item.price} 灵石</p>
                    </div>
                </div>
                <button onclick="showMessage('黑市交易完成', 'success'); this.closest('.fixed').remove();" class="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm">购买</button>
            </div>
        </div>
    `).join('');
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    modal.innerHTML = `
        <div class="bg-gray-900 border-2 border-gray-500 rounded-xl p-6 max-w-2xl w-full mx-4">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-gray-400">🌙 黑市</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-white text-2xl">&times;</button>
            </div>
            <p class="text-xs text-red-400 mb-3">⚠️ 黑市交易违法，可能被追踪</p>
            <div>${itemsHtml}</div>
        </div>
    `;
    document.body.appendChild(modal);
}

// ============ 加入门派 ============
function joinCurrentSect() {
    const name = document.getElementById('sect-detail-name').textContent;
    if (window.sectsSystem && window.sectsSystem.joinSect) {
        window.sectsSystem.joinSect(name);
    } else {
        showMessage(`加入${name}...`, 'info');
    }
}

function openSectTasksFromDetail() {
    if (window.questSystem && window.questSystem.showQuestPanel) {
        window.questSystem.showQuestPanel();
    }
}

// 消息显示已统一至 global-utils.js，此处不再重复定义

// ==================== 门派交互（重复定义，委托给第一个 selectSect） ====================
// 此函数已被上面的 selectSect 覆盖，保留为空避免重复定义冲突
// 实际逻辑在第一个 selectSect 中

// ==================== 侧边列表（地区/门派切换） ====================
let listMode = 'region'; // 'region' 或 'sect'

function switchListMode(mode) {
    listMode = mode;
    // 更新按钮样式
    document.getElementById('btn-mode-region').classList.toggle('bg-yellow-600', mode === 'region');
    document.getElementById('btn-mode-region').classList.toggle('bg-gray-600', mode !== 'region');
    document.getElementById('btn-mode-sect').classList.toggle('bg-yellow-600', mode === 'sect');
    document.getElementById('btn-mode-sect').classList.toggle('bg-gray-600', mode !== 'sect');
    // 更新列表标题
    document.getElementById('list-title').textContent = mode === 'region' ? '📍 地区列表' : '🏛️ 门派列表';
    // 重新生成列表
    if (mode === 'region') {
        generateRegionList();
    } else {
        generateSectList();
    }
}

function generateRegionList() {
    const container = document.getElementById('region-list');
    const provinces = Object.keys(mapData);
    container.innerHTML = '';
    
    provinces.forEach(prov => {
        const data = mapData[prov];
        const regionDiv = document.createElement('div');
        regionDiv.className = 'region-item px-3 py-2 border-l-3 border-transparent';
        
        // 每个城市后加「前往」按钮 - 点击城市名显示介绍，点击前往才进入城市
        const citiesHtml = data.cities.map(city => `
            <div class="city-list-item px-2 py-1 text-xs text-gray-400 hover:text-yellow-400 hover:bg-gray-700 rounded cursor-pointer flex justify-between items-center">
                <span onclick="event.stopPropagation(); selectCityFromList('${city}', '${prov}')">🏙️ ${city}</span>
                <button onclick="event.stopPropagation(); travelToCityFromList('${city}', '${prov}')" class="text-xs bg-yellow-600 hover:bg-yellow-500 text-gray-900 font-bold px-2 py-0.5 rounded transition">前往</button>
            </div>
        `).join('');
        
        // 野外也加前往
        const wildernessHtml = `
            <div class="city-list-item px-2 py-1 text-xs text-purple-400 hover:text-purple-300 hover:bg-gray-700 rounded cursor-pointer mt-2 border-t border-gray-700 pt-2 flex justify-between items-center">
                <span>🌲 野外 (${prov})</span>
                <button onclick="event.stopPropagation(); openWildernessForRegion('${prov}')" class="text-xs bg-purple-600 hover:bg-purple-500 text-white font-bold px-2 py-0.5 rounded transition">前往</button>
            </div>
        `;
        
        regionDiv.innerHTML = `
            <div class="flex justify-between items-center" onclick="toggleRegion('${prov}')">
                <span class="text-sm font-bold text-gray-200">${prov}</span>
                <span class="text-xs text-gray-500" id="region-arrow-${prov}">▶</span>
            </div>
            <div class="region-cities ml-3 mt-1 space-y-1" id="region-cities-${prov}" style="max-height:0;">
                ${citiesHtml}
                ${wildernessHtml}
            </div>
        `;
        container.appendChild(regionDiv);
    });
}

// ============ 打开指定地区的野外地图 ============
function openWildernessForRegion(regionName) {
    if (window.openWildernessMap) {
        window.openWildernessMap(regionName);
    } else if (window.travelToRegion) {
        // 兼容旧函数
        travelToRegion(regionName);
    }
}

function generateSectList() {
    const container = document.getElementById('region-list');
    const regions = Object.keys(sectsByRegion);
    container.innerHTML = '';
    
    regions.forEach(region => {
        const sects = sectsByRegion[region];
        if (sects.length === 0) return;
        const regionDiv = document.createElement('div');
        regionDiv.className = 'region-item px-3 py-2 border-l-3 border-transparent';
        regionDiv.innerHTML = `
            <div class="flex justify-between items-center" onclick="toggleSectRegion('${region}')">
                <span class="text-sm font-bold text-gray-200">${region}</span>
                <span class="text-xs text-gray-500" id="sect-arrow-${region}">▶</span>
            </div>
            <div class="region-cities ml-3 mt-1 space-y-1" id="sect-region-${region}" style="max-height:0;">
                ${sects.map(sectName => {
                    const s = sectsData[sectName];
                    const typeColor = s.type === '正道' ? 'text-green-400' : s.type === '邪派' ? 'text-red-400' : 'text-yellow-400';
                    return `
                        <div class="city-list-item px-2 py-1 text-xs text-gray-400 flex justify-between items-center hover:bg-gray-700 rounded">
                            <span onclick="event.stopPropagation(); selectSectFromList('${sectName}')" class="cursor-pointer flex-1">
                                <span class="${typeColor}">${s.type}</span> ${sectName}
                            </span>
                            <button onclick="event.stopPropagation(); window.enterSect ? window.enterSect('${sectName}') : selectSectFromList('${sectName}')"
                                class="text-xs bg-yellow-600 hover:bg-yellow-500 text-gray-900 font-bold px-2 py-0.5 rounded transition">
                                前往
                            </button>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        container.appendChild(regionDiv);
    });
}

function toggleRegion(provName) {
    const citiesDiv = document.getElementById('region-cities-' + provName);
    const arrow = document.getElementById('region-arrow-' + provName);
    const regionItems = document.querySelectorAll('.region-item');
    
    if (citiesDiv.style.maxHeight === '0px' || citiesDiv.style.maxHeight === '') {
        document.querySelectorAll('.region-cities').forEach(el => el.style.maxHeight = '0px');
        document.querySelectorAll('[id^="region-arrow-"]').forEach(el => el.textContent = '▶');
        document.querySelectorAll('[id^="sect-arrow-"]').forEach(el => el.textContent = '▶');
        regionItems.forEach(el => el.classList.remove('active'));
        
        citiesDiv.style.maxHeight = citiesDiv.scrollHeight + 'px';
        arrow.textContent = '▼';
        citiesDiv.parentElement.parentElement.classList.add('active');
        selectProvince(provName);
    } else {
        citiesDiv.style.maxHeight = '0px';
        arrow.textContent = '▶';
        citiesDiv.parentElement.parentElement.classList.remove('active');
    }
}

function toggleSectRegion(regionName) {
    const sectsDiv = document.getElementById('sect-region-' + regionName);
    const arrow = document.getElementById('sect-arrow-' + regionName);
    const regionItems = document.querySelectorAll('.region-item');
    
    if (sectsDiv.style.maxHeight === '0px' || sectsDiv.style.maxHeight === '') {
        document.querySelectorAll('.region-cities').forEach(el => el.style.maxHeight = '0px');
        document.querySelectorAll('[id^="region-arrow-"]').forEach(el => el.textContent = '▶');
        document.querySelectorAll('[id^="sect-arrow-"]').forEach(el => el.textContent = '▶');
        regionItems.forEach(el => el.classList.remove('active'));
        
        sectsDiv.style.maxHeight = sectsDiv.scrollHeight + 'px';
        arrow.textContent = '▼';
        sectsDiv.parentElement.parentElement.classList.add('active');
        selectProvince(regionName);
    } else {
        sectsDiv.style.maxHeight = '0px';
        arrow.textContent = '▶';
        sectsDiv.parentElement.parentElement.classList.remove('active');
    }
}

function selectCityFromList(cityName, provinceName) {
    selectCity(cityName, provinceName);
    // 不 toggleRegion，只展开确保列表可见
    const citiesDiv = document.getElementById('region-cities-' + provinceName);
    if (citiesDiv && (citiesDiv.style.maxHeight === '0px' || citiesDiv.style.maxHeight === '')) {
        toggleRegion(provinceName);
    }
    document.querySelector('.map-province')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}


// ============ 从地区列表前往城市（耗时+隐藏地图+显示城市面板） ============
function travelToCityFromList(cityName, provinceName) {
    // 消耗时间
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(30, '前往' + cityName);
    }
    // 耗精力
    if (window.currentCharData) {
        window.currentCharData.energy = Math.max(0, (window.currentCharData.energy || 100) - 5);
    }
    
    // 进入城市
    if (window.locationSystem && typeof window.locationSystem.enterCity === 'function') {
        window.locationSystem.enterCity(cityName);
    }
    
    // 隐藏地图面板的flex容器（左侧列表+SVG地图），保留地图面板标题
    var mapPanel = document.getElementById('panel-map');
    if (mapPanel) {
        mapPanel._hiddenForCity = true;
        var flexContainer = mapPanel.querySelector('.flex.gap-4');
        if (flexContainer) flexContainer.style.display = 'none';
    }
    var md = document.getElementById('map-detail');
    if (md) md.classList.add('hidden');
    var sd = document.getElementById('sect-detail');
    if (sd) sd.classList.add('hidden');
    
    // ===== 同步队伍位置 =====
    if (window.partySystem && typeof window.partySystem.syncPartyLocationToPlayer === 'function') {
        window.partySystem.syncPartyLocationToPlayer(cityName);
    }
    
    if (window.showMessage) showMessage('🚶 经过一番跋涉，来到了' + cityName, 'success');
}

window.travelToCityFromList = travelToCityFromList;

function selectSectFromList(sectName) {
    // 只显示门派介绍，不进入面板（"前往"按钮才进入面板）
    selectSect(sectName);
    document.querySelector('.map-sect')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ==================== 存档系统 ====================
function refreshSaveSlots() {
    saveSlots = JSON.parse(localStorage.getItem('xianxia_saves') || '[]');
    const container = document.getElementById('save-slots');
    if (!container) return;
    if (saveSlots.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm text-center">暂无存档记录</p>';
        return;
    }
    container.innerHTML = saveSlots.map((slot, index) => {
        const meta = slot.meta || slot;
        const roots = meta.roots || meta.spiritualRoots || (slot.state && (slot.state.roots || slot.state.spiritualRoots)) || {};
        const date = new Date(meta.timestamp || slot.timestamp || Date.now());
        const dateStr = date.toLocaleString('zh-CN');
        const name = meta.charName || slot.charName || '未知';
        const realm = meta.realm != null ? meta.realm : '';
        const rMetal = roots.metal != null ? roots.metal : '-';
        const rWood = roots.wood != null ? roots.wood : '-';
        const rWater = roots.water != null ? roots.water : '-';
        const rFire = roots.fire != null ? roots.fire : '-';
        const rEarth = roots.earth != null ? roots.earth : '-';
        return `
            <div class="flex justify-between items-center bg-gray-800 p-3 rounded border border-gray-700">
                <div>
                    <p class="text-gray-200 font-bold">${name}${realm ? ' · ' + realm : ''}</p>
                    <p class="text-xs text-gray-500">${dateStr} | 灵根: 金${rMetal}% 木${rWood}% 水${rWater}% 火${rFire}% 土${rEarth}%</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="loadSaveSlot(${index})" class="text-xs bg-yellow-600 hover:bg-yellow-500 text-gray-900 px-3 py-1 rounded transition">载入</button>
                    <button onclick="exportSingleSave(${index})" class="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded transition">导出</button>
                </div>
            </div>`;
    }).join('');
}


function saveGame() {
    if (!currentCharData) {
        alert('请先创建角色进入游戏！');
        return;
    }

    // B1：完整 GameState 写入存档槽
    var saveData = null;
    if (window.GameState && typeof window.GameState.collectFullGameState === 'function') {
        saveData = window.GameState.collectFullGameState({
            charData: currentCharData,
            bodyDurability: (typeof bodyDurability !== 'undefined') ? bodyDurability : {}
        });
    }
    if (!saveData) {
        var _n = function (v, d) { return v != null ? v : d; };
        saveData = {
            version: '3.0',
            timestamp: Date.now(),
            gameTime: (typeof window.getGameTimeSnapshot === 'function'
                ? window.getGameTimeSnapshot()
                : (window.timeSystem && window.timeSystem.gameTime) || window.gameTime || null),
            charName: currentCharData.name,
            gender: currentCharData.gender,
            mainAttributes: currentCharData.mainAttributes,
            combatSkills: currentCharData.combatSkills,
            combatAbilities: (currentCharData.combatAbilities && currentCharData.combatAbilities.slice()) || [], // v13.1 绝技同步
            lifeSkills: currentCharData.lifeSkills,
            roots: currentCharData.spiritualRoots,
            mutatedRoots: currentCharData.mutatedRoots,
            realm: _n(currentCharData.realm, '炼气'),
            layer: _n(currentCharData.layer, 1),
            exp: _n(currentCharData.tempering, 0),
            essence: _n(currentCharData.essence, 0),
            health: _n(currentCharData.health, 100),
            qi: _n(currentCharData.qi, 100),
            energy: _n(currentCharData.energy, 100),
            spiritStones: _n(currentCharData.spiritStones, 0),
            copper: _n(currentCharData.copper, 0),
            karma: _n(currentCharData.karma, 0),
            order: _n(currentCharData.order, 0),
            blessing: _n(currentCharData.blessing, 0),
            bodyDurability: (typeof bodyDurability !== 'undefined') ? Object.assign({}, bodyDurability) : {},
            inventory: {
                slots: (window.inventory && window.inventory.slots) || [],
                maxSlots: (window.inventory && window.inventory.maxSlots) || 30,
                currency: (window.inventory && window.inventory.currency) || { copper: 100, spiritStones: 10 }
            },
            equipment: window.currentEquipment || {},
            skills: window.currentSkills || {},
            learnedSecrets: window.learnedSecrets || [],
            techniqueKnowledge: (window.KnowledgeSystem && window.KnowledgeSystem.exportData)
                ? window.KnowledgeSystem.exportData() : {},
            questProgress: window.playerQuestProgress || { activeQuests: [], completedQuests: [], totalCompleted: 0 },
            partyData: window.partyData || { members: [], formation: 'standard' },
            discipleState: window.discipleState || { sectName: null, position: '散修', contribution: 0 },
            eventFlags: window.eventFlags || {},
            achievementData: window.achievementData || null,
            proficiencyData: window.proficiencyData || null,
            playerPhysiology: null
        };
    }

    saveData.timestamp = Date.now();
    saveData.version = saveData.version || '3.0';
    try { localStorage.setItem('xianxia_save', JSON.stringify(saveData)); } catch (e) {}

    var meta = (window.GameState && window.GameState.buildSaveMeta)
        ? window.GameState.buildSaveMeta(saveData)
        : {
            charName: saveData.charName,
            gender: saveData.gender,
            realm: saveData.realm,
            timestamp: saveData.timestamp,
            version: saveData.version,
            roots: saveData.roots || saveData.spiritualRoots,
            karma: saveData.karma,
            order: saveData.order
        };
    if (!meta.roots) meta.roots = saveData.roots || saveData.spiritualRoots || {};

    var slotEntry = {
        id: 'slot_' + saveData.timestamp,
        meta: meta,
        state: saveData,
        charName: meta.charName,
        gender: meta.gender,
        timestamp: meta.timestamp,
        version: meta.version,
        roots: meta.roots,
        realm: meta.realm
    };

    var replaced = false;
    for (var si = saveSlots.length - 1; si >= 0; si--) {
        var sn = (saveSlots[si].meta && saveSlots[si].meta.charName) || saveSlots[si].charName;
        if (sn === saveData.charName) {
            saveSlots[si] = slotEntry;
            replaced = true;
            break;
        }
    }
    if (!replaced) saveSlots.push(slotEntry);
    if (saveSlots.length > 10) saveSlots = saveSlots.slice(-10);
    localStorage.setItem('xianxia_saves', JSON.stringify(saveSlots));

    var lastEl = document.getElementById('last-save-time');
    if (lastEl) lastEl.textContent = '上次保存: ' + new Date().toLocaleString('zh-CN');
    refreshSaveSlots();
    showSaveToast('✅ 存档保存成功！');
    return saveData;
}


function exportSave() {
    if (!currentCharData) {
        alert('请先创建角色进入游戏！');
        return;
    }
    
    // 使用统一的saveGame收集数据
    const saveData = saveGame();
    if (!saveData) return;
    
    // 从saveSlots中移除刚添加的（导出不需要保存到列表）
    const idx = saveSlots.findIndex(s => s.timestamp === saveData.timestamp);
    if (idx >= 0) saveSlots.splice(idx, 1);
    localStorage.setItem('xianxia_saves', JSON.stringify(saveSlots));
    refreshSaveSlots();

    const jsonStr = JSON.stringify(saveData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${saveData.charName}_${new Date().toISOString().slice(0,10)}.sav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showSaveToast('📤 存档已导出为 .sav 文件！');
}

function exportSingleSave(index) {
    const slot = saveSlots[index];
    if (!slot) return;
    // 导出完整 state（若有）
    const payload = (slot.state && slot.state.charName) ? slot.state : slot;
    const name = payload.charName || (slot.meta && slot.meta.charName) || 'save';
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name + '_' + new Date((payload.timestamp || Date.now())).toISOString().slice(0, 10) + '.sav';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSaveToast('📤 存档已导出为 .sav 文件！');
}


function importSave(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            var parsed = JSON.parse(e.target.result);
            // 支持 {meta,state} 或扁平完整档
            var saveData = (parsed.state && parsed.state.charName) ? parsed.state : parsed;
            if (!saveData.version || !saveData.charName) {
                throw new Error('无效的存档文件');
            }
            
            saveData.timestamp = Date.now();
            var meta = (window.GameState && window.GameState.buildSaveMeta)
                ? window.GameState.buildSaveMeta(saveData)
                : {
                    charName: saveData.charName,
                    gender: saveData.gender,
                    realm: saveData.realm,
                    timestamp: saveData.timestamp,
                    version: saveData.version,
                    roots: saveData.roots || saveData.spiritualRoots
                };
            if (!meta.roots) meta.roots = saveData.roots || saveData.spiritualRoots || {};
            var slotEntry = {
                id: 'slot_' + saveData.timestamp,
                meta: meta,
                state: saveData,
                charName: meta.charName,
                gender: meta.gender,
                timestamp: meta.timestamp,
                version: meta.version,
                roots: meta.roots,
                realm: meta.realm
            };
            saveSlots.push(slotEntry);
            if (saveSlots.length > 10) saveSlots = saveSlots.slice(-10);
            localStorage.setItem('xianxia_saves', JSON.stringify(saveSlots));
            refreshSaveSlots();
            
            if (confirm('存档 "' + saveData.charName + '" 导入成功！是否立即加载此存档？')) {
                loadSaveData(saveData);
            }
        } catch (err) {
            alert('存档文件格式错误，无法导入！');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function loadSaveSlot(index) {
    const slot = saveSlots[index];
    if (!slot) return;
    const name = (slot.meta && slot.meta.charName) || slot.charName || '存档';
    if (confirm('确定要加载存档 "' + name + '" 吗？当前进度将丢失。')) {
        // 优先完整 state
        const payload = (slot.state && slot.state.charName) ? slot.state : slot;
        loadSaveData(payload);
    }
}


function loadSaveData(saveData) {
    if (!saveData) return;
    // v3 槽：{ meta, state }；导入/旧档可能是扁平完整或摘要
    if (saveData.state && typeof saveData.state === 'object' && saveData.state.charName) {
        saveData = saveData.state;
    }
    // 旧列表摘要无 inventory：尝试 xianxia_save 同名完整档
    if (!saveData.inventory && !saveData.gameTime && saveData.charName) {
        try {
            var rawFull = localStorage.getItem('xianxia_save');
            if (rawFull) {
                var full = JSON.parse(rawFull);
                if (full && full.charName === saveData.charName && (full.inventory || full.version === '3.0' || full.version === '2.5')) {
                    saveData = Object.assign({}, saveData, full);
                }
            }
        } catch (e) {}
    }

    if (document.getElementById('char-creation') && document.getElementById('char-creation').style.display !== 'none') {
        document.getElementById('char-creation').style.display = 'none';
        document.getElementById('game-world').style.display = 'flex';
    }

    // B1：优先 GameState.applyFullGameState（0 值用 ?? 语义）
    if (window.GameState && typeof window.GameState.applyFullGameState === 'function') {
        window.GameState.applyFullGameState(saveData, {
            setCharData: function (loadedChar) {
                currentCharData = loadedChar;
                window.currentCharData = loadedChar;
            },
            setBodyDurability: function (bd) {
                if (typeof bodyDurability !== 'undefined') {
                    Object.keys(bodyDurability).forEach(function (k) { delete bodyDurability[k]; });
                    Object.assign(bodyDurability, bd);
                }
                window._savedDurabilities = Object.assign({}, bd);
                window._savedMaxDurabilities = Object.assign({}, bd);
            }
        });
    } else {
        // 回退：手动恢复 + nullish
        var n = function (v, d) { return v != null ? v : d; };
        var loadedChar = {
            name: saveData.charName,
            gender: saveData.gender,
            mainAttributes: saveData.mainAttributes || {},
            combatSkills: saveData.combatSkills || {},
            combatAbilities: Array.isArray(saveData.combatAbilities) ? saveData.combatAbilities.slice() : [], // v13.1 绝技读档兜底
            lifeSkills: saveData.lifeSkills || {},
            spiritualRoots: saveData.roots || saveData.spiritualRoots || {},
            mutatedRoots: saveData.mutatedRoots || {},
            attrs: saveData.attrs || {},
            realm: n(saveData.realm, '炼气'),
            layer: n(saveData.layer, 1),
            tempering: n(saveData.tempering, 0),
            essence: n(saveData.essence, 0),
            health: n(saveData.health, 100),
            qi: n(saveData.qi, 100),
            energy: n(saveData.energy, 100),
            spiritStones: n(saveData.spiritStones, 0),
            copper: n(saveData.copper, 0),
            karma: n(saveData.karma, 0),
            order: n(saveData.order, 0),
            blessing: n(saveData.blessing, 0),
            maxHealth: n(saveData.maxHealth, 100),
            maxQi: n(saveData.maxQi, 100),
            maxEnergy: n(saveData.maxEnergy, 100)
        };
        if (typeof window.setCurrentCharData === 'function') {
            window.setCurrentCharData(loadedChar);
        } else {
            currentCharData = loadedChar;
            window.currentCharData = loadedChar;
        }
        if (saveData.bodyDurability && typeof bodyDurability !== 'undefined') {
            Object.keys(bodyDurability).forEach(function (k) { delete bodyDurability[k]; });
            Object.assign(bodyDurability, saveData.bodyDurability);
            window._savedDurabilities = Object.assign({}, bodyDurability);
            window._savedMaxDurabilities = Object.assign({}, bodyDurability);
        }
        if (saveData.inventory && window.inventory) {
            window.inventory.maxSlots = saveData.inventory.maxSlots || 30;
            window.inventory.currency = saveData.inventory.currency || { copper: 100, spiritStones: 10 };
            if (saveData.inventory.slots) {
                window.inventory.slots = saveData.inventory.slots.map(function (slotData) {
                    if (!slotData) return null;
                    if (typeof ItemInstance === 'function') {
                        var instance = new ItemInstance(slotData.templateId, slotData.count);
                        instance.uid = slotData.uid;
                        instance.durability = slotData.durability;
                        instance.customProps = slotData.customProps || {};
                        return instance;
                    }
                    return slotData;
                });
            }
            while (window.inventory.slots.length < window.inventory.maxSlots) window.inventory.slots.push(null);
            if (typeof updateInventoryUI === 'function') updateInventoryUI();
            if (typeof updateCurrencyUI === 'function') updateCurrencyUI();
        }
        if (saveData.gameTime && typeof window.loadGameTimeFromSave === 'function') {
            window.loadGameTimeFromSave(saveData.gameTime);
        }
    }

    // 同步 app 模块内 currentCharData 引用
    if (window.currentCharData) currentCharData = window.currentCharData;

    if (typeof populateGameWorld === 'function') populateGameWorld(currentCharData);
    if (typeof renderBodyDurability === 'function') renderBodyDurability();
    if (typeof updateKarmaDisplay === 'function') {
        updateKarmaDisplay((currentCharData && currentCharData.karma) || 0, 'karma');
        updateKarmaDisplay((currentCharData && currentCharData.order) || 0, 'order');
    }
    if (typeof switchPanel === 'function') switchPanel('character');
    if (typeof renderEquipmentPanel === 'function') renderEquipmentPanel();
    if (typeof updateCharacterStatus === 'function') updateCharacterStatus();
    // v11.0：Admin检测
    if (window.DebugPanel && typeof window.DebugPanel.checkAdminStatus === 'function') {
        window.DebugPanel.checkAdminStatus();
    }
    showSaveToast('✅ 存档加载成功！');
}


function updateKarmaDisplay(value, type) {
    const labelMap = {
        karma: { '-100': '大恶', '-50': '恶', '0': '中立', '50': '善', '100': '大善' },
        order: { '-100': '混乱', '-50': '叛逆', '0': '中庸', '50': '守序', '100': '秩序' }
    };
    const labels = labelMap[type];
    let label = '中立';
    if (value <= -80) label = labels['-100'];
    else if (value <= -30) label = labels['-50'];
    else if (value <= 30) label = labels['0'];
    else if (value <= 80) label = labels['50'];
    else label = labels['100'];
    
    document.getElementById(type + '-value').textContent = value;
    document.getElementById(type + '-label').textContent = label;
    document.getElementById(type + '-indicator').style.left = ((value + 100) / 200 * 100) + '%';
}

function deleteSave() {
    if (saveSlots.length === 0) {
        alert('没有可删除的存档！');
        return;
    }
    if (confirm('确定要删除所有 ' + saveSlots.length + ' 个存档吗？此操作将清除角色进度数据（设置除外），不可恢复！')) {
        localStorage.removeItem('xianxia_saves');
        saveSlots = [];
        // B1：同时清除角色级独立键与 xianxia_save
        if (window.GameState && typeof window.GameState.clearCharacterStorage === 'function') {
            window.GameState.clearCharacterStorage({ alsoAccount: false });
        } else {
            try { localStorage.removeItem('xianxia_save'); } catch (e) {}
            try { localStorage.removeItem('xianxia_beasts'); } catch (e) {}
            try { localStorage.removeItem('xianxia_inventory'); } catch (e) {}
            try { localStorage.removeItem('xianxia_house'); } catch (e) {}
        }
        refreshSaveSlots();
        showSaveToast('🗑️ 所有存档与角色数据已删除');
    }
}


function showSaveToast(msg) {
    let toast = document.getElementById('save-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'save-toast';
        toast.className = 'fixed top-4 right-4 bg-gray-800 border border-yellow-600 text-yellow-400 px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity duration-300';
        toast.style.opacity = '0';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 2000);
}


// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    // 生成属性输入框
    generateAttributeInputs('main', 'main-attributes-container');
    generateAttributeInputs('combat', 'combat-skills-container');
    generateAttributeInputs('life', 'life-skills-container');
    
    // 初始化灵根系统
    initRootSystem();
    
    // 默认隐藏游戏世界
    document.getElementById('game-world').style.display = 'none';
    
    // 生成地区列表
    generateRegionList();
    
    // 刷新存档列表
    refreshSaveSlots();
    
    
    // ===== 新增：初始化所有系统 =====
    if (typeof initInventory === 'function') initInventory();
    if (typeof initNPCSystem === 'function') initNPCSystem();
    if (typeof initStatusEffects === 'function') initStatusEffects();
    if (typeof initAchievementSystem === 'function') initAchievementSystem();
    if (typeof initMapMarkers === 'function') initMapMarkers();
    if (typeof initShopSystem === 'function') initShopSystem();
    if (typeof initProficiencyData === 'function') initProficiencyData();
    
    // B1：标题画面不自动从独立键恢复角色进度（避免未选角就串档）
    // 完整进度仅在 loadSaveData / 新游戏后由 GameState 应用
    // 若需兼容极旧流程，可临时取消注释：
    // if (typeof loadInventory === 'function') loadInventory();
    // if (typeof loadEquipmentData === 'function') loadEquipmentData();
    // if (typeof loadProficiencyData === 'function') loadProficiencyData();
    // if (typeof loadQuestProgress === 'function') loadQuestProgress();
    // if (typeof loadPartyData === 'function') loadPartyData();
    // if (typeof loadEventFlags === 'function') loadEventFlags();
    // if (typeof loadSectData === 'function') loadSectData();
    
    // 初始化全局消息系统
    if (window.XianXia && typeof window.XianXia.initMessageSystem === 'function') {
        window.XianXia.initMessageSystem();
    }
    
    // 初始化情境引擎
    if (typeof initScenarioEngine === 'function') {
        initScenarioEngine();
    }
    
    // 初始化设置
    if (typeof initSettings === 'function') {
        initSettings();
    }
    
    // DOMContentLoaded 发生时所有 classic script 已完成求值，可直接初始化；禁止用延时猜加载顺序。
    initNewSystems();
    updateCharacterStatus();
});

// ==================== 战斗系统（部位耐久版） ====================
let currentBattle = null;

function getPlayerTotalDura(playerDurabilities) {
    return Object.values(playerDurabilities).reduce((a, b) => a + b, 0);
}

function updateBattleUI() {
    if (!currentBattle) return;
    const state = currentBattle.getState();

    // 计算总耐久（使用 state 中的 maxDurabilities）
    const playerTotal = getPlayerTotalDura(state.player.durabilities);
    const playerMaxTotal = state.player.maxDurabilities ? Object.values(state.player.maxDurabilities).reduce((a, b) => a + b, 0) : playerTotal;
    const enemyTotal = getPlayerTotalDura(state.enemy.durabilities);
    const enemyMaxTotal = state.enemy.maxDurabilities ? Object.values(state.enemy.maxDurabilities).reduce((a, b) => a + b, 0) : enemyTotal;

    // 更新玩家状态（显示为"当前健康/总健康"）
    document.getElementById('battle-player-name').textContent = state.player.name;
    document.getElementById('battle-player-hp').textContent = `${playerTotal}/${playerMaxTotal}`;

    // 更新敌人状态
    document.getElementById('battle-enemy-name').textContent = state.enemy.name;
    document.getElementById('battle-enemy-hp').textContent = `${enemyTotal}/${enemyMaxTotal}`;

    // ===== 机体扩展v8.0：生理状态条 =====
    _updatePhysiologyUI(state);

    // ===== 护甲系统：护甲状态更新 =====
    _updateArmorUI();

    // 更新日志
    const logDiv = document.getElementById('battle-log');
    logDiv.innerHTML = state.log.map(l => `<div>${l.msg}</div>`).join('');
    logDiv.scrollTop = logDiv.scrollHeight;

    // 队友状态栏刷新
    renderPartyStatusUI();

    // 更新队员SVG颜色
    updatePartyMemberSVGColors();

    // 更新战斗躯干SVG颜色（即使视图未打开，SVG颜色也应更新）
    updateBattleBodyViewColors();
    
    // 如果人体视图已打开，刷新完整视图
    const view = document.getElementById('battle-body-view');
    if (view && !view.classList.contains('hidden')) {
        updateBattleBodyView();
    }

    // 如果战斗结束
    if (state.isFinished) {
        document.getElementById('battle-actions').classList.add('hidden');
        document.getElementById('battle-result').classList.remove('hidden');
        // 战斗结束后恢复按压止血效果
        if (currentBattle.player && currentBattle.player.physiology) {
            _revertPressureBleeding(currentBattle.player);
        }
    } else {
        document.getElementById('battle-actions').classList.remove('hidden');
        document.getElementById('battle-result').classList.add('hidden');
    }

    // v4.2: 如果伤口面板已打开，刷新内容
    const woundPanel = document.getElementById('battle-wound-panel');
    if (woundPanel && !woundPanel.classList.contains('hidden') && typeof updateWoundInspection === 'function') {
        updateWoundInspection();
    }
}

// 更新生理状态UI（v4.0：bloodVolume + 危急/疼痛提示）
function _updatePhysiologyUI(state) {
    // 玩家生理状态
    if (state.player.physiology) {
        const p = state.player.physiology;
        const pMax = 100;
        const blood = p.bloodVolume !== undefined ? p.bloodVolume : p.health;
        _setBar('battle-phys-player-health', blood, pMax);
        _setBar('battle-phys-player-circulation', p.circulation, pMax);
        _setBar('battle-phys-player-pain', p.painLoad, pMax);
        _setBar('battle-phys-player-consciousness', p.consciousness, pMax);
        const typeEl = document.getElementById('battle-phys-player-type');
        if (typeEl) typeEl.textContent = _getPhysTypeLabel(p.type);
        _updateCriticalBanner(currentBattle && currentBattle.player, 'battle-critical-banner');
        _updatePainDebuffIcon(p, 'battle-pain-debuff');
    }
    // 敌人生理状态
    if (state.enemy.physiology) {
        const p = state.enemy.physiology;
        const pMax = 100;
        const blood = p.bloodVolume !== undefined ? p.bloodVolume : p.health;
        _setBar('battle-phys-enemy-health', blood, pMax);
        _setBar('battle-phys-enemy-circulation', p.circulation, pMax);
        _setBar('battle-phys-enemy-pain', p.painLoad, pMax);
        _setBar('battle-phys-enemy-consciousness', p.consciousness, pMax);
        const typeEl = document.getElementById('battle-phys-enemy-type');
        if (typeEl) typeEl.textContent = _getPhysTypeLabel(p.type);
    }
}

/** v4.0: 危急状态横幅（任务面板/战斗UI） */
function _updateCriticalBanner(entity, elId) {
    let el = document.getElementById(elId);
    if (!el) {
        // 尝试挂到战斗日志上方
        const logDiv = document.getElementById('battle-log');
        if (logDiv && logDiv.parentNode) {
            el = document.createElement('div');
            el.id = elId;
            el.className = 'text-sm text-red-400 font-bold mb-1 hidden';
            logDiv.parentNode.insertBefore(el, logDiv);
        } else {
            return;
        }
    }
    const status = (typeof getCriticalStatus === 'function') ? getCriticalStatus(entity)
        : (window.getCriticalStatus ? window.getCriticalStatus(entity) : null);
    if (status && status.active) {
        el.classList.remove('hidden');
        el.innerHTML = '⚠️ 危急：' + status.causeLabel + '（剩余 ' + status.remainingText + '）'
            + '<br><span class="text-xs text-yellow-300">💊 使用止血/包扎可逆转</span>';
    } else {
        el.classList.add('hidden');
        el.innerHTML = '';
    }
}

/** v4.0: 疼痛 debuff 图标 */
function _updatePainDebuffIcon(physSummary, elId) {
    let el = document.getElementById(elId);
    if (!el) {
        const painBar = document.getElementById('battle-phys-player-pain');
        if (painBar && painBar.parentNode) {
            el = document.createElement('span');
            el.id = elId;
            el.className = 'ml-1 text-xs';
            painBar.parentNode.appendChild(el);
        } else {
            return;
        }
    }
    const pain = physSummary.painLoad || 0;
    if (pain >= 90) {
        el.textContent = '💢剧痛';
        el.className = 'ml-1 text-xs text-red-500 font-bold';
    } else if (pain >= 50) {
        el.textContent = '😣疼痛';
        el.className = 'ml-1 text-xs text-orange-400';
    } else if (pain >= 25) {
        el.textContent = '😣轻痛';
        el.className = 'ml-1 text-xs text-yellow-400';
    } else {
        el.textContent = '';
    }
}

function _setBar(containerId, value, max) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const bar = container.querySelector('.phys-bar-fill');
    const text = container.querySelector('.phys-bar-text');
    if (bar) {
        const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
        bar.style.width = pct + '%';
        // 颜色：绿色>70%，黄色30-70%，红色<30%
        if (pct > 70) bar.style.background = '#22c55e';
        else if (pct > 30) bar.style.background = '#eab308';
        else bar.style.background = '#ef4444';
    }
    if (text) text.textContent = Math.round(value) + '/' + Math.round(max);
}

function _getPhysTypeLabel(type) {
    const labels = {
        humanoid: '人形',
        beast: '野兽',
        undead: '亡灵',
        construct: '构装',
        elemental: '元素'
    };
    return labels[type] || type || '未知';
}

// 更新护甲状态UI
function _updateArmorUI() {
    const container = document.getElementById('battle-armor-status');
    if (!container) return;
    if (typeof window.getArmorStatus !== 'function') return;
    const status = window.getArmorStatus();
    if (status.length === 0) {
        container.innerHTML = '<div class="text-xs text-gray-500">未装备护甲</div>';
        return;
    }
    const slotNames = { head: '头', body: '身', hands: '手', legs: '腿', feet: '脚' };
    container.innerHTML = status.map(a => {
        const sName = slotNames[a.slot] || a.slot;
        const durPct = Math.round((a.durability / 200) * 100);
        const color = durPct > 60 ? 'text-green-400' : (durPct > 30 ? 'text-yellow-400' : 'text-red-400');
        return `<div class="flex items-center gap-1 text-xs">
            <span class="text-gray-400 w-4">${sName}</span>
            <span class="text-gray-300 flex-1 truncate">${a.name}</span>
            <span class="${color}">${durPct}%</span>
        </div>`;
    }).join('');
}

function closeBattle() {
    // v4.3: 关闭战斗前确保保存生理数据 + 部位耐久（伤口/耐久延续到下一场战斗）
    // 若胜利但尚未标记尸体（例如 onEnd 未跑到），补标记
    // v12.9 noSpoils（遁修遁走）时不标记尸体——敌人未死，不入档
    try {
        if (currentBattle && currentBattle.winner === 'player' && !(currentBattle.noSpoils)) {
            markKilledEnemyAsCorpse(currentBattle);
        }
    } catch (e) {}
    try {
        if (currentBattle && currentBattle.player) {
            window._playerPhysiology = currentBattle.player;
            window._playerEntity = currentBattle.player; // v9.5 G: 供 hourlyRecovery
            // 保存部位耐久（durabilities）
            if (currentBattle.player.durabilities) {
                window._savedDurabilities = Object.assign({}, currentBattle.player.durabilities);
                window._savedMaxDurabilities = currentBattle.player.maxDurabilities
                    ? Object.assign({}, currentBattle.player.maxDurabilities)
                    : Object.assign({}, currentBattle.player.durabilities);
                // 同步到全局 bodyDurability（状态面板SVG使用）
                if (typeof bodyDurability !== 'undefined') {
                    Object.keys(currentBattle.player.durabilities).forEach(function(k) {
                        bodyDurability[k] = currentBattle.player.durabilities[k];
                    });
                }
            }
            // 单一权威链路：出战斗时 phys.bloodVolume 写回 currentCharData.health（场外唯一权威）
            if (currentCharData && typeof currentBattle.player.physiology === 'object'
                && currentBattle.player.physiology
                && typeof currentBattle.player.physiology.bloodVolume === 'number') {
                currentCharData.health = Math.max(0, Math.min(100, Math.round(currentBattle.player.physiology.bloodVolume)));
            }
        }
    } catch (e) {}
    
    document.getElementById('battle-modal').classList.add('hidden');
    document.getElementById('battle-body-view').classList.add('hidden');
    document.getElementById('battle-log').innerHTML = '';
    currentBattle = null;
    // 重新渲染地图
    if (typeof renderMap === 'function' && typeof mapContainer !== 'undefined' && mapContainer) {
        renderMap(mapContainer, currentMap, viewportOffset.x, viewportOffset.y);
    }
    if (typeof updateEntityMenu === 'function') {
        updateEntityMenu();
    }
    // 刷新状态面板（反映最新的耐久变化）
    if (typeof renderBodyDurability === 'function') {
        try { renderBodyDurability(); } catch (e) {}
    }
    // 若战斗中已标记尸体但菜单未刷，再刷一次地图实体
    try {
        if (typeof renderMap === 'function' && typeof mapContainer !== 'undefined' && mapContainer
            && typeof currentMap !== 'undefined' && typeof viewportOffset !== 'undefined') {
            renderMap(mapContainer, currentMap, viewportOffset.x, viewportOffset.y);
        }
    } catch (e) {}
}

// ============ 人体查看功能 ============
let currentBodyView = 'player'; // 'player' 或 'enemy'

function toggleBattleBodyView() {
    const view = document.getElementById('battle-body-view');
    if (!view) {
        if (typeof showMessage === 'function') showMessage('人体视图未找到', 'error');
        return;
    }
    if (view.classList.contains('hidden')) {
        currentBodyView = 'player';
        // 确保玩家 SVG 显示、敌人隐藏
        const pw = document.getElementById('player-body-svg-wrapper');
        const ew = document.getElementById('enemy-body-svg-wrapper');
        if (pw) pw.classList.remove('hidden');
        if (ew) ew.classList.add('hidden');
        switchBodyView('player');
        view.classList.remove('hidden');
        // 滚入可视区
        try { view.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {}
    } else {
        // 若已打开且在看敌人，切回玩家；若已在玩家则关闭
        if (currentBodyView === 'enemy') {
            switchBodyView('player');
        } else {
            view.classList.add('hidden');
        }
    }
}

function toggleEnemyBodyView() {
    currentBodyView = 'enemy';
    const view = document.getElementById('battle-body-view');
    if (!view) return;
    generateEnemyBodySVG();
    switchBodyView('enemy');
    view.classList.remove('hidden');
    try { view.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {}
}

function switchBodyView(target) {
    currentBodyView = target || 'player';
    const btnPlayer = document.getElementById('btn-view-player');
    const btnEnemy = document.getElementById('btn-view-enemy');
    const isParty = currentBodyView && currentBodyView.indexOf('party-') === 0;
    if (btnPlayer && btnEnemy) {
        if (currentBodyView === 'player') {
            btnPlayer.className = 'text-xs bg-yellow-600 text-gray-900 px-2 py-0.5 rounded';
            btnEnemy.className = 'text-xs bg-gray-600 text-gray-300 px-2 py-0.5 rounded';
        } else if (currentBodyView === 'enemy') {
            btnPlayer.className = 'text-xs bg-gray-600 text-gray-300 px-2 py-0.5 rounded';
            btnEnemy.className = 'text-xs bg-red-600 text-white px-2 py-0.5 rounded';
        } else {
            // 队员视图：两个主按钮都灰色
            btnPlayer.className = 'text-xs bg-gray-600 text-gray-300 px-2 py-0.5 rounded';
            btnEnemy.className = 'text-xs bg-gray-600 text-gray-300 px-2 py-0.5 rounded';
        }
    }
    // 切换 SVG 容器可见性
    const pw = document.getElementById('player-body-svg-wrapper');
    const ew = document.getElementById('enemy-body-svg-wrapper');
    const pc = document.getElementById('party-body-svg-container');
    if (currentBodyView === 'player') {
        if (pw) pw.classList.remove('hidden');
        if (ew) ew.classList.add('hidden');
        if (pc) pc.classList.add('hidden');
    } else if (currentBodyView === 'enemy') {
        generateEnemyBodySVG();
        if (pw) pw.classList.add('hidden');
        if (ew) ew.classList.remove('hidden');
        if (pc) pc.classList.add('hidden');
    } else if (isParty) {
        // 队员视图：显示队员容器，隐藏玩家和敌人
        if (pw) pw.classList.add('hidden');
        if (ew) ew.classList.add('hidden');
        if (pc) pc.classList.remove('hidden');
        // 隐藏所有队员SVG，只显示选中的
        document.querySelectorAll('.party-member-svg').forEach(function(el) {
            el.classList.add('hidden');
        });
        var targetWrapper = document.getElementById(currentBodyView + '-wrapper');
        if (targetWrapper) targetWrapper.classList.remove('hidden');
    }
    updateBattleBodyView();
}

/** 战斗/面板统一耐久颜色（与 data.js getDurabilityColor 同步） */
function _battlePartColor(dur, maxDur, hasWound) {
    var maxD = maxDur > 0 ? maxDur : 100;
    // 换算到 0-100 绝对耐久，与状态面板数字同一套色阶
    var value = Math.max(0, Math.min(100, (dur / maxD) * 100));
    var colorFn = (typeof getDurabilityColor === 'function')
        ? getDurabilityColor
        : (typeof window.getDurabilityColor === 'function' ? window.getDurabilityColor : null);
    var base = colorFn ? colorFn(value) : (
        value >= 100 ? '#22c55e' :
        value >= 80 ? '#66CC00' :
        value >= 50 ? '#FFDC00' :
        value >= 30 ? '#FF851B' :
        value >= 11 ? '#8B0000' :
        value >= 1 ? '#3f0000' : '#000000'
    );
    // 有活动性出血时略偏警示，但不破坏主色阶同步
    if (hasWound && value < 100 && value > 0) {
        // 保持同一色阶，仅在接近完好时提示受伤
        if (value >= 80) return '#FFDC00';
    }
    return base;
}

function _paintBattleSvgParts(prefix, durabilities, maxDurabilities, wounds) {
    const parts = window.BODY_PARTS || (typeof BODY_PARTS !== 'undefined' ? BODY_PARTS : []);
    const woundList = wounds || [];
    parts.forEach(function (part) {
        var dur = durabilities[part.id] != null ? durabilities[part.id] : 0;
        var maxDur = maxDurabilities[part.id] != null ? maxDurabilities[part.id] : 100;
        var hasWound = woundList.some(function (w) { return w && w.partId === part.id && w.bleeding; });
        var color = _battlePartColor(dur, maxDur, hasWound);
        var ids = [prefix + part.id];
        // 眼睛可能是左右分离
        if (part.id === 'eyes') {
            ids.push(prefix + 'eyes-left', prefix + 'eyes-right');
        }
        // head 与 brain 互通
        if (part.id === 'brain') ids.push(prefix + 'head');
        if (part.id === 'head') ids.push(prefix + 'brain');
        ids.forEach(function (id) {
            var el = document.getElementById(id);
            if (!el) return;
            el.setAttribute('fill', color);
            el.style.fill = color;
            if (part.id === 'dantian' || id.indexOf('dantian') >= 0) {
                var st = dur / (maxDur || 100) >= 0.5 ? '#fbbf24' : '#ef4444';
                el.setAttribute('stroke', st);
                el.style.stroke = st;
            }
        });
    });
}

function updateBattleBodyView() {
    if (!currentBattle) return;
    const state = currentBattle.getState ? currentBattle.getState() : null;
    if (!state) return;
    const parts = window.BODY_PARTS || (typeof BODY_PARTS !== 'undefined' ? BODY_PARTS : []);

    const target = currentBodyView === 'enemy' ? state.enemy : state.player;
    const durabilities = (target && target.durabilities) || {};
    const maxDurabilities = (target && target.maxDurabilities) || {};
    const prefix = currentBodyView === 'enemy' ? 'enemy-' : 'battle-';

    const entity = currentBodyView === 'enemy' ? currentBattle.enemy : currentBattle.player;
    const wounds = (entity && entity.physiology) ? (entity.physiology.wounds || []) : [];

    // 标题
    const title = document.getElementById('body-view-title');
    if (title) {
        title.textContent = currentBodyView === 'enemy' ? '👹 敌人躯体状态' : '🧍 玩家躯体状态';
    }

    // 部位耐久列表（数字颜色与 SVG 使用同一 getDurabilityColor）
    const list = document.getElementById('battle-body-durability-list');
    if (list) {
        list.innerHTML = parts.map(function (part) {
            var dur = durabilities[part.id] != null ? Math.round(durabilities[part.id]) : 0;
            var maxDur = maxDurabilities[part.id] != null ? maxDurabilities[part.id] : 100;
            var value = maxDur > 0 ? Math.max(0, Math.min(100, (dur / maxDur) * 100)) : 0;
            var colorFn = (typeof getDurabilityColor === 'function')
                ? getDurabilityColor
                : (typeof window.getDurabilityColor === 'function' ? window.getDurabilityColor : null);
            var hex = colorFn ? colorFn(value) : _battlePartColor(dur, maxDur, false);
            var hasWound = wounds.some(function (w) { return w && w.partId === part.id; });
            var woundIcon = hasWound ? ' 🩸' : '';
            var label = part.label || part.name || part.id;
            return '<div class="flex justify-between items-center bg-gray-700/30 p-1 rounded">' +
                '<span class="text-gray-300">' + label + woundIcon + '</span>' +
                '<span class="font-bold" style="color:' + hex + '">' + dur + '/' + maxDur + '</span></div>';
        }).join('');
    }

    // 上色当前视图 SVG
    _paintBattleSvgParts(prefix, durabilities, maxDurabilities, wounds);

    // 伤口信息
    _updateWoundInfo(durabilities, parts);
}

/**
 * v4.3/v9.6: 每回合更新战斗躯干 SVG 颜色（不依赖视图是否打开）
 * 同时把玩家耐久同步到 bodyDurability，供状态面板 SVG 变色
 */
function updateBattleBodyViewColors() {
    if (!currentBattle) return;
    const state = currentBattle.getState ? currentBattle.getState() : null;
    if (!state) return;

    const playerWounds = (currentBattle.player && currentBattle.player.physiology)
        ? (currentBattle.player.physiology.wounds || []) : [];
    const enemyWounds = (currentBattle.enemy && currentBattle.enemy.physiology)
        ? (currentBattle.enemy.physiology.wounds || []) : [];

    const playerDurabilities = (state.player && state.player.durabilities) || {};
    const playerMaxDurabilities = (state.player && state.player.maxDurabilities) || {};
    const enemyDurabilities = (state.enemy && state.enemy.durabilities) || {};
    const enemyMaxDurabilities = (state.enemy && state.enemy.maxDurabilities) || {};

    _paintBattleSvgParts('battle-', playerDurabilities, playerMaxDurabilities, playerWounds);
    _paintBattleSvgParts('enemy-', enemyDurabilities, enemyMaxDurabilities, enemyWounds);

    // 同步到全局 bodyDurability → 状态面板数字+SVG 同步变色
    try {
        if (typeof bodyDurability !== 'undefined' && playerDurabilities) {
            Object.keys(playerDurabilities).forEach(function (k) {
                bodyDurability[k] = playerDurabilities[k];
            });
            // 状态面板有 head，战斗无 head 时用 brain
            if (bodyDurability.head == null && bodyDurability.brain != null) {
                bodyDurability.head = bodyDurability.brain;
            }
            if (typeof updateBodySVG === 'function') updateBodySVG();
        }
    } catch (e) {}
}

// 更新伤口信息
function _updateWoundInfo(durabilities, parts) {
    const container = document.getElementById('battle-wound-info');
    if (!container) return;
    if (!currentBattle) return;
    const target = currentBodyView === 'enemy' ? currentBattle.enemy : currentBattle.player;
    if (!target || !target.physiology) return;

    const wounds = target.physiology.wounds || [];
    if (wounds.length === 0) {
        container.innerHTML = '<div class="text-xs text-gray-500">无伤口</div>';
        return;
    }

    const getBleedLabel = typeof window.getExternalBleedDescription === 'function'
        ? window.getExternalBleedDescription : (r => r > 0 ? '出血' : '无');

    container.innerHTML = wounds.map(w => {
        const partLabel = BODY_PARTS.find(p => p.id === w.partId)?.label || w.partId;
        const bleedLabel = getBleedLabel(w.externalBleedRate);
        const severityLabel = typeof window.getWoundSeverityDescription === 'function'
            ? window.getWoundSeverityDescription(w.severity) : w.severity;
        return `<div class="flex justify-between items-center text-xs bg-gray-700/30 p-1 rounded mb-0.5">
            <span class="text-gray-300">${partLabel}</span>
            <span class="text-red-400">${severityLabel}</span>
            <span class="text-orange-400">${bleedLabel}</span>
            <span class="text-gray-500">${w.stabilized ? '✅稳定' : '❌未处理'}</span>
        </div>`;
    }).join('');
}

// ==================== 实体菜单与交互系统 ====================
let currentInteractionEntity = null;
let currentInteractionIndex = -1;


/** 将当前格战斗目标标记为尸体（灰名 + 详情面板数据）——仅标记被击杀的那一个 */
function markKilledEnemyAsCorpse(battle) {
    battle = battle || currentBattle;
    if (!battle || !battle.enemy) return false;
    // 同一场战斗只标记一次，避免 onEnd + closeBattle 重复把同格其他生物也标成尸体
    if (battle._corpseMarked) return true;
    if (typeof currentMap === 'undefined' || !currentMap || typeof playerPos === 'undefined') return false;
    var cell = currentMap[playerPos.y] && currentMap[playerPos.y][playerPos.x];
    if (!cell || !cell.entities || !cell.entities.length) return false;

    var deathCause = '战斗击杀';
    try {
        var ep = battle.enemy.physiology;
        if (ep) {
            var blood = ep.bloodVolume !== undefined ? ep.bloodVolume : ep.health;
            if (blood != null && blood <= 0) deathCause = '血量耗尽';
            else if (ep.circulation <= 0) deathCause = '循环崩溃';
            else if (ep.consciousness <= 0) deathCause = '意识丧失';
            else if (ep.type === 'undead' || ep.type === 'construct') deathCause = '结构损毁';
        }
    } catch (e) {}

    var enemyName = String(battle.enemy.name || '敌人').replace(/的尸体$/, '');
    var isBeast = !!(battle.enemy.species === 'beast'
        || battle.enemy.physiologyType === 'beast'
        || battle.enemy.type === 'beast'
        || (battle.enemy.physiology && battle.enemy.physiology.type === 'beast'));
    var carriedInv = battle.enemy.carriedInventory || { items: [], spiritStones: 0, copper: 0 };

    function applyCorpse(ent) {
        if (!ent || ent.isCorpse || ent.dead) return false;
        var baseName = String(ent.name || enemyName || '敌人').replace(/的尸体$/, '');
        ent.isCorpse = true;
        ent.dead = true;
        ent.alive = false;
        ent.symbol = '💀';
        ent.name = baseName + '的尸体';
        if (!ent.type) ent.type = isBeast ? 'beast' : 'person';
        if (isBeast) ent.type = 'beast';
        ent.corpseData = {
            originalName: baseName,
            diedAt: Date.now(),
            canLoot: true,
            looted: false,
            deathCause: deathCause,
            inventory: carriedInv,
            isBeast: isBeast
        };
        return true;
    }

    function nameExactMatch(ent) {
        if (!ent || ent.isCorpse || ent.dead || ent.type === 'building') return false;
        var n = String(ent.name || '').replace(/的尸体$/, '');
        if (!n || !enemyName) return false;
        // 仅精确匹配，避免 indexOf 把同格其他生物一并匹配
        if (n === enemyName) return true;
        // 兼容「游商·张三」vs 战斗名「张三」：后缀精确相等
        if (n.indexOf('·') >= 0) {
            var suffix = n.split('·').pop();
            if (suffix === enemyName) return true;
        }
        if (enemyName.indexOf('·') >= 0) {
            var es = enemyName.split('·').pop();
            if (n === es) return true;
        }
        return false;
    }

    var marked = false;
    var markIdx = -1;

    // 0) 优先：当前交互实体引用（最准确，只杀这一个）
    if (currentInteractionEntity && cell.entities.indexOf(currentInteractionEntity) >= 0) {
        markIdx = cell.entities.indexOf(currentInteractionEntity);
        if (!currentInteractionEntity.isCorpse && !currentInteractionEntity.dead
            && currentInteractionEntity.type !== 'building') {
            marked = applyCorpse(currentInteractionEntity);
        }
    }

    // 1) 其次：currentInteractionIndex（开战时记录的索引）
    if (!marked && typeof currentInteractionIndex === 'number' && currentInteractionIndex >= 0
        && currentInteractionIndex < cell.entities.length) {
        var byIdx = cell.entities[currentInteractionIndex];
        if (byIdx && !byIdx.isCorpse && !byIdx.dead && byIdx.type !== 'building') {
            marked = applyCorpse(byIdx);
            if (marked) markIdx = currentInteractionIndex;
        }
    }

    // 2) 精确名字匹配（禁止模糊 indexOf，防止同格多人全死）
    if (!marked) {
        var exactHits = [];
        for (var i = 0; i < cell.entities.length; i++) {
            if (nameExactMatch(cell.entities[i])) exactHits.push(i);
        }
        if (exactHits.length === 1) {
            marked = applyCorpse(cell.entities[exactHits[0]]);
            if (marked) markIdx = exactHits[0];
        } else if (exactHits.length > 1) {
            // 多名同名时只取第一个未死的，绝不批量标记
            marked = applyCorpse(cell.entities[exactHits[0]]);
            if (marked) markIdx = exactHits[0];
        }
    }

    // 3) 仅当本格「可战斗且未死」实体恰好 1 个时，才作为最后回退
    if (!marked) {
        var combatLive = [];
        for (var j = 0; j < cell.entities.length; j++) {
            var e2 = cell.entities[j];
            if (!e2 || e2.isCorpse || e2.dead || e2.type === 'building') continue;
            if (e2.type === 'person' || e2.type === 'beast' || e2.personType || e2.species) {
                combatLive.push(j);
            }
        }
        if (combatLive.length === 1) {
            marked = applyCorpse(cell.entities[combatLive[0]]);
            if (marked) markIdx = combatLive[0];
        }
        // 多个存活战斗实体时：拒绝猜测，避免误杀全图/全格
    }

    if (marked) {
        battle._corpseMarked = true;
        if (markIdx >= 0) currentInteractionIndex = markIdx;
        if (markIdx >= 0) currentInteractionEntity = cell.entities[markIdx];
    }

    // 刷新实体菜单与地图
    try {
        if (typeof updateEntityMenu === 'function') updateEntityMenu();
        if (typeof renderMap === 'function' && typeof mapContainer !== 'undefined' && mapContainer
            && typeof currentMap !== 'undefined' && typeof viewportOffset !== 'undefined') {
            renderMap(mapContainer, currentMap, viewportOffset.x, viewportOffset.y);
        }
    } catch (e) {}
    return marked;
}


function updateEntityMenu() {
    const entities = getCurrentCellEntities();
    const menu = document.getElementById('entity-menu');
    if (!menu) return;
    if (entities.length === 0) {
        menu.innerHTML = '<p class="text-xs text-gray-500 text-center">此地空无一物</p>';
        return;
    }
    menu.innerHTML = entities.map((entity, index) => {
        // 尸体：灰白 + 删除线
        var color;
        var typeLabel;
        var nameStyle = '';
        var rowExtra = '';
        if (entity.isCorpse || entity.dead) {
            color = 'text-gray-400';
            typeLabel = '尸体';
            nameStyle = 'text-decoration:line-through;opacity:0.75;';
            rowExtra = ' opacity-80 border-gray-600';
        } else if (entity.type === 'building') {
            color = 'text-yellow-400';
            typeLabel = '建筑';
        } else if (entity.type === 'person') {
            color = 'text-green-400';
            typeLabel = '人物';
        } else {
            color = 'text-orange-400';
            typeLabel = '野兽';
        }
        var sym = (entity.isCorpse || entity.dead) ? '💀' : (entity.symbol || '·');
        var nm = entity.name || '未知';
        return '<div class="flex justify-between items-center bg-gray-800 p-2 rounded border border-gray-700 cursor-pointer hover:border-yellow-500' + rowExtra + '" onclick="openInteraction(' + index + ')">' +
            '<span class="' + color + '" style="' + nameStyle + '">' + sym + ' ' + nm + '</span>' +
            '<span class="text-xs text-gray-500">' + typeLabel + '</span></div>';
    }).join('');
}

function openInteraction(index) {
    const entities = getCurrentCellEntities();
    if (!entities || index >= entities.length) return;
    const entity = entities[index];
    currentInteractionEntity = entity;
    currentInteractionIndex = index;
    const panel = document.getElementById('entity-interaction');
    if (!panel) {
        console.warn('entity-interaction panel not found');
        return;
    }
    panel.classList.remove('hidden');
    renderInteraction(entity);
}

function closeInteraction() {
    const panel = document.getElementById('entity-interaction');
    if (panel) panel.classList.add('hidden');
    currentInteractionEntity = null;
    currentInteractionIndex = -1;
}

function renderInteraction(entity) {
    const content = document.getElementById('interaction-content');
    document.getElementById('interaction-title').textContent = entity.name;
    let html = '';
    if (entity.type === 'building') {
        const isRuin = (entity.name || '').includes('遗迹') || entity.data?.name === '遗迹' || entity.effect === '探索宝物';
        const isCave = (entity.name || '').includes('洞府') || entity.data?.name === '洞府';
        const isMarket = (entity.name || '').includes('坊市') || entity.data?.name === '坊市';
        html = `
            <div class="bg-gray-700/30 p-3 rounded mb-4">
                <p class="text-sm"><span class="text-gray-400">类型：</span>建筑</p>
                <p class="text-sm"><span class="text-gray-400">效果：</span>${entity.effect || '无'}</p>
            </div>
            <div class="flex flex-wrap gap-2">
                <button onclick="interactBuilding('${(entity.name || '').replace(/'/g, "\\'")}')" class="bg-yellow-600 hover:bg-yellow-500 px-4 py-2 rounded text-gray-900">使用</button>
                ${isRuin ? `<button onclick="openDungeonEntrance('ruin'); closeInteraction();" class="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded text-white">🏔️ 探索秘境</button>` : ''}
                ${isCave ? `<button onclick="startCultivation(); closeInteraction();" class="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded text-white">🧘 修炼</button>` : ''}
                ${isMarket ? `<button onclick="openWanderMerchant(1.0); closeInteraction();" class="bg-amber-600 hover:bg-amber-500 px-4 py-2 rounded text-white">🛒 交易</button>` : ''}
                <button onclick="closeInteraction()" class="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded text-white">关闭</button>
            </div>
        `;
    } else if (entity.isCorpse || entity.dead || entity.type === 'person' || entity.type === 'beast') {
        // 尸体面板（战利品系统 v1.0：人类→搜刮，野兽→解剖）
        if (entity.isCorpse || entity.dead) {
            if (!entity.corpseData) {
                entity.corpseData = {
                    originalName: String(entity.name || '无名').replace(/的尸体$/, ''),
                    diedAt: Date.now(),
                    canLoot: true,
                    looted: false,
                    deathCause: '不明',
                    inventory: { items: [], spiritStones: 0, copper: 0 },
                    isBeast: entity.type === 'beast'
                };
            }
            var corpseName = entity.name || '无名尸体';
            var origName = entity.corpseData.originalName || String(corpseName).replace(/的尸体$/, '');
            var canLoot = entity.corpseData.canLoot && !entity.corpseData.looted;
            var isBeast = !!(entity.corpseData.isBeast || entity.type === 'beast');
            var typeLabel = isBeast ? '野兽' : '人物';
            var iconHtml = isBeast ? '🦴' : '💀';
            var lootedText = isBeast ? '已被处理' : '已被搜刮一空';
            var deathCause = entity.corpseData.deathCause || '战斗击杀';
            var actionBtn = isBeast
                ? '<button onclick="dissectCorpse();" class="w-full bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded mb-2">🔪 解剖</button>'
                : '<button onclick="lootCorpse();" class="w-full bg-yellow-700 hover:bg-yellow-600 text-white px-4 py-2 rounded mb-2">🔍 搜刮尸体</button>';
            html = '<div class="bg-gray-900/80 p-3 rounded mb-4 border border-gray-600">' +
                '<p class="text-lg text-center mb-2">' + iconHtml + '</p>' +
                '<p class="text-sm text-gray-400 text-center font-bold" style="text-decoration:line-through;opacity:0.85;">' + origName + '</p>' +
                '<p class="text-xs text-gray-500 text-center">已死亡 · ' + typeLabel + '</p>' +
                '<p class="text-xs text-gray-600 text-center mt-1">死因：' + deathCause + '</p>' +
                '</div>' +
                (canLoot ? actionBtn : '<p class="text-xs text-gray-600 text-center mb-2">' + lootedText + '</p>') +
                '<button onclick="closeInteraction()" class="w-full bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded text-white">关闭</button>';
        } else {
            var data = entity.data || {};
            var personType = entity.personType || data.personType || 'normal';
            var isMonster = entity.type === 'beast' || data.isMonster;
            var typeLabel = isMonster ? '野兽'
                : (personType === 'merchant' ? '游商' : personType === 'wanderer' ? '流浪修士' : '人物');
            // 野兽/怪物：不显示阵营/门派，不显示对话按钮
            if (isMonster) {
                html = '<div class="grid grid-cols-2 gap-2 text-sm bg-gray-700/30 p-3 rounded mb-4">' +
                    '<div><span class="text-gray-400">等级：</span>' + (data.level || 1) + '</div>' +
                    '<div><span class="text-gray-400">类型：</span>' + typeLabel + '</div></div>' +
                    '<div class="flex flex-wrap gap-2">' +
                    '<button onclick="openBattleWithEntity()" class="bg-red-600 hover:bg-red-500 px-4 py-2 rounded text-white">⚔️ 攻击</button>' +
                    '<button onclick="closeInteraction()" class="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded text-white">关闭</button></div>';
            } else {
                html = '<div class="grid grid-cols-2 gap-2 text-sm bg-gray-700/30 p-3 rounded mb-4">' +
                    '<div><span class="text-gray-400">阵营：</span>' + (data.faction || '中立') + '</div>' +
                    '<div><span class="text-gray-400">门派：</span>' + (data.sect || '散修') + '</div>' +
                    '<div><span class="text-gray-400">等级：</span>' + (data.level || 1) + '</div>' +
                    '<div><span class="text-gray-400">类型：</span>' + typeLabel + '</div></div>' +
                    '<div class="bg-gray-700/30 p-3 rounded mb-4">' +
                    '<p class="text-xs text-gray-400 mb-2">战斗属性</p>' +
                    '<div class="grid grid-cols-2 gap-1 text-xs">' +
                    '<div><span class="text-gray-400">力量：</span>' + (data.attrs?.strength || 0) + '</div>' +
                    '<div><span class="text-gray-400">灵巧：</span>' + (data.attrs?.dexterity || 0) + '</div>' +
                    '<div><span class="text-gray-400">智力：</span>' + (data.attrs?.intelligence || 0) + '</div>' +
                    '<div><span class="text-gray-400">意志：</span>' + (data.attrs?.willpower || 0) + '</div>' +
                    '<div><span class="text-gray-400">体质：</span>' + (data.attrs?.constitution || 0) + '</div>' +
                    '<div><span class="text-gray-400">经脉：</span>' + (data.attrs?.meridian || 0) + '</div></div></div>' +
                    '<div class="flex flex-wrap gap-2">' +
                    (entity.type === 'person' ? '<button onclick="interactTalk()" class="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-white">👋 问候</button>' : '') +
                    (entity.type === 'person' && entity._greeted ? '<button onclick="openNpcDeepTalk()" class="bg-cyan-600 hover:bg-cyan-500 px-4 py-2 rounded text-white">详谈</button>' : '') +
                    (personType === 'merchant' ? '<button onclick="openWanderMerchant(1.2); closeInteraction();" class="bg-amber-600 hover:bg-amber-500 px-4 py-2 rounded text-white">🛒 交易</button>' : '') +
                    (personType === 'wanderer' ? '<button onclick="sparWithWanderer();" class="bg-orange-600 hover:bg-orange-500 px-4 py-2 rounded text-white">⚔️ 切磋</button>' : '') +
                    (personType === 'wanderer' ? '<button onclick="tradeSkillWithWanderer();" class="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded text-white">📜 交易功法</button>' : '') +
                    '<button onclick="openBattleWithEntity()" class="bg-red-600 hover:bg-red-500 px-4 py-2 rounded text-white">⚔️ 攻击</button>' +
                    '<button onclick="closeInteraction()" class="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded text-white">关闭</button></div>';
            }
        }
    }
    content.innerHTML = html;
}

// ============ 搜刮尸体（人类） ============
// 战利品系统 v1.0：从尸体数据中读取携带物，不再调用 generateLoot()
function lootCorpse() {
    if (!currentInteractionEntity || !currentInteractionEntity.isCorpse) return;
    var corpse = currentInteractionEntity;
    if (corpse.corpseData?.looted) {
        showMessage('尸体已被搜刮过了', 'info');
        return;
    }
    
    // 从尸体数据中读取携带物
    var inv = corpse.corpseData?.inventory;
    if (!inv || (!inv.items?.length && !inv.spiritStones && !inv.gold)) {
        showMessage('🔍 他身上什么也没有', 'info');
        corpse.corpseData.looted = true;
        corpse.corpseData.canLoot = false;
        renderInteraction(corpse);
        return;
    }
    
    var msg = '🔍 搜刮到：';
    var hasLoot = false;
    
    if (inv.spiritStones) {
        if (window.inventory && window.inventory.currency) {
            window.inventory.currency.spiritStones = (window.inventory.currency.spiritStones || 0) + inv.spiritStones;
        }
        msg += '灵石+' + inv.spiritStones + ' ';
        hasLoot = true;
    }
    if (inv.gold) {
        if (window.inventory && window.inventory.currency) {
            window.inventory.currency.copper = (window.inventory.currency.copper || 0) + inv.gold;
        }
        msg += '铜钱+' + inv.gold + ' ';
        hasLoot = true;
    }
    if (inv.items && inv.items.length) {
        inv.items.forEach(function(itemId) {
            if (typeof window.addItem === 'function') window.addItem(itemId, 1);
        });
        msg += '物品：' + inv.items.map(function(id) {
            var t = window.itemById && window.itemById[id];
            return (t && t.name) || id;
        }).join('、');
        hasLoot = true;
    }
    
    if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI();
    if (typeof window.updateInventoryUI === 'function') window.updateInventoryUI();
    
    showMessage(hasLoot ? msg : '🔍 他身上什么也没有', hasLoot ? 'success' : 'info');
    
    corpse.corpseData.looted = true;
    corpse.corpseData.canLoot = false;
    renderInteraction(corpse);
}

// ============ 解剖尸体（野兽） ============
// 战利品系统 v1.0：解剖野兽尸体获得生物材料
function dissectCorpse() {
    if (!currentInteractionEntity || !currentInteractionEntity.isCorpse) return;
    var corpse = currentInteractionEntity;
    if (corpse.corpseData?.looted) {
        showMessage('这具尸体已被处理过了', 'info');
        return;
    }
    
    var inv = corpse.corpseData?.inventory;
    if (!inv || !inv.items?.length) {
        showMessage('🔪 什么也没找到', 'info');
        corpse.corpseData.looted = true;
        corpse.corpseData.canLoot = false;
        renderInteraction(corpse);
        return;
    }
    
    var msg = '🔪 解剖获得：';
    inv.items.forEach(function(itemId) {
        if (typeof window.addItem === 'function') window.addItem(itemId, 1);
    });
    msg += inv.items.map(function(id) {
        var t = window.itemById && window.itemById[id];
        return (t && t.name) || id;
    }).join('、');
    
    if (typeof window.updateInventoryUI === 'function') window.updateInventoryUI();
    
    showMessage(msg, 'success');
    
    corpse.corpseData.looted = true;
    corpse.corpseData.canLoot = false;
    renderInteraction(corpse);
}

function interactBuilding(name) {
    if ((name || '').includes('遗迹')) {
        openDungeonEntrance('ruin');
        closeInteraction();
        return;
    }
    if ((name || '').includes('洞府')) {
        if (typeof startCultivation === 'function') startCultivation();
        closeInteraction();
        return;
    }
    if ((name || '').includes('坊市') || (name || '').includes('城镇')) {
        openWanderMerchant(1.0);
        closeInteraction();
        return;
    }
    if ((name || '').includes('门派')) {
        showMessage('你在门派门外观望，似乎需要正式拜入才能使用设施。', 'info');
        closeInteraction();
        return;
    }
    showMessage(`使用【${name}】：${'获得片刻休整'}`, 'info');
    if (currentCharData) {
        currentCharData.energy = Math.min(100, (currentCharData.energy || 0) + 10);
        currentCharData.health = Math.min(100, (currentCharData.health || 100) + 5);
        if (window.updateCharacterStatus) window.updateCharacterStatus();
    }
    closeInteraction();
}

/**
 * 问候：仅简短寒暄，不打开详谈面板
 * 详谈请用 openNpcDeepTalk / showNPCDialog
 */
function interactTalk() {
    if (!currentInteractionEntity || currentInteractionEntity.type !== 'person') {
        showMessage('附近没有可问候的人。', 'info');
        return;
    }
    var ent = currentInteractionEntity;
    var name = ent.name || ent.data?.name || '路人';
    var player = (typeof window.getCurrentCharData === 'function' ? window.getCurrentCharData() : null)
        || window.currentCharData || { name: '道友' };

    // 尽量解析/创建 NPC，以便 getGreeting 与好感记录（仍不打开面板）
    var npcId = ent.npcId || ent.data?.npcId || ent.data?.id || null;
    var npc = (npcId && window.npcManager && typeof window.npcManager.getNPC === 'function')
        ? window.npcManager.getNPC(npcId) : null;

    if (!npc && window.NPC && window.npcManager) {
        var tempId = npcId || ('map_' + String(name).replace(/\s+/g, '_') + '_' + (ent.x || 0) + '_' + (ent.y || 0));
        // 同格同名复用已有临时 NPC，避免每次问候新建
        npc = window.npcManager.getNPC(tempId);
        if (!npc) {
            npc = new window.NPC(tempId, name, {
                occupation: ent.data?.sect || ent.data?.occupation || '散修',
                gender: ent.data?.gender || 'male',
                faction: ent.data?.faction || '中立'
            });
            window.npcManager.addNPC(npc);
        }
        ent.npcId = tempId;
        npcId = tempId;
    }

    var line = null;
    if (npc && typeof window.getGreeting === 'function') {
        try { line = window.getGreeting(npc, player); } catch (e) { line = null; }
    } else if (npc && typeof getGreeting === 'function') {
        try { line = getGreeting(npc, player); } catch (e) { line = null; }
    }
    if (!line) {
        line = name + ' 向你点了点头：「道友有礼。」';
    } else {
        line = name + '：「' + line + '」';
    }

    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(1, '问候');
    }
    if (npc && typeof npc.recordPlayerAction === 'function') {
        try { npc.recordPlayerAction('greet', 'positive'); } catch (e) {}
    }
    // 轻微好感（若有系统）
    try {
        if (npc && window.affectionSystem && typeof window.affectionSystem.changeAffection === 'function') {
            window.affectionSystem.changeAffection(npc.id || npcId, 1, '问候');
        } else if (npc && npc.relationship) {
            npc.relationship.affection = Math.min(100, (npc.relationship.affection || 0) + 1);
        }
    } catch (e) {}

    // 标记已问候，后续才显示"详谈"按钮
    ent._greeted = true;

    showMessage('👋 ' + line, 'info');
    // 立即刷新面板，让"详谈"按钮出现
    renderInteraction(ent);
}

/** 详谈：打开完整 NPC 对话面板（与问候分离） */
function openNpcDeepTalk() {
    if (!currentInteractionEntity || currentInteractionEntity.type !== 'person') {
        showMessage('没有可详谈的对象', 'warning');
        return;
    }
    var ent = currentInteractionEntity;
    var name = ent.name || ent.data?.name || '路人';
    var npcId = ent.npcId || ent.data?.npcId || ent.data?.id || null;
    var npc = (npcId && window.npcManager) ? window.npcManager.getNPC(npcId) : null;

    if (!npc && window.NPC && window.npcManager) {
        var tempId = npcId || ('map_' + String(name).replace(/\s+/g, '_') + '_' + Date.now());
        npc = window.npcManager.getNPC(tempId);
        if (!npc) {
            npc = new window.NPC(tempId, name, {
                occupation: ent.data?.sect || ent.data?.occupation || '散修',
                gender: ent.data?.gender || 'male',
                faction: ent.data?.faction || '中立'
            });
            window.npcManager.addNPC(npc);
        }
        ent.npcId = tempId;
        npcId = tempId;
    }

    if (!npcId || typeof window.showNPCDialog !== 'function') {
        showMessage('对方似乎无心深谈。', 'info');
        return;
    }
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(5, '与NPC详谈');
    }
    if (npc && typeof npc.recordPlayerAction === 'function') {
        try { npc.recordPlayerAction('talk', 'positive'); } catch (e) {}
    }
    closeInteraction();
    window.showNPCDialog(npcId);
}

// ==================== 玩家战斗实体统一构建（单一权威链路） ====================
// 进战斗：currentCharData.health → phys.bloodVolume（血量唯一权威来源）；
// _playerPhysiology 提供伤口/生理状态延续（始终载入）；_savedDurabilities 提供部位耐久延续。
function buildPlayerBattleEntity(level) {
    if (!currentCharData) return null;
    // v9.8：主属性同步到 attrs 六维
    if (typeof window.syncCharAttrsFromMain === 'function') {
        window.syncCharAttrsFromMain(currentCharData);
    }
    const ma = currentCharData.mainAttributes || {};
    const pa = currentCharData.attrs || {};
    const playerAttrs = {
        strength: pa.strength || ma['力量'] || 10,
        dexterity: pa.dexterity || ma['灵巧'] || 10,
        intelligence: pa.intelligence || ma['神识'] || ma['智力'] || 10,
        willpower: pa.willpower || ma['意志'] || 10,
        constitution: pa.constitution || ma['体质'] || 10,
        meridian: pa.meridian || ma['经脉'] || 10,
    };
    // v15.4 门派功法掌握度加成：藏经阁参悟所得，威力按各功法掌握度百分比缩放后并入六维
    try {
        var sectArtBonus = (typeof window.getSectArtAttrBonuses === 'function') ? window.getSectArtAttrBonuses() : null;
        if (sectArtBonus) {
            for (var sabKey in sectArtBonus) {
                playerAttrs[sabKey] = Math.round(((playerAttrs[sabKey] || 10) + sectArtBonus[sabKey]) * 10) / 10;
            }
        }
    } catch (eSab) {}
    // v15.8 门派设施 tempBuff：activeBuffs 六维效果在到期前全额生效（达摩洞参禅/血池淬身等）
    try {
        var abBuffs = window.activeBuffs;
        if (abBuffs) {
            var nowMinAb = (window.GameScheduler && typeof window.GameScheduler.nowMinute === 'function')
                ? window.GameScheduler.nowMinute()
                : ((window.timeSystem && window.timeSystem.gameTime) ? (Number(window.timeSystem.gameTime.totalMinutes) || 0) : 0);
            for (var abKey in abBuffs) {
                var abItem = abBuffs[abKey];
                if (!abItem || !abItem.effects || ((abItem.expiryGameMinute || 0) <= nowMinAb)) continue;
                for (var abEff in abItem.effects) {
                    var abVal = abItem.effects[abEff];
                    if (typeof abVal !== 'number') continue;
                    playerAttrs[abEff] = Math.round(((playerAttrs[abEff] || 10) + abVal) * 10) / 10;
                }
            }
        }
    } catch (eAb) {}
    // v4.3: 从 _playerPhysiology 恢复之前的伤势（伤口延续；不再要求 wounds>0 才载入）
    var savedPhysiology = null;
    var savedDurabilities = null;
    var savedMaxDurabilities = null;
    try {
        if (window._playerPhysiology && window._playerPhysiology.physiology) {
            var saved = window._playerPhysiology.physiology;
            savedPhysiology = {
                type: saved.type || 'humanoid',
                bloodVolume: saved.bloodVolume !== undefined ? saved.bloodVolume : 100,
                health: saved.health !== undefined ? saved.health : 100,
                circulation: saved.circulation !== undefined ? saved.circulation : 100,
                consciousness: saved.consciousness !== undefined ? saved.consciousness : 100,
                breathing: saved.breathing !== undefined ? saved.breathing : 100,
                painLoad: Math.max(0, (saved.painLoad || 0)),
                neuralShock: Math.max(0, (saved.neuralShock || 0)),
                oxygenDebt: saved.oxygenDebt !== undefined ? saved.oxygenDebt : 0,
                breathlessTurns: saved.breathlessTurns || 0,
                criticalTimer: saved.criticalTimer !== undefined ? saved.criticalTimer : -1,
                criticalCause: saved.criticalCause || null,
                criticalRounds: saved.criticalRounds !== undefined ? saved.criticalRounds : 50,
                dantianDestroyed: !!saved.dantianDestroyed,
                criticalInjuries: saved.criticalInjuries ? JSON.parse(JSON.stringify(saved.criticalInjuries)) : null,
                physiologyFlags: saved.physiologyFlags ? JSON.parse(JSON.stringify(saved.physiologyFlags)) : null,
                wounds: (saved.wounds || []).map(function(w) { return Object.assign({}, w); }),
                parts: saved.parts ? JSON.parse(JSON.stringify(saved.parts)) : {},
                state: saved.state || 'alert',
                isUnconscious: !!saved.isUnconscious,
                integrity: saved.integrity || 100
            };
        }
        // 恢复保存的部位耐久
        if (window._savedDurabilities) {
            savedDurabilities = Object.assign({}, window._savedDurabilities);
            savedMaxDurabilities = window._savedMaxDurabilities
                ? Object.assign({}, window._savedMaxDurabilities)
                : Object.assign({}, window._savedDurabilities);
        }
    } catch (e) {}
    // 2.1 走火入魔：紊乱>=80 全六维 -10%（>=95 -20%）
    try {
        if (typeof window.getQiDeviationPenalty === 'function') {
            var _qdPen = window.getQiDeviationPenalty();
            if (_qdPen > 0) {
                for (var _qdk in playerAttrs) {
                    playerAttrs[_qdk] = Math.round(playerAttrs[_qdk] * (1 - _qdPen) * 10) / 10;
                }
            }
        }
    } catch (eQd) {}
    // 2.3 悟道树：已领悟节点永久六维加成
    try {
        if (typeof window.getEnlightenmentBonus === 'function') {
            var _enlB = window.getEnlightenmentBonus();
            for (var _enk in _enlB) {
                playerAttrs[_enk] = Math.round(((playerAttrs[_enk] || 10) + _enlB[_enk]) * 10) / 10;
            }
        }
    } catch (eEnl) {}
    // 2.12 自创丹方临时 buff：allAttr 全六维+，attack 存实体
    try {
        var _cpb = currentCharData._customPillBuff;
        if (_cpb && _cpb.allAttr) {
            for (var _cpk in playerAttrs) playerAttrs[_cpk] = Math.round((playerAttrs[_cpk] + _cpb.allAttr) * 10) / 10;
        }
        if (_cpb && _cpb.attack && playerEntity) playerEntity._customPillAtk = 1 + _cpb.attack / 100;
    } catch (eCp) {}
    // 2.5 build 分化：剑修连击/体修反震/法修元素——流派被动 buff
    try {
        if (typeof window.getSchoolBonus === 'function') {
            var _sb = window.getSchoolBonus();
            if (_sb) {
                playerEntity._schoolBonus = _sb;
                if (_sb.defenseMul) playerEntity._schoolDefMul = 1 + _sb.defenseMul;
                if (_sb.attackMul) playerEntity._schoolAtkMul = 1 + _sb.attackMul;
            }
        }
    } catch (eSb2) {}
    // 0.2.2 #3 组合技接入战斗：已装备功法触发的组合加成作用于战斗实体
    // 此前 SKILL_COMBINATIONS 的 8 套组合（阴阳融合/太极领域/万剑归宗…）只查不接，纯装饰
    var _skillComboBonus = null;
    try {
        var _curSkills = currentCharData.currentSkills || currentCharData.skills || {};
        if (_curSkills && typeof window.getSkillCombinationBonuses === 'function') {
            _skillComboBonus = window.getSkillCombinationBonuses(_curSkills);
            // all_attr（阴阳融合 +30%）：全六维百分比加成，直接并入 attrs
            if (_skillComboBonus && _skillComboBonus.all_attr) {
                var _aaMul = 1 + _skillComboBonus.all_attr / 100;
                for (var _ak in playerAttrs) {
                    playerAttrs[_ak] = Math.round(playerAttrs[_ak] * _aaMul * 10) / 10;
                }
            }
        }
    } catch (eSc) {}
    // 0.2.6 道侣合击接线：getDaoCompanionCombos 此前只返回不接入，合击纯装饰
    // 有道侣（bonds 含 dao_companion）即生效——道侣随行护持，全属性/攻防按 bond 等级提升
    var _daoComboBonus = null;
    try {
        var _bonds = currentCharData.bonds || {};
        var _daoNpcId = null;
        for (var _bid in _bonds) {
            if (_bonds[_bid] && _bonds[_bid].type === 'dao_companion') { _daoNpcId = _bid; break; }
        }
        if (_daoNpcId && typeof window.getDaoCompanionCombos === 'function') {
            var _daoCombos = window.getDaoCompanionCombos(_daoNpcId) || [];
            var _daoTotal = {};
            for (var _dc = 0; _dc < _daoCombos.length; _dc++) {
                var _db = _daoCombos[_dc].bonus || {};
                for (var _dk in _db) _daoTotal[_dk] = (_daoTotal[_dk] || 0) + _db[_dk];
            }
            if (_daoTotal.all) {
                var _daoAllMul = 1 + _daoTotal.all / 100;
                for (var _daK in playerAttrs) playerAttrs[_daK] = Math.round(playerAttrs[_daK] * _daoAllMul * 10) / 10;
            }
            _daoComboBonus = _daoTotal;
        }
    } catch (eDc) {}
    var EntityCls = (typeof Entity !== 'undefined') ? Entity : window.Entity;
    if (!EntityCls) return null;
    var entityCfg = {
        name: currentCharData.name || '玩家',
        attrs: playerAttrs,
        skills: currentCharData.combatSkills || currentCharData.skills || {},
        // v13.1 绝技透传：玩家与敌人共用 COMBAT_ABILITIES 机制，战斗实体持有同一 id 数组
        combatAbilities: (currentCharData.combatAbilities || []).slice(),
        physiology: savedPhysiology,
        durabilities: savedDurabilities || undefined
    };
    if (level !== undefined && level !== null) entityCfg.level = level;
    var playerEntity = new EntityCls(entityCfg, 'player');
    // 如果恢复了部位耐久，也需要更新 maxDurabilities
    if (savedDurabilities && playerEntity) {
        playerEntity.maxDurabilities = savedMaxDurabilities || Object.assign({}, savedDurabilities);
    }
    // 血量权威覆盖：无论是否载入旧生理，bloodVolume 一律取 currentCharData.health（clamp 0~100，缺失按100）
    if (playerEntity && playerEntity.physiology) {
        var hp = Number(currentCharData.health);
        if (!isFinite(hp)) hp = 100;
        hp = Math.max(0, Math.min(100, Math.round(hp)));
        playerEntity.physiology.bloodVolume = hp;
        playerEntity.physiology.health = hp; // 兼容旧代码读取 phys.health
    }
    // v14.11 修炼指导·战斗加成兑现（combat_boost>0 时本场攻击+5%，用后即耗）
    try {
        var cdBuff = window.currentCharData;
        if (cdBuff && cdBuff._buffs && cdBuff._buffs.combat_boost > 0 && playerEntity.combat) {
            playerEntity.combat.attack = Math.round((playerEntity.combat.attack || 0) * 1.05);
            cdBuff._buffs.combat_boost = 0;
        }
    } catch (e) {}
    // 0.2.1 境界质变接入战斗：REALM_UNIQUE_EFFECTS 乘数（attack/defense/speed）注入玩家实体
    // 升境不再纯数字递增——金丹 defense×1.15、化神 attack×1.2、合体攻防×1.3、渡劫×1.5 等肉眼可见
    try {
        var _rbRealm = (window.currentCharData && window.currentCharData.realm) || '';
        if (_rbRealm && typeof window.getRealmBonus === 'function') {
            playerEntity._realmCombatMul = {
                attack: window.getRealmBonus(_rbRealm, 'attack'),
                defense: window.getRealmBonus(_rbRealm, 'defense'),
                speed: window.getRealmBonus(_rbRealm, 'speed')
            };
        }
    } catch (e) {}
    // 0.2.2 #3：组合技 attack/defense 乘数 + penetrate/block/crit/counter 等透传给战斗实体（battle.js 读取）
    if (_skillComboBonus && playerEntity) {
        playerEntity._skillComboBonus = _skillComboBonus;
    }
    // 0.2.6：道侣合击 attack/defense 乘数透传（情意绵绵 attack+20%、生死与共 defense+25%）
    if (_daoComboBonus && playerEntity) {
        playerEntity._daoComboBonus = _daoComboBonus;
    }
    // v20.1 出身天赋：剑骨 attack×1.10 / 铁骨 defense×1.10（注入玩家战斗实体）
    try {
        if (typeof window.talentAtkMul === 'function') {
            var _taMul = window.talentAtkMul(currentCharData);
            if (_taMul !== 1) playerEntity._talentAtkMul = _taMul;
        }
        if (typeof window.talentDefMul === 'function') {
            var _tdMul = window.talentDefMul(currentCharData);
            if (_tdMul !== 1) playerEntity._talentDefMul = _tdMul;
        }
    } catch (e) {}
    // 1.8 本命法宝：每阶 +5% 攻防（法宝等级→战斗加成）
    try {
        if (typeof window.artifactCombatMul === 'function') {
            var _baMul = window.artifactCombatMul();
            if (_baMul !== 1) playerEntity._artifactMul = _baMul;
        }
    } catch (e) {}
    return playerEntity;
}

function openBattleWithEntity(entityArg) {
    // 外部直传敌人（心魔战/势力入侵/竞技场等）：归一化后写入当前交互实体
    if (entityArg && typeof entityArg === 'object') {
        var src = {
            type: entityArg.type || 'enemy',
            name: entityArg.name || (entityArg.data && entityArg.data.name) || '敌人',
            data: entityArg.data || entityArg
        };
        if (entityArg._isArenaOpponent) src._isArenaOpponent = true;
        window.currentInteractionEntity = src;
        currentInteractionEntity = src; // 同步词法绑定（app.js 内部读取的是 let 变量）
    }
    if (!currentInteractionEntity) return;
    // P0-5：残魂态禁止战斗
    if (window.checkSoulBlock && window.checkSoulBlock('战斗')) return;
    if (typeof Entity === 'undefined' || typeof Battle === 'undefined') {
        alert('战斗系统未加载！');
        return;
    }
    const data = currentInteractionEntity.data || currentInteractionEntity; // 无 .data 的旧对象按自身作为数据源

    // 构建玩家Entity（统一走单一权威链路：health → bloodVolume）
    const playerEntity = buildPlayerBattleEntity();
    if (!playerEntity) return;

    // 构建敌人Entity（确保 durabilities 存在）
    const enemyAttrs = data.attrs || { strength: 10, dexterity: 10, intelligence: 10, willpower: 10, constitution: 10, meridian: 10 };
    const enemyEntity = new Entity({
        name: data.name,
        level: data.level || 1,
        faction: data.faction || '中立',
        sect: data.sect || '散修',
        attrs: enemyAttrs,
        skills: data.skills || {},
        durabilities: data.durabilities || initBodyDurability(enemyAttrs),
        loot: data.loot || { exp: 10, copper: 5 },
        aiBehavior: data.aiBehavior || 'balanced',
    }, currentInteractionEntity.type === 'beast' ? 'beast' : 'enemy');
    // v10.0：竞技场对手标记透传到战斗实体，供战后结算识别
    if (data._isArenaOpponent) enemyEntity._isArenaOpponent = true;

    const battle = new Battle(playerEntity, enemyEntity);
    currentBattle = battle;

    // 隐藏交互面板，显示战斗
    closeInteraction();
    showBattleUI();
}

// 动态生成敌人人体SVG（克隆玩家战斗 SVG，前缀改为 enemy-）
function generateEnemyBodySVG() {
    // HTML 中容器 id 为 enemy-body-svg-wrapper（旧代码误写 container）
    const container = document.getElementById('enemy-body-svg-wrapper')
        || document.getElementById('enemy-body-svg-container');
    if (!container) return;

    // 已生成则跳过
    if (document.getElementById('enemy-body-svg') && container.querySelector('#enemy-body-svg')) {
        return;
    }

    const playerSvg = document.getElementById('battle-body-svg');
    if (playerSvg) {
        // 深拷贝玩家 SVG 结构，替换 id 前缀 battle- → enemy-
        const clone = playerSvg.cloneNode(true);
        clone.id = 'enemy-body-svg';
        // 遍历所有带 id 的节点
        const all = clone.querySelectorAll('[id]');
        all.forEach(function (node) {
            if (node.id && node.id.indexOf('battle-') === 0) {
                node.id = 'enemy-' + node.id.slice('battle-'.length);
            } else if (node.id && node.id.indexOf('battle') === 0) {
                node.id = node.id.replace(/^battle/, 'enemy');
            }
        });
        // filter/gradient/clip-path 的 url 引用（v14.3 修复：clip-path 未重写导致敌人躯体在
        // 战斗弹窗隐藏的界面（如地图页伤势面板）引用失效，带状区块原样溢出成绿块）
        clone.querySelectorAll('[filter], [fill], [clip-path]').forEach(function (node) {
            var f = node.getAttribute('filter');
            if (f && f.indexOf('battle-') >= 0) {
                node.setAttribute('filter', f.replace(/battle-/g, 'enemy-'));
            }
            var fill = node.getAttribute('fill');
            if (fill && fill.indexOf('url(#battle') >= 0) {
                node.setAttribute('fill', fill.replace(/battle/g, 'enemy'));
            }
            var cp = node.getAttribute('clip-path');
            if (cp && cp.indexOf('battle-clip') >= 0) {
                node.setAttribute('clip-path', cp.replace(/battle-clip/g, 'enemy-clip'));
            }
        });
        clone.querySelectorAll('filter[id], radialGradient[id], linearGradient[id]').forEach(function (node) {
            if (node.id && node.id.indexOf('battle') >= 0) {
                node.id = node.id.replace(/battle/g, 'enemy');
            }
        });
        container.innerHTML = '';
        container.appendChild(clone);
        container.classList.remove('hidden');
        // 生成后先按当前敌人数据上色
        if (currentBattle && currentBattle.getState) {
            try {
                var st = currentBattle.getState();
                var ew = (currentBattle.enemy && currentBattle.enemy.physiology)
                    ? (currentBattle.enemy.physiology.wounds || []) : [];
                _paintBattleSvgParts('enemy-', (st.enemy && st.enemy.durabilities) || {},
                    (st.enemy && st.enemy.maxDurabilities) || {}, ew);
            } catch (e) {}
        }
        return;
    }

    // 兜底：简易人形
    const parts = window.BODY_PARTS || (typeof BODY_PARTS !== 'undefined' ? BODY_PARTS : []);
    var html = '<svg viewBox="0 0 200 420" class="body-svg" id="enemy-body-svg" style="width:160px;height:auto;">';
    html += '<rect width="200" height="420" fill="#0f1724" rx="12"></rect>';
    parts.forEach(function (part, i) {
        var y = 40 + (i % 18) * 20;
        html += '<rect id="enemy-' + part.id + '" x="70" y="' + y + '" width="60" height="18" rx="3" fill="#22c55e" stroke="#374151" opacity="0.9"></rect>';
        html += '<text x="100" y="' + (y + 13) + '" fill="#e5e7eb" font-size="8" text-anchor="middle">' + (part.label || part.id) + '</text>';
    });
    html += '</svg>';
    container.innerHTML = html;
}


// v9.6 人体视图导出
window.markKilledEnemyAsCorpse = markKilledEnemyAsCorpse;
window.toggleBattleBodyView = toggleBattleBodyView;
window.toggleEnemyBodyView = toggleEnemyBodyView;
window.switchBodyView = switchBodyView;
window.updateBattleBodyView = updateBattleBodyView;
window.updateBattleBodyViewColors = updateBattleBodyViewColors;
window.generateEnemyBodySVG = generateEnemyBodySVG;
window.renderBodyDurability = renderBodyDurability;
window.updateBodySVG = updateBodySVG;

// ==================== 队友战斗状态 ====================
// 渲染队友状态栏（在战斗UI中显示）
function renderPartyStatusUI() {
    const container = document.getElementById('battle-party-status');
    const list = document.getElementById('party-status-list');
    if (!container || !list) return;

    var partyMembers = [];
    var pd = window.partySystem ? window.partySystem.partyData : null;
    if (pd && pd.members) {
        partyMembers = pd.members;
    } else if (window.partyData && window.partyData.members) {
        partyMembers = window.partyData.members;
    }

    // 无队员时隐藏
    if (partyMembers.length === 0) {
        container.classList.add('hidden');
        return;
    }
    container.classList.remove('hidden');

    var html = '';
    for (var i = 0; i < partyMembers.length; i++) {
        var m = partyMembers[i];
        // 确保血量不超过上限
        var displayHealth = Math.min(m.health, m.maxHealth);
        var healthPct = Math.floor((displayHealth / m.maxHealth) * 100);
        var qiPct = Math.floor((m.qi / m.maxQi) * 100);
        var isAlive = m.health > 0;
        var nameDisplay = isAlive ? m.name : '<span class="text-gray-600">' + m.name + '（阵亡）</span>';
        var healthColor = healthPct > 60 ? 'bg-green-500' : (healthPct > 30 ? 'bg-yellow-500' : 'bg-red-500');
        var opacity = isAlive ? '' : 'opacity-50';

        html += '<div class="flex items-center gap-2 text-xs bg-gray-800/50 p-1.5 rounded ' + opacity + '">';
        html += '<span class="w-16 text-gray-200 truncate font-bold">' + nameDisplay + '</span>';
        // 血量条
        html += '<div class="flex-1 h-2.5 bg-gray-700 rounded overflow-hidden">';
        html += '<div class="h-full ' + healthColor + ' rounded transition-all" style="width:' + healthPct + '%"></div></div>';
        html += '<span class="w-16 text-gray-400 text-right">' + Math.floor(m.health) + '/' + m.maxHealth + '</span>';
        // 真气条
        html += '<div class="flex-1 h-2.5 bg-gray-700 rounded overflow-hidden">';
        html += '<div class="h-full bg-blue-500 rounded transition-all" style="width:' + qiPct + '%"></div></div>';
        html += '<span class="w-12 text-gray-400 text-right">' + Math.floor(m.qi) + '/' + m.maxQi + '</span>';
        // 点击查看SVG
        if (currentBattle && currentBattle.partyMembers && currentBattle.partyMembers[i]) {
            html += '<button onclick="switchBodyView(\'party-' + i + '\')" class="text-xs bg-gray-600 hover:bg-gray-500 text-white px-1.5 py-0.5 rounded">👁️</button>';
        }
        html += '</div>';
    }
    list.innerHTML = html;
}

// 生成队员SVG躯体图
function generatePartyMemberSVGs() {
    if (!currentBattle || !currentBattle.partyMembers) return;
    const container = document.getElementById('party-body-svg-list');
    if (!container) return;
    container.innerHTML = '';

    var partyMembers = currentBattle.partyMembers;
    if (partyMembers.length === 0) return;

    const playerSvg = document.getElementById('battle-body-svg');
    if (!playerSvg) return;

    for (var i = 0; i < partyMembers.length; i++) {
        var member = partyMembers[i];
        var prefix = 'party-' + i + '-';
        var clone = playerSvg.cloneNode(true);
        clone.id = prefix + 'body-svg';

        // 改ID前缀 battle- → party-{i}-
        clone.querySelectorAll('[id]').forEach(function(node) {
            if (node.id && node.id.indexOf('battle-') === 0) {
                node.id = prefix + node.id.slice('battle-'.length);
            } else if (node.id && node.id.indexOf('battle') === 0) {
                node.id = node.id.replace(/^battle/, prefix.slice(0, -1));
            }
        });
        // 改filter/gradient/clip-path引用（v14.3 同敌人克隆修复）
        clone.querySelectorAll('[filter], [fill], [clip-path]').forEach(function(node) {
            var f = node.getAttribute('filter');
            if (f && f.indexOf('battle-') >= 0) {
                node.setAttribute('filter', f.replace(/battle-/g, prefix));
            }
            var fill = node.getAttribute('fill');
            if (fill && fill.indexOf('url(#battle') >= 0) {
                node.setAttribute('fill', fill.replace(/battle/g, prefix.slice(0, -1)));
            }
            var cp = node.getAttribute('clip-path');
            if (cp && cp.indexOf('battle-clip') >= 0) {
                node.setAttribute('clip-path', cp.replace(/battle-clip/g, prefix + 'clip'));
            }
        });
        clone.querySelectorAll('filter[id], radialGradient[id], linearGradient[id]').forEach(function(node) {
            if (node.id && node.id.indexOf('battle') >= 0) {
                node.id = node.id.replace(/battle/g, prefix.slice(0, -1));
            }
        });

        // 队员名字标签 + SVG
        var wrapper = document.createElement('div');
        wrapper.className = 'party-member-svg text-center';
        wrapper.id = prefix + 'wrapper';
        var p = document.createElement('p');
        p.className = 'text-xs text-gray-400 mb-1';
        p.textContent = member.name;
        wrapper.appendChild(p);
        // 缩小SVG尺寸
        clone.style.width = '120px';
        clone.style.height = 'auto';
        wrapper.appendChild(clone);
        container.appendChild(wrapper);
    }

    // 默认隐藏所有队员SVG（点击按钮才显示）
    container.querySelectorAll('.party-member-svg').forEach(function(el) {
        el.classList.add('hidden');
    });
}

// 更新队员SVG颜色
function updatePartyMemberSVGColors() {
    if (!currentBattle || !currentBattle.partyMembers) return;
    for (var i = 0; i < currentBattle.partyMembers.length; i++) {
        var member = currentBattle.partyMembers[i];
        var prefix = 'party-' + i + '-';
        var durabilities = member.durabilities || {};
        var maxDurabilities = member.maxDurabilities || {};
        var wounds = (member.physiology && member.physiology.wounds) || [];
        if (typeof _paintBattleSvgParts === 'function') {
            try {
                _paintBattleSvgParts(prefix, durabilities, maxDurabilities, wounds);
            } catch (e) {}
        }
    }
}

// 更新人体视图的队员按钮
function updatePartyBodyViewButtons() {
    const container = document.getElementById('party-body-view-buttons');
    if (!container) return;
    container.innerHTML = '';

    if (!currentBattle || !currentBattle.partyMembers) return;
    var partyMembers = currentBattle.partyMembers;
    if (partyMembers.length === 0) return;

    for (var i = 0; i < partyMembers.length; i++) {
        var btn = document.createElement('button');
        btn.className = 'text-xs bg-gray-600 text-gray-300 px-2 py-0.5 rounded hover:bg-gray-500';
        btn.textContent = partyMembers[i].name;
        btn.onclick = (function(idx) {
            return function() { switchBodyView('party-' + idx); };
        })(i);
        container.appendChild(btn);
    }
}

// v10.0：当前选中的招式
var _selectedMove = null;

function showBattleUI(battle) {
    if (battle) currentBattle = battle;
    if (!currentBattle) {
        if (typeof showMessage === 'function') showMessage('没有进行中的战斗', 'warning');
        return;
    }
    const modal = document.getElementById('battle-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    document.getElementById('battle-actions').classList.remove('hidden');
    document.getElementById('battle-result').classList.add('hidden');
    document.getElementById('battle-body-view').classList.add('hidden');
    currentBodyView = 'player'; // 重置为玩家视图
    _selectedMove = null; // 重置招式选择

    // 动态生成敌人SVG（如果不存在）
    generateEnemyBodySVG();

    // 队友状态栏 + 队员SVG
    renderPartyStatusUI();
    generatePartyMemberSVGs();
    updatePartyBodyViewButtons();

    // 生成招式选择 + 部位选择按钮
    const actionsDiv = document.getElementById('battle-actions');
    actionsDiv.innerHTML = _renderBattleActionsHTML();

    // 更新招式按钮状态
    _updateMoveButtons();

    // 显示生理状态条
    const physDiv = document.getElementById('battle-physiology');
    if (physDiv) physDiv.classList.remove('hidden');

    // 绑定回调
    currentBattle.onUpdate = updateBattleUI;
    currentBattle.onEnd = (winner) => {
        // v10.0：竞技场战斗结算
        if (currentBattle && currentBattle.enemy && currentBattle.enemy._isArenaOpponent) {
            try { if (typeof window._onArenaBattleEnd === 'function') window._onArenaBattleEnd(winner); } catch (e) {}
        }
        var actionsHtml = '<p class="text-xl font-bold ' + (winner === 'player' ? 'text-green-400' : 'text-red-400') + '">' + (winner === 'player' ? '🎉 胜利！' : '💀 败北...') + '</p>';
        // v10.0：战后可收服灵兽（非竞技场对手）
        // v12.9：noSpoils（敌人遁走）时不提供收服入口
        if (winner === 'player' && currentBattle && currentBattle.enemy && !currentBattle.enemy._isArenaOpponent && !(currentBattle.noSpoils)) {
            if (typeof window.canCaptureDefeatedEnemy === 'function' && window.canCaptureDefeatedEnemy(currentBattle.enemy)) {
                actionsHtml += '<button onclick="window.captureBeastAfterBattle(currentBattle.enemy); closeBattle();" class="bg-green-600 hover:bg-green-500 px-4 py-2 rounded text-white font-bold mt-2">🐾 收服灵兽</button> ';
            }
        }
        // v20.0：清剿兽潮还没打完 → 出"下一波"按钮
        if (winner === 'player' && currentBattle && currentBattle._isBeastTideRaid && window._tideRaid && window._tideRaid.wave < window._tideRaid.waves) {
            actionsHtml += '<button onclick="continueBeastTideRaid()" class="bg-orange-600 hover:bg-orange-500 px-4 py-2 rounded text-white font-bold mt-2">下一波（' + (window._tideRaid.wave + 1) + '/' + window._tideRaid.waves + '）</button> ';
        }
        // v20.0 1.1 天劫：渡劫期多波雷劫，胜利后出"迎接下一道天雷"按钮（仿兽潮多波）
        if (winner === 'player' && currentBattle && currentBattle._isHeavenlyTribulation && window._trib && window._trib.wave < window._trib.waves) {
            actionsHtml += '<button onclick="continueTribWave()" class="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded text-white font-bold mt-2">⚡ 迎接下一道天雷（' + (window._trib.wave + 1) + '/' + window._trib.waves + '）</button> ';
        }
        actionsHtml += '<button onclick="closeBattle()" class="bg-yellow-600 hover:bg-yellow-500 px-6 py-2 rounded text-gray-900 font-bold">继续</button>';
        document.getElementById('battle-actions').innerHTML = actionsHtml;
        if (winner === 'player' && currentBattle) {
            // 战利品系统 v1.0：战斗胜利不掉落物品，物品通过搜刮(人类)/解剖(野兽)获得
            // v12.9 noSpoils（遁修遁走）：文案降级，且跳过尸体标记/任务击杀/历练/真元/名气等全部收益
            var hasSpoils = !(currentBattle.noSpoils);
            var resultEl = document.getElementById('battle-result-text');
            var txt = hasSpoils ? '🎉 战斗胜利！' : '敌人遁走了，你一无所获';
            if (resultEl) resultEl.textContent = txt;

            // v20.0：清剿兽潮打赢本波 → 结算（还有波则出"下一波"按钮）
            if (hasSpoils && currentBattle._isBeastTideRaid && typeof window.settleBeastTideRaid === 'function') {
                try { window.settleBeastTideRaid(true); } catch (eTideWin) {}
            }
            // v20.0 1.1 天劫：打赢本道雷劫 → 结算（还有波出"下一道天雷"按钮，最后一波触发飞升）
            if (currentBattle._isHeavenlyTribulation && typeof window.settleTribulation === 'function') {
                try { window.settleTribulation(true); } catch (eTribWin) {}
            }
            // v20.0 2.9 宿敌寻仇：打赢降仇恨+灵石
            if (currentBattle._isRivalDuel && typeof window.settleRivalDuel === 'function') {
                try { window.settleRivalDuel(true); } catch (eRiv) {}
            }
            // v20.1 主线 Boss 多阶段：打完本阶段 → 结算（还有阶段出"下一阶段"按钮，最后阶段触发完整结算）
            if (currentBattle._isMainStoryBoss && typeof window.settleMainStoryBoss === 'function') {
                try { window.settleMainStoryBoss(true); } catch (eMSB) {}
            }

            // B4：灵兽经验仅由 battle.js 结算一次，此处不再重复 onBeastBattleEnd
            if (typeof window.onDungeonBattleResolved === 'function') {
                try { window.onDungeonBattleResolved(true); } catch (e) {}
            }
            if (hasSpoils && typeof window.setFlag === 'function') window.setFlag('recent_combat_victory');
            // B5/B4：任务击杀目标 + 成就检查
            try {
                if (window.questSystem && typeof window.questSystem.updateQuestObjective === 'function') {
                    // 广播型：遍历活跃任务
                }
                if (typeof window.updateQuestObjective === 'function') {
                    // no-op single
                }
                // v12.9：任务桥守卫——敌人遁走不算击杀，不广播 enemy:defeated
                if (typeof window.notifyQuestKill === 'function' && hasSpoils) {
                    window.notifyQuestKill(currentBattle && currentBattle.enemy);
                }
                if (window.achievementManager && typeof window.achievementManager.checkAllAchievements === 'function') {
                    window.achievementManager.checkAllAchievements(window.currentCharData || currentCharData);
                } else if (typeof window.checkAllAchievements === 'function') {
                    window.checkAllAchievements(window.currentCharData || currentCharData);
                }
            } catch (e) {}
            if (window.showEffect) try { window.showEffect('quest_done'); } catch (e) {}
            // 战斗胜利：将敌人标记为尸体（不直接移除）
            // v12.9：noSpoils（敌人遁走）时不标记尸体
            try {
                if (hasSpoils) markKilledEnemyAsCorpse(currentBattle);
            } catch (e) { console.warn('mark corpse failed', e); }
            // v9.7 战斗胜利获得历练+真元
            if (hasSpoils && typeof window.addTempering === 'function') {
                var enemyLevel = currentBattle.enemy?.level || 1;
                var temperingGain = 2;
                if (enemyLevel > 10) temperingGain = 5;
                if (enemyLevel > 20) temperingGain = 10;
                if (currentBattle.enemy?.type === 'boss') temperingGain = 15;
                window.addTempering(temperingGain);
            }
            if (hasSpoils && typeof window.addEssence === 'function' && currentBattle.enemy) {
                var enemyLevel = currentBattle.enemy?.level || 1;
                var essenceGain = Math.floor(enemyLevel * 0.3) + 1;
                if (currentBattle.enemy?.type === 'boss') essenceGain += 5;
                window.addEssence(essenceGain);
            }
            // v17.0 具名强敌：击杀落声望+必掉对应绝技秘籍，入册防刷
            try {
                var nemData = currentBattle.enemy && currentBattle.enemy._nemesis;
                if (nemData && typeof window.addFame === 'function') {
                    window.addFame(nemData.fameReward || 10);
                    if (nemData.manualId && typeof window.addItem === 'function') window.addItem(nemData.manualId, 1);
                    var dsNem = window.discipleState;
                    dsNem._nemesisDown = dsNem._nemesisDown || {};
                    dsNem._nemesisDown[nemData.key] = (typeof getAbsoluteDay === 'function') ? getAbsoluteDay() : ((window.timeSystem && window.timeSystem.gameTime) ? window.timeSystem.gameTime.currentDay : 0);
                    if (window.showMessage) window.showMessage('🏆 强敌授首！「' + String(currentBattle.enemy.name).replace(/^[^·]+·/, '') + '」之名传遍江湖。', 'success');
                }
            } catch (eNemRw) {}
            // 名气系统：战斗胜利增加名气
            if (hasSpoils && typeof window.addFame === 'function') {
                var enemyLevel = (currentBattle && currentBattle.enemy && currentBattle.enemy.level) || 1;
                var fameGain = enemyLevel >= 10 ? 3 : (enemyLevel >= 5 ? 2 : 1);
                if (currentBattle.enemy?.type === 'boss') fameGain = 5;
                window.addFame(fameGain);
            }
            // 战后保留玩家生理数据 + Entity 引用（v9.5 G）
            if (currentBattle && currentBattle.player && currentBattle.player.physiology) {
                window._playerPhysiology = currentBattle.player;
                window._playerEntity = currentBattle.player;
            }
        } else if (winner === 'enemy') {
            // B4：败北灵兽结算已在 battle.js
            if (typeof window.onDungeonBattleResolved === 'function') {
                try { window.onDungeonBattleResolved(false); } catch (e) {}
            }
            var failEl = document.getElementById('battle-result-text');
            if (failEl) failEl.textContent = '你战败了，伤势沉重……';
            if (window.currentCharData) {
                // 精力真气清空
                window.currentCharData.energy = 0;
                window.currentCharData.qi = 0;
            }
            // v20.0：清剿兽潮战败 → 带伤结算（扣气血/精力/真气 + 城望 + 大事记 + 就医提示）
            if (currentBattle && currentBattle._isBeastTideRaid && typeof window.settleBeastTideRaid === 'function') {
                try { window.settleBeastTideRaid(false); } catch (eTideLose) {}
            }
            // v20.0 1.1 天劫战败 → 标记天劫失败（残魂态/转世由下方 maybeEnterSoulState + handleDefeatRevival 既有流程接管）
            if (currentBattle && currentBattle._isHeavenlyTribulation && typeof window.settleTribulation === 'function') {
                try { window.settleTribulation(false); } catch (eTribLose) {}
            }
            // v20.0 2.9 宿敌寻仇战败 → 重伤
            if (currentBattle && currentBattle._isRivalDuel && typeof window.settleRivalDuel === 'function') {
                try { window.settleRivalDuel(false); } catch (eRivLose) {}
            }
            // v20.1 主线 Boss 战败 → Boss 退去可再战（主线不卡死）
            if (currentBattle && currentBattle._isMainStoryBoss && typeof window.settleMainStoryBoss === 'function') {
                try { window.settleMainStoryBoss(false); } catch (eMSBL) {}
            }
            // 时间跳半天（720分钟 = 12小时）
            if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
                try { window.timeSystem.advanceTime(720, '战败昏迷'); } catch (e) {}
            }
            // P0-5 死亡仙侠化：金丹+且肉身被毁 → 神魂离体（残魂态），接管本次战败
            if (!(window.SoulStateSystem && window.SoulStateSystem.maybeEnterSoulState(currentBattle))) {
                // 处理战败复活剧情
                handleDefeatRevival();
            }
        }
        // v4.2: 战后刷新医疗物品按钮
        if (typeof refreshBattleMedicalItems === 'function') {
            refreshBattleMedicalItems();
        }
    };

    updateBattleUI();
    // v4.2: 刷新医疗物品按钮
    if (typeof refreshBattleMedicalItems === 'function') {
        refreshBattleMedicalItems();
    }
}

function battleAttackPart(partId) {
    if (!currentBattle) return;
    // 有选中招式时使用招式攻击
    if (_selectedMove) {
        currentBattle.playerAttackWithMove(partId, _selectedMove);
        _selectedMove = null;
    } else {
        currentBattle.playerAttack(partId);
    }
    updateBattleUI();
}

// ============ v10.0 战斗招式UI ============
function _renderBattleActionsHTML() {
    var moves = (typeof window.getActiveAttackMoves === 'function') ? window.getActiveAttackMoves() : [];
    var quickMoves = (typeof window.getQuickMoves === 'function') ? window.getQuickMoves() : [];
    var allMoves = (typeof window.getAllLearnedMoves === 'function') ? window.getAllLearnedMoves() : [];
    // 1.2 CD制：招式冷却中则 UI 灰显
    var _cdMap = (currentBattle && currentBattle._moveCD) || {};
    var html = '<div class="w-full mb-2">';

    // 常用栏（优先显示）
    if (quickMoves.length > 0) {
        html += '<p class="text-xs text-yellow-400 mb-1">⭐ 快捷招式</p>';
        html += '<div class="flex flex-wrap gap-1 mb-2">';
        html += '<button onclick="selectBattleMove(null)" class="text-xs px-2 py-1 rounded ' + (!_selectedMove ? 'bg-yellow-600 text-gray-900' : 'bg-gray-700 text-white') + '" id="move-default">👊 普通攻击</button>';
        quickMoves.forEach(function(m, i) {
            var isSelected = _selectedMove && _selectedMove.moveId === m.moveId;
            // 从完整招式列表中找到对应索引
            var globalIdx = -1;
            for (var gi = 0; gi < moves.length; gi++) {
                if (moves[gi].moveId === m.moveId) { globalIdx = gi; break; }
            }
            if (globalIdx >= 0) {
                var _onCD = _cdMap[m.moveId] > 0;
                html += '<button ' + (_onCD ? 'disabled' : 'onclick="selectBattleMove(' + globalIdx + ')"') + ' class="text-xs px-2 py-1 rounded ' + (isSelected ? 'bg-yellow-600 text-gray-900' : _onCD ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gray-700 text-white') + '">' + (m.icon || '⚔️') + ' ' + m.name + (_onCD ? ' ⏳' + _cdMap[m.moveId] : '') + '</button>';
            }
        });
        html += '</div>';
    }

    // 全部招式（折叠显示）
    var hasExtra = moves.length > quickMoves.length;
    if (hasExtra) {
        html += '<details class="mb-2">';
        html += '<summary class="text-xs text-gray-400 cursor-pointer hover:text-gray-300">📂 全部招式（' + moves.length + '招）</summary>';
        html += '<div class="flex flex-wrap gap-1 mt-1">';
        if (quickMoves.length === 0) {
            html += '<button onclick="selectBattleMove(null)" class="text-xs px-2 py-1 rounded ' + (!_selectedMove ? 'bg-yellow-600 text-gray-900' : 'bg-gray-700 text-white') + '" id="move-default">👊 普通攻击</button>';
        }
        moves.forEach(function(m, i) {
            var isSelected = _selectedMove && _selectedMove.moveId === m.moveId;
            var _onCD2 = _cdMap[m.moveId] > 0;
            html += '<button ' + (_onCD2 ? 'disabled' : 'onclick="selectBattleMove(' + i + ')"') + ' class="text-xs px-2 py-1 rounded ' + (isSelected ? 'bg-yellow-600 text-gray-900' : _onCD2 ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gray-700 text-white') + '">' + (m.icon || '⚔️') + ' ' + m.skillName + '·' + m.name + (_onCD2 ? ' ⏳' + _cdMap[m.moveId] : '') + '</button>';
        });
        html += '</div></details>';
    } else if (quickMoves.length === 0) {
        // 没有常用栏也没有招式时显示默认
        html += '<div class="flex flex-wrap gap-1 mb-2">';
        html += '<button onclick="selectBattleMove(null)" class="text-xs px-2 py-1 rounded ' + (!_selectedMove ? 'bg-yellow-600 text-gray-900' : 'bg-gray-700 text-white') + '" id="move-default">👊 普通攻击</button>';
        moves.forEach(function(m, i) {
            var isSelected = _selectedMove && _selectedMove.moveId === m.moveId;
            var _onCD2 = _cdMap[m.moveId] > 0;
            html += '<button ' + (_onCD2 ? 'disabled' : 'onclick="selectBattleMove(' + i + ')"') + ' class="text-xs px-2 py-1 rounded ' + (isSelected ? 'bg-yellow-600 text-gray-900' : _onCD2 ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gray-700 text-white') + '">' + (m.icon || '⚔️') + ' ' + m.skillName + '·' + m.name + (_onCD2 ? ' ⏳' + _cdMap[m.moveId] : '') + '</button>';
        });
        html += '</div>';
    }

    // 部位选择区
    html += '<p class="text-xs text-gray-400 mb-1">选择攻击部位：</p>';
    html += '<div class="grid grid-cols-4 gap-1 mt-1">';
    BODY_PARTS.forEach(function(p) {
        html += '<button onclick="battleAttackPart(\'' + p.id + '\')" class="bg-gray-700 hover:bg-gray-600 text-xs px-2 py-1 rounded text-white">' + p.label + '</button>';
    });
    html += '</div></div>';
    html += '<div class="flex gap-2 mt-2">';
    html += '<button onclick="openQuickMoveManager()" class="bg-yellow-800 hover:bg-yellow-700 px-3 py-1 rounded text-white text-xs">⚙️ 设置快捷</button>';
    html += '<button onclick="battleFlee()" class="bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded text-white text-xs">🏃 逃跑</button>';
    html += '<button onclick="toggleMedicalActions()" class="bg-blue-700 hover:bg-blue-600 px-3 py-1 rounded text-white text-xs">🩺 医疗</button>';
    html += '</div>';
    return html;
}

function _updateMoveButtons() {
    // 由 selectBattleMove 处理
}

function selectBattleMove(index) {
    if (index === null) { _selectedMove = null; }
    else {
        var moves = (typeof window.getActiveAttackMoves === 'function') ? window.getActiveAttackMoves() : [];
        _selectedMove = moves[index] || null;
    }
    // 刷新UI
    const actionsDiv = document.getElementById('battle-actions');
    if (actionsDiv) {
        actionsDiv.innerHTML = _renderBattleActionsHTML();
    }
}

// 切换医疗面板显示
function toggleMedicalActions() {
    const el = document.getElementById('battle-medical-actions');
    if (el) el.classList.toggle('hidden');
}

// ============ 常用栏管理 ============
function openQuickMoveManager() {
    var allMoves = (typeof window.getAllLearnedMoves === 'function') ? window.getAllLearnedMoves() : [];
    // 按功法分组
    var grouped = {};
    allMoves.forEach(function(m) {
        var key = m.skillName + ' (' + m.skillType + ')';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(m);
    });

    var html = '<div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onclick="if(event.target===this)this.remove()">';
    html += '<div class="bg-gray-800 border-2 border-blue-500 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">';
    html += '<div class="flex justify-between items-center mb-4"><h3 class="text-xl font-bold text-yellow-400">⚙️ 快捷招式设置</h3>';
    html += '<button onclick="this.closest(\'.fixed\').remove()" class="text-gray-400 hover:text-white text-2xl">&times;</button></div>';
    html += '<p class="text-xs text-gray-400 mb-3">拖拽下面的招式到6个快捷槽中，战斗中优先显示。点击槽位可清空。</p>';

    // 6个快捷槽
    html += '<div class="flex gap-2 mb-4 flex-wrap justify-center">';
    for (var i = 0; i < 6; i++) {
        var slotMoveId = window.quickMoveSlots && window.quickMoveSlots[i] ? window.quickMoveSlots[i] : '';
        var slotMove = null;
        if (slotMoveId) {
            for (var mi = 0; mi < allMoves.length; mi++) {
                if (allMoves[mi].moveId === slotMoveId) { slotMove = allMoves[mi]; break; }
            }
        }
        html += '<div class="w-20 h-20 bg-gray-700 rounded-lg border border-gray-600 flex flex-col items-center justify-center text-center relative">';
        if (slotMove) {
            html += '<span class="text-lg">' + (slotMove.icon || '⚔️') + '</span>';
            html += '<span class="text-xs text-gray-200 mt-0.5">' + slotMove.name + '</span>';
            html += '<button onclick="setQuickMoveSlot(' + i + ', \'\'); openQuickMoveManager()" class="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 rounded-full text-white text-xs flex items-center justify-center">×</button>';
        } else {
            html += '<span class="text-xs text-gray-500">空</span>';
        }
        html += '<span class="text-xs text-gray-600 mt-0.5">槽' + (i+1) + '</span>';
        html += '</div>';
    }
    html += '</div>';

    // 所有可用的招式
    html += '<h4 class="text-sm font-bold text-gray-300 mb-2">📚 已学招式（点击添加到空槽）</h4>';
    html += '<div class="space-y-2">';
    for (var groupName in grouped) {
        html += '<div class="bg-gray-700/30 rounded p-2">';
        html += '<p class="text-xs text-gray-400 mb-1">' + groupName + '</p>';
        html += '<div class="flex flex-wrap gap-1">';
        grouped[groupName].forEach(function(m) {
            html += '<button onclick="clickMoveToQuickSlot(\'' + m.moveId + '\')" class="text-xs bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded">' + (m.icon || '⚔️') + ' ' + m.name + '</button>';
        });
        html += '</div></div>';
    }
    html += '</div>';

    html += '<div class="mt-4 text-center"><button onclick="this.closest(\'.fixed\').remove()" class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded">完成</button></div>';
    html += '</div></div>';

    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstElementChild);
}

// 点击招式添加到第一个空槽
function clickMoveToQuickSlot(moveId) {
    if (!window.quickMoveSlots) return;
    // 检查是否已存在
    for (var i = 0; i < window.quickMoveSlots.length; i++) {
        if (window.quickMoveSlots[i] === moveId) return; // 已经在了
    }
    // 找第一个空槽
    for (var j = 0; j < window.quickMoveSlots.length; j++) {
        if (!window.quickMoveSlots[j]) {
            if (typeof window.setQuickMoveSlot === 'function') {
                window.setQuickMoveSlot(j, moveId);
            }
            break;
        }
    }
    openQuickMoveManager(); // 刷新
}

function battleFlee() {
    if (!currentBattle) return;
    // v13.1 遁术绝技：玩家持 escape 技时逃跑基础成功率 0.5→0.72（仍吃符箓加成）
    var baseChance = (currentBattle.player && typeof currentBattle.player.hasAbility === 'function'
        && currentBattle.player.hasAbility('escape')) ? 0.72 : 0.5;
    var fleeChance = (window.TalismanSystem && typeof window.TalismanSystem.getEscapeChance === 'function')
        ? window.TalismanSystem.getEscapeChance(baseChance) : baseChance;
    if (window.TalismanSystem && typeof window.TalismanSystem.consumeEscapeBoost === 'function') window.TalismanSystem.consumeEscapeBoost();
    if (Math.random() < fleeChance) {
        currentBattle.log.push({ msg: '你成功逃脱了！' });
        if (baseChance > 0.5) currentBattle.log.push({ msg: '💨 遁术精妙，身形飘忽难测' }); // v13.1 遁术加成播报
        updateBattleUI();
        setTimeout(() => closeBattle(), 500);
    } else {
        currentBattle.log.push({ msg: '逃跑失败！' });
        currentBattle.isPlayerTurn = false;
        setTimeout(() => {
            currentBattle.enemyTurn();
            updateBattleUI();
        }, 300);
    }
}

// ===== 机体扩展v8.0：战斗医疗行动 =====
function battleMedicalAction(action) {
    if (!currentBattle || !currentBattle.player) return;
    const player = currentBattle.player;
    let result = false;
    const log = currentBattle.log;

    switch (action) {
        case 'bandage': {
            // 包扎：找到最严重的伤口
            const wounds = player.physiology.wounds.filter(w => w.bleeding);
            if (wounds.length === 0) {
                log.push({ msg: '没有需要包扎的伤口' });
                break;
            }
            // 按外出血速率排序，处理最严重的
            wounds.sort((a, b) => b.externalBleedRate - a.externalBleedRate);
            result = bandageWound(player, wounds[0].id);
            if (result) log.push({ msg: '🩹 包扎了「' + wounds[0].partId + '」的伤口，稳定度+40' });
            break;
        }
        case 'hemostatic': {
            result = hemostaticTreatment(player);
            if (result) log.push({ msg: '💊 使用止血药，外出血减半，内出血停止累积' });
            break;
        }
        case 'pressure': {
            result = pressureBleeding(player);
            if (result) log.push({ msg: '✋ 按压止血，外出血临时降低50%' });
            break;
        }
        case 'willpower': {
            result = willpowerSuppress(player);
            if (result) log.push({ msg: '🧘 意志压制，疼痛减少20点' });
            break;
        }
    }

    if (result && currentBattle.isPlayerTurn) {
        // 消耗1回合
        currentBattle.isPlayerTurn = false;
        currentBattle.turn++;
        // 处理生理
        if (typeof processPhysiology === 'function') {
            processPhysiology(player, 6);
            processPhysiology(currentBattle.enemy, 6);
        }
        currentBattle._checkEnd();
        updateBattleUI();
        // 敌人反击
        if (!currentBattle.isFinished) {
            setTimeout(() => currentBattle.enemyTurn(), 300);
        }
    } else if (!result) {
        log.push({ msg: '医疗行动无效或已无必要' });
        updateBattleUI();
    }
}

// ==================== v4.2 伤口查看与医疗物品系统 ====================

/** 切换伤口面板显示 */
function toggleWoundInspection() {
    const panel = document.getElementById('battle-wound-panel');
    if (!panel) return;
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) {
        updateWoundInspection();
    }
}

/** 更新伤口详情面板内容 */
function updateWoundInspection() {
    const content = document.getElementById('battle-wound-content');
    if (!content || !currentBattle) return;
    
    const player = currentBattle.player;
    if (!player || !player.physiology) {
        content.innerHTML = '<div class="text-gray-500">暂无伤势数据</div>';
        return;
    }
    
    const phys = player.physiology;
    const wounds = phys.wounds || [];
    const labels = window.CRITICAL_CAUSE_LABELS || {};
    const mods = window.PART_PHYSIOLOGY_MODIFIERS || {};
    
    // 获取部位标签
    function getPartLabel(partId) {
        const bp = window.BODY_PARTS || [];
        const found = bp.find(function(p) { return p.id === partId; });
        return found ? found.label : partId;
    }
    
    // 生成伤口列表
    let html = '<div class="text-gray-400 mb-1">共 ' + wounds.length + ' 处伤口</div>';
    
    if (wounds.length === 0) {
        html += '<div class="text-green-400">✅ 无外伤</div>';
    } else {
        html += '<div class="space-y-1">';
        for (var wi = 0; wi < wounds.length; wi++) {
            var w = wounds[wi];
            if (!w) continue;
            var partLabel = getPartLabel(w.partId);
            var depthLabel = ['', '表层', '中等', '深部', '贯穿'][w.depth] || ('深度' + w.depth);
            var bleedIcon = w.bleeding ? '🩸' : '✅';
            var bleedText = w.bleeding ? '出血中' : '已止血';
            var stabText = w.stabilization > 0 ? (' | 稳定度: ' + Math.round(w.stabilization)) : '';
            var clotText = w.clottingProgress > 0 ? (' | 凝血: ' + Math.round(w.clottingProgress) + '%') : '';
            html += '<div class="bg-gray-700/50 rounded p-1.5 border border-gray-600">';
            html += '<div class="flex justify-between"><span class="text-gray-200">' + bleedIcon + ' ' + partLabel + '</span><span class="text-gray-400">' + depthLabel + '</span></div>';
            html += '<div class="text-gray-400 text-xs">严重度: ' + Math.round(w.severity || 0) + ' | 外出血: ' + Math.round(w.externalBleedRate || 0) + ' | 内出血: ' + Math.round(w.internalBleedRate || 0) + stabText + clotText + '</div>';
            html += '</div>';
        }
        html += '</div>';
    }
    
    // 关键伤信息
    if (phys.criticalInjuries) {
        var keys = Object.keys(phys.criticalInjuries);
        if (keys.length > 0) {
            html += '<div class="mt-2 pt-2 border-t border-gray-600">';
            html += '<div class="text-red-400 font-bold mb-1">⚠️ 关键伤势</div>';
            for (var ki = 0; ki < keys.length; ki++) {
                var label = labels[keys[ki]] || keys[ki];
                var count = phys.criticalInjuries[keys[ki]];
                html += '<div class="text-red-300">- ' + label + (count > 1 ? ' (x' + count + ')' : '') + '</div>';
            }
            html += '</div>';
        }
    }
    
    // 生理状态摘要
    html += '<div class="mt-2 pt-2 border-t border-gray-600 text-gray-400">';
    html += '血量: ' + Math.round(phys.bloodVolume || 0) + ' | 循环: ' + Math.round(phys.circulation || 0);
    html += ' | 疼痛: ' + Math.round(phys.painLoad || 0);
    html += ' | 缺氧: ' + Math.round(phys.oxygenDebt || 0);
    html += ' | 意识: ' + Math.round(phys.consciousness || 0);
    html += '</div>';
    
    content.innerHTML = html;
}

/** 刷新战斗医疗物品按钮（在 showBattleUI 和 updateBattleUI 中调用） */
function refreshBattleMedicalItems() {
    const container = document.getElementById('battle-medical-items');
    if (!container) return;
    
    // 检查背包
    var inventory = window.inventory;
    if (!inventory || !inventory.items) {
        container.innerHTML = '<span class="text-gray-500">背包不可用</span>';
        return;
    }
    
    // 定义可用的医疗物品
    var medicalItems = [
        { id: 'med_bandage', name: '绷带', icon: '🩹', action: 'useMedItem_bandage', desc: '包扎最严重伤口' },
        { id: 'med_bandage_advanced', name: '灵布绷带', icon: '🩹', action: 'useMedItem_bandage_advanced', desc: '高效包扎' },
        { id: 'pill_hemostatic', name: '止血丹', icon: '💊', action: 'useMedItem_hemostatic', desc: '全身止血' },
    ];
    
    var html = '';
    var hasAny = false;
    
    for (var mi = 0; mi < medicalItems.length; mi++) {
        var miData = medicalItems[mi];
        var count = 0;
        // 查找背包中的物品数量
        if (inventory.items[miData.id]) {
            count = inventory.items[miData.id].count || 1;
        } else if (inventory.items[miData.id + 's']) {
            count = inventory.items[miData.id + 's'].count || 1;
        }
        
        if (count > 0) {
            hasAny = true;
            html += '<button onclick="battleUseMedicalItem(\'' + miData.id + '\')" class="text-xs bg-green-700 hover:bg-green-600 text-white px-2 py-1 rounded" title="' + miData.desc + '（剩余' + count + '）">' + miData.icon + ' ' + miData.name + '</button>';
        }
    }
    
    if (!hasAny) {
        html = '<span class="text-gray-500">无医疗物品（可在坊市购买绷带/止血丹）</span>';
    }
    
    container.innerHTML = html;
}

/** 在战斗中使用医疗物品 */
function battleUseMedicalItem(itemId) {
    if (!currentBattle || !currentBattle.player) return;
    if (!currentBattle.isPlayerTurn) {
        currentBattle.log.push({ msg: '现在不是你的回合' });
        updateBattleUI();
        return;
    }
    
    var player = currentBattle.player;
    var phys = player.physiology;
    var log = currentBattle.log;
    var result = false;
    var itemName = '';
    
    // 检查是否有该物品
    var inventory = window.inventory;
    if (!inventory || !inventory.items) {
        log.push({ msg: '背包不可用' });
        updateBattleUI();
        return;
    }
    
    var item = inventory.items[itemId];
    if (!item || !item.count || item.count <= 0) {
        log.push({ msg: '没有足够的物品' });
        updateBattleUI();
        return;
    }
    
    // 根据物品ID执行效果
    switch (itemId) {
        case 'med_bandage': {
            itemName = '绷带';
            var wounds = phys.wounds.filter(function(w) { return w.bleeding; });
            if (wounds.length === 0) {
                log.push({ msg: '没有需要包扎的伤口' });
                updateBattleUI();
                return;
            }
            wounds.sort(function(a, b) { return b.externalBleedRate - a.externalBleedRate; });
            result = bandageWound(player, wounds[0].id);
            // 额外效果：稳定度+10（比徒手包扎更强）
            if (result) {
                var targetWound = phys.wounds.find(function(w) { return w.id === wounds[0].id; });
                if (targetWound) targetWound.stabilization = Math.min(100, targetWound.stabilization + 10);
            }
            break;
        }
        case 'med_bandage_advanced': {
            itemName = '灵布绷带';
            var wounds2 = phys.wounds.filter(function(w) { return w.bleeding; });
            if (wounds2.length === 0) {
                log.push({ msg: '没有需要包扎的伤口' });
                updateBattleUI();
                return;
            }
            wounds2.sort(function(a, b) { return b.externalBleedRate - a.externalBleedRate; });
            result = bandageWound(player, wounds2[0].id);
            // 灵布绷带更强：额外+25稳定度
            if (result) {
                var targetWound2 = phys.wounds.find(function(w) { return w.id === wounds2[0].id; });
                if (targetWound2) targetWound2.stabilization = Math.min(100, targetWound2.stabilization + 25);
            }
            break;
        }
        case 'pill_hemostatic': {
            itemName = '止血丹';
            result = hemostaticTreatment(player);
            // 额外效果：bloodVolume+10
            if (result) {
                phys.bloodVolume = Math.min(100, (phys.bloodVolume || 0) + 10);
                phys.health = phys.bloodVolume;
            }
            break;
        }
    }
    
    if (result) {
        // 消耗物品
        item.count--;
        // 添加日志
        log.push({ msg: '🎒 使用' + itemName + '，效果显著！' });
        
        // 消耗1回合
        currentBattle.isPlayerTurn = false;
        currentBattle.turn++;
        if (typeof processPhysiology === 'function') {
            processPhysiology(player, 6);
            processPhysiology(currentBattle.enemy, 6);
        }
        currentBattle._checkEnd();
        updateBattleUI();
        // 刷新医疗物品按钮
        refreshBattleMedicalItems();
        if (!currentBattle.isFinished) {
            setTimeout(function() { currentBattle.enemyTurn(); }, 300);
        }
    } else {
        log.push({ msg: '使用' + itemName + '无效' });
        updateBattleUI();
    }
}

// ==================== 装备与功法系统 ====================
// v9.6：取消独立运功选择/装备选择；在装备栏与运功栏槽内直接选择

function renderEquipmentPanel() {
    renderEquipmentSlotsInline();
    renderSkillSlotsInline();
    if (typeof updateEquipCombatSummary === 'function') updateEquipCombatSummary();
    // 兼容旧调用：空操作或同步隐藏容器
    const grid = document.getElementById('skill-browse-grid');
    if (grid) grid.innerHTML = '';
    const panel = document.getElementById('equip-select-panel');
    if (panel) panel.innerHTML = '';
}

/** v9.8：装备页攻击/防御/速度/负荷显示 */
function updateEquipCombatSummary() {
    var atkEl = document.getElementById('equip-stat-attack');
    var defEl = document.getElementById('equip-stat-defense');
    var spdEl = document.getElementById('equip-stat-speed');
    var loadEl = document.getElementById('equip-stat-load');
    var loadDetail = document.getElementById('equip-stat-load-detail');
    if (!atkEl && !defEl && !spdEl && !loadEl) return;
    var stats = null;
    try {
        if (typeof window.getDerivedCombatStats === 'function') {
            stats = window.getDerivedCombatStats(null);
        }
    } catch (e) {}
    if (stats) {
        if (atkEl) atkEl.textContent = stats.attack;
        if (defEl) defEl.textContent = stats.defense;
        if (spdEl) spdEl.textContent = stats.speed;
        if (loadEl && stats.load) {
            loadEl.textContent = (stats.load.icon || '') + ' ' + stats.load.tier;
            loadEl.className = 'text-sm font-bold ' + (stats.load.overloaded ? 'text-red-400' : 'text-yellow-400');
        }
        if (loadDetail && stats.load) {
            // 负荷详情跟在负荷等级后面（同行显示）
            loadDetail.textContent = stats.load.current + ' / ' + stats.load.capacity +
                '（' + stats.load.rate + '%）' + (stats.load.overloaded ? ' ⚠️超载' : '');
            // 添加蓝色问号按钮（点击显示负荷效果，与人物页属性说明风格一致）
            var qmark = loadDetail.nextElementSibling;
            if (!qmark || !qmark.classList.contains('load-tooltip-trigger')) {
                qmark = document.createElement('button');
                qmark.className = 'load-tooltip-trigger w-3.5 h-3.5 ml-1 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-400 cursor-help';
                qmark.style.cssText = 'font-size:9px;line-height:1';
                qmark.textContent = '?';
                qmark.onclick = function(e) {
                    e.stopPropagation();
                    var info = '';
                    if (stats.load.loadSpeedMul !== 1) info += '速度倍率: ' + stats.load.loadSpeedMul + '\n';
                    if (stats.load.loadDodgeBonus) info += '闪避: ' + (stats.load.loadDodgeBonus > 0 ? '+' : '') + stats.load.loadDodgeBonus + '%\n';
                    if (stats.load.loadBlockBonus) info += '格挡: ' + (stats.load.loadBlockBonus > 0 ? '+' : '') + stats.load.loadBlockBonus + '%\n';
                    if (stats.load.staminaMul && stats.load.staminaMul !== 1) info += '体力消耗: ' + stats.load.staminaMul + '\n';
                    if (stats.load.overloaded) info += '⚠️ 超载：禁止新装备\n';
                    info += '当前负荷: ' + stats.load.current + ' / ' + stats.load.capacity;
                    if (window.showTooltip) window.showTooltip(info);
                    else if (window.showMessage) window.showMessage(info, 'info');
                };
                if (loadDetail.parentNode) {
                    loadDetail.parentNode.appendChild(qmark);
                }
            }
        }
    } else {
        if (atkEl) atkEl.textContent = '—';
        if (defEl) defEl.textContent = '—';
        if (spdEl) spdEl.textContent = '—';
        if (loadEl) loadEl.textContent = '—';
    }
}
window.updateEquipCombatSummary = updateEquipCombatSummary;

/** 获取已学会的功法定义列表 */
function getLearnedSkillDefs() {
    const KS = window.KnowledgeSystem;
    let learnedIds = [];
    if (KS && typeof KS.getLearnedSkillIds === 'function') {
        learnedIds = KS.getLearnedSkillIds();
    } else if (window.learnedSecrets && window.learnedSecrets.length) {
        learnedIds = window.learnedSecrets.map(function (id) {
            return (KS && KS.resolveSkillId) ? (KS.resolveSkillId(id) || id) : id;
        }).filter(function (id, i, a) { return a.indexOf(id) === i; });
    }
    return learnedIds.map(function (id) {
        return (typeof findSkillById === 'function' ? findSkillById(id) : null)
            || (window.findSkillById && window.findSkillById(id));
    }).filter(Boolean);
}

/** 装备栏：各槽内「选择」展开背包可装物品 */
function renderEquipmentSlotsInline() {
    const equipContainer = document.getElementById('equipment-slots');
    if (!equipContainer) return;

    if (!window.equipSelectExpanded) window.equipSelectExpanded = {};

    const inv = window.inventory;
    const slots = (inv && inv.slots) ? inv.slots : [];
    const byEquipSlot = {};
    equipmentSlots.forEach(function (s) { byEquipSlot[s.id] = []; });
    slots.forEach(function (item) {
        if (!item) return;
        const tpl = (typeof item.getTemplate === 'function') ? item.getTemplate() : null;
        if (!tpl) return;
        if (tpl.type !== 'weapon' && tpl.type !== 'armor' && tpl.type !== 'accessory' && tpl.type !== 'equipment') return;
        const target = tpl.slot;
        if (!target || !byEquipSlot.hasOwnProperty(target)) return;
        byEquipSlot[target].push({ uid: item.uid, template: tpl, count: item.count || 1 });
    });

    let html = '';
    equipmentSlots.forEach(function (slot) {
        const equipped = currentEquipment[slot.id];
        const itemName = equipped ? equipped.name : '空';
        const itemColor = equipped ? 'text-yellow-400' : 'text-gray-600';
        const isOpen = !!window.equipSelectExpanded[slot.id];
        let enhTag = '';
        if (equipped) {
            const tags = [];
            if (equipped.enhancementLevel) tags.push('+' + equipped.enhancementLevel);
            if (equipped.refineLevel) tags.push('精' + equipped.refineLevel);
            if (equipped.enchantLevel) tags.push('附' + equipped.enchantLevel);
            if (equipped.breakthroughLevel) tags.push('突' + equipped.breakthroughLevel);
            if (tags.length) enhTag = '<span class="text-xs text-orange-400 ml-1">' + tags.join(' ') + '</span>';
            else if (typeof window.getEnhancementDescription === 'function') {
                const d = window.getEnhancementDescription(equipped);
                if (d) enhTag = '<span class="text-xs text-orange-400/80 ml-1">' + d + '</span>';
            }
        }

        html += '<div class="bg-gray-800 rounded border border-gray-700 overflow-hidden">';
        html += '<div class="flex justify-between items-center p-2 gap-2">';
        html += '<div class="flex items-center gap-2 min-w-0">';
        html += '<span class="text-lg">' + slot.icon + '</span>';
        html += '<div class="min-w-0">';
        html += '<span class="text-xs text-gray-400">' + slot.name + '</span>';
        html += '<p class="text-sm ' + itemColor + ' font-bold truncate">' + itemName + enhTag + '</p>';
        html += '</div></div>';
        html += '<div class="flex items-center gap-1 flex-shrink-0">';
        if (equipped) {
            html += '<button type="button" onclick="unequipItemToBag(\'' + slot.id + '\')" class="text-xs text-gray-500 hover:text-red-400 px-1">卸下</button>';
        }
        html += '<button type="button" onclick="toggleEquipSelect(\'' + slot.id + '\')" class="text-xs px-2 py-1 rounded font-bold ' +
            (isOpen ? 'bg-amber-700 hover:bg-amber-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-200') + '">' +
            (isOpen ? '收起' : '选择') + '</button>';
        html += '</div></div>';

        if (isOpen) {
            const list = byEquipSlot[slot.id] || [];
            html += '<div class="border-t border-gray-700 p-2 space-y-1 bg-gray-900/50">';
            if (!list.length) {
                html += '<p class="text-xs text-gray-500 text-center py-2">背包中无可用' + slot.name + '装备</p>';
            } else {
                list.forEach(function (entry) {
                    const tpl = entry.template;
                    html += '<div class="flex items-center justify-between gap-2 p-2 rounded border border-gray-700 hover:border-amber-600">';
                    html += '<div class="flex items-center gap-2 min-w-0">';
                    html += '<span>' + (tpl.icon || '📦') + '</span>';
                    html += '<div class="min-w-0">';
                    html += '<p class="text-sm text-gray-200 font-bold truncate">' + tpl.name +
                        (entry.count > 1 ? ' ×' + entry.count : '') + '</p>';
                    html += '<p class="text-xs text-gray-500">' + (tpl.quality || tpl.type || '') + '</p>';
                    html += '</div></div>';
                    html += '<button type="button" onclick="equipItemFromInventory(\'' + entry.uid + '\')" ' +
                        'class="text-xs bg-amber-700 hover:bg-amber-600 text-white px-2 py-1 rounded">装备</button>';
                    html += '</div>';
                });
            }
            html += '</div>';
        }
        html += '</div>';
    });
    equipContainer.innerHTML = html;
}

/** 运功栏：三槽内「选择」展开已学功法 */
function renderSkillSlotsInline() {
    const skillContainer = document.getElementById('skill-slots-container');
    if (!skillContainer) return;

    if (!window.skillSelectExpanded) {
        window.skillSelectExpanded = { skill_main: false, skill_sub1: false, skill_sub2: false };
    }

    const skills = getLearnedSkillDefs();
    const bySlot = { skill_main: [], skill_sub1: [], skill_sub2: [] };
    skills.forEach(function (sk) {
        const slot = (typeof getSkillSlotForType === 'function')
            ? getSkillSlotForType(sk.type)
            : 'skill_sub2';
        if (bySlot[slot]) bySlot[slot].push(sk);
        else bySlot.skill_sub2.push(sk);
    });

    const indicator = document.getElementById('skill-page-indicator');
    if (indicator) {
        indicator.textContent = '已学 ' + skills.length + ' 门';
    }

    let html = '';
    skillSlots.forEach(function (slot) {
        const equipped = currentSkills[slot.id];
        const skillName = equipped ? equipped.name : '空';
        const skillColor = equipped ? 'text-purple-400' : 'text-gray-600';
        const isOpen = !!window.skillSelectExpanded[slot.id];
        const list = bySlot[slot.id] || [];

        html += '<div class="bg-gray-800 rounded border border-gray-700 overflow-hidden">';
        html += '<div class="flex justify-between items-center p-2 gap-2">';
        html += '<div class="flex items-center gap-2 min-w-0">';
        html += '<span class="text-lg">' + slot.icon + '</span>';
        html += '<div class="min-w-0">';
        html += '<span class="text-xs text-gray-400">' + slot.name + '</span>';
        html += '<p class="text-sm ' + skillColor + ' font-bold truncate">' + skillName + '</p>';
        html += '</div></div>';
        html += '<div class="flex items-center gap-1 flex-shrink-0">';
        if (equipped) {
            html += '<button type="button" onclick="unequipSkillFromPanel(\'' + slot.id + '\')" class="text-xs text-gray-500 hover:text-red-400 px-1">卸下</button>';
        }
        html += '<button type="button" onclick="toggleSkillSelect(\'' + slot.id + '\')" class="text-xs px-2 py-1 rounded font-bold ' +
            (isOpen ? 'bg-purple-700 hover:bg-purple-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-200') + '">' +
            (isOpen ? '收起' : '选择') + '</button>';
        html += '</div></div>';

        if (isOpen) {
            html += '<div class="border-t border-gray-700 p-2 space-y-1 bg-gray-900/50">';
            if (!list.length) {
                html += '<p class="text-xs text-gray-500 text-center py-2">暂无已学' + slot.name +
                    '。使用对应秘籍后可在此选择。</p>';
            } else {
                list.forEach(function (sk) {
                    const active = equipped && equipped.id === sk.id;
                    const gradeColor = sk.grade === '仙品' ? 'text-yellow-400' :
                        sk.grade === '优品' ? 'text-purple-400' :
                        sk.grade === '良品' ? 'text-blue-400' : 'text-gray-400';
                    html += '<div class="flex items-center justify-between gap-2 p-2 rounded border ' +
                        (active ? 'border-purple-500 bg-purple-900/30' : 'border-gray-700 hover:border-gray-500') + '">';
                    html += '<div class="flex items-center gap-2 min-w-0">';
                    html += '<span>' + (sk.icon || '📜') + '</span>';
                    html += '<div class="min-w-0">';
                    html += '<p class="text-sm text-gray-200 font-bold truncate">' + sk.name + '</p>';
                    html += '<p class="text-xs ' + gradeColor + '">' + (sk.grade || '') + ' · ' + (sk.type || '') + '</p>';
                    html += '</div></div>';
                    if (active) {
                        html += '<button type="button" onclick="unequipSkillFromPanel(\'' + slot.id + '\')" ' +
                            'class="text-xs text-red-400 hover:text-red-300 px-2 py-1">卸下</button>';
                    } else {
                        html += '<button type="button" onclick="equipSkillToSlot(\'' + sk.id + '\',\'' + slot.id + '\')" ' +
                            'class="text-xs bg-green-700 hover:bg-green-600 text-white px-2 py-1 rounded">装备</button>';
                    }
                    html += '</div>';
                });
            }
            html += '</div>';
        }
        html += '</div>';
    });

    if (!skills.length) {
        html += '<p class="text-xs text-gray-500 text-center pt-1">尚未学会任何功法。使用秘籍、拜师或奇遇后方可修习。</p>';
    }
    skillContainer.innerHTML = html;
}

// 兼容旧名：运功选择/装备选择已并入槽位
function renderSkillBrowse() {
    renderSkillSlotsInline();
}
function renderEquipSelectPanel() {
    renderEquipmentSlotsInline();
}

function toggleSkillSelect(slotId) {
    if (!window.skillSelectExpanded) {
        window.skillSelectExpanded = { skill_main: false, skill_sub1: false, skill_sub2: false };
    }
    window.skillSelectExpanded[slotId] = !window.skillSelectExpanded[slotId];
    renderSkillSlotsInline();
}

function equipSkillToSlot(skillId, slotId) {
    if (typeof window.equipSkill !== 'function') return false;
    var ok = window.equipSkill(skillId, slotId);
    if (!ok) {
        if (typeof window.showMessage === 'function') window.showMessage('无法装备该功法：请检查学习状态、槽位类型与灵根要求。', 'warning');
        return false;
    }
    if (window.skillSelectExpanded) window.skillSelectExpanded[slotId] = false;
    renderEquipmentPanel();
    var sk = typeof window.findSkillById === 'function' ? window.findSkillById(skillId) : null;
    if (typeof window.showMessage === 'function') window.showMessage('已装备：' + (sk ? sk.name : skillId), 'success');
    return true;
}

function toggleEquipSelect(slotId) {
    if (!window.equipSelectExpanded) window.equipSelectExpanded = {};
    window.equipSelectExpanded[slotId] = !window.equipSelectExpanded[slotId];
    renderEquipmentSlotsInline();
}

/** 卸下装备：优先回背包 */
function unequipItemToBag(slotId) {
    if (typeof unequipItemToInventory === 'function') {
        const ok = unequipItemToInventory(slotId);
        if (ok) {
            if (typeof renderEquipmentPanel === 'function') renderEquipmentPanel();
            return;
        }
    }
    currentEquipment[slotId] = null;
    if (typeof updateEquippedStats === 'function') updateEquippedStats();
    renderEquipmentPanel();
}

// 显示属性提示框
function showTooltip(content) {
    const existing = document.getElementById('attr-tooltip');
    if (existing) existing.remove();

    const tooltip = document.createElement('div');
    tooltip.id = 'attr-tooltip';
    tooltip.className = 'fixed z-50 bg-gray-900 border border-blue-500 rounded-lg p-4 max-w-sm shadow-xl fade-in';
    tooltip.innerHTML = `
        <div class="flex justify-between items-start mb-2">
            <h4 class="text-lg font-bold text-blue-400">属性说明</h4>
            <button onclick="document.getElementById('attr-tooltip').remove()" class="text-gray-400 hover:text-white text-xl">&times;</button>
        </div>
        <p class="text-gray-300 text-sm">${content}</p>
    `;

    document.body.appendChild(tooltip);
    tooltip.style.left = '50%';
    tooltip.style.top = '50%';
    tooltip.style.transform = 'translate(-50%, -50%)';

    setTimeout(() => {
        document.addEventListener('click', function closeTooltip(e) {
            if (!tooltip.contains(e.target)) {
                tooltip.remove();
                document.removeEventListener('click', closeTooltip);
            }
        });
    }, 100);
}

function prevSkillPage() { /* v9.6 无分页 */ }
function nextSkillPage() { /* v9.6 无分页 */ }

function unequipSkillFromPanel(slotId) {
    if (typeof window.unequipSkill !== 'function') return false;
    var removed = window.unequipSkill(slotId);
    renderEquipmentPanel();
    return !!removed;
}

// ==================== 新增系统集成 ====================

// 初始化所有新系统
function initNewSystems() {
    // 初始化城市/建筑系统
    if (window.locationSystem) {
        window.locationSystem.initLocationSystem();
    }
    
    // 初始化旅行系统
    if (window.travelSystem) {
        window.travelSystem.initTravelSystem();
    }
    
    // 初始化任务系统
    if (window.questSystem && window.questSystem.initQuestSystem) {
        window.questSystem.initQuestSystem();
    }
    
    // 初始化奇遇事件系统
    if (window.eventSystem && window.eventSystem.initEventSystem) {
        window.eventSystem.initEventSystem();
    }
    
    // 初始化时间系统
    if (window.timeSystem && window.timeSystem.initTimeSystem) {
        window.timeSystem.initTimeSystem();
    }
    
    // 初始化队伍系统
    if (window.partySystem && window.partySystem.initPartySystem) {
        window.partySystem.initPartySystem();
    }
    
    // ===== v6.0-v6.4 新增系统初始化 =====
    // 城市声望系统
    if (typeof initReputationSystem === 'function') {
        initReputationSystem();
    }
    // 势力系统
    if (typeof initFactionSystem === 'function') {
        initFactionSystem();
    }
    // 副职业系统
    // B1: title screen do not load beasts/house from independent keys
    if (window.currentCharData) {
        if (typeof initBeastTaming === 'function') initBeastTaming();
        if (typeof initHouseSystem === 'function') initHouseSystem();
    } else {
        if (typeof importBeastState === 'function') {
            importBeastState({ beasts: [], activeBeastIndex: -1, activeMountIndex: -1 });
        }
        if (typeof importHouseState === 'function') importHouseState(null);
    }
    // 强化保底数据
    if (typeof loadPityData === 'function') {
        loadPityData();
    }
    // v7.1 寿命 / 世界事件 / 天气显示
    if (typeof initLifespan === 'function') {
        try { initLifespan(); } catch (e) {}
    }
    if (typeof loadWorldEvents === 'function') {
        try { loadWorldEvents(); } catch (e) {}
    }
    if (typeof loadCityTempModifiers === 'function') {
        try { loadCityTempModifiers(); } catch (e) {}
    }
    if (typeof updateWeatherDisplay === 'function') {
        try { updateWeatherDisplay(); } catch (e) {}
    }
    if (typeof updateLifespanDisplay === 'function') {
        try { updateLifespanDisplay(); } catch (e) {}
    }
    
    // 副职业不再自动解锁，由玩家通过游戏进程自行解锁
    
    // ===== v7.3 门派扩展：注册全门派NPC =====
    if (typeof registerAllSectNPCs === 'function') {
        try { registerAllSectNPCs(); }
        catch (e) { console.warn('registerAllSectNPCs failed', e); }
    }
    // ===== v7.3 门派扩展：注册门派专属装备与功法 =====
    if (typeof registerAllSectSpecificItems === 'function') {
        try {
            registerAllSectSpecificItems();
        } catch (e) {
            console.warn('registerAllSectSpecificItems failed', e);
        }
    }
}

// 显示城市旅行UI（全局可访问）
function showCityTravelUI() {
    if (window.travelSystem && window.travelSystem.showTravelMethodSelect) {
        const currentCity = window.locationSystem.getCurrentLocation();
        if (!currentCity) {
            showMessage('您还没有到达任何城市，请先选择一个城市开始旅程！', 'warning');
            return;
        }
        // 显示城市列表
        if (window.locationSystem && window.locationSystem.showCityTravelUI) {
            window.locationSystem.showCityTravelUI();
        }
    }
}

// 消息显示已统一至 global-utils.js，此处不再重复定义

// 更新状态面板（集成新系统数据）
function updateCharacterStatus() {
    if (!currentCharData) return;
    
    // 更新精力（从 charData 读取）
    const staminaBar = document.getElementById('stamina-bar');
    const staminaText = document.getElementById('stamina-text');
    if (staminaText) {
        const energy = currentCharData.energy ?? 100;
        const maxEnergy = currentCharData.maxEnergy ?? 100;
        staminaText.textContent = `${Math.round(energy)}/${maxEnergy}`;
        if (staminaBar) staminaBar.style.width = `${(energy / maxEnergy) * 100}%`;
    }

    // 更新血量条（出战斗权威值 currentCharData.health，与战斗内血量同源同名；元素不存在时静默跳过）
    const healthBar = document.getElementById('health-bar');
    const healthText = document.getElementById('health-text');
    if (healthText) {
        const health = currentCharData.health ?? 100;
        const maxHealth = currentCharData.maxHealth || 100;
        healthText.textContent = `${Math.round(health)}/${maxHealth}`;
        if (healthBar) healthBar.style.width = `${(Math.max(0, Math.min(health, maxHealth)) / maxHealth) * 100}%`;
    }
    
    // 更新真气（从 charData 读取）
    const qiBar = document.getElementById('qi-bar');
    const qiText = document.getElementById('qi-text');
    if (qiText) {
        const qi = currentCharData.qi ?? 100;
        const maxQi = currentCharData.maxQi ?? 100;
        qiText.textContent = `${Math.round(qi)}/${maxQi}`;
        if (qiBar) qiBar.style.width = `${(qi / maxQi) * 100}%`;
    }
    
    // 更新心情（从 charData 读取）
    const moodBar = document.getElementById('mood-bar');
    const moodText = document.getElementById('mood-text');
    if (moodText) {
        const mood = currentCharData.mood ?? 80;
        const maxMood = currentCharData.maxMood ?? 100;
        moodText.textContent = `${Math.round(mood)}/${maxMood}`;
        if (moodBar) moodBar.style.width = `${(mood / maxMood) * 100}%`;
    }
    
    // 更新境界显示
    const realmText = document.getElementById('realm-text');
    if (realmText) {
        const realmName = currentCharData.realm || '炼气';
        const layer = currentCharData.layer || 1;
        realmText.textContent = `${realmName} ${['', '一', '二', '三', '四', '五', '六', '七', '八', '九'][layer]}期`;
    }

    // v13.1 绝技行：境界卡下方展示已习得战斗绝技（名称取 COMBAT_ABILITIES 注册表，顿号连接）
    const abilDisplay = document.getElementById('char-abilities-display');
    if (abilDisplay) {
        const ownedAbs = Array.isArray(currentCharData.combatAbilities) ? currentCharData.combatAbilities : [];
        const absReg = window.COMBAT_ABILITIES || {};
        const abilNames = [];
        for (let ai = 0; ai < ownedAbs.length; ai++) {
            abilNames.push((absReg[ownedAbs[ai]] && absReg[ownedAbs[ai]].name) || ownedAbs[ai]);
        }
        abilDisplay.textContent = '绝技: ' + (abilNames.length ? abilNames.join('、') : '无');
    }
    
    // 更新业力/秩序（从 charData 读取）
    document.getElementById('karma-value').textContent = currentCharData.karma ?? 0;
    document.getElementById('karma-label').textContent = ['魔道', '邪道', '偏邪', '微邪', '中立', '微善', '善良', '正义', '圣贤'][Math.floor(((currentCharData.karma ?? 0) + 100) / 25)] || '中立';
    document.getElementById('karma-indicator').style.left = `${((currentCharData.karma ?? 0) + 100) / 2}%`;
    document.getElementById('order-value').textContent = currentCharData.order ?? 0;
    document.getElementById('order-label').textContent = ['混乱', '偏乱', '中庸', '守序', '秩序'][Math.floor(((currentCharData.order ?? 0) + 100) / 50)] || '中庸';
    document.getElementById('order-indicator').style.left = `${((currentCharData.order ?? 0) + 100) / 2}%`;
    
    // 名气值
    var fameEl = document.getElementById('fame-value');
    var fameLabel = document.getElementById('fame-label');
    var fameBar = document.getElementById('fame-bar');
    if (fameEl) {
        var fame = currentCharData.fame || 0;
        fameEl.textContent = fame;
        if (fameBar) fameBar.style.width = fame + '%';
        if (fameLabel) {
            var fameLevel = (typeof window.getFameLevel === 'function') ? window.getFameLevel(currentCharData) : null;
            fameLabel.textContent = fameLevel ? fameLevel.name : '无名之辈';
        }
    }
    
    // 更新所在地显示
    const locationDisplay = document.getElementById('current-location-display');
    if (locationDisplay && window.locationSystem) {
        const currentCity = window.locationSystem.getCurrentLocation();
        if (currentCity) {
            locationDisplay.textContent = currentCity;
        }
    }
    
    // 更新时间显示
    const timeDisplay = document.getElementById('time-display');
    const seasonDisplay = document.getElementById('season-display');
    if (timeDisplay && window.timeSystem && window.timeSystem.gameTime) {
        const gt = window.timeSystem.gameTime;
        const period = window.timeSystem.getCurrentPeriodName() || '';
        timeDisplay.textContent = `第${gt.currentDay}天 ${period}`;
        const seasonNames = { spring: '春季', summer: '夏季', autumn: '秋季', winter: '冬季' };
        if (seasonDisplay) {
            seasonDisplay.textContent = seasonNames[gt.currentSeason] || '';
        }
    }
    
    // 更新队伍人数显示
    const partyCount = document.getElementById('party-member-count');
    if (partyCount && window.partySystem) {
        const count = window.partySystem.partyData?.members?.length || 0;
        partyCount.textContent = `${count}/4`;
    }
    
    // v9.7 更新真元/历练显示（境界面板）
    if (currentCharData) {
        const essenceDisplay = document.getElementById('realm-essence-display');
        const temperingDisplay = document.getElementById('realm-tempering-display');
        const qiLimitDisplay = document.getElementById('realm-qi-limit');
        
        if (essenceDisplay && typeof window.getEssenceRequired === 'function') {
            const realmIndex = window.getRealmIndex(currentCharData.realm);
            const layer = currentCharData.layer || 1;
            const essenceRequired = window.getEssenceRequired(realmIndex, layer);
            const essence = currentCharData.essence || 0;
            essenceDisplay.textContent = `真元: ${essence}/${essenceRequired}`;
        }
        if (temperingDisplay && typeof window.getTemperingRequired === 'function') {
            const realmIndex = window.getRealmIndex(currentCharData.realm);
            const layer = currentCharData.layer || 1;
            const temperingRequired = window.getTemperingRequired(realmIndex, layer);
            const tempering = currentCharData.tempering || 0;
            temperingDisplay.textContent = `历练: ${tempering}/${temperingRequired}`;
        }
        if (qiLimitDisplay && typeof window.getQiMax === 'function') {
            const realmIndex = window.getRealmIndex(currentCharData.realm);
            const layer = currentCharData.layer || 1;
            const qiMax = window.getQiMax(realmIndex, layer);
            qiLimitDisplay.textContent = `境界提供${qiMax}真气上限`;
        }
    }
}

// 打开合成UI（全局可访问）
// crafting.js 已注册 openCraftingUI 到全局，此处不再重复定义


// 打开强化UI（委托给 enhancement.js 的完整实现，避免冲突）
// enhancement.js 已注册 openEnhancementUI 到全局，此处不再重复定义
// 不直接覆盖 window.openEnhancementUI，避免与 enhancement.js 冲突
// enhancement.js 已通过 window.openEnhancementHall 导出
if (typeof openForgingShop === 'function') window.openForgingShop = openForgingShop;
if (typeof performEnhancementAction === 'function') window.performEnhancementAction = performEnhancementAction;


// 打开修炼UI（全局可访问）
// cultivation.js 已注册 openCultivationUI 到全局，此处不再重复定义


// 商店购买统一由 enhanced-shop.js 的 buyFromShop 路由。
// 突破统一由 breakthrough-ritual.js 路由。

// 经验与升级系统已移除（v11.0 改为真元+历练体系）
// 等级 level 仅通过突破境界自动+1

// ==================== P2-3.3: NPC交互完善 ====================
function getAffectionLevelInfo(affection) {
    if (window.affectionSystem && typeof window.affectionSystem.getLevel === 'function') {
        const level = window.affectionSystem.getLevel(affection);
        return { name: level.name, color: level.color };
    }
    if (affection >= 80) return { name: '挚爱', color: '#ff0044' };
    if (affection >= 60) return { name: '知己', color: '#ff4488' };
    if (affection >= 40) return { name: '朋友', color: '#44aaff' };
    if (affection >= 20) return { name: '熟人', color: '#4488ff' };
    if (affection >= -20) return { name: '陌生人', color: '#888888' };
    if (affection >= -50) return { name: '厌恶', color: '#ff4444' };
    return { name: '仇人', color: '#ff0000' };
}

function talkToNPC(npcId) {
    if (!window.npcManager) {
        showMessage('NPC系统未初始化', 'error');
        return;
    }
    const npc = window.npcManager.getNPC(npcId);
    if (!npc) {
        showMessage('NPC不存在', 'error');
        return;
    }

    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(15, '与NPC对话');
    }

    const affectionChange = Math.floor(Math.random() * 5) - 1; // -1到3
    if (typeof npc.changeAffection === 'function') {
        npc.changeAffection(affectionChange);
    } else {
        npc.relationship = npc.relationship || { affection: 0 };
        npc.relationship.affection = Math.max(-100, Math.min(100, (npc.relationship.affection || 0) + affectionChange));
    }

    const aff = npc.relationship?.affection || 0;
    const levelInfo = getAffectionLevelInfo(aff);
    const dialogue = typeof npc.getDialogue === 'function'
        ? npc.getDialogue()
        : `你和${npc.name}聊了聊。`;
    showMessage(`${dialogue}（好感度${affectionChange >= 0 ? '+' : ''}${affectionChange}，当前${aff}·${levelInfo.name}）`, affectionChange >= 0 ? 'success' : 'warning');

    if (typeof window.showNPCDialog === 'function') {
        document.querySelectorAll('.fixed.inset-0').forEach(m => m.remove());
        window.showNPCDialog(npcId);
    }
}

function giveGiftToNPC(npcId) {
    if (!currentCharData) {
        showMessage('请先创建角色', 'warning');
        return;
    }
    if (!window.inventory || !window.inventory.slots) {
        showMessage('背包系统未初始化', 'error');
        return;
    }
    if (!window.npcManager) {
        showMessage('NPC系统未初始化', 'error');
        return;
    }
    const npc = window.npcManager.getNPC(npcId);
    if (!npc) {
        showMessage('NPC不存在', 'error');
        return;
    }

    const gifts = window.inventory.slots
        .map((s, idx) => ({ slot: s, idx }))
        .filter(x => x.slot && x.slot.count > 0 && x.slot.templateId);

    if (gifts.length === 0) {
        showMessage('背包中没有可赠送的物品', 'warning');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    const giftHtml = gifts.map(({ slot, idx }) => {
        const tpl = typeof slot.getTemplate === 'function' ? slot.getTemplate() : null;
        const name = tpl?.name || slot.name || slot.templateId;
        const icon = tpl?.icon || '🎁';
        let gain = 5;
        if (tpl?.type === 'consumable' || tpl?.subtype === 'pill') gain = 8;
        if (tpl?.type === 'secret_art') gain = 20;
        if (slot.templateId === 'spirit_stone' || name.includes('灵石')) gain = 3;
        return `
            <button onclick="confirmGiftToNPC('${npcId}', ${idx}, ${gain})" class="w-full bg-gray-700 hover:bg-gray-600 p-3 rounded mb-2 text-left flex items-center gap-3">
                <span class="text-2xl">${icon}</span>
                <div class="flex-1">
                    <p class="text-white font-bold">${name} x${slot.count}</p>
                    <p class="text-xs text-green-400">好感度 +${gain}</p>
                </div>
            </button>
        `;
    }).join('');

    modal.innerHTML = `
        <div class="bg-gray-800 border-2 border-green-500 rounded-xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-green-400">🎁 赠送给 ${npc.name}</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div>${giftHtml}</div>
        </div>
    `;
    document.body.appendChild(modal);
}

function confirmGiftToNPC(npcId, slotIndex, gain) {
    const npc = window.npcManager?.getNPC(npcId);
    // v14.11 审计5：同地点守卫（远程不可赠礼）
    if (npc && typeof window.npcNotCoLocated === 'function' && window.npcNotCoLocated(npc)) {
        showMessage('你与' + npc.name + '并不在一处——千里之外递不出这份礼。', 'warning');
        return;
    }
    const slot = window.inventory?.slots?.[slotIndex];
    if (!npc || !slot) {
        showMessage('赠送失败', 'error');
        return;
    }

    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(10, '赠送礼物');
    }

    const tpl = typeof slot.getTemplate === 'function' ? slot.getTemplate() : null;
    const name = tpl?.name || slot.name || slot.templateId;
    const quality = tpl?.quality || 'COMMON';
    const itemValue = tpl?.price || 0;

    // 计算物品品质等级
    const qualityMap = { 'COMMON': 0, 'UNCOMMON': 1, 'RARE': 2, 'EPIC': 3, 'LEGENDARY': 4, 'MYTHIC': 5 };
    const qualityLevel = qualityMap[quality] || 0;

    slot.count -= 1;
    if (slot.count <= 0) window.inventory.slots[slotIndex] = null;

    // P1-4: 礼物偏好影响
    let bonus = 0;
    let feedback = '';
    if (typeof checkNPCLikeItem === 'function') {
        const item = { id: slot.templateId || slot.id || name, name: name };
        const result = checkNPCLikeItem(npc, item);
        if (result.liked === true) {
            bonus = 2;
            feedback = result.feedback;
        } else if (result.liked === false) {
            bonus = -1;
            feedback = result.feedback;
        }
    }

    const totalGain = gain + bonus;
    // F-18：现实式赠礼疲倦——非次数上限，而是随游戏日衰减的自身状态
    // 连续送礼 → 疲倦累积 → 收益递减 → 过量反感；等几日 → 疲倦衰减 → 恢复
    var _gToday = (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') ? window.timeSystem.getAbsoluteDay() : 0;
    var _gMem = npc.memory = npc.memory || {};
    var _gElapsed = Math.max(0, _gToday - (_gMem.lastGiftDay || 0));
    _gMem.giftFatigue = Math.max(0, (_gMem.giftFatigue || 0) - _gElapsed); // 按经过游戏日衰减
    var _gFatigue = _gMem.giftFatigue || 0;
    var _gFatigueMul = Math.max(-0.3, 1 - 0.3 * _gFatigue); // 0→1.0 / 3→0.1 / 4→-0.2(反感)
    var _gTraitMul = (typeof npc.getGiftMultiplier === 'function') ? npc.getGiftMultiplier() : 1; // 特质修正(贪婪0.7/慷慨1.3/寡言0.8)
    var effectiveGain = Math.round(totalGain * _gFatigueMul * _gTraitMul);
    if (typeof npc.changeAffection === 'function') {
        npc.changeAffection(effectiveGain);
    } else {
        npc.relationship = npc.relationship || { affection: 0 };
        npc.relationship.affection = Math.max(-100, Math.min(100, (npc.relationship.affection || 0) + effectiveGain));
    }
    _gMem.giftFatigue = _gFatigue + 1;
    _gMem.lastGiftDay = _gToday;

    // ===== v11.8 物品与NPC联动：赠送物品实际生效 =====
    var itemExtraMsg = '';
    if (tpl) {
        // 武器/装备 → NPC装备
        if (tpl.type === 'weapon' || tpl.slot === 'mainHand' || tpl.type === 'armor' || tpl.slot === 'body') {
            if (typeof npc.equipItemToSlot === 'function') {
                npc.equipItemToSlot(slot.templateId);
                itemExtraMsg = '，NPC已装备';
            }
        }
        // 丹药 → NPC存入背包，受伤时自动使用
        else if (tpl.type === 'consumable' || tpl.subtype === 'pill') {
            if (typeof npc.addItemToInventory === 'function') {
                npc.addItemToInventory(slot.templateId, 1);
                itemExtraMsg = '，NPC已收下';
            }
        }
        // 食物 → NPC立即使用
        else if (tpl.subtype === 'food' || tpl.category === 'food') {
            if (npc.state) {
                npc.state.mood = Math.min(100, (npc.state.mood || 50) + 5);
                npc.state.energy = Math.min(100, (npc.state.energy || 100) + 10);
                itemExtraMsg = '，NPC很高兴地享用';
            }
        }
        // 其他物品 → NPC存入背包
        else {
            if (typeof npc.addItemToInventory === 'function') {
                npc.addItemToInventory(slot.templateId, 1);
                itemExtraMsg = '，NPC已收下';
            }
        }
    }

    // ===== v12.0 赠礼NPC回应文本（按价值/品质/偏好） =====
    var npcResponse = '';
    var npcName = npc.name;
    var aff = npc.relationship?.affection || 0;
    var isDaoCompanion = npc.relationship?.flags?.has('dao_companion') || false;

    if (feedback) {
        // 已有checkNPCLikeItem的反馈文本，直接使用
        npcResponse = feedback;
    } else if (totalGain <= 0) {
        // 不喜欢
        var dislikeResponses = [
            npcName + '微微皱眉：「……这个就不必了。」',
            npcName + '淡淡看了一眼：「收下了。」（似乎并不在意）',
            npcName + '犹豫了一下：「你留着自己用吧。」'
        ];
        npcResponse = dislikeResponses[Math.floor(Math.random() * dislikeResponses.length)];
    } else if (qualityLevel >= 3 || itemValue >= 500) {
        // 高品质/高价值物品
        if (isDaoCompanion) {
            var highDaoResponses = [
                npcName + '微微一怔，眼底泛起笑意：「……你居然舍得把这个给我？」',
                npcName + '接过礼物，指尖在你手心轻轻一划：「我收下了。」',
                npcName + '低头看着礼物，声音轻了几分：「……下次别这么破费了。」（但看起来很欢喜）'
            ];
            npcResponse = highDaoResponses[Math.floor(Math.random() * highDaoResponses.length)];
        } else {
            var highResponses = [
                npcName + '眼睛一亮：「这……这太贵重了！真的给我？」',
                npcName + '郑重接过：「这份心意我记下了。」',
                npcName + '惊喜道：「你从哪弄来的？我一直想要这个！」'
            ];
            npcResponse = highResponses[Math.floor(Math.random() * highResponses.length)];
        }
    } else if (qualityLevel >= 1 || itemValue >= 50) {
        // 中等价值物品
        if (isDaoCompanion) {
            var midDaoResponses = [
                npcName + '接过礼物，弯了弯嘴角：「你有心了。」',
                npcName + '把玩着礼物：「……我很喜欢。」',
                npcName + '看你一眼：「下次直接给我就好，不用挑这些。」（口是心非）'
            ];
            npcResponse = midDaoResponses[Math.floor(Math.random() * midDaoResponses.length)];
        } else {
            var midResponses = [
                npcName + '笑着收下：「有心了，多谢。」',
                npcName + '点点头：「正好需要这个，谢了。」',
                npcName + '接过看了看：「不错，我收下了。」'
            ];
            npcResponse = midResponses[Math.floor(Math.random() * midResponses.length)];
        }
    } else {
        // 普通物品
        if (isDaoCompanion) {
            var lowDaoResponses = [
                npcName + '收下礼物，唇角微扬：「你给的，我都喜欢。」',
                npcName + '把东西收进怀里：「下次别这么麻烦。」（但看得出很开心）',
                npcName + '轻轻「嗯」了一声：「……我收下了。」'
            ];
            npcResponse = lowDaoResponses[Math.floor(Math.random() * lowDaoResponses.length)];
        } else {
            var lowResponses = [
                npcName + '收下：「谢谢。」',
                npcName + '点头致意：「有心了。」',
                npcName + '接过：「那我就不客气了。」'
            ];
            npcResponse = lowResponses[Math.floor(Math.random() * lowResponses.length)];
        }
    }

    // ===== 高价值赠礼可能获得回礼 =====
    var rewardMsg = '';
    if (qualityLevel >= 3 && Math.random() < 0.3) {
        // 30%概率获得回礼
        var possibleRewards = ['pill_small_recovery', 'mat_lingzhi', 'spec_spirit_stone'];
        var reward = possibleRewards[Math.floor(Math.random() * possibleRewards.length)];
        var rewardName = window.itemById?.[reward]?.name || '小礼物';
        if (typeof window.addItemToInventory === 'function') {
            window.addItemToInventory(reward, 1);
            rewardMsg = '，' + npcName + '回赠了' + rewardName;
        } else if (typeof window.addItem === 'function') {
            window.addItem(reward, 1);
            rewardMsg = '，' + npcName + '回赠了' + rewardName;
        }
    }

    if (window.updateInventoryUI) window.updateInventoryUI();

    const levelInfo = getAffectionLevelInfo(aff);
    // F-18：显示实际生效好感（含疲倦/特质），疲倦高时加提示
    var _fNote = '';
    if (_gFatigue >= 4) _fNote = '（对方已生厌烦，适可而止）';
    else if (_gFatigue >= 3) _fNote = '（对方略显厌烦）';
    else if (_gFatigue >= 1) _fNote = '（频繁送礼，收益递减）';
    const msg = npcResponse + '（好感度' + (effectiveGain >= 0 ? '+' : '') + effectiveGain + '，当前' + aff + '·' + levelInfo.name + '）' + _fNote + itemExtraMsg + rewardMsg;
    showMessage(msg, effectiveGain < 0 ? 'warning' : 'success');

    if (typeof npc.recordPlayerAction === 'function') {
        npc.recordPlayerAction('gift', bonus > 0 ? 'positive' : 'neutral');
    }

    document.querySelectorAll('.fixed.inset-0').forEach(m => m.remove());
    if (typeof window.showNPCDialog === 'function') {
        window.showNPCDialog(npcId);
    }
}

// ==================== 战败复活系统 ====================
function handleDefeatRevival() {
    var cd = window.currentCharData;
    if (!cd) return;

    // 所有躯体耐久恢复30%，移除所有负面状态（伤口/流血等）
    if (currentBattle && currentBattle.player && currentBattle.player.physiology) {
        var playerEntity = currentBattle.player;
        // 恢复部位耐久30%
        if (playerEntity.durabilities) {
            for (var pid in playerEntity.durabilities) {
                if (playerEntity.durabilities.hasOwnProperty(pid)) {
                    var max = playerEntity.maxDurabilities?.[pid] || 100;
                    playerEntity.durabilities[pid] = Math.min(max, playerEntity.durabilities[pid] + Math.floor(max * 0.3));
                }
            }
        }
        // 清除所有伤口
        if (playerEntity.physiology.wounds) {
            playerEntity.physiology.wounds = [];
        }
        // 重置生理状态
        if (playerEntity.physiology) {
            playerEntity.physiology.bloodVolume = playerEntity.physiology.maxBloodVolume || 100;
            playerEntity.physiology.circulation = 100;
            playerEntity.physiology.oxygenDebt = 0;
            playerEntity.physiology.criticalTimer = -1;
            playerEntity.physiology.consciousness = 100;
            playerEntity.physiology.health = playerEntity.physiology.maxHealth || 100;
        }
        // 同步到存档数据
        if (window._playerPhysiology) {
            window._playerPhysiology = playerEntity;
        }
    }

    // 单一权威链路：战败复活后满血，health 为场外唯一权威（updateCharacterStatus 下方已统一刷新）
    cd.health = 100;

    // 获取队伍数据
    var pd = window.partySystem ? window.partySystem.partyData : (window.partyData || null);
    var members = (pd && pd.members) ? pd.members : [];
    var aliveMembers = members.filter(function(m) { return typeof m.isAlive === 'function' ? m.isAlive() : (m.health > 0); });

    if (aliveMembers.length > 0) {
        // 有队员：选关系最亲的或随机
        var bestMember = aliveMembers[0];
        var bestAff = -999;
        aliveMembers.forEach(function(m) {
            var aff = (m.relationship && m.relationship.affection) || 0;
            if (aff > bestAff) {
                bestAff = aff;
                bestMember = m;
            }
        });
        // 如果好感度都一样，就随机
        if (aliveMembers.every(function(m) { return (m.relationship && m.relationship.affection) === bestAff || 0; })) {
            bestMember = aliveMembers[Math.floor(Math.random() * aliveMembers.length)];
        }

        var memberName = bestMember.name || '队友';
        var memberLocation = bestMember.location || '一处洞府';
        // 恢复少量精力真气
        cd.energy = Math.max(1, Math.floor((cd.maxEnergy || 100) * 0.3));
        cd.qi = Math.max(1, Math.floor((cd.maxQi || 100) * 0.3));
        if (typeof window.showMessage === 'function') {
            window.showMessage('⏰ 你昏迷了半日……', 'info');
            window.showMessage('💕 ' + memberName + ' 把你带回了' + memberLocation + '，队友们都围过来看你。', 'info');
        }
    } else {
        // 无队员：敌人处置
        handleEnemyDisposal(currentBattle);
        cd.energy = Math.max(1, Math.floor((cd.maxEnergy || 100) * 0.2));
        cd.qi = Math.max(1, Math.floor((cd.maxQi || 100) * 0.2));
    }

    // 刷新UI
    if (typeof window.updateCharacterStatus === 'function') {
        try { window.updateCharacterStatus(); } catch (e) {}
    }
    if (typeof window.updateInventoryUI === 'function') {
        try { window.updateInventoryUI(); } catch (e) {}
    }
}

// ==================== 敌人处置系统（无队友战败）====================
function handleEnemyDisposal(battle) {
    if (!battle || !battle.enemy) {
        if (typeof window.showMessage === 'function') {
            window.showMessage('⏰ 你昏迷了半日……醒来时发现自己被丢在野外。', 'warning');
        }
        return;
    }
    var enemy = battle.enemy;
    var physType = enemy.physiology ? enemy.physiology.type : (enemy.physiologyType || 'humanoid');
    var faction = enemy.faction || '';
    var enemyName = enemy.name || '敌人';
    var cd = window.currentCharData;
    var msg = '';

    // 1. 邪道人类 → 吸取修为（额外惩罚）
    if (physType === 'humanoid' && faction === '邪道') {
        if (cd) {
            var expLoss = 20 + Math.floor(Math.random() * 31); // 20-50
            cd.tempering = Math.max(0, (cd.tempering || 0) - expLoss);
            var expMsg = '邪修吸走了你部分修为';
        }
        // 搜走灵石
        var stonesLost = 0;
        if (cd && cd.spiritStones && cd.spiritStones > 0) {
            stonesLost = Math.floor(cd.spiritStones * (0.3 + Math.random() * 0.5));
            cd.spiritStones -= stonesLost;
        }
        msg = '邪修吸走了你的修为，还搜走了你身上' + stonesLost + '灵石。';
        if (typeof window.showMessage === 'function') {
            window.showMessage('⏰ 你昏迷了半日……', 'info');
            window.showMessage('😈 ' + msg, 'error');
        }
        return;
    }

    // 2. 按生理类型处置
    switch (physType) {
        case 'humanoid': {
            // 人类敌人：搜走灵石
            var stonesLost = 0;
            if (cd && cd.spiritStones && cd.spiritStones > 0) {
                stonesLost = Math.floor(cd.spiritStones * (0.5 + Math.random() * 0.3));
                cd.spiritStones -= stonesLost;
            }
            if (stonesLost > 0) {
                msg = '你身上的' + stonesLost + '灵石被洗劫一空。';
            } else {
                msg = '你被丢在路边，身上没什么好抢的。';
            }
            break;
        }
        case 'beast': {
            msg = '野兽在你身边嗅了嗅，似乎觉得不好吃，走了。';
            break;
        }
        case 'undead': {
            msg = '亡灵没有理会昏迷的你，漫无目的地游荡开了。';
            break;
        }
        case 'construct': {
            msg = '那具机关傀儡已经停止运作，你身边只有一片寂静。';
            break;
        }
        case 'elemental': {
            msg = '元素生物失去目标后渐渐消散在空气中。';
            break;
        }
        default: {
            msg = '你昏迷了半日……醒来时发现自己被丢在野外。';
            break;
        }
    }

    if (typeof window.showMessage === 'function') {
        window.showMessage('⏰ 你昏迷了半日……', 'info');
        window.showMessage(msg, 'info');
    }
}

// ==================== P2-3.4: 灵石经济闭环 ====================
function claimDailyIncome(silentIfClaimed = false) {
    if (!currentCharData) {
        if (!silentIfClaimed) showMessage('请先创建角色', 'warning');
        return;
    }

    // 用游戏天数判断，而不是真实时间
    const dayKey = window.timeSystem?.gameTime?.currentDay || 1;
    if (currentCharData.lastDailyClaimDay === dayKey) {
        if (!silentIfClaimed) showMessage('今日收入已领取', 'warning');
        return;
    }

    let goldIncome = 50;
    let spiritStoneIncome = 10;

    if (window.discipleState && window.discipleState.sectName) {
        spiritStoneIncome += 20;
    }

    const realm = currentCharData.realm || '炼气';
    const realmIndex = ['炼气', '筑基', '金丹', '元婴', '化神'].indexOf(realm);
    if (realmIndex >= 0) {
        spiritStoneIncome += realmIndex * 5;
    }

    // 货币写入背包系统
    if (window.inventory && window.inventory.currency) {
        window.inventory.currency.copper = (window.inventory.currency.copper || 0) + goldIncome;
        window.inventory.currency.spiritStones = (window.inventory.currency.spiritStones || 0) + spiritStoneIncome;
    } else {
        currentCharData.copper = (currentCharData.copper || 0) + goldIncome;
        currentCharData.spiritStones = (currentCharData.spiritStones || 0) + spiritStoneIncome;
    }
    currentCharData.lastDailyClaimDay = dayKey;

    showMessage(`每日收入：${goldIncome}铜钱 + ${spiritStoneIncome}灵石（基础+门派+境界）`, 'success');
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    if (window.updateCurrencyUI) window.updateCurrencyUI();
}

function sellGatheredItems() {
    if (!window.inventory || !window.inventory.slots) {
        showMessage('背包系统未初始化', 'error');
        return;
    }
    
    // B5：mat_* 与旧 ID 均可出售；收益走 DataManager
    const priceMap = {
        'lingzhi': 10, 'mat_lingzhi': 10,
        'spirit_grass': 15, 'mat_spirit_grass': 15,
        'ginseng': 30, 'mat_ginseng': 30,
        'iron_ore': 5, 'mat_iron_ore': 5, 'mat_copper_ore': 6,
        'five_element_essence': 50, 'mat_five_element_essence': 50,
        'dragon_bone': 100, 'mat_dragon_bone': 100,
        'mat_wood': 3, 'mat_bamboo': 5, 'mat_beast_skin': 5, 'mat_beast_bone': 3
    };
    let totalGold = 0;
    let sold = false;
    for (var si = 0; si < window.inventory.slots.length; si++) {
        var slot = window.inventory.slots[si];
        if (!slot || !slot.templateId) continue;
        var tid = slot.templateId;
        if (priceMap[tid] == null && !(tid.indexOf('mat_') === 0)) continue;
        var unit = priceMap[tid];
        if (unit == null) {
            var tpl = window.itemById && window.itemById[tid];
            unit = tpl && tpl.price != null ? Math.floor(tpl.price * 0.5) : 5;
        }
        var cnt = slot.count || 1;
        totalGold += unit * cnt;
        window.inventory.slots[si] = null;
        sold = true;
    }
    if (sold) {
        if (window.XianXia && window.XianXia.DataManager && window.XianXia.DataManager.setGold) {
            window.XianXia.DataManager.setCopper(window.XianXia.DataManager.getCopper() + totalGold);
        } else {
            if (window.inventory.currency) window.inventory.currency.copper = (window.inventory.currency.copper || 0) + totalGold;
            if (currentCharData) currentCharData.copper = (currentCharData.copper || 0) + totalGold;
        }
        showMessage('出售采集物品获得' + totalGold + '铜钱', 'success');
        if (window.updateInventoryUI) window.updateInventoryUI();
        if (window.updateCurrencyUI) window.updateCurrencyUI();
        if (window.updateCharacterStatus) window.updateCharacterStatus();
    } else {
        showMessage('没有可出售的采集物品', 'warning');
    }
}

// ==================== P2-3.5: 野外内容完善（v6.0 增强版 - 区域特性+木材采集） ====================

// 获取当前所在区域（用于决定采集产出）
function getCurrentRegionForGathering() {
    // 尝试从多个来源获取当前区域
    if (window.currentRegionForMap) return window.currentRegionForMap;
    if (window.currentLocation) {
        for (const [region, data] of Object.entries(window.mapData || {})) {
            if (data.cities && data.cities.includes(window.currentLocation)) {
                return region;
            }
        }
    }
    return null;
}

// 增强版采矿（支持区域特性影响）
function mineOre() {
    if (!currentCharData) {
        showMessage('请先创建角色', 'warning');
        return;
    }
    const energy = currentCharData.energy !== undefined ? currentCharData.energy : 100;
    if (energy < 15) {
        showMessage(`精力不足（当前：${energy}）`, 'error');
        return;
    }

    currentCharData.energy = energy - 15;
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(30, '采矿');
    }

    const miningSkill = currentCharData.lifeSkills?.['采伐'] || currentCharData.lifeSkills?.['锻造'] || 10;
    const bonusChance = Math.min(0.3, miningSkill * 0.005);
    
    // 获取区域加成
    const region = getCurrentRegionForGathering();
    let regionBonus = 1.0;
    if (region && window.getRegionBonus) {
        const bonus = window.getRegionBonus(region);
        if (bonus && bonus.mining) regionBonus = bonus.mining;
    }
    if (typeof window.getWeatherGatheringBonus === 'function') {
        try { regionBonus *= (window.getWeatherGatheringBonus() || 1); } catch (e) {}
    }
    
    // 基础矿石（所有地区都有）
    const results = [
        { item: 'mat_iron_ore', name: '铁矿', min: 1, max: 3 + Math.floor(miningSkill / 20), chance: 0.8 * regionBonus },
        { item: 'mat_copper_ore', name: '铜矿', min: 1, max: 2 + Math.floor(miningSkill / 30), chance: 0.5 * regionBonus },
        { item: 'mat_tin_ore', name: '锡矿', min: 1, max: 2 + Math.floor(miningSkill / 30), chance: 0.5 * regionBonus },
        { item: 'mat_refined_iron', name: '精铁', min: 1, max: 1, chance: 0.3 + bonusChance },
        { item: 'mat_dark_iron', name: '玄铁', min: 1, max: 1, chance: 0.15 + bonusChance },
        { item: 'mat_five_element_essence', name: '五行精华', min: 1, max: 1, chance: 0.15 + bonusChance },
        { item: 'mat_dragon_bone', name: '龙骨', min: 1, max: 1, chance: 0.05 + bonusChance / 2 }
    ];
    
    // 区域特有矿石
    const regionOres = {
        '北冥': [{ item: 'mat_cold_iron', name: '寒铁', min: 1, max: 2, chance: 0.3 }, { item: 'mat_ice_crystal', name: '冰晶', min: 1, max: 1, chance: 0.2 }],
        '西漠': [{ item: 'mat_gold_sand', name: '金沙', min: 1, max: 3, chance: 0.4 }, { item: 'mat_meteorite', name: '陨铁', min: 1, max: 1, chance: 0.15 }],
        '南疆': [{ item: 'mat_volcanic_rock', name: '火山岩', min: 1, max: 2, chance: 0.35 }, { item: 'mat_fire_crystal', name: '火晶', min: 1, max: 1, chance: 0.2 }],
        '蜀地': [{ item: 'mat_dark_iron', name: '玄铁', min: 1, max: 2, chance: 0.3 }, { item: 'mat_meteorite', name: '陨铁', min: 1, max: 1, chance: 0.1 }],
        '东南海域': [{ item: 'mat_coral', name: '珊瑚', min: 1, max: 2, chance: 0.3 }, { item: 'mat_pearl', name: '珍珠', min: 1, max: 1, chance: 0.15 }]
    };
    
    if (region && regionOres[region]) {
        results.push(...regionOres[region]);
    }

    let gained = [];
    results.forEach(r => {
        if (Math.random() < r.chance) {
            const count = r.min + Math.floor(Math.random() * (r.max - r.min + 1));
            const template = window.itemById?.[r.item];
            const displayName = template?.name || r.name || r.item;
            gained.push(`${displayName} x${count}`);
            if (typeof window.addItem === 'function') {
                window.addItem(r.item, count);
            } else if (window.inventory && window.inventory.slots) {
                let added = false;
                for (const slot of window.inventory.slots) {
                    if (slot && slot.templateId === r.item) {
                        slot.count += count;
                        added = true;
                        break;
                    }
                }
                if (!added) {
                    for (let i = 0; i < window.inventory.slots.length; i++) {
                        if (!window.inventory.slots[i]) {
                            window.inventory.slots[i] = { templateId: r.item, name: r.name, count: count };
                            break;
                        }
                    }
                }
            }
        }
    });

    showMessage(`采矿完成：${gained.length > 0 ? gained.join(', ') : '一无所获'}`, gained.length > 0 ? 'success' : 'info');
    if (window.updateInventoryUI) window.updateInventoryUI();
    if (window.updateCharacterStatus) window.updateCharacterStatus();
}

// 增强版采药（支持区域特性影响）
function gatherHerbs() {
    if (!currentCharData) {
        showMessage('请先创建角色', 'warning');
        return;
    }
    if ((currentCharData.energy || 0) < 10) {
        showMessage('精力不足！', 'error');
        return;
    }
    
    currentCharData.energy -= 10;
    
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
    if (typeof window.getWeatherGatheringBonus === 'function') {
        try { window._gatherWeatherBonus = window.getWeatherGatheringBonus() || 1; } catch (e) { window._gatherWeatherBonus = 1; }
    }
        window.timeSystem.advanceTime(15, '采集灵药');
    }
    
    // 获取区域加成
    const region = getCurrentRegionForGathering();
    let regionBonus = 1.0;
    if (region && window.getRegionBonus) {
        const bonus = window.getRegionBonus(region);
        if (bonus && bonus.herb) regionBonus = bonus.herb;
    }
    
    // 基础草药（所有地区都有）
    const results = [
        { item: 'mat_liquorice', name: '甘草', min: 1, max: 3, chance: 0.7 * regionBonus },
        { item: 'mat_scutellaria', name: '黄芩', min: 1, max: 2, chance: 0.6 * regionBonus },
        { item: 'mat_lingzhi', name: '灵芝', min: 1, max: 3, chance: 0.5 * regionBonus },
        { item: 'mat_spirit_grass', name: '灵草', min: 1, max: 2, chance: 0.4 * regionBonus },
        { item: 'mat_ginseng', name: '人参', min: 1, max: 1, chance: 0.2 },
        { item: 'mat_snow_lotus', name: '雪莲', min: 1, max: 1, chance: 0.15 },
        { item: 'mat_he_shou_wu', name: '何首乌', min: 1, max: 1, chance: 0.15 }
    ];
    
    // 区域特有草药
    const regionHerbs = {
        '东荒': [{ item: 'mat_thousand_lingzhi', name: '千年灵芝', min: 1, max: 1, chance: 0.1 }, { item: 'mat_green_wood_essence', name: '青木精华', min: 1, max: 1, chance: 0.08 }],
        '南疆': [{ item: 'mat_dragon_grass', name: '龙涎草', min: 1, max: 1, chance: 0.1 }, { item: 'mat_phoenix_blood_grass', name: '凤血草', min: 1, max: 1, chance: 0.05 }],
        '北冥': [{ item: 'mat_snow_lotus', name: '雪莲', min: 1, max: 2, chance: 0.25 }, { item: 'mat_ice_herb', name: '冰霜草', min: 1, max: 2, chance: 0.2 }],
        '西漠': [{ item: 'mat_cactus_flower', name: '仙人花', min: 1, max: 2, chance: 0.2 }, { item: 'mat_desert_ginseng', name: '沙漠参', min: 1, max: 1, chance: 0.1 }],
        '蜀地': [{ item: 'mat_bamboo_essence', name: '竹精华', min: 1, max: 2, chance: 0.2 }, { item: 'mat_lingzhi', name: '灵芝', min: 1, max: 3, chance: 0.6 }]
    };
    
    if (region && regionHerbs[region]) {
        results.push(...regionHerbs[region]);
    }
    
    let gained = [];
    results.forEach(r => {
        if (Math.random() < r.chance) {
            const count = r.min + Math.floor(Math.random() * (r.max - r.min + 1));
            const template = window.itemById?.[r.item];
            const displayName = template?.name || r.name || r.item;
            gained.push(`${displayName} x${count}`);
            if (window.inventory && window.inventory.slots) {
                let added = false;
                for (const slot of window.inventory.slots) {
                    if (slot && slot.templateId === r.item) {
                        slot.count += count;
                        added = true;
                        break;
                    }
                }
                if (!added) {
                    for (let i = 0; i < window.inventory.slots.length; i++) {
                        if (!window.inventory.slots[i]) {
                            window.inventory.slots[i] = { templateId: r.item, name: r.item, count: count };
                            break;
                        }
                    }
                }
            }
        }
    });
    
    showMessage(`采集完成：${gained.length > 0 ? gained.join(', ') : '一无所获'}`, gained.length > 0 ? 'success' : 'info');
    if (window.updateInventoryUI) window.updateInventoryUI();
    if (window.updateCharacterStatus) window.updateCharacterStatus();
}

// ============ 新增：木材采集 ============
function chopWood() {
    if (!currentCharData) {
        showMessage('请先创建角色', 'warning');
        return;
    }
    const energy = currentCharData.energy !== undefined ? currentCharData.energy : 100;
    if (energy < 10) {
        showMessage(`精力不足（当前：${energy}）`, 'error');
        return;
    }

    currentCharData.energy = energy - 10;
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(20, '伐木');
    }

    const woodTypes = [
        { item: 'mat_wood', name: '木材', min: 1, max: 3, chance: 0.8 },
        { item: 'mat_spirit_wood', name: '灵木', min: 1, max: 2, chance: 0.3 },
        { item: 'mat_bamboo', name: '灵竹', min: 1, max: 2, chance: 0.2 },
        { item: 'mat_bamboo_essence', name: '竹精华', min: 1, max: 1, chance: 0.1 }
    ];

    // 检查是否有木系材料
    let gained = [];
    woodTypes.forEach(r => {
        if (Math.random() < r.chance) {
            const count = r.min + Math.floor(Math.random() * (r.max - r.min + 1));
            gained.push(`${r.name} x${count}`);
            if (typeof window.addItem === 'function') {
                window.addItem(r.item, count);
            }
        }
    });

    showMessage(`伐木完成：${gained.length > 0 ? gained.join(', ') : '一无所获'}`, gained.length > 0 ? 'success' : 'info');
    if (window.updateInventoryUI) window.updateInventoryUI();
    if (window.updateCharacterStatus) window.updateCharacterStatus();
}

// ==================== 新面板渲染函数 ====================

// 渲染势力列表
function renderFactionList() {
    var container = document.getElementById('faction-list');
    if (!container) return;
    if (typeof FACTIONS === 'undefined') { container.innerHTML = '<p class="text-gray-500">势力系统未加载</p>'; return; }
    
    var factions = FACTIONS;
    var html = '';
    for (var id in factions) {
        var f = factions[id];
        var rep = window.factionState?.reputation?.[id] || 0;
        var level = window.getFactionReputationLevel ? window.getFactionReputationLevel(id) : { name: '中立', color: 'text-gray-400' };
        html += '<div class="bg-gray-700/30 p-4 rounded-lg border border-gray-600">' +
            '<div class="flex items-center justify-between mb-2">' +
            '<span class="text-2xl mr-2">' + f.icon + '</span>' +
            '<span class="font-bold text-white">' + f.name + '</span>' +
            '<span class="text-xs ' + level.color + '">' + level.name + '</span>' +
            '</div>' +
            '<p class="text-xs text-gray-400 mb-2">' + f.desc + '</p>' +
            '<div class="w-full h-2 bg-gray-600 rounded overflow-hidden">' +
            '<div class="h-full rounded transition-all" style="width:' + ((rep + 10000) / 20000 * 100) + '%;background:' + (rep >= 0 ? '#22c55e' : '#ef4444') + '"></div>' +
            '</div>' +
            '<p class="text-xs text-gray-500 mt-1">声望: ' + rep + '</p>' +
            '</div>';
    }
    container.innerHTML = html;
}

// 渲染灵兽列表（v7.1 出战/骑乘/进化）
function renderBeastList() {
    var container = document.getElementById('beast-list');
    if (!container) return;
    if (typeof window.tamedBeasts === 'undefined' || !window.tamedBeasts || window.tamedBeasts.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center col-span-full">尚未拥有灵兽</p>' +
            '<p class="text-xs text-gray-500 text-center col-span-full mt-2">提示：野外遭遇并战斗削弱后收服；本页仅管理已驯灵兽。</p>';
        // v20.0：没灵兽也显示灵兽园（可先修园空着）
        if (typeof window.renderBeastGardenPanel === 'function') {
            var emptyGarden = document.getElementById('beast-garden-panel');
            if (emptyGarden) emptyGarden.innerHTML = window.renderBeastGardenPanel();
        }
        return;
    }
    var activeB = (typeof window.getActiveBeast === 'function' && window.getActiveBeast()) ? window.activeBeastIndex : -1;
    // sync index from module
    try { activeB = window.activeBeastIndex; } catch(e) {}
    var html = '';
    for (var i = 0; i < window.tamedBeasts.length; i++) {
        var b = window.tamedBeasts[i];
        var template = window.BEAST_TEMPLATES?.[b.templateId] || {};
        var level = b.level || 1;
        var isFight = (typeof window.getActiveBeast === 'function' && window.getActiveBeast() && window.getActiveBeast().name === b.name && i === (window.activeBeastIndex ?? -1));
        // fallback compare by index via closure in buttons
        var tags = '';
        if (b.mount) tags += ' 可骑乘×' + (b.mount.speed || 1);
        // v20.0：入园/洞府灵兽栏 → 日结长经验标记
        var housedNote = '';
        // 剩余任务#4：灵兽经验满了 → 提醒可进化
        var evolveNote = '';
        try {
            var bid = b.uid || (b.templateId + '_' + i);
            var sectId = (typeof window.playerGardenSectId === 'function') ? window.playerGardenSectId() : '散修园';
            var gardens = (window.BeastGarden && window.BeastGarden.listGardens) ? window.BeastGarden.listGardens(sectId) : [];
            var inGarden = gardens.some(function (g) { return (g.beasts || []).indexOf(bid) >= 0; });
            var hasPen = window.CaveFacilities && typeof window.CaveFacilities.getBuff === 'function' && (window.CaveFacilities.getBuff('player', 'beastTraining') || 0) > 0;
            if (inGarden || hasPen) housedNote = ' <span class="text-xs text-emerald-400">日结长经验</span>';
            // 经验满（>= 本级所需）→ 提示可进化（若进化线条件满足）
            var expNeed = (b.level || 1) * 50;
            if ((b.exp || 0) >= expNeed) {
                var evCan = (window.BeastEvolution && typeof window.BeastEvolution.canEvolve === 'function') ? window.BeastEvolution.canEvolve(bid) : null;
                if (evCan && evCan.ok) {
                    evolveNote = ' <span class="text-xs text-yellow-300 font-bold animate-pulse">✨可进化</span>';
                } else if (evCan && !evCan.ok && evCan.missing && evCan.missing.length) {
                    evolveNote = ' <span class="text-xs text-amber-500/80">经验已满，还差 ' + evCan.missing.join('、') + '</span>';
                } else if (template.evolve) {
                    evolveNote = ' <span class="text-xs text-yellow-300 font-bold animate-pulse">✨可进化</span>';
                }
            }
        } catch (eHouse) {}
        var aff = b.affection || 50;
        var affTier = aff >= 80 ? '心意相通' : (aff < 40 ? '貌合神离' : '平淡');
        var traitName = '';
        try { var trDef = (window.BEAST_TRAITS || []).find(function (t) { return t.id === b.trait; }); if (trDef) traitName = trDef.name; } catch (eT) {}
        var abNames = (b.combatAbilities || []).map(function (id) { return (window.COMBAT_ABILITIES && window.COMBAT_ABILITIES[id]) ? window.COMBAT_ABILITIES[id].name : id; }).join('、');
        var tags2 = ' | 羁绊:' + affTier + (traitName ? ' | 天赋:' + traitName : '') + (abNames ? ' | 绝技:' + abNames : '');
        html += '<div class="bg-gray-700/30 p-4 rounded-lg border border-gray-600">' +
            '<div class="flex items-center mb-2"><span class="text-2xl mr-2">🐾</span>' +
            '<span class="font-bold text-white">' + b.name + '</span><span class="text-xs text-green-400 ml-2">Lv.' + level + '</span>' + housedNote + evolveNote + '</div>' +
            '<p class="text-xs text-gray-400">Lv.' + level + ' 经验 ' + (b.exp || 0) + '/' + ((b.level || 1) * 50) + ' · 亲密度: ' + aff + '（' + affTier + '） | 技能: ' + (b.skills?.join(', ') || '无') + tags + tags2 + '</p>' +
            '<div class="flex flex-wrap gap-2 mt-2">' +
            '<button onclick="trainBeast(' + i + ')" class="text-xs bg-purple-600 hover:bg-purple-500 text-white px-2 py-1 rounded">培养</button>' +
            '<button onclick="feedBeast(' + i + ')" class="text-xs bg-green-700 hover:bg-green-600 text-white px-2 py-1 rounded" title="灵草×2：亲密度+8、经验+15">喂食</button>' +
            '<button onclick="openTeachModal(' + i + ')" class="text-xs bg-indigo-700 hover:bg-indigo-600 text-white px-2 py-1 rounded" title="传授你已掌握的绝技（好感≥60·灵石300·至多2门）">传授</button>' +
            '<button onclick="setActiveBeast(' + i + ')" class="text-xs bg-red-700 hover:bg-red-600 text-white px-2 py-1 rounded">出战</button>' +
            (b.mount ? '<button onclick="setActiveMount(' + i + ')" class="text-xs bg-cyan-700 hover:bg-cyan-600 text-white px-2 py-1 rounded">骑乘</button>' : '') +
            (template.evolve ? '<button onclick="evolveBeast(' + i + ')" class="text-xs bg-yellow-700 hover:bg-yellow-600 text-white px-2 py-1 rounded">进化</button>' : '') +
            '</div></div>';
    }
    container.innerHTML = html;
    // v20.0：灵兽园面板始终渲染
    if (typeof window.renderBeastGardenPanel === 'function') {
        var gardenHost = document.getElementById('beast-garden-panel');
        if (gardenHost) gardenHost.innerHTML = window.renderBeastGardenPanel();
    }
}

// 渲染灵兽图鉴
function renderBeastTemplates() {
    var container = document.getElementById('beast-templates');
    if (!container) return;
    if (typeof BEAST_TEMPLATES === 'undefined') { container.innerHTML = '<p class="text-gray-500">图鉴未加载</p>'; return; }
    var html = '';
    for (var id in BEAST_TEMPLATES) {
        var t = BEAST_TEMPLATES[id];
        var captured = window.tamedBeasts?.some(function(b) { return b.templateId === id; });
        // v17.4 主动捕捉入口：本地可捕的未收服灵兽显示「在此捕捉」（15分钟·成功率按等级/职业）
        var canCapHere = (typeof window.canCaptureInCurrentLocation === 'function') && t.catchable !== false &&
            window.canCaptureInCurrentLocation(id);
        html += '<div class="bg-gray-800/50 p-2 rounded border border-gray-700 text-center ' + (captured ? '' : 'opacity-60') + '">' +
            '<span class="text-xl">🐾</span>' +
            '<p class="text-xs text-gray-300">' + t.name + '</p>' +
            '<p class="text-xs text-gray-500">' + t.realm + '</p>' +
            (captured ? '<span class="text-xs text-green-400">✅</span>' :
             (canCapHere ? '<button onclick="captureBeast(\'' + id + '\'); renderBeastTemplates();" class="mt-1 text-xs bg-emerald-700 hover:bg-emerald-600 text-white px-2 py-1 rounded">🐾 捕捉</button>' : '')) +
            '</div>';
    }
    container.innerHTML = html;
    // v20.0：兽潮横幅（灵兽页顶部）
    var banner = document.getElementById('beast-tide-banner');
    if (banner) {
        if (window.BeastTide && window.BeastTide.isRaidActive && window.BeastTide.isRaidActive() && typeof window.getBeastTideDetailHtml === 'function') {
            var t = window.BeastTide.getActiveTide && window.BeastTide.getActiveTide();
            banner.innerHTML = '<div class="bg-amber-900/40 border border-amber-600 p-3 rounded">' +
                '<p class="font-bold text-amber-300">🐾 ' + ((t && t.name) || '兽潮') + ' 正在山野涌动</p>' +
                window.getBeastTideDetailHtml() + '</div>';
        } else {
            banner.innerHTML = '';
        }
    }
    // v20.0：雷鹰侦察报告
    var scoutEl = document.getElementById('beast-scout-report');
    if (scoutEl) {
        var canScout = window.BeastEcosystem && typeof window.BeastEcosystem.getActiveBeastBuff === 'function' && window.BeastEcosystem.getActiveBeastBuff('scout') > 0;
        if (canScout && window.DungeonDynamic && typeof window.DungeonDynamic.listScouted === 'function') {
            var found = window.DungeonDynamic.listScouted() || [];
            if (found.length) {
                var rows = found.map(function (d) {
                    return '<div class="flex justify-between items-center gap-2 py-1"><p class="text-xs text-sky-200">' + d.name + ' · ' + (d.region || '') + ' · 余' + d.remain + '日' + (d.suggestedRealm ? ' · 宜' + d.suggestedRealm : '') + '</p>' +
                        '<button onclick="enterScoutedDungeon(\'' + d.id + '\')" class="text-xs bg-sky-700 hover:bg-sky-600 text-white px-2 py-0.5 rounded whitespace-nowrap">进入</button></div>';
                }).join('');
                scoutEl.innerHTML = '<div class="bg-sky-900/30 border border-sky-700 p-3 rounded"><p class="font-bold text-sky-300 mb-1">🦅 雷鹰侦察</p>' + rows + '</div>';
            } else {
                scoutEl.innerHTML = '<div class="bg-sky-900/30 border border-sky-700 p-3 rounded"><p class="font-bold text-sky-300 mb-1">🦅 雷鹰侦察</p><p class="text-xs text-gray-400">当前没有开着的秘境窗口。</p></div>';
            }
        } else {
            scoutEl.innerHTML = '';
        }
    }
}

// 渲染洞府状态
function renderHouseStatus() {
    var container = document.getElementById('house-status');
    var shop = document.getElementById('house-shop');
    if (!container) return;
    if (typeof window.getHouseStatusHtml === 'function') {
        var ui = window.getHouseStatusHtml();
        container.innerHTML = ui.status || '';
        if (shop) shop.innerHTML = ui.shop || '';
        return;
    }
    var house = window.playerHouse;
    if (house && house.type) {
        var htype = window.HOUSE_TYPES?.[house.type];
        container.innerHTML = '<div class="flex items-center"><span class="text-2xl mr-2">' + (htype?.icon || '🏡') + '</span>' +
            '<div><p class="font-bold text-white">' + (htype?.name || '洞府') + '</p>' +
            '<p class="text-xs text-gray-400">升级: ' + Object.keys(house.upgrades || {}).length + '次</p></div></div>';
        if (shop) shop.innerHTML = '<p class="text-gray-500 text-sm">已拥有洞府</p>';
    } else {
        container.innerHTML = '<p class="text-gray-400 text-sm">尚未拥有洞府。可在城市中购买。</p>';
        if (shop) {
            var html = '';
            for (var tid in (window.HOUSE_TYPES || {})) {
                var h = window.HOUSE_TYPES[tid];
                html += '<div class="bg-gray-700/30 p-3 rounded-lg border border-gray-600">' +
                    '<div class="flex items-center mb-2"><span class="text-2xl mr-2">' + h.icon + '</span>' +
                    '<span class="font-bold text-white">' + h.name + '</span></div>' +
                    '<p class="text-xs text-gray-400">价格: ' + h.price + ' 灵石</p>' +
                    '<button onclick="buyHouse(\'' + tid + '\')" class="mt-2 text-xs bg-yellow-600 hover:bg-yellow-500 text-white px-2 py-1 rounded">购买</button></div>';
            }
            shop.innerHTML = html;
        }
    }
}

// ==================== v6.4 钓鱼系统 ====================
// P4修复：将不存在的鱼ID映射到实际存在的物品ID
var FISH_SPOTS = {
    river: {
        name: '河流',
        icon: '🏞️',
        fish: [
            { id: 'food_basic_fish', name: '鲤鱼', chance: 0.5, min: 1, max: 3 },
            { id: 'food_carp', name: '鲫鱼', chance: 0.3, min: 1, max: 2 },
            { id: 'food_grass_carp', name: '草鱼', chance: 0.2, min: 1, max: 1 }
        ]
    },
    lake: {
        name: '湖泊',
        icon: '🌊',
        fish: [
            { id: 'food_silver_fish', name: '银鱼', chance: 0.4, min: 1, max: 2 }, // food_spirit_fish → food_silver_fish
            { id: 'food_golden_carp', name: '锦鲤', chance: 0.3, min: 1, max: 1 },
            { id: 'food_koi', name: '锦鲤（变异）', chance: 0.1, min: 1, max: 1 }   // food_dragon_carp → food_koi
        ]
    },
    sea: {
        name: '海域',
        icon: '🌅',
        fish: [
            { id: 'food_sea_fish', name: '海鱼', chance: 0.5, min: 1, max: 3 },
            { id: 'food_black_fish', name: '黑鱼', chance: 0.2, min: 1, max: 1 },     // food_demon_fish → food_black_fish
            { id: 'food_tuna', name: '金枪鱼', chance: 0.05, min: 1, max: 1 }       // food_dragon_fish → food_tuna
        ]
    }
};

function goFishing(spotType) {
    if (!currentCharData) { showMessage('请先创建角色', 'warning'); return; }
    var energy = currentCharData.energy || 100;
    if (energy < 10) { showMessage('精力不足！', 'error'); return; }
    currentCharData.energy = energy - 10;
    if (window.timeSystem && window.timeSystem.advanceTime) window.timeSystem.advanceTime(30, '钓鱼');
    
    var spot = FISH_SPOTS[spotType] || FISH_SPOTS.river;
    var gained = [];
    spot.fish.forEach(function(f) {
        if (Math.random() < f.chance) {
            var count = f.min + Math.floor(Math.random() * (f.max - f.min + 1));
            gained.push(f.name + ' x' + count);
            if (window.addItem) window.addItem(f.id, count);
        }
    });
    showMessage('🎣 钓鱼完成：' + (gained.length > 0 ? gained.join(', ') : '一无所获'), gained.length > 0 ? 'success' : 'info');
    if (window.updateInventoryUI) window.updateInventoryUI();
}

// ==================== v6.4 二周目/多周目系统 ====================
function startNewGamePlus() {
    if (!confirm('开启新游戏+？保留境界和部分属性重新开始。')) return;
    var saveData = {
        name: currentCharData?.name,
        gender: currentCharData?.gender,
        realm: currentCharData?.realm,
        layer: currentCharData?.layer,
        level: currentCharData?.level,
        strength: currentCharData?.strength,
        dexterity: currentCharData?.dexterity,
        intelligence: currentCharData?.intelligence,
        constitution: currentCharData?.constitution,
        willpower: currentCharData?.willpower,
        meridian: currentCharData?.meridian,
        ngPlus: (currentCharData?.ngPlus || 0) + 1
    };
    localStorage.setItem('xianxia_ngplus', JSON.stringify(saveData));
    showMessage('数据已保存，请重新开始游戏以继承属性。', 'success');
}

function checkNewGamePlus() {
    var saved = localStorage.getItem('xianxia_ngplus');
    if (saved) {
        try {
            var data = JSON.parse(saved);
            if (data.ngPlus > 0) {
                showMessage('🌟 新游戏+模式激活！继承上周目部分属性。', 'info');
            }
        } catch(e) {}
    }
    return null;
}

function openTreasureChest(chestId) {
    if (!window.currentCharData) {
        showMessage('请先创建角色', 'warning');
        return;
    }
    // B4：绑定实体/日限，禁止无限全局抽奖
    window._openedChests = window._openedChests || {};
    var cid = chestId || (window.currentInteractionEntity && (window.currentInteractionEntity.id || window.currentInteractionEntity.name)) || null;
    if (cid && window._openedChests[cid]) {
        showMessage('这个宝箱已经打开过了', 'warning');
        return;
    }
    var day = (typeof window.getAbsoluteDay === 'function') ? window.getAbsoluteDay() : 1;
    if (!cid) {
        if (window._chestLootDay !== day) { window._chestLootDay = day; window._chestLootCount = 0; }
        if ((window._chestLootCount || 0) >= 3) {
            showMessage('今日无主宝箱搜刮次数已尽（3次）', 'warning');
            return;
        }
        window._chestLootCount = (window._chestLootCount || 0) + 1;
    } else {
        window._openedChests[cid] = true;
    }
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(5, '打开宝箱');
    }
    const roll = Math.random();
    if (roll < 0.3) {
        const stones = 20 + Math.floor(Math.random() * 80);
        if (window.XianXia && window.XianXia.DataManager && window.XianXia.DataManager.addSpiritStones) {
            window.XianXia.DataManager.addSpiritStones(stones);
        } else if (window.inventory && window.inventory.currency) {
            window.inventory.currency.spiritStones = (window.inventory.currency.spiritStones || 0) + stones;
        } else {
            currentCharData.spiritStones = (currentCharData.spiritStones || 0) + stones;
        }
        showMessage('打开宝箱获得' + stones + '灵石！', 'success');
    } else if (roll < 0.6) {
        if (typeof window.addItem === 'function') {
            window.addItem('vitality_pill', 1);
        }
        showMessage('打开宝箱获得疗伤丹！', 'success');
    } else {
        showMessage('宝箱是空的...', 'warning');
    }
    if (window.updateInventoryUI) window.updateInventoryUI();
    if (window.updateCurrencyUI) window.updateCurrencyUI();
    if (window.updateCharacterStatus) window.updateCharacterStatus();
}


function attackWildBeast(beastId) {
    if (!window.currentCharData) {
        showMessage('请先创建角色', 'warning');
        return;
    }
    showMessage(`开始攻击野兽！准备进入战斗...`, 'info');
    // 这里应该调用战斗系统
    if (typeof startBattle === 'function') {
        startBattle('wild_beast', beastId);
    }
}

// ==================== P3-4.1: 功法修炼可视化 ====================
function showProficiencyPanel() {
    if (!window.currentCharData) {
        showMessage('请先创建角色', 'warning');
        return;
    }
    
    let html = '<div class="space-y-3">';
    const proficiencies = window.proficiencyData || {};
    
    if (Object.keys(proficiencies).length === 0) {
        html += '<p class="text-gray-400">暂无修炼记录</p>';
    } else {
        Object.entries(proficiencies).forEach(([skillId, data]) => {
            const level = data.level || 1;
            const exp = data.exp || 0;
            const maxExp = level * 100;
            const percent = Math.min(100, (exp / maxExp) * 100);
            
            html += `
                <div class="bg-gray-700/30 p-3 rounded">
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-bold text-indigo-400">${data.name || skillId}</span>
                        <span class="text-sm text-gray-400">Lv.${level}</span>
                    </div>
                    <div class="w-full bg-gray-600 rounded h-4">
                        <div class="bg-indigo-500 h-4 rounded transition-all" style="width:${percent}%"></div>
                    </div>
                    <p class="text-xs text-gray-400 mt-1">${exp}/${maxExp} 经验</p>
                </div>
            `;
        });
    }
    html += '</div>';
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    modal.innerHTML = `
        <div class="bg-gray-800 border-2 border-indigo-500 rounded-xl p-6 max-w-lg w-full mx-4">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-indigo-400">🧘 功法修炼</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            ${html}
        </div>
    `;
    document.body.appendChild(modal);
}

// ==================== P3-4.2: 炼丹品质系统 ====================
// (已在craftPill中集成，使用crafting.js的品质系统)

// ==================== P3-4.3: 灵根变异效果 ====================
function getRootMutationBonus(statType) {
    if (!window.currentCharData || !currentCharData.mutatedRoots) {
        return 1.0;
    }
    
    switch(statType) {
        case 'thunder_power':
            return currentCharData.mutatedRoots.thunder ? 1.10 : 1.0; // v9.8 雷+10%
        case 'wind_speed':
            return currentCharData.mutatedRoots.wind ? 1.08 : 1.0; // v9.8 风速度+8%
        case 'ice_power':
            return currentCharData.mutatedRoots.ice ? 1.10 : 1.0; // v9.8 冰+10%
        case 'thunder_cultivation':
            return currentCharData.mutatedRoots.thunder ? 1.05 : 1.0; // v9.8 +5%
        case 'wind_cultivation':
            return currentCharData.mutatedRoots.wind ? 1.05 : 1.0; // v9.8 +5%
        case 'ice_cultivation':
            return currentCharData.mutatedRoots.ice ? 1.05 : 1.0; // v9.8 +5%
        default:
            return 1.0;
    }
}

// ==================== P3-4.4: 竞技场 ====================
// v12.1 已迁移至 js/gameplay/arena-system.js，app.js 仅保留调用点。

// ==================== P3-4.5: 贡献兑换系统（v5.1 扩展版，兑换实际扩展物品） ====================
function openContributionShop() {
    if (!window.discipleState || !window.discipleState.sectName) {
        showMessage('你还没有加入门派', 'warning');
        return;
    }
    
    const contribution = window.discipleState.contribution || 0;
    
    const items = [
        { id: 'contribution_art_breathing', name: '吐纳术', icon: '📖', cost: 100, desc: '真气恢复+10%', itemId: 'art_breathing' },
        { id: 'contribution_art_qi_condense', name: '凝气诀', icon: '📖', cost: 150, desc: '真气上限+10%', itemId: 'art_qi_condense' },
        { id: 'contribution_art_hun_yuan', name: '混元功', icon: '📖', cost: 300, desc: '真气上限+25%', itemId: 'art_hun_yuan' },
        { id: 'contribution_art_sword_basic', name: '基础剑法', icon: '⚔️', cost: 100, desc: '剑法+10', itemId: 'art_sword_basic' },
        { id: 'contribution_art_wind_sword', name: '清风剑法', icon: '⚔️', cost: 400, desc: '剑法+25', itemId: 'art_wind_sword' },
        { id: 'contribution_art_taiji_sword', name: '太极剑法', icon: '☯️', cost: 800, desc: '剑法+45,防御+30%', itemId: 'art_taiji_sword' },
        { id: 'contribution_art_lingbo', name: '凌波微步', icon: '💨', cost: 600, desc: '速度+50,闪避+25%', itemId: 'art_lingbo' },
        { id: 'contribution_art_fire_heart', name: '离火诀', icon: '🔥', cost: 350, desc: '火系伤害+20%', itemId: 'art_fire_heart' },
        { id: 'contribution_art_ice_heart', name: '玄冰诀', icon: '❄️', cost: 350, desc: '冰系伤害+20%', itemId: 'art_ice_heart' },
        { id: 'contribution_pill_spring', name: '回春丹', icon: '💊', cost: 80, desc: '恢复200HP x2', itemId: 'pill_spring_recovery', count: 2 },
        { id: 'contribution_pill_qi', name: '回灵丹', icon: '💊', cost: 80, desc: '恢复150真气 x2', itemId: 'pill_qi_return', count: 2 },
        { id: 'contribution_pill_foundation', name: '筑基丹', icon: '💊', cost: 300, desc: '筑基成功率+30%', itemId: 'pill_foundation' },
        { id: 'contribution_pill_body', name: '培元丹', icon: '💊', cost: 150, desc: '体质永久+2', itemId: 'pill_body_foundation' },
        { id: 'contribution_armor_cloud', name: '云纹甲', icon: '🛡️', cost: 500, desc: '珍品防具，闪避+20%', itemId: 'arm_cloud_armor' },
        { id: 'contribution_armor_dragon', name: '龙鳞甲', icon: '🛡️', cost: 400, desc: '火抗+30%', itemId: 'arm_dragon_scale_armor' },
        { id: 'contribution_weapon_sword', name: '青钢剑', icon: '⚔️', cost: 300, desc: '攻击18', itemId: 'wpn_steel_sword' },
        { id: 'contribution_weapon_frost', name: '霜月剑', icon: '⚔️', cost: 600, desc: '冰属性+10%', itemId: 'wpn_frost_moon' },
        { id: 'contribution_weapon_gan', name: '干将剑', icon: '⚔️', cost: 1500, desc: '攻击+15%', itemId: 'wpn_gan_jiang' },
        { id: 'contribution_exp', name: '经验符', icon: '✨', cost: 150, desc: '获得500历练' },
        { id: 'contribution_ore', name: '精铁礼盒', icon: '⛏️', cost: 80, desc: '精铁x10', itemId: 'mat_refined_iron', count: 10 }
    ];
    
    let html = items.map(item => `
        <div class="bg-gray-700/30 p-3 rounded mb-2 flex justify-between items-center">
            <div class="flex items-center gap-3">
                <span class="text-2xl">${item.icon}</span>
                <div>
                    <p class="font-bold text-purple-400">${item.name}</p>
                    <p class="text-xs text-gray-400">${item.desc}</p>
                    <p class="text-xs text-yellow-400">消耗: ${item.cost} 贡献</p>
                </div>
            </div>
            <button onclick="exchangeContribution('${item.id}', ${item.cost})" class="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded text-sm" ${contribution < item.cost ? 'disabled class="bg-gray-600 opacity-50 cursor-not-allowed"' : ''}>兑换</button>
        </div>
    `).join('');
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    modal.innerHTML = `
        <div class="bg-gray-800 border-2 border-purple-500 rounded-xl p-6 max-w-lg w-full mx-4">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-purple-400">🔄 贡献兑换</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div class="mb-4 p-3 bg-gray-700/50 rounded">
                <p class="text-sm text-gray-400">当前贡献: <span class="text-purple-400 font-bold">⭐ ${contribution}</span></p>
            </div>
            <div>${html}</div>
        </div>
    `;
    document.body.appendChild(modal);
}

function exchangeContribution(itemId, cost) {
    if (!window.discipleState) return;
    if (window.discipleState.contribution < cost) {
        showMessage('贡献不足！', 'error');
        return;
    }
    
    // 查找物品数据
    const items = [
        { id: 'contribution_art_breathing', name: '吐纳术', itemId: 'art_breathing' },
        { id: 'contribution_art_qi_condense', name: '凝气诀', itemId: 'art_qi_condense' },
        { id: 'contribution_art_hun_yuan', name: '混元功', itemId: 'art_hun_yuan' },
        { id: 'contribution_art_sword_basic', name: '基础剑法', itemId: 'art_sword_basic' },
        { id: 'contribution_art_wind_sword', name: '清风剑法', itemId: 'art_wind_sword' },
        { id: 'contribution_art_taiji_sword', name: '太极剑法', itemId: 'art_taiji_sword' },
        { id: 'contribution_art_lingbo', name: '凌波微步', itemId: 'art_lingbo' },
        { id: 'contribution_art_fire_heart', name: '离火诀', itemId: 'art_fire_heart' },
        { id: 'contribution_art_ice_heart', name: '玄冰诀', itemId: 'art_ice_heart' },
        { id: 'contribution_pill_spring', name: '回春丹', itemId: 'pill_spring_recovery', count: 2 },
        { id: 'contribution_pill_qi', name: '回灵丹', itemId: 'pill_qi_return', count: 2 },
        { id: 'contribution_pill_foundation', name: '筑基丹', itemId: 'pill_foundation' },
        { id: 'contribution_pill_body', name: '培元丹', itemId: 'pill_body_foundation' },
        { id: 'contribution_armor_cloud', name: '云纹甲', itemId: 'arm_cloud_armor' },
        { id: 'contribution_armor_dragon', name: '龙鳞甲', itemId: 'arm_dragon_scale_armor' },
        { id: 'contribution_weapon_sword', name: '青钢剑', itemId: 'wpn_steel_sword' },
        { id: 'contribution_weapon_frost', name: '霜月剑', itemId: 'wpn_frost_moon' },
        { id: 'contribution_weapon_gan', name: '干将剑', itemId: 'wpn_gan_jiang' },
        { id: 'contribution_ore', name: '精铁礼盒', itemId: 'mat_refined_iron', count: 10 }
    ];
    
    // 特殊处理经验符
    if (itemId === 'contribution_exp') {
        window.discipleState.contribution -= cost;
        currentCharData.tempering = (currentCharData.tempering || 0) + 500;
        showMessage('获得500历练！', 'success');
        if (window.updateCharacterStatus) window.updateCharacterStatus();
        if (window.updateInventoryUI) window.updateInventoryUI();
        const modal = document.querySelector('.fixed.inset-0.bg-black\\/70');
        if (modal) modal.remove();
        return;
    }
    
    const item = items.find(i => i.id === itemId);
    if (!item) {
        showMessage('兑换失败：物品不存在', 'error');
        return;
    }
    
    const realItemId = item.itemId;
    const count = item.count || 1;
    
    // 检查物品是否存在
    if (!window.itemById || !window.itemById[realItemId]) {
        showMessage(`物品 ${realItemId} 数据未加载`, 'error');
        return;
    }
    
    window.discipleState.contribution -= cost;
    
    // 添加物品到背包
    if (typeof window.addItem === 'function') {
        window.addItem(realItemId, count);
    } else if (window.inventory && typeof window.inventory.addItem === 'function') {
        window.inventory.addItem(realItemId, count);
    } else {
        // 手动添加
        for (let i = 0; i < window.inventory.slots.length; i++) {
            if (!window.inventory.slots[i]) {
                window.inventory.slots[i] = { templateId: realItemId, count: count };
                break;
            }
        }
    }
    
    const itemName = window.itemById[realItemId]?.name || realItemId;
    showMessage(`兑换成功！获得 ${itemName} x${count}`, 'success');
    
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    if (window.updateInventoryUI) window.updateInventoryUI();
    
    const modal = document.querySelector('.fixed.inset-0.bg-black\\/70');
    if (modal) modal.remove();
}

// ==================== P2-3.1: 境界突破系统 ====================
window.breakthroughRealm = breakthroughRealm;
function breakthroughRealm() {
    if (!currentCharData) {
        showMessage('请先创建角色', 'warning');
        return;
    }
    
    // 委托给 breakthrough-system.js 的新突破系统
    if (typeof window._performBreakthroughNew === 'function') {
        window._performBreakthroughNew();
        return;
    }
    
    // 旧版降级（仅当新系统不可用时）
    const realmList = ['炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'];
    const currentRealm = currentCharData.realm || '炼气';
    const currentLayer = currentCharData.layer || 1;
    const currentRealmIndex = realmList.indexOf(currentRealm);
    
    if (currentRealmIndex < 0 || currentRealmIndex >= realmList.length - 1) {
        showMessage('已达最高境界或境界无效', 'warning');
        return;
    }
    
    const nextRealm = realmList[currentRealmIndex + 1];
    const breakthroughCost = 100 * (currentRealmIndex + 1);
    
    if ((currentCharData.spiritStones || 0) < breakthroughCost) {
        showMessage(`需要${breakthroughCost}灵石进行突破`, 'error');
        return;
    }
    
    if (!confirm(`确定要突破到${nextRealm}期吗？\n消耗${breakthroughCost}灵石`)) {
        return;
    }
    
    currentCharData.spiritStones -= breakthroughCost;
    
    const successRate = 0.8 - (currentRealmIndex * 0.05);
    if (Math.random() < successRate) {
        currentCharData.realm = nextRealm;
        currentCharData.layer = 1;
        showMessage(`🎉 突破成功！当前境界：${nextRealm}一期`, 'success');
        currentCharData.maxQi = 100 * (currentRealmIndex + 2);
    } else {
        showMessage('突破失败，请继续修炼...', 'warning');
    }
    
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(60, '境界突破');
    }
    if (window.updateCharacterStatus) window.updateCharacterStatus();
}

// ==================== 拍卖行系统 ====================
// v12.1 已迁移到 js/economy/auction-service.js。
// app.js 不再维护拍卖物品、现实时间计时器或交易结算，避免继续形成石山代码。

// ==================== 野外NPC：游商 / 流浪修士 ====================
let wanderMerchantStock = null;
let wanderMerchantDay = -1;

function generateWanderStock() {
    const pool = [
        { id: 'vitality_pill', name: '回春丹', icon: '💊', basePrice: 40 },
        { id: 'foundation_pill', name: '筑基丹', icon: '🧪', basePrice: 120 },
        { id: 'mat_iron_ore', name: '铁矿', icon: '⛏️', basePrice: 15 },
        { id: 'spirit_stone', name: '灵石', icon: '💎', basePrice: 10 },
        { id: 'iron_sword', name: '玄铁剑', icon: '⚔️', basePrice: 180 },
        { id: 'mat_spirit_grass', name: '灵草', icon: '🌿', basePrice: 20 },
        { id: 'mat_lingzhi', name: '灵芝', icon: '🍄', basePrice: 25 },
        { id: 'mat_ginseng', name: '人参', icon: '🌱', basePrice: 50 }
    ];
    const count = 3 + Math.floor(Math.random() * 3);
    const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, count);
    return shuffled.map(item => ({
        ...item,
        stock: 1 + Math.floor(Math.random() * 3),
        price: Math.max(1, Math.round(item.basePrice * (0.9 + Math.random() * 0.4)))
    }));
}

function openWanderMerchant(priceMul = 1.2) {
    if (!currentCharData) {
        showMessage('请先创建角色', 'warning');
        return;
    }
    const dayKey = window.timeSystem?.gameTime?.currentDay || 1;
    if (!wanderMerchantStock || wanderMerchantDay !== dayKey) {
        wanderMerchantStock = generateWanderStock();
        wanderMerchantDay = dayKey;
    }

    const stones = window.inventory?.currency?.spiritStones || currentCharData.spiritStones || 0;
    const gold = window.inventory?.currency?.gold || currentCharData.copper || 0;
    const list = wanderMerchantStock.map((item, idx) => {
        const price = Math.round(item.price * priceMul);
        return `
            <div class="bg-gray-700/40 p-3 rounded mb-2 flex justify-between items-center">
                <div class="flex items-center gap-3">
                    <span class="text-2xl">${item.icon}</span>
                    <div>
                        <p class="font-bold text-amber-300">${item.name}</p>
                        <p class="text-xs text-gray-400">库存 ${item.stock} · 售价 ${price} 灵石</p>
                    </div>
                </div>
                <button onclick="buyWanderItem(${idx}, ${priceMul})" class="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1 rounded text-sm" ${item.stock <= 0 ? 'disabled' : ''}>购买</button>
            </div>
        `;
    }).join('');

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    modal.innerHTML = `
        <div class="bg-gray-800 border-2 border-amber-500 rounded-xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-amber-400">🛒 游商货摊</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <p class="text-xs text-gray-400 mb-3">野外游商价格偏高（约×${priceMul.toFixed(1)}）。今日灵石：${stones} · 铜钱：${gold}</p>
            <div>${list || '<p class="text-gray-500">今日已售罄</p>'}</div>
        </div>
    `;
    document.body.appendChild(modal);
}

function buyWanderItem(index, priceMul = 1.2) {
    if (!wanderMerchantStock || !wanderMerchantStock[index]) {
        showMessage('商品不存在', 'error');
        return;
    }
    const item = wanderMerchantStock[index];
    if (item.stock <= 0) {
        showMessage('该商品已售罄', 'warning');
        return;
    }
    const price = Math.round(item.price * priceMul);
    const currency = window.inventory?.currency;
    const stones = currency ? (currency.spiritStones || 0) : (currentCharData.spiritStones || 0);
    if (stones < price) {
        showMessage('灵石不足', 'error');
        return;
    }
    if (currency) {
        currency.spiritStones -= price;
    } else {
        currentCharData.spiritStones = stones - price;
    }
    item.stock -= 1;
    if (typeof window.addItem === 'function') {
        window.addItem(item.id, 1);
    } else if (window.inventory?.slots) {
        let added = false;
        for (const slot of window.inventory.slots) {
            if (slot && slot.templateId === item.id) {
                slot.count += 1;
                added = true;
                break;
            }
        }
        if (!added) {
            for (let i = 0; i < window.inventory.slots.length; i++) {
                if (!window.inventory.slots[i]) {
                    window.inventory.slots[i] = { templateId: item.id, name: item.name, count: 1 };
                    break;
                }
            }
        }
    }
    showMessage(`购得 ${item.name}，花费 ${price} 灵石`, 'success');
    if (window.updateCurrencyUI) window.updateCurrencyUI();
    if (window.updateInventoryUI) window.updateInventoryUI();
    document.querySelectorAll('.fixed.inset-0').forEach(m => m.remove());
    openWanderMerchant(priceMul);
}

function sparWithWanderer() {
    if (!currentInteractionEntity) {
        showMessage('没有可切磋的对象', 'warning');
        return;
    }
    showMessage('流浪修士应邀与你切磋！', 'info');
    if (typeof openBattleWithEntity === 'function') {
        openBattleWithEntity();
    }
}

function tradeSkillWithWanderer() {
    if (!currentCharData) {
        showMessage('请先创建角色', 'warning');
        return;
    }
    const cost = 80;
    const currency = window.inventory?.currency;
    const stones = currency ? (currency.spiritStones || 0) : (currentCharData.spiritStones || 0);
    if (stones < cost) {
        showMessage(`交易功法需要 ${cost} 灵石`, 'error');
        return;
    }
    if (currency) currency.spiritStones -= cost;
    else currentCharData.spiritStones = stones - cost;

    currentCharData.essence = (currentCharData.essence || 0) + 60;
    currentCharData.tempering = (currentCharData.tempering || 0) + 40;
    // v13.1 三分支奖励：25% 筑基丹 / 25% 流浪修士传授未知可学绝技 / 50% 原真元历练文案
    // 可学池 = COMBAT_ABILITIES 注册表减种系天生4项（hardened/pounce/chill/burn）减已习得
    var LEARNABLE_ABILITIES = ['venom', 'lifesteal', 'reflect', 'soundwave', 'illusion', 'escape', 'drain_qi', 'gu_parasite', 'sword_burst'];
    var abReg = window.COMBAT_ABILITIES || {};
    if (!Array.isArray(currentCharData.combatAbilities)) currentCharData.combatAbilities = [];
    var unknownPool = [];
    for (var li = 0; li < LEARNABLE_ABILITIES.length; li++) {
        var abId = LEARNABLE_ABILITIES[li];
        if (!abReg[abId]) continue; // 注册表未加载时跳过，杜绝假传授
        if (currentCharData.combatAbilities.indexOf(abId) < 0) unknownPool.push(abId);
    }
    var roll = Math.random();
    if (roll < 0.25) {
        if (typeof window.addItem === 'function') {
            window.addItem('foundation_pill', 1);
            showMessage('交易成功！获得修炼心得，并额外得到筑基丹', 'success');
        } else {
            showMessage('交易成功！获得真元+60、历练+40', 'success');
        }
    } else if (roll < 0.5 && unknownPool.length > 0) {
        var pickId = unknownPool[Math.floor(Math.random() * unknownPool.length)];
        currentCharData.combatAbilities.push(pickId);
        showMessage('🧙 流浪修士倾囊相授，你习得【' + ((abReg[pickId] && abReg[pickId].name) || pickId) + '】！', 'success');
    } else {
        showMessage('交易成功！获得真元+60、历练+40', 'success');
    }
    if (window.timeSystem?.advanceTime) window.timeSystem.advanceTime(20, '与流浪修士交易功法');
    if (window.updateCurrencyUI) window.updateCurrencyUI();
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    closeInteraction();
}

// ==================== 副本/秘境系统 ====================
const DUNGEON_DEFS = {
    ruin: { id: 'ruin', name: '上古遗迹', maxFloor: 5, cost: 50, icon: '🏛️' },
    cave: { id: 'cave', name: '幽暗洞穴', maxFloor: 3, cost: 30, icon: '🕳️' },
    mountain: { id: 'mountain', name: '仙山秘境', maxFloor: 7, cost: 100, icon: '🏔️' }
};
// F-23：秘境通关后灵气枯竭需时间复涌（现实逻辑——非"次数用完"计数器，而是世界本身的时间成本）
const DUNGEON_COOLDOWN_DAYS = 7;
function getDungeonCooldownLeft(dungeonId) {
    if (!currentCharData || !currentCharData.dungeonClearedAt) return 0;
    var clearedAt = currentCharData.dungeonClearedAt[dungeonId];
    if (clearedAt == null) return 0; // 从未通关
    var today = (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function')
        ? window.timeSystem.getAbsoluteDay()
        : ((window.timeSystem && window.timeSystem.gameTime) ? window.timeSystem.gameTime.currentDay : 0);
    return Math.max(0, DUNGEON_COOLDOWN_DAYS - (today - clearedAt));
}

let dungeonState = {
    active: false,
    id: null,
    name: '',
    floor: 1,
    maxFloor: 5,
    cost: 50
};

function openDungeonEntrance(dungeonId = 'ruin') {
    const def = DUNGEON_DEFS[dungeonId] || DUNGEON_DEFS.ruin;
    const progress = currentCharData?.dungeonProgress?.[def.id] || 1;
    const stones = window.inventory?.currency?.spiritStones || currentCharData?.spiritStones || 0;
    // F-23：灵气复涌冷却
    const cdLeft = (typeof getDungeonCooldownLeft === 'function') ? getDungeonCooldownLeft(def.id) : 0;
    const cooldownInfo = cdLeft > 0
        ? `<p class="text-xs text-orange-400 mt-2">⚠ 灵气因你上次通关而枯竭，需 ${cdLeft} 日复涌。</p>`
        : `<p class="text-xs text-gray-500 mt-2">每层可能遭遇怪物、宝箱或陷阱。可中途退出并保留进度。</p>`;
    const enterBtn = cdLeft > 0
        ? `<button disabled class="flex-1 bg-gray-700 text-gray-500 py-2 rounded cursor-not-allowed">🌀 灵气未复（${cdLeft}日）</button>`
        : `<button onclick="enterDungeon('${def.id}'); this.closest('.fixed').remove();" class="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-2 rounded">进入秘境</button>`;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    modal.innerHTML = `
        <div class="bg-gray-800 border-2 border-purple-500 rounded-xl p-6 max-w-md w-full mx-4">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-purple-400">${def.icon} ${def.name}</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div class="bg-gray-700/40 p-3 rounded mb-4 text-sm space-y-1">
                <p><span class="text-gray-400">层数：</span>最多 ${def.maxFloor} 层</p>
                <p><span class="text-gray-400">进入消耗：</span><span class="text-yellow-400">${def.cost} 灵石</span></p>
                <p><span class="text-gray-400">历史进度：</span>第 ${progress} 层</p>
                <p><span class="text-gray-400">当前灵石：</span>${stones}</p>
                ${cooldownInfo}
            </div>
            <div class="flex gap-2">
                ${enterBtn}
                <button onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 rounded">离开</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function enterDungeon(dungeonId = 'ruin') {
    if (!currentCharData) {
        showMessage('请先创建角色', 'warning');
        return;
    }
    const def = DUNGEON_DEFS[dungeonId] || DUNGEON_DEFS.ruin;
    // F-23：灵气未复涌时拒绝进入（defense——即便绕过入口 modal 直接调 enterDungeon）
    const cdLeft = (typeof getDungeonCooldownLeft === 'function') ? getDungeonCooldownLeft(def.id) : 0;
    if (cdLeft > 0) {
        showMessage(def.name + '灵气因上次通关而枯竭，距复涌尚需 ' + cdLeft + ' 日', 'warning');
        return;
    }
    const currency = window.inventory?.currency;
    const stones = currency ? (currency.spiritStones || 0) : (currentCharData.spiritStones || 0);
    if (stones < def.cost) {
        showMessage(`进入需要 ${def.cost} 灵石`, 'error');
        return;
    }
    if (currency) currency.spiritStones -= def.cost;
    else currentCharData.spiritStones = stones - def.cost;

    currentCharData.dungeonProgress = currentCharData.dungeonProgress || {};
    const startFloor = currentCharData.dungeonProgress[def.id] || 1;

    dungeonState = {
        active: true,
        id: def.id,
        name: def.name,
        floor: startFloor,
        maxFloor: def.maxFloor,
        cost: def.cost
    };
    currentCharData.dungeonFloor = startFloor;

    if (window.timeSystem?.advanceTime) window.timeSystem.advanceTime(30, '进入秘境');
    if (window.updateCurrencyUI) window.updateCurrencyUI();
    showMessage(`消耗 ${def.cost} 灵石，进入${def.name}第 ${startFloor} 层`, 'success');
    exploreDungeonFloor();
}


// B4：秘境战斗胜利后推进
function onDungeonBattleResolved(won) {
    if (!dungeonState || !dungeonState.active || !dungeonState._awaitingBattle) return;
    dungeonState._awaitingBattle = false;
    if (!won) {
        showMessage('秘境守卫击败了你，本层失败，进度保留', 'error');
        dungeonState.active = false;
        return;
    }
    // 通关判定
    if (dungeonState.floor >= dungeonState.maxFloor) {
        const clearBonus = 100 * dungeonState.maxFloor;
        // F-17：灵石统一走 DataManager（此前手动双写冗余，DataManager.setSpiritStones 已双源同步）
        if (window.XianXia && window.XianXia.DataManager && typeof window.XianXia.DataManager.addSpiritStones === 'function') {
            window.XianXia.DataManager.addSpiritStones(clearBonus);
        } else if (window.inventory && window.inventory.currency) {
            window.inventory.currency.spiritStones = (window.inventory.currency.spiritStones || 0) + clearBonus;
            if (currentCharData) currentCharData.spiritStones = window.inventory.currency.spiritStones;
        } else if (currentCharData) {
            currentCharData.spiritStones = (currentCharData.spiritStones || 0) + clearBonus;
        }
        if (typeof window.addItem === 'function') window.addItem('iron_sword', 1);
        currentCharData.dungeonProgress = currentCharData.dungeonProgress || {};
        currentCharData.dungeonProgress[dungeonState.id] = 1;
        // F-23：记录通关日，开启灵气复涌倒计时
        currentCharData.dungeonClearedAt = currentCharData.dungeonClearedAt || {};
        currentCharData.dungeonClearedAt[dungeonState.id] = (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function')
            ? window.timeSystem.getAbsoluteDay()
            : ((window.timeSystem && window.timeSystem.gameTime) ? window.timeSystem.gameTime.currentDay : 0);
        dungeonState.active = false;
        // F-1.2 重构：补全 dungeon:completed 事件 emit（仅通关最终层时）
        if (window.EventBus && typeof window.EventBus.emit === 'function') {
            try { window.EventBus.emit('dungeon:completed', { dungeonId: dungeonState.id, dungeonName: dungeonState.name }); } catch (e) {}
        }
        showMessage(dungeonState.name + '通关！获得 ' + clearBonus + ' 灵石与稀有装备', 'success');
        if (window.updateCurrencyUI) window.updateCurrencyUI();
        if (window.updateInventoryUI) window.updateInventoryUI();
        return;
    }
    setTimeout(function() {
        if (!dungeonState.active) return;
        const goNext = confirm('守卫已破！是否进入第 ' + (dungeonState.floor + 1) + ' 层？\n取消将退出并保留当前进度。');
        if (goNext) {
            dungeonState.floor += 1;
            currentCharData.dungeonFloor = dungeonState.floor;
            currentCharData.dungeonProgress = currentCharData.dungeonProgress || {};
            currentCharData.dungeonProgress[dungeonState.id] = dungeonState.floor;
            exploreDungeonFloor();
        } else {
            currentCharData.dungeonProgress = currentCharData.dungeonProgress || {};
            currentCharData.dungeonProgress[dungeonState.id] = dungeonState.floor;
            showMessage('你退出了秘境，进度保留在第 ' + dungeonState.floor + ' 层', 'info');
            dungeonState.active = false;
        }
    }, 400);
}
window.onDungeonBattleResolved = onDungeonBattleResolved;

// v10.0：秘境事件池（扩展多样性）；v12.4 合并重调——保留全部旧事件，
// 新增「灵泉回响」（纯真气恢复）与「残破功法」（概率听闻功法）两种。
// 大类占比贴合实施方案目标：战斗38 / 宝箱采集25 / 陷阱20 / 灵泉恢复9 / 功法奇遇8（总100）
var DUNGEON_EVENTS_POOL = [
    // —— 战斗类 38 ——
    { type: 'combat', weight: 30, minFloor: 1, msg: '第{floor}层遭遇守卫！' },
    { type: 'elite_combat', weight: 8, minFloor: 3, msg: '第{floor}层出现精英守卫！' },
    // —— 宝箱/采集类 25 ——
    { type: 'treasure', weight: 10, minFloor: 1, msg: '发现一个古朴的宝箱！' },
    { type: 'rare_treasure', weight: 7, minFloor: 2, msg: '发现一个闪耀的宝箱！' },
    { type: 'herb_garden', weight: 5, minFloor: 1, msg: '发现一片药圃！' },
    { type: 'treasure_map', weight: 3, minFloor: 2, msg: '发现一张残破的藏宝图！' },
    // —— 陷阱类 20 ——
    { type: 'trap', weight: 12, minFloor: 1, msg: '触发了机关陷阱！' },
    { type: 'magic_trap', weight: 8, minFloor: 3, msg: '触发了一个法阵陷阱！' },
    // —— 灵泉恢复类 9 ——
    { type: 'spirit_spring', weight: 5, minFloor: 2, msg: '发现一处灵泉！' },
    { type: 'spring_echo', weight: 4, minFloor: 1, msg: '石壁间残留着灵泉的回响...' },
    // —— 功法奇遇类 8 ——
    { type: 'inscription', weight: 4, minFloor: 1, msg: '墙上刻有古老的功法铭文...' },
    { type: 'broken_art', weight: 4, minFloor: 2, msg: '角落散落着一部残破功法...' }
];

function pickDungeonEvent(floor) {
    var pool = DUNGEON_EVENTS_POOL.filter(function(e) { return e.minFloor <= floor; });
    var totalWeight = 0; pool.forEach(function(e) { totalWeight += e.weight; });
    var roll = Math.random() * totalWeight; var acc = 0;
    for (var i = 0; i < pool.length; i++) { acc += pool[i].weight; if (roll < acc) return pool[i]; }
    return pool[pool.length - 1];
}

function exploreDungeonFloor() {
    if (!dungeonState.active || !currentCharData) return;
    var event = pickDungeonEvent(dungeonState.floor);
    var msg = (event.msg || '').replace('{floor}', dungeonState.floor);
    showMessage(msg, 'info');

    switch (event.type) {
        case 'combat':
            dungeonState._awaitingBattle = true; dungeonState._battleFloor = dungeonState.floor;
            if (typeof generateRandomEnemy === 'function') { var enemy = generateRandomEnemy(dungeonState.floor + 1, 'enemy', { deepAffix: true }); currentInteractionEntity = { type: 'person', name: enemy.name, data: enemy, _dungeonGuard: true }; if (typeof openBattleWithEntity === 'function') openBattleWithEntity(); }
            return;
        case 'elite_combat':
            dungeonState._awaitingBattle = true; dungeonState._battleFloor = dungeonState.floor;
            // v17.0 具名强敌：四层以下概率遭遇（respawnDays 防刷）
            try {
                var plLv2 = (currentCharData && currentCharData.level) || 1;
                var nemAvail = (window.NAMED_NEMESES || []).filter(function (n) {
                    if (n.minLv > plLv2) return false;
                    var down = (window.discipleState && window.discipleState._nemesisDown) || {};
                    var lastD = down[n.key];
                    var todayD = (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') ? window.timeSystem.getAbsoluteDay() : 0;
                    return lastD == null || (todayD - lastD) >= n.respawnDays;
                });
                if (dungeonState.floor >= 4 && nemAvail.length && Math.random() < 0.25 && typeof window.buildNemesisEnemy === 'function') {
                    var pickedNem = nemAvail[Math.floor(Math.random() * nemAvail.length)];
                    var nemE = window.buildNemesisEnemy(pickedNem.key, plLv2);
                    currentInteractionEntity = { type: 'person', name: nemE.name, data: nemE, _dungeonGuard: true };
                    showMessage('第' + dungeonState.floor + '层，' + nemE.name + ' 挡住了去路！', 'warning');
                    if (typeof openBattleWithEntity === 'function') openBattleWithEntity();
                    return;
                }
            } catch (eNemSpawn) {}
            if (typeof generateRandomEnemy === 'function') { var e2 = generateRandomEnemy(dungeonState.floor + 3, 'elite'); currentInteractionEntity = { type: 'person', name: e2.name, data: e2, _dungeonGuard: true }; if (typeof openBattleWithEntity === 'function') openBattleWithEntity(); }
            return;
        case 'treasure':
            var sg = 20 * dungeonState.floor + Math.floor(Math.random() * 30);
            if (window.inventory?.currency) { window.inventory.currency.spiritStones = (window.inventory.currency.spiritStones || 0) + sg; } else { currentCharData.spiritStones = (currentCharData.spiritStones || 0) + sg; }
            if (Math.random() < 0.35 && typeof window.addItem === 'function') { window.addItem('pill_small_recovery', 1); showMessage('宝箱中有 ' + sg + ' 灵石，还有一份丹药！', 'success'); } else { showMessage('宝箱中有 ' + sg + ' 灵石！', 'success'); }
            if (window.updateCurrencyUI) window.updateCurrencyUI(); if (window.updateInventoryUI) window.updateInventoryUI();
            break;
        case 'rare_treasure':
            var sg2 = 50 * dungeonState.floor + Math.floor(Math.random() * 60);
            if (window.inventory?.currency) { window.inventory.currency.spiritStones = (window.inventory.currency.spiritStones || 0) + sg2; } else { currentCharData.spiritStones = (currentCharData.spiritStones || 0) + sg2; }
            var rarePool = ['foundation_pill', 'wpn_frost_moon', 'art_taiji_sword']; var pick2 = rarePool[Math.floor(Math.random() * rarePool.length)];
            if (typeof window.addItem === 'function') window.addItem(pick2, 1);
            showMessage('✨ 闪耀宝箱！获得 ' + sg2 + ' 灵石与珍品！', 'success'); if (window.updateCurrencyUI) window.updateCurrencyUI(); if (window.updateInventoryUI) window.updateInventoryUI();
            break;
        case 'trap':
            var dmg = 8 * dungeonState.floor; currentCharData.health = Math.max(1, (currentCharData.health || 100) - dmg); showMessage('受到 ' + dmg + ' 点伤害！', 'error'); if (window.updateCharacterStatus) window.updateCharacterStatus();
            break;
        case 'magic_trap':
            var dmg2 = 15 * dungeonState.floor; currentCharData.health = Math.max(1, (currentCharData.health || 100) - dmg2); if (typeof window.getCurrentCharData === 'function') { var cd = window.getCurrentCharData(); if (cd) cd.qi = Math.max(0, (cd.qi || 100) - dmg2); } showMessage('法阵陷阱爆发！生命 -' + dmg2 + '，真气 -' + dmg2, 'error'); if (window.updateCharacterStatus) window.updateCharacterStatus();
            break;
        case 'inscription':
            var expGain = 20 * dungeonState.floor; var cd = window.currentCharData || (typeof window.getCurrentCharData === 'function' ? window.getCurrentCharData() : null);
            if (cd) { cd.tempering = (cd.tempering || 0) + expGain; showMessage('参悟铭文，获得 ' + expGain + ' 真元！', 'success'); }
            break;
        case 'spirit_spring':
            var cd2 = window.currentCharData || (typeof window.getCurrentCharData === 'function' ? window.getCurrentCharData() : null);
            if (cd2) { cd2.health = Math.min((cd2.maxHealth || 100), (cd2.health || 100) + 50); cd2.qi = Math.min((cd2.maxQi || 100), (cd2.qi || 100) + 50); cd2.energy = Math.min(100, (cd2.energy || 100) + 30); showMessage('灵泉洗涤，生命+50，真气+50，精力+30！', 'success'); if (window.updateCharacterStatus) window.updateCharacterStatus(); }
            break;
        case 'herb_garden':
            var herbCount = 1 + Math.floor(Math.random() * 3); var herbs = ['mat_lingzhi', 'mat_ginseng', 'mat_spirit_grass'];
            for (var h = 0; h < herbCount; h++) { var herb = herbs[Math.floor(Math.random() * herbs.length)]; if (typeof window.addItem === 'function') window.addItem(herb, 1); }
            showMessage('采集到 ' + herbCount + ' 株灵药！', 'success'); if (window.updateInventoryUI) window.updateInventoryUI();
            break;
        case 'treasure_map':
            var mapBonus = 30 * dungeonState.floor + Math.floor(Math.random() * 50);
            if (window.inventory?.currency) { window.inventory.currency.spiritStones = (window.inventory.currency.spiritStones || 0) + mapBonus; }
            if (typeof window.addItem === 'function') { window.addItem('mat_five_element_essence', 1); }
            showMessage('按照藏宝图指示，找到 ' + mapBonus + ' 灵石和五行精华！', 'success'); if (window.updateCurrencyUI) window.updateCurrencyUI(); if (window.updateInventoryUI) window.updateInventoryUI();
            break;
        case 'spring_echo':
            // v12.4：灵泉回响——弱于灵泉的纯真气恢复
            var cdEcho = window.currentCharData || (typeof window.getCurrentCharData === 'function' ? window.getCurrentCharData() : null);
            if (cdEcho) {
                var qiGain = 25 + 5 * dungeonState.floor;
                cdEcho.qi = Math.min((cdEcho.maxQi || 100), (cdEcho.qi || 100) + qiGain);
                showMessage('残留的灵机与你的经脉共鸣，真气恢复 ' + qiGain + ' 点。', 'success');
                if (window.updateCharacterStatus) window.updateCharacterStatus();
            }
            break;
        case 'broken_art':
            // v12.4：残破功法——60% 概率从功法池随机「听闻」一门（KnowledgeSystem heard 级，需完整秘籍方可修习）
            var ksArt = window.KnowledgeSystem;
            if (Math.random() < 0.6 && ksArt && typeof ksArt.unlock === 'function') {
                var artPool = [];
                (window.skillPages || []).forEach(function (page) {
                    (page || []).forEach(function (sk) { if (sk && sk.id) artPool.push(sk); });
                });
                if (artPool.length > 0) {
                    var art = artPool[Math.floor(Math.random() * artPool.length)];
                    ksArt.unlock(art.id, 'heard', { source: 'dungeon', completeness: 0 });
                    showMessage('你从残页中辨认出「' + art.name + '」的名目与片段要诀……（听闻级，寻得完整秘籍后方可修习）', 'success');
                } else {
                    showMessage('残页字迹早已湮灭，一无所获。', 'info');
                }
            } else {
                showMessage('残页上的功法晦涩难懂，你只记下了只言片语。', 'info');
            }
            break;
    }
    // 通关
    if (dungeonState.floor >= dungeonState.maxFloor) {
        var clearBonus = 100 * dungeonState.maxFloor;
        // F-17：灵石统一走 DataManager
        if (window.XianXia && window.XianXia.DataManager && typeof window.XianXia.DataManager.addSpiritStones === 'function') {
            window.XianXia.DataManager.addSpiritStones(clearBonus);
        } else if (window.inventory?.currency) {
            window.inventory.currency.spiritStones = (window.inventory.currency.spiritStones || 0) + clearBonus;
            if (currentCharData) currentCharData.spiritStones = window.inventory.currency.spiritStones;
        } else {
            currentCharData.spiritStones = (currentCharData.spiritStones || 0) + clearBonus;
        }
        var clearItems = ['iron_sword', 'foundation_pill', 'mat_lingzhi']; var clearItem = clearItems[Math.floor(Math.random() * clearItems.length)];
        if (typeof window.addItem === 'function') window.addItem(clearItem, 1);
        currentCharData.dungeonProgress = currentCharData.dungeonProgress || {}; currentCharData.dungeonProgress[dungeonState.id] = 1; dungeonState.active = false;
        // F-1.2 重构：补全 dungeon:completed 事件 emit
        if (window.EventBus && typeof window.EventBus.emit === 'function') {
            try { window.EventBus.emit('dungeon:completed', { dungeonId: dungeonState.id, dungeonName: dungeonState.name }); } catch (e) {}
        }
        showMessage(dungeonState.name + '通关！获得 ' + clearBonus + ' 灵石与' + (window.itemById?.[clearItem]?.name || clearItem), 'success');
        if (window.updateCurrencyUI) window.updateCurrencyUI(); if (window.updateInventoryUI) window.updateInventoryUI(); return;
    }
    // 下一层选择
    setTimeout(function() {
        if (!dungeonState.active) return;
        if (typeof window.showConfirm === 'function') {
            window.showConfirm('继续探索', '是否进入第 ' + (dungeonState.floor + 1) + ' 层？').then(function(goNext) {
                if (goNext) { dungeonState.floor += 1; currentCharData.dungeonFloor = dungeonState.floor; currentCharData.dungeonProgress = currentCharData.dungeonProgress || {}; currentCharData.dungeonProgress[dungeonState.id] = dungeonState.floor; exploreDungeonFloor(); }
                else { currentCharData.dungeonProgress = currentCharData.dungeonProgress || {}; currentCharData.dungeonProgress[dungeonState.id] = dungeonState.floor; showMessage('你退出了秘境，进度保留在第 ' + dungeonState.floor + ' 层', 'info'); dungeonState.active = false; }
            });
        } else {
            var goNext = confirm('是否进入第 ' + (dungeonState.floor + 1) + ' 层？');
            if (goNext) { dungeonState.floor += 1; currentCharData.dungeonFloor = dungeonState.floor; currentCharData.dungeonProgress = currentCharData.dungeonProgress || {}; currentCharData.dungeonProgress[dungeonState.id] = dungeonState.floor; exploreDungeonFloor(); }
            else { currentCharData.dungeonProgress = currentCharData.dungeonProgress || {}; currentCharData.dungeonProgress[dungeonState.id] = dungeonState.floor; showMessage('你退出了秘境，进度保留在第 ' + dungeonState.floor + ' 层', 'info'); dungeonState.active = false; }
        }
    }, 600);
}

// ==================== 全局导出（供HTML onclick与其他系统调用） ====================
window.openCityShop = openCityShop;
window.buyFromCityShop = buyFromCityShop;
window.talkToNPC = talkToNPC;
window.giveGiftToNPC = giveGiftToNPC;
window.confirmGiftToNPC = confirmGiftToNPC;
window.claimDailyIncome = claimDailyIncome;
window.mineOre = mineOre;
window.gatherHerbs = gatherHerbs;
window.chopWood = chopWood;
window.getCurrentRegionForGathering = getCurrentRegionForGathering;
window.openTreasureChest = openTreasureChest;
window.openContributionShop = openContributionShop;
window.exchangeContribution = exchangeContribution;
window.goFishing = goFishing;
window.FISH_SPOTS = FISH_SPOTS;
window.startNewGamePlus = startNewGamePlus;
window.checkNewGamePlus = checkNewGamePlus;
window.renderFactionList = renderFactionList;
window.renderBeastList = renderBeastList;
window.renderBeastTemplates = renderBeastTemplates;
window.renderHouseStatus = renderHouseStatus;
window.getRootMutationBonus = getRootMutationBonus;
window.getAffectionLevelInfo = getAffectionLevelInfo;
window.interactTalk = interactTalk;
window.openNpcDeepTalk = openNpcDeepTalk;
window.openAuctionHouse = openAuctionHouse;
window.openWanderMerchant = openWanderMerchant;
window.buyWanderItem = buyWanderItem;
window.sparWithWanderer = sparWithWanderer;
window.tradeSkillWithWanderer = tradeSkillWithWanderer;
window.openDungeonEntrance = openDungeonEntrance;
window.enterDungeon = enterDungeon;
window.exploreDungeonFloor = exploreDungeonFloor;
window.openBattleWithEntity = openBattleWithEntity;
window.buildPlayerBattleEntity = buildPlayerBattleEntity;
// 1.5 气运系统：luck 影响奇遇触发/稀有度；fortune 可消耗破机缘（必成突破/必得宝物）
window.getLuckChance = function(base) {
    var lk = (window.currentCharData && window.currentCharData.luck != null) ? window.currentCharData.luck : 50;
    return base * (0.5 + lk / 100);
};
window.spendLuck = function(amount) {
    var cd = window.currentCharData;
    if (!cd) return false;
    amount = amount || 10;
    if ((cd.luck || 0) < amount) return false;
    cd.luck = Math.max(0, (cd.luck || 0) - amount);
    return true;
};
window.getLuck = function() { var cd = window.currentCharData; return cd ? (cd.luck != null ? cd.luck : 50) : 50; };
// 1.6 玩家建宗 UI helper：接通既有 PlayerSect 系统（此前 create 无 UI 入口）
window._quickFoundSect = function() {
    var cd = window.currentCharData;
    if (!cd) return;
    var cost = 500;
    if (window.DataManager && window.DataManager.deductSpiritStones && !window.DataManager.deductSpiritStones(cost)) {
        if (window.showMessage) window.showMessage('立宗需 ' + cost + ' 灵石安顿山门。', 'warning');
        return;
    }
    var name = (cd.name || '无名') + '宗';
    if (window.PlayerSect && typeof window.PlayerSect.create === 'function') {
        var r = window.PlayerSect.create({ name: name });
        if (r && r.ok) {
            if (window.showMessage) window.showMessage('🏯 你开山立宗，「' + name + '」自此矗立修真界！', 'success');
            if (window.updateCultivationUI) window.updateCultivationUI();
        } else {
            if (window.showMessage) window.showMessage('立宗失败。', 'error');
        }
    }
};
window._defendSectRaid = function() {
    var cd = window.currentCharData;
    if (!cd) return;
    var tier = (typeof window.getRealmTier === 'function') ? window.getRealmTier(cd.realm) : 4;
    var enemyData = {
        name: '攻山妖兽', type: 'beast', species: 'beast', physiologyType: 'beast',
        level: tier * 4 + 10,
        attack: 40 + tier * 6, defense: 20 + tier * 3, speed: 25,
        maxDurability: 120 + tier * 20, durabilities: { chest: 120 + tier * 20 },
        combatAbilities: []
    };
    if (window.startBattle) window.startBattle(enemyData);
};
window.openInteraction = openInteraction;
window.renderInteraction = renderInteraction;
window.interactBuilding = interactBuilding;

// ==================== 道侣/结拜系统 ====================
function getBondStatus(npcId) {
    const bonds = currentCharData?.bonds || {};
    return bonds[npcId] || null;
}

function formBond(npcId, type) {
    if (!currentCharData || !window.npcManager) {
        showMessage('系统未就绪', 'error');
        return;
    }
    const npc = window.npcManager.getNPC(npcId);
    if (!npc) {
        showMessage('NPC不存在', 'error');
        return;
    }
    const aff = npc.relationship?.affection || 0;
    if (type === 'dao_companion' && aff < 80) {
        showMessage('好感度不足80，无法结为道侣', 'warning');
        return;
    }
    if (type === 'sworn' && aff < 60) {
        showMessage('好感度不足60，无法结拜', 'warning');
        return;
    }
    currentCharData.bonds = currentCharData.bonds || {};
    currentCharData.bonds[npcId] = {
        type: type,
        name: npc.name,
        since: Date.now()
    };
    if (type === 'dao_companion') {
        showMessage(`你与${npc.name}结为道侣！战斗攻击+10%，防御+5%`, 'success');
    } else {
        showMessage(`你与${npc.name}结拜金兰！修炼速度+15%`, 'success');
    }
    if (typeof window.showNPCDialog === 'function') {
        document.querySelectorAll('.fixed.inset-0').forEach(m => m.remove());
        window.showNPCDialog(npcId);
    }
}

function getBondBonuses() {
    const bonds = currentCharData?.bonds || {};
    let attack = 1.0, defense = 1.0, cultivation = 1.0;
    Object.values(bonds).forEach(b => {
        if (b.type === 'dao_companion') {
            attack += 0.10;
            defense += 0.05;
        }
        if (b.type === 'sworn') {
            cultivation += 0.15;
        }
    });
    return { attack: attack, defense: defense, cultivation: cultivation };
}

window.formBond = formBond;
window.getBondStatus = getBondStatus;
window.getBondBonuses = getBondBonuses;



// ==================== v7.1 活动面板刷新 ====================
function refreshWorldEventsPanel() {
    var el = document.getElementById('world-events-panel');
    if (!el) return;
    if (typeof window.getWorldEventsPanelHtml === 'function') {
        el.innerHTML = window.getWorldEventsPanelHtml();
    } else {
        el.innerHTML = '<p class="text-gray-500">世界事件系统未加载</p>';
    }
}

function refreshReputationPanel() {
    var el = document.getElementById('reputation-panel');
    if (!el) return;
    if (typeof window.getReputationPanelHtml === 'function') {
        el.innerHTML = window.getReputationPanelHtml();
    } else {
        el.innerHTML = '<p class="text-gray-500">声望系统未加载</p>';
    }
}

function refreshActivitiesPanel() {
    refreshWorldEventsPanel();
    refreshReputationPanel();
    if (typeof window.updateLifespanDisplay === 'function') {
        try { window.updateLifespanDisplay(); } catch (e) {}
    }
    if (typeof window.updateWeatherDisplay === 'function') {
        try { window.updateWeatherDisplay(); } catch (e) {}
    }
}

window.refreshWorldEventsPanel = refreshWorldEventsPanel;
window.refreshReputationPanel = refreshReputationPanel;
window.refreshActivitiesPanel = refreshActivitiesPanel;

window.showBattleUI = showBattleUI;
window.currentBattle = currentBattle;


// ==================== v7.1 全局战斗入口 ====================
function globalStartBattle(typeOrData, extra) {
    try {
        var charData = window.currentCharData;
        if (!charData) {
            if (window.showMessage) window.showMessage('请先创建角色', 'warning');
            return null;
        }
        var EntityCls = window.Entity;
        var BattleCls = window.Battle;
        var gen = window.generateRandomEnemy;
        if (!EntityCls || !BattleCls || !gen) {
            if (window.showMessage) window.showMessage('战斗系统未加载', 'error');
            return null;
        }
        var level = charData.level || charData.layer || 1;
        var type = 'enemy';
        var typeMap = {
            bandits: 'enemy', bandit: 'enemy',
            beast: 'beast', beast_tide: 'beast', wild_beast: 'beast',
            dungeon_guard: 'enemy', elite: 'enemy', boss: 'enemy',
            trial: 'enemy', training_dummy: 'enemy',
            spirit_fox: 'beast', secret_realm_guardian: 'beast'
        };
        if (typeof typeOrData === 'string') {
            type = typeMap[typeOrData] || (typeOrData.indexOf('beast') >= 0 ? 'beast' : 'enemy');
            if (typeOrData === 'elite' || typeOrData === 'dungeon_guard') level = Math.max(level, 5);
            if (typeOrData === 'boss' || typeOrData === 'beast_tide') level = Math.max(level, 8);
        }
        // 玩家Entity统一走单一权威链路（health → bloodVolume，伤口/耐久延续）
        var playerEntity = buildPlayerBattleEntity(level);
        if (!playerEntity) {
            if (window.showMessage) window.showMessage('战斗启动失败', 'error');
            return null;
        }
        var enemyData = gen(level, type);
        // 命名覆盖
        if (typeof typeOrData === 'string') {
            var names = {
                bandits: '山贼', bandit: '山贼', beast_tide: '兽潮妖兽',
                dungeon_guard: '地宫守卫', elite: '精英修士', boss: '魔头',
                trial: '试炼傀儡', training_dummy: '木人桩'
            };
            if (names[typeOrData]) enemyData.name = names[typeOrData];
        }
        var enemyEntity = new EntityCls(enemyData, type === 'beast' ? 'beast' : 'enemy');
        var battle = new BattleCls(playerEntity, enemyEntity);
        window.currentBattle = battle;
        
        // 【P2 修复】接入队伍系统：让队员在战斗中行动
        if (window.partySystem && typeof window.partySystem.usePartyInBattle === 'function') {
            window.partySystem.usePartyInBattle(battle);
        }
        
        if (typeof currentBattle !== 'undefined') {
            try { currentBattle = battle; } catch (e) {}
        }
        if (typeof showBattleUI === 'function') showBattleUI(battle);
        else if (window.showBattleUI) window.showBattleUI(battle);
        return battle;
    } catch (err) {
        console.error('startBattle error', err);
        if (window.showMessage) window.showMessage('战斗启动失败', 'error');
        return null;
    }
}
window.startBattle = globalStartBattle;
window.globalStartBattle = globalStartBattle;
window.breakthroughRealm = typeof breakthroughRealm === 'function' ? breakthroughRealm : window.breakthroughRealm;


// ==================== v7.2 城市扩展：分城商店与设施动作 ====================
function openMedicineShop() { openCityShop('medicine'); }
function openTalismanShop() { openCityShop('talisman'); }
function openWeaponShopCity() { openCityShop('weapon'); }
function openArmorShopCity() { openCityShop('armor'); }
function openArtShop() { openCityShop('art'); }
function openBeastShop() {
    if (typeof switchPanel === 'function') switchPanel('beasts');
    else if (window.showMessage) window.showMessage('请打开灵兽面板', 'info');
}
function openEnchantShop() {
    if (window.openEnhancementHall) window.openEnhancementHall();
    else if (window.openForgingShop) window.openForgingShop();
}
function visitTeaHouse() {
    if (window.showMessage) window.showMessage('茶香袅袅，你听得几句江湖传闻……', 'info');
    if (window.currentCharData) {
        window.currentCharData.mood = Math.min(100, (window.currentCharData.mood || 50) + 8);
        window.currentCharData.tempering = (window.currentCharData.tempering || 0) + 15;
    }
    if (window.eventSystem && Math.random() < 0.25) window.eventSystem.triggerRandomEvent();
    if (window.timeSystem && window.timeSystem.advanceTime) window.timeSystem.advanceTime(30, '茶馆');
}
function openGuildHall() {
    if (typeof switchPanel === 'function') switchPanel('quests');
    else if (window.openQuestHall) window.openQuestHall();
    if (window.showMessage) window.showMessage('公会大厅：可接悬赏与任务', 'info');
}
function openLibrary() {
    if (window.currentCharData) {
        window.currentCharData.essence = (window.currentCharData.essence || 0) + 25;
        window.currentCharData.insightPoints = (window.currentCharData.insightPoints || 0) + (Math.random() < 0.15 ? 1 : 0);
    }
    // v19.0 P0-3 批次 B1：若玩家在宗门内，藏经阁按职位分层阅览
    var ds = window.discipleState;
    if (ds && ds.isInSect && typeof window.getReadableSectArts === 'function') {
        var arts = window.getReadableSectArts(ds.sectId);
        var role = (typeof window.getPlayerSectRole === 'function') ? window.getPlayerSectRole() : null;
        if (role) {
            // 玩家能读的本派功法
            var msg = '📖 藏经阁（共可阅览 ' + arts.length + ' 部本派功法）';
            var maxTier = 1;
            if (role === 'elder' || role === 'leader') maxTier = 4;
            else if (role === 'disciple') {
                var rankId = ds.rank;
                if (rankId === 3) maxTier = 3;
                else if (rankId === 4) maxTier = 2;
            }
            msg += ' · 镇派至 ' + maxTier + ' 楼';
            if (typeof window.showMessage === 'function') window.showMessage(msg, 'info');
        }
    }
    if (window.showMessage) window.showMessage('翻阅典籍，修为略有精进', 'success');
    if (window.timeSystem && window.timeSystem.advanceTime) window.timeSystem.advanceTime(40, '藏经阁');
    openCityShop('art');
}

window.openMedicineShop = openMedicineShop;
window.openTalismanShop = openTalismanShop;
window.openWeaponShopCity = openWeaponShopCity;
window.openArmorShopCity = openArmorShopCity;
window.openArtShop = openArtShop;
window.openBeastShop = openBeastShop;
window.openEnchantShop = openEnchantShop;
window.visitTeaHouse = visitTeaHouse;
window.openGuildHall = openGuildHall;
window.openLibrary = openLibrary;
window.openTypedCityShop = openTypedCityShop;
window.openCityShop = openCityShop;
window.selectCity = selectCity;

// ==================== v9.0 新增设施基础功能 ====================

// === 户籍司 ===
function openHouseholdRegistry() {
    var player = window.currentCharData || {};
    var log = window.gameLog || { add: function() {} };
    log.add('你来到户籍司，向书吏出示身份令牌，查询了城中居民登记信息。', 'info');
    player.tempering = (player.tempering || 0) + 5;
    if (window.timeSystem && window.timeSystem.advanceTime) {
        window.timeSystem.advanceTime(10, '户籍司查询');
    }
}

// === 消防司 ===
function openFireDepartment() {
    var log = window.gameLog || { add: function() {} };
    log.add('你来到消防司，今日并无火情，与值班差官闲聊了几句城中防火事宜。', 'info');
    if (window.timeSystem && window.timeSystem.advanceTime) {
        window.timeSystem.advanceTime(5, '消防司');
    }
}

// === 悬赏楼 ===
function openBountyHall() {
    var log = window.gameLog || { add: function() {} };
    log.add('你来到悬赏楼，查看最新的悬赏榜单。', 'info');
    if (typeof openQuestHall === 'function') {
        openQuestHall();
    } else {
        log.add('悬赏榜上暂无新通缉令。', 'info');
    }
    if (window.timeSystem && window.timeSystem.advanceTime) {
        window.timeSystem.advanceTime(5, '悬赏楼');
    }
}

// === 税课司 ===
function openTaxBureau() {
    var player = window.currentCharData || {};
    var log = window.gameLog || { add: function() {} };
    log.add('你来到税课司，查阅了本月的税收账册。城中丹药税收入颇丰，灵矿税略有下降。', 'info');
    player.tempering = (player.tempering || 0) + 5;
    if (window.timeSystem && window.timeSystem.advanceTime) {
        window.timeSystem.advanceTime(10, '税课司查阅');
    }
}

// === 粮仓 ===
function openGranary() {
    var player = window.currentCharData || {};
    var log = window.gameLog || { add: function() {} };
    log.add('你巡视粮仓，粮仓储备充足，管事的向你汇报了近期粮食收支情况。', 'info');
    player.tempering = (player.tempering || 0) + 3;
    if (window.timeSystem && window.timeSystem.advanceTime) {
        window.timeSystem.advanceTime(10, '巡视粮仓');
    }
}

// === 司法堂 ===
function openCourt() {
    var log = window.gameLog || { add: function() {} };
    var msgs = [
        '今日审理的是一桩灵兽伤人案，你旁听了整个庭审过程。',
        '有一桩丹方归属纠纷正在调解，双方各执一词。',
        '今日并无重大案件，你与司法堂主簿聊了聊城中治安。'
    ];
    log.add('你来到司法堂，' + msgs[Math.floor(Math.random() * msgs.length)], 'info');
    if (window.timeSystem && window.timeSystem.advanceTime) {
        window.timeSystem.advanceTime(10, '司法堂旁听');
    }
}

// === 镇邪司 ===
function openExorcistBureau() {
    var player = window.currentCharData || {};
    var log = window.gameLog || { add: function() {} };
    var hasActivity = Math.random() < 0.3;
    if (hasActivity) {
        log.add('镇邪司今日有任务：城郊发现疑似邪祟活动的痕迹，你可以前去调查。', 'warning');
        player.tempering = (player.tempering || 0) + 10;
    } else {
        log.add('镇邪司今日清静，并无异常事件报告。你检查了各处封印，一切正常。', 'info');
        player.tempering = (player.tempering || 0) + 5;
    }
    if (window.timeSystem && window.timeSystem.advanceTime) {
        window.timeSystem.advanceTime(15, '镇邪司巡查');
    }
}

// === 医馆 ===
function openMedicalClinic() {
    var player = window.currentCharData || {};
    var log = window.gameLog || { add: function(m, t) { if (window.showMessage) window.showMessage(m, t || 'info'); } };
    // B5：收费 + 冷却感；轻伤回血，并尝试部位耐久微恢复
    var fee = 15;
    var stones = (window.XianXia && window.XianXia.DataManager) ? window.XianXia.DataManager.getSpiritStones()
        : ((window.inventory && window.inventory.currency && window.inventory.currency.spiritStones) || 0);
    if (stones < fee) {
        if (window.showMessage) window.showMessage('诊金不足（需' + fee + '灵石）', 'error');
        return;
    }
    if (window.XianXia && window.XianXia.DataManager) window.XianXia.DataManager.deductSpiritStones(fee);
    else if (window.inventory && window.inventory.currency) window.inventory.currency.spiritStones -= fee;

    // 剩余任务#2：医馆诊治写出当前伤势明细（写进游戏日志）
    try {
        var _woundsNow = window._playerEntity && window._playerEntity.physiology && window._playerEntity.physiology.wounds;
        if (_woundsNow && _woundsNow.length) {
            var _partNames = { brain: '头部', head: '头部', neck: '颈部', chest: '胸腔', abdomen: '腹部', arm: '手臂', leg: '腿部', hand: '手部', foot: '足部', spine: '脊背' };
            var _typeNames = { slash: '割伤', stab: '刺伤', blunt: '钝击伤', pierce: '贯穿伤', fire: '灼伤', cold: '冻伤', poison: '毒伤' };
            var _wList = _woundsNow.map(function (w) {
                var pn = _partNames[w.partId] || w.partId;
                var tn = _typeNames[w.damageType] || w.damageType;
                var tag = w.severity >= 60 ? '【重伤】' : (w.severity >= 30 ? '【中伤】' : '【轻伤】');
                var bleed = (w.bleeding && !w.stabilized) ? '（流血中）' : '';
                return tag + pn + tn + bleed;
            });
            if (_wList.length) log.add('🏥 大夫看诊，写下你身上 ' + _wList.length + ' 处伤势：' + _wList.join('；') + '。', 'warning');
        }
    } catch (eWounds) {}

    if (player.health !== undefined) {
        var maxH = player.maxHealth || 100;
        // P0-4 恢复分级化：医馆可处理浅表伤与危急伤——生命+30%上限
        var heal = Math.floor(maxH * 0.3);
        player.health = Math.min(maxH, (player.health || 0) + heal);
        log.add('医馆诊治：生命+' + heal + '（花费' + fee + '灵石）', 'success');
    } else {
        log.add('医馆大夫为你把了把脉。', 'info');
    }
    // P0-4：医馆部位耐久 +25（角色面板侧，远高于客栈的+10）
    try { if (typeof window.restoreBodyDurability === 'function') window.restoreBodyDurability(25); } catch (e) {}
    // P0-4：医馆可稳定流血伤口（客栈做不到）
    try {
        var _clinicWounds = window._playerEntity && window._playerEntity.physiology && window._playerEntity.physiology.wounds;
        if (_clinicWounds && _clinicWounds.length) {
            var _stabilized = 0;
            _clinicWounds.forEach(function (w) {
                if (w && w.bleeding && !w.stabilized) { w.stabilized = true; w.bleeding = false; _stabilized++; }
            });
            if (_stabilized > 0) log.add('大夫为你止血包扎，稳定了 ' + _stabilized + ' 处伤口。', 'success');
        }
    } catch (e) {}
    // 轻伤：部位耐久 +2（若有）
    try {
        var pe = window._playerPhysiology && window._playerPhysiology.physiology;
        if (pe && pe.parts) {
            Object.keys(pe.parts).forEach(function(k) {
                var p = pe.parts[k];
                if (p && p.durability != null && p.maxDurability != null && p.durability < p.maxDurability) {
                    p.durability = Math.min(p.maxDurability, p.durability + 2);
                }
            });
        }
    } catch (e) {}
    if (window.timeSystem && window.timeSystem.advanceTime) {
        window.timeSystem.advanceTime(30, '医馆就诊');
    }
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    if (window.updateCurrencyUI) window.updateCurrencyUI();
}

// 导出到全局
window.openHouseholdRegistry = openHouseholdRegistry;
window.openFireDepartment = openFireDepartment;
window.openBountyHall = openBountyHall;
window.openTaxBureau = openTaxBureau;
window.openGranary = openGranary;
window.openCourt = openCourt;
window.openExorcistBureau = openExorcistBureau;
window.openMedicalClinic = openMedicalClinic;

// ==================== 第二批设施入口函数 ====================
// 12个情境设施（已移除重复的坊市）→ 打开情境引擎面板
function openMoneyHouse() { if (window.openFacilityScenario) window.openFacilityScenario('money_house'); }
function openContractHall() { if (window.openFacilityScenario) window.openFacilityScenario('contract_hall'); }
function openEscortOffice() { if (window.openFacilityScenario) window.openFacilityScenario('escort_office'); }
function openCharityHall() { if (window.openFacilityScenario) window.openFacilityScenario('charity_hall'); }
function openArenaStage() { if (window.openFacilityScenario) window.openFacilityScenario('arena_stage'); }
function openObservatory() { if (window.openFacilityScenario) window.openFacilityScenario('observatory'); }
function openSteleForest() { if (window.openFacilityScenario) window.openFacilityScenario('stele_forest'); }
function openOddityMuseum() { if (window.openFacilityScenario) window.openFacilityScenario('oddity_museum'); }
function openPawnShop() { if (window.openFacilityScenario) window.openFacilityScenario('pawn_shop'); }
function openAuctionStoryScenario() { if (window.openFacilityScenario) window.openFacilityScenario('auction_house'); }
function openBlackMarket2() { if (window.openFacilityScenario) window.openFacilityScenario('black_market'); }
function openGardenVilla() { if (window.openFacilityScenario) window.openFacilityScenario('garden_villa'); }

// 导出
window.openMoneyHouse = openMoneyHouse;
window.openContractHall = openContractHall;
window.openEscortOffice = openEscortOffice;
window.openCharityHall = openCharityHall;
window.openArenaStage = openArenaStage;
window.openObservatory = openObservatory;
window.openSteleForest = openSteleForest;
window.openOddityMuseum = openOddityMuseum;
window.openPawnShop = openPawnShop;
window.openAuctionStoryScenario = openAuctionStoryScenario;
window.openBlackMarket2 = openBlackMarket2;
window.openGardenVilla = openGardenVilla;

// ==================== 设置系统 ====================
// 全局设置对象
window._settings = {};

function toggleCityIntro() {
    var cb = document.getElementById('setting-city-intro');
    if (cb) {
        window._settings.disableCityIntro = !cb.checked;
        try { localStorage.setItem('xianxia_settings', JSON.stringify(window._settings)); } catch(e) {}
    }
}

function initSettings() {
    try {
        var saved = localStorage.getItem('xianxia_settings');
        if (saved) {
            window._settings = JSON.parse(saved);
            var cb = document.getElementById('setting-city-intro');
            if (cb) cb.checked = !window._settings.disableCityIntro;
        }
    } catch(e) {}
}

window.toggleCityIntro = toggleCityIntro;
window.initSettings = initSettings;

// ==================== P0 修复：黑市交易函数 ====================
// 修复：buyBlackMarketItem / sellBlackMarketItem 不存在的问题

function buyBlackMarketItem() {
    if (window.scenarioEngine && typeof window.scenarioEngine.start === 'function') {
        // 尝试打开黑市场景
        const result = scenarioEngine.start('black_market', 'black_deal');
        if (result) {
            showMessage('已打开黑市交易界面', 'info');
        } else {
            showMessage('无法打开黑市', 'error');
        }
    } else {
        // 降级方案：直接显示消息
        showMessage('黑市：购买稀有物品（高风险）', 'warning');
    }
}

function sellBlackMarketItem() {
    if (window.scenarioEngine && typeof window.scenarioEngine.start === 'function') {
        // 黑市出售功能 - 暂时复用交易场景
        const result = scenarioEngine.start('black_market', 'black_deal');
        if (result) {
            showMessage('已打开黑市交易界面（可出售物品）', 'info');
        } else {
            showMessage('无法打开黑市', 'error');
        }
    } else {
        showMessage('黑市：出售不明物品（高价回收，不问来源）', 'warning');
    }
}

// ==================== P0 修复：深入按钮函数 ====================
// 修复：openScenarioPanel 不存在的问题，应调用 ScenarioEngine.open()

function openScenarioPanel(buildingId) {
    if (window.scenarioEngine && typeof window.scenarioEngine.open === 'function') {
        window.scenarioEngine.open(buildingId);
    } else if (window.scenarioEngine && typeof window.scenarioEngine.start === 'function') {
        // 降级方案：使用 scenarioEngine.start
        const scenarios = window.scenarioEngine.facilities[buildingId]?.scenarios || [];
        if (scenarios.length > 0) {
            window.scenarioEngine.start(buildingId, scenarios[0].id);
        } else {
            showMessage('该设施没有深入内容', 'info');
        }
    } else {
        showMessage('情景引擎未初始化', 'warning');
    }
}

// ==================== v20.0 灵兽园 + 清剿多波 + 雷鹰探秘境 ====================
// 移植自 vibex 源码（与 world-loop.js / beast-tide.js / dungeon-dynamic.js 配套）

function playerGardenSectId() {
    if (window.discipleState && window.discipleState.isInSect && window.discipleState.sectId) return window.discipleState.sectId;
    if (window.PlayerSect && typeof window.PlayerSect.listMySects === 'function') {
        var mine = window.PlayerSect.listMySects();
        if (mine && mine.length) return mine[0].id;
    }
    return '散修园';
}

function renderBeastGardenPanel() {
    if (!window.BeastGarden) return '<p class="text-gray-500">灵兽园尚未就绪。</p>';
    var sectId = playerGardenSectId();
    var gardens = window.BeastGarden.listGardens(sectId) || [];
    var buff = window.BeastGarden.getBuff(sectId) || { trainingPct: 0, buffMul: 1 };
    var cost = (window.BeastTide && window.BeastTide.GARDEN_COST) || 100;
    var html = '<p class="text-xs text-gray-400 mb-2">本园挂在「' + sectId + '」。园内灵兽培养更快（当前 +' + Math.round((buff.trainingPct || 0) * 100) + '%）。修建耗灵石 ' + cost + '。</p>';
    if (gardens.length === 0) {
        html += '<button onclick="buildPlayerBeastGarden()" class="text-xs bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1 rounded">修建灵兽园（' + cost + ' 灵石，每宗限一座）</button>';
        return html;
    }
    for (var g = 0; g < gardens.length; g++) {
        var garden = gardens[g];
        html += '<div class="bg-gray-800/50 p-2 rounded mb-2 border border-gray-700">';
        html += '<p class="text-xs text-emerald-300 mb-1">园 ' + (g + 1) + ' · 入驻 ' + (garden.beasts || []).length + ' 只</p>';
        var beasts = window.tamedBeasts || [];
        for (var i = 0; i < beasts.length; i++) {
            var b = beasts[i];
            var bid = b.uid || (b.templateId + '_' + i);
            var inGarden = (garden.beasts || []).indexOf(bid) >= 0;
            html += '<div class="flex justify-between items-center text-xs py-1">' +
                '<span>' + (b.name || bid) + (inGarden ? ' <span class="text-green-400">在园</span>' : '') + '</span>' +
                (inGarden
                    ? '<button onclick="removeBeastFromGarden(\'' + garden.gardenId + '\',\'' + bid + '\')" class="text-xs bg-gray-600 hover:bg-gray-500 text-white px-2 py-0.5 rounded">移出</button>'
                    : '<button onclick="addBeastToGarden(\'' + garden.gardenId + '\',\'' + bid + '\')" class="text-xs bg-emerald-700 hover:bg-emerald-600 text-white px-2 py-0.5 rounded">入园</button>') +
                '</div>';
        }
        if (!beasts.length) html += '<p class="text-xs text-gray-500">还没有灵兽可入园。</p>';
        html += '<button onclick="dismantlePlayerBeastGarden(\'' + garden.gardenId + '\')" class="mt-2 text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-0.5 rounded">拆园（退 ' + Math.floor(cost * 0.5) + ' 灵石）</button>';
        html += '</div>';
    }
    return html;
}

function dismantlePlayerBeastGarden(gardenId) {
    if (!window.BeastGarden) return;
    var r = window.BeastGarden.remove(gardenId);
    if (!r || r.ok === false) {
        if (window.showMessage) window.showMessage('这座园已经不在了。', 'warning');
        return;
    }
    var refund = (typeof r === 'object' && r.refund) ? r.refund : 0;
    if (window.showMessage) window.showMessage(refund ? ('园已拆，退回灵石 ' + refund + '。') : '园已拆。', 'info');
    if (typeof window.renderBeastList === 'function') window.renderBeastList();
}

function buildPlayerBeastGarden() {
    if (!window.BeastGarden) return;
    var r = window.BeastGarden.build(playerGardenSectId(), {});
    if (!r.ok) {
        if (r.reason === 'spiritStones-low' && window.showMessage) window.showMessage('灵石不足，修建灵兽园需 ' + (r.need || 100) + '。', 'error');
        else if (r.reason === 'sect-garden-full' && window.showMessage) window.showMessage('本宗已有一座灵兽园。要再建，先拆旧园。', 'warning');
        else if (window.showMessage) window.showMessage('未能修建灵兽园。', 'warning');
        return;
    }
    if (window.showMessage) window.showMessage('灵兽园已立。入园灵兽培养更快。', 'success');
    if (typeof window.renderBeastList === 'function') window.renderBeastList();
}

function addBeastToGarden(gardenId, beastId) {
    if (!window.BeastGarden) return;
    var ok = window.BeastGarden.addBeast(gardenId, beastId);
    if (window.showMessage) window.showMessage(ok ? '灵兽已入园休养。' : '这只灵兽已在园中。', ok ? 'success' : 'info');
    if (typeof window.renderBeastList === 'function') window.renderBeastList();
}

function removeBeastFromGarden(gardenId, beastId) {
    if (!window.BeastGarden) return;
    window.BeastGarden.removeBeast(gardenId, beastId);
    if (window.showMessage) window.showMessage('灵兽已移出园。', 'info');
    if (typeof window.renderBeastList === 'function') window.renderBeastList();
}

function beginBeastTideRaid() {
    if (typeof window.startBattle !== 'function') {
        if (window.showMessage) window.showMessage('战斗系统未就绪，无法清剿。', 'error');
        return false;
    }
    var boost = (window.BeastTide && window.BeastTide.getRarityBoost) ? window.BeastTide.getRarityBoost() : 1;
    var waves = Math.min(5, 2 + (boost || 1));
    window._tideRaid = { wave: 1, waves: waves, cores: 0, tempering: 0 };
    var battle = window.startBattle('beast_tide');
    if (battle) {
        battle._isBeastTideRaid = true;
        battle._tideWave = 1;
        battle._tideWaves = waves;
    }
    if (window.showMessage) window.showMessage('🐾 兽群分 ' + waves + ' 波扑来。先挡住第一波。', 'warning');
    return true;
}

function continueBeastTideRaid() {
    var raid = window._tideRaid;
    if (!raid || raid.wave >= raid.waves) return false;
    raid.wave += 1;
    if (typeof window.closeBattle === 'function') {
        try { window.closeBattle(); } catch (e) {}
    }
    var battle = window.startBattle && window.startBattle('beast_tide');
    if (battle) {
        battle._isBeastTideRaid = true;
        battle._tideWave = raid.wave;
        battle._tideWaves = raid.waves;
    }
    if (window.showMessage) window.showMessage('🐾 第 ' + raid.wave + ' / ' + raid.waves + ' 波兽群涌上。', 'warning');
    return true;
}

function applyBeastTideDefeatWound(raid) {
    raid = raid || {};
    var cd = window.currentCharData;
    var healthLost = 0;
    var energyLost = 0;
    if (cd) {
        var hp = Number(cd.health);
        var maxHp = Number(cd.maxHealth) || 100;
        if (!Number.isFinite(hp)) hp = maxHp;
        healthLost = Math.max(8, Math.round(maxHp * 0.18));
        cd.health = Math.max(1, hp - healthLost);
        energyLost = Math.min(cd.energy || 0, 25);
        cd.energy = Math.max(0, (cd.energy || 0) - energyLost);
        cd.qi = Math.max(0, Math.floor((cd.qi || 0) * 0.5));
    }
    if (typeof window.addReputation === 'function') {
        var city = window.locationSystem && window.locationSystem.getCurrentLocation && window.locationSystem.getCurrentLocation();
        if (city) window.addReputation(city, -8);
    }
    if (window.WorldJournal && typeof window.WorldJournal.record === 'function') {
        window.WorldJournal.record({
            type: 'beast_tide_raid_fail',
            title: '清剿受挫',
            text: '兽潮第 ' + (raid.wave || 1) + '/' + (raid.waves || 1) + ' 波没挡住，带伤退去。'
        });
    }
    if (typeof window.refreshWorldEventsPanel === 'function') {
        try { window.refreshWorldEventsPanel(); } catch (e) {}
    }
    if (window.showMessage) {
        window.showMessage('这一波没挡住。气血 -' + healthLost + '，精力大减，清剿中断。已得赏不退。', 'warning');
    }
    if (typeof window.showModal === 'function') {
        var html = '<p class="text-sm text-gray-300 mb-3">兽潮第 ' + (raid.wave || 1) + '/' + (raid.waves || 1) + ' 波没挡住，身上还有伤。客栈睡一晚压不住这种伤。</p>' +
            '<button onclick="openMedicalClinic(); var m=document.querySelector(\'.fixed.inset-0\'); if(m)m.remove();" class="text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded">去医馆诊治（15 灵石）</button>';
        window.showModal('🩹 需要就医', html);
    }
    return { healthLost: healthLost, energyLost: energyLost };
}

function settleBeastTideRaid(won) {
    var raid = window._tideRaid || { wave: 1, waves: 1, cores: 0, tempering: 0 };
    if (!won) {
        var wound = applyBeastTideDefeatWound(raid);
        window._tideRaid = null;
        return { ok: false, wave: raid.wave, waves: raid.waves, healthLost: wound.healthLost, energyLost: wound.energyLost };
    }
    var cores = 1 + Math.floor(Math.random() * 2);
    var tempering = 50;
    raid.cores = (raid.cores || 0) + cores;
    raid.tempering = (raid.tempering || 0) + tempering;
    if (typeof window.addItem === 'function') window.addItem('mat_demon_beast_core', cores);
    if (window.currentCharData) {
        window.currentCharData.tempering = (window.currentCharData.tempering || 0) + tempering;
    }
    var more = raid.wave < raid.waves;
    if (more) {
        if (window.showMessage) window.showMessage('第 ' + raid.wave + ' 波打退。兽核 ×' + cores + '。还有 ' + (raid.waves - raid.wave) + ' 波。', 'success');
        return { ok: true, more: true, wave: raid.wave, waves: raid.waves, cores: cores };
    }
    if (typeof window.addReputation === 'function') {
        var city = window.locationSystem && window.locationSystem.getCurrentLocation && window.locationSystem.getCurrentLocation();
        if (city) window.addReputation(city, 30);
    }
    if (window.showMessage) window.showMessage('🐾 兽潮清剿完毕。共得兽核 ×' + raid.cores + '，历练 +' + raid.tempering + '。', 'success');
    if (window.WorldJournal && typeof window.WorldJournal.record === 'function') {
        window.WorldJournal.record({ type: 'beast_tide_raid', title: '清剿兽潮', text: '打退 ' + raid.waves + ' 波，共得兽核 ' + raid.cores + '。' });
    }
    window._tideRaid = null;
    return { ok: true, more: false, cores: raid.cores, tempering: raid.tempering, waves: raid.waves };
}

function enterScoutedDungeon(dungeonId) {
    if (!window.DungeonDynamic || typeof window.DungeonDynamic.enter !== 'function') {
        if (window.showMessage) window.showMessage('秘境尚未就绪。', 'warning');
        return;
    }
    var r = window.DungeonDynamic.enter(dungeonId);
    if (!r || !r.ok) {
        var why = (r && r.reason === 'already-in-progress') ? '你已在这座秘境中。' : (r && r.reason === 'not-active') ? '这扇窗口已经关上。' : '未能进入。';
        if (window.showMessage) window.showMessage(why, 'warning');
        return;
    }
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(30, '探入秘境');
    }
    showDynamicDungeonRoom(dungeonId, r);
}

function showDynamicDungeonRoom(dungeonId, enterResult) {
    var D = window.DungeonDynamic;
    var progress = D.getPlayerProgress ? D.getPlayerProgress(dungeonId) : null;
    var room = (enterResult && enterResult.currentRoom) || (progress && progress.currentRoomEvent);
    var dungeon = (enterResult && enterResult.dungeon) || {};
    if (!room) {
        if (window.showMessage) window.showMessage('秘境内暂时无路。', 'info');
        return;
    }
    var opts = (room.options || []).map(function (c) {
        return '<button onclick="chooseDynamicDungeonRoom(\'' + dungeonId + '\',\'' + c + '\')" class="mr-2 mb-1 text-xs bg-purple-700 hover:bg-purple-600 text-white px-3 py-1 rounded">' + c + '</button>';
    }).join('');
    var html = '<p class="text-sm text-purple-300 mb-1">' + (dungeon.name || dungeonId) + '</p>' +
        '<p class="text-sm text-gray-300 mb-2">' + (room.name || '未知房间') + (room.type ? ' · ' + room.type : '') + '</p>' +
        '<p class="text-xs text-gray-500 mb-3">雷鹰探得的窗口。选一条路走下去。</p>' + opts;
    if (typeof window.showModal === 'function') window.showModal('🗻 ' + (dungeon.name || '秘境'), html);
}

function chooseDynamicDungeonRoom(dungeonId, choice) {
    if (!window.DungeonDynamic || typeof window.DungeonDynamic.exploreRoom !== 'function') return;
    var r = window.DungeonDynamic.exploreRoom(dungeonId, choice);
    if (!r || !r.ok) {
        if (window.showMessage) window.showMessage('此路不通。', 'warning');
        return;
    }
    var res = r.result || {};
    if (res.success) {
        if (res.reward && res.reward.materials && typeof window.addItem === 'function') {
            for (var i = 0; i < res.reward.materials.length; i++) window.addItem(res.reward.materials[i], 1);
        }
        if (window.showMessage) window.showMessage((res.room && res.room.name ? res.room.name + '：' : '') + '此路得通。', 'success');
    } else {
        if (window.currentCharData) {
            window.currentCharData.energy = Math.max(0, (window.currentCharData.energy || 0) - 8);
        }
        if (window.showMessage) window.showMessage((res.room && res.room.name ? res.room.name + '：' : '') + '此路受挫，精力一滞。', 'warning');
    }
    if (res.completed) {
        if (window.showMessage) window.showMessage('秘境走通' + (res.title ? '，得名「' + res.title + '」' : '') + '。', 'success');
        if (typeof window.renderBeastTemplates === 'function') window.renderBeastTemplates();
        return;
    }
    var progress = window.DungeonDynamic.getPlayerProgress(dungeonId);
    showDynamicDungeonRoom(dungeonId, { dungeon: { name: (res.room && res.room.name) || dungeonId, id: dungeonId }, currentRoom: progress && progress.currentRoomEvent });
}

// v20.0 导出
window.playerGardenSectId = playerGardenSectId;
window.renderBeastGardenPanel = renderBeastGardenPanel;
window.dismantlePlayerBeastGarden = dismantlePlayerBeastGarden;
window.buildPlayerBeastGarden = buildPlayerBeastGarden;
window.addBeastToGarden = addBeastToGarden;
window.removeBeastFromGarden = removeBeastFromGarden;
window.beginBeastTideRaid = beginBeastTideRaid;
window.continueBeastTideRaid = continueBeastTideRaid;
window.applyBeastTideDefeatWound = applyBeastTideDefeatWound;
window.settleBeastTideRaid = settleBeastTideRaid;
window.enterScoutedDungeon = enterScoutedDungeon;
window.showDynamicDungeonRoom = showDynamicDungeonRoom;
window.chooseDynamicDungeonRoom = chooseDynamicDungeonRoom;

// v10.0 任务追踪栏初始化
if (typeof window.initQuestTracker === 'function') {
    try { window.initQuestTracker(); } catch(e) {}
}
// v10.0 外交系统初始化
if (typeof window.initSectDiplomacy === 'function') {
    try { window.initSectDiplomacy(); } catch(e) {}
}
