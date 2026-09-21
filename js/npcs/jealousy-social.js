// ==================== jealousy-social.js - 吃醋关系网引擎 v20.80 ====================
// 挂载于：jealousy-deep.js / heroine-aftermath.js 之后（三十六人名册与全局 detectRivalRomance 就位后加载）
//
// 本文件是「两人及集体交锋戏」的底座。它不写戏，只回答三个现实问题：
//   一、如今世上，有谁把玩家放在心上？（_jealHasFeelings / _jealAllRivals）
//   二、那两个人，彼此认不认识？交情如何？（_jealEnsureAcquaintance / _jealWriteback ——
//       读写 npc-system.js 的 npcRelationships，NPC↔NPC 社交关系的唯一真源）
//   三、玩家带着谁同行？（_jealPartySuspects —— 队伍名册一读，嫌疑不言自明）
//
// 铁律（与玩家的社交规则同源）：
//   · 没结识就不在关系列表。NPC 对 NPC 与玩家对 NPC 一样，不凭空预置任何条目；
//     一切认识都发生在「当场」——两人同框一出事件，关系当场种下（_jealOnSceneShow 挂在
//     showPersonalEventScene 的开帘处，由 npc-personal-events.js 带 typeof 守卫调用）。
//   · 初见印象不随机：门派旧谊定底色（五岳连枝、佛道同宗、黑与黑不撞、正邪见面带霜），
//     具体的旧识写死在预设表里（茶棚的交情、戒堂问话的斗嘴）。
//   · 交锋之后的关系账是真的：写回直落真源，居间调停（social-intervene）读得到、
//     关系面板看得到、随存档走——戏是一次性的，账是长期的。
//
// 现实六原则（两人交锋戏的共同宪法，也是后续所有内容文件的审稿标准）：
//   ① 吃醋只从真实信息来：亲眼见、亲耳闻、账上有据——不凭空心灵感应。
//   ② 不该知道的就不知道：名字只在有来路（账、哨、档、潮）时才出口。
//   ③ 关系网读社交真源：见面即结识，旧谊深浅随门派与旧事。
//   ④ 同行即嫌疑：你带着谁来见谁，不必开口，灶角、档廊、账案都长着眼。
//   ⑤ 声口各归各人：谁只说谁的本行话，借来的调子要标注，谁也不越界。
//   ⑥ 收敛纪律：一人至多一个执念，情绪走物件与细节，不写奇观、不写自残、不写苦等。

(function () {
    'use strict';

    // 无咎（破戒僧）不入任何名册，但世上确实有他——大名单手动补上这一位
    var WUJIU_ENTRY = { id: 'shaolin_wujiu', name: '无咎', sect: '少林寺', gender: 'male' };

    // ============ 三十七人大名单（二十女主 + 十六男主 + 无咎，加载序不敏感） ============
    function _jsRoster() {
        var out = [];
        var seen = {};
        function push(r) { if (r && r.id && !seen[r.id]) { seen[r.id] = true; out.push(r); } }
        if (typeof window !== 'undefined') {
            var h = window.HEROINE_ROSTER || ((typeof HEROINE_ROSTER !== 'undefined') ? HEROINE_ROSTER : []);
            var m = window.MALE_LEAD_ROSTER || [];
            if (h && h.forEach) h.forEach(push);
            if (m && m.forEach) m.forEach(push);
        }
        push(WUJIU_ENTRY);
        return out;
    }

    function _jsNpc(id) {
        return (window.npcManager && window.npcManager.getNPC) ? window.npcManager.getNPC(id) : null;
    }

    function _jsSectOf(id) {
        var roster = _jsRoster();
        for (var i = 0; i < roster.length; i++) {
            if (roster[i].id === id) return roster[i].sect || '';
        }
        if (typeof id === 'string' && id.indexOf('sect_leader_') === 0) return id.slice('sect_leader_'.length);
        var npc = _jsNpc(id);
        return (npc && npc.location) || '';
    }

    // ============ 一、谁把玩家放在心上 ============
    // 与 detectRivalRomance 同一套证据学：道侣旗 / 表白记忆是实据，好感 45 是「在意」的线。
    function _jsFeelings(npc) {
        if (!npc) return false;
        if (npc.hasFlag && npc.hasFlag('dao_companion')) return true;
        if (npc.memory && npc.memory._loveAccepted_confess) return true;
        return ((npc.relationship && npc.relationship.affection) || 0) >= 45;
    }

    window._jealHasFeelings = function (npcId) {
        return _jsFeelings(_jsNpc(npcId));
    };

    // 世上所有把你放在心上的人（可排除自己），按好感深浅排序——集体戏的选人依据
    window._jealAllRivals = function (excludeId) {
        var out = [];
        var roster = _jsRoster();
        for (var i = 0; i < roster.length; i++) {
            var r = roster[i];
            if (!r || r.id === excludeId) continue;
            var npc = _jsNpc(r.id);
            if (!npc || !_jsFeelings(npc)) continue;
            out.push({
                id: r.id,
                name: npc.name || r.name,
                sect: r.sect || _jsSectOf(r.id),
                gender: npc.gender || r.gender || '',
                isDaoCompanion: !!(npc.hasFlag && npc.hasFlag('dao_companion')),
                affection: (npc.relationship && npc.relationship.affection) || 0
            });
        }
        out.sort(function (a, b) { return b.affection - a.affection; });
        return out;
    };

    // ============ 二、见面即结识（关系真源种子） ============
    // 门派底色：初见那一刻，两家旧谊决定这层关系的起点
    var VILLAIN_SECTS = ['阎罗殿', '血手门', '飞蝎坞', '烈日教', '天龙教'];
    var WUYUE_SECTS = ['恒山派', '嵩山派', '泰山派', '衡山派', '青城派'];

    function _inSet(s, set) { return set.indexOf(s) >= 0; }
    function _eitherPair(a, b, x, y) { return (a === x && b === y) || (a === y && b === x); }

    window._jealFactionBias = function (sectA, sectB) {
        var A = sectA || '', B = sectB || '';
        if (_inSet(A, WUYUE_SECTS) && _inSet(B, WUYUE_SECTS)) {
            return { relation: 'friend', strength: 35, note: '五岳连枝，见面如旧邻' };
        }
        if (_eitherPair(A, B, '武当派', '全真教')) {
            return { relation: 'friend', strength: 30, note: '道门同宗，香火有旧' };
        }
        if (_eitherPair(A, B, '少林寺', '恒山派')) {
            return { relation: 'friend', strength: 30, note: '佛门同戒，讲经有旧' };
        }
        if (_eitherPair(A, B, '神机门', '霹雳堂')) {
            return { relation: 'neutral', strength: 25, note: '机关与火药，技术上算半个同行' };
        }
        if (_eitherPair(A, B, '天涯海阁', '蓬莱派')) {
            return { relation: 'neutral', strength: 15, note: '海路共用灯火的点头之交' };
        }
        var Av = _inSet(A, VILLAIN_SECTS), Bv = _inSet(B, VILLAIN_SECTS);
        if (Av && Bv) {
            return { relation: 'neutral', strength: 20, note: '黑与黑不撞，各记各的账' };
        }
        if (A === '修罗宫' || B === '修罗宫') {
            // 修罗宫独来独往：不与任何一方结旧，也不与任何一方结仇
            return { relation: 'neutral', strength: 10, note: '修罗宫的门，谁家都不进' };
        }
        if (Av !== Bv) {
            return { relation: 'enemy', strength: 15, note: '门派旧怨，见面就带霜' };
        }
        return { relation: 'neutral', strength: 5, note: '一面之缘' };
    };

    // 预设旧识：正典里已经同过框的人，底色不按门派算，按旧事算
    var PRESET_PAIR_DEFS = [
        ['sect_leader_飞蝎坞', 'sect_leader_烈日教', { relation: 'friend', strength: 45, note: '边地茶棚的旧识，当年那壶茶钱至今没算清' }],
        ['sect_leader_少林寺', 'shaolin_wujiu', { relation: 'friend', strength: 40, note: '戒堂问话的旧识，斗嘴点到即止' }],
        ['sect_leader_血手门', 'sect_leader_阎罗殿', { relation: 'neutral', strength: 25, note: '一个开方一个记档，见过几面，没有交情' }],
        ['sect_leader_天龙教', 'sect_leader_阎罗殿', { relation: 'neutral', strength: 20, note: '一个传声一个记档，互相探过底细' }],
        ['sect_leader_五仙教', 'sect_leader_衡山派', { relation: 'neutral', strength: 15, note: '南边的琴与南边的蛊，雨席上见过一面' }]
    ];
    var PRESET_PAIRS = {};
    function _presetKey(a, b) { return [String(a), String(b)].sort().join('|'); }
    PRESET_PAIR_DEFS.forEach(function (d) { PRESET_PAIRS[_presetKey(d[0], d[1])] = d[2]; });

    window._jealEnsureAcquaintance = function (idA, idB) {
        if (!idA || !idB || idA === idB) return null;
        var a = _jsNpc(idA), b = _jsNpc(idB);
        if (!a || !b) return null;
        if (!a.npcRelationships) a.npcRelationships = {};
        if (!b.npcRelationships) b.npcRelationships = {};
        // 已经认识的，一个指头都不动——种子只发给初见
        if (a.npcRelationships[idB] || b.npcRelationships[idA]) return null;
        if (typeof setNPCRelationshipPair !== 'function') return null;
        var bias = PRESET_PAIRS[_presetKey(idA, idB)] || window._jealFactionBias(_jsSectOf(idA), _jsSectOf(idB));
        setNPCRelationshipPair(a, b, bias.relation, bias.strength);
        return bias; // 返回非空 = 这一回发生了初见
    };

    // ============ 三、交锋之后的关系账（写回真源） ============
    // delta > 0 交深；delta < 0 转冷，冷到底（≤10）结成真疙瘩（enemy 40）；
    // 已是仇敌的：正 delta 化冻（沿用 adjustNPCRelationshipPair 的既有语义），负 delta 疙瘩更深。
    window._jealWriteback = function (idA, idB, delta, opts) {
        opts = opts || {};
        delta = Number(delta) || 0;
        if (!idA || !idB || idA === idB || !delta) return null;
        var a = _jsNpc(idA), b = _jsNpc(idB);
        if (!a || !b) return null;
        // 写回必先认识——没打过照面的人之间没有账
        window._jealEnsureAcquaintance(idA, idB);
        var cur = (a.npcRelationships && a.npcRelationships[idB]) || null;
        var rel = cur ? ((typeof cur === 'string') ? cur : (cur.relation || 'neutral')) : 'neutral';
        var str = (cur && typeof cur === 'object') ? (Number(cur.strength) || 0) : 0;
        var names = (a.name || '甲') + '与' + (b.name || '乙');
        var text = '';
        if (typeof setNPCRelationshipPair !== 'function') return null;
        if (rel === 'enemy') {
            if (delta > 0) {
                // 化冻：沿用真源既有语义（敌意降到 20 以下自动转普通）
                var thaw = (typeof adjustNPCRelationshipPair === 'function')
                    ? adjustNPCRelationshipPair(a, b, delta, {})
                    : { relation: 'enemy', strength: Math.max(0, str - delta) };
                text = (thaw.relation === 'enemy') ? (names + '之间的霜松了一分') : (names + '把旧怨放下了');
                return { relation: thaw.relation, strength: thaw.strength, text: text };
            }
            var deeper = Math.min(100, str + (-delta));
            setNPCRelationshipPair(a, b, 'enemy', deeper);
            return { relation: 'enemy', strength: deeper, text: names + '之间的疙瘩更深了' };
        }
        if (delta < 0) {
            var ns = Math.max(0, str + delta);
            // 结成仇敌只认真交情的崩塌（friend 或强度 20 以上的关系冷到底）——
            // 一面之缘（neutral 5）被小事一冷就翻成仇敌，不合现实逻辑
            if (opts.allowEnemy !== false && ns <= 10 && (str >= 20 || rel === 'friend')) {
                setNPCRelationshipPair(a, b, 'enemy', 40);
                return { relation: 'enemy', strength: 40, text: names + '之间结下了真疙瘩' };
            }
            var rel2 = rel;
            if (rel2 === 'friend' && ns < 20) rel2 = 'neutral'; // 交情磨到 20 以下，朋友做不成了
            setNPCRelationshipPair(a, b, rel2, ns);
            text = (rel2 !== rel) ? (names + '的交情淡了下去') : (names + '之间冷了一分');
            return { relation: rel2, strength: ns, text: text };
        }
        // delta > 0 且非仇敌：真源的既有涨路（neutral ≥ 40 自动转 friend）
        if (typeof adjustNPCRelationshipPair === 'function') {
            var up = adjustNPCRelationshipPair(a, b, delta, {});
            text = (up.relation === 'friend' && rel !== 'friend') ? (names + '开始把对方当朋友了') : (names + '的交情深了一分');
            return { relation: up.relation, strength: up.strength, text: text };
        }
        var ns2 = Math.min(100, str + delta);
        var rel3 = (rel === 'neutral' && ns2 >= 40) ? 'friend' : rel;
        setNPCRelationshipPair(a, b, rel3, ns2);
        return { relation: rel3, strength: ns2, text: names + '的交情深了一分' };
    };

    // ============ 四、同行即嫌疑（队伍读取） ============
    // 你拉着谁当队友，又带着谁来见谁——不必开口，在场本身就是证据。
    // 嫌疑标准：队友是三十七人之一，且对你有心（或好感已过 30 的在意线）。
    window._jealPartySuspects = function (hostNpcId) {
        var members = null;
        try {
            if (window.partySystem && typeof window.partySystem.getMembers === 'function') {
                members = window.partySystem.getMembers();
            }
        } catch (e) { return null; }
        if (!members || !members.length) return null;
        var ids = {};
        _jsRoster().forEach(function (r) { ids[r.id] = r; });
        for (var i = 0; i < members.length; i++) {
            var m = members[i];
            var mid = m && (m.id || m.npcId);
            if (!mid || mid === hostNpcId || !ids[mid]) continue;
            var npc = _jsNpc(mid);
            var aff = (npc && npc.relationship && npc.relationship.affection) || 0;
            var feel = window._jealHasFeelings(mid);
            if (feel || aff >= 30) {
                return { id: mid, name: (npc && npc.name) || ids[mid].name, sect: ids[mid].sect, hasFeelings: feel, affection: aff };
            }
        }
        return null;
    };

    // ============ 五、第二人名片（渲染器 asNpc 气泡用） ============
    // 图标三级兜底：实例外观 → 固定人设表原卡 → 默认——SPECIAL_NPC_DATA 直生的 NPC
    // 图标在卡面顶层而非 appearance 里，这里替渲染器找齐。
    function _jsIconFor(id) {
        var npc = _jsNpc(id);
        if (npc && npc.appearance && npc.appearance.icon) return npc.appearance.icon;
        try {
            if (typeof SPECIAL_NPC_DATA !== 'undefined' && SPECIAL_NPC_DATA[id] && SPECIAL_NPC_DATA[id].icon) return SPECIAL_NPC_DATA[id].icon;
            if (typeof SPECIAL_NPC_DEFINITIONS !== 'undefined' && SPECIAL_NPC_DEFINITIONS[id] && SPECIAL_NPC_DEFINITIONS[id].icon) return SPECIAL_NPC_DEFINITIONS[id].icon;
        } catch (e) {}
        return '👤';
    }

    window._jealGuestInfo = function (id) {
        var npc = _jsNpc(id);
        if (!npc) return null;
        return { name: npc.name || id, icon: _jsIconFor(id), gender: npc.gender || '' };
    };

    // ============ 六、初见旁白 ============
    window._jealFirstMeetingBeat = function (hostNpc, guestName, bias) {
        var hn = (hostNpc && hostNpc.name) || '主人家';
        var note = (bias && bias.note && bias.note !== '一面之缘') ? '（' + bias.note + '）' : '';
        if (bias && bias.relation === 'enemy') {
            return '——今日之前，' + hn + '与' + guestName + '从未照面。名号一报，屋里的空气先冷了几分：两家的旧怨比两个人的年纪都大。谁也没动手，谁也没让座。' + note;
        }
        if (bias && bias.relation === 'friend' && (bias.strength || 0) >= 30) {
            return '——' + hn + '与' + guestName + '是头一回见面，可两家名号一报，彼此都热络了半分：旧谊在先，初见如故。' + note;
        }
        return '——' + hn + '与' + guestName + '头一回见面，彼此见礼，互道名号。从今日起，江湖上多了一对相识。' + note;
    };

    // ============ 七、开帘播种（挂在 showPersonalEventScene） ============
    // 双人事件开帘时：①动态情敌场（composeRival）当场按真名换装；②主客初见当场种关系、补一拍旁白。
    window._jealOnSceneShow = function (npc, eventDef) {
        if (!npc || !eventDef || !eventDef.scenes) return;
        var guestIds = {};
        if (eventDef.guestId) guestIds[eventDef.guestId] = true;

        // 动态情敌合成：{rival} 换真名，__RIVAL__ 换真人——每次开帘都从原稿重新合成，名随人换
        if (eventDef.composeRival) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            var rname = rival ? rival.name : '那位';
            if (!eventDef._scenesOrig) {
                try { eventDef._scenesOrig = JSON.stringify(eventDef.scenes); } catch (e) {}
            }
            if (eventDef._scenesOrig) {
                try { eventDef.scenes = JSON.parse(eventDef._scenesOrig); } catch (e) {}
            }
            eventDef.scenes.forEach(function (s) {
                if (typeof s.text === 'string' && s.text.indexOf('{rival}') >= 0) s.text = s.text.replace(/\{rival\}/g, rname);
                if (s.asNpc === '__RIVAL__') s.asNpc = rival ? rival.id : null;
                if (s.options) s.options.forEach(function (o) {
                    if (typeof o.text === 'string' && o.text.indexOf('{rival}') >= 0) o.text = o.text.replace(/\{rival\}/g, rname);
                });
            });
            if (typeof eventDef.desc === 'string' && eventDef.desc.indexOf('{rival}') >= 0) eventDef.desc = eventDef.desc.replace(/\{rival\}/g, rname);
            if (rival) guestIds[rival.id] = true;
        }

        for (var i = 0; i < eventDef.scenes.length; i++) {
            var s = eventDef.scenes[i];
            if (s && s.asNpc && typeof s.asNpc === 'string') guestIds[s.asNpc] = true;
        }

        Object.keys(guestIds).forEach(function (gid) {
            if (!gid || gid === npc.id || gid === '__RIVAL__') return;
            var seeded = window._jealEnsureAcquaintance(npc.id, gid);
            if (seeded) {
                var g = window._jealGuestInfo(gid);
                var beat = window._jealFirstMeetingBeat(npc, g ? g.name : gid, seeded);
                if (beat && typeof appendPEMessage === 'function') {
                    try { appendPEMessage('narrator', beat); } catch (e) {}
                }
            }
        });
    };

    // ============ 导出（测试与后续内容文件用） ============
    window._jealRosterAll = _jsRoster;
    window.JEAL_SOCIAL_VILLAIN_SECTS = VILLAIN_SECTS;
    window.JEAL_SOCIAL_PRESET_DEFS = PRESET_PAIR_DEFS;

    console.log('[吃醋关系网] 引擎加载完成：大名单 ' + _jsRoster().length + ' 人（含破戒僧），预设旧识 ' + PRESET_PAIR_DEFS.length + ' 对');
})();
