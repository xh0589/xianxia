// 逐套权威跑数（从 .scratch 挪到 tools/验收/ 后改过路径）
// 判红口径（照 wave138 第 7 条）：只认「退出码非 0」或「零输出」或「最后一条小结行里有失败数」三者之一。
// ⚠️ 不把断言文案里的数字当成失败数——wave138 第一版就是那样把 6 套误判成红的。
// 用法：node tools\验收\run-each.cjs
const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

// ⚠️ 这份脚本从 `.scratch/` 挪到 `tools/验收/` 后，`path.resolve(__dirname, '..')`
// 指向的是 `tools/`，不是仓根 ⇒ 第一次跑就 ENOENT `tools\tests`。
// 现在按「往上两级到仓根」定位，并兜底认一下 tests/ 在不在，别再靠猜。
const ROOT = fs.existsSync(path.join(__dirname, '..', '..', 'tests'))
  ? path.resolve(__dirname, '..', '..')
  : path.resolve(__dirname, '..');
const TESTS = path.join(ROOT, 'tests');
if (!fs.existsSync(TESTS)) {
  console.error('找不到 tests/ —— ROOT 猜错了：' + ROOT);
  process.exit(2);
}

function 列套件() {
  return fs.readdirSync(TESTS)
    .filter(n => /-node\.js$/.test(n))
    .sort();
}

const 名 = 列套件();
console.log('套件数 = ' + 名.length);

const 红 = [], 崩 = [], 空 = [];
let 合计通过 = 0;
for (let i = 0; i < 名.length; i++) {
  const r = spawnSync(process.execPath, [path.join(TESTS, 名[i])], {
    cwd: ROOT, encoding: 'utf8', timeout: 180000, maxBuffer: 64 * 1024 * 1024,
  });
  const out = (r.stdout || '') + (r.stderr || '');
  const 行 = out.split(/\r?\n/).filter(x => x.trim());
  const 末 = 行.length ? 行[行.length - 1] : '';
  const 崩了 = r.status === null || (r.stderr || '').includes('Error:') || (r.stderr || '').includes('ReferenceError');
  const 零输出 = 行.length === 0;

  if (零输出) 空.push(名[i]);
  if (r.status !== 0) {
    if (崩了) 崩.push(名[i] + ' :: ' + 末.slice(0, 160));
    else 红.push(名[i] + ' :: ' + 末.slice(0, 160));
  }
  // 累计「通过：N」型小结，便于与历史读数对账
  const m = 末.match(/通过[：:]\s*(\d+)/);
  if (m) 合计通过 += Number(m[1]);

  process.stdout.write((r.status === 0 && !零输出) ? '.' : 'X');
}
process.stdout.write('\n\n');

console.log('ran ' + 名.length + ' suites, ' + (红.length + 崩.length) + ' red'
  + ' (crash ' + 崩.length + ', empty ' + 空.length + ')');
console.log('合计「通过：N」型小结 = ' + 合计通过 + '（⚠️ 逐套计数，regression-node 随机抖动，见 FIX_NOTES 登记）');
if (红.length) { console.log('\n--- 红 ---'); 红.forEach(x => console.log('  ' + x)); }
if (崩.length) { console.log('\n--- 崩 ---'); 崩.forEach(x => console.log('  ' + x)); }
if (空.length) { console.log('\n--- 零输出 ---'); 空.forEach(x => console.log('  ' + x)); }
process.exit(红.length + 崩.length + 空.length ? 1 : 0);
