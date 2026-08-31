/**
 * economy-transaction.js — 原子经济事务
 * 用完整背包+货币快照提供轻量 rollback，优先保证单机存档正确性。
 */
(function (global) {
    'use strict';

    function clone(v) {
        if (v == null) return v;
        return JSON.parse(JSON.stringify(v));
    }

    function slotSnapshot(slot) {
        if (!slot) return null;
        if (typeof slot.toJSON === 'function') {
            try { return slot.toJSON(); } catch (e) {}
        }
        return {
            uid: slot.uid,
            templateId: slot.templateId || slot.id,
            count: slot.count != null ? slot.count : 1,
            durability: slot.durability,
            customProps: clone(slot.customProps || {}),
            markedForSale: !!slot.markedForSale
        };
    }

    function capture() {
        var inv = global.inventory;
        return {
            slots: inv && inv.slots ? inv.slots.map(slotSnapshot) : [],
            maxSlots: inv ? inv.maxSlots : 30,
            currency: inv && inv.currency ? clone(inv.currency) : { copper: 0, spiritStones: 0 },
            charCurrency: global.currentCharData ? {
                copper: global.currentCharData.copper,
                spiritStones: global.currentCharData.spiritStones
            } : null
        };
    }

    function makeInstance(s) {
        if (!s) return null;
        if (typeof global.ItemInstance === 'function') {
            var inst = new global.ItemInstance(s.templateId, s.count);
            if (s.uid) inst.uid = s.uid;
            if (s.durability != null) inst.durability = s.durability;
            inst.customProps = clone(s.customProps || {});
            inst.markedForSale = !!s.markedForSale;
            return inst;
        }
        return clone(s);
    }

    function restore(snapshot) {
        var inv = global.inventory;
        if (!inv || !snapshot) return;
        inv.maxSlots = snapshot.maxSlots || inv.maxSlots || 30;
        inv.slots = (snapshot.slots || []).map(makeInstance);
        while (inv.slots.length < inv.maxSlots) inv.slots.push(null);
        inv.currency = clone(snapshot.currency || { copper: 0, spiritStones: 0 });
        if (global.currentCharData && snapshot.charCurrency) {
            global.currentCharData.copper = snapshot.charCurrency.copper != null ? snapshot.charCurrency.copper : inv.currency.copper;
            global.currentCharData.spiritStones = snapshot.charCurrency.spiritStones != null ? snapshot.charCurrency.spiritStones : inv.currency.spiritStones;
        }
        if (typeof global.updateInventoryUI === 'function') global.updateInventoryUI();
        if (typeof global.updateCurrencyUI === 'function') global.updateCurrencyUI();
    }

    function run(work) {
        var snapshot = capture();
        try {
            var result = work(snapshot);
            if (result === false || (result && result.success === false)) {
                restore(snapshot);
                return result || false;
            }
            return result == null ? true : result;
        } catch (e) {
            restore(snapshot);
            console.error('[EconomyTransaction] rollback:', e);
            return { success: false, error: e };
        }
    }

    function getBalance(currency) {
        var inv = global.inventory;
        return inv && inv.currency ? Number(inv.currency[currency]) || 0 : 0;
    }

    function debit(currency, amount) {
        amount = Math.max(0, Math.floor(Number(amount) || 0));
        if (!global.inventory || !global.inventory.currency) return false;
        if (getBalance(currency) < amount) return false;
        global.inventory.currency[currency] = getBalance(currency) - amount;
        if (global.currentCharData) global.currentCharData[currency] = global.inventory.currency[currency];
        return true;
    }

    function credit(currency, amount) {
        amount = Math.max(0, Math.floor(Number(amount) || 0));
        if (!global.inventory || !global.inventory.currency) return false;
        global.inventory.currency[currency] = getBalance(currency) + amount;
        if (global.currentCharData) global.currentCharData[currency] = global.inventory.currency[currency];
        return true;
    }

    function removeByUid(uid, quantity) {
        quantity = Math.max(1, Math.floor(Number(quantity) || 1));
        if (!global.inventory || !global.inventory.slots) return null;
        for (var i = 0; i < global.inventory.slots.length; i++) {
            var slot = global.inventory.slots[i];
            if (!slot || slot.uid !== uid || (slot.count || 0) < quantity) continue;
            var snap = slotSnapshot(slot);
            snap.count = quantity;
            slot.count -= quantity;
            if (slot.count <= 0) global.inventory.slots[i] = null;
            return snap;
        }
        return null;
    }

    function removeByTemplate(templateId, quantity) {
        quantity = Math.max(1, Math.floor(Number(quantity) || 1));
        if (!global.inventory || !Array.isArray(global.inventory.slots)) return false;
        var available = 0;
        global.inventory.slots.forEach(function(slot) {
            if (slot && (slot.templateId || slot.id) === templateId) available += Number(slot.count) || 1;
        });
        if (available < quantity) return false;
        var remaining = quantity;
        for (var i = 0; i < global.inventory.slots.length && remaining > 0; i++) {
            var slot = global.inventory.slots[i];
            if (!slot || (slot.templateId || slot.id) !== templateId) continue;
            var count = Number(slot.count) || 1;
            var take = Math.min(count, remaining);
            slot.count = count - take;
            remaining -= take;
            if (slot.count <= 0) global.inventory.slots[i] = null;
        }
        return remaining === 0;
    }

    function addSnapshot(snapshot) {
        if (!snapshot) return false;
        // 对带有定制属性/耐久的实例，优先使用已有恢复器。
        if (typeof global.restoreItemFromSnapshot === 'function') {
            try {
                var ok = global.restoreItemFromSnapshot(clone(snapshot));
                if (ok) return true;
            } catch (e) {}
        }
        if (typeof global.addItem === 'function') return !!global.addItem(snapshot.templateId, snapshot.count || 1);
        return false;
    }

    var api = { capture: capture, restore: restore, run: run, getBalance: getBalance, debit: debit, credit: credit, removeByUid: removeByUid, removeByTemplate: removeByTemplate, addSnapshot: addSnapshot, slotSnapshot: slotSnapshot };
    global.EconomyTransaction = api;
    global.XianXia = global.XianXia || {};
    global.XianXia.EconomyTransaction = api;
})(typeof window !== 'undefined' ? window : this);
