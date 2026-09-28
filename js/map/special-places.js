// ==================== 仙路长青 - 特殊地点册（第一百一十一波 · 用户裁决） ====================
// 用户裁：「黑风寨这种东西就可以放进地图，地图现在进行扩展，可以通过消息（比如城市酒馆）或者自己发现
//         来看到这些特殊地点，随后它们就会出现在地区列表内作为特殊地点显示；状态会改变，比如寨子的土匪
//         被你杀光了就是真空了，你还能选择废弃地点来删除，释放性能。」
//
// 这一册只管三件事：
//   1) 地点在世界里本来就有，玩家知不知道是另一本账——没得知过就不上地区列表（旧版是活动页一枚常驻钮，
//      把「得先打听才知道有没有的地方」当成「随时能做的事」卖，违了「活动页只放随时能做」那条）；
//   2) 状态是真账：寨中守众打得一场少一场，清零即真空，空着无人接手满七日成废址；
//   3) 废址可由玩家亲手抹去此记——记录真的从存档里splice掉，不再每日核它的账。
(function (global) {
    'use strict';

    // 地点定义。只有「有法子得知」的地点才配进这张表——凭空一条又没人能发现的定义，是一条上不了屏的死数据。
    var PLACE_DEFS = [
        {
            id: 'heifeng_zhai',
            name: '黑风寨',
            icon: '🏴',
            region: '中州',
            kind: 'bandit_den',
            garrison: 3,             // 寨中三伙人：冲寨得手一冲清掉一伙
            battleType: 'bandits',   // 出的是山贼（生理已在 app.js DES-44 点名为人形血肉）
            desc: '山口一道木栅，栅后是匪窝。抢来的货堆在里头，具体还剩几个人守——打过才知道。',
            rumorLine: '邻桌有人压着嗓子说，西边山口立起一杆黑旗，那是黑风寨的号——这一处已标上你的舆图。',
            assaultWord: '攻寨'
        }
    ];

    var ABANDON_AFTER_DAYS = 7;        // 空寨无人接手，七日成废址
    var RUMOR_CHANCE = 1 / 3;          // 一次喝酒，册子里还有待得知地点时传进耳朵的几率
    var ASSAULT_TRAVEL_MINUTES = 120;  // 从城里奔到寨门口的脚程（走世界时辰的账，不是隐形配额）

    var STATUS = {
        active: '盘踞',
        empty: '真空',
        abandoned: '废弃'
    };

    var SOURCE_LABEL = {
        prison: '牢里犯人口中',
        trail: '官道脚印追到',
        rumor: '酒肆传闻听来',
        self: '自己撞见'
    };

    // 玩家名下这本册子：places 只装「已经得知」的地点，scrapped 记着被抹去过的（抹了就别再凭空长回来）
    var _state = { places: {}, scrapped: [] };

    // ============== 工具 ==============
    function defOf(id) {
        for (var i = 0; i < PLACE_DEFS.length; i++) if (PLACE_DEFS[i].id === id) return PLACE_DEFS[i];
        return null;
    }

    function day() {
        var d = global.WorldCalendar && global.WorldCalendar.day;
        return Number(d) > 0 ? Math.floor(Number(d)) : 0;
    }

    function say(text, kind) {
        if (global.showMessage) global.showMessage(text, kind || 'info');
    }

    // 状态不写死在档里，是现算的：守众 + 空了多少天 ⇒ 盘踞／真空／废弃
    function statusOf(rec) {
        if (!rec) return null;
        if ((rec.garrison || 0) > 0) return STATUS.active;
        var emptied = rec.emptiedDay || 0;
        var now = day();
        if (emptied > 0 && now > 0 && now - emptied >= ABANDON_AFTER_DAYS) return STATUS.abandoned;
        return STATUS.empty;
    }

    // 真空还差几日成废址（屏上把倒计时写出来，不搞看不见的钟）
    function daysToAbandon(rec) {
        var now = day();
        if (!rec || (rec.garrison || 0) > 0 || !(rec.emptiedDay > 0) || now <= 0) return null;
        return Math.max(0, ABANDON_AFTER_DAYS - (now - rec.emptiedDay));
    }

    // 地区列表是整块重绘的；得知／清空／抹去都当场补一次，玩家不用重开面板
    function refreshRegionList() {
        try {
            if (typeof global.generateRegionList === 'function') global.generateRegionList();
        } catch (e) { console.warn('[特殊地点] 地区列表重绘失败:', e); }
    }

    function closeDetailModal() {
        try {
            if (typeof global.closeModalSoft === 'function') global.closeModalSoft();
        } catch (e) {}
    }

    // ============== 公开 API ==============
    function defs() { return PLACE_DEFS.slice(); }

    function list() {
        var out = [];
        for (var i = 0; i < PLACE_DEFS.length; i++) {
            var rec = _state.places[PLACE_DEFS[i].id];
            if (rec) out.push({ def: PLACE_DEFS[i], record: rec, status: statusOf(rec) });
        }
        return out;
    }

    function listForRegion(region) {
        return list().filter(function (p) { return p.def.region === region; });
    }

    function isKnown(id) { return !!_state.places[id]; }

    // 得知一处。幂等：第二次听到同一句闲话不再报「已标上舆图」（旧版官道事件每撞一次就重报一次）。
    // opts.silent —— 调用方自己会把这句话排进更完整的窗面时（探监弹窗）不再另弹一条。
    function discover(id, source, opts) {
        var def = defOf(id);
        if (!def) return { ok: false, reason: 'no-such-place', newly: false };
        if (_state.scrapped.indexOf(id) >= 0) {
            if (!(opts && opts.silent)) say(def.name + ' 早已是废址，这条记号你自己抹掉了。', 'info');
            return { ok: false, reason: 'scrapped', newly: false, def: def };
        }
        if (_state.places[id]) {
            return { ok: true, newly: false, def: def, record: _state.places[id], status: statusOf(_state.places[id]) };
        }
        var rec = {
            id: id,
            discoveredDay: day(),
            source: source || 'self',
            garrison: def.garrison,
            emptiedDay: 0,
            abandonAnnounced: false
        };
        _state.places[id] = rec;
        if (!(opts && opts.silent)) {
            say(def.icon + ' ' + def.name + ' 已标上舆图——' + (SOURCE_LABEL[source] || SOURCE_LABEL.self) + '。去「九州舆图」的地区列表里寻它。', 'success');
        }
        refreshRegionList();
        return { ok: true, newly: true, def: def, record: rec, status: statusOf(rec) };
    }

    // 酒肆那句「三巡过后，消息进了耳朵」的真相来源（第一百一十一波·用户点名的消息口子）：
    // 册子里还有没得知的地点时才可能传进耳朵，且传闻句自己把「已标上舆图」说完（不再另弹一条）。
    // 全得知了就返回 null，让调用方照旧去读世界的传闻池——别拿一句编好的闲话挡掉真消息。
    function rollRumor() {
        var pool = PLACE_DEFS.filter(function (d) {
            return !_state.places[d.id] && _state.scrapped.indexOf(d.id) < 0;
        });
        if (!pool.length) return null;
        if (Math.random() >= RUMOR_CHANCE) return null;
        var d = pool[Math.floor(Math.random() * pool.length)];
        var r = discover(d.id, 'rumor', { silent: true });
        return (r.ok && r.newly) ? d.rumorLine : null;
    }

    // 打赢一场冲寨：清掉一伙人。全清了就是真空，从这天起算七日废址。
    function reportVictory(id) {
        var rec = _state.places[id];
        if (!rec) return null;
        var def = defOf(id);
        if ((rec.garrison || 0) <= 0) return { def: def, record: rec, status: statusOf(rec), cleared: 0 };
        rec.garrison -= 1;
        var cleared = 1;
        if (rec.garrison <= 0) {
            rec.garrison = 0;
            rec.emptiedDay = day();
            say(def.name + ' 里再没人守着——寨子空了。', 'success');
        } else {
            say('冲寨得手。' + def.name + ' 还剩 ' + rec.garrison + ' 伙人。', 'success');
        }
        refreshRegionList();
        return { def: def, record: rec, status: statusOf(rec), cleared: cleared };
    }

    // 攻寨：得先知道有这地方，且寨里得真有人。空寨没人可打，废址更没人可打——不拿「刷新」当出口。
    function assault(id) {
        var def = defOf(id);
        var rec = _state.places[id];
        if (!def || !rec) { say('你并不知道有这么一处地方。', 'warning'); return false; }
        closeDetailModal();
        var st = statusOf(rec);
        if (st !== STATUS.active) {
            say(def.name + ' 眼下' + st + '，无人可攻。', 'info');
            return false;
        }
        // 脚程走世界时辰的账：这一趟不是免费的，也不靠每日计数器拦人
        try {
            if (global.timeSystem && typeof global.timeSystem.advanceTime === 'function') {
                global.timeSystem.advanceTime(ASSAULT_TRAVEL_MINUTES, '奔赴' + def.name);
            }
        } catch (eTime) { console.warn('[特殊地点] 脚程时辰入账失败:', eTime); }
        var battle = typeof global.startBattle === 'function' ? global.startBattle(def.battleType) : null;
        if (battle) battle._specialPlaceId = id;
        return !!battle;
    }

    // 抹去此记：只有废弃地点抹得掉（用户裁「还能选择废弃地点来删除，释放性能」）。
    // 记录真的从这本册子里splice出去，之后每日不再核它的账。
    function forget(id) {
        var def = defOf(id);
        var rec = _state.places[id];
        if (!def || !rec) return false;
        closeDetailModal();
        if (statusOf(rec) !== STATUS.abandoned) {
            say(def.name + ' 还' + statusOf(rec) + '着，记号抹了你自己的账也断在这里。', 'warning');
            return false;
        }
        delete _state.places[id];
        if (_state.scrapped.indexOf(id) < 0) _state.scrapped.push(id);
        say('你把 ' + def.name + ' 这条记号从舆图上抹去了。', 'info');
        refreshRegionList();
        return true;
    }

    // ============== 地区列表那一组行 ==============
    // 摆法照 UI-09／UI-22：行 flex-wrap ＋ 名字 shrink-0 nowrap ＋ 钮组 ml-auto，折只折在语义界上
    function renderRegionRows(region) {
        var items = listForRegion(region);
        if (!items.length) return '';
        var rows = items.map(function (it) {
            var d = it.def;
            var left = daysToAbandon(it.record);
            var tail = it.status === STATUS.active
                ? '（守众 ' + it.record.garrison + '）'
                : (it.status === STATUS.empty
                    ? '（空寨' + (left === null ? '' : '，' + left + ' 日后成废址') + '）'
                    : '（废址）');
            var detailBtn = '<button onclick="event.stopPropagation(); SpecialPlaces.openDetail(\'' + d.id + '\')" class="cursor-pointer text-xs text-gray-300 border border-gray-600 hover:text-yellow-400 hover:border-yellow-600 px-2 py-0.5 rounded transition">详情</button>';
            // 钮名跟着状态走：没人可攻的行不挂「攻寨」，废址那枚才是「抹去」（热区不撒谎，UI-09 同一支笔）
            var actBtn = it.status === STATUS.active
                ? '<button onclick="event.stopPropagation(); SpecialPlaces.assault(\'' + d.id + '\')" class="cursor-pointer text-xs bg-red-800 hover:bg-red-700 text-white font-bold px-2 py-0.5 rounded transition">' + (d.assaultWord || '前往') + '</button>'
                : (it.status === STATUS.abandoned
                    ? '<button onclick="event.stopPropagation(); SpecialPlaces.forget(\'' + d.id + '\')" class="cursor-pointer text-xs border border-gray-600 hover:text-yellow-400 hover:border-yellow-600 text-gray-300 px-2 py-0.5 rounded transition">抹去</button>'
                    : '');
            return '<div class="city-list-item px-2 py-1 text-xs text-red-300 hover:text-yellow-400 hover:bg-gray-700 rounded flex flex-wrap items-center gap-x-1 gap-y-0.5">'
                + '<span class="shrink-0 whitespace-nowrap">' + d.icon + ' ' + d.name + ' <span class="text-gray-500">·' + it.status + tail + '</span></span>'
                + '<span class="flex items-center gap-1 shrink-0 ml-auto">' + detailBtn + actBtn + '</span></div>';
        }).join('');
        return '<div class="mt-2 pt-2 border-t border-gray-700">'
            + '<div class="px-2 text-xs text-gray-500">已知特殊地点</div>'
            + rows + '</div>';
    }

    // ============== 详情窗（走公共 showModal，自带 85vh 帽：UI-25） ==============
    function openDetail(id) {
        var def = defOf(id);
        var rec = _state.places[id];
        if (!def || !rec) return false;
        var st = statusOf(rec);
        var body = '<p class="text-sm text-gray-300 mb-3">' + def.desc + '</p>'
            + '<p class="text-xs text-gray-400 mb-1">怎么知道的：' + (SOURCE_LABEL[rec.source] || SOURCE_LABEL.self)
            + (rec.discoveredDay > 0 ? '（第 ' + rec.discoveredDay + ' 日）' : '') + '</p>'
            + '<p class="text-xs text-gray-400 mb-4">眼下：' + st
            + (st === STATUS.active ? '（寨中还有 ' + rec.garrison + ' 伙人）' : '')
            + (st === STATUS.empty && daysToAbandon(rec) !== null ? '（空了 ' + (day() - rec.emptiedDay) + ' 日，再过 ' + daysToAbandon(rec) + ' 日成废址）' : '')
            + (st === STATUS.abandoned ? '（寨墙塌尽，只剩一堆石头）' : '') + '</p>';
        if (st === STATUS.active) {
            var travel = typeof global.formatShichen === 'function' ? global.formatShichen(ASSAULT_TRAVEL_MINUTES) : (ASSAULT_TRAVEL_MINUTES + ' 分钟');
            body += '<button onclick="SpecialPlaces.assault(\'' + def.id + '\')" class="w-full mb-2 bg-red-800 hover:bg-red-700 text-white text-sm py-2 rounded">🏴 前往' + (def.assaultWord || '攻寨')
                + '（脚程 ' + travel + '）</button>';
        }
        if (st === STATUS.abandoned) {
            body += '<button onclick="SpecialPlaces.forget(\'' + def.id + '\')" class="w-full mb-2 bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 rounded">🧹 抹去此记（废址不再占你的舆图）</button>';
        }
        body += '<button onclick="closeModalSoft()" class="w-full bg-gray-600 hover:bg-gray-500 text-white text-sm py-2 rounded">离开</button>';
        if (typeof global.showModal === 'function') global.showModal(def.icon + ' ' + def.name + ' · ' + def.region, body);
        else say(def.name + '：' + def.desc + '（眼下' + st + '）', 'info');
        return true;
    }

    // ============== 每日：真空 → 废弃 那一步要说一句 ==============
    function tickDay() {
        var keys = Object.keys(_state.places);
        var changed = false;
        for (var i = 0; i < keys.length; i++) {
            var rec = _state.places[keys[i]];
            if (!rec || rec.abandonAnnounced) continue;
            if (statusOf(rec) === STATUS.abandoned) {
                var def = defOf(keys[i]);
                if (!def) continue;
                rec.abandonAnnounced = true;
                say((def.icon || '📍') + ' ' + def.name + ' 空了这些日子，无人接手，彻底成了废址。', 'warning');
                changed = true;
            }
        }
        if (changed) refreshRegionList();
        return true;
    }

    // ============== 存档：StateRegistry（不需要中央白名单，见 core/state-registry.js） ==============
    function _exportState() {
        return {
            places: JSON.parse(JSON.stringify(_state.places)),
            scrapped: _state.scrapped.slice()
        };
    }
    function _importState(s) {
        if (!s || typeof s !== 'object') return;
        if (s.places && typeof s.places === 'object') {
            _state.places = {};
            var keys = Object.keys(s.places);
            for (var i = 0; i < keys.length; i++) {
                var def = defOf(keys[i]);   // 认不出的地点不进口袋——定义改过之后旧档不该留孤账
                if (!def) continue;
                var r = s.places[keys[i]] || {};
                _state.places[keys[i]] = {
                    id: keys[i],
                    discoveredDay: Number(r.discoveredDay) > 0 ? Math.floor(Number(r.discoveredDay)) : 0,
                    source: typeof r.source === 'string' ? r.source : 'self',
                    garrison: Number(r.garrison) >= 0 ? Math.floor(Number(r.garrison)) : def.garrison,
                    emptiedDay: Number(r.emptiedDay) > 0 ? Math.floor(Number(r.emptiedDay)) : 0,
                    abandonAnnounced: !!r.abandonAnnounced
                };
            }
        }
        if (Array.isArray(s.scrapped)) _state.scrapped = s.scrapped.slice();
    }
    function _resetState() { _state.places = {}; _state.scrapped = []; }

    if (global.StateRegistry && typeof global.StateRegistry.register === 'function') {
        try {
            global.StateRegistry.register('specialPlaces', { version: 1, export: _exportState, import: _importState, reset: _resetState });
        } catch (e) { console.warn('[特殊地点] 存档登记失败:', e); }
    }

    if (global.timeSystem && typeof global.timeSystem.onNewDaySubscribe === 'function') {
        global.timeSystem.onNewDaySubscribe(tickDay);
    }

    var api = {
        PLACE_DEFS: PLACE_DEFS,
        ABANDON_AFTER_DAYS: ABANDON_AFTER_DAYS,
        STATUS: STATUS,
        defs: defs,
        list: list,
        listForRegion: listForRegion,
        isKnown: isKnown,
        statusOf: statusOf,
        daysToAbandon: daysToAbandon,
        discover: discover,
        rollRumor: rollRumor,
        reportVictory: reportVictory,
        assault: assault,
        forget: forget,
        openDetail: openDetail,
        renderRegionRows: renderRegionRows,
        tickDay: tickDay
    };
    global.SpecialPlaces = api;
    global.XianXia = global.XianXia || {};
    global.XianXia.SpecialPlaces = api;
})(typeof window !== 'undefined' ? window : this);
