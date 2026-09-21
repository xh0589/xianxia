#!/usr/bin/env node
/**
 * v20.85 道具库审计门禁：悬空发放归零 + 高级符落户 + 死配方清场
 * 全库装载（items.js → 扩展八件 → 合并器 → 13/14/15/16 补丁 → 高级符系统），
 * 然后从真实发放口子现场抽 ID 对库验证——任何一处按 ID 发东西而库里无模板，本测试直接红：
 * ① 搜刮/解剖掉落表（loot-system.js 全部 {id,weight} 条目）
 * ② 地标探索进度奖励（landmark-explore.js type:'item' 条目）
 * ③ 挖矿区域矿石表（app.js item:'mat_*' 条目）+ 钓鱼点（回归）
 * ④ 任务奖励（12-quest-extensions.js rewards.items）
 * ⑤ 飞禽传书信使通道（mail-system.js carrier itemId）
 * ⑥ NPC 委托目标与生活消费（npc-life-system.js itemId）
 * ⑦ 炼丹/制符配方产物（crafting.js result.itemId——凡配方在册，产物必须在库）
 * ⑧ 资源点产出（resource-points.js output 键）
 * 另验：高级符十五种注册形状 / 三张死配方已清 / 接线加载序。
 * 运行：node tests/v20.85-item-audit-node.js
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

// ============ 全库装载 ============
const w = {};
const sb = {
    window: w,
    console: { log() {}, warn() {}, error() {} },
    document: { getElementById: () => null, querySelector: () => null, addEventListener() {}, readyState: 'loading' },
    localStorage: { getItem: () => null, setItem() {} },
    setTimeout: () => 0
};
vm.createContext(sb);
const ORDER = [
    'js/items.js',
    'js/items-extended/01-pills.js', 'js/items-extended/02-weapons.js', 'js/items-extended/03-armor.js',
    'js/items-extended/04-materials.js', 'js/items-extended/05-talismans.js', 'js/items-extended/06-arts.js',
    'js/items-extended/07-food.js', 'js/items-extended/08-special.js',
    'js/items-extended.js',
    'js/items-extended/13-missing-ids.js', 'js/items-extended/14-ability-manuals.js',
    'js/items-extended/15-root-refine.js', 'js/items-extended/16-dangling-ids.js',
    'js/items-extended/10-crafting-extensions.js', 'js/items-extended/11-event-extensions.js',
    'js/items-extended/12-quest-extensions.js',
    'js/extensions/talisman-advanced.js'
];
let loadFails = [];
for (const f of ORDER) {
    try { vm.runInContext(load(f), sb, { filename: f }); }
    catch (e) { loadFails.push(f + ': ' + e.message); }
}
ok(loadFails.length === 0, '⓪ 物品库全链路装载无异常' + (loadFails.length ? '（' + loadFails.join(' | ') + '）' : ''));
const R = w.itemById || {};
ok(Object.keys(R).length >= 400, '⓪ 注册表规模 ≥400（补洞后实得 ' + Object.keys(R).length + '）');

// ============ 发放口子抽查工具 ============
function idsOf(rel, re, group) {
    const src = load(rel);
    const out = [];
    let m;
    while ((m = re.exec(src))) out.push(m[group || 1]);
    return [...new Set(out)];
}
function allRegistered(ids) { return ids.filter(id => !R[id]); }
function checkGate(name, rel, re, filter) {
    let ids = idsOf(rel, re);
    if (filter) ids = ids.filter(filter);
    const miss = allRegistered(ids);
    ok(ids.length > 0 && miss.length === 0, name + '：' + ids.length + ' 种全部在库' + (miss.length ? '（缺 ' + miss.join(',') + '）' : ''));
}

// ① 搜刮/解剖掉落表
checkGate('① 搜刮解剖掉落', 'js/loot-system.js', /\{ id: '([a-z0-9_]+)', weight/g);
// ② 地标探索奖励
checkGate('② 地标探索奖励', 'js/map/landmark-explore.js', /type: 'item', id: '([a-z0-9_]+)'/g);
// ③ 挖矿区域矿石 + 钓鱼点（回归）
checkGate('③ 挖矿矿石表', 'js/app.js', /item: '(mat_[a-z0-9_]+)'/g);
checkGate('③ 钓鱼点（回归）', 'js/app.js', /\{ id: '(food_[a-z0-9_]+)', name/g);
// ④ 任务奖励
checkGate('④ 任务奖励物品', 'js/items-extended/12-quest-extensions.js', /itemId: '([a-z0-9_]+)', count/g);
// ⑤ 飞禽传书
checkGate('⑤ 传书信使通道', 'js/mail-system.js', /itemId: '([a-z0-9_]+)'/g);
// ⑥ NPC 委托与生活消费
checkGate('⑥ NPC 委托与消费', 'js/npcs/npc-life-system.js', /itemId: '([a-z0-9_]+)'/g);
// ⑦ 配方产物：凡配方在册，产物必须在库（与 isRecipeContentReady 同一口径）
checkGate('⑦ 合成配方产物', 'js/crafting.js', /result: \{ itemId: '([a-z0-9_]+)'/g);
// ⑧ 资源点产出
{
    const src = load('js/extensions/resource-points.js');
    const ids = new Set();
    let m;
    const re = /output: \{ ([^}]+) \}/g;
    while ((m = re.exec(src))) {
        m[1].split(',').forEach(kv => {
            const k = kv.split(':')[0].trim();
            if (/^[a-z0-9_]+$/.test(k)) ids.add(k);
        });
    }
    const miss = allRegistered([...ids]);
    ok(ids.size > 10 && miss.length === 0, '⑧ 资源点产出：' + ids.size + ' 种全部在库' + (miss.length ? '（缺 ' + miss.join(',') + '）' : ''));
}

// ============ 高级符（talisman-advanced.js 第 2 节自注册，implemented:true） ============
{
    const adv = (w.TalismanAdvanced && w.TalismanAdvanced.ADVANCED_TALISMANS) || [];
    ok(adv.length === 15, '⑨ 高级符十五种（实得 ' + adv.length + '）');
    let shapeOk = true, regOk = true;
    adv.forEach(t => {
        const it = R[t.id];
        if (!it) { regOk = false; return; }
        if (it.type !== 'consumable' || it.subtype !== 'talisman' || it.implemented !== true ||
            it._category !== t.category || !it.effect) shapeOk = false;
    });
    ok(regOk, '⑨ 高级符全部注册进物品库（系统第 2 节自注册，商店按注册表进货即进得到）');
    ok(shapeOk, '⑨ 注册形状正确：consumable/talisman、implemented 标记、原符类保留在 _category');
}

// ============ 死配方清场 ============
{
    const src = load('js/crafting.js');
    ok(src.indexOf('pill_diamond') < 0 && src.indexOf('pill_tiger_power') < 0 && src.indexOf('pill_dragon_tiger') < 0,
        '⑩ 三张回合制增益死配方已清（系统无回合制 buff 机制，与丹药扩容包同一判断）');
    ok(src.indexOf('v20.85 清理') >= 0, '⑩ 清场留了审计注记');
}

// ============ 补洞文件本体 ============
{
    const patch = (w._danglingItemsB16 || []);
    ok(patch.length === 27, '⑪ 补洞文件 27 种（实得 ' + patch.length + '）');
    ok(patch.every(it => R[it.id] && R[it.id].name && R[it.id].desc && R[it.id].icon), '⑪ 每种补洞物品都有名有描述有图标');
    const names = patch.map(it => it.name).join('');
    ok(!/[a-zA-Z]{4,}/.test(patch.map(it => it.desc).join('')), '⑪ 描述纯中文（无漏翻字段）');
}

// ============ 接线 ============
{
    const html = load('仙侠.html');
    const i15 = html.indexOf('15-root-refine.js');
    const i16 = html.indexOf('16-dangling-ids.js');
    const im = html.indexOf('js/items-extended.js');
    ok(im > 0 && i16 > i15 && i15 > im, '⑫ HTML 加载序：合并器 → 15 → 16（注册表就位后补洞）');
    ok(html.indexOf('talisman-advanced.js') > 0, '⑫ 高级符系统在加载序内');
}

console.log('passed=' + passed + ' failed=' + failed);
process.exit(failed > 0 ? 1 : 0);
