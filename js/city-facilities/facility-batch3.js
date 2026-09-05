// ==================== facility-batch3.js - 第三批次：给单剧本设施各添一出新戏 ====================
// v20.19：11 家原本只有一出戏的设施，各补第二出——每出都有真代价（精力/真气/本金/名声业障），
// 卖价随本城物价系数现算，赔率随本城声望浮动。依赖：scenario-engine.js + facility-batch2.js。

// —— 现算 helpers（结算一刻才取值，不写死）——
function facilityScenarioCity() {
    if (typeof window.getCurrentCityName === 'function') {
        var c = window.getCurrentCityName();
        if (c) return c;
    }
    if (window.locationSystem && typeof window.locationSystem.getCurrentLocation === 'function') {
        return window.locationSystem.getCurrentLocation() || '';
    }
    return (window.currentCharData && window.currentCharData.location) || '';
}

// 本城收购价系数：同一件拓片，长安收得贱、边城收得贵，结算一刻现问行情
function facilitySellMod() {
    var city = facilityScenarioCity();
    var ls = window.locationSystem;
    try {
        if (ls && typeof ls.getCityPriceModifier === 'function') {
            var m = Number(ls.getCityPriceModifier(city, 'sell'));
            if (isFinite(m) && m > 0) return m;
        }
        if (ls && typeof ls.getCityData === 'function') {
            var d = ls.getCityData(city);
            var pm = d && d.priceModifier && Number(d.priceModifier.sell);
            if (isFinite(pm) && pm > 0) return pm;
        }
    } catch (e) { /* 行情问不到就按平价 */ }
    return 1;
}

function facilityRepNow() {
    var city = facilityScenarioCity();
    if (city && typeof window.getReputationValue === 'function') {
        var v = Number(window.getReputationValue(city));
        if (isFinite(v)) return v;
    }
    return 0;
}

// 赔率随本城声望浮动：名声越响，掌眼的、买消息的越信你
function facilityRepOdds(base, perRep, cap) {
    return Math.max(0.05, Math.min(cap, base + facilityRepNow() * perRep));
}

// 往已注册设施上追加第二出戏（未注册的跳过，不炸页面）
function facilityAugment(facilityId, scenario) {
    var f = window.scenarioEngine && window.scenarioEngine.facilities && window.scenarioEngine.facilities[facilityId];
    if (!f || !f.scenarios) return false;
    f.scenarios.push(scenario);
    return true;
}

// 1. 契约所——赌灵雨（押注要有本金，输了欠条上门）
facilityAugment('contract_hall', {
    id: 'contract_bet', name: '赌一场灵雨', icon: '🌧️',
    desc: '与雨户对赌下月灵雨，押注要有本金',
    startNode: 'cb_start',
    nodes: {
        cb_start: {
            desc: '契约所侧厅，几个雨户围着赌桌：“下月城中若落灵雨，田价必涨。客官押‘有’还是押‘无’？押金50灵石，输了当场画押销账。”',
            choices: [
                { text: '🎲 押50灵石：下月有灵雨', next: null, require: { stones: 50 }, effects: {
                    cost: { stones: 50 }, time: 15, roll: {
                        prob: function () { return facilityRepOdds(0.5, 0.0015, 0.7); },
                        win: { stones: 120, exp: 10, msg: '半月后灵雨如约而至，田价应声而涨。雨户照契赔付，你净赚70灵石。', msgType: 'success' },
                        lose: { karma: -2, noto: 1, msg: '天偏不落雨。押金当场划走，赌桌上的人记下了你这个名字。', msgType: 'warning' }
                    } } },
                { text: '👋 听听就走', next: null, effects: { time: 5 } }
            ]
        }
    }
});

// 2. 镖局——顺风捎货（腿脚钱，路上有数）
facilityAugment('escort_office', {
    id: 'escort_hitch', name: '顺风捎货', icon: '📦',
    desc: '搭邻县镖车捎一件小货，脚钱不多，路上看命',
    startNode: 'eh_start',
    nodes: {
        eh_start: {
            desc: '镖局后院，邻县的分镖正要出发。管事指着一只小匣：“搭这趟车去金城，脚钱50灵石——路上太平就全拿，撞了事主只结一半。”',
            choices: [
                { text: '🚶 搭上，随车走一遭', next: null, require: { energy: 20 }, effects: {
                    cost: { energy: 20 }, time: 50, roll: {
                        prob: function () {
                            var lv = (typeof window.getRealmTier === 'function') ? window.getRealmTier((window.currentCharData || {}).realm) : 1;
                            return Math.max(0.5, Math.min(0.85, 0.55 + lv * 0.05));
                        },
                        win: { stones: 50, exp: 10, msg: '一路无话，小匣原样交割。脚钱50灵石落袋。', msgType: 'success' },
                        lose: { qi: -15, exp: 5, msg: '山道上惊了马，你跳车护匣挂了彩。事主只结了半程脚钱，剩下的算赔货损。', msgType: 'warning' }
                    } } },
                { text: '👋 这趟不搭', next: null }
            ]
        }
    }
});

// 3. 善堂——帮厨（力气换功德，稳当）
facilityAugment('charity_hall', {
    id: 'charity_kitchen', name: '入厨帮工', icon: '🥣',
    desc: '给难民施粥灶上帮一日工，出力不出钱',
    startNode: 'ck_start',
    nodes: {
        ck_start: {
            desc: '施粥灶前排着长队，掌勺的师傅嗓子都喊哑了：“壮士，来搭把手？劈柴挑水掌勺，干一日管斋饭——功德簿上记你一笔。”',
            choices: [
                { text: '🥣 挽袖帮工一日', next: null, require: { energy: 25 }, effects: {
                    cost: { energy: 25 }, time: 50, rep: 3, karma: 2, exp: 10,
                    msg: '你在灶前忙了一整日，粥桶见了底。功德簿上记名，伙房师傅塞给你两个热馒头。', msgType: 'success' } },
                { text: '👋 今日不得闲', next: null }
            ]
        }
    }
});

// 4. 斗法台——外卡挑战（彩头大，也真会挨打）
facilityAugment('arena_stage', {
    id: 'arena_wildcard', name: '外卡踢馆', icon: '🥊',
    desc: '挑战连胜擂主，彩头120灵石，输了抬下去',
    startNode: 'aw_start',
    nodes: {
        aw_start: {
            desc: '擂主是个使重锤的壮汉，已经连胜五场。台下彩头涨到120灵石——专等一个敢挂外卡上台的。',
            choices: [
                { text: '⚔️ 挂外卡，上台！', next: null, require: { qi: 40 }, effects: {
                    cost: { qi: 30 }, time: 20, roll: {
                        prob: function () {
                            var lv = (typeof window.getRealmTier === 'function') ? window.getRealmTier((window.currentCharData || {}).realm) : 1;
                            return Math.max(0.25, Math.min(0.7, 0.3 + lv * 0.07));
                        },
                        win: { stones: 120, fame: 2, exp: 25, msg: '你绕开重锤的空当，一招点在他腕上！台下炸了锅，120灵石彩头入袋，说书人当晚就有了新段子。', msgType: 'success' },
                        lose: { health: -20, qi: -15, exp: 10, msg: '锤风扫中肩头，你从台边被人拖了下来。疼是真疼，看人拆招的见识也是真长了。', msgType: 'warning' }
                    } } },
                { text: '👀 先看看他锤的路数', next: null, effects: { exp: 5, time: 10, msg: '你看了三场，看出这汉子的锤讲究“旧力未尽新力未生”。', msgType: 'info' } },
                { text: '👋 不打', next: null }
            ]
        }
    }
});

// 5. 观星台——替乡邻测雨（测准了有谢仪）
facilityAugment('observatory', {
    id: 'observatory_rain', name: '替乡邻测雨', icon: '🌦️',
    desc: '乡邻凑灵石请你登台测一场雨的来不来',
    startNode: 'or_start',
    nodes: {
        or_start: {
            desc: '城郊农人凑了一包灵石：“先生能观星，定能知雨。测准了这些谢仪都归您；测不准……权当我们买了个心安。”',
            choices: [
                { text: '🔭 凝神推演雨信', next: null, require: { qi: 10 }, effects: {
                    cost: { qi: 10 }, time: 25, roll: {
                        prob: 0.6,
                        win: { stones: 20, exp: 20, msg: '你断言“三日后有雨”，三日后雨落田沟。农人敲锣打鼓把谢仪送来。', msgType: 'success' },
                        lose: { exp: 8, msg: '你断言无雨，偏落了一场西北雨。农人嘟囔着还是把谢仪留下了一半——看你在台上冻了一宿。', msgType: 'warning' }
                    } } },
                { text: '👋 雨信不敢断', next: null }
            ]
        }
    }
});

// 6. 碑林——拓碑带货（拓得好是行情，拓砸了是废纸）
facilityAugment('stele_forest', {
    id: 'stele_rubbing', name: '拓碑带货', icon: '🪨',
    desc: '拓一份剑碑精拓去卖，成色看手上功夫，行情看本城收购价',
    startNode: 'sr_start',
    nodes: {
        sr_start: {
            desc: '碑林口有行商收精拓：“先贤剑碑的拓片，字口清楚的就值钱。你去拓一份？纸墨镖局备，手是你的。”',
            choices: [
                { text: '🪨 扑上去拓一份精拓', next: null, require: { energy: 30 }, effects: {
                    cost: { energy: 30 }, time: 40, roll: {
                        prob: 0.5,
                        win: { exp: 10, msg: '字口根根见骨。行商凑近一看，按本城行情当场点价，现钱交割。', msgType: 'success',
                            stones: function () { return Math.round(80 * facilitySellMod()); } },
                        lose: { exp: 12, msg: '纸上字糊成一片墨饼。行商摆手不要——不过碑上手上的手感，是真练出来了。', msgType: 'warning' }
                    } } },
                { text: '👋 手上没这个细功夫', next: null }
            ]
        }
    }
});

// 7. 异闻馆——代买消息（消息有价，真假看馆主信不信你）
facilityAugment('oddity_museum', {
    id: 'museum_errand', name: '代买消息', icon: '🕵️',
    desc: '出25灵石经馆中路子买一条准信，本城名声越响路子越灵',
    startNode: 'me_start',
    nodes: {
        me_start: {
            desc: '馆主压低声：“消息铺子的行价，一条准信25灵石。买着什么是什么——你在这城里的名声，就是我们的招牌。”',
            choices: [
                { text: '🕵️ 拍25灵石，买一条', next: null, require: { stones: 25 }, effects: {
                    cost: { stones: 25 }, time: 15, roll: {
                        prob: function () { return facilityRepOdds(0.35, 0.004, 0.7); },
                        win: { rep: 2, msg: '是一条实信：邻县药商明日押现款入城。你赶在货满前把消息转卖给药行，按行情抬了价。', msgType: 'success',
                            stones: function () { return Math.round(70 * facilitySellMod()); } },
                        lose: { exp: 15, msg: '消息是二手的，街面人尽皆知。25灵石喂了狗——但你顺带把城里几股势力的底细摸了个轮廓。', msgType: 'warning' }
                    } } },
                { text: '👋 不信这个邪', next: null }
            ]
        }
    }
});

// 8. 当铺——掌眼帮闲（掌柜盯着你替他掌一回眼）
facilityAugment('pawn_shop', {
    id: 'pawn_appraise', name: '帮当铺掌眼', icon: '🔍',
    desc: '掌柜拿不准一件来路货，请你掌眼作证，看走眼要赔名头',
    startNode: 'pa_start',
    nodes: {
        pa_start: {
            desc: '掌柜捏着一柄锈剑直皱眉：“说是前朝法器，我看着像做旧的新活。你替我掌一回眼——看准了谢仪按行情给，看走眼了这名声……”',
            choices: [
                { text: '🔍 凝神掌眼', next: null, require: { qi: 10 }, effects: {
                    cost: { qi: 10 }, time: 20, roll: {
                        prob: function () { return facilityRepOdds(0.4, 0.003, 0.8); },
                        win: { exp: 10, msg: '剑格内侧露了新锉痕——新活。掌柜冷汗下来，按行情封了谢仪：“这条街就信你的手。”', msgType: 'success',
                            stones: function () { return Math.round(40 * facilitySellMod()); } },
                        lose: { exp: 6, msg: '你断是真货，掌柜收了当天就被失主堵门认了出来。好在没亏钱，可店里再有人掌眼，只叫你的名字反着念。', msgType: 'warning' }
                    } } },
                { text: '👋 看不准，不敢揽', next: null }
            ]
        }
    }
});

// 9. 拍卖行——拍密封匣（盲盒，赌的是行价与胆）
facilityAugment('auction_house', {
    id: 'auction_snipe', name: '拍密封匣', icon: '📦',
    desc: '流件盲拍，40灵石一匣，开出什么看运，出手看行情',
    startNode: 'as_start',
    nodes: {
        as_start: {
            desc: '拍卖会散场，伙计抬出一摞密封匣：“流件盲拍，一匣40灵石。开出法宝你祖坟冒烟，开出碎瓷你当买个响。”',
            choices: [
                { text: '📦 拍一匣开开', next: null, require: { stones: 40 }, effects: {
                    cost: { stones: 40 }, time: 20, roll: {
                        prob: function () { return facilityRepOdds(0.3, 0.003, 0.65); },
                        // v20.53 盲匣开出来的是货，不是钱——匣里是实物，要变现还得走回购/拍卖那道折价。
                        // 旧版直接按行情折成灵石到账，等于四十灵石赌一百八，不耗任何真气精力，连点就是印钞。
                        win: { msg: '匣中竟有一株完整的灵芝，还裹着半匹前朝的素绢。伙计咂舌：“这匣子原是哪家药堂的存底。”',
                            msgType: 'success',
                            items: [{ itemId: 'mat_lingzhi', count: 1 }] },
                        lose: { exp: 12, msg: '半匣碎瓷，外加一撮前朝铜钱——铜钱不值钱，但够你辨出这堆流件的年份路数。', msgType: 'warning' }
                    } } },
                { text: '👋 不当这个冤大头', next: null }
            ]
        }
    }
});

// 10. 黑市——代销赃物（替暗巷货头销一件小赃，来钱快代价也真）
facilityAugment('black_market', {
    id: 'black_fence', name: '代销一手', icon: '🌒',
    desc: '货头借你的脸销一件来路不明的细软',
    startNode: 'bf_start',
    nodes: {
        bf_start: {
            desc: '暗巷货头把一件玉佩塞过来：“生面孔才好出手。销出去三七分你七；巡夜的若是盯上——话可都说是你一个人的。”',
            choices: [
                { text: '🌒 接了，去销', next: null, effects: {
                    time: 30, roll: {
                        prob: 0.7,
                        win: { karma: -4, noto: 2, fence: { op: 'deal', min: -1 }, msg: '玉佩在当街当行出手，买主没多问。分赃点清，按本城行情折算成灵石——货头满意，暗巷里记你一笔能做成买卖的脸。', msgType: 'warning',
                            stones: function () { return Math.round(90 * facilitySellMod()); } },
                        lose: { qi: -20, karma: -4, noto: 5, fence: { op: 'trust', delta: -1 }, msg: '巡夜的从巷口包抄过来，你翻了两道墙甩掉人，袖囊被抓裂。玉佩没销成，黑市里却传开了：“那姓×的，官府盯着，带累。”——办砸的买卖，信用簿上也记一笔。', msgType: 'warning' }
                    } } },
                { text: '🚫 这种钱不赚', next: null }
            ]
        }
    }
});

// 11. 园林别苑——花帖入雅集（名望是买来的，也有买砸的时候）
facilityAugment('garden_villa', {
    id: 'villa_poetry', name: '纳帖入会', icon: '🏮',
    desc: '出40灵石纳一张入会帖，席间攀得上谁看本事',
    startNode: 'vp_start',
    nodes: {
        vp_start: {
            desc: '门房递上价目：“本季雅集纳帖40灵石——座有尽时，名编进《同游录》可没穷期。攀上名流是你的造化，冷板凳也是。”',
            choices: [
                { text: '🏮 纳帖入席', next: null, require: { stones: 40 }, effects: {
                    cost: { stones: 40 }, time: 40, roll: {
                        prob: 0.4,
                        win: { rep: 5, fame: 1, exp: 20, msg: '你在曲水流觞间接了一句典，满座回头。《同游录》头一页添了你的名号。', msgType: 'success' },
                        lose: { rep: 2, exp: 8, msg: '你在末座坐了一整场，没攀上话。散席时主家照例向《同游录》补了客名——名声薄了一线，也是名声。', msgType: 'info' }
                    } } },
                { text: '👋 这帖子不纳', next: null }
            ]
        }
    }
});

console.log('[第三批设施] 11家单剧本设施各添第二出戏（报价随行情现算，赔率随本城声望浮动）');
