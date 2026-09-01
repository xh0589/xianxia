// ==================== soul-state.js - P0-5 死亡仙侠化 · 神魂系统 ====================
// 规划来源：STRUCTURE.md 第十章 系统连接层 P0-5
// 设计定稿（2026-08-24 用户确认）：
//   - 金丹及以上境界，战斗中肉身被毁（头/颈/胸归零 或 血量耗尽）→ 神魂离体（残魂态）
//   - 残魂态：可行走/交易/对话，禁止战斗、修炼、演武、突破
//   - 重塑肉身（唯一途径，无夺舍）：灵石 500×(境界序+1) + 推进3天 + 损失10%当前修为
//     属性/灵根/技能/装备全部保留；重塑后3天「境界不稳」（战斗属性×0.9）
//   - 炼气/筑基维持原战败获救流程
// 存档：currentCharData.soulState 经 GameState 序列化

(function () {
    'use strict';

    var REALM_NAMES = ['炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'];

    // ============ 工具 ============
    function getRealmIndex(cd) {
        if (!cd) return 0;
        if (typeof cd.realm === 'number') return cd.realm;
        var idx = REALM_NAMES.indexOf(cd.realm);
        return idx >= 0 ? idx : 0;
    }

    function getCurrentDay() {
        try {
            if (window.timeSystem && window.timeSystem.gameTime && window.timeSystem.gameTime.currentDay != null) {
                return window.timeSystem.gameTime.currentDay;
            }
        } catch (e) {}
        return 0;
    }

    function getHour() {
        try {
            if (window.timeSystem && window.timeSystem.gameTime && window.timeSystem.gameTime.currentHour != null) {
                return window.timeSystem.gameTime.currentHour;
            }
        } catch (e) {}
        return 12;
    }

    // ============ 状态查询 ============
    // 是否处于残魂态（肉身已毁，神魂暂存）
    function isInSoulState() {
        var cd = window.currentCharData;
        return !!(cd && cd.soulState && cd.soulState.active);
    }

    // 是否处于「境界不稳」虚弱期（重塑后3天）
    function isRealmUnstable() {
        var cd = window.currentCharData;
        if (!cd || !cd.soulState || !cd.soulState.weakUntilDay) return false;
        return getCurrentDay() < cd.soulState.weakUntilDay;
    }

    // 战斗属性虚弱倍率（接入 battle.js getAttack/getDefense/getSpeed）
    function getRealmUnstableMultiplier() {
        return isRealmUnstable() ? 0.9 : 1;
    }

    // 重塑费用：500 × (境界序 + 1)，金丹=1500 … 渡劫=4500
    function getReshapeCost() {
        var cd = window.currentCharData;
        var idx = (cd && cd.soulState && cd.soulState.realmIndex != null) ? cd.soulState.realmIndex : 2;
        return 500 * (idx + 1);
    }

    // ============ 肉身毁判定 ============
    // 头/颈/胸任一部位耐久归零，或血量耗尽 → 肉身被毁级死亡
    function isBodyDestroyedLevel(battle) {
        if (!battle || !battle.player) return false;
        var p = battle.player;
        // 危急计时死亡 / 血量耗尽
        try {
            if (p.physiology && (p.physiology.bloodVolume <= 0)) return true;
        } catch (e) {}
        // 要害部位归零
        if (p.durabilities) {
            var vital = ['head', 'neck', 'chest', 'brain'];
            for (var i = 0; i < vital.length; i++) {
                var v = p.durabilities[vital[i]];
                if (v != null && v <= 0) return true;
            }
        }
        return false;
    }

    // ============ 进入残魂态（战败分支调用） ============
    // 返回 true 表示已接管本次战败（金丹+ 且肉身被毁），不再走普通战败复活
    function maybeEnterSoulState(battle) {
        var cd = window.currentCharData;
        if (!cd) return false;
        if (getRealmIndex(cd) < 2) return false;          // 炼气/筑基维持原流程
        if (!isBodyDestroyedLevel(battle)) return false;  // 非肉身毁级维持原流程
        if (isInSoulState()) return true;                 // 已在残魂态（防重复）

        cd.soulState = {
            active: true,
            bodyDestroyed: true,
            realmIndex: getRealmIndex(cd),
            sinceDay: getCurrentDay(),
            weakUntilDay: 0,
            lostCultivation: 0
        };

        if (typeof window.showMessage === 'function') {
            window.showMessage('💀 你的肉身在战斗中彻底崩毁……', 'error');
            window.showMessage('👻 但金丹修士，神魂不灭。你的神魂从残躯中离体而出。', 'info');
            window.showMessage('💡 残魂之体无法战斗与修炼，但可行走与交易。尽快重塑肉身。', 'warning');
        }
        showSoulStatePanel();
        return true;
    }

    // ============ 行动拦截（返回 true 表示已拦截） ============
    function checkSoulBlock(actionName) {
        if (!isInSoulState()) return false;
        if (typeof window.showMessage === 'function') {
            window.showMessage('💀 肉身已毁，神魂之体无法' + actionName + '。请先重塑肉身。', 'warning');
        }
        showSoulStatePanel();
        return true;
    }

    // ============ 重塑肉身 ============
    function reshapeBody() {
        var cd = window.currentCharData;
        if (!cd || !isInSoulState()) return false;

        var cost = getReshapeCost();

        // 双源灵石检查与扣除（与 restAtInn 同模式）
        var stones = 0;
        if (window.XianXia && window.XianXia.DataManager) stones = window.XianXia.DataManager.getSpiritStones();
        else stones = (window.inventory && window.inventory.currency && window.inventory.currency.spiritStones) || 0;
        if (stones < cost) {
            if (typeof window.showMessage === 'function') {
                window.showMessage('重塑肉身需要 ' + cost + ' 灵石（当前：' + stones + '）。残魂可照常交易，先筹措灵石吧。', 'error');
            }
            return false;
        }
        if (window.XianXia && window.XianXia.DataManager) window.XianXia.DataManager.deductSpiritStones(cost);
        else if (window.inventory && window.inventory.currency) window.inventory.currency.spiritStones -= cost;

        // 推进3天
        if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
            try { window.timeSystem.advanceTime(4320, '重塑肉身'); } catch (e) {}
        }

        // 损失10%当前修为（历练/真元），属性/灵根/技能全保留
        var lostT = 0, lostE = 0;
        if (cd.tempering > 0) { lostT = Math.floor(cd.tempering * 0.1); cd.tempering -= lostT; }
        if (cd.essence > 0) { lostE = Math.floor(cd.essence * 0.1); cd.essence -= lostE; }

        // 重塑躯体：按当前属性重新生成满耐久（属性未变 → 与原上限一致）
        try {
            var fresh = (typeof window.initBodyDurability === 'function')
                ? window.initBodyDurability(cd.attrs || {}) : null;
            if (fresh) {
                window.bodyDurability = fresh;
                if (cd) cd.bodyDurability = Object.assign({}, fresh);
                window._savedDurabilities = Object.assign({}, fresh);
                window._savedMaxDurabilities = Object.assign({}, fresh);
                if (window._playerEntity) {
                    window._playerEntity.durabilities = Object.assign({}, fresh);
                    window._playerEntity.maxDurabilities = Object.assign({}, fresh);
                    if (window._playerEntity.physiology) {
                        window._playerEntity.physiology.wounds = [];
                        window._playerEntity.physiology.bloodVolume = window._playerEntity.physiology.maxBloodVolume || 100;
                        // 兼容字段同步（单一权威链路：重塑后血量满值）
                        window._playerEntity.physiology.health = window._playerEntity.physiology.bloodVolume;
                        window._playerEntity.physiology.circulation = 100;
                        window._playerEntity.physiology.oxygenDebt = 0;
                        window._playerEntity.physiology.criticalTimer = -1;
                        window._playerEntity.physiology.consciousness = 100;
                    }
                }
            }
        } catch (e) { console.warn('[SoulState] 躯体重塑异常:', e); }

        // 资源回满
        cd.health = cd.maxHealth || 100;
        cd.qi = cd.maxQi || 100;
        cd.energy = cd.maxEnergy || 100;

        // 结束残魂态，进入3天「境界不稳」
        var day = getCurrentDay();
        cd.soulState = {
            active: false,
            bodyDestroyed: false,
            realmIndex: cd.soulState.realmIndex,
            sinceDay: day,
            weakUntilDay: day + 3,
            lostCultivation: lostT + lostE
        };

        if (typeof window.showMessage === 'function') {
            window.showMessage('✨ 三日聚灵塑体，新的肉身重塑成功！', 'success');
            window.showMessage('💰 消耗灵石 ' + cost + '，修为损失（历练' + lostT + '/真元' + lostE + '）。属性与功法完好保留。', 'info');
            window.showMessage('⚠️ 境界不稳：未来3天战斗属性下降10%。', 'warning');
        }
        closeSoulPanel();
        if (typeof window.updateCharacterStatus === 'function') { try { window.updateCharacterStatus(); } catch (e) {} }
        if (typeof window.renderBodyDurability === 'function') { try { window.renderBodyDurability(); } catch (e) {} }
        if (typeof window.updateCurrencyUI === 'function') { try { window.updateCurrencyUI(); } catch (e) {} }
        return true;
    }

    // ============ 残魂面板 ============
    function closeSoulPanel() {
        var overlay = document.getElementById('soul-state-overlay');
        if (overlay) overlay.remove();
    }

    function showSoulStatePanel() {
        var cd = window.currentCharData;
        if (!cd) return;
        closeSoulPanel();

        var overlay = document.createElement('div');
        overlay.id = 'soul-state-overlay';
        overlay.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50';

        var inSoul = isInSoulState();
        var unstable = isRealmUnstable();
        var realmName = REALM_NAMES[getRealmIndex(cd)] || '炼气';
        var cost = getReshapeCost();
        var stones = 0;
        if (window.XianXia && window.XianXia.DataManager) stones = window.XianXia.DataManager.getSpiritStones();
        else stones = (window.inventory && window.inventory.currency && window.inventory.currency.spiritStones) || 0;

        var bodyHtml;
        if (inSoul) {
            bodyHtml = '<div class="text-center mb-4">'
                + '<div class="text-6xl mb-2">👻</div>'
                + '<p class="text-gray-300 text-sm">你的肉身已毁，一缕神魂暂寄天地。</p>'
                + '<p class="text-gray-500 text-xs mt-1">残魂可行走与交易，但无法战斗、修炼、演武与突破。</p>'
                + '</div>'
                + '<div class="bg-gray-900 rounded p-3 text-sm space-y-1 mb-4">'
                + '<div class="flex justify-between"><span class="text-gray-400">重塑费用</span><span class="' + (stones >= cost ? 'text-green-400' : 'text-red-400') + '">💎 ' + cost + ' 灵石（现有 ' + stones + '）</span></div>'
                + '<div class="flex justify-between"><span class="text-gray-400">重塑耗时</span><span>⏳ 3 天</span></div>'
                + '<div class="flex justify-between"><span class="text-gray-400">修为代价</span><span>当前历练/真元各 -10%</span></div>'
                + '<div class="flex justify-between"><span class="text-gray-400">属性/灵根/功法</span><span class="text-green-400">全部保留</span></div>'
                + '<div class="flex justify-between"><span class="text-gray-400">重塑后</span><span class="text-yellow-500">「境界不稳」3天（战斗-10%）</span></div>'
                + '</div>'
                + '<button onclick="window.SoulStateSystem.reshapeBody()" class="w-full bg-purple-700 hover:bg-purple-600 text-white py-2 rounded font-bold mb-2">✨ 重塑肉身</button>';
        } else if (unstable) {
            bodyHtml = '<div class="text-center mb-4">'
                + '<div class="text-6xl mb-2">🌀</div>'
                + '<p class="text-gray-300 text-sm">重塑的躯体外相如常，但境界尚未稳固。</p>'
                + '</div>'
                + '<div class="bg-gray-900 rounded p-3 text-sm mb-4">'
                + '<div class="flex justify-between"><span class="text-gray-400">「境界不稳」剩余</span><span class="text-yellow-500">' + Math.max(1, cd.soulState.weakUntilDay - getCurrentDay()) + ' 天（战斗属性 ×0.9）</span></div>'
                + '</div>';
        } else {
            bodyHtml = '<p class="text-gray-400 text-sm text-center">肉身完好，神魂安宁。</p>';
        }

        overlay.innerHTML = '<div class="bg-gray-800 border-2 border-purple-600 rounded-xl p-5 max-w-md w-full mx-4">'
            + '<div class="flex justify-between items-center mb-3">'
            + '<h3 class="text-lg font-bold text-purple-300">👻 神魂状态 · ' + realmName + (inSoul ? '（残魂）' : '') + '</h3>'
            + '<button onclick="window.SoulStateSystem.closePanel()" class="text-gray-400 hover:text-white text-xl leading-none">&times;</button>'
            + '</div>' + bodyHtml
            + '<button onclick="window.SoulStateSystem.closePanel()" class="w-full bg-gray-700 hover:bg-gray-600 text-gray-200 py-1.5 rounded text-sm">关闭</button>'
            + '</div>';

        overlay.addEventListener('click', function (e) { if (e.target === overlay) closeSoulPanel(); });
        document.body.appendChild(overlay);
    }

    // ============ 导出 ============
    window.SoulStateSystem = {
        isInSoulState: isInSoulState,
        isRealmUnstable: isRealmUnstable,
        getRealmUnstableMultiplier: getRealmUnstableMultiplier,
        getReshapeCost: getReshapeCost,
        maybeEnterSoulState: maybeEnterSoulState,
        checkSoulBlock: checkSoulBlock,
        reshapeBody: reshapeBody,
        showSoulStatePanel: showSoulStatePanel,
        closePanel: closeSoulPanel
    };
    // 便捷全局
    window.isInSoulState = isInSoulState;
    window.checkSoulBlock = checkSoulBlock;
    window.maybeEnterSoulState = maybeEnterSoulState;
    window.showSoulStatePanel = showSoulStatePanel;
    window.getRealmUnstableMultiplier = getRealmUnstableMultiplier;

    console.log('[SoulState] 死亡仙侠化·神魂系统加载完成（P0-5）');
})();
