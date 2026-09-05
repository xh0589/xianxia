/**
 * v20.46-sect-events-node.js — 门派事件扩充 + 禁止牌移除验收：
 * 26 门各有 2+ 专属事件（结构齐、不与通用池撞 ID）；通用池扩到 18 桩；
 * 专属事件进抽取池、能结算；游客内院牌不再立"禁止"——门禁照旧，由测试守。
 *
 * 运行：node tests/v20.46-sect-events-node.js
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

function makeWorld(rng) {
    var msgs = [];
    var w = {
        console: { log: function () {}, warn: function () {}, error: function () {} },
        JSON: JSON, Object: Object, Array: Array, String: String, Boolean: Boolean,
        Number: Number, isFinite: isFinite,
        Math: { random: function () { return rng != null ? rng : 0.5; },
                min: Math.min, max: Math.max, floor: Math.floor, ceil: Math.ceil },
        discipleState: { isInSect: true, sectId: '少林寺', rank: 5, contribution: 0, points: 0 },
        SECT_INTERNAL: {
            '少林寺': { morale: 50, resources: 100, influence: 50, disciples: 20 },
            '修罗宫': { morale: 50, resources: 100, influence: 50, disciples: 20 }
        },
        showMessage: function (m) { msgs.push(String(m)); },
        sectsData: { '少林寺': {}, '修罗宫': {} },
        __msgs: msgs
    };
    w.window = w;
    var ctx = vm.createContext(w);
    vm.runInContext(loadScript('js/sects/sect-events.js'), ctx);
    vm.runInContext(loadScript('js/sects/sect-exclusive-events.js'), ctx);
    return w;
}

// ============ E 专属事件结构 ============
var W0 = makeWorld();
var EX = W0.SECT_EXCLUSIVE_EVENTS;
var SECTS = ['少林寺', '嵩山派', '大旗门', '恒山派', '全真教', '华山派', '武当派',
    '侠隐阁', '天涯海阁', '泰山派', '药王谷', '神机门', '霹雳堂', '茅山派', '大隐阁',
    '天书阁', '蓬莱派', '衡山派', '丐帮', '铁掌帮', '百花谷', '五仙教', '修罗宫',
    '阎罗殿', '昆仑派', '金刚宗'];
assert(SECTS.every(function (s) { return EX[s] && Object.keys(EX[s]).length >= 2; }),
    'E1 二十六门，每门至少两桩专属事件——每门每派有自己的戏');
assert(SECTS.every(function (s) {
    return Object.keys(EX[s]).every(function (k) {
        var ev = EX[s][k];
        return ev.type && ev.icon && ev.name && typeof ev.desc === 'function' && typeof ev.effect === 'function';
    });
}), 'E2 专属事件结构齐——类型/图标/名/描述/效果一样不缺');
assert(Object.keys(W0.SECT_EVENTS_POOL).length === 19,
    'E3 通用池扩到 19 桩——门派日常月月有戏（13 旧 + 6 新）');
var collides = Object.keys(EX).some(function (s) {
    return Object.keys(EX[s]).some(function (k) { return W0.SECT_EVENTS_POOL[k]; });
});
assert(!collides, 'E4 专属事件不与通用池撞 ID——结算查得到真定义');
assert(SECTS.every(function (s) {
    return Object.keys(EX[s]).every(function (k) {
        var ev = EX[s][k];
        var r = ev.effect(s);
        return typeof r === 'string' && r.length > 0 && typeof ev.desc(s) === 'string';
    });
}), 'E5 全部专属事件逐桩跑通——描述能渲染、效果能结算、有结算话术');

// ============ E 进池与结算 ============
var W1 = makeWorld(0.999); // 随机逼到池尾——专属事件在池里，抽得到
var seenExclusive = false, allResolved = true;
for (var i = 0; i < 40; i++) {
    var ev = W1.generateSectEvent('少林寺');
    if (!ev) break;
    var inPool = !!W1.SECT_EVENTS_POOL[ev.id];
    var inExcl = !!(EX['少林寺'] && EX['少林寺'][ev.id]);
    if (!inPool && !inExcl) { allResolved = false; break; }
    if (inExcl) seenExclusive = true;
    W1.sectEventState.activeEvents['少林寺'] = { event: ev, expiryGameMinute: 1e9 };
    W1.handleSectEvent('少林寺', ev.id);
    if (W1.__msgs.join('').indexOf('数据异常') >= 0) { allResolved = false; break; }
    W1.__msgs.length = 0;
}
assert(seenExclusive && allResolved,
    'E6 专属事件进抽取池、抽得到、结算得了——不是挂在墙上的死数据');

// ============ E 效果落真的 ============
var W2 = makeWorld();
var ev2 = { id: 'shaolin_muxiang', type: 'internal', icon: '🪵', name: '木巷禅机', desc: 'x' };
W2.sectEventState.activeEvents['少林寺'] = { event: ev2, expiryGameMinute: 1e9 };
W2.handleSectEvent('少林寺', 'shaolin_muxiang');
assert(W2.SECT_INTERNAL['少林寺'].morale === 60 && W2.discipleState.points === 20,
    'E7 专属事件效果落真的——门派士气、弟子积分都进账');
assert(W2.__msgs.join('').indexOf('已过期') < 0 && W2.__msgs.join('').indexOf('数据异常') < 0,
    'E8 结算不报异常——专属池查得到定义');

// ============ E 禁止牌移除，门禁照旧 ============
var visit = loadScript('js/sects/sect-visit.js');
assert(visit.indexOf('已封锁') < 0 && visit.indexOf('游客止步') < 0 && visit.indexOf('🚫 内院') < 0,
    'E9 内院不再立"禁止"的牌子——大大的禁止提示已拆');
var W3 = makeWorld();
vm.runInContext(loadScript('js/sects/sect-visit.js'), vm.createContext(W3));
var visitorHtml = W3.renderSectInnerGate('少林寺', false, 0);
assert(visitorHtml.indexOf('进入内院') < 0 && visitorHtml.indexOf('openFacilityUI') < 0,
    'E10 游客依旧进不了内院——没有入口按钮，门禁由代码守，不由牌子吓');
assert(visitorHtml.indexOf('早课') >= 0 || visitorHtml.indexOf('执事') >= 0,
    'E11 门闭着也有场面话——叙事替禁令说话');
var memberHtml = W3.renderSectInnerGate('少林寺', true, 2);
assert(memberHtml.indexOf('进入内院') >= 0, 'E12 弟子照旧入内院——该开的门没误伤');

// ============ G 接线 ============
var html = loadScript('仙侠.html');
assert(html.indexOf('sect-exclusive-events.js') >= 0, 'G1 专属事件已挂载');

console.log('---');
console.log('v20.46 sect-events: ' + passed + ' 通过, ' + failed + ' 失败');
process.exit(failed ? 1 : 0);
