// ==================== choice-memory.js - 选择记忆系统 ====================
// 记录玩家的重要选择，NPC会引用历史选择，累积影响结局
// 依赖：quest-system.js (GAME_ENDINGS, showEndingScreen)
// 加载顺序：在 quest-system.js 之后，app.js 之前

// ============ 选择记录 ============
let playerChoices = {
    history: [],      // 所有选择历史
    stats: {          // 关键抉择统计
        mercy_count: 0,      // 仁慈次数
        ruthless_count: 0,   // 冷酷次数
        helper_count: 0,     // 帮助他人次数
        selfish_count: 0,    // 自私次数
        wisdom_count: 0,     // 明智选择次数
        reckless_count: 0,   // 鲁莽次数
        dao_heart_count: 0,  // 道心坚定次数
        demon_heart_count: 0 // 入魔倾向次数
    }
};

// ============ 重要选择定义 ============
const IMPORTANT_CHOICES = {
    'main_010_spare': {
        id: 'main_010_spare',
        questId: 'main_010',
        description: '在血色漩涡中选择了放过敌人',
        stat: 'mercy_count',
        tags: ['mercy', 'compassion'],
        npcDialogue: {
            'mentor_01': '听说你在血色漩涡中放过了那个敌人，仁慈也是一种力量。',
            'rival_01': '哼，你太心软了，迟早会后悔的。',
            'warrior_01': '能放过敌人，这需要更大的勇气。佩服！'
        }
    },
    'main_010_kill': {
        id: 'main_010_kill',
        questId: 'main_010',
        description: '在血色漩涡中选择了斩杀敌人',
        stat: 'ruthless_count',
        tags: ['ruthless', 'decisive'],
        npcDialogue: {
            'mentor_01': '你杀了那个人……希望你的道心不会因此动摇。',
            'rival_01': '干得漂亮！修仙之路本就是尸山血海。',
            'warrior_01': '杀伐果断，这才是修士该有的样子。'
        }
    },
    'main_015_help': {
        id: 'main_015_help',
        questId: 'main_015',
        description: '帮助了落难的修士',
        stat: 'helper_count',
        tags: ['helpful', 'kind'],
        npcDialogue: {
            'mentor_01': '听说你出手相助，这才是修道之人该做的事。',
            'healer_01': '你真是个善良的人，谢谢你帮助了那个修士。'
        }
    },
    'main_015_ignore': {
        id: 'main_015_ignore',
        questId: 'main_015',
        description: '无视了落难的修士',
        stat: 'selfish_count',
        tags: ['selfish', 'cold'],
        npcDialogue: {
            'mentor_01': '听说你见死不救……修道先修心啊。',
            'healer_01': '你怎么能见死不救呢？我太失望了……'
        }
    },
    'main_020_truth': {
        id: 'main_020_truth',
        questId: 'main_020',
        description: '选择了追寻真相',
        stat: 'wisdom_count',
        tags: ['wise', 'curious'],
        npcDialogue: {
            'mysterious_01': '追寻真相的路从来都不容易，你做出了正确的选择。'
        }
    },
    'main_020_power': {
        id: 'main_020_power',
        questId: 'main_020',
        description: '选择了追求力量',
        stat: 'reckless_count',
        tags: ['reckless', 'ambitious'],
        npcDialogue: {
            'mysterious_01': '力量固然重要，但不要被力量蒙蔽了双眼。'
        }
    },
    'main_025_protect': {
        id: 'main_025_protect',
        questId: 'main_025',
        description: '在宗门守卫战中誓死守护宗门',
        stat: 'dao_heart_count',
        tags: ['loyal', 'brave'],
        npcDialogue: {
            'elder_01': '你在守卫战中的表现，我们都看在眼里。宗门以你为荣！',
            'warrior_01': '好样的！与你并肩作战是我的荣幸！'
        }
    },
    'main_025_flee': {
        id: 'main_025_flee',
        questId: 'main_025',
        description: '在宗门守卫战中选择了撤退',
        stat: 'demon_heart_count',
        tags: ['cowardly', 'survival'],
        npcDialogue: {
            'elder_01': '你……你竟然临阵脱逃！',
            'warrior_01': '我看错你了。'
        }
    }
};

// ============ 加载/保存 ============
function loadChoiceMemory() {
    try {
        var saved = localStorage.getItem('xianxia_choices');
        if (saved) {
            var data = JSON.parse(saved);
            playerChoices.history = data.history || [];
            playerChoices.stats = data.stats || playerChoices.stats;
        }
    } catch (e) {
        playerChoices = { history: [], stats: { mercy_count: 0, ruthless_count: 0, helper_count: 0, selfish_count: 0, wisdom_count: 0, reckless_count: 0, dao_heart_count: 0, demon_heart_count: 0 } };
    }
}

function saveChoiceMemory() {
    try {
        localStorage.setItem('xianxia_choices', JSON.stringify(playerChoices));
    } catch (e) {}
}

// ============ 记录选择 ============
function recordChoice(choiceId, questTitle) {
    var choiceDef = IMPORTANT_CHOICES[choiceId];
    if (!choiceDef) { showMessage('选择记录失败：无效的选择ID', 'warning'); return; }

    // 记录到历史
    playerChoices.history.push({
        choiceId: choiceId,
        questId: choiceDef.questId,
        description: choiceDef.description,
        timestamp: window.gameTime ? window.gameTime.totalMinutes : Date.now(),
        day: window.gameTime ? window.gameTime.currentDay : 1
    });

    // 更新统计
    if (choiceDef.stat && playerChoices.stats[choiceDef.stat] !== undefined) {
        playerChoices.stats[choiceDef.stat]++;
    }

    // 保存
    saveChoiceMemory();

    // 显示记录提示
    var tagNames = {
        mercy: '慈悲', ruthless: '冷酷', helpful: '善良', selfish: '自私',
        wise: '明智', reckless: '鲁莽', loyal: '忠诚', cowardly: '怯懦'
    };
    var tags = choiceDef.tags || [];
    var tagText = tags.map(function(t) { return '#' + (tagNames[t] || t); }).join(' ');

    if (window.showMessage) {
        window.showMessage('📜 选择已记录：' + choiceDef.description + ' ' + tagText, 'info');
    }

    // 检查是否触发结局变化
    checkEndingFromChoices();
}

// ============ NPC引用历史选择 ============
function getReferencedDialogue(npcId, baseDialogue) {
    // 遍历玩家选择历史，查找与当前NPC相关的引用
    var references = [];

    for (var i = 0; i < playerChoices.history.length; i++) {
        var choice = playerChoices.history[i];
        var choiceDef = IMPORTANT_CHOICES[choice.choiceId];
        if (!choiceDef) continue;

        // 检查是否有当前NPC的对话引用
        var npcDialogue = choiceDef.npcDialogue;
        if (npcDialogue && npcDialogue[npcId]) {
            references.push(npcDialogue[npcId]);
        }
    }

    if (references.length > 0) {
        // 随机选择一条引用附加到对话中
        var ref = references[Math.floor(Math.random() * references.length)];
        return baseDialogue + '\n\n（' + ref + '）';
    }

    return baseDialogue;
}

// ============ 选择累积影响结局 ============
function checkEndingFromChoices() {
    var stats = playerChoices.stats;

    // 仁慈 vs 冷酷决定结局倾向
    var mercyRatio = stats.mercy_count > 0 || stats.ruthless_count > 0 ?
        stats.mercy_count / Math.max(1, stats.mercy_count + stats.ruthless_count) : 0.5;

    var helperRatio = stats.helper_count > 0 || stats.selfish_count > 0 ?
        stats.helper_count / Math.max(1, stats.helper_count + stats.selfish_count) : 0.5;

    var daoRatio = stats.dao_heart_count > 0 || stats.demon_heart_count > 0 ?
        stats.dao_heart_count / Math.max(1, stats.dao_heart_count + stats.demon_heart_count) : 0.5;

    // 存储结局修正因子（供结局系统读取）
    if (typeof window !== 'undefined') {
        window._endingModifiers = {
            mercyRatio: mercyRatio,
            helperRatio: helperRatio,
            daoRatio: daoRatio,
            totalChoices: playerChoices.history.length
        };
    }
}

// ============ 查看选择历史 ============
function showChoiceHistory() {
    var stats = playerChoices.stats;
    var history = playerChoices.history;

    var modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    modal.onclick = function(e) { if (e.target === modal) modal.remove(); };

    var statNames = {
        mercy_count: { name: '仁慈', icon: '🕊️', color: 'text-green-400' },
        ruthless_count: { name: '冷酷', icon: '⚔️', color: 'text-red-400' },
        helper_count: { name: '助人', icon: '🤝', color: 'text-blue-400' },
        selfish_count: { name: '自私', icon: '🙅', color: 'text-gray-400' },
        wisdom_count: { name: '明智', icon: '🧠', color: 'text-purple-400' },
        reckless_count: { name: '鲁莽', icon: '💥', color: 'text-orange-400' },
        dao_heart_count: { name: '道心', icon: '💎', color: 'text-yellow-400' },
        demon_heart_count: { name: '入魔', icon: '👹', color: 'text-red-600' }
    };

    var statsHtml = '';
    for (var key in stats) {
        if (stats[key] > 0 && statNames[key]) {
            var s = statNames[key];
            statsHtml += '<div class="flex items-center gap-2 ' + s.color + '"><span>' + s.icon + '</span><span class="text-sm">' + s.name + '</span><span class="text-xs ml-auto">' + stats[key] + '次</span></div>';
        }
    }

    var historyHtml = '';
    if (history.length === 0) {
        historyHtml = '<p class="text-gray-500 text-sm text-center">暂无选择记录</p>';
    } else {
        // 只显示最近20条
        var recent = history.slice(-20).reverse();
        for (var i = 0; i < recent.length; i++) {
            var h = recent[i];
            historyHtml += '<div class="flex items-center gap-2 text-xs text-gray-400 border-b border-gray-700/50 pb-1"><span class="text-yellow-400">📜</span><span>' + h.description + '</span><span class="text-gray-500 ml-auto">第' + h.day + '天</span></div>';
        }
    }

    modal.innerHTML = '<div class="bg-gray-800 border-2 border-yellow-600/50 rounded-xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">' +
        '<div class="flex items-center justify-between mb-4"><h3 class="text-xl font-bold text-yellow-500">📜 选择记忆</h3><button onclick="this.closest(\'.fixed\').remove()" class="text-gray-400 hover:text-white text-2xl">&times;</button></div>' +
        '<div class="mb-4"><h4 class="text-sm font-bold text-gray-300 mb-2">📊 抉择统计</h4><div class="grid grid-cols-2 gap-2">' + (statsHtml || '<p class="text-gray-500 text-sm">暂无统计</p>') + '</div></div>' +
        '<div><h4 class="text-sm font-bold text-gray-300 mb-2">📋 选择记录</h4><div class="space-y-1">' + historyHtml + '</div></div>' +
        '<div class="flex justify-end mt-4"><button onclick="this.closest(\'.fixed\').remove()" class="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-lg">关闭</button></div>' +
    '</div>';

    document.body.appendChild(modal);
}

// ============ 初始化 ============
function initChoiceMemorySystem() {
    loadChoiceMemory();
    if (typeof window !== 'undefined') {
        window.IMPORTANT_CHOICES = IMPORTANT_CHOICES;
        window.playerChoices = playerChoices;
        window.recordChoice = recordChoice;
        window.getReferencedDialogue = getReferencedDialogue;
        window.showChoiceHistory = showChoiceHistory;
        window.checkEndingFromChoices = checkEndingFromChoices;
        window.initChoiceMemorySystem = initChoiceMemorySystem;
    }
}

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initChoiceMemorySystem);
    } else {
        initChoiceMemorySystem();
    }
}