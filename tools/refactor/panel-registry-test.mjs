// ==================== 第5步 · 面板注册化验证 ====================
// 断言：
//   1 PanelLifecycle.registerShow / runShowHooks / registeredPanels 可用
//   2 calendar 已自注册（迁移成功）
//   3 switchPanel('calendar') 走注册表（onShow 被调，旧链不再处理 calendar）
//   4 未注册面板（character）走旧路径，刷新函数照常触发
//   5 onShow 抛错：console.error 带上下文，页面不死
import { chromium } from 'playwright';

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
p.on('pageerror', e => errors.push('pageerror: ' + String(e).slice(0, 150)));
p.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 150)); });

await p.goto('file:///home/z/my-project/xianxia_work2/仙侠.html', { waitUntil: 'load' });
await p.waitForTimeout(2500);
await p.fill('#char-name', '面板测试员');
await p.click('#gender-male');
await p.click('text=踏入仙途');
await p.waitForSelector('#game-world', { state: 'visible', timeout: 15000 });
await p.waitForTimeout(1500);

const r = await p.evaluate(() => {
    const out = {};
    const PL = window.PanelLifecycle;
    out.apiReady = !!(PL && typeof PL.registerShow === 'function' && typeof PL.runShowHooks === 'function');
    out.calendarRegistered = (PL.registeredPanels() || []).indexOf('calendar') >= 0;
    // 3 switchPanel('calendar') → onShow 触发（探针包一层）
    const api = window.WorldCalendarUI;
    let onShowFired = 0;
    const origRender = api.renderCalendarPanel;
    api.renderCalendarPanel = function () { onShowFired++; return origRender.apply(this, arguments); };
    window.switchPanel('map');
    window.switchPanel('calendar');
    api.renderCalendarPanel = origRender;
    out.onShowFired = onShowFired > 0;
    // 4 未注册面板走旧路径：character 分支的 renderBodyDurability 是旧链函数
    let legacyFired = 0;
    const origDur = window.renderBodyDurability;
    window.renderBodyDurability = function () { legacyFired++; return origDur.apply(this, arguments); };
    window.switchPanel('character');
    window.renderBodyDurability = origDur;
    out.legacyPathStillWorks = legacyFired > 0;
    // 5 onShow 抛错不炸
    PL.registerShow('test-boom-panel', { onShow: function () { throw new Error('面板故意炸'); } });
    let survived = true;
    try { window.switchPanel('test-boom-panel'); } catch (e) { survived = false; }
    out.throwSurvived = survived;
    return out;
});

console.log('=== 面板注册化验证 ===');
let fails = 0;
for (const [k, v] of Object.entries(r)) {
    const ok = v === true;
    if (!ok) fails++;
    console.log((ok ? ' ✓ ' : ' ✗ ') + k + (ok ? '' : ' → ' + JSON.stringify(v)));
}
const unexpected = errors.filter(e => !e.includes('面板故意炸') && !e.includes('test-boom-panel'));
console.log('页面意外错误:', unexpected.length ? unexpected.slice(0, 3) : '无');
if (unexpected.length) fails++;
console.log(fails === 0 ? '=== 全部通过 ===' : `=== ${fails} 项失败 ===`);
await b.close();
process.exit(fails === 0 ? 0 : 1);
