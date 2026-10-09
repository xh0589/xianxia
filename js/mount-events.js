// ==================== v27.0 坐骑批 · 骑乘低频事件账（名马被贼盯上 / 路上兽惊） ====================
// 坐骑是资产，资产就有人惦记、就有脾气——但都是**低频**事（数日最多一回），绝不追着玩家跑：
//   ① 路上兽惊：骑乘赶路进城那一刻 10% 骰——牲口被锣鼓/幡影惊了。七成勒得住（亲密+1，患难见交情），
//      三成掀你下马（轻伤 5%、误半个时辰）。自动结算不弹窗——抵达口可能正排着城门盘查的模态，不抢台。
//   ② 名马被贼盯上：翻日账 18% 骰、且五日冷却、且厩里真有名马（脚力≥1.3 的凡兽——骡子贼都看不上；
//      灵兽有魂印认主，凡贼不敢碰）。三选弹窗：设伏截住（骰境界+驭兽）/ 破财免灾（100 铜买十五日太平）/
//      轰走拉倒（七成无事，三成马真被牵走——stealMundaneBeast 同卖回口径，只是没钱）。
// 口径：日戳 cd()._mountEvt 单字段（押镖/工账同款先例）；伤账与城门翻墙同款（health/maxHealth）；
//       钱走 DataManager；骰子有引擎随机源（__scenarioRng）就走它——零直掷纪律。
(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    var CFG = {
        JOLT_P: 0.10,          // 骑乘抵达时兽惊概率
        JOLT_HELD_P: 0.70,     // 惊了勒得住的概率
        JOLT_HURT_FRAC: 0.05,  // 掀下马的伤（气血上限占比）
        JOLT_LOST_MINUTES: 30, // 落马重整行装误的时辰
        BANDIT_P: 0.18,        // 翻日账：贼踩点的概率
        BANDIT_CD_DAYS: 5,     // 两回贼事至少隔几日
        BANDIT_TARGET_SP: 1.3, // 脚力到线才值得贼惦记（凡兽）
        PAYOFF_COPPER: 100,    // 破财免灾的数
        PAYOFF_PEACE_DAYS: 15, // 买来的太平日子
        SHOO_STOLEN_P: 0.30    // 轰走拉倒→马真被牵走的概率
    };

    function cd() { return window.currentCharData || null; }
    function say(m, t) { try { if (window.showMessage) window.showMessage(m, t || 'info'); } catch (e) {} }
    function log(m, t) { try { if (window.gameLog && window.gameLog.add) window.gameLog.add(m, t || 'info'); } catch (e) {} }
    function dm() { return window.XianXia && window.XianXia.DataManager; }
    function day() { return (typeof window.getAbsoluteDay === 'function') ? window.getAbsoluteDay() : 1; }
    function dice() { return (typeof window.__scenarioRng === 'function') ? window.__scenarioRng() : Math.random(); }
    function hurt(frac) {
        var c = cd();
        if (!c) return 0;
        var maxHp = Number(c.maxHealth) || 100;
        var dmg = Math.max(1, Math.round(maxHp * frac));
        c.health = Math.max(1, (Number(c.health) || maxHp) - dmg);
        return dmg;
    }
    function evtLedger() {
        var c = cd();
        if (!c) return null;
        if (!c._mountEvt || typeof c._mountEvt !== 'object') c._mountEvt = {};
        return c._mountEvt;
    }
    function realmIdx() {
        try {
            var r = cd() && cd().realm;
            if (r && typeof window.getRealmIndex === 'function') {
                var i = window.getRealmIndex(r);
                if (i > 0) return i;
            }
        } catch (e) {}
        return 0;
    }
    function beastSkill() {
        try { return (typeof window.getLifeSkill === 'function' ? (window.getLifeSkill('驭兽') || 0) : 0); } catch (e) { return 0; }
    }

    // ============ ① 路上兽惊（骑乘抵达时，travel-system 挂钩） ============
    function maybeJolt(method) {
        try {
            if (method === 'teleport' || method === 'void_step' || method === 'rainbow_light') return false;   // 法术位移不惊兽
            var mt = (typeof window.getActiveMount === 'function') ? window.getActiveMount() : null;
            if (!mt) return false;
            if (dice() >= CFG.JOLT_P) return false;
            var nm = (typeof window.beastDisplayName === 'function') ? window.beastDisplayName(mt) : (mt.name || '坐骑');
            if (dice() < CFG.JOLT_HELD_P) {
                mt.affection = Math.min(100, (mt.affection || 0) + 1);
                if (typeof window.saveBeastData === 'function') window.saveBeastData();
                log('🐴 进城的锣鼓一响，' + nm + '惊得竖起鬃毛——你伏低身子顺着它的劲带了半圈，稳住了。它回头喷了口响鼻，算是服你。（亲密+1）', 'info');
                say('🐴 ' + nm + '被城门口动静惊了一下——你勒住了，患难见交情。（亲密+1）', 'info');
            } else {
                var dmg = hurt(CFG.JOLT_HURT_FRAC);
                if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
                    window.timeSystem.advanceTime(CFG.JOLT_LOST_MINUTES, '落马重整行装');
                }
                mt.affection = Math.max(0, (mt.affection || 0) - 1);
                if (typeof window.saveBeastData === 'function') window.saveBeastData();
                log('🐴 城门口的幡子被风一掀，' + nm + '炸了鬃——你被掀下马来，膝盖擦掉一块皮（气血-' + dmg + '），行装散落一地，重整了半个时辰。它自己在道旁吃草，见你爬起来，耳朵往后贴了贴。（亲密-1）', 'warning');
                say('🐴 ' + nm + '受惊把你掀下了马（气血-' + dmg + '，误了半个时辰）——牲口是牲口，惊起来不讲情面。', 'warning');
            }
            return true;
        } catch (e) { console.warn('[静默失败] js/mount-events.js · maybeJolt：兽惊事件掷骰中断——惊没惊成说不清，坐骑亲密账可能少记一笔', e && e.message); return false; }
    }

    // ============ ② 名马被贼盯上（翻日账） ============
    // 挑贼惦记的目标：厩里脚力最扎眼的一头凡兽（脚力=速度+成色，掉膘的贼都嫌）
    function banditTarget() {
        var tb = window.tamedBeasts || [];
        var best = null, bestSp = 0;
        for (var i = 0; i < tb.length; i++) {
            var b = tb[i];
            if (!b || !(window.isMundaneBeast && window.isMundaneBeast(b)) || b.thin) continue;
            var sp = ((b.mount && b.mount.speed) || 1) + (b.qualityAdj || 0);
            if (sp > bestSp) { bestSp = sp; best = { index: i, beast: b, sp: sp }; }
        }
        if (!best || best.sp < CFG.BANDIT_TARGET_SP) return null;
        return best;
    }

    function banditTick() {
        try {
            var led = evtLedger();
            if (!led) return;
            var d = day();
            if (led.banditDay != null && d - led.banditDay < CFG.BANDIT_CD_DAYS) return;
            if (led.peaceUntil != null && d < led.peaceUntil) return;   // 破财买来的太平
            var tgt = banditTarget();
            if (!tgt) return;
            if (dice() >= CFG.BANDIT_P) return;
            led.banditDay = d;
            openBanditDialog(tgt);
        } catch (e) { console.warn('[静默失败] js/mount-events.js · banditTick：马贼踩点账中断——该来的贼没来，玩家的名马白养了', e && e.message); }
    }

    function openBanditDialog(tgt) {
        var nm = (typeof window.beastDisplayName === 'function') ? window.beastDisplayName(tgt.beast) : tgt.beast.name;
        log('🌙 半夜马厩那头有响动——' + nm + '刨着蹄子不肯安生。你披衣出去，墙外黑影一闪就没了：有人盯上它了。', 'warning');
        if (typeof window.showModal !== 'function') {
            say('🌙 半夜有贼来偷「' + nm + '」——你抄起家伙冲出去，贼跑了。（坐骑事件请留意弹窗）', 'warning');
            return;
        }
        window._mountEvtTarget = tgt.index;
        var p = Math.min(0.9, 0.5 + realmIdx() * 0.05 + beastSkill() * 0.003);
        var html = '<p class="text-sm text-gray-300 mb-2">🌙 墙外蹲着黑影——是来偷「' + nm + '」的马贼。牲口贩子出得起价，贼就下得去手。</p>'
            + '<p class="text-xs text-gray-500 mb-3">它刨着蹄子望向你。怎么办？（设伏截住：你有' + Math.round(p * 100) + '%的把握——境界与驭兽阅历都在里头）</p>'
            + '<button onclick="_meAmbush()" class="w-full text-left bg-red-800 hover:bg-red-700 text-white px-3 py-2 rounded text-sm mb-1">🗡️ 设伏截住（成了贼空手滚，败了挂彩）</button>'
            + '<button onclick="_mePayOff()" class="w-full text-left bg-yellow-800 hover:bg-yellow-700 text-white px-3 py-2 rounded text-sm mb-1">🪙 破财免灾（' + CFG.PAYOFF_COPPER + ' 铜买' + CFG.PAYOFF_PEACE_DAYS + '日太平）</button>'
            + '<button onclick="_meShoo()" class="w-full text-left bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm mb-1">🔥 点起火把轰走拉倒（七成无事，三成……）</button>';
        window.showModal('🌙 马贼盯上了' + nm, html);
    }

    function closeEvtModal() {
        try {
            var ov = (typeof document !== 'undefined' && document.getElementById) ? document.getElementById('xianxia-modal-overlay') : null;
            if (ov && ov.remove) ov.remove();
            if (window.XianXia && window.XianXia.Modal && typeof window.XianXia.Modal.closeById === 'function') window.XianXia.Modal.closeById('xianxia-modal-overlay');
        } catch (e) {}
    }
    function markHandled() {
        var led = evtLedger();
        if (led) { led.banditDay = day(); }
    }
    function targetNow() {
        var idx = window._mountEvtTarget;
        var tb = window.tamedBeasts || [];
        var b = (idx != null && tb[idx]) || null;
        if (!b || !(window.isMundaneBeast && window.isMundaneBeast(b))) return null;
        return { index: idx, beast: b };
    }
    function nameOf(b) { return (typeof window.beastDisplayName === 'function') ? window.beastDisplayName(b) : (b && b.name) || '牲口'; }

    window._meAmbush = function () {
        var tgt = targetNow();
        closeEvtModal();
        markHandled();
        if (!tgt) { say('🗡️ 你抄着家伙蹲到后半夜——贼没来，许是瞧出了防备。', 'info'); return; }
        var p = Math.min(0.9, 0.5 + realmIdx() * 0.05 + beastSkill() * 0.003);
        if (dice() < p) {
            tgt.beast.affection = Math.min(100, (tgt.beast.affection || 0) + 2);
            if (typeof window.saveBeastData === 'function') window.saveBeastData();
            log('🗡️ 你埋伏在马厩草垛后，贼一翻墙就被你当头一喝——两条黑影翻墙就滚，落下一块黑面巾。' + nameOf(tgt.beast) + '打着响鼻蹭你的肩膀：那一夜你护住了它。（亲密+2）', 'success');
            say('🗡️ 马贼被你截住，空手滚了——' + nameOf(tgt.beast) + '亲密度+2。', 'success');
        } else {
            var dmg = hurt(0.10);
            log('🗡️ 贼有备而来：你喝声未落，一根闷棍先到——肋上挨了一下（气血-' + dmg + '）。等你撑着爬起来，贼早被动静惊散了，' + nameOf(tgt.beast) + '还在厩里，缰绳被割断了一截。', 'warning');
            say('🗡️ 设伏没伏住，挨了一闷棍（气血-' + dmg + '）——好在贼也只求财，马还在。', 'warning');
        }
    };

    window._mePayOff = function () {
        var led = evtLedger();
        var paid = false;
        if (dm() && typeof dm().deductCopper === 'function') paid = !!dm().deductCopper(CFG.PAYOFF_COPPER);
        else if (cd() && (cd().copper || 0) >= CFG.PAYOFF_COPPER) { cd().copper -= CFG.PAYOFF_COPPER; paid = true; }
        if (!paid) {
            say('🪙 摸遍钱袋凑不出 ' + CFG.PAYOFF_COPPER + ' 铜——墙外的黑影等不了你。换个章程吧。', 'warning');
            return;   // 钱不够不关窗，让玩家另选
        }
        if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI();
        if (led) { led.peaceUntil = day() + CFG.PAYOFF_PEACE_DAYS; led.banditDay = day(); }
        closeEvtModal();
        log('🪙 你把 ' + CFG.PAYOFF_COPPER + ' 铜钱串好挂在墙头老槐树上——第二天早起，钱没了，墙外一圈杂乱的脚印也远了。道上收了「厩钱」，' + CFG.PAYOFF_PEACE_DAYS + '日内不来叨扰。', 'info');
        say('🪙 破财免灾：' + CFG.PAYOFF_COPPER + ' 铜买' + CFG.PAYOFF_PEACE_DAYS + '日太平。', 'info');
    };

    window._meShoo = function () {
        var tgt = targetNow();
        closeEvtModal();
        markHandled();
        if (!tgt) return;
        if (dice() < CFG.SHOO_STOLEN_P && typeof window.stealMundaneBeast === 'function') {
            var nm = nameOf(tgt.beast);
            var stolen = window.stealMundaneBeast(tgt.index);
            if (stolen) {
                log('🔥 你点起火把往外轰，黑影散了——可后半夜它们又回来了。天亮时厩门大开着，缰绳断在桩上，「' + nm + '」没了。道上的人说：被盯上的名马，轰是轰不走的。', 'error');
                say('🌙 「' + nm + '」被马贼牵走了——厩里空了一格，桩上只剩半截缰绳。', 'error');
            }
        } else {
            log('🔥 你点起火把敲着铜盆轰了一通——黑影在墙外逡巡半晌，散了。' + nameOf(tgt.beast) + '在厩里转了两圈，卧下了。', 'info');
            say('🔥 火把铜盆齐上，贼没敢下手——虚惊一场。', 'success');
        }
    };

    // ============ 订阅翻日账 ============
    function subscribe() {
        if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
            window.timeSystem.onNewDaySubscribe(banditTick);
        }
    }
    if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') subscribe();
    else if (typeof window.addEventListener === 'function') window.addEventListener('load', subscribe);

    window.MountEvents = {
        maybeJolt: maybeJolt,
        banditTick: banditTick,
        banditTarget: banditTarget,
        openBanditDialog: openBanditDialog,
        CFG: CFG
    };
})();
