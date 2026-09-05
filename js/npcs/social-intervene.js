/**
 * social-intervene.js — v20.5 玩家介入 NPC 恩怨（大纲 M2）
 *
 * 两条介入链，全部落在既有真源上，零新存档字段：
 *   居中调停：双方须与玩家同地 + 请酒灵石 + 半日功夫 → adjustNPCRelationshipPair 降敌意；
 *             成则双方敬你，败则两头不讨好（现实式后果，无"次数已用完"）。
 *   传闻操纵：添油加醋（挑 listener 对 subject 的恶感，有败露风险——败露反噬你名声）
 *             / 澄清辟谣（花钱花时辰买信任，成功率吃口才）。
 *
 * 概率输入：口才 lifeSkills['口才'] / 声望 fame / 双方对你的好感 relationship.affection
 *           / 五维相性 P16Driver.compat（双强对立更难劝和）。
 * rng 可注入（opts.randomSource）供回归复现。
 *
 * 加载顺序：personality-driver.js 之后。
 */
(function (global) {
    'use strict';

    var VERSION = 1;

    function rngOf(opts) { return (opts && typeof opts.randomSource === 'function') ? opts.randomSource : Math.random; }
    function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
    function msg(t, kind) { if (global.showMessage) global.showMessage(t, kind || 'info'); }
    function log(t, kind) { if (global.gameLog && global.gameLog.add) global.gameLog.add(t, kind || 'info'); }
    function escapeHtml(s) {
        if (s == null) return '';
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function getNpc(id) {
        return (global.npcManager && typeof global.npcManager.getNPC === 'function') ? global.npcManager.getNPC(id) : null;
    }
    function playerLoc() { return (global.currentCharData && global.currentCharData.location) || null; }
    function pairOf(a, b) {
        var rel = a && a.npcRelationships ? a.npcRelationships[b.id] : null;
        if (!rel) return null;
        return { relation: rel.relation || String(rel), strength: Number(rel.strength) || 0 };
    }
    function playerAffinityWith(npc) {
        return (npc && npc.relationship && Number(npc.relationship.affection)) || 0;
    }
    function deduct(cost) {
        if (global.DataManager && typeof global.DataManager.deductSpiritStones === 'function') {
            if (!global.DataManager.deductSpiritStones(cost)) return false;
        }
        return true;
    }
    function spendTime(minutes, reason) {
        if (global.timeSystem && typeof global.timeSystem.advanceTime === 'function') {
            try { global.timeSystem.advanceTime(minutes, reason); } catch (e) {}
        }
    }

    // ============ 居中调停 ============
    // 对话面板用：此人有哪些"就在现场"的仇家可劝和
    function mediationTargets(npc) {
        var out = [];
        var pl = playerLoc();
        if (!npc || !npc.npcRelationships || !pl || npc.location !== pl) return out;
        for (var id in npc.npcRelationships) {
            var rel = npc.npcRelationships[id];
            var type = rel && (rel.relation || rel);
            if (type !== 'enemy') continue;
            var other = getNpc(id);
            if (!other || other.isDead || other.isMissing) continue;
            if (other.location !== pl) continue; // 三方须同地：调解是当面事
            out.push({ npcId: id, npcName: other.name, strength: Math.max(20, Number(rel.strength) || 50) });
        }
        return out;
    }

    function canMediate(aId, bId) {
        var a = getNpc(aId), b = getNpc(bId);
        if (!a || !b) return { ok: false, reason: '当事人不在江湖上' };
        if (a.isDead || b.isDead || a.isMissing || b.isMissing) return { ok: false, reason: '当事人不在了' };
        var pair = pairOf(a, b);
        if (!pair || pair.relation !== 'enemy') return { ok: false, reason: '「' + a.name + '」与「' + b.name + '」并无仇怨，无需调解' };
        var pl = playerLoc();
        if (!pl || a.location !== pl || b.location !== pl) return { ok: false, reason: '调停须三方同地，当面把话说开' };
        return { ok: true, pair: pair, a: a, b: b };
    }

    /**
     * 居中调停。成本：灵石 50（设酒）+ 120 分钟。无每日配额——每次都要再掏一次钱。
     * @returns {Object|null} {success, prob} / false=条件不满足未消耗
     */
    function mediateNpcs(aId, bId, opts) {
        var gate = canMediate(aId, bId);
        if (!gate.ok) { msg(gate.reason, 'warning'); return false; }
        if (!deduct(50)) { msg('居中调停需备下 50 灵石请酒，你手头灵石不够。', 'warning'); return false; }
        spendTime(120, '设酒居中调停');
        var a = gate.a, b = gate.b, s = gate.pair.strength || 50;
        var cd = global.currentCharData || {};
        var speech = (cd.lifeSkills && Number(cd.lifeSkills['口才'])) || 0;
        var prob = 30 + speech * 0.25 + (playerAffinityWith(a) + playerAffinityWith(b)) * 0.15
            + (Number(cd.fame) || 0) * 0.02 - s * 0.25;
        if (global.P16Driver && typeof global.P16Driver.compat === 'function') {
            var compatScore = global.P16Driver.compat(a, b);
            if (compatScore < 0) prob -= Math.abs(compatScore) * 0.15; // 性子根本不对付，劝和更难
        }
        prob = Math.round(clamp(prob, 5, 85));
        var roll = rngOf(opts)() * 100;
        if (roll < prob) {
            if (typeof global.adjustNPCRelationshipPair === 'function') {
                global.adjustNPCRelationshipPair(a, b, s, {}); // 敌意清零转普通
            }
            if (typeof a.changeAffection === 'function') a.changeAffection(5);
            if (typeof b.changeAffection === 'function') b.changeAffection(5);
            if (typeof global.addFame === 'function') global.addFame(3);
            // v20.6 闭环④：恩怨化解让人心软
            if (typeof global.driftPersonality === 'function') {
                try {
                    global.driftPersonality(a, 'nature', 4, '恩怨化解，心软了几分');
                    global.driftPersonality(b, 'nature', 4, '恩怨化解，心软了几分');
                } catch (e) {}
            }
            msg('🕊️ 一杯酒说尽两家事，「' + a.name + '」与「' + b.name + '」终于握手言和，江湖上记你一记调停之名。', 'success');
            log('你居中调停了「' + a.name + '」与「' + b.name + '」的恩怨，成。', 'info');
            return { success: true, prob: prob };
        }
        // 失败：面子上各让一分（酒没白喝），但两人把账算在你头上
        if (typeof global.adjustNPCRelationshipPair === 'function') {
            global.adjustNPCRelationshipPair(a, b, 3, {});
        }
        if (typeof a.changeAffection === 'function') a.changeAffection(-3);
        if (typeof b.changeAffection === 'function') b.changeAffection(-3);
        // v20.6 闭环④：劝和不成反成笑话，看人更冷
        if (typeof global.driftPersonality === 'function') {
            try {
                global.driftPersonality(a, 'nature', -4, '调停失败，看人更冷了些');
                global.driftPersonality(b, 'nature', -4, '调停失败，看人更冷了些');
            } catch (e) {}
        }
        msg('🍷 酒过三巡不欢而散——「' + a.name + '」与「' + b.name + '」各瞪你一眼，把这趟糗账记在你头上。', 'warning');
        return { success: false, prob: prob };
    }

    // ============ 传闻操纵 ============
    // 对话面板用：传闻池里有哪些"此人以外"的话题人物可添话/澄清
    function rumorTopics(listenerNpc) {
        var out = [];
        if (!listenerNpc || !global.NPCLife || typeof global.NPCLife.getRumorLog !== 'function') return out;
        if (listenerNpc.location !== playerLoc()) return out; // 递话是当面事
        var seen = {};
        var log1 = global.NPCLife.getRumorLog(30) || [];
        for (var i = 0; i < log1.length; i++) {
            var r = log1[i];
            var sid = r.npcId;
            if (!sid || sid === listenerNpc.id || seen[sid]) continue;
            var subject = getNpc(sid);
            if (!subject || subject.isDead || subject.isMissing) continue;
            seen[sid] = true;
            out.push({ npcId: sid, npcName: subject.name, distorted: !!r.distorted });
            if (out.length >= 3) break;
        }
        return out;
    }

    /**
     * 递话。mode: 'stoke' 添油加醋 | 'clear' 澄清辟谣。成本：灵石 20 + 60 分钟。
     * @returns {Object|null} {success, exposed} / false=条件不满足未消耗
     */
    function playRumorAction(listenerId, subjectId, mode, opts) {
        if (mode !== 'stoke' && mode !== 'clear') return false;
        var listener = getNpc(listenerId), subject = getNpc(subjectId);
        if (!listener || !subject || listener.id === subject.id) { msg('话不递到本人头上。', 'warning'); return false; }
        if (listener.isDead || subject.isDead) { msg('当事人不在了。', 'warning'); return false; }
        var pl = playerLoc();
        if (!pl || listener.location !== pl) { msg('递话须与对方同地，托人传话不像话。', 'warning'); return false; }
        var pair = pairOf(listener, subject);
        if (mode === 'clear' && (!pair || pair.relation !== 'enemy')) {
            msg('「' + listener.name + '」与「' + subject.name + '」并无仇怨，澄清无从谈起。', 'info');
            return false;
        }
        if (!deduct(20)) { msg('邀人吃茶递话需 20 灵石茶资，你手头灵石不够。', 'warning'); return false; }
        spendTime(60, '邀人吃茶递话');
        var cd = global.currentCharData || {};
        var speech = (cd.lifeSkills && Number(cd.lifeSkills['口才'])) || 0;

        if (mode === 'stoke') {
            // 假话必达（信息不对称天然成立），代价在败露风险
            var s0 = pair && pair.relation === 'enemy' ? (Number(pair.strength) || 30) + 25 : 35;
            if (typeof global.setNPCRelationshipPair === 'function') {
                global.setNPCRelationshipPair(listener, subject, 'enemy', clamp(s0, 0, 100));
            }
            if (typeof listener.changeAffection === 'function') listener.changeAffection(2);
            var risk = clamp(35 - speech * 0.3, 5, 60);
            var exposed = rngOf(opts)() * 100 < risk;
            if (exposed) {
                if (typeof subject.changeAffection === 'function') subject.changeAffection(-10);
                if (typeof global.addFame === 'function') global.addFame(-5);
                // v20.6 闭环④：遭人暗算，心思重了
                if (typeof global.driftPersonality === 'function') {
                    try { global.driftPersonality(subject, 'identity', 4, '暗箭难防，心思重了'); } catch (e) {}
                }
                msg('🐍 话是递过去了，可「' + subject.name + '」不知从哪儿听说是你在中间搬弄——名声有了裂纹。', 'danger');
                log('你向「' + listener.name + '」添油加醋说了「' + subject.name + '」的坏话，败露。', 'warning');
            } else {
                msg('🐍 几杯茶下肚，「' + listener.name + '」记下了你转述的那番话，看「' + subject.name + '」的眼神已经变了。', 'info');
                log('你向「' + listener.name + '」添油加醋说了「' + subject.name + '」的坏话，无人察觉。', 'info');
            }
            return { success: true, exposed: exposed };
        }

        // clear：澄清有成败——空口白牙凭什么让人改想法
        var prob = clamp(70 + speech * 0.2, 40, 95);
        if (rngOf(opts)() * 100 < prob) {
            if (typeof global.adjustNPCRelationshipPair === 'function') {
                global.adjustNPCRelationshipPair(listener, subject, Math.max(1, (pair.strength || 30) - 10), {});
            }
            if (typeof subject.changeAffection === 'function') subject.changeAffection(8);
            if (typeof listener.changeAffection === 'function') listener.changeAffection(3);
            msg('🍵 你把前因后果掰开揉碎讲清，「' + listener.name + '」长出一口气：「原是我错怪了他。」', 'success');
            return { success: true, exposed: false };
        }
        if (typeof subject.changeAffection === 'function') subject.changeAffection(-3);
        msg('🍵 话到一半被顶回来，「' + subject.name + '」冷笑：「他亲口来说我都不信，何况借你的嘴。」', 'warning');
        return { success: false, exposed: false };
    }

    // ============ 对话面板注入（镜像个人事件栏，远程给 需亲至 锁定） ============
    function getInterventionButtons(npc, npcId, isRemote) {
        // 远程：有仇家可看得到但够不着 → 给"需亲至"锁定条（个人事件栏同款交互语言）
        if (isRemote) {
            var hasEnemy = false;
            if (npc && npc.npcRelationships) {
                for (var eid in npc.npcRelationships) {
                    var er = npc.npcRelationships[eid];
                    if (er && (er.relation || er) === 'enemy') { hasEnemy = true; break; }
                }
            }
            if (!hasEnemy) return '';
            return '<div class="mt-3 border-t border-gray-700 pt-2">' +
                '<p class="text-sm font-bold text-gray-300 mb-2">⚖️ 介入恩怨</p>' +
                '<p class="text-xs text-gray-500">📍 调停与递话都需亲至当面，隔空说不上话。</p></div>';
        }
        var targets = mediationTargets(npc);
        var topics = rumorTopics(npc);
        if (!targets.length && !topics.length) return '';
        var html = '<div class="mt-3 border-t border-gray-700 pt-2">' +
            '<p class="text-sm font-bold text-gray-300 mb-2">⚖️ 介入恩怨</p>';
        for (var i = 0; i < targets.length; i++) {
            var t = targets[i];
            html += '<button onclick="SocialIntervene.mediateNpcs(\'' + escapeHtml(npcId) + '\',\'' + escapeHtml(t.npcId) + '\')" ' +
                'class="w-full bg-emerald-800 hover:bg-emerald-700 text-white text-xs rounded p-2 mb-1">' +
                '🕊️ 居中调停：劝「' + escapeHtml(npc.name) + '」与「' + escapeHtml(t.npcName) + '」和解（耗灵石50/半日）</button>';
        }
        for (var j = 0; j < topics.length; j++) {
            var tp = topics[j];
            html += '<div class="flex gap-1 mb-1">' +
                '<button onclick="SocialIntervene.playRumorAction(\'' + escapeHtml(npcId) + '\',\'' + escapeHtml(tp.npcId) + '\',\'stoke\')" ' +
                'class="flex-1 bg-red-900 hover:bg-red-800 text-white text-xs rounded p-2">🐍 对「' + escapeHtml(tp.npcName) + '」添油加醋</button>' +
                '<button onclick="SocialIntervene.playRumorAction(\'' + escapeHtml(npcId) + '\',\'' + escapeHtml(tp.npcId) + '\',\'clear\')" ' +
                'class="flex-1 bg-sky-900 hover:bg-sky-800 text-white text-xs rounded p-2">🍵 为其澄清辟谣</button></div>';
        }
        html += '</div>';
        return html;
    }

    var api = {
        version: VERSION,
        mediationTargets: mediationTargets,
        canMediate: canMediate,
        mediateNpcs: mediateNpcs,
        rumorTopics: rumorTopics,
        playRumorAction: playRumorAction,
        getInterventionButtons: getInterventionButtons
    };

    global.SocialIntervene = api;
    global.XianXia = global.XianXia || {};
    global.XianXia.SocialIntervene = api;
    // 对话面板模板按全局函数名调用（与 getPersonalEventButtons 同款约定）
    global.getInterventionButtons = getInterventionButtons;

    console.log('[SocialIntervene] initialized v' + VERSION);
})(typeof window !== 'undefined' ? window : this);
