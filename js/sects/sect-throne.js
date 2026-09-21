// ==================== sect-throne.js - 掌门位（第十波 · 传位与夺位） ====================
// 此前职位表写死「掌门不可通过晋升获得」——散修熬一辈子最高到副掌门，「执掌一派」的终点幻想整条断掉。
// 本模块接通三条登位路（详稿·第十波传位夺位）：
//   传位：长老以上 + 贡献六千 + 老掌门好感六十 → 祖师堂一场戏，印信相授（旧掌门转闭关，不折不删）；
//   夺位：长老以上 + 贡献三千为凭，真花五百贡献打点执事堂；成功率是明账（门中危机/掌门失德/你的势逐项列），
//         封顶八成——没有十成的逼宫。败了贡献折半、降一级、记档，再来成功率再折（不逐不杀，留翻身余地）；
//   载入：登位事实落旗，读档即恢复职位与称呼（全江湖改口）。
// 当上掌门之后：门务你拍板（掌门案头，复用治理十一策，账走公库真扣）——自家门派的长老自动决议同步停摆。
// 铁律延伸：恋爱角色掌门不死、位分不换——传位夺位两路都拒。
// 纪律：零外文字母，文案不带计数器口吻；每一笔贡献有来路有去向。
(function () {
    'use strict';
    var W = window;
    if (typeof W === 'undefined') return;

    // 第九波同款真钟链：优先 getAbsoluteDay，旧字段只作测试沙箱退路
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
    function ds() { return W.discipleState || null; }
    function cd() { return W.currentCharData || null; }
    function mySect() { try { var d = ds(); return d && d.isInSect ? (d.sectName || d.sectId) : null; } catch (e) { return null; } }
    function flags() { return (W.eventFlags = W.eventFlags || {}); }
    function log(m, t) { try { if (W.gameLog && W.gameLog.add) W.gameLog.add(m); } catch (e) {} }
    function msg(m, t) { if (typeof W.showMessage === 'function') W.showMessage(m, t || 'info'); }
    function modal(t, b) { if (typeof W.showModal === 'function') W.showModal(t, b); }
    function para(t) { return '<p class="text-sm text-gray-300 leading-relaxed mb-2">' + t + '</p>'; }
    function btn(label, onclick, cls) { return '<button onclick="' + onclick + '" class="' + (cls || 'bg-amber-700 hover:bg-amber-600') + ' text-xs px-3 py-2 rounded text-left">' + label + '</button>'; }
    function playerName() { try { return (cd() || {}).name || '门下弟子'; } catch (e) { return '门下弟子'; } }
    function internal(sect) { return (W.SECT_INTERNAL && W.SECT_INTERNAL[sect]) || null; }
    function leaderNpc(sect) {
        try { return W.npcManager && W.npcManager.getNPC ? W.npcManager.getNPC('sect_leader_' + sect) : null; } catch (e) { return null; }
    }
    function isCompanion(n) { return !!(n && (n._companionData || n.isDaoCompanion)); }
    function leaderAff(sect) {
        var n = leaderNpc(sect);
        if (!n) return 0;
        return Math.round(Number((n.relationship && n.relationship.affection) || n.affection || 0));
    }
    function rankName(id) {
        try {
            var rs = W.COMMON_RANKS || [];
            for (var i = 0; i < rs.length; i++) { if (rs[i].id === id) return rs[i].name; }
        } catch (e) {}
        return '弟子';
    }
    function chron(sect, text) { try { if (W.SectGov && W.SectGov.chronicle) { W.SectGov.chronicle(sect, text); return; } } catch (e) {} }
    function street(text) {
        try {
            var f = flags();
            if (!f['qi_street'] || !f['qi_street'].push) f['qi_street'] = [];
            f['qi_street'].push({ day: absDay(), text: String(text) });
            if (f['qi_street'].length > 60) f['qi_street'].splice(0, f['qi_street'].length - 60);
        } catch (e) {}
    }
    function journal(title, text) { try { if (W.WorldJournal && W.WorldJournal.record) W.WorldJournal.record({ type: 'sect', title: title, text: text }); } catch (e) {} }
    function spendC(n, reason) {
        try { if (typeof W.sectSpendContribution === 'function') return W.sectSpendContribution(n, reason); } catch (e) {}
        var d = ds();
        if (!d || (Number(d.contribution) || 0) < n) return false;
        d.contribution = (Number(d.contribution) || 0) - n;
        try { if (typeof W.sectLedgerNote === 'function') W.sectLedgerNote(-n, reason); } catch (e2) {}
        return true;
    }
    function tourneyWon(sect) {
        try {
            var hist = (W.Tournament && W.Tournament.getTournamentHistory) ? (W.Tournament.getTournamentHistory(sect) || []) : [];
            return hist.some(function (h) { return h && h.winnerId === 'player'; });
        } catch (e) { return false; }
    }
    function famineNow(sect) { try { return !!(W.SectGov && W.SectGov.famine && W.SectGov.famine(sect)); } catch (e) { return false; } }
    function powerTier(sect) { try { if (typeof W.sectPowerNow === 'function') { var p = W.sectPowerNow(sect); if (p) return p.tier; } } catch (e) {} return ''; }

    // ============ 一 · 资格账（面板逐条明示，不留死路感） ============
    function throneFlag() { return flags()['sect_throne'] || null; }
    function isThrone(sect) { var f = throneFlag(); return !!(f && sect && f.sect === sect); }
    function coupRecord() { return flags()['sect_throne_coup'] || null; }

    function transmitState(sect) {
        var d = ds() || {};
        var rank = (d.rank == null ? 7 : d.rank);
        var contrib = Number(d.contribution) || 0;
        var ln = leaderNpc(sect);
        var aff = leaderAff(sect);
        var lack = [];
        if (isThrone(sect) || rank === 0) return { ok: false, done: true, lack: lack };
        if (rank > 2) lack.push('职位不到——长老以上，话才递得进祖师堂（现居' + rankName(rank) + '）');
        if (contrib < 6000) lack.push('功绩不足——半生功绩作凭，贡献要六千（现有 ' + contrib + '）');
        if (!ln || ln.isDead) lack.push('见不着掌门的面——掌门不在山中');
        else if (isCompanion(ln)) lack.push('掌门与你情分特殊——位子的事，你们之间用不着外人置喙（位分不换）');
        else if (aff < 60) lack.push('老掌门还没把山门托付给你的意思（认可 ' + aff + '/60——多在山门里替他分忧）');
        return { ok: lack.length === 0, lack: lack, rank: rank, contrib: contrib, aff: aff, leader: ln ? (ln.name || '掌门') : '掌门' };
    }
    function coupState(sect) {
        var d = ds() || {};
        var rank = (d.rank == null ? 7 : d.rank);
        var contrib = Number(d.contribution) || 0;
        var ln = leaderNpc(sect);
        var rec = coupRecord();
        var fails = (rec && rec.sect === sect) ? (Number(rec.fails) || 0) : 0;
        var lack = [];
        if (isThrone(sect) || rank === 0) return { ok: false, done: true, lack: lack, rate: 0, items: [] };
        if (rank > 2) lack.push('长老以上才动得了这个念头（现居' + rankName(rank) + '）');
        if (contrib < 3000) lack.push('没有三千贡献傍身，执事堂的门都进不去（现有 ' + contrib + '）');
        if (!ln || ln.isDead) lack.push('掌门不在山中——无位可夺');
        else if (isCompanion(ln)) lack.push('内宅的事，轮不到刀兵（位分不换）');
        var items = [['底子', 20]];
        if (famineNow(sect)) items.push(['门中断粮，人心浮动', 15]);
        var it = internal(sect);
        if (it && (Number(it.morale) || 50) < 40) items.push(['士气低迷', 10]);
        var tier = powerTier(sect);
        if (tier === '式微' || tier === '残破' || tier === '名存实亡') items.push(['座次跌落，门中思变', 10]);
        if (ln && !isCompanion(ln) && leaderAff(sect) < 30) items.push(['掌门失了人心', 10]);
        if (rank <= 1) items.push(['你已是副掌门，印信在手', 10]);
        if (tourneyWon(sect)) items.push(['大比夺冠之威', 10]);
        try { if (typeof W.getRealmTier === 'function' && W.getRealmTier((cd() || {}).realm) >= 4) items.push(['元婴修为镇得住场', 5]); } catch (e) {}
        var sum = 0; items.forEach(function (x) { sum += x[1]; });
        if (fails > 0) items.push(['谋位不遂的旧账（' + fails + '回）', -fails * 10]);
        sum -= fails * 10;
        var rate = Math.max(10, Math.min(80, sum));
        return { ok: lack.length === 0, lack: lack, items: items, rate: rate, fails: fails };
    }

    // ============ 二 · 登位结算（传位夺位共用） ============
    function enthrone(sect, way) {
        var d = ds();
        if (!d || !sect) return false;
        var oldLeader = (W.SECT_LEADER_NAMES && W.SECT_LEADER_NAMES[sect]) || (sect + '掌门');
        d.rank = 0;
        d.rankName = '掌门';
        flags()['sect_throne'] = { sect: sect, day: absDay(), way: way, oldLeader: oldLeader };
        try { W.SECT_LEADER_NAMES = W.SECT_LEADER_NAMES || {}; W.SECT_LEADER_NAMES[sect] = playerName(); } catch (e) {}
        var ln = leaderNpc(sect);
        if (ln && !ln.isDead) { // 第十三波：临终托付时老掌门已不在——闭关与情分的戏只演给活人
            ln._throneRetired = true;
            ln.occupation = '闭关';
            try {
                ln.relationship = ln.relationship || {};
                var base = Number(ln.relationship.affection || ln.affection || 0);
                var next = way === 'seize' ? Math.max(0, base - 40) : Math.min(100, base + 20);
                ln.relationship.affection = next;
                if (ln.affection != null) ln.affection = next;
            } catch (e2) {}
        }
        try { if (cd()) cd().fame = Math.min(99999, (Number(cd().fame) || 0) + (way === 'seize' ? 5 : 10)); } catch (e3) {}
        if (way === 'transmit') {
            chron(sect, '祖师堂前香案设齐——老掌门当众传位：印信、剑与一山门的人，都交到了' + playerName() + '手里。旧掌门自即日起闭关，山门换了当家人。');
            street('「' + sect + '」传位了——老掌门亲捧印信，新掌门是熬上来的' + playerName() + '。茶棚里说：这是众望所归。');
            journal('掌门传位', '「' + sect + '」老掌门出关传位，' + playerName() + '接印掌山。一场佳话，江湖传了许久。');
        } else if (way === 'bequeath') {
            // 第十三波 · 临终托付：老掌门不在了，众长老连夜捧印——承接大统，不是夺位
            chron(sect, '老掌门不在了。灵位前，' + playerName() + '接印视事——众长老率全门下拜。山门缟素未除，灯火重新点起。');
            street('「' + sect + '」办完丧事换了幡——老掌门故去，副掌门灵前接印。茶棚里说：这是承接大统，名正言顺。');
            journal('灵前接印', '「' + sect + '」老掌门故去，' + playerName() + '灵前接印视事。山门有继，道统不断。');
        } else {
            chron(sect, '那一日山门换幡——执事堂封了山道，祖师堂的香烧得比哪天都早。旧掌门自此闭关，没人敢大声说话。新掌门：' + playerName() + '。');
            street('「' + sect + '」换幡了。茶棚里压着嗓子说：执事堂的人连夜换了岗——旧掌门闭关，新掌门是' + playerName() + '。');
            journal('山门换幡', '「' + sect + '」门中生变，' + playerName() + '执掌山门。旧掌门闭关不出——位子换了人，山还是那座山。');
            // 第十三波 · 旧部风波：夺位不是终点——第七夜有老长老拄杖来问，答不好，人心真会凉
            flags()['sect_throne_aftermath'] = { sect: sect, day: absDay() || 1, stage: 0, answered: false };
        }
        try { if (typeof W.updateSectUI === 'function') W.updateSectUI(); } catch (e4) {}
        try { if (typeof W.updateCultivationUI === 'function') W.updateCultivationUI(); } catch (e5) {}
        return true;
    }

    // ============ 三 · 读档恢复（称呼与职位不回退） ============
    function restoreThrone() {
        var f = throneFlag();
        if (!f || !f.sect) return false;
        if (mySect() !== f.sect) return false;
        var d = ds();
        if (d && d.rank !== 0) { d.rank = 0; d.rankName = '掌门'; }
        try { W.SECT_LEADER_NAMES = W.SECT_LEADER_NAMES || {}; if (W.SECT_LEADER_NAMES[f.sect] !== playerName()) W.SECT_LEADER_NAMES[f.sect] = playerName(); } catch (e) {}
        return true;
    }
    // ============ 三·五 · 临终托付与旧部风波（第十三波） ============
    // 老掌门故去/不知所踪（寿元系统的死亡是硬删，无事件可订——按「查无此人」对表）：
    // 副掌门以上、功绩六千为凭，众长老连夜捧印——只请一次，辞了不再请。
    function bequeathCheck() {
        try {
            var sect = mySect();
            if (!sect) return;
            var d = ds() || {};
            if (isThrone(sect) || d.rank === 0) return;
            if ((d.rank == null ? 7 : d.rank) > 1) return;
            if ((Number(d.contribution) || 0) < 6000) return; // 功绩不够，长老们不会连夜来敲你的门
            var f = flags();
            if (f['sect_throne_bequeath']) return; // 只请一次
            var ln = leaderNpc(sect);
            if (ln && !ln.isDead) return; // 老掌门还在
            try { if (typeof W.sectIsRuined === 'function' && W.sectIsRuined(sect)) return; } catch (e) {} // 塌了的山门不谈接印
            f['sect_throne_bequeath'] = { sect: sect, day: absDay() };
            var oldName = (W.SECT_LEADER_NAMES && W.SECT_LEADER_NAMES[sect]) || ((ln && ln.name) || '老掌门');
            var body = para('三更天，你的院门被敲响——门中几位长老站在门外，为首那位捧着掌门的印。') +
                para('「' + oldName + '不在了。」长老的声音哑着，「山不可一日无主。我等合议，请副掌门接印——这是全门的意思。」') +
                para('印是温的。山门外，天还没亮。') +
                '<div class="flex gap-2 mt-2">' +
                btn('接印——把这座山扛起来', 'window._throneBequeath(true)') +
                btn('暂辞——德薄，恐难当此任', 'window._throneBequeath(false)', 'bg-gray-600 hover:bg-gray-500') + '</div>';
            chron(sect, '老掌门不在了——长老们连夜捧印至副掌门门外。山门换不换当家人，天亮前见分晓。');
            modal('临终托付 · ' + sect, body);
        } catch (e2) {}
    }
    W._throneBequeath = function (accept) {
        try {
            var sect = mySect();
            if (!sect) return;
            if (accept) {
                enthrone(sect, 'bequeath');
            } else {
                flags()['sect_throne_bequeath'] = { sect: sect, day: absDay(), declined: true };
                chron(sect, '副掌门辞了印——「德薄，恐难当此任。」长老们捧印回去，山门缟素如故。');
                log('🕯️ 你辞了印。长老们看了你很久，没说什么，走了——这件事，不会再有第二次。', 'info');
                msg('印还回去了。山门缟素，丧仪照旧。', 'info');
            }
        } catch (e) {}
        try { var ov = document.getElementById('xianxia-modal-overlay'); if (ov) ov.remove(); } catch (e3) {}
    };
    // 夺位之后的第七夜：老长老拄杖来问——宽待/立威/厚赏三答，或悬着不答（三十日后人心真凉）
    function aftermathTick() {
        try {
            var f = flags();
            var am = f['sect_throne_aftermath'];
            if (!am || !am.sect) return;
            if (mySect() !== am.sect || (ds() || {}).rank !== 0) { delete f['sect_throne_aftermath']; return; }
            var day = absDay();
            var it = internal(am.sect);
            if (!am.stage && day >= (am.day || 0) + 7) {
                am.stage = 1;
                var body = para('换幡第七夜，一位侍奉过两代掌门的老长老求见祖师堂——他没带条陈，只带了一根旧杖。') +
                    para('「老朽在门中六十年。」他不跪也不拜，「新掌门夺位的手段，老朽都看在眼里。今日只问一句：山门里的旧人，你打算怎么待？」') +
                    '<div class="flex flex-wrap gap-2 mt-2">' +
                    btn('宽待——请长老上座，旧人的份例照旧安置', 'window._throneAftermath(\'kind\')') +
                    btn('立威——门规如炉，顺者留，逆者走', 'window._throneAftermath(\'stern\')', 'bg-red-800 hover:bg-red-700') +
                    btn('厚赏——旧人重赏，银子说话（公库出四十）', 'window._throneAftermath(\'buy\')', 'bg-yellow-700 hover:bg-yellow-600') + '</div>';
                chron(am.sect, '换幡第七夜，老长老拄杖上了祖师堂——满山的人心，都看着这一夜怎么答。');
                modal('旧部人心 · 第七夜', body);
                return;
            }
            if (am.stage === 1 && !am.answered && day >= (am.day || 0) + 30) {
                if (it) it.morale = Math.max(0, (Number(it.morale) || 50) - 5);
                chron(am.sect, '老长老等了一个月，没等到一句话——他拄着杖下了山。门里的旧人，开始悄悄收拾行囊。');
                street('「' + am.sect + '」有人看见老长老下山——背影笔直，没人敢送。');
                log('🕯️ 老长老等了一个月，没等到你的答复。他下山那日，门里安静得可怕。（士气 -5，旧人离心）', 'warning');
                delete f['sect_throne_aftermath'];
            }
        } catch (e) {}
    }
    W._throneAftermath = function (how) {
        try {
            var f = flags();
            var am = f['sect_throne_aftermath'];
            if (!am || am.answered) return;
            am.answered = true;
            var sect = am.sect;
            var it = internal(sect);
            if (how === 'kind') {
                if (it) it.morale = Math.min(100, (Number(it.morale) || 50) + 3);
                chron(sect, '新掌门请老长老上座，旧人的份例一一安置——长老坐到三更，走时只说了四个字：「看好山门。」');
                log('🕯️ 老长老坐到三更。他在山门口回头：「看好山门。」旧人的人心，安了一半。（士气 +3）', 'success');
            } else if (how === 'stern') {
                if (it) { it.morale = Math.max(0, (Number(it.morale) || 50) - 2); it.defense = (Number(it.defense) || 0) + 2; }
                chron(sect, '新掌门在祖师堂前立了规矩：「门规如炉。」老长老盯着他看了半晌，把杖顿了顿，走了——次日夜巡的册子上，一个名字都没少。');
                log('⚖️ 你说：门规如炉，顺者留，逆者走。旧人不敢怨——他们怕的不是严，是偏。（士气 -2，防务 +2）', 'info');
            } else {
                if (it) {
                    it.resources = Math.max(0, (Number(it.resources) || 0) - 40);
                    it.morale = Math.min(100, (Number(it.morale) || 50) + 1);
                }
                chron(sect, '新掌门给旧人发了重赏——银子到了，人心安了，只是老长老一文未受。');
                log('💰 旧人重赏（公库 -40）。银子买得到人手，买不到那根旧杖——老长老一文未受，拄着杖走了。', 'info');
            }
            delete f['sect_throne_aftermath'];
        } catch (e) {}
        try { var ov = document.getElementById('xianxia-modal-overlay'); if (ov) ov.remove(); } catch (e2) {}
    };

    try {
        var hook = function (payload) {
            try {
                var day = (payload && typeof payload.newDay === 'number') ? payload.newDay : absDay();
                restoreThrone();
                if (day && day % 30 === 0) restoreThrone();
                bequeathCheck();
                aftermathTick();
            } catch (e) {}
        };
        if (W.EventBus && W.EventBus.on) W.EventBus.on('newDay', hook);
        else if (W.timeSystem && typeof W.timeSystem.onNewDaySubscribe === 'function') W.timeSystem.onNewDaySubscribe(hook);
    } catch (e) {}
    restoreThrone();

    // ============ 四 · 祖师堂（一个入口三种面孔：风向 / 两条路 / 掌门案头） ============
    function storeLine(sect) {
        var it = internal(sect);
        if (!it) return '';
        return '<p class="text-xs text-gray-500 mb-2">公库：灵石 ' + Math.round(Number(it.resources) || 0) +
            ' · 粮 ' + Math.round(Number(it.grain) || 0) + ' · 材 ' + Math.round(Number(it.material) || 0) +
            ' · 士气 ' + Math.round(Number(it.morale) || 50) + '</p>';
    }
    function deskView(sect) {
        var h = '<p class="text-sm text-amber-400 mb-1">掌门案头</p>' +
            '<p class="text-xs text-gray-400 mb-2">山门里的事，如今是你拍板——时机成熟的都列在这儿，办一桩记一桩，钱粮走公库。</p>' + storeLine(sect);
        var decs = [];
        try { decs = (W.SectGov && typeof W.SectGov.decisionList === 'function') ? (W.SectGov.decisionList() || []) : []; } catch (e) {}
        var it = internal(sect);
        var ready = [];
        decs.forEach(function (dec) {
            if (!dec || !dec.id) return;
            var okk = false;
            try { okk = it ? dec.when(it, sect) : false; } catch (e2) { okk = false; }
            if (okk) ready.push(dec);
        });
        if (!ready.length) {
            h += '<p class="text-sm text-gray-500 mb-2">门中诸事平顺——没有非要你今天拍板的事。粮草、士气、库房的底数都在上头，心里有数就好。</p>';
        } else {
            h += '<div class="space-y-2 mb-2">' + ready.map(function (dec) {
                return '<button onclick="window._throneDecide(\'' + dec.id + '\')" class="w-full text-left px-3 py-2 rounded border border-amber-700/60 bg-amber-900/20 hover:bg-amber-900/40">' +
                    '<span class="text-sm text-amber-200">' + dec.name + '</span>' +
                    '<span class="text-xs text-gray-400 ml-2">时机已到——点了就办，账入编年</span></button>';
            }).join('') + '</div>';
        }
        // 第十一波 · 掌门威仪：案头空的日子也有掌门的功课——巡山走一圈，讲道月度开坛
        h += '<div class="flex gap-2 mb-2">' +
            '<button onclick="window.doSectPatrol && (window.doSectPatrol(), window.openThronePanel())" class="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs px-3 py-2 rounded">巡山</button>' +
            '<button onclick="window.doSectPreach && (window.doSectPreach(), window.openThronePanel())" class="flex-1 bg-purple-800 hover:bg-purple-700 text-white text-xs px-3 py-2 rounded">开坛讲道</button>' +
            '</div>';
        h += '<p class="text-xs text-gray-500">传位而来的是佳话，山门念你的好；案头无小事——每一桩，弟子们都看着。</p>';
        return h;
    }
    function lackList(lack) {
        return '<div class="mb-2">' + lack.map(function (x) { return '<p class="text-xs text-gray-500 mb-1">· ' + x + '</p>'; }).join('') + '</div>';
    }
    W.openThronePanel = function () {
        var sect = mySect();
        if (!sect) { msg('还没入门——祖师堂是门中人的去处。', 'warning'); return; }
        var d = ds() || {};
        var h = '';
        if (isThrone(sect) || d.rank === 0) {
            h = deskView(sect);
        } else {
            var ts = transmitState(sect);
            var cs = coupState(sect);
            h = '<p class="text-xs text-gray-400 mb-2">现居「' + rankName(d.rank == null ? 7 : d.rank) + '」。祖师堂里供着历代掌门——位子的事，也只在这里说。</p>';
            // 传位
            h += '<div class="border border-amber-700/50 bg-amber-900/10 rounded p-2 mb-3">';
            h += '<p class="text-sm text-amber-300 mb-1">传位 · 老掌门心甘情愿</p>';
            h += '<p class="text-xs text-gray-400 mb-1">长老以上、贡献六千为凭、老掌门认可（好感六十）——条件齐了，祖师堂设香案，印信相授。</p>';
            if (ts.ok) {
                h += btn('行传位之礼——请老掌门出山主持', 'window._closeModal && window._closeModal(); window.doThroneTransmit()', 'bg-amber-700 hover:bg-amber-600');
            } else {
                h += lackList(ts.lack);
            }
            h += '</div>';
            // 夺位
            h += '<div class="border border-red-800/60 bg-red-900/10 rounded p-2 mb-2">';
            h += '<p class="text-sm text-red-300 mb-1">夺位 · 门中无道，逼宫</p>';
            if (cs.lack.length && !cs.ok) {
                h += '<p class="text-xs text-gray-400 mb-1">执事堂的门不好进——打点要真花五百贡献，成与不成，都是赌上身家。</p>';
                h += lackList(cs.lack);
            } else {
                h += '<p class="text-xs text-gray-400 mb-1">成功率是明账：</p><div class="mb-2">' +
                    cs.items.map(function (x) {
                        return '<p class="text-xs ' + (x[1] >= 0 ? 'text-gray-400' : 'text-red-300') + '">· ' + x[0] + '　' + (x[1] > 0 ? '+' : '') + x[1] + '</p>';
                    }).join('') +
                    '<p class="text-xs text-amber-300 mt-1">合计：' + cs.rate + '%（封顶八成——没有十成的逼宫）</p></div>';
                h += '<p class="text-xs text-gray-500 mb-2">败了：贡献折半、降一级、记档「谋位不遂」——不逐不杀，但执事堂的人认得你了。</p>';
                h += btn('动手——五百贡献打点执事堂', 'window._closeModal && window._closeModal(); window.doThroneCoup()', 'bg-red-800 hover:bg-red-700');
            }
            h += '</div>';
        }
        modal('祖师堂 · ' + sect, h);
    };

    // ============ 五 · 传位之礼 ============
    W.doThroneTransmit = function () {
        var sect = mySect();
        if (!sect) { msg('还没入门。', 'warning'); return false; }
        var ts = transmitState(sect);
        if (!ts.ok) { msg((ts.lack[0] || '眼下还传不成位。'), 'warning'); return false; }
        var ln = leaderNpc(sect);
        var scene = para('你在祖师堂外站了半个时辰，才等到传召。') +
            para('堂内香案设齐，历代掌门的牌位擦得发亮。' + ts.leader + '站在案前，手里捧着一方旧印、一柄剑——印是开山祖师传下来的，剑是他自己的。') +
            para('「我看过你做的每一件事。」他把印放进你手里，又把剑搁在印上，「山门交给你。我替祖师看着你——看着你把这盏灯，点得比我亮。」') +
            para('你捧着印，跪下去，磕了三个头。起身时，堂外站满了门中弟子——不知是谁先喊的第一声「掌门」，随后漫山都是。') +
            '<p class="text-xs text-amber-300 mt-2">自今日起，你是「' + sect + '」掌门。俸禄顶格、诸门通行、门务你拍板——旧掌门转闭关，山门里再没有比你高的位子。（名望 +10，全江湖改口）</p>';
        modal('传位 · 祖师堂', scene);
        enthrone(sect, 'transmit');
        return true;
    };

    // ============ 六 · 夺位（逼宫） ============
    W.doThroneCoup = function () {
        var sect = mySect();
        if (!sect) { msg('还没入门。', 'warning'); return false; }
        var cs = coupState(sect);
        if (cs.done) { msg('你已经是掌门了。', 'info'); return false; }
        if (!cs.ok) { msg((cs.lack[0] || '执事堂的门进不去。'), 'warning'); return false; }
        var rec = coupRecord();
        if (rec && rec.sect === sect && rec.day && (absDay() - rec.day) < 30) {
            msg('执事堂刚换过岗哨，你的脸他们还记得——等风头过去，下月再说。', 'warning');
            return false;
        }
        if (!spendC(500, '夺位·打点执事堂')) { msg('打点执事堂要五百贡献——人情不白要，先攒够。', 'error'); return false; }
        var roll = Math.random() * 100;
        var ln = leaderNpc(sect);
        if (roll < cs.rate) {
            var scene = para('三更，执事堂的火把先亮，随后是三峰各院的灯。') +
                para('你带着执事堂的人上祖师堂时，' + (ln ? ln.name : '老掌门') + '已经坐在堂中了——他早知道会有这一夜，只是没料到来得这样快。') +
                para('「印在案上。」他看了你很久，「山门里的人心，你比我清楚。拿去吧——我累了。」') +
                para('天亮时，山门换幡。没人反抗，也没人敢大声说话。') +
                '<p class="text-xs text-amber-300 mt-2">自今日起，你是「' + sect + '」掌门。旧掌门闭关不出（情分折了四成）——位子到手了，人心要自己再挣一遍。（名望 +5，编年与街谈都记着这一夜）</p>';
            modal('夺位 · 那一夜', scene);
            enthrone(sect, 'seize');
            return true;
        }
        // 败局
        var d = ds();
        var contrib = Number(d.contribution) || 0;
        d.contribution = Math.floor(contrib / 2);
        try { if (typeof W.sectLedgerNote === 'function') W.sectLedgerNote(-(contrib - d.contribution), '谋位不遂·功绩折半'); } catch (e) {}
        var oldRank = (d.rank == null ? 7 : d.rank);
        if (oldRank < 7) { d.rank = oldRank + 1; d.rankName = rankName(d.rank); }
        if (ln) {
            try {
                ln.relationship = ln.relationship || {};
                ln.relationship.affection = Math.max(0, Number(ln.relationship.affection || 0) - 20);
                if (ln.affection != null) ln.affection = ln.relationship.affection;
            } catch (e2) {}
        }
        flags()['sect_throne_coup'] = { sect: sect, day: absDay(), fails: cs.fails + 1 };
        chron(sect, '有人夜闯祖师堂——火把还没点齐，执事堂的人就把山道封了。谋位不遂，' + playerName() + '降了一级，功绩折半。山门里安静了几天。');
        street('「' + sect + '」有人逼宫没成——茶棚里说了三天：胆子不小，火候不到。');
        log('你输了。祖师堂前的火把灭得比亮起来还快——执事堂的人显然早有准备。（贡献折半、降一级、记档「谋位不遂」；执事堂认得你了，再动手更难）', 'error');
        msg('谋位不遂——贡献折半、降一级，山门里的人都知道了。', 'error');
        return false;
    };

    // ============ 七 · 掌门案头 · 办理门务 ============
    W._throneDecide = function (id) {
        var sect = mySect();
        if (!sect || (ds() || {}).rank !== 0 || !isThrone(sect)) { msg('案头是掌门的东西。', 'warning'); return; }
        var r = null;
        try { if (W.SectGov && typeof W.SectGov.leaderDecide === 'function') r = W.SectGov.leaderDecide(sect, id); } catch (e) {}
        if (r && r.ok) msg('「' + r.name + '」办妥了——账已入编年。', 'success');
        else msg((r && r.text) || '这桩门务没办成。', 'warning');
        W.openThronePanel();
    };

    // ============ 八 · 探针（测试用） ============
    W.sectThroneProbe = function () {
        var sect = mySect();
        if (!sect) return null;
        var f = throneFlag();
        return {
            sect: sect, rank: (ds() || {}).rank, isLeader: isThrone(sect) || (ds() || {}).rank === 0,
            flag: f ? { sect: f.sect, way: f.way, oldLeader: f.oldLeader } : null,
            leaderListed: (W.SECT_LEADER_NAMES || {})[sect] || null,
            transmit: transmitState(sect), coup: coupState(sect)
        };
    };
    console.log('[sect-throne] 掌门位已注册：传位（功绩+认可）/ 夺位（明账成功率，封顶八成）/ 掌门案头（门务玩家拍板）/ 读档称呼不回退');
})();
