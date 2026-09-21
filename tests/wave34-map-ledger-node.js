// wave34-map-ledger-node.js — 第三十四波 · 地图线查账修讫 vm 沙箱测试
// 覆盖：地标键断线（中文名+英文键+别名都进探索）/ 十二地标全有数据 / 奖励真账（属性落 attrs、功法落淬体、名号落名望、物品入包）
//       / 已领与隐藏随档存（读档不重领）/ randomMap 三处接线（采集枯竭落档、兽潮入野外、地标传中文名）
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

const LANDMARK_TABLE = {
    ancient_sword_peak: '古剑峰', dragon_vein: '龙脉', hun_dian_yi_ji: '魂殿遗迹', han_bing: '寒冰深渊',
    lei_yin: '雷音峰', huan_hai: '幻海绿洲', heavenly_pool: '天池', sword_grave: '剑冢',
    spirit_well: '灵泉古井', demon_abyss: '魔渊裂隙', phoenix_nest: '凤凰巢', ancient_battlefield: '上古战场'
};

function makeLandmarkSandbox(opts) {
    opts = opts || {};
    const store = opts.store || {};           // localStorage 持久层（可跨「读档」复用）
    const msgs = [], items = [];
    const cd = { name: '李长风', realm: opts.realm || '炼气', energy: 9999, tempering: 0, fame: 0, attrs: {}, mainAttributes: {} };
    const ATTRIBUTE_KEY_MAP = { '力量': 'strength', '灵巧': 'dexterity', '神识': 'intelligence', '智力': 'intelligence', '意志': 'willpower', '体质': 'constitution', '经脉': 'meridian' };
    const sandbox = {
        console: { log: function () {} },
        Math: Math, Number: Number, String: String, JSON: JSON, Object: Object, Array: Array, Date: Date, RegExp: RegExp,
        parseInt: parseInt, parseFloat: parseFloat, isFinite: isFinite, setTimeout: function (fn) { /* 不跑自动关闭 */ },
        document: {
            readyState: 'complete',
            createElement: function () { return { className: '', innerHTML: '', onclick: null, style: {}, remove: function () {} }; },
            body: { appendChild: function () {}, insertAdjacentHTML: function () {} },
            addEventListener: function () {},
            getElementById: function () { return null; }
        },
        localStorage: {
            getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
            setItem: function (k, v) { store[k] = String(v); },
            removeItem: function (k) { delete store[k]; }
        }
    };
    sandbox.window = sandbox;
    sandbox.globalThis = sandbox;
    sandbox.ATTRIBUTE_KEY_MAP = ATTRIBUTE_KEY_MAP;
    sandbox.showMessage = function (m) { msgs.push(String(m)); };
    sandbox.currentCharData = cd;
    sandbox.addItemToInventory = function (id, n) { items.push({ id: id, n: n || 1 }); return true; };
    sandbox.timeSystem = { advanceTime: function () {}, getAbsoluteDay: function () { return 105; } };
    sandbox.updateCharacterStatus = function () {};
    sandbox.inventory = { slots: opts.slots || [] };
    sandbox.LANDMARKS = (function () { var t = {}; for (var id in LANDMARK_TABLE) t[id] = { id: id, name: LANDMARK_TABLE[id] }; return t; })();
    // 真账增量口的忠实桩：中英双写、夹到 0~100（与 global-utils 同口径）
    sandbox.addMainAttribute = function (key, delta, c) {
        c = c || cd; c.mainAttributes = c.mainAttributes || {}; c.attrs = c.attrs || {};
        var cn = (key === '智力' ? '神识' : key);
        var en = ATTRIBUTE_KEY_MAP[key] || key;
        var cur = c.mainAttributes[cn] != null ? c.mainAttributes[cn] : (c.attrs[en] != null ? c.attrs[en] : 10);
        var nv = Math.max(0, Math.min(100, (parseInt(cur, 10) || 10) + (parseInt(delta, 10) || 0)));
        c.mainAttributes[cn] = nv; c.attrs[en] = nv; return true;
    };
    sandbox.syncCharAttrsFromMain = function (c) { c = c || cd; return c; };
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/map/landmark-explore.js'), 'utf8'), sandbox);
    function setRand(v) { Math.random = function () { return v; }; }
    return { W: sandbox, cd: cd, msgs: msgs, items: items, store: store, setRand: setRand };
}

// ---------- A · 地标键断线修讫 ----------
console.log('\n[A] 地标键断线（中文名/英文键/别名都进探索，十二处全有数据）');
{
    const env = makeLandmarkSandbox({});
    const W = env.W;
    const D = W.LANDMARK_EXPLORE_DATA;
    // 十二处地标全有探索数据（旧账只有六处）
    const need = ['古剑峰', '龙脉', '魂殿', '寒冰深渊', '雷音峰', '幻海绿洲', '天池', '剑冢', '灵泉古井', '魔渊裂隙', '凤凰巢', '上古战场'];
    ok(need.every(n => D[n]), 'A1 十二处地标全有探索数据（旧账六处缺口补齐）');
    // 英文键进探索（旧账 randomMap 传英文键 → 永远「未知的地标」）
    env.msgs.length = 0;
    for (const id in LANDMARK_TABLE) { W.currentCharData.energy = 9999; W.exploreLandmark(id); }
    ok(!env.msgs.some(m => m.includes('未知的地标')), 'A2 英文键也能进探索（resolver 经 LANDMARKS 对回中文名）');
    // 中文名进探索
    env.msgs.length = 0;
    for (const k in LANDMARK_TABLE) { W.currentCharData.energy = 9999; W.exploreLandmark(LANDMARK_TABLE[k]); }
    ok(!env.msgs.some(m => m.includes('未知的地标')), 'A3 中文名照样进探索');
    // 别名：野外图上「魂殿遗迹」对回探索名录的「魂殿」
    env.msgs.length = 0;
    W.currentCharData.energy = 9999; W.exploreLandmark('魂殿遗迹');
    ok(!env.msgs.some(m => m.includes('未知的地标')), 'A4 「魂殿遗迹」别名对回「魂殿」（野外图 POI 名不再落空）');
    ok(D['魂殿'].exploreProgress > 0, 'A5 别名探索真进了「魂殿」的进度账');
}

// ---------- B · 奖励真账 ----------
console.log('\n[B] 奖励真账（属性落 attrs、功法落淬体、名号落名望、物品入包）');
{
    const env = makeLandmarkSandbox({});
    const W = env.W;
    env.setRand(0.0001);   // gain 取最小（10），事件全过
    const D = W.LANDMARK_EXPLORE_DATA;
    // 古剑峰：物品 + 淬体(exp) + 功法(skill→淬体) + 名号(title→名望)
    D['古剑峰'].exploreProgress = 95;
    W.currentCharData.energy = 100; W.currentCharData.tempering = 0; W.currentCharData.fame = 0;
    env.items.length = 0;
    W.exploreLandmark('古剑峰');
    ok(env.items.some(it => it.id === 'mat_ancient_sword_fragment'), 'B1 物品奖励真入包（上古剑器碎片）');
    ok(env.items.some(it => it.id === 'mat_spirit_steel'), 'B2 物品奖励真入包（灵钢）');
    eq(W.currentCharData.tempering, 500 + 150, 'B3 感悟(exp)+功法(skill)都落淬体真账（500+150）');
    eq(W.currentCharData.fame, 15, 'B4 名号(title)落名望真账（+15）');
    ok(!W._explorationSkills && !W._playerTitles, 'B5 旧账的两个死数组不再写（功法/名号已改落真账）');
    // 属性奖励落战斗真源 attrs（旧账写没人读的顶层字段）
    D['龙脉'].exploreProgress = 45;   // 50 档是体质+3
    W.currentCharData.energy = 100;
    W.exploreLandmark('龙脉');
    eq(W.currentCharData.attrs.constitution, 13, 'B6 属性奖励落 attrs 战斗真源（体质 10→13）');
    eq(W.currentCharData.mainAttributes['体质'], 13, 'B7 主属性同记（中英双写，读档同步不丢）');
    env.setRand(0.5);
}

// ---------- C · 已领随档存：读档不重领 ----------
console.log('\n[C] 已领随档存（读档不再重领——堵白嫖漏洞）');
{
    const store = {};
    const env = makeLandmarkSandbox({ store: store });
    const W = env.W;
    env.setRand(0.0001);
    const D = W.LANDMARK_EXPLORE_DATA;
    D['古剑峰'].exploreProgress = 95;
    W.currentCharData.energy = 100; W.currentCharData.tempering = 0; W.currentCharData.fame = 0;
    env.items.length = 0;
    W.exploreLandmark('古剑峰');   // 领满五档，落 localStorage
    ok(!!store['xianxia_landmarks'], 'C1 探索账落了存档');
    const firstItems = env.items.length, firstTemp = W.currentCharData.tempering, firstFame = W.currentCharData.fame;
    // 模拟读档：清内存账，再从 localStorage 回填
    for (const k in D) { D[k].exploreProgress = 0; D[k]._hiddenFound = false; D[k]._swordPulled = false; (D[k].rewards || []).forEach(r => r._claimed = false); }
    W.initLandmarkExplore();   // → loadLandmarkProgress
    eq(D['古剑峰'].exploreProgress, 100, 'C2 读档回填探索度');
    ok(D['古剑峰'].rewards.every(r => r._claimed), 'C3 读档回填「已领」标记（旧账不回填 → 重领）');
    // 再探一次：已领的不再发
    D['古剑峰'].exploreProgress = 99;   // 退一格好让 exploreLandmark 不早退
    env.items.length = 0; W.currentCharData.tempering = 0; W.currentCharData.fame = 0;
    W.currentCharData.energy = 100;
    W.exploreLandmark('古剑峰');
    eq(env.items.length, 0, 'C4 读档后再探——物品不重发');
    eq(W.currentCharData.tempering, 0, 'C5 读档后再探——淬体不重发');
    eq(W.currentCharData.fame, 0, 'C6 读档后再探——名望不重发');
    ok(firstItems > 0 && firstTemp > 0 && firstFame > 0, 'C7 头一回是真发了的（不是压根没发）');
    env.setRand(0.5);
}

// ---------- D · 隐藏内容随档存 ----------
console.log('\n[D] 隐藏内容随档存（读档不重揭）');
{
    const store = {};
    const env = makeLandmarkSandbox({ store: store, realm: '元婴' });   // 魂殿隐藏改境界门（元婴方可开密室）
    const W = env.W;
    env.setRand(0.0001);
    const D = W.LANDMARK_EXPLORE_DATA;
    D['魂殿'].exploreProgress = 95;
    W.currentCharData.energy = 100;
    env.items.length = 0;
    W.exploreLandmark('魂殿');   // 元婴境 → 揭隐藏（炼魂重生丹）
    ok(env.items.some(it => it.id === 'pill_soul_rebirth'), 'D1 元婴境揭开隐藏（炼魂重生丹入包）');
    ok(D['魂殿']._hiddenFound === true, 'D2 隐藏标记落账');
    // 读档回填
    for (const k in D) { D[k].exploreProgress = 0; D[k]._hiddenFound = false; (D[k].rewards || []).forEach(r => r._claimed = false); }
    W.initLandmarkExplore();
    ok(D['魂殿']._hiddenFound === true, 'D3 读档回填隐藏标记');
    D['魂殿'].exploreProgress = 99; env.items.length = 0; W.currentCharData.energy = 100;
    W.exploreLandmark('魂殿');
    ok(!env.items.some(it => it.id === 'pill_soul_rebirth'), 'D4 读档后再探——隐藏奖励不重发');
    env.setRand(0.5);
    // 古剑峰隐藏（旧账门禁 mat_ancient_key 不存在 → 死内容；改筑基境界门后可达）
    const env2 = makeLandmarkSandbox({ realm: '筑基' });
    env2.setRand(0.0001);
    env2.W.LANDMARK_EXPLORE_DATA['古剑峰'].exploreProgress = 95;
    env2.W.currentCharData.energy = 100;
    env2.msgs.length = 0;
    env2.W.exploreLandmark('古剑峰');
    ok(env2.msgs.some(m => m.includes('隐藏的剑冢') || m.includes('万剑归宗')), 'D5 古剑峰隐藏内容改境界门后可达（旧账门禁物品不存在 → 死内容）');
    env2.setRand(0.5);
}

// ---------- E · randomMap 三处接线（源码级） ----------
console.log('\n[E] randomMap 接线（采集枯竭落档 / 兽潮入野外 / 地标传中文名）');
{
    const rm = fs.readFileSync(path.join(ROOT, 'js/map/randomMap.js'), 'utf8');
    // 采集枯竭落档：gathered 现在有写入（旧账只读不写）
    const gi = rm.indexOf('cell.node.regrowDay = currentDay()');
    const seg = rm.slice(gi, gi + 400);
    ok(seg.includes('.gathered[') && seg.includes('regrowDay'), 'E1 采集枯竭日落进本域 gathered（读档不再白嫖刷采）');
    ok(rm.includes('st.gathered[x + \',\' + y]') || rm.includes("st.gathered[x + ',' + y]"), 'E2 applyWildState 仍读 gathered 回填（写读闭环）');
    // 兽潮入野外遭遇
    const ei = rm.indexOf('function rollWildEncounter');
    const eseg = rm.slice(ei, ei + 1600);
    ok(eseg.includes('BeastTide') && eseg.includes('getActiveTide'), 'E3 野外遭遇查兽潮（isRaidActive 同口径）');
    ok(eseg.includes('_tideLv') && eseg.includes('wantBeast = true'), 'E4 兽潮里遭遇更频、来的偏兽');
    ok(eseg.includes('expireDay'), 'E5 过期的潮不算数（不拿死潮吓人）');
    // 地标传中文名
    ok(rm.includes('exploreLandmark(poi.name || poi.refId)'), 'E6 地标探索传中文名（旧账传英文键 → 永远未知）');
}

console.log('\n========== 第三十四波 · 地图线查账 ==========');
console.log('通过：' + pass + '　失败：' + fail);
process.exit(fail ? 1 : 0);
