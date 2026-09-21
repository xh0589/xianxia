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
            // 第七十六波·顺手拔一根刺：即达信要同时从待收队列摘出去——
            // 此前它两头挂着，五秒轮询再送一遍，灵镜来信封封都是双份
            if (delayMin === 0 && !intercepted) {
                var _piDup = window._mailSystemData._pending.indexOf(mail);
                if (_piDup >= 0) window._mailSystemData._pending.splice(_piDup, 1);
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
        enforceInboxCap();   // NEW-40②：入箱即封顶，洪水信挤掉最旧的，收件箱不再无限膨胀

        if (!mail.intercepted && window.MailSystemUI) {
            window.MailSystemUI.showArrivalAnimation(mail);
        } else if (mail.intercepted && window.showMessage) {
            window.showMessage('📜 飞鸽被截获！' + mail.subject + '未送达', 'error');
        }
        if (window.MailSystemUI) window.MailSystemUI.updateUnreadBadge();
    }

    // 标记已读
    function markRead(id) {
        if (!window._mailSystemData) return;
        var m = window._mailSystemData.inbox.find(function(x) { return x.id === id; });
        if (m && !m.readAt) {
            m.readAt = (window.timeSystem && window.timeSystem.gameTime)
                ? window.timeSystem.gameTime.totalMinutes : 0;
            saveMailData();
            if (window.MailSystemUI) window.MailSystemUI.updateUnreadBadge();
        }
    }

    // 删除
    function deleteMail(id) {
        if (!window._mailSystemData) return;
        window._mailSystemData.inbox = window._mailSystemData.inbox.filter(function(x) { return x.id !== id; });
        window._mailSystemData.favorites = window._mailSystemData.favorites.filter(function(x) { return x.id !== id; });
        saveMailData();
        if (window.MailSystemUI) window.MailSystemUI.updateUnreadBadge();
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
        // v23.3 回信看交情：至交热络、泛泛敷衍、交恶冷脸；至交书信往来暖情分——
        // 但一日里信来得太勤，对方的回信会自然变短、话里透出「今日信有点多」（人情后果链，不设隐形配额）
        var _rpNpc = orig.fromNpcId && window.npcManager ? window.npcManager.getNPC(orig.fromNpcId) : null;
        var _mailCool = 0; // 0 未冷 / 1 话短了 / 2 只剩一句
        if (_rpNpc && _rpNpc.relationship) {
            var _rpAff = _rpNpc.relationship.affection || 0;
            if (_rpAff >= 60) replyArr = replyBank.high;
            else if (_rpAff >= 20) replyArr = replyBank.mid;
            else if (_rpAff >= -30) replyArr = replyBank.low;
            else replyArr = replyBank.refuse;
            if (_rpAff >= 60 && typeof _rpNpc.changeAffection === 'function' && window.currentCharData) {
                var _mcd = window.currentCharData;
                _mcd._mailAffDay = _mcd._mailAffDay || {};
                var _mDay = (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') ? window.timeSystem.getAbsoluteDay() : 1;
                var _mRec = _mcd._mailAffDay[_rpNpc.id];
                if (!_mRec || _mRec.day !== _mDay) _mRec = _mcd._mailAffDay[_rpNpc.id] = { day: _mDay, n: 0 };
                _mRec.n++;
                if (_mRec.n <= 2) _rpNpc.changeAffection(1);
                else _mailCool = _mRec.n >= 4 ? 2 : 1;
            }
        }
        var text = replyArr[Math.floor(Math.random() * replyArr.length)];
        if (_mailCool === 1) {
            text = text + '\n\n（信纸比往常短了些——墨迹匆匆，像是手头正忙。）';
        } else if (_mailCool === 2) {
            var _curt = ['知道了。', '嗯。', '信收到了。', '好。'];
            text = _curt[Math.floor(Math.random() * _curt.length)] + '\n\n（只有寥寥数字。纸尾一行小字：「今日信来得勤，容我喘口气。」）';
        }
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
        // v23.2 价目表不是装饰：灵镜50/玉简20的资费写了却从没扣过——现在真收；写信也真花时间
        var _car = CARRIERS[carrierId || 'pigeon'] || CARRIERS.pigeon;
        if (_car.cost > 0 && !_car.isConsumable) {
            var _paid = false;
            if (window.XianXia && window.XianXia.DataManager && typeof window.XianXia.DataManager.deductSpiritStones === 'function') {
                _paid = window.XianXia.DataManager.deductSpiritStones(_car.cost);
            } else if (window.inventory && window.inventory.currency && (window.inventory.currency.spiritStones || 0) >= _car.cost) {
                window.inventory.currency.spiritStones -= _car.cost;
                if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI();
                _paid = true;
            }
            if (!_paid) {
                if (window.showMessage) window.showMessage(_car.name + '需资费 ' + _car.cost + ' 灵石——囊中羞涩，换只飞鸽吧。', 'error');
                return null;
            }
        }
        try { if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') window.timeSystem.advanceTime(10, '修书一封'); } catch (e) {}
        var sent = sendMail({
            fromPlayer: true,
            toNpcId: toNpcId,
            fromNpcName: '我',
            subject: subject,
            body: body,
            carrier: carrierId || 'pigeon',
            importance: 'normal'
        });
        // v23.2 写出去的信会有回音：按好感排回信概率与延迟（旧版 playerSendMail 是单向黑洞，写了就石沉大海）
        try {
            var _rpNpc2 = toNpcId && window.npcManager ? window.npcManager.getNPC(toNpcId) : null;
            if (_rpNpc2 && sent) {
                var replyProb = 0.4;
                var aff2 = _rpNpc2.relationship ? (_rpNpc2.relationship.affection || 0) : 0;
                if (_rpNpc2.relationship && _rpNpc2.relationship.flags && _rpNpc2.relationship.flags.has && _rpNpc2.relationship.flags.has('dao_companion')) replyProb = 0.95;
                else if (aff2 > 80) replyProb = 0.85;
                else if (aff2 > 60) replyProb = 0.7;
                else if (aff2 > 40) replyProb = 0.5;
                else if (aff2 > 20) replyProb = 0.3;
                else if (aff2 < -60) replyProb = 0;
                else if (aff2 < -30) replyProb = 0.05;
                if (Math.random() < replyProb) {
                    var _orig2 = { fromNpcId: toNpcId, fromNpcName: toNpcName || _rpNpc2.name, subject: subject, location: _rpNpc2.location || '' };
                    var _delay2 = 120 + Math.floor(Math.random() * 240);
                    if (window.GameScheduler && typeof window.GameScheduler.schedule === 'function') {
                        window.GameScheduler.schedule('mail:auto_reply', window.GameScheduler.nowMinute() + _delay2, { originalMail: _orig2 });
                    } else {
                        sendAutoReplyFromNPC(_orig2);
                    }
                }
            }
        } catch (eReply) {}
        return sent;
    }

    // 暴露给NPCLifeSystem的便捷接口
    // NEW-40①：同一 NPC 的敌意信（urgent）加冷却——世界内口径（游戏日），30 日内至多一封，
    // 日头记在 NPC 档上（_lastHostileMailDay，随 serialize 持久化），不设「每日次数」式人为计数器。
    // NEW-46④：eventType（hostile/help/gift/invite/greet）驱动主题措辞，敌意信不再自称「问候」。
    function sendNPCMail(npc, body, importance, eventType) {
        importance = importance || 'normal';
        if (importance === 'urgent' && npc) {
            var today = currentAbsoluteDay();
            if (npc._lastHostileMailDay != null && today > 0 && (today - Number(npc._lastHostileMailDay)) < 30) return null;
            npc._lastHostileMailDay = today;
        }
        // NPC发信默认用飞鸽
        return sendMail({
            fromNpcId: npc.id,
            fromNpcName: npc.name,
            subject: generateNPCSubject(npc, importance, eventType),
            body: body,
            carrier: 'pigeon',
            location: npc.location || '',
            importance: importance
        });
    }

    // 当前绝对游戏日（跨日折回也照涨，与 time-system.getAbsoluteDay 同口径）
    function currentAbsoluteDay() {
        if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') {
            try { return Number(window.timeSystem.getAbsoluteDay()) || 0; } catch (e) {}
        }
        if (typeof window.getAbsoluteDay === 'function') {
            try { return Number(window.getAbsoluteDay()) || 0; } catch (e) {}
        }
        return 0;
    }

    // 按「事件类型」出题的主题库——同一身份不同来意，信封上就该看得出来
    var NPC_SUBJECT_BANK = {
        hostile: ['问罪书', '绝交书', '来者不善的信', '一笔账要算'],
        help: ['有事相求', '盼搭把手', '求助信'],
        gift: ['一点心意', '小小礼物', '赠礼一封'],
        invite: ['相邀一叙', '结伴之邀', '邀约：同行一段'],
        greet: null   // 问候类沿用「身份+问候」旧措辞
    };

    // 根据NPC身份+事件类型生成主题
    function generateNPCSubject(npc, importance, eventType) {
        var bank = NPC_SUBJECT_BANK[eventType];
        var base;
        if (bank && bank.length) {
            base = bank[Math.floor(Math.random() * bank.length)];
        } else {
            base = (npc.occupation || '') + '的问候';
        }
        if (importance === 'urgent') return '紧急: ' + base;
        if (importance === 'important') return '重要: ' + base;
        return base;
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
                cleanupExpiredMail();   // NEW-40：读档即清一次——已被洪水灌爆的旧档在这里瘦身
                return true;
            }
        } catch (e) {}
        window._mailSystemData = { inbox: [], outbox: [], favorites: [], _pending: [] };
        return false;
    }

    // 清理过期消息（30天普通/90天重要/90天紧急——NEW-40③：紧急件不再终身免死）
    // NEW-40②：收件箱全局封顶 200 封，超出丢最旧（inbox 头新尾旧，截尾即丢最旧）
    var INBOX_CAP = 200;
    function enforceInboxCap() {
        if (!window._mailSystemData || !Array.isArray(window._mailSystemData.inbox)) return;
        if (window._mailSystemData.inbox.length > INBOX_CAP) {
            window._mailSystemData.inbox.length = INBOX_CAP;
        }
    }

    function cleanupExpiredMail() {
        if (!window._mailSystemData) return;
        var currentGameMin = (window.timeSystem && window.timeSystem.gameTime)
            ? window.timeSystem.gameTime.totalMinutes : 0;
        var day = 24 * 60;
        window._mailSystemData.inbox = window._mailSystemData.inbox.filter(function(m) {
            if (!m.receivedAt) return true;
            var age = currentGameMin - m.receivedAt;
            if (m.importance === 'urgent') return age < 90 * day;
            if (m.importance === 'important') return age < 90 * day;
            return age < 30 * day;
        });
        enforceInboxCap();
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
                cleanupExpiredMail();   // NEW-40：读档即清一次（过期+封顶），旧洪水档瘦身
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
