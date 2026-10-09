// 第一百四十一批 · 空 catch 分诊棘轮
// 这套**不测功能**，只测一件东西：**盲区不许变大**。
//
// 背景：全仓 2108 处 `catch (…) { }`（账上原记 231 —— 错的，那只是 js/app.js 一本）。
// 每个空 catch 都是一个吞掉异常的口子：出了错没人知道、测试看不见、存档里看不出来。
// 265 套全绿对这一族**一点保证都没有**。本套把这一族量出来、点名入册、并锁死不许长。
//
// ⚠️ 本批**没有插任何桩**。一次性全量插桩试过并整体回滚了，理由见 [D] 段——那不是过时的决定。
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const SKIP = new Set(['node_modules', '.git', '.kilo', '.scratch', '.playwright-mcp']);

let 通过 = 0, 失败 = 0;
function ok(c, m) { if (c) { 通过++; console.log('  ✓ ' + m); } else { 失败++; console.log('  [FAIL] ' + m); } }
function load(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// 把注释与字符串字面量挖成同长度空格 ⇒ 下面的正则只会命中「真代码」，
// 不会把注释里写的「catch」和文案里的 catch 当数（第一版没挖，量出来虚高一截）。
function 掩码(src) {
  const a = src.split(''); let 引 = null;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (引) { if (c === '\\') { a[i] = ' '; a[i + 1] = ' '; i++; continue; } if (c === 引) 引 = null; a[i] = ' '; continue; }
    if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') a[i++] = ' '; i--; continue; }
    if (c === '/' && src[i + 1] === '*') { const n = src.indexOf('*/', i); for (let k = i; k < (n < 0 ? src.length : n + 2); k++) if (src[k] !== '\n') a[k] = ' '; i = (n < 0 ? src.length : n + 1); continue; }
    if (c === "'" || c === '"' || c === '`') { 引 = c; a[i] = ' '; continue; }
  }
  return a.join('');
}
function 收(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) 收(p, out);
    else if (/\.js$/.test(e.name)) out.push(p);
  }
  return out;
}
const 文件 = 收(path.join(ROOT, 'js'), []);

// 账务动作线索（A 档判据）——刻意窄：宁可漏判成 B 也不误判成 A
const 账 = [
  [/currency\.spiritStones\s*[-=]/, '灵石'], [/currency\.copper\s*[-=]/, '铜钱'],
  [/addItem\s*\(/, '发货'], [/removeItem\s*\(/, '取物'],
  [/setCurrentCharData/, '角色档'], [/save[A-Z]\w*\s*\(/, '存档'],
  [/advanceTime|advanceDay/, '时辰'], [/\.emit\s*\(/, '事件'],
  [/currentCharData\.[\w.]*\s*[-+*]?=/, '角色属性'],
];
// 能力探测（C 档判据）——这一族是**正确的兜底写法**，不是病灶，不许被当漏网之鱼
const 探测 = ['getElementById', 'querySelector', 'addEventListener', 'classList', 'style', 'dataset',
  'getContext', 'getBoundingClientRect', 'scrollIntoView', 'AudioContext', 'clipboard', 'matchMedia'];

function 点位() {
  const out = [];
  for (const f of 文件) {
    const rel = path.relative(ROOT, f).replace(/\\/g, '/');
    if (rel === 'js/inventory.js') continue;        // 说话手本体：它按契约就要 catch
    const src = fs.readFileSync(f, 'utf8');
    const mask = 掩码(src);
    const 行起 = []; for (let i = 0; i < src.length; i++) if (src[i] === '\n') 行起.push(i);
    const 行号 = p => { let lo = 0, hi = 行起.length; while (lo < hi) { const mid = (lo + hi) >> 1; if (行起[mid] < p) lo = mid + 1; else hi = mid; } return lo + 1; };
    const rx = /catch\s*\([^)]*\)\s*\{\s*\}/g; let m;
    while ((m = rx.exec(mask))) {
      const 前 = src.slice(Math.max(0, m.index - 420), m.index).replace(/\/\/[^\n]*/g, '');
      const 命账 = 账.some(([re]) => re.test(前));
      const 命探 = 探测.some(k => 前.includes(k));
      out.push({ 文件: rel, 行: 行号(m.index), 档: (命探 && !命账) ? 'C' : (命账 ? 'A' : 'B') });
    }
  }
  return out;
}

const P = 点位();
const 数 = { A: 0, B: 0, C: 0 };
P.forEach(p => 数[p.档]++);
const 总 = P.length;

// 基线 = 本尺**自己**量出来的数，不从别处借。
// ⚠️ 第一版去读 .scratch/empty-catch-baseline.json，那份是 fix-141-inventory.cjs 生成的，
// 而**那支脚本的 A 档判据多一道「有没有站点名」**（推不出名字的归 ? 档），本尺没有那道。
// 于是两把尺差 2 处，棘轮立刻假红。教训：**棘轮的基线必须由棘轮自己钉**，
// 借别人的数当基线，两把尺只要判据有一丝不同就会互相咬。
// 现读基线（2026-09-27 17:05 钉）：A=288 B=1642 C=114 总=2108
const 基线 = { 总: 2108, A: 288, B: 1642, C: 114 };

console.log('\n========== 第一百四十一批套件（空 catch 盲区棘轮） ==========');

// [A] 总数棘轮：只许减不许增
console.log('\n[A] 盲区总数棘轮');
ok(总 <= 基线.总, 'A1 真空 catch 现读 ' + 总 + ' 处，门槛 ≤ ' + 基线.总
  + '（开案 2125，本批只是量准、没插桩，所以应当持平或更少）');
// ⚠️ A2／A3 第一版写死了「暴跌门槛 5 处」与「绝对下限 2000」。
// 那两条**把尺自己绊住了**：任何一次真的插桩修掉二十处，A2／A3 当场双红。
// 尺的「反向门」要抓的是**尺坏了**（读数归零／腰斩），不是**病灶少了**。
// 现在改成：暴跌＝低于基线一半（腰斩才算坏）；绝对下限 500（远低于现读，够抓恒 0，够不着正常进展）。
ok(总 >= 基线.总 * 0.5, 'A2 读数没有腰斩（现读 ' + 总 + ' vs 基线 ' + 基线.总
  + '）：若突然少一半以上，多半是掩码函数坏了、把这套尺弄瞎了，不是病灶没了。'
  + '⚠️ 正常的逐批插桩**不触发**这条');
ok(P.length > 500, 'A3 尺本身是活的：能扫出 ' + P.length + ' 处（门槛 >500，'
  + '只抓「尺被改坏成恒 0」；上一版写死 2000，把尺自己绊住了——真修掉二十处就双红）');

// [B] A 档棘轮：吞了账的那一族只许减
console.log('\n[B] A 档（疑似吞了灵石／发货／存档／时辰／事件／角色属性）棘轮');
ok(数.A <= 基线.A, 'B1 A 档现读 ' + 数.A + ' 处，门槛 ≤ ' + 基线.A + '（入册在 计划/v141_空catch分诊定案.md）');
ok(数.A >= 100, 'B2 A 档读数没有腰斩（现读 ' + 数.A + '，门槛 ≥100，基线 ' + 基线.A
  + '）：尺坏了会掉到这个数以下；逐批插桩修掉几处**不触发**这条');
const A档按文件 = {};
P.filter(p => p.档 === 'A').forEach(p => { A档按文件[p.文件] = (A档按文件[p.文件] || 0) + 1; });
const A档前三 = Object.entries(A档按文件).sort((a, b) => b[1] - a[1]).slice(0, 5);
ok(A档前三.length > 0, 'B3 A 档点名到文件级，最集中的 5 本：'
  + A档前三.map(x => x[0].replace('js/', '') + '(' + x[1] + ')').join('、'));

// [C] C 档豁免：能力探测是**正确写法**，不许为了刷绿去动它
console.log('\n[C] C 档豁免（这一族是正确兜底，不是病灶）');
ok(数.C >= 100, 'C1 能力探测型空 catch 现读 ' + 数.C + ' 处（门槛 ≥100）：'
  + '它们是 `getElementById` 之类本来就可能不存在的探测，**刻意留空**。'
  + '若有人把这类也插桩刷指标，数字会好看，但那是拿噪声换数字——钉在这里挡住');
ok(数.C <= 基线.C, 'C2 C 档现读 ' + 数.C + ' 处 ≤ ' + 基线.C + '（不许有人把 C 档也批量改掉）');

// [D] 反向自证：这把尺能不能看见「有人偷偷加了新空 catch」
console.log('\n[D] 改前复现（同一把尺必须报得出增加）');
{
  // 在沙箱副本上加一处新的空 catch，尺应当多报 1
  const 样本 = 'js/battle.js';
  const 原 = load(样本);
  const 加了 = 原.replace(/\nfunction /, '\nfunction __w141_probe__() { try { null.x; } catch (e) {} }\nfunction ');
  ok(加了 !== 原, 'D1 探针注入成功（样本 ' + 样本 + '，加了一处 `try { null.x; } catch (e) {}`）');
  const 增量 = (() => {
    const mask = 掩码(加了);
    const n = (mask.match(/catch\s*\([^)]*\)\s*\{\s*\}/g) || []).length;
    return n - (掩码(原).match(/catch\s*\([^)]*\)\s*\{\s*\}/g) || []).length;
  })();
  ok(增量 === 1, 'D2 同一把尺在加了一处空 catch 后多报 ' + 增量 + ' 处（期望 1）'
    + '——证明 A1 的「只许减」是量出来的，不是放宽出来的');
  // ⛔ 全程只碰内存里的字符串，没写任何文件
  ok(load(样本) === 原, 'D3 真实工作树 byte-exact 未被污染（' + 样本 + '）');
}

// [E] 说话手本体豁免
console.log('\n[E] 豁免项不许被误伤');
{
  const inv = 掩码(load('js/inventory.js'));
  const n = (inv.match(/catch\s*\([^)]*\)\s*\{\s*\}/g) || []).length;
  ok(true, 'E1 js/inventory.js 里真空 catch ' + n + ' 处，本套**不计它的账**'
    + '（它是四支说话手本体，按契约就要 catch；把它算进盲区就是尺坏了）');
  ok(!P.some(p => p.文件 === 'js/inventory.js'), 'E2 确认清单里一处 js/inventory.js 都没有');
}

// [F] 留痕进度棘轮：这一族的修法是「逐点判决，只给确凿的加留痕」
// 所以留痕数要**只增不减**，而真空 catch 数只减不增——两者必须同时成立，否则就是有人在刷数字。
console.log('\n[F] 留痕进度棘轮（只增不减）');
{
  const 留痕 = /\[静默失败\]/;
  let 标 = 0, 坏名 = 0, 无回退 = 0, 涉账 = new Set();
  for (const f of 文件) {
    const rel = path.relative(ROOT, f).replace(/\\/g, '/');
    const src = fs.readFileSync(f, 'utf8');
    src.split(/\r?\n/).forEach((l, i) => {
      if (!留痕.test(l)) return;
      标++;
      if (/\[静默失败\][^\n]*·\s*undefined/.test(l)) 坏名++;
      // ⚠️ 这条尺改过两版，两版都是我的尺自己错、不是那几行错：
      //   第一版 `/&&[\w$]+\s*&&\s*[\w$]+\.message/` —— 第一个 `&&` 后漏了 `\s*`，20 条全判不合规。
      //   第二版只认 `e && e && e.message` 这一形 —— 可另一支代理写的是 `e && e.message`（两段式，
      //   同样挡住了 null/undefined），被判「不合规」3 条。
      // 尺该钉的是**意图**（错误信息有没有被带上），不是**写法**。现在只要求：
      // 带上了 `.message`，且前面至少有一道 `&&` 空值守卫。
      if (!/&&\s*[\w$]*\s*&&\s*[\w$]*\s*\.\s*message/.test(l) && !/&&\s*[\w$]+\s*\.\s*message/.test(l)) 无回退++;
      涉账.add(rel);
    });
  }
  ok(标 >= 20, 'F1 已留痕 ' + 标 + ' 处，门槛 ≥20（第一百四十二批工单2 的 20 处判据确凿，已逐条落名）');
  ok(标 <= P.length, 'F2 留痕数 ' + 标 + ' ≤ 真空 catch 现读 ' + P.length
    + '：留痕不可能比病灶还多，多了就是有人在注释里刷标记');
  ok(坏名 === 0, 'F3 留痕里没有把站点名写成 undefined 的（实测 ' + 坏名 + ' 处）'
    + '——上一批插了 166 条 `· undefined`，那是一行什么也没说的日志');
  ok(无回退 === 0, 'F4 每条留痕都带上了错误信息且有 `&&` 空值守卫（实测不合规 ' + 无回退 + ' 处）'
    + '：不留错误信息等于没留；`e && e && e.message` 与 `e && e.message` 两形都认——尺钉意图不钉写法');
  ok(涉账.size > 0, 'F5 留痕落在 ' + 涉账.size + ' 本文件上：'
    + [...涉账].slice(0, 6).map(x => x.replace('js/', '')).join('、'));
}

console.log('\n通过：' + 通过 + '　失败：' + 失败);
process.exitCode = 失败 ? 1 : 0;
