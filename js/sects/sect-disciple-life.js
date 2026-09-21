// ==================== sect-disciple-life.js - 门里的日子（第十四波 · 弟子日子五线） ====================
// 玩家问「身为弟子还能干啥」——五条缺口一次补齐，全部走真接口真账：
//   一 · 门中排行榜：贡献/差事/切磋三张月榜（自己的数字全是真账，同门的名次由执事按月报出），
//        月底结算：三甲有名望与编年（比着干才有奔头）；
//   二 · 同门交厚：拼酒/说心事/搭手练三件小事攒交情——生人→点头→熟络→知己→莫逆五档；
//        知己切磋有得（懂你路数）、莫逆份例加厚（会替你说话，俸禄真涨，走既有份例结算）；
//   三 · 求见掌门：三日一谒（执事也要喘气）——掌门认你的脸（好感）决定见不见、听不听；
//        求指点（亲授半日，下次参悟翻倍——复用师父请益的真机制）/诉冤屈/领差事（酬金真从公库出）/告假下山；
//   四 · 邪派黑线：仅邪派门下、仅深夜——夜闯藏经阁偷学高一层的书（偷来的只到九成，最后一成还得正经请传；
//        被抓真罚：贡献折、记档、再犯更难），或贿赂守阁长老（自掏五十，当夜手气+30%）；
//   五 · 自请下山历练：告假离山份例即停（不干活不领钱），回山按离山天数结算——
//        见识（修炼领悟）/风尘（名望）/功绩各有进账，走得越久机会越大，可位子也会被人惦记（久假功绩打折）。
// 纪律：零外文字母；限额全走「制度话」（三日一谒/一夜一闯/一日一坛），不带计数器口吻；
//       每一笔钱有来路（拼酒自掏、差事酬金公库真扣、历练卖的是山里打的野味）。
(function () {
    'use strict';
    var W = window;
    if (typeof W === 'undefined') return;

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
    function hour() { try { return Number(W.timeSystem && W.timeSystem.gameTime ? W.timeSystem.gameTime.currentHour : 12) || 0; } catch (e) { return 12; } }
    function advance(min, why) { try { if (W.timeSystem && W.timeSystem.advanceTime) W.timeSystem.advanceTime(min, why || '门中的日子'); } catch (e) {} }
    function ds() { return W.discipleState || null; }
    function cd() { return W.currentCharData || null; }
    function mySect() { try { var d = ds(); return d && d.isInSect ? (d.sectName || d.sectId) : null; } catch (e) { return null; } }
    function flags() { return (W.eventFlags = W.eventFlags || {}); }
    function log(m, t) { try { if (W.gameLog && W.gameLog.add) W.gameLog.add(m); } catch (e) {} }
    function msg(m, t) { if (typeof W.showMessage === 'function') W.showMessage(m, t || 'info'); }
    function modal(t, b) { if (typeof W.showModal === 'function') W.showModal(t, b); }
    function para(t) { return '<p class="text-sm text-gray-300 leading-relaxed mb-2">' + t + '</p>'; }
    function btn(label, onclick, cls) { return '<button onclick="' + onclick + '" class="' + (cls || 'bg-amber-700 hover:bg-amber-600') + ' text-xs px-3 py-2 rounded text-left">' + label + '</button>'; }
    function playerName() { try { return (cd() || {}).name || '门下'; } catch (e) { return '门下'; } }
    function internal(sect) { return (W.SECT_INTERNAL && W.SECT_INTERNAL[sect]) || null; }
    function chron(sect, text) { try { if (W.SectGov && W.SectGov.chronicle) { W.SectGov.chronicle(sect, text); return; } } catch (e) {} }
    function addC(n, r) { try { if (typeof W.sectAddContribution === 'function') return W.sectAddContribution(n, r); } catch (e) {} var d = ds(); if (d) d.contribution = (Number(d.contribution) || 0) + n; return d && d.contribution; }
    function addFame(n) { try { if (cd()) cd().fame = Math.min(99999, Math.max(0, (Number(cd().fame) || 0) + n)); } catch (e) {} }
    function stones() {
        try {
            if (W.DataManager && typeof W.DataManager.getSpiritStones === 'function') return W.DataManager.getSpiritStones();
        } catch (e) {}
        return (W.currentCharData && W.currentCharData.spiritStones) || 0;
    }
    function deductStones(n) {
        try {
            if (W.DataManager && typeof W.DataManager.deductSpiritStones === 'function') return W.DataManager.deductSpiritStones(n);
        } catch (e) {}
        var c = W.currentCharData;
        if (c && (c.spiritStones || 0) >= n) { c.spiritStones -= n; return true; }
        return false;
    }
    function addStones(n) {
        try {
            if (W.DataManager && typeof W.DataManager.addSpiritStones === 'function') { W.DataManager.addSpiritStones(n); return; }
        } catch (e) {}
        if (W.inventory && W.inventory.currency) W.inventory.currency.spiritStones = (W.inventory.currency.spiritStones || 0) + n;
        if (W.currentCharData) W.currentCharData.spiritStones = (W.inventory && W.inventory.currency) ? W.inventory.currency.spiritStones : (W.currentCharData.spiritStones || 0) + n;
    }
    // 同门名册：真 NPC（门里注册过的具名弟子），排死人、道侣、掌门（掌门走谒见线）
    function mates(sect) {
        var out = [];
        try {
            var list = (typeof W.getSectNPCs === 'function') ? (W.getSectNPCs(sect) || []) : [];
            for (var i = 0; i < list.length; i++) {
                var n = list[i];
                if (!n || !n.id || n.isDead || n._companionData || n.isCompanion) continue;
                if (String(n.id).indexOf('sect_leader_') === 0) continue;
                out.push(n);
            }
        } catch (e) {}
        return out;
    }
    function npcById(id) { try { return W.npcManager && W.npcManager.getNPC ? W.npcManager.getNPC(id) : null; } catch (e) { return null; } }
    function bondOf(npc) {
        if (!npc) return null;
        if (!npc._bond) npc._bond = { lvl: 0 };
        return npc._bond;
    }
    function bondWord(l) { return l >= 70 ? '莫逆之交' : l >= 40 ? '知己' : l >= 20 ? '熟络' : l >= 1 ? '点头之交' : '生人'; }
    W.sectBondLevel = function (npcId) { var b = bondOf(npcById(npcId)); return b ? (Number(b.lvl) || 0) : 0; };
    // 莫逆会替你说话：份例加厚（每人 +5%，封顶两人）——由俸禄结算真消费
    W.sectBrotherBonus = function () {
        try {
            var sect = mySect();
            if (!sect) return 0;
            var n = 0, list = mates(sect);
            for (var i = 0; i < list.length; i++) { if ((bondOf(list[i]).lvl || 0) >= 70) n++; }
            return Math.min(0.1, n * 0.05);
        } catch (e) { return 0; }
    };
    function seeded(day, sect, salt) {
        var h = (salt || 0) * 7919;
        var s = String(sect || '');
        for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000;
        h = (h + (day || 0) * 131) % 100000;
        h = (h * h * 7 + h * 13 + 11) % 100000;
        return h / 100000;
    }

    // ============ 一 · 门中排行榜 ============
    function monthOf(d) { return Math.floor((d || absDay()) / 30); }
    function boardRows(sect, board) {
        var month = monthOf();
        var d = ds() || {};
        var life = d._facLife || {};
        var myScore = board === 'contrib' ? (Number(d.contribution) || 0)
            : board === 'task' ? (Number(d.tasksCompleted) || 0)
            : (Number(life.sparBest) || 0);
        var rows = [{ name: playerName() + '（你）', score: myScore, me: true }];
        var list = mates(sect).slice(0, 7);
        for (var i = 0; i < list.length; i++) {
            var seed = seeded(month * 31, sect, i * 17 + (board === 'contrib' ? 3 : board === 'task' ? 7 : 11));
            var score = board === 'contrib' ? Math.round(seed * 2400 + (i % 3) * 200)
                : board === 'task' ? Math.round(seed * 30 + 4)
                : Math.round(seed * 8);
            rows.push({ name: list[i].name || '同门', score: score, me: false });
        }
        rows.sort(function (a, b) { return b.score - a.score; });
        return rows;
    }
    W.openSectBoardPanel = function () {
        var sect = mySect();
        if (!sect) { msg('还没入门——榜上没你的名字。', 'warning'); return; }
        var boards = [['contrib', '贡献榜'], ['task', '差事榜'], ['spar', '切磋榜（历史最佳连胜）']];
        var h = '<p class="text-xs text-gray-400 mb-2">执事每月初一张榜——你的数字是真账，同门的名次按月报出。三甲有名望，编年留名。</p>';
        boards.forEach(function (b) {
            var rows = boardRows(sect, b[0]);
            h += '<p class="text-sm text-amber-400 mb-1">' + b[1] + '</p><div class="bg-gray-900/50 rounded p-2 mb-3">';
            rows.slice(0, 8).forEach(function (r, idx) {
                h += '<p class="text-xs ' + (r.me ? 'text-amber-200 font-bold' : 'text-gray-400') + '">' +
                    (idx + 1) + '. ' + r.name + '　' + r.score + '</p>';
            });
            h += '</div>';
        });
        h += '<p class="text-xs text-gray-500">月底放榜：头名名望+3、榜眼+2、探花+1——比着干，才有奔头。</p>';
        modal('门中排行榜 · ' + sect, h);
    };
    function boardSettle() {
        try {
            var day = absDay();
            if (!day || day % 30 !== 0) return;
            var sect = mySect();
            if (!sect) return;
            var f = flags();
            if (f['sect_board_month'] === monthOf(day)) return;
            f['sect_board_month'] = monthOf(day);
            var rows = boardRows(sect, 'contrib');
            var mine = -1;
            for (var i = 0; i < rows.length; i++) { if (rows[i].me) { mine = i; break; } }
            if (mine === 0) { addFame(3); chron(sect, '执事放了月榜：贡献榜头名——' + playerName() + '。山门口有人指着榜念了三遍。'); log('🏆 月榜放榜：贡献榜头名是你。（名望+3，编年留名）', 'success'); }
            else if (mine === 1) { addFame(2); chron(sect, '执事放了月榜：' + playerName() + '列贡献榜第二——差头名一步。'); log('🏅 月榜放榜：贡献榜榜眼。（名望+2）', 'success'); }
            else if (mine === 2) { addFame(1); chron(sect, '执事放了月榜：' + playerName() + '列贡献榜第三。'); log('🎖️ 月榜放榜：贡献榜探花。（名望+1）', 'success'); }
        } catch (e) {}
    }

    // ============ 二 · 同门交厚 ============
    W.openBondPanel = function () {
        var sect = mySect();
        if (!sect) { msg('还没入门。', 'warning'); return; }
        var list = mates(sect).slice(0, 6);
        var h = '<p class="text-xs text-gray-400 mb-2">同门不是名册上的字——拼一坛酒、说一回心事、搭一把手，交情是处出来的。' +
            '知己（四十）切磋有得，莫逆（七十）会替你说话（份例加厚）。</p>';
        if (!list.length) h += '<p class="text-sm text-gray-500">门里还没认识的人——先去演武场 or 膳堂转转。</p>';
        list.forEach(function (n) {
            var b = bondOf(n);
            var d = absDay();
            h += '<div class="bg-gray-900/50 px-3 py-2 rounded border border-gray-700 mb-2">' +
                '<div class="flex justify-between items-center mb-1"><span class="text-gray-100 text-sm">' + (n.name || '同门') +
                ' <span class="text-xs ' + ((b.lvl || 0) >= 70 ? 'text-amber-300' : (b.lvl || 0) >= 40 ? 'text-green-300' : 'text-gray-400') + '">' + bondWord(b.lvl || 0) + '（' + (b.lvl || 0) + '）</span></span></div>' +
                '<div class="flex flex-wrap gap-1">' +
                (b.lastDrink === d ? '<span class="text-xs text-gray-500 self-center">今日的酒坛已经空了</span>'
                    : btn('拼一坛酒（十灵石）', 'window.doBondAction(\'' + n.id + '\',\'drink\')') +
                      ((b.lvl || 0) >= 20 ? (b.lastTalk === d ? '' : btn('说心事', 'window.doBondAction(\'' + n.id + '\',\'talk\')', 'bg-gray-700 hover:bg-gray-600')) : '') +
                      (b.lastSpar === d ? '' : btn('搭手练一场', 'window.doBondAction(\'' + n.id + '\',\'spar\')', 'bg-gray-700 hover:bg-gray-600'))) +
                '</div></div>';
        });
        modal('同门 · ' + sect, h);
    };
    W.doBondAction = function (npcId, kind) {
        var sect = mySect();
        if (!sect) return;
        var npc = npcById(npcId);
        if (!npc || npc.isDead) { msg('寻不到这人。', 'warning'); return; }
        var b = bondOf(npc);
        var d = absDay();
        var before = Number(b.lvl) || 0;
        if (kind === 'drink') {
            if (b.lastDrink === d) { msg('今日的酒坛已经空了——明日再喝。', 'info'); return; }
            if (!deductStones(10)) { msg('摸遍全身凑不出十灵石的酒钱——先去挣两个。', 'warning'); return; }
            b.lastDrink = d; b.lvl = before + 8;
            advance(60, '与同门拼酒');
            log('🍶 你与' + npc.name + '在膳堂拼了一坛浊酒。他话不多，可第三碗下去，把师父骂他的原话都学给你听了。（交情+8，自掏十灵石）', 'success');
        } else if (kind === 'talk') {
            if (before < 20) { msg('还没熟到能说心事的份上——先拼几回酒。', 'info'); return; }
            if (b.lastTalk === d) { msg('心事说一回就够——说多了就淡了。', 'info'); return; }
            b.lastTalk = d; b.lvl = before + 5;
            advance(90, '与同门说心事');
            log('🌙 寮房里灯挑亮了，' + npc.name + '说了他上山前的事。你听完，把自己那桩也说了。（交情+5）', 'info');
        } else if (kind === 'spar') {
            if (b.lastSpar === d) { msg('今日已经搭过手了——胳膊也要歇。', 'info'); return; }
            b.lastSpar = d; b.lvl = before + 6;
            advance(90, '与同门搭手');
            log('🤺 你与' + npc.name + '在演武场搭手练了一场——他替你喂招，你替他补漏。（交情+6）', 'info');
        } else return;
        // 档位跨越有戏
        var now = Number(b.lvl) || 0;
        if (before < 40 && now >= 40) {
            chron(sect, playerName() + '与' + npc.name + '处成了知己——演武场上再见面，彼此的路数都不用试探了。');
            log('🤝 你与' + npc.name + '成了知己。往后切磋，胜负之外另有收获。', 'success');
        }
        if (before < 70 && now >= 70) {
            b.lvl = 70 + Math.min(now - 70, 30); // 莫逆之上还有深浅，但名分到顶
            chron(sect, playerName() + '与' + npc.name + '拜了把子——一碗浊酒，一句话：门里门外，互相照应。');
            log('🍵 你与' + npc.name + '拜了把子。执事记档时多看了你们一眼——莫逆之交，份例上都有体面。（俸禄会替你说话）', 'success');
        }
        W.openBondPanel();
    };

    // ============ 三 · 求见掌门 ============
    function leaderNpc(sect) { try { return npcById('sect_leader_' + sect); } catch (e) { return null; } }
    function leaderAff(sect) {
        var n = leaderNpc(sect);
        if (!n) return 0;
        return Math.round(Number((n.relationship && n.relationship.affection) || n.affection || 0));
    }
    W.openAudiencePanel = function () {
        var sect = mySect();
        if (!sect) { msg('还没入门。', 'warning'); return; }
        var ln = leaderNpc(sect);
        var f = flags();
        var lastDay = f['sect_audience_day'] || 0;
        var wait = Math.max(0, 3 - (absDay() - lastDay));
        var h = '';
        if (!ln || ln.isDead) {
            h = para('掌门不在山中——执事堂的香案空着。');
        } else if (wait > 0 && lastDay) {
            h = para('执事拦在堂前：「掌门连日理事，' + (wait === 1 ? '明日' : '过两日') + '再来递话。」（三日一谒，执事也要喘气）');
        } else {
            var aff = leaderAff(sect);
            var face = aff >= 60 ? '掌门认得你的脸——递进去的帖子，他多半会看。' : aff >= 20 ? '掌门对你有几分印象——见是能见，话听多少看你的事。' : '掌门还不认得你——执事未必肯替你递话。';
            h = para(face + '（认可 ' + aff + '）');
            h += '<div class="flex flex-wrap gap-1">' +
                btn('求指点——请掌门点拨修行（亲授半日，下次参悟翻倍）', 'window.doAudience(\'teach\')') +
                btn('诉冤屈——门中有人做事不地道', 'window.doAudience(\'grievance\')', 'bg-gray-700 hover:bg-gray-600') +
                btn('领差事——掌门手里总有缺人的活（酬金公库出）', 'window.doAudience(\'errand\')', 'bg-gray-700 hover:bg-gray-600') +
                btn('告假下山——自请历练（份例停发，回山结算）', 'window.doAudience(\'leave\')', 'bg-sky-800 hover:bg-sky-700') +
                '</div>';
        }
        var tr = flags()['sect_training'];
        if (tr && !tr.returned) h += '<p class="text-xs text-sky-300 mt-2">你正在山下历练（离山第 ' + Math.max(0, absDay() - (tr.startDay || 0)) + ' 天）——回山找执事销假。</p>';
        modal('求见掌门 · ' + sect, h);
    };
    W.doAudience = function (kind) {
        var sect = mySect();
        if (!sect) return;
        var ln = leaderNpc(sect);
        if (!ln || ln.isDead) { msg('掌门不在山中。', 'info'); return; }
        var f = flags();
        var d = absDay();
        if ((f['sect_audience_day'] || 0) === d || (f['sect_audience_day'] && d - f['sect_audience_day'] < 3)) {
            msg('执事拦在堂前：「掌门连日理事，过两日再来递话。」', 'info');
            return;
        }
        var aff = leaderAff(sect);
        if (aff < 20) {
            f['sect_audience_day'] = d;
            log('🚪 执事把你的帖子压下了：「掌门日理万机——你先把门里的差事做出个样子来。」（脸生，话递不进去）', 'warning');
            msg('执事没替你递话——先把差事做出个样子，或送些心意结个善缘。', 'warning');
            return;
        }
        f['sect_audience_day'] = d;
        try { ln.relationship = ln.relationship || {}; ln.relationship.affection = Math.min(100, aff + 1); } catch (e) {}
        if (kind === 'teach') {
            advance(120, '掌门亲授');
            var dd = ds();
            if (dd) dd._masterBlessDay = d; // 复用「师父请益」的真机制：下次藏经阁参悟翻倍
            log('📖 掌门在静室指点了你半日——一句「气走偏锋」，把你憋了三个月的关口点透了。（下次参悟，事半功倍）', 'success');
            msg('掌门亲授半日——下次藏经阁参悟翻倍。', 'success');
        } else if (kind === 'grievance') {
            advance(60, '掌门堂前诉冤');
            addC(5, '诉冤·掌门过问');
            chron(sect, '有弟子堂前诉冤，掌门过问——当日执事就把人和稀泥的案子重断了。门里人说：堂上的话，有人听。');
            log('⚖️ 你把那桩不地道的事一五一十说了。掌门听完只问了执事一句「有这么回事？」——第二天，案重断了。（功绩+5）', 'success');
        } else if (kind === 'errand') {
            var roll = seeded(d, sect, 5);
            var it = internal(sect);
            var pay = 40, stonePay = 20, need = roll < 0.34 ? 180 : roll < 0.67 ? 240 : 300;
            var jobName = roll < 0.34 ? '给山下盟家递一封急信' : roll < 0.67 ? '押一批冬粮去分舵' : '替门里清一伙摸进药田的蟊贼';
            var cde = cd();
            if (cde && (Number(cde.energy) || 0) < 20) { msg('你眼里全是血丝——掌门看了看你：「歇好了再来领活。」（精力不足二十）', 'info'); f['sect_audience_day'] = 0; return; }
            if (cde) cde.energy = Math.max(0, (Number(cde.energy) || 0) - 20);
            advance(need, '掌门差事·' + jobName);
            if (it && (Number(it.resources) || 0) >= stonePay) { it.resources = (Number(it.resources) || 0) - stonePay; addStones(stonePay); }
            else stonePay = 0; // 公库不凑手，酬金只剩功绩（不凭空印钱）
            addC(pay, '掌门差事·' + jobName);
            chron(sect, '掌门点了' + playerName() + '一桩差事：' + jobName + '。办得干净利落。');
            log('📜 差事：' + jobName + '。' + (stonePay ? '酬金灵石' + stonePay + '（公库出的）+功绩' + pay + '。' : '库里不凑手，掌门记了你功绩' + pay + '——「钱的事，委屈你。」') + '（真耗精力与时辰）', 'success');
        } else if (kind === 'leave') {
            W.doLeaveTraining();
            return;
        }
        W.openAudiencePanel();
    };

    // ============ 四 · 邪派黑线 ============
    function isDarkSect(sect) {
        try { return ((W.sectsData || {})[sect] || {}).type === '邪派'; } catch (e) { return false; }
    }
    function nightNow() { var h = hour(); return h >= 21 || h < 5; }
    function stealTarget(sect) {
        try {
            var arts = (typeof W.getSectArts === 'function') ? (W.getSectArts(sect) || []) : [];
            var ins = (ds() || {}).artInsights || {};
            var best = null;
            for (var i = 0; i < arts.length; i++) {
                var a = arts[i];
                var tier = Number(a.tier) || 1;
                var ok = true;
                try { ok = (typeof W.canAccessScriptureTier === 'function') ? !W.canAccessScriptureTier(tier) : false; } catch (e) { ok = false; }
                if (!ok) continue; // 只偷你本来看不了的书
                var rec = ins[a.id];
                if (rec && (Number(rec.m) || 0) >= 90) continue;
                if (!best || tier < (Number(best.tier) || 9)) best = a;
            }
            return best;
        } catch (e) { return null; }
    }
    W.openCrookedPanel = function () {
        var sect = mySect();
        if (!sect) { msg('还没入门。', 'warning'); return; }
        if (!isDarkSect(sect)) { msg('你走的是正道门庭——这种路子，门里没有。', 'info'); return; }
        var f = flags();
        var rec = f['sect_sneak'] || {};
        var target = stealTarget(sect);
        var h = para('邪派的门规只有一条：别被抓着。守着这条，剩下的路都是自己蹚。');
        if (!nightNow()) {
            h += para('<span class="text-gray-500">现在是白天——藏经阁人来人往，夜深了再来。（亥时之后，五更之前）</span>');
        } else if (rec.day === absDay()) {
            h += para('<span class="text-gray-500">今夜你已经动过手了——一晚只有一次胆子。</span>');
        } else {
            var caught = Number(rec.caught) || 0;
            var rate = 40 + (rec.bribed === absDay() ? 30 : 0) - caught * 15;
            rate = Math.max(10, Math.min(85, rate));
            h += target
                ? para('守阁长老打着盹。你盯上的那本书是——《' + target.name + '》（' + (target.grade || '') + '·你如今的名分本来看不了它）。手气约 ' + rate + '%（被抓过 ' + caught + ' 回' + (rec.bribed === absDay() ? '，今夜买通了长老' : '') + '）。')
                : para('藏经阁里已经没有你「看不了又偷得动」的书了——要么你已经看得够高，要么都偷到了九成。');
            h += '<div class="flex flex-wrap gap-1">' +
                (target ? btn('夜闯藏经阁——偷学《' + target.name + '》（被抓：功绩折两百，记档）', 'window.doSneak()', 'bg-red-800 hover:bg-red-700') : '') +
                (rec.bribed === absDay() ? '' : btn('贿赂守阁长老（自掏五十灵石，今夜手气+30%）', 'window.doBribeLibrarian()', 'bg-yellow-700 hover:bg-yellow-600')) +
                '</div>';
        }
        h += '<p class="text-xs text-gray-500 mt-2">偷来的功夫只到九成——最后一成，还得正经请掌门亲传。这世上没有白走的捷径，只有便宜的。</p>';
        modal('歪门路子 · ' + sect, h);
    };
    W.doBribeLibrarian = function () {
        var sect = mySect();
        if (!sect || !isDarkSect(sect)) return;
        if (!nightNow()) { msg('白天送礼，长老要喊人——夜里来。', 'info'); return; }
        var f = flags();
        var rec = f['sect_sneak'] = f['sect_sneak'] || {};
        if (rec.bribed === absDay()) { msg('长老的袖子今夜已经沉了——再塞就翻脸了。', 'info'); return; }
        if (!deductStones(50)) { msg('五十灵石的门路都凑不齐——先攒钱，再谈路子。', 'warning'); return; }
        rec.bribed = absDay();
        log('💰 五十灵石进了守阁长老的袖子。他打了个哈欠：「今夜风大，老夫耳聋。」（今夜手气+30%）', 'info');
        W.openCrookedPanel();
    };
    W.doSneak = function () {
        var sect = mySect();
        if (!sect || !isDarkSect(sect)) return;
        if (!nightNow()) { msg('白天闯阁是明抢——夜里来。', 'info'); return; }
        var f = flags();
        var rec = f['sect_sneak'] = f['sect_sneak'] || {};
        if (rec.day === absDay()) { msg('一晚只有一次胆子——你昨夜的心跳还没平。', 'info'); return; }
        var target = stealTarget(sect);
        if (!target) { msg('阁里没有你偷得动的书了。', 'info'); return; }
        rec.day = absDay();
        var caught = Number(rec.caught) || 0;
        var rate = Math.max(10, Math.min(85, 40 + (rec.bribed === absDay() ? 30 : 0) - caught * 15));
        advance(90, '夜闯藏经阁');
        if (Math.random() * 100 < rate) {
            var d = ds();
            d.artInsights = d.artInsights || {};
            var ins = d.artInsights[target.id] || { heard: true, m: 0 };
            ins.heard = true;
            ins.m = Math.min(90, Math.round(((Number(ins.m) || 0) + 15) * 10) / 10); // 偷学的只到九成
            d.artInsights[target.id] = ins;
            log('🌙 三更长，你把《' + target.name + '》就着窗外雪光翻完了关键三页，原样放回——书脊的灰都没动。回到房里，心跳了半天。（掌握 +' + 15 + '，至九成封顶；无人知晓）', 'success');
            msg('偷学成了——《' + target.name + '》掌握 +15（至九成封顶，无人知晓）。', 'success');
        } else {
            rec.caught = caught + 1;
            var dd = ds();
            var cut = Math.min(Number(dd.contribution) || 0, 200);
            dd.contribution = Math.max(0, (Number(dd.contribution) || 0) - 200);
            try { if (typeof W.sectLedgerNote === 'function') W.sectLedgerNote(-cut, '夜闯藏经阁·被拿住'); } catch (e) {}
            chron(sect, '夜里藏经阁进了耗子——守阁长老把人拿个正着。掌门听完只冷笑一声：「要偷，就偷得像样点。」功绩折两百，记档。');
            log('🕯️ 灯突然全亮了。守阁长老站在书架那头看着你，没喊人，只伸出手——你把怀里抄的三页纸交了出去。（功绩-' + cut + '，记档「手艺潮」；再犯更难）', 'error');
            msg('被拿住了——功绩折损、记档。邪派的规矩：被抓着，就是手艺潮。', 'error');
        }
        W.openCrookedPanel();
    };

    // ============ 五 · 自请下山历练 ============
    W.doLeaveTraining = function () {
        var sect = mySect();
        if (!sect) { msg('还没入门。', 'warning'); return false; }
        var f = flags();
        if (f['sect_training'] && !f['sect_training'].returned) { msg('你已经在山下了。', 'info'); return false; }
        f['sect_training'] = { sect: sect, startDay: absDay(), returned: false };
        chron(sect, playerName() + '自请下山历练——执事记了档：份例封存，回山销假再叙。');
        log('🎒 你背着行囊下山。执事在名册上把你那页折了个角：「份例停发，回来的时候，看你带什么回来。」（离山期间俸禄停发；回山按天数结算）', 'info');
        msg('已告假下山——份例停发，回山销假时结算这一趟的收获。', 'success');
        return true;
    };
    W.doReturnTraining = function () {
        var sect = mySect();
        var f = flags();
        var tr = f['sect_training'];
        if (!sect || !tr || tr.returned) { msg('你没有在外的假。', 'info'); return false; }
        var away = Math.max(0, absDay() - (tr.startDay || 0));
        tr.returned = true;
        var d = ds() || {};
        var summary;
        if (away < 10) {
            addC(3, '下山转了一圈');
            summary = '下山转了一圈，晒黑了些。执事翻翻册子：「回来就好。」（功绩+3）';
            log('🎒 ' + summary, 'info');
        } else if (away < 30) {
            d.points = (Number(d.points) || 0) + 30;
            addFame(2); addC(20, '下山历练·满月而归');
            summary = '在外走了近一个月：见识涨了（修炼领悟+30），风尘也沾了（名望+2），门里记你一份勤（功绩+20）。';
            log('🎒 ' + summary, 'success');
        } else if (away < 90) {
            d.points = (Number(d.points) || 0) + 80;
            addFame(5); addC(50, '下山历练·一季风尘');
            var windfall = seeded(absDay(), sect, 71) < 0.4;
            if (windfall) { addStones(30); summary = '离山一季：领悟+80、名望+5、功绩+50，还把山里打的野味进城卖了三十灵石——猎户认得你穿的门服。'; }
            else summary = '离山一季：领悟+80、名望+5、功绩+50。江湖走了一遭，回来时山门口的松似乎矮了些。';
            log('🎒 ' + summary, 'success');
        } else {
            d.points = (Number(d.points) || 0) + 80;
            addFame(5);
            var c0 = 50;
            if (away >= 180) c0 = 25;
            addC(c0, '下山历练·久假而归');
            summary = away >= 180
                ? '离山半年开外：领悟+80、名望+5，功绩只记了' + c0 + '——执事把你的名册压在最底下：「你的屋子，换到井边了。」'
                : '离山一季往上：领悟+80、名望+5、功绩记' + c0 + '（久假不归，你的位子有人惦记——屋子换到井边了）。';
            chron(sect, playerName() + '历练归来——走时是' + (away >= 180 ? '半年前' : '数月前') + '的事。执事对册子时停了停笔：回来就好，位子么……慢慢挣。');
            log('🎒 ' + summary, 'info');
        }
        chron(sect, playerName() + '下山历练' + away + '日，回山销假——风尘满面，册子上的功绩一笔一笔补上。');
        f['sect_training'] = null;
        msg('回山销假：' + summary, 'success');
        return true;
    };

    // ============ 枢纽面板：门里的日子 ============
    W.openSectLifePanel = function () {
        var sect = mySect();
        if (!sect) { msg('还没入门——门里的日子，入了门才有。', 'warning'); return; }
        var f = flags();
        var tr = f['sect_training'];
        var h = '<p class="text-xs text-gray-400 mb-2">比着干有榜，处得出有交情，天大的事能求见掌门——邪门的路上还有邪门的走法。这就是门里的日子。</p>';
        h += '<div class="grid grid-cols-1 gap-2">';
        h += btn('🏆 门中排行榜——贡献/差事/切磋三张月榜', 'window._closeModal && window._closeModal(); window.openSectBoardPanel()');
        h += btn('🍶 同门交厚——拼酒、说心事、搭手练', 'window._closeModal && window._closeModal(); window.openBondPanel()', 'bg-gray-700 hover:bg-gray-600');
        h += btn('🏯 求见掌门——求指点/诉冤屈/领差事/告假', 'window._closeModal && window._closeModal(); window.openAudiencePanel()', 'bg-gray-700 hover:bg-gray-600');
        if (isDarkSect(sect)) h += btn('🌙 歪门路子——夜闯藏经阁、买通守阁长老（仅邪派·仅深夜）', 'window._closeModal && window._closeModal(); window.openCrookedPanel()', 'bg-red-800 hover:bg-red-700');
        if (tr && !tr.returned) {
            h += btn('🎒 回山销假——历练第 ' + Math.max(0, absDay() - (tr.startDay || 0)) + ' 天，带一身风尘回去', 'window._closeModal && window._closeModal(); window.doReturnTraining()', 'bg-sky-800 hover:bg-sky-700');
        }
        h += '</div>';
        modal('门里的日子 · ' + sect, h);
    };

    // ============ 日钩：月榜结算 ============
    function dayHook() { try { boardSettle(); } catch (e) {} }
    try {
        if (W.EventBus && W.EventBus.on) W.EventBus.on('newDay', dayHook);
        else if (W.timeSystem && typeof W.timeSystem.onNewDaySubscribe === 'function') W.timeSystem.onNewDaySubscribe(dayHook);
    } catch (e) {}

    // ============ 探针（测试用） ============
    W.sectDiscipleLifeProbe = function () {
        var sect = mySect();
        if (!sect) return null;
        var f = flags();
        return {
            sect: sect, dark: isDarkSect(sect), night: nightNow(),
            boardMonth: f['sect_board_month'],
            audienceDay: f['sect_audience_day'] || 0,
            sneak: f['sect_sneak'] || null,
            training: f['sect_training'] || null,
            brotherBonus: W.sectBrotherBonus(),
            mates: mates(sect).length
        };
    };
    console.log('[sect-disciple-life] 门里的日子已注册：排行榜（月榜三甲有名望）+ 同门交厚（知己切磋有得/莫逆份例加厚）+ 求见掌门（三日一谒·四事）+ 邪派黑线（夜闯/买通，被抓真罚）+ 下山历练（份例停发·回山按天结算）');
})();
