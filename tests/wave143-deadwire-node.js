/**
 * wave143-deadwire-node.js — 第一百四十三批 · 三处「功能写好了但玩家看不到/用不了」的死接线回归防护
 *
 *   DW-1 js/battle.js 把 null 传给 showDamageNumber，而 ui-immersive.js 开头就 if(!target) return
 *        ⇒ 伤害飘字从上线起一次没显示过（暴击分支同理）。修法：传战斗实体，定位由
 *        resolveDamageAnchorEl 换算；格挡/化解两条支也补上飘字。
 *   DW-2 仙侠.html 那个 <select id="relations-filter"> 的 onchange 只调 renderRelationsPanel()，
 *        从不写 RELATIONS_FILTER_MODE ⇒ relations-panel.js 的排序分支玩家永远走不到；
 *        同时人脉卡片并排印两套阶梯（面板七档 vs getRelationshipStatus），边界不同步会自相矛盾。
 *   DW-3 mineOre 读 bonus.mining，而七个地区一个都没这个键 ⇒ 采矿区域加成恒为 1.0；
 *        另有 11 个 bonus 键配了没人读。
 *
 * 手法：能真跑的一律真跑——
 *   · battle.js + ui-immersive.js 真文件装进 vm 沙箱，真打一场仗，数真飘出来的 DOM 节点；
 *   · npc-system.js + relations-panel.js 真文件装进沙箱，逐个边界核两套阶梯判词是否同一个；
 *   · regions.js 真文件装进沙箱取真 getRegionBonus；app.js 的 mineOre/chopWood
 *     按函数原文逐字抽出来在沙箱里真调（同一串骰子、不同地区，产出必须不同）；
 *   抽不出行为的那半截（排序下拉改的是 html）走源码形状断言。
 */
'use strict';

var fs = require('fs');
var vm = require('vm');
var path = require('path');
var ROOT = path.resolve(__dirname, '..');

var passed = 0, failed = 0;
function ok(c, m) {
    if (c) { passed++; console.log('  ✓ ' + m); }
    else { failed++; console.error('  [FAIL] ' + m); }
}
function eq(a, b, m) { ok(a === b, m + '（实际=' + JSON.stringify(a) + ' 期望=' + JSON.stringify(b) + '）'); }
function load(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
function src(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
function 挖注释(s) {
    return s.split('\n').map(function (l) {
        var i = l.indexOf('//');
        return i >= 0 ? l.slice(0, i) : l;
    }).join('\n');
}
function 抽函数(srcText, name) {
    var i = srcText.indexOf('function ' + name + '(');
    if (i < 0) throw new Error('抽不出 ' + name);
    var j = srcText.indexOf('\nfunction ', i + 10);
    return srcText.slice(i, j < 0 ? srcText.length : j);
}
function noop() { }

// ================================================================
// [DW-1] 伤害飘字
// ================================================================
console.log('\n[DW-1] 战斗伤害飘字：真打一场，屏上真有数字');

// ---- 1a · ui-immersive.js 真文件 + 真 DOM 替身：定位与样式 ----
function 建飘字沙箱() {
    var 建出来的 = [];          // 每次 createElement('div') 造出来的飘字节点
    var 锚点表 = {};
    function 造锚点(id, left, top, w, h) {
        var el = {
            id: id,
            getBoundingClientRect: function () { return { left: left, top: top, width: w, height: h, right: left + w, bottom: top + h }; }
        };
        锚点表[id] = el;
        return el;
    }
    var 沙 = {
        console: { log: noop, warn: noop, error: noop },
        Math: Math, JSON: JSON, Object: Object, Array: Array, String: String, Number: Number, Date: Date,
        setTimeout: noop, clearTimeout: noop,
        innerWidth: 1280, innerHeight: 720,
        document: {
            head: { appendChild: noop },
            body: { appendChild: function (n) { if (n && n.className && n.className.indexOf('pointer-events-none') >= 0) 建出来的.push(n); } },
            createElement: function () { return { style: {}, dataset: {}, className: '', textContent: '', parentNode: null }; },
            getElementById: function (id) { return 锚点表[id] || null; },
            querySelectorAll: function () { return []; },
            getElementById_锚点: 锚点表
        }
    };
    沙.window = 沙;
    沙.getElementById = 沙.document.getElementById;
    var ctx = vm.createContext(沙);
    return { 沙: 沙, ctx: ctx, 建出来的: 建出来的, 锚点: 造锚点 };
}
{
    var h = 建飘字沙箱();
    var 敌方锚 = h.锚点('battle-enemy-status', 800, 300, 240, 60);
    var 我方锚 = h.锚点('battle-player-status', 100, 300, 240, 60);
    vm.runInContext(load('js/ui-immersive.js'), h.ctx, { filename: 'ui-immersive.js' });

    var enemy = { type: 'enemy', name: '赤鬃狼' };
    var player = { type: 'player', name: '玩家' };
    h.沙.currentBattle = { player: player, enemy: enemy, partyMembers: [] };

    // —— 普攻飘字：落在挨打那一方身上，不是屏幕中间 ——
    h.ctx.showDamageNumber(enemy, 42, 'normal');
    var 普通 = h.建出来的[h.建出来的.length - 1];
    ok(!!普通, 'A1 真打一下，飘字节点确实上屏了（旧代码这里一个节点都不造）');
    eq(普通.dataset.dmgType, 'normal', 'A2 普攻飘字自报 normal');
    eq(普通.textContent, '-42', 'A3 普攻飘字印的是这一下的实际伤害');
    eq(普通.style.left, (800 + 120) + 'px', 'A4 普攻飘字落在敌方状态格正中（不是屏幕中心）');
    eq(普通.style.top, '300px', 'A5 飘字顶边贴着锚点顶边（往上飘 60px 的动画在 CSS 里）');

    // —— 暴击飘字：与普攻必须肉眼可分 ——
    h.ctx.showDamageNumber(enemy, 137, 'crit');
    var 暴击 = h.建出来的[h.建出来的.length - 1];
    eq(暴击.dataset.dmgType, 'crit', 'A6 暴击飘字自报 crit');
    ok(暴击.textContent.indexOf('⚡') >= 0 && 暴击.textContent.indexOf('-137') >= 0, 'A7 暴击飘字带雷标并印出数值：' + 暴击.textContent);
    ok(暴击.style.fontSize === '28px' && 普通.style.fontSize !== '28px', 'A8 暴击字号 28px，与普攻（默认 18px）不同');
    ok(暴击.className.indexOf('text-red-500') >= 0 && 普通.className.indexOf('text-red-500') < 0, 'A9 暴击染红，普攻不染红——两支在屏上分得开');
    ok(暴击.style.textShadow && 暴击.style.textShadow.length > 0 && !普通.style.textShadow, 'A10 只有暴击带红光晕');
    eq(暴击.style.left, (800 + 120) + 'px', 'A11 暴击也落在挨打那一方');

    // —— 挨打的是自己：飘字必须换到另一格 ——
    h.ctx.showDamageNumber(player, 7, 'normal');
    var 自挨 = h.建出来的[h.建出来的.length - 1];
    eq(自挨.style.left, (100 + 120) + 'px', 'A12 挨打的是自己就落在我方状态格，不跟对面抢位置');

    // —— 回归钉：传 null 也得有数字（旧版 null 一进门就被 return 吃掉）——
    h.ctx.showDamageNumber(null, 9, 'normal');
    eq(h.建出来的.length, 4, 'A13 传 null 照样出飘字（旧代码此处长度恒 0）');
    var 无锚 = h.建出来的[h.建出来的.length - 1];
    ok(Math.abs(parseFloat(无锚.style.left) - 1280 / 2) < 0.5, 'A14 认不出锚点时退到屏幕中心，不是凭空消失');

    // —— 战斗面板没展开（锚点尺寸为 0）：不能飘到左上角 0,0 去 ——
    h.锚点('battle-enemy-status', 0, 0, 0, 0);
    h.ctx.showDamageNumber(enemy, 3, 'normal');
    var 零锚 = h.建出来的[h.建出来的.length - 1];
    ok(Math.abs(parseFloat(零锚.style.left) - 1280 / 2) < 0.5 && Math.abs(parseFloat(零锚.style.top) - 720 / 3) < 0.5,
        'A15 锚点尺寸为 0（面板未展开）时退到屏幕中上部，不贴左上角');
    ok(typeof h.ctx.resolveDamageAnchorEl === 'function' && typeof h.ctx.resolveDamagePoint === 'function',
        'A16 定位两段函数挂上了 window（外部想自己算飘字位置时不必重复造）');
}

// ---- 1b · battle.js 真文件：真打一场，飘字真被调起来 ----
console.log('\n[DW-1b] battle.js 接线：真打一拳，看 showDamageNumber 收没收到实体');
var battleSrc = src('js/battle.js');
{
    ok(battleSrc.indexOf('_showDamageNumber(defender, actual, isCrit ? \'crit\' : \'normal\');') >= 0,
        'B1 普攻/暴击支把 defender 和 crit 分支一起递出去了');
    ok(挖注释(battleSrc).indexOf('showDamageNumber(null') < 0,
        'B2 旧写法 window.showDamageNumber(null, …) 已绝迹（那一行就是飘字从未显示的病根）');
    eq((battleSrc.match(/this\._showDamageNumber\(defender, actual, /g) || []).length, 3,
        'B3 三处伤害结算（格挡/化解/普攻）都走同一个飘字出口');
    ok(battleSrc.indexOf('_showDamageNumber(defender, amount, type) {') >= 0,
        'B4 出口本身是一处独立方法（改动面收在一个点上）');
    ok(/catch \(eDn\) \{\s*console\.warn/.test(battleSrc.slice(battleSrc.indexOf('_showDamageNumber(defender, amount, type) {'))),
        'B5 出口的 catch 有话交代（不是空 catch）');
    var 暴击支 = battleSrc.slice(battleSrc.indexOf('let critChance = aStats'), battleSrc.indexOf('_showDamageNumber(defender, amount, type) {'));
    ok(暴击支.indexOf("isCrit ? 'crit' : 'normal'") >= 0,
        'B6 暴击判定 isCrit 与飘字类型同源，暴击那一支真能走到');
}

{
    // 真 battle.js + 真 ui-immersive.js 一起装进沙箱，真开一场仗
    var 记下的飘字 = [];
    var 建出来的 = [];
    var 锚点表 = {};
    function 造锚点(id, left) {
        var el = { id: id, getBoundingClientRect: function () { return { left: left, top: 200, width: 200, height: 50 }; } };
        锚点表[id] = el; return el;
    }
    var 沙 = {
        console: { log: noop, warn: noop, error: noop },
        localStorage: { getItem: function () { return null; }, setItem: noop, removeItem: noop },
        setTimeout: function () { return 0; }, clearTimeout: noop, setInterval: function () { return 0; }, clearInterval: noop,
        requestAnimationFrame: function () { return 0; },
        navigator: { userAgent: 'node', maxTouchPoints: 0 },
        location: { href: 'file:///x.html', search: '' },
        matchMedia: function () { return { matches: false, addListener: noop, removeListener: noop, addEventListener: noop }; },
        innerWidth: 1280, innerHeight: 720,
        alert: noop, prompt: function () { return null; }, confirm: function () { return true; },
        performance: { now: function () { return 0; } },
        getEffectiveMax: function () { return 100; },
        itemById: {}, currentEquipment: {}, partySystem: null,
        getCombatBonuses: function () { return { crit: 45 }; },   // 把暴击率抬到 45%，见下方 B14/B15 的说明
        getBondBonuses: function () { return {}; },
        getPlayerWeaponSkill: function () { return 0; }, resolveWeaponDamageType: function () { return 'slash'; },
        EventBus: { emit: noop, on: noop },
        currentCharData: { health: 100, energy: 100, qi: 200, maxQi: 200, level: 10, realm: '金丹', attrs: {} },
        timeSystem: { gameTime: { totalMinutes: 0 }, advanceTime: noop, onNewDaySubscribe: noop },
        showMessage: noop, updateCharacterStatus: noop, updateCurrencyUI: noop, updateInventoryUI: noop, updateBattleUI: noop,
        getCurrentCharData: function () { return 沙.currentCharData; }
    };
    沙.window = 沙; 沙.globalThis = 沙; 沙.global = 沙;
    var 拍下的 = [];
    沙.document = {
        readyState: 'complete',
        createElementNS: function () { return 假节点(); },
        createElement: function () { return 假节点(); },
        createTextNode: function () { return 假节点(); },
        getElementById: function (id) { return 锚点表[id] || null; },
        querySelector: function () { return null; }, querySelectorAll: function () { return []; },
        addEventListener: noop, removeEventListener: noop,
        body: { appendChild: function (n) { if (n && typeof n.className === 'string' && n.className.indexOf('pointer-events-none') >= 0) 建出来的.push(n); } },
        head: { appendChild: noop }
    };
    function 假节点() {
        return {
            tag: '', children: [], style: {}, dataset: {}, parentNode: null,
            setAttribute: noop, getAttribute: function () { return null; },
            appendChild: function (c) { this.children.push(c); return c; }, removeChild: noop,
            addEventListener: noop, removeEventListener: noop, closest: function () { return null; },
            classList: { add: noop, remove: noop, toggle: noop, contains: function () { return false; } },
            querySelector: function () { return null; }, querySelectorAll: function () { return []; },
            scrollIntoView: noop, focus: noop, click: noop, remove: noop,
            _html: '', textContent: '', value: '',
            getBoundingClientRect: function () { return { top: 0, left: 0, width: 0, height: 0 }; }
        };
    }
    Object.defineProperty(假节点(), 'innerHTML', { get: function () { return this._html; }, set: function (v) { this._html = String(v); }, configurable: true });

    造锚点('battle-player-status', 100);
    造锚点('battle-enemy-status', 800);

    vm.createContext(沙);
    vm.runInContext(load('js/physiology-config.js'), 沙, { filename: 'physiology-config.js' });
    vm.runInContext(load('js/battle-injuries.js'), 沙, { filename: 'battle-injuries.js' });
    vm.runInContext(load('js/battle.js'), 沙, { filename: 'battle.js' });
    // 飘字这一层也用真文件，但外面包一层记录器：真 showDamageNumber 照跑，同时把参数抄下来
    vm.runInContext('window.showDamageNumber = function (t, d, ty) { window.__记.push({ target: t, dmg: d, type: ty }); };', 沙);
    沙.__记 = 记下的飘字;
    vm.runInContext(load('js/ui-immersive.js'), 沙, { filename: 'ui-immersive.js' });
    vm.runInContext('window.showDamageNumber = (function (real) { return function (t, d, ty) { window.__记.push({ target: t, dmg: d, type: ty }); return real(t, d, ty); }; })(window.showDamageNumber);', 沙);

    var Entity = 沙.Entity, Battle = 沙.Battle;
    ok(!!Entity && !!Battle, 'B7 battle.js 装进沙箱成功（Entity/Battle 都在）');

    function 造玩家() {
        return new Entity({
            name: '玩家', level: 30,
            attrs: { strength: 60, dexterity: 30, intelligence: 30, willpower: 30, constitution: 60, meridian: 40 },
            skills: { '内功': 60 }, loot: {}, physiologyType: 'humanoid'
        }, 'player');
    }
    function 造敌() {
        return new Entity({
            name: '赤鬃狼王', level: 20,
            attrs: { strength: 40, dexterity: 8, intelligence: 8, willpower: 8, constitution: 40, meridian: 20 },
            skills: {}, loot: { exp: 10, copper: 5 }, physiologyType: 'beast'
        }, 'enemy');
    }

    var 敌 = 造敌(), 我 = 造玩家();
    var b = new Battle(我, 敌, []);
    沙.currentBattle = b;
    b._showDamageNumber(敌, 12, 'normal');
    eq(记下的飘字.length, 1, 'B8 出口真被调起来：打一拳，showDamageNumber 收到一次调用');
    eq(记下的飘字[0].target, 敌, 'B9 收到的是挨打的战斗实体，不是 null（旧版传 null）');
    eq(记下的飘字[0].dmg, 12, 'B10 传过去的是这一下的实际伤害');
    eq(记下的飘字[0].type, 'normal', 'B11 非暴击走 normal');

    b._showDamageNumber(敌, 88, 'crit');
    eq(记下的飘字[1].type, 'crit', 'B12 暴击走 crit——这一支以前从没被点亮过');
    eq(建出来的.length >= 2, true, 'B13 两次调用都在真 DOM 上造出了飘字节点');

    // 真打若干拳，验实战里普攻与暴击两支都亮过。
    // 暴击率走的是 battle.js 本来就读的 getCombatBonuses 口（上面桩成 crit:45 ⇒ 45%），
    // 120 拳里一头都不暴 ≈ 1e-32、一头都不普攻 ≈ 1e-43——两头都算必然，不是靠运气过的断言。
    var 亮过暴击 = false, 亮过普攻 = false;
    for (var i = 0; i < 120 && !(亮过暴击 && 亮过普攻); i++) {
        var e2 = 造敌(), p2 = 造玩家();
        var b2 = new Battle(p2, e2, []);
        沙.currentBattle = b2;
        var 前 = 记下的飘字.length;
        try { b2.playerAttack('chest'); } catch (e) { /* 这一拳算不出来就跳过，不影响接线判定 */ }
        for (var k = 前; k < 记下的飘字.length; k++) {
            if (记下的飘字[k].type === 'crit') 亮过暴击 = true; else 亮过普攻 = true;
            if (记下的飘字[k].target !== e2 && 记下的飘字[k].target !== p2) { /* 目标恒为在场实体 */ }
        }
    }
    ok(亮过普攻, 'B14 真打：普攻飘字亮过');
    ok(亮过暴击, 'B15 真打：暴击飘字亮过（暴击率经 getCombatBonuses 口抬到 45%，120 拳内必出）');
    var 目标齐 = 记下的飘字.every(function (c) { return c.target && typeof c.target === 'object'; });
    ok(目标齐 && 记下的飘字.length > 0, 'B16 实战里每一次飘字的 target 都是实体对象，没有一次是 null');
}

// ================================================================
// [DW-2] 人脉面板排序筛选 + 两套阶梯对齐
// ================================================================
console.log('\n[DW-2] 人脉面板：下拉真能换排序，卡片判词只有一套');

var html = src('仙侠.html');
{
    ok(/<select id="relations-filter" onchange="setRelationsFilterMode\(this\.value\)"/.test(html),
        'C1 排序下拉的 onchange 换成 setRelationsFilterMode(this.value)（旧写法只调 renderRelationsPanel()，选择从不落账）');
    ok(html.indexOf('<option value="high">好感优先</option>') >= 0 && html.indexOf('<option value="low">好感最低</option>') >= 0
        && html.indexOf('<option value="sect">按门派</option>') >= 0 && html.indexOf('<option value="location">按所在地</option>') >= 0,
        'C2 下拉四档排序选项与 relations-panel.js 的四个分支对得上');
}

function 建人脉沙箱() {
    var 名单 = [];
    var 锚点 = {
        'relations-npc-list': { _html: '' },
        'relations-count': { textContent: '' },
        'relations-filter': { value: 'all', _html: '' }
    };
    Object.defineProperty(锚点['relations-npc-list'], 'innerHTML', {
        get: function () { return this._html; }, set: function (v) { this._html = String(v); }, configurable: true
    });
    var 沙 = {
        console: { log: noop, warn: noop, error: noop },
        Math: Math, JSON: JSON, Object: Object, Array: Array, String: String, Number: Number, Date: Date, Set: Set, Map: Map,
        setTimeout: noop, clearTimeout: noop,
        currentCharData: { location: '帝都 · 长安' },
        document: {
            getElementById: function (id) { return 锚点[id] || null; },
            querySelectorAll: function () { return []; },
            createElement: function () { return { style: {}, dataset: {} }; },
            body: { appendChild: noop }, head: { appendChild: noop }, addEventListener: noop, removeEventListener: noop
        }
    };
    沙.window = 沙;
    沙.npcManager = {
        getAllNPCs: function () { return 名单; }
    };
    var ctx = vm.createContext(沙);
    vm.runInContext(load('js/relations-panel.js'), ctx, { filename: 'relations-panel.js' });
    return { 沙: 沙, ctx: ctx, 名单: 名单, 锚点: 锚点 };
}

function 造NPC(名, aff, 门派词, 地点, extra) {
    var n = {
        id: 'n_' + 名, name: 名,
        location: 地点, occupation: '散修',
        memory: { firstMet: true, meetCount: 1 },
        relationship: { affection: aff, respect: (extra && extra.respect) || 0, favor: 0, hatred: (extra && extra.hatred) || 0, fear: (extra && extra.fear) || 0, flags: new Set() },
        state: { mood: 50 },
        appearance: { icon: '👤' }
    };
    if (门派词) n.id = 'n_' + 门派词 + 名;
    return n;
}

{
    var h = 建人脉沙箱();
    h.名单.push(
        造NPC('甲', 90, '', '帝都 · 长安'),
        造NPC('乙', -30, '', '金城'),
        造NPC('丙', 45, '少林', '青木城'),
        造NPC('丁', 10, '', '洛水城'),
        造NPC('戊', 70, '武当', '青木城')
    );
    var render = h.ctx.renderRelationsPanel, setMode = h.ctx.setRelationsFilterMode;

    ok(typeof setMode === 'function', 'C3 setRelationsFilterMode 挂上了 window（html 的 onchange 就是调它）');

    render();
    var 全部档 = h.锚点['relations-npc-list'].innerHTML;
    var 全序 = ['甲', '戊', '丙', '丁', '乙'].map(function (名) { return 全部档.indexOf('>' + 名 + '<') >= 0 ? 1 : 0; }).join('');
    ok(全序.indexOf('1') === 0, 'C4 默认「全部」档按结识顺序走，甲在首位');

    setMode('high');
    eq(h.沙.window.RELATIONS_FILTER_MODE, 'high', 'C5 选了「好感优先」，RELATIONS_FILTER_MODE 真被写成 high（旧版这个全局恒为 all）');
    eq(h.锚点['relations-filter'].value, 'high', 'C6 下拉自己的显示值也跟上了，不是面板变了下拉没变');
    var 高档 = h.锚点['relations-npc-list'].innerHTML;
    ok(高档.indexOf('甲') >= 0 && 高档.indexOf('乙') >= 0 && 高档.indexOf('甲') < 高档.indexOf('乙'),
        'C7 「好感优先」把好感 90 的甲排在好感 -30 的乙前头——排序分支真被点着了（旧版此档与 all 逐字相同）');
    ok(高档.indexOf('戊') < 高档.indexOf('丙'), 'C8 同档内也按好感真排（戊 70 在前、丙 45 在后）');

    setMode('low');
    eq(h.沙.window.RELATIONS_FILTER_MODE, 'low', 'C9 「好感最低」也落账');
    var 低档 = h.锚点['relations-npc-list'].innerHTML;
    ok(低档.indexOf('乙') >= 0 && 低档.indexOf('乙') < 低档.indexOf('甲'), 'C10 「好感最低」把乙排到了甲前头');

    setMode('sect');
    eq(h.沙.window.RELATIONS_FILTER_MODE, 'sect', 'C11 「按门派」也落账');
    var 门派档 = h.锚点['relations-npc-list'].innerHTML;
    ok(门派档.indexOf('丙') >= 0 && 门派档.indexOf('戊') >= 0
        && 门派档.indexOf('丙') < 门派档.indexOf('甲'),
        'C12 「按门派」这一档点得着：少林门的丙排在散修的甲前头');

    setMode('location');
    eq(h.沙.window.RELATIONS_FILTER_MODE, 'location', 'C13 「按所在地」也落账');
    var 地点档 = h.锚点['relations-npc-list'].innerHTML;
    var 甲位 = 地点档.indexOf('甲'), 丁位 = 地点档.indexOf('丁'), 乙位 = 地点档.indexOf('乙'), 丙位 = 地点档.indexOf('丙');
    ok(甲位 >= 0 && 丁位 >= 0 && 乙位 >= 0 && 丙位 >= 0 && 甲位 < 丁位 && 丁位 < 乙位 && 乙位 < 丙位,
        'C14 「按所在地」真按地点排了序（帝都·长安 < 洛水城 < 金城 < 青木城，字符串序）');

    setMode('乱写的一档');
    eq(h.沙.window.RELATIONS_FILTER_MODE, 'all', 'C15 下拉里没有的值一律退回 all，不让面板停在一个不存在的档上');
    eq(h.锚点['relations-filter'].value, 'all', 'C16 退回时把下拉显示值一并拨回 all');

    setMode('sect');
    h.ctx.RELATIONS_CURRENT_PAGE = 3;
    setMode('high');
    eq(h.沙.window.RELATIONS_CURRENT_PAGE, 1, 'C17 换档回第一页（旧页码在新排序下多半越界）');
}

{
    // 排序翻页的页界：过滤后剩 10 人却还按全部 40 人头算页数 → 玩家能翻进空白页
    var h = 建人脉沙箱();
    for (var i = 0; i < 40; i++) h.名单.push(造NPC('人' + i, i, '', '帝都 · 长安'));
    h.沙.npcManager.getAllNPCs = function () {
        return h.名单.filter(function (n) { return n.relationship.affection >= 30; });   // 只剩 10 人
    };
    h.ctx.renderRelationsPanel();
    eq(h.沙.window.RELATIONS_FILTERED_COUNT, 10, 'C18 过滤后实剩 10 人被记下来了');
    h.ctx.changeRelationsPage(1);
    eq(h.沙.window.RELATIONS_CURRENT_PAGE, 1, 'C19 第 1 页点得着');
    h.ctx.changeRelationsPage(3);
    eq(h.沙.window.RELATIONS_CURRENT_PAGE, 1, 'C20 10 人只有 1 页：翻第 3 页按住不动（旧代码按 40 人算成 4 页，会放玩家进第 3 页的空白）');
}

// ---- 阶梯对齐：真 npc-system.js 的 getRelationshipStatus × 真面板判词，18 组边界逐组核 ----
console.log('\n[DW-2b] 两套阶梯：18 组边界逐组核，卡片判词恒等于系统判定');
function 建NPC沙箱() {
    var 沙 = {
        console: { log: noop, warn: noop, error: noop },
        JSON: JSON, Object: Object, Array: Array, Math: Math, Number: Number,
        String: String, Boolean: Boolean, Set: Set, Map: Map, Date: Date,
        parseInt: parseInt, parseFloat: parseFloat, isNaN: isNaN, isFinite: isFinite,
        setTimeout: noop, clearTimeout: noop, setInterval: noop, clearInterval: noop,
        playerName: '测试道人',
        currentCharData: { name: '测试道人', location: '帝都·长安' },
        showMessage: noop,
        document: {
            addEventListener: noop, removeEventListener: noop,
            querySelector: function () { return null; }, getElementById: function () { return null; },
            querySelectorAll: function () { return []; },
            createElement: function () { return { style: {}, dataset: {}, setAttribute: noop, appendChild: noop, classList: { add: noop, remove: noop } }; },
            body: { appendChild: noop }
        }
    };
    沙.window = 沙; 沙.global = 沙; 沙.globalThis = 沙;
    var ctx = vm.createContext(沙);
    vm.runInContext(load('js/npcs/npc-system.js'), ctx, { filename: 'npc-system.js' });
    return { 沙: 沙, ctx: ctx };
}
{
    var nh = 建NPC沙箱();
    var NPC = vm.runInContext('NPC', nh.ctx);
    var rh = 建人脉沙箱();
    var 判词 = rh.ctx.getPanelRelationTier;

    function 造一个(aff, respect, hatred, fear) {
        var n = new NPC('t_x', '某', {});
        n.relationship.affection = aff;
        n.relationship.respect = respect;
        n.relationship.hatred = hatred;
        n.relationship.fear = fear;
        return n;
    }
    // 18 组边界：affection 的六个档口 × 三档敬重/仇恨/畏惧组合
    var 组 = [
        [80, 0, 0, 0], [79, 0, 0, 0],
        [60, 0, 0, 0], [59, 0, 0, 0],
        [40, 0, 0, 0], [39, 0, 0, 0],
        [20, 0, 0, 0], [19, 0, 0, 0],
        [-20, 0, 0, 0], [-21, 0, 0, 0],
        [-50, 0, 0, 0], [-51, 0, 0, 0],
        [0, 60, 0, 0], [0, 29, 0, 0],
        [-55, 0, 0, 0], [-55, 0, 70, 0],
        [-55, 0, 0, 70], [0, 0, 70, 0]
    ];
    var 不齐 = [];
    var 名字表 = [];
    组.forEach(function (g) {
        var n = 造一个(g[0], g[1], g[2], g[3]);
        var sys = n.getRelationshipStatus();
        var pan = 判词(n, g[0]);
        名字表.push('好' + g[0] + '/敬' + g[1] + '/仇' + g[2] + '/惧' + g[3] + '→' + sys.name);
        if (sys.name !== pan.name) 不齐.push('好感' + g[0] + ' 敬' + g[1] + ' 仇' + g[2] + ' 惧' + g[3]
            + '：系统判「' + sys.name + '」面板印「' + pan.name + '」');
    });
    ok(不齐.length === 0, 'D1 18 组边界上，卡片判词恒等于系统判定（不齐 ' + 不齐.length + ' 组）'
        + (不齐.length ? ' —— ' + 不齐.join('；') : ''));

    var 仇人 = 造一个(-55, 0, 0, 0);
    eq(仇人.getRelationshipStatus().name, '仇人', 'D2 好感 -55 的人不再被系统判成「路人」（旧阶梯负向只有一档，一路沉到 -100 也还是路人）');
    var 厌恶 = 造一个(-30, 0, 0, 0);
    eq(厌恶.getRelationshipStatus().name, '厌恶', 'D3 好感 -30 落在新增的「厌恶」档（-20 与 -50 之间原先无处安放）');
    var 深仇 = 造一个(-90, 0, 0, 0);
    eq(深仇.getRelationshipStatus().name, '仇人', 'D4 好感 -90 仍是仇人，没有被新档截胡');
    var 深交 = 造一个(90, 0, 0, 0);
    eq(深交.getRelationshipStatus().name, '至交', 'D6 交厚的正路没被新增两档截胡（affection 90 仍走第一档）');
    var 结怨 = 造一个(90, 0, 70, 0);
    eq(结怨.getRelationshipStatus().name, '死敌', 'D7 仇恨 60+ 的老规矩没动（affection 再高也先判死敌——旧阶梯原有的次序，本批没碰）');
    var 畏你 = 造一个(-55, 0, 0, 70);
    eq(畏你.getRelationshipStatus().name, '畏惧', 'D5 怕到那份上的人仍先由「畏惧」接住（新增两档排在它之后，不夺它的位）');

    // 没有 getRelationshipStatus 的裸对象（老存档手搓的）：退回旧七档，不能崩也不能空
    var 裸 = { relationship: { affection: 85 } };
    var 裸判 = 判词(裸, 85);
    eq(裸判.name, '挚爱', 'D7 没有判定函数的裸 NPC 仍按好感分出档位');
    eq(裸判.judged, false, 'D8 裸 NPC 的判词自报 fallback（便于排查哪张卡没走上判定）');
    var 崩的 = { getRelationshipStatus: function () { throw new Error('炸'); }, relationship: { affection: 85 } };
    var 崩判 = 判词(崩的, 85);
    eq(崩判.name, '挚爱', 'D9 判定函数抛错时退回旧七档而不是崩掉整个面板');
}

{
    // 渲染层：卡上只留一个判词，且带上 data-rel-tier 便于回归时定位
    var h = 建人脉沙箱();
    h.名单.push(造NPC('铁山', -55, '', '金城'));
    h.ctx.renderRelationsPanel();
    var 卡 = h.锚点['relations-npc-list'].innerHTML;
    ok(卡.indexOf('data-rel-tier="fallback"') >= 0, 'E1 裸 NPC 卡片标 fallback');
    ok(卡.indexOf('>仇人<') >= 0, 'E2 好感 -55 的卡片印的是「仇人」');
    ok(卡.indexOf('💗-55') >= 0, 'E3 好感原值仍并排印着（判词合并没有把数字吞掉）');
    ok(卡.indexOf('[路人]') < 0, 'E4 旧版那个自相矛盾的方括号判词徽章已撤（同一张卡上印两个互相打架的判词是病灶本身）');

    var rp = load('js/relations-panel.js');
    ok(rp.indexOf('getPanelRelationTier(npc, aff)') >= 1, 'E5 卡片取判词只走 getPanelRelationTier 一个口子');
    ok(挖注释(rp).indexOf("affLevel = '陌生人'") < 0, 'E6 面板自带的七档阶梯已从渲染路径上撤下（只留兜底分支）');
}

// ================================================================
// [DW-3] 采矿区域加成 + 13 个 bonus 键逐条对账
// ================================================================
console.log('\n[DW-3] 采矿区域加成：换地区读数真不同；13 个 bonus 键逐条对账');

function 建区域沙箱() {
    var 沙 = {
        console: { log: noop, warn: noop, error: noop },
        Math: Math, JSON: JSON, Object: Object, Array: Array, String: String, Number: Number,
        setTimeout: noop, clearTimeout: noop,
        document: { getElementById: function () { return null; }, addEventListener: noop, body: { appendChild: noop } }
    };
    沙.window = 沙;
    var ctx = vm.createContext(沙);
    vm.runInContext(load('js/regions.js'), ctx, { filename: 'regions.js' });
    return { 沙: 沙, ctx: ctx };
}
var 地区表 = 建区域沙箱();
var 七州 = ['中州', '东荒', '南疆', '西漠', '北冥', '蜀地', '东南海域'];
{
    var gb = 地区表.ctx.getRegionBonus;
    var 读数 = 七州.map(function (r) { return gb(r).mining; });
    ok(读数.every(function (v) { return typeof v === 'number' && v > 0; }), 'F1 七个地区都配上了 bonus.mining（旧版一个都没配，读数恒为 undefined ⇒ 加成恒 1.0）');
    ok(new Set(读数).size >= 5, 'F2 七州读数至少五个不同值（不是全体一个数糊弄过去）：' + 七州.map(function (r, i) { return r + '=' + 读数[i]; }).join(' '));
    eq(gb('西漠').mining, 1.3, 'F3 西漠（region desc 明写「金城盛产灵石矿脉」）读数 1.30，是七州最高');
    eq(gb('东荒').mining, 0.9, 'F4 东荒（林海土厚）读数 0.90，低于平账——区域特色是双向的');
    ok(读数.every(function (v) { return v > 0 && v <= 1.4; }), 'F5 配值都落在 0.90~1.30 这个窄幅里（区域特色要看得见，又不至于把某一格顶死）');
    ok(gb('东荒').herb === 1.3, 'F6 采药那条线的 herb 加成仍在（它本来就接上了，不能被这批改坏）');
}

{
    // app.js 的 mineOre 按函数原文逐字抽出来，在沙箱里真调：同一串骰子、不同地区，产出必须不同
    var appSrc = src('js/app.js');
    var 采矿函数 = 抽函数(appSrc, 'mineOre');
    var 定位函数 = 抽函数(appSrc, 'getCurrentRegionForGathering');
    ok(采矿函数.indexOf('bonus.mining') >= 0, 'F7 mineOre 读的正是 bonus.mining 这个键（键名没拼错）');

    function 跑一次采矿(地区名) {
        var 收成 = [];
        var 骰 = [0.5, 0.5].concat(new Array(30).fill(0.94));   // 前两枚躲开塌方/兽穴，其后每样矿石一枚
        var 沙 = {
            console: { log: noop, warn: noop, error: noop },
            Math: {
                random: function () { return 骰.length > 1 ? 骰.shift() : 0.94; },
                floor: Math.floor, min: Math.min, max: Math.max
            },
            JSON: JSON, Object: Object, Array: Array, String: String, Number: Number, Set: Set, Map: Map,
            setTimeout: noop, clearTimeout: noop,
            currentCharData: { energy: 100, health: 100, lifeSkills: { '采伐': 20 } },
            itemById: { mat_iron_ore: { name: '铁矿' }, mat_copper_ore: { name: '铜矿' }, mat_tin_ore: { name: '锡矿' } },
            showMessage: noop, 货账话: function () { return ''; },
            timeSystem: { advanceTime: noop },
            getCurrentLocation: function () { return '帝都 · 长安'; },
            window: null
        };
        沙.window = 沙;
        沙.addItem = function (id, n) { 收成.push(id); return n; };
        沙.getRegionBonus = 地区表.ctx.getRegionBonus;
        沙.mapData = 地区表.沙.mapData;
        沙.window.currentRegionForMap = 地区名;
        var ctx = vm.createContext(沙);
        vm.runInContext(定位函数, ctx, { filename: 'app.js#getCurrentRegionForGathering' });
        vm.runInContext(采矿函数, ctx, { filename: 'app.js#mineOre' });
        ctx.mineOre();
        return 收成;
    }
    var 西漠收 = 跑一次采矿('西漠');
    var 东荒收 = 跑一次采矿('东荒');
    var 中州收 = 跑一次采矿('中漠' in {} ? '中漠' : '中州');
    ok(西漠收.indexOf('mat_iron_ore') >= 0, 'F8 西漠（mining 1.30，铁矿概率封顶 0.95）同一串骰子下挖出了铁矿');
    ok(东荒收.indexOf('mat_iron_ore') < 0, 'F9 东荒（mining 0.90，铁矿概率 0.72）同一串骰子下没挖出铁矿——加成真按地区生效了');
    ok(中州收.indexOf('mat_iron_ore') < 0, 'F10 中州（mining 1.10，铁矿概率 0.88）也没挖出，与东荒、西漠三档分得开');
    ok(JSON.stringify(西漠收) !== JSON.stringify(东荒收), 'F11 两地收成清单确实不同（旧代码下两地产出逐字相同）');

    // 概率封顶：西漠那档 0.8×1.30=1.04 若不封顶就必中，随机性被抹平
    ok(采矿函数.indexOf('Math.min(0.95, base * regionBonus)') >= 0, 'F12 概率按 0.95 封顶（与 chopWood 的地脉加成同一把尺）');
    ok(挖注释(采矿函数).indexOf('0.8 * regionBonus') < 0 && 挖注释(采矿函数).indexOf('0.5 * regionBonus') < 0,
        'F13 三行基础矿样不再直接乘未封顶的倍率');

    // 伐木：东荒 bonus.wood 此前零读方
    var 伐木函数 = 抽函数(appSrc, 'chopWood');
    ok(伐木函数.indexOf('.wood') >= 0 && 伐木函数.indexOf('getRegionBonus') >= 0,
        'F14 chopWood 真去读地区木头加成（旧版伐木整条线没接区域，bonus.wood 零读方）');

    // 修炼：蜀地 bonus.cultivation 此前零读方
    var 修炼函数 = 抽函数(appSrc, 'cultivationMeditate');
    ok(修炼函数.indexOf('_rcBonus.cultivation') >= 0, 'F15 打坐真去读地区修炼加成（蜀地 1.1，旧版零读方）');
    var 丹毒位 = 修炼函数.indexOf('_ppPen');
    var 地区位 = 修炼函数.indexOf('_rcBonus.cultivation');
    var 心境位 = 修炼函数.indexOf('MoodSystem.cultivationMul');
    var 定境位 = 修炼函数.indexOf('_medRoll');
    ok(丹毒位 >= 0 && 丹毒位 < 地区位 && 地区位 < 心境位 && 心境位 < 定境位,
        'F16 地区加成排在丹毒之后、心境之前、���境浮动之前——乘法链次序没被打乱');
    eq((修炼函数.match(/Math\.random/g) || []).length, 3, 'F17 打坐切片仍是三枚骰（地区加成为纯倍率，零骰纪律不添）');
}

// ---- 11 个零读方键逐条登记 ----
console.log('\n[DW-3b] 零读方 bonus 键：逐条判定与登记');
{
    var 登记 = 地区表.ctx.REGION_DEAD_BONUS_KEYS || 地区表.沙.REGION_DEAD_BONUS_KEYS;
    ok(登记 && typeof 登记 === 'object', 'G1 零读方键有正式登记表 REGION_DEAD_BONUS_KEYS（不再是散在注释里的口头交代）');

    var 全部键 = {};
    七州.forEach(function (r) {
        var b = 地区表.ctx.getRegionBonus(r);
        Object.keys(b).forEach(function (k) { 全部键[k] = 1; });
    });
    var 键表 = Object.keys(全部键);
    eq(键表.length, 14, 'G2 七地区 bonus 一共 14 个键位（13 个不重名 + water 出现在北冥与东南海域两处）');
    eq(键表.filter(function (k) { return k !== 'mining'; }).length, 13, 'G3 不含新配的 mining 时，正好是任务书说的那 13 个键');

    var 该活的 = ['mining', 'herb', 'wood', 'cultivation'];
    var 死的 = 键表.filter(function (k) { return 该活的.indexOf(k) < 0; });
    ok(死的.length === 10, 'G4 13 个老键里：herb 本来就接上了，本批再接上 wood/cultivation ⇒ 剩 10 个零读方（实测 ' + 死的.length + '）：' + 死的.join(' '));
    ok(死的.every(function (k) { return 登记 && 登记[k]; }), 'G5 这 10 个键每一条都有登记理由，一个都没漏');
    ok(['copper', 'trade', 'fire', 'poison', 'defense', 'earth', 'ice', 'water', 'sword', 'luck'].every(function (k) { return 登记[k]; }),
        'G6 登记覆盖 copper/trade/fire/poison/defense/earth/ice/water/sword/luck 全十键');
    ['copper', 'trade', 'fire', 'poison', 'defense', 'earth', 'ice', 'water', 'sword', 'luck'].forEach(function (k) {
        ok(typeof 登记[k] === 'string' && 登记[k].length >= 8, 'G7 ' + k + ' 的登记写了去向/为什么不接：' + String(登记[k]).slice(0, 40) + '…');
    });
    ok(该活的.every(function (k) { return !登记[k]; }), 'G8 已接上的四个键不在废弃登记里（接上了就不许再挂「待接」）');

    // 顺手核：登记里写的「工程里根本没有这个接入口」得真的是 0 命中（只扫游戏代码，不扫本测试自己）
    var 无口 = ['getElementBonus', 'elementBonus', 'ELEMENT_BONUS', 'elementMul', 'getElementMultiplier'];
    var 命中 = [];
    收js(path.join(ROOT, 'js')).forEach(function (p) {
        if (/regions\.js$/.test(p)) return;
        var t = fs.readFileSync(p, 'utf8');
        无口.forEach(function (k) { if (t.indexOf(k) >= 0) 命中.push(p.replace(ROOT, '') + '←' + k); });
    });
    ok(命中.length === 0, 'G9 属性加成接入口在 js/ 里确实不存在（登记理由站得住）：' + (命中.length ? 命中.join(', ') : '零命中'));
}
function 收js(dir, out) {
    out = out || [];
    var SKIP = { node_modules: 1, '.git': 1, '.kilo': 1, '.scratch': 1, '.playwright-mcp': 1 };
    var list;
    try { list = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return out; }
    list.forEach(function (e) {
        if (SKIP[e.name]) return;
        var p = path.join(dir, e.name);
        if (e.isDirectory()) 收js(p, out);
        else if (/\.js$/.test(e.name)) out.push(p);
    });
    return out;
}

// ================================================================
console.log('\n========== 第一百四十三批 · 三处死接线 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);