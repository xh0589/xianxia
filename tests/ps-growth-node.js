// ps-growth-node.js — 第二十一波 · 弟子是活人（真成长/镇山秘艺/门内日常/派遣下山/病殁治丧）vm 沙箱测试
// 第二十二波追加：同门交情（日常戏写进关系图真账·嫌隙能磨平·交情册可查）+ 护身符（历练死签减半）+ 客卿派遣
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
    ok(html.includes('js/extensions/player-sect-life.js'), 'A1 页面挂载弟子是活人模块');
    ok(html.indexOf('player-sect-venture.js') < html.indexOf('player-sect-life.js'), 'A2 生计模块先载（心境接口是它的）');
    const lifeSrc = fs.readFileSync(path.join(ROOT, 'js/extensions/player-sect-life.js'), 'utf8');
    ok(lifeSrc.includes('composeArt') && lifeSrc.includes('upgradeArt') && lifeSrc.includes('warEdge'), 'A3 镇山秘艺三件套在册');
    ok(lifeSrc.includes('sendAway') && lifeSrc.includes('settleReturns') && lifeSrc.includes('MISSIONS'), 'A4 派遣下山在册');
    ok(lifeSrc.includes('dailyLifeTick') && lifeSrc.includes('funeral'), 'A5 门内日常与治丧在册');
    ok(!lifeSrc.includes('confirm(') && !lifeSrc.includes('alert('), 'A6 零浏览器原生弹窗');
    ok(!/冷却|次数上限|配额/.test(lifeSrc), 'A7 零配额句式（凶吉天数都是制度话）');
    const mtSrc = fs.readFileSync(path.join(ROOT, 'js/sects/master-teach.js'), 'utf8');
    ok(mtSrc.includes('_teachProgress') && mtSrc.includes('discipleBreakthrough') && mtSrc.includes('REALM_ORDERS'), 'A8 传功线接真境界（自有进度账+破关阶梯）');
    ok(mtSrc.includes('行商寄回') && mtSrc.includes('_purse'), 'A9 反哺改真账（荷包里寄回，不再每日凭空）');
    ok(!mtSrc.includes('gradCount * DAILY_STONE_PER_GRAD'), 'A10 旧的每日凭空反哺已退役');
    const warSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-war.js'), 'utf8');
    ok(warSrc.includes('PSectLife.warEdge') && warSrc.includes("startWar(sectId, 'attack', home)") && warSrc.includes("startWar(p.atk, 'attack', psHome)"), 'A11 战阵折敌接进开战线（守山/攻山/相援三路都带自家山门）');
    const uiSrc = fs.readFileSync(path.join(ROOT, 'js/extensions/player-sect-ui.js'), 'utf8');
    ok(uiSrc.includes('PSectLife.openDispatch') && uiSrc.includes('composeArt') && uiSrc.includes('d.realm'), 'A12 总册有秘艺栏、弟子行有境界与遣字按钮');
    const wSrc = fs.readFileSync(path.join(ROOT, 'js/extensions/player-sect-world.js'), 'utf8');
    ok(wSrc.includes('PSectLife.funeral') && wSrc.includes('!x.away'), 'A13 月册病殁走治丧；战殁只从在山的人里挑');
    const venSrc = fs.readFileSync(path.join(ROOT, 'js/extensions/player-sect-venture.js'), 'utf8');
    ok(venSrc.includes('homeCount') && venSrc.includes('bumpMood: bumpMood'), 'A14 接活人手认在山的人；心境单动有出口');
    ok(lifeSrc.includes('bondUp') && lifeSrc.includes('bondGrudge') && lifeSrc.includes('bondSeed') && lifeSrc.includes('npcRelationships'), 'A15 同门交情写关系图真源（第二十二波）');
    ok(lifeSrc.includes('openBondBoard') && lifeSrc.includes('deathLine'), 'A16 交情册可查；历练死签认护身符');
    const bsSrc = fs.readFileSync(path.join(ROOT, 'js/extensions/player-sect-bootstrap.js'), 'utf8');
    ok(bsSrc.includes('PSectLife.openDispatch'), 'A17 客卿面板也有遣字按钮');
    ok(uiSrc.includes('openBondBoard'), 'A18 总册弟子栏挂同门交情入口');
}

// ---------- 沙箱 ----------
const REALMS = ['凡人', '炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'];
function makeSandbox(opts) {
    opts = opts || {};
    const stt = { modals: [], msgs: [], logs: [], chron: [], wallet: opts.wallet != null ? opts.wallet : 600, battles: [], saved: 0, dayHandlers: [] };
    const npcs = {};
    function mkNpc(id, name, realm) {
        const n = { id: id, name: name, isDead: false, location: '青木城', relationship: { affection: 0 }, combat: { realm: realm || '炼气', layer: 1 } };
        npcs[id] = n; return n;
    }
    mkNpc('d1', '王大牛'); mkNpc('d2', '柳三娘'); mkNpc('d3', '赵铁柱');
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
        npcManager: {
            getNPC: function (id) { return npcs[id] || null; },
            getAllNPCs: function () { return Object.keys(npcs).map(function (k) { return npcs[k]; }); }
        },
        currentCharData: { name: '李长风', fame: 0, energy: 100, realm: '炼气' },
        discipleState: { isInSect: false, contribution: 0, rank: null },
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
        sectPowerWarMod: function () {},
        sectAlignShift: function () {},
        sectIsRuined: function (s) { return !!W.eventFlags['sect_ruin_' + s]; },
        saveSectDiplomacy: function () { stt.saved++; },
        locationSystem: { getCurrentLocation: function () { return '洛水城'; } },
        getRealmTier: function (r) { var i = REALMS.indexOf(String(r || '')); return i >= 0 ? i : 1; },
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
    ['js/extensions/player-sect.js', 'js/extensions/player-sect-bootstrap.js', 'js/extensions/player-sect-venture.js',
     'js/extensions/player-sect-world.js', 'js/extensions/player-sect-life.js', 'js/npcs/marriage-offspring.js', 'js/sects/master-teach.js',
     'js/sects/sect-war.js'].forEach(function (f) {
        vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sandbox);
    });
    function found(name) {
        const r = W.PSBoot.foundCheap(name || '长风门', '中立');
        return r.ok ? r.sect : null;
    }
    function recruit(ps, id) { try { W.PlayerSect.recruitDisciple(ps.id, id); } catch (e) {} }
    function member(ps, id) {
        const all = (ps.disciples || []).concat(ps.guests || []);
        for (let i = 0; i < all.length; i++) if (all[i] && all[i].npcId === id) return all[i];
        return null;
    }
    function newDay(d, randV) {
        W.timeSystem.gameTime.currentDay = d;
        const run = function () {
            W.EventBus.emit('newDay', { newDay: d });
            stt.dayHandlers.forEach(function (h) { try { h(); } catch (e) {} });
        };
        if (randV != null) withRandom(randV, run); else run();
    }
    return { W: W, stt: stt, npcs: npcs, found: found, recruit: recruit, member: member, newDay: newDay };
}

// ---------- B · 镇山秘艺 ----------
console.log('\n[B] 镇山秘艺（一门一艺·碑刻真花钱·传功更疾·战阵折敌）');
{
    const env = makeSandbox({});
    const ps = env.found();
    const L = env.W.PSectLife;
    ok(!!ps, 'B1 插旗立宗成行');
    ok(!L.composeArt(), 'B2 草创阶段创不了艺（赁来的院子里刻不了艺碑）');
    ps.stage = 2; // 山门期
    ps.resources.spiritStones = 300;
    env.W.PSectWorld.syncMirror('长风门');
    const rep0 = Number(ps.resources.reputation);
    const art = withRandom(0.5, function () { return L.composeArt(); });
    ok(!!art && art.level === 1, 'B3 山门期创艺成行（一阶）');
    ok(art.name.indexOf('长风门·') === 0, 'B4 艺名带着宗门的名号');
    eq(ps.resources.spiritStones, 150, 'B5 碑刻抄经之资一百五十石从宗库真账扣');
    eq(env.W.SECT_INTERNAL['长风门'].resources, 150, 'B6 镜像同数（两讫）');
    eq(Number(ps.resources.reputation), rep0 + 2, 'B7 创艺长脸（声望真涨二）');
    ok(env.stt.chron.some(function (t) { return t.includes('镇山秘艺'); }), 'B8 碑立演武场记入编年');
    const again = L.composeArt();
    ok(again && again.name === art.name, 'B9 一门一艺——再创被拒，原艺还在');
    eq(ps.resources.spiritStones, 150, 'B10 拒了不扣钱');
    eq(env.W.psArtTeachMul(), 1.1, 'B11 传功进境加一成（一阶）');
    const enemy = { attack: 100, defense: 50, maxDurability: 200, durabilities: { chest: 200 } };
    ok(L.warEdge('长风门', enemy), 'B12 战阵折敌接口认自家山门');
    eq(enemy.attack, 97, 'B13 一阶折敌三分（攻）');
    eq(enemy.maxDurability, 194, 'B14 耐久同折');
    // 晋阶
    ps.resources.spiritStones = 400;
    env.W.PSectWorld.syncMirror('长风门');
    ok(L.upgradeArt(), 'B15 晋阶成行（二阶）');
    eq(ps.resources.spiritStones, 300, 'B16 晋阶的钱真出库（一百石）');
    eq(art.level, 2, 'B17 阶数真涨');
    eq(env.W.psArtTeachMul(), 1.2, 'B18 传功进境加两成（二阶）');
    const enemy2 = { attack: 100, defense: 50, maxDurability: 200 };
    L.warEdge('长风门', enemy2);
    eq(enemy2.attack, 94, 'B19 二阶折敌六分');
    // 名头按月传开
    const repB = Number(ps.resources.reputation);
    env.newDay(150);
    ok(Number(ps.resources.reputation) > repB, 'B20 月结秘艺名头传开（声望微涨）');
}

// ---------- C · 弟子真成长 ----------
console.log('\n[C] 弟子真成长（传功破关·出师破境·进度记自有账）');
{
    const env = makeSandbox({});
    const ps = env.found();
    env.recruit(ps, 'd1');
    const npc = env.npcs.d1;
    eq(npc.combat.layer, 1, 'C1 入门时炼气一层');
    let r = env.W.teachDisciple('d1');
    ok(r, 'C2 传功成行');
    eq(npc._teachProgress, 5, 'C3 感悟记自有账（+5）');
    ok(npc._cultivationProgress == null, 'C4 江湖演化字段分文未动（两本进度账不再互吃）');
    env.W.teachDisciple('d1'); env.W.teachDisciple('d1'); env.W.teachDisciple('d1');
    eq(npc._teachProgress, 20, 'C5 四次传功攒满二十点感悟');
    eq(npc.combat.layer, 2, 'C6 攒满即真突破（炼气二层）');
    ok(env.stt.logs.some(function (t) { return t.includes('修为精进'); }), 'C7 破关有报');
    env.W.teachDisciple('d1'); env.W.teachDisciple('d1'); env.W.teachDisciple('d1'); env.W.teachDisciple('d1');
    eq(npc.combat.layer, 3, 'C8 四十点感悟再破一关（炼气三层）');
    // 出师
    npc.relationship.affection = 60;
    env.W.currentCharData.realm = '金丹';
    env.stt.wallet = 200;
    const w0 = env.stt.wallet;
    ok(env.W.tryGraduateDisciple('d1'), 'C9 出师礼成行');
    ok(npc._graduated, 'C10 出师记档');
    eq(npc.combat.realm, '筑基', 'C11 出师当日当空破一境（炼气→筑基）');
    eq(npc.combat.layer, 1, 'C12 破境归一层重修');
    ok(env.stt.wallet > w0, 'C13 奉上修行积蓄（真钱入行囊）');
    ok(env.stt.chron.some(function (t) { return t.includes('破境') || t.includes('出师'); }) || env.stt.logs.some(function (t) { return t.includes('晋入'); }), 'C14 出师破境江湖有闻');
    // 老档接续：旧字段里的进度头一回读时接过来，一笔不丢
    const env4 = makeSandbox({});
    env4.npcs.d3._cultivationProgress = 25;
    env4.stt.wallet = 100;
    env4.W.teachDisciple('d3');
    eq(env4.npcs.d3._teachProgress, 30, 'C15 老档进度接续（旧账25+新课5=30，一笔不丢）');
}

// ---------- D · 按月寄回（反哺真账） ----------
console.log('\n[D] 出师弟子按月寄回（荷包真账，不再每日凭空）');
{
    const env = makeSandbox({});
    const ps = env.found();
    env.recruit(ps, 'd1');
    const npc = env.npcs.d1;
    npc._teachProgress = 40; npc.relationship.affection = 60;
    env.W.currentCharData.realm = '金丹';
    env.stt.wallet = 200;
    env.W.tryGraduateDisciple('d1');
    const purse0 = Number(npc._purse) || 0;
    const w0 = env.stt.wallet;
    env.newDay(150, 0.5); // 三十日整：行商进项入荷包，再从荷包寄回
    const earn = 12 + 2 * 8 + 4; // 筑基二阶行商：12+16+骰四 = 32
    eq(Number(npc._purse), purse0 + earn - 25, 'D1 进项先入荷包，寄回是真转账（32-25=7 留底）');
    eq(env.stt.wallet, w0 + 25, 'D2 寄回的钱真进行囊（至多寄二十五）');
    ok(env.stt.logs.some(function (t) { return t.includes('行商寄回'); }), 'D3 寄回有名目（雇主的活计）');
    const w1 = env.stt.wallet, p1 = Number(npc._purse);
    env.newDay(151, 0.5); // 非月日不寄
    eq(env.stt.wallet, w1, 'D4 不到三十日不寄钱');
    eq(Number(npc._purse), p1, 'D5 荷包分文未动');
}

// ---------- E · 病殁治丧 ----------
console.log('\n[E] 病殁治丧（棺木抚恤真出库，库空薄葬记愧）');
{
    const env = makeSandbox({});
    const ps = env.found();
    ps.resources.spiritStones = 300;
    env.W.PSectWorld.syncMirror('长风门');
    env.recruit(ps, 'd2');
    env.newDay(120); // 宗谱发牌
    env.npcs.d2.isDead = true;
    env.W.timeSystem.gameTime.currentDay = 150;
    env.W.PlayerSect.tickDay(); // 月结清册：殁录除名
    const stones0 = ps.resources.spiritStones;
    env.newDay(150);
    const row = (ps._book.rows || []).filter(function (r) { return r.npcId === 'd2'; })[0];
    ok(row && row.fate === '殁于任', 'E1 月册对出人没了（宗谱记殁）');
    eq(ps.resources.spiritStones, stones0 - 20, 'E2 棺木抚恤二十石真出库');
    ok(env.stt.chron.some(function (t) { return t.includes('治丧'); }), 'E3 治丧入编年（牌位入祖堂）');
    ok(env.stt.logs.some(function (t) { return t.includes('🕯'); }), 'E4 丧讯有报');
    // 库空薄葬
    const env2 = makeSandbox({});
    const ps2 = env2.found();
    ps2.resources.spiritStones = 0;
    env2.W.PSectWorld.syncMirror('长风门');
    env2.recruit(ps2, 'd3');
    env2.newDay(120);
    env2.npcs.d3.isDead = true;
    env2.W.timeSystem.gameTime.currentDay = 150;
    env2.W.PlayerSect.tickDay();
    env2.newDay(150);
    ok(env2.stt.chron.some(function (t) { return t.includes('薄棺'); }), 'E5 库空薄葬记愧（不凭空变出棺材钱）');
    eq(ps2.resources.spiritStones, 0, 'E6 没钱就是一分不扣');
}

// ---------- F · 派遣下山 ----------
console.log('\n[F] 派遣下山（押镖真钱/采买真货/历练真险）');
{
    const env = makeSandbox({});
    const ps = env.found();
    ps.resources.spiritStones = 200;
    env.W.PSectWorld.syncMirror('长风门');
    env.recruit(ps, 'd3');
    const L = env.W.PSectLife;
    ok(L.sendAway('d3', 'errand'), 'F1 遣下山押镖成行');
    const d = env.member(ps, 'd3');
    ok(d.away && d.away.back === env.W.timeSystem.gameTime.currentDay + 7, 'F2 行踪记档（七日后回）');
    ok(!env.W.teachDisciple('d3'), 'F3 人在山下传不了功');
    eq(env.W.PSectVenture.homeCount(ps), 0, 'F4 下山的人不占接活人手');
    // 押镖归来（不遇劫）
    const stones0 = ps.resources.spiritStones;
    env.newDay(112, 0.5);
    ok(!d.away, 'F5 到期归山（行踪销档）');
    const earn = 40 + 1 * 15 + 10; // 炼气一阶镖钱：65
    eq(ps.resources.spiritStones, stones0 + 59, 'F6 镖钱九成入宗库真账（65×0.9=59，雇主有名有姓）');
    eq(env.W.SECT_INTERNAL['长风门'].resources, Math.round(stones0 + 59), 'F7 镜像同数（两讫）');
    eq(Number(env.npcs.d3._purse), 6, 'F8 弟子抽一成入自己荷包（65-59=6）');
    ok(Number(env.npcs.d3._teachProgress) > 0, 'F9 江湖见识也是感悟');
    // 采买：真钱换真货
    const stones1 = ps.resources.spiritStones;
    ok(L.sendAway('d3', 'buy'), 'F10 遣下山采买成行');
    eq(ps.resources.spiritStones, stones1 - 60, 'F11 本钱六十石先出库');
    env.newDay(117, 0.5);
    eq(Math.floor(ps.resources.elixir), 2, 'F12 回程丹药两件入库');
    eq(Math.floor(ps.resources.weapon), 2, 'F13 回程兵器两件入库');
    // 历练：平安归
    const prog0 = Number(env.npcs.d3._teachProgress);
    L.sendAway('d3', 'train');
    env.newDay(131, 0.5);
    ok(Number(env.npcs.d3._teachProgress) > prog0, 'F14 历练感悟大涨');
    ok(!env.npcs.d3.isDead, 'F15 寻常历练人平安');
    // 历练：殁在路上（真风险）
    const env2 = makeSandbox({});
    const ps2 = env2.found();
    ps2.resources.spiritStones = 200;
    env2.W.PSectWorld.syncMirror('长风门');
    env2.recruit(ps2, 'd2');
    env2.newDay(120); // 宗谱发牌
    env2.W.PSectLife.sendAway('d2', 'train');
    const stones2 = ps2.resources.spiritStones;
    env2.newDay(134, 0.01); // 死签
    ok(env2.npcs.d2.isDead, 'F16 死签应验——人没能回来');
    eq((ps2.disciples || []).length, 0, 'F17 名册除名');
    const row2 = ((ps2._book || {}).rows || []).filter(function (r) { return r.npcId === 'd2'; })[0];
    ok(row2 && row2.fate === '殁于任', 'F18 宗谱记殁');
    eq(ps2.resources.spiritStones, stones2 - 20, 'F19 治丧抚恤照礼出库');
    ok(env2.stt.chron.some(function (t) { return t.includes('下山历练'); }), 'F20 编年记下这一趟');
    // 采买钱不够：遣不动
    const env3 = makeSandbox({});
    const ps3 = env3.found();
    ps3.resources.spiritStones = 10;
    env3.W.PSectWorld.syncMirror('长风门');
    env3.recruit(ps3, 'd1');
    ok(!env3.W.PSectLife.sendAway('d1', 'buy'), 'F21 凑不出本钱遣不动（分文不动）');
    eq(ps3.resources.spiritStones, 10, 'F22 拒了不扣钱');
    ok(!env3.member(ps3, 'd1').away, 'F23 人还在山上');
}

// ---------- G · 战殁只挑在山的人 ----------
console.log('\n[G] 守山战败：下山办差的殁不到山门上');
{
    const env = makeSandbox({});
    const ps = env.found();
    ps.resources.spiritStones = 300;
    env.W.PSectWorld.syncMirror('长风门');
    env.recruit(ps, 'd1');
    env.W.PSectLife.sendAway('d1', 'train');
    env.W.currentBattle = { _isSectWarBattle: true, _warSect: '血手门', _warSide: 'defend', _warHome: '长风门' };
    withRandom(0.01, function () { env.W.settleSectWar(false); }); // 战败+死签
    eq((ps.disciples || []).length, 1, 'G1 独苗在山下——战殁的名额落不到他头上');
    ok(!env.npcs.d1.isDead, 'G2 人活着（在山下办差）');
    ok(env.member(ps, 'd1').away, 'G3 行踪照旧');
}

// ---------- H · 门内日常 ----------
console.log('\n[H] 门内日常（日子自己会长）');
{
    const env = makeSandbox({});
    const ps = env.found();
    env.recruit(ps, 'd1'); env.recruit(ps, 'd2');
    let kind = null, day = 105, guard = 0;
    while (kind == null && guard < 300) {
        env.W.timeSystem.gameTime.currentDay = day;
        kind = env.W.PSectLife.dailyLifeTick(ps);
        day++; guard++;
    }
    ok(kind != null, 'H1 门里有两个以上的人，日子就会长出戏来');
    ok(env.stt.logs.some(function (t) { return /🥋|📖|🍲|🌙|😤|🌧|🔨/.test(t); }), 'H2 日常有画面（较劲/同读/伙房/夜话/口角/看雨/补瓦）');
    const all = (ps.disciples || []).concat(ps.guests || []);
    ok(all.some(function (d) { return Number(d.moodPts) !== 50; }), 'H3 心境真动了（不是布景）');
    // 一个人的门没有对手戏
    const env2 = makeSandbox({});
    const ps2 = env2.found();
    env2.recruit(ps2, 'd1');
    let got = null, g2 = 0;
    for (let dd = 105; dd < 300 && got == null; dd++) { env2.W.timeSystem.gameTime.currentDay = dd; got = env2.W.PSectLife.dailyLifeTick(ps2); g2++; }
    ok(got == null, 'H4 独木不成戏——一个人的门不演对手戏');
    // 下山的人不入戏
    const env3 = makeSandbox({});
    const ps3 = env3.found();
    env3.recruit(ps3, 'd1'); env3.recruit(ps3, 'd2');
    env3.W.PSectLife.sendAway('d2', 'errand');
    let got3 = null;
    for (let dd = 105; dd < 400 && got3 == null; dd++) { env3.W.timeSystem.gameTime.currentDay = dd; got3 = env3.W.PSectLife.dailyLifeTick(ps3); }
    ok(got3 == null, 'H5 一个人在山下——剩下的独苗不演对手戏');
}

// ---------- I · 秘艺助传功（集成） ----------
console.log('\n[I] 秘艺助传功（同一堂课听得更透）');
{
    const env = makeSandbox({});
    const ps = env.found();
    ps.stage = 2;
    ps.resources.spiritStones = 300;
    env.W.PSectWorld.syncMirror('长风门');
    withRandom(0.5, function () { env.W.PSectLife.composeArt(); });
    env.recruit(ps, 'd2');
    env.stt.wallet = 100;
    env.W.teachDisciple('d2');
    eq(env.npcs.d2._teachProgress, 5.5, 'I1 有艺之门传功进境加一成（5→5.5）');
}

// ---------- J · 开战三路都带秘艺 ----------
console.log('\n[J] 开战线认秘艺（守山/攻山/相援）');
{
    const env = makeSandbox({});
    const ps = env.found();
    ps.stage = 2;
    ps.resources.spiritStones = 300;
    env.W.PSectWorld.syncMirror('长风门');
    withRandom(0.5, function () { env.W.PSectLife.composeArt(); });
    // 守山
    env.W.eventFlags['sect_war_cd_血手门'] = 0;
    env.newDay(140, 0.01);
    // 直接构造：死仇压山
    const D = env.W.SECT_DIPLOMACY_STATE;
    if (D['长风门'] && D['长风门']['血手门']) { D['长风门']['血手门'].relation = -80; D['血手门']['长风门'].relation = -80; }
    let battle = null, guard = 0;
    for (let dd = 141; dd < 400 && !battle; dd++) {
        env.newDay(dd, 0.01);
        const b = env.W.currentBattle;
        if (b && b._isSectWarBattle && b._warSide === 'defend') battle = b;
        guard++;
    }
    ok(!!battle, 'J1 死仇压山真仗开打');
    // 一阶秘艺折三分：敌攻 = round(45×0.97) = 44（无盟家来援，掷骰 0.01 也可能来援——来了再折）
    ok(battle.enemy.attack <= 44, 'J2 守山之敌被秘艺折了锐气（攻≤44）');
    // 攻山
    env.W.currentBattle = null;
    D['长风门']['铁掌帮'].relation = -50; D['铁掌帮']['长风门'].relation = -50;
    env.W.eventFlags['sect_war_cd_铁掌帮'] = 0;
    const okAtk = env.W.declareWarForHome('长风门', '铁掌帮');
    ok(okAtk && env.W.currentBattle && env.W.currentBattle._warSide === 'attack', 'J3 掌门兴兵真仗开打');
    ok(env.W.currentBattle.enemy.attack <= 44, 'J4 攻山之敌也折在秘艺名下');
    eq(env.W.currentBattle._warHome, '长风门', 'J5 攻山战局带着自家山门（结算走真账）');
}

// ---------- K · 同门交情（写进关系图真账） ----------
console.log('\n[K] 同门交情（日常戏写进江湖关系图的真账）');
{
    const env = makeSandbox({});
    const ps = env.found();
    const L = env.W.PSectLife;
    env.recruit(ps, 'd1');
    env.recruit(ps, 'd2');
    const e0 = env.npcs.d1.npcRelationships && env.npcs.d1.npcRelationships['d2'];
    ok(!!e0 && e0.relation === 'sect_mate' && e0.strength === 3, 'K1 新人进门即与全门结同门边（点头之始）');
    eq(env.npcs.d2.npcRelationships['d1'].strength, 3, 'K2 边是双向的（两本都记）');
    // 交情按阶梯长：点头→熟络→知己→莫逆
    L.bondUp(env.npcs.d1, env.npcs.d2, 20, '长风门');
    eq(L.bondWord(env.npcs.d1, env.npcs.d2), '熟络', 'K3 处到二十是熟络');
    L.bondUp(env.npcs.d1, env.npcs.d2, 20, '长风门');
    eq(L.bondWord(env.npcs.d1, env.npcs.d2), '知己', 'K4 处到四十是知己');
    ok(env.stt.logs.some(function (t) { return t.includes('处厚了'); }), 'K5 升档有报（日子处厚了）');
    L.bondUp(env.npcs.d1, env.npcs.d2, 30, '长风门');
    eq(L.bondWord(env.npcs.d1, env.npcs.d2), '莫逆之交', 'K6 处到七十是莫逆之交');
    ok(env.stt.chron.some(function (t) { return t.includes('莫逆之交'); }), 'K7 莫逆上编年');
    ok((env.W.eventFlags.qi_street || []).some(function (s) { return s.text.includes('莫逆之交'); }), 'K8 莫逆传街谈');
    // 疙瘩能结也能磨平
    L.bondGrudge(env.npcs.d1, env.npcs.d2, 12);
    eq(L.bondWord(env.npcs.d1, env.npcs.d2), '嫌隙', 'K9 口角记仇真结疙瘩（怨气压在寻衅线以下）');
    ok(env.npcs.d1.npcRelationships['d2'].strength < 40, 'K10 疙瘩不是死仇（不触当街寻衅）');
    L.bondUp(env.npcs.d1, env.npcs.d2, 10, '长风门');
    ok(L.bondWord(env.npcs.d1, env.npcs.d2) !== '嫌隙', 'K11 往后的好日子能磨平疙瘩');
    // 日常戏真写交情
    const env2 = makeSandbox({});
    const ps2 = env2.found();
    env2.recruit(ps2, 'd1'); env2.recruit(ps2, 'd2');
    const s0 = env2.npcs.d1.npcRelationships['d2'].strength;
    const r0 = env2.npcs.d1.npcRelationships['d2'].relation;
    let fired = 0;
    for (let dd = 106; dd < 400; dd++) {
        env2.W.timeSystem.gameTime.currentDay = dd;
        if (env2.W.PSectLife.dailyLifeTick(ps2) != null) fired++;
    }
    ok(fired > 0, 'K12 三百天里日子长出戏来');
    const e2 = env2.npcs.d1.npcRelationships['d2'];
    ok(e2.strength !== s0 || e2.relation !== r0, 'K13 戏是写进关系图真账的（边动了）');
    // 交情册可查（先把边喂到有名目，再开册）
    env2.W.PSectLife.bondUp(env2.npcs.d1, env2.npcs.d2, 5, ps2.name);
    env2.W.PSectLife.openBondBoard();
    const mb = env2.stt.modals[env2.stt.modals.length - 1];
    ok(mb && mb.body.includes('同门交情册') && mb.body.includes('王大牛') && mb.body.includes('柳三娘'), 'K14 交情册开得出、点得出名');
}

// ---------- L · 护身符（历练死签减半） ----------
console.log('\n[L] 护身符（带着符的人，死签减半）');
{
    const env = makeSandbox({});
    const ps = env.found();
    ps.resources.spiritStones = 200;
    env.W.PSectWorld.syncMirror('长风门');
    env.recruit(ps, 'd1');
    ok(env.W.PSectLife.sendAway('d1', 'train', true), 'L1 赠符遣下山成行');
    eq(ps.resources.spiritStones, 190, 'L2 香火钱十石真出库');
    ok(env.member(ps, 'd1').away.charm === true, 'L3 符随行踪入档');
    env.newDay(119, 0.015); // 死签线：不带符是 0.02（中），带符减半是 0.01（不中）
    ok(!env.npcs.d1.isDead, 'L4 同一支签，带符的人活了下来（死签减半）');
    ok(!env.member(ps, 'd1').away, 'L5 人已归山');
    // 不带符的同一支签
    const env2 = makeSandbox({});
    const ps2 = env2.found();
    ps2.resources.spiritStones = 200;
    env2.W.PSectWorld.syncMirror('长风门');
    env2.recruit(ps2, 'd2');
    env2.W.PSectLife.sendAway('d2', 'train');
    env2.newDay(119, 0.015);
    ok(env2.npcs.d2.isDead, 'L6 不带符出门，这支签就是要命的（真赌命）');
    // 符只随历练走
    const env3 = makeSandbox({});
    const ps3 = env3.found();
    ps3.resources.spiritStones = 200;
    env3.W.PSectWorld.syncMirror('长风门');
    env3.recruit(ps3, 'd3');
    env3.W.PSectLife.sendAway('d3', 'errand', true);
    eq(ps3.resources.spiritStones, 200, 'L7 押镖没有死签——符钱不收');
    ok(!env3.member(ps3, 'd3').away.charm, 'L8 符不挂在押镖的行踪上');
    // 凑不出香火钱：符请不来，人也不动
    const env4 = makeSandbox({});
    const ps4 = env4.found();
    ps4.resources.spiritStones = 5;
    env4.W.PSectWorld.syncMirror('长风门');
    env4.recruit(ps4, 'd1');
    ok(!env4.W.PSectLife.sendAway('d1', 'train', true), 'L9 香火钱凑不出，赠符的差遣办不成');
    ok(!env4.member(ps4, 'd1').away, 'L10 办不成人就没动（要走走不带符的路子）');
}

// ---------- M · 客卿也能遣下山 ----------
console.log('\n[M] 客卿派遣（机制与弟子同一套）');
{
    const env = makeSandbox({});
    const ps = env.found();
    ps.resources.spiritStones = 200;
    ps.guests = ps.guests || [];
    ps.guests.push({ npcId: 'd2', name: '柳三娘', salary: 5 });
    ok(env.W.PSectLife.sendAway('d2', 'errand'), 'M1 客卿也遣得下山');
    eq(env.W.PSectVenture.homeCount(ps), 0, 'M2 下山的客卿不占人手');
    const stones0 = ps.resources.spiritStones;
    env.newDay(112, 0.5);
    ok(ps.resources.spiritStones > stones0, 'M3 客卿押镖归来，镖钱一样入宗库');
    ok((ps.guests || []).length === 1, 'M4 人归了，客册照旧');
}

// ---------- N · 弟子结伴走（第二十八波：道侣与结伴下山） ----------
console.log('\n[N] 弟子结伴走（主婚结道侣·道侣同修·丧偶真痛·结伴下山）');
{
    const env = makeSandbox({});
    const ps = env.found();
    ps.resources.spiritStones = 300;
    env.W.PSectWorld.syncMirror('长风门');
    env.recruit(ps, 'd1'); env.recruit(ps, 'd2'); env.recruit(ps, 'd3');
    const L = env.W.PSectLife;
    const n1 = env.npcs.d1, n2 = env.npcs.d2, n3 = env.npcs.d3;
    // 情分不到，婚不可强主
    L.bondUp(n1, n2, 10, '长风门'); // 3+10=13 点头之交
    ok(!L.marryPair('d1', 'd2'), 'N1 点头之交主不了婚');
    eq(ps.resources.spiritStones, 300, 'N2 拒了不扣钱（分文未动）');
    // 莫逆之交 → 主婚成礼
    L.bondUp(n1, n2, 60, '长风门'); // 73 莫逆
    ok(L.marryPair('d1', 'd2'), 'N3 莫逆之交请掌门主婚——成了');
    eq(ps.resources.spiritStones, 220, 'N4 仪程之资八十石真出库');
    eq(env.W.SECT_INTERNAL['长风门'].resources, 220, 'N5 镜像同数（两讫）');
    ok(n1.daoMate === 'd2' && n2.daoMate === 'd1', 'N6 婚书两本都记（互为道侣）');
    eq(L.bondWord(n1, n2), '道侣', 'N7 交情的话从此改口——道侣');
    ok(env.stt.chron.some(t => t.includes('办了婚事')), 'N8 宗谱并记入编年');
    ok((env.W.eventFlags.qi_street || []).some(s => s.text.includes('道家喜事')), 'N9 喜事传街谈');
    // 道侣不二心
    L.bondUp(n1, n3, 70, '长风门');
    ok(!L.marryPair('d1', 'd3'), 'N10 已有道侣，婚不可再主');
    // 交情册：道侣亮灯、莫逆可当场主婚
    L.openBondBoard();
    const mb = env.stt.modals[env.stt.modals.length - 1];
    ok(mb && mb.body.includes('🏮 道侣'), 'N11 交情册亮道侣灯');
    // 道侣同修（日常戏抽到这对道侣，这出归他们）
    const env2 = makeSandbox({});
    const ps2 = env2.found();
    ps2.resources.spiritStones = 300;
    env2.W.PSectWorld.syncMirror('长风门');
    env2.recruit(ps2, 'd1'); env2.recruit(ps2, 'd2');
    const L2 = env2.W.PSectLife;
    L2.bondUp(env2.npcs.d1, env2.npcs.d2, 70, '长风门');
    L2.openBondBoard();
    const mb2 = env2.stt.modals[env2.stt.modals.length - 1];
    ok(mb2 && mb2.body.includes('marryPair'), 'N11b 莫逆之交的行上挂着主婚按钮（当场可办）');
    ok(L2.marryPair('d1', 'd2'), 'N12 二人门里主婚成礼');
    let got = null;
    for (let dd = 121; dd <= 400 && got === null; dd++) {
        env2.W.timeSystem.gameTime.currentDay = dd;
        got = L2.dailyLifeTick(ps2);
    }
    eq(got, 7, 'N13 日子抽到道侣——同修这出归他们');
    ok(env2.stt.logs.some(t => t.includes('道侣又在同修')), 'N14 同修有话术落地');
    ok(Number(env2.npcs.d1._teachProgress) > 0 && Number(env2.npcs.d2._teachProgress) > 0, 'N15 同修两人感悟都涨');
    // 结伴下山：押镖
    const env3 = makeSandbox({});
    const ps3 = env3.found();
    ps3.resources.spiritStones = 300;
    env3.W.PSectWorld.syncMirror('长风门');
    env3.recruit(ps3, 'd1'); env3.recruit(ps3, 'd2');
    const L3 = env3.W.PSectLife;
    L3.bondUp(env3.npcs.d1, env3.npcs.d2, 25, '长风门'); // 熟络即可结伴
    const m1 = env3.member(ps3, 'd1'), m2 = env3.member(ps3, 'd2');
    ok(L3.sendAway('d1', 'errand', false, 'd2'), 'N16 结伴押镖成行');
    ok(m1.away && m1.away.mate === 'd2' && m2.away && m2.away.follow === 'd1', 'N17 两人同行，行踪互记');
    eq(env3.W.PSectVenture.homeCount(ps3), 0, 'N18 结伴的两人都不占人手');
    // 生面孔带不动
    const envX = makeSandbox({});
    const psX = envX.found();
    envX.recruit(psX, 'd1'); envX.recruit(psX, 'd3');
    ok(!envX.W.PSectLife.sendAway('d1', 'errand', false, 'd3'), 'N19 点头之交带不动（熟络以上才结伴）');
    ok(!envX.member(psX, 'd1').away, 'N20 拒了人没动');
    const stones0 = ps3.resources.spiritStones;
    env3.newDay(112, 0.5); // 七日期满同归；0.5 的骰：被劫（八成线）不应验
    eq(ps3.resources.spiritStones, stones0 + 59, 'N21 镖钱入宗库——一趟差事一份钱，结伴不多赚');
    eq(Number(env3.npcs.d1._purse), 3, 'N22 荷包对分（甲）');
    eq(Number(env3.npcs.d2._purse), 3, 'N23 荷包对分（乙）');
    ok(!m1.away && !m2.away, 'N24 两人同去同归');
    eq(env3.npcs.d1.npcRelationships['d2'].strength, 3 + 25 + 8, 'N25 患难与共——回程交情真涨八分');
    // 结伴历练：死签减半（0.015 的骰，单走必殁，结伴活着）
    const env4 = makeSandbox({});
    const ps4 = env4.found();
    ps4.resources.spiritStones = 300;
    env4.W.PSectWorld.syncMirror('长风门');
    env4.recruit(ps4, 'd1'); env4.recruit(ps4, 'd2');
    env4.W.PSectLife.bondUp(env4.npcs.d1, env4.npcs.d2, 25, '长风门');
    env4.W.PSectLife.sendAway('d1', 'train', false, 'd2');
    env4.newDay(119, 0.015);
    ok(!env4.npcs.d1.isDead, 'N26 结伴历练死签减半——0.015 的骰单走会殁，结伴活着回来');
    ok(Number(env4.npcs.d2._teachProgress) > 0, 'N27 感悟分摊——同行的人也长了见识');
    // 道侣结伴：死签减半再减半（0.008 的骰也活着）
    const env5 = makeSandbox({});
    const ps5 = env5.found();
    ps5.resources.spiritStones = 300;
    env5.W.PSectWorld.syncMirror('长风门');
    env5.recruit(ps5, 'd1'); env5.recruit(ps5, 'd2');
    env5.W.PSectLife.bondUp(env5.npcs.d1, env5.npcs.d2, 70, '长风门');
    env5.W.PSectLife.marryPair('d1', 'd2');
    env5.W.PSectLife.sendAway('d1', 'train', false, 'd2');
    env5.newDay(119, 0.008);
    ok(!env5.npcs.d1.isDead, 'N28 道侣结伴凶事再让三分——0.008 的死签也没落下来');
    // 丧偶：道侣先行一步，剩下那个人的日子塌一角
    const env6 = makeSandbox({});
    const ps6 = env6.found();
    ps6.resources.spiritStones = 300;
    env6.W.PSectWorld.syncMirror('长风门');
    env6.recruit(ps6, 'd1'); env6.recruit(ps6, 'd2');
    env6.W.PSectLife.bondUp(env6.npcs.d1, env6.npcs.d2, 70, '长风门');
    env6.W.PSectLife.marryPair('d1', 'd2'); // 300-80=220
    env6.W.PSectLife.sendAway('d1', 'train'); // 独行（死签回到二分线）
    const moodBefore = Number(env6.member(ps6, 'd2').moodPts) || 50;
    env6.newDay(119, 0.0001); // 死签应验
    ok(env6.npcs.d1.isDead, 'N29 独行的死签照旧是真风险');
    eq(ps6.resources.spiritStones, 200, 'N30 治丧抚恤照礼出库（220-20）');
    ok(env6.stt.chron.some(t => t.includes('先行一步')), 'N31 丧偶入编年（两个名字还并着）');
    eq(Number(env6.member(ps6, 'd2').moodPts), Math.max(0, moodBefore - 20), 'N32 剩下的人心境塌一角（死讯-5、全门同悲-3、丧偶-12）');
    ok(env6.stt.logs.some(t => t.includes('一句话没说')), 'N33 丧偶有话术落地');
    // 派遣面板：结伴的选头长在面板上
    const env7 = makeSandbox({});
    const ps7 = env7.found();
    env7.recruit(ps7, 'd1'); env7.recruit(ps7, 'd2');
    env7.W.PSectLife.bondUp(env7.npcs.d1, env7.npcs.d2, 25, '长风门');
    env7.W.PSectLife.openDispatch('d1');
    const md = env7.stt.modals[env7.stt.modals.length - 1];
    ok(md && md.body.includes('结伴') && md.body.includes('柳三娘') && md.body.includes('带上'), 'N34 派遣面板列得出作伴的选头');
    env7.stt.modals.length = 0;
    env7.W.PSectLife.openDispatch('d1', 'd2');
    const md2 = env7.stt.modals[env7.stt.modals.length - 1];
    ok(md2 && md2.body.includes('遣两人下山') && md2.body.includes("sendAway('d1','errand',false,'d2')"), 'N35 选了伴，三件差事的按钮都带上伴');
}

// ---------- O · 血脉归山门（第三十二波：孩子自己来敲门） ----------
console.log('\n[O] 血脉归山门（长成的孩子真入门·吃门里的饭）');
{
    const env = makeSandbox({});
    const ps = env.found();
    env.W.npcManager.addNPC = function (n) { env.npcs[n.id] = n; };
    env.W.currentCharData._children = [{ name: '李慕风', grown: true, level: 3, bornDay: 90, path: 'home' }];
    ok(env.W.sendChildToSect(0), 'O1 孩子上山叩门——嫡系二代入门');
    const c = env.W.currentCharData._children[0];
    ok(c.inSect && env.npcs[c.inSect] && env.npcs[c.inSect].name === '李慕风', 'O2 孩子真成了名册上的人（名字在人身上）');
    const row = env.member(ps, c.inSect);
    ok(!!row, 'O3 弟子名册在列（传功、派遣、结伴都由得你）');
    eq(env.npcs[c.inSect].combat.layer, 2, 'O4 亲传的层数带进山门（三层亲传→炼气二层）');
    ok(Number(row.moodPts) >= 65, 'O5 亲生的孩子——心境生来就死心塌地');
    ok(env.stt.chron.some(t => t.includes('上山叩门')), 'O6 编年记下嫡系二代');
    ok((env.W.eventFlags.qi_street || []).some(s => s.text.includes('当了弟子')), 'O7 稀罕事传街谈');
    ok(!env.W.sendChildToSect(0), 'O8 入了门的不再重复叩门');
    ok(!env.W.childAction(0, 'teach'), 'O9 入门的孩子不吃家里的传功口径（走总册名分）');
    // 入了门吃门里的饭——不再往家里捎钱（一份人不能吃两份）
    const w0 = env.stt.wallet;
    env.newDay(150, 0.5);
    eq(env.stt.wallet, w0, 'O10 入门之后孝敬停发（钱不两头拿）');
    // 没长成 / 在外历练的送不去
    const env2 = makeSandbox({});
    env2.W.npcManager.addNPC = function (n) { env2.npcs[n.id] = n; };
    env2.W.currentCharData._children = [{ name: '李小满', grown: false, bornDay: 140 }];
    ok(!env2.W.sendChildToSect(0), 'O11 山门不收稚子');
    const env3 = makeSandbox({});
    env3.found();
    env3.W.npcManager.addNPC = function (n) { env3.npcs[n.id] = n; };
    env3.W.currentCharData._children = [{ name: '李远行', grown: true, level: 1, bornDay: 50, path: 'ventured', awayUntilDay: 999 }];
    ok(!env3.W.sendChildToSect(0), 'O12 在外历练的——回了山再谈入门');
    const env4 = makeSandbox({});
    env4.W.npcManager.addNPC = function (n) { env4.npcs[n.id] = n; };
    env4.W.currentCharData._children = [{ name: '李无门', grown: true, level: 2, bornDay: 40 }];
    ok(!env4.W.sendChildToSect(0), 'O13 还没立宗——送孩子去哪里求学');
}

// ---------- P · 门里有传人（第三十三波：首座月结压阵） ----------
console.log('\n[P] 门里有传人（首座弟子是真差事）');
{
    const env = makeSandbox({});
    const ps = env.found();
    env.recruit(ps, 'd1'); env.recruit(ps, 'd2');
    const L = env.W.PSectLife;
    ok(!L.appointHeir('d9'), 'P1 不在门里的人立不了首座');
    ok(L.appointHeir('d1'), 'P2 立首座弟子成行');
    eq(ps._heir, 'd1', 'P3 名册真记（担子有人挑）');
    ok(env.stt.chron.some(t => t.includes('首座弟子')), 'P4 编年记下门里有传人');
    // 月结：人在山门——声望暗涨（直调核账；八苦等同日账目不搅进来）
    const rep0 = Number(ps.resources.reputation);
    L.heirMonthly(ps);
    eq(Math.round(Number(ps.resources.reputation) * 10), Math.round((rep0 + 0.5) * 10), 'P5 首座月结压阵——声望+0.5（弟子心气也高）');
    const repA = Number(ps.resources.reputation);
    env.newDay(150, 0.5);
    ok(Number(ps.resources.reputation) >= repA + 0.5, 'P5b 月尽之日日结钩子真接上了（自动压阵）');
    // 人在山下——担子空着，不赏不罚
    env.newDay(175, 0.5);
    L.sendAway('d1', 'errand'); // 七日差，回山在一八二
    const rep1 = Number(ps.resources.reputation);
    env.newDay(180, 0.5);
    eq(Number(ps.resources.reputation), rep1, 'P6 首座在山下——月结担子空着（不赏不罚）');
    // 换首座
    ok(L.appointHeir('d2'), 'P7 首座可换人（前一位自然卸担）');
    eq(ps._heir, 'd2', 'P8 名册上只认一位首座');
    // 首座战殁——担子落地
    const env2 = makeSandbox({});
    const ps2 = env2.found();
    ps2.resources.spiritStones = 200;
    env2.W.PSectWorld.syncMirror('长风门');
    env2.recruit(ps2, 'd1');
    env2.W.PSectLife.appointHeir('d1');
    env2.W.PSectLife.sendAway('d1', 'train');
    env2.newDay(119, 0.0001); // 死签应验
    ok(env2.npcs.d1.isDead, 'P9 首座殁在了历练路上');
    eq(ps2._heir, null, 'P10 担子落地——虚位待另择');
    ok(env2.stt.chron.some(t => t.includes('虚位待另择')), 'P11 编年记虚位');
}

// ---------- Q · 秘艺亲题碑名（第三十三波） ----------
console.log('\n[Q] 秘艺亲题碑名');
{
    const env = makeSandbox({});
    const ps = env.found();
    ps.stage = 2;
    ps.resources.spiritStones = 300;
    env.W.PSectWorld.syncMirror('长风门');
    ok(!env.W.PSectLife.renameArt('青莲剑歌'), 'Q1 碑都没立，题不了名');
    withRandom(0.5, function () { env.W.PSectLife.composeArt(); });
    ok(!!ps.art, 'Q2 先创出镇山秘艺');
    ok(env.W.PSectLife.renameArt('青莲剑歌'), 'Q3 掌门亲题碑名');
    eq(ps.art.name, '青莲剑歌', 'Q4 碑面换新名（战阵传功编年都认这个名）');
    ok(env.stt.chron.some(t => t.includes('亲题')), 'Q5 编年记重描金');
    ok(!env.W.PSectLife.renameArt(''), 'Q6 空名题不上');
    eq(ps.art.name, '青莲剑歌', 'Q7 拒了碑名不动');
    env.W.PSectLife.renameArt('<b>坏名</b>');
    ok(ps.art.name.indexOf('<') < 0 && ps.art.name.indexOf('>') < 0, 'Q8 碑面的杂质洗得掉（尖括号进不了碑）');
    ok(!env.W.PSectLife.renameArt(ps.art.name), 'Q9 同名不必重题');
}

console.log('\n========== 第二十一波 · 弟子是活人 ==========');
console.log('通过：' + pass + '　失败：' + fail);
process.exit(fail ? 1 : 0);
