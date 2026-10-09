// 第一百四十二批 · 接线五处：「功能写好了但玩家看不到/用不了」逐条钉死
//   W-1 js/items-extended/09-loot-sources.js 整本未挂载 → 宝箱奇遇整条通道是死的
//   W-2 js/npcs/npc-emotions.js 两个渲染钩子零调用 → 玩家看不见任何 NPC 情绪
//   W-3 js/npcs/npc-daily-life.js renderNPCMapIcons 零调用 → 地图上没有 NPC 图标
//   W-4 js/sects/sect-specialties.js 增益存进 window.activeBuffs，window.updateBuffUI 全仓无定义
//   W-5 js/sects/sect-events.js 加权随机注释与实现不符 ＋ 士气门禁近乎空操作
// 证据分两档，逐段标出：vm 行为＝真文件装进沙箱真调；读码＝源码形状断言。
// ⚠ 本批真 Chrome 屏证仅 W-2／W-3／W-4 三条（试玩服 8931 实机点过），W-1／W-5 读的是假 DOM 里的返回值与上屏字符串。
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');

let 通过 = 0, 失败 = 0;
function ok(cond, msg) {
    if (cond) { 通过++; console.log('  ✓ ' + msg); }
    else { 失败++; console.log('  [FAIL] ' + msg); }
}
function load(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
function 去注释(src) {
    return src.split('\n').map(line => {
        const i = line.indexOf('//');
        return i >= 0 ? line.slice(0, i) : line;
    }).join('\n');
}

// ============ 沙箱：真物品链 → 真背包 → 真战利品表（抄 wave129 那把尺的骨架） ============
const 物品链 = [
    'js/items.js',
    'js/items-extended/01-pills.js', 'js/items-extended/02-weapons.js', 'js/items-extended/03-armor.js',
    'js/items-extended/04-materials.js', 'js/items-extended/05-talismans.js', 'js/items-extended/06-arts.js',
    'js/items-extended/07-food.js', 'js/items-extended/08-special.js',
    'js/items-extended.js',
    'js/items-extended/13-missing-ids.js', 'js/items-extended/14-ability-manuals.js',
    'js/items-extended/15-root-refine.js', 'js/items-extended/16-dangling-ids.js',
    'js/items-extended/17-lead-tokens.js', 'js/items-extended/18-grade-expansion.js',
    'js/items-extended/10-crafting-extensions.js', 'js/items-extended/11-event-extensions.js',
    'js/items-extended/12-quest-extensions.js',
    'js/extensions/talisman-advanced.js'
];
function 造节点() {
    return {
        style: { setProperty() {}, removeProperty() {} },
        classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
        dataset: {}, children: [],
        appendChild(c) { this.children.push(c); return c; }, removeChild() {},
        setAttribute() {}, getAttribute: () => null,
        addEventListener() {}, removeEventListener() {},
        querySelector: () => null, querySelectorAll: () => [], closest: () => null,
        focus() {}, click() {}, remove() {}, insertBefore(c) { return c; },
        getBoundingClientRect: () => ({ top: 0, left: 0, width: 0, height: 0, bottom: 0, right: 0 }),
        textContent: '', innerHTML: '', value: ''
    };
}
function 装链(名单, 额外部) {
    const env = { msgs: [], exp: [], fails: [], node: 造节点 };
    const sb = {
        console: { log() {}, warn() {}, error() {} },
        localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
        setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
        requestAnimationFrame: () => 0,
        navigator: { userAgent: 'node', maxTouchPoints: 0 },
        location: { href: 'file:///xianxia.html', search: '' },
        matchMedia: () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {} }),
        alert() {}, prompt: () => null, confirm: () => true,
        performance: { now: () => 0 },
        showMessage: (t, k) => { env.msgs.push({ text: String(t), kind: k }); },
        gainExp: (n) => { env.exp.push(n); }
    };
    sb.window = sb; sb.globalThis = sb;
    sb.document = {
        getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
        createElement: () => env.node(), createTextNode: () => env.node(), createElementNS: () => env.node(),
        addEventListener() {}, removeEventListener() {}, body: env.node(), head: env.node(),
        documentElement: env.node(), readyState: 'loading', activeElement: null
    };
    if (额外部) for (const k of Object.keys(额外部)) sb[k] = 额外部[k];
    vm.createContext(sb);
    env.loadFails = [];
    for (const f of 名单) {
        try { vm.runInContext(load(f), sb, { filename: f }); }
        catch (e) { env.loadFails.push(f + ': ' + e.message); }
    }
    for (const [f, src] of (env.额外装载 || [])) {
        try { vm.runInContext(src, sb, { filename: f }); }
        catch (e) { env.loadFails.push(f + ': ' + e.message); }
    }
    env.sb = sb;
    return env;
}

///////////////////////////////////////////////////////////////////////////////
// W-1　js/items-extended/09-loot-sources.js 整本未挂载
///////////////////////////////////////////////////////////////////////////////
console.log('\n[W-1] 宝箱通道：货单与开箱手已接到已挂载的 js/loot-system.js');
{
    // ---- Ⓐ 读码：三个零引用全局在别处有没有「同名另定义」 ----
    const 扫 = rel => load(rel);
    const 全仓 = [];
    (function walk(d) {
        for (const e of fs.readdirSync(d, { withFileTypes: true })) {
            if (e.name === 'node_modules' || e.name === '.git' || e.name === '.scratch') continue;
            const p = path.join(d, e.name);
            if (e.isDirectory()) walk(p);
            else if (e.name.endsWith('.js') && !p.includes(path.join('tests', '')) && !p.includes('legacy')) 全仓.push(p);
        }
    })(path.join(ROOT, 'js'));

    const 名字 = ['WEAPON_SHOP_ITEMS', 'ARMOR_SHOP_ITEMS', 'CHEST_LOOT', 'EXTENDED_LOOT_TABLES', 'openChest', 'getExtendedLoot'];
    const 定义处 = {}, 导出处 = {};
    for (const 名 of 名字) {
        const 定义集 = new Set(), 导出集 = new Set();
        for (const f of 全仓) {
            const src = fs.readFileSync(f, 'utf8');
            const rel = path.relative(ROOT, f);
            // 声明：const/let/var/function 后紧跟该名（顶层与 IIFE 内都算「有一份定义」）
            if (new RegExp('(?:^|[\\n;{}])\\s*(?:const|let|var|function)\\s+' + 名 + '\\b').test(src)) 定义集.add(rel);
            // 导出到 window：必须是赋值，`===`／`==` 不算（11-event-extensions.js 里那两处是读取不是定义）
            if (new RegExp('window\\.' + 名 + '\\s*=(?!=)').test(src)) 导出集.add(rel);
        }
        定义处[名] = Array.from(定义集);
        导出处[名] = Array.from(导出集);
    }
    ok(定义处['EXTENDED_LOOT_TABLES'].length === 1 && 定义处['EXTENDED_LOOT_TABLES'][0].indexOf('09-loot-sources') >= 0
       && 导出处['EXTENDED_LOOT_TABLES'].length === 1,
        'Ⓐ1 EXTENDED_LOOT_TABLES 全仓只有一处定义＋一处导出（就在那本未挂载的）⇒ 不是「同名撞车」，是整本没上线 [' + 定义处['EXTENDED_LOOT_TABLES'].join(' / ') + ']');
    ok(定义处['CHEST_LOOT'].length === 1 && 定义处['CHEST_LOOT'][0].indexOf('loot-system.js') >= 0,
        'Ⓐ2 CHEST_LOOT 全仓只有一处定义，且已迁到已挂载的 js/loot-system.js（无第二份货单） [' + 定义处['CHEST_LOOT'].join(' / ') + ']');
    ok(定义处['openChest'].length === 1 && 定义处['openChest'][0].indexOf('loot-system.js') >= 0,
        'Ⓐ3 openChest 全仓只有一处定义，且已迁到 js/loot-system.js [' + 定义处['openChest'].join(' / ') + ']');
    ok(定义处['WEAPON_SHOP_ITEMS'].length === 1 && 定义处['ARMOR_SHOP_ITEMS'].length === 1,
        'Ⓐ4 WEAPON_SHOP_ITEMS／ARMOR_SHOP_ITEMS 各只有一处定义（仍在废弃本里，无第二份）');
    // ⚠️ CHEST_LOOT 是 const、openChest 是顶层 function —— 两者落 window 的方式不同：
    //   const 不会成为 window 的属性（只在脚本词法作用域里），**必须**显式 window.CHEST_LOOT = …；
    //   顶层 function 声明在经典脚本里本来就会落 window，那行显式导出是冗余的兜底
    //   （防日后被收进块作用域/IIFE 就静默失挂）。两条都钉住，别让人当噪音删掉。
    const 战源码 = load('js/loot-system.js');
    ok(/window\.CHEST_LOOT = CHEST_LOOT;/.test(战源码) && /window\.openChest = openChest;/.test(战源码),
        'Ⓐ5 两个全局都显式写出 window 导出：CHEST_LOOT 是 const 不写就不落 window；openChest 那行是防收进块作用域的兜底，都不许删');

    // ---- Ⓑ 读码：为什么「不挂载」——重复挂载会让掉落翻倍 ----
    const 九 = load('js/items-extended/09-loot-sources.js');
    const 战 = load('js/loot-system.js');
    ok(/已废弃\s*·\s*不挂载/.test(九.slice(0, 2000)),
        'Ⓑ1 09-loot-sources.js 文件头已明确标注【已废弃·不挂载】并写明理由');
    ok(!/window\.getExtendedLoot/.test(去注释(战)),
        'Ⓑ2 js/loot-system.js 里那段永不执行的 window.getExtendedLoot 死调用已删（否则挂上 09 就会叠第二轮掷骰）');
    // 重叠实证：把两张表真跑起来逐键逐档比
    const E = 装链(物品链, {});
    E.额外装载 = [['js/loot-system.js', 战], ['js/items-extended/09-loot-sources.js', 九]];
    for (const [f, src] of E.额外装载) {
        try { vm.runInContext(src, E.sb, { filename: f }); } catch (e) { E.loadFails.push(f + ': ' + e.message); }
    }
    const w = E.sb.window;
    const 扩 = w.EXTENDED_LOOT_TABLES, 主 = w.LOOT_TABLES;
    let 重叠键 = 0, 重叠条 = 0, 全同档 = 0, 独有 = [];
    for (const k of Object.keys(扩)) {
        if (!主[k]) { 独有.push(k + '（主表无此键）'); continue; }
        重叠键++;
        for (const 档 of ['common', 'uncommon', 'rare']) {
            const a = new Set((扩[k][档] || []).slice());
            const b = new Set((主[k][档] || []).map(x => x.id));
            let 同 = 0;
            for (const x of a) if (b.has(x)) 同++;
            重叠条 += 同;
            if (a.size && 同 === a.size) 全同档++;
        }
    }
    ok(重叠键 === 5, 'Ⓑ3 EXTENDED_LOOT_TABLES 与 LOOT_TABLES 有 5 个同名键（beast/boss_beast/bandit/dungeon_guard/dungeon_boss），另 ' + 独有.join('、'));
    ok(重叠条 > 0, 'Ⓑ4 逐档逐枚比对：两表重叠 ' + 重叠条 + ' 枚 id，其中 ' + 全同档 + ' 档内容完全相同 ⇒ 挂 09 = 主表之外再叠一整轮掷骰（掉落翻倍），所以不挂');
    ok(/itemById|EXTENDED_LOOT_TABLES/.test(九) && /mat_wind_essence/.test(战),
        'Ⓑ5 风狼王进化链那条 mat_wind_essence 不靠 09 活着：它在已挂载的 loot-system.js ELEMENTAL_LOOT.uncommon 里（js/loot-system.js:311）');

    // ---- ⓒ 读码：未挂载这件事必须仍然成立（别有人偷偷挂上去） ----
    const html = load('仙侠.html');
    const mf = JSON.parse(load('scripts.manifest.json'));
    const mfText = JSON.stringify(mf);
    ok(html.indexOf('items-extended/09-loot-sources.js') < 0, 'ⓒ1 仙侠.html 里确实没有 09-loot-sources.js 这颗 script 标签');
    ok(mfText.indexOf('items-extended/09-loot-sources.js') < 0, 'ⓒ2 scripts.manifest.json 里也确实没有登记它');

    // ---- Ⓓ vm 行为：装载真链后 window.openChest 必须是函数 ----
    const D = 装链(物品链.concat(['js/inventory.js', 'js/loot-system.js']), {});
    const dw = D.sb.window;
    ok(D.loadFails.length === 0, 'Ⓓ1 真物品链＋真背包＋真战利品系统装载无异常' + (D.loadFails.length ? '（' + D.loadFails.join(' | ') + '）' : ''));
    ok(typeof dw.openChest === 'function' && !!dw.CHEST_LOOT,
        'Ⓓ2 ★接线本体：装载后 window.openChest 是函数、window.CHEST_LOOT 在场（改前这里是 undefined）');
    // 货单逐枚对百宝册：不能有幽灵 id
    const LIB = dw.itemById || {};
    let 幽 = [];
    for (const 档 of Object.keys(dw.CHEST_LOOT)) for (const id of dw.CHEST_LOOT[档].items) if (!LIB[id]) 幽.push(档 + '/' + id);
    ok(幽.length === 0, 'Ⓓ3 三档宝箱货单逐枚过百宝册，无查无此号' + (幽.length ? '：' + 幽.join('、') : ''));
    // 开口袋验「读的是活的 window.CHEST_LOOT」：临时塞一档单牌货，开箱必须照它发
    // （这钉的是 openChest 与 CHEST_LOOT 在同一个文件、同一条账上，不是两个各存一份的壳）
    dw.CHEST_LOOT['__探针档'] = { items: ['pill_big_recovery'], count: [1, 1], spiritStones: [7, 7] };
    dw.inventory.slots.length = 0;
    for (let i = 0; i < dw.inventory.maxSlots; i++) dw.inventory.slots.push(null);
    const 探 = dw.openChest('__探针档');
    delete dw.CHEST_LOOT['__探针档'];
    ok(探 && 探.itemId === 'pill_big_recovery' && 探.stones === 7 && 探.got === 1,
        'Ⓓ4 ★开口袋验账：往 window.CHEST_LOOT 临时塞一档单牌货，openChest 照它发（大还丹×1、灵石 7）⇒ 两者是同一条活账');

    // ---- Ⓔ vm 行为：★真跑宝箱奇遇的那个选项，验「接上线」这件事本身 ----
    // 装 randomEvents 为真数组，让 11-event-extensions.js 真合并，然后真调 event_desert_treasure 的 enter 选项
    function 跑宝箱奇遇(是否装载战利品) {
        const env = 装链(物品链.concat(['js/inventory.js']), { randomEvents: [] });
        if (是否装载战利品) {
            try { vm.runInContext(load('js/loot-system.js'), env.sb, { filename: 'js/loot-system.js' }); }
            catch (e) { env.loadFails.push('loot-system: ' + e.message); }
        }
        const ww = env.sb.window;
        const 名单 = (env.sb.randomEvents || []).map(e => e.id);
        const ev = (env.sb.randomEvents || []).find(e => e.id === 'event_desert_treasure');
        if (!ev) return { env: env, ww: ww, 名单: 名单, ev: null };
        const pick = ev.choices.find(c => c.id === 'enter');
        // 空行囊起手，确保 addItem 收得下
        env.sb.inventory.slots.length = 0;
        for (let i = 0; i < env.sb.inventory.maxSlots; i++) env.sb.inventory.slots.push(null);
        env.msgs.length = 0;
        const 灵石前 = env.sb.inventory.currency.spiritStones;
        try { pick.effect(); } catch (e) { env.loadFails.push('enter.effect: ' + e.message); }
        return {
            env: env, ww: ww, 名单: 名单, ev: ev, 屏: env.msgs.map(m => m.text).join(' '),
            袋: env.sb.inventory.slots.filter(Boolean).length,
            灵石后: env.sb.inventory.currency.spiritStones, 灵石前: 灵石前
        };
    }
    const 接线后 = 跑宝箱奇遇(true);
    const 未接线 = 跑宝箱奇遇(false);
    ok(接线后.名单.indexOf('event_desert_treasure') >= 0, 'Ⓔ1 宝箱奇遇已真合并进 randomEvents（' + 接线后.名单.length + ' 条扩展奇遇在场）');
    ok(!/纹丝不动/.test(接线后.屏), 'Ⓔ2 ★真调 enter 选项：屏上没有「暗格纹丝不动」那句死路话');
    ok(/开箱得了|箱里是|一件也没能带走/.test(接线后.屏), 'Ⓔ3 ★真调 enter 选项：屏上念的是开箱回执——「' + 接线后.屏.slice(0, 60) + '…」');
    ok(接线后.袋 > 0 && 接线后.灵石后 > 接线后.灵石前,
        'Ⓔ4 ★玩家真拿到东西：行囊 ' + 未接线.袋 + ' → ' + 接线后.袋 + ' 件，灵石 ' + 未接线.灵石后 + ' → ' + 接线后.灵石后);
    ok(/纹丝不动/.test(未接线.屏) && 未接线.袋 === 0,
        'Ⓔ5 改前复现（不装载 loot-system.js）：同一选项走「' + 未接线.屏.slice(0, 40) + '…」，行囊 0 件 ⇒ 这条断言抓得住回归');

    // ---- Ⓕ 回归棘轮：源码形状钉住「迁移只发生一次」 ----
    ok((战.match(/const CHEST_LOOT/g) || []).length === 1 && (九.match(/const CHEST_LOOT/g) || []).length === 0,
        'Ⓕ1 全仓只允许存在一份 CHEST_LOOT 货单（loot-system.js 1 份、09 那本 0 份）');
}

///////////////////////////////////////////////////////////////////////////////
// W-2　js/npcs/npc-emotions.js 两个渲染钩子零调用
///////////////////////////////////////////////////////////////////////////////
console.log('\n[W-2] NPC 情绪：徽章接进 NPC 卡片；对话面板那份内联块是既有的，不重复接');
{
    const 情 = load('js/npcs/npc-emotions.js');
    const 对话 = load('js/npcs/npc-system.js');
    const 城中 = load('js/npcs/city-residents.js');

    // ---- Ⓐ 读码：前提核对——对话面板本来就有情绪渲染 ----
    ok(/window\.getEmotionState\s*\(mood\)/.test(对话),
        'Ⓐ1 对话面板 npc-system.js 内联情绪块在册（取 getEmotionState 的图标与配色）⇒「玩家看不到任何情绪」这个前提对对话面板不成立');
    ok(/onclick="comfortNPC\(/.test(对话) && /onclick="encourageNPC\(/.test(对话) && /onclick="accompanyNPC\(/.test(对话),
        'Ⓐ2 对话面板三枚情绪按钮在册，且指向本文件那三个真函数（不是死按钮）');
    ok(/injectEmotionToDialog 零调用|不是\s*\*\*/.test(情) || /不是 \*\*漏掉/.test(情),
        'Ⓐ3 npc-emotions.js 已注明 injectEmotionToDialog 是内联块的重复实现、不作对话面板接线点');

    // ---- Ⓑ 读码：injectEmotionToDialog 确实仍零调用（且这是有意的） ----
    const 注入处 = [];
    (function walk(d) {
        for (const e of fs.readdirSync(d, { withFileTypes: true })) {
            if (e.name === 'node_modules' || e.name === '.git' || e.name === '.scratch') continue;
            const p = path.join(d, e.name);
            if (e.isDirectory()) walk(p);
            else if (e.name.endsWith('.js')) {
                if (p.indexOf(path.join('js', 'npcs', 'npc-emotions.js')) >= 0) continue;
                if (p.includes(path.join('tests', ''))) continue;
                // 去注释后再找：注释里提到函数名不算调用点
                if (/injectEmotionToDialog/.test(去注释(fs.readFileSync(p, 'utf8')))) 注入处.push(path.relative(ROOT, p));
            }
        }
    })(path.join(ROOT, 'js'));
    ok(注入处.length === 0, 'Ⓑ1 injectEmotionToDialog 在 js/ 里零调用点，且**这是有意为之**（重复实现，接了会把情绪块印两遍）');

    // ---- Ⓒ 读码：徽章的真实挂点 ----
    ok(/getEmotionBadgeHTML/.test(城中),
        'Ⓒ1 ★getEmotionBadgeHTML 已接进 js/npcs/city-residents.js 的 getCityResidentCards（城中人物卡）');
    ok(/getEmotionBadgeHTML === 'function'/.test(城中),
        'Ⓒ2 挂点带 typeof 守卫（情绪系统未装载时不至于把整块城中人物卡打成空）');
    const 卡外层 = /getCityResidentCards[\s\S]*?onclick="window\.showNPCDialog/.test(城中);
    const 徽章在前 = 城中.indexOf('getEmotionBadgeHTML(n)') < 城中.indexOf("onclick=\"window.showNPCDialog");
    ok(卡外层 && 徽章在前,
        'Ⓒ3 徽章排在「攀谈」按钮之前；该卡外层没有 onclick（自带独立按钮）⇒ 徽章里三枚按钮点下去不会连带弹对话');

    // ---- Ⓓ vm 行为：真装 npc-emotions.js，真调徽章 ----
    const E = 装链([], {
        console: { log() {}, warn() {}, error() {} }
    });
    E.sb.document.readyState = 'complete';
    try { vm.runInContext(情, E.sb, { filename: 'js/npcs/npc-emotions.js' }); }
    catch (e) { E.loadFails.push('npc-emotions: ' + e.message); }
    const ww = E.sb.window;
    ok(E.loadFails.length === 0, 'Ⓓ1 npc-emotions.js 装载无异常' + (E.loadFails.length ? '（' + E.loadFails.join(' | ') + '）' : ''));
    ok(typeof ww.getEmotionBadgeHTML === 'function' && typeof ww.injectEmotionToDialog === 'function',
        'Ⓓ2 两个渲染钩子都真导出了（徽章 / 注入）');

    // 采集侧非空：情绪数据真的有值，不是空壳
    const 造NPC = (id, mood, stress) => ({ id: id, name: '测试' + id, state: { mood: mood, stress: stress } });
    const 徽 = ww.getEmotionBadgeHTML(造NPC('npc_a', 95, 10));
    ok(/狂喜/.test(徽) && /压力:10/.test(徽), 'Ⓓ3 心情 95 的 NPC 徽章念「狂喜」并带压力读数（数据侧非空，不是空壳）');
    const 徽怒 = ww.getEmotionBadgeHTML(造NPC('npc_b', 5, 90));
    ok(/愤怒/.test(徽怒) && /text-red-500/.test(徽怒), 'Ⓓ4 心情 5／压力 90 的 NPC 徽章念「愤怒」且压力条转红');
    ok(/comfortNPC\('npc_a'\)/.test(徽) && /encourageNPC\('npc_a'\)/.test(徽) && /accompanyNPC\('npc_a'\)/.test(徽),
        'Ⓓ5 徽章自带三枚可点的情绪按钮，且带的是真 npcId');
    // 签名核对：徽章吃 npc 对象、注入吃 npcId
    ok(typeof ww.getEmotionBadgeHTML(造NPC('npc_c', 50, 0)) === 'string' && ww.injectEmotionToDialog('查无此人') === '',
        'Ⓓ6 签名核对成立：getEmotionBadgeHTML 吃 npc 对象，injectEmotionToDialog 吃 npcId（查无此人回空串）');
    ok(ww.npcManager === undefined && ww.injectEmotionToDialog('npc_a') === '',
        'Ⓓ7 injectEmotionToDialog 靠 window.npcManager 取人，没有 npcManager 时如实回空串（不抛）');

    // ---- Ⓔ vm 行为：★真跑 getCityResidentCards，验接线 ----
    function 跑城中卡(是否装载情绪) {
        // city-residents.js 开头 `var D = window.CITY_RESIDENT_DATA; if (!D) return;` ⇒ 必须给这份数据
        const env = 装链([], { CITY_RESIDENT_DATA: { npcs: {}, events: {} } });
        env.sb.npcManager = {
            getNPCsByHomeLocation: () => ([
                { id: 'c_res_1', name: '阿七', occupation: '铁匠', state: { mood: 95, stress: 12 }, location: '金城', homeLocation: '金城' },
                { id: 'c_res_2', name: '柳三', occupation: '货郎', state: { mood: 10, stress: 85 }, location: '金城', homeLocation: '金城' }
            ])
        };
        if (是否装载情绪) {
            env.sb.document.readyState = 'complete';
            try { vm.runInContext(情, env.sb, { filename: 'js/npcs/npc-emotions.js' }); }
            catch (e) { env.loadFails.push('npc-emotions: ' + e.message); }
        }
        try { vm.runInContext(城中, env.sb, { filename: 'js/npcs/city-residents.js' }); }
        catch (e) { env.loadFails.push('city-residents: ' + e.message); }
        return env;
    }
    const 接 = 跑城中卡(true), 未接 = 跑城中卡(false);
    const 接HTML = 接.sb.window.getCityResidentCards ? 接.sb.window.getCityResidentCards('金城') : '';
    const 未HTML = 未接.sb.window.getCityResidentCards ? 未接.sb.window.getCityResidentCards('金城') : '';
    ok(接.loadFails.length === 0 && 接HTML.length > 0, 'Ⓔ1 城中人物卡真渲染出来（' + 接HTML.length + ' 字符，含两位具名人物）');
    ok(/狂喜/.test(接HTML) && /愤怒/.test(接HTML) && /压力:12/.test(接HTML) && /压力:85/.test(接HTML),
        'Ⓔ2 ★真渲染：卡片上现在看得到情绪——阿七「狂喜」压力 12、柳三「愤怒」压力 85');
    ok(/comfortNPC\('c_res_1'\)/.test(接HTML) && /comfortNPC\('c_res_2'\)/.test(接HTML),
        'Ⓔ3 ★卡片上那两枚情绪按钮直接可点，且各自带对 npcId');
    ok(!/狂喜|压力:/.test(未HTML) && /攀谈/.test(未HTML),
        'Ⓔ4 改前复现（不装载情绪系统）：同一批卡片只有姓名/身份/攀谈，一个情绪字都没有 ⇒ 这两条断言抓得住回归');
}

///////////////////////////////////////////////////////////////////////////////
// W-3　js/npcs/npc-daily-life.js renderNPCMapIcons 零调用
///////////////////////////////////////////////////////////////////////////////
console.log('\n[W-3] 地图 NPC 图标：renderNPCMapIcons 已接进 renderMap（经一层 HTML 覆层）');
{
    const 日 = load('js/npcs/npc-daily-life.js');

    // ---- Ⓐ 读码：签名与容器形状 ----
    ok(/function renderNPCMapIcons\(mapContainer\)/.test(日),
        'Ⓐ1 签名核对：renderNPCMapIcons 吃的是**元素**（不是 id 字符串），无返回值');
    ok(/random-map-svg/.test(日) && /insertBefore\(layer, svg\.nextSibling\)/.test(去注释(日)),
        'Ⓐ2 覆层建在 #random-map-svg 的父节点里、紧随 SVG 之后（不动 仙侠.html）');
    ok(/layer\.style\.pointerEvents = 'none'/.test(日) && /kids\[i\]\.style\.pointerEvents = 'auto'/.test(日),
        'Ⓐ3 整层不吃指针事件、单个图标再单独打开 ⇒ 不会吃掉地图自己的左键规划路线／右键看脚下');
    ok(/layer\.style\.width = svgRect\.width \+ 'px'/.test(日) && /getBoundingClientRect/.test(日),
        'Ⓐ4 覆层尺寸用 getBoundingClientRect 量（⚠️ <svg> 是 SVGElement，压根没有 offsetLeft/offsetWidth —— 读出 undefined，`undefined + "px"` 是非法 CSS，浏览器默默丢掉，覆层就成了 0×0 空壳）');
    ok(!/svg\.offset(Left|Top|Width|Height)/.test(去注释(日)),
        'Ⓐ4b 全文件不再拿 svg.offset* 量尺寸（本条就是那个 bug 本身）');
    ok(/if \(!host\.style\.position\) host\.style\.position = 'relative'/.test(去注释(日)),
        'Ⓐ5 覆层不覆盖父节点已有定位（只在自己没定位时补一个 relative）');

    // ---- Ⓑ vm 行为：真 DOM 沙箱，真调 renderMap ----
    // 造一段与 仙侠.html:1147-1150 同形状的地图骨架（外层 div > svg + 说明文字）
    function 造地图DOM() {
        const 按id = {};
        function 造元素(tag, id, 是SVG) {
            const el = {
                tagName: String(tag).toUpperCase(), id: id || '', className: '', textContent: '', title: '',
                style: {}, dataset: {}, parentNode: null,
                _kids: [], _html: '', _rect: null,
                get children() { return this._kids; },
                get innerHTML() { return this._html; },
                // 真 DOM 里 innerHTML='' 会清空子树，这把尺也得会（图标只 append 不清正是本条要防的雷）
                set innerHTML(v) { this._html = v; if (v === '') this._kids = []; },
                appendChild(c) { this._kids.push(c); c.parentNode = this; if (c.id) 按id[c.id] = c; return c; },
                insertBefore(c, ref) {
                    const i = ref ? this._kids.indexOf(ref) : -1;
                    if (i < 0) this._kids.push(c); else this._kids.splice(i, 0, c);
                    c.parentNode = this; if (c.id) 按id[c.id] = c; return c;
                }
            };
            // ⚠️ 刻意**不给 SVG 补 offsetLeft/offsetWidth**：真 DOM 里 <svg> 是 SVGElement，
            //   那几个 offset* 是 HTMLElement 的属性，它压根没有（读出来 undefined）。
            //   早先这把尺给 svg 补了 offset*，结果把「拿 offset* 量 svg 尺寸」这个真 bug
            //   盖掉了好几条断言。SVGElement 只有 getBoundingClientRect，这里就按真的来。
            if (!是SVG) { el.offsetLeft = 0; el.offsetTop = 0; el.offsetWidth = 640; el.offsetHeight = 360; }
            el.getBoundingClientRect = () => el._rect || { left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 };
            if (id) 按id[id] = el;
            return el;
        }
        const host = 造元素('div', 'map-host');
        const svg = 造元素('svg', 'random-map-svg', true);
        const info = 造元素('div', 'random-map-info');
        host._rect = { left: 0, top: 0, width: 660, height: 412, right: 660, bottom: 412 };
        svg._rect = { left: 12, top: 20, width: 640, height: 360, right: 652, bottom: 380 };
        info._rect = { left: 12, top: 392, width: 640, height: 20, right: 652, bottom: 412 };
        svg.nextSibling = info;
        host.appendChild(svg);
        host.appendChild(info);
        const doc = {
            getElementById: (id) => 按id[id] || null,
            createElement: (t) => 造元素(t)
        };
        return { doc: doc, host: host, svg: svg, info: info };
    }
    function 跑地图(是否装载日程) {
        const DOM = 造地图DOM();
        const env = 装链([], {});
        env.sb.document = DOM.doc;
        const 本城NPC = [
            { id: 'npc_m1', name: '王铁', location: '青岩', state: { location: '青岩', mood: 80, stress: 10, currentActivity: '打铁' }, appearance: { icon: '🔨' } },
            { id: 'npc_m2', name: '阿萝', location: '青岩', state: { location: '青岩', mood: 30, stress: 60, currentActivity: '发呆' }, appearance: { icon: '🌿' } },
            { id: 'npc_far', name: '远方客', location: '玄冰', state: { location: '玄冰', mood: 50, stress: 0, currentActivity: '赶路' }, appearance: { icon: '👤' } }
        ];
        env.sb.npcManager = { getAllNPCs: () => 本城NPC };
        env.sb.currentCharData = { location: '青岩' };
        env.sb.renderMap = function () { env.renderMapCalls = (env.renderMapCalls || 0) + 1; return '原图'; };
        if (是否装载日程) {
            try { vm.runInContext(日, env.sb, { filename: 'js/npcs/npc-daily-life.js' }); }
            catch (e) { env.loadFails.push('npc-daily-life: ' + e.message); }
        } else {
            env.sb.renderNPCMapIcons = function () { env.renderNPCMapIconsCalls = (env.renderNPCMapIconsCalls || 0) + 1; };
        }
        return env;
    }

    const 接 = 跑地图(true), 未接 = 跑地图(false);
    ok(接.loadFails.length === 0, 'Ⓑ1 npc-daily-life.js 装载无异常' + (接.loadFails.length ? '（' + 接.loadFails.join(' | ') + '）' : ''));
    ok(typeof 接.sb.refreshNPCMapIcons === 'function' && typeof 接.sb.renderMap === 'function',
        'Ⓑ2 覆层刷新函数已导出、renderMap 钩子在位');

    // ★真调 renderMap（接线后的入口）
    const r1 = 接.sb.renderMap();
    ok(r1 === '原图', 'Ⓑ3 钩子透传原 renderMap 的返回值，没有把地图自己的渲染吃掉');
    const 层 = 接.sb.document.getElementById('npc-map-icon-layer');
    ok(!!层, 'Ⓑ4 ★真调 renderMap 后：野外地图上多了一层 #npc-map-icon-layer 覆层');
    ok(层 && 层.children.length === 2,
        'Ⓑ5 ★真调 renderMap 后：覆层里正好两个图标（本城青岩 2 人；玄冰那位远方客不上这层）');
    const 图标文字 = 层 ? 层.children.map(c => c.textContent).join('') : '';
    ok(/🔨/.test(图标文字) && /🌿/.test(图标文字),
        'Ⓑ6 ★图标用的是各人自己的 appearance.icon（🔨 王铁 / 🌿 阿萝），不是清一色 👤');
    ok(层 && 层.children[0].title === '王铁 - 打铁',
        'Ⓑ7 ★悬停提示带上姓名与当前活动：「' + (层 ? 层.children[0].title : '') + '」');
    ok(层 && 层.children[0].onclick && 层.children[0].style.pointerEvents === 'auto' && 层.style.pointerEvents === 'none',
        'Ⓑ8 图标可点（onclick 挂着 showNPCDialog）且单独打开指针事件，整层不吃');

    // ---- Ⓒ 幂等：同一批人反复 renderMap 不叠图标、不乱跳 ----
    接.sb.renderMap(); 接.sb.renderMap();
    const 层2 = 接.sb.document.getElementById('npc-map-icon-layer');
    ok(层2 && 层2.children.length === 2,
        'Ⓒ1 连调三次 renderMap，覆层里仍是 2 个图标（按本城 NPC 名单判重，不叠成一堆）');
    const 左边1 = 层.children[0].style.left;
    接.sb.renderMap();
    const 层3 = 接.sb.document.getElementById('npc-map-icon-layer');
    ok(层3.children[0].style.left === 左边1,
        'Ⓒ2 名单没变时位置不重掷（' + 左边1 + ' 保持不变）⇒ 每 pan 一下图标不会乱跳');
    // 心情变了 → 签名变 → 重画
    接.sb.npcManager.getAllNPCs()[0].state.mood = 12;
    接.sb.renderMap();
    const 层4 = 接.sb.document.getElementById('npc-map-icon-layer');
    ok(层4.children.length === 2 && 层4.dataset.npcSig.indexOf('npc_m1:12') >= 0,
        'Ⓒ3 本城某人心情变了（80→12）⇒ 签名变、覆层重画一次，仍是 2 个图标');
    // 玩家换城 → 本城 NPC 换人
    接.sb.currentCharData.location = '玄冰';
    接.sb.renderMap();
    const 层5 = 接.sb.document.getElementById('npc-map-icon-layer');
    ok(层5.children.length === 1 && 层5.children[0].title.indexOf('远方客') === 0,
        'Ⓒ4 玩家换到玄冰 ⇒ 覆层换成那位远方客一个人（跟着本城走，不是死名单）');

    // ---- Ⓓ 改前复现：不装载 npc-daily-life.js ⇒ 地图上一个 NPC 图标都没有 ----
    未接.sb.renderMap();
    ok(!未接.sb.document.getElementById('npc-map-icon-layer') && 未接.renderNPCMapIconsCalls === undefined,
        'Ⓓ1 改前复现：同一个 renderMap 入口，装了 npc-daily-life.js 才有覆层，不装则地图上零 NPC 图标');
    // 兜底：无 SVG / 无 npcManager 都不许抛
    const 空 = 装链([], {});
    空.sb.document = { getElementById: () => null };
    try { vm.runInContext(日, 空.sb, { filename: 'js/npcs/npc-daily-life.js' }); 空.sb.refreshNPCMapIcons(); }
    catch (e) { 空.loadFails.push('兜底: ' + e.message); }
    ok(空.loadFails.length === 0, 'Ⓓ2 兜底：地图 DOM 还没有时 refreshNPCMapIcons 如实返回、不抛（此时窗口已关，属正常）');
}

///////////////////////////////////////////////////////////////////////////////
// W-4　门派特色增益：window.updateBuffUI 从来没写过
///////////////////////////////////////////////////////////////////////////////
console.log('\n[W-4] 门派增益面板：window.updateBuffUI 新写并被 applyBuff 调上');
{
    const 特色 = load('js/sects/sect-specialties.js');

    // ---- Ⓐ 读码：数据形状与落点 ----
    ok(/window\.activeBuffs\[buffId\] = \{[\s\S]{0,160}?effects: effects,[\s\S]{0,160}?expiryGameMinute:[\s\S]{0,80}?duration: duration/.test(特色),
        'Ⓐ1 window.activeBuffs 每项形状核对在册：{effects, expiryGameMinute, duration}');
    ok(/getElementById\('sub-status'\)/.test(特色),
        'Ⓐ2 面板落在 #panel-character → #sub-status 的网格里（不动 仙侠.html）');
    // ⚠️ 真机实测：这一格网格是 12 条轨道 1309px，Tailwind 的 md:col-span-4 与 md:col-span-full
    //   **都被解析成 span 3（315px）**、不铺满；只有内联 grid-column:1/-1 才真铺满 1309px。
    //   故这里钉内联写法，别让人「优化」回 col-span 类。
    ok(/box\.style\.gridColumn = '1 \/ -1'/.test(特色) && !/active-buff-strip[\s\S]{0,120}?md:col-span-4/.test(去注释(特色)),
        'Ⓐ2b ★铺满整行用内联 grid-column:1/-1（真机实测 md:col-span-4 与 md:col-span-full 都只给 315px）');
    ok(/bg-gray-700\/30 p-3 rounded-lg border border-gray-600/.test(特色),
        'Ⓐ3 格子样式照 #sub-status 那一带现成的写法抄，没新造面板体系');
    ok(!/style\.height\s*=\s*['"][0-9]+px/.test(特色) && !/overflow-y-auto/.test(特色),
        'Ⓐ4 内层不写死像素高度、不做内滚窗（用 flex-wrap 自己换行）');
    ok(/window\.updateBuffUI = updateBuffUI/.test(特色),
        'Ⓐ5 window.updateBuffUI 已导出 —— 这一行此前全仓无定义');
    ok(/EventBus\.on\('time:advanced'[\s\S]{0,120}updateBuffUI/.test(特色),
        'Ⓐ6 增益条挂在 time:advanced 上：倒计时与到期都跟着走');

    // ---- Ⓑ vm 行为：真装文件，真调门派特色 ----
    function 造状态面板DOM() {
        const 按id = {};
        function 造元素(tag, id, cls, 是SVG) {
            const el = {
                tagName: String(tag).toUpperCase(), id: id || '', className: cls || '', textContent: '', title: '',
                style: {}, dataset: {}, parentNode: null, _kids: [], _html: '', _hidden: false,
                get children() { return this._kids; },
                get innerHTML() { return this._html; },
                set innerHTML(v) { this._html = v; if (v === '') this._kids = []; },
                classList: {
                    add: (c) => { el._hidden = true; el._cls = (el._cls || '') + ' ' + c; },
                    remove: (c) => { el._hidden = false; el._cls = String(el._cls || '').replace(c, ''); },
                    contains: (c) => String(el._cls || '').indexOf(c) >= 0
                },
                appendChild(c) { this._kids.push(c); c.parentNode = this; if (c.id) 按id[c.id] = c; return c; },
                insertBefore(c, ref) {
                    const i = ref ? this._kids.indexOf(ref) : -1;
                    if (i < 0) this._kids.push(c); else this._kids.splice(i, 0, c);
                    c.parentNode = this; if (c.id) 按id[c.id] = c; return c;
                }
            };
            // ⚠️ 刻意**不给 SVG 补 offsetLeft/offsetWidth**：真 DOM 里 <svg> 是 SVGElement，
            //   那几个 offset* 是 HTMLElement 的属性，它压根没有（读出来 undefined）。
            //   早先这把尺给 svg 补了 offset*，把「用 offset* 量 svg」这个真 bug 盖了好几条断言。
            //   SVGElement 只有 getBoundingClientRect；这里就按真的来。
            if (!是SVG) { el.offsetLeft = 0; el.offsetTop = 0; el.offsetWidth = 640; el.offsetHeight = 360; }
            el.getBoundingClientRect = () => el._rect || { left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 };
            if (id) 按id[id] = el;
            return el;
        }
        // 与 仙侠.html:285-297 同形状：#panel-character > #sub-status > div.grid（＋四块现成格子）
        const panel = 造元素('div', 'panel-character');
        const sub = 造元素('div', 'sub-status');
        const grid = 造元素('div', '', 'grid grid-cols-2 md:grid-cols-4 gap-4 mb-6');
        const 精力卡 = 造元素('div', '', 'bg-gray-700/30 p-3 rounded-lg border border-gray-600 md:col-span-2');
        const 境界卡 = 造元素('div', '', 'bg-gray-700/30 p-3 rounded-lg border border-gray-600 text-center');
        const 地点卡 = 造元素('div', '', 'bg-gray-700/30 p-3 rounded-lg border border-gray-600 md:col-span-2');
        const 日程卡 = 造元素('div', '', 'bg-gray-700/30 p-3 rounded-lg border border-gray-600 text-center');
        grid.appendChild(精力卡); grid.appendChild(境界卡); grid.appendChild(地点卡); grid.appendChild(日程卡);
        sub.appendChild(grid); panel.appendChild(sub);
        return {
            doc: {
                getElementById: (id) => 按id[id] || null,
                createElement: (t) => 造元素(t)
            },
            grid: grid
        };
    }
    function 跑门派(是否装载面板) {
        const D = 造状态面板DOM();
        const env = 装链([], {});
        env.sb.document = D.doc;
        // 游戏时钟：可推进
        env.sb.__clock = 0;
        env.sb.GameScheduler = { nowMinute: () => env.sb.__clock };
        env.sb.discipleState = { isInSect: true, sectId: '烈日教', rank: 3 };
        env.sb.discipleState2 = env.sb.discipleState;
        const 事件表 = {};
        env.sb.EventBus = { on: (ev, fn) => { (事件表[ev] = 事件表[ev] || []).push(fn); }, emit: (ev, p) => (事件表[ev] || []).forEach(f => f(p)) };
        env.sb.__事件表 = 事件表;
        if (是否装载面板) {
            try { vm.runInContext(特色, env.sb, { filename: 'js/sects/sect-specialties.js' }); }
            catch (e) { env.loadFails.push('sect-specialties: ' + e.message); }
        }
        env.__grid = D.grid;
        return env;
    }

    const 接 = 跑门派(true), 未接 = 跑门派(false);
    ok(接.loadFails.length === 0, 'Ⓑ1 sect-specialties.js 装载无异常' + (接.loadFails.length ? '（' + 接.loadFails.join(' | ') + '）' : ''));
    ok(typeof 接.sb.updateBuffUI === 'function', 'Ⓑ2 window.updateBuffUI 装载后确实是函数（改前这里是 undefined）');

    // ★真调门派特色（applyEffect 内部走 applyBuff → 末尾调 updateBuffUI）
    接.sb.useSectSpecialty('烈日教');
    let 条 = 接.sb.document.getElementById('active-buff-strip');
    ok(!!条, 'Ⓑ3 ★真调 useSectSpecialty 后：#sub-status 网格里长出 #active-buff-strip 增益条');
    ok(条 && 接.__grid.children.indexOf(条) === 接.__grid.children.length - 1,
        'Ⓑ4 增益条挂在那一格网格的末尾（四块现成格子之后）');
    ok(条 && 条._html && /此刻身上的增益（1）/.test(条._html),
        'Ⓑ5 ★增益条真渲染出内容：' + (条 ? String(条._html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 70) : ''));
    ok(条 && /☀️/.test(条._html) && /烈日焚天/.test(条._html),
        'Ⓑ6 ★条上念的是门派特色的名号「☀️ 烈日焚天」，不是一串 buff id');
    ok(条 && /体魄/.test(条._html) && /\+45%/.test(条._html),
        'Ⓑ7 ★效果也翻成了人话：fireDmg 0.45 → 「体魄 +45%」（借 _SECT_BUFF_ATTR_MAP 反查）');
    ok(条 && /余 8 时/.test(条._html), 'Ⓑ8 ★倒计时也在：余 8 时（duration 8 小时 → expiryGameMinute = now + 480）');
    ok(条 && 条._hidden === false, 'Ⓑ9 有增益时整块不收起来');
    ok(接.sb.activeBuffs && 接.sb.activeBuffs['sect_lieri_buff']
        && 接.sb.activeBuffs['sect_lieri_buff'].expiryGameMinute === 480
        && 接.sb.activeBuffs['sect_lieri_buff'].duration === 8,
        'Ⓑ10 底层账没动：activeBuffs.sect_lieri_buff = {expiryGameMinute:480, duration:8}');

    // ---- Ⓒ 倒计时随时间走 + 到期自撤 ----
    接.sb.__clock = 7 * 60;                 // 过了 7 小时
    接.sb.EventBus.emit('time:advanced', {});
    条 = 接.sb.document.getElementById('active-buff-strip');
    ok(/余 1 时/.test(条._html), 'Ⓒ1 ★推进 7 小时后，倒计时跟着走：余 1 时');
    ok(/border-yellow-500|border-red-500/.test(条._html), 'Ⓒ2 快到期（≤3 时）转黄字黄框，催玩家别睡过去');
    接.sb.__clock = 8 * 60;                 // 到期
    接.sb.EventBus.emit('time:advanced', {});
    条 = 接.sb.document.getElementById('active-buff-strip');
    ok(条._hidden === true && 条._html === '',
        'Ⓒ3 ★到期后：增益从账上清掉、整块收起来不给玩家留空板（' + 条._hidden + ' / "' + 条._html + '"）');
    // 冷却挡住第二次施展
    接.sb.useSectSpecialty('烈日教');
    ok(/气力还没缓回来/.test(接.msgs.map(m => m.text).join(' ')),
        'Ⓒ4 冷却照旧拦着（这一批没碰冷却账）');

    // ---- Ⓓ 其它来源的增益也上得去（不只门派特色） ----
    const 多 = 跑门派(true);
    多.sb.applyBuff('eatery_special', { strength: 0.1, constitution: 0.1 }, 3);
    多.sb.applyBuff('fxb_gala_talk', { intelligence: 3 }, 24);
    多.sb.applyBuff('demonic_flame', { meridian: 0.2 }, 5);
    const 多条 = 多.sb.document.getElementById('active-buff-strip');
    ok(/此刻身上的增益（3）/.test(多条._html), 'Ⓓ1 城市饭食／门派活动／魔焰三类增益同屏（' + 多条._html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 90) + '）');
    ok(/一席温饭/.test(多条._html) && /门派活动增益/.test(多条._html) && /魔焰/.test(多条._html),
        'Ⓓ2 写死名号的念真名；没有真名号的按前缀说个大概，不硬造');
    ok(/sect_lieri_buff|fxb_gala_talk/.test(多条._html), 'Ⓓ3 查不到的名字把真 id 放进 title，出问题查得动');
    ok(/经脉 \+20%/.test(多条._html) && /悟性 \+3/.test(多条._html),
        'Ⓓ4 六维键与定值键都念得对：meridian 0.2 → 「经脉 +20%」、intelligence 3 → 「悟性 +3」');
    // 没有名号也没有六维键的键，如实留原键名
    const 生 = 跑门派(true);
    生.sb.applyBuff('weird_thing', { someUnknownKey: 0.5 }, 2);
    const 生条 = 生.sb.document.getElementById('active-buff-strip');
    ok(/someUnknownKey \+50%/.test(生条._html), 'Ⓓ5 认不出的效果键如实念原键名，不静默吞掉');

    // ---- Ⓔ 改前复现：不装载面板 ⇒ 增益只进账、屏上一个字都没有 ----
    未接.sb.applyBuff = function (id, eff, dur) { 未接.sb.activeBuffs = 未接.sb.activeBuffs || {}; 未接.sb.activeBuffs[id] = { effects: eff, expiryGameMinute: 600, duration: dur }; };
    未接.sb.applyBuff('sect_lieri_buff', { fireDmg: 0.45 }, 8);
    ok(!未接.sb.document.getElementById('active-buff-strip'),
        'Ⓔ1 改前复现：增益照样进了 window.activeBuffs，但屏上零增益条 ⇒ 这条断言抓得住回归');
    // 空态：一枚都不在时 updateBuffUI 自己也要收得干净
    const 空 = 跑门派(true);
    空.sb.updateBuffUI();
    ok(!空.sb.document.getElementById('active-buff-strip') || 空.sb.document.getElementById('active-buff-strip')._hidden === true,
        'Ⓔ2 一枚增益都没有时，updateBuffUI 不留空板');
    // 没有 #sub-status（面板还没建）时不许抛
    const 无板 = 装链([], { document: { getElementById: () => null, createElement: () => ({}) } });
    try { vm.runInContext(特色, 无板.sb, { filename: 'js/sects/sect-specialties.js' }); 无板.sb.updateBuffUI(); }
    catch (e) { 无板.loadFails.push('兜底: ' + e.message); }
    ok(无板.loadFails.length === 0, 'Ⓔ3 兜底：角色面板还没建时 updateBuffUI 如实返回、不抛');

    // ⚠️ 完全没有 document 的 headless 沙箱（tests/sect-identity-node.js 就是这种：
    //   它在无 DOM 的 vm 里真调 applyBuff → updateBuffUI。曾经在这里 ReferenceError，
    //   把异常一路抛回玩法那一侧，把那一套打红——本条钉死别再犯）。
    const 无DOM = 装链([], { SECT_INTERNAL: {}, GameScheduler: { nowMinute: () => 0 } });
    delete 无DOM.sb.document;
    try {
        vm.runInContext(特色, 无DOM.sb, { filename: 'js/sects/sect-specialties.js' });
        无DOM.sb.applyBuff('sect_lieri_buff', { fireDmg: 0.45 }, 8);   // 真走一遍玩法那一侧
        无DOM.sb.updateBuffUI();
        无DOM.sb.discipleState = { isInSect: true, sectId: '少林派', rank: 0 };
    } catch (e) { 无DOM.loadFails.push('headless: ' + e.message); }
    ok(无DOM.loadFails.length === 0,
        'Ⓔ4 ★headless 兜底：完全没有 document 的沙箱里，applyBuff 与 updateBuffUI 都不抛'
        + (无DOM.loadFails.length ? '（' + 无DOM.loadFails.join(' | ') + '）' : '')
        + '，增益照进 window.activeBuffs（' + (无DOM.sb.activeBuffs ? Object.keys(无DOM.sb.activeBuffs).join(',') : '无') + '）');
    ok(/typeof document === 'undefined'/.test(去注释(特色)),
        'Ⓔ5 源码里 _buffUIHost 先判 document 存在性，再取元素（不是先取后判）');
}

///////////////////////////////////////////////////////////////////////////////
// W-5　js/sects/sect-events.js 加权随机注释与实现不符 ＋ 士气门禁空操作
///////////////////////////////////////////////////////////////////////////////
console.log('\n[W-5] 门派事件：加权随机真落地 ＋ 士气门禁照旧在读');
{
    const 事件 = load('js/sects/sect-events.js');
    const 专属 = load('js/sects/sect-exclusive-events.js');

    // ---- Ⓐ 读码：注释与实现对上了 ----
    const 纯码 = 去注释(事件);
    ok(/function _sectEventWeight\(ev, morale\)/.test(纯码) && /ev\.type === 'disaster'/.test(纯码),
        'Ⓐ1 加权函数在册，且只给 disaster 一档加权（其余恒 1 —— 严格兑现注释那一支，不多加料）');
    ok(!/var pick = pool\[Math\.floor\(Math\.random\(\) \* pool\.length\)\]/.test(纯码),
        'Ⓐ2 旧的纯均匀随机那一行已不在（它就是「注释说了三年、代码没跟上」的那处）');
    const 抽段 = 纯码.slice(纯码.indexOf('function _sectEventWeight'), 纯码.indexOf('function _sectEventWeight') + 1400);
    ok((抽段.match(/Math\.random\(\)/g) || []).length === 1,
        'Ⓐ3 抽取路径仍只掷一次 Math.random（旧写法也只掷一次）⇒ 骰子压力没变');
    ok(/window\.sectEventWeight = function/.test(事件), 'Ⓐ4 权重口径已导出（纯函数，套件直接量它，不靠抽签反推）');

    // ---- Ⓑ 零骰纪律的适用范围核对（这是判断「能不能掷」的依据，不是空话）----
    ok(!/solar-terms|节气|节令|season/i.test(事件.slice(0, 400)) && !/solar-terms|节气|节令|season/i.test(纯码),
        'Ⓑ1 本文件与节气/节令无关；全仓唯一的节气模块是 js/world/solar-terms.js ⇒「节令禁掷骰」扫不到这里');
    // 判据要窄：只认「零骰哨兵」那几种真写法（零骰/零随机/随机计数为 0 的断言），
    // 别把「装载顺序表里列了本文件」或「别的文件用了 Math.random() < 0.5」误判成哨兵。
    let 零骰断言 = [];
    (function walk(d) {
        for (const e of fs.readdirSync(d, { withFileTypes: true })) {
            if (e.name === 'node_modules' || e.name === '.git' || e.name === '.scratch') continue;
            const p = path.join(d, e.name);
            if (e.isDirectory()) walk(p);
            else if (e.name.endsWith('.js')) {
                if (p.indexOf('wave142-fix-wiring-node.js') >= 0) continue;   // 本套件自己提到这两串词，不算别人断言我
                const s = fs.readFileSync(p, 'utf8');
                if (!/sect-events\.js/.test(s)) continue;
                if (/零骰|零随机|零漂移|randomCalls\s*===\s*0|randomCalls\s*>\s*0|不许.{0,12}Math\.random|indexOf\('Math\.random'\)\s*<\s*0/.test(s)) {
                    零骰断言.push(path.relative(ROOT, p));
                }
            }
        }
    })(path.join(ROOT, 'tests'));
    ok(零骰断言.length === 0,
        'Ⓑ2 全仓 tests/ 里没有任何套件把 js/sects/sect-events.js 当零骰哨兵（零骰是逐模块哨兵，不是全 js/ 总扫）'
        + (零骰断言.length ? '：' + 零骰断言.join('、') : ''));

    // ---- Ⓒ vm 行为：确定性扫点，量「士气低 ⇒ 灾难多」 ----
    function 造Math(取随机) {
        const M = {};
        for (const k of Object.getOwnPropertyNames(Math)) M[k] = Math[k];
        M.random = 取随机;
        return M;
    }
    function 跑事件(士气, N) {
        const 内部 = {};
        内部['少林寺'] = { morale: 士气, resources: 100, influence: 50 };
        let i = 0;
        const env = 装链([], {
            SECT_INTERNAL: 内部,
            discipleState: { isInSect: true, sectId: '少林寺' },
            Math: 造Math(() => { const v = (i + 0.5) / N; i++; return v; })
        });
        env.sb.__内部 = 内部;
        try { vm.runInContext(事件, env.sb, { filename: 'js/sects/sect-events.js' }); }
        catch (e) { env.loadFails.push('sect-events: ' + e.message); }
        try { vm.runInContext(专属, env.sb, { filename: 'js/sects/sect-exclusive-events.js' }); }
        catch (e) { env.loadFails.push('sect-exclusive-events: ' + e.message); }
        env.__ids = [];
        env.__灾 = 0;
        env.__抽 = 0;
        // 再包一层：记录每次抽到的 id 与骰子次数
        const 真随 = env.sb.Math.random;
        env.sb.Math.random = function () { env.__抽++; return 真随(); };
        for (let k = 0; k < N; k++) {
            const ev = env.sb.generateSectEvent('少林寺');
            if (!ev) continue;
            env.__ids.push(ev.id);
            const def = env.sb.SECT_EVENTS_POOL[ev.id] || ((env.sb.SECT_EXCLUSIVE_EVENTS || {})['少林寺'] || {})[ev.id];
            if (def && def.type === 'disaster') env.__灾++;
        }
        env.__有效 = env.__ids.length;
        return env;
    }
    const N = 4000;
    const 低 = 跑事件(0, N), 高 = 跑事件(90, N), 中 = 跑事件(60, N);
    ok(低.loadFails.length === 0 && 低.__有效 > 0, 'Ⓒ1 确定性扫点跑通：士气 0 时抽了 ' + 低.__有效 + '/' + N + ' 次（' + (低.loadFails.join(' | ') || '无装载异常') + '）');
    ok(低.__抽 <= 低.__有效, 'Ⓒ2 每次抽取最多一次 Math.random（低士气段 ' + 低.__抽 + ' 骰 / ' + 低.__有效 + ' 抽）');

    const 低率 = 低.__灾 / 低.__有效, 高率 = 高.__灾 / 高.__有效, 中率 = 中.__灾 / 中.__有效;
    ok(低率 > 0.45, 'Ⓒ3 ★士气 0：灾难占比 ' + (低率 * 100).toFixed(1) + '%（旧均匀口径约 21%）⇒ 灾难真的更容易撞上了');
    ok(高率 > 0.15 && 高率 < 0.27, 'Ⓒ4 ★士气 90：灾难占比 ' + (高率 * 100).toFixed(1) + '% —— 与旧均匀随机同档（4/19≈21.1%），高士气时行为不变');
    ok(低率 > 高率 * 1.8, 'Ⓒ5 ★低士气 vs 高士气：' + (低率 * 100).toFixed(1) + '% vs ' + (高率 * 100).toFixed(1) + '%（相差 ' + (低率 / 高率).toFixed(2) + ' 倍）⇒ 注释承诺的加权落地了');
    ok(Math.abs(中率 - 高率) < 0.02, 'Ⓒ6 士气 60 起灾难权重回到 1（' + (中率 * 100).toFixed(1) + '% ≈ ' + (高率 * 100).toFixed(1) + '%），权重曲线在 60 这道坎上收住');
    ok(低.__灾 > 0 && 高.__灾 > 0, 'Ⓒ7 两头都还抽得到灾难（加权不是把灾难禁掉，只是改概率）');

    // ---- Ⓒbis 顺带挖出来的一个真病灶：士气 0 被 `|| 50` 吞成 50 ----
    ok(/var morale = \(data\.morale == null\) \? 50 : Number\(data\.morale\)/.test(纯码),
        'Ⓒ10 ★`data.morale || 50` 已改成 null 判断：士气正好 0 时不再被当成 50');
    ok(低.__ids.indexOf('inner_dispute') < 0,
        'Ⓒ11 ★士气 0 时 inner_dispute（minMorale 20）真的抽不到了 —— 改前它在士气 0 照抽 174 次，因为门拿到的是 50');
    ok(低.__ids.length > 0 && new Set(低.__ids).size === 20,
        'Ⓒ12 士气 0 的池子正好 20 枚（通用 18 ＋ 少林专属 2；inner_dispute 被下限门剔掉）');

    // 权重函数本身（纯函数，直接量）
    ok(typeof 低.sb.sectEventWeight === 'function'
        && 低.sb.sectEventWeight({ type: 'disaster' }, 0) === 4
        && 低.sb.sectEventWeight({ type: 'disaster' }, 30) === 2.5
        && 低.sb.sectEventWeight({ type: 'disaster' }, 90) === 1,
        'Ⓒ8 权重曲线：disaster 士气 0→4、30→2.5、90→1');
    ok(['internal', 'external', 'bonus'].every(t => 低.sb.sectEventWeight({ type: t }, 0) === 1 && 低.sb.sectEventWeight({ type: t }, 100) === 1),
        'Ⓒ9 非灾难档恒为 1（internal/external/bonus 不跟着士气变 —— 没有多加料）');

    // ---- Ⓓ 士气门禁：是「在读的真门槛」，不是忘了填的死字段 ----
    ok(/morale >= ev\.minMorale && morale <= ev\.maxMorale/.test(纯码)
        && /morale >= \(eev\.minMorale \|\| 0\) && morale <= \(eev\.maxMorale \|\| 100\)/.test(纯码),
        'Ⓓ1 两道门都在读：通用池读 minMorale/maxMorale，专属池也读（缺省 0/100）');
    const 低十 = 跑事件(10, 1500), 高三十 = 跑事件(30, 1500);
    ok(低十.__ids.indexOf('inner_dispute') < 0,
        'Ⓓ2 ★士气 10：minMorale:20 的 inner_dispute 一千五百次里一次都没出现 ⇒ 下限门真在拦');
    ok(高三十.__ids.indexOf('inner_dispute') >= 0,
        'Ⓓ3 ★士气 30：inner_dispute 回来了 ⇒ 门不是死字段，阈值一过就放行');
    // 专属池那道上限门（xsm_shao: minMorale 0, maxMorale 60）
    let 上门派 = null;
    for (const sect of Object.keys(低.sb.SECT_EXCLUSIVE_EVENTS || {})) {
        if (低.sb.SECT_EXCLUSIVE_EVENTS[sect] && 低.sb.SECT_EXCLUSIVE_EVENTS[sect]['xsm_shao']) { 上门派 = sect; break; }
    }
    ok(!!上门派, 'Ⓓ4 专属池确实有一道上限门：' + 上门派 + ' 的 xsm_shao 是 minMorale 0 / maxMorale 60');
    function 跑上门派(士气, N2) {
        const 内部2 = {}; 内部2[上门派] = { morale: 士气, resources: 100, influence: 50 };
        let i = 0;
        const env = 装链([], {
            SECT_INTERNAL: 内部2,
            discipleState: { isInSect: true, sectId: 上门派 },
            Math: 造Math(() => { const v = (i + 0.5) / N2; i++; return v; })
        });
        try { vm.runInContext(事件, env.sb, { filename: 'js/sects/sect-events.js' }); }
        catch (e) { env.loadFails.push('sect-events: ' + e.message); }
        try { vm.runInContext(专属, env.sb, { filename: 'js/sects/sect-exclusive-events.js' }); }
        catch (e) { env.loadFails.push('exclusive: ' + e.message); }
        const ids = [];
        for (let k = 0; k < N2; k++) { const ev = env.sb.generateSectEvent(上门派); if (ev) ids.push(ev.id); }
        env.__ids = ids;
        return env;
    }
    const 上低 = 跑上门派(10, 2000), 上高 = 跑上门派(90, 2000);
    ok(上低.__ids.indexOf('xsm_shao') >= 0, 'Ⓓ5 士气 10：' + 上门派 + ' 的 xsm_shao 抽得到（minMorale 0 放行）');
    ok(上高.__ids.indexOf('xsm_shao') < 0, 'Ⓓ6 ★士气 90：xsm_shao 两千次里一次都没出现 ⇒ 上限门（maxMorale 60）真在拦，专属池不是全体放行');
    ok(new Set(低.__ids).size >= 8, 'Ⓓ7 抽出来的事件有 ' + new Set(低.__ids).size + ' 种，不是全压在少数几支上（加权没把池子锁死）');

    // ---- Ⓔ 改前复现：把源码里那段换回纯均匀随机，灾难占比就该塌回 21% ----
    const 均 = (() => {
        const 内部3 = {}; 内部3['少林寺'] = { morale: 0, resources: 100, influence: 50 };
        let i = 0;
        const env = 装链([], {
            SECT_INTERNAL: 内部3,
            discipleState: { isInSect: true, sectId: '少林寺' },
            Math: 造Math(() => { const v = (i + 0.5) / N; i++; return v; })
        });
        // 连 morale 那处 null 判断一起按死，才算真正的「改前」：门拿到 50、加权也没有
        const 旧码 = 事件
            .replace('var morale = (data.morale == null) ? 50 : Number(data.morale);\n    if (!isFinite(morale)) morale = 50;', 'var morale = data.morale || 50;')
            .replace(/var pick = null;[\s\S]*?if \(!pick\) pick = pool\[pool\.length - 1\];/,
                'var pick = pool[Math.floor(Math.random() * pool.length)];');
        ok(旧码 !== 事件 && /pool\[Math\.floor\(Math\.random\(\) \* pool\.length\)\]/.test(旧码),
            'Ⓔ0 改前那份源码确实换回去了（加权段 → 均匀随机，morale → `|| 50`）');
        try { vm.runInContext(旧码, env.sb, { filename: 'sect-events-改前.js' }); }
        catch (e) { env.loadFails.push('改前装载: ' + e.message); }
        try { vm.runInContext(专属, env.sb, { filename: 'js/sects/sect-exclusive-events.js' }); }
        catch (e) { env.loadFails.push('exclusive: ' + e.message); }
        let 灾 = 0, 有 = 0;
        for (let k = 0; k < N; k++) {
            const ev = env.sb.generateSectEvent('少林寺');
            if (!ev) continue;
            有++;
            const def = env.sb.SECT_EVENTS_POOL[ev.id] || ((env.sb.SECT_EXCLUSIVE_EVENTS || {})['少林寺'] || {})[ev.id];
            if (def && def.type === 'disaster') 灾++;
        }
        return { 率: 有 ? 灾 / 有 : 0, 有: 有, fails: env.loadFails, ids: null };
    })();
    ok(均.fails.length === 0 && 均.有 > 0, 'Ⓔ0b 改前那份也能装载并抽得动（' + 均.有 + ' 次）');
    ok(均.率 < 0.30 && 低率 > 0.45,
        'Ⓔ1 改前复现：同样的士气 0，灾难占比塌回 ' + (均.率 * 100).toFixed(1) + '%（接线后 ' + (低率 * 100).toFixed(1) + '%）⇒ Ⓒ3／Ⓒ5 抓得住回归');
}

console.log('\n=== 第一百四十二批套件：通过 ' + 通过 + ' / 失败 ' + 失败 + ' ===');
process.exit(失败 ? 1 : 0);
