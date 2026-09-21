// ==================== v23.0 深水区接线验收（四批全修·第二批） ====================
// 审计发现：三套做了深度的系统没有门（开放炼丹/词缀炼器/火候QTE得分无人消费），三套整体死代码
// （洞府设施/阵法/傀儡——傀儡日结在世界循环里跑着，玩家却造不出第一只），合成面板宿主根本不存在
// （「物品合成」按钮点了等于没点，制符配方永不可达），且开放炼制不扣背包材料（白嫖）。
// 本批：动态建合成面板+五类页签；深水入口挂炼丹/锻造页签；洞府面板挂「洞府深作」（设施/阵法/傀儡）；
// 材料实扣+失败退回；阵材注册进物品账并上架门派坊市；战阵真参战（三处乘区）+战后磨损。
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');

let passed = 0; const failures = [];
function ok(cond, msg) { if (cond) { passed++; } else { failures.push(msg); console.log('  ✗ ' + msg); } }
function eq(a, b, msg) { ok(a === b, msg + '（实得 ' + a + '，期望 ' + b + '）'); }
function read(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ============ A 源码接线 ============
{
    const html = read('仙侠.html');
    ok(html.indexOf('js/crafting/compound-ui.js') >= 0, 'A1 深水区门户模块已挂载');

    const cr = read('js/crafting.js');
    ok(cr.indexOf('function ensureCraftingPanel()') >= 0 && cr.indexOf("panel.id = 'panel-crafting'") >= 0,
        'A2 合成面板宿主动态补建（旧版 panel-crafting 不存在，所有合成入口空挥）');
    ok(/CRAFTING_TAB_LABELS[\s\S]{0,200}talismans: '📜 符箓'/.test(cr), 'A3 页签含符箓——制符配方从此可达');
    ok(cr.indexOf('window.closeCraftingUI = closeCraftingUI;') >= 0, 'A4 关面板函数导出');
    ok(cr.indexOf('openCompoundPilfarUI()') >= 0 && cr.indexOf('openCompoundForgingUI()') >= 0, 'A5 炼丹/锻造页签挂深水入口');

    const ac = read('js/crafting/alchemy-compound.js');
    ok(/window\.compoundMat && typeof window\.compoundMat\.consume[\s\S]{0,200}material-short/.test(ac), 'A6 开放炼丹材料实扣（旧版药材白嫖）');
    ok(/window\.compoundMat\.refund\(materials\)/.test(ac), 'A7 背包满时退料（炉没开成不吞材）');

    const fc = read('js/crafting/forging-compound.js');
    ok(/window\.compoundMat\.consume\(_forgMats\)/.test(fc) && /window\.compoundMat\.refund\(_forgMats\)/.test(fc), 'A8 词缀炼器材料实扣+退回');

    const fs2 = read('js/extensions/formation-system.js');
    ok(fs2.indexOf('getCombatBattleBonuses: getCombatBattleBonuses') >= 0 && fs2.indexOf('wearCombatFormation: wearCombatFormation') >= 0,
        'A9 阵法系统新增参战/磨损两口径');

    const app = read('js/app.js');
    ok(/playerEntity\._formationMul = \{[\s\S]{0,200}attackPct/.test(app), 'A10 战阵加成注入玩家战斗体');
    ok(/window\.FormationSystem\.wearCombatFormation\(\)/.test(app), 'A11 战后耐久结算接线');

    const bt = read('js/battle.js');
    eq((bt.match(/this\._formationMul/g) || []).length >= 3 ? 3 : (bt.match(/this\._formationMul/g) || []).length, 3,
        'A12 攻/防/速三处乘区消费战阵加成');

    const sv = read('js/sects/sect-visit.js');
    ok(sv.indexOf("'fmt_stone_basic'") >= 0 && sv.indexOf("'fmt_flag_iron'") >= 0 && sv.indexOf("'fmt_eye_spirit'") >= 0,
        'A13 阵材上架门派坊市（此前物品账上没有它们，想买买不到）');

    ok(read('js/house-system.js').indexOf('openCaveWorksUI()') >= 0, 'A14 洞府面板挂「洞府深作」入口');
}

// ============ 沙盒基建 ============
function fakeEl(tag) {
    const el = {
        tagName: tag || 'div', style: {}, dataset: {}, children: [], className: '', id: '',
        classList: { _s: {}, add(c) { this._s[c] = 1; }, remove(c) { delete this._s[c]; }, contains(c) { return !!this._s[c]; } },
        appendChild(c) { this.children.push(c); return c; }, removeChild() {}, remove() { if (el._onRemove) el._onRemove(el); },
        setAttribute() {}, getAttribute() { return null; }, addEventListener() {}, focus() {}, insertAdjacentHTML() {},
        closest() { return null; }, onclick: null, innerHTML: '', textContent: '', value: ''
    };
    el.querySelector = function (sel) { el._qs = el._qs || {}; if (!el._qs[sel]) el._qs[sel] = fakeEl('qs:' + sel); return el._qs[sel]; };
    el.querySelectorAll = function () { return []; };
    return el;
}
function makeWorld(opts) {
    opts = opts || {};
    const sb = {
        console: { log() {}, warn() {}, error() {} },
        setTimeout: function (f) { if (opts.runTimers !== false) { try { f(); } catch (e) {} } return 0; },
        clearTimeout() {}, setInterval: () => 0, clearInterval() {},
        JSON, Date, Object, Array, String, Number, Boolean, RegExp, Error, Math, isFinite, isNaN, parseInt, parseFloat
    };
    sb.window = sb; sb.globalThis = sb;
    sb.__els = {};
    sb.document = {
        createElement: fakeEl,
        getElementById: (id) => sb.__els[id] || null,
        querySelector: () => null, querySelectorAll: () => [],
        body: { appendChild(el) { if (el && el.id) sb.__els[el.id] = el; return el; }, removeChild() {}, insertAdjacentHTML() {} },
        head: { appendChild() {} },
        addEventListener() {}, readyState: 'complete',
        documentElement: { style: {} }
    };
    sb.localStorage = { _s: {}, getItem(k) { return Object.prototype.hasOwnProperty.call(this._s, k) ? this._s[k] : null; }, setItem(k, v) { this._s[k] = String(v); }, removeItem(k) { delete this._s[k]; } };
    sb.timeSystem = { gameTime: { currentDay: 1, currentHour: 12 }, advanceTime() {}, onNewDaySubscribe() {}, getAbsoluteDay: () => 1 };
    sb.WorldCalendar = { day: 1 };
    sb.EventBus = { on() {}, emit() {}, off() {} };
    sb.__msgs = [];
    sb.showMessage = (t) => sb.__msgs.push(String(t));
    sb.gameLog = { add() {} };
    sb.currentCharData = { name: '测试修士', realm: '金丹', qi: 100, energy: 100, health: 100, lifeSkills: { 炼制: 50, 锻造: 50 } };
    sb.getLifeSkill = (k) => (sb.currentCharData.lifeSkills && sb.currentCharData.lifeSkills[k]) || 0;
    sb.__wallet = { stones: opts.stones === undefined ? 1000 : opts.stones };
    sb.XianXia = { DataManager: { getSpiritStones: () => sb.__wallet.stones, deductSpiritStones: (n) => { if (sb.__wallet.stones < n) return false; sb.__wallet.stones -= n; return true; }, addSpiritStones: (n) => { sb.__wallet.stones += n; } } };
    sb.DataManager = sb.XianXia.DataManager;
    sb.inventory = { currency: { spiritStones: 0, copper: 0 }, slots: (opts.slots || []).map(s => s ? Object.assign({ removeCount(n) { this.count -= n; } }, s) : null) };
    sb.updateInventoryUI = () => {};
    sb.updateCurrencyUI = () => {};
    sb.updateCharacterStatus = () => {};
    sb.__added = [];
    sb.addItemToInventory = (id, n) => { sb.__added.push(id + 'x' + n); return true; };
    sb.addItem = (id, n) => { sb.__added.push(id + 'x' + (n || 1)); return true; };
    sb.addResultItem = (id, n) => { sb.__added.push(id + 'x' + (n || 1)); return true; };
    sb.itemById = {};
    sb.allItems = [];
    sb.materials = [];
    vm.createContext(sb);
    return sb;
}

// ============ B 材料账与阵材注册（compound-ui 运行时） ============
{
    const w = makeWorld({ slots: [
        { itemId: 'mat_lingzhi', count: 3 }, { itemId: 'mat_ginseng', count: 1 }, null, { itemId: 'fmt_stone_basic', count: 5 }
    ] });
    vm.runInContext(read('js/extensions/formation-system.js'), w, { filename: 'formation-system.js' });
    vm.runInContext(read('js/crafting/compound-ui.js'), w, { filename: 'compound-ui.js' });

    // B1 材料账：足额扣、不足拒
    eq(w.compoundMat.consume(['mat_lingzhi', 'mat_lingzhi']), true, 'B1a 足额材料：实扣成功');
    eq(w.inventory.slots[0].count, 1, 'B1b 扣账精确（3-2=1）');
    eq(w.compoundMat.consume(['mat_lingzhi', 'mat_lingzhi']), false, 'B1c 不足即拒（不部分扣）');
    eq(w.inventory.slots[0].count, 1, 'B1d 拒绝时一根草都没动');
    ok(w.__msgs.some(m => m.indexOf('材料不齐') >= 0), 'B1e 缺料话术点名缺什么');
    w.compoundMat.refund(['mat_lingzhi']);
    ok(w.__added.indexOf('mat_lingzhi x1') >= 0 || w.__added.indexOf('mat_lingzhix1') >= 0, 'B1f 退回走真实入包通道');

    // B2 阵材在物品账上（formation-system 自带注册为 consumable；compound-ui 兜底注册为 material——两条路都算数）
    ok(!!w.itemById['fmt_stone_basic'] && !!w.itemById['fmt_core_soul'], 'B2a 八样阵材在物品账');
    ok(['material', 'consumable'].indexOf(w.itemById['fmt_stone_basic'].type) >= 0, 'B2b 注册为可持有物品类');
    ok(w.itemById['fmt_stone_basic'].price > 0, 'B2c 有价——坊市货架才认得');

    // B3 布阵全链：材料实扣 + 首期阵费走真钱包
    w.__wallet.stones = 500;
    w.FormationSystem.setSpiritStones(w.XianXia.DataManager.getSpiritStones()); // UI 里的同步动作
    const before = w.inventory.slots[3].count;
    const dep = w.FormationSystem.deployFormation('fmt_three_talent'); // 需基础阵石×3+铁阵旗×3
    eq(dep && dep.ok, false, 'B3a 缺铁阵旗：布阵如实拒绝');
    w.inventory.slots.push({ itemId: 'fmt_flag_iron', count: 3, removeCount(n) { this.count -= n; } });
    const dep2 = w.FormationSystem.deployFormation('fmt_three_talent');
    eq(dep2 && dep2.ok, true, 'B3b 材料齐：三才阵布成');
    eq(w.inventory.slots[3].count, before - 3, 'B3c 阵石实扣三枚');
    const bonuses = w.FormationSystem.getCombatBattleBonuses();
    eq(bonuses && bonuses.attackPct, 10, 'B3d 战阵加成可被战斗侧读取（攻+10%）');

    // B4 战后磨损与阵散
    let wear = w.FormationSystem.wearCombatFormation();
    eq(wear && wear.durability, 9, 'B4a 每场仗磨一点耐久（10→9）');
    w.__msgs.length = 0;
    for (let i = 0; i < 9; i++) w.FormationSystem.wearCombatFormation();
    eq(w.FormationSystem.getCombatBattleBonuses(), null, 'B4b 磨尽阵散：加成归无');
    ok(w.__msgs.some(m => m.indexOf('散了') >= 0), 'B4c 阵散有告示（指引重新布阵）');

    // B5 洞府深作入口：无洞府不开门
    w.__msgs.length = 0;
    w.openCaveWorksUI();
    ok(w.__msgs.some(m => m.indexOf('尚未开辟洞府') >= 0), 'B5 无洞府者被如实挡在门外');
}

// ============ C 合成面板宿主（crafting.js 运行时） ============
{
    const w = makeWorld({});
    vm.runInContext(read('js/crafting.js'), w, { filename: 'crafting.js' });
    w.openCraftingUI(); // 旧版此处静默空挥；现在应动态建起整块面板
    const panel = w.__els['panel-crafting'];
    ok(!!panel, 'C1 「物品合成」按钮不再空挥：面板宿主无中生有');
    const box = panel.children[0];
    ok(box && box.innerHTML.indexOf('crafting-tabs') >= 0 && box.innerHTML.indexOf('crafting-recipes') >= 0, 'C2 面板带页签与配方区骨架');
    ok(w.talismanRecipes.length > 0, 'C3 符箓配方在账（' + w.talismanRecipes.length + '张）——页签可达即不再是死账');
    // 页签渲染：五类标签按配方数出
    const tabsEl = w.__els['crafting-tabs'];
    w.renderCraftingTabs('pilfer');
    const tabsHost = panel.querySelector ? null : null;
    // document.getElementById 在沙盒里走 __els：renderCraftingTabs 写入的是 getElementById('crafting-tabs')
    ok(true, 'C4 页签渲染不抛异常');
    // 深水入口挂载
    w.AlchemyCompound = { COMPOUND_PILFAR_RECIPES: [] };
    w.renderCraftingTabs('pilfer');
    ok(true, 'C5 炼丹页签深水入口渲染不抛异常');
    w.closeCraftingUI();
    // 关闭即移除（沙盒 remove 不清 __els，验证调用不抛即可）
    ok(true, 'C6 关面板不抛异常');
}

// ============ D 傀儡工坊全链（puppet-system + UI 钱包同步） ============
{
    const w = makeWorld({ slots: [
        { itemId: 'pup_core_iron', count: 1 }, { itemId: 'pup_body_medium', count: 1 },
        { itemId: 'pup_weapon_sword', count: 1 }, { itemId: 'pup_pattern_aggressive', count: 1 }
    ], stones: 300 });
    vm.runInContext(read('js/extensions/puppet-system.js'), w, { filename: 'puppet-system.js' });
    vm.runInContext(read('js/crafting/compound-ui.js'), w, { filename: 'compound-ui.js' });
    w.playerHouse = { type: 'cave' };
    w.openCaveWorksUI();
    w._cwTab('pup');
    w.__wallet.stones = 300;
    w._pupCraft('pup_warrior_basic'); // 工费50+四部件
    const st = w.PuppetSystem.getState();
    eq(st.puppets.length, 1, 'D1 第一只傀儡造得出来了（旧版玩家无任何入口）');
    eq(w.__wallet.stones, 250, 'D2 工费从真钱包走账（300-50）');
    const inst = st.puppets[0];
    eq(inst.name, '铁甲战斗傀儡', 'D2b 造出的正是所选型号');
    // 部件实扣
    eq(w.inventory.slots[0].count, 0, 'D3 核心部件实扣');
    // 启用/收起
    w._pupDeploy(inst.id);
    eq(w.PuppetSystem.getPuppet(inst.id).deployed, true, 'D4 傀儡领命上岗');
    w._pupRecall(inst.id);
    eq(w.PuppetSystem.getPuppet(inst.id).deployed, false, 'D4b 收起归库');
    // 缺件拒绝
    w.__msgs.length = 0;
    w._pupCraft('pup_guard_elite');
    eq(w.PuppetSystem.getState().puppets.length, 1, 'D5 部件不齐：如实拒绝不凭空造物');
    ok(w.__msgs.some(m => m.indexOf('部件不齐') >= 0 || m.indexOf('制造未成') >= 0), 'D5b 拒绝有话术');
}

// ============ 汇总 ============
console.log('v23.0-wiring: ' + passed + ' passed, ' + failures.length + ' failed');
if (failures.length > 0) process.exit(1);
console.log('v23.0-wiring: all green');
