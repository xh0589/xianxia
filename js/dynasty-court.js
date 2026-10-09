// ==================== v27.7 朝政篇 · 朝廷（新文件 dynasty-court.js） ====================
// 称帝不是终点是一段剧情的开头：大业名册第 92 件「称帝建国」落地之后，这里接朝政大剧情——
//   国库明账（月初自动过账）· 立储（亲子/弟子，吃子嗣账与宗门账）· 征伐邻城（真仗，属城岁入）·
//   三大工程（筑宫城/修城墙/开粮仓，各一生一回）· 朝堂风波四件（请立储/藩王叛乱/灾年/史官直笔，
//   自动触发、一生各裁一回）· 编年史（开国纪年自动记年，大事全入史书）·
//   终局双路（飞升钩子：举国飞升须香火线 / 禅位太子须立储 / 两无 → 天下鼎沸）。
// v27.8 长安线增补：①现皇帝的反应——开国三十日长安使臣携讨逆诏到阙（奉表称藩缓兵 / 扣使拒诏硬顶），
//   讨逆军真仗（_isPunitiveFight），打赢长安不敢东顾、打输赔款九十日后再来；奉表后扩张两城必发兵；
//   ②号召归附——不动刀兵的收城路：号召力（名望+都城城望一半+属城×5）vs 民心（按城播种），
//   城头香幡有主（他派护持，吃 sect-cities 现成账）召不动只能打；自家门派的幡民心减半；
//   ③舆图口径对齐仙凡分治——帝都长安不可犯、仙家胜地不入世争，征伐/号召只认凡俗城。
// v27.9 登基礼：①年号纪年——大典改元后编年史/牌头全用「年号N年」（老档无年号退回「N年」，坏账不进门）；
//   ②帝后称谓——玩家分男女，男主天下称「帝」女主称「后」，纪事行文跟着走；
//   ③中宫册礼——有道侣随龙者牌头显「皇后/皇夫」（男玩家的道侣册后、女玩家的道侣册皇夫）；
//   ④长安见闻——讨逆打赢后再行幸长安有一段见闻（只记一回），敌对期进城有海捕文书的眼色。
// 纪律：①零日常按钮——国库月初自动过账、纪年自动记、风波自动上奏，事不追人；
//       ②明账——国库收支逐项列在牌面上，锁就亮锁（差什么写什么）；
//       ③国库与玩家私财两本账——国策花国库，玩家侧赏罚走 RewardService 一个钱门；
//       ④征伐/平叛全是真仗（NpcCrime.startFlaggedBattle 正门，_isConquestFight/_isRebelFight 旗，app.js 胜负钩成对）；
//       ⑤StateRegistry 正门存档（零新 localStorage 键），读档归一化——没皇帝的朝政账是坏账，整本清掉；
//       ⑥凡进 DOM 的字不能不设防（人名/城名/国号一律 esc）。
(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    var CFG = {
        TREASURY_START: 300,          // 开国帑银
        UPKEEP: 30,                   // 宫室常支/月
        VASSAL_MAX: 3,                // 属城上限（打太多管不过来——明账）
        VASSAL_INCOME: 40,            // 属城岁入/月·每城
        VASSAL_ARMY: 15,              // 属城戍饷/月·每城
        GRANARY_INCOME: 15,           // 粮仓月入
        CONQ_COST: 100,               // 军资（国库先付，败了不退）
        CONQ_WIN_FAME: 3, CONQ_WIN_REP: 5,
        CONQ_LOSE_NOTO: 2, CONQ_LOSE_EXTRA: 50, CONQ_LOSE_REP: 3,   // 败：另损残军（有城墙减半）+ 都城城望-3
        CONQ_FAIL_GAP: 30,            // 败后三十日不再兴兵
        WORK_PALACE: 500, WORK_WALL: 300, WORK_GRANARY: 200,
        PALACE_FAME: 15, WALL_REP: 8,
        APPEASE_COST: 80, APPEASE_REP: 3,          // 叛乱抚：国库 80 保属城，城望-3（丢面子）
        REBEL_WIN_NOTO: 2, REBEL_WIN_REP: 3, REBEL_WIN_TREASURY: 50,   // 剿胜：抄没叛产
        REBEL_LOSE_TREASURY: 50, REBEL_LOSE_REP: 5,                    // 剿败：属城自立（有城墙损失减半）
        RELIEF_COST: 150, RELIEF_REP: 5, RELIEF_KARMA: 5,              // 灾年赈（有粮仓免费）
        REMIT_DAYS: 90, REMIT_REP: 8, REMIT_KARMA: 3,                  // 灾年蠲免：九十日都城税入停
        IGNORE_REP: 8, IGNORE_KARMA: 3, IGNORE_NOTO: 2,                // 灾年置之不理
        BURN_KARMA: 2, BURN_NOTO: 3, BURN_MOOD: 5,                     // 焚实录
        ALLOW_KARMA: 3, ALLOW_MOOD: 5,                                 // 容直笔
        HEIR_REP: 3,
        ABDICATE_REP: 10,
        ASCEND_INCENSE_BASE: 100,     // 举国飞升：国祚化香火的底数
        EDICT_DUE: 30,                // v27.8 长安线：开国三十日，长安使臣到阙（讨逆诏）
        DEFY_PUNITIVE: 60,            // 扣使拒诏 → 讨逆军六十日兵临城下
        SUBMIT_GRACE: 30,             // 奉表之后又扩张 → 长安震怒，讨逆军三十日即到
        PUNITIVE_AGAIN: 90,           // 讨逆战败后，长安九十日再发兵
        PUNITIVE_BOUNTY: 100,         // 破讨逆军：犒军绢帛抄没入库
        PUNITIVE_LOSS: 200,           // 败于讨逆军：赔款（有城墙减半）
        PUNITIVE_WIN_FAME: 10, PUNITIVE_WIN_REP: 5, PUNITIVE_LOSE_REP: 5,
        SUMMON_COST: 50,              // v27.8 号召：使节礼单（国库先付，败不退）
        SUMMON_BASE: 40,              // 城市民心门槛底数（按城播种 40–79）
        SUMMON_SNUB: 10,              // 婉拒一回，门槛加高
        SUMMON_GAP: 60,               // 婉拒后六十日冷却（使节不常来）
        SUMMON_WIN_REP: 3, SUMMON_FAME: 1,
        TRIBUTE_RATE: 0.1,           // v27.13 岁贡：属城基金月解一成（基金见底按实有折解，无账不解）；⑫回写：称帝后解入玩家私库（settleTribute 分流），不再入朝堂国库
        GRANT_WORK_COST: 60,         // v27.13 恩赏：国库拨属城修桥铺路，每回 60 灵石入该城基金
        GRANT_WORK_REP: 2,           // v27.13 恩赏城望小额+（走 RewardService 正门 rep=cityReputation）
        GRANT_WORK_GAP: 90,          // v27.13 恩赏冷却：每城九十日一回——恩赏不是提款机，城望不是刷的
        // v27.13：官员个人账——百官有私账（StateRegistry 新键 dynastyCourtOfficials），贪官挪库，亏空查账
        OFF_SALARY: { 1: 4, 2: 6, 3: 8 },   // 俸禄/月·按官阶（宫室常支的内部分账——国库不另扣，明账一行不动）
        OFF_GIFT_COST: 20,           // 赏赐：国库 20 → 该官私账 20（一笔进出两头有账）
        OFF_GIFT_GAP: 15,            // 赏赐冷却：每官十五日一回
        OFF_GIFT_GREED_DOWN: 6,      // 天恩所及，贪念收敛几分
        OFF_GREED_MIN: 60,           // greed 达标才掷挪库
        OFF_EMZZ_P_HI: 0.35,         // 挪库月掷命中·greed≥80
        OFF_EMZZ_P_LO: 0.18,         // 挪库月掷命中·greed 60–79
        OFF_EMZZ_MAX: 2,             // 全朝每月至多两笔（克制）
        OFF_EMZZ_FREEZE: 30,         // 查账后三十日风声紧，没人敢伸手
        OFF_EMZZ_AMT: { 1: [15, 30], 2: [25, 45], 3: [40, 70] },   // 挪库金额档·按官阶（克国库实存）
        AUDIT_GAP: 90,               // 御史查账冷却（九十日一回）
        AUDIT_P_BASE: 0.4,           // 查账基础命中
        AUDIT_P_DEFICIT: 400,        // 亏空/400 加成（封顶 +0.45）——亏空越大越好查
        AUDIT_P_SKILL: 0.0015,       // 学识加成（封顶 +0.1）
        AUDIT_P_CAP: 0.9,            // 查账命中封顶
        BITE_P_RECOVER: 0.35,        // 追赃时同党反咬构陷的概率
        BITE_P_DISMISS: 0.5,         // 罢官抄家时反咬更凶
        EXPOSE_TIGHT: 15,            // 实存低于此线且挂着亏空——账房炸账，暗账自己败露
        EXPOSE_GAP: 60,              // 败露案间隔（六十日）
        TURMOIL_GAP: 60,              // 风波间隔（日）
        TURMOIL_MIN_REIGN: 90,        // 开国九十日后朝堂才有大事
        CHRON_MAX: 60
    };
    var TURMOIL_IDS = ['rebel', 'famine', 'heir', 'historian'];
    var CONQ_NAMES = ['镇北大将军', '定西侯', '平南都督', '安东节度使'];
    var REBEL_NAMES = ['叛王', '自立的大都督', '举旗的旧藩', '割据的豪帅'];

    var _st = {
        foundDay: 0,            // 开国日（0 = 朝廷还没开衙）
        treasury: 0,            // 国库（灵石，与玩家私财两本账）
        monthSettled: -1,
        yearCount: 0,           // 已记的整年数
        vassals: [],            // [{city, day}] 属城
        conquering: null,       // {city, day} 征伐进行中（真仗）
        conquestFailDay: 0,
        heir: null,             // {kind:'child'|'disciple', name, day}
        works: {},              // palace/wall/granary -> day
        turmoilDone: {},        // id -> {day, choice}
        pending: null,          // {id, day} 待裁的奏折
        pendingRebel: null,     // {city} 平叛真仗进行中
        lastTurmoilDay: 0,
        taxReliefUntil: 0,      // 蠲免止日
        changan: { phase: '', edictDay: 0, warDue: 0, anger: 0, beatenDay: 0, beatenSeen: 0, hostileSeen: 0 },   // v27.8 长安线：''→edict（使臣待回话）→submit/defy→war（讨逆军临阙）→beaten（破讨逆军）；v27.9：进长安的一次性见闻戳
        summons: {},            // v27.8 号召账：city -> {day, snubs}（婉拒一回门槛加高）
        grants: {},             // v27.13 恩赏账：city -> 末回恩赏日（每城九十日一档的冷却戳）
        court: { roster: [], case: null, auditDay: 0, lastCaseDay: 0, gifts: {}, gen: {}, rotten: 0 },   // v27.13：百官班底与御史台账（roster=官阶槽位上的活人；case=未决亏空案；rotten=追不回的死账亏空）
        ending: null,           // 'ascend' | 'abdicate' | 'collapse'
        endingPref: '',         // 玩家预选的终局
        chronicle: []           // [{day, text}] 编年史
    };

    // ============ 小工具（grand-legacy 同款口径） ============
    function cd() { return window.currentCharData || null; }
    function say(m, t) { try { if (window.showMessage) window.showMessage(m, t || 'info'); } catch (e) { return false; } return true; }
    function log(m, t) { try { if (window.gameLog && window.gameLog.add) window.gameLog.add(m, t || 'info'); } catch (e) { return false; } return true; }
    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
    function absDay() {
        try {
            if (window.WorldCalendar && typeof window.WorldCalendar.day === 'number' && window.WorldCalendar.day > 0) return Math.floor(window.WorldCalendar.day);
            if (typeof window.getAbsoluteDay === 'function') { var g = window.getAbsoluteDay(); if (g) return Math.floor(g); }
            if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') { var t = window.timeSystem.getAbsoluteDay(); if (t) return Math.floor(t); }
        } catch (e) { return 0; }
        return 0;
    }
    function monthIdx() { return Math.floor(absDay() / 30); }
    function dice() { return (typeof window.__scenarioRng === 'function') ? window.__scenarioRng() : Math.random(); }
    function seedOf(s) { var h = 0; s = String(s || ''); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
    function pkCity(s) { return String(s == null ? '' : s).replace(/\s+/g, ''); }
    function repVal(ct) { try { if (ct && typeof window.getReputationValue === 'function') return Number(window.getReputationValue(ct)) || 0; } catch (e) {} return 0; }
    function repUp(ct, n) { try { if (ct && n && typeof window.addReputation === 'function') window.addReputation(ct, n); } catch (e) {} }
    function repDown(ct, n) { try { if (ct && n && typeof window.reduceReputation === 'function') window.reduceReputation(ct, n); } catch (e) {} }
    function settle(spec, source, cityOverride) {
        try {
            if (window.RewardService && typeof window.RewardService.apply === 'function') {
                // v27.13：cityOverride——恩赏等落在属城的账，城望要记到那座城头上（缺省照旧记都城）
                var r = window.RewardService.apply(spec, { source: source || '朝政', city: cityOverride || empCity() });
                return { ok: !!(r && r.success !== false), note: r && r.messages ? r.messages.join('、') : '' };
            }
        } catch (e) { console.warn('[静默失败] js/dynasty-court.js · settle：这笔账没落成一笔', e && e.message); }
        return { ok: false, note: '' };
    }
    function deed(mood, s) { try { if (typeof window.playerPushDeed === 'function') window.playerPushDeed(mood, s); } catch (e) {} }
    function journal(type, title, text) { try { if (window.WorldJournal && window.WorldJournal.record) window.WorldJournal.record({ type: type, title: title, text: text }); } catch (e) {} }
    function refresh() { try { if (window.updateCharacterStatus) window.updateCharacterStatus(); } catch (e) {} }
    function tierOf() { try { var c = cd(); if (c && c.realm && typeof window.getRealmTier === 'function') return Number(window.getRealmTier(c.realm)) || 0; } catch (e) {} return 0; }
    function karmaNow() { var c = cd(); return Number((c && c.karma) || 0); }
    function esc(s) {
        if (typeof window.esc === 'function') { try { return window.esc(s); } catch (eE) {} }
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
        });
    }
    function glState() {
        try { if (window.GrandLegacy && typeof window.GrandLegacy.state === 'function') return window.GrandLegacy.state() || {}; } catch (e) {}
        return {};
    }
    function glEmperor() { var s = glState().emperor; return (s && typeof s === 'object' && s.dynasty) ? s : null; }
    function empCity() { var e = glEmperor(); return e ? e.city : ''; }
    function dynasty() { var e = glEmperor(); return e ? e.dynasty : ''; }
function chron(text) {
          _st.chronicle.push({ day: absDay(), text: String(text || '').slice(0, 200) });
          while (_st.chronicle.length > CFG.CHRON_MAX) _st.chronicle.shift();
          // v27.24：朝堂史笔同入天下年表——本朝私账记一页，天下公史也记一页（同笔双写）
          try {
              if (window.WorldLedger && typeof window.WorldLedger.recordAnnal === 'function') {
                  window.WorldLedger.recordAnnal('court', String(text || '').slice(0, 200), empCity() || '帝都·长安');
              }
          } catch (eCourtAnnal) {}
      }
    function reignYear() {
        if (!_st.foundDay) return 1;
        return Math.max(1, Math.floor((absDay() - _st.foundDay) / 360) + 1);
    }
    // v27.9 登基礼：建元之后史书用年号纪年（「洪武三年」），旧档没有年号回落「三年」
    function eraYear() {
        var e = glEmperor();
        var era = (e && e.eraName) ? String(e.eraName) : '';
        return era + reignYear() + '年';
    }
    // v27.9 男女有别：男修为「帝」，女修为「后」（临朝称制），史笔一字不改
    function rulerWord() {
        try { var c = cd(); if (c && c.gender === 'female') return '后'; } catch (e) {}
        return '帝';
    }
    function consort() { var e = glEmperor(); return (e && e.consort && e.consort.name) ? e.consort : null; }
    function endingName(e) { return e === 'ascend' ? '举国飞升' : e === 'abdicate' ? '禅位太子' : e === 'collapse' ? '天下鼎沸' : e === 'qi' ? '另有一本更大的账' : ''; }
    function hasWall() { return !!_st.works.wall; }
    function hasGranary() { return !!_st.works.granary; }

    // ============ v27.8 舆图口径（吃 sect-cities 现成账：仙凡分治） ============
    // 凡俗八城入世争（可征伐/可号召）；帝都·长安朝廷直辖不可犯；仙家胜地与灵魔界无主，不入世争。
    // sect-cities.js 没加载就回落旧口径（getAllCities 全认）——守卫式，不硬依赖。
    function cityInfo(ct) {
        try { if (typeof window.sectCityInfo === 'function') return window.sectCityInfo(pkCity(ct)) || null; } catch (e) {}
        return null;
    }
    function hasSectLedger() { return typeof window.sectCityInfo === 'function'; }
    function isMundane(ct) {
        if (!hasSectLedger()) return true;
        var i = cityInfo(ct);
        return !!(i && !i.capital);
    }
    function isImperialCapital(ct) {
        if (!hasSectLedger()) return false;
        var i = cityInfo(ct);
        return !!(i && i.capital);
    }
    function cityPatron(ct) {
        if (!hasSectLedger()) return '';
        var i = cityInfo(ct);
        return (i && !i.capital && i.patron) ? String(i.patron) : '';
    }
    function homeSect() {
        try { var d = window.discipleState; if (d && d.isInSect && (d.sectName || d.sectId)) return String(d.sectName || d.sectId); } catch (e) {}
        try { if (window.PSectWorld && typeof window.PSectWorld.homeName === 'function') { var n = window.PSectWorld.homeName(); if (n) return String(n); } } catch (e2) {}
        return '';
    }

    // ============ 国库明账 ============
    function taxIncome() {
        var ct = empCity();
        if (!ct) return 0;
        if (_st.taxReliefUntil > absDay()) return 0;   // 蠲免期内都城税入停（明账）
        return Math.floor(repVal(ct) / 10);
    }
    function incomeOf() {
        if (!glEmperor() || _st.ending) return 0;
        var inc = taxIncome() + _st.vassals.length * CFG.VASSAL_INCOME;
        if (hasGranary()) inc += CFG.GRANARY_INCOME;
        if (_st.works.palace) inc += Math.floor(inc * 0.1);   // 宫城：国体加成一成
        return inc;
    }
    function expenseOf() {
        if (!glEmperor() || _st.ending) return 0;
        return CFG.UPKEEP + _st.vassals.length * CFG.VASSAL_ARMY;
    }

    // ============ 朝廷开衙（称帝后第一次过账/翻牌面时自动初始化） ============
    function initCourt() {
        var emp = glEmperor();
        if (!emp || _st.foundDay) return;
        _st.foundDay = Number(emp.day) || absDay();
        _st.treasury = CFG.TREASURY_START;
        _st.monthSettled = monthIdx();
        chron((emp.eraName || emp.dynasty) + '元年，' + rulerWord() + '即位，定都' + emp.city + '。开国帑银 ' + CFG.TREASURY_START + ' 灵石入库，朝廷开衙。');
        log('👑 朝廷开衙了：国库 ' + CFG.TREASURY_START + ' 灵石（起底帑银）。大业名册里「打开朝政」看明账——月初户部自动过账，不用你惦记。', 'success');
    }
    function courtOk() {
        var emp = glEmperor();
        if (!emp) return { ok: false, why: '还没称帝——朝廷没有主。' };
        if (_st.ending) return { ok: false, why: '这一朝已经翻到末页（' + endingName(_st.ending) + '）——朝堂散了。' };
        initCourt();
        return { ok: true, emp: emp };
    }

    // ============ 立储（吃子嗣账与宗门弟子账，不另立名册） ============
    function childHeirs() {
        var out = [];
        try {
            var c = cd();
            var kids = (c && Array.isArray(c._children)) ? c._children : [];
            for (var i = 0; i < kids.length; i++) {
                var k = kids[i];
                if (k && k.name) out.push({ kind: 'child', name: String(k.name).slice(0, 12), idx: i });
            }
        } catch (e) {}
        return out;
    }
    function discipleHeirs() {
        var out = [];
        try {
            var mine = (window.PlayerSect && typeof window.PlayerSect.listMySects === 'function') ? (window.PlayerSect.listMySects() || []) : [];
            var sect = mine[0];
            var ds = (sect && Array.isArray(sect.disciples)) ? sect.disciples : [];
            for (var i = 0; i < ds.length; i++) {
                var d = ds[i];
                if (!d || !d.npcId) continue;
                var name = '';
                try { var npc = window.npcManager && window.npcManager.getNPC(d.npcId); name = (npc && npc.name) || ''; } catch (eN) {}
                out.push({ kind: 'disciple', name: String(name || d.npcId).slice(0, 12), idx: i });
            }
        } catch (e) {}
        return out;
    }
    function heirOk() {
        var g = courtOk();
        if (!g.ok) return g;
        if (_st.heir) return { ok: false, why: '太子已立（' + _st.heir.name + '）——国本动摇不得。' };
        if (!childHeirs().length && !discipleHeirs().length) return { ok: false, why: '膝下无子、门下无徒——先成家（家业名册）或开山收徒（自立宗门），才有得立。' };
        return { ok: true, emp: g.emp };
    }
    function designateHeir(kind) {
        var g = heirOk();
        if (!g.ok) { say('👑 ' + g.why, 'warning'); return false; }
        var pool = kind === 'disciple' ? discipleHeirs() : childHeirs();
        if (!pool.length) { say('👑 这一脉没人可立——' + (kind === 'disciple' ? '门下还没有弟子。' : '膝下还没有子嗣。'), 'warning'); return false; }
        var pick = pool[0];
        _st.heir = { kind: kind, name: pick.name, day: absDay() };
        repUp(g.emp.city, CFG.HEIR_REP);
        deed('good', dynasty() + '立储了——' + (kind === 'child' ? '嫡血脉的' : '亲传的') + pick.name + '入主东宫。诏书下那日，京中放了三日灯。');
        chron(eraYear() + '，立' + pick.name + '为太子（' + (kind === 'child' ? '亲子' : '弟子') + '），国本定。');
        log('👑 立储诏下：' + pick.name + '入主东宫（都城城望+' + CFG.HEIR_REP + '）。飞升那日的禅位路，自此开了。', 'success');
        refresh();
        open();
        return true;
    }

    // ============ 征伐邻城（真仗，属城≤3） ============
    function allCities() {
        try {
            if (window.locationSystem && typeof window.locationSystem.getAllCities === 'function') {
                var arr = window.locationSystem.getAllCities() || [];
                return arr.map(function (c) { return c && c.name; }).filter(function (n) { return typeof n === 'string' && n; });
            }
        } catch (e) {}
        return [];
    }
    function isVassal(ct) {
        var k = pkCity(ct);
        for (var i = 0; i < _st.vassals.length; i++) if (pkCity(_st.vassals[i].city) === k) return true;
        return false;
    }
    function conquestOk(ct) {
        var g = courtOk();
        if (!g.ok) return g;
        if (_st.changan.phase === 'edict') return { ok: false, why: '长安的使臣还在殿上等着回话——先回诏，再言兵。' };
        if (_st.changan.phase === 'war') return { ok: false, why: '朝廷的讨逆军已兵临城下——外患不御，何以远征。' };
        if (_st.conquering) return { ok: false, why: '大军正在' + _st.conquering.city + '城下——先了结这一仗。' };
        if (_st.pendingRebel) return { ok: false, why: '藩王叛乱未平——内忧不除，何以远征。' };
        if (!ct) return { ok: false, why: '先选一座城。' };
        if (pkCity(ct) === pkCity(g.emp.city)) return { ok: false, why: '那是你的都城——自己打自己？' };
        if (isVassal(ct)) return { ok: false, why: ct + '已是属城——岁入照旧，不用打。' };
        if (allCities().indexOf(ct) < 0) return { ok: false, why: '舆图上没有这座城。' };
        if (isImperialCapital(ct)) return { ok: false, why: '帝都长安是朝廷的京畿——天子所在，讨逆军都打不过，还想攻城？' };
        if (!isMundane(ct)) return { ok: false, why: '仙门不入世争——那座山上的事，不归凡间的刀兵管。' };
        if (_st.vassals.length >= CFG.VASSAL_MAX) return { ok: false, why: '属城已满 ' + CFG.VASSAL_MAX + ' 座——打太多管不过来，先消化消化。' };
        if (_st.conquestFailDay && absDay() - _st.conquestFailDay < CFG.CONQ_FAIL_GAP) return { ok: false, why: '新败之余兵心未复——' + (CFG.CONQ_FAIL_GAP - (absDay() - _st.conquestFailDay)) + ' 日后再兴兵。' };
        if (_st.treasury < CFG.CONQ_COST) return { ok: false, why: '军资要 ' + CFG.CONQ_COST + ' 灵石（国库现 ' + _st.treasury + '）——兵马未动，粮草先行。' };
        return { ok: true, emp: g.emp, city: ct };
    }
    function conqEnemy(ct) {
        var seed = seedOf(pkCity(ct) + '_conq_' + absDay());
        var tier = Math.max(1, tierOf()) + 1;
        return {
            name: ct + '守将·' + CONQ_NAMES[seed % CONQ_NAMES.length],
            type: 'boss', physiologyType: 'humanoid',
            level: tier * 3 + 3, attack: 30 + tier * 7, defense: 16 + tier * 4, speed: 22,
            maxDurability: 120 + tier * 25, durabilities: { chest: 120 + tier * 25 }, combatAbilities: []
        };
    }
    function startConquest(ct) {
        var g = conquestOk(ct);
        if (!g.ok) { say('⚔️ ' + g.why, 'warning'); return false; }
        _st.treasury -= CFG.CONQ_COST;
        _st.conquering = { city: g.city, day: absDay() };
        var started = false;
        try {
            if (window.NpcCrime && typeof window.NpcCrime.startFlaggedBattle === 'function') {
                var en = conqEnemy(g.city);
                started = window.NpcCrime.startFlaggedBattle(en, { _isConquestFight: true, city: g.city },
                    '⚔️ ' + dynasty() + '的大军开至' + g.city + '城下——守将「' + en.name + '」披甲登城：「来将通名！」');
            } else { say('⚔️ 兵刃的账没接上——这一仗拉不起来。', 'warning'); }
        } catch (e) { console.warn('[静默失败] js/dynasty-court.js · startConquest：这一仗没拉开', e && e.message); }
        if (!started) {   // 仗拉不起来，军资原路退回，不留半笔糊涂账
            _st.treasury += CFG.CONQ_COST;
            _st.conquering = null;
            return false;
        }
        log('⚔️ 兴兵征' + g.city + '！（军资 ' + CFG.CONQ_COST + ' 灵石已出国库，败了不退）打赢：城改属、岁入+' + CFG.VASSAL_INCOME + '/月、名望+' + CFG.CONQ_WIN_FAME + '；打输：另损残军 ' + (hasWall() ? Math.floor(CFG.CONQ_LOSE_EXTRA / 2) : CFG.CONQ_LOSE_EXTRA) + ' 灵石、都城城望-' + CFG.CONQ_LOSE_REP + '、' + CFG.CONQ_FAIL_GAP + ' 日不再兴兵。', 'info');
        return true;
    }
    function resumeConquest() {
        if (!_st.conquering) { say('⚔️ 没有在打的仗。', 'info'); return false; }
        if (window.currentBattle) { say('⚔️ 手头还打着——先了结这场。', 'warning'); return false; }
        return startConquestBattle(_st.conquering.city);
    }
    function startConquestBattle(ct) {
        try {
            if (window.NpcCrime && typeof window.NpcCrime.startFlaggedBattle === 'function') {
                var en = conqEnemy(ct);
                return window.NpcCrime.startFlaggedBattle(en, { _isConquestFight: true, city: ct },
                    '⚔️ ' + ct + '城下再战——守将「' + en.name + '」提刀出城。');
            }
        } catch (e) { console.warn('[静默失败] js/dynasty-court.js · startConquestBattle：这一仗没拉开', e && e.message); }
        return false;
    }
    function settleConquestFight(won) {
        if (!_st.conquering) return;
        var ct = _st.conquering.city;
        _st.conquering = null;
        if (won) {
            _st.vassals.push({ city: ct, day: absDay() });
            settle({ fame: CFG.CONQ_WIN_FAME }, '拓土之功');
            repUp(ct, CFG.CONQ_WIN_REP);
            var cp = cityPatron(ct);
            chron(eraYear() + '，克' + ct + '，其地改属，岁入入国库。' + (cp ? '城头「' + cp + '」的香幡照旧挂着——仙凡分治，赋册改姓而已。' : ''));
            deed('good', dynasty() + '的旗插上了' + ct + '城头——守将开城纳土，父老箪食壶浆。舆图上，你的疆域又宽了一圈。');
            log('⚔️ ' + ct + '克了！城改属（岁入+' + CFG.VASSAL_INCOME + '/月，现属城 ' + _st.vassals.length + '/' + CFG.VASSAL_MAX + '），名望+' + CFG.CONQ_WIN_FAME + '、城望+' + CFG.CONQ_WIN_REP + '。', 'success');
            say('⚔️ ' + ct + '城头改换' + dynasty() + '旗号！（属城 ' + _st.vassals.length + '/' + CFG.VASSAL_MAX + '）', 'success');
            expandAnger();
        } else {
            _st.conquestFailDay = absDay();
            var extra = hasWall() ? Math.floor(CFG.CONQ_LOSE_EXTRA / 2) : CFG.CONQ_LOSE_EXTRA;
            _st.treasury = Math.max(0, _st.treasury - extra);
            settle({ notoriety: CFG.CONQ_LOSE_NOTO }, '征伐无功');
            repDown(empCity(), CFG.CONQ_LOSE_REP);
            chron(eraYear() + '，征' + ct + '不克，班师。军资耗于城下。');
            log('⚔️ ' + ct + '城下折了锐气——班师。（军资打了水漂，另损残军 ' + extra + ' 灵石' + (hasWall() ? '，城墙工事省了一半' : '') + '、都城城望-' + CFG.CONQ_LOSE_REP + '、恶名+' + CFG.CONQ_LOSE_NOTO + '，' + CFG.CONQ_FAIL_GAP + ' 日后再兴兵）', 'warning');
            say('⚔️ 征' + ct + '无功而返——' + CFG.CONQ_FAIL_GAP + ' 日后再兴兵。', 'warning');
        }
        refresh();
    }

    // ============ v27.8 长安线：现皇帝的反应（讨逆诏 → 讨逆军真仗） ============
    // 你称帝，长安城里那位「现在的皇帝」不会当没看见：开国三十日使臣携讨逆诏到阙——
    //   奉表称藩（外示臣服，扩张两城长安必怒而发兵）或扣使拒诏（六十日后讨逆军临阙）。
    //   讨逆军是真仗（_isPunitiveFight）：打赢 → 长安不敢东顾，一线收官；打输 → 赔款、九十日后再来。
    function changanTick() {
        var ca = _st.changan;
        if (_st.ending) return;
        if (ca.phase === '' && _st.foundDay && absDay() - _st.foundDay >= CFG.EDICT_DUE) {
            ca.phase = 'edict';
            ca.edictDay = absDay();
            chron(eraYear() + '，长安天子闻「僭伪」之号，大怒，遣使携讨逆诏至阙：削号归藩，否则天兵问罪。');
            log('🏮 长安来使了——当今天子下讨逆诏，骂你僭号！朝政面板「长安」一段里回话：奉表称藩（缓兵）或扣使拒诏（硬顶，讨逆军' + CFG.DEFY_PUNITIVE + '日后到）。使臣在殿上候着，征伐与号召先停一停。', 'warning');
            say('🏮 长安使臣到阙——讨逆诏等着您回话！', 'warning');
            return;
        }
        if ((ca.phase === 'submit' || ca.phase === 'defy') && ca.warDue && absDay() >= ca.warDue) {
            ca.phase = 'war';
            ca.warDue = 0;
            chron(eraYear() + '，朝廷讨逆军至都城城下，旌旗蔽野，声言「奉天讨逆」。');
            log('🏮 朝廷的讨逆军兵临城下！（朝政面板「御敌」——真仗一场：打赢长安不敢东顾、抄没犒军绢帛 ' + CFG.PUNITIVE_BOUNTY + '；打输赔款 ' + (hasWall() ? Math.floor(CFG.PUNITIVE_LOSS / 2) + '（城墙减半）' : CFG.PUNITIVE_LOSS) + '、都城城望-' + CFG.PUNITIVE_LOSE_REP + '，九十日后再来）', 'warning');
            say('🏮 兵临城下——朝廷讨逆军到了，朝政面板里御敌！', 'warning');
        }
    }
    function resolveEdict(choice) {
        if (_st.changan.phase !== 'edict') { say('🏮 长安的使臣不在殿上。', 'warning'); return false; }
        var ca = _st.changan;
        if (choice === 'submit') {
            ca.phase = 'submit';
            settle({ mood: -5, karma: 2 }, '奉表称藩');
            repUp(empCity(), 3);
            chron(eraYear() + '，' + rulerWord() + '奉表长安，外示臣服——朝廷赐号「守土侯」，察访使却不曾断过。忍字头上一把刀。');
            log('🏮 你奉表称藩了（心境-5 忍辱 · 因果+2 · 都城城望+3 息兵安民）。长安记下了这一笔：**再并两城**，「守土侯」的封号就换讨逆军——奉表是缓兵，不是免战牌。', 'warning');
        } else if (choice === 'defy') {
            ca.phase = 'defy';
            ca.warDue = absDay() + CFG.DEFY_PUNITIVE;
            settle({ fame: 3, notoriety: 2 }, '扣使拒诏');
            chron(eraYear() + '，' + rulerWord() + '扣长安之使、拒其诏，回书八字：「天命靡常，惟德者居。」长安大震怒。');
            log('🏮 你把使臣扣下、诏书掷还（名望+3 硬气 · 恶名+2 僭逆坐实）——讨逆军 ' + CFG.DEFY_PUNITIVE + ' 日后兵临城下，备好城防。', 'warning');
        } else { say('🏮 使臣候着的回话只有两条：奉表，或扣使。', 'warning'); return false; }
        refresh();
        open();
        return true;
    }
    function expandAnger() {
        var ca = _st.changan;
        if (ca.phase !== 'submit' || ca.warDue) return;
        ca.anger++;
        if (ca.anger >= 2) {
            ca.warDue = absDay() + CFG.SUBMIT_GRACE;
            chron(eraYear() + '，' + rulerWord() + '奉表而兼并不息。长安察访使密奏入京，天子拍案：「守土侯反矣！」讨逆军将发。');
            log('🏮 长安震怒——你奉了表还在并土（察访 ' + ca.anger + '/2 满）：讨逆军 ' + CFG.SUBMIT_GRACE + ' 日后到，缓兵到头了。', 'warning');
        } else {
            log('🏮 长安的察访使记了一笔（' + ca.anger + '/2）——奉表称藩之后再并一城，天兵就发。', 'info');
        }
    }
    function punitiveEnemy() {
        var seed = seedOf('punitive_' + absDay());
        var tier = Math.max(1, tierOf()) + 2;
        var names = ['神策军都统', '龙武卫大将军', '讨逆行营元帅', '天威军节度使'];
        return {
            name: '朝廷讨逆军·' + names[seed % names.length],
            type: 'boss', physiologyType: 'humanoid',
            level: tier * 3 + 5, attack: 34 + tier * 8, defense: 18 + tier * 5, speed: 23,
            maxDurability: 150 + tier * 30, durabilities: { chest: 150 + tier * 30 }, combatAbilities: []
        };
    }
    function startPunitive() {
        if (_st.changan.phase !== 'war') { say('🏮 讨逆军没有来。', 'info'); return false; }
        if (_st.ending) { say('🏮 这一朝已经翻到末页了。', 'warning'); return false; }
        if (window.currentBattle) { say('🏮 手头还打着——先了结这场。', 'warning'); return false; }
        try {
            if (window.NpcCrime && typeof window.NpcCrime.startFlaggedBattle === 'function') {
                var en = punitiveEnemy();
                return window.NpcCrime.startFlaggedBattle(en, { _isPunitiveFight: true },
                    '🏮 都城城下，朝廷讨逆军列阵——「' + en.name + '」手持天子节钺：「逆臣！今日替天行道！」');
            }
            say('🏮 兵刃的账没接上——这一仗拉不起来。', 'warning');
        } catch (e) { console.warn('[静默失败] js/dynasty-court.js · startPunitive：讨逆这一仗没拉开', e && e.message); }
        return false;
    }
    function settlePunitiveFight(won) {
        if (_st.changan.phase !== 'war') return;
        var ca = _st.changan;
        if (won) {
            ca.phase = 'beaten';
            ca.beatenDay = absDay();
            _st.treasury = clamp(_st.treasury + CFG.PUNITIVE_BOUNTY, 0, 999999);
            settle({ fame: CFG.PUNITIVE_WIN_FAME }, '城下破朝廷讨逆军');
            repUp(empCity(), CFG.PUNITIVE_WIN_REP);
            chron(eraYear() + '，朝廷讨逆军大败于都城之下，解甲北归。长安天子叹「此心腹之患也」——自是讨逆不再，东土之事，朝廷不复问。');
            journal('endgame', '城下破讨逆军', '天子亲遣的讨逆军，在你都城下折了节钺。三个月后长安来了个小小的使团——这回不携讨逆诏了，携的是讲和的礼单。天下依旧有两个天子，但谁都明白，东土的事，该听谁的。');
            deed('good', '朝廷的讨逆军在你城下解甲——长安自此不敢东顾。这一天，都城家家闭户观战，户户上灯。');
            log('🏮 讨逆军破了！（名望+' + CFG.PUNITIVE_WIN_FAME + ' · 都城城望+' + CFG.PUNITIVE_WIN_REP + ' · 犒军绢帛折 ' + CFG.PUNITIVE_BOUNTY + ' 灵石入库）长安不敢东顾——这一线自此收官，往后征伐号召再无朝廷掣肘。', 'success');
            say('🏮 城下大捷——长安不敢东顾！', 'success');
        } else {
            var loss = hasWall() ? Math.floor(CFG.PUNITIVE_LOSS / 2) : CFG.PUNITIVE_LOSS;
            _st.treasury = Math.max(0, _st.treasury - loss);
            settle({ notoriety: 2 }, '败于朝廷讨逆军');
            repDown(empCity(), CFG.PUNITIVE_LOSE_REP);
            ca.phase = 'defy';
            ca.warDue = absDay() + CFG.PUNITIVE_AGAIN;
            chron(eraYear() + '，王师败于讨逆军，开门输赔款。朝廷耀兵城下三日而去，扬言卷土重来。');
            log('🏮 没顶住——讨逆军在城外耀兵三日，赔款 ' + loss + ' 灵石' + (hasWall() ? '（城墙工事省了一半）' : '') + '、都城城望-' + CFG.PUNITIVE_LOSE_REP + '、恶名+2。长安 ' + CFG.PUNITIVE_AGAIN + ' 日后再发兵：练功、修墙，再来。', 'warning');
            say('🏮 败于讨逆军——赔款输城望，长安 ' + CFG.PUNITIVE_AGAIN + ' 日后再来。', 'warning');
        }
        refresh();
    }

    // ============ v27.8 号召归附（声望的明账：不动刀兵，使节一纸书） ============
    // 城头的香幡有主（他派护持）→ 城不换幡，号召不动，要打就征伐；自家门派的幡 → 一句话的事（门槛减半）。
    function summonPower() {
        var c = cd();
        return Math.max(0, Number((c && c.fame) || 0)) + Math.floor(repVal(empCity()) / 2) + _st.vassals.length * 5;
    }
    function summonNeed(ct) {
        var s = _st.summons[pkCity(ct)] || {};
        var base = CFG.SUMMON_BASE + seedOf(pkCity(ct) + '_summon') % 40 + (Number(s.snubs) || 0) * CFG.SUMMON_SNUB;
        var p = cityPatron(ct);
        if (p && p === homeSect()) base = Math.floor(base / 2);   // 自家门派的城：幡下人认得你
        return base;
    }
    function summonOk(ct) {
        var g = courtOk();
        if (!g.ok) return g;
        if (_st.changan.phase === 'edict') return { ok: false, why: '长安的使臣还在殿上等着回话——先回诏。' };
        if (_st.changan.phase === 'war') return { ok: false, why: '讨逆军兵临城下——谁敢出使！' };
        if (_st.conquering) return { ok: false, why: '大军正在' + _st.conquering.city + '城下——先了结这一仗。' };
        if (_st.pendingRebel) return { ok: false, why: '藩王叛乱未平——内忧不除，何以招远。' };
        if (!ct) return { ok: false, why: '先选一座城。' };
        if (pkCity(ct) === pkCity(g.emp.city)) return { ok: false, why: '那是你的都城。' };
        if (isVassal(ct)) return { ok: false, why: ct + '已是属城。' };
        if (allCities().indexOf(ct) < 0) return { ok: false, why: '舆图上没有这座城。' };
        if (isImperialCapital(ct)) return { ok: false, why: '帝都长安是朝廷的京畿——召不动。' };
        if (!isMundane(ct)) return { ok: false, why: '仙家胜地不入世争——朝廷的使节到不了那种地方。' };
        if (_st.vassals.length >= CFG.VASSAL_MAX) return { ok: false, why: '属城已满 ' + CFG.VASSAL_MAX + ' 座——先消化消化。' };
        var patron = cityPatron(ct);
        if (patron && patron !== homeSect()) return { ok: false, why: ct + '的香火护持在「' + patron + '」——香火有主，城不换幡。要它，就兴兵（征伐）。' };
        var sm = _st.summons[pkCity(ct)];
        if (sm && sm.day && absDay() - sm.day < CFG.SUMMON_GAP) return { ok: false, why: '「' + ct + '」上回婉拒了——使节不常来，' + (CFG.SUMMON_GAP - (absDay() - sm.day)) + ' 日后再试。' };
        if (_st.treasury < CFG.SUMMON_COST) return { ok: false, why: '使节礼单要 ' + CFG.SUMMON_COST + ' 灵石（国库现 ' + _st.treasury + '）——空手的使节挨打。' };
        return { ok: true, emp: g.emp, city: ct, power: summonPower(), need: summonNeed(ct), patron: patron };
    }
    function summonCity(ct) {
        var g = summonOk(ct);
        if (!g.ok) { say('📜 ' + g.why, 'warning'); return false; }
        _st.treasury -= CFG.SUMMON_COST;   // 礼单先付，婉拒不退（军资同款口径）
        if (g.power >= g.need) {
            _st.vassals.push({ city: g.city, day: absDay() });
            delete _st.summons[pkCity(g.city)];
            settle({ fame: CFG.SUMMON_FAME, mood: 5 }, '不战而城归');
            repUp(g.city, CFG.SUMMON_WIN_REP);
            chron(eraYear() + '，遣使号召「' + g.city + '」，城献籍归附，不动刀兵。' + (g.patron ? '其城香火自家门派执幡，幡下人认得你——一句话的事。' : '使节一纸书，贤于十万兵。'));
            deed('good', '「' + g.city + '」望风归附——没动一刀一枪，城父老把户籍图册捧到了使节前。你的名望，比使节先到那座城。');
            log('📜 「' + g.city + '」应召归附！（号召力 ' + g.power + ' ≥ 民心 ' + g.need + '；属城 ' + _st.vassals.length + '/' + CFG.VASSAL_MAX + '、岁入+' + CFG.VASSAL_INCOME + '/月、该城城望+' + CFG.SUMMON_WIN_REP + '、名望+' + CFG.SUMMON_FAME + '）', 'success');
            say('📜 「' + g.city + '」应召归附！（属城 ' + _st.vassals.length + '/' + CFG.VASSAL_MAX + '）', 'success');
            expandAnger();
            refresh();
            open();
            return true;
        }
        var k = pkCity(g.city);
        var sm = _st.summons[k] || {};
        _st.summons[k] = { day: absDay(), snubs: (Number(sm.snubs) || 0) + 1 };
        log('📜 「' + g.city + '」婉拒了（号召力 ' + g.power + ' < 民心 ' + g.need + '——礼单收下了，人没松口；' + CFG.SUMMON_GAP + ' 日后再试，只是这回的回绝他们记着，下回门槛再高 ' + CFG.SUMMON_SNUB + '）。攒名望、修都城城望，再来。', 'warning');
        say('📜 「' + g.city + '」婉拒——号召力不足，' + CFG.SUMMON_GAP + ' 日后再来。', 'warning');
        refresh();
        return false;
    }

    // ============ 三大工程（各一生一回，全花国库） ============
    function workCost(kind) { return kind === 'palace' ? CFG.WORK_PALACE : kind === 'wall' ? CFG.WORK_WALL : kind === 'granary' ? CFG.WORK_GRANARY : 0; }
    function workOk(kind) {
        var g = courtOk();
        if (!g.ok) return g;
        if (['palace', 'wall', 'granary'].indexOf(kind) < 0) return { ok: false, why: '没有这项工程。' };
        if (_st.works[kind]) return { ok: false, why: '这一项已经动工落成了——' + ({ palace: '宫城', wall: '城墙', granary: '粮仓' })[kind] + '就在那里。' };
        var cost = workCost(kind);
        if (_st.treasury < cost) return { ok: false, why: '国库不够（要 ' + cost + '，现 ' + _st.treasury + '）——工部不敢领旨。' };
        return { ok: true, emp: g.emp, cost: cost };
    }
    function buildWork(kind) {
        var g = workOk(kind);
        if (!g.ok) { say('🏗️ ' + g.why, 'warning'); return false; }
        _st.treasury -= g.cost;
        _st.works[kind] = absDay();
        if (kind === 'palace') {
            settle({ fame: CFG.PALACE_FAME }, '宫城落成');
            chron(eraYear() + '，宫城成，正殿巍巍临御街——国库岁入自此多一成。');
            log('🏗️ 宫城落成！（名望+' + CFG.PALACE_FAME + ' · 国库月入+一成 · 工程 ' + g.cost + ' 灵石出国库）', 'success');
        } else if (kind === 'wall') {
            repUp(g.emp.city, CFG.WALL_REP);
            chron(eraYear() + '，城垣重修，都城城防固若金汤。');
            log('🏗️ 城墙修好了！（都城城望+' + CFG.WALL_REP + ' · 往后征伐/平叛失利，国库损失减半 · 工程 ' + g.cost + ' 灵石出国库）', 'success');
        } else {
            chron(eraYear() + '，开常平仓，岁积粮储——灾年赈济从此不花现银。');
            log('🏗️ 粮仓开了！（国库月入+' + CFG.GRANARY_INCOME + ' · 灾年「开仓赈济」免费 · 工程 ' + g.cost + ' 灵石出国库）', 'success');
        }
        refresh();
        open();
        return true;
    }

    // ============ v27.13 恩赏（国库→属城基金：拨银修桥铺路，城望走 RewardService 正门） ============
    // 模块⑨改良的另一半：朝堂决策落到城里——国库出钱、该城基金进账（WorldLedger.grantCityFund 正门）、
    // 城望小额+走 RewardService（settle 的 cityOverride 记到那座城头上）。
    // 额度夹逼：每回固定 GRANT_WORK_COST、国库不足办不成（有文案，官府不赊账）；
    // 每城 GRANT_WORK_GAP 日一回（冷却戳记在 _st.grants）——恩赏不是提款机。
    function grantWorkOk(ct) {
        var g = courtOk();
        if (!g.ok) return g;
        if (!ct) return { ok: false, why: '先选一座属城。' };
        if (!isVassal(ct)) return { ok: false, why: ct + '不是属城——恩赏只落在自家疆域里。' };
        var last = _st.grants[pkCity(ct)] || 0;
        if (last && absDay() - last < CFG.GRANT_WORK_GAP) return { ok: false, why: ct + '上回刚领过恩赏（' + (CFG.GRANT_WORK_GAP - (absDay() - last)) + ' 日后又可请领）——桥还没修完又拨新银，工部不干。' };
        if (_st.treasury < CFG.GRANT_WORK_COST) return { ok: false, why: '国库不够（要 ' + CFG.GRANT_WORK_COST + '，现 ' + _st.treasury + '）——修桥铺路的旨意下不去。' };
        return { ok: true, city: ct };
    }
    function grantPublicWork(ct) {
        var g = grantWorkOk(ct);
        if (!g.ok) { say('🏛️ ' + g.why, 'warning'); return false; }
        var cost = Math.min(CFG.GRANT_WORK_COST, Math.max(0, Math.floor(_st.treasury)));   // 夹逼：拨付额不超国库实有（过闸已保，双保险）
        _st.treasury -= cost;
        var granted = 0;
        try {
            if (window.WorldLedger && typeof window.WorldLedger.grantCityFund === 'function') {
                granted = window.WorldLedger.grantCityFund(ct, cost).granted || 0;
            }
        } catch (eGr) { console.warn('[静默失败] js/dynasty-court.js · grantPublicWork：这笔恩赏没落到城基金', eGr && eGr.message); }
        if (granted <= 0) {   // 城账没落成——银两原路退回国库，不留半笔糊涂账（军资拉不起仗退款同款口径）
            _st.treasury += cost;
            say('🏛️ 城基金的账没接上——这笔恩赏先记回国库。', 'warning');
            return false;
        }
        _st.grants[pkCity(ct)] = absDay();
        var rs = settle({ rep: CFG.GRANT_WORK_REP }, '恩赏修桥铺路', ct);   // 城望走 RewardService 正门（rep=cityReputation，落到 ct 城）
        chron(eraYear() + '，拨国帑 ' + cost + ' 灵石与' + ct + '，修桥铺路。父老感念，' + ct + '城望渐隆。');
        log('🏛️ 恩赏下了：国库 -' + cost + ' → ' + ct + '城基金 +' + granted + '，' + ct + '城望+' + CFG.GRANT_WORK_REP + (rs && rs.note ? '（' + rs.note + '）' : '') + '。' + CFG.GRANT_WORK_GAP + ' 日内此城不再重复请领。', 'success');
        refresh();
        open();
        return true;
    }

    // ==================== v27.13：官员个人账 · 百官私账（官员有私财与派系，贪官挪库，亏空查账） ====================
    // 朝堂风波从剧本变成账本：开衙补授一班百官（官阶/派系全部取材既有朝堂文案——户部奏/礼部伏阙/工部领旨/
    // 太常寺设坛/翰林清议，不发明新大系），各开一本私账（StateRegistry 新键 dynastyCourtOfficials，加键不升版
    // ——旧档缺键=官员无私账照旧）。私账两路进钱：俸禄（月初自宫室常支里分俸，国库不另扣，明账一行不动）
    // 与赏赐（国库直扣→私账入账，一笔进出两头有账）；greed 高的月初掷概率挪国库——国库实存减、明账分文不动，
    // 「账面亏空」=实存与账面之差（账面余额=实存+未清亏空，明账永远平的），账不查永远平的。
    // 玩家官职够格（帝位——朝政面板正门本就只放帝王进）可御史查账：掷中立案，追赃入库/罢官抄家/高抬贵手三裁，
    // 反咬构陷的玩家侧代价走 RewardService 钱门；未开查账的世界里这是暗账，库紧时账房炸账自发败露。
    var OFF_SLOTS = [
        { slot: 'co1', title: '户部尚书', tier: 3, faction: '户部' },
        { slot: 'co2', title: '户部侍郎', tier: 1, faction: '户部' },
        { slot: 'co3', title: '礼部尚书', tier: 3, faction: '礼部' },
        { slot: 'co4', title: '工部尚书', tier: 3, faction: '工部' },
        { slot: 'co5', title: '太常寺卿', tier: 2, faction: '太常寺' },
        { slot: 'co6', title: '翰林学士', tier: 2, faction: '翰林院' }
    ];
    var OFF_FACTIONS = ['户部', '礼部', '工部', '太常寺', '翰林院'];
    var OFF_SURNAMES = ['王', '李', '张', '刘', '陈', '杨', '赵', '周', '崔', '卢', '裴', '沈'];
    var OFF_GIVENS = ['守正', '秉忠', '怀礼', '崇文', '安世', '清源', '弘度', '景翰', '延龄', '知节', '茂先', '士元'];
    var _off = { officials: {} };   // v27.13：官员私账（id -> {purse, factionTag, greed, stolen}），StateRegistry 正门存档
    function offGreedSeed(id, faction) {
        var seed = seedOf(dynasty() + '|' + id);
        var g = 20 + ((seed >>> 8) % 76);   // 20–95
        if (faction === '户部') g += 5;     // 近水楼台——管钱的先伸手
        return clamp(g, 0, 100);
    }
    function offSeed(p) {
        if (!_off.officials[p.id]) _off.officials[p.id] = { purse: 0, factionTag: p.faction, greed: offGreedSeed(p.id, p.faction), stolen: 0 };
        return _off.officials[p.id];
    }
    function offGap() {   // v27.13：未清亏空=Σ在任官员名下赃 + 追不回的死账
        var g = 0;
        for (var k in _off.officials) g += Math.max(0, Number(_off.officials[k].stolen) || 0);
        return Math.floor(g) + Math.max(0, Number(_st.court && _st.court.rotten) || 0);
    }
    function bookBal() { return Math.max(0, Math.floor(_st.treasury)) + offGap(); }   // v27.13：账面余额=实存+未清亏空（明账要平，亏空只藏在实存里）
    function rosterSorted() { return _st.court.roster.slice().sort(function (a, b) { return a.slot < b.slot ? -1 : a.slot > b.slot ? 1 : 0; }); }
    function rosterFind(id) { for (var i = 0; i < _st.court.roster.length; i++) if (_st.court.roster[i].id === id) return _st.court.roster[i]; return null; }
    function slotSpec(slot) { for (var i = 0; i < OFF_SLOTS.length; i++) if (OFF_SLOTS[i].slot === slot) return OFF_SLOTS[i]; return null; }
    function appointNew(spec) {   // v27.13：补授一员——槽位世袭官阶，人按朝代+槽位+代数重播种；生成（=首次记账）即开户播种 factionTag/greed
        var gen = (Number(_st.court.gen[spec.slot]) || 0) + 1;
        _st.court.gen[spec.slot] = gen;
        var id = spec.slot + (gen > 1 ? '#' + gen : '');
        var seed = seedOf(dynasty() + '|' + id);
        var person = { id: id, slot: spec.slot, name: OFF_SURNAMES[seed % OFF_SURNAMES.length] + OFF_GIVENS[(seed >>> 4) % OFF_GIVENS.length], title: spec.title, tier: spec.tier, faction: spec.faction, day: absDay(), gen: gen };
        _st.court.roster = _st.court.roster.filter(function (p) { return p.slot !== spec.slot; });
        _st.court.roster.push(person);
        offSeed(person);
        return person;
    }
    function ensureRoster() {   // v27.13：开衙补授班底（老档读到一半也能补——幂等）
        try {
            if (_st.ending || !glEmperor() || _st.court.roster.length) return;
            for (var i = 0; i < OFF_SLOTS.length; i++) appointNew(OFF_SLOTS[i]);
            var names = rosterSorted().map(function (p) { return p.name + '（' + p.title + '）'; }).join('、');
            chron(eraYear() + '，朝堂补授班底：' + names + '到任——百官各开私账，月俸自宫室常支里分。');
        } catch (e) { console.warn('[静默失败] js/dynasty-court.js · ensureRoster：百官班底没补上', e && e.message); }
    }
    function officialsMonthly() {   // v27.13：百官私账月结（月初过账块内调用）
        try {
            ensureRoster();
            var list = rosterSorted(), i, p, led;
            // ① 俸禄：按官阶入各官私账——宫室常支的内部分账，国库侧不另扣，明账一行不动
            for (i = 0; i < list.length; i++) {
                p = list[i];
                led = _off.officials[p.id] || offSeed(p);
                led.purse = Math.min(1e6, led.purse + (CFG.OFF_SALARY[p.tier] || 4));
            }
            // ② 贪官挪库：全朝每月至多两笔；查账后三十日风声紧没人敢伸手；伸手即实存减、明账不动（不 log 不 chron）
            if (_st.court.auditDay && absDay() - _st.court.auditDay < CFG.OFF_EMZZ_FREEZE) return;
            var took = 0;
            for (i = 0; i < list.length && took < CFG.OFF_EMZZ_MAX; i++) {
                p = list[i];
                led = _off.officials[p.id];
                if (!led || (Number(led.greed) || 0) < CFG.OFF_GREED_MIN) continue;
                var pHit = led.greed >= 80 ? CFG.OFF_EMZZ_P_HI : CFG.OFF_EMZZ_P_LO;
                if (dice() >= pHit) continue;
                var band = CFG.OFF_EMZZ_AMT[p.tier] || CFG.OFF_EMZZ_AMT[1];
                var amt = band[0] + seedOf(p.id + '_' + absDay()) % (band[1] - band[0] + 1);
                amt = Math.min(amt, Math.max(0, Math.floor(_st.treasury)));
                if (amt <= 0) continue;
                _st.treasury -= amt;
                led.stolen = Math.max(0, (Number(led.stolen) || 0)) + amt;
                led.purse = Math.min(1e6, led.purse + amt);
                took++;   // 暗账不响——账不查永远平的
            }
        } catch (e) { console.warn('[静默失败] js/dynasty-court.js · officialsMonthly：百官私账月结没过成', e && e.message); }
    }
    function giftOfficial(id) {   // v27.13：赏赐——国库 -20 → 该官私账 +20（两头有账），天恩所及贪念收敛
        var g = courtOk();
        if (!g.ok) { say('⚖️ ' + g.why, 'warning'); return false; }
        ensureRoster();
        var p = rosterFind(String(id || ''));
        if (!p) { say('⚖️ 朝班里没有这个人。', 'warning'); return false; }
        var led = _off.officials[p.id] || offSeed(p);
        var last = Number(_st.court.gifts[p.id]) || 0;
        if (last && absDay() - last < CFG.OFF_GIFT_GAP) { say('⚖️ ' + esc(p.name) + '上回刚领过赏——天恩太滥就不值钱了（' + (CFG.OFF_GIFT_GAP - (absDay() - last)) + ' 日后再赏）。', 'warning'); return false; }
        if (_st.treasury < CFG.OFF_GIFT_COST) { say('⚖️ 国库不够赏（要 ' + CFG.OFF_GIFT_COST + '，实存 ' + Math.floor(_st.treasury) + '）。', 'warning'); return false; }
        _st.treasury -= CFG.OFF_GIFT_COST;
        led.purse = Math.min(1e6, led.purse + CFG.OFF_GIFT_COST);
        led.greed = clamp((Number(led.greed) || 0) - CFG.OFF_GIFT_GREED_DOWN, 0, 100);
        _st.court.gifts[p.id] = absDay();
        log('⚖️ 天恩赏了' + esc(p.name) + '（' + esc(p.title) + '·' + esc(p.faction) + '）：国库 -' + CFG.OFF_GIFT_COST + ' → 其私账 +' + CFG.OFF_GIFT_COST + '，一笔进出两头有账；贪念收敛几分。', 'success');
        refresh();
        open();
        return true;
    }
    function auditOk() {   // v27.13：查账门——帝位（courtOk 正门）+ 班底在任 + 无未决案 + 九十日冷却
        var g = courtOk();
        if (!g.ok) return g;
        ensureRoster();
        if (!_st.court.roster.length) return { ok: false, why: '百官班底还没到任——御史台无账可查。' };
        if (_st.court.case) return { ok: false, why: '上一桩亏空案还没裁决——先把案子了了。' };
        if (_st.court.auditDay && absDay() - _st.court.auditDay < CFG.AUDIT_GAP) return { ok: false, why: '御史台刚核过账（' + (CFG.AUDIT_GAP - (absDay() - _st.court.auditDay)) + ' 日后再查）——查账不是天天翻牌。' };
        return { ok: true };
    }
    function fattestThief() {   // v27.13：在任官员里名下赃最厚的一位（无则 null——只剩死账时无从追起）
        var list = rosterSorted(), target = null, best = 0;
        for (var i = 0; i < list.length; i++) {
            var led = _off.officials[list[i].id];
            var st = led ? Math.max(0, Number(led.stolen) || 0) : 0;
            if (st > best) { best = st; target = list[i]; }
        }
        return target ? { person: target, amount: best } : null;
    }
    function auditBooks() {   // v27.13：御史查账——亏空越大越好查；掷不中亏空继续滚（风声紧全朝收手三十日）
        var g = auditOk();
        if (!g.ok) { say('⚖️ ' + g.why, 'warning'); return false; }
        _st.court.auditDay = absDay();
        var gap = offGap();
        var sk = 0;
        try { if (typeof window.getLifeSkill === 'function') sk = Number(window.getLifeSkill('学识')) || 0; } catch (eS) {}
        var p = Math.min(CFG.AUDIT_P_CAP, CFG.AUDIT_P_BASE + Math.min(0.45, gap / CFG.AUDIT_P_DEFICIT) + Math.min(0.1, sk * CFG.AUDIT_P_SKILL));
        if (gap <= 0) {
            log('⚖️ 御史台核账：账面 ' + bookBal() + '，实存 ' + Math.floor(_st.treasury) + '——账目平准，分毫不差。', 'info');
            open();
            return true;
        }
        if (dice() >= p) {
            log('⚖️ 御史台查了三日：账面 ' + bookBal() + '，实存对不上却查不出窟窿在哪（成算 ' + Math.round(p * 100) + '%）。风声紧，' + CFG.OFF_EMZZ_FREEZE + ' 日内没人敢再伸手——亏空挂在账上继续滚。', 'warning');
            open();
            return true;
        }
        var hit = fattestThief();
        if (!hit) {
            log('⚖️ 御史台查实亏空 ' + gap + ' 灵石——却是笔旧年烂账：经手人已不在其位，无从追起。死账挂着，实存再也回不到账面。', 'warning');
            open();
            return true;
        }
        _st.court.case = { id: hit.person.id, day: absDay(), auto: false };
        chron(eraYear() + '，御史台核出国库亏空 ' + gap + ' 灵石，指向' + hit.person.faction + hit.person.name + '（' + hit.person.title + '）。');
        log('⚖️ 御史台查实亏空！账面 ' + bookBal() + '、实存 ' + Math.floor(_st.treasury) + '、亏空 ' + gap + '——指向' + esc(hit.person.name) + '（' + esc(hit.person.title) + '·' + esc(hit.person.faction) + '，查实名下赃 ' + hit.amount + '）。朝政面板裁决：追赃入库/罢官抄家/高抬贵手。', 'warning');
        say('⚖️ 御史台查实国库亏空 ' + gap + ' 灵石——案子等着您裁！', 'warning');
        open();
        return true;
    }
    function maybeExposeDeficit() {   // v27.13：暗账自发败露——库紧（实存<15）时账房炸账，免掷直立案
        try {
            if (!glEmperor() || _st.ending) return;
            if (_st.court.case || !_st.court.roster.length) return;
            var gap = offGap();
            if (gap <= 0 || Math.floor(_st.treasury) >= CFG.EXPOSE_TIGHT) return;
            if (_st.court.lastCaseDay && absDay() - _st.court.lastCaseDay < CFG.EXPOSE_GAP) return;
            var hit = fattestThief();
            if (!hit) return;
            _st.court.case = { id: hit.person.id, day: absDay(), auto: true };
            _st.court.lastCaseDay = absDay();
            chron(eraYear() + '，国库告紧，库吏炸账：实存与账面差 ' + gap + ' 灵石，账房指到' + hit.person.faction + hit.person.name + '头上。');
            log('⚖️ 亏空败露！国库告紧，库吏炸账——账面 ' + bookBal() + '、实存 ' + Math.floor(_st.treasury) + '、亏空 ' + gap + '，指到' + esc(hit.person.name) + '（' + esc(hit.person.title) + '）头上。朝政面板裁决。', 'warning');
            say('⚖️ 亏空败露——国库紧得捂不住了！', 'warning');
        } catch (e) { console.warn('[静默失败] js/dynasty-court.js · maybeExposeDeficit：亏空败露这一笔没响', e && e.message); }
    }
    function biteOrDeter(p, kind) {   // v27.13：反咬构陷（玩家侧政治代价走 RewardService 钱门）／风声鹤唳
        var pB = kind === 'dismiss' ? CFG.BITE_P_DISMISS : CFG.BITE_P_RECOVER;
        if (dice() < pB) {
            settle(kind === 'dismiss' ? { mood: -8, notoriety: 3 } : { mood: -6, notoriety: 2 }, '贪官同党反咬构陷');
            var list = rosterSorted();
            for (var i = 0; i < list.length; i++) {
                if (list[i].id === p.id) continue;
                var led = _off.officials[list[i].id];
                if (led && list[i].faction === p.faction) led.greed = clamp((Number(led.greed) || 0) + 5, 0, 100);   // 同党有恃无恐
            }
            log('⚖️ ' + esc(p.name) + '的同党反咬一口——构陷御史、朝议汹汹（心境' + (kind === 'dismiss' ? '-8' : '-6') + ' 恶名+' + (kind === 'dismiss' ? '3' : '2') + '，走 RewardService）；同党有恃无恐，贪念更张。', 'warning');
        } else {
            var list2 = rosterSorted();
            for (var j = 0; j < list2.length; j++) {
                if (list2[j].id === p.id) continue;
                var led2 = _off.officials[list2[j].id];
                if (led2) led2.greed = clamp((Number(led2.greed) || 0) - 4, 0, 100);   // 风声鹤唳，全朝收敛
            }
            log('⚖️ 同党看' + esc(p.name) + '倒了台，个个噤声——全朝风声鹤唳（百官贪念各-4）。', 'info');
        }
    }
    function resolveCase(choice) {   // v27.13：亏空案三裁——追赃入库/罢官抄家/高抬贵手
        if (!_st.court.case) { say('⚖️ 御史台没有未决的案子。', 'warning'); return false; }
        var g = courtOk();
        if (!g.ok) { say('⚖️ ' + g.why, 'warning'); return false; }
        ensureRoster();
        var cs = _st.court.case;
        var p = rosterFind(cs.id);
        var led = p ? (_off.officials[cs.id] || offSeed(p)) : null;
        if (!p || !led) {   // 案犯已不在其位（读档坏账兜底）——当面销案
            _st.court.case = null;
            say('⚖️ 案犯已不在其位——销案归档。', 'info');
            return false;
        }
        var stolen = Math.max(0, Number(led.stolen) || 0);
        if (choice === 'recover') {
            var rec = Math.min(led.purse, stolen);
            led.purse -= rec;
            led.stolen -= rec;
            _st.treasury = clamp(_st.treasury + rec, 0, 999999);
            led.greed = clamp((Number(led.greed) || 0) - 12, 0, 100);   // 戴罪留用，手脚收敛
            chron(eraYear() + '，' + (cs.auto ? '库吏炸账' : '御史台查实') + p.faction + p.name + '（' + p.title + '）挪库，追赃 ' + rec + ' 灵石入库，戴罪留用。');
            if (rec > 0) log('⚖️ 追赃入库：' + esc(p.name) + '退赃 ' + rec + ' 灵石（国库实存 +' + rec + '，账面不动——窟窿补上了），戴罪留用。', 'success');
            else log('⚖️ ' + esc(p.name) + '私囊见底，分文追不回——赃款早花了，亏空继续滚（他还在任上，往后月俸进来还能接着追）。', 'warning');
            biteOrDeter(p, 'recover');
        } else if (choice === 'dismiss') {
            var purseAll = led.purse;
            var rec2 = Math.min(purseAll, stolen);
            var leftover = stolen - rec2;
            _st.treasury = clamp(_st.treasury + purseAll, 0, 999999);   // 抄家：私产尽数没入国库（含干净家产）
            _st.court.rotten = Math.max(0, Number(_st.court.rotten) || 0) + leftover;   // 追不回的赃挂成死账——亏空照旧滚
            delete _off.officials[cs.id];
            var spec = slotSpec(p.slot);
            var fresh = spec ? appointNew(spec) : null;
            chron(eraYear() + '，罢' + p.faction + p.name + '（' + p.title + '）官，抄没私产 ' + purseAll + ' 灵石入库' + (leftover > 0 ? '，' + leftover + ' 灵石赃款追不回、挂成死账' : '') + (fresh ? '；补授' + fresh.name + '接任。' : '。'));
            log('⚖️ 罢官抄家：' + esc(p.name) + '私产 ' + purseAll + ' 灵石尽数没入国库' + (leftover > 0 ? '（' + leftover + ' 灵石追不回，挂成死账——这半笔亏空永不平了）' : '（窟窿补上了）') + (fresh ? '，' + esc(fresh.name) + '补授' + esc(fresh.title) + '。' : '。'), 'success');
            biteOrDeter(p, 'dismiss');
        } else if (choice === 'pardon') {
            led.greed = clamp((Number(led.greed) || 0) + 10, 0, 100);
            chron(eraYear() + '，' + (cs.auto ? '库吏炸账' : '御史台查实') + p.faction + p.name + '挪库，' + rulerWord() + '高抬贵手，既往不咎。');
            log('⚖️ 你把案子压下了——' + esc(p.name) + '看穿了天家的底线，胆子更肥（贪念+10）；赃款一分没动，亏空继续滚。', 'warning');
        } else {
            say('⚖️ 案子只有三条路：追赃入库、罢官抄家、高抬贵手。', 'warning');
            return false;
        }
        _st.court.case = null;
        _st.court.lastCaseDay = absDay();
        refresh();
        open();
        return true;
    }

    // ============ 朝堂风波（自动上奏，一生各裁一回，间隔≥60日） ============
    function turmoilCond(id) {
        var g0 = glEmperor();
        if (!g0 || _st.ending) return false;
        if (_st.pending || _st.pendingRebel || _st.conquering) return false;
        if (_st.changan.phase === 'edict' || _st.changan.phase === 'war') return false;   // 长安的事压过一切——使臣在殿上/讨逆军在城下，朝堂议不了别的
        if (absDay() - _st.foundDay < CFG.TURMOIL_MIN_REIGN) return false;
        if (_st.lastTurmoilDay && absDay() - _st.lastTurmoilDay < CFG.TURMOIL_GAP) return false;
        if (_st.turmoilDone[id]) return false;
        if (id === 'rebel') return _st.vassals.length >= 1;
        if (id === 'famine') return true;
        if (id === 'heir') return !_st.heir && reignYear() >= 2;
        if (id === 'historian') return karmaNow() < 0;
        return false;
    }
    function maybeTurmoil() {
        try {
            for (var i = 0; i < TURMOIL_IDS.length; i++) {
                if (turmoilCond(TURMOIL_IDS[i])) {
                    _st.pending = { id: TURMOIL_IDS[i], day: absDay() };
                    var names = { rebel: '八百里加急：属城藩王反了！', famine: '户部奏：今岁大灾，州县告饥。', heir: '礼部率百官伏阙：请早立太子，以安国本。', historian: '史官捧实录直笔入殿：陛下，史书该怎么写？' };
                    log('📜 ' + names[TURMOIL_IDS[i]] + '（朝政面板里裁决——这事等着您，不裁不散朝）', 'warning');
                    say('📜 朝堂有大事——' + names[TURMOIL_IDS[i]], 'warning');
                    return true;
                }
            }
        } catch (e) { console.warn('[静默失败] js/dynasty-court.js · maybeTurmoil：今日的朝堂太平', e && e.message); }
        return false;
    }
    function rebelCity() {
        if (_st.pendingRebel) return _st.pendingRebel.city;
        if (!_st.vassals.length) return '';
        return _st.vassals[seedOf('rebel_' + absDay()) % _st.vassals.length].city;
    }
    function resolveTurmoil(id, choice) {
        if (!_st.pending || _st.pending.id !== id) { say('📜 这道奏折不在案头。', 'warning'); return false; }
        var g = courtOk();
        if (!g.ok) { say('👑 ' + g.why, 'warning'); return false; }
        var emp = g.emp;
        if (id === 'heir') {
            if (choice === 'none') {
                settle({ mood: -5, notoriety: 1 }, '拒立太子');
                chron(eraYear() + '，百官伏阙请立储，' + rulerWord() + '不许。朝议汹汹。');
                log('📜 你把奏折留中了——百官面面相觑退朝。（心境-5 恶名+1）', 'warning');
            } else {
                var hadPending = _st.pending;
                _st.pending = null;   // designateHeir 自己记账；立不成就把奏折放回案头
                if (!designateHeir(choice)) { _st.pending = hadPending; return false; }
                finishTurmoil(id, choice);
                return true;
            }
        } else if (id === 'famine') {
            if (choice === 'remit') {
                _st.taxReliefUntil = absDay() + CFG.REMIT_DAYS;
                settle({ karma: CFG.REMIT_KARMA }, '蠲免赋税');
                repUp(emp.city, CFG.REMIT_REP);
                chron(eraYear() + '，大灾，诏蠲都城赋税九十日。民皆呼万岁。');
                log('📜 蠲免诏下：九十日内都城税入停（国库少进这一项），换都城城望+' + CFG.REMIT_REP + '、因果+' + CFG.REMIT_KARMA + '。', 'success');
            } else if (choice === 'relief') {
                var cost = hasGranary() ? 0 : CFG.RELIEF_COST;
                if (_st.treasury < cost) { say('📜 国库不够赈灾（要 ' + cost + '，现 ' + _st.treasury + '）。', 'warning'); return false; }
                _st.treasury -= cost;
                settle({ karma: CFG.RELIEF_KARMA }, '开仓赈济');
                repUp(emp.city, CFG.RELIEF_REP);
                chron(eraYear() + '，大灾，' + (hasGranary() ? '开常平仓放粮' : '发国库 ' + cost + ' 灵石赈济') + '，全活甚众。');
                log('📜 赈灾成了' + (hasGranary() ? '（常平仓放粮，分文不花现银——当年开粮仓的账今日收回来了）' : '（国库 -' + cost + '）') + '：都城城望+' + CFG.RELIEF_REP + '、因果+' + CFG.RELIEF_KARMA + '。', 'success');
            } else {
                settle({ karma: -CFG.IGNORE_KARMA, notoriety: CFG.IGNORE_NOTO }, '坐视灾情');
                repDown(emp.city, CFG.IGNORE_REP);
                chron(eraYear() + '，大灾，朝廷不闻。饿殍载道，民怨沸腾。');
                log('📜 你把灾情的奏折压下了——都城城望-' + CFG.IGNORE_REP + '、因果-' + CFG.IGNORE_KARMA + '、恶名+' + CFG.IGNORE_NOTO + '。史书会记这一笔。', 'warning');
            }
        } else if (id === 'historian') {
            if (choice === 'burn') {
                settle({ karma: -CFG.BURN_KARMA, notoriety: CFG.BURN_NOTO, mood: -CFG.BURN_MOOD }, '焚毁实录');
                chron(eraYear() + '，' + rulerWord() + '焚实录。史官当殿折笔——烧得掉纸，烧不掉人心里的字。');
                log('📜 实录烧了——因果-' + CFG.BURN_KARMA + '、恶名+' + CFG.BURN_NOTO + '、心境-' + CFG.BURN_MOOD + '。野史反而传得更凶。', 'warning');
            } else {
                settle({ karma: CFG.ALLOW_KARMA, mood: CFG.ALLOW_MOOD }, '容史官直笔');
                chron(eraYear() + '，史官直笔实录，' + rulerWord() + '容之。后世称本朝有史德。');
                log('📜 你让史官照实写了——因果+' + CFG.ALLOW_KARMA + '、心境+' + CFG.ALLOW_MOOD + '。直笔的实录，比粉饰的更传得远。', 'success');
            }
        } else if (id === 'rebel') {
            var rct = rebelCity();
            if (!rct) { _st.pending = null; return false; }
            if (choice === 'appease') {
                if (_st.treasury < CFG.APPEASE_COST) { say('📜 国库不够抚银（要 ' + CFG.APPEASE_COST + '，现 ' + _st.treasury + '）。', 'warning'); return false; }
                _st.treasury -= CFG.APPEASE_COST;
                repDown(rct, CFG.APPEASE_REP);
                chron(eraYear() + '，' + rct + '藩王反，朝廷发抚银 ' + CFG.APPEASE_COST + ' 灵石招安。城保住了，面子丢了一半。');
                log('📜 招安成了：' + rct + '仍是属城（国库 -' + CFG.APPEASE_COST + '、' + rct + '城望-' + CFG.APPEASE_REP + '）——不流血，但藩王看轻了朝廷。', 'success');
            } else {
                _st.pending = null;
                _st.pendingRebel = { city: rct };
                var started = false;
                try {
                    if (window.NpcCrime && typeof window.NpcCrime.startFlaggedBattle === 'function') {
                        var en = rebelEnemy(rct);
                        started = window.NpcCrime.startFlaggedBattle(en, { _isRebelFight: true, city: rct },
                            '⚔️ ' + rct + '叛王「' + en.name + '」阵前叫骂——御驾亲征，就在此阵！');
                    } else { say('⚔️ 兵刃的账没接上——这一仗拉不起来。', 'warning'); }
                } catch (eB) { console.warn('[静默失败] js/dynasty-court.js · resolveTurmoil：平叛这一仗没拉开', eB && eB.message); }
                if (!started) { _st.pendingRebel = null; _st.pending = { id: 'rebel', day: absDay() }; return false; }
                return true;   // 仗打完 settleRebelFight 记账收案
            }
        }
        finishTurmoil(id, choice);
        refresh();
        open();
        return true;
    }
    function finishTurmoil(id, choice) {
        _st.pending = null;
        _st.turmoilDone[id] = { day: absDay(), choice: String(choice || '').slice(0, 20) };
        _st.lastTurmoilDay = absDay();
    }
    function rebelEnemy(ct) {
        var seed = seedOf(pkCity(ct) + '_rebel_' + absDay());
        var tier = Math.max(1, tierOf()) + 1;
        return {
            name: ct + REBEL_NAMES[seed % REBEL_NAMES.length] + '·' + ['赫连勃', '拓跋雄', '宇文烈', '慕容枭'][seed % 4],
            type: 'boss', physiologyType: 'humanoid',
            level: tier * 3 + 2, attack: 28 + tier * 7, defense: 15 + tier * 4, speed: 21,
            maxDurability: 110 + tier * 25, durabilities: { chest: 110 + tier * 25 }, combatAbilities: []
        };
    }
    function resumeRebel() {
        if (!_st.pendingRebel) { say('⚔️ 没有未平的叛乱。', 'info'); return false; }
        if (window.currentBattle) { say('⚔️ 手头还打着——先了结这场。', 'warning'); return false; }
        try {
            if (window.NpcCrime && typeof window.NpcCrime.startFlaggedBattle === 'function') {
                var ct = _st.pendingRebel.city;
                var en = rebelEnemy(ct);
                return window.NpcCrime.startFlaggedBattle(en, { _isRebelFight: true, city: ct }, '⚔️ ' + ct + '城下再战叛王「' + en.name + '」。');
            }
        } catch (e) { console.warn('[静默失败] js/dynasty-court.js · resumeRebel：这一仗没拉开', e && e.message); }
        return false;
    }
    function settleRebelFight(won) {
        if (!_st.pendingRebel) return;
        var ct = _st.pendingRebel.city;
        _st.pendingRebel = null;
        if (won) {
            settle({ notoriety: CFG.REBEL_WIN_NOTO }, '亲征平叛');
            repUp(ct, CFG.REBEL_WIN_REP);
            _st.treasury += CFG.REBEL_WIN_TREASURY;
            chron(eraYear() + '，' + ct + '藩王反，' + rulerWord() + '亲征平之，抄没叛产入库。');
            deed('good', dynasty() + '的天子亲征，阵前斩了' + ct + '叛王的旗——诸藩闻风胆寒，属城父老反倒安了心。');
            log('⚔️ 叛乱平了！' + ct + '仍是属城（抄没叛产+' + CFG.REBEL_WIN_TREASURY + ' 灵石入库、城望+' + CFG.REBEL_WIN_REP + '、恶名+' + CFG.REBEL_WIN_NOTO + '——杀伐之名）', 'success');
            say('⚔️ ' + ct + '叛乱平定——诸藩胆寒。', 'success');
        } else {
            var i = -1, k = pkCity(ct);
            for (var v = 0; v < _st.vassals.length; v++) if (pkCity(_st.vassals[v].city) === k) { i = v; break; }
            if (i >= 0) _st.vassals.splice(i, 1);
            var loss = hasWall() ? Math.floor(CFG.REBEL_LOSE_TREASURY / 2) : CFG.REBEL_LOSE_TREASURY;
            _st.treasury = Math.max(0, _st.treasury - loss);
            repDown(empCity(), CFG.REBEL_LOSE_REP);
            chron(eraYear() + '，' + ct + '叛，官军败绩，其地自立。朝廷威望扫地。');
            log('⚔️ 御驾亲征竟折了阵——' + ct + '自立了（属城 -1，国库另损 ' + loss + ' 灵石' + (hasWall() ? '，城墙工事省了一半' : '') + '、都城城望-' + CFG.REBEL_LOSE_REP + '）', 'warning');
            say('⚔️ ' + ct + '叛去了——御驾亲征也没按住。', 'warning');
        }
        finishTurmoil('rebel', won ? 'crush-win' : 'crush-lose');
        refresh();
    }

    // ============ 终局（飞升钩子：举国飞升 / 禅位 / 天下鼎沸） ============
    function endingOk(pref) {
        var g = courtOk();
        if (!g.ok) return g;
        if (pref === 'ascend') {
            var s = glState();
            if (!s.faith && !s.earthgod) return { ok: false, why: '举国飞升要香火线兜底——先设坛传教（或受封土地公），国祚才化得成香火。' };
        } else if (pref === 'abdicate') {
            if (!_st.heir) return { ok: false, why: '禅位要有太子——先立储（亲子或亲传弟子）。' };
        } else return { ok: false, why: '没有这条路。' };
        return { ok: true };
    }
    function setEndingPref(pref) {
        var g = endingOk(pref);
        if (!g.ok) { say('👑 ' + g.why, 'warning'); return false; }
        _st.endingPref = pref;
        chron(eraYear() + '，' + rulerWord() + '谕礼部：他日龙驭上宾，以' + endingName(pref) + '为定局。');
        log('👑 终局定了：飞升那日走「' + endingName(pref) + '」。（改了主意随时回来换）', 'success');
        open();
        return true;
    }
    function onAscend() {
        var emp = glEmperor();
        if (!emp || _st.ending) return;
        initCourt();
        var s = glState();
        // 【终局并轨·第一批】与《灵气之尽》互斥——这是本函数唯一一处终局判定（正文三笔一个字没动）。
        // 判定依据（实测 2026-10-05）：qi_ending 落定＝全链真终局已写完，且那一结局真的改了世界
        //   （restoreWorldQi + WorldJournal endgame + 末法时代/仙路终结的正文）。
        // 此刻再叠一套「国祚化香火 / 禅位 / 天下鼎沸」，等于一生给两回终局，且与世界正文互相打脸
        //   （仙路都断了，哪来的国祚化香火）。⇒ 真终局已决时，朝政这一页到末页为止，只留一笔纪年。
        try {
            if (window.eventFlags && window.eventFlags['qi_ending']) {
                _st.ending = 'qi';
                chron(eraYear() + '，' + rulerWord() + '白日飞升——朝政这一页到此为止。天下另有一本更大的账，业已写完。');
                journal('endgame', '朝政末页', '你飞升那日，' + emp.dynasty + '的朝堂照旧散了架——但这一朝的去处，已经不由你决定：灵气那本账早已合上，末页在别处。');
                log('👑 你飞升了。' + dynasty() + '这一朝的后账在别处结完了——朝政到末页，不再另起一套终局。', 'info');
                _st.pending = null; _st.pendingRebel = null; _st.conquering = null;
                refresh();
                return;
            }
        } catch (eQiEnd) {}
        if (_st.endingPref === 'ascend' && (s.faith || s.earthgod)) {
            _st.ending = 'ascend';
            var c = cd();
            var inc = CFG.ASCEND_INCENSE_BASE + (s.faith ? Math.floor(s.faith.followers / 10) : 0);
            if (c) c.incense = (Number(c.incense) || 0) + inc;
            chron(eraYear() + '，' + rulerWord() + '白日飞升——举国飞升。国祚尽化香火，' + emp.dynasty + '的庙食遍天下。');
            journal('endgame', '举国飞升', '你飞升那日，' + emp.dynasty + '的国运没有散——它随你上了天。凡间为' + emp.city + '的太祖立庙者，又添了 ' + inc + ' 处香火。一国之祚化为一姓之祀，史无前例，后也难有来者。');
            deed('good', '太祖白日飞升，国祚化香火——' + emp.dynasty + '没有亡，它成了一座庙。');
            log('👑 举国飞升！国祚化香火 +' + inc + '（飞升香火账里查收）——' + dynasty() + '的庙食遍天下。', 'success');
        } else if (_st.heir) {
            _st.ending = 'abdicate';
            repUp(emp.city, CFG.ABDICATE_REP);
            chron(eraYear() + '，' + rulerWord() + '飞升在即，禅位于太子' + _st.heir.name + '。新君嗣位，改元维新。');
            journal('endgame', '禅位太子', '你飞升前把玉玺交到了' + _st.heir.name + '手里——禅位诏写得平静：「朕将远行，社稷有托。」新君嗣位，都城城望+' + CFG.ABDICATE_REP + '。' + emp.dynasty + '的史书翻过你这一卷，还有下一卷。');
            deed('good', '太祖飞升前禅位太子' + _st.heir.name + '——' + emp.dynasty + '的江山有了第二代。');
            log('👑 禅位成了：太子' + _st.heir.name + '嗣位（都城城望+' + CFG.ABDICATE_REP + '）——你飞升你的，江山有人接着看。', 'success');
        } else {
            _st.ending = 'collapse';
            chron(eraYear() + '，' + rulerWord() + '飞升，无储无祀——天下鼎沸，' + emp.dynasty + '的旗一面面接二连三地倒。');
            journal('endgame', '天下鼎沸', '你飞升那日，龙椅后面什么都没有：没有太子，没有香火。诸将拥兵、藩王举旗，' + emp.dynasty + '在你离开人间的第三个月碎成了一地。史官在残卷末尾写：太祖以一人开国，亦以一人之去而国灭——神器不可以无托。');
            log('👑 你飞升了，' + dynasty() + '却没接住——无储无祀，天下鼎沸。这一朝的末页，史书写得很重。', 'warning');
        }
        _st.pending = null; _st.pendingRebel = null; _st.conquering = null;
        refresh();
    }

    // ============ v27.13 模块⑫回写①：岁贡结算（属城基金解出→分流） ============
    // 从 dailyTick 月结块里提成一刀：解贡（WorldLedger.levyTribute 正门，真转账）与分流（去哪本账）分两步——
    //   · 玩家称帝（glEmperor 在）且 RewardService 在 → settle({stones}) 玩家钱门入私库：普天之下莫非王土，
    //     属城解的贡解进内帑，不再入朝堂国库（模块⑫「登基了岁贡流向不变」漏洞的正刀，接⑨通道的钱路，不新开路）；
    //   · 无帝（朝政账按律不该在——读档归一化会清坏账；亦兜底测试语境）或 RewardService 缺席 →
    //     保⑨旧路入国库，钱不蒸发。
    // 返回 { total, detail, toPurse, toTreasury } 供月结日志分账念明；测试钩子挂在 DynastyCourt._settleTribute。
    function settleTribute() {
        var out = { total: 0, detail: [], toPurse: 0, toTreasury: 0 };
        if (!_st.vassals.length || !window.WorldLedger || typeof window.WorldLedger.levyTribute !== 'function') return out;
        try {
            for (var tv = 0; tv < _st.vassals.length; tv++) {
                var tvc = _st.vassals[tv].city;
                var tva = Math.floor(((typeof window.WorldLedger.fundPeek === 'function' ? window.WorldLedger.fundPeek(tvc) : 0)) * CFG.TRIBUTE_RATE);
                var tvr = window.WorldLedger.levyTribute(tvc, tva);
                if (tvr && tvr.paid > 0) { out.total += tvr.paid; out.detail.push(tvc + ' ' + tvr.paid); }
            }
        } catch (eTri) { console.warn('[静默失败] js/dynasty-court.js · settleTribute：属城岁贡没解上', eTri && eTri.message); return out; }
        if (out.total <= 0) return out;
        var routed = false;
        if (glEmperor() && window.RewardService && typeof window.RewardService.apply === 'function') {
            try {
                var tr = window.RewardService.apply({ stones: out.total }, { source: '属城岁贡', city: empCity() });
                routed = !!(tr && tr.success !== false);
            } catch (eTri2) { console.warn('[静默失败] js/dynasty-court.js · settleTribute：岁贡解入私库没落成', eTri2 && eTri2.message); }
        }
        if (routed) out.toPurse = out.total;
        else out.toTreasury = out.total;
        return out;
    }

    // ============ 每日/每月自动账（零按钮零追人） ============
    function dailyTick() {
        try {
            var emp = glEmperor();
            if (!emp) return;
            initCourt();
            ensureRoster();   // v27.13：百官班底幂等补授（老档读进来没有班底的，头一个 tick 补上）
            if (_st.ending) return;   // 翻到末页就不再过账
            // 月初户部过账（国库）
            if (monthIdx() > _st.monthSettled) {
                _st.monthSettled = monthIdx();
                // v27.13 岁贡：属城基金月解一成（真转账——城基金扣多少解出多少，不凭空生钱）。
                // 月界对齐全库口径：monthIdx() 跨月恰在绝对日整三十那日（absDay%30===0），与 world-ledger
                // 的 _dayOfMonth()===1 铸币闸同一条轴（两把尺同源 time-system 的 getAbsoluteDay），不会错月。
                // 结算基数用 WorldLedger.fundPeek（只读查口，无账城市报 0——没有基金结余就没有可解的成数，
                // 不为抽成凭空给开办银）；见底按实有折解（levyTribute 正门内夹逼），流水记在 world-ledger 的 fundFlows。
                // v27.13 模块⑫回写①：分流在 settleTribute 内——称帝后走 RewardService 入玩家私库，无帝/缺席保旧路入国库。
                var _trib = settleTribute();
                _st.treasury = clamp(_st.treasury + _trib.toTreasury, 0, 999999);
                if (_trib.toPurse > 0) log('👑 初一，' + _trib.detail.join('、') + '解来岁贡 ' + _trib.toPurse + ' 灵石——普天之下莫非王土，这笔解进内帑（你的私库），不走国库。', 'success');
                var inc = incomeOf(), exp = expenseOf();
                _st.treasury = clamp(_st.treasury + inc - exp, 0, 999999);
                // v27.13：余额亮「账面数」（=实存+未清亏空）——明账要平，贪官挪的那几笔只藏在实存里，账不查永远平的
                log('👑 初一，户部过账：国库 +' + (inc + _trib.toTreasury) + '（都城税 ' + taxIncome() + (_st.taxReliefUntil > absDay() ? '·蠲免中' : '') + ' + 属城岁入 ' + (_st.vassals.length * CFG.VASSAL_INCOME) + (_trib.toTreasury > 0 ? ' + 岁贡 ' + _trib.toTreasury + '（' + _trib.detail.join('、') + '）' : '') + (hasGranary() ? ' + 粮仓 ' + CFG.GRANARY_INCOME : '') + (_st.works.palace ? ' + 宫城加成一成' : '') + '）-' + exp + '（宫室 ' + CFG.UPKEEP + ' + 戍饷 ' + (_st.vassals.length * CFG.VASSAL_ARMY) + '），余额 ' + bookBal() + '。', 'info');
                officialsMonthly();   // v27.13：百官私账月结（俸禄入私账·贪官掷挪库——实存减、明账分文不动）
            }
            // 开国纪年：每满一年自动记一笔
            var ry = reignYear();
            if (ry - 1 > _st.yearCount) {
                _st.yearCount = ry - 1;
                chron(eraYear() + '，国庆。国库余额 ' + _st.treasury + ' 灵石，属城 ' + _st.vassals.length + ' 座' + (_st.heir ? '，太子' + _st.heir.name + '在东宫' : '，储位虚悬') + '。');
            }
            // 长安线：现皇帝的反应（使臣/讨逆军自动按日戳走）
            changanTick();
            // 朝堂风波自动上奏
            maybeTurmoil();
            // v27.13：暗账自发败露——未开查账的世界里亏空是暗账，国库紧时账房炸账自己浮出来
            maybeExposeDeficit();
        } catch (e) { console.warn('[静默失败] js/dynasty-court.js · dailyTick：今日的朝政没过账', e && e.message); }
    }

    // ============ 朝政面板 ============
    function open() {
        var c = cd();
        if (!c) { say('先有角色，再谈朝政。', 'warning'); return false; }
        var g = courtOk();
        if (!g.ok) { say('👑 ' + g.why, 'warning'); return false; }
        var emp = g.emp;
        var btn = 'class="w-full p-3 rounded mb-2 text-left text-sm text-white hover:opacity-90"';
        var cs = consort();
        var html = '<p class="text-sm text-yellow-300 mb-1">' + esc(emp.dynasty) + ' · 定都' + esc(emp.city) + ' · ' + eraYear() + (cs ? ' · 中宫：' + (cs.title === '后' ? '皇后' : '皇夫') + esc(cs.name) : '') + (_st.ending ? ' · 【终局：' + endingName(_st.ending) + '】' : '') + '</p>';
        // 国库明账
        html += '<p class="text-xs font-bold text-amber-300 mb-1 mt-2">💰 国库（与你的私财两本账）</p>';
        // v27.13：面板余额亮「账面数」（=实存+未清亏空）——与月初过账的明账同一个口径，账不查永远平的
        html += '<p class="text-xs text-gray-300 mb-1 p-2 bg-gray-800/60 rounded">余额 <b class="text-amber-200">' + bookBal() + '</b> 灵石 · 月初自动过账——' +
            '进：都城税 ' + taxIncome() + '（城望/10' + (_st.taxReliefUntil > absDay() ? '，蠲免中至第 ' + _st.taxReliefUntil + ' 日' : '') + '）+ 属城岁入 ' + (_st.vassals.length * CFG.VASSAL_INCOME) + (hasGranary() ? ' + 粮仓 ' + CFG.GRANARY_INCOME : '') + (_st.works.palace ? ' + 宫城加成一成' : '') +
            '；出：宫室 ' + CFG.UPKEEP + ' + 戍饷 ' + (_st.vassals.length * CFG.VASSAL_ARMY) + '。</p>';
        // 待裁奏折
        if (_st.pendingRebel) {
            html += '<p class="text-xs font-bold text-red-300 mb-1 mt-2">🔥 藩王叛乱（' + esc(_st.pendingRebel.city) + '）——真仗进行中</p>';
            html += '<button onclick="DynastyCourt.resumeRebel()" ' + btn.replace('p-3', 'bg-red-800 p-3') + '>⚔️ 接着平叛（' + esc(_st.pendingRebel.city) + '城下）</button>';
        } else if (_st.pending) {
            var pid = _st.pending.id;
            html += '<p class="text-xs font-bold text-red-300 mb-1 mt-2">📜 朝堂有大事待裁</p>';
            if (pid === 'heir') {
                html += '<p class="text-xs text-gray-300 mb-1 p-2 bg-gray-800/60 rounded">礼部率百官伏阙：请早立太子，以安国本。</p>';
                var ch = childHeirs(), dh = discipleHeirs();
                html += '<button onclick="DynastyCourt.resolveTurmoil(\'heir\',\'child\')" ' + btn.replace('p-3', (ch.length ? 'bg-yellow-700' : 'bg-gray-700') + ' p-3') + '>👶 立亲子' + (ch.length ? '「' + esc(ch[0].name) + '」为太子（城望+3）' : ' · ⛔ 膝下无子') + '</button>';
                html += '<button onclick="DynastyCourt.resolveTurmoil(\'heir\',\'disciple\')" ' + btn.replace('p-3', (dh.length ? 'bg-yellow-700' : 'bg-gray-700') + ' p-3') + '>🎓 立亲传弟子' + (dh.length ? '「' + esc(dh[0].name) + '」为太子（城望+3）' : ' · ⛔ 门下无徒') + '</button>';
                html += '<button onclick="DynastyCourt.resolveTurmoil(\'heir\',\'none\')" ' + btn.replace('p-3', 'bg-gray-700 p-3') + '>🙅 留中不发（心境-5 恶名+1——百官记着这一笔）</button>';
            } else if (pid === 'famine') {
                html += '<p class="text-xs text-gray-300 mb-1 p-2 bg-gray-800/60 rounded">户部奏：今岁大灾，州县告饥。三策明账：</p>';
                html += '<button onclick="DynastyCourt.resolveTurmoil(\'famine\',\'remit\')" ' + btn.replace('p-3', 'bg-emerald-800 p-3') + '>📜 蠲免赋税（' + CFG.REMIT_DAYS + ' 日都城税入停 · 城望+' + CFG.REMIT_REP + ' 因果+' + CFG.REMIT_KARMA + '）</button>';
                html += '<button onclick="DynastyCourt.resolveTurmoil(\'famine\',\'relief\')" ' + btn.replace('p-3', ((hasGranary() || _st.treasury >= CFG.RELIEF_COST) ? 'bg-emerald-800' : 'bg-gray-700') + ' p-3') + '>🌾 开仓赈济（' + (hasGranary() ? '常平仓放粮，免费' : '国库 -' + CFG.RELIEF_COST) + ' · 城望+' + CFG.RELIEF_REP + ' 因果+' + CFG.RELIEF_KARMA + '）</button>';
                html += '<button onclick="DynastyCourt.resolveTurmoil(\'famine\',\'ignore\')" ' + btn.replace('p-3', 'bg-gray-700 p-3') + '>🙈 置之不理（城望-' + CFG.IGNORE_REP + ' 因果-' + CFG.IGNORE_KARMA + ' 恶名+' + CFG.IGNORE_NOTO + '——史书会记）</button>';
            } else if (pid === 'historian') {
                html += '<p class="text-xs text-gray-300 mb-1 p-2 bg-gray-800/60 rounded">史官捧实录直笔入殿——上面记着你的业障。烧，还是不烧？</p>';
                html += '<button onclick="DynastyCourt.resolveTurmoil(\'historian\',\'burn\')" ' + btn.replace('p-3', 'bg-red-900 p-3') + '>🔥 焚毁实录（因果-' + CFG.BURN_KARMA + ' 恶名+' + CFG.BURN_NOTO + ' 心境-' + CFG.BURN_MOOD + '）</button>';
                html += '<button onclick="DynastyCourt.resolveTurmoil(\'historian\',\'allow\')" ' + btn.replace('p-3', 'bg-emerald-800 p-3') + '>🖋️ 容他直笔（因果+' + CFG.ALLOW_KARMA + ' 心境+' + CFG.ALLOW_MOOD + '——本朝有史德）</button>';
            } else if (pid === 'rebel') {
                var rct = rebelCity();
                html += '<p class="text-xs text-gray-300 mb-1 p-2 bg-gray-800/60 rounded">八百里加急：' + esc(rct) + '藩王反了！两条路：</p>';
                html += '<button onclick="DynastyCourt.resolveTurmoil(\'rebel\',\'crush\')" ' + btn.replace('p-3', 'bg-red-800 p-3') + '>⚔️ 御驾亲征（真仗——胜：属城保住+抄没叛产 ' + CFG.REBEL_WIN_TREASURY + '；败：属城自立、都城城望-' + CFG.REBEL_LOSE_REP + '）</button>';
                html += '<button onclick="DynastyCourt.resolveTurmoil(\'rebel\',\'appease\')" ' + btn.replace('p-3', (_st.treasury >= CFG.APPEASE_COST ? 'bg-stone-700' : 'bg-gray-700') + ' p-3') + '>💰 发抚银招安（国库 -' + CFG.APPEASE_COST + (_st.treasury >= CFG.APPEASE_COST ? '' : ' · ⛔ 国库不够') + ' · ' + esc(rct) + '城望-' + CFG.APPEASE_REP + '——不流血但藩王看轻朝廷）</button>';
            }
        }
        // v27.8 长安 · 朝廷（现皇帝的反应）
        var ca = _st.changan;
        html += '<p class="text-xs font-bold text-red-300 mb-1 mt-2">🏮 长安 · 朝廷</p>';
        if (ca.phase === 'edict') {
            html += '<p class="text-xs text-gray-300 mb-1 p-2 bg-red-900/30 rounded">长安天子下讨逆诏：削号归藩，否则天兵问罪。使臣在殿上候着回话——回话之前，征伐、号召、朝堂风波全压着。</p>';
            html += '<button onclick="DynastyCourt.resolveEdict(\'submit\')" ' + btn.replace('p-3', 'bg-stone-700 p-3') + '>🧎 奉表称藩（心境-5 忍辱 · 因果+2 · 都城城望+3 息兵安民——缓兵不是免战牌：再并两城，讨逆军必发）</button>';
            html += '<button onclick="DynastyCourt.resolveEdict(\'defy\')" ' + btn.replace('p-3', 'bg-red-800 p-3') + '>⛓️ 扣使拒诏（名望+3 硬气 · 恶名+2 僭逆坐实——讨逆军 ' + CFG.DEFY_PUNITIVE + ' 日后兵临城下）</button>';
        } else if (ca.phase === 'war') {
            html += '<p class="text-xs text-gray-300 mb-1 p-2 bg-red-900/30 rounded">🔥 朝廷讨逆军兵临城下——旌旗蔽野，声言「奉天讨逆」。这一仗躲不掉。</p>';
            html += '<button onclick="DynastyCourt.startPunitive()" ' + btn.replace('p-3', 'bg-red-800 p-3') + '>⚔️ 御敌（真仗——胜：名望+' + CFG.PUNITIVE_WIN_FAME + ' 都城城望+' + CFG.PUNITIVE_WIN_REP + ' 抄没犒军绢帛 ' + CFG.PUNITIVE_BOUNTY + ' 入国库，长安不敢东顾；败：赔款 ' + (hasWall() ? Math.floor(CFG.PUNITIVE_LOSS / 2) + '（城墙减半）' : CFG.PUNITIVE_LOSS) + ' 都城城望-' + CFG.PUNITIVE_LOSE_REP + '，' + CFG.PUNITIVE_AGAIN + ' 日后再来）</button>';
        } else if (ca.phase === 'submit') {
            html += '<p class="text-xs text-gray-400 mb-1 p-2 bg-gray-800/60 rounded">🧎 你奉表长安，受「守土侯」号——察访使盯着：' + ca.anger + '/2，每并一城记一笔，两笔记满讨逆军 ' + CFG.SUBMIT_GRACE + ' 日内开拔。' + (ca.warDue ? '（已震怒：讨逆军第 ' + ca.warDue + ' 日到）' : '奉表是缓兵，不是免战牌。') + '</p>';
        } else if (ca.phase === 'defy') {
            html += '<p class="text-xs text-gray-400 mb-1 p-2 bg-gray-800/60 rounded">⛓️ 你扣了长安的使、掷还了诏——长安大震怒' + (ca.warDue ? '：讨逆军第 ' + ca.warDue + ' 日兵临城下（修城墙，败了赔款减半）' : '') + '。</p>';
        } else if (ca.phase === 'beaten') {
            html += '<p class="text-xs text-emerald-300/90 mb-1 p-2 bg-emerald-900/20 rounded">✅ 城下破了讨逆军（第 ' + ca.beatenDay + ' 日）——长安不敢东顾，东土的事朝廷不再问。征伐号召再无任何掣肘。</p>';
        } else {
            html += '<p class="text-xs text-gray-500 mb-1 p-2 bg-gray-800/40 rounded">长安的天子还没搭理你——开国第 ' + CFG.EDICT_DUE + ' 日，讨逆的使臣会到阙（到了自然有回话的决断）。</p>';
        }
        // 立储
        html += '<p class="text-xs font-bold text-yellow-300 mb-1 mt-2">👑 东宫</p>';
        if (_st.heir) {
            html += '<p class="text-xs text-emerald-300/90 mb-1 p-2 bg-emerald-900/20 rounded">✅ 太子' + esc(_st.heir.name) + '（' + (_st.heir.kind === 'child' ? '亲子' : '亲传弟子') + ' · 第 ' + _st.heir.day + ' 日立储）——禅位的路开着。</p>';
        } else {
            var hg = heirOk();
            html += '<p class="text-xs text-gray-400 mb-1 p-2 bg-gray-800/60 rounded">' + (hg.ok ? '储位虚悬——不必等百官伏阙，随时可立：' : '🔒 ' + hg.why) + '</p>';
            var ch2 = childHeirs(), dh2 = discipleHeirs();
            if (hg.ok) {
                html += '<button onclick="DynastyCourt.designateHeir(\'child\')" ' + btn.replace('p-3', (ch2.length ? 'bg-yellow-700' : 'bg-gray-700') + ' p-3') + '>👶 立亲子' + (ch2.length ? '「' + esc(ch2[0].name) + '」（城望+' + CFG.HEIR_REP + '）' : ' · ⛔ 膝下无子') + '</button>';
                html += '<button onclick="DynastyCourt.designateHeir(\'disciple\')" ' + btn.replace('p-3', (dh2.length ? 'bg-yellow-700' : 'bg-gray-700') + ' p-3') + '>🎓 立亲传弟子' + (dh2.length ? '「' + esc(dh2[0].name) + '」（城望+' + CFG.HEIR_REP + '）' : ' · ⛔ 门下无徒') + '</button>';
            }
        }
        // 属城与征伐
        if (!_st.ending) {
            // v27.13：御史台·百官私账——官员个人账的朝堂正门（俸禄/赏赐/查账/亏空风波都从这扇门进出）
            ensureRoster();
            var offList = rosterSorted();
            html += '<p class="text-xs font-bold text-teal-300 mb-1 mt-2">⚖️ 御史台 · 百官私账（' + offList.length + ' 员）</p>';
            html += '<p class="text-xs text-gray-400 mb-1 p-2 bg-gray-800/60 rounded">百官各有私账，私囊深浅不示人：月俸自宫室常支里分（明账不动）；赏赐从国库出、两头记账；贪念重的月初会伸手挪库——账面与实存之差就是亏空，账不查永远平的。国库紧了，捂不住的亏空自己会炸出来。</p>';
            if (_st.court.case) {
                var cp2 = rosterFind(_st.court.case.id);
                var cl2 = cp2 ? (_off.officials[cp2.id] || null) : null;
                if (cp2 && cl2) {
                    var cst = Math.max(0, Number(cl2.stolen) || 0);
                    html += '<p class="text-xs text-red-300 mb-1 p-2 bg-red-900/30 rounded">📜 未决亏空案：' + esc(cp2.name) + '（' + esc(cp2.title) + '·' + esc(cp2.faction) + '）' + (_st.court.case.auto ? '——库吏炸账败露' : '——御史台查实') + '，名下赃 ' + cst + ' 灵石。三条路：</p>';
                    html += '<button onclick="DynastyCourt.resolveCase(\'recover\')" ' + btn.replace('p-3', 'bg-emerald-800 p-3') + '>💰 追赃入库（私囊退赃入国库 · 戴罪留用 · 同党反咬风险 ' + Math.round(CFG.BITE_P_RECOVER * 100) + '%）</button>';
                    html += '<button onclick="DynastyCourt.resolveCase(\'dismiss\')" ' + btn.replace('p-3', 'bg-red-900 p-3') + '>⛓️ 罢官抄家（私产尽数没入国库 · 追不回的赃挂死账 · 反咬更凶 ' + Math.round(CFG.BITE_P_DISMISS * 100) + '% · 补授新人）</button>';
                    html += '<button onclick="DynastyCourt.resolveCase(\'pardon\')" ' + btn.replace('p-3', 'bg-gray-700 p-3') + '>🙅 高抬贵手（赃款照旧 · 胆子更肥 · 亏空继续滚）</button>';
                } else {
                    _st.court.case = null;   // 案犯不在其位——坏账当面清
                }
            }
            if (!_st.court.case) {
                var ag2 = auditOk();
                html += '<button onclick="DynastyCourt.auditBooks()" ' + btn.replace('p-3', (ag2.ok ? 'bg-teal-800' : 'bg-gray-700') + ' p-3') + '>🔍 御史查账（九十日一回 · 亏空越大越好查 · 查不出亏空继续滚' + (ag2.ok ? '' : ' · ⛔ ' + ag2.why) + '）</button>';
            }
            html += '<div class="space-y-1 mb-1">';
            for (var fi = 0; fi < offList.length; fi++) {
                var fp = offList[fi];
                var fl = _off.officials[fp.id] || offSeed(fp);
                var fLast = Number(_st.court.gifts[fp.id]) || 0;
                var fCd = fLast && absDay() - fLast < CFG.OFF_GIFT_GAP;
                var fq = String(fp.id).replace(/[^A-Za-z0-9#]/g, '');
                html += '<p class="text-[11px] text-gray-400 p-1 bg-gray-800/40 rounded">' + (_st.court.case && _st.court.case.id === fp.id ? '⚖️ ' : '') + esc(fp.name) + '（' + esc(fp.title) + '·' + esc(fp.faction) + '）· 月俸 ' + (CFG.OFF_SALARY[fp.tier] || 4) + ' · 私账：不示人 <button onclick="DynastyCourt.giftOfficial(\'' + fq + '\')" class="text-yellow-300 hover:text-yellow-200 text-[11px] underline">赏赐（国库 -' + CFG.OFF_GIFT_COST + ' → 私账' + (fCd ? ' · ' + (CFG.OFF_GIFT_GAP - (absDay() - fLast)) + ' 日后可再赏' : '') + (!fCd && _st.treasury < CFG.OFF_GIFT_COST ? ' · ⛔ 国库不够' : '') + '）</button></p>';
            }
            html += '</div>';
            html += '<p class="text-xs font-bold text-orange-300 mb-1 mt-2">⚔️ 属城与征伐（' + _st.vassals.length + '/' + CFG.VASSAL_MAX + '）</p>';
            if (_st.vassals.length) {
                html += '<p class="text-xs text-gray-300 mb-1 p-2 bg-gray-800/60 rounded">' + _st.vassals.map(function (v) { return '🏴 ' + esc(v.city) + '（第 ' + v.day + ' 日内附）'; }).join(' · ') + '</p>';
                // v27.13 恩赏决策档：国库拨属城修桥铺路（朝堂的钱落到城里——每城一钮，额度夹逼+冷却，照现有按钮结构不另开面板）
                for (var gi = 0; gi < _st.vassals.length; gi++) {
                    var gvc = _st.vassals[gi].city;
                    var gg = grantWorkOk(gvc);
                    var gq = esc(gvc).replace(/'/g, '');
                    html += '<button onclick="DynastyCourt.grantPublicWork(\'' + gq + '\')" ' + btn.replace('p-3', (gg.ok ? 'bg-teal-800' : 'bg-gray-700') + ' p-3') + '>🏛️ 恩赏·' + esc(gvc) + '修桥铺路（国库 -' + CFG.GRANT_WORK_COST + ' → 该城基金 · 城望+' + CFG.GRANT_WORK_REP + ' · ' + CFG.GRANT_WORK_GAP + ' 日一回' + (gg.ok ? '' : ' · ⛔ ' + gg.why) + '）</button>';
                }
            }
            if (_st.conquering) {
                html += '<button onclick="DynastyCourt.resumeConquest()" ' + btn.replace('p-3', 'bg-red-800 p-3') + '>⚔️ 征' + esc(_st.conquering.city) + '进行中——城下接着打</button>';
            } else if (_st.vassals.length < CFG.VASSAL_MAX) {
                var cands = allCities().filter(function (n) { return pkCity(n) !== pkCity(emp.city) && !isVassal(n) && isMundane(n) && !isImperialCapital(n); });
                var cfail = _st.conquestFailDay && absDay() - _st.conquestFailDay < CFG.CONQ_FAIL_GAP;
                for (var ci = 0; ci < cands.length && ci < 15; ci++) {
                    var cg = conquestOk(cands[ci]);
                    var sg = summonOk(cands[ci]);
                    var cq = esc(cands[ci]).replace(/'/g, '');
                    var pt = cityPatron(cands[ci]);
                    html += '<button onclick="DynastyCourt.startConquest(\'' + cq + '\')" ' + btn.replace('p-3', (cg.ok ? 'bg-orange-800' : 'bg-gray-700') + ' p-3') + '>🏴 征' + esc(cands[ci]) + '（军资 ' + CFG.CONQ_COST + ' 国库先付 · 真仗一场 · 胜则岁入+' + CFG.VASSAL_INCOME + '/月' + (pt ? ' · 城头挂「' + esc(pt) + '」的香幡——仙凡分治，打下城香火照旧归它' : '') + (cfail ? ' · ⛔ 新败之余，' + (CFG.CONQ_FAIL_GAP - (absDay() - _st.conquestFailDay)) + ' 日后再兴兵' : (_st.treasury < CFG.CONQ_COST ? ' · ⛔ 国库不够军资' : '')) + '）</button>';
                    html += '<button onclick="DynastyCourt.summonCity(\'' + cq + '\')" ' + btn.replace('p-3', (sg.ok ? 'bg-emerald-800' : 'bg-gray-700') + ' p-3') + '>📜 号召' + esc(cands[ci]) + '归附（不动刀兵：号召力 ' + summonPower() + ' vs 民心 ' + summonNeed(cands[ci]) + '，够就献籍 · 礼单 ' + CFG.SUMMON_COST + ' 国库先付婉拒不退' + (sg.ok ? (sg.patron ? ' · 自家门派的幡，民心减半' : '') : ' · ⛔ ' + sg.why) + '）</button>';
                }
            }
            // 大工程
            html += '<p class="text-xs font-bold text-sky-300 mb-1 mt-2">🏗️ 大工程（各一生一回，全花国库）</p>';
            var WORKS = [['palace', '🏯 筑宫城', CFG.WORK_PALACE, '名望+' + CFG.PALACE_FAME + ' · 国库月入+一成'], ['wall', '🧱 修城墙', CFG.WORK_WALL, '都城城望+' + CFG.WALL_REP + ' · 往后战败国库损失减半'], ['granary', '🌾 开粮仓', CFG.WORK_GRANARY, '国库月入+' + CFG.GRANARY_INCOME + ' · 灾年赈济免费']];
            for (var wi = 0; wi < WORKS.length; wi++) {
                var wk = WORKS[wi];
                if (_st.works[wk[0]]) { html += '<p class="text-xs text-emerald-300/90 mb-1 p-2 bg-emerald-900/20 rounded">✅ ' + wk[1] + '已落成（第 ' + _st.works[wk[0]] + ' 日）</p>'; continue; }
                var wg = workOk(wk[0]);
                html += '<button onclick="DynastyCourt.buildWork(\'' + wk[0] + '\')" ' + btn.replace('p-3', (wg.ok ? 'bg-sky-800' : 'bg-gray-700') + ' p-3') + '>' + wk[1] + '（国库 ' + wk[2] + ' · ' + wk[3] + (wg.ok ? '' : ' · ⛔ ' + wg.why) + '）</button>';
            }
            // 终局
            html += '<p class="text-xs font-bold text-purple-300 mb-1 mt-2">🌌 终局（飞升那日走哪条路）</p>';
            var ag = endingOk('ascend'), bg2 = endingOk('abdicate');
            html += '<button onclick="DynastyCourt.setEndingPref(\'ascend\')" ' + btn.replace('p-3', (ag.ok ? 'bg-purple-800' : 'bg-gray-700') + ' p-3') + '>🕯️ 举国飞升（须香火线：传教/土地公 · 国祚化香火 +' + (CFG.ASCEND_INCENSE_BASE + (glState().faith ? Math.floor(glState().faith.followers / 10) : 0)) + (_st.endingPref === 'ascend' ? ' · ✅ 已定' : '') + (ag.ok ? '' : ' · ⛔ ' + ag.why) + '）</button>';
            html += '<button onclick="DynastyCourt.setEndingPref(\'abdicate\')" ' + btn.replace('p-3', (bg2.ok ? 'bg-purple-800' : 'bg-gray-700') + ' p-3') + '>📜 禅位太子（须先立储 · 都城城望+' + CFG.ABDICATE_REP + (_st.endingPref === 'abdicate' ? ' · ✅ 已定' : '') + (bg2.ok ? '' : ' · ⛔ ' + bg2.why) + '）</button>';
            html += '<p class="text-[11px] text-gray-500 mb-1">两样都没有就走「天下鼎沸」——不是不能选，是不选的后果。飞升钩子自动结算，零按钮。</p>';
        }
        // 编年史。外层 showModal 已经是按 85vh 定高、自己滚的那一条（UI-12 定案：内层滚窗一律撤平，
        // 谁都不许再在一条视口滚窗里套一条像素写死的小滚窗）。本段原先偏有一处 160px 的内滚窗，
        // 等于大窗里再套小窗——屏越大越憋屈。编年史本就只有 12 笔上限（下方 for 的 hi >= length - 12），
        // 高度天然有界，更没有自己开窗的理由。高度交给外层那条随屏放的滚窗。
        html += '<p class="text-xs font-bold text-gray-300 mb-1 mt-2">📖 编年史（本朝 ' + _st.chronicle.length + ' 笔）</p><div class="space-y-1">';
        for (var hi = _st.chronicle.length - 1; hi >= 0 && hi >= _st.chronicle.length - 12; hi--) {
            html += '<p class="text-[11px] text-gray-400 p-1 bg-gray-800/40 rounded">第 ' + _st.chronicle[hi].day + ' 日 · ' + esc(_st.chronicle[hi].text) + '</p>';
        }
        html += '</div>';
        html += '<p class="text-[11px] text-gray-500 mt-1">朝政账——国库月初自动过账、纪年自动记、风波自动上奏，全不用你惦记；国策只在真正的大节点上做决断。</p>';
        html += '<button onclick="window.openGrandLegacy()" class="w-full mt-2 p-2 rounded text-xs text-gray-400 hover:text-gray-300">↩️ 回大业名册</button>';
        if (typeof window.showModal === 'function') { window.showModal('👑 ' + emp.dynasty + '朝政', html); return true; }
        say('👑 ' + emp.dynasty + '朝政（弹窗没开起来）：国库 ' + bookBal() + ' · 属城 ' + _st.vassals.length + ' · 太子' + (_st.heir ? _st.heir.name : '未立') + ' · 终局' + (_st.ending ? endingName(_st.ending) : (_st.endingPref ? '预' + endingName(_st.endingPref) : '未定')));
        return true;
    }

    // ============ 存读档（StateRegistry 正门，零新 localStorage 键） ============
    function _export() { return JSON.parse(JSON.stringify(_st)); }
    function _import(s) {
        _reset();
        if (!s || typeof s !== 'object') return;
        var emp = glEmperor();
        if (!emp) return;   // 没皇帝的朝政账整本是坏账——不进门
        var fin = function (v, lo, hi) { var n = Number(v); return Number.isFinite(n) ? clamp(Math.floor(n), lo, hi) : null; };
        _st.foundDay = fin(s.foundDay, 0, 1e9);
        if (_st.foundDay === null) _st.foundDay = Number(emp.day) || 0;
        _st.treasury = fin(s.treasury, 0, 999999) || 0;
        _st.monthSettled = fin(s.monthSettled, -99999, 99999);
        if (_st.monthSettled === null) _st.monthSettled = monthIdx();
        if (_st.monthSettled > monthIdx()) _st.monthSettled = monthIdx();   // 未来的月戳夹回本月
        _st.yearCount = fin(s.yearCount, 0, 200) || 0;
        // 属城：只认舆图上有的城、去重、剔除都城、上限 3
        var cities = allCities();
        var seen = {};
        if (Array.isArray(s.vassals)) {
            for (var vi = 0; vi < s.vassals.length && _st.vassals.length < CFG.VASSAL_MAX; vi++) {
                var vv = s.vassals[vi];
                if (!vv || typeof vv.city !== 'string' || !vv.city) continue;
                var cn = String(vv.city).slice(0, 30);
                if (pkCity(cn) === pkCity(emp.city) || seen[pkCity(cn)]) continue;
                if (cities.length && cities.indexOf(cn) < 0) continue;
                if (isImperialCapital(cn) || !isMundane(cn)) continue;   // 帝都与仙门不入属城账（旧档坏账也在这道门清掉）
                seen[pkCity(cn)] = true;
                _st.vassals.push({ city: cn, day: fin(vv.day, 0, 1e9) || 0 });
            }
        }
        _st.conquestFailDay = fin(s.conquestFailDay, 0, 1e9) || 0;
        // 太子
        _st.heir = (s.heir && typeof s.heir === 'object' && (s.heir.kind === 'child' || s.heir.kind === 'disciple') && typeof s.heir.name === 'string' && s.heir.name)
            ? { kind: s.heir.kind, name: String(s.heir.name).slice(0, 12), day: fin(s.heir.day, 0, 1e9) || 0 } : null;
        // 工程
        var wks = ['palace', 'wall', 'granary'];
        if (s.works && typeof s.works === 'object') {
            for (var wi = 0; wi < wks.length; wi++) {
                var wd = fin(s.works[wks[wi]], 0, 1e9);
                if (wd !== null) _st.works[wks[wi]] = wd;
            }
        }
        // 风波账
        if (s.turmoilDone && typeof s.turmoilDone === 'object') {
            for (var ti = 0; ti < TURMOIL_IDS.length; ti++) {
                var td = s.turmoilDone[TURMOIL_IDS[ti]];
                if (td && typeof td === 'object') _st.turmoilDone[TURMOIL_IDS[ti]] = { day: fin(td.day, 0, 1e9) || 0, choice: String(td.choice || '').slice(0, 20) };
            }
        }
        _st.lastTurmoilDay = fin(s.lastTurmoilDay, 0, 1e9) || 0;
        _st.taxReliefUntil = fin(s.taxReliefUntil, 0, absDay() + 3600) || 0;
        // 终局
        // 'qi' = 真终局（灵气之尽）已决，朝政只留末页一笔（见 onAscend 开头）——必须列进白名单，
        //   否则读档会把这一笔洗掉，dailyTick 的「翻到末页就不再过账」随之失效，朝政会重新开始过账。
        _st.ending = (['ascend', 'abdicate', 'collapse', 'qi'].indexOf(s.ending) >= 0) ? s.ending : null;
        _st.endingPref = (['ascend', 'abdicate'].indexOf(s.endingPref) >= 0 && !_st.ending) ? s.endingPref : '';
        // 编年史
        if (Array.isArray(s.chronicle)) {
            for (var ci = 0; ci < s.chronicle.length && _st.chronicle.length < CFG.CHRON_MAX; ci++) {
                var cc = s.chronicle[ci];
                if (cc && typeof cc.text === 'string' && cc.text) _st.chronicle.push({ day: fin(cc.day, 0, 1e9) || 0, text: String(cc.text).slice(0, 200) });
            }
        }
        if (_st.ending) return;   // 翻到末页：进行中的仗与奏折全清
        // v27.8 长安线：相位白名单，日戳/怒气夹范围
        var caIn = (s.changan && typeof s.changan === 'object') ? s.changan : {};
        var caPh = ['', 'edict', 'submit', 'defy', 'war', 'beaten'].indexOf(caIn.phase) >= 0 ? caIn.phase : '';
        _st.changan = {
            phase: caPh,
            edictDay: fin(caIn.edictDay, 0, 1e9) || 0,
            warDue: (caPh === 'submit' || caPh === 'defy') ? (fin(caIn.warDue, 0, 1e9) || 0) : 0,
            anger: fin(caIn.anger, 0, 9) || 0,
            beatenDay: caPh === 'beaten' ? (fin(caIn.beatenDay, 0, 1e9) || 0) : 0,
            beatenSeen: fin(caIn.beatenSeen, 0, 1e9) || 0,
            hostileSeen: fin(caIn.hostileSeen, 0, 1e9) || 0
        };
        // v27.8 号召账：只认舆图上的凡俗城，snubs 夹 0..10
        if (s.summons && typeof s.summons === 'object') {
            for (var sk in s.summons) {
                var sv = s.summons[sk];
                if (!sv || typeof sv !== 'object') continue;
                var skn = pkCity(sk);
                if (!skn || cities.indexOf(skn) < 0 || !isMundane(skn) || isImperialCapital(skn)) continue;
                _st.summons[skn] = { day: fin(sv.day, 0, 1e9) || 0, snubs: fin(sv.snubs, 0, 10) || 0 };
            }
        }
        // v27.13 恩赏账：city -> 末回恩赏日（冷却戳，老档缺键自动空）——只认现行属城，日戳夹 0..1e9
        if (s.grants && typeof s.grants === 'object') {
            for (var gk in s.grants) {
                var gd = fin(s.grants[gk], 0, 1e9);
                if (gd !== null && isVassal(gk)) _st.grants[pkCity(gk)] = gd;
            }
        }
        // v27.13 百官班底与御史台账（加字段不升版——老档缺 court=开衙补授）：官阶/派系按槽位重建，不信存档；
        // gen 槽位代数只增不减（防读档回退重名），case 只认在任官员，rotten 夹 0..1e7
        var cIn = (s.court && typeof s.court === 'object') ? s.court : {};
        _st.court = { roster: [], case: null, auditDay: 0, lastCaseDay: 0, gifts: {}, gen: {}, rotten: 0 };
        _st.court.auditDay = fin(cIn.auditDay, 0, 1e9) || 0;
        _st.court.lastCaseDay = fin(cIn.lastCaseDay, 0, 1e9) || 0;
        _st.court.rotten = fin(cIn.rotten, 0, 1e7) || 0;
        if (cIn.gen && typeof cIn.gen === 'object') {
            for (var gk2 in cIn.gen) {
                var gv2 = fin(cIn.gen[gk2], 1, 999);
                if (gv2 !== null && /^co\d+$/.test(gk2)) _st.court.gen[gk2] = gv2;
            }
        }
        if (cIn.gifts && typeof cIn.gifts === 'object') {
            for (var fk2 in cIn.gifts) {
                var fv2 = fin(cIn.gifts[fk2], 0, 1e9);
                if (fv2 !== null && /^co\d+(#\d+)?$/.test(fk2)) _st.court.gifts[fk2] = fv2;
            }
        }
        if (Array.isArray(cIn.roster)) {
            for (var oi2 = 0; oi2 < cIn.roster.length; oi2++) {
                var oo2 = cIn.roster[oi2];
                if (!oo2 || typeof oo2.id !== 'string' || !/^co\d+(#\d+)?$/.test(oo2.id) || !oo2.name || typeof oo2.name !== 'string') continue;
                var slotM2 = /^co\d+/.exec(oo2.id);
                var spec2 = slotSpec(slotM2 ? slotM2[0] : '');
                if (!spec2) continue;
                var gen2 = fin(oo2.gen, 1, 999) || 1;
                _st.court.roster.push({ id: oo2.id, slot: spec2.slot, name: String(oo2.name).slice(0, 12), title: spec2.title, tier: spec2.tier, faction: spec2.faction, day: fin(oo2.day, 0, 1e9) || 0, gen: gen2 });
                if ((Number(_st.court.gen[spec2.slot]) || 0) < gen2) _st.court.gen[spec2.slot] = gen2;
            }
        }
        if (cIn.case && typeof cIn.case === 'object' && typeof cIn.case.id === 'string' && /^co\d+(#\d+)?$/.test(cIn.case.id)) {
            var hasCase2 = false;
            for (var ci2 = 0; ci2 < _st.court.roster.length; ci2++) if (_st.court.roster[ci2].id === cIn.case.id) { hasCase2 = true; break; }
            if (hasCase2) _st.court.case = { id: cIn.case.id, day: fin(cIn.case.day, 0, 1e9) || 0, auto: !!cIn.case.auto };
        }
        // 进行中的仗/奏折（坏账清）
        _st.pending = (s.pending && typeof s.pending === 'object' && TURMOIL_IDS.indexOf(s.pending.id) >= 0 && !_st.turmoilDone[s.pending.id] && turmoilCond(s.pending.id))
            ? { id: s.pending.id, day: fin(s.pending.day, 0, 1e9) || 0 } : null;
        if (s.pendingRebel && typeof s.pendingRebel.city === 'string' && isVassal(s.pendingRebel.city)) _st.pendingRebel = { city: String(s.pendingRebel.city).slice(0, 30) };
        if (!_st.pendingRebel && s.conquering && typeof s.conquering.city === 'string' && s.conquering.city &&
            pkCity(s.conquering.city) !== pkCity(emp.city) && !isVassal(s.conquering.city) && (cities.length === 0 || cities.indexOf(String(s.conquering.city).slice(0, 30)) >= 0)) {
            _st.conquering = { city: String(s.conquering.city).slice(0, 30), day: fin(s.conquering.day, 0, 1e9) || 0 };
        }
    }
    function _reset() {
        _st = {
            foundDay: 0, treasury: 0, monthSettled: -1, yearCount: 0,
            vassals: [], conquering: null, conquestFailDay: 0,
            heir: null, works: {}, turmoilDone: {}, pending: null, pendingRebel: null,
            lastTurmoilDay: 0, taxReliefUntil: 0,
            changan: { phase: '', edictDay: 0, warDue: 0, anger: 0, beatenDay: 0, beatenSeen: 0, hostileSeen: 0 },
            summons: {},
            grants: {},   // v27.13 恩赏冷却账（与号召账同款白名单清洗）
            court: { roster: [], case: null, auditDay: 0, lastCaseDay: 0, gifts: {}, gen: {}, rotten: 0 },   // v27.13：百官班底与御史台账（同款白名单清洗）
            ending: null, endingPref: '', chronicle: []
        };
    }
    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        window.StateRegistry.register('dynastyCourt', { version: 1, export: _export, import: _import, reset: _reset });
    }
    // v27.13：官员私账注册——StateRegistry 新键 dynastyCourtOfficials（加键不升版：旧档快照没有这个键，
    // importAll 的 hasOwnProperty 直接跳过=官员无私账照旧；首次记账时按班底重播种）
    function _offExport() { return { officials: JSON.parse(JSON.stringify(_off.officials)) }; }
    function _offImport(s) {
        _off.officials = {};
        if (!s || typeof s !== 'object' || !s.officials || typeof s.officials !== 'object') return;
        var fin2 = function (v, lo, hi) { var n = Number(v); return Number.isFinite(n) ? clamp(Math.floor(n), lo, hi) : null; };
        for (var k in s.officials) {
            var o = s.officials[k];
            if (!o || typeof o !== 'object' || !/^co\d+(#\d+)?$/.test(k)) continue;
            if (OFF_FACTIONS.indexOf(o.factionTag) < 0) continue;   // 派系名不在现有势力表——坏账不进门（首次记账重播种）
            var purse2 = fin2(o.purse, 0, 1e6);
            var stolen2 = fin2(o.stolen, 0, 1e6);
            var greed2 = fin2(o.greed, 0, 100);
            _off.officials[k] = { purse: purse2 === null ? 0 : purse2, factionTag: o.factionTag, greed: greed2 === null ? 50 : greed2, stolen: stolen2 === null ? 0 : stolen2 };
        }
    }
    function _offReset() { _off.officials = {}; }
    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        window.StateRegistry.register('dynastyCourtOfficials', { version: 1, export: _offExport, import: _offImport, reset: _offReset });
    }
    try {
        if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') window.timeSystem.onNewDaySubscribe(dailyTick);
    } catch (eSub) {}

    // ============ v27.9 长安见闻（世界对你的大胜/敌对有反应，各一次入见闻戳） ============
    function changanVisit(ct) {
        try {
            if (pkCity(ct) !== '帝都·长安') return;
            var ca = _st.changan;
            if (!glEmperor() || _st.ending) return;
            if (ca.phase === 'beaten' && !ca.beatenSeen) {
                ca.beatenSeen = absDay();
                chron(eraYear() + '，' + rulerWord() + '行幸长安。朝廷开城相迎，天子不召——也不敢拒。东土之事，自此出自' + rulerWord() + '口。');
                log('🏮 你进了长安——城楼上的龙幡还是旧的，守门的兵丁看见你的仪仗，齐齐低头让到两边。茶楼里说书说到「城下破王师」那一段，满堂噤声，人人都往你这边瞟。长安的天子没有召你——但也没有拒你。九州的人都明白：东土的事，说了算的是你。', 'info');
            } else if ((ca.phase === 'defy' || ca.phase === 'submit' || ca.phase === 'war') && !ca.hostileSeen) {
                ca.hostileSeen = absDay();
                log('🏮 你进了长安——顺天门里贴着你的海捕文书，缉事的眼睛黏在你背上。可没人敢揭文书，也没人敢拿你：京里人压着嗓子绕开你走，怕得罪你，也怕得罪朝廷。', 'warning');
            }
        } catch (e) { console.warn('[静默失败] js/dynasty-court.js · changanVisit：长安城头这一笔没写上', e && e.message); }
    }
    // enterCity 包一层（sect-cities 同款套路：加载序不定、防重包、原样透传返回值）
    // v27.13 案底（模块⑨漏洞「enterCity 双挂」核验）：审计所指 dynasty-court:1110 与 app.js 两处——
    //   app.js 全文件无一处 enterCity 赋值（只调 locationSystem.enterCity），其一为幻影；
    //   此处是包裹非定义，唯一定义在 location-system.js:2267（真身 422 行 enterCity 函数）；
    //   两条调用路径（window.enterCity 直呼/travel-system:566，locationSystem.enterCity/app.js:3001）
    //   经 location-system.js:1804 的 DES-81 派发桥汇回同一条包裹链——同链不分裂，无害，不动码。
    try {
        var origEnterCity = window.enterCity;
        if (typeof origEnterCity === 'function' && !origEnterCity.__dcCityWrapped) {
            window.enterCity = function (cityName) {
                var r = origEnterCity.apply(this, arguments);
                try { changanVisit(cityName); } catch (eV) {}
                return r;
            };
            window.enterCity.__dcCityWrapped = true;
        }
    } catch (eW) {}

    // 飞升钩子：ascension-epilogue 的 window.onAscension 由 heavenly-tribulation 调——
    // 本文件加载序不定，包一层挂 load（grand-legacy 补挂斗法台同款套路），原样透传返回值。
    function hookAscension() {
        try {
            if (window.__dcAscendHooked) return;
            var orig = window.onAscension;
            if (typeof orig !== 'function') return;
            window.onAscension = function () {
                var r;
                try { r = orig.apply(this, arguments); }
                finally { try { onAscend(); } catch (eDcA) { console.warn('[静默失败] js/dynasty-court.js · onAscension 包裹：终局这一笔没接住', eDcA && eDcA.message); } }
                return r;
            };
            window.__dcAscendHooked = true;
        } catch (eH) {}
    }
    if (typeof window.addEventListener === 'function') {
        window.addEventListener('load', hookAscension);
        if (typeof document !== 'undefined' && document.readyState === 'complete') { try { hookAscension(); } catch (eL) {} }
    } else { try { hookAscension(); } catch (eL2) {} }

    window.DynastyCourt = {
        CFG: CFG,
        open: open, courtOk: courtOk, initCourt: initCourt,
        incomeOf: incomeOf, expenseOf: expenseOf, taxIncome: taxIncome, reignYear: reignYear,
        childHeirs: childHeirs, discipleHeirs: discipleHeirs, heirOk: heirOk, designateHeir: designateHeir,
        conquestOk: conquestOk, startConquest: startConquest, resumeConquest: resumeConquest, settleConquestFight: settleConquestFight,
        workOk: workOk, buildWork: buildWork,
        turmoilCond: turmoilCond, maybeTurmoil: maybeTurmoil, resolveTurmoil: resolveTurmoil, rebelCity: rebelCity, resumeRebel: resumeRebel, settleRebelFight: settleRebelFight,
        changanTick: changanTick, resolveEdict: resolveEdict, startPunitive: startPunitive, settlePunitiveFight: settlePunitiveFight,
        summonOk: summonOk, summonCity: summonCity, summonPower: summonPower, summonNeed: summonNeed,
        grantWorkOk: grantWorkOk, grantPublicWork: grantPublicWork,   // v27.13 恩赏（国库→属城基金，城望走 RewardService 正门）
        giftOfficial: giftOfficial, auditOk: auditOk, auditBooks: auditBooks, resolveCase: resolveCase,   // v27.13 御史台（赏赐/查账/亏空裁决）
        maybeExposeDeficit: maybeExposeDeficit, officialsMonthly: officialsMonthly, ensureRoster: ensureRoster,   // v27.13 百官私账钩子（测试/调试读口）
        bookBal: bookBal, offGap: offGap, officialsLedger: _offExport,   // v27.13 账面余额/亏空/私账只读拷贝
        _settleTribute: settleTribute,   // v27.13 模块⑫回写①测试钩子：岁贡解贡+分流（无帝入国库/有帝入私库），返回 {total, detail, toPurse, toTreasury}
        cityPatron: cityPatron, homeSect: homeSect, isMundane: isMundane, isImperialCapital: isImperialCapital,
        eraYear: eraYear, rulerWord: rulerWord, changanVisit: changanVisit,
        endingOk: endingOk, setEndingPref: setEndingPref, onAscend: onAscend,
        dailyTick: dailyTick, allCities: allCities,
        state: _export, _import: _import, _reset: _reset
    };
    window.openDynastyCourt = function () { return open(); };
    window.settleConquestFight = settleConquestFight;
    window.settleRebelFight = settleRebelFight;
    window.settlePunitiveFight = settlePunitiveFight;
})();
