// 第一百四十二批 · A 档 288 处 · 切 4 份工单（每份约 70 处）
// 上一批的教训直接写在这里，因为这一批还会踩：
//   ① 机械插桩不许干 —— 上一批一次性插 1930 处、动 194 本，14 套由绿转红，其中两条是**真实设计约束**
//      （wave46「新话术零拉丁」、6 套「守卫在案且有守卫」），已整体回滚。
//   ② 代理粒度要小 —— 270 处/个时 6 个代理零产出。
//   ③ 判据是「有意守卫」还是「真静默失败」—— A 档里两样都有，样例：
//      · js/beast-taming.js:308  localStorage.setItem 包在空 catch 里 ⇒ **真静默失败**（玩家以为灵兽存了，其实没存）
//      · js/building-effects.js:286  try { closeBuildingDialog(); } catch (eModal) {}
//        是第八十二批·FIX-05 特意加的守卫，上方就有说明 ⇒ **有意守卫，不许动**
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const b = JSON.parse(fs.readFileSync(path.join(__dirname, 'empty-catch-baseline.json'), 'utf8'));
const A = b.点位.filter(p => p.档 === 'A');

// 按文件聚成「站点组」，再把组贪心分摊到 4 份，让每份的 A 类数量均衡
const byFile = new Map();
for (const p of A) { if (!byFile.has(p.文件)) byFile.set(p.文件, []); byFile.get(p.文件).push(p); }
const 组 = [...byFile.entries()].map(([f, ps]) => ({ f, ps, n: ps.length })).sort((a, b) => b.n - a.n);
const 包 = [{ n: 0, 组: [] }, { n: 0, 组: [] }, { n: 0, 组: [] }, { n: 0, 组: [] }];
for (const g of 组) { let k = 0; for (let i = 1; i < 4; i++) if (包[i].n < 包[k].n) k = i; 包[k].组.push(g); 包[k].n += g.n; }

包.forEach((p, i) => {
  const 点 = p.组.flatMap(g => g.ps);
  console.log('工单' + (i + 1) + '：' + p.组.length + ' 本文件、' + 点.length + ' 处'
    + '（' + p.组.slice(0, 6).map(g => g.f.replace('js/', '')).join('、') + (p.组.length > 6 ? '…' : '') + '）');
  fs.writeFileSync(path.join(__dirname, 'a141-ticket' + (i + 1) + '.json'), JSON.stringify(点, null, 1), 'utf8');
});
console.log('\n合计 ' + 包.reduce((s, p) => s + p.n, 0) + ' 处，已写 .scratch/a141-ticket1..4.json');
