// ==================== alchemy-compound.js - 药性炼丹 (v19.4 P1-1) ====================
// 对标 v18.8 路线图 §4 P1-1：炼丹从"固定配方"扩展为"主药+辅药+调和"流派。
// 不动 crafting.js 旧路径；本模块独立运行，由 executeCrafting 的 compound 分支走新函数。

(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    // ============== 1. 药材 4 维属性表（v19.4 P1-1） ==============
    // 五行（0~1 归一权重），药性 0~100（0=寒 50=平 100=烈），主效 + 毒性 0~100。
    // 数据基于既有 mat_* 名称推断：和缓本草→疗伤/回气；天心花/蟠桃→突破；凤血草/龙涎草→炼体/神识。
    // 找不到的药材走默认：寒平、无主效、低毒。
    var MATERIAL_PROPS = {
        mat_liquorice:           { element: { metal:0, wood:0.2, water:0, fire:0, earth:0.8 }, nature: 30, primary: { heal: 60, qi: 20 }, toxic: 5 },
        mat_scutellaria:         { element: { metal:0, wood:0.3, water:0, fire:0.4, earth:0.3 }, nature: 55, primary: { heal: 50, detox: 40 }, toxic: 10 },
        mat_lingzhi:             { element: { metal:0, wood:0.7, water:0.1, fire:0, earth:0.2 }, nature: 45, primary: { heal: 50, qi: 50 }, toxic: 10 },
        mat_ginseng:             { element: { metal:0, wood:0.4, water:0.2, fire:0, earth:0.4 }, nature: 50, primary: { qi: 60, heal: 40 }, toxic: 8 },
        mat_snow_lotus:          { element: { metal:0.1, wood:0.2, water:0.6, fire:0, earth:0.1 }, nature: 15, primary: { heal: 50, detox: 60 }, toxic: 12 },
        mat_he_shou_wu:          { element: { metal:0, wood:0.3, water:0.5, fire:0, earth:0.2 }, nature: 40, primary: { heal: 60, qi: 30, body: 20 }, toxic: 20 },
        mat_thousand_lingzhi:    { element: { metal:0, wood:0.7, water:0.2, fire:0, earth:0.1 }, nature: 60, primary: { breakthrough: 80, qi: 40 }, toxic: 25 },
        mat_ten_thousand_ginseng:{ element: { metal:0, wood:0.5, water:0.2, fire:0, earth:0.3 }, nature: 70, primary: { breakthrough: 70, qi: 70 }, toxic: 30 },
        mat_dragon_saliva:       { element: { metal:0.2, wood:0.3, water:0.5, fire:0, earth:0 }, nature: 50, primary: { divine: 80, qi: 50 }, toxic: 35 },
        mat_phoenix_blood_grass: { element: { metal:0, wood:0.1, water:0, fire:0.9, earth:0 }, nature: 90, primary: { body: 80, heal: 40 }, toxic: 50 },
        mat_heaven_heart_flower: { element: { metal:0, wood:0.5, water:0.2, fire:0.2, earth:0.1 }, nature: 75, primary: { breakthrough: 90, divine: 50 }, toxic: 40 },
        mat_earth_spirit_root:   { element: { metal:0.1, wood:0.1, water:0, fire:0, earth:0.8 }, nature: 45, primary: { body: 50, heal: 30 }, toxic: 15 },
        mat_nine_leaf_lingzhi:   { element: { metal:0, wood:0.8, water:0.2, fire:0, earth:0 }, nature: 75, primary: { breakthrough: 85, heal: 60, qi: 60 }, toxic: 35 },
        mat_peach_fruit:         { element: { metal:0, wood:0.5, water:0.3, fire:0, earth:0.2 }, nature: 65, primary: { breakthrough: 70, heal: 70, qi: 50 }, toxic: 25 },
        mat_dragon_blood:        { element: { metal:0.2, wood:0.1, water:0, fire:0.7, earth:0 }, nature: 95, primary: { body: 90, breakthrough: 60 }, toxic: 60 },
        mat_five_element_essence:{ element: { metal:0.2, wood:0.2, water:0.2, fire:0.2, earth:0.2 }, nature: 55, primary: { breakthrough: 50, qi: 60, heal: 50 }, toxic: 30 },
        mat_phoenix_blood:       { element: { metal:0, wood:0, water:0, fire:1.0, earth:0 }, nature: 100, primary: { body: 95, breakthrough: 60 }, toxic: 70 },
        mat_chaos_stone:         { element: { metal:0.2, wood:0.2, water:0.2, fire:0.2, earth:0.2 }, nature: 80, primary: { breakthrough: 70, divine: 70, body: 70 }, toxic: 55 }
    };

    // ============== 2. 开放药性丹方（v19.4 P1-1 关键 5 张） ==============
    // 槽位：main(主药) / assist(辅药) / balancer(调和)
    // minElement: 五行加权和阈值；minPrimary: 主效加权阈值；minNature/maxNature: 药性范围；maxToxic: 最大毒性
    // 结果：allowFlaw=true 时毒性超 flawThreshold 自动改 _flaw 后缀
    var COMPOUND_PILFAR_RECIPES = [
        {
            id: 'recipe_zhuji_open',
            name: '筑基丹·开放',
            category: 'pilfer',
            tags: ['开放配方', '突破'],
            requiredSkills: { '炼制': 50 },
            slots: {
                main:     { minElement: { wood: 0.3, water: 0.15 }, minPrimary: { breakthrough: 70 }, minNature: 50, maxNature: 90, maxToxic: 55, count: 1 },
                assist:   { minPrimary: { qi: 25 }, maxToxic: 35, count: 2 },
                balancer: { maxToxic: 30, count: 1 }
            },
            result: { itemId: 'pill_zhuji', count: 1, allowFlaw: true, flawItemId: 'pill_zhuji_flaw', flawThreshold: 60 },
            qiCost: 50, timeCost: 60
        },
        {
            id: 'recipe_jindan_open',
            name: '金丹·开放',
            category: 'pilfer',
            tags: ['开放配方', '突破', '上品'],
            requiredSkills: { '炼制': 80 },
            slots: {
                main:     { minElement: { wood: 0.3 }, minPrimary: { breakthrough: 80 }, minNature: 60, maxNature: 95, maxToxic: 55, count: 1 },
                assist:   { minPrimary: { qi: 30 }, maxToxic: 40, count: 2 },
                balancer: { minPrimary: { divine: 20 }, maxToxic: 40, count: 1 }
            },
            result: { itemId: 'pill_nine_revival', count: 1, allowFlaw: true, flawItemId: 'pill_nine_revival_flaw', flawThreshold: 55 },
            qiCost: 120, timeCost: 120
        },
        {
            id: 'recipe_healing_open',
            name: '回春丹·开放',
            category: 'pilfer',
            tags: ['开放配方', '疗伤'],
            requiredSkills: { '炼制': 25 },
            slots: {
                main:     { minPrimary: { heal: 50 }, minElement: { wood: 0.1, water: 0.1 }, minNature: 10, maxNature: 80, maxToxic: 40, count: 1 },
                assist:   { minPrimary: { heal: 20, qi: 20 }, maxToxic: 25, count: 2 },
                balancer: { maxToxic: 20, count: 1 }
            },
            result: { itemId: 'pill_spring_recovery', count: 1, allowFlaw: true, flawItemId: 'pill_spring_recovery_flaw', flawThreshold: 50 },
            qiCost: 30, timeCost: 12
        },
        {
            id: 'recipe_qi_open',
            name: '回气散·开放',
            category: 'pilfer',
            tags: ['开放配方', '回气'],
            requiredSkills: { '炼制': 5 },
            slots: {
                main:     { minPrimary: { qi: 40 }, minNature: 30, maxNature: 80, maxToxic: 30, count: 1 },
                assist:   { minPrimary: { qi: 20 }, maxToxic: 20, count: 2 },
                balancer: { maxToxic: 15, count: 1 }
            },
            result: { itemId: 'pill_qi_powder', count: 1, allowFlaw: true, flawItemId: 'pill_qi_powder_flaw', flawThreshold: 40 },
            qiCost: 10, timeCost: 5
        },
        {
            id: 'recipe_big_recovery_open',
            name: '大还丹·开放',
            category: 'pilfer',
            tags: ['开放配方', '炼体'],
            requiredSkills: { '炼制': 40 },
            slots: {
                main:     { minPrimary: { body: 60 }, minElement: { fire: 0.3 }, minNature: 60, maxNature: 100, maxToxic: 60, count: 1 },
                assist:   { minPrimary: { qi: 20 }, maxToxic: 30, count: 2 },
                balancer: { maxToxic: 20, count: 1 }
            },
            result: { itemId: 'pill_big_recovery', count: 1, allowFlaw: true, flawItemId: 'pill_big_recovery_flaw', flawThreshold: 55 },
            qiCost: 40, timeCost: 30
        },
        {
            // v20.16 后天改命线：重塑灵根丹。主药锁"五行俱足且药性平和"——唯五行灵髓合格
            // （混沌石五行虽全但药性 80 过烈，摊不动饼只会烧经脉——所以也过不了主药关）
            id: 'recipe_root_refine_open',
            name: '重塑灵根丹·开放',
            category: 'pilfer',
            tags: ['开放配方', '灵根', '传说'],
            requiredSkills: { '炼制': 70 },
            slots: {
                main:     { minElement: { metal: 0.15, wood: 0.15, water: 0.15, fire: 0.15, earth: 0.15 }, minPrimary: { breakthrough: 40 }, minNature: 40, maxNature: 70, maxToxic: 35, count: 1 },
                assist:   { minPrimary: { qi: 25 }, maxToxic: 35, count: 2 },
                balancer: { maxToxic: 20, count: 1 }
            },
            result: { itemId: 'pill_root_refine', count: 1 },
            qiCost: 100, timeCost: 120
        }
    ];

    // ============== 3. 评分 & 校验 ==============

    function getProps(matId) {
        return MATERIAL_PROPS[matId] || { element: { metal: 0.2, wood: 0.2, water: 0.2, fire: 0.2, earth: 0.2 }, nature: 50, primary: {}, toxic: 10 };
    }

    function sumElement(props) {
        return (props.element.wood || 0) + (props.element.water || 0) + (props.element.fire || 0) + (props.element.earth || 0) + (props.element.metal || 0);
    }

    function checkSlotMat(matId, slot) {
        if (!matId) return { ok: false, reason: 'empty' };
        var p = getProps(matId);
        // 五行加权
        if (slot.minElement) {
            for (var k in slot.minElement) {
                if ((p.element[k] || 0) < slot.minElement[k]) {
                    return { ok: false, reason: 'element-' + k + '-low(' + (p.element[k] || 0) + '<' + slot.minElement[k] + ')' };
                }
            }
        }
        // 主效
        if (slot.minPrimary) {
            for (var pk in slot.minPrimary) {
                if ((p.primary[pk] || 0) < slot.minPrimary[pk]) {
                    return { ok: false, reason: 'primary-' + pk + '-low(' + (p.primary[pk] || 0) + '<' + slot.minPrimary[pk] + ')' };
                }
            }
        }
        // 药性范围
        if (typeof slot.minNature === 'number' && p.nature < slot.minNature) return { ok: false, reason: 'nature-low(' + p.nature + '<' + slot.minNature + ')' };
        if (typeof slot.maxNature === 'number' && p.nature > slot.maxNature) return { ok: false, reason: 'nature-high(' + p.nature + '>' + slot.maxNature + ')' };
        // 毒性上限
        if (typeof slot.maxToxic === 'number' && p.toxic > slot.maxToxic) return { ok: false, reason: 'toxic-high(' + p.toxic + '>' + slot.maxToxic + ')' };
        return { ok: true };
    }

    function scoreSlot(matId, slot) {
        var p = getProps(matId);
        var s = 50; // 基础
        if (slot.minElement) for (var k in slot.minElement) s += (p.element[k] || 0) * 30;
        if (slot.minPrimary) for (var pk in slot.minPrimary) s += (p.primary[pk] || 0) * 0.4;
        s -= p.toxic * 0.3;
        s -= Math.abs(60 - p.nature) * 0.1; // 偏离 60 适度扣
        return s;
    }

    // ============== 4. executeCompoundPilfar ==============

    function executeCompoundPilfar(recipeId, slotPick) {
        var recipe = null;
        for (var i = 0; i < COMPOUND_PILFAR_RECIPES.length; i++) if (COMPOUND_PILFAR_RECIPES[i].id === recipeId) { recipe = COMPOUND_PILFAR_RECIPES[i]; break; }
        if (!recipe) return { ok: false, reason: 'recipe-not-found' };
        if (!slotPick) return { ok: false, reason: 'empty-pick' };
        // 技能检查
        if (recipe.requiredSkills) {
            for (var sk in recipe.requiredSkills) {
                var lv = 0;
                if (typeof window.getLifeSkill === 'function') lv = window.getLifeSkill(sk);
                else if (window.currentCharData && window.currentCharData.lifeSkills) lv = window.currentCharData.lifeSkills[sk] || 0;
                if (lv < recipe.requiredSkills[sk]) return { ok: false, reason: 'skill-low(' + sk + ':' + lv + '<' + recipe.requiredSkills[sk] + ')' };
            }
        }
        // 校验每槽
        var slots = recipe.slots;
        var totalScore = 0;
        var totalToxic = 0;
        var materials = [];
        function validateArr(arr, slot) {
            if (!arr || arr.length !== slot.count) return { ok: false, reason: 'count-mismatch(need ' + slot.count + ',got ' + (arr ? arr.length : 0) + ')' };
            for (var j = 0; j < arr.length; j++) {
                var c = checkSlotMat(arr[j], slot);
                if (!c.ok) return { ok: false, reason: 'slot-' + arr[j] + ':' + c.reason };
                totalScore += scoreSlot(arr[j], slot);
                totalToxic += getProps(arr[j]).toxic;
                materials.push(arr[j]);
            }
            return { ok: true };
        }
        var cm = validateArr(slotPick.main, slots.main); if (!cm.ok) return cm;
        var ca = validateArr(slotPick.assist, slots.assist); if (!ca.ok) return ca;
        var cb = validateArr(slotPick.balancer, slots.balancer); if (!cb.ok) return cb;
        // 真气
        var cd = (typeof window.getCurrentCharData === 'function') ? window.getCurrentCharData() : window.currentCharData;
        if (cd && recipe.qiCost && (cd.qi || 0) < recipe.qiCost) return { ok: false, reason: 'qi-low(' + (cd.qi || 0) + '<' + recipe.qiCost + ')' };
        // 火候 = 炼制技能 ± 随机 20
        var skill = 0;
        if (typeof window.getLifeSkill === 'function') skill = window.getLifeSkill('炼制');
        else if (cd && cd.lifeSkills) skill = cd.lifeSkills['炼制'] || 0;
        // v20.1 火候试炼：玩家亲自控火得分替代随机火候；受炼制技能限制（不超过 skill+20，与原随机上限一致），防止低技能绕过
        var fire;
        if (typeof window._alchemyFireBonus === 'number' && window._alchemyFireBonus >= 0) {
            fire = Math.max(0, Math.min(100, Math.min(window._alchemyFireBonus, skill + 20)));
            window._alchemyFireBonus = null; // 消费
        } else {
            var fireOffset = (Math.random() * 40 - 20); // ±20
            fire = Math.max(0, Math.min(100, skill + fireOffset));
        }
        // 品质 = 0.6 * 评分归一 + 0.4 * 火候
        var finalScore = Math.max(0, Math.min(100, 0.6 * (totalScore / (materials.length * 100)) * 100 + 0.4 * fire));
        // 毒性均值
        var avgToxic = totalToxic / materials.length;
        // 品质段
        var quality;
        if (finalScore >= 85 && avgToxic < 5) quality = { id: 'imperial', name: '极品', mult: 2.0, color: 'purple' };
        else if (finalScore >= 70) quality = { id: 'excellent', name: '杰出', mult: 1.5, color: 'gold' };
        else if (finalScore >= 50) quality = { id: 'good', name: '优良', mult: 1.2, color: 'blue' };
        else if (finalScore >= 30) quality = { id: 'normal', name: '普通', mult: 1.0, color: 'white' };
        else quality = { id: 'poor', name: '劣质', mult: 0.7, color: 'gray' };
        // 决定 itemId（变体模板不存在时退化为基础 + quality label）
        var itemId = recipe.result.itemId;
        var isFlaw = false;
        if (recipe.result.allowFlaw && recipe.result.flawItemId && avgToxic >= (recipe.result.flawThreshold || 60)) {
            if (window.itemById && window.itemById[recipe.result.flawItemId]) {
                itemId = recipe.result.flawItemId;
            }
            isFlaw = true; // 仍然记下毒扣
        }
        // 极品时尝试 imperial 变体（仅当模板存在时；否则仅记录品质）
        if (quality.id === 'imperial' && itemId === recipe.result.itemId && window.itemById && window.itemById[itemId + '_imperial']) {
            itemId = itemId + '_imperial';
        }
        // 副作用：扣真气
        if (cd && recipe.qiCost) cd.qi = (cd.qi || 0) - recipe.qiCost;
        // 毒扣血（仅 flaw）
        if (isFlaw && cd) {
            cd.hp = Math.max(1, (cd.hp || 100) - Math.floor((cd.maxHp || 100) * 0.3));
        }
        // 落物品到背包
        var addOk = true;
        if (typeof window.addResultItem === 'function') {
            addOk = window.addResultItem(itemId, Math.max(1, Math.floor(recipe.result.count * quality.mult)));
        }
        if (!addOk) {
            // 回滚
            if (cd && recipe.qiCost) cd.qi = (cd.qi || 0) + recipe.qiCost;
            return { ok: false, reason: 'inventory-full' };
        }
        // 时间推进
        if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
            try { window.timeSystem.advanceTime(recipe.timeCost || 10, 'alchemy-compound'); } catch (e) { /* 没有真实玩家时静默 */ }
        }
        // 事件总线
        if (typeof window.EventBus !== 'undefined') {
            var evtName = isFlaw ? 'alchemy:compound:flaw' : (quality.id === 'imperial' ? 'alchemy:compound:imperial' : 'alchemy:compound:success');
            window.EventBus.emit(evtName, { recipeId: recipeId, itemId: itemId, quality: quality.id, materials: materials.slice(), score: finalScore, toxic: avgToxic });
        }
        // StateRegistry（模块级状态）
        try {
            _moduleState.lastRecipes.unshift({ recipeId: recipeId, quality: quality.id, itemId: itemId, day: (window.WorldCalendar ? window.WorldCalendar.day : 0) });
            if (_moduleState.lastRecipes.length > 20) _moduleState.lastRecipes.pop();
            if (isFlaw) _moduleState.flawCount++;
            if (quality.id === 'imperial') _moduleState.imperialCount++;
            if (!_moduleState.recipeStats[recipeId]) _moduleState.recipeStats[recipeId] = { success: 0, flaw: 0, imperial: 0 };
            var st = _moduleState.recipeStats[recipeId];
            st.success++;
            if (isFlaw) st.flaw++;
            if (quality.id === 'imperial') st.imperial++;
        } catch (e) {}
        return { ok: true, itemId: itemId, quality: quality, score: finalScore, toxic: avgToxic };
    }

    // ============== 5. 模块级状态（StateRegistry 兼容） ==============
    var _moduleState = {
        lastRecipes: [],     // 最近 20 次合成
        flawCount: 0,        // 累计有瑕
        imperialCount: 0,    // 累计极品
        recipeStats: {}      // recipeId -> { success, flaw, imperial }
    };

    function _exportState() { return JSON.parse(JSON.stringify(_moduleState)); }
    function _importState(s) {
        if (!s) return;
        if (Array.isArray(s.lastRecipes)) _moduleState.lastRecipes = s.lastRecipes.slice(0, 20);
        _moduleState.flawCount = s.flawCount || 0;
        _moduleState.imperialCount = s.imperialCount || 0;
        _moduleState.recipeStats = s.recipeStats || {};
    }
    function _resetState() {
        _moduleState.lastRecipes = [];
        _moduleState.flawCount = 0;
        _moduleState.imperialCount = 0;
        _moduleState.recipeStats = {};
    }

    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        try {
            window.StateRegistry.register('alchemyConfig', {
                version: 1,
                export: _exportState,
                import: _importState,
                reset: _resetState
            });
        } catch (e) {}
    }

    // ============== 6. 导出 ==============
    window.AlchemyCompound = {
        MATERIAL_PROPS: MATERIAL_PROPS,
        COMPOUND_PILFAR_RECIPES: COMPOUND_PILFAR_RECIPES,
        getProps: getProps,
        checkSlotMat: checkSlotMat,
        scoreSlot: scoreSlot,
        executeCompoundPilfar: executeCompoundPilfar,
        getState: function () { return _moduleState; },
        // 工具：列出某槽的可用材料（库存匹配）
        listAvailableMatsForSlot: function (slot, inventory) {
            var inv = inventory || (window.inventory && window.inventory.slots) || [];
            var result = [];
            for (var i = 0; i < inv.length; i++) {
                var s = inv[i];
                if (!s || !s.itemId) continue;
                if (s.count <= 0) continue;
                if (!MATERIAL_PROPS[s.itemId]) continue;
                var c = checkSlotMat(s.itemId, slot);
                if (c.ok) result.push({ itemId: s.itemId, count: s.count, score: scoreSlot(s.itemId, slot) });
            }
            return result;
        }
    };
    if (window.XianXia) window.XianXia.AlchemyCompound = window.AlchemyCompound;
    try { console.log('[AlchemyCompound] initialized v1 (' + Object.keys(MATERIAL_PROPS).length + ' mats, ' + COMPOUND_PILFAR_RECIPES.length + ' open recipes)'); } catch (e) {}
})();
