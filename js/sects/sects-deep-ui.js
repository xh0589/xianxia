// ==================== sects-deep-ui.js - 通用门派深度UI（v10.0） ====================
// 数据驱动，自动适配所有在 SECT_DEEP_DATA 中注册的门派
// 提供：拜师/职务/任务/派系/事件等通用面板
// 加载顺序：在 sects-deep-data.js 之后

// ============ 获取门派深度数据 ============
function getSectDeepData(sectName) {
    return window.SECT_DEEP_DATA?.[sectName] || null;
}

function hasSectDeepData(sectName) {
    return !!getSectDeepData(sectName);
}

// ============ 拜师面板 ============
function showSectMasters(sectName) {
    var data = getSectDeepData(sectName);
    if (!data || !data.masters) {
        if (window.showMessage) window.showMessage(sectName + '暂无深度拜师系统', 'info');
        return;
    }
    var ds = window.discipleState || {};
    var player = window.currentCharData || {};
    var playerContribution = ds.contribution || 0;
    var hasMaster = ds._masterId;
    
    var html = '<div class="space-y-3">';
    html += '<h3 class="text-lg font-bold text-yellow-400">📖 ' + sectName + '·拜师</h3>';
    html += '<p class="text-sm text-gray-400">选择一位师父，向他学习门派绝学。</p>';
    
    data.masters.forEach(function(m) {
        var req = m.requirement || {};
        var canLearn = false;
        var reqText = '';
        
        if (m.acceptStudent) {
            // 检查条件
            var meetRealm = true;
            if (req.realm) {
                meetRealm = (typeof window.getRealmTier === 'function') 
                    ? window.getRealmTier(player.realm) >= window.getRealmTier(req.realm) && (player.layer || 1) >= (req.layer || 1)
                    : true;
            }
            var meetContribution = playerContribution >= (req.contribution || 0);
            var meetMedicine = !req.medicine || (player.lifeSkills && player.lifeSkills['医术'] >= req.medicine);
            var meetForging = !req.forging || (player.lifeSkills && player.lifeSkills['锻造'] >= req.forging);
            var meetConstitution = !req.constitution || (player.attrs?.constitution || 0) >= req.constitution;
            var meetTalent = !req.talent || true; // 天赋暂不检查
            var meetWaterRoot = !req.waterRoot || true; // 水灵根暂不检查
            canLearn = meetRealm && meetContribution && meetMedicine && meetForging && meetConstitution;
            
            var reqParts = [];
            if (req.realm) reqParts.push(req.realm + (req.layer || 1) + '层');
            if (req.contribution) reqParts.push('贡献' + req.contribution);
            if (req.medicine) reqParts.push('医术' + req.medicine);
            if (req.forging) reqParts.push('锻造' + req.forging);
            if (req.constitution) reqParts.push('体质' + req.constitution);
            reqText = '需要：' + reqParts.join('、');
        }
        
        var genderIcon = m.isFemale ? '♀' : '♂';
        var acceptText = m.acceptStudent ? '收徒' : '不收徒';
        var studentCount = m.maxStudents ? '（最多' + m.maxStudents + '名弟子）' : '';
        
        html += '<div class="bg-gray-800 rounded-lg p-3 border ' + (hasMaster ? 'border-gray-600 opacity-70' : 'border-gray-600') + '">';
        html += '<div class="flex justify-between items-start">';
        html += '<div>';
        html += '<p class="font-bold text-white">' + m.name + ' <span class="text-xs text-gray-400">' + m.title + '</span> <span class="text-xs text-gray-500">' + genderIcon + '</span></p>';
        html += '<p class="text-xs text-gray-400">' + m.desc + '</p>';
        html += '<p class="text-xs text-yellow-400 mt-1">' + m.realm + '·' + m.layer + '层 | ' + m.personality + '</p>';
        html += '<p class="text-xs text-gray-500">武学：' + (m.skills || []).join('、') + '</p>';
        if (!m.acceptStudent) {
            html += '<p class="text-xs text-purple-400 mt-1">👑 掌门·暂不收徒</p>';
        } else if (!canLearn) {
            html += '<p class="text-xs text-red-400 mt-1">' + reqText + '</p>';
        }
        html += '</div>';
        if (hasMaster) {
            html += '<span class="text-xs text-gray-500">已拜师</span>';
        } else if (m.acceptStudent && canLearn) {
            html += '<button onclick="sectBecomeStudent(\'' + sectName + '\', \'' + m.id + '\')" class="bg-yellow-600 hover:bg-yellow-500 text-gray-900 px-3 py-1 rounded text-xs font-bold">拜师</button>';
        } else if (m.acceptStudent) {
            html += '<span class="text-xs text-gray-500">条件不足</span>';
        } else {
            html += '<span class="text-xs text-purple-400">不收徒</span>';
        }
        html += '</div></div>';
    });
    
    // 当前师父
    if (hasMaster) {
        var master = data.masters.find(function(m) { return m.id === ds._masterId; });
        if (master) {
            html += '<div class="mt-4 bg-gray-800 rounded-lg p-3 border border-green-600">';
            html += '<p class="text-sm text-green-400">当前师父：' + master.name + '（' + master.title + '）</p>';
            html += '<p class="text-xs text-gray-400">' + master.desc + '</p>';
            html += '<div class="flex gap-1 mt-2 flex-wrap">';
            html += '<button onclick="askMasterGuidance(\'' + sectName + '\')" class="bg-cyan-700 hover:bg-cyan-600 text-white px-3 py-1 rounded text-xs" title="耗半个时辰——今日下一次藏经阁参悟感悟翻倍">🧭 请益（半时辰）</button>';
            html += '<button onclick="chushiFromMaster(\'' + sectName + '\')" class="bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded text-xs" title="条件：参透本派任意一门功法至大成">🎓 出师</button>';
            html += '<button onclick="sectLeaveMaster(\'' + sectName + '\')" class="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-xs">离开师门</button>';
            html += '</div></div>';
        }
    }
    html += '</div>';
    
    if (typeof window.showModal === 'function') {
        window.showModal(sectName + '·拜师', html);
    }
}

function sectBecomeStudent(sectName, masterId) {
    var ds = window.discipleState || {};
    if (ds._masterId) {
        if (window.showMessage) window.showMessage('你已有师父，不能同时拜多人为师', 'warning');
        return;
    }
    var data = getSectDeepData(sectName);
    if (!data) return;
    var master = data.masters.find(function(m) { return m.id === masterId; });
    if (!master) return;
    // v16.0：离师之人，师父不再收徒——世界记得
    if (ds._leftMasters && ds._leftMasters[masterId]) {
        if (window.showMessage) window.showMessage(master.name + '淡淡看你一眼："当年你执意离去，如今何必再来。"此人不会再收你为徒了。', 'error');
        return;
    }
    
    ds._masterId = masterId;
    ds._masterName = master.name;
    ds._masterSect = sectName;
    
    if (window.showMessage) window.showMessage('你正式拜入' + master.name + '门下！', 'success');
    // v15.4 裁决：拜师不送功法——功法须经本派藏经阁参悟获得
    showSectMasters(sectName);
}

function sectLeaveMaster(sectName) {
    var ds = window.discipleState || {};
    if (!ds._masterId) return;
    if (!confirm('确定要离开师门？师父会记得这件事的。')) return;
    var leftName = ds._masterName || '师父';
    var leftId = ds._masterId;
    // v16.0：离师入册——此人此后不再收你（世界记忆，非计数器）
    ds._leftMasters = ds._leftMasters || {};
    ds._leftMasters[leftId] = true;
    delete ds._masterId;
    delete ds._masterName;
    delete ds._masterSect;
    delete ds._masterBlessDay;
    if (window.showMessage) window.showMessage('你离开了' + leftName + '门下。他淡淡点头，眼里的失望却藏不住——此人不会再收你为徒。', 'info');
    showSectMasters(sectName);
}

// ============ v16.0 师徒收口：请益 / 出师 ============
// 请益：耗半个时辰，师父指点后「当日下一次参悟」感悟翻倍（在 sectLibStudy 中消费）
function askMasterGuidance(sectName) {
    var ds = window.discipleState || {};
    if (!ds._masterId) { if (window.showMessage) window.showMessage('你尚未拜师', 'warning'); return; }
    var today = (typeof window.getAbsoluteDay === 'function') ? window.getAbsoluteDay()
        : ((window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') ? window.timeSystem.getAbsoluteDay() : 0);
    if (ds._masterBlessDay === today) { if (window.showMessage) window.showMessage('师父今日已指点过你了——贪多嚼不烂。', 'warning'); return; }
    try { if (window.timeSystem && window.timeSystem.advanceTime) window.timeSystem.advanceTime(30, '师父指点'); } catch (e) {}
    ds._masterBlessDay = today;
    if (window.showMessage) window.showMessage('「' + (ds._masterName || '师父') + '」为你拆解了一路武学的关窍——今日再入藏经阁参悟，必事半功倍。', 'success');
    showSectMasters(sectName);
}

// 出师：条件=参透本派任意一门功法至大成；奖励=贡献200+声望10；出师非叛师，好聚好散
function chushiFromMaster(sectName) {
    var ds = window.discipleState || {};
    if (!ds._masterId) { if (window.showMessage) window.showMessage('你尚未拜师', 'warning'); return; }
    var arts = (window.SECT_SPECIFIC_ARTS && window.SECT_SPECIFIC_ARTS[sectName]) || [];
    var mastered = arts.filter(function(a) { var r = ds.artInsights && ds.artInsights[a.id]; return r && r.m >= 100; });
    if (!mastered.length) {
        if (window.showMessage) window.showMessage('出师须先参透本派任意一门功法至大成（藏经阁掌握100%）——学艺不精，师父不会放人。', 'warning');
        return;
    }
    var data = getSectDeepData(sectName);
    var master = data ? data.masters.find(function(m) { return m.id === ds._masterId; }) : null;
    var masterName = (master && master.name) || ds._masterName || '师父';
    if (!confirm('学艺已成，就此出师？\n\n师父将赠行礼（贡献+200、声望+10），此后你仍是' + sectName + '弟子，只是不再受其亲传。')) return;
    var reward = 200;
    ds.contribution = (ds.contribution || 0) + reward;
    if (typeof window.addFame === 'function') window.addFame(10);
    delete ds._masterId; delete ds._masterName; delete ds._masterSect; delete ds._masterBlessDay;
    ds._chushiDone = true;
    if (window.showMessage) window.showMessage('🎓 出师！' + masterName + '抚须而笑，赠下盘缠：贡献+' + reward + '、声望+10。江湖之上，从此多了一位' + sectName + '的传艺人。', 'success');
    showSectMasters(sectName);
}

// ============ v16.3 门派每日事件引擎（D2 泛化）：武当死链退役后统一入口 ============
function sectEventToday() {
    return (typeof window.getAbsoluteDay === 'function') ? window.getAbsoluteDay()
        : ((window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') ? window.timeSystem.getAbsoluteDay() : 1);
}
function applySectEventEffects(eff, sectName) {
    var msgs = [];
    var ds = window.discipleState || {};
    if (!eff) return msgs;
    if (eff.contribution) { ds.contribution = Math.max(0, (ds.contribution || 0) + eff.contribution); msgs.push('贡献' + (eff.contribution > 0 ? '+' : '') + eff.contribution); }
    if (eff.points) { ds.points = Math.max(0, (ds.points || 0) + eff.points); msgs.push('积分' + (eff.points > 0 ? '+' : '') + eff.points); }
    if (eff.fame && typeof window.addFame === 'function') { window.addFame(eff.fame); msgs.push('声望' + (eff.fame > 0 ? '+' : '') + eff.fame); }
    if (eff.item && eff.item.id && typeof window.addItem === 'function') {
        if (window.addItem(eff.item.id, eff.item.count || 1)) {
            var nm = (window.itemById && window.itemById[eff.item.id] && window.itemById[eff.item.id].name) || eff.item.id;
            msgs.push('获得 ' + nm + 'x' + (eff.item.count || 1));
        }
    }
    if (eff.buff && typeof window.applyBuff === 'function') {
        window.applyBuff(eff.buff.id || ('fxb_evt_' + Math.random()), eff.buff.effects || {}, eff.buff.hours || 8);
        var bt = Object.keys(eff.buff.effects || {}).map(function (k) { return k + '+' + eff.buff.effects[k]; }).join(' ');
        msgs.push((eff.buff.name || '气息萦绕') + '（' + bt + '，持续' + (eff.buff.hours || 8) + '小时）');
    }
    if (eff.repSelf && typeof window.changeFactionReputation === 'function') {
        window.changeFactionReputation(sectName, eff.repSelf);
        msgs.push('本派声望' + (eff.repSelf > 0 ? '+' : '') + eff.repSelf);
    }
    return msgs;
}
function renderSectEventCard(sectName, ev) {
    var html = '<p class="text-gray-300 mb-3">' + (ev.text || '') + '</p><div class="space-y-2">';
    (ev.choices || []).forEach(function (c, idx) {
        html += '<button onclick="chooseSectEvent(\'' + sectName + '\', \'' + ev.id + '\', ' + idx + ')" class="w-full text-left bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm">' + c.label + '</button>';
    });
    html += '</div>';
    if (typeof window.showModal === 'function') window.showModal((ev.icon || '❔') + ' 门派事件 · ' + (ev.name || ''), html);
}
window.maybeSectDailyEvent = function () {
    var ds = window.discipleState || {};
    if (!ds.isInSect || !ds.sectId) return;
    if (typeof window.showModal !== 'function') return;
    var pool = (window.SECT_EVENTS || {})[ds.sectId];
    if (!pool || !pool.length) return;
    var today = sectEventToday();
    if (ds._sectEventDay === today) {
        // 当日已 roll：若还有未抉择的挂起事件则重弹
        if (ds._pendingSectEvent && ds._pendingSectEvent.day === today) {
            var pev = ((window.SECT_EVENTS || {})[ds._pendingSectEvent.sect] || []).find(function (e) { return e.id === ds._pendingSectEvent.eventId; });
            if (pev) renderSectEventCard(ds._pendingSectEvent.sect, pev);
        }
        return;
    }
    ds._sectEventDay = today; // 今日已 roll——未命中即安静日
    if (Math.random() >= 0.5) return;
    var rank = ds.rank == null ? 7 : ds.rank;
    var candidates = pool.filter(function (e) { return !e.minRank || rank <= e.minRank; });
    if (!candidates.length) return;
    var ev = candidates[Math.floor(Math.random() * candidates.length)];
    ds._pendingSectEvent = { day: today, sect: ds.sectId, eventId: ev.id };
    renderSectEventCard(ds.sectId, ev);
};
window.chooseSectEvent = function (sectName, eventId, idx) {
    var pool = (window.SECT_EVENTS || {})[sectName] || [];
    var ev = pool.find(function (e) { return e.id === eventId; });
    if (!ev) return;
    var c = ev.choices[idx];
    if (!c) return;
    var msgs = applySectEventEffects(c.effects, sectName);
    var ds = window.discipleState || {};
    ds._pendingSectEvent = null;
    var reply = c.reply || '……';
    if (msgs.length) reply += '（' + msgs.join('，') + '）';
    if (window.showMessage) window.showMessage(reply, 'info');
};

// ============ 职务晋升面板（v10.1 重做：仅贡献晋升，特殊门派/身份隐藏） ============
function showSectRanks(sectName) {
    var ds = window.discipleState || {};
    var currentRank = ds.rank;

    // 特殊门派（大隐阁/天书阁/逍遥派）→ 同参弟子，无晋升体系
    if (sectName === '大隐阁' || sectName === '天书阁' || sectName === '逍遥派') {
        if (typeof window.showModal === 'function') {
            window.showModal(sectName + '·职务体系', '<div class="text-center py-6"><p class="text-gray-400 text-lg mb-2">🏛️ ' + sectName + '</p><p class="text-gray-500">此门派无晋升体系</p><p class="text-xs text-gray-600 mt-2">同参弟子，来去自如</p></div>');
        } else if (window.showMessage) {
            window.showMessage('此门派无晋升体系', 'info');
        }
        return;
    }

    // 侍妾（ID=-1）或同参弟子（ID=-2）无晋升
    if (currentRank === -1 || currentRank === -2) {
        if (typeof window.showModal === 'function') {
            var title = currentRank === -1 ? '侍妾' : '同参弟子';
            window.showModal(sectName + '·职务体系', '<div class="text-center py-6"><p class="text-gray-400 text-lg mb-2">💕 ' + title + '</p><p class="text-gray-500">特殊身份，无需晋升</p></div>');
        } else if (window.showMessage) {
            window.showMessage('特殊身份无需晋升', 'info');
        }
        return;
    }

    var ranks = window.COMMON_RANKS;
    if (!ranks) return;
    var contribution = ds.contribution || 0;
    
    var html = '<div class="space-y-3">';
    html += '<h3 class="text-lg font-bold text-yellow-400">🏛️ ' + sectName + '·职务体系</h3>';
    html += '<p class="text-sm text-gray-400">当前职位：<span class="text-yellow-300 font-bold">' + (ranks.find(function(r) { return r.id === currentRank; })?.name || '杂役弟子') + '</span></p>';
    html += '<p class="text-sm text-gray-400">贡献：<span class="text-yellow-300">' + contribution + '</span></p>';
    html += '<hr class="border-gray-600">';
    
    ranks.forEach(function(r) {
        var isCurrent = r.id === currentRank;
        var isLocked = r.id < currentRank;
        var canPromote = false;
        var promoteReq = '';
        
        if (!isCurrent && !isLocked && r.promoteCondition) {
            var cond = r.promoteCondition;
            // 仅检查贡献（按新方案：仅贡献晋升）
            var meetContribution = contribution >= (cond.contribution || 999999);
            canPromote = meetContribution;
            promoteReq = '需要贡献' + (cond.contribution || 0);
        }
        
        var bgColor = isCurrent ? 'bg-yellow-800 border-yellow-500' : (isLocked ? 'bg-gray-800 border-gray-600 opacity-50' : 'bg-gray-800 border-gray-600');
        html += '<div class="' + bgColor + ' rounded-lg p-3 border">';
        html += '<div class="flex justify-between items-start">';
        html += '<div>';
        html += '<p class="font-bold text-white">' + r.name + '</p>';
        html += '<p class="text-xs text-gray-400">' + r.desc + '</p>';
        html += '<p class="text-xs text-gray-500 mt-1">特权：' + r.privileges.join('、') + '</p>';
        html += '<p class="text-xs text-gray-500">俸禄：' + r.salary.copper + '铜钱 ' + r.salary.spiritStones + '灵石/日</p>';
        if (r.id < currentRank && !isCurrent) {
            html += '<p class="text-xs text-red-400 mt-1">' + promoteReq + '</p>';
        }
        html += '</div>';
        if (isCurrent) {
            html += '<span class="text-xs text-yellow-400">当前</span>';
        } else if (canPromote && r.id < currentRank) {
            html += '<button onclick="sectPromote(\'' + sectName + '\', ' + r.id + ')" class="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-xs">晋升</button>';
        } else if (r.id < currentRank) {
            html += '<span class="text-xs text-gray-500">条件不足</span>';
        } else {
            html += '<span class="text-xs text-gray-500">已晋升</span>';
        }
        html += '</div></div>';
    });
    html += '</div>';
    
    if (typeof window.showModal === 'function') {
        window.showModal(sectName + '·职务晋升', html);
    }
}

function sectPromote(sectName, targetRank) {
    var ds = window.discipleState || {};
    var ranks = window.COMMON_RANKS;
    if (!ranks) return;
    var rankDef = ranks.find(function(r) { return r.id === targetRank; });
    if (!rankDef || !rankDef.promoteCondition) return;
    // 掌门（id=0）不可通过晋升获得（路线图 §5 P0-3 验收 1 + 原始定义 promoteCondition=null）
    if (targetRank === 0) {
        if (window.showMessage) window.showMessage('掌门之位不可由晋升获得，需经长老/副掌门共议推举', 'warning');
        return;
    }
    // 不允许从"侍妾/同参弟子"或"未入宗"状态直接晋升
    if (!ds.isInSect) {
        if (window.showMessage) window.showMessage('尚未入宗', 'warning');
        return;
    }
    if (ds.rank === -1 || ds.rank === -2) {
        if (window.showMessage) window.showMessage('特殊身份无需晋升', 'info');
        return;
    }
    var cond = rankDef.promoteCondition;
    // 仅检查贡献
    var reqAmt = cond.contribution || 0;
    // v16.4 净衣特权：晋升贡献减免30%（正典：净衣派往往掌权）
    var gbPromo = ds._gbFaction;
    var isClean = gbPromo && gbPromo.side === 'clean' && sectName === '丐帮';
    if (isClean && reqAmt > 0) reqAmt = Math.floor(reqAmt * 0.7);
    if ((ds.contribution || 0) < reqAmt) {
        if (window.showMessage) window.showMessage('贡献不足（需' + reqAmt + (isClean ? '，净衣弟子已减免三成' : '') + '）', 'error');
        return;
    }
    ds.rank = targetRank;
    // 防御性 clamp：极端情况下也不退化为负数
    ds.contribution = Math.max(0, (Number(ds.contribution) || 0) - reqAmt);
    if (window.showMessage) window.showMessage('🎉 晋升为' + rankDef.name + '！', 'success');
    showSectRanks(sectName);
    if (typeof window.updateCharacterStatus === 'function') window.updateCharacterStatus();
    // v19.0 批次 B 钩子：玩家职位变化时通知
    if (window.EventBus && typeof window.EventBus.emit === 'function') {
        try { window.EventBus.emit('sect:role:checked', { rank: rankDef }); } catch (e) {}
    }
}

// ============ 日常任务面板 ============
function showSectDeepTasks(sectName) {
    var tasks = window.COMMON_TASKS;
    if (!tasks) return;
    var ds = window.discipleState || {};
    var rank = ds.rank || 7;
    var day = (typeof window.getAbsoluteDay === 'function') ? window.getAbsoluteDay() : 1;
    if (ds._sectTaskDay !== day) {
        ds._sectTaskDay = day;
        ds._sectTaskCompleted = 0;
        ds._sectTaskDone = [];
    }
    
    var ranks = window.COMMON_RANKS;
    var rankCfg = ranks ? ranks.find(function(r) { return r.id === rank; }) : null;
    var maxTasks = rankCfg && rankCfg.dailyTaskCount != null ? rankCfg.dailyTaskCount : 1;
    var completed = ds._sectTaskCompleted || 0;
    var remaining = maxTasks - completed;
    
    var html = '<div class="space-y-3">';
    html += '<h3 class="text-lg font-bold text-yellow-400">📋 ' + sectName + '·日常任务</h3>';
    html += '<p class="text-sm text-gray-400">今日可完成：' + remaining + '/' + maxTasks + ' 个任务</p>';
    html += '<hr class="border-gray-600">';
    
    var shown = 0;
    tasks.forEach(function(task) {
        if (task.minRank > rank) return;
        if (ds._sectTaskDone && ds._sectTaskDone.indexOf(task.id) >= 0) return;
        if (shown >= remaining) return;
        shown++;
        
        var rewards = '';
        if (task.reward.contribution) rewards += '贡献+' + task.reward.contribution + ' ';
        if (task.reward.exp) rewards += '经验+' + task.reward.exp + ' ';
        if (task.reward.spiritStones) rewards += '灵石+' + task.reward.spiritStones + ' ';
        if (task.reward.fame) rewards += '名气+' + task.reward.fame + ' ';
        
        html += '<div class="bg-gray-800 rounded-lg p-3 border border-gray-600">';
        html += '<div class="flex justify-between items-start">';
        html += '<div>';
        html += '<p class="font-bold text-white">' + task.name + '</p>';
        html += '<p class="text-xs text-gray-400">' + task.desc + '</p>';
        html += '<p class="text-xs text-yellow-400 mt-1">' + rewards + '</p>';
        html += '</div>';
        html += '<button onclick="sectCompleteTask(\'' + sectName + '\', \'' + task.id + '\')" class="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs">执行</button>';
        html += '</div></div>';
    });
    
    if (completed >= maxTasks) {
        html += '<p class="text-sm text-green-400">今日任务已全部完成！</p>';
    }
    html += '</div>';
    
    if (typeof window.showModal === 'function') {
        window.showModal(sectName + '·日常', html);
    }
}

function sectCompleteTask(sectName, taskId) {
    var ds = window.discipleState || {};
    var tasks = window.COMMON_TASKS;
    if (!tasks) return false;
    var task = tasks.find(function(t) { return t.id === taskId; });
    if (!task) return false;
    if (!ds._sectTaskDone) ds._sectTaskDone = [];
    if (ds._sectTaskDone.indexOf(taskId) >= 0) return false;

    if (!window.RewardService) {
        if (window.showMessage) window.showMessage('奖励结算服务未就绪，任务未消耗', 'error');
        return false;
    }
    var reward = task.reward || {};
    var result = window.RewardService.apply({
        exp: reward.exp,
        spiritStones: reward.spiritStones,
        copper: reward.copper,
        items: reward.items,
        contribution: reward.contribution,
        fame: reward.fame
    }, { source: 'sect-daily:' + sectName + ':' + taskId });
    if (!result || result.success === false) {
        if (window.showMessage) window.showMessage('任务奖励无法完整结算，任务仍保留', 'error');
        return false;
    }

    ds._sectTaskDone.push(taskId);
    ds._sectTaskCompleted = (ds._sectTaskCompleted || 0) + 1;
    if (window.showMessage) window.showMessage('✅ 完成：' + task.name + (result.messages.length ? '（' + result.messages.join('、') + '）' : ''), 'success');
    showSectDeepTasks(sectName);
    return true;
}

// ============ 派系面板 ============
function showSectFactions(sectName) {
    var data = getSectDeepData(sectName);
    if (!data || !data.factions) {
        if (window.showMessage) window.showMessage(sectName + '暂无派系信息', 'info');
        return;
    }
    
    var html = '<div class="space-y-3">';
    html += '<h3 class="text-lg font-bold text-yellow-400">🏛️ ' + sectName + '·内部派系</h3>';
    html += '<p class="text-sm text-gray-400 mb-3">门派内部的不同立场和势力。</p>';
    // v16.4 丐帮两脉入口
    if (sectName === '丐帮' && (window.discipleState || {}).isInSect) {
        var gbBanner = window.discipleState._gbFaction;
        html += '<div class="bg-gray-900 rounded-lg p-3 border border-yellow-700 mb-1"><p class="text-xs text-yellow-300 mb-1">本帮分两脉：净衣主供奉，污衣守本相。</p>';
        if (!gbBanner || !gbBanner.side) {
            html += '<button onclick="joinGbClean()" class="mr-1 bg-amber-700 hover:bg-amber-600 text-white px-3 py-1 rounded text-xs">投身净衣派</button>';
            html += '<button onclick="joinGbDirty()" class="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-xs">投身污衣派</button>';
        } else {
            html += '<button onclick="openGbFactionPanel()" class="bg-cyan-700 hover:bg-cyan-600 text-white px-3 py-1 rounded text-xs">我的门脉：' + (gbBanner.side === 'clean' ? '净衣' : '污衣') + '（查看）</button>';
        }
        html += '</div>';
    }
    
    data.factions.forEach(function(f) {
        var influenceBar = Math.min(100, f.influence || 0);
        html += '<div class="bg-gray-800 rounded-lg p-3 border border-gray-600">';
        html += '<div class="flex justify-between items-start">';
        html += '<div>';
        html += '<p class="font-bold text-white">' + (f.icon || '🏛️') + ' ' + f.name + '</p>';
        html += '<p class="text-xs text-gray-400 mt-1">' + f.desc + '</p>';
        html += '<p class="text-xs text-gray-500">领袖：' + (f.leader || '无') + ' | 成员：' + (f.members || []).join('、') || '无' + '</p>';
        html += '</div>';
        html += '<span class="text-xs text-blue-400">影响力 ' + influenceBar + '%</span>';
        html += '</div>';
        // 影响力条
        html += '<div class="w-full h-1.5 bg-gray-700 rounded mt-2 overflow-hidden">';
        html += '<div class="h-full bg-blue-600 rounded" style="width:' + influenceBar + '%;"></div>';
        html += '</div>';
        // 立场标签
        var stances = [];
        if (f.stance) {
            if (f.stance.expansion) stances.push(f.stance.expansion > 0 ? '扩张+' + f.stance.expansion : '保守' + f.stance.expansion);
            if (f.stance.reform) stances.push(f.stance.reform > 0 ? '革新+' + f.stance.reform : '守旧' + f.stance.reform);
            if (f.stance.orthodox) stances.push(f.stance.orthodox > 0 ? '正统+' + f.stance.orthodox : '异端' + f.stance.orthodox);
        }
        if (stances.length > 0) {
            html += '<div class="flex gap-1 mt-2">';
            stances.forEach(function(s) {
                var isPositive = s.indexOf('+') >= 0;
                html += '<span class="text-xs ' + (isPositive ? 'text-green-400' : 'text-red-400') + ' bg-gray-700 px-1.5 py-0.5 rounded">' + s + '</span>';
            });
            html += '</div>';
        }
        html += '</div>';
    });
    html += '</div>';
    
    if (typeof window.showModal === 'function') {
        window.showModal(sectName + '·派系', html);
    }
}

// ==================== v16.4 丐帮净衣/污衣两派制（D3，用户定案仅丐帮启用） ====================
// 净衣＝供奉线（正典：豪杰恃帮为靠山，价格即身份门槛）：进身礼800+旬捐200/期，换四袋授职/折抵/晋升减免
// 污衣＝本色线：免费入派守正典三戒（v1 接「不行银钱购物」真实购买标记），换义气人脉与情报网
const GB_CLEAN_ENTRY = 800;
const GB_DUES = 200;
const GB_CONVERT_CAP = 200;
const GB_PERIOD_DAYS = 10;

function gbPeriodOf(dayAbs) { return Math.floor((dayAbs - 1) / GB_PERIOD_DAYS); }
function gbWallet() {
    if (window.inventory && window.inventory.currency) return window.inventory.currency.spiritStones || 0;
    return (window.currentCharData && window.currentCharData.spiritStones) || 0;
}
function gbWalletPay(amount) {
    if (gbWallet() < amount) return false;
    if (window.inventory && window.inventory.currency) window.inventory.currency.spiritStones -= amount;
    else if (window.currentCharData) window.currentCharData.spiritStones -= amount;
    if (window.currentCharData) currentCharData_sSync(window.currentCharData);
    if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI();
    return true;
}
function currentCharData_sSync(cd) { cd.spiritStones = (window.inventory && window.inventory.currency) ? window.inventory.currency.spiritStones : cd.spiritStones; }
function gbFactionState() {
    const ds = window.discipleState || {};
    if (!ds._gbFaction) ds._gbFaction = { side: null, joinedPeriod: null, paidThroughPeriod: null, violations: 0, buyMarks: 0, convertPeriod: null, converted: 0, remindPeriod: null, demotePeriod: null, vowPeriod: null };
    if (ds._gbFaction.side == null) ds._gbFaction.side = null;
    return ds._gbFaction;
}
function gbRankName(id) {
    var r = (window.COMMON_RANKS || []).find(function (x) { return x.id === id; });
    return r ? r.name : ('rank' + id);
}
function gbDemoteOne() {
    var ds = window.discipleState || {};
    var cur = ds.rank == null ? 7 : ds.rank;
    if (cur < 7) { ds.rank = cur + 1; ds.rankName = gbRankName(ds.rank); }
    return gbRankName(ds.rank);
}
window.joinGbClean = function () {
    var ds = window.discipleState || {};
    if (!ds.isInSect || ds.sectId !== '丐帮') { if (window.showMessage) window.showMessage('须先加入丐帮', 'warning'); return; }
    var gb = gbFactionState();
    if (gb.side) { if (window.showMessage) window.showMessage('你已有所属门脉。', 'warning'); return; }
    if (!gbWalletPay(GB_CLEAN_ENTRY)) { if (window.showMessage) window.showMessage('进身礼灵石' + GB_CLEAN_ENTRY + '——拿不出这份钱，便走不进净衣堂的门。（囊中羞涩者可转投污衣派）', 'error'); return; }
    gb.side = 'clean';
    gb.joinedPeriod = gbPeriodOf(gbToday());
    gb.paidThroughPeriod = gb.joinedPeriod; // 进身礼含当期份子
    gb.violations = 0; gb.buyMarks = 0; gb.converted = 0; gb.convertPeriod = gb.joinedPeriod;
    var promoted = '';
    if ((ds.rank == null ? 7 : ds.rank) > 4) {
        ds.rank = 4; ds.rankName = gbRankName(4); // 入帮即授内门（四袋）
        promoted = '（授内门之位·四袋）';
    }
    if (window.showMessage) window.showMessage('净衣堂执事收下进身礼，微微拱手："自今日起，阁下便是本帮衣冠中人。"' + promoted, 'success');
    openGbFactionPanel();
};
window.joinGbDirty = function () {
    var ds = window.discipleState || {};
    if (!ds.isInSect || ds.sectId !== '丐帮') { if (window.showMessage) window.showMessage('须先加入丐帮', 'warning'); return; }
    var gb = gbFactionState();
    if (gb.side) { if (window.showMessage) window.showMessage('你已有所属门脉。', 'warning'); return; }
    if (!confirm('立誓守污衣三戒：\n一、不行银钱购物；二、不与外人共桌而食；三、不欺不会武功之人。\n\n破戒者依帮规责罚。确定投身污衣派？')) return;
    gb.side = 'dirty';
    gb.joinedPeriod = gbPeriodOf(gbToday());
    gb.violations = 0; gb.buyMarks = 0;
    if (window.showMessage) window.showMessage('你当众撕下锦袍换上百衲衣，立下三戒之誓——弟兄们轰然叫好。', 'success');
    openGbFactionPanel();
};
function gbToday() {
    return (typeof window.getAbsoluteDay === 'function') ? window.getAbsoluteDay()
        : ((window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') ? window.timeSystem.getAbsoluteDay() : 1);
}
window.payGbDues = function () {
    var ds = window.discipleState || {};
    var gb = gbFactionState();
    if (gb.side !== 'clean') return;
    var p = gbPeriodOf(gbToday());
    if ((gb.paidThroughPeriod || 0) >= p) { if (window.showMessage) window.showMessage('本期香仪钱已经缴过——账房师傅翻着账本直点头。', 'info'); return; }
    if (!gbWalletPay(GB_DUES)) { if (window.showMessage) window.showMessage('钱包里凑不出' + GB_DUES + '灵石的月例。（净衣的身份是要养的）', 'error'); return; }
    gb.paidThroughPeriod = p;
    if (window.showMessage) window.showMessage('缴讫本期香仪钱' + GB_DUES + '灵石——账上干干净净。', 'success');
    openGbFactionPanel();
};
window.convertGbContribution = function () {
    var ds = window.discipleState || {};
    var gb = gbFactionState();
    if (gb.side !== 'clean') return;
    var p = gbPeriodOf(gbToday());
    if ((gb.paidThroughPeriod || 0) < p) { if (window.showMessage) window.showMessage('先缴清本期旬捐，才轮得到折抵。', 'warning'); return; }
    var used = (gb.convertPeriod === p) ? (gb.converted || 0) : 0;
    var capLeft = GB_CONVERT_CAP - used;
    if (capLeft <= 0) { if (window.showMessage) window.showMessage('本期折抵已满' + GB_CONVERT_CAP + '——钱再多，脸面也得按月攒。', 'warning'); return; }
    var wallet = gbWallet();
    if (wallet <= 0) { if (window.showMessage) window.showMessage('身上一个灵石也没有。', 'error'); return; }
    var amt = Math.min(capLeft, wallet);
    if (!gbWalletPay(amt)) return;
    ds.contribution = (ds.contribution || 0) + amt;
    gb.convertPeriod = p; gb.converted = used + amt;
    if (window.showMessage) window.showMessage('以灵石' + amt + '折抵贡献' + amt + '（本期上限' + GB_CONVERT_CAP + '）', 'success');
    openGbFactionPanel();
};
window.switchGbFaction = function (to) {
    var ds = window.discipleState || {};
    var gb = gbFactionState();
    if (!gb.side || gb.side === to) return;
    if (to === 'dirty') {
        if (!confirm('转投污衣派：需散尽一半随身灵石以明志，并当众立三戒之誓。\n旧日净衣同门会怎么看你？确定？')) return;
        if (window.inventory && window.inventory.currency) window.inventory.currency.spiritStones = Math.floor((window.inventory.currency.spiritStones || 0) / 2);
        else if (window.currentCharData) window.currentCharData.spiritStones = Math.floor((window.currentCharData.spiritStones || 0) / 2);
        gb.side = 'dirty'; gb.paidThroughPeriod = null; gb.violations = 0; gb.buyMarks = 0;
        if (window.showMessage) window.showMessage('你把一半家财散给了街坊，换上一件百衲衣。净衣堂的方向传来冷笑。', 'info');
    } else {
        if (!gbWalletPay(GB_CLEAN_ENTRY)) { if (window.showMessage) window.showMessage('重回净衣堂仍要补足进身礼灵石' + GB_CLEAN_ENTRY + '——规矩不改。', 'error'); return; }
        try {
            var olds = (typeof window.getSectNPCs === 'function') ? (window.getSectNPCs('丐帮') || []) : [];
            olds.forEach(function (o) { if (o && typeof o.changeHatred === 'function') o.changeHatred(20); });
        } catch (e) {}
        gb.side = 'clean';
        gb.paidThroughPeriod = gbPeriodOf(gbToday());
        gb.violations = 0; gb.buyMarks = 0;
        if (window.showMessage) window.showMessage('进身礼再度奉上——净衣堂重新接纳了你。街角的旧弟兄别过头去。（旧弟兄仇恨+20）', 'success');
    }
    openGbFactionPanel();
};
function gbDueCheck(today) {
    var ds = window.discipleState || {};
    var gb = ds._gbFaction;
    if (!gb || gb.side !== 'clean' || gb.paidThroughPeriod == null) return;
    var p = gbPeriodOf(today);
    var gap = p - gb.paidThroughPeriod;
    if (gap <= 0) return;
    if (gap === 1 && gb.remindPeriod !== p) {
        gb.remindPeriod = p;
        if (window.showMessage) window.showMessage('账房师傅登门："本月香仪钱还未入账——长老们问起来了。"（旬捐灵石' + GB_DUES + '）', 'warning');
    } else if (gap >= 2 && gap < 3 && gb.demotePeriod !== p) {
        gb.demotePeriod = p;
        var nm = gbDemoteOne();
        if (window.showMessage) window.showMessage('净衣长老当众训话："供养不起这身衣冠，便回去做叫花子！"（降为' + nm + '）', 'error');
    } else if (gap >= 3) {
        gb.side = 'dirty';
        if (typeof window.addFame === 'function') window.addFame(-5);
        if (window.showMessage) window.showMessage('净衣堂除了你的名——"既然穷得供不起这身衣冠，就滚回街上讨饭去。"（贬入污衣，声望-5）', 'error');
    }
}
function gbVowCheck(today) {
    var ds = window.discipleState || {};
    var gb = ds._gbFaction;
    if (!gb || gb.side !== 'dirty') return;
    var p = gbPeriodOf(today);
    if (gb.vowPeriod === p) return; // 每期抽查一次
    if ((gb.buyMarks || 0) >= 3) {
        gb.vowPeriod = p;
        gb.violations = (gb.violations || 0) + 1;
        gb.buyMarks = 0;
        if (gb.violations === 1) {
            if (window.showMessage) window.showMessage('戒律院长老堵住了你："袖口里的银钱味，隔三条街都闻得到。——初犯，记下了。"', 'warning');
        } else if (gb.violations === 2) {
            try { if (window.timeSystem && window.timeSystem.advanceTime) window.timeSystem.advanceTime(180, '罚乞三日'); } catch (e) {}
            var nm = gbDemoteOne();
            if (window.showMessage) window.showMessage('再犯！罚乞三日，降为' + nm + '。', 'error');
        } else {
            gb.side = null;
            if (typeof window.addFame === 'function') window.addFame(-5);
            if (window.showMessage) window.showMessage('三戒屡破，帮中容不下你——逐出污衣堂。（欲入净衣堂，补足进身礼灵石' + GB_CLEAN_ENTRY + '）', 'error');
        }
    }
}
window.openGbFactionPanel = function () {
    var ds = window.discipleState || {};
    if (!ds.isInSect || ds.sectId !== '丐帮') { if (window.showMessage) window.showMessage('此为丐帮内部事务', 'warning'); return; }
    var today = gbToday();
    gbDueCheck(today);
    gbVowCheck(today);
    var gb = gbFactionState();
    var html = '<div class="space-y-3">';
    html += '<h3 class="text-lg font-bold text-yellow-400">🏮 丐帮 · 净衣与污衣</h3>';
    html += '<p class="text-xs text-gray-400">净衣主供奉——豪杰恃帮为靠山；污衣守本相——真叫花子的义气。</p>';
    if (!gb.side) {
        html += '<div class="bg-gray-900 rounded p-3"><p class="text-sm text-white mb-2">你尚未择脉：</p>'
            + '<button onclick="joinGbClean()" class="w-full mb-1 bg-amber-700 hover:bg-amber-600 text-white px-3 py-2 rounded text-sm">投身净衣派（进身礼灵石800·入帮授四袋·月例200）</button>'
            + '<button onclick="joinGbDirty()" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded text-sm">投身污衣派（分文不取·立誓守三戒）</button></div>';
    } else if (gb.side === 'clean') {
        var p = gbPeriodOf(today);
        var paid = (gb.paidThroughPeriod || 0) >= p;
        html += '<div class="bg-amber-950/60 border border-amber-700 rounded p-3">'
            + '<p class="text-sm text-amber-300 font-bold">🧵 净衣派弟子</p>'
            + '<p class="text-xs text-gray-300 mt-1">特权：入帮授四袋｜灵石折抵贡献1:1（每期' + GB_CONVERT_CAP + '）｜晋升贡献减免30%｜净衣堂人脉</p>'
            + '<p class="text-xs mt-1 ' + (paid ? 'text-green-400' : 'text-red-400') + '">本期旬捐：' + (paid ? '已缴讫' : '未缴！（连犯降袋、三期除名）') + '</p>'
            + '<div class="flex gap-1 mt-2 flex-wrap">'
            + (paid ? '' : '<button onclick="payGbDues()" class="bg-yellow-700 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs">缴纳旬捐（灵石' + GB_DUES + '）</button>')
            + '<button onclick="convertGbContribution()" class="bg-cyan-700 hover:bg-cyan-600 text-white px-2 py-1 rounded text-xs">灵石折抵贡献</button>'
            + '<button onclick="switchGbFaction(\'dirty\')" class="bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded text-xs">转投污衣（散财明志）</button>'
            + '</div></div>';
    } else {
        html += '<div class="bg-gray-900/80 border border-gray-500 rounded p-3">'
            + '<p class="text-sm text-gray-200 font-bold">🥢 污衣派弟子</p>'
            + '<p class="text-xs text-gray-300 mt-1">三戒：不行银钱购物｜不与外人共桌而食｜不欺不会武功者</p>'
            + '<p class="text-xs text-gray-400 mt-1">本期违戒购物记录：' + (gb.buyMarks || 0) + ' 次（满3次触发戒律抽查）｜累计违戒：' + (gb.violations || 0) + '</p>'
            + '<p class="text-xs text-emerald-400 mt-1">待遇：消息网情报+15%｜市井见闻更广｜请益传艺×1.5</p>'
            + '<button onclick="switchGbFaction(\'clean\')" class="mt-2 bg-amber-700 hover:bg-amber-600 text-white px-2 py-1 rounded text-xs">转投净衣（补进身礼800）</button>'
            + '</div>';
    }
    html += '</div>';
    if (typeof window.showModal === 'function') window.showModal('🏮 丐帮 · 两脉', html);
};

// ============ 资源/概况面板 ============
function showSectDeepOverview(sectName) {
    var data = getSectDeepData(sectName);
    if (!data) {
        if (window.showMessage) window.showMessage(sectName + '暂无深度信息', 'info');
        return;
    }
    
    var ds = window.discipleState || {};
    var rank = ds.rank || 7;
    var ranks = window.COMMON_RANKS;
    var rankName = ranks ? (ranks.find(function(r) { return r.id === rank; })?.name || '杂役弟子') : '杂役弟子';
    
    var html = '<div class="space-y-4">';
    // 门派概况
    html += '<div class="bg-gray-800/40 p-3 rounded border border-gray-600">';
    html += '<p class="text-sm text-gray-300 leading-relaxed">' + data.desc + '</p>';
    html += '</div>';
    
    // 弟子状态
    html += '<div class="grid grid-cols-2 gap-2">';
    html += '<div class="bg-gray-800 p-2 rounded text-center"><p class="text-xs text-gray-400">职位</p><p class="text-purple-400 font-bold text-sm">' + rankName + '</p></div>';
    html += '<div class="bg-gray-800 p-2 rounded text-center"><p class="text-xs text-gray-400">贡献</p><p class="text-green-400 font-bold text-sm">' + (ds.contribution || 0) + '</p></div>';
    html += '</div>';

    var economy = typeof window.getSectEconomySnapshot === 'function' ? window.getSectEconomySnapshot(sectName) : null;
    if (economy) {
        html += '<div class="grid grid-cols-4 gap-2">';
        html += '<div class="bg-gray-800 p-2 rounded text-center"><p class="text-xs text-gray-400">宗门库存</p><p class="text-amber-300 font-bold text-sm">' + economy.stock + '</p></div>';
        html += '<div class="bg-gray-800 p-2 rounded text-center"><p class="text-xs text-gray-400">日产</p><p class="text-green-400 font-bold text-sm">+' + economy.gross + '</p></div>';
        html += '<div class="bg-gray-800 p-2 rounded text-center"><p class="text-xs text-gray-400">弟子用度</p><p class="text-red-300 font-bold text-sm">-' + economy.upkeep + '</p></div>';
        html += '<div class="bg-gray-800 p-2 rounded text-center"><p class="text-xs text-gray-400">日净</p><p class="' + (economy.net >= 0 ? 'text-cyan-300' : 'text-red-400') + ' font-bold text-sm">' + (economy.net >= 0 ? '+' : '') + economy.net + '</p></div>';
        html += '</div>';
    }
    
    // 特殊资源（v20.2：地标建筑可交互）
    if (data.specialResources && data.specialResources.length > 0) {
        html += '<h3 class="text-lg font-bold text-blue-400">🏗️ 门派建筑</h3>';
        html += '<p class="text-xs text-gray-500 mb-2">建筑使用耗费精力、真气或时辰，产出随建筑而异。</p>';
        html += '<div class="space-y-2">';
        data.specialResources.forEach(function(r) {
            var actionLabel = _sectResourceActionLabel(r.type);
            html += '<div class="bg-gray-800/40 p-2 rounded border border-gray-700">';
            html += '<div class="flex justify-between items-center mb-1">';
            html += '<span class="text-gray-200 text-sm font-bold">' + (r.icon ? r.icon + ' ' : '') + r.name + '</span>';
            html += '<span class="text-green-400 text-xs">效能 ' + r.output + '</span>';
            html += '</div>';
            html += '<p class="text-gray-500 text-xs mb-2">' + (r.desc || '') + '</p>';
            if (actionLabel) {
                html += '<button onclick="useSectResource(\'' + sectName + '\', \'' + r.id + '\')" class="w-full bg-blue-700 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs">' + actionLabel + '</button>';
            } else {
                html += '<button disabled class="w-full bg-gray-700 text-gray-500 px-2 py-1 rounded text-xs cursor-not-allowed">暂无可执行动作</button>';
            }
            html += '</div>';
        });
        html += '</div>';
    }

    // v19.0 P0-3 批次 C3：年度目标进度卡 + 选择按钮
    if (window.SectYearGoal && typeof window.SectYearGoal.renderProgressCard === 'function') {
        html += window.SectYearGoal.renderProgressCard(sectName);
        var st = window.SectYearGoal._getStore && window.SectYearGoal._getStore()[sectName];
        // v20.x：仅掌门(rank 0)/副掌门(rank 1)可见"选本年宗门目标"按钮
        var _ds = (typeof window.discipleState === 'object') ? window.discipleState : {};
        var _canSetGoal = (_ds.rank === 0 || _ds.rank === 1);
        if ((!st || !st.goalId) && _canSetGoal) {
            html += '<button onclick="SectYearGoal.promptChooseYearGoal(\'' + sectName + '\')" class="w-full bg-amber-700 hover:bg-amber-600 p-2 rounded text-sm mb-3">📜 选本年宗门目标</button>';
        }
    }

    // v19.1 P0-4：🏆 大比按钮
    if (window.Tournament && typeof window.Tournament.showTournamentPanel === 'function') {
        html += '<button onclick="Tournament.showTournamentPanel(\'' + sectName + '\')" class="w-full bg-yellow-700 hover:bg-yellow-600 p-2 rounded text-sm mb-3">🏆 宗门大比</button>';
    }

    // v19.2 P0-5：📜 江湖传闻按钮
    if (window.NPCLife && typeof window.NPCLife.showRumorPanel === 'function') {
        html += '<button onclick="NPCLife.showRumorPanel(30)" class="w-full bg-indigo-700 hover:bg-indigo-600 p-2 rounded text-sm mb-3">📜 江湖传闻</button>';
    }

    // 操作按钮
    html += '<div class="flex flex-wrap gap-2 pt-2 border-t border-gray-700">';
    html += '<button onclick="showSectMasters(\'' + sectName + '\')" class="bg-yellow-600 hover:bg-yellow-500 text-gray-900 px-3 py-1 rounded text-xs font-bold">📖 拜师</button>';
    html += '<button onclick="showSectRanks(\'' + sectName + '\')" class="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded text-xs">⬆️ 晋升</button>';
    html += '<button onclick="showSectDeepTasks(\'' + sectName + '\')" class="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-xs">📋 任务</button>';
    html += '<button onclick="showSectFactions(\'' + sectName + '\')" class="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded text-xs">🏛️ 派系</button>';
    // v19.0 P0-3 批次 B5：仅长老及以上显示"宗门管理"
    var sectRole = (typeof window.getPlayerSectRole === 'function') ? window.getPlayerSectRole() : null;
    if (sectRole === 'elder' || sectRole === 'leader') {
        html += '<button onclick="openSectManagementUI()" class="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1 rounded text-xs">👑 宗门管理</button>';
    }
    html += '</div>';
    html += '</div>';
    
    if (typeof window.showModal === 'function') {
        window.showModal(sectName + '·深度信息', html);
    }
}

// ============ 集成到内院面板 ============
// 在 showSectInnerView 中，如果有深度数据，在按钮栏添加"深度"按钮
function getSectDeepButtons(sectName) {
    if (!hasSectDeepData(sectName)) return '';
    return '<button onclick="showSectDeepOverview(\'' + sectName + '\')" class="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-xs">📖 门派详情</button>';
}

// ============ 导出 ============
window.getSectDeepData = getSectDeepData;
window.hasSectDeepData = hasSectDeepData;
window.showSectMasters = showSectMasters;
window.sectBecomeStudent = sectBecomeStudent;
window.sectLeaveMaster = sectLeaveMaster;
// ===== v16.0 师徒收口 =====
window.askMasterGuidance = askMasterGuidance;
window.chushiFromMaster = chushiFromMaster;
window.showSectRanks = showSectRanks;
window.sectPromote = sectPromote;
window.showSectDeepTasks = showSectDeepTasks;
window.sectCompleteTask = sectCompleteTask;
window.showSectFactions = showSectFactions;
window.showSectDeepOverview = showSectDeepOverview;
window.getSectDeepButtons = getSectDeepButtons;