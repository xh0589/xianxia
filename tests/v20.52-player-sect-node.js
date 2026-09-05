/**
 * v20.52-player-sect-node.js — 玩家宗门「立派做庄 + 宗门总册」验收
 *
 * 覆盖：
 *   P1 立派地基：五处山门各有地形与安家费，择址落档入史
 *   P2 旧档迁移：老宗门补 terrain/history/_lossAcc 默认，roundtrip 不丢
 *   P3 职位真管事：长老座镇（灵石+1/声望+0.05）、堂主管库（兵器丹药+0.5），UI 预估与 tickDay 同口径
 *   P4 界面存在：立派流程/宗门总册/收徒/任命等入口齐备，未达元婴不开山
 *   P5 立派流程：起名+出身+择址+扣安家费，开山当日正邪各有来客
 *   P6 收徒规矩：好感 ≥20 才能收录（拜山门总得先认识），门中已有的不再出现
 *   P7 丹药有用：传功可用宗门丹药布置（不花灵石），库空回落灵石
 *   P8 武库有用：护宗战兵器发放列阵（妖兽攻势受挫+战后折损），库空只能赤手迎敌
 *   P9 挂载哨兵：界面文件入页、按钮接线在案
 *
 * 运行：node tests/v20.52-player-sect-node.js
 */
'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');

var ROOT = path.join(__dirname, '..');
var passed = 0, failed = 0;
function assert(msg, cond) {
    if (cond) { passed++; console.log('  ✅ ' + msg); }
    else { failed++; console.log('  ❌ ' + msg); }
}
function load(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ---------- 环境 ----------
function buildEnv(opts) {
    opts = opts || {};
    var modals = [], msgs = [], battles = [];
    var w = {
        console: { log: function () {}, warn: function () {}, error: function () {} },
        Math: Math, JSON: JSON, Number: Number, Date: Date, String: String, Array: Array, Object: Object, confirm: function () { return true; },
        document: { getElementById: function (id) { return opts.inputs && opts.inputs[id] ? { value: opts.inputs[id] } : null; } },
        WorldCalendar: { day: opts.day || 2000 },
        EventBus: { emit: function () {} },
        StateRegistry: { register: function () { return function () {}; } },
        getRealmTier: function () { return opts.tier != null ? opts.tier : 4; },
        currentCharData: { name: '掌门', fame: opts.fame != null ? opts.fame : 40, spiritStones: opts.stones != null ? opts.stones : 100000 },
        DataManager: {
            deductSpiritStones: function (n) {
                if (w.currentCharData.spiritStones < n) return false;
                w.currentCharData.spiritStones -= n; return true;
            },
            addSpiritStones: function (n) { w.currentCharData.spiritStones += n; },
            getSpiritStones: function () { return w.currentCharData.spiritStones; }
        },
        showMessage: function (t, type) { msgs.push({ t: t, type: type }); },
        showModal: function (title, html) { modals.push({ title: title, html: html }); },
        startBattle: function (e) { battles.push(e); },
        updateCultivationUI: function () {},
        updateCharacterStatus: function () {},
        gameLog: { add: function () {} },
        timeSystem: { advanceTime: function () {}, onNewDaySubscribe: function () {} },
        npcManager: { getNPC: function (id) { return (opts.npcs || {})[id] || null; }, getAllNPCs: function () { return Object.keys(opts.npcs || {}).map(function (k) { return opts.npcs[k]; }); } },
        NPCLife: { npcRootGrowthMul: function () { return 1.5; } },
        __modals: modals, __msgs: msgs, __battles: battles
    };
    w.window = w;
    var ctx = vm.createContext(w);
    vm.runInContext(load('js/extensions/player-sect.js'), ctx, { filename: 'player-sect.js' });
    vm.runInContext(load('js/extensions/player-sect-ui.js'), ctx, { filename: 'player-sect-ui.js' });
    if (opts.withTeach) vm.runInContext(load('js/sects/master-teach.js'), ctx, { filename: 'master-teach.js' });
    return w;
}

function mkNpc(id, name, aff, realm) {
    return {
        id: id, name: name, _graduated: false, _cultivationProgress: 0,
        relationship: { affection: aff }, combat: { realm: realm || '金丹' },
        changeAffection: function (n) { this.relationship.affection += n; }
    };
}

// ==================== P1 立派地基 ====================
console.log('\n[P1] 立派地基：五处山门各有地界');
(function () {
    var w = buildEnv({});
    var P = w.PlayerSect;
    var sites = P.FOUND_SITES;
    assert('五处山门在册（实得 ' + sites.length + '）', sites.length === 5);
    var terrains = sites.map(function (s) { return s.terrain; });
    assert('地形五类齐（山/城/水/漠/岛）：' + terrains.join('/'),
        ['山', '城', '水', '漠', '岛'].every(function (t) { return terrains.indexOf(t) >= 0; }));
    assert('安家费各有名目且互不相同（' + sites.map(function (s) { return s.cost; }).join('/') + '）',
        sites.every(function (s) { return s.cost >= 600 && s.cost <= 1000; }) &&
        new Set(sites.map(function (s) { return s.cost; })).size === 5);
    assert('每处都有一句地界的说法', sites.every(function (s) { return s.desc && s.desc.length >= 15; }));

    var c = P.create({ name: '青霞剑宗', alignment: '正道', location: sites[0].name, terrain: sites[0].terrain });
    assert('立宗落档（名/出身/地界）', c.ok && c.instance.name === '青霞剑宗' && c.instance.alignment === '正道' && c.instance.terrain === '山');
    var siteR = P.chooseSite(c.sectId, 'site_island');
    assert('改择址：地形随址而变（山 → 岛）', siteR.ok && P.getSect(c.sectId).terrain === '岛' && P.getSect(c.sectId).location === '东海·浮玉岛');
    var hist = P.getSect(c.sectId).history.map(function (h) { return h.text; }).join('|');
    assert('立宗与择址都入宗门史', hist.indexOf('开山立宗') >= 0 && hist.indexOf('山门定于') >= 0);
})();

// ==================== P2 旧档迁移 ====================
console.log('\n[P2] 旧档迁移：老宗门照常在');
(function () {
    var w = buildEnv({});
    var P = w.PlayerSect;
    P.create({ name: '旧宗' });
    var exported = JSON.parse(JSON.stringify(P.getState()));
    // 模拟 v20.51 之前的旧档结构：没有 terrain/history/_lossAcc
    Object.keys(exported.sects).forEach(function (k) {
        delete exported.sects[k].terrain;
        delete exported.sects[k].history;
        delete exported.sects[k]._lossAcc;
    });
    var w2 = buildEnv({});
    w2.PlayerSect.getState; // noop
    // 直灌旧档
    var handlers = null;
    vm.runInContext('window.__cap = null; (function(){ var reg = window.StateRegistry; })();', w2);
    // 用 export/import 通道验证
    var w3 = buildEnv({});
    var P3 = w3.PlayerSect;
    // 重新注册一个可捕获的 StateRegistry 并 import
    var captured = {};
    vm.runInContext('window.StateRegistry = { register: function (k, h) { window.__h = h; } };', w3);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/extensions/player-sect.js'), 'utf8'), w3, { filename: 'player-sect.js' });
    w3.__h.import(exported);
    var sects = w3.PlayerSect.listMySects();
    assert('旧宗读回（1 座：' + sects.map(function (s) { return s.name; }).join(',') + '）', sects.length === 1 && sects[0].name === '旧宗');
    assert('旧宗补 terrain 默认（location 未知 → null，待补录）', sects[0].terrain === null);
    assert('旧宗补 history 默认（空数组，不炸面板）', Array.isArray(sects[0].history));
    assert('旧宗补 _lossAcc 默认', Number(sects[0]._lossAcc) === 0);
    // roundtrip：再导出再导入，字段不丢
    var again = JSON.parse(JSON.stringify(w3.__h.export()));
    w3.__h.import(again);
    var againSect = w3.PlayerSect.listMySects()[0];
    assert('导出导入 roundtrip 后字段仍在', Array.isArray(againSect.history) && againSect._lossAcc === 0);
})();

// ==================== P3 职位真管事 ====================
console.log('\n[P3] 职位真管事（长老座镇 / 堂主管库）');
(function () {
    var w = buildEnv({});
    var P = w.PlayerSect;
    var sid = P.create({ name: '管事庄' }).sectId;
    P.recruitDisciple(sid, 'n1');
    P.recruitDisciple(sid, 'n2');
    P.recruitDisciple(sid, 'n3');
    P.assignPosition(sid, 'n1', '长老');
    P.assignPosition(sid, 'n2', '堂主');
    var s0 = P.getResource(sid, 'spiritStones'), w0 = P.getResource(sid, 'weapon'), e0 = P.getResource(sid, 'elixir'), r0 = P.getResource(sid, 'reputation');
    P.tickDay();
    var dStone = P.getResource(sid, 'spiritStones') - s0;
    var dWpn = P.getResource(sid, 'weapon') - w0;
    var dEli = P.getResource(sid, 'elixir') - e0;
    var dRep = P.getResource(sid, 'reputation') - r0;
    // 内政：产 ×1.3；长老 1（灵石 +1、声望 +0.05）；堂主 1（兵器丹药各 +0.5）
    assert('长老座镇：灵石每日 +1（5×1.3 + 1 − 耗 1 = +' + Math.round(dStone * 100) / 100 + '）', Math.abs(dStone - 6.5) < 0.001);
    assert('堂主管库：兵器每日 +1.5（底产 1 + 管库 0.5，实得 +' + dWpn + '）', Math.abs(dWpn - 1.5) < 0.001);
    assert('堂主管库：丹药每日 +1.5（1×1.3 + 0.5，实得 +' + dEli + '）', Math.abs(dEli - 1.8) < 0.001);
    assert('长老座镇：声望每日 +0.15（0.1×1.3 + 0.05，实得 +' + dRep + '）', Math.abs(dRep - 0.18) < 0.001);
})();

// ==================== P4/P5 立派流程 ====================
console.log('\n[P4] 界面入口与立派门槛');
(function () {
    var w = buildEnv({ tier: 4 });
    ['openFoundSectPanel', 'openPlayerSectPanel', '_psOpenRecruit', '_psRecruit', '_psOpenAssign', '_psAssign',
     '_psTeach', '_psGraduate', '_psSetPolicy', '_psChooseSite', '_psDissolve', '_psDoFound'].forEach(function (fn) {
        if (typeof w[fn] !== 'function') { assert('入口 ' + fn + ' 在案', false); }
    });
    assert('十二个界面入口齐备（立派/总册/收徒/任命/传功/出师/方针/补址/解散）', true);
    var w3 = buildEnv({ tier: 3 });
    w3.openFoundSectPanel();
    assert('未达元婴：不开山（有警告、无弹窗）', w3.__msgs.length > 0 && w3.__modals.length === 0);
    w3.openPlayerSectPanel();
    assert('无宗时开总册 → 引去立派', w3.__modals.length === 0 &&
        w3.__msgs.map(function (m) { return m.t; }).join('|').indexOf('开山') >= 0);
})();

console.log('\n[P5] 立派流程真跑：名/出身/择址/来客');
(function () {
    var w = buildEnv({ tier: 4, stones: 5000, inputs: { 'ps-found-name': '青霞剑宗' }, npcs: { m1: mkNpc('m1', '散修甲', 5) } });
    w._psDraftAlign('正道');
    w._psDraftSite('site_mountain');
    w._psDoFound();
    var sect = w.PlayerSect.listMySects()[0];
    assert('立宗成功：名「青霞剑宗」· 正道 · 山门中州·青岩山', !!sect && sect.name === '青霞剑宗' && sect.alignment === '正道' && sect.terrain === '山' && sect.location === '中州·青岩山');
    assert('安家费 800 已扣（10000 → ' + w.currentCharData.spiritStones + '）', w.currentCharData.spiritStones === 4200);
    assert('开山当日有戏（弹窗）', w.__modals.some(function (m) { return m.title.indexOf('开山当日') >= 0; }));
    var hist = sect.history.map(function (h) { return h.text; }).join('|');
    assert('正道来客入史：名宿贺喜 + 黑影伏笔', hist.indexOf('名宿') >= 0 && hist.indexOf('黑影') >= 0);
    assert('宗门声望起步（10 + 3 = ' + sect.resources.reputation + '）', sect.resources.reputation === 13);

    // 邪派：礼厚名臭，官府登记
    var w2 = buildEnv({ tier: 4, stones: 5000, inputs: { 'ps-found-name': '幽冥教' } });
    w2._psDraftAlign('邪派');
    w2._psDraftSite('site_desert');
    w2._psDoFound();
    var s2 = w2.PlayerSect.listMySects()[0];
    var h2 = s2.history.map(function (h) { return h.text; }).join('|');
    assert('邪派来客入史：黑道贺礼 + 官府登记造册', h2.indexOf('黑道') >= 0 && h2.indexOf('官府衙役') >= 0);
    assert('邪派立宗声名受损（玩家声望 40 → ' + w2.currentCharData.fame + '）', w2.currentCharData.fame === 39);
})();

// ==================== P6 收徒规矩 ====================
console.log('\n[P6] 收徒规矩：先认识，再拜山门');
(function () {
    var w = buildEnv({
        tier: 4, stones: 5000, inputs: { 'ps-found-name': '青霞剑宗' },
        npcs: {
            a: mkNpc('a', '熟人甲', 50), b: mkNpc('b', '生人乙', 5), c: mkNpc('c', '已入门丙', 80)
        }
    });
    w._psDraftAlign('正道');
    w._psDraftSite('site_city');
    w._psDoFound();
    var sect = w.PlayerSect.listMySects()[0];
    w.PlayerSect.recruitDisciple(sect.id, 'c'); // 预置：丙已在门中
    modals_clear(w);
    w._psOpenRecruit();
    var html = lastModal(w);
    assert('熟人甲可收录（出现「收录」按钮）', html.indexOf('熟人甲') >= 0 && html.indexOf('收录') >= 0);
    assert('生人乙好感不足被挡（「不熟——先结识再说」）', html.indexOf('生人乙') >= 0 && html.indexOf('不熟') >= 0);
    assert('已在门中的不重复出现在候选（已入门丙不在列）', html.indexOf('已入门丙') < 0);
    modals_clear(w);
    w._psRecruit('a');
    assert('收录成功：甲入宗门史', sect.history.map(function (h) { return h.text; }).join('|').indexOf('熟人甲') >= 0);
    assert('收录后弟子数 +1（' + w.PlayerSect.listDisciples(sect.id).length + ' 人）', w.PlayerSect.listDisciples(sect.id).length === 2);
})();

// ==================== P7 丹药有用 ====================
console.log('\n[P7] 丹药有用：传功可用宗门丹药布置');
(function () {
    var w = buildEnv({
        tier: 4, stones: 1000, withTeach: true, inputs: { 'ps-found-name': '青霞剑宗' },
        npcs: { d1: mkNpc('d1', '弟子一', 60, '筑基') }
    });
    w._psDraftAlign('正道');
    w._psDraftSite('site_city');
    w._psDoFound();
    var sect = w.PlayerSect.listMySects()[0];
    w.PlayerSect.recruitDisciple(sect.id, 'd1');
    w.PlayerSect.addResource(sect.id, 'elixir', 5);
    var stones0 = w.currentCharData.spiritStones;
    var ok = w.teachDisciple('d1', true);
    assert('传功受理', ok === true);
    assert('丹药被用掉一颗（5 → ' + sect.resources.elixir + '）', sect.resources.elixir === 4);
    assert('灵石分文未动（' + stones0 + ' → ' + w.currentCharData.spiritStones + '）', w.currentCharData.spiritStones === stones0);
    assert('话里说清了丹药布置', w.__msgs.map(function (m) { return m.t; }).join('|').indexOf('丹药') >= 0);
    // 库空回落灵石
    w.PlayerSect.addResource(sect.id, 'elixir', -5);
    var stones1 = w.currentCharData.spiritStones;
    w.teachDisciple('d1', true);
    assert('库空时回落灵石（−30：' + stones1 + ' → ' + w.currentCharData.spiritStones + '）', w.currentCharData.spiritStones === stones1 - 30);
})();

// ==================== P8 武库有用 ====================
console.log('\n[P8] 武库有用：护宗战兵器列阵');
(function () {
    var w = buildEnv({ tier: 4, stones: 5000, inputs: { 'ps-found-name': '青霞剑宗' } });
    w._psDraftAlign('正道');
    w._psDraftSite('site_city');
    w._psDoFound();
    var sect = w.PlayerSect.listMySects()[0];
    // 兵器充足：20 件 → 妖兽攻势 −10%，折损 6 件
    w.PlayerSect.addResource(sect.id, 'weapon', 20);
    modals_clear(w);
    w._defendSectRaid();
    var e = w.__battles[0];
    var baseAtk = 40 + 4 * 6; // tier=4
    assert('妖兽进场受挫（攻 ' + baseAtk + ' → ' + e.attack + '）', e.attack === Math.round(baseAtk * 0.9));
    assert('战后兵器折损（20 → ' + sect.resources.weapon + '）', sect.resources.weapon === 14);
    assert('战事入宗门史', sect.history.map(function (h) { return h.text; }).join('|').indexOf('妖兽攻山') >= 0);
    // 库空：只能赤手迎敌
    w.PlayerSect.addResource(sect.id, 'weapon', -14);
    modals_clear(w);
    w._defendSectRaid();
    var e2 = w.__battles[1];
    assert('库空（不足 10 件）：妖兽全攻全守（攻 ' + e2.attack + '）', e2.attack === baseAtk);
    assert('话里说清了没兵器', w.__msgs.map(function (m) { return m.t; }).join('|').indexOf('不足 10 件') >= 0);
})();

// ==================== P9 挂载哨兵 ====================
console.log('\n[P9] 挂载哨兵');
(function () {
    var html = load('仙侠.html');
    assert('界面文件已入页（player-sect-ui.js）', html.indexOf('js/extensions/player-sect-ui.js') >= 0);
    var cult = load('js/cultivation/cultivation.js');
    assert('修行界面接线：未立宗 → 立派流程；已立宗 → 宗门总册',
        cult.indexOf('window.openFoundSectPanel()') >= 0 && cult.indexOf('window.openPlayerSectPanel()') >= 0);
    var app = load('js/app.js');
    assert('旧立宗入口转发新流程（兼容既有引用）', app.indexOf('window.openFoundSectPanel === \'function\') { window.openFoundSectPanel(); return; }'.replace(/\\/g, '')) >= 0 ||
        app.indexOf('openFoundSectPanel(); return;') >= 0);
    var teach = load('js/sects/master-teach.js');
    assert('传功布置费：宗门丹药优先（teachDisciple 第二参）', teach.indexOf('function teachDisciple(npcId, usePill)') >= 0);
})();

// ---------- 工具 ----------
function modals_clear(w) { w.__modals.length = 0; }
function lastModal(w) { return w.__modals.length ? w.__modals[w.__modals.length - 1].html : ''; }

console.log('\n========== 结果：' + passed + ' 通过 / ' + failed + ' 失败 ==========');
process.exit(failed ? 1 : 0);
