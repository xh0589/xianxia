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
        var cd = global.currentCharData || null;
        // v24.2 快照扩容（FIX_NOTES 第一百四十三批 ② 点名）：旧快照只收 slots/maxSlots/currency/charCurrency
        // 四项，qi/energy/health/contribution/discipleState/mood/karma/fame/lifeSkills 九字段落在快照外——
        // 事务中途出岔「灵石退了、精力不退」。扩容口径：
        // ① 只记「当时真有」的值（null=当时没有，restore 对它一个字不动，不凭空造值）；
        // ② discipleState 整本深拷、回写时逐键并回原对象——不换对象本体，各系统手里的引用不悬空。
        return {
            slots: inv && inv.slots ? inv.slots.map(slotSnapshot) : [],
            maxSlots: inv ? inv.maxSlots : 30,
            currency: inv && inv.currency ? clone(inv.currency) : { copper: 0, spiritStones: 0 },
            charCurrency: cd ? {
                copper: cd.copper,
                spiritStones: cd.spiritStones
            } : null,
            charState: cd ? {
                qi: cd.qi != null ? cd.qi : null,
                energy: cd.energy != null ? cd.energy : null,
                health: cd.health != null ? cd.health : null,
                mood: cd.mood != null ? cd.mood : null,
                karma: cd.karma != null ? cd.karma : null,
                fame: cd.fame != null ? cd.fame : null,
                lifeSkills: cd.lifeSkills ? clone(cd.lifeSkills) : null
            } : null,
            discipleState: global.discipleState ? clone(global.discipleState) : null
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
        // v24.2 快照扩容：只回写「capture 当时真记下的」（null 那一档一个字不动，不凭空造值）
        if (global.currentCharData && snapshot.charState) {
            var _cd = global.currentCharData, _cs = snapshot.charState;
            var _ks = ['qi', 'energy', 'health', 'mood', 'karma', 'fame'];
            for (var _ki = 0; _ki < _ks.length; _ki++) {
                if (_cs[_ks[_ki]] != null) _cd[_ks[_ki]] = _cs[_ks[_ki]];
            }
            if (_cs.lifeSkills) _cd.lifeSkills = clone(_cs.lifeSkills);
        }
        if (global.discipleState && snapshot.discipleState) {
            // 逐键并回原对象（保引用）：快照里没有的键＝事务里新冒出来的，回滚就该抹掉
            var _ds = global.discipleState, _snap = clone(snapshot.discipleState), _k;
            for (_k in _ds) {
                if (Object.prototype.hasOwnProperty.call(_ds, _k) && !Object.prototype.hasOwnProperty.call(_snap, _k)) delete _ds[_k];
            }
            for (_k in _snap) {
                if (Object.prototype.hasOwnProperty.call(_snap, _k)) _ds[_k] = _snap[_k];
            }
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
