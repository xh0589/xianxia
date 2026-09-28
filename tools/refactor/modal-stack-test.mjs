// ==================== 第3步 · Modal 栈验证 ====================
// 断言清单：
//   1 栈式：三层叠加 depth=3，z-index 递增，top() 为最后开层
//   2 兼容：showModal 单实例语义保持；旧代码 getElementById().remove() 后栈不泄漏
//   3 keepId：closeAll({keepId}) 保留指定 id 层
//   4 双轨：closeRuntimeModals 同时收 Modal 层与自建弹层，静态面板永不删
//   5 Esc：键盘关闭栈顶（onClose 回调触发）
import { chromium } from 'playwright';

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
p.on('pageerror', e => errors.push('pageerror: ' + String(e).slice(0, 150)));
p.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 150)); });

await p.goto('file:///home/z/my-project/xianxia_work2/仙侠.html', { waitUntil: 'load' });
await p.waitForTimeout(2500);
await p.fill('#char-name', 'Modal测试员');
await p.click('#gender-male');
await p.click('text=踏入仙途');
await p.waitForSelector('#game-world', { state: 'visible', timeout: 15000 });
await p.waitForTimeout(1200);

const r = await p.evaluate(() => {
    const M = window.XianXia.Modal, out = {};
    // 1 栈式三层
    const h1 = M.open({ title: '一层', text: 'a' });
    const h2 = M.open({ title: '二层', html: '<p>b</p>' });
    const h3 = M.open({ title: '三层', text: 'c' });
    out.stackDepth3 = M.depth() === 3;
    const zs = [h1.el.style.zIndex, h2.el.style.zIndex, h3.el.style.zIndex].map(Number);
    out.zIncreasing = zs[0] < zs[1] && zs[1] < zs[2];
    out.topIsH3 = M.top() === h3;
    // text 通道转义
    const hx = M.open({ title: 't', text: '<img src=x onerror=window.__m=1>' });
    out.textEscaped = !!hx.el.innerHTML.includes('&lt;img');
    hx.close();
    // 2 showModal 单实例 + 旧式直接 remove
    window.showModal('兼容甲', '<p>x</p>');
    window.showModal('兼容乙', '<p>y</p>');
    out.showModalSingle = document.querySelectorAll('#xianxia-modal-overlay').length === 1;
    const beforeDepth = M.depth();
    document.getElementById('xianxia-modal-overlay').remove(); // 旧代码风格
    out.stackNoLeak = M.depth() === beforeDepth - 1;
    out.legacyRemoveWorked = !document.getElementById('xianxia-modal-overlay');
    // 3 keepId
    const ka = M.open({ id: 'keep-me', title: '留', text: 'k' });
    const kb = M.open({ title: '关', text: 'z' });
    window.closeRuntimeModals('keep-me');
    out.keepIdSurvives = !!document.getElementById('keep-me') && !kb.el.isConnected;
    out.depthAfterCloseAll = M.depth(); // 期望 1：keep-me 被刻意保留，其余全关
    ka.close();
    // 4 双轨：Modal 层 + 自建弹层 + 静态面板
    M.open({ title: '轨一', text: 'm' });
    const legacy = document.createElement('div');
    legacy.className = 'fixed inset-0'; legacy.id = 'legacy-layer';
    document.body.appendChild(legacy);
    const staticEl = document.getElementById('battle-modal') || (() => {
        const s = document.createElement('div');
        s.id = 'battle-modal'; s.className = 'fixed inset-0 hidden';
        document.body.appendChild(s); return s;
    })();
    window.closeRuntimeModals();
    out.dualTrackClosesBoth = !legacy.isConnected && M.depth() === 0;
    out.staticPanelNeverDeleted = !!document.getElementById('battle-modal');
    // 5（Esc 测试在下方 escR 独立进行，此处不再预开层影响 depth 断言）
    return { ...out };
});

// Esc 键在浏览器事件层测（evaluate 里合成 keydown 不会走 document listener？会走的——dispatchEvent 真实触发）
const escR = await p.evaluate(async () => {
    const M = window.XianXia.Modal;
    let closed = 0;
    const h1 = M.open({ title: 'esc1', text: 'a' });
    const h2 = M.open({ title: 'esc2', text: 'b', onClose: () => { closed++; } });
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
    await new Promise(res => setTimeout(res, 100));
    return { h2Closed: !h2.el.isConnected, h1StillOpen: h1.el.isConnected, onCloseFired: closed > 0 };
});

console.log('=== Modal 栈验证 ===');
const all = { ...r, ...escR };
delete all.escPending;
let fails = 0;
for (const [k, v] of Object.entries(all)) {
    const ok = (k === 'depthAfterCloseAll') ? v === 1 : v === true;
    if (!ok) fails++;
    console.log((ok ? ' ✓ ' : ' ✗ ') + k + (ok ? '' : ' → ' + JSON.stringify(v)));
}
console.log('页面错误:', errors.length ? errors.slice(0, 3) : '无');
console.log(fails === 0 && errors.length === 0 ? '=== 全部通过 ===' : `=== ${fails} 项失败 ===`);
await b.close();
process.exit(fails === 0 && errors.length === 0 ? 0 : 1);
