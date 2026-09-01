// ==================== daily-events.js - 日常/世界填充事件（v9.9） ====================
// 定位：城市街面 / 野外非战斗 / 门派生活感 —— 低价值、高沉浸
// 与 event-system 奇遇分层：奇遇=奖励抽奖；日常=世界在呼吸
// 依赖：showMessage、可选 addItem / setFlag / advanceTime / discipleState

// ============ 状态 ============
var dailyEventState = {
    lastTriggerTotalMin: -9999,
    lastById: {},       // id -> totalMinutes
    history: [],        // 最近记录
    globalCooldownMin: 35
};

var _dailyEventById = {};

// ============ 工具 ============
function _deMsg(text, type) {
    if (typeof window.showMessage === 'function') {
        window.showMessage(text, type || 'info');
    } else {
        try { console.log('[日常]', text); } catch (e) {}
    }
}

function _deGetTotalMin() {
    try {
        if (window.gameTime && typeof window.gameTime.totalMinutes === 'number') {
            return window.gameTime.totalMinutes;
        }
        if (window.timeSystem && window.timeSystem.gameTime) {
            return window.timeSystem.gameTime.totalMinutes || 0;
        }
    } catch (e) {}
    return 0;
}

function _deAddCopper(n) {
    // 根据货币矫正.txt：铜钱全部改为铜钱
    var p = window.currentCharData;
    if (!p) return;
    p.copper = (p.copper || 0) + n;
    if (p.copper < 0) p.copper = 0;
}

function _deAddItem(id, count) {
    count = count || 1;
    if (typeof window.addItem === 'function') {
        try { window.addItem(id, count); return true; } catch (e) {}
    }
    return false;
}

function _deAddContribution(n) {
    var ds = window.discipleState;
    if (!ds || !ds.isInSect) return false;
    ds.contribution = (ds.contribution || 0) + n;
    return true;
}

function _deAddPoints(n) {
    var ds = window.discipleState;
    if (!ds || !ds.isInSect) return false;
    ds.points = (ds.points || 0) + n;
    return true;
}

function _deSetFlag(name) {
    if (typeof window.setFlag === 'function') {
        try { window.setFlag(name); } catch (e) {}
    }
}

function _deAdvance(min, name) {
    if (min > 0 && window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        try { window.timeSystem.advanceTime(min, name || '日常'); } catch (e) {}
    } else if (min > 0 && typeof window.advanceTime === 'function') {
        try { window.advanceTime(min, name || '日常'); } catch (e) {}
    }
}

function _deInBattle() {
    try {
        if (window.battle && window.battle.active) return true;
        if (window.Battle && window.Battle.instance && window.Battle.instance.running) return true;
        if (document.getElementById('battle-panel') && !document.getElementById('battle-panel').classList.contains('hidden')) return true;
    } catch (e) {}
    return false;
}

function _deModalOpen() {
    return !!(document.getElementById('event-modal') || document.getElementById('daily-event-modal'));
}

function _deGetPeriod() {
    if (typeof window.getCurrentPeriod === 'function') {
        try { return window.getCurrentPeriod(); } catch (e) {}
    }
    var h = (window.gameTime && window.gameTime.currentHour) || 12;
    if (h >= 5 && h < 8) return 'dawn';
    if (h >= 8 && h < 12) return 'morning';
    if (h >= 12 && h < 14) return 'noon';
    if (h >= 14 && h < 18) return 'afternoon';
    if (h >= 18 && h < 21) return 'dusk';
    return 'night';
}

function _deIsRaining() {
    try {
        var w = window.currentWeather || (window.weatherSystem && window.weatherSystem.current);
        if (!w) return false;
        var s = (typeof w === 'string') ? w : (w.id || w.name || w.type || '');
        return /雨|rain|storm|雷/i.test(String(s));
    } catch (e) {}
    return false;
}

function _deInSect() {
    var ds = window.discipleState || {};
    return !!(ds.isInSect && ds.sectId);
}

function _deSectRank() {
    var ds = window.discipleState || {};
    return ds.rank != null ? ds.rank : 99;
}

// ============ 上下文 ============
function getDailyEventContext(options) {
    options = options || {};
    var terrain = null;
    try {
        if (window.playerPos && window.currentMap) {
            var cell = window.currentMap[window.playerPos.y] && window.currentMap[window.playerPos.y][window.playerPos.x];
            terrain = cell && (cell.terrain && (cell.terrain.id || cell.terrain.name || cell.terrain)) || cell.terrain;
        }
    } catch (e) {}
    return {
        source: options.source || 'unknown',
        minutes: options.minutes || 0,
        period: _deGetPeriod(),
        raining: _deIsRaining(),
        inSect: _deInSect(),
        sectRank: _deSectRank(),
        sectId: (window.discipleState && window.discipleState.sectId) || null,
        terrain: terrain,
        realm: (window.currentCharData && window.currentCharData.realm) || '凡人',
        totalMin: _deGetTotalMin()
    };
}

// ============ 事件池 ============
var DAILY_EVENT_LIST = [
    // ----- 城市 -----
    {
        id: 'street_quarrel',
        pool: 'city',
        weight: 10,
        cooldownMin: 90,
        title: '街头争吵',
        icon: '🗣️',
        description: '两名修士在街口争执，隐约提到某处秘境的方位。路人纷纷侧目。',
        choices: [
            {
                id: 'watch',
                text: '围观听个仔细',
                effect: function() {
                    _deSetFlag('daily_rumor_secret_realm');
                    _deMsg('你听出几句关键：秘境入口与月圆之夜有关。', 'success');
                }
            },
            {
                id: 'mediate',
                text: '上前劝架',
                effect: function() {
                    if (Math.random() < 0.55) {
                        _deAddCopper(5);
                        _deMsg('争执平息，其中一人塞给你几块碎银致谢。（铜钱+5）', 'success');
                    } else {
                        _deMsg('两人迁怒于你，推搡几下后散去。你略有些狼狈。', 'warning');
                    }
                }
            },
            {
                id: 'pass',
                text: '路过不理会',
                effect: function() {
                    _deMsg('你低头走过，喧闹渐渐被抛在身后。', 'info');
                }
            }
        ]
    },
    {
        id: 'street_vendor',
        pool: 'city',
        weight: 12,
        cooldownMin: 60,
        title: '小贩叫卖',
        icon: '🛒',
        description: '路边小贩扯着嗓子：「灵草廉价出清！过了这村没这店！」摊上几捆草药，成色一般。',
        choices: [
            {
                id: 'buy',
                text: '花 8 灵石买一捆',
                effect: function() {
                    // 根据货币矫正.txt：修仙者交易用灵石，检查spiritStones
                    var stones = window.inventory ? (window.inventory.currency && window.inventory.currency.spiritStones) : 0;
                    stones = stones || (window.currentCharData && window.currentCharData.spiritStones) || 0;
                    if (stones < 8) {
                        _deMsg('灵石不足，小贩白了你一眼。', 'warning');
                        return;
                    }
                    // 扣除灵石（使用inventory优先）
                    if (window.inventory && window.inventory.currency) {
                        window.inventory.currency.spiritStones -= 8;
                    } else if (window.currentCharData) {
                        window.currentCharData.spiritStones = (window.currentCharData.spiritStones || 0) - 8;
                    }
                    // 使用真实存在的物品 ID
                    if (!_deAddItem('mat_lingzhi', 1)) {
                        _deAddItem('mat_spirit_grass', 1);
                    }
                    _deMsg('你买下一捆灵草，塞进储物袋。', 'success');
                }
            },
            {
                id: 'haggle',
                text: '还价至 4 灵石',
                effect: function() {
                    // 根据货币矫正.txt：修仙者交易用灵石，检查spiritStones
                    var stones = window.inventory ? (window.inventory.currency && window.inventory.currency.spiritStones) : 0;
                    stones = stones || (window.currentCharData && window.currentCharData.spiritStones) || 0;
                    if (Math.random() < 0.45) {
                        if (stones < 4) {
                            _deMsg('还是买不起……', 'warning');
                            return;
                        }
                        // 扣除灵石
                        if (window.inventory && window.inventory.currency) {
                            window.inventory.currency.spiritStones -= 4;
                        } else if (window.currentCharData) {
                            window.currentCharData.spiritStones = (window.currentCharData.spiritStones || 0) - 4;
                        }
                        _deAddItem('mat_spirit_grass', 1);
                        _deMsg('小贩咬牙成交：「就这一回！」', 'success');
                    } else {
                        _deMsg('小贩不屑：「不买走开，别耽误生意。」', 'info');
                    }
                }
            },
            {
                id: 'ignore',
                text: '不买',
                effect: function() {
                    _deMsg('你摇头离开摊位。', 'info');
                }
            }
        ]
    },
    {
        id: 'teahouse_rumor',
        pool: 'city',
        weight: 10,
        cooldownMin: 120,
        title: '茶馆奇闻',
        icon: '🍵',
        description: '茶博士拍着桌子讲奇闻：东荒某处山洞夜里会传出剑鸣，已有散修失踪。',
        choices: [
            {
                id: 'listen',
                text: '坐下细听',
                effect: function() {
                    _deAdvance(15, '听茶馆奇闻');
                    _deSetFlag('daily_cave_sword_rumor');
                    _deMsg('你记下方位与忌讳，心中多了一条探索线索。', 'success');
                }
            },
            {
                id: 'leave',
                text: '听听就走',
                effect: function() {
                    _deMsg('你只听了个开头，便起身离去。', 'info');
                }
            }
        ]
    },
    {
        id: 'rain_shelter',
        pool: 'city',
        weight: 8,
        cooldownMin: 100,
        condition: function(ctx) { return !!ctx.raining; },
        title: '檐下躲雨',
        icon: '🌧️',
        description: '骤雨倾盆，你与一名路人挤在同一屋檐下。对方搓着手，似乎想搭话。',
        choices: [
            {
                id: 'chat',
                text: '闲聊几句',
                effect: function() {
                    _deMsg('路人说起城西药铺进了新货，又抱怨雨天坊市人少。你记下了。', 'success');
                    _deSetFlag('daily_rain_chat');
                }
            },
            {
                id: 'ignore',
                text: '沉默等雨停',
                effect: function() {
                    _deAdvance(10, '躲雨');
                    _deMsg('雨势稍缓，你独自离开。', 'info');
                }
            }
        ]
    },
    {
        id: 'night_patrol',
        pool: 'city',
        weight: 9,
        cooldownMin: 80,
        condition: function(ctx) { return ctx.period === 'night' || ctx.period === 'dusk'; },
        title: '夜间巡逻',
        icon: '🛡️',
        description: '一队巡夜兵丁提着灯笼走来，目光在你身上停了一停。',
        choices: [
            {
                id: 'greet',
                text: '拱手打招呼',
                effect: function() {
                    var noto = (window.currentCharData && window.currentCharData.notoriety) || 0;
                    if (noto > 25) {
                        _deMsg('兵丁神色戒备：「夜深了，少在街上晃。」', 'warning');
                    } else {
                        _deMsg('兵丁点头：「夜里不太平，少主早些归歇。」', 'success');
                    }
                }
            },
            {
                id: 'avoid',
                text: '侧身避开',
                effect: function() {
                    _deMsg('你转入小巷，避开灯笼光。', 'info');
                }
            }
        ]
    },
    {
        id: 'lost_child',
        pool: 'city',
        weight: 7,
        cooldownMin: 150,
        title: '走失孩童',
        icon: '👶',
        description: '一个孩子在街角抹眼泪，说和家里人走散了。',
        choices: [
            {
                id: 'help',
                text: '帮忙寻找家人',
                effect: function() {
                    _deAdvance(20, '送孩童');
                    _deAddCopper(3);
                    _deMsg('你把孩子送到城卫处，家人感激地塞来一点谢礼。（铜钱+3，耗时）', 'success');
                    if (window.currentCharData) {
                        window.currentCharData.notoriety = Math.max(0, (window.currentCharData.notoriety || 0) - 1);
                    }
                }
            },
            {
                id: 'pass',
                text: '路过',
                effect: function() {
                    _deMsg('你脚步一顿，终究没有停下。', 'info');
                }
            }
        ]
    },

    // ----- 野外 -----
    {
        id: 'wild_herb',
        pool: 'wilderness',
        weight: 14,
        cooldownMin: 50,
        title: '路边灵草',
        icon: '🌿',
        description: '石缝间几株灵草随风轻颤，叶脉隐有微光。',
        choices: [
            {
                id: 'pick',
                text: '采摘',
                effect: function() {
                    _deAdvance(5, '采药');
                    if (!_deAddItem('mat_lingzhi', 1)) _deAddItem('mat_spirit_grass', 1);
                    _deMsg('你小心采下灵草，收入囊中。', 'success');
                }
            },
            {
                id: 'leave',
                text: '不采，继续赶路',
                effect: function() {
                    _deMsg('你怕有人设了禁制，选择离开。', 'info');
                }
            }
        ]
    },
    {
        id: 'get_lost',
        pool: 'wilderness',
        weight: 8,
        cooldownMin: 100,
        title: '迷了路',
        icon: '🧭',
        description: '林雾渐起，来时的足迹模糊不清。四周树影相同，令人心慌。',
        choices: [
            {
                id: 'calm',
                text: '静心辨路',
                effect: function() {
                    _deAdvance(15, '辨路');
                    var p = window.currentCharData;
                    if (p) {
                        p.essence = (p.essence || 0) + 2;
                    }
                    _deMsg('你依苔藓与风向找回正途，心神也清明了几分。（修为微增）', 'success');
                }
            },
            {
                id: 'rush',
                text: '慌不择路',
                effect: function() {
                    _deAdvance(30, '迷路乱走');
                    _deMsg('你绕了好大一圈才看见熟悉地标，白白耗去时光。', 'warning');
                }
            }
        ]
    },
    {
        id: 'fishing_spot',
        pool: 'wilderness',
        weight: 9,
        cooldownMin: 80,
        title: '野河钓点',
        icon: '🎣',
        description: '溪湾水流平缓，鱼影扑腾扑腾——适合小憩垂钓。',
        choices: [
            {
                id: 'fish',
                text: '钓一会儿',
                effect: function() {
                    _deAdvance(25, '钓鱼');
                    if (Math.random() < 0.7) {
                        // 使用真实存在的食物 ID
                        if (!_deAddItem('food_roast_meat', 1)) {
                            _deAddCopper(2);
                            _deMsg('钓上鲜鱼，就地换了点铜钱。（铜钱+2）', 'success');
                        } else {
                            _deMsg('鱼竿一沉，你钓上一条肥鱼。', 'success');
                        }
                    } else {
                        _deMsg('两手空空，只赚到片刻清闲。', 'info');
                    }
                }
            },
            {
                id: 'go',
                text: '继续赶路',
                effect: function() {
                    _deMsg('你未作停留。', 'info');
                }
            }
        ]
    },
    {
        id: 'roadside_traveler',
        pool: 'wilderness',
        weight: 11,
        cooldownMin: 70,
        title: '过路修士',
        icon: '🚶',
        description: '一名风尘仆仆的修士在路边整理行囊，见你走近，点头示意。',
        choices: [
            {
                id: 'talk',
                text: '上前搭话',
                effect: function() {
                    _deMsg('对方分享了前方路况：某处有兽群出没，宜绕行。', 'success');
                    _deSetFlag('daily_beast_warning');
                }
            },
            {
                id: 'trade',
                text: '询问交易',
                effect: function() {
                    // 根据货币矫正.txt：修仙者交易用灵石，检查spiritStones
                    var stones = window.inventory ? (window.inventory.currency && window.inventory.currency.spiritStones) : 0;
                    stones = stones || (window.currentCharData && window.currentCharData.spiritStones) || 0;
                    if (stones >= 6 && Math.random() < 0.5) {
                        // 扣除灵石
                        if (window.inventory && window.inventory.currency) {
                            window.inventory.currency.spiritStones -= 6;
                        } else if (window.currentCharData) {
                            window.currentCharData.spiritStones = (window.currentCharData.spiritStones || 0) - 6;
                        }
                        _deAddItem('pill_qi_gather', 1);
                        _deMsg('你用 6 灵石换得一枚聚气丹。', 'success');
                    } else {
                        _deMsg('对方摇头：「此行并无余货。」', 'info');
                    }
                }
            },
            {
                id: 'ignore',
                text: '点头即过',
                effect: function() {
                    _deMsg('你们擦肩而过。', 'info');
                }
            }
        ]
    },
    {
        id: 'stone_stele',
        pool: 'wilderness',
        weight: 7,
        cooldownMin: 180,
        title: '残破石碑',
        icon: '🪨',
        description: '半截石碑埋于荒草，碑文漫漶，隐约有吐纳口诀的痕迹。',
        choices: [
            {
                id: 'meditate',
                text: '驻足参悟',
                effect: function() {
                    _deAdvance(20, '参悟石碑');
                    var p = window.currentCharData;
                    if (p) p.essence = (p.essence || 0) + 5;
                    if (typeof window.unlock === 'function') {
                        try { window.unlock('skill_01', 'heard', { source: 'stele', completeness: 0.1 }); } catch (e) {}
                    }
                    _deMsg('你若有所悟，修为略有精进。', 'success');
                }
            },
            {
                id: 'leave',
                text: '继续前行',
                effect: function() {
                    _deMsg('你未加理会。', 'info');
                }
            }
        ]
    },
    {
        id: 'beast_trace',
        pool: 'wilderness',
        weight: 10,
        cooldownMin: 60,
        title: '新鲜兽迹',
        icon: '🐾',
        description: '泥土上有巨大爪印，尚带余温。不远处灌木微微晃动。',
        choices: [
            {
                id: 'track',
                text: '小心跟踪',
                effect: function() {
                    _deAdvance(10, '跟踪兽迹');
                    _deSetFlag('daily_tracked_beast');
                    if (window.BeastTide && window.BeastTide.isRaidActive && window.BeastTide.isRaidActive()) {
                        _deMsg('爪印成群，正是兽潮方向。稀有灵兽可能就在附近。', 'warning');
                        if (typeof window.beginBeastTideRaid === 'function') {
                            window.beginBeastTideRaid();
                            return;
                        }
                    }
                    _deMsg('你摸清了兽群大致方向，决定是否另寻时机再探。', 'info');
                }
            },
            {
                id: 'detour',
                text: '绕开',
                effect: function() {
                    _deMsg('你选择避开，不与凶兽硬碰。', 'info');
                }
            }
        ]
    },

    // ----- 门派 -----
    {
        id: 'junior_ask',
        pool: 'sect',
        weight: 12,
        cooldownMin: 60,
        condition: function(ctx) { return ctx.inSect; },
        title: '师弟请教',
        icon: '🙏',
        description: '一名低阶弟子拦住你，眼神期待：「师兄/师姐，这处心法总是不通，能否指点一二？」',
        choices: [
            {
                id: 'teach',
                text: '耐心指点',
                effect: function() {
                    _deAdvance(15, '指点同门');
                    _deAddContribution(8);
                    _deAddPoints(5);
                    _deMsg('对方连连道谢。你获得门派贡献与修炼感悟。', 'success');
                }
            },
            {
                id: 'refuse',
                text: '推脱有事',
                effect: function() {
                    _deMsg('弟子失望地退下。', 'info');
                }
            }
        ]
    },
    {
        id: 'elder_lecture_daily',
        pool: 'sect',
        weight: 10,
        cooldownMin: 120,
        condition: function(ctx) { return ctx.inSect; },
        title: '长老开坛',
        icon: '📖',
        description: '议事坪上长老开坛讲道，不少弟子围坐。你正路过。',
        choices: [
            {
                id: 'listen',
                text: '坐下旁听',
                effect: function() {
                    _deAdvance(30, '旁听讲道');
                    _deAddPoints(12);
                    var p = window.currentCharData;
                    if (p) p.essence = (p.essence || 0) + 8;
                    _deMsg('讲道结束，你如饮醍醐。（感悟与修为小增）', 'success');
                }
            },
            {
                id: 'pass',
                text: '有事走过',
                effect: function() {
                    _deMsg('你拱手致意后离开。', 'info');
                }
            }
        ]
    },
    {
        id: 'spar_invite',
        pool: 'sect',
        weight: 9,
        cooldownMin: 90,
        condition: function(ctx) { return ctx.inSect; },
        title: '同门切磋',
        icon: '⚔️',
        description: '演武场上，一名同门抱拳：「可愿点到为止，交流一番？」',
        choices: [
            {
                id: 'accept',
                text: '接受切磋',
                effect: function() {
                    _deAdvance(20, '同门切磋');
                    _deAddContribution(6);
                    var p = window.currentCharData;
                    if (p) p.essence = (p.essence || 0) + 4;
                    _deMsg('一番拆招后双方点到为止，你对自身招式更有体会。（贡献+6）', 'success');
                }
            },
            {
                id: 'refuse',
                text: '婉拒',
                effect: function() {
                    _deMsg('对方也不勉强，自行找人去了。', 'info');
                }
            }
        ]
    },
    {
        id: 'chore_assign',
        pool: 'sect',
        weight: 14,
        cooldownMin: 45,
        condition: function(ctx) {
            // 杂役/记名/外门（rank 数字越大地位越低：7杂役 6记名 5外门）
            return ctx.inSect && ctx.sectRank >= 5;
        },
        title: '管事派活',
        icon: '🧹',
        description: '杂役管事拎着名册喊你：「后山柴房缺人，去劈半日柴，有贡献与灵石。」',
        choices: [
            {
                id: 'accept',
                text: '接下差事',
                effect: function() {
                    _deAdvance(60, '门派杂役');
                    _deAddContribution(10);
                    _deAddCopper(5);
                    _deMsg('忙活半日，腰酸背痛，却也换来贡献与几块铜钱。', 'success');
                }
            },
            {
                id: 'refuse',
                text: '推说身体不适',
                effect: function() {
                    _deMsg('管事哼了一声，记在小本上，未再强求。', 'warning');
                }
            }
        ]
    },
    {
        id: 'hidden_manual',
        pool: 'sect',
        weight: 5,
        cooldownMin: 240,
        condition: function(ctx) { return ctx.inSect; },
        title: '私藏残页',
        icon: '📜',
        description: '藏经阁角落掉出一页残篇，墨迹未干——像是有人偷偷抄录后遗落。',
        choices: [
            {
                id: 'read',
                text: '悄悄翻阅',
                effect: function() {
                    var p = window.currentCharData;
                    if (p) p.essence = (p.essence || 0) + 6;
                    _deSetFlag('daily_peeked_manual');
                    _deMsg('残页上有一式身法雏形，你默记于心。（修为+）', 'success');
                }
            },
            {
                id: 'report',
                text: '交给执事举报',
                effect: function() {
                    _deAddContribution(15);
                    _deMsg('执事嘉许你的规矩，记了一笔贡献。', 'success');
                }
            },
            {
                id: 'ignore',
                text: '当作没看见',
                effect: function() {
                    _deMsg('你把残页放回原处，快步离开。', 'info');
                }
            }
        ]
    },
    {
        id: 'sect_gossip',
        pool: 'sect',
        weight: 11,
        cooldownMin: 70,
        condition: function(ctx) { return ctx.inSect; },
        title: '同门闲话',
        icon: '💬',
        description: '几名弟子在廊下咬耳朵，隐约提到「外门考核」「资源倾斜」和某位长老的名讳。',
        choices: [
            {
                id: 'join',
                text: '凑近听听',
                effect: function() {
                    _deSetFlag('daily_sect_gossip');
                    _deMsg('你得知近期外门任务奖励上调，以及某峰主与长老不和的传闻。', 'success');
                }
            },
            {
                id: 'leave',
                text: '不参与是非',
                effect: function() {
                    _deMsg('你拂袖而过，懒得掺和。', 'info');
                }
            }
        ]
    }
];

// 建索引
DAILY_EVENT_LIST.forEach(function(ev) {
    _dailyEventById[ev.id] = ev;
});

var DAILY_EVENTS = {
    city: DAILY_EVENT_LIST.filter(function(e) { return e.pool === 'city'; }),
    wilderness: DAILY_EVENT_LIST.filter(function(e) { return e.pool === 'wilderness'; }),
    sect: DAILY_EVENT_LIST.filter(function(e) { return e.pool === 'sect'; })
};

// ============ 初始化 ============
function initDailyEvents() {
    try {
        var raw = localStorage.getItem('xianxia_daily_events');
        if (raw) {
            var saved = JSON.parse(raw);
            if (saved && typeof saved === 'object') {
                if (typeof saved.lastTriggerTotalMin === 'number') {
                    dailyEventState.lastTriggerTotalMin = saved.lastTriggerTotalMin;
                }
                if (saved.lastById) dailyEventState.lastById = saved.lastById;
                if (Array.isArray(saved.history)) dailyEventState.history = saved.history.slice(-30);
            }
        }
    } catch (e) {}
    console.log('[日常事件] 已加载，事件数=' + DAILY_EVENT_LIST.length);
}

function saveDailyEventState() {
    try {
        localStorage.setItem('xianxia_daily_events', JSON.stringify({
            lastTriggerTotalMin: dailyEventState.lastTriggerTotalMin,
            lastById: dailyEventState.lastById,
            history: (dailyEventState.history || []).slice(-30)
        }));
    } catch (e) {}
}

// ============ 解析地点 ============
function resolveDailyLocation(location, ctx) {
    if (location && location !== 'auto') return location;
    // 来源 sect_enter 或 ctx 在门派 → sect
    if (ctx && ctx.inSect && (ctx.source === 'sect_enter' || ctx.source === 'sect')) return 'sect';
    // 来源 move（野外地图移动）→ wilderness
    if (ctx && ctx.source === 'move') return 'wilderness';
    // 时间推进或 auto：根据实际位置判断
    if (location === 'auto' || ctx.source === 'time') {
        // 检查是否在城市中
        var inCity = false;
        try {
            var loc = null;
            if (typeof window.getCurrentLocation === 'function') {
                loc = window.getCurrentLocation();
            } else if (window.locationSystem && typeof window.locationSystem.getCurrentLocation === 'function') {
                loc = window.locationSystem.getCurrentLocation();
            } else if (window.currentLocation) {
                loc = window.currentLocation;
            }
            if (loc && typeof loc === 'string' && loc.length > 0) {
                // 检查 mapData 中是否有这个城市
                var md = window.mapData || {};
                var cityFound = false;
                for (var r in md) {
                    if (md[r].cities && md[r].cities.indexOf && md[r].cities.indexOf(loc) >= 0) {
                        cityFound = true;
                        break;
                    }
                }
                inCity = cityFound;
            }
        } catch (e) { inCity = false; }
        // 在门派且不在城市 → 门派（如果 inSect 但 time 推进）
        if (ctx && ctx.inSect && !inCity) return 'sect';
        // 不在城市且不在门派 → 野外（时间推进也可能在野外赶路）
        if (!inCity && !(ctx && ctx.inSect)) return 'wilderness';
        return 'city';
    }
    return 'city';
}

// ============ 触发 ============
/**
 * @param {string} location 'city'|'wilderness'|'sect'|'auto'
 * @param {object} options { source, minutes, forceChance, skipGlobalCd }
 * @returns {boolean} 是否弹出事件
 */
function tryTriggerDailyEvent(location, options) {
    options = options || {};
    try {
        if (_deInBattle()) return false;
        if (_deModalOpen()) return false;

        var ctx = getDailyEventContext(options);
        var poolName = resolveDailyLocation(location, ctx);
        var pool = DAILY_EVENTS[poolName] || DAILY_EVENTS.city;
        var totalMin = ctx.totalMin;

        // 全局冷却
        if (!options.skipGlobalCd) {
            var gap = totalMin - (dailyEventState.lastTriggerTotalMin || 0);
            if (gap >= 0 && gap < (dailyEventState.globalCooldownMin || 35)) {
                return false;
            }
        }

        // 基础概率（v12.0：野外移动降至2%，城市/门派维持5%，控制触发频率）
        var chance = options.forceChance;
        if (chance == null) {
            if (poolName === 'wilderness') chance = 0.02;
            else if (poolName === 'sect') chance = 0.04;
            else chance = 0.05;
            // 时间推进：分钟越多略提高，封顶
            if (options.source === 'time' && options.minutes) {
                chance = Math.min(0.10, chance * (0.6 + Math.min(options.minutes, 60) / 80));
            }
        }
        if (Math.random() > chance) return false;

        // 过滤 condition + 单事件冷却
        var available = [];
        for (var i = 0; i < pool.length; i++) {
            var ev = pool[i];
            if (typeof ev.condition === 'function') {
                try {
                    if (!ev.condition(ctx)) continue;
                } catch (e) { continue; }
            }
            var last = dailyEventState.lastById[ev.id];
            if (last != null && (totalMin - last) < (ev.cooldownMin || 60)) continue;
            available.push(ev);
        }
        if (available.length === 0) return false;

        // 权重抽取
        var totalW = 0;
        for (var j = 0; j < available.length; j++) totalW += (available[j].weight || 10);
        var r = Math.random() * totalW;
        var picked = available[0];
        for (var k = 0; k < available.length; k++) {
            r -= (available[k].weight || 10);
            if (r <= 0) { picked = available[k]; break; }
        }

        dailyEventState.lastTriggerTotalMin = totalMin;
        dailyEventState.lastById[picked.id] = totalMin;
        dailyEventState.history.push({
            id: picked.id,
            pool: poolName,
            at: totalMin,
            t: Date.now()
        });
        if (dailyEventState.history.length > 40) {
            dailyEventState.history = dailyEventState.history.slice(-30);
        }
        saveDailyEventState();

        showDailyEventDialog(picked);
        return true;
    } catch (err) {
        try { console.warn('[日常事件] 触发失败', err); } catch (e) {}
        return false;
    }
}

// ============ UI ============
function showDailyEventDialog(event) {
    if (!event) return;
    // 移除旧模态
    var old = document.getElementById('daily-event-modal');
    if (old) old.remove();

    var modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50';
    modal.id = 'daily-event-modal';

    var choicesHtml = '';
    (event.choices || []).forEach(function(choice) {
        choicesHtml +=
            '<button type="button" data-de-event="' + event.id + '" data-de-choice="' + choice.id + '" ' +
            'class="daily-event-choice w-full bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded mb-2 transition text-left text-gray-100">' +
            choice.text +
            '</button>';
    });

    modal.innerHTML =
        '<div class="bg-gray-900 border border-cyan-600 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">' +
        '<div class="flex items-center mb-4">' +
        '<span class="text-3xl mr-3">' + (event.icon || '📜') + '</span>' +
        '<div>' +
        '<h3 class="text-xl font-bold text-cyan-400">' + event.title + '</h3>' +
        '<p class="text-xs text-gray-500">[日常·' + (event.pool === 'city' ? '城市' : event.pool === 'sect' ? '门派' : '野外') + ']</p>' +
        '</div></div>' +
        '<p class="text-gray-300 mb-4 leading-relaxed">' + event.description + '</p>' +
        '<div class="choices-container">' + choicesHtml + '</div>' +
        '</div>';

    document.body.appendChild(modal);

    // 委托点击（避免内联全局污染过多）
    modal.addEventListener('click', function(e) {
        var btn = e.target.closest('.daily-event-choice');
        if (!btn) {
            // 点击遮罩不关闭，必须选选项（沉浸）
            return;
        }
        var eid = btn.getAttribute('data-de-event');
        var cid = btn.getAttribute('data-de-choice');
        handleDailyEventChoice(eid, cid);
    });
}

function handleDailyEventChoice(eventId, choiceId) {
    var event = _dailyEventById[eventId];
    if (!event || !event.choices) {
        closeDailyEventModal();
        return;
    }
    var choice = null;
    for (var i = 0; i < event.choices.length; i++) {
        if (event.choices[i].id === choiceId) { choice = event.choices[i]; break; }
    }
    if (choice && typeof choice.effect === 'function') {
        try { choice.effect(); } catch (e) {
            console.warn('[日常事件] 效果错误', e);
            _deMsg('事件结算出现异常，已跳过。', 'warning');
        }
    }
    if (typeof window.setFlag === 'function') {
        try { window.setFlag('daily_done_' + eventId); } catch (e) {}
    }
    closeDailyEventModal();
}

function closeDailyEventModal() {
    var modal = document.getElementById('daily-event-modal');
    if (modal) modal.remove();
}

// ============ 导出 ============
window.dailyEventState = dailyEventState;
window.DAILY_EVENTS = DAILY_EVENTS;
window.DAILY_EVENT_LIST = DAILY_EVENT_LIST;
window.initDailyEvents = initDailyEvents;
window.saveDailyEventState = saveDailyEventState;
window.getDailyEventContext = getDailyEventContext;
window.tryTriggerDailyEvent = tryTriggerDailyEvent;
window.showDailyEventDialog = showDailyEventDialog;
window.handleDailyEventChoice = handleDailyEventChoice;
window.closeDailyEventModal = closeDailyEventModal;
window.dailyEvents = {
    tryTriggerDailyEvent: tryTriggerDailyEvent,
    showDailyEventDialog: showDailyEventDialog,
    handleDailyEventChoice: handleDailyEventChoice,
    initDailyEvents: initDailyEvents,
    saveDailyEventState: saveDailyEventState,
    DAILY_EVENTS: DAILY_EVENTS,
    dailyEventState: dailyEventState
};

// ==================== v12.1：借物逾期兼容检查 ====================
// 真正到期由 GameScheduler 精确处理；每日事件只做一次兜底扫描，不再使用现实时间/24h setInterval。
function checkOverdueBorrowItems() {
    if (!window.borrowRecords || !window.NPCBorrowService) return;
    window.borrowRecords.forEach(function(record) {
        if (record && !record.returned && !record.overdue) {
            window.NPCBorrowService.markOverdue(record.id);
        }
    });
}

if (window.EventBus && typeof window.EventBus.on === 'function') {
    window.EventBus.on('newDay', checkOverdueBorrowItems);
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { initDailyEvents(); });
} else {
    initDailyEvents();
}
