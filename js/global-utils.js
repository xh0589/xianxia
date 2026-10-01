// ==================== 仙路长青 - 全局工具函数与命名空间（v7.2 修复） ====================
// 本文件解决以下结构瑕疵：
// 1. 函数重复定义与覆盖
// 2. 全局变量命名冲突
// 3. 数据访问接口不一致
// 4. 跨文件依赖引用
// 加载顺序：第0层（所有其他文件之前）

// ===== 全局命名空间 =====
window.XianXia = window.XianXia || {};

// ===== 第一百一十八批 DES-57：地名认账只用一把尺 =====
// 全仓城名有两串写法：js/regions.js 的 mapData 把起始城写成「帝都 · 长安」（· 两边带空格），
// 而 cityData 表键、NPC 的 homeLocation／location、app.js 新开局的初值都写「帝都·长安」。
// 差的只是那个空格，可按地名取数／判同城的十来处用的是 === 精确等值——从舆图点「前往」进的城
// 与角色身上那本账拼写不一致时，城中人物名册、送礼深谈、庙会摆摊赁屋营生整段在屏上静默消失。
// 口径沿用仓里已有的两支归一笔（house-system.js:_normCityName、reputation-system.js:repKey）：
// 只去空白，不动「·」，不新增第三种地名，也不改屏上给玩家看的那串写法。
(function () {
    window.placeKey = function (name) { return String(name == null ? '' : name).replace(/\s+/g, ''); };
    /** 两处地名是不是同一个地方。任一为空即判不成——不许把「无地」认成「某城」。 */
    window.samePlace = function (a, b) {
        var ka = window.placeKey(a), kb = window.placeKey(b);
        return !!ka && !!kb && ka === kb;
    };
})();

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
            // UI评审·B4-2（2026-10-01）：info 从 bg-blue-600 实心降为深底半透明——
            // 实心亮蓝与九州舆图的东部海域撞色，UI 评审时被误读成「地图右上角的引导窗」
            // （截图恰好截到 3 秒存活期内的 info toast）。降饱和后仍是蓝系可辨识，
            // 但不再从暗色地图背景里浮出来抢视线。
            'info': 'bg-blue-900/85 border-blue-500/60'
        };
        const msg = document.createElement('div');
        msg.className = `${colors[type] || colors.info} text-white px-4 py-3 rounded border-l-4 shadow-lg max-w-sm`;
        msg.textContent = message;
        msgDiv.appendChild(msg);
        // UI评审·B4-2：时长按文本长度自适应——3 秒只够读短句，创角引导类长文本
        // （40+ 字）实测读不完就淡出，改 6 秒；仍读不完的超长（70+）给 8 秒。
        const _len = String(message).length;
        const _ms = _len >= 70 ? 8000 : (_len >= 40 ? 6000 : 3000);
        setTimeout(() => {
            msg.style.opacity = '0';
            msg.style.transition = 'opacity 0.5s';
            setTimeout(() => msg.remove(), 500);
        }, _ms);
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

    // ===== 转义层收口（重构第1步）：全库唯一 escapeHtml =====
    // 现状盘点：335 处 innerHTML 拼接，escapeHtml 只有 2 个文件各自局部定义（npc-rel-events.js
    // / player-rumor.js），其余插值点裸奔。本函数是唯一实现，各处一律 esc(x) 调用，不再各自抄。
    window.esc = window.XianXia.esc = function (s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    };

    // ===== v10.0 通用模态框 =====
    // 重构第3步：本体改走 XianXia.Modal.open 的兼容壳（固定 id，单实例语义与旧版逐字兼容：
    // 存量代码 getElementById('xianxia-modal-overlay').remove() 依旧有效；句柄 isAlive 过滤死引用）。
    window.showModal = function(title, contentHtml) {
        return window.XianXia.Modal.open({ id: 'xianxia-modal-overlay', title: title, html: contentHtml });
    };

    // ===== 重构第3步 · Modal 栈式注册制 =====
    // 动机：97 处自建 fixed.inset-0 弹层 + closeRuntimeModals 用 querySelectorAll 通配删除，
    // 已踩过「误删战斗/转世/实体交互静态面板」的坑（STATIC_PANEL_IDS 白名单是补丁不是根治）。
    // 根治 = 弹层自己注册自己（栈），关闭遍历栈而不是猜 DOM。
    // 语义约定：title 永远纯文本（esc）；text 纯文本（esc）；html 直传（HTML 语义，调用方自负责）。
    // z-index 从 ui-tokens 的 --x-z-modal 读基值，栈内第 N 层 +5，天然低于 toast(90)。
    (function () {
        var _stack = [];
        function alive(h) { return h && h.el && h.el.isConnected; }
        function liveStack() { return _stack.filter(alive); }

        function open(cfg) {
            cfg = cfg || {};
            // 同 id 单实例语义（showModal 兼容路径靠它维持旧行为）
            if (cfg.id) closeById(cfg.id);
            var overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 bg-black/70 flex items-center justify-center x-modal-layer';
            if (cfg.id) overlay.id = cfg.id;
            if (cfg.className) overlay.classList.add(cfg.className);
            // z-index 基值从 ui-tokens 的 --x-z-modal 读。getComputedStyle/documentElement 是浏览器全局，
            // Node 与 SSR 环境下不存在 → 裸调会 ReferenceError 打穿所有调用方（v21.3 / wave133 两套崩在这）。
            // 兜底顺序：CSS 变量 → 50（与 ||50 原默认值一致，不改浏览器内行为）。
            var zBase = 50;
            if (typeof getComputedStyle === 'function' && document.documentElement) {
                var zRaw = getComputedStyle(document.documentElement).getPropertyValue('--x-z-modal');
                zBase = parseInt(zRaw, 10) || 50;
            }
            overlay.style.zIndex = String(zBase + liveStack().length * 5);
            var body = (cfg.html != null) ? String(cfg.html) : window.esc(cfg.text || '');
            var widthCls = cfg.width || 'max-w-2xl';
            overlay.innerHTML =
                '<div class="bg-gray-800 border-2 border-yellow-500 rounded-xl p-6 ' + widthCls + ' w-full mx-4 max-h-[85vh] overflow-y-auto">' +
                '<div class="flex justify-between items-center mb-4">' +
                '<h3 class="text-xl font-bold text-yellow-500">' + window.esc(cfg.title || '') + '</h3>' +
                '<button data-x-modal-close class="text-gray-400 hover:text-white text-2xl">&times;</button>' +
                '</div>' + body + '</div>';
            var handle = {
                el: overlay, id: cfg.id || null,
                close: function () {
                    if (!overlay.isConnected) return; // 幂等：被外部直接 remove 过（旧代码风格）也不报错
                    overlay.remove();
                    var i = _stack.indexOf(handle); if (i >= 0) _stack.splice(i, 1);
                    if (typeof cfg.onClose === 'function') { try { cfg.onClose(handle); } catch (e) {} }
                }
            };
            // 双轨兼容锚点：DOM 式旧逻辑（_closeTopModal / closeRuntimeModals 二轨）能通过它找回句柄，
            // 走 close() 而不是裸 remove()——onClose 回调不再丢失
            overlay.xModalHandle = handle;
            overlay.addEventListener('click', function (e) {
                if (e.target === overlay && cfg.dismissable !== false) handle.close();
            });
            var btn = overlay.querySelector('[data-x-modal-close]');
            if (btn) btn.addEventListener('click', function () { handle.close(); });
            document.body.appendChild(overlay);
            _stack.push(handle);
            return handle;
        }
        function closeById(id) {
            liveStack().forEach(function (h) { if (h.id === id) h.close(); });
        }
        // keepId 与静态面板白名单在栈轨同样生效——与 closeRuntimeModals 的二轨同口径
        function closeAll(opts) {
            opts = opts || {};
            var targets = liveStack().slice().reverse();
            for (var i = 0; i < targets.length; i++) {
                var h = targets[i];
                if (opts.keepId && h.id === opts.keepId) continue;
                if (h.id && window.STATIC_PANEL_IDS && window.STATIC_PANEL_IDS.indexOf(h.id) >= 0) continue;
                h.close();
            }
        }
        function top() { return liveStack().slice(-1)[0] || null; }

        // ===== v25.2 · Modal.adopt：存量自建弹层零视觉改动收编进栈 =====
        // 动机：全库 98 处自建 fixed.inset-0 弹层不可能一夜重写成 Modal.open 皮肤；
        // adopt 让它们**保持原样**就能进栈获得句柄（closeRuntimeModals 栈轨可靠关闭、
        // Esc 关栈顶、isAlive 过滤外部裸 remove）。根治「query 单选器直删误杀静态面板」族
        // （首例：cultivation-bottleneck.js 突破成功删 #reincarnation-modal——FIX_NOTES 第十三轮记录在案）。
        // 语义：只挂锚点+入栈，不改 z-index/不改 DOM 结构/不动既有 onclick（要不要换关闭路径由调用方决定）。
        function adopt(el, cfg) {
            cfg = cfg || {};
            if (!el || !el.isConnected) return null;
            if (el.xModalHandle) return el.xModalHandle; // 幂等：重复收编返回原句柄
            var handle = {
                el: el, id: el.id || cfg.id || null, adopted: true,
                close: function () {
                    if (!el.isConnected) return;
                    el.remove();
                    var i = _stack.indexOf(handle); if (i >= 0) _stack.splice(i, 1);
                    if (typeof cfg.onClose === 'function') { try { cfg.onClose(handle); } catch (e) {} }
                }
            };
            el.xModalHandle = handle;
            _stack.push(handle);
            return handle;
        }

        window.XianXia.Modal = {
            open: open,
            adopt: adopt,
            close: function (h) { if (h && typeof h.close === 'function') h.close(); },
            closeById: closeById,
            closeAll: closeAll,
            top: top,
            depth: function () { return liveStack().length; },
            _stack: _stack // 只读调试用；别直接改
        };
    })();

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
    // 重构第3步·双轨：一轨走 Modal 注册栈（可靠关闭，onClose 回调有通知，keepId/静态白名单同口径），
    // 二轨保留原 querySelectorAll 通配（97 处自建弹层迁移完之前不撤——迁移清单见 REFACTOR-NOTES.md）。
    // 存量自建弹层将来逐个改走 XianXia.Modal.open 后，二轨整体退役、此函数缩为一行 closeAll。
    window.closeRuntimeModals = function (keepId) {
        try {
            // 一轨：注册栈（后进先出）
            if (window.XianXia && window.XianXia.Modal) {
                try { window.XianXia.Modal.closeAll({ keepId: keepId }); } catch (eM) {}
            }
            // 二轨：DOM 通配兜底（未注册的存量弹层）
            var nodes = document.querySelectorAll('.fixed.inset-0');
            for (var i = nodes.length - 1; i >= 0; i--) {
                var el = nodes[i];
                if (!el || !el.remove) continue;
                if (el.id && window.STATIC_PANEL_IDS.indexOf(el.id) >= 0) continue;   // 静态面板永不删
                // 一轨已用句柄关过的不重复处理（isConnected 会是 false，这里自然跳过）
                if (!el.isConnected) continue;
                // 飞鸽的遮罩与窗体是两个节点：单独摘它会留半死窗——交给它自己的关窗口一起收
                if (el.classList && el.classList.contains('mail-modal-scrim')
                    && window.MailSystemUI && typeof window.MailSystemUI.closeInbox === 'function') {
                    try { window.MailSystemUI.closeInbox(); } catch (eMail) {}
                    continue;
                }
                if (keepId && el.id === keepId) continue;
                // 有句柄锚点的走句柄（不丢 onClose）；没有的按原样裸 remove
                if (el.xModalHandle && typeof el.xModalHandle.close === 'function') {
                    try { el.xModalHandle.close(); } catch (eH) {}
                    continue;
                }
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

    // ===== NEW-73 结案（第一百二十三批）：灵石这本账此前在守卫前面「不存在」 =====
    // 全仓 `window.DataManager`（不带 XianXia.）字面命中 85 处／20 本，其中 31 行为纯裸名调用、
    // 27 行写成 `if (window.DataManager && ...)` 这一形，而这层访问器只挂在 window.XianXia.DataManager 上
    // ⇒ 守卫恒假：该收费的放行（延医 200／自创丹方 50／入门 10…屏上仍念「灵石-200」），
    // 该发钱的落空（悬赏赏金／宿敌终战／子嗣孝敬／矿脉收益…屏上仍念「+50」）。
    // 用到的只有 get/add/deductSpiritStones 三个方法，本对象全有，故别名指过去即可两全。
    window.DataManager = window.XianXia.DataManager;
})();

// ============ 存储单源：写盘失败不许静默 ============
// 【第一百四十四批 · 2026-09-27】
// 缘起：v20.87 早就给「主档／自动档」配了写失败告警，而且原话写得很重——
//   js/core/auto-save.js:39「自动档写失败不再静默——**玩家以为存上了实际丢了是最坏情况**」
//   js/app.js:2780        「存档写入失败不再静默——多半是浏览器存储空间已满」
// 但**各模块的小存档一个都没跟上**。2026-09-27 实扫全仓：18 个存档键写失败时玩家听不到，
// 其中 9 个**连 try 都没有**（`js/inventory.js:2134` 的 xianxia_inventory 最要命——
// 那是玩家的整个行囊；配额一满，那行直接抛给调用方）。
// 也就是说 v20.87 修的是那个「最坏情况」的**一个样本**，不是它的全量。
//
// 本函数是这件事的**单一 owner**：规矩收在这里，各模块只调这一个口。
// ⚠️ 告警去重（_盘满已警）：配额一满会连炸几十处，弹一次就够，别刷屏。
// ⚠️ 玩家可见文本零外文字母（强制规则）—— 下面那句已自查过。
// ⚠️ 放在 DataManager 那个对象字面量**外面**（第一版误插在 getCharAttr 之前，
//    那是对象字面量内部，`var` 加 `window.x=` 直接语法错——尺插错了位置，不是内容错）。
(function () {
    var _盘满已警 = false;
    window.saveToStorage = function (key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (e) {
            if (!_盘满已警 && window.showMessage) {
                _盘满已警 = true;
                window.showMessage('⚠️ 存盘失败：浏览器的存储空间可能已满。这一部分进度**没有存上**（旧档还在）。建议清理旧存档后重试。', 'error');
            }
            if (window.console && console.error) console.error('[存盘失败] ' + key + '：', e && e.message);
            return false;
        }
    };
    // 测试用：让告警能重新弹一次（免得一条闸把后续用例全闷掉）
    window._resetStorageWarn = function () { _盘满已警 = false; };
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
        // v25.1·试-30：不再兜底 day 字段——恒 1 的死账（世界天数走时间系统），新角色模板已删此键
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

    /**
     * DES-72／86／89／90／91 一族的公共发奖手（第一百三十批）。
     * 旧写法全仓十几处把 addItem 的返回值丢在地上，于是「该给几件」直接当「真收几件」念上屏。
     * 口径与 js/items-extended/11-event-extensions.js 的 xGive 一致（那边在扩展表内部，这一支给全局用）。
     * @param {string} id 物品模板 id
     * @param {number} [count=1] 该给几件
     * @param {object} [opts] { msg: 前半句彩头话, label: 回执主语, quiet: 只记账不上屏 }
     * @returns {{got:number,count:number,name:string,reason:(string|null)}} got＝真收进囊的件数，拼串点位自己拿去分流；reason＝入袋那一刻从 `addItemFailReason` 抄下的快照（'bag_full'／'no_template'／null），多件发放与循环外拼串的点位于是能对**这一件**归因
     */
    window.giveWithReceipt = function (id, count, opts) {
        opts = opts || {};
        count = Math.max(1, Math.floor(Number(count) || 1));
        var nm = opts.label || ((window.itemById && window.itemById[id] && window.itemById[id].name) || id);
        // 没有入库通道的世界（无背包脚本）按全数认——与 xGive 同一口径，别凭空造一次「没收到」
        var got = (typeof window.addItem === 'function') ? (Number(window.addItem(id, count)) || 0) : count;
        // DES-96（第一百三十八批）：账当场抄进收据。全局那条 addItemFailReason 会被下一次入袋刷掉，
        // 所以「先发货、后拼串」的点位只有在此刻抄下才拿得到**这一件**的缘由。
        var 账 = (typeof window.addItem === 'function') ? (window.addItemFailReason || null) : null;
        if (got < count && !opts.quiet && typeof window.showMessage === 'function') {
            window.showMessage(got > 0
                ? (opts.msg ? opts.msg + '——' : '🎁 ') + nm + ' 行囊只塞得下 ' + got + '/' + count + ' 件，另 ' + (count - got) + ' 件没带走。'
                : (opts.msg ? opts.msg + '——' : '🎁 ') + nm + '×' + count + ' 一件也没能带走：'
                  + ((typeof window.addItemFailTextFor === 'function' && window.addItemFailTextFor(账, nm)) || '没能落进你的行囊。'), // DES-90：模板缺失不许怪给行囊
                'warning');
        }
        return { got: got, count: count, name: nm, reason: 账 };
    };

    /**
     * DES-92（第一百三十二批）：境界序只此一把尺。
     * 旧状是全仓各自抄表——同一个「谁比谁高」抄了十来份，档位多寡从 7 到 13 不等，
     *   其中一份把「炼气」抄成「练气」，一份含游戏里从没落到过玩家身上的「真仙」，
     *   还有几份排在渡劫就断了。判门槛的那几支于是对 炼虚/合体/大乘/渡劫/飞升/金仙 一律判「不够格」。
     * 进度真源＝ js/cultivation/cultivation.js 的 REALM_UNIQUE_EFFECTS（渡劫 → 飞升 → 二段飞升＝金仙）。
     * ⚠️ 这一把只用于**判够不够格**。把序号直接换算成数值的那几支（战斗面板、伤势等级、城望评分、重塑费用）
     *    换尺会挪动数值，本批按原样留着，逐本登记在 FIX_NOTES。
     */
    var REALM_ORDER = ['凡人', '炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫', '飞升', '金仙'];
    window.REALM_ORDER = REALM_ORDER;

    // 认不出来的境界名 ⇒ -1（宁可让人查得出来，也别默默当成炼气）
    window.realmIndex = function (realm) {
        return REALM_ORDER.indexOf(String(realm == null ? '' : realm).trim());
    };

    // 「门槛本身认不出」⇒ 放行——别拿一张写错的门牌把人锁在门外（与 js/location-system.js 同口径）
    window.realmAtLeast = function (current, target) {
        var t = window.realmIndex(target);
        if (t < 0) return true;
        return window.realmIndex(current) >= t;
    };
})();

console.log('[global-utils] 全局工具函数已加载');