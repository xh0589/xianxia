// sect-throne-node.js — 掌门位（传位/夺位/案头/读档恢复）vm 沙箱测试
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

// ---------- A · 接线 ----------
console.log('\n[A] 接线');
{
    const html = fs.readFileSync(path.join(ROOT, '仙侠.html'), 'utf8');
    ok(html.includes('js/sects/sect-throne.js'), 'A1 页面挂载掌门位模块');
    ok(html.indexOf('sect-throne.js') > html.indexOf('sect-festival-succession.js'), 'A2 挂载在继位风波之后（复用其风向语义）');
    const throneSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-throne.js'), 'utf8');
    ok(!/冷却|次数上限|配额/.test(throneSrc), 'A3 模块零配额句式');
    const govSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-governance.js'), 'utf8');
    ok(govSrc.includes('leaderDecide') && govSrc.includes('decisionList'), 'A4 治理开出掌门案头接口');
    ok(govSrc.includes('rank === 0) continue'), 'A5 玩家当掌门后，长老不再代自家门派自动决议');
    ok(fs.readFileSync(path.join(ROOT, 'js/sects/sects-system.js'), 'utf8').includes('祖师堂'), 'A6 门派面板挂祖师堂入口');
    ok(throneSrc.includes('getAbsoluteDay'), 'A7 时钟走真钟链（第九波口径）');
}

// ---------- 沙箱 ----------
const RANKS = [
    { id: 0, name: '掌门' }, { id: 1, name: '副掌门' }, { id: 2, name: '长老' }, { id: 3, name: '亲传弟子' },
    { id: 4, name: '内门弟子' }, { id: 5, name: '外门弟子' }, { id: 6, name: '记名弟子' }, { id: 7, name: '杂役弟子' }
];
function makeSandbox(opts) {
    opts = opts || {};
    const stt = { modals: [], msgs: [], logs: [], journal: [] };
    const leader = {
        id: 'sect_leader_少林寺', name: '释玄慈', isDead: !!opts.leaderDead,
        relationship: { affection: opts.leaderAff != null ? opts.leaderAff : 20 },
        occupation: '掌门'
    };
    if (opts.leaderCompanion) leader._companionData = { name: '释玄慈' };
    const npcs = { [leader.id]: leader };
    const W = {
        WorldCalendar: {},
        timeSystem: { totalDays: opts.day || 300 },
        currentCharData: { name: '李长风', realm: opts.realm || '练气', fame: opts.fame != null ? opts.fame : 30 },
        discipleState: {
            isInSect: true, sectName: '少林寺', sectId: '少林寺',
            rank: opts.rank != null ? opts.rank : 1, rankName: '副掌门',
            contribution: opts.contrib != null ? opts.contrib : 6500
        },
        COMMON_RANKS: RANKS,
        SECT_LEADER_NAMES: { '少林寺': '释玄慈' },
        SECT_INTERNAL: {
            '少林寺': {
                disciples: 40, resources: 500, influence: 60, weapons: 10, defense: 10,
                morale: opts.morale != null ? opts.morale : 50, grain: opts.grain != null ? opts.grain : 30,
                material: 20, chronicle: []
            }
        },
        eventFlags: {},
        npcManager: { getNPC: function (id) { return npcs[id] || null; } },
        getRealmTier: function (r) { return ({ '练气': 1, '筑基': 2, '金丹': 3, '元婴': 4, '化神': 5 })[r] || 1; },
        sectPowerNow: opts.tier ? function () { return { tier: opts.tier, score: 50 }; } : undefined,
        Tournament: opts.tourneyWin ? { getTournamentHistory: function () { return [{ winnerId: 'player' }]; } } : undefined,
        SectGov: {
            chronicle: function (sect, text) { stt.chronTexts.push(text); },
            famine: function () { return !!opts.famine; },
            decisionList: function () {
                return [
                    { id: 'buy_grain', name: '下山籴粮', when: function (it) { return (Number(it.grain) || 0) < 10; } },
                    { id: 'feast', name: '开大典', when: function () { return false; } }
                ];
            },
            leaderDecide: function (sect, id) {
                stt.decided = { sect: sect, id: id };
                return id === 'buy_grain' ? { ok: true, name: '下山籴粮' } : { ok: false, reason: 'not-now', text: '时机未到' };
            }
        },
        gameLog: { add: function (m) { stt.logs.push(String(m)); } },
        showMessage: function (m) { stt.msgs.push(String(m)); },
        showModal: function (t, b) { stt.modals.push({ title: t, body: String(b) }); },
        WorldJournal: { record: function (r) { stt.journal.push(r); } },
        EventBus: {
            _h: {},
            on: function (ev, fn) { (this._h[ev] = this._h[ev] || []).push(fn); },
            emit: function (ev, p) { (this._h[ev] || []).forEach(function (f) { try { f(p); } catch (e) {} }); }
        }
    };
    stt.chronTexts = W.SECT_INTERNAL['少林寺'].chronicle;
    W.window = W;
    const sandbox = { window: W, console: { log: function () {} }, Math: Math, Number: Number, String: String, JSON: JSON, Object: Object, Array: Array, Date: Date, document: { getElementById: function () { return null; } } };
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/sects/sect-throne.js'), 'utf8'), sandbox);
    return { W: W, stt: stt, npcs: npcs, leader: leader };
}
function withRandom(v, fn) { const o = Math.random; Math.random = function () { return v; }; try { return fn(); } finally { Math.random = o; } }

// ---------- B · 传位 ----------
console.log('\n[B] 传位');
{
    const env = makeSandbox({ rank: 1, contrib: 6500, leaderAff: 65, fame: 30 });
    const r = env.W.doThroneTransmit();
    eq(r, true, 'B1 条件齐备：祖师堂传位成礼');
    eq(env.W.discipleState.rank, 0, 'B2 职位到顶：掌门');
    eq(env.W.discipleState.rankName, '掌门', 'B3 位分有名');
    eq(env.W.SECT_LEADER_NAMES['少林寺'], '李长风', 'B4 全江湖掌门名册改口（编年/政事/族谱都读它）');
    eq(env.W.eventFlags['sect_throne'].way, 'transmit', 'B5 登位落旗（读档恢复的凭据）');
    eq(env.W.eventFlags['sect_throne'].oldLeader, '释玄慈', 'B6 旧掌门记档（不忘来路）');
    eq(env.leader.occupation, '闭关', 'B7 旧掌门转闭关——不折不删');
    eq(env.leader.relationship.affection, 85, 'B8 把山门交给你：情分 +20');
    eq(env.W.currentCharData.fame, 40, 'B9 传位是佳话（名望 +10）');
    ok(env.stt.chronTexts.some(t => t.includes('传位')), 'B10 编年记一笔');
    ok((env.W.eventFlags['qi_street'] || []).some(t => t.text.includes('传位')), 'B11 街谈传佳话');
    ok(env.stt.journal.some(j => j.title === '掌门传位'), 'B12 世界大事记落笔');
    ok(env.stt.modals.some(m => m.title.includes('传位') && m.body.includes('历代掌门')), 'B13 仪式是一场戏，不是一行提示');
    // 缺口径
    const e2 = makeSandbox({ rank: 1, contrib: 3000, leaderAff: 65 });
    const ts2 = e2.W.sectThroneProbe().transmit;
    ok(!ts2.ok && ts2.lack.some(x => x.includes('功绩不足')), 'B14 贡献不够：明示差多少，不留死路感');
    eq(e2.W.doThroneTransmit(), false, 'B15 条件不齐传不成');
    const e3 = makeSandbox({ rank: 1, contrib: 6500, leaderAff: 20 });
    ok(e3.W.sectThroneProbe().transmit.lack.some(x => x.includes('认可')), 'B16 老掌门不点头：明示认可几何');
    const e4 = makeSandbox({ rank: 3, contrib: 9000, leaderAff: 90 });
    ok(e4.W.sectThroneProbe().transmit.lack.some(x => x.includes('职位不到')), 'B17 内门弟子话递不进祖师堂');
    const e5 = makeSandbox({ rank: 1, contrib: 9000, leaderAff: 90, leaderCompanion: true });
    ok(e5.W.sectThroneProbe().transmit.lack.some(x => x.includes('位分不换')), 'B18 恋爱角色掌门：位分不换（铁律）');
    eq(e5.W.doThroneTransmit(), false, 'B19 铁律拦得住动手');
    const e6 = makeSandbox({ rank: 1, contrib: 9000, leaderAff: 90, leaderDead: true });
    ok(e6.W.sectThroneProbe().transmit.lack.some(x => x.includes('见不着掌门')), 'B20 掌门不在山中：如实相告');
}

// ---------- C · 夺位 ----------
console.log('\n[C] 夺位');
{
    // 成局：危机齐备
    const env = makeSandbox({ rank: 2, contrib: 3500, leaderAff: 20, famine: true, morale: 30, tier: '残破', tourneyWin: true, realm: '元婴', fame: 10 });
    const cs = env.W.sectThroneProbe().coup;
    eq(cs.rate, 80, 'C1 成功率是明账且封顶八成（底子20+断粮15+士气10+座次10+失德10+夺冠10+修为5=80）');
    const r = withRandom(0.005, function () { return env.W.doThroneCoup(); });
    eq(r, true, 'C2 逼宫成事');
    eq(env.W.discipleState.contribution, 3000, 'C3 打点执事堂五百贡献真扣（人情不白要）');
    eq(env.W.eventFlags['sect_throne'].way, 'seize', 'C4 夺位落旗');
    eq(env.leader.relationship.affection, 0, 'C5 旧掌门情分折损（不杀不逐，闭关去了）');
    eq(env.W.currentCharData.fame, 15, 'C6 夺位得名望五分（带着「换幡」的字眼）');
    ok(env.stt.chronTexts.some(t => t.includes('换幡')), 'C7 编年如实记那一夜');
    ok(env.stt.modals.some(m => m.title.includes('那一夜')), 'C8 夺位也是一场戏');
    // 败局
    const e2 = makeSandbox({ rank: 2, contrib: 4000, leaderAff: 50 });
    const cs2 = e2.W.sectThroneProbe().coup;
    eq(cs2.rate, 20, 'C9 门中无危机：只剩底子的两成');
    const r2 = withRandom(0.99, function () { return e2.W.doThroneCoup(); });
    eq(r2, false, 'C10 逼宫败了');
    eq(e2.W.discipleState.contribution, 1750, 'C11 败局：打点五百后功绩再折半（4000-500=3500 → 1750）');
    eq(e2.W.discipleState.rank, 3, 'C12 降一级（长老 → 亲传弟子）');
    eq(e2.W.discipleState.rankName, '亲传弟子', 'C13 位分随降');
    eq(e2.leader.relationship.affection, 30, 'C14 老掌门记恨（好感 -20）');
    eq(e2.W.eventFlags['sect_throne_coup'].fails, 1, 'C15 记档「谋位不遂」');
    ok(e2.stt.chronTexts.some(t => t.includes('谋位不遂')), 'C16 败局也入编年（山门里安静了几天）');
    // 风头与旧账（先把功绩和位分攒回来，才轮得到「风头」这一关）
    e2.W.discipleState.contribution = 3500;
    e2.W.discipleState.rank = 2; e2.W.discipleState.rankName = '长老';
    e2.W.timeSystem.totalDays = 310;
    const r3 = withRandom(0.99, function () { return e2.W.doThroneCoup(); });
    eq(r3, false, 'C17 十日内再动手：执事堂的人认得你（不扣贡献）');
    eq(e2.W.discipleState.contribution, 3500, 'C18 风头期内分文不花');
    ok(e2.stt.msgs.some(m => m.includes('下月再说')), 'C19 回话是江湖话，不是计数器口吻');
    const cs3 = e2.W.sectThroneProbe().coup;
    ok(cs3.rate <= 10 + 1 && cs3.items.some(x => x[0].includes('旧账')), 'C20 旧账压成功率（明账里列出来）');
    // 门槛
    const e4 = makeSandbox({ rank: 2, contrib: 2500 });
    ok(e4.W.sectThroneProbe().coup.lack.some(x => x.includes('三千贡献')), 'C21 贡献不到三千：执事堂的门进不去');
    const e5 = makeSandbox({ rank: 1, contrib: 9000, leaderCompanion: true });
    ok(e5.W.sectThroneProbe().coup.lack.some(x => x.includes('刀兵')), 'C22 恋爱角色掌门：内宅的事轮不到刀兵');
    eq(withRandom(0.005, function () { return e5.W.doThroneCoup(); }), false, 'C23 铁律拦得住逼宫');
}

// ---------- D · 掌门案头 ----------
console.log('\n[D] 掌门案头');
{
    const env = makeSandbox({ rank: 1, contrib: 6500, leaderAff: 65, grain: 5 });
    env.W.doThroneTransmit();
    env.stt.modals.length = 0;
    env.W.openThronePanel();
    const body = env.stt.modals[env.stt.modals.length - 1].body;
    ok(body.includes('掌门案头'), 'D1 当了掌门，祖师堂变案头');
    ok(body.includes('下山籴粮'), 'D2 时机成熟的门务列出来（粮不足十石 → 籴粮在案）');
    ok(!body.includes('开大典'), 'D3 时机未到的不列（不做空头按钮）');
    ok(body.includes('灵石 500'), 'D4 公库底数摆在明面');
    env.stt.msgs.length = 0;
    env.W._throneDecide('buy_grain');
    ok(env.stt.decided && env.stt.decided.id === 'buy_grain' && env.stt.decided.sect === '少林寺', 'D5 点了真办（走治理既有接口，账入编年）');
    ok(env.stt.msgs.some(m => m.includes('办妥')), 'D6 办了有回话');
    // 未登位者看到的是风向与差距
    const e2 = makeSandbox({ rank: 7, contrib: 50 });
    e2.stt.modals.length = 0;
    e2.W.openThronePanel();
    const b2 = e2.stt.modals[e2.stt.modals.length - 1].body;
    ok(b2.includes('传位') && b2.includes('夺位'), 'D7 杂役弟子也看得见两条路（不留死路感）');
    ok(b2.includes('职位不到'), 'D8 差什么逐条明示');
    // 案头不是谁都能用
    const e3 = makeSandbox({ rank: 1, contrib: 6500 });
    e3.stt.msgs.length = 0;
    e3.W._throneDecide('buy_grain');
    ok(e3.stt.msgs.some(m => m.includes('掌门的东西')), 'D9 没登位碰案头：如实回绝');
}

// ---------- E · 读档恢复 ----------
console.log('\n[E] 读档恢复');
{
    const env = makeSandbox({ rank: 1, contrib: 6500, leaderAff: 65 });
    env.W.doThroneTransmit();
    // 模拟读档走样：职位被旧档覆盖、名册被重置
    env.W.discipleState.rank = 2; env.W.discipleState.rankName = '长老';
    env.W.SECT_LEADER_NAMES['少林寺'] = '释玄慈';
    env.W.EventBus.emit('newDay', { newDay: 360 });
    eq(env.W.discipleState.rank, 0, 'E1 新的一天对表：职位复位掌门');
    eq(env.W.SECT_LEADER_NAMES['少林寺'], '李长风', 'E2 称呼不回退（全江湖仍念你的名字）');
    // 叛门/离门后不再纠缠
    const e2 = makeSandbox({ rank: 1, contrib: 6500, leaderAff: 65 });
    e2.W.doThroneTransmit();
    e2.W.discipleState.isInSect = false;
    e2.W.discipleState.rank = 5;
    e2.W.SECT_LEADER_NAMES['少林寺'] = '释玄慈';
    e2.W.EventBus.emit('newDay', { newDay: 400 });
    eq(e2.W.discipleState.rank, 5, 'E3 人不在门中，位子不追着你跑');
    eq(e2.W.SECT_LEADER_NAMES['少林寺'], '释玄慈', 'E4 名册也不强改');
}

// ---------- F · 探针 ----------
console.log('\n[F] 探针');
{
    const env = makeSandbox({ rank: 1, contrib: 6500, leaderAff: 65 });
    const p0 = env.W.sectThroneProbe();
    ok(p0 && !p0.isLeader && p0.transmit.ok, 'F1 探针如实报资格');
    env.W.doThroneTransmit();
    const p1 = env.W.sectThroneProbe();
    ok(p1.isLeader && p1.flag && p1.flag.way === 'transmit' && p1.leaderListed === '李长风', 'F2 登位后探针齐备');
}

// ---------- G · 临终托付与旧部风波（第十三波） ----------
console.log('\n[G] 临终托付与旧部风波');
{
    // 临终托付：老掌门故去，长老连夜捧印（副掌门+功绩六千为凭）
    const env = makeSandbox({ rank: 1, contrib: 6500, leaderDead: true });
    env.stt.modals.length = 0;
    env.W.EventBus.emit('newDay', { newDay: 301 });
    ok(env.stt.modals.some(m => m.title.includes('临终托付')), 'G1 老掌门故去：众长老连夜捧印（一场戏）');
    ok(!!env.W.eventFlags['sect_throne_bequeath'], 'G2 托付落旗（只请一次）');
    env.W._throneBequeath(true);
    eq(env.W.discipleState.rank, 0, 'G3 接印视事：承接大统');
    eq(env.W.eventFlags['sect_throne'].way, 'bequeath', 'G4 登位路子记「临终托付」（不是夺位）');
    eq(env.W.currentCharData.fame, 40, 'G5 承接大统是名正言顺（名望+10，与传位同格；沙箱底数30）');
    ok(env.stt.chronTexts.some(t => t.includes('灵前接印') || t.includes('接印视事')), 'G6 编年如实记（山门有继，道统不断）');
    // 辞印：不再二请
    const e2 = makeSandbox({ rank: 1, contrib: 6500, leaderDead: true });
    e2.W.EventBus.emit('newDay', { newDay: 301 });
    e2.W._throneBequeath(false);
    ok(e2.W.eventFlags['sect_throne_bequeath'].declined, 'G7 辞印记档');
    e2.stt.modals.length = 0;
    e2.W.EventBus.emit('newDay', { newDay: 302 });
    ok(!e2.stt.modals.some(m => m.title.includes('临终托付')), 'G8 辞了就不再请（这件事没有第二次）');
    // 功绩不够/掌门还在：不惊动
    const e3 = makeSandbox({ rank: 1, contrib: 500, leaderDead: true });
    e3.W.EventBus.emit('newDay', { newDay: 301 });
    ok(!e3.W.eventFlags['sect_throne_bequeath'], 'G9 功绩不到六千，长老们不会来敲你的门');
    const e4 = makeSandbox({ rank: 1, contrib: 6500 });
    e4.W.EventBus.emit('newDay', { newDay: 301 });
    ok(!e4.W.eventFlags['sect_throne_bequeath'], 'G10 老掌门还在，托付不触发');
    // 旧部风波：夺位第七夜老长老拄杖来问
    const e5 = makeSandbox({ rank: 2, contrib: 3500, leaderAff: 20 });
    withRandom(0.005, function () { e5.W.doThroneCoup(); });
    const am = e5.W.eventFlags['sect_throne_aftermath'];
    ok(am && am.sect === '少林寺', 'G11 夺位落下旧部风波的账（第七夜见）');
    e5.W.timeSystem.totalDays = 307;
    e5.stt.modals.length = 0;
    e5.W.EventBus.emit('newDay', { newDay: 307 });
    ok(e5.stt.modals.some(m => m.title.includes('旧部人心')), 'G12 第七夜：老长老拄杖上祖师堂');
    const morale0 = e5.W.SECT_INTERNAL['少林寺'].morale;
    e5.W._throneAftermath('kind');
    eq(e5.W.SECT_INTERNAL['少林寺'].morale, morale0 + 3, 'G13 宽待：旧人的人心安了一半（士气+3）');
    ok(!e5.W.eventFlags['sect_throne_aftermath'], 'G14 答了，风波出清');
    ok(e5.stt.chronTexts.some(t => t.includes('看好山门')), 'G15 老长老的话入编年');
    // 悬着不答：三十日后人心真凉
    const e6 = makeSandbox({ rank: 2, contrib: 3500, leaderAff: 20 });
    withRandom(0.005, function () { e6.W.doThroneCoup(); });
    e6.W.timeSystem.totalDays = 307;
    e6.W.EventBus.emit('newDay', { newDay: 307 });
    const morale6 = e6.W.SECT_INTERNAL['少林寺'].morale;
    e6.W.timeSystem.totalDays = 330;
    e6.W.EventBus.emit('newDay', { newDay: 330 });
    eq(e6.W.SECT_INTERNAL['少林寺'].morale, morale6 - 5, 'G16 悬着一个月不答：老长老下山，人心凉了（士气-5）');
    ok(!e6.W.eventFlags['sect_throne_aftermath'], 'G17 凉透了，这笔账也就结了');
    ok((e6.W.eventFlags['qi_street'] || []).some(t => t.text.includes('下山')), 'G18 街谈看得见（没人敢送）');
}

console.log('\n========== sect-throne: ' + pass + ' 通过, ' + fail + ' 失败 ==========');
process.exit(fail ? 1 : 0);
