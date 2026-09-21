// ==================== codex-tutorial.js - 教程+图鉴+世界日志 (v19.17 §11) ====================
// 对标 v18.8 路线图 §11：7 步新手引导 + 6 类图鉴 + 世界大事记。

(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    // ============== 1. 7 步新手引导 ==============
    var TUTORIAL_STEPS = [
        { id: 'tut_first_cultivation', title: '第一次修炼', text: '点击"闭关"或"修炼"开始你的第一次修炼。灵气在洞府中积蓄，闭关可加速积累。' },
        { id: 'tut_first_combat',      title: '第一次战斗', text: '点击"外出历练"或"战斗"按钮，与一只野兽或散修对战。失败不丢人，多试几次。' },
        { id: 'tut_first_trade',       title: '第一次买卖', text: '在"坊市"购买或出售物品，记住卖价有地区差异（v19.11）。' },
        { id: 'tut_first_npc',         title: '第一次 NPC 互动', text: '与 NPC 对话，送礼可加好感（v19.6 NpcLineage）。' },
        { id: 'tut_first_sect',        title: '第一次加入门派', text: '点击"宗门"选择加入 36 个门派之一，职位从弟子开始（v19.0）。' },
        { id: 'tut_first_craft',       title: '第一次炼丹/炼器', text: '在"炼丹"或"炼器"中合成第一颗丹 / 第一件法器（v19.4 / v19.5）。' },
        { id: 'tut_first_dungeon',     title: '第一次秘境', text: '点击"秘境"进入动态秘境（v19.9 8 个模板）。' }
    ];

    // ============== 2. 6 类图鉴 ==============
    var CODEX_TYPES = [
        { id: 'codex_gongfa',   name: '功法图鉴', desc: '已习得的功法' },
        { id: 'codex_beast',    name: '灵兽图鉴', desc: '已发现的灵兽' },
        { id: 'codex_recipe',   name: '丹方图鉴', desc: '已炼制的丹/器/符/阵/傀儡' },
        { id: 'codex_sect',     name: '门派图鉴', desc: '已加入/了解的门派' },
        { id: 'codex_dungeon',  name: '秘境发现', desc: '已探索的秘境' },
        { id: 'codex_world',    name: '世界大事', desc: '影响世界的事件' }
    ];

    // ============== 3. 模块级状态 ==============
    var _state = {
        dismissed: {},          // {stepId: true}
        codex: {                // {codexId: {itemId: entry}}
            codex_gongfa: {},
            codex_beast: {},
            codex_recipe: {},
            codex_sect: {},
            codex_dungeon: {},
            codex_world: {}
        },
        journal: { entries: [] }   // [{id, type, day, title, text, refs}]
    };

    var MAX_JOURNAL = 100;
    var MAX_CODEX_PER_TYPE = 200;

    function _today() { return (window.WorldCalendar && window.WorldCalendar.day) || 0; }
    function _emit(name, payload) {
        var bus = null;
        if (typeof window !== 'undefined' && window.EventBus) bus = window.EventBus;
        else if (typeof globalThis !== 'undefined' && globalThis.EventBus) bus = globalThis.EventBus;
        if (bus && typeof bus.emit === 'function') {
            bus.emit(name, payload);
        }
    }

    // ============== 4. 教程 API ==============

    function trigger(stepId) {
        if (!_state.dismissed[stepId]) {
            var step = TUTORIAL_STEPS.find(function (s) { return s.id === stepId; });
            if (step) {
                _emit('codex:tutorialTriggered', { step: step });
                return { ok: true, dismissed: false, step: step };
            }
        }
        return { ok: true, dismissed: true };
    }

    function dismiss(stepId) {
        if (TUTORIAL_STEPS.find(function (s) { return s.id === stepId; })) {
            _state.dismissed[stepId] = true;
            return true;
        }
        return false;
    }

    function isDismissed(stepId) { return !!_state.dismissed[stepId]; }

    function listSteps() { return TUTORIAL_STEPS.slice(); }

    // ============== 5. 图鉴 API ==============

    function discover(codexId, itemId, info) {
        if (!CODEX_TYPES.find(function (c) { return c.id === codexId; })) return { ok: false, reason: 'unknown-codex' };
        if (!itemId) return { ok: false, reason: 'no-itemId' };
        _state.codex[codexId] = _state.codex[codexId] || {};
        var existing = _state.codex[codexId][itemId];
        if (existing) {
            existing.count = (existing.count || 1) + 1;
            existing.lastSeenDay = _today();
            return { ok: true, entry: existing, already: true };
        }
        if (Object.keys(_state.codex[codexId]).length >= MAX_CODEX_PER_TYPE) {
            return { ok: false, reason: 'codex-full' };
        }
        var entry = {
            itemId: itemId,
            info: info || {},
            firstSeenDay: _today(),
            lastSeenDay: _today(),
            seen: false,
            count: 1
        };
        _state.codex[codexId][itemId] = entry;
        _emit('codex:discovered', { codexId: codexId, itemId: itemId, entry: entry });
        return { ok: true, entry: entry, already: false };
    }

    function getEntries(codexId) {
        var dict = _state.codex[codexId] || {};
        return Object.keys(dict).map(function (k) { return dict[k]; });
    }

    function getEntry(codexId, itemId) {
        var dict = _state.codex[codexId] || {};
        return dict[itemId] || null;
    }

    function getProgress(codexId) {
        var dict = _state.codex[codexId] || {};
        var discovered = Object.keys(dict).length;
        // 总数未知（动态），用 discovered as numerator
        return { codexId: codexId, discovered: discovered, percent: 0, _note: 'total dynamic' };
    }

    function markSeen(codexId, itemId) {
        var dict = _state.codex[codexId] || {};
        if (!dict[itemId]) return false;
        dict[itemId].seen = true;
        _emit('codex:seen', { codexId: codexId, itemId: itemId });
        return true;
    }

    // ============== 6. 世界大事记 API ==============

    function record(event) {
        if (!event || !event.type) return { ok: false, reason: 'no-type' };
        var entry = {
            id: 'j_' + _today() + '_' + (_state.journal.entries.length || 0) + '_' + Math.random().toString(36).slice(2, 6),
            type: event.type,
            day: event.day || _today(),
            title: event.title || event.type,
            text: event.text || '',
            refs: event.refs || {}
        };
        _state.journal.entries.unshift(entry);
        if (_state.journal.entries.length > MAX_JOURNAL) _state.journal.entries.pop();
        _emit('journal:recorded', { entry: entry });
        return { ok: true, entry: entry };
    }

    function getJournalEntries(type) {
        if (!type) return _state.journal.entries.slice();
        return _state.journal.entries.filter(function (e) { return e.type === type; });
    }

    function getByDayRange(startDay, endDay) {
        return _state.journal.entries.filter(function (e) { return e.day >= startDay && e.day <= endDay; });
    }

    function getByType(type) { return getJournalEntries(type); }

    function getRecent(limit) {
        return _state.journal.entries.slice(0, limit || 10);
    }

    // ============== 7. StateRegistry ==============

    function _exportState() { return JSON.parse(JSON.stringify(_state)); }
    function _importState(s) {
        if (!s) return;
        if (s.dismissed) _state.dismissed = s.dismissed;
        if (s.codex) {
            CODEX_TYPES.forEach(function (c) {
                if (s.codex[c.id]) _state.codex[c.id] = s.codex[c.id];
            });
        }
        if (s.journal && Array.isArray(s.journal.entries)) _state.journal.entries = s.journal.entries.slice(0, MAX_JOURNAL);
    }
    function _resetState() {
        _state.dismissed = {};
        CODEX_TYPES.forEach(function (c) { _state.codex[c.id] = {}; });
        _state.journal = { entries: [] };
    }

    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        try {
            window.StateRegistry.register('codexTutorial', { version: 1, export: function () { return { dismissed: _state.dismissed }; }, import: function (s) { if (s && s.dismissed) _state.dismissed = s.dismissed; }, reset: function () { _state.dismissed = {}; } });
            window.StateRegistry.register('codex', { version: 1, export: function () { return { codex: _state.codex }; }, import: function (s) { if (s && s.codex) { CODEX_TYPES.forEach(function (c) { if (s.codex[c.id]) _state.codex[c.id] = s.codex[c.id]; }); } }, reset: function () { CODEX_TYPES.forEach(function (c) { _state.codex[c.id] = {}; }); } });
            window.StateRegistry.register('worldJournal', { version: 1, export: function () { return _state.journal; }, import: function (s) { if (s && Array.isArray(s.entries)) _state.journal.entries = s.entries.slice(0, MAX_JOURNAL); }, reset: function () { _state.journal = { entries: [] }; } });
        } catch (e) {}
    }

    // ============== 8. 导出 ==============

    // ============== v21.9：机制速览（图鉴面板静态条目） ==============
    // 气运/名望/选择记忆/字号/境界刻度/天门口/盘问国师——新机制此前在图鉴教程零覆盖
    var KNOWLEDGE = [
        { id: 'kn_luck', icon: '🎲', name: '气运', text: '隐性主属性：气运越高，打坐奇遇与人间机缘越容易触发，占卜也会反哺它。终局决战里高气运让天兵的镰刀偏刃、波数更少；决战前夜还能烧掉 20 点气运，换首波天兵未战先乱。行善、占卜、因果报应都会增减气运。' },
        { id: 'kn_fame', icon: '📣', name: '名望', text: '从无名之辈一路到万古流芳：日常积攒按档位刻度走，终局大事会一次给一大笔——名望尺子全程统一，越高入门考核越以礼相待，决战盟友也越多。' },
        { id: 'kn_choice', icon: '📜', name: '选择记忆', text: '重大抉择都会记进抉择簿：NPC 闲聊时会提起你的旧事；走到结局画面，会出现「你走过的路」判词，因果与声望评价随你的抉择改写。设置面板的「回望此生」可随时翻看全部记录。' },
        { id: 'kn_font', icon: '🔠', name: '界面字号', text: '设置面板可切标准/大/特大三档界面字号，全局立刻生效；偏好会被记住，删档重开也不清。' },
        { id: 'kn_realm', icon: '⚔️', name: '境界与敌强度', text: '敌人强度跟着你的境界刻度走——炼气一层到渡劫九层，对手、真元奖励、淬体档全程同步上调。金丹往后会遇到夜叉、魔将、执香吏、收稼人、古神残躯等新面孔，以及宗师/神座/天将/镇世等名号强敌。' },
        { id: 'kn_gate', icon: '🌩️', name: '天门口决战', text: '最后一战怎么打，由你自己写下的账决定：放走的人越多，他们现身还命折损天兵越多；盟友、内情、善行都会减少天兵波数；决战前夜可以燃气运乱敌阵脚。' },
        { id: 'kn_preceptor', icon: '🗂️', name: '盘问国师', text: '国师伏诛后，人心簿可以逐笔摊开亲自盘问：问罪讨回名望，或追问挖出天道镰刀的内情——内情满两笔，天门口再减一波天兵。中途退出还能回来续问。' }
    ];

    // ============== v21.9：新手引导触点 ==============
    // 此前 trigger 全库零调用——引导永远不弹。现在各系统首次动作时打一发提示（每步只弹一次）。
    function codexHint(stepId) {
        var r = trigger(stepId);
        if (!r || r.dismissed || !r.step) return false;
        dismiss(stepId);
        if (window.showMessage) {
            window.showMessage('💡 新手引导·' + r.step.title + '：' + r.step.text + '（图鉴面板可回看全部引导）', 'info');
        }
        return true;
    }

    // ============== v21.9：图鉴面板（六类图鉴 + 引导回看 + 机制速览） ==============
    function openCodexPanel() {
        var html = '<div class="space-y-4 text-sm">';
        CODEX_TYPES.forEach(function (c) {
            var entries = getEntries(c.id);
            html += '<div class="bg-gray-800/60 rounded-lg p-3 border border-gray-700">';
            html += '<p class="font-bold text-yellow-400">📚 ' + c.name + ' <span class="text-xs text-gray-500 font-normal">（' + c.desc + ' · 已收录 ' + entries.length + '）</span></p>';
            if (entries.length === 0) {
                html += '<p class="text-xs text-gray-500 mt-1">尚未收录——去世界里走走就有了。</p>';
            } else {
                html += '<div class="mt-1 space-y-0.5 max-h-32 overflow-y-auto">';
                entries.slice(0, 30).forEach(function (e) {
                    var nm = (e.info && (e.info.name || e.info.title)) || e.itemId;
                    html += '<p class="text-xs text-gray-300">· ' + nm + (e.count > 1 ? ' <span class="text-gray-500">×' + e.count + '</span>' : '') + '</p>';
                    markSeen(c.id, e.itemId);
                });
                html += '</div>';
            }
            html += '</div>';
        });
        // 第七十五波·游历残页册：拾得的旧事收成一册（册子模块在位才挂，缺位静默——图鉴六类老账不动）
        if (window.LoreShelf && typeof window.LoreShelf.summary === 'function') {
            var _lsSum = null;
            try { _lsSum = window.LoreShelf.summary(); } catch (eLs) {}
            html += '<div class="bg-gray-800/60 rounded-lg p-3 border border-gray-700">';
            html += '<p class="font-bold text-amber-400">📜 游历残页册' + (_lsSum ? ' <span class="text-xs text-gray-500 font-normal">（拾得 ' + _lsSum.pages + ' 张 · 拼成旧事 ' + _lsSum.full + ' 域）</span>' : '') + '</p>';
            html += '<p class="text-xs text-gray-500 mt-1">洞天匣底的残页，拾过就收在册子里——随时重读，拼齐一域收起完整旧事。</p>';
            html += '<button onclick="openLoreShelf()" class="mt-2 w-full p-2 rounded bg-amber-900 hover:bg-amber-800 text-amber-200 text-xs">📜 翻开册子</button>';
            html += '</div>';
        }
        // 新手引导回看
        html += '<div class="bg-gray-800/60 rounded-lg p-3 border border-gray-700"><p class="font-bold text-cyan-400">🧭 新手引导（' + TUTORIAL_STEPS.length + ' 步）</p><div class="mt-1 space-y-1">';
        TUTORIAL_STEPS.forEach(function (s) {
            html += '<p class="text-xs ' + (isDismissed(s.id) ? 'text-gray-400' : 'text-gray-300') + '">' + (isDismissed(s.id) ? '✅' : '⬜') + ' <b>' + s.title + '</b>：' + s.text + '</p>';
        });
        html += '</div></div>';
        // 机制速览
        html += '<div class="bg-gray-800/60 rounded-lg p-3 border border-gray-700"><p class="font-bold text-purple-400">🔮 机制速览</p><div class="mt-1 space-y-2">';
        KNOWLEDGE.forEach(function (k) {
            html += '<div><p class="text-xs font-bold text-gray-200">' + k.icon + ' ' + k.name + '</p><p class="text-xs text-gray-400 leading-relaxed">' + k.text + '</p></div>';
        });
        html += '</div></div></div>';
        if (typeof window.showModal === 'function') window.showModal('📖 图鉴 · 引导 · 机制速览', html);
    }

    // ============== v21.9：世界大事记面板 ==============
    function openWorldJournalPanel() {
        var entries = getRecent(30);
        var html = '<div class="space-y-2 text-sm">';
        if (entries.length === 0) {
            html += '<p class="text-gray-500 text-center">大事记还空着——世界尚未因你而起波澜。</p>';
        } else {
            entries.forEach(function (e) {
                html += '<div class="bg-gray-800/60 rounded-lg p-3 border-l-4 border-yellow-600/60">' +
                    '<p class="text-xs text-gray-500">第 ' + e.day + ' 天</p>' +
                    '<p class="font-bold text-yellow-400 text-sm">' + e.title + '</p>' +
                    (e.text ? '<p class="text-xs text-gray-300 mt-1 leading-relaxed">' + e.text + '</p>' : '') +
                    '</div>';
            });
        }
        html += '</div>';
        if (typeof window.showModal === 'function') window.showModal('🗞️ 世界大事记（最近 ' + entries.length + ' 条）', html);
    }

    window.CodexTutorial = {
        trigger: trigger,
        dismiss: dismiss,
        isDismissed: isDismissed,
        listSteps: listSteps
    };
    window.Codex = {
        discover: discover,
        getEntries: getEntries,
        getEntry: getEntry,
        getProgress: getProgress,
        markSeen: markSeen,
        listTypes: function () { return CODEX_TYPES.slice(); },
        getState: function () { return _state.codex; }
    };
    window.WorldJournal = {
        record: record,
        getEntries: getJournalEntries,
        getByDayRange: getByDayRange,
        getByType: getByType,
        getRecent: getRecent,
        getState: function () { return _state.journal; }
    };
    window.XianXia = window.XianXia || {};
    window.XianXia.CodexTutorial = window.CodexTutorial;
    window.XianXia.Codex = window.Codex;
    window.XianXia.WorldJournal = window.WorldJournal;
    // v21.9：UI 头接线——引导触点 + 两个可打开的面板（设置面板按钮直连）
    window.codexHint = codexHint;
    window.openCodexPanel = openCodexPanel;
    window.openWorldJournalPanel = openWorldJournalPanel;
    window.CODEX_KNOWLEDGE = KNOWLEDGE;
    try { console.log('[CodexTutorial] initialized v1 (' + TUTORIAL_STEPS.length + ' tutorial steps, ' + CODEX_TYPES.length + ' codex types, journal cap=' + MAX_JOURNAL + ')'); } catch (e) {}
})();
