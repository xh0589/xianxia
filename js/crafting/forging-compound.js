// ==================== forging-compound.js - 炼器·材料词缀 (v19.5 P1-2) ====================
// 对标 v18.8 路线图 §4 P1-2：法器 = 器胚 + 主材 + 辅材 + 铭纹/阵纹，材料标签决定 1~3 词缀。
// 不动 crafting.js 旧 fixed 路径；新走 executeCompoundForging。
// 第二十六波 · 锻器品质段：器有品相——炉火（锻造技能±20）六成 + 工法（词缀/铭纹）四成，评出五档；
//   品相真动数值（劣质七折、极品翻倍），极品出炉成双（同款多一件），名品定模（同款器的模子按最精的一件记）；
//   洞府炼器台的「品质+1段」从此有处兑现。

(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    // ============== 1. 材料标签映射（v19.5 P1-2） ==============
    // 基于 04-materials.js 既有 mat_* 名称推断；新标签通过 tags 数组描述其对应词缀类型
    var MATERIAL_TAGS = {
        // 玄铁类
        mat_iron_ore:        ['metal-basic'],
        mat_refined_iron:    ['metal-basic', 'magnetic'],
        mat_dark_iron:       ['xuantie', 'metal-heavy'],
        mat_cold_iron:       ['xuantie', 'frost', 'metal-heavy'],
        mat_mithril:         ['xuantie', 'luminance', 'light'],
        mat_meteorite:       ['meteor', 'star', 'metal-heavy'],
        mat_fire_crystal:    ['fenghuang', 'fire'],
        mat_purple_gold:     ['long', 'metal-heavy', 'noble'],
        mat_dragon_scale_iron:['long', 'xuantie'],
        mat_sky_iron:        ['meteor', 'xuantie'],
        mat_star_iron:       ['star', 'meteor'],
        // 雷晶
        mat_thunder_crystal: ['leijing', 'thunder'],  // 可能不存在
        // 凤羽
        mat_phoenix_feather: ['fenghuang', 'fire'],     // 可能不存在
        mat_phoenix_blood:   ['fenghuang', 'fire'],
        // 阴魂（暂无 mat_，但允许兽类/灵草等替代）
        mat_beast_soul:      ['yinhun'],                // 预留
        mat_demon_beast_core:['yinhun', 'fire'],
        mat_demon_beast_bone:['yinhun', 'beast'],
        // 龙类
        mat_dragon_scale:    ['long'],
        mat_dragon_bone:     ['long', 'beast'],
        mat_dragon_blood:    ['long', 'fire'],
        mat_dragon_crystal:  ['long', 'leijing'],
        // 兽类基础
        mat_beast_skin:      ['beast'],
        mat_beast_bone:      ['beast'],
        mat_demon_beast_skin:['beast', 'yinhun'],
        // 矿/铜
        mat_copper_ore:      ['metal-basic'],
        mat_refined_copper:  ['metal-basic', 'luminance'],
        mat_tin_ore:         ['metal-basic'],
        // 五行精华
        mat_five_element_essence:['noble', 'luminance']
    };

    // ============== 2. 词缀池（v19.5 P1-2 候选 15 个） ==============
    // attrKey/attrVal: 写入 item.attrs 或 combatBonus
    // proc: 战斗逻辑读取时判定（不参与本计划实际效果）
    // minForgeSkill: 词缀最低锻造技能门槛
    var AFFIX_POOL = [
        // 玄铁
        { key:'sturdy',     name:'坚固',  tag:'xuantie',     attrKey:'defense',   attrVal:8,   minForgeSkill:10 },
        { key:'heavy',      name:'厚重',  tag:'xuantie',     attrKey:'weight',    attrVal:2,   minForgeSkill:15, allowInverse:true }, // weight 增
        { key:'reflect',    name:'反震',  tag:'xuantie',     proc:'reflect2',                  minForgeSkill:30 },
        // 雷晶
        { key:'thunder',    name:'雷击',  tag:'leijing',     attrKey:'thunderDmg',attrVal:12,  minForgeSkill:20 },
        { key:'paralysis',  name:'麻痹',  tag:'leijing',     proc:'stun1',                     minForgeSkill:35 },
        // 凤羽
        { key:'blazing',    name:'炽焰',  tag:'fenghuang',   attrKey:'fireDmg',   attrVal:15,  minForgeSkill:20 },
        { key:'swift',      name:'疾风',  tag:'fenghuang',   attrKey:'speed',     attrVal:5,   minForgeSkill:25 },
        { key:'rebirth',    name:'涅槃',  tag:'fenghuang',   proc:'rebirth10',                 minForgeSkill:60 },
        // 阴魂
        { key:'soul_eat',   name:'噬魂',  tag:'yinhun',      attrKey:'divine',    attrVal:10,  minForgeSkill:25 },
        { key:'curse',      name:'诅咒',  tag:'yinhun',      proc:'curse3',                    minForgeSkill:40 },
        // 龙类
        { key:'dragon_might',name:'龙威',  tag:'long',        attrKey:'hp',        attrVal:50,  minForgeSkill:30 },
        { key:'dragon_breath',name:'龙息', tag:'long',        attrKey:'fireDmg',   attrVal:8,   minForgeSkill:40 },
        // 陨铁
        { key:'starbreak',  name:'碎星',  tag:'meteor',      attrKey:'critRate',  attrVal:5,   minForgeSkill:30 },
        { key:'starfall',   name:'星陨',  tag:'meteor',      proc:'aoe',                       minForgeSkill:55 },
        // 星辰
        { key:'spirit',     name:'聚灵',  tag:'star',        attrKey:'qiRegen',   attrVal:3,   minForgeSkill:25 },
        { key:'tongtian',   name:'通天',  tag:'star',        attrKey:'divine',    attrVal:15,  minForgeSkill:50 },
        // 通用
        { key:'sharp',      name:'锋利',  tag:'*',           attrKey:'attack',    attrVal:8,   minForgeSkill:5 },
        { key:'agile',      name:'轻灵',  tag:'*',           attrKey:'weight',    attrVal:-1,  minForgeSkill:15, allowInverse:true },
        { key:'precise',    name:'精密',  tag:'*',           attrKey:'critRate',  attrVal:3,   minForgeSkill:20 }
    ];

    // 标签 → 词缀 key 列表（缓存）
    var AFFIX_BY_TAG = (function () {
        var m = {};
        for (var i = 0; i < AFFIX_POOL.length; i++) {
            var a = AFFIX_POOL[i];
            if (a.tag === '*') continue;
            (m[a.tag] = m[a.tag] || []).push(a);
        }
        return m;
    })();

    // ============== 3. 器胚（5 类） ==============
    var EMBRYOS = {
        sword:    { id:'emp_sword',    name:'剑胚',    slot:'mainHand', subtype:'sword',   baseDamage:'slash',  baseAttrs:{ attack:5,  speed:2 } },
        blade:    { id:'emp_blade',    name:'刀胚',    slot:'mainHand', subtype:'blade',   baseDamage:'slash',  baseAttrs:{ attack:7,  speed:1 } },
        armor:    { id:'emp_armor',    name:'甲胚',    slot:'armor',    subtype:'armor',   baseDamage:null,      baseAttrs:{ defense:8, hp:20 } },
        flying:   { id:'emp_flying',   name:'飞剑胚',  slot:'mainHand', subtype:'sword',   baseDamage:'pierce', baseAttrs:{ attack:4,  speed:5, qiRegen:2 } },
        heavy:    { id:'emp_heavy',    name:'重兵胚',  slot:'mainHand', subtype:'heavy',   baseDamage:'crush',  baseAttrs:{ attack:10, defense:3 } }
    };

    // ============== 4. 开放炼器方（5 张关键） ==============
    var COMPOUND_FORGING_RECIPES = [
        {
            id: 'recipe_sword_open',  name: '长剑·开放',    category: 'forging', tags: ['开放配方', '武器', '剑'],
            requiredSkills: { '锻造': 20 },
            slots: { embryo:{type:'sword'},  main:{count:1, minForgeSkill:20}, assist:{count:2}, rune:{count:1, optional:true, minForgeSkill:40} },
            result: { itemId: 'wpn_compound_sword', count: 1, namePrefix: true, allowImprint: true },
            qiCost: 50, timeCost: 40
        },
        {
            id: 'recipe_blade_open',  name: '长刀·开放',    category: 'forging', tags: ['开放配方', '武器', '刀'],
            requiredSkills: { '锻造': 30 },
            slots: { embryo:{type:'blade'},  main:{count:1, minForgeSkill:30}, assist:{count:2}, rune:{count:1, optional:true, minForgeSkill:50} },
            result: { itemId: 'wpn_compound_blade', count: 1, namePrefix: true, allowImprint: true },
            qiCost: 60, timeCost: 45
        },
        {
            id: 'recipe_armor_open',  name: '护甲·开放',    category: 'forging', tags: ['开放配方', '护甲'],
            requiredSkills: { '锻造': 25 },
            slots: { embryo:{type:'armor'},  main:{count:1, minForgeSkill:25}, assist:{count:2}, rune:{count:1, optional:true, minForgeSkill:45} },
            result: { itemId: 'arm_compound_armor', count: 1, namePrefix: true, allowImprint: true },
            qiCost: 70, timeCost: 50
        },
        {
            id: 'recipe_flying_open', name: '飞剑·开放',    category: 'forging', tags: ['开放配方', '武器', '飞剑'],
            requiredSkills: { '锻造': 50 },
            slots: { embryo:{type:'flying'}, main:{count:1, minForgeSkill:50}, assist:{count:2}, rune:{count:1, optional:true, minForgeSkill:60} },
            result: { itemId: 'wpn_compound_flying', count: 1, namePrefix: true, allowImprint: true },
            qiCost: 120, timeCost: 90
        },
        {
            id: 'recipe_heavy_open',  name: '重兵·开放',    category: 'forging', tags: ['开放配方', '武器', '重兵'],
            requiredSkills: { '锻造': 40 },
            slots: { embryo:{type:'heavy'},  main:{count:1, minForgeSkill:40}, assist:{count:2}, rune:{count:1, optional:true, minForgeSkill:55} },
            result: { itemId: 'wpn_compound_heavy', count: 1, namePrefix: true, allowImprint: true },
            qiCost: 90, timeCost: 70
        }
    ];

    // ============== 5. 工具 ==============

    function getMaterialTags(matId) {
        return MATERIAL_TAGS[matId] || [];
    }

    // F-25 恢复：可注入的随机源（测试传 deterministic randomSource 消除波动；未注入时行为与原来一致）
    var _rng = function () { return Math.random(); };

    function pickAffixesForMat(matId, maxCount, skill) {
        var tags = getMaterialTags(matId);
        var candidates = [];
        // 收集匹配 tag 的所有 affix
        for (var t = 0; t < tags.length; t++) {
            var arr = AFFIX_BY_TAG[tags[t]] || [];
            for (var i = 0; i < arr.length; i++) {
                if (arr[i].minForgeSkill <= skill) candidates.push(arr[i]);
            }
        }
        // 通用 affix
        for (var j = 0; j < AFFIX_POOL.length; j++) {
            if (AFFIX_POOL[j].tag === '*' && AFFIX_POOL[j].minForgeSkill <= skill) candidates.push(AFFIX_POOL[j]);
        }
        // 去重 by key
        var seen = {};
        var uniq = [];
        for (var k = 0; k < candidates.length; k++) {
            if (!seen[candidates[k].key]) { seen[candidates[k].key] = 1; uniq.push(candidates[k]); }
        }
        // 随机取 1~maxCount
        uniq.sort(function () { return _rng() - 0.5; });
        return uniq.slice(0, Math.min(maxCount, uniq.length));
    }

    // 技能"保留想要词缀"概率：技能越高越倾向保留高价值（按 attrVal 排序）词缀
    function keepAffixBySkill(affix, skill) {
        var keepProb = Math.min(0.95, 0.4 + skill * 0.005);
        return _rng() < keepProb;
    }

    // ============== 5.5 第二十六波 · 锻器品质段（器有品相——同料同火，出炉有高下；炼器台「品质+1段」从此有处兑现） ==============
    var QUALITY_LADDER = [
        { id: 'poor', name: '劣质', mult: 0.7, color: 'gray' },
        { id: 'normal', name: '普通', mult: 1.0, color: 'white' },
        { id: 'good', name: '优良', mult: 1.2, color: 'blue' },
        { id: 'excellent', name: '杰出', mult: 1.5, color: 'gold' },
        { id: 'imperial', name: '极品', mult: 2.0, color: 'purple' }
    ];
    function qualityIndex(id) {
        for (var i = 0; i < QUALITY_LADDER.length; i++) if (QUALITY_LADDER[i].id === id) return i;
        return 1;
    }
    // 炉火＝锻造技能±20（与炼丹火候同一把尺）；工法＝词缀与铭纹定底。
    // 评分 0.6×炉火 + 0.4×工法 → 品质五段；炼器台的 qualityBoost 每点抬一段（封顶极品）。
    // 第二十九波 · 锻火试炼：玩家亲自控火的得分替代随机炉火（fire-qte 写 _forgingFireBonus，消费即清）；
    // 受锻造手艺封顶（不超过 手艺+20，与原随机上限同一口径）——低手艺绕不过去，高手艺控火才出极品。
    function rollQuality(skill, affixCount, isImprint) {
        var sk = Number(skill) || 0;
        var fire;
        if (typeof window._forgingFireBonus === 'number' && window._forgingFireBonus >= 0) {
            fire = Math.max(0, Math.min(100, Math.min(window._forgingFireBonus, sk + 20)));
            window._forgingFireBonus = null; // 消费即清——一炉火只管一炉
        } else {
            fire = Math.max(0, Math.min(100, sk + (_rng() * 40 - 20)));
        }
        var craft = Math.min(100, Math.round((Number(affixCount) || 0) / 3 * 70) + (isImprint ? 30 : 0));
        var score = Math.round(fire * 0.6 + craft * 0.4);
        var qi = score >= 85 ? 4 : score >= 70 ? 3 : score >= 50 ? 2 : score >= 30 ? 1 : 0;
        try {
            if (window.CaveFacilities && typeof window.CaveFacilities.getBuff === 'function') {
                var qb = Math.floor(Number(window.CaveFacilities.getBuff('player', 'qualityBoost')) || 0);
                if (qb > 0) qi = Math.min(QUALITY_LADDER.length - 1, qi + qb);
            }
        } catch (e) {}
        return { quality: QUALITY_LADDER[qi], score: score };
    }

    // ============== 6. executeCompoundForging ==============

    function executeCompoundForging(recipeId, slotPick, options) {
        var _prevRng = _rng;
        if (options && typeof options.randomSource === 'function') _rng = options.randomSource;
        try { return _forgingInner(recipeId, slotPick); } finally { _rng = _prevRng; }
    }
    function _forgingInner(recipeId, slotPick) {
        var recipe = null;
        for (var i = 0; i < COMPOUND_FORGING_RECIPES.length; i++) if (COMPOUND_FORGING_RECIPES[i].id === recipeId) { recipe = COMPOUND_FORGING_RECIPES[i]; break; }
        if (!recipe) return { ok: false, reason: 'recipe-not-found' };
        if (!slotPick || !slotPick.embryo) return { ok: false, reason: 'empty-embryo' };
        // 器胚校验
        var embryo = EMBRYOS[slotPick.embryo];
        if (!embryo) return { ok: false, reason: 'embryo-not-found' };
        if (recipe.slots.embryo.type !== slotPick.embryo) return { ok: false, reason: 'embryo-type-mismatch(need ' + recipe.slots.embryo.type + ')' };
        // 技能检查
        if (recipe.requiredSkills) {
            for (var sk in recipe.requiredSkills) {
                var lv = (typeof window.getLifeSkill === 'function') ? window.getLifeSkill(sk) : ((window.currentCharData && window.currentCharData.lifeSkills) ? (window.currentCharData.lifeSkills[sk] || 0) : 0);
                if (lv < recipe.requiredSkills[sk]) return { ok: false, reason: 'skill-low(' + sk + ':' + lv + '<' + recipe.requiredSkills[sk] + ')' };
            }
        }
        var skill = (typeof window.getLifeSkill === 'function') ? window.getLifeSkill('锻造') : 0;
        // 槽位校验
        var slots = recipe.slots;
        if (!slotPick.main || slotPick.main.length !== slots.main.count) return { ok: false, reason: 'main-count-mismatch(need ' + slots.main.count + ',got ' + (slotPick.main ? slotPick.main.length : 0) + ')' };
        if (!slotPick.assist || slotPick.assist.length !== slots.assist.count) return { ok: false, reason: 'assist-count-mismatch' };
        if (!slots.rune.optional) {
            if (!slotPick.rune || slotPick.rune.length !== slots.rune.count) return { ok: false, reason: 'rune-count-mismatch' };
        } else if (slotPick.rune && slotPick.rune.length > 0 && skill < slots.rune.minForgeSkill) {
            return { ok: false, reason: 'rune-skill-low(' + skill + '<' + slots.rune.minForgeSkill + ')' };
        }
        // 真气
        var cd = (typeof window.getCurrentCharData === 'function') ? window.getCurrentCharData() : window.currentCharData;
        if (cd && recipe.qiCost && (cd.qi || 0) < recipe.qiCost) return { ok: false, reason: 'qi-low' };
        // v23.0 材料实扣：旧版器胚与材标签全白嫖（只扣真气）——现在主材/辅材/铭纹照单入账，
        // 扣不起整炉不开（真气分文不动）；器胚是形制不是实物，不入账。
        var _forgMats = slotPick.main.concat(slotPick.assist).concat(slotPick.rune || []);
        if (window.compoundMat && typeof window.compoundMat.consume === 'function') {
            if (!window.compoundMat.consume(_forgMats)) return { ok: false, reason: 'material-short' };
        }
        // 抽词缀
        var allAffixes = [];
        for (var m = 0; m < slotPick.main.length; m++) {
            var affs = pickAffixesForMat(slotPick.main[m], 3, skill);
            for (var a = 0; a < affs.length; a++) {
                if (keepAffixBySkill(affs[a], skill)) allAffixes.push(affs[a]);
            }
        }
        for (var am = 0; am < slotPick.assist.length; am++) {
            var affs2 = pickAffixesForMat(slotPick.assist[am], 2, skill);
            for (var a2 = 0; a2 < affs2.length; a2++) {
                if (keepAffixBySkill(affs2[a2], skill)) allAffixes.push(affs2[a2]);
            }
        }
        // 铭纹词缀
        var isImprint = false;
        if (slotPick.rune && slotPick.rune.length > 0) {
            isImprint = true;
            for (var r = 0; r < slotPick.rune.length; r++) {
                var affs3 = pickAffixesForMat(slotPick.rune[r], 2, skill);
                for (var a3 = 0; a3 < affs3.length; a3++) {
                    if (keepAffixBySkill(affs3[a3], skill)) allAffixes.push(affs3[a3]);
                }
            }
        }
        // 去重
        var seenK = {};
        var finalAffixes = [];
        for (var f = 0; f < allAffixes.length; f++) {
            if (!seenK[allAffixes[f].key]) { seenK[allAffixes[f].key] = 1; finalAffixes.push(allAffixes[f]); }
        }
        // 限制最多 3 个词缀（路线图）
        if (finalAffixes.length > 3) finalAffixes = finalAffixes.slice(0, 3);
        // 第二十六波：出炉的器有品相——炉火看手艺，工法看词缀铭纹
        var qr = rollQuality(skill, finalAffixes.length, isImprint);
        var quality = qr.quality;
        // 计算最终 attrs / combatBonus
        var finalAttrs = Object.assign({}, embryo.baseAttrs);
        var finalCombatBonus = {};
        for (var fa = 0; fa < finalAffixes.length; fa++) {
            var aff = finalAffixes[fa];
            if (aff.attrKey && aff.attrVal != null) {
                if (aff.attrKey === 'attack' || aff.attrKey === 'defense' || aff.attrKey === 'speed' || aff.attrKey === 'critRate' || aff.attrKey === 'thunderDmg' || aff.attrKey === 'fireDmg' || aff.attrKey === 'hp' || aff.attrKey === 'divine' || aff.attrKey === 'qiRegen') {
                    finalCombatBonus[aff.attrKey] = (finalCombatBonus[aff.attrKey] || 0) + aff.attrVal;
                } else {
                    finalAttrs[aff.attrKey] = (finalAttrs[aff.attrKey] || 0) + aff.attrVal;
                }
            }
        }
        // 品相真动数值：劣质是糟蹋料，极品是绝世兵（重量不动——铁有多沉就是多沉）
        if (quality.mult !== 1) {
            for (var qk in finalCombatBonus) finalCombatBonus[qk] = Math.max(1, Math.round(finalCombatBonus[qk] * quality.mult));
            for (var qa in finalAttrs) { if (qa !== 'weight') finalAttrs[qa] = Math.max(1, Math.round((Number(finalAttrs[qa]) || 0) * quality.mult)); }
        }
        // 命名（劣/优/杰/极带品相字头，普通不加——中不溜才是常态）
        var prefix = finalAffixes.length > 0 ? finalAffixes.map(function (a) { return a.name; }).join('·') + '·' : '';
        var qTag = quality.id === 'normal' ? '' : quality.name + '·';
        var finalName = qTag + prefix + embryo.name;
        // 扣真气
        if (cd && recipe.qiCost) cd.qi = (cd.qi || 0) - recipe.qiCost;
        // 落物品：构造 item instance——第二十六波改「名品定模」：同款器的模子按最精的一件记（旧规矩是头一炉定模，往后再精也白炼）
        var templateId = recipe.result.itemId;
        var template = window.itemById && window.itemById[templateId];
        var oldQ = (template && template._forgeQuality != null) ? qualityIndex(template._forgeQuality) : -1;
        if (window.itemById && (!template || qualityIndex(quality.id) >= oldQ)) {
            window.itemById[templateId] = {
                id: templateId,
                name: finalName,
                type: 'equipment',
                subtype: embryo.subtype,
                slot: embryo.slot,
                category: 'equipment',
                quality: 'PIN9',
                level: 1,
                price: Math.round(100 * quality.mult),
                attrs: finalAttrs,
                combatBonus: finalCombatBonus,
                damageType: embryo.baseDamage || 'slash',
                weight: finalAttrs.weight || 1.5,
                _forgeQuality: quality.id,
                desc: '由' + slotPick.main.concat(slotPick.assist).join('/') + '炼成的' + finalName + '（' + quality.name + '·工评' + qr.score + '）'
            };
        }
        // 极品出炉成双：同款多一件（可赠可卖）
        var outCount = Math.max(1, recipe.result.count || 1) + (quality.id === 'imperial' ? 1 : 0);
        // 落物品到背包
        var addedOk = true;
        if (typeof window.addResultItem === 'function') {
            addedOk = window.addResultItem(templateId, outCount);
        }
        if (!addedOk) {
            if (cd && recipe.qiCost) cd.qi = (cd.qi || 0) + recipe.qiCost;
            // v23.0 炉没开成，材料原路退回
            if (window.compoundMat && typeof window.compoundMat.refund === 'function') {
                try { window.compoundMat.refund(_forgMats); } catch (eRf) {}
            }
            return { ok: false, reason: 'inventory-full' };
        }
        // 时间推进
        if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
            try { window.timeSystem.advanceTime(recipe.timeCost || 10, 'forging-compound'); } catch (e) {}
        }
        // 事件总线
        if (typeof window.EventBus !== 'undefined') {
            var evtName = isImprint ? 'forging:compound:imprint' : 'forging:compound:success';
            window.EventBus.emit(evtName, { recipeId: recipeId, itemId: templateId, name: finalName, affixes: finalAffixes.map(function (a) { return a.key; }), imprint: isImprint, quality: quality.id, score: qr.score });
        }
        // v20.94 熟能生巧：锻兵落地长锻造（铭纹是大活，长得多）
        if (typeof window.growLifeSkill === 'function') {
            window.growLifeSkill('锻造', isImprint ? 3 : 2, { reason: isImprint ? '铭纹锻兵' : '复合锻造' });
        }
        // StateRegistry
        try {
            _moduleState.lastWeapons.unshift({ recipeId: recipeId, name: finalName, affixes: finalAffixes.map(function (a) { return a.key; }), imprint: isImprint, quality: quality.id, day: (window.WorldCalendar ? window.WorldCalendar.day : 0) });
            if (_moduleState.lastWeapons.length > 20) _moduleState.lastWeapons.pop();
            if (isImprint) _moduleState.imprintCount++;
            for (var fa2 = 0; fa2 < finalAffixes.length; fa2++) {
                var tagAff = finalAffixes[fa2].tag || 'common';
                _moduleState.preferTags[tagAff] = (_moduleState.preferTags[tagAff] || 0) + 1;
            }
        } catch (e) {}
        return { ok: true, itemId: templateId, name: finalName, affixes: finalAffixes, combatBonus: finalCombatBonus, imprint: isImprint, quality: quality, score: qr.score, count: outCount };
    }

    // ============== 7. 模块级状态（StateRegistry 兼容） ==============
    var _moduleState = {
        lastWeapons: [],
        imprintCount: 0,
        preferTags: {} // tag -> count
    };

    function _exportState() { return JSON.parse(JSON.stringify(_moduleState)); }
    function _importState(s) {
        if (!s) return;
        if (Array.isArray(s.lastWeapons)) _moduleState.lastWeapons = s.lastWeapons.slice(0, 20);
        _moduleState.imprintCount = s.imprintCount || 0;
        _moduleState.preferTags = s.preferTags || {};
    }
    function _resetState() {
        _moduleState.lastWeapons = [];
        _moduleState.imprintCount = 0;
        _moduleState.preferTags = {};
    }

    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        try {
            window.StateRegistry.register('forgingConfig', { version: 1, export: _exportState, import: _importState, reset: _resetState });
        } catch (e) {}
    }

    // ============== 8. 导出 ==============
    window.ForgingCompound = {
        MATERIAL_TAGS: MATERIAL_TAGS,
        AFFIX_POOL: AFFIX_POOL,
        AFFIX_BY_TAG: AFFIX_BY_TAG,
        EMBRYOS: EMBRYOS,
        COMPOUND_FORGING_RECIPES: COMPOUND_FORGING_RECIPES,
        QUALITY_LADDER: QUALITY_LADDER,
        getMaterialTags: getMaterialTags,
        pickAffixesForMat: pickAffixesForMat,
        keepAffixBySkill: keepAffixBySkill,
        rollQuality: rollQuality,
        qualityIndex: qualityIndex,
        executeCompoundForging: executeCompoundForging,
        getState: function () { return _moduleState; }
    };
    if (window.XianXia) window.XianXia.ForgingCompound = window.ForgingCompound;
    try { console.log('[ForgingCompound] initialized v1 (' + Object.keys(MATERIAL_TAGS).length + ' tagged mats, ' + AFFIX_POOL.length + ' affixes, ' + Object.keys(EMBRYOS).length + ' embryos, ' + COMPOUND_FORGING_RECIPES.length + ' open recipes；第二十六波添锻器品质段：炉火工法定五档·名品定模·极品成双·炼器台抬段)'); } catch (e) {}
})();
