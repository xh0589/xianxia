// ==================== sects-system.js - 门派系统 ====================
// 借鉴《觅长生》、《太吾绘卷》的门派设计

// ============ 门派资源类型 ============
const SECT_RESOURCES = {
    CONTRIBUTION: 'contribution',   // 门派贡献
    POINTS: 'points',              // 门派积分
    CURRENCY: 'currency',          // 门派资金
    REPUTATION: 'reputation'       // 门派声望
};

// ============ 弟子门派状态 ============
let discipleState = {
    isInSect: false,           // 是否在门派中
    sectId: null,              // 门派ID
    rank: 0,                   // 弟子排名（1-100，数字越小地位越高）
    rankName: '外门弟子',       // 弟子职位
    contribution: 0,           // 个人贡献值
    points: 0,                 // 个人积分
    level: 1,                  // 弟子等级（1-10）
    tasksCompleted: 0,         // 完成任务数
    joinTime: null             // 加入时间
};

// ============ 弟子职位体系 ============
const RANKS = [
    { id: 0, name: '掌门', contributionReq: 0, authority: 10 },
    { id: 1, name: '副掌门', contributionReq: 6000, authority: 9 },
    { id: 2, name: '长老', contributionReq: 4000, authority: 8 },
    { id: 3, name: '亲传弟子', contributionReq: 1000, authority: 6 },
    { id: 4, name: '内门弟子', contributionReq: 500, authority: 5 },
    { id: 5, name: '外门弟子', contributionReq: 0, authority: 2 },
    { id: 6, name: '记名弟子', contributionReq: 0, authority: 1 },
    { id: 7, name: '杂役弟子', contributionReq: 0, authority: 0 }
];

// ============ 门派任务类型 ============
const TASK_TYPES = {
    COMBAT: 'combat',          // 战斗任务
    GATHER: 'gather',          // 采集任务
    CRAFT: 'craft',            // 合成任务
    PATROL: 'patrol',          // 巡逻任务
    DAILY: 'daily',            // 日常任务
    MAIN: 'main'               // 主线任务
};

// ============ 门派任务定义 ============
const sectTasks = [
    // 战斗任务
    {
        id: 'task_combat_1',
        name: '剿灭山贼',
        type: TASK_TYPES.COMBAT,
        difficulty: 1,
        requirement: { minRank: 0, minLevel: 1 },
        objectives: [
            { type: 'kill', target: '山贼', count: 5 }
        ],
        rewards: {
            contribution: 50,
            points: 30,
            items: [{ itemId: 'qi_recovery_pill', count: 3 }]
        },
        desc: '剿灭附近山贼5名'
    },
    {
        id: 'task_combat_2',
        name: '猎杀妖兽',
        type: TASK_TYPES.COMBAT,
        difficulty: 3,
        requirement: { minRank: 3, minLevel: 3 },
        objectives: [
            { type: 'kill', target: '妖兽', count: 3 }
        ],
        rewards: {
            contribution: 150,
            points: 100,
            items: [{ itemId: 'vitality_pill', count: 2 }]
        },
        desc: '猎杀危险妖兽3名'
    },
    {
        id: 'task_combat_3',
        name: '护送商队',
        type: TASK_TYPES.COMBAT,
        difficulty: 2,
        requirement: { minRank: 4, minLevel: 2 },
        objectives: [
            { type: 'escort', target: '商队', count: 1 }
        ],
        rewards: {
            contribution: 100,
            points: 60,
            spiritStones: 100
        },
        desc: '安全护送商队通过危险区域'
    },
    
    // 采集任务
    {
        id: 'task_gather_1',
        name: '采集灵草',
        type: TASK_TYPES.GATHER,
        difficulty: 1,
        requirement: { minRank: 0, minLevel: 1 },
        objectives: [
            { type: 'collect', target: '灵草', count: 10 }
        ],
        rewards: {
            contribution: 30,
            points: 20,
            items: [{ itemId: 'spirit_grass', count: 5 }]
        },
        desc: '采集10株灵草'
    },
    {
        id: 'task_gather_2',
        name: '开采矿石',
        type: TASK_TYPES.GATHER,
        difficulty: 2,
        requirement: { minRank: 3, minLevel: 2 },
        objectives: [
            { type: 'collect', target: '灵矿', count: 5 }
        ],
        rewards: {
            contribution: 80,
            points: 50,
            items: [{ itemId: 'iron_ore', count: 20 }]
        },
        desc: '开采5处灵矿'
    },
    
    // 日常任务
    {
        id: 'task_daily_1',
        name: '晨练',
        type: TASK_TYPES.DAILY,
        difficulty: 0,
        requirement: { minRank: 0, minLevel: 1 },
        objectives: [
            { type: 'practice', target: '修炼', count: 1 }
        ],
        rewards: {
            contribution: 10,
            points: 10,
            qiRecovery: 50
        },
        desc: '完成每日晨练',
        isDaily: true,
        dailyReset: true
    },
    {
        id: 'task_daily_2',
        name: '打扫洞府',
        type: TASK_TYPES.DAILY,
        difficulty: 0,
        requirement: { minRank: 0, minLevel: 1 },
        objectives: [
            { type: 'clean', target: '洞府', count: 1 }
        ],
        rewards: {
            contribution: 5,
            points: 5
        },
        desc: '打扫洞府，保持整洁',
        isDaily: true,
        dailyReset: true
    },
    
    // 巡逻任务
    {
        id: 'task_patrol_1',
        name: '门派外围巡逻',
        type: TASK_TYPES.PATROL,
        difficulty: 1,
        requirement: { minRank: 0, minLevel: 1 },
        objectives: [
            { type: 'patrol', target: '外围', count: 1 }
        ],
        rewards: {
            contribution: 20,
            points: 15
        },
        desc: '在门派外围进行巡逻'
    },
    {
        id: 'task_patrol_2',
        name: '边境巡查',
        type: TASK_TYPES.PATROL,
        difficulty: 3,
        requirement: { minRank: 3, minLevel: 3 },
        objectives: [
            { type: 'patrol', target: '边境', count: 1 }
        ],
        rewards: {
            contribution: 100,
            points: 80,
            items: [{ itemId: 'spirit_restoring_pill', count: 1 }]
        },
        desc: '在边境地区进行巡查'
    }
];

// ============ 已完成任务跟踪 ============
let completedTasks = [];
let dailyCompletedTasks = [];

// ============ 加入门派（v7.3 修复重复加入提示） ============
// joinSect(sectId, evalResult) - evalResult 可选，包含特殊身份信息（如侍妾）
function joinSect(sectId, evalResult) {
    const sect = sectsData?.[sectId];
    if (!sect) {
        if (typeof window.showMessage === 'function') {
            window.showMessage('无效的门派！', 'error');
        } else {
            alert('无效的门派！');
        }
        return false;
    }
    
    // 检查是否已经是当前门派弟子
    if (discipleState.isInSect && discipleState.sectId === sectId) {
        if (typeof window.showMessage === 'function') {
            window.showMessage('你已是「' + sectId + '」的弟子，无需重复加入', 'warning');
        } else {
            alert('你已是「' + sectId + '」的弟子！');
        }
        return false;
    }
    
    // 已加入其他门派
    if (discipleState.isInSect) {
        if (!confirm(`你当前是 ${discipleState.sectId} 的弟子，确定要叛离并加入 ${sectId} 吗？\n\n⚠️ 叛离后当前门派贡献将被清零！\n⚠️ 旧门派上下一同记仇：声望大跌、同门恨你入骨。`)) {
            return false;
        }
        // v16.0 叛门世界反应链：掌门震怒、同门记仇——惩罚来自世界而非数值清零
        var oldSectId = discipleState.sectId;
        try {
            if (typeof window.changeFactionReputation === 'function') window.changeFactionReputation(oldSectId, -40);
            var grudgeNpcs = (typeof window.getSectNPCs === 'function') ? window.getSectNPCs(oldSectId) : null;
            if (Array.isArray(grudgeNpcs)) {
                grudgeNpcs.forEach(function (o) { if (o && typeof o.changeHatred === 'function') o.changeHatred(30); });
            }
            if (discipleState._masterId) { // 叛门兼叛师，罪加一等
                discipleState._leftMasters = discipleState._leftMasters || {};
                discipleState._leftMasters[discipleState._masterId] = true;
            }
        } catch (e) {}
        leaveSect(true); // 静默离开（清贡献/职位）
        if (typeof window.showMessage === 'function') {
            window.showMessage('「' + oldSectId + '」上下一片哗然——掌门震怒，旧日同门对你恨之入骨。（旧门派声望-40，同门仇恨+30）', 'error');
        }
    }
    
    // 处理特殊身份
    var specialRank = 7;
    var specialRankName = RANKS[7].name;
    // 大隐阁/天书阁/逍遥派 → 同参弟子(ID=-2)
    if (sectId === '大隐阁' || sectId === '天书阁' || sectId === '逍遥派') {
        specialRank = -2;
        specialRankName = '同参弟子';
    } else if (evalResult && evalResult.isConcubine) {
        specialRank = -1;
        specialRankName = '侍妾';
    } else if (evalResult && evalResult.rank !== undefined && evalResult.rank !== null) {
        var rankObj = RANKS.find(function(r) { return r.id === evalResult.rank; });
        if (rankObj) {
            specialRank = rankObj.id;
            specialRankName = rankObj.name;
        }
    }
    
    // 加入门派（使用 Object.assign 保留引用，确保 window.discipleState 同步更新）
    var isConcubineFlag = evalResult && evalResult.isConcubine || false;
    Object.assign(discipleState, {
        isInSect: true,
        sectId: sectId,
        rank: specialRank,
        rankName: specialRankName,
        contribution: 0,
        points: 0,
        level: 1,
        tasksCompleted: 0,
        joinTime: Date.now(),
        isConcubine: isConcubineFlag,
        concubineFavor: isConcubineFlag ? 0 : undefined
    });
    
    // 门派声望互斥（v7.3 P4）
    if (typeof window.applySectReputationEffects === 'function') {
        window.applySectReputationEffects(sectId, sect.type);
    }
    
    // 更新UI
    updateSectUI();
    
    // 通知面板刷新（使用新三层访问系统）
    if (typeof window.showSectInnerView === 'function') {
        window.showSectInnerView(sectId);
    } else if (typeof window.showSectPanel === 'function') {
        window.showSectPanel(sectId);
    }
    
    if (typeof window.showMessage === 'function') {
        window.showMessage(`🏛️ 加入 ${sectId}，成为${discipleState.rankName}！`, 'success');
    } else {
        alert(`恭喜！你已成功加入 ${sectId}，成为了一名${discipleState.rankName}！`);
    }
    // v19.2 收尾：入宗成功 → 弹"年度目标选择"
    try { _promptYearGoalAfterJoin(); } catch (e0) {}
    // F-1.2 重构：通过事件总线发 join_sect 事件，让 quest-system.js 的事件桥统一处理（不再补丁式直接调 updateQuestObjective）
    if (window.EventBus && typeof window.EventBus.emit === 'function') {
        try { window.EventBus.emit('sect:joined', { sectId: sectId, rank: discipleState.rank }); } catch (e) {}
    }
    return true;
}

// v19.2 收尾：入宗成功后弹"年度目标选择"
function _promptYearGoalAfterJoin() {
    try {
        if (window.SectYearGoal && typeof window.SectYearGoal.promptChooseYearGoal === 'function') {
            var ds = typeof window.discipleState === 'object' ? window.discipleState : null;
            var sect = ds && ds.isInSect ? ds.sectId : null;
            if (sect) window.SectYearGoal.promptChooseYearGoal(sect);
        }
    } catch (e) { /* 不阻塞入宗流程 */ }
}

// ============ 退出门派 ============
function leaveSect(silent = false) {
    if (!discipleState.isInSect) {
        if (!silent) alert('你还没有加入任何门派！');
        return false;
    }
    
    const sectName = discipleState.sectId;
    
    if (!silent && !confirm(`确定要退出 ${sectName} 吗？退出后将失去所有门派资源和权限。`)) {
        return false;
    }
    
    // 重置状态（使用 Object.assign 保留引用）
    Object.assign(discipleState, {
        isInSect: false,
        sectId: null,
        rank: 0,
        rankName: '外门弟子',
        contribution: 0,
        points: 0,
        level: 0,
        tasksCompleted: 0,
        joinTime: null,
        // F-31：叛门/退派时清除师徒与派系运行时字段
        // 此前不清 _masterId → 新门派拜师时 if(ds._masterId) 误判"已有师父"
        _masterId: null,
        _masterName: null,
        _masterSect: null,
        _masterBlessDay: null,
        _gbFaction: null  // 退丐帮清派系，避免重入误判"已有门脉"
        // 注：_leftMasters 是离师历史记录，跨退派保留，不清
    });
    
    // 更新UI
    updateSectUI();
    
    if (!silent) {
        alert(`你已退出 ${sectName}。`);
    }
    return true;
}

// ============ 晋升弟子（委托给通用晋升面板） ============
function promoteDisciple() {
    if (!discipleState.isInSect) {
        alert('你还没有加入任何门派！');
        return false;
    }
    if (typeof window.showSectRanks === 'function') {
        window.showSectRanks(discipleState.sectId);
    }
    return true;
}

// ============ 接取任务 ============
function acceptTask(taskId) {
    if (!discipleState.isInSect) {
        alert('你还没有加入任何门派，无法接取门派任务！');
        return false;
    }
    
    const task = sectTasks.find(t => t.id === taskId);
    if (!task) {
        alert('无效的任务！');
        return false;
    }
    
    // 检查要求
    // B4：职位编号越小通常越高；需要 playerRank <= minRank（数字）
    var playerRank = discipleState.rank != null ? discipleState.rank : 7;
    var needRank = task.requirement.minRank;
    // 历史任务数据中的 minRank=0 表示“不限职位”；其余值仍按数字越小职位越高解释。
    if (needRank != null && needRank > 0 && playerRank > needRank) {
        const minRankName = RANKS.find(r => r.id === needRank)?.name || '未知';
        alert('你的弟子职位不够！需要 ' + minRankName + ' 或以上才能接取此任务。');
        return false;
    }
    
    if (task.requirement.minLevel > discipleState.level) {
        alert(`弟子等级不够！需要 ${task.requirement.minLevel} 级或以上才能接取此任务。`);
        return false;
    }
    
    // 检查是否已完成
    if (completedTasks.includes(taskId)) {
        alert('此任务已完成！');
        return false;
    }
    
    // 接取任务
    if (!window.activeTasks) window.activeTasks = [];
    var maxConcurrent = (window.BALANCE_CONFIG && window.BALANCE_CONFIG.sectTasks && window.BALANCE_CONFIG.sectTasks.maxConcurrent) || 5;
    if (window.activeTasks.length >= maxConcurrent) {
        alert('同时进行的门派任务不能超过' + maxConcurrent + '个。');
        return false;
    }

    // v19.0 P0-3 批次 A3：按职位 dailyTaskCount 限制（特权=玩法）
    // 长老/副掌门/掌门 dailyTaskCount=0 → 不允许接任务
    if (typeof window.getPlayerDailyTaskLimit === 'function' && typeof window.getPlayerActiveTaskCount === 'function') {
        var limit = window.getPlayerDailyTaskLimit();
        var active = window.getPlayerActiveTaskCount();
        if (limit <= 0) {
            if (typeof window.showMessage === 'function') {
                window.showMessage('当前职位不接普通任务（请以管理/外交任务为主）', 'warning');
            } else {
                alert('当前职位不接普通任务');
            }
            return false;
        }
        if (active >= limit) {
            if (typeof window.showMessage === 'function') {
                window.showMessage('今日可接任务已满（' + active + '/' + limit + '），请先完成或放弃现有任务', 'warning');
            } else {
                alert('今日可接任务已满（' + active + '/' + limit + '）');
            }
            return false;
        }
    }

    window.activeTasks.push({
        taskId: taskId,
        task: task,
        progress: {},
        acceptedGameMinute: (window.timeSystem && window.timeSystem.gameTime) ? (window.timeSystem.gameTime.totalMinutes || 0) : 0
    });
    
    updateTaskUI();
    alert(`已接取任务：${task.name}`);
    return true;
}

// ============ 完成任务 ============
function completeTask(taskId) {
    if (!discipleState.isInSect) {
        alert('你还没有加入任何门派！');
        return false;
    }
    
    const task = sectTasks.find(t => t.id === taskId);
    if (!task) {
        alert('无效的任务！');
        return false;
    }
    
    // 检查是否已接取
    const activeTask = window.activeTasks?.find(t => t.taskId === taskId);
    if (!activeTask) {
        alert('请先接取此任务！');
        return false;
    }
    
    // B4：不可空点完成——需 activeTask.progress.done 或 objectives 全满
    var prog = activeTask.progress || {};
    var objectives = (task.objectives || task.goals || []);
    var allDone = !!prog.done || !!activeTask.completed;
    if (!allDone && objectives.length) {
        allDone = objectives.every(function(obj, idx) {
            var key = obj.id || obj.type || ('obj_' + idx);
            var need = obj.count || obj.target || 1;
            var cur = prog[key] != null ? prog[key] : (prog[obj.type] || 0);
            return cur >= need;
        });
    }
    if (!allDone && !prog.forceComplete) {
        alert('任务目标尚未完成，无法交任务！\n（击杀/采集等进度接入后可自动完成）');
        return false;
    }
    
    // 发放奖励：物品/货币先走原子事务，防止背包满时出现半结算。
    var rewardTx = window.EconomyTransaction;
    if (rewardTx && typeof rewardTx.run === 'function') {
        var rewardResult = rewardTx.run(function() {
            if (task.rewards.spiritStones && !rewardTx.credit('spiritStones', task.rewards.spiritStones)) return { success: false };
            if (task.rewards.items) {
                for (var ri = 0; ri < task.rewards.items.length; ri++) {
                    var rewardItem = task.rewards.items[ri];
                    if (typeof window.addItem !== 'function' || !window.addItem(rewardItem.itemId, rewardItem.count)) return { success: false, reason: 'inventory_full' };
                }
            }
            return { success: true };
        });
        if (!rewardResult || rewardResult.success === false) {
            alert('背包空间不足，奖励尚未结算。请整理背包后再次交任务。');
            return false;
        }
    } else {
        if (task.rewards.spiritStones) inventory.currency.spiritStones += task.rewards.spiritStones;
        if (task.rewards.items) {
            for (var rj = 0; rj < task.rewards.items.length; rj++) {
                if (!addItem(task.rewards.items[rj].itemId, task.rewards.items[rj].count)) {
                    alert('背包空间不足，无法结算任务奖励。');
                    return false;
                }
            }
        }
    }
    if (task.rewards.contribution) discipleState.contribution += task.rewards.contribution;
    if (task.rewards.points) discipleState.points += task.rewards.points;

    // 更新状态
    discipleState.tasksCompleted++;
    discipleState.level = Math.floor(discipleState.tasksCompleted / 5) + 1;
    completedTasks.push(taskId);
    
    // 从活跃任务中移除
    const index = window.activeTasks.findIndex(t => t.taskId === taskId);
    if (index >= 0) {
        window.activeTasks.splice(index, 1);
    }
    
    // 更新UI
    updateSectUI();
    updateTaskUI();
    updateInventoryUI();
    updateCurrencyUI();
    
    alert(`任务完成！获得：\n` +
          `贡献值 +${task.rewards.contribution || 0}\n` +
          `积分 +${task.rewards.points || 0}\n` +
          (task.rewards.spiritStones ? `灵石 +${task.rewards.spiritStones}\n` : '') +
          (task.rewards.items ? `物品: ${task.rewards.items.map(i => i.itemId).join(', ')}\n` : ''));
    
    return true;
}

// ============ 提交日常任务 ============
function submitDailyTask(taskId) {
    if (!discipleState.isInSect) {
        alert('你还没有加入任何门派！');
        return false;
    }
    
    // 检查今日是否已完成
    if (dailyCompletedTasks.includes(taskId)) {
        alert('此任务今日已完成！');
        return false;
    }
    
    // B4：日常仍简化，但消耗时间与精力，禁止零成本刷
    if (window.currentCharData) {
        var en = window.currentCharData.energy != null ? window.currentCharData.energy : 100;
        if (en < 5) {
            alert('精力不足，无法完成日常！');
            return false;
        }
        window.currentCharData.energy = en - 5;
    }
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(30, '门派日常');
    }
    dailyCompletedTasks.push(taskId);
    
    // 发放奖励
    const task = sectTasks.find(t => t.id === taskId);
    if (task?.rewards) {
        if (task.rewards.contribution) {
            discipleState.contribution += task.rewards.contribution;
        }
        if (task.rewards.points) {
            discipleState.points += task.rewards.points;
        }
        if (task.rewards.items) {
            task.rewards.items.forEach(item => {
                addItem(item.itemId, item.count);
            });
        }
    }
    
    discipleState.tasksCompleted++;
    discipleState.level = Math.floor(discipleState.tasksCompleted / 5) + 1;
    
    updateSectUI();
    updateTaskUI();
    updateInventoryUI();
    updateCurrencyUI();
    
    alert('日常任务完成！');
    return true;
}

// ============ 重置每日任务 ============
function resetDailyTasks() {
    dailyCompletedTasks = [];
    updateTaskUI();
}

// ============ 更新门派UI ============
function updateSectUI() {
    const sectInfoDiv = document.getElementById('sect-info');
    if (!sectInfoDiv) return;
    
    if (discipleState.isInSect) {
        // v16.3 门派每日事件：每日首次开门派面板 roll（未抉择挂起事件会重弹）
        try { if (typeof window.maybeSectDailyEvent === 'function') window.maybeSectDailyEvent(); } catch (eEvt) {}
        // 侍妾特殊显示
        var isConcubine = discipleState.isConcubine;
        var favorHtml = '';
        if (isConcubine && typeof window.getFavorLevel === 'function') {
            var favor = discipleState.concubineFavor || 0;
            var favorLevel = window.getFavorLevel(favor);
            favorHtml = `<div class="flex justify-between items-center">
                    <span class="text-gray-400">宠爱：</span>
                    <span class="text-pink-400 font-bold">${favor}/${favorLevel.name}</span>
                </div>`;
        }
        
        sectInfoDiv.innerHTML = `
            <div class="space-y-2">
                <div class="flex justify-between items-center">
                    <span class="text-gray-400">门派：</span>
                    <span class="text-yellow-400 font-bold">${discipleState.sectId}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-400">职位：</span>
                    <span class="${isConcubine ? 'text-pink-400' : 'text-purple-400'} font-bold">${discipleState.rankName}</span>
                </div>
                ${favorHtml}
                <div class="flex justify-between items-center">
                    <span class="text-gray-400">弟子等级：</span>
                    <span class="text-blue-400 font-bold">Lv.${discipleState.level}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-400">贡献值：</span>
                    <span class="text-green-400 font-bold">${discipleState.contribution}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-400">积分：</span>
                    <span class="text-cyan-400 font-bold">${discipleState.points}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-400">完成任务：</span>
                    <span class="text-white font-bold">${discipleState.tasksCompleted}</span>
                </div>
                <div class="pt-2 border-t border-gray-600 mt-2">
                    ${!isConcubine && discipleState.rank !== -2 ? '<button onclick="promoteDisciple()" class="w-full bg-purple-600 hover:bg-purple-500 text-white py-1 px-3 rounded text-sm mb-2">晋升</button>' : ''}
                    <button onclick="leaveSect()" class="w-full bg-red-600 hover:bg-red-500 text-white py-1 px-3 rounded text-sm">退出门派</button>
                </div>
            </div>
        `;
    } else {
        sectInfoDiv.innerHTML = `
            <div class="text-center py-4">
                <p class="text-gray-500 mb-4">你目前是无门无派的散修</p>
                <p class="text-xs text-gray-600">加入门派可以获得任务、资源和修炼指导</p>
            </div>
        `;
    }
}

// ============ 更新任务UI ============
function updateTaskUI() {
    const taskContainer = document.getElementById('sect-tasks-container');
    if (!taskContainer) return;
    
    // 活跃任务
    const activeTasksDiv = document.getElementById('active-tasks');
    if (activeTasksDiv) {
        const active = window.activeTasks || [];
        if (active.length === 0) {
            activeTasksDiv.innerHTML = '<p class="text-xs text-gray-500 text-center">暂无活跃任务</p>';
        } else {
            activeTasksDiv.innerHTML = active.map(function(at) {
                var objectives = at.task.objectives || [];
                var progressHtml = objectives.map(function(obj, idx) {
                    var key = obj.id || obj.type || ('obj_' + idx);
                    var cur = (at.progress && at.progress[key] != null) ? at.progress[key] : ((at.progress && at.progress[obj.type]) || 0);
                    var need = Number(obj.count) || 1;
                    return '<div class="text-gray-500">' + (obj.target || obj.type) + '：' + Math.min(cur, need) + '/' + need + '</div>';
                }).join('');
                var directType = objectives.length === 1 && (objectives[0].type === 'patrol' || objectives[0].type === 'escort') ? objectives[0].type : '';
                var directBtn = directType ? '<button onclick="performSectTaskAction(\'' + at.taskId + '\')" class="mt-1 mr-1 bg-blue-600 hover:bg-blue-500 text-white px-2 py-0.5 rounded">执行' + (directType === 'patrol' ? '巡逻' : '护送') + '</button>' : '';
                return '<div class="bg-gray-700/30 p-2 rounded text-xs">' +
                    '<p class="font-bold text-white">' + at.task.name + '</p>' +
                    '<p class="text-gray-400">' + at.task.desc + '</p>' + progressHtml + directBtn +
                    '<button onclick="completeTask(\'' + at.taskId + '\')" class="mt-1 bg-green-600 hover:bg-green-500 text-white px-2 py-0.5 rounded">交任务</button></div>';
            }).join('');
        }
    }
    
    // 可用任务列表
    const availableTasksDiv = document.getElementById('available-tasks');
    if (availableTasksDiv) {
        availableTasksDiv.innerHTML = sectTasks.map(task => {
            const isCompleted = completedTasks.includes(task.id);
            const isDaily = task.isDaily && task.dailyReset;
            const isDailyDone = isDaily && dailyCompletedTasks.includes(task.id);
            const isActive = window.activeTasks?.some(t => t.taskId === task.id);
            
            let btnDisabled = isCompleted || isDailyDone || isActive;
            let btnClass = isDailyDone ? 'bg-gray-600' : (isActive ? 'bg-blue-600' : (isCompleted ? 'bg-gray-600' : 'bg-yellow-600 hover:bg-yellow-500'));
            let btnText = isDailyDone ? '今日已完成' : (isActive ? '进行中' : (isCompleted ? '已完成' : '接取'));
            let onclick = !btnDisabled ? `onclick="${isDaily ? 'submitDailyTask' : 'acceptTask'}('${task.id}')"` : '';
            
            return `
                <div class="bg-gray-700/30 p-2 rounded ${isCompleted ? 'opacity-50' : ''}">
                    <div class="flex justify-between items-center">
                        <p class="font-bold text-white text-xs">${task.name}</p>
                        <span class="text-xs text-gray-500">${task.type}</span>
                    </div>
                    <p class="text-xs text-gray-400 mt-1">${task.desc}</p>
                    <div class="flex justify-between items-center mt-1">
                        <span class="text-xs text-green-400">贡献+${task.rewards.contribution || 0}</span>
                        <button class="${btnClass} text-white px-2 py-0.5 rounded text-xs ${btnDisabled ? 'opacity-50 cursor-not-allowed' : ''}" ${onclick}>${btnText}</button>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// ============ 打开加入门派界面 ============
function openJoinSectUI() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    
    const sectOptions = Object.keys(sectsData || {}).map(sectId => {
        const sect = sectsData[sectId];
        return `
            <div class="bg-gray-800 border border-gray-600 rounded-lg p-4 hover:border-yellow-500 cursor-pointer" onclick="joinSect('${sectId}'); this.closest('.fixed').remove();">
                <div class="flex justify-between items-center mb-2">
                    <h4 class="font-bold text-yellow-400">${sectId}</h4>
                    <span class="text-xs px-2 py-1 rounded ${sect.type === '正道' ? 'bg-green-600' : (sect.type === '邪派' ? 'bg-red-600' : 'bg-gray-600')}">${sect.type}</span>
                </div>
                <p class="text-xs text-gray-400 mb-2">${sect.desc || '暂无描述'}</p>
                <div class="text-xs text-gray-500">
                    <p>位置：${sect.location || '未知'}</p>
                    <p>武器：${sect.weapons || '未知'}</p>
                </div>
            </div>
        `;
    }).join('');
    
    modal.innerHTML = `
        <div class="bg-gray-800 border-2 border-yellow-500 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto mx-4">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-yellow-500">🏛️ 加入门派</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <p class="text-sm text-gray-400 mb-4">选择一个门派加入，你将获得任务、资源和修炼指导</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${sectOptions}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// ============ 打开门派任务界面 ============
function openSectTaskUI() {
    if (!discipleState.isInSect) {
        alert('你还没有加入任何门派，无法查看门派任务！');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    
    modal.innerHTML = `
        <div class="bg-gray-800 border-2 border-yellow-500 rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto mx-4">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-yellow-500">📋 门派任务 - ${discipleState.sectId}</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <!-- 左侧：活跃任务 -->
                <div>
                    <h4 class="text-lg font-bold text-blue-400 mb-2">进行中任务</h4>
                    <div id="active-tasks" class="space-y-2">
                        <!-- 动态生成 -->
                    </div>
                </div>
                
                <!-- 右侧：可用任务 -->
                <div>
                    <h4 class="text-lg font-bold text-green-400 mb-2">可用任务</h4>
                    <div id="available-tasks" class="space-y-2 max-h-96 overflow-y-auto">
                        <!-- 动态生成 -->
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 更新任务UI
    updateTaskUI();
}

// ==================== v6.3 宗门资源与战争系统扩展 ====================

// 宗门资源状态
var sectResourceState = {
    spiritStones: 1000,    // 宗门灵石储备
    food: 500,             // 宗门粮食
    materials: 300,        // 宗门材料
    morale: 70,            // 宗门士气(0-100)
    defense: 50,           // 宗门防御力
    memberCount: 50,       // 宗门弟子数
    lastWarTime: 0,        // 上次战争时间
    allySects: [],         // 盟友门派
    enemySects: []         // 敌对门派
};

// 宗门资源获取
function collectSectResources() {
    var day = (window.timeSystem && window.timeSystem.gameTime && window.timeSystem.gameTime.currentDay) || 1;
    // 先让整个世界的宗门完成日结；幂等保护由各宗门 lastEconomyDay 保证。
    if (typeof window.processAllSectDailyEconomy === 'function') {
        try { window.processAllSectDailyEconomy(day); } catch (e) { console.warn('[宗门日结] 失败:', e); }
    }
    if (!discipleState.isInSect) return false;
    if (discipleState._lastSalaryDay === day) {
        if (!window._isInLongRetreat && window.showMessage) window.showMessage('今日宗门俸禄已经领取', 'info');
        return false;
    }

    var rankIndex = RANKS.findIndex(function(r) { return r.id === discipleState.rank; });
    if (rankIndex < 0) rankIndex = 7;
    // v20.8：同门关系真实影响份例（此前 addRelation 写入的 _sectRelation 零读者=安慰剂）——
    // 处得好用度多两成，处得生分少两成，封顶 ±20%
    var rel = Number(discipleState._sectRelation) || 0;
    var relBonus = Math.max(-0.2, Math.min(0.2, rel * 0.02));
    var baseStones = Math.max(1, Math.round((10 + (7 - rankIndex) * 5) * (1 + relBonus)));
    if (window.inventory && window.inventory.currency) {
        window.inventory.currency.spiritStones = (window.inventory.currency.spiritStones || 0) + baseStones;
        if (window.currentCharData) window.currentCharData.spiritStones = window.inventory.currency.spiritStones;
    }
    discipleState._lastSalaryDay = day;
    if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI();

    if (!window._isInLongRetreat && window.showMessage) {
        var econ = typeof window.getSectEconomySnapshot === 'function' ? window.getSectEconomySnapshot(discipleState.sectId) : null;
        var suffix = econ ? '；宗门库存' + econ.stock + '（日净' + (econ.net >= 0 ? '+' : '') + econ.net + '）' : '';
        window.showMessage('宗门俸禄：灵石+' + baseStones + suffix, 'info');
    }
    return true;
}

// 宗门战争
// v20.48 修断线：sectsData.power 是「巨擘/大派/中等/小/极小/未知」文字档位，
// 旧码 (power||50)*10 把文字当数字乘 → NaN → Math.random()<NaN 恒 false——「征讨」是必败按钮。
var SECT_POWER_TIERS = { '巨擘': 100, '大派': 70, '中等偏上': 55, '中等': 40, '小': 22, '极小': 12, '未知': 40 };
function sectPowerValue(sect) {
    if (!sect) return 40;
    var tier = SECT_POWER_TIERS[sect.power];
    return tier != null ? tier : 40;
}

function initiateSectWar(targetSectId) {
    var _ds = getDs();
    if (!_ds || !_ds.isInSect) {
        showMessage('未加入门派', 'error');
        return false;
    }

    var targetSect = window.sectsData?.[targetSectId];
    if (!targetSect) {
        showMessage('目标门派不存在', 'error');
        return false;
    }
    if (targetSectId === _ds.sectId) {
        showMessage('本门弟子不打本门', 'warning');
        return false;
    }

    // 计算战力（对方档位折数值）
    var ourPower = sectResourceState.morale * 2 + sectResourceState.defense + sectResourceState.memberCount;
    var theirPower = sectPowerValue(targetSect) * 10;
    var winChance = ourPower / (ourPower + theirPower) * 100;

    var result = Math.random() < winChance / 100;

    // v20.48 外交落账：仗打完，两门关系必须变——此前 relation 只被渲染，胜负不留痕迹
    var _mySect = _ds.sectId;
    var _diplo = window.SECT_DIPLOMACY_STATE;
    function _settleRelation(delta) {
        try {
            if (_diplo && _diplo[_mySect] && _diplo[_mySect][targetSectId]) {
                var cell = _diplo[_mySect][targetSectId];
                cell.relation = Math.max(-100, Math.min(100, (cell.relation || 0) + delta));
                cell.conflicts = (cell.conflicts || 0) + 1;
                cell.lastEvent = (window.timeSystem && window.timeSystem.gameTime) ? (window.timeSystem.gameTime.currentDay || 0) : 0;
                if (typeof window.saveSectDiplomacy === 'function') window.saveSectDiplomacy();
            }
        } catch (eDip) {}
    }

    if (result) {
        // 胜利：缴获随对方档位走——打巨擘与打极小不是一个量级
        var spoils = Math.floor((60 + Math.random() * 240) * (sectPowerValue(targetSect) / 40));
        if (window.inventory) {
            window.inventory.currency.spiritStones = (window.inventory.currency.spiritStones || 0) + spoils;
        }
        if (window.currentCharData) window.currentCharData.spiritStones = window.inventory.currency.spiritStones;
        sectResourceState.morale = Math.min(100, sectResourceState.morale + 10);
        // v20.48 修硬编码：旧码无论打谁一律扣魔道声望——打邪派反倒折了魔道声望。
        // 改按对方阵营结账：讨邪则正道同盟抬高、魔道侧记恨；伐正则反之。
        try {
            if (typeof changeFactionReputation === 'function') {
                if (targetSect.type === '邪派') {
                    changeFactionReputation('righteous_alliance', 12);
                    changeFactionReputation('demon_cult', -6);
                } else if (targetSect.type === '正道') {
                    changeFactionReputation('demon_cult', 12);
                    changeFactionReputation('righteous_alliance', -10);
                } else {
                    changeFactionReputation('rogue_cultivators', 5);
                }
            }
        } catch (eFaction) {}
        _settleRelation(-35);

        if (window.showMessage) {
            window.showMessage('⚔️ 宗门战争胜利！缴获灵石+' + spoils + '，士气+10，' + targetSectId + '与你门关系恶化（记仇了）', 'success');
        }
    } else {
        // 失败
        sectResourceState.morale = Math.max(0, sectResourceState.morale - 20);
        sectResourceState.defense = Math.max(0, sectResourceState.defense - 10);
        _settleRelation(-20);

        if (window.showMessage) {
            window.showMessage('⚔️ 宗门战争失败…士气-20，防御-10，' + targetSectId + '记下这一仗', 'error');
        }
    }

    sectResourceState.lastWarTime = Date.now();
    if (window.StateRegistry && typeof window.StateRegistry.markDirty === 'function') {
        try { window.StateRegistry.markDirty('sectInternal'); } catch (eSr) {}
    }
    return result;
}

// ==================== v6.3 道侣系统深度扩展（双修+合击+情绪） ====================

// 双修系统
function dualCultivate(npcId) {
    var npc = window.npcManager?.getNPC(npcId);
    if (!npc) {
        showMessage('NPC不存在', 'error');
        return false;
    }
    
    var bonds = window.currentCharData?.bonds || {};
    var bond = bonds[npcId];
    if (!bond || bond.type !== 'dao_companion') {
        showMessage('对方不是你的道侣，无法双修', 'warning');
        return false;
    }
    
    // 检查精力
    var energy = window.currentCharData?.energy || 100;
    if (energy < 20) {
        showMessage('精力不足，无法双修', 'error');
        return false;
    }
    
    window.currentCharData.energy = energy - 20;
    
    // 双修效果
    var baseExp = 50;
    var affectionBonus = Math.floor((npc.relationship?.affection || 50) / 10);
    var totalExp = baseExp + affectionBonus * 5;
    // v20.36 深情共鸣：深情积自真诚里程碑（结契/陪节/坦白立誓），满 50 时双修心意相通——经验×1.5
    if ((Number(npc.relationship?.love) || 0) >= 50) {
        totalExp = Math.round(totalExp * 1.5);
    }
    
    // 经验加成
    if (typeof addPlayerExp === 'function') {
        addPlayerExp(totalExp);
    }
    // 2.20 道侣双修深化：双修亦产出真元（阴阳相济聚先天真元）
    window.currentCharData.essence = (window.currentCharData.essence || 0) + Math.floor(totalExp * 0.5);

    // 好感度提升
    npc.changeAffection(2);

    // v20.12 情分积累：双修日久生情，攒满 10 分情分且情投意合（好感≥80）升一档道侣位分。
    // 修复旧死结：诞育首胎要求 bond.level≥2，但旧版全游戏没有任何把 bond.level 升过 1
    // 的路径（唯一写入点在诞育之后）——首胎永远生不出。升档成本=精力 20+时辰 1 刻+真情分，
    // 无每日配额。
    bond.bondHeart = (bond.bondHeart || 0) + 1;
    if (bond.bondHeart >= 10 && (npc.relationship?.affection || 0) >= 80) {
        bond.bondHeart = 0;
        bond.level = (bond.level || 1) + 1;
        if (window.showMessage) {
            window.showMessage('💞 情分圆满，你与' + npc.name + '的道侣位分升至 ' + bond.level + ' 档。', 'success');
        }
    }

    // 时间消耗
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(60, '双修');
    }
    
    var bondLevel = bond.level || 1;
    var bonusMsg = '';
    if (bondLevel >= 2) bonusMsg = '（双修熟练！）';
    if (bondLevel >= 3) bonusMsg = '（灵肉合一！）';
    
    if (window.showMessage) {
        window.showMessage('💕 与' + npc.name + '双修，获得经验+' + totalExp + '，好感度+2' + bonusMsg, 'success');
    }
    
    // 小概率触发领悟
    if (Math.random() < 0.1) {
        if (window.insightPoints !== undefined) {
            window.insightPoints = (window.insightPoints || 0) + 1;
            if (window.updateInsightUI) window.updateInsightUI();
            if (window.showMessage) window.showMessage('🌟 双修中有所感悟，获得1点领悟点数！', 'success');
        }
    }
    
    return true;
}

// 合击技能（战斗中使用）
function getDaoCompanionCombos(npcId) {
    var bonds = window.currentCharData?.bonds || {};
    var bond = bonds[npcId];
    if (!bond || bond.type !== 'dao_companion') return [];
    
    var level = bond.level || 1;
    var combos = [];
    
    if (level >= 1) {
        combos.push({ name: '情意绵绵', desc: '双人合击，伤害+20%', bonus: { attack: 20 } });
    }
    if (level >= 2) {
        combos.push({ name: '心有灵犀', desc: '配合默契，闪避+15%', bonus: { dodge: 15 } });
    }
    if (level >= 3) {
        combos.push({ name: '生死与共', desc: '同生共死，防御+25%', bonus: { defense: 25 } });
    }
    if (level >= 5) {
        combos.push({ name: '天作之合', desc: '完美配合，全属性+30%', bonus: { all: 30 } });
    }
    
    return combos;
}

// 道侣情绪系统
function updateDaoCompanionMood(npcId) {
    var npc = window.npcManager?.getNPC(npcId);
    if (!npc) return;
    
    var hoursSinceLast = npc.getHoursSinceLastMeet();
    var mood = npc.state?.mood || 50;
    
    // 长时间不见会降低情绪
    if (hoursSinceLast > 24) {
        mood -= 5;
    }
    if (hoursSinceLast > 72) {
        mood -= 10;
    }
    if (hoursSinceLast > 168) { // 一周
        mood -= 20;
        // 可能触发道侣不满事件
        if (Math.random() < 0.1) {
            if (window.showMessage) {
                window.showMessage('💔 ' + npc.name + '似乎有些孤单……', 'warning');
            }
        }
    }
    
    npc.state.mood = Math.max(0, Math.min(100, mood));
}

// ============ 导出 ============
window.discipleState = discipleState;
window.completedTasks = completedTasks;
window.dailyCompletedTasks = dailyCompletedTasks;
window.RANKS = RANKS;
window.TASK_TYPES = TASK_TYPES;
window.sectTasks = sectTasks;
window.joinSect = joinSect;
window.leaveSect = leaveSect;
window.promoteDisciple = promoteDisciple;
window.acceptTask = acceptTask;
window.completeTask = completeTask;
window.submitDailyTask = submitDailyTask;
window.resetDailyTasks = resetDailyTasks;
window.updateSectUI = updateSectUI;
window.updateTaskUI = updateTaskUI;
window.openJoinSectUI = openJoinSectUI;
window.openSectTaskUI = openSectTaskUI;
// v6.3 扩展导出
window.sectResourceState = sectResourceState;
window.collectSectResources = collectSectResources;
window.initiateSectWar = initiateSectWar;
window.dualCultivate = dualCultivate;
window.getDaoCompanionCombos = getDaoCompanionCombos;
window.updateDaoCompanionMood = updateDaoCompanionMood;

// ============ v12.1：门派任务事件闭环 ============
function _sectText(v) {
    if (v == null) return '';
    if (typeof v === 'object') return [v.id, v.name, v.type, v.species].filter(Boolean).join(' ');
    return String(v);
}
function _sectObjectiveMatches(obj, eventType, data) {
    data = data || {};
    var target = _sectText(obj.target).toLowerCase();
    var actual = '';
    if (eventType === 'enemy:defeated' && obj.type === 'kill') actual = [data.enemyId, data.enemyType, data.species].concat(data.tags || []).filter(Boolean).join(' ').toLowerCase();
    else if (eventType === 'item:obtained' && obj.type === 'collect') {
        var genericTags = [];
        var subtype = String(data.subtype || '').toLowerCase();
        var itemId = String(data.itemId || '').toLowerCase();
        var itemName = String(data.itemName || data.name || '');
        if (subtype === 'herb' || /草|芝|参|莲|花|药/.test(itemName)) genericTags.push('灵草');
        if (subtype === 'metal' || /ore|矿|精铁|铜|锡/.test(itemId + ' ' + itemName)) genericTags.push('灵矿');
        actual = [data.itemId, data.itemName, data.name, data.itemType, data.subtype, data.category]
            .concat(data.tags || [], genericTags).filter(Boolean).join(' ').toLowerCase();
    }
    else if (eventType === 'item:crafted' && obj.type === 'craft') actual = [data.itemId, data.itemName, data.name].filter(Boolean).join(' ').toLowerCase();
    else if (eventType === 'escort:completed' && obj.type === 'escort') actual = [data.target, data.name, '商队'].filter(Boolean).join(' ').toLowerCase();
    else if (eventType === 'patrol:completed' && obj.type === 'patrol') actual = [data.target, data.name, '外围 边境 巡逻'].filter(Boolean).join(' ').toLowerCase();
    else if (eventType === 'cultivation:completed' && obj.type === 'practice') actual = '修炼 晨练';
    else if (eventType === 'clean:completed' && obj.type === 'clean') actual = '洞府 打扫';
    else return false;
    return !target || actual.indexOf(target) >= 0 || target.indexOf(actual) >= 0;
}
function advanceSectTaskProgress(eventType, data) {
    if (!Array.isArray(window.activeTasks)) return;
    var amount = Math.max(1, Math.floor(Number(data && (data.count || data.amount)) || 1));
    var changed = false;
    window.activeTasks.forEach(function(active) {
        var objectives = (active.task && active.task.objectives) || [];
        active.progress = active.progress || {};
        objectives.forEach(function(obj, idx) {
            if (!_sectObjectiveMatches(obj, eventType, data)) return;
            var key = obj.id || obj.type || ('obj_' + idx);
            var need = Math.max(1, Number(obj.count) || 1);
            var cur = active.progress[key] != null ? active.progress[key] : (active.progress[obj.type] || 0);
            cur = Math.min(need, cur + amount);
            active.progress[key] = cur;
            active.progress[obj.type] = cur;
            changed = true;
        });
        active.completed = objectives.length > 0 && objectives.every(function(obj, idx) {
            var key = obj.id || obj.type || ('obj_' + idx);
            return Number(active.progress[key] != null ? active.progress[key] : active.progress[obj.type]) >= (Number(obj.count) || 1);
        });
    });
    if (changed) updateTaskUI();
}
function performSectTaskAction(taskId) {
    var active = (window.activeTasks || []).find(function(t) { return t.taskId === taskId; });
    if (!active) return false;
    var obj = active.task && active.task.objectives && active.task.objectives[0];
    if (!obj || (obj.type !== 'patrol' && obj.type !== 'escort')) return false;
    var c = (window.BALANCE_CONFIG && window.BALANCE_CONFIG.sectTasks) || {};
    var energyCost = obj.type === 'patrol' ? (Number(c.patrolEnergyCost) || 20) : (Number(c.escortEnergyCost) || 30);
    var minutes = obj.type === 'patrol' ? (Number(c.patrolMinutes) || 60) : (Number(c.escortMinutes) || 120);
    var cd = (typeof window.getCurrentCharData === 'function') ? window.getCurrentCharData() : window.currentCharData;
    if (!cd || (Number(cd.energy) || 0) < energyCost) { alert('精力不足，需要' + energyCost + '点精力。'); return false; }
    cd.energy -= energyCost;
    if (window.timeSystem && window.timeSystem.advanceTime) window.timeSystem.advanceTime(minutes, obj.type === 'patrol' ? '门派巡逻' : '护送商队');
    else if (window.advanceTime) window.advanceTime(minutes, obj.type === 'patrol' ? '门派巡逻' : '护送商队');
    if (window.EventBus) window.EventBus.emit(obj.type === 'patrol' ? 'patrol:completed' : 'escort:completed', { target: obj.target, count: 1, taskId: taskId });
    if (typeof window.updateCharacterStatus === 'function') window.updateCharacterStatus();
    return true;
}
if (window.EventBus && typeof window.EventBus.on === 'function') {
    ['enemy:defeated','item:obtained','item:crafted','escort:completed','patrol:completed','cultivation:completed','clean:completed'].forEach(function(type) {
        window.EventBus.on(type, function(data) { advanceSectTaskProgress(type, data || {}); });
    });
}
window.advanceSectTaskProgress = advanceSectTaskProgress;
window.performSectTaskAction = performSectTaskAction;

// v12.1：门派任务运行态进入统一存档。
if (window.StateRegistry) {
    window.StateRegistry.register('sectTasks', {
        version: 1,
        export: function() {
            return {
                activeTasks: JSON.parse(JSON.stringify(window.activeTasks || [])),
                completedTasks: completedTasks.slice(),
                dailyCompletedTasks: dailyCompletedTasks.slice()
            };
        },
        import: function(data) {
            data = data || {};
            window.activeTasks = Array.isArray(data.activeTasks) ? JSON.parse(JSON.stringify(data.activeTasks)) : [];
            completedTasks = Array.isArray(data.completedTasks) ? data.completedTasks.slice() : [];
            dailyCompletedTasks = Array.isArray(data.dailyCompletedTasks) ? data.dailyCompletedTasks.slice() : [];
            window.completedTasks = completedTasks;
            window.dailyCompletedTasks = dailyCompletedTasks;
            try { updateTaskUI(); } catch (e) {}
        },
        reset: function() {
            window.activeTasks = [];
            completedTasks = [];
            dailyCompletedTasks = [];
            window.completedTasks = completedTasks;
            window.dailyCompletedTasks = dailyCompletedTasks;
        }
    });
}

// ============ v19.0 P0-3 批次 A：玩家职位真源化 + 工具函数 ============
//
// 所有 v19.0 工具函数读 window.discipleState（已与模块内变量双向同步），
// 而非直接读模块内 closure 变量。这样 StateRegistry.importAll 之后
// window.discipleState 的修改能被这些函数即时看到。

function getDs() {
    return window.discipleState || (typeof discipleState !== 'undefined' ? discipleState : null);
}

/**
 * 从 COMMON_RANKS 拿玩家当前职位定义。
 * @returns {Object|null} COMMON_RANKS 项；id=-1/-2/未在门等返回 null
 */
function getPlayerRank() {
    var ds = getDs();
    if (!ds || !ds.isInSect) return null;
    var ranks = window.COMMON_RANKS;
    if (!ranks) return null;
    var rankId = ds.rank;
    if (rankId === -1 || rankId === -2) return null; // 侍妾/同参弟子无职位
    for (var i = 0; i < ranks.length; i++) {
        if (ranks[i].id === rankId) return ranks[i];
    }
    return null;
}

/**
 * 玩家每日可接任务上限。
 * - 杂役弟子: 1; 记名/外门/内门: 2; 亲传: 1（教化任务为主）
 * - 长老/副掌门/掌门: 0（不接普通任务，做管理/外交）
 * - 同参弟子/侍妾: 0
 * @returns {number}
 */
function getPlayerDailyTaskLimit() {
    var rank = getPlayerRank();
    if (!rank) return 0;
    return rank.dailyTaskCount || 0;
}

/**
 * 玩家职位 authority 0-10。COMMON_RANKS 没显式 authority 字段，按 id 推导。
 */
function getPlayerRankAuthority() {
    var rank = getPlayerRank();
    if (!rank) return 0;
    // 优先读 rank.authority；fallback 推导
    if (Number(rank.authority) > 0) return Number(rank.authority);
    var table = { 0: 10, 1: 9, 2: 8, 3: 6, 4: 5, 5: 2, 6: 1, 7: 0 };
    return table[rank.id] != null ? table[rank.id] : 0;
}

/**
 * 玩家角色分类。
 */
function getPlayerSectRole() {
    var ds = getDs();
    if (!ds || !ds.isInSect) return null;
    var rankId = ds.rank;
    if (rankId === -1) return 'concubine';
    if (rankId === -2) return 'fellow';
    if (rankId === 0) return 'leader';
    if (rankId <= 2) return 'elder';
    return 'disciple';
}

/**
 * 藏经阁准入：tier=楼层。映射（按 id 数字越小职位越高）：
 *   id=0 掌门 → 4
 *   id=1 副掌门 → 4
 *   id=2 长老 → 4
 *   id=3 亲传弟子 → 3
 *   id=4 内门弟子 → 2
 *   id=5 外门弟子 → 1
 *   id=6 记名弟子 → 1
 *   id=7 杂役弟子 → 1
 * @param {number} tier 1-4
 * @returns {boolean}
 */
function canAccessScriptureTier(tier) {
    var rank = getPlayerRank();
    if (!rank) return false;
    var maxTier = 1;
    if (rank.id <= 2) maxTier = 4;       // 长老+ 顶层
    else if (rank.id === 3) maxTier = 3; // 亲传
    else if (rank.id === 4) maxTier = 2; // 内门
    else maxTier = 1;                    // 记名/外门/杂役
    return tier <= maxTier;
}

/**
 * 长老级（rankId <= 2）才能在议事投票中投票。
 */
function canVoteInSectMeeting() {
    var role = getPlayerSectRole();
    return role === 'elder' || role === 'leader';
}

/**
 * 掌门才能下达宗门外交/资源/政策决策。
 */
function canDecideSectPolicy() {
    return getPlayerSectRole() === 'leader';
}

/**
 * 玩家当前已接任务数（去重，跨日不算）。
 * activeTasks 元素为 { taskId, task, progress, acceptedGameMinute }，task 内可能有 minRank/sect；
 * 由于玩家是单宗门弟子，所有 activeTasks 都属于当前宗门，不再按 sectId 过滤。
 */
function getPlayerActiveTaskCount() {
    if (!window.activeTasks) return 0;
    return window.activeTasks.length;
}

window.getPlayerRank = getPlayerRank;
window.getPlayerDailyTaskLimit = getPlayerDailyTaskLimit;
window.getPlayerRankAuthority = getPlayerRankAuthority;
window.getPlayerSectRole = getPlayerSectRole;
window.canAccessScriptureTier = canAccessScriptureTier;
window.canVoteInSectMeeting = canVoteInSectMeeting;
window.canDecideSectPolicy = canDecideSectPolicy;
window.getPlayerActiveTaskCount = getPlayerActiveTaskCount;

// v19.0 批次 A1：discipleState 进入统一存档
// 全部从 window.discipleState 读写（与模块内变量通过 line 987 `window.discipleState = discipleState` 双向同步）
if (window.StateRegistry) {
    window.StateRegistry.register('discipleState', {
        version: 1,
        export: function() {
            var ds = getDs() || {};
            return {
                isInSect: !!ds.isInSect,
                sectId: ds.sectId || null,
                rank: ds.rank != null ? ds.rank : 7,
                rankName: ds.rankName || '外门弟子',
                contribution: Number(ds.contribution) || 0,
                points: Number(ds.points) || 0,
                level: Number(ds.level) || 1,
                tasksCompleted: Number(ds.tasksCompleted) || 0,
                joinTime: ds.joinTime || null,
                _gbFaction: ds._gbFaction || null,
                // F-6 修复：师徒/侍妾/藏经阁参悟/门派事件/任务日/发薪日等下划线字段
                // 之前未导出，存读档后师徒关系丢失可重拜、藏经阁参悟归零、侍妾变杂役、晋升按钮重出
                _masterId: ds._masterId || null,
                _masterName: ds._masterName || null,
                _masterSect: ds._masterSect || null,
                _masterBlessDay: ds._masterBlessDay || null,
                _leftMasters: ds._leftMasters ? JSON.parse(JSON.stringify(ds._leftMasters)) : {},
                _chushiDone: !!ds._chushiDone,
                artInsights: ds.artInsights ? JSON.parse(JSON.stringify(ds.artInsights)) : {},
                isConcubine: !!ds.isConcubine,
                concubineFavor: Number(ds.concubineFavor) || 0,
                _sectEventDay: ds._sectEventDay || null,
                _pendingSectEvent: ds._pendingSectEvent ? JSON.parse(JSON.stringify(ds._pendingSectEvent)) : null,
                _sectTaskDay: ds._sectTaskDay || null,
                _lastSalaryDay: ds._lastSalaryDay || null
            };
        },
        import: function(data) {
            if (!data || typeof data !== 'object') return;
            // 写到 window.discipleState（line 987 已建立 window↔module 双向同步）
            var ds = getDs();
            if (!ds) return;
            ds.isInSect = !!data.isInSect;
            ds.sectId = data.sectId || null;
            ds.rank = data.rank != null ? data.rank : 7;
            ds.rankName = data.rankName || '外门弟子';
            ds.contribution = Number(data.contribution) || 0;
            ds.points = Number(data.points) || 0;
            ds.level = Number(data.level) || 1;
            ds.tasksCompleted = Number(data.tasksCompleted) || 0;
            ds.joinTime = data.joinTime || null;
            ds._gbFaction = data._gbFaction || null;
            // F-6 修复：恢复师徒/侍妾/藏经阁/门派事件/任务日/发薪日
            ds._masterId = data._masterId || null;
            ds._masterName = data._masterName || null;
            ds._masterSect = data._masterSect || null;
            ds._masterBlessDay = data._masterBlessDay || null;
            ds._leftMasters = data._leftMasters ? JSON.parse(JSON.stringify(data._leftMasters)) : {};
            ds._chushiDone = !!data._chushiDone;
            ds.artInsights = data.artInsights ? JSON.parse(JSON.stringify(data.artInsights)) : {};
            ds.isConcubine = !!data.isConcubine;
            ds.concubineFavor = Number(data.concubineFavor) || 0;
            ds._sectEventDay = data._sectEventDay || null;
            ds._pendingSectEvent = data._pendingSectEvent ? JSON.parse(JSON.stringify(data._pendingSectEvent)) : null;
            ds._sectTaskDay = data._sectTaskDay || null;
            ds._lastSalaryDay = data._lastSalaryDay || null;
            try {
                if (typeof window.updateSectUI === 'function') window.updateSectUI();
            } catch (e) {}
        },
        reset: function() {
            var ds = getDs();
            if (!ds) return;
            ds.isInSect = false;
            ds.sectId = null;
            ds.rank = 7;
            ds.rankName = '外门弟子';
            ds.contribution = 0;
            ds.points = 0;
            ds.level = 1;
            ds.tasksCompleted = 0;
            ds.joinTime = null;
            ds._gbFaction = null;
            // F-6 修复：reset 也要清这些字段
            ds._masterId = null;
            ds._masterName = null;
            ds._masterSect = null;
            ds._masterBlessDay = null;
            ds._leftMasters = {};
            ds._chushiDone = false;
            ds.artInsights = {};
            ds.isConcubine = false;
            ds.concubineFavor = 0;
            ds._sectEventDay = null;
            ds._pendingSectEvent = null;
            ds._sectTaskDay = null;
            ds._lastSalaryDay = null;
        }
    });
}

// ============ v19.0 P0-3 批次 B：4 类特权生效 ============
//
// B2 长老专属任务（仅 rankId <= 2 可接 / 仅在 "宗门管理" 面板暴露）
// B3 宗门议事投票（长老及以上有投票权，掌门可开启投票）
// B4 掌门决策（仅 rankId === 0 可下达，对宗门资源/士气产生真实影响）
//
// 设计要点：
//   - 投票与决策状态存 window.__sectVotes（per-sect 数组），v19.1 入 StateRegistry
//   - 不引入"日限 N 次"型配额：投票是事件驱动的，决策是季度结算的
//   - 掌门决策需要长老过半数确认（单玩家+NPC 掌门情况下：把 NPC 长老按 §10.R4 折算为"在场"）

// 内部 store（v19.0 批次 D 升级：SECT_VOTES_STORE 改为 StateRegistry 'sectVotes' v1 持久化）
// SECT_POLICIES_STORE 保持 RAM（仅历史展示，无须持久化；旧档按空数组初始化）
var SECT_VOTES_STORE = {};
var SECT_POLICIES_STORE = {}; // { sectName: [{id, appliedAtDay, appliedByRank, effect}] }

// 投票内置模板（每周自动开 1 个）
var SECT_VOTE_TEMPLATES = [
    { id: 'invite_scatter', title: '是否接纳散修入门？', choices: ['接纳', '拒绝'], closesInDays: 7, effectOnPass: { choice: 0, type: 'recruit', delta: 3 } },
    { id: 'raise_salary', title: '是否提高弟子月俸？', choices: ['增加 10%', '保持现状'], closesInDays: 7, effectOnPass: { choice: 0, type: 'salary', delta: 0.1 } },
    { id: 'expand_market', title: '是否扩建坊市？', choices: ['扩建', '暂缓'], closesInDays: 7, effectOnPass: { choice: 0, type: 'resources', delta: -200 } },
    { id: 'ban_outside', title: '是否封山 30 日？', choices: ['封山', '照常'], closesInDays: 7, effectOnPass: { choice: 0, type: 'morale', delta: -10 } },
    { id: 'diplomacy', title: '是否与邻派结盟？', choices: ['结盟', '观望'], closesInDays: 7, effectOnPass: { choice: 0, type: 'allies', delta: 1 } }
];

// NPC 长老按"对开派的态度"自动投票：周天 stance.reform >= 0 → 倾向[0]；其他 → 倾向[1]
function getSectNpcStance(sectName) {
    if (!sectName) return null;
    var deep = window.SECT_DEEP_DATA && window.SECT_DEEP_DATA[sectName];
    if (!deep || !Array.isArray(deep.factions)) return null;
    // 取影响最大的派系
    var best = null;
    for (var i = 0; i < deep.factions.length; i++) {
        var f = deep.factions[i];
        if (!best || (f.influence || 0) > (best.influence || 0)) best = f;
    }
    return best && best.stance ? best.stance : null;
}

/**
 * v19.0 批次 D2：NPC 长老自动投票
 * - 获取 sect 内所有 rank=='长老' 的 NPC（getSectNPCs）
 * - 每个长老根据其派系 stance 决定倾向：
 *     stance.reform >= 0 → 投[0]（同意）
 *     stance.reform <  0 → 投[1]（反对/观望）
 * - 若该 sect 没有派系数据，所有 NPC 弃权
 * @returns {Object} { npcVotes: {npcId: choiceIdx}, npcCount: number, stanceUsed: {reform, expansion, orthodox} | null }
 */
function autoNpcVotes(sectName) {
    if (typeof window.getSectNPCs !== 'function') return { npcVotes: {}, npcCount: 0, stanceUsed: null };
    var npcs = window.getSectNPCs(sectName) || [];
    // 长老判定：id 以 'sect_elder_' 开头，或显式 title/rankName='长老'
    var elders = npcs.filter(function (n) {
        if (!n) return false;
        if (n.title === '长老' || n.rankName === '长老') return true;
        if (n.id && String(n.id).indexOf('sect_elder_') === 0) return true;
        return false;
    });
    var stance = getSectNpcStance(sectName);
    var npcVotes = {};
    var reform = stance ? Number(stance.reform) : 0;
    var defaultChoice = reform >= 0 ? 0 : 1;
    elders.forEach(function (n) {
        if (n && n.id != null) npcVotes[String(n.id)] = defaultChoice;
    });
    return { npcVotes: npcVotes, npcCount: elders.length, stanceUsed: stance };
}

// 4 类可用政策（掌门决策）
var SECT_LEADER_POLICIES = [
    { id: 'invite_disciple', name: '广招弟子', desc: '本季接纳更多散修入门（弟子数+3）', cost: { resources: 200 } },
    { id: 'upgrade_training', name: '修缮演武场', desc: '演武场训练效率+15%（持续 30 日）', cost: { resources: 500 } },
    { id: 'ally_sect', name: '结盟', desc: '与最近中立门派结盟（声望+10）', cost: { resources: 800, influence: 20 } },
    { id: 'expand_market', name: '扩建坊市', desc: '坊市库存+20%，价格-5%（持续 60 日）', cost: { resources: 600 } }
];

function sectNameOf() {
    var ds = getDs();
    return ds && ds.isInSect ? ds.sectId : null;
}

/**
 * B2：长老专属任务（教导新弟子 / 外交出访）— 仅 rankId <= 2 可接
 * @param {string} taskType 'teach' | 'diplomacy'
 * @returns {boolean} true=成功接取
 */
function acceptElderTask(taskType) {
    var role = getPlayerSectRole();
    if (role !== 'elder' && role !== 'leader') {
        if (window.showMessage) window.showMessage('此任务仅长老及以上可接', 'warning');
        return false;
    }
    var sectName = sectNameOf();
    if (!sectName) return false;
    var rewards, title, cost;
    if (taskType === 'teach') {
        title = '教导新弟子';
        rewards = { contribution: 80, exp: 60, spiritStones: 30 };
        cost = { energy: 25, minutes: 120 };
    } else if (taskType === 'diplomacy') {
        title = '外交出访';
        rewards = { contribution: 120, exp: 90, spiritStones: 50, fame: 5 };
        cost = { energy: 35, minutes: 240 };
    } else {
        return false;
    }
    // v20.53 长者事务有工夫：教导要真讲一上午，外交要真走一趟。
    // 之前无冷却无成本，150 连点就能白嫖到副掌门的贡献。
    // 先验后扣：精力、宗门资源都够才动账，不做"差事没成、力气先没了"的半截账。
    var cdChk = (typeof window.getCurrentCharData === 'function') ? window.getCurrentCharData() : window.currentCharData;
    var internal = window.SECT_INTERNAL && window.SECT_INTERNAL[sectName];
    if (!internal) return false;
    var resCost = taskType === 'diplomacy' ? 50 : 0;
    if (cdChk && (Number(cdChk.energy) || 0) < (Number(cost.energy) || 0)) {
        if (window.showMessage) window.showMessage('精力不足（需 ' + cost.energy + '），这趟差事今日做不动。', 'warning');
        return false;
    }
    if ((Number(internal.resources) || 0) < resCost) {
        if (window.showMessage) window.showMessage('宗门资源不足（需 ' + resCost + '）', 'error');
        return false;
    }
    if (cdChk) cdChk.energy = (Number(cdChk.energy) || 0) - (Number(cost.energy) || 0);
    internal.resources = Math.max(0, (Number(internal.resources) || 0) - resCost);
    var ds = getDs();
    if (ds) {
        ds.contribution = (Number(ds.contribution) || 0) + rewards.contribution;
        ds.tasksCompleted = (Number(ds.tasksCompleted) || 0) + 1;
    }
    if (rewards.spiritStones && window.inventory && window.inventory.currency) {
        window.inventory.currency.spiritStones = (Number(window.inventory.currency.spiritStones) || 0) + rewards.spiritStones;
        if (window.currentCharData) window.currentCharData.spiritStones = window.inventory.currency.spiritStones;
    }
    if (typeof window.addFame === 'function' && rewards.fame) {
        try { window.addFame(rewards.fame); } catch (eF) {}
    }
    if (typeof window.addExp === 'function' && rewards.exp) {
        try { window.addExp(rewards.exp); } catch (eE) {}
    }
    if (window.showMessage) {
        var msg = '👑 长者事务：' + title + '（贡献+' + rewards.contribution;
        if (rewards.spiritStones) msg += '、灵石+' + rewards.spiritStones;
        if (rewards.fame) msg += '、名气+' + rewards.fame;
        msg += '，耗时 ' + cost.minutes + ' 分钟、精力 -' + cost.energy + '）';
        window.showMessage(msg, 'success');
    }
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(cost.minutes, '长者事务·' + title);
    }
    if (typeof window.updateCharacterStatus === 'function') window.updateCharacterStatus();
    return true;
}

/**
 * v20.53 通用捐献：灵石入宗门公账，换贡献。
 * 全库此前唯一的灵石→贡献通道只对丐帮净衣派开放（还有期限额度），
 * 其余三十五门晋升只能靠做差事一点点攒。
 * 规矩写在账上：捐十文记五文功劳，另一半入公账——宗门库真变厚（门派大事防备、修葺都花它）。
 * @param {number} amount 捐赠灵石数
 */
function donateSectStones(amount) {
    var ds = getDs();
    if (!ds || !ds.isInSect) { if (window.showMessage) window.showMessage('你并未入宗，捐给谁去？', 'warning'); return false; }
    var sectName = sectNameOf();
    if (!sectName) { if (window.showMessage) window.showMessage('门名不清，账记不上去。', 'warning'); return false; }
    amount = Math.floor(Number(amount) || 0);
    if (amount <= 0) { if (window.showMessage) window.showMessage('请写明捐多少。', 'warning'); return false; }
    var inv = window.inventory;
    if (!inv || !inv.currency || (Number(inv.currency.spiritStones) || 0) < amount) {
        if (window.showMessage) window.showMessage('手头灵石不足（需 ' + amount + '）。', 'warning');
        return false;
    }
    if (!window.RewardService) { if (window.showMessage) window.showMessage('账房未开张，改日再来。', 'warning'); return false; }
    // 一笔交割：钱进公账，功劳记你名下（对半）
    var credit = Math.max(1, Math.floor(amount / 2));
    var res = window.RewardService.apply({ stones: -amount, contribution: credit }, { source: 'sect-donate:' + sectName });
    if (!res || res.success === false) {
        if (window.showMessage) window.showMessage('这笔捐赠没走成账：' + ((res && res.reason) || '账房摇头'), 'warning');
        return false;
    }
    // 公账真涨——门派大事的防备、修葺都从这里出
    var internal = window.SECT_INTERNAL && window.SECT_INTERNAL[sectName];
    var storeNote = '';
    if (internal && typeof internal.resources === 'number') {
        internal.resources = internal.resources + amount;
        storeNote = '，宗门库 +' + amount;
    }
    if (window.showMessage) {
        window.showMessage('🪙 你捐了 ' + amount + ' 灵石入' + sectName + '公账（记你功劳 +' + credit + storeNote + '）。管事长老记了你的名。', 'success');
    }
    if (typeof window.updateCharacterStatus === 'function') window.updateCharacterStatus();
    if (window.EventBus && typeof window.EventBus.emit === 'function') {
        try { window.EventBus.emit('sect:donation', { sect: sectName, amount: amount, contribution: credit }); } catch (eD) {}
    }
    return true;
}
window.donateSectStones = donateSectStones;

/**
 * B3：开启一次宗门议事投票（仅掌门 rank=0；长老可投票）
 * @param {string} title
 * @param {string[]} choices
 * @param {number} closesInDays 默认 7
 * @returns {Object|null} 新投票对象
 */
function openSectVote(title, choices, closesInDays, effectOnPass) {
    var role = getPlayerSectRole();
    if (role !== 'leader') {
        if (window.showMessage) window.showMessage('仅掌门可开启议事投票', 'warning');
        return null;
    }
    var sectName = sectNameOf();
    if (!sectName) return null;
    if (!Array.isArray(choices) || choices.length < 2) return null;
    if (!SECT_VOTES_STORE[sectName]) SECT_VOTES_STORE[sectName] = [];
    var today = (window.getAbsoluteDay && window.getAbsoluteDay()) || 1;
    // v19.0 批次 D 修正：Date.now() 在同 tick 可能相同，加 _voteSeq + random 保幂等
    if (typeof openSectVote._seq !== 'number') openSectVote._seq = 0;
    openSectVote._seq++;
    var vote = {
        id: 'vote_' + sectName + '_' + today + '_' + Date.now() + '_' + openSectVote._seq + '_' + Math.floor(Math.random() * 1e6),
        title: title || '宗门事务',
        choices: choices.slice(),
        votes: {}, // 玩家投的 choiceIndex
        openedAtDay: today,
        closesAtDay: today + Math.max(1, Number(closesInDays) || 7),
        status: 'open',
        openedBy: 'leader',
        effectOnPass: effectOnPass || null
    };
    SECT_VOTES_STORE[sectName].push(vote);
    if (window.showMessage) window.showMessage('🗳️ 议事投票开启：' + vote.title, 'info');
    if (window.EventBus && typeof window.EventBus.emit === 'function') {
        try { window.EventBus.emit('sect:vote:opened', vote); } catch (e) {}
    }
    return vote;
}

/**
 * B3：玩家投票（长老及以上有投票权；掌门也可投）
 * @param {string} voteId
 * @param {number} choiceIndex
 * @returns {boolean}
 */
function castVote(voteId, choiceIndex) {
    if (!window.canVoteInSectMeeting || !window.canVoteInSectMeeting()) {
        if (window.showMessage) window.showMessage('长老及以上方可投票', 'warning');
        return false;
    }
    var sectName = sectNameOf();
    if (!sectName || !SECT_VOTES_STORE[sectName]) return false;
    var vote = SECT_VOTES_STORE[sectName].find(function (v) { return v.id === voteId; });
    if (!vote || vote.status !== 'open') {
        if (window.showMessage) window.showMessage('投票已结束或不存在', 'warning');
        return false;
    }
    var today = (window.getAbsoluteDay && window.getAbsoluteDay()) || 1;
    if (today > vote.closesAtDay) {
        if (window.showMessage) window.showMessage('投票已过截止日', 'warning');
        return false;
    }
    var idx = Number(choiceIndex);
    if (idx < 0 || idx >= vote.choices.length) return false;
    vote.votes['player'] = idx;
    if (window.showMessage) window.showMessage('🗳️ 已投票：' + vote.choices[idx], 'success');
    if (window.EventBus && typeof window.EventBus.emit === 'function') {
        try { window.EventBus.emit('sect:vote:cast', { voteId: voteId, choice: idx }); } catch (e) {}
    }
    return true;
}

/**
 * B3：关闭投票（掌门 / 系统）。简单多数即通过。
 * @param {string} voteId
 * @returns {Object|null} { passed:boolean, winner:string, tallies:number[] }
 */
function closeSectVote(voteId) {
    var sectName = sectNameOf();
    if (!sectName || !SECT_VOTES_STORE[sectName]) return null;
    var vote = SECT_VOTES_STORE[sectName].find(function (v) { return v.id === voteId; });
    if (!vote || vote.status !== 'open') return null;
    vote.status = 'closed';

    // v19.0 批次 D2：NPC 长老按立场自动投票 + 玩家票合并计票
    var npcInfo = autoNpcVotes(sectName);
    var tallies = vote.choices.map(function () { return 0; });
    // 玩家票
    if (vote.votes['player'] != null) {
        var pIdx = Number(vote.votes['player']);
        if (pIdx >= 0 && pIdx < tallies.length) tallies[pIdx]++;
    }
    // NPC 长老票
    Object.keys(npcInfo.npcVotes).forEach(function (npcId) {
        var idx = Number(npcInfo.npcVotes[npcId]);
        if (idx >= 0 && idx < tallies.length) tallies[idx]++;
    });
    var winnerIdx = 0, max = -1;
    for (var i = 0; i < tallies.length; i++) {
        if (tallies[i] > max) { max = tallies[i]; winnerIdx = i; }
    }
    var passed = max > 0;
    var out = { passed: passed, winner: vote.choices[winnerIdx], winnerIdx: winnerIdx, tallies: tallies, npcCount: npcInfo.npcCount };
    if (window.showMessage) {
        var tallyStr = tallies.map(function (n, i) { return vote.choices[i] + ' ' + n; }).join(' / ');
        var msg = passed
            ? ('🗳️ 投票通过：' + vote.choices[winnerIdx] + '（' + tallyStr + '）')
            : ('🗳️ 投票未通过（' + tallyStr + '）');
        window.showMessage(msg, passed ? 'success' : 'info');
    }
    if (window.EventBus && typeof window.EventBus.emit === 'function') {
        try { window.EventBus.emit('sect:vote:closed', Object.assign({ voteId: voteId, sectName: sectName }, out)); } catch (e) {}
    }
    // v19.0 批次 D3：投票通过 → 真实影响 SECT_INTERNAL
    if (passed) {
        applyVoteEffectToSect(sectName, vote, winnerIdx);
    }
    return out;
}

/**
 * v19.0 批次 D3：投票通过 → 真实影响 SECT_INTERNAL
 * 根据 vote.effectOnPass 调整（type='recruit'/'salary'/'resources'/'morale'/'allies'）
 */
function applyVoteEffectToSect(sectName, vote, winnerIdx) {
    var eff = vote.effectOnPass;
    if (!eff || eff.choice !== winnerIdx) return;
    var internal = window.SECT_INTERNAL && window.SECT_INTERNAL[sectName];
    if (!internal) return;
    var t = eff.type;
    var d = Number(eff.delta) || 0;
    if (t === 'recruit') {
        internal.disciples = (Number(internal.disciples) || 0) + d;
    } else if (t === 'salary') {
        internal._salaryMul = (Number(internal._salaryMul) || 1) + d;
    } else if (t === 'resources') {
        internal.resources = Math.max(0, (Number(internal.resources) || 0) + d);
    } else if (t === 'morale') {
        internal.morale = Math.max(0, Math.min(100, (Number(internal.morale) || 50) + d));
    } else if (t === 'allies') {
        if (window.SectYearGoal && typeof window.SectYearGoal.addAlly === 'function') {
            try { window.SectYearGoal.addAlly(sectName); } catch (e) {}
        }
    }
    if (window.showMessage) {
        window.showMessage('🎯 投票效果已落地：' + t + (d > 0 ? ' +' : '') + d, 'info');
    }
}

/**
 * v19.0 批次 D4：每周（day % 7 == 0）自动开 1 个普通投票
 * 由 processAllSectDailyEconomy 末尾（newDay 钩子）调
 */
function tryAutoOpenWeeklyVote(sectName, day) {
    if (!sectName || !day || day % 7 !== 0) return null;
    if (!SECT_VOTES_STORE[sectName]) SECT_VOTES_STORE[sectName] = [];
    var openCount = SECT_VOTES_STORE[sectName].filter(function (v) { return v.status === 'open'; }).length;
    if (openCount > 0) return null;
    var tpl = SECT_VOTE_TEMPLATES[(day / 7) % SECT_VOTE_TEMPLATES.length];
    if (!tpl) return null;
    // 检查该模板本周是否已开过
    var alreadyThisWeek = SECT_VOTES_STORE[sectName].some(function (v) { return v.templateId === tpl.id && v.openedAtDay >= day - 7; });
    if (alreadyThisWeek) return null;
    if (typeof tryAutoOpenWeeklyVote._seq !== 'number') tryAutoOpenWeeklyVote._seq = 0;
    tryAutoOpenWeeklyVote._seq++;
    var vote = {
        id: 'auto_' + sectName + '_' + day + '_' + tpl.id + '_' + tryAutoOpenWeeklyVote._seq + '_' + Math.floor(Math.random() * 1e6),
        templateId: tpl.id,
        title: tpl.title,
        choices: tpl.choices.slice(),
        votes: {},
        openedAtDay: day,
        closesAtDay: day + tpl.closesInDays,
        status: 'open',
        openedBy: 'auto_weekly',
        effectOnPass: tpl.effectOnPass
    };
    SECT_VOTES_STORE[sectName].push(vote);
    if (window.showMessage) window.showMessage('🗳️ 每周议事：' + tpl.title, 'info');
    if (window.EventBus && typeof window.EventBus.emit === 'function') {
        try { window.EventBus.emit('sect:vote:opened', vote); } catch (e) {}
    }
    return vote;
}

/**
 * B4：掌门下达决策
 * @param {string} policyId
 * @returns {boolean}
 */
function applyLeaderPolicy(policyId) {
    if (!window.canDecideSectPolicy()) {
        if (window.showMessage) window.showMessage('仅掌门可下达决策', 'warning');
        return false;
    }
    var policy = SECT_LEADER_POLICIES.find(function (p) { return p.id === policyId; });
    if (!policy) {
        if (window.showMessage) window.showMessage('未知政策：' + policyId, 'error');
        return false;
    }
    var sectName = sectNameOf();
    if (!sectName) return false;
    var internal = window.SECT_INTERNAL && window.SECT_INTERNAL[sectName];
    if (!internal) return false;
    // 校验成本
    var cost = policy.cost || {};
    if (cost.resources && (Number(internal.resources) || 0) < cost.resources) {
        if (window.showMessage) window.showMessage('宗门资源不足（需 ' + cost.resources + '）', 'error');
        return false;
    }
    if (cost.influence && (Number(internal.influence) || 0) < cost.influence) {
        if (window.showMessage) window.showMessage('宗门影响力不足（需 ' + cost.influence + '）', 'error');
        return false;
    }
    // 扣成本
    if (cost.resources) internal.resources = Math.max(0, (Number(internal.resources) || 0) - cost.resources);
    if (cost.influence) internal.influence = Math.max(0, (Number(internal.influence) || 0) - cost.influence);
    // 应用政策效果
    if (policyId === 'invite_disciple') {
        internal.disciples = (Number(internal.disciples) || 0) + 3;
    } else if (policyId === 'ally_sect') {
        if (typeof window.changeFactionReputation === 'function') {
            try { window.changeFactionReputation('ally_sect', 10); } catch (e) {}
        }
    } else if (policyId === 'upgrade_training' || policyId === 'expand_market') {
        // 简易 buff：写入 policyBuffs 数组，由 processAllSectDailyEconomy 在到期日清理
        if (!internal.policyBuffs) internal.policyBuffs = [];
        internal.policyBuffs.push({
            id: policyId,
            name: policy.name,
            appliedAtDay: (window.getAbsoluteDay && window.getAbsoluteDay()) || 1,
            durationDays: policyId === 'upgrade_training' ? 30 : 60,
            effect: policyId === 'upgrade_training' ? 'cultivation+15%' : 'shopPrice-5%'
        });
    }
    // 记入策略历史
    if (!SECT_POLICIES_STORE[sectName]) SECT_POLICIES_STORE[sectName] = [];
    SECT_POLICIES_STORE[sectName].push({
        id: policyId,
        appliedAtDay: (window.getAbsoluteDay && window.getAbsoluteDay()) || 1,
        appliedByRank: 'leader'
    });
    if (window.showMessage) window.showMessage('👑 掌门决策：' + policy.name + ' 已下达', 'success');
    return true;
}

/**
 * UI：打开"宗门管理"面板（按职位动态显示可用操作）
 */
function openSectManagementUI() {
    var role = getPlayerSectRole();
    var sectName = sectNameOf();
    if (!role || !sectName) {
        if (window.showMessage) window.showMessage('尚未入宗', 'warning');
        return;
    }
    var html = '<div class="space-y-3">';
    html += '<h3 class="text-lg font-bold text-yellow-400">👑 ' + sectName + '·宗门管理</h3>';
    html += '<p class="text-sm text-gray-400">当前职位：<span class="text-yellow-300">' + (window.getPlayerRank() ? window.getPlayerRank().name : '—') + '</span></p>';
    html += '<hr class="border-gray-600">';
    if (role === 'elder' || role === 'leader') {
        html += '<p class="text-sm text-amber-300">👑 长者事务：</p>';
        html += '<button onclick="acceptElderTask(\'teach\'); this.closest(\'#xianxia-modal-overlay\')?.remove();" class="w-full text-left bg-amber-800 hover:bg-amber-700 p-2 rounded text-sm">📖 教导新弟子（贡献+80, 灵石+30）</button>';
        html += '<button onclick="acceptElderTask(\'diplomacy\'); this.closest(\'#xianxia-modal-overlay\')?.remove();" class="w-full text-left bg-amber-800 hover:bg-amber-700 p-2 rounded text-sm">🤝 外交出访（需宗门资源 50，贡献+120, 灵石+50, 名气+5）</button>';
        html += '<hr class="border-gray-600 mt-3">';
    }
    if (role === 'leader') {
        html += '<p class="text-sm text-red-300">👑 掌门决策：</p>';
        SECT_LEADER_POLICIES.forEach(function (p) {
            var costStr = '';
            if (p.cost.resources) costStr += '资源 ' + p.cost.resources;
            if (p.cost.influence) costStr += ' 影响 ' + p.cost.influence;
            html += '<button onclick="applyLeaderPolicy(\'' + p.id + '\'); this.closest(\'#xianxia-modal-overlay\')?.remove();" class="w-full text-left bg-red-800 hover:bg-red-700 p-2 rounded text-sm">⚔️ ' + p.name + '（' + (costStr || '无成本') + '）<br><span class="text-xs text-gray-400">' + p.desc + '</span></button>';
        });
        html += '<hr class="border-gray-600 mt-3">';
        html += '<p class="text-sm text-cyan-300">🗳️ 开启投票：</p>';
        html += '<button onclick="openSectVote(\'是否接纳散修\', [\'接纳\', \'拒绝\'], 7); this.closest(\'#xianxia-modal-overlay\')?.remove();" class="w-full text-left bg-cyan-800 hover:bg-cyan-700 p-2 rounded text-sm">是否接纳散修（7 日）</button>';
        html += '<button onclick="openSectVote(\'是否增加弟子月俸\', [\'增加 10%\', \'保持现状\'], 7); this.closest(\'#xianxia-modal-overlay\')?.remove();" class="w-full text-left bg-cyan-800 hover:bg-cyan-700 p-2 rounded text-sm">是否增加弟子月俸（7 日）</button>';
    }
    // 长老投票区
    var openVotes = (SECT_VOTES_STORE[sectName] || []).filter(function (v) { return v.status === 'open'; });
    if ((role === 'elder' || role === 'leader') && openVotes.length) {
        html += '<hr class="border-gray-600 mt-3">';
        html += '<p class="text-sm text-purple-300">🗳️ 进行中的投票：</p>';
        openVotes.forEach(function (v) {
            var today = (window.getAbsoluteDay && window.getAbsoluteDay()) || 1;
            var leftDays = v.closesAtDay - today;
            html += '<div class="bg-gray-800 border border-gray-600 rounded p-2 mb-2">';
            html += '<p class="font-bold text-white">' + v.title + '（剩 ' + leftDays + ' 日）</p>';
            v.choices.forEach(function (c, idx) {
                html += '<button onclick="castVote(\'' + v.id + '\', ' + idx + '); this.closest(\'#xianxia-modal-overlay\')?.remove();" class="w-full text-left bg-purple-800 hover:bg-purple-700 p-1 mt-1 rounded text-xs">投 ' + c + '</button>';
            });
            html += '<button onclick="closeSectVote(\'' + v.id + '\'); this.closest(\'#xianxia-modal-overlay\')?.remove();" class="w-full bg-gray-700 hover:bg-gray-600 p-1 mt-1 rounded text-xs">关闭并计票</button>';
            html += '</div>';
        });
    }
    html += '</div>';
    if (typeof window.showModal === 'function') {
        window.showModal(sectName + '·宗门管理', html);
    } else if (window.showMessage) {
        window.showMessage('宗门管理面板需 modal 支持', 'warning');
    }
}

window.acceptElderTask = acceptElderTask;
window.openSectVote = openSectVote;
window.castVote = castVote;
window.closeSectVote = closeSectVote;
window.applyLeaderPolicy = applyLeaderPolicy;
window.openSectManagementUI = openSectManagementUI;
window.SECT_LEADER_POLICIES = SECT_LEADER_POLICIES;
window.tryAutoOpenWeeklyVote = tryAutoOpenWeeklyVote;
window.autoNpcVotes = autoNpcVotes;

// v19.0 批次 D1：sectVotes 进入统一存档
if (window.StateRegistry) {
    window.StateRegistry.register('sectVotes', {
        version: 1,
        export: function() { return SECT_VOTES_STORE; },
        import: function(data) {
            SECT_VOTES_STORE = {};
            if (data && typeof data === 'object') {
                Object.keys(data).forEach(function (k) { SECT_VOTES_STORE[k] = data[k]; });
            }
        },
        reset: function() { SECT_VOTES_STORE = {}; }
    });
}

