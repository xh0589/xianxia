// tide-siege-node.js — 第二十五波 · 兽潮压山门（潮活期间日日掷骰真仗·胜则兽核入囊·败则库房遭殃）vm 沙箱测试
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
    const wSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-war.js'), 'utf8');
    ok(wSrc.includes('startTideSiege') && wSrc.includes('settleTideSiege') && wSrc.includes('_isTideSiegeBattle'), 'A1 兽潮压山门三件套挂在战争引擎里');
    ok(wSrc.includes('tideSiegeDayTick') && wSrc.includes('0.05 + lv * 0.02'), 'A2 日骰随潮级涨（潮越大扑山越凶）');
    ok(wSrc.includes('getSectFormationActive') && wSrc.includes('warEdge(psHome, enemy)'), 'A3 护山阵与镇山秘艺照常出力');
    ok(!/today|probabilistically/.test(wSrc.slice(wSrc.indexOf('兽潮压山门'))), 'A4 新段落零外文字母');
    const appSrc = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
    const hits = appSrc.split('_isTideSiegeBattle').length - 1;
    ok(hits >= 2, 'A5 胜败两条结算分支都认兽潮压山战（' + hits + ' 处）');
}

// ---------- 沙箱 ----------
const REALMS = ['凡人', '炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'];
function makeSandbox(opts) {
    opts = opts || {};
    const stt = { msgs: [], logs: [], chron: [], wallet: opts.wallet != null ? opts.wallet : 600, battles: [], items: [], wounds: 0, dayHandlers: [] };
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
        WorldCalendar: { day: opts.day || 105 },
        EventBus: {
            _h: {},
            on: function (ev, fn) { (this._h[ev] = this._h[ev] || []).push(fn); },
            emit: function (ev, p) { (this._h[ev] || []).forEach(function (f) { try { f(p); } catch (e) {} }); }
        },
        npcManager: { getNPC: function (id) { return npcs[id] || null; }, getAllNPCs: function () { return Object.keys(npcs).map(function (k) { return npcs[k]; }); }, getNearbyNPCs: function () { return []; } },
        currentCharData: { name: '李长风', fame: 0, energy: 100, realm: '炼气', tempering: 0 },
        discipleState: opts.disciple ? { isInSect: true, sectName: '铁掌帮', sectId: '铁掌帮', rank: 2, contribution: 0 } : { isInSect: false, contribution: 0, rank: null },
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
        addItem: function (id, n) { stt.items.push({ id: id, n: n }); return true; },
        applyBeastTideDefeatWound: function () { stt.wounds++; return { healthLost: 10, energyLost: 5 }; },
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
        showModal: function () {},
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
    ['js/extensions/player-sect.js', 'js/extensions/player-sect-bootstrap.js', 'js/extensions/player-sect-venture.js',
     'js/extensions/player-sect-world.js', 'js/extensions/player-sect-life.js', 'js/sects/sect-war.js',
     'js/extensions/formation-system.js', 'js/extensions/beast-tide.js'].forEach(function (f) {
        vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sandbox);
    });
    function found(name) { const r = W.PSBoot.foundCheap(name || '长风门', '中立'); return r.ok ? r.sect : null; }
    function newDay(d, randV) {
        W.timeSystem.gameTime.currentDay = d;
        W.WorldCalendar.day = d;
        const run = function () {
            W.EventBus.emit('newDay', { newDay: d });
            stt.dayHandlers.forEach(function (h) { try { h(); } catch (e) {} });
        };
        if (randV != null) withRandom(randV, run); else run();
    }
    return { W: W, stt: stt, npcs: npcs, found: found, newDay: newDay };
}
const GUARD_KIT = [['fmt_stone_basic', 10], ['fmt_flag_gold', 4], ['fmt_eye_spirit', 1]];
function give(env, items) { items.forEach(function (it) { env.W.inventory.slots.push({ itemId: it[0], count: it[1] }); }); }

// ---------- B · 压山触发 ----------
console.log('\n[B] 兽潮压山门（潮活期间日日掷骰）');
{
    const env = makeSandbox({ wallet: 500 });
    env.found();
    env.W.BeastTide.triggerTide('tide_5', {});
    env.newDay(110, 0.10); // 大兽潮：一日一成半的骰，0.10 应验
    const b = env.W.currentBattle;
    ok(b && b._isTideSiegeBattle, 'B1 兽潮真扑山门（真仗开打）');
    eq(b && b._tideSiegeLevel, 5, 'B2 战局带着潮级');
    eq(b && b._tideHome, '长风门', 'B3 自建山门入战局（结算走自家真账）');
    ok(b && b.enemy.name.includes('叩门兽群'), 'B4 来的是兽群不是人');
    // 骰子不应验就不来
    const env2 = makeSandbox({ wallet: 500 });
    env2.found();
    env2.W.BeastTide.triggerTide('tide_2', {});
    env2.newDay(110, 0.5); // 微兽潮 p=0.09，0.5 不应验
    ok(!env2.W.currentBattle, 'B5 骰子不应验，山门清净');
    // 没有山门的人兽潮不理
    const env3 = makeSandbox({ wallet: 500 });
    env3.W.BeastTide.triggerTide('tide_5', {});
    env3.newDay(110, 0.0);
    ok(!env3.W.currentBattle, 'B6 没有山门的散修，兽潮与他无干');
    // 潮散了就没事
    const env4 = makeSandbox({ wallet: 500 });
    env4.found();
    env4.newDay(110, 0.0);
    ok(!env4.W.currentBattle, 'B7 没有兽潮，山门照常过日子');
}

// ---------- C · 战力与折敌 ----------
console.log('\n[C] 兽群战力随潮级涨，秘艺护山阵照常出力');
{
    const env = makeSandbox({ wallet: 500 });
    env.found();
    env.W.BeastTide.triggerTide('tide_5', {});
    env.newDay(110, 0.10);
    eq(env.W.currentBattle.enemy.attack, 57, 'C1 大兽潮叩门：攻势随潮级涨（炼气掌门见 57）');
    // 护山阵
    const env2 = makeSandbox({ wallet: 500 });
    env2.found();
    give(env2, GUARD_KIT);
    env2.W.FormationSystem.deployFormation('fmt_mountain_guard');
    env2.W.BeastTide.triggerTide('tide_5', {});
    env2.newDay(110, 0.10);
    eq(env2.W.currentBattle.enemy.attack, 29, 'C2 护山阵对兽群一样管用（攻势折半 57→29）');
    ok(env2.W.FormationSystem.getState().sect.durability < 30, 'C3 兽群撞阵，阵旗也磨损');
    // 秘艺
    const env3 = makeSandbox({ wallet: 500 });
    const ps3 = env3.found();
    ps3.stage = 2;
    ps3.resources.spiritStones = 300;
    env3.W.PSectWorld.syncMirror('长风门');
    withRandom(0.5, function () { env3.W.PSectLife.composeArt(); });
    env3.W.BeastTide.triggerTide('tide_5', {});
    env3.newDay(110, 0.10);
    eq(env3.W.currentBattle.enemy.attack, 55, 'C4 镇山秘艺对兽群也折敌三分（57→55）');
}

// ---------- D · 守住了 ----------
console.log('\n[D] 守住了：兽核入囊、历练入账、山门长脸');
{
    const env = makeSandbox({ wallet: 500 });
    const ps = env.found();
    env.recruit = function (id) { try { env.W.PlayerSect.recruitDisciple(ps.id, id); } catch (e) {} };
    env.recruit('d1');
    env.newDay(120); // 宗谱发牌
    ps.resources.spiritStones = 300;
    env.W.PSectWorld.syncMirror('长风门');
    const rep0 = Number(ps.resources.reputation);
    env.W.currentBattle = { _isTideSiegeBattle: true, _tideSiegeLevel: 5, _tideHome: '长风门' };
    withRandom(0.5, function () { env.W.settleTideSiege(true); });
    eq(env.stt.items.length, 1, 'D1 兽核真入囊');
    eq(env.stt.items[0].id, 'mat_demon_beast_core', 'D2 入囊的是兽核（与清剿同一种真货）');
    eq(env.stt.items[0].n, 3, 'D3 潮越大核越多（五级潮：3 枚）');
    eq(Number(env.W.currentCharData.tempering), 65, 'D4 历练真入账（40+潮级×5）');
    eq(Number(ps.resources.reputation), rep0 + 2, 'D5 打退兽潮，山门长脸（声望+2）');
    ok(env.stt.chron.some(function (t) { return t.includes('兽群扑到山门下'); }), 'D6 编年记下这一仗');
    ok((env.W.eventFlags.qi_street || []).some(function (s) { return s.text.includes('兽潮都撞不开'); }), 'D7 街谈传扬');
}

// ---------- E · 没守住 ----------
console.log('\n[E] 没守住：库房遭殃、带伤、可能有人没能回来');
{
    const env = makeSandbox({ wallet: 500 });
    const ps = env.found();
    try { env.W.PlayerSect.recruitDisciple(ps.id, 'd1'); } catch (e) {}
    env.newDay(120);
    ps.resources.spiritStones = 300;
    env.W.PSectWorld.syncMirror('长风门');
    env.W.currentBattle = { _isTideSiegeBattle: true, _tideSiegeLevel: 5, _tideHome: '长风门' };
    withRandom(0.5, function () { env.W.settleTideSiege(false); }); // 死签不应验
    eq(ps.resources.spiritStones, 210, 'E1 库房被兽群糟蹋（五级潮折 90，真账两讫）');
    eq(env.W.SECT_INTERNAL['长风门'].resources, 210, 'E2 镜像同数');
    eq(env.stt.wounds, 1, 'E3 人带伤（与清剿受挫同口径）');
    eq((ps.disciples || []).length, 1, 'E4 死签没应验，人都在');
    ok(env.stt.chron.some(function (t) { return t.includes('撞开了一角'); }), 'E5 编年记耻');
    // 死签应验
    const env2 = makeSandbox({ wallet: 500 });
    const ps2 = env2.found();
    try { env2.W.PlayerSect.recruitDisciple(ps2.id, 'd1'); } catch (e) {}
    env2.newDay(120);
    ps2.resources.spiritStones = 300;
    env2.W.PSectWorld.syncMirror('长风门');
    env2.W.currentBattle = { _isTideSiegeBattle: true, _tideSiegeLevel: 5, _tideHome: '长风门' };
    withRandom(0.01, function () { env2.W.settleTideSiege(false); });
    eq((ps2.disciples || []).length, 0, 'E6 死签应验——有一位没能回来');
    ok(env2.npcs.d1.isDead, 'E7 人是真殁了');
    const row = ((ps2._book || {}).rows || []).filter(function (r) { return r.npcId === 'd1'; })[0];
    ok(row && row.fate === '殁于任', 'E8 宗谱记殁');
    eq(ps2.resources.spiritStones, 300 - 90 - 20, 'E9 库房遭殃之外，治丧抚恤照礼出库');
    // 下山办差的殁不到山门上
    const env3 = makeSandbox({ wallet: 500 });
    const ps3 = env3.found();
    try { env3.W.PlayerSect.recruitDisciple(ps3.id, 'd1'); } catch (e) {}
    env3.newDay(120);
    env3.W.PSectLife.sendAway('d1', 'train');
    ps3.resources.spiritStones = 300;
    env3.W.PSectWorld.syncMirror('长风门');
    env3.W.currentBattle = { _isTideSiegeBattle: true, _tideSiegeLevel: 5, _tideHome: '长风门' };
    withRandom(0.01, function () { env3.W.settleTideSiege(false); });
    ok(!env3.npcs.d1.isDead && (ps3.disciples || []).length === 1, 'E10 独苗在山下历练——兽潮的死人签落不到他头上');
}

// ---------- F · 弟子身：师门的山门也是山门 ----------
console.log('\n[F] 弟子身（师门山门同一口径）');
{
    const env = makeSandbox({ wallet: 500, disciple: true });
    env.W.BeastTide.triggerTide('tide_5', {});
    env.newDay(110, 0.10);
    const b = env.W.currentBattle;
    ok(b && b._isTideSiegeBattle && !b._tideHome, 'F1 弟子身也迎战，战局不带自家山门（账落师门）');
    env.W.settleTideSiege(true);
    eq(env.W.discipleState.contribution, 40, 'F2 守胜记贡献（护山门之功）');
    const env2 = makeSandbox({ wallet: 500, disciple: true });
    env2.W.BeastTide.triggerTide('tide_5', {});
    env2.newDay(110, 0.10);
    env2.W.settleTideSiege(false);
    eq(env2.W.SECT_INTERNAL['铁掌帮'].resources, 210, 'F3 守败师门库房折损（90）');
    eq(env2.W.SECT_INTERNAL['铁掌帮'].morale, 42, 'F4 师门士气受挫（-8）');
}

// ---------- G · 盟家上墙头（第二十七波 · 兽潮共守） ----------
console.log('\n[G] 盟家上墙头：自家山门遭兽围，盟家来援真折兽群凶性');
{
    const env = makeSandbox({ wallet: 500 });
    env.found();
    const dip = env.W.SECT_DIPLOMACY_STATE;
    dip['长风门']['血手门'].treaties.push('alliance');
    dip['血手门']['长风门'].treaties.push('alliance');
    dip['长风门']['血手门'].relation = 60;
    dip['血手门']['长风门'].relation = 60;
    env.W.BeastTide.triggerTide('tide_5', {});
    env.newDay(110, 0.01); // 自家骰应验，盟家骰（交情60→六成四）也应验
    const b = env.W.currentBattle;
    ok(b && b._isTideSiegeBattle, 'G1 兽潮照样扑山门');
    ok(b && (b._tideAllies || []).indexOf('血手门') >= 0, 'G2 盟家领众上了墙头（名单随战局走）');
    eq(b && b.enemy.attack, 51, 'G3 来一家折一成凶性（57→51）');
    ok(env.stt.logs.some(function (t) { return t.includes('上了墙头'); }), 'G4 来援有兽潮话术（不是分兵那套）');
    env.W.settleTideSiege(true);
    eq(dip['长风门']['血手门'].relation, 65, 'G5 守住了——上墙头的盟家情分+5（两家同数）');
    ok(env.stt.chron.some(function (t) { return t.includes('领众援「长风门」退兽潮'); }), 'G6 盟家编年互记');
    // 败了也记情分
    const env2 = makeSandbox({ wallet: 500 });
    env2.found();
    const dip2 = env2.W.SECT_DIPLOMACY_STATE;
    dip2['长风门']['血手门'].treaties.push('alliance');
    dip2['血手门']['长风门'].treaties.push('alliance');
    dip2['长风门']['血手门'].relation = 60;
    env2.W.BeastTide.triggerTide('tide_5', {});
    env2.newDay(110, 0.01);
    withRandom(0.5, function () { env2.W.settleTideSiege(false); }); // 死签不应验
    eq(dip2['长风门']['血手门'].relation, 62, 'G7 没守住——援而不胜，来的盟家情分也记+2');
}

// ---------- H · 江湖潮讯（别家山门也遭兽围） ----------
console.log('\n[H] 江湖潮讯：潮活期间别家山门也遭围，后台真结算');
{
    // 败：五级潮压中等座次（150分），守不住
    const env = makeSandbox({ wallet: 500 });
    env.W.BeastTide.triggerTide('tide_5', {});
    env.newDay(110, 0.17); // 散修没有自家山门——直接掷江湖潮讯（p=0.20 应验）
    ok(!env.W.currentBattle, 'H1 别家遭围不动玩家的仗');
    const it = env.W.SECT_INTERNAL['铁掌帮'];
    eq(it.resources, 210, 'H2 守不住——库房真折损（五级潮折90）');
    eq(it.disciples, 19, 'H3 门人真殒命（折1位）');
    eq(it.morale, 42, 'H4 士气受挫（-8）');
    ok(env.stt.chron.some(function (t) { return t.includes('兽群撞开了一角'); }), 'H5 编年记耻');
    ok((env.W.eventFlags.qi_street || []).some(function (s) { return s.text.includes('埋在了后山'); }), 'H6 街谈传扬');
    // 胜：一级潮是搔扰，守得住
    const env2 = makeSandbox({ wallet: 500 });
    env2.W.BeastTide.triggerTide('tide_1', {});
    env2.newDay(110, 0.05); // p=0.12 应验
    const it2 = env2.W.SECT_INTERNAL['铁掌帮'];
    eq(it2.resources, 300, 'H7 守住了——库房分文未动');
    eq(it2.morale, 56, 'H8 士气大振（+6）');
    ok(env2.stt.chron.some(function (t) { return t.includes('打了回去'); }), 'H9 编年记功');
    // 没有潮就没有潮讯
    const env3 = makeSandbox({ wallet: 500 });
    env3.newDay(110, 0.0);
    eq(env3.W.SECT_INTERNAL['铁掌帮'].resources, 300, 'H10 潮散了，江湖各家照常过日子');
}

// ---------- I · 盟家被围 → 提兵相助 ----------
console.log('\n[I] 盟家被围：潮讯挂风云册，掌门提兵相助真仗');
{
    function allyEnv() {
        const env = makeSandbox({ wallet: 500 });
        env.found();
        delete env.W.sectsData['铁掌帮']; // 江湖上只剩血手门一家候选——骰子指谁就是谁
        const dip = env.W.SECT_DIPLOMACY_STATE;
        dip['长风门']['血手门'].treaties.push('alliance');
        dip['血手门']['长风门'].treaties.push('alliance');
        const tr = env.W.BeastTide.triggerTide('tide_5', {});
        env.tideId = tr.tideId;
        env.newDay(110, 0.17); // 自家骰（0.15）不应验，江湖潮讯（0.20）应验，围的正是盟家
        return env;
    }
    const env = allyEnv();
    ok(!env.W.currentBattle, 'I1 盟家被围——潮讯先挂着，不直接开打');
    const p = env.W.eventFlags['sect_world_tide_pending'];
    ok(p && p.sect === '血手门' && p.lv === 5, 'I2 潮讯记着是谁、几级潮');
    eq(p && p.resolveDay, 111, 'I3 一日窗口——明日落定');
    ok(env.stt.logs.some(function (t) { return t.includes('提兵相助'); }), 'I4 急报告知了去路');
    const rel0 = env.W.SECT_DIPLOMACY_STATE['长风门']['血手门'].relation;
    env.W.doTideAllyRescue();
    const b = env.W.currentBattle;
    ok(b && b._isTideAllyBattle && b._tideAllySect === '血手门' && b._warHome === '长风门', 'I5 提兵是真仗（战局带着盟家与自家山门）');
    eq(env.W.eventFlags['sect_world_tide_pending'], null, 'I6 出兵了，潮讯从风云册上摘下');
    eq(b.enemy.attack, 57, 'I7 围山的兽群原样在那（五级潮 57）');
    env.W.settleTideAllyRescue(true);
    const ps = env.W.PSectWorld.byName('长风门');
    eq(env.W.SECT_INTERNAL['血手门'].resources, 440, 'I8 谢礼守恒——真从盟家库房里出（500→440）');
    eq(ps.resources.spiritStones, 60, 'I9 谢礼真进自家宗库');
    eq(env.W.SECT_DIPLOMACY_STATE['长风门']['血手门'].relation, rel0 + 25, 'I10 盟好如金石（关系+25）');
    eq(env.stt.items.length, 1, 'I11 打下兽核归驰援的人（五级潮2枚）');
    eq(env.stt.items[0] && env.stt.items[0].n, 2, 'I12 兽核数目对');
    eq(Number(env.W.currentCharData.tempering), 50, 'I13 历练入账（30+潮级×4）');
    ok(env.stt.chron.some(function (t) { return t.includes('盟书添了实证'); }), 'I14 两家编年互记');
    ok((env.W.eventFlags.qi_street || []).some(function (s) { return s.text.includes('江湖佳话'); }), 'I15 街谈传扬这段义气');
    // 败：围没解，盟家还得自己熬——骰子照掷
    const env2 = allyEnv();
    env2.W.doTideAllyRescue();
    const rel2 = env2.W.SECT_DIPLOMACY_STATE['长风门']['血手门'].relation;
    withRandom(0.5, function () { env2.W.settleTideAllyRescue(false); });
    eq(env2.stt.wounds, 1, 'I16 驰援失利——人带伤（与清剿受挫同口径）');
    eq(env2.W.SECT_INTERNAL['血手门'].resources, 410, 'I17 援军败了，盟家山门照旧遭殃（折90）');
    eq(env2.W.SECT_DIPLOMACY_STATE['长风门']['血手门'].relation, rel2 + 5, 'I18 援虽不成，这份情记下（+5）');
    // 不出兵：明日潮讯自决
    const env3 = allyEnv();
    env3.newDay(111, 0.5); // 自家骰与潮讯骰都不应验，只有昨日的潮讯落定
    eq(env3.W.eventFlags['sect_world_tide_pending'], null, 'I19 援手没出，潮讯次日自落定');
    eq(env3.W.SECT_INTERNAL['血手门'].resources, 410, 'I20 盟家自己没熬过去——库房真折');
    // 潮先散了：围山的兽群自散，盟家熬过去
    const env4 = allyEnv();
    env4.W.BeastTide.endTide(env4.tideId);
    env4.newDay(111, 0.5);
    eq(env4.W.SECT_INTERNAL['血手门'].resources, 500, 'I21 潮散了——山门熬了过去，库房分文未动');
    ok(env4.stt.chron.some(function (t) { return t.includes('随大潮自散'); }), 'I22 编年记下这一夜');
}

// ---------- J · 接线（第二十七波） ----------
console.log('\n[J] 接线');
{
    const wSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-war.js'), 'utf8');
    ok(wSrc.includes('doTideAllyRescue') && wSrc.includes('settleTideAllyRescue') && wSrc.includes('sect_world_tide_pending'), 'J1 驰援三件套挂在战争引擎里');
    ok(wSrc.includes('resolveTidePending') && wSrc.includes('worldTideTick'), 'J2 日钩先落潮讯、再掷江湖骰');
    ok(!/today|probabilistically/.test(wSrc.slice(wSrc.indexOf('兽潮共守'))), 'J3 新段落零外文字母');
    const appSrc = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
    const hits = appSrc.split('_isTideAllyBattle').length - 1;
    ok(hits >= 2, 'J4 胜败两条结算分支都认驰援战（' + hits + ' 处）');
    const dSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-diplomacy-world.js'), 'utf8');
    ok(dSrc.includes('doTideAllyRescue') && dSrc.includes('潮讯'), 'J5 风云册挂潮讯一栏（按钮直达）');
    const pSrc = fs.readFileSync(path.join(ROOT, 'js/extensions/player-sect-world.js'), 'utf8');
    ok(pSrc.includes("kind === 'tide'"), 'J6 盟家来援认兽潮话术');
}

// ---------- K · 挨过潮的要喘气（第三十波 · 数值过秤） ----------
console.log('\n[K] 喘气账：潮战一场歇三日、别家遭围歇五日');
{
    // 自家山门：潮战一场（无论胜败）歇三日
    const env = makeSandbox({ wallet: 500 });
    env.found();
    env.W.BeastTide.triggerTide('tide_5', {});
    env.newDay(110, 0.10); // 潮战开打
    ok(env.W.currentBattle, 'K1 潮战开打');
    env.W.settleTideSiege(true);
    env.W.currentBattle = null; // 仗打完了（正身里由主流程收场）
    eq(Number(env.W.eventFlags['tide_rest_长风门'] || 0), 113, 'K2 歇三日的账记下了');
    env.newDay(111, 0.0); // 骰子必应验，但在歇气
    ok(!env.W.currentBattle, 'K3 歇气期间山门不再挨打（仙劫潮也打不出死亡螺旋）');
    env.W.currentBattle = null;
    env.newDay(113, 0.0); // 歇满了
    ok(env.W.currentBattle && env.W.currentBattle._isTideSiegeBattle, 'K4 歇满了，潮还能再来（天灾该是天灾）');
    // 别家：遭过围的人家歇五日——骰子去找别家
    const env2 = makeSandbox({ wallet: 500 });
    env2.W.BeastTide.triggerTide('tide_5', {});
    env2.newDay(110, 0.17); // 铁掌帮遭围（候选头一家），后台自决
    const res1 = env2.W.SECT_INTERNAL['铁掌帮'].resources;
    eq(res1, 210, 'K5 头一日挨打的是铁掌帮');
    env2.newDay(111, 0.0); // 铁掌帮在歇气——骰子只剩血手门可选
    eq(env2.W.SECT_INTERNAL['铁掌帮'].resources, res1, 'K6 挨过潮的人家不再连日挨打');
    eq(env2.W.SECT_INTERNAL['血手门'].resources, 410, 'K7 潮讯去找了别家（血手门挨了这一下）');
    // 驰援救下的山门也歇气
    const env3 = makeSandbox({ wallet: 500 });
    env3.found();
    delete env3.W.sectsData['铁掌帮'];
    const dip3 = env3.W.SECT_DIPLOMACY_STATE;
    dip3['长风门']['血手门'].treaties.push('alliance');
    dip3['血手门']['长风门'].treaties.push('alliance');
    env3.W.BeastTide.triggerTide('tide_5', {});
    env3.newDay(110, 0.17); // 盟家被围，潮讯挂着
    env3.W.doTideAllyRescue();
    env3.W.settleTideAllyRescue(true);
    ok(Number(env3.W.eventFlags['tide_rest_血手门'] || 0) > 110, 'K8 救下来的山门也喘气——兽群败一阵不会掉头再来');
}

// ---------- L · 道侣上墙头（第三十二波） ----------
console.log('\n[L] 道侣上墙头：家里人在墙上，敌人未战先怯');
{
    const env = makeSandbox({ wallet: 500 });
    const ps = env.found();
    ps.resources.spiritStones = 300;
    env.W.PSectWorld.syncMirror('长风门');
    try { env.W.PlayerSect.recruitDisciple(ps.id, 'd1'); } catch (e) {}
    try { env.W.PlayerSect.recruitDisciple(ps.id, 'd2'); } catch (e) {}
    env.W.PSectLife.bondUp(env.npcs.d1, env.npcs.d2, 70, '长风门');
    ok(env.W.PSectLife.marryPair('d1', 'd2'), 'L1 门里办成了婚事');
    eq(env.W.PSectLife.daoPairsAtHome('长风门'), 1, 'L2 墙头数得出一对家里人');
    env.W.BeastTide.triggerTide('tide_5', {});
    env.newDay(110, 0.10);
    eq(env.W.currentBattle.enemy.attack, 55, 'L3 道侣上墙头——兽群凶性再折三分（57→55）');
    ok(env.stt.logs.some(t => t.includes('道侣上墙头')), 'L4 墙头有话术落地');
    // 下了山的人上不了墙
    env.W.currentBattle = null;
    env.W.PSectLife.sendAway('d2', 'errand');
    eq(env.W.PSectLife.daoPairsAtHome('长风门'), 0, 'L5 一人下山——墙头只剩半家，对子不算');
}

console.log('\n========== 第二十五波 · 兽潮压山门（第二十七波 · 兽潮共守） ==========');
console.log('通过：' + pass + '　失败：' + fail);
process.exit(fail ? 1 : 0);
