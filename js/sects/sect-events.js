// ==================== sect-events.js - 门派事件系统（P3） ====================
// 门派内部事件与外部事件，影响门派状态和弟子
// 依赖：sects.js、sects-system.js、sect-internal.js

// ============ 事件类型定义 ============
const SECT_EVENT_TYPES = {
    INTERNAL: 'internal',   // 内部事件
    EXTERNAL: 'external',   // 外部事件
    DISASTER: 'disaster',   // 灾难事件
    BONUS: 'bonus'          // 福利事件
};

// ============ 事件池 ============
const SECT_EVENTS_POOL = {
    // 内部事件
    'disciple_breakthrough': {
        type: 'internal', icon: '💫', name: '弟子突破',
        desc: function(sectName) { return sectName + '有弟子成功突破境界，全派士气大振。'; },
        effect: function(sectName) {
            var data = getSectInternal(sectName);
            if (data) data.morale = Math.min(100, _moraleOf(sectName) + 15);
            return '全派士气 +15';
        },
        minMorale: 0, maxMorale: 100
    },
    'elder_lecture': {
        type: 'internal', icon: '📖', name: '长老讲道',
        desc: function(sectName) { return '门派长老开坛讲道，弟子们受益匪浅。'; },
        effect: function(sectName) {
            var ds = window.discipleState || {};
            if (ds.isInSect && ds.sectId === sectName) {
                ds.points = (ds.points || 0) + 20;
            }
            var data = getSectInternal(sectName);
            if (data) data.morale = Math.min(100, _moraleOf(sectName) + 5);
            return '领悟 +20，全派士气 +5';
        },
        minMorale: 0, maxMorale: 100
    },
    'inner_dispute': {
        type: 'internal', icon: '⚡', name: '内部纷争',
        desc: function(sectName) { return sectName + '内部出现意见分歧，两派弟子争执不休。'; },
        effect: function(sectName) {
            var data = getSectInternal(sectName);
            if (data) data.morale = Math.max(0, _moraleOf(sectName) - 15);
            return '全派士气 -15';
        },
        minMorale: 20, maxMorale: 100
    },
    'treasure_found': {
        type: 'internal', icon: '💎', name: '发现宝藏',
        desc: function(sectName) { return '弟子在' + sectName + '后山发现了一处古修洞府！'; },
        effect: function(sectName) {
            var ds = window.discipleState || {};
            var 本派 = !!(ds.isInSect && ds.sectId === sectName);
            var 分宝 = '';
            if (本派) {
                ds.contribution = (ds.contribution || 0) + 50;
                // DES-72（第一百三十批）：旧写法丢了返回值，回执照念常量「获得材料」；囊里进没进、进的是哪一件，从不问
                if (typeof window.giveWithReceipt === 'function' || typeof window.addItem === 'function') {
                    var treasures = ['mat_spirit_stone', 'mat_lingzhi', 'mat_dark_iron', 'pill_qi_gather'];
                    var tid = treasures[Math.floor(Math.random() * treasures.length)];
                    var 收 = typeof window.giveWithReceipt === 'function'
                        ? window.giveWithReceipt(tid, 1, { quiet: true })
                        : { got: Number(window.addItem(tid, 1)) || 0, count: 1, name: (window.itemById && window.itemById[tid] && window.itemById[tid].name) || tid, reason: window.addItemFailReason || null };
                    分宝 = 收.got > 0 ? '，分得' + 收.name + '×' + 收.got
                        : '，那一份' + 收.name + '一件也没进囊（'
                          // DES-90（第一百三十九批）：问不到账时不许由站点断言满包
                          + ((typeof window.addItemFailPhraseFor === 'function' && window.addItemFailPhraseFor(收.reason, 收.name)) || '没能落进你的行囊') + '）';
                }
            }
            var data = getSectInternal(sectName);
            if (data) { data.morale = Math.min(100, _moraleOf(sectName) + 10); data.resources = _resourcesOf(sectName) + 50; }
            return (本派 ? '贡献 +50' + 分宝 : '你不在' + sectName + '，这桩宝藏与你无份') + '，士气 +10，资源 +50';
        },
        minMorale: 0, maxMorale: 100
    },

    // 外部事件
    'ally_request': {
        type: 'external', icon: '🤝', name: '盟友求援',
        desc: function(sectName) { return '友派发来求援信，请求' + sectName + '出手相助。'; },
        effect: function(sectName) {
            var ds = window.discipleState || {};
            if (ds.isInSect && ds.sectId === sectName) {
                ds.contribution = (ds.contribution || 0) + 30;
            }
            return '贡献 +30';
        },
        minMorale: 0, maxMorale: 100
    },
    'hostile_attack': {
        type: 'external', icon: '⚔️', name: '外敌入侵',
        desc: function(sectName) { return '敌对势力袭击了' + sectName + '的山门！'; },
        effect: function(sectName) {
            var data = getSectInternal(sectName);
            if (data) {
                data.morale = Math.max(0, _moraleOf(sectName) - 20);
                data.resources = Math.max(0, _resourcesOf(sectName) - 30);
            }
            var ds = window.discipleState || {};
            if (ds.isInSect && ds.sectId === sectName) {
                ds.contribution = (ds.contribution || 0) + 40;
            }
            return '全派士气 -20，资源 -30，你获得贡献 +40';
        },
        minMorale: 0, maxMorale: 100
    },
    'wandering_merchant': {
        type: 'external', icon: '🎪', name: '云游商人',
        desc: function(sectName) { return '一位云游商人来到' + sectName + '，出售稀有物品。'; },
        effect: function(sectName) {
            // DES-72（第一百三十批）：这一桩的唯一彩头就是那件货，旧写法丢了返回值、回执念常量
            if (typeof window.giveWithReceipt === 'function' || typeof window.addItem === 'function') {
                var goods = ['pill_spring_recovery', 'mat_meteorite', 'tal_fireball', 'food_roasted_meat'];
                var gid = goods[Math.floor(Math.random() * goods.length)];
                var 收 = typeof window.giveWithReceipt === 'function'
                    ? window.giveWithReceipt(gid, 1, { quiet: true })
                    : { got: Number(window.addItem(gid, 1)) || 0, count: 1, name: (window.itemById && window.itemById[gid] && window.itemById[gid].name) || gid, reason: window.addItemFailReason || null };
                return 收.got > 0 ? '入手 ' + 收.name + '×' + 收.got
                    : '想搭手买一件 ' + 收.name + '，一件也没带上（'
                      + ((typeof window.addItemFailPhraseFor === 'function' && window.addItemFailPhraseFor(收.reason, 收.name)) || '这一件没能交到你手上') + '）';
            }
            return '商人去了，你两手空空，什么也没落下';
        },
        minMorale: 0, maxMorale: 100
    },

    // 灾难事件
    'demon_beast_rampage': {
        type: 'disaster', icon: '🐉', name: '妖兽肆虐',
        desc: function(sectName) { return '一只强大妖兽闯入' + sectName + '地界，造成严重破坏！'; },
        effect: function(sectName) {
            var data = getSectInternal(sectName);
            if (data) {
                data.morale = Math.max(0, _moraleOf(sectName) - 30);
                data.resources = Math.max(0, _resourcesOf(sectName) - 50);
            }
            return '全派士气 -30，资源 -50';
        },
        minMorale: 0, maxMorale: 100
    },
    'plague': {
        type: 'disaster', icon: '☠️', name: '瘟疫蔓延',
        desc: function(sectName) { return sectName + '爆发瘟疫，多名弟子病倒。'; },
        effect: function(sectName) {
            var data = getSectInternal(sectName);
            if (data) {
                data.morale = Math.max(0, _moraleOf(sectName) - 25);
                data.disciples = Math.max(5, _disciplesOf(sectName) - 3);
            }
            var ds = window.discipleState || {};
            if (ds.isInSect && ds.sectId === sectName) {
                ds.contribution = (ds.contribution || 0) + 30;
            }
            return '全派士气 -25，弟子 -3，你贡献 +30';
        },
        minMorale: 0, maxMorale: 100
    },
    'spirit_vein_collapse': {
        type: 'disaster', icon: '💥', name: '灵脉崩塌',
        desc: function(sectName) { return sectName + '的灵脉突然崩塌，灵气浓度急剧下降！'; },
        effect: function(sectName) {
            var data = getSectInternal(sectName);
            if (data) {
                data.morale = Math.max(0, _moraleOf(sectName) - 35);
                data.resources = Math.max(0, _resourcesOf(sectName) - 60);
            }
            return '全派士气 -35，资源 -60';
        },
        minMorale: 0, maxMorale: 100
    },

    // 福利事件
    'holy_land_open': {
        type: 'bonus', icon: '🏔️', name: '圣地开启',
        desc: function(sectName) { return sectName + '的修炼圣地对外开放，修炼效率翻倍！'; },
        effect: function(sectName) {
            if (typeof window.applyBuff === 'function') {
                window.applyBuff('sect_holy_land_buff', { cultivationSpeed: 1.0 }, 4);
            }
            var data = getSectInternal(sectName);
            if (data) data.morale = Math.min(100, _moraleOf(sectName) + 20);
            return '修炼速度 +100%（4小时），全派士气 +20';
        },
        minMorale: 0, maxMorale: 100
    },
    'grand_festival': {
        type: 'bonus', icon: '🎉', name: '门派庆典',
        desc: function(sectName) { return sectName + '举办盛大庆典，全派上下欢庆一堂。'; },
        effect: function(sectName) {
            var data = getSectInternal(sectName);
            if (data) {
                data.morale = Math.min(100, _moraleOf(sectName) + 25);
                data.resources = _resourcesOf(sectName) + 30;
            }
            var ds = window.discipleState || {};
            var _肉 = 0, _肉该 = 0, _在场 = !!(ds.isInSect && ds.sectId === sectName);
            if (_在场) {
                ds.contribution = (ds.contribution || 0) + 20;
                // DES-72 副账收口（第一百二十七批）：庆典那两块以前丢返回值——玩家一口没吃着，回执里连提都不提
                _肉该 = 2;
                _肉 = (typeof window.addItem === 'function') ? (Number(window.addItem('food_roasted_meat', 2)) || 0) : 2;
            }
            return '全派士气 +25，资源 +30，贡献 +20' + (_肉 > 0 ? '，烤肉 ×' + _肉 : (_肉该 ? '（灶上的烤肉你两块也没能带走：' + ((typeof window.addItemFailPhrase === 'function' && window.addItemFailPhrase('灶上的烤肉')) || '这一件先还留在原处') + '）' : ''));
        },
        minMorale: 0, maxMorale: 100
    },
    'master_return': {
        type: 'bonus', icon: '👴', name: '老祖出关',
        desc: function(sectName) { return sectName + '的太上老祖出关，修为更进一步！'; },
        effect: function(sectName) {
            var data = getSectInternal(sectName);
            if (data) {
                data.morale = Math.min(100, _moraleOf(sectName) + 30);
                data.influence = _influenceOf(sectName) + 20;
            }
            return '全派士气 +30，影响力 +20';
        },
        minMorale: 0, maxMorale: 100
    },

    // v20.46 通用池扩充：门派日常，月月有戏
    'sect_exam': {
        type: 'internal', icon: '📝', name: '门内大考',
        desc: function(sectName) { return sectName + '举行季度大考，弟子们演武比试，检验修行。'; },
        effect: function(sectName) {
            var ds = window.discipleState || {};
            if (ds.isInSect && ds.sectId === sectName) {
                ds.points = (ds.points || 0) + 30;
            }
            var data = getSectInternal(sectName);
            if (data) data.morale = Math.min(100, _moraleOf(sectName) + 5);
            return '考核积分 +30，全派士气 +5';
        },
        minMorale: 0, maxMorale: 100
    },
    'new_disciples': {
        type: 'internal', icon: '🧒', name: '新弟子入门',
        desc: function(sectName) { return '一批新弟子通过考核拜入' + sectName + '，山门添了人气。'; },
        effect: function(sectName) {
            var data = getSectInternal(sectName);
            if (data) {
                data.disciples = _disciplesOf(sectName) + 2;
                data.morale = Math.min(100, _moraleOf(sectName) + 5);
            }
            return '弟子 +2，全派士气 +5';
        },
        minMorale: 0, maxMorale: 100
    },
    'ancestor_worship': {
        type: 'internal', icon: '🕯️', name: '祖师祭祀',
        desc: function(sectName) { return sectName + '举行祖师祭祀，香烟缭绕，全派肃立。'; },
        effect: function(sectName) {
            var ds = window.discipleState || {};
            if (ds.isInSect && ds.sectId === sectName) {
                ds.points = (ds.points || 0) + 15;
            }
            var data = getSectInternal(sectName);
            if (data) data.morale = Math.min(100, _moraleOf(sectName) + 10);
            return '积分 +15，全派士气 +10';
        },
        minMorale: 0, maxMorale: 100
    },
    'friendly_visit': {
        type: 'external', icon: '🏮', name: '友派来访',
        desc: function(sectName) { return '友派弟子到访' + sectName + '，切磋交流，气氛热络。'; },
        effect: function(sectName) {
            var data = getSectInternal(sectName);
            if (data) data.influence = _influenceOf(sectName) + 5;
            var ds = window.discipleState || {};
            if (ds.isInSect && ds.sectId === sectName) {
                ds.points = (ds.points || 0) + 15;
            }
            return '影响力 +5，切磋积分 +15';
        },
        minMorale: 0, maxMorale: 100
    },
    'arena_open': {
        type: 'external', icon: '🏟️', name: '演武设擂',
        desc: function(sectName) { return sectName + '在山下设擂，广邀豪杰切磋，胜者有名。'; },
        effect: function(sectName) {
            var ds = window.discipleState || {};
            if (ds.isInSect && ds.sectId === sectName) {
                ds.contribution = (ds.contribution || 0) + 25;
            }
            var data = getSectInternal(sectName);
            if (data) data.influence = _influenceOf(sectName) + 8;
            return '贡献 +25，影响力 +8';
        },
        minMorale: 0, maxMorale: 100
    },
    'poor_harvest': {
        type: 'disaster', icon: '🍂', name: '岁收歉薄',
        desc: function(sectName) { return sectName + '山下田产歉收，门派粮用吃紧。'; },
        effect: function(sectName) {
            var data = getSectInternal(sectName);
            if (data) {
                data.resources = Math.max(0, _resourcesOf(sectName) - 25);
                data.morale = Math.max(0, _moraleOf(sectName) - 8);
            }
            return '资源 -25，士气 -8';
        },
        minMorale: 0, maxMorale: 100
    }
};

// ============ 获取门派内部数据 ============
function getSectInternal(sectName) {
    if (window.SECT_INTERNAL && window.SECT_INTERNAL[sectName]) {
        return window.SECT_INTERNAL[sectName];
    }
    return null;
}

function _sectEventNowMinute() {
    if (window.GameScheduler && typeof window.GameScheduler.nowMinute === 'function') return window.GameScheduler.nowMinute();
    return (window.timeSystem && window.timeSystem.gameTime) ? (Number(window.timeSystem.gameTime.totalMinutes) || 0) : 0;
}

function _sectEventConfig() {
    return (window.XianXia && window.XianXia.Balance && window.XianXia.Balance.sectEvents) || {
        checkCooldownMinutes: 360,
        activeDurationMinutes: 720,
        triggerChance: 0.30
    };
}

// ============ 门派数值读口（零值不算「没有」）============
// W-5 收口：抽取与结算曾各写各的兜底。上一批只把抽取那一处从 `data.morale || 50`
//   换成了 `== null` 口径，下方 15 处结算仍是旧写法 —— 于是**不对称**：
//   抽取按真实士气 0 算（实测谷底灾难占比 53.3%），结算却还在给 50 加减。
//   士气正好是 0 时 `0 || 50` 得 50：谷底减 15 得 35（谷底反涨）、加 15 得 65（一键半满）。
//   士气是**取值**不是「有没有」——只有 null/undefined/非数才该落默认值。
//   ⚠️ 本读口必须与 generateSectEvent 那段逐字同一口径，否则改完这边抽取又不一致。
function _moraleOf(sectName) {
    var data = getSectInternal(sectName);
    if (!data) return 50;
    var m = (data.morale == null) ? 50 : Number(data.morale);
    return isFinite(m) ? m : 50;
}

// 资源同理：`resources || 100` 在本文件里被 Math.max(0, …) 反复按到 0（:99/:137/:167/:299），
//   跨文件 sect-war.js:462 也照 0 减。资源 0 时 `0 || 100` 得 100：
//   夺宝(:73)加 50 得 150、庆典(:195)加 30 得 130、外敌(:99)减 30 得 70（该归 0 反而富起来）。
function _resourcesOf(sectName) {
    var data = getSectInternal(sectName);
    if (!data) return 100;
    var r = (data.resources == null) ? 100 : Number(data.resources);
    return isFinite(r) ? r : 100;
}

// 影响力同理：`influence || 50` —— 一开始我按「影响力全仓只加不减」判它不是活陷阱，
//   后经 grep 推翻：sects-system.js:2134 是 `Math.max(0, (Number(internal.influence) || 0) - cost.influence)`、
//   sect-court.js:215/:304 是 `Math.max(0, … - 2)`，**影响力能到 0**。
//   影响力 0 时 `0 || 50` 得 50：老祖出关(:216)加 20 得 70（该得 20）、友派来访(:270)加 5 得 55。
//   注：这三处本来就没有上限钳位（影响力能无上限涨），那是另一个病灶，本批不动。
function _influenceOf(sectName) {
    var data = getSectInternal(sectName);
    if (!data) return 50;
    var v = (data.influence == null) ? 50 : Number(data.influence);
    return isFinite(v) ? v : 50;
}

// 弟子数同理：`disciples || 20` —— sect-cities.js:280 是 `Math.max(0, … - 5)`，**弟子数能到 0**。
//   瘟疫(:150)在 0 时 `0 || 20` 得 20，扣 3 记 17 —— 一场瘟疫凭空给门里添了 17 个弟子。
function _disciplesOf(sectName) {
    var data = getSectInternal(sectName);
    if (!data) return 20;
    var v = (data.disciples == null) ? 20 : Number(data.disciples);
    return isFinite(v) ? v : 20;
}

// ============ 生成门派事件 ============
function generateSectEvent(sectName) {
    var data = getSectInternal(sectName);
    if (!data) return null;
    
    // W-5：旧写法 `data.morale || 50` —— 士气**正好是 0** 时 `0 || 50` 得 50，
    //   门派跌到谷底（连着几场灾难：-35/-30/-25/-20/-8 都往 0 压，0 是能到的）
    //   反而被当成士气 50 来抽事件：谷底的门(minMorale)不拦、加权也按 50 算。
    //   士气是**取值**不是「有没有」，null/undefined 才该落默认值。
    //   ⚠️ 这两行与上方 _moraleOf 是**同一套口径的两份拷贝**，改一处必须改另一处。
    //     为什么不是直接调 _moraleOf：tests/wave142-fix-wiring-node.js Ⓒ10 逐字钉这一行，
    //     Ⓔ0 还拿它当锚点 .replace() 回去复现「改前」那份源码。抽成读口会把那两条打断。
    //     口径本身由 tests/legacy-morale-zero-node.js 的「抽取侧 vs 结算侧逐档比对」锁着，
    //     比字符串比对更严：两边对任一输入算出不同的门槛值就当场红。
    var morale = (data.morale == null) ? 50 : Number(data.morale);
    if (!isFinite(morale)) morale = 50;
    var pool = [];
    
    // 根据士气筛选可用事件
    for (var key in SECT_EVENTS_POOL) {
        var ev = SECT_EVENTS_POOL[key];
        if (morale >= ev.minMorale && morale <= ev.maxMorale) {
            pool.push({ id: key, event: ev });
        }
    }

    // v20.46 门派专属事件：每门每派的戏，与通用池同权混抽
    var exclusive = (window.SECT_EXCLUSIVE_EVENTS && window.SECT_EXCLUSIVE_EVENTS[sectName]) || {};
    for (var ek in exclusive) {
        var eev = exclusive[ek];
        if (!eev) continue;
        if (morale >= (eev.minMorale || 0) && morale <= (eev.maxMorale || 100)) {
            pool.push({ id: ek, event: eev });
        }
    }

    if (pool.length === 0) return null;

    // 加权随机：灾难事件概率随士气降低而增加
    // W-5（接线五处 · 第五处）：这一行此前是 `pool[Math.floor(Math.random() * pool.length)]`
    //   ——**纯均匀随机**，注释承诺的加权从没落地（注释说了三年，代码没跟上）。
    //   权重口径（只兑现注释那一支，不多加料）：**只有 disaster 一档随士气反向加权，其余一律 1**。
    //     士气 0 → 灾难权重 4；士气 30 → 2.5；士气 ≥60 → 1（与旧均匀随机同档）。
    //   仍只掷一次 Math.random（旧写法也只掷一次），骰子压力没变。
    //   ⚠️ 权重只决定「谁更容易被抽中」，**不改池子的资格**——资格归上面 minMorale/maxMorale 那道门管。
    //   ⚠️ 门派事件不是节令玩法（全仓唯一的节气模块是 js/world/solar-terms.js），
    //      「节令禁掷骰」那条纪律扫不到这里，也没有任何套件断言本文件零 Math.random。
    function _sectEventWeight(ev, morale) {
        if (ev && ev.type === 'disaster') return 1 + Math.max(0, 60 - morale) / 20;
        return 1;
    }
    var pick = null;
    var _total = 0;
    for (var _i = 0; _i < pool.length; _i++) _total += _sectEventWeight(pool[_i].event, morale);
    var _roll = Math.random() * _total;
    for (var _j = 0; _j < pool.length; _j++) {
        _roll -= _sectEventWeight(pool[_j].event, morale);
        if (_roll <= 0) { pick = pool[_j]; break; }
    }
    if (!pick) pick = pool[pool.length - 1]; // 浮点尾数兜底：总有一枚抽得中
    var eventObj = pick.event;
    
    // 这里只生成描述，不执行效果。效果必须在玩家点击“处理”时结算。
    return {
        id: pick.id,
        type: eventObj.type,
        icon: eventObj.icon,
        name: eventObj.name,
        desc: eventObj.desc(sectName),
        effectDesc: '处理后结算事件影响',
        gameMinute: _sectEventNowMinute()
    };
}

// ============ 门派事件状态管理 ============
var sectEventState = {
    activeEvents: {},    // { sectName: { event, expiry } }
    completedEvents: [], // event id list
    lastCheckTime: {}    // { sectName: timestamp }
};

// ============ 检查是否有新事件 ============
function checkSectEvents(sectName) {
    var now = _sectEventNowMinute();
    var cfg = _sectEventConfig();
    var lastCheck = Number(sectEventState.lastCheckTime[sectName]);
    if (!Number.isFinite(lastCheck)) lastCheck = -Infinity;

    var active = sectEventState.activeEvents[sectName];
    if (active) {
        if (now < Number(active.expiryGameMinute || 0)) return active.event;
        delete sectEventState.activeEvents[sectName];
        // 第一百一十一波：没人管的灾难到期=真发生了——旧版静默删除、零损失，
        // 最优策略成了「只领福利不接灾」。福利没领到期就是真过期，不补账。
        try {
            var _eid = active.event && active.event.id;
            var _def = SECT_EVENTS_POOL[_eid]
                || ((window.SECT_EXCLUSIVE_EVENTS && window.SECT_EXCLUSIVE_EVENTS[sectName]) || {})[_eid]
                || null;
            if (_def && _def.type === 'disaster' && typeof _def.effect === 'function') {
                var _res = _def.effect(sectName);
                if (typeof window.showMessage === 'function' && !window._isInLongRetreat) {
                    window.showMessage('📜 「' + ((active.event && active.event.name) || '灾祸') + '」没人处置——事情真发生了：' + _res, 'warning');
                }
            }
        } catch (eExp) {}
    }

    if (now - lastCheck < cfg.checkCooldownMinutes) return null;
    sectEventState.lastCheckTime[sectName] = now;

    if (Math.random() > cfg.triggerChance) return null;

    var event = generateSectEvent(sectName);
    if (event) {
        sectEventState.activeEvents[sectName] = {
            event: event,
            expiryGameMinute: now + cfg.activeDurationMinutes
        };
        // v18.9 世界日历：镜像注册"门派事件到期日"（到期日 = expiryGameMinute / 1440 向上取整）
        tryRegisterSectEvent(sectName, event, cfg.activeDurationMinutes);
        return event;
    }
    return null;
}

// v18.9 世界日历：把门派事件到期日注册为 sect_event 类别（镜像）
function tryRegisterSectEvent(sectName, event, durationMinutes) {
    try {
        if (!window.WorldCalendar || typeof window.WorldCalendar.register !== 'function') return;
        // 当前游戏绝对日（与 calendar 一致）
        var today = 1;
        try {
            if (window.getAbsoluteDay) today = Number(window.getAbsoluteDay()) || 1;
        } catch (e0) {}
        // 把"事件持续多少分钟"换算成"结束日"（默认 720min = 0.5 日，向上取整至少 1 日）
        var daysAhead = Math.max(1, Math.ceil((Number(durationMinutes) || 720) / 1440));
        var dueDay = today + daysAhead;
        window.WorldCalendar.register({
            id: 'sect_event.' + sectName + '.' + event.id + '.due.' + dueDay,
            title: (event.icon ? event.icon + ' ' : '') + (event.name || event.id) + '（' + sectName + '）',
            category: 'sect_event',
            dueAbsoluteDay: dueDay,
            source: { system: 'sect-events', refId: event.id },
            region: sectName,
            severity: 'remind',
            oneShot: false
        });
    } catch (e) { /* calendar not ready — ignore */ }
}

// ============ 处理门派事件 ============
function handleSectEvent(sectName, eventId) {
    var active = sectEventState.activeEvents[sectName];
    if (!active || active.event.id !== eventId) {
        if (typeof window.showMessage === 'function') {
            window.showMessage('此事件已过期', 'warning');
        }
        return;
    }
    
    var event = active.event;
    var definition = SECT_EVENTS_POOL[event.id]
        || ((window.SECT_EXCLUSIVE_EVENTS && window.SECT_EXCLUSIVE_EVENTS[sectName]) || {})[event.id]
        || null;
    if (!definition || typeof definition.effect !== 'function') {
        delete sectEventState.activeEvents[sectName];
        if (typeof window.showMessage === 'function') window.showMessage('事件数据异常，已安全取消。', 'error');
        return;
    }
    var resultText = definition.effect(sectName);
    delete sectEventState.activeEvents[sectName];
    sectEventState.completedEvents.push({ id: eventId, sectName: sectName, gameMinute: _sectEventNowMinute() });
    if (sectEventState.completedEvents.length > 200) sectEventState.completedEvents = sectEventState.completedEvents.slice(-200);
    
    if (typeof window.showMessage === 'function') {
        window.showMessage('📜 ' + event.name + '：' + resultText, 'info');
    }
    
    // 刷新UI
    if (typeof window.showSectInnerView === 'function') {
        window.showSectInnerView(sectName);
    }
}

// ============ 获取事件描述 ============
function getSectEventDisplay(sectName) {
    var event = checkSectEvents(sectName);
    if (!event) return null;
    
    var typeColors = {
        internal: 'border-blue-600 bg-blue-900/30',
        external: 'border-yellow-600 bg-yellow-900/30',
        disaster: 'border-red-600 bg-red-900/30',
        bonus: 'border-green-600 bg-green-900/30'
    };
    var borderClass = typeColors[event.type] || 'border-gray-600';
    var typeNames = {
        internal: '内部事件',
        external: '外部事件',
        disaster: '⚠️ 灾难',
        bonus: '🎉 福利'
    };
    var typeName = typeNames[event.type] || '事件';
    
    return {
        html: '<div class="' + borderClass + ' p-3 rounded border mb-4">' +
            '<div class="flex items-center gap-2 mb-2">' +
            '<span class="text-2xl">' + event.icon + '</span>' +
            '<div class="flex-1">' +
            '<p class="font-bold text-sm text-white">' + event.name + '</p>' +
            '<p class="text-xs text-gray-400">' + typeName + '</p>' +
            '</div>' +
            '<button onclick="handleSectEvent(\'' + sectName + '\', \'' + event.id + '\')" class="bg-yellow-600 hover:bg-yellow-500 text-gray-900 px-3 py-1 rounded text-xs font-bold">处理</button>' +
            '</div>' +
            '<p class="text-xs text-gray-300">' + event.desc + '</p>' +
            '<p class="text-xs text-green-400 mt-1">' + event.effectDesc + '</p>' +
            '</div>',
        event: event
    };
}

if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
    window.StateRegistry.register('sectEvents', {
        version: 1,
        export: function() { return JSON.parse(JSON.stringify(sectEventState)); },
        import: function(data) {
            data = data || {};
            sectEventState.activeEvents = data.activeEvents || {};
            sectEventState.completedEvents = Array.isArray(data.completedEvents) ? data.completedEvents : [];
            sectEventState.lastCheckTime = data.lastCheckTime || {};
        },
        reset: function() {
            sectEventState.activeEvents = {};
            sectEventState.completedEvents = [];
            sectEventState.lastCheckTime = {};
        }
    });
}

// ============ 导出 ============
window.SECT_EVENT_TYPES = SECT_EVENT_TYPES;
window.SECT_EVENTS_POOL = SECT_EVENTS_POOL;
window.sectEventState = sectEventState;
window.generateSectEvent = generateSectEvent;
window.checkSectEvents = checkSectEvents;
window.handleSectEvent = handleSectEvent;
window.getSectEventDisplay = getSectEventDisplay;
// W-5：加权口径是纯函数，导出好让套件直接量它（不导出就只能靠抽签反推，量不准）
window.sectEventWeight = function (ev, morale) {
    if (ev && ev.type === 'disaster') return 1 + Math.max(0, 60 - morale) / 20;
    return 1;
};