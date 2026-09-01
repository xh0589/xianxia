/**
 * difficulty-config.js — 战斗难度条件栏（v12.4）
 *
 * 三档预设驱动三个战斗参数：
 *   enemyDmgMul   敌方（敌人/野兽）攻击力系数
 *   criticalTurns 危急状态默认救治窗口（回合数）
 *   vitalMul      要害部位（脑/头/胸/颈/丹田）受伤倍率（双向生效）
 *
 * 当前档位存于 currentCharData.difficulty（默认 'normal'）：
 *   - 即时持久化：localStorage 独立键 xianxia_difficulty（切换即存，无需手动保存）
 *   - 完整存档：通过 StateRegistry 自注册随存档走（v12.1 模块自注册机制），
 *     读档时 importAll 覆盖 localStorage 旧值
 */
(function (global) {
    'use strict';

    var LS_KEY = 'xianxia_difficulty';
    var DEFAULT_LEVEL = 'normal';

    var DIFFICULTY_PRESETS = {
        easy: {
            label: '宽松', icon: '🟢',
            desc: '敌人伤害×0.75 · 危急窗口50回合 · 要害无加成',
            enemyDmgMul: 0.75, criticalTurns: 50, vitalMul: 1.0
        },
        normal: {
            label: '标准', icon: '🔵',
            desc: '敌人伤害×1.2 · 危急窗口35回合 · 要害伤害×1.3',
            enemyDmgMul: 1.2, criticalTurns: 35, vitalMul: 1.3
        },
        hard: {
            label: '凶险', icon: '🔴',
            desc: '敌人伤害×1.7 · 危急窗口20回合 · 要害伤害×1.5',
            enemyDmgMul: 1.7, criticalTurns: 20, vitalMul: 1.5
        }
    };

    /** 当前难度档位（currentCharData.difficulty → localStorage → 默认标准） */
    function getDifficulty() {
        var cd = global.currentCharData;
        if (cd && cd.difficulty && DIFFICULTY_PRESETS[cd.difficulty]) return cd.difficulty;
        try {
            var ls = global.localStorage ? global.localStorage.getItem(LS_KEY) : null;
            if (ls && DIFFICULTY_PRESETS[ls]) return ls;
        } catch (e) {}
        return DEFAULT_LEVEL;
    }

    /** 切换难度：写入角色数据 + localStorage 即时持久化 */
    function setDifficulty(level) {
        if (!DIFFICULTY_PRESETS[level]) level = DEFAULT_LEVEL;
        var cd = global.currentCharData;
        if (cd) cd.difficulty = level;
        try { if (global.localStorage) global.localStorage.setItem(LS_KEY, level); } catch (e) {}
        return level;
    }

    /** 读取当前档位的某个战斗参数（enemyDmgMul / criticalTurns / vitalMul） */
    function getDifficultyParam(key) {
        var preset = DIFFICULTY_PRESETS[getDifficulty()] || DIFFICULTY_PRESETS[DEFAULT_LEVEL];
        return preset ? preset[key] : undefined;
    }

    // StateRegistry 自注册：随完整存档持久化（读档时覆盖 localStorage 旧值）
    if (global.StateRegistry && typeof global.StateRegistry.register === 'function') {
        global.StateRegistry.register('difficulty', {
            version: 1,
            export: function () { return { level: getDifficulty() }; },
            import: function (data) {
                if (data && DIFFICULTY_PRESETS[data.level]) {
                    var cd = global.currentCharData;
                    if (cd) cd.difficulty = data.level;
                }
            },
            reset: function () {
                var cd = global.currentCharData;
                if (cd) cd.difficulty = DEFAULT_LEVEL;
            }
        });
    }

    global.DIFFICULTY_PRESETS = DIFFICULTY_PRESETS;
    global.getDifficulty = getDifficulty;
    global.setDifficulty = setDifficulty;
    global.getDifficultyParam = getDifficultyParam;
})(typeof window !== 'undefined' ? window : this);
