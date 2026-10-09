// ==================== v27.1 营生扩展批 · 商会夺权线（第 24 件） ====================
// 用户点单核对：商会机构已有（app.js v20.21 公会堂做实「商会」：行情代问 + 代售台抽一成半佣金）。
// 本账把玩家那条线接通：**入会 → 熬到话事 → 另立自己的商会**。
//   ① 入会：会费 50 灵石一次付清，会钱每月 10 灵石月会日自动支——欠两月除名（贡献折半，人情账就是这么薄）；
//   ② 熬资历：贡献只在商会代售台出货时攒（落袋每 10 灵石记 1 点）——你本来就要卖的货，顺路攒的资历，
//      零新增日常按钮；月会日（翻月）自动过档：会员满 30 日 + 贡献 100 → 执事；执事再满 60 日 + 贡献 400 → 话事人；
//   ③ 身份实惠全在佣金上（明账）：代售抽佣 白身一成半 → 会员一成二 → 执事一成 → 话事人八厘 → 自家会首五厘；
//   ④ 另立商会：话事人 + 城望 30 + 开埠本钱 800 灵石——招牌自己起（十二字内）。会首不再给老会缴会钱，
//      每月初一收会股分红 80×(1+城望/400) 灵石（明账，营生路不是印钞路）；开埠那日城望+2、街面传为佳话。
// 口径：灵石走 DataManager 单一真源；城望读 getReputationValue / 写 addReputation 正门；
//   账落 StateRegistry 'guildClimb' 正门（随存档白名单成对往返，读档归一化坏账不进门）；
//   月账走 onNewDaySubscribe（timeSystem B3），事不追人——月会日没赶上，下个月会日照旧过档。
(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    var CFG = {
        JOIN_FEE: 50,           // 入会会费（一次）
        DUES: 10,               // 会钱（每月会日自动支）
        DUES_ARREARS_OUT: 2,    // 欠两月除名
        CONTRIB_FRAC: 10,       // 代售落袋每 10 灵石记 1 点贡献
        STEWARD_DAYS: 30,       // 会员→执事：入会满 30 日
        STEWARD_CONTRIB: 100,   // 会员→执事：贡献 100（≈ 代售落袋 1000 灵石）
        SPEAKER_DAYS: 60,       // 执事→话事人：过档后再满 60 日
        SPEAKER_CONTRIB: 400,   // 执事→话事人：贡献 400
        FOUND_REP: 30,          // 另立商会：城望门槛
        FOUND_COST: 800,        // 另立商会：开埠本钱
        DIVIDEND_BASE: 80,      // 会首月初分红基数（×(1+城望/400)）
        NAME_MAX: 12
    };

    // 身份表：佣金系数是代售台的实收倍率（app.js guildSellPrice 消费 sellRate()）
    var STAGES = {
        none:     { key: 'none',     name: '白身',   icon: '🚶', rate: 0.85, desc: '行外人——代售台照抽一成半佣金。' },
        member:   { key: 'member',   name: '会员',   icon: '🎫', rate: 0.88, desc: '入了会的名帖——代售佣金减到一成二。' },
        steward:  { key: 'steward',  name: '执事',   icon: '📿', rate: 0.90, desc: '会里当差的执事——代售佣金减到一成。' },
        speaker:  { key: 'speaker',  name: '话事人', icon: '🗣️', rate: 0.92, desc: '桌上说得上话的人——代售佣金减到八厘。' },
        founder:  { key: 'founder',  name: '会首',   icon: '🏮', rate: 0.95, desc: '自家商会的主人——代售只抽五厘，月初还有会股分红。' }
    };

    // ============ 账本（StateRegistry 'guildClimb' 正门） ============
    var _st = null;   // { stage, joinDay, stageDay, contribution, duesArrears, monthSettled, guildName, foundedDay }

    function cd() { return window.currentCharData || null; }
    function absDay() {
        try {
            if (window.WorldCalendar && typeof window.WorldCalendar.day === 'number' && window.WorldCalendar.day > 0) return Math.floor(window.WorldCalendar.day);
            if (typeof window.getAbsoluteDay === 'function') { var g = window.getAbsoluteDay(); if (g) return Math.floor(g); }
            if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') { var t = window.timeSystem.getAbsoluteDay(); if (t) return Math.floor(t); }
        } catch (e) { return 0; }
        return 0;
    }
    function monthIdx() { return Math.floor(absDay() / 30); }
    function cityNow() {
        try { if (typeof window.getCurrentCityName === 'function') return window.getCurrentCityName() || ''; } catch (e) {}
        return (cd() && cd().location) || '';
    }
    function repNow() {
        var ct = cityNow();
        if (!ct) return 0;
        try { if (typeof window.getReputationValue === 'function') return Number(window.getReputationValue(ct)) || 0; } catch (e) { console.warn('[静默失败] js/city-facilities/guild-climb.js · repNow：城望没读出来，按零点算', e && e.message); }
        return 0;
    }
    function repUp(n) {
        var ct = cityNow();
        if (!ct || n === 0) return false;
        try { if (typeof window.addReputation === 'function') { window.addReputation(ct, n); return true; } } catch (e) { console.warn('[静默失败] js/city-facilities/guild-climb.js · repUp：城望没加上', e && e.message); }
        return false;
    }
    function stonesNow() {
        try {
            var dm = window.XianXia && window.XianXia.DataManager;
            if (dm && typeof dm.getSpiritStones === 'function') return Number(dm.getSpiritStones()) || 0;
        } catch (e) {}
        return cd() ? (Number(cd().spiritStones) || 0) : 0;
    }
    function stonesAdd(n) {
        try {
            var dm = window.XianXia && window.XianXia.DataManager;
            if (dm && typeof dm.addSpiritStones === 'function') { dm.addSpiritStones(n); return true; }
            if (cd()) { cd().spiritStones = (Number(cd().spiritStones) || 0) + n; return true; }
        } catch (e) { console.warn('[静默失败] js/city-facilities/guild-climb.js · stonesAdd：这笔钱没进袋', e && e.message); }
        return false;
    }
    function stonesTake(n) {
        try {
            var dm = window.XianXia && window.XianXia.DataManager;
            if (dm && typeof dm.deductSpiritStones === 'function') return !!dm.deductSpiritStones(n);
            if (cd() && (Number(cd().spiritStones) || 0) >= n) { cd().spiritStones -= n; return true; }
        } catch (e) { console.warn('[静默失败] js/city-facilities/guild-climb.js · stonesTake：这笔钱没扣成', e && e.message); }
        return false;
    }
    function log(m, t) { try { if (window.gameLog && window.gameLog.add) window.gameLog.add(m, t || 'info'); } catch (e) {} }
    function msg(m, t) { try { if (window.showMessage) window.showMessage(m, t || 'info'); } catch (e) {} }
    function deed(kind, text) { try { if (typeof window.playerPushDeed === 'function') window.playerPushDeed(kind, text); } catch (e) {} }

    function sanitize(raw) {
        var s = (raw && typeof raw === 'object') ? raw : {};
        var stage = STAGES[s.stage] ? s.stage : 'none';
        return {
            stage: stage,
            joinDay: Math.max(0, Math.floor(Number(s.joinDay) || 0)),
            stageDay: Math.max(0, Math.floor(Number(s.stageDay) || 0)),
            contribution: Math.max(0, Math.min(99999, Math.floor(Number(s.contribution) || 0))),
            duesArrears: (stage === 'member' || stage === 'steward' || stage === 'speaker') ? Math.max(0, Math.min(9, Math.floor(Number(s.duesArrears) || 0))) : 0,
            monthSettled: Math.max(0, Math.floor(Number(s.monthSettled) || 0)),
            guildName: (stage === 'founder' && typeof s.guildName === 'string' && s.guildName.trim()) ? s.guildName.trim().slice(0, CFG.NAME_MAX) : '',
            foundedDay: (stage === 'founder') ? Math.max(0, Math.floor(Number(s.foundedDay) || 0)) : 0
        };
    }
    function state() {
        if (!_st) _st = sanitize({ monthSettled: monthIdx() });
        return _st;
    }
    function stageOf() { return STAGES[state().stage] || STAGES.none; }

    // ============ 明账口径（牌面/测试同源） ============
    function sellRate() { return stageOf().rate; }
    function commissionPct() { return Math.round((1 - stageOf().rate) * 1000) / 10; }   // 15 / 12 / 10 / 8 / 5
    function dividendOf() { return Math.round(CFG.DIVIDEND_BASE * (1 + repNow() / 400)); }

    // 下一档还差什么（人话，牌面如实写）——已到顶回 null
    function nextGoal() {
        var s = state();
        if (s.stage === 'none') return { name: '会员', text: '入会（会费 ' + CFG.JOIN_FEE + ' 灵石，会钱 ' + CFG.DUES + ' 灵石/月）' };
        if (s.stage === 'member') {
            var d1 = Math.max(0, CFG.STEWARD_DAYS - (absDay() - s.joinDay));
            var c1 = Math.max(0, CFG.STEWARD_CONTRIB - s.contribution);
            return { name: '执事', text: '入会满 ' + CFG.STEWARD_DAYS + ' 日' + (d1 > 0 ? '（还差 ' + d1 + ' 日）' : '（已满）') + ' + 贡献 ' + CFG.STEWARD_CONTRIB + (c1 > 0 ? '（还差 ' + c1 + '，代售落袋每 ' + CFG.CONTRIB_FRAC + ' 灵石记 1 点）' : '（已够）') + '——月会日过档' };
        }
        if (s.stage === 'steward') {
            var d2 = Math.max(0, CFG.SPEAKER_DAYS - (absDay() - s.stageDay));
            var c2 = Math.max(0, CFG.SPEAKER_CONTRIB - s.contribution);
            return { name: '话事人', text: '当执事满 ' + CFG.SPEAKER_DAYS + ' 日' + (d2 > 0 ? '（还差 ' + d2 + ' 日）' : '（已满）') + ' + 贡献 ' + CFG.SPEAKER_CONTRIB + (c2 > 0 ? '（还差 ' + c2 + '）' : '（已够）') + '——月会日过档' };
        }
        if (s.stage === 'speaker') {
            var r = repNow();
            return { name: '自家会首', text: '城望 ' + CFG.FOUND_REP + (r < CFG.FOUND_REP ? '（现 ' + r + '，还差 ' + (CFG.FOUND_REP - r) + '）' : '（已够）') + ' + 开埠本钱 ' + CFG.FOUND_COST + ' 灵石——另立自己的商会' };
        }
        return null;
    }

    // ============ 入会 / 另立 ============
    function join() {
        var s = state();
        if (s.stage !== 'none') { msg('你已经是' + stageOf().name + '了——名帖就在怀里。', 'info'); return false; }
        if (!cd()) { msg('请先创建角色进入游戏。', 'info'); return false; }
        if (stonesNow() < CFG.JOIN_FEE) { msg('入会会费 ' + CFG.JOIN_FEE + ' 灵石——手头不足，管事把名帖收了回去。', 'warning'); return false; }
        if (!stonesTake(CFG.JOIN_FEE)) { msg('会费没能交割，入会未成。', 'warning'); return false; }
        s.stage = 'member';
        s.joinDay = absDay(); s.stageDay = s.joinDay;
        s.contribution = 0; s.duesArrears = 0;
        s.monthSettled = monthIdx();
        save();
        if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI();
        log('🎫 你递上会费 ' + CFG.JOIN_FEE + ' 灵石，商会管事写了名帖、按了会印——从今日起你是会里的' + STAGES.member.name + '。代售佣金立减到一成二；会钱每月 ' + CFG.DUES + ' 灵石月会日自动支，欠两月除名。（贡献在代售台出货时攒：落袋每 ' + CFG.CONTRIB_FRAC + ' 灵石记 1 点）', 'success');
        msg('🎫 入会成了——代售佣金一成二，柜上出货顺路攒资历。', 'success');
        return true;
    }

    function found() {
        var s = state();
        if (s.stage !== 'speaker') { msg('另立商会是话事人才有的底气——你还差着资历。', 'warning'); return false; }
        var r = repNow();
        if (r < CFG.FOUND_REP) { msg('城望不足 ' + CFG.FOUND_REP + '（现 ' + r + '）——街面上不认的生面孔，开埠也没人捧场。', 'warning'); return false; }
        if (stonesNow() < CFG.FOUND_COST) { msg('开埠本钱要 ' + CFG.FOUND_COST + ' 灵石（铺面、招牌、头三个月的伙计钱）——手头不足。', 'warning'); return false; }
        var name = '';
        try { name = String(window.prompt('自家商会的招牌（' + CFG.NAME_MAX + ' 字内）：', '长青商会') || '').trim().slice(0, CFG.NAME_MAX); } catch (eP) { name = ''; }
        if (!name) name = '长青商会';
        if (!stonesTake(CFG.FOUND_COST)) { msg('开埠本钱没能交割，另立未成。', 'warning'); return false; }
        s.stage = 'founder';
        s.guildName = name;
        s.foundedDay = absDay(); s.stageDay = s.foundedDay;
        s.duesArrears = 0;
        save();
        if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI();
        repUp(2);
        deed('good', '你另立了「' + name + '」——老会的话事人出去开埠，行商圈里都说是条好汉');
        log('🏮 「' + name + '」开埠那日，鞭炮从街头响到街尾。老会首亲自送来一块「义商」的匾——话事人出去另立门户，行里不但不恼，反倒敬你有出息。从此：代售只抽五厘（自家的柜台自家做主），每月初一收会股分红 ' + dividendOf() + ' 灵石（随城望水涨），会钱一文不用再缴。（城望+2）', 'success');
        msg('🏮 「' + name + '」开埠了——你就是会首。代售五厘、月初分红，招牌是你的了。', 'success');
        return true;
    }

    // ============ 贡献与月会日 ============
    // 代售台出货顺路攒资历（app.js guildSellSlot 成功后守卫式调用——不在位就一点不攒，不影响代售本账）
    function noteSale(amount) {
        var s = state();
        if (s.stage === 'none' || s.stage === 'founder') return 0;   // 白身没资历可攒；会首的货走自家柜台，老会的账不再记
        var amt = Math.max(0, Math.floor(Number(amount) || 0));
        var pts = Math.floor(amt / CFG.CONTRIB_FRAC);
        if (pts <= 0) return 0;
        s.contribution = Math.min(99999, s.contribution + pts);
        save();
        return pts;
    }

    // 月会日（翻月）：会钱 → 除名/过档 → 会首分红，全在这一笔里（零日常按钮）
    function monthly() {
        var s = state();
        if (monthIdx() <= s.monthSettled) return null;
        s.monthSettled = monthIdx();
        var done = null;
        if (s.stage === 'founder') {
            var div = dividendOf();
            if (stonesAdd(div)) {
                log('🏮 初一，「' + (s.guildName || '长青商会') + '」的账房把会股分红 ' + div + ' 灵石送上门来（本钱 80 × 城望系数，明账）——招牌立住了，钱自己会走路。', 'success');
                if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI();
                done = { dividend: div };
            }
            save();
            return done;
        }
        if (s.stage === 'none') { save(); return null; }
        // 会钱
        if (stonesTake(CFG.DUES)) {
            s.duesArrears = 0;
        } else {
            s.duesArrears += 1;
            if (s.duesArrears >= CFG.DUES_ARREARS_OUT) {
                var oldStage = STAGES[s.stage].name;
                s.stage = 'none';
                s.contribution = Math.floor(s.contribution / 2);   // 除名折半：人情账就是这么薄
                s.duesArrears = 0; s.joinDay = 0; s.stageDay = 0;
                log('🎫 会钱欠了两月——管事把你的名帖当面销了：「会里的规矩。」你从' + oldStage + '打回白身，贡献折半留着（手艺和人脉销不掉），想再入会，会费重交。', 'warning');
                save();
                return { expelled: true };
            }
            log('🎫 这个月的会钱（' + CFG.DUES + ' 灵石）没能支上——已欠 ' + s.duesArrears + ' 月，欠满 ' + CFG.DUES_ARREARS_OUT + ' 月除名。', 'warning');
        }
        // 过档（月会日议资历——条件够了自动抬，不用你递话）
        if (s.stage === 'member' && absDay() - s.joinDay >= CFG.STEWARD_DAYS && s.contribution >= CFG.STEWARD_CONTRIB) {
            s.stage = 'steward'; s.stageDay = absDay();
            log('📿 月会上管事点名：你入会满 ' + CFG.STEWARD_DAYS + ' 日、贡献 ' + s.contribution + '，会里议定抬你当' + STAGES.steward.name + '——代售佣金减到一成，会里的账目你也看得了。', 'success');
            msg('📿 月会过档：你升了商会执事（代售佣金一成）。', 'success');
            done = { promoted: 'steward' };
        } else if (s.stage === 'steward' && absDay() - s.stageDay >= CFG.SPEAKER_DAYS && s.contribution >= CFG.SPEAKER_CONTRIB) {
            s.stage = 'speaker'; s.stageDay = absDay();
            log('🗣️ 月会上老会首亲自开口：你当执事满 ' + CFG.SPEAKER_DAYS + ' 日、贡献 ' + s.contribution + '，会里的事你已说得上话——即日起你是' + STAGES.speaker.name + '（代售佣金八厘）。老会首还多看了你一眼：「有本事的人，早晚要自己立门户。」（攒够城望 ' + CFG.FOUND_REP + ' 与开埠本钱 ' + CFG.FOUND_COST + ' 灵石，就能另立自己的商会）', 'success');
            msg('🗣️ 月会过档：你成了话事人（代售佣金八厘）——另立商会的底气有了。', 'success');
            done = { promoted: 'speaker' };
        }
        save();
        return done;
    }

    // ============ 存档正门 ============
    // 账只此一本：StateRegistry 'guildClimb' 随存档白名单成对往返（不开平行存储键）。
    // 归一化就地写回——_st 引用不换（牌面/测试拿的都是同一本账）。
    function save() {
        if (!_st) { _st = sanitize({ monthSettled: monthIdx() }); return; }
        var clean = sanitize(_st);
        for (var k in clean) if (Object.prototype.hasOwnProperty.call(clean, k)) _st[k] = clean[k];
    }
    function _export() { return JSON.parse(JSON.stringify(state())); }
    function _import(d) { _st = sanitize(d); }
    function _reset() { _st = sanitize({}); }
    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        window.StateRegistry.register('guildClimb', { version: 1, export: _export, import: _import, reset: _reset });
    }
    if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
        window.timeSystem.onNewDaySubscribe(function () { monthly(); });
    }

    // ============ 牌面（嵌在商会·行情代问与代售台弹窗里，app.js openGuildHall 守卫式拼接） ============
    function sectionHtml() {
        var s = state();
        var st = stageOf();
        var goal = nextGoal();
        var h = '<div style="margin:6px 0;padding:8px;border:1px solid #4a3b2a;border-radius:6px;background:rgba(80,60,30,0.15)">'
            + '<div style="font-size:13px;color:#f0c674;font-weight:bold">🏬 会里的身份：' + st.icon + ' ' + st.name
            + '　<span style="color:#ccc;font-weight:normal">代售佣金 ' + commissionPct() + '%（白身 15%）</span></div>'
            + '<p class="text-xs text-gray-400" style="margin:4px 0">' + st.desc + '</p>';
        if (s.stage !== 'none' && s.stage !== 'founder') {
            h += '<p class="text-xs text-gray-300" style="margin:2px 0">贡献 ' + s.contribution + ' 点（在代售台出货顺路攒：落袋每 ' + CFG.CONTRIB_FRAC + ' 灵石记 1 点）'
                + ' · 会钱 ' + CFG.DUES + ' 灵石/月月会日自动支'
                + (s.duesArrears > 0 ? ' · <span style="color:#e06c75">已欠 ' + s.duesArrears + ' 月（欠满 ' + CFG.DUES_ARREARS_OUT + ' 月除名）</span>' : '') + '</p>';
        }
        if (s.stage === 'founder') {
            h += '<p class="text-xs text-gray-300" style="margin:2px 0">「' + (s.guildName || '长青商会') + '」开埠于第 ' + s.foundedDay + ' 日 · 每月初一分红 ' + dividendOf() + ' 灵石（80 × 城望系数 ' + (1 + repNow() / 400).toFixed(2) + '，明账）</p>';
        }
        if (goal) {
            h += '<p class="text-xs text-gray-400" style="margin:2px 0">➤ 下一档【' + goal.name + '】：' + goal.text + '</p>';
        }
        if (s.stage === 'none') {
            h += '<button onclick="GuildClimb.uiJoin()" class="bg-amber-700 hover:bg-amber-600 text-xs px-2 py-1 rounded" style="margin-top:4px">🎫 入会（会费 ' + CFG.JOIN_FEE + ' 灵石）</button>';
        } else if (s.stage === 'speaker') {
            h += '<button onclick="GuildClimb.uiFound()" class="bg-purple-700 hover:bg-purple-600 text-xs px-2 py-1 rounded" style="margin-top:4px">🏮 另立自己的商会（开埠 ' + CFG.FOUND_COST + ' 灵石 · 城望 ' + CFG.FOUND_REP + '）</button>';
        }
        return h + '</div>';
    }
    function reopenHall() { try { if (typeof window.openGuildHall === 'function') window.openGuildHall(); } catch (e) {} }
    function uiJoin() { if (join()) reopenHall(); }
    function uiFound() { if (found()) reopenHall(); }

    window.GuildClimb = {
        CFG: CFG, STAGES: STAGES,
        state: state, stage: function () { return state().stage; },
        sellRate: sellRate, commissionPct: commissionPct, dividendOf: dividendOf,
        nextGoal: nextGoal,
        join: join, found: found, noteSale: noteSale, monthly: monthly,
        sectionHtml: sectionHtml, uiJoin: uiJoin, uiFound: uiFound
    };
})();
