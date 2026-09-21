// ==================== jealousy-collective.js - 集体大戏 + 风评传闻网（情缘三期）v20.84 ====================
// 依赖：jealousy-social.js（_jealAllRivals / _jealHasFeelings / _jealGuestInfo / _jealEnsureAcquaintance /
//       _jealWriteback / _jealPartySuspects / 开帘播种）、jealousy-assembly.js（ASM_VOICE_BLOCKS 声口档案 /
//       _asmLedgerGet 照面账本）、npc-personal-events.js（NPC_PERSONAL_EVENTS / triggerPersonalEvent /
//       others+pair 结算 / anyLocation 闸口）、festival-bridge.js（FESTIVAL_DEFS / bonds[*].festival 账格）。
// 加载顺序：在 jealousy-assembly.js 之后。
//
// 三期交付三件：
//   一、四幕集体大戏——上元灯夜撞约 / 比武大会看台变色 / 坊市撞礼 / 道侣大典终局戏。
//       集体戏的选人依据是关系网引擎的「世上所有把你放在心上的人」（按好感深浅排序），
//       声口全部取装配引擎的六段档案——人换了，调子不换。每一幕都有真实由头：
//       灯节的灯市是公共场所（推了帖的人也会去），擂台赢了看台上自然有人，坊市的摊子
//       就那么大，大典的宾客名单藏不住。同行即嫌疑全面接入：你带着谁来，谁就在戏里。
//   二、风评传闻网——你的情缘账变成江湖传闻。铁律与现实六原则同源：传闻只从真实信息来
//       （帖子的账、照面的账、连胜的账、道侣的旗），零编造；传闻有来路（茶馆说书人/
//       坊市行商/灯市人堆），传到当事人耳朵里时，来路一并传到。你在城里听风，风进山门
//       找当事人——当事人用各自的本行声口（暗刺段）把风评问到你脸上。
//   三、终局归档——大典落幕，所有活跃的风评结为「旧话」，传闻网为你这一世的情缘账收官。
//
// 收敛纪律照旧：一人一执念，情绪走物件细节；檀望舒在集体戏里也全段借调；伏璃茵不哭；
// 隗九爻的山楂不吃；无咎不入集体戏名册场（他的灶台戏在专属线里已足）——但大典他若对你有心，照请。

(function () {
    'use strict';

    // ============ 〇、公共小件 ============
    function _cl() { return (typeof window !== 'undefined') ? window : null; }
    function _today() {
        try {
            if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') {
                return Number(window.timeSystem.getAbsoluteDay()) || 1;
            }
            if (window.timeSystem && window.timeSystem.gameTime) return Number(window.timeSystem.gameTime.currentDay) || 1;
        } catch (e) {}
        return 1;
    }
    function _doy() { var d = _today(); return ((d - 1) % 360) + 1; }
    function _rivals(excludeId) {
        return (typeof window._jealAllRivals === 'function') ? window._jealAllRivals(excludeId) : [];
    }
    function _vb(id) {
        return (window.ASM_VOICE_BLOCKS && window.ASM_VOICE_BLOCKS[id]) || null;
    }
    function _sectOf(id) {
        var roster = (typeof window._jealRosterAll === 'function') ? window._jealRosterAll() : [];
        for (var i = 0; i < roster.length; i++) if (roster[i].id === id) return roster[i].sect || '';
        if (typeof id === 'string' && id.indexOf('sect_leader_') === 0) return id.slice('sect_leader_'.length);
        return '';
    }
    var ROSTER_SECTS = null;
    function _allSects() {
        if (ROSTER_SECTS) return ROSTER_SECTS;
        ROSTER_SECTS = [];
        var roster = (typeof window._jealRosterAll === 'function') ? window._jealRosterAll() : [];
        roster.forEach(function (r) { if (r.sect && ROSTER_SECTS.indexOf(r.sect) < 0) ROSTER_SECTS.push(r.sect); });
        return ROSTER_SECTS;
    }
    function _inCity() {
        var loc = (window.currentCharData && window.currentCharData.location) || '';
        return !!loc && _allSects().indexOf(loc) < 0;
    }
    function _npc(id) { return (window.npcManager && window.npcManager.getNPC) ? window.npcManager.getNPC(id) : null; }
    function _modalOpen() { return !!(document.querySelector && document.querySelector('.personal-event-modal')); }

    // 集体戏账本（持久化）：灯节场次 / 坊市冷却 / 擂台冷却 / 大典一次性 / 风评队列
    var CL_KEY = 'xianxia_collective_ledger';
    var _cled = null;
    function _cledLoad() {
        if (_cled) return _cled;
        _cled = { lanterns: {}, lastMarket: 0, lastStand: 0, weddingDone: false, rumors: [] };
        try {
            var raw = localStorage.getItem(CL_KEY);
            if (raw) {
                var p = JSON.parse(raw);
                if (p && typeof p === 'object') {
                    _cled.lanterns = p.lanterns || {};
                    _cled.lastMarket = p.lastMarket || 0;
                    _cled.lastStand = p.lastStand || 0;
                    _cled.weddingDone = !!p.weddingDone;
                    _cled.rumors = Array.isArray(p.rumors) ? p.rumors : [];
                }
            }
        } catch (e) {}
        return _cled;
    }
    function _cledSave() { try { localStorage.setItem(CL_KEY, JSON.stringify(_cledLoad())); } catch (e) {} }
    window._collectiveLedgerGet = _cledLoad;
    window._collectiveLedgerReload = function () { _cled = null; return _cledLoad(); };

    var _seq = 0;
    function _eid(tag) { return 'col_' + tag + '_' + (++_seq) + '_' + _today(); }

    function _fire(ev) {
        if (!ev) return;
        try { NPC_PERSONAL_EVENTS[ev.id] = ev; } catch (e) { return; }
        setTimeout(function () {
            if (_modalOpen()) return;
            var npc = _npc(ev.npcId);
            if (!npc) return;
            if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) return;
            if (typeof triggerPersonalEvent === 'function') triggerPersonalEvent(ev.id);
        }, 1200);
    }

    // 同行即嫌疑：你带着谁来，谁就在戏里（嫌疑人不是台上人的时候，加一拍旁白）
    function _suspectBeat(hostId, castIds) {
        var s = null;
        try { s = (typeof window._jealPartySuspects === 'function') ? window._jealPartySuspects(hostId) : null; } catch (e) {}
        if (!s || castIds.indexOf(s.id) >= 0) return null;
        return s;
    }

    // 台上众人两两之间：照面即结识（集体戏一场种多对，账全落社交真源）
    function _seedAllPairs(hostId, castIds) {
        castIds.forEach(function (gid) {
            if (gid !== hostId && typeof window._jealEnsureAcquaintance === 'function') {
                window._jealEnsureAcquaintance(hostId, gid);
            }
        });
        for (var i = 0; i < castIds.length; i++) {
            for (var j = i + 1; j < castIds.length; j++) {
                if (typeof window._jealEnsureAcquaintance === 'function') window._jealEnsureAcquaintance(castIds[i], castIds[j]);
            }
        }
    }

    // ============ 一、风评传闻网 ============
    // 传闻只从真实信息来：帖子的账（festival-bridge）/ 照面的账（装配引擎）/ 连胜的账（擂台）/
    // 道侣的旗（npc flag）/ 人多的账（关系网）。每条风评带 origin（来路），传到谁耳朵里都报来路。
    var RUMOR_ORIGIN = ['茶馆说书人', '坊市行商', '灯市人堆', '镖路的闲话', '渡口等船的人'];

    function _rumorFacts() {
        var facts = [];
        var cd = window.currentCharData;
        if (!cd) return facts;
        var today = _today();
        // ① 帖子的账：近十五日内推过/放过谁的帖
        try {
            var bonds = cd.bonds || {};
            for (var bid in bonds) {
                var b = bonds[bid];
                if (!b || b.type !== 'dao_companion' || !b.festival) continue;
                for (var fk in b.festival) {
                    var ent = b.festival[fk];
                    if (!ent || (ent.status !== 'declined' && ent.status !== 'stood')) continue;
                    if (!(ent.dueDay > 0) || today - ent.dueDay > 15 || today < ent.dueDay) continue;
                    facts.push({ type: 'snub', about: [bid], text: '「节前有人递了帖，节夜有人从东街走到西街，等一个没来的人。等的人没来，看的人可不少——听说那位心里的人，当晚在别处陪别人。」' });
                    break;
                }
            }
        } catch (e) {}
        // ② 照面的账：近三十日两场以上双人照面
        try {
            var ldg = (typeof window._asmLedgerGet === 'function') ? window._asmLedgerGet() : [];
            var recent = ldg.filter(function (x) { return x.day && today - x.day <= 30 && today >= x.day; });
            if (recent.length >= 2) {
                var ids = {};
                recent.slice(-4).forEach(function (x) { ids[x.h] = 1; ids[x.g] = 1; });
                facts.push({ type: 'duels', about: Object.keys(ids), text: '「近来两家的贵人频频登门互访，问档的问档、对账的对账——明面上是公事，私底下江湖都传：争的是同一个人。」' });
            }
        } catch (e) {}
        // ③ 人多的账：世上把你放在心上的超过三位
        var rv = _rivals(null);
        if (rv.length >= 3) {
            facts.push({ type: 'multi', about: rv.slice(0, 4).map(function (r) { return r.id; }), text: '「说书的拍了下醒木：天下之大，偏偏有一处灯下，坐着好几个门派的心事。你道那心事向着谁？向着同一位。满堂哄笑，只有当事人笑不出来。」' });
        }
        // ④ 连胜的账：擂台连胜三场以上
        try {
            if (cd.arenaStreak >= 3) {
                facts.push({ type: 'arena', about: rv.slice(0, 3).map(function (r) { return r.id; }), text: '「擂台上那位连赢了' + cd.arenaStreak + '场。看台上的事比擂台热闹——有人攥碎了茶盏，有人数着数目忘了数，还有人看完了全程，回去把灯点到三更。」' });
            }
        } catch (e) {}
        // ⑤ 道侣的账：已结道侣而世上仍有人未放下
        try {
            var daoId = _daoCompanionId();
            if (daoId && rv.filter(function (r) { return r.id !== daoId; }).length >= 1) {
                facts.push({ type: 'dao', about: [daoId], text: '「红帖已经下了。江湖上说，大礼那日宾客名单最难排——请谁不请谁，请来了坐哪一席，都是学问。有人劝主家少请几位，主家说：该来的都会来，不来的，心里也到了。」' });
            }
        } catch (e) {}
        return facts;
    }

    function _rumorTick() {
        var led = _cledLoad();
        var today = _today();
        // 清过期风评（三十日无人传，风就停了）
        led.rumors = led.rumors.filter(function (r) { return today - (r.day || 0) <= 30; });
        if (led.rumors.length >= 3) { _cledSave(); return null; }
        var facts = _rumorFacts();
        // 同类型的风评，三十日内只刮一阵
        facts = facts.filter(function (f) {
            return !led.rumors.some(function (r) { return r.type === f.type; });
        });
        if (!facts.length) { _cledSave(); return null; }
        if (Math.random() >= 0.2) { _cledSave(); return null; }
        var f = facts[Math.floor(Math.random() * facts.length)];
        var rumor = {
            id: 'rumor_' + f.type + '_' + today,
            type: f.type, text: f.text, about: f.about, day: today,
            origin: RUMOR_ORIGIN[(today + f.type.length) % RUMOR_ORIGIN.length],
            heardPlayer: false, delivered: {}
        };
        led.rumors.push(rumor);
        _cledSave();
        return rumor;
    }
    window._rumorTick = _rumorTick;
    window._rumorActive = function () { return _cledLoad().rumors.slice(); };

    // 你在城里听风：茶馆里说书人拍醒木，说的就是你（只读真实账，零编造）
    function _rumorHear() {
        if (!_inCity() || _modalOpen()) return false;
        var led = _cledLoad();
        var fresh = led.rumors.filter(function (r) { return !r.heardPlayer; });
        if (!fresh.length) return false;
        if (Math.random() >= 0.35) return false;
        var r = fresh[0];
        r.heardPlayer = true;
        _cledSave();
        if (typeof window.showModal === 'function') {
            window.showModal('🍵 茶馆风评', '<p style="color:#d1d5db;font-size:14px;line-height:1.7">' +
                '你路过茶馆，' + r.origin + '正说到一半，压低了嗓门——<br><br>' + r.text +
                '<br><br>满堂茶客哄笑。你站在门口，进去也不是，走开也不是。</p>');
        }
        return true;
    }

    // 风进山门：传闻传到当事人耳朵里，Ta 用本行声口把风评问到你脸上
    function _rumorDeliver() {
        var loc = (window.currentCharData && window.currentCharData.location) || '';
        if (!loc || _allSects().indexOf(loc) < 0) return null; // 只在门派里送风
        var led = _cledLoad();
        var today = _today();
        for (var i = 0; i < led.rumors.length; i++) {
            var r = led.rumors[i];
            for (var j = 0; j < (r.about || []).length; j++) {
                var nid = r.about[j];
                if (_sectOf(nid) !== loc) continue;
                if (r.delivered[nid]) continue;
                var vb = _vb(nid);
                var npc = _npc(nid);
                if (!vb || !npc) continue;
                if (!npc.memory || !(npc.memory.firstMet === true || (npc.memory.meetCount || 0) > 0)) continue;
                if (((npc.relationship && npc.relationship.affection) || 0) < 40) continue;
                if (Math.random() >= 0.4) return null;
                r.delivered[nid] = today;
                _cledSave();
                try { npc.memory._rumorHeard = { text: r.text, day: today, origin: r.origin }; } catch (e) {}
                var eid = _eid('rumor');
                return {
                    id: eid, npcId: nid, title: '风进山门', icon: '🌬️',
                    desc: '江湖的风评，刮进了' + loc + '——' + vb.name + '把风里的话，原样问到你脸上。',
                    minAffection: 40, trigger: { random: 0.5 }, cooldown: 0, flag: eid + '_done',
                    scenes: [
                        { speaker: 'narrator', text: '风是' + r.origin + '带进山门的。' + r.text + ' 这话在江湖上刮了' + (today - r.day + 1) + '天，今日刮到了' + vb.name + '的耳朵里。', type: 'description' },
                        { speaker: 'npc', text: vb.probe, emotion: 'serious' },
                        { speaker: 'player_select', text: '风评当面。你怎么答？', options: [
                            { text: '「风里说的，有真有假。真的那半——我认。」', effect: 'admit' },
                            { text: '「说书的嘴，镖路的腿——风评而已，当不得真。」', effect: 'deny' },
                            { text: '「先别问我。风里怎么传你的——你听着了么？」', effect: 'reverse' }
                        ]}
                    ],
                    effects: function (npc2, choice) {
                        var aff = 0, msg = '';
                        if (choice === 'admit') { aff = 4; msg = vb.name + '听完「我认」两个字，半晌没言语。风评这东西，传了几天没人认，你认了——风就停了。' + vb.concede; }
                        else if (choice === 'deny') { aff = -3; msg = '「当不得真。」' + vb.name + '把这四个字咀嚼了一遍，点了点头，又摇了摇头：「风评确实当不得真。可风——」' + vb.exit; }
                        else { aff = 2; msg = '你把话头递了回去。' + vb.name + '愣了一下——江湖上人人都想问Ta，没人问过Ta听见了什么。半晌，' + (vb.name) + '极轻地答了半句，又收住：「风里怎么传我——传的是数目。数目不会错。错的是……」话没说完。' + vb.exit; }
                        return { affection: aff, msg: msg };
                    }
                };
            }
        }
        return null;
    }

    // ============ 二、道侣旗读取（大典幕用） ============
    function _daoCompanionId() {
        var roster = (typeof window._jealRosterAll === 'function') ? window._jealRosterAll() : [];
        for (var i = 0; i < roster.length; i++) {
            var npc = _npc(roster[i].id);
            if (npc && npc.hasFlag && npc.hasFlag('dao_companion')) return roster[i].id;
        }
        return null;
    }
    window._collectiveDaoId = _daoCompanionId;

    // ============ 三、四幕集体大戏 ============
    // 选角：世上把你放在心上的人（好感排序），有声口档案的入戏；大典另加道侣为主人。
    function _cast(n, excludeIds) {
        excludeIds = excludeIds || [];
        var rv = _rivals(null).filter(function (r) { return _vb(r.id) && excludeIds.indexOf(r.id) < 0; });
        return rv.slice(0, n).map(function (r) { return r.id; });
    }

    // ---- 幕一：上元灯夜撞约 ----
    // 由头全是实账：四大节日（上元/七夕/中秋/除夕）当夜，灯市是公共场所——
    // 你推了帖的人也来了（帖子的账为证），你陪着的人也看见了。
    function composeLanternNight(fesName) {
        var cast = _cast(2);
        if (cast.length < 2) return null;
        var hostId = cast[0], guestId = cast[1];
        var hb = _vb(hostId), gb = _vb(guestId);
        var hname = hb.name, gname = gb.name;
        var suspect = _suspectBeat(hostId, cast);
        var eid = _eid('lantern');
        // 帖子的账：今夜你推了谁的帖（实据才许点名）
        var snubbed = null;
        try {
            var bonds = (window.currentCharData && window.currentCharData.bonds) || {};
            cast.forEach(function (cid) {
                var b = bonds[cid];
                if (!b || !b.festival) return;
                for (var fk in b.festival) {
                    var ent = b.festival[fk];
                    if (ent && (ent.status === 'declined' || ent.status === 'stood') && (ent.fname === fesName || ent.festival === fesName)) snubbed = cid;
                }
            });
        } catch (e) {}
        var snubName = snubbed ? (_vb(snubbed) || {}).name : null;
        _seedAllPairs(hostId, cast);

        var scenes = [
            { speaker: 'narrator', text: fesName + '夜，灯市如昼。花灯从东街挂到西街，人挤人，谁认得谁全凭灯影。你提着灯走到桥头——桥两头，同时来了两个人。' + (snubName ? '其中一位，是你今夜推了帖的：帖上写的「灯下等你」，你回的是「有事」。此刻「有事」的你，站在灯市正中央。' : '两位都不是约来的——灯市这种地方，心里装着事的人，走着走着就到了。'), type: 'description' },
            { speaker: 'npc', text: hb.open_again, emotion: 'neutral' },
            { speaker: 'npc', asNpc: guestId, text: gb.open_first, emotion: 'neutral' },
            { speaker: 'narrator', text: '人流一涌，两盏灯撞在一处，灯影里两张脸同时抬起来——都认出了彼此，也都认出了你站在中间。' + (suspect ? '更要紧的是：你身旁还站着一位同行的江湖人。' + suspect.name + '提着灯，什么都没说——不必说，在场本身就是证据。' : '桥头的糖人摊子还在吆喝，桥上的三个人谁也没动。'), type: 'description' },
            { speaker: 'npc', text: hb.probe, emotion: 'serious' },
            { speaker: 'npc', asNpc: guestId, text: gb.probe, emotion: 'serious' },
            { speaker: 'player_select', text: '一盏灯，两双眼睛，满街人看热闹。' + fesName + '的灯桥，你跟谁走？', options: [
                { text: '把灯递给' + hname + '：「桥窄。你先——灯我替你提着。」', effect: 'host_walk' },
                { text: '转向' + gname + '：「远来的客先走。灯市的规矩，客在前。」', effect: 'guest_walk' },
                { text: '两盏灯都不接，自己掏钱买下桥头摊上最大的一盏走马灯，挂在桥栏上：「灯挂这儿，谁也不跟——今夜灯替我陪你们两位，我请你们吃糖人。」（代价：走马灯八十文当场付账，灯市散后你独自守灯到三更）', effect: 'lantern_all' }
            ]}
        ];
        return {
            id: eid, npcId: hostId, guestId: guestId,
            title: fesName + '撞约', icon: '🏮',
            desc: '灯市桥头，两盏灯同时到了——推了的帖、没推的心，今夜一起在灯下。',
            minAffection: 45, trigger: { random: 0.5 }, cooldown: 0, flag: eid + '_done',
            requireGuestFeelings: true, anyLocation: true, _collective: 'lantern',
            scenes: scenes,
            effects: function (npc, choice) {
                var aff = 0, oaff = 0, pd = 0, msg = '';
                if (choice === 'host_walk') { aff = 6; oaff = -4; pd = -5; }
                else if (choice === 'guest_walk') { aff = -4; oaff = 6; pd = -5; }
                else {
                    aff = 4; oaff = 4; pd = 7;
                    try {
                        if (window.inventory && window.inventory.currency && (window.inventory.currency.copper || 0) >= 80) {
                            window.inventory.currency.copper -= 80;
                            if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI();
                        } else if (window.currentCharData) {
                            window.currentCharData.energy = Math.max(0, (window.currentCharData.energy || 0) - 30);
                        }
                    } catch (e) {}
                }
                if (choice === 'lantern_all') {
                    msg = '走马灯挂上桥栏，转起来满桥都是影子。' + hname + '与' + gname + '隔着灯对望了一眼——头一回，两个人的目光没有落在你身上，落在彼此身上。糖人吃了三支，灯市散到三更，两个人一左一右靠着桥栏，谁也没先走。' + hname + '先开口——' + hb.concede + ' ' + gname + '把最后一支糖人的竹签收进袖中——' + gb.exit + ' 你独自守灯到三更，灯油烧尽的时候，满城的花灯都歇了，只有走马灯还转了最后半圈。';
                } else {
                    var walker = (choice === 'host_walk') ? hname : gname;
                    var left = (choice === 'host_walk') ? gname : hname;
                    var lb = (choice === 'host_walk') ? gb : hb;
                    msg = '你跟' + walker + '走过了灯桥。桥那头的灯影里，' + left + '站了一息，转身进了人流——' + lb.exit + ' 走到桥心你回头看了一眼：满街花灯，有一盏前头空出来的位置，从此记在两个人的账上。';
                }
                return { affection: aff, msg: msg, others: [{ id: guestId, affection: oaff }], pair: { delta: pd, with: guestId } };
            }
        };
    }

    // ---- 幕二：比武大会看台变色 ----
    // 由头：你刚在擂台赢了（arena:won 真事件为凭）。抬头看台——把你放在心上的人，
    // 不知怎么都在。看的不是擂台，是你。
    function composeArenaStand(streak) {
        var cast = _cast(2);
        if (cast.length < 2) return null;
        var hostId = cast[0], guestId = cast[1];
        var hb = _vb(hostId), gb = _vb(guestId);
        var hname = hb.name, gname = gb.name;
        var suspect = _suspectBeat(hostId, cast);
        var eid = _eid('stand');
        _seedAllPairs(hostId, cast);
        return {
            id: eid, npcId: hostId, guestId: guestId,
            title: '看台变色', icon: '🏟️',
            desc: '你赢了这一场。看台上两位的脸色，各自变了一回——变的不是同一回事。',
            minAffection: 45, trigger: { random: 0.5 }, cooldown: 0, flag: eid + '_done',
            requireGuestFeelings: true, anyLocation: true, _collective: 'stand',
            scenes: [
                { speaker: 'narrator', text: '擂台上的尘土还没落定——你赢了' + (streak > 1 ? '第' + streak + '场' : '这一场') + '。报榜的锣响过，你抬头看台：东边一排，' + hname + '不知什么时候来的，坐得笔直；西边廊下，' + gname + '倚着柱子，像已经站了很久。' + (suspect ? '你身边那位同行的' + suspect.name + '也看了过来——看的不是看台，是看台上看你的人。' : '两边隔着整座擂台，目光在你头顶上碰了一下，各自收回去。'), type: 'description' },
                { speaker: 'npc', text: hb.open_again, emotion: 'neutral' },
                { speaker: 'npc', asNpc: guestId, text: gb.open_again, emotion: 'neutral' },
                { speaker: 'narrator', text: '下一场的锣还没敲。看台上有眼力的都已经看出来了：这一场擂台，台上打的是拳脚，台下较的是别的东西。', type: 'description' },
                { speaker: 'npc', text: hb.probe, emotion: 'serious' },
                { speaker: 'npc', asNpc: guestId, text: gb.probe, emotion: 'serious' },
                { speaker: 'player_select', text: '下一场点名之前，你朝哪边拱手？', options: [
                    { text: '朝' + hname + '那排拱手：「这一场，赢给东边看台。」', effect: 'east' },
                    { text: '把手里兵刃抛给西边廊下的' + gname + '：「替我收着——赢完这场来取。」（兵刃过手，等于当众把信物押给一位）', effect: 'west' },
                    { text: '朝四面看台团团一揖，朗声：「这一场，赢给所有来看的人——包括没来的。」（代价：连战三场不下台，精力见底，当日再无力气赴任何人的约）', effect: 'all' }
                ]}
            ],
            effects: function (npc, choice) {
                var aff = 0, oaff = 0, pd = 0, msg = '';
                if (choice === 'east') { aff = 6; oaff = -4; pd = -4; }
                else if (choice === 'west') { aff = -4; oaff = 7; pd = -4; }
                else {
                    aff = 3; oaff = 3; pd = 6;
                    try { if (window.currentCharData) window.currentCharData.energy = Math.max(0, (window.currentCharData.energy || 0) - 40); } catch (e) {}
                }
                if (choice === 'all') {
                    msg = '你连战三场，三场全赢。第三场下来，看台上的人走了一半，没走的那两位在东西两边各自坐到了掌灯。' + hname + '临走时——' + hb.exit + ' ' + gname + '在廊下站到你下台——' + gb.exit + ' 当夜你的力气用尽了，谁的约都赴不动——可江湖上从此多了一条新话头：擂台那位赢给「所有来看的人」，两位贵人听了同一句，各自记了一辈子。';
                } else if (choice === 'east') {
                    msg = '东边看台静了一息，随即有人喝彩。' + hname + '端坐没动，只有耳根在满场尘土里红得清清楚楚——' + hb.concede + ' 西边廊下，' + gname + '把那根倚了半日的柱子让了出来，转身下台——' + gb.exit;
                } else {
                    msg = '兵刃划着弧线飞过去，' + gname + '抬手接住，接得极稳——满场看着这一幕，都当是高手之间的托付。只有' + gname + '自己知道接住的是什么——' + gb.concede + ' 东边看台上，' + hname + '盯着那柄被收走的兵刃看了三息，起身，走人——' + hb.exit;
                }
                return { affection: aff, msg: msg, others: [{ id: guestId, affection: oaff }], pair: { delta: pd, with: guestId } };
            }
        };
    }

    // ---- 幕三：坊市撞礼 ----
    // 由头：坊市的摊子就那么大。你手里刚挑了一样东西，转身撞上两个人——
    // 两位各自也在挑，挑的东西，明眼人一看就知道是挑给谁的。
    function composeMarketClash() {
        var cast = _cast(2);
        if (cast.length < 2) return null;
        var hostId = cast[0], guestId = cast[1];
        var hb = _vb(hostId), gb = _vb(guestId);
        var hname = hb.name, gname = gb.name;
        var metBefore = false;
        try {
            var hn = _npc(hostId);
            metBefore = !!(hn && hn.npcRelationships && hn.npcRelationships[guestId]);
        } catch (e) {}
        var suspect = _suspectBeat(hostId, cast);
        var eid = _eid('market');
        _seedAllPairs(hostId, cast);
        return {
            id: eid, npcId: hostId, guestId: guestId,
            title: '坊市撞礼', icon: '🎁',
            desc: '一个摊子，三双手，两样挑了半天的东西——撞礼撞在了同一句「这个多少钱」上。',
            minAffection: 45, trigger: { random: 0.5 }, cooldown: 0, flag: eid + '_done',
            requireGuestFeelings: true, anyLocation: true, _collective: 'market',
            scenes: [
                { speaker: 'narrator', text: '坊市尽头有个老摊，专卖些不值钱的小物件：扇坠、灯穗、木簪、铜铃。你在摊前站了一炷香，手里捏着一样东西没付钱。身后同时响起两个声音——' + (metBefore ? '两位是照过面的，彼此颔首，颔首完目光一起落到你手里。' : '两位是头一回照面，彼此见礼，见完礼目光一起落到你手里。'), type: 'description' },
                { speaker: 'npc', text: hb.open_again, emotion: 'neutral' },
                { speaker: 'npc', asNpc: guestId, text: gb.open_first, emotion: 'neutral' },
                { speaker: 'narrator', text: '摊子统共一丈宽。' + hname + '手里挑了半天的东西还搁在摊角，' + gname + '袖口露出半截也挑了半天的物件——两样东西都没付钱，两样东西挑给谁，满坊市只有三个人不知道：摊主知道，' + (suspect ? '你身旁同行的' + suspect.name + '知道——提着两个包裹，什么都没说。' : '你早就知道。'), type: 'description' },
                { speaker: 'npc', text: hb.probe, emotion: 'serious' },
                { speaker: 'npc', asNpc: guestId, text: gb.probe, emotion: 'serious' },
                { speaker: 'player_select', text: '你手里那样东西还没付钱，两双眼睛都看着它。怎么结账？', options: [
                    { text: '把手里的东西付了账，递给' + hname + '：「挑了半晌，就它配得上主家。」', effect: 'to_host' },
                    { text: '把手里的东西付了账，塞进' + gname + '袖中：「远来的客，坊市的规矩——客带礼走。」', effect: 'to_guest' },
                    { text: '招呼摊主：「摊上两样没付钱的，并我手里这件，一起包了。」三件全买，当场分给两位，自己那件塞回怀里——三件的钱一人扛（代价：铜钱一百二十文，不够就赊账，坊市记下你的账）', effect: 'buy_all' }
                ]}
            ],
            effects: function (npc, choice) {
                var aff = 0, oaff = 0, pd = 0, msg = '';
                if (choice === 'to_host') { aff = 6; oaff = -5; pd = -6; }
                else if (choice === 'to_guest') { aff = -5; oaff = 6; pd = -6; }
                else {
                    aff = 4; oaff = 4; pd = 8;
                    try {
                        if (window.inventory && window.inventory.currency && (window.inventory.currency.copper || 0) >= 120) {
                            window.inventory.currency.copper -= 120;
                            if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI();
                        } else {
                            window.currentCharData.flags = window.currentCharData.flags || {};
                            window.currentCharData.flags.marketDebt = (window.currentCharData.flags.marketDebt || 0) + 120;
                            if (window.showMessage) window.showMessage('坊市记下了你的赊账：一百二十文', 'warning');
                        }
                    } catch (e) {}
                }
                if (choice === 'buy_all') {
                    msg = '摊主麻利地包了三个纸包。' + hname + '接过属于自己的那一个，捏在手里没有打开——' + hb.concede + ' ' + gname + '把纸包收进袖中，收得极稳——' + gb.exit + ' 你怀里那件自留的，是摊上最不值钱的一样。走出坊市很远，你把它掏出来看了一眼——摊主多包了一层纸，纸上有一行小字：「三件并一件，老汉卖了四十年货，头一回见这样结账的。」';
                } else {
                    var got = (choice === 'to_host') ? hname : gname;
                    var not = (choice === 'to_host') ? gname : hname;
                    var nb = (choice === 'to_host') ? gb : hb;
                    msg = got + '收了礼，没说话——' + ((choice === 'to_host') ? hb.concede : gb.concede) + ' 摊角那件挑了半天的东西，' + not + '没有再拿起来。' + nb.exit;
                }
                return { affection: aff, msg: msg, others: [{ id: guestId, affection: oaff }], pair: { delta: pd, with: guestId } };
            }
        };
    }

    // ---- 幕四：道侣大典终局戏 ----
    // 由头：红帖下了，大礼当日。宾客名单最难排——该来的都来了。
    // 主人是道侣，席上是世上其他把你放在心上的人。风评网在此收官：所有活跃风评结为旧话。
    function composeWeddingFinale() {
        var daoId = _daoCompanionId();
        if (!daoId) return null;
        var db = _vb(daoId);
        var cast = _cast(2, [daoId]);
        if (cast.length < 1) return null;
        var guests = cast.slice(0, 2);
        var g1 = _vb(guests[0]);
        var g2 = guests[1] ? _vb(guests[1]) : null;
        var eid = _eid('wedding');
        _seedAllPairs(daoId, guests);
        var guestScenes = [
            { speaker: 'npc', asNpc: guests[0], text: g1.open_again, emotion: 'neutral' },
            { speaker: 'narrator', text: '宾客的礼各归各的门派规矩，话却都往同一处去。酒过三巡，席间的空气松了一线——最难的时刻到了：贺词。', type: 'description' },
            { speaker: 'npc', asNpc: guests[0], text: g1.concede, emotion: 'deep' }
        ];
        if (g2) {
            guestScenes.push({ speaker: 'npc', asNpc: guests[1], text: g2.concede, emotion: 'deep' });
        }
        var scenes = [
            { speaker: 'narrator', text: '大典这一日，红绸从山门一直铺到正堂。江湖上来了一半：来贺的、来看的、来把心事结清的。你站在堂前，' + (db ? db.name : '你的道侣') + '立在身侧。宾客名单排了三天——最难的不是请谁，是谁会不请自来。', type: 'description' },
            { speaker: 'npc', text: db ? db.open_again : '「你来了。」', emotion: 'warm' },
            { speaker: 'narrator', text: '赞礼唱名，宾客入席。唱到中途，堂外进来几位不在名单上的——' + guests.map(function (g) { return (_vb(g) || {}).name; }).join('、') + '。满堂的目光唰地集中过去，又唰地收回来——江湖人的体面，看破不说破。', type: 'description' }
        ].concat(guestScenes, [
            { speaker: 'narrator', text: '贺词说尽，该拜堂了。三杯酒摆在案上：一敬月老，二敬高堂，三敬——满座江湖。三杯都只有一只手能先举。' + (suspectLine(guests)), type: 'description' },
            { speaker: 'player_select', text: '大典终局，三杯酒。你先举哪一杯？', options: [
                { text: '先敬身侧人：「这一杯，敬眼前。往后的每一杯，都从这一杯里分出。」', effect: 'spouse' },
                { text: '先敬不请自来的旧友：「这一杯，敬江湖。你们能来——我这大礼，才算全了。」', effect: 'guests' },
                { text: '三杯齐举，先洒一杯在地上：「这一杯谁也不敬——敬这些年没敢说出口的话。说出口的都在堂上，没说出口的，都在土里，来年开花。」（代价：当着满座江湖把酒喝干，醉到三更，第二天整整一日不省人事）', effect: 'earth' }
            ]}
        ]);
        function suspectLine() {
            var s = null;
            try { s = (typeof window._jealPartySuspects === 'function') ? window._jealPartySuspects(daoId) : null; } catch (e) {}
            if (s && guests.indexOf(s.id) < 0) return '你带进堂的' + s.name + '坐在末席，从始至终替你挡了两回酒。';
            return '';
        }
        return {
            id: eid, npcId: daoId, guestId: guests[0],
            title: '道侣大典', icon: '💒',
            desc: '红帖落地，宾客满堂——该来的都来了，该结的账，今日一起结。',
            minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: eid + '_done',
            requireGuestFeelings: true, anyLocation: true, _collective: 'wedding',
            scenes: scenes,
            effects: function (npc, choice) {
                var aff = 0, msg = '';
                var others = guests.map(function (g) { return { id: g, affection: 0 }; });
                var pairD = 0;
                if (choice === 'spouse') {
                    aff = 8; others.forEach(function (o) { o.affection = -2; }); pairD = 3;
                } else if (choice === 'guests') {
                    aff = 4; others.forEach(function (o) { o.affection = 6; }); pairD = 6;
                } else {
                    aff = 6; others.forEach(function (o) { o.affection = 4; }); pairD = 5;
                    try { if (window.currentCharData) window.currentCharData.energy = Math.max(0, (window.currentCharData.energy || 0) - 50); } catch (e) {}
                }
                var dname = db ? db.name : '你的道侣';
                msg = '大礼成了。当夜红烛烧到三更，江湖散了席——';
                guests.forEach(function (g) {
                    var b = _vb(g);
                    if (b) msg += b.name + '离席时——' + b.exit + ' ';
                });
                msg += dname + '送你到堂前，只说了一句：' + (db ? db.aftermath : '「往后的账，一起记。」');
                // 风评网收官：活跃风评全部结为旧话
                try {
                    var led = _cledLoad();
                    led.rumors = [];
                    _cledSave();
                    msg += ' 从这一夜起，江湖上关于你的那些风评，全部结成了旧话——说书的再讲起来，开头都要加一句「那是大典之前的事了」。';
                } catch (e) {}
                // 席间照面的旧友，关系账当场落真源
                try {
                    if (guests.length > 1 && typeof window._jealWriteback === 'function') {
                        var w = window._jealWriteback(guests[0], guests[1], choice === 'guests' ? 5 : 2);
                        if (w && w.text) msg += ' ' + w.text + '——同席一场，也是缘分。';
                    }
                } catch (e) {}
                return { affection: aff, msg: msg, others: others, pair: { delta: pairD, with: guests[0] } };
            }
        };
    }

    // ============ 四、钩子 ============
    function _festTonight() {
        var defs = window.FESTIVAL_DEFS || [];
        var d = _doy();
        for (var i = 0; i < defs.length; i++) if (defs[i].doy === d) return defs[i];
        return null;
    }

    if (typeof window !== 'undefined' && window.timeSystem && window.timeSystem.onNewDaySubscribe) {
        window.timeSystem.onNewDaySubscribe(function () {
            try {
                if (!window.currentCharData || !window.npcManager) return;
                if (_modalOpen()) return;
                var today = _today();
                var led = _cledLoad();

                // 1) 风评：起风 → 城里听风 → 山门送风（送风是一桩小事件，优先弹）
                _rumorTick();
                var del = _rumorDeliver();
                if (del) { _fire(del); return; }
                if (_rumorHear()) return;

                // 2) 大典终局：红帖已下、旧账未清——一生一幕
                if (!led.weddingDone) {
                    var daoId = _daoCompanionId();
                    if (daoId && _cast(1, [daoId]).length >= 1) {
                        led.weddingDone = true;
                        _cledSave();
                        _fire(composeWeddingFinale());
                        return;
                    }
                }

                // 3) 灯节夜：四大节日当晚，人在城里，灯市撞约（每节每年至多一幕）
                var fes = _festTonight();
                if (fes && _inCity()) {
                    var year = Math.floor((today - 1) / 360) + 1;
                    var fkey = fes.key + '_' + year;
                    if (!led.lanterns[fkey] && Math.random() < 0.6) {
                        var ev = composeLanternNight(fes.name);
                        if (ev) { led.lanterns[fkey] = true; _cledSave(); _fire(ev); return; }
                    }
                }

                // 4) 坊市撞礼：人在城里，十二日冷却
                if (_inCity() && today - led.lastMarket > 12 && Math.random() < 0.25) {
                    var mev = composeMarketClash();
                    if (mev) { led.lastMarket = today; _cledSave(); _fire(mev); return; }
                }
            } catch (e) { console.warn('[集体戏] 每日钩子失败:', e); }
        });
    }

    // 擂台真事件：赢了这一场，看台上的脸色当场变（七日冷却）
    if (typeof window !== 'undefined' && window.EventBus && typeof window.EventBus.on === 'function') {
        window.EventBus.on('arena:won', function (payload) {
            try {
                if (!window.currentCharData || !window.npcManager) return;
                if (_modalOpen()) return;
                var led = _cledLoad();
                var today = _today();
                if (today - led.lastStand <= 7) return;
                if (_cast(2).length < 2) return;
                if (Math.random() >= 0.5) return;
                var ev = composeArenaStand((payload && payload.streak) || (window.currentCharData.arenaStreak) || 1);
                if (ev) { led.lastStand = today; _cledSave(); _fire(ev); }
            } catch (e) {}
        });
    }

    // ============ 导出（测试与后续用） ============
    window.composeLanternNight = composeLanternNight;
    window.composeArenaStand = composeArenaStand;
    window.composeMarketClash = composeMarketClash;
    window.composeWeddingFinale = composeWeddingFinale;

    console.log('[集体大戏+风评网] 三期引擎加载完成：四幕（灯夜撞约/看台变色/坊市撞礼/道侣大典）+ 风评传闻网');
})();
