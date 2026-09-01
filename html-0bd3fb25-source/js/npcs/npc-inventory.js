/**
 * npc-inventory.js — 物品与NPC联动·一期：行囊系统（v13.9）
 *
 * NPC开始真正持有东西：
 *   - 读档补全：NPC.serialize/deserialize 已纳入 inventory/npcEquipment（npc-system.js v13.9）
 *   - wants 需求层：十个故事线NPC各有带理由的心愿物，命中送礼 好感+8 + 专属感谢；7天冷却
 *   - 赠礼弹窗横幅：「他正想要：……」前置提示，让决策有意义
 *   - 人物面板「🎒 行囊」区：展示其持有的物品与装备
 *
 * 集成方式（零侵入）：包装 window.giveGiftToNPC / confirmGiftToNPC / getSecretDisplayHtml，
 * 全部延迟到 DOMContentLoaded（app.js 在本文件之后加载，届时原生函数才存在）。
 */
(function () {
    'use strict';

    var COOLDOWN_DAYS = 7;

    // ==================== wants 心愿表（物品id均为实测存在于 items.js） ====================
    var WANTS_DATA = {
        warrior_01: [
            { id: 'blood_plum', reason: '八年前那一战伤在根上——只有血菩提压得住', thanks: '他捏着血菩提愣了半天，喉咙滚了滚：「……你从哪弄来的。这东西，我找了八年。」' },
            { id: 'iron_ore', reason: '给那半截断枪杆配个新头', thanks: '「识货！」他把精铁掂了掂，「回头枪杆修好了，第一个教你使。」' }
        ],
        healer_01: [
            { id: 'ginseng', reason: '噬心蛊引的研究卡在最后一味药引上', thanks: '她的眼睛一下子亮了：「千年人参！有了它，蛊引的最后一环就能试了——谢谢你。」' },
            { id: 'spirit_grass', reason: '配伍基底常年缺口', thanks: '「灵草！谷里的库存见底好久了。」她小心翼翼收进药篓，「这份情我记下了。」' }
        ],
        mentor_01: [
            { id: 'dragon_bone', reason: '讲经时展示上古遗物，胜过千言', thanks: '他抚着龙骨沉吟许久：「明日讲经，就讲它。万物有灵，骨头里也刻着话。」——难得地开了个玩笑。' },
            { id: 'lingzhi', reason: '清修之资', thanks: '「有心。」他把灵芝收进袖中，「清修不假外求，但外供亦是一缘。」' }
        ],
        merchant_01: [
            { id: 'phoenix_feather', reason: '南边来的奇货，转手就是十倍', thanks: '他两眼放光：「凤凰羽！成色这么好的十年没见过了——朋友，你这是给我送钱来了！」' },
            { id: 'blood_plum', reason: '南边有人高价收这个', thanks: '他飞快地把血菩提包好塞进货架底下：「别问去处。这份心意我记账上了——利滚利的那种。」' }
        ],
        alchemist_01: [
            { id: 'ginseng', reason: '续命丹方的主药——三十年前没凑齐的那一味', thanks: '他捧着人参的手微微发抖，半晌只说了句：「……是它。丹方里写的就是它。」' },
            { id: 'spirit_grass', reason: '文火煨丹的君药', thanks: '「君药要鲜。」他当场把灵草栽进了窗边的药圃，「谢了。开春第一茬新芽归你。」' }
        ],
        elder_01: [
            { id: 'blood_plum', reason: '传闻能镇寒毒——他在暗中试一切办法', thanks: '他盯着血菩提看了很久：「……这种传闻你也信。」——但东西收下了，收得很仔细。' },
            { id: 'iron_ore', reason: '养剑', thanks: '「精铁养剑锋。」他颔首，「你有心。」——天山长老的一句有心，抵得上旁人十句。' }
        ],
        rival_01: [
            { id: 'teleport_talisman', reason: '暗桩最缺的是退路', thanks: '他捏着传送符怔了一下，随即低笑：「……你倒是懂行。干我们这行的，符比命可靠。」' },
            { id: 'vitality_pill', reason: '风餐露宿落下的老毛病', thanks: '「回春丹？」他掂了掂，忽然笑了，「行啊。正道的丹药吃进魔教的肚子——这才叫江湖。」' }
        ],
        villager_01: [
            { id: 'cloth_shoes', reason: '下田穿的，旧的磨破了', thanks: '他坐在田埂上就把旧鞋换了，走了两步一跺脚：「合脚！娃啊，你可真细心。」' },
            { id: 'spirit_grass', reason: '泡酒', thanks: '「灵草泡酒？哎哟——」他搓着手直乐，「明年这时候来，请你喝自家的灵草酒！」' }
        ],
        craftsman_01: [
            { id: 'iron_ore', reason: '打铁本行，来者不拒', thanks: '他敲了敲矿石听声，点头：「好料。——放着吧，回头给你打样小玩意儿抵账。」' },
            { id: 'dragon_bone', reason: '传说能替代陨铁——他想试一试', thanks: '他摩挲龙骨的手停住了：「要是这东西真能入炉……『哭夜』的教训，或许能换个解法。」' }
        ],
        mysterious_01: [
            { id: 'dragon_bone', reason: '万年前旧物，看到会出神', thanks: '他捧着龙骨出了很久的神：「……那个年代的东西。它比我记得的，还要旧一些。」' },
            { id: 'lingzhi', reason: '凡品他也收——味道一样', thanks: '「灵芝无分凡仙，入口都是一个味。」他难得地弯了下眼睛，「但你挑的时候用心，我尝得出来。」' }
        ]
    };

    // ==================== 冷却持久化（StateRegistry 外置） ====================
    // satisfied: { 'npcId|itemId': absoluteDay }
    var _st = { satisfied: {} };

    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        window.StateRegistry.register('npcInventoryWants', {
            version: 1,
            export: function () { return { satisfied: JSON.parse(JSON.stringify(_st.satisfied)) }; },
            import: function (d) {
                _st.satisfied = {};
                if (d && d.satisfied && typeof d.satisfied === 'object') {
                    Object.keys(d.satisfied).forEach(function (k) {
                        var v = Number(d.satisfied[k]);
                        if (!isNaN(v)) _st.satisfied[k] = v;
                    });
                }
            },
            reset: function () { _st = { satisfied: {} }; }
        });
    }

    function currentDay() {
        try {
            return (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') ? window.timeSystem.getAbsoluteDay() : 0;
        } catch (e) { return 0; }
    }

    function wantArmed(npcId, w) {
        var last = _st.satisfied[npcId + '|' + w.id];
        if (last == null) return true;
        return (currentDay() - last) >= COOLDOWN_DAYS;
    }

    function activeWants(npcId) {
        return getAllWants(npcId).filter(function (w) { return wantArmed(npcId, w); });
    }

    function itemName(id) {
        return (window.itemById && window.itemById[id] && (window.itemById[id].name || window.itemById[id].label)) || id;
    }

    function matchWant(npcId, templateId, tplName) {
        var list = getAllWants(npcId);
        for (var i = 0; i < list.length; i++) {
            var w = list[i];
            if (!wantArmed(npcId, w)) continue;
            if (templateId === w.id) return w;
            if (tplName && tplName === itemName(w.id)) return w;
        }
        return null;
    }

    function markSatisfied(npcId, w) {
        _st.satisfied[npcId + '|' + w.id] = currentDay();
        completeWantQuest(npcId, w.id);
    }

    // ==================== 二期：职业池动态心愿 + 委托桥接 ====================
    // 手工心愿全部冷却时，从职业池按日轮转补一条动态心愿（确定性取模，无需持久化）
    var OCCUPATION_POOLS = {
        warrior_01: ['vitality_pill', 'iron_ore'],
        healer_01: ['lingzhi', 'vitality_pill'],
        mentor_01: ['phoenix_feather', 'spirit_grass'],
        merchant_01: ['dragon_bone', 'teleport_talisman'],
        alchemist_01: ['iron_ore', 'blood_plum'],
        elder_01: ['ginseng', 'dragon_bone'],
        rival_01: ['spirit_grass', 'iron_ore'],
        villager_01: ['teleport_talisman', 'iron_ore'],
        craftsman_01: ['phoenix_feather', 'ginseng'],
        mysterious_01: ['teleport_talisman', 'phoenix_feather']
    };

    function dynamicWant(npcId) {
        var pool = OCCUPATION_POOLS[npcId];
        if (!pool || !pool.length) return null;
        var hand = (WANTS_DATA[npcId] || []).map(function (w) { return w.id; });
        var day = currentDay();
        for (var i = 0; i < pool.length; i++) {
            var cand = pool[(day + i) % pool.length];
            if (hand.indexOf(cand) < 0) return { id: cand, dynamic: true };
        }
        return null;
    }

    function getAllWants(npcId) {
        var list = (WANTS_DATA[npcId] || []).slice();
        var dw = dynamicWant(npcId);
        if (dw) {
            var dup = list.some(function (w) { return w.id === dw.id; });
            if (!dup) list.push(dw);
        }
        return list;
    }

    // 未满足心愿 → 自动注册为「捎来」取物委托（幂等）
    function syncWantQuests() {
        var qs = window.npcQuestSystem;
        if (!qs || !qs.quests || typeof qs.registerQuestTemplate !== 'function') return;
        Object.keys(WANTS_DATA).forEach(function (npcId) {
            activeWants(npcId).forEach(function (w) {
                var qid = 'want_' + npcId + '_' + w.id;
                if (qs.completedQuests && qs.completedQuests.has && qs.completedQuests.has(qid)) return;
                if (qs.quests.has(qid)) return;
                var tpl = {
                    id: qid,
                    title: '捎来：' + itemName(w.id),
                    type: 'collection',
                    npcId: npcId,
                    minAffection: 15,
                    rewards: { spiritStones: 30, affection: 6 },
                    wantItem: w.id,
                    desc: ((window.npcManager.getNPC(npcId) || {}).name || '') + '想得到' + itemName(w.id)
                };
                qs.registerQuestTemplate(tpl);
                qs.availableQuests.push(tpl);
            });
        });
    }

    // 心愿满足 → 对应委托自动完结；报酬优先从NPC自己行囊掏
    function completeWantQuest(npcId, itemId) {
        try {
            var qs = window.npcQuestSystem;
            if (!qs || !qs.completedQuests) return;
            var qid = 'want_' + npcId + '_' + itemId;
            if (qs.completedQuests.has && qs.completedQuests.has(qid)) return;
            var had = false;
            if (qs.availableQuests) {
                qs.availableQuests = qs.availableQuests.filter(function (q) {
                    if (q.id === qid) { had = true; return false; }
                    return true;
                });
            }
            if (!had && !(qs.quests && qs.quests.has(qid))) return;
            qs.completedQuests.add(qid); // 绕开 completeQuest 的 changeFavor 隐患
            var npc = window.npcManager && window.npcManager.getNPC ? window.npcManager.getNPC(npcId) : null;
            var payMsg = '';
            if (npc && npc.inventory && Array.isArray(npc.inventory.items)) {
                var cand = null;
                for (var i = 0; i < npc.inventory.items.length; i++) {
                    if (npc.inventory.items[i].templateId !== itemId && npc.inventory.items[i].count >= 1) { cand = npc.inventory.items[i]; break; }
                }
                if (cand && typeof npc.removeItemFromInventory === 'function') {
                    npc.removeItemFromInventory(cand.templateId, 1);
                    if (typeof window.addItemToInventory === 'function') window.addItemToInventory(cand.templateId, 1);
                    else if (typeof window.addItem === 'function') window.addItem(cand.templateId, 1);
                    payMsg = itemName(cand.templateId);
                }
            }
            if (!payMsg) {
                if (window.currentCharData) window.currentCharData.spiritStones = (window.currentCharData.spiritStones || 0) + 40;
                payMsg = '灵石×40';
            }
            if (npc && typeof npc.changeAffection === 'function') npc.changeAffection(6);
            window.showMessage('📜 委托达成「捎来：' + itemName(itemId) + '」——' + (npc ? npc.name : '') + ' 从行囊里翻出' + payMsg + '作为谢礼。（好感+6）', 'success');
        } catch (e) { console.warn('[行囊] 委托完结失败:', e); }
    }

    // 每日消耗钩子：有丹药类存量的NPC自用一颗（喂自主生活的最小实现）
    function dailyConsumeHook() {
        try {
            if (!window.npcManager || typeof window.npcManager.getNPC !== 'function') return;
            Object.keys(WANTS_DATA).forEach(function (npcId) {
                var npc = window.npcManager.getNPC(npcId);
                if (!npc || !npc.inventory || !Array.isArray(npc.inventory.items)) return;
                for (var i = 0; i < npc.inventory.items.length; i++) {
                    var it = npc.inventory.items[i];
                    var tpl = window.itemById ? window.itemById[it.templateId] : null;
                    if (tpl && tpl.type === 'consumable') {
                        if (typeof npc.removeItemFromInventory === 'function') npc.removeItemFromInventory(it.templateId, 1);
                        if (npc.state) npc.state.mood = Math.min(100, (npc.state.mood || 50) + 3);
                        return; // 每人每日至多消耗一颗
                    }
                }
            });
        } catch (e) { console.warn('[行囊] 每日消耗失败:', e); }
    }

    if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
        window.timeSystem.onNewDaySubscribe(dailyConsumeHook);
    }

    // ==================== 行囊面板区（挂在秘密栏同层） ====================
    function bagSectionHtml(npc) {
        if (!npc) return '';
        var inv = npc.inventory && Array.isArray(npc.inventory.items) ? npc.inventory.items : [];
        var eq = npc.npcEquipment || null;
        var inner = '';
        if (inv.length === 0 && !eq) {
            inner = '<p class="text-xs text-gray-600">空空如也——送点东西给他吧。</p>';
        } else {
            if (eq) {
                var eqNames = [];
                if (eq.mainHand) eqNames.push('武器：' + (eq.mainHand.name || '?'));
                if (eq.body) eqNames.push('衣着：' + (eq.body.name || '?'));
                if (eq.accessory) eqNames.push('饰品：' + (eq.accessory.name || '?'));
                if (eqNames.length) inner += '<p class="text-xs text-sky-300 mb-1">' + eqNames.join(' · ') + '</p>';
            }
            if (inv.length > 0) {
                inner += inv.slice(0, 6).map(function (it) {
                    return '<p class="text-xs text-gray-300">· ' + itemName(it.templateId) + (it.count > 1 ? ' ×' + it.count : '') + '</p>';
                }).join('');
                if (inv.length > 6) inner += '<p class="text-xs text-gray-500">……另有 ' + (inv.length - 6) + ' 样</p>';
            }
        }
        var wants = activeWants(npc.id);
        var wantLine = wants.length
            ? '<p class="text-xs text-yellow-500/90 mt-2">💭 心愿：' + wants.map(function (w) { return itemName(w.id); }).join('、') + '</p>'
            : '';
        return '<details class="mt-2"><summary class="cursor-pointer text-teal-400 text-xs font-bold">🎒 行囊（' + inv.length + '/' + ((npc.inventory && npc.inventory.maxSlots) || 10) + '）</summary>' +
            '<div class="mt-2 bg-gray-800/40 border border-gray-700 rounded p-2 space-y-1">' + inner + wantLine + '</div></details>';
    }

    // ==================== 包装集成（DOMContentLoaded 后执行） ====================
    function integrate() {
        // 1) 赠礼弹窗：插入心愿横幅
        if (typeof window.giveGiftToNPC === 'function' && !window.giveGiftToNPC.__npc_inv_wrapped) {
            var origGive = window.giveGiftToNPC;
            window.giveGiftToNPC = function (npcId) {
                var r = origGive.apply(this, arguments);
                try {
                    var modals = document.querySelectorAll('.fixed.inset-0');
                    var modal = modals[modals.length - 1];
                    if (modal) {
                        var wants = activeWants(npcId);
                        if (wants.length) {
                            var names = wants.map(function (w) { return itemName(w.id); }).join('、');
                            var banner = document.createElement('div');
                            banner.className = 'mb-3 p-2 bg-yellow-900/30 border border-yellow-700/50 rounded text-xs text-yellow-200';
                            banner.innerHTML = '💡 ' + (((window.npcManager || {}).getNPC || function () { return null; })(npcId) || {}).name + ' 正想要：<b>' + names + '</b> ——送对了，情分不一样。';
                            var container = modal.querySelector('.bg-gray-800');
                            if (container) container.insertBefore(banner, container.children[1] || null);
                        }
                    }
                } catch (e) { console.warn('[行囊] 横幅注入失败:', e); }
                return r;
            };
            window.giveGiftToNPC.__npc_inv_wrapped = true;
        }

        // 2) 确认赠礼：真实入包由原逻辑完成（v11.8 分流），本层做want匹配加成
        if (typeof window.confirmGiftToNPC === 'function' && !window.confirmGiftToNPC.__npc_inv_wrapped) {
            var origConfirm = window.confirmGiftToNPC;
            window.confirmGiftToNPC = function (npcId, slotIndex, gain) {
                var slot = (window.inventory && window.inventory.slots) ? window.inventory.slots[slotIndex] : null;
                var preCount = slot ? slot.count : null;
                var tplId = slot ? (slot.templateId || slot.id) : null;
                var tpl = (slot && typeof slot.getTemplate === 'function') ? slot.getTemplate() : null;
                var r = origConfirm.apply(this, arguments);
                try {
                    var postSlot = (window.inventory && window.inventory.slots) ? window.inventory.slots[slotIndex] : null;
                    var postCount = postSlot ? postSlot.count : 0;
                    var consumed = (preCount != null) && (postCount < preCount);
                    if (consumed && tplId) {
                        var w = matchWant(npcId, tplId, tpl ? tpl.name : null);
                        if (w) {
                            markSatisfied(npcId, w);
                            var n = window.npcManager && window.npcManager.getNPC ? window.npcManager.getNPC(npcId) : null;
                            if (n && typeof n.changeAffection === 'function') n.changeAffection(8);
                            window.showMessage('❤ 正合他意！' + (n ? n.name : '') + '：' + w.thanks + '（好感+8）', 'success');
                        }
                    }
                } catch (e) { console.warn('[行囊] 心愿匹配失败:', e); }
                return r;
            };
            window.confirmGiftToNPC.__npc_inv_wrapped = true;
        }

        // 3) 人物面板：秘密栏后追加行囊区
        if (typeof window.getSecretDisplayHtml === 'function' && !window.getSecretDisplayHtml.__npc_inv_wrapped) {
            var origSecretHtml = window.getSecretDisplayHtml;
            window.getSecretDisplayHtml = function (npc) {
                var base = origSecretHtml.apply(this, arguments);
                try { return base + bagSectionHtml(npc); } catch (e) { return base; }
            };
            window.getSecretDisplayHtml.__npc_inv_wrapped = true;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            integrate();
            try { syncWantQuests(); } catch (e) { console.warn('[行囊] 委托同步失败:', e); }
        });
    } else {
        integrate();
        try { syncWantQuests(); } catch (e) { console.warn('[行囊] 委托同步失败:', e); }
    }

    // ==================== 导出 ====================
    window.NpcInventory = {
        bagSectionHtml: bagSectionHtml,
        activeWants: activeWants,
        matchWant: matchWant,
        syncWantQuests: syncWantQuests
    };

    console.log('🎒 物品与NPC联动·行囊系统已加载（读档补全 + wants需求层 + 送礼闭环 + 动态心愿与委托桥接）');
})();
