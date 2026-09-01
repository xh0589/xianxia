// ==================== landmark-explore.js - 地标探索系统 ====================
// 探索度、隐藏内容、图鉴系统
// 依赖：map-markers.js (LANDMARKS)
// 加载顺序：在 map-markers.js 之后，app.js 之前

// ============ 地标探索数据 ============
const LANDMARK_EXPLORE_DATA = {
    '古剑峰': {
        id: 'gu_jian_feng',
        name: '古剑峰',
        desc: '传说中上古剑修留下的剑峰，万剑插于山体之上',
        icon: '🗡️',
        exploreProgress: 0,
        maxProgress: 100,
        rewards: [
            { progress: 20, reward: { type: 'item', id: 'mat_ancient_sword_fragment', count: 1 }, msg: '你发现了上古剑器的碎片！' },
            { progress: 40, reward: { type: 'exp', value: 500 }, msg: '你在剑峰上感悟到一丝剑意！' },
            { progress: 60, reward: { type: 'item', id: 'mat_spirit_steel', count: 3 }, msg: '你找到了一块珍贵的灵钢！' },
            { progress: 80, reward: { type: 'skill', name: '古剑诀' }, msg: '你领悟了古剑诀！' },
            { progress: 100, reward: { type: 'title', name: '古剑传承者' }, msg: '你获得了古剑传承者的称号！' }
        ],
        hidden: {
            condition: { hasItem: 'mat_ancient_key', count: 1 },
            content: '你在剑峰深处发现了一个隐藏的剑冢！',
            reward: { type: 'skill', name: '万剑归宗' }
        },
        events: [
            { text: '你发现了一柄插在岩石中的古剑，似乎可以拔出来……', prob: 0.3 },
            { text: '山风吹过，剑峰上传来阵阵剑鸣。', prob: 0.5 },
            { text: '你在剑峰上看到了一处古老的剑痕，蕴含着深奥的剑意。', prob: 0.4 }
        ]
    },
    '龙脉': {
        id: 'dragon_vein',
        name: '龙脉',
        desc: '一条沉睡的龙脉，蕴含着强大的龙气',
        icon: '🐉',
        exploreProgress: 0,
        maxProgress: 100,
        rewards: [
            { progress: 25, reward: { type: 'item', id: 'mat_dragon_scale', count: 1 }, msg: '你捡到了一片龙鳞！' },
            { progress: 50, reward: { type: 'attr', name: '体质', value: 3 }, msg: '龙气淬体，体质+3！' },
            { progress: 75, reward: { type: 'item', id: 'mat_dragon_bone', count: 1 }, msg: '你发现了一根龙骨！' },
            { progress: 100, reward: { type: 'skill', name: '龙象般若功' }, msg: '你从龙脉中领悟了龙象般若功！' }
        ],
        hidden: {
            condition: { realm: '金丹' },
            content: '你以金丹之力引动龙脉深处的龙魂！',
            reward: { type: 'item', id: 'mat_dragon_soul', count: 1 }
        }
    },
    '魂殿': {
        id: 'hun_dian',
        name: '魂殿',
        desc: '上古灵魂修行者的遗址，阴气森森',
        icon: '👻',
        exploreProgress: 0,
        maxProgress: 100,
        rewards: [
            { progress: 30, reward: { type: 'attr', name: '意志', value: 5 }, msg: '你在魂殿中磨练了意志！' },
            { progress: 60, reward: { type: 'item', id: 'pill_soul_strengthen', count: 1 }, msg: '你找到了一瓶炼魂丹！' },
            { progress: 100, reward: { type: 'skill', name: '魂术' }, msg: '你学会了上古魂术！' }
        ],
        hidden: {
            condition: { hasItem: 'spec_soul_token', count: 1 },
            content: '你用魂令打开了魂殿深处的密室！',
            reward: { type: 'item', id: 'pill_soul_rebirth', count: 1 }
        }
    },
    '寒冰深渊': {
        id: 'han_bing',
        name: '寒冰深渊',
        desc: '万年不化的冰川深渊，极寒之地',
        icon: '❄️',
        exploreProgress: 0,
        maxProgress: 100,
        rewards: [
            { progress: 25, reward: { type: 'item', id: 'mat_ice_crystal', count: 3 }, msg: '你采集到了冰晶！' },
            { progress: 50, reward: { type: 'attr', name: '经脉', value: 3 }, msg: '寒冰淬脉，经脉+3！' },
            { progress: 75, reward: { type: 'item', id: 'pill_ice_core', count: 1 }, msg: '你发现了一枚冰心丹！' },
            { progress: 100, reward: { type: 'skill', name: '玄冰诀' }, msg: '你从深渊中领悟了玄冰诀！' }
        ]
    },
    '雷音峰': {
        id: 'lei_yin',
        name: '雷音峰',
        desc: '常年被雷云笼罩的山峰，雷灵气充沛',
        icon: '⚡',
        exploreProgress: 0,
        maxProgress: 100,
        rewards: [
            { progress: 20, reward: { type: 'item', id: 'mat_lightning_stone', count: 3 }, msg: '你收集到了雷石！' },
            { progress: 40, reward: { type: 'exp', value: 800 }, msg: '雷音灌体，修为大增！' },
            { progress: 60, reward: { type: 'attr', name: '灵巧', value: 5 }, msg: '雷电淬体，灵巧+5！' },
            { progress: 80, reward: { type: 'item', id: 'pill_lightning_core', count: 1 }, msg: '你找到了一枚雷核丹！' },
            { progress: 100, reward: { type: 'skill', name: '雷法' }, msg: '你领悟了雷法！' }
        ]
    },
    '幻海绿洲': {
        id: 'huan_hai',
        name: '幻海绿洲',
        desc: '沙漠中的幻境绿洲，虚实难辨',
        icon: '🏝️',
        exploreProgress: 0,
        maxProgress: 100,
        rewards: [
            { progress: 30, reward: { type: 'item', id: 'mat_spirit_flower', count: 5 }, msg: '你采到了幻海灵花！' },
            { progress: 60, reward: { type: 'attr', name: '智力', value: 5 }, msg: '幻境历练，智力+5！' },
            { progress: 100, reward: { type: 'skill', name: '幻术' }, msg: '你悟透了幻海真谛，学会了幻术！' }
        ]
    }
};

// ============ 玩家探索状态 ============
var playerLandmarkProgress = {};

// 加载探索进度
function loadLandmarkProgress() {
    try {
        var saved = localStorage.getItem('xianxia_landmarks');
        if (saved) {
            var data = JSON.parse(saved);
            playerLandmarkProgress = data;
            // 同步到LANDMARK_EXPLORE_DATA
            for (var key in playerLandmarkProgress) {
                if (LANDMARK_EXPLORE_DATA[key]) {
                    LANDMARK_EXPLORE_DATA[key].exploreProgress = playerLandmarkProgress[key].progress || 0;
                }
            }
        }
    } catch (e) {}
}

function saveLandmarkProgress() {
    var data = {};
    for (var key in LANDMARK_EXPLORE_DATA) {
        data[key] = { progress: LANDMARK_EXPLORE_DATA[key].exploreProgress, hiddenFound: LANDMARK_EXPLORE_DATA[key]._hiddenFound || false };
    }
    try { localStorage.setItem('xianxia_landmarks', JSON.stringify(data)); } catch(e) {}
}

// ============ 探索地标 ============
function exploreLandmark(landmarkName) {
    var landmark = LANDMARK_EXPLORE_DATA[landmarkName];
    if (!landmark) { showMessage('未知的地标', 'warning'); return; }

    if (landmark.exploreProgress >= landmark.maxProgress) {
        showMessage('这个地标已经被你完全探索了。', 'info');
        return;
    }

    // 消耗时间
    if (window.timeSystem) window.timeSystem.advanceTime(30, '探索地标');

    // 增加探索度
    var gain = 10 + Math.floor(Math.random() * 15);
    landmark.exploreProgress = Math.min(landmark.maxProgress, landmark.exploreProgress + gain);

    // 触发探索事件
    var eventText = '';
    if (landmark.events && landmark.events.length > 0) {
        var validEvents = landmark.events.filter(function(e) { return Math.random() < e.prob; });
        if (validEvents.length > 0) {
            eventText = validEvents[Math.floor(Math.random() * validEvents.length)].text;
        }
    }
    if (!eventText) {
        var texts = ['你仔细搜索了' + landmarkName + '，发现了新的线索。', '你小心翼翼地探索着' + landmarkName + '。', '你在' + landmarkName + '中发现了有趣的东西。'];
        eventText = texts[Math.floor(Math.random() * texts.length)];
    }
    showMessage('🔍 ' + eventText, 'info');

    // 检查奖励
    checkLandmarkRewards(landmark);

    // 检查隐藏内容
    checkLandmarkHidden(landmark);

    // 保存
    saveLandmarkProgress();

    // 显示探索结果
    showLandmarkProgressUI(landmark);
}

// ============ 检查奖励 ============
function checkLandmarkRewards(landmark) {
    for (var i = 0; i < landmark.rewards.length; i++) {
        var reward = landmark.rewards[i];
        if (landmark.exploreProgress >= reward.progress && !reward._claimed) {
            reward._claimed = true;
            applyLandmarkReward(reward);
        }
    }
}

// ============ 应用奖励 ============
function applyLandmarkReward(reward) {
    switch (reward.type) {
        case 'item':
            if (typeof window.addItemToInventory === 'function') {
                window.addItemToInventory(reward.id, reward.count || 1);
            }
            break;
        case 'exp':
            var charData = window.currentCharData;
            if (charData) {
                charData.tempering = (charData.tempering || 0) + (reward.value || 0);
            }
            break;
        case 'attr':
            var charData2 = window.currentCharData;
            if (charData2) {
                var attrMap = { '力量': 'strength', '灵巧': 'dexterity', '体质': 'constitution', '智力': 'intelligence', '意志': 'willpower', '经脉': 'meridian' };
                var key = attrMap[reward.name] || reward.name;
                charData2[key] = (charData2[key] || 0) + (reward.value || 0);
            }
            break;
        case 'skill':
            // 添加到已学功法
            if (!window._explorationSkills) window._explorationSkills = [];
            if (window._explorationSkills.indexOf(reward.name) < 0) {
                window._explorationSkills.push(reward.name);
            }
            break;
        case 'title':
            if (!window._playerTitles) window._playerTitles = [];
            if (window._playerTitles.indexOf(reward.name) < 0) {
                window._playerTitles.push(reward.name);
            }
            break;
    }
    showMessage('🎉 ' + reward.msg, 'success');
}

// ============ 检查隐藏内容 ============
function checkLandmarkHidden(landmark) {
    if (!landmark.hidden || landmark._hiddenFound) return;
    var cond = landmark.hidden.condition;

    if (cond.hasItem) {
        if (hasInventoryItem(cond.hasItem, cond.count || 1)) {
            showMessage('🔓 ' + landmark.hidden.content, 'success');
            landmark._hiddenFound = true;
            applyLandmarkReward(landmark.hidden.reward);
            saveLandmarkProgress();
        }
    }
    if (cond.realm) {
        var charData = window.currentCharData;
        if (charData && charData.realm === cond.realm) {
            showMessage('🔓 ' + landmark.hidden.content, 'success');
            landmark._hiddenFound = true;
            applyLandmarkReward(landmark.hidden.reward);
            saveLandmarkProgress();
        }
    }
}

function hasInventoryItem(itemId, count) {
    if (!window.inventory || !window.inventory.slots) return false;
    var total = 0;
    for (var i = 0; i < window.inventory.slots.length; i++) {
        var s = window.inventory.slots[i];
        if (s && s.templateId === itemId) total += s.count || 1;
    }
    return total >= (count || 1);
}

// ============ 显示探索进度UI ============
function showLandmarkProgressUI(landmark) {
    var modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    modal.onclick = function(e) { if (e.target === modal) modal.remove(); };

    var rewardsHtml = '';
    for (var i = 0; i < landmark.rewards.length; i++) {
        var r = landmark.rewards[i];
        var claimed = r._claimed ? '✅' : '🔒';
        var progressNeeded = r.progress + '%';
        rewardsHtml += '<div class="flex items-center gap-2 text-xs ' + (r._claimed ? 'text-green-400' : 'text-gray-500') + '"><span>' + claimed + '</span><span>' + progressNeeded + '</span><span>' + r.msg + '</span></div>';
    }

    var hiddenHtml = '';
    if (landmark.hidden) {
        hiddenHtml = '<div class="mt-2 text-xs ' + (landmark._hiddenFound ? 'text-yellow-400' : 'text-gray-500') + '">🔒 隐藏内容：' + (landmark._hiddenFound ? '✅已发现' : '探索度达到后可解锁') + '</div>';
    }

    modal.innerHTML = '<div class="bg-gray-800 border-2 border-yellow-600/50 rounded-xl p-6 max-w-md w-full mx-4">' +
        '<div class="flex items-center gap-3 mb-4"><span class="text-3xl">' + landmark.icon + '</span><h3 class="text-xl font-bold text-yellow-500">' + landmark.name + '</h3><button onclick="this.closest(\'.fixed\').remove()" class="text-gray-400 hover:text-white text-2xl ml-auto">&times;</button></div>' +
        '<p class="text-sm text-gray-400 mb-4">' + landmark.desc + '</p>' +
        '<div class="mb-4"><div class="flex justify-between text-xs text-gray-400 mb-1"><span>探索度</span><span>' + landmark.exploreProgress + '%</span></div><div class="w-full bg-gray-700 rounded h-2"><div class="h-2 rounded bg-gradient-to-r from-yellow-500 to-red-500 transition-all" style="width:' + landmark.exploreProgress + '%"></div></div></div>' +
        '<div class="bg-gray-900/50 rounded-lg p-3"><h4 class="text-sm font-bold text-gray-300 mb-2">🎁 探索奖励</h4>' + rewardsHtml + hiddenHtml + '</div>' +
        '<div class="flex justify-center mt-4"><button onclick="this.closest(\'.fixed\').remove()" class="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-lg">关闭</button></div>' +
    '</div>';
    document.body.appendChild(modal);
}

// ============ 打开地标图鉴 ============
function showLandmarkBestiary() {
    var total = Object.keys(LANDMARK_EXPLORE_DATA).length;
    var discovered = 0;
    for (var key in LANDMARK_EXPLORE_DATA) {
        if (LANDMARK_EXPLORE_DATA[key].exploreProgress > 0) discovered++;
    }
    var progress = total > 0 ? Math.round(discovered / total * 100) : 0;

    var modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    modal.onclick = function(e) { if (e.target === modal) modal.remove(); };

    var listHtml = '';
    for (var key in LANDMARK_EXPLORE_DATA) {
        var lm = LANDMARK_EXPLORE_DATA[key];
        var pct = lm.exploreProgress;
        listHtml += '<div class="flex items-center gap-2 p-2 bg-gray-700/30 rounded cursor-pointer hover:bg-gray-600/30" onclick="exploreLandmark(\'' + key + '\')">' +
            '<span class="text-lg">' + lm.icon + '</span>' +
            '<span class="text-sm text-white">' + lm.name + '</span>' +
            '<div class="flex-1 mx-2 bg-gray-700 rounded h-1.5"><div class="h-1.5 rounded bg-yellow-500" style="width:' + pct + '%"></div></div>' +
            '<span class="text-xs text-gray-400">' + pct + '%</span>' +
            '<button class="px-2 py-1 bg-yellow-700 hover:bg-yellow-600 rounded text-xs text-white">探索</button>' +
        '</div>';
    }

    modal.innerHTML = '<div class="bg-gray-800 border-2 border-yellow-600/50 rounded-xl p-6 max-w-lg w-full mx-4">' +
        '<div class="flex items-center justify-between mb-4"><h3 class="text-xl font-bold text-yellow-500">🗺️ 地标图鉴</h3><button onclick="this.closest(\'.fixed\').remove()" class="text-gray-400 hover:text-white text-2xl">&times;</button></div>' +
        '<div class="mb-4"><div class="flex justify-between text-sm text-gray-400 mb-1"><span>探索进度</span><span>' + discovered + '/' + total + ' (' + progress + '%)</span></div><div class="w-full bg-gray-700 rounded h-2"><div class="h-2 rounded bg-gradient-to-r from-green-500 to-yellow-500" style="width:' + progress + '%"></div></div></div>' +
        '<div class="space-y-1">' + listHtml + '</div></div>';
    document.body.appendChild(modal);
}

// ============ 初始化 ============
function initLandmarkExplore() {
    loadLandmarkProgress();
    if (typeof window !== 'undefined') {
        window.LANDMARK_EXPLORE_DATA = LANDMARK_EXPLORE_DATA;
        window.exploreLandmark = exploreLandmark;
        window.showLandmarkBestiary = showLandmarkBestiary;
        window.initLandmarkExplore = initLandmarkExplore;
    }
}

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLandmarkExplore);
    } else {
        initLandmarkExplore();
    }
}