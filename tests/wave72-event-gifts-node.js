/**
 * wave72-event-gifts-node.js — 第七十二波 · 事件奖励物品这条路 验收：
 *   A 引擎摊平：result.item / choice.item 两源都认，{id,count} 对象不再当字符串塞给 addItem
 *   B 在册：全仓事件包声明的奖励物品 id 必须真在物品表里（幽灵 id 是这条路的另一半病）
 *   C 上屏文案：多件要念出 ×N，单件不多打尾巴
 *
 * 运行：node tests/wave72-event-gifts-node.js
 */
'use strict';

var fs = require('fs');
var vm = require('vm');
var path = require('path');
var ROOT = path.resolve(__dirname, '..');

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; console.log('  ✓ ' + msg); }
    else { failed++; console.error('  ✗ ' + msg); }
}
function eq(a, b, msg) { assert(a === b, msg + '（实际=' + JSON.stringify(a) + ' 期望=' + JSON.stringify(b) + '）'); }

// ==================== 物品表 ====================
const sandbox = { console: { log() {}, warn() {}, error() {} }, document: undefined };
sandbox.window = sandbox;
vm.createContext(sandbox);
const run = rel => vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), sandbox, { filename: rel });
run('js/items.js');
for (const f of fs.readdirSync(path.join(ROOT, 'js/items-extended')).sort()) run('js/items-extended/' + f);
run('js/items-extended.js');
const itemById = sandbox.itemById;

// ==================== A 引擎摊平 ====================
const eng = fs.readFileSync(path.join(ROOT, 'js/npcs/npc-personal-events.js'), 'utf8');
// 第一百三十批改口：这一段接了实收账后变长了，旧的 {0,1200} 上限会把整段读空（六条连坐红）——放到 2600，仍锁在同一个收尾 }
const block = /===== 处理物品奖励[\s\S]{0,2600}?\n    \}\n/.exec(eng);
assert(!!block, '处理物品奖励那一段仍在场');
const src = block ? block[0] : '';
assert(/result\.item \|\| choice\.item/.test(src), '两条来源都认：result.item 与 choice.item');
assert(/typeof gift === 'object'\) \? gift\.id : gift/.test(src), '对象形摊平成 id');
assert(/gift\.count > 0\) \? gift\.count : 1/.test(src), '对象形的 count 落到发货上');
assert(!/addItem\(\s*result\.item\s*,\s*1\s*\)/.test(src), '不再把原样（可能是对象）塞给 addItem');
assert(/giftName/.test(src) && /itemById/.test(src) && /\[giftId\]/.test(src), '上屏按归一后的 id 查物品名');
assert(/×' \+ 收\.count|×' \+ giftCount/.test(src), '多件在屏上念出 ×N');
// 第一百三十批新钉：这一段的发奖要认实收，且满包／查无此号不许混成一句
assert(/giveWithReceipt\(giftId, giftCount/.test(src), 'A7 发货认实收（走 giveWithReceipt，彩头自己拼）');
assert(/addItemFailText/.test(src), 'A8 一件没带走时问原因账（不许一律怪给行囊）');

// 用同一段逻辑做一次真判定（把摊平支单独跑一遍）
function flatten(gift) {
    var giftId = (gift && typeof gift === 'object') ? gift.id : gift;
    var giftCount = (gift && typeof gift === 'object' && gift.count > 0) ? gift.count : 1;
    return { id: giftId, count: giftCount };
}
eq(flatten({ id: 'spirit_grass', count: 2 }).id, 'spirit_grass', '恒山那条 {id:spirit_grass,count:2} → id 摊平');
eq(flatten({ id: 'spirit_grass', count: 2 }).count, 2, '恒山那条 → count=2 真进账');
eq(flatten('spirit_stone').id, 'spirit_stone', '字符串形照旧');
eq(flatten('spirit_stone').count, 1, '字符串形默认 1 枚');
eq(flatten(null).id, null, '无奖励 → 不发东西');

// ==================== B 全仓奖励 id 在册 ====================
function walk(dir, out) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p, out); else if (/\.js$/.test(e.name)) out.push(p);
    }
    return out;
}
const decls = [];
for (const f of walk(path.join(ROOT, 'js'), [])) {
    const rel = path.relative(ROOT, f).replace(/\\/g, '/');
    const t = fs.readFileSync(f, 'utf8');
    t.split('\n').forEach((ln, i) => {
        let m = /\bitem\s*=\s*\{\s*id:\s*['"]([a-z0-9_]+)['"](?:\s*,\s*count:\s*(\d+))?/.exec(ln);
        if (m) decls.push({ at: rel + ':' + (i + 1), id: m[1], count: m[2] ? +m[2] : 1, kind: 'effects 回对象' });
        m = /\bitem:\s*['"]([a-z0-9_]+)['"]/.exec(ln);
        if (m) decls.push({ at: rel + ':' + (i + 1), id: m[1], count: 1, kind: '字面声明' });
    });
}
assert(decls.length >= 11, '扫到事件奖励声明 ' + decls.length + ' 条（含旧的 11 条）');
const ghosts = decls.filter(d => !itemById[d.id]);
eq(ghosts.length, 0, '所有奖励 id 都在物品表内' + (ghosts.length ? '，悬空：' + ghosts.map(g => g.at + '→' + g.id).join(', ') : ''));
const counts = decls.filter(d => d.count > 1);
assert(counts.length > 0, '确有声明多件的奖励：' + counts.map(c => c.at + '×' + c.count).join(', '));

console.log('\n通过 ' + passed + ' / 失败 ' + failed);
process.exit(failed ? 1 : 0);
