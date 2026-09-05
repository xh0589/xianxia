/**
 * v20.49-sect-crisis-node.js — 门派大事因果引擎单元测试
 *
 * 覆盖：
 *   C1 事件池完整性：每桩都有 causality/omen(可防备)/crisis(2-3 抉择)/aftermath，抉择可结算
 *   C2 因果门禁·强盛不出贼：巨擘门派抽不到盗匪，弱门才出
 *   C3 因果门禁·无仇不上门：外交账里没有仇家，寻仇族事件不存在
 *   C4 因果门禁·天时：沙漠无山洪、海岛无山洪、冬天匪歇
 *   C5 因果门禁·内乱看士气：morale 高不出长老离心
 *   C6 因果门禁·祸根闭环：scars 空 → 旧怨/邪祟不出；有祸根才出
 *   C7 生命周期：冷却 → 酝酿(可防备消解) → 爆发 → 抉择落账 → 余波
 *   C8 办砸留痕：失败抉择落 scar，成为下一桩的因
 *   C9 记功只归本门：别门大事不给玩家记 contribution
 *   C10 防备降档：hardened 时失败惩罚路径仍可结算
 *
 * 运行：node tests/v20.49-sect-crisis-node.js
 */
'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');

var ROOT = path.join(__dirname, '..');

// ---------- 可编程随机源 ----------
function makeRng(seq) {
    var i = 0;
    return function () {
        if (!seq.length) return 0.99;
        return seq[i++ % seq.length];
    };
}

function buildEnv(opts) {
    opts = opts || {};
    var rng = makeRng(opts.rngSeq || [0.1]);
    var store = {};
    var internal = {
        '少林寺': { morale: opts.morale != null ? opts.morale : 80, influence: opts.influence != null ? opts.influence : 85, resources: opts.resources != null ? opts.resources : 200, disciples: opts.disciples != null ? opts.disciples : 40 },
        '恒山派': { morale: opts.morale != null ? opts.morale : 80, influence: 20, resources: 60, disciples: 10 },
        '烈日教': { morale: 80, influence: 60, resources: 150, disciples: 30 },
        '蓬莱派': { morale: 80, influence: 60, resources: 150, disciples: 30 },
        '修罗宫': { morale: 60, influence: 60, resources: 150, disciples: 30 },
        '药王谷': { morale: 80, influence: 70, resources: 150, disciples: 30 },
        '丐帮': { morale: 80, influence: 60, resources: 150, disciples: 35 }
    };
    var sectsData = {
        '少林寺': { power: '巨擘', type: '正道', location: '中州' },
        '恒山派': { power: '中等', type: '正道', location: '中州' },
        '烈日教': { power: '大派', type: '邪派', location: '大漠' },
        '蓬莱派': { power: '大派', type: '正道', location: '东海' },
        '修罗宫': { power: '大派', type: '邪派', location: '中州' },
        '药王谷': { power: '大派', type: '正道', location: '中州' },
        '丐帮': { power: '大派', type: '正道', location: '中州' }
    };
    var windowObj = {
        console: console,
        Math: Math,
        JSON: JSON,
        localStorage: {
            getItem: function (k) { return store[k] != null ? store[k] : null; },
            setItem: function (k, v) { store[k] = String(v); },
            removeItem: function (k) { delete store[k]; }
        },
        addEventListener: function () {},
        getAbsoluteDay: function () { return opts.day || 100; },
        sectsData: sectsData,
        sectPowerValue: function (sect) {
            var tiers = { '巨擘': 100, '大派': 70, '中等偏上': 55, '中等': 40, '小': 22, '极小': 12, '未知': 40 };
            return tiers[(sect || {}).power] != null ? tiers[(sect || {}).power] : 40;
        },
        getSectInternal: function (n) { return internal[n] || null; },
        SECT_DIPLOMACY_STATE: opts.diplo || {},
        discipleState: { isInSect: true, sectId: opts.playerSect || '恒山派', contribution: 0, points: 0, qi: 500, energy: 500 },
        inventory: { currency: { spiritStones: 100000 } },
        currentCharData: { qi: 500, energy: 500, spiritStones: 100000 },
        timeSystem: {
            gameTime: { currentDay: opts.day || 100, currentSeason: opts.season || 'spring', currentMonth: 0 },
            onNewDaySubscribe: function () {}
        },
        showMessage: function () {},
        showSectInnerView: function () {},
        StateRegistry: { register: function () {} }
    };
    var ctx = vm.createContext({ window: windowObj, console: console, Math: Math, JSON: JSON, localStorage: windowObj.localStorage, setTimeout: setTimeout });
    ['sect-profiles.js', 'sect-crisis-events.js', 'sect-crisis-engine.js'].forEach(function (f) {
        vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/sects', f), 'utf8'), ctx, { filename: f });
    });
    // 引擎读的是全局 Math.random——注入可控随机源（序列循环取用）
    Math.random = rng;
    return windowObj;
}

function candidateIds(w, sectName) {
    return (w.SectCrisis.candidates(sectName) || []).map(function (c) { return c.id; });
}

var failed = 0, passed = 0;
function check(name, cond) {
    if (cond) { passed++; console.log('  ✅ ' + name); }
    else { failed++; console.log('  ❌ ' + name); }
}

// ==================== C1 事件池完整性 ====================
console.log('\n[C1] 事件池完整性');
(function () {
    var w = buildEnv();
    var pool = w.SECT_CRISIS_EVENTS;
    var ids = Object.keys(pool);
    check('池内事件数 ≥ 20（实得 ' + ids.length + '）', ids.length >= 20);
    var families = {};
    var ok = true;
    ids.forEach(function (id) {
        var ev = pool[id];
        var bad = [];
        if (typeof ev.causality !== 'function') bad.push('causality');
        if (!ev.omen || !ev.omen.text || !ev.omen.prepare || !(ev.omen.prepare.options || []).length) bad.push('omen/防备');
        if (!ev.crisis || !ev.crisis.text || (ev.crisis.choices || []).length < 2) bad.push('crisis');
        (ev.crisis && ev.crisis.choices || []).forEach(function (c, i) {
            if (!c.label) bad.push('choice' + i + '.label');
            if (!c.success || typeof c.success.apply !== 'function') bad.push('choice' + i + '.success.apply');
            if (typeof c.check === 'number' && (!c.fail || typeof c.fail.apply !== 'function')) bad.push('choice' + i + '.fail.apply');
        });
        if (!ev.aftermath || !(ev.aftermath.days > 0)) bad.push('aftermath');
        families[ev.family] = (families[ev.family] || 0) + 1;
        if (bad.length) { ok = false; console.log('    · ' + id + ' 缺：' + bad.join(',')); }
    });
    check('每桩事件结构完整（causality/omen/crisis/aftermath）', ok);
    var famKeys = Object.keys(families);
    check('覆盖事件族 ≥ 14（实得 ' + famKeys.length + '：' + famKeys.join('/') + '）', famKeys.length >= 14);
    // 每一族都至少有一桩事件能对某个真实门派给出非零权重（不要求全门适用，要求族存在即有因可对）
    check('family 全部落在命门档案的 weightMods 词表内', famKeys.every(function (f) {
        return ['bandit', 'vendetta', 'office', 'evil', 'elder', 'exam', 'rite', 'influx', 'buyout', 'vein', 'plague', 'ally', 'flood', 'ancient'].indexOf(f) >= 0;
    }));
})();

// ==================== C2 强盛不出贼 ====================
console.log('\n[C2] 因果门禁·强盛不出贼');
(function () {
    var w = buildEnv();
    check('巨擘少林（防务充实）无盗匪候选', candidateIds(w, '少林寺').indexOf('bandit_scout') < 0);
    var w2 = buildEnv({ influence: 15, resources: 120, disciples: 8 });
    var weak = candidateIds(w2, '恒山派');
    check('弱小恒山（人少库薄）有贼踩点', weak.indexOf('bandit_scout') >= 0);
    var w3 = buildEnv({ season: 'winter', influence: 15, disciples: 8 });
    check('寒冬雪封，匪也歇（不出盗匪）', candidateIds(w3, '恒山派').indexOf('bandit_scout') < 0);
})();

// ==================== C3 无仇不上门 ====================
console.log('\n[C3] 因果门禁·无仇不上门');
(function () {
    var w = buildEnv({ diplo: {} });
    check('外交账干净 → 寻仇族不出', candidateIds(w, '少林寺').indexOf('vendetta_call') < 0);
    var foeDiplo = { '少林寺': { '血手门': { relation: -65, conflicts: 2 } } };
    var w2 = buildEnv({ diplo: foeDiplo });
    var ids = candidateIds(w2, '少林寺');
    check('有真仇家（血手门 -65）→ 寻仇上门', ids.indexOf('vendetta_call') >= 0);
    var c = (w2.SectCrisis.candidates('少林寺') || []).find(function (x) { return x.id === 'vendetta_call'; });
    check('酝酿原因点名仇家（「血手门」）', !!c && c.reason.indexOf('血手门') >= 0);
})();

// ==================== C4 天时地理 ====================
console.log('\n[C4] 因果门禁·天时地理');
(function () {
    var w = buildEnv({ season: 'summer' });
    check('大漠烈日教：无山洪（地形门禁）', candidateIds(w, '烈日教').indexOf('flood_hill') < 0);
    check('大漠烈日教：无风暴闭港（地形门禁）', candidateIds(w, '烈日教').indexOf('flood_sea') < 0);
    var w2 = buildEnv({ season: 'summer' });
    check('海岛蓬莱（夏）：有风暴闭港', candidateIds(w2, '蓬莱派').indexOf('flood_sea') >= 0);
    check('海岛蓬莱：无山洪（不是山地）', candidateIds(w2, '蓬莱派').indexOf('flood_hill') < 0);
    var w3 = buildEnv({ season: 'winter' });
    check('海岛蓬莱（冬）：风暴季已过', candidateIds(w3, '蓬莱派').indexOf('flood_sea') < 0);
    check('夏山少林（药王谷命门）：山洪在册', candidateIds(buildEnv({ season: 'summer' }), '药王谷').indexOf('flood_hill') >= 0);
})();

// ==================== C5 内乱看士气 ====================
console.log('\n[C5] 因果门禁·内乱看士气');
(function () {
    var w = buildEnv({ morale: 85 });
    check('士气高昂（85）→ 长老请辞不出', candidateIds(w, '少林寺').indexOf('elder_leave') < 0);
    check('士气高昂 → 堂口阋墙不出', candidateIds(w, '少林寺').indexOf('elder_feud') < 0);
    var w2 = buildEnv({ morale: 30 });
    check('士气低迷（30）→ 长老请辞在册', candidateIds(w2, '少林寺').indexOf('elder_leave') >= 0);
})();

// ==================== C6 祸根闭环 ====================
console.log('\n[C6] 因果门禁·祸根闭环');
(function () {
    var w = buildEnv({ diplo: {} });
    check('无旧怨档 → 「旧怨发酵」不出', candidateIds(w, '少林寺').indexOf('vendetta_old') < 0);
    check('无伤亡档且命门无邪祟 → 「邪祟夜惊」不出', candidateIds(w, '丐帮').indexOf('evil_haunt') < 0);
    var w2 = buildEnv({ diplo: {} });
    w2.SectCrisis.mem('少林寺').scars.vendetta = 1;
    check('留有旧怨档 → 「旧怨发酵」在册', candidateIds(w2, '少林寺').indexOf('vendetta_old') >= 0);
    var w3 = buildEnv();
    w3.SectCrisis.mem('丐帮').scars.death = 1;
    check('留有伤亡档 → 「邪祟夜惊」在册', candidateIds(w3, '丐帮').indexOf('evil_haunt') >= 0);
    var w4 = buildEnv();
    w4.SectCrisis.mem('药王谷').scars.ground_loose = 1;
    var ids4 = candidateIds(w4, '药王谷');
    check('山体松动档 → 「古迹出世」权重大增（高权重入选）', ids4.indexOf('ancient_gate') >= 0);
})();

// ==================== C7 生命周期 ====================
console.log('\n[C7] 生命周期：冷却→酝酿→防备→爆发→抉择→余波');
(function () {
    // 弱门恒山、无仇家档案 → 候选主要是盗匪/香火/考核等；序列让 roll 命中并稳定推进
    var w = buildEnv({
        playerSect: '恒山派', influence: 15, resources: 120, disciples: 10,
        rngSeq: [0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01]
    });
    var m = w.SectCrisis.mem('恒山派');
    m.lastCrisisDay = -999;
    w.SectCrisis.tickDay('恒山派');
    check('过冷却掷骰命中 → 进入酝酿', !!m.active && m.active.stage === 'omen');
    var evId = m.active.eventId;
    check('酝酿原因随事而记', !!(m.active.reason || '').length);
    // 防备两次（need=2）→ 消解
    var r1 = w.SectCrisis.prepare('恒山派', 0);
    check('防备第一次受理', r1.ok === true && r1.resolved === false);
    var r2 = w.SectCrisis.prepare('恒山派', 1);
    check('防备达标 → 消解（大事没发生）', r2.ok === true && r2.resolved === true);
    check('消解后无进行中的事', m.active === null);
    check('消解也进冷却（不会连日出事）', m.lastCrisisDay > 0);

    // 爆发路径：不防备，让酝酿到期
    m.lastCrisisDay = -999;
    w.SectCrisis.tickDay('恒山派');
    if (m.active && m.active.stage === 'omen') {
        m.active.daysLeft = 1;
        w.SectCrisis.tickDay('恒山派');
        check('酝酿到期 → 爆发（进入抉择）', m.active && m.active.stage === 'crisis');
        var pool = w.SECT_CRISIS_EVENTS;
        var ev = pool[m.active.eventId];
        // 成功抉择：roll 小于需求值
        var res = w.SectCrisis.resolve('恒山派', 0);
        check('抉择落账成功', res.ok === true);
        check('成功有余波（余波在册）', m.aftermaths.length >= 1 && m.aftermaths[0].eventId === evId);
        check('成功一般不留祸根（无 scar 或事件无 scar）', !(m.scars[ev.scar] > 0));
        // 余波日结：推进到自然了结
        var days = m.aftermaths[0].daysLeft;
        for (var i = 0; i < days + 1; i++) w.SectCrisis.tickDay('恒山派');
        check('余波到期自了', m.aftermaths.length === 0);
    } else {
        check('（此轮候选池为空，未进入爆发路径——需检查弱门候选）', false);
    }
})();

// ==================== C8 办砸留痕 ====================
console.log('\n[C8] 办砸留痕 → 成为下一桩的因');
(function () {
    var w = buildEnv({ playerSect: '少林寺', diplo: { '少林寺': { '血手门': { relation: -65, conflicts: 0 } } }, rngSeq: [0.9] });
    var m = w.SectCrisis.mem('少林寺');
    m.active = { stage: 'crisis', eventId: 'vendetta_call', daysLeft: 0, prepared: 0, reason: '' };
    // choice 0 有 check 55，roll=0.9*100=90 → 失败
    var res = w.SectCrisis.resolve('少林寺', 0);
    check('低运 roll → 办砸', res.ok === true && res.outcome === 'fail');
    check('办砸落祸根档（vendetta）', m.scars.vendetta === 1);
    check('祸根档可被后续因果读到', candidateIds(w, '少林寺').indexOf('vendetta_old') >= 0);
})();

// ==================== C9 记功只归本门 ====================
console.log('\n[C9] 记功只归本门弟子');
(function () {
    var w = buildEnv({ playerSect: '恒山派' });
    var before = w.discipleState.contribution;
    var msg = w.SectCrisis._applyGains('少林寺', { contribution: 50, morale: 5 });
    check('别门的大事不给玩家记贡献', w.discipleState.contribution === before);
    check('门派账（士气）照常落', msg.indexOf('士气') >= 0);
    var before2 = w.discipleState.contribution;
    w.SectCrisis._applyGains('恒山派', { contribution: 30 });
    check('本门大事照常记功', w.discipleState.contribution === before2 + 30);
})();

// ==================== C10 防备降档 ====================
console.log('\n[C10] 防备过的门派，办砸也轻些');
(function () {
    var w = buildEnv({ playerSect: '少林寺', diplo: { '少林寺': { '血手门': { relation: -65, conflicts: 0 } } }, rngSeq: [0.9] });
    var m = w.SectCrisis.mem('少林寺');
    m.active = { stage: 'crisis', eventId: 'vendetta_call', daysLeft: 0, prepared: 1, reason: '' };
    var res = w.SectCrisis.resolve('少林寺', 0);
    // hardened: need = 55-10 = 45，roll 90 仍失败——但结算路径必须走得通
    check('hardened 结算路径畅通', res.ok === true && res.outcome === 'fail');
    check('余波带防备标记', m.aftermaths.length >= 1 && m.aftermaths[0].hardened === true);
})();

console.log('\n========== 结果：' + passed + ' 通过 / ' + failed + ' 失败 ==========');
process.exit(failed ? 1 : 0);
