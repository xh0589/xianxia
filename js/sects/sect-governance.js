// ==================== sect-governance.js - 活门派：库存、政事、管理者自治（补厚批六） ====================
// 病根：门派只有一个抽象的 resources 数字在日结里悄悄涨落——没有粮、没有铁、没有丹药，
//       掌门长老是背景板，从不用库存做任何事；玩家看不见家底，也插不上手。
// 本批把门派做成一个「会过日子的家」：
//   一、多类库存——灵石（沿用 resources 旧账，不另立双账）+ 灵谷 + 材料 + 丹药；
//       产出看门派营生（药谷产药、剑庄产铁），消耗看人头（弟子要吃饭）；
//       断粮有真后果：士气掉、弟子连夜走人、俸禄减半（世界咬到玩家身上）。
//   二、管理者自治——掌门与长老每日按「缺什么补什么」自己决策（籴粮/招徒/大典/铸器/炼丹/修阵/送礼/历练/讲经/售余/大比加码），
//       花的是真库存，落的是真效果，每一笔进「门中政事」编年；自家门派的事会通知到玩家眼前。
//   三、玩家参与——捐献（灵石药材进库存，贡献进账本）、进言（内门以上花贡献指定门派下一步棋，采纳落编年、库不足退回）、
//       支取（长老以上从库里领材料/丹药，花贡献记账）。
//   四、联动——战争胜负动兵器库与护山大阵（批五）；修山大阵减免危机损失；外交送礼真改关系（批五因果）。
// 纪律：单一真源（灵石=resources）；新字段挂 SECT_INTERNAL 随既有 StateRegistry 存档；编年只记最近四十条；
//       玩家文本零外文字母、零配额句式。
(function () {
    'use strict';
    var W = window;

    function internal(sect) { return (W.SECT_INTERNAL && W.SECT_INTERNAL[sect]) || null; }
    function absDay() { try { return W.timeSystem && W.timeSystem.getAbsoluteDay ? (Number(W.timeSystem.getAbsoluteDay()) || 0) : 0; } catch (e) { return 0; } }
    function log(m, t) { try { if (W.gameLog && W.gameLog.add) W.gameLog.add(m); } catch (e) {} }
    function msg(m, t) { if (typeof W.showMessage === 'function') W.showMessage(m, t || 'info'); }
    function modal(t, b) { if (typeof W.showModal === 'function') W.showModal(t, b); }
    function ds() { return W.discipleState || null; }
    function mySect() { var d = ds(); return (d && d.isInSect && (d.sectName || d.sectId)) || null; }
    function addC(n, r) { try { if (typeof W.sectAddContribution === 'function') return W.sectAddContribution(n, r); } catch (e) {} var d = ds(); if (d) d.contribution = (Number(d.contribution) || 0) + n; return d && d.contribution; }
    function spendC(n, r) { try { if (typeof W.sectSpendContribution === 'function') return W.sectSpendContribution(n, r); } catch (e) {} var d = ds(); if (!d || (Number(d.contribution) || 0) < n) return false; d.contribution -= n; return true; }
    function stones() {
        try { if (W.XianXia && W.XianXia.DataManager && W.XianXia.DataManager.getSpiritStones) return Number(W.XianXia.DataManager.getSpiritStones()) || 0; } catch (e) {}
        return (W.inventory && W.inventory.currency && Number(W.inventory.currency.spiritStones)) || 0;
    }
    function payStones(n) {
        if (stones() < n) return false;
        try { if (W.XianXia && W.XianXia.DataManager && W.XianXia.DataManager.deductSpiritStones) { W.XianXia.DataManager.deductSpiritStones(n); return true; } } catch (e) {}
        if (W.inventory && W.inventory.currency) { W.inventory.currency.spiritStones -= n; return true; }
        return false;
    }
    function leaderName(sect) {
        try { if (W.SECT_LEADER_NAMES && W.SECT_LEADER_NAMES[sect]) return W.SECT_LEADER_NAMES[sect]; } catch (e) {}
        return sect + '掌门';
    }
    function chron(int_, day, text) {
        if (!int_.chronicle) int_.chronicle = [];
        int_.chronicle.push({ day: day, text: String(text) });
        if (int_.chronicle.length > 40) int_.chronicle.splice(0, int_.chronicle.length - 40);
    }
    function notifyHome(sect, text) {
        if (mySect() === sect) log('🏯 ' + sect + '·' + text, 'info');
    }

    // ============ 一 · 多类库存（灵石=resources 旧账；谷/材/丹为新账） ============
    function affinity(sect) {
        var s = (W.sectsData || {})[sect] || {};
        var text = String(s.weapons || '') + String(s.desc || '');
        var aff = { grain: 0, mat: 0, herb: 0 };
        if (/药|丹|医|毒|花|蛊/.test(text)) aff.herb += 2;
        if (/剑|刀|铸|器|锤|机关|火器|铁|棒|棍/.test(text)) aff.mat += 2;
        if (/农|田|米|粮|渔/.test(text)) aff.grain += 2;
        try {
            var deep = W.SECT_DEEP_DATA && W.SECT_DEEP_DATA[sect];
            ((deep && deep.specialResources) || []).forEach(function (r) {
                var t = String(r.type || '') + String(r.name || '') + String(r.desc || '');
                if (/forge|铸|兵器|硝|机|石|矿|铁/.test(t)) aff.mat += 2;
                if (/herb|药|百草|蛊田|花|毒/.test(t)) aff.herb += 2;
                if (/田|粮|米|膳/.test(t)) aff.grain += 2;
            });
        } catch (e) {}
        return aff;
    }
    function ensureStores(sect) {
        var it = internal(sect);
        if (!it) return null;
        if (it._govInit) return it;
        var aff = affinity(sect);
        var infl = Number(it.influence) || 40;
        it.grain = Math.max(20, Math.round(infl * 0.8) + aff.grain * 10);
        it.material = Math.max(5, Math.round(infl * 0.3) + aff.mat * 8);
        it.pill = Math.max(0, aff.herb * 5);
        it.weapons = Math.max(5, Math.round((Number(it.disciples) || 15) / 2));
        it.defense = Math.round(infl * 0.2);
        it._famineDays = 0;
        it._govInit = absDay() || 1;
        return it;
    }
    function dailyStores(sect) {
        var it = ensureStores(sect);
        if (!it) return;
        var aff = affinity(sect);
        var disc = Number(it.disciples) || 10;
        // 产出：看营生
        var grainGross = 2 + Math.ceil(disc / 10) + aff.grain;
        var matGross = 1 + aff.mat;
        var pillGross = aff.herb >= 2 ? 2 : (aff.herb >= 1 ? 1 : 0);
        // 消耗：弟子要吃饭，兵器有锈损
        var grainUp = Math.ceil(disc / 6);
        var matUp = Math.ceil(disc / 20);
        it.grain = Math.max(0, (Number(it.grain) || 0) + grainGross - grainUp);
        it.material = Math.max(0, (Number(it.material) || 0) + matGross - matUp);
        it.pill = Math.max(0, Math.min(99, (Number(it.pill) || 0) + pillGross));
        // 断粮后果：真掉士气、真走人（丹药可稳心——库里的每样东西都有用场）
        if (it.grain <= 0) {
            it._famineDays = (Number(it._famineDays) || 0) + 1;
            var loss = (Number(it.pill) || 0) >= 5 ? 2 : 4;
            if ((Number(it.pill) || 0) >= 5) it.pill -= 5;
            it.morale = Math.max(0, (Number(it.morale) || 50) - loss);
            if (it._famineDays === 1) {
                chron(it, absDay(), '粮仓见底了——' + leaderName(sect) + '下令各峰省着用饭，药房把压箱底的丹药搬了出来。');
                notifyHome(sect, '粮仓见底，门中开始省饭。你的俸禄也会受影响。');
            }
            if (it._famineDays % 7 === 0) {
                var fled = 1 + Math.floor(it._famineDays / 14);
                it.disciples = Math.max(3, disc - fled);
                chron(it, absDay(), '门中养不活弟子了——有' + fled + '人趁夜下了山。' + leaderName(sect) + '站在山门口，没拦。');
                notifyHome(sect, '又有同门趁夜下山了。门派养不活人，留不住人。');
            }
        } else if ((Number(it._famineDays) || 0) > 0) {
            it._famineDays = 0;
            chron(it, absDay(), '新粮入库，灶火重新旺了——' + leaderName(sect) + '吩咐各峰加了一顿干饭。');
            notifyHome(sect, '门中重新开足灶火，士气缓过来了。');
        }
    }
    // 俸禄联动（sects-system.collectSectResources 真读）：断粮门派俸禄减半
    function famine(sect) { var it = internal(sect); return !!(it && (Number(it._famineDays) || 0) > 0); }
    // 俸禄从库里出（你领的每一枚灵石都出自门派粮仓）
    function deductStore(sect, kind, n) {
        var it = internal(sect);
        if (!it) return false;
        n = Math.max(0, Math.floor(Number(n) || 0));
        if (kind === 'stone') it.resources = Math.max(0, (Number(it.resources) || 0) - n);
        else if (kind === 'grain') it.grain = Math.max(0, (Number(it.grain) || 0) - n);
        else if (kind === 'material') it.material = Math.max(0, (Number(it.material) || 0) - n);
        else if (kind === 'pill') it.pill = Math.max(0, (Number(it.pill) || 0) - n);
        return true;
    }

    // ============ 二 · 管理者自治决策（缺什么补什么，花真库存，落真编年） ============
    var ELDER_SURNAME = ['赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈'];
    function elderName(sect) {
        var h = 0; for (var i = 0; i < sect.length; i++) h = (h * 31 + sect.charCodeAt(i)) % ELDER_SURNAME.length;
        return ELDER_SURNAME[h] + '长老';
    }
    function hasDiploFoe(sect) {
        try {
            var row = W.SECT_DIPLOMACY_STATE && W.SECT_DIPLOMACY_STATE[sect];
            if (!row) return null;
            var worst = null;
            for (var o in row) { var r = Number(row[o].relation) || 0; if (r <= -30 && (!worst || r < worst.rel)) worst = { id: o, rel: r }; }
            return worst;
        } catch (e) { return null; }
    }
    // 决策池（按「急需优先」排序：先吃饭，再士气，再发展）
    var DECISIONS = [
        {
            id: 'buy_grain', name: '下山籴粮',
            when: function (it) { return (Number(it.grain) || 0) < Math.ceil((Number(it.disciples) || 10) / 2) && (Number(it.resources) || 0) >= 40; },
            run: function (it, sect) {
                it.resources -= 40; it.grain = (Number(it.grain) || 0) + 40;
                return elderName(sect) + '带人下山籴粮四十石——「粮价又涨了，早买早便宜。」';
            }
        },
        {
            id: 'feast', name: '开大典',
            when: function (it) { return (Number(it.morale) || 50) < 45 && (Number(it.grain) || 0) >= 25 && (Number(it.resources) || 0) >= 30; },
            run: function (it, sect) {
                it.grain -= 25; it.resources -= 30; it.morale = Math.min(100, (Number(it.morale) || 50) + 10);
                return leaderName(sect) + '开了三日大典，全山同席——酒是浊酒，歌是山歌，士气却实打实地旺了。';
            },
            home: function () {
                try { if (typeof W.applyBuff === 'function') W.applyBuff('fxb_sect_feast', { willpower: 3 }, 24); } catch (e) {}
                log('🍶 门中开大典，你与同门同席——浊酒一碗，心里的火旺了。（心境增益一日）', 'success');
            }
        },
        {
            id: 'recruit', name: '开山收徒',
            when: function (it) {
                var cap = 12 + Math.floor((Number(it.influence) || 40) / 5);
                return (Number(it.disciples) || 10) < cap && (Number(it.grain) || 0) >= 20 && (Number(it.resources) || 0) >= 30;
            },
            run: function (it, sect) {
                var n = 2 + Math.floor(Math.random() * 3);
                it.disciples = (Number(it.disciples) || 10) + n; it.grain -= 20; it.resources -= 30;
                return sect + '开了山门，收下' + n + '名新弟子——山道上又是一片新面孔。';
            }
        },
        {
            id: 'forge', name: '铸造法器',
            when: function (it) { return (Number(it.material) || 0) >= 20 && (Number(it.resources) || 0) >= 20 && (Number(it.weapons) || 0) < Math.ceil((Number(it.disciples) || 10) / 2); },
            run: function (it, sect) {
                it.material -= 20; it.resources -= 20; it.weapons = (Number(it.weapons) || 0) + 6;
                return '炉火彻夜不熄——兵器库新入库六件法器，' + elderName(sect) + '亲自验的锋口。';
            }
        },
        {
            id: 'alchemy', name: '开炉炼丹',
            when: function (it) { return (Number(it.material) || 0) >= 15 && (Number(it.pill) || 0) < 20; },
            run: function (it, sect) {
                it.material -= 15; it.pill = (Number(it.pill) || 0) + 8;
                return '药房开炉八日，丹成八炉——' + leaderName(sect) + '吩咐入库封存，「荒年救命用的，谁也不许当糖豆吃。」';
            }
        },
        {
            id: 'array', name: '修缮护山大阵',
            when: function (it) { return (Number(it.resources) || 0) >= 60 && (Number(it.defense) || 0) < 40; },
            run: function (it, sect) {
                it.resources -= 60; it.defense = (Number(it.defense) || 0) + 8; it.influence = (Number(it.influence) || 40) + 2;
                return '护山大阵翻新，阵光十里可见——' + sect + '的门户又硬了一层。';
            }
        },
        {
            id: 'relief', name: '开仓济民', align: 5,
            when: function (it) { return (Number(it.grain) || 0) >= 80; },
            run: function (it, sect) {
                it.grain -= 60; it.morale = Math.min(100, (Number(it.morale) || 50) + 2);
                return leaderName(sect) + '开了粮仓，向山下饥民放粮六十石——「库里的粮是死物，山下的命是活的。」门中上下，脸上都有光。';
            }
        },
        {
            id: 'gift', name: '外交送礼', align: 1,
            when: function (it, sect) { return (Number(it.resources) || 0) >= 40 && !!hasDiploFoe(sect); },
            run: function (it, sect) {
                var foe = hasDiploFoe(sect);
                it.resources -= 40;
                try {
                    var cell = W.SECT_DIPLOMACY_STATE[sect][foe.id];
                    cell.relation = Math.max(-100, Math.min(100, (Number(cell.relation) || 0) + 12));
                    if (typeof W.saveSectDiplomacy === 'function') W.saveSectDiplomacy();
                } catch (e) {}
                return '一车礼品送去了' + foe.id + '——' + leaderName(sect) + '说：「江湖没有解不开的死仇，只有不肯递出去的手。」（关系回暖）';
            }
        },
        {
            id: 'venture', name: '遣弟子历练',
            when: function (it) { return (Number(it.disciples) || 0) >= 15 && (Number(it.morale) || 50) >= 45; },
            run: function (it, sect) {
                var roll = Math.random();
                if (roll < 0.4) {
                    var gainS = 20 + Math.floor(Math.random() * 21);
                    it.resources = (Number(it.resources) || 0) + gainS;
                    return '历练的弟子回来了，带回一车山货与' + gainS + '灵石的进项——' + leaderName(sect) + '在殿上点了名夸。';
                }
                if (roll < 0.55) {
                    var name = '一名弟子';
                    try {
                        var npcs = (typeof W.getSectNPCs === 'function') ? (W.getSectNPCs(sect) || []) : [];
                        var young = npcs.filter(function (n) { return n && n.id && String(n.id).indexOf('sect_disciple_') === 0 && n.name; });
                        if (young.length) name = young[Math.floor(Math.random() * young.length)].name;
                    } catch (e) {}
                    it.morale = Math.max(0, (Number(it.morale) || 50) - 5);
                    return '历练路上出了岔子——' + name + '带着伤被同门背回山，医馆的灯亮了一夜。（士气-5）';
                }
                it.morale = Math.min(100, (Number(it.morale) || 50) + 3);
                return '历练的弟子平安归山，一个个晒黑了，也结实了。（士气+3）';
            }
        },
        {
            id: 'sell', name: '出售余材',
            when: function (it) { return (Number(it.material) || 0) > 50; },
            run: function (it, sect) {
                it.material -= 20; it.resources = (Number(it.resources) || 0) + 30;
                return '坊市里卖了一批余材，换回灵石三十——管库的说：「库房堆满了也是虫蛀。」';
            }
        },
        {
            id: 'lecture', name: '开坛讲经',
            when: function (it) { return (Number(it.resources) || 0) >= 30 && (Number(it.influence) || 40) >= 40; },
            run: function (it, sect) {
                it.resources -= 30; it.influence = (Number(it.influence) || 40) + 2; it.morale = Math.min(100, (Number(it.morale) || 50) + 3);
                return leaderName(sect) + '亲登法座讲经三日，四野修士都来旁听——' + sect + '的名头又亮了一分。';
            },
            home: function () {
                try { if (typeof W.applyBuff === 'function') W.applyBuff('fxb_sect_lecture', { intelligence: 4 }, 24); } catch (e) {}
                log('📿 掌门讲经，你坐在第三排——一句「气者，水也；脉者，渠也」让你怔了半晌。（神识增益一日）', 'success');
            }
        },
        {
            id: 'tour_prize', name: '大比加码',
            when: function (it, sect) {
                if ((Number(it.resources) || 0) < 80) return false;
                try { return !!(W.Tournament && W.Tournament._store && W.Tournament._store()[sect] && W.Tournament._store()[sect].currentEvent); } catch (e) { return false; }
            },
            run: function (it, sect) {
                it.resources -= 80; it.morale = Math.min(100, (Number(it.morale) || 50) + 8);
                // 第一百零九波：押上的彩头要真记账——此前扣了公库 80、嘴上说「魁首另得灵石八十」，
                // 全库却没有任何发放代码，钱扣了彩头蒸发。现在落进赛事账，夺冠结算时一并兑付。
                try {
                    var _tev = W.Tournament._store()[sect].currentEvent;
                    if (_tev) _tev.stakeBonus = (Number(_tev.stakeBonus) || 0) + 80;
                } catch (eStake) {}
                return leaderName(sect) + '给正在进行的大比加了彩头——魁首另得灵石八十。榜下的人挤得更密了。';
            }
        }
    ];
    function runDecision(sect, dec, day) {
        var it = internal(sect);
        if (!it) return false;
        var text = dec.run(it, sect);
        chron(it, day, text);
        notifyHome(sect, text);
        if (dec.home && mySect() === sect) { try { dec.home(); } catch (e) {} }
        if (dec.align) { try { if (typeof W.sectAlignShift === 'function') W.sectAlignShift(sect, dec.align, dec.name); } catch (eA) {} }
        return true;
    }
    // 玩家进言排程（下一个治理钩子采纳）
    function tryProposal(sect, day) {
        var it = internal(sect);
        if (!it || !it._proposal) return;
        var p = it._proposal;
        it._proposal = null;
        var dec = null;
        for (var i = 0; i < DECISIONS.length; i++) { if (DECISIONS[i].id === p.id) { dec = DECISIONS[i]; break; } }
        if (dec && dec.when(it, sect)) {
            runDecision(sect, dec, day);
            chron(it, day, '（此策出自' + (p.byName || '门下弟子') + '的进言——' + leaderName(sect) + '准了。）');
            notifyHome(sect, '你的进言被采纳了：' + dec.name + '。');
        } else {
            addC(30, '进言搁置·原数退回');
            chron(it, day, (p.byName || '门下弟子') + '进言「' + (dec ? dec.name : p.id) + '」——库中不凑手，' + leaderName(sect) + '把条子压下了，贡献原数退回。');
            notifyHome(sect, '你的进言被搁置了（库中不凑手），贡献原数退回。');
        }
    }
    // 日钩：先盘库存，再看管理者今天做不做事（自家门派勤快些——你在看着）
    function govDayTick() {
        var day = absDay();
        if (!day) return;
        var home_ = mySect();
        var sects = W.SECT_INTERNAL || {};
        for (var sect in sects) {
            try { if (W.PSBoot && W.PSBoot.isPlayerSect && W.PSBoot.isPlayerSect(sect)) continue; } catch (e) {} // 第九波：玩家自建宗门自家管库——日产粮与长老自动决议都不代管
            dailyStores(sect);
            tryProposal(sect, day);
            if (sect === home_ && (W.discipleState || {}).rank === 0) continue; // 第十波：玩家就是掌门——门务由玩家拍板，长老不再代自家门派自动决议
            var chance = (sect === home_) ? 0.5 : 0.2;
            if (Math.random() >= chance) continue;
            var it = sects[sect];
            for (var i = 0; i < DECISIONS.length; i++) {
                var dec = DECISIONS[i];
                var okk = false;
                try { okk = dec.when(it, sect); } catch (e) { okk = false; }
                if (okk) { runDecision(sect, dec, day); break; } // 一天办成一件事就够了
            }
        }
    }
    try {
        if (W.EventBus && W.EventBus.on) W.EventBus.on('newDay', function () { try { govDayTick(); } catch (e) {} });
        else if (W.timeSystem && typeof W.timeSystem.onNewDaySubscribe === 'function') W.timeSystem.onNewDaySubscribe(function () { try { govDayTick(); } catch (e) {} });
    } catch (e) {}

    // ============ 三 · 战争联动（批五）：兵器库与护山大阵不是摆设 ============
    function onWar(sect, win, side) {
        var it = internal(sect);
        if (!it) return;
        if (side === 'defend') {
            if (win) {
                if ((Number(it.weapons) || 0) >= 20) {
                    addC(20, '武库充盈·守山有功');
                    notifyHome(sect, '这一仗兵器库开得及时——人人有家伙，你的功劳簿上添了一笔（贡献+20）。');
                }
            } else {
                it.weapons = Math.max(0, (Number(it.weapons) || 0) - 10);
                it.defense = Math.max(0, (Number(it.defense) || 0) - 5);
                chron(it, absDay(), '山门被踏破了一角——兵器折损十件，护山大阵裂了五处。' + leaderName(sect) + '下令闭门三月。');
            }
        }
    }

    // ============ 四 · 玩家参与：捐献 / 进言 / 支取 ============
    function donateStones(sect) {
        var it = ensureStores(sect);
        if (!it) { msg('查无此派。', 'warning'); return false; }
        if (!payStones(100)) { msg('身上一百灵石都凑不齐——心意到了，库里不记账。', 'warning'); return false; }
        it.resources = (Number(it.resources) || 0) + 100;
        addC(15, '捐献宗门·灵石百枚');
        donorChron(sect, it, '灵石一百枚');
        msg('💰 你把一百灵石交进公库。管事登记入册，你的名字进了账。（贡献+15）', 'success');
        return true;
    }
    function donateMaterials(sect) {
        var it = ensureStores(sect);
        if (!it) { msg('查无此派。', 'warning'); return false; }
        // 从行囊里找出药材与矿石（subtype herb/ore 或铁矿），最多收三份（同格多份也数得清）
        var taken = 0, names = [];
        var inv = W.inventory;
        while (taken < 3) {
            var found = null;
            if (inv && inv.slots) {
                for (var i = 0; i < inv.slots.length; i++) {
                    var s = inv.slots[i];
                    if (!s || !(s.count > 0)) continue;
                    var t = (s.getTemplate && s.getTemplate()) || (W.itemById && W.itemById[s.templateId]);
                    if (!t) continue;
                    if (t.subtype === 'herb' || t.subtype === 'ore' || s.templateId === 'iron_ore') { found = { slot: s, idx: i, t: t }; break; }
                }
            }
            if (!found) break;
            found.slot.count -= 1; taken++;
            if (names.indexOf(found.t.name) < 0) names.push(found.t.name);
            if (found.slot.count <= 0) inv.slots[found.idx] = null;
        }
        if (!taken) { msg('行囊里没有拿得出手的药材矿石——公库不收空手的人情。', 'warning'); return false; }
        it.material = (Number(it.material) || 0) + taken * 5;
        addC(taken * 3, '捐献宗门·药材物料');
        donorChron(sect, it, names.join('、') + '共' + taken + '份');
        try { if (typeof W.updateInventoryUI === 'function') W.updateInventoryUI(); } catch (e) {}
        msg('🌿 你把' + names.join('、') + '（' + taken + '份）交进公库。管事称了又称：「成色不错。」（贡献+' + (taken * 3) + '）', 'success');
        return true;
    }
    function donorChron(sect, it, what) {
        var day = absDay();
        if ((Number(it._lastDonorDay) || -99) + 10 > day) return; // 编年不刷屏：十日一笔
        it._lastDonorDay = day;
        var who = (W.currentCharData && W.currentCharData.name) || '门下弟子';
        chron(it, day, '弟子「' + who + '」向公库捐了' + what + '——' + leaderName(sect) + '在殿上点了这个名。');
        if (mySect() === sect) log('🏯 你的名字进了门中编年：捐献' + what + '，掌门殿上点名。', 'success');
    }
    function propose(sect, decId) {
        var d = ds();
        if (!d || !d.isInSect || (d.sectName || d.sectId) !== sect) { msg('自家门派的事，才轮得到你进言。', 'warning'); return false; }
        if ((d.rank == null ? 7 : d.rank) > 4) { msg('内门弟子以上方能在殿上开口——先把差事办好，把位分熬上去。', 'info'); return false; }
        var it = ensureStores(sect);
        if (!it) return false;
        if (it._proposal) { msg('上一条进言还在掌门案头——一次只递一条。', 'info'); return false; }
        var dec = null;
        for (var i = 0; i < DECISIONS.length; i++) { if (DECISIONS[i].id === decId) { dec = DECISIONS[i]; break; } }
        if (!dec) { msg('没有这个章程。', 'warning'); return false; }
        if (!dec.when(it, sect)) { msg('库中不凑手，这条章程眼下递不上去——' + dec.name + '需要的东西还不够。', 'warning'); return false; }
        if (!spendC(30, '进言宗门·' + dec.name)) { msg('进言要三十贡献的香火情——你的贡献不够。', 'error'); return false; }
        it._proposal = { id: decId, day: absDay(), byName: (W.currentCharData && W.currentCharData.name) || '门下弟子' };
        msg('📜 你的条子递上去了——' + leaderName(sect) + '看过便会定夺。（明日见分晓，库中不凑手会原数退回）', 'success');
        return true;
    }
    function drawMaterial(sect) {
        var d = ds();
        if (!d || (d.rank == null ? 7 : d.rank) > 2) { msg('支取公库是长老以上的事——兵器库的钥匙不在你手里。', 'info'); return false; }
        var it = ensureStores(sect);
        if (!it) return false;
        if ((Number(it.material) || 0) < 15) { msg('库里材料不足十五份——巧妇难为无米之炊。', 'warning'); return false; }
        if (!spendC(40, '支取公库·材料')) { msg('支取要四十贡献——不够。', 'error'); return false; }
        it.material -= 15;
        try {
            if (typeof W.addItem === 'function') { W.addItem('iron_ore', 4); W.addItem('mat_liquorice', 4); }
        } catch (e) {}
        msg('📦 管事开了库房，拨给你铁矿四份、甘草四份。（材料-15，贡献-40）', 'success');
        return true;
    }
    function drawPill(sect) {
        var d = ds();
        if (!d || (d.rank == null ? 7 : d.rank) > 2) { msg('丹药是荒年救命用的，长老以下支不动。', 'info'); return false; }
        var it = ensureStores(sect);
        if (!it) return false;
        if ((Number(it.pill) || 0) < 10) { msg('药房的存货不足十炉——' + leaderName(sect) + '的话你记着：谁也不许当糖豆吃。', 'warning'); return false; }
        if (!spendC(60, '支取公库·丹药')) { msg('支取要六十贡献——不够。', 'error'); return false; }
        it.pill -= 10;
        try { if (typeof W.addItem === 'function') W.addItem('pill_qi_gather', 2); } catch (e) {}
        msg('💊 药房拨给你聚气丹两瓶，管事在册子上记了你的名。（丹药-10，贡献-60）', 'success');
        return true;
    }

    // ============ 五 · 政事面板（库存 + 状态 + 编年 + 玩家三事） ============
    function openPanel(sect) {
        var it = ensureStores(sect);
        if (!it) { msg('查无此派。', 'warning'); return; }
        var d = ds();
        var mine = d && d.isInSect && (d.sectName || d.sectId) === sect;
        var rank = d ? (d.rank == null ? 7 : d.rank) : 7;
        var aff = affinity(sect);
        var disc = Number(it.disciples) || 10;
        var grainNet = 2 + Math.ceil(disc / 10) + aff.grain - Math.ceil(disc / 6);
        var html = '<div class="text-left">';
        // 库存四栏
        html += '<div class="grid grid-cols-4 gap-2 mb-2 text-center">';
        html += '<div class="bg-gray-800 p-2 rounded"><p class="text-[10px] text-gray-400">💰 灵石</p><p class="text-green-300 font-bold">' + (Number(it.resources) || 0) + '</p></div>';
        html += '<div class="bg-gray-800 p-2 rounded"><p class="text-[10px] text-gray-400">🌾 灵谷</p><p class="' + ((Number(it.grain) || 0) <= 0 ? 'text-red-400' : 'text-amber-200') + ' font-bold">' + (Number(it.grain) || 0) + '</p><p class="text-[9px] text-gray-500">日净' + (grainNet >= 0 ? '+' : '') + grainNet + '</p></div>';
        html += '<div class="bg-gray-800 p-2 rounded"><p class="text-[10px] text-gray-400">⚙️ 材料</p><p class="text-sky-300 font-bold">' + (Number(it.material) || 0) + '</p></div>';
        html += '<div class="bg-gray-800 p-2 rounded"><p class="text-[10px] text-gray-400">💊 丹药</p><p class="text-pink-300 font-bold">' + (Number(it.pill) || 0) + '</p></div>';
        html += '</div>';
        // 状态行
        html += '<div class="bg-gray-800/60 p-2 rounded mb-2 text-xs text-gray-300">弟子 <b>' + disc + '</b> 人 · 士气 <b>' + (Number(it.morale) || 50) + '</b> · 影响力 <b>' + (Number(it.influence) || 40) + '</b> · 兵器 <b>' + (Number(it.weapons) || 0) + '</b> 件 · 护山大阵 <b>' + (Number(it.defense) || 0) + '</b>';
        try {
            if (typeof W.sectPowerLabel === 'function' && typeof W.sectAlignLabel === 'function') {
                html += '<br>江湖地位 <b class="text-amber-300">' + W.sectPowerLabel(sect) + '</b> · 立场 <b class="text-sky-300">' + W.sectAlignLabel(sect) + '</b>';
            }
        } catch (eS) {}
        if (famine(sect)) html += ' · <span class="text-red-400">断粮中（俸禄减半）</span>';
        html += '</div>';
        // 编年
        var ch = (it.chronicle || []).slice(-8).reverse();
        html += '<p class="text-xs font-bold text-amber-200 mb-1">📜 门中政事（近来）</p>';
        html += '<div class="bg-gray-900/60 rounded p-2 mb-2 max-h-40 overflow-y-auto">';
        html += ch.length ? ch.map(function (c) { return '<p class="text-xs text-gray-400 py-1 border-b border-gray-700/40">第' + c.day + '日 · ' + c.text + '</p>'; }).join('') : '<p class="text-xs text-gray-500">近来无事——门派的日子也是一天一天过的。</p>';
        html += '</div>';
        // 改造批 · 商路插块（sect-trade：有涉及本门的商路队正在集结时，押运入口在这里）
        try { if (W.SectTrade && typeof W.SectTrade.panelBlock === 'function') html += W.SectTrade.panelBlock(sect); } catch (e) {}
        // 方案四：城市香火护持/分舵 与 盛会 插块（sect-cities / sect-gala）
        try { if (W.SectCities && typeof W.SectCities.panelBlock === 'function') html += W.SectCities.panelBlock(sect); } catch (eC) {}
        try { if (W.SectGala && typeof W.SectGala.panelBlock === 'function') html += W.SectGala.panelBlock(sect); } catch (eG) {}
        // 方案三：战云块（血仇压山/讨伐的全部出口都在这，不另立门户）
        try { if (W.SectDoom && typeof W.SectDoom.panelBlock === 'function') html += W.SectDoom.panelBlock(sect); } catch (eD) {}
        // 玩家参与
        if (mine) {
            html += '<p class="text-xs font-bold text-amber-200 mb-1">🙋 你能做的</p>';
            html += '<div class="flex flex-wrap gap-2 mb-2">';
            html += '<button onclick="window.SectGov.donateStones(\'' + sect + '\')" class="bg-emerald-800 hover:bg-emerald-700 text-xs px-3 py-2 rounded">💰 捐灵石一百（贡献+15）</button>';
            html += '<button onclick="window.SectGov.donateMaterials(\'' + sect + '\')" class="bg-lime-800 hover:bg-lime-700 text-xs px-3 py-2 rounded">🌿 捐药材矿石（每份贡献+3）</button>';
            if (typeof window.doSectFarmWork === 'function') {
                // 第十一波 · 身份改版：长老以上是来督耕的，不是来帮工的
                var _rkFarm = (window.discipleState || {}).rank;
                html += '<button onclick="window.doSectFarmWork(); window.SectGov.openPanel(\'' + sect + '\')" class="bg-green-800 hover:bg-green-700 text-xs px-3 py-2 rounded">' +
                    (_rkFarm != null && _rkFarm <= 2 ? '🌾 督耕半日（谷入公库，功绩另记）' : '🌾 灵田帮工半日（谷入公库，贡献+8）') + '</button>';
            }
            if (typeof window.openSectRoster === 'function') html += '<button onclick="window.openSectRoster(\'' + sect + '\')" class="bg-stone-700 hover:bg-stone-600 text-xs px-3 py-2 rounded">📖 门中族谱（腰牌·师承·功过·殁录）</button>';
            try { if (typeof window.sectCanSettleDown === 'function' && window.sectCanSettleDown()) html += '<button onclick="window.doSectSettleDown(); window.SectGov.openPanel(\'' + sect + '\')" class="bg-amber-800 hover:bg-amber-700 text-xs px-3 py-2 rounded">🍵 花甲安顿——请个荣养执事的名分</button>'; } catch (eSet) {}
            if (rank <= 2) {
                html += '<button onclick="window.SectGov.drawMaterial(\'' + sect + '\')" class="bg-sky-800 hover:bg-sky-700 text-xs px-3 py-2 rounded">📦 支取材料（贡献40）</button>';
                html += '<button onclick="window.SectGov.drawPill(\'' + sect + '\')" class="bg-pink-800 hover:bg-pink-700 text-xs px-3 py-2 rounded">💊 支取丹药（贡献60）</button>';
            }
            html += '</div>';
            if (rank <= 4) {
                html += '<p class="text-xs font-bold text-amber-200 mb-1">📜 进言（贡献30，掌门明日定夺）</p><div class="flex flex-wrap gap-2">';
                var it2 = internal(sect);
                DECISIONS.forEach(function (dec) {
                    var can = false;
                    try { can = dec.when(it2, sect); } catch (e) {}
                    if (!can) return;
                    html += '<button onclick="window.SectGov.propose(\'' + sect + '\', \'' + dec.id + '\')" class="bg-amber-800 hover:bg-amber-700 text-xs px-3 py-1 rounded">' + dec.name + '</button>';
                });
                html += '</div>';
                if (it2 && it2._proposal) html += '<p class="text-[10px] text-gray-500 mt-1">已有一条进言在掌门案头，明日见分晓。</p>';
            } else {
                html += '<p class="text-[10px] text-gray-500">升到内门弟子，才能在殿上进言。</p>';
            }
        } else {
            html += '<p class="text-[10px] text-gray-500">（这是别派的家底——看得见，摸不着。）</p>';
        }
        html += '</div>';
        modal('🏯 ' + sect + ' · 门中政事', html);
    }

    W.SectGov = {
        openPanel: openPanel,
        donateStones: donateStones,
        donateMaterials: donateMaterials,
        propose: propose,
        drawMaterial: drawMaterial,
        drawPill: drawPill,
        famine: famine,
        deductStore: deductStore,
        onWar: onWar,
        ensureStores: ensureStores,
        affinity: affinity,           // 改造批：商路配对读营生口径（药材多的和铁多的互通有无）
        // 改造批 · 守恒来路做实：弟子在地标工坊干出来的活，产出半数入公库（五日一记编年，不刷屏）
        titheWorkshop: function (total) {
            var sect = mySect(); if (!sect) return 0;
            var it = ensureStores(sect); if (!it) return 0;
            var half = Math.max(1, Math.ceil((Number(total) || 0) / 2));
            it.material = (Number(it.material) || 0) + half;
            var day = absDay();
            if ((Number(it._lastTitheDay) || -99) + 5 <= day) {
                it._lastTitheDay = day;
                chron(it, day, '有弟子把工坊里干出来的活分了半数入公库——' + leaderName(sect) + '说：心里有公中的人，靠得住。');
            }
            return half;
        },
        chronicle: function (sect, text) { var it = internal(sect); if (it) chron(it, absDay(), text); },
        internalRef: internal,
        addDecision: function (dec) {
            if (!dec || !dec.id) return false;
            for (var i = 0; i < DECISIONS.length; i++) { if (DECISIONS[i].id === dec.id) return false; }
            DECISIONS.push(dec);
            return true;
        },
        // 第十波 · 掌门案头：玩家当上掌门后，门务由玩家拍板——决策全表与办理口
        decisionList: function () { return DECISIONS; },
        leaderDecide: function (sect, id) {
            var it = internal(sect);
            if (!it) return { ok: false, reason: 'no-store', text: '门中库房账目未立。' };
            var dec = null;
            for (var i = 0; i < DECISIONS.length; i++) { if (DECISIONS[i].id === id) dec = DECISIONS[i]; }
            if (!dec) return { ok: false, reason: 'no-decision', text: '没有这桩门务。' };
            var okk = false;
            try { okk = dec.when(it, sect); } catch (e) { okk = false; }
            if (!okk) return { ok: false, reason: 'not-now', text: '「' + dec.name + '」的时机未到——眼下没这个需要。' };
            var done = false;
            try { done = runDecision(sect, dec, absDay()); } catch (e2) {}
            return done ? { ok: true, name: dec.name } : { ok: false, reason: 'error', text: '这桩门务没办成。' };
        },
        decisions: DECISIONS.map(function (d) { return { id: d.id, name: d.name }; }),
        govDayTick: govDayTick,   // 测试直驱
        probe: function (sect) {
            var it = internal(sect);
            if (!it) return null;
            return {
                stone: Number(it.resources) || 0, grain: Number(it.grain) || 0, material: Number(it.material) || 0,
                pill: Number(it.pill) || 0, weapons: Number(it.weapons) || 0, defense: Number(it.defense) || 0,
                disciples: Number(it.disciples) || 0, morale: Number(it.morale) || 50, influence: Number(it.influence) || 40,
                famineDays: Number(it._famineDays) || 0, chronicle: (it.chronicle || []).slice(), proposal: it._proposal || null
            };
        }
    };

    console.log('[sect-governance] 活门派已注册：四类库存+日产出断粮后果 / 管理者十一策自治 / 门中政事编年 / 捐献进言支取 / 战争与俸禄联动');
})();
