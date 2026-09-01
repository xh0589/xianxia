/**
 * xianxia-status-effects.js - 状态效果系统
 * 从Degrees of Lewdity提取的Buff/Debuff系统
 */

// 确保gameLog存在
if (typeof window !== 'undefined' && !window.gameLog) {
    window.gameLog = {
        entries: [],
        add: function(msg, type) { console.log(`[${type}] ${msg}`); }
    };
}

// ==================== 状态效果类型 ====================
const StatusEffectTypes = {
    BUFF: 'buff',           // 增益
    DEBUFF: 'debuff',       // 减益
    CURSE: 'curse',         // 诅咒
    BLESSING: 'blessing',   // 祝福
    POISON: 'poison',       // 中毒
    DISEASE: 'disease',     // 疾病
    STUN: 'stun',           // 眩晕
    SLEEP: 'sleep',         // 睡眠
    ROOT: 'root',           // 定身
    SILENCE: 'silence',     // 沉默
    BLEED: 'bleed',         // 流血
    BURN: 'burn',           // 燃烧
    FREEZE: 'freeze',       // 冰冻
    CHARM: 'charm',         // 魅惑
    FEAR: 'fear',           // 恐惧
    RAGE: 'rage',           // 暴怒
    SHIELD: 'shield',       // 护盾
    REGEN: 'regen',         // 再生
    CRIT_UP: 'crit_up',     // 暴击提升
    DODGE_UP: 'dodge_up',   // 闪避提升
};

// ==================== 状态效果类 ====================
class StatusEffect {
    constructor(name, type, options = {}) {
        this.name = name;
        this.type = type || StatusEffectTypes.BUFF;
        this.duration = options.duration || 0; // 0表示永久
        this.maxDuration = this.duration;
        this.effects = options.effects || {};
        this.description = options.description || '';
        this.icon = options.icon || '';
        this.rarity = options.rarity || 'common'; // common, rare, epic, legendary
        this.stackable = options.stackable || false;
        this.maxStacks = options.maxStacks || 1;
        this.currentStacks = 1;
        this.tickHandler = options.tickHandler || null;
        this.onApply = options.onApply || null;
        this.onRemove = options.onRemove || null;
        this.conditions = options.conditions || [];
    }
    
    // 检查是否满足应用条件
    canApply(target) {
        if (!this.conditions || this.conditions.length === 0) return true;
        
        for (const condition of this.conditions) {
            if (!condition.check(target)) return false;
        }
        return true;
    }
    
    // 应用效果
    apply(target) {
        if (this.onApply) {
            this.onApply(target);
        }
        
        gameLog.add(`${target.name} 获得了状态效果: ${this.name}`, 'info');
    }
    
    // 移除效果
    remove(target) {
        if (this.onRemove) {
            this.onRemove(target);
        }
        
        gameLog.add(`${target.name} 失去了状态效果: ${this.name}`, 'info');
    }
    
    // Tick处理
    tick(target) {
        if (this.duration > 0) {
            this.duration--;
            if (this.duration <= 0) {
                this.remove(target);
                return false;
            }
        }
        
        if (this.tickHandler) {
            this.tickHandler(target, this);
        }
        
        return true;
    }
    
    // 增加层数
    addStack() {
        if (!this.stackable) return false;
        if (this.currentStacks < this.maxStacks) {
            this.currentStacks++;
            return true;
        }
        return false;
    }
    
    // 减少层数
    removeStack() {
        if (this.currentStacks > 1) {
            this.currentStacks--;
            return true;
        }
        return false;
    }
    
    // 序列化
    serialize() {
        return {
            name: this.name,
            type: this.type,
            duration: this.duration,
            maxDuration: this.maxDuration,
            effects: this.effects,
            description: this.description,
            icon: this.icon,
            rarity: this.rarity,
            stackable: this.stackable,
            maxStacks: this.maxStacks,
            currentStacks: this.currentStacks
        };
    }
    
    // 反序列化
    static deserialize(data) {
        // 预设效果优先从模板重建，以保留 poison 等 tickHandler/onApply/onRemove 行为；
        // 直接 JSON 反序列化函数会丢失，因此不能只恢复纯数据壳。
        let preset = null;
        if (typeof PresetStatusEffects !== 'undefined') {
            preset = PresetStatusEffects[data.type] || Object.values(PresetStatusEffects).find(p => p && p.name === data.name) || null;
        }
        const effect = new StatusEffect(data.name, data.type, {
            duration: data.duration,
            effects: { ...(preset?.effects || {}), ...(data.effects || {}) },
            description: data.description || preset?.description || '',
            icon: data.icon || preset?.icon || '',
            rarity: data.rarity || preset?.rarity || 'common',
            stackable: data.stackable != null ? data.stackable : !!preset?.stackable,
            maxStacks: data.maxStacks || preset?.maxStacks || 1,
            tickHandler: preset?.tickHandler || null,
            onApply: preset?.onApply || null,
            onRemove: preset?.onRemove || null,
            conditions: preset?.conditions || []
        });
        effect.maxDuration = data.maxDuration != null ? data.maxDuration : effect.maxDuration;
        effect.currentStacks = data.currentStacks || 1;
        return effect;
    }
}

// ==================== 预设状态效果 ====================
const PresetStatusEffects = {
    // 增益效果
    [StatusEffectTypes.REGEN]: new StatusEffect('生命再生', StatusEffectTypes.REGEN, {
        duration: 5,
        description: '每回合恢复生命值',
        effects: { hpRegen: 10 },
        icon: '💚'
    }),
    
    [StatusEffectTypes.CRIT_UP]: new StatusEffect('暴击强化', StatusEffectTypes.CRIT_UP, {
        duration: 3,
        description: '暴击率提升20%',
        effects: { critRate: 20 },
        icon: '⚔️'
    }),
    
    [StatusEffectTypes.DODGE_UP]: new StatusEffect('身法灵动', StatusEffectTypes.DODGE_UP, {
        duration: 3,
        description: '闪避率提升15%',
        effects: { dodgeRate: 15 },
        icon: '💨'
    }),
    
    [StatusEffectTypes.SHIELD]: new StatusEffect('护体金光', StatusEffectTypes.SHIELD, {
        duration: 4,
        description: '吸收30点伤害',
        effects: { shield: 30 },
        icon: '🛡️'
    }),
    
    [StatusEffectTypes.RAGE]: new StatusEffect('暴怒', StatusEffectTypes.RAGE, {
        duration: 3,
        description: '攻击力提升50%，防御力降低20%',
        effects: { attackMult: 1.5, defenseMult: 0.8 },
        icon: '😤'
    }),
    
    // 减益效果（v9.8：tick 时按毒抗减免）
    [StatusEffectTypes.POISON]: new StatusEffect('中毒', StatusEffectTypes.POISON, {
        duration: 5,
        description: '每回合损失生命值（受毒抗减免）',
        effects: { hpDamage: -5 },
        icon: '☠️',
        rarity: 'rare',
        tickHandler: function(target, effect) {
            var base = 5 * (effect.currentStacks || 1);
            var res = 0;
            try {
                if (typeof window.getDerivedCombatStats === 'function') {
                    res = (window.getDerivedCombatStats(target) || {}).poisonRes || 0;
                }
            } catch (e) {}
            var dmg = Math.max(1, Math.floor(base * (1 - res / 100)));
            if (target.physiology && target.physiology.bloodVolume != null) {
                target.physiology.bloodVolume = Math.max(0, target.physiology.bloodVolume - dmg);
                target.physiology.health = target.physiology.bloodVolume;
            } else if (target.health != null) {
                target.health = Math.max(0, target.health - dmg);
            }
        }
    }),
    
    [StatusEffectTypes.BLEED]: new StatusEffect('流血', StatusEffectTypes.BLEED, {
        duration: 4,
        description: '持续损失生命值',
        effects: { hpDamage: -8 },
        icon: '🩸',
        rarity: 'rare'
    }),
    
    [StatusEffectTypes.BURN]: new StatusEffect('燃烧', StatusEffectTypes.BURN, {
        duration: 3,
        description: '持续损失生命值并降低防御',
        effects: { hpDamage: -10, defenseMult: 0.7 },
        icon: '🔥',
        rarity: 'epic'
    }),
    
    [StatusEffectTypes.FREEZE]: new StatusEffect('冰冻', StatusEffectTypes.FREEZE, {
        duration: 2,
        description: '无法行动',
        effects: { skipTurn: true },
        icon: '❄️',
        rarity: 'rare'
    }),
    
    [StatusEffectTypes.STUN]: new StatusEffect('眩晕', StatusEffectTypes.STUN, {
        duration: 1,
        description: '无法行动一回合',
        effects: { skipTurn: true },
        icon: '💫'
    }),
    
    [StatusEffectTypes.SLEEP]: new StatusEffect('睡眠', StatusEffectTypes.SLEEP, {
        duration: 2,
        description: '无法行动，受到攻击会醒来',
        effects: { skipTurn: true, vulnerable: true },
        icon: '😴'
    }),
    
    [StatusEffectTypes.ROOT]: new StatusEffect('定身', StatusEffectTypes.ROOT, {
        duration: 2,
        description: '无法移动',
        effects: { cannotMove: true },
        icon: '🌿'
    }),
    
    [StatusEffectTypes.SILENCE]: new StatusEffect('沉默', StatusEffectTypes.SILENCE, {
        duration: 3,
        description: '无法使用技能',
        effects: { cannotUseSkills: true },
        icon: '🤐'
    }),
    
    [StatusEffectTypes.CHARM]: new StatusEffect('魅惑', StatusEffectTypes.CHARM, {
        duration: 4,
        description: '有概率攻击队友',
        effects: { chanceAttackAlly: 0.5 },
        icon: '💕',
        rarity: 'epic'
    }),
    
    [StatusEffectTypes.FEAR]: new StatusEffect('恐惧', StatusEffectTypes.FEAR, {
        duration: 3,
        description: '属性降低20%',
        effects: { allStatsMult: 0.8 },
        icon: '😱',
        rarity: 'rare'
    }),
    
    [StatusEffectTypes.CURSE]: new StatusEffect('诅咒', StatusEffectTypes.CURSE, {
        duration: 0,
        description: '永久负面效果',
        effects: { maxHpReduce: 0.2 },
        icon: '👹',
        rarity: 'legendary'
    }),
    
    [StatusEffectTypes.BLESSING]: new StatusEffect('祝福', StatusEffectTypes.BLESSING, {
        duration: 0,
        description: '永久正面效果',
        effects: { expBonus: 0.1 },
        icon: '✨',
        rarity: 'legendary'
    })
};

// ==================== 状态效果管理器 ====================
class StatusEffectManager {
    constructor() {
        this.activeEffects = new Map(); // entityId -> Map<effectName, StatusEffect>
    }
    
    // 添加状态效果
    addEffect(entityId, effectNameOrEffect, duration = null) {
        let effect;
        if (effectNameOrEffect instanceof StatusEffect) {
            effect = effectNameOrEffect;
        } else if (PresetStatusEffects[effectNameOrEffect]) {
            effect = PresetStatusEffects[effectNameOrEffect].deepCopy ? 
                    PresetStatusEffects[effectNameOrEffect].deepCopy() : 
                    new StatusEffect(PresetStatusEffects[effectNameOrEffect].name, 
                                   PresetStatusEffects[effectNameOrEffect].type,
                                   { duration: duration !== null ? duration : PresetStatusEffects[effectNameOrEffect].duration,
                                     effects: {...PresetStatusEffects[effectNameOrEffect].effects},
                                     description: PresetStatusEffects[effectNameOrEffect].description,
                                     icon: PresetStatusEffects[effectNameOrEffect].icon,
                                     rarity: PresetStatusEffects[effectNameOrEffect].rarity });
        } else {
            console.warn(`Unknown status effect: ${effectNameOrEffect}`);
            return false;
        }
        
        if (duration !== null) {
            effect.duration = duration;
            effect.maxDuration = duration;
        }
        
        if (!this.activeEffects.has(entityId)) {
            this.activeEffects.set(entityId, new Map());
        }
        
        const entityEffects = this.activeEffects.get(entityId);
        
        // 检查是否可叠加
        if (entityEffects.has(effect.name)) {
            const existing = entityEffects.get(effect.name);
            if (existing.stackable && existing.currentStacks < existing.maxStacks) {
                existing.addStack();
                return true;
            }
            return false;
        }
        
        entityEffects.set(effect.name, effect);
        effect.apply({ name: entityId });
        return true;
    }
    
    // 移除状态效果
    removeEffect(entityId, effectName) {
        if (!this.activeEffects.has(entityId)) return false;
        
        const entityEffects = this.activeEffects.get(entityId);
        const effect = entityEffects.get(effectName);
        if (!effect) return false;
        
        effect.remove({ name: entityId });
        entityEffects.delete(effectName);
        return true;
    }
    
    // 减少层数
    reduceStack(entityId, effectName) {
        if (!this.activeEffects.has(entityId)) return false;
        
        const entityEffects = this.activeEffects.get(entityId);
        const effect = entityEffects.get(effectName);
        if (!effect || !effect.stackable) return false;
        
        if (effect.removeStack()) {
            return true;
        }
        
        this.removeEffect(entityId, effectName);
        return true;
    }
    
    // 获取状态效果
    getEffect(entityId, effectName) {
        if (!this.activeEffects.has(entityId)) return null;
        return this.activeEffects.get(entityId).get(effectName) || null;
    }
    
    // 获取所有状态效果
    getAllEffects(entityId) {
        if (!this.activeEffects.has(entityId)) return [];
        return Array.from(this.activeEffects.get(entityId).values());
    }
    
    // 检查是否有状态效果
    hasEffect(entityId, effectName) {
        if (!this.activeEffects.has(entityId)) return false;
        return this.activeEffects.get(entityId).has(effectName);
    }
    
    // 清除所有状态效果
    clearAllEffects(entityId) {
        if (!this.activeEffects.has(entityId)) return;
        
        const entityEffects = this.activeEffects.get(entityId);
        for (const [name, effect] of entityEffects) {
            effect.remove({ name: entityId });
        }
        entityEffects.clear();
    }
    
    // Tick处理
    tickAll() {
        for (const [entityId, entityEffects] of this.activeEffects) {
            for (const [name, effect] of entityEffects) {
                const keep = effect.tick({ name: entityId });
                if (!keep) {
                    entityEffects.delete(name);
                }
            }
            
            if (entityEffects.size === 0) {
                this.activeEffects.delete(entityId);
            }
        }
    }
    
    // 获取属性加成
    getStatBonuses(entityId) {
        let bonuses = {};
        
        if (!this.activeEffects.has(entityId)) return bonuses;
        
        for (const [, effect] of this.activeEffects.get(entityId)) {
            if (effect.effects) {
                Object.assign(bonuses, effect.effects);
            }
        }
        
        return bonuses;
    }
    
    // 序列化
    serialize() {
        const result = {};
        for (const [entityId, entityEffects] of this.activeEffects) {
            result[entityId] = {};
            for (const [name, effect] of entityEffects) {
                result[entityId][name] = effect.serialize();
            }
        }
        return result;
    }
    
    // 反序列化
    deserialize(data) {
        this.activeEffects.clear();
        
        for (const [entityId, entityEffects] of Object.entries(data)) {
            this.activeEffects.set(entityId, new Map());
            for (const [name, effectData] of Object.entries(entityEffects)) {
                const effect = StatusEffect.deserialize(effectData);
                this.activeEffects.get(entityId).set(name, effect);
            }
        }
    }
}

// ==================== 初始化 ====================
function initStatusEffects() {
    window.statusEffectManager = new StatusEffectManager();
    window.StatusEffect = StatusEffect;
    window.PresetStatusEffects = PresetStatusEffects;
    window.StatusEffectTypes = StatusEffectTypes;
    
    gameLog.add('状态效果系统已初始化', 'info');
}

// ==================== 导出 ====================
if (typeof window !== 'undefined') {
    window.StatusEffectManager = StatusEffectManager;
    window.initStatusEffects = initStatusEffects;
}


// 角色状态效果属于存档状态；注册表在 status-effects.js 之前加载。
if (typeof window !== 'undefined' && window.StateRegistry && typeof window.StateRegistry.register === 'function') {
    window.StateRegistry.register('statusEffects', {
        export: function() {
            return window.statusEffectManager && typeof window.statusEffectManager.serialize === 'function'
                ? window.statusEffectManager.serialize() : {};
        },
        import: function(data) {
            if (!window.statusEffectManager) window.statusEffectManager = new StatusEffectManager();
            window.statusEffectManager.deserialize(data || {});
        },
        reset: function() {
            if (!window.statusEffectManager) window.statusEffectManager = new StatusEffectManager();
            window.statusEffectManager.activeEffects.clear();
        }
    });
}
