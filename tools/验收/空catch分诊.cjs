// 第一百四十一批 · 空 catch 分诊表生成器
// 目标：把 2131 处 catch(…){} 按「吞掉的是不是关键账」分成三档，并把清单切成分包
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const SKIP = new Set(['node_modules', '.git', '.kilo', '.scratch', 'html-0bd3fb25-source (1)']);
const files = [];
(function w(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) w(p);
    else if (/\.js$/.test(e.name)) files.push(p);
  }
})(path.join(ROOT, 'js'));

// 关键账的关键词——出现在 catch 前 3 行内，就说明这个 catch 可能吞掉一次状态变更
const 关键账 = [
  'currency', 'spiritStones', 'copper', 'gold', 'addItem', 'removeItem', 'setCurrentCharData',
  'tempering', 'reputation', 'quest', 'advanceTime', 'advanceDay', 'energy', 'hp', 'mp',
  'setItem', 'delete ', 'localStorage', 'save', 'commit', 'assign', ' = ', '+=', '-=',
];
const 无害 = [
  'getElementById', 'querySelector', 'addEventListener', 'classList', 'style', 'dataset',
  'getContext', 'AudioContext', 'canvas', 'fetch', 'getBoundingClientRect', 'scrollIntoView',
  'EventBus', 'emit', 'dispatchEvent', 'CustomEvent', 'clipboard', 'matchMedia', 'resize',
];

// 取 catch 之前 6 行做上下文（判断这个 try 在干什么）
const 点位 = [];
for (const f of files) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  const src = fs.readFileSync(f, 'utf8');
  const lines = src.split(/\r?\n/);
  lines.forEach((line, i) => {
    if (!/catch\s*\([^)]*\)\s*\{\s*\}/.test(line)) return;
    const 起 = Math.max(0, i - 6);
    const 前文 = lines.slice(起, i).join('\n');
    const 有 = (arr) => arr.filter(k => 前文.includes(k));
    const 命关键 = 有(关键账);
    const 命无害 = 有(无害);
    点位.push({
      文件: rel, 行: i + 1,
      判: 命关键.length && !命无害.length ? 'A' : (命无害.length && !命关键.length ? 'C' : 'B'),
      关键线索: 命关键.slice(0, 4), 无害线索: 命无害.slice(0, 3),
      try体: 前文.split('\n').slice(-3).map(s => s.trim()).join(' ⏎ ').slice(0, 170),
    });
  });
}

const 计 = { A: 0, B: 0, C: 0 };
点位.forEach(p => 计[p.判]++);
console.log('空 catch 总数 = ' + 点位.length);
console.log('  A（疑似吞掉关键账，前文只命中关键线索）= ' + 计.A);
console.log('  B（两边都命中／看不出，得多看一眼）        = ' + 计.B);
console.log('  C（前文只命中无害线索，多半是能力探测）  = ' + 计.C);
console.log('涉及文件数 = ' + new Set(点位.map(p => p.文件)).size);

fs.writeFileSync(path.join(__dirname, 'empty-catch-all.json'), JSON.stringify(点位, null, 1), 'utf8');

// 按「A 类数量」降序排列文件，便于切分包时每个包都均衡
const byFile = new Map();
for (const p of 点位) {
  if (!byFile.has(p.文件)) byFile.set(p.文件, { A: 0, B: 0, C: 0, n: 0 });
  byFile.get(p.文件)[p.判]++; byFile.get(p.文件).n++;
}
const 表 = [...byFile.entries()].sort((x, y) => (y[1].A - x[1].A) || (y[1].n - x[1].n));
console.log('\n=== A 类最多的 20 本 ===');
表.slice(0, 20).forEach(([f, c]) => console.log('  A=' + String(c.A).padStart(3) + ' B=' + String(c.B).padStart(3) + ' C=' + String(c.C).padStart(3) + '  ' + f));

// 切成 6 个包，按 A 类数量贪心分摊（每包一个代理）
// ⚠️ 计数必须先初始化：上一版忘了给 A 兜底 0，`undefined < undefined` 恒 false，195 本全砸进了包1
const 包 = [];
for (let i = 0; i < 6; i++) 包.push({ A: 0, 文件: [] });
for (const [f, c] of 表) {
  let 最轻 = 0;
  for (let i = 1; i < 6; i++) if (包[i].A < 包[最轻].A) 最轻 = i;
  包[最轻].文件.push({ f, ...c });
  包[最轻].A += c.A;
}
console.log('\n=== 6 个包的分摊（A 类均衡） ===');
包.forEach((b, i) => {
  const n = b.文件.reduce((s, x) => s + x.n, 0);
  const bb = b.文件.reduce((s, x) => s + x.B, 0), cc = b.文件.reduce((s, x) => s + x.C, 0);
  console.log('  包' + (i + 1) + '：' + b.文件.length + ' 本文件、' + n + ' 处（A=' + b.A + ' B=' + bb + ' C=' + cc + '）');
  const 名集 = new Set(b.文件.map(x => x.f));
  fs.writeFileSync(path.join(__dirname, 'empty-catch-pack' + (i + 1) + '.json'),
    JSON.stringify(点位.filter(p => 名集.has(p.文件)), null, 1), 'utf8');
});
console.log('\n已写 .scratch/empty-catch-all.json 与 empty-catch-pack1..6.json');
