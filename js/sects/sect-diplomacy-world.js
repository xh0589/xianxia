// ==================== sect-diplomacy-world.js - 江湖风云（AI 门派外交档案是活的） ====================
// 外交全矩阵此前只在开局发牌一次——之后 AI 门派之间的关系就是一潭死水：不结怨、不修好、不开战。
// 本模块让档案跟着世界走：
//   ① 底色随立场：关系每向「动态立场底色」回归一格（门派行善，旧怨慢慢暖；作恶，旧交慢慢冷）；
//   ② 月度江湖事：摩擦/援手/商队/论道/劫掠，两家编年各记一笔，死仇结盟是街谈大新闻；
//   ③ AI 战争后台真打：死仇（≤-70）有概率兴兵，胜负按动态势力分+守方地利，战利品守恒转移、
//      弟子真死伤、战绩修正真落（sect-standing）、双方编年+街谈；玩家的门派永不被动卷入（走既有玩家战争线）；
//   ④ 江湖风云册：外交面板一键纵览——死仇簿/结盟簿/近来战事。
// 纪律：全走真账（SECT_DIPLOMACY_STATE/编年/街谈/库存/弟子数/势力战绩修正）；月度节流不刷屏；零外文字母。
(function () {
    'use strict';
    var W = window;

    function flags() { return (W.eventFlags = W.eventFlags || {}); }
    // 第九波·总账根治：timeSystem.totalDays 在生产里根本不存在，旧钟恒 0——AI 江湖事/劫掠/AI 战争全是死代码。
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
    function isPSect(n) { try { return !!(W.PSBoot && typeof W.PSBoot.isPlayerSect === 'function' && W.PSBoot.isPlayerSect(n)); } catch (e) { return false; } }
    function log(m, t) { try { if (W.gameLog && W.gameLog.add) W.gameLog.add(m); } catch (e) {} }
    function internal(sect) { return (W.SECT_INTERNAL && W.SECT_INTERNAL[sect]) || null; }
    function mySect() { try { var d = W.discipleState; return d && d.isInSect ? (d.sectName || d.sectId) : null; } catch (e) { return null; } }
    function dip() { return W.SECT_DIPLOMACY_STATE || null; }
    function save() { try { if (typeof W.saveSectDiplomacy === 'function') W.saveSectDiplomacy(); } catch (e) {} }
    function chron(sect, text) {
        try { if (W.SectGov && W.SectGov.chronicle) { W.SectGov.chronicle(sect, text); return; } } catch (e) {}
        var it = internal(sect);
        if (!it) return;
        if (!it.chronicle) it.chronicle = [];
        it.chronicle.push({ day: absDay(), text: String(text) });
        if (it.chronicle.length > 40) it.chronicle.splice(0, it.chronicle.length - 40);
    }
    function street(text) {
        try {
            var f = flags();
            if (!f['qi_street'] || !f['qi_street'].push) f['qi_street'] = [];
            f['qi_street'].push({ day: absDay(), text: String(text) });
            if (f['qi_street'].length > 60) f['qi_street'].splice(0, f['qi_street'].length - 60);
        } catch (e) {}
    }
    function alignOf(sect) { try { if (typeof W.sectAlignNow === 'function') { var a = W.sectAlignNow(sect); if (a) return a.align; } } catch (e) {} return 0; }
    function powerScore(sect) { try { if (typeof W.sectPowerNow === 'function') { var p = W.sectPowerNow(sect); if (p) return p.score; } } catch (e) {} return 150; }
    function warMod(sect, win) { try { if (typeof W.sectPowerWarMod === 'function') W.sectPowerWarMod(sect, win); } catch (e) {} }
    function clamp(v) { return Math.max(-100, Math.min(100, Math.round(v))); }
    // 动态底色：立场相近则亲，相斥则疏；同乡加五分香火情
    function baseRel(a, b) {
        var aa = alignOf(a), ab = alignOf(b);
        var v = (aa + ab) / 2 - Math.abs(aa - ab) / 3;
        try {
            var la = (W.sectsData[a] || {}).location, lb = (W.sectsData[b] || {}).location;
            if (la && la === lb) v += 5;
        } catch (e) {}
        return clamp(v);
    }
    function pairCell(a, b) {
        var d = dip();
        if (!d) return null;
        if (!d[a]) d[a] = {};
        if (!d[a][b]) d[a][b] = { relation: baseRel(a, b), trade: 0, conflicts: 0, lastEvent: 0, treaties: [] };
        if (!d[b]) d[b] = {};
        if (!d[b][a]) d[b][a] = d[a][b];
        return d[a][b];
    }
    function aiPairs() {
        var mine = mySect();
        var sects = W.sectsData || {};
        var names = [];
        for (var s in sects) { if (s !== mine && !isPSect(s)) names.push(s); } // 第九波：玩家自建宗门不入 AI 配对池——不代替它宣战、不背着它劫掠
        var pairs = [];
        for (var i = 0; i < names.length; i++) {
            for (var j = i + 1; j < names.length; j++) pairs.push([names[i], names[j]]);
        }
        return pairs;
    }
    function setRel(a, b, v) {
        var d = dip();
        if (!d) return;
        if (d[a] && d[a][b]) d[a][b].relation = clamp(v);
        if (d[b] && d[b][a]) d[b][a].relation = clamp(v);
    }
    function getRel(a, b) {
        var d = dip();
        if (!d || !d[a] || !d[a][b]) return null;
        return Number(d[a][b].relation) || 0;
    }
    function thresholdNews(a, b, oldRel, newRel) {
        if (oldRel > -70 && newRel <= -70) street('茶棚里有人压着嗓子：「' + a + '和' + b + '这是结了死仇了——两边的弟子在江湖上碰见，手都按在刀柄上。」');
        if (oldRel < 80 && newRel >= 80) street('江湖佳话：「' + a + '」与「' + b + '」互换了盟书——两家弟子如今在江湖上同行同宿，谁也不敢轻易招惹。');
    }

    // ============ 一 · 底色回归（档案跟着立场走） ============
    function regressionMonthly(pairs) {
        for (var i = 0; i < pairs.length; i++) {
            var a = pairs[i][0], b = pairs[i][1];
            var rel = getRel(a, b);
            if (rel == null) continue;
            var base = baseRel(a, b);
            if (rel === base) continue;
            setRel(a, b, rel > base ? rel - 1 : rel + 1); // 一月一格：旧怨慢慢淡，旧交慢慢暖
        }
    }

    // ============ 二 · 月度江湖事（一月至多两桩，写进两家编年） ============
    var MONTHLY_EVENTS = 2;
    function eventMonthly(pairs) {
        if (!pairs.length) return;
        for (var k = 0; k < MONTHLY_EVENTS; k++) {
            var idx = Math.floor(Math.random() * pairs.length);
            var a = pairs[idx][0], b = pairs[idx][1];
            var c = pairCell(a, b);
            if (!c) continue;
            var old = Number(c.relation) || 0;
            var r = Math.random();
            if (r < 0.30) {
                setRel(a, b, old - 8);
                c.lastEvent = absDay();
                chron(a, '门下弟子与「' + b + '」的人在市集上动了手——两边各执一词，谁也不服谁。（交情冷了）');
                chron(b, '门下弟子与「' + a + '」的人在市集上动了手——两边各执一词，谁也不服谁。（交情冷了）');
            } else if (r < 0.55) {
                var helper = Math.random() < 0.5 ? a : b;
                var helped = helper === a ? b : a;
                setRel(a, b, old + 6);
                c.lastEvent = absDay();
                chron(helper, '「' + helped + '」遭了山洪，' + helper + '遣弟子押粮下山相助——这份人情，两家都记在了账上。');
                chron(helped, '遭了山洪，「' + helper + '」押粮下山相助——这份人情，记下了。');
            } else if (r < 0.75) {
                setRel(a, b, old + 4);
                c.trade = (Number(c.trade) || 0) + 1;
                c.lastEvent = absDay();
                var ia = internal(a), ib = internal(b);
                if (ia) ia.resources = (Number(ia.resources) || 0) + 10;
                if (ib) ib.resources = (Number(ib.resources) || 0) + 10;
                chron(a, '与「' + b + '」的商队走起来了——香火钱换药材，两下里都得了实惠。（各入灵石十枚）');
                chron(b, '与「' + a + '」的商队走起来了——香火钱换药材，两下里都得了实惠。（各入灵石十枚）');
            } else if (r < 0.90) {
                setRel(a, b, old + 3);
                c.lastEvent = absDay();
                chron(a, '与「' + b + '」的长老在山间论道三日——道不同，理相通，临别各赠一卷经。');
                chron(b, '与「' + a + '」的长老在山间论道三日——道不同，理相通，临别各赠一卷经。');
            } else {
                var raider = Math.random() < 0.5 ? a : b;
                var victim = raider === a ? b : a;
                setRel(a, b, old - 15);
                c.conflicts = (Number(c.conflicts) || 0) + 1;
                c.lastEvent = absDay();
                var iv = internal(victim), ir = internal(raider);
                var lost = 40;
                if (iv) iv.resources = Math.max(0, (Number(iv.resources) || 0) - lost);
                if (ir) ir.resources = (Number(ir.resources) || 0) + 30; // 贼过手也要折一成
                chron(victim, '夜里遭了一伙蒙面人洗劫外库，失灵石四十——手法像是「' + raider + '」的路数。没有实证，但这笔账记下了。');
                chron(raider, '（这一页被人撕去了半角——门里没人肯说那夜的事。）');
            }
            thresholdNews(a, b, old, getRel(a, b));
        }
        save();
    }

    // ============ 三 · AI 战争（后台真打，胜负按动态势力分） ============
    function wars() {
        var f = flags();
        if (!f['sect_world_wars'] || !f['sect_world_wars'].push) f['sect_world_wars'] = [];
        return f['sect_world_wars'];
    }
    function pending() { return flags()['sect_world_war_pending'] || null; }
    function warMonthly(pairs) {
        var day = absDay();
        if (pending()) return; // 一桩战云未落，江湖上不摆第二场
        var cands = [];
        for (var i = 0; i < pairs.length; i++) {
            var a = pairs[i][0], b = pairs[i][1];
            var c = pairCell(a, b);
            if (!c) continue;
            if ((Number(c.relation) || 0) > -70) continue;
            if (day - (Number(c.lastEvent) || 0) < 90) continue; // 打完一仗要缓，仇也不是一月一报
            var ia = internal(a), ib = internal(b);
            if (!ia || !ib || (Number(ia.disciples) || 0) <= 3 || (Number(ib.disciples) || 0) <= 3) continue;
            cands.push([a, b]);
        }
        if (!cands.length) return;
        for (var j = 0; j < cands.length; j++) {
            if (Math.random() >= 0.06) continue;
            musterWar(cands[j][0], cands[j][1]);
            break; // 一月江湖上只打得响一仗——再多就是乱世了（留给后面的剧本）
        }
    }
    // 战云：先集结（三五日），消息走街谈——赶得及的人，能亲眼看到这一仗
    function musterWar(a, b) {
        var day = absDay();
        var atk = Math.random() < 0.5 ? a : b;
        var def = atk === a ? b : a;
        var strike = day + 3 + Math.floor(Math.random() * 5);
        flags()['sect_world_war_pending'] = { atk: atk, def: def, day: day, strikeDay: strike, witnessed: false };
        street('走镖的带回消息：「' + atk + '」在山下点兵，火把连夜亮了三天——「' + def + '」的山门怕是要见血了。');
        chron(atk, '门下集结，兵发「' + def + '」山门——这一仗，是这些年的账要一起算了。');
        log('🌍 江湖风云：「' + atk + '」与「' + def + '」撕破脸了，兵已点到山下，约莫' + (strike - day) + '日内见分晓。（外交面板·江湖风云册里，可以赶去亲眼看这一仗）', 'warning');
    }
    function resolveAiWar(a, b, witnessed) {
        var atk = a;
        var def = b;
        var atkScore = powerScore(atk) + Math.random() * 40;
        var defScore = powerScore(def) + Math.random() * 40 + 10; // 守方有地利
        var win = atkScore > defScore;
        var winner = win ? atk : def;
        var loser = win ? def : atk;
        var c = pairCell(a, b);
        var iw = internal(winner), il = internal(loser);
        var loss = 60 + Math.floor(Math.random() * 60);
        var spoils = Math.round(loss * 0.6);
        var dead = 2 + Math.floor(Math.random() * 4);
        if (il) {
            il.resources = Math.max(0, (Number(il.resources) || 0) - loss);
            il.disciples = Math.max(1, (Number(il.disciples) || 0) - dead); // 灭门留给后头的剧本，这里只折人
        }
        if (iw) iw.resources = (Number(iw.resources) || 0) + spoils;
        warMod(winner, true);
        warMod(loser, false);
        var old = Number(c.relation) || 0;
        setRel(a, b, old - 10); // 打完仇更深
        c.conflicts = (Number(c.conflicts) || 0) + 1;
        c.lastEvent = absDay();
        // 立场跟着战事走（与玩家战争线同一口径）：兴兵攻山损名，守山长脸
        try {
            if (typeof W.sectAlignShift === 'function') {
                W.sectAlignShift(atk, -3, '攻山');
                W.sectAlignShift(def, 2, '守山');
            }
        } catch (eA) {}
        chron(winner, '兴兵踏破了「' + loser + '」的山门——战利装车运回，缴获灵石' + spoils + '。这一仗，江湖都记住了。');
        chron(loser, '山门被「' + winner + '」踏破：库房被搬走灵石' + loss + '，弟子死伤数名。此仇，编年记下了。');
        street('江湖大新闻：「' + winner + '」兴兵踏破了「' + loser + '」的山门！打了三日，' + loser + '的幡被撕下半截——库房被搬空了一角，死伤的弟子抬下山时，沿途的城镇都看见了。');
        // 战报三折（观战回放用）：按实力对比与立场写轻重
        var gap = powerScore(winner) - powerScore(loser);
        var report = [
            '开打那日天没亮，「' + atk + '」的人在山门外列成三排，为首长老只说了一句话：「把这些年的账，拿出来算。」「' + def + '」的山门大阵亮了一夜。',
            gap >= 60
                ? '打到午时，胜负已经分了——「' + winner + '」的人一路压着打，「' + loser + '」的山门被破开一角，弟子且战且退，旗都被扯下来半截。'
                : '从辰时杀到日落，两边来回拉了三回——山门前的石阶断了半截，血渗进石缝里。最后是天黑前那一波，「' + winner + '」的人抢上了山门楼。',
            '战后清点：「' + loser + '」库房被搬走灵石' + loss + '，弟子死伤' + dead + '名；「' + winner + '」缴获' + spoils + '，战损折了四成。两家的编年，都记下了这一天。'
        ];
        var ws = wars();
        ws.push({ day: absDay(), atk: atk, def: def, winner: winner, loser: loser, loss: loss, spoils: spoils, dead: dead, report: report });
        if (ws.length > 12) ws.splice(0, ws.length - 12);
        save();
        // 观战的人：亲眼看过，江湖上就有你的一席之地（名望/街谈/无主辎重）
        if (witnessed) {
            try { if (W.currentCharData) W.currentCharData.fame = Math.min(99999, (W.currentCharData.fame || 0) + 2); } catch (eF) {}
            street('茶棚里说那场山门大战，说得最细的是个亲眼看过的人——「我在对面山坡上站的，从头看到尾。」满棚的人都凑过去听。（那就是你：名望+2）');
            log('👁️ 你在对面山坡看完了这一仗：' + report[1] + '（名望+2——茶棚里的段子，从此有你一份）', 'success');
            if (Math.random() < 0.3) {
                var loot = 10 + Math.floor(Math.random() * 21);
                try {
                    if (W.XianXia && W.XianXia.DataManager && W.XianXia.DataManager.addSpiritStones) W.XianXia.DataManager.addSpiritStones(loot);
                    else if (W.inventory && W.inventory.currency) W.inventory.currency.spiritStones = (Number(W.inventory.currency.spiritStones) || 0) + loot;
                } catch (eL) {}
                log('🎒 散场时，山道边的乱石堆里滚着几件没人认领的辎重——仗打完，死人堆里的东西没主了。你捡了灵石' + loot + '。（来路：战损折掉的那四成里，散落在外的无主之物）', 'info');
            }
        }
    }
    // 观战：赶到山门外的对面山坡（耗半日脚程，战云落定前赶到才算数）
    W.doWatchWar = function () {
        var p = pending();
        if (!p) { if (typeof W.showMessage === 'function') W.showMessage('眼下山下没有点兵的。', 'info'); return false; }
        if (p.witnessed) { if (typeof W.showMessage === 'function') W.showMessage('你已经在对面山坡占了位置——等着开打就是。', 'info'); return false; }
        p.witnessed = true;
        try { if (typeof W.advanceTime === 'function') W.advanceTime(120); } catch (e) {}
        log('👁️ 你赶到「' + p.def + '」山门外的对面山坡——「' + p.atk + '」的营火就在山下，磨刀声顺着风飘上来。守山的弟子看见你，没拦：看热闹的人，两边都不杀。（耗半日脚程；开打那天，你会看到全程）', 'warning');
        return true;
    };
    // 战报回放（打完了的仗，风云册里翻）
    W.openWarReport = function (i) {
        var ws = wars();
        var w = ws[ws.length - 1 - i];
        if (!w || !w.report) { if (typeof W.showMessage === 'function') W.showMessage('这仗没留下战报。', 'info'); return; }
        var html = '<div class="text-left">';
        html += '<p class="text-xs text-gray-500 mb-2">第' + w.day + '日 · 「' + w.atk + '」兴兵攻「' + w.def + '」山门 · 胜者「' + w.winner + '」</p>';
        for (var k = 0; k < w.report.length; k++) {
            html += '<p class="text-sm text-gray-300 leading-relaxed mb-2">' + w.report[k] + '</p>';
        }
        html += '</div>';
        if (typeof W.showModal === 'function') W.showModal('🔥 战报 · ' + w.winner + '破' + w.loser, html);
    };

    // ============ 四 · 江湖风云册 ============
    W.openWorldDiplomacy = function () {
        var d = dip();
        if (!d) { if (typeof W.showMessage === 'function') W.showMessage('外交册未就绪。', 'warning'); return; }
        var mine = mySect();
        var sects = W.sectsData || {};
        var names = [];
        for (var s in sects) { if (s !== mine) names.push(s); }
        var rows = [];
        for (var i = 0; i < names.length; i++) {
            for (var j = i + 1; j < names.length; j++) {
                var rel = getRel(names[i], names[j]);
                if (rel == null) continue;
                rows.push({ a: names[i], b: names[j], rel: rel });
            }
        }
        rows.sort(function (x, y) { return x.rel - y.rel; });
        var foes = rows.filter(function (r) { return r.rel <= -50; }).slice(0, 6);
        var allies = rows.filter(function (r) { return r.rel >= 60; }).slice(-6).reverse();
        var html = '<div class="text-left">';
        html += '<p class="text-sm text-gray-300 leading-relaxed mb-2">🌍 江湖自己在走——各派之间的恩怨情仇、开战修好，都记在各自的编年里。这本风云册，是茶博士替你打听的。</p>';
        html += '<p class="text-xs font-bold text-red-300 mb-1">💀 死仇簿</p>';
        html += '<div class="bg-gray-900/60 rounded p-2 mb-2">' + (foes.length ? foes.map(function (r) {
            return '<p class="text-xs text-gray-400 py-0.5 border-b border-gray-700/40">' + r.a + ' ⚔️ ' + r.b + ' <span class="text-red-400">（' + r.rel + '）</span></p>';
        }).join('') : '<p class="text-xs text-gray-500">眼下没有不共戴天的——太平日子。</p>') + '</div>';
        html += '<p class="text-xs font-bold text-green-300 mb-1">🤝 结盟簿</p>';
        html += '<div class="bg-gray-900/60 rounded p-2 mb-2">' + (allies.length ? allies.map(function (r) {
            return '<p class="text-xs text-gray-400 py-0.5 border-b border-gray-700/40">' + r.a + ' 🤝 ' + r.b + ' <span class="text-green-400">（+' + r.rel + '）</span></p>';
        }).join('') : '<p class="text-xs text-gray-500">换过盟书的两家——眼下还没有。</p>') + '</div>';
        var p = pending();
        if (p) {
            // 第二十波：被围的若是自家盟家——掌门可提兵下山相援（真仗，sect-war 出兵入口）
            var rescueBtn = '';
            try {
                var hn = (W.PSectWorld && typeof W.PSectWorld.homeName === 'function') ? W.PSectWorld.homeName() : null;
                if (hn && typeof W.PSectWorld.alliesOf === 'function' && W.PSectWorld.alliesOf(hn).indexOf(p.def) >= 0) {
                    rescueBtn = '<button onclick="window.doAllyRescue()" class="mt-1 w-full bg-red-800 hover:bg-red-700 text-xs px-3 py-2 rounded">⚔️ 出兵相援「' + p.def + '」——真仗：击退围军、战云散，盟好如金石</button>';
                }
            } catch (eR) {}
            html += '<p class="text-xs font-bold text-orange-300 mb-1">⚔️ 山下点兵（战云）</p>';
            html += '<div class="bg-gray-900/60 rounded p-2 mb-2 text-xs text-gray-300">「' + p.atk + '」的兵已点到「' + p.def + '」山下，约莫 <b class="text-orange-300">' + Math.max(0, p.strikeDay - absDay()) + '</b> 日内开打。'
                + (p.witnessed ? '<span class="text-green-300">你已在对面山坡占了位置——开打那天自会看到全程。</span>'
                    : '<button onclick="window.doWatchWar()" class="mt-1 w-full bg-orange-800 hover:bg-orange-700 text-xs px-3 py-2 rounded">👁️ 赶去观战——耗半日脚程，亲眼看这一仗（名望/段子/无主辎重，都是到场的人的）</button>')
                + rescueBtn
                + '</div>';
        }
        // 第二十七波 · 潮讯：盟家山门让兽潮围了——掌门可提兵相助（真仗入口在 sect-war）
        var tp = flags()['sect_world_tide_pending'];
        if (tp) {
            var tideBtn = '';
            try {
                var th = (W.PSectWorld && typeof W.PSectWorld.homeName === 'function') ? W.PSectWorld.homeName() : null;
                if (th && typeof W.doTideAllyRescue === 'function' && W.PSectWorld.alliesOf && W.PSectWorld.alliesOf(th).indexOf(tp.sect) >= 0) {
                    tideBtn = '<button onclick="window.doTideAllyRescue()" class="mt-1 w-full bg-amber-800 hover:bg-amber-700 text-xs px-3 py-2 rounded">🐾 提兵相助「' + tp.sect + '」——真仗：打退兽群、山门保住，盟好如金石</button>';
                } else {
                    tideBtn = '<p class="mt-1 text-[10px] text-gray-500">没换过盟书（或还没立宗）——提兵无名，只能在茶棚里听着。</p>';
                }
            } catch (eT) {}
            var tideWord = '兽潮';
            try { tideWord = (W.BeastTide && W.BeastTide.getActiveTide && W.BeastTide.getActiveTide().name) || '兽潮'; } catch (eN) {}
            html += '<p class="text-xs font-bold text-amber-300 mb-1">🐾 潮讯（围山的兽群）</p>';
            html += '<div class="bg-gray-900/60 rounded p-2 mb-2 text-xs text-gray-300">「' + tideWord + '」的兽群围了「' + tp.sect + '」的山门，墙头上的人在死守——<b class="text-amber-300">今日之内</b>可提兵相助，明日便自落定。'
                + tideBtn + '</div>';
        }
        var ws = wars().slice().reverse();
        html += '<p class="text-xs font-bold text-amber-200 mb-1">🔥 近来战事</p>';
        html += '<div class="bg-gray-900/60 rounded p-2 mb-2 max-h-36 overflow-y-auto">' + (ws.length ? ws.map(function (w, wi) {
            var head = w.rescue
                ? '「' + w.winner + '」出兵相援「' + w.rescue + '」·击退「' + w.loser + '」' + (w.winner === w.atk ? '' : '（援军失利，围未解）')
                : '「' + w.winner + '」踏破「' + w.loser + '」山门' + (w.winner === w.atk ? '' : '（守方反杀）');
            return '<p class="text-xs text-gray-400 py-0.5 border-b border-gray-700/40">第' + w.day + '日 · ' + head
                + (w.report ? ' <button onclick="window.openWarReport(' + wi + ')" class="text-[10px] bg-gray-700 hover:bg-gray-600 px-2 py-0.5 rounded">翻战报</button>' : '') + '</p>';
        }).join('') : '<p class="text-xs text-gray-500">近来江湖上没打得响的一仗。</p>') + '</div>';
        html += '<p class="text-[10px] text-gray-500">风云册只列江湖公开的事——你自家门派的恩怨，在宗门外交册里。</p>';
        html += '</div>';
        if (typeof W.showModal === 'function') W.showModal('🌍 江湖风云', html);
    };

    // ============ 五 · 月钩 ============
    function dayTick() {
        var day = absDay();
        if (!day) return;
        var p = pending();
        if (p && day >= p.strikeDay) {
            flags()['sect_world_war_pending'] = null;
            resolveAiWar(p.atk, p.def, !!p.witnessed);
        }
    }
    function monthTick() {
        var day = absDay();
        if (!day || day % 30 !== 0) return;
        if (!dip() || !W.sectsData) return;
        var pairs = aiPairs();
        regressionMonthly(pairs);
        eventMonthly(pairs);
        warMonthly(pairs);
    }
    try {
        var hook = function () { try { dayTick(); } catch (e) {} try { monthTick(); } catch (e2) {} };
        if (W.EventBus && W.EventBus.on) W.EventBus.on('newDay', hook);
        else if (W.timeSystem && typeof W.timeSystem.onNewDaySubscribe === 'function') W.timeSystem.onNewDaySubscribe(hook);
    } catch (e) {}

    W.sectWorldDiploProbe = function () {
        var d = dip() || {};
        var mine = mySect();
        var pairs = 0, missing = 0;
        var sects = W.sectsData || {};
        var names = [];
        for (var s in sects) { if (s !== mine) names.push(s); }
        for (var i = 0; i < names.length; i++) {
            for (var j = i + 1; j < names.length; j++) {
                pairs++;
                if (getRel(names[i], names[j]) == null) missing++;
            }
        }
        var p = pending();
        return { pairs: pairs, missing: missing, wars: wars().length, pending: p ? { atk: p.atk, def: p.def, strikeDay: p.strikeDay, witnessed: !!p.witnessed } : null, baseSample: names.length >= 2 ? baseRel(names[0], names[1]) : 0 };
    };
    console.log('[sect-diplomacy-world] 江湖风云已注册：AI门派档案是活的——底色随立场回归/月度恩怨事件/死仇后台真开战（战利品守恒+弟子死伤+战绩落座次）/风云册纵览（第二十波：盟家被围可出兵相援·近来战事认解围之战·第二十七波：盟家遭兽围挂潮讯、可提兵相助）');
})();
