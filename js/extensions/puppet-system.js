// ==================== puppet-system.js - 傀儡·玩家制造 (v19.8 P1-5) ====================
// 对标 v18.8 路线图 §4 P1-5：4 部件组装 8 类傀儡；4 类任务角色；制造/部署/召回循环。

(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    // ============== 1. 部件定义 ==============
    var PARTS = {
        core: [
            { id: 'pup_core_iron',   name: '铁芯', tier: 1, maxRealm: '练气', price: 100, durability: 200 },
            { id: 'pup_core_silver', name: '银芯', tier: 2, maxRealm: '筑基', price: 500, durability: 200 },
            { id: 'pup_core_gold',   name: '金芯', tier: 3, maxRealm: '金丹', price: 2000, durability: 200 },
            { id: 'pup_core_moon',   name: '月芯', tier: 4, maxRealm: '元婴', price: 8000, durability: 200 }
        ],
        body: [
            { id: 'pup_body_light',  name: '轻躯', tier: 1, hp: 100, defense: 5,  speed: 8, price: 80 },
            { id: 'pup_body_medium', name: '中躯', tier: 1, hp: 200, defense: 10, speed: 5, price: 120 },
            { id: 'pup_body_heavy',  name: '重躯', tier: 2, hp: 400, defense: 25, speed: 2, price: 200 }
        ],
        weapon: [
            { id: 'pup_weapon_sword',  name: '剑臂', tier: 1, attack: 15, skill: 'slash',  price: 80 },
            { id: 'pup_weapon_bow',    name: '弓臂', tier: 1, attack: 10, skill: 'ranged', price: 100 },
            { id: 'pup_weapon_shield', name: '盾臂', tier: 1, defense: 20, proc: 'reflect5', price: 100 },
            { id: 'pup_weapon_dual',   name: '双刃', tier: 2, attack: 20, speed: 2, price: 180 }
        ],
        pattern: [
            { id: 'pup_pattern_aggressive', name: '激进灵纹', role: 'combat',   price: 60 },
            { id: 'pup_pattern_defensive',  name: '守卫灵纹', role: 'guard',    price: 60 },
            { id: 'pup_pattern_harvest',   name: '采集灵纹', role: 'harvest',  price: 60 },
            { id: 'pup_pattern_transport', name: '运输灵纹', role: 'transport',price: 60 }
        ]
    };

    // ============== 2. 傀儡成品（8 类） ==============
    var PUPPETS = [
        { id: 'pup_warrior_basic',    name: '铁甲战斗傀儡', parts: { core: 'pup_core_iron',   body: 'pup_body_medium', weapon: 'pup_weapon_sword',  pattern: 'pup_pattern_aggressive' }, cost: 50,  maxDurability: 200, qiCostPerDay: 5, role: 'combat' },
        { id: 'pup_warrior_advanced', name: '银刃战斗傀儡', parts: { core: 'pup_core_silver', body: 'pup_body_medium', weapon: 'pup_weapon_dual',   pattern: 'pup_pattern_aggressive' }, cost: 200, maxDurability: 200, qiCostPerDay: 8, role: 'combat' },
        { id: 'pup_guard_heavy',      name: '银盾守卫傀儡', parts: { core: 'pup_core_silver', body: 'pup_body_heavy',  weapon: 'pup_weapon_shield', pattern: 'pup_pattern_defensive' },  cost: 250, maxDurability: 300, qiCostPerDay: 6, role: 'guard' },
        { id: 'pup_guard_elite',      name: '金盾守卫傀儡', parts: { core: 'pup_core_gold',   body: 'pup_body_heavy',  weapon: 'pup_weapon_sword',  pattern: 'pup_pattern_defensive' },  cost: 600, maxDurability: 300, qiCostPerDay: 10, role: 'guard' },
        { id: 'pup_harvester_basic',  name: '铁甲采集傀儡', parts: { core: 'pup_core_iron',   body: 'pup_body_light',  weapon: 'pup_weapon_sword',  pattern: 'pup_pattern_harvest' },    cost: 80,  maxDurability: 200, qiCostPerDay: 4, role: 'harvest' },
        { id: 'pup_harvester_advanced',name:'银弓采集傀儡',parts: { core: 'pup_core_silver', body: 'pup_body_light',  weapon: 'pup_weapon_bow',    pattern: 'pup_pattern_harvest' },    cost: 300, maxDurability: 200, qiCostPerDay: 6, role: 'harvest' },
        { id: 'pup_transport_basic',  name: '铁甲运输傀儡', parts: { core: 'pup_core_iron',   body: 'pup_body_medium', weapon: 'pup_weapon_shield', pattern: 'pup_pattern_transport' },  cost: 100, maxDurability: 200, qiCostPerDay: 4, role: 'transport' },
        { id: 'pup_transport_advanced',name:'金弓运输傀儡',parts: { core: 'pup_core_gold',   body: 'pup_body_medium', weapon: 'pup_weapon_bow',    pattern: 'pup_pattern_transport' },  cost: 500, maxDurability: 200, qiCostPerDay: 7, role: 'transport' }
    ];

    // ============== 3. 部件注册到 itemById ==============
    function registerItems() {
        if (!window.itemById) window.itemById = {};
        Object.keys(PARTS).forEach(function (cat) {
            PARTS[cat].forEach(function (p) {
                var quality = p.tier >= 3 ? 'EPIC' : (p.tier === 2 ? 'RARE' : 'UNCOMMON');
                window.itemById[p.id] = {
                    id: p.id, name: p.name, type: 'consumable', subtype: 'puppet_part',
                    category: 'consumable', quality: quality, level: p.tier * 5, price: p.price,
                    stackable: true, maxStack: 10, desc: '傀儡部件：' + cat, icon: '🔧',
                    implemented: true, _partCategory: cat, _partTier: p.tier
                };
            });
        });
    }
    registerItems();

    // ============== 4. 模块级状态 ==============
    var _state = {
        puppets: [],          // {id, type, parts, durability, deployed, role, deployedDay, totalYield}
        nextInstanceId: 1,
        spiritStones: 1000
    };

    // ============== 5. 工具 ==============
    function getPart(category, id) {
        var arr = PARTS[category];
        if (!arr) return null;
        for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i];
        return null;
    }

    function getPuppetTemplate(id) {
        for (var i = 0; i < PUPPETS.length; i++) if (PUPPETS[i].id === id) return PUPPETS[i];
        return null;
    }

    function checkMaterials(puppetId) {
        var t = getPuppetTemplate(puppetId);
        if (!t) return { ok: false, missing: [{ itemId: 'unknown', need: 0, have: 0 }] };
        var parts = t.parts;
        var need = [
            { itemId: parts.core, count: 1 },
            { itemId: parts.body, count: 1 },
            { itemId: parts.weapon, count: 1 },
            { itemId: parts.pattern, count: 1 }
        ];
        var found = {};
        if (window.inventory && window.inventory.slots) {
            for (var j = 0; j < window.inventory.slots.length; j++) {
                var s = window.inventory.slots[j];
                if (!s || !s.itemId) continue;
                found[s.itemId] = (found[s.itemId] || 0) + (s.count || 1);
            }
        }
        var missing = [];
        for (var k = 0; k < need.length; k++) {
            if ((found[need[k].itemId] || 0) < need[k].count) missing.push({ itemId: need[k].itemId, need: need[k].count, have: found[need[k].itemId] || 0 });
        }
        return { ok: missing.length === 0, missing: missing, need: need };
    }

    function consumeMaterials(puppetId) {
        var c = checkMaterials(puppetId);
        if (!c.ok) return false;
        var t = getPuppetTemplate(puppetId);
        var ids = [t.parts.core, t.parts.body, t.parts.weapon, t.parts.pattern];
        if (!window.inventory || !window.inventory.slots) return false;
        for (var i = 0; i < ids.length; i++) {
            var id = ids[i];
            for (var j = 0; j < window.inventory.slots.length; j++) {
                var s = window.inventory.slots[j];
                if (!s || !s.itemId) continue;
                if (s.itemId === id) {
                    s.count = (s.count || 1) - 1;
                    if (s.count <= 0) { s.itemId = null; s.count = 0; }
                    break;
                }
            }
        }
        return true;
    }

    // 计算傀儡综合战力
    function computeCombatPower(t) {
        var core = getPart('core', t.parts.core);
        var body = getPart('body', t.parts.body);
        var weapon = getPart('weapon', t.parts.weapon);
        return (core ? core.tier * 10 : 0) + (body ? body.defense : 0) + (weapon ? (weapon.attack || 0) : 0);
    }

    // ============== 6. 公开 API ==============
    function craft(puppetId) {
        var t = getPuppetTemplate(puppetId);
        if (!t) return { ok: false, reason: 'puppet-not-found' };
        var m = checkMaterials(puppetId);
        if (!m.ok) return { ok: false, reason: 'materials-missing', missing: m.missing };
        if (_state.spiritStones < t.cost) return { ok: false, reason: 'spiritStones-low', need: t.cost, have: _state.spiritStones };
        if (!consumeMaterials(puppetId)) return { ok: false, reason: 'consume-failed' };
        _state.spiritStones -= t.cost;
        var instanceId = 'pup_inst_' + (_state.nextInstanceId++);
        var inst = {
            id: instanceId,
            type: puppetId,
            name: t.name,
            parts: Object.assign({}, t.parts),
            durability: t.maxDurability,
            maxDurability: t.maxDurability,
            deployed: false,
            role: t.role,
            deployedDay: 0,
            totalYield: { spiritStones: 0, materials: 0 },
            combatPower: computeCombatPower(t),
            qiCostPerDay: t.qiCostPerDay
        };
        _state.puppets.push(inst);
        if (window.EventBus) window.EventBus.emit('puppet:craft', { instanceId: instanceId, type: puppetId, name: t.name, combatPower: inst.combatPower });
        return { ok: true, instanceId: instanceId, puppet: inst };
    }

    function getPuppet(instanceId) {
        for (var i = 0; i < _state.puppets.length; i++) if (_state.puppets[i].id === instanceId) return _state.puppets[i];
        return null;
    }

    function deploy(instanceId, opts) {
        opts = opts || {};
        var inst = getPuppet(instanceId);
        if (!inst) return { ok: false, reason: 'puppet-not-found' };
        if (inst.deployed) return { ok: false, reason: 'already-deployed', role: inst.role };
        if (inst.durability <= 0) return { ok: false, reason: 'durability-out' };
        inst.deployed = true;
        inst.role = opts.role || inst.role;
        inst.deployedDay = (window.WorldCalendar && window.WorldCalendar.day) || 0;
        inst.location = opts.location || ('洞府');
        if (window.EventBus) window.EventBus.emit('puppet:deploy', { instanceId: instanceId, role: inst.role, location: inst.location });
        return { ok: true, role: inst.role, location: inst.location, startedDay: inst.deployedDay };
    }

    function recall(instanceId) {
        var inst = getPuppet(instanceId);
        if (!inst) return { ok: false, reason: 'puppet-not-found' };
        if (!inst.deployed) return { ok: false, reason: 'not-deployed' };
        inst.deployed = false;
        if (window.EventBus) window.EventBus.emit('puppet:recall', { instanceId: instanceId, totalYield: inst.totalYield });
        return { ok: true, yield: Object.assign({}, inst.totalYield) };
    }

    function repair(instanceId) {
        var inst = getPuppet(instanceId);
        if (!inst) return { ok: false, reason: 'puppet-not-found' };
        var need = (inst.maxDurability - inst.durability) * 1; // 1 灵石/耐久
        if (_state.spiritStones < need) return { ok: false, reason: 'spiritStones-low', need: need, have: _state.spiritStones };
        _state.spiritStones -= need;
        inst.durability = inst.maxDurability;
        return { ok: true, durability: inst.durability, cost: need };
    }

    function tickDay() {
        var today = (window.WorldCalendar && window.WorldCalendar.day) || 0;
        var consumed = 0;
        var decayed = [];
        for (var i = 0; i < _state.puppets.length; i++) {
            var inst = _state.puppets[i];
            if (!inst.deployed) continue;
            // 扣灵石
            if (_state.spiritStones < inst.qiCostPerDay) {
                // 灵石不足 → 自动召回
                inst.deployed = false;
                if (window.EventBus) window.EventBus.emit('puppet:recall', { instanceId: inst.id, reason: 'spiritStones-low' });
                continue;
            }
            _state.spiritStones -= inst.qiCostPerDay;
            consumed += inst.qiCostPerDay;
            // 耐久 -1 (combat/guard 减 2)
            var decay = (inst.role === 'combat' || inst.role === 'guard') ? 2 : 1;
            inst.durability -= decay;
            // 累计收益
            if (inst.role === 'harvest') inst.totalYield.materials += 1;
            if (inst.role === 'transport') inst.totalYield.spiritStones += 1;
            if (inst.role === 'guard') inst.totalYield.spiritStones += 1; // 守卫贡献
            if (inst.durability <= 0) {
                inst.deployed = false;
                decayed.push(inst.id);
                if (window.EventBus) window.EventBus.emit('puppet:decay', { instanceId: inst.id, role: inst.role });
            }
        }
        return { ok: true, consumed: consumed, decayed: decayed, day: today };
    }

    // ============== 7. StateRegistry ==============
    function _exportState() { return JSON.parse(JSON.stringify(_state)); }
    function _importState(s) {
        if (!s) return;
        if (Array.isArray(s.puppets)) _state.puppets = s.puppets;
        _state.nextInstanceId = s.nextInstanceId || 1;
        _state.spiritStones = s.spiritStones || 0;
    }
    function _resetState() {
        _state.puppets = [];
        _state.nextInstanceId = 1;
        _state.spiritStones = 1000;
    }

    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        try {
            window.StateRegistry.register('puppetConfig', { version: 1, export: _exportState, import: _importState, reset: _resetState });
        } catch (e) {}
    }

    // ============== 8. 导出 ==============
    window.PuppetSystem = {
        PARTS: PARTS,
        PUPPETS: PUPPETS,
        craft: craft,
        getPuppet: getPuppet,
        deploy: deploy,
        recall: recall,
        repair: repair,
        tickDay: tickDay,
        getRequiredMaterials: function (id) { var c = checkMaterials(id); return c.need || []; },
        getPuppetTemplate: getPuppetTemplate,
        getState: function () { return _state; },
        setSpiritStones: function (n) { _state.spiritStones = n; },
        _shenjimenDiscount: 0 // 0..0.2 (神机门预留折扣接口)
    };
    if (window.XianXia) window.XianXia.PuppetSystem = window.PuppetSystem;
    try { console.log('[PuppetSystem] initialized v1 (' + Object.keys(PARTS).reduce(function (a, k) { return a + PARTS[k].length; }, 0) + ' parts, ' + PUPPETS.length + ' puppets)'); } catch (e) {}
})();
