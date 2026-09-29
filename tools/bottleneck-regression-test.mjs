// ==================== v25.2 · 瓶颈弹窗收编回归测试 ====================
// 锁死场景（案底：FIX_NOTES 第十三轮，突破成功误删 #reincarnation-modal）：
//   0 前置：收编 API 可用（Modal.adopt）
//   1 弹窗收编：栈深度 1、xModalHandle 锚点、句柄 el 正确
//   2 【核心】突破成功（Math.random stub 0 必成功）→ #reincarnation-modal 仍在 DOM、弹窗已关、栈空
//   3 「暂时不管」按钮 → 句柄关闭 → 栈空
//   4 Esc 关收编弹窗（栈轨接管）
//   5 adopt 幂等：重复收编返回同一句柄
import { chromium } from 'playwright';

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
p.on('pageerror', e => errors.push('pageerror: ' + String(e).slice(0, 150)));
p.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 150)); });

await p.goto('file:///home/z/my-project/xianxia_work3/仙侠.html', { waitUntil: 'load' });
await p.waitForTimeout(2500);
await p.fill('#char-name', '瓶颈测试员');
await p.click('#gender-male');
await p.click('text=踏入仙途');
await p.waitForSelector('#game-world', { state: 'visible', timeout: 15000 });
await p.waitForTimeout(1500);

const r = await p.evaluate(async () => {
    const out = {};
    const M = window.XianXia.Modal;
    out.adoptApiReady = typeof M.adopt === 'function';
    // 前置：伪装瓶颈状态 + 转世面板在 DOM（正常游戏初始即有，hidden）
    out.reincarnationExisted = !!document.getElementById('reincarnation-modal');
    window.playerBottleneck.isInBottleneck = true;
    window.playerBottleneck.bottleneckRealm = '炼气';
    window.playerBottleneck.bottleneckLayer = 3;
    window.playerBottleneck.heartDemonChance = 0;
    // 1 开弹窗 + 收编验证
    window.attemptBreakBottleneck();
    await new Promise(res => setTimeout(res, 100));
    out.dialogOpened = M.depth() === 1;
    const h = M.top();
    out.adoptedInStack = !!h && !!h.adopted && M.depth() === 1;
    out.anchorOnEl = !!(h && h.el && h.el.xModalHandle === h);
    // 2 核心断言：突破成功后转世面板仍在
    const origRandom = Math.random;
    Math.random = function () { return 0; }; // 全部 roll 必成功
    try { window.executeBottleneckSolution(0); } catch (e) { out.execError = String(e).slice(0, 80); }
    Math.random = origRandom;
    out.reincarnationSurvived = !!document.getElementById('reincarnation-modal');
    out.dialogClosedAfterBreak = M.depth() === 0;
    // 3 重开 → 点「暂时不管」→ 句柄关（按钮在弹窗内找，别全局 querySelector 撞别的灰按钮）
    window.playerBottleneck.isInBottleneck = true;
    window.attemptBreakBottleneck();
    await new Promise(res => setTimeout(res, 100));
    const h2 = M.top();
    out.reopened = M.depth() === 1;
    const btn = h2 && h2.el ? h2.el.querySelector('button.bg-gray-600') : null;
    if (btn) btn.click();
    await new Promise(res => setTimeout(res, 100));
    out.ignoreButtonCloses = !!h2 && !h2.el.isConnected;
    // 4 Esc 关收编弹窗（用新开层的 isConnected 判定，不受栈残留影响）
    window.playerBottleneck.isInBottleneck = true;
    window.attemptBreakBottleneck();
    await new Promise(res => setTimeout(res, 100));
    const hEsc = M.top();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
    await new Promise(res => setTimeout(res, 100));
    out.escClosesAdopted = !!hEsc && !hEsc.el.isConnected;
    // 5 adopt 幂等
    window.playerBottleneck.isInBottleneck = true;
    window.attemptBreakBottleneck();
    await new Promise(res => setTimeout(res, 100));
    const h3 = M.top();
    const again = h3 ? M.adopt(h3.el) : null;
    out.adoptIdempotent = !!h3 && again === h3;
    if (h3) h3.close();
    return out;
});

console.log('=== 瓶颈收编回归 ===');
let fails = 0;
for (const [k, v] of Object.entries(r)) {
    const ok = v === true;
    if (!ok) fails++;
    console.log((ok ? ' ✓ ' : ' ✗ ') + k + (ok ? '' : ' → ' + JSON.stringify(v)));
}
console.log('页面错误:', errors.length ? errors.slice(0, 3) : '无');
if (errors.length) fails++;
console.log(fails === 0 ? '=== 全部通过 ===' : `=== ${fails} 项失败 ===`);
await b.close();
process.exit(fails === 0 ? 0 : 1);
