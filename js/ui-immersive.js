// ==================== ui-immersive.js - UI沉浸感增强系统 ====================
// 特效、伤害数字、打字机效果、获得动画、地点过渡描写
// 加载顺序：在 app.js 之后（最后加载）

// ============ 特效系统 ============
var EFFECT_DEFS = {
    breakthrough: { emoji: '✨', class: 'effect-golden', duration: 2000, particles: 12 },
    battle_hit: { emoji: '💥', class: 'effect-impact', duration: 500, particles: 5 },
    battle_crit: { emoji: '⚡', class: 'effect-crit', duration: 800, particles: 8 },
    heal: { emoji: '💚', class: 'effect-heal', duration: 800, particles: 6 },
    item_get: { emoji: '🎁', class: 'effect-item', duration: 1000, particles: 8 },
    level_up: { emoji: '⬆️', class: 'effect-levelup', duration: 1500, particles: 10 },
    quest_done: { emoji: '✅', class: 'effect-quest', duration: 1200, particles: 6 }
};

// 显示特效
function showEffect(effectType, x, y) {
    var def = EFFECT_DEFS[effectType];
    if (!def) return;

    var container = document.createElement('div');
    container.className = 'fixed inset-0 pointer-events-none z-[100]';
    container.style.animation = 'none';

    // 粒子效果
    for (var i = 0; i < def.particles; i++) {
        var particle = document.createElement('div');
        particle.className = 'absolute text-2xl';
        particle.textContent = def.emoji;
        var startX = (x || window.innerWidth / 2) + (Math.random() - 0.5) * 60;
        var startY = (y || window.innerHeight / 2) + (Math.random() - 0.5) * 60;
        var endX = (Math.random() - 0.5) * 120;
        var endY = -50 - Math.random() * 100;
        particle.style.left = startX + 'px';
        particle.style.top = startY + 'px';
        particle.style.transition = 'all ' + (def.duration / 1000) + 's ease-out';
        particle.style.opacity = '1';
        container.appendChild(particle);
        setTimeout(function(p) {
            p.style.transform = 'translate(' + endX + 'px,' + endY + 'px)';
            p.style.opacity = '0';
        }, 50, particle);
    }

    document.body.appendChild(container);
    setTimeout(function() { if (container.parentNode) container.parentNode.removeChild(container); }, def.duration);
}

// ============ 伤害数字显示 ============
function showDamageNumber(target, damage, type) {
    if (!target) return;
    var rect = target.getBoundingClientRect ? target.getBoundingClientRect() : { left: window.innerWidth/2, top: window.innerHeight/2 };

    var el = document.createElement('div');
    el.className = 'fixed pointer-events-none z-[100] font-bold text-lg';
    el.style.left = (rect.left + (rect.width || 0) / 2) + 'px';
    el.style.top = (rect.top || rect.y) + 'px';
    el.style.transform = 'translateX(-50%)';

    if (type === 'crit') {
        el.className += ' text-red-500';
        el.style.fontSize = '28px';
        el.textContent = '⚡ ' + damage;
        el.style.textShadow = '0 0 10px rgba(255,0,0,0.5)';
    } else if (type === 'heal') {
        el.className += ' text-green-400';
        el.textContent = '+' + damage;
    } else {
        el.className += ' text-white';
        el.textContent = '-' + damage;
    }

    el.style.animation = 'damageFloat 1s ease-out forwards';
    document.body.appendChild(el);
    setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 1000);
}

// ============ 物品获得动画 ============
function showItemObtainAnimation(itemId, count) {
    var item = window.itemById ? window.itemById[itemId] : null;
    var itemName = item ? item.name : itemId;
    var icon = item ? (item.icon || '📦') : '📦';

    var container = document.createElement('div');
    container.className = 'fixed inset-0 flex items-center justify-center pointer-events-none z-[100]';
    container.style.animation = 'itemAnim 1.5s ease forwards';

    container.innerHTML = '<div class="text-center" style="animation: itemBounce 0.5s ease">' +
        '<div class="text-6xl mb-2">' + icon + '</div>' +
        '<div class="text-xl font-bold text-yellow-400">+' + count + ' ' + itemName + '</div>' +
    '</div>';

    document.body.appendChild(container);
    setTimeout(function() { if (container.parentNode) container.parentNode.removeChild(container); }, 1500);
}

// ============ 地点过渡描写 ============
var LOCATION_TRANSITIONS = {
    '帝都·长安': { enter: '繁华的长安城映入眼帘，车水马龙，人声鼎沸……', bg: 'from-yellow-900/30 to-red-800/20' },
    '太虚山': { enter: '仙气缭绕的太虚山，灵鹤飞舞，道韵悠长……', bg: 'from-blue-900/30 to-purple-800/20' },
    '迷雾森林': { enter: '你踏入迷雾森林，四周一片寂静，浓密的雾气让视线受阻……', bg: 'from-gray-800 to-green-900' },
    '青木城': { enter: '城中遍植奇花异草，空气中弥漫着草木的清香。', bg: 'from-green-900/40 to-teal-800/20' },
    '炎城': { enter: '熔岩为河，火焰为灯，炎城充满了力量与激情。', bg: 'from-red-900/40 to-orange-800/30' },
    '蓬莱仙岛': { enter: '云雾缭绕的海上仙山，海浪拍打着礁石。', bg: 'from-cyan-900/30 to-blue-800/20' },
    '金城': { enter: '金铁之声不绝于耳，坊间炉火通明，铸兵之气扑面而来。', bg: 'from-yellow-900/40 to-gray-800/30' },
    '剑阁': { enter: '万仞剑崖直插云霄，剑意纵横，令人心神一凛。', bg: 'from-gray-900/50 to-slate-800/30' },
    '青城山': { enter: '青城幽静，松涛阵阵，一派清修气象。', bg: 'from-green-900/30 to-emerald-800/20' },
    '冰原城': { enter: '寒风刺骨，城墙上结满冰凌，行人皆裹紧衣袍。', bg: 'from-blue-900/40 to-indigo-900/30' },
    '极寒之地': { enter: '天地皆白，灵气几乎凝成冰晶，每一步都消耗真气。', bg: 'from-cyan-950/50 to-blue-900/40' },
    '万毒谷': { enter: '毒瘴弥漫，草木皆带异色，远处隐有虫豸低鸣。', bg: 'from-green-950/50 to-lime-900/30' },
    '大漠孤城': { enter: '黄沙漫天，孤城矗立沙海之中，水源比灵石更珍贵。', bg: 'from-yellow-900/40 to-orange-900/30' },
    '洛水城': { enter: '洛水汤汤，商船往来，城中市井热闹非凡。', bg: 'from-blue-900/30 to-sky-800/20' },
    '东海龙宫': { enter: '海底宫殿金碧辉煌，水压与龙威同时压在心头。', bg: 'from-blue-950/50 to-cyan-900/40' },
    '新手村': { enter: '炊烟袅袅的小村落，是无数修士启程的地方。', bg: 'from-green-900/20 to-amber-900/20' }
};

function showLocationTransition(locationName) {
    // 标准化城市名（去除空格，兼容HTML中"帝都 · 长安"→对象中的"帝都·长安"）
    var normalized = locationName.replace(/\s+/g, '');
    var trans = LOCATION_TRANSITIONS[normalized] || LOCATION_TRANSITIONS[locationName];
    if (!trans) return;
    // 检查设置是否启用了黑屏介绍
    if (window._settings && window._settings.disableCityIntro === true) return;

    var overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-[90] flex items-center justify-center pointer-events-none';
    overlay.style.background = 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 100%)';
    overlay.style.animation = 'locFadeInOut 0.5s ease forwards';

    overlay.innerHTML = '<div class="text-center px-6" style="animation: locText 0.5s ease">' +
        '<div class="text-4xl mb-4">🏯</div>' +
        '<h2 class="text-2xl font-bold text-yellow-500 mb-2">' + locationName + '</h2>' +
        '<p class="text-gray-300 text-lg leading-relaxed">' + trans.enter + '</p>' +
    '</div>';

    document.body.appendChild(overlay);
    setTimeout(function() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 500);
}

// ============ 添加动画样式 ============
(function addAnimStyles() {
    if (document.getElementById('ui-immersive-style')) return;
    var style = document.createElement('style');
    style.id = 'ui-immersive-style';
    style.textContent = `
        @keyframes damageFloat { 0% { opacity:1; transform:translateX(-50%) translateY(0); } 100% { opacity:0; transform:translateX(-50%) translateY(-60px); } }
        @keyframes itemAnim { 0% { opacity:0; transform:scale(0.5); } 30% { opacity:1; transform:scale(1.1); } 60% { transform:scale(1); } 100% { opacity:0; transform:translateY(-30px); } }
        @keyframes itemBounce { 0% { transform:scale(0); } 50% { transform:scale(1.2); } 100% { transform:scale(1); } }
        @keyframes locFadeInOut { 0% { opacity:0; } 15% { opacity:1; } 75% { opacity:1; } 100% { opacity:0; } }
        @keyframes locText { 0% { opacity:0; transform:translateY(20px); } 100% { opacity:1; transform:translateY(0); } }
    `;
    document.head.appendChild(style);
})();

// ============ 导出 ============
if (typeof window !== 'undefined') {
    window.showEffect = showEffect;
    window.showDamageNumber = showDamageNumber;
    window.showItemObtainAnimation = showItemObtainAnimation;
    window.showLocationTransition = showLocationTransition;
    window.EFFECT_DEFS = EFFECT_DEFS;
    window.LOCATION_TRANSITIONS = LOCATION_TRANSITIONS;
}