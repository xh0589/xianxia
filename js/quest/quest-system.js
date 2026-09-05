// ==================== quest-system.js - 任务系统 ====================
// 借鉴《觅长生》、《剑网3》的任务设计

// ============ 任务类型 ============
const QUEST_TYPES = {
    MAIN: 'main',              // 主线任务
    SECT: 'sect',              // 门派任务
    DAILY: 'daily',            // 日常任务
    RANDOM: 'random',          // 随机任务
    COLLECTION: 'collection',  // 收集任务
    COMBAT: 'combat',          // 讨伐任务
    ESCORT: 'escort',          // 护送任务
    EXPLORATION: 'exploration' // 探索任务
};

// ============ 任务状态 ============
const QUEST_STATUSES = {
    AVAILABLE: 'available',    // 可接取
    ACTIVE: 'active',          // 进行中
    COMPLETED: 'completed',    // 已完成
    FAILED: 'failed',          // 已失败
    TURNED_IN: 'turned_in'    // 已交付
};

// ============ 任务优先级 ============
const QUEST_PRIORITIES = {
    LOW: { id: 'low', name: '普通', color: 'text-gray-400' },
    MEDIUM: { id: 'medium', name: '重要', color: 'text-blue-400' },
    HIGH: { id: 'high', name: '紧急', color: 'text-yellow-400' },
    CRITICAL: { id: 'critical', name: '主线', color: 'text-red-500' }
};

// ==================== P1：统一任务注册表 ====================
// QuestRegistry - 唯一任务注册表，替代直接查询多个数组

var QuestRegistry = {
    quests: new Map(), // questId -> quest object
    
    // 注册一批任务
    registerMany: function(quests) {
        if (!quests || !Array.isArray(quests)) return this;
        quests.forEach(quest => {
            if (quest.id) {
                this.quests.set(quest.id, quest);
            }
        });
        return this;
    },
    
    // 注册单个任务
    register: function(quest) {
        if (quest && quest.id) {
            this.quests.set(quest.id, quest);
        }
        return this;
    },
    
    // 通过ID查找任务（所有UI、接取、进度、交付都查同一个注册表）
    get: function(questId) {
        return this.quests.get(questId) || null;
    },
    
    // 获取所有任务（用于调试）
    getAll: function() {
        return Array.from(this.quests.values());
    }
};

// ============ 主线任务链 ============
const mainQuestChain = [
    {
        id: 'main_001',
        title: '仙路初启',
        type: QUEST_TYPES.MAIN,
        priority: QUEST_PRIORITIES.CRITICAL,
        description: '你踏上了修仙之路，首先需要前往一个门派拜师学艺。',
        objectives: [
            { type: 'visit', location: '门派列表', count: 1, completed: false },
            { type: 'join_sect', sectId: null, count: 1, completed: false }
        ],
        rewards: {
            exp: 100,
            spiritStones: 100,
            items: [{ itemId: 'pill_small_recovery', count: 5 }]
        },
        accepted: false,
        completed: false,
        turnedIn: false
    },
    {
        id: 'main_002',
        title: '炼气筑基',
        type: QUEST_TYPES.MAIN,
        priority: QUEST_PRIORITIES.CRITICAL,
        description: '修炼功法，突破到炼气期三层，为筑基做准备。',
          objectives: [
              { type: 'cultivation_realm', realm: '炼气', layer: 3, count: 1, completed: false }
          ],
        rewards: {
            exp: 300,
            spiritStones: 300,
            items: [{ itemId: 'pill_qi_gather', count: 10 }]
        },
        accepted: false,
        completed: false,
        turnedIn: false
    },
    {
        id: 'main_003',
        title: '首次猎妖',
        type: QUEST_TYPES.MAIN,
        priority: QUEST_PRIORITIES.HIGH,
        description: '外出猎杀妖兽，获取妖兽内丹，证明自己的实力。',
        objectives: [
            { type: 'kill', target: '妖兽', count: 5, completed: false }
        ],
        rewards: {
            exp: 500,
            spiritStones: 500,
            items: [{ itemId: 'mat_demon_beast_core', count: 3 }]
        },
        accepted: false,
        completed: false,
        turnedIn: false
    },
    {
        id: 'main_004',
        title: '筑基成功',
        type: QUEST_TYPES.MAIN,
        priority: QUEST_PRIORITIES.CRITICAL,
        description: '使用筑基丹尝试突破到筑基期。',
        objectives: [
            { type: 'breakthrough_realm', fromRealm: '炼气', toRealm: '筑基', count: 1, completed: false }
        ],
        rewards: {
            exp: 1000,
            spiritStones: 1000,
            items: [{ itemId: 'pill_foundation', count: 3 }]
        },
        accepted: false,
        completed: false,
        turnedIn: false
    },
    {
        id: 'main_005',
        title: '名扬九州',
        type: QUEST_TYPES.MAIN,
        priority: QUEST_PRIORITIES.CRITICAL,
        description: '在九州大陆建立自己的声望，成为知名修士。',
        objectives: [
            { type: 'reputation', amount: 500, count: 500, completed: false },
            { type: 'complete_quests', count: 20, completed: false }
        ],
        rewards: {
            exp: 5000,
            spiritStones: 5000,
            items: [{ itemId: 'wpn_xu_yuan', count: 1 }]
        },
        accepted: false,
        completed: false,
        turnedIn: false
    }
];

// ============ 日常任务池 ============
const dailyQuestPool = [
    {
        id: 'daily_001',
        title: '晨练修行',
        type: QUEST_TYPES.DAILY,
        priority: QUEST_PRIORITIES.LOW,
        description: '完成每日晨练，提升修为。',
        objectives: [
            { type: 'meditate', count: 1, completed: false }
        ],
        rewards: {
            exp: 50,
            qiRecovery: 100
        },
        isDaily: true,
        resetTime: '06:00',
        accepted: false,
        completed: false,
        turnedIn: false
    },
    {
        id: 'daily_002',
        title: '采集灵药',
        type: QUEST_TYPES.DAILY,
        priority: QUEST_PRIORITIES.LOW,
        description: '采集10株灵草用于炼丹。',
        objectives: [
            { type: 'collect', item: 'lingzhi', count: 10, completed: false }
        ],
        rewards: {
            exp: 30,
            spiritStones: 50,
            items: [{ itemId: 'mat_lingzhi', count: 5 }]
        },
        isDaily: true,
        resetTime: '00:00',
        accepted: false,
        completed: false,
        turnedIn: false
    },
    {
        id: 'daily_003',
        title: '切磋武艺',
        type: QUEST_TYPES.DAILY,
        priority: QUEST_PRIORITIES.MEDIUM,
        description: '与其他修士切磋3次。',
        objectives: [
            { type: 'sparring', count: 3, completed: false }
        ],
        rewards: {
            exp: 80,
            spiritStones: 100
        },
        isDaily: true,
        resetTime: '18:00',
        accepted: false,
        completed: false,
        turnedIn: false
    },
    {
        id: 'daily_004',
        title: '清理山贼',
        type: QUEST_TYPES.DAILY,
        priority: QUEST_PRIORITIES.MEDIUM,
        description: '剿灭附近的山贼团伙。',
        objectives: [
            { type: 'kill', target: '山贼', count: 5, completed: false }
        ],
        rewards: {
            exp: 100,
            spiritStones: 150,
            items: [{ itemId: 'mat_iron_ore', count: 10 }]
        },
        isDaily: true,
        resetTime: '12:00',
        accepted: false,
        completed: false,
        turnedIn: false
    }
];

// ============ 收集任务 ============
const collectionQuests = [
    {
        id: 'collection_001',
        title: '灵药收集',
        type: QUEST_TYPES.COLLECTION,
        priority: QUEST_PRIORITIES.MEDIUM,
        description: '收集各种灵药用于炼丹。',
        objectives: [
            { type: 'collect', item: 'lingzhi', count: 20, completed: false },
            { type: 'collect', item: 'spirit_grass', count: 15, completed: false },
            { type: 'collect', item: 'ginseng', count: 10, completed: false }
        ],
        rewards: {
            exp: 200,
            spiritStones: 300,
            items: [{ itemId: 'pill_foundation', count: 1 }]
        },
        accepted: false,
        completed: false,
        turnedIn: false
    },
    {
        id: 'collection_002',
        title: '矿石收集',
        type: QUEST_TYPES.COLLECTION,
        priority: QUEST_PRIORITIES.MEDIUM,
        description: '收集稀有矿石用于锻造。',
        objectives: [
            { type: 'collect', item: 'iron_ore', count: 50, completed: false },
            { type: 'collect', item: 'five_element_essence', count: 20, completed: false },
            { type: 'collect', item: 'dragon_bone', count: 5, completed: false }
        ],
        rewards: {
            exp: 300,
            spiritStones: 500,
            items: [{ itemId: 'flying_sword', count: 1 }]
        },
        accepted: false,
        completed: false,
        turnedIn: false
    }
];

// ============ 讨伐任务 ============
const combatQuests = [
    {
        id: 'combat_001',
        title: '剿灭匪患',
        type: QUEST_TYPES.COMBAT,
        priority: QUEST_PRIORITIES.HIGH,
        description: '附近山贼横行，请剿灭这些匪徒。',
        objectives: [
            { type: 'kill', target: '山贼', count: 10, completed: false }
        ],
        rewards: {
            exp: 150,
            spiritStones: 200,
            items: [{ itemId: 'pill_qi_gather', count: 5 }]
        },
        accepted: false,
        completed: false,
        turnedIn: false
    },
    {
        id: 'combat_002',
        title: '妖兽危机',
        type: QUEST_TYPES.COMBAT,
        priority: QUEST_PRIORITIES.HIGH,
        description: '某地妖兽出没，需要猎杀头领。',
        objectives: [
            { type: 'kill', target: '妖兽王', count: 1, completed: false },
            { type: 'kill', target: '妖兽', count: 5, completed: false }
        ],
        rewards: {
            exp: 500,
            spiritStones: 800,
            items: [{ itemId: 'mat_demon_beast_core', count: 5 }]
        },
        accepted: false,
        completed: false,
        turnedIn: false
    }
];

// ============ 所有任务合并 ============
let allQuests = [
    ...mainQuestChain,
    ...dailyQuestPool,
    ...collectionQuests,
    ...combatQuests
];

// 导出到全局，供 12-quest-extensions.js 等扩展文件访问
window.mainQuestChain = mainQuestChain;
window.allQuests = allQuests;

// 将任务链注册到注册表
QuestRegistry.registerMany(mainQuestChain);
QuestRegistry.registerMany(dailyQuestPool);
QuestRegistry.registerMany(collectionQuests);
QuestRegistry.registerMany(combatQuests);

// ============ 玩家任务进度 ============
let playerQuestProgress = {
    activeQuests: [],      // 当前进行中的任务ID列表
    completedQuests: [],   // 已完成的任务ID列表
    dailyResetTime: null,  // 上次日常任务重置时间
    totalCompleted: 0      // 累计完成任务数
};

// ============ 初始化任务系统 ============
function initQuestSystem() {
    const saved = localStorage.getItem('xianxia_quest_progress');
    if (saved) {
        try {
            playerQuestProgress = JSON.parse(saved);
        } catch (e) {
            console.error('加载任务进度失败:', e);
            playerQuestProgress = {
                activeQuests: [],
                completedQuests: [],
                dailyResetTime: null,
                totalCompleted: 0
            };
        }
    }
    
    // 检查是否需要重置日常任务
    checkDailyReset();
}

// ============ 保存任务进度 ============
function saveQuestProgress() {
    localStorage.setItem('xianxia_quest_progress', JSON.stringify(playerQuestProgress));
}

// ============ 检查日常任务重置 ============
function checkDailyReset() {
    const now = new Date();
    const today = now.toDateString();
    
    if (playerQuestProgress.dailyResetTime !== today) {
        // 重置所有日常任务
        dailyQuestPool.forEach(quest => {
            resetQuest(quest);
        });
        playerQuestProgress.dailyResetTime = today;
        saveQuestProgress();
    }
}

// ============ 重置任务 ============
function resetQuest(quest) {
    quest.accepted = false;
    quest.completed = false;
    quest.turnedIn = false;
    if (quest.objectives) {
        quest.objectives.forEach(obj => {
            obj.completed = false;
        });
    }
}

// ============ 接取任务 ============
function acceptQuest(questId) {
    const quest = findQuestById(questId);
    if (!quest) {
        showMessage('任务不存在', 'error');
        return false;
    }
    
    if (quest.accepted) {
        showMessage('该任务已经接取了', 'warning');
        return false;
    }
    
    // 检查任务数量限制
    if (playerQuestProgress.activeQuests.length >= 10) {
        showMessage('活跃任务数量已达上限（10个）', 'error');
        return false;
    }
    
    quest.accepted = true;
    playerQuestProgress.activeQuests.push(questId);
    saveQuestProgress();
    
    // v12.4：在任务目标地注册 🎯 地图标记（无地点字段或地图无对应点时内部自动跳过）
    if (typeof window.syncQuestTargetMarkers === 'function') {
        try { window.syncQuestTargetMarkers(); } catch (e) {}
    }
    
    showMessage(`接取任务：${quest.title}`, 'success');
    updateQuestUI();
    // BUG-12 修复：主线/日常列表由独立渲染函数负责，接取后必须一并刷新，
    // 否则已接取状态要等切面板（showQuestPanel → updateMainQuestUI）才显示。
    updateMainQuestUI();
    updateDailyQuestUI();
    updateRandomQuestUI();
    updateNpcQuestUI();
    return true;
}

// ============ 剧情演出系统（v6.0 新增） ============

// 显示剧情对话
function showStoryDialogue(storyData, questTitle) {
    if (typeof window.showScenePerformance === 'function') return window.showScenePerformance(storyData, questTitle);
    if (!storyData) return;
    
    // 创建剧情对话框
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50';
    modal.style.backdropFilter = 'blur(4px)';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    
    // 构造剧情文本
    let dialogueHtml = '';
    if (storyData.accept) {
        dialogueHtml += `<div class="mb-3 p-3 bg-gray-700/50 rounded-lg border-l-4 border-yellow-500">
            <p class="text-gray-200 leading-relaxed whitespace-pre-line">${storyData.accept}</p>
        </div>`;
    }
    if (storyData.progress) {
        dialogueHtml += `<div class="mb-3 p-3 bg-gray-700/30 rounded-lg border-l-4 border-blue-500">
            <p class="text-gray-400 text-sm leading-relaxed whitespace-pre-line">📋 ${storyData.progress}</p>
        </div>`;
    }
    if (storyData.complete) {
        dialogueHtml += `<div class="mb-3 p-3 bg-gray-700/50 rounded-lg border-l-4 border-green-500">
            <p class="text-green-300 leading-relaxed whitespace-pre-line">${storyData.complete}</p>
        </div>`;
    }
    
    // 如果有分支选择
    let choicesHtml = '';
    if (storyData.choices && storyData.choices.length > 0) {
        choicesHtml = '<div class="border-t border-gray-600 pt-3 mt-3">';
        choicesHtml += '<p class="text-gray-400 text-sm mb-2">你的选择：</p>';
        storyData.choices.forEach((choice, idx) => {
            choicesHtml += `<button onclick="this.closest('.fixed').remove(); ${choice.action || ''}"
                class="w-full text-left p-2 mb-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-200 transition">
                ${choice.text}
            </button>`;
        });
        choicesHtml += '</div>';
    }
    
    modal.innerHTML = `
        <div class="bg-gray-800 border-2 border-yellow-600/50 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
             style="box-shadow: 0 0 40px rgba(234,179,8,0.15);">
            <div class="flex items-center mb-4">
                <span class="text-2xl mr-2">📖</span>
                <h3 class="text-xl font-bold text-yellow-500">${questTitle || '剧情'}</h3>
            </div>
            <div class="space-y-2">
                ${dialogueHtml}
            </div>
            ${choicesHtml}
            <div class="flex justify-end mt-4">
                <button onclick="this.closest('.fixed').remove()"
                    class="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition">关闭</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// 接取任务时显示剧情（如果是主线任务）
function acceptQuestWithStory(questId) {
    const quest = findQuestById(questId);
    if (!quest) return false;
    
    // 显示剧情对话
    if (quest.storyDialogue) {
        showStoryDialogue(quest.storyDialogue, quest.title);
    }
    
    // 调用原有接取逻辑
    return acceptQuest(questId);
}

// 交付任务时显示剧情完成
function turnInQuestWithStory(questId) {
    const quest = findQuestById(questId);
    if (!quest) return false;
    
    // 先显示剧情完成对话
    if (quest.storyDialogue && quest.storyDialogue.complete) {
        showStoryDialogue({
            complete: quest.storyDialogue.complete
        }, quest.title + ' - 完成');
    }
    
    // 调用原有交付逻辑
    return turnInQuest(questId);
}

// ============ 分支结局系统（v6.1 新增） ============

// 结局定义
var GAME_ENDINGS = {
    ascension: {
        id: 'ascension',
        title: '【飞升成仙】',
        icon: '✨',
        color: 'text-yellow-400',
        bgGradient: 'from-yellow-900/80 via-amber-800/60 to-yellow-900/80',
        borderColor: 'border-yellow-500',
        condition: '完成所有主线任务，正道路线，杀戮值<50',
        description: '你历经千辛万苦，终于渡过天劫，飞升天界。\n\n天界之门为你敞开，金光万丈中，你感受到了前所未有的自由与力量。\n\n从此，你不再是凡间修士，而是天界仙人。\n\n你的名字将永远铭刻在仙路长青的传说中，\n成为后世修仙者仰望的传说。',
        stats: { endingPower: 100, endingFame: 100, endingKarma: 80 }
    },
    demon: {
        id: 'demon',
        title: '【入魔称霸】',
        icon: '👹',
        color: 'text-red-500',
        bgGradient: 'from-red-900/80 via-purple-800/60 to-red-900/80',
        borderColor: 'border-red-500',
        condition: '杀戮值≥100，邪派路线',
        description: '你放弃了正道，选择了力量至上的魔道。\n\n吸收魔教之力后，你成为了九州大陆最强大的存在。\n\n正道门派在你面前颤抖，魔教势力臣服于你。\n\n你建立了自己的魔道帝国，从此天地变色，\n但夜深人静时，你是否会想起曾经的自己？',
        stats: { endingPower: 95, endingFame: 30, endingKarma: 10 }
    },
    retire: {
        id: 'retire',
        title: '【隐退江湖】',
        icon: '🏡',
        color: 'text-green-400',
        bgGradient: 'from-green-900/80 via-teal-800/60 to-green-900/80',
        borderColor: 'border-green-500',
        condition: '有道侣，放弃突破，选择归隐',
        description: '你放下了对力量的执着，选择了与道侣共度余生。\n\n在一处山清水秀的洞府中，你们过上了闲云野鹤的生活。\n\n修炼不再是目的，而是生活的一部分。\n\n你教徒弟，种灵药，偶尔与老友把酒言欢。\n\n这种平淡的幸福，或许就是修仙的真谛。',
        stats: { endingPower: 30, endingFame: 50, endingKarma: 100 }
    },
    reincarnation: {
        id: 'reincarnation',
        title: '【轮回转世】',
        icon: '🔄',
        color: 'text-purple-400',
        bgGradient: 'from-purple-900/80 via-indigo-800/60 to-purple-900/80',
        borderColor: 'border-purple-500',
        condition: '渡劫失败，或选择轮回',
        description: '天劫之下，你的肉身化为齑粉。\n\n但你的魂魄并未消散，而是进入了轮回。\n\n你带着前世的记忆和部分修为，转世重生。\n\n新的旅程即将开始，这一次，\n你会走出一条不同的道路吗？',
        stats: { endingPower: 20, endingFame: 10, endingKarma: 50 }
    },
    chaos: {
        id: 'chaos',
        title: '【混沌之主】',
        icon: '🌌',
        color: 'text-cyan-400',
        bgGradient: 'from-cyan-900/80 via-blue-800/60 to-cyan-900/80',
        borderColor: 'border-cyan-500',
        condition: '统一正邪两道，完成所有主线+隐藏任务',
        description: '你超越了正邪的界限，统一了九州大陆。\n\n正道尊你为仙尊，魔道奉你为魔帝。\n\n你打破了仙魔两界的壁垒，创造了新的秩序。\n\n从此，世间再无正邪之争，\n只有追求大道的同行者。\n\n你成为了真正的混沌之主，开创新纪元。',
        stats: { endingPower: 120, endingFame: 120, endingKarma: 60 }
    }
};

// 检测玩家符合哪个结局条件
function checkEndingCondition() {
    var charData = window.currentCharData;
    if (!charData) return null;
    
    var killCount = charData.killCount || 0;
    var bonds = charData.bonds || {};
    var hasDaoCompanion = Object.values(bonds).some(function(b) { return b.type === 'dao_companion'; });
    var questProgress = window.playerQuestProgress;
    var completedMainQuests = (questProgress && questProgress.completedQuests) ?
        questProgress.completedQuests.filter(function(qid) { return qid.indexOf('main_') === 0; }).length : 0;
    // F-1 修复：原条件 completedMainQuests >= 35，但实际主线只有 5(quest-system.js) + 15(12-quest-extensions.js) = 20 个
    // main_006-020 完全缺失，35 步要求让 5 结局（飞升/入魔/隐退/轮回/混沌之主）全部不可达 → 结局系统是死代码
    // 改为 20：完成所有已有主线即可触发结局
    var allCompleted = completedMainQuests >= 20;
    
    // 检查混沌之主（最难达成）
    if (allCompleted && killCount >= 50 && killCount <= 150 && hasDaoCompanion) {
        // 完成所有主线+有一定阅历+有道侣
        // 需要额外检查隐藏任务完成
        return 'chaos';
    }
    
    // 检查入魔
    if (killCount >= 100) {
        return 'demon';
    }
    
    // 检查隐退
    if (hasDaoCompanion && allCompleted) {
        return 'retire';
    }
    
    // 检查飞升（默认结局）
    if (allCompleted) {
        return 'ascension';
    }
    
    // 检查轮回
    if (charData.realm === '炼气' && charData.layer <= 0) {
        return 'reincarnation';
    }
    
    return null;
}

// 手动选择结局（用于通关后的选择界面）
function selectEnding(endingId) {
    if (!GAME_ENDINGS[endingId]) {
        showMessage('结局不存在', 'error');
        return;
    }
    showEndingScreen(endingId);
}

// 显示结局画面
function showEndingScreen(endingId) {
    var ending = GAME_ENDINGS[endingId];
    if (!ending) {
        ending = GAME_ENDINGS.ascension;
    }
    
    // 保存结局记录
    try {
        var endingHistory = JSON.parse(localStorage.getItem('xianxia_endings') || '[]');
        endingHistory.push({
            endingId: ending.id,
            endingName: ending.title,
            timestamp: Date.now(),
            playerName: window.currentCharData ? window.currentCharData.name : '未知',
            realm: window.currentCharData ? (window.currentCharData.realm + window.currentCharData.layer + '层') : '未知'
        });
        localStorage.setItem('xianxia_endings', JSON.stringify(endingHistory));
    } catch(e) {}
    
    // 创建结局画面
    var modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[100] flex items-center justify-center';
    modal.style.background = 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 100%)';
    modal.style.backdropFilter = 'blur(8px)';
    
    // 星级评分
    var starCount = ending.stats ? Math.floor(ending.stats.endingPower / 25) : 3;
    var stars = '';
    for (var s = 0; s < 5; s++) {
        stars += s < starCount ? '⭐' : '☆';
    }
    
    modal.innerHTML = `
        <div class="text-center max-w-2xl mx-auto px-6 py-8 animate-fadeIn" style="animation: fadeIn 1.5s ease;">
            <!-- 结局图标 -->
            <div class="text-7xl mb-6 animate-bounceSlow" style="animation: float 3s ease-in-out infinite;">
                ${ending.icon}
            </div>
            
            <!-- 结局标题 -->
            <h1 class="text-5xl font-bold ${ending.color} mb-4 text-glow"
                style="text-shadow: 0 0 30px currentColor, 0 0 60px currentColor;">
                ${ending.title}
            </h1>
            
            <!-- 星级评价 -->
            <div class="text-2xl mb-4">
                ${stars}
            </div>
            
            <!-- 结局描述 -->
            <div class="bg-gray-900/70 ${ending.borderColor} border-2 rounded-xl p-6 mb-6 max-w-lg mx-auto"
                 style="box-shadow: 0 0 40px rgba(255,255,255,0.05);">
                <p class="text-gray-200 leading-relaxed whitespace-pre-line text-lg">
                    ${ending.description}
                </p>
            </div>
            
            <!-- 结局统计 -->
            <div class="flex justify-center gap-6 mb-8 text-sm">
                <div class="text-center">
                    <div class="text-yellow-400 text-xl font-bold">${ending.stats ? ending.stats.endingPower : 0}</div>
                    <div class="text-gray-500">战力评价</div>
                </div>
                <div class="text-center">
                    <div class="text-purple-400 text-xl font-bold">${ending.stats ? ending.stats.endingFame : 0}</div>
                    <div class="text-gray-500">声望评价</div>
                </div>
                <div class="text-center">
                    <div class="text-green-400 text-xl font-bold">${ending.stats ? ending.stats.endingKarma : 0}</div>
                    <div class="text-gray-500">因果评价</div>
                </div>
            </div>
            
            <!-- 继续游戏按钮 -->
            <div class="flex flex-col items-center gap-3">
                <button onclick="this.closest('.fixed').remove(); window.showMessage('继续你的修仙之旅…', 'info');"
                    class="px-8 py-3 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500
                           text-white font-bold rounded-xl text-lg transition-all duration-300 transform hover:scale-105"
                    style="box-shadow: 0 4px 20px rgba(234,179,8,0.3);">
                    📖 继续游戏
                </button>
                <p class="text-gray-500 text-xs">结局已保存，你可以继续探索这个世界</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 添加动画关键帧
    if (!document.getElementById('ending-anim-style')) {
        var style = document.createElement('style');
        style.id = 'ending-anim-style';
        style.textContent = `
            @keyframes fadeIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        `;
        document.head.appendChild(style);
    }
}

// 在主线最后一环交付时触发结局
function turnInQuest(questId) {
    var quest = findQuestById(questId);
    if (!quest) {
        showMessage('任务不存在', 'error');
        return false;
    }
    
    if (!quest.completed) {
        showMessage('任务尚未完成，无法交付', 'warning');
        return false;
    }
    
    // 发放奖励：只有完整结算成功后才允许任务进入“已交付”。
    // 这避免背包已满/事务失败时出现“任务消失但奖励没拿全”的半结算状态。
    var rewardResult = giveQuestRewards(quest);
    if (!rewardResult || rewardResult.success === false) {
        var reasonMap = {
            spiritStones: '灵石不足',
            copper: '铜钱不足',
            inventory_full_or_invalid_item: '背包空间不足或奖励物品无效',
            qi: '真气不足',
            energy: '精力不足',
            health: '生命不足',
            no_character: '角色状态未初始化',
            transaction_unavailable: '经济事务模块未加载'
        };
        var reason = rewardResult && (rewardResult.reason || rewardResult.error);
        showMessage('奖励结算失败：' + (reasonMap[reason] || '资源或背包状态异常') + '。任务仍保留，可处理后再次交付。', 'error');
        return false;
    }
    
    quest.turnedIn = true;
    quest.accepted = false;
    
    // 从活跃任务中移除
    var index = playerQuestProgress.activeQuests.indexOf(questId);
    if (index > -1) {
        playerQuestProgress.activeQuests.splice(index, 1);
    }
    
    // 添加到已完成列表
    if (!playerQuestProgress.completedQuests.includes(questId)) {
        playerQuestProgress.completedQuests.push(questId);
    }
    
    playerQuestProgress.totalCompleted++;
    saveQuestProgress();

    // F-1.2 重构：补全 quest:completed 事件 emit。quest-system.js 事件桥监听此事件推进 complete_quests objective
    if (window.EventBus && typeof window.EventBus.emit === 'function') {
        try { window.EventBus.emit('quest:completed', { questId: questId, questType: quest.type }); } catch (e) {}
    }
    
    // v12.4：交付后移除该任务的 🎯 目标标记，并重绘剩余活跃任务标记
    if (typeof window.removeQuestTargetMarkers === 'function') {
        try { window.removeQuestTargetMarkers(questId); } catch (e) {}
    }
    if (typeof window.syncQuestTargetMarkers === 'function') {
        try { window.syncQuestTargetMarkers(); } catch (e) {}
    }
    
    showMessage('交付任务：' + quest.title + '，获得奖励！', 'success');
    updateQuestUI();
    // BUG-12 修复：交付后主线/日常列表也要立即刷新
    updateMainQuestUI();
    updateDailyQuestUI();
    
    // 检查是否是主线最后一环（main_035），触发结局
    if (questId === 'main_035') {
        setTimeout(function() {
            var ending = checkEndingCondition();
            if (ending) {
                showEndingScreen(ending);
            }
        }, 500);
    }
    
    return true;
}

// ============ 发放任务奖励（v6.0 增强版） ============
function giveQuestRewards(quest) {
    if (!quest || !quest.rewards) return { success: true, messages: [] };
    if (!window.RewardService || typeof window.RewardService.apply !== 'function') {
        return { success: false, reason: 'reward_service_unavailable', messages: [] };
    }

    var rewards = quest.rewards;
    var city = (quest.city || quest.location ||
        (window.locationSystem && window.locationSystem.getCurrentLocation && window.locationSystem.getCurrentLocation()) ||
        (window.currentCharData && window.currentCharData.location) || '');

    // 任务本体奖励统一交给 RewardService。货币与物品会在同一 EconomyTransaction 中结算，
    // 任一奖励无法发放时整体回滚，避免“灵石到了、物品没到”的半奖励。
    var result = window.RewardService.apply({
        exp: rewards.exp,
        spiritStones: rewards.spiritStones,
        copper: rewards.copper != null ? rewards.copper : rewards.gold,
        items: rewards.items,
        affection: rewards.affection,
        contribution: rewards.contribution,
        qiRecovery: rewards.qiRecovery,
        energy: rewards.energy,
        health: rewards.health,
        notoriety: rewards.notoriety
    }, {
        source: 'quest:' + (quest.id || 'unknown'),
        city: city,
        npcId: quest.npcId || null
    });

    if (!result || result.success === false) return result || { success: false, reason: 'unknown' };

    // 城市任务声望是任务系统的固定附加收益，继续使用原难度公式；
    // 但只在主体奖励事务成功后发放，且明确进入“城市声望”而非角色名气。
    if (city && typeof window.addReputationFromQuest === 'function') {
        var diff = Number(quest.difficulty || (quest.type === 'main' ? 3 : 1)) || 1;
        var gained = Number(window.addReputationFromQuest(city, diff)) || 0;
        if (gained) result.messages.push(city + '声望+' + gained);
    }

    if (result.messages && result.messages.length > 0) {
        var msg = '任务完成！获得：\n' + result.messages.join('\n');
        if (typeof window.showMessage === 'function') window.showMessage(msg, 'success');
        else if (typeof alert === 'function') alert(msg);
    }
    return result;
}

// ============ 查找任务 ============
function findQuestById(questId) {
    // 使用统一注册表查找
    return QuestRegistry.get(questId);
}

// ============ 更新任务目标进度 ============

// P1：通过事件总线广播击杀信息，让任务系统自行订阅处理
function notifyQuestKill(enemy) {
    try {
        // 发射标准事件：enemy:defeated
        if (typeof window.EventBus !== 'undefined') {
            window.EventBus.emit('enemy:defeated', {
                enemyId: enemy.id,
                enemyType: enemy.type,
                species: enemy.species || enemy.name,
                tags: enemy.tags || [],
                locationId: enemy.locationId
            });
        } else {
            // 降级方案：直接更新任务（旧兼容）
            var list = (playerQuestProgress && playerQuestProgress.activeQuests) || [];
            list.forEach(function(qid) {
                updateQuestObjective(qid, 'kill', { target: enemy });
            });
        }
    } catch (e) {
        console.error('notifyQuestKill error:', e);
    }
}
window.notifyQuestKill = notifyQuestKill;

// v12.1：EventBus 在本文件之前加载，监听器立即注册，禁止再靠 setTimeout 猜加载时机。

function updateQuestObjective(questId, objectiveType, extraData) {
    const quest = findQuestById(questId);
    if (!quest || !quest.accepted) return;
    
    let allCompleted = true;
    
    if (quest.objectives) {
        quest.objectives.forEach(obj => {
            // 检查是否匹配目标类型
            if (obj.type === objectiveType || 
                (objectiveType === 'kill' && obj.type === 'kill') ||
                (objectiveType === 'collect' && obj.type === 'collect')) {
                
                // 检查具体条件
                let match = true;
                if (obj.target && obj.target !== extraData.target) match = false;
                if (obj.item && obj.item !== extraData.item) match = false;
                
                if (match) {
                    // 增加进度
                    obj.currentCount = (obj.currentCount || 0) + (extraData.amount || 1);
                    
                    // 检查是否完成
                    if (obj.currentCount >= obj.count) {
                        obj.completed = true;
                    }
                }
            }
            
            if (!obj.completed) allCompleted = false;
        });
        
        // 检查任务是否全部完成
        if (allCompleted && !quest.completed) {
            quest.completed = true;
            showMessage(`任务完成：${quest.title}！`, 'success');
            if (typeof window.showEffect === 'function') { try { window.showEffect('quest_done'); } catch(e) {} }
            
            // 如果是日常任务，标记为可交付
            if (quest.isDaily) {
                // 日常任务可以立即交付
            }
        }
    }
    
    saveQuestProgress();
    updateQuestUI();
    // BUG-12 修复：任务进度推进（含完成）后主线/日常列表也要刷新
    updateMainQuestUI();
    updateDailyQuestUI();
}

// ============ 获取活跃任务列表 ============
function getActiveQuests() {
    return playerQuestProgress.activeQuests.map(id => findQuestById(id)).filter(q => q);
}

// ============ 获取已完成但未交付的任务 ============
function getCompletedQuests() {
    return playerQuestProgress.completedQuests
        .map(id => findQuestById(id))
        .filter(q => q && q.completed && !q.turnedIn);
}

// ============ 获取主线任务列表 ============
function getMainQuests() {
    return mainQuestChain;
}

// ============ 获取日常任务列表 ============
function getDailyQuests() {
    return dailyQuestPool.filter(q => q.isDaily);
}

// ============ 添加玩家经验 ============
function addPlayerExp(amount) {
    if (!window.currentCharData) return;
    currentCharData.tempering = (currentCharData.tempering || 0) + amount;
    showMessage(`获得 ${amount} 点历练`, 'info');
    updateQuestStatusPanel();
}

// ============ 添加灵石（使用 DataManager 统一接口） ============
function addSpiritStones(amount) {
    if (!window.currentCharData) return;
    const dm = window.XianXia?.DataManager;
    if (dm) {
        dm.addSpiritStones(amount);
    } else {
        currentCharData.spiritStones = (currentCharData.spiritStones || 0) + amount;
    }
    showMessage(`获得 ${amount} 灵石`, 'info');
    updateQuestStatusPanel();
}

// ============ 添加门派贡献 ============
function addSectContribution(amount) {
    if (!window.discipleState) return;
    discipleState.contribution += amount;
    showMessage(`获得 ${amount} 门派贡献`, 'info');
}

// ============ 恢复真气 ============
function restorePlayerQi(amount) {
    if (!window.currentCharData) return;
    currentCharData.qi = Math.min(currentCharData.maxQi || 100, (currentCharData.qi || 0) + amount);
    showMessage(`恢复 ${amount} 点真气`, 'info');
    updateQuestStatusPanel();
}

// ============ 更新任务UI ============
function updateQuestUI() {
    // BUG-10 修复：HTML 任务面板容器是 panel-quests，旧守卫查的 quest-panel（幽灵面板）不存在，
    // 导致 updateQuestUI 永远提前 return，活跃/已完成任务列表从不渲染。
    // 改为：优先 panel-quests，兼容旧 quest-panel。
    const questPanel = document.getElementById('panel-quests') || document.getElementById('quest-panel');
    if (!questPanel) return;
    // B4：CSSStyleDeclaration 无 contains；用 display 判断
    try {
        var disp = (window.getComputedStyle ? getComputedStyle(questPanel).display : questPanel.style.display);
        if (disp === 'none') return;
    } catch (e) {}

    // 更新任务列表显示
    const activeList = document.getElementById('active-quest-list');
    if (activeList) {
        activeList.innerHTML = '';
        const activeQuests = getActiveQuests();
        
        if (activeQuests.length === 0) {
            activeList.innerHTML = '<p class="text-gray-500 text-sm">暂无活跃任务</p>';
        } else {
            activeQuests.forEach(quest => {
                const questItem = createQuestItemElement(quest);
                activeList.appendChild(questItem);
            });
        }
    }
    
    // 更新已完成任务列表
    const completedList = document.getElementById('completed-quest-list');
    if (completedList) {
        completedList.innerHTML = '';
        const completedQuests = getCompletedQuests();
        
        if (completedQuests.length === 0) {
            completedList.innerHTML = '<p class="text-gray-500 text-sm">暂无已完成任务</p>';
        } else {
            completedQuests.forEach(quest => {
                const questItem = createQuestItemElement(quest, true);
                completedList.appendChild(questItem);
            });
        }
    }
}

// ============ 任务追踪系统（v10.0 新增） ============
// 追踪的活跃任务ID列表（最多同时追踪1个主线+2个支线）
var _trackedQuests = [];

function initQuestTracker() {
    var saved = localStorage.getItem('xianxia_tracked_quests');
    if (saved) {
        try { _trackedQuests = JSON.parse(saved); } catch(e) { _trackedQuests = []; }
    }
    // 默认追踪第一个未完成的主线
    if (_trackedQuests.length === 0) {
        var mainQ = mainQuestChain.find(function(q) { return q.accepted && !q.completed; });
        if (mainQ) _trackedQuests.push(mainQ.id);
    }
}

function saveTrackedQuests() {
    localStorage.setItem('xianxia_tracked_quests', JSON.stringify(_trackedQuests));
}

function toggleTrackQuest(questId) {
    var idx = _trackedQuests.indexOf(questId);
    if (idx >= 0) {
        _trackedQuests.splice(idx, 1);
    } else {
        if (_trackedQuests.length >= 3) {
            showMessage('最多同时追踪3个任务（1主线+2支线）', 'warning');
            return;
        }
        _trackedQuests.push(questId);
    }
    saveTrackedQuests();
    updateQuestTracker();
    updateQuestUI();
}

function isQuestTracked(questId) {
    return _trackedQuests.indexOf(questId) >= 0;
}

// ============ 更新任务追踪栏 ============
function updateQuestTracker() {
    var bar = document.getElementById('quest-tracker-bar');
    var content = document.getElementById('quest-tracker-content');
    if (!bar || !content) return;
    
    var tracked = _trackedQuests.filter(function(qid) {
        var q = findQuestById(qid);
        return q && q.accepted && !q.completed;
    });
    
    if (tracked.length === 0) {
        bar.classList.add('hidden');
        return;
    }
    
    bar.classList.remove('hidden');
    content.innerHTML = '';
    
    tracked.forEach(function(qid) {
        var q = findQuestById(qid);
        if (!q) return;
        
        var objHtml = '';
        if (q.objectives) {
            objHtml = q.objectives.map(function(obj) {
                var cur = obj.currentCount || 0;
                var done = obj.completed;
                return '<span class="' + (done ? 'text-green-400' : 'text-yellow-400') + '">'
                    + (done ? '✓' : '○') + ' ' + (obj.location || obj.target || obj.item || '') + ' ' + cur + '/' + obj.count + '</span>';
            }).join(' ');
        }
        
        var el = document.createElement('div');
        el.className = 'bg-gray-800 rounded px-2 py-1 border-l-2 border-yellow-500 flex items-center gap-2';
        el.innerHTML = '<span class="font-bold text-white text-xs">' + q.title + '</span>'
            + '<span class="text-gray-400 text-xs">' + objHtml + '</span>'
            + '<button onclick="toggleTrackQuest(\'' + q.id + '\');" class="text-gray-500 hover:text-red-400 text-xs ml-1">✕</button>';
        content.appendChild(el);
    });
}

// 在接取/完成/交付任务后刷新追踪栏
var _origAcceptQuest = acceptQuest;
acceptQuest = function(questId) {
    var r = _origAcceptQuest(questId);
    if (r && _trackedQuests.length === 0) {
        _trackedQuests.push(questId);
        saveTrackedQuests();
    }
    updateQuestTracker();
    return r;
};

var _origTurnInQuest = turnInQuest;
turnInQuest = function(questId) {
    var r = _origTurnInQuest(questId);
    updateQuestTracker();
    return r;
};

// ============ 创建任务项元素（v10.0 增强：追踪按钮） ============
function createQuestItemElement(quest, isCompleted = false) {
    const div = document.createElement('div');
    div.className = `p-2 rounded mb-2 ${isCompleted ? 'bg-green-900' : 'bg-gray-800'}`;
    
    const priorityColor = quest.priority?.color || 'text-gray-400';
    var isTracked = isQuestTracked(quest.id);
    var trackBtn = quest.accepted && !quest.completed
        ? '<button onclick="toggleTrackQuest(\'' + quest.id + '\'); updateQuestTracker(); updateQuestUI();" class="text-xs px-2 py-1 rounded ' + (isTracked ? 'bg-yellow-600 text-gray-900' : 'bg-gray-600 text-white') + '">' + (isTracked ? '★追踪中' : '☆追踪') + '</button>'
        : '';
    
    div.innerHTML = `
        <div class="flex justify-between items-start">
            <div class="flex-1">
                <p class="text-sm font-bold ${priorityColor}">${quest.title}</p>
                <p class="text-xs text-gray-400 mt-1">${quest.description}</p>
                ${quest.objectives ? `
                    <div class="mt-1 text-xs text-gray-500">
                        ${quest.objectives.map(obj => {
                            const current = obj.currentCount || 0;
                            const status = obj.completed ? 'text-green-400' : 'text-yellow-400';
                            return `<span class="${status}">[${current}/${obj.count}]</span> `;
                        }).join('')}
                    </div>
                ` : ''}
            </div>
            <div class="flex items-center gap-1">
                ${trackBtn}
                ${isCompleted ? `
                    <button onclick="turnInQuest('${quest.id}')" class="text-xs bg-green-600 hover:bg-green-700 px-2 py-1 rounded">
                        交付
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    return div;
}

// ============ 显示任务面板 ============
// 主任务页由仙侠.html 的 #panel-quests 唯一拥有；不再动态创建第二套任务日志。
function showQuestPanel() {
    // 清理 v12.1 旧版运行时可能遗留的幽灵面板。
    var legacy = document.getElementById('quest-panel');
    if (legacy && legacy.parentNode) legacy.parentNode.removeChild(legacy);

    if (typeof window.switchPanel === 'function') {
        window.switchPanel('quests');
    } else {
        var panel = document.getElementById('panel-quests');
        if (panel) panel.classList.remove('hidden');
    }
    updateQuestUI();
    updateMainQuestUI();
    updateDailyQuestUI();
    updateRandomQuestUI();
    updateNpcQuestUI();
    return document.getElementById('panel-quests');
}

// ============ 更新主线任务UI ============
function updateMainQuestUI() {
    const list = document.getElementById('main-quest-list');
    if (!list) return;
    
    list.innerHTML = '';
    
    mainQuestChain.forEach(quest => {
        const questItem = document.createElement('div');
        questItem.className = 'p-3 bg-gray-800 rounded mb-3';
        
        const statusText = quest.completed ? '<span class="text-green-400">已完成</span>' :
                          quest.accepted ? '<span class="text-yellow-400">进行中</span>' :
                          '<span class="text-gray-400">未接取</span>';
        
        const acceptBtn = !quest.accepted ? `
            <button onclick="acceptQuest('${quest.id}')" class="text-xs bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded">
                接取
            </button>
        ` : '';
        
        questItem.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <p class="font-bold text-yellow-400">${quest.title}</p>
                    <p class="text-sm text-gray-400 mt-1">${quest.description}</p>
                    <p class="text-xs text-gray-500 mt-1">状态：${statusText}</p>
                </div>
                ${acceptBtn}
            </div>
        `;
        
        list.appendChild(questItem);
    });
}

// ============ 更新日常任务UI ============
function updateDailyQuestUI() {
    const list = document.getElementById('daily-quest-list');
    if (!list) return;
    
    list.innerHTML = '';
    
    dailyQuestPool.forEach(quest => {
        const questItem = document.createElement('div');
        questItem.className = 'p-3 bg-gray-800 rounded mb-3';
        
        const statusText = quest.completed ? '<span class="text-green-400">已完成</span>' :
                          quest.accepted ? '<span class="text-yellow-400">进行中</span>' :
                          '<span class="text-gray-400">未接取</span>';
        
        const acceptBtn = !quest.accepted ? `
            <button onclick="acceptQuest('${quest.id}')" class="text-xs bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded">
                接取
            </button>
        ` : '';
        
        questItem.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <p class="font-bold text-blue-400">${quest.title}</p>
                    <p class="text-sm text-gray-400 mt-1">${quest.description}</p>
                    <p class="text-xs text-gray-500 mt-1">状态：${statusText}</p>
                </div>
                ${acceptBtn}
            </div>
        `;

        list.appendChild(questItem);
    });
}

// ============ v20.53 布告委托 / 故人心事 ============
// 此前 20 条布告委托、22 条 NPC 心事只注册进了任务注册表，任何界面都不渲染——
// 玩家一辈子见不着，等于写完就扔。此处把两条通道都接上任务页。
function updateRandomQuestUI() {
    const list = document.getElementById('random-quest-list');
    if (!list) return;
    list.innerHTML = '';
    const randoms = (window.allQuests || []).filter(q => q && q.type === 'random');
    if (!randoms.length) {
        list.innerHTML = '<p class="text-gray-500 text-sm">布告栏空着。</p>';
        return;
    }
    randoms.forEach(quest => {
        const item = document.createElement('div');
        item.className = 'p-3 bg-gray-800 rounded mb-2';
        const prio = quest.priority || {};
        const statusText = quest.completed ? '<span class="text-green-400">已完成</span>'
            : quest.accepted ? '<span class="text-yellow-400">进行中</span>'
            : `<span class="${prio.color || 'text-gray-400'}">${prio.name || '普通'}</span>`;
        const rewardText = [];
        if (quest.rewards) {
            if (quest.rewards.spiritStones) rewardText.push('灵石 ' + quest.rewards.spiritStones);
            if (quest.rewards.exp) rewardText.push('历练 ' + quest.rewards.exp);
            if (quest.rewards.items && quest.rewards.items.length) {
                quest.rewards.items.forEach(it => {
                    const t = (window.itemById && window.itemById[it.itemId]) || {};
                    rewardText.push((t.name || it.itemId) + ' x' + (it.count || 1));
                });
            }
        }
        item.innerHTML = `
            <div class="flex justify-between items-start gap-2">
                <div>
                    <p class="font-bold text-amber-300">${quest.title}</p>
                    <p class="text-sm text-gray-400 mt-1">${quest.description}</p>
                    <p class="text-xs text-gray-500 mt-1">赏格：${rewardText.join('、') || '—'}</p>
                    <p class="text-xs text-gray-500 mt-1">状态：${statusText}</p>
                </div>
                ${!quest.accepted && !quest.completed ? `<button onclick="acceptQuest('${quest.id}')" class="text-xs bg-amber-600 hover:bg-amber-500 px-3 py-1 rounded shrink-0">接下</button>` : ''}
            </div>`;
        list.appendChild(item);
    });
}

// 故人心事：交情没到的不显示（人物心里没把你当自己人，自然不会托付）
function updateNpcQuestUI() {
    const list = document.getElementById('npc-quest-list');
    if (!list) return;
    list.innerHTML = '';
    const npcQuests = (window.allQuests || []).filter(q => q && q.type === 'npc_story');
    if (!npcQuests.length) {
        list.innerHTML = '<p class="text-gray-500 text-sm">暂时没有故人托付心事。</p>';
        return;
    }
    const rel = (window.npcSystem && typeof window.npcSystem.getNPCRelationship === 'function')
        ? window.npcSystem.getNPCRelationship : null;
    const getAff = function (npcId) {
        if (rel) { try { const r = rel(npcId); if (r && r.affection != null) return Number(r.affection) || 0; } catch (e) {} }
        const nps = window.npcSystem && window.npcSystem.npcs;
        if (nps && nps[npcId]) return Number(nps[npcId].affection) || 0;
        return 0;
    };
    let shown = 0;
    npcQuests.forEach(quest => {
        const aff = getAff(quest.npcId);
        if (quest.minAffection && aff < quest.minAffection) return;
        shown++;
        const item = document.createElement('div');
        item.className = 'p-3 bg-gray-800 rounded mb-2';
        const statusText = quest.completed ? '<span class="text-green-400">已了结</span>'
            : quest.accepted ? '<span class="text-yellow-400">记挂在心</span>' : '<span class="text-pink-400">有话想说</span>';
        item.innerHTML = `
            <div class="flex justify-between items-start gap-2">
                <div>
                    <p class="font-bold text-pink-300">${quest.title}</p>
                    <p class="text-sm text-gray-400 mt-1">${quest.description}</p>
                    <p class="text-xs text-gray-500 mt-1">交情 ${aff}/${quest.minAffection || 0} · ${statusText}</p>
                </div>
                ${!quest.accepted && !quest.completed ? `<button onclick="acceptQuest('${quest.id}')" class="text-xs bg-pink-700 hover:bg-pink-600 px-3 py-1 rounded shrink-0">细听</button>` : ''}
            </div>`;
        list.appendChild(item);
    });
    if (!shown) list.innerHTML = '<p class="text-gray-500 text-sm">交情还不够，没人肯把心事托给你。</p>';
}

// ============ 显示消息 ============
// 已由 global-utils.js 在第0层设置 window.showMessage，此处不再重复声明
// 所有调用直接使用 window.showMessage()

// ============ 更新状态面板 ============
function updateQuestStatusPanel() {
    if (window.updateCharacterStatus) {
        window.updateCharacterStatus();
    }
}

// ============ 导出到全局 ============
window.questSystem = {
    initQuestSystem,
    updateRandomQuestUI,
    updateNpcQuestUI,
    saveQuestProgress,
    acceptQuest,
    turnInQuest,
    updateQuestObjective,
    getActiveQuests,
    getCompletedQuests,
    getMainQuests,
    getDailyQuests,
    findQuestById,
    showQuestPanel,
    updateQuestUI,
    QUEST_TYPES,
    QUEST_STATUSES,
    QUEST_PRIORITIES,
    showStoryDialogue,
    acceptQuestWithStory,
    turnInQuestWithStory
};
window.showStoryDialogue = showStoryDialogue;
window.acceptQuestWithStory = acceptQuestWithStory;
window.turnInQuestWithStory = turnInQuestWithStory;
window.GAME_ENDINGS = GAME_ENDINGS;
window.checkEndingCondition = checkEndingCondition;
window.selectEnding = selectEnding;
window.showEndingScreen = showEndingScreen;
// v10.0 任务追踪导出
window.initQuestTracker = initQuestTracker;
window.toggleTrackQuest = toggleTrackQuest;
window.isQuestTracked = isQuestTracked;
window.updateQuestTracker = updateQuestTracker;

// v12.1：任务追踪状态进入统一存档。
if (window.StateRegistry) {
    window.StateRegistry.register('questTracker', {
        version: 1,
        export: function() { return _trackedQuests.slice(); },
        import: function(data) {
            _trackedQuests = Array.isArray(data) ? data.slice(0, 3) : [];
            try { updateQuestTracker(); } catch (e) {}
        },
        reset: function() { _trackedQuests = []; try { updateQuestTracker(); } catch (e) {} }
    });
}


// ==================== v12.1：任务目标统一事件桥 ====================
function questEventText(value) {
    if (value == null) return '';
    if (typeof value === 'object') return [value.id, value.name, value.type, value.species].filter(Boolean).join(' ');
    return String(value);
}

function questObjectiveMatches(obj, eventType, data) {
    data = data || {};
    if (!obj) return false;
    // F-1.2 重构：完整事件→objective 匹配。
    // 之前只处理 enemy:defeated / item:obtained / item:crafted / npc:talked / location:visited /
    // dungeon:completed / arena:won / escort:completed / cultivation:completed，9 种；
    // 缺：join_sect / breakthrough_realm / cultivation_realm / reputation / complete_quests / talk_to_npc / cultivate。
    // 现在 13 类事件全有匹配，桥也全有监听。
    if (eventType === 'enemy:defeated') {
        if (obj.type !== 'kill' && obj.type !== 'combat') return false;
        var target = questEventText(obj.target || obj.enemyId || obj.enemyType).toLowerCase();
        if (!target) return true;
        var actual = [data.enemyId, data.enemyType, data.species, data.name].concat(data.tags || []).filter(Boolean).join(' ').toLowerCase();
        return actual.indexOf(target) >= 0 || target.indexOf(actual) >= 0;
    }
    if (eventType === 'item:obtained') {
        return obj.type === 'collect' && (!obj.item || obj.item === data.itemId || obj.item === data.name);
    }
    if (eventType === 'item:crafted') {
        return obj.type === 'craft' && (!obj.item || obj.item === data.itemId || obj.item === data.name);
    }
    if (eventType === 'npc:talked') {
        // 同时匹配 talk / talk_to_npc
        if (obj.type !== 'talk' && obj.type !== 'talk_to_npc') return false;
        return !obj.npcId && !obj.npcName || obj.npcId === data.npcId || obj.npcName === data.npcName;
    }
    if (eventType === 'location:visited') {
        if (obj.type !== 'visit') return false;
        // v20.53：支持"到某片地域"的前缀匹配（如 location:'灵界' 命中 '灵界·蓬莱仙境'），
        // 否则主线里指向整片地域的目标永远对不上具体地点名。
        var _prefixHit = obj.location && data.locationName && data.locationName.indexOf(obj.location) === 0;
        return !obj.locationId && !obj.locationName && !obj.location || obj.locationId === data.locationId || obj.locationName === data.locationName || obj.location === data.locationName || _prefixHit;
    }
    if (eventType === 'dungeon:completed') {
        return (obj.type === 'explore' || obj.type === 'explore_dungeon') && (!obj.dungeonId && !obj.dungeon || obj.dungeonId === data.dungeonId || obj.dungeon === data.dungeonId || obj.dungeon === data.dungeonName);
    }
    if (eventType === 'arena:won') return obj.type === 'arenaWin' || obj.type === 'arena_win';
    if (eventType === 'sparring') return obj.type === 'sparring';
    if (eventType === 'escort:completed') return obj.type === 'escort';
    if (eventType === 'cultivation:completed') return obj.type === 'meditate' || obj.type === 'practice' || obj.type === 'cultivate';
    if (eventType === 'cultivation:breakthrough') {
        if (obj.type === 'breakthrough_realm') {
            if (obj.fromRealm && obj.fromRealm !== data.fromRealm) return false;
            if (obj.toRealm && obj.toRealm !== data.toRealm) return false;
            return true;
        }
        if (obj.type === 'cultivation_realm') {
            if (obj.realm && obj.realm !== data.toRealm) return false;
            if (obj.layer != null && Number(obj.layer) !== Number(data.toLayer)) return false;
            return true;
        }
        return false;
    }
    if (eventType === 'sect:joined') {
        if (obj.type !== 'join_sect') return false;
        return !obj.sectId || obj.sectId === data.sectId;
    }
    if (eventType === 'reputation:changed') {
        if (obj.type !== 'reputation') return false;
        if (obj.city && obj.city !== data.cityName) return false;
        return true;
    }
    if (eventType === 'quest:completed') {
        return obj.type === 'complete_quests';
    }
    return false;
}

function advanceQuestObjectivesFromEvent(eventType, eventData) {
    if (!playerQuestProgress || !Array.isArray(playerQuestProgress.activeQuests)) return;
    var amount = Math.max(1, Math.floor(Number(eventData && (eventData.count || eventData.amount)) || 1));
    var changed = false;
    playerQuestProgress.activeQuests.forEach(function(qid) {
        var quest = findQuestById(qid);
        if (!quest || !Array.isArray(quest.objectives)) return;
        quest.objectives.forEach(function(obj) {
            if (obj.completed || !questObjectiveMatches(obj, eventType, eventData)) return;
            var need = Math.max(1, Number(obj.count) || 1);
            obj.currentCount = Math.min(need, (Number(obj.currentCount) || 0) + amount);
            obj.completed = obj.currentCount >= need;
            changed = true;
        });
    });
    if (changed) {
        saveQuestProgress();
        updateQuestUI();
        // BUG-12 修复：事件推进任务进度后主线/日常列表也要刷新
        updateMainQuestUI();
        updateDailyQuestUI();
        try { updateQuestTracker(); } catch (e) {}
    }
}

function registerQuestEventBridge() {
    if (!window.EventBus || typeof window.EventBus.on !== 'function') return false;
    // F-1.2 重构：完整事件桥。
    // 之前只听 9 类事件，且 location:visited / npc:talked / dungeon:completed 全工程无任何 emit，
    // breakthrough-system.js emit 的是 cultivation:breakthrough 而桥听 cultivation:completed（错位），
    // join_sect 完全没有事件。
    // 重构后：所有相关系统（location-system/npc-system/app/reputation-system/quest 自身）在操作成功时 emit，
    // 桥统一监听 + questObjectiveMatches 统一匹配。
    var types = [
        'enemy:defeated',     // 战斗
        'item:obtained',      // 拾取
        'item:crafted',       // 合成
        'npc:talked',         // 与NPC对话（npc-system.js showNPCDialog 已 emit）
        'location:visited',   // 抵达城市（location-system.js enterCity 已 emit）
        'dungeon:completed',  // 秘境通关（app.js dungeon 通关点已 emit）
        'arena:won',          // 竞技场胜
        'escort:completed',   // 护送
        'cultivation:completed',
        'cultivation:breakthrough', // 突破（breakthrough-system.js emit 的事件名）
        'sect:joined',        // 加入门派（sects-system.js joinSect 已 emit）
        'reputation:changed', // 声望变化（reputation-system.js addReputation 已 emit）
        'quest:completed'     // 任务交付（quest-system.js turnInQuest 自身 emit）
    ];
    types.forEach(function(type) {
        window.EventBus.on(type, function(data) { advanceQuestObjectivesFromEvent(type, data); });
    });
    return true;
}

registerQuestEventBridge();
window.advanceQuestObjectivesFromEvent = advanceQuestObjectivesFromEvent;

// F-11 重构：trackedQuests 注册到 StateRegistry，由 StateRegistry.exportAll/importAll 接管存档
// 之前用 localStorage('xianxia_tracked_quests')，game-state.js collect 不收 → 读档清零
if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
    window.StateRegistry.register('trackedQuests', {
        version: 1,
        export: function() { return JSON.parse(JSON.stringify(_trackedQuests || [])); },
        import: function(data) {
            if (!Array.isArray(data)) return;
            _trackedQuests.length = 0;
            _trackedQuests.push.apply(_trackedQuests, data);
            window._trackedQuests = _trackedQuests;
        },
        reset: function() {
            _trackedQuests.length = 0;
            window._trackedQuests = _trackedQuests;
        }
    });
}

