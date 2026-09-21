// ==================== sect-standing.js - 江湖地位（方案一·动态势力规模 + 方案二·动态正邪立场） ====================
// 此前门派的「实力」「正邪」是写死在数据里的标签——少林寺永远是巨擘，修罗宫永远是邪派。
// 但势力该是活的：弟子凋零、库房见底、打了败仗、灵脉枯竭，座次就会往下挪；
// 立场也该是走的：开仓济民的门不会被叫邪派，灾年抢粮、攻山灭门的正道也会被人戳脊梁骨。
// 本模块按月重算每派的 powerScore（底子分＋动态分，灵脉修正），并维护 align 立场分（-100~+100）：
//   势力档：≥400巨擘 / ≥280大派 / ≥180中等偏上 / ≥120中等 / ≥70小派 / ≥40式微 / <40残破 / 弟子≤3名存实亡
//   立场档：≥80活菩萨 / ≥40正道所认 / ±39亦正亦邪 / ≤-40江湖目之为邪 / ≤-80正道公敌
// 纪律：档位变动全走真账（编年/街谈/外交关系），读侧从静态标签换成动态档；零外文字母；数值按详案先跑，探针可查。
(function () {
    'use strict';
    var W = window;

    function flags() { return (W.eventFlags = W.eventFlags || {}); }
    // 第九波·总账根治：timeSystem.totalDays 在生产里根本不存在，旧钟恒 0——座次月度漂移全是死代码。
    // 统一优先真钟 getAbsoluteDay；旧字段只作测试沙箱的退路。
    function absDay() {
        try {
            if (typeof W.getAbsoluteDay === 'function') { var g = W.getAbsoluteDay(); if (g) return Math.floor(g); }
            var t = W.timeSystem;
            if (t) {
                if (typeof t.getAbsoluteDay === 'function') { var g2 = t.getAbsoluteDay(); if (g2) return Math.floor(g2); }
                if (t.gameTime && t.gameTime.currentDay) return Math.floor(t.gameTime.currentDay);
                if (t.totalDays) return Math.floor(t.totalDays);
            }
            if (W.WorldCalendar && W.WorldCalendar.day) return Math.floor(W.WorldCalendar.day);
            if (W.currentCharData && W.currentCharData.totalDays) return Math.floor(W.currentCharData.totalDays);
        } catch (e) {}
        return 0;
    }
    function log(m, t) { try { if (W.gameLog && W.gameLog.add) W.gameLog.add(m); } catch (e) {} }
    function internal(sect) { return (W.SECT_INTERNAL && W.SECT_INTERNAL[sect]) || null; }
    function mySect() { try { var d = W.discipleState; return d && d.isInSect ? (d.sectName || d.sectId) : null; } catch (e) { return null; } }
    function chron(sect, text) {
        try { if (W.SectGov && W.SectGov.chronicle) { W.SectGov.chronicle(sect, text); return; } } catch (e) {}
        var it = internal(sect);
        if (!it) return;
        if (!it.chronicle) it.chronicle = [];
        it.chronicle.push({ day: absDay(), text: String(text) });
        if (it.chronicle.length > 40) it.chronicle.splice(0, it.chronicle.length - 40);
    }
    function street(text) {
        try {
            var f = flags();
            if (!f['qi_street'] || !f['qi_street'].push) f['qi_street'] = [];
            f['qi_street'].push({ day: absDay(), text: String(text) });
            if (f['qi_street'].length > 60) f['qi_street'].splice(0, f['qi_street'].length - 60);
        } catch (e) {}
    }
    function notifyHome(sect, text) { if (mySect() === sect) log('🏯 ' + sect + '·' + text, 'info'); }

    // ============ 一 · 动态势力（方案一） ============
    // 底子分：旧标签折算的「开山基业」——座次不是凭空掉下来的，祖上的分量还在，但会被现况一点点吃掉
    var BASE = { '巨擘': 430, '大派': 320, '中等偏上': 230, '中等': 170, '小': 110, '极小': 70, '未知': 140 };
    var TIERS = [
        { min: 400, label: '巨擘' }, { min: 280, label: '大派' }, { min: 180, label: '中等偏上' },
        { min: 120, label: '中等' }, { min: 70, label: '小派' }, { min: 40, label: '式微' }, { min: -99999, label: '残破' }
    ];
    var WAR_MUL = { '巨擘': 1.4, '大派': 1.2, '中等偏上': 1.05, '中等': 1.0, '小派': 0.85, '式微': 0.7, '残破': 0.55, '名存实亡': 0.4, '已灭': 0.3, '未知': 1.0 };
    // 枯萎八城与门派所在地区的对应（灵脉一枯，本地门派首当其冲）
    var CITY_REGION = { '大漠孤城': '西漠', '冰原城': '北冥', '万毒谷': '南疆', '青木城': '东荒', '剑阁': '蜀地', '炎城': '东南海域', '洛水城': '中州', '帝都·长安': '中州' };
    var TREND_WORD = { rising: '↗ 上升', steady: '→ 平稳', falling: '↘ 下滑' };

    function homeWithered(sect) {
        var sd = (W.sectsData || {})[sect];
        if (!sd) return false;
        var it0 = internal(sect);
        var loc = (it0 && it0._movedToRegion) || sd.location; // 搬迁过的新山门按新址算
        if (!loc) return false;
        var f = flags();
        for (var city in CITY_REGION) {
            if (f['qi_withered_' + city] && CITY_REGION[city] === loc) return true;
        }
        return false;
    }
    function computeScore(sect) {
        var it = internal(sect);
        if (!it) return null;
        var sd = (W.sectsData || {})[sect] || {};
        var base = BASE[sd.power] || 140;
        var disc = Number(it.disciples) || 10;
        var res = Number(it.resources) || 0;
        var infl = Number(it.influence) || 40;
        var wpn = Number(it.weapons) || 0;
        var def = Number(it.defense) || 0;
        var dyn = (disc - 20) * 2 + (res - 100) / 10 + (infl - 50) + wpn * 0.5 + def / 3 + (Number(it._warMod) || 0);
        // 方案四联动：香火护持与分舵本身就是势力（每城+5、每舵+3、御许舵+4）
        try { if (typeof W.sectCityScoreBonus === 'function') dyn += W.sectCityScoreBonus(sect); } catch (eC) {}
        var score = base + dyn;
        // 灵脉修正：本地已枯 ×0.7；天地整体转薄（主线阶段）也人人有份
        var stage = Number(flags()['qi_stage'] || 0);
        if (homeWithered(sect)) score *= 0.7;
        else if (stage >= 3) score *= 0.92;
        else if (stage >= 2) score *= 0.96;
        if (it._subjugated) score *= 0.5; // 自焚邪功请过罪的，势力折半（真忏悔的代价）
        return Math.max(0, Math.round(score));
    }
    function tierOf(sect, score) {
        var it = internal(sect);
        if (flags()['sect_ruin_' + sect]) return '已灭'; // 灭门之后，座次归尘（复兴后自动重算）
        if (it && (Number(it.disciples) || 0) <= 3) return '名存实亡';
        for (var i = 0; i < TIERS.length; i++) { if (score >= TIERS[i].min) return TIERS[i].label; }
        return '残破';
    }
    function ensurePower(sect) {
        var it = internal(sect);
        if (!it) return null;
        var score = computeScore(sect);
        if (!it._power) {
            it._power = { score: score, tier: tierOf(sect, score), trend: 'steady', prev: score };
        }
        return it._power;
    }
    W.sectPowerNow = function (sect) {
        if (!sect) return null;
        var p = ensurePower(sect);
        return p ? { score: p.score, tier: p.tier, trend: p.trend } : null;
    };
    W.sectPowerLabel = function (sect) {
        var p = W.sectPowerNow(sect);
        if (!p) return (W.sectsData && W.sectsData[sect] && W.sectsData[sect].power) || '未知';
        return p.tier + ' ' + (TREND_WORD[p.trend] || '');
    };
    W.sectPowerWarMul = function (sect) {
        var p = W.sectPowerNow(sect);
        if (p && WAR_MUL[p.tier] != null) return WAR_MUL[p.tier];
        return 1;
    };
    // 战绩修正：打赢一场长脸，打输一场泄气（月度衰减，不是一锤子买卖）
    W.sectPowerWarMod = function (sect, win) {
        var it = internal(sect);
        if (!it) return;
        it._warMod = Math.max(-30, Math.min(30, (Number(it._warMod) || 0) + (win ? 5 : -5)));
        if (it._power) it._power.score = computeScore(sect); // 即时刷新，下一日结算读到的就是新座次
    };
    var UP_LINE = {
        '巨擘': '江湖重新排了座次——「{S}」已是巨擘之尊，山门前的车马排到了十里外。',
        '大派': '「{S}」的门庭兴旺了起来——江湖人如今把它当大派看，递帖子的都多了三分恭敬。',
        '中等偏上': '「{S}」近些日子风声水起，座次往上挪了一格。',
        '中等': '「{S}」缓过来了——库房的粮、山门的灯，都重新有了底气。',
        '小派': '「{S}」总算站稳了脚跟，虽是小派，山门里的人气是真的。'
    };
    var DOWN_LINE = {
        '式微': '「{S}」的门庭冷清了——江湖人提起它，语气里多了些斟酌。（势力式微）',
        '残破': '「{S}」残破了：库房见底，弟子星散，山门前的石阶长出了草。（势力残破）',
        '名存实亡': '「{S}」名存实亡——山上住的人，一只手数得过来了。'
    };
    function tierChange(sect, oldTier, newTier, score) {
        function rank(t) { for (var i = 0; i < TIERS.length; i++) { if (TIERS[i].label === t) return i; } return 9; }
        var up = rank(newTier) < rank(oldTier);
        var line = (up ? UP_LINE[newTier] : DOWN_LINE[newTier]) || ('江湖座次变了：「{S}」如今算得' + newTier + '。');
        line = line.replace('{S}', sect);
        chron(sect, line + '（' + oldTier + ' → ' + newTier + '）');
        notifyHome(sect, '江湖座次变了：本门如今是「' + newTier + '」——' + (up ? '门里上下都松了口气。' : '执事们开会到半夜。'));
        // 大新闻进街谈；本门的事也进街谈（茶棚里说的是别人家的座次）
        if (!up || newTier === '巨擘') street(line);
        if (newTier === '残破' || newTier === '名存实亡') street('茶棚里有人撇嘴：「' + sect + '？如今山上还有几个人哟。」');
    }
    function powerMonthTick() {
        var sects = W.SECT_INTERNAL || {};
        for (var sect in sects) {
            var it = sects[sect];
            var score = computeScore(sect);
            if (score == null) continue;
            var tier = tierOf(sect, score);
            var prev = it._power ? it._power.score : null;
            var trend = 'steady';
            if (prev != null) {
                if (score > prev * 1.02 + 1) trend = 'rising';
                else if (score < prev * 0.98 - 1) trend = 'falling';
            }
            var oldTier = it._power ? it._power.tier : null;
            it._power = { score: score, tier: tier, trend: trend, prev: prev == null ? score : prev };
            if (oldTier && oldTier !== tier) tierChange(sect, oldTier, tier, score);
            // 战绩修正按月衰减——记仇，但不记一辈子
            if (Number(it._warMod) || 0) it._warMod = Math.round((Number(it._warMod) || 0) * 0.85);
        }
    }

    // ============ 二 · 动态正邪（方案二） ============
    var ALIGN_BASE = { '正道': 60, '中立': 0, '邪派': -60 };
    function alignBase(sect) {
        var sd = (W.sectsData || {})[sect] || {};
        return ALIGN_BASE[sd.type] != null ? ALIGN_BASE[sd.type] : 0;
    }
    function alignTierOf(v) {
        if (v >= 80) return '活菩萨';
        if (v >= 40) return '正道所认';
        if (v > -40) return '亦正亦邪';
        if (v > -80) return '江湖目之为邪';
        return '正道公敌';
    }
    function ensureAlign(sect) {
        var it = internal(sect);
        if (!it) return null;
        if (it._align == null) {
            it._align = alignBase(sect);
            it._alignTier = alignTierOf(it._align);
        }
        return it;
    }
    W.sectAlignNow = function (sect) {
        if (!sect) return null;
        var it = ensureAlign(sect);
        return it ? { align: it._align, tier: it._alignTier } : null;
    };
    W.sectAlignLabel = function (sect) {
        var a = W.sectAlignNow(sect);
        return a ? a.tier : ((W.sectsData && W.sectsData[sect] && W.sectsData[sect].type) || '未知');
    };
    function diploNudge(sect, types, delta) {
        try {
            var dip = W.SECT_DIPLOMACY_STATE;
            if (!dip) return;
            for (var other in (W.sectsData || {})) {
                if (other === sect) continue;
                var t = W.sectsData[other] && W.sectsData[other].type;
                if (types.indexOf(t) < 0) continue;
                if (dip[other] && dip[other][sect]) dip[other][sect].relation = Math.max(-100, Math.min(100, (Number(dip[other][sect].relation) || 0) + delta));
                if (dip[sect] && dip[sect][other]) dip[sect][other].relation = Math.max(-100, Math.min(100, (Number(dip[sect][other].relation) || 0) + delta));
            }
            if (typeof W.saveSectDiplomacy === 'function') W.saveSectDiplomacy();
        } catch (e) {}
    }
    function alignCross(sect, oldT, newT, v) {
        if (newT === '正道公敌') {
            diploNudge(sect, ['正道'], -10);
            var line = '正道同盟联名张榜，历数「' + sect + '」罪状——从此它的人走到哪座正派山门，都只有冷茶。（正道公敌）';
            chron(sect, line); street(line);
            notifyHome(sect, '门派的立场已经坏到极点：正道诸派联名张榜讨伐，关系全线跌落。');
        } else if (newT === '江湖目之为邪') {
            var l2 = '市井提起「' + sect + '」，开始压低了声音——不知从哪天起，没人再叫它「贵派」了。（江湖目之为邪）';
            chron(sect, l2); street(l2);
        } else if (newT === '亦正亦邪') {
            if (oldT === '正道所认' || oldT === '活菩萨') {
                var l3 = '有人说「' + sect + '」行事越来越看不透了——匾还挂着，香火却淡了。（亦正亦邪）';
                chron(sect, l3);
            } else {
                var l4 = '「' + sect + '」近来办了几件体面事，江湖上的口气松了些。（亦正亦邪）';
                chron(sect, l4);
            }
        } else if (newT === '正道所认') {
            var l5 = '「' + sect + '」的匾又擦亮了——正派递帖子的重新多了起来。（正道所认）';
            chron(sect, l5); street(l5);
        } else if (newT === '活菩萨') {
            diploNudge(sect, ['正道', '中立'], 5);
            var it = internal(sect);
            if (it) it.resources = (Number(it.resources) || 0) + 10;
            var l6 = '民间给「' + sect + '」立了生祠——香火钱顺着山路往门里送，正派中立诸门也纷纷修书致意。（活菩萨）';
            chron(sect, l6); street(l6);
            notifyHome(sect, '门派被江湖尊为「活菩萨」：香火进项+10，诸门关系回暖。');
        }
    }
    W.sectAlignShift = function (sect, delta, reason) {
        if (!sect || !delta) return;
        var it = ensureAlign(sect);
        if (!it) return;
        var oldT = it._alignTier;
        it._align = Math.max(-100, Math.min(100, it._align + delta));
        it._alignTier = alignTierOf(it._align);
        if (it._alignTier !== oldT) alignCross(sect, oldT, it._alignTier, it._align);
    };
    function alignMonthTick(day) {
        var sects = W.SECT_INTERNAL || {};
        for (var sect in sects) {
            var it = sects[sect];
            ensureAlign(sect);
            // 灾年抢粮：断粮的门，夜里下山「强买」的事瞒不住
            if ((Number(it._famineDays) || 0) > 0 && Math.random() < 0.2) {
                W.sectAlignShift(sect, -8, '灾年抢粮');
                var l = '饥荒里，「' + sect + '」的人夜里下山强行买粮——价钱是给了，市面上传得难听。（立场受损）';
                chron(sect, l);
                if (mySect() === sect) street(l);
            }
            // 年关回根：立场每年向开山本心回一点——人做事，天看着
            if (day && day % 360 === 0) {
                var base = alignBase(sect);
                if (it._align > base) W.sectAlignShift(sect, -Math.min(5, it._align - base), '年关回根');
                else if (it._align < base) W.sectAlignShift(sect, Math.min(5, base - it._align), '年关回根');
            }
        }
    }

    // ============ 三 · 月钩 ============
    function monthTick() {
        var day = absDay();
        if (!day || day % 30 !== 0) return;
        powerMonthTick();
        alignMonthTick(day);
    }
    try {
        if (W.EventBus && W.EventBus.on) W.EventBus.on('newDay', function () { try { monthTick(); } catch (e) {} });
        else if (W.timeSystem && typeof W.timeSystem.onNewDaySubscribe === 'function') W.timeSystem.onNewDaySubscribe(function () { try { monthTick(); } catch (e) {} });
    } catch (e) {}

    // 探针（测试用）
    W.sectStandingProbe = function (sect) {
        var it = internal(sect);
        if (!it) return null;
        ensurePower(sect); ensureAlign(sect);
        return {
            score: it._power.score, tier: it._power.tier, trend: it._power.trend,
            align: it._align, alignTier: it._alignTier, warMod: Number(it._warMod) || 0,
            homeWithered: homeWithered(sect)
        };
    };
    console.log('[sect-standing] 江湖地位已注册：势力座次按月重算（底子+现况+灵脉），正邪立场随行事漂移——档位变动走编年/街谈/外交真账');
})();
