// ==================== sect-roster.js - 门中名分（方案五：族谱 / 腰牌 / 执事养老线） ====================
// 门派有了活的座次与立场，还缺「人」的名分：谁在这门里、腰上挂的什么牌、老了去哪儿、死了记在哪。
//   族谱：从真账自动收——掌门位分、你的师承功过（读贡献账本）、在世同门、养老的、殁了的；
//   腰牌：入门自动发（编年记名），升职重新鎏字，进城守卫认牌，退派/叛门缴回（叛门挪另册）；
//   执事养老：具名同门花甲而根骨到头（炼气/筑基），把腰牌挂上老墙挪去后山——世界会老；
//   玩家花甲安顿：六十岁后可请「荣养执事」名分，半生功绩入账，山中老去也是一种圆满。
// 纪律：全走真账（编年/账本/旗帜/NPC字段随档）；不新增按钮堆——入口在政事面板与议事厅里；文案不带计数器口吻。
(function () {
    'use strict';
    var W = window;

    function ds() { return W.discipleState || null; }
    function cd() { return W.currentCharData || null; }
    function flags() { return (W.eventFlags = W.eventFlags || {}); }
    // 第九波·总账根治：timeSystem.totalDays 在生产里根本不存在，旧钟恒 0——腰牌月钩/养老月扫全是死代码。
    // 统一优先真钟 getAbsoluteDay；旧字段只作测试沙箱的退路。
    function absDay() {
        try {
            if (typeof W.getAbsoluteDay === 'function') { var g = W.getAbsoluteDay(); if (g) return Math.floor(g); }
            var t = W.timeSystem;
            if (t) {
                if (typeof t.getAbsoluteDay === 'function') { var g2 = t.getAbsoluteDay(); if (g2) return Math.floor(g2); }
                if (t.gameTime && t.gameTime.currentDay) return Math.floor(t.gameTime.currentDay);
                if (t.totalDays) return Math.floor(t.totalDays);
            }
            if (W.WorldCalendar && W.WorldCalendar.day) return Math.floor(W.WorldCalendar.day);
        } catch (e) {}
        return 0;
    }
    function log(m, t) { try { if (W.gameLog && W.gameLog.add) W.gameLog.add(m); } catch (e) {} }
    function msg(m, t) { if (typeof W.showMessage === 'function') W.showMessage(m, t || 'info'); }
    function modal(t, b) { if (typeof W.showModal === 'function') W.showModal(t, b); }
    function para(t) { return '<p class="text-sm text-gray-300 leading-relaxed mb-2">' + t + '</p>'; }
    function internal(sect) { return (W.SECT_INTERNAL && W.SECT_INTERNAL[sect]) || null; }
    function mySect() { try { var d = ds(); return d && d.isInSect ? (d.sectName || d.sectId) : null; } catch (e) { return null; } }
    function playerName() { try { return (cd() || {}).name || '无名弟子'; } catch (e) { return '无名弟子'; } }
    function chron(sect, text) {
        try { if (W.SectGov && W.SectGov.chronicle) { W.SectGov.chronicle(sect, text); return; } } catch (e) {}
        var it = internal(sect);
        if (!it) return;
        if (!it.chronicle) it.chronicle = [];
        it.chronicle.push({ day: absDay(), text: String(text) });
        if (it.chronicle.length > 40) it.chronicle.splice(0, it.chronicle.length - 40);
    }
    function leaderName(sect) { try { if (W.SECT_LEADER_NAMES && W.SECT_LEADER_NAMES[sect]) return W.SECT_LEADER_NAMES[sect]; } catch (e) {} return sect + '掌门'; }
    function rankWord(n) { return (n.combat && n.combat.realm) || '炼气'; }
    function realmTier(r) { try { return typeof W.getRealmTier === 'function' ? W.getRealmTier(r) : 1; } catch (e) { return 1; } }
    function effAge(n) { return Math.floor(Number(n.age) || 20); } // 第九波修：npc.age 已由寿元系统逐年自增，再叠全局天数是双重计数（弟子三十来岁就"花甲养老"）
    function discipleNpcs(sect) {
        var out = [];
        try {
            var npcs = (typeof W.getSectNPCs === 'function') ? (W.getSectNPCs(sect) || []) : [];
            for (var i = 0; i < npcs.length; i++) {
                var n = npcs[i];
                if (!n || !n.id || String(n.id).indexOf('sect_disciple_') !== 0 || !n.name) continue;
                out.push(n);
            }
        } catch (e) {}
        return out;
    }

    // ============ 一 · 腰牌 ============
    function token() { return flags()['sect_token'] || null; }
    function issueToken(sect, quiet) {
        var d = ds();
        if (!d || !d.isInSect || !sect) return null;
        var t = { sect: sect, day: absDay(), rank: d.rankName || '外门弟子' };
        flags()['sect_token'] = t;
        if (!quiet) {
            chron(sect, '门中给「' + playerName() + '」发了腰牌——' + t.rank + '的名分，从此挂在腰间。');
            log('🎴 执事堂给你发了「' + sect + '」的腰牌：铜牌一面，錾着门派与你「' + t.rank + '」的名分。（进城时，守卫认这块牌）', 'success');
        }
        return t;
    }
    function returnToken(betrayed) {
        var t = token();
        if (!t) return;
        delete flags()['sect_token'];
        chron(t.sect, '「' + playerName() + '」的腰牌缴回了执事堂' + (betrayed ? '——族谱的活页上，这个名字被挪去了另册。' : '。'));
        log('🎴 你的「' + t.sect + '」腰牌缴回了执事堂' + (betrayed ? '。族谱另册上多了一笔——江湖路远，好自为之。' : '。'), 'info');
    }
    // 腰牌与现状对齐：入门补发、换派先缴后发、退派/叛门（含内部静默调用）次日察觉缴回、升职重新鎏字
    function tokenEnsure() {
        var d = ds();
        var t = token();
        if (!d || !d.isInSect) {
            // 遗徒的腰牌不缴回——牌在人身上，派在心里（灭门线的例外）
            var rem = flags()['sect_remnant'];
            if (t && rem && rem.sect === t.sect && !rem.revived) return t;
            if (t) { var b0 = flags()['sect_betrayed_recent'] === t.sect; delete flags()['sect_betrayed_recent']; returnToken(b0); }
            return null;
        }
        var sect = d.sectName || d.sectId;
        if (!t) return issueToken(sect);
        if (t.sect !== sect) {
            var b1 = flags()['sect_betrayed_recent'] === t.sect;
            delete flags()['sect_betrayed_recent'];
            returnToken(b1);
            return issueToken(sect);
        }
        if (t.rank !== (d.rankName || '外门弟子')) {
            var old = t.rank;
            t.rank = d.rankName || '外门弟子';
            chron(sect, '「' + playerName() + '」的腰牌重新鎏了字：' + old + ' → ' + t.rank + '。');
            log('🎴 你的腰牌重新鎏了字——如今錾的是「' + t.rank + '」。（名分变了，牌也得跟着变）', 'success');
        }
        return t;
    }
    W.sectTokenNow = function () { return tokenEnsure(); };
    // 进城：守卫认牌（一城只惊动一回，之后是熟面孔）
    function cityGreet(cityName) {
        var t = tokenEnsure();
        if (!t) return;
        var key = 'sect_token_city_' + cityName;
        if (flags()[key]) return;
        flags()[key] = absDay();
        var rem = flags()['sect_remnant'];
        if (rem && rem.sect === t.sect && !rem.revived && flags()['sect_ruin_' + t.sect]) {
            log('🏮 城门口，兵丁看见你腰间的牌，愣了一下——那是「' + t.sect + '」的腰牌，可那座山已经没了。他张了张嘴，最后只是抱了抱拳：「节哀。」茶棚里有人认出来了，低声跟同伴说：「那就是' + t.sect + '出来的人……牌还带着呢。」', 'warning');
            return;
        }
        log('🏮 城门口，兵丁的目光在你腰间停了停——「' + t.sect + '」的腰牌。他抬手让开半边：「仙门中人，请。」入得城来，茶棚里有人低声问旁人：「方才那位，是哪座山上下来的？」', 'info');
    }
    try {
        var origEnter = W.enterCity;
        if (typeof origEnter === 'function' && !origEnter.__rosterWrapped) {
            W.enterCity = function (cityName) {
                var r = origEnter.apply(this, arguments);
                try { cityGreet(String(cityName || '').replace(/\s+/g, '')); } catch (e) {}
                return r;
            };
            W.enterCity.__rosterWrapped = true;
        }
    } catch (e) {}
    // 入门即时发牌（内部静默调用走 tokenEnsure 兜底）
    try {
        var origJoin = W.joinSect;
        if (typeof origJoin === 'function' && !origJoin.__rosterWrapped) {
            W.joinSect = function () {
                var r = origJoin.apply(this, arguments);
                try { var d = ds(); if (d && d.isInSect && !token()) issueToken(d.sectName || d.sectId); } catch (e) {}
                return r;
            };
            W.joinSect.__rosterWrapped = true;
        }
        var origLeave = W.leaveSect;
        if (typeof origLeave === 'function' && !origLeave.__rosterWrapped) {
            W.leaveSect = function () {
                var r = origLeave.apply(this, arguments);
                try { if (r !== false) returnToken(false); } catch (e) {}
                return r;
            };
            W.leaveSect.__rosterWrapped = true;
        }
    } catch (e) {}

    // ============ 二 · 执事养老线 ============
    function retireNpc(sect, n) {
        n._retired = true;
        try { n.occupation = '养老'; } catch (e) {}
        if (n._masterIsPlayer) {
            chron(sect, '「' + n.name + '」把腰牌挂上了议事厅的老墙——他是' + playerName() + '亲传的弟子，' + rankWord(n) + '的根骨到头了，往后在后山看云喝茶。');
            log('🍵 你亲传的「' + n.name + '」老了。他把腰牌交到你手里：「师父，往后的山路我走不动了——就在山里晒晒太阳，您得空来喝茶。」（他挪去后山养老，不再列队当差）', 'warning');
        } else {
            chron(sect, '「' + n.name + '」把腰牌挂上了议事厅的老墙——在山里住了一辈子，如今挪去后山看云喝茶。（执事养老）');
        }
    }
    function retireSweep() {
        var sects = W.SECT_INTERNAL || {};
        var done = 0;
        for (var sect in sects) {
            if (done >= 2) break; // 一月至多两桩，江湖不为养老刷屏
            var npcs = discipleNpcs(sect);
            for (var i = 0; i < npcs.length && done < 2; i++) {
                var n = npcs[i];
                if (n.isDead || n._retired || n._scattered || n._lostDisciple || n._defected) continue; // 灭门后散落江湖的人，不在山上挂牌
                if (effAge(n) < 60) continue;
                if (realmTier(rankWord(n)) > 2) continue; // 金丹往上寿元悠长，还不到挂牌的时候
                if (Math.random() >= 0.25) continue;
                retireNpc(sect, n);
                done++;
            }
        }
    }
    // 玩家花甲安顿：荣养执事（一生一次）
    W.doSectSettleDown = function () {
        var d = ds();
        var sect = mySect();
        if (!d || !sect) { msg('还没入门，安顿什么？', 'warning'); return false; }
        var age = 0;
        try { age = Math.floor((W.playerLifespan && W.playerLifespan.currentAge) || 0); } catch (e) {}
        if (age < 60) { msg('你还没到花甲——外头的路还长着呢。', 'info'); return false; }
        if (flags()['sect_settled']) { msg('你早已是荣养执事了。', 'info'); return false; }
        flags()['sect_settled'] = absDay();
        try { if (typeof W.sectAddContribution === 'function') W.sectAddContribution(50, '花甲安顿·半生功绩'); } catch (e2) {}
        chron(sect, '「' + playerName() + '」把外务尽数交割，掌门准了「荣养执事」的名分——半生功绩折进账里（贡献+50），晨钟暮鼓，山中老去。');
        log('🍵 你在祖师堂前站了半个时辰，把腰牌解下来又系回去——从今日起，你是「' + sect + '」的荣养执事。门里不再派你外务，俸禄照旧，山中岁月随你过。（这也是一种圆满）', 'success');
        msg('花甲安顿：你成了荣养执事。', 'success');
        return true;
    };
    W.sectCanSettleDown = function () {
        try {
            var age = Math.floor((W.playerLifespan && W.playerLifespan.currentAge) || 0);
            return !!mySect() && age >= 60 && !flags()['sect_settled'];
        } catch (e) { return false; }
    };

    // ============ 三 · 族谱（一门的名分册） ============
    W.openSectRoster = function (sectArg) {
        var sect = sectArg || mySect();
        if (!sect) { msg('还没入门，翻谁家的族谱？', 'warning'); return; }
        var d = ds() || {};
        var t = tokenEnsure();
        var npcs = discipleNpcs(sect);
        var html = '<div class="text-left">';
        // 灭门之后：族谱转「另册·遗卷」（sect-doom）
        var ruined = !!flags()['sect_ruin_' + sect];
        var remnant = flags()['sect_remnant'];
        var myRemnant = remnant && remnant.sect === sect;
        if (ruined) {
            var ruin = flags()['sect_ruin_' + sect] || {};
            html += para('📖 这不是一册活谱——是<b class="text-red-300">「' + sect + '·遗卷」</b>。' + (ruin.day || '') + '日山门' + (ruin.path === 'A' ? '为「' + (ruin.foe || '仇家') + '」所破' : ruin.path === 'B' ? '散了' : '空了') + '，此后名字都记在另册里。灯灭了，名字没灭。');
        }
        // 掌门位分（恋爱角色掌门——位分永不动，只记名）
        var standing = '';
        try {
            if (typeof W.sectPowerLabel === 'function' && typeof W.sectAlignLabel === 'function') {
                standing = ' · ' + W.sectPowerLabel(sect) + ' · ' + W.sectAlignLabel(sect);
            }
        } catch (e) {}
        if (!ruined) html += para('📖 <b class="text-amber-200">' + sect + '族谱</b>——一门的名分都在这本册子里：活的、老的、殁的，各归各页。');
        html += '<div class="bg-gray-800/60 p-2 rounded mb-2 text-xs text-gray-300">掌门 <b class="text-amber-300">' + leaderName(sect) + '</b>（位分永记于此）<span class="text-gray-500">' + standing + '</span></div>';
        // 你自己那一页
        var merits = [];
        try { merits = (typeof W.sectLedgerEntries === 'function' ? W.sectLedgerEntries() : []).slice(0, 3); } catch (e3) {}
        var myDisc = [];
        try { myDisc = d._myDisciples || []; } catch (e4) {}
        html += '<p class="text-xs font-bold text-amber-200 mb-1">🖋️ 你的名分</p>';
        html += '<div class="bg-gray-800/60 p-2 rounded mb-2 text-xs text-gray-300">'
            + '<b class="text-white">' + playerName() + '</b> · ' + (myRemnant && !remnant.revived ? '<span class="text-red-300">' + sect + '·遗徒</span>（生前职级：' + (d._remnantRankName || '弟子') + '）' : (d.rankName || '外门弟子')) + (flags()['sect_settled'] ? ' · <span class="text-amber-300">荣养执事</span>' : '')
            + '<br>师承：' + (d._masterName ? '拜在「' + d._masterName + '」座下' : '掌门座下记名') + ' · 亲传弟子 ' + myDisc.length + ' 人'
            + (myRemnant && !remnant.revived && t ? '<br>腰牌：<b class="text-amber-300">没有缴回</b>——牌在人身上，派在心里（第' + t.day + '日入册）'
                : (t ? '<br>腰牌：第' + t.day + '日入册，牌上錾「' + t.rank + '」' : ''))
            + (merits.length ? '<br>近来功绩：' + merits.map(function (m) { return m.reason + '（' + (m.amt > 0 ? '+' : '') + m.amt + '）'; }).join('、') : '')
            + '</div>';
        // 在世同门 / 养老 / 殁录
        var live = [], retired = [], dead = [], lost = [], defected = [];
        for (var i = 0; i < npcs.length; i++) {
            var n = npcs[i];
            if (n.isDead) dead.push(n);
            else if (n._retired) retired.push(n);
            else if (n._lostDisciple) lost.push(n);
            else if (n._defected) defected.push(n);
            else live.push(n);
        }
        html += '<p class="text-xs font-bold text-amber-200 mb-1">' + (ruined ? '🧑‍🤝‍🧑 散落江湖（' + live.length + '）' : '🧑‍🤝‍🧑 在世同门（' + live.length + '）') + '</p>';
        html += '<div class="bg-gray-900/60 rounded p-2 mb-2 max-h-44 overflow-y-auto">';
        html += live.length ? live.slice(0, 20).map(function (n) {
            return '<p class="text-xs text-gray-400 py-0.5 border-b border-gray-700/40">' + n.name
                + ' · ' + effAge(n) + '岁 · ' + rankWord(n)
                + (n._masterIsPlayer ? ' · <span class="text-amber-300">你亲传</span>' : '')
                + (n._scattered ? ' · <span class="text-gray-500">散落·' + (n.location || '江湖') + '</span>' : '') + '</p>';
        }).join('') + (live.length > 20 ? '<p class="text-[10px] text-gray-500 py-1">……外门名册还有 ' + (live.length - 20) + ' 人，册子太厚，执事只给你看了前头。</p>' : '')
            : '<p class="text-xs text-gray-500">册页上空着——门里没人了。</p>';
        html += '</div>';
        if (lost.length) {
            html += '<p class="text-xs font-bold text-orange-300 mb-1">🧭 下落不明（' + lost.length + '）</p>';
            html += '<div class="bg-gray-900/60 rounded p-2 mb-2 text-xs text-gray-500">' + lost.map(function (n) { return n.name + (n._masterIsPlayer ? '（你亲传）' : ''); }).join('、') + '——殁录上不写殁，写「下落不明」。人没见到，名字就不划。（名望高了，江湖会替你把人送到面前）</div>';
        }
        if (defected.length) {
            html += '<p class="text-xs font-bold text-red-400 mb-1">🗡️ 另投（' + defected.length + '）</p>';
            html += '<div class="bg-gray-900/60 rounded p-2 mb-2 text-xs text-gray-500">' + defected.map(function (n) { return n.name + '（投了「' + (n.location || '仇家') + '」）'; }).join('、') + '——名分还在另册上，人穿了别家的衣袍。日后战场相见，各自珍重。</div>';
        }
        if (retired.length) {
            html += '<p class="text-xs font-bold text-stone-300 mb-1">🍵 后山养老（' + retired.length + '）</p>';
            html += '<div class="bg-gray-900/60 rounded p-2 mb-2 text-xs text-gray-500">' + retired.slice(0, 10).map(function (n) { return n.name + '（' + effAge(n) + '岁）'; }).join('、') + '——腰牌挂在议事厅老墙上，人挪去看云喝茶了。</div>';
        }
        if (dead.length) {
            html += '<p class="text-xs font-bold text-gray-400 mb-1">🕯️ 殁录（' + dead.length + '）</p>';
            html += '<div class="bg-gray-900/60 rounded p-2 mb-2 text-xs text-gray-500">' + dead.slice(0, 10).map(function (n) { return n.name; }).join('、') + '——名字描过金，香火不断。</div>';
        }
        // 花甲安顿（只在能安顿时出现）
        if (W.sectCanSettleDown && W.sectCanSettleDown()) {
            html += '<button onclick="window.doSectSettleDown(); window._closeModal && window._closeModal();" class="mt-2 w-full bg-amber-800 hover:bg-amber-700 text-xs px-3 py-2 rounded">🍵 你已花甲——把外务交割了，请个「荣养执事」的名分（半生功绩入账）</button>';
        } else if (flags()['sect_settled']) {
            html += '<p class="text-[10px] text-gray-500 mt-2">第' + flags()['sect_settled'] + '日起，你是荣养执事——晨钟暮鼓，山中岁月随你过。</p>';
        }
        html += '</div>';
        modal('📖 ' + sect + (ruined ? ' · 遗卷' : ' · 族谱'), html);
    };

    // ============ 四 · 月钩 ============
    function monthTick() {
        var day = absDay();
        if (!day || day % 30 !== 0) return;
        tokenEnsure();
        retireSweep();
    }
    try {
        if (W.EventBus && W.EventBus.on) W.EventBus.on('newDay', function () { try { monthTick(); } catch (e) {} });
        else if (W.timeSystem && typeof W.timeSystem.onNewDaySubscribe === 'function') W.timeSystem.onNewDaySubscribe(function () { try { monthTick(); } catch (e) {} });
    } catch (e) {}

    W.sectRosterProbe = function (sect) {
        var t = token();
        var npcs = discipleNpcs(sect || mySect() || '');
        return {
            token: t ? { sect: t.sect, rank: t.rank, day: t.day } : null,
            settled: !!flags()['sect_settled'],
            live: npcs.filter(function (n) { return !n.isDead && !n._retired; }).length,
            retired: npcs.filter(function (n) { return !n.isDead && n._retired; }).length,
            dead: npcs.filter(function (n) { return !!n.isDead; }).length
        };
    };
    console.log('[sect-roster] 门中名分已注册：族谱自动收真账（师承/功过/殁录）+ 腰牌（入门发/升职鎏字/进城认牌/退派缴回）+ 执事养老线（同门花甲挂牌，玩家六十可请荣养）');
})();
