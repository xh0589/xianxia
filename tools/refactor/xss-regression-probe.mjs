// ==================== 第1步 · 注入回归探针 ====================
// 验证宗名链路三处修复：①草稿回填 value ②入口白名单 ③宗门史/标题转义
// 判定标准：整条流程跑完后 window.__sectXss 仍为 undefined、DOM 无注入标签、宗名被清洗。
import { chromium } from 'playwright';

const EVIL = '"><img src=x onerror="window.__sectXss=1">';
const b = await chromium.launch();
const p = await b.newPage();
const errors = [];
p.on('pageerror', e => errors.push(String(e).slice(0, 200)));
p.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });

await p.goto('file:///home/z/my-project/xianxia_work2/仙侠.html', { waitUntil: 'load' });
await p.waitForTimeout(2500);
await p.fill('#char-name', '安全员');
await p.click('#gender-male');
await p.click('text=踏入仙途');
await p.waitForSelector('#game-world', { state: 'visible', timeout: 15000 });
await p.waitForTimeout(1500);

const r = await p.evaluate((evil) => {
    const out = {};
    try {
        // 充值过插旗门槛（30 灵石）
        window.currentCharData.spiritStones = 100;

        // ① 草稿回填：立派面板的 value 属性应被转义（断言看未转义形态 "<img，而不是 "onerror"——后者转义后仍在）
        window._psDraftState.name = evil;
        window.openFoundSectPanel();
        const input = document.getElementById('ps-found-name');
        const raw = input.getAttribute('value');
        out.valueAttrEscaped = input.outerHTML.includes('&lt;img');
        out.valueRaw = raw.slice(0, 40);
        out.injectedImgInDom = !!document.querySelector('#xianxia-modal-overlay img[src="x"]');
        out.overlayCount = document.querySelectorAll('#xianxia-modal-overlay').length;

        // ② 入口白名单：走真实用户路径——面板开着、输入框填恶意名、点「白手起家」按钮
        // （_psDoFoundCheap 从输入框 el.value 取名，面板必须在场）
        const evilClean = evil.replace(/[<>"'&\\]/g, '');
        document.getElementById('ps-found-name').value = evilClean.length >= 2 ? evil : evil + '观';
        const btn = document.querySelector('#xianxia-modal-overlay button[onclick*="_psDoFoundCheap"]');
        if (btn) btn.click();
        const mine = (window.PlayerSect.listMySects && window.PlayerSect.listMySects()) || [];
        const s0 = mine[0];
        out.sectNameStored = s0 ? s0.name : '(未立宗)';
        out.sectNameClean = s0 ? !/[<>"'&]/.test(s0.name) : false;

        // ③ 宗门总册：标题与宗门史上屏，DOM 不应出现注入标签
        if (window.openPlayerSectPanel) window.openPlayerSectPanel();
        out.modalShown = !!document.getElementById('xianxia-modal-overlay');
        out.probeFired = !!window.__sectXss;
    } catch (e) { out.evalError = String(e).slice(0, 300); }
    return out;
}, EVIL);

console.log('=== 注入回归探针 ===');
console.log(JSON.stringify(r, null, 2));
console.log('页面错误:', errors.length ? errors.slice(0, 5) : '无');
console.log('XSS 探针触发（应为 false）:', r.probeFired === false ? '未触发 — 通过' : '触发 — 失败!');
await b.close();
