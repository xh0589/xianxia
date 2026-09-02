// ==================== main-storyline-arc.js - v20.1 主线叙事 + 多阶段 Boss ====================
// 在既有 5 个引导主线（main_001~005）后追加叙事主线段：魔修玄冥子夺气运，三阶段 Boss 决战
// 复用：QuestRegistry.registerMany + 多波战斗 UI 模式（_isMainStoryBoss + continueBossPhase）
// 进度存于既有 playerQuestProgress + eventFlags，零新增存储
// 依赖：quest-system（QuestRegistry/notifyQuestKill/advanceQuestObjectivesFromEvent）、battle.startBattle、app 战斗结算分支

(function () {

// ===== 主线叙事章节（接 main_005 扬名之后）=====
var MAIN_STORY_ARC = [
    {
        id: 'main_006',
        title: '魔气东来',
        type: 'main',
        priority: 'critical',
        description: '九州忽现魔气，妖兽异动。清虚道人飞符传讯，请你去城外查探异兆，斩杀异变的妖兽。',
        objectives: [
            { type: 'kill', target: '妖兽', count: 3, completed: false },
            { type: 'visit', location: '城外', count: 1, completed: false }
        ],
        rewards: { exp: 2000, spiritStones: 800, items: [{ itemId: 'mat_demon_beast_core', count: 3 }] },
        story: '师父清虚道人飞符传讯：「九州魔气渐浓，恐有大魔蛰伏。先去城外查探异动的妖兽。」你斩杀数头异兽，剖其腹中竟有黑色气运缠绕——非天生，乃人为施法散布。一股渡劫期魔修的气息，正从灵脉方向传来。',
        accepted: false,
        completed: false,
        turnedIn: false
    },
    {
        id: 'main_007',
        title: '灵脉之劫·玄冥子',
        type: 'main',
        priority: 'critical',
        description: '魔修玄冥子现身夺你护持的灵脉，需与之三阶段决战。击败其最终灵体形态方可护脉。',
        objectives: [
            { type: 'kill', target: '玄冥子·灵体', count: 1, completed: false }
        ],
        rewards: { exp: 8000, spiritStones: 3000, items: [{ itemId: 'mat_chaos_stone', count: 2 }] },
        story: '一道黑袍人破空而至，自称「玄冥子」：「你这灵脉气运，本座收了。」他渡劫在即，需采气运补天劫之缺。护脉之战，分三阶段——人形、魔化、灵体。',
        accepted: false,
        completed: false,
        turnedIn: false
    },
    {
        id: 'main_008',
        title: '天界魔气',
        type: 'main',
        priority: 'critical',
        description: '飞升后天界忽传魔气，疑玄冥子残魂遁走重修成魔仙。前往天界查探（需飞升后）。',
        objectives: [
            { type: 'visit', location: '天界', count: 1, completed: false }
        ],
        rewards: { exp: 20000, spiritStones: 5000, items: [{ itemId: 'mat_chaos_stone', count: 3 }] },
        story: '你白日飞升，安居天界。忽有一日，天界东方魔气冲霄——当年玄冥子灵体被你击退，残魂竟遁走重修，如今已飞升为「魔仙」，欲吞天界气运，卷土重来。此战避无可避。',
        accepted: false,
        completed: false,
        turnedIn: false
    },
    {
        id: 'main_009',
        title: '天界决战·魔仙',
        type: 'main',
        priority: 'critical',
        description: '与魔仙玄冥子终极决战，三阶段。击败其本源魔相，方可终结这场气运之争。',
        objectives: [
            { type: 'kill', target: '魔仙·本源', count: 1, completed: false }
        ],
        rewards: { exp: 50000, spiritStones: 20000, items: [{ itemId: 'mat_chaos_stone', count: 5 }] },
        story: '魔仙玄冥子立于天界之上，本源魔相渐显：「当年你护脉败我，今日天界，便是了结之地。」终极决战，三阶段——魔仙·人形、魔仙·法相、魔仙·本源。',
        accepted: false,
        completed: false,
        turnedIn: false
    }
];

// ===== 多阶段 Boss 定义 =====
var MAIN_BOSSES = {
    xuanming: {
        name: '玄冥子',
        phases: [
            { name: '玄冥子·人形', hp: 420, attack: 58, defense: 38, speed: 48, element: 'dark', desc: '黑袍渡劫魔修，气运缠身' },
            { name: '玄冥子·魔化', hp: 620, attack: 78, defense: 48, speed: 58, element: 'dark', desc: '魔气贯体，半步魔化，招式狠辣' },
            { name: '玄冥子·灵体', hp: 820, attack: 98, defense: 58, speed: 72, element: 'dark', desc: '灵体脱壳，欲夺气运飞升，雷劫之力隐现' }
        ]
    },
    xuanming_immortal: {
        name: '玄冥子·魔仙',
        phases: [
            { name: '魔仙·人形', hp: 1500, attack: 160, defense: 100, speed: 95, element: 'dark', desc: '飞升成魔仙，气运滔天，魔威初显' },
            { name: '魔仙·法相', hp: 2200, attack: 200, defense: 130, speed: 115, element: 'dark', desc: '法相天地，魔威盖世，招招致命' },
            { name: '魔仙·本源', hp: 3000, attack: 245, defense: 165, speed: 150, element: 'dark', desc: '本源魔相显化，欲吞天界气运，终极之敌' }
        ]
    }
};

var _bossRun = null; // { bossId, phase, phases, mul, def }

// Boss 强度按玩家境界小幅缩放（仅本 Boss 战内，非全局数值调整）
function _bossTierMul() {
    try {
        var cd = window.currentCharData;
        if (!cd) return 1;
        var tier = (typeof window.getRealmTier === 'function') ? window.getRealmTier(cd.realm) : 0;
        return 1 + tier * 0.15;
    } catch (e) { return 1; }
}

function _makeBossEnemy(phase, mul) {
    var m = mul || 1;
    return {
        name: phase.name,
        hp: Math.round(phase.hp * m),
        maxHp: Math.round(phase.hp * m),
        attack: Math.round(phase.attack * m),
        defense: Math.round(phase.defense * m),
        speed: Math.round(phase.speed * m),
        _elementType: phase.element,
        _isBoss: true,
        desc: phase.desc
    };
}

// 启动多阶段 Boss 战
function startMainStoryBoss(bossId) {
    try {
        var def = MAIN_BOSSES[bossId];
        if (!def) return false;
        var cd = window.currentCharData;
        if (!cd) return false;
        var mul = _bossTierMul();
        _bossRun = { bossId: bossId, phase: 0, phases: def.phases.length, mul: mul, def: def };
        return _startPhase();
    } catch (e) { return false; }
}

function _startPhase() {
    try {
        if (!_bossRun) return false;
        var def = _bossRun.def;
        var phase = def.phases[_bossRun.phase];
        if (!phase) return false;
        var enemy = _makeBossEnemy(phase, _bossRun.mul);
        if (!window.startBattle) return false;
        var battle = window.startBattle(enemy);
        if (battle) battle._isMainStoryBoss = true;
        if (window.gameLog && window.gameLog.add) {
            window.gameLog.add('⚔️ ' + def.name + ' 第' + (_bossRun.phase + 1) + '阶段：「' + phase.name + '」现身！' + phase.desc, 'danger');
        }
        return true;
    } catch (e) { return false; }
}

// 下一阶段（由战斗胜利按钮 continueBossPhase 触发）
function continueBossPhase() {
    try {
        if (!_bossRun) return false;
        _bossRun.phase++;
        if (_bossRun.phase >= _bossRun.phases) {
            return settleMainStoryBoss(true); // 全阶段通关
        }
        return _startPhase();
    } catch (e) { return false; }
}

// 战斗结算（胜利/失败由 app.js 战斗分支调用）
function settleMainStoryBoss(victory) {
    try {
        if (!_bossRun) return false;
        var run = _bossRun;
        var cd = window.currentCharData;
        // 全阶段通关
        if (victory && run.phase >= run.phases - 1) {
            var def = run.def;
            var isImmortal = (run.bossId === 'xuanming_immortal');
            if (window.gameLog && window.gameLog.add) {
                window.gameLog.add(isImmortal
                    ? '🏆🏆 你击灭「' + def.name + '」本源魔相！气运之争终告了结，天界重归清明。'
                    : '🏆 击退「' + def.name + '」灵体，护脉成功！魔修暂退，气运不失。', 'success');
            }
            if (cd) {
                var _st = isImmortal ? 20000 : 2000;
                var _fm = isImmortal ? 500 : 200;
                var _lk = isImmortal ? 20 : 5;
                if (typeof window.addSpiritStones === 'function') window.addSpiritStones(_st);
                else cd.spiritStones = (cd.spiritStones || 0) + _st;
                cd.fame = (cd.fame || 0) + _fm;
                cd.luck = Math.min(100, (cd.luck || 50) + _lk);
                if (isImmortal) cd.essence = (cd.essence || 0) + 10000;
            }
            if (window.eventFlags) {
                window.eventFlags[isImmortal ? 'main_xuanming_immortal_defeated' : 'main_xuanming_defeated'] = true;
            }
            if (window.playSfx) window.playSfx('victory');
            if (window.updateCharacterStatus) window.updateCharacterStatus();
            if (window.doAutoSave) window.doAutoSave('breakthrough');
            _bossRun = null;
            return true;
        }
        // 战败：重伤，Boss 退去（不杀玩家，主线不卡死，可再战）
        if (!victory) {
            if (window.gameLog && window.gameLog.add) {
                window.gameLog.add('💔 你败于「' + run.def.name + '」之手，重伤倒地。魔修冷笑而去，等你再来。', 'danger');
            }
            if (cd) {
                cd.health = Math.max(1, Math.floor((cd.health || 100) * 0.2));
                cd.qi = 0;
                cd.energy = 0;
            }
            _bossRun = null;
            return true;
        }
        // 中间阶段胜利（phase < phases-1）：不结算、不清 _bossRun，等玩家点"下一阶段"按钮 continueBossPhase 接管
        return false;
    } catch (e) { return false; }
}

// 主线剧情面板
function openMainStoryPanel() {
    try {
        var cd = window.currentCharData;
        if (!cd) { if (window.showMessage) window.showMessage('请先创建角色进入游戏。', 'info'); return; }
        var defeated = window.eventFlags && window.eventFlags['main_xuanming_defeated'];
        var ascended = !!(cd && (cd.realm === '飞升' || cd.realm === '金仙' || cd._unlockedTianjie));
        var immortalDefeated = window.eventFlags && window.eventFlags['main_xuanming_immortal_defeated'];
        var html = '<div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" id="main-story-modal">'
            + '<div class="bg-gray-800 border-2 border-purple-500 rounded-xl p-6 max-w-lg w-full text-center" style="box-shadow:0 0 60px rgba(168,85,247,0.3)">'
            + '<h2 class="text-2xl font-bold text-purple-400 mb-3">📜 主线·魔气东来</h2>'
            + '<div class="bg-gray-900/50 rounded p-4 mb-4 text-left text-sm text-gray-300 leading-relaxed">'
            + '<p class="italic mb-2">「九州魔气渐浓，恐有大魔蛰伏……」——清虚道人</p>'
            + '<p>渡劫期魔修<strong class="text-red-400">玄冥子</strong>为补天劫之缺，现身夺取你护持的灵脉气运。需与之三阶段决战：人形 → 魔化 → 灵体。</p>'
            + (defeated ? '<p class="text-green-400 mt-2">✅ 你已击退玄冥子灵体，护脉成功，气运不失。</p>' : '')
            + '</div>'
            + '<div class="flex flex-col gap-2">'
            + '<button onclick="window.acceptMainStoryQuest()" class="bg-yellow-600 hover:bg-yellow-500 text-gray-900 font-bold py-2 px-4 rounded">接受主线任务（魔气东来 / 灵脉之劫）</button>'
            + (defeated
                ? (ascended
                    ? (immortalDefeated
                        ? '<button disabled class="bg-gray-700 text-gray-500 font-bold py-2 px-4 rounded cursor-not-allowed">🏆 魔仙玄冥子已灭，气运之争终结</button>'
                        : '<button onclick="window.startMainStoryBoss(\'xuanming_immortal\'); document.getElementById(\'main-story-modal\').remove();" class="bg-red-800 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">⚔️ 天界决战·魔仙玄冥子（三阶段）</button>')
                    : '<button disabled class="bg-gray-700 text-gray-500 font-bold py-2 px-4 rounded cursor-not-allowed">玄冥子已退，待飞升后追查天界魔气</button>')
                : '<button onclick="window.startMainStoryBoss(\'xuanming\'); document.getElementById(\'main-story-modal\').remove();" class="bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">⚔️ 决战玄冥子（三阶段）</button>')
            + '<button onclick="document.getElementById(\'main-story-modal\').remove()" class="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded">关闭</button>'
            + '</div></div></div>';
        var old = document.getElementById('main-story-modal');
        if (old) old.remove();
        document.body.insertAdjacentHTML('beforeend', html);
    } catch (e) {}
}

// 接受主线章节任务
function acceptMainStoryQuest() {
    try {
        var accepted = 0;
        ['main_006', 'main_007'].forEach(function (qid) {
            if (typeof window.acceptQuest === 'function') {
                try { window.acceptQuest(qid); accepted++; } catch (e) {}
            }
        });
        if (window.showMessage) {
            window.showMessage(accepted > 0 ? '📜 已接受主线任务，前往任务面板查看。' : '主线任务已接受或不可接。', 'info');
        }
    } catch (e) {}
}

// 注册主线章节到任务注册表 + mainQuestChain 数组（让主线 UI 可见）
function _registerArc() {
    try {
        if (Array.isArray(window.mainQuestChain)) {
            MAIN_STORY_ARC.forEach(function (q) {
                var exists = window.mainQuestChain.some(function (m) { return m.id === q.id; });
                if (!exists) window.mainQuestChain.push(q);
            });
        }
        if (window.QuestRegistry && typeof window.QuestRegistry.registerMany === 'function') {
            window.QuestRegistry.registerMany(MAIN_STORY_ARC);
        }
    } catch (e) {}
}

// 暴露当前 Boss 进度供战斗胜利按钮区判断是否还有下一阶段
function getMainBossProgress() {
    if (!_bossRun) return null;
    return { phase: _bossRun.phase, phases: _bossRun.phases, name: _bossRun.def.name };
}

_registerArc();

window.startMainStoryBoss = startMainStoryBoss;
window.continueBossPhase = continueBossPhase;
window.settleMainStoryBoss = settleMainStoryBoss;
window.getMainBossProgress = getMainBossProgress;
window.openMainStoryPanel = openMainStoryPanel;
window.acceptMainStoryQuest = acceptMainStoryQuest;
window.MAIN_STORY_ARC = MAIN_STORY_ARC;

})();
