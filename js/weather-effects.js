// ==================== weather-effects.js - 天气/季节影响扩展 ====================
// 天气影响战斗、采集、事件、NPC行为
// 加载顺序：在 time-system.js 之后
// v20.43 做深：天象与灵气咬合——天时合地灵则灵气共鸣（+10%），天气不再只是战斗修正；
// 每日天象有味（同一天气不同说法）；

// ============ 天气系统 ============
var WEATHER_TYPES = [
    { id: 'sunny', name: '晴天', icon: '☀️', qiElement: 'fire', combat: { hit: 1.0, dodge: 1.0 }, gathering: 1.0, eventRate: 1.0, npcActivity: '正常' },
    { id: 'cloudy', name: '阴天', icon: '☁️', qiElement: 'earth', combat: { hit: 0.95, dodge: 1.0 }, gathering: 1.1, eventRate: 1.1, npcActivity: '正常' },
    { id: 'rainy', name: '雨天', icon: '🌧️', qiElement: 'water', combat: { hit: 0.85, fire: 0.7 }, gathering: 1.3, eventRate: 1.2, npcActivity: '减少外出' },
    { id: 'stormy', name: '雷雨', icon: '⛈️', qiElement: 'water', combat: { hit: 0.75, fire: 0.5, water: 1.3 }, gathering: 1.5, eventRate: 1.5, npcActivity: '室内活动' },
    { id: 'snowy', name: '下雪', icon: '❄️', qiElement: 'water', combat: { speed: 0.8, ice: 1.2 }, gathering: 0.5, eventRate: 0.8, npcActivity: '减少外出' },
    { id: 'windy', name: '大风', icon: '💨', qiElement: 'wood', combat: { hit: 0.85, speed: 0.9 }, gathering: 0.7, eventRate: 1.1, npcActivity: '减少外出' },
    { id: 'foggy', name: '雾天', icon: '🌫️', qiElement: 'wood', combat: { hit: 0.7, dodge: 1.2 }, gathering: 0.6, eventRate: 1.3, npcActivity: '正常' }
];

// v20.43 天象有味：同一天气，不同的说法（每日随机一变，不复读）
var WEATHER_OMENS = {
    sunny: ['天朗气清，惠风和畅。', '日头正盛，晒得山石发烫。'],
    cloudy: ['云色沉沉，天光收敛。', '阴云压城，风里带着土腥。'],
    rainy: ['雨丝绵密，打在瓦上如诉。', '雨落如注，檐水成帘。'],
    stormy: ['雷声隐隐，电光撕开云层。', '暴雨挟雷，天地间一片轰鸣。'],
    snowy: ['雪落无声，山野白头。', '大雪封路，呵气成霜。'],
    windy: ['大风猎猎，吹得旌旗乱响。', '风紧，走石的风。'],
    foggy: ['雾锁四野，十步之外不辨人影。', '晨雾未散，远处只剩轮廓。']
};

var currentWeather = WEATHER_TYPES[0];

// 更新天气（每天调用；forcedId 供测试/剧情钦定天象）
function updateWeather(forcedId) {
    var season = window.gameTime?.currentSeason || 'spring';
    var picked = null;
    if (forcedId) {
        for (var f = 0; f < WEATHER_TYPES.length; f++) if (WEATHER_TYPES[f].id === forcedId) { picked = WEATHER_TYPES[f]; break; }
    }
    if (!picked) {
        var weights = { spring: [3,3,2,1,0,1,1], summer: [4,2,1,2,0,1,0], autumn: [2,2,2,1,1,1,1], winter: [1,1,1,0,3,1,2] };
        var w = weights[season] || weights.spring;
        var total = w.reduce(function(a,b) { return a+b; }, 0);
        var r = Math.random() * total;
        for (var i = 0; i < w.length; i++) {
            r -= w[i];
            if (r <= 0) { picked = WEATHER_TYPES[i]; break; }
        }
    }
    if (picked) currentWeather = picked;
    window.currentWeather = currentWeather;
    // v20.43 天象播报带味 + 灵气共鸣预告（天时合地灵，修炼事半功倍）
    var omens = WEATHER_OMENS[currentWeather.id] || [];
    var omen = omens.length ? omens[Math.floor(Math.random() * omens.length)] : '';
    var msg = '🌤️ 今日天象：' + currentWeather.icon + ' ' + currentWeather.name;
    if (omen) msg += '——' + omen;
    if (window.showMessage) window.showMessage(msg, 'info');
    updateWeatherDisplay();
}

// v20.43 天时地灵共鸣：天气五行合脚下地灵，灵气浓度+10%
function getWeatherQiResonance(locElementType) {
    if (!locElementType || locElementType === 'mixed') return 1.0;
    return (currentWeather && currentWeather.qiElement === locElementType) ? 1.1 : 1.0;
}

function updateWeatherDisplay() {
    var el = document.getElementById('weather-display') || document.getElementById('weather-display-float');
    if (!el) {
        el = document.createElement('div');
        el.id = 'weather-display-float';
        el.className = 'fixed top-2 right-2 z-40 bg-gray-900/80 text-sm text-gray-200 px-2 py-1 rounded border border-gray-600 pointer-events-none';
        if (document.body) document.body.appendChild(el);
    }
    var w = currentWeather || WEATHER_TYPES[0];
    var qi = '';
    if (typeof window.getQiConcentration === 'function') {
        try {
            var loc = (window.currentCharData && window.currentCharData.location) || '';
            var c = window.getQiConcentration(loc);
            qi = ' · 灵气×' + (Math.round(c * 100) / 100);
            // 共鸣标记：天时合地灵时点给你看
            if (typeof window.getQiLocElement === 'function' && getWeatherQiResonance(window.getQiLocElement(loc)) > 1) {
                qi += '·共鸣';
            }
        } catch (e) {}
    }
    el.innerHTML = (w.icon || '🌤️') + ' ' + (w.name || '') + qi;
}
function getCurrentWeather() { return currentWeather; }


// 获取天气战斗修正
function getWeatherCombatBonus(stat) {
    return currentWeather.combat[stat] || 1.0;
}

// 获取天气采集修正
function getWeatherGatheringBonus() {
    return currentWeather.gathering;
}

// 获取天气事件率修正
function getWeatherEventRateBonus() {
    return currentWeather.eventRate;
}

// 获取天气对NPC行为的影响
function getWeatherNPCActivityModifier() {
    return currentWeather.npcActivity;
}

// 新的一天通过事件总线广播，天气系统不再覆盖 timeSystem.onNewDay。
if (window.EventBus && typeof window.EventBus.on === 'function') {
    window.EventBus.on('newDay', function() { updateWeather(); });
}

// 导出
if (typeof window !== 'undefined') {
    window.currentWeather = currentWeather;
    window.WEATHER_TYPES = WEATHER_TYPES;
    window.updateWeather = updateWeather;
    window.getWeatherQiResonance = getWeatherQiResonance;
    window.getWeatherCombatBonus = getWeatherCombatBonus;
    window.getWeatherGatheringBonus = getWeatherGatheringBonus;
    window.getWeatherEventRateBonus = getWeatherEventRateBonus;
    window.getWeatherNPCActivityModifier = getWeatherNPCActivityModifier;
    window.updateWeatherDisplay = updateWeatherDisplay;
    window.getCurrentWeather = getCurrentWeather;
    setTimeout(function() { try { updateWeatherDisplay(); } catch(e) {} }, 800);
}