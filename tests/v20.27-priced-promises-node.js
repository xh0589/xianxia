/**
 * v20.27-priced-promises-node.js — 恋爱事件的价签：
 * 18 个中段重头事件里最甜的选项改为预支精力（15/20），
 * 精力不足兑现不了"陪你熬一夜"，结算降档但不再是空话；
 * 扣账只认 currentCharData.energy 真源，无旁路字段。
 *
 * 运行：node tests/v20.27-priced-promises-node.js
 */
'use strict';

var path = require('path');
var fs = require('fs');
var vm = require('vm');

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) passed++;
    else { failed++; console.error('[FAIL] ' + msg); }
}
function loadScript(rel) { return fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8'); }
function evSlice(src, evId) {
    var a = src.indexOf("'" + evId + "': {");
    if (a < 0) return null;
    var m = src.slice(a + 5).match(/\n    '(?:jg|ms|su|lu|wx|ts|bh|xl)_event_/);
    return src.slice(a, m ? a + 5 + m.index : src.length);
}
function runEffects(src, eventId, choice, windowStub) {
    var seg = evSlice(src, eventId);
    var eIdx = seg.indexOf('effects: function(npc, choice)');
    var j = seg.indexOf('{', eIdx), depth = 0, k = j;
    for (; k < seg.length; k++) {
        if (seg[k] === '{') depth++;
        else if (seg[k] === '}') { depth--; if (depth === 0) break; }
    }
    var ctx = vm.createContext({ window: windowStub, Math: Math });
    vm.runInContext('__f=' + 'function(npc, choice) ' + seg.slice(j, k + 1) + ';', ctx);
    return ctx.__f({ relationship: {} }, choice);
}

// ============ A 价签助手本身 ============
var esrc = loadScript('js/npcs/npc-personal-events.js');
var ia = esrc.indexOf('window._payCost = function');
assert(ia >= 0, 'A0 价签助手在案（只认精力真源）');
var j0 = esrc.indexOf('function', ia), d = 0, k0 = esrc.indexOf('{', j0);
for (; k0 < esrc.length; k0++) { if (esrc[k0] === '{') d++; else if (esrc[k0] === '}') { d--; if (d === 0) break; } }
var helperSrc = esrc.slice(ia, k0 + 2);
var aCtx = vm.createContext({ window: { currentCharData: { energy: 10 } } });
aCtx.window._payCost = null;
vm.runInContext(helperSrc, aCtx);
var paid = aCtx.window._payCost('energy', 8);
var broke = aCtx.window._payCost('energy', 8);
var noSect = aCtx.window._payCost('stones', 8);
assert(paid.ok && aCtx.window.currentCharData.energy === 2, 'A1 付得起：当场扣账（10→2）');
assert(!broke.ok && broke.why === 'exhausted', 'A2 付不起：明说精力不足，不透支');
assert(!noSect.ok, 'A3 只认精力一口井——灵石旁路直接拒收');
var bCtx = vm.createContext({ window: {} });
vm.runInContext(helperSrc, bCtx);
assert(bCtx.window._payCost('energy', 50).ok, 'A4 无账本环境（未开局/测试沙盒）不扣不亏');

// ============ B 十八事件两态结算 ============
var EVENTS = [
    { file: 'js/npcs/jingang-events.js', ev: 'jg_event_007', ch: 'share', hi: 11, lo: 4 },
    { file: 'js/npcs/jingang-events.js', ev: 'jg_event_008', ch: 'stay', hi: 12, lo: 5 },
    { file: 'js/npcs/maoshan-events.js', ev: 'ms_event_007', ch: 'sit', hi: 12, lo: 5 },
    { file: 'js/npcs/maoshan-events.js', ev: 'ms_event_008', ch: 'reverse', hi: 12, lo: 5 },
    { file: 'js/npcs/yaowang-events.js', ev: 'su_event_007', ch: 'rest', hi: 11, lo: 4 },
    { file: 'js/npcs/yaowang-events.js', ev: 'su_event_008', ch: 'share', hi: 12, lo: 5 },
    { file: 'js/npcs/zhujian-events.js', ev: 'lu_event_007', ch: 'salvage', hi: 12, lo: 5 },
    { file: 'js/npcs/zhujian-events.js', ev: 'lu_event_008', ch: 'come', hi: 12, lo: 5 },
    { file: 'js/npcs/wuxian-events.js', ev: 'wx_event_007', ch: 'stay', hi: 11, lo: 4 },
    { file: 'js/npcs/wuxian-events.js', ev: 'wx_event_008', ch: 'qi', hi: 14, lo: 6 },
    { file: 'js/npcs/wuxian-events.js', ev: 'wx_event_009', ch: 'promise', hi: 14, lo: 6 },
    { file: 'js/npcs/wuxian-events.js', ev: 'wx_event_010', ch: 'shield', hi: 12, lo: 5 },
    { file: 'js/npcs/wuxian-events.js', ev: 'wx_event_011', ch: 'feed_true', hi: 15, lo: 6 },
    { file: 'js/npcs/tianshan-events.js', ev: 'ts_event_007', ch: 'promise', hi: 11, lo: 4 },
    { file: 'js/npcs/tianshan-events.js', ev: 'ts_event_008', ch: 'stay', hi: 11, lo: 4 },
    { file: 'js/npcs/tianshan-events.js', ev: 'ts_event_009', ch: 'promise', hi: 14, lo: 6 },
    { file: 'js/npcs/tianshan-events.js', ev: 'ts_event_010', ch: 'side', hi: 11, lo: 4 },
    { file: 'js/npcs/tianshan-events.js', ev: 'ts_event_011', ch: 'hold', hi: 14, lo: 6 }
];
EVENTS.forEach(function (E) {
    var src = loadScript(E.file);
    var rich = runEffects(src, E.ev, E.ch, { _payCost: function () { return { ok: true }; } });
    var poor = runEffects(src, E.ev, E.ch, { _payCost: function () { return { ok: false, why: 'exhausted' }; } });
    assert(rich && rich.affection === E.hi && String(rich.msg).indexOf('（精力-') >= 0,
        'B[' + E.ev + '] 付得起的版本：最高点 ' + E.hi + ' 分并如实标价（精力' + (E.hi >= 14 ? ' 20' : ' 15') + '）');
    assert(poor && poor.affection === E.lo && String(poor.msg).indexOf('精力不足') >= 0,
        'B[' + E.ev + '] 撑不住的版本：兑现半句只值 ' + E.lo + ' 分，且把亏欠说在明处');
    assert(evSlice(src, E.ev).indexOf("effect: '" + E.ch + "', affection: " + E.hi) >= 0,
        'B[' + E.ev + '] 选项贴纸与结算同价（' + E.hi + '）');
});
// 无 _payCost 环境默认放行（不误伤其他调用场景）
assert(runEffects(loadScript('js/npcs/jingang-events.js'), 'jg_event_007', 'share', {}).affection === 11,
    'B+ 助手缺席时按付得起结算——与旧世界兼容');

// ============ C 集成：真助手 + 真事件（同一口井） ============
var seg = evSlice(loadScript('js/npcs/yaowang-events.js'), 'su_event_008');
var ej = seg.indexOf('effects: function(npc, choice)');
var jf = seg.indexOf('{', ej), k2 = jf, d2 = 0;
for (; k2 < seg.length; k2++) { if (seg[k2] === '{') d2++; else if (seg[k2] === '}') { d2--; if (d2 === 0) break; } }
var evFn = 'function(npc, choice) ' + seg.slice(jf, k2 + 1);
var ctx2 = vm.createContext({ window: { currentCharData: { energy: 100 } }, Math: Math });
vm.runInContext(helperSrc + '\n' + '__f=' + evFn + ';', ctx2);
var richReal = ctx2.__f({ relationship: {} }, 'share');
assert(richReal.affection === 12 && ctx2.window.currentCharData.energy === 85,
    'C1 真链路：答应「一起担」的当口，精力账上真少了 15（100→85）');
var ctx3 = vm.createContext({ window: { currentCharData: { energy: 5 } }, Math: Math });
vm.runInContext(helperSrc + '\n' + '__f=' + evFn + ';', ctx3);
var poorReal = ctx3.__f({ relationship: {} }, 'share');
assert(poorReal.affection === 5 && ctx3.window.currentCharData.energy === 5,
    'C2 真链路：只剩 5 点精力的人不硬扣——结算降档、账面不动');

// ============ D 零旁路与旧账防护 ============
var six = ['jingang', 'maoshan', 'yaowang', 'zhujian', 'wuxian', 'tianshan'].map(function (f) { return loadScript('js/npcs/' + f + '-events.js'); }).join('\n');
assert(six.indexOf('cd.stones') < 0 && six.indexOf('.stones -=') < 0, 'D1 六线内无灵石旁路写入');
assert(six.indexOf('_payCost') >= 0 && (six.match(/_payCost\('energy'/g) || []).length === 18, 'D2 价签 18 处整点在案');
var wx = loadScript('js/npcs/wuxian-events.js');
var r005 = runEffects(wx, 'wx_event_005', 'let', {});
assert(r005 && r005.affection === 6 && r005.item === 'mat_beast_fang', 'D3 上批信物旧账未动（试蛊毒牙照给）');
var jg25 = runEffects(loadScript('js/npcs/jingang-events.js'), 'jg_event_005', 'touch', {});
assert(jg25 && jg25.affection === 5 && jg25.item === 'mat_pearl', 'D4 木数珠旧账未动');

console.log('v20.27 priced-promises: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
