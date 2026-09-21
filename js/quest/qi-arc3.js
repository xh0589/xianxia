// ==================== qi-arc3.js - 《灵气之尽》无视线 忽-01~06（main_050~055；旧正典 main_021~035 存活占用，重编号避让） ====================
// v25.0 推倒重写 · 批三：衰减的日子 / 历书小决策 / 三回叩门（盟帖·灯下·屋顶邀酒） / 走到黑 / 终拍
// 对齐：主线大纲·灵气之尽.md 无视线节 + 8.3 盘点表 + 11.4⑧ 屋顶邀酒换皮定稿（年龄铁设定：自称只有「本座」）
// 纪律：世界大事从你门前路过，你不接它就走；锁「去」不锁「不去」；真仗败可再战（_isQiStory）；
//       旗标全 qi_* 前缀；玩家可见文本零外文字母零配额句式零裸数值。
(function () {
    'use strict';
    var W = window;

    function flags() { return (W.eventFlags = W.eventFlags || {}); }
    function absDay() {
        try { return W.timeSystem && W.timeSystem.getAbsoluteDay ? W.timeSystem.getAbsoluteDay() : 0; } catch (e) { return 0; }
    }
    function log(m, t) {
        if (W.gameLog && W.gameLog.add) W.gameLog.add(m);
        else if (W.showMessage) W.showMessage(m, t || 'info');
    }
    function say(m, t) { if (W.showMessage) W.showMessage(m, t || 'info'); }
    function isMale() { return !!(W.currentCharData && W.currentCharData.gender === 'male'); }
    function record(id, title) { if (typeof W.recordChoice === 'function') { try { W.recordChoice(id, title || '衰减的日子'); } catch (e) {} } }
    function _close() { if (typeof W.qiCloseModal === 'function') W.qiCloseModal(); }
    function modal(title, body) {
        _close();
        var wrap = '<div class="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4" id="qi-modal-overlay">'
            + '<div class="bg-gray-900 border-2 border-gray-600 rounded-xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto">'
            + '<h2 class="text-xl font-bold text-gray-300 mb-3 text-center">' + title + '</h2>' + body + '</div></div>';
        if (document.body && document.body.insertAdjacentHTML) document.body.insertAdjacentHTML('beforeend', wrap);
    }
    function btn(label, onclick, cls) {
        return '<button onclick="' + onclick + '" class="' + (cls || 'bg-gray-600 hover:bg-gray-500') + ' text-xs px-3 py-2 rounded text-left">' + label + '</button>';
    }
    function btns(arr) { return '<div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">' + arr.join('') + '</div>'; }
    function para(t) { return '<p class="text-sm text-gray-300 leading-relaxed mb-2">' + t + '</p>'; }
    function lock(text) { return '<div class="bg-gray-700/50 text-xs px-3 py-2 rounded text-left text-gray-500 cursor-not-allowed">' + text + '</div>'; }
    function realmTier() {
        try { return typeof W.getRealmTier === 'function' ? W.getRealmTier((W.currentCharData || {}).realm) : 6; } catch (e) { return 6; }
    }
    function street(text) {
        var f = flags();
        if (!f['qi_street'] || !f['qi_street'].push) f['qi_street'] = [];
        f['qi_street'].push({ day: absDay(), text: text });
    }
    function addItem(id) { if (typeof W.addItem === 'function') { try { W.addItem(id, 1); } catch (e) {} } }
    // 批C · 日子流：营生进出都是真灵石（单一口径：DataManager 优先，回落 inventory.currency）
    function stonesGet() {
        try { if (W.XianXia && W.XianXia.DataManager && W.XianXia.DataManager.getSpiritStones) return Number(W.XianXia.DataManager.getSpiritStones()) || 0; } catch (e) {}
        return (W.inventory && W.inventory.currency && Number(W.inventory.currency.spiritStones)) || 0;
    }
    function stonesPay(n) {
        if (stonesGet() < n) return false;
        try { if (W.XianXia && W.XianXia.DataManager && W.XianXia.DataManager.deductSpiritStones) { W.XianXia.DataManager.deductSpiritStones(n); return true; } } catch (e) {}
        if (W.inventory && W.inventory.currency) { W.inventory.currency.spiritStones -= n; return true; }
        return false;
    }
    function stonesAdd(n) {
        try { if (W.XianXia && W.XianXia.DataManager && W.XianXia.DataManager.addSpiritStones) { W.XianXia.DataManager.addSpiritStones(n); return; } } catch (e) {}
        if (W.inventory && W.inventory.currency) W.inventory.currency.spiritStones = (Number(W.inventory.currency.spiritStones) || 0) + n;
    }
    function buff(id, eff, hours) { try { if (typeof W.applyBuff === 'function') W.applyBuff(id, eff, hours); } catch (e) {} }

    // ---- 酒坛两件（接酒带走/关窗留窗台——批五结局读旗也读物）----
    var WINE_ITEMS = [
        { id: 'qi_her_wine', name: '她的一坛酒', type: 'material', subtype: 'special', category: 'material', quality: 'PIN1', level: 30, price: 0, stackable: false, desc: '她在屋顶递给你的那坛女儿红，你接了。她说：你来，就有你一份。', icon: '🍶' },
        { id: 'qi_window_wine', name: '窗台的酒坛', type: 'material', subtype: 'special', category: 'material', quality: 'PIN1', level: 30, price: 0, stackable: false, desc: '她留在你窗台上的酒。你没喝，也没舍得扔。', icon: '🍶' }
    ];
    try {
        WINE_ITEMS.forEach(function (it) {
            if (W.itemById && !W.itemById[it.id]) {
                W.itemById[it.id] = it;
                if (W.allItems && W.allItems.push) W.allItems.push(it);
                if (W.materials && W.materials.push) W.materials.push(it);
            }
        });
    } catch (e) {}

    // ---- 章节注册 main_050~055 ----
    function q(id, title, desc, flag) {
        return {
            id: id, title: title, type: 'main', priority: 10, description: desc,
            objectives: [{ type: 'custom', target: flag, count: 1, completed: false }],
            rewards: { exp: 0, spiritStones: 0, items: [] },
            story: '灵气之尽 · 无视线', accepted: false, completed: false, turnedIn: false
        };
    }
    var QI_ARC3 = [
        q('main_050', '衰减的日子·上', '灵气薄了，日子还得过。世界大事从你门前路过——你不接，它就走。', 'qi_h01'),
        q('main_051', '衰减的日子·下', '日子薄下去。黄昏时，有人敲你的门。', 'qi_h02'),
        q('main_052', '三回叩门', '盟帖、灯下、屋顶——门响三回，回回可开可不开。', 'qi_h03'),
        q('main_053', '枯竭年代·上', '种田、营生、煮茶。日子得有人过。', 'qi_h04'),
        q('main_054', '枯竭年代·下', '街谈里没人提她了，改提粮价。', 'qi_h05'),
        q('main_055', '灵气之尽那夜', '她在动最后一条脉。去，或不去，日子等你一句话。', 'qi_h06')
    ];
    (function register() {
        try {
            var chain = W.mainQuestChain;
            if (chain && chain.push) {
                for (var i = 0; i < QI_ARC3.length; i++) {
                    var has = false;
                    for (var j = 0; j < chain.length; j++) { if (chain[j] && chain[j].id === QI_ARC3[i].id) { has = true; break; } }
                    if (!has) chain.push(QI_ARC3[i]);
                }
            }
            if (W.QuestRegistry && typeof W.QuestRegistry.registerMany === 'function') W.QuestRegistry.registerMany(QI_ARC3);
        } catch (e) {}
    })();
    function accept(id) {
        try {
            var qq = W.QuestRegistry && W.QuestRegistry.get ? W.QuestRegistry.get(id) : null;
            if (qq && !qq.accepted && typeof W.acceptQuest === 'function') W.acceptQuest(id);
        } catch (e) {}
    }
    function finish(id, flagName) {
        var f = flags();
        f[flagName] = true;
        f['qi_h_scene'] = '';
        try {
            var qq = W.QuestRegistry && W.QuestRegistry.get ? W.QuestRegistry.get(id) : null;
            if (qq) { qq.completed = true; qq.turnedIn = true; if (qq.objectives && qq.objectives[0]) qq.objectives[0].completed = true; }
            if (typeof W.updateQuestUI === 'function') W.updateQuestUI();
        } catch (e) {}
    }
    function scene(s) { flags()['qi_h_scene'] = s; }
    function wither(c) { if (typeof W.qiWitherCity === 'function') W.qiWitherCity(c); }

    // ---- 面板按钮（枢纽面板调用；锁「去」不锁「不去」）----
    var SCENE_LABEL = {
        h01: '衰减的日子', h02: '黄昏 · 敲门声', k1: '第一回 · 盟帖', k2: '第二回 · 灯下',
        k2_battle: '护送路上 · 伏兵', k3: '第三回 · 屋顶', h04: '枯竭年代 · 上', h05: '枯竭年代 · 下', h06: '灵气之尽那夜'
    };
    // 境界门：用全序（含真仙/金仙/飞升）——getRealmTier 对飞升后境界按炼气处理，会误锁
    function realmIdx(r) {
        var order = ['凡人', '炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫', '真仙', '金仙', '飞升'];
        var i = order.indexOf(String(r == null ? '' : r));
        if (i >= 0) return i;
        try { return typeof W.getRealmTier === 'function' ? W.getRealmTier(r) : 6; } catch (e) { return 6; }
    }
    function tribGateOk() {
        return realmIdx((W.currentCharData || {}).realm) >= realmIdx('渡劫');
    }
    W.qiIgnoreButtons = function () {
        var f = flags();
        if (f['qi_route'] !== 'ignore' || !f['qi_prologue_done']) return [];
        if (f['qi_ending']) return []; // 批七：结局已定，章节按钮全部收口（面板只剩终幕「回望那一页」）
        var out = [];
        var sc = f['qi_h_scene'];
        if (sc) {
            out.push(btn('▶️ 继续——' + (SCENE_LABEL[sc] || '没走完的日子'), 'window.qiResumeIgnore()', 'bg-gray-600 hover:bg-gray-500'));
        } else if (!f['qi_h01']) {
            out.push(btn('🚶 过你的日子——灵气薄了，日子还得过', 'window.qiStartH01()'));
        } else if (!f['qi_h02']) {
            out.push(btn('🚶 日子薄下去——黄昏时，有人敲你的门', 'window.qiStartH02()'));
        } else if (!f['qi_h03']) {
            out.push(btn('🚶 有人来叩你的门——回回可开，可不开', 'window.qiStartH03()'));
        } else if (!f['qi_h04']) {
            out.push(btn('🍵 种田、营生、煮茶——日子得有人过', 'window.qiStartH04()'));
        } else if (!f['qi_h05']) {
            out.push(btn('🍵 街谈里没人提她了——改提粮价', 'window.qiStartH05()'));
        } else if (!f['qi_h06']) {
            out.push(btn('🌫️ 灵气之尽那夜——去，或不去', 'window.qiStartH06()'));
        } else {
            out.push(lock('🌊 日子还在过。她的账，她的结局——终幕汇流时一并呈上。'));
        }
        return out;
    };
    W.qiResumeIgnore = function () {
        var sc = flags()['qi_h_scene'];
        if (!sc) { if (typeof W.openQiEndgamePanel === 'function') W.openQiEndgamePanel(); return; }
        if (sc === 'k2_battle') { _escortBattle(); return; }
        if (sc === 'h01') _h01();
        else if (sc === 'h02') _h02();
        else if (sc === 'k1') _k1();
        else if (sc === 'k2') _k2();
        else if (sc === 'k3') _k3();
        else if (sc === 'h04') _h04();
        else if (sc === 'h05') _h05();
        else if (sc === 'h06') _h06();
    };

    // ============ 忽-01 衰减的日子 · 上 ============
    W.qiStartH01 = function () {
        if (flags()['qi_h01'] || flags()['qi_h_scene']) { W.qiResumeIgnore(); return; }
        accept('main_050');
        _h01();
    };
    function _h01() {
        scene('h01');
        modal('🚶 衰减的日子 · 上', para('你住的那方小院，气薄了。')
            + para('修炼是你自己身上摸得到的：同样的时辰坐下来，吸进气里的那点东西，比从前少了一截。药园里的灵草蔫头耷脑，熟得比往年晚了半个月——<b class="text-gray-400">这不是错觉，是天地在变薄，账照旧算。</b>')
            + para('邻居搬走了。走的那天他把锄头贱卖给了你：「南边去。听说南边还有气。」')
            + para('认识的修士一个个废了根基。没人打杀——路断了而已。')
            + para('世界大事从你门前路过：货郎说，大漠孤城的脉死透了，红衣的女人抽完就走了，没停留。你听着，往灶里添了把柴，没接话。')
            + btns([btn('🚶 不接——日子是自己的', 'window.qiH01Done()')]));
    }
    W.qiH01Done = function () {
        _close();
        if (flags()['qi_h01']) return;
        finish('main_050', 'qi_h01');
        wither('大漠孤城');
        log('📖 历书上多了一行：今年，大漠孤城脉枯。你翻过那一页，接着过日子。（世界大事从你门前路过——你不接，它就走）', 'info');
    };

    // ============ 忽-02 衰减的日子 · 下（历书小决策：旧识来投） ============
    W.qiStartH02 = function () {
        if (flags()['qi_h02'] || flags()['qi_h_scene']) { W.qiResumeIgnore(); return; }
        accept('main_051');
        _h02();
    };
    function _h02() {
        scene('h02');
        modal('🚶 衰减的日子 · 下', para('又一年过去。冰原城的灯死完了——货郎不再讲这些事，茶馆里只剩粮价。')
            + para('黄昏时分，有人敲你的院门。是个旧识——从前一起喝过酒的散修，根基废了，人瘦得脱了形。他背着铺盖站在门外，没敢进来：')
            + para('「听说你这儿还有口锅……<b class="text-gray-400">要是不方便，你就当没看见我。</b>」')
            + btns([
                btn('🏮 收留——家里多一双筷子', 'window.qiKinChoice(\'took\')', 'bg-emerald-800 hover:bg-emerald-700'),
                btn('🚫 婉拒——自家也有自家的难处', 'window.qiKinChoice(\'turned\')')
            ]));
    }
    W.qiKinChoice = function (c) {
        _close();
        var f = flags();
        if (f['qi_kin']) return;
        f['qi_kin'] = c;
        record('qi_kin_' + c, '衰减的日子');
        if (c === 'took') {
            street('那家门里还亮着修士的灯。有人说傻，有人说——那条街夜里走过去，心里不慌。');
            log('🏮 他住下了。他吃得很少，活抢着干，院子扫得比从前干净。夜里你们偶尔喝一口——他酒量没废，话也没废。街谈里说：那家门里还亮着修士的灯。（结局页会多一行：家里住过一个废掉的老朋友）', 'success');
        } else {
            W.addQiHeart('来投奔的废掉旧识，被你婉拒了。他背着铺盖往更南走，临走说：不怪你，世道就这样。这一笔记在人心簿上——今日的人心。');
            log('🚫 你隔着门跟他说了很久的话。最后你从门缝里递出去三枚灵石，他没要。走的时候他朝你拱了拱手：「不怪你。世道就这样。」你在门里站到天黑。（人心簿一笔：旁观者也有旁观者的账）', 'info');
        }
        finish('main_051', 'qi_h02');
        wither('冰原城');
        log('📖 历书又添一行：今年，冰原城脉枯。粮价涨了两成。（日子薄下去，大事照旧路过）', 'info');
    };

    // ============ 忽-03 三回叩门 ============
    W.qiStartH03 = function () {
        if (flags()['qi_h03'] || flags()['qi_h_scene']) { W.qiResumeIgnore(); return; }
        accept('main_052');
        _k1();
    };
    function _k1() {
        scene('k1');
        modal('🚪 第一回叩门 · 盟帖', para('守脉盟的帖子送到了你家——不问世事的人，也收得到盟帖。')
            + para('使者的口气很客气，话不客气：「盟里借先生的名望一用。另外——盟里有一份名册，先生不妨去看看。」')
            + para('名册上列着「私通脉贼」的名单。你认得上头的几个人。')
            + btns([
                btn('📜 去看一眼名册', 'window.qiKnock1Choice(\'went\')', 'bg-amber-800 hover:bg-amber-700'),
                btn('🚫 原样退回——帖子原样，话也原样', 'window.qiKnock1Choice(\'returned\')')
            ]));
    }
    W.qiKnock1Choice = function (c) {
        _close();
        var f = flags();
        if (f['qi_knock1']) { _k2(); return; }
        f['qi_knock1'] = c;
        record('qi_knock1_' + c, '三回叩门');
        if (c === 'went') {
            street('他不问世事。可他去看了一眼那份名册——回来的路上走得很快，像怕人喊住他。');
            log('📜 你去看了名册。看完什么也没说，把帖子原样放了回去。回家那一路上你走得很快——名册上有几个名字，你认得；有几个位置空着，你怕它填上自己的名字。（「看过名册」旗：终幕到场变体+街谈一条）', 'info');
        } else {
            W.addQiHeart('盟帖你原样退回了。使者笑着说：盟外之人，盟护不到。你关上门——门里是日子，门外是世道。');
            log('🚫 你把帖子原样退回。使者收起帖子，笑得很慢：「盟外之人——盟护不到。」你关上了门。门里是日子，门外是世道。（人心簿一笔）', 'info');
        }
        _k2();
    };
    function _k2() {
        scene('k2');
        modal('🚪 第二回叩门 · 灯下', para('后半夜，有人跪在你门前。')
            + para('是个老掌门——三年前你路过他的山门，他给你留过一盏灯、一顿饭。那顿饭还在你身上。')
            + para('如今他的山门散了，三百多口人南迁，路上要过噬骨佣军的地界。老掌门不求你护送到底，只求你陪走半日：')
            + para('「有你在，<b class="text-gray-400">佣兵们会掂量。</b>」')
            + btns([
                btn('⚔️ 提剑护送（真仗——噬骨佣军伏兵）', 'window.qiKnock2Escort()', 'bg-red-800 hover:bg-red-700'),
                btn('🚪 关上门——灯是你留的，路是他们自己的', 'window.qiKnock2Choice(\'closed\')')
            ]));
    }
    function _escortBattle() {
        scene('k2_battle');
        var mul = 1 + 0.15 * realmTier();
        var enemy = {
            name: '噬骨佣军·伏兵头目',
            hp: Math.round(1600 * mul), maxHp: Math.round(1600 * mul),
            attack: Math.round(200 * mul), defense: Math.round(110 * mul), speed: Math.round(85 * mul),
            description: '专挑南迁的队伍下手——三百口人，在佣军账上是三百份货',
            _isQiStory: true, _qiBeat: 'hu_escort'
        };
        log('⚔️ 山口两侧灵绳弩箭齐出——噬骨佣军早候着了。你拔剑站到队伍最前面。（这一仗，你亲手打）', 'danger');
        if (typeof W.startBattle === 'function') W.startBattle(enemy);
    }
    W.qiKnock2Escort = function () { _escortBattle(); };
    W.qiKnock2Choice = function (c) {
        _close();
        var f = flags();
        if (f['qi_knock2']) { _k3(); return; }
        f['qi_knock2'] = c;
        record('qi_knock2_' + c, '三回叩门');
        if (c === 'closed') {
            W.addQiHeart('三年前那盏灯，你没还。门外老掌门跪了半宿，天亮时门前只剩一只空碗——走之前，他还把你门前的地扫了。人心簿重笔：今日之冷。');
            street('说书人添了新段子《灯下客》：某把剑没有出鞘，三百口人自己走了夜路。没人问那把剑是谁家的——问的人，自己心里有数。');
            log('🚪 你没开门。你在门里坐了一夜，听见门外的咳嗽声到天亮才走。第二天，《灯下客》的段子满城都是。说书人不点名，你听完了全场。（人心簿重笔；账单页会有一行：那盏灯没还）', 'warning');
        }
        _k3();
    };
    W._qiSettleExtraB = function (win, beat) {
        if (beat === 'hu_escort') {
            if (win) {
                var f = flags();
                if (f['qi_knock2']) return;
                f['qi_knock2'] = 'escort';
                record('qi_knock2_escort', '三回叩门');
                W.addQiGrace('灯下三百口：你护送他们过了噬骨佣军地界，一个没少。老掌门给你立了块长生牌——没问过你要不要。');
                street('三百口人南迁，一个没少。有人说是有把剑陪了半日。剑是谁家的，没人说——长生牌上刻着呢。');
                log('🕯️ 佣军的伏兵被打散了。三百口人平平安安到了南边。临别老掌门朝你长揖到底，什么也没说——三个月后你听说，南边的村口多了一块长生牌，牌上刻的是你的姓。（终战兑现：南边来的人，会为你走一千里）', 'success');
                _k3();
            } else {
                scene('k2_battle');
                say('💔 佣军的灵绳弩箭把你围住了。老掌门拼死把你拖了出来——队伍还没动身，他们在等你。（回面板可再战）', 'warning');
            }
            return;
        }
        // 批四追随线的剧情战继续往下分流
        if (typeof W._qiSettleExtraC === 'function') { try { W._qiSettleExtraC(win, beat); } catch (e) {} }
    };
    function _k3() {
        if (flags()['qi_knock3']) { _finishH03(); return; }
        scene('k3');
        var wineLine = isMale()
            ? '「灵脉尽头的风景，本座一个人看没意思——小没良心的，陪本座去一趟？」'
            : '「天下人躲本座还来不及——就你，见了本座连窗都不关。」';
        var lowLine = isMale()
            ? '「……说真的。那头要真不是好地方，九州就剩你一个，本座信得过。」'
            : '「动完了，本座就去灵脉尽头。一个人去，没意思。……你跟我是一路人。一路人，送本座一程？」';
        modal('🚪 第三回叩门 · 屋顶', para('你是被瓦片上的酒香弄醒的。')
            + para('她坐在你家屋顶，晃着腿，手里一坛不知哪儿摸来的女儿红。血海之主，孤身一个，没带刀。')
            + para('「本座要动最后一条脉了。」她冲你举了举坛子，' + wineLine)
            + para('她顿了顿，声音低下来：' + lowLine)
            + btns([
                btn('🍶 接酒——上屋顶，陪她坐坐', 'window.qiKnock3Choice(\'wine\')', 'bg-purple-800 hover:bg-purple-700'),
                btn('🪟 关窗——灯吹了，装睡', 'window.qiKnock3Choice(\'window\')')
            ]));
    }
    W.qiKnock3Choice = function (c) {
        _close();
        var f = flags();
        if (f['qi_knock3']) return;
        f['qi_knock3'] = c;
        record('qi_knock3_' + c, '三回叩门');
        if (c === 'wine') {
            addItem('qi_her_wine');
            if (typeof W.addQiHeartBond === 'function') W.addQiHeartBond(20, '屋顶接了她的酒');
            log('🍶 你上了屋顶。她不劝你入伙，不怪你不问世事——你们就坐着，一坛酒喝到见底，说的全是不要紧的话：米价、瓦上的猫、她小时候镇上那个面摊。天亮前她晃了晃空坛子：「灵气之尽那夜，本座在脉尽头。你来，就有你一份。」她把新满的一坛塞给你，跳下屋顶走了。（交心账一笔；得「她的一坛酒」——终战她等你、替你挡一波；酒坛带进结局）', 'success');
        } else {
            addItem('qi_window_wine');
            log('🪟 你关了窗，吹了灯，躺下装睡。瓦上的声音坐了很久，没有敲窗，没有骂你。天快亮时，你听见轻轻一声：「也罢。日子人过日子，本座不怪。」脚步声没了。早上窗台上多了一坛酒，没有字条。你没喝，也一直没舍得扔。（得「窗台的酒坛」——不飞升那日，它会换成新的）', 'info');
        }
        _finishH03();
    };
    function _finishH03() {
        if (flags()['qi_h03']) return;
        finish('main_052', 'qi_h03');
        wither('万毒谷'); wither('青木城');
        if (typeof W.qiSetStage === 'function') W.qiSetStage(2);
        log('📖 历书这一页很厚：万毒谷、青木城相继脉枯。天地灵气薄了一大截——丹炉凉得比往常快，飞舟多走了半日。（一幕毕；世界不等你，哪怕你不出门）', 'warning');
    }

    // ============ 忽-04 枯竭年代 · 上（批C：一次点击改三拍日子流——营生/货郎/煮茶，拍拍有选择有真账） ============
    W.qiStartH04 = function () {
        if (flags()['qi_h04'] || flags()['qi_h_scene']) { W.qiResumeIgnore(); return; }
        accept('main_053');
        _h04();
    };
    function _h04() {
        var f = flags();
        if (!f['_qi_h4_life']) { _h04a(); return; }
        if (!f['_qi_h4_peddler']) { _h04b(); return; }
        _h04c();
    }
    function _h04a() {
        scene('h04');
        var kin = flags()['qi_kin'];
        modal('🍵 枯竭年代 · 上', para('剑阁空了，炎城的火灭了。这些事你都没有去看——货郎和流民会讲给你听，讲得比历书细。')
            + para('你种田、营生、煮茶。修为停在原来的境界上——气太薄了，再往前是糟蹋自己。奇怪的是，你并不觉得可惜。')
            + (kin === 'took'
                ? para('院子里，收留的那个旧识在扫落叶。他扫得很慢，很认真——废掉的人手里的活，都是这么扫的。')
                : para('院子里只有你一个人的脚印。扫帚靠在墙边，落叶积到门槛——你懒得扫了，风会替你扫。'))
            + para('街谈里偶尔还提她：有人骂，有人谢，更多人不提——<b class="text-gray-400">粮价比她要紧。</b>')
            + para('日子总得有个营生。气薄了，修不动了——这一年，你打算怎么过？')
            + btns([
                btn('🌾 种地——把南坡那块荒了十年的田翻出来', 'window.qiH04Life(\'farm\')', 'bg-lime-800 hover:bg-lime-700'),
                btn('⚖️ 营生——街口支个摊，卖茶也代写家书', 'window.qiH04Life(\'trade\')'),
                btn('📖 开蒙——把邻居的孩子们叫来，教认字', 'window.qiH04Life(\'teach\')', 'bg-sky-800 hover:bg-sky-700')
            ]));
    }
    W.qiH04Life = function (c) {
        _close();
        var f = flags();
        if (f['_qi_h4_life']) { _h04b(); return; }
        f['_qi_h4_life'] = c;
        record('qi_h4_life_' + c, '枯竭年代·营生');
        if (c === 'farm') {
            buff('qi_h4_farm', { constitution: 4 }, 72);
            street('南坡那块田又冒绿了。村里人说，那是个仙人种的——仙人种的田，垄都是直的。');
            log('🌾 你把南坡的荒田翻了出来。头一锄下去，腰比剑先酸。三个月后垄上冒绿，村里人隔着篱笆看：「仙人种的田，垄都是直的。」（体魄增益三日——地里的活是真修行）', 'success');
        } else if (c === 'trade') {
            stonesAdd(60);
            street('街口那个卖茶代写家书的摊子，秤给得高，字也写得正。赶集的人都愿意在那儿歇脚。');
            log('⚖️ 你在街口支了个摊——卖茶，也代写家书。写信的多半是逃荒人家的儿子，收信的多半已经不认得儿子的字了。头一个月，灵石进账六十枚。（灵石+60）', 'success');
        } else {
            buff('qi_h4_teach', { intelligence: 4 }, 72);
            street('村东头传来念书声。教书的是个不出声的修士，孩子们怕他，又都想去——他认字认得多，还讲天上从前的事。');
            log('📖 你把邻居的孩子们叫到院里，一人发一根树枝，教他们在土上写字。第一个字教的是「人」。孩子们问仙人写不写字，你说写——写历书。（神识增益三日）', 'success');
        }
        _h04b();
    };
    function _h04b() {
        scene('h04');
        modal('🧺 货郎的账', para('每月初七，货郎挑着担子从门前过。他的消息比历书细，也比历书快——哪座城的门关了，哪条道上又有兽群，他都门儿清。')
            + para('这个月初七，他放下担子，搓着手：「先生，今儿有三桩买卖，您看顾一桩？」')
            + btns([
                btn('🗺️ 买南边粮道的消息（灵石二十）', 'window.qiH04Peddler(\'news\')', 'bg-amber-800 hover:bg-amber-700'),
                btn('🗡️ 把闲着的飞剑卖给他（灵石八十）', 'window.qiH04Peddler(\'sword\')'),
                btn('🍵 都不买——留他喝碗茶，听他白说', 'window.qiH04Peddler(\'tea\')', 'bg-gray-600 hover:bg-gray-500')
            ]));
    }
    W.qiH04Peddler = function (c) {
        var f = flags();
        if (f['_qi_h4_peddler']) { _close(); _h04c(); return; }
        if (c === 'news' && !stonesPay(20)) { _close(); say('身上凑不出二十灵石——货郎赔笑：「消息不赊账，先生见谅。」', 'warning'); _h04b(); return; }
        _close();
        f['_qi_h4_peddler'] = c;
        record('qi_h4_peddler_' + c, '枯竭年代·货郎');
        if (c === 'news') {
            street('货郎说，南边三座城的粮道还开着——关卡认粮不认人，只要车上有粮，修士凡人一个样。');
            log('🗺️ 你买了南边粮道的消息：三座城的关卡如今认粮不认人。货郎压低声音补了一句：「先生，如今这世道，会种地的比会飞的吃得开。」（灵石-20——消息是真的，日子也是真的）', 'info');
        } else if (c === 'sword') {
            stonesAdd(80);
            street('货郎收了一柄飞剑，转手卖给了铁匠——铁匠熔了打农具。村里人说，仙人也卖剑了，这天是真变了。');
            log('🗡️ 你把那柄闲了多年的飞剑卖给了货郎。他掂了掂：「八十灵石。先生，如今铁比剑贵。」剑进了熔炉，出来的会是犁。（灵石+80——剑没有哭，你也没有）', 'success');
        } else {
            street('货郎在先生家喝了碗茶，白说了半个时辰。他说这样的主顾，他一个月就盼这一家。');
            log('🍵 你留货郎喝了碗茶。他白说了半个时辰：她的故事在茶馆里从压轴挪到了开场——「开场是要散场的，先生。」他说这话的时候在添第二碗茶，头也没抬。', 'info');
        }
        _h04c();
    };
    function _h04c() {
        scene('h04');
        var kin = flags()['qi_kin'];
        modal('🍵 煮茶', para('入夜，你烧水、煮茶。' + (kin === 'took'
            ? '旧识坐在对面，就着一碟咸菜，喝得很慢。他说这样的日子他从前看不上——如今他替你们两个人珍惜。'
            : '茶是粗茶，水是井水，一个人喝，喝得很安静。'))
            + para('气比昨天又薄了一分。你探了探，没在意——<b class="text-gray-400">日子得有人过，你过你的。</b>')
            + btns([btn('🍵 就这样，把这一年过完', 'window.qiH04Done()')]));
    }
    W.qiH04Done = function () {
        _close();
        if (flags()['qi_h04']) return;
        finish('main_053', 'qi_h04');
        wither('剑阁'); wither('炎城');
        log('📖 历书：剑阁、炎城脉枯。茶馆里说书人的段子换了三茬，她的故事从压轴挪到了开场——开场是要散场的。（日子过你的，红线爬红线的）', 'warning');
    };

    // ============ 忽-05 枯竭年代 · 下（批C：四拍日子流——浣衣架/晨课/说书人/接着过） ============
    W.qiStartH05 = function () {
        if (flags()['qi_h05'] || flags()['qi_h_scene']) { W.qiResumeIgnore(); return; }
        accept('main_054');
        _h05();
    };
    function _h05() {
        var f = flags();
        if (!f['_qi_h5_fight']) { _h05a(); return; }
        if (!f['_qi_h5_gong']) { _h05b(); return; }
        if (!f['_qi_h5_teller']) { _h05c(); return; }
        _h05d();
    }
    function _h05a() {
        scene('h05');
        modal('🍵 枯竭年代 · 下', para('洛水成了凡间的河。浣衣的妇人吵了一架——吵得很世俗，很热闹：王家占了李家洗了三年的那块平石头。你站着听了一会儿，忽然明白：枯竭年代真的把日子过到这里了。')
            + para('街谈里没人提她了。提粮价，提南边，提谁家的儿子长大了。<b class="text-gray-400">她像天气一样——人人都在她底下过日子，但没人天天谈论天气。</b>')
            + para('两家越吵越近，棒槌都举起来了。河畔几十双眼睛看着你——这条街上，你是唯一「从前的人物」。')
            + btns([
                btn('🤝 劝一句——石头轮流用，一天一家', 'window.qiH05Fight(\'part\')', 'bg-emerald-800 hover:bg-emerald-700'),
                btn('👀 站着听完——世俗的事，世俗自己了', 'window.qiH05Fight(\'watch\')'),
                btn('🪣 打水回家——锅里的粥要糊了', 'window.qiH05Fight(\'leave\')', 'bg-gray-600 hover:bg-gray-500')
            ]));
    }
    W.qiH05Fight = function (c) {
        _close();
        var f = flags();
        if (f['_qi_h5_fight']) { _h05b(); return; }
        f['_qi_h5_fight'] = c;
        record('qi_h5_fight_' + c, '枯竭年代·河畔');
        if (c === 'part') {
            street('河畔那场架是个不出声的修士劝下来的——石头一天一家，两家都服。后来那石头有了名字，叫「轮流石」。');
            log('🤝 你只说了一句话：「石头一天一家，王家先用。」两家都愣了愣，都服了——不是服理，是服你从前是个仙人。你打水回家，身后河畔的吵闹声换了内容：从吵架换成了商量秋菜。（街谈一条：轮流石）', 'success');
        } else if (c === 'watch') {
            street('河畔吵了半个时辰，最后两家各让了半步。围观的人里有个修士，从头听到尾，一句话没说——有人说他高深，有人说他凉薄。');
            log('👀 你站着听完了全场。吵到日头偏西，两家各让半步：石头共用，棒槌不共用。你学到一件事——世俗的事，世俗自己了得比你想的快。你只是个看客，看客也有看客的收获。（街谈一条：那个不说话的修士）', 'info');
        } else {
            log('🪣 你打了水回家。锅里的粥没糊——掐着时辰回来的。身后河畔的吵声慢慢矮下去，矮成了商量。日子就是这样：架吵不长久，粥要趁热。（无账可记——但这也是一种过法）', 'info');
        }
        _h05b();
    };
    function _h05b() {
        scene('h05');
        modal('🧘 晨课', para('这些年你落下了一个新功课：早上行功之前，先探一探——今天的气还剩多少。')
            + para('今早的气比昨天薄了一线，薄得很匀，像一匹布抽掉了一根丝。探完了，你坐下来，把这一缕薄气从头引到尾——<b class="text-gray-400">日子被你过成了另一种修行。</b>')
            + btns([btn('🌀 行功——气薄，就练「省着用」', 'window.qiH05Gong()')]));
    }
    W.qiH05Gong = function () {
        _close();
        var f = flags();
        if (f['_qi_h5_gong']) { _h05c(); return; }
        f['_qi_h5_gong'] = absDay() || 1;
        var stage = Number(f['qi_stage'] || 2);
        if (stage >= 3) {
            log('🌀 一个周天走下来，丹田里空得像口老井。你收了功，在院里站了一会儿——三档的年头，行功不是修行，是省着花。（无事发生，日子照过）', 'info');
        } else {
            buff('qi_h05_gong', { meridian: 3 }, 48);
            log('🌀 一个周天走下来，你在气最薄的缝里摸到了一丝清明——像浑水里沉淀出的一小捧清。（经脉增益两日：省着用的功夫，也是功夫）', 'success');
        }
        _h05c();
    };
    function _h05c() {
        scene('h05');
        modal('📖 说书人的开场', para('集市口的说书人又开新场了。她的故事挪到了开场——开场是要散场的，散场的段子没人记得住。')
            + para('今天这段说的是「红衣女拆天梯」。说到一半，说书人卡了壳：他不知道她图什么。台下有人喊：「图个痛快！」众人哄笑。')
            + para('你站在人群后头。你知道答案——或者，你比这里所有人知道得多一点。')
            + btns([
                btn('🪙 赏他十灵石——段子糙，饭碗不糙', 'window.qiH05Teller(\'tip\')', 'bg-amber-800 hover:bg-amber-700'),
                btn('🗣️ 纠一句——「她不是图痛快」', 'window.qiH05Teller(\'fix\')'),
                btn('🚶 不听——转身去买菜', 'window.qiH05Teller(\'go\')', 'bg-gray-600 hover:bg-gray-500')
            ]));
    }
    W.qiH05Teller = function (c) {
        var f = flags();
        if (f['_qi_h5_teller']) { _close(); _h05d(); return; }
        if (c === 'tip' && !stonesPay(10)) { _close(); say('摸遍全身凑不出十灵石——你朝说书人拱了拱手，算是赏了。', 'info'); _h05c(); return; }
        _close();
        f['_qi_h5_teller'] = c;
        record('qi_h5_teller_' + c, '枯竭年代·说书人');
        if (c === 'tip') {
            street('说书人收了个陌生客的赏，十灵石，够他换半个月的开场白。他没改段子——但那天收场时，他朝人群后头作了个揖。');
            log('🪙 你赏了他十灵石。他愣了愣，收场时朝你作揖：「先生的赏，买的不是这段书——是往后还能说书。」你摆摆手走了。（灵石-10；他的饭碗稳了半月）', 'success');
        } else if (c === 'fix') {
            street('有人当众纠了说书人一句：「她不是图痛快。」说书人追问下文，那人只说了四个字——「她图平等」。第二天，开场白就改了。');
            try { if (typeof W.qiJournalNote === 'function') W.qiJournalNote('说书人改词', '集市口的段子改了口：红衣女拆天梯，不图痛快，图平等。改词的人没留名。'); } catch (e) {}
            log('🗣️ 你开了口：「她不是图痛快。」满场看你。你只补了四个字：「她图平等。」第二天，开场白改了——说书人逢人就说这是位高人点的。（大事记一笔：段子改了口；没人知道高人住哪条街）', 'success');
        } else {
            street('那个常来听开场的先生，今天没听完就走了——去买菜了。菜摊的人说，先生挑菜比听书认真。');
            log('🚶 你转身去买菜。身后哄笑还在继续，她的故事还在跑调——但跑调的故事也是故事，总比忘了强。你挑了一棵白菜，掂了掂，很沉。（日子照过）', 'info');
        }
        _h05d();
    };
    function _h05d() {
        scene('h05');
        modal('🌾 接着过', para('一天就这么过去了：河畔的架、晨课的气、集市口的书、手里的菜。')
            + para('历书在你看不见的地方一页页翻红。你不去看——<b class="text-gray-400">二幕的日子，也是日子。</b>')
            + btns([btn('🌾 接着过', 'window.qiH05Done()')]));
    }
    W.qiH05Done = function () {
        _close();
        if (flags()['qi_h05']) return;
        finish('main_054', 'qi_h05');
        wither('洛水城');
        if (typeof W.qiSetStage === 'function') W.qiSetStage(3);
        log('📖 历书：洛水城脉枯。城外大阵的灯暗成了豆子色——天地灵气薄到这份上，九州的人都知道：再这么下去，人间要变成凡人的人间了。（二幕毕；只剩长安，和血海坝下那最后一条脉）', 'warning');
    };

    // ============ 忽-06 终拍 · 灵气之尽那夜 ============
    W.qiStartH06 = function () {
        if (flags()['qi_h06'] || flags()['qi_h_scene']) { W.qiResumeIgnore(); return; }
        accept('main_055');
        _h06();
    };
    function _h06() {
        scene('h06');
        wither('帝都·长安');
        var goBtn = tribGateOk()
            ? btn('🌊 去——最后看一眼', 'window.qiFinaleChoice(\'go\')', 'bg-cyan-800 hover:bg-cyan-700')
            : lock('🔒 脉尽头之威，肉身难近——需渡劫修为，才站得住潮声里。（锁「去」，不锁「不去」）');
        modal('🌫️ 灵气之尽那夜', para('这一夜，连风都是静的。长安的脉枯了——你在院里就听见了那声闷响，像很远的地方塌了一座山。')
            + para('你知道：她在动最后一条脉了。血海坝下，天下最后一缕灵气正在入海。')
            + para('去，或不去。日子等你一句话。')
            + btns([goBtn, btn('🚶 不去——关上门，日子还长', 'window.qiFinaleChoice(\'stay\')')]));
    }
    W.qiFinaleChoice = function (c) {
        _close();
        var f = flags();
        if (f['qi_h06']) return;
        if (c === 'go' && !tribGateOk()) {
            say('脉尽头之威，肉身难近——需渡劫修为，才站得住潮声里。', 'warning');
            _h06();
            return;
        }
        record('qi_ignore_' + c, '灵气之尽那夜');
        f['qi_finale_ignore'] = c;
        finish('main_055', 'qi_h06');
        if (c === 'go') {
            log('🌊 你动身了。' + (f['qi_knock3'] === 'wine'
                ? '怀里那坛酒还在——她说过：你来，就有你一份。'
                : '你什么也没带——或者说，你把这些年的日子都带上了，一路走到脉尽头。')
                + '（第三幕开启：汇流——血海坝下，她在等你）', 'danger');
        } else {
            log('🚶 你没有去。那一夜天边的云是红的，红了整整一夜，第二天早上，天地之间安静得像一口空井——她把要做的事做完了。你烧水、煮茶、扫院子，做最后一代仙人，把日子过下去。窗台上那坛酒还在。（结局「不飞升·旁观」已入档——终幕汇流时，账单一并呈上）', 'info');
        }
    };

    console.log('[qi-arc3] v25.0《灵气之尽》批三已注册：无视线 忽-01~06（衰减的日子/历书小决策/三回叩门/走到黑/终拍）');
})();
