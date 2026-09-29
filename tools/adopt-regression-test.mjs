// ==================== v25.2 · Modal.adopt 收编族回归测试 ====================
// 覆盖 npc-system 对话族（6 创建点）+ inventory 物品菜单族（5 创建点）：
//   1 NPC 对话打开 → 已收编（栈深 1、锚点在）
//   2 【新能力】Esc 关闭 NPC 对话（收编前 Esc 对它无效）
//   3 连环对话（切换子分类）→ 栈深不虚高（closeNpcModal 出栈）
//   4 closeNpcModal 出栈后 window.__npcDialogHandle 失活（isAlive=false）
//   5 物品菜单打开 → 收编；Esc → 关闭（新能力）
//   6 closeRuntimeModals 打扫 → 收编弹窗关闭 + 静态面板 battle-modal 存活
import { chromium } from 'playwright';

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
p.on('pageerror', e => errors.push('pageerror: ' + String(e).slice(0, 150)));
p.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 150)); });

await p.goto('file:///home/z/my-project/xianxia_work3/仙侠.html', { waitUntil: 'load' });
await p.waitForTimeout(2500);
await p.fill('#char-name', '收编测试员');
await p.click('#gender-male');
await p.click('text=踏入仙途');
await p.waitForSelector('#game-world', { state: 'visible', timeout: 15000 });
await p.waitForTimeout(1200);

const r = await p.evaluate(async () => {
    const out = {};
    const M = window.XianXia && window.XianXia.Modal;
    out.modalApi = !!M && typeof M.adopt === 'function';
    if (!out.modalApi) return out;

    // 找一个 NPC 打开对话（创角后 npcs Map 为空——世界未加载；从 activeNPCs 桥接一个进 Map 模拟已加载）
    const nm = window.npcManager;
    const liveNpc = (nm.activeNPCs || [])[0];
    if (liveNpc && (liveNpc.id || liveNpc.npcId)) {
        nm.npcs.set(String(liveNpc.id || liveNpc.npcId), liveNpc);
    }
    const npcs = nm.npcs && typeof nm.npcs.keys === 'function' ? Array.from(nm.npcs.keys()) : Object.keys(nm.npcs || {});
    out.hasNpc = npcs.length > 0;
    if (!npcs.length) return out;
    const npcId = npcs[0];
    window.showNPCDialog(npcId);
    await new Promise(res => setTimeout(res, 400));
    const h1 = window.__npcDialogHandle;
    out.npcDialogAdopted = M.depth() === 1 && !!(h1 && h1.el && h1.el.classList.contains('npc-dialog-modal'));
    out.npcDialogAnchor = !!(h1 && h1.el && h1.el.xModalHandle === h1);

    // 2 Esc 关闭（新能力）
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
    await new Promise(res => setTimeout(res, 200));
    out.escClosesNpcDialog = M.depth() === 0 && !(h1 && h1.el && h1.el.isConnected);

    // 3 连环对话：再开 → 切子分类（若该 NPC 有分类）→ 栈深仍 1
    window.showNPCDialog(npcId);
    await new Promise(res => setTimeout(res, 300));
    out.reopened = M.depth() === 1;
    const btns = window.__npcDialogHandle ? window.__npcDialogHandle.el.querySelectorAll('button[onclick*="showSubCategoryDialog"]') : [];
    if (btns.length) { btns[0].click(); await new Promise(res => setTimeout(res, 300)); }
    out.chainDialogNoStackLeak = M.depth() === 1; // 旧的出栈新的入栈，深度恒 1
    // 4 closeNpcModal 出栈
    window.closeNpcModal();
    await new Promise(res => setTimeout(res, 100));
    const h2 = window.__npcDialogHandle;
    out.closeNpcModalWorks = M.depth() === 0 && !(h2 && h2.el && h2.el.isConnected);

    // 5 物品菜单：背包放一个东西再开菜单（初始行囊有物品则直接用第一个；空则从模板造一件）
    out.itemMenu = '跳过（无物品）';
    const inv = window.inventory;
    if (inv && inv.slots) {
        if (!inv.slots.find(s => s && s.uid)) {
            const tplIds = Object.keys(window.itemById || {});
            if (tplIds.length) inv.slots.push({ uid: '__adopt_test__', templateId: tplIds[0], count: 1 });
        }
        const slot = inv.slots.find(s => s && s.uid);
        if (slot) {
            window.showItemMenu(slot.uid);
            await new Promise(res => setTimeout(res, 300));
            out.itemMenu = M.depth() >= 1;
            out.itemMenuEsc = '未测';
            const depthBefore = M.depth();
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
            await new Promise(res => setTimeout(res, 200));
            out.itemMenuEsc = M.depth() < depthBefore;
        }
    }

    // 6 closeRuntimeModals 打扫：开一个收编弹窗 + 确认静态面板存活
    window.showNPCDialog(npcId);
    await new Promise(res => setTimeout(res, 300));
    window.closeRuntimeModals();
    await new Promise(res => setTimeout(res, 200));
    out.sweepClosesAdopted = M.depth() === 0;
    out.battlePanelAlive = !!document.getElementById('battle-modal'); // 静态面板永不删
    return out;
});

console.log('=== adopt 收编族回归 ===');
let fails = 0;
for (const [k, v] of Object.entries(r)) {
    const ok = v === true || v === '跳过（无物品）';
    if (!ok && v !== '未测') fails++;
    console.log((ok ? ' ✓ ' : ' ✗ ') + k + (ok ? '' : ' → ' + JSON.stringify(v)));
}
console.log('页面错误:', errors.length ? errors.slice(0, 3) : '无');
if (errors.length) fails++;
console.log(fails === 0 ? '=== 全部通过 ===' : `=== ${fails} 项失败 ===`);
await b.close();
process.exit(fails === 0 ? 0 : 1);
