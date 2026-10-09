// ==================== v26.0 六路营生批（第一百五十一批 · 用户点单）· 易容改名账 ====================
// 用户点单：「易容改名肯定要很困难，而且通缉也分类型——对方没看到脸就只能靠特质认，极难；
//           脸被看到过就很麻烦了。」本账把这两句落成两本真账：
//   ① 通缉两档（改在 npc-crime.js 的 crimeLedger 上）：罪行干得干净 → 官府手里只有体态、口音、
//      作案路数（特质档：盘查加档小、赏金猎人难盯上）；被当场拿住 / 苦主敲锣报官 / 被扭送 →
//      画影图形（画像档：全城都认得你的脸）。销案 / 风头冷透 → 画像揭下，档位归零。
//   ② 易容（本账）：黑市后巷的易容师傅，三档手艺——人皮面具（80 灵石 · 撑三日）/ 名家手笔
//      （260 灵石 · 撑七日）/ 鬼斧神工（650 灵石＋妖兽精血一枚 · 撑十五日）。
// 易容「很困难」的口径（全是明账，牌面上写死）：
//   · 只在有黑市的城找得到师傅；风头太劲（民愤热度 ≥60）没人敢接你的活——先消停再来；
//   · 戴着面具不能重易（先撕旧脸，撕了就废）；每日只请得动师傅一回；神工档还要稀材；
//   · 易容不是免罪符：案子照挂、热度照记，它只骗「认脸认特质的眼睛」——
//     特质档通缉：盘查加档归零、猎人盯梢降到一成（体态步法都改了）；
//     画像档通缉：盘查加档减半、猎人降到四成半，且**每日有熟识撞破的风险**（撞破→面具作废、热度再涨）；
//   · 面具到期自动脱胶；到期前被识破也一样作废。假名走 nameGenerator 真名字池，可重摇一次。
// 不改熟人的账：易容骗的是街面与官府的眼睛，铺子里的掌柜、钱庄的柜娘认的是另一本账（各自系统里
//   有她们自己的记性），本账不去替她们翻篇——这就是「脸被看到过就很麻烦」的后半截。
(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    var TUNE = {
        HEAT_REFUSE: 60,          // 风头多劲师傅就不接活
        REROLL_MAX: 1,            // 假名可重摇次数
        SPOT_NOTO_MUL: 1 / 120,   // 撞破率随恶名的斜率
        SPOT_FACE_MUL: 1.6,       // 画像档被撞破的倍数（脸有画像比对，步态身段也上了心）
        SPOT_BLIND_MUL: 0.5,      // 特质档被撞破的倍数（本就只凭特质，易容改了特质）
        SPOT_HEAT: 3, SPOT_NOTO: 1
    };

    // 三档手艺（cost 灵石 / mins 耗时 / days 撑几日 / spot 每日撞破底率 / mat 稀材）
    var GRADES = [
        { g: 1, name: '人皮面具', cost: 80, mins: 30, days: 3, spot: 0.30, mat: null, desc: '市面货，近看能看出胶边' },
        { g: 2, name: '名家手笔', cost: 260, mins: 60, days: 7, spot: 0.15, mat: null, desc: '师傅看家的手艺，眉眼骨相都动' },
        { g: 3, name: '鬼斧神工', cost: 650, mins: 120, days: 15, spot: 0.06, mat: { id: 'mat_demon_beast_blood', n: 1, name: '妖兽精血' }, desc: '要妖兽精血调胶——熟人也得盯上半晌才敢疑' }
    ];

    var _st = { on: false, alias: '', grade: 0, untilDay: -1, appliedDay: -1, rerolls: 0, lastBuyDay: -1, ruined: 0 };
    var _lastBuyDayRuntime = -1;   // 每日一次的运行时账（悬赏榜同款口径）

    // ============ 小工具（黑道账同款口径） ============
    function cd() { return window.currentCharData || null; }
    function say(m, t) { try { if (window.showMessage) window.showMessage(m, t || 'info'); } catch (e) { return false; } return true; }
    function log(m, t) { try { if (window.gameLog && window.gameLog.add) window.gameLog.add(m, t || 'info'); } catch (e) { return false; } return true; }
    function city() {
        return (cd() && cd().location) ||
            (typeof window.getCurrentCityName === 'function' && window.getCurrentCityName()) || '';
    }
    function absDay() {
        try {
            if (window.WorldCalendar && typeof window.WorldCalendar.day === 'number' && window.WorldCalendar.day > 0) return Math.floor(window.WorldCalendar.day);
            if (typeof window.getAbsoluteDay === 'function') { var g = window.getAbsoluteDay(); if (g) return Math.floor(g); }
            if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') { var t = window.timeSystem.getAbsoluteDay(); if (t) return Math.floor(t); }
        } catch (e) { return 0; }
        return 0;
    }
    function advance(min, why) {
        try { if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') window.timeSystem.advanceTime(min, why); } catch (e) { console.warn('[静默失败] js/npcs/disguise-system.js · advance：时辰没扣成', e && e.message); }
    }
    function deed(mood, s) {
        try { if (typeof window.playerPushDeed === 'function') window.playerPushDeed(mood, s); } catch (e) { console.warn('[静默失败] js/npcs/disguise-system.js · deed：风声没递进传闻池', e && e.message); }
    }
    function refresh() {
        try { if (window.updateCharacterStatus) window.updateCharacterStatus(); } catch (e) { console.warn('[静默失败] js/npcs/disguise-system.js · refresh：面板没刷新', e && e.message); }
    }
    function stonesNow() {
        try {
            var DM = window.DataManager || (window.XianXia && window.XianXia.DataManager);
            if (DM && typeof DM.getSpiritStones === 'function') return Number(DM.getSpiritStones()) || 0;
        } catch (e) { console.warn('[静默失败] js/npcs/disguise-system.js · stonesNow：现银没读到，按角色面上的数算', e && e.message); }
        var c = cd();
        return c ? (Number(c.spiritStones) || 0) : 0;
    }
    function deductStones(n) {
        try {
            var DM = window.DataManager || (window.XianXia && window.XianXia.DataManager);
            if (DM && typeof DM.deductSpiritStones === 'function') return !!DM.deductSpiritStones(n);
        } catch (e) { console.warn('[静默失败] js/npcs/disguise-system.js · deductStones：DataManager 正门没走通，落回角色字段', e && e.message); }
        var c = cd();
        if (c && (Number(c.spiritStones) || 0) >= n) { c.spiritStones -= n; return true; }
        return false;
    }
    function addHeat(n, why, opts) {
        try { if (window.NpcCrime && typeof window.NpcCrime.addHeat === 'function') { window.NpcCrime.addHeat(n, why, opts); return true; } } catch (e) { console.warn('[静默失败] js/npcs/disguise-system.js · addHeat：热度没记进通缉账', e && e.message); }
        return false;
    }
    function heat() { try { return window.NpcCrime ? Number(window.NpcCrime.heat()) || 0 : 0; } catch (e) { return 0; } }
    function faceKnown() { try { return !!(window.NpcCrime && window.NpcCrime.faceKnown && window.NpcCrime.faceKnown()); } catch (e) { return false; } }
    function wantedNow() { try { return !!(window.NpcCrime && window.NpcCrime.wanted()); } catch (e) { return false; } }
    function notoNow() { var c = cd(); return c ? (Number(c.notoriety) || 0) : 0; }

    // 黑市在不在（locationSystem 楼宇账）：有 market / black_market 才算有后巷师傅
    function marketOk(ct) {
        try {
            var d = window.locationSystem && window.locationSystem.getCityData && window.locationSystem.getCityData(ct || city());
            if (!d || !d.buildings) return false;
            return d.buildings.indexOf('market') >= 0 || d.buildings.indexOf('black_market') >= 0;
        } catch (e) { console.warn('[静默失败] js/npcs/disguise-system.js · marketOk：城里有没有黑市没问清，按没有算', e && e.message); return false; }
    }

    // 稀材盘点与扣除（背包真账：槽位 uid 制，逐格点数）
    function countMat(id) {
        var n = 0;
        try {
            var slots = (window.inventory && Array.isArray(window.inventory.slots)) ? window.inventory.slots : [];
            for (var i = 0; i < slots.length; i++) {
                var s = slots[i];
                if (s && s.templateId === id) n += Number(s.count) || 0;
            }
        } catch (e) { console.warn('[静默失败] js/npcs/disguise-system.js · countMat：行囊没数清，按没有算', e && e.message); }
        return n;
    }
    function takeMat(id, need) {
        try {
            if (typeof window.removeItem !== 'function') return false;
            var slots = (window.inventory && Array.isArray(window.inventory.slots)) ? window.inventory.slots : [];
            var left = need;
            for (var i = 0; i < slots.length && left > 0; i++) {
                var s = slots[i];
                if (!s || s.templateId !== id) continue;
                var take = Math.min(left, Number(s.count) || 0);
                if (take > 0) { window.removeItem(s.uid, take); left -= take; }
            }
            return left <= 0;
        } catch (e) { console.warn('[静默失败] js/npcs/disguise-system.js · takeMat：稀材没能扣走', e && e.message); return false; }
    }

    function genAlias() {
        try {
            if (window.nameGenerator && typeof window.nameGenerator.generateName === 'function') {
                var n = window.nameGenerator.generateName();
                if (n && n.full) return String(n.full).slice(0, 12);
            }
        } catch (e) { console.warn('[静默失败] js/npcs/disguise-system.js · genAlias：名字池没摇出来，落回兜底假名', e && e.message); }
        return '无名客';
    }

    // ============ 对外读数（npc-crime / 面板 / 别家账守卫读取） ============
    function active() {
        if (!_st.on) return false;
        if (absDay() > _st.untilDay) { expireQuiet(); return false; }
        return true;
    }
    function alias() { return _st.on ? _st.alias : ''; }
    function gradeOf() { return _st.on ? _st.grade : 0; }
    function daysLeft() { return _st.on ? Math.max(0, _st.untilDay - absDay()) : 0; }

    function expireQuiet() {
        if (!_st.on) return;
        _st.on = false; _st.grade = 0; _st.alias = ''; _st.untilDay = -1;
        log('🎭 面具的胶性尽了，边角翘起来——你把它揭下来揉碎丢弃。易容到此为止。', 'info');
    }

    // ============ 请师傅上手（每日一次 · 戴脸不重易 · 风头太劲没人接） ============
    function buy(gradeIdx) {
        var c = cd();
        if (!c) { say('请先创建角色。', 'warning'); return false; }
        var gi = Math.floor(Number(gradeIdx));
        var gr = GRADES[gi];
        if (!gr) { say('没有这一档手艺。', 'warning'); return false; }
        if (!marketOk()) { say('🎭 这座城没有黑市后巷——易容师傅跟着见不得光的生意走。', 'info'); return false; }
        if (window.currentBattle) { say('打着架呢——没人给你上脸。', 'warning'); return false; }
        if (_st.on && active()) { say('🎭 你脸上还戴着一张「' + _st.alias + '」的脸——先撕了旧的，师傅才肯动刀。（撕脸不退钱）', 'warning'); return false; }
        var day = absDay();
        if (_lastBuyDayRuntime === day) { say('🎭 师傅今日已经给你动过一次刀了——脸上的胶还没养住，明日再来。', 'info'); return false; }
        var h = heat();
        if (h >= TUNE.HEAT_REFUSE) { say('🎭 后巷里的人上下打量你：「风头这么劲的活，我们不接。」——民愤热度 ' + h + '，先消停些日子再来。（热度低于 ' + TUNE.HEAT_REFUSE + ' 师傅才肯动手）', 'warning'); return false; }
        if (stonesNow() < gr.cost) { say('🎭 「' + gr.name + '」要 ' + gr.cost + ' 灵石，你手头不足——后巷不赊账。', 'warning'); return false; }
        if (gr.mat && countMat(gr.mat.id) < gr.mat.n) { say('🎭 「' + gr.name + '」还要 ' + gr.mat.name + '×' + gr.mat.n + ' 调胶——你先去寻来。', 'warning'); return false; }
        if (!deductStones(gr.cost)) { say('🎭 灵石没能划出去——钱袋里的账对不上。', 'warning'); return false; }
        if (gr.mat && !takeMat(gr.mat.id, gr.mat.n)) {
            // 钱已划、料没扣成——把钱退回去，这一单作废（不吞钱）
            try {
                var DM = window.DataManager || (window.XianXia && window.XianXia.DataManager);
                if (DM && typeof DM.addSpiritStones === 'function') DM.addSpiritStones(gr.cost); else c.spiritStones = (Number(c.spiritStones) || 0) + gr.cost;
            } catch (eR) { console.warn('[静默失败] js/npcs/disguise-system.js · buy：退钱没退成，这单钱悬着', eR && eR.message); }
            say('🎭 ' + gr.mat.name + '没能从行囊里点出来——师傅收了手，灵石原数退回。', 'warning');
            return false;
        }
        _lastBuyDayRuntime = day;
        advance(gr.mins, '易容');
        _st.on = true;
        _st.grade = gr.g;
        _st.alias = genAlias();
        _st.appliedDay = day;
        _st.untilDay = day + gr.days;
        _st.rerolls = 0;
        log('🎭 黑市后巷，师傅在你脸上敷胶、贴合、描骨——' + gr.mins + ' 分钟后铜镜里换了个人。你现在叫「' + _st.alias + '」（' + gr.name + '，撑到第 ' + _st.untilDay + ' 日）。' + (wantedNow() ? (faceKnown() ? '画影还挂在悬赏牌上——面具遮得住生人，遮不全熟人。' : '官府手里只有你的体态口音——这张脸一换，特质对不上了。') : ''), 'success');
        say('🎭 铜镜里是张生脸。你现在是「' + _st.alias + '」——' + gr.name + '，撑 ' + gr.days + ' 日。' + (wantedNow() ? (faceKnown() ? '（画像档通缉：盘查加档减半，但每日有被熟人撞破的风险）' : '（特质档通缉：体态步法都改了——盘查加档归零，猎人也难盯上你）') : '（眼下没通缉，戴着就当换个身份走路。）'), 'success');
        refresh();
        return true;
    }

    function rollAlias() {
        if (!_st.on) { say('你脸上没有面具，摇什么假名。', 'info'); return false; }
        if (_st.rerolls >= TUNE.REROLL_MAX) { say('🎭 师傅把刀收了：「一个名字摇两回，官府的册子都要替你翻烂了。」——就它了。', 'info'); return false; }
        _st.rerolls += 1;
        _st.alias = genAlias();
        log('🎭 你嫌头一个假名不顺口，请师傅重新报了个籍贯——现在你叫「' + _st.alias + '」。', 'info');
        say('🎭 换了个假名：「' + _st.alias + '」。（一次易容只能重摇一回）', 'success');
        return true;
    }

    function removeMask() {
        if (!_st.on) { say('你脸上没有面具。', 'info'); return false; }
        var a = _st.alias;
        _st.on = false; _st.grade = 0; _st.alias = ''; _st.untilDay = -1;
        log('🎭 你把「' + a + '」那张脸揭下来揉碎——做回自己。', 'info');
        say('🎭 面具揭了，做回自己。（撕脸不退钱，通缉的账一笔没少）', 'info');
        refresh();
        return true;
    }

    // ============ 每日：面具到期 / 画像档撞破风险 ============
    function dailyCheck(rng) {
        if (!_st.on) return;
        if (absDay() > _st.untilDay) { expireQuiet(); return; }
        if (!wantedNow()) return;   // 没人找你，戴面具只是费钱
        var gr = GRADES[_st.grade - 1] || GRADES[0];
        var p = gr.spot * (1 + notoNow() * TUNE.SPOT_NOTO_MUL) * (faceKnown() ? TUNE.SPOT_FACE_MUL : TUNE.SPOT_BLIND_MUL);
        var r = (typeof rng === 'function') ? rng() : Math.random();
        if (r >= p) return;
        // 撞破：熟识盯了你半晌，喊出了你原来的名字
        _st.ruined += 1;
        _st.on = false; _st.grade = 0; _st.alias = ''; _st.untilDay = -1;
        addHeat(TUNE.SPOT_HEAT, '易容被熟人撞破', { faceSeen: faceKnown() });
        var c = cd();
        if (c) {
            c.notoriety = Math.min(100, (Number(c.notoriety) || 0) + TUNE.SPOT_NOTO);
            // v27.13 恶名分城：直写后同步记进世界账簿（撞破的风声从本地往外传）
            try { if (window.WorldLedger && typeof window.WorldLedger.noteNotorietyChange === 'function') window.WorldLedger.noteNotorietyChange(TUNE.SPOT_NOTO); } catch (eWN6) {}
        }
        deed('bad', '有人当街喊破了你面具底下的名字——「' + (c && c.name ? c.name : '你') + '易容走路」这件事，街面上都知道了');
        log('🎭 一张熟脸在街角盯了你半晌，忽然出声喊了你原来的名字。你没敢回头，钻进人流——面具算是废了，风声反倒更响。（热度+' + TUNE.SPOT_HEAT + '，恶名+' + TUNE.SPOT_NOTO + '）', 'danger');
        say('🎭 熟识当街喊破了你的假名——面具作废，你落荒而走。（热度+' + TUNE.SPOT_HEAT + ' 恶名+' + TUNE.SPOT_NOTO + '，风声传开了）', 'error');
        refresh();
    }

    // ============ 牌面（市井菜单进） ============
    function open() {
        if (!cd()) { say('请先创建角色。', 'warning'); return false; }
        var ct = city();
        if (!ct) { say('🎭 你在荒郊野外——后巷师傅不接野地的活。', 'info'); return false; }
        if (!marketOk(ct)) { say('🎭 ' + ct + '没有黑市后巷——易容师傅跟着见不得光的生意走。', 'info'); return false; }
        var btn = 'class="w-full p-3 rounded mb-2 text-left text-sm text-white hover:opacity-90"';
        var html = '';
        if (_st.on && active()) {
            var gr = GRADES[_st.grade - 1] || GRADES[0];
            html += '<p class="text-sm text-gray-300 mb-2">🎭 你眼下是「<span class="text-amber-300 font-bold">' + _st.alias + '</span>」（' + gr.name + '）——还能撑 <span class="text-amber-300">' + daysLeft() + '</span> 日。' +
                (wantedNow() ? (faceKnown() ? '画影挂在悬赏牌上：盘查加档减半，但每日都有熟识撞破的风险（' + Math.round(gr.spot * TUNE.SPOT_FACE_MUL * 100) + '% 起，恶名越高越险）。' : '官府手里只有你的体态口音——这张脸一换，盘查加档归零，猎人也难盯上你。') : '眼下没有通缉，面具白戴着费钱。') + '</p>' +
                '<button onclick="window.Disguise.rollAlias()" ' + btn.replace('p-3', 'bg-gray-700 p-3') + '>🔀 重摇假名（一次易容限 ' + TUNE.REROLL_MAX + ' 回 · 已摇 ' + _st.rerolls + '）</button>' +
                '<button onclick="window.Disguise.removeMask()" ' + btn.replace('p-3', 'bg-red-900 p-3') + '>💢 撕下面具（不退钱 · 做回自己）</button>';
        } else {
            html += '<p class="text-sm text-gray-400 mb-2">后巷深处有间没招牌的铺子。师傅眼皮不抬：「换脸是改命的活儿——想清楚了？」' +
                (heat() >= TUNE.HEAT_REFUSE ? '<span class="text-red-300">（你风头太劲：民愤热度 ' + heat() + '，师傅不接——低于 ' + TUNE.HEAT_REFUSE + ' 才肯动手）</span>' : '') + '</p>';
            for (var i = 0; i < GRADES.length; i++) {
                var g = GRADES[i];
                html += '<button onclick="window.Disguise.buy(' + i + ')" ' + btn.replace('p-3', 'bg-purple-900 p-3') + '>🎭 ' + g.name +
                    ' <span class="text-xs text-amber-300">' + g.cost + ' 灵石' + (g.mat ? '＋' + g.mat.name + '×' + g.mat.n : '') + ' · ' + g.mins + ' 分钟 · 撑 ' + g.days + ' 日</span>' +
                    '<span class="block text-xs text-gray-400">' + g.desc + ' · 每日撞破底率 ' + Math.round(g.spot * 100) + '%</span></button>';
            }
            html += '<p class="text-[11px] text-gray-500 mt-1">规矩：戴脸不重易（先撕旧脸）；每日只请得动师傅一回；易容不是免罪符——案子照挂，它只骗认脸认特质的眼睛。特质档通缉几乎白走，画像档通缉仍有熟人撞破的险。</p>';
        }
        if (typeof window.showBuildingEffectDialog === 'function') {
            window.showBuildingEffectDialog('🎭 黑市后巷 · 易容师傅 · ' + ct, html);
            return true;
        }
        return false;
    }

    function describe() {
        if (!_st.on || !active()) return '';
        return '你现在顶着「' + _st.alias + '」的脸（' + ((GRADES[_st.grade - 1] || {}).name || '易容') + '，余 ' + daysLeft() + ' 日）。';
    }

    // ============ 存读档（StateRegistry 正门） ============
    function _export() { return JSON.parse(JSON.stringify(_st)); }
    function _import(d) {
        var s = { on: false, alias: '', grade: 0, untilDay: -1, appliedDay: -1, rerolls: 0, lastBuyDay: -1, ruined: 0 };
        if (d && typeof d === 'object') {
            s.on = !!d.on;
            s.alias = typeof d.alias === 'string' ? d.alias.slice(0, 12) : '';
            s.grade = [1, 2, 3].indexOf(Math.floor(Number(d.grade))) >= 0 ? Math.floor(Number(d.grade)) : 0;
            if (s.grade === 0) s.on = false;
            s.untilDay = Number.isFinite(Number(d.untilDay)) ? Math.floor(Number(d.untilDay)) : -1;
            s.appliedDay = Number.isFinite(Number(d.appliedDay)) ? Math.floor(Number(d.appliedDay)) : -1;
            s.rerolls = Math.max(0, Math.floor(Number(d.rerolls)) || 0);
            s.lastBuyDay = Number.isFinite(Number(d.lastBuyDay)) ? Math.floor(Number(d.lastBuyDay)) : -1;
            s.ruined = Math.max(0, Math.min(999, Math.floor(Number(d.ruined)) || 0));
        }
        _st = s;
    }
    function _reset() { _st = { on: false, alias: '', grade: 0, untilDay: -1, appliedDay: -1, rerolls: 0, lastBuyDay: -1, ruined: 0 }; }
    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        window.StateRegistry.register('disguise', { version: 1, export: _export, import: _import, reset: _reset });
    }

    if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
        window.timeSystem.onNewDaySubscribe(function () { dailyCheck(); });
    }

    window.Disguise = {
        TUNE: TUNE, GRADES: GRADES,
        marketOk: marketOk, active: active, alias: alias, gradeOf: gradeOf, daysLeft: daysLeft,
        buy: buy, rollAlias: rollAlias, removeMask: removeMask, dailyCheck: dailyCheck,
        open: open, describe: describe,
        state: _export
    };
    window.openDisguiseAlley = function () { return open(); };
})();
