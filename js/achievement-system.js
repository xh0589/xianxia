/**
 * xianxia-achievement-system.js - 成就系统（v20.11 重构）
 *
 * v20.11 修的根本性缺陷：
 *   1. 旧版初始化把预设成就 serialize→deserialize 来回倒，requirements/reward
 *      未被序列化 → 全部成就条件变空 → 第一次检查全体秒解锁（白送 bug）。
 *   2. 旧版 7 个预设的条件键 kills/playerLevel/playerGold/friendlyNPCs/
 *      uniqueItemsCollected/skillsLearned 在角色数据上根本不存在（幽灵键），
 *      永远无法真实点亮；reward.copper 键也没人消费。
 *   3. 无任何成就 UI；检查只挂在战斗胜利一处，非战斗成就永远不触发。
 *   4. 读档 deserialize 清空注册表用存档原样覆盖 → 版本更新新增的成就对旧档不可见。
 *
 * 现设计：
 *   - buildAchievementProfile()：只读快照，逐源取真值（角色数据/统一货币入口/
 *     藏功名录/收藏系统/门派弟子状态/灵兽/城府试炼剑意/历日），不新增任何持久化状态。
 *   - 成就条件只允许写档案快照上存在的路径（tests/v20.11 有防幽灵键全表校验）。
 *   - 奖励发放复用真源：历练→tempering、钱→DataManager、灵石→DataManager、
 *     名气/业障→RewardService（不可用就地钳位兜底）。
 *   - StateRegistry 读档改「并档」：存档状态覆盖定义，定义新增项保留默认，
 *     总积分按完成集重算（单一真源，不随存档漂移）。
 */

// 确保gameLog存在
if (typeof window !== 'undefined' && !window.gameLog) {
    window.gameLog = {
        entries: [],
        add: function(msg, type) { console.log(`[${type}] ${msg}`); }
    };
}

function _achNum(v) { var n = Number(v); return isFinite(n) ? n : 0; }

// ==================== 成就档案快照（只读派生，唯一真源拼装） ====================
// ⚠️ 成就 requirements 的路径必须在此对象上有定义，否则永远不会点亮（幽灵键）。
// 新增真源时同步扩这里，并保持"缺世界数据时给保守 0 值"。
function buildAchievementProfile() {
    var cd = (typeof window !== 'undefined' && window.currentCharData) || {};
    var p = {};
    // —— 战阵 ——
    p.killCount = _achNum(cd._killCount);
    // —— 修行 ——
    var idx = -1;
    try {
        if (typeof window.getRealmIndex === 'function' && window.REALM_CONFIG) idx = window.getRealmIndex(cd.realm);
    } catch (e) {}
    p.ascended = (cd.realm === '飞升' || cd.realm === '金仙') ? 1 : 0;
    p.realmIdx = p.ascended ? 9 : (idx < 0 ? 0 : idx); // 渡劫=8，飞升以后视为顶格 9
    p.tempering = _achNum(cd.tempering);
    p.luck = _achNum(cd.luck != null ? cd.luck : 50); // 与全游戏口径一致：缺省视为 50
    p.karma = _achNum(cd.karma);
    p.fame = _achNum(cd.fame);
    p.notoriety = _achNum(cd.notoriety);
    // —— 财富：统一货币入口优先 ——
    try {
        if (window.XianXia && window.XianXia.DataManager) {
            p.copper = _achNum(window.XianXia.DataManager.getCopper());
            p.spiritStones = _achNum(window.XianXia.DataManager.getSpiritStones());
        } else {
            p.copper = _achNum(cd.copper);
            p.spiritStones = _achNum(cd.spiritStones);
        }
    } catch (e) { p.copper = _achNum(cd.copper); p.spiritStones = _achNum(cd.spiritStones); }
    // —— 学艺 ——
    p.arts = (window.learnedSecrets && window.learnedSecrets.length) || 0;
    // —— 收藏与人事：优先复用收藏系统真源，缺席就地自算兜底 ——
    var stats = null;
    try { if (typeof window.getCollectionStats === 'function') stats = window.getCollectionStats(); } catch (e) {}
    if (stats) {
        p.uniqueItems = _achNum(stats.items);
        p.friends = _achNum(stats.npcs);
    } else {
        p.uniqueItems = 0; p.friends = 0;
        try {
            var seen = {};
            var slots = (window.inventory && window.inventory.slots) || [];
            for (var i = 0; i < slots.length; i++) {
                var it = slots[i] && slots[i].item;
                if (it && it.templateId) seen[it.templateId] = 1;
            }
            p.uniqueItems = Object.keys(seen).length;
        } catch (e) {}
        try {
            if (window.npcManager && typeof window.npcManager.getAllNPCs === 'function') {
                var npcs = window.npcManager.getAllNPCs() || [];
                for (var j = 0; j < npcs.length; j++) {
                    var aff = npcs[j] && npcs[j].relationship ? npcs[j].relationship.affection : (npcs[j] ? npcs[j].affection : 0);
                    if (_achNum(aff) > 0) p.friends++;
                }
            }
        } catch (e) {}
    }
    // —— 门派 ——
    var ds = window.discipleState || {};
    p.sectJoined = ds.isInSect ? 1 : 0;
    p.sectRankId = ds.isInSect ? _achNum(ds.rank) : 9; // 9=野身，任何"位分≤N"成就天然不成立
    p.contribution = _achNum(ds.contribution);
    // —— 灵兽 ——
    var beasts = (window.tamedBeasts && window.tamedBeasts.length != null) ? window.tamedBeasts : [];
    p.beasts = beasts.length || 0;
    p.beastMaxLevel = 0;
    for (var b = 0; b < p.beasts; b++) {
        var lv = _achNum(beasts[b] && beasts[b].level);
        if (lv > p.beastMaxLevel) p.beastMaxLevel = lv;
    }
    // —— 城府：试炼塔与剑冢 ——
    p.towerBest = 0; p.swordIntent = 0;
    try {
        if (window.CityDepth && typeof window.CityDepth.progress === 'function') {
            var cp = window.CityDepth.progress() || {};
            p.towerBest = _achNum(cp.trialBest);
            p.swordIntent = _achNum(cp.swordIntent);
        }
    } catch (e) {}
    // —— 岁月 ——
    // —— 情缘：道侣位分（取最高档，未结为道侣=0）与子嗣数（v20.12 起随档持久） ——
    p.daoBond = 0;
    try {
        var bonds = cd.bonds || {};
        for (var bk in bonds) {
            if (bonds[bk] && bonds[bk].type === 'dao_companion') {
                var bl = _achNum(bonds[bk].level) || 1; // 旧档无 level 视为初档
                if (bl > p.daoBond) p.daoBond = bl;
            }
        }
    } catch (e) {}
    p.children = Array.isArray(cd._children) ? cd._children.length : 0;
    // v20.16：重塑灵根次数（存档白名单字段回灌的 _rootRefines，无则 0）
    p.rootRefines = _achNum(cd._rootRefines);
    p.day = (typeof window.getAbsoluteDay === 'function') ? _achNum(window.getAbsoluteDay()) : 0;
    return p;
}

// ==================== 成就类 ====================
class Achievement {
    constructor(id, name, description, options = {}) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.category = options.category || 'general'; // general, combat, exploration, social, cultivation, sect, wealth, karma, beasts
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

    // 纯条件判定（无副作用），供批量检查先盘点后发奖
    evaluate(playerData) {
        if (this.isCompleted) return false;

        let completed = true;
        for (const [key, requiredValue] of Object.entries(this.requirements)) {
            const playerValue = this.getNestedValue(playerData, key);
            if (typeof requiredValue === 'object' && requiredValue && requiredValue.operator) {
                // 支持操作符: gt, lt, gte, lte, eq
                switch (requiredValue.operator) {
                    case 'gt': if (!(playerValue > requiredValue.value)) completed = false; break;
                    case 'lt': if (!(playerValue < requiredValue.value)) completed = false; break;
                    case 'gte': if (!(playerValue >= requiredValue.value)) completed = false; break;
                    case 'lte': if (!(playerValue <= requiredValue.value)) completed = false; break;
                    case 'eq': if (!(playerValue === requiredValue.value)) completed = false; break;
                    default: if (!(playerValue >= 0)) completed = false;
                }
            } else {
                // 数值门槛一律"未达标即假"；undefined/null 视为未达成
                if (!(playerValue >= requiredValue)) completed = false;
            }
        }

        return completed;
    }

    // 检查是否完成（playerData = buildAchievementProfile() 档案快照）
    // silent=true 时不弹个人提示（由调用方合并成一条汇总，v20.11 弹窗风暴修复）
    checkCompletion(playerData, silent) {
        if (!this.evaluate(playerData)) return false;
        this.complete(silent);
        return true;
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

    // 完成成就（silent=true：只记日志与发奖，弹提示由调用方汇总）
    // v20.15：返回已发奖励列表（paid），调用方据此把"解锁+奖励"合并成一条提示
    complete(silent) {
        if (this.isCompleted) return [];

        this.isCompleted = true;
        this.isUnlocked = true;
        this.progress = this.maxProgress;

        gameLog.add(`🏆 成就解锁: ${this.name}`, 'success');
        if (!silent) showMessage(`成就解锁: ${this.name}`, 'success');

        // 给予奖励
        var paid = [];
        if (this.reward) {
            paid = this.applyReward(silent) || [];
        }
        return paid;
    }

    // 应用奖励：全部经真实资源入口，缺入口时退回角色数据（钳位）
    applyReward(silent) {
        var cd = window.currentCharData;
        var DM = (window.XianXia && window.XianXia.DataManager) || null;
        var paid = [];
        if (this.reward.exp && cd) {
            cd.tempering = _achNum(cd.tempering) + _achNum(this.reward.exp);
            paid.push('历练+' + this.reward.exp);
        }
        var copper = _achNum(this.reward.gold || 0) + _achNum(this.reward.copper || 0);
        if (copper > 0) {
            if (DM) { DM.setCopper(DM.getCopper() + copper); }
            else if (window.inventory && window.inventory.currency) { window.inventory.currency.copper = _achNum(window.inventory.currency.copper) + copper; }
            else if (cd) { cd.copper = _achNum(cd.copper) + copper; }
            paid.push('铜钱+' + copper);
        }
        if (this.reward.stones) {
            var st = _achNum(this.reward.stones);
            if (DM) { DM.setSpiritStones(DM.getSpiritStones() + st); }
            else if (window.inventory && window.inventory.currency) { window.inventory.currency.spiritStones = _achNum(window.inventory.currency.spiritStones) + st; }
            else if (cd) { cd.spiritStones = _achNum(cd.spiritStones) + st; }
            paid.push('灵石+' + st);
        }
        if (this.reward.fame || this.reward.karma) {
            var r = {};
            if (this.reward.fame) r.fame = _achNum(this.reward.fame);
            if (this.reward.karma) r.karma = _achNum(this.reward.karma);
            var handled = false;
            if (window.RewardService && typeof window.RewardService.apply === 'function') {
                try { window.RewardService.apply(r, { source: 'achievement' }); handled = true; } catch (e) {}
            }
            if (!handled && cd) {
                if (r.fame) cd.fame = Math.max(0, Math.min(100, _achNum(cd.fame) + r.fame));
                if (r.karma) cd.karma = Math.max(-100, Math.min(100, _achNum(cd.karma) + r.karma));
            }
            if (r.fame) paid.push('名气+' + r.fame);
            if (r.karma) paid.push('业障' + (r.karma > 0 ? '+' : '') + r.karma);
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
        if (!silent && window.showMessage && paid.length > 0) {
            window.showMessage('成就奖励：' + paid.join(' '), 'success');
        }
        return paid;
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

    // 反序列化（仅用于"存档里有、定义里没有"的历史成就兜底显示）
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
        achievement.isCompleted = !!data.isCompleted;
        achievement.isUnlocked = !!data.isUnlocked;
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

    // 检查所有成就（v20.11 弹窗风暴修复一：先纯判定盘点，再统一发奖）
    // （v20.15 修复二：无论点亮几枚，每次检查至多弹一条提示——
    //   旧版单枚点亮会弹"解锁"+"奖励"两条，连续几场逐条点亮就成了"弹一堆"；
    //   现在解锁名与奖励合并成一句话，一次检查一条，从机制上封顶）
    checkAllAchievements(playerData) {
        return this._settle(playerData);
    }

    _settle(playerData) {
        var newly = [];
        for (const achievement of this.achievements.values()) {
            if (!achievement.isCompleted && achievement.evaluate(playerData)) newly.push(achievement);
        }
        if (newly.length === 0) return newly;
        var allPaid = [];
        for (var i = 0; i < newly.length; i++) {
            var paid = newly[i].complete(true); // 弹提示统一由本函数汇总，此处静默发奖
            this.completedAchievements.add(newly[i].id);
            this.totalPoints += _achNum(newly[i].points);
            if (paid && paid.length) allPaid = allPaid.concat(paid);
        }
        if (typeof showMessage === 'function') {
            var rewardLine = '';
            if (allPaid.length > 0) {
                var rs = allPaid.slice(0, 6).join(' ');
                if (allPaid.length > 6) rs += ' 等';
                rewardLine = '（奖励 ' + rs + '）';
            }
            if (newly.length === 1) {
                showMessage('🏅 成就解锁：' + newly[0].name + rewardLine, 'success');
            } else {
                var names = newly.map(function (a) { return a.name; }).slice(0, 5).join('、');
                if (newly.length > 5) names += ' 等';
                showMessage('🏅 成就解锁 ' + newly.length + ' 枚：' + names + rewardLine, 'success');
            }
        }
        return newly;
    }

    // 读档后静默补课：世界早已满足的成就在载入时就补发（至多弹一条），
    // 免得积压到打赢第一场架才集中引爆（用户实测"击败敌人弹一堆"的根因之一）
    syncQuiet(playerData) {
        return this._settle(playerData || buildAchievementProfile()).length;
    }

    // 按当前完成集重算积分账本（完成集是唯一真源）
    recount() {
        this.completedAchievements = new Set();
        this.totalPoints = 0;
        for (const a of this.achievements.values()) {
            if (a.isCompleted) {
                this.completedAchievements.add(a.id);
                this.totalPoints += _achNum(a.points);
            }
        }
    }

    // v20.11 并档：状态取存档，定义取代码；新增定义自动可见，历史成就保留展示
    importMerged(data) {
        if (!data || !Array.isArray(data.achievements)) return;
        for (const d of data.achievements) {
            if (!d || !d.id) continue;
            let a = this.achievements.get(d.id);
            if (!a) {
                a = Achievement.deserialize(d);
                this.achievements.set(d.id, a);
            } else {
                a.isCompleted = !!d.isCompleted;
                a.isUnlocked = !!d.isUnlocked;
                a.progress = _achNum(d.progress);
                a.maxProgress = _achNum(d.maxProgress) || a.maxProgress;
            }
        }
        this.recount();
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
}

// ==================== 预设成就（v20.11 全表对齐档案快照） ====================
// 约定：requirements 的路径必须存在于 buildAchievementProfile() 返回值上；
// reward 仅允许 exp/gold(copper)/stones/fame/karma，由 applyReward 经真源发放。
const PresetAchievements = [
    // —— 战阵 ——
    new Achievement('first_blood', '旗开得胜', '赢下第一场生死斗', {
        category: 'combat', requirements: { killCount: 1 },
        reward: { exp: 50, gold: 100 }, icon: '⚔️', rarity: 'common', points: 10
    }),
    new Achievement('kill_50', '百战不却', '阵斩 50 敌', {
        category: 'combat', requirements: { killCount: 50 },
        reward: { exp: 100, gold: 400 }, icon: '🗡️', rarity: 'uncommon', points: 25
    }),
    new Achievement('kill_300', '杀透三界', '阵斩 300 敌', {
        category: 'combat', requirements: { killCount: 300 },
        reward: { exp: 300, stones: 150 }, icon: '💀', rarity: 'epic', points: 75
    }),
    // —— 修行 ——
    new Achievement('level_10', '初窥门径', '寻得气感，踏入筑基', {
        category: 'cultivation', requirements: { realmIdx: 1 },
        reward: { exp: 100, gold: 200 }, icon: '📈', rarity: 'common', points: 15
    }),
    new Achievement('level_50', '金丹大成', '凝结金丹', {
        category: 'cultivation', requirements: { realmIdx: 2 },
        reward: { exp: 500, gold: 800 }, icon: '🏅', rarity: 'uncommon', points: 30
    }),
    new Achievement('realm_yuanying', '元婴坐镇', '碎丹结婴', {
        category: 'cultivation', requirements: { realmIdx: 3 },
        reward: { exp: 800, stones: 80 }, icon: '🧘', rarity: 'rare', points: 50
    }),
    new Achievement('realm_huashen', '化神游天', '元神出窍，化神之境', {
        category: 'cultivation', requirements: { realmIdx: 4 },
        reward: { exp: 1500, stones: 200 }, icon: '☁️', rarity: 'epic', points: 80
    }),
    new Achievement('ascension', '名登紫府', '举霞飞升', {
        category: 'cultivation', requirements: { ascended: { operator: 'eq', value: 1 } },
        reward: { fame: 20, stones: 500 }, icon: '🌈', rarity: 'legendary', points: 200, hidden: true
    }),
    new Achievement('temper_body', '百战淬体', '历练累积 300', {
        category: 'cultivation', requirements: { tempering: 300 },
        reward: { gold: 300 }, icon: '💪', rarity: 'uncommon', points: 20
    }),
    new Achievement('arts_10', '百家兵库', '习得 10 门功法绝技', {
        category: 'cultivation', requirements: { arts: 10 },
        reward: { gold: 350 }, icon: '📜', rarity: 'uncommon', points: 20
    }),
    new Achievement('master', '一代宗师', '习得 20 门功法绝技', {
        category: 'cultivation', requirements: { arts: 20 },
        reward: { exp: 1000, gold: 1500, stones: 150 }, icon: '👑', rarity: 'epic', points: 100
    }),
    // —— 门派 ——
    new Achievement('sect_join', '名列仙班', '拜入一家门派', {
        category: 'sect', requirements: { sectJoined: { operator: 'eq', value: 1 } },
        reward: { gold: 100 }, icon: '🏴', rarity: 'common', points: 10
    }),
    new Achievement('sect_elder', '一柱擎天', '位至长老以上', {
        category: 'sect', requirements: { sectRankId: { operator: 'lte', value: 2 } },
        reward: { stones: 200 }, icon: '🎐', rarity: 'epic', points: 80
    }),
    new Achievement('sect_devote', '功在宗门', '门派贡献攒满 500', {
        category: 'sect', requirements: { contribution: 500 },
        reward: { gold: 800 }, icon: '🧾', rarity: 'rare', points: 45
    }),
    // —— 人事 ——
    new Achievement('social_butterfly', '广结善缘', '与 10 位侠客交好', {
        category: 'social', requirements: { friends: 10 },
        reward: { exp: 200, gold: 500 }, icon: '🤝', rarity: 'rare', points: 40
    }),
    new Achievement('friends_30', '高朋满座', '与 30 位侠客交好', {
        category: 'social', requirements: { friends: 30 },
        reward: { stones: 120, fame: 5 }, icon: '🍵', rarity: 'epic', points: 70
    }),
    new Achievement('dao_join', '凤求凰', '与有情人结为道侣', {
        category: 'social', requirements: { daoBond: 1 },
        reward: { gold: 200, fame: 2 }, icon: '💞', rarity: 'common', points: 15
    }),
    new Achievement('dao_deep', '情深似海', '道侣位分修至三档', {
        category: 'social', requirements: { daoBond: 3 },
        reward: { stones: 150, fame: 5 }, icon: '💍', rarity: 'epic', points: 60
    }),
    new Achievement('child_first', '血脉相承', '诞下第一个灵胎', {
        category: 'social', requirements: { children: 1 },
        reward: { gold: 500, fame: 3 }, icon: '👶', rarity: 'rare', points: 40
    }),
    new Achievement('child_three', '兰阶玉盈', '子嗣满堂（3 人）', {
        category: 'social', requirements: { children: 3 },
        reward: { stones: 200, fame: 8 }, icon: '🏮', rarity: 'epic', points: 70, hidden: true
    }),
    // —— v20.16 后天改命线 ——
    new Achievement('root_refine_1', '破而后立', '服丹重塑一次灵根', {
        category: 'cultivation', requirements: { rootRefines: 1 },
        reward: { stones: 100, fame: 2 }, icon: '🌈', rarity: 'rare', points: 40
    }),
    new Achievement('root_refine_3', '洗尽铅华', '三次重塑灵根，凡骨渐化仙胎', {
        category: 'cultivation', requirements: { rootRefines: 3 },
        reward: { stones: 300, fame: 6 }, icon: '✨', rarity: 'epic', points: 80, hidden: true
    }),
    // —— 游历 ——
    new Achievement('collector', '收藏家', '库房收进 10 种名目', {
        category: 'exploration', requirements: { uniqueItems: 10 },
        reward: { gold: 300 }, icon: '🎒', rarity: 'uncommon', points: 20
    }),
    new Achievement('curator', '包罗万象', '库房收进 40 种名目', {
        category: 'exploration', requirements: { uniqueItems: 40 },
        reward: { stones: 150 }, icon: '🏺', rarity: 'epic', points: 70
    }),
    new Achievement('tower_5', '平步青云', '试炼塔登至 5 层', {
        category: 'exploration', requirements: { towerBest: 5 },
        reward: { gold: 400 }, icon: '🗼', rarity: 'uncommon', points: 20
    }),
    new Achievement('tower_15', '重霄之上', '试炼塔登至 15 层', {
        category: 'exploration', requirements: { towerBest: 15 },
        reward: { stones: 180 }, icon: '🌩️', rarity: 'epic', points: 70
    }),
    new Achievement('sword_heart', '剑心通明', '剑冢参得 10 点剑意', {
        category: 'exploration', requirements: { swordIntent: 10 },
        reward: { gold: 600, fame: 3 }, icon: '⚔️', rarity: 'rare', points: 45
    }),
    // —— 货殖 ——
    new Achievement('wealthy', '腰缠万贯', '持有 10000 铜钱', {
        category: 'wealth', requirements: { copper: 10000 },
        reward: { exp: 300 }, icon: '💰', rarity: 'rare', points: 35
    }),
    new Achievement('stone_lord', '陶朱之富', '持有 2000 灵石', {
        category: 'wealth', requirements: { spiritStones: 2000 },
        reward: { fame: 5 }, icon: '💎', rarity: 'epic', points: 60, hidden: true
    }),
    // —— 因果 ——
    new Achievement('benevolent', '仁者寿', '善名远播（业障 +50）', {
        category: 'karma', requirements: { karma: 50 },
        reward: { gold: 800, fame: 5 }, icon: '🕊️', rarity: 'rare', points: 40
    }),
    new Achievement('dark_path', '魔焰滔天', '杀孽深重（业障 -50）', {
        category: 'karma', requirements: { karma: { operator: 'lte', value: -50 } },
        reward: { gold: 1000 }, icon: '🔥', rarity: 'rare', points: 40, hidden: true
    }),
    new Achievement('infamous', '恶名震八荒', '恶名积至 50', {
        category: 'karma', requirements: { notoriety: 50 },
        reward: { gold: 700 }, icon: '👹', rarity: 'rare', points: 35
    }),
    new Achievement('lucky', '天眷之人', '气运浓得能拧出水（气运 ≥85）', {
        category: 'karma', requirements: { luck: 85 },
        reward: { gold: 200 }, icon: '🍀', rarity: 'uncommon', points: 25, hidden: true
    }),
    // —— 御兽 ——
    new Achievement('beast_first', '伙伴在侧', '收服第一头灵兽', {
        category: 'beasts', requirements: { beasts: 1 },
        reward: { gold: 150 }, icon: '🐾', rarity: 'common', points: 10
    }),
    new Achievement('beast_pack', '猛兽如栏', '身边灵兽达 5 头', {
        category: 'beasts', requirements: { beasts: 5 },
        reward: { gold: 800 }, icon: '🦁', rarity: 'rare', points: 40
    }),
    new Achievement('beast_alpha', '灵兽上驷', '任一灵兽养成 15 级', {
        category: 'beasts', requirements: { beastMaxLevel: 15 },
        reward: { stones: 120 }, icon: '🐉', rarity: 'epic', points: 60
    }),
    // —— 江湖 ——
    new Achievement('fame_local', '名动一方', '名气积至 30', {
        category: 'general', requirements: { fame: 30 },
        reward: { gold: 400 }, icon: '📯', rarity: 'uncommon', points: 20
    }),
    new Achievement('fame_world', '名震寰宇', '名气积至 80', {
        category: 'general', requirements: { fame: 80 },
        reward: { gold: 2000, stones: 300 }, icon: '🌟', rarity: 'legendary', points: 120, hidden: true
    }),
    new Achievement('year_of_cult', '一岁寒暑', '在山中走过一整年', {
        category: 'general', requirements: { day: 365 },
        reward: { exp: 100, gold: 200 }, icon: '🗓️', rarity: 'uncommon', points: 15
    })
];

// ==================== 初始化 ====================
function initAchievementSystem() {
    window.achievementManager = new AchievementManager();
    // v20.11：直接注册定义本体。旧版 serialize→deserialize 会丢 requirements/reward，
    // 导致条件为空、检查时全体秒解锁（白送 bug），此处是该回归的锁点。
    for (const achievement of PresetAchievements) {
        achievementManager.addAchievement(achievement);
    }
    // 每日结算时补查一轮：非战斗成就（修行/财富/人际等）不依赖战斗胜利触发
    try {
        if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
            window.timeSystem.onNewDaySubscribe(function () {
                try { window.checkAchievementsNow(); } catch (e) {}
            });
        }
    } catch (e) {}
    gameLog.add('成就系统已初始化', 'info');
}

// 立即可用的检查入口：现场拼装档案快照再查，任何系统都能在关键节点调用
function checkAchievementsNow() {
    if (!window.achievementManager) initAchievementSystem();
    window.achievementManager.checkAllAchievements(buildAchievementProfile());
}

if (typeof window !== 'undefined' && window.StateRegistry && typeof window.StateRegistry.register === 'function') {
    window.StateRegistry.register('achievements', {
        version: 1,
        export: function() { return window.achievementManager ? window.achievementManager.serialize() : null; },
        import: function(data) {
            if (!window.achievementManager) initAchievementSystem();
            // v20.11 并档（旧版 clear+覆盖会让版本更新新增的成就对旧档永久隐身）
            if (data) window.achievementManager.importMerged(data);
            // v20.11 读档静默补课：此刻世界数据已就位，早已满足的成就当场补发
            // （汇总弹一条），不会积压到第一场战斗胜利时集中弹窗
            try { window.achievementManager.syncQuiet(); } catch (e) {}
        },
        reset: function() { initAchievementSystem(); }
    });
}

// ==================== 成就墙面板（渲染层，不存任何状态） ====================
var ACH_CATEGORY_CN = {
    combat: '战阵', cultivation: '修行', sect: '门派', social: '人事',
    exploration: '游历', wealth: '货殖', karma: '因果', beasts: '御兽', general: '江湖'
};
var ACH_RARITY_CN = { common: '凡品', uncommon: '珍品', rare: '灵品', epic: '仙品', legendary: '传说' };

function renderAchievementPanel() {
    if (typeof document === 'undefined') return;
    var list = document.getElementById('achievement-list');
    var summary = document.getElementById('achievement-summary');
    if (!list || !summary) return;
    if (!window.achievementManager) initAchievementSystem();
    try { window.achievementManager.checkAllAchievements(buildAchievementProfile()); } catch (e) {}
    var mgr = window.achievementManager;
    var stats = mgr.getStatistics();
    summary.textContent = '已点亮 ' + stats.completed + ' / ' + stats.total + ' 枚，成就点 ' + stats.totalPoints + '（' + stats.completionRate + '%）';
    var byCat = {};
    var all = mgr.getAllAchievements();
    for (var i = 0; i < all.length; i++) {
        var a = all[i];
        var cat = a.category || 'general';
        if (!byCat[cat]) byCat[cat] = [];
        byCat[cat].push(a);
    }
    var html = '';
    for (var c in byCat) {
        html += '<div class="mb-4"><h3 class="text-base font-bold text-amber-300 mb-2">' + (ACH_CATEGORY_CN[c] || c) + '</h3>';
        html += '<div class="grid grid-cols-1 md:grid-cols-2 gap-2">';
        var doneCount = 0;
        for (var j = 0; j < byCat[c].length; j++) if (byCat[c][j].isCompleted) doneCount++;
        for (var k = 0; k < byCat[c].length; k++) {
            var ac = byCat[c][k];
            if (ac.hidden && !ac.isCompleted) {
                html += '<div class="bg-gray-800/40 border border-gray-700 rounded p-2 text-gray-500 text-xs">❓ ？？？<span class="float-right">' + (ACH_RARITY_CN[ac.rarity] || ac.rarity) + '</span></div>';
                continue;
            }
            var border = ac.isCompleted ? 'border-yellow-600 bg-yellow-900/20' : 'border-gray-700 bg-gray-800/40';
            html += '<div class="border rounded p-2 text-xs ' + border + '">'
                + '<span class="mr-1">' + ac.icon + '</span>'
                + '<span class="font-bold ' + (ac.isCompleted ? 'text-yellow-300' : 'text-gray-300') + '">' + ac.name + '</span>'
                + (ac.isCompleted ? ' <span class="text-yellow-500">✓</span>' : '')
                + '<span class="float-right text-gray-500">' + (ACH_RARITY_CN[ac.rarity] || ac.rarity) + ' · ' + ac.points + '分</span>'
                + '<div class="text-gray-400 mt-1">' + ac.description + '（' + (doneCount) + '/' + byCat[c].length + '）</div>'
                + '</div>';
        }
        html += '</div></div>';
    }
    list.innerHTML = html;
}

// ==================== 导出 ====================
if (typeof window !== 'undefined') {
    window.Achievement = Achievement;
    window.AchievementManager = AchievementManager;
    window.PresetAchievements = PresetAchievements;
    window.initAchievementSystem = initAchievementSystem;
    window.buildAchievementProfile = buildAchievementProfile;
    window.checkAchievementsNow = checkAchievementsNow;
    window.renderAchievementPanel = renderAchievementPanel;
    // 兼容旧调用名：不再直接吃角色数据（那是幽灵键的来源），统一走档案快照
    window.checkAllAchievements = function () { return checkAchievementsNow(); };
}
