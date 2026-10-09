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
        { id:'dgn_5e_forbidden',  name:'五行禁地', env:'5e',      region:'中原深处', appearMonths:[1,2,3,4,5,6,7,8,9,10,11,12], appearChance:0.1, duration:7, suggestedRealm:'金丹', roomCount:8, solutions:{sword:0.5, formation:1.5, talisman:0.7, spiritRoot:0.9, alchemy:0.6, spiritBeast:0.5}, rewards:{materials:['mat_five_element_essence']} },
        // ===== v21.9 高境界专属秘境：此前池内 suggestedRealm 封顶元婴——化神往后「无事可做」，
        // 只有数值缩放没有新去处。四座高阶秘境按境界递进开放，产高阶材料。=====
        { id:'dgn_star_sea',      name:'星陨古域', env:'thunder', region:'秘境虚空', appearMonths:[1,4,7,10], appearChance:0.35, duration:14, suggestedRealm:'化神', roomCount:10, solutions:{sword:1.3, formation:0.8, talisman:0.5, spiritRoot:1.2, alchemy:0.3, spiritBeast:0.5}, rewards:{materials:['mat_star_sand','mat_thunder_crystal']} },
        { id:'dgn_god_tomb',      name:'古神葬地', env:'dark',    region:'极北',     appearMonths:[11,12],    appearChance:0.3,  duration:21, suggestedRealm:'炼虚', roomCount:10, solutions:{sword:0.8, formation:0.6, talisman:1.4, spiritRoot:1.0, alchemy:0.4, spiritBeast:0.6}, rewards:{materials:['mat_chaos_stone','mat_dragon_crystal']} },
        { id:'dgn_heaven_ruin',   name:'天墟遗宫', env:'cloud',   region:'天空',     appearMonths:[2,8],      appearChance:0.25, duration:14, suggestedRealm:'合体', roomCount:11, solutions:{sword:1.2, formation:1.0, talisman:0.6, spiritRoot:1.1, alchemy:0.4, spiritBeast:0.6}, rewards:{materials:['mat_space_crystal','mat_star_iron']} },
        { id:'dgn_chaos_sea',     name:'混沌潮眼', env:'5e',      region:'中原深处', appearMonths:[3,6,9,12], appearChance:0.2,  duration:30, suggestedRealm:'大乘', roomCount:12, solutions:{sword:0.7, formation:1.6, talisman:0.8, spiritRoot:1.2, alchemy:0.6, spiritBeast:0.5}, rewards:{materials:['mat_five_element_essence','mat_chaos_stone']} }
    ];

    // ============== 3.5 宝藏产地账（第七批：《吴越春秋·阖闾内传》） ==============
    // 「赤堇之山★已令无云★，若耶之溪深而莫测，★群臣上天，欧冶死矣★」
    //   —— 干将莫邪之所以无价，**不是属性高**，是那座矿「已令无云」（找不到路）＋那手铸法绝传。
    //   所以「稀有」该由**标签**表达，不是由掉率表达：掉率一改就是全局数值调整（禁改簿第一条不许）。
    //
    // ★ 先答那个前置问题：**秘境掉落现在是不是平铺？**（结论见 .scratch/forge-materials-progress/20-事2秘境.md）
    //   出现这一侧**不平铺**：appearChance 0.02~0.7（35 倍差）、appearMonths 限季、duration 7~30 天开窗、
    //   且一窗一走（enter() 第 190 行：history 里本窗口期有完成账就不放人二次刷）——曲线是真的。
    //   掉落这一侧**平铺**：每个 env 的 ROOM_TEMPLATES 只有**一条** treasure 模板（8 个 env 共 8 条），
    //   于是同一座秘境里第 1 房与第 12 房给的是**同一味料**，房号不换料（roomCount 只线性加期望件数）；
    //   而且掉落值只挂在 env 上，**不挂 suggestedRealm**——大乘的混沌潮眼与金丹的五行禁地同给一味五行精华。
    //   ⇒ 要治的正是后者。**掉落表一个数都不动**，只给它挂上「这处产地还剩多少」的标签。
    //
    // ★ 绝迹度**不是另编的一套稀有度**：它就由本文件表里已有的四个数算出来，
    //   每个档都写得出 basis，玩家/验收都能自己核回去——标签与曲线同源，两者不可能互相打脸。
    //     appearChance ≤ 0.1  ⇒ 产地绝迹（几十年未必再开一窗）
    //     0.1 < chance ≤ 0.3   ⇒ 产地稀见
    //     chance > 0.3         ⇒ 产地在产
    var EXTINCT_BANDS = [
        { max: 0.1,  key: 'extinct', label: '产地绝迹' },
        { max: 0.3,  key: 'rare',    label: '产地稀见' },
        { max: 1,    key: 'flowing', label: '产地在产' }
    ];
    function extinctBandOf(chance) {
        var c = Number(chance);
        for (var i = 0; i < EXTINCT_BANDS.length; i++) if (!(c > EXTINCT_BANDS[i].max)) return EXTINCT_BANDS[i];
        return EXTINCT_BANDS[EXTINCT_BANDS.length - 1];
    }
    // 一座秘境一处宝藏产地（逐条：秘境 → 地域 → 绝迹标签 → 料 → 炼器出口）
    // ★ forgeable 现读 window.ForgingCompound.MATERIAL_GRADE：炼不了的料如实标 false，
    //   **不悄悄留下一个玩家永远炼不了的掉落**（实测 12 座里有 6 座给的是炼不了的料，见报告）。
    function treasureLedger() {
        var F = window.ForgingCompound || null;
        var grade = (F && F.MATERIAL_GRADE) ? F.MATERIAL_GRADE : null;
        var out = [];
        for (var i = 0; i < DUNGEON_TEMPLATES.length; i++) {
            var t = DUNGEON_TEMPLATES[i];
            var pool = ROOM_TEMPLATES[t.env] || [];
            for (var j = 0; j < pool.length; j++) {
                if (pool[j].type !== 'treasure') continue;
                var band = extinctBandOf(t.appearChance);
                var mats = (pool[j].reward && pool[j].reward.materials) || [];
                for (var k = 0; k < mats.length; k++) {
                    var g = grade ? grade[mats[k]] : null;
                    out.push({
                        dungeonId: t.id, dungeonName: t.name, env: t.env, region: t.region || '秘境',
                        suggestedRealm: t.suggestedRealm, roomName: pool[j].name,
                        appearChance: t.appearChance, appearMonths: (t.appearMonths || []).length,
                        duration: t.duration, roomCount: t.roomCount,
                        extinct: band.key, extinctLabel: band.label,
                        matId: mats[k], grade: g ? g.grade : null,
                        materialLevel: g ? g.level : null,
                        forgeable: !!g,
                        basis: '本文件 DUNGEON_TEMPLATES「' + t.name + '」（' + (t.region || '秘境') + '·建议' + t.suggestedRealm
                            + '）：appearChance ' + t.appearChance + '、一年开 ' + (t.appearMonths || []).length
                            + ' 个月、开窗 ' + t.duration + ' 天、一窗一走（enter() 第 190 行：history 里本窗口期有完成账就不再放人进去）'
                            + ' ⇒ 判「' + band.label + '」。宝藏模板「' + pool[j].name + '」出自 ROOM_TEMPLATES[' + t.env + ']'
                            + '（同一 env 只此一条 treasure 模板 ⇒ 一座秘境里第 1 房与第 ' + t.roomCount + ' 房给的是同一味料）'
                            + (g ? '' : '　★该料不在炼器账 MATERIAL_GRADE 里 ⇒ 打进背包也炼不了')
                    });
                }
            }
        }
        return out;
    }
    function treasureLedgerOf(dungeonIdOrName) {
        var k = String(dungeonIdOrName || '');
        return treasureLedger().filter(function (r) { return r.dungeonId === k || r.dungeonName === k; });
    }
    // 绝迹度分布（面板/测试读这张；不是新数值，是表里 appearChance 的分段计数）
    function extinctSummary() {
        var rows = treasureLedger(), by = { extinct: [], rare: [], flowing: [] }, mats = {};
        for (var i = 0; i < rows.length; i++) {
            if (by[rows[i].extinct].indexOf(rows[i].dungeonName) < 0) by[rows[i].extinct].push(rows[i].dungeonName);
            mats[rows[i].matId] = (mats[rows[i].matId] || 0) + 1;
        }
        return {
            bands: by,
            forgeable: rows.filter(function (r) { return r.forgeable; }).length,
            unforgeable: rows.filter(function (r) { return !r.forgeable; }).length,
            rows: rows.length,
            sharedMats: Object.keys(mats).filter(function (m) { return mats[m] > 1; })
        };
    }

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
                // 第一百零九波：窗口关了就收走走到一半的进度——此前孤儿进度随存档永续，
                // 同模板秘境下次再开永远「already-in-progress」且无续玩入口，等于永久卡死
                delete _state.progress[_state.active[i].id];
                _state.active.splice(i, 1);
            }
        }
        // 尝试新生成
        for (var j = 0; j < DUNGEON_TEMPLATES.length; j++) {
            var t = DUNGEON_TEMPLATES[j];
            if (t.appearMonths.indexOf(worldMonth) < 0) continue;
            // 已经激活
            if (getActive(t.id)) continue;
            // v20.0：雷鹰 scout buff 提高出现率
            var chanceMul = getScoutChanceMul();
            if (Math.random() < t.appearChance * chanceMul) {
                var a = { id: t.id, name: t.name, env: t.env, region: t.region, openedDay: worldDay, closeDay: worldDay + t.duration, template: t };
                _state.active.push(a);
                // v24·DES-26：开窗即把关窗日镜像进世界日历——闭关的「下次秘境窗口」卡从此有真目标
                try {
                    if (window.WorldCalendar && typeof window.WorldCalendar.register === 'function') {
                        window.WorldCalendar.register({
                            id: 'dungeon_window.' + t.id + '.close.' + a.closeDay,
                            title: a.name + '（' + (a.region || '野外') + '）·窗口闭于第 ' + a.closeDay + ' 天',
                            category: 'dungeon_window',
                            dueAbsoluteDay: a.closeDay,
                            source: { system: 'dungeon_dynamic', refId: t.id },
                            severity: 'remind',
                            payload: { dungeonId: t.id, name: a.name, region: a.region, openedDay: worldDay, closeDay: a.closeDay }
                        });
                    }
                } catch (eCal) {}
                if (window.EventBus) window.EventBus.emit('dungeon:dynamic:spawn', { id: t.id, day: worldDay, closeDay: a.closeDay });
            }
        }
        return _state.active.slice();
    }

    // v20.0：雷鹰 scout buff 提高秘境出现率
    function getScoutChanceMul() {
        try {
            if (window.BeastEcosystem && typeof window.BeastEcosystem.getActiveBeastBuff === 'function') {
                if (window.BeastEcosystem.getActiveBeastBuff('scout') > 0) return 1.5;
            }
        } catch (e) {}
        return 1;
    }

    // v20.0：列出雷鹰探到的秘境窗口（含剩余天数）
    function listScouted() {
        var active = listActive();
        var today = (window.WorldCalendar && window.WorldCalendar.day) || 0;
        return active.map(function (a) {
            return {
                id: a.id,
                name: a.name,
                region: a.region,
                remain: Math.max(0, (a.closeDay || 0) - today),
                suggestedRealm: a.template && a.template.suggestedRealm
            };
        });
    }

    function listActive() { return _state.active.slice(); }

    function enter(dungeonId) {
        var a = getActive(dungeonId);
        if (!a) return { ok: false, reason: 'not-active' };
        // 第一百零九波：一窗一走——history 里有本窗口期（openedDay 之后）的完成账，就不再放人进去刷材料
        for (var hi = 0; hi < _state.history.length; hi++) {
            var h = _state.history[hi];
            if (h && h.dungeonId === dungeonId && (h.day || 0) >= (a.openedDay || 0)) {
                return { ok: false, reason: 'already-completed', history: h };
            }
        }
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
            // 剩余任务#1：秘境走完 → 图鉴记录（codex_dungeon）
            try {
                if (window.Codex && typeof window.Codex.discover === 'function') {
                    window.Codex.discover('codex_dungeon', dungeonId, { name: a.name, title: title || null, roomsCleared: p.roomsCleared });
                }
            } catch (eCodexD) {}
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
        EXTINCT_BANDS: EXTINCT_BANDS,
        extinctBandOf: extinctBandOf,
        treasureLedger: treasureLedger,
        treasureLedgerOf: treasureLedgerOf,
        extinctSummary: extinctSummary,
        generateDaily: generateDaily,
        listActive: listActive,
        getScoutChanceMul: getScoutChanceMul,
        listScouted: listScouted,
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
