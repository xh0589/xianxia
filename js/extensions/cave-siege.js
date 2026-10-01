// ==================== cave-siege.js - v25.6 洞府守卫战（第一百四十八批 · 玩家心愿批） ====================
// 用户点单：「恶名太重、仇家太多时，夜里真的有人打上门」。
// 与宿敌寻仇（rivalry-chain，路上拦截单挑）分账：这一套是**打到家门口**——
//   · 触发看两本账：恶名 ≥40 或名下有仇恨 >60 的仇家；夜里你人在自家洞府才会被打上门；
//   · 来的人六成是仇家本人（恨你入骨的人找得到你家），四成是蒙面夜袭者（恶名招来的野狼）；
//   · 你家的山水真帮你打：静室煞位冲犯来犯者（每煞位折敌攻 3%，封顶 15%），
//     道侣在家上墙头（每位折敌攻 3%，封顶 6%）；出战灵兽照 battle.js 既有接线自动参战；
//   · 打赢：仇家铩羽（仇恨真降）、名气小涨、风声传开；
//   · 打输：洞府被抄——灵石被搬走一成（封顶 300），行囊里还可能少一件东西（如实点名，不吞账）；
//   · 形态照抄宿敌链：onNewDaySubscribe → 门槛骰 → setTimeout 落杀气 → startBattle 挂 _isCaveSiege
//     → app.js onEnd 分支调 settleCaveSiege。账随 StateRegistry 正门，不新开 localStorage 键。

(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    var SIEGE_NOTORIETY_MIN = 40;   // 恶名门槛（没恶名也没仇家，夜里太平）
    var SIEGE_CHANCE_BASE = 0.10;
    var SIEGE_CHANCE_CAP = 0.30;
    var SIEGE_COOLDOWN_DAYS = 5;
    var SHA_ATK_CUT = 0.03;         // 每处煞位折敌攻
    var SHA_ATK_CUT_CAP = 0.15;
    var DAO_ATK_CUT = 0.03;         // 每位在家道侣折敌攻
    var DAO_ATK_CUT_CAP = 0.06;
    var PLUNDER_STONE_RATE = 0.10;  // 败了被搬走的灵石比例
    var PLUNDER_STONE_CAP = 300;

    var _state = { lastSiegeDay: -999, sieges: 0, wins: 0, losses: 0 };

    function _today() {
        try {
            if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') {
                var d = window.timeSystem.getAbsoluteDay();
                if (d) return d;
            }
        } catch (e) { console.warn('[静默失败] js/extensions/cave-siege.js · _today：日数没读到，守卫战冷却按第 1 天算', e && e.message); }
        return 1;
    }

    function _daoAtHome() {
        var n = 0;
        try {
            var bonds = (window.currentCharData && window.currentCharData.bonds) || {};
            for (var id in bonds) if (bonds[id] && bonds[id].type === 'dao_companion') n += 1;
        } catch (e) { console.warn('[静默失败] js/extensions/cave-siege.js · _daoAtHome：情缘册没翻开，墙头按没人算', e && e.message); }
        return n;
    }

    function _shaCount() {
        try {
            if (typeof window.getFengshuiReport === 'function') {
                var rep = window.getFengshuiReport() || [];
                return rep.filter(function (r) { return r && r.verdict === '煞'; }).length;
            }
        } catch (e) { console.warn('[静默失败] js/extensions/cave-siege.js · _shaCount：风水账没读出来，煞位按零处算', e && e.message); }
        return 0;
    }

    function _tier() {
        var cd = window.currentCharData;
        try { if (cd && typeof window.getRealmTier === 'function') return window.getRealmTier(cd.realm) || 3; } catch (e) { console.warn('[静默失败] js/extensions/cave-siege.js · _tier：境界尺没量出来，夜袭者按 3 档捏', e && e.message); }
        return 3;
    }

    function maybeCaveSiege() {
        try {
            var cd = window.currentCharData;
            if (!cd) return false;
            if (window.currentBattle) return false;
            if (typeof window.isInSoulState === 'function' && window.isInSoulState()) return false;
            // 得在自家洞里——人在外头，贼摸的是空宅，这一仗不成立
            var atHome = false;
            try { if (typeof window.isAtHome === 'function') atHome = !!window.isAtHome(); } catch (eH) { console.warn('[静默失败] js/extensions/cave-siege.js · maybeCaveSiege：在不在家没问清，这一夜按太平算', eH && eH.message); }
            if (!atHome) return false;
            var house = window.playerHouse;
            if (!house || !house.type || house.type === 'ruin') return false; // 破山洞没人惦记
            var notoriety = Number(cd.notoriety) || 0;
            var rivals = [];
            try { if (typeof window.getRivals === 'function') rivals = (window.getRivals() || []).filter(function (n) { return n && !n.isDead && !n.isMissing; }); } catch (eR) { console.warn('[静默失败] js/extensions/cave-siege.js · maybeCaveSiege：仇家名单没调出来，这一夜只有野狼惦记', eR && eR.message); }
            if (notoriety < SIEGE_NOTORIETY_MIN && !rivals.length) return false;
            var day = _today();
            if (day - _state.lastSiegeDay < SIEGE_COOLDOWN_DAYS) return false;
            var chance = Math.min(SIEGE_CHANCE_CAP, SIEGE_CHANCE_BASE + notoriety / 1000 + rivals.length * 0.04);
            // v25.7 丐帮耳目递话：常年街角施舍的人，有人摸他家的梢街面上会提前递话——夜袭风声让一截
            //（beggar-alms.js 正门；本账不在位/缘分不够 → null，一分不让）
            try {
                if (window.BeggarAlms && typeof window.BeggarAlms.watchDiscount === 'function') {
                    var wdS = window.BeggarAlms.watchDiscount();
                    if (wdS && Number(wdS.siege) > 0) chance = Math.max(0.02, chance - Number(wdS.siege));
                }
            } catch (eWatch) { console.warn('[静默失败] js/extensions/cave-siege.js · maybeCaveSiege：丐帮耳目的让风没算成——夜袭风声照旧', eWatch && eWatch.message); }
            if (Math.random() >= chance) return false;

            _state.lastSiegeDay = day;
            _state.sieges += 1;
            var foeNpc = (rivals.length && Math.random() < 0.6) ? rivals.sort(function (a, b) {
                return ((b.relationship && b.relationship.hatred) || 0) - ((a.relationship && a.relationship.hatred) || 0);
            })[0] : null;
            var tier = _tier();
            var hatred = foeNpc && foeNpc.relationship ? (Number(foeNpc.relationship.hatred) || 0) : 0;
            var enemyData = foeNpc
                ? {
                    name: '【夜袭】' + foeNpc.name, type: 'elite', physiologyType: 'humanoid',
                    level: tier * 3 + Math.floor(hatred / 10), attack: 35 + tier * 5 + Math.floor(hatred / 5),
                    defense: 18 + tier * 3, speed: 22, maxDurability: 100 + tier * 15 + hatred,
                    durabilities: { chest: 100 + tier * 15 + hatred }, combatAbilities: []
                }
                : {
                    name: '蒙面夜袭者', type: 'elite', physiologyType: 'humanoid',
                    level: tier * 3 + 2, attack: 33 + tier * 5, defense: 16 + tier * 3, speed: 24,
                    maxDurability: 95 + tier * 15, durabilities: { chest: 95 + tier * 15 }, combatAbilities: []
                };
            // 你家的山水帮你打：煞位冲犯来犯者、道侣上墙头（都是战前折敌，不动 Battle 内核）
            var sha = _shaCount();
            var dao = _daoAtHome();
            var cut = Math.min(SHA_ATK_CUT_CAP, sha * SHA_ATK_CUT) + Math.min(DAO_ATK_CUT_CAP, dao * DAO_ATK_CUT);
            var cutTxt = [];
            if (sha > 0) cutTxt.push('静室煞位冲得来人气血翻涌（折攻 ' + Math.round(Math.min(SHA_ATK_CUT_CAP, sha * SHA_ATK_CUT) * 100) + '%）');
            if (dao > 0) cutTxt.push('道侣立在墙头（折攻 ' + Math.round(Math.min(DAO_ATK_CUT_CAP, dao * DAO_ATK_CUT) * 100) + '%）');
            enemyData.attack = Math.max(1, Math.round(enemyData.attack * (1 - cut)));
            var foeName = foeNpc ? foeNpc.name : '蒙面夜袭者';
            var foeId = foeNpc ? (foeNpc.id || null) : null;
            setTimeout(function () {
                try {
                    if (window.currentBattle) return;
                    if (window.startBattle) {
                        var b = window.startBattle(enemyData);
                        if (b) { b._isCaveSiege = true; b._siegeNpcId = foeId; b._siegeFoeName = foeName; }
                    }
                    if (window.showMessage) window.showMessage('🔥 夜里山门外火光一闪——' + (foeNpc ? '「' + foeName + '」打上洞府来了！' : '有人摸上洞府来了！') + (cutTxt.length ? '（' + cutTxt.join('；') + '）' : ''), 'error');
                } catch (eB) { console.warn('[静默失败] js/extensions/cave-siege.js · 夜袭开打：这一仗没拉起来，火光白闪了一夜', eB && eB.message); }
            }, 1500);
            return true;
        } catch (e) { console.warn('[静默失败] js/extensions/cave-siege.js · maybeCaveSiege：门槛没走完，这一夜照旧太平', e && e.message); return false; }
    }

    // 战后结算（由 app.js 战斗分支调用）
    function settleCaveSiege(won) {
        try {
            var b = window.currentBattle;
            if (!b || !b._isCaveSiege) return;
            var foeName = b._siegeFoeName || '夜袭者';
            if (won) {
                _state.wins += 1;
                if (b._siegeNpcId && window.npcManager && typeof window.npcManager.getNPC === 'function') {
                    var npc = window.npcManager.getNPC(b._siegeNpcId);
                    if (npc && typeof npc.changeHatred === 'function') npc.changeHatred(-30);
                }
                if (typeof window.addFame === 'function') window.addFame(3);
                if (typeof window.playerPushDeed === 'function') window.playerPushDeed('good', '「' + foeName + '」夜里打上你家洞府，被你从山门口打了出去');
                if (window.WorldJournal && typeof window.WorldJournal.record === 'function') {
                    window.WorldJournal.record({ type: 'cave_siege', title: '洞府守卫战', text: '「' + foeName + '」夜袭洞府，被守在自家山门口打退。' });
                }
                if (window.showMessage) window.showMessage('🛡️ 守住了！「' + foeName + '」铩羽而归——名气+3' + (b._siegeNpcId ? '，这份梁子也淡了三分' : '') + '。', 'success');
            } else {
                _state.losses += 1;
                var lostTxt = [];
                // 灵石被搬走一成（封顶 300）
                var purse = 0;
                try { purse = (window.inventory && window.inventory.currency) ? (Number(window.inventory.currency.spiritStones) || 0) : 0; } catch (eP) { console.warn('[静默失败] js/extensions/cave-siege.js · settleCaveSiege：钱袋没数清，被搬走的灵石按 0 记', eP && eP.message); }
                var take = Math.min(PLUNDER_STONE_CAP, Math.floor(purse * PLUNDER_STONE_RATE));
                if (take > 0) {
                    if (window.DataManager && typeof window.DataManager.deductSpiritStones === 'function' && window.DataManager.deductSpiritStones(take)) {
                        lostTxt.push('灵石 ' + take);
                    } else {
                        lostTxt.push('灵石没能凑出 ' + take + '（账上不够，来人翻箱倒柜只搜走零头）');
                    }
                }
                // 行囊里再被顺走一件（非任务品，如实点名）
                try {
                    var slots = (window.inventory && window.inventory.slots) || [];
                    var cands = [];
                    for (var i = 0; i < slots.length; i++) {
                        var s = slots[i];
                        var t = s && window.itemById && window.itemById[s.templateId];
                        if (s && (s.count || 0) > 0 && s.uid && t && t.type !== 'quest' && t.category !== 'quest' && s.templateId.indexOf('spec_') !== 0) cands.push({ s: s, t: t });
                    }
                    if (cands.length) {
                        var pick = cands[Math.floor(Math.random() * cands.length)];
                        if (typeof window.removeItem === 'function') {
                            window.removeItem(pick.s.uid, 1);
                            lostTxt.push((pick.t.name || pick.s.templateId) + ' x1');
                        }
                    }
                } catch (eI) { console.warn('[静默失败] js/extensions/cave-siege.js · settleCaveSiege：被顺走的物件没点清，这一笔损失说不明白', eI && eI.message); }
                if (typeof window.playerPushDeed === 'function') window.playerPushDeed('bad', '「' + foeName + '」夜里打破了你家山门，搬了东西才走——道上都在笑');
                if (window.WorldJournal && typeof window.WorldJournal.record === 'function') {
                    window.WorldJournal.record({ type: 'cave_siege', title: '洞府失守', text: '「' + foeName + '」夜袭得手，洞府被抄掠了一角。' });
                }
                if (window.showMessage) window.showMessage('💀 洞府失守——' + (lostTxt.length ? '被搬走：' + lostTxt.join('、') + '。' : '来人去得急，没搜出什么。'), 'error');
            }
        } catch (e) { console.warn('[静默失败] js/extensions/cave-siege.js · settleCaveSiege：守卫战的账没落下，胜负都悬着', e && e.message); }
    }

    function _export() { return JSON.parse(JSON.stringify(_state)); }
    function _import(s) {
        if (!s || typeof s !== 'object') return;
        _state.lastSiegeDay = Number.isFinite(Number(s.lastSiegeDay)) ? Number(s.lastSiegeDay) : -999;
        _state.sieges = Number(s.sieges) || 0;
        _state.wins = Number(s.wins) || 0;
        _state.losses = Number(s.losses) || 0;
    }
    function _reset() { _state = { lastSiegeDay: -999, sieges: 0, wins: 0, losses: 0 }; }
    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        window.StateRegistry.register('caveSiege', { version: 1, export: _export, import: _import, reset: _reset });
    }

    if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
        window.timeSystem.onNewDaySubscribe(function () { maybeCaveSiege(); });
    }

    window.CaveSiege = {
        maybeSiege: maybeCaveSiege,
        settle: settleCaveSiege,
        state: _export
    };
    window.maybeCaveSiege = maybeCaveSiege;
    window.settleCaveSiege = settleCaveSiege;
})();
