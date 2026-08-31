// ==================== dungeon-dynamic.js - 动态秘境 (v19.9 P1-6) ====================
// 对标 v18.8 路线图 §4 P1-6：8 个动态秘境模板 + 6 个流派解法 + 5~10 房事件池。

(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    // ============== 1. 6 事件类型 ==============
    var EVENT_TYPES = ['combat', 'puzzle', 'chance', 'treasure', 'trap', 'boss'];

    // ============== 2. 房间事件模板（按 env 区分） ==============
    var ROOM_TEMPLATES = {
        thunder: [
            { type: 'combat', name: '雷泽战·妖', difficulty: 1.0, options: ['战','遁'], solution: 'sword' },
            { type: 'puzzle', name: '雷纹解谜', difficulty: 1.2, options: ['解','绕'], solution: 'formation' },
            { type: 'treasure', name: '雷晶宝库', difficulty: 0.8, options: ['取','留'], reward: { materials: ['mat_thunder_crystal'] } },
            { type: 'chance', name: '雷灵显化', difficulty: 1.0, options: ['祈','拒'], reward: { expBoost: 0.3 } },
            { type: 'trap', name: '落雷阱', difficulty: 1.0, options: ['跳','触'], solution: 'spiritRoot' },
            { type: 'boss', name: '雷泽之主', difficulty: 1.5, options: ['战','降'], solution: 'sword' }
        ],
        ghost: [
            { type: 'combat', name: '亡魂战', difficulty: 1.0, options: ['战','化'], solution: 'sword' },
            { type: 'puzzle', name: '魂阵', difficulty: 1.2, options: ['破','绕'], solution: 'formation' },
            { type: 'treasure', name: '残破法器', difficulty: 0.8, options: ['取','留'], reward: { materials: ['mat_demon_beast_bone'] } },
            { type: 'chance', name: '古修残念', difficulty: 1.0, options: ['听','拒'], reward: { expBoost: 0.2 } },
            { type: 'trap', name: '煞气冲体', difficulty: 1.0, options: ['守','抗'], solution: 'talisman' },
            { type: 'boss', name: '万年战魂', difficulty: 1.5, options: ['战','超'], solution: 'sword' }
        ],
        alchemy: [
            { type: 'puzzle', name: '药理解谜', difficulty: 1.2, options: ['解','绕'], solution: 'alchemy' },
            { type: 'puzzle', name: '丹炉复现', difficulty: 1.3, options: ['炼','弃'], solution: 'alchemy' },
            { type: 'treasure', name: '万年药园', difficulty: 0.8, options: ['取','留'], reward: { materials: ['mat_thousand_lingzhi','mat_snow_lotus'] } },
            { type: 'chance', name: '药灵显化', difficulty: 1.0, options: ['祈','拒'], reward: { expBoost: 0.3 } },
            { type: 'trap', name: '毒瘴', difficulty: 1.0, options: ['避','抗'], solution: 'spiritRoot' },
            { type: 'boss', name: '万年药王残念', difficulty: 1.4, options: ['解','战'], solution: 'alchemy' }
        ],
        water: [
            { type: 'combat', name: '蛟龙战', difficulty: 1.1, options: ['战','诱'], solution: 'sword' },
            { type: 'puzzle', name: '潮汐纹', difficulty: 1.2, options: ['解','绕'], solution: 'formation' },
            { type: 'treasure', name: '龙宫宝库', difficulty: 0.8, options: ['取','留'], reward: { materials: ['mat_dragon_scale','mat_dragon_blood'] } },
            { type: 'chance', name: '龙女试心', difficulty: 1.0, options: ['答','拒'], reward: { expBoost: 0.25 } },
            { type: 'trap', name: '深海压', difficulty: 1.0, options: ['升','抗'], solution: 'spiritRoot' },
            { type: 'boss', name: '龙宫之主', difficulty: 1.5, options: ['战','降'], solution: 'spiritBeast' }
        ],
        dark: [
            { type: 'combat', name: '幽魂战', difficulty: 1.0, options: ['战','超'], solution: 'talisman' },
            { type: 'puzzle', name: '阴符解', difficulty: 1.2, options: ['解','绕'], solution: 'talisman' },
            { type: 'treasure', name: '阴骨堆', difficulty: 0.8, options: ['取','留'], reward: { materials: ['mat_demon_beast_bone','mat_demon_beast_core'] } },
            { type: 'chance', name: '亡者低语', difficulty: 1.0, options: ['听','拒'], reward: { expBoost: 0.2 } },
            { type: 'trap', name: '阴风', difficulty: 1.0, options: ['守','抗'], solution: 'talisman' },
            { type: 'boss', name: '枯骨君王', difficulty: 1.4, options: ['镇','战'], solution: 'talisman' }
        ],
        illusion: [
            { type: 'puzzle', name: '幻阵解', difficulty: 1.3, options: ['破','绕'], solution: 'formation' },
            { type: 'puzzle', name: '心魔问', difficulty: 1.4, options: ['答','拒'], solution: 'formation' },
            { type: 'treasure', name: '幻晶堆', difficulty: 0.9, options: ['取','留'], reward: { materials: ['mat_chaos_stone'] } },
            { type: 'chance', name: '心相显化', difficulty: 1.0, options: ['观','拒'], reward: { expBoost: 0.3 } },
            { type: 'trap', name: '心象迷', difficulty: 1.0, options: ['守','问'], solution: 'formation' },
            { type: 'boss', name: '九幽之主', difficulty: 1.6, options: ['破','战'], solution: 'formation' }
        ],
        cloud: [
            { type: 'combat', name: '仙鹤战', difficulty: 1.0, options: ['战','化'], solution: 'sword' },
            { type: 'puzzle', name: '云篆解', difficulty: 1.2, options: ['解','绕'], solution: 'formation' },
            { type: 'treasure', name: '云海宝库', difficulty: 0.8, options: ['取','留'], reward: { materials: ['mat_star_iron'] } },
            { type: 'chance', name: '仙灵授法', difficulty: 1.0, options: ['受','拒'], reward: { expBoost: 0.4 } },
            { type: 'trap', name: '罡风', difficulty: 1.0, options: ['避','抗'], solution: 'spiritRoot' },
            { type: 'boss', name: '云海仙君', difficulty: 1.5, options: ['战','拜'], solution: 'sword' }
        ],
        '5e': [
            { type: 'puzzle', name: '五行解', difficulty: 1.3, options: ['解','绕'], solution: 'formation' },
            { type: 'puzzle', name: '相生相克', difficulty: 1.3, options: ['排','弃'], solution: 'formation' },
            { type: 'treasure', name: '五行精华', difficulty: 0.8, options: ['取','留'], reward: { materials: ['mat_five_element_essence'] } },
            { type: 'chance', name: '五行灵显', difficulty: 1.0, options: ['祈','拒'], reward: { expBoost: 0.3 } },
            { type: 'trap', name: '相克爆发', difficulty: 1.0, options: ['避','抗'], solution: 'formation' },
            { type: 'boss', name: '五行祖巫', difficulty: 1.5, options: ['阵','战'], solution: 'formation' }
        ]
    };

    // ============== 3. 8 个动态秘境模板 ==============
    var DUNGEON_TEMPLATES = [
        { id:'dgn_thunder_cave',  name:'雷泽洞天', env:'thunder', region:'东海', appearMonths:[3,4,5], appearChance:0.7, duration:7, suggestedRealm:'金丹', roomCount:8, solutions:{sword:1.2, formation:0.6, talisman:0.5, spiritRoot:1.3, alchemy:0.3, spiritBeast:0.5}, rewards:{materials:['mat_thunder_crystal']} },
        { id:'dgn_ancient_field', name:'古战场',   env:'ghost',   region:'中原', appearMonths:[1,2,3,4,5,6,7,8,9,10,11,12], appearChance:0.05, duration:14, suggestedRealm:'元婴', roomCount:10, solutions:{sword:1.2, formation:0.5, talisman:0.7, spiritRoot:0.9, alchemy:0.3, spiritBeast:0.4}, rewards:{materials:['mat_demon_beast_bone','mat_demon_beast_core']} },
        { id:'dgn_yaowang_tomb',  name:'药王遗府', env:'alchemy', region:'南疆', appearMonths:[6,7,8], appearChance:0.6, duration:14, suggestedRealm:'筑基', roomCount:6, solutions:{sword:0.5, formation:0.4, talisman:0.6, spiritRoot:1.0, alchemy:1.5, spiritBeast:0.5}, rewards:{materials:['mat_thousand_lingzhi','mat_peach_fruit']} },
        { id:'dgn_dragon_palace', name:'海底龙宫', env:'water',   region:'南海', appearMonths:[3,4], appearChance:0.5, duration:21, suggestedRealm:'金丹', roomCount:8, solutions:{sword:0.7, formation:0.5, talisman:0.6, spiritRoot:1.1, alchemy:0.4, spiritBeast:1.4}, rewards:{materials:['mat_dragon_scale','mat_dragon_blood','mat_dragon_bone']} },
        { id:'dgn_dry_bone',      name:'枯骨渊',   env:'dark',    region:'极北', appearMonths:[10,11,12], appearChance:0.4, duration:30, suggestedRealm:'筑基', roomCount:7, solutions:{sword:0.6, formation:0.5, talisman:1.3, spiritRoot:0.9, alchemy:0.5, spiritBeast:0.6}, rewards:{materials:['mat_demon_beast_core']} },
        { id:'dgn_ghost_realm',   name:'九幽幻境', env:'illusion',region:'秘境虚空', appearMonths:[1,2,3,4,5,6,7,8,9,10,11,12], appearChance:0.02, duration:7, suggestedRealm:'元婴', roomCount:9, solutions:{sword:0.6, formation:1.5, talisman:0.7, spiritRoot:0.8, alchemy:0.4, spiritBeast:0.5}, rewards:{materials:['mat_chaos_stone']} },
        { id:'dgn_cloud_palace',  name:'云海仙阙', env:'cloud',   region:'天空', appearMonths:[7,8,9], appearChance:0.5, duration:14, suggestedRealm:'金丹', roomCount:8, solutions:{sword:1.0, formation:0.7, talisman:0.6, spiritRoot:1.0, alchemy:0.4, spiritBeast:0.6}, rewards:{materials:['mat_star_iron']} },
        { id:'dgn_5e_forbidden',  name:'五行禁地', env:'5e',      region:'中原深处', appearMonths:[1,2,3,4,5,6,7,8,9,10,11,12], appearChance:0.1, duration:7, suggestedRealm:'金丹', roomCount:8, solutions:{sword:0.5, formation:1.5, talisman:0.7, spiritRoot:0.9, alchemy:0.6, spiritBeast:0.5}, rewards:{materials:['mat_five_element_essence']} }
    ];

    // ============== 4. 模块级状态 ==============
    var _state = {
        active: [],          // {id, openedDay, closeDay, region, ...}
        progress: {},        // {dungeonId: {roomsCleared, currentRoom, totalReward, startedDay, lastEvent, choices}}
        history: []          // 最近 20 次完成
    };

    // ============== 5. 工具 ==============
    function getTemplate(id) { for (var i = 0; i < DUNGEON_TEMPLATES.length; i++) if (DUNGEON_TEMPLATES[i].id === id) return DUNGEON_TEMPLATES[i]; return null; }
    function getActive(id) { for (var i = 0; i < _state.active.length; i++) if (_state.active[i].id === id) return _state.active[i]; return null; }

    function pickRoomForDungeon(d, currentRoom) {
        var pool = ROOM_TEMPLATES[d.env] || ROOM_TEMPLATES.thunder;
        var difficultyMul = 1.0 + currentRoom * 0.1;
        var r = pool[Math.floor(Math.random() * pool.length)];
        return Object.assign({}, r, { difficulty: (r.difficulty || 1.0) * difficultyMul });
    }

    // ============== 6. 公开 API ==============
    function generateDaily(worldDay, worldMonth) {
        worldMonth = worldMonth || Math.floor((worldDay % 360) / 30) + 1;
        // 移除过期
        for (var i = _state.active.length - 1; i >= 0; i--) {
            if (_state.active[i].closeDay <= worldDay) {
                if (window.EventBus) window.EventBus.emit('dungeon:dynamic:close', { id: _state.active[i].id, day: worldDay });
                _state.active.splice(i, 1);
            }
        }
        // 尝试新生成
        for (var j = 0; j < DUNGEON_TEMPLATES.length; j++) {
            var t = DUNGEON_TEMPLATES[j];
            if (t.appearMonths.indexOf(worldMonth) < 0) continue;
            // 已经激活
            if (getActive(t.id)) continue;
            if (Math.random() < t.appearChance) {
                var a = { id: t.id, name: t.name, env: t.env, region: t.region, openedDay: worldDay, closeDay: worldDay + t.duration, template: t };
                _state.active.push(a);
                if (window.EventBus) window.EventBus.emit('dungeon:dynamic:spawn', { id: t.id, day: worldDay, closeDay: a.closeDay });
            }
        }
        return _state.active.slice();
    }

    function listActive() { return _state.active.slice(); }

    function enter(dungeonId) {
        var a = getActive(dungeonId);
        if (!a) return { ok: false, reason: 'not-active' };
        if (_state.progress[dungeonId]) return { ok: false, reason: 'already-in-progress', progress: _state.progress[dungeonId] };
        var today = (window.WorldCalendar && window.WorldCalendar.day) || 0;
        var firstRoom = pickRoomForDungeon(a.template, 0);
        _state.progress[dungeonId] = { roomsCleared: 0, currentRoom: 0, currentRoomEvent: firstRoom, totalReward: [], startedDay: today, choices: [] };
        if (window.EventBus) window.EventBus.emit('dungeon:dynamic:enter', { id: dungeonId, day: today });
        return { ok: true, dungeon: a, roomCount: a.template.roomCount, currentRoom: firstRoom };
    }

    function exploreRoom(dungeonId, choice) {
        var a = getActive(dungeonId);
        if (!a) return { ok: false, reason: 'not-active' };
        var p = _state.progress[dungeonId];
        if (!p) return { ok: false, reason: 'not-entered' };
        if (p.currentRoom >= a.template.roomCount) return { ok: false, reason: 'dungeon-complete' };
        // 优先使用已存 currentRoomEvent（enter 时存的）
        var room = p.currentRoomEvent || pickRoomForDungeon(a.template, p.currentRoom);
        if (!room.options || room.options.indexOf(choice) < 0) return { ok: false, reason: 'invalid-choice', valid: room.options };
        p.choices.push(choice);
        // 计算结果：流派解法系数
        var sol = (room.solution && a.template.solutions[room.solution]) || 1.0;
        var successChance = 0.6 + (sol - 1.0) * 0.5;
        var success = Math.random() < successChance;
        var result = { room: room, choice: choice, success: success, solution: room.solution || null, solMult: sol };
        if (success && room.reward) {
            p.totalReward = p.totalReward.concat(room.reward.materials || []);
            result.reward = room.reward;
        } else if (!success) {
            result.penalty = { reason: 'failed-' + (room.solution || 'default') };
        }
        p.roomsCleared = p.currentRoom + 1;
        p.currentRoom += 1;
        // 准备下一房（如果未完成）
        if (p.currentRoom < a.template.roomCount) {
            p.currentRoomEvent = pickRoomForDungeon(a.template, p.currentRoom);
        } else {
            p.currentRoomEvent = null;
        }
        // 检查完成
        if (p.currentRoom >= a.template.roomCount) {
            // 完成
            var title = null;
            if (p.roomsCleared === a.template.roomCount && (a.template.solutions.sword >= 1.0 || a.template.solutions.formation >= 1.0 || a.template.solutions.alchemy >= 1.0 || a.template.solutions.talisman >= 1.0 || a.template.solutions.spiritBeast >= 1.0)) {
                title = a.name + '探索者';
            }
            _state.history.unshift({ dungeonId: dungeonId, name: a.name, roomsCleared: p.roomsCleared, totalReward: p.totalReward.slice(), title: title, day: (window.WorldCalendar && window.WorldCalendar.day) || 0 });
            if (_state.history.length > 20) _state.history.pop();
            delete _state.progress[dungeonId];
            if (window.EventBus) window.EventBus.emit('dungeon:dynamic:complete', { id: dungeonId, title: title, reward: result.reward || null });
            result.completed = true;
            result.title = title;
        } else {
            result.nextRoom = p.currentRoom;
        }
        return { ok: true, result: result };
    }

    function leave(dungeonId) {
        var p = _state.progress[dungeonId];
        if (!p) return { ok: false, reason: 'not-in-progress' };
        var explored = p.roomsCleared;
        var reward = p.totalReward.slice();
        delete _state.progress[dungeonId];
        if (window.EventBus) window.EventBus.emit('dungeon:dynamic:leave', { id: dungeonId, explored: explored, reward: reward });
        return { ok: true, explored: explored, totalReward: reward };
    }

    function getPlayerProgress(dungeonId) { return _state.progress[dungeonId] || null; }

    // ============== 7. StateRegistry ==============
    function _exportState() { return JSON.parse(JSON.stringify(_state)); }
    function _importState(s) {
        if (!s) return;
        if (Array.isArray(s.active)) _state.active = s.active;
        if (s.progress && typeof s.progress === 'object') _state.progress = s.progress;
        if (Array.isArray(s.history)) _state.history = s.history.slice(0, 20);
    }
    function _resetState() { _state.active = []; _state.progress = {}; _state.history = []; }

    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        try {
            window.StateRegistry.register('dungeonDynamic', { version: 1, export: _exportState, import: _importState, reset: _resetState });
        } catch (e) {}
    }

    // ============== 8. 导出 ==============
    window.DungeonDynamic = {
        EVENT_TYPES: EVENT_TYPES,
        DUNGEON_TEMPLATES: DUNGEON_TEMPLATES,
        ROOM_TEMPLATES: ROOM_TEMPLATES,
        generateDaily: generateDaily,
        listActive: listActive,
        enter: enter,
        exploreRoom: exploreRoom,
        leave: leave,
        getPlayerProgress: getPlayerProgress,
        getTemplate: getTemplate,
        getState: function () { return _state; }
    };
    if (window.XianXia) window.XianXia.DungeonDynamic = window.DungeonDynamic;
    try { console.log('[DungeonDynamic] initialized v1 (' + DUNGEON_TEMPLATES.length + ' dungeon templates, ' + Object.keys(ROOM_TEMPLATES).length + ' env pools)'); } catch (e) {}
})();
