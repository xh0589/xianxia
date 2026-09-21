// ==================== v22.1 江湖行验收：掌门下山 + 外院求见 ====================
// 用户问题：「不加一个门派连恋爱NPC都见不到」。方案（用户确认「就这么做+再加递帖求见」）：
// ①恋爱线掌门按 deterministic 日程下山游历一日（城中人物名录自然现身）；②城里相识好感到线她递邀约；
// ③外院「求见掌门」：应约/侠名≥100/开放日（初一、十五）三条通传路；④掌门在山下时外院/大殿留去向话头；
// ⑤百花谷、修罗宫「仅限弟子」的进门派触发钩子放开到访客。
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');

let passed = 0; const failures = [];
function ok(cond, msg) { if (cond) { passed++; } else { failures.push(msg); console.log('  ✗ ' + msg); } }
function eq(a, b, msg) { ok(a === b, msg + '（实得 ' + a + '，期望 ' + b + '）'); }
function read(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ============ A 源码接线 ============
{
    const html = read('仙侠.html');
    ok(html.indexOf('js/npcs/leader-excursion.js') >= 0, 'A1 游历模块已挂进页面');

    const sv = read('js/sects/sect-visit.js');
    ok(sv.indexOf("if (sectName === '百花谷' && typeof window.maybeAutoTriggerBaihuaEvent") >= 0
        && sv.indexOf("isMember && sectName === '百花谷'") < 0, 'A2 百花谷进门派钩子已放开到访客');
    ok(sv.indexOf("if (sectName === '修罗宫' && typeof window.maybeAutoTriggerFeiLeiEvent") >= 0
        && sv.indexOf("isMember && sectName === '修罗宫'") < 0, 'A3 修罗宫进门派钩子已放开到访客');
    ok(sv.indexOf('window.renderSectLeaderAudience(sectName, isMember)') >= 0, 'A4 外院视图接入「求见掌门」卡片');

    const sys = read('js/npcs/npc-system.js');
    ok(/window\.tryGrantSectInvitation\(npcId\)/.test(sys) && sys.indexOf('!isRemote && typeof window.tryGrantSectInvitation') >= 0,
        'A5 亲至交谈接入邀约递话');

    const sf = read('js/sects/sect-facilities.js');
    ok(sf.indexOf('window.isLeaderAway(_awaySect)') >= 0 && sf.indexOf('下山游历') >= 0, 'A6 掌门大殿留「外出游历」字条');
}

// ============ 沙盒基建 ============
function fakeEl(tag) {
    const el = {
        tagName: tag || 'div', style: {}, dataset: {}, children: [],
        classList: { _s: {}, add(c) { this._s[c] = 1; }, remove(c) { delete this._s[c]; }, contains(c) { return !!this._s[c]; } },
        appendChild(c) { this.children.push(c); return c; }, removeChild() {}, remove() {},
        setAttribute() {}, getAttribute() { return null; }, addEventListener() {}, focus() {},
        closest() { return null; }, onclick: null, innerHTML: '', textContent: '', value: '', checked: false
    };
    el.querySelector = function (sel) { el._qs = el._qs || {}; if (!el._qs[sel]) el._qs[sel] = fakeEl('qs:' + sel); return el._qs[sel]; };
    el.querySelectorAll = function () { return []; };
    return el;
}
const REG_FILES = [
    'js/npcs/npc-personal-events.js', 'js/npcs/baihua-personal-events.js', 'js/npcs/baihua-events-main.js', 'js/npcs/baihua-events-extra.js',
    'js/npcs/city-residents.js', 'js/npcs/daqi-events.js', 'js/npcs/dayin-events.js',
    'js/npcs/duel-showcases-1.js', 'js/npcs/duel-showcases-2.js', 'js/npcs/duel-showcases-3.js', 'js/npcs/duel-showcases-4.js',
    'js/npcs/emei-events.js', 'js/npcs/feixie-events.js', 'js/npcs/gaibang-events.js',
    'js/npcs/hengshan-beiyue-events.js', 'js/npcs/hengshan-nanyue-events.js',
    'js/npcs/heroine-aftermath.js', 'js/npcs/heroine-female-context.js', 'js/npcs/heroine-male-context.js',
    'js/npcs/heroine-rivalry-bridge.js', 'js/npcs/heroine-rivalry.js', 'js/npcs/huashan-events.js',
    'js/npcs/jealousy-assembly.js', 'js/npcs/jealousy-collective.js', 'js/npcs/jealousy-deep.js',
    'js/npcs/jingang-events.js', 'js/npcs/kunlun-events.js', 'js/npcs/lieri-events.js',
    'js/npcs/male-lead-aftermath.js', 'js/npcs/male-lead-bridge.js', 'js/npcs/male-lead-reconcile.js', 'js/npcs/male-lead-rivalry.js',
    'js/npcs/maoshan-events.js', 'js/npcs/penglai-events.js', 'js/npcs/pili-events.js',
    'js/npcs/qingcheng-events.js', 'js/npcs/quanzhen-events.js', 'js/npcs/secret-leverage.js',
    'js/npcs/shaolin-events.js', 'js/npcs/shaolin-pojie-events.js', 'js/npcs/shenji-events.js', 'js/npcs/songshan-events.js',
    'js/npcs/storylines-v2/batch1.js', 'js/npcs/storylines-v2/batch2.js', 'js/npcs/storylines-v2/batch3.js',
    'js/npcs/taishan-events.js', 'js/npcs/tangmen-events.js', 'js/npcs/tianlong-events.js', 'js/npcs/tianshan-events.js',
    'js/npcs/tianshu-events.js', 'js/npcs/tianya-events.js', 'js/npcs/tiezhang-events.js', 'js/npcs/wudang-events.js',
    'js/npcs/wujiu-jealousy.js', 'js/npcs/wuxian-events.js', 'js/npcs/xiaoyao-events.js', 'js/npcs/xiayin-events.js',
    'js/npcs/xueshou-events.js', 'js/npcs/yanluo-events.js', 'js/npcs/yaowang-events.js', 'js/npcs/zhujian-events.js'
];
function makeWorld(opts) {
    opts = opts || {};
    const sb = {
        console: { log() {}, warn() {}, error() {} },
        setTimeout: function (f) { return 0; }, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
        Math, JSON, Date, Object, Array, String, Number, Boolean, RegExp, Error, isFinite, isNaN, parseInt, parseFloat
    };
    sb.window = sb; sb.globalThis = sb;
    sb.document = {
        createElement: fakeEl, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
        body: { appendChild(el) { return el; }, removeChild() {} }, head: { appendChild() {} },
        addEventListener() {}, documentElement: { style: {} }
    };
    sb.localStorage = { _s: {}, getItem(k) { return Object.prototype.hasOwnProperty.call(this._s, k) ? this._s[k] : null; }, setItem(k, v) { this._s[k] = String(v); }, removeItem(k) { delete this._s[k]; } };
    sb.__day = opts.day || 1;
    sb.timeSystem = {
        gameTime: { get currentDay() { return sb.__day; }, currentHour: 12, currentMinute: 0 },
        getAbsoluteDay: () => sb.__day,
        onNewDaySubscribe() {}, advanceTime() {}
    };
    sb.__msgs = [];
    sb.showMessage = function (t) { sb.__msgs.push(String(t)); };
    sb.gameLog = { add() {} };
    sb.EventBus = { on() {}, emit() {}, off() {} };
    sb.currentCharData = { name: '测试修士', gender: 'male', location: '帝都 · 长安', fame: 0, flags: {} };
    sb.discipleState = { isInSect: false };
    sb.__npcs = {};
    sb.npcManager = { getNPC: (id) => sb.__npcs[id] || null, getAllNPCs: () => Object.values(sb.__npcs), addNPC(n) { sb.__npcs[n.id] = n; } };
    sb.__dialogs = [];
    sb.showNPCDialog = function (id) { sb.__dialogs.push(id); };
    vm.createContext(sb);
    return sb;
}
function fakeLeader(id, name, loc, aff) {
    const flags = new Set();
    return {
        id, name, gender: 'female', occupation: '掌门', location: loc,
        appearance: { icon: '🗡️' },
        memory: { firstMet: true, meetCount: 3 },
        relationship: { affection: aff === undefined ? 20 : aff, trust: 10, flags },
        hasFlag: (f) => flags.has(f), setFlag: (f) => flags.add(f),
        isDead: false, isMissing: false
    };
}
// 加载真实世界数据 + 事件池 + 游历模块
function loadWorld(opts) {
    const w = makeWorld(opts);
    vm.runInContext(read('js/regions.js'), w, { filename: 'regions.js' });
    vm.runInContext(read('js/sects/sects.js'), w, { filename: 'sects.js' });
    const loadFail = [];
    for (const f of REG_FILES) {
        try { vm.runInContext(read(f), w, { filename: f }); } catch (e) { loadFail.push(f + ': ' + e.message); }
    }
    ok(loadFail.length === 0, 'B0 世界数据与全部 ' + REG_FILES.length + ' 个事件文件沙盒加载零失败' + (loadFail.length ? '：' + loadFail.join(' | ') : ''));
    vm.runInContext(read('js/npcs/leader-excursion.js'), w, { filename: 'leader-excursion.js' });
    return w;
}

// ============ B 下山日程：deterministic、限流、走与回 ============
{
    const w = loadWorld({ day: 1 });
    const sects = Object.keys(w.sectsData);
    // 全员就位：36 位掌门在自家山门
    for (const s of sects) w.__npcs['sect_leader_' + s] = fakeLeader('sect_leader_' + s, s + '掌门', s);

    function awaySet(day) {
        w.__day = day;
        w.syncLeaderExcursions();
        const set = {};
        for (const s of sects) {
            const n = w.__npcs['sect_leader_' + s];
            if (n.location !== s) set[s] = n.location;
        }
        return set;
    }

    const d1 = awaySet(1), d1again = awaySet(1);
    ok(JSON.stringify(d1) === JSON.stringify(d1again), 'B1 日程 deterministic：同日两算结果一致');
    ok(Object.keys(d1).length > 0, 'B2 第 1 天就有掌门下山（实得 ' + Object.keys(d1).length + ' 位）');

    // 位置合法：去的必是本区域城市
    let badCity = 0;
    for (const s in d1) {
        const region = w.sectsData[s].location;
        const cities = (w.mapData[region] || {}).cities || [];
        if (cities.indexOf(d1[s]) < 0) badCity++;
    }
    eq(badCity, 0, 'B3 下山去的是本区域城市');

    // 同城限流 ≤2
    let capBad = 0;
    for (let day = 1; day <= 14; day++) {
        const set = awaySet(day);
        const byCity = {};
        for (const s in set) byCity[set[s]] = (byCity[set[s]] || 0) + 1;
        for (const c in byCity) if (byCity[c] > 2) capBad++;
        // 走的人位置=城，没走的人位置=山门（B4 归位）
        for (const s of sects) {
            const n = w.__npcs['sect_leader_' + s];
            if (set[s]) { if (n.location !== set[s]) capBad += 100; }
            else if (n.location !== s) capBad += 100;
        }
    }
    eq(capBad, 0, 'B4 十四日内同城游历 ≤2 位，走的在城、留的在山（位置日日校正）');

    // 每位掌门 30 天内至少下山一次（缘分不缺席）
    const ever = {};
    for (let day = 1; day <= 30; day++) { const set = awaySet(day); for (const s in set) ever[s] = 1; }
    const never = sects.filter(s => !ever[s]);
    eq(never.length, 0, 'B5 三十日内每位掌门都下过山' + (never.length ? '：' + never.join(',') : ''));

    // 死亡掌门不下山
    w.__npcs['sect_leader_少林寺'].isDead = true;
    let deadAway = 0;
    for (let day = 1; day <= 30; day++) { w.__day = day; w.syncLeaderExcursions(); if (w.__npcs['sect_leader_少林寺'].location !== '少林寺') deadAway++; }
    eq(deadAway, 0, 'B6 仙逝掌门不再下山');
    w.__npcs['sect_leader_少林寺'].isDead = false;
}

// ============ C 邀约：城里相识、情分到线，她递话 ============
{
    const w = loadWorld({ day: 1 });
    w.__npcs['sect_leader_修罗宫'] = fakeLeader('sect_leader_修罗宫', '绯泪', '帝都 · 长安', 45);
    w.currentCharData.location = '帝都 · 长安';

    eq(w.tryGrantSectInvitation('sect_leader_修罗宫'), true, 'C1 城里相识+好感45 → 递话成功');
    ok(w.__npcs['sect_leader_修罗宫'].hasFlag('sect_invite'), 'C2 邀约写入 NPC 旗（随存档走）');
    ok(w.__msgs.some(m => m.indexOf('修罗宫') >= 0 && m.indexOf('报我名讳') >= 0), 'C3 递话文案点名山门与报法');
    eq(w.tryGrantSectInvitation('sect_leader_修罗宫'), false, 'C4 已有邀约不重复递话');

    // 好感不足
    const low = fakeLeader('sect_leader_百花谷', '温蘅', '洛水城', 30);
    w.__npcs['sect_leader_百花谷'] = low;
    w.currentCharData.location = '洛水城';
    eq(w.tryGrantSectInvitation('sect_leader_百花谷'), false, 'C5 好感未到线不递话');
    low.relationship.affection = 50;
    eq(w.tryGrantSectInvitation('sect_leader_百花谷'), true, 'C6 好感过线即递话');

    // 在山上（门内）相识不走邀约——门里本来就能见
    const home = fakeLeader('sect_leader_百花谷', '温蘅', '百花谷', 60);
    w.__npcs['sect_leader_百花谷'] = home;
    w.currentCharData.location = '百花谷';
    eq(w.tryGrantSectInvitation('sect_leader_百花谷'), false, 'C7 人在门中不递「来门中找我」的废话');

    // 无线人物不递话
    const nobody = fakeLeader('warrior_01', '铁拳', '帝都 · 长安', 80);
    w.__npcs['warrior_01'] = nobody;
    eq(w.tryGrantSectInvitation('warrior_01'), false, 'C8 非掌门不递话');

    // 未结识不递话
    const stranger = fakeLeader('sect_leader_百花谷', '温蘅', '洛水城', 60);
    stranger.memory.firstMet = false; stranger.memory.meetCount = 0;
    w.__npcs['sect_leader_百花谷'] = stranger;
    w.currentCharData.location = '洛水城';
    eq(w.tryGrantSectInvitation('sect_leader_百花谷'), false, 'C9 素未谋面不递话');
}

// ============ D 外院求见卡片：三条通传路 + 去向话头 ============
{
    const w = loadWorld({ day: 3 }); // 非开放日（dayOfMonth=3）
    const leader = fakeLeader('sect_leader_修罗宫', '绯泪', '修罗宫', 20);
    w.__npcs['sect_leader_修罗宫'] = leader;
    w.currentCharData.fame = 0;
    // 卡片渲染会顺手校正下山日程——测试里先让日程跑一遍，再手工摆位，
    // 同日内 ensure 不再重算（syncedDay 闸），摆位不会被日程覆盖。
    function placeAtSect(day) { w.__day = day; w.ensureExcursionSynced(); leader.location = '修罗宫'; }
    placeAtSect(3);

    // D1 平日无名无约：吃闭门羹但有指引
    let html = w.renderSectLeaderAudience('修罗宫', false);
    ok(html.indexOf('求见掌门') >= 0 && html.indexOf('硬着头皮递帖') >= 0 && html.indexOf('开放日') >= 0,
        'D1 平日无名无约：执事回绝 + 指引（侠名/开放日/结缘）');
    ok(html.indexOf('初一') >= 0 || html.indexOf('十五') >= 0, 'D1b 指引写明开放日');

    // D2 应约
    leader.setFlag('sect_invite');
    html = w.renderSectLeaderAudience('修罗宫', false);
    ok(html.indexOf('应约求见') >= 0 && html.indexOf("'invite'") >= 0, 'D2 持她的话：应约求见');

    // D3 侠名
    leader.relationship.flags.delete('sect_invite');
    w.currentCharData.fame = 150;
    html = w.renderSectLeaderAudience('修罗宫', false);
    ok(html.indexOf('递名帖求见') >= 0 && html.indexOf("'fame'") >= 0, 'D3 侠名远播：执事客气通传');
    w.currentCharData.fame = 0;

    // D4 开放日（currentDay=1 → 初一；currentDay=15 → 十五）
    placeAtSect(1);
    html = w.renderSectLeaderAudience('修罗宫', false);
    ok(html.indexOf('开放日递帖') >= 0 && html.indexOf("'openday'") >= 0, 'D4 初一开放日：外客可递帖');
    placeAtSect(15);
    html = w.renderSectLeaderAudience('修罗宫', false);
    ok(html.indexOf('开放日递帖') >= 0, 'D4b 十五开放日同样敞开');
    placeAtSect(3);

    // D5 掌门下山：去向话头把玩家引到城里
    leader.location = '帝都 · 长安';
    html = w.renderSectLeaderAudience('修罗宫', false);
    ok(html.indexOf('游历') >= 0 && html.indexOf('帝都 · 长安') >= 0, 'D5 掌门在山下：外院留去向话头');
    leader.location = '修罗宫';

    // D6 本派弟子不走这条卡片（自有内院名录与大殿）
    eq(w.renderSectLeaderAudience('修罗宫', true), '', 'D6 弟子不显示游客求见卡');

    // D7 通传落地：grantSectAudience 开门并叫起对话
    w.__dialogs.length = 0;
    w.grantSectAudience('修罗宫', 'invite');
    eq(w.__dialogs.length, 1, 'D7a 应约通传：对话面板拉起');
    eq(w.__dialogs[0], 'sect_leader_修罗宫', 'D7b 见到的正是掌门本人');
    // 从对话落点看：玩家 location=修罗宫、掌门 location=修罗宫 → 非远程，事件系统照常工作
    w.currentCharData.location = '修罗宫';

    // D8 硬递帖被拒不崩
    w.__dialogs.length = 0;
    w.refuseSectAudience('修罗宫');
    eq(w.__dialogs.length, 0, 'D8 被拒不开对话，只吃闭门羹');
    ok(w.__msgs.some(m => m.indexOf('不奉告') >= 0), 'D8b 回绝有话术');
}

// ============ E 与 v22.0 事件门禁的衔接 ============
{
    const w = loadWorld({ day: 1 });
    const leader = fakeLeader('sect_leader_修罗宫', '绯泪', '帝都 · 长安', 25);
    w.__npcs['sect_leader_修罗宫'] = leader;
    w.currentCharData.location = '帝都 · 长安';
    w._settings = {};
    // E1 城里搭话：门派专属剧情一桩不响（地点闸天然挡住），纯社交
    eq(w.personalEventGreetGate(leader, 'sect_leader_修罗宫'), false, 'E1 城中相遇只社交不响戏（事件锁在门内）');
    // E2 进城后（人站在修罗宫里）：链头就绪，交谈即入戏照常工作
    leader.location = '修罗宫';
    w.currentCharData.location = '修罗宫';
    eq(w.personalEventGreetGate(leader, 'sect_leader_修罗宫'), true, 'E2 上山之后：v22.0「交谈即入戏」无缝接管');
}

// ============ 汇总 ============
console.log('v22.1-excursion: ' + passed + ' passed, ' + failures.length + ' failed');
if (failures.length > 0) process.exit(1);
console.log('v22.1-excursion: all green');
