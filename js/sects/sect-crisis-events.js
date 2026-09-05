// ==================== sect-crisis-events.js - v20.49 门派大事·因果事件池 ====================
// 每桩事件自带 causality——先看账，再看事。没有因，这条事件就不存在于候选池：
//   强盛不出贼（strength.total 高则盗匪族权重趋零）；无仇不上门（外交账里没有仇家，寻仇不出）；
//   士气高不出内讧（morale 低才出长老离心）；没有香火命门不出大典（profile.livelihood）；
//   不是雨季不出山洪、不是风暴季不出海难（season）；山体没塌不出古迹（scars.ground_loose）；
//   近期没有死伤不出邪祟（scars.death）；库存空不出囤积压价（resources）。
// scars 闭环：办砸的事留下祸根，祸根成为下一桩事的因——
//   得罪匪→bandit_grudge；结怨→vendetta；山体松动→ground_loose→古迹出世；
//   有伤亡→death→邪祟夜惊；寒了人心→elder_grudge→再出内乱。
//
// 抉择约定：cost 只收 stones/qi/energy（统一结算）；check 为 0-100 需求值（不足即失败）；
//   success/fail.apply(sectName, ctx) 返回结算文案，奖励经 window.SectCrisis._applyGains 落账。
(function () {
    'use strict';

    // ---------- 池内小工具 ----------
    function _life(c) { return (c.profile && c.profile.livelihood) || []; }
    function _fears(c) { return (c.profile && c.profile.fears) || []; }
    function _hit(list, kws) {
        return (list || []).some(function (x) {
            return kws.some(function (k) { return (x || '').indexOf(k) >= 0; });
        });
    }
    function _gains(sectName, gains) {
        try { return (window.SectCrisis && window.SectCrisis._applyGains) ? window.SectCrisis._applyGains(sectName, gains) : ''; }
        catch (e) { return ''; }
    }
    // 外交账落笔：动了关系要存档，否则刷新即忘
    function _diplo(sectName, other, dRel, dConf) {
        if (!other) return;
        var diplo = window.SECT_DIPLOMACY_STATE || {};
        var cell = diplo[sectName] && diplo[sectName][other];
        if (!cell) return;
        cell.relation = Math.max(-100, Math.min(100, (Number(cell.relation) || 0) + (dRel || 0)));
        cell.conflicts = (Number(cell.conflicts) || 0) + (dConf || 0);
        cell.lastEvent = (window.getAbsoluteDay ? window.getAbsoluteDay() : 0);
        try { localStorage.setItem('xianxia_sect_diplomacy', JSON.stringify(window.SECT_DIPLOMACY_STATE)); } catch (e) {}
    }
    // 同地界的邻门（矿脉穿界/山道相争找对方用）
    function _neighbors(sectName) {
        var sects = window.sectsData || {};
        var mine = sects[sectName] || {};
        return Object.keys(sects).filter(function (n) {
            return n !== sectName && sects[n].location === mine.location;
        });
    }
    function _pickNeighbor(sectName) {
        var ns = _neighbors(sectName);
        return ns.length ? ns[Math.floor(Math.random() * ns.length)] : '';
    }
    function _sign(v) { return v > 0 ? '+' : ''; }

    var EVENTS = {

        // ==================== 外敌族 ====================
        'bandit_scout': {
            family: 'bandit', icon: '🕯️',
            // 因果：门派不够硬（档位+影响力+人手合计偏低）、库里有油水、不是大雪封山的日子——贼才值得来。
            causality: function (c) {
                if (c.season === 'winter') return { ok: false };
                var total = c.strength.total;
                if (total >= 78) return { ok: false };   // 强盛的门派，贼不敢惦记
                var fat = (c.internal.resources || 0) >= 90 ? 0.5 : 0;
                var thin = (c.strength.disciples || 0) < 16 ? 0.4 : 0;
                return { ok: true, weight: Math.max(0.15, (80 - total) / 22) + fat + thin,
                    reason: '山门防务空虚，库里有粮——这样的门，贼惦记得起。' };
            },
            omen: { name: '生面孔踩点', prepareNeed: 2,
                text: '三日里来了三拨「香客」，逢人只问库房几时上锁、当值弟子几人换岗，临走必朝后山望一眼。守门的师弟心细，把三拨人的鞋底都记下了——是同一伙人。',
                prepare: { options: [
                    { label: '增派巡哨，暗桩布到山腰', cost: { stones: 30 }, strength: 1, reply: '巡哨翻了倍，暗桩插到山腰三处——山门外的动静，如今瞒不过门里。' },
                    { label: '请护院武师坐镇山门', cost: { stones: 80 }, strength: 2, reply: '护院武师往山门一坐，气门就立住了。' },
                    { label: '换锁钥、改暗号、封虚库', cost: { stones: 15 }, strength: 1, reply: '库房换了锁钥，明面上那间库改成了空库。' }
                ] } },
            crisis: { name: '夜探库房',
                text: '三更梆子才过，山门石阶上果然摸上来几条黑影，分两路直扑库房与丹房——动手了。' ,
                choices: [
                { label: '不动声色，瓮中捉鳖', check: 62,
                  success: { apply: function (s) {
                      var msg = _gains(s, { contribution: 60, morale: 6, cityRep: 3 });
                      return '梆子一响，四下火把齐明。贼人丢下挠钩翻墙就跑，暗桩按住了两个——供出是「过山风」一伙，近来专挑防务松的山门下手。' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var msg = _gains(s, { resources: -40, morale: -9 });
                      return '收网收晚了半刻——贼人抢了库房一角扬长而去，追到山口只捡回半袋粮。' + (msg ? '（' + msg + '）' : ''); } } },
                { label: '虚张声势，吓退了事',
                  success: { apply: function (s) {
                      var msg = _gains(s, { resources: -6, morale: 2 });
                      return '后山火把连成一片，梆子敲得像开了战。贼人不知虚实，退了——但临走朝山门啐了一口，记下了这门的胆气。' + (msg ? '（' + msg + '）' : ''); } } },
                { label: '托牙人递话，破财免灾', cost: { stones: 100 },
                  success: { apply: function (s) {
                      var msg = _gains(s, { morale: -4 });
                      return '「茶钱」递到，山门果然清净了。只是这份钱，往后怕是每季都得递。' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var msg = _gains(s, { morale: -6 });
                      return '钱收了，事没办——牙人捎回话：那伙人不认这个码。' + (msg ? '（' + msg + '）' : ''); } } }
            ]
            },
            aftermath: { name: '匪帮窥伺', text: '那伙人没走远，仍在山道两端晃，商旅香客接连被劫。', days: 4,
                clear: { cost: { stones: 60 }, apply: function (s) { _gains(s, { cityRep: 2 }); return '雇来的镖师沿山道巡了三日，贼人没了动静，商旅重新敢走这条路了。'; } } },
            scar: 'bandit_grudge'
        },

        'bandit_road': {
            family: 'bandit', icon: '🛤️',
            // 因果：命门靠路吃饭（护商/镖路/海贸/沙商），路才有得劫；冬天雪封路，匪也歇。
            causality: function (c) {
                if (c.season === 'winter') return { ok: false };
                if (!_hit(_life(c), ['护商', '镖路', '海贸', '沙商', '军械', '驼队'])) return { ok: false };
                var grudge = (c.scars.bandit_grudge || 0) * 1.5;
                return { ok: true, weight: 1 + grudge,
                    reason: '本门的营生在路上一半，路一乱，饭碗就悬。' };
            },
            omen: { name: '路匪试刀', prepareNeed: 2,
                text: '沿线村子接连来报：夜里粮车被劫，货全数抬走，人被捆在树上没伤——对方放话「只借粮，不伤人」。这是在试本门的刀。',
                prepare: { options: [
                    { label: '改暗镖为明镖，多雇人手', cost: { stones: 70 }, strength: 2, reply: '明镖上路，旗号打足——路匪最忌这种讲排场的走法。' },
                    { label: '约沿线村社结哨联防', cost: { stones: 40 }, strength: 1, reply: '村社应了，夜里山道两头的犬吠都密了。' },
                    { label: '雇熟路的老镖头押一趟', cost: { stones: 90 }, strength: 2, reply: '老镖头接了单，只说了一句：「走夜路，要带香。」' }
                ] } },
            crisis: { name: '货道被截',
                text: '这日押车的师弟回来了——货在山道被截，人被捆在树上，嘴里塞着字条：「三日后，再来借粮。」' ,
                choices: [
                { label: '点齐人手，扫一趟山道', check: 60,
                  success: { apply: function (s) {
                      var msg = _gains(s, { morale: 8, resources: 30, cityRep: 2 });
                      return '山道扫了三日，匪窝端在鹰嘴崖，货追回大半。沿路村子放起了鞭炮，说这门里的刀没白扛。' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var msg = _gains(s, { resources: -25, morale: -8 });
                      return '扫荡扑了空，回程反中一支冷箭——伤了三个师兄弟，匪首还托人捎了句「再见」。' + (msg ? '（' + msg + '）' : ''); } } },
                { label: '改道绕行，破财保人',
                  success: { apply: function (s) {
                      var msg = _gains(s, { resources: -20 });
                      return '货绕了三日远路，人齐货全，只是脚钱翻倍。掌门盯着账本半天没说话。' + (msg ? '（' + msg + '）' : ''); } } },
                { label: '请同行镖路联保', cost: { stones: 120 }, check: 72,
                  success: { apply: function (s) {
                      var msg = _gains(s, { morale: 4, cityRep: 2 });
                      return '几家同行凑钱请了老镖头坐镇，匪见这阵仗，散了。路，重新是大家的路。' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var msg = _gains(s, { morale: -4 });
                      return '同行推的说辞一个比一个体面，钱花了，镖还是自己的镖。' + (msg ? '（' + msg + '）' : ''); } } }
            ]
            },
            aftermath: { name: '商路风声', text: '货主们交头接耳：这条路上，到底还安不安全？', days: 3,
                clear: { cost: { stones: 45 }, apply: function (s) { return '门里贴出告示：三桩大货如约送到，分毫未损。风声渐渐平了。'; } } }
        },

        'vendetta_call': {
            family: 'vendetta', icon: '🗡️',
            // 因果：外交账里真有仇家（relation<=-40 或有冲突记录）——没有这笔账，寻仇这桩事根本不存在。
            causality: function (c) {
                var foe = c.diplo.foe;
                if (!foe) return { ok: false };
                return { ok: true, weight: 1 + (foe.conflicts || 0) * 0.3 + Math.min(1.5, (-40 - foe.relation) / 30),
                    reason: '与「' + foe.name + '」的旧账没翻篇，他们一直记着。' };
            },
            omen: { name: '眼线摸底', prepareNeed: 2,
                text: '山下镇上的眼线来报：几拨生面孔在打听本门弟子的作息，问得极细——几时换岗、走哪条道、谁最年轻。这不是游山玩水的问法。',
                prepare: { options: [
                    { label: '清查门户，收拢外派人手', cost: { stones: 40 }, strength: 2, reply: '外门的弟子全数召回，门户三日一查。' },
                    { label: '托中间人先递话', cost: { stones: 60 }, strength: 1, reply: '中间人接了帖子，说「容我先探探口风」。' },
                    { label: '请城中名宿坐镇压场', cost: { stones: 110 }, strength: 2, reply: '名宿的车驾停在山门外，牌子亮得晃眼。' }
                ] } },
            crisis: { name: '仇家登门',
                text: '山门外来了七八个不速之客，为首的自报名号——正是与本门有旧怨的那一家。他们把拜帖拍在石阶上，只要「讨个说法」，限三日回话。' ,
                choices: [
                { label: '摆开阵仗，正面接下', check: 55,
                  success: { apply: function (s) {
                      var msg = _gains(s, { contribution: 50, morale: 6 });
                      return '演武场上三阵，本门赢了两个。对方领头的讨了个没趣，撂下一句「后会有期」走了——这一仗，打出了底气。' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var foe = (window.SectCrisis && window.SectCrisis.diplomacyOf(s).foe);
                      _diplo(s, foe && foe.name, -8, 1);
                      var msg = _gains(s, { resources: -30, morale: -10 });
                      return '交手吃了亏，还当众折了一位长老的面子。这笔账，又往深里记了一层。' + (msg ? '（' + msg + '）' : ''); } } },
                { label: '闭门不战，重金请人调停', cost: { stones: 150 },
                  success: { apply: function (s) {
                      var msg = _gains(s, { morale: -3 });
                      return '你请动了一位双方都敬着的前辈出面。对方收了台阶，但这口气，他们记下了。' + (msg ? '（' + msg + '）' : ''); } } },
                { label: '先下手为强，夜探其外舵', check: 45,
                  success: { apply: function (s) {
                      var foe = (window.SectCrisis && window.SectCrisis.diplomacyOf(s).foe);
                      _diplo(s, foe && foe.name, -5, 2);
                      var msg = _gains(s, { contribution: 40, morale: 8 });
                      return '当夜摸了对方一处外舵，拿住了他们私运禁物的把柄。他们反而不敢再闹了——把柄在门里攥着。' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var foe = (window.SectCrisis && window.SectCrisis.diplomacyOf(s).foe);
                      _diplo(s, foe && foe.name, -15, 2);
                      var msg = _gains(s, { resources: -30, morale: -10 });
                      return '夜袭扑空，反被人家设了套。人手折损，还倒赔了理——对方放话要「登门奉还」。' + (msg ? '（' + msg + '）' : ''); } } }
            ]
            },
            aftermath: { name: '仇隙加深', text: '对方的人还在江湖上放话，说这门里的账没完。', days: 4,
                clear: { cost: { stones: 80 }, apply: function (s) { return '你托人给对方掌门送了一份「赔情礼」。对方收了，没说话——但江湖上没再听见新的狠话。'; } } },
            scar: 'vendetta'
        },

        'vendetta_old': {
            family: 'vendetta', icon: '⚔️',
            // 因果：上回结的梁子还挂着档——没有旧怨（scars），这桩事无从谈起。
            causality: function (c) {
                var old = (c.scars.vendetta || 0) + (c.scars.bandit_grudge || 0);
                if (!old) return { ok: false };
                return { ok: true, weight: 1 + old * 0.9, reason: '前几桩事结下的梁子，在外头发了酵。' };
            },
            omen: { name: '弟子被堵', prepareNeed: 2,
                text: '门里弟子接连遭人堵在山道上「切磋」，下手一次比一次黑。第三回，外门一个孩子被按着磕了头。',
                prepare: { options: [
                    { label: '弟子结伴出行，改走大道', cost: { stones: 20 }, strength: 1, reply: '弟子出门必三人同行，大道亮堂，人多眼杂。' },
                    { label: '暗访堵路之人来路', cost: { stones: 45 }, strength: 2, reply: '查出来了——是替人办事的散修，拿的是旧账的赏格。' },
                    { label: '上报掌门，请门中长辈出面', cost: { stones: 10 }, strength: 2, reply: '长辈听了，脸色沉下来：「这口气，门里替你们出。」' }
                ] } },
            crisis: { name: '战书压门',
                text: '对方把战书下到了山门：约期比武，三阵两胜——输了，就把上回的账一并认了。帖子上按的手印，红得刺眼。' ,
                choices: [
                { label: '应战，点精锐出阵', check: 55, cost: { energy: 30 },
                  success: { apply: function (s) {
                      var msg = _gains(s, { contribution: 55, morale: 9, cityRep: 2 });
                      return '三阵两胜，最后一阵赢得干净——对方当众折了战书。旧账，到此为止；新脸面，从此立起来。' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var msg = _gains(s, { morale: -12, resources: -20 });
                      return '输了。对方当众撕了战书，说「账清了」——可满山弟子看着，这笔账，记在了门派的脸上。' + (msg ? '（' + msg + '）' : ''); } } },
                { label: '认账赔礼，息事宁人', cost: { stones: 120 },
                  success: { apply: function (s) {
                      var msg = _gains(s, { morale: -6 });
                      return '礼送到，账面上是清了。只是接礼那人临走那一笑，让满院子师兄弟半宿没睡好。' + (msg ? '（' + msg + '）' : ''); } } },
                { label: '拖字诀——不理', check: 40,
                  success: { apply: function (s) {
                      var msg = _gains(s, { morale: -3 });
                      return '帖子收进抽屉，山门照开。对方等了十日，自讨没趣地散了——但「怯战」两个字，也随他们带走了。' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var foe = (window.SectCrisis && window.SectCrisis.diplomacyOf(s).foe);
                      _diplo(s, foe && foe.name, -10, 1);
                      var msg = _gains(s, { resources: -25, morale: -8 });
                      return '对方见帖子没回音，直接把香炉掀在了山门外。这已经不是讨说法，是打脸。' + (msg ? '（' + msg + '）' : ''); } } }
            ]
            },
            aftermath: { name: '江湖风评', text: '茶楼里说书的，把这门里的事编进了新段子。', days: 3,
                clear: { cost: { stones: 50 }, apply: function (s) { _gains(s, { cityRep: 2 }); return '门里几位弟子在城里连破了三桩悬案，说书的换了词。'; } } }
        },

        'office_raid': {
            family: 'office', icon: '📜',
            // 因果：命门里写着怕官府（fears）、营生见不得光（私盐/暗业/蛊毒/杀伐）——官差才查得上门。
            causality: function (c) {
                if (!_hit(_fears(c), ['官府', '盐卡', '缉拿', '剿抚'])) return { ok: false };
                if (!_hit(_life(c), ['私盐', '暗业', '蛊毒', '杀伐', '刀兵', '赏格', '蝎毒'])) return { ok: false };
                return { ok: true, weight: 1.2, reason: '本门的营生，官府从来没放下过心。' };
            },
            omen: { name: '差役过境', prepareNeed: 2,
                text: '县衙的差役两日里三次过境，还「借」走了两份往来的货单。收单子的老书吏临走时，朝本门山门多看了一眼。',
                prepare: { options: [
                    { label: '账目连夜过秤，该平的平', cost: { stones: 60 }, strength: 2, reply: '账房一夜没睡。天亮时，账上的每一笔都「对得上」。' },
                    { label: '托乡绅在县里递话', cost: { stones: 90 }, strength: 1, reply: '乡绅应了，捎回一句：「县尊今年要考绩，不想多事。」' },
                    { label: '敏感货暂运出山，空柜待人', cost: { stones: 35 }, strength: 1, reply: '后半夜十几辆车出了后山，柜子里剩下的，都是干净的。' }
                ] } },
            crisis: { name: '官差进门',
                text: '三名官差上门，出示海捕文书与商贾状纸，称本门「私贩禁物」，要入山搜查——山门外的官道上，已经有人在布岗了。' ,
                choices: [
                { label: '好生接待，任凭查检', check: 60,
                  success: { apply: function (s) {
                      var msg = _gains(s, { morale: -2, cityRep: 2 });
                      return '官差查了一整日，柜柜皆空，账笔笔清。带头的差官合上册子，说了句「是本门的规矩坏了名声」——话里有话，但这一关过了。' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var msg = _gains(s, { resources: -45, morale: -8 });
                      return '西跨院搜出了三箱没来得及转走的货。人带走两个，货单抄走一摞——县衙的门槛，往后要多走几趟了。' + (msg ? '（' + msg + '）' : ''); } } },
                { label: '走上头的门路', cost: { stones: 150 }, check: 70,
                  success: { apply: function (s) {
                      var msg = _gains(s, { morale: 3 });
                      return '府城的帖子比县衙的文书快到了半日。差官接了手令，客客气气地退了——只留下「下不为例」四个字。' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var msg = _gains(s, { morale: -5 });
                      return '银子花了，人没递上话——那位大人「外放了」。钱打水漂，差官照查。' + (msg ? '（' + msg + '）' : ''); } } },
                { label: '把账做平，硬顶回去', check: 38,
                  success: { apply: function (s) {
                      var msg = _gains(s, { morale: 5 });
                      return '山门一闭，名帖不出。官差在门外晒了半日，悻悻而去——这一场，是胆气赢的。' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var msg = _gains(s, { resources: -60, morale: -12, cityRep: -3 });
                      return '顶撞差官的把柄被记进了公文。货被封了一窑，门派的名字上了县衙的黑册。' + (msg ? '（' + msg + '）' : ''); } } }
            ]
            },
            aftermath: { name: '案底在册', text: '县衙的卷宗里多了本门一笔，往来商旅都谨慎了几分。', days: 5,
                clear: { cost: { stones: 110 }, apply: function (s) { return '你托乡绅在县里结了这桩案子——卷宗合上那天，差役过境不再朝山门看了。'; } } }
        },

        'office_medal': {
            family: 'office', icon: '🏅',
            // 因果：影响力足够高（江湖名望传进了官府耳朵里）+ 正道门第——才有请勋这回事。
            causality: function (c) {
                var sect = (window.sectsData || {})[c.sectName] || {};
                if (sect.type !== '正道') return { ok: false };
                if ((c.internal.influence || 0) < 60) return { ok: false };
                return { ok: true, weight: (c.internal.influence - 58) / 18,
                    reason: '门中近年行事有名望，话已经传进了官府的耳朵。' };
            },
            omen: { name: '县衙来帖', prepareNeed: 1,
                text: '县衙送来大红请帖：秋狝在即，官府欲请本门派人「助围护场」，酬以嘉奖与题匾——去不去，掌门还没表态。',
                prepare: { options: [
                    { label: '先查官府近来用兵何处', cost: { stones: 25 }, strength: 1, reply: '查明白了：秋狝是照例的围场，无险。' },
                    { label: '点选随行弟子，先演三日', cost: { stones: 45 }, strength: 2, reply: '被点中的弟子操演了三日，队形齐整了不少。' }
                ] } },
            crisis: { name: '官差请托',
                text: '差官再度登门，话挑明了：围场近期有匪患风声，官府要的不是一个虚名，是真刀真枪的护场——「这差事接了是脸面，办砸了，也是本门的脸面。」' ,
                choices: [
                { label: '接差，选精锐护场', check: 65, cost: { energy: 25 },
                  success: { apply: function (s) {
                      var msg = _gains(s, { contribution: 45, morale: 7, cityRep: 6, influence: 3 });
                      return '秋狝三日，围场无一处失惊。临了县尊亲送题匾上山——「威镇林泉」。这块匾，够山门亮三年。' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var msg = _gains(s, { morale: -8, cityRep: -4, resources: -15 });
                      return '围场还是出了事——匪徒趁夜劫了猎苑，官府的告示上，本门的名字写得清清楚楚。' + (msg ? '（' + msg + '）' : ''); } } },
                { label: '婉辞，称门中无人', check: 55,
                  success: { apply: function (s) {
                      var msg = _gains(s, { morale: -2 });
                      return '辞帖写得客气，官府也没强求。只是那句「门中无人」，在县衙里传成了闲话。' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var msg = _gains(s, { cityRep: -3, morale: -3 });
                      return '辞得太急，落了个「恃技傲上」的评语——这四个字，比匪患传得还快。' + (msg ? '（' + msg + '）' : ''); } } }
            ]
            },
            aftermath: { name: '官面交情', text: '县衙的卷宗里，本门这一页写得体面。', days: 3, onSuccess: false }
        },

        'evil_haunt': {
            family: 'evil', icon: '🕯️',
            // 因果：近期门中有伤亡（scars.death），或命门本就怕邪祟、且人心不稳（morale 低）——正气衰，邪气才生。
            causality: function (c) {
                var death = c.scars.death || 0;
                var eerie = _hit(_fears(c), ['邪祟', '反噬']);
                if (!death && !(eerie && (c.internal.morale || 50) < 60)) return { ok: false };
                return { ok: true, weight: 1 + death * 0.8,
                    reason: death ? '近来门中有伤亡，山里的夜风都不太平。' : '门中人心浮而不安，夜里的动静就多了。' };
            },
            omen: { name: '夜闻哭声', prepareNeed: 2,
                text: '值夜的弟子接连说听见后山乱葬岗有人哭，提灯去寻，又什么都没有。第四夜，巡夜的两人在坡下坐了半宿，不敢再上去。',
                prepare: { options: [
                    { label: '请门中长老设坛安抚', cost: { stones: 70 }, strength: 2, reply: '坛设了一夜，钟磬声传到后山——哭声，停了。' },
                    { label: '给阵亡者立碑烧衣', cost: { stones: 45 }, strength: 2, reply: '坟头添了土，碑上刻了名。烧衣的火光里，弟子们磕了头。' },
                    { label: '加派结伴巡夜', cost: { stones: 15 }, strength: 1, reply: '巡夜改三人一队，火把从不离手。' }
                ] } },
            crisis: { name: '后山灯灭',
                text: '三更，后山长明灯齐灭。一名弟子连滚带爬跑回来，说看见「上个月阵亡的师兄」站在坟头朝他招手——满院子的人都在等一个说法。' ,
                choices: [
                { label: '请长老亲往镇邪', check: 70,
                  success: { apply: function (s) {
                      var msg = _gains(s, { morale: 7, contribution: 35 });
                      return '长老在后山坐到天亮，回来只说了四个字：「心安，邪退。」坟头的灯，重新点上了。' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var msg = _gains(s, { morale: -10 });
                      return '长老下山时脚步发虚，没说话。第二天，又多了两个告假的弟子。' + (msg ? '（' + msg + '）' : ''); } } },
                { label: '弟子结阵夜守', cost: { energy: 40 }, check: 55,
                  success: { apply: function (s) {
                      var msg = _gains(s, { morale: 4, contribution: 25 });
                      return '五十名弟子在后山守到鸡鸣，什么也没等到。但守夜的人，从此不怕走夜路了。' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var msg = _gains(s, { morale: -8 });
                      return '守到后半夜，阵脚先乱了——不知谁喊了一嗓子，五十人跑得只剩灯笼在地上滚。' + (msg ? '（' + msg + '）' : ''); } } },
                { label: '重金请道门高人来勘', cost: { stones: 100 }, check: 80,
                  success: { apply: function (s) {
                      var msg = _gains(s, { morale: 8, cityRep: 2 });
                      return '请来的道长在后山走了一圈，指出三处「地气相冲」，一一布了符镇。临走收了钱，留下一句：「此地无邪，只有心结。」' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var msg = _gains(s, { morale: -6 });
                      return '道长勘了半日，说「此山邪气缠门，非一日可解」——钱收了，符画了，人心更慌了。' + (msg ? '（' + msg + '）' : ''); } } }
            ]
            },
            aftermath: { name: '人心未定', text: '入夜之后，后山方向没人再愿意单独去。', days: 3, onFailOnly: true,
                clear: { cost: { stones: 55 }, apply: function (s) { _gains(s, { morale: 3 }); return '你在后山办了一场小小的祭礼，全员都去了。回来的路上，有说有笑。'; } } },
            scar: 'death'
        },

        // ==================== 内乱族 ====================
        'elder_leave': {
            family: 'elder', icon: '🕯️',
            // 因果：士气不振（morale 低）——门派兴旺时，长老请辞这桩事无从说起。
            causality: function (c) {
                var morale = c.internal.morale || 50;
                if (morale >= 48) return { ok: false };
                return { ok: true, weight: (50 - morale) / 10 + (c.scars.elder_grudge || 0) * 0.8,
                    reason: '门中士气不振，人心浮动——最资深的那位，最近话越来越少。' };
            },
            omen: { name: '长老告病', prepareNeed: 2,
                text: '那位长老连着几日称病，晨课不点卯，连他名下的亲传弟子也跟着告假。堂口的钥匙，他贴身收着。',
                prepare: { options: [
                    { label: '掌门亲往探病', cost: { stones: 30 }, strength: 2, reply: '掌门提着一坛老酒去了，坐了一个时辰。回来只说了句：「再看看。」' },
                    { label: '门中事务多问他的意思', cost: { stones: 15 }, strength: 1, reply: '这几日议事的条陈，都先送到他案头。' },
                    { label: '让他的亲传弟子掌一件实事', cost: { stones: 40 }, strength: 1, reply: '他门下的大弟子接了内库的点验——老头听说了，没吭声。' }
                ] } },
            crisis: { name: '请辞信至',
                text: '请辞信还是递上来了。信写得客气：「老朽倦了，想去云游。门里的事，管不动了。」——他名下的堂口、产业、十几名弟子，都系在这一封信上。' ,
                choices: [
                { label: '登门长谈，以诚留人', check: 62,
                  success: { apply: function (s) {
                      var msg = _gains(s, { morale: 10, contribution: 30 });
                      return '你在他房里坐到掌灯。最后他把请辞信折成方胜，投进了火盆——「看在你的面子上，再看三年。」' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var msg = _gains(s, { morale: -6 });
                      return '他听你讲完，只说「话是好话」，请辞信没收回，也没再提——悬着，比走了更磨人。' + (msg ? '（' + msg + '）' : ''); } } },
                { label: '加俸加权，以利留人', cost: { stones: 180 },
                  success: { apply: function (s) {
                      var msg = _gains(s, { morale: 5 });
                      return '俸例翻了一倍，堂口又添了两间铺面。他收下了，请辞的事不再提——只是门里开始有人嘀咕「告病有赏」。' + (msg ? '（' + msg + '）' : ''); } } },
                { label: '准辞，但留下产业', check: 45,
                  success: { apply: function (s) {
                      var msg = _gains(s, { morale: -7, resources: -15 });
                      return '他走得干脆，产业留了，人却带走了半个堂口的人心。空出来的位子，一时没人坐得住。' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var msg = _gains(s, { morale: -12, resources: -30 });
                      return '他不仅走了，还带走了三位亲传与两册不外传的谱录。门里门外，都在传「X 门要散」的闲话。' + (msg ? '（' + msg + '）' : ''); } } }
            ]
            },
            aftermath: { name: '人心观望', text: '弟子们都在看：留下的会怎么待，走的又落了什么下场。', days: 4,
                clear: { cost: { stones: 60 }, apply: function (s) { _gains(s, { morale: 3 }); return '你把长老留下的产业整饬一新，交给了新人——账目公开，人心渐渐落定。'; } } },
            scar: 'elder_grudge'
        },

        'elder_feud': {
            family: 'elder', icon: '⚡',
            // 因果：人多（disciples 多）且士气一般（morale 中低）——堂口积怨才烧得起来。
            causality: function (c) {
                if ((c.strength.disciples || 0) < 22) return { ok: false };
                var morale = c.internal.morale || 50;
                if (morale >= 55) return { ok: false };
                return { ok: true, weight: 1 + (55 - morale) / 20,
                    reason: '人多，事就多；两个堂口为一份产业，积怨不是一天了。' };
            },
            omen: { name: '饭堂口角', prepareNeed: 2,
                text: '两个堂口的弟子在饭堂起了口角，险些动手——各自的师长都到了场，隔着饭桌对视了半晌，谁也没劝谁。',
                prepare: { options: [
                    { label: '分开用膳，错开当值', cost: { stones: 20 }, strength: 1, reply: '饭堂分了两拨时辰，当值的班也错开了。' },
                    { label: '请掌门设宴，两位长老同席', cost: { stones: 80 }, strength: 2, reply: '一桌酒吃得面色各异——但好歹同桌了。' },
                    { label: '把产业暂交公中托管', cost: { stones: 35 }, strength: 2, reply: '那份产业先封了账，谁也别动。' }
                ] } },
            crisis: { name: '演武场对峙',
                text: '积怨到底烧穿了：两个堂口各拉了人马在演武场对峙，刀都出了半鞘——只等一声令下，这门里就要见血。' ,
                choices: [
                { label: '当众公断，按门规处置', check: 65,
                  success: { apply: function (s) {
                      var msg = _gains(s, { morale: 8, contribution: 25 });
                      return '你把产业一分为二，又各罚三月俸例。断得快，断得明——两边都憋着气，但都散了。' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var msg = _gains(s, { morale: -9 });
                      return '判词偏了三分，赢的一方乘胜追击——输的那堂，连夜走了四个弟子。' + (msg ? '（' + msg + '）' : ''); } } },
                { label: '各打五十大板，明罚暗调', cost: { stones: 40 },
                  success: { apply: function (s) {
                      var msg = _gains(s, { morale: -3, contribution: 15 });
                      return '两位长老各罚一季俸例，名下弟子打散重编。罚单贴出去，怨气暂时压进了账里。' + (msg ? '（' + msg + '）' : ''); } } },
                { label: '借一场比武分高下', check: 50,
                  success: { apply: function (s) {
                      var msg = _gains(s, { morale: 5 });
                      return '比武比到第三场，两边都红了眼，也都不好意思再提产业——江湖人的脸面，有时候比账本管用。' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var msg = _gains(s, { morale: -8, resources: -10 });
                      return '比武比出了真火气——两名弟子当场见了血，演武场封了三日。' + (msg ? '（' + msg + '）' : ''); } } }
            ]
            },
            aftermath: { name: '堂口积怨', text: '两堂弟子碰面绕着走，议事时各坐一头。', days: 4,
                clear: { cost: { stones: 70 }, apply: function (s) { _gains(s, { morale: 4 }); return '你设了一桩两堂必须合力才办得成的差事——共事了半月，饭堂里又能同桌吃饭了。'; } } },
            scar: 'elder_grudge'
        },

        'exam_crib': {
            family: 'exam', icon: '📖',
            // 因果：门中新血足（disciples 足）且门内还算安稳（morale 不塌）——才谈得上「大考」。
            causality: function (c) {
                if ((c.strength.disciples || 0) < 18) return { ok: false };
                if ((c.internal.morale || 50) < 42) return { ok: false };
                return { ok: true, weight: 1 + (c.internal.morale - 40) / 40,
                    reason: '门中新血渐多，传功长老早就放话要验一验成色。' };
            },
            omen: { name: '大考放话', prepareNeed: 1,
                text: '传功长老当众放话：月底开考，考不上的降为外门。话音落地，练功房的灯比往年亮了三成。',
                prepare: { options: [
                    { label: '请长老加开三场辅导', cost: { stones: 35 }, strength: 1, reply: '辅导场场爆满，连外门弟子都扒在窗户上听。' },
                    { label: '清点考题，封存卷箱', cost: { stones: 20 }, strength: 2, reply: '卷箱当众贴了封条，钥匙分两人执掌。' }
                ] } },
            crisis: { name: '夹带风波',
                text: '大考前夜，你被点为监考之一——却在库房夹层里撞见同门给考生递夹带。递的还不是寻常纸条，是掌门亲传的考卷。' ,
                choices: [
                { label: '当场揭发，按门规办', check: 60,
                  success: { apply: function (s) {
                      var msg = _gains(s, { morale: -4, contribution: 50, cityRep: 2 });
                      return '你把夹带拍在了传功长老的案上。递卷的人被逐出内门——满院子弟子噤了声，可打那以后，练功房的灯更亮了。' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var msg = _gains(s, { morale: -6 });
                      return '你揭发了，却被反咬一口——「卷子从你手里过，谁知道是谁递的。」考是照考，闲话也照传。' + (msg ? '（' + msg + '）' : ''); } } },
                { label: '私下提醒，给他留脸', check: 72,
                  success: { apply: function (s) {
                      var msg = _gains(s, { morale: 5 });
                      return '你把夹带还了回去，只说了一句「考完我请你喝酒」。第二天，卷箱换了锁——他懂了，你也算没白担这风险。' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var msg = _gains(s, { morale: -5, contribution: -15 });
                      return '他当面应了，转头把夹带送了出去——考完后，落榜的考生把账记在了你头上。' + (msg ? '（' + msg + '）' : ''); } } },
                { label: '睁一只眼闭一只眼',
                  success: { apply: function (s) {
                      var msg = _gains(s, { contribution: -20, morale: -3 });
                      return '考完了，风平浪静。只是发榜那日，你看着榜首的名字，把夜里的那一幕又想了一遍。' + (msg ? '（' + msg + '）' : ''); } } }
            ]
            },
            aftermath: { name: '考后余声', text: '新晋内门的弟子们开始当值，规矩生疏，是非也多。', days: 3, onSuccess: false }
        },

        // ==================== 时势/生计族 ====================
        'rite_pilgrim': {
            family: 'rite', icon: '🏮',
            // 因果：命门靠香火/法事吃饭——没有这份命门，大典这桩事就与门派无关。
            causality: function (c) {
                if (!_hit(_life(c), ['香火', '法事', '道场', '封禅', '授业'])) return { ok: false };
                var festive = (c.month === 1 || c.month === 5 || c.month === 9);
                return { ok: true, weight: festive ? 1.6 : 0.9,
                    reason: '本门立足靠的就是这一炉香火，大典办好，是一年的体面。' };
            },
            omen: { name: '大典将临', prepareNeed: 2,
                text: '大典的日子定了，方圆百里的香客已在路上。斋堂备粥的师傅连声叫苦：粮不够、碗不够、连茅厕都不够。',
                prepare: { options: [
                    { label: '开库添粮，加宽山道', cost: { stones: 80 }, strength: 2, reply: '粮车连进三日，山道两旁插满了引路的灯笼。' },
                    { label: '预拟香客分流章程', cost: { stones: 30 }, strength: 1, reply: '章程贴在山门：上香分东西两路，孩童由执事领着。' },
                    { label: '借调城中伙计帮工', cost: { stones: 50 }, strength: 1, reply: '城里雇来的二十个伙计到了，手脚麻利。' }
                ] } },
            crisis: { name: '香客盈山',
                text: '大典当夜，香客远超往年——山道上人挤人，有孩子走失，有摊贩争位动了手，斋堂的粥也见了底。掌门的脸，比殿里的烛火还暗。' ,
                choices: [
                { label: '亲自带队维持，先找孩子', check: 60,
                  success: { apply: function (s) {
                      var msg = _gains(s, { morale: 6, contribution: 40, cityRep: 6 });
                      return '孩子是在藏经阁后找着的，睡得正香。你抱着他穿过人群时，满山的香客都在念这一门的好。' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var msg = _gains(s, { morale: -5, cityRep: -3 });
                      return '孩子找到了，可争位的摊贩把供桌掀了一角。大典办成了——办得很难看。' + (msg ? '（' + msg + '）' : ''); } } },
                { label: '开库放粮，散财买平安', cost: { stones: 60 },
                  success: { apply: function (s) {
                      var msg = _gains(s, { resources: -55, cityRep: 8, morale: 2 });
                      return '粥棚从山门一路支到山下，没一个人饿着。散出去的是粮，收回来的是「仁善」两个字。' + (msg ? '（' + msg + '）' : ''); } } },
                { label: '收紧山门，限流闭殿',
                  success: { apply: function (s) {
                      var msg = _gains(s, { cityRep: -5, morale: -2, resources: 15 });
                      return '山门关了半扇，殿门限了人数。香客在门外骂骂咧咧，库房倒是省了——只是这炉香火，明年还旺不旺，没人说得准。' + (msg ? '（' + msg + '）' : ''); } } }
            ]
            },
            aftermath: { name: '香客口碑', text: '这一场大典的名声，正顺着香客的嘴往四面八方走。', days: 4,
                clear: { cost: { stones: 40 }, apply: function (s) { _gains(s, { cityRep: 2 }); return '门里给走失孩子的那户人家送了一程盘缠——人家回赠的匾，挂在了山门东角。'; } } }
        },

        'influx_crowd': {
            family: 'influx', icon: '⛺',
            // 因果：影响力足（名望远播）——门派无名，求道者盈门这桩事不会发生。
            causality: function (c) {
                var influence = c.internal.influence || 0;
                if (influence < 58) return { ok: false };
                return { ok: true, weight: (influence - 55) / 18,
                    reason: '近来门中名望正盛，山下的人听得了风声。' };
            },
            omen: { name: '山门外扎营', prepareNeed: 2,
                text: '山门外的官道上「长」出了一片窝棚——拖家带口求收录的、投机的、看热闹的，炊烟起了三天。',
                prepare: { options: [
                    { label: '先立收录章程，张榜山门', cost: { stones: 30 }, strength: 2, reply: '章程贴出去，窝棚里的议论声齐了——「先验骨，后拜师。」' },
                    { label: '拨粮施粥，稳住阵脚', cost: { stones: 55 }, strength: 1, reply: '粥棚一开，孩子的哭声少了大半。' },
                    { label: '清出山脚校场安置', cost: { stones: 45 }, strength: 1, reply: '校场扎了帐篷，不再挤在官道上。' }
                ] } },
            crisis: { name: '人满为患',
                text: '人越聚越多，水井见了底，夜里有人翻墙进了内院被拿住，还传出了发热的病例——山下的人潮，正在变成山上的祸事。' ,
                choices: [
                { label: '立规择徒，当场验收', check: 62,
                  success: { apply: function (s) {
                      var msg = _gains(s, { morale: 5, contribution: 35, influence: 2 });
                      return '校场上验了三日，收录二十七人、遣散四百余。留下的是苗子，走的是规矩——山门外，静了。' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var msg = _gains(s, { morale: -5 });
                      return '验徒验出了争执——落选的把石阶撬了一块，扬长而去。收下的人里，混没混进祸胎，谁也说不准。' + (msg ? '（' + msg + '）' : ''); } } },
                { label: '施粮遣散，好聚好散', cost: { stones: 70 },
                  success: { apply: function (s) {
                      var msg = _gains(s, { resources: -45, cityRep: 5 });
                      return '每人两日干粮、一句「缘满再来」。人潮散了，山道净了——山下的人提起来，都说这门里厚道。' + (msg ? '（' + msg + '）' : ''); } } },
                { label: '闭门驱散', check: 45,
                  success: { apply: function (s) {
                      var msg = _gains(s, { cityRep: -6, morale: -3 });
                      return '弟子们列队把人潮「请」下了山。快，是快——只是「仗势欺人」的话，也跟着下山了。' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var msg = _gains(s, { cityRep: -8, morale: -6, resources: -20 });
                      return '驱散驱成了冲撞，伤了两个人。围观的把这一幕传去了十里八乡，越传越不像话。' + (msg ? '（' + msg + '）' : ''); } } }
            ]
            },
            aftermath: { name: '新徒磨合', text: '新收录的弟子规矩生疏，老弟子多有怨言。', days: 4, onSuccess: false }
        },

        'buyout_price': {
            family: 'buyout', icon: '💰',
            // 因果：命门有出产（丹药/矿冶/海贸…）且库里真有货（resources 高）——没货没产，压价无从谈起。
            causality: function (c) {
                if (!_hit(_life(c), ['丹药', '矿冶', '海贸', '花酿', '灵茶', '沙商', '海产', '蝎毒', '玉矿', '火器'])) return { ok: false };
                if ((c.internal.resources || 0) < 110) return { ok: false };
                return { ok: true, weight: 1,
                    reason: '门中产业出产正旺，库里有货——外头的商贾，最盯这种时候。' };
            },
            omen: { name: '行会探价', prepareNeed: 2,
                text: '镇上三家大商行同时派人来「探价」，出的数一次比一次低，口径却齐得反常——这不是三个买家，是一只手。',
                prepare: { options: [
                    { label: '另寻别镇买主探路', cost: { stones: 40 }, strength: 2, reply: '邻镇的回信到了：愿出高出一成五的价，只是量有限。' },
                    { label: '分批出货，不入行会秤', cost: { stones: 25 }, strength: 1, reply: '头两批货连夜出了小门，走的是私秤。' },
                    { label: '请同业老行尊评估', cost: { stones: 50 }, strength: 1, reply: '老行尊掂了掂货，只说：「他们的价，缺德。」' }
                ] } },
            crisis: { name: '行会联手压价',
                text: '三家行会放话：本月只按他们开的价收，别家不敢接——货压在库里，日日要人工要仓储，拖不起的是门派自己。' ,
                choices: [
                { label: '走邻镇第二渠道', check: 65, cost: { energy: 25 },
                  success: { apply: function (s) {
                      var msg = _gains(s, { resources: 35, morale: 4 });
                      return '邻镇的买主分五批把货接走了，价还高出一成。行会的「联手」，漏了个底朝天。' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var msg = _gains(s, { resources: -25, morale: -5 });
                      return '邻镇的买主中途变卦——行会的手，比想的长。货，还是压回了库里。' + (msg ? '（' + msg + '）' : ''); } } },
                { label: '惜售等价，硬拖', check: 50,
                  success: { apply: function (s) {
                      var msg = _gains(s, { resources: -10, morale: 3 });
                      return '拖过了行会约定的期限——他们自己先沉不住气，价抬回来了两成。这一手，是熬赢的。' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var msg = _gains(s, { resources: -35, morale: -6 });
                      return '货在库里捂出了霉头，行会的价又压了一轮。掌门看着仓单，半天没说话。' + (msg ? '（' + msg + '）' : ''); } } },
                { label: '认价出货，换现钱',
                  success: { apply: function (s) {
                      var msg = _gains(s, { resources: 10, morale: -8 });
                      return '货按行会的价出了，现钱进了账。账面上没亏，可全门都憋着一口气——这口气，比亏钱还沉。' + (msg ? '（' + msg + '）' : ''); } } }
            ]
            },
            aftermath: { name: '行会刁难', text: '行会放话：往后的货，验三道秤。', days: 4,
                clear: { cost: { stones: 90 }, apply: function (s) { _gains(s, { morale: 3 }); return '你请老行尊出面吃了一场酒——秤，还是两道；面子，算还了一半。'; } } }
        },

        'vein_border': {
            family: 'vein', icon: '⛏️',
            // 因果：命门吃矿（矿冶/玉矿/火器/铸剑）且库存吃紧（resources 偏低，越往后矿越薄）——矿脉之争才有因。
            causality: function (c) {
                if (!_hit(_life(c), ['矿冶', '玉矿', '火器', '铸剑'])) return { ok: false };
                if ((c.internal.resources || 0) >= 90) return { ok: false };
                return { ok: true, weight: 1 + c.day / 300,
                    reason: '矿洞越打越深，出矿一日薄过一日——薄到了别人地界的边上。' };
            },
            omen: { name: '矿脉见薄', prepareNeed: 2,
                text: '老矿师蹲在洞口抽了半天旱烟：这矿脉「到脖子了」——再往深处打，就是邻山的地界。洞里的锤声，一天比一天稀。',
                prepare: { options: [
                    { label: '请地师勘界立碑', cost: { stones: 55 }, strength: 2, reply: '地师勘了三日，界碑立上了山脊——白纸黑字，比拳头硬。' },
                    { label: '转采浅层贫矿补产', cost: { stones: 30 }, strength: 1, reply: '浅层贫矿开了三个新口子，量少了些，但安稳。' },
                    { label: '备下交涉的礼数与文书', cost: { stones: 40 }, strength: 1, reply: '界图誊了三份，礼单也备下了——先礼后兵的路子。' }
                ] } },
            crisis: { name: '矿洞穿界',
                text: '到底挖穿了——矿工往下打了三丈，洞壁一薄，对面的山体里传来另一个门派的锤声。两家的矿洞，在山肚子里通了。' ,
                choices: [
                { label: '当面交涉，划界共采', check: 65,
                  success: { apply: function (s) {
                      var other = _pickNeighbor(s);
                      _diplo(s, other, 5, 0);
                      var msg = _gains(s, { resources: 25, morale: 4 });
                      return '两家的管事在洞口喝了一碗酒，界石往两边各退一丈，富矿段两家轮流开采。山肚子里的路，通成了善缘。' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var other = _pickNeighbor(s);
                      _diplo(s, other, -10, 1);
                      var msg = _gains(s, { resources: -15, morale: -5 });
                      return '对方要独占富矿段，酒碗一推就翻了脸。矿洞封了半边，锤声变成了各自赌气。' + (msg ? '（' + msg + '）' : ''); } } },
                { label: '封洞据守，寸步不让', check: 50,
                  success: { apply: function (s) {
                      var other = _pickNeighbor(s);
                      _diplo(s, other, -5, 1);
                      var msg = _gains(s, { morale: 5, resources: -10 });
                      return '你把穿界处砌死，界碑立在自家檐下。对方派人来争了两回，没讨到便宜——矿是保住了，梁子也结下了。' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var other = _pickNeighbor(s);
                      _diplo(s, other, -15, 2);
                      var msg = _gains(s, { resources: -30, morale: -6 });
                      return '对方连夜把穿界处扩成了通道，还搬走了两车富矿。矿洞里第一次动了家伙——所幸没人死。' + (msg ? '（' + msg + '）' : ''); } } },
                { label: '抢在对方前头挖富矿', check: 45,
                  success: { apply: function (s) {
                      var other = _pickNeighbor(s);
                      _diplo(s, other, -12, 2);
                      var msg = _gains(s, { resources: 45, morale: 6 });
                      return '三天三夜不歇火，富矿段抢下了大半。矿车进进出出，喜气还没散——对面的山头，已经传来了磨刀声。' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var other = _pickNeighbor(s);
                      _diplo(s, other, -18, 2);
                      var msg = _gains(s, { resources: -25, morale: -8 });
                      return '抢矿没抢成，反倒让对方抓住了人证物证——这一手，是把「理」亲手递给了人家。' + (msg ? '（' + msg + '）' : ''); } } }
            ]
            },
            aftermath: { name: '矿界不宁', text: '山肚子里两家的锤声，隔着一层石壁互相较劲。', days: 5,
                clear: { cost: { stones: 70 }, apply: function (s) { return '你请了两家都服的老地师重勘了一次界，新碑落成那日，两边的锤声停了一日。'; } } },
            scar: 'vendetta'
        },

        'plague_gate': {
            family: 'plague', icon: '🌿',
            // 因果：命门怕疫（fears）+ 湿热时节（season）——旱季寒冬，时疫叩不了门。
            causality: function (c) {
                if (!_hit(_fears(c), ['疫病', '疫变'])) return { ok: false };
                if (c.season !== 'summer') return { ok: false };
                return { ok: true, weight: 1.3, reason: '湿热时节，山下的镇子开始有人发热——这病，认路。' };
            },
            omen: { name: '山下疫讯', prepareNeed: 2,
                text: '山下的集市冷清了：镇上出了高热病人，头一例是码头下来的船工。药铺连夜挂出了「避瘟汤」的幌子。',
                prepare: { options: [
                    { label: '预配避瘟汤，全员服用', cost: { stones: 65 }, strength: 2, reply: '汤剂熬了三大锅，门里人人一碗，山门口也设了奉药棚。' },
                    { label: '闭门谢客，山道洒石灰', cost: { stones: 25 }, strength: 1, reply: '山道洒了三遍石灰，外客一律挡在山门之外。' },
                    { label: '遣人下山探明疫源', cost: { stones: 40 }, strength: 2, reply: '探明白了：病源自码头的一批米——镇上还没人知道。' }
                ] } },
            crisis: { name: '病人叩山门',
                text: '两名香客在山门前倒下，症状与镇上一模一样。消息传开，信众四散，有人连夜收拾细软下山——「本山的药也治不了」的传言，比疫气跑得还快。' ,
                choices: [
                { label: '开义诊，全力施药', check: 65,
                  success: { apply: function (s) {
                      var msg = _gains(s, { resources: -40, morale: 6, cityRep: 8, contribution: 45 });
                      return '义诊棚从山门搭到镇口，七日退热三百人。疫退那天，镇上父老抬着一块「活人济世」的匾上山——这一仗，赢在人心。' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var msg = _gains(s, { resources: -60, morale: -6, cityRep: -3 });
                      return '施药七日，有个孩子没救回来。匾没等来，等来了「本山药石无灵」的闲话——尽管救回的是三百个。' + (msg ? '（' + msg + '）' : ''); } } },
                { label: '封山谢客，保门内平安',
                  success: { apply: function (s) {
                      var msg = _gains(s, { cityRep: -6, morale: -3, resources: 10 });
                      return '山门一封，疫气没上山。可山下父老跪着求药的那一幕，成了门里弟子心里过不去的一道坎。' + (msg ? '（' + msg + '）' : ''); } } },
                { label: '上报官府，请封疫区', check: 72,
                  success: { apply: function (s) {
                      var msg = _gains(s, { cityRep: 5, morale: 3, influence: 2 });
                      return '官府依你所请封了疫区、断了病源。县尊亲笔致谢——这一手，救的是方圆百里的命。' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var msg = _gains(s, { cityRep: -3, morale: -3 });
                      return '公文递上去，官府拖了五日才封——这五日里，疫气顺着官道多走了两个镇。' + (msg ? '（' + msg + '）' : ''); } } }
            ]
            },
            aftermath: { name: '疫后清点', text: '药库见了底，几名施药的弟子也累倒了。', days: 4,
                clear: { cost: { stones: 55 }, apply: function (s) { _gains(s, { morale: 3 }); return '镇上凑了谢仪送上门，药库重新进了三车药材——门里门外的账，两清了。'; } } }
        },

        'ally_call': {
            family: 'ally', icon: '🕊️',
            // 因果：外交账里真有盟友（relation>=60）——没有盟约，求援的信无处寄。
            causality: function (c) {
                var friend = c.diplo.friend;
                if (!friend) return { ok: false };
                return { ok: true, weight: 1 + friend.relation / 120,
                    reason: '与「' + friend.name + '」的盟约白纸黑字，如今要用上了。' };
            },
            omen: { name: '信鸽频至', prepareNeed: 1,
                text: '信鸽一夜三至——盟那边的函件一封比一封急，字迹也一次比一次潦草。末一封只有八个字：「事急矣，望速援手。」',
                prepare: { options: [
                    { label: '先议定可拨之数', cost: { stones: 15 }, strength: 1, reply: '账房连夜拟了三档：倾力、出力、声援——白纸黑字。' },
                    { label: '点选驰援人手备勤', cost: { stones: 35 }, strength: 2, reply: '二十名精锐换了行装，马匹草料都备齐了。' }
                ] } },
            crisis: { name: '盟友告急',
                text: '急函到了：盟家遭了围攻，请本门依盟约驰援。可本门自己库里也见紧——去，是情分也是负担；不去，是毁约也是失义。' ,
                choices: [
                { label: '倾力驰援', check: 60,
                  success: { apply: function (s) {
                      var friend = (window.SectCrisis && window.SectCrisis.diplomacyOf(s).friend);
                      _diplo(s, friend && friend.name, 18, 0);
                      var msg = _gains(s, { resources: -45, morale: 9, cityRep: 4, influence: 3 });
                      return '援旗赶到时，对方山门已烧了半边——援军一到，围自解了。盟主亲自出迎三十里，盟约之外，又添了一段过命的交情。' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var friend = (window.SectCrisis && window.SectCrisis.diplomacyOf(s).friend);
                      _diplo(s, friend && friend.name, 4, 0);
                      var msg = _gains(s, { resources: -50, morale: -6 });
                      return '援军到时，事情已经了了。人没赶上，粮草折了——情分认了，可惜晚了半步。' + (msg ? '（' + msg + '）' : ''); } } },
                { label: '出力不出人，送粮送药', cost: { stones: 60 },
                  success: { apply: function (s) {
                      var friend = (window.SectCrisis && window.SectCrisis.diplomacyOf(s).friend);
                      _diplo(s, friend && friend.name, 5, 0);
                      var msg = _gains(s, { morale: -2 });
                      return '三车粮、两车药连夜送到了。对方收下了，谢帖上写着「记此一功」——功是记了，人情的分量轻了些。' + (msg ? '（' + msg + '）' : ''); } } },
                { label: '按兵不动', check: 40,
                  success: { apply: function (s) {
                      var friend = (window.SectCrisis && window.SectCrisis.diplomacyOf(s).friend);
                      _diplo(s, friend && friend.name, -25, 1);
                      var msg = _gains(s, { morale: -5 });
                      return '函件石沉大海。后来听说，盟家自己撑过来了——撑过来了，也就记住了谁没来。' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var friend = (window.SectCrisis && window.SectCrisis.diplomacyOf(s).friend);
                      _diplo(s, friend && friend.name, -35, 1);
                      var msg = _gains(s, { morale: -8, cityRep: -3 });
                      return '盟家败了，山门被占了一座。江湖上都在问：那家的盟友，当时在干什么？' + (msg ? '（' + msg + '）' : ''); } } }
            ]
            },
            aftermath: { name: '盟约账目', text: '这一回援没援、援了多少，两边各自都记在账上。', days: 3, onSuccess: false }
        },

        'ally_seat': {
            family: 'ally', icon: '🪑',
            // 因果：有盟（diplomacy）且自身有名望（influence）——两样都缺，盟会的座次轮不到本门操心。
            causality: function (c) {
                var friend = c.diplo.friend;
                if (!friend) return { ok: false };
                if ((c.internal.influence || 0) < 50) return { ok: false };
                return { ok: true, weight: 1, reason: '盟里三年一会，本门的名字在请柬上。' };
            },
            omen: { name: '盟会放帖', prepareNeed: 1,
                text: '盟会的请帖到了，随帖附了一份「座次初议」——本门那一行，被排在了比往年低一位的位置。帖是墨写的，脸是山门的。',
                prepare: { options: [
                    { label: '先探各家的口风', cost: { stones: 30 }, strength: 2, reply: '探回来了：有两家也觉得这排法不公——可拉拢。' },
                    { label: '备一份厚礼随帖回', cost: { stones: 60 }, strength: 1, reply: '礼单送出去了，回帖上的称呼客气了三分。' }
                ] } },
            crisis: { name: '座次之争',
                text: '盟会当日，司仪唱名，本门的座次果然排低了——往年的位置，如今坐着另一家的掌门。满堂目光扫过来，都在看本门怎么接。' ,
                choices: [
                { label: '当场力争，以功绩说话', check: 62,
                  success: { apply: function (s) {
                      var msg = _gains(s, { morale: 7, influence: 3, contribution: 25 });
                      return '你把本门这些年办成的差事一样样报了出来，句句有据。盟主沉吟半晌，抬手把两家的座次换了回来——这一场，赢得体面。' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var msg = _gains(s, { morale: -7 });
                      return '力争没争过——对方掌门一句「论的是如今的香火」，把满座的功绩堵了回去。座次没动，脸面动了。' + (msg ? '（' + msg + '）' : ''); } } },
                { label: '忍下，会后私访两家', cost: { stones: 80 },
                  success: { apply: function (s) {
                      var msg = _gains(s, { morale: 2, influence: 2 });
                      return '会上你笑纳了那个座次，会下连访两家、缔了新约。来年盟会，他们替本门把话说满了——座次的事，用别的方式讨了回来。' + (msg ? '（' + msg + '）' : ''); } } },
                { label: '拂袖离席，以示不满', check: 45,
                  success: { apply: function (s) {
                      var msg = _gains(s, { morale: 5, cityRep: 2 });
                      return '你起身离席，袍角带翻了茶盏。满堂寂静——江湖上后来都传：那一家的弟子，膝盖硬。' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var msg = _gains(s, { morale: -4, cityRep: -3, influence: -3 });
                      return '离席离成了笑话——司仪只当没看见，照旧唱名。本门的名字，从此在盟里排在「告病」一栏。' + (msg ? '（' + msg + '）' : ''); } } }
            ]
            },
            aftermath: { name: '盟中议论', text: '盟里各家对这次座次之争，各有各的说法。', days: 3, onSuccess: false }
        },

        // ==================== 天时族 ====================
        'flood_hill': {
            family: 'flood', icon: '🌊',
            // 因果：地是山地（terrain）、时是雨季（season）——沙漠无山洪，寒冬无大水。
            causality: function (c) {
                var t = c.profile.terrain;
                if (t !== '山' && t !== '谷') return { ok: false };
                if (c.season !== 'spring' && c.season !== 'summer') return { ok: false };
                return { ok: true, weight: 1.2 + ((c.internal.resources || 0) < 80 ? 0.3 : 0),
                    reason: '入了雨季，山里的水一日涨过一日。' };
            },
            omen: { name: '山涧泛红', prepareNeed: 2,
                text: '连下了七日雨，山涧水色发浑发红。巡山弟子回报：后山两处坡面开始渗水，老树根都泡出来了。',
                prepare: { options: [
                    { label: '清疏沟渠，加筑导流坝', cost: { stones: 55 }, strength: 2, reply: '沟渠清出三里，导流坝垒了两道——水有了去处。' },
                    { label: '暂闭后山道路', cost: { stones: 10 }, strength: 1, reply: '后山封了，界碑上挂了警示的木牌。' },
                    { label: '备下沙石木料、抽调人手', cost: { stones: 45 }, strength: 2, reply: '沙石堆在道旁，抢险的人手排成了三班。' }
                ] } },
            crisis: { name: '山洪下来',
                text: '半夜，山洪下来了。冲垮了半条上山道和两间库房，浑水裹着断木往下滚——雨还没有停的意思。' ,
                choices: [
                { label: '先抢库房，再修道', check: 60,
                  success: { apply: function (s) {
                      var msg = _gains(s, { morale: 6, resources: -20, contribution: 35 });
                      return '库房抢出了十之七八。水退那日清点，药材粮秣都齐——山路三日修通，香客照旧上山。' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var msg = _gains(s, { resources: -70, morale: -9 });
                      return '人还没撤干净，第二波洪头到了——半库的粮药泡了汤，山路塌出丈许深的沟。' + (msg ? '（' + msg + '）' : ''); } } },
                { label: '以水导水，掘渠分流', check: 72,
                  success: { apply: function (s) {
                      var msg = _gains(s, { morale: 5, resources: -25 });
                      return '你带人连夜掘了分流渠，把洪头引向了荒涧。山下村子保住了，门里的损失也止住了——两头的香火，都记着这一夜。' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var msg = _gains(s, { resources: -50, morale: -7 });
                      return '渠掘晚了半个时辰，洪头改道冲了东坡——坡上两亩灵田，连土带苗卷走了。' + (msg ? '（' + msg + '）' : ''); } } },
                { label: '只保要道，舍库房',
                  success: { apply: function (s) {
                      var msg = _gains(s, { resources: -45, morale: 2 });
                      return '人都撤上了高坡，一人不伤。库房让水淹了——东西没了，可全门上下，心气没散。' + (msg ? '（' + msg + '）' : ''); } } }
            ]
            },
            aftermath: { name: '水毁未复', text: '上山道只通一半，脚夫驮货要绕远，价翻了倍。', days: 4,
                clear: { cost: { stones: 65 }, apply: function (s) { _gains(s, { cityRep: 2 }); return '雇了石匠整了七日，山道复通。头一队上山的香客，在山门口烧了三炷香。'; } } },
            scar: 'ground_loose'
        },

        'flood_sea': {
            family: 'flood', icon: '🌀',
            // 因果：地是岛/水（terrain）、时是风暴季（season）——内陆门派，风暴闭不了港。
            causality: function (c) {
                var t = c.profile.terrain;
                if (t !== '岛' && t !== '水') return { ok: false };
                if (c.season !== 'summer' && c.season !== 'autumn') return { ok: false };
                return { ok: true, weight: 1.3, reason: '入了风暴季，海上的天说变就变。' };
            },
            omen: { name: '老船工看云', prepareNeed: 2,
                text: '老船工在码头看了三天云色，只说了一句：「这半月，船不能出。」可码头上的货已经压了两批，货主催得紧。',
                prepare: { options: [
                    { label: '货栈加桩，泊船入内港', cost: { stones: 60 }, strength: 2, reply: '货栈加了桩，船全数收进内港——海上空了，心里踏实了。' },
                    { label: '给船工放假，添修船料', cost: { stones: 35 }, strength: 1, reply: '船工歇了，顺带把两条旧船的底板换了。' },
                    { label: '赶在风暴前发一班船', cost: { stones: 25 }, strength: 1, reply: '那班船赶在云变色前出了港——赌对了。' }
                ] } },
            crisis: { name: '风暴提前',
                text: '风暴比预测提前一夜到。一艘泊在港外的本门货船失了音讯，码头被浪掀了半边——风还在吼，货主的火气比风还大。' ,
                choices: [
                { label: '连夜出海搜救', check: 55,
                  success: { apply: function (s) {
                      var msg = _gains(s, { morale: 8, cityRep: 3 });
                      return '搜救的船在礁盘后寻着了那船——搁浅在沙尾，人货俱在。押船的师弟回来时，指甲缝里都是盐。这一趟，值。' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var msg = _gains(s, { resources: -40, morale: -12 });
                      return '搜救船自己也险些回不来——桅断了一根，两名船工带伤。货船没寻着，船上的人，凶多吉少。' + (msg ? '（' + msg + '）' : ''); } } },
                { label: '守港抢修，先保码头', check: 65,
                  success: { apply: function (s) {
                      var msg = _gains(s, { resources: -20, morale: 3 });
                      return '码头抢在第二波浪前打了桩、缆了船。风暴过境，码头瘸了条腿，但人一个没少。' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var msg = _gains(s, { resources: -45, morale: -6 });
                      return '浪头比人手快——码头塌了半边，三条泊船相互撞了个稀烂。' + (msg ? '（' + msg + '）' : ''); } } },
                { label: '等风停再说',
                  success: { apply: function (s) {
                      var msg = _gains(s, { resources: -55, morale: -6 });
                      return '风停了三天才停。港口清出一条道，货主的货烂了一半——这口气，往后要在账上还很久。' + (msg ? '（' + msg + '）' : ''); } } }
            ]
            },
            aftermath: { name: '港损未复', text: '码头只开了一半泊位，货主的怨气还没散。', days: 4,
                clear: { cost: { stones: 75 }, apply: function (s) { _gains(s, { cityRep: 2 }); return '请了港务行会的人来验了桩，赔了该赔的，码头复了全。'; } } },
            scar: 'death'
        },

        // ==================== 机缘族 ====================
        'ancient_gate': {
            family: 'ancient', icon: '🚪',
            // 因果：山体得先塌（scars.ground_loose——山洪/矿争的余痕），或年深日久雨水冲刷（day 大）。
            // 古迹不是天上掉下来的：它是前一场天灾，或者是岁月本身。
            causality: function (c) {
                var t = c.profile.terrain;
                if (t === '城') return { ok: false };
                var loose = c.scars.ground_loose || 0;
                if (!loose && c.day < 45) return { ok: false };
                return { ok: true, weight: loose ? 2.2 : 0.55,
                    reason: loose ? '前些日子山体松动，塌出来的东西，不寻常。' : '连年的雨水，冲出了些不该露头的东西。' };
            },
            omen: { name: '塌方夜光', prepareNeed: 2,
                text: '后山塌方处夜里有微光，拾柴的孩子捡回来一片刻着古篆的玉。掌门看了半晌，把它锁进了内库——锁门时，回头看了一眼。',
                prepare: { options: [
                    { label: '先封塌方处，禁人近前', cost: { stones: 30 }, strength: 2, reply: '塌方处拉了绳、立了牌，夜里加了一班岗。' },
                    { label: '请懂古篆的行家掌眼', cost: { stones: 55 }, strength: 1, reply: '行家掌眼三日，只说了一句：「门后头的东西，比这片玉老得多。」' },
                    { label: '备下绳梯火把、清点敢入者', cost: { stones: 25 }, strength: 1, reply: '敢进去的人报了名——十一个，比想的少，比想的老成。' }
                ] } },
            crisis: { name: '石门初启',
                text: '塌方处清出来一道石门，门上的封印朽得一碰即碎。门缝里透出的气息让两名弟子当场跪了——门里是前人的洞府，也可能是前人的死法。' ,
                choices: [
                { label: '封存上报，请掌门亲启', check: 62,
                  success: { apply: function (s) {
                      var msg = _gains(s, { contribution: 40, points: 15, morale: 4 });
                      return '掌门率三位长老亲启石门，门内规制俨然、物归原位。开出的典籍归了藏经阁——你护门有功，名字记在了册上。' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var msg = _gains(s, { morale: -4 });
                      return '报上去晚了一夜——塌方二次崩落，把石门埋回去半截。掌门没责怪谁，只是站了很久。' + (msg ? '（' + msg + '）' : ''); } } },
                { label: '结队探入', check: 45, cost: { energy: 35 },
                  success: { apply: function (s) {
                      var msg = _gains(s, { stones: 90, morale: 6, points: 10 });
                      return '进去五人，出来五人——比进去时多了一个人：半路遇见的、也循光而来的散修。带回来的东西换了九十灵石，换的时候，手都在抖。' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var msg = _gains(s, { resources: -20, morale: -12 });
                      return '进去四人，抬回来两个。守在门外的弟子把火把攥出了一手汗——那道门，从此再没人提。' + (msg ? '（' + msg + '）' : ''); } } },
                { label: '报官府与同道，共启同探', check: 55,
                  success: { apply: function (s) {
                      var msg = _gains(s, { cityRep: 5, stones: 40, influence: 2 });
                      return '共启那日来了三家同道，规矩立在先、利份分在后。门里的名声，随着这桩「大方」的事迹，传出了百里。' + (msg ? '（' + msg + '）' : ''); } },
                  fail: { apply: function (s) {
                      var msg = _gains(s, { cityRep: -3, morale: -4 });
                      return '共探的散修私藏了两件东西，官司打到了官府——「看门不严」四个字，落在了本门头上。' + (msg ? '（' + msg + '）' : ''); } } }
            ]
            },
            aftermath: { name: '洞府余韵', text: '塌方处的风声，夜里听着总像有人在念经。', days: 4,
                clear: { cost: { stones: 40 }, apply: function (s) { _gains(s, { morale: 3 }); return '门里在塌方处立了一座小小的石亭，逢初一十五上香——风声听着，像念经，也像道谢。'; } } }
        }
    };

    window.SECT_CRISIS_EVENTS = EVENTS;
    if (window.XianXia) window.XianXia.SectCrisisEvents = { all: EVENTS, count: Object.keys(EVENTS).length };
    console.log('[SectCrisisEvents] loaded ' + Object.keys(EVENTS).length + ' events v20.49');
})();
