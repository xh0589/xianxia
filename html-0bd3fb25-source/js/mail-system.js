/**
 * mail-system.js - 飞鸽传书/灵器传讯系统 v12.0
 *
 * 功能：
 * - 5种载具（飞鸽/灵镜/玉简/传音符/灵兽）
 * - 玩家境界限制可用载具
 * - 收信延迟（飞鸽/玉简有延迟，灵镜/传音符即时）
 * - 截获机制（飞鸽5%被截）
 * - 消息重要性分级（urgent/important/normal）
 * - 附件物品系统
 * - NPC智能回复
 * - 存档集成
 *
 * 依赖：global-utils.js
 */
(function() {
    'use strict';

    // ============ 载具定义 ============
    var CARRIERS = {
        pigeon: {
            id: 'pigeon', name: '飞鸽传书', icon: '🐦',
            minRealm: '凡人', minLayer: 1,
            baseDelayMin: 60,  // 1游戏小时
            randomDelayMin: 300, // 最多5小时
            interceptChance: 0.05,
            cost: 0,
            dailyLimit: 3,
            description: '最普及的传讯方式，受距离影响'
        },
        mirror: {
            id: 'mirror', name: '灵镜传影', icon: '🪞',
            minRealm: '筑基', minLayer: 1,
            baseDelayMin: 0,
            randomDelayMin: 0,
            interceptChance: 0.01,
            cost: 50,  // 50灵石/次
            dailyLimit: 2,
            description: '法术传影，实时但需消耗灵石'
        },
        jade: {
            id: 'jade', name: '玉简飞书', icon: '📜',
            minRealm: '金丹', minLayer: 1,
            baseDelayMin: 15,
            randomDelayMin: 90,
            interceptChance: 0.02,
            cost: 20,
            dailyLimit: 3,
            description: '御剑飞书，安全防截获'
        },
        fire: {
            id: 'fire', name: '传音符', icon: '🔥',
            minRealm: '元婴', minLayer: 1,
            baseDelayMin: 0,
            randomDelayMin: 0,
            interceptChance: 0,
            cost: 0,  // 消耗道具
            dailyLimit: 999,
            isConsumable: true,
            itemId: 'tal_transmission',
            description: '一次性远距离传音符'
        },
        beast: {
            id: 'beast', name: '灵兽信使', icon: '🦅',
            minRealm: '化神', minLayer: 1,
            baseDelayMin: 720,  // 半天
            randomDelayMin: 720,
            interceptChance: 0,
            cost: 0,
            dailyLimit: 5,
            isConsumable: true,
            itemId: 'pet_immortal_crane',
            description: '跨大区域传讯，不受距离限制'
        }
    };

    // ============ 重要性分级 ============
    var IMPORTANCE = {
        urgent: { label: '紧急', color: '#ef4444', popup: true, sound: true },
        important: { label: '重要', color: '#f59e0b', popup: true, sound: false },
        normal: { label: '一般', color: '#94a3b8', popup: false, sound: false }
    };

    // ============ 主角境界判定 ============
    function getPlayerRealm() {
        var cd = window.currentCharData;
        if (!cd) return { realm: '凡人', layer: 1 };
        return { realm: cd.realm || '凡人', layer: cd.layer || 1 };
    }

    var REALM_ORDER = ['凡人', '炼气', '筑基', '金丹', '元婴', '化神', '大乘', '渡劫'];
    function realmIndex(realm) {
        return REALM_ORDER.indexOf(realm);
    }

    /**
     * 根据玩家境界判断载具是否可用
     * @returns {canUse: bool, reason: string, availableCarriers: []}
     */
    function checkCarrierAvailability(carrierId) {
        var carrier = CARRIERS[carrierId];
        if (!carrier) return { canUse: false, reason: '未知载具' };

        var pr = getPlayerRealm();
        var playerIdx = realmIndex(pr.realm);
        var requiredIdx = realmIndex(carrier.minRealm);

        if (playerIdx < requiredIdx) {
            return {
                canUse: false,
                reason: '境界不足（需' + carrier.minRealm + '）',
                needRealm: carrier.minRealm
            };
        }

        // 道具类检查
        if (carrier.isConsumable) {
            var hasItem = false;
            if (typeof window._countInventoryItem === 'function') {
                hasItem = window._countInventoryItem(carrier.itemId) > 0;
            } else if (window.inventory && window.inventory.slots) {
                hasItem = window.inventory.slots.some(function(s) { return s && s.templateId === carrier.itemId; });
            }
            if (!hasItem) {
                return { canUse: false, reason: '缺少' + (carrier.name) };
            }
        }

        return { canUse: true };
    }

    // ============ 消息存储 ============
    function generateId() {
        return 'mail_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    }

    /**
     * 发送邮件（核心入口）
     * @param {Object} opts
     *   fromNpcId, fromNpcName, subject, body, location
     *   carrier: 'pigeon'|'mirror'|'jade'|'fire'|'beast'
     *   importance: 'normal'|'important'|'urgent'
     *   attachments: [{name, count, itemId}]
     *   fromPlayer: bool - 是否玩家发送
     *   toNpcId: 收件人NPC ID
     */
    function sendMail(opts) {
        opts = opts || {};
        if (!opts.subject || !opts.body) {
            if (window.showMessage) window.showMessage('邮件内容不能为空', 'error');
            return null;
        }
        var carrier = CARRIERS[opts.carrier || 'pigeon'];
        var pr = getPlayerRealm();
        var playerIdx = realmIndex(pr.realm);
        var requiredIdx = realmIndex(carrier.minRealm);

        // 计算延迟
        var delayMin = 0;
        if (carrier.baseDelayMin > 0) {
            delayMin = carrier.baseDelayMin + Math.floor(Math.random() * carrier.randomDelayMin);
        }

        // 计算截获
        var intercepted = false;
        if (Math.random() < carrier.interceptChance) {
            intercepted = true;
        }

        // 转化延迟为游戏时间
        var currentGameMin = (window.timeSystem && window.timeSystem.gameTime)
            ? (window.timeSystem.gameTime.totalMinutes || 0) : 0;
        var arriveAt = currentGameMin + delayMin;

        var mail = {
            id: generateId(),
            type: opts.fromPlayer ? 'player_sent' : 'npc_letter',
            fromNpcId: opts.fromNpcId || null,
            fromNpcName: opts.fromNpcName || (opts.fromPlayer ? '我' : '系统'),
            toNpcId: opts.toNpcId || null,
            subject: opts.subject,
            body: opts.body,
            location: opts.location || '',
            carrier: opts.carrier || 'pigeon',
            importance: opts.importance || 'normal',
            attachments: opts.attachments || [],
            sentAt: currentGameMin,
            arriveAt: arriveAt,
            receivedAt: null,
            readAt: null,
            intercepted: intercepted,
            fromPlayer: !!opts.fromPlayer
        };

        if (!window._mailSystemData) {
            window._mailSystemData = { inbox: [], outbox: [], favorites: [] };
        }

        if (opts.fromPlayer) {
            window._mailSystemData.outbox.unshift(mail);
        } else {
            // NPC发信放入待收件箱
            if (!window._mailSystemData._pending) window._mailSystemData._pending = [];
            window._mailSystemData._pending.push(mail);
            // 立即到达的（灵镜/传音符）直接入收件箱
            if (delayMin === 0 && !intercepted) {
                moveToInbox(mail);
            }
        }
        saveMailData();
        return mail;
    }

    // 推进待收邮件
    function advancePendingMail() {
        if (!window._mailSystemData) return;
        if (!window._mailSystemData._pending) return;
        var currentGameMin = (window.timeSystem && window.timeSystem.gameTime)
            ? (window.timeSystem.gameTime.totalMinutes || 0) : 0;
        var toMove = [];
        window._mailSystemData._pending = window._mailSystemData._pending.filter(function(m) {
            if (m.arriveAt <= currentGameMin) {
                toMove.push(m);
                return false;
            }
            return true;
        });
        toMove.forEach(function(m) { moveToInbox(m); });
        if (toMove.length > 0) saveMailData();
    }

    // 移到收件箱
    function moveToInbox(mail) {
        if (!window._mailSystemData) window._mailSystemData = { inbox: [], outbox: [], favorites: [] };
        mail.receivedAt = (window.timeSystem && window.timeSystem.gameTime)
            ? window.timeSystem.gameTime.totalMinutes : 0;
        window._mailSystemData.inbox.unshift(mail);

        if (!mail.intercepted && window._mailSystemUI) {
            window._mailSystemUI.showArrivalAnimation(mail);
        } else if (mail.intercepted && window.showMessage) {
            window.showMessage('📜 飞鸽被截获！' + mail.subject + '未送达', 'error');
        }
        if (window._mailSystemUI) window._mailSystemUI.updateUnreadBadge();
    }

    // 标记已读
    function markRead(id) {
        if (!window._mailSystemData) return;
        var m = window._mailSystemData.inbox.find(function(x) { return x.id === id; });
        if (m && !m.readAt) {
            m.readAt = (window.timeSystem && window.timeSystem.gameTime)
                ? window.timeSystem.gameTime.totalMinutes : 0;
            saveMailData();
            if (window._mailSystemUI) window._mailSystemUI.updateUnreadBadge();
        }
    }

    // 删除
    function deleteMail(id) {
        if (!window._mailSystemData) return;
        window._mailSystemData.inbox = window._mailSystemData.inbox.filter(function(x) { return x.id !== id; });
        window._mailSystemData.favorites = window._mailSystemData.favorites.filter(function(x) { return x.id !== id; });
        saveMailData();
        if (window._mailSystemUI) window._mailSystemUI.updateUnreadBadge();
    }

    // 收藏切换
    function toggleFavorite(id) {
        if (!window._mailSystemData) return false;
        var exists = window._mailSystemData.favorites.find(function(x) { return x.id === id; });
        if (exists) {
            window._mailSystemData.favorites = window._mailSystemData.favorites.filter(function(x) { return x.id !== id; });
            saveMailData();
            return false;
        } else {
            var m = window._mailSystemData.inbox.find(function(x) { return x.id === id; });
            if (m) {
                window._mailSystemData.favorites.push(m);
                saveMailData();
                return true;
            }
        }
        return false;
    }

    // 获取未读数
    function getUnreadCount() {
        if (!window._mailSystemData) return 0;
        return window._mailSystemData.inbox.filter(function(x) { return !x.readAt; }).length;
    }

    // 玩家回复NPC（智能回信概率）
    function playerReply(mailId, text) {
        if (!window._mailSystemData) return;
        var orig = window._mailSystemData.inbox.find(function(x) { return x.id === mailId; });
        if (!orig) return;
        if (!text || !text.trim()) return;

        // 记录玩家发信
        sendMail({
            fromPlayer: true,
            toNpcId: orig.fromNpcId,
            fromNpcName: '我',
            subject: '回复: ' + orig.subject,
            body: text.trim(),
            carrier: 'pigeon',
            importance: 'normal'
        });

        // 计算NPC回信概率（基于好感度）
        var npc = orig.fromNpcId && window.npcManager ? window.npcManager.getNPC(orig.fromNpcId) : null;
        var replyProb = 0.5;
        if (npc) {
            var aff = npc.relationship ? (npc.relationship.affection || 0) : 0;
            if (npc.relationship && npc.relationship.flags && npc.relationship.flags.has('dao_companion')) replyProb = 0.95;
            else if (aff > 80) replyProb = 0.85;
            else if (aff > 60) replyProb = 0.7;
            else if (aff > 40) replyProb = 0.5;
            else if (aff > 20) replyProb = 0.3;
            else if (aff < -30) replyProb = 0.05;
            else if (aff < -60) replyProb = 0;
        }

        if (Math.random() < replyProb) {
            // 安排NPC回信（2-6个游戏小时后），关闭页面/读档后仍可恢复。
            var replyDelay = 120 + Math.floor(Math.random() * 240);
            if (window.GameScheduler) {
                window.GameScheduler.schedule('mail:auto_reply', window.GameScheduler.nowMinute() + replyDelay, { originalMail: orig });
            } else {
                // 调度器缺失时不伪造现实时间延迟：直接回信，保证逻辑一致。
                sendAutoReplyFromNPC(orig);
            }
        }
    }

    // NPC智能回复
    function sendAutoReplyFromNPC(orig) {
        var replyBank = {
            high: [
                '知道了，速来。', '我也正想找你。', '好。', '诺。', '此事重大，需当面商议。', '记得小心。'
            ],
            mid: [
                '知道了。', '好的。', '我考虑一下。', '承蒙挂念。', '多谢。', '行。', '可。'
            ],
            low: [
                '知道了。', '嗯。', '行。', '改日再议。', '此事我需细想。', '……'
            ],
            refuse: [
                '我不见外人。', '此事休提。', '你我无话可说。', '别来烦我。'
            ]
        };
        var replyArr = replyBank.mid;
        if (orig.fromNpcName) {
            // 这里可以加特定NPC回复库
        }
        var text = replyArr[Math.floor(Math.random() * replyArr.length)];
        // 优先用灵镜（如果可用）
        var carrierId = 'pigeon';
        var pr = getPlayerRealm();
        if (realmIndex(pr.realm) >= realmIndex('筑基')) carrierId = 'mirror';
        if (realmIndex(pr.realm) >= realmIndex('金丹')) carrierId = 'jade';
        sendMail({
            fromNpcId: orig.fromNpcId,
            fromNpcName: orig.fromNpcName,
            subject: '回复: ' + orig.subject,
            body: text,
            carrier: carrierId,
            location: orig.location,
            importance: 'normal'
        });
    }

    // 玩家给NPC发信（带载具选择）
    function playerSendMail(toNpcId, toNpcName, subject, body, carrierId) {
        var avail = checkCarrierAvailability(carrierId || 'pigeon');
        if (!avail.canUse) {
            if (window.showMessage) window.showMessage(avail.reason, 'error');
            return null;
        }
        return sendMail({
            fromPlayer: true,
            toNpcId: toNpcId,
            fromNpcName: '我',
            subject: subject,
            body: body,
            carrier: carrierId || 'pigeon',
            importance: 'normal'
        });
    }

    // 暴露给NPCLifeSystem的便捷接口
    function sendNPCMail(npc, body, importance) {
        importance = importance || 'normal';
        // NPC发信默认用飞鸽
        return sendMail({
            fromNpcId: npc.id,
            fromNpcName: npc.name,
            subject: generateNPCSubject(npc, importance),
            body: body,
            carrier: 'pigeon',
            location: npc.location || '',
            importance: importance
        });
    }

    // 根据NPC身份生成主题
    function generateNPCSubject(npc, importance) {
        var t = (npc.occupation || '') + '的问候';
        if (importance === 'urgent') return '紧急: ' + t;
        if (importance === 'important') return '重要: ' + t;
        return t;
    }

    // ============ 存档 ============
    function saveMailData() {
        if (!window._mailSystemData) return;
        try {
            localStorage.setItem('xianxia_mail_system', JSON.stringify(window._mailSystemData));
        } catch (e) {}
    }

    function loadMailData() {
        try {
            var raw = localStorage.getItem('xianxia_mail_system');
            if (raw) {
                window._mailSystemData = JSON.parse(raw);
                if (!window._mailSystemData._pending) window._mailSystemData._pending = [];
                return true;
            }
        } catch (e) {}
        window._mailSystemData = { inbox: [], outbox: [], favorites: [], _pending: [] };
        return false;
    }

    // 清理过期消息（30天普通/90天重要/永不过期紧急）
    function cleanupExpiredMail() {
        if (!window._mailSystemData) return;
        var currentGameMin = (window.timeSystem && window.timeSystem.gameTime)
            ? window.timeSystem.gameTime.totalMinutes : 0;
        var day = 24 * 60;
        window._mailSystemData.inbox = window._mailSystemData.inbox.filter(function(m) {
            if (m.importance === 'urgent') return true;
            if (!m.receivedAt) return true;
            var age = currentGameMin - m.receivedAt;
            if (m.importance === 'important') return age < 90 * day;
            return age < 30 * day;
        });
    }

    if (window.GameScheduler) {
        window.GameScheduler.registerHandler('mail:auto_reply', function(payload) {
            if (!payload || !payload.originalMail) return true;
            sendAutoReplyFromNPC(payload.originalMail);
            return true;
        });
    }

    // v12.1：邮件作为当前存档的模块状态；localStorage 仅保留旧版兼容。
    if (window.StateRegistry) {
        window.StateRegistry.register('mail', {
            version: 1,
            export: function() {
                return JSON.parse(JSON.stringify(window._mailSystemData || { inbox: [], outbox: [], favorites: [], _pending: [] }));
            },
            import: function(data) {
                window._mailSystemData = data && typeof data === 'object'
                    ? JSON.parse(JSON.stringify(data))
                    : { inbox: [], outbox: [], favorites: [], _pending: [] };
                if (!window._mailSystemData._pending) window._mailSystemData._pending = [];
            },
            reset: function() { window._mailSystemData = { inbox: [], outbox: [], favorites: [], _pending: [] }; }
        });
    }

    // ============ 暴露到全局 ============
    if (typeof window !== 'undefined') {
        window.MailSystem = {
            CARRIERS: CARRIERS,
            IMPORTANCE: IMPORTANCE,
            send: sendMail,
            sendNPCMail: sendNPCMail,
            playerSendMail: playerSendMail,
            playerReply: playerReply,
            markRead: markRead,
            deleteMail: deleteMail,
            toggleFavorite: toggleFavorite,
            getUnreadCount: getUnreadCount,
            advancePendingMail: advancePendingMail,
            checkCarrierAvailability: checkCarrierAvailability,
            loadMailData: loadMailData,
            saveMailData: saveMailData,
            cleanupExpiredMail: cleanupExpiredMail,
            moveToInbox: moveToInbox,
            getPlayerRealm: getPlayerRealm,
            realmIndex: realmIndex,
            getData: function() { return window._mailSystemData; }
        };
    }
})();
