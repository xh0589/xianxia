// ==================== equipment.js ====================
// 装备与功法系统 - 借鉴《太吾绘卷》、《觅长生》设计
// v9.4：运功栏三槽；v9.6：选择并入装备栏/运功栏槽内，无独立选择面板
// v10.0：功法招式 attackMoves 定义（每门功法2招，用于战斗招式选择）

// ============ 功法招式配置（v10.0 新增） ============
// 每门功法2招：普通攻击 + 特殊招式
// 无 attackMoves 定义的功法回退普通攻击
var SKILL_ATTACK_MOVES = {
    // 基础
    'skill_01': [
        { id: 'move_01a', name: '吐纳冲击', icon: '🌬️', partPreference: 'chest', damageType: 'blunt', qiCost: 0, staminaCost: 5, hitBonus: 5, damageMult: 0.8, desc: '以吐纳之力冲击对手' },
        { id: 'move_01b', name: '气息震荡', icon: '💨', partPreference: 'abdomen', damageType: 'blunt', qiCost: 5, staminaCost: 10, hitBonus: 0, armorPenetration: 5, damageMult: 1.0, desc: '震荡气息，伤及内腑' }
    ],
    'skill_03': [
        { id: 'move_03a', name: '疾风踢', icon: '💨', partPreference: 'waist', damageType: 'blunt', qiCost: 3, staminaCost: 8, hitBonus: 10, damageMult: 0.9, desc: '身法带动的快速踢击' },
        { id: 'move_03b', name: '旋风扫', icon: '🌀', partPreference: 'leg', damageType: 'blunt', qiCost: 6, staminaCost: 12, hitBonus: 5, damageMult: 1.1, desc: '旋转扫腿攻击下盘' }
    ],
    'skill_04': [
        { id: 'move_04a', name: '金刚推掌', icon: '✋', partPreference: 'chest', damageType: 'blunt', qiCost: 5, staminaCost: 10, hitBonus: 0, damageMult: 1.2, desc: '刚猛掌力正面冲击' },
        { id: 'move_04b', name: '铁掌印', icon: '🖐️', partPreference: 'abdomen', damageType: 'blunt', qiCost: 8, staminaCost: 14, armorPenetration: 10, damageMult: 1.4, desc: '铁掌印入体，内劲暗藏' }
    ],
    'skill_05': [
        { id: 'move_05a', name: '清风拂柳', icon: '🗡️', partPreference: 'neck', damageType: 'slash', qiCost: 3, staminaCost: 6, hitBonus: 8, damageMult: 1.0, desc: '剑走轻灵，攻其不备' },
        { id: 'move_05b', name: '剑点七星', icon: '✨', partPreference: 'eyes', damageType: 'pierce', qiCost: 6, staminaCost: 10, hitBonus: 12, armorPenetration: 5, damageMult: 1.0, desc: '剑光如星，直刺要害' }
    ],
    'skill_06': [
        { id: 'move_06a', name: '混元掌', icon: '🌀', partPreference: 'abdomen', damageType: 'blunt', qiCost: 8, staminaCost: 12, armorPenetration: 10, damageMult: 1.1, desc: '混元内力透体而入' },
        { id: 'move_06b', name: '混元护体', icon: '🔵', partPreference: 'chest', damageType: 'blunt', qiCost: 10, staminaCost: 8, hitBonus: 0, damageMult: 0.9, desc: '混元之气护体反击' }
    ],
    'skill_08': [
        { id: 'move_08a', name: '凌波踏水', icon: '🌊', partPreference: 'head', damageType: 'blunt', qiCost: 6, staminaCost: 10, hitBonus: 15, damageMult: 0.8, desc: '踏水而行，攻其不意' },
        { id: 'move_08b', name: '凌空点水', icon: '💧', partPreference: 'chest', damageType: 'pierce', qiCost: 8, staminaCost: 12, hitBonus: 18, damageMult: 0.9, desc: '凌空一点，精准无比' }
    ],
    'skill_09': [
        { id: 'move_09a', name: '烈焰横斩', icon: '🔥', partPreference: 'chest', damageType: 'slash', qiCost: 10, staminaCost: 15, damageMult: 1.3, desc: '刀气如烈焰横斩' },
        { id: 'move_09b', name: '烈火燎原', icon: '🔥', partPreference: 'waist', damageType: 'slash', qiCost: 14, staminaCost: 18, damageMult: 1.5, desc: '刀势连绵如火海' }
    ],
    'skill_10': [
        { id: 'move_10a', name: '寒冰刺', icon: '❄️', partPreference: 'dantian', damageType: 'pierce', qiCost: 8, staminaCost: 12, armorPenetration: 15, damageMult: 1.1, desc: '寒气凝聚成冰刺' },
        { id: 'move_10b', name: '冰封三尺', icon: '🧊', partPreference: 'chest', damageType: 'blunt', qiCost: 12, staminaCost: 15, hitBonus: 5, damageMult: 1.2, desc: '寒气冻结周围' }
    ],
    'skill_16': [
        { id: 'move_16a', name: '天雷降世', icon: '⚡', partPreference: 'head', damageType: 'blunt', qiCost: 20, staminaCost: 20, hitBonus: 5, damageMult: 1.5, desc: '引天雷之力轰击对手' },
        { id: 'move_16b', name: '雷蛇乱舞', icon: '⚡', partPreference: 'chest', damageType: 'slash', qiCost: 18, staminaCost: 18, hitBonus: 10, damageMult: 1.3, desc: '雷电如蛇乱舞' }
    ],
    'skill_17': [
        { id: 'move_17a', name: '风卷残云', icon: '🌪️', partPreference: 'chest', damageType: 'slash', qiCost: 15, staminaCost: 18, damageMult: 1.4, desc: '狂风席卷，范围攻击' },
        { id: 'move_17b', name: '风刃', icon: '🌪️', partPreference: 'neck', damageType: 'slash', qiCost: 12, staminaCost: 14, hitBonus: 8, damageMult: 1.2, desc: '风凝为刃，切割要害' }
    ],
    'skill_18': [
        { id: 'move_18a', name: '万剑齐发', icon: '⚔️', partPreference: 'chest', damageType: 'pierce', qiCost: 20, staminaCost: 22, hitBonus: 5, damageMult: 1.6, desc: '万剑齐发，剑道极致' },
        { id: 'move_18b', name: '剑意冲霄', icon: '⬆️', partPreference: 'head', damageType: 'pierce', qiCost: 16, staminaCost: 18, armorPenetration: 15, damageMult: 1.4, desc: '剑意冲天，直击要害' }
    ],
    'skill_21': [
        { id: 'move_21a', name: '太虚剑气', icon: '✨', partPreference: 'chest', damageType: 'pierce', qiCost: 15, staminaCost: 15, damageMult: 1.4, desc: '太虚真气化为剑气' },
        { id: 'move_21b', name: '太虚归元', icon: '🌀', partPreference: 'dantian', damageType: 'blunt', qiCost: 20, staminaCost: 10, hitBonus: 5, armorPenetration: 20, damageMult: 1.3, desc: '太虚归元，内劲震荡' }
    ],
    'skill_25': [
        { id: 'move_25a', name: '混沌破', icon: '🌌', partPreference: 'dantian', damageType: 'blunt', qiCost: 30, staminaCost: 25, armorPenetration: 30, damageMult: 1.8, desc: '混沌之力破体而入' },
        { id: 'move_25b', name: '混沌裂', icon: '💥', partPreference: 'chest', damageType: 'slash', qiCost: 35, staminaCost: 28, armorPenetration: 25, damageMult: 1.9, desc: '混沌撕裂空间' }
    ],
    'skill_29': [
        { id: 'move_29a', name: '幽冥鬼爪', icon: '👻', partPreference: 'neck', damageType: 'pierce', qiCost: 12, staminaCost: 15, armorPenetration: 20, damageMult: 1.3, desc: '鬼爪索命，阴毒无比' },
        { id: 'move_29b', name: '鬼影缠身', icon: '👻', partPreference: 'waist', damageType: 'blunt', qiCost: 10, staminaCost: 12, hitBonus: 10, damageMult: 1.1, desc: '鬼影重重，缠绕攻击' }
    ],
    'skill_41': [
        { id: 'move_41a', name: '穿云箭', icon: '🏹', partPreference: 'chest', damageType: 'pierce', qiCost: 8, staminaCost: 10, hitBonus: 15, damageMult: 1.1, desc: '箭穿云霄，百发百中' },
        { id: 'move_41b', name: '连珠箭', icon: '🏹', partPreference: 'abdomen', damageType: 'pierce', qiCost: 12, staminaCost: 14, hitBonus: 10, damageMult: 1.3, desc: '连珠箭雨，连绵不绝' }
    ],
    'skill_45': [
        { id: 'move_45a', name: '追魂一箭', icon: '🎯', partPreference: 'head', damageType: 'pierce', qiCost: 25, staminaCost: 20, hitBonus: 20, armorPenetration: 20, damageMult: 1.6, desc: '一箭追魂，例不虚发' },
        { id: 'move_45b', name: '破天一箭', icon: '⬆️', partPreference: 'chest', damageType: 'pierce', qiCost: 30, staminaCost: 25, armorPenetration: 30, damageMult: 1.8, desc: '破天一箭，穿透一切' }
    ],
    'skill_46': [
        { id: 'move_46a', name: '太极推手', icon: '☯️', partPreference: 'abdomen', damageType: 'blunt', qiCost: 10, staminaCost: 10, hitBonus: 10, armorPenetration: 20, damageMult: 1.2, desc: '以柔克刚，借力打力' },
        { id: 'move_46b', name: '太极圆转', icon: '🔄', partPreference: 'chest', damageType: 'blunt', qiCost: 15, staminaCost: 12, hitBonus: 15, armorPenetration: 15, damageMult: 1.3, desc: '太极圆转，连绵不绝' }
    ],
    'skill_47': [
        { id: 'move_47a', name: '诛仙剑气', icon: '⚔️', partPreference: 'head', damageType: 'pierce', qiCost: 35, staminaCost: 30, hitBonus: 10, armorPenetration: 25, damageMult: 2.0, desc: '上古诛仙剑阵剑气' },
        { id: 'move_47b', name: '剑阵绞杀', icon: '⚔️', partPreference: 'chest', damageType: 'slash', qiCost: 40, staminaCost: 35, hitBonus: 5, armorPenetration: 20, damageMult: 2.2, desc: '剑阵绞杀，万剑穿心' }
    ],
    // P4：为防御类功法添加防御性招式
    'skill_02': [  // 铁布衫 - 防御功法
        { id: 'move_02a', name: '铜皮铁骨', icon: '🛡️', partPreference: 'chest', damageType: 'blunt', qiCost: 0, staminaCost: 0, hitBonus: 0, armorPenetration: 0, damageMult: 0.8, desc: '硬化肌肤，减少受到的物理伤害' },
        { id: 'move_02b', name: '铁壁防御', icon: '🛡️', partPreference: 'all', damageType: 'blunt', qiCost: 5, staminaCost: 10, hitBonus: 0, armorPenetration: 0, damageMult: 0.6, desc: '全身防御，大幅降低伤害但无法反击' }
    ],
    'skill_07': [  // 金钟罩 - 防御功法
        { id: 'move_07a', name: '金钟护体', icon: '🔔', partPreference: 'chest', damageType: 'blunt', qiCost: 0, staminaCost: 0, hitBonus: 0, armorPenetration: 0, damageMult: 0.7, desc: '金钟护体，免疫大部分物理攻击' },
        { id: 'move_07b', name: '金钟反击', icon: '🔔', partPreference: 'chest', damageType: 'blunt', qiCost: 15, staminaCost: 15, hitBonus: 20, armorPenetration: 10, damageMult: 1.5, desc: '金钟发动，反弹部分伤害给敌人' }
    ],
    // P4：为五行功法添加差异化招式
    'skill_11': [  // 金锋诀 - 金系内功
        { id: 'move_11a', name: '金锋剑气', icon: '⚜️', partPreference: 'chest', damageType: 'slash', qiCost: 8, staminaCost: 10, hitBonus: 10, damageMult: 1.1, desc: '凝聚金气化为剑气，锋利无比' },
        { id: 'move_11b', name: '金盾防御', icon: '🛡️', partPreference: 'all', damageType: 'blunt', qiCost: 5, staminaCost: 8, hitBonus: 0, armorPenetration: 15, damageMult: 0.8, desc: '凝聚金气形成护盾，减少伤害' }
    ],
    'skill_12': [  // 青木长生功 - 木系内功
        { id: 'move_12a', name: '木灵缠绕', icon: '🌿', partPreference: 'limbs', damageType: 'pierce', qiCost: 6, staminaCost: 8, hitBonus: 12, damageMult: 0.9, desc: '木灵之气缠绕对手，限制行动' },
        { id: 'move_12b', name: '生生回复', icon: '🌱', partPreference: 'chest', damageType: 'blunt', qiCost: 10, staminaCost: 10, hitBonus: 0, damageMult: 0.6, desc: '激发木系生机，小幅恢复自身' }
    ],
    'skill_13': [  // 玄水真经 - 水系内功
        { id: 'move_13a', name: '水箭术', icon: '💧', partPreference: 'head', damageType: 'pierce', qiCost: 7, staminaCost: 9, hitBonus: 15, damageMult: 1.0, desc: '凝聚水元素化为利箭射出' },
        { id: 'move_13b', name: '水流护体', icon: '🌊', partPreference: 'all', damageType: 'blunt', qiCost: 8, staminaCost: 12, hitBonus: 0, armorPenetration: 10, damageMult: 0.7, desc: '水流环绕身体，减少受到的伤害' }
    ],
    'skill_14': [  // 离火心法 - 火系内功
        { id: 'move_14a', name: '火焰喷射', icon: '🔥', partPreference: 'chest', damageType: 'blunt', qiCost: 10, staminaCost: 15, hitBonus: 8, damageMult: 1.3, desc: '喷出烈焰，造成范围伤害' },
        { id: 'move_14b', name: '烈火护盾', icon: '🔥', partPreference: 'chest', damageType: 'fire', qiCost: 12, staminaCost: 18, hitBonus: 0, damageMult: 1.5, desc: '烈火环绕，对近身敌人造成伤害' }
    ],
    'skill_15': [  // 厚土诀 - 土系内功
        { id: 'move_15a', name: '土刺穿刺', icon: '⛰️', partPreference: 'legs', damageType: 'pierce', qiCost: 9, staminaCost: 14, hitBonus: 12, damageMult: 1.2, desc: '从地面伸出土刺穿刺敌人' },
        { id: 'move_15b', name: '大地厚重', icon: '⛰️', partPreference: 'all', damageType: 'blunt', qiCost: 5, staminaCost: 10, hitBonus: 0, armorPenetration: 20, damageMult: 0.5, desc: '增加自身重量和防御力' }
    ],
    // P4：继续为其他技能添加差异化招式
    'skill_22': [  // 不灭金身 - 防御功法
        { id: 'move_22a', name: '金刚不坏', icon: '🟡', partPreference: 'chest', damageType: 'blunt', qiCost: 0, staminaCost: 0, hitBonus: 0, armorPenetration: 0, damageMult: 0.6, desc: '金身不灭，免疫大部分物理伤害' },
        { id: 'move_22b', name: '金身爆发', icon: '🟡', partPreference: 'all', damageType: 'blunt', qiCost: 20, staminaCost: 20, hitBonus: 25, damageMult: 2.0, desc: '金身发动，对周围敌人造成范围伤害' }
    ],
    'skill_23': [  // 九天玄步 - 轻功
        { id: 'move_23a', name: '踏云飞行', icon: '☁️', partPreference: 'legs', damageType: 'blunt', qiCost: 15, staminaCost: 15, hitBonus: 20, damageMult: 0.8, desc: '踏云而行，快速移动并躲避攻击' },
        { id: 'move_23b', name: '天降神足', icon: '☁️', partPreference: 'legs', damageType: 'blunt', qiCost: 10, staminaCost: 12, hitBonus: 15, damageMult: 1.0, desc: '从天而降，精准打击敌人要害' }
    ],
    'skill_24': [  // 星辰剑诀 - 剑法
        { id: 'move_24a', name: '星辰斩', icon: '⭐', partPreference: 'head', damageType: 'slash', qiCost: 18, staminaCost: 20, hitBonus: 18, damageMult: 1.4, desc: '引星辰之力化为剑气斩击' },
        { id: 'move_24b', name: '星罗棋布', icon: '⭐', partPreference: 'chest', damageType: 'pierce', qiCost: 25, staminaCost: 25, hitBonus: 10, damageMult: 1.6, desc: '满天星辰剑雨，覆盖大范围区域' }
    ],
    // P4：继续为毒术和医术类添加差异化招式
    'skill_26': [  // 五毒经 - 毒术
        { id: 'move_26a', name: '毒雾弥漫', icon: '🕷️', partPreference: 'chest', damageType: 'poison', qiCost: 10, staminaCost: 10, hitBonus: 5, damageMult: 0.8, desc: '释放毒雾，持续伤害并降低敌人属性' },
        { id: 'move_26b', name: '五毒噬心', icon: '🕷️', partPreference: 'head', damageType: 'poison', qiCost: 20, staminaCost: 15, hitBonus: 15, damageMult: 1.5, desc: '剧毒入心，造成大量持续伤害' }
    ],
    'skill_27': [  // 万蛊噬心 - 毒术
        { id: 'move_27a', name: '放蛊攻击', icon: '🐛', partPreference: 'limbs', damageType: 'poison', qiCost: 15, staminaCost: 12, hitBonus: 10, damageMult: 1.0, desc: '放出蛊虫攻击敌人，附带中毒效果' },
        { id: 'move_27b', name: '蛊虫反噬', icon: '🐛', partPreference: 'all', damageType: 'poison', qiCost: 25, staminaCost: 20, hitBonus: 20, damageMult: 1.8, desc: '蛊虫反扑，对敌人造成致命伤害' }
    ],
    'skill_28': [  // 化血神功 - 内功（吸血）
        { id: 'move_28a', name: '血饮术', icon: '🩸', partPreference: 'chest', damageType: 'slash', qiCost: 12, staminaCost: 10, hitBonus: 8, damageMult: 1.2, desc: '吸取敌人血液恢复自身生命' },
        { id: 'move_28b', name: '血魔化身', icon: '🩸', partPreference: 'all', damageType: 'blunt', qiCost: 20, staminaCost: 15, hitBonus: 15, damageMult: 1.5, desc: '化身血魔，攻击附带吸血效果' }
    ],
    'skill_29': [  // 幽冥鬼爪 - 拳掌
        { id: 'move_29a', name: '鬼爪索命', icon: '👻', partPreference: 'neck', damageType: 'pierce', qiCost: 12, staminaCost: 15, armorPenetration: 20, damageMult: 1.3, desc: '鬼爪索命，阴毒无比' },
        { id: 'move_29b', name: '鬼影缠身', icon: '👻', partPreference: 'waist', damageType: 'blunt', qiCost: 10, staminaCost: 12, hitBonus: 10, damageMult: 1.1, desc: '鬼影重重，缠绕攻击并降低敌人速度' }
    ],
    'skill_31': [  // 回春术 - 医术（治疗）
        { id: 'move_31a', name: '治愈之光', icon: '🌸', partPreference: 'chest', damageType: 'heal', qiCost: 8, staminaCost: 5, hitBonus: 0, damageMult: 1.0, desc: '释放治愈之光，恢复队友生命值' },
        { id: 'move_31b', name: '群体疗伤', icon: '🌸', partPreference: 'all', damageType: 'heal', qiCost: 15, staminaCost: 10, hitBonus: 0, damageMult: 1.5, desc: '大范围治疗，恢复全队生命值' }
    ],
    'skill_32': [  // 金针渡穴 - 医术
        { id: 'move_32a', name: '金针封穴', icon: '📌', partPreference: 'pressure_points', damageType: 'disable', qiCost: 10, staminaCost: 8, hitBonus: 20, damageMult: 0.5, desc: '用金针封住敌人穴位，使其暂时无法行动' },
        { id: 'move_32b', name: '经脉疏通', icon: '📌', partPreference: 'all', damageType: 'heal', qiCost: 12, staminaCost: 10, hitBonus: 0, damageMult: 1.2, desc: '疏通经脉，解除负面状态' }
    ],
    'skill_33': [  // 九转还魂 - 医术（复活）
        { id: 'move_33a', name: '起死回生', icon: '💚', partPreference: 'chest', damageType: 'heal', qiCost: 30, staminaCost: 20, hitBonus: 0, damageMult: 2.0, desc: '极限治疗，使濒死队友恢复大量生命' },
        { id: 'move_33b', name: '灵魂接引', icon: '💚', partPreference: 'head', damageType: 'revive', qiCost: 50, staminaCost: 30, hitBonus: 0, damageMult: 3.0, desc: '终极复活术，使阵亡队友短暂复活' }
    ],
    'skill_34': [  // 清心咒 - 医术（精神）
        { id: 'move_34a', name: '静心咒', icon: '🧘', partPreference: 'head', damageType: 'mental', qiCost: 8, staminaCost: 6, hitBonus: 15, damageMult: 0.8, desc: '施展静心咒，降低敌人愤怒和暴击率' },
        { id: 'move_34b', name: '心魔驱散', icon: '🧘', partPreference: 'all', damageType: 'mental', qiCost: 15, staminaCost: 12, hitBonus: 20, damageMult: 1.0, desc: '驱散心魔，解除精神控制状态' }
    ],
    'skill_35': [  // 金刚伏魔 - 防御
        { id: 'move_35a', name: '金刚护体', icon: '🔱', partPreference: 'all', damageType: 'blunt', qiCost: 10, staminaCost: 10, hitBonus: 0, armorPenetration: 25, damageMult: 0.6, desc: '金刚护体，大幅减少受到的物理伤害' },
        { id: 'move_35b', name: '降魔一击', icon: '🔱', partPreference: 'chest', damageType: 'blunt', qiCost: 20, staminaCost: 15, hitBonus: 25, damageMult: 1.8, desc: '降魔一击，对邪恶敌人造成额外伤害' }
    ]
};

function getSkillAttackMoves(skillId) {
    return SKILL_ATTACK_MOVES[skillId] || [];
}

function getActiveAttackMoves() {
    // 从当前已装备的功法中读取招式
    var moves = [];
    var skills = window.currentSkills || {};
    Object.values(skills).forEach(function(skill) {
        if (!skill) return;
        var skillMoves = getSkillAttackMoves(skill.id);
        skillMoves.forEach(function(m) {
            moves.push({
                skillId: skill.id,
                skillName: skill.name,
                moveId: m.id,
                name: m.name,
                icon: m.icon || '⚔️',
                partPreference: m.partPreference || 'chest',
                damageType: m.damageType || 'blunt',
                qiCost: m.qiCost || 0,
                staminaCost: m.staminaCost || 5,
                hitBonus: m.hitBonus || 0,
                armorPenetration: m.armorPenetration || 0,
                damageMult: m.damageMult || 1.0,
                desc: m.desc || ''
            });
        });
    });
    // 如果没有招式，添加一个默认的普通攻击
    if (moves.length === 0) {
        moves.push({
            skillId: 'default',
            skillName: '普通攻击',
            moveId: 'move_default',
            name: '普通攻击',
            icon: '👊',
            partPreference: 'chest',
            damageType: 'blunt',
            qiCost: 0,
            staminaCost: 0,
            hitBonus: 0,
            armorPenetration: 0,
            damageMult: 1.0,
            desc: '基础攻击'
        });
    }
    return moves;
}

window.SKILL_ATTACK_MOVES = SKILL_ATTACK_MOVES;
window.getSkillAttackMoves = getSkillAttackMoves;
window.getActiveAttackMoves = getActiveAttackMoves;

// ---------- 功法数据 ----------
// 每页5个功法，共10页=50个功法
const skillPages = [
    // 第1页：基础功法
    [
        { id: 'skill_01', name: '吐纳术', icon: '🌬️', type: '内功', grade: '凡品', desc: '基础呼吸法门，缓慢恢复真气', effect: '真气恢复+5%', qiCost: 0 },
        { id: 'skill_02', name: '铁布衫', icon: '🛡️', type: '防御', grade: '凡品', desc: '硬化肌肤，提升防御力', effect: '防御+10%', qiCost: 5 },
        { id: 'skill_03', name: '疾风步', icon: '💨', type: '轻功', grade: '凡品', desc: '身法轻灵，提升闪避', effect: '闪避+8%', qiCost: 5 },
        { id: 'skill_04', name: '金刚掌', icon: '✋', type: '拳掌', grade: '凡品', desc: '刚猛掌法，力道惊人', effect: '拳掌伤害+15%', qiCost: 8 },
        { id: 'skill_05', name: '清风剑法', icon: '🗡️', type: '剑法', grade: '凡品', desc: '剑走轻灵，快如清风', effect: '剑法伤害+12%', qiCost: 8 },
    ],
    // 第2页：进阶功法
    [
        { id: 'skill_06', name: '混元功', icon: '🌀', type: '内功', grade: '良品', desc: '混元一气，内力绵长', effect: '真气上限+20%', qiCost: 0 },
        { id: 'skill_07', name: '金钟罩', icon: '🔔', type: '防御', grade: '良品', desc: '周身如钟，刀枪不入', effect: '防御+20%', qiCost: 10 },
        { id: 'skill_08', name: '凌波微步', icon: '🌊', type: '轻功', grade: '良品', desc: '踏水而行，身法飘逸', effect: '闪避+15%', qiCost: 10 },
        { id: 'skill_09', name: '烈焰刀', icon: '🔥', type: '刀法', grade: '良品', desc: '刀气如火，焚尽万物', effect: '刀法伤害+25%', qiCost: 12 },
        { id: 'skill_10', name: '寒冰诀', icon: '❄️', type: '内功', grade: '良品', desc: '寒气内敛，凝水成冰', effect: '冰系伤害+20%', qiCost: 0 },
    ],
    // 第3页：五行功法
    [
        { id: 'skill_11', name: '金锋诀', icon: '⚜️', type: '内功', grade: '良品', desc: '金气锋锐，无坚不摧', effect: '金系伤害+25%', qiCost: 0 },
        { id: 'skill_12', name: '青木长生功', icon: '🌳', type: '内功', grade: '良品', desc: '木气滋养，生生不息', effect: '生命恢复+15%', qiCost: 0 },
        { id: 'skill_13', name: '玄水真经', icon: '💧', type: '内功', grade: '良品', desc: '水柔克刚，以柔制胜', effect: '水系伤害+25%', qiCost: 0 },
        { id: 'skill_14', name: '离火心法', icon: '🔥', type: '内功', grade: '良品', desc: '心火熊熊，焚天灭地', effect: '火系伤害+25%', qiCost: 0 },
        { id: 'skill_15', name: '厚土诀', icon: '⛰️', type: '内功', grade: '良品', desc: '土德厚重，稳如泰山', effect: '土系伤害+25%', qiCost: 0 },
    ],
    // 第4页：奇门功法
    [
        { id: 'skill_16', name: '天雷引', icon: '⚡', type: '绝技', grade: '优品', desc: '引天雷之力，一击破敌', effect: '雷系伤害+35%', qiCost: 20 },
        { id: 'skill_17', name: '风卷残云', icon: '🌪️', type: '绝技', grade: '优品', desc: '狂风席卷，范围攻击', effect: '风系伤害+30%', qiCost: 18 },
        { id: 'skill_18', name: '万剑归宗', icon: '⚔️', type: '剑法', grade: '优品', desc: '万剑齐发，剑道极致', effect: '剑法伤害+40%', qiCost: 25 },
        { id: 'skill_19', name: '破天一击', icon: '💥', type: '长兵', grade: '优品', desc: '枪出如龙，破天裂地', effect: '长兵伤害+35%', qiCost: 22 },
        { id: 'skill_20', name: '暗影步', icon: '🌑', type: '轻功', grade: '优品', desc: '融入暗影，来去无踪', effect: '闪避+25%', qiCost: 15 },
    ],
    // 第5页：仙品功法
    [
        { id: 'skill_21', name: '太虚真经', icon: '✨', type: '内功', grade: '仙品', desc: '太虚之境，真气无穷', effect: '真气上限+50%', qiCost: 0 },
        { id: 'skill_22', name: '不灭金身', icon: '🟡', type: '防御', grade: '仙品', desc: '金身不灭，万法不侵', effect: '防御+40%', qiCost: 20 },
        { id: 'skill_23', name: '九天玄步', icon: '☁️', type: '轻功', grade: '仙品', desc: '踏云而行，瞬息千里', effect: '闪避+35%', qiCost: 20 },
        { id: 'skill_24', name: '星辰剑诀', icon: '⭐', type: '剑法', grade: '仙品', desc: '引星辰之力入剑', effect: '剑法伤害+50%', qiCost: 30 },
        { id: 'skill_25', name: '混沌开天', icon: '🌌', type: '绝技', grade: '仙品', desc: '混沌之力，开天辟地', effect: '全系伤害+45%', qiCost: 35 },
    ],
    // 第6页：毒术功法
    [
        { id: 'skill_26', name: '五毒经', icon: '🕷️', type: '毒术', grade: '良品', desc: '五毒之力，蚀骨腐心', effect: '毒系伤害+20%', qiCost: 10 },
        { id: 'skill_27', name: '万蛊噬心', icon: '🐛', type: '毒术', grade: '优品', desc: '蛊虫噬心，防不胜防', effect: '毒系伤害+30%', qiCost: 18 },
        { id: 'skill_28', name: '化血神功', icon: '🩸', type: '内功', grade: '优品', desc: '化血为气，以战养战', effect: '吸血+15%', qiCost: 0 },
        { id: 'skill_29', name: '幽冥鬼爪', icon: '👻', type: '拳掌', grade: '优品', desc: '鬼爪索命，阴毒无比', effect: '拳掌伤害+30%', qiCost: 15 },
        { id: 'skill_30', name: '噬魂术', icon: '💀', type: '奇门', grade: '仙品', desc: '吞噬魂魄，壮大己身', effect: '击杀恢复+25%', qiCost: 25 },
    ],
    // 第7页：医术功法
    [
        { id: 'skill_31', name: '回春术', icon: '🌸', type: '医术', grade: '凡品', desc: '春风化雨，愈合伤口', effect: '治疗+20%', qiCost: 8 },
        { id: 'skill_32', name: '金针渡穴', icon: '📌', type: '医术', grade: '良品', desc: '金针刺穴，疏通经脉', effect: '治疗+30%', qiCost: 12 },
        { id: 'skill_33', name: '九转还魂', icon: '💚', type: '医术', grade: '优品', desc: '九转回天，起死回生', effect: '治疗+50%', qiCost: 25 },
        { id: 'skill_34', name: '清心咒', icon: '🧘', type: '医术', grade: '良品', desc: '清心寡欲，驱除心魔', effect: '意志+15%', qiCost: 10 },
        { id: 'skill_35', name: '金刚伏魔', icon: '🔱', type: '防御', grade: '优品', desc: '佛门护法，降妖伏魔', effect: '防御+30%', qiCost: 15 },
    ],
    // 第8页：锻造炼制
    [
        { id: 'skill_36', name: '炼器入门', icon: '🔧', type: '锻造', grade: '凡品', desc: '基础炼器之法', effect: '锻造成功率+10%', qiCost: 0 },
        { id: 'skill_37', name: '神匠心得', icon: '⚒️', type: '锻造', grade: '优品', desc: '神匠毕生经验', effect: '锻造成功率+30%', qiCost: 0 },
        { id: 'skill_38', name: '丹道初解', icon: '💊', type: '炼制', grade: '凡品', desc: '炼丹入门基础', effect: '炼制成功率+10%', qiCost: 0 },
        { id: 'skill_39', name: '九转丹诀', icon: '🏺', type: '炼制', grade: '优品', desc: '九转炼丹秘法', effect: '炼制成功率+30%', qiCost: 0 },
        { id: 'skill_40', name: '符箓大全', icon: '📜', type: '奇门', grade: '良品', desc: '符箓制作之法', effect: '符箓伤害+20%', qiCost: 10 },
    ],
    // 第9页：射术奇门
    [
        { id: 'skill_41', name: '穿云箭', icon: '🏹', type: '射术', grade: '良品', desc: '箭穿云霄，百发百中', effect: '射术伤害+25%', qiCost: 10 },
        { id: 'skill_42', name: '流星赶月', icon: '☄️', type: '射术', grade: '优品', desc: '箭如流星，追风赶月', effect: '射术伤害+35%', qiCost: 18 },
        { id: 'skill_43', name: '八卦阵', icon: '☯️', type: '奇门', grade: '良品', desc: '八卦迷踪，困敌无形', effect: '控制+20%', qiCost: 15 },
        { id: 'skill_44', name: '天罗地网', icon: '🕸️', type: '奇门', grade: '优品', desc: '天罗地网，无处可逃', effect: '控制+30%', qiCost: 20 },
        { id: 'skill_45', name: '追魂夺命', icon: '🎯', type: '射术', grade: '仙品', desc: '一箭追魂，例不虚发', effect: '射术伤害+50%', qiCost: 30 },
    ],
    // 第10页：终极功法
    [
        { id: 'skill_46', name: '太极无极', icon: '☯️', type: '内功', grade: '仙品', desc: '太极生两仪，无极生太极', effect: '全属性+20%', qiCost: 0 },
        { id: 'skill_47', name: '诛仙剑阵', icon: '⚔️', type: '剑法', grade: '仙品', desc: '上古诛仙剑阵', effect: '剑法伤害+60%', qiCost: 40 },
        { id: 'skill_48', name: '盘古开天斧', icon: '🪓', type: '长兵', grade: '仙品', desc: '盘古之力，开天辟地', effect: '长兵伤害+55%', qiCost: 40 },
        { id: 'skill_49', name: '女娲补天诀', icon: '🌈', type: '医术', grade: '仙品', desc: '女娲神力，补天再造', effect: '治疗+80%', qiCost: 50 },
        { id: 'skill_50', name: '鸿蒙至尊功', icon: '👑', type: '内功', grade: '仙品', desc: '鸿蒙未判，至尊无敌', effect: '全属性+35%', qiCost: 0 },
    ],
];

// ---------- 装备槽位定义（借鉴《觅长生》）----------
const equipmentSlots = [
    { id: 'head', name: '头部', icon: '🎩', desc: '头盔/帽子/发簪', slotType: 'armor' },
    { id: 'neck', name: '颈部', icon: '📿', desc: '项链/护颈', slotType: 'accessory' },
    { id: 'body', name: '身体', icon: '👘', desc: '衣服/铠甲/道袍', slotType: 'armor' },
    { id: 'waist', name: '腰部', icon: '🎗️', desc: '腰带/玉佩', slotType: 'accessory' },
    { id: 'hands', name: '手部', icon: '🧤', desc: '手套', slotType: 'armor' },
    { id: 'feet', name: '脚部', icon: '👢', desc: '鞋子/靴子', slotType: 'armor' },
    { id: 'mainHand', name: '主手', icon: '⚔️', desc: '主手武器', slotType: 'weapon' },
    { id: 'offHand', name: '副手', icon: '🛡️', desc: '副手武器/盾牌', slotType: 'weapon' },
    { id: 'ring1', name: '戒指1', icon: '💍', desc: '左手戒指', slotType: 'accessory' },
    { id: 'ring2', name: '戒指2', icon: '💍', desc: '右手戒指', slotType: 'accessory' },
    { id: 'acc1', name: '饰品1', icon: '🔮', desc: '特殊饰品', slotType: 'accessory' },
    { id: 'acc2', name: '饰品2', icon: '🔮', desc: '特殊饰品', slotType: 'accessory' },
];

// v9.4 运功栏：内功 / 身法 / 绝技 各一
const skillSlots = [
    { id: 'skill_main', name: '内功', icon: '📖', desc: '核心修炼功法' },
    { id: 'skill_sub1', name: '身法', icon: '💨', desc: '身法轻功' },
    { id: 'skill_sub2', name: '绝技', icon: '⚡', desc: '战斗绝技' },
];

// 当前装备状态（12个槽位）
let currentEquipment = {
    head: null,
    neck: null,
    body: null,
    waist: null,
    hands: null,
    feet: null,
    mainHand: null,
    offHand: null,
    ring1: null,
    ring2: null,
    acc1: null,
    acc2: null,
};

// 当前运功状态（v9.4：仅三槽）
let currentSkills = {
    skill_main: null,  // 内功
    skill_sub1: null,  // 身法
    skill_sub2: null   // 绝技
};

// 常用栏（6个快捷招式槽，按招式的 moveId 存储）
// 玩家可自由排列常用的招式，战斗中优先显示
let quickMoveSlots = ['', '', '', '', '', ''];

// 获取所有已学功法的招式列表（用于常用栏管理界面）
function getAllLearnedMoves() {
    var moves = [];
    // 遍历所有功法页，找出已学会的
    for (var pi = 0; pi < skillPages.length; pi++) {
        var page = skillPages[pi];
        for (var si = 0; si < page.length; si++) {
            var skill = page[si];
            // 检查是否已学会（knowledge系统或learnedSecrets）
            var isLearned = false;
            if (window.KnowledgeSystem && typeof window.KnowledgeSystem.canEquip === 'function') {
                isLearned = window.KnowledgeSystem.canEquip(skill.id);
            } else if (window.learnedSecrets && window.learnedSecrets.length) {
                isLearned = window.learnedSecrets.indexOf(skill.id) >= 0;
            }
            if (!isLearned) continue;
            // 读取该功法的招式
            var skillMoves = getSkillAttackMoves(skill.id);
            skillMoves.forEach(function(m) {
                moves.push({
                    skillId: skill.id,
                    skillName: skill.name,
                    skillType: skill.type || '未知',
                    moveId: m.id,
                    name: m.name,
                    icon: m.icon || '⚔️',
                    qiCost: m.qiCost || 0,
                    staminaCost: m.staminaCost || 0,
                    desc: m.desc || ''
                });
            });
        }
    }
    return moves;
}

// 设置常用栏槽位
function setQuickMoveSlot(index, moveId) {
    if (index < 0 || index >= quickMoveSlots.length) return false;
    quickMoveSlots[index] = moveId || '';
    // 保存到localStorage
    try { localStorage.setItem('xianxia_quick_moves', JSON.stringify(quickMoveSlots)); } catch(e) {}
    return true;
}

// 获取常用栏中的招式列表
function getQuickMoves() {
    var allMoves = getAllLearnedMoves();
    var result = [];
    for (var i = 0; i < quickMoveSlots.length; i++) {
        var slotMoveId = quickMoveSlots[i];
        if (!slotMoveId) continue;
        // 在所有已学招式中查找
        for (var j = 0; j < allMoves.length; j++) {
            if (allMoves[j].moveId === slotMoveId) {
                result.push(allMoves[j]);
                break;
            }
        }
    }
    return result;
}

// 初始化常用栏（从localStorage读取）
function initQuickMoves() {
    try {
        var saved = localStorage.getItem('xianxia_quick_moves');
        if (saved) {
            var parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length === quickMoveSlots.length) {
                quickMoveSlots.splice(0, quickMoveSlots.length);
                Array.prototype.push.apply(quickMoveSlots, parsed);
            }
        }
    } catch(e) {}
}

// 自动初始化
initQuickMoves();

// 功法类型 → 运功槽映射
const SKILL_CATEGORY_MAP = {
    '内功': 'skill_main',
    '防御': 'skill_main',
    '医术': 'skill_main',
    '锻造': 'skill_main',
    '炼制': 'skill_main',
    '轻功': 'skill_sub1',
    '绝技': 'skill_sub2',
    '剑法': 'skill_sub2',
    '刀法': 'skill_sub2',
    '拳掌': 'skill_sub2',
    '长兵': 'skill_sub2',
    '射术': 'skill_sub2',
    '奇门': 'skill_sub2',
    '毒术': 'skill_sub2',
    '融合功法': 'skill_main'
};

const SKILL_CATEGORY_LABELS = {
    skill_main: '内功',
    skill_sub1: '身法',
    skill_sub2: '绝技'
};

function getSkillSlotForType(type) {
    return SKILL_CATEGORY_MAP[type] || 'skill_sub2';
}

function getSkillCategoryLabel(slotId) {
    return SKILL_CATEGORY_LABELS[slotId] || slotId;
}

// 功法浏览当前页码（兼容旧调用）
let skillBrowsePage = 0;

// 运功/装备选择面板展开状态
let skillSelectExpanded = {
    skill_main: false,
    skill_sub1: false,
    skill_sub2: false
};
let equipSelectExpanded = {};
equipmentSlots.forEach(function (s) { equipSelectExpanded[s.id] = false; });

// ---------- 功法浏览函数 ----------
function getSkillPage(pageIndex) {
    if (pageIndex < 0 || pageIndex >= skillPages.length) return [];
    return skillPages[pageIndex];
}

function getTotalSkillPages() {
    return skillPages.length;
}

function getCurrentSkillPage() {
    return skillBrowsePage;
}

function setCurrentSkillPage(page) {
    if (page >= 0 && page < skillPages.length) {
        skillBrowsePage = page;
    }
}

// ---------- 装备函数 ----------
function equipItem(slot, item) {
    if (!item) return false;
    // v9.8：空槽装备时检查超载
    if (!currentEquipment[slot] && typeof window.getLoadInfo === 'function' && typeof window.getItemWeight === 'function') {
        try {
            var li = window.getLoadInfo();
            var w = window.getItemWeight(item);
            if (li && (li.overloaded || (li.current + w) > li.capacity + 0.01)) {
                if (typeof window.showMessage === 'function') window.showMessage('负荷超载，无法装备', 'warning');
                return false;
            }
        } catch (e) {}
    }
    // F-29：存浅克隆而非模板引用——防 enhancement/battle mutate 全局模板致同款装备串改
    // （背包第二把同款玄铁剑不再显示 +5；强化/耐久挂在克隆实例上）
    var _eqClone = Object.assign({}, item);
    if (typeof _eqClone.enhancementLevel !== 'number') _eqClone.enhancementLevel = 0;
    if (typeof _eqClone.refineLevel !== 'number') _eqClone.refineLevel = 0;
    if (!_eqClone.enchantType) _eqClone.enchantType = null;
    currentEquipment[slot] = _eqClone;
    return true;
}

function unequipItem(slot) {
    const item = currentEquipment[slot];
    currentEquipment[slot] = null;
    return item;
}

function getEquippedItem(slot) {
    return currentEquipment[slot];
}

function getAllEquippedItems() {
    return { ...currentEquipment };
}

// ---------- 技能函数 ----------
function equipSkill(skillId, slot) {
    // v9.2：必须已学会（learned/mastered）才能装备运功
    if (window.KnowledgeSystem && typeof window.KnowledgeSystem.canEquip === 'function') {
        if (!window.KnowledgeSystem.canEquip(skillId)) {
            return false;
        }
    } else if (window.learnedSecrets && window.learnedSecrets.length) {
        var ok = window.learnedSecrets.indexOf(skillId) >= 0;
        if (!ok) return false;
    } else {
        return false;
    }
    const skill = findSkillById(skillId);
    if (!skill) return false;
    // v12.1：灵根限制属于领域规则，必须在唯一装备入口校验，不能只依赖 UI。
    if (typeof window.canUseTechniqueByRoots === 'function' && window.currentCharData) {
        var skillElement = skill.element || skill.elementType || 'neutral';
        if (!window.canUseTechniqueByRoots(window.currentCharData.spiritualRoots, skillElement)) return false;
    }
    // v9.4：未指定槽位时按功法类型自动归入内功/身法/绝技
    if (!slot) {
        slot = getSkillSlotForType(skill.type);
    }
    var expected = getSkillSlotForType(skill.type);
    if (slot !== expected) {
        return false;
    }
    currentSkills[slot] = skill;
    return true;
}

function unequipSkill(slot) {
    const skill = currentSkills[slot];
    currentSkills[slot] = null;
    return skill;
}

function findSkillById(skillId) {
    for (const page of skillPages) {
        for (const skill of page) {
            if (skill.id === skillId) return skill;
        }
    }
    return null;
}

// 旧存档迁移：五槽 → 三槽，按类型重分配
function migrateSkillsToThreeSlots(skillsObj) {
    if (!skillsObj || typeof skillsObj !== 'object') return;
    var collected = [];
    Object.keys(skillsObj).forEach(function (k) {
        if (skillsObj[k]) collected.push(skillsObj[k]);
    });
    // 清空
    currentSkills.skill_main = null;
    currentSkills.skill_sub1 = null;
    currentSkills.skill_sub2 = null;
    // 删除废弃键
    delete currentSkills.skill_sub3;
    delete currentSkills.skill_combat;
    collected.forEach(function (sk) {
        if (!sk || !sk.id) return;
        var slot = getSkillSlotForType(sk.type || '绝技');
        // 同槽只保留第一个（或已有则跳过）
        if (!currentSkills[slot]) {
            // 知识检查：未学会则跳过
            if (window.KnowledgeSystem && window.KnowledgeSystem.canEquip) {
                if (!window.KnowledgeSystem.canEquip(sk.id)) return;
            }
            currentSkills[slot] = sk;
        }
    });
}

// ---------- 对外暴露 ----------
window.skillPages = skillPages;
window.equipmentSlots = equipmentSlots;
window.skillSlots = skillSlots;
window.currentEquipment = currentEquipment;
window.currentSkills = currentSkills;
window.quickMoveSlots = quickMoveSlots;
window.skillBrowsePage = skillBrowsePage;
window.SKILL_CATEGORY_MAP = SKILL_CATEGORY_MAP;
window.SKILL_CATEGORY_LABELS = SKILL_CATEGORY_LABELS;
window.getSkillSlotForType = getSkillSlotForType;
window.getSkillCategoryLabel = getSkillCategoryLabel;
window.skillSelectExpanded = skillSelectExpanded;
window.equipSelectExpanded = equipSelectExpanded;
window.migrateSkillsToThreeSlots = migrateSkillsToThreeSlots;
window.getSkillPage = getSkillPage;
window.getTotalSkillPages = getTotalSkillPages;
window.getCurrentSkillPage = getCurrentSkillPage;
window.setCurrentSkillPage = setCurrentSkillPage;
window.equipItem = equipItem;
window.unequipItem = unequipItem;
window.getEquippedItem = getEquippedItem;
window.getAllEquippedItems = getAllEquippedItems;
window.equipSkill = equipSkill;
window.unequipSkill = unequipSkill;
window.findSkillById = findSkillById;
window.getAllLearnedMoves = getAllLearnedMoves;
window.getQuickMoves = getQuickMoves;
window.setQuickMoveSlot = setQuickMoveSlot;
window.initQuickMoves = initQuickMoves;

// v12.1：快捷招式进入统一模块状态，不再依赖独立 localStorage 作为真源。
if (window.StateRegistry) {
    window.StateRegistry.register('quickMoves', {
        version: 1,
        export: function() { return quickMoveSlots.slice(); },
        import: function(data) {
            var arr = Array.isArray(data) ? data.slice(0, 6) : [];
            while (arr.length < 6) arr.push('');
            quickMoveSlots.splice(0, quickMoveSlots.length);
            Array.prototype.push.apply(quickMoveSlots, arr);
            window.quickMoveSlots = quickMoveSlots;
        },
        reset: function() {
            quickMoveSlots.splice(0, quickMoveSlots.length, '', '', '', '', '', '');
            window.quickMoveSlots = quickMoveSlots;
        }
    });
}

