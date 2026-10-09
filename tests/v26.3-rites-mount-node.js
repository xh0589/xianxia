// 第一百四十九批 · 挂载防摘：js/npcs/confession-rites.js 必须真的在加载序列里，且排在 npc-system.js 之后
//
// 为什么单独立一条：这一层写完时是「已完成且 109 断言全绿」，但既不在 仙侠.html 也不在
// scripts.manifest.json——上一批的实测是靠 fetch+eval 注入跑的，真实页面里玩家点不到任何一场仪。
// 109 条断言全绿 ≠ 功能上线。这类「写完没挂」的洞，node 沙箱测不出来（沙箱自己按顺序 eval），
// 只能对加载序列本身断言。本条就是防这个：谁把它摘掉、或者挪到 npc-system.js 前面，当场打红。
//
// 判据分两档：
//   A 段＝读码（仙侠.html / scripts.manifest.json 两条真源的字面形状与相对顺序）
//   B 段＝真源互校（HTML body 里的 script 序列必须与 manifest entries 逐项相等）
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

let 通过 = 0, 失败 = 0;
function ok(cond, msg) {
    if (cond) { 通过++; console.log('  ✓ ' + msg); }
    else { 失败++; console.log('  [FAIL] ' + msg); }
}
function load(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

const SCENE = 'js/npcs/confession-rites.js';
const HOST = 'js/npcs/npc-system.js';
const html = load('仙侠.html');
const htmlLines = html.split('\n');
const mf = JSON.parse(load('scripts.manifest.json'));
const entries = mf.entries;
const mfSrc = entries.filter(e => e.kind === 'script').map(e => e.src);

console.log('\n=== A 段 · 两条真源各自都得有这一行，且排在 npc-system.js 之后 ===');

// ---- A1 HTML ----
const htmlHit = [];
htmlLines.forEach((l, i) => { if (l.indexOf('src="' + SCENE + '"') >= 0) htmlHit.push(i); });
ok(htmlHit.length === 1, 'A1 仙侠.html 恰好 1 处加载 ' + SCENE + '（实得 ' + htmlHit.length + ' 处' + (htmlHit.length ? '，行 ' + htmlHit.map(n => n + 1).join(',') : '') + '）');

const htmlHitHost = [];
htmlLines.forEach((l, i) => { if (l.indexOf('src="' + HOST + '"') >= 0) htmlHitHost.push(i); });
ok(htmlHitHost.length === 1, 'A2 仙侠.html 里宿主 npc-system.js 恰好 1 处（实得 ' + htmlHitHost.length + '）');

if (htmlHit.length === 1 && htmlHitHost.length === 1) {
    ok(htmlHit[0] === htmlHitHost[0] + 1, 'A3 顺序：' + SCENE + ' 紧跟在 npc-system.js 下一行'
        + '（HTML ' + (htmlHitHost[0] + 1) + ' → ' + (htmlHit[0] + 1) + '）');
    ok(/^\s*<script defer src=/.test(htmlLines[htmlHit[0]]), 'A4 这一行是真实生效的 defer 标签（不是被注释掉的僵尸标签）：'
        + htmlLines[htmlHit[0]].trim().slice(0, 60));
} else {
    ok(false, 'A3/A4 跳过：宿主或场景层在 HTML 里的出现次数不是 1');
}

// ---- A5 manifest ----
const mfIdx = mfSrc.indexOf(SCENE);
const hostIdx = mfSrc.indexOf(HOST);
ok(mfIdx >= 0, 'A5 scripts.manifest.json 已登记 ' + SCENE + '（entries 下标 ' + mfIdx + '）');
ok(hostIdx >= 0, 'A6 scripts.manifest.json 里有宿主 ' + HOST + '（下标 ' + hostIdx + '）');
if (mfIdx >= 0 && hostIdx >= 0) {
    ok(mfIdx > hostIdx, 'A7 顺序：manifest 里场景层下标 ' + mfIdx + ' > npc-system.js 下标 ' + hostIdx);
    // 依赖语义复核：场景层读的是本体的三个真源，排在前面就会读空
    const npcSrc = load(HOST);
    ok(npcSrc.indexOf('var BOND_DAO_FINAL_CHAPTER') >= 0 && npcSrc.indexOf('window.BOND_DAO_FINAL_CHAPTER = BOND_DAO_FINAL_CHAPTER') >= 0,
        'A8 依赖真的存在：npc-system.js 里 BOND_DAO_FINAL_CHAPTER 既是私变量、又挂了 window 导出供场景层读');
    ok(npcSrc.indexOf('confess') >= 0, 'A9 宿主里有 confess 档（EMOTION_TYPES.confess），场景层的接缝挂在它身上');
}
ok(mfSrc.filter(s => s === SCENE).length === 1, 'A10 manifest 里没有重复登记（实得 ' + mfSrc.filter(s => s === SCENE).length + ' 次）');

// ---- A11 计数器不许腐化 ----
const realScripts = mfSrc.length;
ok(mf.stats.scripts === realScripts,
    'A11 manifest 的 stats.scripts 计数与 entries 实际条数相符（计数 ' + mf.stats.scripts + ' / 实得 ' + realScripts + '）——'
    + '计数不更新会让 check 打印过时的 script 数');
ok(realScripts === 351, 'A12 加载序列共 351 个 script（实得 ' + realScripts + '）');

console.log('\n=== B 段 · HTML body 的 script 序列必须与 manifest 逐项相等 ===');

const MARK_BEGIN = '<!-- SCRIPTS:BEGIN 加载序列唯一真源 scripts.manifest.json · 改清单后跑 tools/manifest-scripts.py gen -->';
const bodyStart = htmlLines.findIndex(l => l.indexOf(MARK_BEGIN) >= 0);
const bodyEnd = htmlLines.findIndex((l, i) => i > bodyStart && l.trim() === '<!-- SCRIPTS:END -->');
ok(bodyStart >= 0 && bodyEnd > bodyStart, 'B1 HTML 里有 manifest 的 SCRIPTS:BEGIN/END 区段标记（第 ' + (bodyStart + 1) + ' … ' + (bodyEnd + 1) + ' 行）');

const seg = htmlLines.slice(bodyStart + 1, bodyEnd);
const segScripts = [];
let 解析失败 = 0;
seg.forEach(l => {
    const s = l.trim();
    if (s.startsWith('<script')) {
        const m = /^<script defer src="([^"]+)"><\/script>(?:\s*<!--([\s\S]*?)-->)?\s*$/.exec(s);
        if (m) segScripts.push(m[1]); else 解析失败++;
    }
});
ok(解析失败 === 0, 'B2 区段内每一行 script 都符合生成器的规整格式（变体 ' + 解析失败 + ' 处）——格式漂移会让 gen/check 直接失灵');
ok(segScripts.length === realScripts, 'B3 区段 script 行数 ' + segScripts.length + ' == manifest 条数 ' + realScripts);
const 首个不同 = segScripts.findIndex((s, i) => s !== mfSrc[i]);
ok(首个不同 < 0, 'B4 逐项相等：HTML 区段 == manifest entries 重建'
    + (首个不同 < 0 ? '' : '（首个不一致在下标 ' + 首个不同 + '：HTML ' + segScripts[首个不同] + ' vs manifest ' + mfSrc[首个不同] + '）'));
ok(segScripts.indexOf(SCENE) > segScripts.indexOf(HOST),
    'B5 在 HTML 自己的序列里，场景层同样排在宿主之后（下标 ' + (segScripts.indexOf(SCENE)) + ' vs ' + (segScripts.indexOf(HOST)) + '）');

// ---- B6 marker 区段之外不许有漏网/重复的同一文件 ----
const 区段外 = htmlLines.slice(0, bodyStart).concat(htmlLines.slice(bodyEnd + 1));
const 区段外命中 = 区段外.filter(l => l.trim().startsWith('<script') && l.indexOf(SCENE) >= 0).length;
ok(区段外命中 === 0, 'B6 marker 区段之外没有第二个 ' + SCENE + ' 标签（实得 ' + 区段外命中 + ' 处）——load 顺序以区段为唯一真源');
const 僵尸 = 区段外.filter(l => l.trim().startsWith('<!--') && l.indexOf('src="' + SCENE + '"') >= 0);
ok(僵尸.length === 0, 'B7 没有被注释掉的僵尸标签（注释掉的标签＝永不加载，历史上 loot 链就是这么哑过）');

console.log('\n=== C 段 · 文件本体与窗口导出 ===');
const scene = load(SCENE);
ok(scene.length > 0, 'C1 ' + SCENE + ' 文件存在且可读（' + scene.length + ' 字符）');
// 场景层是 IIFE(function(global){…})(window)，导出写在 global.ConfessionRites 上，
// 但运行期 global 就是 window——两条写法都要认（否则这条断言会假红）
ok(/(?:window|global)\.ConfessionRites\s*=\s*\{/.test(scene),
    'C2 导出 window.ConfessionRites（挂上后不用 eval 注入就有它）');
let 语法通过 = true, 语法错 = '';
try { new (require('vm').Script)(scene, { filename: SCENE }); }
catch (e) { 语法通过 = false; 语法错 = e.message; }
ok(语法通过, 'C3 文件本体语法可解析（vm.Script）' + (语法通过 ? '' : '：' + 语法错));
ok(/showNPCDialog|overlay|push\(/.test(scene) && /function offer/.test(scene),
    'C4 有 offer 接缝与上屏渲染（真页面点「倾诉心意」要靠它们出戏）');

console.log('\n---------------------------------------');
console.log('  通过 ' + 通过 + ' / 失败 ' + 失败);
console.log('---------------------------------------');
process.exit(失败 > 0 ? 1 : 0);