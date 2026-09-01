// ==================== beast-evolution.js - 灵兽进化+受伤+变异 (v19.19) ====================
// 对标 v18.8 路线图 §7.2 灵兽生态：3 进化线 + 受伤/休养 + 变异/遗传。

(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    // ============== 1. 3 进化线 ==============
    var EVOLUTION_LINES = {
        line_fox: {
            name: '灵狐系',
            stages: [
                { id: 'infant', name: '幼狐', requirements: { bondDays: 0, level: 1, exp: 0 }, buff: { treasure: 0.05 } },
                { id: 'adult', name: '灵狐', requirements: { bondDays: 50, level: 20, exp: 0 }, buff: { treasure: 0.15 } },
                { id: 'king', name: '九尾灵狐', requirements: { bondDays: 200, level: 50, exp: 1000, affection: 80 }, buff: { treasure: 0.30, rare: '九尾寻宝' } }
            ]
        },
        line_phoenix: {
            name: '火凤系',
            stages: [
                { id: 'infant', name: '幼凤', requirements: { bondDays: 0, level: 1, exp: 0 }, buff: { craftFire: 0.10 } },
                { id: 'adult', name: '火凤', requirements: { bondDays: 50, level: 20, exp: 0 }, buff: { craftFire: 0.20 } },
                { id: 'king', name: '朱雀', requirements: { bondDays: 200, level: 50, exp: 1000, affection: 80 }, buff: { craftFire: 0.35, rare: '朱雀业火' } }
            ]
        },
        line_dragon: {
            name: '龙龟系',
            stages: [
                { id: 'infant', name: '幼龟', requirements: { bondDays: 0, level: 1, exp: 0 }, buff: { carry: 0.10 } },
                { id: 'adult', name: '灵龟', requirements: { bondDays: 50, level: 20, exp: 0 }, buff: { carry: 0.25 } },
                { id: 'king', name: '玄龙', requirements: { bondDays: 200, level: 50, exp: 1000, affection: 80 }, buff: { carry: 0.50, rare: '玄龙驮天' } }
            ]
        }
    };

    // ============== 2. 丹药治疗 ==============
    var PILL_HEAL = { 'minor': 0.20, 'medium': 0.40, 'major': 0.60 };

    // ============== 3. 模块级状态 ==============
    var _state = {
        beasts: {}  // {beastId: {line, stage, exp, level, bondDays, affection, hp, maxHp, traits, mutated, tamedDay}}
    };

    var DEFAULT_HP = 100;

    function _today() { return (window.WorldCalendar && window.WorldCalendar.day) || 0; }
    function _emit(name, payload) {
        var bus = null;
        if (typeof window !== 'undefined' && window.EventBus) bus = window.EventBus;
        else if (typeof globalThis !== 'undefined' && globalThis.EventBus) bus = globalThis.EventBus;
        if (bus && typeof bus.emit === 'function') bus.emit(name, payload);
    }

    function _ensure(beastId) {
        _state.beasts[beastId] = _state.beasts[beastId] || {
            line: null, stage: 'infant', exp: 0, level: 1, bondDays: 0, affection: 0,
            hp: DEFAULT_HP, maxHp: DEFAULT_HP, traits: [], mutated: false,
            tamedDay: _today()
        };
        return _state.beasts[beastId];
    }

    // ============== 4. 进化 API ==============
    function initBeast(beastId, lineId) {
        if (!EVOLUTION_LINES[lineId]) return { ok: false, reason: 'unknown-line' };
        var b = _ensure(beastId);
        b.line = lineId;
        b.stage = 'infant';
        return { ok: true, line: lineId, stage: 'infant' };
    }

    function getStage(beastId) {
        var b = _state.beasts[beastId];
        return b ? b.stage : null;
    }
    function getLine(beastId) {
        var b = _state.beasts[beastId];
        return b ? b.line : null;
    }
    function getLevel(beastId) {
        var b = _state.beasts[beastId];
        return b ? b.level : 1;
    }
    function getExp(beastId) {
        var b = _state.beasts[beastId];
        return b ? b.exp : 0;
    }

    function getBuff(beastId) {
        var b = _state.beasts[beastId];
        if (!b || !b.line) return {};
        var line = EVOLUTION_LINES[b.line];
        if (!line) return {};
        var stage = line.stages.find(function (s) { return s.id === b.stage; });
        if (!stage) return {};
        return Object.assign({}, stage.buff, b.traits);
    }

    function canEvolve(beastId) {
        var b = _state.beasts[beastId];
        if (!b || !b.line) return { ok: false, reason: 'not-initialized' };
        var line = EVOLUTION_LINES[b.line];
        if (!line) return { ok: false, reason: 'unknown-line' };
        var stageIdx = line.stages.findIndex(function (s) { return s.id === b.stage; });
        if (stageIdx < 0 || stageIdx >= line.stages.length - 1) {
            return { ok: false, reason: 'max-stage' };
        }
        var nextStage = line.stages[stageIdx + 1];
        var req = nextStage.requirements;
        var missing = [];
        if ((b.bondDays || 0) < req.bondDays) missing.push('bondDays < ' + req.bondDays);
        if ((b.level || 1) < req.level) missing.push('level < ' + req.level);
        if ((b.exp || 0) < (req.exp || 0)) missing.push('exp < ' + (req.exp || 0));
        if (req.affection && (b.affection || 0) < req.affection) missing.push('affection < ' + req.affection);
        return {
            ok: missing.length === 0,
            nextStage: nextStage.id,
            nextName: nextStage.name,
            requirements: req,
            missing: missing
        };
    }

    function evolve(beastId) {
        var b = _state.beasts[beastId];
        if (!b) return { ok: false, reason: 'not-found' };
        var can = canEvolve(beastId);
        if (!can.ok) return can;
        var line = EVOLUTION_LINES[b.line];
        var fromStage = b.stage;
        var toStage = can.nextStage;
        b.stage = toStage;
        if (window.EventBus) _emit('beast:evolved', { beastId: beastId, from: fromStage, to: toStage, line: b.line });
        return { ok: true, fromStage: fromStage, toStage: toStage, newBuff: getBuff(beastId) };
    }

    function addExp(beastId, exp) {
        var b = _ensure(beastId);
        b.exp = (b.exp || 0) + (exp || 0);
        // 等级公式：每 100 exp = 1 level
        var newLevel = 1 + Math.floor(b.exp / 100);
        var leveledUp = newLevel > (b.level || 1);
        b.level = newLevel;
        var evoReady = canEvolve(beastId).ok;
        return { ok: true, newLevel: newLevel, leveledUp: leveledUp, evoReady: evoReady, exp: b.exp };
    }

    function bondDay(beastId) {
        var b = _ensure(beastId);
        b.bondDays = (_today() - (b.tamedDay || _today()));
        return b.bondDays;
    }

    function setBondDays(beastId, days) {
        var b = _ensure(beastId);
        b.bondDays = days;
        return b.bondDays;
    }

    function setAffection(beastId, value) {
        var b = _ensure(beastId);
        b.affection = value;
        return b.affection;
    }

    // ============== 5. 受伤/休养 API ==============
    function damage(beastId, hpLost) {
        var b = _state.beasts[beastId];
        if (!b) return { ok: false, reason: 'not-found' };
        b.hp = Math.max(0, b.hp - (hpLost || 0));
        return { ok: true, currentHp: b.hp, maxHp: b.maxHp, isWounded: b.hp < b.maxHp };
    }

    function getHp(beastId) { return _state.beasts[beastId] ? _state.beasts[beastId].hp : 0; }
    function getMaxHp(beastId) { return _state.beasts[beastId] ? _state.beasts[beastId].maxHp : DEFAULT_HP; }

    function getWoundStatus(beastId) {
        var b = _state.beasts[beastId];
        if (!b) return null;
        if (b.hp <= 0) return 'critical';
        if (b.hp < b.maxHp * 0.3) return 'critical';
        if (b.hp < b.maxHp) return 'wounded';
        return 'healthy';
    }

    function heal(beastId, itemId) {
        var b = _ensure(beastId);
        var amount = 0;
        if (typeof itemId === 'string' && PILL_HEAL[itemId] !== undefined) {
            amount = b.maxHp * PILL_HEAL[itemId];
        } else if (typeof itemId === 'number') {
            amount = itemId;
        }
        b.hp = Math.min(b.maxHp, b.hp + amount);
        if (window.EventBus) _emit('beast:healed', { beastId: beastId, amount: amount, hp: b.hp });
        return { ok: true, amount: amount, hp: b.hp, maxHp: b.maxHp, full: b.hp >= b.maxHp };
    }

    function consumePill(beastId, pillType) {
        if (!PILL_HEAL[pillType]) return { ok: false, reason: 'unknown-pill' };
        return heal(beastId, pillType);
    }

    function tickDayHealing() {
        var healed = [];
        for (var id in _state.beasts) {
            var b = _state.beasts[id];
            if (b.hp < b.maxHp) {
                var prev = b.hp;
                b.hp = Math.min(b.maxHp, b.hp + b.maxHp * 0.01);
                healed.push({ beastId: id, prev: prev, now: b.hp });
            }
            // 顺便累加 bondDays
            b.bondDays = (_today() - (b.tamedDay || _today()));
        }
        return { ok: true, healed: healed };
    }

    // ============== 6. 变异/繁育 API ==============
    function tryMutate(beastId) {
        var b = _ensure(beastId);
        if (b.mutated) return { ok: false, reason: 'already-mutated' };
        var rate = 0.10;
        var success = Math.random() < rate;
        if (!success) return { ok: false, reason: 'mutation-failed' };
        var rareAttrs = ['金睛', '火翼', '冰鳞', '雷尾', '风爪', '土甲', '暗角', '光纹'];
        var rare = rareAttrs[Math.floor(Math.random() * rareAttrs.length)];
        b.mutated = true;
        b.traits = b.traits || [];
        b.traits.push(rare);
        // buff × 1.5
        var orig = getBuff(beastId);
        Object.keys(orig).forEach(function (k) { orig[k] = (orig[k] || 0) * 1.5; });
        if (window.EventBus) _emit('beast:mutated', { beastId: beastId, rare: rare, newBuff: orig });
        return { ok: true, mutated: true, newTrait: rare, newBuff: orig };
    }

    function breed(parentAId, parentBId) {
        var pa = _state.beasts[parentAId];
        var pb = _state.beasts[parentBId];
        if (!pa || !pb) return { ok: false, reason: 'parent-not-found' };
        if (pa.line !== pb.line) return { ok: false, reason: 'different-lines' };
        var line = pa.line;
        // 子代继承父母 50% 特性
        var childId = 'beast_child_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        var inherited = [];
        var allTraits = (pa.traits || []).concat(pb.traits || []);
        if (allTraits.length > 0) {
            var count = Math.max(1, Math.floor(allTraits.length / 2));
            var shuffled = allTraits.slice().sort(function () { return Math.random() - 0.5; });
            inherited = shuffled.slice(0, count);
        }
        // 10% 概率继承双方 buff 强化
        if (Math.random() < 0.10) {
            inherited.push('perfect_inherit');
        }
        _state.beasts[childId] = {
            line: line, stage: 'infant', exp: 0, level: 1, bondDays: 0, affection: 0,
            hp: DEFAULT_HP, maxHp: DEFAULT_HP, traits: inherited, mutated: false,
            tamedDay: _today()
        };
        if (window.EventBus) _emit('beast:bred', { childId: childId, parentA: parentAId, parentB: parentBId, inherited: inherited });
        return { ok: true, childId: childId, inherited: inherited };
    }

    function getMutationRate() { return 0.10; }

    function listLines() {
        return Object.keys(EVOLUTION_LINES).map(function (k) {
            return Object.assign({ id: k }, EVOLUTION_LINES[k]);
        });
    }

    // ============== 7. StateRegistry ==============
    function _exportState() { return JSON.parse(JSON.stringify(_state)); }
    function _importState(s) {
        if (!s) return;
        if (s.beasts) _state.beasts = s.beasts;
    }
    function _resetState() { _state.beasts = {}; }

    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        try {
            window.StateRegistry.register('beastEvolution', { version: 1, export: _exportState, import: _importState, reset: _resetState });
        } catch (e) {}
    }

    // ============== 8. 导出 ==============
    window.BeastEvolution = {
        EVOLUTION_LINES: EVOLUTION_LINES,
        PILL_HEAL: PILL_HEAL,
        initBeast: initBeast,
        getStage: getStage,
        getLine: getLine,
        getLevel: getLevel,
        getExp: getExp,
        getBuff: getBuff,
        canEvolve: canEvolve,
        evolve: evolve,
        addExp: addExp,
        bondDay: bondDay,
        setBondDays: setBondDays,
        setAffection: setAffection,
        damage: damage,
        heal: heal,
        getHp: getHp,
        getMaxHp: getMaxHp,
        getWoundStatus: getWoundStatus,
        consumePill: consumePill,
        tickDayHealing: tickDayHealing,
        tryMutate: tryMutate,
        breed: breed,
        getMutationRate: getMutationRate,
        listLines: listLines,
        getState: function () { return _state; }
    };
    if (window.XianXia) window.XianXia.BeastEvolution = window.BeastEvolution;
    try { console.log('[BeastEvolution] initialized v1 (' + Object.keys(EVOLUTION_LINES).length + ' evolution lines, ' + Object.keys(PILL_HEAL).length + ' pill tiers)'); } catch (e) {}
})();
