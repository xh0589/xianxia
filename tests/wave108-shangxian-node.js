/**
 * wave108-shangxian-node.js — 第一百零八波 · 解除队伍人数上限（实验性开关）验收：
 *   用户点账：「设置的难度里加个取消队伍人数上限的开关，并且警告可能破坏体验，同时检查是否会有性能问题」
 *   A 开关口径：默认仍 4 人；解开后硬顶 99；关了立刻恢复
 *   B 面板口径：队员数量「N / 上限」如实跟着开关走
 *   C 接线哨兵：设置页开关+警告话术、读档同步、躯体图性能闸（前 8 位才克隆 SVG）
 *   D 性能实测：99 人满编走一遍 招募/战斗改算/战后分历练/日结同步/面板重绘，报实测毫秒数
 *
 * 运行：node tests/wave108-shangxian-node.js
 */
'use strict';

var fs = require('fs');
var vm = require('vm');
var path = require('path');
var ROOT = path.resolve(__dirname, '..');

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; console.log('  ✓ ' + msg); }
    else { failed++; console.error('  ✗ ' + msg); }
}
function eq(a, b, msg) { assert(a === b, msg + '（实际=' + JSON.stringify(a) + ' 期望=' + JSON.stringify(b) + '）'); }
function load(rel) { vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel }); }
function src(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ==================== 测试桩 ====================
global.window = global;
var els = {};
function fakeEl(tag) {
    var el = {
        tag: tag || '', children: [], style: {}, parentNode: null, className: '',
        setAttribute: function () {}, getAttribute: function () { return null; },
        appendChild: function (c) { this.children.push(c); return c; },
        removeChild: function () {}, remove: function () {}, addEventListener: function () {}, removeEventListener: function () {},
        closest: function () { return null; }, scrollIntoView: function () {},
        classList: { add: function () {}, remove: function () {}, toggle: function () {}, contains: function () { return true; } },
        _html: '', textContent: '', options: [], value: ''
    };
    Object.defineProperty(el, 'innerHTML', {
        get: function () { return this._html; },
        set: function (v) { this._html = String(v); },
        configurable: true
    });
    return el;
}
global.document = {
    readyState: 'complete',
    createElementNS: function (ns, tag) { return fakeEl(tag); },
    createElement: function (tag) { return fakeEl(tag); },
    getElementById: function (id) { if (!els[id]) els[id] = fakeEl(); return els[id]; },
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    addEventListener: function () {},
    body: { appendChild: function () {} }
};
var store = {};
global.localStorage = {
    getItem: function (k) { return store[k] !== undefined ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; }
};
var msgs = [];
global.showMessage = function (m) { msgs.push(String(m)); };
global.switchPanel = function () {};
global.updateCurrencyUI = function () {};
global.updateCharacterStatus = function () {};
global.updateNPCStatus = function () {};
global.EventBus = { emit: function () {}, on: function () {} };
global.addItem = function () { return true; };
var _day = 300;
global.getAbsoluteDay = function () { return _day; };
global.timeSystem = { advanceTime: function () {}, getAbsoluteDay: function () { return _day; } };
global.locationSystem = { getCurrentLocation: function () { return '洛水城'; } };
global.currentCharData = { qi: 300, energy: 100, health: 100, location: '洛水城' };
global.inventory = { currency: { spiritStones: 50000 }, maxSlots: 30, slots: [], removeItem: function () {} };
global.itemById = {
    wpn_iron_sword: { id: 'wpn_iron_sword', name: '铁剑', attrs: { strength: 3 }, combatBonus: { attack: 6 }, damageType: 'slash' }
};
global._settings = {};   // 用户偏好账（与真游戏同一本：xianxia_settings）

var npcStore = {};
function makeNpc(id, name, affection) {
    var n = {
        id: id, name: name, gender: 'male',
        relationship: { affection: affection, trust: 0 },
        combat: { level: 3, realm: '炼气', layer: 2 },
        state: { health: 100, qi: 50, location: '洛水城' },
        mainAttributes: { strength: 12, dexterity: 10, intelligence: 10, constitution: 11, willpower: 9 },
        combatSkills: { '内功': 8, '剑法': 10 },
        skills: [], location: '洛水城', isFollowing: false, isDead: false,
        recordPlayerAction: function () {}
    };
    npcStore[id] = n;
    return n;
}
global.npcManager = {
    getNPC: function (id) { return npcStore[id] || null; },
    getAllNPCs: function () { return Object.keys(npcStore).map(function (k) { return npcStore[k]; }); }
};

load('js/party-system.js');
var PS = global.partySystem;

// ==================== A · 开关口径 ====================
console.log('\n[A] 开关口径：默认 4 人，解开硬顶 99，关了立刻恢复');
eq(PS.getEffectiveMaxMembers(), 4, 'A1 出厂默认：上限还是 4（开关没碰过）');
eq(PS.isPartyUnlimited(), false, 'A2 开关默认关');
for (var i = 1; i <= 4; i++) { makeNpc('n' + i, '侠客' + i, 60); eq(PS.recruitNPC('n' + i), true, 'A3-' + i + ' 第' + i + '位入队'); }
makeNpc('n5', '侠客五', 60);
msgs.length = 0;
eq(PS.recruitNPC('n5'), false, 'A4 第五位被四人限拦下');
assert(msgs[msgs.length - 1].indexOf('队伍已满') >= 0, 'A5 拦的话还是老话（队伍已满）');
global._settings.partyUnlimited = true;
eq(PS.isPartyUnlimited(), true, 'A6 开关打开');
eq(PS.getEffectiveMaxMembers(), 99, 'A7 解开后上限=硬顶 99');
eq(PS.recruitNPC('n5'), true, 'A8 第五位这就进来了');
for (var j = 6; j <= 8; j++) { makeNpc('n' + j, '侠客' + j, 60); PS.recruitNPC('n' + j); }
eq(PS.partyData.members.length, 8, 'A9 八人同队——旧上限形同虚设');
// 硬顶：塞到 99 再招被拦
while (PS.partyData.members.length < 99) {
    var k = PS.partyData.members.length + 1;
    makeNpc('bulk' + k, 'bulk' + k, 60);
    if (!PS.recruitNPC('bulk' + k)) break;
}
eq(PS.partyData.members.length, 99, 'A10 硬顶 99 人塞得进去');
makeNpc('n100', '第一百人', 60);
msgs.length = 0;
eq(PS.recruitNPC('n100'), false, 'A11 第一百人被硬顶拦下（不设底会拖垮机器，也不叫队伍了）');
assert(msgs[msgs.length - 1].indexOf('解了限也有个数') >= 0, 'A12 拦得明白：解了限也有个数');
global._settings.partyUnlimited = false;
eq(PS.getEffectiveMaxMembers(), 4, 'A13 关了开关立刻恢复 4 人口径（已在队的不被踢——只拦新招募）');

// ==================== B · 面板口径 ====================
console.log('\n[B] 面板口径：上限数字跟着开关走');
global.updatePartyUI();
eq(els['party-max-members-display'].textContent, '4', 'B1 关着：面板如实报 /4');
global._settings.partyUnlimited = true;
global.updatePartyUI();
eq(els['party-max-members-display'].textContent, '99', 'B2 开着：面板如实报 /99（不再挂写死的 4）');
global._settings.partyUnlimited = false;

// ==================== C · 接线哨兵 ====================
console.log('\n[C] 接线：设置页开关、警告话术、读档同步、躯体图性能闸');
var htmlSrc = src('仙侠.html');
assert(htmlSrc.indexOf('id="setting-party-unlimited"') >= 0, 'C1 设置页有这个开关（挂在难度设置区）');
assert(htmlSrc.indexOf('togglePartyUnlimited()') >= 0, 'C2 开关接的是正经函数');
assert(htmlSrc.indexOf('可能破坏体验') >= 0 && htmlSrc.indexOf('硬顶 99') >= 0, 'C3 警告写在脸上（可能破坏体验/硬顶 99/仗更久/低端设备卡顿）');
var appSrc = src('js/app.js');
assert(appSrc.indexOf('function togglePartyUnlimited') >= 0, 'C4 开关函数在 app.js 落了户');
assert(appSrc.indexOf("window._settings.partyUnlimited") >= 0 && appSrc.indexOf("localStorage.setItem('xianxia_settings'") >= 0, 'C5 偏好写进既有的 _settings 账（随删档保留，与感情衰减同款）');
assert(appSrc.indexOf('setting-party-unlimited') >= 0 && appSrc.indexOf('partyUnlCb') >= 0, 'C6 读档/初始化同步勾选态');
assert(appSrc.indexOf('SVG_CLONE_CAP') >= 0 && appSrc.indexOf('躯体图从简') >= 0, 'C7 躯体图性能闸：前 8 位才克隆整棵 SVG，其余挂名牌');
var psSrc = src('js/party-system.js');
assert(psSrc.indexOf('一百零八波') >= 0 && psSrc.indexOf('PARTY_UNLIMITED_CAP = 99') >= 0, 'C8 引擎侧挂着本波的号');
assert(psSrc.indexOf('isPartyUnlimited: isPartyUnlimited') >= 0 && psSrc.indexOf('getEffectiveMaxMembers: getEffectiveMaxMembers') >= 0, 'C9 口径有出口（面板/测试/其他系统都问得到）');

// ==================== D · 性能实测（99 人满编） ====================
console.log('\n[D] 性能实测：99 人满编把热路径全走一遍');
global._settings.partyUnlimited = true;
while (PS.partyData.members.length < 99) {
    var kk = PS.partyData.members.length + 1;
    makeNpc('perf' + kk, 'perf' + kk, 60);
    if (!PS.recruitNPC('perf' + kk)) break;
}
eq(PS.partyData.members.length, 99, 'D1 满编 99 人就位');
function timed(name, fn, budgetMs) {
    var t0 = process.hrtime.bigint();
    fn();
    var ms = Number(process.hrtime.bigint() - t0) / 1e6;
    console.log('    ⏱ ' + name + '：' + ms.toFixed(1) + ' ms');
    assert(ms < budgetMs, 'D ' + name + ' 在预算内（' + ms.toFixed(1) + 'ms < ' + budgetMs + 'ms）');
    return ms;
}
timed('战斗改算单×99（开战时每员一趟）', function () {
    for (var q = 0; q < 10; q++) PS.partyData.members.forEach(function (m) { PS.getMemberBattleMods(m); });
}, 500);
timed('战后分历练×99（每场收尾一趟）', function () {
    PS.grantBattleExp({ winner: 'player', enemy: { level: 5 } });
}, 500);
timed('日结同步+忠诚巡检×99（每天一趟）', function () {
    PS.syncWithWorld();
    PS.checkLoyaltyDaily();
}, 500);
timed('面板重绘×99（开面板一趟）', function () {
    global.updatePartyUI();
}, 1000);
timed('存档序列化×99（每次落盘）', function () {
    for (var s = 0; s < 20; s++) PS.savePartyData();
}, 500);
var saved = store['xianxia_party_data'] || '';
console.log('    💾 99 人存档体积：' + (saved.length / 1024).toFixed(1) + ' KB');
assert(saved.length < 1024 * 1024, 'D2 存档体积不爆（' + (saved.length / 1024).toFixed(1) + ' KB < 1MB）');
// 招募全程（含逐次落盘）的总账
global._settings.partyUnlimited = false;
PS.partyData.members = [];
global._settings.partyUnlimited = true;
var t1 = process.hrtime.bigint();
for (var r = 1; r <= 99; r++) { makeNpc('full' + r, 'full' + r, 60); PS.recruitNPC('full' + r); }
var recruitMs = Number(process.hrtime.bigint() - t1) / 1e6;
console.log('    ⏱ 连招 99 人（每次招募都落盘+重绘面板）：' + recruitMs.toFixed(1) + ' ms');
assert(recruitMs < 5000, 'D3 连招 99 人全链路在 5 秒内（实测 ' + recruitMs.toFixed(0) + 'ms——逐次落盘是 O(n²) 序列化，99 人仍是毫秒级）');
assert(src('tests/run-all.sh').indexOf('wave108-shangxian-node.js') >= 0, 'D4 本套已挂全量回归');

console.log('\n========== wave108 结果：' + passed + ' 通过 / ' + failed + ' 失败 ==========');
if (failed > 0) process.exit(1);
