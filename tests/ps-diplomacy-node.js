// ps-diplomacy-node.js — 第十九波 · 自建宗门外交线（结盟/送礼/兴兵/死仇压山/战事结算）vm 沙箱测试
// 第二十波追加：盟约联动（守山盟家来援削敌战力·战后记情分 / 盟家被围出兵相援·胜则战云散谢礼入库）
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
    const html = fs.readFileSync(path.join(ROOT, '仙侠.html'), 'utf8');
    ok(html.includes('js/extensions/player-sect-world.js') && html.includes('js/sects/sect-war.js'), 'A1 页面挂载两模块');
    const vSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-visit.js'), 'utf8');
    ok(vSrc.includes('_isPsHome') && vSrc.includes('psDiploAlly') && vSrc.includes('psDiploGift') && vSrc.includes('psDiploWar'), 'A2 外交面板认自家山门（结盟/送礼/兴兵三按钮）');
    ok(vSrc.includes('_inSect && !_isPsHome'), 'A3 贡献账按钮不上自家门面板（两本账不混）');
    ok(vSrc.includes('declareWarForHome(mySect, targetSect)') && vSrc.includes('window.psDiploAlly(targetSect)'), 'A4 旧征讨/结盟入口对自家山门改道真线');
    const wSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-war.js'), 'utf8');
    ok(wSrc.includes('_warHome') && wSrc.includes('PSectWorld.settlePsWar'), 'A5 战事结算认自家山门（转到外交线真账）');
    ok(wSrc.includes('homeNameOf') && wSrc.includes('declareWarForHome'), 'A6 死仇压山与殿议兴兵都认自家山门');
    const dSrc = fs.readFileSync(path.join(ROOT, 'js/extensions/player-sect-world.js'), 'utf8');
    ok(dSrc.includes('allianceFor') && dSrc.includes('giftFor') && dSrc.includes('settlePsWar') && dSrc.includes('spendTreasury'), 'A7 外交线四件套挂在四条线模块');
    ok(!dSrc.includes('confirm(') && !dSrc.includes('alert('), 'A8 零浏览器原生弹窗');
    ok(!/冷却中|次数上限|配额/.test(dSrc), 'A9 模块零配额句式（月一回是制度话）');
    const venSrc = fs.readFileSync(path.join(ROOT, 'js/extensions/player-sect-venture.js'), 'utf8');
    ok(venSrc.includes('bumpMoodAll'), 'A10 战事动全员心境有出口');
    ok(!/冷却|次数上限|配额/.test(wSrc), 'A11 战争模块零配额句式');
}

// ---------- 沙箱 ----------
function makeSandbox(opts) {
    opts = opts || {};
    const stt = { modals: [], msgs: [], logs: [], chron: [], wallet: opts.wallet != null ? opts.wallet : 600, battles: [], dipPanel: [], warMod: [], align: [], saved: 0 };
    const npcs = {};
    function mkNpc(id, name, loc) { const n = { id: id, name: name, isDead: false, location: loc || '青木城', relationship: { affection: 30 } }; npcs[id] = n; return n; }
    mkNpc('d1', '王大牛', '青木城'); mkNpc('d2', '柳三娘', '炎城'); mkNpc('d3', '赵铁柱', '金城');
    mkNpc('g1', '门客甲', '洛水城');
    const W = {
        timeSystem: {
            gameTime: { currentDay: opts.day || 105, currentHour: 12 },
            advanceTime: function () {},
            getAbsoluteDay: function () { return W.timeSystem.gameTime.currentDay; }
        },
        getAbsoluteDay: function () { return W.timeSystem.gameTime.currentDay; },
        EventBus: {
            _h: {},
            on: function (ev, fn) { (this._h[ev] = this._h[ev] || []).push(fn); },
            emit: function (ev, p) { (this._h[ev] || []).forEach(function (f) { try { f(p); } catch (e) {} }); }
        },
        npcManager: {
            getNPC: function (id) { return npcs[id] || null; },
            getAllNPCs: function () { return Object.keys(npcs).map(function (k) { return npcs[k]; }); },
            getNearbyNPCs: function () { return []; }
        },
        currentCharData: { name: '李长风', fame: 0, energy: 100, realm: '炼气期' },
        discipleState: { isInSect: false, contribution: 0, rank: null, artInsights: {} },
        sectsData: {
            '铁掌帮': { name: '铁掌帮', type: '中立', power: '中等', location: '中州' },
            '青云观': { name: '青云观', type: '正道', power: '大派', location: '中州' },
            '血手门': { name: '血手门', type: '邪派', power: '中等', location: '北冥' }
        },
        SECT_INTERNAL: {
            '铁掌帮': { disciples: 20, resources: 300, influence: 50, morale: 50, chronicle: [] },
            '青云观': { disciples: 30, resources: 400, influence: 60, morale: 50, chronicle: [] },
            '血手门': { disciples: 18, resources: 500, influence: 40, morale: 50, chronicle: [] }
        },
        SECT_DIPLOMACY_STATE: {},
        eventFlags: {},
        inventory: { currency: { spiritStones: stt.wallet } },
        DataManager: {
            getSpiritStones: function () { return stt.wallet; },
            deductSpiritStones: function (n) { if (stt.wallet >= n) { stt.wallet -= n; W.inventory.currency.spiritStones = stt.wallet; return true; } return false; },
            addSpiritStones: function (n) { stt.wallet += n; W.inventory.currency.spiritStones = stt.wallet; }
        },
        SectGov: { chronicle: function (s, t) { stt.chron.push(String(t)); } },
        sectPowerNow: function () { return { tier: '中等', score: 150 }; },
        sectAlignNow: function () { return { align: 0 }; },
        sectPowerWarMul: function () { return 1.0; },
        sectPowerWarMod: function (s, win) { stt.warMod.push({ sect: s, win: win }); },
        sectAlignShift: function (s, d, r) { stt.align.push({ sect: s, delta: d, reason: r }); },
        sectIsRuined: function (s) { return !!W.eventFlags['sect_ruin_' + s]; },
        saveSectDiplomacy: function () { stt.saved++; },
        locationSystem: { getCurrentLocation: function () { return '洛水城'; } },
        getRealmTier: function () { return 1; },
        realmScaledEnemyLevel: function () { return 3; },
        showMessage: function (m) { stt.msgs.push(String(m)); },
        gameLog: { add: function (m) { stt.logs.push(String(m)); } },
        showModal: function (t, b) { stt.modals.push({ title: t, body: String(b) }); },
        showSectDiplomacy: function (n) { stt.dipPanel.push(String(n)); },
        openPlayerSectPanel: function () { stt.panelOpens = (stt.panelOpens || 0) + 1; },
        startBattle: function (en) { W.currentBattle = { enemy: en }; stt.battles.push(W.currentBattle); return W.currentBattle; }
    };
    W.XianXia = { DataManager: W.DataManager };
    W.window = W;
    const sandbox = {
        window: W, console: { log: function () {} },
        Math: Math, Number: Number, String: String, JSON: JSON, Object: Object, Array: Array, Date: Date, RegExp: RegExp,
        parseInt: parseInt, parseFloat: parseFloat,
        document: { getElementById: function () { return null; } },
        localStorage: { getItem: function () { return null; }, setItem: function () {} }
    };
    vm.createContext(sandbox);
    ['js/extensions/player-sect.js', 'js/extensions/player-sect-bootstrap.js', 'js/extensions/player-sect-venture.js',
     'js/extensions/player-sect-world.js', 'js/sects/sect-war.js'].forEach(function (f) {
        vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sandbox);
    });
    function found(name) {
        const r = W.PSBoot.foundCheap(name || '长风门', '中立');
        return r.ok ? r.sect : null;
    }
    function recruit(ps, id) { try { W.PlayerSect.recruitDisciple(ps.id, id); } catch (e) {} }
    function hist(ps, sub) { return (ps.history || []).some(function (h) { return String(h.text).includes(sub); }); }
    function rel(a, b) { const c = W.SECT_DIPLOMACY_STATE[a] && W.SECT_DIPLOMACY_STATE[a][b]; return c ? Number(c.relation) : null; }
    function setRel(a, b, v) {
        W.SECT_DIPLOMACY_STATE[a][b].relation = v;
        if (W.SECT_DIPLOMACY_STATE[b] && W.SECT_DIPLOMACY_STATE[b][a]) W.SECT_DIPLOMACY_STATE[b][a].relation = v;
    }
    function newDay(d, randV) {
        W.timeSystem.gameTime.currentDay = d;
        if (randV != null) withRandom(randV, function () { W.EventBus.emit('newDay', { newDay: d }); });
        else W.EventBus.emit('newDay', { newDay: d });
    }
    return { W: W, stt: stt, npcs: npcs, found: found, recruit: recruit, hist: hist, rel: rel, setRel: setRel, newDay: newDay };
}

// ---------- B · 落座 ----------
console.log('\n[B] 外交册落座');
{
    const env = makeSandbox({});
    const ps = env.found();
    ok(!!ps, 'B1 插旗草创成行');
    const D = env.W.SECT_DIPLOMACY_STATE;
    ok(!!D['长风门'] && !!D['长风门']['铁掌帮'], 'B2 立宗即在外交册落座（自家一行齐）');
    ok(!!D['铁掌帮']['长风门'], 'B3 对方册上也有自家（双向）');
    eq(D['长风门']['铁掌帮'].relation, D['铁掌帮']['长风门'].relation, 'B4 两向关系同一个数');
    ok(!D['长风门']['长风门'], 'B5 不跟自己开外交行');
}

// ---------- C · 结盟 ----------
console.log('\n[C] 结盟（盘缠走宗库，成败看交情）');
{
    const env = makeSandbox({});
    const ps = env.found();
    const PW = env.W.PSectWorld;
    // 盘缠不够
    ps.resources.spiritStones = 50;
    PW.syncMirror('长风门');
    let r = PW.allianceFor('长风门', '铁掌帮');
    ok(!r.ok && r.text.includes('盘缠'), 'C1 凑不出盘缠盟不成（分文不动）');
    eq(ps.resources.spiritStones, 50, 'C2 拒了不扣钱');
    // 成了
    ps.resources.spiritStones = 300;
    PW.syncMirror('长风门');
    env.setRel('长风门', '铁掌帮', 60);
    const rel0 = env.rel('长风门', '铁掌帮');
    r = withRandom(0.01, function () { return PW.allianceFor('长风门', '铁掌帮'); });
    ok(r.ok, 'C3 交情深使者一说就成');
    eq(ps.resources.spiritStones, 220, 'C4 盘缠八十从宗库真账扣');
    eq(env.W.SECT_INTERNAL['长风门'].resources, 220, 'C5 镜像同数（两讫）');
    eq(env.rel('长风门', '铁掌帮'), rel0 + 15, 'C6 两家关系各涨十五');
    ok(env.W.SECT_DIPLOMACY_STATE['长风门']['铁掌帮'].treaties.indexOf('alliance') >= 0, 'C7 盟书入档（自家格）');
    ok(env.W.SECT_DIPLOMACY_STATE['铁掌帮']['长风门'].treaties.indexOf('alliance') >= 0, 'C8 盟书入档（对方格）');
    ok(env.hist(ps, '盘缠'), 'C9 盘缠名目写进宗门史');
    ok(env.stt.chron.some(function (t) { return t.includes('盟书'); }), 'C10 两家编年各记一笔');
    env.W.PSBoot.monthSync(ps);
    ok(!env.hist(ps, '遭了劫掠') && !env.hist(ps, '得了进项'), 'C11 月结见差额为零（不误记劫掠）');
    // 再盟被拒
    r = PW.allianceFor('长风门', '铁掌帮');
    ok(!r.ok && r.text.includes('换过盟书'), 'C12 盟不可再');
    // 婉拒
    const env2 = makeSandbox({});
    const ps2 = env2.found();
    ps2.resources.spiritStones = 300;
    env2.W.PSectWorld.syncMirror('长风门');
    env2.setRel('长风门', '青云观', -20);
    const rel2 = env2.rel('长风门', '青云观');
    const r2 = withRandom(0.99, function () { return env2.W.PSectWorld.allianceFor('长风门', '青云观'); });
    ok(!r2.ok && r2.text.includes('婉拒'), 'C13 交情浅使者空手而回');
    eq(ps2.resources.spiritStones, 220, 'C14 盘缠照花（使者走过了腿）');
    eq(env2.rel('长风门', '青云观'), rel2 - 5, 'C15 被婉拒关系再冷一分');
}

// ---------- D · 送礼 ----------
console.log('\n[D] 送礼（月一回一家，礼真进对方库房）');
{
    const env = makeSandbox({});
    const ps = env.found();
    const PW = env.W.PSectWorld;
    ps.resources.spiritStones = 200;
    PW.syncMirror('长风门');
    const rel0 = env.rel('长风门', '青云观');
    const foe0 = env.W.SECT_INTERNAL['青云观'].resources;
    let r = PW.giftFor('长风门', '青云观');
    ok(r.ok, 'D1 一车礼送得出');
    eq(ps.resources.spiritStones, 170, 'D2 三十灵石从宗库真账扣');
    eq(env.W.SECT_INTERNAL['青云观'].resources, foe0 + 30, 'D3 礼真进了对方库房（守恒）');
    eq(env.rel('长风门', '青云观'), rel0 + 10, 'D4 关系涨十');
    // 同月再送
    r = PW.giftFor('长风门', '青云观');
    ok(!r.ok && r.text.includes('礼数太密'), 'D5 同一家月一回（礼数太密反显刻意）');
    eq(ps.resources.spiritStones, 170, 'D6 拒了不扣钱');
    // 下月再送
    env.W.timeSystem.gameTime.currentDay = 135;
    r = PW.giftFor('长风门', '青云观');
    ok(r.ok, 'D7 转过月来又能走动');
    // 另一家不受限
    env.W.timeSystem.gameTime.currentDay = 105;
    r = PW.giftFor('长风门', '铁掌帮');
    ok(r.ok, 'D8 各家是各家的礼数（互不相碍）');
    // 深怨之家
    const env2 = makeSandbox({});
    const ps2 = env2.found();
    ps2.resources.spiritStones = 200;
    env2.W.PSectWorld.syncMirror('长风门');
    env2.setRel('长风门', '血手门', -50);
    const r2 = env2.W.PSectWorld.giftFor('长风门', '血手门');
    ok(r2.ok && r2.text.includes('+5'), 'D9 深怨之家收礼也防着（只涨五）');
}

// ---------- E · 兴兵资格与殿议 ----------
console.log('\n[E] 兴兵资格与殿议');
{
    const env = makeSandbox({});
    const ps = env.found();
    const PW = env.W.PSectWorld;
    // 怨不够深
    env.setRel('长风门', '铁掌帮', -20);
    let we = PW.warEligible('长风门', '铁掌帮');
    ok(!we.ok && we.text.includes('兴兵无名'), 'E1 没有能动刀的怨不兴兵');
    // 宿怨之门
    env.setRel('长风门', '血手门', -80);
    we = PW.warEligible('长风门', '血手门');
    ok(we.ok, 'E2 死仇之门兴兵有名');
    // 对方幡倒了
    env.W.eventFlags['sect_ruin_血手门'] = true;
    we = PW.warEligible('长风门', '血手门');
    ok(!we.ok && we.text.includes('幡已经倒了'), 'E3 灭了的门派没仇可报');
    env.W.eventFlags['sect_ruin_血手门'] = false;
    // 六十日内刚动过刀
    env.W.eventFlags['sect_war_cd_血手门'] = env.W.timeSystem.gameTime.currentDay + 30;
    we = PW.warEligible('长风门', '血手门');
    ok(!we.ok && we.text.includes('喘口气'), 'E4 两战之间有喘气期');
    env.W.eventFlags['sect_war_cd_血手门'] = 0;
    // 掌门兴兵（真仗）
    const okB = env.W.doDeclareWar('血手门');
    ok(okB === true, 'E5 掌门说兴兵就兴兵（不在别家门下）');
    const b = env.W.currentBattle;
    ok(b && b._isSectWarBattle && b._warSide === 'attack' && b._warSect === '血手门', 'E6 真仗开打（攻山方）');
    eq(b._warHome, '长风门', 'E7 战帖上写着自家山门（结算走外交线真账）');
    // 殿议面板（自家堂上）
    env.W.currentBattle = null;
    env.stt.modals.length = 0;
    env.W.initiateSectWarPrompt();
    const m = env.stt.modals[env.stt.modals.length - 1];
    ok(m && m.body.includes('掌门') && m.body.includes('血手门'), 'E8 殿议列宿怨之门（掌门自家堂上说了算）');
    // 骑墙态：在别家门下当外门弟子，自家山门照样能兴兵
    env.W.currentBattle = null;
    env.W.discipleState = { isInSect: true, sectName: '青云观', rank: 5, contribution: 10 };
    const okB2 = env.W.doDeclareWar('血手门');
    ok(okB2 === true && env.W.currentBattle && env.W.currentBattle._warHome === '长风门', 'E9 人在别家门下当差，自家山门的事自家做主');
}

// ---------- F · 死仇压山 ----------
console.log('\n[F] 死仇压山（自建宗门也挨真打）');
{
    const env = makeSandbox({});
    const ps = env.found();
    env.recruit(ps, 'd1');
    env.setRel('长风门', '血手门', -80);
    env.setRel('长风门', '铁掌帮', -50); // 宿怨不到死仇——不压山
    // 4% 一日：掷中才来
    env.newDay(106, 0.5);
    ok(!env.W.currentBattle, 'F1 死仇也不是天天打（掷不中就不来）');
    env.newDay(107, 0.01);
    const b = env.W.currentBattle;
    ok(b && b._isSectWarBattle && b._warSide === 'defend' && b._warSect === '血手门', 'F2 死仇压上自家山门（真仗·守方）');
    eq(b._warHome, '长风门', 'F3 战帖写着自家山门');
    // 战斗中不叠台
    env.newDay(108, 0.01);
    eq(env.stt.battles.length, 1, 'F4 一仗未了不摆第二场');
    // 结算后喘气期内不再来
    withRandom(0.5, function () { env.W.settleSectWar(true); });
    env.W.currentBattle = null;
    env.newDay(109, 0.01);
    eq(env.stt.battles.length, 1, 'F5 六十日喘气期内仇家不回头');
    // 弟子身优先（骑墙态先顾师门）
    const env2 = makeSandbox({});
    const ps2 = env2.found();
    env2.W.SECT_DIPLOMACY_STATE['青云观'] = { '血手门': { relation: -80, trade: 0, conflicts: 0, lastEvent: 0, treaties: [] } };
    env2.W.discipleState = { isInSect: true, sectName: '青云观', rank: 3, contribution: 0 };
    env2.newDay(106, 0.01);
    const b2 = env2.W.currentBattle;
    ok(b2 && b2._warSect === '血手门' && !b2._warHome, 'F6 骑墙态弟子身优先（压的是师门的山，走师门的账）');
}

// ---------- G · 战事结算 ----------
console.log('\n[G] 战事结算（落自家真账）');
{
    // 守胜
    const env = makeSandbox({});
    const ps = env.found();
    env.recruit(ps, 'd1');
    ps.resources.spiritStones = 100;
    env.W.PSectWorld.syncMirror('长风门');
    env.setRel('长风门', '血手门', -80);
    env.W.currentBattle = { _isSectWarBattle: true, _warSect: '血手门', _warSide: 'defend', _warHome: '长风门' };
    const d0 = ps.disciples[0];
    env.W.settleSectWar(true);
    eq(env.rel('长风门', '血手门'), -60, 'G1 守胜关系回暖二十');
    eq(ps.resources.reputation, 2, 'G2 声望落自家真账（不塞贡献账）');
    eq(env.W.SECT_INTERNAL['长风门'].morale, 58, 'G3 门中士气大振');
    ok(env.W.PSectVenture.moodPts(d0) > 50, 'G4 弟子心境跟着稳（守住山门人心定）');
    ok(env.stt.warMod.some(function (x) { return x.sect === '长风门' && x.win; }), 'G5 战绩入座次');
    ok(env.stt.align.some(function (x) { return x.sect === '长风门' && x.reason === '守山'; }), 'G6 守山长脸（立场）');
    eq(env.W.discipleState.contribution, 0, 'G7 弟子贡献账分文未动');
    const wars = env.W.eventFlags['sect_world_wars'] || [];
    ok(wars.length === 1 && wars[0].winner === '长风门', 'G8 战事上风云册（近来战事）');
    ok(env.stt.chron.some(function (t) { return t.includes('打了回去'); }), 'G9 编年记一笔');
    // 守败
    const env2 = makeSandbox({});
    const ps2 = env2.found();
    env2.recruit(ps2, 'd1');
    env2.recruit(ps2, 'd2');
    ps2.resources.spiritStones = 300;
    env2.W.PSectWorld.syncMirror('长风门');
    env2.setRel('长风门', '血手门', -80);
    const foe0 = env2.W.SECT_INTERNAL['血手门'].resources;
    env2.W.currentBattle = { _isSectWarBattle: true, _warSect: '血手门', _warSide: 'defend', _warHome: '长风门' };
    withRandom(0.0, function () { env2.W.settleSectWar(false); });
    eq(ps2.resources.spiritStones, 240, 'G10 守败库房真被搬（六十灵石，两讫）');
    eq(env2.W.SECT_INTERNAL['长风门'].resources, 240, 'G11 镜像同数');
    eq(env2.W.SECT_INTERNAL['血手门'].resources, foe0 + 36, 'G12 抄走的六成进了仇家库房（守恒，贼过手也折）');
    eq(env2.rel('长风门', '血手门'), -90, 'G13 败了仇更深');
    eq(ps2.disciples.length, 1, 'G14 战殁：一位具名弟子没能回来');
    ok(env2.npcs['d1'].isDead === true, 'G15 战殁的人是真死了（不再出现在名单里）');
    env2.W.PSectWorld.reconcile(ps2);
    const row = ps2._book.rows.filter(function (r) { return r.npcId === 'd1'; })[0];
    eq(row.fate, '殁于任', 'G16 宗谱记殁（牌在人身上）');
    ok(env2.stt.logs.some(function (t) { return t.includes('幡就立不住了'); }), 'G17 败报点破空幡自倒的规矩');
    env2.W.PSBoot.monthSync(ps2);
    ok(!env2.hist(ps2, '遭了劫掠'), 'G18 兵祸名目写清（月结不误记）');
    // 攻胜
    const env3 = makeSandbox({});
    const ps3 = env3.found();
    ps3.resources.spiritStones = 100;
    env3.W.PSectWorld.syncMirror('长风门');
    env3.setRel('长风门', '血手门', -80);
    env3.W.currentBattle = { _isSectWarBattle: true, _warSect: '血手门', _warSide: 'attack', _warHome: '长风门' };
    const foe3 = env3.W.SECT_INTERNAL['血手门'].resources;
    withRandom(0.5, function () { env3.W.settleSectWar(true); });
    const spoils = 210; // (120 + 90) × 1.0
    eq(env3.W.SECT_INTERNAL['血手门'].resources, foe3 - spoils, 'G19 缴获是从对方库房里真搬的');
    eq(ps3.resources.spiritStones, 100 + spoils, 'G20 缴获尽入宗库真账');
    eq(env3.W.SECT_INTERNAL['长风门'].resources, 100 + spoils, 'G21 镜像同数（两讫）');
    eq(env3.rel('长风门', '血手门'), -100, 'G22 踏破山门仇结死（-35 封底）');
    eq(env3.W.currentCharData.fame, 5, 'G23 掌门的刀江湖记住了（名望+5）');
    ok(env3.stt.align.some(function (x) { return x.sect === '长风门' && x.reason === '攻山'; }), 'G24 攻山损名（立场）');
    ok(env3.hist(ps3, '攻山缴获'), 'G25 缴获名目入宗门史');
    env3.W.PSBoot.monthSync(ps3);
    ok(!env3.hist(ps3, '遭了劫掠') && !env3.hist(ps3, '得了进项'), 'G26 月结差额为零（两讫）');
    // 攻败
    const env4 = makeSandbox({});
    const ps4 = env4.found();
    ps4.resources.spiritStones = 100;
    env4.W.PSectWorld.syncMirror('长风门');
    env4.setRel('长风门', '铁掌帮', -50);
    env4.W.currentBattle = { _isSectWarBattle: true, _warSect: '铁掌帮', _warSide: 'attack', _warHome: '长风门' };
    env4.W.settleSectWar(false);
    eq(env4.rel('长风门', '铁掌帮'), -55, 'G27 攻山不成关系再冷一分');
    eq(ps4.resources.spiritStones, 100, 'G28 打败了不抄自家库（伤在人脸面上）');
    ok(env4.stt.warMod.some(function (x) { return x.sect === '铁掌帮' && x.win; }), 'G29 守住了是对方的战绩');
    // 穷门抄不出富账（守恒）
    const env5 = makeSandbox({});
    const ps5 = env5.found();
    ps5.resources.spiritStones = 10;
    env5.W.PSectWorld.syncMirror('长风门');
    env5.setRel('长风门', '铁掌帮', -50);
    env5.W.SECT_INTERNAL['铁掌帮'].resources = 50;
    env5.W.currentBattle = { _isSectWarBattle: true, _warSect: '铁掌帮', _warSide: 'attack', _warHome: '长风门' };
    withRandom(0.5, function () { env5.W.settleSectWar(true); });
    eq(env5.W.SECT_INTERNAL['铁掌帮'].resources, 0, 'G30 穷门被抄到见底为止');
    eq(ps5.resources.spiritStones, 60, 'G31 缴获只搬真有的五十（不凭空翻倍）');
    // 空库守败：搬无可搬，文案不走样
    const env6 = makeSandbox({});
    const ps6 = env6.found();
    ps6.resources.spiritStones = 0;
    env6.W.PSectWorld.syncMirror('长风门');
    env6.setRel('长风门', '血手门', -80);
    env6.W.currentBattle = { _isSectWarBattle: true, _warSect: '血手门', _warSide: 'defend', _warHome: '长风门' };
    withRandom(0.99, function () { env6.W.settleSectWar(false); }); // 0.99 ≥ 0.30：无战殁
    eq(ps6.resources.spiritStones, 0, 'G32 空库守败不倒欠');
    ok(env6.stt.chron.some(function (t) { return t.includes('本就是空的'); }), 'G33 空库有空库的写法');
    ok(!env6.hist(ps6, '兵祸'), 'G34 搬无可搬就不记支出账（没有的钱不入账）');
}

// ---------- H · 面板三只按钮 ----------
console.log('\n[H] 面板直达（三只按钮都通真线）');
{
    const env = makeSandbox({});
    const ps = env.found();
    ps.resources.spiritStones = 300;
    env.W.PSectWorld.syncMirror('长风门');
    env.setRel('长风门', '青云观', 40);
    // 结盟按钮
    withRandom(0.01, function () { env.W.psDiploAlly('青云观'); });
    eq(ps.resources.spiritStones, 220, 'H1 结盟按钮扣的是宗库');
    ok(env.stt.dipPanel.indexOf('长风门') >= 0, 'H2 办完事面板重开（所见即所得）');
    // 送礼按钮
    env.stt.dipPanel.length = 0;
    env.W.psDiploGift('铁掌帮');
    eq(ps.resources.spiritStones, 190, 'H3 送礼按钮扣的是宗库');
    ok(env.stt.dipPanel.length === 1, 'H4 办完事面板重开');
    // 兴兵按钮（怨不够深）
    env.W.currentBattle = null;
    env.W.psDiploWar('铁掌帮');
    ok(!env.W.currentBattle && env.stt.msgs.some(function (m) { return m.includes('兴兵无名'); }), 'H5 怨不够深兴兵按钮打回');
    // 兴兵按钮（死仇）
    env.setRel('长风门', '血手门', -80);
    env.W.psDiploWar('血手门');
    ok(env.W.currentBattle && env.W.currentBattle._warHome === '长风门', 'H6 死仇之门按钮直接开仗');
    // 没立宗的人按不动
    const env2 = makeSandbox({});
    env2.stt.msgs.length = 0;
    env2.W.psDiploAlly('铁掌帮');
    ok(env2.stt.msgs.some(function (m) { return m.includes('还没立宗'); }), 'H7 没立宗谈不了盟约');
}

// ---------- 共用：直接给两家换盟书 ----------
function allyUp(env, a, b) {
    env.W.SECT_DIPLOMACY_STATE[a][b].treaties.push('alliance');
    env.W.SECT_DIPLOMACY_STATE[b][a].treaties.push('alliance');
}

// ---------- I · 盟家来援（盟书有约：山门有难，来相援） ----------
console.log('\n[I] 盟家来援（守山按交情掷骰，来援真削敌战力）');
{
    const pwSrc = fs.readFileSync(path.join(ROOT, 'js/extensions/player-sect-world.js'), 'utf8');
    ok(pwSrc.includes('function alliesOf') && pwSrc.includes('function allyAid'), 'I1 盟家名册与来援掷骰挂在四条线模块');
    const wSrc2 = fs.readFileSync(path.join(ROOT, 'js/sects/sect-war.js'), 'utf8');
    ok(wSrc2.includes('allyAid(home, enemy)') && wSrc2.includes('_warAllies') && wSrc2.includes('doAllyRescue'), 'I2 开战前来援、战局记名单、出兵入口在册');
    const dwSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-diplomacy-world.js'), 'utf8');
    ok(dwSrc.includes('window.doAllyRescue()') && dwSrc.includes('w.rescue'), 'I3 风云册战云栏挂出兵按钮、近来战事认解围之战');
    const vSrc2 = fs.readFileSync(path.join(ROOT, 'js/sects/sect-visit.js'), 'utf8');
    ok(vSrc2.includes('已盟·来相援'), 'I4 外交面板已盟标记点出来援之约');

    // 名册：换过盟书的才算，幡倒了的不算
    const env = makeSandbox({});
    env.found();
    allyUp(env, '长风门', '铁掌帮');
    const al = env.W.PSectWorld.alliesOf('长风门');
    ok(al.length === 1 && al[0] === '铁掌帮', 'I5 换过盟书的进盟家名册');
    env.W.eventFlags['sect_ruin_铁掌帮'] = 1;
    ok(env.W.PSectWorld.alliesOf('长风门').length === 0, 'I6 盟家幡倒了来不了援');
    delete env.W.eventFlags['sect_ruin_铁掌帮'];

    // 来援掷骰：交情深喊得动，来一家敌人分兵一成
    env.setRel('长风门', '铁掌帮', 50);
    const fake = { attack: 100, defense: 50, maxDurability: 200, durabilities: { chest: 200 } };
    let came = withRandom(0.01, function () { return env.W.PSectWorld.allyAid('长风门', fake); });
    ok(came.length === 1 && came[0] === '铁掌帮', 'I7 交情深的盟家一喊就到');
    eq(fake.attack, 90, 'I8 来一家，敌人分兵——攻折一成');
    eq(fake.maxDurability, 180, 'I9 耐久同折（分兵是实的）');
    const fake2 = { attack: 100, defense: 50, maxDurability: 200, durabilities: { chest: 200 } };
    came = withRandom(0.99, function () { return env.W.PSectWorld.allyAid('长风门', fake2); });
    ok(came.length === 0 && fake2.attack === 100, 'I10 掷不中就没人来，敌人原样压山');
    allyUp(env, '长风门', '青云观');
    env.setRel('长风门', '青云观', 50);
    const fake3 = { attack: 100, defense: 50, maxDurability: 200, durabilities: { chest: 200 } };
    came = withRandom(0.01, function () { return env.W.PSectWorld.allyAid('长风门', fake3); });
    ok(came.length === 2 && fake3.attack === 80, 'I11 两家来援——敌分兵两成');

    // 集成：死仇压山门，盟家真来援（开战前战力已削）
    const env2 = makeSandbox({});
    env2.found();
    allyUp(env2, '长风门', '铁掌帮');
    env2.setRel('长风门', '血手门', -80);
    env2.newDay(140, 0.01);
    const b = env2.W.currentBattle;
    ok(b && b._warHome === '长风门', 'I12 死仇压山门真仗照打');
    ok(b && Array.isArray(b._warAllies) && b._warAllies.indexOf('铁掌帮') >= 0, 'I13 战局记下来援盟家名单');
    ok(b && b.enemy.attack === 41, 'I14 敌人战力开战前已削（基础四十五·一家来援折一成）');

    // 守胜：来援的情分记账（关系回暖、两边编年都记）
    const relA0 = env2.rel('长风门', '铁掌帮');
    withRandom(0.5, function () { env2.W.settleSectWar(true); });
    env2.W.currentBattle = null;
    eq(env2.rel('长风门', '铁掌帮'), relA0 + 5, 'I15 守住山门，来援的盟家情分更笃');
    ok(env2.stt.chron.some(function (t) { return t.includes('领众援'); }), 'I16 来援之家的编年记下这一趟');
    ok(env2.stt.chron.some(function (t) { return t.includes('盟书添了一笔实证'); }), 'I17 自家编年记下盟书实证');

    // 守败：援而不成，情分也记一笔
    const env3 = makeSandbox({});
    env3.found();
    allyUp(env3, '长风门', '铁掌帮');
    env3.setRel('长风门', '铁掌帮', 10);
    env3.W.currentBattle = { _isSectWarBattle: true, _warSect: '血手门', _warSide: 'defend', _warHome: '长风门', _warAllies: ['铁掌帮'] };
    withRandom(0.99, function () { env3.W.settleSectWar(false); });
    env3.W.currentBattle = null;
    eq(env3.rel('长风门', '铁掌帮'), 12, 'I18 守山失利，来援之家也记两分情');
    ok(env3.stt.chron.some(function (t) { return t.includes('没能守住山门'); }), 'I19 编年如实记：援而不成');
}

// ---------- J · 出兵相援（盟家被围，掌门提兵下山） ----------
console.log('\n[J] 出兵相援（江湖战云·真仗解围）');
{
    // 门槛：没立宗 / 没战云 / 无盟书 / 喘气未定
    const env0 = makeSandbox({});
    env0.stt.msgs.length = 0;
    ok(env0.W.doAllyRescue() === false && env0.stt.msgs.some(function (m) { return m.includes('还没立宗'); }), 'J1 没立宗提谁的兵');
    const env = makeSandbox({});
    const ps = env.found();
    env.stt.msgs.length = 0;
    ok(env.W.doAllyRescue() === false && env.stt.msgs.some(function (m) { return m.includes('山下没有点兵'); }), 'J2 没有战云援无从出');
    env.W.eventFlags['sect_world_war_pending'] = { atk: '血手门', def: '青云观', day: 100, strikeDay: 160, witnessed: false };
    env.stt.msgs.length = 0;
    ok(env.W.doAllyRescue() === false && env.stt.msgs.some(function (m) { return m.includes('盟书'); }), 'J3 被围的不是盟家，出兵无名');
    allyUp(env, '长风门', '青云观');
    env.W.eventFlags['sect_war_cd_血手门'] = 200;
    env.stt.msgs.length = 0;
    ok(env.W.doAllyRescue() === false && env.stt.msgs.some(function (m) { return m.includes('喘口气'); }), 'J4 六十日之内刚动过刀，门中要喘气');
    delete env.W.eventFlags['sect_war_cd_血手门'];
    // 出兵：真仗，战局认得是为谁解围
    ok(env.W.doAllyRescue() === true, 'J5 盟家被围——掌门提兵下山');
    const b = env.W.currentBattle;
    ok(b && b._warSide === 'attack' && b._warHome === '长风门' && b._warRescue === '青云观', 'J6 战局认得：谁打、为谁解围');
    // 解围成了：战云散、情分大涨、谢礼从对方真库房出（守恒）
    ps.resources.spiritStones = 300;
    env.W.PSectWorld.syncMirror('长风门');
    const relA0 = env.rel('长风门', '青云观');
    withRandom(0.5, function () { env.W.settleSectWar(true); });
    env.W.currentBattle = null;
    ok(!env.W.eventFlags['sect_world_war_pending'], 'J7 围军被击退——战云散了');
    eq(env.rel('长风门', '青云观'), relA0 + 25, 'J8 受援之家感激落进情分');
    eq(env.W.SECT_INTERNAL['青云观'].resources, 340, 'J9 谢礼从受援方真库房出（四百的一成半，封顶一百二）');
    eq(env.W.SECT_INTERNAL['血手门'].resources, 290, 'J10 缴获守恒：围军库里真少了');
    eq(ps.resources.spiritStones, 570, 'J11 缴获与谢礼尽入宗库（两讫）');
    eq(env.W.currentCharData.fame, 8, 'J12 解围义举名望双涨');
    const ws = env.W.eventFlags['sect_world_wars'] || [];
    ok(ws.length && ws[ws.length - 1].rescue === '青云观' && ws[ws.length - 1].winner === '长风门', 'J13 风云册近来战事记下解围之战');
    ok(env.stt.chron.some(function (t) { return t.includes('出兵相援'); }), 'J14 自家编年记下出兵相援');
    // 相援不成：围还在、情分记一笔、没有谢礼
    const env3 = makeSandbox({});
    env3.found();
    allyUp(env3, '长风门', '铁掌帮');
    env3.setRel('长风门', '铁掌帮', 10);
    env3.W.eventFlags['sect_world_war_pending'] = { atk: '血手门', def: '铁掌帮', day: 100, strikeDay: 160, witnessed: false };
    env3.W.currentBattle = { _isSectWarBattle: true, _warSect: '血手门', _warSide: 'attack', _warHome: '长风门', _warRescue: '铁掌帮' };
    withRandom(0.5, function () { env3.W.settleSectWar(false); });
    env3.W.currentBattle = null;
    ok(!!env3.W.eventFlags['sect_world_war_pending'], 'J15 相援不成——围还在，战云不散');
    eq(env3.rel('长风门', '铁掌帮'), 15, 'J16 援虽不成，盟家也记五分情');
    ok(env3.stt.chron.some(function (t) { return t.includes('援虽不成'); }), 'J17 受援之家编年记下这份情');
    eq(env3.W.SECT_INTERNAL['铁掌帮'].resources, 300, 'J18 败了没有谢礼——钱不凭空动');
}

console.log('\n========== ps-diplomacy: ' + pass + ' 通过, ' + fail + ' 失败 ==========');
process.exit(fail ? 1 : 0);
