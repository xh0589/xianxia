/**
 * sect-year-goal.js — v19.0 P0-3 批次 C：年度宗门目标 5 选 1
 *
 * 目的（v18.8 路线图 §5 P0-3 验收 4）：
 *   玩家入宗时 5 选 1 选择本年年目标；日结推进进度；年末结算发奖。
 *
 * 设计宪法（强制规则.md）：
 *   - 单一真源：SECT_YEAR_GOAL_STORE[sectName] = { year, goalId, baseValue, startedDay, currentValue, history }
 *   - 入 StateRegistry 'sectYearGoal' v1（旧档按当前 SECT_INTERNAL 状态自动初始化）
 *   - 不引入"日限 N 次"型配额：年度目标本身是周期事件
 *   - 年末结算放到"新年的第 1 天"（day % 360 == 1 且 day > 1）由 processAllSectDailyEconomy 钩入触发
 *
 * 加载顺序：第 6 层，在 sects-system.js 之后。
 */
(function (global) {
    'use strict';

    var VERSION = 1;

    // ============ 5 个年目标（路线图 §5 P0-3 验收 4）============
    var SECT_YEAR_GOALS = [
        {
            id: 'expand_territory',
            name: '开疆拓土',
            icon: '🗺️',
            desc: '本年门派影响力 +200',
            metric: 'influence',
            target: 200,
            reward: { spiritStones: 5000, fame: 30, buff: { id: 'expansion', days: 30 } }
        },
        {
            id: 'cultivate_disciples',
            name: '育才',
            icon: '🎓',
            desc: '本年弟子数 +30',
            metric: 'disciples',
            target: 30,
            reward: { spiritStones: 3000, contribution: 100 }
        },
        {
            id: 'resource_boom',
            name: '积谷',
            icon: '💰',
            desc: '本年宗门资源累计净增 +5000',
            metric: 'resourceGain',
            target: 5000,
            reward: { spiritStones: 2000, sectBuff: 'harvest_30' }
        },
        {
            id: 'grand_tournament',
            name: '大比称雄',
            icon: '🏆',
            desc: '本年完成至少 1 次宗门大比（玩家/长老代表门派）',
            metric: 'tournamentWins',
            target: 1,
            reward: { spiritStones: 4000, sectBuff: 'training_15' }
        },
        {
            id: 'allied_sects',
            name: '外交结盟',
            icon: '🤝',
            desc: '本年结盟宗门数 +3',
            metric: 'allies',
            target: 3,
            reward: { spiritStones: 3000, sectBuff: 'reputation_20' }
        }
    ];

    // 真源：SECT_YEAR_GOAL_STORE[sectName] = { year, goalId, baseValue, startedDay, currentValue, history: [{year, goalId, completed, rewardGiven}] }
    var STORE = {}; // { sectName: state }

    function getGoal(id) {
        for (var i = 0; i < SECT_YEAR_GOALS.length; i++) {
            if (SECT_YEAR_GOALS[i].id === id) return SECT_YEAR_GOALS[i];
        }
        return null;
    }

    function getCurrentYear() {
        var day = (typeof global.getAbsoluteDay === 'function') ? global.getAbsoluteDay() : 1;
        return 1 + Math.floor((day - 1) / 360);
    }

    // v19.0 批次 C 修正：用传入的 day 而非 getAbsoluteDay
    function yearOfDay(d) {
        return 1 + Math.floor((d - 1) / 360);
    }

    function getOrCreateState(sectName) {
        if (!STORE[sectName]) {
            STORE[sectName] = {
                year: 0, // 0 = 未选
                goalId: null,
                baseValue: 0,
                startedDay: 0,
                currentValue: 0,
                history: []
            };
        }
        return STORE[sectName];
    }

    function getInternal(sectName) {
        return global.SECT_INTERNAL && global.SECT_INTERNAL[sectName];
    }

    /**
     * 读取当前进度值（按 metric 字段）。
     */
    function readMetric(sectName, metric) {
        var internal = getInternal(sectName);
        if (!internal) return 0;
        if (metric === 'influence') return Number(internal.influence) || 0;
        if (metric === 'disciples') return Number(internal.disciples) || 0;
        if (metric === 'resourceGain') {
            var st = STORE[sectName];
            return Math.max(0, (Number(internal.resources) || 0) - (st ? st.startResources : 0));
        }
        if (metric === 'tournamentWins') {
            return (STORE[sectName] && STORE[sectName].tournamentWins) || 0;
        }
        if (metric === 'allies') {
            // 简化：取 sect ally 字段（不一定存在），fallback 0
            return (STORE[sectName] && STORE[sectName].allies) || 0;
        }
        return 0;
    }

    /**
     * 玩家入宗时调用：弹出 5 选 1 选择。若已选过本年，不重复弹。
     * @param {string} sectName
     * @returns {boolean} true=本年是首次选择
     */
    function promptChooseYearGoal(sectName) {
        if (!sectName) return false;
        // BUG 修复：年度宗门目标只有掌门(rank 0)/副掌门(rank 1)能设置；普通弟子静默跳过，不弹提示
        var ds = global.discipleState || {};
        var isLeader = (ds.rank === 0 || ds.rank === 1);
        if (!isLeader) return false;
        var st = getOrCreateState(sectName);
        var curYear = yearOfDay((typeof global.getAbsoluteDay === 'function') ? global.getAbsoluteDay() : 1);
        if (st.year === curYear && st.goalId) return false; // 已有
        // 若跨年，先结算旧年（应该已被 tickDay 结算了；保险再算一次）
        if (st.year > 0 && st.year < curYear) {
            try { settleYear(sectName, st.year); } catch (e) {}
            // 重新初始化
            STORE[sectName] = {
                year: curYear,
                goalId: null,
                baseValue: 0,
                startedDay: (typeof global.getAbsoluteDay === 'function') ? global.getAbsoluteDay() : 1,
                currentValue: 0,
                history: st.history || []
            };
            st = STORE[sectName];
        }
        // 弹模态
        var html = '<div class="space-y-2"><p class="text-sm text-gray-300">为 <span class="text-yellow-400">' + sectName + '</span> 选一个本年目标（5 选 1）。</p>';
        SECT_YEAR_GOALS.forEach(function (g) {
            var rewardStr = '';
            if (g.reward.spiritStones) rewardStr += '灵石 ' + g.reward.spiritStones + ' ';
            if (g.reward.contribution) rewardStr += '贡献 ' + g.reward.contribution + ' ';
            if (g.reward.fame) rewardStr += '名气 ' + g.reward.fame + ' ';
            html += '<button onclick="SectYearGoal.choose(\'' + g.id + '\'); this.closest(\'#xianxia-modal-overlay\')?.remove();" class="w-full text-left bg-yellow-800 hover:bg-yellow-700 p-2 rounded text-sm">' +
                '<span class="text-yellow-200 font-bold">' + g.icon + ' ' + g.name + '</span><br>' +
                '<span class="text-xs text-gray-400">' + g.desc + '</span><br>' +
                '<span class="text-xs text-green-400">完成奖励：' + (rewardStr || '（无）') + '</span></button>';
        });
        html += '</div>';
        if (typeof global.showModal === 'function') {
            global.showModal('年度宗门目标', html);
        } else if (global.showMessage) {
            global.showMessage('showModal 未就绪，请用浏览器打开', 'warning');
        }
        return true;
    }

    /**
     * 选择一个年目标。
     */
    function choose(goalId) {
        var goal = getGoal(goalId);
        if (!goal) return false;
        // BUG 修复：仅掌门/副掌门可定年度目标（与 promptChooseYearGoal 一致，防绕过）
        var ds0 = global.discipleState || {};
        if (!(ds0.rank === 0 || ds0.rank === 1)) {
            if (global.showMessage) global.showMessage('仅掌门或副掌门可定年度宗门目标。', 'warning');
            return false;
        }
        var sectName = null;
        if (global.discipleState && global.discipleState.isInSect) {
            sectName = global.discipleState.sectId;
        }
        if (!sectName) {
            if (global.showMessage) global.showMessage('尚未入宗', 'warning');
            return false;
        }
        var st = getOrCreateState(sectName);
        var today = (typeof global.getAbsoluteDay === 'function') ? global.getAbsoluteDay() : 1;
        var curYear = yearOfDay(today);
        st.year = curYear;
        st.goalId = goalId;
        st.startedDay = today;
        st.baseValue = readMetric(sectName, goal.metric);
        st.currentValue = st.baseValue;
        // resourceGain 起点
        if (goal.metric === 'resourceGain') {
            st.startResources = (getInternal(sectName) && Number(getInternal(sectName).resources)) || 0;
        }
        if (global.showMessage) global.showMessage('📜 本年宗门目标已定为：' + goal.icon + ' ' + goal.name, 'success');
        if (global.EventBus && typeof global.EventBus.emit === 'function') {
            try { global.EventBus.emit('sect:goal:progress', { sectName: sectName, goalId: goalId, current: st.currentValue, target: goal.target }); } catch (e) {}
        }
        return true;
    }

    /**
     * 日结推进（由 processAllSectDailyEconomy 末尾调）。
     * 同时检查"是否跨年" → 结算旧年 + 通知选新年。
     */
    function tickDay(sectName, day) {
        if (!sectName) return;
        var st = getOrCreateState(sectName);
        var curYear = yearOfDay(day);
        // 跨年检测：若 year < curYear 且 year > 0，结算旧年
        if (st.year > 0 && st.year < curYear) {
            settleYear(sectName, st.year);
            // 初始化新年（玩家需重新选）
            STORE[sectName] = {
                year: curYear,
                goalId: null,
                baseValue: 0,
                startedDay: day,
                currentValue: 0,
                history: st.history || []
            };
            st = STORE[sectName];
            // 通知玩家选年目标（前端可订阅）
            if (global.EventBus && typeof global.EventBus.emit === 'function') {
                try { global.EventBus.emit('sect:goal:newYear', { sectName: sectName, year: curYear }); } catch (e) {}
            }
            if (global.showMessage) global.showMessage('🌸 新年已至（' + curYear + '年）——宗门需定下本年目标', 'info');
        }
        if (!st.goalId) return; // 未选目标，无进度
        var goal = getGoal(st.goalId);
        if (!goal) return;
        st.currentValue = readMetric(sectName, goal.metric);
        // 发出进度事件
        if (global.EventBus && typeof global.EventBus.emit === 'function') {
            try { global.EventBus.emit('sect:goal:progress', { sectName: sectName, goalId: st.goalId, current: st.currentValue, target: goal.target }); } catch (e) {}
        }
    }

    /**
     * 年末结算（奖励 + 写入历史）。
     * @returns {Object|null} { completed, reward }
     */
    function settleYear(sectName, year) {
        var st = STORE[sectName];
        if (!st || !st.goalId) return null;
        var goal = getGoal(st.goalId);
        if (!goal) return null;
        st.currentValue = readMetric(sectName, goal.metric);
        var completed = st.currentValue >= goal.target;
        var reward = null;
        if (completed) {
            reward = goal.reward || {};
            // 发奖
            if (reward.spiritStones && global.inventory && global.inventory.currency) {
                global.inventory.currency.spiritStones = (Number(global.inventory.currency.spiritStones) || 0) + reward.spiritStones;
                if (global.currentCharData) global.currentCharData.spiritStones = global.inventory.currency.spiritStones;
            }
            if (reward.contribution && global.discipleState) {
                global.discipleState.contribution = (Number(global.discipleState.contribution) || 0) + reward.contribution;
            }
            if (reward.fame) {
                if (typeof global.addFame === 'function') {
                    try { global.addFame(reward.fame); } catch (e) {}
                }
            }
            if (reward.sectBuff) {
                // 写入宗门 buff（简化版：直接 push 到 SECT_INTERNAL.policyBuffs）
                var internal = getInternal(sectName);
                if (internal) {
                    if (!internal.policyBuffs) internal.policyBuffs = [];
                    internal.policyBuffs.push({
                        id: 'yearGoal_' + reward.sectBuff,
                        name: '年目标奖励：' + goal.name,
                        appliedAtDay: (typeof global.getAbsoluteDay === 'function') ? global.getAbsoluteDay() : 1,
                        durationDays: 30,
                        effect: reward.sectBuff
                    });
                }
            }
        }
        st.history.push({ year: year, goalId: st.goalId, completed: completed, reward: reward });
        if (global.showMessage) {
            var msg = completed
                ? ('🎉 ' + year + '年宗门目标达成：' + goal.name + '！奖励已发')
                : ('📋 ' + year + '年宗门目标未达成：' + goal.name + '（当前 ' + st.currentValue + '/' + goal.target + '）');
            global.showMessage(msg, completed ? 'success' : 'info');
        }
        if (global.EventBus && typeof global.EventBus.emit === 'function') {
            try { global.EventBus.emit('sect:goal:settle', { sectName: sectName, year: year, completed: completed, reward: reward }); } catch (e) {}
        }
        return { completed: completed, reward: reward };
    }

    /**
     * UI：渲染当前年目标进度卡。
     * @param {string} sectName
     * @returns {string} HTML
     */
    function renderProgressCard(sectName) {
        if (!sectName) return '';
        var st = STORE[sectName];
        if (!st || !st.goalId) {
            return '<div class="bg-gray-700/30 border border-gray-600 rounded p-3 mb-3">' +
                '<p class="text-xs text-gray-400">📜 年度目标：未选定</p></div>';
        }
        var goal = getGoal(st.goalId);
        if (!goal) return '';
        var pct = Math.min(100, Math.floor((st.currentValue / goal.target) * 100));
        return '<div class="bg-amber-900/30 border border-amber-600 rounded p-3 mb-3">' +
            '<p class="text-sm text-amber-200 font-bold mb-1">📜 本年目标：' + goal.icon + ' ' + goal.name + '</p>' +
            '<p class="text-xs text-gray-400 mb-2">' + goal.desc + '</p>' +
            '<div class="w-full bg-gray-700 rounded h-3 overflow-hidden">' +
                '<div class="bg-amber-500 h-full" style="width:' + pct + '%"></div>' +
            '</div>' +
            '<p class="text-xs text-gray-400 mt-1">' + st.currentValue + ' / ' + goal.target + '（' + pct + '%）</p>' +
            '<p class="text-xs text-green-400 mt-1">完成奖励：' + JSON.stringify(goal.reward).substring(0, 60) + '</p>' +
            '</div>';
    }

    /**
     * 读取某 sect 的当前目标进度（0-1）。
     */
    function getProgress(sectName) {
        var st = STORE[sectName];
        if (!st || !st.goalId) return 0;
        var goal = getGoal(st.goalId);
        if (!goal) return 0;
        return Math.min(1, st.currentValue / goal.target);
    }

    // 外部登记 NPC 任务完成数（用于 grand_tournament 目标）
    function addTournamentWin(sectName) {
        var st = getOrCreateState(sectName);
        st.tournamentWins = (st.tournamentWins || 0) + 1;
    }
    function addAlly(sectName) {
        var st = getOrCreateState(sectName);
        st.allies = (st.allies || 0) + 1;
    }

    // ============ 公开 API ============
    var api = {
        version: VERSION,
        SECT_YEAR_GOALS: SECT_YEAR_GOALS,
        promptChooseYearGoal: promptChooseYearGoal,
        choose: choose,
        tickDay: tickDay,
        settleYear: settleYear,
        renderProgressCard: renderProgressCard,
        getProgress: getProgress,
        addTournamentWin: addTournamentWin,
        addAlly: addAlly,
        // 内部访问
        _getStore: function () { return STORE; }
    };

    global.SectYearGoal = api;
    global.XianXia = global.XianXia || {};
    global.XianXia.SectYearGoal = api;

    // ============ StateRegistry 持久化 ============
    if (global.StateRegistry && typeof global.StateRegistry.register === 'function') {
        global.StateRegistry.register('sectYearGoal', {
            version: VERSION,
            export: function() { return STORE; },
            import: function(data) {
                STORE = {};
                if (data && typeof data === 'object') {
                    Object.keys(data).forEach(function (k) { STORE[k] = data[k]; });
                }
            },
            reset: function() { STORE = {}; }
        });
    }

    // ============ init ============
    // 玩家入宗时自动弹年目标（延迟到 sect-join flow 调用 promptChooseYearGoal）
    console.log('[SectYearGoal] initialized v' + VERSION);
})(typeof window !== 'undefined' ? window : this);
