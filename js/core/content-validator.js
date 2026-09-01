/**
 * content-validator.js — 内容引用/重复定义诊断
 * 不修改游戏数据，只在开发阶段报告：重复ID、配方断链、制作出未实装物品等。
 */
(function(global) {
    'use strict';

    function issue(level, code, message, data) {
        return { level: level, code: code, message: message, data: data || null };
    }

    function validateItems(out) {
        var items = Array.isArray(global.allItems) ? global.allItems : [];
        var seen = Object.create(null);
        items.forEach(function(item, index) {
            if (!item || !item.id) {
                out.push(issue('error', 'ITEM_NO_ID', '物品缺少 id', { index: index, name: item && item.name }));
                return;
            }
            if (seen[item.id] != null) {
                out.push(issue('warning', 'DUPLICATE_ITEM_ID', '重复物品ID：' + item.id, { firstIndex: seen[item.id], index: index }));
            } else seen[item.id] = index;
        });
    }

    function validateRecipes(out) {
        var recipes = Array.isArray(global.allRecipes) ? global.allRecipes : [];
        var ids = Object.create(null);
        recipes.forEach(function(recipe, index) {
            if (!recipe || !recipe.id) {
                out.push(issue('error', 'RECIPE_NO_ID', '配方缺少 id', { index: index }));
                return;
            }
            if (ids[recipe.id] != null) out.push(issue('warning', 'DUPLICATE_RECIPE_ID', '重复配方ID：' + recipe.id));
            ids[recipe.id] = index;
            (recipe.materials || []).forEach(function(mat) {
                if (mat && mat.itemId && (!global.itemById || !global.itemById[mat.itemId])) {
                    out.push(issue('error', 'MISSING_RECIPE_MATERIAL', recipe.id + ' 引用了不存在材料 ' + mat.itemId));
                }
            });
            var resultId = recipe.result && recipe.result.itemId;
            if (resultId) {
                var result = global.itemById && global.itemById[resultId];
                if (!result) out.push(issue('error', 'MISSING_RECIPE_RESULT', recipe.id + ' 产物不存在：' + resultId));
                else if (result.implemented === false) out.push(issue('warning', 'UNIMPLEMENTED_RECIPE_RESULT', recipe.id + ' 会制作尚未实装物品：' + resultId));
            }
        });
        if (global.recipeById) {
            recipes.forEach(function(recipe) {
                if (recipe && recipe.id && global.recipeById[recipe.id] !== recipe) {
                    out.push(issue('error', 'RECIPE_INDEX_DESYNC', 'recipeById 与 allRecipes 不同步：' + recipe.id));
                }
            });
        }
    }

    function validateQuestRefs(out) {
        var q = global.playerQuestProgress;
        // 运行时任务进度只校验明确写成 itemId 的目标；名称型/泛型目标不误报。
        var pools = [];
        if (Array.isArray(global.questsData)) pools.push(global.questsData);
        if (q && Array.isArray(q.activeQuests)) pools.push(q.activeQuests);
        pools.forEach(function(list) {
            list.forEach(function(quest) {
                (quest.objectives || []).forEach(function(obj) {
                    var id = obj.itemId || (obj.item && /^([a-z]+_)/i.test(obj.item) ? obj.item : null);
                    if (id && global.itemById && !global.itemById[id]) {
                        out.push(issue('warning', 'QUEST_ITEM_REF', (quest.id || quest.title || 'quest') + ' 引用了不存在物品：' + id));
                    }
                });
            });
        });
    }

    function run() {
        var issues = [];
        validateItems(issues);
        validateRecipes(issues);
        validateQuestRefs(issues);
        var result = {
            generatedGameMinute: global.GameScheduler && global.GameScheduler.nowMinute ? global.GameScheduler.nowMinute() : 0,
            counts: {
                errors: issues.filter(function(x) { return x.level === 'error'; }).length,
                warnings: issues.filter(function(x) { return x.level === 'warning'; }).length,
                items: Array.isArray(global.allItems) ? global.allItems.length : 0,
                recipes: Array.isArray(global.allRecipes) ? global.allRecipes.length : 0
            },
            issues: issues
        };
        global.CONTENT_VALIDATION_REPORT = result;
        return result;
    }

    function reportToConsole() {
        var result = run();
        if (typeof console === 'undefined') return result;
        var fn = result.counts.errors ? console.error : (result.counts.warnings ? console.warn : console.info);
        fn.call(console, '[ContentValidator] items=' + result.counts.items + ', recipes=' + result.counts.recipes + ', errors=' + result.counts.errors + ', warnings=' + result.counts.warnings);
        result.issues.slice(0, 50).forEach(function(x) {
            (x.level === 'error' ? console.error : console.warn)('[ContentValidator][' + x.code + '] ' + x.message, x.data || '');
        });
        return result;
    }

    var api = { run: run, reportToConsole: reportToConsole };
    global.ContentValidator = api;
    global.XianXia = global.XianXia || {};
    global.XianXia.ContentValidator = api;

    // 本文件位于所有数据扩展之后，因此可以同步诊断，不使用延迟猜加载顺序。
    reportToConsole();
})(typeof window !== 'undefined' ? window : this);
