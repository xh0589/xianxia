// ==================== facility-qin-venue.js — 勾栏瓦舍（v20.90） ====================
// 城中卖艺场：登台抚琴/说书/压轴「摄魂音」赚打赏，台下听曲、幕后练琴长音律。
// 打赏与长进全按 QinArts 的艺册现算（音律等级 × 手中琴品相），不写死数。
// 依赖：scenario-engine.js、qin-arts.js（缺了也能跑，按裸音律算）

(function () {
    'use strict';
    if (!window.scenarioEngine || typeof window.scenarioEngine.register !== 'function') return;

    function qa() { return window.QinArts || null; }
    function qinLevel() {
        var a = qa();
        if (a) return a.level();
        return (((window.currentCharData || {}).lifeSkills) || {})['音律'] || 0;
    }
    function qinInHand() {
        var a = qa();
        return !!(a && a.equippedQin());
    }
    function qinName() {
        var a = qa();
        var q = a && a.equippedQin();
        return (q && ((q.tpl && q.tpl.name) || (q.item && q.item.name))) || '琴';
    }
    function baseScore() {
        var a = qa();
        return a ? a.performanceScore() : (10 + qinLevel() * 2);
    }
    function tipCopper(mul) { return Math.max(1, Math.round(baseScore() * 3 * (mul == null ? 1 : mul)) + 20); }
    function tipStones() {
        var b = baseScore();
        return b >= 100 ? Math.max(1, Math.floor(b / 50)) : 0;   // 艺压一城才有灵石赏
    }
    // 第六十五波：台下看客的氛围词按城取（CityVoices goulan_washe.crowd，缺城回落无引子）
    function crowdLine() {
        try {
            var c = (typeof window.getCurrentCityName === 'function' && window.getCurrentCityName()) ||
                ((window.currentCharData || {}).location) || '';
            var v = (window.CityVoices && typeof window.CityVoices.vo === 'function')
                ? window.CityVoices.vo(c, 'goulan_washe', 'crowd', '') : '';
            return v ? v + '\n' : '';
        } catch (e) { return ''; }
    }

    window.scenarioEngine.register('goulan_washe', {
        id: 'goulan_washe', name: '勾栏瓦舍', icon: '🎭',
        desc: '登台卖艺赚打赏、幕后练琴长音律——琴与嗓子都是饭碗',
        scenarios: [{
            id: 'stage', name: '瓦舍登台', icon: '🎭',
            desc: '勾栏里人声鼎沸，台上正缺个有真本事的',
            startNode: 'stage_start',
            nodes: {
                stage_start: {
                    desc: function () {
                        var lv = qinLevel();
                        var s = '瓦舍掌柜迎上来，上下打量你一番：「客官要登台？咱这儿听客嘴刁，赏钱全凭真本事。」\n\n';
                        s += '你的音律：' + lv + ' 级。';
                        s += qinInHand()
                            ? '背上「' + qinName() + '」未动先有琴意，掌柜眼睛一亮。'
                            : '你两手空空——清唱说书也成，只是赏钱薄些。';
                        return s;
                    },
                    choices: [
                        {
                            text: '🪕 抚琴一曲（打赏看音律与手中琴）', next: null,
                            require: { energy: 20 },
                            effects: {
                                cost: { energy: 20 },
                                roll: {
                                    prob: function () { return Math.min(0.95, 0.45 + qinLevel() * 0.005 + (qinInHand() ? 0.15 : 0)); },
                                    win: {
                                        copper: function () { return tipCopper(1); },
                                        stones: function () { return tipStones(); },
                                        rep: 1,
                                        lifeSkill: { name: '音律', exp: function () { return qinInHand() ? 3 : 2; } },
                                        msg: function () {
                                            return (qinInHand() ? '「' + qinName() + '」一声拨开，满堂嘈杂霎时静了。' : '你清喉开嗓，一曲唱得字正腔圆。')
                                                + '曲终半晌，喝彩与铜钱一齐抛上台来。';
                                        },
                                        msgType: 'success',
                                        time: 90
                                    },
                                    lose: {
                                        copper: function () { return tipCopper(0.2); },
                                        lifeSkill: { name: '音律', exp: 1 },
                                        msg: '台下听客走神的走神、嗑瓜子的嗑瓜子，一曲终了只有零星几声喝彩。掌柜宽慰你：「多登台，熟了就好了。」',
                                        time: 90
                                    }
                                }
                            }
                        },
                        {
                            text: '📖 说书一段（不吃琴，吃嘴皮子）', next: null,
                            require: { energy: 10 },
                            effects: {
                                cost: { energy: 10 },
                                roll: {
                                    prob: function () {
                                        var sp = (((window.currentCharData || {}).lifeSkills) || {})['口才'] || 0;
                                        return Math.min(0.9, 0.4 + sp * 0.005 + qinLevel() * 0.002);
                                    },
                                    win: {
                                        copper: function () { return tipCopper(0.5); },
                                        lifeSkill: [{ name: '口才', exp: 2 }, { name: '音律', exp: 1 }],
                                        msg: function () { return '惊堂木一拍，「列位看官，且听这段仙门旧事——」说到关窍处满堂屏息，散场时赏钱不少。'; },
                                        msgType: 'success',
                                        time: 90
                                    },
                                    lose: {
                                        copper: function () { return tipCopper(0.1); },
                                        lifeSkill: { name: '口才', exp: 1 },
                                        msg: '书目不熟，说到一半忘了关子，台下嘘声一片。掌柜打圆场：「明儿换段熟的。」',
                                        time: 90
                                    }
                                }
                            }
                        },
                        {
                            text: '🌊 压轴奏「摄魂音」（非琴与高手不敢碰）', next: null,
                            require: { energy: 40 },
                            effects: {
                                cost: { energy: 40 },
                                roll: {
                                    prob: function () {
                                        var a = qa();
                                        var q = a && a.equippedQin();
                                        return Math.min(0.9, 0.15 + qinLevel() * 0.006 + (q ? q.tier * 0.09 : 0));
                                    },
                                    win: {
                                        copper: function () { return tipCopper(2.5); },
                                        stones: function () { return tipStones() * 2 + 2; },
                                        rep: 3,
                                        lifeSkill: { name: '音律', exp: 4 },
                                        msg: function () {
                                            return '七弦一振，音波如水漫过全场——听客眼神涣散，杯盏停在半空。曲罢良久无人出声，忽有满座起立，赏钱堆成小山。二楼雅座一位音修老者抚掌：「此曲只应天上有。」';
                                        },
                                        msgType: 'success',
                                        time: 120
                                    },
                                    lose: {
                                        copper: function () { return tipCopper(0.1); },
                                        lifeSkill: { name: '音律', exp: 1 },
                                        msg: '指法一乱，音波散成噪音，前排听客捂住耳朵叫倒好。掌柜苦着脸把你劝下台：「这等曲子，火候不到碰不得啊。」',
                                        time: 120
                                    }
                                }
                            }
                        },
                        {
                            text: '🎧 台下听曲（花几文钱，偷师几分）', next: null,
                            effects: {
                                cost: { copper: 10 },
                                lifeSkill: { name: '音律', exp: 1 },
                                msg: '你要了壶粗茶坐在角落，听台上琴师弹了两折。指法路数记在心里，多少有些长进。',
                                time: 60
                            }
                        },
                        { text: '🏮 转入幕后（练琴传艺）', next: 'back_stage' },
                        // 第六十五波：台下节目单——杂耍、皮影、口技。勾栏里不止有琴，
                        // 看客花几文钱买半个时辰的热闹：账只认铜钱、时间与心境（心境走统一结算）。
                        // 注意：三个看戏口子排在「转入幕后」之后——老验收按位次点单，前五位次序动不得。
                        {
                            text: '🤸 看一场杂耍（5 文钱，图个热闹）', next: null,
                            effects: {
                                cost: { copper: 5 }, mood: 8,
                                msg: function () { return crowdLine() + '吞刀喷火、顶缸走索，一式接一式，喝彩声浪一阵高过一阵。你看得脖子发酸，心里却松快。（心境+8）'; },
                                time: 45
                            }
                        },
                        {
                            text: '🏮 看一段皮影戏（5 文钱，看个故事）', next: null,
                            effects: {
                                cost: { copper: 5 }, mood: 6, lifeSkill: { name: '学识', exp: 1 },
                                msg: function () { return crowdLine() + '白幕之后灯影流转，三根竹棍挑出一段仙门旧事，演得有鼻子有眼。散场时你还能哼出两句主角的出场词——看戏也长见识。（学识+1、心境+6）'; },
                                time: 45
                            }
                        },
                        {
                            text: '🐦 听口技「百鸟朝凤」（8 文钱，听个绝活）', next: null,
                            effects: {
                                cost: { copper: 8 }, mood: 6, lifeSkill: { name: '音律', exp: 1 },
                                msg: function () { return crowdLine() + '一人一桌一扇一抚尺，百鸟齐鸣绕梁不散——你闭上眼，几乎以为身在春山。换气与转音的门道，也偷师了几分。（音律+1、心境+6）'; },
                                time: 45
                            }
                        },
                        { text: '👋 离了勾栏', next: null }
                    ]
                },
                back_stage: {
                    desc: function () {
                        return '幕后小院清净，瓦舍的琴师们在此调弦练指。' + (qinInHand() ? '你把「' + qinName() + '」摆在案上，弦音未动意先动。' : '墙边挂着几具瓦舍的旧琴，借来练手也成。');
                    },
                    choices: [
                        {
                            text: '🎼 闭门练琴两个时辰', next: null,
                            require: { energy: 25 },
                            effects: {
                                cost: { energy: 25 },
                                roll: {
                                    prob: function () { return Math.min(0.9, 0.6 + qinLevel() * 0.002); },
                                    win: {
                                        lifeSkill: { name: '音律', exp: function () { return qinInHand() ? 4 : 3; } },
                                        msg: function () { return '反复打磨一段曲牌，指下渐渐有了自己的味道。' + (qinInHand() ? '「' + qinName() + '」与你愈发心意相通。' : ''); },
                                        msgType: 'success',
                                        time: 120
                                    },
                                    lose: {
                                        lifeSkill: { name: '音律', exp: 1 },
                                        msg: '练到后半程指头打结，越急越乱。琴师笑道：「歇歇吧，手上的功夫急不来。」',
                                        time: 120
                                    }
                                }
                            }
                        },
                        {
                            text: '🧑‍🏫 教瓦舍琴师几手（音律高了才服众）', next: null,
                            require: { energy: 20 },
                            effects: {
                                cost: { energy: 20 },
                                roll: {
                                    prob: function () { return Math.min(0.95, 0.1 + qinLevel() * 0.008); },
                                    win: {
                                        stones: function () { return 5 + Math.floor(qinLevel() / 10); },
                                        rep: 2,
                                        lifeSkill: { name: '音律', exp: 2 },
                                        msg: '你拆开一段曲牌细细讲了指法，琴师们听得连连点头，凑了束脩相谢。教一遍，自己也捋顺了一遍。',
                                        msgType: 'success',
                                        time: 120
                                    },
                                    lose: {
                                        msg: '讲了没几句，琴师们面面相觑——火候不够，压不住场。有人客气地递茶：「先生先歇着。」',
                                        time: 60
                                    }
                                }
                            }
                        },
                        { text: '↩️ 回前场', next: 'stage_start' }
                    ]
                }
            }
        }]
    });
})();
