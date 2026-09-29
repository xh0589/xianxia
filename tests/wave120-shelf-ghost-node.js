// wave120-shelf-ghost-node.js — 第一百二十批 · 货架幽灵货闸门（DES-63）
// 病：柜台把「物品表里查无此物」的字面 id 当货卖，购买路径还有一条兜底分支替它手写一枚
//     有名字、没模板的死格子——钱收了，货谁也认不出、用不了。坊市限时特供那枚「修为丹」就是现行犯。
// 尺分两层：[A] 把真 buyItem 从文件里切出来在 vm 里跑（幽灵货买不动 + 真货照旧买得动）；
//            [B] 静态抽各条货架的字面 id 对物品库点验（含自注册文件，防止把已接线的判成幽灵）。
// 口径沿用第 72 波教训：尺必须读仓库真文件，不许自带物品表抄件。
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const load = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let pass = 0, fail = 0;
function ok(cond, name) {
    if (cond) { pass++; console.log('  ✓ ' + name); }
    else { fail++; console.log('  ✗ ' + name); }
}

// ============ 真物品库（运行时装载）+ 自注册文件的补充口径 ============
const w = {};
const sb = {
    window: w,
    console: { log() { }, warn() { }, error() { } },
    document: { getElementById: () => null, querySelector: () => null, addEventListener() { }, readyState: 'loading' },
    localStorage: { getItem: () => null, setItem() { } }, setTimeout: () => 0
};
vm.createContext(sb);
const ORDER = [
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
const loadFails = [];
for (const f of ORDER) { try { vm.runInContext(load(f), sb, { filename: f }); } catch (e) { loadFails.push(f + ': ' + e.message); } }
ok(loadFails.length === 0, '⓪ 物品库装载无异常' + (loadFails.length ? '（' + loadFails.join(' | ') + '）' : ''));
const LIB = Object.assign(Object.create(null), w.itemById || {});
// 有些文件自己往 itemById 注册（阵石/奇遇物/偃师件）——离线装载代价高，这里按声明抽其 id 并入并集，
// 免得把「其实已接线」的货判成幽灵。抽的是那些文件里的 `id: 'x'` 字面量。
const SELF_REG = ['js/extensions/formation-system.js', 'js/extensions/qiyu-encounters.js', 'js/extensions/puppet-system.js',
    'js/quest/qi-arc2.js', 'js/quest/qi-arc3.js', 'js/sects/sect-internal.js'];
let 自注册数 = 0;
for (const f of SELF_REG) {
    for (const m of load(f).matchAll(/\bid:\s*'([a-z0-9_]+)'/g)) {
        if (!LIB[m[1]]) { LIB[m[1]] = { id: m[1], _fromDecl: f }; 自注册数++; }
    }
}
ok(Object.keys(w.itemById || {}).length >= 400 && 自注册数 >= 8,
    '⓪b 尺看得见 ' + Object.keys(LIB).length + ' 枚模板（运行时 ' + Object.keys(w.itemById || {}).length + ' ＋ 自注册声明 ' + 自注册数 + '）');
// 自证支：这把尺确实在读仓库真文件——拿一枚只在 js/items.js 出现的 id 与一枚只可能来自真表的中文名
ok(!!(w.itemById && w.itemById.foundation_pill && w.itemById.foundation_pill.name === '筑基丹'),
    '⓪c 自证支：尺读到的「筑基丹」来自仓库真物品表（不是自带抄件）');
// 自证支②：本案的现行犯必须确实不在库里（否则 B1 的红闸是空闸）
ok(!LIB.exp_pill && !LIB.exp_potion && !LIB.energy_pill, '⓪d 自证支：exp_potion／exp_pill／energy_pill 三枚在全库口径下查无此物');

// ============ [A] 闸门行为层：把真 buyItem 切出来在 vm 里跑 ============
const SHOP = load('js/enhanced-shop.js');
function sliceMethod(src, sig) {
    const at = src.indexOf(sig);
    if (at < 0) return null;
    let i = src.indexOf('{', at), depth = 0, end = -1;
    for (; i < src.length; i++) {
        const c = src[i];
        if (c === '{') depth++;
        else if (c === '}') { depth--; if (!depth) { end = i; break; } }
    }
    return end < 0 ? null : src.slice(src.indexOf('{', at) + 1, end);
}
const BODY = sliceMethod(SHOP, 'buyItem(itemId, quantity = 1)');
ok(!!BODY && BODY.length > 800, 'A0 切片成功：从 js/enhanced-shop.js 切出真 buyItem（' + (BODY || '').length + ' 字）');
ok(/拿不出真货/.test(BODY || '') && /!window\.itemById\[realId\]/.test(BODY || ''),
    'A0b 闸门那一笔在切片里（不是我以为写了，是文件里真有）');

function 买一次(货, 有模板) {
    const msgs = [];
    const slots = new Array(12).fill(null);
    const run = new Function('showMessage', 'window', 'gameLog', '"use strict";return function buyItem(itemId, quantity = 1){' + BODY + '}');
    const ctx = {
        inventory: [货],
        getItemPrice() { return 货.price || 100; },
        name: '测试柜'
    };
    const win = {
        inventory: { currency: { spiritStones: 1000 }, slots: slots },
        itemById: 有模板 ? { real_mat: { id: 'real_mat', name: '真料', stackable: true, maxStack: 99 } } : {},
        currentCharData: { spiritStones: 1000 },
        // v24.2 补桩：真实环境 window.addItem 恒在（inventory.js:2520 无条件导出），
        // 旧沙箱漏了它、真货全靠在兜底里手写裸格子买成——那正是 FIX-01 的病根本体。
        // 兜底已铲（v24.2-bare-write-root 棘轮钉死），这里照 regression-node 同款补真桩：
        // 有空格就落一格、回实收件数；满包回 0。为迁就残缺 mock 保留病写法是本末倒置。
        addItem(id, n) {
            for (let i = 0; i < slots.length; i++) {
                if (!slots[i]) { slots[i] = { templateId: id, count: n || 1, uid: 'stub_' + id, getTemplate() { return this; } }; return n || 1; }
            }
            return 0;
        }
    };
    const r = run((m) => msgs.push(m), win, { add() { } }).call(ctx, 货.id, 1);
    return { r, msgs, 付了: 1000 - win.inventory.currency.spiritStones, 格子: slots.filter(Boolean).length };
}
{
    const 幽灵 = 买一次({ id: 'exp_potion', name: '修为丹', basePrice: 180 }, false);
    ok(幽灵.r === false && 幽灵.付了 === 0, 'A1 幽灵货买不动：返回假、灵石分文未付（实付 ' + 幽灵.付了 + '）');
    ok(幽灵.格子 === 0, 'A2 而且没往背包里手写死格子（旧版正是这里凭空多出一格，实得 ' + 幽灵.格子 + ' 格）');
    ok(/拿不出真货/.test(幽灵.msgs.join('|')), 'A3 回执讲的是「拿不出真货」，不是骗人的「背包已满」');
    const 真货 = 买一次({ id: 'real_mat', name: '真料', basePrice: 100 }, true);
    ok(真货.r === true && 真货.付了 > 0 && 真货.格子 === 1,
        'A4 自紧闸：真货照旧买得动——付 ' + 真货.付了 + ' 灵石、入袋 1 格（闸门没把正常买卖一起堵死）');
    const 售罄 = 买一次({ id: 'exp_potion', name: '修为丹', basePrice: 180, stock: 0 }, false);
    ok(/已售罄/.test(售罄.msgs.join('|')), 'A5 旧闸顺序未动：售罄那一关仍在闸门之前（先讲卖完，再讲虚标）');
}

// ============ [B] 静态点验各条货架 ============
function 抽(src, re) { return [...new Set([...src.matchAll(re)].map(m => m[1]))]; }
function 点验(名, rel, re, 期望数) {
    const ids = 抽(load(rel), re);
    const 缺 = ids.filter(id => !LIB[id]);
    ok(ids.length >= (期望数 || 1) && 缺.length === 0,
        名 + '：抽到 ' + ids.length + ' 枚' + (缺.length ? ' → 查无此物 ' +缺.join(',') : '，全部在库') + '（' + rel + '）');
    return ids;
}
{
    const 池段 = SHOP.slice(SHOP.indexOf('const specialPool'), SHOP.indexOf('];', SHOP.indexOf('const specialPool')));
    const 池 = 抽(池段, /\{\s*id: '([a-z0-9_]+)',/g);
    ok(池.length === 5 && 池.every(id => LIB[id]),
        'B1 坊市限时特供池现读 5 件且全在库（原 6 件里那枚 exp_potion 已撤，实得 ' + 池.length + '：' + 池.join(',') + '）');
    ok(!/exp_potion/.test(SHOP.slice(SHOP.indexOf('const specialPool'), SHOP.indexOf('const picks'))),
        'B1b 红闸：谁把 exp_potion 再摆回特供池，这里当场红');
    点验('B2 黑市常备 BLACK_GOODS', 'js/enhanced-shop.js', /\{\s*id: '(special_[a-z0-9_]+)', name/g, 6);
    点验('B3 全店货单字面行', 'js/enhanced-shop.js', /\{\s*id: '([a-z0-9_]+)', name: '[^']*', type: '[^']*', basePrice/g, 40);
    点验('B4 游商货池', 'js/app.js', /^\s*\{ id: '([a-z0-9_]+)', name: '[^']*', icon:[^\n]*basePrice/gm, 8);
    点验('B5 贡献兑换 itemId', 'js/app.js', /itemId: '([a-z0-9_]+)'/g, 20);
    点验('B6 黄金宫·珍珠货架', 'js/city-depth.js', /\{\s*id: '([a-z0-9_]+)', name: '[^']*', price/g, 3);
    点验('B7 门派来访货架', 'js/sects/sect-visit.js', /\{\s*id: '([a-z0-9_]+)', name: '[^']*', price/g, 7);
}
{
    // 翻译表：旧货名 → 真模板。目标查无此物＝死键；本案只准减少不准增加（钉死现存两枚，防白名单变垃圾桶）
    const m = SHOP.match(/const idMap = \{([\s\S]*?)\};/);
    const 目标 = m ? [...new Set([...m[1].matchAll(/:\s*'([a-z0-9_]+)'/g)].map(x => x[1]))] : [];
    const 死键 = 目标.filter(t => !LIB[t]).sort();
    ok(死键.length <= 2 && 死键.every(k => ['energy_pill', 'exp_pill'].indexOf(k) >= 0),
        'B8 翻译表死键只减不增（现读 ' + 死键.length + ' 枚：' + 死键.join(',') + '——已立案，闸门已让它卖不出去）');
    ok(死键.length !== 目标.length, 'B8b 大多数翻译目标仍在库（尺不是全红的那种废尺）');
}
{
    // B9 游戏自己那把尺：js/core/content-validator.js 在同一语境里跑，报红必须为 0
    w.allRecipes = w.allRecipes || [];
    try { vm.runInContext(load('js/core/content-validator.js'), sb, { filename: 'content-validator.js' }); } catch (e) { }
    const rep = w.CONTENT_VALIDATION_REPORT || null;
    ok(!!rep && rep.counts.errors === 0,
        'B9 仓库自带的内容校验器报红 0（实得 errors=' + (rep ? rep.counts.errors : '尺没跑起来') +
        '，warnings=' + (rep ? rep.counts.warnings : '?') + '）')
}
console.log('\n========== 第一百二十批 · 货架幽灵货闸门 ==========');
console.log('通过：' + pass + '　失败：' + fail);
process.exit(fail ? 1 : 0);
