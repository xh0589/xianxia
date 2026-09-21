// ==================== sect-scenarios.js - 门派设施沉浸层（v20.86） ====================
// 病灶：门派里三十几座建筑，交互全是「点一下使用 → 一串数字弹出来」——建筑有，戏没有。
// 方子：接进城坊设施已在用的情境引擎（scenario-engine.js）。「使用」改走「进入」：
// 先入戏（场景随晨昏轮换、有人物有动静），再选择（例行走一遍 / 加码有成败 / 旁观也有小得），
// 结算经 eff.facility 钩子回到 useFacility 原管道——门禁、成本、份例、冷却一份账，剧本层不另立经济。
// 覆盖：基础 8 座里除掌门大殿（守卫反应链本身就是戏）外全部手写；门派专属 36 座中
// 血池/达摩洞/锻炉/百草园/消息网五处手写，其余按设施类型入模板戏（场名与旧闻织进正文）。
// 加载序：scenario-engine.js 与 sect-facilities.js 之后（注册时要读两份设施清单）。

(function () {
    'use strict';
    var SE = window.scenarioEngine;
    if (!SE || typeof SE.register !== 'function') return;

    // ============ 小工具 ============
    function realmProb(base, step) {
        return function () {
            var lv = (typeof window.getRealmTier === 'function')
                ? window.getRealmTier((window.currentCharData || {}).realm) : 1;
            return Math.max(0.25, Math.min(0.9, base + (Number(lv) || 1) * (step || 0.05)));
        };
    }
    function gameDay() {
        try {
            if (window.timeSystem && window.timeSystem.gameTime && typeof window.timeSystem.gameTime.currentDay === 'number')
                return window.timeSystem.gameTime.currentDay;
        } catch (e) {}
        return 1;
    }
    function hourNow() {
        try {
            if (window.timeSystem && window.timeSystem.gameTime && typeof window.timeSystem.gameTime.totalMinutes === 'number')
                return Math.floor((window.timeSystem.gameTime.totalMinutes % 1440) / 60);
        } catch (e) {}
        return 12;
    }
    function dayPart() {
        var h = hourNow();
        if (h < 5) return '深夜';
        if (h < 8) return '清晨';
        if (h < 11) return '上午';
        if (h < 14) return '正午';
        if (h < 17) return '午后';
        if (h < 19) return '傍晚';
        return '夜里';
    }
    function weatherLine() {
        var w = window.currentWeather;
        if (!w || !w.name) return '';
        if (w.name === '晴天') return '天晴，';
        if (w.name === '阴天') return '天色沉沉，';
        if (w.name === '雨天') return '檐外雨声不断，';
        if (w.name === '雷雨') return '远处闷雷一阵一阵，';
        if (w.name === '下雪') return '雪粒子打在窗纸上，';
        if (w.name === '大风') return '山风刮得窗棂嗡嗡响，';
        if (w.name === '雾天') return '雾气漫进来，';
        return '今日' + w.name + '，';
    }
    // 按天轮换文案——同一座设施，天天进门看到的不是同一句话
    function dv(arr) { return arr[gameDay() % arr.length]; }
    function masterName() {
        var ds = window.discipleState || {};
        return ds._masterName || '';
    }
    // 例行选项的统一结算：facility 钩子把 useFacility 原样走一遍
    function routine(fid, msg) {
        var eff = { facility: { id: fid } };
        if (msg) eff.msg = msg;
        return eff;
    }

    // ============ 基础八座（掌门大殿除外）：手写 ============

    // ---- 演武场 ----
    SE.register('sect_training_ground', {
        id: 'sect_training_ground', name: '演武场', icon: '⚔️',
        desc: '黄土夯平的老场子，木人桩的胳膊换过几茬',
        scenarios: [{
            id: 'tg_ground', name: '场子上', icon: '⚔️',
            desc: '例行操练、同门过招，或跟自己的身体较劲',
            startNode: 'tg_main',
            nodes: {
                tg_main: {
                    desc: function () {
                        return dv([
                            dayPart() + '的演武场，' + weatherLine() + '黄土被踩得瓷实，四角木人桩油亮发乌——不知多少代弟子的手磨出来的。场边有同门在走趟子，看见你来，点了个头。',
                            '你一进场就闻见那股土腥混着汗的味道。' + weatherLine() + '兵器架上的枪杆被人新缠了布，场心的木人桩缺了半条胳膊，还没人来修。',
                            dayPart() + '，演武场上人影不多。' + weatherLine() + '墙根下靠着一排石锁，最大那只据说开山祖师练过——没人搬得动，也没人敢搬走。'
                        ]);
                    },
                    choices: [
                        { text: '🥋 按部就班走一遍套路（例行动作）', hint: '真气-15 · 武艺+2 · 一个半时辰', next: null, effects: routine('sect_training_ground', '一趟套路走下来，汗把里衣浸透了。收势的时候，手上的劲还稳着。') },
                        { text: '🤼 找同门过招，见见真章', next: 'tg_spar' },
                        { text: '💪 加练石锁，练到脱力为止', next: null, effects: {
                            cost: { energy: 10 },
                            roll: { prob: realmProb(0.5, 0.05),
                                win: { exp: 12, contribution: 2, msg: '石锁举起放下一百次，最后几次胳膊抖得像筛糠——可你咬着牙没放。旁边监场的执事看见了，记了你一笔「勤」。', msgType: 'success' },
                                lose: { health: -6, exp: 5, msg: '第六十几下的时候手上脱了力，石锁砸在脚背上。疼得你龇牙咧嘴——练脱了力，也是练。' }
                            }
                        } },
                        { text: '👀 今日不练，看别人走招', next: 'tg_watch' }
                    ]
                },
                tg_spar: {
                    desc: function () {
                        var m = masterName();
                        return m
                            ? '你环顾一圈，' + m + '正站在场边看你。过招这种机会，平时求都求不来——但师父出手，向来不留情面。'
                            : '场边一位相熟的同门师兄把褂子一脱："来？正好手痒。"他比你早入门三年，拳路你熟，可他力气比你熟。';
                    },
                    choices: [
                        { text: '⚔️ 点到为止，走十几个回合', next: null, effects: {
                            time: 60,
                            roll: { prob: realmProb(0.55, 0.05),
                                win: { exp: 15, contribution: 3, msg: '十几个回合走下来，你抢了半招先。对面收势抱拳："长进不小。"围观的同门哄了一声——这半招，够你在膳堂被念叨三天。', msgType: 'success' },
                                lose: { qi: -12, exp: 8, msg: '第七个回合你就被拿住了手腕，输得干净。可对面那记拿法你记住了——挨一下，学一手，不亏。' }
                            }
                        } },
                        { text: '🔥 真刀真枪，全力以赴', next: null, effects: {
                            require: null,
                            time: 90,
                            roll: { prob: realmProb(0.4, 0.05),
                                win: { exp: 25, contribution: 6, msg: '这一场打得尘土飞扬。最后你一记扫腿把人放倒在场心，周围静了一瞬，然后叫好声炸开。执事当场记功——真本事，场子认。', msgType: 'success' },
                                lose: { health: -15, qi: -20, exp: 12, msg: '全力以赴的代价是肋下挨了一肘，半天眼前的东西都发花。但你撑满了九十回合没认输——抬你下场的时候，对面那位说了句："是个练武的料。"' }
                            }
                        } },
                        { text: '🙅 今日状态不好，改天再约', next: null, effects: { msg: '你摆摆手退了。同门也不勉强——场子天天开，机会天天有。' } }
                    ]
                },
                tg_watch: {
                    desc: '你靠着兵器架看了一阵。一个入门不久的小弟子在走拳，架子散，肘抬得太高，下盘发飘——这些错处，你当年一个不落全犯过。',
                    choices: [
                        { text: '💬 上去指点两句', next: null, effects: {
                            time: 20, exp: 5, contribution: 1,
                            msg: '你把他肘往下按了按，又踢了踢他的脚跟。小弟子挠头道谢——教人一遍，比自己练三遍记得牢。这些关窍，你从此忘不掉了。'
                        } },
                        { text: '🚶 看一会儿就走', next: null, effects: {
                            time: 15, exp: 3,
                            msg: '看人练拳也是练。别人的错处看在眼里，就是自己的镜子。'
                        } }
                    ]
                }
            }
        }]
    });

    // ---- 修炼洞府 ----
    SE.register('sect_cave', {
        id: 'sect_cave', name: '修炼洞府', icon: '🧘',
        desc: '一坐便是一个半时辰的静室',
        scenarios: [{
            id: 'cv_cave', name: '洞中坐', icon: '🧘',
            desc: '打坐调息、强冲周天，或只是静一静',
            startNode: 'cv_main',
            nodes: {
                cv_main: {
                    desc: function () {
                        return dv([
                            '洞府里比外头暗，也比外头静。蒲团被人坐出了窝，石壁上一层薄薄的潮气。' + weatherLine() + '洞口的光斜斜切进来，落在你膝前。',
                            '你掀开洞口的布帘，一股凉气扑面而来。蒲团还是上次离开时的样子，旁边石台上一盏油灯，灯芯结了花。' + weatherLine() + '这里听不见场子上的喊声，只听得见自己的呼吸。',
                            dayPart() + '入洞，四下无人。' + weatherLine() + '石壁深处偶尔传来一声极轻的嗡鸣——老弟子说，那是灵脉在石头里走动的声音，信不信由你。'
                        ]);
                    },
                    choices: [
                        { text: '🧘 例行打坐调息（例行动作）', hint: '一个时辰 · 真气+50', next: null, effects: routine('sect_cave', '一个时辰坐满，四肢百骸像被温水泡过。睁眼时，洞里的光换了一个角度。') },
                        { text: '🌀 强冲一个周天', next: 'cv_orbit' },
                        { text: '🌿 不练功，只是静一静', next: null, effects: {
                            time: 30, energy: 10,
                            msg: '你什么都没练，就坐着。听自己的呼吸从粗到细，听洞外的风声从紧到慢。起身的时候，肩上不知何时绷着的那根弦，松了。'
                        } }
                    ]
                },
                cv_orbit: {
                    desc: '强冲周天是拿真气撞关隘——撞开了，气血通畅一整天；撞不开，真气溃散还算轻的，重则伤及经脉。你盘膝坐定，把气息压到最细。',
                    choices: [
                        { text: '💨 引气冲关（成败在天）', next: null, effects: {
                            require: { qi: 30 },
                            time: 90,
                            roll: { prob: realmProb(0.45, 0.06),
                                win: { qi: 25, exp: 18, msg: '真气过尾闾、透夹脊、上玉枕——一线热流走通任督，浑身毛孔像同时张开呼吸。收功时你听见自己心跳，又慢又稳。', msgType: 'success' },
                                lose: { qi: -25, health: -8, msg: '真气在玉枕关前溃了，像一桶水泼在石头上。你闷哼一声扶住石壁，后背全是冷汗——今天到此为止，贪不得。' }
                            }
                        } },
                        { text: '🙅 气息未足，改日再冲', next: null, effects: { msg: '你松开手印。周天关隘天天都在，命只有一条——老辈的教诲，今天听一回。' } }
                    ]
                }
            }
        }]
    });

    // ---- 医馆 ----
    SE.register('sect_medical', {
        id: 'sect_medical', name: '医馆', icon: '💊',
        desc: '药香常年不散的三间瓦房',
        scenarios: [{
            id: 'md_clinic', name: '医馆一日', icon: '💊',
            desc: '看诊疗伤、帮工拣药，或讨教医理',
            startNode: 'md_main',
            nodes: {
                md_main: {
                    desc: function () {
                        return dv([
                            '医馆里药香浓得化不开。' + weatherLine() + '柜台后一排百子柜，每只抽屉上贴着小楷药名。医者正在给一个手臂缠布的弟子换药，见你进来，抬了抬下巴示意稍坐。',
                            '你掀帘进馆，正撞上一股苦香。院子里摊着竹匾晒药，几只麻雀落在匾沿上蹦。' + weatherLine() + '医者在里间碾药，碾槽咕噜咕噜地响，像这馆子的心跳。',
                            dayPart() + '的医馆人不多。' + weatherLine() + '墙上挂着一张人体经络图，边角卷了，被历代弟子的手摸得发亮——谁进馆都要盯着看两眼。'
                        ]);
                    },
                    choices: [
                        { text: '🩹 请医者看诊疗伤（例行动作）', hint: '诊金贡献-10', next: null, effects: routine('sect_medical', '医者三指搭脉，沉吟片刻，下针、敷药、缠布，手法快得看不清。"伤在筋骨不在皮肉，三天内别再动真气。"') },
                        { text: '🌿 去后院帮忙拣药晒药', next: null, effects: {
                            time: 45,
                            roll: { prob: 0.3,
                                win: { contribution: 5, exp: 4, items: [{ itemId: 'spirit_grass', count: 2 }], msg: '半日帮工，拣了三匾药。收尾时医者从药堆里挑出两株品相好的灵草塞给你："认得出药，比认得出路数难得。拿去。"', msgType: 'success' },
                                lose: { contribution: 4, msg: '半日帮工，晒了三匾药。医者管了一碗凉茶，账上记了你四个贡献点——手上磨出两个水泡，也是学艺的成本。' }
                            }
                        } },
                        { text: '📖 讨教一路药理', next: null, effects: {
                            time: 30, exp: 8,
                            msg: '你问的是金疮药里为何要加一味看似无用的草木灰。医者愣了一下，随即笑了："问对了一半——它止血是假的，压药性才是真的。"一席话，胜读十卷方书。'
                        } }
                    ]
                }
            }
        }]
    });

    // ---- 藏经阁 ----
    SE.register('sect_library', {
        id: 'sect_library', name: '藏经阁', icon: '📚',
        desc: '四层书阁，地位越高走得越高',
        scenarios: [{
            id: 'lb_day', name: '阁中一日', icon: '📚',
            desc: '例行翻阅、帮执事理书，或默记一段经文',
            startNode: 'lb_main',
            nodes: {
                lb_main: {
                    desc: function () {
                        return dv([
                            '藏经阁里静得能听见蠹虫啃纸。' + weatherLine() + '一排排书架高过头顶，梯凳靠在架边，被磨得溜光。管阁执事坐在门口小几后头登记，见你进来，笔尖点了点签到簿。',
                            '阁中光线从高窗落下来，浮尘在光柱里翻滚。' + weatherLine() + '你脚下的木地板在第三格会响一声——历代弟子都知道，只有执事不知道。',
                            dayPart() + '入阁，几个同门各自占了一隅，翻书声沙沙的，谁也不看谁。' + weatherLine() + '楼梯口的木牌写着今日可上的层数——你的腰牌，决定你能走多高。'
                        ]);
                    },
                    choices: [
                        { text: '📖 例行翻阅典籍（例行动作）', hint: '真气-30 · 领悟+10', next: null, effects: routine('sect_library', '你抽了一卷典籍临窗坐下。字是死的，读进去了就是活的——一个时辰后合卷，指节都坐僵了。') },
                        { text: '🧹 帮执事理书归架', next: null, effects: {
                            time: 60,
                            roll: { prob: 0.25,
                                win: { contribution: 6, exp: 10, msg: '理到第三架，一册书里滑出半页散页——是某位前辈夹在书里的读经笔记，字迹已淡。执事看了一眼就摆手："夹在书里的就是有缘人的。"那半页纸上的几句心得，够你琢磨一个月。', msgType: 'success' },
                                lose: { contribution: 5, msg: '整整一个时辰，三百多卷书各归其位。执事在簿子上给你记了五个贡献点，末了加一句："下回理书轻点，书比你的腰牌金贵。"' }
                            }
                        } },
                        { text: '✍️ 凭记忆默写一段经文', next: null, effects: {
                            cost: { qi: 10 },
                            time: 40, exp: 10,
                            msg: '不动笔墨不读书。你把前几日读过的一段经文默写下来，写到第三行就卡住了——卡住的地方，正是没读透的地方。这一趟，值。'
                        } }
                    ]
                }
            }
        }]
    });

    // ---- 兵器库 ----
    SE.register('sect_armory', {
        id: 'sect_armory', name: '兵器库', icon: '🗡️',
        desc: '军械配给制，一日一份例',
        scenarios: [{
            id: 'ar_raid', name: '库中领份例', icon: '🗡️',
            desc: '例行领配给、请库吏保养兵刃，或看看墙上的舆图',
            startNode: 'ar_main',
            nodes: {
                ar_main: {
                    desc: function () {
                        return dv([
                            '兵器库的门轴又长又沉，推开要费一把力气。' + weatherLine() + '库内枪戟成排，刀刃上都薄薄上了一层护油，气味冷冽。库吏坐在份例簿后头，头也不抬："领什么，报名字。"',
                            '一进库，铁腥气混着油味扑面而来。' + weatherLine() + '架上的兵刃按制式排开，每一件的柄上都烙着编号。库吏正在清点新一批箭簇，数得极慢，极准。',
                            dayPart() + '的兵器库没什么人。' + weatherLine() + '墙上钉着一张泛黄的舆图，标着历年兽潮来路——老弟子说，看懂这张图，比多领一份例有用。'
                        ]);
                    },
                    choices: [
                        { text: '📦 例行领取份例（例行动作）', hint: '一日一次', next: null, effects: routine('sect_armory', '库吏核了腰牌，在簿子上落笔，把份例推过柜台："点清，离柜不认。"') },
                        { text: '🛠️ 请库吏给兵刃做保养', next: null, effects: {
                            require: null,
                            cost: { copper: 50 },
                            time: 30,
                            roll: { prob: 0.6,
                                win: { exp: 8, msg: '库吏接过你的兵刃，看了一眼刃口："用得省。"上油、研磨、正柄，半个时辰后刀刃映得出人脸。他还顺手指点了你两处握柄的毛病——这五十个铜钱，花得比买药还值。', msgType: 'success' },
                                lose: { msg: '库吏把兵刃翻来覆去看了半晌，摇头："刃口崩过三次，淬的火也过了。保养做得，但别指望它跟新的一样。"五十个铜钱，换一个「凑合能用」。' }
                            }
                        } },
                        { text: '🗺️ 看看墙上的舆图', next: null, effects: {
                            time: 15, exp: 4,
                            msg: '舆图上的红标一年比一年多。你顺着兽潮来路看了一遍，心里对几处野外地图的凶险，多了几分底。'
                        } }
                    ]
                }
            }
        }]
    });

    // ---- 议事厅 ----
    SE.register('sect_chat', {
        id: 'sect_chat', name: '议事厅', icon: '🏛️',
        desc: '茶烟不断的闲坐处',
        scenarios: [{
            id: 'ch_tea', name: '厅上茶话', icon: '🍵',
            desc: '例行闲坐、听老人讲古，或把自己的疑问摆上桌',
            startNode: 'ch_main',
            nodes: {
                ch_main: {
                    desc: function () {
                        return dv([
                            '议事厅里茶烟袅袅。' + weatherLine() + '几张方桌拼着，坐了三五成同门，话头从山下粮价一路扯到某位长老的旧事。见你进来，有人往旁边挪了挪凳子。',
                            '厅上的大铜壶咕嘟咕嘟滚着。' + weatherLine() + '靠窗那桌在掰腕子，输的罚喝茶；里桌几个老弟子声音压得低，说的多半是门里的旧账。',
                            dayPart() + '，厅上人不多不少，正是话头最热的时候。' + weatherLine() + '墙边条案上摆着本月的门务抄录，路过的人都会扫两眼。'
                        ]);
                    },
                    choices: [
                        { text: '🍵 与同门闲坐（例行动作）', hint: '偶有见闻', next: null, effects: routine('sect_chat', '一壶茶喝淡，话头换了三轮。你听得七分，说三分——闲坐也是修行，消息就是这么攒下的。') },
                        { text: '👴 听老弟子讲一段江湖旧事', next: null, effects: {
                            time: 45, exp: 10,
                            roll: { prob: 0.3,
                                win: { contribution: 3, msg: '老弟子讲的是三十年前一场护镖的血战，讲到刀口卷刃，满厅没人出声。散场时管事的过来拍了拍你："陪老人家说话，也是门里的一份心。"记了你三个贡献点。', msgType: 'success' },
                                lose: { msg: '故事讲到一半被人拆了台——正主就坐在靠窗那桌。满厅哄笑，老弟子也不恼："让他自己讲，我讲的哪有他记得真。"你听了两个版本，赚了。' }
                            }
                        } },
                        { text: '🙋 把近来修行上的疑问摆上桌', next: null, effects: {
                            time: 30, exp: 12,
                            msg: '你把憋了几日的疑问说了。厅上静了一瞬，随即七八个人抢着出主意，路子五花八门——有三条是馊的，但有两条，让你当场坐直了身子。'
                        } }
                    ]
                }
            }
        }]
    });

    // ---- 膳堂 ----
    SE.register('sect_canteen', {
        id: 'sect_canteen', name: '膳堂', icon: '🍚',
        desc: '一日两膳，灶火不通宵',
        scenarios: [{
            id: 'ct_meal', name: '开饭时分', icon: '🍚',
            desc: '排队领膳、去灶下帮工，或与师兄拼桌',
            startNode: 'ct_main',
            nodes: {
                ct_main: {
                    desc: function () {
                        return dv([
                            '还没进门就闻见饭香。' + weatherLine() + '膳堂里长凳长桌擦得发亮，火头军站在大灶后头，手里的长柄勺敲着锅沿："排队排队，管够！"',
                            '膳堂的蒸笼摞了五层，白汽从缝里一股股冒出来。' + weatherLine() + '打饭的队伍排到门口，同门端着碗找座，凳子腿在地上刮出吱吱的响。',
                            dayPart() + '的膳堂最热闹。' + weatherLine() + '墙上贴着火头军手写的菜单，字迹龙飞凤舞，能认出来的字不超过一半。'
                        ]);
                    },
                    choices: [
                        { text: '🍚 排队领一份例膳（例行动作）', hint: '一日两膳', next: null, effects: routine('sect_canteen', '糙米饭管够，菜是当季的，汤面上浮着几星油花。你吃得干干净净——练武人的胃，不挑。') },
                        { text: '🔥 去灶下帮工', next: null, effects: {
                            time: 40, energy: -8,
                            roll: { prob: 0.35,
                                win: { contribution: 5, qi: 10, msg: '劈柴、看火、抬笼屉，一个时辰干得满头汗。火头军往你手里塞了一碗灶底焖的锅巴粥："会烧火的弟子，运气不会差。"账上也记了你一笔。', msgType: 'success' },
                                lose: { contribution: 4, msg: '一个时辰的灶下活，熏得你两眼流泪。火头军嘴上嫌弃"添乱的"，账上还是给你记了四个贡献点。' }
                            }
                        } },
                        { text: '💬 与师兄们拼桌闲话', next: null, effects: {
                            time: 30, exp: 5,
                            msg: '拼桌的师兄说起下月门里要办的比试，谁做种子谁轮空，说得有鼻子有眼。饭桌上的消息，八成是真的，两成是有用的——你今天运气不错，两成都赶上了。'
                        } }
                    ]
                }
            }
        }]
    });

    // ============ 门派专属：五处手写 ============

    // ---- 血手门 · 血池 ----
    SE.register('fx_xsm_xuechi', {
        id: 'fx_xsm_xuechi', name: '血池', icon: '🩸',
        desc: '一日一浸，贪多伤身',
        scenarios: [{
            id: 'xp_soak', name: '血池淬身', icon: '🩸',
            desc: '例行入池，或咬牙多浸一炷香',
            startNode: 'xp_main',
            nodes: {
                xp_main: {
                    desc: function () {
                        return dv([
                            '血池在石窟最深处，池面暗红，不反光。' + weatherLine() + '池边石沿被历代弟子的手抓出几道深痕——浸到最痛的时候，人都要抓点什么。守池的老弟子抬眼看你："今日第几浸？"',
                            '一进石窟，那股铁锈般的腥气就裹上来了。血池咕嘟咕嘟冒着小泡，像一锅永远烧不开的汤。' + weatherLine() + '池边的木架上搭着几条浸成暗色的粗布巾。'
                        ]);
                    },
                    choices: [
                        { text: '🩸 例行入池一浸（例行动作）', hint: '一日一次', next: null, effects: routine('fx_xsm_xuechi', '入池那一瞬像被千百根针同时扎进皮肉。你数着呼吸熬到气血翻上来，出池时浑身通红，脚步却比进来时稳。') },
                        { text: '⏳ 咬牙多浸一炷香', next: null, effects: {
                            time: 30,
                            roll: { prob: realmProb(0.4, 0.05),
                                win: { exp: 15, contribution: 5, msg: '香烧到一半，痛觉忽然退了——血气顺着毛孔往筋骨里钻。你多浸的这一炷香，顶平日三天。守池老弟子在簿子上记了一笔："又疯了一个。"语气里带着点赞许。', msgType: 'success' },
                                lose: { health: -15, qi: -10, msg: '多浸的香还没烧完，你就觉得血气开始往脑子里冲。是被两个同门架出池的——当晚你烧得说胡话，但筋骨里那股热劲，留下来了。' }
                            }
                        } },
                        { text: '👁️ 只在池边看看血色纹路', next: null, effects: {
                            time: 20, exp: 5,
                            msg: '池壁上的暗红纹路一层叠着一层，像树的年轮。你看了很久，忽然明白了本门功法里那句「血为气之母」是什么意思——书上的字，在这池子边上才活过来。'
                        } }
                    ]
                }
            }
        }]
    });

    // ---- 少林寺 · 达摩洞 ----
    SE.register('fx_sl_damo', {
        id: 'fx_sl_damo', name: '达摩洞', icon: '⛰️',
        desc: '面壁九年之地，蒲团犹带旧时体温',
        scenarios: [{
            id: 'dm_wall', name: '面壁', icon: '⛰️',
            desc: '例行参禅、学祖师面壁，或读洞壁刻痕',
            startNode: 'dm_main',
            nodes: {
                dm_main: {
                    desc: function () {
                        return dv([
                            '达摩洞里只有一线天光。' + weatherLine() + '蒲团旧得发白，洞壁上那块淡淡的影子轮廓，僧人们说是祖师面壁九年留下的——你每次进来，都会先看它一眼。',
                            '洞中无风，烛火笔直。' + weatherLine() + '石壁的凉气透过僧衣往上爬，木鱼声从山下寺院隐隐传上来，一声，又一声。'
                        ]);
                    },
                    choices: [
                        { text: '🧘 例行参禅（例行动作）', hint: '一个时辰 · 神识增益', next: null, effects: routine('fx_sl_damo', '一炷香坐成两个时辰。出洞时天光刺眼，你眯着眼站了一会儿——洞里的静，还留在耳朵里。') },
                        { text: '🕯️ 学祖师面壁，止念一坐', next: null, effects: {
                            require: { qi: 20 },
                            cost: { qi: 20, energy: 10 },
                            time: 120,
                            roll: { prob: realmProb(0.4, 0.06),
                                win: { exp: 22, msg: '前半个时辰，念头一个接一个。后半个时辰，念头断了。你不知道那是什么滋味，直到此刻——洞壁上那块影子，你忽然看进去了。', msgType: 'success' },
                                lose: { exp: 6, msg: '面壁两个时辰，杂念来了八百个：晌午吃什么、师兄弟的话头、山下的事……你败下阵来。可败得明白：知道心有多乱，也是进了一步。' }
                            }
                        } },
                        { text: '📜 读洞壁上的历代刻痕', next: null, effects: {
                            time: 30, exp: 8,
                            msg: '洞壁上刻满了历代僧人的名字和短句。最深的是一条："九年，非壁，乃心。"落款已经看不清了。你伸手把刻痕里的浮灰抠了出来。'
                        } }
                    ]
                }
            }
        }]
    });

    // ---- 铸剑山庄 · 锻炉 ----
    SE.register('fx_zj_dulu', {
        id: 'fx_zj_dulu', name: '锻炉', icon: '🔨',
        desc: '炉火今日封了——铁料要焖一夜才能开炉',
        scenarios: [{
            id: 'dl_forge', name: '炉边看火', icon: '🔨',
            desc: '例行领料、拉风箱帮工，或看师傅淬火',
            startNode: 'dl_main',
            nodes: {
                dl_main: {
                    desc: function () {
                        return dv([
                            '锻炉的火光照得半间屋子发红。' + weatherLine() + '铁砧上的锻件还泛着樱红色，师傅钳着它翻面，锤子起落，火星子溅到皮围裙上滋滋地灭。' ,
                            '一进锻房，热浪就推了你一把。' + weatherLine() + '墙上挂着的锤钳按大小排成一列，水槽里的淬火水冒着白汽。师傅头也不回："站远点，火星不长眼。"'
                        ]);
                    },
                    choices: [
                        { text: '🧰 例行领料研习（例行动作）', hint: '附带工匠指点', next: null, effects: routine('fx_zj_dulu', '师傅把料单丢给你，顺带骂了一句你上回打的坯子——骂归骂，两个诀窍还是塞进了话缝里。') },
                        { text: '💨 拉风箱帮工半个时辰', next: null, effects: {
                            time: 60, energy: -15, contribution: 6, exp: 5,
                            msg: '风箱一推一拉，炉火一明一暗。半个时辰下来你胳膊酸得抬不起来，师傅难得开口夸了半句："风给得匀。"——在他嘴里，这已经是满分。'
                        } },
                        { text: '🔥 看师傅淬一次火', next: null, effects: {
                            time: 30, exp: 8,
                            roll: { prob: 0.3,
                                win: { msg: '锻件入水那一瞬，白汽炸起来，师傅手腕只抖了一下。就是那一抖——你把它记进了眼睛里。哪天你自己开炉，这一下能救你一炉铁。', msgType: 'success' },
                                lose: { msg: '白汽散去，师傅把锻件从水里拎出来，对光看了看，扔进废料筐："火过了。"你只看出他扔了，没看出火是怎么过的——看来还得再看十炉。' }
                            }
                        } }
                    ]
                }
            }
        }]
    });

    // ---- 药王谷 · 百草园 ----
    SE.register('fx_yw_baicao', {
        id: 'fx_yw_baicao', name: '百草园', icon: '🌿',
        desc: '草木一日一熟，今日的药草已经采过了',
        scenarios: [{
            id: 'bc_garden', name: '园中侍草', icon: '🌿',
            desc: '例行采药、侍弄药圃，或认一遍新苗',
            startNode: 'bc_main',
            nodes: {
                bc_main: {
                    desc: function () {
                        return dv([
                            '百草园的畦垄顺着山势排开，' + weatherLine() + '叶尖上水珠未干。管园的老药师蹲在垄间，手里捏着一株苗对着光看，嘴里念念叨叨，像在跟草说话。',
                            '园子里的药香是分层的：门口一层辛，中段一层苦，最里头那畦是一股说不清的清甜。' + weatherLine() + '几只竹篓摆在田埂上，等着装今天的收成。'
                        ]);
                    },
                    choices: [
                        { text: '🌿 例行采药（例行动作）', hint: '一日一次', next: null, effects: routine('fx_yw_baicao', '老药师指了三株让你采，看你下手的角度，点了点头："没糟蹋东西。"药篓里的草还带着土腥气。') },
                        { text: '🌱 侍弄药圃：除草松土', next: null, effects: {
                            time: 45,
                            roll: { prob: 0.35,
                                win: { contribution: 6, items: [{ itemId: 'spirit_grass', count: 2 }], msg: '松土松到第三垄，锄头碰到一丛没登记的灵草——去年落籽，自己长起来的。老药师眼睛一亮："有缘的归你，账上记你六个贡献点。"', msgType: 'success' },
                                lose: { contribution: 5, msg: '半个时辰的草除下来，指甲缝里全是泥。老药师验收了一圈，哼了一声算满意，账上给你记了五个贡献点。' }
                            }
                        } },
                        { text: '👀 认一遍今春的新苗', next: null, effects: {
                            time: 30, exp: 7,
                            msg: '老药师考你：三片叶的是哪味，锯齿边的是哪味，闻着甜吃着苦的又是哪味。你答对了一半——答错的那一半，他掰开叶子让你闻了个透。'
                        } }
                    ]
                }
            }
        }]
    });

    // ---- 丐帮 · 消息网 ----
    SE.register('fx_gb_xiaoxi', {
        id: 'fx_gb_xiaoxi', name: '消息网', icon: '📰',
        desc: '讨饭网耳目，天下事入耳三分',
        scenarios: [{
            id: 'xx_wind', name: '听风', icon: '📰',
            desc: '例行听消息、替网里跑腿，或买一条准信',
            startNode: 'xx_main',
            nodes: {
                xx_main: {
                    desc: function () {
                        return dv([
                            '破庙后头的柴房里，几个叫花子围着一堆小火。' + weatherLine() + '见你进来，谁也没起身——网里的规矩，消息面前没尊卑。管事的把一根树枝丢进火里："坐，听还是换？"',
                            '消息网的接头处今日在城墙根的粥棚后头。' + weatherLine() + '几个衣衫褴褛的弟子分散坐着，看起来互不相识——可你看见他们的手在桌下比了两个手势。'
                        ]);
                    },
                    choices: [
                        { text: '👂 例行听一遍风闻（例行动作）', next: null, effects: routine('fx_gb_xiaoxi', '一条一条听下来，三分真、三分假、四分还没长齐。但你把其中两条记住了——叫花子们的耳朵，比官府的册子灵。') },
                        { text: '🏃 替网里跑一趟腿', next: null, effects: {
                            time: 60, energy: -10,
                            roll: { prob: 0.6,
                                win: { contribution: 6, copper: 40, exp: 5, msg: '一趟腿跑下来，捎的话送到了，捎的小包也送到了。管事的往你手里塞了四十个铜钱："网里不白用人。"账上也记了你一笔。', msgType: 'success' },
                                lose: { contribution: 4, msg: '腿跑断了，收信的人却挪了窝——白跑。管事的倒不怪你："跑腿这行，三成腿是白跑的。记你四个点，买个教训。"' }
                            }
                        } },
                        { text: '🪙 花钱买一条准信', next: null, effects: {
                            require: null,
                            cost: { copper: 60 },
                            time: 20, exp: 8,
                            msg: '六十个铜钱换一句话。管事的凑近了说，声不高，字字清楚。你听完在原地站了一会儿——这条信，值回票价，往后还用得上。'
                        } }
                    ]
                }
            }
        }]
    });

    // ============ 其余门派专属：按类型入模板戏 ============
    // 场名与旧闻织进正文：每座设施报名字、报旧desc，戏肉按训练/修行/医香/仓储/聚会五路走。
    var TYPE_PLAYS = {
        training: {
            title: '练场汗',
            descs: [
                function (f) { return dayPart() + '的' + f.name + '，' + weatherLine() + f.desc + '场边有人在看你，也有人在等你出错——练武的地方，眼睛比汗多。'; },
                function (f) { return '你走进' + f.name + '。' + weatherLine() + f.desc + '这里的规矩不用人教：来了就练，练完就走，没人跟你客气。'; }
            ],
            push: {
                label: '🔥 加练到真气见底',
                time: 60,
                win: { exp: 14, contribution: 3, msg: '最后一丝真气榨干的时候，你反而看清了一个平时看不清的动作。瘫坐在地的样子不好看，但值。', msgType: 'success' },
                lose: { health: -8, qi: -10, exp: 5, msg: '练过了头，收势时眼前一黑。同门把你扶到边上灌水："要命的练法，明天还来吗？"来。' }
            },
            watch: { label: '👀 观摩同门的招式', time: 20, exp: 5, msg: '看别人练，是给自己找镜子。今天这面镜子里，照出了你自己的两个毛病。' }
        },
        cultivation: {
            title: '静中功',
            descs: [
                function (f) { return f.name + '里比外头静了不止一层。' + weatherLine() + f.desc + '呼吸在这里会自己慢下来——此地养的就是这个。'; },
                function (f) { return '你到了' + f.name + '。' + weatherLine() + f.desc + '灵气在鼻尖若有若无，坐下去之前，先把杂念在门外抖落干净。'; }
            ],
            push: {
                label: '🌀 强行入定，贪一个时辰',
                time: 90,
                win: { qi: 20, exp: 14, msg: '贪来的这一个时辰竟然坐满了。出定时四肢发麻，丹田里却像存了一炉温火——今日赚的。', msgType: 'success' },
                lose: { qi: -12, msg: '坐到一半杂念反扑，气散了。强求的入定像强摘的瓜——不甜，还伤藤。' }
            },
            watch: { label: '🍃 在此地静坐养神', time: 30, energy: 8, msg: '没运功，没参悟，就是坐着。此地的清气不要钱，吸一口是一口。' }
        },
        medical: {
            title: '药香里',
            descs: [
                function (f) { return f.name + '里的药味分好几层，' + weatherLine() + f.desc + '药碾子在案上滚出细细的声响，闻久了，人就安稳。'; },
                function (f) { return '掀帘进' + f.name + '，' + weatherLine() + f.desc + '架上瓶瓶罐罐按高矮排队，标签上的字是几代人的手笔。'; }
            ],
            push: {
                label: '🌿 多侍弄一轮药料',
                time: 45,
                win: { contribution: 5, exp: 6, msg: '多出来的这一轮活干完，管事的验了验成色，难得点头："手上有数。"账上添了一笔。', msgType: 'success' },
                lose: { contribution: 3, msg: '多干一轮，手上慢了，成色差了些。管事的没骂人，只说了句"下回趁亮干"——账上照记，少记点。' }
            },
            watch: { label: '📖 翻翻架上的医书', time: 30, exp: 7, msg: '医书翻了三页，记住一方。治不了大病，但下山行走，能救急。' }
        },
        storage: {
            title: '库房事',
            descs: [
                function (f) { return f.name + '的门不好推，' + weatherLine() + f.desc + '里头的物事一件一件都有主，拿什么、拿多少，簿子上都等着落笔。'; },
                function (f) { return '你到' + f.name + '点卯。' + weatherLine() + f.desc + '管事的拿指头敲着簿子："份例之内，随你挑；份例之外，门都没有。"'; }
            ],
            push: {
                label: '📦 多扛半日杂活',
                time: 60,
                win: { contribution: 6, copper: 30, msg: '扛包、清点、归架，半日下来汗湿两回。管事的从柜上数了三十个铜钱给你："库房不留人情，留工钱。"', msgType: 'success' },
                lose: { contribution: 4, msg: '半日杂活干完，肩膀上磨出一条红印。工钱没多给，账上记了四个贡献点——力气换的东西，都写在簿子上。' }
            },
            watch: { label: '🔍 认一认库里的物产', time: 20, exp: 5, msg: '库里的东西认全了，往后领料、辨货、讨价，心里都有底。' }
        },
        social: {
            title: '座上客',
            descs: [
                function (f) { return f.name + '今日有人。' + weatherLine() + f.desc + '话头正热，你进门的时候，几双眼睛抬起来又落下去——坐下，就是自己人。'; },
                function (f) { return '你到了' + f.name + '。' + weatherLine() + f.desc + '这里的座次不讲职位，讲来得早晚——你来得不算晚。'; }
            ],
            push: {
                label: '💬 把话头引到自己身上',
                time: 40,
                win: { exp: 10, contribution: 3, msg: '你讲了一段下山的见闻，满座听得入神。散场时有人专门过来拱手："下回讲，提前说一声。"——在这地方被人记住，比贡献点值钱。', msgType: 'success' },
                lose: { exp: 5, msg: '话头引到自己身上，讲了没三句就被人接过去改了道。不算丢人——听的人记住了你的脸，这就够了。' }
            },
            watch: { label: '🍵 安静听旁人说话', time: 20, exp: 4, msg: '不说话的人听得最全。今天这一场，你记下了三个名字和一件事。' }
        }
    };

    function registerFromTemplate(f) {
        var play = TYPE_PLAYS[f.type] || TYPE_PLAYS.social;
        var scenId = f.id.replace(/[^a-z0-9]/g, '') + '_play';
        var nodeMain = f.id.replace(/[^a-z0-9]/g, '') + '_main';
        SE.register(f.id, {
            id: f.id, name: f.name, icon: f.icon || '🏛️',
            desc: f.desc || '',
            scenarios: [{
                id: scenId, name: play.title, icon: f.icon || '📌',
                desc: '例行走一遍，或在此地多留一刻',
                startNode: nodeMain,
                nodes: (function () {
                    var nodes = {};
                    nodes[nodeMain] = {
                        desc: function () {
                            return dv(play.descs.map(function (fn) { return fn(f); }));
                        },
                        choices: [
                            { text: '✅ 例行走一遍（例行动作）', next: null, effects: routine(f.id) },
                            { text: play.push.label, next: null, effects: {
                                time: play.push.time,
                                roll: { prob: realmProb(0.45, 0.05), win: play.push.win, lose: play.push.lose }
                            } },
                            { text: play.watch.label, next: null, effects: {
                                time: play.watch.time, exp: play.watch.exp,
                                msg: play.watch.msg
                            } }
                        ]
                    };
                    return nodes;
                })()
            }]
        });
    }

    var HANDWRITTEN = {
        fx_xsm_xuechi: 1, fx_sl_damo: 1, fx_zj_dulu: 1, fx_yw_baicao: 1, fx_gb_xiaoxi: 1
    };
    var extras = window.SECT_FACILITY_EXTRAS || {};
    Object.keys(extras).forEach(function (sect) {
        (extras[sect] || []).forEach(function (f) {
            if (!f || !f.id || HANDWRITTEN[f.id]) return;
            if (SE.facilities[f.id]) return;
            registerFromTemplate(f);
        });
    });

    window.SECT_SCENARIO_IDS = Object.keys(SE.facilities).filter(function (k) {
        return k.indexOf('sect_') === 0 || k.indexOf('fx_') === 0;
    });
    console.log('[门派设施沉浸层] 剧本注册完毕：手写 ' + (7 + Object.keys(HANDWRITTEN).length) + ' 座 + 模板覆盖其余专属设施');
})();
