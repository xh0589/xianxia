// ==================== sect-shield-errands.js - 庇护·抚恤·外务·公告栏（改造批·第一梯队+第二梯队） ====================
// 一、庇护撑腰：入派最大的意义是「背后有人」——你在外头真打败了，门里会得到消息：
//     执事出面（宿敌收敛，仇恨压一成），对方若有门派，两门外交关系落账（「你家弟子在外头被人打了」）。
// 二、抚恤葬礼：守山战败，可能有具名同门战死——门里办葬礼、族谱式的编年记殁、抚恤其家（灵石真出库，守恒），
//     若死的是你亲传的弟子，另有一场你的哀恸戏。
// 三、接单外务：门派作为组织从江湖接活（剿魔/镇兽/采办/出使）——门里赚灵石声望（外快是真来路），
//     你赚贡献（走账本）。剿魔镇兽是真仗；采办交货看行囊；出使真改外交关系。
// 四、公告栏整合：外院公告栏一板看全——编年近事/悬赏外务/大比节令/门规，门中信息的缩影。
// 纪律：真仗真账；抚恤出库走守恒；零外文字母零配额句式。
(function () {
    'use strict';
    var W = window;

    function ds() { return W.discipleState || null; }
    function cd() { return W.currentCharData || null; }
    function flags() { return (W.eventFlags = W.eventFlags || {}); }
    function absDay() { try { return W.timeSystem && W.timeSystem.getAbsoluteDay ? (Number(W.timeSystem.getAbsoluteDay()) || 0) : 0; } catch (e) { return 0; } }
    function log(m, t) { try { if (W.gameLog && W.gameLog.add) W.gameLog.add(m); } catch (e) {} }
    function msg(m, t) { if (typeof W.showMessage === 'function') W.showMessage(m, t || 'info'); }
    function modal(t, b) { if (typeof W.showModal === 'function') W.showModal(t, b); }
    function para(t) { return '<p class="text-sm text-gray-300 leading-relaxed mb-2">' + t + '</p>'; }
    function btn(label, onclick, cls) { return '<button onclick="' + onclick + '" class="' + (cls || 'bg-yellow-700 hover:bg-yellow-600') + ' text-xs px-3 py-2 rounded text-left">' + label + '</button>'; }
    function btns(arr) { return '<div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">' + arr.join('') + '</div>'; }
    function _close() { try { var ov = document.getElementById('xianxia-modal-overlay'); if (ov) ov.remove(); } catch (e) {} }
    function mySect() { var d = ds(); return (d && d.isInSect && (d.sectName || d.sectId)) || null; }
    function addC(n, r) { try { if (typeof W.sectAddContribution === 'function') return W.sectAddContribution(n, r); } catch (e) {} var d = ds(); if (d) d.contribution = (Number(d.contribution) || 0) + n; }
    function addStones(n) {
        try { if (W.XianXia && W.XianXia.DataManager && W.XianXia.DataManager.addSpiritStones) { W.XianXia.DataManager.addSpiritStones(n); return; } } catch (e) {}
        if (W.inventory && W.inventory.currency) W.inventory.currency.spiritStones = (Number(W.inventory.currency.spiritStones) || 0) + n;
    }
    function chron(sect, text) { try { if (W.SectGov && W.SectGov.chronicle) W.SectGov.chronicle(sect, text); } catch (e) {} }
    function realmTier() { try { return typeof W.getRealmTier === 'function' ? W.getRealmTier((cd() || {}).realm) : 1; } catch (e) { return 1; } }

    // ============ 一 · 庇护撑腰（app.js 真败北钩子调用） ============
    W.sectShieldOnDefeat = function (battle) {
        var d = ds();
        if (!d || !d.isInSect) return;
        var sect = mySect();
        var last = Number(flags()['sect_shield_last'] || 0);
        if (absDay() - last < 30) return; // 执事不是天天有空——三十日一回，出面才有分量
        flags()['sect_shield_last'] = absDay() || 1;
        var foeName = (battle && battle.enemy && battle.enemy.name) || '外头的对头';
        log('🏯 你被人打伤的消息传回了山门。三日后，门中执事下山「办货」，顺路在你养伤的地方坐了半个时辰——走时留话：「' + sect + '的人，打可以，打死不行。」', 'info');
        // 宿敌收敛：与你有档案的仇家，仇恨压一成（门里的面子得给）
        try {
            var lid = battle && battle.enemy && battle.enemy._linkedNpcId;
            var npc = lid && W.npcManager && W.npcManager.getNPC ? W.npcManager.getNPC(lid) : null;
            if (npc && npc.relationship && typeof npc.changeHatred === 'function') npc.changeHatred(-10);
        } catch (e) {}
        // 对方有门派：两门关系落账
        try {
            var foeSect = battle && battle.enemy && battle.enemy.sect;
            var dip = W.SECT_DIPLOMACY_STATE;
            if (foeSect && foeSect !== sect && dip && dip[sect] && dip[sect][foeSect]) {
                dip[sect][foeSect].relation = Math.max(-100, Math.min(100, (Number(dip[sect][foeSect].relation) || 0) - 8));
                chron(sect, '有弟子在外头被' + foeSect + '的人打伤了——门里记下了这笔账。');
                if (typeof W.saveSectDiplomacy === 'function') W.saveSectDiplomacy();
            }
        } catch (e) {}
    };

    // ============ 二 · 抚恤葬礼（守山战败等场景调用） ============
    W.sectShieldFuneral = function (sect, causeText) {
        try {
            var npcs = (typeof W.getSectNPCs === 'function') ? (W.getSectNPCs(sect) || []) : [];
            var young = npcs.filter(function (n) { return n && n.id && String(n.id).indexOf('sect_disciple_') === 0 && !n.isDead && n.name; });
            if (!young.length) return false;
            var gone = young[Math.floor(Math.random() * young.length)];
            gone.isDead = true;
            // 抚恤出库（守恒：门里真花钱）
            try { if (W.SectGov && W.SectGov.deductStore) W.SectGov.deductStore(sect, 'stone', 30); } catch (e) {}
            chron(sect, gone.name + '殁了——' + (causeText || '山门那一仗') + '。门里办了葬礼，抚恤其家三十灵石。族谱添了一行墨字，墨是新的。');
            // 若是玩家亲传弟子：哀恸戏
            var d = ds();
            if (d && d._myDisciples && d._myDisciples.indexOf(gone.id) >= 0) {
                d._myDisciples = d._myDisciples.filter(function (x) { return x !== gone.id; });
                log('🕯️ ' + gone.name + '没能在这一仗里回来。你是他的师父——葬礼上你站在最前头，替他收了最后一份师门礼。回程的山道上，你走了很久。（亲传弟子战殁，抚恤已发）', 'error');
            } else {
                log('🕯️ 门里办了葬礼——' + gone.name + '殁于' + (causeText || '山门那一仗') + '。灵堂设了三日，抚恤其家。（编年记殁）', 'warning');
            }
            return true;
        } catch (e) { return false; }
    };

    // ============ 三 · 接单外务（悬赏板） ============
    var ERRAND_TYPES = {
        slay: { icon: '⚔️', name: '剿灭魔修' },
        beast: { icon: '🐺', name: '镇压兽患' },
        gather: { icon: '🌿', name: '采办药材' },
        envoy: { icon: '🕊️', name: '出使邻派' }
    };
    function errandStore() {
        var f = flags();
        if (!f['sect_errands']) f['sect_errands'] = { list: [], genDay: 0 };
        return f['sect_errands'];
    }
    var FOES = ['血刀老祖的余孽', '黑风寨的邪修', '白莲教的香主', '独眼修罗'];
    var BEASTS = ['铁背狼群', '赤目蟒', '裂石猿', '夜枭王'];
    var ENVOY_POOL = null;
    function genErrands(sect) {
        var st = errandStore();
        var d = absDay();
        if (st.genDay && d - st.genDay < 15) return st; // 半月一榜
        st.genDay = d;
        st.list = [];
        var tier = Math.max(1, realmTier());
        var kinds = ['slay', 'beast', 'gather', 'envoy'];
        var n = 2 + (d % 2);
        for (var i = 0; i < n; i++) {
            var kind = kinds[(d + i * 3) % kinds.length];
            var e = { id: 'e_' + d + '_' + i, kind: kind, state: 'open' };
            if (kind === 'slay') {
                e.title = '剿灭「' + FOES[(d + i) % FOES.length] + '」';
                e.desc = '官府悬了三个月没敢接的活——门里接了。对方境界不高于你两层。';
                e.reward = { contrib: 80, stones: 50, sectStones: 60 };
            } else if (kind === 'beast') {
                e.title = '镇压' + BEASTS[(d + i) % BEASTS.length];
                e.desc = '山下村落连丢了三头耕牛，里正跪到山门来了。';
                e.reward = { contrib: 60, stones: 30, sectStones: 40 };
            } else if (kind === 'gather') {
                e.title = '采办药材三十份';
                e.desc = '丹药库见底了，药房的方子等米下锅——行囊里凑齐三十份药材来交。';
                e.reward = { contrib: 50, stones: 20, sectMat: 10 };
                e.need = 30;
            } else {
                var target = null;
                try {
                    var names = Object.keys(W.sectsData || {});
                    var others = names.filter(function (x) { return x !== sect; });
                    if (others.length) target = others[(d * 7 + i) % others.length];
                } catch (e2) {}
                if (!target) { e.title = '护送香客上山'; e.desc = '山下香客许了愿，要人护送上后山还愿。'; e.kind = 'gather'; e.need = 0; e.reward = { contrib: 30, stones: 10, sectStones: 10 }; }
                else { e.title = '出使' + target; e.desc = '两门该走动走动了——带一份手信去，替门里递句话。'; e.target = target; e.reward = { contrib: 40, stones: 0, sectStones: 0, rel: 8 }; }
            }
            st.list.push(e);
        }
        chron(sect, '外务榜换了新单——' + st.list.map(function (x) { return x.title; }).join('、') + '。接单的都去议事厅。');
        return st;
    }
    W.openErrandBoard = function () {
        var sect = mySect();
        if (!sect) { msg('还没入门——外务榜不贴给外人。', 'warning'); return; }
        var st = genErrands(sect);
        var html = '<div class="text-left">';
        html += para('外务榜：门派从江湖接的活。干成了，门里赚灵石与脸面，你赚贡献——<b class="text-gray-400">这是门里进项的真来路之一。</b>');
        if (!st.list.length) html += para('榜上空着——活都被人接完了。');
        st.list.forEach(function (e) {
            var t = ERRAND_TYPES[e.kind] || ERRAND_TYPES.slay;
            var rw = '贡献+' + e.reward.contrib + (e.reward.stones ? '，灵石+' + e.reward.stones : '') + (e.reward.sectStones ? '，门库+' + e.reward.sectStones : '') + (e.reward.sectMat ? '，门库材料+' + e.reward.sectMat : '');
            if (e.state === 'done') {
                html += '<div class="flex justify-between items-center bg-gray-800/40 p-2 rounded mb-1"><span class="text-sm text-gray-500">' + t.icon + ' ' + e.title + '</span><span class="text-xs text-green-400">✓ 办成了</span></div>';
                return;
            }
            html += '<div class="bg-gray-800/60 p-2 rounded mb-1">'
                + '<div class="flex justify-between items-center"><span class="text-sm text-gray-200">' + t.icon + ' ' + e.title + '</span>'
                + '<button onclick="window.doSectErrand(\'' + e.id + '\')" class="text-xs bg-amber-700 hover:bg-amber-600 text-white px-3 py-1 rounded">' + (e.state === 'taken' ? '接着办' : '接单') + '</button></div>'
                + '<p class="text-[11px] text-gray-500 mt-1">' + e.desc + '　酬：' + rw + '</p></div>';
        });
        html += '</div>';
        modal('📋 外务榜 · 门里接的活', html);
    };
    function findErrand(id) {
        var st = errandStore();
        for (var i = 0; i < st.list.length; i++) { if (st.list[i].id === id) return st.list[i]; }
        return null;
    }
    W.doSectErrand = function (id) {
        var e = findErrand(id);
        var sect = mySect();
        if (!e || !sect) { msg('查无此单。', 'warning'); return false; }
        if (e.state === 'done') { msg('这单已经办成了。', 'info'); return false; }
        e.state = 'taken';
        if (e.kind === 'slay' || e.kind === 'beast') {
            var c = cd() || {};
            var tier = Math.max(1, realmTier());
            var mul = e.kind === 'beast' ? 0.9 : 1.05;
            var enemy = {
                name: e.kind === 'beast' ? e.title.replace('镇压', '') : e.title.replace('剿灭「', '').replace('」', ''),
                type: e.kind === 'beast' ? 'beast' : 'enemy',
                physiologyType: e.kind === 'beast' ? 'beast' : 'humanoid',
                level: Math.max(1, (typeof W.realmScaledEnemyLevel === 'function' ? W.realmScaledEnemyLevel(c) : tier * 3)),
                attack: Math.round((34 + tier * 6) * mul), defense: Math.round((18 + tier * 4) * mul), speed: Math.round(20 + tier * 2),
                maxDurability: Math.round((100 + tier * 16) * mul), durabilities: { chest: Math.round((100 + tier * 16) * mul) },
                combatAbilities: [], sect: sect,
                description: e.desc
            };
            var b = W.startBattle && W.startBattle(enemy);
            if (b) { b._isSectErrandBattle = true; b._errandId = id; }
            _close();
            log('📋 你接了「' + e.title + '」——门里的活，办砸了要挨板子，办成了榜上有名。（真仗）', 'danger');
            return true;
        }
        if (e.kind === 'gather') {
            _close();
            if (e.need > 0) {
                var have = 0;
                try {
                    var inv = W.inventory;
                    if (inv && inv.slots) for (var i = 0; i < inv.slots.length; i++) {
                        var s = inv.slots[i];
                        if (!s || !(s.count > 0)) continue;
                        var t = (s.getTemplate && s.getTemplate()) || (W.itemById && W.itemById[s.templateId]);
                        if (t && (t.subtype === 'herb' || t.subtype === 'ore')) have += s.count;
                    }
                } catch (e3) {}
                if (have < e.need) { msg('行囊里的药材矿石凑不够' + e.need + '份（现有' + have + '）——先去采，采够了来交。', 'warning'); return false; }
                var rem = e.need;
                try {
                    var inv2 = W.inventory;
                    for (var j = 0; j < inv2.slots.length && rem > 0; j++) {
                        var s2 = inv2.slots[j];
                        if (!s2 || !(s2.count > 0)) continue;
                        var t2 = (s2.getTemplate && s2.getTemplate()) || (W.itemById && W.itemById[s2.templateId]);
                        if (t2 && (t2.subtype === 'herb' || t2.subtype === 'ore')) { var take = Math.min(s2.count, rem); s2.count -= take; rem -= take; if (s2.count <= 0) inv2.slots[j] = null; }
                    }
                    if (typeof W.updateInventoryUI === 'function') W.updateInventoryUI();
                } catch (e4) {}
            } else {
                try { if (W.timeSystem && W.timeSystem.advanceTime) W.timeSystem.advanceTime(120, '护送香客'); } catch (e5) {}
            }
            W.settleSectErrand(true, id);
            return true;
        }
        // envoy 出使
        _close();
        try { if (W.timeSystem && W.timeSystem.advanceTime) W.timeSystem.advanceTime(240, '出使' + (e.target || '邻派')); } catch (e6) {}
        W.settleSectErrand(true, id);
        return true;
    };
    // 战后结算（app.js _isSectErrandBattle 分支）；非战斗单直接调用
    W.settleSectErrand = function (win, idOverride) {
        var b = W.currentBattle || {};
        var id = idOverride || b._errandId;
        var e = findErrand(id);
        if (!e) return;
        if (!win) {
            log('💧 「' + e.title + '」没办成——单子还在榜上，养好了伤再去。门里不罚败事的人，只罚撂挑子的人。（可再战）', 'info');
            return;
        }
        var sect = mySect();
        e.state = 'done';
        addC(e.reward.contrib, '外务·' + e.title);
        if (e.reward.stones) addStones(e.reward.stones);
        try { if (typeof W.sectPassiveTrain === 'function') W.sectPassiveTrain('battle'); } catch (e7) {}
        var govOk = false;
        try {
            if (W.SectGov && W.SectGov.internalRef) {
                var it = W.SectGov.internalRef(sect);
                if (it) {
                    if (e.reward.sectStones) it.resources = (Number(it.resources) || 0) + e.reward.sectStones;
                    if (e.reward.sectMat) it.material = (Number(it.material) || 0) + e.reward.sectMat;
                    govOk = true;
                }
            }
        } catch (e8) {}
        if (e.reward.rel && e.target) {
            try {
                var dip = W.SECT_DIPLOMACY_STATE;
                if (dip && dip[sect] && dip[sect][e.target]) {
                    dip[sect][e.target].relation = Math.min(100, (Number(dip[sect][e.target].relation) || 0) + e.reward.rel);
                    if (typeof W.saveSectDiplomacy === 'function') W.saveSectDiplomacy();
                }
            } catch (e9) {}
        }
        // 香火：斩邪/镇兽是办在城里的实事——脚下这座城的护持跟着抬（sect-cities）
        try {
            if ((e.kind === 'slay' || e.kind === 'beast') && W.SectCities && typeof W.sectCityDeed === 'function') {
                var cc = '';
                try { cc = (typeof W.getCurrentCityName === 'function' && W.getCurrentCityName()) || (W.locationSystem && W.locationSystem.currentLocation) || ''; } catch (eC0) {}
                if (cc) W.sectCityDeed(cc, 5);
            }
        } catch (eC1) {}
        // 立场：替天行道的外务给门派攒名声（斩邪+2，出使+1）
        try {
            if (typeof W.sectAlignShift === 'function' && sect) {
                if (e.kind === 'slay' || e.kind === 'beast') W.sectAlignShift(sect, 2, e.title);
                else if (e.kind === 'envoy') W.sectAlignShift(sect, 1, e.title);
            }
        } catch (eA) {}
        chron(sect, '「' + e.title + '」办成了——外头的人都看着：' + sect + '接的活，有人办得下来。');
        var line = '📋 「' + e.title + '」办成了。榜上勾了你的名字。（贡献+' + e.reward.contrib + (e.reward.stones ? '，灵石+' + e.reward.stones : '') + (govOk && e.reward.sectStones ? '，门库进项+' + e.reward.sectStones : '') + '）';
        log(line, 'success'); msg(line, 'success');
    };

    // ============ 四 · 公告栏（外院一板看全门中信息） ============
    W.openSectBulletinRoom = function () {
        var sect = mySect();
        if (!sect) { msg('还没入门。', 'warning'); return; }
        var html = '<div class="text-left">';
        // 编年近事
        var chronLines = [];
        try {
            var it = W.SectGov && W.SectGov.internalRef ? W.SectGov.internalRef(sect) : null;
            if (it && it.chronicle) chronLines = it.chronicle.slice(-4).reverse();
        } catch (e) {}
        html += '<p class="text-xs font-bold text-amber-200 mb-1">📜 门中近事</p>';
        html += chronLines.length ? chronLines.map(function (c) { return '<p class="text-xs text-gray-400 py-1 border-b border-gray-700/40">第' + c.day + '日 · ' + c.text + '</p>'; }).join('') : '<p class="text-xs text-gray-500">近来无事。</p>';
        // 外务榜摘要
        var st = genErrands(sect);
        var openN = st.list.filter(function (x) { return x.state !== 'done'; }).length;
        html += '<p class="text-xs font-bold text-amber-200 mt-2 mb-1">📋 外务榜</p><p class="text-xs text-gray-400">榜上还有 ' + openN + ' 单没人办成。<button onclick="window._closeModal(); window.openErrandBoard()" class="ml-2 text-xs text-amber-300 underline">去看榜</button></p>';
        // 大比节令
        try {
            var day = absDay();
            var nextSeason = (Math.floor(day / 90) + 1) * 90;
            var nextYear = (Math.floor(day / 360) + 1) * 360;
            html += '<p class="text-xs font-bold text-amber-200 mt-2 mb-1">🏆 节令</p><p class="text-xs text-gray-400">下回小比：第' + nextSeason + '日；年一大比：第' + nextYear + '日。</p>';
        } catch (e2) {}
        // 门规
        html += '<p class="text-xs font-bold text-amber-200 mt-2 mb-1">⚖️ 门规摘条</p><p class="text-xs text-gray-500">「不得私传门中功法；不得残害同门；在外行事，勿坠门风。」——戒律院每月看一回账。</p>';
        html += '</div>';
        modal('📋 ' + sect + ' · 公告栏', html);
    };

    // ============ 日钩：外务榜到期不刷（半月一榜在 genErrands 内部控制） ============
    W.sectErrandProbe = function () { return JSON.parse(JSON.stringify(errandStore())); };

    console.log('[sect-shield-errands] 已注册：庇护撑腰（败北执事出面+外交落账）/ 抚恤葬礼（同门战殁真出库）/ 外务榜四单（剿魔镇兽真仗、采办交货、出使改关系）/ 公告栏一板看全');
})();
