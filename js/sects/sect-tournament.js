/**
 * sect-tournament.js — v19.1 P0-4：宗门大比与同门竞争
 *
 * 目的（v18.8 路线图 §5 P0-4 验收）：
 *   每季小比、每年大比，NPC 真实参赛，玩家按职位介入，胜负真实影响宗门。
 *
 * 设计宪法（强制规则.md）：
 *   - 单一真源：TournamentStore[sectName] = { lastSeason, lastYear, currentEvent, history }
 *   - StateRegistry 'sectTournaments' v1 持久化（旧档按"从未举办"初始化）
 *   - 不引入"日限 N 次"型配额：每季 1 次、每年 1 次由 day%90 / day%360 调度
 *   - 不复制战斗系统：复用 buildPlayerBattleEntity；NPC vs NPC 用简化同步模拟
 *
 * 加载顺序：第 6 层，在 sects-system.js / sect-year-goal.js 之后。
 */
(function (global) {
    'use strict';

    var VERSION = 1;

    // 真实单一真源
    var TournamentStore = {}; // { sectName: { lastSeason, lastYear, currentEvent, history } }

    // ============ 工具：NPC 战力估算 ============
    var REALM_RANK = { '炼气': 1, '筑基': 2, '金丹': 3, '元婴': 4, '化神': 5, '炼虚': 6, '合体': 7, '大乘': 8, '渡劫': 9 };
    function realmToRank(realm) {
        return REALM_RANK[realm] || 1;
    }
    function npcPower(npc) {
        if (!npc) return 1;
        var c = npc.combat || {};
        var realmRank = realmToRank(c.realm) * 10;
        var layer = Number(c.layer) || 1;
        var atk = Number(c.attack) || 0;
        var def = Number(c.defense) || 0;
        var hp = Number(c.health) || Number(c.maxHealth) || 100;
        return realmRank + layer + Math.floor((atk + def + hp / 20) / 10);
    }
    function getNpc(npcId) {
        if (!npcId || !global.npcManager) return null;
        try {
            return global.npcManager.getNPC(npcId) || null;
        } catch (e) { return null; }
    }

    // 玩家战力（弟子 + sect 亲传功法加成 + 玩家自身等级 +1 隐式加成）
    function playerPower() {
        var p = global.currentCharData;
        if (!p) return 1;
        var realm = p.realm || '炼气';
        var layer = Number(p.layer) || 1;
        var base = realmToRank(realm) * 10 + layer;
        // 玩家难度不应比 NPC 高：+1 隐式加成（路线图 §9 R1）
        return base + 1;
    }

    // ============ 真源读写 ============
    function getOrCreate(sectName) {
        if (!TournamentStore[sectName]) {
            TournamentStore[sectName] = {
                lastSeason: 0,
                lastYear: 0,
                currentEvent: null,
                history: []
            };
        }
        return TournamentStore[sectName];
    }

    function getDs() {
        var ds = global.discipleState;
        if (!ds || !ds.isInSect) return null;
        return ds;
    }

    /**
     * 开启大比（仅掌门）
     * @param {string} sectName
     * @param {string} tier 'season' | 'year'
     * @returns {Object|null} event
     */
    function openTournament(sectName, tier) {
        if (!sectName) return null;
        if (tier !== 'season' && tier !== 'year') return null;
        var role = global.getPlayerSectRole ? global.getPlayerSectRole() : null;
        if (role !== 'leader') {
            if (global.showMessage) global.showMessage('仅掌门可开启大比', 'warning');
            return null;
        }
        var st = getOrCreate(sectName);
        if (st.currentEvent && st.currentEvent.status !== 'finished') {
            if (global.showMessage) global.showMessage('已有进行中的赛事', 'warning');
            return null;
        }
        var today = (global.getAbsoluteDay && global.getAbsoluteDay()) || 1;
        // 周期检查：每年只能 1 次大比、每季只能 1 次小比
        // 仅在"已过 1 周期"时拒绝（避免同日重开）
        if (tier === 'season' && st.lastSeason && (today - st.lastSeason) < 90) {
            if (global.showMessage) global.showMessage('本季小比已开过（' + (today - st.lastSeason) + ' 日前）', 'info');
            return null;
        }
        if (tier === 'year' && st.lastYear && (today - st.lastYear) < 360) {
            if (global.showMessage) global.showMessage('本年大比已开过（' + (today - st.lastYear) + ' 日前）', 'info');
            return null;
        }
        var ev = {
            id: 't_' + sectName + '_' + tier + '_' + today + '_' + Date.now() + '_' + Math.floor(Math.random() * 1e6),
            tier: tier,
            sectName: sectName,
            openedDay: today,
            closesDay: today + 7,
            status: 'open', // open → running → finished
            contestants: [], // { id, name, type:'npc'|'player', power, seed }
            bracket: [],     // [{round, a, b, winnerId}]
            winnerId: null,
            results: []      // [{round, aId, bId, winnerId, type, damageA, damageB}]
        };
        st.currentEvent = ev;
        // 记录 openedDay（用于周期检查）
        if (tier === 'season') st.lastSeason = today;
        if (tier === 'year') st.lastYear = today;
        if (global.showMessage) {
            var label = tier === 'year' ? '大比' : '小比';
            global.showMessage('🏆 ' + sectName + ' 开启' + label + '（截止日 ' + ev.closesDay + '）', 'info');
        }
        if (global.EventBus && typeof global.EventBus.emit === 'function') {
            try { global.EventBus.emit('tournament:opened', { tournamentId: ev.id, sectName: sectName, tier: tier }); } catch (e) {}
        }
        return ev;
    }

    /**
     * NPC 报名
     */
    function joinTournament(tournamentId, npcId) {
        if (!tournamentId || !npcId) return false;
        // 找该 tournament 所属 sect
        var sectName = null;
        for (var k in TournamentStore) {
            if (TournamentStore[k].currentEvent && TournamentStore[k].currentEvent.id === tournamentId) {
                sectName = k;
                break;
            }
        }
        if (!sectName) return false;
        var st = TournamentStore[sectName];
        var ev = st.currentEvent;
        if (!ev || ev.status !== 'open') return false;
        // 已报
        if (ev.contestants.some(function (c) { return c.id === npcId; })) return false;
        var npc = getNpc(npcId);
        if (!npc) return false;
        // 校验在宗门内
        if (npc.location !== sectName) return false;
        ev.contestants.push({
            id: npcId,
            name: npc.name || npcId,
            type: 'npc',
            power: npcPower(npc),
            realm: (npc.combat && npc.combat.realm) || '炼气'
        });
        if (global.showMessage) global.showMessage('👤 报名：' + (npc.name || npcId), 'info');
        return true;
    }

    /**
     * 玩家报名（弟子及以上）
     */
    function playerParticipate(tournamentId) {
        if (!tournamentId) return false;
        var sectName = null;
        for (var k in TournamentStore) {
            if (TournamentStore[k].currentEvent && TournamentStore[k].currentEvent.id === tournamentId) {
                sectName = k;
                break;
            }
        }
        if (!sectName) return false;
        var role = global.getPlayerSectRole ? global.getPlayerSectRole() : null;
        if (role === 'concubine' || role === 'fellow' || role === null) {
            if (global.showMessage) global.showMessage('弟子及以上可参赛', 'warning');
            return false;
        }
        var st = TournamentStore[sectName];
        var ev = st.currentEvent;
        if (!ev || ev.status !== 'open') return false;
        if (ev.contestants.some(function (c) { return c.type === 'player'; })) {
            if (global.showMessage) global.showMessage('你已报名', 'info');
            return false;
        }
        ev.contestants.push({
            id: 'player',
            name: (global.currentCharData && global.currentCharData.name) || '你',
            type: 'player',
            power: playerPower(),
            realm: (global.currentCharData && global.currentCharData.realm) || '炼气'
        });
        if (global.showMessage) global.showMessage('🎯 你已报名 ' + (ev.tier === 'year' ? '大比' : '小比'), 'success');
        return true;
    }

    /**
     * 简易同步战斗模拟（NPC vs NPC / 玩家 vs NPC）
     * 真实战斗系统（Battle class）异步且有 UI，不适合大比一次性跑完。
     * 这里用 power + 随机扰动决胜负，记录过程。
     */
    function simulateBattle(a, b) {
        if (!a || !b) return null;
        var powerA = a.power + Math.random() * 0.3;
        var powerB = b.power + Math.random() * 0.3;
        // 真实：玩家难度 +1 隐式加成
        if (a.type === 'player') powerA += 1;
        if (b.type === 'player') powerB += 1;
        var winner = powerA >= powerB ? a : b;
        return { winner: winner, damageA: Math.floor(Math.random() * 50 + 50), damageB: Math.floor(Math.random() * 50 + 50) };
    }

    /**
     * 掌门下令开始比赛（单败淘汰）
     */
    function runTournament(tournamentId) {
        var sectName = null;
        for (var k in TournamentStore) {
            if (TournamentStore[k].currentEvent && TournamentStore[k].currentEvent.id === tournamentId) {
                sectName = k;
                break;
            }
        }
        if (!sectName) return null;
        var st = TournamentStore[sectName];
        var ev = st.currentEvent;
        if (!ev || ev.status !== 'open') return null;
        if (ev.contestants.length < 2) {
            if (global.showMessage) global.showMessage('参赛者不足 2 人', 'warning');
            ev.status = 'finished';
            st.currentEvent = null;
            return null;
        }
        ev.status = 'running';
        ev.bracket = [];
        ev.results = [];
        // 单败淘汰
        var pool = ev.contestants.slice();
        var round = 1;
        while (pool.length > 1) {
            var next = [];
            for (var i = 0; i < pool.length; i += 2) {
                if (i + 1 >= pool.length) {
                    // 轮空晋级
                    next.push(pool[i]);
                    continue;
                }
                var res = simulateBattle(pool[i], pool[i + 1]);
                if (!res) continue;
                ev.bracket.push({ round: round, a: pool[i].id, b: pool[i + 1].id, winnerId: res.winner.id });
                ev.results.push({ round: round, aId: pool[i].id, bId: pool[i + 1].id, winnerId: res.winner.id, damageA: res.damageA, damageB: res.damageB });
                next.push(res.winner);
            }
            pool = next;
            round++;
        }
        var champion = pool[0];
        ev.winnerId = champion.id;
        ev.status = 'finished';
        // 写入历史
        var year = (typeof global.getAbsoluteDay === 'function') ? Math.floor((global.getAbsoluteDay() - 1) / 360) + 1 : 1;
        var season = (typeof global.getAbsoluteDay === 'function') ? Math.floor(((global.getAbsoluteDay() - 1) % 360) / 90) + 1 : 1;
        st.history.push({
            tournamentId: ev.id,
            tier: ev.tier,
            year: year,
            season: season,
            winnerId: champion.id,
            winnerName: champion.name,
            totalRounds: round - 1,
            sectName: sectName,
            finishedDay: ev.closesDay,
            contestants: ev.contestants.length
        });
        // 真源 lastSeason / lastYear
        if (ev.tier === 'season') st.lastSeason = ev.closesDay;
        if (ev.tier === 'year') st.lastYear = ev.closesDay;
        st.currentEvent = null;
        // 宗门影响
        applyTournamentOutcome(sectName, ev, champion);
        if (global.showMessage) {
            var label2 = ev.tier === 'year' ? '大比' : '小比';
            global.showMessage('🏆 ' + label2 + '结束：' + champion.name + ' 夺冠！', 'success');
        }
        if (global.EventBus && typeof global.EventBus.emit === 'function') {
            try { global.EventBus.emit('tournament:finished', { tournamentId: ev.id, winnerId: champion.id, winnerName: champion.name, sectName: sectName, tier: ev.tier }); } catch (e) {}
        }
        return { winner: champion, totalRounds: round - 1 };
    }

    /**
     * 大比结果对宗门的影响
     *  - 弟子成长：所有参赛者 level +0~+1
     *  - 士气：+5（大比举行）+10（夺冠）+5（亚军）
     *  - 资源：奖励 50 灵石（v19.0 不直接改 currency，写到 SECT_INTERNAL.resources）
     *  - 调用 addTournamentWin 钩（v19.0）
     */
    function applyTournamentOutcome(sectName, ev, champion) {
        var internal = global.SECT_INTERNAL && global.SECT_INTERNAL[sectName];
        if (!internal) return;
        internal.morale = Math.min(100, (Number(internal.morale) || 50) + 5);
        if (champion) {
            internal.morale = Math.min(100, (Number(internal.morale) || 50) + 10);
            internal.resources = (Number(internal.resources) || 0) + 100;
            // 大比胜利钩（v19.0 SectYearGoal）
            if (global.SectYearGoal && typeof global.SectYearGoal.addTournamentWin === 'function') {
                try { global.SectYearGoal.addTournamentWin(sectName); } catch (e) {}
            }
        }
        // 弟子成长：每个参赛者 level +0~+1
        // 注：弟子 level 在 SECT_INTERNAL.disciples[] 不一定存在字段；这里只记到 SECT_INTERNAL._lastTournamentDay
        internal._lastTournamentDay = ev.closesDay;
    }

    function getTournamentStatus(tournamentId) {
        for (var k in TournamentStore) {
            if (TournamentStore[k].currentEvent && TournamentStore[k].currentEvent.id === tournamentId) {
                return TournamentStore[k].currentEvent;
            }
        }
        return null;
    }

    function getTournamentHistory(sectName) {
        var st = TournamentStore[sectName];
        return st ? (st.history || []).slice() : [];
    }

    // ============ v19.2 收尾：跨门派赌注（轻量版）============
    var WAGER_STORE = {}; // { wagerId: { sectName, opponent, amount, result, finishedDay } }
    var WAGER_HISTORY = []; // [{wagerId, sectName, opponent, amount, result, finishedDay}]

    /**
     * 掌门下注：押本门在下次大比胜出（轻量版，不与 v19.1 大比真打挂钩；只结算 v19.3 完整战报）
     * @param {string} opponentSectName 对手宗门
     * @param {number} amount 下注灵石
     * @returns {Object|null} wager 记录
     */
    function crossSectWager(opponentSectName, amount) {
        if (typeof global.getPlayerSectRole === 'function' && global.getPlayerSectRole() !== 'leader') {
            if (global.showMessage) global.showMessage('仅掌门可下注', 'warning');
            return null;
        }
        var mySect = sectNameOf();
        if (!mySect) return null;
        if (!opponentSectName || opponentSectName === mySect) {
            if (global.showMessage) global.showMessage('需指定对方宗门', 'warning');
            return null;
        }
        amount = Number(amount) || 0;
        if (amount < 0) return null;
        // 简化：50% 概率赢（v19.3 用真实战报代替）
        if (Math.random() < 0.5) {
            if (global.inventory && global.inventory.currency) {
                global.inventory.currency.spiritStones = (Number(global.inventory.currency.spiritStones) || 0) + amount;
            }
            var winId = 'w_' + mySect + '_' + Date.now();
            var winRecord = { wagerId: winId, sectName: mySect, opponent: opponentSectName, amount: amount, result: 'win', finishedDay: global.getAbsoluteDay ? global.getAbsoluteDay() : 1 };
            WAGER_HISTORY.unshift(winRecord);
            if (WAGER_HISTORY.length > 30) WAGER_HISTORY.length = 30;
            if (global.showMessage) global.showMessage('🎰 赌赢！灵石 +' + amount, 'success');
            return winRecord;
        } else {
            if (global.inventory && global.inventory.currency) {
                global.inventory.currency.spiritStones = Math.max(0, (Number(global.inventory.currency.spiritStones) || 0) - amount);
            }
            var loseId = 'w_' + mySect + '_' + Date.now();
            var loseRecord = { wagerId: loseId, sectName: mySect, opponent: opponentSectName, amount: amount, result: 'lose', finishedDay: global.getAbsoluteDay ? global.getAbsoluteDay() : 1 };
            WAGER_HISTORY.unshift(loseRecord);
            if (WAGER_HISTORY.length > 30) WAGER_HISTORY.length = 30;
            if (global.showMessage) global.showMessage('🎰 赌输 -' + amount + ' 灵石', 'warning');
            return loseRecord;
        }
    }

    function getWagerHistory() {
        return WAGER_HISTORY.slice();
    }

    /**
     * 周期 tick（接 processAllSectDailyEconomy 末尾）
     * - day%90==0 且 lastSeason != day：自动开小比
     * - day%360==0 且 lastYear != day：自动开大比
     * - 若 currentEvent 过期（closesDay 已过且 status!='finished'）：自动关闭
     */
    function tickDay(sectName, day) {
        if (!sectName || !day) return;
        var st = getOrCreate(sectName);
        var today = day;
        // 关闭过期赛事
        if (st.currentEvent && st.currentEvent.status !== 'finished' && today > st.currentEvent.closesDay) {
            if (st.currentEvent.contestants.length >= 2) {
                runTournament(st.currentEvent.id);
            } else {
                st.currentEvent = null; // 取消
            }
        }
        // 触发新赛事：仅当今天无 currentEvent
        if (!st.currentEvent) {
            // 大比（更稀有）优先触发
            if (today % 360 === 0 && (st.lastYear === 0 || st.lastYear < today - 359)) {
                var role2 = global.getPlayerSectRole ? global.getPlayerSectRole() : null;
                if (role2 === 'leader') {
                    var ev2 = openTournament(sectName, 'year');
                    if (ev2) autoEnrollNpcs(sectName, ev2.id);
                }
            }
            // 小比（每季）次之
            if (!st.currentEvent && today % 90 === 0 && (st.lastSeason === 0 || st.lastSeason < today - 89)) {
                var role = global.getPlayerSectRole ? global.getPlayerSectRole() : null;
                if (role === 'leader') {
                    var ev1 = openTournament(sectName, 'season');
                    if (ev1) autoEnrollNpcs(sectName, ev1.id);
                }
            }
        }
    }

    function autoEnrollNpcs(sectName, tournamentId) {
        if (typeof global.getSectNPCs !== 'function') return;
        var npcs = global.getSectNPCs(sectName) || [];
        // 仅亲传及以上（id 含 sect_disciple_ 也算——大比放开给所有弟子）
        var eligible = npcs.filter(function (n) { return n && n.id; });
        // 随机最多 8 人
        eligible.sort(function () { return Math.random() - 0.5; });
        for (var i = 0; i < Math.min(8, eligible.length); i++) {
            try { joinTournament(tournamentId, eligible[i].id); } catch (e) {}
        }
    }

    /**
     * UI 渲染：当前/历史
     */
    function renderTournamentPanel(sectName) {
        if (!sectName) return '';
        var st = TournamentStore[sectName] || { history: [], lastSeason: 0, lastYear: 0, currentEvent: null };
        var role = global.getPlayerSectRole ? global.getPlayerSectRole() : null;
        var html = '<div class="space-y-3">';
        html += '<h3 class="text-lg font-bold text-yellow-400">🏆 ' + sectName + '·宗门大比</h3>';
        // 当前
        if (st.currentEvent) {
            var ev = st.currentEvent;
            html += '<div class="bg-amber-900/30 border border-amber-600 rounded p-3">';
            html += '<p class="text-amber-200 font-bold">当前赛事：' + (ev.tier === 'year' ? '大比' : '小比') + '</p>';
            html += '<p class="text-xs text-gray-400">状态：' + ev.status + ' · 截止日 ' + ev.closesDay + '</p>';
            html += '<p class="text-xs text-gray-400">参赛者：' + ev.contestants.length + ' 人</p>';
            // 参赛按钮
            if (ev.status === 'open') {
                if (role !== 'concubine' && role !== 'fellow' && role !== null) {
                    var already = ev.contestants.some(function (c) { return c.type === 'player'; });
                    if (!already) {
                        html += '<button onclick="playerParticipate(\'' + ev.id + '\'); this.closest(\'#xianxia-modal-overlay\')?.remove();" class="w-full bg-amber-700 hover:bg-amber-600 p-2 rounded text-sm mt-2">🎯 我要参赛</button>';
                    } else {
                        html += '<p class="text-xs text-green-400 mt-2">✓ 你已报名</p>';
                    }
                }
                if (role === 'leader') {
                    html += '<button onclick="runTournament(\'' + ev.id + '\'); this.closest(\'#xianxia-modal-overlay\')?.remove();" class="w-full bg-red-700 hover:bg-red-600 p-2 rounded text-sm mt-2">⚔️ 掌门下令开始</button>';
                }
            }
            html += '</div>';
        } else {
            html += '<p class="text-gray-500 text-sm">当前无赛事。' + (role === 'leader' ? '（每 90 日自动开小比，每 360 日自动开大比）' : '') + '</p>';
        }
        // 历史
        if (st.history.length) {
            html += '<div class="mt-3"><h4 class="text-sm font-bold text-gray-300">📜 历史</h4>';
            for (var i = Math.max(0, st.history.length - 5); i < st.history.length; i++) {
                var h = st.history[i];
                html += '<p class="text-xs text-gray-400">第 ' + h.year + ' 年·' + (h.tier === 'year' ? '大比' : '小比') + '：<span class="text-yellow-300">' + h.winnerName + '</span> 夺冠（' + h.contestants + ' 人参赛，' + h.totalRounds + ' 轮）</p>';
            }
            html += '</div>';
        }
        html += '</div>';
        return html;
    }

    /**
     * 模态包装
     */
    function showTournamentPanel(sectName) {
        var html = renderTournamentPanel(sectName);
        if (typeof global.showModal === 'function') {
            global.showModal('宗门大比', html);
        } else if (global.showMessage) {
            global.showMessage('showModal 未就绪', 'warning');
        }
    }

    // ============ 公开 API ============
    var api = {
        version: VERSION,
        openTournament: openTournament,
        joinTournament: joinTournament,
        playerParticipate: playerParticipate,
        runTournament: runTournament,
        getTournamentStatus: getTournamentStatus,
        getTournamentHistory: getTournamentHistory,
        renderTournamentPanel: renderTournamentPanel,
        showTournamentPanel: showTournamentPanel,
        tickDay: tickDay,
        // v19.2 收尾：跨门派赌注（轻量版，留 v19.3 做完整战报）
        crossSectWager: crossSectWager,
        getWagerHistory: getWagerHistory,
        // 内部访问
        _store: function () { return TournamentStore; }
    };

    global.Tournament = api;
    global.XianXia = global.XianXia || {};
    global.XianXia.Tournament = api;

    // ============ StateRegistry 持久化 ============
    if (global.StateRegistry && typeof global.StateRegistry.register === 'function') {
        global.StateRegistry.register('sectTournaments', {
            version: VERSION,
            export: function () { return TournamentStore; },
            import: function (data) {
                TournamentStore = {};
                if (data && typeof data === 'object') {
                    Object.keys(data).forEach(function (k) { TournamentStore[k] = data[k]; });
                }
            },
            reset: function () { TournamentStore = {}; }
        });
    }

    console.log('[Tournament] initialized v' + VERSION);
})(typeof window !== 'undefined' ? window : this);
