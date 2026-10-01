// ==================== cave-reception.js - v25.6 洞府会客 · 品茗论道（第一百四十八批 · 玩家心愿批） ====================
// 用户点单：「贵客登门，招待加风水换印象与机缘」。
// 与既有账的关系：知己登门的**触发与人选**照旧走 cave-life.js（好感≥60、客房/茶灶加成、起居注），
// 这里只把「客人到了门口」从自动文本升级成**你亲自招待**——弹得出的时候弹窗接待，
// 弹不出（闭关中/模态不可用）就落回原来的自动文本，一笔账不重不漏：
//   · 上仙露茶 / 上灵果（真耗行囊里的东西）好感加得多，清谈不耗东西加得少，送客倒扣；
//   · 风水真进印象：getFengshuiMul 越吉客人越舒坦（±6 好感），煞气重的静室客人坐不住；
//   · 茶灶/客房设施照旧加分；招待得好客人真回礼（giveWithReceipt 正门）、论道有小得（心境）；
//   · 起居注与天下见闻照 cave-life 同款通道落笔，不另开账本。

(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    var TEA_ITEM = 'food_immortal_tea';   // 仙露茶
    var FRUIT_ITEM = 'food_spirit_fruit'; // 灵果
    var GIFT_POOL = ['mat_lingzhi', 'mat_spirit_grass', 'mat_ginseng', 'mat_bamboo'];
    var AFF = { plain: 4, tea: 8, fruit: 10, turnAway: -3 };
    var FS_AFF_CAP = 6;      // 风水对好感的加减封顶
    var FACILITY_BONUS = 2;  // 茶灶/客房各 +2

    var _pending = null;   // {npcId, name, hasTea, hasGuestRoom}
    var _panelHandle = null;

    function canReceive() {
        return typeof window.showModal === 'function' && !!window.currentCharData && !window.currentBattle && !window._isInLongRetreat;
    }

    function _hasFacility(fid) {
        try {
            if (window.CaveFacilities && typeof window.CaveFacilities.getFacilities === 'function') {
                var facs = window.CaveFacilities.getFacilities('player') || [];
                for (var i = 0; i < facs.length; i++) if (facs[i] && facs[i].facilityId === fid) return true;
            }
        } catch (e) { console.warn('[静默失败] js/extensions/cave-reception.js · _hasFacility：设施账没翻动，这一间按没装算', e && e.message); }
        return false;
    }

    function _countOf(templateId) {
        try {
            var slots = (window.inventory && window.inventory.slots) || [];
            var n = 0;
            for (var i = 0; i < slots.length; i++) {
                var s = slots[i];
                if (s && s.templateId === templateId && (s.count || 0) > 0) n += s.count;
            }
            return n;
        } catch (e) { console.warn('[静默失败] js/extensions/cave-reception.js · _countOf：行囊没数清，待客的物件按没有算', e && e.message); }
        return 0;
    }

    function _consumeOne(templateId) {
        try {
            var slots = (window.inventory && window.inventory.slots) || [];
            for (var i = 0; i < slots.length; i++) {
                var s = slots[i];
                if (s && s.templateId === templateId && (s.count || 0) > 0 && s.uid) {
                    if (typeof window.removeItem === 'function') {
                        window.removeItem(s.uid, 1);
                        return true;
                    }
                }
            }
        } catch (e) { console.warn('[静默失败] js/extensions/cave-reception.js · _consumeOne：待客的东西没扣成，白请了客', e && e.message); }
        return false;
    }

    function _npc(id) {
        try {
            if (window.npcManager && typeof window.npcManager.getNPC === 'function') return window.npcManager.getNPC(id) || null;
        } catch (e) { console.warn('[静默失败] js/extensions/cave-reception.js · _npc：客人没找着，这一趟接待落了空', e && e.message); }
        return null;
    }

    function _fengshuiBonus() {
        var mul = 1;
        try { if (typeof window.getFengshuiMul === 'function') mul = Number(window.getFengshuiMul()) || 1; } catch (e) { console.warn('[静默失败] js/extensions/cave-reception.js · _fengshuiBonus：风水账没读出来，客人按平常心坐', e && e.message); }
        return Math.max(-FS_AFF_CAP, Math.min(FS_AFF_CAP, Math.round((mul - 1) * 20)));
    }

    function _closePanel() {
        try { if (_panelHandle && typeof _panelHandle.close === 'function') _panelHandle.close(); } catch (eC) { console.warn('[静默失败] js/extensions/cave-reception.js · _closePanel：接待的弹窗没关上，屏上留着空盘子', eC && eC.message); }
        _panelHandle = null;
    }

    function _diary(text) {
        try { if (window.CaveLife && typeof window.CaveLife.addDiary === 'function') window.CaveLife.addDiary(text, 'visit'); } catch (eD) { console.warn('[静默失败] js/extensions/cave-reception.js · _diary：起居注没记上，这一场客白坐了', eD && eD.message); }
    }

    // cave-life 的每日 tick 把客人领到门口——弹得出接待窗就接手（返回 true），弹不出就还给它走自动文本
    function receive(guest, ctx) {
        if (!guest || !guest.name || !canReceive()) return false;
        ctx = ctx || {};
        _pending = {
            npcId: guest.id || null, name: guest.name,
            hasTea: !!ctx.hasTea, hasGuestRoom: !!ctx.hasGuestRoom
        };
        _renderPanel('山径上传来脚步声——' + guest.name + ' 到了门口，正往里张望。');
        return true;
    }

    function _renderPanel(line) {
        if (!_pending) return;
        _closePanel();
        var teaN = _countOf(TEA_ITEM), fruitN = _countOf(FRUIT_ITEM);
        var id = String(_pending.npcId || '').replace(/'/g, '');
        var html = '<p class="text-sm text-gray-300 mb-3">' + line + '</p>'
            + '<p class="text-xs text-gray-500 mb-3">静室的风水客人坐得到——吉气养人，煞气冲人。怎么招待，你定。</p>'
            + '<div class="space-y-2">'
            + '<button ' + (teaN > 0 ? '' : 'disabled ') + 'onclick="CaveReception.serve(\'' + id + '\',\'tea\')" class="w-full p-3 rounded text-left text-sm ' + (teaN > 0 ? 'bg-emerald-700 hover:opacity-90 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed') + '">🫖 上仙露茶（行囊里有 ' + teaN + '）——好感 +8 起</button>'
            + '<button ' + (fruitN > 0 ? '' : 'disabled ') + 'onclick="CaveReception.serve(\'' + id + '\',\'fruit\')" class="w-full p-3 rounded text-left text-sm ' + (fruitN > 0 ? 'bg-amber-700 hover:opacity-90 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed') + '">🍑 上灵果（行囊里有 ' + fruitN + '）——好感 +10 起</button>'
            + '<button onclick="CaveReception.serve(\'' + id + '\',\'plain\')" class="w-full p-3 rounded text-left text-sm bg-gray-600 hover:bg-gray-500 text-white">💬 清谈奉粗茶（不耗东西）——好感 +4 起</button>'
            + '<button onclick="CaveReception.turnAway(\'' + id + '\')" class="w-full p-2 rounded text-left text-xs bg-gray-800 hover:bg-gray-700 text-gray-400">🚪 今日不便，送客——好感 -3</button>'
            + '</div>';
        _panelHandle = window.showModal('🍵 有客登门 · ' + _pending.name, html);
    }

    function serve(npcId, kind) {
        var p = _pending;
        _pending = null;
        _closePanel();
        if (!p) return false;
        var npc = _npc(npcId || p.npcId);
        if (!npc) { if (window.showMessage) window.showMessage(p.name + ' 已经走了——门口只剩一双脚印。', 'info'); return false; }
        kind = kind || 'plain';
        if (kind === 'tea' || kind === 'fruit') {
            var tid = kind === 'tea' ? TEA_ITEM : FRUIT_ITEM;
            if (!_consumeOne(tid)) {
                if (window.showMessage) window.showMessage('行囊里翻不出这一样——只好改口说「粗茶一盏，莫怪」。', 'warning');
                kind = 'plain';
            }
        }
        var fs = _fengshuiBonus();
        var fac = (p.hasTea ? FACILITY_BONUS : 0) + (p.hasGuestRoom ? FACILITY_BONUS : 0);
        var gain = AFF[kind] + fs + fac;
        try { if (typeof npc.changeAffection === 'function') npc.changeAffection(gain); } catch (eA) { console.warn('[静默失败] js/extensions/cave-reception.js · serve：好感没落账，这场客白招待了', eA && eA.message); }
        // 论道有小得：好好招待的客人都带着一身见闻来
        var cd = window.currentCharData;
        if (cd && kind !== 'plain') cd.mood = Math.max(0, Math.min(100, (Number(cd.mood) || 50) + 6));
        var fsTxt = fs > 0 ? '静室里吉气流转，客人坐得眉眼都松了（风水 +' + fs + '）' : (fs < 0 ? '静室里煞气有点冲，客人坐得直皱眉（风水 ' + fs + '）' : '');
        var kindTxt = kind === 'tea' ? '仙露茶' : kind === 'fruit' ? '灵果' : '粗茶';
        // 招待得好，知己也不空手——回礼走 giveWithReceipt 正门，实收多少念多少
        var giftTxt = '';
        if (kind !== 'plain') {
            try {
                var gift = GIFT_POOL[Math.floor(Math.random() * GIFT_POOL.length)];
                var giftName = (window.itemById && window.itemById[gift] && window.itemById[gift].name) || gift;
                if (typeof window.giveWithReceipt === 'function') {
                    var r = window.giveWithReceipt(gift, 1, { quiet: true });
                    giftTxt = r && r.got > 0 ? '临走 ' + p.name + ' 回赠了一份 ' + (r.name || giftName) + '。'
                        : '临走 ' + p.name + ' 想回赠一份 ' + giftName + '，' + ((typeof window.addItemFailPhraseFor === 'function' && window.addItemFailPhraseFor(r && r.reason, giftName)) || '没能落进你的行囊，只好当场谢辞') + '。';
                }
            } catch (eG) { console.warn('[静默失败] js/extensions/cave-reception.js · serve：客人的回礼没接住，这份心意落在了地上', eG && eG.message); }
        }
        var line = p.name + ' 登门，你以' + kindTxt + '相待' + (fsTxt ? '——' + fsTxt : '') + '，好感 +' + gain + '。' + giftTxt;
        _diary(line);
        try {
            if (window.WorldJournal && typeof window.WorldJournal.record === 'function') {
                window.WorldJournal.record({ type: 'cave_visit', title: '会客', text: p.name + ' 到洞府来，你亲自招待了一场。', refs: { npc: npcId || p.npcId } });
            }
        } catch (eJ) { console.warn('[静默失败] js/extensions/cave-reception.js · serve：天下见闻没记下这一场客', eJ && eJ.message); }
        if (window.showMessage) window.showMessage('🍵 ' + line, 'success');
        return true;
    }

    function turnAway(npcId) {
        var p = _pending;
        _pending = null;
        _closePanel();
        if (!p) return false;
        var npc = _npc(npcId || p.npcId);
        if (npc && typeof npc.changeAffection === 'function') {
            try { npc.changeAffection(AFF.turnAway); } catch (eA) { console.warn('[静默失败] js/extensions/cave-reception.js · turnAway：送客的好感扣账没落笔', eA && eA.message); }
        }
        var line = '你隔着门帘谢了客——' + p.name + ' 站了一会儿，把带来的话又带了回去。';
        _diary(line);
        if (window.showMessage) window.showMessage('🚪 ' + line + '（好感 ' + AFF.turnAway + '）', 'info');
        return true;
    }

    window.CaveReception = {
        receive: receive,
        serve: serve,
        turnAway: turnAway,
        canReceive: canReceive,
        TEA_ITEM: TEA_ITEM,
        FRUIT_ITEM: FRUIT_ITEM,
        AFF: AFF
    };
})();
