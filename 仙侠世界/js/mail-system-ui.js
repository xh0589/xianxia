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
    function showToast(text, type) {
        type = type || 'info';
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
    function openInbox() {
        var p = ensureInboxPanel();
        p.classList.add('open');
        renderInboxList('inbox');
    }

    function closeInbox() {
        var p = document.getElementById('mailInboxPanel');
        if (p) p.classList.remove('open');
    }

    function ensureInboxPanel() {
        var p = document.getElementById('mailInboxPanel');
        if (!p) {
            p = document.createElement('div');
            p.id = 'mailInboxPanel';
            p.className = 'mail-inbox-panel';
            p.innerHTML = '<div class="mail-inbox-header">' +
                '<span class="mail-inbox-title">📬 飞鸽传书</span>' +
                '<button class="mail-inbox-close" onclick="window.MailSystemUI.closeInbox()">×</button>' +
            '</div>' +
            '<div class="mail-inbox-tabs">' +
                '<div class="mail-tab active" data-tab="inbox">📭 收件箱</div>' +
                '<div class="mail-tab" data-tab="outbox">📤 发件箱</div>' +
                '<div class="mail-tab" data-tab="favorites">⭐ 收藏</div>' +
            '</div>' +
            '<div class="mail-inbox-list" id="mailInboxList"></div>' +
            '<div class="mail-detail-panel" id="mailDetailPanel"></div>';
            document.body.appendChild(p);
            // 标签切换事件
            p.querySelectorAll('.mail-tab').forEach(function(tab) {
                tab.addEventListener('click', function() {
                    p.querySelectorAll('.mail-tab').forEach(function(t) { t.classList.remove('active'); });
                    tab.classList.add('active');
                    renderInboxList(tab.dataset.tab);
                });
            });
        }
        return p;
    }

    function renderInboxList(tab) {
        var list = document.getElementById('mailInboxList');
        if (!list) return;
        if (!window.MailSystem) { list.innerHTML = '<div style="padding:40px; text-align:center; color:#888;">邮件系统未加载</div>'; return; }
        var data = window.MailSystem.getData() || { inbox: [], outbox: [], favorites: [] };
        var arr;
        if (tab === 'outbox') arr = data.outbox || [];
        else if (tab === 'favorites') arr = data.favorites || [];
        else arr = data.inbox || [];

        if (arr.length === 0) {
            list.innerHTML = '<div style="padding:40px; text-align:center; color:#888;">空空如也</div>';
            return;
        }

        var carrierIcon = { pigeon: '🐦', mirror: '🪞', jade: '📜', fire: '🔥', beast: '🦅' };
        var importanceClass = { urgent: 'mail-urgent', important: 'mail-important', normal: '' };
        var html = '';
        arr.forEach(function(m) {
            var dt = new Date();
            dt.setTime((m.receivedAt || m.sentAt || 0) * 60000 + (Date.now() - (window.timeSystem ? window.timeSystem.gameTime.totalMinutes * 60000 : Date.now())));
            // 简化：直接显示实际时间
            var timeStr = m.receivedAt ? formatTimeShort(m.receivedAt) : (m.sentAt ? formatTimeShort(m.sentAt) : '?');
            html += '<div class="mail-item ' + (m.readAt ? '' : 'mail-unread ') + (importanceClass[m.importance] || '') + '" onclick="window.MailSystemUI.openMail(\'' + m.id + '\')">' +
                '<div class="mail-item-icon">' + (carrierIcon[m.carrier] || '🐦') + '</div>' +
                '<div class="mail-item-body">' +
                    (m.importance === 'urgent' ? '<span class="mail-badge mail-badge-urgent">急</span>' : '') +
                    (m.importance === 'important' ? '<span class="mail-badge mail-badge-important">!</span>' : '') +
                    '<div class="mail-item-from">' + (m.fromNpcName || '系统') + '</div>' +
                    '<div class="mail-item-subject">《' + (m.subject || '(无主题)') + '》</div>' +
                    '<div class="mail-item-preview">' + (m.body || '').slice(0, 50) + (m.body && m.body.length > 50 ? '…' : '') + '</div>' +
                '</div>' +
                '<div class="mail-item-time">' + timeStr + '</div>' +
            '</div>';
        });
        list.innerHTML = html;
    }

    function formatTimeShort(gameMin) {
        if (!gameMin) return '?';
        // 转为真实时间显示
        var date = new Date();
        var hoursAgo = Math.floor(gameMin / 60);
        if (hoursAgo < 1) return '刚刚';
        if (hoursAgo < 24) return hoursAgo + '时辰前';
        return Math.floor(hoursAgo / 24) + '天前';
    }

    // ============ 打开单封详情 ============
    function openMail(id) {
        if (window.MailSystem) window.MailSystem.markRead(id);
        var data = window.MailSystem ? window.MailSystem.getData() : null;
        if (!data) return;
        var m = data.inbox.find(function(x) { return x.id === id; });
        if (!m) return;
        var detail = document.getElementById('mailDetailPanel');
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
        var actions = '<button onclick="window.MailSystemUI.toggleFav(\'' + id + '\')">' + (isFav ? '⭐ 取消收藏' : '⭐ 收藏') + '</button>' +
                      '<button class="primary" onclick="window.MailSystemUI.replyMail(\'' + id + '\')">💬 回复</button>' +
                      '<button onclick="window.MailSystemUI.deleteMail(\'' + id + '\')">🗑️ 删除</button>';

        detail.innerHTML = '<div class="mail-detail-header">' +
            '<button class="mail-back" onclick="window.MailSystemUI.closeMail()">←</button>' +
            '<div class="mail-detail-title">《' + (m.subject || '') + '》</div>' +
            '<div class="mail-detail-from">来自 <b>' + (m.fromNpcName || '系统') + '</b> · ' + (m.location || '') + ' · ' + carrierName + '</div>' +
        '</div>' +
        '<div class="mail-detail-body">' + (m.body || '').replace(/\n/g, '<br>') + attachments + '</div>' +
        '<div class="mail-detail-actions">' + actions + '</div>';
        detail.classList.add('open');
        updateUnreadBadge();
    }

    function closeMail() {
        var detail = document.getElementById('mailDetailPanel');
        if (detail) detail.classList.remove('open');
    }

    function toggleFav(id) {
        if (!window.MailSystem) return;
        var isFav = window.MailSystem.toggleFavorite(id);
        openMail(id);
        showToast(isFav ? '⭐ 已收藏' : '已取消收藏', 'success');
    }

    function deleteMail(id) {
        if (window.confirm('确定删除此邮件？')) {
            window.MailSystem.deleteMail(id);
            closeMail();
            renderInboxList('inbox');
            updateUnreadBadge();
            showToast('已删除', 'info');
        }
    }

    function replyMail(id) {
        var data = window.MailSystem.getData();
        var m = data.inbox.find(function(x) { return x.id === id; });
        if (!m) return;
        var text = prompt('回复 ' + (m.fromNpcName || '') + '：\n\n你的回信：', '');
        if (text && text.trim()) {
            window.MailSystem.playerReply(id, text.trim());
            showToast('✅ 已回复' + m.fromNpcName, 'success');
        }
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
            openMail: openMail,
            closeMail: closeMail,
            toggleFav: toggleFav,
            deleteMail: deleteMail,
            replyMail: replyMail,
            updateUnreadBadge: updateUnreadBadge,
            showArrivalAnimation: showArrivalAnimation,
            showToast: showToast,
            flyInPigeon: flyInPigeon,
            dropJadeScroll: dropJadeScroll,
            showMirror: showMirror,
            closeMirror: closeMirror,
            renderInboxList: renderInboxList
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
            el.innerHTML = '<span style="color:#6b7280;">无新信</span>';
        }
    }
})();
