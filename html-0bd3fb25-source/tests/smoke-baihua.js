// ==================== smoke-baihua.js - 温蘅线加载与链式解锁冒烟测试 v12.3 ====================
// 运行：node tests/smoke-baihua.js
// 验证：①三文件可加载无错 ②32个温蘅事件+6结局注册成功 ③通用化isChainHead对百花谷/绯泪线均正确

const fs = require('fs');
const path = require('path');

// ---- 浏览器环境 Mock ----
global.window = global;
global.document = {
    readyState: 'complete',
    addEventListener: function() {},
    querySelector: function() { return null; },
    createElement: function() { return { style: {}, classList: { add: function(){}, remove: function(){} }, innerHTML: '' }; },
    body: { appendChild: function() {} }
};
global.localStorage = {
    _store: {},
    getItem: function(k) { return this._store[k] || null; },
    setItem: function(k, v) { this._store[k] = String(v); },
    removeItem: function(k) { delete this._store[k]; }
};

// ---- 按加载顺序拼接源码并在同一作用域执行 ----
const root = path.join(__dirname, '..');
const files = [
    'js/npcs/npc-personal-events.js',
    'js/npcs/baihua-events-main.js',
    'js/npcs/baihua-events-extra.js',
    'js/npcs/baihua-personal-events.js'
];
let code = '';
for (const f of files) {
    const src = fs.readFileSync(path.join(root, f), 'utf8');
    if (!src || src.trim().length === 0) {
        console.error('❌ 文件为空: ' + f);
        process.exit(1);
    }
    code += '// ===== ' + f + ' =====\n' + src + '\n';
}

let pass = 0, fail = 0;
function check(name, actual, expected) {
    const ok = actual === expected;
    if (ok) { pass++; console.log('✅ ' + name); }
    else { fail++; console.log('❌ ' + name + '（期望 ' + expected + '，实际 ' + actual + '）'); }
}

try {
    eval(code);

    // 1. 事件注册
    const bhCount = Object.values(NPC_PERSONAL_EVENTS).filter(function(e) { return e.npcId === 'sect_leader_百花谷'; }).length;
    check('温蘅事件总数=32', bhCount, 32);
    check('主线事件=14', Object.keys(BAIHUA_MAIN_EVENTS).length, 14);
    check('日常事件=10', Object.keys(BAIHUA_DAILY_EVENTS).length, 10);
    check('接近事件=8', Object.keys(BAIHUA_APPROACH_EVENTS).length, 8);
    check('结局数=6', Object.keys(BAIHUA_ENDINGS).length, 6);
    check('结局注册表含百花谷', !!NPC_ENDING_SETS['sect_leader_百花谷'], true);
    check('结局回调注册', typeof NPC_ENDING_CALLBACKS['sect_leader_百花谷'], 'function');
    check('自动触发函数导出', typeof maybeAutoTriggerBaihuaEvent, 'function');

    // 2. 绯泪线回归：事件仍在池中
    const xlCount = Object.values(NPC_PERSONAL_EVENTS).filter(function(e) { return e.npcId === 'sect_leader_修罗宫'; }).length;
    check('绯泪事件仍注册(>=34)', xlCount >= 34, true);
    check('修罗宫结局集注册', NPC_ENDING_SETS['sect_leader_修罗宫'] === XIULUO_ENDINGS, true);

    // 3. 链式解锁：百花谷（通用化 isChainHead）
    personalEventFlags = {}; // 重置进度
    check('百花谷001初始为链头', isChainHead(NPC_PERSONAL_EVENTS['bh_event_001']), true);
    check('百花谷002初始锁定', isChainHead(NPC_PERSONAL_EVENTS['bh_event_002']), false);
    personalEventFlags['bh_event_001'] = true;
    check('完成001后002成为链头', isChainHead(NPC_PERSONAL_EVENTS['bh_event_002']), true);
    check('完成001后003仍锁定', isChainHead(NPC_PERSONAL_EVENTS['bh_event_003']), false);
    personalEventFlags['bh_event_013'] = true;
    check('完成013后014成为链头', isChainHead(NPC_PERSONAL_EVENTS['bh_event_014']), true);

    // 4. 链式解锁：绯泪线回归（不受百花谷影响）
    personalEventFlags = {};
    check('绯泪001初始为链头', isChainHead(NPC_PERSONAL_EVENTS['xl_event_001']), true);
    check('绯泪002初始锁定', isChainHead(NPC_PERSONAL_EVENTS['xl_event_002']), false);
    personalEventFlags['xl_event_001'] = true;
    check('绯泪完成001后002链头', isChainHead(NPC_PERSONAL_EVENTS['xl_event_002']), true);
    // 跨NPC隔离：完成百花谷001不应解锁绯泪002
    personalEventFlags = { 'bh_event_001': true };
    check('跨NPC隔离：bh001不影响xl002', isChainHead(NPC_PERSONAL_EVENTS['xl_event_002']), false);

    // 5. 秘密按选择解锁（010 casual 分支不返回 secretId）
    const ev10 = NPC_PERSONAL_EVENTS['bh_event_010'];
    const rCasual = ev10.effects({}, 'casual');
    const rDontknow = ev10.effects({}, 'dontknow');
    // casual 分支不返回 secretId 键（undefined），运行时合并 eventDef.unlockSecret 后为 null —— 均表示不解锁
    check('010选"随便问问"不解锁秘密', rCasual.secretId == null, true);
    check('010选"不知道"解锁秘密02', rDontknow.secretId, 'bh_secret_02');

    // 6. 终章六分支返回正确结局
    const ev14 = NPC_PERSONAL_EVENTS['bh_event_014'];
    check('终章并肩', ev14.effects({}, 'lover_travel').ending, '并肩');
    check('终章归谷', ev14.effects({}, 'lover_stay').ending, '归谷');
    check('终章知己', ev14.effects({}, 'friend_travel').ending, '知己');
    check('终章药庐', ev14.effects({}, 'friend_stay').ending, '药庐');
    check('终章面具', ev14.effects({}, 'none').ending, '面具');
    // 花冢兜底：负面≥5时恋人选项转花冢
    window._negativeChoiceCount = {}; window._negativeChoiceCount['sect_leader_百花谷'] = 5;
    check('负面≥5恋人转花冢', ev14.effects({}, 'lover_travel').ending, '花冢');
    window._negativeChoiceCount = {};

    // 7. endingMap 完整
    const em = ev14.endingMap;
    check('endingMap六项齐全', Object.keys(em).length, 6);

    // 8. 自动触发候选筛选（mock 环境）
    window.npcManager = { getNPC: function() { return null; } }; // 无NPC实例时应安全返回false
    check('无NPC时自动触发安全退出', maybeAutoTriggerBaihuaEvent('greet'), false);

    console.log('\n========== 冒烟测试结果: ' + pass + ' 通过 / ' + fail + ' 失败 ==========');
    process.exit(fail > 0 ? 1 : 0);
} catch (e) {
    console.error('❌ 加载或执行失败:', e.message);
    console.error(e.stack.split('\n').slice(0, 5).join('\n'));
    process.exit(1);
}
