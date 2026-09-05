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
        expand: '扩张：四处张榜招人，门面开销也大（消耗 ×1.5）',
        internal: '内政：专心打理田产库房，产出 +30%',
        militarize: '备战：兵器库日夜赶工（武器 ×2），苦练伤人，一年里总有人吃不了苦走'
    };
    // 立派候选地（v20.52）：地形沿用门派命门档案的词表（山/城/水/漠/岛），
    // 安家费各有名目——山门要开石阶，城里要买坊基，渡口要赁码头，驼路要打井，海岛要修泊港。
    var FOUND_SITES = [
        { id: 'site_mountain', name: '中州·青岩山', terrain: '山', cost: 800,
          desc: '石阶八百级，胜在易守难攻——只是大雪封山时，粮也上不来。' },
        { id: 'site_city', name: '中州·临江坊', terrain: '城', cost: 600,
          desc: '城里钱粮买卖都近，眼也杂——宗门的一举一动，坊间都知道。' },
        { id: 'site_water', name: '江南·烟水渡', terrain: '水', cost: 700,
          desc: '渔盐之利厚，水路通四方——潮起潮落，屋舍遭淹也是常事。' },
        { id: 'site_desert', name: '大漠·落日坂', terrain: '漠', cost: 900,
          desc: '驼路从门前过，商队都要来磕头——沙暴一来，井是唯一的命。' },
        { id: 'site_island', name: '东海·浮玉岛', terrain: '岛', cost: 1000,
          desc: '海上灵气足，无人打扰——台风一封，半年出不了海。' }
    ];
    var HISTORY_MAX = 120; // 宗门史只留最近这些条，防止存档无限膨胀

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
            terrain: opts.terrain || null, // 山/城/水/漠/岛——立派择址后定，未择址为 null（旧档兼容）
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
            _lossAcc: 0,    // 备战政策的弟子流失累计（小数逐日累加，满 1 流一人）
            history: []
        };
    }

    // ============== 3. 创宗 / 解散 / 改名 ==============
    function create(opts) {
        if (!opts || !opts.name) return { ok: false, reason: 'no-name' };
        var inst = _newInstance(opts);
        _state.sects[inst.id] = inst;
        addHistory(inst.id, '开山立宗，「' + inst.name + '」立于' + (inst.location && inst.location !== '未知' ? inst.location : '无名之地') + '。');
        if (window.EventBus) _emit('playerSect:created', { sect: inst });
        return { ok: true, sectId: inst.id, instance: inst };
    }

    // 宗门史：立派/收徒/政策/战事/大额收支，都记一笔（有头有尾，日后可查）
    function addHistory(sectId, text) {
        var s = _state.sects[sectId];
        if (!s || !text) return false;
        s.history = s.history || [];
        s.history.push({ day: _today(), text: String(text).slice(0, 120) });
        if (s.history.length > HISTORY_MAX) s.history.splice(0, s.history.length - HISTORY_MAX);
        return true;
    }

    function chooseSite(sectId, siteId) {
        var s = _state.sects[sectId];
        if (!s) return { ok: false, reason: 'not-found' };
        var site = null;
        (FOUND_SITES || []).forEach(function (x) { if (x.id === siteId) site = x; });
        if (!site) return { ok: false, reason: 'no-site' };
        s.location = site.name;
        s.terrain = site.terrain;
        addHistory(sectId, '山门定于' + site.name + '。');
        return { ok: true, site: site };
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
        addHistory(sectId, '收录' + _npcBrief(npcId) + '为记名弟子。');
        if (window.EventBus) _emit('playerSect:discipleRecruited', { sectId: sectId, npcId: npcId });
        return { ok: true, npcId: npcId, position: '弟子' };
    }

    // 弟子名号（宗门史用）：NPC 拿得到就写名，拿不到只记编号——不猜名字
    function _npcBrief(npcId) {
        try {
            var npc = window.npcManager && typeof window.npcManager.getNPC === 'function' ? window.npcManager.getNPC(npcId) : null;
            return (npc && npc.name) ? ('「' + npc.name + '」') : ('一名修士');
        } catch (e) { return '一名修士'; }
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
        var old = d.position;
        d.position = position;
        addHistory(sectId, _npcBrief(npcId) + '由「' + (old || '弟子') + '」任「' + position + '」。');
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
        addHistory(sectId, '门中议定新策：' + (POLICY_DESC[policy] || policy).split('：')[0] + '。');
        if (window.EventBus) _emit('playerSect:policyChanged', { sectId: sectId, policy: policy });
        return { ok: true, policy: policy };
    }

    function getPolicy(sectId) {
        var s = _state.sects[sectId];
        return s ? s.policy : null;
    }

    // ============== 7. tickDay ==============
    // v20.52：职位真管事——堂主管库（兵器/丹药 +0.5/日·位），长老座镇（灵石 +1、声望 +0.05/日·位）；
    // 备战政策的弟子流失改为小数逐日累计（原先 floor(0.5)=0，一年也流不走一个人）；灵石见底记入宗门史。
    function tickDay() {
        var produced = {};
        var consumed = {};
        var balances = {};
        for (var sid in _state.sects) {
            var s = _state.sects[sid];
            if (!s) continue;
            // 政策乘数
            var prodMul = 1.0, consMul = 1.0, weaponMul = 1.0, lossPerDay = 0;
            if (s.policy === 'expand') { consMul = 1.5; }
            else if (s.policy === 'internal') { prodMul = 1.3; }
            else if (s.policy === 'militarize') { weaponMul = 2.0; lossPerDay = 0.5; }

            // 职位加成：有职之人各管一摊
            var elders = 0, stewards = 0;
            (s.disciples || []).forEach(function (d) {
                if (d.position === '长老') elders++;
                else if (d.position === '堂主') stewards++;
            });
            var jobElixir = stewards * 0.5, jobWeapon = stewards * 0.5;
            var jobStone = elders * 1, jobRep = elders * 0.05;

            // 弟子流失：备战练兵苦，逐日累计，满一人走一人
            if (lossPerDay > 0 && s.disciples.length > 0) {
                s._lossAcc = (Number(s._lossAcc) || 0) + lossPerDay;
                while (s._lossAcc >= 1 && s.disciples.length > 0) {
                    s._lossAcc -= 1;
                    var gone = s.disciples.shift();
                    addHistory(s.id, '练兵太苦，「' + _npcBrief(gone && gone.npcId) + '」辞门而去。');
                }
                if (s._lossAcc < 0) s._lossAcc = 0;
            }

            // 生产
            for (var pt in s.production) {
                var qty = s.production[pt];
                if (pt === 'weapon') { qty = qty * weaponMul + jobWeapon; }
                else if (pt === 'elixir') { qty = qty * prodMul + jobElixir; }
                else if (pt === 'spiritStones') { qty = qty * prodMul + jobStone; }
                else { qty = qty * prodMul; }
                if (pt === 'reputation') qty += jobRep;
                if (!qty) continue;
                s.resources[pt] = Math.round(((s.resources[pt] || 0) + qty) * 100) / 100;
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
            // 灵石见底：门里断了粮，记一笔（后续批次的后果链由此起头）
            if ((s.resources.spiritStones || 0) <= 0 && s.disciples.length > 0 && !s._starved) {
                s._starved = true;
                addHistory(s.id, '库中灵石见底，门中弟子嚼着冷饭练功。');
            } else if ((s.resources.spiritStones || 0) > 50) {
                s._starved = false;
            }
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
        // v20.52 旧档迁移：补齐新字段的默认值（terrain/history/_lossAcc），老宗照常在
        for (var sid in _state.sects) {
            var sect = _state.sects[sid];
            if (!sect) continue;
            if (sect.terrain === undefined) sect.terrain = (sect.location && sect.location !== '未知') ? '山' : null;
            if (!Array.isArray(sect.history)) sect.history = [];
            if (sect._lossAcc === undefined) sect._lossAcc = 0;
        }
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
        FOUND_SITES: FOUND_SITES,
        create: create,
        dissolve: dissolve,
        rename: rename,
        setAlignment: setAlignment,
        chooseSite: chooseSite,
        addHistory: addHistory,
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
