// ==================== skill-transmission.js — v20.88 功法传承担系 ====================
// 两条线：
//   请教（NPC→玩家）：NPC 真的「会」功法（持有网），玩家挑一门，耗情分+灵石，领悟检定，
//                     成则学会、败则只记「听闻」线索。三品需化神以上境界。
//   传授（玩家→NPC）：把已学功法教给 NPC，NPC 真学会（combat.skills 入档、切磋可用），
//                     玩家得情分/好感/敬重 + 教学相长的历练。三品需对方金丹以上。
// 持有网（ensureHolders）：按门派主题把全部 50 门功法（尤其 23 门无主功法）分派给
//   掌门/长老，并合并 SECT_DEEP_DATA masters 的 skills；幂等，可反复调用。
// 加载顺序：npc-system.js / sect-internal.js / knowledge-system.js 之后。
(function () {
    'use strict';

    // ============ 门派功法池（按门派主题认领功法；名称须能在 skillPages 解析） ============
    var SECT_SKILL_POOLS = {
        '少林寺': ['金刚伏魔', '金钟罩', '金刚掌'],
        '嵩山派': ['万剑归宗', '风卷残云', '破天一击'],
        '大旗门': ['穿云箭', '天罗地网', '破天一击'],
        '恒山派': ['清心咒', '清风剑法', '金针渡穴'],
        '全真教': ['九转丹诀', '清心咒', '混元功'],
        '华山派': ['清风剑法', '万剑归宗', '疾风步'],
        '武当派': ['八卦阵', '太极无极', '万剑归宗'],
        '侠隐阁': ['疾风步', '风卷残云', '破天一击'],
        '天涯海阁': ['清心咒', '暗影步', '符箓大全'],
        '泰山派': ['厚土诀', '金刚掌', '铁布衫'],
        '药王谷': ['回春术', '金针渡穴', '九转还魂', '女娲补天诀'],
        '神机门': ['炼器入门', '八卦阵'],
        '霹雳堂': ['炼器入门', '天雷引'],
        '茅山派': ['符箓大全', '八卦阵', '玄水真经'],
        '大隐阁': ['盘古开天斧', '混沌开天'],
        '天书阁': ['符箓大全', '丹道初解', '清心咒'],
        '蓬莱派': ['玄水真经', '凌波微步', '寒冰诀'],
        '衡山派': ['清风剑法', '暗影步'],
        '丐帮': ['金刚掌', '破天一击', '铁布衫'],
        '铁掌帮': ['铁布衫', '烈焰刀', '金刚掌'],
        '百花谷': ['回春术', '丹道初解', '流星赶月'],
        '五仙教': ['五毒经', '万蛊噬心', '丹道初解'],
        '修罗宫': ['噬魂术', '化血神功'],
        '阎罗殿': ['幽冥鬼爪', '烈焰刀', '噬魂术'],
        '昆仑派': ['混元功', '万剑归宗', '寒冰诀'],
        '金刚宗': ['不灭金身', '金刚伏魔', '铁布衫'],
        '天龙教': ['噬魂术', '化血神功', '天雷引'],
        '烈日教': ['烈焰刀', '离火心法', '天雷引'],
        '天山派': ['寒冰诀', '玄水真经', '凌波微步'],
        '逍遥派': ['鸿蒙至尊功', '九天玄步', '凌波微步'],
        '血手门': ['幽冥鬼爪', '五毒经', '化血神功'],
        '青城派': ['清风剑法', '暗影步', '万剑归宗'],
        '峨眉派': ['清心咒', '九天玄步', '万剑归宗'],
        '唐门': ['流星赶月', '穿云箭', '天罗地网'],
        '铸剑山庄': ['神匠心得', '炼器入门', '万剑归宗'],
        '飞蝎坞': ['追魂夺命', '五毒经', '流星赶月']
    };
    var TYPE_FALLBACK = {
        '正道': ['清风剑法', '金刚掌', '混元功'],
        '邪派': ['烈焰刀', '幽冥鬼爪', '化血神功'],
        '中立': ['混元功', '疾风步', '铁布衫']
    };

    // ============ 请教成本（按品阶） ============
    var GRADE_COST = {
        '九品': { favor: 10, stones: 100 },
        '八品': { favor: 20, stones: 300 },
        '七品': { favor: 25, stones: 500 },
        '五品': { favor: 30, stones: 800 },
        '三品': { favor: 45, stones: 2000, minTier: 5 }   // 三品须化神以上（tier 5）
    };
    var GRADE_ORDER = ['九品', '八品', '七品', '五品', '三品'];
    var REALM_ORDER = ['凡人', '炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫', '真仙', '金仙'];

    // ============ 传功账本（StateRegistry 持久化） ============
    var TX_STORE = {
        req: {},        // npcId → 最近请教的游戏日（每日一次）
        teach: {},      // npcId → 最近传授的游戏日（每日一次）
        taught: {},     // npcId → [教给TA的功法名]
        stats: { requested: 0, learned: 0, failed: 0, transmitted: 0 }
    };
    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        window.StateRegistry.register('skillTransmission', {
            version: 1,
            export: function () { return JSON.parse(JSON.stringify(TX_STORE)); },
            import: function (data) {
                if (!data) return;
                TX_STORE.req = data.req || {};
                TX_STORE.teach = data.teach || {};
                TX_STORE.taught = data.taught || {};
                TX_STORE.stats = data.stats || TX_STORE.stats;
            },
            reset: function () {
                TX_STORE.req = {}; TX_STORE.teach = {}; TX_STORE.taught = {};
                TX_STORE.stats = { requested: 0, learned: 0, failed: 0, transmitted: 0 };
            }
        });
    }

    // ============ 小工具 ============
    function tierOf(realm) {
        var i = REALM_ORDER.indexOf(String(realm || ''));
        return i >= 0 ? i : 1;
    }
    function rng() {
        return (typeof window.__txRng === 'function') ? window.__txRng() : Math.random();
    }
    function absDay() {
        try {
            if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') return window.timeSystem.getAbsoluteDay();
            if (window.timeSystem && window.timeSystem.gameTime) return window.timeSystem.gameTime.currentDay || 0;
        } catch (e) {}
        return 0;
    }
    function getStones() {
        if (window.XianXia && window.XianXia.DataManager && typeof window.XianXia.DataManager.getSpiritStones === 'function') {
            return window.XianXia.DataManager.getSpiritStones() || 0;
        }
        return (window.inventory && window.inventory.currency && window.inventory.currency.spiritStones) || 0;
    }
    function spendStones(n) {
        if (window.XianXia && window.XianXia.DataManager && typeof window.XianXia.DataManager.deductSpiritStones === 'function') {
            window.XianXia.DataManager.deductSpiritStones(n); return;
        }
        if (window.inventory && window.inventory.currency) {
            window.inventory.currency.spiritStones = Math.max(0, (window.inventory.currency.spiritStones || 0) - n);
        }
    }
    function toast(msg, type) { if (window.showMessage) window.showMessage(msg, type || 'info'); }
    function advance(minutes, label) {
        try { if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') window.timeSystem.advanceTime(minutes, label); } catch (e) {}
    }
    function getNpc(npcId) {
        return (window.npcManager && typeof window.npcManager.getNPC === 'function') ? window.npcManager.getNPC(npcId) : null;
    }
    function allSkills() {
        var out = [];
        var pages = window.skillPages || [];
        for (var p = 0; p < pages.length; p++) {
            for (var s = 0; s < (pages[p] || []).length; s++) out.push(pages[p][s]);
        }
        return out;
    }
    function resolveName(name) {
        if (!window.KnowledgeSystem) return null;
        var id = window.KnowledgeSystem.resolveSkillId(name, name);
        if (id && window.KnowledgeSystem.hasDefinition && window.KnowledgeSystem.hasDefinition(id)) return id;
        return null;
    }
    function findDef(skillId) {
        if (typeof window.findSkillById === 'function') {
            var d = window.findSkillById(skillId);
            if (d) return d;
        }
        var all = allSkills();
        for (var i = 0; i < all.length; i++) if (all[i].id === skillId) return all[i];
        return null;
    }
    function gradeIdx(g) { var i = GRADE_ORDER.indexOf(g); return i < 0 ? 0 : i; }
    function esc(s) { return String(s).replace(/'/g, "\\'"); }

    // NPC 身上可解析的真实功法 → [{id, def}]
    function npcTeachable(npc) {
        if (!npc) return [];
        var candidates = [];
        if (Array.isArray(npc.skills)) candidates = candidates.concat(npc.skills);
        if (npc.combat && Array.isArray(npc.combat.skills)) candidates = candidates.concat(npc.combat.skills);
        var seen = {}, out = [];
        for (var i = 0; i < candidates.length; i++) {
            var c = candidates[i];
            if (!c) continue;
            var rawId = (typeof c === 'string') ? c : (c.id || c.skillId || c.name);
            var rawName = (typeof c === 'object') ? c.name : c;
            var id = window.KnowledgeSystem ? window.KnowledgeSystem.resolveSkillId(rawId, rawName) : null;
            if (!id || seen[id]) continue;
            if (!(window.KnowledgeSystem && window.KnowledgeSystem.hasDefinition && window.KnowledgeSystem.hasDefinition(id))) continue;
            var def = findDef(id);
            if (!def) continue;
            seen[id] = true;
            out.push({ id: id, def: def });
        }
        out.sort(function (a, b) { return gradeIdx(b.def.grade) - gradeIdx(a.def.grade); });
        return out;
    }

    // ============ 持有网：让每门功法在世上都有人真的会 ============
    function ensureHolders() {
        if (!window.npcManager || !window.sectsData) return;
        var all = (typeof window.npcManager.getAllNPCs === 'function') ? window.npcManager.getAllNPCs() : [];
        Object.keys(window.sectsData).forEach(function (sectName) {
            var sect = window.sectsData[sectName];
            var pool = (SECT_SKILL_POOLS[sectName] || []).slice();
            // 合并门派深度数据里 masters 的 skills（如药王谷孙思邈的回春术三件套）
            var deep = window.SECT_DEEP_DATA && window.SECT_DEEP_DATA[sectName];
            if (deep && Array.isArray(deep.masters)) {
                deep.masters.forEach(function (m) {
                    (m && m.skills ? m.skills : []).forEach(function (sn) {
                        if (pool.indexOf(sn) < 0 && resolveName(sn)) pool.push(sn);
                    });
                });
            }
            if (!pool.length) pool = (TYPE_FALLBACK[sect && sect.type] || TYPE_FALLBACK['中立']).slice();
            // 过滤成可解析的 def，按品阶降序
            var defs = [];
            pool.forEach(function (name) {
                var id = resolveName(name);
                if (id) { var d = findDef(id); if (d && !defs.some(function (x) { return x.id === id; })) defs.push({ id: id, def: d }); }
            });
            defs.sort(function (a, b) { return gradeIdx(b.def.grade) - gradeIdx(a.def.grade); });
            if (!defs.length) return;

            function grant(npc, picks) {
                if (!npc || npc._skillHolderEnriched) return;
                if (!npc.combat) npc.combat = { skills: [] };
                if (!Array.isArray(npc.combat.skills)) npc.combat.skills = [];
                picks.forEach(function (d) {
                    if (!npc.combat.skills.some(function (x) { return (typeof x === 'string' ? x : (x && x.name)) === d.def.name; }) &&
                        npc.combat.skills.indexOf(d.id) < 0) {
                        npc.combat.skills.push(d.def.name);
                    }
                });
                npc._skillHolderEnriched = true;
            }

            // 掌门：三品全拿 + 补到 4 门
            var leader = getNpc('sect_leader_' + sectName) ||
                all.find(function (n) { return n && n.id === 'sect_leader_' + sectName; });
            if (leader) {
                var lp = defs.filter(function (d) { return d.def.grade === '三品'; });
                defs.forEach(function (d) { if (lp.length < 4 && lp.indexOf(d) < 0 && d.def.grade !== '三品') lp.push(d); });
                grant(leader, lp.slice(0, 4));
                if (defs.some(function (d) { return d.def.grade === '三品'; })) leader._holdsUltimate = true;
            }
            // 长老：每人 1~2 门非三品（按下标错开，避免全派长老会同一门）
            var nonMythic = defs.filter(function (d) { return d.def.grade !== '三品'; });
            all.forEach(function (n) {
                if (!n || typeof n.id !== 'string' || n.id.indexOf('sect_elder_' + sectName + '_') !== 0) return;
                if (!nonMythic.length) return;
                var idx = parseInt(n.id.split('_').pop(), 10) || 0;
                var picks = [nonMythic[idx % nonMythic.length]];
                if (nonMythic.length > 1 && rng() < 0.5) picks.push(nonMythic[(idx + 1) % nonMythic.length]);
                grant(n, picks);
            });
        });
    }

    // ============ 请教（NPC→玩家） ============
    function openRequestUI(npcId) {
        ensureHolders();
        var npc = getNpc(npcId);
        if (!npc) { toast('找不到这个人', 'error'); return false; }
        var rel = npc.relationship || {};
        if ((rel.affection || 0) < 60 || (rel.favor || 0) < 30) {
            toast(npc.name + ' 与你还不够熟，贸然请教功法怕是要吃闭门羹（需好感 60、情分 30）', 'warning');
            return false;
        }
        if (TX_STORE.req[npcId] === absDay()) {
            toast('今日已向 ' + npc.name + ' 请教过，明日再来吧', 'info');
            return false;
        }
        var teachable = npcTeachable(npc);
        if (!teachable.length) {
            toast(npc.name + ' 抱歉地摆摆手：「我这一身粗浅功夫，没什么完整功法能传你。」', 'info');
            return false;
        }
        var playerTier = tierOf(window.currentCharData && window.currentCharData.realm);
        var rows = teachable.map(function (t) {
            var cost = GRADE_COST[t.def.grade] || GRADE_COST['八品'];
            var learned = window.KnowledgeSystem && window.KnowledgeSystem.knows(t.id, 'learned');
            var locked = cost.minTier && playerTier < cost.minTier;
            var btn;
            if (learned) btn = '<span class="text-gray-500 text-xs">已学会</span>';
            else if (locked) btn = '<span class="text-red-400 text-xs">需化神以上境界</span>';
            else btn = '<button onclick="SkillTransmission.pickRequest(\'' + esc(npcId) + '\',\'' + esc(t.id) + '\')" class="bg-cyan-700 hover:bg-cyan-600 text-white text-xs px-3 py-1 rounded">请教</button>';
            return '<div class="flex items-center justify-between gap-2 py-2 border-b border-gray-700">' +
                '<div class="text-left"><span class="text-base">' + (t.def.icon || '📖') + '</span> ' +
                '<span class="font-bold text-gray-100">' + t.def.name + '</span> ' +
                '<span class="text-xs ' + (t.def.grade === '三品' ? 'text-yellow-300' : t.def.grade === '五品' ? 'text-purple-300' : 'text-gray-400') + '">' + t.def.grade + '·' + t.def.type + '</span>' +
                '<div class="text-xs text-gray-500">情分 ' + cost.favor + ' + 灵石 ' + cost.stones + '</div></div>' + btn + '</div>';
        }).join('');
        var modal = document.createElement('div');
        modal.id = 'skill-tx-modal';
        modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
        modal.innerHTML = '<div class="bg-gray-800 border-2 border-cyan-600 rounded-xl p-5 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">' +
            '<h3 class="text-lg font-bold text-cyan-300 mb-1">📖 向 ' + npc.name + ' 请教功法</h3>' +
            '<p class="text-xs text-gray-400 mb-3">TA 愿意倾囊相授与否，看你的悟性与缘分。每次请教耗半个时辰，每人每日一次。</p>' +
            rows +
            '<button onclick="document.getElementById(\'skill-tx-modal\').remove()" class="mt-3 w-full text-gray-400 text-sm py-1">告辞</button></div>';
        var old = document.getElementById('skill-tx-modal');
        if (old) old.remove();
        document.body.appendChild(modal);
        return true;
    }

    function pickRequest(npcId, skillId) {
        var npc = getNpc(npcId);
        var def = findDef(skillId);
        if (!npc || !def) { toast('请教失败：对象或功法不存在', 'error'); return false; }
        var teachable = npcTeachable(npc);
        if (!teachable.some(function (t) { return t.id === skillId; })) { toast(npc.name + ' 并不会这门功法', 'warning'); return false; }
        var cost = GRADE_COST[def.grade] || GRADE_COST['八品'];
        var rel = npc.relationship || {};
        if ((rel.affection || 0) < 60 || (rel.favor || 0) < 30) { toast('好感或情分不足，请教被婉拒了', 'warning'); return false; }
        if (TX_STORE.req[npcId] === absDay()) { toast('今日已请教过 ' + npc.name, 'info'); return false; }
        if (cost.minTier && tierOf(window.currentCharData && window.currentCharData.realm) < cost.minTier) {
            toast('三品功法气象浩瀚，你的境界还承接不住（需化神以上）', 'warning'); return false;
        }
        if ((rel.favor || 0) < cost.favor) { toast('情分不足（需 ' + cost.favor + '，现有 ' + (rel.favor || 0) + '）——多陪陪TA，或先还TA人情', 'warning'); return false; }
        if (getStones() < cost.stones) { toast('灵石不足（需 ' + cost.stones + '）——拜师学艺，束脩不能少', 'warning'); return false; }

        spendStones(cost.stones);
        if (typeof npc.changeFavor === 'function') npc.changeFavor(-cost.favor);
        else rel.favor = Math.max(0, (rel.favor || 0) - cost.favor);
        advance(120, '请教功法');
        TX_STORE.req[npcId] = absDay();
        TX_STORE.stats.requested++;

        var prob = 0.55 + Math.min(0.25, (rel.affection || 0) / 400);
        var modal = document.getElementById('skill-tx-modal');
        if (modal) modal.remove();
        if (rng() < prob) {
            if (window.KnowledgeSystem) window.KnowledgeSystem.unlock(skillId, 'learned', { source: 'npc_teaching', completeness: 100 });
            TX_STORE.stats.learned++;
            if (typeof npc.changeAffection === 'function') npc.changeAffection(2);
            if (typeof npc.recordPlayerAction === 'function') { try { npc.recordPlayerAction('learn_skill', 'positive'); } catch (e) {} }
            toast('📖 ' + npc.name + ' 把「' + def.name + '」的口诀要义细细讲了一遍，你彻底学会了！（' + def.grade + '·' + def.type + '）', 'success');
        } else {
            if (window.KnowledgeSystem) window.KnowledgeSystem.unlock(skillId, 'heard', { source: 'npc_teaching', completeness: 40 });
            TX_STORE.stats.failed++;
            toast(npc.name + ' 讲了「' + def.name + '」，你却只摸到些皮毛，记下几句口诀。（已录为线索，日后再请教或寻秘籍补全）', 'warning');
        }
        if (typeof window.updateCharacterStatus === 'function') { try { window.updateCharacterStatus(); } catch (e) {} }
        return true;
    }

    // ============ 传授（玩家→NPC） ============
    function openTeachUI(npcId) {
        ensureHolders();
        var npc = getNpc(npcId);
        if (!npc) { toast('找不到这个人', 'error'); return false; }
        var rel = npc.relationship || {};
        if ((rel.affection || 0) < 30) {
            toast(npc.name + ' 与你交情尚浅，学功法是大事，TA 信不过外人（需好感 30）', 'warning');
            return false;
        }
        if (TX_STORE.teach[npcId] === absDay()) {
            toast('今日已给 ' + npc.name + ' 讲过功，贪多嚼不烂，明日再来', 'info');
            return false;
        }
        if (!window.KnowledgeSystem) return false;
        var npcIds = {};
        npcTeachable(npc).forEach(function (t) { npcIds[t.id] = true; });
        var mine = allSkills().filter(function (d) {
            return window.KnowledgeSystem.knows(d.id, 'learned') && !npcIds[d.id];
        });
        if (!mine.length) {
            toast('你没有 ' + npc.name + ' 还没见过的功法可教', 'info');
            return false;
        }
        var npcTier = tierOf(npc.combat && npc.combat.realm);
        var rows = mine.map(function (def) {
            var locked = def.grade === '三品' && npcTier < 3;
            var btn = locked
                ? '<span class="text-red-400 text-xs">TA 需金丹以上</span>'
                : '<button onclick="SkillTransmission.pickTeach(\'' + esc(npcId) + '\',\'' + esc(def.id) + '\')" class="bg-emerald-700 hover:bg-emerald-600 text-white text-xs px-3 py-1 rounded">传授</button>';
            return '<div class="flex items-center justify-between gap-2 py-2 border-b border-gray-700">' +
                '<div class="text-left"><span class="text-base">' + (def.icon || '📖') + '</span> ' +
                '<span class="font-bold text-gray-100">' + def.name + '</span> ' +
                '<span class="text-xs ' + (def.grade === '三品' ? 'text-yellow-300' : def.grade === '五品' ? 'text-purple-300' : 'text-gray-400') + '">' + def.grade + '·' + def.type + '</span></div>' + btn + '</div>';
        }).join('');
        var modal = document.createElement('div');
        modal.id = 'skill-tx-modal';
        modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
        modal.innerHTML = '<div class="bg-gray-800 border-2 border-emerald-600 rounded-xl p-5 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">' +
            '<h3 class="text-lg font-bold text-emerald-300 mb-1">🎁 传授功法给 ' + npc.name + '</h3>' +
            '<p class="text-xs text-gray-400 mb-3">教是最好的学。TA 学会后与你情谊更深，你也能在讲解中温故知新（得历练）。</p>' +
            rows +
            '<button onclick="document.getElementById(\'skill-tx-modal\').remove()" class="mt-3 w-full text-gray-400 text-sm py-1">算了</button></div>';
        var old = document.getElementById('skill-tx-modal');
        if (old) old.remove();
        document.body.appendChild(modal);
        return true;
    }

    function pickTeach(npcId, skillId) {
        var npc = getNpc(npcId);
        var def = findDef(skillId);
        if (!npc || !def) { toast('传授失败：对象或功法不存在', 'error'); return false; }
        if (!(window.KnowledgeSystem && window.KnowledgeSystem.knows(skillId, 'learned'))) { toast('你自己都还没学会这门功法', 'warning'); return false; }
        var already = npcTeachable(npc).some(function (t) { return t.id === skillId; });
        if (already) { toast(npc.name + ' 早就会「' + def.name + '」了', 'info'); return false; }
        var rel = npc.relationship || {};
        if ((rel.affection || 0) < 30) { toast('交情不够，TA 不敢受此大礼', 'warning'); return false; }
        if (TX_STORE.teach[npcId] === absDay()) { toast('今日已给 ' + npc.name + ' 讲过功', 'info'); return false; }
        if (def.grade === '三品' && tierOf(npc.combat && npc.combat.realm) < 3) {
            toast('「' + def.name + '」气象浩瀚，' + npc.name + ' 的境界还承接不住（TA 需金丹以上）', 'warning'); return false;
        }

        advance(120, '传授功法');
        if (!npc.combat) npc.combat = { skills: [] };
        if (!Array.isArray(npc.combat.skills)) npc.combat.skills = [];
        npc.combat.skills.push(def.name);
        TX_STORE.teach[npcId] = absDay();
        TX_STORE.taught[npcId] = (TX_STORE.taught[npcId] || []).concat(def.name);
        TX_STORE.stats.transmitted++;

        if (typeof npc.changeFavor === 'function') npc.changeFavor(10);
        if (typeof npc.changeAffection === 'function') npc.changeAffection(5);
        if (typeof npc.changeRespect === 'function') npc.changeRespect(4);
        if (typeof npc.recordPlayerAction === 'function') { try { npc.recordPlayerAction('transmit_skill', 'positive'); } catch (e) {} }
        var cd = window.currentCharData;
        var temperingGain = def.grade === '三品' ? 60 : def.grade === '五品' ? 40 : 25;
        if (cd) cd.tempering = (cd.tempering || 0) + temperingGain;

        var modal = document.getElementById('skill-tx-modal');
        if (modal) modal.remove();
        toast('🎁 你把「' + def.name + '」细细讲给 ' + npc.name + '，TA 受益匪浅：情分+10、好感+5、敬重+4。教学相长，你也温故知新（历练+' + temperingGain + '）。', 'success');
        if (TX_STORE.stats.transmitted === 3) toast('🏅 你已传道三次，江湖上开始有人称你一声「先生」。', 'success');
        if (TX_STORE.stats.transmitted === 10) toast('🏅 传道十次——桃李渐满江湖，「传道者」之名实至名归。', 'success');
        if (typeof window.updateCharacterStatus === 'function') { try { window.updateCharacterStatus(); } catch (e) {} }
        return true;
    }

    // 新游戏重置：持有网需要重铺
    if (typeof window.resetNPCSystem === 'function') {
        var _origReset = window.resetNPCSystem;
        window.resetNPCSystem = function () {
            var r = _origReset.apply(this, arguments);
            try {
                (window.npcManager && window.npcManager.getAllNPCs ? window.npcManager.getAllNPCs() : []).forEach(function (n) {
                    if (n) { delete n._skillHolderEnriched; delete n._holdsUltimate; }
                });
            } catch (e) {}
            return r;
        };
    }

    window.SkillTransmission = {
        ensureHolders: ensureHolders,
        npcTeachable: npcTeachable,
        openRequestUI: openRequestUI,
        pickRequest: pickRequest,
        openTeachUI: openTeachUI,
        pickTeach: pickTeach,
        SECT_SKILL_POOLS: SECT_SKILL_POOLS,
        GRADE_COST: GRADE_COST,
        tierOf: tierOf,
        _store: function () { return TX_STORE; }
    };
})();
