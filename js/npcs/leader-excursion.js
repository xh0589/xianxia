// ==================== v22.1 江湖行：掌门下山游历 + 外院求见 ====================
// 问题：36 条恋爱线主角全是各派掌门，但未入派的游客在门派里够不到任何活人——
// 见不到人，v22.0 打通的「交谈即入戏」对非弟子等于零。
// 方案（用户确认）：
//   ① 掌门按 deterministic 日程下山游历：每隔 5~7 天去本区域一座城市盘桓一日，
//      出现在城中人物名录里，游客可自然攀谈结识（事件本体仍锁在门派里，城里只社交不响戏）；
//   ② 城里相识、好感到线，她会递话「你若来我门派，报我名讳便是」——写入 NPC 旗随存档走；
//   ③ 外院新增「求见掌门」：应约（有旗）直接通传；无约则走递帖——侠名远播（≥100）
//      或逢开放日（每月初一、十五）执事才肯通传，平日回绝「掌门清修」；
//   ④ 掌门在山下时，外院/大殿都留「外出游历」的话头并提示去向——把玩家引到城里去遇。
// 日程不另设存储：由「绝对日 + npcId 哈希」纯推导，读档天然一致，跨日钩子校正位置。
'use strict';

(function () {
    var INVITE_FLAG = 'sect_invite';
    var INVITE_AFFECTION = 40;      // 城里相识后好感到线才递话
    var FAME_AUDIENCE = 100;        // 侠名远播可直接递帖
    var CITY_CAP = 2;               // 同城同日游历的掌门上限，避免菜市场化

    // ---------- 工具 ----------
    function hashStr(s) {
        var h = 5381;
        for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
        return h >>> 0;
    }
    function today() {
        var t = window.timeSystem;
        if (t && t.getAbsoluteDay) { try { var d = t.getAbsoluteDay(); if (d) return d; } catch (e) {} }
        if (t && t.gameTime && t.gameTime.currentDay) return t.gameTime.currentDay;
        return 1;
    }
    function dayOfMonth(day) { return ((day - 1) % 30) + 1; }
    function leaderSectName(npcId) {
        return npcId.indexOf('sect_leader_') === 0 ? npcId.slice('sect_leader_'.length) : null;
    }
    // 恋爱线掌门全集：从个人事件池推导（有线才下山，无线掌门不打扰）
    function romanceLeaderIds() {
        var ids = {};
        var pool = window.NPC_PERSONAL_EVENTS || {};
        for (var k in pool) {
            var ev = pool[k];
            if (ev && ev.npcId && ev.npcId.indexOf('sect_leader_') === 0) ids[ev.npcId] = 1;
        }
        return Object.keys(ids).sort();
    }
    // 每位掌门的游历日程参数（纯推导，无随机无存储）
    function excursionParams(npcId) {
        var h = hashStr(npcId);
        return {
            period: 5 + (h % 3),          // 5~7 天一轮
            offset: h % 97,               // 错开各家出门的日子
            cityPick: h                   // 选城用
        };
    }
    function isAwayDay(npcId, day) {
        var p = excursionParams(npcId);
        return (day + p.offset) % p.period === 0;
    }
    function excursionCity(sectName) {
        var sect = (window.sectsData || {})[sectName];
        if (!sect) return null;
        var region = (window.mapData || {})[sect.location];
        var cities = region && region.cities || [];
        if (!cities.length) return null;
        return cities[hashStr(sectName + '|city') % cities.length];
    }

    // ---------- 日程同步 ----------
    var syncedDay = -1;
    function syncLeaderExcursions() {
        var day = today();
        if (!window.npcManager || typeof window.npcManager.getNPC !== 'function') return;
        var ids = romanceLeaderIds();
        // 先算「今日想下山」的名单，按同城限流（确定性排序，与读取顺序无关）
        var want = [];
        for (var i = 0; i < ids.length; i++) {
            var npc = window.npcManager.getNPC(ids[i]);
            if (!npc || npc.isDead || npc.isMissing) continue;
            if (!isAwayDay(ids[i], day)) continue;
            var city = excursionCity(leaderSectName(ids[i]));
            if (city) want.push({ id: ids[i], city: city, h: hashStr(ids[i] + day) });
        }
        want.sort(function (a, b) { return a.h - b.h || (a.id < b.id ? -1 : 1); });
        var cityCount = {}, away = {};
        for (var j = 0; j < want.length; j++) {
            var w = want[j];
            if ((cityCount[w.city] || 0) >= CITY_CAP) continue; // 同城已满，今日留守
            cityCount[w.city] = (cityCount[w.city] || 0) + 1;
            away[w.id] = w.city;
        }
        // 落位：该走的走、该回的回（位置随 NPC 存档，跨日由本函数校正）
        for (var q = 0; q < ids.length; q++) {
            var n = window.npcManager.getNPC(ids[q]);
            if (!n || n.isDead || n.isMissing) continue;
            var home = leaderSectName(ids[q]);
            if (away[ids[q]]) { if (n.location !== away[ids[q]]) n.location = away[ids[q]]; }
            else if (n.location !== home && (window.sectsData || {})[home]) { n.location = home; }
        }
        syncedDay = day;
    }
    function ensureExcursionSynced() {
        if (syncedDay !== today()) {
            try { syncLeaderExcursions(); } catch (e) { console.warn('[游历] 日程同步失败:', e); }
        }
    }
    function isLeaderAway(sectName) {
        ensureExcursionSynced();
        var npc = window.npcManager && window.npcManager.getNPC ? window.npcManager.getNPC('sect_leader_' + sectName) : null;
        if (!npc || npc.isDead) return false;
        return npc.location !== sectName;
    }
    function leaderAwayCity(sectName) {
        ensureExcursionSynced();
        var npc = window.npcManager && window.npcManager.getNPC ? window.npcManager.getNPC('sect_leader_' + sectName) : null;
        if (!npc || npc.location === sectName) return null;
        return npc.location;
    }

    // ---------- 邀约：城里相识、情分到线，她递话 ----------
    function tryGrantSectInvitation(npcId) {
        var sectName = leaderSectName(npcId);
        if (!sectName) return false;
        var pool = window.NPC_PERSONAL_EVENTS || {};
        var hasLine = false;
        for (var k in pool) { if (pool[k] && pool[k].npcId === npcId) { hasLine = true; break; } }
        if (!hasLine) return false;
        var npc = window.npcManager && window.npcManager.getNPC ? window.npcManager.getNPC(npcId) : null;
        if (!npc || npc.isDead || !window.currentCharData) return false;
        if (npc.hasFlag && npc.hasFlag(INVITE_FLAG)) return false;
        if (!(npc.memory && (npc.memory.firstMet || (npc.memory.meetCount || 0) > 0))) return false;
        var aff = (npc.relationship && npc.relationship.affection) || 0;
        if (aff < INVITE_AFFECTION) return false;
        var playerLoc = window.currentCharData.location || '';
        // 只在下山游历途中递话：人在城里与你相识，才邀你日后上山寻她
        if (!playerLoc || playerLoc === sectName || playerLoc !== npc.location) return false;
        if (npc.setFlag) npc.setFlag(INVITE_FLAG);
        var line = npc.name + ' 略一沉吟，递话道：「江湖路远，聚散无常。你若日后路过' + sectName + '，报我名讳，门中自有人引你入内。」';
        if (typeof showMessage === 'function') showMessage('💌 ' + line, 'success');
        return true;
    }

    // ---------- 外院「求见掌门」（游客） ----------
    function audienceGranted(sectName, reason) {
        var leaderId = 'sect_leader_' + sectName;
        var npc = window.npcManager && window.npcManager.getNPC ? window.npcManager.getNPC(leaderId) : null;
        if (!npc) { if (typeof showMessage === 'function') showMessage('掌门不在殿中。', 'info'); return; }
        try { if (window.timeSystem && window.timeSystem.advanceTime) window.timeSystem.advanceTime(15, '在迎客堂候见'); } catch (e) {}
        var flavors = {
            invite: '执事弟子验过你带来的话，神色顿改：「原来是掌门的朋友，请——」迎客堂内，' + npc.name + ' 已在那里等你。',
            fame: '你的名帖递进去，不过一盏茶工夫，执事弟子快步出来：「掌门有请！」——你的侠名，已先你一步进了山门。',
            openday: '今日山门大开，香客络绎。执事弟子收了名帖通传，片刻后侧门开启：「掌门在迎客堂见你。」'
        };
        if (typeof showMessage === 'function') showMessage('👑 ' + (flavors[reason] || flavors.openday), 'info');
        if (typeof window.showNPCDialog === 'function') window.showNPCDialog(leaderId);
    }
    function refuseAudience(sectName) {
        try { if (window.timeSystem && window.timeSystem.advanceTime) window.timeSystem.advanceTime(10, '递帖求见'); } catch (e) {}
        if (typeof showMessage === 'function') {
            showMessage('🚪 执事弟子收了名帖进去，半晌出来，拱手摇头：「掌门清修，外客不奉告。」——看来要么侠名不够响亮，要么来的不是时候。', 'warning');
        }
    }
    function renderSectLeaderAudience(sectName, isMember) {
        if (isMember) return ''; // 弟子自有内院名录与大殿，游客才走这条路
        var sect = (window.sectsData || {})[sectName];
        if (!sect) return '';
        ensureExcursionSynced();
        var leaderId = 'sect_leader_' + sectName;
        var npc = window.npcManager && window.npcManager.getNPC ? window.npcManager.getNPC(leaderId) : null;
        if (!npc || npc.isDead) return '';
        var hasLine = false;
        var pool = window.NPC_PERSONAL_EVENTS || {};
        for (var k in pool) { if (pool[k] && pool[k].npcId === leaderId) { hasLine = true; break; } }
        if (!hasLine) return '';

        var html = '<div class="bg-gray-800/50 p-3 rounded border border-purple-700">' +
            '<div class="flex items-center gap-2 mb-1">' +
            '<span class="text-lg">👑</span>' +
            '<div class="flex-1"><p class="font-bold text-sm text-white">求见掌门 · ' + npc.name + '</p>' +
            '<p class="text-xs text-gray-400">外院访客止步，但掌门并非永不可见</p></div>' +
            '</div>';

        if (npc.location !== sectName) {
            // 下山游历中：给去向的话头，把玩家引到城里去偶遇
            html += '<p class="text-xs text-purple-300 mt-1">执事弟子：「掌门前日下山游历去了。」' +
                (npc.location ? '<span class="text-gray-400">（有香客说在' + npc.location + '见过她）</span>' : '') + '</p>';
            return html + '</div>';
        }
        var fame = (window.currentCharData && window.currentCharData.fame) || 0;
        var dom = dayOfMonth(today());
        var isOpenDay = (dom === 1 || dom === 15);
        if (npc.hasFlag && npc.hasFlag(INVITE_FLAG)) {
            html += '<p class="text-xs text-green-400 mt-1">你记得她递过的话——报她名讳，门中自有人引你入内。</p>' +
                '<button onclick="window.grantSectAudience(\'' + sectName + '\',\'invite\')" class="mt-1 bg-purple-600 hover:bg-purple-500 text-white px-2 py-0.5 rounded text-xs font-bold">💌 应约求见</button>';
        } else if (fame >= FAME_AUDIENCE) {
            html += '<p class="text-xs text-yellow-400 mt-1">你的侠名已传到此地——执事弟子看你的眼神都客气三分。</p>' +
                '<button onclick="window.grantSectAudience(\'' + sectName + '\',\'fame\')" class="mt-1 bg-yellow-600 hover:bg-yellow-500 text-gray-900 px-2 py-0.5 rounded text-xs font-bold">📜 递名帖求见</button>';
        } else if (isOpenDay) {
            html += '<p class="text-xs text-blue-300 mt-1">今日恰逢初一/十五开放日，山门大开，外客亦可递帖求见。</p>' +
                '<button onclick="window.grantSectAudience(\'' + sectName + '\',\'openday\')" class="mt-1 bg-blue-600 hover:bg-blue-500 text-white px-2 py-0.5 rounded text-xs font-bold">📜 开放日递帖</button>';
        } else {
            html += '<p class="text-xs text-gray-500 mt-1">执事弟子挡在廊下：「掌门清修，外客不奉告。」</p>' +
                '<p class="text-xs text-gray-600 mt-1">（侠名 ≥ ' + FAME_AUDIENCE + '，或逢每月初一、十五开放日，或先在山下与她结个善缘）</p>' +
                '<button onclick="window.refuseSectAudience(\'' + sectName + '\')" class="mt-1 bg-gray-600 hover:bg-gray-500 text-white px-2 py-0.5 rounded text-xs">📜 硬着头皮递帖</button>';
        }
        return html + '</div>';
    }

    // ---------- 接线 ----------
    if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
        window.timeSystem.onNewDaySubscribe(function () {
            try { syncLeaderExcursions(); } catch (e) { console.warn('[游历] 跨日同步失败:', e); }
        });
    }

    window.syncLeaderExcursions = syncLeaderExcursions;
    window.ensureExcursionSynced = ensureExcursionSynced;
    window.isLeaderAway = isLeaderAway;
    window.leaderAwayCity = leaderAwayCity;
    window.tryGrantSectInvitation = tryGrantSectInvitation;
    window.renderSectLeaderAudience = renderSectLeaderAudience;
    window.grantSectAudience = audienceGranted;
    window.refuseSectAudience = refuseAudience;

    console.log('[游历] v22.1 接线完成：掌门下山日程 + 外院求见');
})();
