// ==================== art-effects.js - v20.48 功法掌握通电 ====================
// 【第一批·认账口径与词表补齐】此前两处把「学会的功法」和「它写的效果」都读丢了：
//   ① 判定只认 techniqueKnowledge 一条道，而功法栏（equipment.js:374-379）、运功装具
//      （KnowledgeSystem.canEquip）、融合取底（cultivation.js:_skillIsMastered）都还认
//      learnedSecrets 与「秘籍 id 反查」。于是同一门功法，秘籍层出力、运功层不出力——
//      组内「两层取最高」的设计（同组归一）根本没机会生效。
//      此处改成三处同款认账：知识账 → learnedSecrets 含本门 → 任一映射到本门的秘籍 id 在册。
//   ② effect 词表与数据实词不符：skillPages 写「长兵伤害/反击/闪避/吸血/毒系伤害/全系伤害」，
//      解析器只认「枪法伤害/反击+%/闪避+%」，59 门里 28 门解析结果是 {}——学会了、计数里在、
//      面板写着「已掌握」，战斗加成为 0。词表按数据实词补齐（数值一律照抄，不改任何倍率）。
// 口径约定（不变，勿混）：
//   flat = 点数，进 combatBonus()/attrBonus() 的加值制
//   pct  = 百分点，进 weaponPct() 的乘区；app.js:5240 是 attack × (1 + pct/100)
//          ⇒ attackPct 150 的意思是「+150%」＝×2.5，不是 ×1.5。
//   ★ attack 不在 combatBonus() 里是刻意的：那边是加值制，塞 attack 会变成平加点数，
//     与乘区两把尺打架。通用攻击百分点（解析键 attack）由 weaponPct() 无条件并入乘区。
// 此前两层功法数据全是死账：
//   ① items-extended/06-arts.js 秘籍的结构化 effect（qi_regen_boost / all_attr_boost / fire_damage_boost…）
//      —— 全库零消费点，学到三品功法毫无变化；
//   ② equipment.js skillPages 的 effect 字符串（「剑法伤害+12%」「火系伤害+25%」…53 门）
//      —— 只有「真气上限/防御/闪避」三种字样被解析，其余全忽略。
// 本模块做单一真源汇总器 ArtEffects：
//   掌握判定（KnowledgeSystem state learned/mastered）→ 两层数据各解析成统一口径 → 各键「取最高一门」（专精语义：
//   同时学多门剑法，只有最深一门出力；属性底蕴同理不叠）→ 供战斗/恢复/上限/面板四处接线。
// 口径约定：
//   flat  = 点数（defense_boost 20 → 防御+20；all_attr_boost 30 → 六维各+30÷10=3？不——直加 3 太小，定标：all_attr 按 ÷10 折点，
//           专属属性键直加点）——统一在 attrBonus() 内折算，见各键注释。
//   pct   = 百分点（sword_attack_boost 25 → 剑攻+25%；qi_regen_boost 10 → 真气恢复+10%）
(function () {
    'use strict';

    // —— 掌握判定 ——
    function _knowState(id) {
        try {
            var ks = window.KnowledgeSystem;
            if (ks && typeof ks.getEntry === 'function') {
                var e = ks.getEntry(id);
                if (e && (e.state === 'learned' || e.state === 'mastered')) return e.state;
            }
        } catch (e) {}
        return null;
    }

    // ★原 _knowManual（秘籍 id → skill_XX 的掌握判定）已删：全文件无人调用它，
    //   而它与下面的 _artLearned 是同一问题的两个答案——「这门功法算不算学会」在一个文件里
    //   留两把尺，正是本批病灶的成因。统一走 _artLearned。

    function _learnedSecretList() {
        var arr = window.learnedSecrets;
        return (arr && arr.length) ? arr : [];
    }

    // —— 掌握判定（三处同款认账，勿再退回单一字段）——
    // 知识账 learned/mastered → learnedSecrets 含本门 id → 任一映射到本门的秘籍 id 在册。
    // 后两条不是补丁是补齐：功法栏与运功装具一直这么认（equipment.js:374-379 /
    // KnowledgeSystem.canEquip 的老档反查），只有本模块严于此，才出现「秘籍层出力、
    // 运功层不出力」的裂缝。
    function _artLearned(id) {
        if (!id) return false;
        if (_knowState(id)) return true;
        var ls = _learnedSecretList();
        if (ls.indexOf(id) >= 0) return true;
        var map = (window.KnowledgeSystem && window.KnowledgeSystem.MANUAL_TO_SKILL) || {};
        for (var mid in map) {
            if (Object.prototype.hasOwnProperty.call(map, mid) && map[mid] === id && ls.indexOf(mid) >= 0) return true;
        }
        return false;
    }

    // —— 来源 A：秘籍物品（结构化 effect 对象） ——
    // 掌握判定从严：凭典籍直学（learnedSecrets 含其 id / 知识条目键即其 id），
    // 或「同名映射」才推定掌握——MANUAL_TO_SKILL 里异名归并（如九阳神功→skill_14 离火心法）
    // 只是知识条目复用，学会一门火系功法不该白拿另一门的加成。
    function _skillName(skillId) {
        var pages = window.skillPages || [];
        for (var p = 0; p < pages.length; p++) {
            var page = pages[p] || [];
            for (var i = 0; i < page.length; i++) {
                if (page[i] && page[i].id === skillId) return page[i].name;
            }
        }
        return null;
    }

    function _artMastery(t) {
        if (_learnedSecretList().indexOf(t.id) >= 0 || _knowState(t.id)) return true;
        var mapped = ((window.KnowledgeSystem && window.KnowledgeSystem.MANUAL_TO_SKILL) || {})[t.id];
        if (mapped && _knowState(mapped) && _skillName(mapped) === t.name) return true; // 同名才是同门
        return false;
    }

    function _artTemplates() {
        var list = window.extendedArts || [];
        var out = [];
        for (var i = 0; i < list.length; i++) {
            var t = list[i];
            if (!t || !t.effect) continue;
            if (_artMastery(t)) out.push(t);
        }
        return out;
    }

    // —— 来源 B：skillPages（effect 字符串） ——
    var _ELEM_KEYS = {
        '火系': 'fire', '冰系': 'ice', '水系': 'water', '金系': 'metal', '木系': 'wood',
        '土系': 'earth', '雷系': 'thunder', '风系': 'wind', '暗系': 'void', '空间': 'void'
    };
    var _WEAPON_KEYS = { '剑法': 'sword', '刀法': 'dao', '拳掌': 'fist', '枪法': 'spear', '奇门': 'odd' };

    // 【词表按数据实词】skillPages 的 59 条 effect 串逐条对齐写定，措辞以数据为准：
    //   长兵（不是「枪法」）· 反击/闪避 有写成点数的（不带 %）· 吸血 · 毒系伤害 · 全系伤害
    // 数值一律照抄原串，不做任何折算或缩放。
    function _parseSkillEffect(str) {
        var out = {};
        if (!str || typeof str !== 'string') return out;
        // 百分点句式（带 %）
        function pct(re, key) {
            var m = str.match(re);
            if (m) out[key] = Math.max(out[key] || 0, parseInt(m[1], 10) || 0);
        }
        // 点数句式（不带 %）：(?![\d%]) 挡住「闪避+45%」被点数规则截胡
        function flat(re, key) {
            var m = str.match(re);
            if (m) out[key] = Math.max(out[key] || 0, parseInt(m[1], 10) || 0);
        }
        pct(/剑法伤害\+(\d+)%/, 'sword');
        pct(/刀法伤害\+(\d+)%/, 'dao');
        pct(/拳掌伤害\+(\d+)%/, 'fist');
        pct(/(?:枪法|长兵)伤害\+(\d+)%/, 'spear');
        pct(/奇门伤害\+(\d+)%/, 'odd');
        pct(/攻击\+(\d+)%/, 'attack');
        pct(/防御\+(\d+)%/, 'defensePct');
        pct(/闪避\+(\d+)%/, 'dodgePct');
        pct(/暴击\+(\d+)%/, 'critPct');
        pct(/真气恢复\+(\d+)%/, 'qiRegen');
        pct(/生命恢复\+(\d+)%/, 'hpRegen');
        pct(/真气上限\+(\d+)%/, 'maxQiPct');
        pct(/吸血\+(\d+)%/, 'lifesteal');
        pct(/毒系伤害\+(\d+)%/, 'venom');
        pct(/全系伤害\+(\d+)%/, 'allElem');
        flat(/反击\+(\d+)(?![\d%])/, 'counter');
        flat(/闪避\+(\d+)(?![\d%])/, 'dodge');
        var em = str.match(/([一-龥]{1,2}系)伤害\+(\d+)%/);
        if (em && _ELEM_KEYS[em[1]]) out['elem_' + _ELEM_KEYS[em[1]]] = parseInt(em[2], 10) || 0;
        return out;
    }

    function _skillPageArts() {
        var pages = window.skillPages || [];
        var out = [];
        for (var p = 0; p < pages.length; p++) {
            var page = pages[p] || [];
            for (var i = 0; i < page.length; i++) {
                var sk = page[i];
                if (!sk || !sk.effect || !_artLearned(sk.id)) continue;
                out.push({ id: sk.id, name: sk.name, parsed: _parseSkillEffect(sk.effect) });
            }
        }
        return out;
    }

    // —— 汇总：按「功法」归一分组，组内每键取最高 ——
    // 同一门功法常有两层表述：秘籍物品（结构化对象）与 skillPages（字符串）。两层若各算各的会双算，
    // 故先经 MANUAL_TO_SKILL 把秘籍归到对应 skill_XX，同组内逐键取最高。
    var summarizeCache = null;
    var _finger = '';
    // 学了新功法自动重算：指纹 = 掌握清单长度 + 明细串，无需各处记得失效
    function _fingerprint() {
        try {
            var ks = window.KnowledgeSystem;
            var ids = (ks && typeof ks.getLearnedSkillIds === 'function') ? ks.getLearnedSkillIds('learned') : [];
            var extra = (window.learnedSecrets || []).join(',');
            return ids.length + '|' + ids.join(',') + '|' + extra;
        } catch (e) { return ''; }
    }
    function summarize(force) {
        var fp = _fingerprint();
        if (summarizeCache && !force && fp === _finger) return summarizeCache;
        _finger = fp;
        var flat = {};   // 点数
        var pct = {};    // 百分点
        var elem = {};   // 元素百分点
        var learned = [];
        var groups = {}; // groupKey -> {flat, pct, elem}（组内取最高，组间不叠）

        function take(bucket, obj, key, val) {
            if (typeof val !== 'number' || !isFinite(val)) return;
            obj[key] = Math.max(obj[key] || 0, val);
        }
        function bucketOf(groupKey) {
            if (!groups[groupKey]) groups[groupKey] = { flat: {}, pct: {}, elem: {} };
            return groups[groupKey];
        }

        var _M2S = (window.KnowledgeSystem && window.KnowledgeSystem.MANUAL_TO_SKILL) || {};

        var arts = _artTemplates();
        for (var i = 0; i < arts.length; i++) {
            var t = arts[i];
            var ef = t.effect || {};
            // 归组键：同名映射（同一门功法的秘籍层）归到 skill_XX；异名归并（知识条目复用）自成一门
            var _mapped = _M2S[t.id];
            var _groupKey = (_mapped && _skillName(_mapped) === t.name) ? _mapped : t.id;
            var g = bucketOf(_groupKey);
            learned.push({ id: t.id, name: t.name });
            // 点数键
            take(g, g.flat, 'defense', ef.defense_boost);
            take(g, g.flat, 'speed', ef.speed_boost);
            take(g, g.flat, 'dodge', ef.dodge_boost);
            take(g, g.flat, 'counter', ef.counter_boost);
            take(g, g.flat, 'strength', ef.strength_boost);
            take(g, g.flat, 'dexterity', ef.dexterity_boost);
            take(g, g.flat, 'maxQi', ef.max_qi_boost);
            // 属性底蕴：all_attr 按 ÷10 折每维点数（30 → 各+3）
            if (ef.all_attr_boost) take(g, g.flat, 'allAttr', ef.all_attr_boost / 10);
            // 百分点键
            take(g, g.pct, 'qiRegen', ef.qi_regen_boost);
            take(g, g.pct, 'hpRegen', ef.hp_regen_boost);
            take(g, g.pct, 'sword', ef.sword_attack_boost);
            take(g, g.pct, 'dao', ef.dao_attack_boost);
            take(g, g.pct, 'fist', ef.fist_attack_boost);
            // 元素伤害
            take(g, g.elem, 'fire', ef.fire_damage_boost);
            take(g, g.elem, 'ice', ef.ice_damage_boost);
            take(g, g.elem, 'water', ef.water_damage_boost);
            take(g, g.elem, 'metal', ef.metal_damage_boost);
            take(g, g.elem, 'void', ef.void_damage_boost);
            take(g, g.elem, 'dragon', ef.dragon_damage_boost);
            take(g, g.elem, 'demon', ef.demon_damage_boost);
            // 吸血功：血饮刀法 lifesteal_boost ≥ 10 → 战斗实体获 lifesteal 能力（battle.js 既有钩子）
            if ((ef.lifesteal_boost || 0) >= 10) g.flat._lifesteal = 1;
            // 第八十波·毒灼通道：poison_boost/burn_boost ≥ 10 → 战斗实体获 venom施毒/burn灼烧 能力
            //（吸血同款先例——能力是有无账，数值高低不再另算；战斗端 COMBAT_ABILITIES 是现成的）
            if ((ef.poison_boost || 0) >= 10) g.flat._venom = 1;
            if ((ef.burn_boost || 0) >= 10) g.flat._burn = 1;
        }

        var pages = _skillPageArts();
        for (var j = 0; j < pages.length; j++) {
            var ps = pages[j].parsed;
            var pg = bucketOf(pages[j].id);
            learned.push({ id: pages[j].id, name: pages[j].name });
            take(pg, pg.pct, 'sword', ps.sword);
            take(pg, pg.pct, 'dao', ps.dao);
            take(pg, pg.pct, 'fist', ps.fist);
            take(pg, pg.pct, 'spear', ps.spear);
            take(pg, pg.pct, 'odd', ps.odd);
            take(pg, pg.pct, 'attack', ps.attack);
            take(pg, pg.pct, 'dodgePct', ps.dodgePct);
            take(pg, pg.pct, 'critPct', ps.critPct);
            take(pg, pg.pct, 'defensePct', ps.defensePct);
            take(pg, pg.pct, 'qiRegen', ps.qiRegen);
            take(pg, pg.pct, 'hpRegen', ps.hpRegen);
            take(pg, pg.pct, 'maxQiPct', ps.maxQiPct);
            // 点数句式：反击+20 / 闪避+45（不带 % 的写法此前一个键都读不出）
            take(pg, pg.flat, 'counter', ps.counter);
            take(pg, pg.flat, 'dodge', ps.dodge);
            // 吸血+15% / 毒系伤害+20% —— 阈值沿用秘籍层的先例（≥10 得能力，有无账不是高低账）
            if ((ps.lifesteal || 0) >= 10) pg.flat._lifesteal = 1;
            if ((ps.venom || 0) >= 10) pg.flat._venom = 1;
            // 全系伤害+45%（混沌开天）：战斗端只按敌型取火/冰/水/金/虚/龙/魔七键
            // （battle.js:4754-4757），故摊到七键上才算真出力，不是新开一条无人读的通道
            if (ps.allElem > 0) {
                ['fire', 'ice', 'water', 'metal', 'void', 'dragon', 'demon'].forEach(function (ak) {
                    take(pg, pg.elem, ak, ps.allElem);
                });
            }
            for (var ek in _ELEM_KEYS) {
                var v = ps['elem_' + _ELEM_KEYS[ek]];
                if (v) take(pg, pg.elem, _ELEM_KEYS[ek], v);
            }
        }

        // 组间合并：跨功法的同类键仍取最高（专精语义），仅 _lifesteal 有一即真
        Object.keys(groups).forEach(function (gk) {
            var g = groups[gk];
            // 同组口径归一：同一门功法两层表述（点数/百分比）并存时只出点数一力——
            // 如混元功秘籍「max_qi_boost 25」与 skillPage「真气上限+20%」是同一门，不双算。
            if (g.flat.maxQi > 0) g.pct.maxQiPct = 0;
            if (g.flat.defense > 0) g.pct.defensePct = 0;
            if (g.flat.dodge > 0) g.pct.dodgePct = 0;
            ['flat', 'pct'].forEach(function (layer) {
                for (var k in g[layer]) {
                    if (k === '_lifesteal') { if (g[layer][k]) flat._lifesteal = 1; continue; }
                    if (k === '_venom') { if (g[layer][k]) flat._venom = 1; continue; }
                    if (k === '_burn') { if (g[layer][k]) flat._burn = 1; continue; }
                    take(null, layer === 'flat' ? flat : pct, k, g[layer][k]);
                }
            });
            for (var ek2 in g.elem) take(null, elem, ek2, g.elem[ek2]);
        });

        summarizeCache = { flat: flat, pct: pct, elem: elem, learned: learned };
        return summarizeCache;
    }

    // ============ 对外口径 ============

    // 加值制战斗加成（并入 inventory.getCombatBonuses；combat-stats 直接吃这些键）
    function combatBonus() {
        var s = summarize();
        var b = {};
        if (s.flat.defense) b.defense = s.flat.defense;
        if (s.flat.speed) b.speed = s.flat.speed;
        if (s.flat.dodge) b.dodge = s.flat.dodge + (s.pct.dodgePct || 0);
        if (s.flat.counter) b.counter = s.flat.counter;
        if (s.pct.critPct) b.crit = s.pct.critPct;
        return b;
    }

    // 六维加成（并入 getFinalAttributes；all_attr 已按 ÷10 折点）
    function attrBonus() {
        var s = summarize();
        var all = s.flat.allAttr || 0;
        return {
            strength: all + (s.flat.strength || 0),
            dexterity: all + (s.flat.dexterity || 0),
            intelligence: all,
            willpower: all,
            constitution: all,
            meridian: all
        };
    }

    // 武器类攻击乘算百分点（按当前主手 weaponType 归类；不匹配的武器吃不到对应加成）
    var _WT_TO_ART = {
        sword: 'sword', longsword: 'sword', greatsword: 'sword', rapier: 'sword', blade: 'sword', knife: 'sword',
        saber: 'dao', dao: 'dao', cleaver: 'dao',
        fist: 'fist', glove: 'fist', gauntlet: 'fist',
        spear: 'spear', lance: 'spear', polearm: 'spear'
    };
    function weaponPct(weaponType) {
        var s = summarize();
        var artKey = _WT_TO_ART[weaponType || ''];
        var total = s.pct.attack || 0;
        if (artKey && s.pct[artKey]) total += s.pct[artKey];
        return total;
    }

    // 当前主手元素亲和（物品 elements 主元素）——元素伤加成只在施出对应属性招式/对克制敌型时出力
    function elemMap() {
        return summarize().elem;
    }

    // 恢复百分比
    function regenPct() {
        var s = summarize();
        return { qi: s.pct.qiRegen || 0, hp: s.pct.hpRegen || 0 };
    }

    // 真气上限加成（点数 + 百分点）
    function maxQiBonus() {
        var s = summarize();
        return { flat: s.flat.maxQi || 0, pct: s.pct.maxQiPct || 0 };
    }

    // 吸血功掌握（血饮刀法一脉）
    function hasLifesteal() {
        return !!summarize().flat._lifesteal;
    }

    // 第八十波·施毒/灼烧掌握（毒系/火系功法练上身——战斗能力表里的 venom/burn 现成钩子）
    function hasVenom() {
        return !!summarize().flat._venom;
    }
    function hasBurn() {
        return !!summarize().flat._burn;
    }

    // 面板文案
    function describe() {
        var s = summarize();
        if (!s.learned.length) return '';
        var parts = [];
        var f = s.flat, p = s.pct, e = s.elem;
        if (f.allAttr) parts.push('全属性+' + f.allAttr);
        if (f.strength) parts.push('力量+' + f.strength);
        if (f.dexterity) parts.push('灵巧+' + f.dexterity);
        if (f.defense) parts.push('防御+' + f.defense);
        if (f.speed) parts.push('速度+' + f.speed);
        if (f.dodge || p.dodgePct) parts.push('闪避+' + ((f.dodge || 0) + (p.dodgePct || 0)));
        if (f.counter) parts.push('反击+' + f.counter);
        if (p.critPct) parts.push('暴击+' + p.critPct);
        if (p.sword) parts.push('剑攻+' + p.sword + '%');
        if (p.dao) parts.push('刀攻+' + p.dao + '%');
        if (p.fist) parts.push('拳掌+' + p.fist + '%');
        if (p.spear) parts.push('枪攻+' + p.spear + '%');
        if (p.odd) parts.push('奇门+' + p.odd + '%');
        if (p.attack) parts.push('攻击+' + p.attack + '%');
        if (p.qiRegen) parts.push('真气恢复+' + p.qiRegen + '%');
        if (p.hpRegen) parts.push('血气恢复+' + p.hpRegen + '%');
        if (f.maxQi || p.maxQiPct) parts.push('真气上限+' + (f.maxQi || 0) + (p.maxQiPct ? '+' + p.maxQiPct + '%' : ''));
        var ELEM_NAMES = { fire: '火', ice: '冰', water: '水', metal: '金', wood: '木', earth: '土', thunder: '雷', wind: '风', void: '虚', dragon: '龙', demon: '魔' };
        // 七键同值、且真有「全系伤害」那门功法在场 ⇒ 合成一句报，别糊成七行。
        // 两条件缺一不可：否则「七门各给本系 +20」也会被误报成全系+20。
        var BATTLE_ELEM = ['fire', 'ice', 'water', 'metal', 'void', 'dragon', 'demon'];
        var uniform = 0;
        if ((p.allElem || 0) > 0 && BATTLE_ELEM.every(function (k) { return e[k] === e[BATTLE_ELEM[0]]; })) {
            uniform = e[BATTLE_ELEM[0]] || 0;
        }
        if (uniform > 0) parts.push('全系伤+' + uniform + '%');
        var elemText = [];
        for (var ek in e) {
            if (!e[ek] || !ELEM_NAMES[ek]) continue;
            if (uniform > 0 && BATTLE_ELEM.indexOf(ek) >= 0) continue;
            elemText.push(ELEM_NAMES[ek] + '伤+' + e[ek] + '%');
        }
        if (elemText.length) parts.push(elemText.join(' '));
        if (f._lifesteal) parts.push('吸血');
        if (f._venom) parts.push('施毒');
        if (f._burn) parts.push('灼烧');
        return parts.length ? ('功法加成（' + s.learned.length + '门）：' + parts.join('，')) : '';
    }

    // 掌握功法数（面板用）
    function learnedCount() { return summarize().learned.length; }

    // 有效上限真源：maxQi = (基础 + 功法点数) × (1 + 功法%) × 境界 qi 乘数；
    // maxHealth 恒为基础值（血量是 0~100 体系，health 乘数不适用）。
    function effMax(kind, base) {
        var b = Number(base);
        if (!isFinite(b)) b = 100;
        if (kind === 'maxQi') {
            var s = summarize();
            var bonus = s.flat.maxQi || 0;
            var pct = s.pct.maxQiPct || 0;
            var realm = (window.currentCharData && window.currentCharData.realm) || '';
            var realmMul = 1;
            try {
                if (realm && typeof window.getRealmBonus === 'function') realmMul = window.getRealmBonus(realm, 'qi') || 1;
            } catch (e) {}
            return Math.round((b + bonus) * (1 + pct / 100) * realmMul);
        }
        return b;
    }

    var api = {
        summarize: summarize,
        // v25.4：把 effect 字符串解析器露出去——功法融合要按同一口径读双亲效果再回写标准句，
        // 不允许第二把解析尺（融合出的效果串必须保证本模块读得回来）
        parseSkillEffect: _parseSkillEffect,
        combatBonus: combatBonus,
        attrBonus: attrBonus,
        weaponPct: weaponPct,
        elemMap: elemMap,
        regenPct: regenPct,
        maxQiBonus: maxQiBonus,
        hasLifesteal: hasLifesteal,
        hasVenom: hasVenom,
        hasBurn: hasBurn,
        describe: describe,
        learnedCount: learnedCount,
        effMax: effMax
    };

    window.ArtEffects = api;
    if (window.XianXia) window.XianXia.ArtEffects = api;

    // 全局便捷：getEffectiveMax('maxQi') / ('maxHealth') —— 各处上限判断统一走这里
window.getEffectiveMax = function (kind) {
  var cd = window.currentCharData || {};
  // 第一百四十二批（RE-10 定案）：原式只有两支——`maxQi` 走真源，其余**一律回落 maxHealth**。
  // 于是 `getEffectiveMax('energy')` 读的是**生命值上限**。
  // 受害点：js/city-facilities/teahouse-leisure.js:46-50 的 `maxEnergy()`，它正是精力上限的读点
  // （该文件 109-111 行的注释早把这条病写清楚了，只是留着「两把尺择一待裁决」）。
  // 裁决方向：**精力上限就是 maxEnergy**——通道那侧（app.js:7141 的精力条）读的正是
  // `cd.maxEnergy`，茶馆这一侧才是异类。补上第三支即可，effMax 对非 maxQi 原样返回（:366），
  // 所以精力不会凭空多出功法加成——那里本来就没有这个机制。
  var base;
  if (kind === 'maxQi') base = Number(cd.maxQi) || 100;
  else if (kind === 'energy') base = Number(cd.maxEnergy) || 100;
  else base = Number(cd.maxHealth) || 100;
  try { return api.effMax(kind, base); } catch (e) { return base; }
};
})();
