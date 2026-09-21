/**
 * v21.8-experience-node.js — 体验小件批验收：
 *   Q1 字号调节：设置面板三档（标准/大/特大），根 font-size 放缩全局生效，偏好随删档保留
 *   Q2 打字机跳过：场景演出逐字文案点一下即显全文（按钮点击不抢行为、令牌链不双写、监听不泄漏）
 *   Q3 后期敌人多样性：亚型池 5 级封顶/词缀 8 级封顶的老账——金丹往后五十多级新增五张面孔五种名号
 *
 * 运行：node tests/v21.8-experience-node.js
 */
'use strict';

var path = require('path');
var fs = require('fs');
var vm = require('vm');

var ROOT = path.resolve(__dirname, '..');
function loadScript(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

var passed = 0, failed = 0;
function ok(cond, label) {
    if (cond) passed++;
    else { failed++; console.log('[FAIL] ' + label); }
}

// ==================== Q1 字号调节 ====================
console.log('\n[Q1] 界面字号三档');
(function () {
    var html = loadScript('仙侠.html');
    ok(/id="font-scale-normal"/.test(html) && /id="font-scale-large"/.test(html) && /id="font-scale-huge"/.test(html),
        'Q1 设置面板该有标准/大/特大三颗按钮');
    ok(/onclick="setFontScale\('large'\)"/.test(html), 'Q1 按钮直连 setFontScale');
    ok(html.indexOf('界面字号') >= 0 && html.indexOf('选完立刻生效并记住') >= 0, 'Q1 设置项有说明文案（产品语言）');
    var appSrc = loadScript('js/app.js');
    ok(/applyFontScale\(\);/.test(appSrc.slice(appSrc.indexOf('function initSettings'), appSrc.indexOf('// v20.5 传闻性格失真开关'))),
        'Q1 启动读档即应用字号（initSettings 接线）');
    ok(/FONT_SCALE_PX = \{ normal: '', large: '18px', huge: '20px' \}/.test(appSrc), 'Q1 三档刻度钉死（根 font-size 放缩）');

    // 运行时：抽取 v21.8 字号段跑桩世界
    var seg = appSrc.slice(appSrc.indexOf('// ==================== v21.8 字号调节'), appSrc.indexOf('window.setFontScale = setFontScale;') + 40);
    var btns = {
        'font-scale-normal': { className: '' }, 'font-scale-large': { className: '' }, 'font-scale-huge': { className: '' }
    };
    var stored = {};
    var msgs = [];
    var FW = {
        console: { log: function () {} }, Math: Math, JSON: JSON, Object: Object, Array: Array, String: String, Number: Number,
        document: {
            documentElement: { style: {} },
            getElementById: function (id) { return btns[id] || null; }
        },
        localStorage: { setItem: function (k, v) { stored[k] = v; }, getItem: function (k) { return stored[k] || null; } },
        showMessage: function (t) { msgs.push(String(t)); }
    };
    FW.window = FW;
    FW._settings = {};
    vm.createContext(FW);
    vm.runInContext(seg, FW, { filename: 'font-scale' });
    FW.setFontScale('huge');
    ok(FW.document.documentElement.style.fontSize === '20px', 'Q1 特大档根字号 20px（Tailwind rem 全局跟着伸缩）');
    ok(JSON.parse(stored['xianxia_settings']).fontScale === 'huge', 'Q1 偏好写进 xianxia_settings（与其他设置同一份，删档不清）');
    ok(btns['font-scale-huge'].className.indexOf('bg-yellow-600') >= 0 && btns['font-scale-normal'].className.indexOf('bg-gray-700') >= 0,
        'Q1 当前档位按钮高亮、其余回落（所见即所选）');
    ok(msgs.some(function (m) { return m.indexOf('特大') >= 0 && m.indexOf('记住') >= 0; }), 'Q1 切换有产品话回执');
    FW.setFontScale('large');
    ok(FW.document.documentElement.style.fontSize === '18px', 'Q1 大档 18px');
    FW.setFontScale('不存在的档');
    ok(FW.document.documentElement.style.fontSize === '', 'Q1 非法档回落标准（根字号交还默认）');
    // 读档即生效
    FW._settings = { fontScale: 'huge' };
    FW.document.documentElement.style.fontSize = '';
    FW.applyFontScale();
    ok(FW.document.documentElement.style.fontSize === '20px', 'Q1 applyFontScale 按存档偏好复现（重进游戏不丢）');
})();

// ==================== Q2 打字机跳过 ====================
console.log('\n[Q2] 点一下，全文即显');
(function () {
    // 桩世界：虚拟时钟 + 捕获式点击监听登记
    var clock = 0, timers = [], listeners = [];
    var SW = {
        console: { log: function () {}, warn: function () {} },
        Math: Math, JSON: JSON, Object: Object, Array: Array, String: String, Number: Number, isFinite: isFinite,
        setTimeout: function (fn, ms) { timers.push({ fn: fn, at: clock + (ms || 0) }); return timers.length; },
        document: {
            createElement: function () { return { style: {}, textContent: '' }; },
            getElementById: function () { return null; },
            head: { appendChild: function () {} },
            body: { appendChild: function () {} },
            addEventListener: function (ev, fn, cap) { if (ev === 'click') listeners.push({ fn: fn, cap: !!cap }); },
            removeEventListener: function (ev, fn) { listeners = listeners.filter(function (l) { return l.fn !== fn; }); }
        }
    };
    SW.window = SW;
    vm.createContext(SW);
    vm.runInContext(loadScript('js/quest/scene-performance.js'), SW, { filename: 'scene-performance' });
    ok(typeof SW.typewriterEffect === 'function', 'Q2 typewriterEffect 导出在案');

    function tick(ms) {
        // 虚拟时钟按到期时刻逐个跑：链式 setTimeout 以「上一个到期时刻」为基准续排
        var target = clock + ms;
        var guard = 0;
        while (guard++ < 100000) {
            timers.sort(function (a, b) { return a.at - b.at; });
            if (!timers.length || timers[0].at > target) break;
            var t = timers.shift();
            clock = t.at;
            t.fn();
        }
        clock = target;
    }
    function clickOn(target) {
        listeners.slice().forEach(function (l) { l.fn({ target: target }); });
    }
    var blank = { closest: function () { return null; } };
    var onButton = { closest: function (sel) { return sel === 'button' ? {} : null; } };

    // 跳过：打到一半点空白 → 全文即显 + callback 只走一次 + 旧链不再续写
    var el = { style: {}, textContent: '' };
    var cbCount = 0;
    var TEXT = '天道收账，一茬一万年。你，是算错的那一株。';
    SW.typewriterEffect(el, TEXT, 10, function () { cbCount++; });
    tick(55);   // 打了几个字
    ok(el.textContent.length > 0 && el.textContent.length < TEXT.length, 'Q2 逐字进行中（半截文案）');
    ok(listeners.length === 1 && listeners[0].cap === true, 'Q2 打字期间挂了点击跳过监听（捕获式）');
    clickOn(blank);
    ok(el.textContent === TEXT, 'Q2 点一下全文即显');
    ok(cbCount === 1, 'Q2 跳过时 callback 照常走一次（后续演出不卡死）');
    tick(2000);
    ok(el.textContent === TEXT && cbCount === 1, 'Q2 跳过后旧链彻底失效（不双写不双回调）');
    ok(listeners.length === 0, 'Q2 跳过后监听摘干净（不泄漏）');

    // 按钮点击不抢行为
    var el2 = { style: {}, textContent: '' };
    var cb2 = 0;
    SW.typewriterEffect(el2, TEXT, 10, function () { cb2++; });
    tick(35);
    clickOn(onButton);
    ok(el2.textContent.length < TEXT.length && cb2 === 0, 'Q2 点在按钮上不触发跳过（继续/选项按钮行为不被抢）');
    tick(5000);
    ok(el2.textContent === TEXT && cb2 === 1, 'Q2 不跳过则自然打完（callback 恰好一次）');
    ok(listeners.length === 0, 'Q2 自然打完也摘监听');

    // 关窗令牌：链失效后点击自摘
    var el3 = { style: {}, textContent: '' };
    SW.typewriterEffect(el3, TEXT, 10, function () {});
    tick(25);
    el3._typeToken = (el3._typeToken || 0) + 1;   // closeScenePerformance 的取消口径
    clickOn(blank);
    ok(listeners.length === 0 && el3.textContent.length < TEXT.length, 'Q2 关窗后的死链：点击只摘监听，不写已分离节点');
    // 提示可发现
    var el4 = { style: {}, textContent: '' };
    SW.typewriterEffect(el4, '短文案', 10, function () {});
    ok(el4.title && el4.title.indexOf('点击') >= 0, 'Q2 元素自带「点击可跳过」提示（可发现性）');
    tick(3000);
})();

// ==================== Q3 后期敌人多样性 ====================
console.log('\n[Q3] 金丹往后不再只有老面孔');
(function () {
    var BW = {
        console: { log: function () {}, warn: function () {} },
        Math: Math, JSON: JSON, Object: Object, Array: Array, String: String, Number: Number, isFinite: isFinite, Date: Date,
        setTimeout: setTimeout,
        document: { createElement: function () { return { style: {}, classList: { add: function () {}, remove: function () {} }, appendChild: function () {} }; }, getElementById: function () { return null; }, addEventListener: function () {}, body: { appendChild: function () {} } }
    };
    BW.window = BW;
    vm.createContext(BW);
    vm.runInContext(loadScript('js/battle.js'), BW, { filename: 'battle' });
    var gen = BW.generateRandomEnemy;
    ok(typeof gen === 'function', 'Q3 generateRandomEnemy 在案');

    var NEW_SUBS = ['yaksha', 'demon_general', 'incense_official', 'reaper', 'ancient_god'];
    var NEW_PREFIXES = ['夜叉', '罗刹', '魔将', '妖帅', '执香吏', '采风使', '收稼人', '执镰使者', '古神残躯', '荒古遗族'];
    var NEW_AFFIXES = ['宗师', '神座', '天将', '镇世'];
    var OLD_AFFIXES = ['狂徒', '护法', '堂主'];

    // 渡劫刻度（L57-65）：新面孔与新名号都得见得到
    var subsSeen = {}, prefixesSeen = {}, affixesSeen = {}, subSamples = {};
    for (var i = 0; i < 4000; i++) {
        var e = gen(57 + (i % 9), 'enemy');
        var head = String(e.name).split('·')[0];
        if (NEW_AFFIXES.indexOf(head) >= 0) affixesSeen[head] = (affixesSeen[head] || 0) + 1;
        else if (OLD_AFFIXES.indexOf(head) >= 0) affixesSeen[head] = (affixesSeen[head] || 0) + 1;
        var rest = String(e.name).split('·');
        if (rest.length >= 2 && NEW_PREFIXES.indexOf(rest[rest.length - 2]) >= 0) prefixesSeen[rest[rest.length - 2]] = 1;
        if (NEW_SUBS.indexOf(e.subtype) >= 0) { subsSeen[e.subtype] = (subsSeen[e.subtype] || 0) + 1; if (!subSamples[e.subtype]) subSamples[e.subtype] = e; }
    }
    ok(NEW_SUBS.every(function (s) { return (subsSeen[s] || 0) > 0; }),
        'Q3 五个高境界亚型都出得了场（' + NEW_SUBS.map(function (s) { return s + ':' + (subsSeen[s] || 0); }).join(' ') + '）');
    ok(Object.keys(prefixesSeen).length >= 8, 'Q3 十张新面孔前缀至少见到八张（实得 ' + Object.keys(prefixesSeen).length + '）');
    ok(NEW_AFFIXES.every(function (a) { return (affixesSeen[a] || 0) > 0; }),
        'Q3 四种高境界名号都挂得上去（' + NEW_AFFIXES.map(function (a) { return a + ':' + (affixesSeen[a] || 0); }).join(' ') + '）');
    // 门槛：炼气小朋友见不到这些大人物（亚型按 subtype 判，名号按名字首段判）
    var lowLeak = 0, lowPrefixLeak = 0;
    for (var j = 0; j < 1500; j++) {
        var le = gen(1 + (j % 9), 'enemy');   // L1-9
        if (NEW_SUBS.indexOf(le.subtype) >= 0) lowLeak++;
        var lh = String(le.name).split('·')[0];
        if (NEW_AFFIXES.indexOf(lh) >= 0) lowLeak++;
        if (NEW_PREFIXES.indexOf(lh) >= 0) lowPrefixLeak++;
    }
    ok(lowLeak === 0, 'Q3 等级门槛不漏：炼气 1-9 级挂不上宗师/神座/天将/镇世（漏 ' + lowLeak + '）');
    ok(lowPrefixLeak === 0, 'Q3 炼气 1-9 级遇不到收稼人/执香吏/古神残躯（漏 ' + lowPrefixLeak + '）');
    // 新亚型机制字段落地：招牌技/属性倍率不是摆设
    var reaper = subSamples['reaper'];
    ok(reaper && (reaper.combatAbilities || []).indexOf('lifesteal') >= 0, 'Q3 收稼人招牌技吸血在案（收割即汲取）');
    var god = subSamples['ancient_god'];
    ok(god && (god.combatAbilities || []).indexOf('reflect') >= 0, 'Q3 古神残躯招牌技反震在案');
    var official = subSamples['incense_official'];
    ok(official && (official.combatAbilities || []).indexOf('drain_qi') >= 0, 'Q3 执香吏招牌技摄气在案（收香火的手）');
    // 词缀强度梯度：镇世 > 天将 > 堂主（同名号同级的属性期望递增，钉倍率表）
    var bSrc = loadScript('js/battle.js');
    ok(/tangzhu:\s+\{ name: '堂主', minLevel: 8, attrMul: \{ allAttr: 1\.25 \}, extraDraws: 2 \}/.test(bSrc) &&
       /zongshi:\s+\{ name: '宗师', minLevel: 15, attrMul: \{ allAttr: 1\.3 \}, extraDraws: 2 \}/.test(bSrc) &&
       /zhenshi:\s+\{ name: '镇世', minLevel: 56, attrMul: \{ allAttr: 1\.6 \}, extraDraws: 4 \}/.test(bSrc),
        'Q3 名号梯度钉死：堂主1.25→宗师1.3→神座1.4→天将1.5→镇世1.6');
    // 全等级扫一遍不炸、字段齐整（回归护栏）
    var broken = 0;
    for (var L = 1; L <= 65; L++) {
        var g = gen(L, L % 3 === 0 ? 'beast' : (L % 5 === 0 ? 'elite' : 'enemy'));
        if (!g.name || !g.subtype || !g.attrs || Object.keys(g.attrs).length < 6) broken++;
        for (var ak in (g.attrs || {})) { if (!(g.attrs[ak] >= 1)) broken++; }
    }
    ok(broken === 0, 'Q3 1-65 级全刻度生成不炸、六维齐整（违例 ' + broken + '）');
    // 与 v21.6 境界刻度咬合：渡劫怪能抽到高段名号
    ok(/minLevel: 56/.test(bSrc), 'Q3 镇世名号门槛 56——正好接住渡劫刻度（realmScaledEnemyLevel 封顶 65）');
})();

console.log('\n========== v21.8 体验小件 ==========');
console.log('通过 ' + passed + ' / 失败 ' + failed);
process.exit(failed ? 1 : 0);
