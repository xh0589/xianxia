// ==================== sect-kin.js - 弟子有脸、需求做实（补厚批四） ====================
// 两条线：
//   一、道侣需求做实——needs{talk,accompany,gift} 此前是写后即丢的假账（只涨不消费、mood 从不参与任何计算）。
//       现在：三个主动互动（交心/相伴/赠礼）各自消化一种需求；需求随日子上涨（ neglect 有代价）；
//       心情由需求推导（不再另存一本糊涂账），并且真乘进双修收益与合击威力——
//       情浓时合击生威，心有委屈时阵脚就散。_companionData 随 NPC 存档持久化（npc-system.js 已接）。
//   二、弟子有脸——亲传及以上可在本派收「真名弟子」（有名有姓有灵根的真 NPC 档案，
//       收进 discipleState._myDisciples，传功/出师/反哺整条既有培养线直接吃）；
//       日常门派事件注入真名同门（「有弟子突破」→「有弟子沈铁衣突破」——事件里的人就是你切磋过、
//       能收徒的那些真档案）。危机事件孩子实名化随批五危机因果重做一并落。
// 纪律：贡献走批一账本记账口；时间/灵石/贡献都是真代价；心情只报词不报数；零外文字母。
(function () {
    'use strict';
    var W = window;

    function flags() { return (W.eventFlags = W.eventFlags || {}); }
    function absDay() {
        try {
            if (typeof W.getAbsoluteDay === 'function') return Number(W.getAbsoluteDay()) || 0;
            if (W.timeSystem && W.timeSystem.getAbsoluteDay) return Number(W.timeSystem.getAbsoluteDay()) || 0;
        } catch (e) {}
        return 0;
    }
    function log(m, t) { try { if (W.gameLog && W.gameLog.add) W.gameLog.add(m); else if (W.showMessage) W.showMessage(m, t || 'info'); } catch (e) {} }
    function msg(m, t) { if (typeof W.showMessage === 'function') W.showMessage(m, t || 'info'); }
    function modal(t, b) { if (typeof W.showModal === 'function') W.showModal(t, b); }
    function cd() { return W.currentCharData || null; }
    function ds() { return W.discipleState || null; }
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
    function advance(min, why) { try { if (W.timeSystem && W.timeSystem.advanceTime) W.timeSystem.advanceTime(min, why || '陪伴道侣'); } catch (e) {} }
    function getNpc(id) { try { return (W.npcManager && W.npcManager.getNPC) ? W.npcManager.getNPC(id) : null; } catch (e) { return null; } }

    // ============ 一 · 道侣需求做实 ============
    function companionData(npc) {
        if (!npc) return null;
        if (!npc._companionData) npc._companionData = { lastInteraction: 0, mood: 70, needs: { talk: 30, accompany: 30, gift: 30 } };
        if (!npc._companionData.needs) npc._companionData.needs = { talk: 30, accompany: 30, gift: 30 };
        return npc._companionData;
    }
    function daoBondIds() {
        var c = cd(); if (!c || !c.bonds) return [];
        var out = [];
        for (var id in c.bonds) { if (c.bonds[id] && c.bonds[id].type === 'dao_companion') out.push(id); }
        return out;
    }
    function clampN(v) { return Math.max(0, Math.min(100, Math.round(Number(v) || 0))); }
    // 心情由需求推导： neglect 越深，心情越低——一本账，不另立糊涂簿
    function daoMood(npcId) {
        var npc = getNpc(npcId); if (!npc) return 70;
        var d = companionData(npc);
        var n = d.needs;
        var avg = (clampN(n.talk) + clampN(n.accompany) + clampN(n.gift)) / 3;
        var m = clampN(100 - avg);
        d.mood = m;
        return m;
    }
    function moodWord(m) { return m >= 80 ? '眉眼带笑' : m >= 60 ? '安稳' : m >= 40 ? '有些冷淡' : '心有委屈'; }
    W.daoMoodWord = function (npcId) { return moodWord(daoMood(npcId)); };
    // 需求提示（面板用：TA 现在想要什么）
    W.daoNeedHints = function (npcId) {
        var npc = getNpc(npcId); if (!npc) return '';
        var n = companionData(npc).needs;
        var hints = [];
        if (clampN(n.talk) >= 60) hints.push('想和你说说话');
        if (clampN(n.accompany) >= 60) hints.push('想你陪TA出去走走');
        if (clampN(n.gift) >= 60) hints.push('眼馋一份小礼物');
        return hints.join('、');
    };
    // 双修乘子（sects-system.dualCultivate 真读）——眉眼带笑(≥80)才加成，安稳(60-79)中性
    W.getDaoMoodMul = function (npcId) {
        var m = daoMood(npcId);
        return m >= 80 ? 1.2 : (m >= 40 ? 1.0 : 0.7);
    };
    // 合击乘子（sects-system.getDaoCompanionCombos 真读）
    W.getDaoMoodCombatMul = function (npcId) {
        var m = daoMood(npcId);
        return m >= 80 ? 1.25 : (m >= 40 ? 1.0 : 0.6);
    };
    // 互动一：交心（只花时辰——话匣子打开，比什么都值钱）
    W.daoCompanionTalk = function (npcId) {
        var npc = getNpc(npcId);
        if (!npc) { msg('查无此人。', 'warning'); return false; }
        var d = companionData(npc);
        var wasHigh = clampN(d.needs.talk) >= 60;
        d.needs.talk = clampN(clampN(d.needs.talk) - 50);
        d.lastInteraction = absDay();
        advance(60, '与道侣交心');
        var aff = wasHigh ? 2 : 1;
        try { if (typeof npc.changeAffection === 'function') npc.changeAffection(aff); } catch (e) {}
        var line = wasHigh
            ? ('💬 ' + npc.name + '本来憋着话——你坐下来听，TA就从山门的琐事讲到了小时候。讲到后来自己笑了：「说出来就松快了。」（好感+' + aff + '，心情回暖）')
            : ('💬 你与' + npc.name + '说了会儿话。日子再忙，话不能省。（好感+' + aff + '）');
        log(line, 'success'); msg(line, 'success');
        return true;
    };
    // 互动二：赠礼（五十灵石置一份心意——礼物不在贵，在「记得」）
    W.daoCompanionGift = function (npcId) {
        var npc = getNpc(npcId);
        if (!npc) { msg('查无此人。', 'warning'); return false; }
        if (!payStones(50)) { msg('身上凑不出五十灵石置礼——心意也得先买得起。', 'warning'); return false; }
        var d = companionData(npc);
        d.needs.gift = clampN(clampN(d.needs.gift) - 60);
        d.lastInteraction = absDay();
        try { if (typeof npc.changeAffection === 'function') npc.changeAffection(2); } catch (e) {}
        try { if (npc.relationship) npc.relationship.love = clampN((Number(npc.relationship.love) || 0) + 1); } catch (e) {}
        var Gifts = ['一支素银簪', '一包山下新炒的栗子', '一坛桃花酿', '一方澄心砚', '一盏走马灯'];
        var g = Gifts[absDay() % Gifts.length];
        var line = '🎁 你寻了' + g + '送给' + npc.name + '。TA接过去端详半天：「你记得我喜欢这个。」（灵石-50，好感+2，深情+1）';
        log(line, 'success'); msg(line, 'success');
        return true;
    };
    // 互动三：相伴——赴约（daoDateAccept）成功后消化「想出门」的需求（包装既有桥，不另立门户）
    (function wrapDate() {
        var _orig = W.daoDateAccept;
        if (typeof _orig !== 'function') return;
        W.daoDateAccept = function (payload) {
            var r = _orig.apply(this, arguments);
            try {
                if (r && payload && payload.npcId) {
                    var npc = getNpc(payload.npcId);
                    if (npc) { var d = companionData(npc); d.needs.accompany = clampN(clampN(d.needs.accompany) - 60); }
                }
            } catch (e) {}
            return r;
        };
    })();
    // 日钩：需求随日子上涨（ neglected 有代价），高需求偶尔出声提醒
    function daoDayTick() {
        var ids = daoBondIds();
        for (var i = 0; i < ids.length; i++) {
            var npc = getNpc(ids[i]);
            if (!npc) continue;
            var d = companionData(npc);
            var n = d.needs;
            n.talk = clampN(clampN(n.talk) + 8);
            n.accompany = clampN(clampN(n.accompany) + 8);
            n.gift = clampN(clampN(n.gift) + 5);
            var m = daoMood(ids[i]);
            if (m < 40 && Math.random() < 0.3) {
                log('💔 ' + npc.name + '这几日话少了。你忙你的，TA没闹——只是灯下那影子，看着单薄。（心情：' + moodWord(m) + '）', 'warning');
            }
        }
    }
    try {
        if (W.timeSystem && typeof W.timeSystem.onNewDaySubscribe === 'function') W.timeSystem.onNewDaySubscribe(function () { try { daoDayTick(); } catch (e) {} });
        else if (W.EventBus && W.EventBus.on) W.EventBus.on('newDay', function () { try { daoDayTick(); } catch (e) {} });
    } catch (e) {}

    // ============ 二 · 亲传以上收真名弟子 ============
    var TAKE_COST = 100;      // 拜山门礼：贡献一百（走账本）
    var TAKE_AFF = 30;        // 先认识，再拜山门——好感门槛
    var TAKE_CAP = 3;         // 亲手带得出来的亲传，至多三个（精力就这么多）
    function myDisciples() {
        var d = ds(); if (!d) return [];
        if (!d._myDisciples) d._myDisciples = [];
        return d._myDisciples;
    }
    W.openTakeDisciplePanel = function () {
        var d = ds();
        if (!d || !d.isInSect) { msg('还没入门——自己都是弟子，收什么徒。', 'warning'); return; }
        var rank = d.rank == null ? 7 : d.rank;
        if (rank > 3) { msg('亲传弟子及以上方可收徒——师门的名分，得先落到你自己头上。', 'warning'); return; }
        var mine = myDisciples();
        var sn = d.sectName || d.sectId;
        var cands = [];
        try {
            var npcs = (typeof W.getSectNPCs === 'function') ? (W.getSectNPCs(sn) || []) : [];
            for (var i = 0; i < npcs.length; i++) {
                var n = npcs[i];
                if (!n || !n.id || String(n.id).indexOf('sect_disciple_') !== 0) continue;
                if (mine.indexOf(n.id) >= 0) continue;
                var aff = (n.relationship && Number(n.relationship.affection)) || 0;
                cands.push({ id: n.id, name: n.name, realm: (n.combat && n.combat.realm) || '炼气', aff: aff });
            }
        } catch (e) {}
        var html = '<div class="text-left">';
        html += '<p class="text-xs text-gray-400 mb-2">你已亲传 <b class="text-amber-300">' + mine.length + '</b> 人（至多' + TAKE_CAP + '人）。收徒要有名分：对方得认识你（好感≥' + TAKE_AFF + '），拜山门礼贡献' + TAKE_COST + '。</p>';
        if (!cands.length) {
            html += '<p class="text-sm text-gray-500">门中暂时没有可收的年轻同门——或者，你还没和他们熟起来。</p>';
        } else {
            cands.forEach(function (c) {
                var okAff = c.aff >= TAKE_AFF;
                html += '<div class="flex justify-between items-center bg-gray-800/60 p-2 rounded mb-1">'
                    + '<span class="text-sm text-gray-200">🧑‍🎓 ' + c.name + ' <span class="text-xs text-gray-500">' + c.realm + ' · 好感' + c.aff + '</span></span>'
                    + (okAff
                        ? '<button onclick="window.doTakeDisciple(\'' + c.id + '\')" class="text-xs bg-amber-700 hover:bg-amber-600 text-white px-3 py-1 rounded">收为亲传</button>'
                        : '<span class="text-xs text-gray-500">不熟——先结识再说</span>')
                    + '</div>';
            });
        }
        html += '</div>';
        modal('🧑‍🎓 收徒 · 真名弟子', html);
    };
    W.doTakeDisciple = function (npcId) {
        var d = ds();
        if (!d || !d.isInSect || (d.rank == null ? 7 : d.rank) > 3) { msg('亲传弟子及以上方可收徒。', 'warning'); return false; }
        var npc = getNpc(npcId);
        if (!npc) { msg('查无此人。', 'warning'); return false; }
        var mine = myDisciples();
        if (mine.indexOf(npcId) >= 0) { msg('已经是你的人了。', 'info'); return false; }
        if (mine.length >= TAKE_CAP) { msg('亲手带得出来的亲传至多三个——再多，就教不过来了。', 'warning'); return false; }
        var aff = (npc.relationship && Number(npc.relationship.affection)) || 0;
        if (aff < TAKE_AFF) { msg('不熟——先结识再说。人家凭什么拜你？', 'warning'); return false; }
        var paid = false;
        try { paid = (typeof W.sectSpendContribution === 'function') ? W.sectSpendContribution(TAKE_COST, '收徒·拜山门礼') : false; } catch (e) {}
        if (!paid) {
            if ((Number(d.contribution) || 0) < TAKE_COST) { msg('拜山门礼要贡献' + TAKE_COST + '——不够。', 'error'); return false; }
            d.contribution -= TAKE_COST;
        }
        mine.push(npcId);
        npc._masterIsPlayer = true;
        npc._cultivationProgress = Number(npc._cultivationProgress) || 0;
        try { if (typeof npc.changeAffection === 'function') npc.changeAffection(5); } catch (e) {}
        advance(60, '收徒拜师礼');
        var line = '🎓 ' + npc.name + '今日正式拜入你门下——敬了茶，磕了头，起身时眼睛亮着。从此传功、出师、反哺，都是你们两个人的事。（贡献-' + TAKE_COST + '）';
        log(line, 'success'); msg(line, 'success');
        try { if (typeof W.openDisciplePanel === 'function') W.openDisciplePanel(); } catch (e) {}
        return true;
    };
    W.getMyNamedDisciples = function () { return myDisciples().slice(); };

    // ============ 三 · 日常事件真名注入（事件里的人是真档案） ============
    function kinHash(str) {
        var h = 0;
        str = String(str || '');
        for (var i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) % 9973; }
        return h;
    }
    // 从本派真档案里按种子挑一个具名同门（弟子优先，长老掌门兜底）
    W.sectKinPick = function (sectName, seed) {
        try {
            var npcs = (typeof W.getSectNPCs === 'function') ? (W.getSectNPCs(sectName) || []) : [];
            var young = npcs.filter(function (n) { return n && n.id && String(n.id).indexOf('sect_disciple_') === 0 && n.name; });
            var pool = young.length ? young : npcs.filter(function (n) { return n && n.name; });
            if (!pool.length) return null;
            var h = typeof seed === 'number' ? seed : kinHash(seed);
            var pick = pool[h % pool.length];
            return pick.name;
        } catch (e) { return null; }
    };
    // 把事件文本里第一个泛称（弟子/同门/师兄…）换成真名——没有泛称就不硬塞
    W.sectKinify = function (text, sectName, kinName) {
        text = String(text || '');
        if (!text) return text;
        var m = /(弟子|同门|师兄|师弟|师姐|师妹)/.exec(text);
        if (!m) return text;
        var name = kinName || W.sectKinPick(sectName, kinHash(text) + absDay());
        if (!name) return text;
        return text.replace(m[0], m[0] + '「' + name + '」');
    };

    // 探针
    W.sectKinProbe = function () {
        var out = { myDisciples: myDisciples(), bonds: {} };
        daoBondIds().forEach(function (id) {
            out.bonds[id] = { mood: daoMood(id), word: moodWord(daoMood(id)), mul: W.getDaoMoodMul(id), combatMul: W.getDaoMoodCombatMul(id), needs: JSON.parse(JSON.stringify(companionData(getNpc(id)).needs)) };
        });
        return out;
    };

    console.log('[sect-kin] 弟子有脸、需求做实已注册：道侣三互动+心情真乘子（双修/合击）+ 亲传收真名弟子 + 日常事件真名注入');
})();
