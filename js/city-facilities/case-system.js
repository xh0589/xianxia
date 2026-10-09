// ==================== v27.4 黑道与断案批 · 断案引擎（新文件 case-system.js） ====================
// 设计方案 F 引擎：77 破命案 · 78 仵作 · 79 讼师 · 80 自己打官司 · 82 冷案 · 83 缉逃犯领赏 · 84 科场揭弊。
//   （81 当捕快 = city-jobs 差事名册一行——上岗才有案卷权限，本账只读工账不另立岗。）
// 模型：案件按城低频生成（隔三日一骰 12%，一城压案至多两桩）——三步短流程：验看→问人→指认；
//   验看/问人各得一证并逐条排除 suspects（两条证到手，真凶就只剩一个——断案是真断案，不是掷骰碰运气）；
//   指认一案一次：铁证也要过堂（成算=证数×学识，明账），指错了案子办砸、司法堂记你一笔。
// 纪律：①案卷权限跟着捕快工牌走（CityJobs.ledger 正门读，锁就亮锁写清怎么当差）；
//       ②二十日不破转冷案——赏格上浮五成（82）；押案过多最老一桩自动销卷归档，案山不无限堆；
//       ③墙外海捕牌人人可揭（83）：缉逃犯是真仗（NpcCrime.startFlaggedBattle 正门，_isFugitiveHunt 旗）；
//       ④讼师（79）与告状（80）在偏厅：公门中人不得兼充讼师（利益回避，明账）；
//       ⑤堂上传票是黑道账的连带后果：民愤热度≥8 才有人敢告你，低频一骰、十日一隔——事不追人，
//         抗传三次缺席画卯，堂上自会缺席定谳（罚银+热度+脸进画影册）；
//       ⑥赢官司减热度走 NpcCrime.coolHeat 正门（销案揭画影同款口径）；银钱一笔事务走 RewardService。
(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    var CFG = {
        GEN_GAP: 3, GEN_P: 0.12, GEN_MAX_OPEN: 2, ARCHIVE_MAX: 4,
        COLD_DAYS: 20,                 // 82 冷案线
        EXAM_EN: 15, EXAM_MIN: 120,    // 验看
        EXAM_CLUE_P: 0.6, WUZUO_NEED: 40, WUZUO_FEE: 15,   // 78 仵作：医术40+必得证+验尸钱
        QU_EN: 10, QU_MIN: 120, QU_BASE: 0.45, QU_MOUTH: 0.005, QU_CAP: 0.85,   // 问人
        ACC_CORRECT_BASE: 0.25, ACC_CORRECT_CLUE: 0.25, ACC_XUE: 0.003, ACC_CORRECT_CAP: 0.95,
        ACC_WRONG_BASE: 0.08, ACC_WRONG_CLUE: 0.08, ACC_WRONG_XUE: 0.002, ACC_WRONG_CAP: 0.5,
        COLD_MUL: 1.5, COLD_REP: 2, CONSTABLE_COPPER: 100,   // 冷案上浮五成；捕快功绩钱
        LAW_NEED: 25, LAW_EN: 15, LAW_MIN: 120, LAW_BASE: 0.40, LAW_XUE: 0.004, LAW_MOUTH: 0.003, LAW_CAP: 0.85,
        LAW_WIN_STONES: 30, LAW_WIN_REP: 2,
        SUE_FEE: 10, SUE_WIN_NET: 20, SUE_BASE: 0.35, SUE_MOUTH: 0.004, SUE_XUE: 0.003, SUE_CAP: 0.8,
        SUMMONS_HEAT: 8, SUMMONS_GAP: 10, SUMMONS_P: 0.08, SUMMONS_NUDGE: 3,
        SUMMONS_LAWYER_COST: 40, SUMMONS_LAWYER_P: 0.65,
        SUMMONS_SELF_BASE: 0.30, SUMMONS_SELF_SKILL: 0.004, SUMMONS_SELF_CAP: 0.70,
        SUMMONS_WIN_COOL: 5, SUMMONS_LOSE_HEAT: 3, SUMMONS_LOSE_REP: 10,
        FUG_WIN_REP: 2, FUG_WIN_EXP: 10, FUG_LOSE_QI: 15, FUG_LOSE_COOL: 5,
        // v27.13 张榜半日流程（模块⑧改良）：报官→核验→张榜——出事不再瞬挂上榜
        REPORT_AUTO_DELAY_MIN: 240,   // 苦主邻里哭告奔走的脚程：案发后 NPC 自动报案晚两个时辰到衙门
        VERIFY_MIN: 720,              // 核验期：半日（主档口径「半日=12 时辰」，按 60 分钟读法=720 分钟）——衙门「查案中」
        WITNESS_P: 0.5,               // 案发撞见：在场（同地图）五成把案犯看了个真切——目击是概率不是必然
        FILE_EN: 5,                   // 玩家报官精力
        FILE_BASE: 0.5, FILE_MOUTH: 0.005, FILE_CAP: 0.9,   // 报官成算吃口才：成了状子即刻受理（核验早半日起步）
        AMBUSH_MIN: 60,               // 堵人赶路：一个时辰
        PRIVATE_FRAC_MIN: 0.5, PRIVATE_FRAC_RANGE: 0.4,     // 私了所得=赏格五成起、至多九成——案犯自己的钱，不走城基金
        HUNT_COOL_DAYS: 5,            // 堵人失手：那厮惊了，五日内堵不着（海捕牌 FUG_LOSE_COOL 同口径）
        // v27.13 悬赏的后续人生（三条命）：跑路 / 护法 / 反咬入册——悬赏目标也是活人
        FLEE_DAYS: 3,                 // 跑路节拍：张榜三日无人交人，案犯才动身——文书贴出去三天，案犯自己也看得到榜
        FLEE_P: 0.5,                  // 到点后每日一骰的弃窝成算（两番跑路间至少隔 FLEE_DAYS——走一步歇三天，不是天天搬家）
        FLEE_MAX: 2,                  // 每案跑路上限：头两回弃窝换地，第三回到点即遁远——此单石沉大海，只等同行截单销案，不许无限刷
        GRUDGE_DAYS: 10,              // 记恨节拍：揭榜十日不交人，案犯也数得清日子——挂名拿他的人，他记下了
        REVENGE_ESCAPES: 2,           // 两度脱身（缉凶战败/被同行截走后逍遥）——梁子结成，够他记恨
        VENDETTA_MONTH_DAYS: 30,      // 报复事件全档月频至多一次——频率克制，不许变刷怪器
        NEMESIS_TIER_MIN: 3,          // 凶悍三档才够格入宿敌册（悬赏→宿敌桥的门槛：等闲毛贼进不了仇账）
        POISON_HP: 12, POISON_HP_TIER: 4    // 下毒伤身：12+凶悍档×4——暗算伤人，不致命（赏是拿人的钱，命也是）
    };
    // 案型与赏格（明账）
    var CASE_TYPES = {
        theft: { name: '失窃案', icon: '🪙', reward: { stones: 40, rep: 3, exp: 20 } },
        murder: { name: '命案', icon: '🗡️', reward: { stones: 80, rep: 6, karma: 2, exp: 40 } },
        exam: { name: '科场舞弊案', icon: '📜', reward: { stones: 60, rep: 5, exp: 30 } }   // 84：只秋闱时节出
    };
    var BRIEFS = {
        theft: ['绸缎庄夜里失了窃，六十匹料子不翼而飞，门锁完好。', '知府寿礼的贺银在半路被人调了包，押礼的家人被捆在土地庙里。', '李宅院墙被挖了个洞，祖传的银器丢了个干净。', '当铺的地窖被人开了封，伙计咬定钥匙从没离过身。'],
        murder: ['绸缎商死在后巷，心口一道半寸窄刃伤，钱包分文未动。', '大户的老仆溺死在井里——鞋却整整齐齐摆在井沿上。', '行脚商死在客栈房里，行囊没动，随身的账册却缺了一页。', '更夫死在河滩上，手里攥着半枚铜扣。'],
        exam: ['乡试搜检，搜出个夹带经文的考生——字是馆阁体，不像他自己写的。', '号舍里的文章被人代笔，两场笔迹对不上，考官压着没发。', '有人在贡院外翻墙递条子，被巡绰兵丁撞见，跳进护城河跑了。', '富商之子目不识丁，却考进了前三——满学宫哗然。']
    };
    var CLUES = {
        theft: ['墙洞是从里往外挖的——是内贼。', '现场没有翻动的痕迹，贼是熟门熟路的人。', '空气里残留着一缕脂粉气，是勾栏里常用的水粉。', '赃车辙印通向南门的骡马店。'],
        murder: ['伤口深逾半寸，刃口极薄——不是市井泼皮的家伙。', '尸身僵直未透，死在两个时辰之内。', '死者鞋底有新泥，花纹是河滩特有的。', '那半枚铜扣，是府里管家袍子上才用的样式。'],
        exam: ['夹带的小楷是代笔先生的手笔，坊间润笔有定价。', '号舍的墨色两场不一——中间有人换过卷子。', '翻墙人的鞋底带着贡院侧门的青苔。', '放榜前有人见过富商的家仆出入主考下处。']
    };
    var TESTIFY = ['卖菜的婆子说，那晚看见有人在巷口踅了半宿。', '铺子里的伙计漏了嘴：东家半月前跟人结过怨。', '邻舍压低声音：后半夜听见争吵，还有个女人在哭。', '脚夫记得清楚：那日有人雇车往南门去了，给的是双份脚钱。'];
    var SURNAMES = ['赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈', '蒋', '沈', '韩', '杨', '朱', '秦'];
    var GIVEN = ['大牛', '守财', '文远', '铁柱', '秀娥', '有才', '德发', '春生', '金锁', '玉梅', '来福', '永贵', '素贞', '长顺', '巧姑', '宝山'];
    // v27.13 目击线索池：长相/去向按案卷 id 播种定死——同案每次读到的线索一字不差（线索是真见过，不是现编）
    var LOOKS = ['身量极高，左眉一道旧疤', '瘦得像根竹竿，走路没声', '矮壮敦实，右手缺了半截小指', '面皮白净，说话带北地口音', '颧骨高耸，鹰钩鼻', '背微驼，惯用左手', '络腮胡须，腰间悬一面铜牌', '尖嘴猴腮，一笑就露出一颗金牙'];
    var LAIRS = ['城南破庙的供桌底下', '南门骡马店的草料棚', '河滩芦苇荡里的一条乌篷船', '西市赁的一间阁楼', '城隍庙后的地窖', '北山脚下一处废窑', '东巷赌坊后院的柴房', '官道旁野店的地字二号房'];

    var _st = {
        cases: [],          // {id, city, type, filedDay, brief, culprits[3], real, ex[2], clues, examined, questioned, accused, state}
        reports: [],        // v27.13 报官簿：{id, caseId, city, type, bornMin, autoReportAt, reportMin, postAt, brief, culprit{name,look,lair,tier}, bountyBase, witnessed, leadGiven, leadSpent, filedTry, filedBy, state(pending|verify|posted|settled|dropped), settledHow, postedId, postedStones, btyAccepted, btyCompleted, huntCoolDay, flights, fledFar, lastFleeDay, lastMoveMin, escapes, btyAcceptedAt}
        caught: {},         // 'city|name' -> 拿获日
        fugCool: {},        // 'city|name' -> 逃遁日（五日内不再露面）
        // v27.13 悬赏的后续人生：仇账（'城|名' -> {name,city,tier,escapes,done,nemesisDone,npcId,bornDay,lastDay}）
        vendetta: {},       // done=报复事件一生一次的防重标；nemesisDone=已入宿敌册（NPC 随 npcManager 自家存档走）
        vendLastDay: 0,     // 上一次报复事件的日子——全档月频一闸
        sueDay: 0, lawDay: 0,
        summons: null,      // {filedDay, nudges}
        lastSummonDay: 0, lastGenDay: 0, solved: 0
    };

    // ============ 小工具（service-stall 同款口径） ============
    function cd() { return window.currentCharData || null; }
    function say(m, t) { try { if (window.showMessage) window.showMessage(m, t || 'info'); } catch (e) { return false; } return true; }
    function log(m, t) { try { if (window.gameLog && window.gameLog.add) window.gameLog.add(m, t || 'info'); } catch (e) { return false; } return true; }
    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
    function city() {
        return (cd() && cd().location) ||
            (typeof window.getCurrentCityName === 'function' && window.getCurrentCityName()) || '';
    }
    function pkCity(s) { return String(s == null ? '' : s).replace(/\s+/g, ''); }
    function absDay() {
        try {
            if (window.WorldCalendar && typeof window.WorldCalendar.day === 'number' && window.WorldCalendar.day > 0) return Math.floor(window.WorldCalendar.day);
            if (typeof window.getAbsoluteDay === 'function') { var g = window.getAbsoluteDay(); if (g) return Math.floor(g); }
            if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') { var t = window.timeSystem.getAbsoluteDay(); if (t) return Math.floor(t); }
        } catch (e) { return 0; }
        return 0;
    }
    function dice() { return (typeof window.__scenarioRng === 'function') ? window.__scenarioRng() : Math.random(); }
    function settle(spec, source) {
        try {
            if (window.RewardService && typeof window.RewardService.apply === 'function') {
                var r = window.RewardService.apply(spec, { facilitySpend: true, source: source || '司法堂', city: city() });
                return { ok: !!(r && r.success !== false), note: r && r.messages ? r.messages.join('、') : '' };
            }
        } catch (e) { console.warn('[静默失败] js/city-facilities/case-system.js · settle：这笔账没落成一笔', e && e.message); }
        return { ok: false, note: '' };
    }
    function stonesNow() {
        try {
            var DM = window.DataManager || (window.XianXia && window.XianXia.DataManager);
            if (DM && typeof DM.getSpiritStones === 'function') return Number(DM.getSpiritStones()) || 0;
        } catch (e) {}
        var c = cd();
        return c ? (Number(c.spiritStones) || 0) : 0;
    }
    function payMin(amt) {   // 罚银搜身尽力赔付（settleBountyHunt 先例）：交不齐的罪加一等
        var paid = Math.min(stonesNow(), Math.max(0, amt));
        if (paid > 0) { var r = settle({ stones: -paid }, '罚银'); if (!r.ok) return 0; }
        return paid;
    }
    function addHeat(n, why, opts) {
        try { if (window.NpcCrime && typeof window.NpcCrime.addHeat === 'function') window.NpcCrime.addHeat(n, why, opts); } catch (e) { console.warn('[静默失败] js/city-facilities/case-system.js · addHeat：这笔风声没记上官府的账', e && e.message); }
    }
    function coolHeat(n, why) {
        try { if (window.NpcCrime && typeof window.NpcCrime.coolHeat === 'function') return window.NpcCrime.coolHeat(n, why); } catch (e) { console.warn('[静默失败] js/city-facilities/case-system.js · coolHeat：减热度的正门没走通', e && e.message); }
        return 0;
    }
    function heatNow() { try { if (window.NpcCrime && typeof window.NpcCrime.heat === 'function') return Number(window.NpcCrime.heat()) || 0; } catch (e) {} return 0; }
    function repDown(n) {
        var ct = city();
        if (!ct || typeof window.reduceReputation !== 'function') return false;
        try { window.reduceReputation(ct, n); return true; } catch (e) { return false; }
    }
    function deed(mood, s) { try { if (typeof window.playerPushDeed === 'function') window.playerPushDeed(mood, s); } catch (e) {} }
    function advance(min, why) { try { if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') window.timeSystem.advanceTime(min, why); } catch (e) { console.warn('[静默失败] js/city-facilities/case-system.js · advance：时辰没扣成', e && e.message); } }
    function refresh() { try { if (window.updateCharacterStatus) window.updateCharacterStatus(); } catch (e) {} }
    function skill(name) {
        try { if (typeof window.getLifeSkill === 'function') return Number(window.getLifeSkill(name)) || 0; } catch (e) {}
        var c = cd();
        return (c && c.lifeSkills && Number(c.lifeSkills[name])) || 0;
    }
    function grow(name, exp) { try { if (typeof window.growLifeSkill === 'function') window.growLifeSkill(name, exp || 1); } catch (e) {} }
    function seedOf(s) { var h = 0; s = String(s || ''); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
    function inCity() { var ct = city(); if (!ct) return ''; try { if (window.locationSystem && window.locationSystem.getCityData && !window.locationSystem.getCityData(ct)) return ''; } catch (e) {} return ct; }
    function seasonNow() { try { return (window.timeSystem && window.timeSystem.gameTime && window.timeSystem.gameTime.currentSeason) || ''; } catch (e) { return ''; } }
    // 81 捕快上岗才有案卷权限（CityJobs 工账正门读——锁就亮锁）
    function isConstable(ct) {
        try {
            if (!window.CityJobs || typeof window.CityJobs.ledger !== 'function') return false;
            var l = window.CityJobs.ledger();
            return !!(l && l.job === 'constable' && pkCity(l.city) === pkCity(ct || city()));
        } catch (e) { return false; }
    }
    function caseById(id) {
        for (var i = 0; i < _st.cases.length; i++) { if (_st.cases[i].id === id) return _st.cases[i]; }
        return null;
    }
    function isCold(c) { var d = absDay(); return !!(c && c.state === 'open' && d && d - c.filedDay >= CFG.COLD_DAYS); }
    // v27.13：绝对分钟读口（time-system 的 totalMinutes 是存档键，跨读档稳定）——核验/张榜的半日账全靠它
    function nowMin() {
        try {
            var gt = (window.timeSystem && window.timeSystem.gameTime) || window.gameTime;
            if (gt && Number.isFinite(Number(gt.totalMinutes))) return Math.max(0, Math.floor(Number(gt.totalMinutes)));
        } catch (e) { console.warn('[静默失败] js/city-facilities/case-system.js · nowMin：读不到钟，半日账按日粗算', e && e.message); }
        return absDay() * 1440;   // 钟不在：按日粗算（半日内不细分）
    }
    function reportById(id) {
        for (var i = 0; i < _st.reports.length; i++) { if (_st.reports[i].id === id) return _st.reports[i]; }
        return null;
    }
    function reportByCase(caseId) {
        for (var i = _st.reports.length - 1; i >= 0; i--) { if (_st.reports[i].caseId === caseId) return _st.reports[i]; }
        return null;
    }

    // ============ 案件生成（按城低频：隔三日一骰，一城压案至多两桩） ============
    function genCaseTick() {
        var d = absDay();
        if (!d) return null;
        var ct = inCity();
        if (!ct) return null;
        var key = pkCity(ct);
        // 押案归档：一城 open 超上限，最老一桩销卷（案山不无限堆——销卷不是破案，没有功劳）
        var opens = _st.cases.filter(function (c) { return c.state === 'open' && c.city === key; });
        while (opens.length > CFG.ARCHIVE_MAX) {
            var oldest = opens.shift();
            oldest.state = 'archived';
            try { _dropReport(oldest.id, 'archived'); } catch (eDr1) { console.warn('[静默失败] js/city-facilities/case-system.js · genCaseTick：销卷时报官账没勾掉', eDr1 && eDr1.message); }   // v27.13 案销了，报官簿跟着勾——不再张榜
            log('⚖️ ' + ct + '的「' + CASE_TYPES[oldest.type].name + '」（第 ' + oldest.filedDay + ' 日報案）无人问津太久，主簿叹了口气，把它压进了积年的旧卷宗——销卷归档，苦主的眼泪也归档了。', 'warning');
        }
        if (d - _st.lastGenDay < CFG.GEN_GAP) return null;
        if (opens.length >= CFG.GEN_MAX_OPEN) {
            // 案卷架满了：最老一桩已成冷案才销卷腾位（冷案没人接手就压箱底，让新案上来——销卷不是破案，没有功劳）
            if (!isCold(opens[0])) return null;
            opens[0].state = 'archived';
            try { _dropReport(opens[0].id, 'archived'); } catch (eDr2) { console.warn('[静默失败] js/city-facilities/case-system.js · genCaseTick：腾位销卷时报官账没勾掉', eDr2 && eDr2.message); }   // v27.13 案销了，报官簿跟着勾
            log('⚖️ ' + ct + '的「' + CASE_TYPES[opens[0].type].name + '」（第 ' + opens[0].filedDay + ' 日報案）积年无人问津，主簿叹了口气，压进了旧卷宗——销卷归档，苦主的眼泪也归档了。', 'warning');
            opens = opens.slice(1);
        }
        if (dice() >= CFG.GEN_P) return null;
        _st.lastGenDay = d;
        // 案型：秋闱时节才有科场案（84）；命案三成、失窃案余下
        var season = seasonNow();
        var roll = dice();
        var type = 'theft';
        if (season === 'autumn' && roll < 0.20) type = 'exam';
        else if (roll < (season === 'autumn' ? 0.50 : 0.38)) type = 'murder';
        var seed = seedOf(key + type + d);
        var briefs = BRIEFS[type];
        var names = [];
        while (names.length < 3) {
            var nm = SURNAMES[(seed + names.length * 7) % SURNAMES.length] + GIVEN[(seed * 3 + names.length * 11) % GIVEN.length];
            if (names.indexOf(nm) < 0) names.push(nm);
        }
        var real = seed % 3;
        var ex = [0, 1, 2].filter(function (i) { return i !== real; });
        if ((seed >>> 2) % 2) ex.reverse();
        var c = {
            id: 'case_' + key + '_' + d, city: key, type: type, filedDay: d,
            brief: briefs[seed % briefs.length], culprits: names, real: real, ex: ex,
            clues: 0, examined: 0, questioned: 0, accused: 0, state: 'open'
        };
        _st.cases.push(c);
        if (_st.cases.length > 40) _st.cases = _st.cases.slice(-40);
        try { _openReport(c); } catch (eRep) { console.warn('[静默失败] js/city-facilities/case-system.js · genCaseTick：报官簿没开成账——这案子走老路瞬知', eRep && eRep.message); }   // v27.13 张榜半日流程：案发即立报官账
        log('⚖️ ' + ct + '出了桩新案子——「' + CASE_TYPES[type].name + '」：' + c.brief + '（报案第 ' + d + ' 日。' + (isConstable(ct) ? '你穿着号衣，案卷直接递到你手上。' : '案卷在捕快手里——当差才翻得着。') + '）', 'info');
        return c;
    }

    // ============ 三步短流程：验看 → 问人 → 指认 ============
    function examine(id) {
        var ct = inCity();
        if (!ct) { say('⚖️ 先进城——案卷在司法堂的架子上。', 'info'); return false; }
        var c = caseById(id);
        if (!c || c.state !== 'open' || c.city !== pkCity(ct)) { say('⚖️ 这卷案宗不在本城架上（或已结案）。', 'info'); return false; }
        if (!isConstable(ct)) { say('⚖️ 案卷房重地，闲人免进——你身上没有号衣。（先在「城里营生」应募本城司法堂的捕快，上岗才翻得着案卷）', 'warning'); return false; }
        if (c.examined) { say('⚖️ 这卷案你已经验看过——现场不会陪你再演一遍。', 'info'); return false; }
        var cd0 = cd();
        if (Number(cd0.energy) < CFG.EXAM_EN) { say('⚖️ 精力不够蹲半天现场（要 ' + CFG.EXAM_EN + '）。', 'warning'); return false; }
        var wuzuo = skill('医术') >= CFG.WUZUO_NEED;   // 78 仵作的眼力
        var got = wuzuo ? true : dice() < CFG.EXAM_CLUE_P;
        var spec = { energy: -CFG.EXAM_EN };
        if (wuzuo) spec.stones = CFG.WUZUO_FEE;   // 仵作验尸钱（一案一回）
        c.examined = 1;
        if (got) {
            c.clues += 1;
            var pool = CLUES[c.type];
            var cl = pool[seedOf(c.id + 'ex') % pool.length];
            var exName = c.culprits[c.ex[Math.min(c.clues - 1, 1)]];
            log('⚖️ 你蹲在现场细细验看' + (wuzuo ? '——你的医术瞒不过尸身与伤口（仵作的活你顺手就干了，堂上另发验尸钱 ' + CFG.WUZUO_FEE + ' 灵石）' : '') + '：' + cl + '（证物+1，共 ' + c.clues + ' 条）' + (c.clues <= 2 ? '——人证物证对下来，「' + exName + '」可以排除了。' : ''), 'success');
            say('⚖️ 验看有得：' + cl + (wuzuo ? '（验尸钱+' + CFG.WUZUO_FEE + '）' : ''), 'success');
        } else {
            log('⚖️ 你在现场蹲了半天——雨水冲了脚印，看热闹的早把现场踩乱了，一无所获。（精力-' + CFG.EXAM_EN + '，验看只有这一回）', 'info');
            say('⚖️ 现场什么都没验出来。', 'warning');
        }
        settle(spec);
        grow('医术', 1);
        advance(CFG.EXAM_MIN, '验看现场');
        refresh(); open();
        return true;
    }
    function question(id) {
        var ct = inCity();
        if (!ct) { say('⚖️ 先进城。', 'info'); return false; }
        var c = caseById(id);
        if (!c || c.state !== 'open' || c.city !== pkCity(ct)) { say('⚖️ 这卷案宗不在本城架上（或已结案）。', 'info'); return false; }
        if (!isConstable(ct)) { say('⚖️ 没有号衣问不了案——街坊不会跟闲人嚼这些舌根。（先应募本城司法堂的捕快）', 'warning'); return false; }
        if (c.questioned) { say('⚖️ 该问的人你都问过了——再问就是车轱辘话。', 'info'); return false; }
        var cd0 = cd();
        if (Number(cd0.energy) < CFG.QU_EN) { say('⚖️ 精力不够走街坊（要 ' + CFG.QU_EN + '）。', 'warning'); return false; }
        c.questioned = 1;
        var p = clamp(CFG.QU_BASE + skill('口才') * CFG.QU_MOUTH, 0.2, CFG.QU_CAP);
        if (dice() < p) {
            c.clues += 1;
            var t = TESTIFY[seedOf(c.id + 'q') % TESTIFY.length];
            var exName = c.culprits[c.ex[Math.min(c.clues - 1, 1)]];
            log('⚖️ 你挨家挨户地走了一遍——' + t + '（口供+1，共 ' + c.clues + ' 条）' + (c.clues <= 2 ? '——顺着这条线，「' + exName + '」洗清了嫌疑。' : ''), 'success');
            say('⚖️ 问出话来了：' + t, 'success');
        } else {
            log('⚖️ 街坊们一见号衣就闭门——问了一圈，人人都说「没瞧见」。（口才 ' + Math.round(p * 100) + '% 的成算没掷中，问人只有这一回）', 'info');
            say('⚖️ 街坊守口如瓶，白走一趟。', 'warning');
        }
        settle({ energy: -CFG.QU_EN });
        grow('口才', 1);
        advance(CFG.QU_MIN, '走访问人');
        refresh(); open();
        return true;
    }
    function accuseP(c, idx) {
        var xue = skill('学识');
        if (idx === c.real) return clamp(CFG.ACC_CORRECT_BASE + c.clues * CFG.ACC_CORRECT_CLUE + xue * CFG.ACC_XUE, 0.1, CFG.ACC_CORRECT_CAP);
        return clamp(CFG.ACC_WRONG_BASE + c.clues * CFG.ACC_WRONG_CLUE + xue * CFG.ACC_WRONG_XUE, 0.05, CFG.ACC_WRONG_CAP);
    }
    function accuse(id, idx) {
        var ct = inCity();
        if (!ct) { say('⚖️ 先进城。', 'info'); return false; }
        var c = caseById(id);
        if (!c || c.state !== 'open' || c.city !== pkCity(ct)) { say('⚖️ 这卷案宗不在本城架上（或已结案）。', 'info'); return false; }
        if (!isConstable(ct)) { say('⚖️ 指认要当堂画押——没有号衣，堂上没你说话的份。', 'warning'); return false; }
        if (c.accused) { say('⚖️ 这卷案已经指认过了——堂上画过押，改不了口。', 'info'); return false; }
        idx = Math.floor(Number(idx));
        if (!(idx >= 0 && idx < 3)) { say('⚖️ 堂上没这个人。', 'warning'); return false; }
        c.accused = 1;
        var p = accuseP(c, idx);
        var cold = isCold(c);
        if (dice() < p) {
            c.state = 'solved';
            c.solvedDay = absDay();
            _st.solved = (Number(_st.solved) || 0) + 1;
            try { _settleReportByCase(c.id, 'accused'); } catch (eRA) { console.warn('[静默失败] js/city-facilities/case-system.js · accuse：堂上画押后报官账没勾掉', eRA && eRA.message); }   // v27.13 堂上销案——报官簿勾账，榜不再挂此人
            var rw = CASE_TYPES[c.type].reward;
            var spec = {
                stones: Math.round(rw.stones * (cold ? CFG.COLD_MUL : 1)),
                rep: rw.rep + (cold ? CFG.COLD_REP : 0),
                exp: rw.exp, copper: CFG.CONSTABLE_COPPER
            };
            if (rw.karma) spec.karma = rw.karma;
            settle(spec);
            grow('学识', 2);
            deed('good', '你破结了' + ct + '的' + (cold ? '积年冷案' : CASE_TYPES[c.type].name) + '——「' + c.culprits[idx] + '」当堂画押，苦主们放了鞭炮');
            log('⚖️ 当堂指认！人证物证俱在，「' + c.culprits[idx] + '」面如死灰，画押认了罪。' + (cold ? '这桩积年的冷案一朝破结——主簿亲自给你记了大功：' : '主簿提笔结案：') + '赏格 ' + spec.stones + ' 灵石、功绩钱 ' + spec.copper + ' 铜、本城声望+' + spec.rep + '、历练+' + spec.exp + (spec.karma ? '、因果+' + spec.karma : '') + '。（学识+2）', 'success');
            say('⚖️ 案子破了！赏格 ' + spec.stones + ' 灵石' + (cold ? '（冷案上浮五成）' : '') + '，声望+' + spec.rep + '。', 'success');
        } else {
            c.state = 'botched';
            settle({ rep: -3 });
            log('⚖️ 堂上对质——你呈的证物处处漏风，「' + c.culprits[idx] + '」当堂喊冤，苦主反咬你屈打成招。主簿把案卷一合：「证据不足，退回！」这案子经了这一折腾，彻底砸了。（本城声望-3，案卷标记「办砸」）', 'danger');
            say('⚖️ 指认没坐实——案子办砸了，司法堂记你一笔。（声望-3）', 'error');
        }
        refresh(); open();
        return true;
    }

    // ============ 83 墙外海捕牌：缉逃犯领赏（人人可揭——真仗） ============
    function fugitiveOf(ct) {
        var key = pkCity(ct || city());
        if (!key) return [];
        var d = absDay();
        var week = d ? Math.floor(d / 7) : 0;
        var seed = seedOf(key + '_fug_' + week);
        var n = 1 + seed % 2;
        var out = [];
        for (var i = 0; i < n; i++) {
            var nm = SURNAMES[(seed + i * 5) % SURNAMES.length] + GIVEN[(seed * 7 + i * 13) % GIVEN.length] + '·' + ['独脚', '快刀', '夜猫', '穿山', '水鬼', '铁头'][((seed >> 3) + i) % 6];
            var fk = key + '|' + nm;
            if (_st.caught[fk]) continue;
            if (_st.fugCool[fk] && d && d - _st.fugCool[fk] < CFG.FUG_LOSE_COOL) continue;
            var tier = 1 + ((seed >>> (2 + i)) % 3);
            out.push({ name: nm, key: fk, tier: tier, bounty: 30 + tier * 20 + (seed >>> i) % 15 });
        }
        return out;
    }
    function huntFug(idx) {
        var ct = inCity();
        if (!ct) { say('🪧 先进城——海捕牌贴在墙外。', 'info'); return false; }
        if (window.currentBattle) { say('打着架呢——先了结手头这场。', 'warning'); return false; }
        var list = fugitiveOf(ct);
        var f = list[Math.floor(Number(idx))];
        if (!f) { say('🪧 海捕牌上没有这一号人。', 'info'); return false; }
        var tier = f.tier + Math.max(1, playerTierNow());
        var enemy = {
            name: '逃犯·' + f.name, type: 'elite', physiologyType: 'humanoid',
            level: tier * 3 + 2, attack: 28 + tier * 7, defense: 15 + tier * 4, speed: 20,
            maxDurability: 100 + tier * 20, durabilities: { chest: 100 + tier * 20 }, combatAbilities: []
        };
        var started = false;
        try {
            if (window.NpcCrime && typeof window.NpcCrime.startFlaggedBattle === 'function') {
                started = window.NpcCrime.startFlaggedBattle(enemy, { _isFugitiveHunt: true, _fugKey: f.key, _fugBounty: f.bounty },
                    '🪧 你揭了海捕牌——「' + f.name + '」果然亡命：「想拿爷换赏钱？来！」（赏金 ' + f.bounty + ' 灵石）');
            } else { say('🪧 缉捕的场面拉不起来——兵刃的账没接上。', 'warning'); }
        } catch (e) { console.warn('[静默失败] js/city-facilities/case-system.js · huntFug：这一仗没拉起来', e && e.message); }
        return started;
    }
    function playerTierNow() {
        try { var c = cd(); if (c && c.realm && typeof window.getRealmTier === 'function') return Number(window.getRealmTier(c.realm)) || 0; } catch (e) {}
        return 0;
    }
    // 缉逃战结算（app.js 战斗收场钩子 _isFugitiveHunt 接线）
    function settleFugitiveHunt(won) {
        try {
            var b = window.currentBattle;
            if (b && b._btyCaseId) return _settleCaseHunt(won);   // v27.13：张榜半日流程的堵人/缉凶战走报官簿结算口——海捕牌老账（_fugKey）原样在前
            var key = (b && b._fugKey) || '';
            var bounty = (b && Number(b._fugBounty)) || 0;
            var nm = key.indexOf('|') > 0 ? key.split('|')[1] : '逃犯';
            if (won) {
                settle({ stones: bounty, exp: CFG.FUG_WIN_EXP, rep: CFG.FUG_WIN_REP, karma: 1 });
                if (key) _st.caught[key] = absDay() || 1;
                deed('good', '你揭了海捕牌，把亡命的「' + nm + '」当街拿下扭送官府——街坊都夸你胆气');
                log('🪧 「' + nm + '」被你打翻捆了个结实，扭送司法堂画押——赏金 ' + bounty + ' 灵石当堂兑付，另记历练+' + CFG.FUG_WIN_EXP + '、本城声望+' + CFG.FUG_WIN_REP + '、因果+1。（海捕牌上这一号销了）', 'success');
                say('🪧 逃犯拿下——赏金 ' + bounty + ' 灵石落袋。', 'success');
            } else {
                if (key) _st.fugCool[key] = absDay() || 1;
                settle({ qi: -CFG.FUG_LOSE_QI });
                log('🪧 「' + nm + '」到底是在刀口上滚过的人——你败下阵来，TA趁乱遁走（真气-' + CFG.FUG_LOSE_QI + '）。海捕牌还贴着：这厮躲了风头，五日后再露面。', 'danger');
                say('🪧 没拿住——让「' + nm + '」跑了。（真气-' + CFG.FUG_LOSE_QI + '）', 'error');
            }
            refresh();
            return true;
        } catch (e) { console.warn('[静默失败] js/city-facilities/case-system.js · settleFugitiveHunt：这一仗的账没接住', e && e.message); return false; }
    }
    window.settleFugitiveHunt = settleFugitiveHunt;

    // ============ 79 讼师（偏厅代讼）· 80 自己打官司（递状告人） ============
    function sueFor() {
        var ct = inCity();
        if (!ct) { say('⚖️ 先进城——偏厅里等着的主顾都在本城。', 'info'); return false; }
        if (isConstable(ct)) { say('⚖️ 你穿着号衣——公门中人不得兼充讼师，这是堂上的规矩（利益回避，锁就亮锁）。', 'warning'); return false; }
        if (skill('学识') < CFG.LAW_NEED) { say('⚖️ 代写状纸要学识 ' + CFG.LAW_NEED + ' 起步（现 ' + skill('学识') + '）——写错了引的律条，主顾要输官司的。', 'warning'); return false; }
        var d = absDay();
        if (!d) { say('⚖️ 天上没钟，堂上不开印。', 'info'); return false; }
        if (_st.lawDay === d) { say('⚖️ 今日已经代过一状——偏厅的主顾一日只接一位，贪多嚼不烂。', 'info'); return false; }
        var c0 = cd();
        if (Number(c0.energy) < CFG.LAW_EN) { say('⚖️ 精力不够写状对庭（要 ' + CFG.LAW_EN + '）。', 'warning'); return false; }
        _st.lawDay = d;
        advance(CFG.LAW_MIN, '代讼');
        var p = clamp(CFG.LAW_BASE + skill('学识') * CFG.LAW_XUE + skill('口才') * CFG.LAW_MOUTH, 0.15, CFG.LAW_CAP);
        if (dice() < p) {
            settle({ stones: CFG.LAW_WIN_STONES, rep: CFG.LAW_WIN_REP, karma: 1, energy: -CFG.LAW_EN });
            grow('学识', 2);
            log('⚖️ 你替偏厅里那户被赖了货款的绸缎行写状代讼——引律条、呈契据、当堂辩了半个时辰，判了个全额给付。主顾捧着 ' + CFG.LAW_WIN_STONES + ' 灵石谢仪直作揖。（本城声望+' + CFG.LAW_WIN_REP + '、因果+1、学识+2）', 'success');
            say('⚖️ 官司打赢了——谢仪 ' + CFG.LAW_WIN_STONES + ' 灵石。（声望+' + CFG.LAW_WIN_REP + '）', 'success');
        } else {
            settle({ rep: -1, energy: -CFG.LAW_EN });
            grow('学识', 1);
            log('⚖️ 状纸递上去，对方讼师逐条驳回——你的律条引岔了一句，主顾的官司输了。谢仪没脸收，还落了句「学艺不精」。（本城声望-1、学识+1——输一场长一智）', 'warning');
            say('⚖️ 官司输了——律条引岔了，声望-1。（学识+1）', 'warning');
        }
        refresh(); open();
        return true;
    }
    function fileSuit() {
        var ct = inCity();
        if (!ct) { say('⚖️ 先进城。', 'info'); return false; }
        var d = absDay();
        if (!d) { say('⚖️ 天上没钟，堂上不开印。', 'info'); return false; }
        if (_st.sueDay === d) { say('⚖️ 今日已递过状——堂上的规矩，一人一日一状。', 'info'); return false; }
        _st.sueDay = d;
        advance(60, '递状候审');
        var p = clamp(CFG.SUE_BASE + skill('口才') * CFG.SUE_MOUTH + skill('学识') * CFG.SUE_XUE, 0.1, CFG.SUE_CAP);
        if (dice() < p) {
            settle({ stones: CFG.SUE_WIN_NET, mood: 2 });
            log('⚖️ 你把赖账跑路的无赖告上了堂——状纸写得在理，人证契据齐全，堂上判他赔你 30 灵石（除去状纸费 ' + CFG.SUE_FEE + '，净得 ' + CFG.SUE_WIN_NET + '）。衙役押着他回家搬银子，你在堂下等了半日，值了。（心境+2）', 'success');
            say('⚖️ 官司赢了——判赔到手，净赚 ' + CFG.SUE_WIN_NET + ' 灵石。（心境+2）', 'success');
        } else {
            settle({ stones: -CFG.SUE_FEE, mood: -1 });
            log('⚖️ 堂上对质——那无赖反咬你讹诈，你的凭据又缺了一角，堂上驳了状纸。状纸费 ' + CFG.SUE_FEE + ' 灵石打了水漂，还挨了主簿一句「证据不齐，再来递状」。（心境-1）', 'warning');
            say('⚖️ 状纸被驳——白搭 ' + CFG.SUE_FEE + ' 灵石状纸费。（心境-1）', 'error');
        }
        refresh(); open();
        return true;
    }

    // ============ 堂上传票（黑道账的连带后果——事不追人，抗传画卯有定数） ============
    function summonsFine() { return 20 + Math.floor(heatNow() * 2); }
    function summonsTick() {
        var d = absDay();
        if (!d) return;
        if (_st.summons) {
            _st.summons.nudges = (Number(_st.summons.nudges) || 0) + 1;
            if (_st.summons.nudges > CFG.SUMMONS_NUDGE) { defaultJudgement(); return; }
            log('⚖️ 衙役又上门催了一遍传票——「明日再不到堂画卯，就缺席定谳了！」（还剩 ' + (CFG.SUMMONS_NUDGE - _st.summons.nudges + 1) + ' 日）', 'warning');
            presentSummon();
            return;
        }
        if (heatNow() < CFG.SUMMONS_HEAT) return;
        if (d - _st.lastSummonDay < CFG.SUMMONS_GAP) return;
        if (dice() >= CFG.SUMMONS_P) return;
        _st.lastSummonDay = d;
        _st.summons = { filedDay: d, nudges: 1 };
        deed('bad', '苦主联名把你告上了堂——衙役上门递了传票，街坊都看见了');
        log('⚖️ 衙役敲开了你的门：「堂上传你——苦主告你作奸犯科，三日后过堂！」（民愤热度 ' + heatNow() + ' 招来的官司；抗传三次，缺席定谳：罚银 ' + summonsFine() + ' 灵石、热度+2、脸进画影册）', 'danger');
        presentSummon();
    }
    function presentSummon() {
        if (!_st.summons) return false;
        var selfP = summonSelfP();
        var html = '<p class="text-sm text-gray-300 mb-2">司法堂的传票就压在案上——苦主告你作奸犯科，堂上要对质。三条路，条条明账：</p>' +
            '<button onclick="CaseSystem.answerSummons(\'lawyer\')" class="w-full p-3 rounded mb-2 text-left text-sm bg-amber-900 hover:bg-amber-800 text-white">💰 请讼师代辩（' + CFG.SUMMONS_LAWYER_COST + ' 灵石 · 胜诉率 ' + Math.round(CFG.SUMMONS_LAWYER_P * 100) + '%——讼师的门路熟）</button>' +
            '<button onclick="CaseSystem.answerSummons(\'self\')" class="w-full p-3 rounded mb-2 text-left text-sm bg-sky-900 hover:bg-sky-800 text-white">🗣️ 自己上堂辩解（分文不花 · 胜诉率 ' + Math.round(selfP * 100) + '%——吃你的口才学识）</button>' +
            '<button onclick="CaseSystem.answerSummons(\'plead\')" class="w-full p-3 rounded mb-2 text-left text-sm bg-gray-700 hover:bg-gray-600 text-white">🧎 认罪画押（罚银 ' + summonsFine() + ' 灵石当场缴清 · 热度-8、案卷就此销了——脸不进画影册）</button>' +
            '<p class="text-[11px] text-gray-500 mt-1">打输了：罚银照缴、热度+' + CFG.SUMMONS_LOSE_HEAT + '、当堂过了目——脸进画影册、声望-' + CFG.SUMMONS_LOSE_REP + '。抗传三次：缺席定谳，一样跑不了。</p>';
        try { if (typeof window.showModal === 'function') window.showModal('⚖️ 堂上传票 · 司法堂过堂', html); } catch (e) {}
        return true;
    }
    function summonSelfP() { return clamp(CFG.SUMMONS_SELF_BASE + Math.max(skill('口才'), skill('学识')) * CFG.SUMMONS_SELF_SKILL, 0.15, CFG.SUMMONS_SELF_CAP); }
    function answerSummons(choice) {
        if (!_st.summons) { say('⚖️ 传票已经了结了。', 'info'); return false; }
        var winP = 0, cost = 0;
        if (choice === 'lawyer') {
            cost = CFG.SUMMONS_LAWYER_COST;
            if (stonesNow() < cost) { say('⚖️ 请讼师要 ' + cost + ' 灵石——手头不足。（还能自己辩，或认罪画押）', 'warning'); return false; }
            winP = CFG.SUMMONS_LAWYER_P;
        } else if (choice === 'self') {
            winP = summonSelfP();
        } else if (choice === 'plead') {
            _st.summons = null;
            var fine0 = summonsFine();
            var paid0 = payMin(fine0);
            var short0 = fine0 - paid0;
            if (short0 > 0) { addHeat(2, '认罪的罚银都交不齐', { faceSeen: true }); }
            coolHeat(8, '认罪画押销案');
            log('⚖️ 你当堂认罪画押——罚银 ' + fine0 + ' 灵石' + (short0 > 0 ? '（尽力赔付 ' + paid0 + '，短 ' + short0 + '：连罚银都交不齐，堂上把你多看了两眼，脸进了画影册，热度+2）' : '缴清') + '。主簿把案卷一合：「既已认罚，此案销卷。」热度-8——认罪的态度，官府认。（脸没进画影册）', 'warning');
            say('⚖️ 认罪画押——罚银 ' + fine0 + ' 灵石，案子销了。（热度-8）', 'warning');
            refresh();
            return true;
        } else { say('⚖️ 堂上没这条路。', 'warning'); return false; }
        if (cost > 0) { var rp = settle({ stones: -cost }); if (!rp.ok) { say('⚖️ 讼师的谢仪付不出去。', 'warning'); return false; } }
        _st.summons = null;
        if (dice() < winP) {
            coolHeat(CFG.SUMMONS_WIN_COOL, '官司胜诉');
            log('⚖️ ' + (choice === 'lawyer' ? '讼师替你出庭，引经据典把苦主的状纸驳了个体无完肤' : '你自己在堂上不卑不亢，把每一条指控都对质了回去') + '——堂上判：证据不足，不予受理。（谢仪 ' + cost + ' 灵石' + (choice === 'lawyer' ? '花得值' : '分文没花') + '，热度-' + CFG.SUMMONS_WIN_COOL + '）', 'success');
            say('⚖️ 胜诉了——堂上不予受理。（热度-' + CFG.SUMMONS_WIN_COOL + '）', 'success');
        } else {
            var fine = summonsFine();
            var paid = payMin(fine);
            var short = fine - paid;
            addHeat(CFG.SUMMONS_LOSE_HEAT, '官司败诉当堂定谳', { faceSeen: true });
            repDown(CFG.SUMMONS_LOSE_REP);
            deed('bad', '你在司法堂输了官司，当堂定谳缴了罚银——堂上堂下都看清了你的脸');
            log('⚖️ 苦主的人证物证一样样呈上来，你辩无可辩——堂上定谳：罚银 ' + fine + ' 灵石' + (short > 0 ? '（尽力赔付 ' + paid + '，短 ' + short + '，罪加一等）' : '') + '、热度+' + CFG.SUMMONS_LOSE_HEAT + '、' + city() + '声望-' + CFG.SUMMONS_LOSE_REP + '。当堂过了目——脸进画影册。', 'danger');
            say('⚖️ 官司输了——罚银 ' + fine + ' 灵石，脸进画影册。（热度+' + CFG.SUMMONS_LOSE_HEAT + '）', 'error');
        }
        refresh();
        return true;
    }
    function defaultJudgement() {
        _st.summons = null;
        var fine = summonsFine();
        var paid = payMin(fine);
        var short = fine - paid;
        addHeat(2, '抗传不到缺席定谳', { faceSeen: true });
        log('⚖️ 三催不到——堂上缺席定谳：罚银 ' + fine + ' 灵石' + (short > 0 ? '（衙役上门搜缴，尽力赔付 ' + paid + '，短 ' + short + '，罪加一等）' : '') + '、热度+2，衙役画了你的影贴上榜。（抗传的代价，比过堂更贵）', 'danger');
        say('⚖️ 抗传三次——缺席定谳，罚银 ' + fine + ' 灵石。（脸进画影册）', 'error');
        refresh();
    }

    // ============ 新日总账（生成/受理张榜/传票/归档全订阅自动结，零按钮零追人） ============
    function dailyTick() {
        try { genCaseTick(); } catch (e) { console.warn('[静默失败] js/city-facilities/case-system.js · genCaseTick：新案没生成', e && e.message); }
        try { _reportTick(); } catch (eR) { console.warn('[静默失败] js/city-facilities/case-system.js · dailyTick：报官簿到点账没结', eR && eR.message); }   // v27.13 受理/张榜到点账
        try { syncPosts(); } catch (eS) { console.warn('[静默失败] js/city-facilities/case-system.js · dailyTick：榜单重建没成', eS && eS.message); }   // v27.13 读档后榜单重建
        try { summonsTick(); } catch (e2) { console.warn('[静默失败] js/city-facilities/case-system.js · summonsTick：传票的账没结', e2 && e2.message); }
    }
    try {
        if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') window.timeSystem.onNewDaySubscribe(dailyTick);
    } catch (eSub) {}

    // ============ 案卷房牌面 ============
    function casesOf(ct) {
        var key = pkCity(ct || city());
        return _st.cases.filter(function (c) { return c.city === key; });
    }
    function casesOk(ct) {
        var c = ct || city();
        if (!c) return false;
        try { if (window.locationSystem && window.locationSystem.getCityData && !window.locationSystem.getCityData(c)) return false; } catch (e) {}
        return true;
    }
    function open() {
        var ct = city();
        if (!ct) { say('⚖️ 先进城——司法堂的门槛在城里。', 'info'); return false; }
        var d = absDay();
        var html = '';
        // —— v27.13 报官簿（张榜半日流程：报官→核验半日→张榜；榜上只挂已张榜的）——
        try { _reportTick(); } catch (eRT) { console.warn('[静默失败] js/city-facilities/case-system.js · open：报官簿到点账没结——牌面照旧摊开', eRT && eRT.message); }
        try { syncPosts(); } catch (eSP) { console.warn('[静默失败] js/city-facilities/case-system.js · open：榜单重建没成', eSP && eSP.message); }
        html += '<p class="text-xs text-gray-300 font-bold mb-1">📮 报官簿（报官→核验半日→张榜——未张榜的，榜上查无此人）</p>';
        var myReports = reportsOf(ct).slice(-5).reverse();
        if (!myReports.length) html += '<p class="text-xs text-gray-500 mb-2">簿上无账——本城近来太平。</p>';
        myReports.forEach(function (r) {
            var T = CASE_TYPES[r.type] || { name: '案子', icon: '⚖️' };
            var leadLine = (r.witnessed && r.leadGiven && !r.leadSpent)
                ? '<p class="text-xs text-amber-300 mt-1">👀 你握着线索：' + r.culprit.look + '，多半窝在' + r.culprit.lair + '。</p>' : '';
            if (r.state === 'pending') {
                html += '<div class="p-2 rounded mb-2 border bg-gray-900/30 border-gray-700/50"><p class="text-sm text-gray-300">' + T.icon + ' ' + T.name + '——风声刚起，苦主还在奔走报官的路上。</p>';
                if (r.witnessed && r.leadGiven && !r.leadSpent) {
                    html += leadLine +
                        '<button onclick="CaseSystem.reportToYamen(\'' + r.caseId + '\')" class="w-full p-2 rounded mb-1 text-left text-xs bg-indigo-900 hover:bg-indigo-800 text-white">📮 报官陈情（精力 ' + CFG.FILE_EN + ' · 成则即刻受理、张榜提前；吃口才——案发一报只此一回）</button>' +
                        '<button onclick="CaseSystem.ambushCulprit(\'' + r.caseId + '\',\'private\')" class="w-full p-2 rounded mb-1 text-left text-xs bg-purple-900 hover:bg-purple-800 text-white">🤝 循线索堵人·私了（一个时辰赶路 · 真仗 · 赢了案犯掏钱买平安——榜不张、无官赏、因果-1）</button>' +
                        '<button onclick="CaseSystem.ambushCulprit(\'' + r.caseId + '\',\'deliver\')" class="w-full p-2 rounded mb-1 text-left text-xs bg-emerald-900 hover:bg-emerald-800 text-white">⚖️ 循线索堵人·抢先交案（一个时辰赶路 · 真仗 · 赢了捆送司法堂领赏格——赏银出自城基金）</button>' +
                        '<p class="text-[11px] text-gray-500 mt-1">目击红利只此一回：堵人成不成都花完。不行动的话，苦主报案、核验半日后张榜。</p>';
                } else {
                    html += '<p class="text-xs text-gray-500 mt-1">你没在场内，插不上手——等张榜就是。（未目击者只能等张榜）</p>';
                }
                html += '</div>';
            } else if (r.state === 'verify') {
                html += '<div class="p-2 rounded mb-2 border bg-blue-900/20 border-blue-800/50"><p class="text-sm text-blue-200">' + T.icon + ' ' + T.name + '——衙门查案中，半日后张榜（张榜之前，悬赏榜上查无此人）。</p>';
                if (r.witnessed && r.leadGiven && !r.leadSpent) {
                    html += leadLine +
                        '<button onclick="CaseSystem.ambushCulprit(\'' + r.caseId + '\',\'private\')" class="w-full p-2 rounded mb-1 text-left text-xs bg-purple-900 hover:bg-purple-800 text-white">🤝 循线索堵人·私了（一个时辰赶路 · 真仗 · 赢了案犯掏钱买平安——榜不张、无官赏、因果-1）</button>' +
                        '<button onclick="CaseSystem.ambushCulprit(\'' + r.caseId + '\',\'deliver\')" class="w-full p-2 rounded mb-1 text-left text-xs bg-emerald-900 hover:bg-emerald-800 text-white">⚖️ 循线索堵人·抢先交案（一个时辰赶路 · 真仗 · 赢了捆送司法堂领赏格——赏银出自城基金）</button>' +
                        '<p class="text-[11px] text-gray-500 mt-1">目击红利只此一回：堵人成不成都花完。</p>';
                }
                html += '</div>';
            } else if (r.state === 'posted') {
                // v27.13 走样话：跑过路的榜文补一句「闻已遁往别处」，遁远的直说石沉大海
                html += '<p class="text-xs text-gray-400 mb-1">🪧 ' + T.name + '已张榜——「要犯·' + r.culprit.name + '」赏格 ' + r.postedStones + ' 灵石，悬赏榜见。'
                    + (r.fledFar
                        ? '<span class="text-gray-500">（人已遁出千里，此单石沉大海——只等同行截单销案）</span>'
                        : ((r.flights || 0) > 0 ? '<span class="text-amber-300/80">（闻已遁往别处——窝点改指：' + r.culprit.lair + '。赏格照旧，赏随案走）</span>' : ''))
                    + '</p>';
            } else {
                var howTxt = (r.state === 'settled') ? '✅ 到案销账' : '📦 销账挂起';
                var howDetail = ({ private: '（私了放走——官府查无对证）', delivered: '（抢先交案）', bounty: '（榜上缉凶领赏）', accused: '（堂上画押）', snatched: '（同行截单拿人）', archived: '（卷宗归档）' })[r.settledHow] || '';
                html += '<p class="text-xs text-gray-600 mb-1">' + T.icon + ' ' + T.name + '——' + howTxt + howDetail + '</p>';
            }
        });
        html += '<div class="border-t border-gray-600 mt-2 pt-2 mb-2"></div>';
        // —— 案卷房（捕快权限）——
        html += '<p class="text-xs text-gray-300 font-bold mb-1">📁 案卷房（验看→问人→指认）</p>';
        if (!isConstable(ct)) {
            html += '<p class="text-xs text-gray-500 mb-2">🔒 案卷房重地，闲人免进——你身上没有号衣。先在「城里营生」应募本城<b>司法堂的捕快</b>，上岗才翻得着案卷（当差还有功绩钱）。墙外海捕牌不在此列，人人可揭。</p>';
        } else {
            var mine = casesOf(ct).filter(function (c) { return c.state === 'open'; });
            if (!mine.length) html += '<p class="text-xs text-gray-500 mb-2">架上没有未结的案卷——' + ct + '这几日太平。（案子隔三差五会报上来，你只管当你的差）</p>';
            mine.forEach(function (c) {
                var T = CASE_TYPES[c.type];
                var cold = isCold(c);
                var rwStones = Math.round(T.reward.stones * (cold ? CFG.COLD_MUL : 1));
                html += '<div class="p-2 rounded mb-2 border bg-blue-900/20 border-blue-800/50">' +
                    '<p class="text-sm text-blue-200 font-bold">' + T.icon + ' ' + T.name + (cold ? '<b class="text-cyan-300">（冷案——赏格上浮五成）</b>' : '') + ' <span class="text-xs text-gray-500">第 ' + c.filedDay + ' 日報案</span></p>' +
                    '<p class="text-xs text-gray-400 mt-1">' + c.brief + '</p>' +
                    '<p class="text-xs text-gray-400 mt-1">证物/口供：<b class="text-amber-300">' + c.clues + '</b> 条 · 赏格 ' + rwStones + ' 灵石+声望' + (T.reward.rep + (cold ? CFG.COLD_REP : 0)) + '+历练' + T.reward.exp + '+功绩钱' + CFG.CONSTABLE_COPPER + '铜</p>';
                // suspects 与排除
                var susLine = '';
                for (var i = 0; i < 3; i++) {
                    var cleared = c.clues >= 1 && c.ex[0] === i || c.clues >= 2 && c.ex[1] === i;
                    susLine += '<span class="inline-block mr-2 text-xs ' + (cleared ? 'text-gray-600 line-through' : 'text-gray-300') + '">' + c.culprits[i] + (cleared ? '（排除）' : '') + '</span>';
                }
                html += '<p class="text-xs text-gray-400 mt-1">堂上嫌疑三人：' + susLine + '</p>';
                var pNow = null;
                if (!c.examined) html += '<button onclick="CaseSystem.examine(\'' + c.id + '\')" class="w-full p-2 rounded mb-1 text-left text-xs bg-blue-800 hover:bg-blue-700 text-white">🔍 验看现场（精力 ' + CFG.EXAM_EN + ' · 两个时辰' + (skill('医术') >= CFG.WUZUO_NEED ? ' · 你有仵作的眼力：必得证+验尸钱 ' + CFG.WUZUO_FEE + ' 灵石' : ' · 六成得证（医术 ' + CFG.WUZUO_NEED + '+ 稳拿仵作钱）') + '）</button>';
                if (!c.questioned) html += '<button onclick="CaseSystem.question(\'' + c.id + '\')" class="w-full p-2 rounded mb-1 text-left text-xs bg-blue-800 hover:bg-blue-700 text-white">🗣️ 走访问人（精力 ' + CFG.QU_EN + ' · 两个时辰 · 成算 ' + Math.round(clamp(CFG.QU_BASE + skill('口才') * CFG.QU_MOUTH, 0.2, CFG.QU_CAP) * 100) + '%，吃口才）</button>';
                if (!c.accused) {
                    html += '<p class="text-xs text-gray-500 mt-1 mb-1">当堂指认（一案一次——指错案子就砸了，声望-3）：</p>';
                    for (var j = 0; j < 3; j++) {
                        var clearedJ = c.clues >= 1 && c.ex[0] === j || c.clues >= 2 && c.ex[1] === j;
                        if (clearedJ) continue;
                        html += '<button onclick="CaseSystem.accuse(\'' + c.id + '\',' + j + ')" class="w-full p-2 rounded mb-1 text-left text-xs bg-red-900 hover:bg-red-800 text-white">⚖️ 指认「' + c.culprits[j] + '」（成算 ' + Math.round(accuseP(c, j) * 100) + '%）</button>';
                    }
                } else {
                    html += '<p class="text-xs text-gray-500 mt-1">已画过押——等堂上发落。</p>';
                }
                html += '</div>';
            });
            var closed = casesOf(ct).filter(function (c) { return c.state !== 'open'; }).slice(-4);
            closed.forEach(function (c) {
                var T2 = CASE_TYPES[c.type];
                html += '<p class="text-xs text-gray-600 mb-1">' + T2.icon + ' ' + T2.name + '（第 ' + c.filedDay + ' 日）——' + (c.state === 'solved' ? '✅ 已破结' : c.state === 'botched' ? '❌ 办砸了' : '📦 销卷归档') + '</p>';
            });
        }
        // —— 墙外海捕牌（人人可揭）——
        html += '<div class="border-t border-gray-600 mt-2 pt-2"><p class="text-xs text-gray-300 font-bold mb-1">🪧 墙外海捕牌（缉逃犯领赏——不用当差，凭本事揭牌）</p>';
        var fugs = fugitiveOf(ct);
        if (!fugs.length) html += '<p class="text-xs text-gray-500 mb-1">这几日的海捕牌是空的——' + ct + '地界的亡命之徒要么被拿了，要么躲了风头。（牌面每七日一换）</p>';
        fugs.forEach(function (f, i) {
            html += '<button onclick="CaseSystem.huntFug(' + i + ')" class="w-full p-2 rounded mb-1 text-left text-sm bg-red-950 hover:bg-red-900 text-white">🪧 逃犯「' + f.name + '」（凶悍 ' + f.tier + ' 档 · 赏金 ' + f.bounty + ' 灵石——揭牌就是真仗，赢了当堂兑付、声望+' + CFG.FUG_WIN_REP + '，输了TA躲五日风头）</button>';
        });
        html += '</div>';
        // —— 偏厅词讼 ——
        html += '<div class="border-t border-gray-600 mt-2 pt-2"><p class="text-xs text-gray-300 font-bold mb-1">📝 偏厅词讼（一日一状）</p>';
        if (_st.summons) {
            html += '<p class="text-xs text-red-300 mb-1">⚠️ 你头上一张堂上传票未了——苦主告你作奸犯科（抗传三次缺席定谳：罚银 ' + summonsFine() + ' 灵石）。</p>' +
                '<button onclick="CaseSystem.presentSummon()" class="w-full p-2 rounded mb-1 text-left text-sm bg-red-900 hover:bg-red-800 text-white">⚖️ 过堂应讯（请讼师 / 自辩 / 认罪——三条路都明账）</button>';
        }
        var lawLock = isConstable(ct) ? '🔒 公门中人不得兼充讼师（利益回避）' : (skill('学识') < CFG.LAW_NEED ? '🔒 学识不足 ' + CFG.LAW_NEED + '（现 ' + skill('学识') + '）' : '');
        html += '<button onclick="CaseSystem.sueFor()" class="w-full p-2 rounded mb-1 text-left text-sm ' + (!lawLock && _st.lawDay !== d ? 'bg-indigo-900 hover:bg-indigo-800' : 'bg-gray-800 opacity-60') + ' text-white">🖋️ 替人代讼当讼师（学识 ' + CFG.LAW_NEED + ' 起步 · 胜诉率 ' + Math.round(clamp(CFG.LAW_BASE + skill('学识') * CFG.LAW_XUE + skill('口才') * CFG.LAW_MOUTH, 0.15, CFG.LAW_CAP) * 100) + '% · 赢：谢仪 ' + CFG.LAW_WIN_STONES + ' 灵石+声望' + CFG.LAW_WIN_REP + '，输：声望-1）' + (_st.lawDay === d ? '<span class="block text-xs text-amber-300">今日已代过一状</span>' : (lawLock ? '<span class="block text-xs text-gray-500">' + lawLock + '</span>' : '')) + '</button>';
        html += '<button onclick="CaseSystem.fileSuit()" class="w-full p-2 rounded mb-1 text-left text-sm ' + (_st.sueDay !== d ? 'bg-amber-900 hover:bg-amber-800' : 'bg-gray-800 opacity-60') + ' text-white">📜 自己递状告人（状纸费 ' + CFG.SUE_FEE + ' 灵石 · 胜诉率 ' + Math.round(clamp(CFG.SUE_BASE + skill('口才') * CFG.SUE_MOUTH + skill('学识') * CFG.SUE_XUE, 0.1, CFG.SUE_CAP) * 100) + '% · 赢：判赔 30 灵石净得 ' + CFG.SUE_WIN_NET + '，输：状纸费打水漂）' + (_st.sueDay === d ? '<span class="block text-xs text-amber-300">今日已递过状</span>' : '') + '</button>';
        html += '</div>';
        if (typeof window.showModal === 'function') window.showModal('⚖️ 司法堂 · 案卷房 · ' + ct, html);
        return true;
    }

    // ============ v27.13 张榜半日流程（模块⑧改良）：报官→核验（半日）→张榜 ============
    // 原漏洞：出事到上榜零时差（genCaseTick 立案赏格即现、悬赏榜即刷即接），目击者没有信息差红利。
    // 本账：案发先立报官账——苦主奔走的脚程到了才自动报案（REPORT_AUTO_DELAY_MIN）；受理后核验半日
    //   （VERIFY_MIN，衙门「查案中」），核验期悬赏榜上查无此人；半日到点才张榜（bounty-board.js 人犯单，
    //   赏格照走城基金 bountyMul/payBounty 正门，来源结算不碰）。目击者（案发在场五成撞见）核验期就拿到
    //   线索（长相/去向），可抢先堵人：私了（案犯自掏腰包，榜不张）或抢先交案（赏格照领）——线索一次花完、
    //   张榜即失效，不许变成无限情报。
    function _openReport(c) {
        if (!c || !c.id || reportByCase(c.id)) return null;
        var now = nowMin();
        var seed = seedOf(c.id + '_rep');
        var culprit = {
            name: c.culprits[c.real] || '无名氏',
            look: LOOKS[seed % LOOKS.length],
            lair: LAIRS[(seed >>> 3) % LAIRS.length],
            tier: 1 + ((seed >>> 6) % 3)
        };
        var r = {
            id: 'rep_' + c.id, caseId: c.id, city: c.city, type: c.type,
            bornMin: now, autoReportAt: now + CFG.REPORT_AUTO_DELAY_MIN,
            reportMin: 0, postAt: 0,
            brief: c.brief, culprit: culprit,
            bountyBase: 30 + culprit.tier * 20 + (seed >>> 9) % 15,   // 海捕牌同款明账：赏格档随凶悍走
            witnessed: false, leadGiven: false, leadSpent: false, filedTry: 0, filedBy: null,
            state: 'pending', settledHow: null, postedId: null, postedStones: 0,
            btyAccepted: false, btyCompleted: false, huntCoolDay: 0,
            // v27.13 后续人生账：flights=跑路次数（弃窝换地回数）、fledFar=遁远（石沉大海）、
            //   lastFleeDay=今日已掷过跑路骰、lastMoveMin=上次落窝的钟点（跑路节拍从这算）、
            //   escapes=脱身回数（战败/被截）、btyAcceptedAt=揭榜钟点（记恨钟从这算，-1=未揭）
            flights: 0, fledFar: false, lastFleeDay: 0, lastMoveMin: 0, escapes: 0, btyAcceptedAt: -1
        };
        // 目击判定：玩家在同城（genCaseTick 本就只在城里掷案发）——五成把案犯看了个真切
        if (dice() < CFG.WITNESS_P) {
            r.witnessed = true; r.leadGiven = true;
            log('👀 你恰在近处，把那案犯看了个真切——' + culprit.look + '。瞧那行色，多半窝在' + culprit.lair + '。（苦主还得奔走报官，你却已握着线索——抢先报官可催张榜，直接堵人可私了或交案；线索只有一回用）', 'success');
        }
        _st.reports.push(r);
        if (_st.reports.length > 40) _st.reports = _st.reports.slice(-40);
        return r;
    }
    function _dropReport(caseId, how) {
        var r = reportByCase(caseId);
        if (!r || r.state === 'settled' || r.state === 'dropped') return false;
        r.state = 'dropped'; r.settledHow = how || 'archived';
        return true;
    }
    function _settleReportByCase(caseId, how) {
        var r = reportByCase(caseId);
        if (!r || r.state === 'settled' || r.state === 'dropped') return false;
        r.state = 'settled'; r.settledHow = how || 'accused';
        if (how === 'accused') log('⚖️ 报官簿上的这一桩随堂上画押销了——人已到案，榜不必再张。', 'info');
        return true;
    }
    // 受理/张榜的到点账：pending→verify（苦主报案到衙门）、verify→posted（半日核验到点张榜）
    function _reportTick() {
        var now = nowMin();
        var changed = false;
        _st.reports.forEach(function (r) {
            if (r.state === 'pending' && now >= (r.autoReportAt || 0)) {
                r.state = 'verify'; r.reportMin = r.autoReportAt; r.postAt = r.reportMin + CFG.VERIFY_MIN;
                r.filedBy = r.filedBy || 'auto';
                log('🪧 ' + r.city + '的「' + CASE_TYPES[r.type].name + '」苦主的状子报到了衙门——查案中，半日后张榜。（张榜之前，悬赏榜上查无此人）', 'info');
                changed = true;
            }
            if (r.state === 'verify' && now >= (r.postAt || 0)) {
                if (_postReport(r)) changed = true;
            }
            if (r.state === 'posted') {
                try { if (_afterlifeTick(r)) changed = true; } catch (eAf) { console.warn('[静默失败] js/city-facilities/case-system.js · _reportTick：后续人生的到点账没结', eAf && eAf.message); }   // v27.13 跑路/记恨的到点账
            }
        });
        if (changed) refresh();
        return changed;
    }
    // 张榜：人犯上悬赏榜（bounty-board 正门）——赏格按城基金水位定档，来源与结算链不碰
    function _postReport(r) {
        var api = window.BountyBoardAPI;
        if (!api || typeof api.postPersonBounty !== 'function') return false;   // 榜未就绪：留在核验态，下轮再挂（不硬造榜）
        var pay = null;
        try { if (window.WorldLedger && typeof window.WorldLedger.bountyMul === 'function') pay = window.WorldLedger.bountyMul(r.city); } catch (eBM) { console.warn('[静默失败] js/city-facilities/case-system.js · _postReport：基金水位没读上——按满额挂', eBM && eBM.message); }
        var mul = (pay && pay.mul) || 0;
        var stones = Math.floor((r.bountyBase || 30) * mul);
        if (stones <= 0) {
            // 城基金见底：官府无力悬赏——文书压着发不出（与悬赏榜 fundMul=0 停挂同口径），半日后再看水位
            r.postAt = nowMin() + CFG.VERIFY_MIN;
            log('🪧 ' + r.city + '的赏金库见了底——「' + CASE_TYPES[r.type].name + '」的缉捕文书压着发不出去（官府无力悬赏）。', 'warning');
            return true;
        }
        var ok = false;
        try {
            ok = !!api.postPersonBounty({
                id: 'pbty_' + r.id, caseId: r.caseId, city: r.city, type: r.type,
                name: r.culprit.name, look: r.culprit.look, lair: r.culprit.lair, tier: r.culprit.tier,
                stones: stones, brief: r.brief, accepted: !!r.btyAccepted, completed: !!r.btyCompleted,
                flavor: _fleeFlavor(r), sank: !!r.fledFar   // v27.13 走样话随榜文重建一起走（读档后榜文不吃走样话）
            });
        } catch (ePost) { console.warn('[静默失败] js/city-facilities/case-system.js · _postReport：榜没挂上去——下轮再试', ePost && ePost.message); }
if (!ok) return false;
          r.state = 'posted'; r.postedId = 'pbty_' + r.id; r.postedStones = stones;
          r.lastMoveMin = nowMin();   // v27.13 跑路节拍从张榜这刻起走（三日一拍）
          log('🪧 张榜——' + r.city + '的悬赏榜挂出「要犯·' + r.culprit.name + '」，赏格 ' + stones + ' 灵石（赏银出自城中基金）。到这一刻，全城才知道那厮的长相去向。', 'info');
          // v27.25：海捕文书走消息总闸——本城立知，外城要等文书带话到站（消息跟着海捕文书走，不跟着榜走）
          try {
              if (window.WorldLedger && typeof window.WorldLedger.noteRumor === 'function') {
                  window.WorldLedger.noteRumor('「' + r.city + '」悬赏榜挂出要犯「' + r.culprit.name + '」——赏格 ' + stones + ' 灵石，海捕文书都发到邻县了。', 'bounty', r.city, '海捕文书');
              }
          } catch (eBtyNews) {}
          return true;
    }
    // 读档重建：榜（bounty-board）不存档——posted 报官账在榜上查无此单就按账重挂（赏格用原张榜数，不重掷）
    function syncPosts() {
        var changed = false;
        _st.reports.forEach(function (r) {
            if (r.state !== 'posted' || !r.postedId) return;
            var alive = false;
            try { alive = !!(window.BountyBoardAPI && typeof window.BountyBoardAPI.personBountyAlive === 'function' && window.BountyBoardAPI.personBountyAlive(r.postedId)); } catch (eAl) { alive = false; }
            if (!alive) {
                var api = window.BountyBoardAPI;
                var ok = false;
                try {
                    ok = !!(api && typeof api.postPersonBounty === 'function' && api.postPersonBounty({
                        id: r.postedId, caseId: r.caseId, city: r.city, type: r.type,
                        name: r.culprit.name, look: r.culprit.look, lair: r.culprit.lair, tier: r.culprit.tier,
                        stones: r.postedStones, brief: r.brief, accepted: !!r.btyAccepted, completed: !!r.btyCompleted,
                        flavor: _fleeFlavor(r), sank: !!r.fledFar   // v27.13 重建的榜文也带走样话与石沉大海的账
                    }));
                } catch (eRe) { console.warn('[静默失败] js/city-facilities/case-system.js · syncPosts：榜单重建没成', eRe && eRe.message); }
                if (ok) changed = true;
            }
        });
        return changed;
    }
    // 玩家报官（目击者）：口才成则状子即刻受理——核验早半日起步；败则空口无凭（案发一报，一回尝试）
    function reportToYamen(caseId) {
        var r = reportByCase(caseId);
        var ct = inCity();
        if (!r || !ct || r.city !== pkCity(ct)) { say('⚖️ 这桩案子不在这城的报官簿上。', 'info'); return false; }
        if (r.state !== 'pending') { say('⚖️ 这一桩衙门已经接状了——不必再报。', 'info'); return false; }
        if (!r.witnessed || !r.leadGiven) { say('⚖️ 你没瞧见案发，拿什么报官？（未目击者等张榜就是）', 'warning'); return false; }
        if (r.filedTry) { say('⚖️ 堂上记着你那一面之词了——空口无凭的事，一遍就够。等苦主的状子吧。', 'warning'); return false; }
        var c0 = cd();
        if (!c0 || Number(c0.energy) < CFG.FILE_EN) { say('⚖️ 精力不够走一趟司法堂（要 ' + CFG.FILE_EN + '）。', 'warning'); return false; }
        r.filedTry = 1;
        var p = clamp(CFG.FILE_BASE + skill('口才') * CFG.FILE_MOUTH, 0.2, CFG.FILE_CAP);
        advance(CFG.AMBUSH_MIN, '报官陈情');
        if (dice() < p) {
            r.state = 'verify'; r.reportMin = nowMin(); r.postAt = r.reportMin + CFG.VERIFY_MIN; r.filedBy = 'player';
            settle({ energy: -CFG.FILE_EN });
            log('⚖️ 你把亲眼所见一样样陈清——班头听得连连点头，状子当场受理：查案中，半日后张榜。（你的报官快过苦主的脚程——张榜提前了）', 'success');
            say('⚖️ 报官受理——衙门查案中，半日后张榜。', 'success');
        } else {
            settle({ energy: -CFG.FILE_EN });
            log('⚖️ 你说得急了些，班头皱眉：「一面之词，无凭无据。」状子压下了——等苦主自己来报吧。', 'warning');
            say('⚖️ 报官没受理——空口无凭。（口才 ' + Math.round(p * 100) + '% 的成算没掷中）', 'warning');
        }
        refresh();
        return true;
    }
    // 目击者堵人（核验期内、线索未花）：private=私了 / deliver=抢先交案——线索一次花完
    function ambushCulprit(caseId, mode) {
        if (window.currentBattle) { say('打着架呢——先了结手头这场。', 'warning'); return false; }
        var r = reportByCase(caseId);
        var ct = inCity();
        if (!r || !ct || r.city !== pkCity(ct)) { say('⚖️ 这桩案子不在这城的报官簿上。', 'info'); return false; }
        if (r.state !== 'pending' && r.state !== 'verify') { say('⚖️ 这一桩不在核验期里——要拿人，榜上去揭。', 'info'); return false; }
        if (!r.witnessed || !r.leadGiven || r.leadSpent) { say('⚖️ 你手里没有可用的线索了（目击红利只此一回）。', 'warning'); return false; }
        if (absDay() && r.huntCoolDay && absDay() < r.huntCoolDay) { say('⚖️ 那厮惊了窝，五日内堵不着——等风头过。', 'warning'); return false; }
        mode = (mode === 'deliver') ? 'deliver' : 'private';
        r.leadSpent = true;   // 线索一次花完：成不成都回不了头（不许变成无限情报）
        advance(CFG.AMBUSH_MIN, '循线索堵人');
        var started = false;
        try {
            if (window.NpcCrime && typeof window.NpcCrime.startFlaggedBattle === 'function') {
                started = window.NpcCrime.startFlaggedBattle(_caseEnemy(r),
                    { _isFugitiveHunt: true, _btyCaseId: r.caseId, _btyMode: mode, _btyPostedId: r.postedId || null },
                    mode === 'private'
                        ? '👀 你循着线索摸到' + r.culprit.lair + '——「' + r.culprit.name + '」见势不妙：「爷认栽，破财消灾如何？」'
                        : '👀 你循着线索堵到「' + r.culprit.name + '」——「官府还没出榜，你凭什么拿我？！」');
            } else { say('⚖️ 堵人的场面拉不起来——兵刃的账没接上。', 'warning'); }
        } catch (eAmb) { console.warn('[静默失败] js/city-facilities/case-system.js · ambushCulprit：这一仗没拉起来', eAmb && eAmb.message); }
        return started;
    }
    function _caseEnemy(r) {
        var tier = (r.culprit.tier || 1) + Math.max(1, playerTierNow());
        return {
            name: '案犯·' + r.culprit.name, type: 'elite', physiologyType: 'humanoid',
            level: tier * 3 + 2, attack: 28 + tier * 7, defense: 15 + tier * 4, speed: 20,
            maxDurability: 100 + tier * 20, durabilities: { chest: 100 + tier * 20 }, combatAbilities: []
        };
    }
    // 堵人/缉凶战收口（app.js 的 _isFugitiveHunt 钩子把仗打完送到 settleFugitiveHunt——已按 _btyCaseId 分流到这）
    function _settleCaseHunt(won) {
        try {
            var b = window.currentBattle;
            var mode = (b && b._btyMode) || 'private';
            var r = reportByCase((b && b._btyCaseId) || '');
            if (!r) return false;
            if (won) {
                if (mode === 'private') {
                    var loot = Math.floor((r.bountyBase || 30) * (CFG.PRIVATE_FRAC_MIN + dice() * CFG.PRIVATE_FRAC_RANGE));
                    settle({ stones: loot, karma: -1 }, '私了');
                    r.state = 'dropped'; r.settledHow = 'private';
                    deed('bad', '你循着自己才有的线索堵住了案犯，收了一笔私了钱放人走路——这事没过官府');
                    log('🤝 私了成了——「' + r.culprit.name + '」掏出 ' + loot + ' 灵石买平安，趁夜遁出城去。你收了钱没报官：衙门查无对证，榜不会张了。（因果-1——私了是把自己的正义卖了个价钱）', 'warning');
                    say('🤝 私了到手 +' + loot + ' 灵石——案犯遁走，官府这边销了指望。', 'warning');
                } else if (mode === 'deliver') {
                    var mul = 1;
                    try { if (window.WorldLedger && typeof window.WorldLedger.bountyMul === 'function') mul = window.WorldLedger.bountyMul(r.city).mul || 0; } catch (eM) { console.warn('[静默失败] js/city-facilities/case-system.js · _settleCaseHunt：基金水位没读上', eM && eM.message); }
                    var stones = Math.floor((r.bountyBase || 30) * mul);
                    var paid = 0;
                    if (stones > 0) {
                        try { if (window.WorldLedger && typeof window.WorldLedger.payBounty === 'function') paid = window.WorldLedger.payBounty(r.city, stones).paid || 0; } catch (eP) { console.warn('[静默失败] js/city-facilities/case-system.js · _settleCaseHunt：赏格没从基金扣成', eP && eP.message); }
                    }
                    if (paid > 0) settle({ stones: paid, exp: CFG.FUG_WIN_EXP, rep: CFG.FUG_WIN_REP, karma: 1 }, '抢先交案');
                    else settle({ exp: CFG.FUG_WIN_EXP, rep: CFG.FUG_WIN_REP, karma: 1 }, '抢先交案');
                    r.state = 'settled'; r.settledHow = 'delivered';
                    deed('good', '你循着自己才有的线索抢先拿住了案犯，扭送官府——榜还没张，人就到了案');
                    log(paid > 0
                        ? '⚖️ 抢先交案——「' + r.culprit.name + '」被你捆进了司法堂，堂上惊叹：状子还没发榜，人先到了！赏格 ' + stones + ' 灵石' + (paid < stones ? '（基金吃紧按实有折付 ' + paid + '——官府不赊账）' : '（赏银出自城中基金）') + '，历练+' + CFG.FUG_WIN_EXP + '、本城声望+' + CFG.FUG_WIN_REP + '、因果+1。'
                        : '⚖️ 抢先交案——「' + r.culprit.name + '」被你捆进了司法堂。城中赏金见底，堂上给你记了功（历练+' + CFG.FUG_WIN_EXP + '、声望+' + CFG.FUG_WIN_REP + '、因果+1），赏银却发不出——官府不赊账。', 'success');
                    say('⚖️ 抢先交案——赏格 ' + paid + ' 灵石落袋，榜都不必张了。', 'success');
                } else {   // bounty：张榜后的缉凶——赢了回榜领赏（结算走 claimBounty 的基金正门）
                    // v27.13 护法拦路：接单缉凶掷中的那一仗（_btyGuardPend），人按倒了护法的刀横在跟前——
                    //   赢了护法这一仗才谈拿人；护法被杀不影响赏银结算口径——赏是拿人的钱。
                    var bEnd = window.currentBattle;
                    if (bEnd && bEnd._btyGuardPend && !bEnd._btyGuard) {
                        log('🪧 你把「' + r.culprit.name + '」按倒在地——斜刺里护法的兵刃架住了你的手腕：「动我家主子试试！」（拿下人犯，先过他这一关）', 'warning');
                        say('🪧 护法拦路——先撂倒他，才拿得住人。', 'warning');
                        var _ended = bEnd;
                        setTimeout(function () {
                            try {
                                // 只避真仗：手头要是另开了新仗，护法抢人遁走（_ended 是刚收场的那仗——榜上还压着它的结算屏）
                                if (window.currentBattle && window.currentBattle !== _ended) { _guardSlipsAway(r); return; }
                                // 结算屏没关（真机 closeBattle 要等玩家点「继续」）：那仗已收场，清掉陈尸引用再开护法仗——
                                // 否则 startFlaggedBattle 见 currentBattle 未清必拒，护法永远白拦
                                if (window.currentBattle === _ended) { try { window.currentBattle = null; } catch (eCl) {} }
                                var startedG = false;
                                if (window.NpcCrime && typeof window.NpcCrime.startFlaggedBattle === 'function') {
                                    startedG = window.NpcCrime.startFlaggedBattle(_guardEnemy(r),
                                        { _isFugitiveHunt: true, _btyCaseId: r.caseId, _btyMode: 'bounty', _btyPostedId: r.postedId, _btyGuard: true },
                                        '🪧 护法拦路——「想拿人，先过我！」（护法被杀不影响赏银：赏是拿人的钱）');
                                }
                                if (!startedG) _guardSlipsAway(r);
                            } catch (eG) { console.warn('[静默失败] js/city-facilities/case-system.js · _settleCaseHunt：护法这一仗没拉起来', eG && eG.message); _guardSlipsAway(r); }
                        }, 1500);
                        refresh();
                        return true;
                    }
                    r.btyCompleted = true;
                    var done = false;
                    try { done = !!(window.BountyBoardAPI && typeof window.BountyBoardAPI.completePersonBounty === 'function' && window.BountyBoardAPI.completePersonBounty(r.postedId)); } catch (eC) { console.warn('[静默失败] js/city-facilities/case-system.js · _settleCaseHunt：榜单没勾成', eC && eC.message); }
                    log(done ? '🪧 你把「' + r.culprit.name + '」按倒捆了个结实——回悬赏榜领赏去吧（赏银出自城中基金）。' : '🪧 「' + r.culprit.name + '」被你拿下——榜单的账没勾上，去悬赏榜看看再领。', 'success');
                    say('🪧 拿住了「' + r.culprit.name + '」——回悬赏榜领赏。', 'success');
                }
            } else {
                r.huntCoolDay = (absDay() || 0) + CFG.HUNT_COOL_DAYS;
                r.escapes = (Number(r.escapes) || 0) + 1;   // v27.13 战败未拿人——脱身回数+1，梁子记账
                settle({ qi: -CFG.FUG_LOSE_QI });
                log('🪧 「' + r.culprit.name + '」到底滑溜——你败下阵来，那厮趁乱遁走（真气-' + CFG.FUG_LOSE_QI + '）。五日内堵他不着' + (r.state === 'posted' ? '，榜还挂着——养好伤再揭，或等同行先下手。' : '，等张榜再说。') + ((Number(r.escapes) || 0) >= CFG.REVENGE_ESCAPES ? '（他已是两番脱身——这梁子，他记下了）' : ''), 'danger');
                say('🪧 堵人失手——那厮躲了五日风头。', 'error');
                try { _tryRevenge(r, 'escaped'); } catch (eRev) { console.warn('[静默失败] js/city-facilities/case-system.js · _settleCaseHunt：脱身后的反咬账没结', eRev && eRev.message); }
            }
            refresh();
            return true;
        } catch (e) { console.warn('[静默失败] js/city-facilities/case-system.js · _settleCaseHunt：这一仗的账没接住', e && e.message); return false; }
    }
    // 榜单侧回调：揭榜回写（读档重建保接取态）/ 领赏或被同行截单后勾报官账
    function onPersonAccepted(postedId) {
        for (var i = 0; i < _st.reports.length; i++) {
            var r = _st.reports[i];
            if (r.postedId === postedId && r.state === 'posted') {
                r.btyAccepted = true;
                if (!(Number(r.btyAcceptedAt) >= 0)) r.btyAcceptedAt = nowMin();   // v27.13 记恨钟从揭榜这刻起走（接单十日不交，案犯记恨）
                return true;
            }
        }
        return false;
    }
    function onPersonSettled(postedId, how) {
        for (var i = 0; i < _st.reports.length; i++) {
            var r = _st.reports[i];
            if (r.postedId === postedId && r.state === 'posted') {
                r.state = 'settled';
                r.settledHow = (how === 'snatched') ? 'snatched' : 'bounty';
                if (how === 'snatched') {
                    r.btyCompleted = false;
                    r.escapes = (Number(r.escapes) || 0) + 1;   // v27.13 被同行截走后逍遥——也算他脱身一回，梁子照记
                    try { _tryRevenge(r, 'escaped'); } catch (eRev) { console.warn('[静默失败] js/city-facilities/case-system.js · onPersonSettled：截单后的反咬账没结', eRev && eRev.message); }
                }
                return true;
            }
        }
        return false;
    }
    function personHuntOk(caseId) {
        var r = reportByCase(caseId);
        if (!r) return true;
        if (r.fledFar) return false;   // v27.13 遁远：缉捕文书追不出千里——此单只等同行截单销案
        var d = absDay();
        return !(d && r.huntCoolDay && d < r.huntCoolDay);
    }
    function reportsOf(ct) {
        var key = pkCity(ct || city());
        return _st.reports.filter(function (r) { return r.city === key; });
    }

    // ============ v27.13 悬赏的后续人生（模块⑧）：悬赏目标也是活人 ============
    // 三条命，各有账、各有度：
    //   ①跑路——张榜三日（FLEE_DAYS，文书贴出去三天案犯自己也看得到榜）无人交人，每日一骰弃窝换地：
    //     lair 线索失效重掷（种子随案卷+第几次跑路——重掷后同案线索仍恒定），榜文/牌面补走样话，
    //     赏格不重置不缩水（赏随案走）；每案至多 FLEE_MAX 回，第三回到点即遁远——石沉大海，只等同行截单销案。
    //   ②护法——接了单（btyAccepted）的缉凶战，围堵/拿人这一步按案犯凶悍档掷概率多一个护法敌
    //     （榜侧 huntPerson 掷骰挂 _btyGuardPend，收场在此排第二仗；护法敌数据走缉凶同款人形敌型，不造新表）；
    //     护法被杀不影响赏银结算口径——赏是拿人的钱。
    //   ③反咬——两度脱身（缉凶战败/被同行截走后逍遥）或揭榜十日不交，案犯盯上报官人/拿他的人：
    //     报复事件走现有正门（入册的走宿敌遭遇 duelRival，册上无名的走下毒伤身），不造新战斗系统；
    //     凶悍三档（NEMESIS_TIER_MIN）正式入宿敌册（npcManager.addNPC+仇恨入骨——此后 rivalry-chain 寻仇、
    //     cave-siege 夜袭都认得他，悬赏→宿敌桥）；报复事件全档月频至多一次、一案犯一生一次，不许变刷怪器。
    // 张榜走样话（榜文/重建共用一句——跑过路说跑过路的话，遁远了说遁远了的话）
    function _fleeFlavor(r) {
        if (!r) return '';
        if (r.fledFar) return '……文书上添了笔：人已遁出千里，此单石沉大海，只等同行销案。';
        if ((r.flights || 0) > 0) return '闻已遁往别处——画影上的窝点作废，线报改指：' + (r.culprit && r.culprit.lair || '外乡') + '。赏格照旧。';
        return '';
    }
    // 跑路后的新窝点：按案卷 id+第几次跑路播种——同案同次永远掷出同一个窝（线索是真线索，不是现编）
    function _fleeLair(repId, nth, oldLair) {
        var idx = seedOf(repId + '_flee' + nth) % LAIRS.length;
        if (LAIRS[idx] === oldLair) idx = (idx + 1 + nth) % LAIRS.length;   // 撞了旧窝就顺位挪——确定性不变
        return LAIRS[idx];
    }
    // 跑路（只动报官账与榜文，赏银分毫不动）
    function _flee(r) {
        if (!r || r.fledFar || r.btyCompleted) return false;
        if ((r.flights || 0) >= CFG.FLEE_MAX) {
            // 第三回到点：遁远——石沉大海。榜文封死缉捕、接取作废（同行竞速照旧，截单即销案）
            r.fledFar = true;
            r.lastMoveMin = nowMin();
            var wasAccepted = !!r.btyAccepted;
            r.btyAccepted = false;
            try {
                if (window.BountyBoardAPI && typeof window.BountyBoardAPI.updatePersonBounty === 'function') {
                    window.BountyBoardAPI.updatePersonBounty(r.postedId, { sank: true, flavor: _fleeFlavor(r) });
                }
            } catch (eUp) { console.warn('[静默失败] js/city-facilities/case-system.js · _flee：榜文没改成石沉大海——下轮 syncPosts 补', eUp && eUp.message); }
            log('🪧 「' + r.culprit.name + '」这回遁得远了——画影图形追不出千里，缉捕文书成了废纸，此单石沉大海。' + (wasAccepted ? '官府也只得撤了你的接取——' : '') + '同行还在各处踩点：这案子迟早让同行销了。（赏格悬着没人领得走）', 'warning');
            return true;
        }
        // 弃窝换地：lair 失效重掷（look 不变——容貌没改，去向变了）；赏格不重置不缩水
        r.flights = (Number(r.flights) || 0) + 1;
        r.culprit.lair = _fleeLair(r.id, r.flights, r.culprit.lair);
        r.lastMoveMin = nowMin();
        try {
            if (window.BountyBoardAPI && typeof window.BountyBoardAPI.updatePersonBounty === 'function') {
                window.BountyBoardAPI.updatePersonBounty(r.postedId, { lair: r.culprit.lair, flavor: _fleeFlavor(r) });
            }
        } catch (eUp2) { console.warn('[静默失败] js/city-facilities/case-system.js · _flee：榜文没改成新窝点——下轮 syncPosts 补', eUp2 && eUp2.message); }
        log('🪧 榜上「' + r.culprit.name + '」闻已遁往别处——画影上的窝点作废，线报改指：' + r.culprit.lair + '。（赏格照旧 ' + r.postedStones + ' 灵石——赏随案走，案犯搬家不折价）', 'warning');
        return true;
    }
    // 护法敌（缉凶同款人形敌型，硬一档——保镖是案犯花赏钱雇的，不是天上掉的）
    function _guardEnemy(r) {
        var tier = (r.culprit.tier || 1) + Math.max(1, playerTierNow()) + 1;
        return {
            name: '护法·' + r.culprit.name, type: 'elite', physiologyType: 'humanoid',
            level: tier * 3 + 3, attack: 30 + tier * 7, defense: 17 + tier * 4, speed: 22,
            maxDurability: 110 + tier * 20, durabilities: { chest: 110 + tier * 20 }, combatAbilities: []
        };
    }
    // 护法抢人遁走：人没拿成，账照记（不扣真气——案犯那一仗你是赢了的）
    function _guardSlipsAway(r) {
        try {
            r.escapes = (Number(r.escapes) || 0) + 1;
            r.huntCoolDay = (absDay() || 0) + CFG.HUNT_COOL_DAYS;
            log('🪧 护法架起「' + r.culprit.name + '」夺路而走——人没拿成（五日内堵他不着' + ((Number(r.escapes) || 0) >= CFG.REVENGE_ESCAPES ? '；他已是两番脱身，这梁子记下了' : '') + '）。', 'danger');
            try { _tryRevenge(r, 'escaped'); } catch (eRev) { console.warn('[静默失败] js/city-facilities/case-system.js · _guardSlipsAway：反咬账没结', eRev && eRev.message); }
            refresh();
        } catch (e) { console.warn('[静默失败] js/city-facilities/case-system.js · _guardSlipsAway：护法抢人的账没落下', e && e.message); }
    }
    // 仇账（'城|名' 一案犯一页——案卷簿会裁旧页，仇账不跟着蒸发）
    function _ensureVendetta(key, r) {
        var v = _st.vendetta[key];
        if (!v) {
            if (Object.keys(_st.vendetta).length >= 80) {   // 仇账也讲卫生：八十页封顶，最老的先销（梁子了没了的，日子说了算）
                var oldest = null, oldestDay = Infinity;
                for (var k in _st.vendetta) {
                    var born = (Number(_st.vendetta[k].bornDay) || 0);
                    if (born < oldestDay) { oldestDay = born; oldest = k; }
                }
                if (oldest) delete _st.vendetta[oldest];
            }
            v = _st.vendetta[key] = {
                name: r.culprit.name, city: pkCity(r.city), tier: r.culprit.tier || 1,
                escapes: 0, done: false, nemesisDone: false, npcId: null, bornDay: absDay() || 0, lastDay: 0
            };
        }
        v.escapes = Math.max(Number(v.escapes) || 0, Number(r.escapes) || 0);
        return v;
    }
    // 入宿敌册（悬赏→宿敌桥）：造个真 NPC 挂进 npcManager，仇恨入骨——
    // 此后 rivalry-chain 的寻仇、cave-siege 的夜袭自会认他（都是现成 loops，这里只递名字）
    function _registerNemesis(r, key, v) {
        try {
            if (!window.npcManager || typeof window.npcManager.addNPC !== 'function' || typeof window.NPC !== 'function') return null;
            var npcId = 'vend_' + key.replace('|', '_');
            if (window.npcManager.getNPC && window.npcManager.getNPC(npcId)) return npcId;   // 已在册（读档回环）：幂等
            var femaleGivens = ['秀娥', '玉梅', '素贞', '巧姑'];
            var isFemale = femaleGivens.some(function (g) { return String(v.name || '').indexOf(g) >= 0; });
            var npc = new window.NPC(npcId, v.name, {
                gender: isFemale ? 'female' : 'male',
                age: 25 + (seedOf(key) >>> 4) % 20,
                occupation: '惯匪',
                location: v.city, homeLocation: v.city,
                appearance: { features: (r.culprit && r.culprit.look) || '面容凶悍' },
                background: {
                    origin: '市井', family: '',
                    history: '在' + v.city + '犯下官司被张榜缉拿，两番从缉捕手里脱身——从此记恨拿他的人。',
                    goal: '找回场子', secret: ''
                },
                combat: { level: 10 + (v.tier || 1) * 8, realm: '炼气', layer: 1, attack: 30 + (v.tier || 1) * 8, defense: 20 + (v.tier || 1) * 5, speed: 22, skills: [] }
            });
            if (!npc) return null;
            if (npc.relationship) { npc.relationship.hatred = 75; npc.relationship.trust = 0; }   // 仇恨>60 即入宿敌名单（rivalry-chain 口径）
            if (!window.npcManager.addNPC(npc)) return null;
            log('🗡️ 「' + v.name + '」两番从你手里脱身——这厮把你记进了仇账。江湖上从此多一宿敌：恨你入骨，往后寻仇、夜袭，都有他一份。', 'danger');
            return npcId;
        } catch (e) { console.warn('[静默失败] js/city-facilities/case-system.js · _registerNemesis：宿敌册没入成', e && e.message); return null; }
    }
    // 报复一回：入册的走宿敌遭遇正门（duelRival——寻仇决战，app.js _isRivalDuel 收场接线），
    // 册上无名的走下毒（RewardService 伤身，不造新战斗系统）
    function _revengeStrike(r, v, why) {
        var nm = v.name || (r.culprit && r.culprit.name) || '案犯';
        var whyTxt = (why === 'grudge') ? '你接了他的单却迟迟不交人' : '你两番拿他不着，反倒让他记了仇';
        if (v.npcId && window.npcManager && typeof window.npcManager.getNPC === 'function' &&
            window.npcManager.getNPC(v.npcId) && typeof window.duelRival === 'function') {
            setTimeout(function () {   // 延一步开打（rivalry-chain 同款：别在跨日结算的同步循环里落杀气）
                try {
                    if (window.currentBattle) return;   // 手头有仗：这回寻仇作罢（done 已记，不追第二次）
                    window.duelRival(v.npcId);
                } catch (eDuel) { console.warn('[静默失败] js/city-facilities/case-system.js · _revengeStrike：宿敌寻仇没打起来', eDuel && eDuel.message); }
            }, 1500);
            log('🗡️ 记恨成了刀——「' + nm + '」摸清了你的落脚处，寻上门来讨这笔账（' + whyTxt + '）。', 'danger');
            return true;
        }
        var hurt = CFG.POISON_HP + (v.tier || 1) * CFG.POISON_HP_TIER;
        settle({ health: -hurt, mood: -2 }, '仇家下毒');
        log('☠️ 茶饭里多了一股杏仁味——「' + nm + '」买通的店伙下了药（气血-' + hurt + '、心境-2）。（' + whyTxt + '——街坊都说，这是缉凶招来的祸）', 'danger');
        say('☠️ 中了暗算——「' + nm + '」对你下了毒手。（气血-' + hurt + '）', 'error');
        return true;
    }
    // 反咬总闸：够格才结梁子，够格才报复——月频一闸、一生一次，入册不占月频（入册本身不动刀）
    function _tryRevenge(r, why) {
        if (!r || !r.culprit) return false;
        if (r.btyCompleted) return false;   // 人已到案：谈不上反咬
        if ((r.state === 'settled' || r.state === 'dropped') && r.settledHow !== 'snatched') return false;   // 销账的案子，只有「被同行截走后逍遥」还咬得着人
        var d = absDay();
        if (!d || !cd()) return false;
        var key = pkCity(r.city) + '|' + r.culprit.name;
        var v = _ensureVendetta(key, r);
        if (why !== 'grudge' && (Number(r.escapes) || 0) < CFG.REVENGE_ESCAPES) return false;   // 两度脱身才结梁子
        if (v.done) return false;   // 一生一次级别：报过了就是报过了
        if ((v.tier || 1) >= CFG.NEMESIS_TIER_MIN && !v.nemesisDone) {   // 悬赏→宿敌桥：够格的入正册（NPC 随 npcManager 自家存档走）
            var npcId = _registerNemesis(r, key, v);
            if (npcId) { v.nemesisDone = true; v.npcId = npcId; }
        }
        if (_st.vendLastDay && d - _st.vendLastDay < CFG.VENDETTA_MONTH_DAYS) return false;   // 报复事件全档月频至多一次
        var hit = _revengeStrike(r, v, why);
        v.done = true; v.lastDay = d;
        _st.vendLastDay = d;
        return hit;
    }
    // 后续人生的到点账（挂在报官簿日账下——张榜态才走）：跑路一骰、记恨一查，各有一日一次的闸
    function _afterlifeTick(r) {
        if (!r || r.state !== 'posted' || r.fledFar || r.btyCompleted) return false;
        var today = absDay();
        if (!today) return false;
        var changed = false;
        // ①跑路：张榜三日到点后每日一骰（lastFleeDay 一日一骰；lastMoveMin 保证两番跑路间至少隔 FLEE_DAYS）
        if (r.lastFleeDay !== today) {
            r.lastFleeDay = today;
            var since = nowMin() - (Number(r.lastMoveMin) || 0);
            if (since >= CFG.FLEE_DAYS * 1440 && dice() < CFG.FLEE_P) {
                changed = _flee(r);
            }
        }
        // ③记恨：揭榜十日不交——案犯盯上挂名拿他的人（一生一次+月频闸都在 _tryRevenge 里）
        if (!r.fledFar && r.btyAccepted && !r.btyCompleted && Number(r.btyAcceptedAt) >= 0 &&
            nowMin() - Number(r.btyAcceptedAt) >= CFG.GRUDGE_DAYS * 1440) {
            try { _tryRevenge(r, 'grudge'); } catch (eGr) { console.warn('[静默失败] js/city-facilities/case-system.js · _afterlifeTick：记恨的账没结', eGr && eGr.message); }
        }
        return changed;
    }

    // ============ 存读档（StateRegistry 正门，读档归一化：坏账不进门） ============
    function _export() { return JSON.parse(JSON.stringify(_st)); }
    function _import(d) {
        var s = { cases: [], reports: [], caught: {}, fugCool: {}, vendetta: {}, vendLastDay: 0, sueDay: 0, lawDay: 0, summons: null, lastSummonDay: 0, lastGenDay: 0, solved: 0 };
        if (d && typeof d === 'object') {
            ['sueDay', 'lawDay', 'lastSummonDay', 'lastGenDay', 'solved'].forEach(function (k) {
                s[k] = Number.isFinite(Number(d[k])) ? Math.max(0, Math.floor(Number(d[k]))) : 0;
            });
            if (Array.isArray(d.cases)) {
                d.cases.forEach(function (c) {
                    if (s.cases.length >= 60) return;
                    if (!c || typeof c !== 'object') return;
                    if (typeof c.city !== 'string' || !c.city || !CASE_TYPES[c.type]) return;
                    if (!Array.isArray(c.culprits) || c.culprits.length !== 3 || !c.culprits.every(function (n) { return typeof n === 'string' && n; })) return;
                    var real = Math.floor(Number(c.real));
                    if (!(real >= 0 && real <= 2)) return;
                    var ex = Array.isArray(c.ex) ? c.ex.filter(function (i) { return i !== real && i >= 0 && i <= 2; }).slice(0, 2) : [0, 1, 2].filter(function (i) { return i !== real; });
                    s.cases.push({
                        id: String(c.id || ('case_' + c.city + '_' + (Number(c.filedDay) || 0))).slice(0, 60),
                        city: c.city.slice(0, 30), type: c.type, filedDay: Math.max(0, Math.floor(Number(c.filedDay) || 0)),
                        brief: String(c.brief || '').slice(0, 200), culprits: c.culprits.map(function (n) { return n.slice(0, 20); }),
                        real: real, ex: ex,
                        clues: clamp(Math.floor(Number(c.clues) || 0), 0, 9),
                        examined: Number(c.examined) ? 1 : 0, questioned: Number(c.questioned) ? 1 : 0, accused: Number(c.accused) ? 1 : 0,
                        state: ['open', 'solved', 'botched', 'archived'].indexOf(c.state) >= 0 ? c.state : 'open'
                    });
                });
            }
            // v27.13 报官簿：旧档缺 reports 键自动补空（=无在核案件，照旧）——version 仍 1，不升存档版本号
            if (Array.isArray(d.reports)) {
                d.reports.forEach(function (r) {
                    if (s.reports.length >= 60) return;
                    if (!r || typeof r !== 'object') return;
                    if (!r.id || !r.caseId) return;
                    var cul = (r.culprit && typeof r.culprit === 'object') ? r.culprit : {};
                    s.reports.push({
                        id: String(r.id).slice(0, 80),
                        caseId: String(r.caseId).slice(0, 60),
                        city: String(r.city || '').slice(0, 30),
                        type: CASE_TYPES[r.type] ? r.type : 'theft',
                        bornMin: Math.max(0, Math.floor(Number(r.bornMin) || 0)),
                        autoReportAt: Math.max(0, Math.floor(Number(r.autoReportAt) || 0)),
                        reportMin: Math.max(0, Math.floor(Number(r.reportMin) || 0)),
                        postAt: Math.max(0, Math.floor(Number(r.postAt) || 0)),
                        brief: String(r.brief || '').slice(0, 200),
                        culprit: {
                            name: String(cul.name || '无名氏').slice(0, 20),
                            look: String(cul.look || '').slice(0, 60),
                            lair: String(cul.lair || '').slice(0, 60),
                            tier: clamp(Math.floor(Number(cul.tier) || 1), 1, 9)
                        },
                        bountyBase: Math.max(0, Math.floor(Number(r.bountyBase) || 0)),
                        witnessed: !!r.witnessed, leadGiven: !!r.leadGiven, leadSpent: !!r.leadSpent,
                        filedTry: Number(r.filedTry) ? 1 : 0,
                        filedBy: ['auto', 'player'].indexOf(r.filedBy) >= 0 ? r.filedBy : null,
                        state: ['pending', 'verify', 'posted', 'settled', 'dropped'].indexOf(r.state) >= 0 ? r.state : 'pending',
                        settledHow: ['private', 'delivered', 'bounty', 'accused', 'snatched', 'archived'].indexOf(r.settledHow) >= 0 ? r.settledHow : null,
                        postedId: (String(r.postedId || '').slice(0, 80)) || null,
                        postedStones: Math.max(0, Math.floor(Number(r.postedStones) || 0)),
                        btyAccepted: !!r.btyAccepted, btyCompleted: !!r.btyCompleted,
                        huntCoolDay: Math.max(0, Math.floor(Number(r.huntCoolDay) || 0)),
                        // v27.13 后续人生账：旧档缺键自动补空（flights=0/fledFar=false/escapes=0=无后续人生，照旧）——version 仍 1 不升存档版本号
                        flights: clamp(Math.floor(Number(r.flights) || 0), 0, 9),
                        fledFar: !!r.fledFar,
                        lastFleeDay: Math.max(0, Math.floor(Number(r.lastFleeDay) || 0)),
                        lastMoveMin: Math.max(0, Math.floor(Number.isFinite(Number(r.lastMoveMin)) ? Number(r.lastMoveMin) : (Number(r.postAt) || 0))),
                        escapes: clamp(Math.floor(Number(r.escapes) || 0), 0, 9),
                        btyAcceptedAt: Number.isFinite(Number(r.btyAcceptedAt)) ? Math.max(-1, Math.floor(Number(r.btyAcceptedAt))) : -1
                    });
                });
            }
            // v27.13 仇账：旧档缺键补空账——无后续人生，照旧；页内坏字段按默认归一（坏账不进门）
            if (d.vendetta && typeof d.vendetta === 'object') {
                var nV = 0;
                for (var vk in d.vendetta) {
                    if (nV++ >= 80) break;
                    var vv = d.vendetta[vk];
                    if (!vv || typeof vv !== 'object' || !vv.name) continue;
                    s.vendetta[String(vk).slice(0, 80)] = {
                        name: String(vv.name).slice(0, 20),
                        city: String(vv.city || '').slice(0, 30),
                        tier: clamp(Math.floor(Number(vv.tier) || 1), 1, 9),
                        escapes: clamp(Math.floor(Number(vv.escapes) || 0), 0, 9),
                        done: !!vv.done, nemesisDone: !!vv.nemesisDone,
                        npcId: vv.npcId ? String(vv.npcId).slice(0, 60) : null,
                        bornDay: Math.max(0, Math.floor(Number(vv.bornDay) || 0)),
                        lastDay: Math.max(0, Math.floor(Number(vv.lastDay) || 0))
                    };
                }
            }
            s.vendLastDay = Math.max(0, Math.floor(Number(d.vendLastDay) || 0));
            ['caught', 'fugCool'].forEach(function (mk) {
                if (d[mk] && typeof d[mk] === 'object') {
                    var n = 0;
                    for (var k in d[mk]) {
                        if (n++ >= 200) break;
                        if (Number.isFinite(Number(d[mk][k]))) s[mk][String(k).slice(0, 60)] = Math.max(0, Math.floor(Number(d[mk][k])));
                    }
                }
            });
            var sm = d.summons;
            if (sm && typeof sm === 'object' && Number.isFinite(Number(sm.filedDay))) {
                s.summons = { filedDay: Math.max(0, Math.floor(Number(sm.filedDay))), nudges: clamp(Math.floor(Number(sm.nudges) || 0), 0, CFG.SUMMONS_NUDGE) };
            }
        }
        _st = s;
    }
    function _reset() { _st = { cases: [], reports: [], caught: {}, fugCool: {}, vendetta: {}, vendLastDay: 0, sueDay: 0, lawDay: 0, summons: null, lastSummonDay: 0, lastGenDay: 0, solved: 0 }; }
    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        // v27.13：账内加 reports 键（报官簿）、vendetta/vendLastDay 键（后续人生仇账）——
        //   旧档缺账 _import 自动补空（=无后续人生，照旧），version 仍 1 不升存档版本号（加键不升版先例）
        window.StateRegistry.register('caseSystem', { version: 1, export: _export, import: _import, reset: _reset });
    }

    window.CaseSystem = {
        CFG: CFG, CASE_TYPES: CASE_TYPES,
        casesOk: casesOk, open: open, casesOf: casesOf, isConstable: isConstable, isCold: isCold,
        genCaseTick: genCaseTick, dailyTick: dailyTick,
        examine: examine, question: question, accuse: accuse, accuseP: accuseP,
        fugitiveOf: fugitiveOf, huntFug: huntFug, settleFugitiveHunt: settleFugitiveHunt,
        sueFor: sueFor, fileSuit: fileSuit,
        reportTick: _reportTick, syncPosts: syncPosts,   // v27.13 张榜半日流程：到点账+榜单重建读口（bounty-board 开榜时调）
        reportToYamen: reportToYamen, ambushCulprit: ambushCulprit, reportsOf: reportsOf,   // v27.13 报官/堵人正门
        onPersonAccepted: onPersonAccepted, onPersonSettled: onPersonSettled, personHuntOk: personHuntOk,   // v27.13 榜单侧回调与冷却读口
        summonsTick: summonsTick, presentSummon: presentSummon, answerSummons: answerSummons, defaultJudgement: defaultJudgement, summonsFine: summonsFine,
        state: _export
    };
    window.openCaseSystem = function () { return open(); };
})();
