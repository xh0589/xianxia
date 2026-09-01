/**
 * npc-life-system.js - NPC生命周期系统（v12.0 P2-10）
 *
 * 功能：
 * - 三级保护等级（core/important/normal）
 * - 自动判定NPC保护等级
 * - 垂危状态检查（HP<20% 7天）
 * - 寿命到期处理
 * - 真实任务生成（基于NPC职业/需求）
 * - 物品需求系统（NPC真实消耗）
 * - 主动行为真实化（送礼/邀请/敌对）
 * - 死亡/离开记录存档
 *
 * 依赖：npc-system.js
 */
(function() {
    'use strict';

    function nowGameMinute() {
        if (window.GameScheduler && typeof window.GameScheduler.nowMinute === 'function') return window.GameScheduler.nowMinute();
        return (window.timeSystem && window.timeSystem.gameTime) ? (Number(window.timeSystem.gameTime.totalMinutes) || 0) : 0;
    }

    // ============ 保护等级常量 ============
    var PROTECTION = {
        CORE: 'core',          // 永不死亡
        IMPORTANT: 'important', // 需玩家确认
        NORMAL: 'normal'        // 可正常死亡
    };

    // ============ 核心NPC列表（绝对保护） ============
    var CORE_NPC_IDS = [
        'sect_leader_修罗宫'  // 绯泪
        // 张三丰、释玄慈：也在SPECIAL_NPC_DEFINITIONS中，按important自动处理
    ];

    // ============ 保护等级判定 ============
    function getAutoProtectionLevel(npc) {
        if (!npc) return PROTECTION.NORMAL;
        // 1. 核心NPC列表
        if (CORE_NPC_IDS.indexOf(npc.id) >= 0) return PROTECTION.CORE;
        // 2. 固定核心NPC定义
        if (npc._isFixedDefinition) {
            // 已在special-npcs.js中定义的掌门=important
            if (npc.occupation && /掌门|方丈|宫主|宗主|帮主|掌门人/.test(npc.occupation)) return PROTECTION.IMPORTANT;
            // 特殊NPC数据中的10个NPC=important
            return PROTECTION.IMPORTANT;
        }
        // 3. 职位判定
        if (npc.occupation) {
            if (/掌门|方丈|宫主|宗主|帮主|掌门人/.test(npc.occupation)) return PROTECTION.IMPORTANT;
        }
        return PROTECTION.NORMAL;
    }

    // ============ NPC寿命公式 ============
    function getNPCLifespan(npc) {
        var realm = (npc.combat && npc.combat.realm) || '凡人';
        var layer = (npc.combat && npc.combat.layer) || 1;
        var baseMap = {
            '凡人': 80,
            '炼气': 150,
            '筑基': 300,
            '金丹': 500,
            '元婴': 800,
            '化神': 1200,
            '大乘': 2000,
            '渡劫': 3000
        };
        var base = baseMap[realm] || 100;
        return base + layer * 20;
    }

    // ============ NPC年龄推进（每年一次） ============
    function ageNPC(npc) {
        if (!npc) return;
        var currentGameMin = nowGameMinute();
        if (npc._lastAgeUpdate == null || !Number.isFinite(Number(npc._lastAgeUpdate))) {
            npc._lastAgeUpdate = currentGameMin;
            return;
        }
        var last = Number(npc._lastAgeUpdate);
        var yearMinutes = 365 * 24 * 60;
        var elapsedYears = Math.floor((currentGameMin - last) / yearMinutes);
        if (elapsedYears <= 0) return;
        npc._lastAgeUpdate = last + elapsedYears * yearMinutes;
        var lifespan = getNPCLifespan(npc);
        npc.age = (Number(npc.age) || 18) + elapsedYears;
        if (npc.age >= lifespan) {
            var level = npc._protectionLevel || getAutoProtectionLevel(npc);
            if (level === PROTECTION.CORE) {
                if (window.showMessage) window.showMessage('✨ ' + npc.name + '寿元将尽，却被命运护持。', 'info');
                npc.age = Math.max(18, lifespan - 5);
            } else {
                handleNPCDeath(npc, 'lifespan');
            }
        }
    }

    // ============ 垂危状态检查（每6小时调用） ============
    function checkCriticalCondition(npc) {
        if (!npc) return;
        if (npc._protectionLevel === undefined) npc._protectionLevel = getAutoProtectionLevel(npc);
        if (npc._protectionLevel === PROTECTION.CORE) return;
        var phys = npc.physiology;
        if (!phys) return;
        var healthPct = (Number(phys.health) || 0) / Math.max(1, Number(phys.maxHealth) || 100);
        var currentMin = nowGameMinute();
        if (healthPct < 0.20) {
            if (npc._criticalStartedGameMinute == null) {
                npc._criticalStartedGameMinute = currentMin;
                npc._criticalDays = 1;
                triggerCriticalEvent(npc);
            } else {
                npc._criticalDays = Math.floor((currentMin - npc._criticalStartedGameMinute) / 1440) + 1;
            }
            if (npc._criticalDays >= 7) {
                if (npc._protectionLevel === PROTECTION.IMPORTANT) requestPlayerConfirmationForDeath(npc);
                else handleNPCDeath(npc, 'health_critical');
            }
        } else {
            if (npc._criticalStartedGameMinute != null && window.showMessage) window.showMessage('💚 ' + npc.name + '已脱离垂危状态。', 'success');
            npc._criticalDays = 0;
            npc._criticalStartedGameMinute = null;
            npc._isCritical = false;
        }
    }

    function triggerCriticalEvent(npc) {
        if (window.showMessage) {
            window.showMessage('⚠️ ' + npc.name + '生命垂危！位于' + (npc.location || '未知') + '，请前往救治。', 'warning');
        }
        // 标记为垂危
        npc._isCritical = true;
        // 7天冷却后再触发（避免刷屏）
    }

    // ============ 请求玩家确认（important NPC） ============
    function requestPlayerConfirmationForDeath(npc) {
        if (npc._deathConfirmationShown) return;  // 避免重复弹窗
        npc._deathConfirmationShown = true;
        if (typeof window.showMessage === 'function') {
            window.showMessage('⚠️ ' + npc.name + '已垂危7天（重要NPC）。是否允许其离世？', 'warning');
        }
        // 弹出确认对话框
        if (typeof window.showChoiceDialog === 'function') {
            window.showChoiceDialog({
                title: npc.name + ' 垂危',
                text: npc.name + '（重要NPC）已垂危7天。\n请选择：',
                options: [
                    { text: '🛡️ 救治（消耗50%灵石，恢复50%生命）', value: 'heal' },
                    { text: '💀 任其离世', value: 'die' },
                    { text: '⏸️ 暂缓7天', value: 'delay' }
                ],
                onChoose: function(choice) {
                    npc._deathConfirmationShown = false;
                    if (choice === 'heal') {
                        healNPC(npc, 0.5);
                    } else if (choice === 'die') {
                        handleNPCDeath(npc, 'player_choice');
                    } else {
                        npc._criticalDays = 0;
                    }
                }
            });
        } else {
            // 兜底：默认救治
            healNPC(npc, 0.5);
        }
    }

    // ============ 治疗NPC ============
    function healNPC(npc, percent) {
        percent = percent || 0.5;
        var balance = window.EconomyTransaction && window.EconomyTransaction.getBalance
            ? window.EconomyTransaction.getBalance('spiritStones')
            : Number(window.currentCharData && window.currentCharData.spiritStones) || 0;
        var cost = Math.floor(Math.max(0, balance) * 0.5);
        if (window.EconomyTransaction && window.EconomyTransaction.run) {
            var paid = window.EconomyTransaction.run('npc-critical-heal', function(tx) {
                if (cost > 0 && !tx.debit('spiritStones', cost)) throw new Error('灵石不足');
            });
            if (!paid.ok) {
                if (window.showMessage) window.showMessage('救治失败：' + (paid.error && paid.error.message || '灵石不足'), 'error');
                return false;
            }
        } else if (window.currentCharData) {
            window.currentCharData.spiritStones = Math.max(0, balance - cost);
        }
        if (npc.physiology) {
            npc.physiology.health = Math.floor((npc.physiology.maxHealth || 100) * percent);
            if (npc.physiology.bloodVolume !== undefined) npc.physiology.bloodVolume = npc.physiology.health;
        }
        npc._criticalDays = 0;
        npc._criticalStartedGameMinute = null;
        npc._isCritical = false;
        if (window.showMessage) {
            window.showMessage('💚 ' + npc.name + '已恢复至' + Math.floor(percent * 100) + '%生命（消耗' + cost + '灵石）！', 'success');
        }
        return true;
    }

    // ============ NPC死亡处理 ============
    function handleNPCDeath(npc, reason) {
        if (!npc) return;
        if (npc._protectionLevel === PROTECTION.CORE) return;  // 核心免疫

        // v19.3 P0-6：死亡前 → 衣钵继承 + 掌门继任
        try {
            if (window.NpcLineage) {
                if (typeof window.NpcLineage.inheritOnDeath === 'function') {
                    window.NpcLineage.inheritOnDeath(npc.id);
                }
                if (typeof window.NpcLineage.successionOnDeath === 'function' && npc.location) {
                    window.NpcLineage.successionOnDeath(npc.id, npc.location);
                }
            }
        } catch (eInh) { /* 不阻塞死亡 */ }

        // 记录死亡
        recordDeceasedNPC(npc, reason);

        // 从npcManager移除
        if (window.npcManager && typeof window.npcManager.removeNPC === 'function') {
            window.npcManager.removeNPC(npc.id);
        }
        // 从队伍移除
        if (window.partyData && window.partyData.members) {
            window.partyData.members = window.partyData.members.filter(function(m) { return m.id !== npc.id; });
        }
        // 队友悲痛
        if (window.partyData && window.partyData.members) {
            window.partyData.members.forEach(function(m) {
                var n = window.npcManager && window.npcManager.getNPC(m.id);
                if (n && typeof n.changeAffection === 'function') {
                    n.changeAffection(-15);
                }
            });
        }
        // 通知玩家
        if (window.showMessage) {
            var reasonText = { lifespan: '寿命', health_critical: '重伤', killed: '击杀', player_action: '你的决定', player_choice: '你的选择' };
            window.showMessage('💀 ' + npc.name + '已' + (reasonText[reason] || '') + '离世。', 'error');
        }
    }

    // ============ NPC离队（决裂/玩家选择） ============
    function handleNPCLeave(npc, reason) {
        if (!npc) return;
        var now = nowGameMinute();
        npc._isGone = true;
        npc._leaveReason = reason;
        npc._leaveGameMinute = now;
        npc._returnDueGameMinute = now + 7 * 1440;
        npc._isAvailable = false;
        recordGoneNPC(npc, reason);
        if (window.npcManager && typeof window.npcManager.removeNPC === 'function') window.npcManager.removeNPC(npc.id);
        if (window.partyData && window.partyData.members) window.partyData.members = window.partyData.members.filter(function(m) { return m.id !== npc.id; });
        if (window.showMessage) window.showMessage('🚪 ' + npc.name + '离开了，至少七个游戏日后才可能再出现。', 'info');
        if (window.GameScheduler) {
            window.GameScheduler.schedule('npc_life:return', npc._returnDueGameMinute, { npcId: npc.id }, { id: 'npc_return_' + npc.id });
        }
    }

    // ============ 死亡NPC记录 ============
    function recordDeceasedNPC(npc, reason) {
        if (!window._npcRecords) window._npcRecords = { deceased: [], gone: [], protectionLevels: {} };
        var record = typeof npc.serialize === 'function' ? npc.serialize() : { id: npc.id, name: npc.name };
        record._deathReason = reason;
        record._deathGameMinute = nowGameMinute();
        record._finalLocation = npc.location;
        window._npcRecords.deceased.push(record);
        if (npc.id) {
            window._npcRecords.protectionLevels[npc.id] = npc._protectionLevel;
        }
    }

    function recordGoneNPC(npc, reason) {
        if (!window._npcRecords) window._npcRecords = { deceased: [], gone: [], protectionLevels: {} };
        var record = typeof npc.serialize === 'function' ? npc.serialize() : { id: npc.id, name: npc.name };
        record._leaveReason = reason;
        record._leaveGameMinute = nowGameMinute();
        window._npcRecords.gone.push(record);
    }

    // ============ 玩家主动击杀（带二次确认） ============
    function handlePlayerKillNPC(npc) {
        if (!npc) return false;
        if (npc._protectionLevel === undefined) {
            npc._protectionLevel = getAutoProtectionLevel(npc);
        }
        if (npc._protectionLevel === PROTECTION.CORE) {
            if (window.showMessage) {
                window.showMessage('此人命中注定不会死于你手。', 'warning');
            }
            return false;
        }
        if (npc._protectionLevel === PROTECTION.IMPORTANT) {
            if (!confirm('警告：' + npc.name + '是重要人物。\n你确定要杀死TA吗？\n(此操作不可撤销)')) {
                return false;
            }
        }
        handleNPCDeath(npc, 'player_action');
        return true;
    }

    // ============ 真实任务生成（方向A） ============
    // 根据NPC职业和需求生成真实可接取任务
    function generatePersonalQuest(npc) {
        if (!npc || npc.relationship.affection < 60) return null;
        // 已有未接任务不重复生成
        if (npc._personalQuests && npc._personalQuests.filter(function(q) { return q.status === 'available'; }).length > 0) return null;
        // 每7天最多1个
        var currentMin = (window.timeSystem && window.timeSystem.gameTime) ? window.timeSystem.gameTime.totalMinutes : 0;
        if (npc._lastQuestTime && (currentMin - npc._lastQuestTime) < 7 * 24 * 60) return null;
        // 按职业生成任务
        var questTemplates = getQuestTemplatesByOccupation(npc.occupation);
        if (!questTemplates || questTemplates.length === 0) return null;
        var template = questTemplates[Math.floor(Math.random() * questTemplates.length)];
        var quest = {
            id: 'pq_' + npc.id + '_' + nowGameMinute() + '_' + Math.floor(Math.random() * 100000),
            title: template.title.replace('{name}', npc.name),
            desc: template.desc.replace('{name}', npc.name),
            type: template.type,
            objective: template.objective,
            reward: template.reward,
            expiresGameMinute: currentMin + 7 * 24 * 60,
            status: 'available',
            createdAt: currentMin,
            npcId: npc.id
        };
        npc._personalQuests = npc._personalQuests || [];
        npc._personalQuests.push(quest);
        npc._lastQuestTime = currentMin;
        if (window.showMessage) {
            window.showMessage('💼 ' + npc.name + '有事相求：' + quest.title, 'info');
        }
        return quest;
    }

    function getQuestTemplatesByOccupation(occupation) {
        var t = occupation || '';
        if (/导师|长老|教师|先生/.test(t)) return [
            { title: '向{name}请教功法', desc: '请{name}指导你的修炼', type: 'teach', objective: { action: 'study', count: 1 }, reward: { tempering: 50, affection: 5 } },
            { title: '为{name}采药', desc: '帮忙寻找修炼所需药材', type: 'gather', objective: { itemId: 'mat_lingzhi', count: 3 }, reward: { spiritStones: 80, affection: 8 } }
        ];
        if (/医生|医|药师/.test(t)) return [
            { title: '为{name}寻药', desc: '{name}需要某些珍贵药材', type: 'gather', objective: { itemId: 'mat_ginseng', count: 5 }, reward: { spiritStones: 100, affection: 10 } },
            { title: '护送{name}出诊', desc: '陪{name}去远地出诊', type: 'escort', objective: { location: '青木城', count: 1 }, reward: { spiritStones: 60, affection: 8 } }
        ];
        if (/商|店|掌柜/.test(t)) return [
            { title: '为{name}送货', desc: '护送货物到指定地点', type: 'deliver', objective: { itemId: 'mat_fabric', count: 1 }, reward: { spiritStones: 120, affection: 6 } },
            { title: '调查{name}的竞争对手', desc: '打听商业情报', type: 'investigate', objective: { info: 'competitor', count: 1 }, reward: { spiritStones: 80, affection: 5 } }
        ];
        if (/战士|武|护法|镖/.test(t)) return [
            { title: '为{name}清剿妖兽', desc: '领地附近有妖兽出没', type: 'defeat', objective: { enemyType: 'beast', count: 3 }, reward: { spiritStones: 150, affection: 8 } },
            { title: '与{name}切磋武艺', desc: '进行一场友好切磋', type: 'duel', objective: { rounds: 5, count: 1 }, reward: { experience: 30, affection: 5 } }
        ];
        // 默认任务
        return [
            { title: '帮助{name}处理琐事', desc: '{name}需要人手帮忙', type: 'general', objective: { action: 'help', count: 1 }, reward: { spiritStones: 30, affection: 3 } }
        ];
    }

    // ============ 物品需求系统（方向B） ============
    // NPC真实消耗inventory，玩家可供给
    function checkItemNeed(npc) {
        if (!npc || npc.relationship.affection < 50) return;
        if (!npc._consumptionSchedule) {
            npc._consumptionSchedule = buildConsumptionSchedule(npc);
        }
        if (!npc._consumptionSchedule || npc._consumptionSchedule.length === 0) return;
        var currentMin = nowGameMinute();
        if (npc._lastNeedCheck == null) { npc._lastNeedCheck = currentMin; return; }
        var elapsedDays = Math.floor((currentMin - npc._lastNeedCheck) / 1440);
        if (elapsedDays < 7) return;
        npc._lastNeedCheck += elapsedDays * 1440;
        // 实际消耗按经过的游戏天数结算，避免“每周检查却只扣一天量”
        npc._consumptionSchedule.forEach(function(need) {
            var item = (npc.inventory && npc.inventory.items || []).find(function(i) { return i && i.templateId === need.itemId; });
            var consumeCount = Math.max(1, Math.round((Number(need.perDay) || 0) * elapsedDays));
            if (item) {
                item.count = Math.max(0, (item.count || 0) - consumeCount);
                if (item.count <= 0) {
                    npc.inventory.items = npc.inventory.items.filter(function(i) { return i !== item; });
                }
            } else {
                // 不足时向玩家请求
                if (Math.random() < 0.3) {
                    triggerItemNeedEvent(npc, need.itemId, need.name || need.itemId);
                }
            }
        });
    }

    function buildConsumptionSchedule(npc) {
        var t = npc.occupation || '';
        if (/医生|医|药师/.test(t)) {
            return [{ itemId: 'mat_lingzhi', perDay: 0.5, name: '灵草' }, { itemId: 'pill_recovery', perDay: 0.2, name: '回血丹' }];
        }
        if (/战士|武|护法/.test(t)) {
            return [{ itemId: 'mat_iron_ore', perDay: 0.3, name: '铁矿' }];
        }
        if (/商|店|掌柜/.test(t)) {
            return [{ itemId: 'mat_fabric', perDay: 0.5, name: '布料' }];
        }
        return [];
    }

    function triggerItemNeedEvent(npc, itemId, itemName) {
        var now = nowGameMinute();
        if (npc._lastNeedRequestGameMinute != null && (now - npc._lastNeedRequestGameMinute) < 7 * 1440) return;
        npc._lastNeedRequestGameMinute = now;
        if (window.showMessage) {
            window.showMessage('📦 ' + npc.name + '：我需要一些' + itemName + '，能帮帮我吗？', 'info');
        }
    }

    // ============ 主动行为真实化（方向D） ============
    function executeActiveBehavior(npc) {
        if (!npc) return;
        var aff = npc.relationship?.affection || 0;
        if (aff > 60 && Math.random() < 0.1) {
            var behaviors = ['send_message', 'give_gift', 'invite'];
            var chosen = behaviors[Math.floor(Math.random() * behaviors.length)];
            switch (chosen) {
                case 'send_message':
                    // P2-10 增强：通过飞鸽传书系统发送
                    if (window.MailSystem && window.MailSystem.sendNPCMail) {
                        window.MailSystem.sendNPCMail(npc, '最近可好？有空来坐坐。', 'normal');
                    } else if (window.showMessage) {
                        window.showMessage('📩 ' + npc.name + '给你传音：「最近可好？有空来坐坐。」', 'info');
                    }
                    npc.recordPlayerAction('active_contact', 'positive');
                    npc.changeAffection(1);
                    break;
                case 'give_gift':
                    if (npc.inventory && npc.inventory.items && npc.inventory.items.length > 0) {
                        var giveItem = npc.inventory.items[0];
                        if (giveItem.count > 0) {
                            giveItem.count -= 1;
                            if (giveItem.count <= 0) {
                                npc.inventory.items = npc.inventory.items.filter(function(i) { return i !== giveItem; });
                            }
                            if (typeof window.addItem === 'function') {
                                window.addItem(giveItem.templateId, 1);
                            }
                            // P2-10：发送礼物邮件
                            if (window.MailSystem && window.MailSystem.send) {
                                window.MailSystem.send({
                                    carrier: 'pigeon',
                                    fromNpcId: npc.id,
                                    fromNpcName: npc.name,
                                    subject: '小小礼物，请笑纳',
                                    body: '没什么大用，希望你喜欢。\n\n—— ' + npc.name,
                                    location: npc.location || '',
                                    importance: 'normal',
                                    attachments: [{ name: giveItem.name || giveItem.templateId, count: 1, itemId: giveItem.templateId }]
                                });
                            } else if (window.showMessage) {
                                window.showMessage('🎁 ' + npc.name + '送给你' + (giveItem.name || giveItem.templateId), 'success');
                            }
                        }
                    }
                    npc.recordPlayerAction('active_gift', 'positive');
                    break;
                case 'invite':
                    // P2-10：发送邀请邮件
                    if (window.MailSystem && window.MailSystem.sendNPCMail) {
                        window.MailSystem.sendNPCMail(npc, '邀请你一同探索秘境，有空请回复。', 'important');
                    } else if (window.showMessage) {
                        window.showMessage('📩 ' + npc.name + '邀请你一同探索秘境。', 'info');
                    }
                    npc.recordPlayerAction('active_invite', 'positive');
                    break;
            }
            return;
        }
        if (aff < -30 && Math.random() < 0.08) {
            // P2-10：敌意也走邮件
            if (window.MailSystem && window.MailSystem.sendNPCMail) {
                window.MailSystem.sendNPCMail(npc, '听说你在外面说我的坏话，记住。', 'urgent');
            } else if (window.showMessage) {
                window.showMessage('💢 你听说' + npc.name + '在背后说了你的坏话。', 'warning');
            }
            npc.recordPlayerAction('active_hostile', 'negative');
            npc.changeHatred(5);
        }
    }

    // ============ 全部NPC定时检查入口 ============
    function checkAllNPCLifeSystems(allNPCs) {
        if (!allNPCs || !Array.isArray(allNPCs)) return;
        allNPCs.forEach(function(npc) {
            if (!npc || npc._isGone) return;
            if (npc._protectionLevel === undefined) {
                npc._protectionLevel = getAutoProtectionLevel(npc);
            }
            ageNPC(npc);
            checkCriticalCondition(npc);
            checkItemNeed(npc);
            // 每6个游戏小时执行一次主动行为，与现实时间/页面开关无关
            var now = nowGameMinute();
            if (npc._lastActiveBehaviorGameMinute == null || (now - npc._lastActiveBehaviorGameMinute) >= 6 * 60) {
                npc._lastActiveBehaviorGameMinute = now;
                executeActiveBehavior(npc);
            }
        });
    }

    // ============ 游戏时间回归 / 生命周期记录存档 ============
    function restoreGoneNPC(npcId) {
        if (!window._npcRecords || !Array.isArray(window._npcRecords.gone)) return true;
        for (var i = window._npcRecords.gone.length - 1; i >= 0; i--) {
            var record = window._npcRecords.gone[i];
            if (!record || record.id !== npcId || record._returnedGameMinute) continue;
            if ((Number(record.returnDueGameMinute) || Number(record._returnDueGameMinute) || 0) > nowGameMinute()) return false;
            if (window.npcManager && window.npcManager.getNPC && window.npcManager.getNPC(npcId)) {
                record._returnedGameMinute = nowGameMinute();
                return true;
            }
            if (window.NPC && typeof window.NPC.deserialize === 'function' && window.npcManager) {
                var restored = window.NPC.deserialize(record);
                restored._isGone = false;
                restored._isAvailable = true;
                restored._leaveReason = null;
                restored._returnDueGameMinute = 0;
                window.npcManager.addNPC(restored);
                record._returnedGameMinute = nowGameMinute();
                if (window.showMessage) window.showMessage('🕊️ ' + restored.name + '结束远行，重新出现在世间。', 'info');
                return true;
            }
            return false;
        }
        return true;
    }

    function ensureRecords() {
        if (!window._npcRecords) window._npcRecords = { deceased: [], gone: [], protectionLevels: {} };
        window._npcRecords.deceased = Array.isArray(window._npcRecords.deceased) ? window._npcRecords.deceased : [];
        window._npcRecords.gone = Array.isArray(window._npcRecords.gone) ? window._npcRecords.gone : [];
        window._npcRecords.protectionLevels = window._npcRecords.protectionLevels || {};
        return window._npcRecords;
    }

    if (window.GameScheduler) {
        window.GameScheduler.registerHandler('npc_life:return', function(payload) { return restoreGoneNPC(payload && payload.npcId); });
    }
    if (window.StateRegistry) {
        window.StateRegistry.register('npcLifeRecords', {
            version: 2,
            export: function() { return JSON.parse(JSON.stringify(ensureRecords())); },
            import: function(data) {
                window._npcRecords = data && typeof data === 'object' ? JSON.parse(JSON.stringify(data)) : { deceased: [], gone: [], protectionLevels: {} };
                ensureRecords().gone.forEach(function(rec) {
                    if (rec && !rec._returnedGameMinute && window.GameScheduler) {
                        var due = Number(rec.returnDueGameMinute) || Number(rec._returnDueGameMinute) || (Number(rec._leaveGameMinute) || nowGameMinute()) + 7 * 1440;
                        window.GameScheduler.schedule('npc_life:return', due, { npcId: rec.id }, { id: 'npc_return_' + rec.id });
                    }
                });
            },
            reset: function() { window._npcRecords = { deceased: [], gone: [], protectionLevels: {} }; }
        });
    }

    // ============ 暴露到全局 ============
    if (typeof window !== 'undefined') {
        window.NPCLifeSystem = {
            PROTECTION: PROTECTION,
            getAutoProtectionLevel: getAutoProtectionLevel,
            getNPCLifespan: getNPCLifespan,
            ageNPC: ageNPC,
            checkCriticalCondition: checkCriticalCondition,
            healNPC: healNPC,
            handleNPCDeath: handleNPCDeath,
            handleNPCLeave: handleNPCLeave,
            handlePlayerKillNPC: handlePlayerKillNPC,
            generatePersonalQuest: generatePersonalQuest,
            getQuestTemplatesByOccupation: getQuestTemplatesByOccupation,
            checkItemNeed: checkItemNeed,
            triggerItemNeedEvent: triggerItemNeedEvent,
            executeActiveBehavior: executeActiveBehavior,
            checkAllNPCLifeSystems: checkAllNPCLifeSystems
        };
    }
})();
