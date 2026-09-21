// ==================== sect-war.js - 宗门战争因果 + 自建宗门入江湖（补厚批五 · 孤岛打通） ====================
// 病根：①宗门战争是一个「随机挑目标掷骰子」的死键（initiateSectWarPrompt 全仓零调用，
//       仗不打真仗、胜败不靠人）；②自建宗门是化外之地——36派外交网没有它的名字，宗门史烂在面板里不入大事记。
// 本批：
//   一、战争由因果触发——外交网里结下死仇（关系≤-70）的门派，每日有机会兵临山门（真仗，防守方）；
//       玩家也可主动兴兵，但只对宿怨（关系≤-40）的门派、且须长老以上（真仗，攻山方）。
//       胜负走 startBattle 真战斗 + app.js _isSectWarBattle 结算钩子；胜负真改外交关系、真入账本、两战之间六十日喘气。
//   二、自建宗门入江湖——立宗即在 36 派外交网里落座（按立宗取向定初始亲疏），
//       宗门总册挂「江湖外交」入口；宗门史每一笔同步落进世界大事记（立宗/收徒/战事/政策都有天下回响）。
// 纪律：真仗真结算；关系数值走既有 SECT_DIPLOMACY_STATE（v20.48 落账口径）；贡献走批一账本；零外文字母。
(function () {
    'use strict';
    var W = window;

    function ds() { return W.discipleState || null; }
    function cd() { return W.currentCharData || null; }
    function flags() { return (W.eventFlags = W.eventFlags || {}); }
    function absDay() { try { return W.timeSystem && W.timeSystem.getAbsoluteDay ? (Number(W.timeSystem.getAbsoluteDay()) || 0) : 0; } catch (e) { return 0; } }
    function log(m, t) { try { if (W.gameLog && W.gameLog.add) W.gameLog.add(m); else if (W.showMessage) W.showMessage(m, t || 'info'); } catch (e) {} }
    function msg(m, t) { if (typeof W.showMessage === 'function') W.showMessage(m, t || 'info'); }
    function modal(t, b) { if (typeof W.showModal === 'function') W.showModal(t, b); }
    function diplo() { return W.SECT_DIPLOMACY_STATE || null; }
    function realmTier(realm) { try { if (typeof W.getRealmTier === 'function') { var t = Number(W.getRealmTier(realm)); if (isFinite(t)) return t; } } catch (e) {} return 1; }
    function addStones(n) {
        try { if (W.XianXia && W.XianXia.DataManager && W.XianXia.DataManager.addSpiritStones) { W.XianXia.DataManager.addSpiritStones(n); return; } } catch (e) {}
        if (W.inventory && W.inventory.currency) W.inventory.currency.spiritStones = (Number(W.inventory.currency.spiritStones) || 0) + n;
    }
    function addC(n, r) { try { if (typeof W.sectAddContribution === 'function') { W.sectAddContribution(n, r); return; } } catch (e) {} var d = ds(); if (d) d.contribution = (Number(d.contribution) || 0) + n; }
    function spendC(n, r) { try { if (typeof W.sectSpendContribution === 'function') return W.sectSpendContribution(n, r); } catch (e) {} var d = ds(); if (!d || (Number(d.contribution) || 0) < n) return false; d.contribution -= n; return true; }
    var POWER_MUL = { '巨擘': 1.4, '大派': 1.2, '中等偏上': 1.05, '中等': 1.0, '小': 0.85, '极小': 0.7, '未知': 1.0 };
    function powerMul(sectId) {
        // 方案一：势力座次是活的——优先读动态档（sect-standing），静态标签只做兜底
        try { if (typeof W.sectPowerWarMul === 'function') { var m = W.sectPowerWarMul(sectId); if (m) return m; } } catch (e0) {}
        try { var s = (W.sectsData || {})[sectId]; return POWER_MUL[(s && s.power) || '未知'] || 1; } catch (e) { return 1; }
    }
    function standingHit(sect, win) {
        // 战绩进座次（月度衰减），攻守还动立场：守山长脸，攻山损名
        try { if (typeof W.sectPowerWarMod === 'function') W.sectPowerWarMod(sect, win); } catch (e) {}
        try { if (typeof W.sectAlignShift === 'function') W.sectAlignShift(sect, win ? 2 : -3, '战事'); } catch (e2) {}
    }
    function relCell(mySect, other) {
        var d = diplo();
        if (!d || !d[mySect] || !d[mySect][other]) return null;
        return d[mySect][other];
    }
    function warCd(sectId) { return Number(flags()['sect_war_cd_' + sectId] || 0); }
    function setWarCd(sectId) { flags()['sect_war_cd_' + sectId] = absDay() + 60; }
    // 第十九波：自家山门（自建宗门）——不在别家门下当差时，掌门的家就是战场
    function homeNameOf() {
        try { return (W.PSectWorld && typeof W.PSectWorld.homeName === 'function') ? W.PSectWorld.homeName() : null; } catch (e) { return null; }
    }
    // 第三十二波：道侣上墙头——自家山门墙上并肩站着几对家里人，敌人的锐气就再折几分（一对折三分，至多三对九分）
    function daoWallEdge(home, enemy) {
        if (!home || !enemy || !W.PSectLife || typeof W.PSectLife.daoPairsAtHome !== 'function') return 0;
        try {
            var pairs = W.PSectLife.daoPairsAtHome(home);
            if (pairs <= 0) return 0;
            var pct = Math.min(9, pairs * 3);
            enemy.attack = Math.max(1, Math.round((Number(enemy.attack) || 0) * (1 - pct / 100)));
            log('🏮 道侣上墙头——' + pairs + '对家里人在墙上并肩而立，来犯者锐气再折' + pct + '%。（有家的人，刀上有力）', 'success');
            return pct;
        } catch (e) { return 0; }
    }

    // ============ 一 · 战争因果 ============
    function buildWarEnemy(sectId, side) {
        var c = cd() || {};
        var tier = Math.max(1, realmTier(c.realm));
        var pm = powerMul(sectId);
        var who = side === 'defend' ? '压山长老' : '守山执事';
        return {
            name: sectId + '·' + who, type: 'enemy', physiologyType: 'humanoid',
            level: Math.max(1, (typeof W.realmScaledEnemyLevel === 'function' ? W.realmScaledEnemyLevel(c) : tier * 3)),
            attack: Math.round((38 + tier * 7) * pm), defense: Math.round((20 + tier * 4) * pm), speed: Math.round(20 + tier * 2),
            maxDurability: Math.round((110 + tier * 20) * pm), durabilities: { chest: Math.round((110 + tier * 20) * pm) },
            combatAbilities: [], sect: sectId,
            description: side === 'defend' ? (sectId + '的人马堵在山门外——积怨到了用刀说话的地步。') : (sectId + '的山门就在眼前——积怨到了用刀说话的地步。')
        };
    }
    function startWar(sectId, side, home) {
        if (typeof W.startBattle !== 'function') { msg('战端未就绪。', 'error'); return false; }
        var enemy = buildWarEnemy(sectId, side);
        // 第二十波：守山开战前，盟家按交情掷骰领众来援——来的真削敌人战力（分兵），名单随战局走
        var came = null;
        if (side === 'defend' && home && W.PSectWorld && typeof W.PSectWorld.allyAid === 'function') {
            try { came = W.PSectWorld.allyAid(home, enemy); } catch (eA) {}
        }
        // 第二十一波：自家镇山秘艺在手——弟子使的是自家路数，敌人未战先怯（每阶折敌战力三分）
        if (home && W.PSectLife && typeof W.PSectLife.warEdge === 'function') {
            try { W.PSectLife.warEdge(home, enemy); } catch (eArt) {}
        }
        // 第二十三波：护山阵真守山——布了宗门阵（护山）的山门，来犯攻势被阵法灵光挫掉一截；
        // 阵旗经一场恶战真磨损（磨尽阵散，回洞府深作重布）
        if (side === 'defend' && W.FormationSystem && typeof W.FormationSystem.getSectFormationActive === 'function') {
            try {
                var guard = W.FormationSystem.getSectFormationActive();
                var pct = guard && guard.buff ? (Number(guard.buff.sectAttackReducePct) || 0) : 0;
                if (pct > 0) {
                    enemy.attack = Math.max(1, Math.round((Number(enemy.attack) || 0) * (1 - pct / 100)));
                    log('🌀 「' + guard.name + '」灵光升起——来犯之敌的攻势被阵法挫了' + pct + '%。（阵旗经此一战，磨损了几分）', 'success');
                    W.FormationSystem.wearSectFormation(2);
                }
            } catch (eG) {}
        }
        // 第三十二波：道侣上墙头——守自家的山门，家里人在墙上，敌人未战先怯三分
        if (side === 'defend' && home) daoWallEdge(home, enemy);
        var b = W.startBattle(enemy);
        if (b) { b._isSectWarBattle = true; b._warSect = sectId; b._warSide = side; if (came && came.length) b._warAllies = came; }
        var cry = side === 'defend'
            ? ('⚔️ ' + sectId + '兵临山门——旧怨新仇，今日用刀算清。这一仗，你站在山门这头。')
            : ('⚔️ 你提兵直上' + sectId + '山门——旧怨新仇，今日用刀算清。');
        log(cry, 'danger');
        return true;
    }
    // 战后结算（app.js _isSectWarBattle 分支调用）
    W.settleSectWar = function (win) {
        var b = W.currentBattle || {};
        var sectId = b._warSect, side = b._warSide || 'defend';
        if (!sectId) return;
        // 第十九波：自建宗门的战事——结算落自家真账（宗库两讫/弟子战殁/声望士气），不动弟子贡献账
        // 第二十波：随结算带上盟约两事——守山谁来援了、攻山是为哪家盟家解围
        if (b._warHome && W.PSectWorld && typeof W.PSectWorld.settlePsWar === 'function') {
            setWarCd(sectId);
            try { W.PSectWorld.settlePsWar(win, sectId, side, b._warHome, { allies: b._warAllies || null, rescue: b._warRescue || null }); } catch (ePs) {}
            try { if (typeof W.saveSectDiplomacy === 'function') W.saveSectDiplomacy(); } catch (eS) {}
            return;
        }
        var d = ds();
        var mySect = d ? (d.sectName || d.sectId) : null;
        var cell = mySect ? relCell(mySect, sectId) : null;
        setWarCd(sectId);
        if (side === 'defend') {
            if (win) {
                if (cell) cell.relation = Math.max(-100, Math.min(100, (cell.relation || 0) + 20));
                addC(60, '护宗之战·击退来犯');
                if (mySect) standingHit(mySect, true);
                try { // 第二十波：来援的盟家——打退了敌人，这份情分也记账（关系回暖五分）
                    var ca = b._warAllies || [];
                    ca.forEach(function (a) { var ac = mySect ? relCell(mySect, a) : null; if (ac) ac.relation = Math.max(-100, Math.min(100, (Number(ac.relation) || 0) + 5)); });
                } catch (eAl) {}
                try { if (typeof W.changeFactionReputation === 'function') {} } catch (e) {}
                var line = '🛡️ ' + sectId + '的人退了——山门保住，你的刀他们记住了。（本派关系回暖，贡献+60入账）';
                log(line, 'success'); msg(line, 'success');
            } else {
                if (cell) cell.relation = Math.max(-100, Math.min(100, (cell.relation || 0) - 10));
                if (mySect) standingHit(mySect, false);
                try { if (typeof W.sectPowerWarMod === 'function') W.sectPowerWarMod(sectId, true); } catch (eW) {}
                var line2 = '💔 山门被' + sectId + '踏破了一角，库房被搬走一批——这笔账，来日再算。（战败之痛照常：昏迷、旧伤都可能落下）';
                log(line2, 'error'); msg(line2, 'error');
                // 改造批 · 抚恤：守山战败，可能有具名同门没能回来（葬礼/抚恤出库/编年记殁）
                try { if (Math.random() < 0.35 && typeof W.sectShieldFuneral === 'function') W.sectShieldFuneral(mySect, '守山那一仗'); } catch (eF) {}
            }
        } else {
            if (win) {
                if (cell) cell.relation = Math.max(-100, Math.min(100, (cell.relation || 0) - 35));
                var spoils = Math.round((120 + Math.floor(Math.random() * 180)) * powerMul(sectId));
                try { // 第九波·守恒：战利品不是凭空来的——真从对方库房里搬（户部账同步扣减）
                    var itSpoil = (W.SECT_INTERNAL || {})[sectId];
                    if (itSpoil) itSpoil.resources = Math.max(0, (Number(itSpoil.resources) || 0) - spoils);
                } catch (eSp) {}
                addStones(spoils);
                addC(40, '攻山之战·先登之功');
                if (mySect) standingHit(mySect, true);
                try { if (typeof W.sectPowerWarMod === 'function') W.sectPowerWarMod(sectId, false); } catch (eW2) {}
                try { if (W.currentCharData) W.currentCharData.fame = Math.min(9999, (W.currentCharData.fame || 0) + 5); } catch (e) {}
                var line3 = '⚔️ ' + sectId + '的山门被你踏破——库房清点出灵石' + spoils + '，门中记你先登之功。（对方记仇了：关系大跌）';
                log(line3, 'success'); msg(line3, 'success');
            } else {
                if (cell) cell.relation = Math.max(-100, Math.min(100, (cell.relation || 0) - 5));
                if (mySect) standingHit(mySect, false);
                try { if (typeof W.sectPowerWarMod === 'function') W.sectPowerWarMod(sectId, true); } catch (eW3) {}
                var line4 = '💔 攻山不成，反被' + sectId + '打了下来——江湖人都会知道这一仗。（关系再冷一分）';
                log(line4, 'error'); msg(line4, 'error');
            }
        }
        try { if (typeof W.saveSectDiplomacy === 'function') W.saveSectDiplomacy(); } catch (e) {}
        // 批六 · 活门派联动：守山胜负动兵器库与护山大阵（库存不是面板数字）
        try { if (W.SectGov && typeof W.SectGov.onWar === 'function' && mySect) W.SectGov.onWar(mySect, win, side); } catch (e) {}
    };
    // 日钩：死仇（关系≤-70）每日有机会兵临山门——战争是因果，不是按钮
    // 第十九波：自家山门也算——死仇压上自建宗门的门，掌门带着门人打真仗（弟子身优先，骑墙态先顾师门）
    function warDayTick() {
        var c = cd();
        if (!c) return;
        if (W.currentBattle) return;                       // 战斗中不叠台
        var d = ds();
        var home = (d && d.isInSect) ? (d.sectName || d.sectId) : null;
        var psHome = home ? null : homeNameOf();
        var mySect = home || psHome;
        if (!mySect) return;
        var row = diplo() && diplo()[mySect];
        if (!row) return;
        var foes = [];
        for (var other in row) {
            var cell = row[other];
            if (!cell || (Number(cell.relation) || 0) > -70) continue;
            try { if (typeof W.sectIsRuined === 'function' && W.sectIsRuined(other)) continue; } catch (e) {} // 第九波：灭了的门派不该再来袭山
            if (absDay() < warCd(other)) continue;
            foes.push(other);
        }
        if (!foes.length) return;
        // 第二十三波：迷踪阵真迷踪——布了阵，仇家的探子摸不清山门朝向，寻仇的骰子被压下去
        var warP = 0.04;
        try {
            if (W.FormationSystem && typeof W.FormationSystem.getSectFormationActive === 'function') {
                var hid = W.FormationSystem.getSectFormationActive();
                var gp = hid && hid.buff ? (Number(hid.buff.sectGrudgeReducePct) || 0) : 0;
                if (gp > 0) warP = warP * (1 - gp / 100);
            }
        } catch (eL) {}
        if (Math.random() >= warP) return;           // 死仇也不是天天打——一日一骰，山雨欲来有酝酿
        var foe = foes[Math.floor(Math.random() * foes.length)];
        log('🌩️ ' + foe + '与你门的恩怨压不住了——探子来报，对方点齐人马，正往山门来。', 'warning');
        startWar(foe, 'defend', psHome);
        if (psHome) { try { var b0 = W.currentBattle; if (b0) b0._warHome = psHome; } catch (eB) {} }
    }
    try {
        var dayHook = function () { try { resolveTidePending(); } catch (e3) {} try { warDayTick(); } catch (e) {} try { tideSiegeDayTick(); } catch (e2) {} };
        if (W.timeSystem && typeof W.timeSystem.onNewDaySubscribe === 'function') W.timeSystem.onNewDaySubscribe(dayHook);
        else if (W.EventBus && W.EventBus.on) W.EventBus.on('newDay', dayHook);
    } catch (e) {}

    // 玩家主动兴兵：替换旧死键（随机目标掷骰子）——只对宿怨之门、真仗
    // 第十九波：掌门有自家山门——殿议就是自家堂上说了算（骑墙态弟子身优先，殿上替师门说话）
    W.initiateSectWarPrompt = function () {
        var d = ds();
        var inSect = !!(d && d.isInSect);
        var psHome = inSect ? null : homeNameOf();
        if (!inSect && !psHome) { msg('未加入门派——没有山门，何来战事。', 'warning'); return; }
        var rank = (d && inSect && d.rank != null) ? d.rank : 7;
        if (inSect && rank > 2) { msg('⚔️ 兴兵是长老以上在大殿里议的事——你如今说不上这个话。把差事办好，把位分熬上去。', 'info'); return; }
        var mySect = inSect ? (d.sectName || d.sectId) : psHome;
        var row = diplo() && diplo()[mySect];
        var targets = [];
        if (row) {
            for (var other in row) {
                var cell = row[other];
                if (!cell || (Number(cell.relation) || 0) > -40) continue;
                targets.push({ id: other, rel: Number(cell.relation) || 0, cd: absDay() < warCd(other) });
            }
        }
        targets.sort(function (a, b) { return a.rel - b.rel; });
        var html = '<div class="text-left">';
        if (!inSect) html += '<p class="text-xs text-amber-300 mb-2">你是「' + mySect + '」的掌门——殿上你说了算。兴兵是真仗：赢了缴获入宗库，输了江湖耻笑。</p>';
        if (!targets.length) {
            html += '<p class="text-sm text-gray-400">殿上议了一圈——没有哪门哪派与你门结着能动刀的怨。<br><span class="text-xs text-gray-500">仗不是想打就能打的：先有宿怨（关系冷淡以下），才有兴兵的名分。</span></p>';
        } else {
            html += '<p class="text-xs text-gray-400 mb-2">与这些门派已有宿怨，兴兵有名。攻山是真仗——赢了库房归你，输了江湖耻笑：</p>';
            targets.forEach(function (t) {
                html += '<div class="flex justify-between items-center bg-gray-800/60 p-2 rounded mb-1">'
                    + '<span class="text-sm text-gray-200">⚔️ ' + t.id + ' <span class="text-xs ' + (t.rel <= -70 ? 'text-red-400' : 'text-orange-300') + '">' + (t.rel <= -70 ? '死仇' : '宿怨') + '</span></span>'
                    + (t.cd ? '<span class="text-xs text-gray-500">六十日之内刚动过刀——喘息未定</span>'
                        : '<button onclick="window.doDeclareWar(\'' + t.id + '\')" class="text-xs bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded">兴兵</button>')
                    + '</div>';
            });
        }
        html += '</div>';
        modal('⚔️ 宗门战争 · 殿议', html);
    };
    W.doDeclareWar = function (sectId) {
        var d = ds();
        var inSect = !!(d && d.isInSect);
        if (inSect && (d.rank == null ? 7 : d.rank) <= 2) {
            if (absDay() < warCd(sectId)) { msg('六十日之内刚与' + sectId + '动过刀——门中上下都要喘口气。', 'warning'); return false; }
            var cell = relCell(d.sectName || d.sectId, sectId);
            if (!cell || (Number(cell.relation) || 0) > -40) { msg('与' + sectId + '没有能动刀的怨——兴兵无名，殿上不会点头。', 'warning'); return false; }
            try { var ov = document.getElementById('xianxia-modal-overlay'); if (ov) ov.remove(); } catch (e) {}
            return startWar(sectId, 'attack');
        }
        // 第十九波：说不上师门的话（或根本不在门中）——若自家立着山门，掌门兴兵，同一套规矩
        var psHome = homeNameOf();
        if (psHome) return W.declareWarForHome(psHome, sectId);
        msg(inSect ? '兴兵是长老以上在大殿里议的事——你如今说不上这个话。' : '未加入门派——没有山门，何来战事。', 'warning');
        return false;
    };
    // 为自家山门兴兵（外交面板/殿议共用）：宿怨 + 六十日喘气，真仗，结算走 PSectWorld.settlePsWar
    W.declareWarForHome = function (home, sectId) {
        if (!home) return false;
        if (absDay() < warCd(sectId)) { msg('六十日之内刚与' + sectId + '动过刀——门中上下都要喘口气。', 'warning'); return false; }
        var cell = relCell(home, sectId);
        if (!cell || (Number(cell.relation) || 0) > -40) { msg('与' + sectId + '没有能动刀的怨——兴兵无名，殿上不会点头。', 'warning'); return false; }
        try { var ov2 = document.getElementById('xianxia-modal-overlay'); if (ov2) ov2.remove(); } catch (e2) {}
        var okB = startWar(sectId, 'attack', home); // 第二十一波：自家山门兴兵，镇山秘艺随军
        try { var bb = W.currentBattle; if (bb && okB) bb._warHome = home; } catch (e3) {}
        return okB;
    };
    // 第二十波 · 出兵相援：江湖战云里被围的是自家盟家——掌门提兵下山，真仗击退围军
    // （风云册「山下点兵」一栏的按钮直达；胜则战云散、盟家谢礼入宗库，败则围还在、情分记下）
    W.doAllyRescue = function () {
        var psHome = homeNameOf();
        if (!psHome) { msg('还没立宗——提谁的兵，相谁的援。', 'warning'); return false; }
        var p = flags()['sect_world_war_pending'];
        if (!p) { msg('眼下山下没有点兵的——援无从出。', 'info'); return false; }
        var isAlly = false;
        try { isAlly = (W.PSectWorld && W.PSectWorld.alliesOf ? W.PSectWorld.alliesOf(psHome) : []).indexOf(p.def) >= 0; } catch (eA) {}
        if (!isAlly) { msg('「' + p.def + '」与你家没换过盟书——出兵无名，江湖上要笑话的。', 'warning'); return false; }
        if (W.currentBattle) { msg('手头上正有一仗——先顾眼前。', 'warning'); return false; }
        if (absDay() < warCd(p.atk)) { msg('六十日之内刚与' + p.atk + '动过刀——门中上下都要喘口气。', 'warning'); return false; }
        try { var ov = document.getElementById('xianxia-modal-overlay'); if (ov) ov.remove(); } catch (e2) {}
        var okB = startWar(p.atk, 'attack', psHome); // 第二十一波：出兵相援，镇山秘艺也随军
        try { var bb = W.currentBattle; if (bb && okB) { bb._warHome = psHome; bb._warRescue = p.def; } } catch (e3) {}
        if (okB) log('🤝 盟书有约——你提兵下山，直扑「' + p.def + '」山下：「' + p.atk + '」的围军，今日要面对两家的刀。', 'warning');
        return okB;
    };

    // ============ 第二十五波 · 兽潮压山门：兽潮不只是街面上的机缘，兽也会打山门 ============
    // 兽潮未散期间，每日兽群有机会改道扑向玩家的山门（弟子身的师门与自建宗门同一口径）：
    // 真仗——潮越大扑得越凶；赢了兽核入囊、历练入账、山门长脸；输了库房被兽群糟蹋、可能有人没能回来。
    // 镇山秘艺与护山阵照常出力（同一套战前折敌管线）。
    // 第二十七波 · 兽潮共守（盟书也管退兽——第二十五波记的「盟家来援不参与退兽」欠账当场还）：
    //   ①自家山门遭兽围，盟家按交情掷骰领众上墙头（来一家兽群凶性折一成）；战后两家情分记账、编年互记。
    //   ②潮活期间江湖各家山门也会遭围（后台真结算：守得住长脸，守不住库房折损、门人殒命）；
    //     被围的若是自家盟家，风云册上挂潮讯——掌门可「提兵相助」（真仗），赢了谢礼入宗库、盟好如金石。
    function tideLevelNum() {
        try {
            var t = (W.BeastTide && typeof W.BeastTide.getActiveTide === 'function') ? W.BeastTide.getActiveTide() : null;
            if (!t) return 0;
            if (t.expireDay != null && absDay() >= Number(t.expireDay)) return 0; // 潮散了就是散了——不拿过期的潮吓唬人
            var n = parseInt(String(t.level || '').replace('tide_', ''), 10);
            return isFinite(n) ? Math.max(1, Math.min(10, n)) : 1;
        } catch (e) { return 0; }
    }
    function tideName() {
        try { var t = W.BeastTide.getActiveTide(); return (t && t.name) || '兽潮'; } catch (e) { return '兽潮'; }
    }
    function buildTideEnemy(lv) {
        var c = cd() || {};
        var tier = Math.max(1, realmTier(c.realm));
        var mul = 0.8 + lv * 0.12; // 小兽潮是搔扰，仙劫潮是天灾
        var dur = Math.round((120 + tier * 22) * mul);
        return {
            name: tideName() + '·叩门兽群', type: 'beast', species: 'beast', physiologyType: 'beast',
            level: Math.max(1, (typeof W.realmScaledEnemyLevel === 'function' ? W.realmScaledEnemyLevel(c) : tier * 3) + lv),
            attack: Math.round((34 + tier * 7) * mul), defense: Math.round((16 + tier * 4) * mul), speed: Math.round(22 + tier * 2 + lv),
            maxDurability: dur, durabilities: { chest: dur },
            combatAbilities: [],
            description: '兽潮改了道，正扑着山门来——兽吼滚成一片，今日这道门必须守住。'
        };
    }
    function startTideSiege(psHome) {
        if (typeof W.startBattle !== 'function') return false;
        var lv = tideLevelNum();
        if (!lv) return false;
        var enemy = buildTideEnemy(lv);
        // 第二十七波：盟家上墙头——自家山门（自建或师门）遭兽围，盟家按交情掷骰来援，来的真折兽群凶性
        var d0 = ds();
        var homeForAid = psHome || ((d0 && d0.isInSect) ? (d0.sectName || d0.sectId) : null);
        var came = null;
        if (homeForAid && W.PSectWorld && typeof W.PSectWorld.allyAid === 'function') {
            try { came = W.PSectWorld.allyAid(homeForAid, enemy, 'tide'); } catch (eAl) {}
        }
        // 自家山门才有秘艺可恃
        if (psHome && W.PSectLife && typeof W.PSectLife.warEdge === 'function') {
            try { W.PSectLife.warEdge(psHome, enemy); } catch (eA) {}
        }
        // 护山阵不分谁家山门——阵旗是你布的，你站在哪座山门它护哪座
        if (W.FormationSystem && typeof W.FormationSystem.getSectFormationActive === 'function') {
            try {
                var guard = W.FormationSystem.getSectFormationActive();
                var pct = guard && guard.buff ? (Number(guard.buff.sectAttackReducePct) || 0) : 0;
                if (pct > 0) {
                    enemy.attack = Math.max(1, Math.round((Number(enemy.attack) || 0) * (1 - pct / 100)));
                    log('🌀 「' + guard.name + '」灵光升起——撞阵的兽群被挫了' + pct + '%的凶性。（阵旗受损）', 'success');
                    W.FormationSystem.wearSectFormation(2);
                }
            } catch (eG) {}
        }
        // 第三十二波：道侣上墙头——兽群也欺软怕硬，墙上有家里人并肩，凶性再折
        if (psHome) daoWallEdge(psHome, enemy);
        var b = W.startBattle(enemy);
        if (b) { b._isTideSiegeBattle = true; b._tideSiegeLevel = lv; if (psHome) b._tideHome = psHome; if (came && came.length) b._tideAllies = came; }
        log('🐾 兽潮改道——「' + tideName() + '」的兽群扑向你的山门！兽吼已到门前，这一仗躲不掉。（赢了兽核归你，输了山门遭殃）', 'danger');
        return true;
    }
    function tideSiegeDayTick() {
        var c = cd();
        if (!c) return;
        if (W.currentBattle) return;                       // 战斗中不叠台
        var lv = tideLevelNum();
        if (!lv) return;                                   // 潮散了就没事了
        var d = ds();
        var inNpcSect = !!(d && d.isInSect);
        var psHome = inNpcSect ? null : homeNameOf();
        var ownHome = inNpcSect ? (d.sectName || d.sectId) : psHome;
        if (ownHome && !underTideRest(ownHome)) {
            var p = 0.05 + lv * 0.02;                      // 潮越大，扑山越凶（仙劫潮一日两成半）
            if (Math.random() < p) { startTideSiege(psHome); return; }
        }
        worldTideTick(lv);                                 // 第二十七波：江湖不止你一家山门——别家也会被兽潮围
    }
    // 战后结算（app.js _isTideSiegeBattle 分支调用）
    W.settleTideSiege = function (win) {
        var b = W.currentBattle || {};
        var lv = Math.max(1, Math.min(10, Number(b._tideSiegeLevel) || 1));
        var home = b._tideHome || null;                    // 自建山门（弟子身时为 null）
        var d = ds();
        var npcSect = (d && d.isInSect) ? (d.sectName || d.sectId) : null;
        var sectName = home || npcSect;
        if (win) {
            var cores = 1 + Math.floor(lv / 3) + Math.floor(Math.random() * 2);
            var temper = 40 + lv * 5;
            try { if (typeof W.addItem === 'function') W.addItem('mat_demon_beast_core', cores); } catch (e1) {}
            try { if (W.currentCharData) W.currentCharData.tempering = (Number(W.currentCharData.tempering) || 0) + temper; } catch (e2) {}
            try { if (W.currentCharData) W.currentCharData.fame = Math.min(99999, (Number(W.currentCharData.fame) || 0) + 2 + Math.floor(lv / 2)); } catch (e3) {}
            if (home && W.PSectWorld) {
                try { W.PSectWorld.gainRep(home, 2, '打退兽潮·山门无恙'); } catch (e4) {}
                try { var itw = (W.SECT_INTERNAL || {})[home]; if (itw) itw.morale = Math.max(0, Math.min(100, (Number(itw.morale) || 50) + 6)); } catch (e5) {}
                try {
                    var psw = W.PSectWorld.byName(home);
                    if (psw && W.PSectVenture && W.PSectVenture.bumpMoodAll) W.PSectVenture.bumpMoodAll(psw, 4);
                } catch (e6) {}
                chronOf(home, '「' + tideName() + '」的兽群扑到山门下，被掌门带着门人打了回去——墙头上兽血未干，山门无恙。');
                streetOf('「' + home + '」把扑门的兽群打了回去——茶棚里都说：那道门，兽潮都撞不开。');
            } else if (npcSect) {
                addC(40, '打退兽潮·护山门之功');
                try { var itn = (W.SECT_INTERNAL || {})[npcSect]; if (itn) itn.morale = Math.max(0, Math.min(100, (Number(itn.morale) || 50) + 6)); } catch (e7) {}
                chronOf(npcSect, '「' + tideName() + '」的兽群扑到山门下，被门中上下打了回去。');
            }
            log('🐾 兽群退了——墙头上兽血未干。这一仗：兽核×' + cores + '入囊，历练+' + temper + '。（挡潮的人，山门记着）', 'success');
            tideAllyThanks(sectName, b._tideAllies, true); // 第二十七波：上墙头的盟家，情分记账、编年互记
        } else {
            // 败：人带伤（与清剿受挫同口径），山门被兽群糟蹋
            try { if (typeof W.applyBeastTideDefeatWound === 'function') W.applyBeastTideDefeatWound({ wave: 1, waves: 1 }); } catch (eW) {}
            var loss = 30 + lv * 12;
            var taken = 0;
            if (home && W.PSectWorld && typeof W.PSectWorld.drainTreasury === 'function') {
                try { taken = W.PSectWorld.drainTreasury(home, loss, '兽潮过境·库房被兽群糟蹋') || 0; } catch (e8) {}
                try {
                    var ps = W.PSectWorld.byName(home);
                    if (ps) {
                        if (W.PSectVenture && W.PSectVenture.bumpMoodAll) W.PSectVenture.bumpMoodAll(ps, -6);
                        // 两成半可能有一位在山的弟子没能回来（宗谱记殁、治丧照礼）
                        var poolD = (ps.disciples || []).filter(function (x) { return x && !x.away; });
                        if (Math.random() < 0.25 && poolD.length) {
                            var fell = poolD[Math.floor(Math.random() * poolD.length)];
                            var fi = ps.disciples.indexOf(fell);
                            if (fi >= 0) ps.disciples.splice(fi, 1);
                            try { var nn = W.npcManager && W.npcManager.getNPC(fell.npcId); if (nn) nn.isDead = true; } catch (e9) {}
                            try { W.PSectWorld.markFate(ps, fell.npcId, '殁于任'); } catch (e10) {}
                            try { if (W.PSectLife && typeof W.PSectLife.funeral === 'function') W.PSectLife.funeral(ps, fell.name || '一名弟子', '殁在了退兽潮的那一仗里'); } catch (e11) {}
                        }
                    }
                } catch (e12) {}
                chronOf(home, '山门被「' + tideName() + '」的兽群撞开了一角：库房被糟蹋' + (taken > 0 ? '，折灵石' + taken : '（库里本就没几个钱）') + '。这一潮，门里记下了。');
                streetOf('「' + home + '」的山门让兽潮撞开了一角——街坊帮着收拾了半天的烂摊子。');
            } else if (npcSect) {
                try {
                    var itl = (W.SECT_INTERNAL || {})[npcSect];
                    if (itl) { itl.resources = Math.max(0, (Number(itl.resources) || 0) - loss); itl.morale = Math.max(0, (Number(itl.morale) || 50) - 8); }
                } catch (e13) {}
                chronOf(npcSect, '山门被「' + tideName() + '」的兽群撞开了一角，库房折损，门中士气受挫。');
            }
            log('💔 山门被兽群撞开了一角——' + (home ? (taken > 0 ? '库房被糟蹋，折灵石' + taken : '库房本空，只剩满地断栏') : '门中库房折损、士气受挫') + '。（战败之痛照常：带伤、力竭）', 'error');
            tideAllyThanks(sectName, b._tideAllies, false); // 第二十七波：援而不胜，来的盟家这份情也记下
        }
        if (sectName) setTideRest(sectName, 3);            // 第三十波：潮战一场歇三日——兽群撞了墙，也要退回山里舔伤
    };
    // 第二十七波 · 兽潮共守：江湖各家山门也遭兽围；盟家被围可提兵相助 ============
    // 第三十波 · 数值过秤：挨过潮的要喘气——自家山门潮战一场歇三日（兽群撞了墙要退回山里舔伤），
    // 别家遭围一场歇五日（埋人修栏都是功夫）。没有这本账，仙劫潮期间骰子会把一家往死里打（战争线有六十日喘气，兽潮线不能一日不歇）。
    function underTideRest(k) { return absDay() < Number(flags()['tide_rest_' + k] || 0); }
    function setTideRest(k, days) { flags()['tide_rest_' + k] = absDay() + days; }
    function internalOf(sect) { return (W.SECT_INTERNAL || {})[sect] || null; }
    function powerScoreOf(sect) {
        try { if (typeof W.sectPowerNow === 'function') { var p = W.sectPowerNow(sect); if (p) return Number(p.score) || 150; } } catch (e) {}
        try { var s = (W.sectsData || {})[sect]; return Math.round(150 * (POWER_MUL[(s && s.power) || '未知'] || 1)); } catch (e2) { return 150; }
    }
    // 盟家上墙头之后：胜了情分+5、败了也记+2（两家都落账，编年互记）
    function tideAllyThanks(sectName, allies, win) {
        if (!sectName || !allies || !allies.length) return;
        var dlt = win ? 5 : 2;
        allies.forEach(function (a) {
            try { if (W.PSectWorld && typeof W.PSectWorld.setRelBoth === 'function') W.PSectWorld.setRelBoth(sectName, a, dlt); } catch (e) {}
            chronOf(a, win
                ? ('领众援「' + sectName + '」退兽潮——合力把围门的兽群打了回去。这一趟没白来，两家的编年都记下了。')
                : ('领众援「' + sectName + '」退兽潮——没能守住山门。人退了，情分记在编年里。'));
        });
    }
    // 潮讯候选：江湖上有户部档案、没倒幡、也不是玩家自家山门的门派
    function worldTideCandidates() {
        var out = [];
        var sects = W.sectsData || {};
        var d = ds();
        var home = homeNameOf() || ((d && d.isInSect) ? (d.sectName || d.sectId) : null);
        for (var s in sects) {
            if (s === home) continue;
            try { if (typeof W.sectIsRuined === 'function' && W.sectIsRuined(s)) continue; } catch (e) {}
            if (!internalOf(s)) continue;
            if (underTideRest(s)) continue;                // 第三十波：挨过潮的人家要喘气——骰子不往死里打一家
            out.push(s);
        }
        return out;
    }
    function worldTideTick(lv) {
        var f = flags();
        if (f['sect_world_tide_pending']) return;          // 一桩潮讯未落，江湖上不摆第二场
        var p = 0.10 + lv * 0.02;                          // 潮越大，围别家山门也越凶
        if (Math.random() >= p) return;
        var cands = worldTideCandidates();
        if (!cands.length) return;
        var victim = cands[Math.floor(Math.random() * cands.length)];
        var home = homeNameOf();
        var isAlly = false;
        if (home && W.PSectWorld && typeof W.PSectWorld.alliesOf === 'function') {
            try { isAlly = W.PSectWorld.alliesOf(home).indexOf(victim) >= 0; } catch (eA) {}
        }
        if (isAlly) {
            // 盟家被围：给你一日窗口——风云册上可提兵相助，明日掷骰自决
            f['sect_world_tide_pending'] = { sect: victim, lv: lv, day: absDay(), resolveDay: absDay() + 1 };
            log('🐾 风云急报：盟家「' + victim + '」的山门让「' + tideName() + '」的兽群围了——盟书上的字还热着。（江湖风云册里可提兵相助，赶在明日落定之前）', 'warning');
            street('「' + victim + '」山门告急：「' + tideName() + '」的兽群把山围了——沿山的村子都听见了兽吼。');
            chronOf(victim, '「' + tideName() + '」的兽群围了山门——门中上下凭墙死守，已向盟家递了血书。');
            return;
        }
        resolveWorldTide(victim, lv);
    }
    // 后台真结算：守方按座次分掷骰（地利加成），潮按级数压——守得住长脸，守不住库房折损、门人殒命
    function resolveWorldTide(sect, lv) {
        var it = internalOf(sect);
        if (!it) return;
        var atk = lv * 35 + Math.random() * 40;
        var def = powerScoreOf(sect) + Math.random() * 40 + 10; // 守方有地利
        if (def > atk) {
            it.morale = Math.max(0, Math.min(100, (Number(it.morale) || 50) + 6));
            try { if (typeof W.sectPowerWarMod === 'function') W.sectPowerWarMod(sect, true); } catch (e1) {}
            chronOf(sect, '「' + tideName() + '」的兽群扑到山门下，被门中上下打了回去——墙头上的兽血三日未干。');
            if (Math.random() < 0.4) streetOf('茶棚消息：「' + sect + '」把扑门的兽群打了回去——那道门，兽潮都撞不开。');
            log('🌍 江湖消息：「' + sect + '」打退了扑门的兽群。（座次记了一笔守山的功）', 'info');
        } else {
            var loss = 30 + lv * 12;
            it.resources = Math.max(0, (Number(it.resources) || 0) - loss);
            var dead = 1 + Math.floor(Math.random() * 3);
            it.disciples = Math.max(1, (Number(it.disciples) || 0) - dead);
            it.morale = Math.max(0, (Number(it.morale) || 50) - 8);
            try { if (typeof W.sectPowerWarMod === 'function') W.sectPowerWarMod(sect, false); } catch (e2) {}
            chronOf(sect, '山门被「' + tideName() + '」的兽群撞开了一角：库房折灵石' + loss + '，门人殁了' + dead + '位。这一潮，编年记下了。');
            streetOf('「' + sect + '」的山门让兽潮撞开了一角——抬下来的门人埋在了后山。');
            log('🌍 江湖消息：「' + sect + '」的山门让兽潮撞开了一角，折了灵石' + loss + '、门人' + dead + '位。', 'warning');
        }
        setTideRest(sect, 5);                              // 第三十波：遭过围的人家歇五日——埋人修栏都是功夫
    }
    // 日钩：援手没出的潮讯，次日自决（仗打不完就再等一日；潮先散了算盟家熬过去了）
    function resolveTidePending() {
        var f = flags();
        var p = f['sect_world_tide_pending'];
        if (!p) return;
        if (W.currentBattle) return;
        if (absDay() < (Number(p.resolveDay) || 0)) return;
        f['sect_world_tide_pending'] = null;
        if (!tideLevelNum()) {
            chronOf(p.sect, '围山的兽群随大潮自散了——山门熬了过去，墙头守到最后一夜的人哭了出来。');
            log('🌍 「' + p.sect + '」熬过了兽潮——围山的兽群随大潮自散了。', 'success');
            return;
        }
        resolveWorldTide(p.sect, Math.max(1, Number(p.lv) || tideLevelNum()));
    }
    // 掌门提兵相助（风云册「潮讯」一栏的按钮直达）：真仗，胜则盟家山门保住、谢礼入宗库
    W.doTideAllyRescue = function () {
        var psHome = homeNameOf();
        if (!psHome) { msg('还没立宗——提谁的兵，相谁的援。', 'warning'); return false; }
        var p = flags()['sect_world_tide_pending'];
        if (!p) { msg('眼下没有围山的潮讯——援无从出。', 'info'); return false; }
        var isAlly = false;
        try { isAlly = (W.PSectWorld && W.PSectWorld.alliesOf ? W.PSectWorld.alliesOf(psHome) : []).indexOf(p.sect) >= 0; } catch (eA) {}
        if (!isAlly) { msg('「' + p.sect + '」与你家没换过盟书——出兵无名，江湖上要笑话的。', 'warning'); return false; }
        if (W.currentBattle) { msg('手头上正有一仗——先顾眼前。', 'warning'); return false; }
        if (typeof W.startBattle !== 'function') return false;
        var lv = Math.max(1, Number(p.lv) || tideLevelNum());
        try { var ov = document.getElementById('xianxia-modal-overlay'); if (ov) ov.remove(); } catch (e2) {}
        flags()['sect_world_tide_pending'] = null;
        var enemy = buildTideEnemy(lv);
        if (W.PSectLife && typeof W.PSectLife.warEdge === 'function') {
            try { W.PSectLife.warEdge(psHome, enemy); } catch (eArt) {} // 驰援的人马使的是自家路数
        }
        var b = W.startBattle(enemy);
        if (b) { b._isTideAllyBattle = true; b._tideSiegeLevel = lv; b._tideAllySect = p.sect; b._warHome = psHome; }
        log('🤝 盟书有约——你点齐人手，驰援「' + p.sect + '」：围它山门的兽群，今日要面对两家的刀。', 'warning');
        return !!b;
    };
    // 驰援结算（app.js _isTideAllyBattle 分支调用）
    W.settleTideAllyRescue = function (win) {
        var b = W.currentBattle || {};
        var victim = b._tideAllySect;
        var home = b._warHome;
        var lv = Math.max(1, Math.min(10, Number(b._tideSiegeLevel) || 1));
        if (!victim || !home) return;
        var it = internalOf(victim);
        if (win) {
            var cores = 1 + Math.floor(lv / 3);
            var temper = 30 + lv * 4;
            try { if (typeof W.addItem === 'function') W.addItem('mat_demon_beast_core', cores); } catch (e1) {}
            try { if (W.currentCharData) W.currentCharData.tempering = (Number(W.currentCharData.tempering) || 0) + temper; } catch (e2) {}
            try { if (W.currentCharData) W.currentCharData.fame = Math.min(99999, (Number(W.currentCharData.fame) || 0) + 3); } catch (e3) {}
            // 谢礼守恒：真从受援方库房里出，真进自家宗库——穷门谢不出富礼
            var gift = it ? Math.min(100, Math.floor((Number(it.resources) || 0) * 0.12)) : 0;
            if (it && gift > 0) it.resources = (Number(it.resources) || 0) - gift;
            if (gift > 0 && W.PSectWorld && typeof W.PSectWorld.gainTreasury === 'function') {
                try { W.PSectWorld.gainTreasury(home, gift, '驰援盟家·谢礼入库'); } catch (e4) {}
            }
            if (it) it.morale = Math.max(0, Math.min(100, (Number(it.morale) || 50) + 6));
            try { if (W.PSectWorld && typeof W.PSectWorld.setRelBoth === 'function') W.PSectWorld.setRelBoth(home, victim, 25); } catch (e5) {}
            try { if (W.PSectWorld && typeof W.PSectWorld.gainRep === 'function') W.PSectWorld.gainRep(home, 3, '驰援盟家·击退兽潮'); } catch (e6) {}
            try { if (typeof W.sectPowerWarMod === 'function') { W.sectPowerWarMod(home, true); W.sectPowerWarMod(victim, true); } } catch (e7) {}
            chronOf(home, '提兵驰援「' + victim + '」，把围它山门的「' + tideName() + '」兽群打了回去——盟书添了实证' + (gift > 0 ? '，谢礼灵石' + gift + '入库' : '') + '。');
            chronOf(victim, '「' + home + '」的人马驰援上山，把围门的兽群打了回去——谢礼装车送去，这份情编年记下了。');
            streetOf('江湖佳话：兽潮围了「' + victim + '」的山门，盟家「' + home + '」提兵驰援，把兽群打退在山下——茶棚里都说这段义气。');
            setTideRest(victim, 5);                        // 第三十波：救下来的山门也歇五日——兽群败一阵，不会掉头再来
            log('🤝 兽群被你打退了——「' + victim + '」的山门保住了。（盟家关系大涨' + (gift > 0 ? '，谢礼灵石' + gift + '入宗库' : '') + '；兽核×' + cores + '入囊，历练+' + temper + '）', 'success');
        } else {
            try { if (typeof W.applyBeastTideDefeatWound === 'function') W.applyBeastTideDefeatWound({ wave: 1, waves: 1 }); } catch (eW) {}
            resolveWorldTide(victim, lv);                  // 援军败了，围还在——盟家还得自己熬这一潮
            try { if (W.PSectWorld && typeof W.PSectWorld.setRelBoth === 'function') W.PSectWorld.setRelBoth(home, victim, 5); } catch (e8) {}
            try { if (typeof W.sectPowerWarMod === 'function') W.sectPowerWarMod(home, false); } catch (e9) {}
            chronOf(home, '提兵驰援「' + victim + '」，被兽群打了回来——援虽不成，盟书上记下了这一趟出兵。');
            chronOf(victim, '「' + home + '」出兵来援，被兽群打了回去——援虽不成，这份情编年记下了。');
            log('💔 驰援「' + victim + '」不成，反被兽群打了下来——围还没解，盟家记下了这份情。（战败之痛照常：带伤、力竭）', 'error');
        }
        try { if (typeof W.saveSectDiplomacy === 'function') W.saveSectDiplomacy(); } catch (e10) {}
    };
    function chronOf(sect, text) {
        try { if (W.SectGov && W.SectGov.chronicle) { W.SectGov.chronicle(sect, text); return; } } catch (e) {}
        try {
            var it = (W.SECT_INTERNAL || {})[sect];
            if (!it) return;
            if (!it.chronicle) it.chronicle = [];
            it.chronicle.push({ day: absDay(), text: String(text) });
            if (it.chronicle.length > 40) it.chronicle.splice(0, it.chronicle.length - 40);
        } catch (e2) {}
    }
    function streetOf(text) {
        try {
            var f = flags();
            if (!f['qi_street'] || !f['qi_street'].push) f['qi_street'] = [];
            f['qi_street'].push({ day: absDay(), text: String(text) });
            if (f['qi_street'].length > 60) f['qi_street'].splice(0, f['qi_street'].length - 60);
        } catch (e) {}
    }

    // ============ 二 · 自建宗门入江湖（外交网落座 + 宗门史入大事记） ============
    function alignmentBase(alignment) {
        // 立宗取向定初始亲疏：对正道/邪派/中立各有一个基础分（正邪相斥，同道相亲）
        if (alignment === 'righteous' || alignment === '正道') return { '正道': 30, '邪派': -30, '中立': 5 };
        if (alignment === 'demon' || alignment === '邪派') return { '正道': -30, '邪派': 30, '中立': 5 };
        return { '正道': 5, '邪派': 5, '中立': 15 };
    }
    W.openPlayerSectDiplomacy = function () {
        var sect = null;
        try { var mine = (W.PlayerSect && W.PlayerSect.listMySects && W.PlayerSect.listMySects()) || []; sect = mine[0] || null; } catch (e) {}
        if (!sect) { msg('还没立宗——山门都没有，谈什么外交。', 'warning'); return; }
        ensurePlayerSectDiplomacy(sect);
        if (typeof W.showSectDiplomacy === 'function') W.showSectDiplomacy(sect.name);
        else msg('外交册未就绪。', 'warning');
    };
    function ensurePlayerSectDiplomacy(sect) {
        var d = diplo();
        if (!d || !sect || !sect.name) return false;
        if (d[sect.name]) return false; // 已落座
        var base = alignmentBase(sect.alignment);
        var sects = W.sectsData || {};
        d[sect.name] = {};
        // 方案二第二步：初始关系按对方的「动态立场」算底色，静态类型只兜底
        var myScore = { '正道': 60, '中立': 0, '邪派': -60 }[sect.alignment];
        if (myScore == null) myScore = 0;
        for (var other in sects) {
            if (other === sect.name) continue; // 第九波：不跟自己开外交行（立宗时自身已入 sectsData，旧码会建出自外交）
            var t = sects[other].type;
            var rel;
            var oa = null;
            try { if (typeof W.sectAlignNow === 'function') { var av = W.sectAlignNow(other); if (av) oa = av.align; } } catch (eAl) {}
            if (oa != null) {
                rel = Math.round((myScore + oa) / 2 - Math.abs(myScore - oa) / 3) + Math.floor(Math.random() * 11) - 5;
            } else {
                rel = (base[t] != null ? base[t] : 0) + Math.floor(Math.random() * 11) - 5;
            }
            rel = Math.max(-100, Math.min(100, rel));
            d[sect.name][other] = { relation: rel, trade: 0, conflicts: 0, lastEvent: 0, treaties: [] };
            if (!d[other]) d[other] = {};
            d[other][sect.name] = { relation: rel, trade: 0, conflicts: 0, lastEvent: 0, treaties: [] };
        }
        try { if (typeof W.saveSectDiplomacy === 'function') W.saveSectDiplomacy(); } catch (e) {}
        log('🌐 「' + sect.name + '」的名字进了江湖外交册——三十六派都知道了这门新山门。（宗门总册 → 江湖外交）', 'success');
        return true;
    }
    // 立宗即落座（新立）；老档已有宗门的，首次点外交入口时补落（ensurePlayerSectDiplomacy 幂等）
    try {
        if (W.EventBus && W.EventBus.on) {
            W.EventBus.on('playerSect:created', function (p) {
                try { if (p && p.sect) ensurePlayerSectDiplomacy(p.sect); } catch (e) {}
            });
        }
    } catch (e) {}
    // 宗门史 → 世界大事记：立宗/收徒/战事/政策，天下都看得见（包装 addHistory，原账照记）
    try {
        if (W.PlayerSect && typeof W.PlayerSect.addHistory === 'function') {
            var _origAddHistory = W.PlayerSect.addHistory;
            W.PlayerSect.addHistory = function (sectId, text) {
                var r = _origAddHistory.apply(this, arguments);
                try {
                    if (r && W.WorldJournal && typeof W.WorldJournal.record === 'function') {
                        var s = (W.PlayerSect.getSect && W.PlayerSect.getSect(sectId)) || null;
                        W.WorldJournal.record({ type: 'sect', title: '宗门史', text: '「' + ((s && s.name) || '自立宗门') + '」' + String(text) });
                    }
                } catch (e) {}
                return r;
            };
        }
    } catch (e) {}

    // 探针（测试用）
    W.sectWarProbe = function () {
        var d = ds();
        var inSect = !!(d && d.isInSect);
        var mySect = inSect ? (d.sectName || d.sectId) : homeNameOf();
        var foes = [];
        var row = mySect && diplo() && diplo()[mySect];
        if (row) { for (var o in row) { if ((Number(row[o].relation) || 0) <= -40) foes.push({ id: o, rel: row[o].relation, cdLeft: Math.max(0, warCd(o) - absDay()) }); } }
        return { mySect: mySect, home: inSect ? 'npc' : (mySect ? 'ps' : null), foes: foes };
    };

    console.log('[sect-war] 宗门战争因果已注册：死仇自动兵临山门（真仗·自家山门也算·第二十波盟家来援削敌战力·第二十一波镇山秘艺折敌三分·第二十三波护山阵挫敌攻势/迷踪阵压寻仇骰）+ 殿议兴兵（宿怨门控·掌门自家堂上说了算）+ 出兵相援（盟家被围真仗解围）+ 第二十五波兽潮压山门（潮活期间日日掷骰·兽核入囊·败了库房遭殃）+ 第二十七波兽潮共守（盟家上墙头折兽凶性·江湖潮讯后台真结算·盟家被围可提兵相助）+ 第三十波喘气账（自家潮战歇三日·别家遭围歇五日）+ 第三十二波道侣上墙头（自家守山，家里人在墙上折敌锐气）+ 自建宗门入外交网、宗门史入大事记');
})();
