// ==================== 仙路长青 - 全局工具函数与命名空间（v7.2 修复） ====================
// 本文件解决以下结构瑕疵：
// 1. 函数重复定义与覆盖
// 2. 全局变量命名冲突
// 3. 数据访问接口不一致
// 4. 跨文件依赖引用
// 加载顺序：第0层（所有其他文件之前）

// ===== 全局命名空间 =====
window.XianXia = window.XianXia || {};

// ===== 统一消息系统 =====
// 解决 quest-system.js 和 app.js 的 showMessage 冲突
(function() {
    // 消息队列
    const messageQueue = [];
    let messageInitialized = false;

    window.XianXia.showMessage = function(message, type = 'info') {
        if (messageInitialized) {
            _renderMessage(message, type);
        } else {
            messageQueue.push({ message, type });
        }
    };

    function _renderMessage(message, type) {
        let msgDiv = document.getElementById('game-message');
        if (!msgDiv) {
            msgDiv = document.createElement('div');
            msgDiv.id = 'game-message';
            msgDiv.className = 'fixed top-4 right-4 z-50 space-y-2';
            document.body.appendChild(msgDiv);
        }
        const colors = {
            'success': 'bg-green-600 border-green-400',
            'error': 'bg-red-600 border-red-400',
            'warning': 'bg-yellow-600 border-yellow-400',
            'info': 'bg-blue-600 border-blue-400'
        };
        const msg = document.createElement('div');
        msg.className = `${colors[type] || colors.info} text-white px-4 py-3 rounded border-l-4 shadow-lg max-w-sm`;
        msg.textContent = message;
        msgDiv.appendChild(msg);
        setTimeout(() => {
            msg.style.opacity = '0';
            msg.style.transition = 'opacity 0.5s';
            setTimeout(() => msg.remove(), 500);
        }, 3000);
    }

    // 初始化消息系统（DOMContentLoaded后调用）
    window.XianXia.initMessageSystem = function() {
        messageInitialized = true;
        while (messageQueue.length > 0) {
            const { message, type } = messageQueue.shift();
            _renderMessage(message, type);
        }
    };

    // 全局 showMessage 委托（所有文件统一调用此函数）
    window.showMessage = function(message, type = 'info') {
        window.XianXia.showMessage(message, type);
    };

    // ===== v10.0 通用模态框 =====
    window.showModal = function(title, contentHtml) {
        var overlay = document.getElementById('xianxia-modal-overlay');
        if (overlay) overlay.remove();
        overlay = document.createElement('div');
        overlay.id = 'xianxia-modal-overlay';
        overlay.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
        overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
        overlay.innerHTML = [
            '<div class="bg-gray-800 border-2 border-yellow-500 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto">',
            '<div class="flex justify-between items-center mb-4">',
            '<h3 class="text-xl font-bold text-yellow-500">' + (title || '') + '</h3>',
            '<button onclick="this.closest(\'#xianxia-modal-overlay\').remove()" class="text-gray-400 hover:text-white text-2xl">&times;</button>',
            '</div>',
            contentHtml || '',
            '</div>'
        ].join('');
        document.body.appendChild(overlay);
    };

    // ===== v10.0 统一操作反馈增强 =====
    // 显示带图标的操作反馈（短暂显示后自动消失）
    window.XianXia.showToast = function(message, type = 'info', duration = 2000) {
        var icons = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        };
        window.XianXia.showMessage(icons[type] + ' ' + message, type);
    };

    // 确认对话框（返回Promise，替代confirm）
    window.XianXia.showConfirm = function(title, message, confirmText, cancelText) {
        confirmText = confirmText || '确认';
        cancelText = cancelText || '取消';
        return new Promise(function(resolve) {
            var overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 bg-black/60 flex items-center justify-center z-[100]';
            overlay.onclick = function(e) { if (e.target === overlay) { overlay.remove(); resolve(false); } };
            overlay.innerHTML = [
                '<div class="bg-gray-800 border border-gray-600 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">',
                title ? '<h3 class="text-lg font-bold text-white mb-3">' + title + '</h3>' : '',
                '<p class="text-gray-300 mb-6">' + message + '</p>',
                '<div class="flex gap-3 justify-end">',
                '<button class="confirm-cancel bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded">' + cancelText + '</button>',
                '<button class="confirm-ok bg-yellow-600 hover:bg-yellow-500 text-gray-900 font-bold px-4 py-2 rounded">' + confirmText + '</button>',
                '</div></div>'
            ].join('');
            document.body.appendChild(overlay);
            overlay.querySelector('.confirm-ok').onclick = function() { overlay.remove(); resolve(true); };
            overlay.querySelector('.confirm-cancel').onclick = function() { overlay.remove(); resolve(false); };
        });
    };

    // 加载状态指示器（显示/隐藏）
    var _loadingCount = 0;
    var _loadingEl = null;
    window.XianXia.showLoading = function(message) {
        message = message || '处理中...';
        _loadingCount++;
        if (_loadingEl) return;
        _loadingEl = document.createElement('div');
        _loadingEl.id = 'global-loading-overlay';
        _loadingEl.className = 'fixed inset-0 bg-black/40 flex items-center justify-center z-[200]';
        _loadingEl.innerHTML = [
            '<div class="bg-gray-800 border border-gray-600 rounded-xl p-8 text-center">',
            '<div class="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>',
            '<p class="text-gray-300 text-sm">' + message + '</p>',
            '</div>'
        ].join('');
        document.body.appendChild(_loadingEl);
    };
    window.XianXia.hideLoading = function() {
        _loadingCount = Math.max(0, _loadingCount - 1);
        if (_loadingCount <= 0 && _loadingEl) {
            _loadingEl.remove();
            _loadingEl = null;
        }
    };

    // 操作结果通知（成功/失败带详情）
    window.XianXia.notifyResult = function(success, message, detail) {
        var type = success ? 'success' : 'error';
        var icon = success ? '✅' : '❌';
        var msg = icon + ' ' + message;
        if (detail) msg += '\n' + detail;
        window.XianXia.showMessage(msg, type);
    };

    // 全局快捷方式
    window.showToast = function(msg, type, duration) { window.XianXia.showToast(msg, type, duration); };
    window.showConfirm = function(title, msg, confirmText, cancelText) { return window.XianXia.showConfirm(title, msg, confirmText, cancelText); };
    window.showLoading = function(msg) { window.XianXia.showLoading(msg); };
    window.hideLoading = function() { window.XianXia.hideLoading(); };
    window.notifyResult = function(success, msg, detail) { window.XianXia.notifyResult(success, msg, detail); };
})();

// ===== 统一数据访问层 =====
// 解决 currentCharData.spiritStones 与 window.inventory.currency.spiritStones 数据不一致
(function() {
    window.XianXia.DataManager = {
        // 获取玩家灵石数量（统一入口）
        getSpiritStones() {
            const inv = window.inventory;
            if (inv && inv.currency && typeof inv.currency.spiritStones === 'number') {
                return inv.currency.spiritStones;
            }
            const charData = window.currentCharData;
            return charData && typeof charData.spiritStones === 'number' ? charData.spiritStones : 0;
        },

        // 设置玩家灵石数量（同步到两个系统）
        setSpiritStones(amount) {
            const inv = window.inventory;
            if (inv && inv.currency) {
                inv.currency.spiritStones = Math.max(0, amount);
            }
            const charData = window.currentCharData;
            if (charData) {
                charData.spiritStones = Math.max(0, amount);
            }
        },

        // 增加灵石（同步到两个系统）
        addSpiritStones(amount) {
            const current = this.getSpiritStones();
            this.setSpiritStones(current + amount);
        },

        // 扣除灵石（返回是否成功）
        deductSpiritStones(amount) {
            const current = this.getSpiritStones();
            if (current < amount) return false;
            this.setSpiritStones(current - amount);
            return true;
        },

        // 获取铜钱
        getCopper() {
            const inv = window.inventory;
            if (inv && inv.currency && typeof inv.currency.copper === 'number') {
                return inv.currency.copper;
            }
            const charData = window.currentCharData;
            return charData && typeof charData.copper === 'number' ? charData.copper : 0;
        },

        setCopper(amount) {
            const inv = window.inventory;
            if (inv && inv.currency) {
                inv.currency.copper = Math.max(0, amount);
            }
            const charData = window.currentCharData;
            if (charData) {
                charData.copper = Math.max(0, amount);
            }
        },

        // 获取玩家属性（统一从 currentCharData 读取）
        getCharAttr(key) {
            const charData = window.currentCharData;
            if (!charData) return null;
            // 主属性
            if (charData.mainAttributes && charData.mainAttributes[key] !== undefined) {
                return charData.mainAttributes[key];
            }
            // 直接属性
            return charData[key] !== undefined ? charData[key] : null;
        },

        // 获取玩家境界
        getRealm() {
            const charData = window.currentCharData;
            if (!charData) return { realm: '炼气', layer: 1 };
            return {
                realm: charData.realm || '炼气',
                layer: charData.layer || 1
            };
        },

        // 同步所有数据（确保两套系统一致）
        syncAll() {
            const inv = window.inventory;
            const charData = window.currentCharData;
            if (!inv || !charData) return;
            
            // 同步灵石
            if (inv.currency && typeof inv.currency.spiritStones === 'number') {
                charData.spiritStones = inv.currency.spiritStones;
            } else if (charData.spiritStones !== undefined) {
                if (!inv.currency) inv.currency = { copper: 0, spiritStones: 0 };
                inv.currency.spiritStones = charData.spiritStones;
            }
            
            // 同步铜钱
            if (inv.currency && typeof inv.currency.copper === 'number') {
                charData.copper = inv.currency.copper;
            } else if (charData.copper !== undefined) {
                if (!inv.currency) inv.currency = { copper: 0, spiritStones: 0 };
                inv.currency.copper = charData.copper;
            }
        }
    };
})();

// ===== 统一UI更新接口 =====
(function() {
    window.XianXia.UI = {
        // 更新货币显示
        updateCurrency() {
            if (typeof window.updateCurrencyUI === 'function') {
                window.updateCurrencyUI();
            }
        },
        // 更新背包显示
        updateInventory() {
            if (typeof window.updateInventoryUI === 'function') {
                // 调用 inventory.js 版本（已挂载到 window）
                window.updateInventoryUI();
            }
        },
        // 更新角色状态
        updateCharacter() {
            if (typeof window.updateCharacterStatus === 'function') {
                window.updateCharacterStatus();
            }
        },
        // 更新所有UI
        updateAll() {
            this.updateCurrency();
            this.updateInventory();
            this.updateCharacter();
        }
    };
})();

// ===== 工具函数（避免重复定义） =====
(function() {
    window.XianXia.Utils = {
        clamp(value, min, max) {
            return Math.max(min, Math.min(max, value));
        },
        randomChoice(array) {
            return array[Math.floor(Math.random() * array.length)];
        },
        deepMerge(target, source) {
            const result = { ...target };
            for (const key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    result[key] = this.deepMerge(target[key] || {}, source[key]);
                } else {
                    result[key] = source[key];
                }
            }
            return result;
        },
        // 安全获取物品模板
        getItemTemplate(itemId) {
            return window.itemById?.[itemId] || null;
        },
        // 获取物品显示名称
        getItemName(itemId) {
            const template = this.getItemTemplate(itemId);
            return template?.name || itemId || '未知物品';
        }
    };

    // 导出到全局（兼容旧代码）
    window.clamp = window.clamp || window.XianXia.Utils.clamp;
    window.randomChoice = window.randomChoice || window.XianXia.Utils.randomChoice;
    window.deepMerge = window.deepMerge || window.XianXia.Utils.deepMerge;
})();

// ===== v9.8 角色数据统一入口 + 主属性中英双写 =====
(function() {
    // 显示名「神识」对应英文键 intelligence（兼容旧存档「智力」）
    window.ATTRIBUTE_KEY_MAP = {
        '力量': 'strength',
        '灵巧': 'dexterity',
        '神识': 'intelligence',
        '智力': 'intelligence', // 旧存档兼容
        '意志': 'willpower',
        '体质': 'constitution',
        '经脉': 'meridian'
    };
    window.ATTRIBUTE_EN_TO_CN = {
        strength: '力量',
        dexterity: '灵巧',
        intelligence: '神识',
        willpower: '意志',
        constitution: '体质',
        meridian: '经脉'
    };

    /** 从 mainAttributes 生成/同步 attrs 英文键 */
    window.syncCharAttrsFromMain = function(charData) {
        if (!charData) return null;
        if (!charData.mainAttributes) charData.mainAttributes = {};
        // 旧档「智力」→「神识」
        if (charData.mainAttributes['智力'] != null && charData.mainAttributes['神识'] == null) {
            charData.mainAttributes['神识'] = charData.mainAttributes['智力'];
            delete charData.mainAttributes['智力'];
        }
        charData.attrs = charData.attrs || {};
        var map = window.ATTRIBUTE_KEY_MAP;
        Object.keys(map).forEach(function(cn) {
            if (cn === '智力') return; // 只写神识
            var en = map[cn];
            var v = charData.mainAttributes[cn];
            if (v === undefined || v === null || isNaN(v)) v = 10;
            charData.attrs[en] = parseInt(v, 10) || 10;
        });
        return charData;
    };

    /**
     * 统一修改主属性（中英双写）
     * @param {string} key 中文名或英文键
     * @param {number} value 新值
     * @param {object} [charData] 默认 getCurrentCharData()
     */
    window.setMainAttribute = function(key, value, charData) {
        charData = charData || window.getCurrentCharData();
        if (!charData) return false;
        if (!charData.mainAttributes) charData.mainAttributes = {};
        if (!charData.attrs) charData.attrs = {};
        value = Math.max(0, Math.min(100, parseInt(value, 10) || 0));
        var cn = key;
        var en = key;
        if (window.ATTRIBUTE_KEY_MAP[key]) {
            cn = key === '智力' ? '神识' : key;
            en = window.ATTRIBUTE_KEY_MAP[key];
        } else if (window.ATTRIBUTE_EN_TO_CN[key]) {
            en = key;
            cn = window.ATTRIBUTE_EN_TO_CN[key];
        }
        charData.mainAttributes[cn] = value;
        charData.attrs[en] = value;
        // 清理旧顶层字段误写
        if (charData[en] !== undefined) charData[en] = value;
        return true;
    };

    /** 主属性增量（丹药/升级） */
    window.addMainAttribute = function(key, delta, charData) {
        charData = charData || window.getCurrentCharData();
        if (!charData) return false;
        var map = window.ATTRIBUTE_KEY_MAP;
        var enMap = window.ATTRIBUTE_EN_TO_CN;
        var cn, en;
        if (map[key]) {
            cn = key === '智力' ? '神识' : key;
            en = map[key];
        } else if (enMap[key]) {
            en = key;
            cn = enMap[key];
        } else {
            return false;
        }
        if (!charData.mainAttributes) charData.mainAttributes = {};
        if (!charData.attrs) charData.attrs = {};
        var cur = charData.mainAttributes[cn];
        if (cur == null) cur = charData.attrs[en];
        if (cur == null) cur = 10;
        return window.setMainAttribute(cn, (parseInt(cur, 10) || 10) + (parseInt(delta, 10) || 0), charData);
    };

    /**
     * 唯一角色数据写入入口：同步局部变量与 window.currentCharData
     * app.js 的 currentCharData 通过闭包赋值；此处同时写 window 供 battle/crafting/poison 读取
     */
    window.setCurrentCharData = function(data) {
        if (!data) {
            window.currentCharData = null;
            return null;
        }
        window.syncCharAttrsFromMain(data);
        // v13.1 绝技兜底：任何角色数据入口都保证 combatAbilities 为数组
        if (!Array.isArray(data.combatAbilities)) data.combatAbilities = [];
        window.currentCharData = data;
        // 若 app 暴露了赋值钩子则同步（见 app.js）
        if (typeof window._setAppCurrentCharData === 'function') {
            window._setAppCurrentCharData(data);
        }
        if (window.gameState) window.gameState.player = data;
        return data;
    };

    window.getCurrentCharData = function() {
        if (typeof window._getAppCurrentCharData === 'function') {
            var local = window._getAppCurrentCharData();
            if (local) {
                if (window.currentCharData !== local) window.currentCharData = local;
                return local;
            }
        }
        return window.currentCharData || null;
    };

    /** 生活技能读取（合成/医术/毒术等统一路径） */
    window.getLifeSkill = function(skillName, charData) {
        charData = charData || window.getCurrentCharData();
        if (!charData) return 0;
        if (charData.lifeSkills && charData.lifeSkills[skillName] != null) {
            return parseInt(charData.lifeSkills[skillName], 10) || 0;
        }
        // 兼容误写在顶层的旧数据
        if (charData[skillName] != null && typeof charData[skillName] === 'number') {
            return charData[skillName];
        }
        return 0;
    };
})();

console.log('[global-utils] 全局工具函数已加载');