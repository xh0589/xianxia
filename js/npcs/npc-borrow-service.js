/**
 * npc-borrow-service.js — NPC 借物契约
 * 借出、归还、逾期全部绑定游戏时间；记录纳入统一存档。
 */
(function (global) {
    'use strict';

    var records = Array.isArray(global.borrowRecords) ? global.borrowRecords : [];
    var sequence = 0;

    function clone(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }
    function cfg() {
        var b = (global.BALANCE_CONFIG && global.BALANCE_CONFIG.borrow) || {};
        return {
            durationDays: Math.max(1, Number(b.durationDays) || 3),
            overdueAffectionPenalty: Math.max(0, Number(b.overdueAffectionPenalty) || 10),
            favorCost: Math.max(0, Number(b.favorCost) || 5),
            returnAffectionBonus: Math.max(0, Number(b.returnAffectionBonus) || 2)
        };
    }
    function nowMinute() {
        if (global.GameScheduler) return global.GameScheduler.nowMinute();
        return global.timeSystem && global.timeSystem.gameTime ? Number(global.timeSystem.gameTime.totalMinutes) || 0 : 0;
    }
    function findRecord(id) { return records.find(function (r) { return r.id === id; }) || null; }
    function npcById(id) { return global.npcManager && global.npcManager.getNPC ? global.npcManager.getNPC(id) : null; }
    function pendingForNpc(npcId) { return records.find(function (r) { return r.npcId === npcId && !r.returned; }); }
    function makeRecordId(npcId) {
        sequence += 1;
        return 'borrow_' + String(npcId || 'npc') + '_' + nowMinute() + '_' + sequence;
    }
    function itemName(itemId, fallback) {
        var def = global.itemById && global.itemById[itemId];
        return fallback || (def && def.name) || itemId;
    }

    function markOverdue(recordId) {
        var rec = findRecord(recordId);
        if (!rec || rec.returned || rec.overdue) return true;
        if (nowMinute() < rec.dueGameMinute) return false;
        rec.overdue = true;
        rec.overdueGameMinute = nowMinute();
        var npc = npcById(rec.npcId);
        if (npc && typeof npc.changeAffection === 'function') npc.changeAffection(-cfg().overdueAffectionPenalty);
        if (typeof global.showMessage === 'function') {
            global.showMessage((npc ? npc.name : rec.npcName || '对方') + ' 的借物已逾期，好感度-' + cfg().overdueAffectionPenalty, 'warning');
        }
        // v27.16：钱契逾期——七日后他的兄弟上门（scheduleCollect 挂追讨调度；物契照旧只掉好感）
        if (rec.kind === 'money') { try { scheduleCollect(rec); } catch (eSc16) {} }
        return true;
    }

    function scheduleRecord(rec) {
        if (!global.GameScheduler || rec.returned || rec.overdue) return;
        global.GameScheduler.schedule('npc_borrow:overdue', rec.dueGameMinute, { recordId: rec.id }, { id: 'borrow_due_' + rec.id });
    }

    function chooseNpcItem(npc) {
        var items = npc && npc.inventory && Array.isArray(npc.inventory.items) ? npc.inventory.items : [];
        var candidates = items.filter(function (it) { return it && it.templateId && (Number(it.count) || 0) > 0; });
        if (candidates.length) {
            var pick = candidates[Math.floor(Math.random() * candidates.length)];
            return { itemId: pick.templateId, count: 1, name: itemName(pick.templateId, pick.name), source: pick };
        }
        // 未配置个人背包时只借 1 枚基础丹药，避免凭空大量复制。
        return { itemId: 'pill_small_recovery', count: 1, name: itemName('pill_small_recovery', '小还丹'), source: null };
    }

    function addToPlayer(item) {
        var tx = global.EconomyTransaction;
        if (!tx || typeof tx.run !== 'function') return false;
        return tx.run(function () {
            if (typeof global.addItem !== 'function' || !global.addItem(item.itemId, item.count)) {
                return { success: false, reason: 'inventory_full' };
            }
            return { success: true };
        });
    }

    function borrowFromNPC(npc) {
        if (!npc) return { success: false, msg: 'NPC不存在' };
        // v25.8 断头账救活：memory.totalAttacks 记了多年没人翻——动过手的人记一辈子，东西不借
        if (npc.memory && (Number(npc.memory.totalAttacks) || 0) > 0) {
            return { success: false, msg: npc.name + ' 盯着你看了半晌，把身边的东西往怀里拢了拢——动过手的人，东西是不会借给你的。' };
        }
        var existing = pendingForNpc(npc.id);
        if (existing) return { success: false, msg: '你还有向' + npc.name + '借的「' + existing.itemName + '」未归还' };
        var item = chooseNpcItem(npc);
        var added = addToPlayer(item);
        if (!added || added.success === false) return { success: false, msg: '借物失败：背包已满' };

        // 玩家收货成功后才从 NPC 背包扣除，避免半交易。
        if (item.source) {
            item.source.count = (Number(item.source.count) || 1) - item.count;
            if (item.source.count <= 0) npc.inventory.items = npc.inventory.items.filter(function (it) { return it !== item.source; });
        }

        var c = cfg();
        var borrowedAt = nowMinute();
        var rec = {
            id: makeRecordId(npc.id), npcId: npc.id, npcName: npc.name,
            itemId: item.itemId, itemName: item.name, count: item.count,
            borrowedAtGameMinute: borrowedAt,
            dueGameMinute: borrowedAt + c.durationDays * 1440,
            returned: false, overdue: false
        };
        records.push(rec);
        if (typeof npc.changeFavor === 'function' && c.favorCost > 0) npc.changeFavor(-c.favorCost);
        if (typeof npc.recordPlayerAction === 'function') npc.recordPlayerAction('borrow_item', 'positive');
        scheduleRecord(rec);
        return { success: true, msg: npc.name + ' 借给你「' + item.name + '」，请在' + c.durationDays + '个游戏日内归还', data: { borrowRecord: clone(rec) } };
    }

    function returnBorrowedItem(recordId) {
        var rec = findRecord(recordId);
        if (!rec) return { success: false, msg: '借物记录不存在' };
        if (rec.returned) return { success: false, msg: '该物品已经归还' };
        var tx = global.EconomyTransaction;
        if (!tx || typeof tx.run !== 'function' || typeof tx.removeByTemplate !== 'function') return { success: false, msg: '背包事务系统未就绪' };
        var removed = tx.run(function () {
            if (!tx.removeByTemplate(rec.itemId, rec.count)) return { success: false, reason: 'missing_item' };
            return { success: true };
        });
        if (!removed || removed.success === false) return { success: false, msg: '背包中没有足够的「' + rec.itemName + '」可归还' };

        var npc = npcById(rec.npcId);
        if (npc) {
            if (!npc.inventory) npc.inventory = { items: [], maxSlots: 10 };
            if (!Array.isArray(npc.inventory.items)) npc.inventory.items = [];
            var same = npc.inventory.items.find(function (it) { return it && it.templateId === rec.itemId; });
            if (same) same.count = (Number(same.count) || 0) + rec.count;
            else npc.inventory.items.push({ templateId: rec.itemId, name: rec.itemName, count: rec.count });
            if (!rec.overdue && typeof npc.changeAffection === 'function' && cfg().returnAffectionBonus > 0) npc.changeAffection(cfg().returnAffectionBonus);
            if (typeof npc.recordPlayerAction === 'function') npc.recordPlayerAction('return_borrowed_item', rec.overdue ? 'neutral' : 'positive');
        }
        rec.returned = true;
        rec.returnedGameMinute = nowMinute();
        if (global.GameScheduler) global.GameScheduler.cancel('borrow_due_' + rec.id);
        return { success: true, msg: '已归还「' + rec.itemName + '」' + (!rec.overdue ? '，守信让关系略有提升' : '') };
    }

    function serialize() { return { sequence: sequence, records: clone(records) }; }
    function deserialize(data) {
        data = data || {};
        sequence = Number(data.sequence) || 0;
        records.splice(0, records.length);
        (Array.isArray(data.records) ? data.records : []).forEach(function (r) { records.push(clone(r)); });
        records.forEach(scheduleRecord);
    }
    function reset() {
        records.splice(0, records.length); sequence = 0;
        if (global.GameScheduler) global.GameScheduler.cancelByType('npc_borrow:overdue');
    }

    var api = { borrowFromNPC: borrowFromNPC, returnBorrowedItem: returnBorrowedItem, markOverdue: markOverdue, getRecords: function () { return clone(records); }, serialize: serialize, deserialize: deserialize, reset: reset };
    global.borrowRecords = records;
    global.NPCBorrowService = api;
    global.returnBorrowedItem = returnBorrowedItem;
    global.markBorrowOverdue = markOverdue;
    if (global.GameScheduler) global.GameScheduler.registerHandler('npc_borrow:overdue', function (payload) { return markOverdue(payload && payload.recordId); });

    // ============ v27.16：⑦新增-2 破产者的体面——借钱契约（money 族） ============
    // 世界的账：好感够深的 NPC 才肯掏真钱包（NPCLife.ledger 正门扣）；借走不还，他的日子真的往下过
    // （purse 见底 → 雇工谢礼打欠条、掌柜货架压薄——都是现有消费面，零改动自动吃到穷态）；
    // 逾期七日他的兄弟上门：还（含一成辛苦钱）/赖（好感断崖+这城有人记住了你的脸——耳语暗账首写入）。
    function pendingMoneyFor(npcId) {
        return records.find(function (r) { return r.npcId === npcId && r.kind === 'money' && !r.returned && !r.deadbeated; }) || null;
    }
    function npcAff(npc) { try { return Number(npc && npc.relationship && npc.relationship.affection) || 0; } catch (e) { return 0; } }
    function playerStones() { try { return (global.currentCharData && Number(global.currentCharData.spiritStones)) || 0; } catch (e) { return 0; } }
    function playerAddStones(n) {
        try {
            if (global.currentCharData) global.currentCharData.spiritStones = playerStones() + n;
            else if (global.DataManager && typeof global.DataManager.addSpiritStones === 'function') global.DataManager.addSpiritStones(n);
        } catch (e) {}
    }

    function borrowMoneyFromNPC(npc) {
        if (!npc) return { success: false, msg: 'NPC不存在' };
        if (npc.memory && (Number(npc.memory.totalAttacks) || 0) > 0) {
            return { success: false, msg: npc.name + ' 摇了摇头——动过手的人，钱更是不会借的。' };
        }
        var aff = npcAff(npc);
        if (aff < 60) return { success: false, msg: '还不到掏钱包的交情（好感≥60 才开这个口）。' };
        if (pendingMoneyFor(npc.id)) return { success: false, msg: '上一笔' + pendingMoneyFor(npc.id).amount + ' 灵石还没还清。' };
        var purse = null;
        try { purse = (global.NPCLife && global.NPCLife.ledger && typeof global.NPCLife.ledger.purse === 'function') ? global.NPCLife.ledger.purse(npc) : null; } catch (eP) {}
        if (purse === null) return { success: false, msg: npc.name + ' 的小账房不在册——这条借路走不通。' };
        var want = Math.min(Math.floor(purse), 10 + Math.floor(aff / 10));   // 交情深浅=肯掏多少
        if (want < 10) {
            return { success: false, msg: npc.name + ' 眼下手头紧（私账见底）——等 TA 的日子缓过来再开口。', data: { purse: purse } };
        }
        // 借出：私账正门扣（付不出几成借几成），玩家得真钱——钱从 TA 的钱包到你手上，不凭空。
        // （purse/pay 都传 npc 对象——同一次调用里人就在手上，不走 npcManager 二次点名）
        var paid = null;
        try { paid = (global.NPCLife.ledger.pay) ? global.NPCLife.ledger.pay(npc, want) : null; } catch (ePay2) {}
        var got = (paid && paid.paid) || 0;
        if (got <= 0) return { success: false, msg: npc.name + ' 搓着空钱袋：「这几日周转不开……」' };
        playerAddStones(got);
        var c = cfg();
        var borrowedAt = nowMinute();
        var rec = {
            id: makeRecordId(npc.id), kind: 'money', npcId: npc.id, npcName: npc.name,
            amount: got,
            borrowedAtGameMinute: borrowedAt,
            dueGameMinute: borrowedAt + c.durationDays * 1440,
            returned: false, overdue: false, deadbeated: false, collected: false
        };
        records.push(rec);
        if (typeof npc.changeFavor === 'function' && c.favorCost > 0) npc.changeFavor(-c.favorCost);
        if (typeof npc.recordPlayerAction === 'function') npc.recordPlayerAction('borrow_money', 'positive');
        return { success: true, msg: npc.name + ' 从钱袋里数出 ' + got + ' 枚灵石推给你：「说好了，' + c.durationDays + ' 日内。」（TA 的私账真扣了这笔——按时还，TA 的日子不受影响）', data: { borrowRecord: clone(rec) } };
    }

    function returnBorrowedMoney(recordId) {
        var rec = findRecord(recordId);
        if (!rec || rec.kind !== 'money') return { success: false, msg: '借钱记录不存在' };
        if (rec.returned) return { success: false, msg: '这笔钱已还清' };
        var owe = rec.amount + (rec.overdue ? Math.ceil(rec.amount * 0.1) : 0);   // 逾期补一成辛苦钱——他催过、等过
        if (playerStones() < owe) return { success: false, msg: '身上灵石不够（连本带一成要 ' + owe + ' 枚）——先去凑。' };
        playerAddStones(-owe);
        var npc = npcById(rec.npcId) || { id: rec.npcId, name: rec.npcName };
        try { if (global.NPCLife && global.NPCLife.ledger && typeof global.NPCLife.ledger.credit === 'function') global.NPCLife.ledger.credit(npc, owe); } catch (eCr) {}
        rec.returned = true;
        if (global.GameScheduler) global.GameScheduler.cancel('borrow_collect_' + rec.id);
        if (npc && typeof npc.changeAffection === 'function') npc.changeAffection(rec.overdue ? 2 : 4);   // 按时还+4；逾期还了也念你的好（+2）
        var faceLine = '';
        try { var _p16 = (global.NPCLife && global.NPCLife.ledger && global.NPCLife.ledger.purse && global.NPCLife.ledger.purse(npc)); if (_p16 !== null && _p16 <= 5) faceLine = ' TA 接过灵石，眼圈红了红——这笔钱 TA 等了太久。'; } catch (eP16) {}
        return { success: true, msg: '还给' + (npc ? npc.name : rec.npcName) + ' ' + owe + ' 枚灵石' + (rec.overdue ? '（含一成辛苦钱）' : '') + '。（好感' + (rec.overdue ? '+2' : '+4') + '）' + faceLine };
    }

    // 逾期七日，他的兄弟上门——穷途的人只剩这条找回体面的路（追讨不是恶，是 TA 的日子真过不下去了）
    function scheduleCollect(rec) {
        if (!global.GameScheduler || rec.returned || rec.deadbeated) return;
        global.GameScheduler.schedule('npc_borrow:collect', (Number(rec.overdueGameMinute) || rec.dueGameMinute) + 7 * 1440, { recordId: rec.id }, { id: 'borrow_collect_' + rec.id });
    }
    function collectDebt(recordId) {
        var rec = findRecord(recordId);
        if (!rec || rec.kind !== 'money' || rec.returned || rec.deadbeated) return true;
        if (rec.collected) { scheduleCollect(rec); return true; }   // 上一轮拖着没选——七日后再来
        rec.collected = true;
        var npc = npcById(rec.npcId);
        var name = (npc && npc.name) || rec.npcName || '对方';
        var owe = rec.amount + Math.ceil(rec.amount * 0.1);
        var body = '<p class="text-sm text-gray-300 mb-2">门口站着个膀大腰圆的汉子，抱着胳膊：「' + name + ' 家等你这笔钱等了半个月了。' + owe + ' 枚灵石，连本带一成辛苦钱——今儿给个话。」</p>' +
            '<p class="text-xs text-gray-500 mb-3">他身后巷口，' + name + ' 正当掉一件旧物换米——你借走的是 TA 的日子。</p>';
        var btn = 'class="w-full text-left p-3 rounded border border-gray-600 hover:border-amber-400 bg-gray-800/80 mb-2 text-sm"';
        body += '<button onclick="window.NPCBorrowService.settleCollect(\'' + rec.id + '\', \'pay\')" ' + btn.replace('p-3', 'bg-emerald-900 p-3') + '>💰 还钱（' + owe + ' 灵石——TA 等这笔钱过日子，好感+3）</button>';
        body += '<button onclick="window.NPCBorrowService.settleCollect(\'' + rec.id + '\', \'dodge\')" ' + btn + '>🚶 先躲一躲（七日后他还来——账不销，压力不涨）</button>';
        body += '<button onclick="window.NPCBorrowService.settleCollect(\'' + rec.id + '\', \'deadbeat\')" ' + btn.replace('p-3', 'bg-red-900/60 p-3') + '>😤 赖了（好感断崖-40——这城从此有人记得你的脸）</button>';
        try {
            if (typeof global.showBuildingEffectDialog === 'function') global.showBuildingEffectDialog('🔨 上门讨债（替' + name + '）', body);
            else if (typeof global.showMessage === 'function') global.showMessage('🔨 ' + name + ' 的兄弟上门讨' + owe + ' 灵石（含一成辛苦钱）——NPC 面板可还，或七日后他再来。', 'warning');
        } catch (eDlg16) { console.warn('[静默失败] js/npcs/npc-borrow-service.js · 讨债窗没弹出来（七日后再来）', eDlg16 && eDlg16.message); }
        return true;
    }
    function settleCollect(recordId, k) {
        var rec = findRecord(recordId);
        if (!rec || rec.kind !== 'money' || rec.returned || rec.deadbeated) return { success: false, msg: '这笔账已了结' };
        var npc = npcById(rec.npcId);
        var name = (npc && npc.name) || rec.npcName || '对方';
        if (k === 'pay') {
            var r = returnBorrowedMoney(recordId);
            if (r && r.success) {
                if (npc && typeof npc.changeAffection === 'function') npc.changeAffection(3);   // 讨债的场合还上了——他兄弟回去也是句好话
                if (typeof global.showMessage === 'function') global.showMessage('🔨 你把 ' + (rec.amount + Math.ceil(rec.amount * 0.1)) + ' 枚灵石拍在汉子手心。他数了数，冲巷口喊了句什么——' + name + ' 从当铺门口小跑着回来，眼里的东西没掉下来，但差不多。（好感+3）', 'success');
            } else if (typeof global.showMessage === 'function') global.showMessage((r && r.msg) || '灵石不够——七日后他再来。', 'warning');
            return r;
        }
        if (k === 'deadbeat') {
            rec.deadbeated = true;
            if (global.GameScheduler) global.GameScheduler.cancel('borrow_collect_' + rec.id);
            if (npc && typeof npc.changeAffection === 'function') npc.changeAffection(-40);
            // 耳语暗账（v27.15 ⑦新增-1）首写入：他兄弟的记性跟人走——这城有人认得你了
            try {
                var _city16 = '';
                try { if (typeof global.getCurrentCityName === 'function') _city16 = global.getCurrentCityName() || ''; } catch (eC16) {}
                if (!_city16 && global.currentCharData) _city16 = global.currentCharData.location || '';
                if (_city16 && global.WorldLedger && typeof global.WorldLedger.noteHeardOf === 'function') {
                    global.WorldLedger.noteHeardOf(_city16, _city16, 365);
                }
            } catch (eHd16) {}
            if (typeof global.showMessage === 'function') global.showMessage('😤 「行。」汉子没再说话，只把你的脸从头到脚看了一遍才走。从今往后，' + name + ' 见你绕道走（好感-40）——这条街上，有人记住了你这张脸。', 'danger');
            return { success: true, msg: '赖账了结' };
        }
        // dodge：账挂着，七日后再上门（不滚利息——世界不迁就玩家，但也不无限罚）
        scheduleCollect(rec);
        return { success: true, msg: '躲过了这一回——七日后他再来' };
    }

    api.borrowMoneyFromNPC = borrowMoneyFromNPC;
    api.returnBorrowedMoney = returnBorrowedMoney;
    api.settleCollect = settleCollect;
    if (global.GameScheduler) global.GameScheduler.registerHandler('npc_borrow:collect', function (payload) { return collectDebt(payload && payload.recordId); });
    if (global.StateRegistry) global.StateRegistry.register('borrowRecords', { version: 2, export: serialize, import: deserialize, reset: reset });
})(typeof window !== 'undefined' ? window : this);
