// ==================== jianghu-rank.js - v25.6 江湖望风榜（第一百四十八批 · 玩家心愿批） ====================
// 用户口径：「天骄可以有江湖中的口头排名，但不能有俸禄和离谱的榜单」。
// 所以这不是一张系统真榜——是茶馆酒肆口口相传的口头账：
//   · 排名由说书人按「看得见的场面」估：境界、名气、杀戮、演武战绩、榜上胜负；
//   · 风声会失真：恶名越重传得越邪乎（高估），闷声修行的人常被看低（低估）；
//   · 上榜没有一文俸禄，只有名声带来的麻烦与机会——排名靠前会有天骄不服、登门挑战；
//   · 名次现算不落档（每次打开重排），只记榜上胜负与历史最佳名次（StateRegistry 正门）。
// 挑战形态照抄宿敌寻仇链（rivalry-chain.js）：onNewDaySubscribe → 门槛骰 → setTimeout 落杀气 →
// startBattle(enemyData) 挂 _isRankDuel 标记 → app.js onEnd 分支调 settleRankDuel。

(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    // 说书人口中的常客（江湖名人池：名号 + 传闻境界 + 场面分）。
    // 口头榜说的是传说人物——池子是书场素材，不动 npcManager 的活人账。
    var PRODIGY_POOL = [
        { name: '叶孤鸿', title: '剑痴', tier: 9, renown: 880, line: '一剑出，九州白——有人说他早已半步天门' },
        { name: '玄算子', title: '天机阁主', tier: 8, renown: 860, line: '天机阁的卦不敢轻出，出一次天下动一次' },
        { name: '拓跋狂', title: '北地刀圣', tier: 8, renown: 820, line: '刀出无回，北地三十年没人接得下他三刀' },
        { name: '白芷仙子', title: '药仙', tier: 7, renown: 780, line: '活人无数，也从没人见她亲手杀过谁' },
        { name: '厉血衣', title: '魔道巨擘', tier: 7, renown: 760, line: '血手人屠的名头，正道提起来都压着嗓子' },
        { name: '渡厄禅师', title: '佛门金身', tier: 6, renown: 700, line: '金身不坏，据说曾在雷劫底下念完了整卷经' },
        { name: '覆海蛟王', title: '妖族大圣', tier: 6, renown: 680, line: '东海翻一次浪，就是它翻一次身' },
        { name: '洛清音', title: '琴仙', tier: 5, renown: 620, line: '一曲能乱道心，也能安魂' },
        { name: '顾长风', title: '年轻第一剑', tier: 5, renown: 600, line: '百岁不到的化神，剑比人还傲' },
        { name: '梅无恨', title: '毒手药王', tier: 4, renown: 540, line: '救人的手和杀人的手是同一双' },
        { name: '影七', title: '无影刺客', tier: 4, renown: 520, line: '没人见过他的脸——见过的都不在了' },
        { name: '王小石', title: '新科天骄', tier: 3, renown: 460, line: '山村出来的愣头青，一路打进了金丹' }
    ];

    var ONBOARD_FAME_MIN = 25;      // 名气过了「无名之辈」档，说书人才提你
    var CHALLENGE_FAME_MIN = 60;    // 排进前三还得名气够响，才有人不服
    var CHALLENGE_RANK_MAX = 3;
    var CHALLENGE_CHANCE = 0.25;
    var CHALLENGE_COOLDOWN_DAYS = 4;

    // 模块账（StateRegistry 正门，随 saveData.modules 走，不新开 localStorage 键）
    var _state = { duelWins: 0, duelLosses: 0, bestRank: 0, lastChallengeDay: -999, top10Noted: false, top3Noted: false };

    function _today() {
        try {
            if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') {
                var d = window.timeSystem.getAbsoluteDay();
                if (d) return d;
            }
        } catch (e) { console.warn('[静默失败] js/extensions/jianghu-rank.js · _today：日数没读到，望风榜按第 1 天算', e && e.message); }
        return 1;
    }

    function _tier() {
        var cd = window.currentCharData;
        if (!cd) return 0;
        try { if (typeof window.getRealmTier === 'function') return Math.max(0, window.getRealmTier(cd.realm) || 0); } catch (e) { console.warn('[静默失败] js/extensions/jianghu-rank.js · _tier：境界尺没量出来，按 0 档算', e && e.message); }
        return 0;
    }

    // 场面分：说书人只看看得见的名头——境界是骨、名气杀戮演武与榜上胜负是皮肉
    function playerScore() {
        var cd = window.currentCharData;
        if (!cd) return 0;
        var famePart = Math.min(Number(cd.fame) || 0, 400) * 2;
        var killPart = Math.min(Number(cd._killCount) || 0, 300) * 3;
        var arenaPart = (Number(cd.arenaWins) || 0) * 15;
        var duelPart = _state.duelWins * 40;
        return _tier() * 1000 + famePart + killPart + arenaPart + duelPart;
    }

    // 风声失真：恶名越重传得越邪乎；闷头修行没人捧场，常被看低一层
    function rumorTier() {
        var cd = window.currentCharData;
        var t = _tier();
        if (!cd || t <= 0) return t;
        var est = t;
        if ((Number(cd.notoriety) || 0) >= 60) est += 1;
        else if ((Number(cd.fame) || 0) < 40 && t >= 4) est -= 1;
        return Math.max(1, Math.min(11, est)); // 上界认全序（REALM_ORDER 含飞升/金仙），飞升老怪不被折回渡劫
    }

    function computeRank() {
        var cd = window.currentCharData;
        var entries = PRODIGY_POOL.map(function (p) {
            return { name: p.name, title: p.title, tier: p.tier, score: p.tier * 1000 + p.renown, isPlayer: false, pool: p };
        });
        var onboard = cd && (((Number(cd.fame) || 0) >= ONBOARD_FAME_MIN) || _state.duelWins > 0);
        if (onboard) {
            entries.push({
                name: cd.name || '无名客', title: '你', tier: rumorTier(),
                score: playerScore(), isPlayer: true, pool: null
            });
        }
        entries.sort(function (a, b) { return b.score - a.score; });
        var playerRank = 0;
        for (var i = 0; i < entries.length; i++) if (entries[i].isPlayer) { playerRank = i + 1; break; }
        return { list: entries, playerRank: playerRank, onboard: !!onboard };
    }

    // 境界名不自抄序表（DES-92：全仓只认 window.REALM_ORDER 一把尺）——尺没就绪就如实说不知道
    function _realmName(t) {
        try {
            var order = window.REALM_ORDER;
            if (order && order[t]) return order[t];
        } catch (e) { console.warn('[静默失败] js/extensions/jianghu-rank.js · _realmName：境界尺没读到，风声里这一档说不出名字', e && e.message); }
        return '未知';
    }

    function openJianghuRank() {
        var cd = window.currentCharData;
        if (!cd) { if (window.showMessage) window.showMessage('请先创建角色进入游戏。', 'info'); return; }
        var r = computeRank();
        _noteBestRank(r.playerRank);
        var rows = r.list.slice(0, 10).map(function (e, i) {
            var rankTxt = ['🥇', '🥈', '🥉'][i] || ('第 ' + (i + 1) + ' 位');
            var who = e.isPlayer
                ? '<span class="text-yellow-300 font-bold">' + (window.esc ? window.esc(e.name) : e.name) + '（你）</span> <span class="text-xs text-gray-400">——说书人把你排在这里</span>'
                : '<span class="text-gray-200 font-bold">' + e.title + ' · ' + e.name + '</span>';
            var realmTxt = e.isPlayer ? ('传闻 ' + _realmName(e.tier)) : ('传闻 ' + _realmName(e.tier));
            var line = e.pool ? e.pool.line : '「这位的深浅，书场里没人说得准。」';
            return '<div class="bg-gray-900/50 p-2 rounded mb-2 ' + (e.isPlayer ? 'border border-yellow-500/60' : '') + '">'
                + '<div class="flex justify-between items-center"><span class="text-xs text-amber-400">' + rankTxt + '</span>' + who
                + '<span class="text-xs text-gray-400">' + realmTxt + '</span></div>'
                + '<div class="text-[11px] text-gray-500 mt-1">' + line + '</div></div>';
        }).join('');
        var foot = r.playerRank
            ? '<p class="text-xs text-gray-400 mt-2">你眼下排在第 <span class="text-yellow-300">' + r.playerRank + '</span> 位' + (r.playerRank <= CHALLENGE_RANK_MAX ? '——前三的名头烫手，随时有人不服登门' : '') + '。历史最佳：第 ' + (_state.bestRank || r.playerRank) + ' 位（榜上 ' + _state.duelWins + ' 胜 ' + _state.duelLosses + ' 负）。</p>'
            : '<p class="text-xs text-gray-400 mt-2">说书人还没提起你的名字——名气攒过 ' + ONBOARD_FAME_MIN + '（或有榜上胜绩），才进得了口头账。</p>';
        var html = '<p class="text-xs text-gray-400 mb-3">望风榜不是谁家的黄榜，是茶余饭后的口头账——排高了未必真高，排低了未必真低。上榜没有俸禄，只有名声带来的麻烦与机会。</p>'
            + rows + foot
            + '<p class="text-[11px] text-gray-600 mt-2">恶名重的人被传得邪乎，闷声修行的人常被看低——风声向来不准。</p>';
        if (typeof window.showModal === 'function') window.showModal('🎋 江湖望风榜', html);
    }

    function _noteBestRank(rank) {
        if (!rank) return;
        if (!_state.bestRank || rank < _state.bestRank) _state.bestRank = rank;
        try {
            if (rank <= 10 && !_state.top10Noted) {
                _state.top10Noted = true;
                if (typeof window.playerPushDeed === 'function') window.playerPushDeed('good', '你的名字进了望风榜前十——茶馆里有人学着说你的事迹');
            }
            if (rank <= 3 && !_state.top3Noted) {
                _state.top3Noted = true;
                if (typeof window.playerPushDeed === 'function') window.playerPushDeed('good', '望风榜前三有了你的名字，说书人把你编进了段子的压轴');
                if (window.WorldJournal && typeof window.WorldJournal.record === 'function') {
                    window.WorldJournal.record({ type: 'rank', title: '名入前三', text: '江湖望风榜把你排进了前三——口头的名次，也是名动天下的凭据。' });
                }
            }
        } catch (e) { console.warn('[静默失败] js/extensions/jianghu-rank.js · _noteBestRank：上榜风声没放出去，茶馆少了一段书', e && e.message); }
    }

    // 天骄挑战：排在前三且名气够响，每日有几率被不服的天骄登门
    function maybeProdigyChallenge() {
        try {
            var cd = window.currentCharData;
            if (!cd) return false;
            if (window.currentBattle) return false;
            if (typeof window.isInSoulState === 'function' && window.isInSoulState()) return false;
            var day = _today();
            if (day - _state.lastChallengeDay < CHALLENGE_COOLDOWN_DAYS) return false;
            var r = computeRank();
            _noteBestRank(r.playerRank); // 名次里程碑不必等玩家自己开榜——世界也看得见你爬上去
            if (!r.playerRank || r.playerRank > CHALLENGE_RANK_MAX) return false;
            if ((Number(cd.fame) || 0) < CHALLENGE_FAME_MIN) return false;
            if (Math.random() >= CHALLENGE_CHANCE) return false;
            // 挑人：优先排在玩家后一位的（想往上爬的那位不服），没有就挑前一位的
            var foe = r.list[r.playerRank] || r.list[r.playerRank - 2];
            if (!foe || foe.isPlayer) return false;
            _state.lastChallengeDay = day;
            var foeName = foe.name;
            var foeTitle = foe.title;
            var foeTier = foe.tier;
            setTimeout(function () {
                try {
                    if (window.currentBattle) return;
                    var enemyData = {
                        name: '【望风榜】' + foeTitle + ' · ' + foeName, type: 'elite', physiologyType: 'humanoid',
                        level: foeTier * 3 + 6,
                        attack: 30 + foeTier * 8, defense: 15 + foeTier * 5, speed: 20 + foeTier * 2,
                        maxDurability: 90 + foeTier * 25, durabilities: { chest: 90 + foeTier * 25 },
                        combatAbilities: []
                    };
                    if (window.startBattle) {
                        var b = window.startBattle(enemyData);
                        if (b) { b._isRankDuel = true; b._rankFoeName = foeName; b._rankFoeTitle = foeTitle; }
                    }
                    if (window.showMessage) window.showMessage('⚔️ 望风榜的「' + foeTitle + ' · ' + foeName + '」不服排名，登门挑战！', 'warning');
                } catch (e) { console.warn('[静默失败] js/extensions/jianghu-rank.js · 挑战开打：这一战没拉起来，天骄白跑一趟', e && e.message); }
            }, 1500);
            return true;
        } catch (e) { console.warn('[静默失败] js/extensions/jianghu-rank.js · maybeProdigyChallenge：挑战门槛没过完，这一天照常太平', e && e.message); return false; }
    }

    // 战后结算（由 app.js 战斗分支调用）
    function settleRankDuel(won) {
        try {
            var b = window.currentBattle;
            if (!b || !b._isRankDuel) return;
            var foeName = b._rankFoeName || '天骄';
            if (won) {
                _state.duelWins += 1;
                if (typeof window.addFame === 'function') window.addFame(10);
                if (typeof window.playerPushDeed === 'function') window.playerPushDeed('good', '望风榜上你力压「' + foeName + '」——这一战茶馆里要说上半个月');
                if (window.WorldJournal && typeof window.WorldJournal.record === 'function') {
                    window.WorldJournal.record({ type: 'rank', title: '榜上胜绩', text: '「' + foeName + '」登门挑战望风榜名次，被你堂堂正正打退。' });
                }
                if (window.showMessage) window.showMessage('🏆 打退「' + foeName + '」的挑战——榜上胜负记下一笔，名气+10。', 'success');
            } else {
                _state.duelLosses += 1;
                if (typeof window.addFame === 'function') window.addFame(-4);
                if (typeof window.playerPushDeed === 'function') window.playerPushDeed('bad', '你在「' + foeName + '」手下走了三十招就败了——风声传得比人跑得快');
                if (window.showMessage) window.showMessage('榜上挑战失利——「' + foeName + '」的名头压过了你，名气-4。', 'warning');
            }
        } catch (e) { console.warn('[静默失败] js/extensions/jianghu-rank.js · settleRankDuel：榜上胜负没落账，这一战白打', e && e.message); }
    }

    if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
        window.timeSystem.onNewDaySubscribe(function () { maybeProdigyChallenge(); });
    }

    function _export() { return JSON.parse(JSON.stringify(_state)); }
    function _import(s) {
        if (!s || typeof s !== 'object') return;
        _state.duelWins = Number(s.duelWins) || 0;
        _state.duelLosses = Number(s.duelLosses) || 0;
        _state.bestRank = Number(s.bestRank) || 0;
        _state.lastChallengeDay = Number.isFinite(Number(s.lastChallengeDay)) ? Number(s.lastChallengeDay) : -999;
        _state.top10Noted = !!s.top10Noted;
        _state.top3Noted = !!s.top3Noted;
    }
    function _reset() { _state = { duelWins: 0, duelLosses: 0, bestRank: 0, lastChallengeDay: -999, top10Noted: false, top3Noted: false }; }
    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        window.StateRegistry.register('jianghuRank', { version: 1, export: _export, import: _import, reset: _reset });
    }

    window.JIANGHU_PRODIGY_POOL = PRODIGY_POOL;
    window.computeJianghuRank = computeRank;
    window.openJianghuRank = openJianghuRank;
    window.maybeProdigyChallenge = maybeProdigyChallenge;
    window.settleRankDuel = settleRankDuel;
    window.getRankState = _export;
})();
