// sect-guard-formation-node.js — 第二十三波 · 护山阵真管事（宗门阵死账接通：守山折敌/迷踪压仇/维持真扣/灵兽园桥）vm 沙箱测试
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');

let pass = 0, fail = 0;
function ok(cond, name) {
    if (cond) { pass++; console.log('  ✓ ' + name); }
    else { fail++; console.error('  ✗ ' + name); }
}
function eq(a, b, name) { ok(a === b, name + '（实际=' + JSON.stringify(a) + ' 期望=' + JSON.stringify(b) + '）'); }
function withRandom(v, fn) { const o = Math.random; Math.random = function () { return v; }; try { return fn(); } finally { Math.random = o; } }

// ---------- A · 接线 ----------
console.log('\n[A] 接线');
{
    const fSrc = fs.readFileSync(path.join(ROOT, 'js/extensions/formation-system.js'), 'utf8');
    ok(fSrc.includes('getSectFormationActive') && fSrc.includes('wearSectFormation') && fSrc.includes('dailyUpkeep'), 'A1 阵法模块长出宗门阵三接口');
    ok(fSrc.includes('syncStonesFromWallet') && fSrc.includes('payRealStones'), 'A2 账房对真钱包（布阵与日结都走真钱）');
    ok(fSrc.includes("EventBus.on('newDay'") || fSrc.includes('onNewDaySubscribe'), 'A3 日结维持挂在日钩上（此前 tickTurn 无人调用）');
    const wSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-war.js'), 'utf8');
    ok(wSrc.includes('getSectFormationActive') && wSrc.includes('sectAttackReducePct') && wSrc.includes('wearSectFormation(2)'), 'A4 守山战读护山阵（折敌攻势+阵旗磨损）');
    ok(wSrc.includes('sectGrudgeReducePct') && wSrc.includes('warP'), 'A5 死仇日骰读迷踪阵（寻仇被压）');
    const cSrc = fs.readFileSync(path.join(ROOT, 'js/crafting/compound-ui.js'), 'utf8');
    ok(!cSrc.includes('_payStones(f.spiritStonesPerTurn)'), 'A6 布阵界面不再双扣首期阵费（账在阵法模块一处结清）');
    const wlSrc = fs.readFileSync(path.join(ROOT, 'js/core/world-loop.js'), 'utf8');
    ok(wlSrc.includes('PlayerSect.listMySects') && wlSrc.includes('散修园'), 'A7 灵兽培养线认自建宗门的园（与建园同一把尺）');
    const uiSrc = fs.readFileSync(path.join(ROOT, 'js/extensions/player-sect-ui.js'), 'utf8');
    ok(uiSrc.includes('getSectFormationActive'), 'A8 宗门总册亮阵法状态');
    ok(!/冷却|次数上限|配额/.test(fSrc), 'A9 阵法模块零配额句式（维持费/磨损都是制度话）');
}

// ---------- 沙箱 ----------
const REALMS = ['凡人', '炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'];
function makeSandbox(opts) {
    opts = opts || {};
    const stt = { modals: [], msgs: [], logs: [], chron: [], wallet: opts.wallet != null ? opts.wallet : 600, battles: [], dayHandlers: [] };
    const npcs = {};
    function mkNpc(id, name) { const n = { id: id, name: name, isDead: false, location: '青木城', relationship: { affection: 0 }, combat: { realm: '炼气', layer: 1 } }; npcs[id] = n; return n; }
    mkNpc('d1', '王大牛'); mkNpc('d2', '柳三娘');
    const W = {
        timeSystem: {
            gameTime: { currentDay: opts.day || 105, currentHour: 12 },
            advanceTime: function () {},
            getAbsoluteDay: function () { return W.timeSystem.gameTime.currentDay; },
            onNewDaySubscribe: function (fn) { stt.dayHandlers.push(fn); }
        },
        getAbsoluteDay: function () { return W.timeSystem.gameTime.currentDay; },
        EventBus: {
            _h: {},
            on: function (ev, fn) { (this._h[ev] = this._h[ev] || []).push(fn); },
            emit: function (ev, p) { (this._h[ev] || []).forEach(function (f) { try { f(p); } catch (e) {} }); }
        },
        npcManager: { getNPC: function (id) { return npcs[id] || null; }, getAllNPCs: function () { return Object.keys(npcs).map(function (k) { return npcs[k]; }); }, getNearbyNPCs: function () { return []; } },
        currentCharData: { name: '李长风', fame: 0, energy: 100, realm: '炼气' },
        discipleState: { isInSect: false, contribution: 0, rank: null },
        sectsData: {
            '铁掌帮': { name: '铁掌帮', type: '中立', power: '中等', location: '中州' },
            '血手门': { name: '血手门', type: '邪派', power: '中等', location: '北冥' }
        },
        SECT_INTERNAL: {
            '铁掌帮': { disciples: 20, resources: 300, influence: 50, morale: 50, chronicle: [] },
            '血手门': { disciples: 18, resources: 500, influence: 40, morale: 50, chronicle: [] }
        },
        SECT_DIPLOMACY_STATE: {},
        eventFlags: {},
        inventory: { currency: { spiritStones: stt.wallet }, slots: [] },
        DataManager: {
            getSpiritStones: function () { return stt.wallet; },
            deductSpiritStones: function (n) { if (stt.wallet >= n) { stt.wallet -= n; W.inventory.currency.spiritStones = stt.wallet; return true; } return false; },
            addSpiritStones: function (n) { stt.wallet += n; W.inventory.currency.spiritStones = stt.wallet; }
        },
        SectGov: { chronicle: function (s, t) { stt.chron.push(String(t)); } },
        sectPowerNow: function () { return { tier: '中等', score: 150 }; },
        sectAlignNow: function () { return { align: 0 }; },
        sectPowerWarMul: function () { return 1.0; },
        sectPowerWarMod: function () {},
        sectAlignShift: function () {},
        sectIsRuined: function () { return false; },
        saveSectDiplomacy: function () {},
        locationSystem: { getCurrentLocation: function () { return '洛水城'; } },
        getRealmTier: function (r) { const i = REALMS.indexOf(String(r || '')); return i >= 0 ? i : 1; },
        realmScaledEnemyLevel: function () { return 3; },
        showMessage: function (m) { stt.msgs.push(String(m)); },
        gameLog: { add: function (m) { stt.logs.push(String(m)); } },
        showModal: function (t, b) { stt.modals.push({ title: t, body: String(b) }); },
        openPlayerSectPanel: function () {},
        startBattle: function (en) { W.currentBattle = { enemy: en }; stt.battles.push(W.currentBattle); return W.currentBattle; }
    };
    W.XianXia = { DataManager: W.DataManager };
    W.window = W;
    const sandbox = {
        window: W, console: { log: function () {} },
        Math: Math, Number: Number, String: String, JSON: JSON, Object: Object, Array: Array, Date: Date, RegExp: RegExp,
        parseInt: parseInt, parseFloat: parseFloat, isFinite: isFinite,
        document: { getElementById: function () { return null; } },
        localStorage: { getItem: function () { return null; }, setItem: function () {} }
    };
    vm.createContext(sandbox);
    const files = ['js/extensions/player-sect.js', 'js/extensions/player-sect-bootstrap.js', 'js/extensions/player-sect-venture.js',
        'js/extensions/player-sect-world.js', 'js/extensions/player-sect-life.js', 'js/sects/master-teach.js',
        'js/sects/sect-war.js', 'js/extensions/formation-system.js'].concat(opts.extra || []);
    files.forEach(function (f) { vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sandbox); });
    function found(name) { const r = W.PSBoot.foundCheap(name || '长风门', '中立'); return r.ok ? r.sect : null; }
    function give(items) { items.forEach(function (it) { W.inventory.slots.push({ itemId: it[0], count: it[1] }); }); }
    function foe(rel) {
        const D = W.SECT_DIPLOMACY_STATE;
        if (D['长风门'] && D['长风门']['血手门']) { D['长风门']['血手门'].relation = rel; D['血手门']['长风门'].relation = rel; }
    }
    function newDay(d, randV) {
        W.timeSystem.gameTime.currentDay = d;
        const run = function () {
            W.EventBus.emit('newDay', { newDay: d });
            stt.dayHandlers.forEach(function (h) { try { h(); } catch (e) {} });
        };
        if (randV != null) withRandom(randV, run); else run();
    }
    return { W: W, stt: stt, npcs: npcs, found: found, give: give, foe: foe, newDay: newDay };
}
const GUARD_KIT = [['fmt_stone_basic', 10], ['fmt_flag_gold', 4], ['fmt_eye_spirit', 1]];
const MAZE_KIT = [['fmt_stone_basic', 6], ['fmt_eye_void', 2], ['fmt_flag_iron', 3]];

// ---------- B · 布阵与日结维持（真钱） ----------
console.log('\n[B] 布阵与日结维持（阵费从真钱包出，扣不起阵就散）');
{
    const env = makeSandbox({ wallet: 500 });
    env.give(GUARD_KIT);
    const FS = env.W.FormationSystem;
    const r = FS.deployFormation('fmt_mountain_guard');
    ok(r.ok, 'B1 护山阵布阵成行');
    eq(env.stt.wallet, 492, 'B2 首期阵费八石从真钱包出库');
    const basic = env.W.inventory.slots.filter(function (s) { return s.itemId === 'fmt_stone_basic'; })[0];
    ok(!basic || (basic.count || 0) === 0, 'B3 阵材真消耗（基础阵石十枚用尽）');
    eq(FS.getState().sect.durability, 30, 'B4 阵旗满耐久三十');
    env.newDay(106);
    eq(env.stt.wallet, 484, 'B5 日结维持真扣八石');
    eq(FS.getState().sect.durability, 29, 'B6 阵旗按日老一分');
    // 钱断了阵就散
    env.stt.wallet = 3; env.W.inventory.currency.spiritStones = 3;
    env.newDay(107);
    ok(!FS.getState().sect.formationId, 'B7 维持费断供，阵散了（不再白挂）');
    ok(env.stt.msgs.some(function (m) { return m.includes('散了'); }), 'B8 散阵有名有姓报出来');
}

// ---------- C · 护山阵真守山 ----------
console.log('\n[C] 护山阵真守山（守山战折敌攻势，阵旗经战磨损）');
{
    const env = makeSandbox({ wallet: 500 });
    env.give(GUARD_KIT);
    env.W.FormationSystem.deployFormation('fmt_mountain_guard');
    const ps = env.found();
    ok(!!ps, 'C1 立宗落座');
    env.foe(-80);
    env.W.currentBattle = null;
    env.newDay(141, 0.01); // 死仇压山，骰子应验
    const b = env.W.currentBattle;
    ok(b && b._isSectWarBattle && b._warSide === 'defend', 'C2 死仇压山真仗开打');
    eq(b.enemy.attack, 23, 'C3 护山阵灵光升起——敌攻势折半（45→23）');
    ok(env.stt.logs.some(function (t) { return t.includes('护山阵'); }), 'C4 阵法参战有报');
    eq(env.W.FormationSystem.getState().sect.durability, 27, 'C5 一场恶战阵旗磨两分（外加日老一分）');
    // 磨尽阵散
    env.W.FormationSystem.getState().sect.durability = 2;
    env.W.currentBattle = null;
    env.newDay(142, 0.01);
    ok(env.W.currentBattle && env.W.currentBattle.enemy.attack <= 23, 'C6 最后一战阵法照样出力');
    ok(!env.W.FormationSystem.getState().sect.formationId, 'C7 阵旗磨尽，护山阵散了');
}

// ---------- D · 迷踪阵真压寻仇 ----------
console.log('\n[D] 迷踪阵真压寻仇（死仇日骰被压三成）');
{
    // 有阵：0.03 的骰子落在 0.028 之外——这一日仇家摸不到山门
    const env = makeSandbox({ wallet: 500 });
    env.give(MAZE_KIT);
    env.W.FormationSystem.deployFormation('fmt_labyrinth');
    env.found();
    env.foe(-80);
    env.W.currentBattle = null;
    env.newDay(141, 0.03);
    ok(!env.W.currentBattle, 'D1 迷踪阵在，寻仇的骰子被压住（4%→2.8%）');
    // 无阵：同一支骰子，仗就来了
    const env2 = makeSandbox({ wallet: 500 });
    env2.found();
    env2.foe(-80);
    env2.W.currentBattle = null;
    env2.newDay(141, 0.03);
    ok(env2.W.currentBattle && env2.W.currentBattle._warSide === 'defend', 'D2 没有阵，同一支骰子就是兵临山门');
    eq(env2.W.currentBattle.enemy.attack, 45, 'D3 无阵之敌攻势原样（对照）');
}

// ---------- E · 灵兽园桥（自建宗门的园子培养线认得了） ----------
console.log('\n[E] 灵兽园桥（掌门建的园，培养线认账）');
{
    const env = makeSandbox({ wallet: 500, extra: ['js/extensions/beast-tide.js', 'js/core/world-loop.js'] });
    const ps = env.found();
    const bg = env.W.BeastGarden.build(ps.id, {});
    ok(bg.ok, 'E1 自建宗门名下建园成行');
    env.W.tamedBeasts = [{ uid: 'b1', templateId: 'beast_lingfox', exp: 0, level: 1 }];
    env.W.BeastGarden.addBeast(bg.gardenId, 'b1');
    const r = env.W.WorldLoop.trainHousedBeasts();
    ok(r && r.trained >= 1, 'E2 园中灵兽入了培养线（此前园建在宗门名下、培养线只认散修园，白修）');
    ok(env.W.tamedBeasts[0].exp > 4, 'E3 园子加成真吃到（驯养进账带灵兽园的两成）');
}

console.log('\n========== 第二十三波 · 护山阵真管事 ==========');
console.log('通过：' + pass + '　失败：' + fail);
process.exit(fail ? 1 : 0);
