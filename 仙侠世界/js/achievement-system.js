/**
 * xianxia-achievement-system.js - 成就和任务系统
 * 从Degrees of Lewdity提取的成就/任务功能
 */

// 确保gameLog存在
if (typeof window !== 'undefined' && !window.gameLog) {
    window.gameLog = {
        entries: [],
        add: function(msg, type) { console.log(`[${type}] ${msg}`); }
    };
}

// ==================== 成就类 ====================
class Achievement {
    constructor(id, name, description, options = {}) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.category = options.category || 'general'; // general, combat, exploration, social, cultivation
        this.requirements = options.requirements || {};
        this.progress = 0;
        this.maxProgress = options.maxProgress || 1;
        this.isCompleted = false;
        this.isUnlocked = false;
        this.reward = options.reward || {};
        this.icon = options.icon || '🏆';
        this.rarity = options.rarity || 'common'; // common, uncommon, rare, epic, legendary
        this.points = options.points || 10;
        this.hidden = options.hidden || false;
        this.tags = options.tags || [];
    }
    
    // 检查是否完成
    checkCompletion(playerData) {
        if (this.isCompleted) return false;
        
        let completed = true;
        for (const [key, requiredValue] of Object.entries(this.requirements)) {
            const playerValue = this.getNestedValue(playerData, key);
            if (typeof requiredValue === 'object' && requiredValue.operator) {
                // 支持操作符: gt, lt, gte, lte, eq
                switch (requiredValue.operator) {
                    case 'gt': if (!(playerValue > requiredValue.value)) completed = false; break;
                    case 'lt': if (!(playerValue < requiredValue.value)) completed = false; break;
                    case 'gte': if (!(playerValue >= requiredValue.value)) completed = false; break;
                    case 'lte': if (!(playerValue <= requiredValue.value)) completed = false; break;
                    case 'eq': if (!(playerValue === requiredValue.value)) completed = false; break;
                    default: if (playerValue < requiredValue) completed = false;
                }
            } else {
                if (playerValue < requiredValue) completed = false;
            }
        }
        
        if (completed) {
            this.complete();
        }
        
        return completed;
    }
    
    // 获取嵌套值
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current && current[key], obj);
    }
    
    // 更新进度
    updateProgress(amount = 1) {
        if (this.isCompleted) return;
        
        this.progress = Math.min(this.progress + amount, this.maxProgress);
        
        if (this.progress >= this.maxProgress) {
            this.complete();
        }
    }
    
    // 完成成就
    complete() {
        if (this.isCompleted) return;
        
        this.isCompleted = true;
        this.isUnlocked = true;
        this.progress = this.maxProgress;
        
        gameLog.add(`🏆 成就解锁: ${this.name}`, 'success');
        showMessage(`成就解锁: ${this.name}`, 'success');
        
        // 给予奖励
        if (this.reward) {
            this.applyReward();
        }
    }
    
    // 应用奖励
    applyReward() {
        // B5：接入正式角色/背包
        var cd = window.currentCharData;
        if (this.reward.exp && cd) {
            cd.tempering = (cd.tempering || 0) + this.reward.exp;
        }
        if (this.reward.gold) {
            if (window.XianXia && window.XianXia.DataManager) {
                window.XianXia.DataManager.setCopper(window.XianXia.DataManager.getCopper() + this.reward.gold);
            } else if (window.inventory && window.inventory.currency) {
                window.inventory.currency.copper = (window.inventory.currency.copper || 0) + this.reward.gold;
            } else if (cd) cd.copper = (cd.copper || 0) + this.reward.gold;
        }
        if (this.reward.items) {
            for (const item of this.reward.items) {
                var id = item.itemId || item.id || item.templateId;
                var cnt = item.count || 1;
                if (id && typeof window.addItem === 'function') window.addItem(id, cnt);
            }
        }
        if (this.reward.special) {
            this.reward.special();
        }
        if (window.showMessage && this.reward) {
            window.showMessage('成就奖励已发放', 'success');
        }
    }
    
    // 序列化
    serialize() {
        return {
            id: this.id,
            name: this.name,
            category: this.category,
            progress: this.progress,
            maxProgress: this.maxProgress,
            isCompleted: this.isCompleted,
            isUnlocked: this.isUnlocked,
            icon: this.icon,
            rarity: this.rarity,
            points: this.points,
            hidden: this.hidden,
            tags: this.tags
        };
    }
    
    // 反序列化
    static deserialize(data) {
        const achievement = new Achievement(data.id, data.name, '', {
            category: data.category,
            icon: data.icon,
            rarity: data.rarity,
            points: data.points,
            hidden: data.hidden,
            tags: data.tags
        });
        achievement.progress = data.progress;
        achievement.maxProgress = data.maxProgress;
        achievement.isCompleted = data.isCompleted;
        achievement.isUnlocked = data.isUnlocked;
        return achievement;
    }
}

// 任务系统已统一迁移至 js/quest/quest-system.js，避免两套 Quest 真源并存。

// ==================== 成就管理器 ====================
class AchievementManager {
    constructor() {
        this.achievements = new Map();
        this.completedAchievements = new Set();
        this.totalPoints = 0;
    }
    
    // 添加成就
    addAchievement(achievement) {
        this.achievements.set(achievement.id, achievement);
    }
    
    // 获取成就
    getAchievement(id) {
        return this.achievements.get(id);
    }
    
    // 获取所有成就
    getAllAchievements() {
        return Array.from(this.achievements.values());
    }
    
    // 获取已完成的成就
    getCompletedAchievements() {
        return Array.from(this.completedAchievements);
    }
    
    // 检查所有成就
    checkAllAchievements(playerData) {
        for (const achievement of this.achievements.values()) {
            if (!achievement.isCompleted) {
                achievement.checkCompletion(playerData);
                if (achievement.isCompleted) {
                    this.completedAchievements.add(achievement.id);
                    this.totalPoints += achievement.points;
                }
            }
        }
    }
    
    // 获取成就统计
    getStatistics() {
        const all = this.getAllAchievements();
        const completed = this.getCompletedAchievements();
        
        return {
            total: all.length,
            completed: completed.length,
            completionRate: all.length > 0 ? (completed.length / all.length * 100).toFixed(1) : 0,
            totalPoints: this.totalPoints,
            byCategory: this.getStatisticsByCategory(),
            byRarity: this.getStatisticsByRarity()
        };
    }
    
    // 按分类统计
    getStatisticsByCategory() {
        const stats = {};
        for (const achievement of this.getAllAchievements()) {
            if (!stats[achievement.category]) {
                stats[achievement.category] = { total: 0, completed: 0 };
            }
            stats[achievement.category].total++;
            if (achievement.isCompleted) {
                stats[achievement.category].completed++;
            }
        }
        return stats;
    }
    
    // 按稀有度统计
    getStatisticsByRarity() {
        const stats = {};
        for (const achievement of this.getAllAchievements()) {
            if (!stats[achievement.rarity]) {
                stats[achievement.rarity] = { total: 0, completed: 0 };
            }
            stats[achievement.rarity].total++;
            if (achievement.isCompleted) {
                stats[achievement.rarity].completed++;
            }
        }
        return stats;
    }
    
    // 序列化
    serialize() {
        return {
            achievements: Array.from(this.achievements.values()).map(a => a.serialize()),
            completedAchievements: Array.from(this.completedAchievements),
            totalPoints: this.totalPoints
        };
    }
    
    // 反序列化
    deserialize(data) {
        this.achievements.clear();
        this.completedAchievements = new Set(data.completedAchievements || []);
        this.totalPoints = data.totalPoints || 0;
        
        for (const achievementData of data.achievements) {
            const achievement = Achievement.deserialize(achievementData);
            this.achievements.set(achievement.id, achievement);
        }
    }
}

// ==================== 预设成就 ====================
const PresetAchievements = [
    new Achievement('first_blood', '初次胜利', '赢得第一场战斗', {
        category: 'combat',
        requirements: { kills: 1 },
        reward: { exp: 50, copper: 100 },
        icon: '⚔️',
        rarity: 'common',
        points: 10
    }),
    
    new Achievement('level_10', '初窥门径', '达到10级', {
        category: 'cultivation',
        requirements: { playerLevel: 10 },
        reward: { exp: 100, copper: 200 },
        icon: '📈',
        rarity: 'common',
        points: 15
    }),
    
    new Achievement('level_50', '登堂入室', '达到50级', {
        category: 'cultivation',
        requirements: { playerLevel: 50 },
        reward: { exp: 500, copper: 1000, items: [{ itemId: 'pill_qi_condense', count: 1 }] },
        icon: '🏅',
        rarity: 'uncommon',
        points: 30
    }),
    
    new Achievement('collector', '收藏家', '收集10种物品', {
        category: 'exploration',
        requirements: { uniqueItemsCollected: 10 },
        reward: { copper: 300 },
        icon: '🎒',
        rarity: 'uncommon',
        points: 20
    }),
    
    new Achievement('social_butterfly', '社交达人', '与10个NPC建立友好关系', {
        category: 'social',
        requirements: { friendlyNPCs: 10 },
        reward: { exp: 200, copper: 500 },
        icon: '🤝',
        rarity: 'rare',
        points: 40
    }),
    
    new Achievement('wealthy', '腰缠万贯', '拥有10000铜钱', {
        category: 'general',
        requirements: { playerGold: 10000 },
        reward: { exp: 300 },
        icon: '💰',
        rarity: 'rare',
        points: 35
    }),
    
    new Achievement('master', '一代宗师', '学会所有基础功法', {
        category: 'cultivation',
        requirements: { skillsLearned: 10 },
        reward: { exp: 1000, copper: 5000 },
        icon: '👑',
        rarity: 'epic',
        points: 100
    })
];

// ==================== 初始化 ====================
function initAchievementSystem() {
    window.achievementManager = new AchievementManager();
    for (const achievement of PresetAchievements) achievementManager.addAchievement(Achievement.deserialize(achievement.serialize()));
    gameLog.add('成就系统已初始化', 'info');
}

if (typeof window !== 'undefined' && window.StateRegistry && typeof window.StateRegistry.register === 'function') {
    window.StateRegistry.register('achievements', {
        version: 1,
        export: function() { return window.achievementManager ? window.achievementManager.serialize() : null; },
        import: function(data) {
            if (!window.achievementManager) initAchievementSystem();
            if (data && Array.isArray(data.achievements)) window.achievementManager.deserialize(data);
        },
        reset: function() { initAchievementSystem(); }
    });
}

// ==================== 导出 ====================
if (typeof window !== 'undefined') {
    window.Achievement = Achievement;
    window.AchievementManager = AchievementManager;
    window.PresetAchievements = PresetAchievements;
    window.initAchievementSystem = initAchievementSystem;
}

if (typeof achievementManager !== 'undefined') {
  window.achievementManager = achievementManager;
  window.checkAllAchievements = function(p) { return achievementManager.checkAllAchievements(p); };
}
