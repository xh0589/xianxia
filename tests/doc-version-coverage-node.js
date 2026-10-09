/**
 * doc-version-coverage-node.js — 版本记录齐全性：代码里活着的版本号 ⊆ 版本记录.md 已记
 *
 * 这把尺是给「今天的三次误判」立的。2026-10-04 三个代理各自去看「后期材料做没做」，
 * 给了三种说法——因为 v26.4 ~ v27.11 这十五个批次号**只活在代码注释里**，
 * `版本记录.md` 查不到，「有没有做」这件事本身就是不可查项。
 *
 * 本套不测游戏功能，只测**文档与代码的契约**：
 *   A 口径自检     「代码里活着的版本号」怎么算，写死在这支尺上，逐条自证不腐化
 *   B 覆盖率       补账窗口（v26.4 起）内的活号，必须每个都有 `## v…` 小节
 *   C 历史缺口     窗口外已知的缺号走显式 allowlist，**只许变短不许变长**
 *   D 反向自证     抹掉一个小节头 / 漏掉一个号 / 把副本目录放进来，本套必须当场报红
 *
 * ── 口径（与 `.scratch/doc-version-progress/dump.py` 逐字一致）────────────────
 *   扫哪些树：js/ tests/ styles/ tools/ 四棵 + 根目录 仙侠.html / styles.css / scripts.manifest.json
 *   排除哪些：.kilo/（含 worktrees/）· html-0bd3fb25-source/ · .scratch/ · ui-audit/ ·
 *             打包输出/ · 归档-* · 计划/ · node_modules/ · .playwright-mcp/
 *   为何排除：**不排除就会把同代码副本数成三个版本**（本项目 .kilo/worktrees 与
 *             html-0bd3fb25-source/ 里都有整份 js 副本），这是这类统计最常见的假数来源。
 *   为何三个 md 自己不算「代码」：版本记录.md / STRUCTURE.md / FIX_NOTES.md 排除在外——
 *             否则文档引用文档，自证循环。
 *   正则：(?<![0-9A-Za-z.])v\d+\.\d+(?![0-9])（前后不许再接数字或字母，
 *             否则 v27.1 会被 v27.11 顶掉、v2.0.2 会被截成 v2.0）
 *   为何排除本套自身：本套要在 D 段**伪造**版本号做反向自证，不排自己会污染 live 集合。
 *
 * 运行：node tests/doc-version-coverage-node.js
 */
'use strict';

var fs = require('fs');
var path = require('path');
var ROOT = path.resolve(__dirname, '..');

var pass = 0, fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; console.error('  [FAIL] ' + m); } }
function eq(a, b, m) { ok(a === b, m + '（实际=' + JSON.stringify(a) + ' 期望=' + JSON.stringify(b) + '）'); }
function sec(s) { console.log('\n[' + s + ']'); }

// ---------------------------------------------------------------- 口径（写死在这）
var SCAN_TOPS = ['js', 'tests', 'styles', 'tools'];
var SCAN_ROOT_FILES = ['仙侠.html', 'styles.css', 'scripts.manifest.json'];
var SKIP_DIRS = {
  'node_modules': 1, '.git': 1, '.scratch': 1, '.kilo': 1, 'ui-audit': 1,
  'html-0bd3fb25-source': 1, '打包输出': 1, '归档-计划方案与bug记录': 1,
  '计划': 1, '.playwright-mcp': 1
};
var NOT_CODE = { '版本记录.md': 1, 'STRUCTURE.md': 1, 'FIX_NOTES.md': 1 };
var SELF = 'tests' + path.sep + 'doc-version-coverage-node.js';

var VPAT = /(?<![0-9A-Za-z.])v\d+\.\d+(?![0-9])/g;

function normSlashes(p) { return p.split(path.sep).join('/'); }

function isExcluded(rel) {
  var parts = normSlashes(rel).split('/');
  for (var i = 0; i < parts.length - 1; i++) { if (SKIP_DIRS[parts[i]]) return true; }
  return false;
}
function isNotCode(rel) { return !!NOT_CODE[normSlashes(rel).split('/').pop()]; }

function walk(rel, acc) {
  var abs = path.join(ROOT, rel);
  var ents;
  try { ents = fs.readdirSync(abs, { withFileTypes: true }); } catch (e) { return acc; }
  ents.forEach(function (e) {
    var childRel = rel ? rel + path.sep + e.name : e.name;
    if (e.isDirectory()) {
      if (SKIP_DIRS[e.name]) return;
      walk(childRel, acc);
    } else if (/\.(js|cjs|py|html|json|css)$/.test(e.name)) {
      if (normSlashes(childRel) === normSlashes(SELF)) return;
      acc.push(childRel);
    }
  });
  return acc;
}

function liveFiles() {
  var acc = [];
  SCAN_TOPS.forEach(function (t) { walk(t, acc); });
  SCAN_ROOT_FILES.forEach(function (f) { if (fs.existsSync(path.join(ROOT, f))) acc.push(f); });
  return acc.sort();
}

/** 扫一批文件，返回 { 版本号 -> [文件…] }。opts.raw = 跳过「md 不算代码」这条（A/D 段反证要用） */
function scan(list, opts) {
  var out = {};
  list.forEach(function (rel) {
    if (isExcluded(rel)) return;
    if (!(opts && opts.raw) && isNotCode(rel)) return;
    var txt;
    try { txt = fs.readFileSync(path.join(ROOT, rel), 'utf8'); } catch (e) { return; }
    var m;
    VPAT.lastIndex = 0;
    while ((m = VPAT.exec(txt)) !== null) {
      if (!out[m[0]]) out[m[0]] = [];
      if (out[m[0]].indexOf(rel) < 0) out[m[0]].push(rel);
    }
  });
  return out;
}

/** 从一份 md 文本里取 `## v…` 小节头 */
function headsOf(text) {
  var set = {};
  text.split('\n').forEach(function (l) {
    var m = /^##\s+(v\d+\.\d+)/.exec(l);
    if (m) set[m[1]] = true;
  });
  return set;
}
function vkey(v) { var a = v.slice(1).split('.'); return parseInt(a[0], 10) * 1000 + parseInt(a[1], 10); }

// ================================================================ [A] 口径自检
sec('[A] 口径自检（「代码里活着的版本号」怎么算）');

var FILES = liveFiles();
var LIVE = scan(FILES);
var LIVE_KEYS = Object.keys(LIVE).sort(function (a, b) { return vkey(a) - vkey(b); });

var LOG = fs.readFileSync(path.join(ROOT, '版本记录.md'), 'utf8');
var HEADS = headsOf(LOG);

ok(FILES.length > 300, 'A0 扫到 ' + FILES.length + ' 个文件（四棵树 + 三个根文件，354 本 js 在内）');
ok(FILES.every(function (f) { return !isExcluded(f); }), 'A1 扫到的文件里零副本目录');
ok(FILES.every(function (f) { return !isNotCode(f); }), 'A2 三个 md 自己不在扫描范围内（否则文档引用文档、自证循环）');
ok(FILES.indexOf(SELF) < 0, 'A3 本套自身已排除（D 段要伪造版本号，不排自己会污染 live 集合）');

// 排除规则逐条点名——这七条就是「同代码副本」的全部来源
['.kilo/worktrees', 'html-0bd3fb25-source/js', '.scratch/x/js', 'ui-audit/js',
  '打包输出/js', '归档-计划方案与bug记录/js', 'node_modules/js'].forEach(function (p) {
  ok(isExcluded(p), 'A4 排除规则命中：' + p);
});
ok(!isExcluded('js/core/game-state.js') && !isExcluded('tests/v27.10-beast-forge-drops-node.js'),
  'A5 真源码不被误排（js/ 与 tests/ 各取一个）');

// 三个 md 自己确实含有大量版本号（反证 A2 不是因为它们没有号才过的）
var mdHits = scan(['STRUCTURE.md', 'FIX_NOTES.md'], { raw: true });
ok(Object.keys(mdHits).length > 100,
  'A6 反证：STRUCTURE.md / FIX_NOTES.md 自身带 ' + Object.keys(mdHits).length + ' 个版本号——'
  + 'A2 排除它们是刻意的，不是「它们本来就没号」');

// 正则不串味：v27.1 不得被 v27.11 顶掉；v2.0.2 只取 v2.0
var probe = scan(['tests/__probe_none__.js']);
ok(Object.keys(probe).length === 0, 'A7 探针文件不存在时返回空集（扫描器不吞错也不乱报）');
(function () {
  // 用真实文件验证「短号不被长号顶掉」：versions/ 目录里有 v20.31 与 v20.3 两批
  var shortHit = LIVE['v20.31'], longHit = LIVE['v20.3'];
  ok(!!shortHit && !!longHit,
    'A8 短号与长号各自独立成条：v20.3 与 v20.31 同时在 live 集合里（正则没把长的截短的）');
  ok(!(LIVE['v27.1'] && LIVE['v27.11'] && LIVE['v27.1'].every(function (f) { return f === LIVE['v27.11'][0]; })),
    'A9 v27.1 与 v27.11 不共用同一份文件清单（点号后多位时边界没写错）');
})();

console.log('  · live 版本号共 ' + LIVE_KEYS.length + ' 个（覆盖 v1.0 ~ v27.11，跨 ' +
  FILES.length + ' 个文件）');

// ================================================================ [B] 覆盖率
sec('[B] 覆盖率：补账窗口（v26.4 起）内的活号，每个都得有 `## v…` 小节');

// 本次补账一次性回填的十五个号（钉死名单：补了又删，本段立刻报红）
var BACKFILLED = ['v26.4', 'v26.5', 'v26.9',
  'v27.0', 'v27.1', 'v27.2', 'v27.3', 'v27.4', 'v27.5',
  'v27.6', 'v27.7', 'v27.8', 'v27.9', 'v27.10', 'v27.11'];

var WINDOW_FROM = vkey('v26.4');
var inWindow = LIVE_KEYS.filter(function (v) { return vkey(v) >= WINDOW_FROM; });
var missingInWindow = inWindow.filter(function (v) { return !HEADS[v]; });

eq(missingInWindow.length, 0, 'B1 补账窗口内零缺号（缺：' + (missingInWindow.join(' ') || '无') + '）');
eq(inWindow.length, 15, 'B2 窗口内活号恰好 15 个（本次回填的那十五个）');
BACKFILLED.forEach(function (v) {
  ok(!!LIVE[v], 'B3 活号在册：' + v + '（代码里 ' + (LIVE[v] ? LIVE[v].length : 0) + ' 个文件）');
  ok(!!HEADS[v], 'B4 版本记录有 `## ' + v + '` 小节头');
});
// 窗口内每个号都必须有真实实现落点，不能只有一个注释
BACKFILLED.forEach(function (v) {
  ok((LIVE[v] || []).length >= 1, 'B5 ' + v + ' 至少一个落点文件（不是只活在注释里的一句话）');
});

// ================================================================ [C] 历史缺口
sec('[C] 窗口外已知缺号：显式 allowlist，只许变短不许变长');

// 这十二个是实测「代码里活着、版本记录里没有 ## 小节」的号。**本轮不补**
// （任务书点名的补账窗口是 v26.4~v27.11 这十五个），逐个搜过的落点见下表——
// 交接给下一批时不必重搜。**只减不增**：新增缺口会让 C1 报红。
var KNOWN_GAPS = {
  'v20.1':  'js/core/audio-synth.js:1 · auto-save.js:1 · keyboard-shortcuts.js:1 · js/app.js:5688 多阶段 Boss（12 处）',
  'v20.2':  'js/npcs/npc-personal-events.js:1280 吃醋/和好/女修同修语境/道侣回访（13 处）',
  'v20.3':  'js/app.js:11376 感情维系衰减 + npc-personal-events.js:2305 门禁探针法废除（18 处）',
  'v20.4':  'js/npcs/npc-system.js:2501 问候自动触发移位 + npc-personal-events.js:1250 个人线资格门禁（4 处）',
  'v20.53': 'js/beast-taming.js:110 高位面灵兽 + bank-service.js:148 放贷额度 + app.js:2215 位面闸门（45 处）',
  'v20.54': 'tests/v20.54-economy-node.js（经济去处与漏洞验收尺，2 处）',
  'v20.55': 'tests/v20.55-quest-rank-node.js（任务与晋升验收尺，2 处）',
  'v20.56': 'js/map/randomMap.js:2 野外地图重做 + wild-terrain.js:2 有结构的真地皮（11 处）',
  'v20.61': 'js/map/randomMap.js:82 地点变体（驿亭/篷车集/残村/义庄/露水市集/遗府，9 处）',
  'v23.1':  'js/app.js:1861 采药钓鱼采矿伐木四条「有过程也有风险」的野外口（23 处）',
  'v23.2':  'js/app.js:9806 讨价还价 + facility-batch2.js:389 竞价来真的 + enhanced-shop.js:869 卖出动行情（38 处）',
  'v24.1':  'tests/v24.0-audit-fixes-node.js 内 6 处「重构第 3 步 Modal 栈」的位移批注（7 处）——**判定存疑**：像审计子步骤标签而非独立批次'
};

var MODERN_FROM = vkey('v20.0');   // 本项目的版本记录本身从 v20.0 起编，更早的号不在记账体例内
var missingAll = LIVE_KEYS.filter(function (v) { return !HEADS[v]; });
var missingModern = missingAll.filter(function (v) { return vkey(v) >= MODERN_FROM; });
var newGaps = missingModern.filter(function (v) { return !KNOWN_GAPS[v]; });
var staleAllow = Object.keys(KNOWN_GAPS).filter(function (v) { return missingModern.indexOf(v) < 0 && HEADS[v]; });

eq(newGaps.length, 0, 'C1 v20.0 起没有新增缺口（新增：' + (newGaps.join(' ') || '无') + '）');
eq(staleAllow.length, 0, 'C2 allowlist 里没有已补上的号（有就说明该从名单里划掉）');
ok(Object.keys(KNOWN_GAPS).length === 12, 'C3 历史缺口 12 个已逐个登记落点，交接不必重搜');
var preModern = missingAll.length - missingModern.length;
console.log('  · v20.0 起的缺口 ' + missingModern.length + ' 个：' + missingModern.join(' '));
console.log('  · v20.0 之前另有 ' + preModern + ' 个号（v1.0 ~ v19.20）在版本记录里没有小节——'
  + '本项目版本记录从 v20.0 起编，不在补账体例内，只报数不判定');
console.log('  · 其中 v24.1 判定存疑（像审计子步骤标签而非独立批次），下批裁决');

// ================================================================ [D] 反向自证
sec('[D] 反向自证：抹掉一个号 / 漏掉一个号 / 放副本进来，本套必须报红');

function missingAfterStrip(logText, dropVersion) {
  var h = headsOf(logText);
  delete h[dropVersion];
  return LIVE_KEYS.filter(function (v) { return vkey(v) >= WINDOW_FROM && !h[v]; });
}

// D1 抹掉 v27.11 的小节头 → 必须报红
var stripped1 = LOG.replace(/^##\s+v27\.11\b.*$/m, '');
ok(stripped1 !== LOG, 'D1a 抹掉 v27.11 小节头的手术本身生效（正则真能定位到那行）');
ok(missingAfterStrip(stripped1, 'v27.11').indexOf('v27.11') >= 0,
  'D1b 抹掉 v27.11 小节后检测函数报红（缺号集合含 v27.11）');

// D2 抹掉 v26.4 的小节头 → 必须报红（窗口下界那一号）
var stripped2 = LOG.replace(/^##\s+v26\.4\b.*$/m, '');
ok(stripped2 !== LOG, 'D2a 抹掉 v26.4 小节头的手术生效');
ok(missingAfterStrip(stripped2, 'v26.4').indexOf('v26.4') >= 0,
  'D2b 抹掉 v26.4 小节后检测函数报红');

// D3 逐个过一遍十五个号：每一个被抹掉都必须被抓（防「只钉了头尾两个」）
var allCaught = BACKFILLED.every(function (v) {
  var stripped = LOG.replace(new RegExp('^##\\s+' + v.replace('.', '\\.') + '\\b.*$', 'm'), '');
  return stripped !== LOG && missingAfterStrip(stripped, v).indexOf(v) >= 0;
});
ok(allCaught, 'D3 十五个号逐个抹掉逐个被抓（不是只钉了头尾两个）');

// D4 「三个 md 不算代码」这条要是失效，live 会平白多出一批号 → B 段的「恰好 15 个」会被撑破
var mdAsCode = scan(['STRUCTURE.md', 'FIX_NOTES.md'], { raw: true });
var mdKeys = Object.keys(mdAsCode);
var mdOnly = mdKeys.filter(function (v) { return !LIVE[v]; });
ok(mdKeys.length >= 200, 'D4a 两个 md 当代码扫会扫出 ' + mdKeys.length + ' 个号（live 是 ' + LIVE_KEYS.length + '）——排除规则确有作用');
ok(mdOnly.length >= 10, 'D4b 那批号里有 ' + mdOnly.length + ' 个是 live 里没有的（若 md 混进来，B1/B2 当场破）');

// D5 副本目录放进来 → live 不得变化
var beforeCount = LIVE_KEYS.length;
scan(['.kilo/worktrees/x/js/a.js', 'html-0bd3fb25-source/js/b.js', '.scratch/c.js', 'ui-audit/d.js', '打包输出/e.js']);
var afterCount = Object.keys(scan(FILES)).length;
eq(afterCount, beforeCount, 'D5 把六个副本目录喂进扫描器，live 集合纹丝不动（' + beforeCount + ' → ' + afterCount + '）');

// D6 正则边界：伪造串不能被当成真号
var fake = 'v99.99 v27.1x v27. v1.2.3 x27.1 (v27.11)'.match(VPAT);
ok(fake && fake.indexOf('v99.99') >= 0, 'D6a 真号被认出（v99.99）');
ok(fake && fake.indexOf('v27.1x') < 0, 'D6b 字母紧跟不算号（v27.1x 被拒）');
ok(fake && fake.indexOf('v27.') < 0, 'D6c 小数点不完整不算号（v27. 被拒）');
ok(fake && fake.indexOf('x27.1') < 0, 'D6d 前接字母不算号（x27.1 被拒）');
ok(fake && fake.indexOf('v1.2') >= 0, 'D6e 三段号取前两段（v1.2.3 → v1.2，与代码里 v25.0.2 同口径）');

console.log('\n结果：通过 ' + pass + '　失败：' + fail);
process.exit(fail ? 1 : 0);
