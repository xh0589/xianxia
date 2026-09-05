/**
 * player-rumor.js — v20.6 闭环①③ 玩家进入传闻网 + 传闻改变行为
 *
 * 此前 NPC 对你的态度只来自全局声望+各自好感；本层让"你做的事"进传闻池流传，
 * 每个 NPC 按自己听说的版本、自己性格的可信度形成**各自不同**的印象：
 *   - pushDeed：把玩家事迹（善/劣）写成传闻条目（复用 NPCLife.pushNote 真源）
 *   - 订阅既有事件：任务完成（口碑）、境界突破（天象瞒不住）自动成名/成臭
 *   - trustFactor：实感(S)信所见、思考(T)多怀疑、果断(A)不易带节奏、起伏(T)易信
 *   - playerRumorAttitude：该 NPC 听过几条关于你的定性传闻 × 他肯信几分
 *   - 坏名声有牙齿：婉拒同行；面板展示「他们耳朵里你的风声」
 *
 * 真源纪律：传闻=RUMOR_LOG（含 mood 定性），听闻清单=既有 heard，零新存档字段。
 */
(function (global) {
    'use strict';

    var VERSION = 1;

    function num(v) { return typeof v === 'number' && isFinite(v) ? v : 0; }
    function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
    function escapeHtml(s) {
        if (s == null) return '';
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function charData() { return global.currentCharData || {}; }
    function playerRef() {
        var cd = charData();
        return { id: 'player', name: cd.name || '无名散修', location: cd.location || null };
    }
    function dayNow() {
        var ts = global.timeSystem;
        if (ts && typeof ts.getAbsoluteDay === 'function') {
            try { return ts.getAbsoluteDay(); } catch (e) {}
        }
        return (ts && ts.gameTime && ts.gameTime.currentDay) || 1;
    }

    // ============ 玩家事迹进传闻池 ============
    function pushDeed(mood, summary) {
        if (!global.NPCLife || typeof global.NPCLife.pushNote !== 'function' || !summary) return null;
        return global.NPCLife.pushNote(dayNow(), playerRef(), 'deed', summary, mood);
    }

    function hookEvents() {
        if (!global.EventBus || typeof global.EventBus.on !== 'function') return;
        global.EventBus.on('quest:completed', function (e) {
            var name = (e && (e.questName || e.name || e.title)) || '一桩委托';
            pushDeed('good', '你践约完成了「' + name + '」，说话是有分量的');
        });
        global.EventBus.on('cultivation:breakthrough', function (e) {
            var realm = (e && e.realm) || charData().realm || '新境';
            pushDeed('good', '你突破' + realm + '时天象异动，瞒不住人');
        });
    }

    // ============ 各自耳中的你 ============
    function npcOf(id) {
        return (global.npcManager && typeof global.npcManager.getNPC === 'function') ? (global.npcManager.getNPC(id) || null) : null;
    }
    function p16of(npc) {
        if (!npc) return null;
        if (npc.personality16) return npc.personality16;
        if (global.Personality16 && typeof global.Personality16.ensure === 'function') {
            try { return global.Personality16.ensure(npc); } catch (e) { return null; }
        }
        return null;
    }
    // 肯信几分：眼见为实者易信所见传闻，冷静算计者多怀疑，沉稳者不易带节奏
    function trustFactor(npc) {
        var p = p16of(npc);
        var t = 0.5;
        if (!p) return t;
        t += num(p.energy) > 0 ? 0.15 : -0.10;
        t += num(p.nature) < 0 ? -0.20 : 0.10;
        t += num(p.identity) > 0 ? 0.15 : -0.15;
        return clamp(t, 0.15, 0.9);
    }
    // 该 NPC 听过哪些关于玩家的定性传闻（经 heard 清单在传闻池里追溯）
    function knownPlayerRumors(npcId) {
        var out = [];
        var api = global.NPCLife;
        if (!api || typeof api._store !== 'function' || typeof api.getRumorLog !== 'function') return out;
        var st = (api._store() || {})[npcId];
        if (!st || !Array.isArray(st.heard)) return out;
        var logs = api.getRumorLog(50) || [];
        var byId = {};
        for (var i = 0; i < logs.length; i++) if (logs[i] && logs[i].id) byId[logs[i].id] = logs[i];
        // 变体的 npcId 是转述者；话题人物要沿 variantOf 回溯到原闻才作数
        function subjectOf(r) {
            var guard = {};
            while (r && r.variantOf && byId[r.variantOf] && !guard[r.variantOf]) {
                guard[r.variantOf] = 1;
                r = byId[r.variantOf];
            }
            return r;
        }
        for (var h = 0; h < st.heard.length; h++) {
            var heardItem = byId[st.heard[h]];
            if (!heardItem) continue;
            var subj = subjectOf(heardItem);
            if (subj && subj.npcId === 'player' && subj.mood && subj.mood !== 'neutral') out.push(heardItem);
        }
        return out;
    }
    // 印象 = Σ(善恶定性 × 他肯信几分)，归一到 [-1,1]
    function playerRumorAttitude(npcId) {
        var npc = npcOf(npcId);
        if (!npc) return 0;
        var t = trustFactor(npc);
        var sum = 0;
        var rumors = knownPlayerRumors(npcId);
        for (var i = 0; i < rumors.length; i++) {
            sum += (rumors[i].mood === 'good' ? 1 : -1) * t;
        }
        return clamp(sum, -3, 3) / 3;
    }

    // ============ 面板：他们耳朵里你的风声 ============
    function getPlayerRumorSection(npc, npcId) {
        var rumors = knownPlayerRumors(npcId);
        if (!rumors.length) return '';
        var att = playerRumorAttitude(npcId);
        var html = '<div class="mt-3 border-t border-gray-700 pt-2">' +
            '<p class="text-sm font-bold text-gray-300 mb-2">👂 他们耳朵里你的风声</p>';
        var show = Math.min(3, rumors.length);
        for (var i = 0; i < show; i++) {
            var r = rumors[i];
            html += '<p class="text-xs ' + (r.mood === 'good' ? 'text-green-400' : 'text-red-400') + '">' +
                (r.distorted ? '🌀 ' : '') + escapeHtml(r.summary) + '</p>';
        }
        if (att <= -0.4) html += '<p class="text-xs text-gray-500">他看你的眼神，凉。</p>';
        else if (att >= 0.4) html += '<p class="text-xs text-gray-500">他看你的眉眼，是松的。</p>';
        html += '</div>';
        return html;
    }

    // ============ 坏名声有牙齿：同行婉拒 ============
    function wrapRecruit() {
        if (typeof global.recruitNPCFromDialog !== 'function' || global.recruitNPCFromDialog.__prWrapped) return;
        var orig = global.recruitNPCFromDialog;
        global.recruitNPCFromDialog = function (npcId) {
            var att = playerRumorAttitude(npcId);
            if (att <= -0.55) {
                var npc = npcOf(npcId);
                if (global.showMessage) {
                    global.showMessage('「' + ((npc && npc.name) || '那人') + '」听过你一些事，婉拒了同行——名声可以慢慢洗。', 'warning');
                }
                return;
            }
            return orig(npcId);
        };
        global.recruitNPCFromDialog.__prWrapped = true;
    }

    hookEvents();
    // recruitNPCFromDialog 由 npc-system 定义，若尚未加载则 DOMContentLoaded 后补包
    if (typeof global.recruitNPCFromDialog === 'function') wrapRecruit();
    else if (global.document && global.document.addEventListener) {
        global.document.addEventListener('DOMContentLoaded', wrapRecruit);
    }

    var api = {
        version: VERSION,
        pushDeed: pushDeed,
        trustFactor: trustFactor,
        knownPlayerRumors: knownPlayerRumors,
        playerRumorAttitude: playerRumorAttitude,
        getPlayerRumorSection: getPlayerRumorSection
    };
    global.PlayerRumor = api;
    global.XianXia = global.XianXia || {};
    global.XianXia.PlayerRumor = api;
    global.playerPushDeed = pushDeed;
    global.playerRumorAttitude = playerRumorAttitude;
    global.getPlayerRumorSection = getPlayerRumorSection;

    console.log('[PlayerRumor] initialized v' + VERSION);
})(typeof window !== 'undefined' ? window : this);
