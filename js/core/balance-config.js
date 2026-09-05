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
            unsoldStorageFeeRate: 0.05,   // v20.53 流拍压柜费：寄卖不成交，柜面占用照收
            maxActiveListings: 6,         // v20.53 掌柜只给你留六个摊位（柜面就这么大）
            minListingPrice: 1,
            // 单机拍卖的 NPC 接盘概率：按“挂牌单价 / 模板基准价”衰减。
            // v20.53 加高价位衰减：买家钱袋是有限的，喊价越高越是没人接——
            // 旧表在每一档期望值都为正（0.92×chance−0.02>0），挂天价反而是最优解，拍卖行成了印钞机。
            // 新表让期望值在比值 6 以后转负，诚实定价（≤基准价）始终比赌天价划算。
            saleChanceByPriceRatio: [
                { maxRatio: 0.75, chance: 0.95 },
                { maxRatio: 1.00, chance: 0.85 },
                { maxRatio: 1.25, chance: 0.68 },
                { maxRatio: 1.50, chance: 0.45 },
                { maxRatio: 2.00, chance: 0.20 },
                { maxRatio: 2.50, chance: 0.13 },
                { maxRatio: 3.00, chance: 0.09 },
                { maxRatio: 4.00, chance: 0.055 },
                { maxRatio: 6.00, chance: 0.03 },
                { maxRatio: 10.00, chance: 0.018 },
                { maxRatio: Infinity, chance: 0.01 }
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
