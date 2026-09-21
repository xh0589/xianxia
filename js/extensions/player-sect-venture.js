// ==================== player-sect-venture.js - 第十八波 · 创业维艰（白手起家的日子） ====================
// 炼气散修立了幡，第二天醒来故事得接得上：住哪、吃什么、人从哪来、世界怎么看你。
// 纪律：不开新面板——所有内容长在既有界面上：
//   招揽 → 社交面板「请求」栏（自建宗门走既有游说四话术；身在门派按位分：长老以上直接邀请，
//          以下只能说服对方面试——执事看门派粮草士气、看你位分贡献，两关都过才收）；
//   破屋/接活/八苦 → 宗门总册「白手起家」栏（PSBoot.panelBlock 包装插块）；
//   心境/来路 → 宗谱在门册多两列（PSectWorld 的书页）；
//   闲话/登门/月查 → 既有街谈、既有外交真账、既有月结事件弹窗。
// 账目纪律：活钱是力气换的（真耗精力时辰，雇主有名有姓）；修缮真花钱真见效（床铺/门面）；
// 香火钱/回礼走宗库真账；硬顶登门掉的是外交真关系（往后盛会举幡，既有系统都读那笔账）。
// 零外文字母、零原生弹窗、缺表不炸、幂等、随机按日定数（读档不跳票）。
(function () {
    'use strict';
    var W = window;
    if (typeof W === 'undefined') return;

    function P() { return W.PlayerSect; }
    function mine() { try { return (W.PSectWorld && W.PSectWorld.byName && homeName()) ? W.PSectWorld.byName(homeName()) : ((P() && P().listMySects) ? (P().listMySects()[0] || null) : null); } catch (e) { return null; } }
    function homeName() { try { return (W.PSectWorld && W.PSectWorld.homeName) ? W.PSectWorld.homeName() : null; } catch (e) { return null; } }
    function ds() { return W.discipleState || null; }
    function cd() { return W.currentCharData || null; }
    function flags() { return (W.eventFlags = W.eventFlags || {}); }
    function today() {
        try {
            if (typeof W.getAbsoluteDay === 'function') { var g = W.getAbsoluteDay(); if (g) return Math.floor(g); }
            var t = W.timeSystem;
            if (t) {
                if (typeof t.getAbsoluteDay === 'function') { var g2 = t.getAbsoluteDay(); if (g2) return Math.floor(g2); }
                if (t.gameTime && t.gameTime.currentDay) return Math.floor(t.gameTime.currentDay);
                if (t.totalDays) return Math.floor(t.totalDays);
            }
            if (W.WorldCalendar && W.WorldCalendar.day) return Math.floor(W.WorldCalendar.day);
        } catch (e) {}
        return 0;
    }
    function monthIdx() { return Math.floor(today() / 30); }
    function msg(m, t) { try { if (W.showMessage) W.showMessage(m, t || 'info'); } catch (e) {} }
    function log(m, t) { try { if (W.gameLog && W.gameLog.add) W.gameLog.add(m); } catch (e) {} }
    function modal(t, b) { try { if (W.showModal) W.showModal(t, b); } catch (e) {} }
    function para(t) { return '<p class="text-sm text-gray-300 leading-relaxed mb-2">' + t + '</p>'; }
    function btn(label, onclick, cls) { return '<button onclick="' + onclick + '" class="' + (cls || 'bg-yellow-700 hover:bg-yellow-600') + ' text-xs px-3 py-2 rounded text-left">' + label + '</button>'; }
    function _close() { try { var ov = document.getElementById('xianxia-modal-overlay'); if (ov) ov.remove(); } catch (e) {} }
    function street(text) {
        try {
            var f = flags();
            if (!f['qi_street'] || !f['qi_street'].push) f['qi_street'] = [];
            f['qi_street'].push({ day: today(), text: String(text) });
            if (f['qi_street'].length > 60) f['qi_street'].splice(0, f['qi_street'].length - 60);
        } catch (e) {}
    }
    function chron(sectName, text) {
        try { if (W.SectGov && W.SectGov.chronicle) { W.SectGov.chronicle(sectName, text); return; } } catch (e) {}
        var it = (W.SECT_INTERNAL || {})[sectName];
        if (!it) return;
        if (!it.chronicle) it.chronicle = [];
        it.chronicle.push({ day: today(), text: String(text) });
    }
    function hist(sect, text) { try { P().addHistory(sect.id, text); } catch (e) {} }
    function addStones(sect, n, why) {
        sect.resources.spiritStones = Math.max(0, (Number(sect.resources.spiritStones) || 0) + n);
        if (why) hist(sect, why);
    }
    function spendStones(sect, n, why) {
        if ((Number(sect.resources.spiritStones) || 0) < n) return false;
        sect.resources.spiritStones = (Number(sect.resources.spiritStones) || 0) - n;
        if (why) hist(sect, why);
        return true;
    }
    function wallet() { try { if (W.DataManager && W.DataManager.getSpiritStones) return W.DataManager.getSpiritStones(); } catch (e) {} return Number(((W.inventory || {}).currency || {}).spiritStones) || 0; }
    function payWallet(n) { try { if (W.DataManager && W.DataManager.deductSpiritStones) return W.DataManager.deductSpiritStones(n); } catch (e) {} return false; }
    function energy() { return Number((cd() || {}).energy) || 0; }
    function spendEnergy(n) { var c = cd(); if (c) c.energy = Math.max(0, (Number(c.energy) || 0) - n); }
    function advance(min, why) { try { if (W.timeSystem && W.timeSystem.advanceTime) W.timeSystem.advanceTime(min, why || '谋生'); } catch (e) {} }
    function members(sect) { return (sect.disciples || []).length + (sect.guests || []).length; }
    // 第二十一波：派遣下山的弟子不占接活的人手——人在山下，力气使不到家里的活上
    function homeCount(sect) {
        return (sect.disciples || []).concat(sect.guests || []).filter(function (d) { return d && !d.away; }).length;
    }
    function getNPC(id) { try { return (W.npcManager && W.npcManager.getNPC) ? W.npcManager.getNPC(id) : null; } catch (e) { return null; } }
    function playerName() { try { return (cd() || {}).name || '无名氏'; } catch (e) { return '无名氏'; } }
    function playerFame() { try { return Number((cd() || {}).fame) || 0; } catch (e) { return 0; } }
    function realmTierOf(r) { try { return typeof W.getRealmTier === 'function' ? (W.getRealmTier(r) || 1) : 1; } catch (e) { return 1; } }
    function tierRankOf(sectName) {
        try {
            if (typeof W.sectPowerNow === 'function') {
                var p = W.sectPowerNow(sectName);
                var L = ['巨擘', '大派', '中等偏上', '中等', '小派', '式微', '残破'];
                var i = p ? L.indexOf(p.tier) : 3;
                return i < 0 ? 6 : i;
            }
        } catch (e) {}
        return 3;
    }
    function seeded(day, salt) {
        var h = (Math.imul(day + 1, 2654435761) ^ Math.imul(salt + 7, 40503)) >>> 0;
        h = (Math.imul((h >>> 16) ^ h, 0x45d9f3b) >>> 0);
        return ((h >>> 16) % 10000) / 10000;
    }
    function saltOf(str) { var s = 0; str = String(str || ''); for (var i = 0; i < str.length; i++) s = (s * 31 + str.charCodeAt(i)) >>> 0; return s % 9973; }
    function dip() { return (W.SECT_DIPLOMACY_STATE = W.SECT_DIPLOMACY_STATE || {}); }
    function dipAdjust(a, b, delta) {
        try {
            var d = dip();
            if (!d[a]) d[a] = {};
            if (!d[b]) d[b] = {};
            if (!d[a][b]) d[a][b] = { relation: 0 };
            if (!d[b][a]) d[b][a] = { relation: 0 };
            var v = Math.max(-100, Math.min(100, (Number(d[a][b].relation) || 0) + delta));
            d[a][b].relation = v; d[b][a].relation = v;
            if (typeof W.saveSectDiplomacy === 'function') W.saveSectDiplomacy();
            return v;
        } catch (e) { return 0; }
    }
    function addC(n, reason) { try { if (typeof W.sectAddContribution === 'function') return W.sectAddContribution(n, reason); } catch (e) {} var d = ds(); if (d) d.contribution = (Number(d.contribution) || 0) + n; }

    // ============ 一 · 破屋（草创阶段的落脚与修缮——长在白手起家栏里） ============
    var PROPS = {
        louwu: { name: '祖传漏屋', desc: '祖父留下的三间屋，屋顶漏风，好在祖龛还在', repairs: [
            { id: 'roof', name: '补屋顶', cost: 25, beds: 1, facade: 1, line: '雨夜不再把人脸打湿' },
            { id: 'shrine', name: '修整祖龛', cost: 40, beds: 0, facade: 2, line: '人进门先作揖——门面是敬出来的' },
            { id: 'room', name: '扩厢房', cost: 80, beds: 2, facade: 1, line: '多出两间屋，床铺有着落了' } ] },
        yuanzi: { name: '老井废院', desc: '前主人逃荒去了，院墙塌了半截，井还在', repairs: [
            { id: 'wall', name: '垒院墙', cost: 45, beds: 1, facade: 1, line: '有了墙才算有家，床铺也安稳' },
            { id: 'well', name: '淘老井', cost: 35, beds: 0, facade: 1, favor: true, line: '井水甜，街坊都来打水——脸就熟了' },
            { id: 'room', name: '扩厢房', cost: 80, beds: 2, facade: 1, line: '多出两间屋，床铺有着落了' } ] },
        daoguan: { name: '荒废道观', desc: '香火断了些年头，神像还在，后殿三间清静', repairs: [
            { id: 'clean', name: '扫殿', cost: 30, beds: 1, facade: 1, quiet: true, line: '清静地界，人心容易安' },
            { id: 'bell', name: '重挂铜钟', cost: 45, beds: 0, facade: 2, line: '晨钟一响，街坊都知道你家的作息' },
            { id: 'room', name: '扩厢房', cost: 80, beds: 2, facade: 1, line: '多出两间屋，床铺有着落了' } ] }
    };
    function shackOf(sect) { return sect && sect.shack ? sect.shack : null; }
    function propOf(sect) { var s = shackOf(sect); return s ? PROPS[s.kind] : null; }
    function stageOf(sect) { try { return (W.PSBoot && W.PSBoot.stageOf) ? W.PSBoot.stageOf(sect) : 0; } catch (e) { return sect && sect.stage != null ? sect.stage : 0; } }
    function capacity(sect) {
        var base = [2, 4, 8][Math.min(2, stageOf(sect))] || 2; // 草创两张铺、赁屋四张、山门八张
        var p = propOf(sect);
        if (p && sect.shack) { for (var i = 0; i < (sect.shack.repairs || []).length; i++) { var r = repById(p, sect.shack.repairs[i]); if (r) base += r.beds; } }
        return base;
    }
    function repById(p, id) { for (var i = 0; i < p.repairs.length; i++) if (p.repairs[i].id === id) return p.repairs[i]; return null; }
    function bedsFull(sect) { return members(sect) >= capacity(sect); }
    function facade(sect) {
        var f = 0, p = propOf(sect);
        if (p && sect.shack) { for (var i = 0; i < (sect.shack.repairs || []).length; i++) { var r = repById(p, sect.shack.repairs[i]); if (r) f += r.facade; } }
        return f;
    }
    function hasSpecial(sect, key) {
        var p = propOf(sect);
        if (!p || !sect.shack) return false;
        for (var i = 0; i < (sect.shack.repairs || []).length; i++) { var r = repById(p, sect.shack.repairs[i]); if (r && r[key]) return true; }
        return false;
    }
    function openShackPanel() {
        var sect = mine();
        if (!sect) { msg('还没立宗——先插旗，再谈落脚。', 'warning'); return; }
        if (sect.shack) { msg('已经落脚在' + propOf(sect).name + '了——修缮在白手起家栏里。', 'info'); return; }
        var html = '<div class="text-left">' + para('🏚 城郊有三处破产业，都没人要——收拾收拾就能落脚。地方是破的，可它是<b>你的</b>。');
        for (var k in PROPS) {
            html += '<div class="bg-gray-900/60 rounded p-2 mb-2"><p class="text-sm text-amber-200">' + PROPS[k].name + '</p><p class="text-xs text-gray-400">' + PROPS[k].desc + '</p>'
                + btn('落脚此处（免费，往后逐级修缮）', 'window.PSectVenture.moveIn(\'' + k + '\')', 'bg-emerald-800 hover:bg-emerald-700') + '</div>';
        }
        html += '</div>';
        modal('🏚 找处破屋落脚', html);
    }
    function moveIn(kind) {
        var sect = mine();
        if (!sect || !PROPS[kind]) return false;
        if (sect.shack) { msg('已经落脚了。', 'info'); return false; }
        if (stageOf(sect) >= 2) { msg('都有山门了，还惦记破屋？', 'info'); return false; }
        sect.shack = { kind: kind, repairs: [], day: today() };
        hist(sect, '落脚' + PROPS[kind].name + '——地方是破的，幡是新的。');
        log('🏚 住进了「' + PROPS[kind].name + '」：不用钱，但要花力气修。床铺两张起步，修一级多几张——修出来的门面，游说时都是实底。（白手起家栏可修缮）', 'success');
        _close();
        try { if (W.openPlayerSectPanel) W.openPlayerSectPanel(); } catch (e) {}
        return true;
    }
    function doRepair(repId) {
        var sect = mine();
        var p = propOf(sect);
        if (!sect || !p) { msg('还没落脚破屋。', 'warning'); return false; }
        if ((sect.shack.repairs || []).indexOf(repId) >= 0) { msg('这一处已经修好了。', 'info'); return false; }
        var r = repById(p, repId);
        if (!r) return false;
        if (!spendStones(sect, r.cost, '修缮' + PROPS[sect.shack.kind].name + '·' + r.name + '，工钱料钱灵石 ' + r.cost + ' 枚')) {
            msg('宗库凑不出' + r.cost + '灵石——先接几件活挣出来。', 'error'); return false;
        }
        sect.shack.repairs.push(repId);
        hist(sect, r.name + '完工：' + r.line + '。');
        if (r.quiet) sect._quiet = true;
        if (r.favor) sect._favor = (Number(sect._favor) || 0) + 2;
        log('🔨 ' + r.name + '修好了——' + r.line + '。（床铺 ' + capacity(sect) + ' 张，门面 ' + facade(sect) + ' 分）', 'success');
        _close();
        try { if (W.openPlayerSectPanel) W.openPlayerSectPanel(); } catch (e) {}
        return true;
    }
    // 同吃第一顿饭（灶修好、人齐了——八苦之三）
    function feedTogether() {
        var sect = mine();
        if (!sect || sect._fedOnce) return false;
        if (!sect.shack || !(sect.shack.repairs || []).length) { msg('屋里还支不起灶——先修缮一处。', 'warning'); return false; }
        if (members(sect) < 1) { msg('就你自己，吃什么团圆饭——先收个人。', 'warning'); return false; }
        if (!spendStones(sect, 3, '买了米面，头一顿团圆饭')) return false;
        sect._fedOnce = true;
        (sect.disciples || []).concat(sect.guests || []).forEach(function (d) { bumpMood(d, 8); });
        chron(sect.name, '立幡以来的第一顿团圆饭——锅里是稠的，碗里是热的。没人说话，呼噜声一片。');
        log('🍚 同吃第一顿饭：米面三灵石，锅里是稠的。（人人心中一暖，心境上涨）', 'success');
        _close();
        return true;
    }

    // ============ 二 · 心境与来路（宗谱上多两列，结算里真出力） ============
    var WHY = { ideal: '为理而来', show: '看了实底来的', pay: '为利而来', bluff: '听大话来的', fame: '慕名来投', revive: '重立山门时回来的', referral: '街坊引荐来的' };
    function moodPts(d) {
        if (!d) return 50;
        if (d.moodPts == null) d.moodPts = d.source === 'bluff' ? 25 : d.source === 'pay' ? 35 : d.source === 'fame' ? 60 : d.source === 'referral' ? 65 : 50;
        return d.moodPts;
    }
    function bumpMood(d, n) { if (!d) return; d.moodPts = Math.max(0, Math.min(100, moodPts(d) + n)); }
    // 第十九波：战事动全员心境——守住山门人心定，山门被破人心浮动（外交线结算调用）
    function bumpMoodAll(sect, n) {
        if (!sect) return;
        (sect.disciples || []).concat(sect.guests || []).forEach(function (d) { bumpMood(d, n); });
    }
    function moodLabel(d) { var p = moodPts(d); return p < 35 ? '观望' : p < 70 ? '安心' : '死心塌地'; }
    function stampMood(d, how) {
        if (!d) return;
        if (d.why == null) d.why = WHY[how] || WHY[ String(d.source || '') ] || '入了门';
        moodPts(d);
        if (how === 'bluff') d.moodPts = Math.min(d.moodPts, 25);
        else if (how === 'pay') d.moodPts = Math.min(d.moodPts, 35);
    }
    function leaveChance(d) {
        var lab = moodLabel(d);
        return lab === '观望' ? 0.45 : lab === '安心' ? 0.25 : 0.05; // 欠俸时：观望的最先熬不住，死心塌地的能扛
    }
    function markElders(sect) {
        var all = (sect.disciples || []).concat(sect.guests || []);
        var n = 0;
        for (var i = 0; i < all.length && n < 5; i++) { if (all[i]) { all[i].elder = true; n++; } }
    }
    function onSalary(sect, paid) {
        if (!sect || sect._ruined) return;
        markElders(sect);
        var all = (sect.disciples || []).concat(sect.guests || []);
        if (paid) {
            sect._salaryPaidOnce = true;
            all.forEach(function (d) { bumpMood(d, 6); });
            bumpRumor(sect, 1);
        } else {
            all.forEach(function (d) { bumpMood(d, -12); });
            onViolation(sect, 'owe'); // 欠俸上官府的档簿（街谈的罚在 onViolation 里，不双扣）
        }
    }

    // ============ 三 · 带人接活（力气换钱，雇主有名有姓） ============
    var JOBS = [
        { id: 'bug', name: '药圃除虫', who: '街坊王婆婆', pay: 3, energy: 15, time: 60, need: 1, favor: 1 },
        { id: 'copy', name: '抄录经书', who: '集文书坊', pay: 4, energy: 20, time: 90, need: 1 },
        { id: 'haul', name: '码头搬货', who: '赵记车马行', pay: 5, energy: 30, time: 120, need: 2 },
        { id: 'herb', name: '城郊采药', who: '回春堂', pay: 5, energy: 25, time: 120, need: 1, herbRisk: 0.15 },
        { id: 'escort', name: '押镖短程', who: '震威镖局', pay: 12, energy: 30, time: 180, need: 2, ambush: 0.25 },
        { id: 'night', name: '替看夜摊', who: '街口陈灯户', pay: 3, energy: 10, time: 60, need: 1, favor: 1 },
        { id: 'roof', name: '替邻修顶', who: '樵夫老李', pay: 3, energy: 20, time: 90, need: 1, favor: 2 },
        { id: 'sectjob', name: '老门派的小委托', who: null, pay: 20, energy: 35, time: 180, need: 3, gate: 'goodwill' }
    ];
    function todaysJobs(sect) {
        var day = today();
        var pool = [];
        JOBS.forEach(function (j) {
            if (j.gate === 'goodwill') {
                var v = sect._visit;
                if (!((v && v.state === 'visited') || playerFame() >= 15)) return;
                var copy = {};
                for (var k in j) copy[k] = j[k];
                copy.who = (v && v.sect) ? v.sect : '过路的管事';
                pool.push(copy);
                return;
            }
            pool.push(j);
        });
        var out = [];
        var salt = saltOf(sect.name || 'sect');
        for (var i = 0; i < 3 && pool.length; i++) {
            var idx = Math.floor(seeded(day * 7 + i * 131, salt) * pool.length) % pool.length;
            out.push(pool[idx]);
            pool.splice(idx, 1);
        }
        return out;
    }
    function openJobPanel() {
        var sect = mine();
        if (!sect) { msg('还没立宗——活是接给谁干的？', 'warning'); return; }
        if (sect._ruined) { msg('幡都倒了，先回旧址把山门重立起来。', 'warning'); return; }
        var jobs = todaysJobs(sect);
        var blocked = (Number(sect._jobBlockedUntil) || 0) > today();
        var html = '<div class="text-left">' + para('💪 今日街面上的活（' + (blocked ? '<span class="text-red-300">风声紧，没人敢雇你们</span>' : '干一件，人手一天的力气就这么多') + '）');
        var awayN = members(sect) - homeCount(sect);
        html += '<p class="text-xs text-gray-500 mb-2">门中 ' + homeCount(sect) + ' 人在山' + (awayN > 0 ? '（另有 ' + awayN + ' 人下山未归）' : '') + ' · 你的精力 ' + energy() + ' · 宗库 ' + Math.round(Number(sect.resources.spiritStones) || 0) + ' 灵石 · 街坊人情 ' + (Number(sect._favor) || 0) + '</p>';
        jobs.forEach(function (j, i) {
            var okNeed = homeCount(sect) + 1 >= j.need;
            var okEnergy = energy() >= j.energy;
            var tags = [];
            if (j.favor) tags.push('人情+' + j.favor);
            if (j.ambush) tags.push('可能撞劫道的（真仗）');
            if (j.herbRisk) tags.push('可能认错苗');
            html += '<div class="flex justify-between items-center bg-gray-900/60 rounded p-2 mb-1">'
                + '<span class="text-xs text-gray-300">' + j.name + ' <span class="text-gray-500">· ' + (j.who || '街坊') + ' · 灵石' + j.pay + ' · 精力' + j.energy + ' · ' + (j.time / 60) + '时辰 · 要' + j.need + '人手' + (tags.length ? ' · ' + tags.join('，') : '') + '</span></span>'
                + (blocked ? '<span class="text-[11px] text-gray-600">风声紧</span>'
                    : btn('接', 'window.PSectVenture.doJob(' + i + ')', (okNeed && okEnergy) ? 'bg-green-700 hover:bg-green-600' : 'bg-gray-700') )
                + '</div>';
        });
        html += '</div>';
        modal('💪 带人接活', html);
    }
    function moodMul(sect) {
        var all = (sect.disciples || []).concat(sect.guests || []).filter(function (d) { return d && !d.away; });
        if (!all.length) return 1;
        var s = 0;
        all.forEach(function (d) { var l = moodLabel(d); s += l === '观望' ? 0.9 : l === '死心塌地' ? 1.1 : 1; });
        return s / all.length;
    }
    function doJob(i) {
        var sect = mine();
        if (!sect) return false;
        if ((Number(sect._jobBlockedUntil) || 0) > today()) { msg('风声还没过——过几日再来接活。', 'warning'); return false; }
        if (sect._jobDay === today()) { msg('今日已经带人干过一场了——人手一天的力气就这么多，明日赶早。', 'info'); return false; }
        var jobs = todaysJobs(sect);
        var j = jobs[i];
        if (!j) return false;
        if (homeCount(sect) + 1 < j.need) { msg('「' + j.name + '」要' + j.need + '个人手——山里连你只有' + (homeCount(sect) + 1) + '个，接不下。', 'warning'); return false; }
        if (energy() < j.energy) { msg('精力不够——歇一歇，明日再来。', 'warning'); return false; }
        sect._jobDay = today();
        spendEnergy(j.energy);
        advance(j.time, j.name);
        if (j.ambush && seeded(today(), saltOf(sect.name) + 999) < j.ambush) {
            // 押镖撞上劫道的——真仗（走既有战斗结算钩子）
            sect._jobPending = { pay: j.pay, who: j.who, name: j.name, favor: j.favor || 0 };
            var tier = Math.max(1, realmTierOf((cd() || {}).realm));
            if (typeof W.startBattle === 'function') {
                var b = W.startBattle({
                    name: '劫道的散修头目', type: 'enemy', physiologyType: 'humanoid',
                    level: Math.max(1, (typeof W.realmScaledEnemyLevel === 'function' ? W.realmScaledEnemyLevel(cd()) : tier * 3)),
                    attack: Math.round(28 + tier * 6), defense: Math.round(14 + tier * 4), speed: Math.round(16 + tier * 2),
                    maxDurability: Math.round(90 + tier * 15), durabilities: { chest: Math.round(90 + tier * 15) },
                    combatAbilities: [], description: '盯上了你们这趟镖——狭路相逢，货物和脸面只能保一样。'
                });
                if (b) { b._isPsJobBattle = true; b._psJobDay = today(); }
                _close();
                log('⚔️ 镖走到半路，林子里呼哨一声——劫道的拦了路。这仗躲不掉。（真仗：赢了镖钱全拿，输了折半）', 'danger');
                return true;
            }
        }
        if (j.herbRisk && seeded(today(), saltOf(sect.name) + 555) < j.herbRisk) {
            // 认错苗：牌面上写的风险真兑现——半筐草白费，工钱折半（活照记一场）
            settleJob(sect, j, true, true);
            return true;
        }
        settleJob(sect, j, true);
        return true;
    }
    function settleJob(sect, j, win, herbFail) {
        var pay = Math.max(1, Math.round(j.pay * moodMul(sect) * (win ? (herbFail ? 0.5 : 1) : 0.5)));
        addStones(sect, pay, '接活「' + j.name + '」（' + (j.who || '街坊') + '付的工钱）：灵石 ' + pay + ' 入宗库' + (win ? (herbFail ? '（认错苗，半筐草白费，工钱折半）' : '') : '（镖折了半程，工钱折半）'));
        if (win && !herbFail && j.favor) sect._favor = (Number(sect._favor) || 0) + j.favor;
        sect._jobsDone = (Number(sect._jobsDone) || 0) + 1;
        var moodD = (win && !herbFail) ? 2 : -1;
        (sect.disciples || []).concat(sect.guests || []).forEach(function (d) { bumpMood(d, moodD); });
        _close();
        log(herbFail
            ? '🌿 认错了苗——「' + j.name + '」采回来的半筐是长得像的野草，' + (j.who || '雇主') + '只肯付一半工钱：灵石' + pay + '。就当交了学费。（干活的心里都挺丧气）'
            : (win
                ? '💪 「' + j.name + '」干完了——' + (j.who || '街坊') + '数出灵石' + pay + '枚，活钱入宗库。' + (j.favor ? '（街坊人情+' + j.favor + '）' : '') + '（干活的都觉着这日子有奔头）'
                : '💧 镖折在半路——货保住一半，' + (j.who || '雇主') + '只肯付一半工钱：灵石' + pay + '。人没事就是万幸。'), (win && !herbFail) ? 'success' : 'warning');
    }
    function settleJobBattle(win) {
        var sect = mine();
        if (!sect || !sect._jobPending) return;
        var j = sect._jobPending;
        sect._jobPending = null;
        if (!win) spendEnergy(10);
        settleJob(sect, { name: j.name, who: j.who, pay: j.pay, favor: j.favor }, win);
        if (win) bumpRumor(sect, 1);
    }

    // ============ 四 · 社交面板招揽（自建宗门走游说；身在门派按位分） ============
    function inAnySect(npc) {
        if (!npc) return true;
        if (npc.sect) return true;
        try { if (npc.location && W.SECT_INTERNAL && W.SECT_INTERNAL[npc.location]) return true; } catch (e) {}
        return String(npc.id || '').indexOf('sect_') === 0;
    }
    function canRecruit(npc) {
        if (!homeName() && !(ds() && ds().isInSect)) return false; // 自己都没门庭，招谁去
        if (!npc || npc.isDead || npc._companionData || npc.isCompanion || npc.isDaoCompanion) return false;
        if (inAnySect(npc)) return false;
        if (npc.type === '商人' || npc.profession === 'merchant') return false; // 铺子走不开
        return true;
    }
    function recruitFromSocial(npc) {
        if (!npc) return { success: false, msg: '人呢？' };
        if (!homeName() && !(ds() && ds().isInSect)) return { success: false, msg: '你自己还在江湖上漂着——先立个门庭，或拜进哪家山门，再来谈招揽。' };
        if (npc.isDead) return { success: false, msg: '斯人已逝。' };
        if (npc._companionData || npc.isCompanion || npc.isDaoCompanion) return { success: false, msg: '她是与你同行的人，不是门徒。' };
        if (inAnySect(npc)) return { success: false, msg: '「' + npc.name + '」已有门有派——挖墙脚的事，江湖上不体面。' };
        if (npc.type === '商人' || npc.profession === 'merchant') return { success: false, msg: '「' + npc.name + '」的铺子走不开——人家是靠铺子吃饭的。' };
        var built = homeName();
        if (built) {
            var sect = mine();
            if (bedsFull(sect)) { msg('家里床铺不够了——先修缮屋子，再谈收人。', 'warning'); return { success: true, suppressMessage: true }; }
            // 自建宗门：走既有游说四话术（日限/虚名债/穿帮全是现成规矩）
            var html = '<div class="text-left">' + para('🏮 招揽「' + npc.name + '」入「' + built + '」——四套话术，各有代价：');
            html += btn('🗣 晓之以理——把立宗的本心讲给他听', 'window.PSectVenture.doSocialRecruit(\'' + npc.id + '\',\'ideal\')', 'bg-sky-800 hover:bg-sky-700');
            html += btn('🏠 亮实底——带他看你的家业（破屋修缮都是实底）', 'window.PSectVenture.doSocialRecruit(\'' + npc.id + '\',\'show\')', 'bg-emerald-800 hover:bg-emerald-700');
            html += btn('💰 许好处——见面礼三十灵石，掏你自己的腰包', 'window.PSectVenture.doSocialRecruit(\'' + npc.id + '\',\'pay\')', 'bg-amber-800 hover:bg-amber-700');
            html += btn('🎺 吹牛撒谎——把门面说大（成了记虚名债，早晚要圆）', 'window.PSectVenture.doSocialRecruit(\'' + npc.id + '\',\'bluff\')', 'bg-red-900 hover:bg-red-800');
            html += '</div>';
            modal('🏮 招揽 · ' + npc.name, html);
            return { success: true, suppressMessage: true };
        }
        // 身在门派：按位分说话
        var d = ds();
        var rank = d.rank == null ? 7 : d.rank;
        if (rank >= 7) { msg('执事堂不收杂役的荐书——「' + npc.name + '」这样的人物，得有位分的人引荐。等升了位分，说话才有分量。', 'warning'); return { success: true, suppressMessage: true }; }
        if (rank <= 2) {
            var html2 = '<div class="text-left">' + para('🏮 你是「' + d.sectName + '」的' + (d.rankName || '长老') + '——有资格直接发话收人。请「' + npc.name + '」入门，成不成看你的脸面与他的心意。');
            html2 += btn('🤝 当面相邀（耗半个时辰，成否看好感、你的贡献与门派体面）', 'window.PSectVenture.doInvite(\'' + npc.id + '\')', 'bg-amber-800 hover:bg-amber-700');
            html2 += '</div>';
            modal('🏮 直接邀请 · ' + npc.name, html2);
            return { success: true, suppressMessage: true };
        }
        var html3 = '<div class="text-left">' + para('🏮 你的位分（' + (d.rankName || '弟子') + '）发不了收人的话——但可以<b>说服「' + npc.name + '」上山面试</b>：他肯去，执事再相看（看门里的粮草士气，也看你荐书的分量）。');
        html3 += btn('📜 荐他上山（先说动他，再过执事那关）', 'window.PSectVenture.doRecommend(\'' + npc.id + '\')', 'bg-sky-800 hover:bg-sky-700');
        html3 += '</div>';
        modal('🏮 荐人面试 · ' + npc.name, html3);
        return { success: true, suppressMessage: true };
    }
    function recruitGate(npcId) {
        var key = 'ps_rec_day_' + npcId;
        if ((Number(flags()[key]) || 0) > today()) { msg('他前脚才回绝了你——缓几日再开这个口。', 'info'); return false; }
        return true;
    }
    function markRecruitFail(npcId) { flags()['ps_rec_day_' + npcId] = today() + 7; }
    function npcRealmGap(npc) { return realmTierOf((npc.combat && npc.combat.realm) || npc.realm) - realmTierOf((cd() || {}).realm); }
    function doSocialRecruit(npcId, approach) {
        _close();
        var sect = mine();
        if (!sect || !W.PSBoot || !W.PSBoot.doRecruit) return false;
        var r = W.PSBoot.doRecruit(npcId, approach);
        if (r && r.ok) {
            var dd = (sect.disciples || []).filter(function (x) { return x.npcId === npcId; })[0];
            if (dd) { stampMood(dd, approach); markElders(sect); }
            log('🏮 「' + (r.name || ((getNPC(npcId) || {}).name) || '新人') + '」应了——头一日进门，眼睛到处看。（宗谱发了腰牌，心境记在谱上）', 'success');
        } else if (r && r.text) msg(r.text, 'warning');
        return !!(r && r.ok);
    }
    function joinNpcSect(npc, sectName, reason) {
        npc.sect = sectName;
        try { npc.location = sectName; } catch (e) {}
        var it = (W.SECT_INTERNAL || {})[sectName];
        if (it) it.disciples = (Number(it.disciples) || 0) + 1;
        try { if (npc.changeAffection) npc.changeAffection(5); else if (npc.relationship) npc.relationship.affection = Math.min(100, (Number(npc.relationship.affection) || 0) + 5); } catch (e2) {}
        chron(sectName, playerName() + reason + '「' + npc.name + '」——执事验过根骨，收入门墙。族谱添了一笔。');
        street('「' + sectName + '」又收了个新弟子，听说引荐的人是' + playerName() + '。茶棚里有人点头：「这门派看着还成，人家肯往里荐人。」');
        return true;
    }
    function doInvite(npcId) {
        var d = ds();
        if (!d || !d.isInSect) { msg('你不在门派里。', 'warning'); return false; }
        var npc = getNPC(npcId);
        if (!npc || !canRecruit(npc)) { msg('这人招不了。', 'warning'); return false; }
        if (!recruitGate(npcId)) return false;
        var sectName = d.sectName || d.sectId;
        advance(30, '当面相邀');
        var aff = Number((npc.relationship && npc.relationship.affection) || npc.affection || 0);
        var tierBonus = Math.max(0, 10 - tierRankOf(sectName) * 2);
        var gap = npcRealmGap(npc);
        var chance = Math.max(5, Math.min(90, 25 + aff * 0.5 + Math.min(20, (Number(d.contribution) || 0) / 100) + tierBonus + (d.rank === 0 ? 15 : d.rank === 1 ? 10 : 5) - Math.max(0, gap) * 20));
        if (seeded(today(), saltOf(npcId)) * 100 < chance) {
            joinNpcSect(npc, sectName, '亲自相邀，收');
            addC(15, '招揽之功');
            _close();
            log('🏮 「' + npc.name + '」接了你的帖——即日起是「' + sectName + '」的人了。往后他就是你的同门：能拼酒、能切磋、能交厚。（贡献+15「招揽之功」，他记着你的情：好感+5）', 'success');
            return true;
        }
        markRecruitFail(npcId);
        _close();
        msg('「' + npc.name + '」拱了拱手：「' + (gap > 0 ? '我修为在你之上，拜进门去，图什么呢？」' : '入门是大事，容我再想想。」') + '（七日内再提，他只会当你是纠缠）', 'warning');
        return false;
    }
    function doRecommend(npcId) {
        var d = ds();
        if (!d || !d.isInSect) { msg('你不在门派里。', 'warning'); return false; }
        var npc = getNPC(npcId);
        if (!npc || !canRecruit(npc)) { msg('这人招不了。', 'warning'); return false; }
        if (!recruitGate(npcId)) return false;
        var sectName = d.sectName || d.sectId;
        var it = (W.SECT_INTERNAL || {})[sectName] || {};
        advance(30, '荐人上山');
        var aff = Number((npc.relationship && npc.relationship.affection) || npc.affection || 0);
        var gap = npcRealmGap(npc);
        // 第一关：说动他上山
        var c1 = Math.max(5, Math.min(90, 30 + aff * 0.6 - Math.max(0, gap) * 15));
        if (seeded(today(), saltOf(npcId) + 11) * 100 >= c1) {
            markRecruitFail(npcId);
            _close();
            msg('「' + npc.name + '」摇头：「与你那门派无冤无仇，也没缘没分——不去。」（话没说到，七日内别再提）', 'warning');
            return false;
        }
        // 第二关：执事面试（看门里粮草士气、看你位分贡献）
        if ((Number(it.disciples) || 0) >= 60) {
            markRecruitFail(npcId);
            _close();
            msg('执事翻了翻名册，摇头：「门里住不下了——粮册上再添一笔，这个月就要见亏。」（人满，不收）', 'warning');
            return false;
        }
        var rankW = { 3: 15, 4: 10, 5: 5, 6: 2 }[d.rank] || 2;
        var c2 = Math.max(5, Math.min(90, 25 + (Number(it.morale) || 50) * 0.2 + ((Number(it.grain) || 0) >= 20 ? 10 : -10) + rankW + Math.min(15, (Number(d.contribution) || 0) / 150) - Math.max(0, gap) * 10));
        if (seeded(today(), saltOf(npcId) + 29) * 100 < c2) {
            joinNpcSect(npc, sectName, '经执事面试，收');
            addC(10, '荐才之功');
            _close();
            log('🏮 执事在偏殿见了「' + npc.name + '」，问了根骨籍贯，点头收了——你的荐书有分量。（贡献+10「荐才之功」，他记着你的情：好感+5）', 'success');
            return true;
        }
        markRecruitFail(npcId);
        _close();
        msg('执事把荐书放下，客客气气：「人是好人——只是门里如今' + ((Number(it.grain) || 0) < 20 ? '粮薄，养不起闲人' : '士气不齐，暂不添人') + '。你的荐书，记下了。」（面试没过：不怪你，也不怪他。七日内别再荐）', 'warning');
        return false;
    }

    // ============ 五 · 街坊的目光（闲话/登门/月查——全走既有管线） ============
    function bumpRumor(sect, n) { sect._rumor = Math.max(-3, Math.min(3, (Number(sect._rumor) || 0) + n)); }
    function rumorOf(sect) { return Number(sect._rumor) || 0; }
    function weeklyRumor(sect) {
        var s = seeded(Math.floor(today() / 7), saltOf(sect.name) + 7);
        var line = null;
        if (sect.lieDebt && s < 0.4) line = '茶棚里有人学「' + sect.name + '」掌门吹过的牛，满座哄笑——笑完了有人嘀咕：「也不知道是真是假。」';
        else if (rumorOf(sect) >= 2 && s < 0.5) line = '茶博士说起「' + sect.name + '」：「那家人实诚，俸银发得齐，干活也不偷懒。」有客官点头。';
        else if ((Number(sect._jobsDone) || 0) >= 3 && s < 0.6) line = '街坊提起「' + sect.name + '」：「除虫押镖什么都接，收钱公道。」——名声是干出来的。';
        else if (rumorOf(sect) <= -2 && s < 0.4) line = '有人压低了声音：「' + sect.name + '？呵，那家的账，你最好别沾。」';
        if (line) street(line);
    }
    function pickVisitor(sect) {
        var all = W.sectsData || {};
        var cands = [];
        for (var name in all) {
            if (name === sect.name) continue;
            try { if (W.sectIsRuined && W.sectIsRuined(name)) continue; } catch (e) {}
            try { if (W.PSBoot && W.PSBoot.isPlayerSect && W.PSBoot.isPlayerSect(name)) continue; } catch (e2) {}
            cands.push(name);
        }
        if (!cands.length) return null;
        return cands[Math.floor(seeded(today(), saltOf(sect.name) + 313) * cands.length) % cands.length];
    }
    function visitModal(sect, who) {
        if (!sect._visit) {
            sect._visit = { sect: who, state: 'asking' };
            hist(sect, '「' + who + '」遣人递帖：新立的家业，该懂懂街面上的规矩。');
        }
        modal('🏮 ' + who + ' 来人「谈谈」', para('来人是「' + who + '」的外事执事，茶是自带的，话是笑着说的：')
            + para('「贵派新立，可喜可贺。街面上的老规矩——新幡挂起来，总得给老街坊沾点香火气。一个月十五灵石，图个太平；不然嘛，你们也可以自己站着——就是站不站得稳，不好说。」')
            + para('<span class="text-xs text-gray-500">（交钱是买太平；硬顶是结梁子，他们真会来挖人；备礼回访是把这份「规矩」换成一门真交情——往后你办盛会、举幡争城，外交账上都有他们一笔。）</span>')
            + '<div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">'
            + btn('💰 交香火钱——每月十五灵石，买三个月太平（宗库按月真扣）', 'window.PSectVenture.visitChoice(\'pay\')', 'bg-amber-800 hover:bg-amber-700')
            + btn('🗡 硬顶回去——「规矩？我立我的幡，碍着谁了」（结梁子：外交关系真掉，月月防挖人）', 'window.PSectVenture.visitChoice(\'defy\')', 'bg-red-900 hover:bg-red-800')
            + btn('🎁 备礼回访——灵石三十登门拜会（关系真涨：往后盛会举幡，他们是肯来肯作证的那家）', 'window.PSectVenture.visitChoice(\'visit\')', 'bg-emerald-800 hover:bg-emerald-700')
            + '</div>');
    }
    function reopenVisit() {
        var sect = mine();
        if (sect && sect._visit && sect._visit.state === 'asking') visitModal(sect, sect._visit.sect);
    }
    function visitChoice(kind) {
        var sect = mine();
        if (!sect || !sect._visit || sect._visit.state !== 'asking') return;
        var who = sect._visit.sect;
        if (kind === 'pay') {
            if (!spendStones(sect, 15, '「' + who + '」的香火钱（头一个月）')) { msg('宗库连十五灵石都凑不出——那就只剩硬顶一条路了。', 'error'); return; }
            sect._visit.state = 'paid';
            sect._visit.until = monthIdx() + 3;
            log('💰 香火钱交了头一月（十五灵石）——「' + who + '」的执事笑着拱手：「懂规矩。」往后两月，月结时宗库自动再扣。（买的是太平：他们不来挖人）', 'info');
        } else if (kind === 'defy') {
            sect._visit.state = 'defied';
            dipAdjust(sect.name, who, -15);
            bumpRumor(sect, -1);
            street('「' + sect.name + '」把「' + who + '」的人顶了回去。茶棚里说什么的都有——有人说硬气，有人说不知死活。');
            log('🗡 你硬顶了回去。「' + who + '」的执事脸色没变，茶也没喝完就走了。（外交关系真掉十五——往后盛会他不来、举幡他不帮；月月提防他们挖你的人）', 'warning');
        } else {
            if (!spendStones(sect, 30, '备礼回访「' + who + '」——礼单折灵石三十')) { msg('宗库凑不出三十灵石的礼——礼薄不如不登门。', 'error'); return; }
            sect._visit.state = 'visited';
            dipAdjust(sect.name, who, 30);
            sect._favor = (Number(sect._favor) || 0) + 2;
            bumpRumor(sect, 1);
            log('🎁 你备礼登门回访——「' + who + '」的掌门亲自迎到二门。这碗茶喝完，街面上的「规矩」就换成了交情。（外交关系真涨三十：往后你办盛会他肯来，举幡争城他肯作证；「老门派的小委托」这类活，也会送到你门上）', 'success');
        }
        _close();
    }
    function monthlyVisitAndGov(sect) {
        // 香火钱月扣（欠了就翻脸——梁子比没交过还深）
        if (sect._visit && sect._visit.state === 'paid') {
            if (monthIdx() > sect._visit.until) { sect._visit.state = 'done'; }
            else if (!spendStones(sect, 15, '「' + sect._visit.sect + '」的香火钱（按月）')) {
                dipAdjust(sect.name, sect._visit.sect, -10);
                sect._visit.state = 'defied';
                hist(sect, '香火钱断了——「' + sect._visit.sect + '」的脸比没交过还难看。');
                log('🗡 宗库凑不出这个月的香火钱——「' + sect._visit.sect + '」把这笔账记下了。（关系再掉十，月月防挖人）', 'danger');
            }
        }
        // 结梁子的人家，月月有机会挖你的人（心境低的先动）
        if (sect._visit && sect._visit.state === 'defied' && seeded(monthIdx(), saltOf(sect.name) + 77) < 0.25) {
            var all = (sect.disciples || []).filter(function (d) { return d && !d.away; }).slice().sort(function (a, b) { return moodPts(a) - moodPts(b); });
            var target = null;
            for (var i = 0; i < all.length; i++) {
                var lab = moodLabel(all[i]);
                var p = lab === '观望' ? 0.6 : lab === '安心' ? 0.3 : 0;
                if (seeded(monthIdx(), saltOf(all[i].npcId || String(i)) + 88) < p) { target = all[i]; break; }
            }
            if (target) {
                try { P().dismissDisciple(sect.id, target.npcId); } catch (e) {}
                hist(sect, '「' + (target.name || '一名弟子') + '」被「' + sect._visit.sect + '」挖走了——人家开的条件，你给不起。');
                street('「' + sect._visit.sect + '」从「' + sect.name + '」挖走了一个人。茶棚里议论：新幡留不住人，还是老幡稳当。');
                bumpRumor(sect, -1);
                log('🗡 「' + (target.name || '一名弟子') + '」连夜走了——「' + sect._visit.sect + '」挖的。心境低的人，别人一伸手就跟走。（把俸银发齐、把日子过好，人心才稳）', 'danger');
            }
        }
        // 官府月查：档满三笔，除名危机
        var gov = (sect._gov = sect._gov || { record: 0 });
        if (gov.dirty) { gov.dirty = false; } else if (gov.record > 0) { gov.record -= 1; } // 安分一个月，档簿翻篇一笔
        if (gov.record >= 3 && !gov.crisis) {
            gov.crisis = true;
            modal('📜 官府的册子', para('差役又登门了。这回没喝茶，直接翻册子：「欠俸、虚名、街坊的状子——三笔了。按律，除名销册。」')
                + para('「' + playerName() + '」，三条路：缴罚金销档；请街坊作保；或者硬扛——扛得住扛不住，看运气。')
                + '<div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">'
                + btn('💰 缴罚金五十灵石，销档（宗库真扣）', 'window.PSectVenture.govChoice(\'pay\')', 'bg-amber-800 hover:bg-amber-700')
                + btn('🤝 请街坊作保（人情五分以上，耗三分——街坊肯替你说话）', 'window.PSectVenture.govChoice(\'favor\')', 'bg-emerald-800 hover:bg-emerald-700')
                + btn('😤 硬扛（档不销，月月有麻烦）', 'window.PSectVenture.govChoice(\'brave\')', 'bg-red-900 hover:bg-red-800')
                + '</div>');
        } else if (gov.crisis && seeded(monthIdx(), saltOf(sect.name) + 55) < 0.3) {
            // 硬扛的代价：月月有麻烦
            if (seeded(monthIdx(), saltOf(sect.name) + 56) < 0.5 && spendStones(sect, 10, '官府的罚金（硬扛的代价）')) {
                log('📜 官府寻了个由头罚了十灵石——硬扛的日子，处处是钱。', 'warning');
            } else {
                sect._jobBlockedUntil = today() + 7;
                log('📜 官府放了话：这几日街面上的活，谁也不许雇「' + sect.name + '」的人。（活单断了七日）', 'danger');
            }
        }
        // 老门派登门（家里满五人，一次）
        if (members(sect) >= 5 && !sect._visit && seeded(monthIdx(), saltOf(sect.name) + 99) < 0.35) {
            var who = pickVisitor(sect);
            if (who) visitModal(sect, who);
        }
    }
    function govChoice(kind) {
        var sect = mine();
        if (!sect || !sect._gov || !sect._gov.crisis) return;
        if (kind === 'pay') {
            if (!spendStones(sect, 50, '官府罚金——销档')) { msg('宗库凑不出五十——那就只剩作保或硬扛。', 'error'); return; }
            sect._gov.record = 0; sect._gov.crisis = false;
            log('📜 罚金五十缴清，差役当面销了档。他收笔时说了一句：「安分做生意，官府不为难。」', 'success');
        } else if (kind === 'favor') {
            if ((Number(sect._favor) || 0) < 5) { msg('街坊人情不够厚——没五分以上，没人肯替你在官府面前作保。', 'warning'); return; }
            sect._favor -= 3;
            sect._gov.record = 1; sect._gov.crisis = false;
            street('官府要销「' + sect.name + '」的册，街坊联名作了保——王婆婆第一个按的手印：「这家人实诚。」');
            log('📜 街坊联名作保，档簿只剩一笔。（人情耗去三分——作保是花脸面的事）', 'success');
        } else {
            sect._gov.record += 1;
            log('😤 你硬扛了下来。差役冷笑一声，把册子合上了：「下月还来。」（档又厚一笔，月月有麻烦）', 'warning');
        }
        _close();
    }
    function onViolation(sect, kind) {
        if (!sect) return;
        sect._gov = sect._gov || { record: 0 };
        sect._gov.record += 1;
        sect._gov.dirty = true;
        bumpRumor(sect, -1);
        if (kind === 'owe') hist(sect, '欠俸上了官府的档簿。');
    }
    // 街坊引荐（人情换人——高心境新人自己上门）
    function doReferral() {
        var sect = mine();
        if (!sect) return false;
        if ((Number(sect._favor) || 0) < 5) { msg('街坊人情不够厚——平时多接几件街坊的活。', 'warning'); return false; }
        if (bedsFull(sect)) { msg('家里床铺不够了——先修缮屋子。', 'warning'); return false; }
        var cands = [];
        try {
            var inRoster = {};
            (sect.disciples || []).concat(sect.guests || []).forEach(function (x) { if (x && x.npcId) inRoster[x.npcId] = 1; });
            cands = ((W.npcManager && W.npcManager.getAllNPCs ? W.npcManager.getAllNPCs() : []) || []).filter(function (n) {
                return n && n.id && !n.isDead && !inAnySect(n) && !inRoster[n.id] && !n._companionData && !n.isCompanion && n.type !== '商人'
                    && String(n.id).indexOf('sect_') !== 0 && !n.isDaoCompanion;
            });
        } catch (e) {}
        if (!cands.length) { msg('街坊想荐人，可这城里实在没有闲着的合适人选。', 'info'); return false; }
        sect._favor -= 5;
        var who = cands[Math.floor(seeded(today(), saltOf(sect.name) + 424) * cands.length) % cands.length];
        var rr = null;
        try { rr = P().recruitDisciple(sect.id, who.id); } catch (e2) {}
        if (!rr || !rr.ok) { msg('人是荐来了，却没留下——缘分不到。（人情照耗，下回再请街坊留意）', 'warning'); return false; }
        var dd = (sect.disciples || []).filter(function (x) { return x.npcId === who.id; })[0];
        if (dd) { dd.name = who.name; dd.source = 'referral'; stampMood(dd, 'referral'); markElders(sect); }
        hist(sect, '街坊引荐：「' + who.name + '」上门入伙——是王婆婆拍着胸脯荐的，错不了。');
        street('「' + sect.name + '」又进人了——是街坊领上门的。有人肯替他家作保，这买卖就错不了。');
        bumpRumor(sect, 1);
        msg('🤝 街坊把「' + who.name + '」领上了门——引荐来的，一进门就是安心人。（人情耗五分，宗谱发了腰牌）', 'success');
        return true;
    }

    // ============ 六 · 心境小事（月度一件，真选择真代价） ============
    function moodEventPick(sect) {
        var all = (sect.disciples || []).concat(sect.guests || []).filter(function (d) { return d && !d.away; });
        var elders = all.filter(function (d) { return d.elder; });
        var pool = elders.length && seeded(monthIdx(), saltOf(sect.name) + 601) < 0.7 ? elders : all;
        if (!pool.length) return;
        var who = pool[Math.floor(seeded(monthIdx(), saltOf(sect.name) + 602) * pool.length) % pool.length];
        var nm = who.name || ((getNPC(who.npcId) || {}).name) || '一名弟子';
        var kind = ['letter', 'sick', 'foe', 'home'][Math.floor(seeded(monthIdx(), saltOf(who.npcId || nm) + 603) * 4) % 4];
        sect._moodEvent = { npcId: who.npcId, kind: kind, month: monthIdx() };
        var scenes = {
            letter: { t: '📮 家里来信', p: '「' + nm + '」捏着一封家书在院角站了半宿。信上说家里娘病了，弟妹还小——他没开口，可眼睛一直在看你。', a: ['💰 替他寄十灵石回去（自掏腰包）', '🗣 陪他说说话（不花钱，但该说的你得说）'] },
            sick: { t: '🤒 病了', p: '「' + nm + '」早上没起来——额头烫得吓人。抓药要五灵石，宗库或你的行囊，总得有一个出。', a: ['💊 抓药（五灵石，你出）', '🍵 让他扛着（穷人家的病，扛扛就过去了？）'] },
            foe: { t: '⚔️ 旧对头找上门', p: '街口有人点名找「' + nm + '」——是他从前的对头，来者不善。「' + nm + '」站在你身后，手在抖。', a: ['🛡 你出头挡下（耗精力二十，成不成看气势）', '🚪 让他自己面对（他的债，他自己还）'] },
            home: { t: '🌙 想家了', p: '「' + nm + '」夜里坐在门槛上数星星。听见你的脚步声，他慌忙站起来——「掌门，我没事。就是……有点想家。」', a: ['🍶 陪他坐一个时辰（说说你的来路）', '👋 拍拍肩，回去睡（日子还长）'] }
        };
        var sc = scenes[kind];
        modal(sc.t, para(sc.p) + '<div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">'
            + btn(sc.a[0], 'window.PSectVenture.moodEventChoice(true)', 'bg-emerald-800 hover:bg-emerald-700')
            + btn(sc.a[1], 'window.PSectVenture.moodEventChoice(false)', 'bg-gray-700 hover:bg-gray-600')
            + '</div>');
    }
    function moodEventChoice(generous) {
        var sect = mine();
        if (!sect || !sect._moodEvent) return;
        var ev = sect._moodEvent;
        sect._moodEvent = null;
        var all = (sect.disciples || []).concat(sect.guests || []);
        var who = all.filter(function (d) { return d.npcId === ev.npcId; })[0];
        if (!who) { _close(); return; }
        var nm = who.name || '他';
        if (ev.kind === 'letter') {
            if (generous && payWallet(10)) { bumpMood(who, 12); hist(sect, '「' + nm + '」的家书：你替他寄了十灵石回去。他把这事记了一辈子。'); log('📮 你替「' + nm + '」寄了十灵石回家——他没说什么，第二天干活比谁都卖力。（心境大涨）', 'success'); }
            else { bumpMood(who, generous ? 2 : -8); log(generous ? '📮 行囊里也凑不出——你陪「' + nm + '」说了半宿的话。（心境小涨）' : '📮 「' + nm + '」把家书折好收进怀里，笑了笑说没事。（心境下挫——他没说的事，心里记着）', generous ? 'info' : 'warning'); }
        } else if (ev.kind === 'sick') {
            if (generous && payWallet(5)) { bumpMood(who, 10); hist(sect, '「' + nm + '」病了一场，药是你抓的。'); log('💊 药抓回来了——「' + nm + '」三天就能下地。（心境大涨）', 'success'); }
            else { bumpMood(who, -6); log('🍵 「' + nm + '」硬扛了五天，人瘦了一圈。（心境下挫）', 'warning'); }
        } else if (ev.kind === 'foe') {
            if (generous) {
                spendEnergy(20);
                if (seeded(today(), saltOf(ev.npcId || nm) + 604) < 0.6) { bumpMood(who, 14); bumpRumor(sect, 1); street('「' + sect.name + '」的掌门当街护住了自家人——对方悻悻走了。茶棚里都说：这家门，进得。'); log('🛡 你挡在「' + nm + '」身前，把人喝退了。（他从此死心塌地，街坊也看在眼里）', 'success'); }
                else { bumpMood(who, 4); bumpRumor(sect, -1); log('🛡 没挡住——推搡之间你也挂了彩。「' + nm + '」扶着你回院，路上一直说对不起。（心境小涨，闲话难听）', 'warning'); }
            } else { bumpMood(who, -10); log('🚪 你让「' + nm + '」自己面对——他挨了一顿好打。第二天他照常干活，话少了。（心境大跌）', 'warning'); }
        } else {
            if (generous) { advance(60, '陪弟子说话'); bumpMood(who, 8); log('🌙 你陪「' + nm + '」在门槛上坐了一个时辰，说了你自己的来路——他也说了他的。（心境上涨）', 'success'); }
            else { bumpMood(who, -3); log('🌙 你拍了拍「' + nm + '」的肩就回去了。门槛上的人又坐了很久。（心境微挫）', 'info'); }
        }
        _close();
    }

    // ============ 七 · 创业八苦（总册里一行清单，自动核对） ============
    var MILES = [
        { k: 'banner', n: '①插旗', test: function () { return true; } },
        { k: 'first', n: '②第一个弟子', test: function (s) { return members(s) >= 1; }, rep: 2 },
        { k: 'meal', n: '③同吃第一顿饭', test: function (s) { return !!s._fedOnce; }, rep: 1 },
        { k: 'wage', n: '④第一笔活钱', test: function (s) { return (Number(s._jobsDone) || 0) >= 1; }, rep: 1 },
        { k: 'roof', n: '⑤修好第一处屋', test: function (s) { return !!(s.shack && (s.shack.repairs || []).length); }, rep: 1 },
        { k: 'salary', n: '⑥俸银发齐', test: function (s) { return !!s._salaryPaidOnce; }, rep: 2 },
        { k: 'witness', n: '⑦街坊作证', test: function (s) { return (Number(s._favor) || 0) >= 5 || !!(s._visit && s._visit.state === 'visited'); }, rep: 1 },
        { k: 'known', n: '⑧江湖记住', test: function (s) {
            if (tierRankOf(s.name) <= 4) return true;
            try { if (W.sectCityPatrons && (W.sectCityPatrons(s.name) || []).length) return true; } catch (e) {}
            try { if (flags()['sect_gala_year_' + s.name] != null) return true; } catch (e2) {}
            return false;
        }, fame: 10 }
    ];
    function checkMilestones(sect) {
        if (!sect || sect._ruined) return;
        sect._miles = sect._miles || {};
        var done = 0;
        for (var i = 0; i < MILES.length; i++) {
            var m = MILES[i];
            if (sect._miles[m.k]) { done++; continue; }
            var hit = false;
            try { hit = m.test(sect); } catch (e) {}
            if (!hit) continue;
            sect._miles[m.k] = today();
            done++;
            if (m.rep) { sect.resources.reputation = (Number(sect.resources.reputation) || 0) + m.rep; }
            if (m.fame) { try { if (cd()) cd().fame = Math.min(99999, (Number(cd().fame) || 0) + m.fame); } catch (e2) {} }
            hist(sect, '创业八苦·过了「' + m.n.slice(1) + '」这一苦。');
            log('🏮 创业八苦，又过一苦：' + m.n + '（' + done + '/8）。' + (m.rep ? '声望+' + m.rep + '。' : '') + (m.fame ? '名望+' + m.fame + '。' : ''), 'success');
        }
        if (done >= 8 && !sect._title) {
            sect._title = '白手起家';
            try { if (cd()) cd().fame = Math.min(99999, (Number(cd().fame) || 0) + 20); } catch (e3) {}
            sect.resources.reputation = (Number(sect.resources.reputation) || 0) + 5;
            bumpRumor(sect, 2);
            chron(sect.name, '八苦俱全——插旗、收徒、开伙、挣钱、修屋、发俸、街坊作证、江湖记住。街面上从此管这家叫「白手起家的那一门」。');
            log('🏆 创业八苦，八苦俱全——你得了「白手起家」的名号：往后游说、招揽、外交，别人对你的称呼都不一样了。（名望+20，声望+5，街谈传为美谈）', 'success');
        }
    }
    function milesLine(sect) {
        sect._miles = sect._miles || {};
        return MILES.map(function (m) { return sect._miles[m.k] ? '<span class="text-green-300">' + m.n + '✓</span>' : '<span class="text-gray-600">' + m.n + '</span>'; }).join('　');
    }

    // ============ 八 · 总册插块（包装既有白手起家栏——不开新面板） ============
    function ventureBlock(sect) {
        if (!sect || sect._ruined) return '';
        var h = '<div class="bg-gray-800/60 border border-gray-600 rounded p-2 mb-3">';
        h += '<p class="text-sm text-amber-400 mb-1">创业维艰' + (sect._title ? ' · <span class="text-yellow-300">「白手起家」</span>' : '') + '</p>';
        // 破屋
        if (!sect.shack && stageOf(sect) === 0) {
            h += '<p class="text-xs text-gray-400 mb-1">夜里宿在幡杆底下不是长久之计——城郊有三处破产业，免费落脚，往后逐级修缮。</p>'
                + '<button onclick="window.PSectVenture.openShackPanel()" class="bg-stone-700 hover:bg-stone-600 text-white text-xs px-3 py-1 rounded mr-2">🏚 找处破屋落脚</button>';
        } else if (sect.shack) {
            var p = propOf(sect);
            h += '<p class="text-xs text-gray-400 mb-1">🏚 ' + p.name + ' · 床铺 ' + members(sect) + '/' + capacity(sect) + ' · 门面 ' + facade(sect) + ' 分</p>';
            var done = sect.shack.repairs || [];
            p.repairs.forEach(function (r) {
                if (done.indexOf(r.id) >= 0) h += '<p class="text-[11px] text-green-400">✓ ' + r.name + '</p>';
                else h += '<button onclick="window.PSectVenture.doRepair(\'' + r.id + '\')" class="bg-stone-700 hover:bg-stone-600 text-white text-[11px] px-2 py-0.5 rounded mr-1 mb-1">🔨 ' + r.name + '（宗库' + r.cost + '石：' + (r.beds ? '床+' + r.beds + ' ' : '') + '门面+' + r.facade + '）</button>';
            });
        }
        // 开伙
        if (sect.shack && (sect.shack.repairs || []).length && !sect._fedOnce && members(sect) >= 1) {
            h += '<button onclick="window.PSectVenture.feedTogether()" class="bg-orange-800 hover:bg-orange-700 text-white text-xs px-3 py-1 rounded mr-2 mt-1">🍚 同吃第一顿饭（宗库3石）</button>';
        }
        // 接活与人情
        h += '<div class="mt-1">'
            + '<button onclick="window.PSectVenture.openJobPanel()" class="bg-green-700 hover:bg-green-600 text-white text-xs px-3 py-1 rounded mr-2">💪 带人接活</button>'
            + '<span class="text-xs text-gray-400">街坊人情 ' + (Number(sect._favor) || 0) + '</span>'
            + ((Number(sect._favor) || 0) >= 5 ? '<button onclick="window.PSectVenture.doReferral()" class="bg-sky-800 hover:bg-sky-700 text-white text-[11px] px-2 py-0.5 rounded ml-2">🤝 请街坊引荐（耗人情5）</button>' : '')
            + '</div>';
        // 登门/官府的状态行
        if (sect._visit && sect._visit.state === 'asking') h += '<div class="mt-1"><button onclick="window.PSectVenture.reopenVisit()" class="bg-amber-800 hover:bg-amber-700 text-white text-xs px-3 py-1 rounded">🏮 「' + sect._visit.sect + '」的人还在堂上坐着——去回话</button></div>';
        if (sect._visit && sect._visit.state === 'paid') h += '<p class="text-[11px] text-amber-300 mt-1">「' + sect._visit.sect + '」的香火钱按月缴着（还缴 ' + Math.max(0, sect._visit.until - monthIdx()) + ' 个月）。</p>';
        if (sect._visit && sect._visit.state === 'defied') h += '<p class="text-[11px] text-red-300 mt-1">与「' + sect._visit.sect + '」结了梁子——月月提防挖人。</p>';
        if (sect._gov && sect._gov.record > 0) h += '<p class="text-[11px] text-gray-400 mt-1">官府档簿记着 ' + sect._gov.record + ' 笔——安分些，档簿会翻篇。</p>';
        // 八苦
        h += '<p class="text-[11px] mt-2 leading-relaxed">' + milesLine(sect) + '</p>';
        h += '</div>';
        return h;
    }
    try {
        if (W.PSBoot && typeof W.PSBoot.panelBlock === 'function' && !W.PSBoot.panelBlock.__venWrapped) {
            var _origBlock = W.PSBoot.panelBlock;
            W.PSBoot.panelBlock = function (sect) {
                var h = '';
                try { h = _origBlock(sect) || ''; } catch (e) {}
                try { h += ventureBlock(sect); } catch (e2) {}
                return h;
            };
            W.PSBoot.panelBlock.__venWrapped = true;
        }
    } catch (e) {}

    // ============ 九 · 日结/月结接线 ============
    try {
        if (W.EventBus && W.EventBus.on) {
            W.EventBus.on('newDay', function () {
                try {
                    var day = today();
                    var sect = mine();
                    if (!sect || sect._ruined) return;
                    checkMilestones(sect);
                    if (day % 7 === 0) weeklyRumor(sect);
                    if (day % 30 === 0) {
                        monthlyVisitAndGov(sect);
                        // 床不够：有人睡柴房，心境受磨
                        if (members(sect) > capacity(sect)) {
                            (sect.disciples || []).concat(sect.guests || []).forEach(function (d) { bumpMood(d, -4); });
                            log('🛏 屋里床铺不够——有人睡柴房，有人打地铺。日子能过，心气受磨。（修缮扩屋，或先别收人）', 'warning');
                        }
                        if (hasSpecial(sect, 'quiet')) (sect.disciples || []).concat(sect.guests || []).forEach(function (d) { bumpMood(d, 3); });
                        if ((!sect._moodEvent || sect._moodEvent.month !== monthIdx()) && members(sect) > 0 && seeded(monthIdx(), saltOf(sect.name) + 600) < 0.6) moodEventPick(sect);
                        markElders(sect);
                    }
                } catch (e) {}
            });
        }
    } catch (e) {}

    // ============ 导出 ============
    W.PSectVenture = {
        moveIn: moveIn, doRepair: doRepair, openShackPanel: openShackPanel, feedTogether: feedTogether,
        capacity: capacity, bedsFull: bedsFull, facade: facade,
        openJobPanel: openJobPanel, doJob: doJob, settleJobBattle: settleJobBattle, todaysJobs: todaysJobs,
        moodPts: moodPts, moodLabel: moodLabel, bumpMood: bumpMood, stampMood: stampMood, leaveChance: leaveChance, onSalary: onSalary,
        bumpMoodAll: bumpMoodAll, homeCount: homeCount,
        moodEventChoice: moodEventChoice,
        canRecruit: canRecruit, recruitFromSocial: recruitFromSocial, doSocialRecruit: doSocialRecruit,
        doInvite: doInvite, doRecommend: doRecommend,
        visitChoice: visitChoice, reopenVisit: reopenVisit, govChoice: govChoice, onViolation: onViolation, doReferral: doReferral,
        bumpRumor: bumpRumor, rumorOf: rumorOf, checkMilestones: checkMilestones, milesLine: milesLine,
        WHY: WHY, PROPS: PROPS, JOBS: JOBS
    };
    W.PSectVenture.probe = function () {
        var sect = mine();
        if (!sect) return null;
        return {
            name: sect.name, shack: sect.shack ? sect.shack.kind : null, repairs: sect.shack ? sect.shack.repairs.length : 0,
            cap: capacity(sect), facade: facade(sect), bedsFull: bedsFull(sect),
            favor: Number(sect._favor) || 0, jobsDone: Number(sect._jobsDone) || 0, rumor: rumorOf(sect),
            gov: (sect._gov || {}).record || 0, crisis: !!((sect._gov || {}).crisis),
            visit: sect._visit ? sect._visit.state : null, visitSect: sect._visit ? sect._visit.sect : null,
            miles: sect._miles || {}, title: sect._title || null, fedOnce: !!sect._fedOnce, salaryPaidOnce: !!sect._salaryPaidOnce
        };
    };
    console.log('[player-sect-venture] 创业维艰已接：社交面板招揽（自建走游说/身在门派按位分：长老直邀·其余荐面试）+ 破屋落脚修缮（床铺/门面）+ 带人接活（真仗真钱真雇主·第二十一波起下山弟子不占人手）+ 心境来路入宗谱 + 街坊闲话/登门/月查全走既有真账 + 创业八苦');
})();
