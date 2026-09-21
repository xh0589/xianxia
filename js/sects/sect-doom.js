// ==================== sect-doom.js - 灭门与复兴（方案三 · 按已审详稿落地） ====================
// 详稿见《详稿·灭门与复兴.md》。三条毁灭路全有前兆、升级期、翻盘口——不无预警灭门：
//   路A 血仇压山：战帖（三十日）→ 兵临山下（七日）→ 破山之战三波连环真仗；
//   路B 灵脉枯人心散：城枯+断粮半年+式微 → 每月「熬还是散」抉择（搬迁/再熬/散伙）；
//   路C 名存实亡：弟子≤3连续六十日，灯自己灭。
// 掌门不死（恋爱角色铁律）：按羁绊三分支（随行/游历/隐世）；亲传弟子三下场（跟着/走散/投敌，人际损失全可挽回）；
// 遗徒：俸禄停、账本封存、腰牌不缴回（牌在人身上，派在心里）；复兴：三位老相识+灵石五百（可借，账是真的）+旧址三十日工期。
// 纪律：账全走真接口（公库清算守恒/族谱另册/编年/街谈/势力联动）；一月至多灭一门；零外文字母，文案不带计数器口吻。
(function () {
    'use strict';
    var W = window;

    var CITIES = ['洛水城', '青木城', '炎城', '大漠孤城', '冰原城', '万毒谷', '金城', '剑阁', '帝都·长安'];

    function ds() { return W.discipleState || null; }
    function cd() { return W.currentCharData || null; }
    function flags() { return (W.eventFlags = W.eventFlags || {}); }
    // 第九波·总账根治：timeSystem.totalDays 在生产里根本不存在，旧钟恒 0——灭门日结/月结全是死代码。
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
    function msg(m, t) { if (typeof W.showMessage === 'function') W.showMessage(m, t || 'info'); }
    function modal(t, b) { if (typeof W.showModal === 'function') W.showModal(t, b); }
    function para(t) { return '<p class="text-sm text-gray-300 leading-relaxed mb-2">' + t + '</p>'; }
    function btn(label, onclick, cls) { return '<button onclick="' + onclick + '" class="' + (cls || 'bg-yellow-700 hover:bg-yellow-600') + ' text-xs px-3 py-2 rounded text-left">' + label + '</button>'; }
    function btns(arr) { return '<div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">' + arr.join('') + '</div>'; }
    function _close() { try { var ov = document.getElementById('xianxia-modal-overlay'); if (ov) ov.remove(); } catch (e) {} }
    function internal(sect) { return (W.SECT_INTERNAL && W.SECT_INTERNAL[sect]) || null; }
    function mySect() { try { var d = ds(); return d && d.isInSect ? (d.sectName || d.sectId) : null; } catch (e) { return null; } }
    function playerName() { try { return (cd() || {}).name || '无名弟子'; } catch (e) { return '无名弟子'; } }
    function leaderName(sect) { try { if (W.SECT_LEADER_NAMES && W.SECT_LEADER_NAMES[sect]) return W.SECT_LEADER_NAMES[sect]; } catch (e) {} return sect + '掌门'; }
    function leaderNpc(sect) { try { return (W.npcManager && W.npcManager.getNPC) ? W.npcManager.getNPC('sect_leader_' + sect) : null; } catch (e) { return null; } }
    function aff(n) { return (n && n.relationship && Number(n.relationship.affection)) || 0; }
    function isCompanion(n) { return !!(n && (n._companionData || n.isDaoCompanion)); }
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
    function powerScore(sect) { try { if (typeof W.sectPowerNow === 'function') { var p = W.sectPowerNow(sect); if (p) return p.score; } } catch (e) {} return 150; }
    function tierRankOf(sect) {
        try {
            if (typeof W.sectPowerNow === 'function') {
                var p = W.sectPowerNow(sect);
                var L = ['巨擘', '大派', '中等偏上', '中等', '小派', '式微', '残破'];
                var i = p ? L.indexOf(p.tier) : 3;
                return i < 0 ? 3 : i;
            }
        } catch (e) {}
        return 3;
    }
    function alignOf(sect) { try { if (typeof W.sectAlignNow === 'function') { var a = W.sectAlignNow(sect); if (a) return a.align; } } catch (e) {} return 0; }
    function realmTier() { try { return Math.max(1, typeof W.getRealmTier === 'function' ? W.getRealmTier((cd() || {}).realm) : 1); } catch (e) { return 1; } }
    function addStones(n) {
        try { if (W.XianXia && W.XianXia.DataManager && W.XianXia.DataManager.addSpiritStones) { W.XianXia.DataManager.addSpiritStones(n); return; } } catch (e) {}
        if (W.inventory && W.inventory.currency) W.inventory.currency.spiritStones = (Number(W.inventory.currency.spiritStones) || 0) + n;
    }
    function playerStones() {
        try { if (W.inventory && W.inventory.currency) return Number(W.inventory.currency.spiritStones) || 0; } catch (e) {}
        return 0;
    }
    function hasStore(sect, kind, n) {
        var it = internal(sect);
        if (!it) return false;
        var v = kind === 'stone' ? it.resources : kind === 'material' ? it.material : kind === 'pill' ? it.pill : 0;
        return (Number(v) || 0) >= n;
    }
    function deduct(sect, kind, n) { try { if (W.SectGov && W.SectGov.deductStore) return W.SectGov.deductStore(sect, kind, n); } catch (e) {} return false; }
    function dip() { return W.SECT_DIPLOMACY_STATE || null; }
    function relOf(a, b) { try { var d = dip(); return d && d[a] && d[a][b] ? (Number(d[a][b].relation) || 0) : null; } catch (e) { return null; } }
    function setRel(a, b, v) {
        try {
            var d = dip();
            if (!d) return;
            v = Math.max(-100, Math.min(100, Math.round(v)));
            if (d[a] && d[a][b]) d[a][b].relation = v;
            if (d[b] && d[b][a]) d[b][a].relation = v;
            if (typeof W.saveSectDiplomacy === 'function') W.saveSectDiplomacy();
        } catch (e) {}
    }
    function npcsOf(sect) {
        var out = [];
        try {
            var all = (W.npcManager && W.npcManager.getAllNPCs) ? W.npcManager.getAllNPCs() : [];
            for (var i = 0; i < all.length; i++) {
                var n = all[i];
                if (n && n.id && String(n.id).indexOf('sect_disciple_' + sect) === 0) out.push(n);
            }
        } catch (e) {}
        return out;
    }
    W.sectIsRuined = function (sect) { return !!flags()['sect_ruin_' + sect]; };
    function doom() { return flags()['sect_doom'] || null; }
    function currentCity() {
        try { if (typeof W.getCurrentCityName === 'function' && W.getCurrentCityName()) return W.getCurrentCityName(); } catch (e) {}
        try { if (W.locationSystem && W.locationSystem.currentLocation) return W.locationSystem.currentLocation; } catch (e2) {}
        return '';
    }

    // ============ 一 · 路A 血仇压山 ============
    function findFoe(sect) {
        var d = dip();
        if (!d || !d[sect]) return null;
        var my = powerScore(sect);
        for (var other in d[sect]) {
            if (W.sectIsRuined(other)) continue;
            var rel = relOf(sect, other);
            if (rel == null || rel > -90) continue;
            if (powerScore(other) < my * 1.2) continue;
            var cell = d[sect][other];
            if (absDay() - (Number(cell.lastEvent) || 0) < 90) continue;
            return other;
        }
        return null;
    }
    function doomTriggerCheck() {
        var day = absDay();
        if (day % 30 !== 0) return;
        if (doom()) return;
        if ((Number(flags()['sect_doom_cd'] || 0)) > day) return;
        var mine = mySect();
        if (!mine || W.sectIsRuined(mine)) return;
        var subjugate = alignOf(mine) <= -80;
        var foe = null;
        if (subjugate && Math.random() < 0.1) {
            // 正道讨伐：多家联名，以天道之名
            var sects = W.sectsData || {};
            for (var s in sects) {
                if (s === mine || W.sectIsRuined(s)) continue;
                if (alignOf(s) >= 40 && powerScore(s) >= powerScore(mine) * 0.8) { foe = s; break; }
            }
            if (foe) startDoom(mine, foe, 'A', true);
            return;
        }
        foe = findFoe(mine);
        if (foe && Math.random() < 0.25) startDoom(mine, foe, 'A', false);
    }
    function startDoom(sect, foe, path, subjugate) {
        var day = absDay();
        flags()['sect_doom'] = {
            sect: sect, foe: foe, path: path, subjugate: !!subjugate,
            day: day, strikeDay: day + 30, stage: 1, evacuated: false, begged: false, aid: null, stage2shown: false
        };
        var title = subjugate ? '多家联名、以天道之名' : '仇家';
        chron(sect, (subjugate ? '正道诸家联名的战帖钉上了山门——「以天道之名，讨不义之门」。' : '山门夜里被钉上一封血书的战帖，落款是「' + foe + '」。') + '三十日后，兵临山下。');
        street('江湖震动：「' + foe + '」' + (subjugate ? '领着正道诸家' : '') + '向「' + sect + '」下了战帖——三十日为限，不死不休。茶棚里连说书人都改了当天的段子。');
        log('🔥 ' + title + '的战帖钉上了山门（' + foe + '），三十日后破山——这一个月里你还有路走：递书求和、整军经武、疏散老弱、向盟家求援。（政事面板「战云」块可见全部出口）', 'danger');
        openDoomPanel();
    }
    function doomDayTick() {
        var dm = doom();
        if (!dm) return;
        var day = absDay();
        // 整军经武：每月复查势力比，对方气短则自动消
        if (day % 30 === 0 && dm.stage < 3) {
            var aidScore = dm.aid ? powerScore(dm.aid) * 0.5 : 0;
            if (powerScore(dm.foe) < (powerScore(dm.sect) + aidScore) * 1.2 && !dm.subjugate) {
                cancelDoom('山下的兵，悄悄撤了——「' + dm.foe + '」掂了掂两边的斤两，气短了。（战云自散）');
                return;
            }
        }
        if (!dm.stage2shown && day >= dm.strikeDay - 7) {
            dm.stage = 2;
            dm.stage2shown = true;
            chron(dm.sect, '「' + dm.foe + '」的兵到了山下。外门弟子全部撤回山上，山下的集市停了摆。');
            log('🔥 兵临山下——「' + dm.foe + '」的营帐就扎在山门外七里。还有七日。伤者与年少弟子，现在还送得出去。（政事面板「战云」块：疏散老弱/求援盟家/递书求和）', 'danger');
        }
        if (day >= dm.strikeDay && !W.currentBattle && !dm.awaitBattle) {
            dm.stage = 3;
            startDoomBattle(1);
        }
    }
    function openDoomPanel() {
        var dm = doom();
        if (!dm) return;
        var left = Math.max(0, dm.strikeDay - absDay());
        var html = '<div class="text-left">';
        html += para('🔥 战云压顶：' + (dm.subjugate ? '正道诸家联名讨伐（以天道之名），领头「' + dm.foe + '」' : '「' + dm.foe + '」的战帖钉在山门上') + '——<b class="text-red-300">' + left + '</b>日后破山。');
        html += para(dm.stage >= 2 ? '兵已到了山下，营帐扎在山门外七里。' : '这一个月里，你还有路走。');
        if (dm.aid) html += para('🤝 「' + dm.aid + '」已答应来援——守军多了三成气力。');
        if (dm.evacuated) html += para('🕯️ 伤者与年少弟子已送出山——真到那一天，走散的人会少一半。');
        var acts = [];
        var d = ds() || {};
        var rank = d.rank == null ? 7 : d.rank;
        if (rank <= 2) acts.push(btn('🕊️ 递书求和——公库灵石' + (dm.stage >= 2 ? 500 : 300) + '做赔礼', 'window.doomBegPeace()', 'bg-sky-800 hover:bg-sky-700'));
        if (!dm.evacuated) acts.push(btn('🕯️ 疏散老弱——公库灵石五十', 'window.doomEvacuate()', 'bg-emerald-800 hover:bg-emerald-700'));
        if (!dm.aid) acts.push(btn('🤝 向盟家求援（关系≥60才肯出兵）', 'window.doomSeekAid()', 'bg-indigo-800 hover:bg-indigo-700'));
        if (dm.subjugate) acts.push(btn('🔥 自焚邪功，向诸家请罪（公库清空、势力折半、立场回暖三十）', 'window.doomAtone()', 'bg-amber-800 hover:bg-amber-700'));
        acts.push(btn('⚔️ 整军经武——什么都不做也是做：兵器库与大阵是势力分的真账，对方每月都会掂量', 'window._closeModal && window._closeModal()', 'bg-gray-700 hover:bg-gray-600'));
        html += btns(acts);
        html += '</div>';
        modal('🔥 ' + dm.sect + ' · 战云', html);
    }
    W.openDoomPanel = openDoomPanel;
    function cancelDoom(line) {
        var dm = doom();
        flags()['sect_doom'] = null;
        flags()['sect_doom_cd'] = absDay() + 180;
        if (dm) {
            chron(dm.sect, line);
            street('那场眼看要打起来的破山之战，没打成——「' + dm.foe + '」的兵退了。江湖上都说，「' + dm.sect + '」这关过得悬。');
        }
        log('🕊️ ' + line, 'success');
    }
    // 破山之战：三波连环真仗
    function doomEnemy(dm, round) {
        var c = cd() || {};
        var tier = realmTier();
        var aidCut = dm.aid ? 0.9 : 1;
        var mul = [1.3, 1.4, 1.5][round - 1] * aidCut;
        var names = ['先锋营', '中军主力', '压山长老'];
        return {
            name: dm.foe + '·' + names[round - 1], type: 'enemy', physiologyType: 'humanoid',
            level: Math.max(1, (typeof W.realmScaledEnemyLevel === 'function' ? W.realmScaledEnemyLevel(c) : tier * 3)),
            attack: Math.round((34 + tier * 7) * mul), defense: Math.round((17 + tier * 4) * mul), speed: Math.round(18 + tier * 2),
            maxDurability: Math.round((100 + tier * 17) * mul), durabilities: { chest: Math.round((100 + tier * 17) * mul) },
            combatAbilities: [],
            description: '「' + dm.foe + '」破山的第' + round + '波——他们不是来切磋的。'
        };
    }
    function startDoomBattle(round) {
        var dm = doom();
        if (!dm) return;
        dm.awaitBattle = true;
        if (round === 1) {
            modal('🔥 破山之战', para('天没亮，山门外的鼓就响了。「' + dm.foe + '」的人列成三排，为头的长老只说了一句话：「把这些年的账，拿出来算。」')
                + para('守山的师兄抹了把脸，手上的血不知是谁的。「三拨。」他说，「省着点力气。」')
                + btns([btn('⚔️ 上山门楼——打第一波', 'window._closeModal && window._closeModal(); window.startDoomBattleNow(1)', 'bg-red-800 hover:bg-red-700')]));
            return;
        }
        W.startDoomBattleNow(round);
    }
    W.startDoomBattleNow = function (round) {
        var dm = doom();
        if (!dm) return;
        _close();
        if (typeof W.startBattle !== 'function') { msg('战端未就绪。', 'error'); return; }
        var b = W.startBattle(doomEnemy(dm, round));
        if (b) { b._isDoomBattle = true; b._doomRound = round; }
        dm.awaitBattle = false;
        log('🔥 破山之战第' + round + '波——「' + dm.foe + '」的人攻上来了。（三波连环真仗，守住山就还在）', 'danger');
    };
    W.settleDoomBattle = function (win) {
        var b = W.currentBattle || {};
        var round = b._doomRound;
        var dm = doom();
        if (!dm || !round) return;
        if (!win) {
            destroySect(dm.sect, 'A', dm.foe, dm);
            return;
        }
        if (round < 3) {
            var between = round === 1
                ? '🕯️ 第一波退下去了。山门楼上，掌门把最后一面阵旗插了上去。风一吹，旗展开——还是全的。「还有两拨。」'
                : '🕯️ 第二波也退了。守山的师兄靠着墙滑坐下去，朝你比了个大拇指。山下，压山长老亲自提刀出阵了。';
            log(between, 'warning');
            modal('🔥 破山之战', para(between.slice(2)) + btns([btn('⚔️ 迎第' + (round + 1) + '波', 'window.startDoomBattleNow(' + (round + 1) + ')', 'bg-red-800 hover:bg-red-700')]));
            return;
        }
        // 三波全守住
        try { if (typeof W.sectPowerWarMod === 'function') W.sectPowerWarMod(dm.sect, true); } catch (e) {}
        try { if (typeof W.sectPowerWarMod === 'function') W.sectPowerWarMod(dm.foe, false); } catch (e2) {}
        try { if (W.currentCharData) W.currentCharData.fame = Math.min(99999, (W.currentCharData.fame || 0) + 10); } catch (e3) {}
        setRel(dm.sect, dm.foe, Math.min(-90, (relOf(dm.sect, dm.foe) || -90) - 10));
        cancelDoom('三波攻势全被打退——「' + dm.foe + '」的压山长老在阵前站了半晌，收兵。山还在。（战绩落座次，名望+10，编年记「山还在」）');
        chron(dm.sect, '破山之战：三波攻势，一日打退。山门楼的旗被打穿了七个洞，但没有倒——山还在。');
    };
    // 升级期出口
    W.doomBegPeace = function () {
        var dm = doom();
        if (!dm) { msg('眼下没有战云。', 'info'); return; }
        var d = ds() || {};
        var rank = d.rank == null ? 7 : d.rank;
        if (rank > 2) { msg('递书求和要长老以上出面——你的职位递不上这个话。', 'warning'); return; }
        var cost = dm.stage >= 2 ? 500 : 300;
        if (!hasStore(dm.sect, 'stone', cost)) { msg('赔礼要公库灵石' + cost + '——库里不凑手。', 'error'); return; }
        deduct(dm.sect, 'stone', cost);
        setRel(dm.sect, dm.foe, (relOf(dm.sect, dm.foe) || -90) + 20);
        cancelDoom('掌门把赔礼的礼单看了三遍，叹了口气：「破财免灾，先记下。」——战帖撤了。（公库-' + cost + '，关系回暖二十）');
    };
    W.doomEvacuate = function () {
        var dm = doom();
        if (!dm) { msg('眼下没有战云。', 'info'); return; }
        if (dm.evacuated) { msg('老弱已经送出去了。', 'info'); return; }
        if (!hasStore(dm.sect, 'stone', 50)) { msg('疏散要公库灵石五十做盘缠——库里不凑手。', 'error'); return; }
        deduct(dm.sect, 'stone', 50);
        dm.evacuated = true;
        chron(dm.sect, '伤者与年少弟子连夜送出了山——公库出的盘缠。掌门说：「人比山门金贵。」');
        log('🕯️ 伤者与年少弟子连夜送出了山（公库-50）。真到了那一天，走散的人会少一半——人比山门金贵。', 'info');
        _close(); openDoomPanel();
    };
    W.doomSeekAid = function () {
        var dm = doom();
        if (!dm) { msg('眼下没有战云。', 'info'); return; }
        if (dm.aid) { msg('「' + dm.aid + '」已答应来援。', 'info'); return; }
        var d = dip();
        var best = null, bestRel = 0;
        if (d && d[dm.sect]) {
            for (var other in d[dm.sect]) {
                if (other === dm.foe || W.sectIsRuined(other)) continue;
                var r = relOf(dm.sect, other);
                if (r != null && r >= 60 && r > bestRel) { best = other; bestRel = r; }
            }
        }
        if (!best) { msg('翻遍外交册，没有一家交情够到肯出兵的（关系≥60）——平日的人情，这时候见真章。', 'warning'); return; }
        dm.aid = best;
        chron(best, '「' + dm.sect + '」的求援帖到了。' + leaderName(best) + '把帖子拍在案上：「这个忙，帮。」——点弟子，随帖出发。');
        chron(dm.sect, '「' + best + '」答应来援——人情记下了，来日要还的。');
        var aidScore = powerScore(best) * 0.5;
        if (powerScore(dm.foe) < (powerScore(dm.sect) + aidScore) * 1.2 && !dm.subjugate) {
            cancelDoom('「' + best + '」的旗号出现在山口时，「' + dm.foe + '」掂了掂两边的斤两——当夜拔营退了。（求援成了，人情记在编年里）');
        } else {
            log('🤝 「' + best + '」的人到了——可对方势大，这一仗还是得打。好在守军多了三成气力（三波强度各减一成）。', 'info');
            _close(); openDoomPanel();
        }
    };
    W.doomAtone = function () {
        var dm = doom();
        if (!dm || !dm.subjugate) { msg('这不是讨伐的战帖。', 'info'); return; }
        var it = internal(dm.sect);
        if (it) { it.resources = 0; it._subjugated = true; }
        try { if (typeof W.sectAlignShift === 'function') W.sectAlignShift(dm.sect, 30, '自焚邪功'); } catch (e) {}
        cancelDoom('掌门在祖师堂前焚了历代「邪功」秘籍，亲向诸家请罪——公库清空，门派势力折半，立场回暖三十。诸家的兵，退了。（真忏悔，代价是真代价）');
        street('「' + dm.sect + '」自焚邪功、散尽公库向诸家请罪——讨伐的兵退了。茶棚里说：这一把火烧掉的，比一场仗还多。');
    };

    // ============ 二 · 路B 灵脉枯人心散 / 路C 名存实亡 ============
    function pathBCheck() {
        var day = absDay();
        if (day % 30 !== 0) return;
        var mine = mySect();
        if (!mine || W.sectIsRuined(mine) || doom()) return;
        var it = internal(mine);
        if (!it) return;
        if ((Number(it._famineDays) || 0) < 180) return;
        if (tierRankOf(mine) < 5) return; // 式微以下才走到这一步
        var withered = false;
        try {
            var f = flags();
            var region = it._movedToRegion || ((W.sectsData[mine] || {}).location);
            var CITY_REGION = { '大漠孤城': '西漠', '冰原城': '北冥', '万毒谷': '南疆', '青木城': '东荒', '剑阁': '蜀地', '炎城': '东南海域', '洛水城': '中州', '帝都·长安': '中州' };
            for (var c in CITY_REGION) { if (f['qi_withered_' + c] && CITY_REGION[c] === region) { withered = true; break; } }
        } catch (e) {}
        if (!withered) return;
        openEndurePanel(mine);
    }
    function openEndurePanel(sect) {
        var it = internal(sect);
        var held = [];
        try { held = (typeof W.sectCityPatrons === 'function') ? (W.sectCityPatrons(sect) || []) : []; } catch (e) {}
        var canMove = false, moveCity = '';
        for (var i = 0; i < held.length; i++) {
            var info = W.sectCityInfo ? W.sectCityInfo(held[i].city) : null;
            if (info && info.branch) { canMove = true; moveCity = held[i].city; break; }
        }
        var html = '<div class="text-left">';
        html += para('🥀 灵脉枯了，粮断了半年——门里的人一天比一天少。今夜，' + leaderName(sect) + '把你叫到后山，只问了一句话：');
        html += para('<b class="text-amber-200">「熬，还是散？」</b>');
        var acts = [];
        if (canMove) acts.push(btn('🚶 山门搬迁——去' + moveCity + '的分舵（公库灵石四百；故土难离的弟子会留下，约三人）', 'window.doomRelocate(\'' + sect + '\', \'' + moveCity + '\')', 'bg-emerald-800 hover:bg-emerald-700'));
        acts.push(btn('🕯️ 再熬熬——断粮账照旧，俸禄减半，人还会走，但灯还亮着', 'window._closeModal && window._closeModal()', 'bg-gray-700 hover:bg-gray-600'));
        acts.push(btn('💔 散伙——主动解散：公库按人头分，各奔前程（你转遗徒）', 'window.doomDisband(\'' + sect + '\')', 'bg-red-900 hover:bg-red-800'));
        html += btns(acts);
        html += '</div>';
        modal('🥀 ' + sect + ' · 熬还是散', html);
    }
    W.doomRelocate = function (sect, city) {
        var it = internal(sect);
        if (!it) return;
        if (!hasStore(sect, 'stone', 400)) { msg('搬迁要公库灵石四百——库里不凑手，先熬着吧。', 'error'); return; }
        deduct(sect, 'stone', 400);
        it.disciples = Math.max(3, (Number(it.disciples) || 0) - 3);
        var CITY_REGION = { '大漠孤城': '西漠', '冰原城': '北冥', '万毒谷': '南疆', '青木城': '东荒', '剑阁': '蜀地', '炎城': '东南海域', '洛水城': '中州', '帝都·长安': '中州' };
        it._movedToRegion = CITY_REGION[city] || it._movedToRegion;
        it._famineDays = 0;
        chron(sect, '山门搬去了' + city + '的分舵——祖师牌位是背着的，一路没让它见土。有三名弟子留在了旧地：故土难离，磕了头，各奔前程。');
        log('🚶 山门搬迁：灵石四百置办车马，祖师牌位背在身上——新山门落在' + city + '。枯萎的灵脉甩在了身后（势力分的枯城修正解除），断粮的日子从头数。（三名弟子留在了旧地）', 'success');
        _close();
    };
    W.doomDisband = function (sect) {
        if (mySect() !== sect) { msg('这不是你的门派。', 'warning'); return; }
        destroySect(sect, 'B', null, null);
    };
    function pathCTick() {
        var day = absDay();
        var sects = W.SECT_INTERNAL || {};
        var doomed = 0;
        for (var sect in sects) {
            if (W.sectIsRuined(sect)) continue;
            var it = sects[sect];
            if (isPSect(sect)) {
                // 第十七波：自建宗门入灭门册——但空幡的口径不一样：开创人就是守灯人，
                // 只有「草创无片瓦 + 曾经满过三人 + 如今人尽 + 库不足十石」连续六十日，灯才自己灭；
                // 赁屋/山门是基业，倒了砖瓦还在——不自灭，掌门可自主散伙（总册里）。第三十日先提醒一声。
                var ps = null;
                try { ps = (W.PSectWorld && W.PSectWorld.byName) ? W.PSectWorld.byName(sect) : null; } catch (eP) {}
                if (!ps || ps._ruined) continue;
                var pst = 0;
                try { pst = (W.PSBoot && W.PSBoot.stageOf) ? W.PSBoot.stageOf(ps) : 0; } catch (eP3) {}
                var pm = (ps.disciples || []).length + (ps.guests || []).length;
                var pp = 0;
                try { pp = (W.PSectWorld && W.PSectWorld.realStones) ? W.PSectWorld.realStones(sect) : 0; } catch (eP2) {}
                if (pst === 0 && (Number(ps._peak) || 0) >= 3 && pm === 0 && pp < 10) it._psLowDays = (Number(it._psLowDays) || 0) + 1;
                else { it._psLowDays = 0; it._psWarned = false; }
                if ((Number(it._psLowDays) || 0) === 30 && !it._psWarned) {
                    it._psWarned = true;
                    chron(sect, '幡布褪了色，香炉冷了三十日。有人在门口站了站，没进来。');
                    log('🥀 你的「' + sect + '」空了三十日、库不足十石——再空三十日，灯就自己灭了。收个人、注点资，或体面散伙，都在宗门总册里。（幡倒之前，总来得及）', 'danger');
                }
                if ((Number(it._psLowDays) || 0) < 60) continue;
                if (day % 30 !== 0) continue;
                if (doomed >= 1) break;
                if (doom() && doom().sect === sect) continue;
                doomed++;
                destroySect(sect, 'C', null, null);
                continue;
            }
            var disc = Number(it.disciples) || 0;
            if (disc <= 3 && disc > 0) it._lowDays = (Number(it._lowDays) || 0) + 1;
            else if (disc > 3) it._lowDays = 0;
            if ((Number(it._lowDays) || 0) < 60) continue;
            if (day % 30 !== 0) continue;
            if (doomed >= 1) break; // 一月至多灭一门
            if (doom() && doom().sect === sect) continue;
            doomed++;
            destroySect(sect, 'C', null, null);
        }
    }

    // ============ 三 · 灭门结算（账目全走真接口） ============
    function scatterNpc(n) {
        if (!n || n.isDead) return;
        n._scattered = true;
        try { n.location = CITIES[Math.floor(Math.random() * CITIES.length)]; } catch (e) {}
    }
    function leaderFate(sect, path) {
        var n = leaderNpc(sect);
        var ln = leaderName(sect);
        var mine = mySect() === sect || (ds() || {})._remnantOf === sect;
        var a = mine ? aff(n) : 0;
        var comp = isCompanion(n);
        if (n && (a >= 60 || comp)) {
            flags()['sect_exiled_leader'] = sect;
            n._exiledWithPlayer = true;
            try { n.location = currentCity() || CITIES[0]; } catch (e) {}
            if (comp) {
                modal('🥀 家没了', para('那晚你们在旧山门的废墟上坐到天亮。她靠在你肩上，说了很多从前的事：哪一级石阶她摔过，哪棵树下她被老掌门罚过站，哪一年山上的桃花开得比雪还厚。')
                    + para('说完，天就亮了。')
                    + para('「走吧。」她站起来，拍拍身上的灰，「家在，人在。」')
                    + para('<span class="text-xs text-gray-500">（她这个月比往常更需要你陪着——相伴的需求重了，别晾着她。）</span>'));
            } else {
                modal('🥀 人在，派就在流亡', para('火光把半座山照得通红。你在后山密道口找到她的时候，她素衣的下摆烧焦了一角，手里抱着门中祖师的牌位。')
                    + para('她看见你，没有说山，也没有说派，只问了一句：「你活着。」')
                    + para('天快亮时，她把牌位往怀里拢了拢，站起来。「门派灭了，人没灭。」她说，「只要你还活着，我还活着——' + sect + '就没有亡。它只是……从山上，搬下来了。」')
                    + para('她朝你伸出手。掌心有烟灰，很稳。「走吧。从今日起，你在哪里，山门就在哪里。」')
                    + para('<span class="text-xs text-gray-500">（她从此随你同行——好感更深了一层，往后的日子还长。）</span>'));
            }
            try { if (n.changeAffection) n.changeAffection(20); else if (n.relationship) n.relationship.affection = Math.min(100, a + 20); } catch (e2) {}
        } else if (n && a >= 20) {
            n._wandering = true;
            try { n.location = CITIES[Math.floor(Math.random() * CITIES.length)]; } catch (e3) {}
            if (mine) {
                modal('🥀 各奔前程，情义不断', para('山门口分别时，他朝你拱了拱手。')
                    + para('「' + sect + '的账，记下了。山高水长——你多保重。」')
                    + para('他说完就转身，从另一条路下了山。背影没有回头，可你看见，他垂在身侧的那只手，一直攥着。')
                    + para('<span class="text-xs text-gray-500">（他游历江湖去了——重建山门时登门，他必应。）</span>'));
            }
        } else if (n) {
            n._hiddenLeader = true;
            try { n.location = '隐世'; } catch (e4) {}
            if (mine) {
                modal('🥀 一别两宽', para('你在废墟里没有找到掌门。')
                    + para('后来有人说，天没亮时就看见一条人影下了山，只带了一把剑，没有回头。')
                    + para('族谱的另册上多了一页——他的名字还在。他曾是你的掌门，这笔账，天地记着。'));
            }
        }
        return ln;
    }
    function destroySect(sect, path, foe, dm) {
        if (W.sectIsRuined(sect)) return;
        var day = absDay();
        var it = internal(sect);
        // 第十七波：自建宗门的开创人也是「自家的」——灭门结算落在他头上
        var isPs = isPSect(sect);
        var isMine = mySect() === sect || isPs;
        if (isPs) { try { if (W.PSectWorld && W.PSectWorld.syncMirror) W.PSectWorld.syncMirror(sect); it = internal(sect); } catch (eS) {} }
        flags()['sect_ruin_' + sect] = { day: day, path: path, foe: foe || null };
        flags()['sect_doom'] = null;
        flags()['sect_doom_cd'] = day + 180;
        // 公库清算（守恒：三成折给幸存者安家，七成是攻方战利品）
        var stones = it ? (Number(it.resources) || 0) : 0;
        var disc = it ? (Number(it.disciples) || 1) : 1;
        var sharePool = Math.floor(stones * 0.3);
        var share = Math.floor(sharePool / Math.max(1, disc));
        if (foe && !W.sectIsRuined(foe)) {
            var ifoe = internal(foe);
            if (ifoe) ifoe.resources = (Number(ifoe.resources) || 0) + (stones - sharePool);
        }
        // 护持城幡落、分舵随幡拆除
        try { if (W.SectCities && typeof W.SectCities.releasePatronage === 'function') W.SectCities.releasePatronage(sect); } catch (eC) {}
        // 盛会排期作废
        try { var gs = flags()['sect_gala_sched']; if (gs && gs[sect]) delete gs[sect]; } catch (eG) {}
        // 弟子散落（不标死，标散落——人总能找回来）
        var survivors = [];
        var npcs = npcsOf(sect);
        for (var i = 0; i < npcs.length; i++) {
            var n = npcs[i];
            if (n.isDead) continue;
            survivors.push(n.id);
            scatterNpc(n);
        }
        // 第十七波：自建宗门的门人是有名有姓请来的（不带执事堂的编号前缀）——散落名册走 PSectWorld
        if (isPs) {
            try {
                var extra = (W.PSectWorld && W.PSectWorld.scatterRoster) ? W.PSectWorld.scatterRoster(sect, path) : [];
                for (var xi = 0; xi < extra.length; xi++) { if (survivors.indexOf(extra[xi]) < 0) survivors.push(extra[xi]); }
            } catch (eX) {}
        }
        // 亲传弟子的下场（逐个判，不全杀——只有自家灭门才动玩家的师徒账）
        var d = ds() || {};
        var myDisc = isMine ? (d._myDisciples || []).slice() : [];
        var lost = [], defected = [];
        for (var j = 0; j < myDisc.length; j++) {
            var dn = null;
            try { dn = (W.npcManager && W.npcManager.getNPC) ? W.npcManager.getNPC(myDisc[j]) : null; } catch (eD) {}
            if (!dn || dn.isDead) continue;
            var r = Math.random();
            var lostChance = (dm && dm.evacuated) ? 0.15 : 0.3;
            if (aff(dn) < 20 && r < 0.1) {
                dn._defected = true;
                try { if (foe) dn.location = foe; } catch (eE) {}
                defected.push(dn.name);
            } else if (r < lostChance + 0.1) {
                dn._lostDisciple = { day: day };
                lost.push(dn.name);
            }
            // 其余跟着你——「门派没了，师徒还在」
        }
        // 掌门下场（恋爱角色铁律：不死）
        leaderFate(sect, path);
        // 编年终笔 + 街谈
        chron(sect, day + '日，山门' + (path === 'C' ? '空了——灯是自己灭的' : path === 'B' ? '散了——熬到了头，人心先于粮尽' : '破。灯灭了') + '。人还活着——人活着，账就没死。（族谱转另册）');
        if (path === 'A') street('「' + sect + '」的山门破了——' + (foe ? '「' + foe + '」的人在山门前站了一夜，天亮时，幡换了。' : '') + '那场火烧了三天，山下城里的人都看见了。');
        else if (path === 'B') street('「' + sect + '」散了——灵脉枯了这些年，粮尽人散，山门的灯是自己灭的。');
        else street('「' + sect + '」没了。没有仗，没有火——只是有一天路人经过，发现山门开着，里面已经没有人了。');
        // 玩家转遗徒（账本封存、腰牌不缴回、底子保留）
        if (isMine) {
            flags()['sect_remnant'] = { sect: sect, day: day, tokenKept: true, npcs: survivors, lost: lost, defected: defected, visited: false, reunionCity: {} };
            d._remnantOf = sect;
            d._remnantRank = d.rank == null ? 4 : d.rank;
            d._remnantRankName = d.rankName || '弟子';
            d.isInSect = false;
            d.sectId = null;
            d.sectName = null;
            if (share > 0) {
                addStones(share);
                try { if (typeof W.sectLedgerNote === 'function') W.sectLedgerNote(share, '灭门安家费·公库三成折分'); } catch (eL) {}
            }
            if (isPs) {
                modal('🔥 幡倒了', para('没有火，也没有兵——只是又一个清晨，你推开院门，幡杆上的布条在风里烂成了一缕一缕。')
                    + para('「' + sect + '」是你亲手立起来的。立幡那天的香灰还嵌在砖缝里，院子里已经没有人了。')
                    + para('公库清算：库里剩的折给散伙的人做了盘缠，你名下得灵石' + share + '（账记「灭门安家费」）。宗谱转另册·遗卷——名字都在。')
                    + para('<b class="text-amber-300">腰牌在你自己手里——开创头牌，头号。</b>牌在人身上，派在心里。')
                    + para('<span class="text-xs text-gray-500">（散落的旧人各奔了前程——他们是真找得回的。找回三位老相识、凑五百灵石、回旧址起土，幡还能再立起来。宗门总册与废墟都走着去。）</span>'));
                log('🥀 「' + sect + '」的幡倒了——你自己立的宗，散了。腰牌还在你手里：牌在人身上，派在心里。旧人散落各城，找回三位老相识、五百灵石、回旧址起土，山门还能重立。（宗门总册可见遗卷）', 'error');
            } else {
                modal('🔥 灭门', para('山门倒下来的时候，声音其实不大——像谁家的老墙，终于肯塌了。')
                    + para('你被人流推着往后山退，回头时，火已经舔上了大殿的檐角。「' + sect + '」那块匾在火光里裂开，裂缝正好穿过派名的中间一个字。')
                    + para('公库清算：幸存者分了三成做安家费，你名下得灵石' + share + '（账记「灭门安家费」）。贡献账本封存可查，门中底子的功夫还在你身上——那是你自己的。')
                    + para('<b class="text-amber-300">腰牌没有缴回。</b>另册上记着：牌在人身上，派在心里。')
                    + para('<span class="text-xs text-gray-500">（你成了「' + sect + '·遗徒」。旧山门可以回去看看——废墟上，也许还能起新山门。走散的弟子，日后有机缘重逢。）</span>'));
                log('🥀 ' + sect + '灭了。你是遗徒——俸禄停了，账本封存，腰牌还在你腰上。功夫是你自己的，人也能找回来：旧山门的废墟，随时等你回去。（重立山门，见废墟场景）', 'error');
            }
        } else if (it) {
            it.destroyed = true;
        }
        if (it) it.destroyed = true;
    }

    // ============ 四 · 废墟场景（余烬，永久替换旧山门） ============
    W.sectRuinView = function (sectName) {
        if (!W.sectIsRuined(sectName)) return false;
        var rem = flags()['sect_remnant'];
        var mine = rem && rem.sect === sectName;
        if (mine && !rem.visited) rem.visited = true;
        var ruin = flags()['sect_ruin_' + sectName] || {};
        var html = '<div class="text-left">';
        html += para('🥀 石阶断了半截，幡杆还在，幡没了。');
        html += para('香炉倒在废墟里，里头竟还剩半截没烧完的香——不知是谁走之前，最后上的。');
        html += '<p class="text-xs text-gray-500 mb-2">' + sectName + ' · 遗卷（' + (ruin.day || '?') + '日' + (ruin.path === 'A' ? '，山门为「' + (ruin.foe || '仇家') + '」所破' : ruin.path === 'B' ? '，灵脉枯、人心散' : '，灯自己灭了') + '）</p>';
        var acts = [];
        // 第十七波：自建宗门的另册就是自家宗谱——遗卷走 PSectWorld
        var bookCall = isPSect(sectName)
            ? 'window._closeModal && window._closeModal(); window.PSectWorld && window.PSectWorld.openPSectBook()'
            : 'window._closeModal && window._closeModal(); window.openSectRoster && window.openSectRoster(\'' + sectName + '\')';
        acts.push(btn('📖 翻另册——族谱遗卷：散落的人、下落不明的、殁了的，名字都在', bookCall, 'bg-stone-700 hover:bg-stone-600'));
        if (mine) {
            var rv = flags()['sect_revive'];
            if (rv && rv.sect === sectName) acts.push(btn('🏗️ 重建工地——看工期进度', 'window.openRevivePanel()', 'bg-emerald-800 hover:bg-emerald-700'));
            else acts.push(btn('🌱 起第一锹土——重立山门（三位老相识+灵石五百+这片旧址）', 'window.openRevivePanel()', 'bg-emerald-800 hover:bg-emerald-700'));
        }
        html += btns(acts);
        html += '</div>';
        modal('🥀 ' + sectName + ' · 废墟', html);
        return true;
    };

    // ============ 五 · 复兴线 ============
    function revive() { return flags()['sect_revive'] || null; }
    W.openRevivePanel = function () {
        var rem = flags()['sect_remnant'];
        if (!rem) { msg('你不是遗徒——这锹土轮不到你起。', 'warning'); return; }
        var rv = revive();
        if (!rv) {
            rv = { sect: rem.sect, stage: 'gather', elders: [], day: 0, debt: null };
            flags()['sect_revive'] = rv;
        }
        var html = '<div class="text-left">';
        html += para('🌱 重立「' + rv.sect + '」——三件事，一件不可少。');
        html += '<p class="text-xs text-gray-300 mb-1">一 · <b>三位老相识</b>（' + rv.elders.length + '/3）：另册里还活着的人，一个一个找回来。</p>';
        if (rv.stage === 'gather') {
            var cands = reviveCandidates(rem);
            if (cands.length) {
                html += '<div class="bg-gray-900/60 rounded p-2 mb-2">';
                cands.forEach(function (c) {
                    html += '<div class="flex justify-between items-center py-1 border-b border-gray-700/40">'
                        + '<span class="text-xs text-gray-300">' + c.tag + ' ' + c.name + '</span>'
                        + '<button onclick="window.doReviveElder(\'' + c.id + '\')" class="text-xs bg-amber-800 hover:bg-amber-700 text-white px-2 py-1 rounded">登门</button></div>';
                });
                html += '</div>';
            } else html += '<p class="text-xs text-gray-500 mb-2">散落的人还没寻到——去各城走走，或在集市上留意熟悉的面孔。</p>';
        }
        html += '<p class="text-xs text-gray-300 mb-1">二 · <b>灵石五百</b>重建山门：' + (rv.stage === 'gather' ? (playerStones() >= 500 ? '<span class="text-green-300">你凑得出（行囊' + playerStones() + '）</span>' : '<span class="text-gray-500">行囊' + playerStones() + '——凑不出可向交好的门派借（关系≥50）</span>') : '（已备）') + '</p>';
        if (rv.stage === 'gather' && rv.elders.length >= 3) {
            html += btn('💰 掏自己的五百灵石，起第一锹土', 'window.doRevivePay(false)', 'bg-emerald-800 hover:bg-emerald-700');
            html += btn('📜 向交好的门派借（一年内还清，编年记名；逾期不还，关系-20）', 'window.doRevivePay(true)', 'bg-sky-800 hover:bg-sky-700');
        }
        html += '<p class="text-xs text-gray-300 mb-1">三 · <b>旧址</b>：' + (rem.visited ? '<span class="text-green-300">你已站在废墟上</span>' : '<span class="text-gray-500">回旧山门看看（废墟场景）</span>') + '</p>';
        if (rv.stage === 'building') {
            var left = Math.max(0, rv.day + 30 - absDay());
            var done10 = absDay() >= rv.day + 10, done20 = absDay() >= rv.day + 20;
            html += '<div class="bg-gray-900/60 rounded p-2 mb-2 text-xs text-gray-300">'
                + '🏗️ 工期：还有 <b class="text-amber-300">' + left + '</b> 日开山。'
                + (done10 ? '<br>✓ 第十日·立基：从废墟里挖出了旧匾的残片——镶进新山门的门楣。' : '')
                + (done20 ? '<br>✓ 第二十日·竖幡：新幡上树，还是老名字——' + leaderWord(rv.sect) + '说，名字不用换，人回来了就行。' : '')
                + '</div>';
        }
        if (rv.debt) html += '<p class="text-xs text-amber-300 mb-1">欠「' + rv.debt.sect + '」灵石' + rv.debt.amt + '（' + rv.debt.day + '日借）——还清才算两讫。</p>' + (playerStones() >= rv.debt.amt ? btn('💰 还债', 'window.doRepayDebt()', 'bg-amber-800 hover:bg-amber-700') : '');
        html += '</div>';
        modal('🌱 重立山门 · ' + rv.sect, html);
    };
    function leaderWord(sect) { return leaderName(sect); }
    function reviveCandidates(rem) {
        var out = [];
        var leader = leaderNpc(rem.sect);
        if (leader && !leader.isDead && leader.location !== rem.sect) {
            if (leader._hiddenLeader) out.push({ id: 'sect_leader_' + rem.sect, name: leader.name, tag: '🗡️ 隐世的掌门' });
            else if (leader._exiledWithPlayer) out.push({ id: 'sect_leader_' + rem.sect, name: leader.name, tag: '🏮 随行的掌门' });
            else out.push({ id: 'sect_leader_' + rem.sect, name: leader.name, tag: '🚶 游历的掌门' });
        }
        for (var i = 0; i < (rem.npcs || []).length && out.length < 8; i++) {
            var n = null;
            try { n = W.npcManager.getNPC(rem.npcs[i]); } catch (e) {}
            if (!n || n.isDead) continue;
            var rv = revive();
            if (rv && rv.elders.indexOf(n.id) >= 0) continue;
            if (n._lostDisciple) out.push({ id: n.id, name: n.name, tag: '🧭 走散的亲传' });
            else if (n._defected) continue; // 投敌的，得先在战场上劝回来
            else out.push({ id: n.id, name: n.name, tag: '🧑‍🌾 散落的同门' });
        }
        var rv2 = revive();
        if (rv2) out = out.filter(function (c) { return rv2.elders.indexOf(c.id) < 0; });
        if (leader && !leader.isDead && leader._exiledWithPlayer === undefined && out.length) { /* noop */ }
        return out;
    }
    W.doReviveElder = function (id) {
        var rv = revive();
        if (!rv || rv.stage !== 'gather') { msg('眼下不在这一步。', 'info'); return; }
        if (rv.elders.indexOf(id) >= 0) { msg('他已经答应了。', 'info'); return; }
        var n = null;
        try { n = W.npcManager.getNPC(id); } catch (e) {}
        if (!n || n.isDead) { msg('寻不到人。', 'warning'); return; }
        if (n._hiddenLeader && aff(n) < 40) {
            modal('🗡️ 隐世的人', para('他在江边钓鱼，鱼篓是空的。听完你的来意，他盯着水面看了很久，摇了摇头。')
                + para('「山门是我看着塌的。」他说，「让我再钓会儿鱼。」')
                + para('<span class="text-xs text-gray-500">（他的心结还没解——好感未到，请不动。赠礼、寻访，把交情重新做上来。）</span>'));
            return;
        }
        rv.elders.push(id);
        var line;
        if (n._hiddenLeader) line = '他在江边钓鱼，鱼篓是空的。听完你的来意，他盯着水面看了很久。「我以为，」他说，「这辈子不会再有人叫我掌门了。」他把钓竿收了起来。「我跟你回去。」';
        else if (n._exiledWithPlayer) line = '她只是点头——其实她早就在等了。把怀里抱了一路的祖师牌位，轻轻递到你手上：「拿稳。这回，把它放回大殿正中。」';
        else if (n._lostDisciple) line = '「师父，我就知道你会来。」他搓着手，眼圈红了，「我在码头扛了三个月的包，就等着哪天山门的消息。」';
        else line = '「我等这句话，等了好久。」他把包袱往肩上一甩，「走，回去。」';
        log('🌱 老相识归位（' + rv.elders.length + '/3）：' + line, 'success');
        _close(); W.openRevivePanel();
    };
    W.doRevivePay = function (borrow) {
        var rv = revive();
        if (!rv || rv.stage !== 'gather' || rv.elders.length < 3) { msg('三件里头，人还没凑齐。', 'warning'); return; }
        var rem = flags()['sect_remnant'];
        if (!rem || !rem.visited) { msg('先回旧址看看——起土要在废墟上起。', 'warning'); return; }
        if (!borrow) {
            if (playerStones() < 500) { msg('行囊里凑不出五百灵石。', 'error'); return; }
            try { if (W.inventory && W.inventory.currency) W.inventory.currency.spiritStones = Math.max(0, (Number(W.inventory.currency.spiritStones) || 0) - 500); } catch (eP) {}
        } else {
            var d = dip();
            var lender = null;
            var mine = rv.sect;
            if (d && d[mine]) {
                for (var other in d[mine]) {
                    if (W.sectIsRuined(other)) continue;
                    var r = relOf(mine, other);
                    if (r != null && r >= 50) { lender = other; break; }
                }
            }
            if (!lender) { msg('翻遍旧交情，没有一家关系够到肯借五百的（≥50）——人情薄的时候，连债都借不到。', 'warning'); return; }
            rv.debt = { sect: lender, amt: 500, day: absDay() };
            chron(lender, '借了五百灵石给「' + rv.sect + '」的遗徒重建山门——「算我们入一股香火。」');
        }
        rv.stage = 'building';
        rv.day = absDay();
        chron(rv.sect, '遗徒起土重建——三位老相识归位，第一锹土是在旧山门的废墟上起的。工期三十日。');
        log('🏗️ 第一锹土起在了废墟上。三位老相识站在你身后——' + (borrow ? '「' + rv.debt.sect + '」借的五百灵石压在工钱里（一年内还清，账记在编年）。' : '你的五百灵石压在工钱里。') + '第十日立基，第二十日竖幡，第三十日开山。', 'success');
        _close(); W.openRevivePanel();
    };
    function reviveDayTick() {
        var rv = revive();
        if (!rv || rv.stage !== 'building') return;
        var day = absDay();
        if (day === rv.day + 10 && !rv.marked10) {
            rv.marked10 = true;
            chron(rv.sect, '立基：从废墟里挖出了旧匾的残片——「' + rv.sect + '」三个字只剩一个半。工匠说，镶进新门楣，缺的那半用新石头补。');
            log('🏗️ 第十日·立基：旧匾的残片挖出来了，镶进新山门的门楣——缺的那半，用新石头补。（还有二十日开山）', 'info');
        }
        if (day === rv.day + 20 && !rv.marked20) {
            rv.marked20 = true;
            chron(rv.sect, '竖幡：新幡上树，还是老名字。' + leaderName(rv.sect) + '说：名字不用换——人回来了就行。');
            log('🏗️ 第二十日·竖幡：新幡上了杆。风一吹，展开——这回是全的。（还有十日开山）', 'info');
        }
        if (day >= rv.day + 30 && !rv.marked30) {
            rv.marked30 = true;
            reviveSect(rv);
        }
    }
    function reviveSect(rv) {
        var sect = rv.sect;
        var it = internal(sect);
        var day = absDay();
        var oldRuin = flags()['sect_ruin_' + sect] || {};
        delete flags()['sect_ruin_' + sect];
        flags()['sect_revived_' + sect] = { day: day, ruinedDay: oldRuin.day || 0 };
        if (it) {
            it.destroyed = false;
            it.disciples = 7;
            it.resources = 550; // 五百重建钱折入 + 老相识的贺礼灵石五十
            it.material = (Number(it.material) || 0) + 20;
            it.pill = (Number(it.pill) || 0) + 5;
            it.grain = 30;
            it.morale = 60;
            it.influence = 30;
            it._famineDays = 0;
            it._lowDays = 0;
            it._warMod = 0;
            it._subjugated = false;
        }
        // 老相识的重建贺礼（有名有姓入账）
        chron(sect, '开山：祖师牌位归位，灯重新点上。第一批新弟子入门——山下城里的孩子，共七人。老相识们各带了一份贺礼：灵石五十、材料二十、丹药五炉。');
        // 仇家关系解冻
        if (oldRuin.foe) setRel(sect, oldRuin.foe, -40);
        // 掌门归位（随行归来的掌门主持开山——先记旗再清账）
        var leader = leaderNpc(sect);
        var wasExiled = flags()['sect_exiled_leader'] === sect || !!(leader && leader._exiledWithPlayer);
        if (leader && !leader.isDead) {
            leader._hiddenLeader = false; leader._exiledWithPlayer = false; leader._wandering = false;
            try { leader.location = sect; } catch (e) {}
        }
        if (flags()['sect_exiled_leader'] === sect) delete flags()['sect_exiled_leader'];
        // 玩家复任
        var d = ds();
        var rem = flags()['sect_remnant'];
        if (rem && rv.debt) rem.debt = rv.debt; // 债不随工地清账而消失——挂在遗徒档上，还清才算两讫
        if (d && rem && rem.sect === sect) {
            if (isPSect(sect)) {
                // 第十七波：开创人重立山门——弟子档不动（他是掌门，不是弟子），钱落宗库真账，旧人携旧腰牌归门
                try { if (W.PSectWorld && W.PSectWorld.onRevive) W.PSectWorld.onRevive(sect, rv); } catch (ePR) {}
                rem.revived = day;
                try { if (W.currentCharData) W.currentCharData.fame = Math.min(99999, (W.currentCharData.fame || 0) + 20); } catch (eF2) {}
                modal('🏮 开山', para('香火重新升起来的时候，是你亲手把幡挂回杆顶的。风一吹，展开——这回是全的。')
                    + para('三位老相识站在阶下，腰牌还挂在各自腰上。旧腰牌没有换新——那是纪念品。')
                    + para('<span class="text-xs text-gray-500">（宗门重立：重建的钱与老相识的贺礼尽数入库，声望记「重立山门·首功」，名望+20。座次从残破重新爬起。）</span>'));
                log('🏮 「' + sect + '」回来了——你亲手立的幡，又亲手挂了上去。当年看着它倒的人，如今看着它起来。（名望+20）', 'success');
            } else {
                d.isInSect = true;
                d.sectId = sect;
                d.sectName = sect;
                d.rank = rem._rankSaved != null ? rem._rankSaved : (d._remnantRank != null ? d._remnantRank : 4);
                d.rankName = d._remnantRankName || d.rankName || '长老';
                try { if (typeof W.sectAddContribution === 'function') W.sectAddContribution(100, '重立山门·首功'); } catch (eC) {}
                try { if (W.currentCharData) W.currentCharData.fame = Math.min(99999, (W.currentCharData.fame || 0) + 20); } catch (eF) {}
                rem.revived = day;
                var leaderLine = wasExiled
                    ? '香火重新升起来的时候，' + leaderName(sect) + '把祖师牌位放回大殿正中，转身看着山门下的新弟子。「我们家，倒过一回。」她说，「所以我们比谁都清楚——山，不是门派。人，才是。」'
                    : '香火重新升起来的时候，你亲手把祖师牌位放回了大殿正中。山，不是门派——人，才是。';
                modal('🏮 开山', para(leaderLine)
                    + para('旧腰牌没有换新——' + leaderName(sect) + '说，那是纪念品。（职位复任，贡献+100记「重立山门·首功」，名望+20；欠的账，编年记着）')
                    + para('<span class="text-xs text-gray-500">（门派从「残破」重新起步——座次、香火、分舵，都可以再挣回来。）</span>'));
                log('🏮 「' + sect + '」回来了。当年看过那场火的人，如今还在说这件事。（名望+20，贡献+100）', 'success');
            }
        }
        street('「' + sect + '」回来了——旧山门的废墟上重新竖了幡。当年看过那场火的人，如今逢人就说：「我眼看着它塌的，也眼看着它起来的。」');
        flags()['sect_revive'] = null;
    }
    W.doRepayDebt = function () {
        var rv = revive() || flags()['sect_revive_done_debt'];
        // 复兴完成后债仍挂在 remnant 上
        var rem = flags()['sect_remnant'];
        var debt = (rv && rv.debt) || (rem && rem.debt);
        if (!debt) { msg('不欠账了。', 'info'); return; }
        if (playerStones() < debt.amt) { msg('行囊里凑不出' + debt.amt + '灵石。', 'error'); return; }
        try { if (W.inventory && W.inventory.currency) W.inventory.currency.spiritStones = Math.max(0, (Number(W.inventory.currency.spiritStones) || 0) - debt.amt); } catch (eP2) {}
        try { var di = internal(debt.sect); if (di) di.resources = (Number(di.resources) || 0) + debt.amt; } catch (e) {}
        chron(debt.sect, '「' + debt.sect + '」借给遗徒重建山门的五百灵石，还清了——两讫，情分还在。');
        if (rv) rv.debt = null;
        if (rem) rem.debt = null;
        log('💰 债还清了：五百灵石送回「' + debt.sect + '」——两讫，情分还在。（编年记名）', 'success');
        _close();
    };
    // 债随复兴完成转挂到遗徒档，逾期不还关系掉
    function debtTick() {
        var rv = revive();
        var rem = flags()['sect_remnant'];
        if (rv && rv.stage === 'building' && rv.debt && !rem.debt) { /* 工期中的债留在 revive */ }
        if (!rv && rem && rem.debtPending && !rem.debt) { rem.debt = rem.debtPending; rem.debtPending = null; }
        var debt = rem && rem.debt;
        if (debt && absDay() - debt.day > 360 && !debt.penalized) {
            debt.penalized = true;
            setRel(rem.sect, debt.sect, (relOf(rem.sect, debt.sect) || 0) - 20);
            chron(debt.sect, '借出去的重建钱，一年了还没还上——「' + debt.sect + '」的执事把借条又看了一遍，收进了匣子最底下。（关系-20）');
            log('📜 重建的借款逾期一年未还——「' + debt.sect + '」没催，但关系冷了。（账是真的：关系-20）', 'warning');
        }
    }

    // ============ 六 · 遗徒的日子 ============
    function remnantMonthly() {
        var rem = flags()['sect_remnant'];
        if (!rem || rem.revived) return;
        var day = absDay();
        // 叙旧会：散落同门≥3人在同一城，一月一会
        var city = currentCity();
        if (city) {
            var here = 0;
            for (var i = 0; i < (rem.npcs || []).length; i++) {
                var n = null;
                try { n = W.npcManager.getNPC(rem.npcs[i]); } catch (e) {}
                if (n && !n.isDead && !n._defected && n.location === city) here++;
            }
            if (here >= 3 && rem.reunionCity[city] !== Math.floor(day / 30)) {
                rem.reunionCity[city] = Math.floor(day / 30);
                var pool = here * 5;
                addStones(pool);
                log('🍵 ' + city + '的角落里，你撞见了' + here + '个散落的老同门。没人张罗，桌子自己就拼到了一起——说的都是山上的旧事。散场时大家凑了' + pool + '枚灵石塞给你：「拿着。重立山门，用得上。」（遗徒叙旧会）', 'success');
            }
        }
        // 走散的亲传：名望够，九十日后有机缘重逢
        var fame = 0;
        try { fame = Number((cd() || {}).fame) || 0; } catch (eF) {}
        if (fame >= 30) {
            for (var j = 0; j < (rem.npcs || []).length; j++) {
                var dn = null;
                try { dn = W.npcManager.getNPC(rem.npcs[j]); } catch (e2) {}
                if (!dn || dn.isDead || !dn._lostDisciple) continue;
                if (day - dn._lostDisciple.day < 90) continue;
                if (Math.random() >= 0.3) continue;
                dn._lostDisciple = null;
                var d = ds() || {};
                if (d._myDisciples && d._myDisciples.indexOf(dn.id) < 0) d._myDisciples.push(dn.id);
                modal('🧭 重逢', para('集市上有人拽你的袖子。你回头——是' + dn.name + '，瘦了一圈，眼睛一下子亮了。')
                    + para('「师父！」')
                    + para('<span class="text-xs text-gray-500">（走散的亲传找回来了——师徒名分照旧，族谱「下落不明」那一笔，可以勾掉了。）</span>'));
                log('🧭 走散的「' + dn.name + '」找回来了——师徒名分照旧。（名望高的人，江湖会替他把人送到你面前）', 'success');
                break;
            }
        }
    }
    // 正道讨伐（AI 公敌，后台结算）
    function subjugationMonthly() {
        var day = absDay();
        if (day % 30 !== 0) return;
        var sects = W.SECT_INTERNAL || {};
        for (var sect in sects) {
            if (sect === mySect() || W.sectIsRuined(sect)) continue;
            if (alignOf(sect) > -80) continue;
            if (Math.random() >= 0.1) continue;
            var it = sects[sect];
            if ((Number(it.disciples) || 0) <= 5) continue;
            // 联手：正道前三家的合力
            var allies = [];
            for (var s2 in sects) { if (s2 !== sect && !W.sectIsRuined(s2) && alignOf(s2) >= 40) allies.push(s2); }
            allies.sort(function (x, y) { return powerScore(y) - powerScore(x); });
            var top = allies.slice(0, 3);
            if (!top.length) continue;
            var allianceScore = 0;
            for (var k = 0; k < top.length; k++) allianceScore += powerScore(top[k]);
            allianceScore *= 0.5;
            var targetScore = powerScore(sect) + Math.random() * 30;
            if (allianceScore + Math.random() * 30 <= targetScore) {
                chron(sect, '正道诸家来讨，被打了回去——「' + sect + '」的气焰更盛了三分。');
                continue;
            }
            it.disciples = Math.max(1, (Number(it.disciples) || 0) - 8);
            it.resources = Math.floor((Number(it.resources) || 0) / 2);
            try { if (typeof W.sectPowerWarMod === 'function') W.sectPowerWarMod(sect, false); } catch (e) {}
            chron(sect, '正道诸家联手来讨——山门被围了七日，弟子折了八名，公库折半。讨伐的兵退了，但江湖上都看见了它的败相。');
            for (var m = 0; m < top.length; m++) chron(top[m], '参与了讨伐「' + sect + '」——门下弟子也折了几名，这场仗打得并不轻松。');
            street('正道诸家联手讨伐「' + sect + '」，围山七日——讨伐的兵退了，可谁都看出来：那座山，撑不了太久了。');
            break; // 一月一桩
        }
    }

    // ============ 七 · 钩子与出口 ============
    function dayTick() {
        var day = absDay();
        if (!day) return;
        doomDayTick();
        reviveDayTick();
        pathCTick();
    }
    function monthTick() {
        var day = absDay();
        if (!day || day % 30 !== 0) return;
        doomTriggerCheck();
        pathBCheck();
        subjugationMonthly();
        remnantMonthly();
        debtTick();
    }
    try {
        var hook = function () { try { dayTick(); } catch (e) {} try { monthTick(); } catch (e) {} };
        if (W.EventBus && W.EventBus.on) W.EventBus.on('newDay', hook);
        else if (W.timeSystem && typeof W.timeSystem.onNewDaySubscribe === 'function') W.timeSystem.onNewDaySubscribe(hook);
    } catch (e) {}

    // 战云块（政事面板插块）
    function panelBlock(sect) {
        var dm = doom();
        if (!dm || dm.sect !== sect) return '';
        var left = Math.max(0, dm.strikeDay - absDay());
        var html = '<p class="text-xs font-bold text-red-300 mb-1 mt-2">🔥 战云（破山之战：' + left + '日后）</p>';
        html += '<div class="bg-red-950/40 rounded p-2 mb-2 text-xs text-gray-300 border border-red-900/50">'
            + (dm.subjugate ? '正道诸家联名讨伐（以天道之名）——领头：' + dm.foe : '仇家「' + dm.foe + '」的战帖钉在山门上')
            + (dm.aid ? '<br>🤝 「' + dm.aid + '」已答应来援（三波强度各减一成）' : '')
            + (dm.evacuated ? '<br>🕯️ 老弱已疏散（走散的人会更少）' : '')
            + '<div style="display:flex;flex-direction:column;gap:6px;margin-top:8px">';
        var d = ds() || {};
        var rank = d.rank == null ? 7 : d.rank;
        if (rank <= 2) html += btn('🕊️ 递书求和——公库灵石' + (dm.stage >= 2 ? 500 : 300) + '做赔礼（关系回暖二十，战帖撤下）', 'window.doomBegPeace()', 'bg-sky-800 hover:bg-sky-700');
        if (!dm.evacuated) html += btn('🕯️ 疏散老弱——公库灵石五十送出伤者与年少弟子', 'window.doomEvacuate()', 'bg-emerald-800 hover:bg-emerald-700');
        if (!dm.aid) html += btn('🤝 向盟家求援——交情够硬（关系≥60）的才肯出兵', 'window.doomSeekAid()', 'bg-indigo-800 hover:bg-indigo-700');
        if (dm.subjugate) html += btn('🔥 自焚邪功，向诸家请罪——公库清空、势力折半、立场回暖三十（真忏悔）', 'window.doomAtone()', 'bg-amber-800 hover:bg-amber-700');
        html += '</div></div>';
        return html;
    }
    W.SectDoom = { panelBlock: panelBlock };
    W.sectDoomProbe = function () {
        var rem = flags()['sect_remnant'];
        var rv = revive();
        var ruins = [];
        var f = flags();
        for (var k in f) { if (String(k).indexOf('sect_ruin_') === 0) ruins.push(k.slice(10)); }
        return {
            doom: doom() ? JSON.parse(JSON.stringify(doom())) : null,
            ruins: ruins,
            remnant: rem ? { sect: rem.sect, lost: (rem.lost || []).length, defected: (rem.defected || []).length, visited: !!rem.visited, revived: !!rem.revived } : null,
            revive: rv ? { sect: rv.sect, stage: rv.stage, elders: rv.elders.length, debt: rv.debt ? rv.debt.sect : null } : null
        };
    };
    console.log('[sect-doom] 灭门与复兴已注册：三路毁灭全有前兆与翻盘口/掌门不死三分支/亲传三下场可挽回/遗徒腰牌不缴回/复兴三位老相识+五百灵石+三十日工期/正道讨伐');
})();
