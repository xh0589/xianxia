// cave-deadlinks-node.js — 第二十四波 · 洞府深作真结账（地阵/闭关室/丹房/灵田/藏书阁/客房六处死账接通）vm 沙箱测试
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
function near(a, b, name) { ok(Math.abs(a - b) < 1e-9, name + '（实际=' + a + ' 期望≈' + b + '）'); }
function withRandom(v, fn) { const o = Math.random; Math.random = function () { return v; }; try { return fn(); } finally { Math.random = o; } }

// ---------- A · 接线 ----------
console.log('\n[A] 接线');
{
    const hSrc = fs.readFileSync(path.join(ROOT, 'js/house-system.js'), 'utf8');
    ok(hSrc.includes("getBuff('field', 'expBoostPct')"), 'A1 聚灵阵（地阵）真提修炼效率');
    ok(hSrc.includes("getBuff('field', 'fieldSpeedPct')") && hSrc.includes("getBuff('player', 'fieldSpeedPct')"), 'A2 育灵阵与灵田设施真提速灵田');
    const brSrc = fs.readFileSync(path.join(ROOT, 'js/cultivation/breakthrough-ritual.js'), 'utf8');
    const bsSrc = fs.readFileSync(path.join(ROOT, 'js/cultivation/breakthrough-system.js'), 'utf8');
    ok(brSrc.includes('breakthroughBoost') && bsSrc.includes('breakthroughBoost'), 'A3 闭关室的突破加成两条突破路径都认');
    const acSrc = fs.readFileSync(path.join(ROOT, 'js/crafting/alchemy-compound.js'), 'utf8');
    ok(acSrc.includes('qualityBoost') && acSrc.includes('_qLadder'), 'A4 丹房的「品质+1段」真兑现');
    const invSrc = fs.readFileSync(path.join(ROOT, 'js/inventory.js'), 'utf8');
    ok(invSrc.includes('studyTimeMul'), 'A5 藏书阁的「研究时间-20%」落在研读时辰上');
    const npSrc = fs.readFileSync(path.join(ROOT, 'js/npcs/npc-personal-events.js'), 'utf8');
    ok(npSrc.includes('fac_guest_room'), 'A6 客房的「好感衰减暂停30天」真有人兑现');
    const cfSrc = fs.readFileSync(path.join(ROOT, 'js/extensions/cave-facilities.js'), 'utf8');
    ok(cfSrc.includes('getAbsoluteDay'), 'A7 洞府设施的时钟统一到真钟（安装日不再是死数据）');
}

// ---------- 沙箱 ----------
function makeSandbox(opts) {
    opts = opts || {};
    const stt = { msgs: [], logs: [], wallet: opts.wallet != null ? opts.wallet : 3000, advanced: [] };
    const W = {
        timeSystem: {
            gameTime: { currentDay: opts.day || 105, currentHour: 12 },
            advanceTime: function (m, why) { stt.advanced.push({ m: m, why: why }); },
            getAbsoluteDay: function () { return W.timeSystem.gameTime.currentDay; }
        },
        getAbsoluteDay: function () { return W.timeSystem.gameTime.currentDay; },
        EventBus: { _h: {}, on: function (e, f) { (this._h[e] = this._h[e] || []).push(f); }, emit: function (e, p) { (this._h[e] || []).forEach(function (f) { try { f(p); } catch (err) {} }); } },
        REALM_CONFIG: { realms: [{ name: '凡人' }, { name: '炼气' }, { name: '筑基' }, { name: '金丹' }, { name: '元婴' }, { name: '化神' }, { name: '炼虚' }, { name: '合体' }, { name: '大乘' }, { name: '渡劫' }], layerMultipliers: [1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8] },
        currentCharData: { name: '李长风', realm: '炼气', layer: 1, tempering: 0, energy: 100, qi: 500, fame: 0 },
        inventory: { currency: { spiritStones: stt.wallet }, slots: [], maxSlots: 30 },
        DataManager: {
            getSpiritStones: function () { return stt.wallet; },
            deductSpiritStones: function (n) { if (stt.wallet >= n) { stt.wallet -= n; W.inventory.currency.spiritStones = stt.wallet; return true; } return false; },
            addSpiritStones: function (n) { stt.wallet += n; W.inventory.currency.spiritStones = stt.wallet; }
        },
        getLifeSkill: function () { return 70; },
        showMessage: function (m) { stt.msgs.push(String(m)); },
        gameLog: { add: function (m) { stt.logs.push(String(m)); } },
        itemById: {}
    };
    W.window = W;
    const sandbox = {
        window: W, console: { log: function () {} },
        Math: Math, Number: Number, String: String, JSON: JSON, Object: Object, Array: Array, Date: Date, RegExp: RegExp,
        parseInt: parseInt, parseFloat: parseFloat, isFinite: isFinite,
        document: { getElementById: function () { return null; } },
        localStorage: { getItem: function () { return null; }, setItem: function () {} }
    };
    vm.createContext(sandbox);
    ['js/house-system.js', 'js/extensions/cave-facilities.js', 'js/extensions/formation-system.js',
     'js/cultivation/breakthrough-system.js', 'js/crafting/alchemy-compound.js'].forEach(function (f) {
        vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sandbox);
    });
    function give(items) { items.forEach(function (it) { W.inventory.slots.push({ itemId: it[0], templateId: it[0], count: it[1] }); }); }
    return { W: W, stt: stt, give: give };
}

// ---------- B · 聚灵阵（地阵）真提修炼 ----------
console.log('\n[B] 聚灵阵真提修炼效率');
{
    const env = makeSandbox({ wallet: 3000 });
    ok(env.W.buyHouse('cave'), 'B1 买下简易洞府');
    const base = env.W.getHouseBonus('cultivation');
    near(base, 1.1 * 1.05, 'B2 素洞府修炼加成 1.1，再吃太虚中脉+5%（第一百零六波地脉入账）');
    env.give([['fmt_stone_basic', 8], ['fmt_eye_spirit', 1], ['fmt_flag_iron', 4]]);
    const r = env.W.FormationSystem.deployFormation('fmt_spirit_gather');
    ok(r.ok, 'B3 聚灵阵布进地阵位');
    near(env.W.getHouseBonus('cultivation'), 1.1 * 1.3 * 1.05, 'B4 聚灵阵真提修炼三成（1.1→1.43，再乘中脉1.05）');
}

// ---------- C · 育灵阵 + 灵田设施真提速 ----------
console.log('\n[C] 育灵阵与灵田设施真提速灵田');
{
    const env0 = makeSandbox({ wallet: 3000 });
    env0.W.buyHouse('cave');
    env0.give([['mat_lingzhi', 1]]);
    ok(env0.W.plantCrop('lingzhi'), 'C1 素洞府种灵芝成行');
    const plain = env0.stt.msgs.filter(function (m) { return m.includes('天后成熟'); })[0];
    ok(plain && plain.includes('3 天'), 'C2 素洞府灵芝三天熟（对照）');
    const env = makeSandbox({ wallet: 3000 });
    env.W.buyHouse('cave');
    env.give([['fmt_stone_basic', 6], ['fmt_eye_spirit', 1], ['fmt_flag_iron', 2], ['mat_lingzhi', 1]]);
    const rd = env.W.FormationSystem.deployFormation('fmt_nurture');
    ok(rd.ok, 'C3 育灵阵布进地阵位');
    ok(env.W.CaveFacilities.install('player', 'fac_spirit_field').ok, 'C4 洞府装上灵田设施');
    ok(env.W.plantCrop('lingzhi'), 'C5 种灵芝成行');
    const boosted = env.stt.msgs.filter(function (m) { return m.includes('天后成熟'); })[0];
    ok(boosted && boosted.includes('2 天'), 'C6 阵+设施两处 fieldSpeedPct 都算数——三天变两天（此前两处都是死账）');
}

// ---------- D · 闭关室真算进突破率 ----------
console.log('\n[D] 闭关室真算进突破成功率');
{
    const env = makeSandbox({});
    const cd = env.W.currentCharData;
    const rate0 = env.W.calculateBreakthroughRate(cd, []);
    ok(env.W.CaveFacilities.install('player', 'fac_meditation').ok, 'D1 洞府装上闭关室');
    const rate1 = env.W.calculateBreakthroughRate(cd, []);
    near(rate1 - rate0, 0.15, 'D2 卡面写的「突破率+15%」真算进成功率');
    ok(rate1 <= 0.95, 'D3 封顶照旧（不破天）');
}

// ---------- E · 丹房真兑现「品质+1段」 ----------
console.log('\n[E] 丹房真兑现「品质+1段」');
{
    const PICK = { main: ['mat_thousand_lingzhi'], assist: ['mat_ginseng', 'mat_ginseng'], balancer: ['mat_liquorice'] };
    const env = makeSandbox({});
    env.give([['mat_thousand_lingzhi', 2], ['mat_ginseng', 4], ['mat_liquorice', 2]]);
    const r0 = withRandom(0.5, function () { return env.W.AlchemyCompound.executeCompoundPilfar('recipe_zhuji_open', PICK); });
    ok(r0 && r0.ok, 'E1 素洞府开炉成行');
    env.W.CaveFacilities.install('player', 'fac_alchemy_room');
    const r1 = withRandom(0.5, function () { return env.W.AlchemyCompound.executeCompoundPilfar('recipe_zhuji_open', PICK); });
    ok(r1 && r1.ok, 'E2 丹房开炉成行');
    const ladder = ['poor', 'normal', 'good', 'excellent', 'imperial'];
    eq(ladder.indexOf(r1.quality.id), ladder.indexOf(r0.quality.id) + 1, 'E3 同一炉药，丹房把品质抬了一段（' + r0.quality.name + '→' + r1.quality.name + '）');
}

console.log('\n========== 第二十四波 · 洞府深作真结账 ==========');
console.log('通过：' + pass + '　失败：' + fail);
process.exit(fail ? 1 : 0);
