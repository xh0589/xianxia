/**
 * balance-config.js — 可调平衡参数中心
 * 新增系统优先从这里取值，避免把关键数值散落在 UI/业务函数中。
 */
(function (global) {
    'use strict';

    var cfg = {
        social: {
            dailyLimitPerNpcAction: 3,
            defaultCooldownMinutes: 30,
            defaultEnergy: 100
        },
        auction: {
            listingDurationMinutes: 24 * 60,
            listingFeeRate: 0.02,
            settlementTaxRate: 0.08,
            minListingPrice: 1,
            // 单机拍卖的 NPC 接盘概率：按“挂牌单价 / 模板基准价”衰减。
            saleChanceByPriceRatio: [
                { maxRatio: 0.75, chance: 0.95 },
                { maxRatio: 1.00, chance: 0.85 },
                { maxRatio: 1.25, chance: 0.68 },
                { maxRatio: 1.50, chance: 0.45 },
                { maxRatio: 2.00, chance: 0.20 },
                { maxRatio: Infinity, chance: 0.05 }
            ]
        },
        borrow: {
            durationDays: 3,
            favorCost: 5,
            overdueAffectionPenalty: 10,
            returnAffectionBonus: 2
        },
        cultivation: {
            skillPracticeQiCost: 5,
            skillPracticeMinutes: 30
        },
        arena: {
            dailyLimit: 5,
            energyCost: 10,
            timeMinutes: 30,
            maxRewardStreak: 10,
            baseContribution: 50,
            streakContribution: 10,
            baseSpiritStones: 30,
            streakSpiritStones: 5
        },
        sectTasks: {
            maxConcurrent: 5,
            patrolEnergyCost: 20,
            patrolMinutes: 60,
            escortEnergyCost: 30,
            escortMinutes: 120
        },
        sectEvents: {
            checkCooldownMinutes: 360,
            activeDurationMinutes: 720,
            triggerChance: 0.30
        },
        protection: {
            asylumDurationMinutes: 72 * 60,
            pursuitChanceMultiplier: 0.5,
            damageTakenMultiplier: 0.9
        },
        factions: {
            enemyInvasionBaseChance: 0.05
        }
    };

    global.XianXia = global.XianXia || {};
    global.XianXia.Balance = cfg;
    global.BALANCE_CONFIG = cfg;
})(typeof window !== 'undefined' ? window : this);
