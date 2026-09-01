// ==================== formation-system.js - 阵法·布阵循环 (v19.7 P1-4) ====================
// 对标 v18.8 路线图 §4 P1-4：让"阵法"从文本/参悟变成有"布阵"这一核心动作的玩法。
// 4 类随身战阵 + 4 类洞府/宗门阵；阵旗耐久 + 灵石维持；StateRegistry v1 + 事件总线。

(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    // ============== 1. 阵碑（基础材料 8 张） ==============
    var FORMATION_STONES = [
        { id: 'fmt_stone_basic',   name: '基础阵石', type: 'stone',  tier: 1, desc: '所有布阵的基础消耗' },
        { id: 'fmt_flag_iron',     name: '铁阵旗',   type: 'flag',   tier: 1, desc: '基础阵旗' },
        { id: 'fmt_flag_gold',     name: '金阵旗',   type: 'flag',   tier: 2, desc: '强化阵旗（高级阵消耗）' },
        { id: 'fmt_eye_spirit',    name: '灵阵眼',   type: 'eye',    tier: 2, desc: '灵气聚焦' },
        { id: 'fmt_eye_void',      name: '虚阵眼',   type: 'eye',    tier: 2, desc: '虚实转化（困灵阵核心）' },
        { id: 'fmt_core_5e',       name: '五行阵心', type: 'core',   tier: 3, desc: '五行循环核心' },
        { id: 'fmt_core_dipper',   name: '北斗阵心', type: 'core',   tier: 3, desc: '北斗星图核心' },
        { id: 'fmt_core_soul',     name: '困灵阵心', type: 'core',   tier: 3, desc: '禁锢神魂核心' }
    ];

    // ============== 2. 阵法定义（8 张） ==============
    var FORMATIONS = [
        // 随身战阵
        {
            id: 'fmt_three_talent', name: '三才阵', type: 'combat', tier: 1, desc: '天/地/人三才合一',
            materials: [{ itemId: 'fmt_stone_basic', count: 3 }, { itemId: 'fmt_flag_iron', count: 3 }],
            spiritStonesPerTurn: 3, maxDurability: 10,
            buff: { attackPct: 10, defensePct: 10, speedPct: 5 }
        },
        {
            id: 'fmt_five_element', name: '五行阵', type: 'combat', tier: 2, desc: '五行相生相克',
            materials: [{ itemId: 'fmt_stone_basic', count: 5 }, { itemId: 'fmt_core_5e', count: 1 }, { itemId: 'fmt_flag_iron', count: 3 }],
            spiritStonesPerTurn: 5, maxDurability: 8,
            buff: { mainElementBoostPct: 25 } // 按玩家主灵根
        },
        {
            id: 'fmt_dipper', name: '北斗阵', type: 'combat', tier: 2, desc: '北斗七曜 暴击加成',
            materials: [{ itemId: 'fmt_stone_basic', count: 4 }, { itemId: 'fmt_core_dipper', count: 1 }, { itemId: 'fmt_flag_gold', count: 1 }],
            spiritStonesPerTurn: 4, maxDurability: 8,
            buff: { critPct: 15 }
        },
        {
            id: 'fmt_bind_spirit', name: '困灵阵', type: 'combat', tier: 3, desc: '困敌神魂',
            materials: [{ itemId: 'fmt_stone_basic', count: 5 }, { itemId: 'fmt_core_soul', count: 1 }, { itemId: 'fmt_eye_void', count: 1 }],
            spiritStonesPerTurn: 6, maxDurability: 6,
            buff: { enemySpeedPct: -30, enemyHitPct: -10 }
        },
        // 洞府/宗门阵
        {
            id: 'fmt_spirit_gather', name: '聚灵阵', type: 'field', tier: 2, desc: '汇聚天地灵气',
            materials: [{ itemId: 'fmt_stone_basic', count: 8 }, { itemId: 'fmt_eye_spirit', count: 1 }, { itemId: 'fmt_flag_iron', count: 4 }],
            spiritStonesPerTurn: 5, maxDurability: 30,
            buff: { expBoostPct: 30 }
        },
        {
            id: 'fmt_mountain_guard', name: '护山阵', type: 'sect', tier: 3, desc: '护山 降低被袭',
            materials: [{ itemId: 'fmt_stone_basic', count: 10 }, { itemId: 'fmt_flag_gold', count: 4 }, { itemId: 'fmt_eye_spirit', count: 1 }],
            spiritStonesPerTurn: 8, maxDurability: 30,
            buff: { sectAttackReducePct: 50 }
        },
        {
            id: 'fmt_labyrinth', name: '迷踪阵', type: 'sect', tier: 2, desc: '迷踪 降低被寻仇',
            materials: [{ itemId: 'fmt_stone_basic', count: 6 }, { itemId: 'fmt_eye_void', count: 2 }, { itemId: 'fmt_flag_iron', count: 3 }],
            spiritStonesPerTurn: 6, maxDurability: 30,
            buff: { sectGrudgeReducePct: 30 }
        },
        {
            id: 'fmt_nurture', name: '育灵阵', type: 'field', tier: 2, desc: '灵田作物加速',
            materials: [{ itemId: 'fmt_stone_basic', count: 6 }, { itemId: 'fmt_eye_spirit', count: 1 }, { itemId: 'fmt_flag_iron', count: 2 }],
            spiritStonesPerTurn: 4, maxDurability: 30,
            buff: { fieldSpeedPct: 30 }
        }
    ];

    // ============== 3. 物品注册（8 张阵碑 + 8 张阵法核心也作为物品） ==============
    function registerItems() {
        if (!window.itemById) window.itemById = {};
        for (var i = 0; i < FORMATION_STONES.length; i++) {
            var s = FORMATION_STONES[i];
            window.itemById[s.id] = {
                id: s.id, name: s.name, type: 'consumable', subtype: 'formation_stone',
                category: 'consumable', quality: s.tier === 3 ? 'EPIC' : (s.tier === 2 ? 'RARE' : 'UNCOMMON'),
                level: s.tier * 3, price: s.tier * 50, stackable: true, maxStack: 99,
                desc: s.desc, icon: '🔯', implemented: true, _stoneType: s.type
            };
        }
    }
    registerItems();

    // ============== 4. 模块级状态 ==============
    var _state = {
        // 战斗：每个玩家 1 个（简化：只 1 个）
        combat: { formationId: null, deployedDay: 0, durability: 0 },
        // 洞府：每个洞府 1 个阵
        field: { formationId: null, deployedDay: 0, durability: 0 },
        // 宗门：每个宗门 1 个阵
        sect: { formationId: null, deployedDay: 0, durability: 0 },
        // 历史
        history: [],
        // 玩家灵石（运行时缓存）
        spiritStones: 1000
    };

    // ============== 5. 工具 ==============

    function getFormation(id) {
        for (var i = 0; i < FORMATIONS.length; i++) if (FORMATIONS[i].id === id) return FORMATIONS[i];
        return null;
    }

    function getStateSlot(type) {
        if (type === 'combat') return _state.combat;
        if (type === 'field') return _state.field;
        if (type === 'sect') return _state.sect;
        return null;
    }

    function checkMaterials(materials) {
        if (!window.inventory || !window.inventory.slots) return { ok: true, missing: [] };
        var counts = {};
        for (var i = 0; i < materials.length; i++) {
            counts[materials[i].itemId] = (counts[materials[i].itemId] || 0) + materials[i].count;
        }
        var missing = [];
        var found = {};
        for (var j = 0; j < window.inventory.slots.length; j++) {
            var s = window.inventory.slots[j];
            if (!s || !s.itemId) continue;
            if (counts[s.itemId]) {
                found[s.itemId] = (found[s.itemId] || 0) + (s.count || 1);
            }
        }
        for (var needId in counts) {
            if ((found[needId] || 0) < counts[needId]) missing.push({ itemId: needId, need: counts[needId], have: found[needId] || 0 });
        }
        return { ok: missing.length === 0, missing: missing };
    }

    function consumeMaterials(materials) {
        if (!window.inventory || !window.inventory.slots) return false;
        var counts = {};
        for (var i = 0; i < materials.length; i++) {
            counts[materials[i].itemId] = (counts[materials[i].itemId] || 0) + materials[i].count;
        }
        for (var j = 0; j < window.inventory.slots.length && Object.keys(counts).length > 0; j++) {
            var s = window.inventory.slots[j];
            if (!s || !s.itemId) continue;
            var key = s.itemId;
            if (counts[key]) {
                var take = Math.min(s.count || 1, counts[key]);
                counts[key] -= take;
                s.count = (s.count || 1) - take;
                if (s.count <= 0) { s.itemId = null; s.count = 0; }
                if (counts[key] <= 0) delete counts[key];
            }
        }
        return Object.keys(counts).length === 0;
    }

    // ============== 6. 公开 API ==============

    function deployFormation(formationId, opts) {
        opts = opts || {};
        var f = getFormation(formationId);
        if (!f) return { ok: false, reason: 'formation-not-found' };
        var slot = getStateSlot(f.type);
        if (!slot) return { ok: false, reason: 'invalid-type' };
        if (slot.formationId) return { ok: false, reason: 'slot-busy', current: slot.formationId };
        // 材料
        var m = checkMaterials(f.materials);
        if (!m.ok) return { ok: false, reason: 'materials-missing', missing: m.missing };
        // 灵石（首期 1 回合）
        if (_state.spiritStones < f.spiritStonesPerTurn) return { ok: false, reason: 'spiritStones-low', need: f.spiritStonesPerTurn, have: _state.spiritStones };
        // 消耗
        if (!consumeMaterials(f.materials)) return { ok: false, reason: 'consume-failed' };
        _state.spiritStones -= f.spiritStonesPerTurn;
        var today = (window.WorldCalendar && window.WorldCalendar.day) || 0;
        slot.formationId = formationId;
        slot.deployedDay = today;
        slot.durability = f.maxDurability;
        // 历史
        _state.history.unshift({ formationId: formationId, type: f.type, day: today, action: 'deploy' });
        if (_state.history.length > 10) _state.history.pop();
        // 事件
        if (window.EventBus) window.EventBus.emit('formation:deploy', { formationId: formationId, type: f.type, day: today });
        return { ok: true, formationId: formationId, durability: slot.durability, expireDay: today + f.maxDurability };
    }

    function withdrawFormation(formationId) {
        var f = getFormation(formationId);
        if (!f) return { ok: false, reason: 'formation-not-found' };
        var slot = getStateSlot(f.type);
        if (!slot) return { ok: false, reason: 'invalid-type' };
        if (slot.formationId !== formationId) return { ok: false, reason: 'not-active' };
        var today = (window.WorldCalendar && window.WorldCalendar.day) || 0;
        var wasId = slot.formationId;
        slot.formationId = null;
        slot.durability = 0;
        slot.deployedDay = 0;
        _state.history.unshift({ formationId: wasId, type: f.type, day: today, action: 'withdraw' });
        if (_state.history.length > 10) _state.history.pop();
        if (window.EventBus) window.EventBus.emit('formation:withdraw', { formationId: wasId, type: f.type, day: today });
        return { ok: true };
    }

    function tickTurn() {
        var today = (window.WorldCalendar && window.WorldCalendar.day) || 0;
        var collapsed = [];
        var consumedStones = 0;
        ['combat', 'field', 'sect'].forEach(function (type) {
            var slot = getStateSlot(type);
            if (!slot || !slot.formationId) return;
            var f = getFormation(slot.formationId);
            if (!f) return;
            // 灵石
            if (_state.spiritStones < f.spiritStonesPerTurn) {
                // 灵石不足 → 阵崩溃
                collapsed.push(slot.formationId);
                if (window.EventBus) window.EventBus.emit('formation:collapse', { formationId: slot.formationId, type: type, reason: 'spiritStones-low' });
                slot.formationId = null;
                slot.durability = 0;
                return;
            }
            _state.spiritStones -= f.spiritStonesPerTurn;
            consumedStones += f.spiritStonesPerTurn;
            // 耐久
            slot.durability -= 1;
            if (slot.durability <= 0) {
                collapsed.push(slot.formationId);
                if (window.EventBus) window.EventBus.emit('formation:collapse', { formationId: slot.formationId, type: type, reason: 'durability-out' });
                slot.formationId = null;
                slot.durability = 0;
            }
        });
        return { ok: true, consumed: consumedStones, collapsed: collapsed, day: today };
    }

    function getActiveFormation(type) {
        var slot = getStateSlot(type);
        if (!slot || !slot.formationId) return null;
        return getFormation(slot.formationId);
    }

    function getBuff(type, attrKey) {
        var f = getActiveFormation(type);
        if (!f || !f.buff) return 0;
        return f.buff[attrKey] || 0;
    }

    function hasBuff(type, attrKey) {
        return getBuff(type, attrKey) !== 0;
    }

    // ============== 7. StateRegistry ==============
    function _exportState() { return JSON.parse(JSON.stringify(_state)); }
    function _importState(s) {
        if (!s) return;
        if (s.combat) _state.combat = s.combat;
        if (s.field) _state.field = s.field;
        if (s.sect) _state.sect = s.sect;
        if (Array.isArray(s.history)) _state.history = s.history.slice(0, 10);
        _state.spiritStones = s.spiritStones || 0;
    }
    function _resetState() {
        _state.combat = { formationId: null, deployedDay: 0, durability: 0 };
        _state.field = { formationId: null, deployedDay: 0, durability: 0 };
        _state.sect = { formationId: null, deployedDay: 0, durability: 0 };
        _state.history = [];
        _state.spiritStones = 1000;
    }

    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        try {
            window.StateRegistry.register('formationConfig', { version: 1, export: _exportState, import: _importState, reset: _resetState });
        } catch (e) {}
    }

    // ============== 8. 导出 ==============
    window.FormationSystem = {
        FORMATION_STONES: FORMATION_STONES,
        FORMATIONS: FORMATIONS,
        deployFormation: deployFormation,
        withdrawFormation: withdrawFormation,
        tickTurn: tickTurn,
        getActiveFormation: getActiveFormation,
        getBuff: getBuff,
        hasBuff: hasBuff,
        getState: function () { return _state; },
        getFormation: getFormation,
        listFormations: function (type) { return type ? FORMATIONS.filter(function (f) { return f.type === type; }) : FORMATIONS.slice(); },
        setSpiritStones: function (n) { _state.spiritStones = n; }
    };
    if (window.XianXia) window.XianXia.FormationSystem = window.FormationSystem;
    try { console.log('[FormationSystem] initialized v1 (' + FORMATION_STONES.length + ' stones, ' + FORMATIONS.length + ' formations)'); } catch (e) {}
})();
