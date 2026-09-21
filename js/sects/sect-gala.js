// ==================== sect-gala.js - 盛会·广邀江湖（方案四B） ====================
// 开山大典是对内祭祖论功；盛会是对外——广邀江湖，摆的是席面，争的是脸面。
// 来贺读真账：外交关系≥30的门派才动身，立场联动（正道的盛会邪派不来，邪派的鬼宴正道不去）；
// 贺礼逐家入公库（守恒），来的人少了就是翻车——席面摆了没人来，立场照样掉。
// 盛会当天玩家三件真事：比武夺彩（三场连打真仗）/论道（读书功底+增益）/拍卖（门派库存折现的出口+玩家寄卖）。
// 场地有讲究：只能在自家山门或自家护持城——在哪摆席，本身就是脸面（护持城办会，稳固+10）。
(function () {
    'use strict';
    var W = window;

    function ds() { return W.discipleState || null; }
    function cd() { return W.currentCharData || null; }
    function flags() { return (W.eventFlags = W.eventFlags || {}); }
    // 第九波·总账根治：timeSystem.totalDays 在生产里根本不存在，旧钟恒 0——盛会排期/AI 办会全是死代码。
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
    // 第十七波：自建宗门的掌门也是「自家办会」——家门认两处
    function builtSect() { try { return (W.PSectWorld && typeof W.PSectWorld.homeName === 'function') ? W.PSectWorld.homeName() : null; } catch (e) { return null; } }
    function playerName() { try { return (cd() || {}).name || '无名弟子'; } catch (e) { return '无名弟子'; } }
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
    function realmTier() { try { return Math.max(1, typeof W.getRealmTier === 'function' ? W.getRealmTier((cd() || {}).realm) : 1); } catch (e) { return 1; } }
    function addC(n, r) { try { if (typeof W.sectAddContribution === 'function') return W.sectAddContribution(n, r); } catch (e) {} var d = ds(); if (d) d.contribution = (Number(d.contribution) || 0) + n; }

    function sched() {
        var f = flags();
        if (!f['sect_gala_sched']) f['sect_gala_sched'] = {};
        return f['sect_gala_sched'];
    }
    function yearKey(sect) { return 'sect_gala_year_' + sect; }
    function yearOf() { return Math.floor(absDay() / 360); }

    // 场地：自家护持城里稳固最高的那座，没有就山门
    function pickVenue(sect) {
        try {
            if (typeof W.sectCityPatrons === 'function') {
                var held = W.sectCityPatrons(sect) || [];
                var best = null;
                for (var i = 0; i < held.length; i++) { if (!best || held[i].hold > best.hold) best = held[i]; }
                if (best) return best.city;
            }
        } catch (e) {}
        return sect + '山门';
    }
    // 来贺名单：有外交档案的读真账（关系≥30才动身）；全江湖都没跟它打过交道的门派，按类型常理推半席
    function attendance(sect) {
        var host = alignOf(sect);
        var dip = W.SECT_DIPLOMACY_STATE || {};
        var row = dip[sect] || null;
        var comers = [];
        var all = W.sectsData || {};
        var ht = (all[sect] || {}).type;
        for (var other in all) {
            if (other === sect) continue;
            var ga = alignOf(other);
            var gt = (all[other] || {}).type;
            if (host >= 40 && ga <= -40) continue;   // 正道的盛会，不请江湖目之为邪的
            if (host <= -40 && ga >= 40) continue;   // 邪派的鬼宴，正道的不来
            var rel;
            if (row) {
                // 有档案：只认真账——没打过交道的不腆着脸来
                var cell = row[other];
                rel = cell ? (Number(cell.relation) || 0) : -99;
            } else {
                // 没档案的门派（AI 之间）：按类型常理推，同类肯来，正邪对面不来
                rel = ht === gt ? 40 : (ht === '中立' || gt === '中立' ? 20 : -10);
            }
            if (rel >= 30) comers.push(other);
            if (comers.length >= 12) break;
        }
        return comers;
    }

    // ============ 一 · 排期（进言「办盛会」由治理决策调度，AI 门派自己也会办） ============
    function schedule(sect, byName) {
        if (flags()[yearKey(sect)] === yearOf()) return false;
        var venue = pickVenue(sect);
        sched()[sect] = { day: absDay() + 15, venue: venue, by: byName || null };
        flags()[yearKey(sect)] = yearOf();
        chron(sect, '掌门发了英雄帖——半月后在' + venue + '大摆盛会，广邀江湖。请帖一发出，各家的回帖就往山上飞。');
        if (sect === mySect() || sect === builtSect()) log('🎪 门里要办盛会了！半月后，' + venue + '。英雄帖发往各派——来几家，看的是平日的交情与门派的体面。（当天你在山上，三件真事等着你：夺彩/论道/拍卖）', 'success');
        return true;
    }
    function aiScheduleMonthly() {
        var day = absDay();
        if (day % 30 !== 0) return;
        var sects = W.SECT_INTERNAL || {};
        for (var sect in sects) {
            if (sect === mySect()) continue; // 玩家门派走进言，不被代办
            if (isPSect(sect)) continue; // 第九波：玩家自建宗门的库银，AI 也不代花
            if (flags()[yearKey(sect)] === yearOf()) continue;
            if (tierRankOf(sect) > 2) continue;
            var it = sects[sect];
            if ((Number(it.resources) || 0) < 200 || (Number(it.material) || 0) < 30) continue;
            if (Math.random() >= 0.05) continue;
            it.resources -= 200; it.material -= 30;
            schedule(sect, null);
        }
    }

    // ============ 二 · 开席结算 ============
    function resolve(sect) {
        var s = sched()[sect];
        if (!s) return;
        delete sched()[sect];
        var it = internal(sect);
        if (!it) return;
        var comers = attendance(sect);
        var home = sect === mySect() || sect === builtSect();
        if (comers.length < 3) {
            // 翻车：席面摆了，人没来
            chron(sect, '盛会的席面摆了三十桌，来的不到三家——' + leaderWord(sect) + '在门口站了半个时辰，脸上的笑没挂住。（脸面丢了：立场受损）');
            try { if (typeof W.sectAlignShift === 'function') W.sectAlignShift(sect, -2, '盛会冷落'); } catch (e) {}
            if (home) {
                street('茶棚里有人憋着笑：「听说' + sect + '的盛会，席面摆了三十桌，来的客人一只手数得过来。」');
                log('🎪 盛会翻了车——来的不到三家。席面照摆，酒照温，可门口冷清得能听见风。掌门站在门口迎了半个时辰客人，脸上的笑没挂住。（立场-2，成本打了水漂）', 'error');
            }
            return;
        }
        // 贺礼入公库（守恒：来几家，送几份）
        var gifts = comers.length * 20;
        it.resources = (Number(it.resources) || 0) + gifts;
        it.influence = (Number(it.influence) || 0) + comers.length * 2;
        var shown = comers.slice(0, 5).map(function (c) { return '「' + c + '」'; }).join('、');
        chron(sect, '盛会在' + s.venue + '开席——' + comers.length + '家门派来贺' + (comers.length > 5 ? '（' + shown + '等）' : '（' + shown + '）') + '，贺仪灵石' + gifts + '入公库，门中影响力大涨。');
        try { if (typeof W.sectAlignShift === 'function') W.sectAlignShift(sect, 3, '盛会体面'); } catch (e2) {}
        // 在护持城办会：城里的香火也旺
        try {
            if (typeof W.sectCityDeed === 'function' && s.venue !== sect + '山门') W.sectCityDeed(s.venue, 10, sect);
        } catch (e3) {}
        if (comers.length >= 8) street('江湖盛事：' + sect + '在' + s.venue + '大摆盛会，' + comers.length + '家门派的车马把城门都堵了半日——茶博士说，多少年没见过这样的排场。');
        if (home) {
            log('🎪 盛会开席！' + comers.length + '家门派来贺，贺仪灵石' + gifts + '尽入公库，影响力大涨。（立场+3，' + (s.venue !== sect + '山门' ? s.venue + '的香火也旺了' : '山门热闹了一整日') + '）', 'success');
            openGalaPanel(sect, s.venue);
        }
    }
    function leaderWord(sect) { try { if (W.SECT_LEADER_NAMES && W.SECT_LEADER_NAMES[sect]) return W.SECT_LEADER_NAMES[sect]; } catch (e) {} return '掌门'; }
    function dayTick() {
        var day = absDay();
        if (!day) return;
        var sc = sched();
        for (var sect in sc) {
            if (day >= sc[sect].day) resolve(sect);
        }
        aiScheduleMonthly();
    }
    try {
        if (W.EventBus && W.EventBus.on) W.EventBus.on('newDay', function () { try { dayTick(); } catch (e) {} });
        else if (W.timeSystem && typeof W.timeSystem.onNewDaySubscribe === 'function') W.timeSystem.onNewDaySubscribe(function () { try { dayTick(); } catch (e) {} });
    } catch (e) {}

    // ============ 三 · 盛会当天（玩家三件真事） ============
    function galaDayFlag() { return 'sect_gala_day_' + absDay(); }
    function openGalaPanel(sect, venue) {
        var f = flags();
        var artsDone = !!f[galaDayFlag() + '_arts'];
        var talkDone = !!f[galaDayFlag() + '_talk'];
        var aucDone = !!f[galaDayFlag() + '_auc'];
        var html = '<div class="text-left">';
        html += para('🎪 ' + venue + '，盛会开席。' + sect + '的幡挂满了街，各家门派的贺礼在礼房堆成小山。流水席从山门摆到街口——今天，江湖都看着这里。');
        var acts = [];
        acts.push(btn(artsDone ? '⚔️ 比武夺彩——你已经下过场了' : '⚔️ 比武夺彩——三家客座年青高手连打三场（真仗，全胜名望+10贡献+100）', 'window.doGalaArts()', artsDone ? 'bg-gray-700' : 'bg-red-800 hover:bg-red-700'));
        acts.push(btn(talkDone ? '📜 论道——你已听过这一场' : '📜 论道——各派长老同台讲法，听一场胜读十年书（读书功底+神识增益一日）', 'window.doGalaTalk()', talkDone ? 'bg-gray-700' : 'bg-sky-800 hover:bg-sky-700'));
        acts.push(btn(aucDone ? '🏺 拍卖——今日已开过槌' : '🏺 拍卖——门派库存折现的出口，你的行囊也可寄卖', 'window.doGalaAuction()', aucDone ? 'bg-gray-700' : 'bg-amber-800 hover:bg-amber-700'));
        html += btns(acts);
        html += '</div>';
        modal('🎪 ' + sect + ' · 盛会', html);
    }
    W.openGalaPanel = function (sect, venue) { var hs = sect || mySect() || builtSect(); openGalaPanel(hs, venue || (hs + '山门')); };
    // 比武夺彩：三场连打（模式同试炼连仗）
    function galaEnemy(round) {
        var c = cd() || {};
        var tier = realmTier();
        var mul = [1.0, 1.1, 1.25][round - 1] || 1.25;
        var seats = ['东席', '西席', '主桌'];
        return {
            name: '盛会·' + seats[round - 1] + '夺彩客（第' + round + '场）', type: 'enemy', physiologyType: 'humanoid',
            level: Math.max(1, (typeof W.realmScaledEnemyLevel === 'function' ? W.realmScaledEnemyLevel(c) : tier * 3)),
            attack: Math.round((30 + tier * 6) * mul), defense: Math.round((15 + tier * 4) * mul), speed: Math.round(17 + tier * 2),
            maxDurability: Math.round((92 + tier * 15) * mul), durabilities: { chest: Math.round((92 + tier * 15) * mul) },
            combatAbilities: [],
            description: '盛会上打擂的客座年青高手——台下面坐着的，是各家掌门。'
        };
    }
    W.doGalaArts = function () {
        var f = flags();
        if (f[galaDayFlag() + '_arts']) { msg('你已经下过场了。', 'info'); return; }
        if (typeof W.startBattle !== 'function') { msg('擂台还没搭好。', 'error'); return; }
        var b = W.startBattle(galaEnemy(1));
        if (b) { b._isGalaBattle = true; b._galaRound = 1; b._galaDay = absDay(); }
        _close();
        log('⚔️ 你上了夺彩的擂台——第一场，东席的客座高手拱手：「点到为止。」台下各家掌门都看着。（三场连打，真仗）', 'danger');
    };
    W.settleGalaArts = function (win) {
        var b = W.currentBattle || {};
        var round = b._galaRound;
        var gday = b._galaDay;
        if (!round) return;
        var fkey = 'sect_gala_day_' + gday + '_arts';
        if (!win) {
            // 第一百零九波：输了也落当日的旗——此前败北不记账，当天可以无限重开三场连打，
            // 一直打到三连胜保底拿奖。「点到为止不罚」说的是不扣东西，不是擂台可以无限重上。
            flags()[fkey] = absDay();
            log('💧 你被请下了擂台——胜败乃兵家常事，台下的掌门们微微颔首：年青人敢下场，就值得一杯酒。（点到为止，不罚；今日的擂台你已经下过场了）', 'info');
            return;
        }
        if (round < 3) {
            log('⚔️ 第' + round + '场胜！台下喝彩声里，第' + (round + 1) + '场的对手已经跃上了台。', 'warning');
            var b2 = W.startBattle(galaEnemy(round + 1));
            if (b2) { b2._isGalaBattle = true; b2._galaRound = round + 1; b2._galaDay = gday; }
            return;
        }
        // 三场全胜：夺彩
        flags()[fkey] = absDay();
        var sect = mySect() || builtSect();
        if (isPSect(sect)) {
            // 第十七波：自建宗门没有弟子贡献账——夺彩的脸面落宗门声望真账
            try { if (W.PSectWorld) W.PSectWorld.gainRep(sect, 3, '盛会夺彩·三战三捷'); } catch (eG) {}
        } else {
            addC(100, '盛会夺彩·三战三捷');
        }
        try { if (W.currentCharData) W.currentCharData.fame = Math.min(99999, (W.currentCharData.fame || 0) + 10); } catch (e) {}
        var it = sect && internal(sect);
        if (it && !isPSect(sect)) it.influence = (Number(it.influence) || 0) + 5;
        if (sect) chron(sect, '盛会的夺彩台上，' + playerName() + '三战三捷——各家掌门亲自斟酒，这一日满江湖都在说这个名字。（影响力+5）');
        street('盛会夺彩台上杀出一匹黑马——「' + playerName() + '」三战三捷，各家掌门争着递名帖。茶博士把这一段编进了书里。');
        log('🏆 三场全胜，夺彩！主桌上的掌门起身为你斟酒：「好！」——名望+10，贡献+100，本门影响力+5，编年记名，你的名号今日满江湖。', 'success');
    };
    W.doGalaTalk = function () {
        var f = flags();
        if (f[galaDayFlag() + '_talk']) { msg('论道一场已听过——贪多嚼不烂。', 'info'); return; }
        f[galaDayFlag() + '_talk'] = absDay();
        try { if (typeof W.sectPassiveTrain === 'function') W.sectPassiveTrain('study'); } catch (e) {}
        try { if (typeof W.applyBuff === 'function') W.applyBuff('fxb_gala_talk', { intelligence: 3 }, 24); } catch (e2) {}
        _close();
        log('📜 论道台上，各派长老轮番讲法——有讲剑意的，有讲丹火的，有讲「放下」的。你听了整整一场，散席时只觉得脑子里亮堂。（读书功底长进，神识增益一日）', 'success');
    };
    W.doGalaAuction = function () {
        var f = flags();
        if (f[galaDayFlag() + '_auc']) { msg('今日的槌已经落过了。', 'info'); return; }
        var sect = mySect() || builtSect();
        var it = sect && internal(sect);
        var html = '<div class="text-left">';
        html += para('🏺 拍卖场设在偏厅——盛会人多手杂，各家都乐意把压箱底的东西拿出来换灵石。槌一起，价就走。');
        // 门派库存折现（公库的出口）
        if (it) {
            var pillN = Math.min(5, Number(it.pill) || 0);
            var matN = Math.min(20, Number(it.material) || 0);
            var gain = pillN * 5 + matN;
            html += '<p class="text-xs text-gray-300 mb-1">公库寄卖：丹药' + pillN + '炉 + 材料' + matN + '份 → 折灵石 <b class="text-green-300">' + gain + '</b> 入公库</p>';
            if (gain > 0) html += btn('🏺 公库上拍（库存折现，来路去向都入账）', 'window.doGalaSellStore()', 'bg-emerald-800 hover:bg-emerald-700');
        }
        // 玩家寄卖（行囊前六样，半价）
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
        } catch (e3) {}
        if (items.length) {
            html += '<p class="text-xs font-bold text-amber-200 mt-2 mb-1">你的行囊寄卖（盛会行情，半价成交）</p>';
            items.forEach(function (x) {
                html += '<div class="flex justify-between items-center bg-gray-800/60 p-2 rounded mb-1">'
                    + '<span class="text-sm text-gray-200">' + x.name + ' <span class="text-xs text-gray-500">值' + x.price + '，拍得' + Math.ceil(x.price / 2) + '</span></span>'
                    + '<button onclick="window.doGalaSell(\'' + x.id + '\')" class="text-xs bg-amber-700 hover:bg-amber-600 text-white px-1.5 py-1 rounded">上拍</button></div>';
            });
        }
        html += '</div>';
        modal('🏺 盛会 · 拍卖场', html);
    };
    W.doGalaSellStore = function () {
        var f = flags();
        if (f[galaDayFlag() + '_auc']) { msg('今日的槌已经落过了。', 'info'); return; }
        f[galaDayFlag() + '_auc'] = absDay();
        var sect = mySect() || builtSect();
        var it = sect && internal(sect);
        if (!it) return;
        var pillN = Math.min(5, Number(it.pill) || 0);
        var matN = Math.min(20, Number(it.material) || 0);
        var gain = pillN * 5 + matN;
        it.pill = (Number(it.pill) || 0) - pillN;
        it.material = (Number(it.material) || 0) - matN;
        it.resources = (Number(it.resources) || 0) + gain;
        chron(sect, '盛会拍卖场：公库的丹药' + pillN + '炉、材料' + matN + '份上了拍——槌落，灵石' + gain + '入库。（库存折现，账两头清）');
        _close();
        log('🏺 公库的存货拍出去了：丹药' + pillN + '炉、材料' + matN + '份，折灵石' + gain + '入公库。管库的执事笑得见牙不见眼——压箱底的东西，终于变成了活钱。', 'success');
    };
    W.doGalaSell = function (itemId) {
        var f = flags();
        if (f[galaDayFlag() + '_sell_' + itemId]) { msg('这件已经拍掉了。', 'info'); return; }
        var price = 5;
        try {
            var t = (W.itemById && W.itemById[itemId]) || null;
            if (!t) {
                var inv = W.inventory;
                if (inv && inv.slots) { for (var i = 0; i < inv.slots.length; i++) { var s = inv.slots[i]; if (s && s.templateId === itemId && s.count > 0) { var tt = s.getTemplate && s.getTemplate(); if (tt) { t = tt; break; } } } }
            }
            if (t) price = Number(t.price) || 5;
        } catch (e) {}
        var got = false;
        try { got = (typeof W.consumeItem === 'function') ? W.consumeItem(itemId, 1) : false; } catch (e2) {}
        if (!got) { msg('行囊里没这件东西了。', 'warning'); return; }
        f[galaDayFlag() + '_sell_' + itemId] = absDay();
        var half = Math.ceil(price / 2);
        try {
            if (W.XianXia && W.XianXia.DataManager && W.XianXia.DataManager.addSpiritStones) W.XianXia.DataManager.addSpiritStones(half);
            else if (W.inventory && W.inventory.currency) W.inventory.currency.spiritStones = (Number(W.inventory.currency.spiritStones) || 0) + half;
        } catch (e3) {}
        _close();
        log('🏺 槌落——你那件东西拍了' + half + '灵石。盛会行情，比平日里好出手。（灵石+' + half + '）', 'success');
    };

    // ============ 四 · 政事面板插块 ============
    function panelBlock(sect) {
        var sc = sched()[sect];
        if (!sc) return '';
        var left = Math.max(0, sc.day - absDay());
        var html = '<p class="text-xs font-bold text-amber-200 mb-1 mt-2">🎪 盛会</p>';
        html += '<div class="bg-gray-900/60 rounded p-2 mb-2 text-xs text-gray-300">英雄帖已发——<b>' + left + '</b> 日后在 <b class="text-amber-300">' + sc.venue + '</b> 开席' + (sc.by ? '（此议出自' + sc.by + '的进言）' : '') + '。来几家，看平日交情与门派体面。</div>';
        return html;
    }

    // 进言「办盛会」（挂进治理决策，走既有进言/采纳流程）
    W.SectGala = {
        panelBlock: panelBlock,
        // 第十七波：自建宗门主办盛会——AI 不代花库银，掌门亲手摆席（钱从宗库真账走，镜像先扣后落）
        hostFor: function (sectName) {
            if (!isPSect(sectName)) return { ok: false, reason: 'not-ps' };
            var it = internal(sectName);
            if (!it) return { ok: false, reason: 'no-mirror', text: '户部账上还没这一门——先在江湖上把名号立稳。' };
            if (flags()[yearKey(sectName)] === yearOf()) return { ok: false, reason: 'year-done', text: '今年已经摆过一场席了——江湖的席面，一年一回才金贵。' };
            if (sched()[sectName]) return { ok: false, reason: 'sched', text: '英雄帖已经发出去了——半月内开席，等着待客吧。' };
            var real = 0;
            try { real = (W.PSectWorld && W.PSectWorld.realStones) ? W.PSectWorld.realStones(sectName) : 0; } catch (e) {}
            if (real < 260) return { ok: false, reason: 'no-stones', text: '席面请帖折灵石二百六十（没有材料库，以钱代料城里置办）——宗库现有 ' + real + '，不凑手。' };
            it.resources = (Number(it.resources) || 0) - 260;
            schedule(sectName, playerName() + ' 亲自主持');
            return { ok: true };
        },
        decision: {
            id: 'gala', name: '办盛会',
            when: function (it, sect) {
                if (flags()[yearKey(sect)] === yearOf()) return false;
                if (sched()[sect]) return false;
                if (tierRankOf(sect) > 2) return false;
                return (Number(it.resources) || 0) >= 200 && (Number(it.material) || 0) >= 30;
            },
            run: function (it, sect) {
                it.resources -= 200; it.material -= 30;
                schedule(sect, null);
                return '盛会办起来了：灵石二百、材料三十置办席面请帖，半月后开席——江湖都看着这场的体面。';
            }
        },
        probe: function () {
            var out = { sched: {}, years: {} };
            var sc = sched();
            for (var s in sc) out.sched[s] = { day: sc[s].day, venue: sc[s].venue };
            var f = flags();
            for (var k in f) { if (String(k).indexOf('sect_gala_year_') === 0) out.years[k.slice(15)] = f[k]; }
            return out;
        }
    };
    // 把「办盛会」挂进治理进言（走既有进言/采纳流程，不另立门户）
    try { if (W.SectGov && typeof W.SectGov.addDecision === 'function') W.SectGov.addDecision(W.SectGala.decision); } catch (eReg) {}
    console.log('[sect-gala] 盛会已注册：进言排期（半月后开席）/来贺读外交真账（立场相斥不来）/贺礼逐家入公库/翻车掉立场/当天三件真事（夺彩三连仗·论道·拍卖库存折现）/护持城办会香火+10/AI门派也会办');
})();
