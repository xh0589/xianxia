// ==================== 第六十六波 · 斗法台台下赌盘（牌面终于名副其实） ====================
// 斗法台的牌面写着「押斗赌彩，胜负各安天命」，台上的话本也念「台下赌盘已经开了赔率」——
// 可这盘口此前永远开不出来，是满城最名不副实的一块牌子。本账把盘口真开起来：
// 庄家支桌挂赔率，热手冷门都能押，胜负走引擎成败签，铜钱走统一结算原子入账。
// 纪律：①赔率里明含台子钱——热手 0.6×32、冷门 0.4×48，两边期望都低于本金（押注是花钱买热闹，不是营生路）；
//       ②对阵与场次按「城+日」定死——同一天看两回是同一场，庄家不换个对阵说谎（与司法堂堂审同款播种法）；
//       ③零新存档字段、零悟道点、零直掷骰（成败签全走引擎随机源）；
//       ④契约所的灵雨赌押的是灵石、赌的是月余后的天——台下的盘口押铜钱、当日见分晓，两本赌账不重叠。
// 依赖：scenario-engine.js + facility-batch2.js（arena_stage 注册）+ facility-batch3.js（facilityAugment）
(function () {
    'use strict';
    if (typeof window.facilityAugment !== 'function' || !window.scenarioEngine) return;

    var STAKE = 20;        // 一张注单 20 铜钱
    var FAV_RET = 32;      // 押中热手连本带利回 32（一赔一点六，净 +12）
    var DOG_RET = 48;      // 押中冷门连本带利回 48（一赔二点四，净 +28）
    var FAV_PROB = 0.6;    // 热手胜率——0.6×32=19.2、0.4×48=19.2：两边期望都是 19.2 < 本金 20，台子钱含在赔率里
    var DOG_PROB = 0.4;
    var WIN_MOOD = 6, LOSE_MOOD = -4, WATCH_MOOD = 3;
    var BET_MIN = 45, WATCH_MIN = 30;

    var FAV_NAMES = ['「铁袖」镖局的总镖头', '禁军里退下来的老教头', '云游四方轻装上阵的剑修', '锻坊里使双锤的二掌柜', '山门里下来历练的外门弟子', '北地雇来的护院修士'];
    var DOG_NAMES = ['初下山的毛头小子', '没人认得的灰袍老修', '家道中落的年轻公子', '码头扛活练出一身粗气的汉子', '裹着剑布的半老女修', '从兽栏里爬出来的野路子'];

    function abHash(s) {
        var h = 0;
        for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) % 9973; }
        return h;
    }
    function abCity() {
        if (typeof window.facilityScenarioCity === 'function') {
            try { var c = window.facilityScenarioCity(); if (c) return c; } catch (e) {}
        }
        return (window.currentCharData && window.currentCharData.location) || '';
    }
    function abDay() {
        try {
            if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') return window.timeSystem.getAbsoluteDay();
            if (window.timeSystem && window.timeSystem.gameTime) return Math.floor((window.timeSystem.gameTime.totalMinutes || 0) / 1440);
        } catch (e) {}
        return 0;
    }
    // 对阵按城+日定死：同一天谁来问都是这一场（庄家不说谎）
    function abMatchup() {
        var h = abHash(abCity() + '_book_' + abDay());
        return {
            fav: FAV_NAMES[h % FAV_NAMES.length],
            dog: DOG_NAMES[Math.floor(h / 7) % DOG_NAMES.length],
            streak: 2 + (h % 4)
        };
    }

    window.facilityAugment('arena_stage', {
        id: 'arena_book', name: '台下赌盘', icon: '🎲',
        desc: '庄家支桌开赔率：押热手、押冷门，台子钱含在赔率里——当日见分晓',
        startNode: 'ab_start',
        nodes: {
            ab_start: {
                desc: function () {
                    var m = abMatchup();
                    return '台下人堆外沿，庄家支起一张小桌，注单钉在木牌上：\n\n'
                        + '今日热手（蓝角）：' + m.fav + '，已连胜 ' + m.streak + ' 场——押一注，连本带利回一点六倍；\n'
                        + '今日冷门（红角）：' + m.dog + '——押一注，连本带利回二点四倍。\n\n'
                        + '庄家敲着木牌把话说明：「一张注单二十铜，台子钱已经含在赔率里。买定离手，愿赌服输——赢了当场兑付，输了莫要追损。」';
                },
                choices: [
                    {
                        text: '🔵 押热手（20 铜钱，押中连本带利回 32）', next: null,
                        require: { copper: STAKE },
                        effects: {
                            cost: { copper: STAKE }, roll: {
                                prob: FAV_PROB,
                                win: {
                                    copper: FAV_RET, mood: WIN_MOOD, time: BET_MIN, msgType: 'success',
                                    msg: function () {
                                        var m = abMatchup();
                                        return '台上' + m.fav + '三招放倒对手，满堂炸彩。庄家把你的注单当众兑了，铜钱一文不少：「热手赢盘，承惠承惠——客官常来。」';
                                    }
                                },
                                lose: {
                                    mood: LOSE_MOOD, time: BET_MIN, msgType: 'warning',
                                    msg: function () {
                                        var m = abMatchup();
                                        return '台上' + m.fav + '竟在一记最拿手的招式上失了手，满场哗然——你的注单成了废纸。庄家收单收得干脆：「冷门吃热手，年年都有。要追损，先回去睡一觉。」';
                                    }
                                }
                            }
                        }
                    },
                    {
                        text: '🔴 押冷门（20 铜钱，押中连本带利回 48）', next: null,
                        require: { copper: STAKE },
                        effects: {
                            cost: { copper: STAKE }, roll: {
                                prob: DOG_PROB,
                                win: {
                                    copper: DOG_RET, mood: WIN_MOOD, time: BET_MIN, msgType: 'success',
                                    msg: function () {
                                        var m = abMatchup();
                                        return '台上' + m.dog + '硬生生扛过狂风暴雨，反手一记定胜负——满场先是死静，随即炸了锅。庄家眯着眼兑付：「冷门赢盘，赔得肉疼……客官好眼力。」';
                                    }
                                },
                                lose: {
                                    mood: LOSE_MOOD, time: BET_MIN, msgType: 'warning',
                                    msg: function () {
                                        var m = abMatchup();
                                        return '台上' + m.dog + '撑不过十招就被请下了台——注单成废纸。庄家把铜钱拢进匣子：「冷门之所以是冷门，就是这个道理。」';
                                    }
                                }
                            }
                        }
                    },
                    {
                        text: '👀 只看不押（白凑个热闹）', next: null,
                        effects: {
                            mood: WATCH_MOOD, time: WATCH_MIN,
                            msg: '你抱着手在人堆外沿看完整场，跟着满场喝彩。看斗法看得血热，倒也比押注踏实——热闹是白看的，铜钱一文没动。'
                        }
                    },
                    { text: '👋 不碰注单', next: null }
                ]
            }
        }
    });
})();
