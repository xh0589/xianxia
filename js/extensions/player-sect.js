// ==================== player-sect.js - 玩家创宗 (v19.18) ====================
// 路线图 §13 第二阶段"掌门"完成：3 资源决策（扩张/内政/备战）。

(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    // ============== 1. 配置 ==============
    var RESOURCE_TYPES = ['spiritStones', 'disciples', 'reputation', 'elixir', 'weapon'];
    var POSITIONS = ['掌门', '长老', '堂主', '弟子'];
    var POSITION_SLOTS = { '掌门': 1, '长老': 3, '堂主': 5, '弟子': 50 };
    var POLICIES = ['expand', 'internal', 'militarize'];
    var POLICY_DESC = {
        expand: '扩张：弟子招募 +1/天，消耗 ×1.5',
        internal: '内政：资源生产 +30%',
        militarize: '备战：武器生产 ×2，弟子流失 +0.5/天'
    };

    // ============== 2. 模块级状态 ==============
    var _state = {
        sects: {}  // {sectId: instance}
    };

    function _today() { return (window.WorldCalendar && window.WorldCalendar.day) || 0; }
    function _emit(name, payload) {
        var bus = null;
        if (typeof window !== 'undefined' && window.EventBus) bus = window.EventBus;
        else if (typeof globalThis !== 'undefined' && globalThis.EventBus) bus = globalThis.EventBus;
        if (bus && typeof bus.emit === 'function') bus.emit(name, payload);
    }

    function _newInstance(opts) {
        var id = 'psect_' + (opts.founder || 'player') + '_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        return {
            id: id,
            name: opts.name,
            alignment: opts.alignment || '中立',
            location: opts.location || '未知',
            founder: opts.founder || 'player',
            createdDay: _today(),
            resources: {
                spiritStones: 100,
                disciples: 0,
                reputation: 10,
                elixir: 0,
                weapon: 0
            },
            disciples: [],  // [{npcId, joinedDay, position}]
            production: {
                spiritStones: 5,
                reputation: 0.1,
                elixir: 1,
                weapon: 1
            },
            consumption: {
                spiritStones: 1
            },
            policy: 'internal',
            rank: 1,
            history: []
        };
    }

    // ============== 3. 创宗 / 解散 / 改名 ==============
    function create(opts) {
        if (!opts || !opts.name) return { ok: false, reason: 'no-name' };
        var inst = _newInstance(opts);
        _state.sects[inst.id] = inst;
        if (window.EventBus) _emit('playerSect:created', { sect: inst });
        return { ok: true, sectId: inst.id, instance: inst };
    }

    function dissolve(sectId) {
        var s = _state.sects[sectId];
        if (!s) return { ok: false, reason: 'not-found' };
        var transfers = s.disciples.length;
        delete _state.sects[sectId];
        if (window.EventBus) _emit('playerSect:dissolved', { sectId: sectId, transferred: transfers });
        return { ok: true, reason: 'dissolved', transfers: transfers };
    }

    function rename(sectId, newName) {
        var s = _state.sects[sectId];
        if (!s) return { ok: false, reason: 'not-found' };
        if (!newName) return { ok: false, reason: 'no-name' };
        s.name = newName;
        return { ok: true, name: newName };
    }

    function setAlignment(sectId, alignment) {
        var s = _state.sects[sectId];
        if (!s) return { ok: false, reason: 'not-found' };
        s.alignment = alignment;
        return { ok: true, alignment: alignment };
    }

    function getSect(sectId) { return _state.sects[sectId] || null; }
    function listMySects() { return Object.keys(_state.sects).map(function (k) { return _state.sects[k]; }); }

    // ============== 4. 资源 ==============
    function getResource(sectId, type) {
        var s = _state.sects[sectId];
        if (!s) return 0;
        return s.resources[type] || 0;
    }

    function addResource(sectId, type, qty) {
        var s = _state.sects[sectId];
        if (!s) return false;
        if (RESOURCE_TYPES.indexOf(type) < 0) return false;
        s.resources[type] = (s.resources[type] || 0) + (qty || 0);
        return true;
    }

    function consumeResource(sectId, type, qty) {
        var s = _state.sects[sectId];
        if (!s) return { ok: false, reason: 'not-found' };
        var cur = s.resources[type] || 0;
        if (cur < qty) return { ok: false, reason: 'insufficient', have: cur, need: qty };
        s.resources[type] = cur - qty;
        return { ok: true, remaining: s.resources[type] };
    }

    // ============== 5. 弟子 + 职位 ==============
    function recruitDisciple(sectId, npcId) {
        var s = _state.sects[sectId];
        if (!s) return { ok: false, reason: 'not-found' };
        if (!npcId) return { ok: false, reason: 'no-npcId' };
        if (s.disciples.find(function (d) { return d.npcId === npcId; })) {
            return { ok: false, reason: 'already-disciple' };
        }
        s.disciples.push({ npcId: npcId, joinedDay: _today(), position: '弟子' });
        s.resources.disciples = s.disciples.length;
        if (window.EventBus) _emit('playerSect:discipleRecruited', { sectId: sectId, npcId: npcId });
        return { ok: true, npcId: npcId, position: '弟子' };
    }

    function dismissDisciple(sectId, npcId) {
        var s = _state.sects[sectId];
        if (!s) return false;
        var idx = s.disciples.findIndex(function (d) { return d.npcId === npcId; });
        if (idx < 0) return false;
        s.disciples.splice(idx, 1);
        s.resources.disciples = s.disciples.length;
        return true;
    }

    function listDisciples(sectId) {
        var s = _state.sects[sectId];
        return s ? s.disciples.slice() : [];
    }

    function getDisciple(sectId, npcId) {
        var s = _state.sects[sectId];
        if (!s) return null;
        return s.disciples.find(function (d) { return d.npcId === npcId; }) || null;
    }

    function assignPosition(sectId, npcId, position) {
        var s = _state.sects[sectId];
        if (!s) return { ok: false, reason: 'not-found' };
        if (!npcId) return { ok: false, reason: 'no-npcId' };
        if (POSITIONS.indexOf(position) < 0) return { ok: false, reason: 'invalid-position' };
        var d = s.disciples.find(function (x) { return x.npcId === npcId; });
        if (!d) return { ok: false, reason: 'not-disciple' };
        // 检查职位槽位
        var slot = POSITION_SLOTS[position] || 0;
        if (slot === 1 && position === '掌门') {
            // 掌门只能 1 人，玩家是默认掌门
            return { ok: false, reason: 'founder-already-leader' };
        }
        var current = s.disciples.filter(function (x) { return x.position === position; }).length;
        if (current >= slot) return { ok: false, reason: 'slot-full', slot: slot, current: current };
        d.position = position;
        return { ok: true, npcId: npcId, position: position };
    }

    // ============== 6. 生产/消费 ==============
    function setProductionRule(sectId, type, qtyPerDay) {
        var s = _state.sects[sectId];
        if (!s) return { ok: false, reason: 'not-found' };
        if (RESOURCE_TYPES.indexOf(type) < 0) return { ok: false, reason: 'invalid-type' };
        s.production[type] = qtyPerDay;
        return { ok: true, type: type, qty: qtyPerDay };
    }

    function setConsumptionRule(sectId, type, qtyPerDay) {
        var s = _state.sects[sectId];
        if (!s) return { ok: false, reason: 'not-found' };
        if (RESOURCE_TYPES.indexOf(type) < 0) return { ok: false, reason: 'invalid-type' };
        s.consumption[type] = qtyPerDay;
        return { ok: true, type: type, qty: qtyPerDay };
    }

    function focusPolicy(sectId, policy) {
        var s = _state.sects[sectId];
        if (!s) return { ok: false, reason: 'not-found' };
        if (POLICIES.indexOf(policy) < 0) return { ok: false, reason: 'invalid-policy' };
        s.policy = policy;
        if (window.EventBus) _emit('playerSect:policyChanged', { sectId: sectId, policy: policy });
        return { ok: true, policy: policy };
    }

    function getPolicy(sectId) {
        var s = _state.sects[sectId];
        return s ? s.policy : null;
    }

    // ============== 7. tickDay ==============
    function tickDay() {
        var produced = {};
        var consumed = {};
        var balances = {};
        for (var sid in _state.sects) {
            var s = _state.sects[sid];
            if (!s) continue;
            // 政策乘数
            var prodMul = 1.0, consMul = 1.0, weaponMul = 1.0, discipleLoss = 0;
            if (s.policy === 'expand') { consMul = 1.5; discipleLoss = 0; }
            else if (s.policy === 'internal') { prodMul = 1.3; }
            else if (s.policy === 'militarize') { weaponMul = 2.0; discipleLoss = 0.5; }

            // 弟子流失
            if (discipleLoss > 0 && s.disciples.length > 0) {
                var lossCount = Math.min(Math.floor(discipleLoss), s.disciples.length);
                s.disciples.splice(0, lossCount);
                s.resources.disciples = s.disciples.length;
            }

            // 招募（expand 政策）
            if (s.policy === 'expand' && s.disciples.length < POSITION_SLOTS['弟子']) {
                // 模拟：每日最多 +1
            }

            // 生产
            for (var pt in s.production) {
                var qty = s.production[pt];
                if (qty === 0 || !qty) continue;
                if (pt === 'weapon') qty *= weaponMul;
                else qty *= prodMul;
                s.resources[pt] = (s.resources[pt] || 0) + qty;
                produced[pt] = (produced[pt] || 0) + qty;
            }
            // 消费
            for (var ct in s.consumption) {
                var cq = s.consumption[ct];
                if (cq === 0 || !cq) continue;
                cq *= consMul;
                s.resources[ct] = (s.resources[ct] || 0) - cq;
                consumed[ct] = (consumed[ct] || 0) + cq;
            }
            // 弟子人数同步
            s.resources.disciples = s.disciples.length;
        }
        // 平衡
        for (var i = 0; i < listMySects().length; i++) {
            var sect = listMySects()[i];
            for (var r in sect.resources) balances[sect.id + '.' + r] = sect.resources[r];
        }
        return { ok: true, produced: produced, consumed: consumed, balances: balances, day: _today() };
    }

    // ============== 8. StateRegistry ==============
    function _exportState() { return JSON.parse(JSON.stringify(_state)); }
    function _importState(s) {
        if (!s) return;
        if (s.sects) _state.sects = s.sects;
    }
    function _resetState() { _state.sects = {}; }

    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        try {
            window.StateRegistry.register('playerSect', { version: 1, export: _exportState, import: _importState, reset: _resetState });
        } catch (e) {}
    }

    // ============== 9. 导出 ==============
    window.PlayerSect = {
        RESOURCE_TYPES: RESOURCE_TYPES,
        POSITIONS: POSITIONS,
        POSITION_SLOTS: POSITION_SLOTS,
        POLICIES: POLICIES,
        POLICY_DESC: POLICY_DESC,
        create: create,
        dissolve: dissolve,
        rename: rename,
        setAlignment: setAlignment,
        getSect: getSect,
        listMySects: listMySects,
        getResource: getResource,
        addResource: addResource,
        consumeResource: consumeResource,
        recruitDisciple: recruitDisciple,
        dismissDisciple: dismissDisciple,
        listDisciples: listDisciples,
        getDisciple: getDisciple,
        assignPosition: assignPosition,
        setProductionRule: setProductionRule,
        setConsumptionRule: setConsumptionRule,
        focusPolicy: focusPolicy,
        getPolicy: getPolicy,
        tickDay: tickDay,
        getState: function () { return _state; }
    };
    if (window.XianXia) window.XianXia.PlayerSect = window.PlayerSect;
    try { console.log('[PlayerSect] initialized v1 (' + RESOURCE_TYPES.length + ' resources, ' + POSITIONS.length + ' positions, ' + POLICIES.length + ' policies)'); } catch (e) {}
})();
