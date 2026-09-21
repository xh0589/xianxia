// ==================== 仙路长青 - 全局工具函数与命名空间（v7.2 修复） ====================
// 本文件解决以下结构瑕疵：
// 1. 函数重复定义与覆盖
// 2. 全局变量命名冲突
// 3. 数据访问接口不一致
// 4. 跨文件依赖引用
// 加载顺序：第0层（所有其他文件之前）

// ===== 全局命名空间 =====
window.XianXia = window.XianXia || {};

// ===== v20.96 渲染刹车：一帧内多次同名整屏渲染合并成一次 =====
// 背包/货币/角色/战斗四张面板都是整屏 innerHTML 重建，一次行动常被连着调五六回
// （addItem 一回、RewardService 一回、growLifeSkill 一回……）。合并到动画帧结算：
// 同帧只画最后一笔，中间的全省。无 requestAnimationFrame 的环境（node 测试桩）直调，行为不变。
(function () {
    var __dirty = null;
    var __scheduled = false;
    window.coalesceRender = function (key, fn) {
        if (typeof window.requestAnimationFrame !== 'function') { fn(); return; }
        if (!__dirty) __dirty = {};
        __dirty[key] = fn;
        if (__scheduled) return;
        __scheduled = true;
        window.requestAnimationFrame(function () {
            __scheduled = false;
            var d = __dirty; __dirty = null;
            if (!d) return;
            Object.keys(d).forEach(function (k) { try { d[k](); } catch (e) { console.warn('[render:' + k + '] 渲染异常被吞：', e); } });
        });
    };
    /** 需要同步读屏的地方先冲账（把攒下的渲染立刻画掉） */
    window.flushCoalescedRenders = function () {
        var d = __dirty; __dirty = null;
        if (!d) return;
        Object.keys(d).forEach(function (k) { try { d[k](); } catch (e) { console.warn('[render:' + k + '] 渲染异常被吞：', e); } });
    };
})();

// ===== 读数格式：同一屏里的数字必须长得一样 =====
// 实测三种写法并存：任务酬劳「灵石 100000 · 小还丹 x5」、洞府「修炼 ×1.1 · 储物 +10 格 · 灵田2畦」、
// 设置页空态「上次保存: --」。这里只统一数字的呈现，不改任何玩法文案。
(function () {
    var fmt = {};

    /** 千分位。只给 >=1000 的整数加逗号——倍率 ×1.1 不能变成 ×1.10；非数字原样返回，不替调用方兜 NaN。 */
    fmt.num = function (v) {
        var n = typeof v === 'number' ? v : Number(v);
        if (!isFinite(n) || n % 1 !== 0) return String(v);
        return Math.abs(n) >= 1000 ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : String(n);
    };

    /** 数量后缀。历史上 ASCII 'x' 与 '×' 并存（任务用前者、洞府与突破用后者），统一成 ×。 */
    fmt.qty = function (name, n) { return name + ' ×' + fmt.num(n); };

    /** 整句静态文案里 >=4 位的裸整数就地补分位。成就描述是写死在数据里的（「持有 10000 铜钱」），
     *  逐条改不划算，渲染时统一；已带逗号的和小数不动，免得二次加工。 */
    fmt.text = function (s) {
        return String(s).replace(/(?<![\d,.])\d{4,}(?![\d,.])/g, function (m) { return fmt.num(Number(m)); });
    };

    window.XianXia.fmt = fmt;
})();

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

    // ===== 第九十五波·外包修复批：弹窗收口两件套 =====
    // NEW-35：收摊/上工/打盹这类「流程终点」要能软收 showModal 开的遮罩——
    // 别照抄 event-system 的 closeModal（那个关的是奇遇窗，对 #xianxia-modal-overlay 无效）
    if (typeof window.closeModalSoft !== 'function') {
        window.closeModalSoft = function () {
            var ov = document.getElementById('xianxia-modal-overlay');
            if (ov && ov.remove) ov.remove();
        };
    }
    // NEW-47：战斗/转世/地图实体交互三块是静态面板——全游戏唯一的画面，只能藏不能删。
    // 此前八处「打扫屏幕」用 .fixed.inset-0 通配把它们当弹窗删了，删掉后本局再也打不了仗。
    window.STATIC_PANEL_IDS = ['battle-modal', 'reincarnation-modal', 'entity-interaction'];
    window.closeRuntimeModals = function (keepId) {
        try {
            var nodes = document.querySelectorAll('.fixed.inset-0');
            for (var i = nodes.length - 1; i >= 0; i--) {
                var el = nodes[i];
                if (!el || !el.remove) continue;
                if (el.id && window.STATIC_PANEL_IDS.indexOf(el.id) >= 0) continue;   // 静态面板永不删
                // 飞鸽的遮罩与窗体是两个节点：单独摘它会留半死窗——交给它自己的关窗口一起收
                if (el.classList && el.classList.contains('mail-modal-scrim')
                    && window.MailSystemUI && typeof window.MailSystemUI.closeInbox === 'function') {
                    try { window.MailSystemUI.closeInbox(); } catch (eMail) {}
                    continue;
                }
                if (keepId && el.id === keepId) continue;
                el.remove();
            }
        } catch (e) {}
    };

    // 第一百一十波 · NEW-101：通用「选择对话框」补真身——此前这颗名字全库无定义，
    // 重要 NPC 垂危之类的生死抉择玩家从来看不到选项，兜底分支直接扣掉一半灵石把人救了。
    // 签名与 npc-life-system 的调用口径一致：{title, text, options:[{text,value}], onChoose(value)}
    window.showChoiceDialog = function (cfg) {
        cfg = cfg || {};
        var opts = Array.isArray(cfg.options) ? cfg.options : [];
        var body = '<div class="text-sm text-gray-200 whitespace-pre-line mb-3">' + String(cfg.text || '') + '</div><div style="display:flex;flex-direction:column;gap:8px">';
        opts.forEach(function (o, i) {
            body += '<button onclick="window.__choiceDialogPick(' + i + ')" class="bg-indigo-800 hover:bg-indigo-700 text-xs px-3 py-2 rounded text-left">' + String((o && o.text) || '') + '</button>';
        });
        body += '</div>';
        window.__choiceDialogCfg = cfg;
        window.__choiceDialogPick = function (i) {
            var c = window.__choiceDialogCfg;
            window.__choiceDialogCfg = null;
            try {
                var ov = document.getElementById('xianxia-modal-overlay');
                if (ov && ov.remove) ov.remove();
            } catch (e) {}
            if (c && typeof c.onChoose === 'function') {
                try { c.onChoose(c.options && c.options[i] ? c.options[i].value : null); } catch (e2) {}
            }
        };
        if (typeof window.showModal === 'function') window.showModal(String(cfg.title || '请选择'), body);
        else if (typeof window.showMessage === 'function') window.showMessage(String(cfg.title || '请选择'), 'info');
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
        // F-19 补：v20.0.2 F-17 修复时漏了 addCopper/deductCopper → 铜钱写入单源致双源不一致
        addCopper(amount) {
            this.setCopper(this.getCopper() + amount);
        },
        deductCopper(amount) {
            const cur = this.getCopper();
            if (cur < amount) return false;
            this.setCopper(cur - amount);
            return true;
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

    // ===== 第九十五波·NEW-36/NEW-31/NEW-06：钱包只有一本账 =====
    // 全仓库 48 处直写 inventory.currency.*（捐赠/强化/传送/宅邸/配对…），逐处补镜像必漏——
    // 给角色数据的 spiritStones/copper 装转发访问器：读写都落到背包钱包（唯一权威账本），
    // 镜像字段从此不会漂移，存档也不可能再把漂移账带上（序列化时 getter 读到的就是真账）
    window.installWalletMirror = function (cd) {
        if (!cd || typeof cd !== 'object' || cd._walletMirrored) return cd;
        try {
            ['spiritStones', 'copper'].forEach(function (k) {
                var shadow = (typeof cd[k] === 'number') ? cd[k] : 0;
                Object.defineProperty(cd, k, {
                    configurable: true, enumerable: true,
                    get: function () {
                        var inv = window.inventory;
                        if (inv && inv.currency && typeof inv.currency[k] === 'number') return inv.currency[k];
                        return shadow;
                    },
                    set: function (v) {
                        v = Number(v);
                        if (!isFinite(v)) v = 0;
                        shadow = v;
                        var inv = window.inventory;
                        if (inv && inv.currency) inv.currency[k] = v;
                    }
                });
            });
            Object.defineProperty(cd, '_walletMirrored', { value: true, configurable: true, enumerable: false });
        } catch (eWallet) {
            try { console.warn('[wallet] 钱包镜像访问器安装失败', eWallet); } catch (e2) {}
        }
        return cd;
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
        // F-13 完整版：旧存档字段兜底（新创建角色由 collectCharacterData 完整初始化）
        if (!data.bonds) data.bonds = {};
        if (!Array.isArray(data._children)) data._children = [];
        if (typeof data.realm !== 'string') data.realm = '炼气';
        if (!data.layer) data.layer = 1;
        if (!data.level) data.level = 1;
        if (data.exp == null) data.exp = 0;
        if (data.spiritStones == null) data.spiritStones = 100;
        if (data.day == null) data.day = 1;
        if (typeof data._masterId === 'undefined') data._masterId = null;
        if (!data.currentMap) data.currentMap = 'main';
        // 第九十五波·NEW-36：进唯一写入口就装上钱包访问器（背包钱包是唯一权威）
        if (typeof window.installWalletMirror === 'function') window.installWalletMirror(data);
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

    /**
     * v20.94 熟能生巧：生活技能长进的统一写点。
     * 立规：凡是动作结果被某门生活技能影响，动作落地就反哺该技能——
     * 打铁长锻造、炼丹长炼制、包扎长医术、砍价长口才，练了就会长。
     * 收益随等级递减（越练越难长），100 封顶；失败也给一点（摔打也是长进）。
     * @param {string} name 技能名（与创角名册同一套）
     * @param {number} exp 基础长进（成功给足、失败给一半由调用方定）
     * @param {object} [opts] { reason: 日志缘由, toast: 是否弹提示 }
     * @returns {number} 实际长进（0=没长）
     */
    window.growLifeSkill = function(name, exp, opts) {
        opts = opts || {};
        var cd = (typeof window.getCurrentCharData === 'function' && window.getCurrentCharData()) || window.currentCharData;
        if (!cd || !name) return 0;
        cd.lifeSkills = cd.lifeSkills || {};
        var lv = parseInt(cd.lifeSkills[name], 10) || 0;
        if (lv >= 100) return 0;
        var gain = Math.max(1, Math.round((Number(exp) || 1) * (1 - lv / 100)));
        gain = Math.min(gain, 100 - lv);
        cd.lifeSkills[name] = lv + gain;
        var msg = '🌱 ' + name + ' +' + gain + (opts.reason ? '（' + opts.reason + '）' : '') + '，当前 ' + cd.lifeSkills[name];
        if (window.gameLog && typeof window.gameLog.add === 'function') window.gameLog.add(msg, 'info');
        if (opts.toast && typeof window.showMessage === 'function') window.showMessage(msg, 'success');
        if (window.EventBus && typeof window.EventBus.emit === 'function') {
            try { window.EventBus.emit('lifeSkill:grew', { name: name, gain: gain, level: cd.lifeSkills[name] }); } catch (e) {}
        }
        if (typeof window.updateCharacterStatus === 'function') { try { window.updateCharacterStatus(); } catch (e) {} }
        return gain;
    };
})();

console.log('[global-utils] 全局工具函数已加载');