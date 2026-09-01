/**
 * debug-panel.js — 调试面板（Admin 专属作弊功能）
 * 当角色名称为 "admin" 时，设置页下方会出现调试面板
 */
(function () {
    'use strict';

    // ===== 境界列表（与全局一致） =====
    var REALM_LIST = ['炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'];

    // ===== 层数名称 =====
    var LAYER_NAMES = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

    // ===== 主属性列表 =====
    var MAIN_ATTRS = [
        { key: '力量', en: 'strength', icon: '💪' },
        { key: '灵巧', en: 'dexterity', icon: '🏃' },
        { key: '体质', en: 'constitution', icon: '🛡️' },
        { key: '神识', en: 'intelligence', icon: '🧠' },
        { key: '意志', en: 'willpower', icon: '🔥' },
        { key: '经脉', en: 'meridian', icon: '⚡' }
    ];

    // ===== 战斗技能列表（与 data.js 保持一致） =====
    var COMBAT_SKILLS = ['内功', '轻功', '绝技', '拳掌', '剑法', '刀法', '长兵', '奇门', '射术'];

    // ===== 生活技能列表（与 data.js 保持一致） =====
    var LIFE_SKILLS = ['医术', '毒术', '学识', '口才', '采伐', '种植', '锻造', '炼制', '烹饪'];

    // ===== 灵根列表 =====
    var ROOTS = [
        { key: 'metal', name: '金' },
        { key: 'wood', name: '木' },
        { key: 'water', name: '水' },
        { key: 'fire', name: '火' },
        { key: 'earth', name: '土' }
    ];

    // ===== 变异灵根 =====
    var MUTATED_ROOTS = [
        { key: 'thunder', name: '雷', icon: '⚡' },
        { key: 'wind', name: '风', icon: '🌪️' },
        { key: 'ice', name: '冰', icon: '❄️' }
    ];

    // ===== 物品快速选择 =====
    var ITEM_QUICK_IDS = {
        '丹药·筑基丹': 'foundation_pill',
        '丹药·小还丹': 'pill_small_recovery',
        '丹药·大还丹': 'pill_great_recovery',
        '丹药·聚气丹': 'pill_qi_return',
        '丹药·洗髓丹': 'pill_marrow_cleansing',
        '丹药·延寿丹': 'spec_longevity_pill',
        '材料·灵芝': 'mat_lingzhi',
        '材料·火晶': 'mat_fire_crystal',
        '材料·龙晶': 'mat_dragon_crystal',
        '武器·精铁剑': 'iron_sword',
        '武器·霜月剑': 'wpn_frost_moon',
        '功法·太极拳': 'art_taiji_sword',
        '功法·降龙掌': 'art_dragon_subdue_palm'
    };

    // ===== 调试状态 =====
    var debugState = {
        isAdmin: false
    };

    // ===== 检测是否为 Admin 角色 =====
    function checkAdminStatus() {
        var charData = window.currentCharData;
        if (charData && charData.name && charData.name.toLowerCase() === 'admin') {
            debugState.isAdmin = true;
            window._isAdmin = true;
            return true;
        }
        debugState.isAdmin = false;
        window._isAdmin = false;
        return false;
    }

    // ===== 渲染调试面板 =====
    function renderDebugPanel() {
        var container = document.getElementById('debug-panel-content');
        if (!container) return;

        if (!checkAdminStatus()) {
            container.innerHTML = '';
            return;
        }

        var charData = window.currentCharData;
        if (!charData) {
            container.innerHTML = '<p class="text-gray-500 text-sm">请先创建角色</p>';
            return;
        }

        var html = '';
        html += _renderSectionTitle('💰 货币修改');
        html += _renderCurrencySection(charData);

        html += _renderSectionTitle('🔮 境界修改');
        html += _renderRealmSection(charData);

        html += _renderSectionTitle('📊 属性修改');
        html += _renderAttributesSection(charData);

        html += _renderSectionTitle('⚔️ 战斗技能');
        html += _renderCombatSkillsSection(charData);

        html += _renderSectionTitle('🔧 生活技能');
        html += _renderLifeSkillsSection(charData);

        html += _renderSectionTitle('🌿 灵根修改');
        html += _renderRootsSection(charData);

        html += _renderSectionTitle('📦 添加物品');
        html += _renderItemSection();

        html += _renderSectionTitle('⚡ 快捷操作');
        html += _renderQuickActionsSection(charData);

        html += _renderSectionTitle('🕐 时间操控');
        html += _renderTimeSection();

        container.innerHTML = html;
    }

    // ===== 渲染部分标题 =====
    function _renderSectionTitle(title) {
        return '<h4 class="text-md font-bold text-yellow-400 mt-4 mb-2 border-b border-gray-600 pb-1">' + title + '</h4>';
    }

    // ===== 货币修改 =====
    function _renderCurrencySection(charData) {
        var stones = charData.spiritStones || 0;
        var copper = charData.copper || 0;
        return '<div class="grid grid-cols-2 gap-3 mb-2">' +
            '<div class="bg-gray-700/50 p-2 rounded">' +
            '<label class="text-xs text-gray-400">灵石</label>' +
            '<div class="flex gap-1 mt-1">' +
            '<input type="number" id="debug-stones" value="' + stones + '" class="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm w-20">' +
            '<button onclick="window.DebugPanel.setStones()" class="bg-yellow-700 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs">设置</button>' +
            '<button onclick="window.DebugPanel.addStones()" class="bg-green-700 hover:bg-green-600 text-white px-2 py-1 rounded text-xs">+1万</button>' +
            '</div></div>' +
            '<div class="bg-gray-700/50 p-2 rounded">' +
            '<label class="text-xs text-gray-400">铜钱</label>' +
            '<div class="flex gap-1 mt-1">' +
            '<input type="number" id="debug-copper" value="' + copper + '" class="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm w-20">' +
            '<button onclick="window.DebugPanel.setCopper()" class="bg-yellow-700 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs">设置</button>' +
            '<button onclick="window.DebugPanel.addCopper()" class="bg-green-700 hover:bg-green-600 text-white px-2 py-1 rounded text-xs">+1万</button>' +
            '</div></div></div>';
    }

    // ===== 境界修改 =====
    function _renderRealmSection(charData) {
        var currentRealm = charData.realm || '炼气';
        var currentLayer = charData.layer || 1;
        var realmOpts = REALM_LIST.map(function (r) {
            var sel = r === currentRealm ? 'selected' : '';
            return '<option value="' + r + '" ' + sel + '>' + r + '</option>';
        }).join('');
        var layerOpts = '';
        for (var i = 1; i <= 9; i++) {
            var sel = i === currentLayer ? 'selected' : '';
            layerOpts += '<option value="' + i + '" ' + sel + '>' + LAYER_NAMES[i] + '期</option>';
        }
        return '<div class="flex gap-2 items-center mb-2">' +
            '<select id="debug-realm" class="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm">' + realmOpts + '</select>' +
            '<select id="debug-layer" class="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm">' + layerOpts + '</select>' +
            '<button onclick="window.DebugPanel.setRealm()" class="bg-purple-700 hover:bg-purple-600 text-white px-3 py-1 rounded text-xs">设置境界</button>' +
            '</div>' +
            '<div class="flex gap-2 items-center mb-2">' +
            '<label class="text-xs text-gray-400">真元/历练</label>' +
            '<input type="number" id="debug-essence" value="' + (charData.essence || 0) + '" placeholder="真元" class="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm w-20">' +
            '<input type="number" id="debug-tempering" value="' + (charData.tempering || 0) + '" placeholder="历练" class="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm w-20">' +
            '<button onclick="window.DebugPanel.setEssenceTempering()" class="bg-purple-700 hover:bg-purple-600 text-white px-2 py-1 rounded text-xs">设置</button>' +
            '</div>';
    }

    // ===== 属性修改 =====
    function _renderAttributesSection(charData) {
        var ma = charData.mainAttributes || {};
        var html = '<div class="grid grid-cols-3 gap-2 mb-2">';
        MAIN_ATTRS.forEach(function (attr) {
            var val = ma[attr.key] || 10;
            html += '<div class="bg-gray-700/50 p-1 rounded flex items-center gap-1">' +
                '<span class="text-xs text-gray-400" title="' + attr.key + '">' + attr.icon + '</span>' +
                '<input type="number" id="debug-attr-' + attr.key + '" value="' + val + '" min="1" max="100" class="flex-1 bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-white text-xs w-12">' +
                '</div>';
        });
        html += '</div>' +
            '<button onclick="window.DebugPanel.setAllAttrs()" class="bg-blue-700 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs mb-2">全部设为100</button>' +
            '<button onclick="window.DebugPanel.setAttrsFromInputs()" class="bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded text-xs mb-2 ml-2">应用属性</button>';
        return html;
    }

    // ===== 战斗技能 =====
    function _renderCombatSkillsSection(charData) {
        var cs = charData.combatSkills || {};
        var html = '<div class="grid grid-cols-3 gap-2 mb-2">';
        COMBAT_SKILLS.forEach(function (sk) {
            var val = cs[sk] || 0;
            html += '<div class="bg-gray-700/50 p-1 rounded flex items-center gap-1">' +
                '<span class="text-xs text-gray-400">' + sk + '</span>' +
                '<input type="number" id="debug-cs-' + sk + '" value="' + val + '" min="0" max="100" class="flex-1 bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-white text-xs w-12">' +
                '</div>';
        });
        html += '</div>' +
            '<button onclick="window.DebugPanel.setAllCombatSkills()" class="bg-blue-700 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs mb-2">全部100</button>' +
            '<button onclick="window.DebugPanel.applyCombatSkills()" class="bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded text-xs mb-2 ml-2">应用技能</button>';
        return html;
    }

    // ===== 生活技能 =====
    function _renderLifeSkillsSection(charData) {
        var ls = charData.lifeSkills || {};
        var html = '<div class="grid grid-cols-3 gap-2 mb-2">';
        LIFE_SKILLS.forEach(function (sk) {
            var val = ls[sk] || 0;
            html += '<div class="bg-gray-700/50 p-1 rounded flex items-center gap-1">' +
                '<span class="text-xs text-gray-400">' + sk + '</span>' +
                '<input type="number" id="debug-ls-' + sk + '" value="' + val + '" min="0" max="100" class="flex-1 bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-white text-xs w-12">' +
                '</div>';
        });
        html += '</div>' +
            '<button onclick="window.DebugPanel.setAllLifeSkills()" class="bg-blue-700 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs mb-2">全部100</button>' +
            '<button onclick="window.DebugPanel.applyLifeSkills()" class="bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded text-xs mb-2 ml-2">应用技能</button>';
        return html;
    }

    // ===== 灵根修改 =====
    function _renderRootsSection(charData) {
        var sr = charData.spiritualRoots || {};
        var html = '<div class="flex gap-2 items-center mb-2 flex-wrap">';
        ROOTS.forEach(function (r) {
            var val = sr[r.key] || 0;
            html += '<div class="bg-gray-700/50 p-1 rounded flex items-center gap-1">' +
                '<span class="text-xs text-gray-400">' + r.name + '</span>' +
                '<input type="number" id="debug-root-' + r.key + '" value="' + val + '" min="0" max="100" class="bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-white text-xs w-14">' +
                '</div>';
        });
        html += '</div>' +
            '<button onclick="window.DebugPanel.setAllRoots()" class="bg-blue-700 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs mb-2">灵根全100</button>';

        var mr = charData.mutatedRoots || {};
        html += '<div class="flex gap-3 items-center mb-2 flex-wrap">';
        MUTATED_ROOTS.forEach(function (r) {
            var checked = mr[r.key] ? 'checked' : '';
            html += '<label class="flex items-center gap-1 text-xs text-gray-300 cursor-pointer">' +
                '<input type="checkbox" id="debug-mroot-' + r.key + '" ' + checked + ' class="form-checkbox h-4 w-4 text-yellow-500 rounded">' +
                r.icon + ' ' + r.name + '灵根</label>';
        });
        html += '</div>' +
            '<button onclick="window.DebugPanel.applyMutatedRoots()" class="bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded text-xs mb-2">应用变异灵根</button>';
        return html;
    }

    // ===== 添加物品 =====
    function _renderItemSection() {
        var html = '<div class="flex gap-2 items-center mb-2 flex-wrap">' +
            '<input type="text" id="debug-item-id" placeholder="物品ID" class="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm w-28">' +
            '<input type="number" id="debug-item-count" value="1" min="1" class="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm w-16">' +
            '<button onclick="window.DebugPanel.addItem()" class="bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded text-xs">添加</button>' +
            '</div>' +
            '<div class="flex gap-1 flex-wrap mb-2">';
        var keys = Object.keys(ITEM_QUICK_IDS);
        keys.forEach(function (name) {
            html += '<button onclick="window.DebugPanel.quickAddItem(\'' + ITEM_QUICK_IDS[name] + '\')" class="bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-0.5 rounded text-xs border border-gray-600">' + name + '</button>';
        });
        html += '</div>' +
            '<button onclick="window.DebugPanel.addAllItems()" class="bg-red-800 hover:bg-red-700 text-white px-3 py-1 rounded text-xs">⚠️ 添加所有物品（可能卡顿）</button>';
        return html;
    }

    // ===== 快捷操作 =====
    function _renderQuickActionsSection(charData) {
        var karma = charData.karma || 0;
        var order = charData.order || 0;
        var fame = charData.fame || 0;

        return '<div class="flex gap-2 flex-wrap mb-2">' +
            '<button onclick="window.DebugPanel.fullRecovery()" class="bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded text-xs">💚 全恢复满</button>' +
            '<button onclick="window.DebugPanel.maxLevel()" class="bg-purple-700 hover:bg-purple-600 text-white px-3 py-1 rounded text-xs">⬆️ 升到满级</button>' +
            '<button onclick="window.DebugPanel.maxRealm()" class="bg-yellow-700 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs">👑 飞升渡劫</button>' +
            '</div>' +
            '<div class="grid grid-cols-3 gap-2 mb-2">' +
            '<div class="bg-gray-700/50 p-1 rounded"><label class="text-xs text-gray-400">善恶值</label>' +
            '<input type="number" id="debug-karma" value="' + karma + '" class="bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-white text-xs w-full mt-1">' +
            '<button onclick="window.DebugPanel.setKarma()" class="bg-yellow-700 hover:bg-yellow-600 text-white w-full mt-1 py-0.5 rounded text-xs">设置</button></div>' +
            '<div class="bg-gray-700/50 p-1 rounded"><label class="text-xs text-gray-400">秩序值</label>' +
            '<input type="number" id="debug-order" value="' + order + '" class="bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-white text-xs w-full mt-1">' +
            '<button onclick="window.DebugPanel.setOrder()" class="bg-yellow-700 hover:bg-yellow-600 text-white w-full mt-1 py-0.5 rounded text-xs">设置</button></div>' +
            '<div class="bg-gray-700/50 p-1 rounded"><label class="text-xs text-gray-400">角色名气（非城市声望）</label>' +
            '<input type="number" id="debug-fame" value="' + fame + '" class="bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-white text-xs w-full mt-1">' +
            '<button onclick="window.DebugPanel.setFame()" class="bg-yellow-700 hover:bg-yellow-600 text-white w-full mt-1 py-0.5 rounded text-xs">设置</button></div>' +
            '</div>' +
            '<div class="bg-gray-700/40 border border-cyan-900/60 rounded p-2 mb-2">' +
            '<div class="flex flex-wrap items-end gap-2">' +
            '<div class="flex-1 min-w-[180px]"><label class="text-xs text-cyan-300">当前城市声望（0-10000）</label>' +
            '<input type="number" id="debug-city-reputation" value="' + ((typeof window.getCurrentCityName === 'function' && typeof window.getReputationValue === 'function' && window.getCurrentCityName()) ? window.getReputationValue(window.getCurrentCityName()) : 0) + '" class="bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-white text-xs w-full mt-1"></div>' +
            '<button onclick="window.DebugPanel.setCurrentCityReputation()" class="bg-cyan-700 hover:bg-cyan-600 text-white px-3 py-1 rounded text-xs">设置当前城</button>' +
            '<button onclick="window.DebugPanel.maxCurrentCityReputation()" class="bg-indigo-700 hover:bg-indigo-600 text-white px-3 py-1 rounded text-xs">当前城10000</button>' +
            '<button onclick="window.DebugPanel.maxAllCityReputation()" class="bg-purple-700 hover:bg-purple-600 text-white px-3 py-1 rounded text-xs">全部城市10000</button></div>' +
            '<p class="text-[11px] text-gray-500 mt-1">特殊许可需当前城市声望6000；皇家拍卖场需3000或持有特殊许可。角色名气不会代替城市声望。</p></div>' +
            '<div class="flex gap-2 flex-wrap">' +
            '<button onclick="window.DebugPanel.clearDebuffs()" class="bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded text-xs">🧹 清除异常状态</button>' +
            '<button onclick="window.DebugPanel.resetCooldowns()" class="bg-blue-700 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs">⏱️ 重置冷却</button>' +
            '<button onclick="window.DebugPanel.unlockAllMap()" class="bg-indigo-700 hover:bg-indigo-600 text-white px-3 py-1 rounded text-xs">🗺️ 解锁全地图</button>' +
            '</div>';
    }

    // ===== 时间操控 =====
    function _renderTimeSection() {
        var timeStr = '';
        if (window.timeSystem && window.timeSystem.gameTime) {
            var gt = window.timeSystem.gameTime;
            timeStr = '第' + (gt.currentDay || 1) + '天 ' + (gt.hour || 6) + ':' + (String(gt.minute || 0).padStart(2, '0'));
        }
        return '<div class="text-xs text-gray-400 mb-1">当前时间：' + timeStr + '</div>' +
            '<div class="flex gap-2 flex-wrap">' +
            '<button onclick="window.DebugPanel.advanceHour()" class="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs">+1小时</button>' +
            '<button onclick="window.DebugPanel.advanceDay()" class="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs">+1天</button>' +
            '<button onclick="window.DebugPanel.advanceWeek()" class="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs">+7天</button>' +
            '<button onclick="window.DebugPanel.advanceMonth()" class="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs">+30天</button>' +
            '</div>';
    }

    // ========== 辅助函数 ==========

    function _getCharData() {
        return window.currentCharData;
    }

    function _refreshUI() {
        if (typeof window.updateCharacterStatus === 'function') window.updateCharacterStatus();
        if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI();
        if (typeof window.updateInventoryUI === 'function') window.updateInventoryUI();
        if (typeof window.updateCultivationUI === 'function') window.updateCultivationUI();
    }

    function _showMsg(msg, type) {
        if (typeof window.showMessage === 'function') {
            window.showMessage('[调试] ' + msg, type || 'info');
        } else {
            console.log('[调试] ' + msg);
        }
    }

    // ========== 动作函数（导出到 window.DebugPanel） ==========

    // 设置灵石
    function setStones() {
        var val = parseInt(document.getElementById('debug-stones').value) || 0;
        var cd = _getCharData();
        if (!cd) return;
        cd.spiritStones = val;
        if (window.inventory && window.inventory.currency) {
            window.inventory.currency.spiritStones = val;
        }
        _showMsg('灵石已设置为 ' + val, 'success');
        _refreshUI();
    }

    // 增加灵石
    function addStones() {
        var cd = _getCharData();
        if (!cd) return;
        var add = 10000;
        cd.spiritStones = (cd.spiritStones || 0) + add;
        if (window.inventory && window.inventory.currency) {
            window.inventory.currency.spiritStones = cd.spiritStones;
        }
        var input = document.getElementById('debug-stones');
        if (input) input.value = cd.spiritStones;
        _showMsg('灵石 +' + add, 'success');
        _refreshUI();
    }

    // 设置铜钱
    function setCopper() {
        var val = parseInt(document.getElementById('debug-copper').value) || 0;
        var cd = _getCharData();
        if (!cd) return;
        cd.copper = val;
        if (window.inventory && window.inventory.currency) {
            window.inventory.currency.copper = val;
        }
        _showMsg('铜钱已设置为 ' + val, 'success');
        _refreshUI();
    }

    // 增加铜钱
    function addCopper() {
        var cd = _getCharData();
        if (!cd) return;
        var add = 10000;
        cd.copper = (cd.copper || 0) + add;
        if (window.inventory && window.inventory.currency) {
            window.inventory.currency.copper = cd.copper;
        }
        var input = document.getElementById('debug-copper');
        if (input) input.value = cd.copper;
        _showMsg('铜钱 +' + add, 'success');
        _refreshUI();
    }

    // 设置境界
    function setRealm() {
        var cd = _getCharData();
        if (!cd) return;
        var realm = document.getElementById('debug-realm').value;
        var layer = parseInt(document.getElementById('debug-layer').value) || 1;
        cd.realm = realm;
        cd.layer = layer;
        var realmIndex = REALM_LIST.indexOf(realm);
        cd.maxQi = 100 * (realmIndex + 1);
        cd.qi = cd.maxQi;
        _showMsg('境界已设置为 ' + realm + ' ' + LAYER_NAMES[layer] + '期', 'success');
        _refreshUI();
    }

    // 设置真元/历练
    function setEssenceTempering() {
        var cd = _getCharData();
        if (!cd) return;
        var essence = parseInt(document.getElementById('debug-essence').value) || 0;
        var tempering = parseInt(document.getElementById('debug-tempering').value) || 0;
        cd.essence = essence;
        cd.tempering = tempering;
        _showMsg('真元/历练已设置', 'success');
        _refreshUI();
    }

    // 全属性100
    function setAllAttrs() {
        var cd = _getCharData();
        if (!cd) return;
        if (!cd.mainAttributes) cd.mainAttributes = {};
        if (!cd.attrs) cd.attrs = {};
        MAIN_ATTRS.forEach(function (attr) {
            cd.mainAttributes[attr.key] = 100;
            cd.attrs[attr.en] = 100;
        });
        MAIN_ATTRS.forEach(function (attr) {
            var input = document.getElementById('debug-attr-' + attr.key);
            if (input) input.value = 100;
        });
        _showMsg('所有主属性已设为100', 'success');
        _refreshUI();
    }

    // 从输入框应用属性
    function setAttrsFromInputs() {
        var cd = _getCharData();
        if (!cd) return;
        if (!cd.mainAttributes) cd.mainAttributes = {};
        if (!cd.attrs) cd.attrs = {};
        MAIN_ATTRS.forEach(function (attr) {
            var input = document.getElementById('debug-attr-' + attr.key);
            if (input) {
                var val = parseInt(input.value) || 10;
                cd.mainAttributes[attr.key] = val;
                cd.attrs[attr.en] = val;
            }
        });
        _showMsg('属性已应用', 'success');
        _refreshUI();
    }

    // 战斗技能全100
    function setAllCombatSkills() {
        var cd = _getCharData();
        if (!cd) return;
        if (!cd.combatSkills) cd.combatSkills = {};
        COMBAT_SKILLS.forEach(function (sk) {
            cd.combatSkills[sk] = 100;
            var input = document.getElementById('debug-cs-' + sk);
            if (input) input.value = 100;
        });
        _showMsg('所有战斗技能已设为100', 'success');
        _refreshUI();
    }

    // 应用战斗技能
    function applyCombatSkills() {
        var cd = _getCharData();
        if (!cd) return;
        if (!cd.combatSkills) cd.combatSkills = {};
        COMBAT_SKILLS.forEach(function (sk) {
            var input = document.getElementById('debug-cs-' + sk);
            if (input) {
                cd.combatSkills[sk] = parseInt(input.value) || 0;
            }
        });
        _showMsg('战斗技能已应用', 'success');
        _refreshUI();
    }

    // 生活技能全100
    function setAllLifeSkills() {
        var cd = _getCharData();
        if (!cd) return;
        if (!cd.lifeSkills) cd.lifeSkills = {};
        LIFE_SKILLS.forEach(function (sk) {
            cd.lifeSkills[sk] = 100;
            var input = document.getElementById('debug-ls-' + sk);
            if (input) input.value = 100;
        });
        _showMsg('所有生活技能已设为100', 'success');
        _refreshUI();
    }

    // 应用生活技能
    function applyLifeSkills() {
        var cd = _getCharData();
        if (!cd) return;
        if (!cd.lifeSkills) cd.lifeSkills = {};
        LIFE_SKILLS.forEach(function (sk) {
            var input = document.getElementById('debug-ls-' + sk);
            if (input) {
                cd.lifeSkills[sk] = parseInt(input.value) || 0;
            }
        });
        _showMsg('生活技能已应用', 'success');
        _refreshUI();
    }

    // 灵根全100
    function setAllRoots() {
        var cd = _getCharData();
        if (!cd) return;
        if (!cd.spiritualRoots) cd.spiritualRoots = {};
        ROOTS.forEach(function (r) {
            cd.spiritualRoots[r.key] = 100;
            var input = document.getElementById('debug-root-' + r.key);
            if (input) input.value = 100;
        });
        _showMsg('灵根已全部设为100', 'success');
        _refreshUI();
    }

    // 应用变异灵根
    function applyMutatedRoots() {
        var cd = _getCharData();
        if (!cd) return;
        if (!cd.mutatedRoots) cd.mutatedRoots = {};
        MUTATED_ROOTS.forEach(function (r) {
            var cb = document.getElementById('debug-mroot-' + r.key);
            if (cb) cd.mutatedRoots[r.key] = cb.checked;
        });
        _showMsg('变异灵根已应用', 'success');
        _refreshUI();
    }

    // 直接委托内部 addItem（_addItemRaw 已在 inventory.js 提前定义，安全无递归）
    function _debugAddItem(id, count) {
        if (typeof window._addItemRaw === 'function') {
            return window._addItemRaw(id, count);
        }
        if (typeof window.addItem === 'function') {
            return window.addItem(id, count);
        }
        if (typeof window.addItemToInventory === 'function') {
            window.addItemToInventory(id, count);
            return true;
        }
        return false;
    }

    function addItem() {
        var id = document.getElementById('debug-item-id').value.trim();
        if (!id) { _showMsg('请输入物品ID', 'warning'); return; }
        var count = parseInt(document.getElementById('debug-item-count').value) || 1;
        var ok = _debugAddItem(id, count);
        if (ok) _showMsg('添加物品成功', 'success');
        else _showMsg('添加物品失败，请检查ID是否正确', 'error');
        _refreshUI();
    }

    function quickAddItem(id) {
        var count = parseInt(document.getElementById('debug-item-count').value) || 1;
        var ok = _debugAddItem(id, count);
        if (ok) _showMsg('快捷添加物品成功', 'success');
        else _showMsg('快捷添加物品失败', 'error');
        _refreshUI();
    }

    function addAllItems() {
        if (!window.allItems || !window.allItems.length) {
            _showMsg('物品数据未加载', 'error');
            return;
        }
        if (!confirm('确定要添加所有物品到背包吗？这可能会造成卡顿！')) return;
        var c = 0, e = 0;
        window.allItems.forEach(function (item) {
            if (item && item.id) {
                if (_debugAddItem(item.id, 1)) c++;
                else e++;
            }
        });
        _showMsg('添加完成：成功 ' + count + ' 个物品' + (errors ? '，失败 ' + errors + ' 个' : ''), 'success');
        _refreshUI();
    }

    // 全恢复满
    function fullRecovery() {
        var cd = _getCharData();
        if (!cd) return;
        cd.health = cd.maxHealth || 100;
        cd.qi = cd.maxQi || 100;
        cd.energy = cd.maxEnergy || 100;
        // 清除负面状态
        if (cd.statusEffects) cd.statusEffects = [];
        if (cd._debuffs) cd._debuffs = [];
        if (cd._poisoned) cd._poisoned = false;
        if (cd._confused) cd._confused = false;
        if (cd._negativeEmotion) cd._negativeEmotion = false;
        // 清除伤势
        if (typeof window.clearBodyDurability === 'function') {
            window.clearBodyDurability();
        }
        _showMsg('已完全恢复生命、真气、精力，并清除所有负面状态', 'success');
        _refreshUI();
    }

    // 升到满级
    function maxLevel() {
        var cd = _getCharData();
        if (!cd) return;
        cd.level = 999;
        cd.exp = 0;
        // 满属性
        if (!cd.mainAttributes) cd.mainAttributes = {};
        if (!cd.attrs) cd.attrs = {};
        MAIN_ATTRS.forEach(function (attr) {
            cd.mainAttributes[attr.key] = 100;
            cd.attrs[attr.en] = 100;
        });
        _showMsg('已升至满级999，属性全满', 'success');
        _refreshUI();
    }

    // 飞升渡劫（最高境界）
    function maxRealm() {
        var cd = _getCharData();
        if (!cd) return;
        cd.realm = '渡劫';
        cd.layer = 9;
        cd.maxQi = 900;
        cd.qi = 900;
        cd.essence = 99999;
        cd.tempering = 99999;
        _showMsg('已飞升至渡劫九层！', 'success');
        _refreshUI();
    }

    // 设置业力
    function setKarma() {
        var val = parseInt(document.getElementById('debug-karma').value) || 0;
        var cd = _getCharData();
        if (!cd) return;
        cd.karma = Math.max(-100, Math.min(100, val));
        _showMsg('业力已设置为 ' + cd.karma, 'success');
        _refreshUI();
    }

    // 设置秩序
    function setOrder() {
        var val = parseInt(document.getElementById('debug-order').value) || 0;
        var cd = _getCharData();
        if (!cd) return;
        cd.order = Math.max(-100, Math.min(100, val));
        _showMsg('秩序已设置为 ' + cd.order, 'success');
        _refreshUI();
    }

    // 设置名气值
    function setFame() {
        var val = parseInt(document.getElementById('debug-fame').value) || 0;
        var cd = _getCharData();
        if (!cd) return;
        cd.fame = Math.max(0, val);
        _showMsg('角色名气已设置为 ' + cd.fame + '（不影响城市声望门槛）', 'success');
        _refreshUI();
    }

    function _currentDebugCity() {
        if (typeof window.getCurrentCityName === 'function') return window.getCurrentCityName() || '';
        return (window.currentCharData && window.currentCharData.location) || '';
    }

    function setCurrentCityReputation() {
        var city = _currentDebugCity();
        if (!city) { _showMsg('请先进入城市', 'warning'); return; }
        if (typeof window.setReputation !== 'function') { _showMsg('城市声望服务不可用', 'error'); return; }
        var input = document.getElementById('debug-city-reputation');
        var val = input ? parseInt(input.value, 10) : 0;
        val = Math.max(0, Math.min(10000, Number.isFinite(val) ? val : 0));
        window.setReputation(city, val, { notify: false });
        _showMsg('【' + city + '】城市声望已设置为 ' + val, 'success');
        _refreshUI();
    }

    function maxCurrentCityReputation() {
        var city = _currentDebugCity();
        if (!city) { _showMsg('请先进入城市', 'warning'); return; }
        if (typeof window.setReputation !== 'function') { _showMsg('城市声望服务不可用', 'error'); return; }
        window.setReputation(city, 10000, { notify: false });
        _showMsg('【' + city + '】城市声望已设为10000，城市声望解锁已同步', 'success');
        _refreshUI();
    }

    function maxAllCityReputation() {
        if (typeof window.setReputation !== 'function') { _showMsg('城市声望服务不可用', 'error'); return; }
        var names = [];
        if (window.cityReputation) names = Object.keys(window.cityReputation);
        if (!names.length && typeof window.getAllCityNames === 'function') names = window.getAllCityNames();
        names.forEach(function(city) { window.setReputation(city, 10000, { notify: false, save: false }); });
        if (typeof window.saveReputation === 'function') window.saveReputation();
        _showMsg('全部城市声望已设为10000（共' + names.length + '城）', 'success');
        _refreshUI();
    }

    // 清除异常状态
    function clearDebuffs() {
        var cd = _getCharData();
        if (!cd) return;
        if (cd.statusEffects) cd.statusEffects = [];
        if (cd._debuffs) cd._debuffs = [];
        cd._poisoned = false;
        cd._confused = false;
        cd._negativeEmotion = false;
        cd._demonicCorruption = 0;
        if (typeof window.clearBodyDurability === 'function') {
            window.clearBodyDurability();
        }
        _showMsg('已清除所有异常状态', 'success');
        _refreshUI();
    }

    // 重置冷却
    function resetCooldowns() {
        // 清除所有以 xianxia_sect_cd_ 和 xianxia_specialty_ 开头的本地存储
        try {
            var toRemove = [];
            for (var i = 0; i < localStorage.length; i++) {
                var key = localStorage.key(i);
                if (!key) continue;
                if (key.indexOf('xianxia_sect_cd_') === 0) toRemove.push(key);
                if (key.indexOf('xianxia_specialty_') === 0) toRemove.push(key);
                if (key.indexOf('xianxia_arena_') === 0 && key.indexOf('xianxia_arena_ranking') !== 0) toRemove.push(key);
            }
            toRemove.forEach(function (k) {
                try { localStorage.removeItem(k); } catch (e) {}
            });
            // 重置角色当天的竞技场计数
            var cd = _getCharData();
            if (cd) {
                cd._arenaDailyCount = 0;
                cd._arenaDay = 0;
            }
            _showMsg('已重置所有冷却和每日限制（竞技场等）', 'success');
        } catch (e) {
            _showMsg('重置冷却失败', 'error');
        }
        _refreshUI();
    }

    // 解锁全地图
    function unlockAllMap() {
        // 尝试通过地图标记系统解锁
        if (typeof window.unlockAllLandmarks === 'function') {
            window.unlockAllLandmarks();
            _showMsg('已解锁所有地标', 'success');
        } else if (window.landmarkSystem && typeof window.landmarkSystem.unlockAll === 'function') {
            window.landmarkSystem.unlockAll();
            _showMsg('已解锁所有地标', 'success');
        } else {
            // 备用方案：设置访问标记
            try {
                var landmarks = JSON.parse(localStorage.getItem('xianxia_landmarks') || '{}');
                Object.keys(landmarks).forEach(function (k) {
                    if (typeof landmarks[k] === 'object') landmarks[k].discovered = true;
                });
                localStorage.setItem('xianxia_landmarks', JSON.stringify(landmarks));
                _showMsg('已尝试解锁地图标记', 'success');
            } catch (e) {
                _showMsg('解锁地图功能暂不可用', 'warning');
            }
        }
        _refreshUI();
    }

    // 时间推进
    function advanceHour() {
        _advanceTime(1, 0);
    }

    function advanceDay() {
        _advanceTime(24, 0);
    }

    function advanceWeek() {
        _advanceTime(168, 0);
    }

    function advanceMonth() {
        _advanceTime(720, 0);
    }

    function _advanceTime(hours, minutes) {
        if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
            window.timeSystem.advanceTime(hours * 60 + minutes, '调试时间推进');
            _showMsg('时间已推进 ' + hours + ' 小时' + (minutes ? ' ' + minutes + ' 分钟' : ''), 'success');
        } else if (window.gameTime) {
            // 备用方案
            window.gameTime.currentDay = window.gameTime.currentDay || 1;
            window.gameTime.hour = (window.gameTime.hour || 6) + hours;
            window.gameTime.minute = (window.gameTime.minute || 0) + minutes;
            while (window.gameTime.minute >= 60) {
                window.gameTime.minute -= 60;
                window.gameTime.hour++;
            }
            while (window.gameTime.hour >= 24) {
                window.gameTime.hour -= 24;
                window.gameTime.currentDay++;
            }
            if (typeof window.updateTimeDisplay === 'function') window.updateTimeDisplay();
            _showMsg('时间已推进（备用模式）', 'success');
        } else {
            _showMsg('时间系统不可用', 'error');
        }
        _refreshUI();
    }

    // ===== v12.4 战斗难度选择（设置页「游戏设置」区域，所有玩家可见） =====
    function _renderDifficultyCards() {
        var host = document.getElementById('difficulty-cards');
        if (!host) return;
        var presets = window.DIFFICULTY_PRESETS || {};
        var cur = (typeof window.getDifficulty === 'function') ? window.getDifficulty() : 'normal';
        var html = '';
        Object.keys(presets).forEach(function (key) {
            var p = presets[key];
            var active = (key === cur);
            var border = active ? 'border-yellow-500 bg-yellow-900/30' : 'border-gray-600 bg-gray-800/40 hover:border-gray-400';
            html += '<div onclick="applyDifficultySetting(\'' + key + '\')" '
                + 'class="cursor-pointer border rounded-lg p-3 text-center transition-colors ' + border + '">'
                + '<div class="text-lg mb-1">' + p.icon + '</div>'
                + '<div class="text-sm font-bold ' + (active ? 'text-yellow-400' : 'text-gray-200') + '">' + p.label + '</div>'
                + '<div class="text-xs text-gray-400 mt-1 leading-snug">' + p.desc + '</div>'
                + (active ? '<div class="text-xs text-yellow-500 mt-1">✓ 当前</div>' : '')
                + '</div>';
        });
        host.innerHTML = html;
        // 折叠行右侧的当前档标签
        var label = document.getElementById('difficulty-current-label');
        if (label && presets[cur]) label.textContent = presets[cur].label + ' ' + presets[cur].icon;
    }

    function toggleDifficultyDetail() {
        var detail = document.getElementById('difficulty-detail');
        if (!detail) return;
        var arrow = document.getElementById('difficulty-expand-arrow');
        var willShow = detail.classList.contains('hidden');
        if (willShow) {
            detail.classList.remove('hidden');
            if (arrow) arrow.textContent = '▼';
            _renderDifficultyCards();
        } else {
            detail.classList.add('hidden');
            if (arrow) arrow.textContent = '▶';
        }
    }

    function applyDifficultySetting(level) {
        if (typeof window.setDifficulty !== 'function') return;
        var presets = window.DIFFICULTY_PRESETS || {};
        var applied = window.setDifficulty(level);
        var p = presets[applied];
        _renderDifficultyCards();
        if (window.showMessage) {
            window.showMessage('⚔️ 战斗难度已切换为「' + (p ? p.label : applied) + '」' + (p ? p.icon : '') + '，立即生效并已保存。', 'info');
        }
    }
    // 设置页折叠/切换入口（HTML onclick 需要）
    window.toggleDifficultyDetail = toggleDifficultyDetail;
    window.applyDifficultySetting = applyDifficultySetting;

    // ===== 导出到 window.DebugPanel =====
    var DebugPanel = {
        renderDebugPanel: renderDebugPanel,
        checkAdminStatus: checkAdminStatus,
        setStones: setStones,
        addStones: addStones,
        setCopper: setCopper,
        addCopper: addCopper,
        setRealm: setRealm,
        setEssenceTempering: setEssenceTempering,
        setAllAttrs: setAllAttrs,
        setAttrsFromInputs: setAttrsFromInputs,
        setAllCombatSkills: setAllCombatSkills,
        applyCombatSkills: applyCombatSkills,
        setAllLifeSkills: setAllLifeSkills,
        applyLifeSkills: applyLifeSkills,
        setAllRoots: setAllRoots,
        applyMutatedRoots: applyMutatedRoots,
        addItem: addItem,
        quickAddItem: quickAddItem,
        addAllItems: addAllItems,
        fullRecovery: fullRecovery,
        maxLevel: maxLevel,
        maxRealm: maxRealm,
        setKarma: setKarma,
        setOrder: setOrder,
        setFame: setFame,
        setCurrentCityReputation: setCurrentCityReputation,
        maxCurrentCityReputation: maxCurrentCityReputation,
        maxAllCityReputation: maxAllCityReputation,
        clearDebuffs: clearDebuffs,
        resetCooldowns: resetCooldowns,
        unlockAllMap: unlockAllMap,
        advanceHour: advanceHour,
        advanceDay: advanceDay,
        advanceWeek: advanceWeek,
        advanceMonth: advanceMonth
    };

    window.DebugPanel = DebugPanel;
    window._isAdmin = false;

    // 自动检测
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            checkAdminStatus();
        });
    } else {
        checkAdminStatus();
    }

})();