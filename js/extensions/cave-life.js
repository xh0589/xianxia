// ==================== cave-life.js - 洞府里的日子（第一百零六波） ====================
// 用户点账：「幻想自己是玩家，想在洞府里干各种事」——占山、修缮、安置都是账本，
// 这一波让账本里长出日子：知己会登门、灵兽在院里打滚、晨昏各有山景，全记进起居注。
//
// 立规（与本仓一贯口径一致）：
//   1. 一切场景由世界本身派生——好感≥60 才有客、灵兽栏里才养得住兽、破山洞请不起客；
//      没有凭空的好感、没有隐形配额，随机只挑「今天发生哪桩」，不造「必须发生几桩」。
//   2. 起居注随宅子存档（playerHouse.diary，封顶 30 条），迁址不丢、轮回重开才散。
//   3. 人在他乡，洞府的日子照样过，但不写给你看——回家才能翻起居注、才撞得见客人。
(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    var DIARY_CAP = 30;
    var _rng = Math.random;

    function setRng(fn) { _rng = (typeof fn === 'function') ? fn : Math.random; }

    function _today() {
        try {
            if (typeof window.getAbsoluteDay === 'function') return window.getAbsoluteDay() || 1;
            if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') return window.timeSystem.getAbsoluteDay() || 1;
        } catch (e) {}
        return 1;
    }

    function _house() { return window.playerHouse || null; }

    function _hasFacility(fid) {
        try {
            if (window.CaveFacilities && typeof window.CaveFacilities.getFacilities === 'function') {
                var facs = window.CaveFacilities.getFacilities('player') || [];
                for (var i = 0; i < facs.length; i++) if (facs[i] && facs[i].facilityId === fid) return true;
            }
        } catch (e) {}
        return false;
    }

    function _pick(arr) { return arr.length ? arr[Math.floor(_rng() * arr.length) % arr.length] : null; }

    // —— 起居注：随宅子存档的账，只记发生在自家山里的事 ——
    function getDiary(limit) {
        var h = _house();
        var d = (h && h.diary) || [];
        if (!limit || limit >= d.length) return d.slice();
        return d.slice(d.length - limit);
    }

    function addDiary(text, kind) {
        var h = _house();
        if (!h || !h.type || !text) return false;
        if (!Array.isArray(h.diary)) h.diary = [];
        h.diary.push({ day: _today(), kind: kind || 'scene', text: String(text) });
        while (h.diary.length > DIARY_CAP) h.diary.shift();
        try { if (typeof window.saveHouseData === 'function') window.saveHouseData(); } catch (e) {}
        return true;
    }

    // —— 素材：全都从世界现有账上取，一样不新造 ——
    function _closeFriends() {
        try {
            if (window.npcManager && typeof window.npcManager.getAllNPCs === 'function') {
                var all = window.npcManager.getAllNPCs() || [];
                var out = [];
                for (var i = 0; i < all.length; i++) {
                    var npc = all[i];
                    var aff = npc && npc.relationship ? Number(npc.relationship.affection) || 0 : 0;
                    if (aff >= 60 && npc && npc.name) out.push(npc);
                }
                return out;
            }
        } catch (e) {}
        return [];
    }

    function _beastName(b) {
        try {
            if (typeof window.beastDisplayName === 'function') {
                var dn = window.beastDisplayName(b);
                if (dn) return dn;
            }
        } catch (e) {}
        return (b && (b.petName || b.name)) || '灵兽';
    }

    var VISIT_LINES = [
        '{name} 沿着山径寻上门来，坐了一会儿，说起江湖上的旧人旧事。',
        '{name} 提着两壶新茶登门，说这山里的水泡茶正好。',
        '{name} 路过此山，进来讨了盏茶——走时把风尘都留在了门外。'
    ];
    var VISIT_TEA_LINES = [
        '{name} 来山里小住，茶灶上水滚了三滚，论道论到日头偏西。',
        '{name} 登门对坐，石桌茶灶之间，彼此的心结都解松了几分。'
    ];
    var BEAST_LINES = [
        '{beast} 在院里打了个滚，惊起一群山雀，又若无其事地舔爪子。',
        '{beast} 卧在洞口晒太阳，尾巴有一搭没一搭地扫着石阶。',
        '夜里山风大，{beast} 把窝挪到了静室门口——它认得你的脚步声。'
    ];
    var COMPANION_LINES = [
        '{mate} 在院里练剑，收势时冲你笑了笑，说这山风正好。',
        '{mate} 煮了一壶新水，给你留了一碗在灶上——起居注上写：茶凉了又热。',
        '你和 {mate} 在崖边坐到很晚，谁也没说话，看云。'
    ];
    var AMBIENT_BY_LEY = {
        cultivation: ['晨起吐纳，中脉的地气顺着山势漫上来，一呼一吸都比往日绵长。', '云海漫过山麓，你在石门轮廓下静坐，忘却晨昏。'],
        herb: ['涧边的灵药又抽了新芽——谷里药香浓得化不开。', '昨夜落了雨，林子里的菌子和药草都蹿了一截。'],
        alchemy: ['火云暖谷，丹房里不点炉也是温的，丹气经夜不散。', '赤崖被夕照透成琥珀色，你在檐下看了一会儿火。'],
        forging: ['峡壁里的金气嗡嗡作响，砧上锤子未落，腕子先热了。', '一线泉水穿峡而过，淬火的槽水从来不用愁。'],
        mining: ['极光入窗的那一夜，冰原深处隐隐有矿脉的微光。', '寒玉床上醒来，呵气成霜——崖窟外的矿脉却养人。'],
        wood: ['松梢上的剑气又擦着云雾过去了，你捡回两根被削落的枝子。', '后山雾大，松柏在雾里拔节，斧头还没磨就先闻见木香。'],
        beast: ['潮信守门，雾屿的灵兽睡得比别处都沉。', '渔火点点的夜里，岛上的兽类都安静下来，只听见浪。']
    };
    var AMBIENT_FALLBACK = ['山居无事，扫石烹泉，一日又过。', '你在崖边看云起云落，洞府里安安静静。'];

    var GIFT_POOL = ['mat_lingzhi', 'mat_spirit_grass', 'mat_ginseng', 'mat_bamboo'];

    /**
     * 洞府的一天：随世界钟的 newDay 走。
     * 返回 { ok, scenes }——scenes 是今天写进起居注的条数。
     */
    function tickDay() {
        var h = _house();
        if (!h || !h.type) return { ok: true, skipped: 'no-house', scenes: 0 };
        var atHome = true;
        try { if (typeof window.isAtHome === 'function') atHome = window.isAtHome(); } catch (e) {}
        if (!atHome) return { ok: true, skipped: 'away', scenes: 0 };

        var scenes = [];
        var site = null;
        try { if (typeof window.getHouseSite === 'function') site = window.getHouseSite(); } catch (e2) {}
        var ley = (site && site.ley) || null;

        // —— 知己登门：好感≥60 才有客；破山洞没处待客，先修缮起来 ——
        if (h.type !== 'ruin') {
            var friends = _closeFriends();
            if (friends.length) {
                var chance = 0.25 + (_hasFacility('fac_guest_room') ? 0.25 : 0);
                if (_rng() < chance) {
                    var guest = _pick(friends);
                    var hasTea = _hasFacility('fac_tea_stove');
                    var line = _pick(hasTea ? VISIT_TEA_LINES : VISIT_LINES).replace('{name}', guest.name);
                    scenes.push({ kind: 'visit', text: line, name: guest.name });
                    // 茶灶待客，知己也不空手——带点山货回礼（真入账，来路是他自己的行囊）
                    if (hasTea && typeof window.addItem === 'function') {
                        var gift = _pick(GIFT_POOL);
                        try { window.addItem(gift, 1); } catch (eG) {}
                        var giftName = gift;
                        try {
                            if (window.itemById && window.itemById[gift] && window.itemById[gift].name) giftName = window.itemById[gift].name;
                        } catch (eN) {}
                        scenes[scenes.length - 1].text += '（' + guest.name + ' 回赠了你一份 ' + giftName + '）';
                        scenes[scenes.length - 1].gift = gift;
                    }
                    // 登门是大事，记进天下见闻（与兽潮同款通道）
                    try {
                        if (window.WorldJournal && typeof window.WorldJournal.record === 'function') {
                            window.WorldJournal.record({ type: 'cave_visit', title: '知己来访', text: guest.name + ' 寻到洞府来了。', refs: { npc: guest.id || guest.name } });
                        }
                    } catch (eJ) {}
                }
            }
        } else if (_rng() < 0.3) {
            scenes.push({ kind: 'scene', text: '石壁漏风，夜里灌了一脖子风——把山洞修缮起来，才请得起客、待得住兽。' });
        }

        // —— 灵兽的日子：栏里养着的才算住在洞里 ——
        var beasts = window.tamedBeasts || [];
        if (beasts.length && _hasFacility('fac_beast_pen') && _rng() < 0.35) {
            var b = _pick(beasts);
            scenes.push({ kind: 'beast', text: _pick(BEAST_LINES).replace('{beast}', _beastName(b)) });
        }

        // —— 屋檐下的人（第一百零七波）：住在你家里的同伴，该在起居注里露脸 ——
        var mates = [];
        try {
            if (window.partySystem && typeof window.partySystem.getMembers === 'function') mates = window.partySystem.getMembers() || [];
        } catch (eMate) {}
        if (mates.length && scenes.length < 2 && _rng() < 0.35) {
            var mate = _pick(mates);
            scenes.push({ kind: 'companion', text: _pick(COMPANION_LINES).replace('{mate}', mate.name || '同伴') });
        }

        // —— 晨昏山景：这座山的地脉性子，天天见得到 ——
        if (scenes.length < 2 && _rng() < 0.6) {
            var pool = (ley && AMBIENT_BY_LEY[ley.kind]) || AMBIENT_FALLBACK;
            scenes.push({ kind: 'scene', text: _pick(pool) });
        }

        for (var i = 0; i < scenes.length; i++) {
            addDiary(scenes[i].text, scenes[i].kind);
        }
        if (scenes.length && typeof window.showMessage === 'function' && !window._isInLongRetreat) {
            try { window.showMessage('🏡 ' + scenes[0].text, 'info'); } catch (eM) {}
        }
        return { ok: true, scenes: scenes.length, day: _today() };
    }

    window.CaveLife = {
        tickDay: tickDay,
        getDiary: getDiary,
        addDiary: addDiary,
        setRng: setRng,
        DIARY_CAP: DIARY_CAP
    };
    window.XianXia = window.XianXia || {};
    window.XianXia.CaveLife = window.CaveLife;

    // 接线：只挂 EventBus 的 newDay（与世界钟同一本账，不自造日历）
    try {
        if (window.EventBus && typeof window.EventBus.on === 'function') {
            window.EventBus.on('newDay', function () {
                try { tickDay(); } catch (e) {}
            });
        }
    } catch (eBind) {}

    try { console.log('[CaveLife] initialized v1 (起居注封顶 ' + DIARY_CAP + ' 条，随宅子存档)'); } catch (e) {}
})();
