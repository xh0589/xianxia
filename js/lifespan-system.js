// ==================== lifespan-system.js - 寿命系统 ====================
// 寿元概念、修炼增加寿元、时间不可逆
// 加载顺序：在 time-system.js 之后

var LIFESPAN_CONFIG = {
    base: { years: 100, desc: '凡人寿元' },
    '炼气': { years: 100, desc: '炼气期寿元' },
    '筑基': { years: 200, desc: '筑基期寿元' },
    '金丹': { years: 500, desc: '金丹期寿元' },
    '元婴': { years: 1000, desc: '元婴期寿元' },
    '化神': { years: 2000, desc: '化神期寿元' },
    '炼虚': { years: 5000, desc: '炼虚期寿元' },
    '合体': { years: 8000, desc: '合体期寿元' },
    '大乘': { years: 12000, desc: '大乘期寿元' },
    '渡劫': { years: 15000, desc: '渡劫期寿元' }
};

var playerLifespan = { maxAge: 100, currentAge: 18, remainingDays: 0, isImmortal: false };

function initLifespan() {
    try {
        var saved = localStorage.getItem('xianxia_lifespan');
        if (saved) { playerLifespan = JSON.parse(saved); }
    } catch(e) {}
    updateLifespanDisplay();
}

function saveLifespan() {
    try { localStorage.setItem('xianxia_lifespan', JSON.stringify(playerLifespan)); } catch(e) {}
}

function updatePlayerLifespan(daysPassed) {
    if (playerLifespan.isImmortal) return;
    playerLifespan.currentAge += daysPassed / 365;
    playerLifespan.remainingDays = Math.max(0, (playerLifespan.maxAge - playerLifespan.currentAge) * 365);
    var ratio = playerLifespan.currentAge / Math.max(1, playerLifespan.maxAge);
    playerLifespan.agePenalty = ratio >= 0.9 ? 0.85 : (ratio >= 0.8 ? 0.92 : 1.0);
    if (playerLifespan.remainingDays <= 0 && !playerLifespan.isImmortal) {
        if (!playerLifespan._endingShown) {
            playerLifespan._endingShown = true;
            triggerLifespanEnd();
        } else if (window.showMessage) {
            window.showMessage('⚠️ 寿元已尽……', 'error');
        }
    } else if (playerLifespan.remainingDays < 30 && !playerLifespan._warn30) {
        playerLifespan._warn30 = true;
        if (window.showMessage) window.showMessage('⚠️ 寿元不足三十日！', 'error');
    }
    updateLifespanDisplay();
    saveLifespan();
}

function extendLifespan(years, source) {
    if (playerLifespan.isImmortal) return false;
    years = years || 10;
    playerLifespan.maxAge += years;
    playerLifespan.remainingDays = Math.max(0, (playerLifespan.maxAge - playerLifespan.currentAge) * 365);
    playerLifespan._endingShown = false;
    playerLifespan._warn30 = false;
    updateLifespanDisplay();
    saveLifespan();
    if (window.showMessage) window.showMessage('⌛ 寿元延长' + years + '年' + (source ? '（' + source + '）' : ''), 'success');
    return true;
}

function getAgePenaltyMultiplier() {
    if (playerLifespan.isImmortal) return 1.0;
    return playerLifespan.agePenalty || 1.0;
}

function triggerLifespanEnd() {
    if (playerLifespan.isImmortal) return;
    var old = document.getElementById('lifespan-end-modal');
    if (old) old.remove();
    var modal = document.createElement('div');
    modal.id = 'lifespan-end-modal';
    modal.className = 'fixed inset-0 bg-black/90 flex items-center justify-center z-[200]';
    modal.innerHTML = '<div class="bg-gray-900 border-2 border-red-700 rounded-xl p-8 max-w-lg w-full mx-4 text-center">' +
        '<div class="text-5xl mb-4">⌛</div><h2 class="text-3xl font-bold text-red-500 mb-3">寿元已尽</h2>' +
        '<p class="text-gray-300 mb-6">肉身气数已终。可服延寿丹、二周目或接受结局。</p>' +
        '<button onclick="window._tryUseLongevityFromEnd()" class="w-full mb-2 bg-green-700 text-white py-2 rounded">服用延寿丹</button>' +
        '<button onclick="window._lifespanNewGamePlus()" class="w-full mb-2 bg-purple-700 text-white py-2 rounded">二周目续缘</button>' +
        '<button onclick="window._lifespanAcceptDeath()" class="w-full bg-gray-700 text-white py-2 rounded">接受结局</button></div>';
    document.body.appendChild(modal);
}

function _tryUseLongevityFromEnd() {
    var used = false;
    if (window.inventory && window.inventory.slots) {
        for (var i = 0; i < window.inventory.slots.length; i++) {
            var s = window.inventory.slots[i];
            if (s && s.templateId === 'spec_longevity_pill' && s.count >= 1) {
                s.count -= 1;
                if (s.count <= 0) window.inventory.slots[i] = null;
                extendLifespan(50, '延寿丹');
                used = true;
                break;
            }
        }
    }
    if (used) {
        var m = document.getElementById('lifespan-end-modal');
        if (m) m.remove();
        if (window.showMessage) window.showMessage('延寿成功！', 'success');
    } else if (window.showMessage) window.showMessage('没有延寿丹', 'error');
}

function _lifespanNewGamePlus() {
    var m = document.getElementById('lifespan-end-modal');
    if (m) m.remove();
    if (typeof window.startNewGamePlus === 'function') window.startNewGamePlus();
    else {
        playerLifespan.currentAge = 18;
        playerLifespan.remainingDays = (playerLifespan.maxAge - 18) * 365;
        playerLifespan._endingShown = false;
        saveLifespan();
        updateLifespanDisplay();
        if (window.showMessage) window.showMessage('轮回再起，年龄重置', 'success');
    }
}

function _lifespanAcceptDeath() {
    var m = document.getElementById('lifespan-end-modal');
    if (m) m.remove();
    if (window.currentCharData) {
        window.currentCharData.flags = window.currentCharData.flags || {};
        window.currentCharData.flags.lifespanEnded = true;
    }
    if (window.showMessage) window.showMessage('道消身死……可继续浏览或读档', 'info');
}


function increaseLifespanOnBreakthrough(realm) {
    var config = LIFESPAN_CONFIG[realm];
    if (!config) return;
    if (config.years === null) { playerLifespan.isImmortal = true; playerLifespan.remainingDays = -1; }
    else { playerLifespan.maxAge = Math.max(playerLifespan.maxAge, config.years); }
    playerLifespan.remainingDays = Math.max(0, (playerLifespan.maxAge - playerLifespan.currentAge) * 365);
    if (window.showMessage) window.showMessage('🎉 突破至' + realm + '期，寿元增加至' + playerLifespan.maxAge + '年！', 'success');
    updateLifespanDisplay();
    saveLifespan();
}

function updateLifespanDisplay() {
    var el = document.getElementById('lifespan-display');
    if (!el) return;
    if (playerLifespan.isImmortal) el.innerHTML = '♾️ 永生';
    else el.innerHTML = '⌛ ' + Math.floor(playerLifespan.currentAge) + '岁 / ' + playerLifespan.maxAge + '年（余' + Math.floor(playerLifespan.remainingDays) + '天）';
}

// 突破寿元由成功事件驱动，禁止通过包裹 performBreakthrough 猜测结果。
if (window.EventBus && typeof window.EventBus.on === 'function') {
    window.EventBus.on('cultivation:breakthrough', function(payload) {
        if (payload && payload.realmChanged && payload.toRealm) increaseLifespanOnBreakthrough(payload.toRealm);
    });
}

// 寿命按统一 newDay 事件推进，避免多个模块互相包裹 onNewDay。
if (window.EventBus && typeof window.EventBus.on === 'function') {
    window.EventBus.on('newDay', function() { updatePlayerLifespan(1); });
}

if (typeof window !== 'undefined') {
    window.LIFESPAN_CONFIG = LIFESPAN_CONFIG;
    window.playerLifespan = playerLifespan;
    window.initLifespan = initLifespan;
    window.updateLifespanDisplay = updateLifespanDisplay;
    window.updatePlayerLifespan = updatePlayerLifespan;
    window.increaseLifespanOnBreakthrough = increaseLifespanOnBreakthrough;
    window.extendLifespan = extendLifespan;
    window.getAgePenaltyMultiplier = getAgePenaltyMultiplier;
    window.triggerLifespanEnd = triggerLifespanEnd;
    window._tryUseLongevityFromEnd = _tryUseLongevityFromEnd;
    window._lifespanNewGamePlus = _lifespanNewGamePlus;
    window._lifespanAcceptDeath = _lifespanAcceptDeath;
    initLifespan();
}