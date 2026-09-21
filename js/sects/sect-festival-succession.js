// ==================== sect-festival-succession.js - 大典·继位·日常仪轨（改造批·第一梯队+第四梯队） ====================
// 一、开山大典（一年一度）：祭祖（上香得祖师庇佑）+ 论功行赏（真读贡献账本——今年谁挣得多，
//     掌门当众念名字，赏从门库出）+ 大典宴（全门增益）。仪式感和年度账单的展示台。
// 二、执事风波：掌门闭关百日不出——掌门是掌门（恋爱主角，位分永不动），争的是「监门执事」的印。
//     两位长老摆旗号（严律/宽待），玩家可站队、可拉票（真花贡献）、可毛遂自荐（长老以上+贡献门槛）。
//     三十日后见分晓：拥立之功/接印成功（升副掌门·监门执事）/站错队失势/中立两头记着你。势力分读真账。
// 三、第四梯队日常小件打包：早课（演武场晨时）/晚课（洞府暮时）/灵田帮工（政事面板，产出真入公库）/
//     戒律堂（月度查账：正派门下魔道声望高会被叫去谈话）/同门赠礼（行囊物品送具名同门，好感真涨）。
// 纪律：一切奖励走真接口（账本/门库/编年/好感）；早课晚课以「时辰」为门（制度性，非计数器配额）；零外文字母。
(function () {
    'use strict';
    var W = window;

    function ds() { return W.discipleState || null; }
    function cd() { return W.currentCharData || null; }
    function flags() { return (W.eventFlags = W.eventFlags || {}); }
    function absDay() { try { return W.timeSystem && W.timeSystem.getAbsoluteDay ? (Number(W.timeSystem.getAbsoluteDay()) || 0) : 0; } catch (e) { return 0; } }
    function hour() { try { return Number(W.timeSystem && W.timeSystem.gameTime ? W.timeSystem.gameTime.currentHour : 12) || 0; } catch (e) { return 12; } }
    function log(m, t) { try { if (W.gameLog && W.gameLog.add) W.gameLog.add(m); } catch (e) {} }
    function msg(m, t) { if (typeof W.showMessage === 'function') W.showMessage(m, t || 'info'); }
    function modal(t, b) { if (typeof W.showModal === 'function') W.showModal(t, b); }
    function para(t) { return '<p class="text-sm text-gray-300 leading-relaxed mb-2">' + t + '</p>'; }
    function btn(label, onclick, cls) { return '<button onclick="' + onclick + '" class="' + (cls || 'bg-yellow-700 hover:bg-yellow-600') + ' text-xs px-3 py-2 rounded text-left">' + label + '</button>'; }
    function btns(arr) { return '<div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">' + arr.join('') + '</div>'; }
    function _close() { try { var ov = document.getElementById('xianxia-modal-overlay'); if (ov) ov.remove(); } catch (e) {} }
    W._closeModal = W._closeModal || _close;
    function mySect() { var d = ds(); return (d && d.isInSect && (d.sectName || d.sectId)) || null; }
    function addC(n, r) { try { if (typeof W.sectAddContribution === 'function') return W.sectAddContribution(n, r); } catch (e) {} var d = ds(); if (d) d.contribution = (Number(d.contribution) || 0) + n; }
    function spendC(n, r) { try { if (typeof W.sectSpendContribution === 'function') return W.sectSpendContribution(n, r); } catch (e) {} var d = ds(); if (!d || (Number(d.contribution) || 0) < n) return false; d.contribution -= n; return true; }
    function addStones(n) {
        try { if (W.XianXia && W.XianXia.DataManager && W.XianXia.DataManager.addSpiritStones) { W.XianXia.DataManager.addSpiritStones(n); return; } } catch (e) {}
        if (W.inventory && W.inventory.currency) W.inventory.currency.spiritStones = (Number(W.inventory.currency.spiritStones) || 0) + n;
    }
    function chron(sect, text) { try { if (W.SectGov && W.SectGov.chronicle) W.SectGov.chronicle(sect, text); } catch (e) {} }
    function buff(id, eff, hours) { try { if (typeof W.applyBuff === 'function') W.applyBuff(id, eff, hours); } catch (e) {} }
    function leaderName(sect) { try { if (W.SECT_LEADER_NAMES && W.SECT_LEADER_NAMES[sect]) return W.SECT_LEADER_NAMES[sect]; } catch (e) {} return sect + '掌门'; }
    function advance(min, why) { try { if (W.timeSystem && W.timeSystem.advanceTime) W.timeSystem.advanceTime(min, why || '门中仪轨'); } catch (e) {} }

    // ============ 一 · 开山大典（一年一度，day%360===180） ============
    // 第一百一十一波：年纪元统一成 floor((d-1)/360)（festival-bridge/sect-year-goal 同款）——
    // 旧式 floor(d/360) 与节日桥差一天，第 360 天两系统对「今年」的认知不一致
    function yearKey() { return 'sect_festival_' + Math.floor((absDay() - 1) / 360); }
    function festivalDue() { var d = absDay(); return d > 0 && d % 360 === 180; }
    W.openSectFestival = function (auto) {
        var sect = mySect();
        if (!sect) return;
        var f = flags();
        if (f[yearKey()]) { if (!auto) msg('今年的大典已经过了——祖师堂前的香灰还没扫。', 'info'); return; }
        var yearSum = 0;
        try {
            var es = W.sectLedgerEntries ? W.sectLedgerEntries() : [];
            var since = absDay() - 360;
            es.forEach(function (e) { if (e.amt > 0 && e.day >= since) yearSum += e.amt; });
        } catch (e) {}
        var honored = yearSum >= 300;
        var html = '<div class="text-left">';
        html += para('今日开山大典。山门大开，钟鼓齐鸣——历代祖师的牌位擦得发亮，全门上下按位分站在丹墀两侧。' + leaderName(sect) + '亲自主祭。');
        html += para('<span class="text-xs text-gray-500">执事唱名论功：今年账上，你名下进账贡献 ' + yearSum + '。' + (honored ? '<b class="text-amber-300">够格上功德榜。</b>' : '（功德榜的门槛是三百——明年再来）') + '</span>');
        var b1 = btn('🕯️ 给祖师上香（贡献20，求个庇佑）', 'window._closeModal(); window.sectFestivalAct(\'incense\')', 'bg-amber-800 hover:bg-amber-700');
        var b2 = honored ? btn('🏅 听唱名，领功赏（赏从门库出）', 'window._closeModal(); window.sectFestivalAct(\'honor\')', 'bg-yellow-700 hover:bg-yellow-600') : '';
        var b3 = btn('🍶 入席大典宴（全门同席）', 'window._closeModal(); window.sectFestivalAct(\'feast\')');
        html += btns([b1, b2, b3].filter(Boolean));
        html += '</div>';
        modal('🎊 ' + sect + ' · 开山大典', html);
    };
    W.sectFestivalAct = function (act) {
        var sect = mySect();
        if (!sect) return;
        var f = flags();
        var done = f[yearKey()] || {};
        if (typeof done !== 'object') done = {};
        if (done[act]) { msg('这一节已经行过了。', 'info'); return; }
        if (act === 'incense') {
            if (!spendC(20, '开山大典·祭祖上香')) { msg('香火钱要贡献二十——你两手空空站在祖师堂前，不太好看。', 'warning'); return; }
            buff('sect_festival_bless', { willpower: 3, intelligence: 3 }, 48);
            done[act] = true;
            log('🕯️ 你在祖师牌位前上了三炷香。烟直直地升——老话说，烟直，祖师听着了。（神识意志增益两日）', 'success');
        } else if (act === 'honor') {
            try { if (W.SectGov && W.SectGov.deductStore) W.SectGov.deductStore(sect, 'stone', 100); } catch (e) {}
            addStones(100);
            try { if (cd()) cd().fame = Math.min(99999, (cd().fame || 0) + 5); } catch (e2) {}
            chron(sect, '论功行赏，执事唱到「' + ((cd() && cd().name) || '门下弟子') + '」时顿了顿——今年账上，就数这个名字出现得多。赏灵石一百，出自公库，全门看得见。');
            done[act] = true;
            log('🏅 执事唱名唱到了你。' + leaderName(sect) + '亲手把赏钱递过来：「账上不欺人。」丹墀两侧的目光落在背上——不重，但很直。（灵石+100，名望+5，编年记名）', 'success');
        } else if (act === 'feast') {
            buff('sect_festival_feast', { constitution: 3, willpower: 2 }, 72);
            done[act] = true;
            advance(120, '大典宴');
            log('🍶 大典宴摆了三百桌。你和同门挤在一桌，酒过三巡，平日里严肃的师叔讲起了他年轻时的糗事。（体魄心境增益三日）', 'success');
        }
        f[yearKey()] = done;
        if (done.incense && done.feast && (!done.honor)) { /* 不强制齐——想来几节来几节 */ }
    };

    // ============ 二 · 继位风波 ============
    var ELDER_A = ['律', '肃', '刚'];
    function succession() { return flags()['sect_succ'] || null; }
    function elderNames(sect) {
        var h = 0; for (var i = 0; i < sect.length; i++) h = (h * 31 + sect.charCodeAt(i)) % 20;
        var SUR = ['赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈', '褚', '卫', '蒋', '沈', '韩', '杨'];
        return {
            a: { name: SUR[h % SUR.length] + '长老', stance: '严律——门规如山，赏罚分明，库银收紧' },
            b: { name: SUR[(h + 7) % SUR.length] + '长老', stance: '宽待——广结善缘，弟子份例加厚，外务多接' }
        };
    }
    W.sectSuccessionCheck = function () {
        var sect = mySect();
        var d = ds();
        if (!sect || !d) return;
        if (succession() || flags()['sect_succ_done']) return;
        if ((d.rank == null ? 7 : d.rank) > 2) return; // 长老以上才听得见风向
        if (!festivalDueYear() && absDay() % 360 !== 200) return;
        var el = elderNames(sect);
        flags()['sect_succ'] = { stage: 1, side: null, support: 0, startDay: absDay(), elders: el, spent: 0 };
        chron(sect, '掌门闭关百日不出，门务暂悬——' + el.a.name + '与' + el.b.name + '两位长老，都盯上了「监门执事」的位子。掌门还是掌门，只是山门里拿主意的人，暂时空着。');
        log('🌩️ 掌门闭关百日不出（他老人家的位子没人动，也动不得）。今日议事厅散得晚——' + el.a.name + '（' + el.a.stance + '）与' + el.b.name + '（' + el.b.stance + '）争的是「监门执事」的印，各自留了几个人说话。你也在被留之列。（执事风波起：议事厅可听风向）', 'warning');
    };
    function festivalDueYear() { return false; } // 继位只在 day%360===200 起（留档语义清晰）
    W.openSuccessionPanel = function () {
        var s = succession();
        var sect = mySect();
        if (!sect) return;
        if (!s) {
            if (flags()['sect_succ_done']) { msg('继位的事已经定了——新秩序还在磨合，但风向不会再乱第二次。', 'info'); return; }
            msg('议事厅风平浪静——掌门在位，轮不到议论「将来」。', 'info');
            return;
        }
        var html = '<div class="text-left">';
        if (s.stage === 1) {
            html += para('掌门闭关百日不出——位分没变，可门务得有人拿主意。两位长老争「监门执事」的印，旗号已经摆开了：');
            html += para('🗡️ <b>' + s.elders.a.name + '</b>——' + s.elders.a.stance + '。');
            html += para('🍵 <b>' + s.elders.b.name + '</b>——' + s.elders.b.stance + '。');
            html += para('<span class="text-xs text-gray-500">站队不是小事：站对了扶摇直上，站错了穿小鞋三年。也可以谁都不站，或者——自己下场。</span>');
            var canRun = (ds().rank == null ? 7 : ds().rank) <= 2 && (Number(ds().contribution) || 0) >= 3000;
            html += btns([
                btn('🗡️ 站到' + s.elders.a.name + '那边（严律）', 'window._closeModal(); window.sectSuccChoose(\'a\')'),
                btn('🍵 站到' + s.elders.b.name + '那边（宽待）', 'window._closeModal(); window.sectSuccChoose(\'b\')'),
                canRun ? btn('👑 毛遂自荐——监门执事的印，我来接（长老以上，贡献三千为凭）', 'window._closeModal(); window.sectSuccChoose(\'self\')', 'bg-purple-800 hover:bg-purple-700') : '',
                btn('🚪 谁也不站——茶喝完了就走', 'window._closeModal(); window.sectSuccChoose(\'neutral\')', 'bg-gray-600 hover:bg-gray-500')
            ].filter(Boolean));
        } else if (s.stage === 2) {
            var left = Math.max(0, (s.startDay + 30) - absDay());
            html += para('你已' + (s.side === 'self' ? '下场自荐。丹墀上下都在看你' : ('站到' + s.elders[s.side].name + '那边')) + '——还有 <b class="text-amber-300">' + left + '</b> 日见分晓。');
            html += para('<span class="text-xs text-gray-500">当下你的势：声援 ' + s.support + ' 分。拉票要真金白银——每一票都是人情，人情要还。</span>');
            html += btns([
                btn('🗳️ 挨峰拉票（贡献100，声援+10）', 'window._closeModal(); window.sectSuccCampaign()', 'bg-amber-800 hover:bg-amber-700'),
                btn('📜 看看两位长老的动静', 'window._closeModal(); window.sectSuccWatch()', 'bg-gray-600 hover:bg-gray-600')
            ]);
        }
        html += '</div>';
        modal('🌩️ 继位风波 · 议事厅', html);
    };
    W.sectSuccChoose = function (side) {
        var s = succession();
        if (!s || s.stage !== 1) return;
        s.side = side; s.stage = 2; s.startDay = absDay();
        if (side === 'self') {
            chron(mySect(), '有长老自请接监门执事的印——' + ((cd() && cd().name) || '门下') + '。议事厅安静了三息，然后炸了。');
            log('👑 你当众把话挑明了：掌门闭关，门务不能没人拿主意——这方印，你来接。两位长老对视了一眼：从这一刻起，你是他们的对手，也是他们不得不客气的同僚。（三十日后祖师堂前见分晓）', 'warning');
        } else if (side === 'neutral') {
            log('🚪 你喝完了茶，谁也没站。散会时两位长老都朝你点了点头——点头的意思各不相同：一个觉得你识趣，一个觉得你可拉。（三十日后见分晓，中立也有中立的账）', 'info');
        } else {
            log('🌩️ 你站到了' + s.elders[side].name + '旗下。（' + s.elders[side].stance + '——三十日后见分晓）', 'info');
        }
    };
    W.sectSuccCampaign = function () {
        var s = succession();
        if (!s || s.stage !== 2) return;
        if (!spendC(100, '继位·挨峰拉票')) { msg('拉票要一百贡献打点——人情不白要。', 'error'); return; }
        s.support += 10;
        s.spent = (s.spent || 0) + 100;
        var lines = ['你提着茶盒上了三峰。', '执事堂的师兄弟收了你的帖。', '老供奉们听了你的陈词，没表态，但茶喝完了。'];
        log('🗳️ ' + lines[s.spent / 100 % lines.length | 0] + '（声援+10，贡献-100）', 'info');
    };
    W.sectSuccWatch = function () {
        var s = succession();
        if (!s) return;
        modal('📜 两位长老的动静', para('🗡️ ' + s.elders.a.name + '：连查了三峰的钱粮账，查出两笔糊涂账——当夜革了管库执事。「严」字旗立起来了。')
            + para('🍵 ' + s.elders.b.name + '：给全门弟子份例加了一成，又接了两单外务。「宽」字旗也立起来了。')
            + para('<span class="text-xs text-gray-500">两边都在花钱买人心——门库这个月瘦了。风向下月见分晓。</span>')
            + btns([btn('知道了', 'window._closeModal()', 'bg-gray-600 hover:bg-gray-500')]));
    };
    W.sectSuccResolve = function () {
        var s = succession();
        if (!s || s.stage !== 2) return;
        if (absDay() < s.startDay + 30) return;
        var sect = mySect();
        var d = ds();
        flags()['sect_succ_done'] = absDay() || 1;
        flags()['sect_succ'] = null;
        // 玩家的势：声援 + 贡献底蕴 + 大比夺冠 + 职位
        var score = 20 + s.support + Math.floor((Number(d.contribution) || 0) / 300);
        try {
            var hist = (W.Tournament && W.Tournament.getTournamentHistory) ? (W.Tournament.getTournamentHistory(sect) || []) : [];
            if (hist.some(function (h) { return h.winnerId === 'player'; })) score += 15;
        } catch (e) {}
        if ((d.rank == null ? 7 : d.rank) <= 1) score += 10;
        var rivalA = 40 + (absDay() * 7 % 25);
        var rivalB = 40 + (absDay() * 13 % 25);
        if (s.side === 'self') {
            if (score > rivalA && score > rivalB) {
                if ((d.rank == null ? 7 : d.rank) > 1) { d.rank = 1; d.rankName = '副掌门'; }
                flags()['sect_steward'] = absDay() || 1;
                try { if (cd()) cd().fame = Math.min(99999, (cd().fame || 0) + 10); } catch (e2) {}
                chron(sect, '监门执事的印定了下来——接印的是' + ((cd() && cd().name) || '门下弟子') + '。两位长老各执一侧扶手，礼数周全，眼神复杂。掌门闭关如故，山门拿主意的人有了。');
                log('👑 祖师堂前开牌：监门执事的印，到了你手里。' + leaderName(sect) + '仍在闭关——山门头上的人没变，变的是门务由谁拿主意。（职位：副掌门·监门执事。宗门管理诸权已开，名望+10）', 'success');
                msg('👑 你接了监门执事的印——门务你拿主意，掌门还是掌门。', 'success');
            } else {
                d.contribution = Math.max(0, (Number(d.contribution) || 0) - 100);
                chron(sect, '自请继位的那位长老输了牌——祖师堂前的雪扫得很快，第二天就看不出有人站过。');
                log('💧 牌开了，不是你。两位长老各自受了拥立者的礼，你站在丹墀下看完了全程。输牌不输阵——你拱了拱手，退了出去。（贡献-100，失势三年：门里的差事会难接些）', 'error');
            }
        } else if (s.side === 'a' || s.side === 'b') {
            var win = s.side === 'a' ? (rivalA >= rivalB) : (rivalB > rivalA);
            var winner = win ? s.elders[s.side].name : s.elders[s.side === 'a' ? 'b' : 'a'].name;
            if (win) {
                if ((d.rank == null ? 7 : d.rank) > 1) { d.rank = 1; d.rankName = '副掌门'; }
                addC(200, '继位·拥立之功');
                chron(sect, winner + '接了监门执事的印。拥立有功的名单里，有' + ((cd() && cd().name) || '门下弟子') + '的名字——新秩序里，你有一把椅子。');
                log('🏅 ' + winner + '接印了——你站对了。拥立之功记档，升副掌门，另赏贡献二百。（掌门闭关如故，执事堂里你有位置了）', 'success');
            } else {
                d.contribution = Math.max(0, (Number(d.contribution) || 0) - 50);
                chron(sect, winner + '接印。败方的人各自外放——山门还是那个山门，坐的位置换了换。');
                log('💧 ' + winner + '接印——你站错了。没人为难你，但好差事轮不到你了，份例也「恰好」晚了三日。（贡献-50，失势）', 'error');
            }
        } else {
            chron(sect, '执事之事定了。全程未站队的长老只有一位——两边都记着他，两边都没动他。');
            log('🚪 风波定了，你谁也没帮，谁也没得罪。新掌门见你时客客气气——客气，就是距离。中立者的账：不亏，也不赚。', 'info');
        }
        try { if (typeof W.updateSectUI === 'function') W.updateSectUI(); } catch (e3) {}
    };

    // ============ 三 · 早课 / 晚课（时辰为门，制度性一日一节） ============
    W.sectMorningClassOpen = function () { return hour() >= 5 && hour() < 9; };
    W.sectEveningClassOpen = function () { return hour() >= 17 && hour() < 21; };
    W.doMorningClass = function () {
        if (flags()['sect_class_morning'] === absDay()) { msg('早课今日已上过——师傅说，一天两遍是熬油。', 'info'); return false; }
        if (!W.sectMorningClassOpen()) { msg('早课在辰时（清晨五至九时）——过了时辰，师傅的板子可不等人。', 'info'); return false; }
        flags()['sect_class_morning'] = absDay();
        advance(60, '早课');
        try { if (cd()) cd().qi = Math.min(cd().maxQi || 100, (cd().qi || 0) + 15); } catch (e) {}
        try { if (typeof W.sectPassiveTrain === 'function') W.sectPassiveTrain('drill'); } catch (e2) {}
        log('🌅 早课：全门弟子在演武场列队，师傅挨个纠正桩功。一个时辰下来，腿是酸的，气是顺的。（真气+15，练功底子）', 'info');
        return true;
    };
    W.doEveningClass = function () {
        if (flags()['sect_class_evening'] === absDay()) { msg('晚课今日已听过——经义要温，不要贪。', 'info'); return false; }
        if (!W.sectEveningClassOpen()) { msg('晚课在酉时（傍晚五至九时）——钟声没响，经堂没开。', 'info'); return false; }
        flags()['sect_class_evening'] = absDay();
        advance(60, '晚课');
        try { if (cd()) cd().qi = Math.min(cd().maxQi || 100, (cd().qi || 0) + 15); } catch (e) {}
        try { if (typeof W.sectPassiveTrain === 'function') W.sectPassiveTrain('study'); } catch (e2) {}
        log('🌆 晚课：经堂里一盏长明灯，执经的师叔念一段，讲一段。你听懂了三成，剩下七成在回洞府的路上想明白了。（真气+15，练功底子）', 'info');
        return true;
    };

    // ============ 四 · 灵田帮工（政事面板入口，产出真入公库） ============
    W.doSectFarmWork = function () {
        var sect = mySect();
        if (!sect) { msg('还没入门。', 'warning'); return false; }
        if (flags()['sect_farm_day'] === absDay()) { msg('今日灵田的活已经干完了——地不哄人，人也不能哄地。', 'info'); return false; }
        flags()['sect_farm_day'] = absDay();
        advance(240, '灵田帮工');
        var grain = 10 + Math.floor(Math.random() * 6);
        try {
            var it = W.SectGov && W.SectGov.internalRef ? W.SectGov.internalRef(sect) : null;
            if (it) it.grain = (Number(it.grain) || 0) + grain;
        } catch (e) {}
        addC(8, '灵田帮工');
        try { if (typeof W.sectPassiveTrain === 'function') W.sectPassiveTrain('gather'); } catch (e2) {}
        var flavor = Math.random() < 0.2 ? '收工时田埂上落了雨，你和一个哑巴杂役共用一把伞。' : '日头毒，你灌了三瓢水——管田的老修士说，仙人下的田，苗都壮些。';
        log('🌾 你在灵田里干了半日：翻土、引水、除虫。（公库灵谷+' + grain + '，贡献+8）' + flavor, 'success');
        return true;
    };

    // ============ 五 · 戒律堂（月度查账） ============
    W.sectPreceptCheck = function () {
        var sect = mySect();
        var d = ds();
        if (!sect || !d) return;
        var f = flags();
        if (f['sect_precept_month'] === Math.floor(absDay() / 30)) return;
        f['sect_precept_month'] = Math.floor(absDay() / 30);
        var sectType = null;
        try { sectType = (W.sectsData && W.sectsData[sect] && W.sectsData[sect].type) || null; } catch (e) {}
        // 方案二：戒律堂看的是门派眼下的立场，不是开山时贴的标签
        try {
            if (typeof W.sectAlignNow === 'function') {
                var av = W.sectAlignNow(sect);
                if (av) sectType = av.align >= 40 ? '正道' : (av.align <= -40 ? '邪派' : '中立');
            }
        } catch (eA) {}
        var demonRep = 0, rightRep = 0;
        try {
            if (W.factionState && W.factionState.reputation) {
                demonRep = Number(W.factionState.reputation['demon_cult']) || 0;
                rightRep = Number(W.factionState.reputation['righteous_alliance']) || 0;
            }
        } catch (e2) {}
        var warned = Number(f['sect_precept_warn'] || 0);
        if (sectType === '正道' && demonRep >= 500) {
            warned++;
            f['sect_precept_warn'] = warned;
            if (warned === 1) {
                log('⚖️ 戒律堂传唤：有执事参了你一本——「行迹近魔」。堂上长老看了你半晌：「下不为例。门规第一条：在外行事，勿坠门风。」（再犯，罚俸记过）', 'warning');
            } else {
                var fine = Math.min(80, Number(d.contribution) || 0);
                d.contribution = (Number(d.contribution) || 0) - fine;
                chron(sect, '戒律院记了一笔过——有弟子行迹近魔，罚贡献' + fine + '，面壁三日。');
                log('⚖️ 戒律堂二次传唤：这次不是谈话了。罚贡献' + fine + '，面壁三日，记过一笔——「再有下次，逐出师门的话，老夫就要说出口了。」', 'error');
            }
        } else if (sectType === '邪派' && rightRep >= 500) {
            log('⚖️ 护法堂找你「喝茶」：听说你在正道那边名声不错？「咱们门里的人，别让人当善人供着。」——话难听，理是这个门的理。', 'warning');
        }
    };

    // ============ 六 · 同门赠礼（行囊物品送具名同门） ============
    W.openFellowGift = function (npcId) {
        var npc = null;
        try { npc = W.npcManager && W.npcManager.getNPC ? W.npcManager.getNPC(npcId) : null; } catch (e) {}
        if (!npc) { msg('查无此人。', 'warning'); return; }
        var items = [];
        try {
            var inv = W.inventory;
            if (inv && inv.slots) {
                for (var i = 0; i < inv.slots.length && items.length < 6; i++) {
                    var s = inv.slots[i];
                    if (!s || !(s.count > 0)) continue;
                    var t = (s.getTemplate && s.getTemplate()) || (W.itemById && W.itemById[s.templateId]);
                    if (!t) continue;
                    items.push({ id: s.templateId, name: t.name || s.templateId, price: Number(t.price) || 5 });
                }
            }
        } catch (e2) {}
        var html = '<div class="text-left">';
        html += para('给' + npc.name + '捎点什么？礼不在贵——同门之间，递的是个「惦记」。');
        if (!items.length) html += para('<span class="text-xs text-gray-500">行囊里空空的——没东西可送。</span>');
        items.forEach(function (it) {
            html += '<div class="flex justify-between items-center bg-gray-800/60 p-2 rounded mb-1">'
                + '<span class="text-sm text-gray-200">🎁 ' + it.name + ' <span class="text-xs text-gray-500">值' + it.price + '灵石</span></span>'
                + '<button onclick="window.doFellowGift(\'' + npcId + '\', \'' + it.id + '\')" class="text-xs bg-pink-700 hover:bg-pink-600 text-white px-3 py-1 rounded">送这个</button></div>';
        });
        html += '</div>';
        modal('🎁 给' + npc.name + '捎点东西', html);
    };
    W.doFellowGift = function (npcId, itemId) {
        var npc = null;
        try { npc = W.npcManager && W.npcManager.getNPC ? W.npcManager.getNPC(npcId) : null; } catch (e) {}
        if (!npc) { msg('查无此人。', 'warning'); return false; }
        var t = null;
        try { t = (W.itemById && W.itemById[itemId]) || null; } catch (e) {}
        var took = false;
        try { took = (typeof W.consumeItem === 'function') ? W.consumeItem(itemId, 1) : false; } catch (e2) {}
        if (!took) { msg('行囊里没有这件东西了。', 'warning'); return false; }
        var price = (t && Number(t.price)) || 5;
        var gain = price >= 200 ? 12 : price >= 50 ? 8 : price >= 15 ? 5 : 3;
        try { if (typeof npc.changeAffection === 'function') npc.changeAffection(gain); } catch (e3) {}
        _close();
        var name = (t && t.name) || '一件东西';
        log('🎁 你把' + name + '塞给' + npc.name + '。TA推了两下，收下了——嘴上说「下不为例」，手倒是很快。（好感+' + gain + '）', 'success');
        return true;
    };

    // ============ 日钩：大典提醒 / 继位推进 / 戒律月查 ============
    function dayTick() {
        if (!mySect()) return;
        if (festivalDue() && !flags()[yearKey()]) {
            log('🎊 今日开山大典——山门大开，钟鼓齐鸣。回内院公告栏或政事面板可入典礼。（祭祖/论功/大典宴）', 'success');
            W.openSectFestival(true);
        }
        W.sectSuccessionCheck();
        W.sectSuccResolve();
        W.sectPreceptCheck();
    }
    try {
        if (W.EventBus && W.EventBus.on) W.EventBus.on('newDay', function () { try { dayTick(); } catch (e) {} });
        else if (W.timeSystem && typeof W.timeSystem.onNewDaySubscribe === 'function') W.timeSystem.onNewDaySubscribe(function () { try { dayTick(); } catch (e) {} });
    } catch (e) {}

    W.sectFestivalProbe = function () { return { due: festivalDue(), done: flags()[yearKey()] || null, succ: succession(), done2: flags()['sect_succ_done'] || null }; };
    console.log('[sect-festival-succession] 已注册：开山大典（祭祖/论功读真账本/大典宴）+ 继位风波（站队/自荐/拉票/三十日开牌）+ 早课晚课 + 灵田帮工 + 戒律堂月查 + 同门赠礼');
})();
