// ==================== sect-rooms.js - 一栋建筑一扇门（改造批二：建筑功能整合） ====================
// 玩家拍板：建筑旁的独立按钮全删（「进入」旁边再挂一排小按钮是把新功能钉在旧界面上）。
// 重做原则：**进门就是这门里的日子，事在门里办**——
//   医馆：进门医师自动看你。有旧伤他先说旧伤，治病是「问诊」一件事：旧伤、伤势一起处置，
//         药材出自媒体门的丹药库存（库存真被吃掉；库空了医师为难，旧伤将养着——世界的账）。
//         医药底子的弟子（药王谷/百花谷/峨眉）多一个「坐诊帮手」——帮工练底子，门里记功。
//   演武场：进门看见同门在练——找人切磋/自己练/看大比榜，三件都是场上真事。
//   膳堂：进门就是吃饭——饭气、街谈一次结完（丐帮底子多听一条：耳朵长在墙根）。
//   兵器库：进门领份例，铁匠看你刃口卷了会问「淬一淬？」——淬火是铁匠的话，不是菜单。
//   议事厅：账本挂在墙上（进门就看见），与同门闲坐、听门中近事、进言都在厅里。
//   藏经阁/洞府/大殿：进门即既有流程（书阁分层阅览本就深；大殿守卫反应链本身就是戏）。
//   地标：场景描写里织进熟识档位（「守处的同门认得你了」），深交是场景里的一个选项，不是独立按钮。
// 纪律：不凑功能——每扇门里只放这门里真会发生的事；旧独立入口（切磋/淬火/用膳/旧伤/账本/熟识按钮）全部退役。
(function () {
    'use strict';
    var W = window;

    function ds() { return W.discipleState || null; }
    function msg(m, t) { if (typeof W.showMessage === 'function') W.showMessage(m, t || 'info'); }
    function modal(t, b) { if (typeof W.showModal === 'function') W.showModal(t, b); }
    function log(m, t) { try { if (W.gameLog && W.gameLog.add) W.gameLog.add(m); } catch (e) {} }
    function para(t) { return '<p class="text-sm text-gray-300 leading-relaxed mb-2">' + t + '</p>'; }
    function btn(label, onclick, cls) { return '<button onclick="' + onclick + '" class="' + (cls || 'bg-yellow-700 hover:bg-yellow-600') + ' text-xs px-3 py-2 rounded text-left">' + label + '</button>'; }
    function btns(arr) { return '<div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">' + arr.join('') + '</div>'; }
    function _close() { try { var ov = document.getElementById('xianxia-modal-overlay'); if (ov) ov.remove(); } catch (e) {} }
    W._closeModal = _close; // 场景屋按钮统一用它收帘
    function useFac(fid, quiet) {
        if (typeof W.useFacility !== 'function') { msg('设施系统未就绪。', 'error'); return null; }
        return W.useFacility(fid, quiet ? { quiet: true } : undefined);
    }
    function train(kind) { try { if (typeof W.sectPassiveTrain === 'function') W.sectPassiveTrain(kind); } catch (e) {} }
    function wounds() { try { var d = ds(); return (d && d._facLife && d._facLife.oldWounds) || []; } catch (e) { return []; } }
    function mainHand() { try { return (W.currentEquipment && W.currentEquipment.mainHand) || null; } catch (e) { return null; } }
    function pillStock() {
        try {
            var p = W.SectGov && W.SectGov.probe && W.SectGov.probe((ds() || {}).sectName || (ds() || {}).sectId);
            return p ? (Number(p.pill) || 0) : 0;
        } catch (e) { return 0; }
    }

    // ============ 门牌总入口 ============
    W.openSectRoom = function (fid) {
        var d = ds();
        if (!d || !d.isInSect) { msg('还没入门。', 'warning'); return; }
        // 准入沿用设施系统的权限判定
        try {
            if (typeof W.checkFacilityAccess === 'function') {
                var acc = W.checkFacilityAccess(fid);
                if (acc && !acc.accessible) { msg(acc.reason || '此处你进不去。', 'warning'); return; }
            }
        } catch (e) {}
        if (fid === 'sect_leader') { useFac(fid); return; }         // 大殿：守卫反应链本身就是戏
        if (fid === 'sect_library') { openLibraryRoom(); return; }
        if (fid.indexOf('fx_') === 0) { openLandmarkRoom(fid); return; }
        var room = ROOMS[fid];
        if (!room) { useFac(fid); return; }
        room();
    };

    var ROOMS = {
        // ---- 演武场：场上三件真事 ----
        sect_training_ground: function () {
            var streak = 0;
            try { streak = (ds()._facLife && ds()._facLife.sparStreak) || 0; } catch (e) {}
            modal('⚔️ 演武场', para('场子里尘土飞扬——两个师弟正拆招，场边压着一排水缸。' + (streak >= 3 ? '你一走进来就有人抬头：「连胜' + streak + '场的来了。」' : '教习看见你，扬了扬下巴算打招呼。'))
                + btns([
                    (function () {
                        try {
                            if (typeof window.sectMorningClassOpen === 'function' && window.sectMorningClassOpen() && window.eventFlags['sect_class_morning'] !== (window.timeSystem.getAbsoluteDay ? window.timeSystem.getAbsoluteDay() : -1)) {
                                return btn('🌅 上早课——辰时列队，师傅挨个纠桩功', 'window._closeModal(); window.doMorningClass()', 'bg-sky-800 hover:bg-sky-700');
                            }
                        } catch (e) {}
                        return '';
                    })(),
                    btn('🤺 找人切磋——挑一个有名有姓的同门真打一场', 'window._closeModal(); window.openSparPanel()'),
                    btn('🥋 自己练——石锁木桩，练到真气见底', 'window._closeModal(); window.useFacility(\'sect_training_ground\'); window.sectRoomTrain(\'drill\')'),
                    btn('🏆 看大比榜——节令赛事的名次与势头', 'window._closeModal(); window.Tournament && window.Tournament.showTournamentPanel((window.discipleState.sectName || window.discipleState.sectId))', 'bg-gray-600 hover:bg-gray-500')
                ]));
        },
        // ---- 医馆：问诊一件事（旧伤+伤势一起处置，药材出公库） ----
        sect_medical: function () {
            var ws = wounds();
            var doc = ws.length
                ? '医者搭了你的脉，眉头先皱起来：「' + ws.map(function (w) { return w.part; }).join('、') + '——旧伤拖太久了，淤在里面。先治这个，再养新的。」'
                : '医者上下打量你一圈：「皮外伤好说，坐。」药炉咕嘟咕嘟响着，满屋子都是苦香。';
            var pill = pillStock();
            modal('💊 医馆', para(doc)
                + (ws.length ? para('<span class="text-xs text-gray-500">治旧伤药材出自公中丹药库（每处五炉）——库现存 ' + pill + ' 炉。' + (pill < ws.length * 5 ? '<span class="text-red-400">库不够，只能治到哪儿算哪儿。</span>' : '') + '</span>') : '')
                + btns([
                    btn('💊 问诊——旧伤新伤一起治（诊金贡献10）', 'window._closeModal(); window.doSectMedical()'),
                    (function () {
                        try {
                            var p = W.SECT_PASSIVES && W.SECT_PASSIVES[(ds().sectName || ds().sectId)];
                            if (p && p.train && p.train.indexOf('heal') >= 0) {
                                return btn('🌿 坐诊帮手——替医师研药半日（医药底子长功底，门里记功）', 'window._closeModal(); window.doSectClinicHelp()', 'bg-emerald-800 hover:bg-emerald-700');
                            }
                        } catch (e) {}
                        return '';
                    })()
                ].filter(Boolean)));
        },
        // ---- 膳堂：吃饭一件事（饭气+街谈一次结完） ----
        sect_canteen: function () {
            modal('🍚 膳堂', para('灶上蒸汽顶着锅盖跳。两张长桌坐满了人，墙角的师弟正把最后一勺汤刮干净。管膳的师傅看见你，抬了抬下巴：「锅里有，自己盛。」')
                + btns([btn('🍲 落座吃饭——饭气养人，桌上有闲话', 'window._closeModal(); window.doSectMeal()')]));
        },
        // ---- 兵器库：领份例 + 铁匠主动问淬火 ----
        sect_armory: function () {
            var w = mainHand();
            var worn = w && typeof w.durability === 'number' && w.durability < 80;
            var smith = w
                ? (worn ? '铁匠接过你的' + (w.name || '兵刃') + '，拇指在刃口上一刮，啧了一声：「卷了。淬一淬吧，趁炉子还热。」' : '铁匠扫了一眼你的' + (w.name || '兵刃') + '：「锋口还利。卷了再来。」')
                : '铁匠在砧子前头也不抬：「领份例找管事，打铁等等——这炉误不得。」';
            modal('🗡️ 兵器库', para('兵器架上枪刀齐整，份例箱摞在门口。炉膛里的火映得半间屋子发红，铁匠的锤声一下一下，像这地方的心跳。')
                + para(smith)
                + btns([
                    btn('📦 领今日份例（门规：一日一次，以均资用）', 'window._closeModal(); window.useFacility(\'sect_armory\')'),
                    (w && typeof W.doTemperWeapon === 'function' ? btn('🔥 让他淬火养护——铁矿×3，锋养半日', 'window._closeModal(); window.doTemperWeapon()', worn ? 'bg-orange-700 hover:bg-orange-600' : 'bg-gray-600 hover:bg-gray-500') : '')
                ].filter(Boolean)));
        },
        // ---- 议事厅：账本挂墙上 + 闲坐 + 近事 + 进言 ----
        sect_chat: function () {
            var sect = ds().sectName || ds().sectId;
            var ledgerLine = '（账本还没挂起来）';
            try {
                var es = W.sectLedgerEntries ? W.sectLedgerEntries() : [];
                if (es.length) {
                    var inc = 0, out = 0;
                    es.forEach(function (e) { if (e.amt > 0) inc += e.amt; else out -= e.amt; });
                    ledgerLine = '近来进账 ' + inc + ' 贡献、开销 ' + out + '——你的名字在不在上头，自己看。';
                }
            } catch (e) {}
            modal('🏛️ 议事厅', para('厅里茶气缭绕。西墙挂着公中账本，纸角被翻得发毛；几个同门围坐闲话，见你进来挪了挪位子。')
                + para('<span class="text-xs text-gray-500">墙上的账：' + ledgerLine + '</span>')
                + btns([
                    (function () {
                        try { if (window.eventFlags && window.eventFlags['sect_succ']) return btn('🌩️ 继位风波——两位长老的旗号摆开了，该你表态', 'window._closeModal(); window.openSuccessionPanel()', 'bg-red-800 hover:bg-red-700'); } catch (e) {}
                        return '';
                    })(),
                    btn('🏛️ 与同门闲坐——话头长短随缘', 'window._closeModal(); window.useFacility(\'sect_chat\'); window.sectRoomTrain(\'social\')'),
                    btn('📋 看外务榜——门里从江湖接的活（真仗真酬）', 'window._closeModal(); window.openErrandBoard && window.openErrandBoard()', 'bg-amber-800 hover:bg-amber-700'),
                    btn('📖 翻族谱——腰牌、师承、功过、殁录，一门的名分都在这本册子里', 'window._closeModal(); window.openSectRoster && window.openSectRoster()', 'bg-stone-700 hover:bg-stone-600'),
                    btn('📜 听门中近事——掌门长老们这些天在做什么', 'window._closeModal(); window.SectGov && window.SectGov.openPanel(\'' + sect + '\')', 'bg-teal-800 hover:bg-teal-700'),
                    (function () {
                        var rank = ds().rank == null ? 7 : ds().rank;
                        return rank <= 4 ? btn('🙋 进言——把你主张的章程递上去（贡献30，明日定夺）', 'window._closeModal(); window.SectGov && window.SectGov.openPanel(\'' + sect + '\')', 'bg-amber-800 hover:bg-amber-700') : '';
                    })()
                ].filter(Boolean)));
        },
        // ---- 修炼洞府：打坐 ----
        sect_cave: function () {
            modal('🧘 修炼洞府', para('静室里蒲团摆得端正，一炷香烧到一半。石壁沁着凉气，外头的风声到这儿就低了。')
                + btns([
                    btn('🧘 坐下打坐——一坐便是一个半时辰', 'window._closeModal(); window.useFacility(\'sect_cave\'); window.sectRoomTrain(\'study\')'),
                    (function () {
                        try {
                            if (typeof window.sectEveningClassOpen === 'function' && window.sectEveningClassOpen() && window.eventFlags['sect_class_evening'] !== (window.timeSystem.getAbsoluteDay ? window.timeSystem.getAbsoluteDay() : -1)) {
                                return btn('🌆 去听晚课——酉时经堂，执经师叔念一段讲一段', 'window._closeModal(); window.doEveningClass()', 'bg-indigo-800 hover:bg-indigo-700');
                            }
                        } catch (e) {}
                        return '';
                    })()
                ].filter(Boolean)));
        }
    };

    // 藏经阁：进门即书阁（分层阅览本就深，不再套壳）
    function openLibraryRoom() {
        train('study');
        if (typeof W.openSectLibraryPanel === 'function') W.openSectLibraryPanel();
        else useFac('sect_library');
    }

    // 地标：场景里织进熟识，深交是场景里的选项
    function openLandmarkRoom(fid) {
        var fac = null;
        try {
            var ex = W.SECT_FACILITY_EXTRAS || {};
            var sect = ds().sectName || ds().sectId;
            (ex[sect] || []).forEach(function (f) { if (f.id === fid) fac = f; });
        } catch (e) {}
        if (!fac) { useFac(fid); return; }
        var tierWord = '', bondLine = '';
        try {
            var b = Number((ds()._facLife && ds()._facLife.bond && ds()._facLife.bond[fid]) || 0);
            var tier = b >= 12 ? 3 : b >= 7 ? 2 : b >= 3 ? 1 : 0;
            tierWord = ['陌生', '熟识', '亲密', '知交'][tier];
            bondLine = ['守处的人对你点点头，没多话。', '守处的同门认得你了：「来了？老地方。」', '你闭着眼都找得到最养人的那个位置。', '这方天地认得你的气息——增益厚到了顶处。'][tier];
        } catch (e) {}
        var canDeep = false;
        try { canDeep = (Number((ds()._facLife && ds()._facLife.bond && ds()._facLife.bond[fid]) || 0) < 12); } catch (e) {}
        modal((fac.icon || '🌸') + ' ' + fac.name, para((fac.desc || '') + '——' + bondLine)
            + para('<span class="text-xs text-gray-500">熟识：' + tierWord + '（常来则熟，熟则此地的气息待你亲厚，增益逐档加厚）</span>')
            + btns([
                btn('🌸 照常用一回', 'window._closeModal(); window.useFacility(\'' + fid + '\')'),
                (typeof W.openTrialPanel === 'function' ? btn('🌫️ 深入试炼——此地深处藏着祖师留下的关（五层真仗）', 'window._closeModal(); window.openTrialPanel(\'' + fid + '\')', 'bg-red-800 hover:bg-red-700') : ''),
                (canDeep ? btn('🤝 多留半日，替守处做些实事——深交（贡献30，熟识+3）', 'window._closeModal(); window.doDeepenBond(\'' + fid + '\')', 'bg-pink-800 hover:bg-pink-700') : '')
            ].filter(Boolean)));
    }

    // ============ 门里的整合动作 ============
    W.sectRoomTrain = function (kind) { train(kind); };

    // 问诊：旧伤新伤一起治（药材出公库丹药；库空医师为难——不分成两个选项）
    W.doSectMedical = function () {
        var d = ds(); if (!d) return false;
        var r = useFac('sect_medical', true);   // 基础诊治：诊金+疗伤（既有经济口径）
        if (r && r.ok === false) { msg(r.reason || '诊金不够。', 'warning'); return false; }
        var ws = wounds();
        if (ws.length) {
            var pill = pillStock();
            var cured = 0;
            while (cured < ws.length && pill >= 5) {
                try { W.SectGov.deductStore(d.sectName || d.sectId, 'pill', 5); } catch (e) { break; }
                pill -= 5; cured++;
            }
            if (cured > 0) {
                var names = ws.slice(0, cured).map(function (w) { return w.part; }).join('、');
                d._facLife.oldWounds = ws.slice(cured);
                log('💊 医者用丹药库的存货替你化了' + names + '的陈年淤滞——银针下去，一阵刺痛，那块地方松快了。（公库丹药-' + (cured * 5) + '炉）', 'success');
                msg('💊 旧伤愈了' + cured + '处。（药材出自公中）', 'success');
            }
            if (cured < ws.length) {
                log('💊 医者翻遍了药柜，摇头：「丹药库空了，剩下的只能将养——热敷着，别动气。」（还有' + (ws.length - cured) + '处旧伤没治）', 'warning');
                msg('丹药库不够，剩下' + (ws.length - cured) + '处旧伤只能将养。', 'warning');
            }
        } else {
            if (r && r.text) msg(r.text, 'success');
        }
        return true;
    };
    // 坐诊帮手：医药底子弟子的帮工（练功底+门里记功）
    W.doSectClinicHelp = function () {
        var d = ds(); if (!d) return false;
        try { if (W.timeSystem && W.timeSystem.advanceTime) W.timeSystem.advanceTime(120, '医馆帮工'); } catch (e) {}
        train('heal');
        try { if (typeof W.sectAddContribution === 'function') W.sectAddContribution(5, '医馆坐诊帮手'); } catch (e) {}
        var lines = [
            '🌿 你替医师研了半日药。药臼沉，手腕酸——医师看你研得匀，点头：「手稳。」（贡献+5，底子长进）',
            '🌿 半日坐诊，你认全了三十味药的品相。有个孩子发烧，你替他煎的药——退得快。（贡献+5，底子长进）',
            '🌿 医师教了你一手认毒：叶背发乌的，十有九毒。你把这句记进了心里。（贡献+5，底子长进）'
        ];
        var line = lines[Math.floor(Math.random() * lines.length)];
        log(line, 'success'); msg(line, 'success');
        return true;
    };
    // 用膳：吃饭一件事（饭气+街谈一次结完；丐帮底子多听一条）
    W.doSectMeal = function () {
        var d = ds(); if (!d) return false;
        var r = useFac('sect_canteen', true);   // 份例饭（门规一日两膳）
        if (r && r.ok === false) { msg(r.reason || '灶上没你的份了。', 'info'); return false; }
        try { if (typeof W.applyBuff === 'function') W.applyBuff('sect_canteen_meal', { constitution: 3, willpower: 2 }, 12); } catch (e) {}
        var rumor = null;
        try {
            var qs = (W.eventFlags || {})['qi_street'];
            if ((W.eventFlags || {})['qi_route'] && qs && qs.length) rumor = qs[qs.length - 1].text;
        } catch (e) {}
        if (!rumor) {
            var POOL = [
                '邻桌两个师弟在争论上回大比谁该夺魁，争到面红耳赤，最后一同出门练去了。',
                '打饭的师傅说，山下镇子今儿来了个游方货郎，卖的都是些稀奇古怪的玩意儿。',
                '有人压低声音讲，后山近日闹灵兽，巡夜的师兄多了两倍。',
                '灶上蒸着新米，香得整个膳堂都是。有师弟感叹：能安稳吃口热饭，比什么都强。'
            ];
            try { rumor = POOL[Math.floor((W.timeSystem.getAbsoluteDay() || 0)) % POOL.length]; } catch (e) { rumor = POOL[0]; }
        }
        var line = '🍲 一顿热饭下肚，饭气养人（体魄+3 心境+2，半日）。席间听见——' + rumor.replace(/^👂[^：]*：/, '');
        // 丐帮「百耳通街」：耳朵长在墙根，多听一条
        try {
            if (typeof W.sectPassiveHas === 'function' && W.sectPassiveHas('ears')) {
                var EXTRA = [
                    '散席时跑堂的小厮擦着桌子跟你咬耳朵：城西当铺收过一件带血的玉佩。',
                    '你多坐了一盏茶的功夫，听墙角那桌压着嗓子说：南边粮船这个月少了三条。',
                    '出门时守门的杂役冲你抬抬下巴：「昨儿夜里，有辆没点灯的车出城。」'
                ];
                try { line += '\n👂 你的耳朵比人多——' + EXTRA[Math.floor((W.timeSystem.getAbsoluteDay() || 0) / 2) % EXTRA.length]; } catch (e) {}
            }
        } catch (e) {}
        train('social');
        log(line, 'info'); msg(line, 'success');
        return true;
    };

    console.log('[sect-rooms] 一栋建筑一扇门已注册：医馆问诊一体化（旧伤+公库丹药）/演武场三事/膳堂一饭/兵器库铁匠开口/议事厅账本上墙/地标熟识织入场景');
})();
