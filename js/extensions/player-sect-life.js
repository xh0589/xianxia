// ==================== player-sect-life.js - 第二十一波 · 弟子是活人（秘艺/派遣/日常/治丧） ====================
// 掌门评了四句苦：自家门没有镇山秘艺、弟子派不动、门内没有日子、病殁连场葬礼都没有。四句都接住：
//   一 · 镇山秘艺：开山立门之后，掌门闭关创艺（宗库出碑刻抄经之资，一步两讫）——
//       艺成则传功进境更疾（每阶加一成）、战阵之上敌人未战先怯（每阶折敌战力三分，至多折到八五），
//       名头随年月传开（声望按月微涨）。一门一艺，立了就不能再立；艺可晋阶（至多三阶），晋阶真花钱。
//   二 · 派遣下山：弟子不是山门里的摆设——跑腿押送（雇主有名有姓，镖钱真入宗库、弟子抽一成入自己荷包，
//       也可能撞上劫道的）、下山历练（感悟大涨、可能真破关，也可能带伤、殁在路上——真收益真风险）、
//       采买药材（宗库六十灵石本钱，回程丹药两件兵器两件——真钱换真货）。人在山下：不占接活人手、传不了功。
//   三 · 门内日常：门里有两个以上的人，日子就自己会长——演武场较劲、藏经阁同读、伙房打翻粥、井台夜话、
//       檐下看雨、口角又和好。心境与感悟真动，偶尔传到街面上。随机按日定数（读档不跳票）。
//   四 · 病殁治丧：月册对出人没了（病殁任上），门中治丧——棺木抚恤灵石二十从宗库真出（一步两讫），
//       牌位入祖堂、门人同悲、街坊看在眼里；库里凑不出钱，薄棺葬后山，宗门史记愧。
//   五（第二十二波）· 同门交情：日常戏不再只动心境——较劲/同读/夜话真写进江湖关系图的真账
//       （npcRelationships，与主线 NPC 关系网同一份真源）：交情按点头→熟络→知己→莫逆长，处成莫逆上编年传街谈；
//       口角可能真结疙瘩（怨气压在寻衅线以下，是心结不是死仇，往后的好日子能磨平）；
//       新人进门即与全门结同门边；历练可赠护身符（宗库香火钱，死签减半）；客卿也能遣下山。
//   六（第二十八波）· 弟子结伴走：交情账往前推一步，变成人间烟火——
//       ①莫逆之交可请掌门主婚（宗库出酒帛之资，一步两讫）：结成道侣，宗谱并记、全门同庆；
//         道侣日常同修（感悟心境双涨）；一方身殁，另一方心境塌一角（丧偶之痛真记账）。
//       ②结伴下山：遣人办差可带一位熟络以上的同门作伴——两人照应，死签减半再减半、被劫被骗的骰都压低、
//         荷包对分、感悟分摊、回程交情更厚；道侣结伴，凶事再让三分。
//       ③交情册升级：道侣亮红灯、莫逆之交可当场主婚。
//   七（第三十三波）· 门里有传人：首座弟子是真差事——月结时人在山门压阵，门中声望暗涨、弟子心气自高；
//       人不在了（身殁/出师/离门），担子落地虚位待另择。镇山秘艺的碑名掌门可亲题（战阵传功编年都认新名）。
// 账目纪律：钱一律走 PSectWorld 的两讫真账（spendTreasury/gainTreasury），来路名目写清；
//   弟子荷包（_purse）是云游行商的真积蓄，按月寄回在 master-teach 结算。
// 零外文字母、零原生弹窗、缺表不炸、幂等。
(function () {
    'use strict';
    var W = window;
    if (typeof W === 'undefined') return;

    function P() { return W.PlayerSect; }
    function PW() { return W.PSectWorld || null; }
    function homeName() { try { return (PW() && PW().homeName) ? PW().homeName() : null; } catch (e) { return null; } }
    function mine() { var n = homeName(); return (n && PW() && PW().byName) ? PW().byName(n) : null; }
    function cd() { return W.currentCharData || null; }
    function flags() { return (W.eventFlags = W.eventFlags || {}); }
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
    function street(text) {
        try {
            var f = flags();
            if (!f['qi_street'] || !f['qi_street'].push) f['qi_street'] = [];
            f['qi_street'].push({ day: today(), text: String(text) });
            if (f['qi_street'].length > 60) f['qi_street'].splice(0, f['qi_street'].length - 60);
        } catch (e) {}
    }
    function chron(sectName, text) {
        try { if (W.SectGov && W.SectGov.chronicle) { W.SectGov.chronicle(sectName, text); return; } } catch (e) {}
        var it = (W.SECT_INTERNAL || {})[sectName];
        if (!it) return;
        if (!it.chronicle) it.chronicle = [];
        it.chronicle.push({ day: today(), text: String(text) });
    }
    function note(sectName, text) { try { if (PW() && PW().note) PW().note(sectName, text); } catch (e) {} }
    function getNPC(id) { try { return (W.npcManager && W.npcManager.getNPC) ? W.npcManager.getNPC(id) : null; } catch (e) { return null; } }
    function dName(d) { if (!d) return '弟子'; return d.name || ((getNPC(d.npcId) || {}).name) || '弟子'; }
    function seeded(day, salt) {
        var h = (Math.imul(day + 1, 2654435761) ^ Math.imul(salt + 7, 40503)) >>> 0;
        h = (Math.imul((h >>> 16) ^ h, 0x45d9f3b) >>> 0);
        return ((h >>> 16) % 10000) / 10000;
    }
    function saltOf(str) { var s = 0; str = String(str || ''); for (var i = 0; i < str.length; i++) s = (s * 31 + str.charCodeAt(i)) >>> 0; return s % 9973; }
    function realmTierOf(npc) {
        try { if (typeof W.getRealmTier === 'function') { var t = Number(W.getRealmTier((npc && npc.combat && npc.combat.realm) || '凡人')); if (isFinite(t)) return Math.max(0, t); } } catch (e) {}
        return 1;
    }
    function rootMulOf(npc) {
        try { if (W.NPCLife && typeof W.NPCLife.npcRootGrowthMul === 'function') { var m = Number(W.NPCLife.npcRootGrowthMul(npc)); if (isFinite(m) && m > 0) return m; } } catch (e) {}
        return 1;
    }
    function bump(d, n) { try { if (W.PSectVenture && typeof W.PSectVenture.bumpMood === 'function') { W.PSectVenture.bumpMood(d, n); return; } } catch (e) {} if (d) d.moodPts = Math.max(0, Math.min(100, (Number(d.moodPts) || 50) + n)); }
    function bumpAll(sect, n) { try { if (W.PSectVenture && W.PSectVenture.bumpMoodAll) W.PSectVenture.bumpMoodAll(sect, n); } catch (e) {} }
    function spendTreasury(name, amount, label) { try { if (PW() && PW().spendTreasury) return PW().spendTreasury(name, amount, label); } catch (e) {} return false; }
    function gainTreasury(name, amount, label) { try { if (PW() && PW().gainTreasury) return PW().gainTreasury(name, amount, label); } catch (e) {} return false; }
    function gainRep(name, n, why) { try { if (PW() && PW().gainRep) PW().gainRep(name, n, why); } catch (e) {} }

    // ============ 一 · 镇山秘艺（一门一艺，立了就是根本） ============
    var ART_KINDS = ['剑典', '掌法', '功诀', '身法', '指律', '枪经'];
    var ART_COST = 150;                 // 创艺：碑刻抄经之资（宗库出）
    var ART_UP_COST = [0, 100, 220];    // 晋阶花费（按当前阶索价）
    function artOf(name) {
        var ps = null;
        try { ps = name ? (PW() && PW().byName ? PW().byName(name) : null) : mine(); } catch (e) {}
        return (ps && ps.art) || null;
    }
    // master-teach 读这个口：有艺之门，传功进境每阶加一成
    W.psArtTeachMul = function () {
        var art = artOf(homeName());
        return art ? 1 + 0.1 * (Number(art.level) || 1) : 1;
    };
    function composeArt() {
        var name = homeName();
        if (!name) { msg('幡都倒了——秘艺随山门一起埋了，先重立山门。', 'warning'); return null; }
        var ps = PW().byName(name);
        if (ps.art) { msg('镇山秘艺「' + ps.art.name + '」早已立定——一门的根本功夫，一部就够。', 'info'); return ps.art; }
        var stage = 0;
        try { stage = (W.PSBoot && typeof W.PSBoot.stageOf === 'function') ? W.PSBoot.stageOf(ps) : (ps.stage != null ? ps.stage : 2); } catch (e) { stage = 2; }
        if (stage < 2) { msg('还没开山立门——赁来的院子里刻不了艺碑。先把山门修起来，再谈创艺。', 'warning'); return null; }
        if (!spendTreasury(name, ART_COST, '闭关创艺·碑刻抄经之资')) { msg('宗库凑不出' + ART_COST + '灵石——创艺要闭门参证，碑要刻、经要抄，都是钱。', 'warning'); return null; }
        var kind = ART_KINDS[Math.floor(Math.random() * ART_KINDS.length) % ART_KINDS.length];
        ps.art = { name: name + '·' + kind, level: 1, day: today() };
        gainRep(name, 2, '创镇山秘艺');
        try { if (cd()) cd().fame = Math.min(99999, (Number(cd().fame) || 0) + 5); } catch (e2) {}
        chron(name, '掌门闭关百日，参自身所学与门中弟子根性，创出镇山秘艺「' + ps.art.name + '」——碑立演武场，门人皆得传习。');
        street('「' + name + '」立了镇山秘艺「' + ps.art.name + '」——茶棚里有人比划那一招起手，有人说名头响亮，也有人说且看实战。');
        note(name, '创出镇山秘艺「' + ps.art.name + '」。（传功进境+10%；战阵之上，敌人未战先怯；名头随年月传开）');
        log('📜 碑立演武场——「' + ps.art.name + '」自此是你门的镇山功夫。（弟子传功进境更疾；打起仗来，对方未战先怯三分）', 'success');
        _close();
        try { if (W.openPlayerSectPanel) W.openPlayerSectPanel(); } catch (e3) {}
        return ps.art;
    }
    function upgradeArt() {
        var name = homeName();
        if (!name) { msg('幡都倒了。', 'warning'); return false; }
        var ps = PW().byName(name);
        var art = ps && ps.art;
        if (!art) { msg('还没创镇山秘艺——先创艺，再谈晋阶。', 'info'); return false; }
        if (art.level >= 3) { msg('「' + art.name + '」已臻大成——再往上，得看门下弟子的造化了。', 'info'); return false; }
        var cost = ART_UP_COST[art.level] || 100;
        if (!spendTreasury(name, cost, '秘艺晋阶·重刻碑文广抄经卷')) { msg('宗库凑不出' + cost + '灵石——晋阶要重刻碑文、广抄经卷。', 'warning'); return false; }
        art.level += 1;
        gainRep(name, 1, '秘艺晋阶');
        chron(name, '「' + art.name + '」补阙拾遗，晋至第' + art.level + '阶——碑文重刻，门人传习更勤。');
        note(name, '镇山秘艺「' + art.name + '」晋至第' + art.level + '阶。（传功进境+' + (art.level * 10) + '%；战阵折敌' + (art.level * 3) + '分）');
        log('📜 「' + art.name + '」晋至第' + art.level + '阶——碑文重刻，弟子们的招式又齐整了一层。（宗库支出灵石' + cost + '）', 'success');
        _close();
        try { if (W.openPlayerSectPanel) W.openPlayerSectPanel(); } catch (e2) {}
        return true;
    }
    // 战阵之利（sect-war 开战前调用）：自家秘艺在手，敌人未战先怯——每阶折敌战力三分
    function warEdge(name, enemy) {
        var art = artOf(name);
        if (!art || !enemy) return false;
        var mul = Math.max(0.85, 1 - 0.03 * (Number(art.level) || 1));
        enemy.attack = Math.max(1, Math.round((Number(enemy.attack) || 0) * mul));
        enemy.defense = Math.max(1, Math.round((Number(enemy.defense) || 0) * mul));
        enemy.maxDurability = Math.max(1, Math.round((Number(enemy.maxDurability) || 0) * mul));
        if (enemy.durabilities) { for (var k in enemy.durabilities) enemy.durabilities[k] = Math.max(1, Math.round((Number(enemy.durabilities[k]) || 0) * mul)); }
        log('📜 你门弟子使的是「' + art.name + '」的路数——招式齐整，进退有度，对方未战先怯了三分。', 'success');
        return true;
    }

    // ============ 二 · 派遣下山（真收益，真风险） ============
    var MISSIONS = {
        errand: { name: '跑腿押送', days: 7, desc: '受雇押一趟短镖——镖钱真入宗库，弟子抽一成入自己荷包；也可能撞上劫道的' },
        train: { name: '下山历练', days: 14, desc: '让他自己去江湖上走一遭——感悟大涨、可能真破关；也可能带伤，甚至回不来' },
        buy: { name: '采买药材', days: 5, cost: 60, desc: '宗库出六十灵石本钱，回程车上是丹药两件、兵器两件——真钱换真货' }
    };
    var ESCORT_HOUSES = ['震威镖局', '赵记车马行', '黑水商队'];
    var CHARM_COST = 10; // 护身符：宗库请符的香火钱（只随历练走，死签减半）
    function roster(sect) { return (sect.disciples || []).concat(sect.guests || []); }
    function homeMembers(sect) { return roster(sect).filter(function (d) { return d && !d.away; }).length; }
    function findMember(sect, npcId) {
        var all = roster(sect);
        for (var i = 0; i < all.length; i++) { if (all[i] && all[i].npcId === npcId) return all[i]; }
        return null;
    }
    function openDispatch(npcId, mateId) {
        var sect = mine();
        if (!sect) { msg('还没立宗——遣谁下山？', 'warning'); return; }
        var d = findMember(sect, npcId);
        if (!d) { msg('此人不在你门中。', 'info'); return; }
        var nm = dName(d);
        if (d.away) {
            msg('「' + nm + '」下山' + (d.away.name || '办事') + '去了——还有' + Math.max(1, (Number(d.away.back) || 0) - today()) + '日回山。一回只办一件事。', 'info');
            return;
        }
        var npc = getNPC(npcId);
        // 第二十八波：结伴下山——门里有处得来的，路上就有个照应
        if (mateId) {
            var md = findMember(sect, mateId);
            var mn = md ? getNPC(mateId) : null;
            var mEdge = (npc && mn) ? edgeOf(npc, mn) : null;
            var mClose = (npc && mn && npc.daoMate === mn.id) || (mEdge && mEdge.relation !== 'enemy' && (Number(mEdge.strength) || 0) >= 20);
            if (!md || !mn || mn.isDead || md.away || !mClose) { mateId = null; msg('作伴的人选不得——要在山、要处得熟（熟络以上或道侣）。', 'info'); }
        }
        var html = '<div class="text-left">' + para('🚶 遣「' + nm + '」下山——弟子不是山门里的摆设，江湖是磨人的石头。三件差事，各有天数、各有凶吉：');
        var cands = [];
        roster(sect).forEach(function (x) {
            if (!x || x.npcId === npcId || x.away) return;
            var xn = getNPC(x.npcId);
            if (!xn || xn.isDead || !npc) return;
            if (npc.daoMate === xn.id) { cands.push({ id: xn.id, name: xn.name, mate: true }); return; }
            var xe = edgeOf(npc, xn);
            if (xe && xe.relation !== 'enemy' && (Number(xe.strength) || 0) >= 20) cands.push({ id: xn.id, name: xn.name, mate: false });
        });
        if (cands.length) {
            html += '<p class="text-xs text-gray-400 mb-1">🧳 结伴（熟络以上或道侣）：两人照应——凶险的骰都压低、荷包对分、回程交情更厚。'
                + (mateId ? '<b class="text-pink-300">与「' + (findMember(sect, mateId) ? dName(findMember(sect, mateId)) : '') + '」结伴。</b>' : '不带伴也行，各走各的江湖。') + '</p><div class="mb-2">';
            cands.forEach(function (o) {
                var on = mateId === o.id;
                html += '<span class="inline-block mr-1 mb-1">' + btn((on ? '✅ ' : '') + o.name + (o.mate ? '·道侣' : '') + (on ? '（不带了）' : '（带上）'),
                    'window.PSectLife.openDispatch(\'' + npcId + '\'' + (on ? '' : ',\'' + o.id + '\'') + ')',
                    on ? 'bg-pink-800 hover:bg-pink-700' : 'bg-gray-700 hover:bg-gray-600') + '</span>';
            });
            html += '</div>';
        }
        var mateArg = mateId ? ',\'' + mateId + '\'' : '';
        for (var k in MISSIONS) {
            var m = MISSIONS[k];
            html += '<div class="bg-gray-900/60 rounded p-2 mb-2"><p class="text-sm text-amber-200">' + m.name + '（' + m.days + '日' + (m.cost ? '·本钱' + m.cost + '石' : '') + '）</p>'
                + '<p class="text-xs text-gray-400 mb-1">' + m.desc + '</p>'
                + btn('遣' + (mateId ? '两人' : '他') + '下山', 'window.PSectLife.sendAway(\'' + npcId + '\',\'' + k + '\',false' + mateArg + ')', k === 'train' ? 'bg-red-900 hover:bg-red-800' : 'bg-emerald-800 hover:bg-emerald-700')
                + (k === 'train' ? '<div class="mt-1">' + btn('🧿 赠一枚护身符再遣（宗库' + CHARM_COST + '石）——带着符的人，路上凶险减半；不带符出门，才是真赌命', 'window.PSectLife.sendAway(\'' + npcId + '\',\'train\',true' + mateArg + ')', 'bg-amber-800 hover:bg-amber-700') + '</div>' : '')
                + '</div>';
        }
        html += '</div>';
        modal('🚶 派遣 · ' + nm, html);
    }
    function sendAway(npcId, kind, charm, mateId) {
        var sect = mine();
        if (!sect) { msg('还没立宗。', 'warning'); return false; }
        var m = MISSIONS[kind];
        if (!m) return false;
        var d = findMember(sect, npcId);
        if (!d) { msg('此人不在你门中。', 'info'); return false; }
        if (d.away) { msg('人已经下山了——一回只办一件事。', 'info'); return false; }
        var npc = getNPC(d.npcId);
        if (!npc || npc.isDead) { msg('人都不在了。', 'warning'); return false; }
        var nm = dName(d);
        // 第二十八波：结伴下山——作伴的要在山、要处得熟（熟络以上或道侣）
        var mateD = null, mateN = null;
        if (mateId && mateId !== npcId) {
            mateD = findMember(sect, mateId);
            mateN = mateD ? getNPC(mateId) : null;
            var mEdge = (npc && mateN) ? edgeOf(npc, mateN) : null;
            var mClose = (npc && mateN && npc.daoMate === mateN.id) || (mEdge && mEdge.relation !== 'enemy' && (Number(mEdge.strength) || 0) >= 20);
            if (!mateD || !mateN || mateN.isDead || mateD.away || !mClose) {
                msg('作伴的人选不得——要在山、要处得熟（熟络以上或道侣）。', 'info');
                return false;
            }
        } else { mateD = null; }
        if (m.cost && !spendTreasury(sect.name, m.cost, '遣「' + nm + '」下山采买·本钱')) {
            msg('宗库凑不出' + m.cost + '灵石的本钱——采买是拿钱换货，空手去不了。', 'warning');
            return false;
        }
        // 第二十二波：护身符只随历练走（死签减半）——符是宗库真金白银请回来的
        var charmed = false;
        if (charm && kind === 'train') {
            if (!spendTreasury(sect.name, CHARM_COST, '为「' + nm + '」请护身符·开光香火')) {
                msg('宗库凑不出' + CHARM_COST + '灵石的香火钱——符请不来，人可以先走，也可以再等等。', 'warning');
                return false;
            }
            charmed = true;
        }
        d.away = { kind: kind, name: m.name, start: today(), back: today() + m.days, charm: charmed || undefined, mate: mateD ? mateD.npcId : undefined };
        if (mateD) mateD.away = { kind: kind, name: m.name + '·作伴', start: today(), back: today() + m.days, follow: npcId };
        var mateWord = mateD ? '（与「' + dName(mateD) + '」结伴，两人照应）' : '';
        note(sect.name, '遣「' + nm + '」下山' + m.name + (charmed ? '（赠了护身符）' : '') + mateWord + '——' + m.days + '日后回山。');
        log('🚶 「' + nm + '」背起行囊下山去了（' + m.name + '，' + m.days + '日后回' + (charmed ? '；怀里揣着你请的护身符' : '') + '）' + (mateD ? '，「' + dName(mateD) + '」同行作伴——两个人走江湖，凶事让三分' : '。山门里少一个人，江湖上多一双眼睛') + '。', 'info');
        _close();
        try { if (W.openPlayerSectPanel) W.openPlayerSectPanel(); } catch (e) {}
        return true;
    }
    // 归来结算（日结钩子里跑）
    function settleReturns(sect) {
        var all = roster(sect);
        for (var i = 0; i < all.length; i++) {
            var d = all[i];
            if (!d || !d.away) continue;
            if (today() < (Number(d.away.back) || 0)) continue;
            settleOne(sect, d);
        }
    }
    function settleOne(sect, d) {
        var a = d.away;
        d.away = null;
        var nm = dName(d);
        var npc = getNPC(d.npcId);
        // 第二十八波：作伴的不单独结账——钱货是一趟差事的进出，主家回山时一并两讫
        if (a.follow) {
            bump(d, 2);
            var leaderN = getNPC(a.follow);
            if (npc && leaderN && !leaderN.isDead) {
                bondUp(npc, leaderN, 8, sect.name);
                log('🚶 「' + nm + '」跟着「' + leaderN.name + '」一道回山——路上有个照应。（心境上涨，两人交情更厚）', 'success');
                note(sect.name, '「' + nm + '」随伴回山。');
            } else {
                bump(d, -5);
                log('🕯️ 「' + nm + '」一个人回了山——同去的人，没能一起回来。（心境大跌）', 'warning');
                note(sect.name, '「' + nm + '」独自回山。');
            }
            return;
        }
        var mateN = a.mate ? getNPC(a.mate) : null;
        var paired = !!(a.mate && mateN && !mateN.isDead);
        var isDaoPair = !!(paired && npc && npc.daoMate === a.mate);
        if (a.kind === 'errand') {
            var house = ESCORT_HOUSES[Math.floor(seeded(today(), saltOf(d.npcId || nm) + 21) * ESCORT_HOUSES.length) % ESCORT_HOUSES.length];
            var robbed = Math.random() < (paired ? (isDaoPair ? 0.05 : 0.08) : 0.15); // 结伴被劫的骰压低——两个人，四只眼
            var tier = Math.max(1, realmTierOf(npc));
            var earn = 40 + tier * 15 + Math.floor(Math.random() * 20);
            if (robbed) earn = Math.max(8, Math.round(earn * 0.4)); // 撞上劫道的：镖保住了半程，钱只有一半
            var sectShare = Math.round(earn * 0.9);
            var purseShare = earn - sectShare;
            if (sectShare > 0) gainTreasury(sect.name, sectShare, '「' + nm + '」押镖归来·' + house + '付的镖钱');
            if (paired) { // 荷包对分——一趟镖钱，两个人分体己
                var half = Math.floor(purseShare / 2);
                if (npc) npc._purse = (Number(npc._purse) || 0) + half;
                mateN._purse = (Number(mateN._purse) || 0) + (purseShare - half);
            } else if (npc) npc._purse = (Number(npc._purse) || 0) + purseShare;
            bump(d, robbed ? -5 : 3);
            try { if (npc && !npc._graduated && typeof W.discipleAddInsight === 'function') W.discipleAddInsight(npc, 3); } catch (e) {} // 江湖见识也是感悟
            chron(sect.name, '「' + nm + '」押镖归来——' + house + '的镖钱入了库' + (robbed ? '，半路撞上劫道的，镖折了些色利' : '，一路平顺') + (paired ? '（与「' + (mateN.name || '同门') + '」结伴同行）' : '') + '。');
            log(robbed
                ? '🩹 「' + nm + '」回来了，袖口带着血渍——半路撞上劫道的，镖保住半程：' + house + '只肯付' + sectShare + '灵石。人没事就是万幸。（心境受挫）'
                : '🚶 「' + nm + '」风尘仆仆回山——' + house + '的镖钱灵石' + sectShare + '入了宗库' + (paired ? '，体己钱两人对分' : '，他自己揣回' + purseShare + '枚体己') + '。（见过世面，心境上涨）', robbed ? 'warning' : 'success');
        } else if (a.kind === 'buy') {
            var cheated = Math.random() < (paired ? (isDaoPair ? 0.03 : 0.05) : 0.10); // 结伴不容易被牙人蒙——两个人对价
            try {
                P().addResource(sect.id, 'elixir', cheated ? 1 : 2);
                P().addResource(sect.id, 'weapon', cheated ? 1 : 2);
            } catch (e2) {}
            bump(d, cheated ? -3 : 1);
            note(sect.name, '「' + nm + '」采买回山：丹药' + (cheated ? '一件' : '两件') + '、兵器' + (cheated ? '一件' : '两件') + '入库' + (cheated ? '（路上被牙人赚了一道）' : '') + '。');
            log(cheated
                ? '🧺 「' + nm + '」回来了，车上只有一半货——被坊市的牙人赚了一道：丹药+1、兵器+1。（六十石的本钱，学费交了一截）'
                : '🧺 「' + nm + '」押着车回山——丹药+2、兵器+2，都入了库。六十灵石的本钱花得值不值，库里说话。', cheated ? 'warning' : 'success');
        } else { // train · 下山历练
            var r = Math.random();
            var deathLine = a.charm ? 0.01 : 0.02; // 第二十二波：带着护身符的人，死签减半
            if (paired) deathLine = isDaoPair ? deathLine * 0.25 : deathLine * 0.5; // 第二十八波：结伴有人照应，死签再减半；道侣结伴再让一半
            if (r < deathLine && npc) {
                // 殁在路上——真风险不是吓唬人的话
                npc.isDead = true;
                try {
                    var arr = sect.disciples.indexOf(d) >= 0 ? sect.disciples : sect.guests;
                    var ix = arr.indexOf(d);
                    if (ix >= 0) arr.splice(ix, 1);
                    sect.resources.disciples = (sect.disciples || []).length;
                } catch (e3) {}
                try { if (PW() && PW().markFate) PW().markFate(sect, d.npcId, '殁于任'); } catch (e4) {}
                bumpAll(sect, -5);
                street('「' + sect.name + '」一个下山历练的弟子没能回来——「' + nm + '」的名字，茶棚里有人念叨了好几天。');
                funeral(sect, nm, a.charm ? '殁在了下山历练的路上——那枚护身符碎了，也没能拦住这一劫' : '殁在了下山历练的路上');
                return;
            }
            var hurt = r < (paired ? 0.10 : 0.14); // 结伴遇凶兽有人搭手——带伤的骰也压低
            var luck = !hurt && r > 0.90;
            var insight = Math.round((hurt ? 3 : 8 + Math.floor(Math.random() * 8)) * rootMulOf(npc) * 10) / 10;
            var br = null;
            try { if (npc && !npc._graduated && typeof W.discipleAddInsight === 'function') br = W.discipleAddInsight(npc, insight); } catch (e5) {}
            // 第二十八波：结伴历练，感悟分摊——同行的人也跟着长见识（六成）
            if (paired) {
                try { if (!mateN._graduated && typeof W.discipleAddInsight === 'function') W.discipleAddInsight(mateN, Math.max(1, Math.round(insight * 0.6))); } catch (eShare) {}
            }
            if (luck) {
                var windfall = 30 + Math.floor(Math.random() * 31);
                gainTreasury(sect.name, windfall, '「' + nm + '」历练途中采得山珍药材·换了钱捎回');
                log('🌄 「' + nm + '」历练回山——黑了，瘦了，眼神亮了。行囊里还裹着山里采的药材，换了灵石' + windfall + '入库。（感悟+' + insight + (br ? '，途中破关：' + br.text : '') + '，心境大涨）', 'success');
            } else if (hurt) {
                bump(d, -8);
                log('🩹 「' + nm + '」是被抬回来的——历练路上遇了凶兽，伤在肋下，养了一个月才敢进门。（感悟+' + insight + '，心境大跌——江湖给他上的第一课）', 'warning');
            } else {
                bump(d, 4);
                log('🌄 「' + nm + '」历练回山——黑了，瘦了，眼神亮了。江湖这一遭，胜过山里十年。（感悟+' + insight + (br ? '，途中破关：' + br.text : '') + '，心境大涨）', 'success');
            }
            if (br && br.big) {
                chron(sect.name, '「' + nm + '」下山历练归来，途中破境——江湖是磨人的石头，磨出来的刀最快。');
                street('「' + sect.name + '」的「' + nm + '」下山走了一遭，回来时破境了——茶棚里都说：这家门肯放人出去见世面。');
            }
            note(sect.name, '「' + nm + '」历练回山' + (hurt ? '，带了一身伤' : '') + '。');
        }
    }

    // ============ 三 · 门内日常（日子自己会长） ============
    function insightOf(d, n) {
        var npc = getNPC(d.npcId);
        if (!npc || npc._graduated) return;
        try { if (typeof W.discipleAddInsight === 'function') W.discipleAddInsight(npc, n); } catch (e) {}
    }
    // ---- 第二十二波 · 同门交情：日常戏写进江湖关系图的真账（与主线 NPC 关系网同一份真源） ----
    function edgeOf(a, b) {
        if (!a || !b || !a.npcRelationships) return null;
        return a.npcRelationships[b.id] || null;
    }
    var BOND_LADDER = ['点头之交', '熟络', '知己', '莫逆之交'];
    function bondWord(a, b) {
        if (!a || !b) return null;
        if (a.daoMate === b.id || b.daoMate === a.id) return '道侣'; // 第二十八波：婚书在册，交情的话不用再论
        var e = edgeOf(a, b);
        if (!e) return null;
        if ((e.relation || 'neutral') === 'enemy') return '嫌隙';
        var s = Number(e.strength) || 0;
        return s >= 70 ? '莫逆之交' : s >= 40 ? '知己' : s >= 20 ? '熟络' : s >= 1 ? '点头之交' : null;
    }
    function writeEdgeBoth(a, b, rel, s) {
        if (!a.npcRelationships) a.npcRelationships = {};
        if (!b.npcRelationships) b.npcRelationships = {};
        a.npcRelationships[b.id] = { relation: rel, strength: s };
        b.npcRelationships[a.id] = { relation: rel, strength: s };
    }
    // 交情进账：有主线接口走主线（同一把尺），缺表就按同款语义直写关系图真源——两本账不留缝
    function bondUp(a, b, delta, sectName) {
        if (!a || !b || a === b || a.isDead || b.isDead || !delta) return null;
        var before = bondWord(a, b);
        if (typeof W.adjustNPCRelationshipPair === 'function') {
            try { W.adjustNPCRelationshipPair(a, b, delta, { defaultRelation: 'sect_mate' }); } catch (e) { return null; }
        } else {
            var cur = edgeOf(a, b) || { relation: 'sect_mate', strength: 0 };
            var rel = cur.relation || 'sect_mate';
            var s = Number(cur.strength) || 0;
            if (rel === 'enemy') {
                s = Math.max(0, s - delta); // 对嫌隙边，好话是消怨——怨气降下来就翻篇
                if (s <= 20) { rel = 'neutral'; s = Math.max(0, 20 - s); }
            } else {
                s = Math.max(0, Math.min(100, s + delta));
                if (rel === 'neutral' && s >= 40) rel = 'friend';
            }
            writeEdgeBoth(a, b, rel, s);
        }
        var after = bondWord(a, b);
        if (after && after !== before && BOND_LADDER.indexOf(after) > BOND_LADDER.indexOf(before == null ? '' : before)) {
            log('🤝 「' + a.name + '」与「' + b.name + '」的日子处厚了——如今是' + after + '。', 'success');
            if (after === '莫逆之交') {
                if (sectName) chron(sectName, '「' + a.name + '」与「' + b.name + '」结成了莫逆之交——一个门里处出这样的交情，是掌门的福气。');
                street('「' + (sectName || '有家门') + '」的两个弟子处成了莫逆之交——茶棚里说，患难见真情，这交情是日子里磨出来的。');
            }
            return after;
        }
        return null;
    }
    // 结疙瘩：口角记了仇——怨气边压在寻衅线以下（是心结，不是死仇；往后的好日子能磨平）
    function bondGrudge(a, b, s) {
        if (!a || !b || a === b) return false;
        if (typeof W.setNPCRelationshipPair === 'function') {
            try { W.setNPCRelationshipPair(a, b, 'enemy', s || 12); return true; } catch (e) {}
        }
        writeEdgeBoth(a, b, 'enemy', s || 12);
        return true;
    }
    // 入门同日即同门：新人进门，与门里每个人结一条同门边（已有边不动——旧交情不抹）
    function bondSeed(sect, npcId) {
        var fresh = getNPC(npcId);
        if (!fresh) return;
        roster(sect).forEach(function (d) {
            if (!d || d.npcId === npcId) return;
            var other = getNPC(d.npcId);
            if (!other || other.isDead || edgeOf(fresh, other)) return;
            if (typeof W.setNPCRelationshipPair === 'function') {
                try { W.setNPCRelationshipPair(fresh, other, 'sect_mate', 3); return; } catch (e) {}
            }
            writeEdgeBoth(fresh, other, 'sect_mate', 3);
        });
    }
    // ---- 第二十八波 · 道侣：莫逆之交可请掌门主婚（婚仪之资真出库，人情账变成人间烟火） ----
    var WEDDING_COST = 80;
    function marryPair(idA, idB) {
        var sect = mine();
        if (!sect) { msg('还没立宗——给谁主婚。', 'warning'); return false; }
        var dA = findMember(sect, idA), dB = findMember(sect, idB);
        if (!dA || !dB) { msg('得是门里的两个人，这事才谈得上。', 'info'); return false; }
        if (dA.away || dB.away) { msg('人还在山下没回来——婚期得等人齐了再定。', 'info'); return false; }
        var nA = getNPC(idA), nB = getNPC(idB);
        if (!nA || !nB || nA.isDead || nB.isDead) { msg('人已不在了。', 'warning'); return false; }
        if (nA.daoMate || nB.daoMate) { msg('其中一位已有道侣——道侣不二心。', 'warning'); return false; }
        var e = edgeOf(nA, nB);
        if (!e || e.relation === 'enemy' || (Number(e.strength) || 0) < 70) {
            msg('两人的情分还没到（处成莫逆之交再说）——婚不可强主。', 'info'); return false;
        }
        if (!spendTreasury(sect.name, WEDDING_COST, '为「' + nA.name + '」与「' + nB.name + '」主婚·酒帛仪程之资')) {
            msg('宗库凑不出' + WEDDING_COST + '灵石——喜酒帛礼仪程都要钱，等等再办。', 'warning'); return false;
        }
        nA.daoMate = nB.id; nB.daoMate = nA.id;
        writeEdgeBoth(nA, nB, e.relation || 'friend', 100);
        bump(dA, 10); bump(dB, 10); bumpAll(sect, 4);
        chron(sect.name, '「' + nA.name + '」与「' + nB.name + '」在山门办了婚事——掌门主婚，全门饮酒。自今日始，两人互为道侣，宗谱并记。');
        street('「' + sect.name + '」办了一场道家喜事——「' + nA.name + '」与「' + nB.name + '」结为道侣。茶棚里说了三天：同门修成道侣，这是缘分。');
        note(sect.name, '「' + nA.name + '」与「' + nB.name + '」成婚，结为道侣——仪程之资' + WEDDING_COST + '石出库。');
        log('🏮 你为「' + nA.name + '」与「' + nB.name + '」主了婚——山门挂红，全门饮酒（仪程之资' + WEDDING_COST + '灵石出库）。自此两人互为道侣：修行同进、下山结伴、生死同记。（两人心境大涨，全门同喜）', 'success');
        _close();
        try { if (W.openPlayerSectPanel) W.openPlayerSectPanel(); } catch (e2) {}
        return true;
    }
    // 同门交情册（宗谱同列——谁和谁熟、谁和谁有疙瘩、谁和谁是一家，一目了然）
    function openBondBoard() {
        var sect = mine();
        if (!sect) { msg('还没立宗——哪有同门。', 'warning'); return; }
        var all = roster(sect);
        var rows = [];
        for (var i = 0; i < all.length; i++) {
            for (var j = i + 1; j < all.length; j++) {
                var a = getNPC(all[i].npcId), b = getNPC(all[j].npcId);
                if (!a || !b) continue;
                var w = bondWord(a, b);
                var e = edgeOf(a, b);
                if (!w) continue;
                var canWed = (w === '莫逆之交' && e && e.relation !== 'enemy'
                    && !a.daoMate && !b.daoMate && !a.isDead && !b.isDead
                    && !all[i].away && !all[j].away);
                rows.push({ a: a.name, b: b.name, idA: a.id, idB: b.id, word: w, s: Number((e || {}).strength) || 0, canWed: canWed });
            }
        }
        rows.sort(function (x, y) { return ((y.canWed ? 1000 : 0) + y.s) - ((x.canWed ? 1000 : 0) + x.s); });
        var html = '<div class="text-left">' + para('🤝 <b class="text-amber-200">「' + sect.name + '」同门交情册</b>——日子处出来的交情，都在江湖关系图的真账上。莫逆之交可请掌门主婚（宗库' + WEDDING_COST + '石仪程之资），结成道侣。');
        if (!rows.length) html += '<p class="text-xs text-gray-500">门里的人还都是生面孔——日子久了，戏就有了。</p>';
        rows.forEach(function (r) {
            var cls = r.word === '嫌隙' ? 'text-red-300' : r.word === '道侣' ? 'text-pink-300' : r.word === '莫逆之交' ? 'text-amber-300' : 'text-green-300';
            html += '<div class="flex justify-between items-center py-1 border-b border-gray-700/40">'
                + '<span class="text-xs text-gray-300">「' + r.a + '」 与 「' + r.b + '」</span>'
                + '<span class="text-xs ' + cls + '">' + (r.word === '道侣' ? '🏮 道侣' : r.word) + (r.word === '嫌隙' || r.word === '道侣' ? '' : ' · ' + r.s + '/100') + '</span>'
                + (r.canWed ? '<span class="ml-2">' + btn('主婚', 'window.PSectLife.marryPair(\'' + r.idA + '\',\'' + r.idB + '\')', 'bg-pink-800 hover:bg-pink-700') + '</span>' : '')
                + '</div>';
        });
        html += '</div>';
        modal('🤝 同门交情册', html);
    }
    // ---- 第三十二波 · 道侣上墙头：守山的仗，家里的对子在墙头并肩，敌人的锐气再折 ----
    // 数一数门里（在山、没下山的）有几对道侣——给 sect-war 的战前折敌管线读
    function daoPairsAtHome(sectName) {
        try {
            var ps = (PW() && PW().byName) ? PW().byName(sectName || homeName()) : null;
            if (!ps) return 0;
            var home = roster(ps).filter(function (d) { return d && !d.away; });
            var seen = {}, n = 0;
            home.forEach(function (d) {
                var npc = getNPC(d.npcId);
                if (!npc || !npc.daoMate || seen[npc.id]) return;
                var mate = getNPC(npc.daoMate);
                if (!mate || mate.isDead) return;
                var mateHome = false;
                for (var i = 0; i < home.length; i++) { if (home[i].npcId === mate.id) { mateHome = true; break; } }
                if (!mateHome) return;
                seen[npc.id] = 1; seen[mate.id] = 1;
                n++;
            });
            return n;
        } catch (e) { return 0; }
    }
    // ---- 第三十三波 · 门里有传人：首座弟子压阵，秘艺可亲题碑名 ----
    // 首座不是虚衔：月结时人在山门，门中声望暗涨、弟子心里有底；人不在了（身殁/出师/辞别），虚位待另择。
    function appointHeir(npcId) {
        var sect = mine();
        if (!sect) { msg('还没立宗——立谁做首座。', 'warning'); return false; }
        var d = findMember(sect, npcId);
        if (!d) { msg('此人不在你门中。', 'info'); return false; }
        if (d.graduated) { msg('已出师的人在云游——首座得是在山门里压得住阵的人。', 'info'); return false; }
        if (d.away) { msg('人在山下办差——等他回山再委这副担子。', 'info'); return false; }
        var npc = getNPC(npcId);
        if (!npc || npc.isDead) { msg('人已不在了。', 'warning'); return false; }
        if (sect._heir === npcId) { msg('「' + dName(d) + '」已经是首座了。', 'info'); return true; }
        var oldName = null;
        if (sect._heir) { try { oldName = (getNPC(sect._heir) || {}).name || null; } catch (e0) {} }
        sect._heir = npcId;
        bump(d, 8);
        chron(sect.name, '掌门立「' + dName(d) + '」为首座弟子' + (oldName ? '（「' + oldName + '」卸了这副担子）' : '') + '——门里有传人，弟子们心里有了底。');
        note(sect.name, '立「' + dName(d) + '」为首座弟子。');
        log('🎖 你立「' + dName(d) + '」为首座弟子——往后月结时 Ta 在山门压阵，门中声望暗涨、弟子心气自高。（人在山下或不在门中，这副担子就空着）', 'success');
        _close();
        try { if (W.openPlayerSectPanel) W.openPlayerSectPanel(); } catch (e1) {}
        return true;
    }
    // 首座月结（日结钩子里跑，月尽之日）：人在山门才压得住阵
    function heirMonthly(sect) {
        if (!sect || !sect._heir) return;
        var d = findMember(sect, sect._heir);
        if (!d) {
            sect._heir = null;
            chron(sect.name, '首座弟子已不在门中——虚位待另择，门里空落了一阵。');
            return;
        }
        if (d.away || d.graduated) return; // 人在山下，担子空着——不赏也不罚
        var hn = getNPC(d.npcId);
        if (!hn || hn.isDead) { sect._heir = null; return; }
        gainRep(sect.name, 0.5, '门中有传人·首座压阵');
        bumpAll(sect, 2);
        note(sect.name, '月结：首座「' + dName(d) + '」压着阵脚——门中声望暗涨，弟子们心气高。');
    }
    // 秘艺亲题碑名（镇山秘艺的名字掌门说了算——碑是新刻的，名是亲题的）
    function renameArt(newName) {
        var sect = mine();
        if (!sect) { msg('还没立宗。', 'warning'); return false; }
        if (!sect.art) { msg('还没有镇山秘艺——碑都没立，题什么名。', 'info'); return false; }
        var s = String(newName == null ? '' : newName).replace(/[<>"'&\\]/g, '').slice(0, 12);
        if (!s) { msg('碑名不能是空的——两个字也行，总得有个名。', 'info'); return false; }
        var old = sect.art.name;
        if (old === s) { msg('碑上刻的就是这个名。', 'info'); return false; }
        sect.art.name = s;
        chron(sect.name, '掌门亲题镇山秘艺碑名：「' + s + '」（旧名「' + old + '」）——碑重描了金，弟子们传诵新名。');
        note(sect.name, '镇山秘艺改题碑名「' + s + '」。');
        log('📜 镇山秘艺自此唤作「' + s + '」——战阵之上、传功之时、编年之中，都认这个名。（碑名亲题，门风的脸上有光）', 'success');
        _close();
        try { if (W.openPlayerSectPanel) W.openPlayerSectPanel(); } catch (e1) {}
        return true;
    }
    function dailyLifeTick(sect) {
        var pool = roster(sect).filter(function (d) { return d && !d.away; });
        if (pool.length < 2) return null;
        var day = today();
        if (seeded(day, saltOf(sect.name) + 313) >= 0.18) return null; // 日子不是天天有戏——但总有
        var i1 = Math.floor(seeded(day, saltOf(sect.name) + 317) * pool.length) % pool.length;
        var i2 = Math.floor(seeded(day, saltOf(sect.name) + 331) * pool.length) % pool.length;
        if (i1 === i2) i2 = (i2 + 1) % pool.length;
        var a = pool[i1], b = pool[i2];
        var na = dName(a), nb = dName(b);
        // 第二十二波：戏是真戏——交情写进江湖关系图的真账（同门边），疙瘩也真结
        var nA = getNPC(a.npcId), nB = getNPC(b.npcId);
        // 第二十八波：道侣同修——日子的戏抽到一对道侣，这出归他们（感悟心境双涨）
        if (nA && nB && (nA.daoMate === nB.id || nB.daoMate === nA.id)) {
            bump(a, 3); bump(b, 3); insightOf(a, 2); insightOf(b, 2);
            log('🏮 「' + na + '」与「' + nb + '」这对道侣又在同修——一个练式，一个守丹，日到西沉也没分开。（两人感悟都涨，心境安稳）', 'info');
            return 7;
        }
        var kind = Math.floor(seeded(day, saltOf(sect.name) + 337) * 7) % 7;
        var line = null;
        if (kind === 0) {
            bump(a, 2); bump(b, 2); insightOf(a, 1);
            bondUp(nA, nB, 4, sect.name);
            line = '🥋 演武场上，「' + na + '」和「' + nb + '」拆了三十招——谁也没赢谁，围观的倒喊哑了嗓子。（两人心气都高了，交情也厚了）';
        } else if (kind === 1) {
            insightOf(a, 1); insightOf(b, 1);
            bondUp(nA, nB, 3, sect.name);
            line = '📖 藏经阁里，「' + na + '」和「' + nb + '」凑在一卷旧书前读了一下午——为一句注文争得面红耳赤，出门时又勾肩搭背。（各有感悟）';
        } else if (kind === 2) {
            bump(a, -2); bump(b, 1);
            bondUp(nA, nB, 2, sect.name);
            line = '🍲 伙房里「' + na + '」打翻了一锅粥，「' + nb + '」笑得直不起腰——最后两人一起挨了掌门的瞪，一起把灶台刷了。';
        } else if (kind === 3) {
            bump(a, 2); bump(b, 2);
            bondUp(nA, nB, 5, sect.name);
            line = '🌙 井台边，「' + na + '」和「' + nb + '」说了半宿的话——说的是各自进山门之前的日子。第二天两人眼圈都是黑的，交情倒是厚了。';
        } else if (kind === 4) {
            bump(a, -2); bump(b, -2);
            if (seeded(day, saltOf(sect.name) + 341) < 0.3) {
                // 这一架记了仇——怨气压在寻衅线以下，是心结不是死仇；往后的好日子能磨平
                bondGrudge(nA, nB, 12);
                line = '😤 「' + na + '」和「' + nb + '」为着一件兵器吵翻了——话赶话说到难听处，两人都下了脸。这疙瘩，一时半会儿解不开了。（结了嫌隙：往后的好日子或许能磨平）';
            } else {
                bondUp(nA, nB, -3, sect.name);
                line = '😤 「' + na + '」和「' + nb + '」为着一件兵器吵了起来，谁也不让谁——冷战了三日，第四天又搭伙干活了。谁也没提那天的事。';
            }
        } else if (kind === 5) {
            bump(a, 1); bump(b, 1);
            bondUp(nA, nB, 2, sect.name);
            line = '🌧 落雨，出不了活。「' + na + '」和「' + nb + '」蹲在檐下看雨看了半个时辰——谁也没说话，谁也没走。';
            if (seeded(day, saltOf(sect.name) + 353) < 0.25) street('有人路过「' + sect.name + '」的山门，看见两个弟子蹲在檐下看雨——回去说给茶棚听：「那家人不急，日子是过的。」');
        } else {
            bump(a, 2); bump(b, 1); insightOf(b, 1);
            bondUp(nA, nB, 3, sect.name);
            line = '🔨 屋顶漏了一夜，「' + na + '」天不亮就爬上去补瓦，「' + nb + '」在底下递泥——活干完，两人坐在屋脊上看日出。（「' + nb + '」偷学了两手）';
        }
        log(line, 'info');
        return kind;
    }

    // ============ 四 · 病殁治丧（人没了，礼数不能没） ============
    var FUNERAL_COST = 20;
    function funeral(ps, nm, cause) {
        if (!ps) return false;
        var word = cause || '病殁任上';
        var paid = spendTreasury(ps.name, FUNERAL_COST, '治丧·棺木与抚恤');
        if (paid) {
            chron(ps.name, '「' + nm + '」' + word + '——门中治丧，棺木抚恤灵石' + FUNERAL_COST + '出库，牌位入了祖堂。');
            street('「' + ps.name + '」门里办了场丧事——掌门亲自扶灵，抚恤送去了家里人手上。街坊说：这家门，拿人当人。');
            bumpAll(ps, -3);
            log('🕯️ 「' + nm + '」' + word + '。门中治丧：棺木抚恤灵石' + FUNERAL_COST + '出库，牌位入祖堂——门人同悲，街坊看在眼里。（声望不涨，人心看得见）', 'warning');
        } else {
            chron(ps.name, '「' + nm + '」' + word + '——库里凑不出治丧的钱，薄棺一座，葬在山后。门中记愧。');
            bumpAll(ps, -6);
            log('🕯️ 「' + nm + '」' + word + '——库里空得连棺木钱都凑不齐，薄棺葬在了后山。活人心里都记着这笔愧。（门人心寒）', 'error');
        }
        // 第二十八波：道侣先行——剩下那个人的日子塌了一角（丧偶真记账）
        try {
            var allN = (W.npcManager && W.npcManager.getAllNPCs) ? W.npcManager.getAllNPCs() : [];
            var deadOne = null;
            for (var q = 0; q < allN.length; q++) { if (allN[q] && allN[q].name === nm) { deadOne = allN[q]; break; } }
            if (deadOne && deadOne.daoMate) {
                var widN = getNPC(deadOne.daoMate);
                if (widN && !widN.isDead) {
                    var widD = findMember(ps, widN.id);
                    if (widD) {
                        bump(widD, -12);
                        chron(ps.name, '「' + widN.name + '」的道侣「' + nm + '」先行一步——丧礼之后，这人再没像从前那样笑过。宗谱上那一页，两个名字还并着。');
                        log('🕯️ 「' + widN.name + '」在丧礼上一句话没说——道侣「' + nm + '」先走了。（心境大跌；宗谱上两个名字还并着）', 'warning');
                    }
                }
            }
            // 第三十三波：首座先行——担子落了地，虚位待另择
            if (deadOne && ps._heir === deadOne.id) {
                ps._heir = null;
                chron(ps.name, '首座弟子「' + nm + '」不在了——这副担子落了地，虚位待另择。门里缟素了一阵。');
                log('🎖 首座弟子走了——门里一时无人接这副担子。（宗门总册里再立一位首座，门中声望才压得住阵）', 'warning');
            }
        } catch (eWid) {}
        note(ps.name, '「' + nm + '」' + word + '，宗谱记殁' + (paid ? '，抚恤送出' : '——库空，薄葬记愧') + '。');
        return !!paid;
    }

    // ============ 五 · 日结接线 ============
    try {
        if (W.EventBus && W.EventBus.on) {
            W.EventBus.on('newDay', function () {
                try {
                    var sect = mine();
                    if (!sect || sect._ruined) return;
                    settleReturns(sect);
                    dailyLifeTick(sect);
                    var day = today();
                    if (day && day % 30 === 0) {
                        // 秘艺的名头随年月传开——按月一点点声望（有艺才涨）
                        var art = sect.art;
                        if (art) gainRep(sect.name, Math.round(0.2 * (Number(art.level) || 1) * 10) / 10, '镇山秘艺「' + art.name + '」名头传开');
                        // 第三十三波：首座月结——人在山门压阵，门中声望暗涨、弟子心气高
                        heirMonthly(sect);
                    }
                } catch (e) {}
            });
            // 第二十二波：新人进门即与全门结同门边（往后日常戏才有得写）
            W.EventBus.on('playerSect:discipleRecruited', function (p) {
                try {
                    if (!p || !p.sectId) return;
                    var sect = (W.PlayerSect && W.PlayerSect.getSect) ? W.PlayerSect.getSect(p.sectId) : null;
                    if (sect) bondSeed(sect, p.npcId);
                } catch (e) {}
            });
        }
    } catch (e) {}

    // ============ 导出 ============
    W.PSectLife = {
        ART_KINDS: ART_KINDS, ART_COST: ART_COST, ART_UP_COST: ART_UP_COST, MISSIONS: MISSIONS, FUNERAL_COST: FUNERAL_COST, CHARM_COST: CHARM_COST, WEDDING_COST: WEDDING_COST,
        artOf: artOf, composeArt: composeArt, upgradeArt: upgradeArt, warEdge: warEdge,
        openDispatch: openDispatch, sendAway: sendAway, settleReturns: settleReturns,
        dailyLifeTick: dailyLifeTick, funeral: funeral, homeMembers: homeMembers, findMember: findMember,
        // 第二十二波 · 同门交情
        bondWord: bondWord, bondUp: bondUp, bondGrudge: bondGrudge, bondSeed: bondSeed, openBondBoard: openBondBoard,
        // 第二十八波 · 弟子结伴走
        marryPair: marryPair,
        // 第三十二波 · 道侣上墙头
        daoPairsAtHome: daoPairsAtHome,
        // 第三十三波 · 门里有传人
        appointHeir: appointHeir, heirMonthly: heirMonthly, renameArt: renameArt
    };
    console.log('[player-sect-life] 第二十一波 · 弟子是活人：镇山秘艺（一门一艺·传功更疾·战阵折敌·名头传开）+ 派遣下山（押镖真钱/历练真险·护身符减半/采买真货）+ 门内日常（日子自己会长）+ 病殁治丧（棺木抚恤真出库）；第二十二波添同门交情（日常戏写进江湖关系图真账·嫌隙能磨平·交情册可查）；第二十八波添弟子结伴走（莫逆可主婚结道侣·道侣同修·丧偶真痛·结伴下山凶险压低荷包对分）；第三十三波添门里有传人（首座月结压阵·秘艺亲题碑名）');
})();
