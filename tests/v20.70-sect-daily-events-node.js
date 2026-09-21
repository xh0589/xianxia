#!/usr/bin/env node
/**
 * v20.70 门派每日事件池补全门禁
 * ① SECT_EVENTS 必须覆盖全部 36 个门派，每派 ≥2 条事件
 * ② 事件结构合法：id 全局唯一、icon/name/text/choices 齐全、每条 choice 有 label+reply
 * ③ effects 只用消费端认识的词表：contribution/points/fame/item/buff/repSelf
 * ④ buff.effects 属性 ∈ 已知六维；item.id 必须是物品库真实存在的 id
 * 运行：node tests/v20.70-sect-daily-events-node.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');

let passed = 0, failed = 0;
function ok(cond, msg) {
    if (cond) { passed++; } else { failed++; console.log('[FAIL] ' + msg); }
}

const SECTS_36 = ['少林寺','嵩山派','大旗门','恒山派','全真教','华山派','武当派','侠隐阁','天涯海阁',
    '泰山派','药王谷','神机门','霹雳堂','茅山派','大隐阁','天书阁','蓬莱派',
    '衡山派','丐帮','铁掌帮','百花谷','五仙教','修罗宫','阎罗殿',
    '昆仑派','金刚宗','天龙教','烈日教',
    '天山派','逍遥派','血手门',
    '青城派','峨眉派','唐门',
    '铸剑山庄','飞蝎坞'];

// ---- 加载事件表 ----
const src = fs.readFileSync(path.join(ROOT, 'js/sects/sects-deep-data.js'), 'utf8');
const sandbox = { window: {}, console };
sandbox.global = sandbox;
vm.runInNewContext(src + '\n;__out = window.SECT_EVENTS;', sandbox);
const SECT_EVENTS = sandbox.__out;
ok(SECT_EVENTS && typeof SECT_EVENTS === 'object', 'window.SECT_EVENTS 已导出');

// ---- 物品库真实 id 集合 ----
const itemsSrc = fs.readFileSync(path.join(ROOT, 'js/items.js'), 'utf8');
const ITEM_IDS = new Set([...itemsSrc.matchAll(/^\s+id: '([a-z0-9_]+)',?$/gm)].map(m => m[1]));
ok(ITEM_IDS.size > 10, `物品库 id 抽取成功（${ITEM_IDS.size} 个）`);

const BUFF_STATS = new Set(['strength', 'dexterity', 'constitution', 'intelligence', 'meridian', 'perception']);
const EFFECT_KEYS = new Set(['contribution', 'points', 'fame', 'item', 'buff', 'repSelf']);

// ---- ① 36 派全覆盖 ----
for (const s of SECTS_36) {
    const pool = SECT_EVENTS[s];
    ok(Array.isArray(pool) && pool.length >= 2, `门派「${s}」应有 ≥2 条日常事件，实到 ${pool ? pool.length : 0}`);
}
const extra = Object.keys(SECT_EVENTS).filter(k => !SECTS_36.includes(k));
ok(extra.length === 0, `事件表不应有 36 派之外的键：${extra}`);

// ---- ②③④ 结构 / 词表 / 引用 ----
const seenIds = new Set();
for (const [sect, pool] of Object.entries(SECT_EVENTS)) {
    for (const ev of pool) {
        const tag = `${sect}/${ev.id || '(无id)'}`;
        ok(typeof ev.id === 'string' && ev.id.length > 0, `${tag}: 缺 id`);
        ok(!seenIds.has(ev.id), `${tag}: 事件 id 重复`);
        seenIds.add(ev.id);
        ok(typeof ev.icon === 'string' && ev.icon.length > 0, `${tag}: 缺 icon`);
        ok(typeof ev.name === 'string' && ev.name.length > 0, `${tag}: 缺 name`);
        ok(typeof ev.text === 'string' && ev.text.length > 0, `${tag}: 缺 text`);
        ok(Array.isArray(ev.choices) && ev.choices.length >= 1, `${tag}: choices 至少 1 个`);
        for (const c of ev.choices || []) {
            ok(typeof c.label === 'string' && c.label.length > 0, `${tag}: choice 缺 label`);
            ok(typeof c.reply === 'string' && c.reply.length > 0, `${tag}: choice 缺 reply`);
            const eff = c.effects;
            ok(eff === undefined || (eff && typeof eff === 'object'), `${tag}: effects 必须是对象或省略`);
            if (eff) {
                for (const k of Object.keys(eff)) {
                    ok(EFFECT_KEYS.has(k), `${tag}: 未知 effects 键「${k}」`);
                }
                if (eff.item) {
                    ok(typeof eff.item.id === 'string' && ITEM_IDS.has(eff.item.id), `${tag}: item.id「${eff.item && eff.item.id}」不在物品库`);
                    ok(typeof eff.item.count === 'number' && eff.item.count > 0, `${tag}: item.count 应为正数`);
                }
                if (eff.buff) {
                    ok(typeof eff.buff.name === 'string' && eff.buff.name.length > 0, `${tag}: buff 缺 name`);
                    ok(typeof eff.buff.hours === 'number' && eff.buff.hours > 0, `${tag}: buff.hours 应为正数`);
                    const be = eff.buff.effects || {};
                    ok(Object.keys(be).length > 0, `${tag}: buff.effects 为空`);
                    for (const stat of Object.keys(be)) {
                        ok(BUFF_STATS.has(stat), `${tag}: buff 未知属性「${stat}」`);
                        ok(typeof be[stat] === 'number' && be[stat] > 0, `${tag}: buff.${stat} 应为正数`);
                    }
                }
            }
        }
    }
}
const total = Object.values(SECT_EVENTS).reduce((n, p) => n + p.length, 0);
ok(total >= 36 * 2, `事件总数应 ≥72，实到 ${total}`);

console.log(`\n========== v20.70 门派日常事件池：${passed} 通过 / ${failed} 失败（${Object.keys(SECT_EVENTS).length} 派 / ${total} 条事件） ==========`);
process.exit(failed ? 1 : 0);
