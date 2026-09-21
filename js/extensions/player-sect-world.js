// ==================== player-sect-world.js - 第十七波 · 自建宗门四条线（第十九波添外交线） ====================
// 白手起家立起来的宗门，此前被挡在世界四条线外（第九波的保护性让路）：AI 不代它举幡、不代它花库银、
// 灭门册上不登它的名——保护是对的（AI 不能背着玩家行动），可保护成了绝缘：自建宗门在世界里没有下场。
// 本模块把四条线接到玩家自己手上（AI 依旧不代办，事事由掌门亲手发起）：
//   一 · 举幡争城：宗门总册里看得见城市香火账，举幡/立分舵/递帖长安全走既有真线——
//       钱从户部镜像先扣、随即落回宗库真账（名目写清，不再被月结误记成「遭了劫掠」）；
//   二 · 盛会主办：掌门亲自摆席（一年一回，灵石二百六十——没有材料库，以钱代料城里置办），
//       来贺读外交真账，贺礼经镜像月结真入宗库；
//   三 · 灭门复兴：空幡不自倒——曾经满过三人、如今人尽库空连续六十日，灯才自己灭（第三十日先提醒）；
//       幡倒了：门人散落各城（人是真找得回的）、宗谱转遗卷、腰牌不缴回；
//       复兴走既有遗徒线：三位老相识+灵石五百+旧址起土三十日——旧腰牌不换新，人回来就行；
//   四 · 宗谱腰牌：入门发牌（头号是开创掌门）、离门/殁于任/散于灭门转另册——牌在人身上，派在心里。
//   五（第十九波）· 外交线：结盟/送礼/战事结算全落自家真账——盘缠礼品从宗库出（两讫），
//       死仇压山门打真仗，守败库房真被搬、可能战殁具名弟子，攻山缴获真入库（从对方库房里搬）。
//   六（第二十波）· 盟约联动：盟书有约——守山时盟家按交情掷骰领众来援（来一家敌人分兵一成），
//       战后两家关系回暖；江湖战云里被围的是自家盟家，可出兵相援（真仗），击退围军则战云散、
//       受援方按库房谢礼（守恒：真从对方库里出、真进自家宗库）。
//   七（第二十一波）· 弟子是活人：月册对出病殁的人，门中治丧（棺木抚恤真出库，牌位入祖堂，库空薄葬记愧）；
//       战殁只从在山的人里挑（下山办差的殁不到山门上）——治丧与派遣的正身在 player-sect-life。
// 账目纪律：镜像（户部面子）与宗库（真账里子）每笔两讫——先 syncMirror 收账，再扣镜像，再 settleSpend 落真账；
// 月结看到差额为零，不会把掌门亲手花的钱误记成劫掠。零外文字母、零原生弹窗、缺表不炸、幂等。
(function () {
    'use strict';
    var W = window;
    if (typeof W === 'undefined') return;

    var CITIES = ['洛水城', '青木城', '炎城', '大漠孤城', '冰原城', '万毒谷', '金城', '剑阁', '帝都·长安'];
    var SOURCE_WORD = { ideal: '晓之以理请来的', show: '看了实底来的', pay: '许了好处来的', bluff: '听大话来的', fame: '慕名来投', revive: '重立山门时回来的' };

    function P() { return W.PlayerSect; }
    function listSects() { try { return (P() && P().listMySects ? P().listMySects() : []) || []; } catch (e) { return []; } }
    function mine() { return listSects()[0] || null; }
    function byName(name) {
        var ms = listSects();
        for (var i = 0; i < ms.length; i++) { if (ms[i] && ms[i].name === name) return ms[i]; }
        return null;
    }
    // 统一时钟链（第九波口径）
    function today() {
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
    function msg(m, t) { try { if (W.showMessage) W.showMessage(m, t || 'info'); } catch (e) {} }
    function log(m, t) { try { if (W.gameLog && W.gameLog.add) W.gameLog.add(m); } catch (e) {} }
    function modal(t, b) { try { if (W.showModal) W.showModal(t, b); } catch (e) {} }
    function para(t) { return '<p class="text-sm text-gray-300 leading-relaxed mb-2">' + t + '</p>'; }
    function btn(label, onclick, cls) { return '<button onclick="' + onclick + '" class="' + (cls || 'bg-yellow-700 hover:bg-yellow-600') + ' text-xs px-3 py-2 rounded text-left">' + label + '</button>'; }
    function _close() { try { var ov = document.getElementById('xianxia-modal-overlay'); if (ov) ov.remove(); } catch (e) {} }
    function internal(name) { return (W.SECT_INTERNAL && W.SECT_INTERNAL[name]) || null; }
    function playerName() { try { return (W.currentCharData || {}).name || '无名氏'; } catch (e) { return '无名氏'; } }
    function getNPC(id) { try { return (W.npcManager && W.npcManager.getNPC) ? W.npcManager.getNPC(id) : null; } catch (e) { return null; } }
    function npcNameOf(id) { var n = getNPC(id); return (n && n.name) ? n.name : '一名修士'; }
    function flags() { return (W.eventFlags = W.eventFlags || {}); }
    function chron(sect, text) {
        try { if (W.SectGov && W.SectGov.chronicle) { W.SectGov.chronicle(sect, text); return; } } catch (e) {}
        var it = internal(sect);
        if (!it) return;
        if (!it.chronicle) it.chronicle = [];
        it.chronicle.push({ day: today(), text: String(text) });
        if (it.chronicle.length > 40) it.chronicle.splice(0, it.chronicle.length - 40);
    }
    function street(text) {
        try {
            var f = flags();
            if (!f['qi_street'] || !f['qi_street'].push) f['qi_street'] = [];
            f['qi_street'].push({ day: today(), text: String(text) });
            if (f['qi_street'].length > 60) f['qi_street'].splice(0, f['qi_street'].length - 60);
        } catch (e) {}
    }
    function advance(mins, why) {
        try { if (typeof W.advanceTime === 'function') { W.advanceTime(mins, why); return; } } catch (e) {}
        try { if (W.timeSystem && typeof W.timeSystem.advanceTime === 'function') W.timeSystem.advanceTime(mins, why); } catch (e2) {}
    }

    // ============ 一 · 两本账的桥（镜像=户部面子，宗库=真账里子） ============
    // 收账：把镜像上未落地的进出先结回宗库（就是白手起家的月结，随时可跑，幂等）
    function syncMirror(name) {
        var ps = byName(name);
        if (!ps || ps._ruined) return;
        try { if (W.PSBoot && W.PSBoot.monthSync) W.PSBoot.monthSync(ps); } catch (e) {}
    }
    // 落账：掌门亲手花出去的钱——镜像已扣，把同一笔落回宗库真账，名目写清（月结再见差额为零，不误记劫掠）
    function settleSpend(name, label) {
        var ps = byName(name);
        if (!ps) return 0;
        var it = internal(name);
        if (!it) return 0;
        var delta = Math.round(Number(it.resources) || 0) - Math.round(Number(ps._lastMirror) || 0);
        if (delta >= 0) return 0;
        var loss = -delta;
        ps.resources.spiritStones = Math.max(0, (Number(ps.resources.spiritStones) || 0) - loss);
        ps._lastMirror = Math.round(Number(it.resources) || 0);
        try { P().addHistory(ps.id, label + '：宗库支出灵石 ' + loss + ' 枚。'); } catch (e) {}
        return loss;
    }
    function realStones(name) {
        var ps = byName(name);
        return ps ? Math.round(Number((ps.resources || {}).spiritStones) || 0) : 0;
    }
    function gainRep(name, n, reason) {
        var ps = byName(name);
        if (!ps) return;
        ps.resources.reputation = (Number(ps.resources.reputation) || 0) + n;
        try { P().addHistory(ps.id, reason + '（声望+' + n + '）。'); } catch (e) {}
    }
    function note(name, text) {
        var ps = byName(name);
        if (!ps) return;
        try { P().addHistory(ps.id, String(text)); } catch (e) {}
    }
    function homeName() {
        var ms = listSects();
        for (var i = 0; i < ms.length; i++) { if (ms[i] && !ms[i]._ruined) return ms[i].name; }
        return null;
    }

    // ============ 二 · 宗谱腰牌（一门的名分册——牌在人身上，派在心里） ============
    function ensureBook(ps) {
        if (!ps) return null;
        if (!ps._book || !ps._book.rows || !ps._book.rows.length) {
            ps._book = {
                seq: 2,
                rows: [{
                    npcId: null, name: playerName(), role: '开创掌门', joinDay: Number(ps.createdDay) || 0,
                    tokenNo: 1, source: '插旗创宗', fate: '在门', leaveDay: null
                }]
            };
        }
        return ps._book;
    }
    function findRow(book, npcId) {
        if (!book || !npcId) return null;
        for (var i = 0; i < book.rows.length; i++) { if (book.rows[i].npcId === npcId) return book.rows[i]; }
        return null;
    }
    function recordJoin(ps, npcId, role, source) {
        if (!ps || !npcId) return;
        var book = ensureBook(ps);
        var row = findRow(book, npcId);
        if (row) {
            if (row.fate === '在门') return;
            row.fate = '在门'; row.leaveDay = null; row.rejoinDay = today();
            if (role) row.role = role;
            if (source) row.source = source;
            return;
        }
        book.rows.push({
            npcId: npcId, name: npcNameOf(npcId), role: role || '弟子', joinDay: today(),
            tokenNo: book.seq++, source: source || '', fate: '在门', leaveDay: null
        });
        ps._peak = Math.max(Number(ps._peak) || 0, book.rows.length - 1);
    }
    function markFate(ps, npcId, fate) {
        var book = ps && ps._book;
        if (!book) return;
        var row = findRow(book, npcId);
        if (row && row.fate === '在门') { row.fate = fate; row.leaveDay = today(); }
    }
    // 月度对册：人进人出都上谱（游说来的、慕名投的、欠俸走的、身故的——一个都漏不掉）
    function reconcile(ps) {
        if (!ps || ps._ruined) return;
        var book = ensureBook(ps);
        var members = {};
        (ps.disciples || []).forEach(function (d) { if (d && d.npcId) members[d.npcId] = { role: '弟子', source: SOURCE_WORD[d.source] || '', name: d.name }; });
        (ps.guests || []).forEach(function (g) { if (g && g.npcId) members[g.npcId] = { role: '客卿', source: SOURCE_WORD[g.source] || '聘来的', name: g.name }; });
        for (var i = 0; i < book.rows.length; i++) {
            var r = book.rows[i];
            if (r.fate !== '在门' || !r.npcId) continue;
            if (members[r.npcId]) { if (!r.source && members[r.npcId].source) r.source = members[r.npcId].source; continue; }
            var n = getNPC(r.npcId);
            var dead = (!n || n.isDead);
            markFate(ps, r.npcId, dead ? '殁于任' : '离门');
            // 第二十一波：病殁也要有葬礼——棺木抚恤真出库，牌位入祖堂（库空则薄葬记愧）
            if (dead) { try { if (W.PSectLife && typeof W.PSectLife.funeral === 'function') W.PSectLife.funeral(ps, r.name || npcNameOf(r.npcId), '病殁任上'); } catch (eF) {} }
        }
        for (var id in members) {
            var row = findRow(book, id);
            if (!row) recordJoin(ps, id, members[id].role, members[id].source);
            else if (row.fate !== '在门') { row.fate = '在门'; row.leaveDay = null; row.rejoinDay = today(); }
        }
        ps._peak = Math.max(Number(ps._peak) || 0, book.rows.length - 1);
    }

    // ============ 三 · 宗谱面板 ============
    function bookRow(r) {
        var who = r.npcId ? r.name : r.name;
        // 第十八波：在门册多两列——心境与来路（生计模块的真账），开创元老单标
        var live = '';
        try {
            var ps0 = mine();
            var d0 = null;
            if (ps0 && r.npcId) {
                var all0 = (ps0.disciples || []).concat(ps0.guests || []);
                for (var li = 0; li < all0.length; li++) { if (all0[li] && all0[li].npcId === r.npcId) { d0 = all0[li]; break; } }
            }
            if (d0 && W.PSectVenture && W.PSectVenture.moodLabel) {
                live = ' · ' + W.PSectVenture.moodLabel(d0) + (d0.why ? '（' + d0.why + '）' : '') + (d0.elder ? ' · <span class="text-amber-300">开创元老</span>' : '');
            }
        } catch (eL) {}
        var line = '<div class="flex justify-between items-center py-1 border-b border-gray-700/40">'
            + '<span class="text-xs text-gray-300">🎴 ' + who + ' <span class="text-gray-500">· ' + r.role + ' · 腰牌第' + r.tokenNo + '号' + live + '</span></span>'
            + '<span class="text-[11px] text-gray-500">' + (r.fate === '在门'
                ? ('第' + (r.joinDay || 0) + '日入门' + (r.source ? '（' + r.source + '）' : '') + (r.rejoinDay ? ' · 回来的老人' : ''))
                : (r.fate + ' · 第' + (r.leaveDay || 0) + '日转另册 · 牌未缴回')) + '</span></div>';
        return line;
    }
    function openPSectBook() {
        var ps = mine();
        if (!ps) { msg('还没立过宗——宗谱的第一页还没落笔。', 'info'); return; }
        reconcile(ps);
        var book = ps._book || { rows: [] };
        var ruined = !!ps._ruined;
        var act = book.rows.filter(function (r) { return r.fate === '在门'; });
        var gone = book.rows.filter(function (r) { return r.fate !== '在门'; });
        var html = '<div class="text-left">';
        html += para('📖 <b class="text-amber-200">「' + ps.name + '」宗谱' + (ruined ? ' · 另册遗卷' : '') + '</b>——腰牌一头在册，一头在人。共发牌 ' + (book.rows.length) + ' 面，在门 ' + act.length + ' 人，另册 ' + gone.length + ' 人。');
        html += '<p class="text-xs font-bold text-amber-300 mb-1">🏮 在门册</p>';
        html += '<div class="bg-gray-900/60 rounded p-2 mb-2">' + (act.length ? act.map(bookRow).join('') : '<p class="text-xs text-gray-500">册上只剩开创的一页——院子里静得能听见风。</p>') + '</div>';
        if (gone.length) {
            html += '<p class="text-xs font-bold text-gray-400 mb-1">📕 另册（离门的、殁了的、散了的——名字都在，牌都没缴回）</p>';
            html += '<div class="bg-gray-900/60 rounded p-2 mb-2">' + gone.map(bookRow).join('') + '</div>';
        }
        if (ruined) {
            html += para('<span class="text-red-300">幡倒了——这册子转了遗卷。</span>找回三位老相识、凑五百灵石、回旧址起土，山门还能重立。');
            html += '<div style="display:flex;flex-direction:column;gap:8px">'
                + btn('🥀 回旧址看看——废墟上，也许还能起新山门', 'window._closeModal && window._closeModal(); window.sectRuinView && window.sectRuinView(\'' + ps.name + '\')', 'bg-emerald-800 hover:bg-emerald-700')
                + '</div>';
        }
        html += '</div>';
        modal('📖 ' + ps.name + (ruined ? ' · 遗卷' : ' · 宗谱'), html);
    }

    // ============ 四 · 盛会主办（掌门亲自摆席） ============
    function hostGala() {
        var name = homeName();
        if (!name) { msg('幡都倒了——先回旧址把山门重立起来，再摆席不迟。', 'warning'); return; }
        syncMirror(name);
        var r = { ok: false };
        try { r = (W.SectGala && W.SectGala.hostFor) ? W.SectGala.hostFor(name) : { ok: false, text: '盛会这一线还没通电。' }; } catch (e) {}
        if (!r.ok) { msg(r.text || '这场盛会摆不起来。', 'warning'); return; }
        settleSpend(name, '主办盛会·席面请帖');
        msg('🎪 英雄帖发出去了——半月后开席。来几家，看的是平日交情与门派的体面。', 'success');
        try { if (W.openPlayerSectPanel) W.openPlayerSectPanel(); } catch (e2) {}
    }

    // ============ 五 · 灭门与复兴（自建宗门版） ============
    // 幡倒那一刻：门人散落各城（人是真找得回的）、宗谱转遗卷、库分作盘缠——灭门结算（sect-doom）调用
    function scatterRoster(sectName, path) {
        var ps = byName(sectName);
        if (!ps) return [];
        var ids = [];
        function scat(npcId) {
            var n = getNPC(npcId);
            if (!n || n.isDead) return;
            n._scattered = true;
            try { n.location = CITIES[Math.floor(Math.random() * CITIES.length)]; } catch (e) {}
            ids.push(npcId);
        }
        (ps.disciples || []).forEach(function (d) { if (d && d.npcId) { scat(d.npcId); markFate(ps, d.npcId, '散于灭门'); } });
        (ps.guests || []).forEach(function (g) { if (g && g.npcId) { scat(g.npcId); markFate(ps, g.npcId, '散于灭门'); } });
        // 另册里的活人也是「散落的人」——早年离门的旧人，复兴时找得回来（入幸存者名单，不改他们的去向）
        try {
            var book = ps._book;
            if (book && book.rows) {
                for (var i = 0; i < book.rows.length; i++) {
                    var r = book.rows[i];
                    if (!r.npcId || r.fate === '在门' || ids.indexOf(r.npcId) >= 0) continue;
                    var n2 = getNPC(r.npcId);
                    if (n2 && !n2.isDead) ids.push(r.npcId);
                }
            }
        } catch (e3) {}
        ps.disciples = [];
        ps.guests = [];
        try { ps.resources.disciples = 0; ps.resources.spiritStones = 0; } catch (e) {}
        ps._ruined = { day: today(), path: path || 'C' };
        try { P().addHistory(ps.id, '幡倒了——门人散尽，库中分文未留。宗谱转另册·遗卷，腰牌不缴回：牌在人身上，派在心里。'); } catch (e2) {}
        return ids;
    }
    // 重立山门那一刻（sect-doom 复兴完工调用）：钱落真账、旧人携旧牌归门、镜像重新对基
    function onRevive(sectName, rv) {
        var ps = byName(sectName);
        if (!ps) return;
        var it = internal(sectName);
        var grant = it ? Math.round(Number(it.resources) || 0) : 0;
        ps._ruined = null;
        ps.resources.spiritStones = (Number(ps.resources.spiritStones) || 0) + grant;
        if (it) { it.destroyed = false; it._psLowDays = 0; it._psWarned = false; }
        ps._lastMirror = it ? Math.round(Number(it.resources) || 0) : ps._lastMirror;
        var elders = (rv && rv.elders) || [];
        for (var i = 0; i < elders.length; i++) {
            var n = getNPC(elders[i]);
            if (!n || n.isDead) continue;
            n._scattered = false;
            n._lostDisciple = null;
            var rr = null;
            try { rr = P().recruitDisciple(ps.id, elders[i]); } catch (e) {}
            if (rr && rr.ok) {
                var dd = (ps.disciples || []).filter(function (x) { return x.npcId === elders[i]; })[0];
                if (dd) { dd.name = n.name; dd.source = 'revive'; }
                recordJoin(ps, elders[i], '弟子', SOURCE_WORD.revive);
            }
        }
        try { W.PSBoot && W.PSBoot.registerInWorld(ps); } catch (e2) {}
        try { P().addHistory(ps.id, '重立山门：重建的钱与老相识的贺礼尽数入库，旧人携旧腰牌归门——幡又挂上了杆顶。'); } catch (e3) {}
        gainRep(sectName, 10, '重立山门·首功');
    }
    // 彻底散伙（复兴无望时的体面出口）：另册存档，人可以另竖新幡
    function dissolveRuinedAsk() {
        var ps = mine();
        if (!ps || !ps._ruined) { msg('宗门还立着——散伙的话，别说出口。', 'warning'); return; }
        modal('💔 彻底散伙 · ' + ps.name,
            para('「' + ps.name + '」的幡已经倒了。彻底散伙：另册存档（宗谱遗卷留在江湖记忆里），此名从此封存，你可以另竖一面新幡。')
            + '<div style="display:flex;gap:8px;margin-top:12px">'
            + '<button onclick="window.PSectWorld.dissolveRuined()" class="flex-1 bg-red-800 hover:bg-red-700 text-white text-sm py-2 rounded">散伙</button>'
            + '<button onclick="window._closeModal && window._closeModal()" class="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm py-2 rounded">再等等——说不定还能重立</button>'
            + '</div>');
    }
    function dissolveRuined() {
        var ps = mine();
        if (!ps || !ps._ruined) { msg('宗门还立着。', 'warning'); return; }
        var nm = ps.name;
        try { W.eventFlags = W.eventFlags || {}; W.eventFlags['sect_book_arch_' + nm] = JSON.parse(JSON.stringify(ps._book || { rows: [] })); } catch (e) {}
        try { P().dissolve(ps.id); } catch (e2) {}
        _close();
        msg('「' + nm + '」彻底散了——另册存了档，腰牌在各人手里。江湖路远，你可以再竖一面新幡。', 'info');
        try { if (W.openPlayerSectPanel) W.openPlayerSectPanel(); } catch (e3) {}
    }

    // ============ 六 · 外交线（第五条线：掌门亲手走江湖——结盟/送礼/战事都落自家真账） ============
    // 自建宗门早已在外交册落座（sect-war），可外交面板对掌门是只读的：征讨结盟走的是弟子贡献账，
    // 创始人没有这本账；死仇也从不压它的山门。本节把三件事接到掌门手上——
    //   结盟：使者盘缠八十灵石走宗库（两讫），成败看平日交情（与 NPC 门派结盟同一公式）；
    //   送礼：三十灵石一车礼（月一回一家，礼数太密反显刻意）——礼真进对方库房（守恒），深怨之家收礼也防着；
    //   战事：死仇压山门由 sect-war 日钩触发（真仗），结算落这里——守胜涨声望稳人心，守败库房真被搬、
    //         可能战殁具名弟子（宗谱记殁）；攻山赢了缴获真入宗库（从对方库房里搬），输了江湖耻笑。
    // 钱一律走三步两讫（先 syncMirror 收账 → 动镜像 → settleSpend/落真账），月结看到差额为零，不误记劫掠。
    var ALLY_COST = 80;   // 遣使议盟：使者盘缠（宗库出）
    var GIFT_COST = 30;   // 外交送礼：一车礼品（宗库出，真进对方库房）
    function dip() { return W.SECT_DIPLOMACY_STATE || null; }
    function saveDip() { try { if (typeof W.saveSectDiplomacy === 'function') W.saveSectDiplomacy(); } catch (e) {} }
    function relCellOf(a, b) { var d = dip(); return (d && d[a] && d[a][b]) || null; }
    function setRelBoth(a, b, delta) {
        var d = dip();
        if (!d) return 0;
        if (!d[a]) d[a] = {};
        if (!d[b]) d[b] = {};
        if (!d[a][b]) d[a][b] = { relation: 0, trade: 0, conflicts: 0, lastEvent: 0, treaties: [] };
        if (!d[b][a]) d[b][a] = { relation: 0, trade: 0, conflicts: 0, lastEvent: 0, treaties: [] };
        var nv = Math.max(-100, Math.min(100, Math.round((Number(d[a][b].relation) || 0) + delta)));
        d[a][b].relation = nv;
        d[b][a].relation = nv;
        d[a][b].lastEvent = today();
        d[b][a].lastEvent = today();
        saveDip();
        return nv;
    }
    // 宗库支出（三步两讫）：不够就办不成，分文不动
    function spendTreasury(name, amount, label) {
        var ps = byName(name);
        if (!ps || ps._ruined) return false;
        syncMirror(name);
        var it = internal(name);
        if (!it) return false;
        var have = Math.round(Number(it.resources) || 0);
        if (have < amount) return false;
        it.resources = have - amount;
        settleSpend(name, label);
        return true;
    }
    // 兵祸抄掠：不够就搬空（战败不能倒欠）
    function drainTreasury(name, wanted, label) {
        var ps = byName(name);
        if (!ps || ps._ruined) return 0;
        syncMirror(name);
        var it = internal(name);
        if (!it) return 0;
        var have = Math.round(Number(it.resources) || 0);
        var take = Math.max(0, Math.min(wanted, have));
        if (take <= 0) return 0;
        it.resources = have - take;
        settleSpend(name, label);
        return take;
    }
    // 宗库进项（两讫）：镜像与真账同笔加上、基线对齐——月结差额为零
    function gainTreasury(name, amount, label) {
        var ps = byName(name);
        if (!ps || ps._ruined || !amount) return false;
        syncMirror(name);
        var it = internal(name);
        if (!it) return false;
        it.resources = Math.round(Number(it.resources) || 0) + amount;
        ps.resources.spiritStones = (Number(ps.resources.spiritStones) || 0) + amount;
        ps._lastMirror = Math.round(Number(it.resources) || 0);
        try { P().addHistory(ps.id, label + '：宗库进灵石 ' + amount + ' 枚。'); } catch (e) {}
        return true;
    }
    // 结盟（宗库出盘缠，成败看平日交情——与既有门派结盟同一口径）
    function allianceFor(name, other) {
        var ps = byName(name);
        if (!ps || ps._ruined) return { ok: false, text: '幡都倒了——先回旧址把山门重立起来，再谈盟约。' };
        var c = relCellOf(name, other);
        if (!c) return { ok: false, text: '外交册上还没这一家——落座了再议。' };
        if (((c.treaties) || []).indexOf('alliance') >= 0) return { ok: false, text: '两家已经换过盟书了——盟不可再。' };
        if (!spendTreasury(name, ALLY_COST, '遣使议盟·使者盘缠')) return { ok: false, text: '宗库凑不出八十灵石的盘缠——无礼无以言盟。' };
        advance(120, '遣使议盟');
        var rel = Number(c.relation) || 0;
        var chance = Math.min(0.9, Math.max(0.15, 0.5 + rel / 200));
        if (Math.random() < chance) {
            c.treaties = c.treaties || [];
            c.treaties.push('alliance');
            var back = relCellOf(other, name);
            if (back) { back.treaties = back.treaties || []; back.treaties.push('alliance'); }
            var nv = setRelBoth(name, other, 15);
            chron(name, '与「' + other + '」互换了盟书——使者带回对方的信物，盟书上写着：山门有难，来相援。');
            chron(other, '与「' + name + '」互换了盟书——自此守望相助，山门有难来相援。');
            note(name, '与「' + other + '」结盟成了。（两家关系回暖；日后山门有难，盟家会领众来援）');
            if (nv >= 80) street('江湖佳话：「' + name + '」与「' + other + '」互换了盟书——两家弟子如今在江湖上同行同宿。');
            return { ok: true, text: '🤝 使者回禀：「' + other + '」愿与本门结盟，两家互换信物！（关系+15；盟书有约：山门有难，来相援）' };
        }
        setRelBoth(name, other, -5);
        chron(name, '遣使赴「' + other + '」议盟——对方婉拒：「时机未到。」使者空手而回。');
        note(name, '议盟被「' + other + '」婉拒了。（关系冷了一分）');
        return { ok: false, text: '📜 使者空手而回——「' + other + '」婉拒：「时机未到。」（关系-5；平日多走动，成功率更高）' };
    }
    // 送礼（月一回一家；礼真进对方库房——钱不凭空消失）
    function giftFor(name, other) {
        var ps = byName(name);
        if (!ps || ps._ruined) return { ok: false, text: '幡都倒了——送不出礼。' };
        var c = relCellOf(name, other);
        if (!c) return { ok: false, text: '外交册上还没这一家。' };
        var f = flags();
        var key = 'ps_diplo_gift_' + name + '_' + other;
        var mi = Math.floor(today() / 30);
        if (Number(f[key] != null ? f[key] : -1) === mi) return { ok: false, text: '这个月已经给「' + other + '」送过礼了——礼数太密，反显刻意。' };
        if (!spendTreasury(name, GIFT_COST, '外交送礼·车马礼品')) return { ok: false, text: '宗库凑不出三十灵石的礼品。' };
        f[key] = mi;
        var rel = Number(c.relation) || 0;
        var gain = rel <= -40 ? 5 : 10; // 深怨之家收下一车礼，多半是防着你
        setRelBoth(name, other, gain);
        try { var io = internal(other); if (io) io.resources = (Number(io.resources) || 0) + GIFT_COST; } catch (e) {}
        chron(other, '「' + name + '」遣人送来一车礼品——伸手不打送礼人，收下了。');
        note(name, '给「' + other + '」送了一车礼。（礼薄情重，两家走动起来了）');
        advance(60, '备礼遣送');
        return { ok: true, text: '🎁 礼品送到了「' + other + '」——对方收下了。（关系+' + gain + '）' };
    }
    // 兴兵资格（宿怨之门 + 六十日喘气 + 对方幡还立着）——sect-war 殿议与外交面板共用
    function warEligible(name, other) {
        if (!name || name !== homeName()) return { ok: false, text: '幡都倒了——打不了仗。' };
        var c = relCellOf(name, other);
        if (!c) return { ok: false, text: '外交册上还没这一家。' };
        var rel = Number(c.relation) || 0;
        if (rel > -40) return { ok: false, text: '与「' + other + '」没有能动刀的怨——兴兵无名，江湖上要笑话的。' };
        try { if (typeof W.sectIsRuined === 'function' && W.sectIsRuined(other)) return { ok: false, text: '「' + other + '」的幡已经倒了——死人堆里没仇可报。' }; } catch (e) {}
        var cdLeft = 0;
        try { cdLeft = Math.max(0, Number((W.eventFlags || {})['sect_war_cd_' + other] || 0) - today()); } catch (e2) {}
        if (cdLeft > 0) return { ok: false, text: '六十日之内刚与「' + other + '」动过刀——门中上下都要喘口气。' };
        return { ok: true, rel: rel };
    }
    function powerMulOf(sect) {
        try { if (typeof W.sectPowerWarMul === 'function') { var m = W.sectPowerWarMul(sect); if (m) return m; } } catch (e) {}
        var MUL = { '巨擘': 1.4, '大派': 1.2, '中等偏上': 1.05, '中等': 1.0, '小': 0.85, '极小': 0.7 };
        try { var s = (W.sectsData || {})[sect]; return MUL[(s && s.power) || ''] || 1; } catch (e2) { return 1; }
    }
    function warModOf(sect, win) { try { if (typeof W.sectPowerWarMod === 'function') W.sectPowerWarMod(sect, win); } catch (e) {} }
    function alignShiftOf(sect, d, r) { try { if (typeof W.sectAlignShift === 'function') W.sectAlignShift(sect, d, r); } catch (e) {} }
    function bumpAll(ps, n) { try { if (W.PSectVenture && W.PSectVenture.bumpMoodAll) W.PSectVenture.bumpMoodAll(ps, n); } catch (e) {} }
    function moraleOf(name, d) {
        var it = internal(name);
        if (!it) return;
        it.morale = Math.max(0, Math.min(100, (Number(it.morale) || 50) + d));
    }
    // ============ 第二十波 · 盟约联动（盟书不是空头名分——山门有难，盟家来援；盟家有难，掌门出兵） ============
    // 换过盟书（treaties 含 alliance）的两家：①死仇压山时盟家按交情深浅掷骰领众来援——
    // 来一家，敌人就得分兵（攻/防/耐久真降一成，最多三家、折到七成为止），战后两家关系回暖、编年互记；
    // ②江湖战云里若被围的是自家盟家，风云册上可「出兵相援」（真仗）——击退围军则战云散、
    //   受援方按库房谢礼（守恒：真从对方库里出、真进自家宗库）；败了战云不散，情分也记一笔。
    function alliesOf(name) {
        var d = dip();
        var out = [];
        if (!d || !d[name]) return out;
        for (var other in d[name]) {
            var c = d[name][other];
            if (!c || ((c.treaties) || []).indexOf('alliance') < 0) continue;
            try { if (typeof W.sectIsRuined === 'function' && W.sectIsRuined(other)) continue; } catch (e) {} // 幡倒了的人家来不了
            out.push(other);
        }
        return out;
    }
    // 守山开战前调用（sect-war startWar / startTideSiege）：盟家掷骰来援，来的真削敌人战力；返回来援名单
    // 第二十七波：kind='tide' 时换兽潮话术——盟家不是来分兵的，是上了墙头迎头截兽的
    function allyAid(name, enemy, kind) {
        var came = [];
        if (!name || !enemy) return came;
        var allies = alliesOf(name);
        for (var i = 0; i < allies.length && came.length < 3; i++) {
            var a = allies[i];
            var c = relCellOf(name, a);
            var rel = Number((c && c.relation) || 0);
            var p = Math.min(0.85, Math.max(0.2, 0.4 + rel / 250)); // 交情越深，来得越快
            if (Math.random() < p) came.push(a);
        }
        if (!came.length) return came;
        var mul = Math.max(0.7, 1 - 0.1 * came.length); // 来一家分兵一成——攻/防/耐久都折
        enemy.attack = Math.max(1, Math.round((Number(enemy.attack) || 0) * mul));
        enemy.defense = Math.max(1, Math.round((Number(enemy.defense) || 0) * mul));
        enemy.maxDurability = Math.max(1, Math.round((Number(enemy.maxDurability) || 0) * mul));
        if (enemy.durabilities) { for (var k in enemy.durabilities) enemy.durabilities[k] = Math.max(1, Math.round((Number(enemy.durabilities[k]) || 0) * mul)); }
        if (kind === 'tide') {
            log('🤝 山门告急，盟家「' + came.join('」「') + '」领众上了墙头，把兽群迎头截住——兽群的凶性被折了几分。（一纸盟书，抵得千军）', 'success');
            street('「' + name + '」的山门让兽潮围了，盟家「' + came.join('」「') + '」的人马连夜赶到墙头——茶棚里都在说：这道门，两家一起守。');
        } else {
            log('🤝 山门告急，盟家「' + came.join('」「') + '」领众来援——来犯之敌不得不分兵相迎。（一纸盟书，抵得千军）', 'success');
            street('「' + name + '」山门告急，盟家「' + came.join('」「') + '」的人马连夜赶到——一纸盟书抵得千军，茶棚里都在说这段佳话。');
        }
        return came;
    }
    // 战事也上风云册（近来战事一栏，与 AI 战事同列——没有战报的就不挂翻战报按钮）
    function warsRecord(rec) {
        try {
            var f = flags();
            if (!f['sect_world_wars'] || !f['sect_world_wars'].push) f['sect_world_wars'] = [];
            f['sect_world_wars'].push(rec);
            if (f['sect_world_wars'].length > 12) f['sect_world_wars'].splice(0, f['sect_world_wars'].length - 12);
        } catch (e) {}
    }
    // 战事结算（sect-war 的 settleSectWar 认出 _warHome 后转到这里）——落自家真账，不动弟子贡献账
    // 第二十波第五参 opt：{ allies: 守山时来援的盟家名单, rescue: 攻山是为哪家盟家解围 }
    function settlePsWar(win, foe, side, name0, opt) {
        var ps = byName(name0 || homeName());
        if (!ps || !foe) return;
        var name = ps.name;
        var came = (opt && opt.allies) || [];
        var rescued = (opt && opt.rescue) || null;
        if (side === 'defend') {
            if (win) {
                setRelBoth(name, foe, 20);
                warModOf(name, true);
                alignShiftOf(name, 2, '守山');
                gainRep(name, 2, '击退来犯·山门无恙');
                moraleOf(name, 8);
                bumpAll(ps, 4);
                chron(name, '「' + foe + '」兵临山门，被掌门带着门人打了回去——山门无恙，这一仗江湖都看在眼里。' + (came.length ? '盟家「' + came.join('」「') + '」领众来援，盟书添了一笔实证。' : ''));
                chron(foe, '兵发「' + name + '」山门，被打了回来——折了些人手，无功而返。');
                came.forEach(function (a) {
                    setRelBoth(name, a, 5);
                    chron(a, '领众援「' + name + '」守山——合力打退了来犯之敌。这一趟没白来，两家的编年都记下了。');
                });
                note(name, '击退「' + foe + '」的来袭——山门保住了。（声望+2，门中士气大振' + (came.length ? '；来援的盟家情分更笃' : '') + '）');
                warsRecord({ day: today(), atk: foe, def: name, winner: name, loser: foe, loss: 0, spoils: 0, dead: 0 });
                log('🛡️ 「' + foe + '」的人退了——山门保住，你的幡还立着。（声望+2，弟子们心定了）', 'success');
            } else {
                var want = 60 + Math.floor(Math.random() * 60);
                var take = drainTreasury(name, want, '兵祸·库房被搬');
                try { var iff = internal(foe); if (iff) iff.resources = (Number(iff.resources) || 0) + Math.round(take * 0.6); } catch (e2) {} // 守恒：抄走的六成进了对方库房，贼过手也折
                setRelBoth(name, foe, -10);
                warModOf(name, false);
                warModOf(foe, true);
                alignShiftOf(foe, -3, '攻山');
                moraleOf(name, -10);
                bumpAll(ps, -6);
                // 战殁：三成可能有一位具名弟子没能回来（宗谱记殁、名册除名——牌在人身上）
                // 第二十一波：人在山下办差的殁不到山门上——只从在山的人里挑
                var fell = null;
                var homePool = (ps.disciples || []).filter(function (x) { return x && !x.away; });
                if (Math.random() < 0.30 && homePool.length) {
                    fell = homePool[Math.floor(Math.random() * homePool.length)];
                    var fi = ps.disciples.indexOf(fell);
                    if (fi >= 0) ps.disciples.splice(fi, 1);
                    try { var nn = getNPC(fell.npcId); if (nn) nn.isDead = true; } catch (e3) {}
                    markFate(ps, fell.npcId, '殁于任');
                }
                var lossWord = take > 0 ? ('库房被搬走灵石' + take) : '库房本就是空的，他们把能砸的都砸了';
                came.forEach(function (a) {
                    setRelBoth(name, a, 2);
                    chron(a, '领众援「' + name + '」——没能守住山门。人退了，情分记在编年里。');
                });
                chron(name, '山门被「' + foe + '」踏破一角：' + lossWord + (fell ? '，「' + (fell.name || npcNameOf(fell.npcId)) + '」殁在了这一仗里' : '') + '。此仇，编年记下了。');
                chron(foe, '踏破了「' + name + '」的山门一角——搬回灵石' + Math.round(take * 0.6) + '。');
                note(name, '守山失利——' + (take > 0 ? ('库房折损灵石' + take + '。') : '库房虽空，脸面扫地。') + (fell ? '「' + (fell.name || '') + '」战殁，门中致哀，宗谱记殁。' : '门里的人心浮动。'));
                street('「' + name + '」的山门被「' + foe + '」踏破了一角——' + (fell ? '抬下来一位殁了的弟子。' : '门里的人心浮动。'));
                warsRecord({ day: today(), atk: foe, def: name, winner: foe, loser: name, loss: take, spoils: Math.round(take * 0.6), dead: fell ? 1 : 0 });
                log('💔 山门被「' + foe + '」踏破一角，' + (take > 0 ? ('库房被搬走灵石' + take) : '库里本就没几个钱') + (fell ? '——「' + (fell.name || '') + '」没能回来' : '') + '。这笔账，编年记下了。（库里空了、人散了，幡就立不住了）', 'error');
            }
        } else {
            if (win) {
                // 守恒：缴获搬的是对方库房里真有的——穷门抄不出富账
                var calc = Math.round((120 + Math.floor(Math.random() * 180)) * powerMulOf(foe));
                var held = 0;
                try { var itf0 = internal(foe); held = itf0 ? Math.round(Number(itf0.resources) || 0) : 0; } catch (eH) {}
                var spoils = Math.min(calc, held);
                try { var itf = internal(foe); if (itf) itf.resources = Math.max(0, held - spoils); } catch (e4) {}
                if (spoils > 0) gainTreasury(name, spoils, '攻山缴获·装车运回');
                setRelBoth(name, foe, -35);
                warModOf(name, true);
                warModOf(foe, false);
                alignShiftOf(name, -3, '攻山');
                moraleOf(name, 6);
                bumpAll(ps, 3);
                try { if (W.currentCharData) W.currentCharData.fame = Math.min(99999, (W.currentCharData.fame || 0) + 5); } catch (e5) {}
                if (rescued) {
                    // 出兵相援成了：围军被击退，战云散；受援方按库房谢礼（守恒：真从对方库里出、真进自家宗库）
                    try { flags()['sect_world_war_pending'] = null; } catch (eP) {}
                    setRelBoth(name, rescued, 25);
                    gainRep(name, 3, '出兵相援盟家·击退围军');
                    try { if (W.currentCharData) W.currentCharData.fame = Math.min(99999, (W.currentCharData.fame || 0) + 3); } catch (e6) {}
                    var ia = internal(rescued);
                    var gift = ia ? Math.min(120, Math.floor((Number(ia.resources) || 0) * 0.15)) : 0;
                    if (gift > 0) {
                        ia.resources = (Number(ia.resources) || 0) - gift;
                        gainTreasury(name, gift, '受援方谢礼·装车送来');
                    }
                    chron(name, '出兵相援「' + rescued + '」，把「' + foe + '」的围军击退在山下——盟书添了实证' + (gift > 0 ? '，谢礼灵石' + gift + '入库' : '') + '。');
                    chron(rescued, '「' + foe + '」的围军被「' + name + '」击退在山下——山门保住了。谢礼装车送去，这份情编年记下了。');
                    chron(foe, '兵围「' + rescued + '」，被来援的「' + name + '」击退——折了些人手，这笔账又添了一姓。');
                    street('江湖佳话：「' + foe + '」围困「' + rescued + '」，盟家「' + name + '」出兵相援，把围军击退在山下——一纸盟书抵得千军，茶棚里都说这段义气。');
                    note(name, '相援「' + rescued + '」成了——「' + foe + '」的围军退了，战云散了。' + (gift > 0 ? '谢礼灵石' + gift + '入宗库。' : '') + '（两家盟好如金石；你的名望再涨）');
                    warsRecord({ day: today(), atk: name, def: foe, winner: name, loser: foe, loss: spoils, spoils: spoils, dead: 0, rescue: rescued });
                    log('🤝 「' + foe + '」的围军被你击退——「' + rescued + '」的山门保住了，战云散了。（盟家关系大涨' + (gift > 0 ? '，谢礼灵石' + gift + '入宗库' : '') + '；对方记死了这笔仇）', 'success');
                } else {
                    chron(name, '兴兵踏破了「' + foe + '」的山门——' + (spoils > 0 ? ('战利装车运回，缴获灵石' + spoils + '。') : '库房翻了个底朝天，没抄出几个钱。') + '这一仗，江湖都记住了。');
                    chron(foe, '山门被「' + name + '」踏破：库房被搬走灵石' + spoils + '。此仇，编年记下了。');
                    street('江湖大新闻：「' + name + '」兴兵踏破了「' + foe + '」的山门！' + (spoils > 0 ? '战利装车运回——' : '') + '茶棚里都在说这位掌门的刀。');
                    note(name, '踏破「' + foe + '」山门' + (spoils > 0 ? '，缴获尽入宗库' : '——对方库房是空的，赢的是脸面') + '。（你的名望+5；对方记死了这笔仇）');
                    warsRecord({ day: today(), atk: name, def: foe, winner: name, loser: foe, loss: spoils, spoils: spoils, dead: 0 });
                    log('⚔️ 「' + foe + '」的山门被你踏破——' + (spoils > 0 ? ('缴获灵石' + spoils + '尽入宗库。') : '对方库房空空，缴获无几。') + '（对方记仇：关系大跌；你的名望+5）', 'success');
                }
            } else {
                setRelBoth(name, foe, -5);
                warModOf(name, false);
                warModOf(foe, true);
                alignShiftOf(foe, 2, '守山');
                moraleOf(name, -4);
                bumpAll(ps, -3);
                if (rescued) {
                    // 相援不成：战云不散（围还在），但这份情盟家记下了
                    setRelBoth(name, rescued, 5);
                    chron(rescued, '「' + name + '」出兵相援，被「' + foe + '」打了回去——援虽不成，这份情编年记下了。');
                    note(name, '相援「' + rescued + '」失利——围军未解，无功而返。（盟家记下了这份情；江湖耻笑照旧）');
                    warsRecord({ day: today(), atk: name, def: foe, winner: foe, loser: name, loss: 0, spoils: 0, dead: 0, rescue: rescued });
                    log('💔 相援「' + rescued + '」不成，反被「' + foe + '」打了下来——围还在，江湖人都会知道这一仗。', 'error');
                } else {
                    chron(name, '兴兵攻「' + foe + '」山门不成，被打了回来——江湖人都会知道这一仗。');
                    chron(foe, '「' + name + '」兴兵来犯，被门下打了回去。');
                    note(name, '攻山失利——无功而返，江湖耻笑。（关系再冷一分）');
                    warsRecord({ day: today(), atk: name, def: foe, winner: foe, loser: name, loss: 0, spoils: 0, dead: 0 });
                    log('💔 攻山不成，反被「' + foe + '」打了下来——江湖人都会知道这一仗。（战败之痛照常：昏迷、旧伤都可能落下）', 'error');
                }
            }
        }
        saveDip();
    }
    // 外交面板上的三只按钮（onclick 直达）
    W.psDiploAlly = function (other) {
        var name = homeName();
        if (!name) { msg('还没立宗——谈什么盟约。', 'warning'); return; }
        var r = allianceFor(name, other);
        msg(r.text, r.ok ? 'success' : 'warning');
        try { if (typeof W.showSectDiplomacy === 'function') W.showSectDiplomacy(name); } catch (e) {}
    };
    W.psDiploGift = function (other) {
        var name = homeName();
        if (!name) { msg('还没立宗——送不出礼。', 'warning'); return; }
        var r = giftFor(name, other);
        msg(r.text, r.ok ? 'success' : 'warning');
        try { if (typeof W.showSectDiplomacy === 'function') W.showSectDiplomacy(name); } catch (e) {}
    };
    W.psDiploWar = function (other) {
        var name = homeName();
        if (!name) { msg('还没立宗——没有山门，何来战事。', 'warning'); return; }
        var we = warEligible(name, other);
        if (!we.ok) { msg(we.text, 'warning'); return; }
        try { if (typeof W.declareWarForHome === 'function') W.declareWarForHome(name, other); } catch (e) {}
    };

    // ============ 七 · 日结接线（月度对册） ============
    try {
        if (W.EventBus && W.EventBus.on) {
            W.EventBus.on('newDay', function () {
                try {
                    var day = today();
                    if (!day || day % 30 !== 0) return;
                    var ps = mine();
                    if (ps) reconcile(ps);
                } catch (e) {}
            });
            W.EventBus.on('playerSect:discipleRecruited', function (p) {
                try {
                    if (!p || !p.sectId) return;
                    var ps = P().getSect(p.sectId);
                    if (ps) recordJoin(ps, p.npcId, '弟子', '');
                } catch (e) {}
            });
        }
    } catch (e) {}

    // ============ 导出 ============
    W.PSectWorld = {
        homeName: homeName, byName: byName, realStones: realStones, gainRep: gainRep, note: note,
        syncMirror: syncMirror, settleSpend: settleSpend,
        ensureBook: ensureBook, recordJoin: recordJoin, markFate: markFate, reconcile: reconcile,
        openPSectBook: openPSectBook, hostGala: hostGala,
        scatterRoster: scatterRoster, onRevive: onRevive,
        dissolveRuinedAsk: dissolveRuinedAsk, dissolveRuined: dissolveRuined,
        // 第十九波 · 外交线
        ALLY_COST: ALLY_COST, GIFT_COST: GIFT_COST,
        relCellOf: relCellOf, setRelBoth: setRelBoth,
        spendTreasury: spendTreasury, drainTreasury: drainTreasury, gainTreasury: gainTreasury,
        allianceFor: allianceFor, giftFor: giftFor, warEligible: warEligible, settlePsWar: settlePsWar,
        // 第二十波 · 盟约联动
        alliesOf: alliesOf, allyAid: allyAid
    };
    // 探针（测试用）
    W.PSectWorld.probe = function () {
        var ps = mine();
        if (!ps) return null;
        reconcile(ps);
        var book = ps._book || { rows: [] };
        return {
            name: ps.name, ruined: !!ps._ruined,
            real: realStones(ps.name),
            mirror: internal(ps.name) ? Math.round(Number(internal(ps.name).resources) || 0) : null,
            lastMirror: ps._lastMirror,
            members: (ps.disciples || []).length + (ps.guests || []).length,
            peak: Number(ps._peak) || 0,
            bookRows: book.rows.length,
            activeRows: book.rows.filter(function (r) { return r.fate === '在门'; }).length,
            goneRows: book.rows.filter(function (r) { return r.fate !== '在门'; }).length
        };
    };
    console.log('[player-sect-world] 自建宗门四条线已接：举幡争城（钱两讫名目清）/盛会主办（一年一回掌门亲摆）/灭门复兴（空幡六十日灯自灭·第三十日先提醒·旧腰牌不换新）/宗谱腰牌（入门发牌·另册留名）；第十九波添外交线（结盟送礼战事全落自家真账）；第二十波添盟约联动（守山盟家来援·出兵相援战云散）；第二十一波添病殁治丧（棺木抚恤真出库）');
})();
