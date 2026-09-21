// sect-doom-node.js — 灭门与复兴（方案三）vm 沙箱测试
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

// ---------- A · 接线静态检查 ----------
console.log('\n[A] 接线');
const html = fs.readFileSync(path.join(ROOT, '仙侠.html'), 'utf8');
ok(html.includes('js/sects/sect-doom.js'), 'A1 html 挂载');
const stSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-standing.js'), 'utf8');
ok(stSrc.includes("'已灭'") && stSrc.includes('_movedToRegion') && stSrc.includes('_subjugated'), 'A2 势力档读灭门/搬迁/自焚');
const citiesSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-cities.js'), 'utf8');
ok(citiesSrc.includes('releasePatronage'), 'A3 灭门联动幡落城归无主');
const visitSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-visit.js'), 'utf8');
ok(visitSrc.includes('sectRuinView'), 'A4 旧山门场景由废墟接管');
const govSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-governance.js'), 'utf8');
ok(govSrc.includes('SectDoom.panelBlock'), 'A5 政事面板挂战云块');
const appSrc = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
ok(appSrc.includes('_isDoomBattle') && appSrc.includes('settleDoomBattle'), 'A6 破山之战接胜负分支');
const rosterSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-roster.js'), 'utf8');
ok(rosterSrc.includes('sect_remnant') && rosterSrc.includes('下落不明'), 'A7 族谱遗卷与遗徒腰牌');
const doomSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-doom.js'), 'utf8');
ok(!/冷却|次数上限|配额/.test(doomSrc), 'A8 模块零配额句式');

// ---------- 沙箱 ----------
function makeNpc(id, name, opts) {
    opts = opts || {};
    return {
        id: id, name: name, isDead: false, location: opts.location || '少林寺',
        age: opts.age || 25, combat: { realm: '炼气' },
        relationship: { affection: opts.aff == null ? 40 : opts.aff },
        changeAffection: function (n) { this.relationship.affection += n; },
        _masterIsPlayer: !!opts.mine
    };
}
function makeSandbox(opts) {
    opts = opts || {};
    const SECTS = {
        '少林寺': { type: '正道', location: '中州', power: '巨擘' },
        '阎罗殿': { type: '邪派', location: '南疆', power: '大派' },
        '武当派': { type: '正道', location: '中州', power: '大派' },
        '丐帮': { type: '正道', location: '南疆', power: '巨擘' },
        '大旗门': { type: '正道', location: '中州', power: '巨擘' },
        '血手门': { type: '邪派', location: '北冥', power: '中等' }
    };
    const INTERNAL = {
        '少林寺': { disciples: 20, resources: 600, influence: 60, material: 20, pill: 5, grain: 30, chronicle: [] },
        '阎罗殿': { disciples: 20, resources: 300, influence: 55, chronicle: [] },
        '武当派': { disciples: 25, resources: 300, influence: 60, chronicle: [] },
        '丐帮': { disciples: 30, resources: 300, influence: 70, chronicle: [] },
        '大旗门': { disciples: 28, resources: 300, influence: 65, chronicle: [] },
        '血手门': { disciples: 20, resources: 200, influence: 45, chronicle: [] }
    };
    const SCORE = Object.assign({ '少林寺': 300, '阎罗殿': 400, '武当派': 250, '丐帮': 260, '大旗门': 260, '血手门': 150 }, opts.scores || {});
    const ALIGN = Object.assign({ '少林寺': 60, '阎罗殿': -60, '武当派': 60, '丐帮': 60, '大旗门': 60, '血手门': -60 }, opts.aligns || {});
    const TIERS = Object.assign({}, opts.tiers || {});
    // NPC：掌门（好感可控）+ 三名弟子（亲传：高好感/中好感/低好感）+ 别派弟子
    const npcs = [
        makeNpc('sect_leader_少林寺', '释玄慈', { aff: opts.leaderAff == null ? 70 : opts.leaderAff }),
        makeNpc('sect_disciple_少林寺_0', '慧安', { aff: 70, mine: true }),
        makeNpc('sect_disciple_少林寺_1', '慧宁', { aff: 30, mine: true }),
        makeNpc('sect_disciple_少林寺_2', '慧苦', { aff: 10, mine: true }),
        makeNpc('sect_disciple_血手门_0', '血三', { aff: 5, location: '血手门' }),
        makeNpc('sect_leader_血手门', '血手老祖', { aff: 0, location: '血手门' })
    ];
    if (opts.leaderCompanion) npcs[0]._companionData = { x: 1 };
    const DIP = {
        '少林寺': { '阎罗殿': { relation: opts.foeRel == null ? -95 : opts.foeRel, trade: 0, conflicts: 0, lastEvent: 0, treaties: [] }, '武当派': { relation: opts.allyRel == null ? 65 : opts.allyRel, trade: 0, conflicts: 0, lastEvent: 0, treaties: [] } },
        '阎罗殿': { '少林寺': { relation: opts.foeRel == null ? -95 : opts.foeRel, trade: 0, conflicts: 0, lastEvent: 0, treaties: [] } },
        '武当派': { '少林寺': { relation: opts.allyRel == null ? 65 : opts.allyRel, trade: 0, conflicts: 0, lastEvent: 0, treaties: [] } }
    };
    const logs = [], dayHooks = [], alignCalls = [], warModCalls = [], released = [];
    const stt = { modal: null, modals: [], msgs: [], contrib: 0, stones: 0 };
    const W = {
        sectsData: SECTS,
        SECT_INTERNAL: INTERNAL,
        SECT_DIPLOMACY_STATE: DIP,
        SECT_LEADER_NAMES: { '少林寺': '释玄慈', '血手门': '血手老祖' },
        eventFlags: {},
        timeSystem: { totalDays: opts.day || 100 },
        gameLog: { add: function (m) { logs.push(String(m)); } },
        showMessage: function (m) { stt.msgs.push(String(m)); },
        showModal: function (t, b) { stt.modal = { title: t, body: b }; stt.modals.push(stt.modal); },
        EventBus: { on: function (ev, fn) { if (ev === 'newDay') dayHooks.push(fn); } },
        discipleState: { isInSect: true, sectName: '少林寺', sectId: '少林寺', rank: 1, rankName: '真传弟子', contribution: 500, _myDisciples: ['sect_disciple_少林寺_0', 'sect_disciple_少林寺_1', 'sect_disciple_少林寺_2'] },
        currentCharData: { name: '李长风', realm: '筑基', fame: opts.fame == null ? 40 : opts.fame },
        inventory: { currency: { spiritStones: opts.stones == null ? 600 : opts.stones } },
        getCurrentCityName: function () { return stt.city || ''; },
        npcManager: {
            getNPC: function (id) { for (const n of npcs) if (n.id === id) return n; return null; },
            getAllNPCs: function () { return npcs; }
        },
        sectPowerNow: function (s) { return { score: SCORE[s] || 150, tier: TIERS[s] || (SCORE[s] >= 280 ? '大派' : '中等'), trend: 'steady' }; },
        sectAlignNow: function (s) { return { align: ALIGN[s] == null ? 0 : ALIGN[s] }; },
        sectAlignShift: function (s, d, r) { alignCalls.push({ sect: s, delta: d, reason: r }); },
        sectPowerWarMod: function (s, win) { warModCalls.push({ sect: s, win: win }); },
        sectAddContribution: function (n, r) { stt.contrib += n; },
        sectLedgerNote: function () {},
        sectCityPatrons: function (s) { return stt.heldCities || []; },
        sectCityInfo: function (c) { return stt.cityInfo ? stt.cityInfo[c] : null; },
        SectCities: { releasePatronage: function (s) { released.push(s); } },
        SectGov: {
            chronicle: function (sect, text) {
                const it = INTERNAL[sect];
                if (!it) return;
                it.chronicle.push({ day: W.timeSystem.totalDays, text: String(text) });
            },
            deductStore: function (sect, kind, n) {
                const it = INTERNAL[sect];
                if (!it) return false;
                if (kind === 'stone') it.resources = Math.max(0, it.resources - n);
                else if (kind === 'material') it.material = Math.max(0, (it.material || 0) - n);
                else if (kind === 'pill') it.pill = Math.max(0, (it.pill || 0) - n);
                return true;
            }
        },
        saveSectDiplomacy: function () {},
        startBattle: function (enemy) { const b = { enemy: enemy }; W.currentBattle = b; stt.lastEnemy = enemy; return b; },
        currentBattle: null,
        getRealmTier: function (r) { return { '炼气': 1, '筑基': 2, '金丹': 3, '元婴': 4 }[r] || 1; },
        realmScaledEnemyLevel: function () { return 6; }
    };
    W.window = W;
    const sandbox = { window: W, console: console, Math: Math, Number: Number, String: String, JSON: JSON, Object: Object, Array: Array, document: { getElementById: function () { return null; } } };
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/sects/sect-doom.js'), 'utf8'), sandbox);
    return { W: W, INTERNAL: INTERNAL, npcs: npcs, DIP: DIP, logs: logs, dayHooks: dayHooks, stt: stt, alignCalls: alignCalls, warModCalls: warModCalls, released: released };
}
function tick(env, day) { env.W.timeSystem.totalDays = day; env.dayHooks.forEach(function (fn) { fn(); }); }
function withRandom(v, fn) { const o = Math.random; Math.random = function () { return typeof v === 'function' ? v() : v; }; try { return fn(); } finally { Math.random = o; } }
function queueRandom(arr) { let i = 0; return function () { return arr[Math.min(i++, arr.length - 1)]; }; }

// ---------- B · 路A 血仇压山 ----------
console.log('\n[B] 路A · 血仇压山');
{
    // 触发：阎罗殿 rel -95、势力400 ≥ 少林300×1.2
    const env = makeSandbox({ day: 100, allyRel: 20 }); // 武当交情不够，不走求援线
    withRandom(0.1, function () { tick(env, 120); }); // 月度触发（0.1<0.25）
    let pr = env.W.sectDoomProbe();
    ok(pr.doom && pr.doom.foe === '阎罗殿' && pr.doom.path === 'A', 'B1 血仇压山触发（死仇+势力碾压）');
    eq(pr.doom.strikeDay, 150, 'B2 三十日为限');
    ok(env.INTERNAL['少林寺'].chronicle.some(c => c.text.includes('血书的战帖')), 'B3 战帖记入编年');
    ok((env.W.eventFlags['qi_street'] || []).some(t => t.text.includes('战帖')), 'B4 战帖是街谈大新闻');
    ok(env.stt.modal && env.stt.modal.title.includes('战云'), 'B5 战云面板当面开（出口全在里头）');
    ok(env.stt.modal.body.includes('递书求和') && env.stt.modal.body.includes('疏散老弱') && env.stt.modal.body.includes('求援'), 'B6 三个翻盘出口都在');
    // 递书求和
    const res0 = env.INTERNAL['少林寺'].resources;
    env.W.doomBegPeace();
    eq(env.W.sectDoomProbe().doom, null, 'B7 求和成功战云散');
    eq(env.INTERNAL['少林寺'].resources, res0 - 300, 'B8 赔礼三百真出库');
    eq(env.DIP['少林寺']['阎罗殿'].relation, -75, 'B9 关系回暖二十');
    ok(env.W.eventFlags['sect_doom_cd'] > 120, 'B10 灭门事件有歇期（不连环）');
    // 兵临山下（stage2）
    const env2 = makeSandbox({ day: 100, allyRel: 20 });
    withRandom(0.1, function () { tick(env2, 120); });
    env2.logs.length = 0;
    tick(env2, 143); // strikeDay-7
    ok(env2.logs.some(l => l.includes('兵临山下')), 'B11 第七日兵临山下（最后窗口）');
    eq(env2.W.sectDoomProbe().doom.stage, 2, 'B12 升级期落档');
    // 疏散老弱
    const res2 = env2.INTERNAL['少林寺'].resources;
    env2.W.doomEvacuate();
    eq(env2.INTERNAL['少林寺'].resources, res2 - 50, 'B13 疏散盘缠五十真出库');
    ok(env2.W.sectDoomProbe().doom.evacuated, 'B14 疏散落档（走散概率减半的凭据）');
    // 求援：交情够硬才肯出兵，援兵一到势力比反转则退兵
    const env3 = makeSandbox({ day: 100, scores: { '少林寺': 300, '阎罗殿': 400, '武当派': 250 } });
    withRandom(0.1, function () { tick(env3, 120); });
    env3.W.doomSeekAid(); // 武当 65 → 300+125=425 ×1.2=510 > 400 → 退兵
    eq(env3.W.sectDoomProbe().doom, null, 'B15 盟家来援，势力比反转→对方退兵');
    ok(env3.INTERNAL['武当派'].chronicle.some(c => c.text.includes('这个忙，帮')), 'B16 援家编年记人情');
    // 整军经武：月度复查势力比，对方气短自动消
    const env4 = makeSandbox({ day: 100, allyRel: 20, scores: { '少林寺': 300, '阎罗殿': 400 } });
    withRandom(0.1, function () { tick(env4, 120); });
    env4.W.sectPowerNow = function (s) { return { score: s === '阎罗殿' ? 340 : 300, tier: '中等' }; }; // 玩家整军：对方比不到1.2倍了
    tick(env4, 150);
    eq(env4.W.sectDoomProbe().doom, null, 'B17 整军经武见效——对方掂量后气短撤兵');
}

// ---------- C · 破山之战与灭门结算 ----------
console.log('\n[C] 破山之战 → 灭门结算');
{
    const env = makeSandbox({ day: 100, allyRel: 20, leaderAff: 70, stones: 100 });
    withRandom(0.1, function () { tick(env, 120); });
    tick(env, 150); // strikeDay → 弹破山场景
    ok(env.stt.modal && env.stt.modal.body.includes('把这些年的账'), 'C1 破山之战开场拍（详稿台词）');
    env.W.startDoomBattleNow(1);
    ok(env.W.currentBattle && env.W.currentBattle._isDoomBattle && env.W.currentBattle._doomRound === 1, 'C2 第一波真仗');
    env.W.settleDoomBattle(true);
    ok(env.stt.modal.body.includes('还有两拨'), 'C3 波间喘息拍');
    env.W.startDoomBattleNow(2);
    env.W.settleDoomBattle(true);
    ok(env.stt.modal.body.includes('压山长老'), 'C4 第三波压山长老出阵');
    env.W.startDoomBattleNow(3);
    env.W.currentCharData.fame = 0;
    env.stt.contrib = 0;
    env.W.settleDoomBattle(true);
    eq(env.W.sectDoomProbe().doom, null, 'C5 三波全守住——山还在');
    eq(env.W.currentCharData.fame, 10, 'C6 守山名望+10');
    ok(env.warModCalls.some(c => c.sect === '少林寺' && c.win) && env.warModCalls.some(c => c.sect === '阎罗殿' && !c.win), 'C7 战绩修正双向落账');
    ok(env.INTERNAL['少林寺'].chronicle.some(c => c.text.includes('山还在')), 'C8 编年记「山还在」');
    eq(env.DIP['少林寺']['阎罗殿'].relation, -100, 'C9 仇更深了（-10，钳到死底）');

    // 再来一次，这回输 → 灭门结算
    const env2 = makeSandbox({ day: 100, allyRel: 20, leaderAff: 70, stones: 100 });
    withRandom(0.1, function () { tick(env2, 120); });
    tick(env2, 150);
    env2.W.startDoomBattleNow(1);
    // 散落与弟子下场：3次散落定位随机 + 三弟子判定（0.5跟着/0.05走散/0.05投敌）
    withRandom(queueRandom([0.1, 0.2, 0.3, 0.5, 0.05, 0.05, 0.9, 0.9, 0.9]), function () {
        env2.W.settleDoomBattle(false);
    });
    eq(env2.W.sectIsRuined('少林寺'), true, 'C10 战败→灭门落档');
    const rem = env2.W.eventFlags['sect_remnant'];
    ok(rem && rem.sect === '少林寺' && rem.tokenKept, 'C11 玩家转遗徒（腰牌不缴回）');
    eq(env2.W.discipleState.isInSect, false, 'C12 遗徒不再在门');
    eq(env2.W.discipleState._remnantOf, '少林寺', 'C13 遗徒记旧门');
    ok(env2.released.includes('少林寺'), 'C14 护持城幡落联动（sect-cities）');
    // 公库清算守恒：600 → 三成折安家费按人头，七成归攻方
    const sharePool = Math.floor(600 * 0.3);
    const share = Math.floor(sharePool / 20);
    eq(env2.INTERNAL['阎罗殿'].resources, 300 + (600 - sharePool), 'C15 攻方战利品=公库七成（守恒）');
    eq(env2.W.inventory.currency.spiritStones, 100 + share, 'C16 遗徒安家费入账（真钱）');
    // 掌门不死：深羁绊随行
    const leader = env2.npcs[0];
    ok(!leader.isDead && leader._exiledWithPlayer, 'C17 掌门不死——深羁绊随行（恋爱角色铁律）');
    eq(leader.relationship.affection, 90, 'C18 患难见真情（好感+20）');
    ok(env2.stt.modals.some(m => m.body.includes('从今日起，你在哪里，山门就在哪里')), 'C19 随行分支台词照详稿');
    eq(env2.W.eventFlags['sect_exiled_leader'], '少林寺', 'C20 随行落旗（复兴第一位响应）');
    // 亲传三下场
    ok(!env2.npcs[1]._lostDisciple && !env2.npcs[1]._defected, 'C21 高好感弟子跟着你');
    ok(env2.npcs[2]._lostDisciple, 'C22 中好感弟子走散（殁录不写殁）');
    ok(env2.npcs[3]._defected, 'C23 低好感弟子投敌（可挽回的仇）');
    ok(rem.lost.length === 1 && rem.defected.length === 1, 'C24 遗徒档记下走散与投敌');
    ok(env2.INTERNAL['少林寺'].chronicle.some(c => c.text.includes('人活着，账就没死')), 'C25 编年终笔');
    ok((env2.W.eventFlags['qi_street'] || []).some(t => t.text.includes('山门破')), 'C26 灭门是街谈大新闻');
}

// ---------- D · 废墟 / 遗徒的日子 / 重逢 ----------
console.log('\n[D] 废墟与遗徒');
{
    const env = makeSandbox({ day: 100, allyRel: 20, leaderAff: 70 });
    withRandom(0.1, function () { tick(env, 120); });
    tick(env, 150);
    env.W.startDoomBattleNow(1);
    withRandom(queueRandom([0.1, 0.2, 0.3, 0.5, 0.05, 0.9, 0.9, 0.9, 0.9]), function () { env.W.settleDoomBattle(false); });
    // 废墟视图
    env.stt.modal = null;
    eq(env.W.sectRuinView('少林寺'), true, 'D1 旧山门由废墟接管');
    ok(env.stt.modal.body.includes('幡杆还在，幡没了') && env.stt.modal.body.includes('半截没烧完的香'), 'D2 余烬场景照详稿');
    ok(env.stt.modal.body.includes('起第一锹土'), 'D3 废墟上有复兴入口');
    eq(env.W.sectRuinView('武当派'), false, 'D4 活门派不接管');
    eq(env.W.eventFlags['sect_remnant'].visited, true, 'D5 到过一次废墟（起土的凭据）');
    // 叙旧会：散落同门≥3人在同一城
    const rem = env.W.eventFlags['sect_remnant'];
    env.npcs[1].location = '洛水城'; env.npcs[2].location = '洛水城'; env.npcs[3].location = '洛水城'; env.npcs[4].location = '洛水城';
    env.stt.city = '洛水城';
    const st0 = env.W.inventory.currency.spiritStones;
    env.logs.length = 0;
    tick(env, 180); // 月度
    ok(env.logs.some(l => l.includes('老同门')), 'D6 遗徒叙旧会（同城三人以上）');
    ok(env.W.inventory.currency.spiritStones > st0, 'D7 同门凑的份子真入账');
    // 走散重逢：名望≥30，九十日后有机缘
    env.npcs[2]._lostDisciple = { day: 60 }; // 走散于第60日
    env.stt.modal = null;
    withRandom(0.1, function () { tick(env, 210); });
    eq(env.npcs[2]._lostDisciple, null, 'D8 走散的亲传找回来了');
    ok(env.stt.modal && env.stt.modal.body.includes('师父！'), 'D9 重逢场景照详稿');
}

// ---------- E · 复兴线 ----------
console.log('\n[E] 复兴线');
{
    const env = makeSandbox({ day: 100, allyRel: 55, leaderAff: 70, stones: 600 });
    withRandom(0.1, function () { tick(env, 120); });
    tick(env, 150);
    env.W.startDoomBattleNow(1);
    withRandom(queueRandom([0.1, 0.2, 0.3, 0.5, 0.5, 0.5, 0.9, 0.9, 0.9]), function () { env.W.settleDoomBattle(false); });
    env.W.sectRuinView('少林寺');
    // 三位老相识：随行掌门 + 跟着你的亲传 ×2
    env.W.openRevivePanel();
    ok(env.stt.modal.body.includes('随行的掌门'), 'E1 老相识名单：掌门排第一');
    env.W.doReviveElder('sect_leader_少林寺');
    ok(env.logs.some(l => l.includes('把它放回大殿正中')), 'E2 随行掌门的应答照详稿');
    env.W.doReviveElder('sect_disciple_少林寺_0');
    env.W.doReviveElder('sect_disciple_少林寺_1');
    eq(env.W.sectDoomProbe().revive.elders, 3, 'E3 三位老相识归位');
    // 掏钱起土
    env.W.doRevivePay(false);
    eq(env.W.inventory.currency.spiritStones, 109, 'E4 五百灵石真扣（600+安家费9-500=109）');
    eq(env.W.sectDoomProbe().revive.stage, 'building', 'E5 工期开跑');
    // 三个节点
    tick(env, 151 + 10 - 1); // day=160? building day=150 → +10=160
    tick(env, 160);
    ok(env.INTERNAL['少林寺'].chronicle.some(c => c.text.includes('立基')), 'E6 第十日立基（旧匾残片镶门楣）');
    tick(env, 170);
    ok(env.INTERNAL['少林寺'].chronicle.some(c => c.text.includes('竖幡')), 'E7 第二十日竖幡（名字不用换）');
    tick(env, 181);
    // 开山结算
    eq(env.W.sectIsRuined('少林寺'), false, 'E8 第三十日开山——废墟旗出清');
    ok(env.W.eventFlags['sect_revived_少林寺'], 'E9 复兴落档（塌过又起来的日子都记着）');
    eq(env.W.discipleState.isInSect, true, 'E10 玩家复任');
    eq(env.W.discipleState.sectName, '少林寺', 'E11 门派名字回来');
    eq(env.W.discipleState.rankName, '真传弟子', 'E12 职位按生前复任');
    eq(env.INTERNAL['少林寺'].disciples, 7, 'E13 第一批新弟子七人');
    eq(env.INTERNAL['少林寺'].resources, 500 + 50, 'E14 家底=五百折入+老相识贺礼（守恒有名有姓）');
    eq(env.npcs[0].location, '少林寺', 'E15 掌门归位');
    eq(env.DIP['少林寺']['阎罗殿'].relation, -40, 'E16 仇家关系解冻回-40（账记编年不记刀上）');
    ok((env.W.eventFlags['qi_street'] || []).some(t => t.text.includes('回来了')), 'E17 复兴是街谈大新闻');
    eq(env.stt.contrib, 100, 'E18 重立山门首功贡献+100');
    ok(env.stt.modal && env.stt.modal.body.includes('山，不是门派'), 'E19 开山台词照详稿');
    // 借钱路径 + 还债 + 逾期
    const env2 = makeSandbox({ day: 100, allyRel: 55, leaderAff: 70, stones: 100 });
    withRandom(0.1, function () { tick(env2, 120); });
    tick(env2, 150);
    env2.W.startDoomBattleNow(1);
    withRandom(queueRandom([0.1, 0.2, 0.3, 0.5, 0.5, 0.5, 0.9, 0.9, 0.9]), function () { env2.settleLost = env2.W.settleDoomBattle(false); });
    env2.W.sectRuinView('少林寺');
    env2.W.openRevivePanel();
    env2.W.doReviveElder('sect_leader_少林寺');
    env2.W.doReviveElder('sect_disciple_少林寺_0');
    env2.W.doReviveElder('sect_disciple_少林寺_1');
    env2.stt.msgs.length = 0;
    env2.W.doRevivePay(false);
    ok(env2.stt.msgs.some(m => m.includes('凑不出')), 'E20 钱不够起不了土（不白送）');
    env2.W.doRevivePay(true);
    const rv = env2.W.eventFlags['sect_revive'];
    ok(rv && rv.debt && rv.debt.sect === '武当派', 'E21 向交好的门派借（关系≥50，编年记名）');
    ok(env2.INTERNAL['武当派'].chronicle.some(c => c.text.includes('入一股香火')), 'E22 债是两家的账');
    tick(env2, 190); // 工期走完（180日开山）
    ok(env2.W.eventFlags['sect_remnant'].debt, 'E23 复兴完成债不消失——挂在遗徒档上');
    env2.W.inventory.currency.spiritStones = 700;
    env2.W.doRepayDebt();
    eq(env2.W.inventory.currency.spiritStones, 200, 'E24 还债真扣');
    eq(env2.INTERNAL['武当派'].resources, 300 + 500, 'E25 债主真收（守恒两讫）');
    eq(env2.W.eventFlags['sect_remnant'].debt, null, 'E26 还清出账');
}

// ---------- F · 路B 灵脉枯人心散 / 路C 名存实亡 ----------
console.log('\n[F] 路B与路C');
{
    // 路B：城枯+断粮半年+式微 → 熬还是散
    const env = makeSandbox({ day: 100, tiers: { '少林寺': '式微' } });
    env.INTERNAL['少林寺']._famineDays = 200;
    env.W.eventFlags['qi_withered_洛水城'] = 5; // 洛水城属中州=少林所在
    withRandom(0.99, function () { tick(env, 120); }); // 0.99≥0.25：掐掉血仇线，专测路B
    ok(env.stt.modal && env.stt.modal.title.includes('熬还是散'), 'F1 路B抉择场景开（每月一问）');
    ok(env.stt.modal.body.includes('山门搬迁') === false, 'F2 没有分舵搬不了（不骗人）');
    // 有分舵时可搬迁
    env.stt.heldCities = [{ city: '剑阁', hold: 50 }];
    env.stt.cityInfo = { '剑阁': { branch: { day: 90 } } };
    env.W.doomRelocate('少林寺', '剑阁');
    eq(env.INTERNAL['少林寺']._movedToRegion, '蜀地', 'F3 搬迁落新址（枯城修正解除的凭据）');
    eq(env.INTERNAL['少林寺'].disciples, 17, 'F4 三名弟子故土难离');
    eq(env.INTERNAL['少林寺']._famineDays, 0, 'F5 断粮的日子从头数');
    ok(env.INTERNAL['少林寺'].chronicle.some(c => c.text.includes('祖师牌位是背着的')), 'F6 搬迁编年照详稿');
    // 散伙
    const env2 = makeSandbox({ day: 100, tiers: { '少林寺': '式微' } });
    env2.INTERNAL['少林寺']._famineDays = 200;
    env2.W.eventFlags['qi_withered_洛水城'] = 5;
    withRandom(0.99, function () { tick(env2, 120); });
    withRandom(queueRandom([0.1, 0.2, 0.3, 0.5, 0.5, 0.5, 0.9, 0.9, 0.9]), function () { env2.W.doomDisband('少林寺'); });
    eq(env2.W.sectIsRuined('少林寺'), true, 'F7 主动散伙→灭门结算（路B）');
    ok((env2.W.eventFlags['qi_street'] || []).some(t => t.text.includes('灯是自己灭的')), 'F8 散伙的街谈没有火药味');
    // 路C：弟子≤3 连续六十日
    const env3 = makeSandbox({ day: 100, allyRel: 20 });
    env3.INTERNAL['血手门'].disciples = 2;
    withRandom(0.99, function () { for (let d = 101; d <= 159; d++) tick(env3, d); });
    eq(env3.W.sectIsRuined('血手门'), false, 'F9 五十九日还不算（要有连续六十日）');
    withRandom(0.99, function () { tick(env3, 180); });
    eq(env3.W.sectIsRuined('血手门'), true, 'F10 名存实亡满六十日→灯自己灭（路C）');
    ok(env3.INTERNAL['血手门'].chronicle.some(c => c.text.includes('灯是自己灭的')), 'F11 路C编年没有仪式');
    ok(env3.npcs[5]._hiddenLeader, 'F12 别派掌门也走下场分支（隐世）');
    // 一月至多灭一门
    const env4 = makeSandbox({ day: 100, allyRel: 20 });
    env4.INTERNAL['血手门'].disciples = 2;
    env4.INTERNAL['血手门']._lowDays = 59;
    env4.INTERNAL['阎罗殿'].disciples = 3;
    env4.INTERNAL['阎罗殿']._lowDays = 59;
    withRandom(0.99, function () { tick(env4, 120); });
    const ruined = ['血手门', '阎罗殿'].filter(s => env4.W.sectIsRuined(s));
    eq(ruined.length, 1, 'F13 一月至多灭一门（世界节奏闸）');
}

// ---------- G · 正道讨伐 ----------
console.log('\n[G] 正道讨伐');
{
    // 玩家门派成公敌：讨伐战帖（以天道之名）+ 自焚邪功出口
    const env = makeSandbox({ day: 100, allyRel: 20, aligns: { '少林寺': -90 } });
    withRandom(0.05, function () { tick(env, 120); });
    const pr = env.W.sectDoomProbe();
    ok(pr.doom && pr.doom.subjugate, 'G1 公敌被讨伐（联名战帖）');
    ok(env.stt.modal.body.includes('以天道之名'), 'G2 讨伐的名义照详稿');
    env.W.doomAtone();
    eq(env.INTERNAL['少林寺'].resources, 0, 'G3 自焚邪功：公库清空（真代价）');
    ok(env.alignCalls.some(a => a.sect === '少林寺' && a.delta === 30), 'G4 立场回暖三十');
    eq(env.W.sectDoomProbe().doom, null, 'G5 请罪后讨伐退兵');
    ok(env.INTERNAL['少林寺']._subjugated, 'G6 势力折半落档（standing 读它）');
    // AI 公敌被联手讨伐（后台）
    const env2 = makeSandbox({ day: 100, aligns: { '阎罗殿': -90 } });
    env2.W.sectPowerNow = function (s) {
        const sc = { '少林寺': 300, '阎罗殿': 200, '武当派': 250, '丐帮': 260, '大旗门': 260, '血手门': 150 };
        return { score: sc[s] || 150, tier: '中等' };
    };
    withRandom(0.05, function () { tick(env2, 120); });
    ok(env2.INTERNAL['阎罗殿'].disciples < 20, 'G7 讨伐得手：弟子真折（联手之力）');
    ok(env2.INTERNAL['阎罗殿'].resources < 300, 'G8 公库折半');
    ok(env2.INTERNAL['丐帮'].chronicle.some(c => c.text.includes('讨伐')), 'G9 参与讨伐的家也有编年（各自记各自的仗）');
    ok((env2.W.eventFlags['qi_street'] || []).some(t => t.text.includes('围山七日')), 'G10 讨伐是街谈大新闻');
    // 打不赢的讨伐：气焰更盛
    const env3 = makeSandbox({ day: 100, aligns: { '阎罗殿': -90 }, scores: { '阎罗殿': 900 } });
    withRandom(0.05, function () { tick(env3, 120); });
    ok(env3.INTERNAL['阎罗殿'].chronicle.some(c => c.text.includes('打了回去')), 'G11 讨伐失利也有账（不白打）');
}

console.log('\n========== sect-doom: ' + pass + ' 通过, ' + fail + ' 失败 ==========');
process.exit(fail ? 1 : 0);
