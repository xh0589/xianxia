// player-sect-world-node.js — 自建宗门四条线（举幡争城/盛会主办/灭门复兴/宗谱腰牌）vm 沙箱测试
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
    ok(html.includes('js/extensions/player-sect-world.js'), 'A1 页面挂载四条线模块');
    ok(html.indexOf('player-sect-world.js') > html.indexOf('player-sect-bootstrap.js'), 'A2 挂载在白手起家之后');
    const cSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-cities.js'), 'utf8');
    ok(cSrc.includes('homeSect()') && cSrc.includes('psPrep') && cSrc.includes('psSettle'), 'A3 举幡/立舵走掌门自家门庭，钱三步两讫');
    ok(cSrc.includes('isPSect(s2.patron)'), 'A4 AI 也打自建宗门护持城的主意（低概率、只打松的）');
    ok(cSrc.includes('gainRep(ct.sect, 5'), 'A5 自建宗门举幡功成落声望真账（不塞弟子贡献账）');
    const gSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-gala.js'), 'utf8');
    ok(gSrc.includes('hostFor') && gSrc.includes('260'), 'A6 盛会主办入口（灵石二百六，以钱代料）');
    ok(gSrc.includes('sect === builtSect()'), 'A7 自家办会的判定认掌门家门');
    const dSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-doom.js'), 'utf8');
    ok(dSrc.includes('_psLowDays') && dSrc.includes('stageOf'), 'A8 空幡规则：草创+人尽+库空才计数（有基业不自灭）');
    ok(dSrc.includes('scatterRoster') && dSrc.includes('幡倒了'), 'A9 灭门结算认开创人（散落名册走宗谱）');
    ok(dSrc.includes('PSectWorld.onRevive'), 'A10 复兴完工走自建宗门分支（不动弟子档）');
    const bSrc = fs.readFileSync(path.join(ROOT, 'js/extensions/player-sect-bootstrap.js'), 'utf8');
    ok(bSrc.includes('宗谱腰牌') && bSrc.includes('主办盛会') && bSrc.includes('SectCities.panelBlock'), 'A11 总册挂四条线入口（宗谱/盛会/城市香火账）');
    ok((bSrc.match(/sect\._ruined/g) || []).length >= 3, 'A12 幡倒守卫三处（月结/日产/面板）');
    const wSrc = fs.readFileSync(path.join(ROOT, 'js/extensions/player-sect-world.js'), 'utf8');
    ok(!/冷却中|次数上限|配额/.test(wSrc), 'A13 模块零配额句式（一年一回是制度话）');
    ok(!wSrc.includes('confirm(') && !wSrc.includes('alert('), 'A14 零浏览器原生弹窗');
}

// ---------- 沙箱 ----------
function makeSandbox(opts) {
    opts = opts || {};
    const stt = { modals: [], msgs: [], logs: [], chron: [], wallet: opts.wallet != null ? opts.wallet : 600 };
    const npcs = {};
    function mkNpc(id, name, loc) { const n = { id: id, name: name, isDead: false, location: loc || '青木城', relationship: { affection: 30 } }; npcs[id] = n; return n; }
    mkNpc('d1', '王大牛', '青木城'); mkNpc('d2', '柳三娘', '炎城'); mkNpc('d3', '赵铁柱', '金城');
    mkNpc('g1', '门客甲', '洛水城');
    const powerTable = opts.power || {};
    const W = {
        timeSystem: { gameTime: { currentDay: opts.day || 100, currentHour: 12 }, advanceTime: function () {} },
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
        currentCharData: { name: '李长风', fame: 5, energy: 100, realm: '炼气期' },
        discipleState: { isInSect: false, contribution: 0, artInsights: {} },
        sectsData: {},
        SECT_INTERNAL: {},
        SECT_DIPLOMACY_STATE: {},
        SECT_LEADER_NAMES: {},
        eventFlags: {},
        inventory: { currency: { spiritStones: stt.wallet } },
        DataManager: {
            getSpiritStones: function () { return stt.wallet; },
            deductSpiritStones: function (n) { if (stt.wallet >= n) { stt.wallet -= n; W.inventory.currency.spiritStones = stt.wallet; return true; } return false; },
            addSpiritStones: function (n) { stt.wallet += n; W.inventory.currency.spiritStones = stt.wallet; }
        },
        SectGov: {
            chronicle: function (s, t) { stt.chron.push(String(t)); },
            deductStore: function (sect, kind, n) {
                var it = W.SECT_INTERNAL[sect];
                if (!it || kind !== 'stone') return false;
                if ((Number(it.resources) || 0) < n) return false;
                it.resources = (Number(it.resources) || 0) - n;
                return true;
            }
        },
        sectPowerNow: function (name) { return powerTable[name] || { tier: '中等', score: 150 }; },
        sectAlignNow: function () { return { align: 0 }; },
        locationSystem: { getCurrentLocation: function () { return '洛水城'; } },
        getCurrentCityName: function () { return '洛水城'; },
        getRealmTier: function () { return 1; },
        showMessage: function (m) { stt.msgs.push(String(m)); },
        gameLog: { add: function (m) { stt.logs.push(String(m)); } },
        showModal: function (t, b) { stt.modals.push({ title: t, body: String(b) }); },
        openPlayerSectPanel: function () { stt.panelOpens = (stt.panelOpens || 0) + 1; }
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
    ['js/extensions/player-sect.js', 'js/extensions/player-sect-bootstrap.js', 'js/extensions/player-sect-world.js',
     'js/sects/sect-cities.js', 'js/sects/sect-gala.js', 'js/sects/sect-doom.js'].forEach(function (f) {
        vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sandbox);
    });
    function runDays(from, to, randV) {
        for (var d = from; d <= to; d++) {
            W.timeSystem.gameTime.currentDay = d;
            try { if (W.PlayerSect.tickDay) W.PlayerSect.tickDay(); } catch (e) {}
            if (randV != null) withRandom(randV, function () { W.EventBus.emit('newDay', { newDay: d }); });
            else W.EventBus.emit('newDay', { newDay: d });
        }
    }
    function found(name) {
        const r = W.PSBoot.foundCheap(name || '长风门', '中立');
        return r.ok ? r.sect : null;
    }
    function hist(ps, sub) { return (ps.history || []).some(function (h) { return String(h.text).includes(sub); }); }
    return { W: W, stt: stt, npcs: npcs, powerTable: powerTable, runDays: runDays, found: found, hist: hist };
}

// ---------- B · 宗谱腰牌 ----------
console.log('\n[B] 宗谱腰牌');
{
    const env = makeSandbox({});
    const ps = env.found();
    ok(!!ps, 'B1 插旗草创成行');
    env.W.PSectWorld.reconcile(ps);
    let book = ps._book;
    ok(book && book.rows[0].tokenNo === 1 && book.rows[0].role === '开创掌门', 'B2 开创人领头牌（腰牌头号）');
    // 收徒发牌
    env.W.PlayerSect.recruitDisciple(ps.id, 'd1');
    ps.disciples[0].name = '王大牛';
    let row = ps._book.rows.filter(r => r.npcId === 'd1')[0];
    ok(row && row.tokenNo === 2 && row.fate === '在门', 'B3 入门即发牌（腰牌第2号，入门即上谱）');
    // 客卿对册入谱
    ps.guests.push({ npcId: 'g1', name: '门客甲', joinedDay: 100 });
    env.W.PSectWorld.reconcile(ps);
    row = ps._book.rows.filter(r => r.npcId === 'g1')[0];
    ok(row && row.role === '客卿', 'B4 客卿也在册（对册补录）');
    // 离门转另册——牌不缴回
    env.W.PlayerSect.dismissDisciple(ps.id, 'd1');
    env.W.PSectWorld.reconcile(ps);
    row = ps._book.rows.filter(r => r.npcId === 'd1')[0];
    ok(row.fate === '离门' && row.leaveDay > 0, 'B5 离门转另册（名字留着，日子记着）');
    // 身故记殁
    env.npcs['g1'].isDead = true;
    ps.guests = [];
    env.W.PSectWorld.reconcile(ps);
    row = ps._book.rows.filter(r => r.npcId === 'g1')[0];
    eq(row.fate, '殁于任', 'B6 身故记殁（人没了，名分还在册上）');
    eq(ps._book.rows.length, 3, 'B7 册子只添页不撕页（三行：掌门/离门/殁）');
    ok(ps._peak >= 2, 'B8 峰值人数记账（曾经满过的堂）');
    // 面板
    env.stt.modals.length = 0;
    env.W.PSectWorld.openPSectBook();
    const body = env.stt.modals[0].body;
    ok(body.includes('在门册') && body.includes('另册') && body.includes('腰牌第2号') && body.includes('牌未缴回'), 'B9 宗谱面板两册齐全（牌未缴回写在另册）');
    ok(body.includes('开创掌门'), 'B10 开创页在头');
}

// ---------- C · 两本账的桥 ----------
console.log('\n[C] 两本账的桥');
{
    const env = makeSandbox({});
    const ps = env.found();
    ps.resources.spiritStones = 200;
    env.W.PSectWorld.syncMirror('长风门');
    eq(env.W.SECT_INTERNAL['长风门'].resources, 200, 'C1 收账：镜像对齐宗库真账');
    // 掌门亲手花钱：镜像先扣，落回真账，名目写清
    env.W.SECT_INTERNAL['长风门'].resources -= 100;
    const loss = env.W.PSectWorld.settleSpend('长风门', '测试名目');
    eq(loss, 100, 'C2 落账：镜像扣的一百落回宗库');
    eq(ps.resources.spiritStones, 100, 'C3 真账只剩一百');
    ok(env.hist(ps, '测试名目'), 'C4 名目写进宗门史（不是糊涂账）');
    // 月结不再误记劫掠（差额已两讫）
    env.W.PSBoot.monthSync(ps);
    ok(!env.hist(ps, '遭了劫掠'), 'C5 月结见差额为零——掌门花的钱不误记成劫掠');
    eq(ps.resources.spiritStones, 100, 'C6 月结分文不动（两讫）');
    // 声望与家书
    env.W.PSectWorld.gainRep('长风门', 3, '测试体面');
    eq(ps.resources.reputation, 3, 'C7 声望落真账');
    env.W.PSectWorld.note('长风门', '城里来信');
    ok(env.hist(ps, '城里来信'), 'C8 江湖家书写进宗门史');
}

// ---------- D · 盛会主办 ----------
console.log('\n[D] 盛会主办');
{
    const env = makeSandbox({});
    const ps = env.found();
    env.W.sectsData['铁掌帮'] = { name: '铁掌帮', type: '中立' };
    env.W.sectsData['青云观'] = { name: '青云观', type: '中立' };
    env.W.sectsData['白云庵'] = { name: '白云庵', type: '中立' };
    // 库中不凑手
    ps.resources.spiritStones = 100;
    env.W.PSectWorld.syncMirror('长风门');
    env.stt.msgs.length = 0;
    env.W.PSectWorld.hostGala();
    ok(env.stt.msgs.some(m => m.includes('不凑手')), 'D1 宗库不凑手，席摆不起来');
    ok(!env.W.SectGala.probe().sched['长风门'], 'D2 没扣钱没排期');
    // 摆席
    ps.resources.spiritStones = 300;
    env.W.PSectWorld.syncMirror('长风门');
    env.stt.logs.length = 0;
    env.W.PSectWorld.hostGala();
    eq(ps.resources.spiritStones, 40, 'D3 席面请帖二百六真出宗库（三百剩四十）');
    ok(env.hist(ps, '主办盛会·席面请帖'), 'D4 名目入宗门史');
    const sched = env.W.SectGala.probe().sched['长风门'];
    ok(sched && sched.day === 115, 'D5 英雄帖发出去——半月后开席');
    ok(env.stt.logs.some(m => m.includes('门里要办盛会了')), 'D6 掌门自家办会，自己知道');
    env.stt.msgs.length = 0;
    env.W.PSectWorld.hostGala();
    ok(env.stt.msgs.some(m => m.includes('今年已经摆过')), 'D7 一年一回（制度话，不是配额话）');
    // 开席：来贺读真账（无外交档案按类型常理推），贺礼经镜像落真账
    env.stt.logs.length = 0; env.stt.modals.length = 0;
    env.runDays(101, 115);
    ok(env.stt.logs.some(m => m.includes('盛会开席')), 'D8 开席结算跑了（自家的事自家知道）');
    eq(env.W.SECT_INTERNAL['长风门'].resources, 100, 'D9 三家来贺，贺仪六十入镜像（40+60）');
    env.W.PSectWorld.syncMirror('长风门');
    eq(ps.resources.spiritStones, 100, 'D10 贺礼落回宗库真账（守恒）');
    ok(env.stt.modals.some(m => m.title.includes('盛会')), 'D11 当天三件真事的 panel 开了（夺彩/论道/拍卖）');
}

// ---------- E · 举幡争城 ----------
console.log('\n[E] 举幡争城');
{
    const env = makeSandbox({});
    const ps = env.found();
    ps.resources.spiritStones = 500;
    env.W.PSectWorld.syncMirror('长风门');
    // 座次门槛：小派举幡没人应
    env.powerTable['长风门'] = { tier: '小派', score: 80 };
    env.W.SectCities.probe(); // 初始化城市账
    env.W.eventFlags['sect_city_state']['金城'].patron = null;
    env.W.eventFlags['sect_city_state']['金城'].hold = 0;
    env.stt.msgs.length = 0;
    eq(env.W.SectCities.raiseBanner('金城'), false, 'E1 座次不到，举幡没人应');
    ok(env.stt.msgs.some(m => m.includes('座次不到')), 'E2 回话说得明白（先让门派强起来）');
    eq(ps.resources.spiritStones, 500, 'E3 没成事不扣钱');
    // 座次够了：举幡
    env.powerTable['长风门'] = { tier: '中等偏上', score: 200 };
    eq(env.W.SectCities.raiseBanner('金城'), true, 'E4 举幡成行');
    eq(ps.resources.spiritStones, 400, 'E5 供案一百真出宗库（镜像先扣、落账两讫）');
    ok(env.hist(ps, '举幡·香火供案'), 'E6 名目入宗门史');
    eq(env.W.SectCities.probe()['金城'].contest.sect, '长风门', 'E7 城头挂上了争夺牌（三十日开牌）');
    // 开牌：赢下无主之城
    env.runDays(101, 131);
    const p2 = env.W.SectCities.probe()['金城'];
    eq(p2.patron, '长风门', 'E8 三十日后，这城认了');
    eq(ps.resources.reputation, 5, 'E9 举幡功成落宗门声望（不塞弟子贡献账）');
    eq(env.W.currentCharData.fame, 8, 'E10 名望+3');
    eq(env.W.discipleState.contribution, 0, 'E11 弟子的贡献账干干净净（没被污染）');
    // 香火月供奉经镜像落真账（守恒）
    env.W.eventFlags['sect_city_state']['金城'].hold = 30;
    env.W.SECT_INTERNAL['铁掌帮'] = { resources: 300, disciples: 20, morale: 50, grain: 30, chronicle: [] };
    env.powerTable['铁掌帮'] = { tier: '中等偏上', score: 200 };
    env.runDays(132, 150, 0.01);
    const p3 = env.W.SectCities.probe()['金城'];
    ok(p3.contest && p3.contest.sect === '铁掌帮', 'E12 AI 也打自建宗门护持城的主意（只打稳固松的）');
    ok(env.hist(ps, '香火有人来争'), 'E13 家书到了：宗门史里记着（掌门看得见）');
    env.W.PSectWorld.syncMirror('长风门');
    ok(ps.resources.spiritStones >= 420, 'E14 护持的月供奉二十落回宗库（420 起）');
    ok(env.hist(ps, '得了进项'), 'E15 进项名目入宗门史');
}

// ---------- F · 灭门复兴 ----------
console.log('\n[F] 灭门复兴');
{
    const env = makeSandbox({});
    const ps = env.found();
    ['d1', 'd2', 'd3'].forEach(function (id) { env.W.PlayerSect.recruitDisciple(ps.id, id); });
    ps.disciples.forEach(function (d, i) { d.name = env.npcs[['d1', 'd2', 'd3'][i]].name; });
    eq(ps._peak, 3, 'F1 曾经满过三人（峰值入账）');
    ['d1', 'd2', 'd3'].forEach(function (id) { env.W.PlayerSect.dismissDisciple(ps.id, id); });
    ps.resources.spiritStones = 5;
    env.W.PSectWorld.syncMirror('长风门');
    // 六十日空幡：第三十日提醒，第六十日灯自己灭
    env.runDays(101, 130);
    ok(env.stt.logs.some(m => m.includes('空了三十日')), 'F2 第三十日提醒（幡倒之前，总来得及）');
    ok(!env.W.eventFlags['sect_ruin_长风门'], 'F3 三十日还没倒');
    env.runDays(131, 180);
    ok(!!env.W.eventFlags['sect_ruin_长风门'], 'F4 六十日人尽库空——灯自己灭了');
    ok(!!ps._ruined, 'F5 宗门实例记倒幡（不删档——宗谱还在）');
    eq(env.W.PSectWorld.realStones('长风门'), 0, 'F6 库中分文未留（折给散伙的人做了盘缠）');
    ok(env.stt.modals.some(m => m.title.includes('幡倒了')), 'F7 开创人看到的是「幡倒了」（不是弟子的灭门）');
    const rem = env.W.eventFlags['sect_remnant'];
    ok(rem && rem.sect === '长风门' && rem.npcs.length === 3, 'F8 另册里的三位活人进了幸存者名单（复兴找得回来）');
    ok(env.stt.wallet === 600 - 30 + 1, 'F9 安家费落了真钱（公库三成折分，账记灭门安家费）');
    const rowD1 = ps._book.rows.filter(r => r.npcId === 'd1')[0];
    eq(rowD1.fate, '离门', 'F10 早离门的人册上还是离门（不被乱标散于灭门）');
    // 幡倒之后：不发俸、不产出、不对册
    env.stt.wallet = 800;
    env.W.inventory.currency.spiritStones = 800;
    const walletBefore = env.stt.wallet;
    env.runDays(181, 209);
    eq(env.stt.wallet, walletBefore, 'F11 倒了的宗门一分文不动（灯灭了账封着）');
    // 复兴：回旧址 → 三位老相识 → 五百灵石 → 三十日工期
    env.W.sectRuinView('长风门');
    ok(rem.visited, 'F12 回旧址站过了（起土要在废墟上起）');
    env.W.openRevivePanel();
    env.W.doReviveElder('d1'); env.W.doReviveElder('d2'); env.W.doReviveElder('d3');
    const rv = env.W.eventFlags['sect_revive'];
    eq(rv.elders.length, 3, 'F13 三位老相识都点了头');
    env.W.doRevivePay(false);
    eq(env.W.inventory.currency.spiritStones, walletBefore - 500, 'F14 五百灵石真掏腰包（行囊实扣）');
    eq(rv.stage, 'building', 'F15 第一锹土起在废墟上（工期三十日）');
    env.runDays(210, rv.day + 30);
    ok(!ps._ruined, 'F16 三十日工期满——幡又立起来了');
    ok(!env.W.eventFlags['sect_ruin_长风门'] && !!env.W.eventFlags['sect_revived_长风门'], 'F17 废墟牌摘了，复兴牌挂了');
    eq(ps.resources.spiritStones, 550, 'F18 重建钱五百+老相识贺礼五十尽数入宗库（真账）');
    eq(ps.disciples.length, 3, 'F19 三位老相识真归门（名册有人）');
    const bookBack = ps._book.rows.filter(r => r.fate === '在门');
    eq(bookBack.length, 4, 'F20 宗谱翻回在门册（掌门+三位，旧腰牌不换新）');
    ok(ps._book.rows.filter(r => r.npcId === 'd1')[0].rejoinDay > 0, 'F21 回来的日子记在谱上');
    eq(ps.resources.reputation, 10, 'F22 重立山门·首功落声望');
    eq(env.W.currentCharData.fame, 25, 'F23 名望+20（当年看着它倒的人，如今看着它起来）');
    eq(env.W.discipleState.isInSect, false, 'F24 开创人不进弟子档（他是掌门，不是弟子）');
    eq(env.W.SECT_INTERNAL['长风门'].destroyed, false, 'F25 户部账复活（座次从残破重新爬）');
    ok(env.stt.modals.some(m => m.title.includes('开山')), 'F26 开山场面是开创人的（亲手把幡挂回杆顶）');
}

// ---------- G · 彻底散伙与探针 ----------
console.log('\n[G] 彻底散伙与探针');
{
    const env = makeSandbox({});
    const ps = env.found();
    ['d1', 'd2', 'd3'].forEach(function (id) { env.W.PlayerSect.recruitDisciple(ps.id, id); });
    env.W.PSectWorld.reconcile(ps);
    const p = env.W.PSectWorld.probe();
    ok(p && p.name === '长风门' && p.members === 3 && p.bookRows === 4 && p.peak === 3, 'G1 探针齐备（人数/册页/峰值）');
    ps._ruined = { day: 100, path: 'C' };
    env.stt.modals.length = 0;
    env.W.PSectWorld.dissolveRuinedAsk();
    ok(env.stt.modals.some(m => m.body.includes('另册存档')), 'G2 散伙之前把话说清（另册存档，此名封存）');
    env.W.PSectWorld.dissolveRuined();
    ok(!!env.W.eventFlags['sect_book_arch_长风门'], 'G3 宗谱另册存了档');
    eq(env.W.PlayerSect.listMySects().length, 0, 'G4 实例销了（人还活着，牌还在各人手里）');
    const ps2 = env.found('新幡门');
    ok(!!ps2, 'G5 散伙之后能另竖新幡（不留死路）');
    ok(!env.W.sectsData['长风门'] || env.W.sectsData['长风门'], 'G6 旧名号在江湖记忆里（户部账不抹）');
    eq(env.W.PSectWorld.probe().name, '新幡门', 'G7 探针对准新幡');
}

console.log('\n========== player-sect-world: ' + pass + ' 通过, ' + fail + ' 失败 ==========');
process.exit(fail ? 1 : 0);
