// 第一百三十九批 · 问不到账时不许站点自己断言满包（DES-90 尾巴）
// 原因账 window.addItemFailReason 全局一条，addItem 只在「一件也没收」时落 'bag_full'。
// 于是两档站点问不到账：① 半包档（0 < added < count）账上不落笔；② 死账档（从句支拿空串、
// 或全局账被 passTime 里别人的发货刷走）。这两档里站点自己写「行囊已满」＝对玩家撒谎。
// 本批把全仓回退文案换成只说事实、不说原因的四形词表，并拆掉站点散文里自己写死的容量断言。
// 尺的写法照 wave138：ok() 辅助、vm 沙箱装载、[A]~[E] 分段、退出码判红。
// ⚠️ 只扫字符串字面量：不扫注释、不扫 JS 标识符。上一轮代理就是被「扫到注释里的词」坑死的。
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');

let 通过 = 0, 失败 = 0;
function ok(cond, msg) {
    if (cond) { 通过++; console.log('  \u2713 ' + msg); }
    else { 失败++; console.log('  [FAIL] ' + msg); }
}
function load(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
function 有(rel) { return fs.existsSync(path.join(ROOT, rel)); }

// ============ 字面量尺（本批核心：只扫字符串字面量，不扫注释、不扫标识符）============
// 跳过注释与标识符的法子：逐字符扫，遇到引号就整段跳过（含转义与模板字符串的 ${}），
// 遇到 // 与 /* */ 也整段跳过；剩下的裸字符里才判词。这样注释里写的「行囊已满」不会误伤，
// 变量名 addItemFailReason 也不会被当成字符串。
function 跳串(src, i) {
    const q = src[i]; i++;
    while (i < src.length) {
        if (src[i] === '\\') { i += 2; continue; }
        if (q === '`' && src[i] === '$' && src[i + 1] === '{') {
            let d = 1; i += 2;
            while (i < src.length && d > 0) { if (src[i] === '{') d++; else if (src[i] === '}') d--; i++; }
            continue;
        }
        if (src[i] === q) return i;
        i++;
    }
    return i;
}
function 字面命中(src, 词) {
    let 命中 = 0, 行号 = 1, 最后行 = 1;
    const 文件 = {};
    for (let i = 0; i < src.length; i++) {
        const c = src[i];
        if (c === '\n') { 行号++; 最后行 = 行号; continue; }
        if (c === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); if (i < 0) break; continue; }
        if (c === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i); if (i < 0) break; i += 1; continue; }
        if (c === '"' || c === "'" || c === '`') {
            const 起 = i + 1, 止 = 跳串(src, i);
            for (let k = 起; k <= 止 - 词.length; k++) {
                if (src.slice(k, k + 词.length) === 词) { 命中++; 文件[最后行] = (文件[最后行] || 0) + 1; k += 词.length - 1; }
            }
            i = 止; 最后行 = 行号; continue;
        }
    }
    return { 命中, 文件 };
}
function 全仓扫(词, 排除文件) {
    let 总 = 0; const 文件 = {};
    (function 走(dir) {
        fs.readdirSync(path.join(ROOT, dir)).forEach(name => {
            const p = path.join(dir, name);
            if (fs.statSync(path.join(ROOT, p)).isDirectory()) { if (name !== 'node_modules') 走(p); return; }
            if (!/\.js$/.test(name)) return;
            if (排除文件 && 排除文件.test(p)) return;
            const r = 字面命中(load(p), 词);
            if (r.命中) { 总 += r.命中; 文件[p] = r.命中; }
        });
    })('js');
    return { 总, 文件 };
}
// 改前复现用的字面替换：把一段旧串换成新串，返回改后的源。找不到就抛——锚点变了探针得跟着改。
function 改一处(src, 锚, 旧, 新) {
    const i = src.indexOf(锚);
    if (i < 0) throw new Error('改前复现失败：找不到锚「' + 锚 + '」');
    const j = src.indexOf(旧, i);
    if (j < 0) throw new Error('改前复现失败：「' + 锚 + '」之后找不到待改的「' + 旧 + '」');
    return src.slice(0, j) + 新 + src.slice(j + 旧.length);
}

// ============ ⓪ 在册（3 枚）============
console.log('\n[⓪] 四形词表与说话手本体都在');
{
    const 四形 = ['这一件先还留在原处', '它没有跟你走', '这一件没能交到你手上', '没能落进你的行囊'];
    四形.forEach(s => {
        const r = 全仓扫(s);
        ok(r.总 >= 1, '⓪-' + (四形.indexOf(s) + 1) + ' 形词「' + s + '」在 js/ 字面量里还有 ' + r.总 + ' 处（不许把功能撤了来骗过尺）：'
            + Object.keys(r.文件).slice(0, 4).join('、'));
    });
    const 手 = ['window.addItemFailTextFor', 'window.addItemReasonTextFor', 'window.addItemFailPhraseFor', 'window.addItemReasonPhraseFor',
        'window.addItemFailText', 'window.addItemReasonText', 'window.addItemFailPhrase', 'window.addItemReasonPhrase'];
    const inv = load('js/inventory.js');
    手.forEach(s => ok(inv.indexOf(s) >= 0, '⓪-说话手导出仍在：' + s));
    const bagFullLines = inv.split('\n').filter(l => /return '行囊已满，先腾个格子再来/.test(l));
    ok(bagFullLines.length === 3 && bagFullLines[0].includes('。') && bagFullLines[1].includes('。') && !bagFullLines[2].includes('。'),
        '⓪-bag_full 三行原样在（' + bagFullLines.length + ' 行：2541/2554 带句号、2582 不带）');
}

// ============ A 黑话尺 R3（全仓尺，只扫字符串字面量，不扫注释／标识符）============
console.log('\n[A] R3 黑话尺：玩家屏上不许出现内部账务黑话');
{
    // A1 这一笔没落进账
    const r1 = 全仓扫('这一笔没落进账');
    ok(r1.总 === 0, 'A1「这一笔没落进账」在 js/ 字面量里 0 命中（实测 ' + r1.总 + '）');
    // A2 落进账（内部名 addItemFailReason 不许漏给玩家）
    const r2 = 全仓扫('落进账');
    ok(r2.总 === 0, 'A2「落进账」0 命中（实测 ' + r2.总 + '；这是把 addItemFailReason 内部名漏给玩家的口子）');
    // A3 不好乱猜 / 缘由不一
    // 「不好乱猜」全仓 0（旧的站点散文断言，已撤）。
    const r3a = 全仓扫('不好乱猜');
    ok(r3a.总 === 0, 'A3a「不好乱猜」0 命中（实测 ' + r3a.总 + '）');
    // 「缘由不一」要排除 js/inventory.js：那是从句支 failPhraseFor 按契约返回的字符串
    // （wave138 的 A5 已把它钉成合法返回值：一堆货掺账就说「各件缘由不一」）。
    // 它与 A4 排除 inventory.js 是同一类道理——说话手本体按契约产出的，不是站点自己写死的黑话；
    // A3 量的是「站点散文里不许自己写黑话」。反向自证见 A3c。
    const r3b = 全仓扫('缘由不一', /js[\\/]inventory\.js$/);
    const r3bAll = 全仓扫('缘由不一');
    ok(r3b.总 === 0, 'A3b「缘由不一」0 命中（排除 js/inventory.js 后实测 ' + r3b.总 + '；'
        + '排除掉的：' + (r3bAll.总 > 0 ? Object.keys(r3bAll.文件).join('、') + '（' + r3bAll.总 + ' 处，从句支契约返回值，本批不许撤）' : '无'));
    // 反向自证：放回 inventory.js，从句支那一支应命中 1
    const invInv = load('js/inventory.js');
    const invHits = 字面命中(invInv, '缘由不一');
    ok(invHits.命中 === 1, 'A3c 反向自证：把 js/inventory.js 放回扫描范围，从句支那支「缘由不一」应命中 1（实测 '
        + invHits.命中 + '）——证明 A3b 的排除不是因为尺坏了');
    // A4 腾个格子再来 —— 必须把 js/inventory.js 排除掉
    // 理由（写在测试里，免得下一个人当放水）：inventory.js 那三行 bag_full 是「说话手本体有账、
    // 照实说是对的」，与「没账不许这么说」是两回事。A4 量的是「没账的站点不许自己断言满包」，
    // 所以只对全仓扫、不许让有账的本体误伤。A5 再把 inventory.js 放回来反向自证尺没坏。
    const r4 = 全仓扫('腾个格子再来', /js[\\/]inventory\.js$/);
    const r4all = 全仓扫('腾个格子再来');   // 不排除，只用于报告「排除掉了谁」
    ok(r4.总 === 0, 'A4「腾个格子再来」0 命中（排除 js/inventory.js 后实测 ' + r4.总 + ' 处；'
        + '排除掉的：' + (r4all.总 > 0 ? Object.keys(r4all.文件).join('、') + '（' + r4all.总 + ' 处，说话手本体有账，照实说是对的）' : '无'));
    // A5 反向自证：把 inventory.js 放回扫描范围，那三行应命中 3 处
    const r5 = 全仓扫('行囊已满，先腾个格子再来');
    const invKey = Object.keys(r5.文件).find(k => /inventory\.js$/.test(k));
    ok(r5.总 === 3 && r5.文件[invKey] === 3,
        'A5 反向自证：把 js/inventory.js 放回扫描范围，「行囊已满，先腾个格子再来」应命中 3 处（实测 '
        + r5.总 + '，其中 inventory.js ' + (r5.文件[invKey] || 0) + '）——证明 A4 的排除不是因为尺坏了');
}

// ============ C 事实 vs 断言 的分界（本批核心判据）============
// 这七枚合起来证明：R1 只禁「没账时自己断言容量」，不禁「有真数字时陈述事实」。
console.log('\n[C] 事实 vs 断言：有真数字时陈述事实，一律放行');
{
    // C1 compound-ui.js:227 —— res.asked - res.count 真算
    const c1 = load('js/crafting/compound-ui.js');
    const c1idx = c1.indexOf('行囊只吞得下这些');
    ok(c1idx >= 0, 'C1 js/crafting/compound-ui.js 的「行囊只吞得下这些」原样在（索引 ' + c1idx
        + '；它是 res.asked - res.count 真算出来的，不是断言）');
    // C2 app.js:8987 附近 —— got < count 真算
    const c2 = load('js/app.js');
    const c2idx = c2.indexOf('行囊只吞得下这些');
    ok(c2idx >= 0, 'C2 js/app.js 的「行囊只吞得下这些」原样在（索引 ' + c2idx
        + '；它是 got < count 真算出来的，不是断言）');
    // C3 sect-war.js:412 / :611 —— 两处，真算
    const c3 = load('js/sects/sect-war.js');
    const c3a = c3.indexOf('兽核只塞得下');
    const c3b = c3.indexOf('兽核只塞得下', c3a + 1);
    ok(c3a >= 0 && c3b >= 0, 'C3 js/sects/sect-war.js 的「兽核只塞得下」原样在两处（索引 ' + c3a + '/' + c3b
        + '；它是 核收.got < cores 真算出来的，不是断言）');
    // C4 landmark-explore.js:403 —— 收.got < 收.count 真算
    const c4 = load('js/map/landmark-explore.js');
    const c4idx = c4.indexOf('行囊只塞得下');
    ok(c4idx >= 0, 'C4 js/map/landmark-explore.js 的「行囊只塞得下」原样在（索引 ' + c4idx
        + '；它是 收.got < 收.count 真算出来的，不是断言）');
    // C5 city-depth.js:232 —— 丹.got / 丹.count 真算
    const c5 = load('js/city-depth.js');
    const c5idx = c5.indexOf('你接住 ');
    ok(c5idx >= 0, 'C5 js/city-depth.js 的「你接住 」原样在（索引 ' + c5idx
        + '；它是 丹.got 与 丹.count 真算出来的，不是断言）');
    // C6 beast-taming.js:886 —— 兽的技能格子上限（combatAbilities.length >= 2），不是行囊容量
    const c6 = load('js/beast-taming.js');
    const c6idx = c6.indexOf('兽脑装不下了');
    ok(c6idx >= 0, 'C6 js/beast-taming.js 的「兽脑装不下了」原样在（索引 ' + c6idx
        + '；它是 combatAbilities.length >= 2 的兽技能格子上限，与行囊容量无关，不是 R1 射程内的断言）');
    // C7 sect-governance.js:453 / :474 —— 贡献流水账备注，中性陈述
    const c7 = load('js/sects/sect-governance.js');
    const c7a = c7.indexOf('退单（货没处放）');
    const c7b = c7.indexOf('退单（货没处放）', c7a + 1);
    ok(c7a >= 0 && c7b >= 0, 'C7 js/sects/sect-governance.js 的「退单（货没处放）」原样在两处（索引 '
        + c7a + '/' + c7b + '；它是贡献流水账的 addC 备注，中性陈述，不是对玩家的容量断言）');
}

// ============ B 断言原因尺 R1（全仓尺，只扫字符串字面量）============
// 这五枚合起来证明：R1 只禁「没账时站点自己断言容量」，不禁「有账时照实说」（见 B5 控制组）。
console.log('\n[B] R1 断言原因尺：没账时站点不许自己断言行囊满了');
{
    const b1a = 全仓扫('你行囊装不下');
    const b1b = 全仓扫('行囊装不下');
    const b1c = 全仓扫('怀里搁不下');
    const b1d = 全仓扫('背包装不下');
    ok(b1a.总 === 0 && b1b.总 === 0 && b1c.总 === 0 && b1d.总 === 0,
        'B1 四形 0 命中：你行囊装不下=' + b1a.总 + ' 行囊装不下=' + b1b.总 + ' 怀里搁不下=' + b1c.总 + ' 背包装不下=' + b1d.总
        + '（怀里搁不下命中的文件：' + (Object.keys(b1c.文件).join('、') || '无') + '；'
        + '行囊装不下命中的文件：' + (Object.keys(b1b.文件).join('、') || '无') + '）');
    // B2 行囊塞不下
    const b2 = 全仓扫('行囊塞不下');
    ok(b2.总 === 0, 'B2「行囊塞不下」0 命中（实测 ' + b2.总 + '；命中的文件：' + (Object.keys(b2.文件).join('、') || '无')
        + '——注：js/map/randomMap.js:2738 那句是注释里的死人账说明，尺跳过注释，不算命中）');
    // B3 腾不出手接
    const b3 = 全仓扫('腾不出手接');
    ok(b3.总 === 0, 'B3「腾不出手接」0 命中（实测 ' + b3.总 + '；命中的文件：' + (Object.keys(b3.文件).join('、') || '无')
        + '——注：city-depth.js:172 与 sect-trials.js:168 那两句是改后的注释说明，尺跳过注释，不算命中）');
    // B4 装不下你的行囊
    const b4 = 全仓扫('装不下你的行囊');
    ok(b4.总 === 0, 'B4「装不下你的行囊」0 命中（实测 ' + b4.总 + '）');
    // B5 控制组：inventory.js 那三行 bag_full 断言必须原样在 —— 证明 B 段认得出
    // 「有账时照实说」与「没账时自己断言容量」的区别，不是把有账的一并禁掉。
    const inv2 = load('js/inventory.js');
    const b5a = inv2.indexOf("if (reason === 'bag_full') return '行囊已满，先腾个格子再来。';");
    const b5b = inv2.indexOf("if (reason === 'bag_full') return '行囊已满，先腾个格子再来。';", b5a + 1);
    const b5c = inv2.indexOf("if (reason === 'bag_full') return '行囊已满，先腾个格子再来';");
    ok(b5a >= 0 && b5b >= 0 && b5c >= 0 && b5c !== b5a,
        'B5 控制组：js/inventory.js 三行 bag_full 断言原样在（带句号两处索引 ' + b5a + '/' + b5b
        + '、不带句号一处索引 ' + b5c + '）——证明 B 段只禁「没账时自己断言容量」，不禁「有账时照实说」');
}

// ============ D 改前复现（必须真回打一次，证明尺不是同义反复）============
// ⚠️ 绝对不许污染真实工作树：把源文件复制到临时目录再改，改完 cmp 证还原后 byte-exact。
console.log('\n[D] 改前复现：把旧串写回去，同一把尺必须报红');
{
    // D1 landmark-explore.js：把回退文案按字面写回旧串，跑 A1 那把尺
    const 旧文件 = 'js/map/landmark-explore.js';
    const 原源 = load(旧文件);
    const 旧串 = '这一件先还留在原处。';
    const 回退串 = '这一笔没落进账，缘由不好乱猜。';
    const 改后源 = 改一处(原源, '这一件先还留在原处。', 旧串, 回退串);
    if (改后源 === 原源) throw new Error('D1 改前复现锚点变了：' + 旧文件 + ' 找不到「这一件先还留在原处。」');
    const 临时目录 = path.join(ROOT, '.scratch', 'wave139-sandbox');
    fs.mkdirSync(临时目录, { recursive: true });
    const 临时文件 = path.join(临时目录, 'landmark-explore.js');
    fs.writeFileSync(临时文件, 改后源);
    const d1 = 字面命中(fs.readFileSync(临时文件, 'utf8'), '这一笔没落进账');
    ok(d1.命中 >= 1, 'D1 把 js/map/landmark-explore.js 的回退文案按字面写回「这一笔没落进账，缘由不好乱猜。」，'
        + 'A1 那把尺在沙箱副本上必须报 ≥1（实测 ' + d1.命中 + '）');
    fs.unlinkSync(临时文件);
    const 还原后 = load(旧文件);
    ok(还原后 === 原源, 'D1 沙箱副本已删，真实工作树 byte-exact 未污染（' + 旧文件 + ' 长度 ' + 还原后.length + '）');

    // D2 world-events.js：把散文「却怀里搁不下」按字面写回，跑 B1 那把尺
    const 旧文件2 = 'js/world-events.js';
    const 原源2 = load(旧文件2);
    const 旧串2 = '又放回地上：';
    const 回退串2 = '却怀里搁不下：';
    const 改后源2 = 改一处(原源2, '又放回地上：', 旧串2, 回退串2);
    if (改后源2 === 原源2) throw new Error('D2 改前复现锚点变了：' + 旧文件2 + ' 找不到「又放回地上：」');
    const 临时文件2 = path.join(临时目录, 'world-events.js');
    fs.writeFileSync(临时文件2, 改后源2);
    const d2 = 字面命中(fs.readFileSync(临时文件2, 'utf8'), '怀里搁不下');
    ok(d2.命中 >= 1, 'D2 把 js/world-events.js 的散文按字面写回「却怀里搁不下」，B1 那把尺在沙箱副本上必须报 ≥1（实测 '
        + d2.命中 + '）');
    fs.unlinkSync(临时文件2);
    const 还原后2 = load(旧文件2);
    ok(还原后2 === 原源2, 'D2 沙箱副本已删，真实工作树 byte-exact 未污染（' + 旧文件2 + ' 长度 ' + 还原后2.length + '）');
    try { fs.rmdirSync(临时目录); } catch (e) {}
}

// ============ E 行为闸 vm（把 js/inventory.js 那一段真装进沙箱真调）============
// 说话手**不在测试里另抄一份措辞**——直接从 js/inventory.js 切那一段真装。抄一份就会与真源各说各话，
// 那正是本批要防的病（站点自己写死一句，与账上真话各说各话）。
console.log('\n[E] 行为闸：把 js/inventory.js 说话手真装进沙箱，量它到底回哪句话');
const 说话手段 = (function () {
    const 源 = load('js/inventory.js');
    const 起 = 源.indexOf('// DES-90（第一百二十八批）：发奖回执要说');
    const 止 = 源.indexOf('// ============ 第八十三波·实例账');
    if (起 < 0 || 止 < 0 || 止 <= 起) throw new Error('js/inventory.js 的说话手那一段没切到——锚点变了，探针要跟着改');
    return 源.slice(起, 止);
})();
function 造窗(源) {
    const W = { console: { log: function () { }, warn: function () { }, error: function () { } } };
    W.window = W; W.globalThis = W;
    vm.createContext(W);
    vm.runInContext(源, W, { filename: 'js/inventory.js#说话手' });
    return W;
}
{
    const W = 造窗(说话手段);
    // E1 账为 null（半包档：账上压根没落笔）⇒ 从句支回中性句，且**不带句号**（它会被钉进括号里）
    W.addItemFailReason = null;
    const e1 = W.addItemReasonPhrase('某物');
    ok(e1 === '没能落进你的行囊', 'E1 账为 null 时 addItemReasonPhrase 回「' + e1 + '」——中性句，不替行囊断言原因，且不带句号（从句支契约）');
    // E2 账为 bag_full（零收档：真落笔了）⇒ 句尾支照实说，带句号。**本批不许削掉这一句。**
    W.addItemFailReason = 'bag_full';
    const e2 = W.addItemFailText('某物');
    ok(e2 === '行囊已满，先腾个格子再来。', 'E2 账为 bag_full 时 addItemFailText 回「' + e2 + '」——有账就照实说，带句号（句尾位契约）');
    // E3 no_template：两支都点名「百宝册上查无此号」，且明说不怪行囊
    // ⚠️ 真源那句是「在百宝册**上**查无此号」（带「上」）。我第一版把尺写成「百宝册查无此号」漏了那个字，
    // 于是 E3 假红——**改的是我的尺，不是生产码**。这一条留在这里当学费。
    W.addItemFailReason = 'no_template';
    const e3a = W.addItemFailText('某物'), e3b = W.addItemReasonText('某物');
    ok(/百宝册上查无此号/.test(e3a) && /不是你的行囊满了/.test(e3a) && /百宝册上查无此号/.test(e3b) && /不是你的行囊满了/.test(e3b),
        'E3 账为 no_template 时两支都点名「百宝册查无此号」并明说不怪行囊：Text=「' + e3a + '」／Reason=「' + e3b + '」');
    // E4 反向自证：把 bag_full 那一支拆掉（改沙箱副本，不碰真文件）⇒ E2 那句话不再出现 ⇒ 尺是活的
    const 残段 = 说话手段.split("if (reason === 'bag_full') return '行囊已满，先腾个格子再来。';").join("if (reason === 'bag_full') return '';");
    ok(残段 !== 说话手段, 'E4 沙箱副本已把 bag_full 那一支改成 return 空串（改动 ' + (说话手段.length - 残段.length) + ' 字符，真文件未碰）');
    const W2 = 造窗(残段);
    W2.addItemFailReason = 'bag_full';
    const e4 = W2.addItemFailText('某物');
    ok(e4 === '' || !/行囊已满/.test(e4), 'E4 拆掉 bag_full 那一支后，账写着 bag_full 也回不出「行囊已满」（实测「' + e4 + '」）——证明 E2 那句是账给的，不是写死的');
    // E5 掺账与顺序无关（照 wave138 的 A5b）：全同一笔才点名，掺账只说「各件缘由不一」
    const W3 = 造窗(说话手段);
    const e5a = W3.addItemFailPhraseFor(['bag_full', 'bag_full'], '某物');
    const e5b = W3.addItemFailPhraseFor(['bag_full', null], '某物');
    const e5c = W3.addItemFailPhraseFor([null, 'bag_full'], '某物');
    ok(/行囊已满/.test(e5a) && e5b === e5c && /各件缘由不一/.test(e5b),
        'E5 掺账答与顺序无关：全同一笔回「' + e5a + '」；掺账 [bag_full,null]=「' + e5b + '」／[null,bag_full]=「' + e5c + '」（两序同答）');
}

// ============ F helper 边界棘轮（补第一百三十八批 E4 看不穿的那一层）============
// 病：某个 helper 的返回值是「句尾带圆点」那一支，而它的调用点把这个结果拼进
//     **句子中段或括号里** ⇒ 屏上读成「…再来。这一回…」／「…再来。）」＝破句（DES-97）。
// 第一百三十八批的 E4 只检查 addItem*Text( **紧后面**跟什么字符，**看不穿 helper 的边界**，
// 本批就在这一层抓到 5 个漏网的（app.js:_退回行囊／city-depth.js:货没处放／
// core/daily-events.js:_de原因／sects/sect-governance.js:支原因／quest/qi-arc2.js:_石没处放＋qi-arc3.js:收着话）。
console.log('\n[F] helper 边界棘轮：返回句尾支的 helper 不许被拼进句子中段/括号');
{
    // F1 找出所有「函数体里 return 了句尾支」的 helper
    const 名单 = [];
    (function 走(dir) {
        fs.readdirSync(path.join(ROOT, dir)).forEach(name => {
            const p = dir + '/' + name;
            if (fs.statSync(path.join(ROOT, p)).isDirectory()) { if (name !== 'node_modules') 走(p); return; }
            if (!/\.js$/.test(name)) return;
            if (p === 'js/inventory.js') return;   // 说话手本体：它按契约就是要产句尾支
            const s = load(p);
            const re = /function\s+([A-Za-z_$\u4e00-\u9fa5][\w$\u4e00-\u9fa5]*)\s*\([^)]*\)\s*\{/g;
            let m;
            while ((m = re.exec(s))) {
                const 起 = s.indexOf('{', m.index);
                let d = 0, 止 = 起;
                for (; 止 < s.length; 止++) { if (s[止] === '{') d++; else if (s[止] === '}') { d--; if (d === 0) break; } }
                const 体 = s.slice(起, 止 + 1).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
                if (/return[\s\S]{0,240}?(?:[A-Za-z_$][\w$.]*\.)?addItem(?:Fail|Reason)Text(?:For)?\(/.test(体)) 名单.push({ 名: m[1], 文件: p });
            }
        });
    })('js');
    const 名集 = [...new Set(名单.map(x => x.名))];

    // F2 逐个查调用点：结果后面紧跟标点/右括号，或前面是「+」接续 ⇒ 中段位
    const 破 = [];
    for (const 名 of 名集) {
        (function 走(dir) {
            fs.readdirSync(path.join(ROOT, dir)).forEach(name => {
                const p = dir + '/' + name;
                if (fs.statSync(path.join(ROOT, p)).isDirectory()) { if (name !== 'node_modules') 走(p); return; }
                if (!/\.js$/.test(name)) return;
                load(p).split(/\r?\n/).forEach((l, i) => {
                    const c = l.replace(/\/\/.*$/, '');
                    const idx = c.indexOf(名 + '(');
                    if (idx < 0) return;
                    if (/function\s+$/.test(c.slice(0, idx))) return;      // 定义行
                    const close = c.indexOf(')', idx);
                    if (close < 0) return;
                    const 前 = c.slice(Math.max(0, idx - 4), idx);
                    const 后 = c.slice(close + 1);
                    if (/^\s*[，。）、；]/.test(后) || /\+\s*$/.test(前)) {
                        破.push(p + ':' + (i + 1) + ' helper=' + 名 + ' → ' + c.trim().slice(0, 90));
                    }
                });
            });
        })('js');
    }
    ok(破.length === 0, 'F1/F2 返回句尾支的 helper（' + 名集.length + ' 个：' + 名集.join('、')
        + '）被拼进中段/括号的点位＝' + 破.length + ' 处，门槛 0'
        + (破.length ? '（现破：' + 破.slice(0, 5).join(' ｜ ') + '）' : '（已全部改为从句支 addItemFailPhrase／…PhraseFor）'));

    // F3 反向自证：把尺指向一个**已知合规**的形态，它必须报 0——证明 F2 不是恒真
    const 合规 = [
        ['js/city-depth.js', 'function 货没处放(收) {', 'addItemFailPhrase'],
        ['js/sects/sect-governance.js', 'function 支原因(收) {', 'addItemFailPhrase'],
        ['js/quest/qi-arc2.js', 'function _石没处放(收) {', 'addItemFailPhrase'],
        ['js/quest/qi-arc3.js', 'function 收着话(收, 许话, 没着话) {', 'addItemFailPhrase'],
        ['js/core/daily-events.js', 'function _de原因(收) {', 'addItemFailPhrase'],
    ];
    const 没换干净的 = 合规.filter(([f, 锚, 支]) => {
        const s = load(f);
        const i = s.indexOf(锚);
        if (i < 0) return true;
        return !s.slice(i, i + 600).includes(支);
    });
    ok(没换干净的.length === 0, 'F3 反向自证：本批改过的 ' + 合规.length
        + ' 个 helper 都已改吃从句支 addItemFailPhrase（' + 合规.map(x => x[1].split('(')[0].replace('function ', '')).join('、')
        + '）' + (没换干净的.length ? '；未换干净：' + 没换干净的.map(x => x[0]).join('、') : ''));
}

console.log('\n' + (失败 === 0 ? '全部通过' : '有 ' + 失败 + ' 条失败') + '：' + 通过 + ' 通过 / ' + 失败 + ' 失败');
process.exit(失败 === 0 ? 0 : 1);