/**
 * ==================== v24.2 裸格子直写除根验收 ====================
 * 病（FIX-01 定案根病，2026-09-17 实机 + 页内只读复现 + 静态行号三方吻合）：
 *   绕过背包 API 直写 `inventory.slots[i] = { templateId, name, count }` 产出
 *   「无 uid 无 getTemplate」的 plain object 病格子——渲染链在 inventory.js:930/:834/:850
 *   抛 TypeError，被空 catch 吞掉，#inventory-grid 先清空后中断 ⇒ 整屏背包空白；
 *   搜索/筛选/排序/收藏/批量出售共用此链，任何含病格子的存档背包 UI 全废。
 *   历批（82/122/126-130）治的是症状与主通道，v24.2 批把最后 4 处直写兜底整段铲除：
 *   app.js buyFromCityShop / 采矿 / 贡献商店 + enhanced-shop.js buyFromEnhancedShop。
 *   兜底第二通道改走 window.inventory.addItem（正式 API，产 ItemInstance）；
 *   连它都没有时如实按零收——退款/「没带走」话术各归各位，绝不再造病格子。
 * 运行：node tests/v24.2-bare-write-root-node.js
 */
'use strict';

var fs = require('fs');
var path = require('path');
var ROOT = path.resolve(__dirname, '..');

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; console.log('  ✓ ' + msg); }
    else { failed++; console.error('  ✗ ' + msg); }
}
function src(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// 与 wave141 同款掩码：挖掉注释与字符串，棘轮只咬真代码
function 掩码(s) {
    var a = s.split(''); var 引 = null;
    for (var i = 0; i < s.length; i++) {
        var c = s[i];
        if (引) { if (c === '\\') { a[i] = ' '; a[i + 1] = ' '; i++; continue; } if (c === 引) 引 = null; a[i] = ' '; continue; }
        if (c === '/' && s[i + 1] === '/') { while (i < s.length && s[i] !== '\n') a[i++] = ' '; i--; continue; }
        if (c === '/' && s[i + 1] === '*') { var n = s.indexOf('*/', i); for (var k = i; k < (n < 0 ? s.length : n + 2); k++) if (s[k] !== '\n') a[k] = ' '; i = (n < 0 ? s.length : n + 1); continue; }
        if (c === "'" || c === '"' || c === '`') { 引 = c; a[i] = ' '; continue; }
    }
    return a.join('');
}
function 收js(dir, out) {
    fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).forEach(function (e) {
        var p = path.join(dir, e.name);
        if (e.isDirectory()) 收js(p, out);
        else if (/\.js$/.test(e.name)) out.push(p);
    });
    return out;
}

console.log('--- [A] 全仓棘轮：裸格子直写归零 ---');
(function () {
    var hits = [];
    收js('js', []).forEach(function (f) {
        var 文 = 掩码(src(f));
        // 病形＝把对象字面量直接写进背包槽（`= null` 清格子是合法写法，不在禁列）
        var rx = /(?:window\.)?inventory\.slots\s*\[[^\]]*\]\s*=\s*\{/g;
        var m;
        while ((m = rx.exec(文))) hits.push(f);
    });
    assert(hits.length === 0, 'A1 全仓 js/ 里 `inventory.slots[i] = {…}` 直写归零（实扫 ' + hits.length + ' 处' + (hits.length ? '：' + hits.join('、') : '') + '）——新代码再没有任何路径能产出病格子');
})();

console.log('--- [B] 四处的第二通道与诚实口径 ---');
(function () {
    var app = src('js/app.js');
    assert(/added = !!window\.addItem\(itemId, 1\);\n    \} else if \(window\.inventory && typeof window\.inventory\.addItem === 'function'\) \{\n        added = !!window\.inventory\.addItem\(itemId, 1\);/.test(app),
        'B1 buyFromCityShop：兜底改走 inventory.addItem 正式通道（不再手写 plain object）');
    assert(/got = Number\(window\.inventory\.addItem\(r\.item, count\)\) \|\| 0;\n                这一笔账 = window\.addItemFailReason \|\| null;/.test(app),
        'B2 采矿：第二通道照实报数、照抄原因账（DES-96 矿账口径不破）');
    assert(/没有正式入袋通道就如实按零收[\s\S]{0,120}got = 0;/.test(app),
        'B3 采矿：连第二通道都没有 → got=0，「没带走」话术兜底，不再谎报全额');
    assert(/两条正式通道都不存在时它是死路，按零收，下面的退款分支会把贡献原样退回[\s\S]{0,40}got = 0;/.test(app),
        'B4 贡献商店：手动搁货兜底铲除 → got=0，走既有退款分支（贡献退回＋退单账）');
    var es = src('js/enhanced-shop.js');
    assert(/added = !!window\.addItem\(realId, quantity\);\n        \} else if \(window\.inventory && typeof window\.inventory\.addItem === 'function'\) \{\n            added = !!window\.inventory\.addItem\(realId, quantity\);/.test(es),
        'B5 buyFromEnhancedShop：兜底改走正式通道；收不下不扣费口径未动');
    assert(es.indexOf("icon: item.icon || '📦'") < 0,
        'B6 那枚「有名字没模板」的死格子字面量（DES-63 同族）已不在');
})();

console.log('--- [C] 历史病格子的容忍层未被顺手拆掉 ---');
(function () {
    var inv = src('js/inventory.js');
    assert(/_slotRemoveCount/.test(inv), 'C1 wave122 的裸格子扣数回落（_slotRemoveCount）仍在——旧存档里的历史病格子还得能用');
    var iu = inv;
    assert(/getTemplate/.test(iu), 'C2 渲染链仍认 getTemplate（本批只断新增病源，不动读端兼容）');
})();

console.log('\nv24.2-bare-write-root：' + passed + ' 通过 / ' + failed + ' 失败');
process.exit(failed ? 1 : 0);
