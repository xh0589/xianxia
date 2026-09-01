// ==================== knowledge-system.js - 功法知识获取层 v9.2 ====================
// 解决：装备栏功法浏览预设全开、可直接装备的严重断层
// 唯一数据源约定：
//   TechniqueDefinition = skillPages（客观定义，不可直接装备）
//   TechniqueKnowledge  = 本模块 techniqueKnowledge（角色知道多少）
//   TechniqueLoadout    = currentSkills（当前运功，须 learned+）
//   ManualItem          = secretArts / art_* 秘籍物品（载体）
// 加载顺序：global-utils 之后、equipment.js 之前

(function (global) {
    'use strict';

    /** 认知状态阶梯（索引越大越深） */
    var KNOWLEDGE_STATES = [
        'unknown',   // 完全不知道
        'heard',     // 听说过名字
        'seen',      // 见过别人使用
        'studying',  // 正在研读（可修炼，不可实战装备）
        'learned',   // 已学会（可装备运功）
        'mastered'   // 精通
    ];

    var STATE_LABELS = {
        unknown: '未知',
        heard: '听闻',
        seen: '见过',
        studying: '研读中',
        learned: '已学会',
        mastered: '精通'
    };

    /**
     * 秘籍物品 ID / 名称 → skillPages 功法 ID 映射
     * 秘籍与运功定义原本两套 ID，学习时必须落到可装备的 skill id
     */
    /**
     * 秘籍物品 ID → skillPages 功法 ID 映射（v11.0 优化版）
     * 拆分为运功（内功/身法/绝技-持续被动）和招式（消耗真气的特殊攻击）
     * 运功类：可装备到运功栏（skill_main/skill_身法/skill_绝技），提供持续效果
     * 招式类：战斗中消耗真气使用，skillPages 中对应技能带 attackMoves
     * 不再使用心得（不采用）
     */
    var MANUAL_TO_SKILL = {
        // ===== 运功 - 内功（持续被动效果） =====
        basic_cultivation: 'skill_01',    // 基础修炼诀 → 吐纳术（内功）
        art_breathing: 'skill_01',        // 吐纳术
        art_qi_condense: 'skill_01',      // 凝气诀
        art_basic_cultivation: 'skill_01',// 基础修炼（扩展名）
        art_hun_yuan: 'skill_06',         // 混元功（内功）
        art_ice_heart: 'skill_10',        // 玄冰诀（冰系内功）
        art_fire_heart: 'skill_14',       // 离火诀（火系内功）
        art_wood_heart: 'skill_12',       // 青木诀（木系内功）
        art_earth_heart: 'skill_15',      // 厚土诀（土系内功）
        art_metal_heart: 'skill_11',      // 金锋诀（金系内功）
        art_water_heart: 'skill_13',      // 水月诀（水系内功）
        art_nine_yang: 'skill_14',        // 九阳神功 → 离火心法（至阳）
        art_nine_yin: 'skill_10',         // 九阴真经 → 寒冰诀（至阴）
        art_taiji: 'skill_46',            // 太极玄功
        art_chaos: 'skill_25',            // 混沌诀 → 混沌开天
        nine_yang: 'skill_14',            // 九阳神功（items.js旧版）
        art_chaos_art: 'skill_25',        // 混沌心法（13-missing-ids）

        // ===== 运功 - 身法（移动/闪避类） =====
        qing_gong_fly: 'skill_03',        // 飞天轻功 → 疾风步
        art_light_skill_basic: 'skill_03',// 基础轻功
        art_grass_fly: 'skill_03',        // 草上飞
        art_eight_step: 'skill_03',       // 八步赶蟾
        art_lingbo: 'skill_08',           // 凌波微步
        art_divine_movement: 'skill_23',  // 神行百变 → 九天玄步

        // ===== 招式 - 剑法（战斗中消耗真气攻击） =====
        sword_basic: 'skill_05',          // 基础剑法 → 清风剑法
        art_sword_basic: 'skill_05',      // 基础剑法（扩展名）
        art_wind_sword: 'skill_05',       // 清风剑法
        art_fire_sword: 'skill_05',       // 烈火剑法
        art_ice_sword: 'skill_05',        // 冰霜剑法
        art_tai_yi_sword: 'skill_18',     // 太乙剑法 → 万剑归宗
        art_taiji_sword: 'skill_18',      // 太极剑法 → 万剑归宗（不同于基础剑法）
        taiji_sword: 'skill_18',          // 太极剑法（items.js旧版）
        art_dugu_sword: 'skill_18',       // 独孤九剑
        art_ten_thousand_sword: 'skill_18',// 万剑归宗
        art_zhu_xian_sword: 'skill_47',   // 诛仙剑诀

        // ===== 招式 - 刀法 =====
        art_dao_basic: 'skill_09',        // 基础刀法 → 烈焰刀
        art_wind_dao: 'skill_09',         // 破风刀法
        art_water_dao: 'skill_09',        // 断水刀法
        art_blood_dao: 'skill_09',        // 血饮刀法
        art_dragon_slayer_dao: 'skill_09',// 屠龙刀法

        // ===== 招式 - 拳掌 =====
        art_fist_basic: 'skill_04',       // 基础拳法 → 金刚掌
        art_iron_fist: 'skill_04',        // 铁拳功
        art_soft_palm: 'skill_04',        // 绵掌功
        art_diamond_palm: 'skill_04',     // 金刚掌
        art_dragon_subdue_palm: 'skill_04',// 降龙掌
        art_taixu_fist: 'skill_04'        // 太虚拳
    };

    /** 按名称模糊匹配（秘籍名 → skillPages） */
    var NAME_TO_SKILL = {
        '吐纳术': 'skill_01',
        '铁布衫': 'skill_02',
        '疾风步': 'skill_03',
        '金刚掌': 'skill_04',
        '清风剑法': 'skill_05',
        '混元功': 'skill_06',
        '金钟罩': 'skill_07',
        '凌波微步': 'skill_08',
        '烈焰刀': 'skill_09',
        '寒冰诀': 'skill_10',
        '金锋诀': 'skill_11',
        '青木长生功': 'skill_12',
        '玄水真经': 'skill_13',
        '离火心法': 'skill_14',
        '厚土诀': 'skill_15',
        '天雷引': 'skill_16',
        '风卷残云': 'skill_17',
        '万剑归宗': 'skill_18',
        '破天一击': 'skill_19',
        '暗影步': 'skill_20',
        '太虚真经': 'skill_21',
        '不灭金身': 'skill_22',
        '九天玄步': 'skill_23',
        '星辰剑诀': 'skill_24',
        '混沌开天': 'skill_25',
        '基础修炼诀': 'skill_01',
        '基础剑法': 'skill_05',
        '太极剑法': 'skill_05',
        '九阳神功': 'skill_14',
        '飞天轻功': 'skill_03',
        '太极玄功': 'skill_46',
        '诛仙剑诀': 'skill_47'
    };

    // 运行时知识库 { skillId: { state, source, completeness, deviation, proficiency, maxProficiency, learnedAt, manualId } }
    var techniqueKnowledge = {};

    function stateIndex(state) {
        var i = KNOWLEDGE_STATES.indexOf(state);
        return i < 0 ? 0 : i;
    }

    function ensureStore() {
        if (!techniqueKnowledge || typeof techniqueKnowledge !== 'object') {
            techniqueKnowledge = {};
        }
        return techniqueKnowledge;
    }

    function getEntry(skillId) {
        ensureStore();
        return techniqueKnowledge[skillId] || null;
    }

    function getState(skillId) {
        var e = getEntry(skillId);
        return e && e.state ? e.state : 'unknown';
    }

    function knows(skillId, minState) {
        minState = minState || 'learned';
        return stateIndex(getState(skillId)) >= stateIndex(minState);
    }

    function canEquip(skillId) {
        return knows(skillId, 'learned');
    }

    function canPractice(skillId) {
        return knows(skillId, 'studying');
    }

    function resolveSkillId(manualOrSkillId, nameHint) {
        if (!manualOrSkillId && !nameHint) return null;
        // 已是 skill_xx
        if (manualOrSkillId && String(manualOrSkillId).indexOf('skill_') === 0) {
            return manualOrSkillId;
        }
        if (manualOrSkillId && MANUAL_TO_SKILL[manualOrSkillId]) {
            return MANUAL_TO_SKILL[manualOrSkillId];
        }
        if (nameHint && NAME_TO_SKILL[nameHint]) {
            return NAME_TO_SKILL[nameHint];
        }
        // 在 skillPages 里按 id 或 name 找
        var pages = global.skillPages;
        if (pages) {
            for (var p = 0; p < pages.length; p++) {
                for (var s = 0; s < pages[p].length; s++) {
                    var sk = pages[p][s];
                    if (sk.id === manualOrSkillId) return sk.id;
                    if (nameHint && sk.name === nameHint) return sk.id;
                    if (manualOrSkillId && sk.name === manualOrSkillId) return sk.id;
                }
            }
        }
        // 找不到则用原 id（仍可记入 knowledge，只是可能无法装备到 skillPages）
        return manualOrSkillId || null;
    }

    function hasDefinition(skillId) {
        if (!skillId) return false;
        if (typeof global.findSkillById === 'function') {
            try { if (global.findSkillById(skillId)) return true; } catch (e) {}
        }
        var pages = global.skillPages || [];
        for (var p = 0; p < pages.length; p++) {
            for (var s = 0; s < (pages[p] || []).length; s++) {
                if (pages[p][s] && pages[p][s].id === skillId) return true;
            }
        }
        return false;
    }

    function unlock(skillId, state, meta) {
        if (!skillId) return null;
        ensureStore();
        meta = meta || {};
        var cur = techniqueKnowledge[skillId];
        var nextState = state || 'heard';
        if (cur && stateIndex(cur.state) > stateIndex(nextState)) {
            // 不允许降级（除非显式 force）
            if (!meta.force) {
                nextState = cur.state;
            }
        }
        var entry = {
            state: nextState,
            source: meta.source || (cur && cur.source) || 'unknown',
            completeness: meta.completeness != null ? meta.completeness : (cur && cur.completeness != null ? cur.completeness : (nextState === 'learned' || nextState === 'mastered' ? 100 : 50)),
            deviation: meta.deviation != null ? meta.deviation : (cur && cur.deviation) || 0,
            proficiency: meta.proficiency != null ? meta.proficiency : (cur && cur.proficiency) || 0,
            maxProficiency: meta.maxProficiency != null ? meta.maxProficiency : (cur && cur.maxProficiency) || 100,
            learnedAt: (nextState === 'learned' || nextState === 'mastered')
                ? (cur && cur.learnedAt) || Date.now()
                : (cur && cur.learnedAt) || null,
            manualId: meta.manualId || (cur && cur.manualId) || null
        };
        techniqueKnowledge[skillId] = entry;
        syncLearnedSecretsList();
        return entry;
    }

    /**
     * 从秘籍物品学习 → 写入 knowledge 为 learned（完整秘籍）或 studying（残卷可扩展）
     */
    function learnFromManual(manualId, manualName, options) {
        options = options || {};
        var skillId = resolveSkillId(manualId, manualName);
        if (!skillId) {
            return { success: false, msg: '无法识别这门功法' };
        }
        var state = options.state || 'learned';
        var already = knows(skillId, state);
        if (already && state === 'learned' && knows(skillId, 'learned')) {
            return { success: false, msg: '你已经学过这门功法了', skillId: skillId, already: true };
        }
        unlock(skillId, state, {
            source: options.source || 'manual',
            manualId: manualId,
            completeness: options.completeness != null ? options.completeness : 100
        });
        var skillName = manualName;
        if (global.findSkillById) {
            var def = global.findSkillById(skillId);
            if (def) skillName = def.name;
        }
        return {
            success: true,
            skillId: skillId,
            skillName: skillName || manualName || skillId,
            state: state,
            msg: state === 'learned'
                ? ('你学会了功法：' + (skillName || skillId) + '！')
                : ('你开始研读：' + (skillName || skillId))
        };
    }

    /** 与旧 learnedSecrets 数组双向同步（兼容存档/其它系统） */
    function syncLearnedSecretsList() {
        ensureStore();
        var list = [];
        Object.keys(techniqueKnowledge).forEach(function (id) {
            if (stateIndex(techniqueKnowledge[id].state) >= stateIndex('learned')) {
                list.push(id);
                // 若有 manualId 也记一份，兼容只认秘籍 id 的旧逻辑
                if (techniqueKnowledge[id].manualId && list.indexOf(techniqueKnowledge[id].manualId) < 0) {
                    list.push(techniqueKnowledge[id].manualId);
                }
            }
        });
        global.learnedSecrets = list;
        if (typeof learnedSecrets !== 'undefined') {
            try { learnedSecrets = list; } catch (e) { /* 非全局 let 时忽略 */ }
        }
        return list;
    }

    /** 从旧 learnedSecrets / 存档迁移 */
    function migrateFromLearnedSecrets(arr) {
        if (!arr || !arr.length) return;
        arr.forEach(function (id) {
            var skillId = resolveSkillId(id, null);
            if (skillId) {
                unlock(skillId, 'learned', { source: 'migrate', manualId: id });
            }
        });
        syncLearnedSecretsList();
    }

    /** 新角色：仅听闻最基础吐纳，不直接学会高阶 */
    function initStarterKnowledge() {
        techniqueKnowledge = {};
        // 凡人开局：听说过吐纳术，尚未学会（需秘籍或指点）
        unlock('skill_01', 'heard', { source: 'world', completeness: 0 });
        syncLearnedSecretsList();
    }

    function exportData() {
        ensureStore();
        return JSON.parse(JSON.stringify(techniqueKnowledge));
    }

    function importData(data) {
        if (!data || typeof data !== 'object') {
            techniqueKnowledge = {};
        } else {
            techniqueKnowledge = JSON.parse(JSON.stringify(data));
        }
        syncLearnedSecretsList();
    }

    function getLearnedSkillIds() {
        ensureStore();
        return Object.keys(techniqueKnowledge).filter(function (id) {
            return stateIndex(techniqueKnowledge[id].state) >= stateIndex('learned');
        });
    }

    function getKnownSkillIds(minState) {
        minState = minState || 'heard';
        ensureStore();
        return Object.keys(techniqueKnowledge).filter(function (id) {
            return stateIndex(techniqueKnowledge[id].state) >= stateIndex(minState);
        });
    }

    function getStateLabel(skillId) {
        return STATE_LABELS[getState(skillId)] || '未知';
    }

    var KnowledgeSystem = {
        KNOWLEDGE_STATES: KNOWLEDGE_STATES,
        STATE_LABELS: STATE_LABELS,
        MANUAL_TO_SKILL: MANUAL_TO_SKILL,
        get techniqueKnowledge() { return ensureStore(); },
        set techniqueKnowledge(v) { techniqueKnowledge = v || {}; },
        getState: getState,
        getEntry: getEntry,
        knows: knows,
        canEquip: canEquip,
        canPractice: canPractice,
        resolveSkillId: resolveSkillId,
        hasDefinition: hasDefinition,
        unlock: unlock,
        learnFromManual: learnFromManual,
        migrateFromLearnedSecrets: migrateFromLearnedSecrets,
        initStarterKnowledge: initStarterKnowledge,
        syncLearnedSecretsList: syncLearnedSecretsList,
        exportData: exportData,
        importData: importData,
        getLearnedSkillIds: getLearnedSkillIds,
        getKnownSkillIds: getKnownSkillIds,
        getStateLabel: getStateLabel,
        stateIndex: stateIndex
    };

    global.KnowledgeSystem = KnowledgeSystem;
    global.KNOWLEDGE_STATES = KNOWLEDGE_STATES;
    // 便捷全局
    global.canEquipSkill = canEquip;
    global.learnTechniqueFromManual = learnFromManual;

})(typeof window !== 'undefined' ? window : this);
