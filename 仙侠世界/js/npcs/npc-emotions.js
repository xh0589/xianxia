// ==================== npc-emotions.js - NPC情绪状态系统 ====================
// 扩展NPC已有的mood/stress系统，让情绪影响行为、外观、对话
// 依赖：npcs/npc-system.js (NPC类, showNPCDialog)
// 加载顺序：在 npc-system.js 之后, npc-milestones.js 之前

// ============ 情绪状态定义 ============
const EMOTION_STATES = {
    ecstatic: {
        id: 'ecstatic',
        name: '狂喜',
        moodRange: [90, 100],
        icon: '🤩',
        color: 'text-pink-400',
        bgColor: 'bg-pink-900/30',
        behavior: '主动送礼/分享喜悦',
        dialogueModifier: '（喜形于色）',
        actions: ['give_gift', 'initiate_talk', 'share_joy', 'offer_help'],
        description: 'NPC心情极佳，可能会主动送礼或分享喜悦'
    },
    happy: {
        id: 'happy',
        name: '高兴',
        moodRange: [65, 89],
        icon: '😊',
        color: 'text-green-400',
        bgColor: 'bg-green-900/30',
        behavior: '主动交谈/提供帮助',
        dialogueModifier: '（愉悦）',
        actions: ['initiate_talk', 'offer_help', 'share_news'],
        description: 'NPC心情不错，愿意主动交谈或提供帮助'
    },
    neutral: {
        id: 'neutral',
        name: '平静',
        moodRange: [40, 64],
        icon: '😐',
        color: 'text-gray-400',
        bgColor: 'bg-gray-800/30',
        behavior: '正常互动',
        dialogueModifier: '',
        actions: [],
        description: 'NPC情绪平稳，正常互动'
    },
    sad: {
        id: 'sad',
        name: '低落',
        moodRange: [20, 39],
        icon: '😔',
        color: 'text-blue-400',
        bgColor: 'bg-blue-900/30',
        behavior: '不愿多谈/寻求安慰',
        dialogueModifier: '（低落）',
        actions: ['avoid_talk', 'seek_comfort', 'complain'],
        description: 'NPC情绪低落，不愿多谈，可能寻求安慰'
    },
    angry: {
        id: 'angry',
        name: '愤怒',
        moodRange: [0, 19],
        icon: '😠',
        color: 'text-red-500',
        bgColor: 'bg-red-900/30',
        behavior: '拒绝对话/主动攻击',
        dialogueModifier: '（愤怒）',
        actions: ['refuse_talk', 'threaten', 'attack'],
        description: 'NPC情绪愤怒，可能拒绝对话甚至攻击'
    }
};

// 情绪影响对话前缀
const EMOTION_DIALOGUE_PREFIXES = {
    ecstatic: ['哈哈！', '太开心了！', '今天真是个好日子！'],
    happy: ['嗯，心情不错。', '今天状态很好。', '看到你很高兴。'],
    neutral: ['你好。', '嗯。', '有什么事？'],
    sad: ['唉……', '没什么。', '……'],
    angry: ['哼！', '走开！', '别烦我！']
};

// 情绪触发行为定义
const EMOTION_ACTIONS = {
    give_gift: {
        name: '主动送礼',
        icon: '🎁',
        check: function(npc) { return npc.state.mood >= 65; },
        execute: function(npc, player) {
            const gifts = ['pill_small_recovery', 'mat_lingzhi', 'spec_spirit_stone'];
            const gift = gifts[Math.floor(Math.random() * gifts.length)];
            const giftName = window.itemById?.[gift]?.name || '小礼物';
            if (typeof window.addItemToInventory === 'function') {
                window.addItemToInventory(gift, 1);
                if (window.showMessage) {
                    window.showMessage(`🎁 ${npc.name}心情很好，送了${giftName}给你！`, 'success');
                }
                npc.recordPlayerAction('received_gift', 'positive');
                return true;
            }
            return false;
        }
    },
    initiate_talk: {
        name: '主动交谈',
        icon: '💬',
        check: function(npc) { return npc.state.mood >= 50; },
        execute: function(npc, player) {
            if (window.showMessage) {
                const messages = [
                    `${npc.name}主动走过来和你打招呼。`,
                    `${npc.name}笑着对你说：「今天天气真好。」`,
                    `${npc.name}想和你聊聊天。`
                ];
                window.showMessage(messages[Math.floor(Math.random() * messages.length)], 'info');
            }
            npc.recordPlayerAction('npc_initiated_talk', 'positive');
            return true;
        }
    },
    seek_comfort: {
        name: '寻求安慰',
        icon: '🤗',
        check: function(npc) { return npc.state.mood < 40 && npc.state.mood >= 20; },
        execute: function(npc, player) {
            if (window.showMessage) {
                window.showMessage(`${npc.name}看起来心情不太好，似乎需要安慰。`, 'info');
            }
            // 提供安慰选项
            if (typeof window.showNPCDialog === 'function') {
                // 触发NPC对话，显示安慰选项
                window.showNPCDialog(npc.id);
            }
            return true;
        }
    },
    refuse_talk: {
        name: '拒绝对话',
        icon: '🚫',
        check: function(npc) { return npc.state.mood < 20; },
        execute: function(npc, player) {
            if (window.showMessage) {
                const messages = [
                    `${npc.name}怒气冲冲地说：「别烦我！」`,
                    `${npc.name}冷冷地看了你一眼，转身就走。`,
                    `${npc.name}不耐烦地摆摆手：「走开！」`
                ];
                window.showMessage(messages[Math.floor(Math.random() * messages.length)], 'warning');
            }
            return true;
        }
    }
};

// ============ 获取情绪状态 ============
function getEmotionState(mood) {
    mood = Math.max(0, Math.min(100, mood));
    for (const key in EMOTION_STATES) {
        const state = EMOTION_STATES[key];
        if (mood >= state.moodRange[0] && mood <= state.moodRange[1]) {
            return state;
        }
    }
    return EMOTION_STATES.neutral;
}

// ============ 获取情绪对话前缀 ============
function getEmotionDialoguePrefix(npc) {
    const mood = npc.state?.mood || 50;
    const emotion = getEmotionState(mood);
    const prefixes = EMOTION_DIALOGUE_PREFIXES[emotion.id];
    if (prefixes && prefixes.length > 0) {
        return prefixes[Math.floor(Math.random() * prefixes.length)];
    }
    return '';
}

// ============ 通用社交条件检查工具 ============
// 所有社交互动共用的前置条件检查
function checkSocialConditions(npc, actionName, options) {
    options = options || {};
    var energyCost = options.energyCost || 10;
    var minMood = options.minMood != null ? options.minMood : 0;
    var maxMood = options.maxMood != null ? options.maxMood : 100;
    var requireSameLocation = options.requireSameLocation !== false; // 默认检查同地点
    var cooldownKey = options.cooldownKey || ('social_cd_' + actionName);

    if (!npc) {
        if (window.showMessage) window.showMessage('NPC不存在', 'error');
        return { pass: false, msg: 'NPC不存在' };
    }

    // 1. 同地点检查
    if (requireSameLocation) {
        var playerLoc = window.currentCharData?.location || '';
        var npcLoc = npc.location || '';
        if (playerLoc && npcLoc && playerLoc !== npcLoc) {
            if (window.showMessage) window.showMessage(npc.name + '不在你当前所在的地方，无法' + actionName + '。', 'warning');
            return { pass: false, msg: '不在同地点' };
        }
    }

    // 2. NPC状态检查（情绪是否允许互动）
    var mood = npc.state?.mood || 50;
    if (mood < minMood || mood > maxMood) {
        if (window.showMessage) window.showMessage(npc.name + '当前状态不适合' + actionName + '。', 'warning');
        return { pass: false, msg: 'NPC状态不满足' };
    }

    // 3. 精力检查
    var charData = window.currentCharData;
    if (charData && (charData.energy ?? 100) < energyCost) {
        if (window.showMessage) window.showMessage('精力不足（需要' + energyCost + '精力），无法' + actionName + '。', 'warning');
        return { pass: false, msg: '精力不足' };
    }

    // 4. 每日次数限制（每个动作每天最多3次）
    if (!window._socialDailyCounts) window._socialDailyCounts = {};
    var currentDay = window.timeSystem?.gameTime?.currentDay || 0;
    var dailyKey = 'daily_' + actionName + '_' + (npc ? npc.id : 'all') + '_' + currentDay;
    if (!window._socialDailyCounts[dailyKey]) window._socialDailyCounts[dailyKey] = 0;
    var dailyLimit = window.BALANCE_CONFIG?.social?.dailyLimitPerNpcAction ?? 3;
    if (window._socialDailyCounts[dailyKey] >= dailyLimit) {
        if (window.showMessage) window.showMessage('你今天已经做了太多次' + actionName + '，让' + npc.name + '休息一下吧。', 'warning');
        return { pass: false, msg: '每日次数已达上限' };
    }

    // 5. 冷却检查（同一动作对同一NPC的冷却）
    if (!window._socialCooldowns) window._socialCooldowns = {};
    var cdKey = cooldownKey + '_' + npc.id;
    var lastTime = window._socialCooldowns[cdKey] || 0;
    var currentTime = window.timeSystem?.gameTime?.totalMinutes || 0;
    var cooldownMinutes = options.cooldownMinutes || 30; // 默认30分钟冷却
    if (lastTime > 0 && currentTime - lastTime < cooldownMinutes) {
        var remaining = Math.ceil((cooldownMinutes - (currentTime - lastTime)) / 10) * 10;
        if (window.showMessage) window.showMessage(actionName + '还需要冷却' + remaining + '分钟。', 'warning');
        return { pass: false, msg: '冷却中' };
    }

    return { pass: true };
}

// 记录社交消耗（精力、冷却、每日计数）
function applySocialCosts(npc, actionName, energyCost, cooldownMinutes) {
    cooldownMinutes = cooldownMinutes || window.BALANCE_CONFIG?.social?.defaultCooldownMinutes || 30;

    // 消耗精力
    var charData = window.currentCharData;
    if (charData) {
        charData.energy = Math.max(0, (charData.energy ?? (window.BALANCE_CONFIG?.social?.defaultEnergy ?? 100)) - energyCost);
    }

    // 记录冷却
    if (!window._socialCooldowns) window._socialCooldowns = {};
    var cdKey = 'social_cd_' + actionName + '_' + npc.id;
    window._socialCooldowns[cdKey] = window.timeSystem?.gameTime?.totalMinutes || 0;

    // 记录每日次数
    if (!window._socialDailyCounts) window._socialDailyCounts = {};
    var currentDay = window.timeSystem?.gameTime?.currentDay || 0;
    var dailyKey = 'daily_' + actionName + '_' + (npc ? npc.id : 'all') + '_' + currentDay;
    if (!window._socialDailyCounts[dailyKey]) window._socialDailyCounts[dailyKey] = 0;
    window._socialDailyCounts[dailyKey]++;

    // 推进时间
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(cooldownMinutes, actionName + 'NPC');
    }
}

// ============ 社交冷却/次数存档 ====================
// P1-11: 将 _socialCooldowns / _socialDailyCounts 纳入规范存档系统
function exportSocialCooldowns() {
    return {
        cooldowns: window._socialCooldowns ? JSON.parse(JSON.stringify(window._socialCooldowns)) : {},
        dailyCounts: window._socialDailyCounts ? JSON.parse(JSON.stringify(window._socialDailyCounts)) : {}
    };
}
function importSocialCooldowns(data) {
    if (!data) return;
    window._socialCooldowns = data.cooldowns || {};
    window._socialDailyCounts = data.dailyCounts || {};
}
if (typeof window !== 'undefined') {
    window.exportSocialCooldowns = exportSocialCooldowns;
    window.importSocialCooldowns = importSocialCooldowns;
}

// ============ 玩家情绪干预（P1-2: 增加条件限制） ============
function comfortNPC(npcId) {
    var npc = window.npcManager?.getNPC(npcId);
    var check = checkSocialConditions(npc, '安慰', {
        energyCost: 10,
        minMood: 0, maxMood: 80,  // 情绪太高不需要安慰
        cooldownMinutes: 15
    });
    if (!check.pass) return;

    var oldMood = npc.state.mood || 50;
    npc.state.mood = Math.min(100, oldMood + 8);
    npc.state.stress = Math.max(0, (npc.state.stress || 0) - 5);
    npc.recordPlayerAction('comfort', 'positive');

    applySocialCosts(npc, '安慰', 10, 15);

    if (window.showMessage) {
        var emotion = getEmotionState(oldMood);
        if (emotion.id === 'sad' || emotion.id === 'angry') {
            window.showMessage('你安慰了' + npc.name + '，TA的心情似乎好了一些。', 'success');
        } else {
            window.showMessage(npc.name + '感到你的关心，心情更好了。', 'success');
        }
    }

    return true;
}

function encourageNPC(npcId) {
    var npc = window.npcManager?.getNPC(npcId);
    var check = checkSocialConditions(npc, '鼓励', {
        energyCost: 8,
        minMood: 0, maxMood: 85,
        cooldownMinutes: 10
    });
    if (!check.pass) return;

    npc.state.mood = Math.min(100, (npc.state.mood || 50) + 5);
    npc.state.stress = Math.max(0, (npc.state.stress || 0) - 8);
    npc.changeRespect(2);
    npc.recordPlayerAction('encourage', 'positive');

    applySocialCosts(npc, '鼓励', 8, 10);

    if (window.showMessage) {
        window.showMessage('你鼓励了' + npc.name + '，TA似乎重拾了信心。', 'success');
    }

    return true;
}

function accompanyNPC(npcId) {
    var npc = window.npcManager?.getNPC(npcId);
    var check = checkSocialConditions(npc, '陪伴', {
        energyCost: 15,
        minMood: 0, maxMood: 100,
        cooldownMinutes: 30
    });
    if (!check.pass) return;

    var oldMood = npc.state.mood || 50;
    npc.state.mood = Math.min(100, oldMood + 12);
    npc.state.stress = Math.max(0, (npc.state.stress || 0) - 10);
    npc.changeAffection(3);
    npc.recordPlayerAction('accompany', 'positive');

    applySocialCosts(npc, '陪伴', 15, 30);

    if (window.showMessage) {
        window.showMessage('你陪伴了' + npc.name + '一段时间，关系更加亲密了。', 'success');
    }

    return true;
}

// ============ NPC情绪主动行为（在AI调度中调用） ============
function executeEmotionAction(npc) {
    if (!npc || !npc.state) return;

    const mood = npc.state.mood || 50;
    const emotion = getEmotionState(mood);

    // 只有情绪达到极端值时触发主动行为
    if (emotion.id === 'ecstatic' || emotion.id === 'happy') {
        // 10%概率主动送礼
        if (Math.random() < 0.1 && emotion.actions.includes('give_gift')) {
            EMOTION_ACTIONS.give_gift.execute(npc, window.currentCharData);
        }
        // 15%概率主动交谈
        if (Math.random() < 0.15 && emotion.actions.includes('initiate_talk')) {
            EMOTION_ACTIONS.initiate_talk.execute(npc, window.currentCharData);
        }
    } else if (emotion.id === 'sad') {
        // 20%概率寻求安慰
        if (Math.random() < 0.2 && emotion.actions.includes('seek_comfort')) {
            EMOTION_ACTIONS.seek_comfort.execute(npc, window.currentCharData);
        }
    } else if (emotion.id === 'angry') {
        // 30%概率拒绝对话
        if (Math.random() < 0.3 && emotion.actions.includes('refuse_talk')) {
            EMOTION_ACTIONS.refuse_talk.execute(npc, window.currentCharData);
        }
    }
}

// ============ 情绪状态UI渲染 ============
function getEmotionBadgeHTML(npc) {
    const mood = npc.state?.mood || 50;
    const emotion = getEmotionState(mood);
    const stress = npc.state?.stress || 0;

    let stressColor = 'text-green-400';
    if (stress > 60) stressColor = 'text-yellow-400';
    if (stress > 80) stressColor = 'text-red-500';

    return `
        <div class="flex items-center gap-2 text-xs">
            <span class="${emotion.color}">${emotion.icon} ${emotion.name}</span>
            <span class="${stressColor}">压力:${stress}</span>
        </div>
        <div class="flex gap-1 mt-2">
            <button onclick="comfortNPC('${npc.id}')" class="px-2 py-1 bg-green-700/50 hover:bg-green-600/50 rounded text-xs text-green-300 transition" title="安慰">🤗</button>
            <button onclick="encourageNPC('${npc.id}')" class="px-2 py-1 bg-blue-700/50 hover:bg-blue-600/50 rounded text-xs text-blue-300 transition" title="鼓励">💪</button>
            <button onclick="accompanyNPC('${npc.id}')" class="px-2 py-1 bg-purple-700/50 hover:bg-purple-600/50 rounded text-xs text-purple-300 transition" title="陪伴">👫</button>
        </div>
    `;
}

// ============ 情绪影响的对话响应 ============
function getEmotionAffectedResponse(npc, baseResponse) {
    const mood = npc.state?.mood || 50;
    const emotion = getEmotionState(mood);
    const prefix = EMOTION_DIALOGUE_PREFIXES[emotion.id] || [''];
    const chosenPrefix = prefix[Math.floor(Math.random() * prefix.length)];

    if (emotion.id === 'angry') {
        // 愤怒时对话简短冷淡
        const angryResponses = [
            '「哼，有话快说。」',
            '「我现在没心情跟你说话。」',
            '「你最好有事。」'
        ];
        return angryResponses[Math.floor(Math.random() * angryResponses.length)];
    }

    if (emotion.id === 'sad') {
        // 低落时对话带有忧郁
        const sadResponses = [
            '「唉，你说吧，我听着。」',
            '「……嗯，我在听。」',
            '「抱歉，我有些心不在焉。」'
        ];
        return sadResponses[Math.floor(Math.random() * sadResponses.length)];
    }

    if (emotion.id === 'ecstatic' || emotion.id === 'happy') {
        // 高兴时对话热情
        return chosenPrefix + baseResponse;
    }

    return baseResponse;
}

// ============ NPC对话面板添加情绪控制按钮 ============
// 在 showNPCDialog 中添加情绪状态显示和交互按钮
// 通过修改 npc-system.js 中的 showNPCDialog 函数实现
// 这里定义注入函数

function injectEmotionToDialog(npcId) {
    const npc = window.npcManager?.getNPC(npcId);
    if (!npc) return '';

    const mood = npc.state?.mood || 50;
    const emotion = getEmotionState(mood);
    const stress = npc.state?.stress || 0;

    let stressBarColor = 'bg-green-500';
    if (stress > 60) stressBarColor = 'bg-yellow-500';
    if (stress > 80) stressBarColor = 'bg-red-500';

    return `
        <div class="mb-3 bg-gray-700/30 rounded-lg p-2 border border-gray-600/50">
            <div class="flex items-center justify-between mb-1">
                <span class="text-xs text-gray-400">情绪状态</span>
                <span class="text-xs ${emotion.color}">${emotion.icon} ${emotion.name}</span>
            </div>
            <div class="flex items-center gap-2 mb-1">
                <span class="text-xs text-gray-500">心情</span>
                <div class="flex-1 bg-gray-700 rounded h-1.5">
                    <div class="h-1.5 rounded bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all"
                         style="width: ${mood}%"></div>
                </div>
                <span class="text-xs text-gray-400">${mood}</span>
            </div>
            <div class="flex items-center gap-2 mb-2">
                <span class="text-xs text-gray-500">压力</span>
                <div class="flex-1 bg-gray-700 rounded h-1.5">
                    <div class="h-1.5 rounded ${stressBarColor} transition-all" style="width: ${stress}%"></div>
                </div>
                <span class="text-xs text-gray-400">${stress}</span>
            </div>
            <div class="flex gap-1 justify-center">
                <button onclick="comfortNPC('${npc.id}')" class="px-2 py-1 bg-green-700/50 hover:bg-green-600/50 rounded text-xs text-green-300 transition" title="安慰（心情+8，压力-5，耗时15min）">🤗 安慰</button>
                <button onclick="encourageNPC('${npc.id}')" class="px-2 py-1 bg-blue-700/50 hover:bg-blue-600/50 rounded text-xs text-blue-300 transition" title="鼓励（心情+5，压力-8，敬畏+2，耗时10min）">💪 鼓励</button>
                <button onclick="accompanyNPC('${npc.id}')" class="px-2 py-1 bg-purple-700/50 hover:bg-purple-600/50 rounded text-xs text-purple-300 transition" title="陪伴（心情+12，压力-10，好感+3，耗时30min）">👫 陪伴</button>
            </div>
        </div>
    `;
}

// ============ 初始化情绪系统 ============
function initEmotionSystem() {
    if (typeof window !== 'undefined') {
        window.EMOTION_STATES = EMOTION_STATES;
        window.getEmotionState = getEmotionState;
        window.getEmotionDialoguePrefix = getEmotionDialoguePrefix;
        window.comfortNPC = comfortNPC;
        window.encourageNPC = encourageNPC;
        window.accompanyNPC = accompanyNPC;
        window.executeEmotionAction = executeEmotionAction;
        window.getEmotionBadgeHTML = getEmotionBadgeHTML;
        window.getEmotionAffectedResponse = getEmotionAffectedResponse;
        window.injectEmotionToDialog = injectEmotionToDialog;
        window.initEmotionSystem = initEmotionSystem;
    }
}

// 自动初始化
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEmotionSystem);
    } else {
        initEmotionSystem();
    }
}