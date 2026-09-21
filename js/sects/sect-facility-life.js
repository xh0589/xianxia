// ==================== sect-facility-life.js - 门派建筑做出理由（补厚批三） ====================
// 批二把「特色」做成了身份；批三把「建筑」做出理由——每座基础建筑不再是一个加数按钮，
// 而是一件有过程、有代价、有世界反应的事：
//   演武场 → 切磋系统：挑一个有名有姓的同门真打一场（startBattle 真仗，不是掷骰子），
//            连胜攒「势头」，势头是大比的预热——赢得越多，大比开场你的战力越足；
//   兵器库 → 淬火养护：耗铁料+贡献把兵刃养利（耐久真回、新锋真上），钝了就得来；
//   膳堂   → 用膳听街谈：吃饱有「饭气」增益，桌上还能听见街谈（接批二街谈池）；
//   医馆   → 旧伤复发：真打败北会落下旧伤，旧伤会在苦战时复发拖后腿，须来医馆治好；
//   议事厅 → 挂账本：贡献账本挂在这里公示（接批一 sectLedger），同门都看得见你的进出。
// 另：三十六座地标建筑做「熟识」成长线——常去则熟，花贡献可「深交」，熟识越深效果越厚。
// 纪律：全部真账（走 sectAddContribution/sectSpendContribution 记账口）；状态挂 discipleState 随档持久；
//       零外文字母、零配额句式；切磋点到为止（复用既有 _isSpar 不结仇、不搜刮、不昏迷）。
(function () {
    'use strict';
    var W = window;

    function ds() { return W.discipleState || null; }
    function cd() { return W.currentCharData || null; }
    function flags() { return (W.eventFlags = W.eventFlags || {}); }
    function log(m, t) { try { if (W.gameLog && W.gameLog.add) W.gameLog.add(m); else if (W.showMessage) W.showMessage(m, t || 'info'); } catch (e) {} }
    function modal(t, b) { if (typeof W.showModal === 'function') W.showModal(t, b); }
    function msg(m, t) { if (typeof W.showMessage === 'function') W.showMessage(m, t || 'info'); }
    function absDay() { try { return W.timeSystem && W.timeSystem.getAbsoluteDay ? (Number(W.timeSystem.getAbsoluteDay()) || 0) : 0; } catch (e) { return 0; } }
    function sectName() { var d = ds(); return (d && (d.sectName || d.sectId)) || null; }
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
    function realmTier(realm) { try { if (typeof W.getRealmTier === 'function') { var t = Number(W.getRealmTier(realm)); if (isFinite(t)) return t; } } catch (e) {} return 1; }

    // 批三状态（挂 discipleState 随既有存档持久化）
    function life() {
        var d = ds(); if (!d) return null;
        if (!d._facLife) d._facLife = { sparStreak: 0, sparBest: 0, sparMomentum: 0, sparFoes: {}, oldWounds: [], bond: {} };
        return d._facLife;
    }

    // ============ A 演武场 · 切磋系统（真仗 / 连胜 / 大比预热） ============
    // 陪练池：本派同门 NPC；不足时用「无名同门」补位（强度照玩家境界生成，保证有得打）
    function sparPartners() {
        var sn = sectName();
        var list = [];
        try { if (typeof W.getSectNPCs === 'function' && sn) list = (W.getSectNPCs(sn) || []).slice(); } catch (e) { list = []; }
        var out = [];
        for (var i = 0; i < list.length && out.length < 4; i++) {
            var n = list[i];
            if (!n || !n.id || n.isDead || n._retired) continue; // 殁了的人不上场（批四抚恤线的下游）；挂牌养老的也不列队（方案五）
            var c = n.combat || {};
            out.push({ id: n.id, name: n.name || '同门', realm: c.realm || (cd() && cd().realm) || '炼气', real: true, npc: n });
        }
        // 补位：无名同门（不写档案，纯陪练）
        var FILLERS = ['练拳的师弟', '巡夜的师兄', '挑水的杂役', '闭关出来的老者'];
        for (var f = 0; out.length < 3 && f < FILLERS.length; f++) {
            out.push({ id: '_filler_' + f, name: FILLERS[f], realm: (cd() && cd().realm) || '炼气', real: false });
        }
        return out;
    }
    W.openSparPanel = function () {
        var d = ds(), L = life();
        if (!d || !d.isInSect) { msg('还没入门——演武场不认生人。', 'warning'); return; }
        var partners = sparPartners();
        var mom = L ? (L.sparMomentum || 0) : 0;
        var streak = L ? (L.sparStreak || 0) : 0;
        var html = '<div class="text-left">';
        html += '<div class="bg-gray-800 p-2 rounded mb-2 text-sm text-gray-300">当前连胜 <b class="text-amber-300">' + streak + '</b> 场 · 攒下势头 <b class="text-green-300">' + mom + '</b>' + (mom > 0 ? '<span class="text-gray-500">（大比开场，势头会替你压阵）</span>' : '') + '</div>';
        if (!partners.length) {
            html += '<p class="text-xs text-gray-500">演武场空着——同门都出去办事了。改日再来。</p>';
        } else {
            html += '<p class="text-xs text-gray-400 mb-2">挑一个对手，真刀真枪走一场（点到为止，输了不结仇、不被搜刮）：</p>';
            partners.forEach(function (p) {
                html += '<div class="flex justify-between items-center bg-gray-800/60 p-2 rounded mb-1">'
                    + '<span class="text-sm text-gray-200">🤺 ' + p.name + ' <span class="text-xs text-gray-500">' + p.realm + '</span></span>'
                    + '<span class="flex gap-1">'
                    + (p.real && typeof window.openFellowGift === 'function' ? '<button onclick="window._closeModal(); window.openFellowGift(\'' + p.id + '\')" class="text-xs bg-pink-800 hover:bg-pink-700 text-white px-2 py-1 rounded">🎁 捎东西</button>' : '')
                    + '<button onclick="window.startSparWith(\'' + p.id + '\')" class="text-xs bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded">过招</button></span></div>';
            });
        }
        html += '<p class="text-[11px] text-gray-500 mt-2">赢得越多，对手越强，势头也越足——连胜断了，势头留下，下次接着攒。</p>';
        html += '</div>';
        modal('⚔️ 演武场 · 切磋', html);
    };
    function sparFoeScale(streak) { return 1 + Math.min(6, streak) * 0.12; } // 连胜越高，陪练越强（封顶+72%）
    W.startSparWith = function (npcId) {
        var d = ds(), L = life(), c = cd();
        if (!d || !d.isInSect || !c) { msg('还没入门，或角色未就绪。', 'warning'); return false; }
        var foe = null;
        var partners = sparPartners();
        for (var i = 0; i < partners.length; i++) { if (partners[i].id === npcId) { foe = partners[i]; break; } }
        if (!foe) { msg('查无此对手。', 'warning'); return false; }
        var streak = L.sparStreak || 0;
        var scale = sparFoeScale(streak);
        var tier = Math.max(1, realmTier(c.realm));
        var base = 30 + tier * 8;
        var enemyData = {
            name: foe.name + '（切磋）', type: 'enemy', physiologyType: 'humanoid',
            level: Math.max(1, (typeof W.realmScaledEnemyLevel === 'function' ? W.realmScaledEnemyLevel(c) : tier * 3)),
            attack: Math.round((base + 6) * scale), defense: Math.round((base * 0.6 + 4) * scale), speed: Math.round((18 + tier * 2) * scale),
            maxDurability: Math.round((90 + tier * 18) * scale), durabilities: { chest: Math.round((90 + tier * 18) * scale) },
            combatAbilities: [], sect: sectName() || '同门'
        };
        if (typeof W.startBattle !== 'function') { msg('战斗系统未就绪。', 'error'); return false; }
        var b = W.startBattle(enemyData);
        if (b) {
            b._isSpar = true;          // 复用既有切磋语义：点到为止、不搜刮、不结仇、败不昏迷
            b.noSpoils = true;
            b._isSectSpar = true;      // 批三门派切磋标记：结算走 settleSectSpar
            b._sparFoeId = foe.id;
            b._sparFoeName = foe.name;
            b._sparReal = !!foe.real;
            try { if (foe.real && b.enemy) b.enemy._linkedNpcId = foe.id; } catch (e) {} // 真同门：胜负记进好感（切磋赢了不服，输了熟三分，既有逻辑）
        }
        log('🤺 你与' + foe.name + '在演武场拉开架势——这一场，真打。', 'info');
        return true;
    };
    // 战后结算（由 app.js 切磋分支调用）
    W.settleSectSpar = function (win) {
        var L = life(); if (!L) return;
        var b = W.currentBattle || {};
        var foeName = b._sparFoeName || '对手';
        if (win) {
            L.sparStreak = (L.sparStreak || 0) + 1;
            if (L.sparStreak > (L.sparBest || 0)) L.sparBest = L.sparStreak;
            var gain = 4 + Math.min(8, L.sparStreak);      // 连胜越高，单场贡献越多（封顶+12）
            // 第十四波 · 同门交厚：与知己（交情四十以上）切磋，胜负都有得——他懂你的路数，也肯指点你缺的那一手
            try {
                var _bid = b._linkedNpcId;
                if (_bid && typeof W.sectBondLevel === 'function' && W.sectBondLevel(_bid) >= 40) {
                    gain += 3;
                    log('🤝 ' + foeName + '是你的知己——收势时他顺嘴点了你两处破绽，比赢一场还值。（贡献另+3）', 'info');
                }
            } catch (eBd) {}
            addC(gain, '演武场切磋·胜' + foeName);
            L.sparMomentum = (L.sparMomentum || 0) + 1;   // 势头：大比预热
            // 真同门：切磋赢一场，功法熟练度长一点（打出来的长进）
            try {
                var main = W.currentSkills && W.currentSkills.skill_main;
                if (main && typeof W.addProficiencyExp === 'function') W.addProficiencyExp(main, 3);
            } catch (e) {}
            // 改造批：切磋也是练——门中底子长功底
            try { if (typeof W.sectPassiveTrain === 'function') W.sectPassiveTrain('spar', true); } catch (e) {}
            var s = L.sparStreak;
            var line = s >= 5 ? ('🔥 连胜' + s + '场！演武场边围了一圈同门看你打——势头正盛，大比若有你的名，开场就得让人三分。')
                : s >= 3 ? ('⚔️ 连胜' + s + '场。' + foeName + '抱拳退下：「长进不小。」——势头攒下了。')
                : ('⚔️ 你胜了' + foeName + '半招。点到为止，双方收势。（贡献+' + gain + '，势头+1）');
            log(line, 'success');
            msg(line, 'success');
        } else {
            var had = L.sparStreak || 0;
            L.sparStreak = 0;
            var line2 = had >= 3 ? ('💧 连胜止于' + had + '场。' + foeName + '扶你起来：「能逼我到这儿，够了。」——势头留着，下次接着攒。')
                : ('💧 你输了这一场。' + foeName + '收手抱拳：「承让。」切磋不结仇，输赢都是练。（连胜清零，势头留下）');
            log(line2, 'info');
            msg(line2, 'info');
        }
        try { if (typeof W.updateSectUI === 'function') W.updateSectUI(); } catch (e) {}
    };
    // 大比读取势头：开场给玩家战力加成（批五大比解锁后接；此处先暴露真值）
    W.getSectSparMomentum = function () { var L = life(); return L ? (L.sparMomentum || 0) : 0; };

    // ============ B 兵器库 · 淬火养护（耗铁料+贡献，养利兵刃） ============
    function mainHand() { var eq = W.currentEquipment; return (eq && eq.mainHand) ? eq.mainHand : null; }
    // 淬火养护费随兵器库修葺等级递减：Lv1=15 / Lv2=10 / Lv3=5 贡献（库官专司、炉膛扩建的真效果）
    function temperCost() {
        var lv = 1;
        try { if (typeof W.getFacilityLevel === 'function') lv = Number(W.getFacilityLevel('sect_armory')) || 1; } catch (e) {}
        var cost = Math.max(5, 15 - (lv - 1) * 5);
        // 改造批：铸剑「知刃」底子——听得出炉温的人，淬火省工（贡献再减五，底线五）
        try { if (typeof W.sectPassiveHas === 'function' && W.sectPassiveHas('blade')) cost = Math.max(5, cost - 5); } catch (e) {}
        return cost;
    }
    W.openTemperPanel = function () {
        var d = ds(); if (!d || !d.isInSect) { msg('还没入门——兵器库不对外。', 'warning'); return; }
        var w = mainHand();
        var html = '<div class="text-left">';
        if (!w) {
            html += '<p class="text-sm text-gray-400 mb-2">你手里没提主手兵刃——淬火得有刃可淬。先装备一件兵器再来。</p>';
        } else {
            var durTxt = (typeof w.durability === 'number') ? ('耐久 ' + Math.round(w.durability)) : '耐久如新';
            var cost = temperCost();
            html += '<div class="bg-gray-800 p-2 rounded mb-2 text-sm text-gray-300">当前主手：<b class="text-amber-200">' + (w.name || '兵刃') + '</b> · ' + durTxt + '</div>';
            html += '<p class="text-xs text-gray-400 mb-2">炉子烧起来，铁料下去，把刃养利——耗铁料与贡献，兵刃耐久回满，并得半日「新淬之锋」。</p>';
            html += '<div class="flex gap-2">'
                + '<button onclick="window.doTemperWeapon()" class="flex-1 bg-orange-700 hover:bg-orange-600 text-white text-sm p-2 rounded">🔥 淬火（铁矿×3 + 贡献' + cost + '）</button>'
                + '</div>';
        }
        html += '</div>';
        modal('🗡️ 兵器库 · 淬火养护', html);
    };
    W.doTemperWeapon = function () {
        var w = mainHand(); if (!w) { msg('手里没兵刃，淬什么火？', 'warning'); return false; }
        // 先查铁矿够不够
        var oreCount = 0;
        try {
            var inv = W.inventory;
            if (inv && inv.slots) for (var i = 0; i < inv.slots.length; i++) { var s = inv.slots[i]; if (s && s.templateId === 'iron_ore') oreCount += (s.count || 0); }
        } catch (e) {}
        if (oreCount < 3) { msg('铁矿不足三份——淬火先得有铁。（当前' + oreCount + '）', 'warning'); return false; }
        var cost = temperCost();
        if (!spendC(cost, '兵器库·淬火养护')) { msg('贡献不足' + cost + '点。', 'error'); return false; }
        try { if (typeof W.consumeItem === 'function') W.consumeItem('iron_ore', 3); } catch (e) {}
        // 耐久回满（有数值耐久的真回，无durability字段的记一句「如新」）
        if (typeof w.durability === 'number') { w.durability = 100; }
        // 新淬之锋：半日攻击增益（真上 buff）
        try { if (typeof W.applyBuff === 'function') W.applyBuff('sect_temper_edge', { attack: 0.15 }, 12); } catch (e) {}
        try { if (typeof W.sectPassiveTrain === 'function') W.sectPassiveTrain('craft'); } catch (e) {} // 改造批：做工淬炼练底子
        var line = '🔥 炉火舔过刃口，' + (w.name || '兵刃') + '淬出一道新锋——耐久养满，锋芒半日不散。（铁矿-3，贡献-' + cost + '，攻击+15%持续12小时）';
        log(line, 'success'); msg(line, 'success');
        try { if (typeof W.updateInventoryUI === 'function') W.updateInventoryUI(); } catch (e) {}
        return true;
    };

    // ============ C 膳堂 · 用膳听街谈（饭气增益 + 接批二街谈池） ============
    var CANTEEN_RUMORS = [
        '邻桌两个师弟在争论上回大比谁该夺魁，争到面红耳赤，最后一同出门练去了。',
        '打饭的师傅说，山下镇子今儿来了个游方货郎，卖的都是些稀奇古怪的玩意儿。',
        '有人压低声音讲，后山近日闹灵兽，巡夜的师兄多了两倍。',
        '一个跑江湖的同门带回消息：隔壁郡的坊市，灵石行情又涨了。',
        '灶上蒸着新米，香得整个膳堂都是。有师弟感叹：能安稳吃口热饭，比什么都强。'
    ];
    W.openCanteenPanel = function () {
        var d = ds(); if (!d || !d.isInSect) { msg('还没入门，膳堂不开灶。', 'warning'); return; }
        var html = '<div class="text-left">';
        html += '<p class="text-sm text-gray-300 mb-2">灶上正热。坐下吃一顿——饭气养人，桌上还能听见同门与山下的闲话。</p>';
        html += '<button onclick="window.doCanteenMeal()" class="w-full bg-amber-700 hover:bg-amber-600 text-white text-sm p-2 rounded mb-2">🍲 用膳（耗贡献5，得饭气增益+听一句街谈）</button>';
        html += '<p class="text-[11px] text-gray-500">饭气：半日内体魄与心境略增；街谈：膳堂是消息最杂的地方，有时一句话能省下你三天脚程。</p>';
        html += '</div>';
        modal('🍚 膳堂 · 用膳', html);
    };
    W.doCanteenMeal = function () {
        if (!spendC(5, '膳堂·用膳')) { msg('贡献不足五点，灶上不开火。', 'error'); return false; }
        try { if (typeof W.applyBuff === 'function') W.applyBuff('sect_canteen_meal', { constitution: 3, willpower: 2 }, 12); } catch (e) {}
        // 街谈：优先读批二丐帮街谈池的动态（若主线街谈已入缓冲），否则用膳堂本地池
        var rumor = null;
        try {
            var qs = flags()['qi_street'];
            if (qs && qs.length) rumor = qs[qs.length - 1].text;
        } catch (e) {}
        if (!rumor) rumor = CANTEEN_RUMORS[absDay() % CANTEEN_RUMORS.length];
        var line = '🍲 一顿热饭下肚，饭气养人（体魄+3 心境+2，半日）。' + (rumor.indexOf('👂') === 0 ? '隔壁桌在说：' + rumor.replace(/^👂[^：]*：/, '') : '席间听见——' + rumor);
        log(line, 'info'); msg(line, 'success');
        return true;
    };

    // ============ D 医馆 · 旧伤复发（真败北落旧伤，苦战时复发拖后腿） ============
    // 旧伤记录：由 app.js 在「非切磋、非剧情豁免」的真败北处调用
    W.recordOldWound = function (sourceName) {
        var L = life(); if (!L) return false;
        if (!L.oldWounds) L.oldWounds = [];
        if (L.oldWounds.length >= 3) return false;       // 一身旧伤至多三处，再多就当是老了
        if (Math.random() > 0.4) return false;            // 不是每场败北都落下病根
        var PARTS = ['左肩', '右肋', '后腰', '膝头', '腕骨'];
        var part = PARTS[Math.floor(Math.random() * PARTS.length)];
        L.oldWounds.push({ part: part, day: absDay(), from: sourceName || '一场恶战' });
        log('🩹 ' + part + '落下了旧伤——那日与「' + (sourceName || '强敌') + '」一战没养利索。阴雨天会提醒你它还在。（去医馆可治）', 'warning');
        return true;
    };
    // 旧伤复发：苦战开场时按旧伤数掷，复发则本场攻击受挫（由战斗钩子读 getOldWoundPenalty）
    W.getOldWoundPenalty = function () {
        var L = life(); if (!L || !L.oldWounds || !L.oldWounds.length) return 0;
        // 每处旧伤 6% 攻击折损，封顶 18%
        return Math.min(0.18, L.oldWounds.length * 0.06);
    };
    W.openMedicalPanel = function () {
        var d = ds(), L = life(); if (!d || !d.isInSect) { msg('还没入门，医馆不收。', 'warning'); return; }
        var wounds = (L && L.oldWounds) || [];
        var html = '<div class="text-left">';
        if (!wounds.length) {
            html += '<p class="text-sm text-gray-300 mb-2">你一身轻健，没有落下旧伤。（既有疗伤仍走医馆主功能：耗贡献回伤势。）</p>';
        } else {
            html += '<p class="text-sm text-gray-300 mb-2">你身上有 <b class="text-red-400">' + wounds.length + '</b> 处旧伤，苦战时会拖累出手：</p>';
            wounds.forEach(function (w) {
                html += '<div class="flex justify-between items-center bg-gray-800/60 p-2 rounded mb-1">'
                    + '<span class="text-sm text-gray-200">🩹 ' + w.part + ' <span class="text-xs text-gray-500">（' + w.from + '·第' + w.day + '日）</span></span>'
                    + '<button onclick="window.doTreatOldWound(\'' + w.part + '\')" class="text-xs bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1 rounded">医治（贡献20）</button></div>';
            });
            html += '<p class="text-[11px] text-gray-500 mt-1">每处旧伤折损攻击百分之六，三处封顶百分之十八——治好一处，少一分拖累。</p>';
        }
        html += '</div>';
        modal('💊 医馆 · 旧伤', html);
    };
    W.doTreatOldWound = function (part) {
        var L = life(); if (!L || !L.oldWounds) return false;
        var idx = -1;
        for (var i = 0; i < L.oldWounds.length; i++) { if (L.oldWounds[i].part === part) { idx = i; break; } }
        if (idx < 0) { msg('查无此处旧伤。', 'warning'); return false; }
        if (!spendC(20, '医馆·医治旧伤')) { msg('贡献不足二十点，医馆药材出自公中，例不赊欠。', 'error'); return false; }
        var w = L.oldWounds.splice(idx, 1)[0];
        var line = '💊 医者用银针与药酒替你把' + w.part + '的陈年淤滞揉开——一阵刺痛后，那块地方松快了。旧伤已愈。（贡献-20）';
        log(line, 'success'); msg(line, 'success');
        return true;
    };

    // ============ E 议事厅 · 挂账本（接批一贡献账本公示） ============
    W.openCouncilLedger = function () {
        var d = ds(); if (!d || !d.isInSect) { msg('还没入门，议事厅不议事。', 'warning'); return; }
        // 议事厅是账本公示之地——直接打开批一的贡献账本面板（同一本账，挂在厅里同门都看得见）
        if (typeof W.openSectLedger === 'function') { W.openSectLedger(); return; }
        msg('账本还没挂起来。', 'info');
    };

    // ============ F 三十六地标 · 熟识成长线（常去则熟，花贡献可深交） ============
    // 熟识档位：0生 / 3熟 / 7密 / 12知交——每档让该地标的增益更厚一层
    function bondOf(fid) { var L = life(); if (!L) return 0; if (!L.bond) L.bond = {}; return Number(L.bond[fid] || 0); }
    function bondTier(fid) { var b = bondOf(fid); return b >= 12 ? 3 : b >= 7 ? 2 : b >= 3 ? 1 : 0; }
    var BOND_WORD = ['陌生', '熟识', '亲密', '知交'];
    // 地标增益乘子（供 effectiveActions 读；批三在地标 tempBuff 上叠熟识厚度）
    W.landmarkBondBonus = function (fid) { var t = bondTier(fid); return t === 0 ? 0 : +(t * 0.15).toFixed(2); }; // 熟+15% 密+30% 知交+45%
    // 用一次地标 = 熟识+1（由 useFacility 成功路径调用）
    W.touchLandmark = function (fid) {
        var L = life(); if (!L || !fid || fid.indexOf('fx_') !== 0) return;
        if (!L.bond) L.bond = {};
        var before = Number(L.bond[fid] || 0);
        L.bond[fid] = before + 1;
        var t0 = before >= 12 ? 3 : before >= 7 ? 2 : before >= 3 ? 1 : 0;
        var t1 = bondTier(fid);
        if (t1 > t0) {
            var nm = landmarkName(fid);
            var lines = {
                1: '🌸 你常来' + nm + '，守处的同门认得你了——「来了？老地方。」熟识之地，气息也亲厚三分。',
                2: '🌸 ' + nm + '与你渐入亲密。你闭着眼都找得到那块最养人的位置，增益更厚一层。',
                3: '🌸 ' + nm + '待你如知交。这方天地认得你的气息——增益厚到了顶处。'
            };
            log(lines[t1], 'success'); msg(lines[t1], 'success');
        }
    };
    function landmarkName(fid) {
        try {
            var ex = W.SECT_FACILITY_EXTRAS || {};
            for (var s in ex) { for (var i = 0; i < ex[s].length; i++) { if (ex[s][i].id === fid) return ex[s][i].name; } }
        } catch (e) {}
        return '此地';
    }
    W.openLandmarkBondPanel = function (fid) {
        var d = ds(); if (!d || !d.isInSect) { msg('还没入门。', 'warning'); return; }
        var b = bondOf(fid), t = bondTier(fid);
        var html = '<div class="text-left">';
        html += '<div class="bg-gray-800 p-2 rounded mb-2 text-sm text-gray-300">' + landmarkName(fid) + ' · 熟识：<b class="text-purple-300">' + BOND_WORD[t] + '</b>（' + b + '）</div>';
        html += '<p class="text-xs text-gray-400 mb-2">常来则熟，熟则气息亲厚——增益随之加厚。也可花贡献「深交」，一举拉近距离。</p>';
        var nextNeed = t >= 3 ? 0 : (t === 0 ? 3 : t === 1 ? 7 : 12);
        if (t >= 3) {
            html += '<p class="text-sm text-green-300">已是知交——这方天地待你，厚到了顶处（增益+45%）。</p>';
        } else {
            html += '<p class="text-xs text-gray-300 mb-2">再 +<b class="text-amber-300">' + (nextNeed - b) + '</b> 熟识升到「' + BOND_WORD[t + 1] + '」（增益+' + ((t + 1) * 15) + '%）。</p>';
            html += '<button onclick="window.doDeepenBond(\'' + fid + '\')" class="w-full bg-purple-700 hover:bg-purple-600 text-white text-sm p-2 rounded">🤝 深交（贡献30，熟识+3）</button>';
        }
        html += '</div>';
        modal('🌸 ' + landmarkName(fid) + ' · 熟识', html);
    };
    W.doDeepenBond = function (fid) {
        var L = life(); if (!L) return false;
        if (bondTier(fid) >= 3) { msg('已是知交，无需再深交。', 'info'); return false; }
        if (!spendC(30, '地标深交·' + landmarkName(fid))) { msg('贡献不足三十点——深交也要诚意。', 'error'); return false; }
        if (!L.bond) L.bond = {};
        L.bond[fid] = Math.min(15, Number(L.bond[fid] || 0) + 3);
        var line = '🤝 你在' + landmarkName(fid) + '多留了半日，替守处做些实事——熟识深了。（贡献-30，熟识+3）';
        log(line, 'success'); msg(line, 'success');
        return true;
    };

    // ============ G 设施深化入口注册（sect-visit 渲染深作按钮时读这张表） ============
    W.SECT_FACILITY_DEEP_ACTIONS = {
        'sect_training_ground': { label: '🤺 切磋', fn: 'openSparPanel' },
        'sect_armory': { label: '🔥 淬火', fn: 'openTemperPanel' },
        'sect_canteen': { label: '🍲 用膳', fn: 'openCanteenPanel' },
        'sect_medical': { label: '🩹 旧伤', fn: 'openMedicalPanel' },
        'sect_chat': { label: '📜 账本', fn: 'openCouncilLedger' }
    };
    // 地标深交入口（按 fid 动态）
    W.sectFacilityDeepAction = function (fid) {
        if (W.SECT_FACILITY_DEEP_ACTIONS[fid]) return W.SECT_FACILITY_DEEP_ACTIONS[fid];
        if (fid && fid.indexOf('fx_') === 0) return { label: '🌸 熟识', fn: 'openLandmarkBondPanel', arg: fid };
        return null;
    };

    // ============ H 存档持久化 ============
    // _facLife 随 discipleState 的权威存读档持久化（sects-system.js StateRegistry 'discipleState'
    // 的 export/import 已并入 _facLife）——与 _ledger 同一生命周期，不另立注册键以免读档时序依赖。

    // 探针（测试与批五大比用）
    W.sectFacilityLifeProbe = function () {
        var L = life();
        return L ? {
            sparStreak: L.sparStreak || 0, sparBest: L.sparBest || 0, sparMomentum: L.sparMomentum || 0,
            oldWounds: (L.oldWounds || []).length, woundPenalty: W.getOldWoundPenalty(),
            bond: JSON.parse(JSON.stringify(L.bond || {}))
        } : null;
    };

    console.log('[sect-facility-life] 门派建筑做出理由：演武场切磋（真仗/连胜/大比预热）+ 兵器库淬火 + 膳堂用膳听街谈 + 医馆旧伤 + 议事厅挂账本 + 三十六地标熟识成长线');
})();
