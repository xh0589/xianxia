// ==================== v25.7 市井烟火批（第一百四十九批）· 澡堂洗尘 ====================
// 此前全游戏只有灵泉能「沐浴」（一日一次、全恢复），城里人跑了三天路连个泡汤的地方都没有。
// 本账开一间市井澡堂，三档汤：
//   · 粗澡搓背（5 铜）：小回精力心境，30 分钟——脚夫的档次；
//   · 热汤泡浴（30 铜）：中回，另借野外睡卧导引的口子压一截毒气/震神/伤痛（秽气=phys.poisonLoad，
//     与客栈同账本，澡堂压 20——比客栈床铺(40)浅，比柴房(15)深，泡汤不是睡觉，口径诚实）；
//   · 灵泉香汤（2 灵石）：大回 + 压毒 40，90 分钟，**一日一次**（actionGate 闸，与灵泉同款）。
// 泡汤时四成几率听邻桶赤膊闲话——闲话吃 location-system 的市民闲话池只读窗（getCitizenGossip，
// 账主开窗、外人不翻箱），池子不在位就安安静静泡完，绝不编。
// 钱和效果同一笔 RewardService 结算：钱不够整单不成，不会出现「扣了钱没泡上」。
(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    var CFG = {
        GOSSIP_P: 0.4   // 泡汤听闲话的几率
    };

    // relief 三量：压毒/安神/缓痛（与 randomMap.js 睡卧导引同一张口；数字见头注口径）
    var TIERS = [
        { id: 'scrub', name: '粗澡搓背', icon: '🧼', copper: 5, min: 30, spec: { energy: 10, mood: 3 }, relief: null, line: '大池子边上搓个背，热水一冲，乏气散了小半。' },
        { id: 'soak', name: '热汤泡浴', icon: '♨️', copper: 30, min: 60, spec: { energy: 30, mood: 6, health: 10 }, relief: [20, 10, 10], line: '整个人沉进热汤里，骨缝里的寒气一丝丝被拔出来。' },
        { id: 'spirit', name: '灵泉香汤', icon: '🌸', stones: 2, min: 90, spec: { energy: 60, mood: 10, health: 20 }, relief: [40, 20, 20], daily: true, line: '单间的汤引了一线灵泉，香雾缭绕——泡完通体透轻，像褪了一层壳。' }
    ];

    function cd() { return window.currentCharData || null; }
    function say(m, t) { try { if (window.showMessage) window.showMessage(m, t || 'info'); } catch (e) { return false; } return true; }
    function log(m, t) { try { if (window.gameLog && window.gameLog.add) window.gameLog.add(m, t || 'info'); } catch (e) { return false; } return true; }
    function city() {
        return (cd() && cd().location) ||
            (typeof window.getCurrentCityName === 'function' && window.getCurrentCityName()) || '';
    }
    function pkCity(s) { return String(s == null ? '' : s).replace(/\s+/g, ''); }
    function settle(spec) {
        try {
            if (window.RewardService && typeof window.RewardService.apply === 'function') {
                var r = window.RewardService.apply(spec, { facilitySpend: true, source: '澡堂', city: city() });
                return { ok: !!(r && r.success !== false), note: r && r.messages ? r.messages.join('、') : '' };
            }
        } catch (e) { console.warn('[静默失败] js/city-facilities/bathhouse.js · settle：汤钱和舒坦没落成一笔账', e && e.message); }
        return { ok: false, note: '' };
    }
    // 有客栈或市集的城才有澡堂（热水和炉子跟着人烟走——仙山佛窟没这营生）
    function bathOk(ct) {
        try {
            var d = window.locationSystem && window.locationSystem.getCityData && window.locationSystem.getCityData(ct || city());
            if (!d || !d.buildings) return false;
            return d.buildings.indexOf('inn') >= 0 || d.buildings.indexOf('market') >= 0 || d.buildings.indexOf('shop') >= 0;
        } catch (e) { return false; }
    }
    function tierOf(id) {
        for (var i = 0; i < TIERS.length; i++) if (TIERS[i].id === id) return TIERS[i];
        return null;
    }
    function gateLeft() {
        try {
            if (window.actionGate && typeof window.actionGate.left === 'function') return window.actionGate.left('bath_spirit', 1);
        } catch (e) { return 0; }
        return 0;
    }
    function gossipLine() {
        try {
            if (typeof window.getCitizenGossip === 'function') {
                var pool = window.getCitizenGossip() || [];
                if (pool.length) {
                    var g = pool[Math.floor(Math.random() * pool.length)];
                    return '邻桶的人搓着背闲聊：「' + g.text + '」';
                }
            }
        } catch (e) { console.warn('[静默失败] js/city-facilities/bathhouse.js · gossipLine：闲话池没读出来——这桶汤泡得安静', e && e.message); }
        return '';
    }

    // ============ 泡一挡汤（钱和效果一笔结算） ============
    function bathe(id) {
        var t = tierOf(id);
        if (!t) { say('♨️ 澡堂没这挡汤。', 'warning'); return false; }
        var c = cd();
        if (!c) return false;
        if (!bathOk()) { say('♨️ 这地界没有澡堂——仙山佛窟没这营生。', 'info'); return false; }
        if (window.currentBattle) { say('♨️ 打着架呢，谁有空泡汤。', 'warning'); return false; }
        if (t.daily) {
            // actionGate 口径：cooled() 为 true = 冷却中（不可用），与灵泉 useSpring 同款
            try {
                if (window.actionGate && typeof window.actionGate.cooled === 'function' && window.actionGate.cooled('bath_spirit', 1)) {
                    say('♨️ 灵泉香汤一日只引得动一回——汤池的灵气还没缓过来，明日再来。', 'info');
                    return false;
                }
            } catch (eG) { console.warn('[静默失败] js/city-facilities/bathhouse.js · bathe：香汤的一日闸没问成，按能泡算', eG && eG.message); }
        }
        var spec = { energy: t.spec.energy, mood: t.spec.mood };
        if (t.spec.health) spec.health = t.spec.health;
        if (t.stones) spec.spiritStones = -t.stones; else spec.copper = -t.copper;
        var r = settle(spec);
        if (!r.ok) {
            say('♨️ ' + (t.stones ? t.stones + ' 灵石' : t.copper + ' 铜钱') + '的汤钱都凑不出——伙计笑着把你请出了门。', 'warning');
            return false;
        }
        if (t.daily) {
            try { if (window.actionGate && typeof window.actionGate.mark === 'function') window.actionGate.mark('bath_spirit'); } catch (eM) { console.warn('[静默失败] js/city-facilities/bathhouse.js · bathe：香汤泡了但一日闸没落印——今天还能再泡一回', eM && eM.message); }
        }
        try {
            if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') window.timeSystem.advanceTime(t.min, '澡堂泡汤');
        } catch (eT) { console.warn('[静默失败] js/city-facilities/bathhouse.js · bathe：泡汤的时辰没扣', eT && eT.message); }

        // 压毒/安神/缓痛：借野外睡卧导引的正门（同一本生理账，不另立毒账）
        var reliefTail = '';
        if (t.relief) {
            try {
                if (window.wildMapApi && window.wildMapApi.relief && typeof window.wildMapApi.relief.sleep === 'function') {
                    var parts = window.wildMapApi.relief.sleep(t.relief[0], t.relief[1], t.relief[2]);
                    if (parts && parts.length) reliefTail = '热水拔毒：' + parts.join('；') + '。';
                }
            } catch (eR) { console.warn('[静默失败] js/city-facilities/bathhouse.js · bathe：秽气没压成——汤白泡了半截', eR && eR.message); }
        }
        var gossip = (Math.random() < CFG.GOSSIP_P) ? gossipLine() : '';
        var tail = (r.note ? '（' + r.note + '）' : '') + (reliefTail ? '（' + reliefTail + '）' : '');
        log('♨️ 你在' + (city() || '城里') + '的澡堂泡了挡「' + t.name + '」。' + t.line + tail, 'info');
        say('♨️ ' + t.icon + ' ' + t.name + '——' + t.line + tail + (gossip ? '\n💬 ' + gossip : ''), 'success');
        try { if (typeof window.closeBuildingDialog === 'function') window.closeBuildingDialog(); } catch (eC) { return true; }
        try { if (window.updateCharacterStatus) window.updateCharacterStatus(); } catch (eU) { console.warn('[静默失败] js/city-facilities/bathhouse.js · bathe：泡完面板没刷新', eU && eU.message); }
        return true;
    }

    function open() {
        if (!bathOk()) { say('♨️ 这地界没有澡堂。', 'info'); return false; }
        var btn = 'class="w-full p-3 rounded mb-2 text-left text-sm text-white hover:opacity-90"';
        var html = '<p class="text-sm text-gray-400 mb-2">街口澡堂的帘子半掀着，热气裹着皂角味扑出来。伙计扬声：「客官泡哪挡？」</p>';
        for (var i = 0; i < TIERS.length; i++) {
            var t = TIERS[i];
            var cost = t.stones ? t.stones + ' 灵石' : t.copper + ' 铜钱';
            // DES-22：时辰口径 formatShichen 独揽（time-system.js 唯一真源），牌面上不私设 /60 刻度
            var dur = (typeof window.formatShichen === 'function') ? window.formatShichen(t.min) : (t.min + ' 分钟');
            var label = t.icon + ' ' + t.name + '（' + cost + ' · ' + dur + '）';
            if (t.daily) {
                try {
                    if (window.actionGate && typeof window.actionGate.cooled === 'function' && window.actionGate.cooled('bath_spirit', 1)) {
                        label += '——今日已泡过';
                    }
                } catch (eD) { console.warn('[静默失败] js/city-facilities/bathhouse.js · open：香汤的一日闸没问成，牌面上按能泡写', eD && eD.message); }
            }
            html += '<button onclick="CityBath.bathe(\'' + t.id + '\')" ' + btn.replace('p-3', 'bg-cyan-900 p-3') + '>' + label + '</button>';
        }
        html += '<p class="text-[11px] text-gray-500 mt-1">热汤拔的是身上积的毒气和秽（与客栈睡卧同一本账）——真要解毒还得靠方子和医馆。</p>';
        if (typeof window.showBuildingEffectDialog === 'function') {
            window.showBuildingEffectDialog('♨️ 澡堂 · ' + (city() || ''), html);
            return true;
        }
        return false;
    }

    function panelHtml(cityName) {
        try {
            if (!bathOk(cityName)) return '';
            if (cityName && city() && pkCity(cityName) !== pkCity(city())) return '';
            return '';   // 澡堂不单占面板一行——收进「市井烟火」总门（StreetLife 菜单递话）
        } catch (e) { return ''; }
    }

    window.CityBath = {
        CFG: CFG,
        TIERS: TIERS,
        bathOk: bathOk,
        bathe: bathe,
        open: open,
        panelHtml: panelHtml
    };
    window.openCityBath = function () { return open(); };
})();
