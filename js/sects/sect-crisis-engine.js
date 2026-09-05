// ==================== sect-crisis-engine.js - v20.49 门派大事引擎 ====================
// 把「随机门派大事件」从抽签重置为账目——四条铁律：
//   ① 事出有因：候选事件先过「因果门禁」，门禁全读真账——
//        强盛的门派不易被盗贼光顾（sectPowerValue 折战力 + 防务值）；
//        没敌对势力的门派不会被人上门报复（SECT_DIPLOMACY_STATE relation/conflicts 真账）；
//        库房满仓出不了「库房见底」，士气高昂出不了「弟子出走」。
//      没有过门禁的事件不进候选池——没有因，不触发。
//   ② 有始有终：酝酿（迹象先行，可花钱防备消解）→ 爆发（当场抉择，2-3 条真选择）→ 余波（1-5 日日结，可提前了结）。
//   ③ 抉择有价：全部走统一结算（RewardService 优先，缺环境直改兜底），办砸真损。
//   ④ 世界连坐：外交账、命门档案、门派内部账（库存/士气）真读真写。
//
// 生命周期（每门独立）：
//   冷却 10-15 日 → 每日日结掷因果权重 → 酝酿 omen（2-4 日，迹象上内院面板）→
//   玩家可「着手防备」（花钱/出力，按档消解或降档）→ 到期转爆发 crisis（弹出抉择）→
//   抉择落账 → 余波 aftermath（每日生效，可了结）→ 档案记 scars（下次触发的因果之一）。
(function () {
    'use strict';

    var CRISIS_COOLDOWN_DAYS = 12;   // 每门大事冷却（10-15 日取中）
    var OMEN_DAYS = [2, 4];          // 酝酿时长区间
    var BASE_CHANCE = 0.34;          // 过冷却后每日出酝酿的基础概率（再乘因果权重）

    // ============ 真源读取 ============
    function _day() {
        try { return Number(window.getAbsoluteDay ? window.getAbsoluteDay() : (window.timeSystem && window.timeSystem.gameTime ? window.timeSystem.gameTime.currentDay : 0)) || 0; }
        catch (e) { return 0; }
    }

    function _internal(sectName) {
        try { return window.getSectInternal ? window.getSectInternal(sectName) : null; }
        catch (e) { return null; }
    }

    // 门派实力档（0-100）：文字档位折值 + 影响力/人手修正——盗贼/仇家门禁的尺子
    // 真账字段：sectPowerValue（巨擘100/大派70/…）+ SECT_INTERNAL.influence / .disciples
    function sectStrength(sectName) {
        var sect = (window.sectsData || {})[sectName] || {};
        var base = (typeof window.sectPowerValue === 'function') ? window.sectPowerValue(sect) : 40;
        var res = _internal(sectName) || {};
        var influence = Number(res.influence) || 0;
        var disciples = Number(res.disciples) || 0;
        return { power: base, influence: influence, disciples: disciples, total: base + Math.min(40, influence * 0.25 + disciples * 0.3) };
    }

    // 时令：山洪不下旱季，台风不扰冬海——天时族门禁的尺子
    function _season() {
        try { return (window.gameTime && window.gameTime.currentSeason) || (window.timeSystem && window.timeSystem.gameTime && window.timeSystem.gameTime.currentSeason) || 'spring'; }
        catch (e) { return 'spring'; }
    }
    function _month() {
        try { return Number(window.gameTime && window.gameTime.currentMonth) || 0; }
        catch (e) { return 0; }
    }

    // 外交账：最强的仇家与最亲的盟友（读真账，没有就是没有）
    function diplomacyOf(sectName) {
        var diplo = window.SECT_DIPLOMACY_STATE || {};
        var mine = diplo[sectName] || {};
        var foe = null, friend = null;
        Object.keys(mine).forEach(function (other) {
            var cell = mine[other] || {};
            var rel = Number(cell.relation) || 0;
            if (rel <= -40 && (!foe || rel < foe.relation)) foe = { name: other, relation: rel, conflicts: cell.conflicts || 0 };
            if (rel >= 60 && (!friend || rel > friend.relation)) friend = { name: other, relation: rel };
        });
        return { foe: foe, friend: friend };
    }

    // ============ 档案（随档走） ============
    var MEM = {}; // sectName -> { active:{stage,eventId,...}, aftermaths:[], scars:{}, lastCrisisDay, resolvedCount }

    function mem(sectName) {
        if (!MEM[sectName]) MEM[sectName] = { active: null, aftermaths: [], scars: {}, lastCrisisDay: -999, resolvedCount: 0 };
        return MEM[sectName];
    }

    // ============ 因果候选 ============
    // 每桩事件自带 causality(when)——返回 {ok, weight, reason}；ok=false 即被门禁挡下。
    function candidates(sectName, opts) {
        var pool = window.SECT_CRISIS_EVENTS || {};
        var profile = (window.getSectProfile || function () { return { weightMods: {} }; })(sectName);
        var internal = _internal(sectName) || {};
        var diplo = diplomacyOf(sectName);
        var strength = sectStrength(sectName);
        var out = [];
        Object.keys(pool).forEach(function (id) {
            var ev = pool[id];
            if (!ev || !ev.causality) return;
            var v = ev.causality({ sectName: sectName, profile: profile, internal: internal, diplo: diplo, strength: strength, scars: mem(sectName).scars, day: _day(), season: _season(), month: _month() });
            if (!v || !v.ok) return;
            var famW = (window.getSectFamilyWeight || function () { return 1; })(sectName, ev.family);
            var w = (Number(v.weight) || 1) * famW;
            if (w <= 0) return;
            out.push({ id: id, ev: ev, weight: w, reason: v.reason || '' });
        });
        return out;
    }

    function _pick(list) {
        var total = 0;
        list.forEach(function (c) { total += c.weight; });
        var r = Math.random() * total;
        for (var i = 0; i < list.length; i++) { r -= list[i].weight; if (r <= 0) return list[i]; }
        return list[list.length - 1];
    }

    // ============ 每日推进（日结钩子） ============
    function tickDay(sectName) {
        var m = mem(sectName);
        var today = _day();

        // 1) 余波结算
        for (var i = m.aftermaths.length - 1; i >= 0; i--) {
            var af = m.aftermaths[i];
            var evAf = ((window.SECT_CRISIS_EVENTS || {})[af.eventId] || {}).aftermath;
            if (evAf && typeof evAf.daily === 'function') { try { evAf.daily(sectName, af); } catch (e) {} }
            af.daysLeft -= 1;
            if (af.daysLeft <= 0) { m.aftermaths.splice(i, 1); }
        }

        // 2) 酝酿到期 → 爆发
        if (m.active && m.active.stage === 'omen') {
            m.active.daysLeft -= 1;
            if (m.active.daysLeft <= 0) { m.active.stage = 'crisis'; }
            return;
        }

        // 3) 冷却与出事概率
        if (m.active) return; // 爆发中不再出新事
        if (today - m.lastCrisisDay < CRISIS_COOLDOWN_DAYS) return;

        var list = candidates(sectName);
        if (!list.length) return; // 无因不出事——今日安静
        if (Math.random() > BASE_CHANCE) return;

        var pick = _pick(list);
        var omenDays = OMEN_DAYS[0] + Math.floor(Math.random() * (OMEN_DAYS[1] - OMEN_DAYS[0] + 1));
        m.active = {
            stage: 'omen',
            eventId: pick.id,
            reason: pick.reason,
            daysLeft: omenDays,
            prepared: 0
        };
    }

    // 防备：花钱出力，按档消解（resolved）或降档（hardened——爆发时惩罚减轻）
    function prepare(sectName, choiceIdx) {
        var m = mem(sectName);
        if (!m.active || m.active.stage !== 'omen') return { ok: false, msg: '并无异兆可防。' };
        var ev = (window.SECT_CRISIS_EVENTS || {})[m.active.eventId];
        var prep = ev && ev.omen && ev.omen.prepare;
        var opt = prep && prep.options ? prep.options[choiceIdx] : null;
        if (!opt) return { ok: false, msg: '防备无从下手。' };
        var pay = _settle(opt.cost || {});
        if (!pay.ok) return { ok: false, msg: pay.msg || '力有未逮，防备不成。' };
        m.active.prepared += (opt.strength || 1);
        var need = (ev.omen && ev.omen.prepareNeed) || 2;
        var msg = opt.reply || '防备已布置。';
        if (m.active.prepared >= need) {
            m.active = null;
            m.lastCrisisDay = _day(); // 消解也进冷却——祸事没发生，但人心也耗了
            m.resolvedCount += 1;
            return { ok: true, resolved: true, msg: msg };
        }
        return { ok: true, resolved: false, msg: msg };
    }

    // 爆发抉择：choiceIdx -> 结算 + 余波落账
    function resolve(sectName, choiceIdx) {
        var m = mem(sectName);
        if (!m.active || m.active.stage !== 'crisis') return { ok: false, msg: '并无急事待办。' };
        var ev = (window.SECT_CRISIS_EVENTS || {})[m.active.eventId];
        var ch = ev && ev.crisis && ev.crisis.choices ? ev.crisis.choices[choiceIdx] : null;
        if (!ch) return { ok: false, msg: '没有这条路。' };
        var pay = _settle(ch.cost || {});
        if (!pay.ok) return { ok: false, msg: pay.msg || '代价付不起，这条路走不通。' };
        var hardened = (m.active.prepared || 0) > 0; // 防备过：失败惩罚减半、成功率档位抬升
        var outcome = 'success';
        if (typeof ch.check === 'number') {
            var roll = Math.random() * 100;
            var need = ch.check - (hardened ? 10 : 0);
            outcome = roll < need ? 'success' : 'fail';
        }
        var branch = ch[outcome] || ch;
        var reply = '';
        if (branch && typeof branch.apply === 'function') {
            try { reply = branch.apply(sectName, { hardened: hardened }) || ''; } catch (e) { reply = ''; }
        }
        // 余波落账
        if (ev.aftermath && outcome === 'fail' ? false : (ev.aftermath && ev.aftermatter !== undefined ? false : true)) { /* noop keep */ }
        if (ev.aftermath && (!outcome || outcome !== 'success' || ev.aftermath.onSuccess !== false)) {
            if (ev.aftermath.onFailOnly && outcome === 'success') { /* 成功则无余波 */ }
            else {
                m.aftermaths.push({
                    eventId: m.active.eventId,
                    daysLeft: ev.aftermath.days || 3,
                    outcome: outcome,
                    hardened: hardened
                });
            }
        }
        // 档案记祸根：失败的抉择留 scar，成为下一场事的因果之一
        if (outcome === 'fail' && ev.scar) mem(sectName).scars[ev.scar] = (mem(sectName).scars[ev.scar] || 0) + 1;
        m.active = null;
        m.lastCrisisDay = _day();
        m.resolvedCount += 1;
        return { ok: true, outcome: outcome, msg: reply || (outcome === 'success' ? '事了。' : '办砸了。') };
    }

    // ============ 统一结算（RewardService 优先，缺环境兜底） ============
    function _settle(cost) {
        // cost: {stones, qi, energy, contribution, points} —— 玩家侧付出
        var p = window.currentCharData || {};
        var inv = window.inventory;
        function stonesHave() {
            if (window.XianXia && window.XianXia.DataManager) return window.XianXia.DataManager.getSpiritStones();
            return (inv && inv.currency && inv.currency.spiritStones) || 0;
        }
        function stonesTake(n) {
            if (window.XianXia && window.XianXia.DataManager && window.XianXia.DataManager.deductSpiritStones(n)) return true;
            if (inv && inv.currency) {
                if ((inv.currency.spiritStones || 0) < n) return false;
                inv.currency.spiritStones -= n;
                if (window.currentCharData) window.currentCharData.spiritStones = inv.currency.spiritStones;
                return true;
            }
            return false;
        }
        if (cost.stones) {
            if (stonesHave() < cost.stones) return { ok: false, msg: '灵石不足（需 ' + cost.stones + '）。' };
            if (!stonesTake(cost.stones)) return { ok: false, msg: '灵石不足。' };
        }
        if (cost.qi) {
            if ((p.qi || 0) < cost.qi) return { ok: false, msg: '真气不济（需 ' + cost.qi + '）。' };
            p.qi -= cost.qi;
        }
        if (cost.energy) {
            if ((p.energy || 0) < cost.energy) return { ok: false, msg: '精力不支（需 ' + cost.energy + '）。' };
            p.energy -= cost.energy;
        }
        if (cost.time && window.timeSystem && window.timeSystem.advanceTime) {
            try { window.timeSystem.advanceTime(cost.time, '门派大事'); } catch (e) {}
        }
        return { ok: true };
    }

    // 应用效果（奖励/门派账）：contribution/points 只发给本门弟子（别门的大事不能给玩家记功），
    // morale/resources/influence 归门派账，cityRep 走声望
    function applyGains(sectName, gains) {
        if (!gains) return '';
        var msgs = [];
        var ds = window.discipleState;
        var internal = _internal(sectName);
        var ownSect = ds && ds.isInSect && ds.sectId === sectName;
        if (gains.contribution && ownSect) { ds.contribution = (ds.contribution || 0) + gains.contribution; msgs.push('贡献+' + gains.contribution); }
        if (gains.points && ownSect) { ds.points = (ds.points || 0) + gains.points; msgs.push('积分+' + gains.points); }
        if (gains.morale && internal) { internal.morale = Math.max(0, Math.min(100, (internal.morale || 50) + gains.morale)); msgs.push('士气' + (gains.morale > 0 ? '+' : '') + gains.morale); }
        if (gains.resources && internal) { internal.resources = Math.max(0, (internal.resources || 0) + gains.resources); msgs.push('库存' + (gains.resources > 0 ? '+' : '') + gains.resources); }
        if (gains.influence && internal) { internal.influence = Math.max(0, Math.min(100, (internal.influence || 50) + gains.influence)); msgs.push('影响力' + (gains.influence > 0 ? '+' : '') + gains.influence); }
        if (gains.stones) {
            var inv = window.inventory;
            if (inv && inv.currency) {
                inv.currency.spiritStones = (inv.currency.spiritStones || 0) + gains.stones;
                if (window.currentCharData) window.currentCharData.spiritStones = inv.currency.spiritStones;
                msgs.push('灵石+' + gains.stones);
            }
        }
        if (gains.cityRep && window.addReputation) {
            try { window.addReputation(gains.city || (window.getCurrentCityName ? window.getCurrentCityName() : ''), gains.cityRep); msgs.push('声望+' + gains.cityRep); } catch (e) {}
        }
        if (gains.karma && window.RewardService) {
            try { window.RewardService.apply({ karma: gains.karma, msg: '', msgType: 'info' }, { source: 'sect_crisis', city: gains.city }); } catch (e) {}
        }
        if (internal && window.StateRegistry && typeof window.StateRegistry.markDirty === 'function') {
            try { window.StateRegistry.markDirty('sectInternal'); } catch (e) {}
        }
        return msgs.join('，');
    }

    // ============ 内院面板渲染 ============
    function display(sectName) {
        var m = mem(sectName);
        if (!m.active && !m.aftermaths.length) return null;
        var pool = window.SECT_CRISIS_EVENTS || {};

        var html = '';
        if (m.active) {
            var ev = pool[m.active.eventId] || {};
            if (m.active.stage === 'omen') {
                var omen = ev.omen || {};
                var prepOpts = (omen.prepare && omen.prepare.options) || [];
                var btns = prepOpts.map(function (o, i) {
                    var costText = [];
                    if (o.cost && o.cost.stones) costText.push('灵石' + o.cost.stones);
                    if (o.cost && o.cost.qi) costText.push('真气' + o.cost.qi);
                    if (o.cost && o.cost.time) costText.push('半日');
                    return '<button onclick="window._sectCrisisPrepare(\'' + sectName + '\',' + i + ')" class="bg-amber-700 hover:bg-amber-600 text-white text-xs px-2 py-1 rounded mr-1 mb-1">' +
                        o.label + (costText.length ? '（' + costText.join('，') + '）' : '') + '</button>';
                }).join('');
                html += '<div class="border border-amber-600 bg-amber-900/20 p-3 rounded mb-4">' +
                    '<div class="flex items-center gap-2 mb-1"><span class="text-xl">' + (ev.icon || '❕') + '</span>' +
                    '<p class="font-bold text-sm text-amber-300">近日有异 · ' + (omen.name || '异兆') + '</p></div>' +
                    '<p class="text-xs text-gray-300 mb-1">' + (omen.text || '') + '</p>' +
                    (m.active.reason ? '<p class="text-xs text-gray-500 mb-2">（' + m.active.reason + '）</p>' : '') +
                    '<div class="flex flex-wrap">' + btns +
                    '<span class="text-xs text-gray-500 self-center ml-1">不防备的话，' + m.active.daysLeft + ' 日内见分晓。</span></div></div>';
            } else {
                var choices = (ev.crisis && ev.crisis.choices) || [];
                var cbtns = choices.map(function (c, i) {
                    var costText = [];
                    if (c.cost && c.cost.stones) costText.push('灵石' + c.cost.stones);
                    if (c.cost && c.cost.qi) costText.push('真气' + c.cost.qi);
                    if (c.cost && c.cost.energy) costText.push('精力' + c.cost.energy);
                    return '<button onclick="window._sectCrisisResolve(\'' + sectName + '\',' + i + ')" class="bg-red-800 hover:bg-red-700 text-white text-xs px-2 py-1 rounded mr-1 mb-1 text-left">' +
                        c.label + (costText.length ? '（' + costText.join('，') + '）' : '') + '</button>';
                }).join('');
                html += '<div class="border border-red-600 bg-red-900/30 p-3 rounded mb-4">' +
                    '<div class="flex items-center gap-2 mb-1"><span class="text-xl">' + (ev.icon || '❗') + '</span>' +
                    '<p class="font-bold text-sm text-red-300">门派大事 · ' + (ev.crisis.name || ev.name || '') + '</p></div>' +
                    '<p class="text-xs text-gray-300 mb-2">' + ((ev.crisis && ev.crisis.text) || '') + '</p>' +
                    '<div class="flex flex-wrap">' + cbtns + '</div></div>';
            }
        }
        if (m.aftermaths.length) {
            var afEv = pool[m.aftermaths[0].eventId] || {};
            var afDef = afEv.aftermath || {};
            var clearBtn = afDef.clear ? ('<button onclick="window._sectCrisisClear(\'' + sectName + '\')" class="bg-gray-700 hover:bg-gray-600 text-white text-xs px-2 py-1 rounded ml-1">设法了结' + (afDef.clear.cost && afDef.clear.cost.stones ? '（灵石' + afDef.clear.cost.stones + '）' : '') + '</button>') : '';
            html += '<div class="border border-gray-600 bg-gray-800/50 p-3 rounded mb-4">' +
                '<p class="text-xs text-gray-400"><span class="text-gray-300 font-bold">余波未平 · ' + (afDef.name || '善后') + '</span>（还有 ' + m.aftermaths[0].daysLeft + ' 日自了）' +
                '：' + (afDef.text || '') + ' ' + clearBtn + '</p></div>';
        }
        return { html: html };
    }

    // ============ 导出 ============
    window.SectCrisis = {
        tickDay: tickDay,
        candidates: candidates,
        prepare: prepare,
        resolve: resolve,
        display: display,
        mem: mem,
        diplomacyOf: diplomacyOf,
        sectStrength: sectStrength,
        _applyGains: applyGains
    };
    window._sectCrisisPrepare = function (s, i) {
        var r = prepare(s, i);
        if (window.showMessage) window.showMessage(r.msg || '', r.ok ? (r.resolved ? 'success' : 'info') : 'warning');
        try { if (window.showSectInnerView) window.showSectInnerView(s); } catch (e) {}
        return r.ok;
    };
    window._sectCrisisResolve = function (s, i) {
        var r = resolve(s, i);
        if (window.showMessage) window.showMessage(r.msg || '', r.ok ? (r.outcome === 'success' ? 'success' : 'error') : 'warning');
        try { if (window.showSectInnerView) window.showSectInnerView(s); } catch (e) {}
        return r.ok;
    };
    window._sectCrisisClear = function (s) {
        var m = mem(s);
        if (!m.aftermaths.length) return false;
        var ev = (window.SECT_CRISIS_EVENTS || {})[m.aftermaths[0].eventId] || {};
        var clear = ev.aftermath && ev.aftermath.clear;
        if (!clear) return false;
        var pay = _settle(clear.cost || {});
        if (!pay.ok) { if (window.showMessage) window.showMessage(pay.msg || '了结不成。', 'warning'); return false; }
        var msg = '';
        if (typeof clear.apply === 'function') { try { msg = clear.apply(s) || ''; } catch (e) {} }
        m.aftermaths.shift();
        if (window.showMessage) window.showMessage(msg || '了结了。', 'success');
        try { if (window.showSectInnerView) window.showSectInnerView(s); } catch (e) {}
        return true;
    };

    // 存档：随 StateRegistry 走
    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        window.StateRegistry.register('sectCrisis', {
            version: 1,
            export: function () { return JSON.parse(JSON.stringify(MEM)); },
            import: function (data) {
                Object.keys(MEM).forEach(function (k) { delete MEM[k]; });
                if (data && typeof data === 'object') Object.assign(MEM, data);
            }
        });
    }

    // 日结接线：每过一日推进一步——余波结算、酝酿倒计时、掷因果骰。
    // 只推玩家所在门派（抉择权在玩家手里）；别门的天翻地覆走外交账与传闻。
    (function wireDaily() {
        function hook() {
            try {
                var ts = window.timeSystem;
                if (ts && typeof ts.onNewDaySubscribe === 'function') {
                    ts.onNewDaySubscribe(function () {
                        var ds = window.discipleState || {};
                        if (!ds.isInSect || !ds.sectId) return;
                        tickDay(ds.sectId);
                    });
                    return true;
                }
            } catch (e) {}
            return false;
        }
        if (!hook()) {
            try { window.addEventListener('load', function () { hook(); }); } catch (e) {}
        }
    })();

    console.log('[SectCrisis] initialized v20.49');
})();
