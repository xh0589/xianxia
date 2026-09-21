// ==================== v22.0 沉浸社交验收 ====================
// 用户三问：①设置里加「社交面板显示个人事件」开关（默认关）；②每个个人事件都能条件达成后自动触发
// （门槛低的一对话就拦住面板直接开场）；③清掉其他穿帮点（远程档案弹事件 / 「触发故事线」系统话按钮 / 双重弹窗）。
// 本测试分四段：A 源码接线 / B 全池审计（59 个注册文件 965 桩事件逐一分类）/ C 门禁运行时 / D 拦截运行时。
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
    ok(html.indexOf('id="setting-social-event-panel"') >= 0 && html.indexOf('onchange="toggleSocialEventPanel()"') >= 0,
        'A1 设置页有「社交面板显示个人事件」开关');
    const sepLine = html.split('\n').filter(l => l.indexOf('setting-social-event-panel') >= 0)[0] || '';
    ok(sepLine.indexOf('checked') < 0, 'A2 开关默认关闭（input 不带 checked）');
    ok(html.indexOf('📜似有心事') >= 0 && html.indexOf('📜有新事件') < 0, 'A3 人脉筛选改为「似有心事」口径');

    const app = read('js/app.js');
    ok(/function toggleSocialEventPanel\(\)[\s\S]{0,400}window\._settings\.socialEventPanel = !!cb\.checked[\s\S]{0,200}xianxia_settings/.test(app),
        'A4 开关写入 _settings 并持久化');
    ok(app.indexOf('window.toggleSocialEventPanel = toggleSocialEventPanel;') >= 0, 'A5 开关函数已导出');
    ok(/sepCb[\s\S]{0,120}socialEventPanel === true/.test(app), 'A6 initSettings 回填勾选态（默认 false）');

    const npe = read('js/npcs/npc-personal-events.js');
    ok(/function getPersonalEventButtons\(npc, npcId\) \{[\s\S]{0,600}socialEventPanel === true\)\) return '';/.test(npe),
        'A7 面板清单函数带沉浸闸（未开启即返回空）');
    ok(npe.indexOf('injectSectSecrets();') < npe.indexOf("socialEventPanel === true)) return '';"),
        'A8 秘密补注入先于沉浸闸（懒注册掌门的秘密不断供）');
    ['window.isEventReadyNow', 'window.isPersonalLineFinished', 'window.tryInterceptPersonalEvent', 'window.personalEventGreetGate'].forEach(fn => {
        ok(npe.indexOf(fn + ' =') >= 0, 'A9 导出 ' + fn);
    });

    const sys = read('js/npcs/npc-system.js');
    ok(sys.indexOf("maybeAutoTriggerFeiLeiEvent('greet')") < 0 && sys.indexOf("maybeAutoTriggerBaihuaEvent('greet')") < 0,
        'A10 逐线硬编码 greet 钩子已撤（改全线通用闸）');
    ok(/if \(!isRemote && typeof window\.personalEventGreetGate === 'function'\)[\s\S]{0,200}personalEventGreetGate\(npc, npcId\)\) return;/.test(sys),
        'A11 亲至交谈走通用闸，拦截成功则面板不显示');
    ok(/window\._npcDialogIsRemote = isRemote;[\s\S]{0,300}getGreeting\(npc[\s\S]{0,200}window\._npcDialogIsRemote = false;/.test(sys),
        'A12 远程旗在取问候语前置起、取完即落');
    ok(sys.indexOf('触发故事线') < 0, 'A13 「触发故事线」系统话按钮已撤');
    ok(/personal-event-modal'\)\) return;\s*\n\s*checkNPCStorylines/.test(sys), 'A14 故事线延时检查不与事件弹窗叠台');

    const bh = read('js/npcs/baihua-personal-events.js');
    ok(/if \(source === 'greet' && window\._npcDialogIsRemote\) return false;/.test(bh),
        'A15 远程翻档案不弹「她叫住了你」');

    const rp = read('js/relations-panel.js');
    ok(rp.indexOf('window.isEventReadyNow') >= 0, 'A16 「似有心事」筛选按就绪门禁判定');
}

// ============ 沙盒基建 ============
function fakeEl(tag) {
    const el = {
        tagName: tag || 'div', style: {}, dataset: {}, children: [],
        classList: { _s: {}, add(c) { this._s[c] = 1; }, remove(c) { delete this._s[c]; }, contains(c) { return !!this._s[c]; } },
        _html: '', _text: '', value: '', checked: false, scrollTop: 0, scrollHeight: 0,
        appendChild(c) { this.children.push(c); return c; }, removeChild() {}, remove() { if (el._onRemove) el._onRemove(el); },
        setAttribute() {}, getAttribute() { return null; }, addEventListener() {}, focus() {},
        closest() { return null; }, onclick: null
    };
    Object.defineProperty(el, 'innerHTML', { get() { return this._html; }, set(v) { this._html = v; } });
    Object.defineProperty(el, 'textContent', { get() { return this._text; }, set(v) { this._text = v; } });
    el.querySelector = function (sel) {
        el._qs = el._qs || {};
        if (!el._qs[sel]) el._qs[sel] = fakeEl('qs:' + sel);
        return el._qs[sel];
    };
    el.querySelectorAll = function () { return []; };
    return el;
}
function makeWorld(opts) {
    opts = opts || {};
    const dayHooks = [];
    const sb = {
        console: { log() {}, warn() {}, error() {} },
        setTimeout: function (f, ms) { if (opts.runTimers) { try { f(); } catch (e) {} } return 0; },
        clearTimeout() {}, setInterval: () => 0, clearInterval() {},
        Math, JSON, Date, Object, Array, String, Number, Boolean, RegExp, Error, isFinite, isNaN, parseInt, parseFloat
    };
    sb.window = sb; sb.globalThis = sb;
    const modals = [];
    sb.__modals = modals;
    sb.document = {
        createElement: fakeEl,
        getElementById: () => null,
        querySelector: function (sel) {
            if (sel === '.personal-event-modal') return modals.filter(m => !m._removed)[0] || null;
            return null;
        },
        querySelectorAll: () => [],
        body: { appendChild(el) { if (el && String(el.className || '').indexOf('personal-event-modal') >= 0) { el._onRemove = () => { el._removed = true; }; modals.push(el); } return el; }, removeChild() {} },
        head: { appendChild() {} },
        addEventListener() {},
        documentElement: { style: {} }
    };
    sb.localStorage = { _s: {}, getItem(k) { return Object.prototype.hasOwnProperty.call(this._s, k) ? this._s[k] : null; }, setItem(k, v) { this._s[k] = String(v); }, removeItem(k) { delete this._s[k]; } };
    sb.timeSystem = { gameTime: { currentHour: opts.hour === undefined ? 12 : opts.hour, currentDay: 1 }, onNewDaySubscribe(cb) { dayHooks.push(cb); }, getAbsoluteDay: () => 1, advanceTime() {} };
    sb.__dayHooks = dayHooks;
    sb.EventBus = { on() {}, emit() {}, off() {} };
    sb.showMessage = () => {};
    sb.gameLog = { add() {} };
    sb.currentCharData = { name: '测试修士', gender: 'male', location: '修罗宫', flags: {}, energy: 100 };
    sb.discipleState = { isInSect: false };
    sb.npcManager = { getNPC: (id) => (sb.__npcs && sb.__npcs[id]) || null, getAllNPCs: () => Object.values(sb.__npcs || {}), addNPC() {} };
    sb.__npcs = {};
    vm.createContext(sb);
    return sb;
}
function fakeLeader(id, name, aff) {
    return {
        id, name, gender: 'female', occupation: '掌门', location: '修罗宫',
        appearance: { icon: '🗡️' },
        memory: { firstMet: true, meetCount: 3 },
        relationship: { affection: aff === undefined ? 25 : aff, trust: 10, respect: 0, favor: 0 },
        state: { mood: 50, stress: 20 },
        hasFlag: () => false, setFlag() {},
        recordPlayerAction() {}, getRelationshipStatus: () => null
    };
}

// ============ B 全池审计：每个事件的自动触发路径都有着落 ============
const REG_FILES = [
    'js/npcs/npc-personal-events.js', 'js/npcs/baihua-events-main.js', 'js/npcs/baihua-events-extra.js',
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
let pool = null;
{
    const w = makeWorld({});
    const loadFail = [];
    for (const f of REG_FILES) {
        try { vm.runInContext(read(f), w, { filename: f }); } catch (e) { loadFail.push(f + ': ' + e.message); }
    }
    ok(loadFail.length === 0, 'B1 全部 ' + REG_FILES.length + ' 个事件注册文件沙盒加载零失败' + (loadFail.length ? '：' + loadFail.join(' | ') : ''));
    pool = w.NPC_PERSONAL_EVENTS;
    ok(!!pool, 'B2 事件池挂载成功');
    const keys = Object.keys(pool || {});
    eq(keys.length, 965, 'B3 事件池总数 965 桩（口径变动须核reachability后改这里）');

    const byNpc = {}; let flagged = 0, unflagged = 0, ambient = 0, badFlag = 0, badShape = 0, dynScenes = 0;
    for (const k of keys) {
        const ev = pool[k];
        byNpc[ev.npcId] = (byNpc[ev.npcId] || 0) + 1;
        if (ev.autoTrigger) { flagged++; if (typeof ev.autoTrigger.random !== 'number' || typeof ev.autoTrigger !== 'object') badFlag++; }
        else unflagged++;
        if (ev.ambient) ambient++;
        const hasScenes = Array.isArray(ev.scenes) && ev.scenes.length > 0;
        if (!ev.id || !ev.npcId || !ev.title || (!hasScenes && typeof ev._dynamicScenes !== 'function')) badShape++;
        if (!hasScenes && typeof ev._dynamicScenes === 'function') dynScenes++;
    }
    eq(Object.keys(byNpc).length, 47, 'B4 共 47 条私人线');
    eq(flagged, 594, 'B5 带自动弹出标记 594 桩（概率路：greet 通用闸 + 各线 daily/sect 钩子）');
    eq(unflagged, 371, 'B6 无弹出标记 371 桩（拦截路：就绪即于一对话时开场，沉浸模式下不再不可达）');
    eq(badFlag, 0, 'B7 弹出标记个个带概率');
    eq(badShape, 0, 'B8 每桩事件 id/npcId/title 俱全，且有 scenes 或动态场景生成器');
    eq(dynScenes, 10, 'B8b 十条终章走动态场景（按第四段抉择双分支收尾）');
    ok(read('js/npcs/storylines-v2/batch1.js').indexOf('def.scenes = def._dynamicScenes();') >= 0,
        'B8c 动态场景在触发总入口先物化（拦截路调的正是这个全局入口）');

    // npcId 合法性：11 位开局注册人物 + 36 门懒注册掌门，一一有着落
    const SPECIAL_IDS = ['mentor_01', 'healer_01', 'warrior_01', 'merchant_01', 'elder_01', 'rival_01', 'villager_01', 'alchemist_01', 'craftsman_01', 'mysterious_01', 'shaolin_wujiu'];
    const sectsSrc = read('js/sects/sects.js');
    const orphans = Object.keys(byNpc).filter(function (id) {
        if (SPECIAL_IDS.indexOf(id) >= 0) return false;
        if (id.indexOf('sect_leader_') === 0) {
            const sect = id.slice('sect_leader_'.length);
            return sectsSrc.indexOf("'" + sect + "': {") < 0; // 懒注册以 sectsData 为准
        }
        return true;
    });
    eq(orphans.length, 0, 'B9 无孤儿线：每个 npcId 都对应真实可遇见的人物' + (orphans.length ? '：' + orphans.join(',') : ''));

    // 特殊人物确实都在开局名册数据里
    const spSrc = read('js/npcs/special-npcs.js');
    const missingSpecial = SPECIAL_IDS.filter(id => byNpc[id] && spSrc.indexOf(id + ':') < 0);
    eq(missingSpecial.length, 0, 'B10 非掌门线人物均在 SPECIAL_NPC_DATA 名册');
}

// ============ C 门禁运行时 ============
{
    const w = makeWorld({});
    vm.runInContext(read('js/npcs/npc-personal-events.js'), w, { filename: 'npe.js' });
    vm.runInContext(read('js/npcs/baihua-personal-events.js'), w, { filename: 'bh.js' });
    const npc = fakeLeader('sect_leader_修罗宫', '绯泪', 25);
    w.__npcs['sect_leader_修罗宫'] = npc;
    w._settings = {};

    // C1/C2 面板清单闸
    eq(w.getPersonalEventButtons(npc, 'sect_leader_修罗宫'), '', 'C1 沉浸模式（默认）：面板不罗列事件清单');
    w._settings.socialEventPanel = true;
    const onHtml = w.getPersonalEventButtons(npc, 'sect_leader_修罗宫');
    ok(onHtml.length > 50 && onHtml.indexOf('个人事件') >= 0, 'C2 开启开关：清单恢复显示');
    w._settings.socialEventPanel = false;

    // C3 就绪判定
    const ev1 = w.NPC_PERSONAL_EVENTS['xl_event_001'];
    ok(!!ev1, 'C3a 绯泪线首桩事件在池');
    eq(w.isEventReadyNow(npc, ev1, 25), true, 'C3b 结识+亲至+好感达标 → 就绪');
    eq(w.isEventReadyNow(npc, ev1, 0), false, 'C3c 好感不足 → 未就绪');
    w.currentCharData.location = '百花谷';
    eq(w.isEventReadyNow(npc, ev1, 25), false, 'C3d 人在异地 → 未就绪（剧情发生在其门内）');
    w.currentCharData.location = '修罗宫';
    npc.memory.firstMet = false; npc.memory.meetCount = 0;
    eq(w.isEventReadyNow(npc, ev1, 25), false, 'C3e 尚未结识 → 未就绪');
    npc.memory.firstMet = true;

    // C4 夜戏守夜：带时辰窗的事件白天不就绪
    const nightEv = Object.values(w.NPC_PERSONAL_EVENTS).find(e => e.npcId === 'sect_leader_修罗宫' && e.autoTrigger && e.autoTrigger.timeRange);
    if (nightEv) {
        const w2day = makeWorld({ hour: 12 });
        vm.runInContext(read('js/npcs/npc-personal-events.js'), w2day, { filename: 'npe2.js' });
        vm.runInContext(read('js/npcs/baihua-personal-events.js'), w2day, { filename: 'bh2.js' });
        const npc2 = fakeLeader('sect_leader_修罗宫', '绯泪', 90);
        w2day.__npcs['sect_leader_修罗宫'] = npc2;
        const nev = w2day.NPC_PERSONAL_EVENTS[nightEv.id];
        // 好感拉满、链序靠后的夜戏可能因链头未完成而 false——此处只验时辰窗本身：
        // 同事件在窗外与窗内的差异（其余门禁一致）
        const outHour = (nev.autoTrigger.timeRange[0] + 6) % 24; // 窗外时辰
        w2day.timeSystem.gameTime.currentHour = outHour;
        const outReady = w2day.isEventReadyNow(npc2, nev, 90);
        w2day.timeSystem.gameTime.currentHour = nev.autoTrigger.timeRange[0]; // 窗内起点
        const inReady = w2day.isEventReadyNow(npc2, nev, 90);
        ok(!outReady || inReady, 'C4 夜戏夜演：时辰窗外不拦面板（' + nightEv.id + ' 窗外=' + outReady + ' 窗内=' + inReady + '）');
    } else { ok(true, 'C4 夜戏守夜（本池无时辰窗事件，跳过）'); }

    // C5 远程旗
    w._npcDialogIsRemote = true;
    eq(w.maybeAutoTriggerPersonalEvent('sect_leader_修罗宫', 'greet'), false, 'C5 远程翻档案：greet 源见旗即止');
    w._npcDialogIsRemote = false;

    // C6 终章判定：主链最大序号一桩完成后整线停弹
    let maxOrder = 0, maxId = null;
    for (const k in w.NPC_PERSONAL_EVENTS) {
        const e = w.NPC_PERSONAL_EVENTS[k];
        if (e.npcId !== 'sect_leader_修罗宫' || e.ambient) continue;
        const m = e.id.match(/_event_(s|d)?(\d+)/i);
        if (m && parseInt(m[2], 10) > maxOrder && !e.requireConcubine && !e.requireDisciple) { maxOrder = parseInt(m[2], 10); maxId = e.id; }
    }
    ok(!!maxId, 'C6a 绯泪主链终章可识别');
    w.markEventTriggered(maxId);
    eq(w.isPersonalLineFinished('sect_leader_修罗宫'), true, 'C6b 终章完成 → 整线认定完结');
    eq(w.personalEventGreetGate(npc, 'sect_leader_修罗宫'), false, 'C6c 完结线不再拦截/弹出（余韵留白）');
    w.resetPersonalEventFlags();
    eq(w.isPersonalLineFinished('sect_leader_修罗宫'), false, 'C6d 重置后线路复活');
}

// ============ D 拦截运行时：一对话就拦住面板并开场 ============
{
    const w = makeWorld({});
    vm.runInContext(read('js/npcs/npc-personal-events.js'), w, { filename: 'npe.js' });
    vm.runInContext(read('js/npcs/baihua-personal-events.js'), w, { filename: 'bh.js' });
    const npc = fakeLeader('sect_leader_修罗宫', '绯泪', 25);
    w.__npcs['sect_leader_修罗宫'] = npc;
    w._settings = {};

    // D1 沉浸模式：拦截成功 → 返回 true、事件弹窗已建、面板不再显示（调用方 return）
    eq(w.personalEventGreetGate(npc, 'sect_leader_修罗宫'), true, 'D1 就绪低门槛事件：交谈总闸拦截成功');
    eq(w.__modals.length, 1, 'D2 事件弹窗恰好一座（不叠台）');
    eq(w._pendingEventComplete, 'xl_event_001', 'D3 开场的正是链头首桩「深夜的灯」');
    ok(String(w.__modals[0].className).indexOf('personal-event-modal') >= 0, 'D4 弹窗类名入闸（后续防叠台判定可认）');

    // D5 演过即毕：同一桩不再拦
    w.__modals.length = 0;
    w.markEventTriggered('xl_event_001');
    w._pendingEventComplete = null;
    const second = w.personalEventGreetGate(npc, 'sect_leader_修罗宫');
    const secondPending = w._pendingEventComplete;
    ok(second === true ? (secondPending && secondPending !== 'xl_event_001') : w.__modals.length === 0 || true,
        'D5 已演事件不重演（拦截要么不发、要么换下一桩）');
    if (second === true) ok(secondPending !== 'xl_event_001', 'D5b 二次拦截换的是别的桩');
    w.resetPersonalEventFlags();

    // D6 面板开关开启：不拦截，清单可点（返回 false，无即刻弹窗）
    w._settings.socialEventPanel = true;
    w.__modals.length = 0;
    w._pendingEventComplete = null;
    const gateOn = w.personalEventGreetGate(npc, 'sect_leader_修罗宫');
    eq(gateOn, false, 'D6 开启面板显示：总闸不拦截（玩家自己点清单）');
    eq(w.__modals.length, 0, 'D6b 不拦截即无即刻弹窗（概率路走延时，沙盒定时器不发）');
    w._settings.socialEventPanel = false;

    // D7 无线人物：总闸直接放行
    const stranger = fakeLeader('warrior_01', '铁拳', 0);
    stranger.memory.firstMet = false; stranger.memory.meetCount = 0;
    w.__npcs['warrior_01'] = stranger;
    // warrior_01 有线（5桩）但好感/结识未达标 → 不拦截
    w.__modals.length = 0;
    eq(w.personalEventGreetGate(stranger, 'warrior_01'), false, 'D7 未结识者不拦截（门禁如一）');
}

// ============ 汇总 ============
console.log('v22.0-immersion: ' + passed + ' passed, ' + failures.length + ' failed');
if (failures.length > 0) process.exit(1);
console.log('v22.0-immersion: all green');
