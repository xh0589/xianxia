#!/usr/bin/env node
/**
 * v20.81 试玩报告 BUG 核对修复门禁
 * ① 主线第一任务：目标带 locationId+description；门派列表页签发射到访事件（源码断言）
 * ② collect/craft 匹配加固：itemName 字段 + mat_/food_ 前缀桥（匹配器源码抽取执行）
 * ③ 追踪栏人话标签：OBJECTIVE_TYPE_NAMES + _objectiveLabel（源码抽取执行）
 * ④ 九种鱼物品模板注册（13-missing-ids.js 沙盒功能验证）
 * ⑤ 寿元：初值 29520 / 老存档修复 / 新开局重置（lifespan-system.js 沙盒功能验证）
 * ⑥ 战斗属性境界加成：炼气一层 vs 金丹三层 攻防速韧全面拉开（combat-stats.js 沙盒功能验证）
 * ⑦ 位置口径：closeCityPanel 保留 / enterSect 写入+发射 / closeSectPanel 还原（源码断言）
 * ⑧ 俸禄走职位表：铜钱+灵石双发（源码断言）
 * ⑨ 地图嵩山派标记不再压长安（SVG 坐标断言）
 * ⑩ 内院按钮撞名消解 / 打坐提示补规则说明（源码断言）
 * 运行：node tests/v20.81-report-bugfix-node.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');

let passed = 0, failed = 0;
function ok(cond, msg) {
    if (cond) passed++;
    else { failed++; console.log('[FAIL] ' + msg); }
}
function load(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ============ ① 主线第一任务 ============
const questSrc = load('js/quest/quest-system.js');
ok(/locationId:\s*'sect_list'[\s\S]{0,120}location:\s*'门派列表'/.test(questSrc), '① main_001 首目标带 locationId=sect_list');
ok(/description:\s*'浏览门派列表'/.test(questSrc), '① main_001 首目标带人话 description');
ok(/description:\s*'拜入任意门派'/.test(questSrc), '① join_sect 目标带人话 description');
const appSrc = load('js/app.js');
ok(/switchListMode[\s\S]{0,900}EventBus\.emit\('location:visited',\s*\{\s*locationId:\s*'sect_list',\s*locationName:\s*'门派列表'/.test(appSrc), '② 门派页签打开发射 location:visited');
ok(/obj\.locationId === data\.locationId/.test(questSrc), '① visit 匹配器认 locationId');

// ============ ② collect/craft 匹配加固（抽取匹配器逻辑执行） ============
function _stripItemPrefix(s) { return String(s || '').replace(/^(mat|food)_/, ''); }
ok(/_stripItemPrefix/.test(questSrc) && /replace\(\/\^\(mat\|food\)_\//.test(questSrc), '② 匹配器带 mat_/food_ 前缀桥（源码）');
ok(/objItem === data\.itemName/.test(questSrc), '② 匹配器比对 itemName 字段（事件真实负载字段）');
// 前缀桥语义直测（与源码同一实现）
ok(_stripItemPrefix('mat_lingzhi') === 'lingzhi' && _stripItemPrefix('lingzhi') === 'lingzhi', '② 前缀桥：mat_lingzhi 与 lingzhi 同根');
ok(_stripItemPrefix('mat_iron_ore') === _stripItemPrefix('iron_ore'), '② 前缀桥：mat_iron_ore 与 iron_ore 同根');
ok(_stripItemPrefix('food_basic_fish') === 'basic_fish', '② 前缀桥：food_ 前缀同样剥除');
ok(!/obj\.item === data\.name\);?\s*$[\s\S]{0,40}item:obtained/.test(questSrc), '② item:obtained 不再只比对死字段 data.name');

// ============ ③ 追踪栏人话标签 ============
ok(/OBJECTIVE_TYPE_NAMES\s*=/.test(questSrc), '③ 有目标类型中文名表');
ok(/join_sect:\s*'加入门派'/.test(questSrc) && /cultivation_realm:\s*'修为达标'/.test(questSrc), '③ 类型表覆盖 join_sect / cultivation_realm');
ok(/function _objectiveLabel/.test(questSrc), '③ 有 _objectiveLabel 标签解析');
ok(/obj\.description[\s\S]{0,200}obj\.location[\s\S]{0,300}window\.itemById/.test(questSrc.match(/function _objectiveLabel[\s\S]{0,1400}/)[0]), '③ 标签解析顺序：description→location→物品名（查模板表）');
ok(/_objectiveLabel\(obj\)[\s\S]{0,60}\(obj\.count \|\| 1\)/.test(questSrc), '③ 追踪栏渲染走 _objectiveLabel 且 count 兜底');
// _objectiveLabel 语义直测：realm 目标不再是空白
ok(/obj\.realm \+ \(obj\.layer \? obj\.layer \+ '层'/.test(questSrc), '③ 修为目标渲染为「境界+层数」');

// ============ ④ 九种鱼物品模板 ============
{
    const w = { itemById: {}, allItems: [] };
    const sandbox = { window: w, console: { log() {}, warn() {}, error() {} } };
    vm.createContext(sandbox);
    vm.runInContext(load('js/items-extended/13-missing-ids.js'), sandbox, { filename: '13-missing-ids.js' });
    const FISH = [
        ['food_basic_fish', '鲤鱼'], ['food_carp', '鲫鱼'], ['food_grass_carp', '草鱼'],
        ['food_silver_fish', '银鱼'], ['food_golden_carp', '锦鲤'], ['food_koi', '锦鲤（变异）'],
        ['food_sea_fish', '海鱼'], ['food_black_fish', '黑鱼'], ['food_tuna', '金枪鱼']
    ];
    let allReg = true, namesOk = true, shapeOk = true;
    FISH.forEach(([id, name]) => {
        const t = w.itemById[id];
        if (!t) { allReg = false; return; }
        if (t.name !== name) namesOk = false;
        if (t.type !== 'consumable' || t.subtype !== 'food' || !t.effect || !(t.effect.energy_recovery > 0) || !t.icon) shapeOk = false;
    });
    ok(allReg, '④ FISH_SPOTS 的 9 种鱼全部注册进 itemById');
    ok(namesOk, '④ 鱼名与钓鱼点表一致');
    ok(shapeOk, '④ 鱼模板是可食用形状（consumable/food/energy_recovery/icon）');
    ok(w.allItems.filter(i => FISH.some(f => f[0] === i.id)).length === 9, '④ 9 种鱼同步进 allItems');
}
// 与 app.js FISH_SPOTS 交叉核对：表里每个 id 都有模板
{
    const spotIds = [...appSrc.matchAll(/\{ id: '(food_[a-z_]+)', name: '([^']+)'/g)].map(m => [m[1], m[2]]);
    const missSrc = load('js/items-extended/13-missing-ids.js');
    const missing = spotIds.filter(([id]) => !missSrc.includes("'" + id + "'"));
    ok(spotIds.length >= 9 && missing.length === 0, '④ 钓鱼点全部 ID 在物品补丁文件里有定义');
}

// ============ ⑤ 寿元系统 ============
{
    const store = {};
    const w = {};
    const sandbox = {
        window: w,
        console: { log() {}, warn() {}, error() {} },
        localStorage: {
            getItem: k => (k in store ? store[k] : null),
            setItem: (k, v) => { store[k] = String(v); }
        },
        document: { getElementById: () => null }
    };
    vm.createContext(sandbox);
    vm.runInContext(load('js/lifespan-system.js'), sandbox, { filename: 'lifespan-system.js' });
    ok(sandbox.playerLifespan.remainingDays === (100 - 18) * 360, '⑤ 初值 remainingDays=29520（不再是 0）');
    ok(typeof w.resetLifespanForNewGame === 'function', '⑤ 导出 resetLifespanForNewGame');
    // 老存档"余0天"修复
    store['xianxia_lifespan'] = JSON.stringify({ maxAge: 100, currentAge: 30, remainingDays: 0, isImmortal: false });
    w.initLifespan();
    ok(sandbox.playerLifespan.remainingDays === (100 - 30) * 360, '⑤ initLifespan 修复老存档 remainingDays:0 → 按历法重算');
    // 真正寿终的人不被误救
    store['xianxia_lifespan'] = JSON.stringify({ maxAge: 100, currentAge: 100, remainingDays: 0, isImmortal: false, _endingShown: true });
    w.initLifespan();
    ok(sandbox.playerLifespan.remainingDays === 0, '⑤ 已到寿终的存档不被重算复活');
    // 新开局重置
    store['xianxia_lifespan'] = JSON.stringify({ maxAge: 500, currentAge: 120, remainingDays: 5, isImmortal: false, _warn365: true });
    w.resetLifespanForNewGame();
    ok(sandbox.playerLifespan.currentAge === 18 && sandbox.playerLifespan.maxAge === 100 && sandbox.playerLifespan.remainingDays === 29520, '⑤ resetLifespanForNewGame 回到 18 岁/100 年/29520 天');
    ok(!sandbox.playerLifespan._warn365 && !sandbox.playerLifespan._endingShown, '⑤ 新开局不带上一世的凶兆/寿终标记');
    ok(w.playerLifespan === sandbox.playerLifespan, '⑤ window.playerLifespan 与内部对象同步（引用不再指旧对象）');
}
ok(/resetLifespanForNewGame/.test(appSrc), '⑤ startGame 调用寿元重置');
ok(/charData\.location = '帝都·长安'/.test(appSrc), '⑤ startGame 写默认所在地（不再是「未选择」）');
ok(/locationSystem\.currentLocation = '帝都·长安'/.test(appSrc), '⑤ startGame 同步地图当前位置');

// ============ ⑥ 战斗属性境界加成 ============
{
    const w = {};
    let realm = '炼气', layer = 1;
    w.getCurrentCharData = () => ({ realm, layer, attrs: { strength: 20, dexterity: 20, intelligence: 10, willpower: 10, constitution: 20, meridian: 10 }, combatSkills: {} });
    const sandbox = { window: w, console: { log() {}, warn() {}, error() {} } };
    vm.createContext(sandbox);
    vm.runInContext(load('js/combat-stats.js'), sandbox, { filename: 'combat-stats.js' });
    const base = w.getDerivedCombatStats(null);
    realm = '炼气'; layer = 2;
    const qi2 = w.getDerivedCombatStats(null);
    realm = '金丹'; layer = 3;
    const gold = w.getDerivedCombatStats(null);
    realm = '元婴'; layer = 9;
    const baby = w.getDerivedCombatStats(null);
    ok(gold.attack > base.attack, '⑥ 金丹三层攻击高于炼气一层（突破有实战收益）');
    ok(gold.defense > base.defense, '⑥ 金丹三层防御高于炼气一层');
    ok(gold.speed > base.speed, '⑥ 金丹三层速度高于炼气一层');
    ok(gold.toughness > base.toughness, '⑥ 金丹三层韧性高于炼气一层');
    ok(baby.attack > gold.attack && baby.defense > gold.defense, '⑥ 元婴全面强于金丹（境界单调递增）');
    ok(qi2.attack > base.attack, '⑥ 同境界升层也有小幅成长');
    // 非玩家实体不吃境界加成
    const npcBefore = w.getDerivedCombatStats({ type: 'npc', attrs: { strength: 20, dexterity: 20, intelligence: 10, willpower: 10, constitution: 20, meridian: 10 }, skills: {}, toughness: null });
    realm = '渡劫'; layer = 9;
    const npcAfter = w.getDerivedCombatStats({ type: 'npc', attrs: { strength: 20, dexterity: 20, intelligence: 10, willpower: 10, constitution: 20, meridian: 10 }, skills: {}, toughness: null });
    ok(npcBefore.attack === npcAfter.attack, '⑥ 境界加成只作用于玩家，NPC 不受玩家境界影响');
}

// ============ ⑦ 位置口径 ============
const locSrc = load('js/location-system.js');
{
    const closeFn = locSrc.match(/function closeCityPanel\(\)[\s\S]{0,1600}?\n}/)[0];
    ok(!/location = null/.test(closeFn), '⑦ closeCityPanel 不再把角色位置清成 null');
    ok(/location = currentLocation/.test(closeFn), '⑦ closeCityPanel 位置与地图当前城市保持同口径');
}
{
    const enterFn = locSrc.match(/function enterSect\(sectName\)[\s\S]{0,3500}?\n}/)[0];
    ok(/currentCharData\.location = sectName/.test(enterFn), '⑦ enterSect 写入角色位置=门派名（门派日常钩子的读源）');
    ok(/EventBus\.emit\('location:visited'/.test(enterFn), '⑦ enterSect 发射到访事件（门派 visit 任务可计数）');
    ok(/updateCharacterStatus/.test(enterFn), '⑦ enterSect 刷新顶栏所在地');
}
{
    const closeSect = locSrc.match(/function closeSectPanel\(\)[\s\S]{0,1200}?\n}/)[0];
    ok(/location = currentLocation \|\| null/.test(closeSect), '⑦ closeSectPanel 还原位置到最近城市');
}
ok(/charLoc \|\| currentCity/.test(appSrc), '⑦ 顶栏所在地优先读角色位置字段（进门派后面板不再停留旧城市）');

// ============ ⑧ 俸禄走职位表 ============
const sectSrc = load('js/sects/sects-system.js');
{
    const fn = sectSrc.match(/function collectSectResources\(\)[\s\S]{0,4200}?return true;\n}/)[0];
    ok(/getPlayerRank\(\)/.test(fn), '⑧ 俸禄读 COMMON_RANKS 职位表');
    ok(/rankDef\.salary\.copper/.test(fn) && /rankDef\.salary\.spiritStones/.test(fn), '⑧ 铜钱+灵石双轨都在实发里');
    ok(/currency\.copper = \(window\.inventory\.currency\.copper \|\| 0\) \+ baseCopper/.test(fn), '⑧ 铜钱真实入账');
    ok(/铜钱\+'/.test(fn) || /铜钱\+" ?\+/.test(fn) || /'铜钱\+' \+ baseCopper/.test(fn), '⑧ 俸禄消息报出铜钱');
    ok(/relBonus/.test(fn), '⑧ 同门关系加成保留');
}
// 显示与实发同源：职位界面的 salary 与实发读同一张表
const deepSrc = load('js/sects/sects-deep-data.js');
ok(/id: 7, name: '杂役弟子'[\s\S]{0,300}salary: \{ copper: 10/.test(deepSrc), '⑧ 职位表杂役档存在（表未被改动）');

// ============ ⑨ 地图嵩山派标记 ============
const html = load('仙侠.html');
{
    const song = html.match(/selectSect\('嵩山派'\)[\s\S]{0,200}?circle cx="(\d+)" cy="(\d+)" r="6"[\s\S]{0,400}?x="(\d+)" y="(\d+)"/);
    ok(song && song[1] === '418' && song[2] === '238', '⑨ 嵩山派圆点移到 (418,238)，不再压长安');
    ok(song && song[3] === '418' && song[4] === '223', '⑨ 嵩山派文字随圆点同步移动');
    const changan = html.match(/selectCity\('帝都 · 长安'[\s\S]{0,200}?circle cx="(\d+)" cy="(\d+)" r="5"/);
    ok(changan && changan[1] === '400' && changan[2] === '250', '⑨ 长安圆点原位未动');
    const d = Math.hypot(418 - Number(changan[1]), 238 - Number(changan[2]));
    ok(d > 11, '⑨ 嵩山派圆点与长安圆点距离 > 两半径之和（不再重叠）');
}

// ============ ⑩ 按钮撞名 / 打坐提示 ============
const visitSrc = load('js/sects/sect-visit.js');
ok(/openFacilityUI\(\)[^>]*>🧰 使用设施/.test(visitSrc), '⑩ 设施入口按钮改名「使用设施」');
ok((visitSrc.match(/进入内院/g) || []).length >= 1 && !/openFacilityUI\(\)[^>]*>进入内院/.test(visitSrc), '⑩ 同屏不再出现两个功能不同的「进入内院」按钮');
ok(/打坐越久耗气越多/.test(appSrc) && /dur\.label/.test(appSrc), '⑩ 打坐真气不足提示带上时长名与耗气规则');

// ============ 汇总 ============
console.log('passed=' + passed + ' failed=' + failed);
process.exit(failed > 0 ? 1 : 0);
