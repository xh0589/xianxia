// ==================== facility-offices.js — 三司做厚（v21.4） ====================
// 税课司/司法堂/户籍司此前是"一点就完"的空壳：烧真气→一句日志→历练+5，没有选择没有分支。
// 本文件把三司注册进情境引擎：原有的实事（查账读真源/缉查委托/流寓录）全部保留为选项之一，
// 各加两条有成本、有成败、有对价的公务——向消防司（当差/救火/闲聊）的厚度看齐。
// 路由：useBuilding 的情景设施分支先于 officialOffices 命中；app.js 的 openTaxBureau/
// openCourt/openHouseholdRegistry 改为委托到情境引擎（地图侧 executeFacilityAction 同一入口）。
(function () {
    'use strict';
    if (!window.scenarioEngine || typeof window.scenarioEngine.register !== 'function') return;

    function log() { return window.gameLog || { add: function () {} }; }
    function cityName() {
        try {
            if (typeof window.getCurrentCityName === 'function') return window.getCurrentCityName() || '';
        } catch (e) {}
        return (window.currentCharData && window.currentCharData.location) || '';
    }
    function absDay() {
        try { return (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') ? window.timeSystem.getAbsoluteDay() : 0; }
        catch (e) { return 0; }
    }
    function seedOf(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
    function sk(name) {
        try { return (typeof window.getLifeSkill === 'function') ? (window.getLifeSkill(name) || 0) : 0; }
        catch (e) { return 0; }
    }
    function skillProb(skillName, base) { return function () { return Math.min(0.9, base + sk(skillName) * 0.008); }; }

    // ============ 税课司：账册如实读本城真源（v20.18 口径原样保留为选项一） ============
    function cityTaxIntel() {
        var city = cityName();
        var cityInfo = city && window.locationSystem && window.locationSystem.getCityData ? window.locationSystem.getCityData(city) : null;
        if (!cityInfo) return '账册上只有数目，没有故事。';
        var pm = (cityInfo.priceModifier && cityInfo.priceModifier.buy) || 1;
        var diff = Math.round((pm - 1) * 100);
        var intel = diff === 0 ? '账上看来，本城行价与通衢持平' : '账上看来，本城行价比通衢' + (diff > 0 ? '贵' + diff + '%' : '贱' + (-diff) + '%');
        if (cityInfo.specialties && cityInfo.specialties.length) intel += '，课税大宗：' + cityInfo.specialties.slice(0, 3).join('、');
        return intel + '。';
    }
    window.scenarioEngine.register('tax_bureau', {
        id: 'tax_bureau', name: '税课司', icon: '🧮',
        desc: '核商税、查账册——税银是国家血脉，账缝里全是人间',
        scenarios: [{
            id: 'duty', name: '税课司公务', icon: '🧮',
            desc: '查账、协征、查偷漏，三块公务牌任你领',
            startNode: 'tax_start',
            nodes: {
                tax_start: {
                    desc: function () {
                        return '税课司里算盘声不断，书吏头也不抬："帮忙都有工食钱，账都登簿——要做什么，自己挂牌。"\n\n墙上三块公务牌：查账、协征、缉漏。';
                    },
                    choices: [
                        { text: '📒 查账提灯（真气10，账册如实读本城行情）', require: { qi: 10 }, effects: { cost: { qi: 10 }, time: 10, exp: 5, msg: function () { return '你耗了10点真气提灯，在税课司核了半个时辰的账。' + cityTaxIntel() + '历练+5。'; } } },
                        { text: '🚶 随书吏下乡协征（精力20）', require: { energy: 20 }, effects: { cost: { energy: 20 }, time: 60, roll: {
                            prob: 0.6,
                            win: { copper: 300, exp: 5, rep: 2, msg: '一天跑下来，欠户的税银收齐了九成——书吏把工食钱300铜拍给你："比老手利索。"历练+5，本城声望+2。', msgType: 'success' },
                            lose: { copper: 100, exp: 3, msg: '两家躲债的翻墙跑了，你追了半座庄子只收上来零星几笔。工食钱照给100铜："头一回，不寒碜。"历练+3。' }
                        } } },
                        { text: '🕵️ 缉查市面偷漏（真气15，得罪人）', require: { qi: 15 }, effects: { cost: { qi: 15 }, time: 50, roll: {
                            prob: skillProb('学识', 0.4),
                            win: { spiritStones: 50, exp: 8, rep: 3, karma: 1, msg: '你顺着账缝摸出一家绸缎庄的双账本——官府依律追缴，赏你50灵石。掌柜看你的眼神像看刀。历练+8，本城声望+3，因果+1。', msgType: 'success' },
                            lose: { noto: 1, exp: 3, msg: '你查得太显眼，半条街的铺子连夜对账。偷漏没抓着，商户先记了你一笔——恶名+1。历练+3：知道水有多深，也是收获。', msgType: 'warning' }
                        } } }
                    ]
                }
            }
        }]
    });

    // ============ 司法堂：今日堂审按城+日定死（同一天同一城，案子是同一件，不靠掷骰说谎） ============
    function courtCaseToday() {
        var cases = [
            { brief: '今日审理的是一桩灵兽伤人案，苦主要猎户赔药钱，猎户说是灵兽先闯的陷阱。', help: '你随班头查了兽径与陷阱的位置，理清了先后——堂上判得双方都服。' },
            { brief: '今日是一桩丹方归属纠纷，师徒二人各执一词，都说方子是自己悟的。', help: '你把两人各自的炼丹手记调来对笔迹对火候，公堂之上摆证据，师徒都哑了口。' },
            { brief: '今日审的是一桩灵田界址案，两家地主为三尺田埂打了三年。', help: '你随班头下田丈了三遍，从老地契里翻出原界——三尺田埂，断得清清楚楚。' },
            { brief: '今日并无重大案件，堂上只理了些户婚田土的琐碎文书。', help: '你帮主簿理了半日文书，琐碎里见真章：一城的日子，都在这堆纸上。' }
        ];
        return cases[seedOf(cityName() + '_court_' + absDay()) % cases.length];
    }
    window.scenarioEngine.register('court', {
        id: 'court', name: '司法堂', icon: '⚖️',
        desc: '堂上听讼、承接缉查——王法之外，还得有人讲理',
        scenarios: [{
            id: 'duty', name: '司法堂公务', icon: '⚖️',
            desc: '旁听、缉查、调解，堂上堂下都是事',
            startNode: 'court_start',
            nodes: {
                court_start: {
                    desc: function () {
                        return '司法堂今日开堂——' + courtCaseToday().brief + '\n\n堂外包干立着一块「缉查委托」的木牌，隔壁偏厅还有两户人家等着调解。';
                    },
                    choices: [
                        { text: '⚖️ 旁听今日堂审（精力5）', require: { energy: 5 }, effects: { cost: { energy: 5 }, time: 30, exp: 2, msg: function () { return '你在堂下站了半个时辰。' + courtCaseToday().brief + ' 见一次世情，长一分见识。历练+2。'; } } },
                        { text: '📜 承接缉查委托（真气15）', require: { qi: 15 }, effects: { cost: { qi: 15 }, time: 60, roll: {
                            prob: 0.6,
                            win: { exp: 8, rep: 2, copper: 200, msg: '你领签押随班头缉查至深夜，赃物起获、苦主登门道谢，官府另给200铜跑腿钱。历练+8，本城声望+2。', msgType: 'success' },
                            lose: { exp: 4, msg: '你查到后半夜，线索断在一处空宅里。班头拍拍你："断线也是线，记档，明天接着查。"历练+4。' }
                        } } },
                        { text: '🤝 帮调解户婚纠纷（吃口才）', require: { energy: 15 }, effects: { cost: { energy: 15 }, time: 40, roll: {
                            prob: skillProb('口才', 0.4),
                            win: { karma: 2, rep: 2, exp: 3, msg: '两家为儿女婚约的聘礼吵了两个月，你一人一句来回递话，末了两家各让一步，当堂握手。主簿捋须："比判还难的事，你办成了。"因果+2，本城声望+2，历练+3。', msgType: 'success' },
                            lose: { exp: 2, msg: '你劝了半个时辰，两家反倒把你当成了对方的说客，各呛你一句。主簿笑着打圆场："好心，慢慢来。"历练+2。' }
                        } } }
                    ]
                }
            }
        }]
    });

    // ============ 户籍司：流寓录保留为选项一，另加协查与代写 ============
    window.scenarioEngine.register('household_registry', {
        id: 'household_registry', name: '户籍司', icon: '📋',
        desc: '一城户口都在册上——册子翻得勤，妖邪藏不住',
        scenarios: [{
            id: 'duty', name: '户籍司公务', icon: '📋',
            desc: '翻档、协查、代写，书吏的活也分三六九等',
            startNode: 'reg_start',
            nodes: {
                reg_start: {
                    desc: function () {
                        return '户籍司的卷宗架从地面顶到屋梁，书吏抱着一摞册子穿梭其间："茶钱自理，卷宗自看——要帮忙的话，工食钱也有。"';
                    },
                    choices: [
                        { text: '📖 翻阅《流寓录》（真气10）', require: { qi: 10 }, effects: { cost: { qi: 10 }, time: 10, exp: 5, msg: '你耗了10点真气的茶钱，书吏翻出一册《流寓录》——城中户口流移、谁家近年添丁减口都写得明白。你逐页记诵，历练+5。' } },
                        { text: '🔍 协查未登记的浮修（精力20）', require: { energy: 20 }, effects: { cost: { energy: 20 }, time: 60, roll: {
                            prob: 0.55,
                            win: { exp: 7, rep: 2, spiritStones: 30, msg: '册籍与人对不上——城西客栈住着个"行商"，进城四个月没落过户。书吏带差役去请人时，对方行李里搜出了别案的通缉画影。赏钱30灵石。历练+7，本城声望+2。', msgType: 'success' },
                            lose: { exp: 3, msg: '你对了半天册子，人册相符，一个可疑的都没有。书吏反倒高兴："没查出事，就是最好的查出事。"历练+3。' }
                        } } },
                        { text: '✍️ 替新落户人家代写户状（精力15）', require: { energy: 15 }, effects: { cost: { energy: 15 }, time: 40, copper: 250, karma: 1, exp: 3, msg: '三户逃荒来的人家不会写字，你替他们写了户状。书吏收册，人家往你手里塞了250铜墨钱——推了两次，没推掉。因果+1，历练+3。', msgType: 'success' } }
                    ]
                }
            }
        }]
    });

    console.log('[facility-offices] v21.4 三司公务剧本已注册（税课司/司法堂/户籍司）');
})();
