// 第一百三十七批 · 共用件不许知道自己在哪个宿主里（公共空态卡原先只在这三家才长得像卡片）
// 病根（读码定位＋真 Chrome 复验）：styles/ui-craft.css 那 7 条 .x-empty* 规则头全部写着
//   `:is(#game-world, #shop-modal-overlay, .x-arena-modal) .x-empty…`。
//   这是一份「谁记得登记谁才有衣服穿」的名单，补的是**已知的弹窗**，不是**弹窗这一类**。
// 现场：js/sects/sects-system.js:862-902 的门派任务窗 document.body.appendChild 一枚手搓模态，
//   className 与竞技台那一扇只差一个类名 token（js/gameplay/arena-system.js:156 有 x-arena-modal，门派那扇没有），
//   两张空态卡（:754「没有在办的差事」／:785「可接的差事」）于是渲染成没边框、没字号层次的裸文字。
// 改：把整串宿主前缀拆掉，只留 .x-empty* 自己（见 styles/ui-craft.css 第 9 节注释）。
// 手法：形状账走样式表与源码普查；改前复现＝把前缀加回去、用同一把尺量四处宿主签名（跑在字符串里，不是玩家屏幕现场）。
// 屏证：真 Chrome 见 .scratch/probe-137-屏证-门派任务空态-改前.png／-改后.png。
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
function eq(actual, expected, msg) {
    ok(actual === expected, msg + '（实际=' + JSON.stringify(actual) + ' 期望=' + JSON.stringify(expected) + '）');
}
function load(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
// 注释里写到的类名与前缀不算规则（本批的 css 注释正复述着那串被拆掉的名单）
const 去注释 = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

// 选择器列表只在括号外分逗号：`:is(#a, #b, .c) .x-empty` 是一条，不能拆成三截
function 拆选择器(文本) {
    const 出 = [];
    let 深 = 0, 当前 = '';
    for (const ch of 文本) {
        if (ch === '(') 深++;
        else if (ch === ')') 深--;
        if (ch === ',' && 深 === 0) { 出.push(当前); 当前 = ''; continue; }
        当前 += ch;
    }
    出.push(当前);
    return 出;
}

// 扫一份 css，返回「命中这些类名的规则头」清单
function 规则头(css原文, 类名集) {
    const 命中 = [];
    const 重 = /[^{}]+\{/g;
    let m;
    const css文本 = 去注释(css原文);
    while ((m = 重.exec(css文本))) {
        拆选择器(m[0].slice(0, -1)).forEach(s => {
            const 选 = s.replace(/\s+/g, ' ').trim();
            if (!选 || /^@/.test(选)) return;
            if (类名集.some(c => new RegExp('\\.' + c + '(?![\\w-])').test(选))) 命中.push(选);
        });
    }
    return 命中;
}

// 这一族类名从产出方现扫，不写死：产出方改类名，本套件当场找不到
const 件源 = load('js/core/empty-state.js');
const 类名集 = Array.from(new Set((件源.match(/x-empty[\w-]*/g) || []))).sort();

// 「这条规则头认不认这个宿主」——把选择器拆成「宿主部分＋组件部分」，宿主部分为空即通吃
function 宿主吃得到(规则头文本, 宿主签名) {
    let 最前 = -1;
    类名集.forEach(c => {
        const i = 规则头文本.search(new RegExp('\\.' + c + '(?![\\w-])'));
        if (i >= 0 && (最前 < 0 || i < 最前)) 最前 = i;
    });
    const 前 = 最前 < 0 ? '' : 规则头文本.slice(0, 最前).trim();
    if (!前) return true;                                   // 无前缀＝任何宿主
    const is名单 = (前.match(/:is\(([^)]*)\)/g) || []).join('|');
    const 标记 = (前 + is名单).match(/[#.][\w-]+/g) || [];
    return 标记.some(t => 宿主签名.indexOf(t) >= 0);
}

const 宿主 = {
    '城里面板（#game-world 之内）': '#game-world',
    '商店弹窗（body 上，id+class 都有）': '#shop-modal-overlay .shop-modal-overlay fixed inset-0 z-50',
    '竞技台弹窗（body 上，靠一个类名挂号）': '.x-arena-modal fixed inset-0 z-50',
    '门派任务弹窗（body 上，没挂号）': 'fixed inset-0 bg-black/70 flex items-center justify-center z-50'
};

const css路径 = 'styles/ui-craft.css';
const css现 = load(css路径);

console.log('\n[⓪] 组件在册：产出方交出什么类名');
(function () {
    ok(/window\.xEmptyHtml\s*=/.test(件源) && /window\.renderXEmpty\s*=/.test(件源),
        'empty-state.js 交出 xEmptyHtml 与 renderXEmpty 两个出口');
    ok(类名集.length >= 5, '现扫到 ' + 类名集.length + ' 枚 x-empty* 类名：' + 类名集.join(', '));
    ok(!/getElementById|localStorage|Math\.random/.test(件源),
        '空态件不读 DOM、不落盘、不掷骰——只呈现调用方算好的事实');
})();

console.log('\n[A] 宿主自由：.x-empty* 的规则头一条都不认宿主');
(function () {
    const 头 = 规则头(css现, 类名集);
    ok(头.length >= 7, '空态样式仍由 ui-craft.css 一处发全（实际 ' + 头.length + ' 条规则头）');
    const 认宿主 = 头.filter(h => /#|:is\(|\bbody\b|x-arena-modal|shop-modal/.test(h));
    eq(认宿主.join(' | '), '', '每条规则头都不带 id、不带 :is() 名单、不带别家类名');
    const 漏描 = 类名集.filter(c => !头.some(h => new RegExp('\\.' + c + '(?![\\w-])').test(h)));
    eq(漏描.join(', '), '', '现扫到的每一枚类名都在样式表里有规则（漏一枚就是那一句裸文字）');
    ok(!/\.x-empty[^{]*\{[^}]*!important/.test(css现.replace(/\n\s*/g, ' ')),
        '不用 !important 兜底（靠类名本身站住，不靠抬高优先级）');
})();

console.log('\n[B] 改前复现：把白名单加回去，同一把尺读到「门派任务这一家没衣服穿」');
(function () {
    const 白名单 = ':is(#game-world, #shop-modal-overlay, .x-arena-modal) ';
    const 改前css = css现.replace(/(^|\n)(\.x-empty[\w-]*)/g, '$1' + 白名单 + '$2');
    ok(改前css.indexOf(白名单) > 0, '复现成功：前缀已加回（跑在字符串里，不是玩家屏幕现场）');
    const 判 = css文本 => {
        const 头 = 规则头(css文本, 类名集);
        return Object.keys(宿主).filter(k => !头.every(h => 宿主吃得到(h, 宿主[k])));
    };
    const 裸 = 判(改前css), 穿 = 判(css现);
    eq(裸.join(','), '门派任务弹窗（body 上，没挂号）',
        '改前读数：三家里有衣服穿，只有门派任务这一窗读到 false——它不在名单上，那两张卡就是裸文字');
    eq(穿.join(','), '', '改后读数：同一组宿主全部吃得到，包括从未挂号的门派任务那一扇');
    ok(裸.length === 1 && 穿.length === 0 && 宿主[裸[0]] !== undefined,
        '控制：改前改后吃的是同一组宿主、同一把尺——差别只在那串前缀本身');
})();

console.log('\n[C] 产出点普查：全仓有多少张卡指望着这条规则');
(function () {
    const 文件 = [];
    (function 走(d) {
        fs.readdirSync(path.join(ROOT, d)).forEach(f => {
            const 全 = path.join(ROOT, d, f);
            if (fs.statSync(全).isDirectory()) { if (f !== '.scratch' && f !== 'node_modules') 走(path.join(d, f)); }
            else if (f.endsWith('.js')) 文件.push(path.join(d, f).replace(/\\/g, '/'));
        });
    })('js');
    const 点 = [];
    文件.forEach(rel => {
        if (rel === 'js/core/empty-state.js') return;
        load(rel).split('\n').forEach((line, n) => {
            if (/typeof\s+(window\.)?renderXEmpty/.test(line)) return;   // 兜底判据不是产出
            if (/\bxEmptyHtml\s*\(|\brenderXEmpty\s*\(/.test(line)) 点.push(rel + ':' + (n + 1));
        });
    });
    eq(点.length, 17, '产出点恰好 17 处（新增一处就重数：它自动有衣服穿，但宿主签名要记进 [B]）');
    const 有门派 = 点.filter(p => p.indexOf('js/sects/sects-system.js') === 0);
    eq(有门派.join(','), 'js/sects/sects-system.js:800,js/sects/sects-system.js:831',
        '本批那两张卡就在门派任务窗里：800 没有在办的差事／831 可接的差事（第一百三十八批挪 8；v25.1 门派簇在文件上方补退门粘性/名录归一等行，再各往下挪 37）');
    const 弹窗户 = 点.filter(p => /^(js\/enhanced-shop\.js|js\/gameplay\/arena-system\.js|js\/sects\/sects-system\.js)/.test(p));
    eq(弹窗户.length, 6, '落在 body 弹窗里的产出点 6 处——旧名单只登记了两家，另两家（门派）从没上过榜');
})();

console.log('\n[D] 特异度自证：拆了前缀之后，还有没有别的规则盖得住卡内的 <p>');
(function () {
    const 威胁 = [];
    fs.readdirSync(path.join(ROOT, 'styles')).filter(f => f.endsWith('.css')).forEach(f => {
        const 重 = /[^{}]+\{/g; let m;
        const 文本 = 去注释(load('styles/' + f));
        while ((m = 重.exec(文本))) {
            拆选择器(m[0].slice(0, -1)).forEach(s => {
                s = s.replace(/\s+/g, ' ').trim();
                if (/#[a-zA-Z][\w-]*\s/.test(s) && /(^|\s)p$/.test(s)) 威胁.push(f + ' :: ' + s);
            });
        }
    });
    eq(威胁.join(' | '), 'panel-inventory.css :: #panel-inventory .inv-coin > p',
        '全仓能压住卡内 <p> 的 id 级规则只此一枚（(1,1,1)＞(0,1,0)）——新增一枚就要回来看空态卡');
    ok(!/xEmptyHtml|renderXEmpty/.test(load('js/inventory.js')),
        '而那一枚的作用域是金币筹码 .inv-coin，它根本不产出空态卡——所以拆前缀不会把卡压回裸文字');
    const 别家 = fs.readdirSync(path.join(ROOT, 'styles')).filter(f =>
        f.endsWith('.css') && 规则头(load('styles/' + f), 类名集).length);
    eq(别家.join(','), 'ui-craft.css', '这张卡的样式全仓只有一处真相，别家没有第二份私有副本');
})();

console.log('\n[E] 真跑产出方：吐出来的 class 全部在样式表里在册');
(function () {
    const sandbox = { window: {} };
    sandbox.globalThis = sandbox;
    vm.createContext(sandbox);
    vm.runInContext(件源, sandbox, { filename: 'empty-state.js' });
    const html = sandbox.window.xEmptyHtml({
        title: '没有在办的差事', why: '差事由门派按境界与职级派发', next: '下一步：去【可接的差事】挑一单',
        hints: ['今天还发得出 3 单'], fill: true
    });
    const 带的类 = Array.from(new Set((html.match(/class="([^"]+)"/g) || [])
        .join(' ').replace(/class="|"/g, '').split(/\s+/).filter(Boolean))).sort();
    ok(带的类.length > 0 && 带的类.every(c => /^x-empty/.test(c)),
        '产出方不夹带任何 Tailwind 兜底类（元素上只有 x-empty*：' + 带的类.join(' ') + '）');
    const 头 = 规则头(css现, 类名集);
    const 无样式 = 带的类.filter(c => !头.some(h => new RegExp('\\.' + c + '(?![\\w-])').test(h)));
    eq(无样式.join(', '), '', '屏上出现的每一枚类名都有规则接得住（这才是「不靠挂号也不裸」的正向证据）');
    ok(/<div class="x-empty x-empty--fill">/.test(html), 'fill 开关只加一个修饰类，宿主不参与拼装');
    const 门派签名 = 宿主['门派任务弹窗（body 上，没挂号）'];
    eq(宿主吃得到('.x-empty', 门派签名) + '|' + 宿主吃得到(':is(#game-world) .x-empty', 门派签名), 'true|false',
        '尺子会红：同一家宿主，无前缀读 true、随手加一枚前缀立刻读 false——绿灯不是恒真的');
})();

console.log('\n[F] 控制组：这把尺不是一刀切反前缀');
(function () {
    const 地图 = load('styles/panel-map.css');
    ok(/#city-panel \.city-group:not\(\[open\]\)/.test(去注释(地图)),
        '城市名册折叠态仍写着 #city-panel 前缀——那是那个面板的私有件，锁在自家宿主是对的');
    ok(/#panel-settings \.text-amber-600\\\/80\s*\{/.test(去注释(css现)),
        '设置页那枚琥珀色也仍带宿主前缀（改的是「共用件」，不是「所有前缀」）');
})();

console.log('\n[G] 接线：门派那一扇不需要为这张卡改一行代码');
(function () {
    const 门派 = load('js/sects/sects-system.js');
    ok(/document\.body\.appendChild\(modal\)/.test(门派), '门派任务窗照旧挂在 body 上（本批没动它的宿主）');
    const 竞技 = load('js/gameplay/arena-system.js');
    ok(/x-arena-modal/.test(竞技), '竞技台那扇的类名钩子留着（它自己的样式还要用），只是不再替空态卡挂号');
})();

console.log('\n' + (失败 ? '[FAIL] ' : '[OK] ') + 'wave137-xempty-host-free：' + 通过 + ' 通过 / ' + 失败 + ' 失败');
process.exit(失败 ? 1 : 0);
