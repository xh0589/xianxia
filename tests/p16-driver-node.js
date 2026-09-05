/**
 * p16-driver-node.js — v20.5 P16 性格驱动层回归
 *
 * 覆盖：
 *   A: compat 五维相性（同型高 / 双强对立显著拉低）
 *   B: actionWeights 行动权重（E 多社交 / I 多修炼）
 *   C: socialBias 社交善意倾向（F+ / T−）
 *   D: distortRumor 传闻失真（中间性格不传染；种子可复现；E/I 转述必须不同）
 *   E: actor 集成（携带别处新闻 → 听者失真变体入池；heard 记录）
 *   F: npcRumors StateRegistry 持久化 roundtrip（旧档零迁移）
 *
 * 运行：node tests/p16-driver-node.js
 */
'use strict';

var path = require('path');
var fs = require('fs');
var vm = require('vm');

var mockWindow = {
    EventBus: null,
    showMessage: function () {},
    console: console,
    Math: Math, JSON: JSON, Object: Object, Array: Array,
    document: { querySelector: function () { return null; } },
    timeSystem: { gameTime: { currentDay: 1, totalMinutes: 0 }, advanceTime: function () {} },
    currentCharData: { name: '玩家', location: '帝都', realm: '炼气', layer: 1 },
    discipleState: null,
    npcManager: null,
    showModal: function () {},
    StateRegistry: null
};
mockWindow.window = mockWindow;
mockWindow.global = mockWindow;
mockWindow.XianXia = mockWindow.XianXia || {};

function loadScript(rel) {
    return fs.readFileSync(path.resolve(__dirname, '..', 'js', rel), 'utf8');
}

var ctx = vm.createContext(mockWindow);
vm.runInContext(loadScript('core/event-bus.js'), ctx);
vm.runInContext(loadScript('core/state-registry.js'), ctx);
vm.runInContext(loadScript('npcs/personality16.js'), ctx);
vm.runInContext(loadScript('npcs/personality-driver.js'), ctx);
vm.runInContext(loadScript('npcs/npc-life-actor.js'), ctx);

mockWindow.EventBus = ctx.EventBus;
mockWindow.StateRegistry = ctx.StateRegistry;
mockWindow.P16Driver = ctx.P16Driver;
mockWindow.NPCLife = ctx.NPCLife;

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; }
    else { failed++; console.error('[FAIL] ' + msg); }
}

function mulberry32(seed) {
    return function () {
        seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
        var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// ============ A: 相性 ============
var likeA = { id: 'a', name: 'A', location: '帝都', personality16: { mind: 60, energy: 70, nature: 50, tactics: -60, identity: -70 } };
var likeB = { id: 'b', name: 'B', location: '帝都', personality16: { mind: 70, energy: 60, nature: 60, tactics: -50, identity: -60 } };
var oppC  = { id: 'c', name: 'C', location: '帝都', personality16: { mind: -70, energy: -60, nature: -60, tactics: 60, identity: 70 } };

var cLike = ctx.P16Driver.compat(likeA, likeB);
var cOpp = ctx.P16Driver.compat(likeA, oppC);
assert(cLike > 50, '相近五维相性高 (实际 ' + cLike + ')');
assert(cOpp < cLike - 60, '双强对立相性显著更低 (相近 ' + cLike + ' vs 对立 ' + cOpp + ')');
assert(ctx.P16Driver.compat(null, likeA) === 0, '缺性格返回 0 不报错');

// ============ B: 行动权重 ============
var eNpc = { id: 'e', name: 'E', personality16: { mind: 100, energy: 0, nature: 0, tactics: 0, identity: 0 } };
var iNpc = { id: 'i', name: 'I', personality16: { mind: -100, energy: 0, nature: 0, tactics: 0, identity: 0 } };
var wE = ctx.P16Driver.actionWeights(eNpc);
var wI = ctx.P16Driver.actionWeights(iNpc);
assert(wE[1] > wI[1], 'E 社交权重高于 I (' + wE[1] + ' vs ' + wI[1] + ')');
assert(wI[2] > wE[2], 'I 修炼权重高于 E (' + wI[2] + ' vs ' + wE[2] + ')');
assert(wE.every(function (w) { return w > 0; }), '权重全正');

// ============ C: 社交善意 ============
var fNpc = { id: 'f', name: 'F', personality16: { mind: 0, energy: 0, nature: 100, tactics: 0, identity: 0 } };
var tNpc = { id: 't', name: 'T', personality16: { mind: 0, energy: 0, nature: -100, tactics: 0, identity: 0 } };
assert(ctx.P16Driver.socialBias(fNpc) > 0, 'F 善意倾向为正');
assert(ctx.P16Driver.socialBias(tNpc) < 0, 'T 思考型善意倾向为负');

// ============ D: 传闻失真 ============
var rumor = { id: 'r100-张三', day: 100, npcId: '张三', npcName: '张三', type: 'cultivate', summary: '张三在百花谷闭关突破金丹', result: 'success', location: '百花谷' };

var midNpc = { id: 'm', name: '中间人', personality16: { mind: 10, energy: -15, nature: 5, tactics: 12, identity: -8 } };
assert(ctx.P16Driver.distortRumor(midNpc, rumor) === null, '中间性格不传染（照原样传）');

var eGossip = { id: 'g1', name: '张扬客', personality16: { mind: 85, energy: 30, nature: 20, tactics: 30, identity: 20 } };
var iGossip = { id: 'g2', name: '寡言者', personality16: { mind: -85, energy: -30, nature: -20, tactics: -30, identity: -20 } };
var vE1 = ctx.P16Driver.distortRumor(eGossip, rumor, { randomSource: mulberry32(42), day: 105, location: '帝都' });
var vE2 = ctx.P16Driver.distortRumor(eGossip, rumor, { randomSource: mulberry32(42), day: 105, location: '帝都' });
var vI1 = ctx.P16Driver.distortRumor(iGossip, rumor, { randomSource: mulberry32(42), day: 105, location: '帝都' });
assert(vE1 && vE1.distorted === true, 'E 转述产生失真变体');
assert(vE1 && vE1.summary.indexOf(rumor.summary) === 0, '变体保留原闻主干再走形');
assert(vE1 && vE2 && vE1.summary === vE2.summary && vE1.glossStyle === vE2.glossStyle, '同种子失真可复现');
assert(vI1 && vI1.glossStyle !== vE1.glossStyle, '同一件事 E 与 I 转述风格不同 (' + (vE1 && vE1.glossStyle) + ' vs ' + (vI1 && vI1.glossStyle) + ')');
assert(vI1 && vI1.summary !== vE1.summary, '同一事件两性格版本内容有差异');

// 双强叠加：第二强维 ≥60 时风格叠加
var duoNpc = { id: 'g3', name: '多话揣测者', personality16: { mind: 80, energy: -75, nature: 0, tactics: 0, identity: 0 } };
var vDuo = ctx.P16Driver.distortRumor(duoNpc, rumor, { randomSource: mulberry32(7) });
assert(vDuo && vDuo.glossStyle.indexOf('·') > 0, '双强维失真风格叠加 (' + (vDuo && vDuo.glossStyle) + ')');

// ============ E: actor 集成（携带 + 失真入池） ============
mockWindow.npcManager = {
    getAllNPCs: function () { return [eGossip, iGossip]; },
    getNPC: function (id) { return [eGossip, iGossip].find(function (n) { return n.id === id; }) || null; }
};
// 造一条"别处发生"的传闻入池，并让讲述者听过它
ctx.NPCLife._rumors().unshift(rumor);
ctx.NPCLife._store()[eGossip.id] = { lastActionDay: 104, actionHistory: [], heard: [rumor.id] };
eGossip.location = '帝都'; iGossip.location = '帝都';
var spread = ctx.NPCLife._spreadRumor(eGossip, iGossip, 105);
assert(spread && spread.distorted === true, '社交携带别处新闻 → 听者(iGossip)失真变体');
assert(spread && spread.variantOf === rumor.id, '变体可溯源原闻 id');
assert(spread && ctx.NPCLife._findRumor(spread.id) === spread, '变体已入传闻池（真源仍是 RUMOR_LOG，无平行状态）');
var heardAfter = (ctx.NPCLife._store()[iGossip.id] || {}).heard || [];
assert(heardAfter.indexOf(spread.id) >= 0, '听者 heard 记录变体');

// 本地事不传播：把传闻地点改成同地
rumor.location = '帝都';
ctx.NPCLife._store()[eGossip.id].heard = [rumor.id];
assert(ctx.NPCLife._spreadRumor(eGossip, iGossip, 106) === null, '本地人尽皆知的事不再以新闻转述');
rumor.location = '百花谷';

// 面板渲染含失真标记
var panelHtml = ctx.NPCLife.renderRumorPanel(30);
assert(panelHtml.indexOf('🌀') >= 0, '传闻面板区分失真变体');

// ============ F: npcRumors 持久化 roundtrip ============
var snap = ctx.StateRegistry.exportAll();
assert(snap.npcRumors && Array.isArray(snap.npcRumors.data) && snap.npcRumors.data.length > 0, 'exportAll 含 npcRumors');
ctx.StateRegistry.resetAll();
assert(ctx.NPCLife._rumors().length === 0, 'resetAll 清空传闻池');
ctx.StateRegistry.importAll(snap);
assert(ctx.NPCLife._rumors().length > 0, 'importAll 恢复传闻池');
// 旧档（无此键）导入 → 空池不报错
ctx.StateRegistry.importAll({ npcLifeActions: { version: 1, data: {} } });
assert(Array.isArray(ctx.NPCLife._rumors()), '旧档缺 npcRumors 键 → 空池零迁移');

console.log('=========================================');
console.log('p16-driver v20.5: ' + passed + ' passed, ' + failed + ' failed');
console.log('=========================================');
if (failed > 0) process.exit(1);
