// ==================== 第0步 · 冒烟基线（重构保命绳） ====================
// 目的：在任何改动之前，把「现状」记录成机器可比对的形式：
//   1) 全部主面板 + 子页签逐一打开、截图
//   2) 收集每阶段控制台错误 / 页面异常（error-guard 会把运行时错误打到 console.error）
//   3) 创角名用注入探针（<img onerror>），顺带探测现状 XSS 暴露面（第1步证据）
// 以后每完成一刀重构，重跑本脚本：截图 diff 为零、错误数不增，才算通过。
// 用法：node tools/smoke-baseline.mjs [html路径] （默认当前目录的 仙侠.html）
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const GAME = 'file://' + path.resolve(process.argv[2] || '仙侠.html');
const OUT = process.env.OUT_DIR || path.resolve('baseline');
const SHOTS = path.join(OUT, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });

const MAIN_PANELS = ['character', 'skills', 'inventory', 'equipment', 'map', 'party',
    'quests', 'factions', 'house', 'beasts', 'activities', 'achievements', 'calendar', 'settings'];
const SUB_TABS = ['attr', 'status', 'karma', 'relations'];

let phase = 'boot';
const errors = [];
const panelStates = {};
const report = { game: GAME, startedAt: new Date().toISOString(), errors, panels: panelStates };

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('console', m => {
    if (m.type() === 'error') errors.push({ phase, text: m.text().slice(0, 500) });
});
page.on('pageerror', e => errors.push({ phase, text: String(e && e.message || e).slice(0, 500), uncaught: true }));
page.on('requestfailed', r => {
    const u = r.url();
    if (u.startsWith('file://')) errors.push({ phase, text: '请求失败: ' + u.slice(0, 200) });
});

try {
    // ---- 启动 ----
    await page.goto(GAME, { waitUntil: 'load' });
    await page.waitForTimeout(3000); // tailwind 运行时注入 + 316 个 defer 脚本逐个执行
    report.title = await page.title();
    report.scriptCount = await page.evaluate(() => document.querySelectorAll('script[src]').length);

    // ---- 创角（注入探针名） ----
    phase = 'creation';
    const PROBE = '<img src=x onerror="window.__xssProbe=1">';
    await page.fill('#char-name', PROBE);
    await page.click('#gender-male');
    await page.click('text=踏入仙途');
    await page.waitForSelector('#game-world', { state: 'visible', timeout: 15000 });
    await page.waitForTimeout(2500); // 开局事件、面板首次渲染
    await page.screenshot({ path: path.join(SHOTS, '00-game-world-initial.png') });

    // ---- XSS 探针读数 ----
    report.xssProbe = await page.evaluate(() => ({
        fired: !!window.__xssProbe,
        logContainsProbe: !!(window.gameLog && JSON.stringify(window.gameLog).includes('onerror'))
    }));

    // ---- 遍历主面板 ----
    phase = 'panels';
    for (const p of MAIN_PANELS) {
        const before = errors.length;
        const sel = `.nav-item[data-panel="${p}"]`;
        try {
            await page.click(sel, { timeout: 3000 });
            await page.waitForTimeout(600);
            await page.screenshot({ path: path.join(SHOTS, `panel-${p}.png`) });
            const visible = await page.evaluate(id => {
                const el = document.getElementById('panel-' + id);
                return !!el && !el.classList.contains('hidden');
            }, p);
            panelStates[p] = { switched: visible, newErrors: errors.length - before };
        } catch (e) {
            panelStates[p] = { switched: false, error: String(e).slice(0, 200), newErrors: errors.length - before };
        }
    }

    // ---- 子页签（位于 character 面板） ----
    phase = 'subtabs';
    await page.click('.nav-item[data-panel="character"]');
    await page.waitForTimeout(400);
    report.subTabs = {};
    for (const s of SUB_TABS) {
        const before = errors.length;
        try {
            await page.click(`.sub-tab[data-sub="${s}"]`, { timeout: 2000 });
            await page.waitForTimeout(400);
            await page.screenshot({ path: path.join(SHOTS, `sub-${s}.png`) });
            report.subTabs[s] = { ok: true, newErrors: errors.length - before };
        } catch (e) {
            report.subTabs[s] = { ok: false, error: String(e).slice(0, 150), newErrors: errors.length - before };
        }
    }

    // ---- showModal 通道检查 ----
    phase = 'modal';
    const before = errors.length;
    report.modalCheck = await page.evaluate(() => {
        if (typeof window.showModal !== 'function') return { available: false };
        try { window.showModal('冒烟基线', '<p>通道检查</p>'); } catch (e) { return { available: true, threw: String(e).slice(0, 150) }; }
        const el = document.querySelector('#xianxia-modal-overlay') || document.querySelector('.xianxia-modal');
        return { available: true, rendered: !!el, overlayId: el ? el.id : null };
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SHOTS, 'zz-modal-channel.png') });
    report.modalCheck.newErrors = errors.length - before;

} catch (e) {
    report.fatal = { phase, text: String(e && e.message || e).slice(0, 500) };
}

report.finishedAt = new Date().toISOString();
report.errorTotal = errors.length;
report.errorByPhase = errors.reduce((acc, e) => { acc[e.phase] = (acc[e.phase] || 0) + 1; return acc; }, {});

fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
console.log('=== 冒烟基线完成 ===');
console.log('控制台错误总数:', report.errorTotal, JSON.stringify(report.errorByPhase));
console.log('XSS 探针触发:', report.xssProbe ? report.xssProbe.fired : 'n/a');
console.log('面板切换失败:', Object.entries(panelStates).filter(([, v]) => !v.switched).map(([k]) => k).join(', ') || '无');
console.log('报告:', path.join(OUT, 'report.json'));
await browser.close();
