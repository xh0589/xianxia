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
    if (global.StateRegistry) global.StateRegistry.register('borrowRecords', { version: 2, export: serialize, import: deserialize, reset: reset });
})(typeof window !== 'undefined' ? window : this);
