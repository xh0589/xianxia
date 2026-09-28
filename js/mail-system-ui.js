/**
 * mail-system-ui.js - 飞鸽传书UI模块 v12.0
 *
 * 提供：
 * - 收件箱按钮（带未读红点）
 * - 飞鸽飞入/玉简飘下/灵镜浮现动画
 * - 收件箱面板（收件/发件/收藏3标签）
 * - 单封详情（发件人/载具/内容/附件/动作）
 * - 托盘通知
 */
(function() {
    'use strict';

    // ============ 飞行物动画 ============
    function flyInPigeon(fromName) {
        var c = ensureContainer('mailPigeonContainer');
        c.innerHTML = '';
        var p = document.createElement('div');
        p.className = 'mail-pigeon-fly';
        p.innerHTML = '<span class="pigeon-icon">🐦</span><span class="pigeon-letter">📜</span>';
        c.appendChild(p);
        var mailBtn = document.getElementById('mailInboxBtn');
        if (mailBtn) {
            var rect = mailBtn.getBoundingClientRect();
            p.style.setProperty('--target-x', (rect.left + rect.width / 2) + 'px');
            p.style.setProperty('--target-y', (rect.top + rect.height / 2) + 'px');
        }
        setTimeout(function() {
            // 飞鸽释放信件
            var l = document.createElement('div');
            l.className = 'pigeon-letter-fall';
            l.textContent = '📜';
            if (mailBtn) {
                var r2 = mailBtn.getBoundingClientRect();
                l.style.left = (r2.left + r2.width / 2 - 12) + 'px';
                l.style.top = r2.top + 'px';
            }
            c.appendChild(l);
            showToast('📜 飞鸽传书：' + (fromName || '某人') + '来信了', 'info');
            setTimeout(function() {
                p.remove();
                l.remove();
            }, 1800);
        }, 2400);
    }

    function dropJadeScroll(importanceLabel) {
        var c = ensureContainer('mailJadeContainer');
        c.innerHTML = '';
        var j = document.createElement('div');
        j.className = 'mail-jade-fall';
        j.textContent = '📜';
        c.appendChild(j);
        showToast('📜 玉简飞书：' + (importanceLabel || '重要') + '信件', 'info');
        setTimeout(function() { j.remove(); }, 2000);
    }

    function showMirror(npcName, subject, body) {
        var c = ensureContainer('mailMirrorContainer');
        c.innerHTML = '<div class="mail-mirror">' +
            '<button class="mail-mirror-close" onclick="window.MailSystemUI.closeMirror()">×</button>' +
            '<div class="mirror-portrait">🪞</div>' +
            '<div class="mirror-title">— 灵镜传影 —</div>' +
            '<div class="mirror-name">' + (npcName || '') + '</div>' +
            '<div class="mirror-subject">' + (subject || '') + '</div>' +
            '<div class="mirror-body">' + (body || '').replace(/\n/g, '<br>') + '</div>' +
        '</div>';
        showToast('🪞 灵镜传影：' + (npcName || '某NPC') + '通过灵镜与你对话', 'info');
    }

    function closeMirror() {
        var c = document.getElementById('mailMirrorContainer');
        if (c) c.innerHTML = '';
    }

    function ensureContainer(id) {
        var c = document.getElementById(id);
        if (!c) {
            c = document.createElement('div');
            c.id = id;
            c.className = 'mail-fx-container';
            document.body.appendChild(c);
        }
        return c;
    }

    // ============ 托盘通知 ============
    // 两套 toast 收敛成一套：一律走全站 showMessage（#game-message，层级 var(--x-z-toast)），
    // 原来那枚 .mail-toast 固定卡在右上角 80px、和天气牌抢位且比弹窗还高一层。
    // 兜底分支只在 showMessage 尚未载入的极早期跑，文案与 type 一律原样透传（'urgent' 两边同归 info 蓝）。
    function showToast(text, type) {
        type = type || 'info';
        if (typeof window.showMessage === 'function') { window.showMessage(text, type); return; }
        var colors = { info: '#3b82f6', success: '#10b981', warning: '#f59e0b', error: '#ef4444' };
        var t = document.createElement('div');
        t.className = 'mail-toast';
        t.style.borderLeftColor = colors[type] || colors.info;
        t.textContent = text;
        document.body.appendChild(t);
        setTimeout(function() { t.remove(); }, 3500);
    }

    // ============ 收件箱按钮更新 ============
    function updateUnreadBadge() {
        var btn = document.getElementById('mailInboxBtn');
        if (!btn) return;
        var c = window.MailSystem ? window.MailSystem.getUnreadCount() : 0;
        var badge = btn.querySelector('.mail-unread-badge');
        if (c > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'mail-unread-badge';
                btn.appendChild(badge);
            }
            badge.textContent = c;
            btn.classList.add('mail-has-unread');
        } else {
            if (badge) badge.remove();
            btn.classList.remove('mail-has-unread');
        }
    }

    // ============ 显示收件箱面板 ============
    var _activeTab = 'inbox';

    function openInbox() {
        var p = ensureInboxPanel();
        ensureScrim().classList.add('open');
        p.classList.add('open');
        renderInboxList(_activeTab);
        // 焦点收进对话框：Esc 才有地方落（本窗的 Esc 只在面板内就地结算，不抢全站那套路由）
        if (p.focus) { try { p.focus({ preventScroll: true }); } catch (e) { try { p.focus(); } catch (e2) {} } }
    }

    // 遮罩单独成节点、每次打开现查现补——全站那套管 Esc 的会把 .fixed.inset-0 的节点整块 remove，
    // 牵连不到面板本体，下次打开也补得回来。
    function ensureScrim() {
        var s = document.getElementById('mailInboxScrim');
        if (!s) {
            s = document.createElement('div');
            s.id = 'mailInboxScrim';
            s.className = 'fixed inset-0 mail-modal-scrim';
            s.setAttribute('aria-hidden', 'true');
            s.addEventListener('click', function (e) { if (e.target === s) closeInbox(); });
            document.body.appendChild(s);
        }
        return s;
    }

    function closeInbox() {
        var p = document.getElementById('mailInboxPanel');
        if (p) p.classList.remove('open');
        var s = document.getElementById('mailInboxScrim');
        if (s) s.classList.remove('open');
        closeMail();   // 关窗时把摊开的那封也收掉——否则重开一进来就卡在信里，标签看着像没反应
    }

    // 标签高亮与内容只由这一处结算（旧版只加 .active，重开窗口时高亮会和列表错位）
    function showTab(tab) {
        var want = tab || 'inbox';
        _activeTab = want;
        var p = document.getElementById('mailInboxPanel');
        var tabs = p ? p.querySelectorAll('.mail-tab') : [];
        [].forEach.call(tabs, function (t) {
            var on = t.getAttribute('data-tab') === want;
            t.classList.toggle('active', on);
            t.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        // 双栏之后，右栏那封信会一直摊着——换页必须顺手合上它，否则点「✍️ 写信」看见的还是上一封旧信
        closeMail();
        renderInboxList(want);
    }

    function showTabBtn(btn) {
        if (!btn) return;
        showTab(btn.getAttribute('data-tab') || 'inbox');
    }

    function ensureInboxPanel() {
        var p = document.getElementById('mailInboxPanel');
        if (!p) {
            p = document.createElement('div');
            p.id = 'mailInboxPanel';
            p.className = 'mail-inbox-panel';
            p.setAttribute('role', 'dialog');
            p.setAttribute('aria-modal', 'true');
            p.setAttribute('aria-label', '飞鸽传书');
            p.tabIndex = -1;
            p.innerHTML = '<div class="mail-inbox-header">' +
                '<span class="mail-inbox-title">📬 飞鸽传书</span>' +
                '<button class="mail-inbox-close" onclick="window.MailSystemUI.closeInbox()" aria-label="关闭飞鸽传书">✕</button>' +
            '</div>' +
            '<div class="mail-inbox-tabs" role="tablist">' +
                '<button type="button" class="mail-tab active" role="tab" aria-selected="true" data-tab="inbox">📭 收件箱</button>' +
                '<button type="button" class="mail-tab" role="tab" aria-selected="false" data-tab="outbox">📤 发件箱</button>' +
                '<button type="button" class="mail-tab" role="tab" aria-selected="false" data-tab="favorites">⭐ 收藏</button>' +
                '<button type="button" class="mail-tab" role="tab" aria-selected="false" data-tab="compose">✍️ 写信</button>' +
            '</div>' +
            '<div class="mail-inbox-body">' +
                '<div class="mail-inbox-list" id="mailInboxList"></div>' +
                '<div class="mail-detail-panel" id="mailDetailPanel"></div>' +
            '</div>' +
            '<div class="mail-inbox-footer">' +
                '<span class="mail-foot-note">信由故人寄来，点开一封便算读过。按 Esc 或点身后暗处即可合上。</span>' +
                '<button class="mail-close-btn" onclick="window.MailSystemUI.closeInbox()">✕ 关闭</button>' +
            '</div>';
            document.body.appendChild(p);
            // 标签切换事件
            p.querySelectorAll('.mail-tab').forEach(function(tab) {
                tab.addEventListener('click', function() { showTab(tab.dataset.tab); });
            });
            // 本窗内的 Esc：先收摊开的信，再合窗；就地结算并挡住冒泡，不与全站 Esc 路由抢活
            p.addEventListener('keydown', function(e) {
                if ((e.key || '').toLowerCase() !== 'escape') return;
                e.preventDefault();
                e.stopPropagation();
                var d = document.getElementById('mailDetailPanel');
                if (d && d.classList.contains('open')) closeMail(); else closeInbox();
            });
        }
        return p;
    }

    // 第九十六波·NEW-40：列表分页账——每页 50 封，千八百封不再一次糊出上万个节点
    var MAIL_PAGE_SIZE = 50;
    var _listPage = {};
    function listPage(tab, pg) {
        _listPage[tab] = Math.max(0, Number(pg) || 0);
        renderInboxList(tab);
    }
    function listPageBtn(btn) {
        if (!btn || btn.disabled) return;
        listPage(btn.getAttribute('data-tab') || 'inbox', Number(btn.getAttribute('data-pg')) || 0);
    }

    // 一句话说明这一页装的是什么（顺带给「当前在哪个标签」一个状态强调）
    var _LIST_NOTE = {
        inbox: '📭 收件箱 · 别人寄给你的信都在这儿，左边一道金条的是没读过的。',
        outbox: '📤 发件箱 · 你亲手寄出去的信都在这儿留底。',
        favorites: '⭐ 收藏 · 点开信、按下头那颗 ⭐，收进来的信归在这一页。'
    };

    // 空态不许只写「空空如也」（禁止设计 #2：空着也要说清为什么空、下一步做什么）
    var _EMPTY_TEXT = {
        inbox: {
            icon: '📭', title: '一封也还没有',
            hint: '信是别人寄来的——道侣念你、挚友想起你，才会铺纸落笔；你出远门、不在城里的日子，家书也会一并在驿路上排队。',
            action: 'compose', actionText: '✍️ 写第一封信'
        },
        outbox: {
            icon: '📤', title: '还没寄出过一封信',
            hint: '写信的门在「✍️ 写信」那一页：挑个说得上话的故人寄几行，寄出的信都会在这里留底。',
            action: 'compose', actionText: '✍️ 去写信'
        },
        favorites: {
            icon: '⭐', title: '匣子里还空着',
            hint: '先从收件箱点开一封信，底下那颗 ⭐ 就是收藏；收进来的信才归到这一页，翻旧账不必从头数。',
            action: 'inbox', actionText: '📭 回收件箱找信'
        }
    };

    function _emptyStateHtml(tab, pending) {
        var t = _EMPTY_TEXT[tab] || _EMPTY_TEXT.inbox;
        var html = '<div class="mail-empty">' +
            '<div class="mail-empty__icon">' + t.icon + '</div>' +
            '<p class="mail-empty__title">' + t.title + '</p>' +
            '<p class="mail-empty__hint">' + t.hint + '</p>';
        if (tab === 'inbox' && pending > 0) {
            html += '<p class="mail-empty__pending">另有 ' + pending + ' 封在路上，走着走着就到了。</p>';
        }
        return html +
            '<button type="button" class="mail-empty__btn" data-tab="' + t.action + '" onclick="window.MailSystemUI.showTabBtn(this)">' + t.actionText + '</button>' +
            '</div>';
    }

    function _loadFailHtml() {
        return '<div class="mail-empty">' +
            '<div class="mail-empty__icon">🕸️</div>' +
            '<p class="mail-empty__title">驿路没牵上</p>' +
            '<p class="mail-empty__hint">邮路模块这会儿没在跑，信自然一封也读不到。先合上窗口；再开还是这样，就得刷新页面重新牵线。</p>' +
            '<button type="button" class="mail-empty__btn" onclick="window.MailSystemUI.closeInbox()">✕ 先合上窗口</button>' +
            '</div>';
    }

    function renderInboxList(tab) {
        var list = document.getElementById('mailInboxList');
        if (!list) return;
        if (!window.MailSystem) { list.innerHTML = _loadFailHtml(); return; }
        // 第七十六波·家书邮路：写信一页（收件人名录现编——playerSendMail 的老规矩此前一直没有门）
        if (tab === 'compose') { renderComposeInto(list); return; }
        var data = window.MailSystem.getData() || { inbox: [], outbox: [], favorites: [] };
        var arr;
        if (tab === 'outbox') arr = data.outbox || [];
        else if (tab === 'favorites') arr = data.favorites || [];
        else arr = data.inbox || [];

        if (arr.length === 0) {
            var _pend = (data._pending && data._pending.length) || 0;
            list.innerHTML = _emptyStateHtml(tab, _pend);
            return;
        }

        var carrierIcon = { pigeon: '🐦', mirror: '🪞', jade: '📜', fire: '🔥', beast: '🦅' };
        var importanceClass = { urgent: 'mail-urgent', important: 'mail-important', normal: '' };
        // 第九十六波·NEW-40：只渲染当前页那 50 封，页脚给翻页鈕
        var _total = arr.length;
        var _pages = Math.max(1, Math.ceil(_total / MAIL_PAGE_SIZE));
        var _pg = Math.min(Math.max(0, _listPage[tab] || 0), _pages - 1);
        _listPage[tab] = _pg;
        var html = '<div class="mail-list-note">' + (_LIST_NOTE[tab] || '') +
            '<span class="mail-list-note__n">共 ' + _total + ' 封</span></div>';
        arr.slice(_pg * MAIL_PAGE_SIZE, (_pg + 1) * MAIL_PAGE_SIZE).forEach(function(m) {
            // NEW-41：删掉了这里算了个没人用的 new Date() 死变量（时间文案统一走 formatTimeShort）
            var timeStr = m.receivedAt ? formatTimeShort(m.receivedAt) : (m.sentAt ? formatTimeShort(m.sentAt) : '?');
            html += '<div class="mail-item ' + (m.readAt ? '' : 'mail-unread ') + (importanceClass[m.importance] || '') + '" data-mail-id="' + m.id + '" onclick="window.MailSystemUI.openMail(\'' + m.id + '\')">' +
                '<div class="mail-item-icon">' + (carrierIcon[m.carrier] || '🐦') + '</div>' +
                '<div class="mail-item-body">' +
                    (m.importance === 'urgent' ? '<span class="mail-badge mail-badge-urgent">急</span>' : '') +
                    (m.importance === 'important' ? '<span class="mail-badge mail-badge-important">!</span>' : '') +
                    '<div class="mail-item-from">' + _esc(m.fromNpcName || '系统') + '</div>' +
                    '<div class="mail-item-subject">《' + _esc(m.subject || '(无主题)') + '》</div>' +
                    '<div class="mail-item-preview">' + _esc((m.body || '').slice(0, 50)) + (m.body && m.body.length > 50 ? '…' : '') + '</div>' +
                '</div>' +
                '<div class="mail-item-time">' + timeStr + '</div>' +
            '</div>';
        });
        if (_pages > 1) {
            // 翻页鈕走 data 属性 + 委托口，不在生成的 HTML 里嵌引号转义（引号配对干净，话术哨兵也不误伤）
            html += '<div class="mail-pager">'
                + '<button type="button" class="mail-page-btn" data-tab="' + tab + '" data-pg="' + (_pg - 1) + '" ' + (_pg <= 0 ? 'disabled ' : '') + 'onclick="window.MailSystemUI.listPageBtn(this)">← 上一页</button>'
                + '<span class="mail-page-count">第 ' + (_pg + 1) + ' / ' + _pages + ' 页 · 共 ' + _total + ' 封</span>'
                + '<button type="button" class="mail-page-btn" data-tab="' + tab + '" data-pg="' + (_pg + 1) + '" ' + (_pg >= _pages - 1 ? 'disabled ' : '') + 'onclick="window.MailSystemUI.listPageBtn(this)">下一页 →</button>'
                + '</div>';
        }
        list.innerHTML = html;
    }

    // NEW-41 修：gameMin 是「开局以来的绝对游戏分钟」，旧版直接拿它当「几小时前」，
    // 于是每封信都显示「N天前」（N=已玩天数）。现改为与当前游戏分钟作差；
    // 口径：1 时辰 = 120 分钟（与历法同一把尺），一天 = 1440 分钟。
    function formatTimeShort(gameMin) {
        if (!gameMin && gameMin !== 0) return '?';
        var nowMin = (window.timeSystem && window.timeSystem.gameTime && window.timeSystem.gameTime.totalMinutes) || 0;
        var minsAgo = Math.max(0, nowMin - Number(gameMin));
        if (minsAgo < 60) return minsAgo < 5 ? '刚刚' : minsAgo + '分钟前';
        if (minsAgo < 1440) return Math.max(1, Math.floor(minsAgo / 120)) + '时辰前';
        return Math.floor(minsAgo / 1440) + '天前';
    }

    // ============ 打开单封详情 ============
    // 三本账都要查：旧版只查 inbox，于是发件箱条目挂着 onclick＋cursor:pointer，点下去
    // 什么都不发生也不报错——玩家连「自己寄过什么」都回不去看，更删不掉、收不进收藏。
    function findMailBook(id) {
        var data = window.MailSystem ? window.MailSystem.getData() : null;
        if (!data) return null;
        var books = ['inbox', 'outbox', 'favorites'];
        for (var i = 0; i < books.length; i++) {
            var m = (data[books[i]] || []).find(function(x) { return x.id === id; });
            if (m) return { mail: m, book: books[i], data: data };
        }
        return null;
    }

    function _mailToName(m) {
        try {
            var n = m.toNpcId && window.npcManager ? window.npcManager.getNPC(m.toNpcId) : null;
            return (n && n.name) || '故人';
        } catch (e) { return '故人'; }
    }

    // 双栏右栏的统一开关：摊开一封信与铺开一张信纸共用同一格，左列名录始终不换页
    function _openPane() {
        var d = document.getElementById('mailDetailPanel');
        var p = document.getElementById('mailInboxPanel');
        if (d) d.classList.add('open');
        if (p) p.classList.add('is-split');
        if (d) d.scrollTop = 0;
        return d;
    }

    // 左列里给「此刻读的那一封」一道金条——不加这标记，双栏下玩家分不清右面摊的是哪封
    function _markOpenInList(id) {
        var p = document.getElementById('mailInboxPanel');
        var rows = p && p.querySelectorAll ? p.querySelectorAll('.mail-item') : [];
        [].forEach.call(rows, function (r) {
            r.classList.toggle('is-open', r.getAttribute('data-mail-id') === id);
        });
    }

    var _askDel = null;   // 删信只在窗内二次确认，不再借原生 confirm
    var _lastMailId = null;   // 「先留着」要把同一封信原样摊回来，得知道刚才读的是哪一封

    function openMail(id) {
        var hit = findMailBook(id);
        if (!hit) return;
        var m = hit.mail, book = hit.book, data = hit.data;
        if (book === 'inbox') window.MailSystem.markRead(id);
        _sheet = null;
        _lastMailId = id;
        var detail = _openPane();
        if (!detail) return;

        var carrierName = '';
        var c = window.MailSystem.CARRIERS[m.carrier];
        if (c) carrierName = c.icon + ' ' + c.name;

        var attachments = '';
        if (m.attachments && m.attachments.length > 0) {
            attachments = '<div class="mail-attachments"><b>附件：</b><br>';
            m.attachments.forEach(function(a) {
                attachments += '📦 ' + a.name + ' ×' + a.count + '<br>';
            });
            attachments += '</div>';
        }

        var isFav = data.favorites.find(function(x) { return x.id === id; });
        var actions;
        if (_askDel === id) {
            // 真破坏动作就地问一句：这一封（连同留底）删了就没了
            actions = '<span class="mail-del-ask">这一封删了就再也翻不着了，真删？</span>' +
                '<button type="button" class="mail-act-del" onclick="window.MailSystemUI.deleteMail(\'' + id + '\')">确认删除</button>' +
                '<button type="button" onclick="window.MailSystemUI.keepMail()">先留着</button>';
        } else if (book === 'outbox') {
            // 寄出的信没有「回复」与「收藏」——那是收信方的动作；这一页给的是「再写一封」和「抹掉留底」
            actions = (m.toNpcId ? '<button type="button" class="primary" onclick="window.MailSystemUI.composeTo(\'' + m.toNpcId + '\')">✍️ 再写一封</button>' : '') +
                      '<button type="button" class="mail-act-del" onclick="window.MailSystemUI.askDeleteMail(\'' + id + '\')">🗑️ 删除</button>';
        } else {
            // 收藏页里的信可能只是原件已删的副本——那种信回不出去，就不摆「回复」这枚假入口
            var canReply = book === 'inbox' || !!data.inbox.find(function(x) { return x.id === id; });
            actions = '<button type="button" onclick="window.MailSystemUI.toggleFav(\'' + id + '\')">' + (isFav ? '⭐ 取消收藏' : '⭐ 收藏') + '</button>' +
                      (canReply ? '<button type="button" class="primary" onclick="window.MailSystemUI.replyMail(\'' + id + '\')">💬 回复</button>' : '') +
                      '<button type="button" class="mail-act-del" onclick="window.MailSystemUI.askDeleteMail(\'' + id + '\')">🗑️ 删除</button>';
        }

        // 留底信可以没有地点——空段拿掉，别留下「· ·」这种断句坏了的样子
        var fromBits = (book === 'outbox'
            ? ['寄给 <b>' + _esc(_mailToName(m)) + '</b>', _esc(m.location || ''), carrierName,
               m.sentAt != null ? formatTimeShort(m.sentAt) + '寄出' : '']
            : ['来自 <b>' + _esc(m.fromNpcName || '系统') + '</b>', _esc(m.location || ''), carrierName,
               m.receivedAt ? formatTimeShort(m.receivedAt) + '送达' : '']);
        var fromLine = fromBits.filter(function (x) { return !!x; }).join(' · ');

        detail.innerHTML = '<div class="mail-detail-header">' +
            '<button class="mail-back" onclick="window.MailSystemUI.closeMail()">✕ 合上这封</button>' +
            '<div class="mail-detail-title">《' + _esc(m.subject || '') + '》</div>' +
            '<div class="mail-detail-from">' + fromLine + '</div>' +
        '</div>' +
        '<div class="mail-detail-body">' + _esc(m.body || '').replace(/\n/g, '<br>') + attachments + '</div>' +
        '<div class="mail-detail-actions">' + actions + '</div>';
        _markOpenInList(id);
        updateUnreadBadge();
    }

    function closeMail() {
        _sheet = null;
        _askDel = null;
        var d = document.getElementById('mailDetailPanel');
        if (d) d.classList.remove('open');
        var p = document.getElementById('mailInboxPanel');
        if (p) p.classList.remove('is-split');
        var rows = p && p.querySelectorAll ? p.querySelectorAll('.mail-item.is-open') : [];
        [].forEach.call(rows, function (r) { r.classList.remove('is-open'); });
    }

    function toggleFav(id) {
        if (!window.MailSystem) return;
        var isFav = window.MailSystem.toggleFavorite(id);
        openMail(id);
        showToast(isFav ? '⭐ 已收藏' : '已取消收藏', 'success');
    }

    function askDeleteMail(id) {
        _askDel = id;
        openMail(id);
    }

    function keepMail() {
        _askDel = null;
        if (_lastMailId) openMail(_lastMailId);
    }

    // 点「🗑️ 删除」只把这一行换成确认语，点「确认删除」才真动账（原生 confirm 一律不进游戏窗）
    function deleteMail(id) {
        _askDel = null;
        window.MailSystem.deleteMail(id);
        closeMail();
        renderInboxList(_activeTab);   // 画当前那一页，不再硬掰成收件箱（高亮与内容会错位）
        updateUnreadBadge();
        showToast('已删除', 'info');
    }

    // 第一百一十波 · NEW-60：玩家写的信进 DOM 前必须转义——一句「修仙界<1000」的情话
    // 就能用未闭合标签把列表里后头的信整排吞掉；删除入口又只在详情页，信被吞了连删都没处删。
    function _esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    // 一纸能写多少字，认数据层那一个数（mail-system.js 导出）；截断也在数据层做
    function mailBodyCap() { return (window.MailSystem && window.MailSystem.MAIL_BODY_CAP) || 500; }

    // 超字必须说出口：不能让玩家以为自己寄出去的是整封
    function _clampWarn(text) {
        var cap = mailBodyCap();
        if (text.length > cap) showToast('📜 信纸至此为止，尚余 ' + (text.length - cap) + ' 字未写入', 'warning');
    }

    // ============ 窗内信纸（UI-01）：写信·回复·再写一封共用这一张纸 ============
    // 旧做法是三个入口各弹一只系统框：超没超字、走哪只鸽子、这封寄到哪儿去，全在框子合上
    // 那一瞬蒸发；而且原生框没有本作的皮，看着像网页报错。现在信纸摊在右栏，左列名录不换页。
    var _sheet = null;

    // 容量认数据层那一个数；这里只管「笔停在哪」和「还差多少没落下」
    function _paperFit(raw) {
        var text = String(raw == null ? '' : raw);
        var cap = mailBodyCap();
        if (text.length <= cap) return { text: text, over: 0 };
        return { text: text.slice(0, cap), over: text.length - cap };
    }

    // 载具那行字由 CARRIERS 现算（资费与路速都是寄信那一头的真账，UI 不另立一份）
    function _carrierBrief(c) {
        if (!c) return '';
        var fee = c.isConsumable ? '耗一件' + (c.name || '信物') : (c.cost > 0 ? c.cost + ' 灵石' : '不要钱');
        var wait = (!c.baseDelayMin && !c.randomDelayMin) ? '落纸即达'
            : '最长约 ' + Math.max(1, Math.ceil(((c.baseDelayMin || 0) + (c.randomDelayMin || 0)) / 120)) + ' 时辰';
        return fee + ' · ' + wait;
    }

    // 用不得的载具照样亮着、写明差什么（禁止设计 #2：锁就亮锁，不许整栏藏起来）
    function _carrierRowHtml() {
        var Ms = window.MailSystem;
        var Cs = (Ms && Ms.CARRIERS) || {};
        var out = '';
        Object.keys(Cs).forEach(function (id) {
            var c = Cs[id] || {};
            var av = (Ms.checkCarrierAvailability && Ms.checkCarrierAvailability(id)) || {};
            var on = av.canUse && id === _sheet.carrier;
            out += '<button type="button" class="mail-carrier' + (on ? ' mail-carrier-on' : '') + '"' +
                (av.canUse ? ' onclick="window.MailSystemUI.pickCarrier(\'' + id + '\')">' : ' disabled aria-disabled="true">') +
                '<span class="mail-carrier-name">' + (c.icon || '🐦') + ' ' + (c.name || '驿路') + '</span>' +
                '<span class="mail-carrier-brief">' + _esc(av.canUse ? _carrierBrief(c) : (av.reason || '眼下走不了这一路')) + '</span>' +
                '</button>';
        });
        return out;
    }

    function _carrierNote() {
        var c = ((window.MailSystem && window.MailSystem.CARRIERS) || {})[_sheet.carrier] || {};
        return '寄出这一封：' + _carrierBrief(c) + (c.cost > 0 ? '，资费从灵石里扣。' : '。');
    }

    function _letterSubject() {
        var city = '';
        try { city = (window.currentCharData && window.currentCharData.location) || ''; } catch (e) {}
        return city ? '寄自' + city + '的信' : '寄自远方的信';
    }

    // 摊纸：写信与回信共用一面，差别只在有没有载具可选（回信走飞鸽是驿路的老账）
    function openSheet(sheet) {
        _sheet = sheet;
        var detail = _openPane();
        if (!detail) return true;
        var cap = mailBodyCap();
        detail.innerHTML = '<div class="mail-detail-header">' +
            '<button class="mail-back" onclick="window.MailSystemUI.closeMail()">✕ 不写了</button>' +
            '<div class="mail-detail-title">' + (_sheet.mode === 'reply' ? '💬 回复 ' : '✍️ 写给 ') + _esc(_sheet.npcName) + '</div>' +
            '<div class="mail-detail-from">信皮《' + _esc(_sheet.subject) + '》 · 落款我</div>' +
        '</div>' +
        '<div class="mail-detail-body mail-sheet-body">' +
            '<textarea class="mail-sheet-paper" id="mail-sheet-paper" rows="8" ' +
                'placeholder="一纸可容 ' + cap + ' 字，写满即停笔。" ' +
                'oninput="window.MailSystemUI.onSheetInput(this)">' + _esc(_sheet.body) + '</textarea>' +
            '<div class="mail-sheet-tally">' +
                '<span id="mail-sheet-count">已写 0 / ' + cap + ' 字</span>' +
                '<span class="mail-sheet-over" id="mail-sheet-clamp"></span></div>' +
            (_sheet.mode === 'reply'
                ? '<p class="mail-sheet-note">回信走飞鸽：寄出不要钱；回不回、回得多热络，看交情。</p>'
                : '<div class="mail-sheet-carriers" id="mail-sheet-carriers">' + _carrierRowHtml() + '</div>' +
                  '<p class="mail-sheet-note" id="mail-sheet-note">' + _esc(_carrierNote()) + '</p>') +
        '</div>' +
        '<div class="mail-detail-actions">' +
            '<button type="button" class="primary" onclick="window.MailSystemUI.sendSheet()">' +
                (_sheet.mode === 'reply' ? '💬 寄出回信' : '🕊️ 寄出去') + '</button>' +
            '<button type="button" onclick="window.MailSystemUI.closeMail()">先不寄</button>' +
        '</div>';
        onSheetInput(null);
        var paper = document.getElementById('mail-sheet-paper');
        if (paper && paper.focus) { try { paper.focus({ preventScroll: true }); } catch (e) { try { paper.focus(); } catch (e2) {} } }
        return true;
    }

    // 输入即结算：超出的一刀按回纸上，超出几个字一直摆在计数旁边（不能只闪一句 toast 就完）
    function onSheetInput(paper) {
        if (!_sheet) return;
        if (!paper) paper = document.getElementById('mail-sheet-paper');
        var raw = (paper && typeof paper.value === 'string') ? paper.value : String(_sheet.body || '');
        var fit = _paperFit(raw);
        if (fit.over) {
            // 敲字与贴字要报同一个数：逐字敲满纸时每次只溢出 1 字，累计才是这封没落下的总数
            _sheet.dropped = (_sheet.dropped || 0) + fit.over;
            if (!_sheet.warned) {
                // 这里不报数：toast 只在头一次溢出时闪一下，那刻确实只挡下 1 字，
                // 而纸下那行会一路累计——同一屏两个数各说一套比不喊还糟
                showToast('📜 信纸写满了，多出来的字落不下——差多少看纸下那一行', 'warning');
                _sheet.warned = true;
            }
            if (paper && typeof paper.value === 'string') {
                paper.value = fit.text;
                try { paper.selectionStart = paper.selectionEnd = fit.text.length; } catch (e) {}
            }
        } else {
            _sheet.dropped = 0;
        }
        _sheet.body = fit.text;
        var count = document.getElementById('mail-sheet-count');
        if (count) count.textContent = '已写 ' + fit.text.length + ' / ' + mailBodyCap() + ' 字';
        var clamp = document.getElementById('mail-sheet-clamp');
        if (clamp) clamp.textContent = fit.over ? '📜 信纸至此为止，尚余 ' + _sheet.dropped + ' 字未写入' : '';
    }

    function pickCarrier(id) {
        if (!_sheet || _sheet.mode === 'reply' || !id) return;
        var av = window.MailSystem.checkCarrierAvailability(id);
        if (!av || !av.canUse) return;
        _sheet.carrier = id;
        var row = document.getElementById('mail-sheet-carriers');
        if (row) row.innerHTML = _carrierRowHtml();
        var note = document.getElementById('mail-sheet-note');
        if (note) note.textContent = _carrierNote();
    }

    // 铺纸与寄信分两层：门只管摊纸，账全在驿路老规矩里（资费、境界门槛、回音骰一枚不添）
    function sendSheet() {
        if (!_sheet) return false;
        var mode = _sheet.mode, npcId = _sheet.npcId, mailId = _sheet.mailId, carrier = _sheet.carrier;
        var paper = document.getElementById('mail-sheet-paper');
        var raw = (paper && typeof paper.value === 'string') ? paper.value : String(_sheet.body || '');
        var fit = _paperFit(raw);
        if (fit.over) _clampWarn(raw);
        var ok = mode === 'reply' ? sendReply(mailId, fit.text) : sendCompose(npcId, fit.text, carrier);
        if (ok) {
            closeMail();
            renderInboxList(_activeTab);
            updateUnreadBadge();
        }
        return ok;
    }

    function sendCompose(npcId, body, carrier) {
        var n = window.npcManager && window.npcManager.getNPC ? window.npcManager.getNPC(npcId) : null;
        if (!n) { showToast('寻不着这个人——名录怕是旧了', 'warning'); return false; }
        var text = String(body == null ? '' : body).trim();
        if (!text) { showToast('白纸一张，寄不出去', 'warning'); return false; }
        _clampWarn(text);
        var sent = window.MailSystem.playerSendMail(npcId, n.name || '', _letterSubject(), text.slice(0, mailBodyCap()), carrier || 'pigeon');
        if (sent) { showToast('✅ 信寄出去了——有没有回音，看驿路，也看交情', 'success'); return true; }
        return false;
    }

    function sendReply(mailId, body) {
        var data = window.MailSystem.getData();
        var m = data && data.inbox ? data.inbox.find(function (x) { return x.id === mailId; }) : null;
        if (!m) { showToast('这一封不在收件箱里，没法直接回——再写一封吧', 'warning'); return false; }
        var text = String(body == null ? '' : body).trim();
        if (!text) { showToast('白纸一张，回不出去', 'warning'); return false; }
        _clampWarn(text);
        var ok = window.MailSystem.playerReply(mailId, text.slice(0, mailBodyCap()));
        if (ok) showToast('✅ 已回复' + (m.fromNpcName || ''), 'success');
        else showToast('这封信收不下了——名录怕是旧了', 'warning');
        return ok;
    }

    function replyMail(id) {
        var data = window.MailSystem.getData();
        var m = data.inbox.find(function(x) { return x.id === id; });
        if (!m) { showToast('这一封不在收件箱里，没法直接回——再写一封吧', 'warning'); return false; }
        return openSheet({ mode: 'reply', mailId: id, npcId: m.fromNpcId || '',
            npcName: m.fromNpcName || '故人', subject: '回复: ' + (m.subject || ''), body: '', carrier: 'pigeon' });
    }

    // ============ 第七十六波 · 家书邮路：主动写信的门 ============
    // 邮路的老规矩全是现成的（v23.2/v23.3：资费真扣、修书费时、回音按好感排概率、
    // 至交回信暖情分、信来得勤回信自然变短）——唯独 playerSendMail 一直没有门，
    // 玩家想给道侣挚友写封信都寻不着纸笔。这一页把门开出来：
    // 名录现编（道侣置顶，好感二十以上的故人列后——生人不寄信），寄出全走驿路老账。
    function writableRecipients() {
        var out = [];
        try {
            var mgr = window.npcManager;
            if (!mgr || typeof mgr.getAllNPCs !== 'function') return out;
            var bonds = (window.currentCharData && window.currentCharData.bonds) || {};
            (mgr.getAllNPCs() || []).forEach(function (n) {
                if (!n || !n.id) return;
                var aff = (n.relationship && Number(n.relationship.affection)) || 0;
                var isDao = false;
                for (var b in bonds) {
                    if (bonds[b] && bonds[b].type === 'dao_companion' && (b === n.id || bonds[b].name === n.name)) { isDao = true; break; }
                }
                var flags = n.relationship && n.relationship.flags;
                if (!isDao && flags && typeof flags.has === 'function' && flags.has('dao_companion')) isDao = true;
                if (!isDao && aff < 20) return;   // 生人不寄信
                out.push({ id: n.id, name: n.name || '故人', loc: n.location || '', aff: aff, dao: isDao });
            });
        } catch (e) {}
        out.sort(function (a, b) { return (b.dao - a.dao) || (b.aff - a.aff); });
        return out;
    }

    function renderComposeInto(list) {
        var rec = writableRecipients();
        if (!rec.length) {
            list.innerHTML = '<div class="mail-empty">' +
                '<div class="mail-empty__icon">🕊️</div>' +
                '<p class="mail-empty__title">江湖茫茫，还没有一个能写信的人</p>' +
                '<p class="mail-empty__hint">信得寄给说得上话的人，才有人收得下：去城里攀谈、结善缘（好感二十以上才通邮路），或与人结为道侣——名字一上进名录，这一页立刻就有纸笔。</p>' +
                '</div>';
            return;
        }
        var html = '<div class="mail-list-note">📮 信随驿路走：飞鸽免费路慢，灵镜五十灵石落纸即达。有没有回音、回得多热络，看交情。' +
            '<span class="mail-list-note__n">可写 ' + rec.length + ' 人</span></div>';
        rec.forEach(function (r) {
            html += '<div class="mail-item mail-item--person" onclick="window.MailSystemUI.composeTo(\'' + r.id + '\')">' +
                '<div class="mail-item-icon">' + (r.dao ? '💞' : '🧑') + '</div>' +
                '<div class="mail-item-body">' +
                    '<div class="mail-person-name">' + _esc(r.name) + (r.dao ? ' <span class="mail-badge mail-badge-dao">道侣</span>' : '') + '</div>' +
                    '<div class="mail-person-meta">' + (r.loc ? '身在' + _esc(r.loc) + ' · ' : '') + '好感 ' + r.aff + '</div>' +
                '</div>' +
                '<div class="mail-person-go">✍️ 写信</div>' +
            '</div>';
        });
        list.innerHTML = html;
    }

    // 「写信」与发件箱的「再写一封」同一条路：只摊纸，不替玩家决定载具，也不弹系统框
    function composeTo(npcId) {
        var n = window.npcManager && window.npcManager.getNPC ? window.npcManager.getNPC(npcId) : null;
        if (!n) { showToast('寻不着这个人——名录怕是旧了', 'warning'); return false; }
        return openSheet({ mode: 'send', npcId: npcId, npcName: n.name || '故人',
            subject: _letterSubject(), body: '', carrier: 'pigeon' });
    }

    // ============ 整合到NPCLifeSystem的"主动行为真实化" ============
    function showArrivalAnimation(mail) {
        if (!mail) return;
        var carrier = mail.carrier || 'pigeon';
        var fromName = mail.fromNpcName || '';
        if (carrier === 'pigeon') flyInPigeon(fromName);
        else if (carrier === 'jade') dropJadeScroll('重要');
        else if (carrier === 'mirror') showMirror(fromName, mail.subject, mail.body);
        else if (carrier === 'fire') showToast('🔥 传音符：' + fromName + '传来急信', 'urgent');
        else if (carrier === 'beast') showToast('🦅 灵兽信使：' + fromName + '远距离传信', 'urgent');
        else flyInPigeon(fromName);
    }

    // 暴露到全局
    if (typeof window !== 'undefined') {
        window.MailSystemUI = {
            openInbox: openInbox,
            closeInbox: closeInbox,
            showTab: showTab,          // 标签高亮与内容的唯一结算口（空态按钮也走它）
            showTabBtn: showTabBtn,
            listPage: listPage,   // 第九十六波·NEW-40：收件箱翻页口
            listPageBtn: listPageBtn,
            openMail: openMail,
            closeMail: closeMail,
            toggleFav: toggleFav,
            deleteMail: deleteMail,
            askDeleteMail: askDeleteMail,
            keepMail: keepMail,
            replyMail: replyMail,
            composeTo: composeTo,
            openSheet: openSheet,
            onSheetInput: onSheetInput,
            pickCarrier: pickCarrier,
            sendSheet: sendSheet,
            sendCompose: sendCompose,
            sendReply: sendReply,
            writableRecipients: writableRecipients,
            renderComposeInto: renderComposeInto,
            updateUnreadBadge: updateUnreadBadge,
            showArrivalAnimation: showArrivalAnimation,
            showToast: showToast,
            flyInPigeon: flyInPigeon,
            dropJadeScroll: dropJadeScroll,
            showMirror: showMirror,
            closeMirror: closeMirror,
            renderInboxList: renderInboxList,
            formatTimeShort: formatTimeShort
        };
    }

    // 启动时 + 每5秒更新一次（与time-system同步推进待收邮件 + 更新UI）
    function startPeriodicUpdate() {
        if (window.MailSystem && typeof window.MailSystem.advancePendingMail === 'function') {
            try { window.MailSystem.advancePendingMail(); } catch (e) {}
        }
        updateUnreadBadge();
        updateQuickStatus();
    }
    setInterval(startPeriodicUpdate, 5000);

    // 更新人物页快速状态文字
    function updateQuickStatus() {
        var el = document.getElementById('mail-quick-status');
        if (!el) return;
        if (!window.MailSystem) { el.textContent = '系统未加载'; return; }
        var c = window.MailSystem.getUnreadCount();
        var pending = 0;
        if (window.MailSystem.getData() && window.MailSystem.getData()._pending) {
            pending = window.MailSystem.getData()._pending.length;
        }
        if (c > 0) {
            el.innerHTML = '<span style="color:#fbbf24;">📩 ' + c + '封未读</span>';
        } else if (pending > 0) {
            el.innerHTML = '<span style="color:#94a3b8;">' + pending + '封在路上</span>';
        } else {
            el.innerHTML = '<span style="color:var(--x-muted);">无新信</span>';
        }
    }
})();
