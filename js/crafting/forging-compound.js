// ==================== forging-compound.js - 炼器·材料词缀 (v19.5 P1-2) ====================
// 对标 v18.8 路线图 §4 P1-2：法器 = 器胚 + 主材 + 辅材 + 铭纹/阵纹，材料标签决定 1~3 词缀。
// 不动 crafting.js 旧 fixed 路径；新走 executeCompoundForging。

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
        uniq.sort(function () { return Math.random() - 0.5; });
        return uniq.slice(0, Math.min(maxCount, uniq.length));
    }

    // 技能"保留想要词缀"概率：技能越高越倾向保留高价值（按 attrVal 排序）词缀
    function keepAffixBySkill(affix, skill) {
        var keepProb = Math.min(0.95, 0.4 + skill * 0.005);
        return Math.random() < keepProb;
    }

    // ============== 6. executeCompoundForging ==============

    function executeCompoundForging(recipeId, slotPick) {
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
        // 命名
        var prefix = finalAffixes.length > 0 ? finalAffixes.map(function (a) { return a.name; }).join('·') + '·' : '';
        var finalName = prefix + embryo.name;
        // 扣真气
        if (cd && recipe.qiCost) cd.qi = (cd.qi || 0) - recipe.qiCost;
        // 落物品：构造 item instance（itemById 模板若不存在则临时构造）
        var templateId = recipe.result.itemId;
        var template = window.itemById && window.itemById[templateId];
        if (!template) {
            // 临时构造最小模板并加入 itemById
            if (window.itemById) {
                window.itemById[templateId] = {
                    id: templateId,
                    name: finalName,
                    type: embryo.slot === 'armor' ? 'equipment' : 'equipment',
                    subtype: embryo.subtype,
                    slot: embryo.slot,
                    category: 'equipment',
                    quality: 'COMMON',
                    level: 1,
                    price: 100,
                    attrs: finalAttrs,
                    combatBonus: finalCombatBonus,
                    damageType: embryo.baseDamage || 'slash',
                    weight: finalAttrs.weight || 1.5,
                    desc: '由' + slotPick.main.concat(slotPick.assist).join('/') + '炼成的' + finalName
                };
            }
        }
        // 落物品到背包
        var addedOk = true;
        if (typeof window.addResultItem === 'function') {
            addedOk = window.addResultItem(templateId, recipe.result.count);
        }
        if (!addedOk) {
            if (cd && recipe.qiCost) cd.qi = (cd.qi || 0) + recipe.qiCost;
            return { ok: false, reason: 'inventory-full' };
        }
        // 时间推进
        if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
            try { window.timeSystem.advanceTime(recipe.timeCost || 10, 'forging-compound'); } catch (e) {}
        }
        // 事件总线
        if (typeof window.EventBus !== 'undefined') {
            var evtName = isImprint ? 'forging:compound:imprint' : 'forging:compound:success';
            window.EventBus.emit(evtName, { recipeId: recipeId, itemId: templateId, name: finalName, affixes: finalAffixes.map(function (a) { return a.key; }), imprint: isImprint });
        }
        // StateRegistry
        try {
            _moduleState.lastWeapons.unshift({ recipeId: recipeId, name: finalName, affixes: finalAffixes.map(function (a) { return a.key; }), imprint: isImprint, day: (window.WorldCalendar ? window.WorldCalendar.day : 0) });
            if (_moduleState.lastWeapons.length > 20) _moduleState.lastWeapons.pop();
            if (isImprint) _moduleState.imprintCount++;
            for (var fa2 = 0; fa2 < finalAffixes.length; fa2++) {
                var tagAff = finalAffixes[fa2].tag || 'common';
                _moduleState.preferTags[tagAff] = (_moduleState.preferTags[tagAff] || 0) + 1;
            }
        } catch (e) {}
        return { ok: true, itemId: templateId, name: finalName, affixes: finalAffixes, combatBonus: finalCombatBonus, imprint: isImprint };
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
        getMaterialTags: getMaterialTags,
        pickAffixesForMat: pickAffixesForMat,
        keepAffixBySkill: keepAffixBySkill,
        executeCompoundForging: executeCompoundForging,
        getState: function () { return _moduleState; }
    };
    if (window.XianXia) window.XianXia.ForgingCompound = window.ForgingCompound;
    try { console.log('[ForgingCompound] initialized v1 (' + Object.keys(MATERIAL_TAGS).length + ' tagged mats, ' + AFFIX_POOL.length + ' affixes, ' + Object.keys(EMBRYOS).length + ' embryos, ' + COMPOUND_FORGING_RECIPES.length + ' open recipes)'); } catch (e) {}
})();
