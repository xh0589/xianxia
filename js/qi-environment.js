// ==================== qi-environment.js - 灵气环境系统 ====================
// 地点灵气浓度、引导灵气修炼、灵气枯竭
// 加载顺序：在 regions.js 之后
// v20.43 做深：天时地灵共鸣（天气五行合地灵+10%，读取方在 weather-effects）；
// 枯竭警示有纪律（跌破一档报一次，回春再报一次，不刷屏）。

// ============ 地点灵气浓度 ============
var QI_CONCENTRATION = {
    '太虚山': { base: 1.8, type: 'earth', desc: '仙山福地，灵气充沛', color: 'text-purple-400' },
    '蓬莱仙岛': { base: 2.0, type: 'water', desc: '海上仙山，灵气浓郁', color: 'text-cyan-400' },
    '青木城': { base: 1.5, type: 'wood', desc: '木灵之气浓郁', color: 'text-green-400' },
    '东海龙宫': { base: 1.6, type: 'water', desc: '深海龙宫，水灵汇聚', color: 'text-blue-400' },
    '炎城': { base: 1.4, type: 'fire', desc: '火山之地，火灵充沛', color: 'text-red-400' },
    '金城': { base: 1.3, type: 'metal', desc: '金铁之城，金灵旺盛', color: 'text-yellow-400' },
    '剑阁': { base: 1.5, type: 'metal', desc: '万剑归宗，剑气化灵', color: 'text-gray-300' },
    '青城山': { base: 1.7, type: 'earth', desc: '清幽宁静，灵气内敛', color: 'text-green-400' },
    '冰原城': { base: 1.3, type: 'water', desc: '冰雪之地，水灵凝聚', color: 'text-indigo-400' },
    '极寒之地': { base: 1.4, type: 'water', desc: '极寒之地，灵气冰封', color: 'text-blue-300' },
    '万毒谷': { base: 1.2, type: 'wood', desc: '毒瘴弥漫，灵气浑浊', color: 'text-green-600' },
    '大漠孤城': { base: 0.8, type: 'fire', desc: '沙漠之地，灵气稀薄', color: 'text-yellow-600' },
    '洛水城': { base: 1.1, type: 'water', desc: '洛水之畔，灵气平和', color: 'text-blue-400' },
    '帝都·长安': { base: 1.0, type: 'mixed', desc: '繁华帝都，灵气混杂', color: 'text-yellow-400' },
    // v20.53 高位面：灵界灵气凝成实质，魔界是浊气（浓而不纯，久留蚀体）
    '灵界·蓬莱仙境': { base: 4.5, type: 'water', desc: '灵气凝雾，吐纳一口抵人间一日', color: 'text-cyan-300' },
    '灵界·九天罡风带': { base: 5.5, type: 'metal', desc: '罡风裹灵气，浓烈却割人', color: 'text-slate-300' },
    '魔界·九幽深渊': { base: 3.6, type: 'fire', desc: '浊气上涌，炼之快，染之亦快', color: 'text-purple-400' },
    '魔界·血海荒原': { base: 4.0, type: 'fire', desc: '血气弥天，魔物逐血而行', color: 'text-red-500' },
    'default': { base: 0.8, type: 'mixed', desc: '普通区域，灵气一般', color: 'text-gray-400' }
};

var globalQiLevel = 100; // 世界灵气水平（0-100）

// 地点地灵属性（供天时共鸣判断）
function getQiLocElement(locationName) {
    var data = QI_CONCENTRATION[locationName] || QI_CONCENTRATION['default'];
    return data.type;
}

// 获取地点灵气浓度（v20.43：天时合地灵则共鸣+10%）
function getQiConcentration(locationName) {
    var data = QI_CONCENTRATION[locationName] || QI_CONCENTRATION['default'];
    var conc = data.base * (globalQiLevel / 100);
    if (typeof window.getWeatherQiResonance === 'function') {
        try { conc *= window.getWeatherQiResonance(data.type); } catch (e) {}
    }
    return conc;
}

// 获取修炼速度加成
function getCultivationSpeedBonusFromQi() {
    var loc = window.currentCharData?.location || '';
    var conc = getQiConcentration(loc);
    return conc;
}

// 引导灵气修炼（小游戏）
function guideQiCultivation() {
    if (typeof document !== 'undefined' && document.body) {
        openGuideQiMiniGame();
        return window._lastQiGuideBonus || 1.0;
    }
    var target = 50 + Math.floor(Math.random() * 30);
    var playerChoice = Math.floor(Math.random() * 100);
    var diff = Math.abs(playerChoice - target);
    var bonus = 1.0;
    if (diff < 10) { bonus = 1.5; if (window.showMessage) showMessage('✨ 灵气引导完美！修炼效率+50%', 'success'); }
    else if (diff < 25) { bonus = 1.2; if (window.showMessage) showMessage('👍 灵气引导成功，修炼效率+20%', 'success'); }
    else { if (window.showMessage) showMessage('灵气引导不够精准，无额外加成。', 'info'); }
    window._lastQiGuideBonus = bonus;
    return bonus;
}

function openGuideQiMiniGame() {
    var old = document.getElementById('qi-guide-modal');
    if (old) old.remove();
    var target = 40 + Math.floor(Math.random() * 40);
    var modal = document.createElement('div');
    modal.id = 'qi-guide-modal';
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    modal.innerHTML = '<div class="bg-gray-800 border-2 border-cyan-500 rounded-xl p-6 max-w-sm w-full mx-4 text-center">' +
        '<h3 class="text-xl font-bold text-cyan-400 mb-2">🌊 引导灵气</h3>' +
        '<p class="text-xs text-gray-400 mb-3">指针接近高亮区时点击「定息」</p>' +
        '<div class="relative h-4 bg-gray-700 rounded mb-2 overflow-hidden">' +
        '<div class="absolute h-full bg-cyan-600/40" style="left:' + (target - 10) + '%;width:20%"></div>' +
        '<div id="qi-pointer" class="absolute top-0 h-full w-1 bg-yellow-400" style="left:0%"></div></div>' +
        '<button id="qi-guide-btn" class="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded font-bold">定息</button>' +
        '<button onclick="this.closest(\'.fixed\').remove()" class="ml-2 text-gray-400 text-sm">取消</button></div>';
    document.body.appendChild(modal);
    var pos = 0, dir = 1;
    var timer = setInterval(function() {
        pos += dir * 2;
        if (pos >= 100) dir = -1;
        if (pos <= 0) dir = 1;
        var ptr = document.getElementById('qi-pointer');
        if (ptr) ptr.style.left = pos + '%';
    }, 30);
    var btn = document.getElementById('qi-guide-btn');
    if (btn) btn.onclick = function() {
        clearInterval(timer);
        var diff = Math.abs(pos - target);
        var bonus = 1.0;
        if (diff < 8) { bonus = 1.5; if (window.showMessage) showMessage('✨ 灵气引导完美！+50%', 'success'); }
        else if (diff < 18) { bonus = 1.25; if (window.showMessage) showMessage('👍 引导成功 +25%', 'success'); }
        else { if (window.showMessage) showMessage('引导偏了', 'info'); }
        window._lastQiGuideBonus = bonus;
        if (bonus >= 1.25 && typeof window.restoreWorldQi === 'function') window.restoreWorldQi(1);
        else if (typeof window.depleteQi === 'function') window.depleteQi(0.5);
        modal.remove();
        if (window.currentCharData && bonus > 1) {
            var gain = Math.floor(15 * bonus);
            window.currentCharData.essence = (window.currentCharData.essence || 0) + gain;
            if (window.showMessage) showMessage('引导修炼 +' + gain + ' 经验', 'success');
        }
        if (typeof window.updateWeatherDisplay === 'function') window.updateWeatherDisplay();
    };
}

// 灵气枯竭（v20.43：跌破一档只报一次，回春再报一次——灾讯不刷屏）
function depleteQi(amount) {
    globalQiLevel = Math.max(0, globalQiLevel - (amount || 1));
    if (typeof window !== 'undefined') window.globalQiLevel = globalQiLevel; // 外部读的是活值，不是快照
    if (globalQiLevel < 30 && !_qiWarned && window.showMessage) {
        _qiWarned = true;
        showMessage('⚠️ 世界灵气正在枯竭，修炼效率大幅降低！', 'warning');
    }
}

function restoreWorldQi(amount) {
    var before = globalQiLevel;
    globalQiLevel = Math.min(100, globalQiLevel + (amount || 5));
    if (typeof window !== 'undefined') window.globalQiLevel = globalQiLevel;
    if (_qiWarned && before < 30 && globalQiLevel >= 30 && window.showMessage) {
        _qiWarned = false;
        showMessage('🌱 天地灵气回春，修炼的涩感散了些。', 'success');
    }
}
var _qiWarned = false;

// 导出
if (typeof window !== 'undefined') {
    window.QI_CONCENTRATION = QI_CONCENTRATION;
    window.getQiConcentration = getQiConcentration;
    window.getQiLocElement = getQiLocElement;
    window.getCultivationSpeedBonusFromQi = getCultivationSpeedBonusFromQi;
    window.guideQiCultivation = guideQiCultivation;
    window.openGuideQiMiniGame = openGuideQiMiniGame;
    window.depleteQi = depleteQi;
    window.restoreWorldQi = restoreWorldQi;
    window.globalQiLevel = globalQiLevel;
}