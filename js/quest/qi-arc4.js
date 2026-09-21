// ==================== qi-arc4.js - 《灵气之尽》追随线 随-01~06（main_040~045） ====================
// v25.0 推倒重写 · 批四：投海 / 拆坝差事 / 大帐点兵 / 崖边夜话+债册拍 / 危机拍 / 讨伐战+真相拍
// 对齐：主线大纲·灵气之尽.md 追随线节 + 8.3 盘点表 + 11.2 交心账 + 11.4⑥ 债册拍拟稿
// 纪律：她的差事从来不是掠夺是拆坝；魅力不是洗白（危机拍无论怎么选都直面代价）；
//       同一问题两次回答（「因为我要」→「梯子不会自己倒」）=她对你逐渐打开；
//       道侣不死不叛不被夺（铁律②）；她不入 bonds、不碰你的道侣（11.1）；真仗败可再战。
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
    function record(id, title) { if (typeof W.recordChoice === 'function') { try { W.recordChoice(id, title || '追随线'); } catch (e) {} } }
    function _close() { if (typeof W.qiCloseModal === 'function') W.qiCloseModal(); }
    function modal(title, body) {
        _close();
        var wrap = '<div class="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4" id="qi-modal-overlay">'
            + '<div class="bg-gray-900 border-2 border-purple-800 rounded-xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto">'
            + '<h2 class="text-xl font-bold text-purple-300 mb-3 text-center">' + title + '</h2>' + body + '</div></div>';
        if (document.body && document.body.insertAdjacentHTML) document.body.insertAdjacentHTML('beforeend', wrap);
    }
    function btn(label, onclick, cls) {
        return '<button onclick="' + onclick + '" class="' + (cls || 'bg-purple-800 hover:bg-purple-700') + ' text-xs px-3 py-2 rounded text-left">' + label + '</button>';
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
    function fame(n) { if (typeof W.addFame === 'function') { try { W.addFame(n); } catch (e) {} } }
    function hb(n, reason) { if (typeof W.addQiHeartBond === 'function') { try { W.addQiHeartBond(n, reason); } catch (e) {} } }
    function wither(c) { if (typeof W.qiWitherCity === 'function') W.qiWitherCity(c); }
    function companionName() {
        try {
            var bonds = (W.currentCharData || {}).bonds || {};
            for (var id in bonds) {
                if (bonds[id] && bonds[id].type === 'dao_companion') {
                    var npc = W.npcManager && W.npcManager.getNPC ? W.npcManager.getNPC(id) : null;
                    return (npc && npc.name) || '你的道侣';
                }
            }
        } catch (e) {}
        return '';
    }
    function sectName() {
        var s = (W.currentCharData || {}).sect;
        return (s && s !== '散修') ? s : '';
    }

    // ---- 章节注册 main_040~045 ----
    function q(id, title, desc, flag) {
        return {
            id: id, title: title, type: 'main', priority: 10, description: desc,
            objectives: [{ type: 'custom', target: flag, count: 1, completed: false }],
            rewards: { exp: 0, spiritStones: 0, items: [] },
            story: '灵气之尽 · 追随线', accepted: false, completed: false, turnedIn: false
        };
    }
    var QI_ARC4 = [
        q('main_040', '投海', '你朝灵脉尽头走过去——不是跪，是站着去。', 'qi_s01'),
        q('main_041', '头一桩差事·拆坝', '她的差事从来不是掠夺，是拆坝。怎么办，你定。', 'qi_s02'),
        q('main_042', '大帐点兵', '下一个目标的名单上，有你认识的门派。', 'qi_s03'),
        q('main_043', '崖边夜话·债册', '她问凡人吃什么；她把债册扔给了你。', 'qi_s04'),
        q('main_044', '算期内的一座城', '兽潮、三千口、半年之期——这本账她让你算。', 'qi_s05'),
        q('main_045', '讨伐军与真相', '他们指名讨伐「从贼」。她说：他们指名你，你就打。', 'qi_s06')
    ];
    (function register() {
        try {
            var chain = W.mainQuestChain;
            if (chain && chain.push) {
                for (var i = 0; i < QI_ARC4.length; i++) {
                    var has = false;
                    for (var j = 0; j < chain.length; j++) { if (chain[j] && chain[j].id === QI_ARC4[i].id) { has = true; break; } }
                    if (!has) chain.push(QI_ARC4[i]);
                }
            }
            if (W.QuestRegistry && typeof W.QuestRegistry.registerMany === 'function') W.QuestRegistry.registerMany(QI_ARC4);
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
        f['qi_f_scene'] = '';
        try {
            var qq = W.QuestRegistry && W.QuestRegistry.get ? W.QuestRegistry.get(id) : null;
            if (qq) { qq.completed = true; qq.turnedIn = true; if (qq.objectives && qq.objectives[0]) qq.objectives[0].completed = true; }
            if (typeof W.updateQuestUI === 'function') W.updateQuestUI();
        } catch (e) {}
    }
    function scene(s) { flags()['qi_f_scene'] = s; }

    // ---- 面板按钮 ----
    var SCENE_LABEL = {
        s01: '灵脉尽头 · 投海', s02: '差事 · 坝前', s03: '大帐 · 点兵',
        s03_assassin_battle: '当夜 · 刺客', s03_vanguard_battle: '先锋 · 破阵',
        s04_talk: '崖边 · 夜话', s04_debt: '灯下 · 债册', s05: '军帐 · 那本账', s06: '城头 · 讨伐战', s06_truth: '血海坝下 · 真相'
    };
    W.qiFollowButtons = function () {
        var f = flags();
        if (f['qi_route'] !== 'follow' || !f['qi_prologue_done']) return [];
        if (f['qi_ending']) return []; // 批七：结局已定，章节按钮全部收口（面板只剩终幕「回望那一页」）
        var out = [];
        var sc = f['qi_f_scene'];
        if (sc) {
            out.push(btn('▶️ 继续——' + (SCENE_LABEL[sc] || '没走完的路'), 'window.qiResumeFollow()', 'bg-purple-800 hover:bg-purple-700'));
        } else if (!f['qi_s01']) {
            out.push(btn('🩸 朝灵脉尽头走过去——她在那儿', 'window.qiStartS01()'));
        } else if (!f['qi_s02']) {
            out.push(btn('🩸 她的头一桩差事：拆坝', 'window.qiStartS02()'));
        } else if (!f['qi_s03']) {
            out.push(btn('🩸 大帐点兵——名单上有你认识的门派', 'window.qiStartS03()'));
        } else if (!f['qi_s04']) {
            out.push(btn('🍜 崖边夜话——她好像想说一碗面', 'window.qiStartS04()'));
        } else if (!f['qi_s05']) {
            out.push(btn('🩸 下一个目标——算期内的那座城', 'window.qiStartS05()'));
        } else if (!f['qi_s06']) {
            out.push(btn('⚔️ 讨伐军到了城下——她要看你怎么打', 'window.qiStartS06()'));
        } else {
            out.push(lock('🌊 最后一条脉就在血海坝下。她站在你身边——最后一程，需渡劫修为才站得住潮声里。（第三幕 · 汇流）'));
        }
        return out;
    };
    W.qiResumeFollow = function () {
        var sc = flags()['qi_f_scene'];
        if (!sc) { if (typeof W.openQiEndgamePanel === 'function') W.openQiEndgamePanel(); return; }
        if (sc === 's03_assassin_battle') { _battle('sui_assassin'); return; }
        if (sc === 's03_vanguard_battle') { _battle('sui_vanguard'); return; }
        if (sc === 's06_purge_battle') { _battle('sui_purge'); return; }
        if (sc === 's01') _s01();
        else if (sc === 's02') _s02();
        else if (sc === 's03') _s03();
        else if (sc === 's04_talk') _s04Talk();
        else if (sc === 's04_debt') _s04Debt();
        else if (sc === 's05') _s05();
        else if (sc === 's06') _s06();
        else if (sc === 's06_truth') _s06Truth();
    };

    // ---- 真仗（刺客/先锋/讨伐三场）----
    var FIGHTS = {
        sui_assassin: { name: '占脉盟·死士', hp: 1700, atk: 210, def: 100, spd: 120, desc: '被换掉的那派养的死士——刀债记在引刀的人头上', sceneKey: 's03_assassin_battle', lose: '💔 死士的刀贴着你的喉咙收住了——他没杀你，他要你带话。你退到帐外，血滴了一路。（回面板可再战）' },
        sui_vanguard: { name: '占脉盟·大阵主', hp: 2100, atk: 240, def: 130, spd: 95, desc: '两座脉口的大阵都归他管——打穿他，两座都保', sceneKey: 's03_vanguard_battle', lose: '💔 大阵把你绞了出来。她在大帐那头看着，没动，也没皱眉：「起来。再打。」（回面板可再战）' },
        sui_purge: { name: '讨伐军·先锋统领', hp: 2300, atk: 260, def: 140, spd: 100, desc: '守脉盟讨伐「从贼」的先锋——指名讨你，不讨她', sceneKey: 's06_purge_battle', lose: '💔 你被讨伐军的大阵压了回来。她在城头没皱眉，只说了一句：「起来。本座还没喊停。」（回面板可再战）' }
    };
    function _battle(beat) {
        var b = FIGHTS[beat];
        if (!b) return;
        scene(b.sceneKey);
        var mul = 1 + 0.15 * realmTier();
        var enemy = {
            name: b.name,
            hp: Math.round(b.hp * mul), maxHp: Math.round(b.hp * mul),
            attack: Math.round(b.atk * mul), defense: Math.round(b.def * mul), speed: Math.round(b.spd * mul),
            description: b.desc,
            _isQiStory: true, _qiBeat: beat
        };
        log('⚔️ ' + b.name + '——这一仗，你亲手打。（' + b.desc + '）', 'danger');
        if (typeof W.startBattle === 'function') W.startBattle(enemy);
    }
    W._qiSettleExtraC = function (win, beat) {
        var b = FIGHTS[beat];
        if (!b) {
            // 批五终战的波次战继续往下分流
            if (typeof W._qiSettleExtraD === 'function') { try { W._qiSettleExtraD(win, beat); } catch (e) {} }
            return;
        }
        if (!win) { scene(b.sceneKey); say(b.lose, 'warning'); return; }
        if (beat === 'sui_assassin') _assassinWon();
        else if (beat === 'sui_vanguard') _vanguardWon();
        else if (beat === 'sui_purge') _purgeWon();
    };

    // ============ 随-01 投海 ============
    W.qiStartS01 = function () {
        if (flags()['qi_s01'] || flags()['qi_f_scene']) { W.qiResumeFollow(); return; }
        accept('main_040');
        _s01();
    };
    function _s01() {
        scene('s01');
        var comp = companionName();
        var sect = sectName();
        var body = para('你朝着灵脉尽头走了回去。她还在那儿——潮声如汐，红衣如火。')
            + para('见你走过来，她愣了一瞬。那一瞬你看清了：她以为你是来跪的。')
            + para('你没跪。你说：你去哪儿，我去哪儿，就这样。')
            + para('她看了你很久，忽然笑了：「好。本座帐下不缺跪的——缺站着的。」');
        if (comp) {
            body += para('你的道侣<b class="text-pink-200">' + comp + '</b>就站在你身边。她瞥过来一眼：「家里那位——带走吗？」')
                + para(comp + '替你答了，答得比你还快：「人去哪儿，哪儿就是家。」')
                + para('她收回目光，语气里少了点嘲讽，多了点别的：「好话。进来吧。」');
        } else {
            body += para('「家里那位呢——不带？」你摇头。她没再问。这种事她比谁都懂：家里的事，不是不带，是不能带。');
        }
        body += para('正道的骂声第二天就到了：从贼、叛徒、可惜了的。')
            + (sect ? para('师门<b class="text-amber-200">' + sect + '</b>也来了信，只有八个字：「<b>路是你选的，走完。</b>」——失望，但没绝情。') : para('你没有师门可来信。散修的路自己选，骂声也只能自己听。'))
            + para('有人在营门口指着你的脊背骂。她站在高处，全场都看得见她——她只说了一句：')
            + para('<b class="text-red-300">「跟着本座的人，轮不到你们评。」</b>')
            + para('没人再指了。')
            + btns([btn('🩸 入帐——血海营的第一个夜晚', 'window.qiS01Done()')]);
        modal('🩸 投海', body);
    }
    W.qiS01Done = function () {
        _close();
        if (flags()['qi_s01']) return;
        finish('main_040', 'qi_s01');
        log('🩸 你入了她的帐。血海营的规矩只有一条：账算清楚，刀拿稳当。营里的人看你——一半是打量，一半是提防。她没给你职位，只给了你一句：「先办差。」（追随线开启：她的差事，从来不是掠夺）', 'info');
    };

    // ============ 随-02 头一桩差事 · 拆坝 ============
    W.qiStartS02 = function () {
        if (flags()['qi_s02'] || flags()['qi_f_scene']) { W.qiResumeFollow(); return; }
        accept('main_041');
        _s02();
    };
    function _s02() {
        scene('s02');
        modal('🩸 差事 · 拆坝', para('她的差事从来不是掠夺，是拆坝。大派闸死脉口，灵气流不到下游——下游百村的田，枯了三年。')
            + para('她的办法很简单：拆坝，把气还给下游。账也很简单：坝拆了就是她要的。<b class="text-gray-400">你慢慢看出来：拆坝和抽脉，在她的账上是同一件事。</b>')
            + para('头一桩差事：大派闸死的脉口大坝。她把令递给你，只说了一句：「怎么办——你定。」')
            + para('路上你问她：为什么非要抽干？她走在前面，声音飘回来，只有四个字：')
            + para('<b class="text-red-300">「因为我要。」</b>')
            + para('<span class="text-gray-400">（这个答案你记下了。后来，她会再答一次。）</span>')
            + btns([
                btn('🕊️ 宽办——拆闸不伤人，守坝的遣散，下游回一口气', 'window.qiTaskChoice(\'lenient\')', 'bg-emerald-800 hover:bg-emerald-700'),
                btn('⚔️ 严办——标准答案：坝照拆，挡路的扫开', 'window.qiTaskChoice(\'strict\')'),
                btn('🚫 不办——把令递回去：「坝是他们修的，凭什么你拆？」', 'window.qiTaskChoice(\'refuse\')', 'bg-gray-600 hover:bg-gray-500')
            ]));
    }
    W.qiTaskChoice = function (c) {
        _close();
        var f = flags();
        if (f['qi_task']) return;
        f['qi_task'] = c;
        record('qi_task_' + c, '拆坝差事');
        if (c === 'lenient') {
            hb(20, '差事宽办');
            W.addQiHeart('她记着你每一次怎么办差。这一回她记的是：比预想的慢，比预想的干净——慢和干净，她都收下了。');
            street('下游百村给拆坝的人立了长生牌。有人问是谁，知情的只说三个字：别问了。');
            log('🕊️ 你拆了闸，没伤一个人——守坝的弟子放下法器遣散了，他们本来也只是领粮吃饭。下游百村的灵田回了一口气，当夜有村子放了鞭。她听完回报，半晌说了一句：「比本座预想的慢。也比本座预想的干净。」（交心账一笔；下游百村长生牌一笔）', 'success');
        } else if (c === 'strict') {
            W.addQiHeart('这桩差事你办了标准答案：坝照拆，挡路的扫开。她只说了三个字「很标准」，语气里没有夸。人心簿一笔：很标准——这个先例她记着，往后会当面引用给你听。');
            log('⚔️ 你用最快的办法拆了坝。挡路的人被扫开——没死，但伤了的不少。她看着干净的坝口，只说了三个字：「很标准。」语气里没有夸。（人心簿一笔：标准答案的先例她记下了。危机那拍，她会当面引用这一笔）', 'warning');
        } else {
            hb(20, '差事不办');
            W.addQiHeart('她记着你每一次怎么办差。这一回她记的不是功，是脾气——「有脾气，比听话值钱。」人心簿里，这一笔叫「人」。');
            log('🚫 你把令递了回去：「坝是他们修的，凭什么你拆？」她盯着你看了两息，把令收回去，自己去了。当晚回来，坝没了，人没伤一个。路过你帐前，她停了半步，没停全：「<b class="text-pink-200">有脾气。比听话值钱。</b>」（交心账一笔——这句评价，她没给过第二个人）', 'success');
        }
        finish('main_041', 'qi_s02');
        wither('大漠孤城'); wither('冰原城');
        log('🥀 坝拆完了，她顺手抽了两条脉——大漠孤城、冰原城，红线爬过了北地。（拆坝和抽脉，在她的账上是同一件事。你亲眼看见了）', 'warning');
    };

    // ============ 随-03 大帐点兵 ============
    W.qiStartS03 = function () {
        if (flags()['qi_s03'] || flags()['qi_f_scene']) { W.qiResumeFollow(); return; }
        accept('main_042');
        _s03();
    };
    function _s03() {
        scene('s03');
        modal('🩸 大帐点兵', para('大帐点兵。下一个目标的名单摊开，你看见了一个熟悉的名字。')
            + para('那个门派占过脉——下游百村的田枯了三年，一半是他们的闸。可他们也教过你剑——你入门的剑式，是他们一位老教习给的。')
            + para('满帐的人都在看你。她用指尖敲了敲名单：')
            + para('<b class="text-pink-200">「你认得这一家。你说——这一刀，怎么落？」</b>')
            + btns([
                btn('🪖 改道——把刀引向更恶的占脉盟（血账最多的那家）', 'window.qiMusterChoice(\'divert\')', 'bg-amber-800 hover:bg-amber-700'),
                btn('⚔️ 亲自做先锋——两家都打下来，两家都保（真仗）', 'window.qiMusterChoice(\'vanguard\')')
            ]));
    }
    W.qiMusterChoice = function (c) {
        var f = flags();
        if (f['qi_muster']) return;
        f['qi_muster'] = c;
        record('qi_muster_' + c, '大帐点兵');
        if (c === 'divert') {
            _close();
            street('那派山门外立了块碑，碑文七个字：刀是熟人引的。没刻名字——认识的人自然认识。');
            log('🪖 你开口把刀引开了——引向占脉盟，那家血账比谁都多的。满帐皆惊。她盯了你三息，把令扔给你：「依你。」旧门派保住了，老教习托人给你捎了一坛酒。可被换掉的那派恨你入骨——刀债，记在引刀的人头上。（街谈留名：「刀是熟人引的」。当夜，刺客到）', 'warning');
            _battle('sui_assassin');
        } else {
            _close();
            log('⚔️ 你说：两家都打下来，两家都保——你亲自做先锋。她把令扔给你，只说了一个字：「去。」（真仗：打穿占脉盟大阵主，两座脉口都保）', 'danger');
            _battle('sui_vanguard');
        }
    };
    function _assassinWon() {
        var f = flags();
        if (f['qi_s03']) return;
        log('🗡️ 刺客没得手。你留了他一条命，让他带话回去：刀是你引的，账冲你来，别碰无辜。第二天她扔给你一坛酒，什么也没夸——只说：「自己的债自己收。好。」营里的人从此认你。（改道拍闭环：旧门派保住，债也认下了）', 'success');
        finishS03();
    }
    function _vanguardWon() {
        var f = flags();
        if (f['qi_s03']) return;
        fame(20);
        log('⚔️ 你打穿了占脉盟的大阵。两座脉口都保住了——坝拆了，闸开了，没死人。她当着满帐的人认你，笑传了半个营：「这一仗，本座看着呢。」顿了顿，又补一句，声音不高：「剑是谁教的，本座记着。」（当众认你——血海营里，你有了位置。名望涨）', 'success');
        finishS03();
    }
    function finishS03() {
        finish('main_042', 'qi_s03');
        wither('万毒谷'); wither('青木城');
        if (typeof W.qiSetStage === 'function') W.qiSetStage(2);
        log('🥀 点兵过后，红线连爬两城——万毒谷、青木城脉枯。天地灵气薄了一大截。（一幕毕；她的账不等人，你的也是）', 'warning');
    }

    // ============ 随-04 崖边夜话 + 债册拍 ============
    W.qiStartS04 = function () {
        if (flags()['qi_s04'] || flags()['qi_f_scene']) { W.qiResumeFollow(); return; }
        accept('main_043');
        _s04Talk();
    };
    function _s04Talk() {
        scene('s04_talk');
        modal('🍜 崖边夜话', para('营在崖边。她难得没在看账，坐在崖沿上晃着腿，像个凡间的少女——如果不看她身后那片血色的海。')
            + para('你在她旁边坐下。她忽然问：「凡人吃什么？」')
            + para('你愣住。她自顾自说下去：「本座八岁掉进血海。掉进来之前，住在凡间的镇子上。镇口有个卖热汤面的摊子，一碗面，两个铜板。摊主看我小，多舀了一勺热汤，说娃娃要吃热的。」')
            + para('「后来镇子没了，摊子也没了。三万年，本座没忘那碗面——你说怪不怪，<b class="text-gray-400">记的不是味道，是那勺汤。</b>」')
            + btns([
                btn('🍜 认真答——「不怪。冷饭的世界里，那勺汤是唯一的热的。」', 'window.qiTalkChoice(\'earnest\')', 'bg-emerald-800 hover:bg-emerald-700'),
                btn('😏 逗她——「那我请你吃一碗。两个铜板——这个本座出得起。」', 'window.qiTalkChoice(\'tease\')')
            ]));
    }
    W.qiTalkChoice = function (c) {
        _close();
        var f = flags();
        if (f['qi_talk']) { _s04Debt(); return; }
        f['qi_talk'] = c;
        record('qi_talk_' + c, '崖边夜话');
        hb(20, '崖边夜话');
        if (c === 'earnest') {
            log('🍜 她沉默了一会儿。「你懂。」她说得很轻，像怕被风吹散。然后她拍了拍身边的崖沿，你们又坐了很久，谁也没再说话——血海在崖下翻，竟不吵。（交心账一笔）', 'success');
        } else {
            log('😏 她回头给了你一个脑瓜崩——不轻，正中眉心。然后自己先绷不住笑了：「贫嘴。本座的一碗面，你请得起吗？」笑完，她把「汤面」两个字收进袖子里，像收起一件东西。（交心账一笔——她收走的，比你说出口的贵重）', 'success');
        }
        _s04Debt();
    };
    function _s04Debt() {
        scene('s04_debt');
        modal('📕 灯下 · 债册', para('夜里，她喝酒。喝到一半，忽然把那本册子扔给你——她从不给人看的债册。')
            + para('「看。第三万页。」')
            + para('你翻到自己名字的那一刻，她正好在坛沿后面看着你。你的名字在上头，墨迹很旧，笔画都淡了，旁边记的年份是：<b class="text-amber-200">你开始修行的那一年。</b>')
            + para('「你从开始修行那天，就在上面了。」她说，「别问本座为什么记着。」')
            + para('她把册子收回去，指尖在空白的最后一页上停了一瞬，收走了：「本座欠的比这多——记不过来，也得记。」')
            + para('<b class="text-gray-400">最后一页是空白的。笔就在你手边。</b>')
            + btns([
                btn('✍️ 写——把她的名字，写在最后一页', 'window.qiDebtChoice(\'write\')', 'bg-amber-800 hover:bg-amber-700'),
                btn('🚫 不写——那是她自己的页，该她自己写', 'window.qiDebtChoice(\'skip\')')
            ]));
    }
    W.qiDebtChoice = function (c) {
        _close();
        var f = flags();
        if (f['qi_debt_choice']) return;
        f['qi_debt_choice'] = c;
        f['qi_debt_name'] = (c === 'write');
        record('qi_debt_' + (c === 'write' ? 'write' : 'skip'), '债册');
        if (c === 'write') {
            hb(20, '替她在债册最后一页写了她的名字');
            log('✍️ 你拿起笔。笔很沉——比剑沉。你在最后一页写下那三个字：玄冥子。她盯着那一页看了很久，没合上册子。「……本座欠的账，从来没人替本座记过。」她的声音很低，「记了，就要看到底。」（交心账一笔；渡结局专属变体：册子的最后一页，不再是空白）', 'success');
        } else {
            log('🚫 你把笔推了回去：「这一页是你的。该你自己写。」她看了你一眼，把笔收走了，也没写。那一页一直空着。（账单页会有一行：她那本册子的最后一页，一直空着——她在等一个人替她记，或者等她自己敢）', 'info');
        }
        finish('main_043', 'qi_s04');
        wither('剑阁');
        log('🥀 崖边夜话过后，红线爬过剑阁——万剑齐鸣了最后一次，剑魂自己找活路去了。（她的账一页页翻，城一座座枯）', 'warning');
    };

    // ============ 随-05 危机拍（追随线低谷——无论怎么选，都直面代价） ============
    W.qiStartS05 = function () {
        if (flags()['qi_s05'] || flags()['qi_f_scene']) { W.qiResumeFollow(); return; }
        accept('main_044');
        _s05();
    };
    function _s05() {
        scene('s05');
        modal('🩸 军帐 · 那本账', para('军帐里，她把地图摊开。下一个目标：炎城。')
            + para('但算期不对：算期内，炎城有一场兽潮。灵气枯，妖兽先疯——疯完了，就弱。兽潮过城，那城会破。')
            + para('城里有三千口人。')
            + para('绕道，误期半年；不绕，兽潮和她拆脉前后脚进城。')
            + para('她指着地图上那座城，看着你：「<b class="text-pink-200">你算这本账。怎么算？</b>」')
            + btns([
                btn('🕯️ 劝她改道——三千口人，这本账绕不过去', 'window.qiCrisisChoice(\'detour\')', 'bg-emerald-800 hover:bg-emerald-700'),
                btn('🤐 沉默——她的账，她定', 'window.qiCrisisChoice(\'silent\')', 'bg-gray-600 hover:bg-gray-500')
            ]));
    }
    W.qiCrisisChoice = function (c) {
        _close();
        var f = flags();
        if (f['qi_crisis']) return;
        f['qi_crisis'] = c;
        record('qi_crisis_' + c, '危机拍');
        if (c === 'detour') {
            // 倒计时+半年：锚点日前移半年（世界数值，枯萎图可见）
            f['qi_anchor_day'] = Math.max(1, (Number(f['qi_anchor_day']) || 1) - 180);
            hb(20, '危机拍劝她改道成功');
            W.addQiHeart('她盯了你很久：「绕一次，账就多记一页。你记全得过来吗？」——他用人心算账。这一笔，她记下了。');
            street('炎城的人不知道要谢谁。长生牌还是立了——牌上只刻了一个姓。');
            log('🕯️ 她盯了你很久，久到帐里的灯花爆了两回。「绕一次，账就多记一页。你记全得过来吗？」你说：记不全，也得绕。她合上地图，只说了一个字：「绕。」（倒计时添了半年——枯萎图上看得见；炎城活下来了。三年后那城给你立了长生牌，牌上不记事，只刻姓。交心账一笔；人心簿一笔：他用人心算账）', 'success');
        } else {
            W.addQiHeart('三日后，炎城方向的天烧红了。她和你在营外站了一夜，没说话。天亮她翻开债册，把三千个名字当你的面一个一个写完：「记着。本座记着，你也记着。」——人心簿重笔：这本账，你沉默过。');
            wither('炎城');
            f['qi_crisis_fallen'] = true;
            log('🤐 你没说话。三日后，队伍路过炎城外围——那个方向的天烧红了，兽潮和枯脉前后脚进的城。她和你在营外站了一夜，没说话。天亮时她翻开债册，当你的面，把三千个名字一个一个写完，写完才合上：「记着。本座记着，你也记着。」（人心簿重笔；炎城脉枯；第三幕，到场还命的人里会有从这座城逃出来的——她的魅力不是洗白，这本账你直面了）', 'danger');
        }
        finish('main_044', 'qi_s05');
        if (typeof W.qiSetStage === 'function') W.qiSetStage(3);
        log('🌫️ 危机过后，天地的气薄得能看见底——城外大阵的灯暗成了豆子色。（二幕毕；红线只剩最后一程）', 'warning');
    };

    // ============ 随-06 讨伐战 + 真相拍 ============
    W.qiStartS06 = function () {
        if (flags()['qi_s06'] || flags()['qi_f_scene']) { W.qiResumeFollow(); return; }
        accept('main_045');
        _s06();
    };
    function _s06() {
        scene('s06');
        modal('⚔️ 城头 · 讨伐战', para('守脉盟的讨伐军到了城下，指名讨伐「从贼」——点了你的名字，没点她的。')
            + para('这是他们的聪明处：杀她不敢，驱离你，好在她营里打一颗楔子。')
            + para('她没解释，也没护你。她抱着手站在城头，居高临下看你：')
            + para('<b class="text-pink-200">「他们指名你。那你就打。本座看着。」</b>')
            + btns([btn('⚔️ 打给她看（真仗——讨伐军先锋统领）', 'window.qiPurgeFight()')]));
    }
    W.qiPurgeFight = function () { _battle('sui_purge'); };
    function _purgeWon() {
        if (flags()['qi_s06_won']) { _s06Truth(); return; }
        flags()['qi_s06_won'] = true;
        fame(30);
        street('讨伐军退了三十里。血海营里没人再敢喊「从贼」——都改口叫「先锋」。');
        log('⚔️ 你当着两军的面打碎了先锋。她在城头笑出声，笑声传了半个战场：「看见没有？本座认下的人。」讨伐军当夜退了三十里。血海营里再没人喊你从贼——改口叫先锋了。（当众认你；魔道侧名望立住）', 'success');
        _s06Truth();
    }
    function _s06Truth() {
        scene('s06_truth');
        modal('🌊 血海坝下 · 真相', para('动最后一条脉之前，她带你去了血海坝下。坝高如墙，潮声如雷——整个九州的灵气，都在往这里汇。')
            + para('「看清楚了。」她指着坝，又指指天，「本座要告诉你一件事。全天下没人知道的事——你听完要是想走，营门开着。」')
            + para('她说了。锁的事：<b class="text-red-300">灵脉是天的收租管道；飞升是被收割；灵气不够，是故意的。</b>天上的管事不救世，只收租。三万年了，她是头一个逃税的。')
            + para('你问了那个问题——第二次问：为什么非要抽干？')
            + para('这一次，她没说「因为我要」。她看着坝，答得很认真：')
            + para('<b class="text-amber-200">「因为梯子不会自己倒。而梯子上面的人，已经忘了下面长什么样。」</b>')
            + para('<span class="text-gray-400">（两个答案之间，隔着三年，和一整本账的距离。她把锁的事告诉了你——第三幕对质、辩论，你能说中要害。）</span>')
            + btns([btn('🌊 想走吗？——营门开着。你没动', 'window.qiS06Done()')]));
    }
    W.qiS06Done = function () {
        _close();
        if (flags()['qi_s06']) return;
        flags()['qi_truth_told'] = true;
        finish('main_045', 'qi_s06');
        wither('洛水城');
        if (flags()['qi_crisis'] === 'detour') wither('炎城');
        log('🥀 洛水成了凡间的河' + (flags()['qi_crisis'] === 'detour' ? '；绕开的那座城，炎城，这回也没绕过去——绕得了日子，绕不了账。' : '。') + '红线只剩最后一程。（第三幕开启：血海坝下——脉尽头之威，肉身难近，需渡劫修为。她就在你身边半步）', 'danger');
    };

    // ---- 同行期日常池（旧道侣日常十条的迁移：按交心账档位逐条解锁，一档一条）----
    var DAILY_POOL = [
        '🍶 她掏出一坛血海酿，倒了半盏给你：「海底下泡的气，酿了三十年。」酒入口像一线火。她挑眉：「好东西吧？」——杯底确实有一点潮声。（同行日常 · 血海酿）',
        '🍬 路过荒市，她在糖人摊子前站了很久。你买了一支给她，她举着，没舍得吃：「小时候没吃上。」说完咬了一大口，糖粘在嘴角，她用手背抹了。（同行日常 · 糖画）',
        '🎐 你的剑穗旧了。第二天她扔给你一根新的——结打得很笨，红绳倒是好绳。「本座亲手打的。」她说得理直气壮，「弄丢了，再打本座可懒得打。」（同行日常 · 剑穗）',
        '💇 营里的风把你的头发吹散了。她伸手替你绾上，动作意外地熟：「三万年前，本座给自己绾。」绾完她拍拍你的头，像拍自家晚辈。（同行日常 · 绾发）',
        '🏮 那夜你们下山逛了一次夜市。没人认出她——或者说，没人敢认。她蹲在摊子前认认真真套圈，认认真真输光。你替她赢回一只泥人，她盯着泥人看了半天，收进了袖子。（同行日常 · 夜市）',
        '🎣 她在溪边钓了一下午鱼，一条没钓着，也没用气。她说：「鱼咬钩是饿，人咬钩是贪。本座见过咬钩的人多了——今天就让鱼赢一回。」收竿时，空钩。（同行日常 · 钓鱼）',
        '✨ 夜里你们并排躺在坡上看星。她忽然说：「星星上头，就是那些管事的。」你问那还看什么。她安静了一会儿：「看他们看着我们。」那晚星子很亮，谁也没收割谁。（同行日常 · 看星）',
        '🍜 你给她煮了一碗热汤面——两个铜板的面，一勺热汤。她捧着碗半天没说话，吃完把碗递回来：「再来一碗。」你去煮，她在背后很轻地说了一声：「……谢了。」这两个字她没对谁说过——你装作没听见，让她留着。（同行日常 · 热汤面）'
    ];
    function dailyTierCount() {
        var s = 0;
        try { s = typeof W.qiHeartBondProbe === 'function' ? W.qiHeartBondProbe() : 0; } catch (e) {}
        if (s >= 100) return DAILY_POOL.length;
        if (s >= 60) return 6;
        if (s >= 30) return 3;
        return 0;
    }
    function dailyTick() {
        var f = flags();
        if (f['qi_route'] !== 'follow' || !f['qi_s01'] || f['qi_finale_follow']) return;
        var d = absDay();
        if (!d || d % 7 !== 0) return;
        var n = dailyTierCount();
        if (!n) return;
        if (Number(f['qi_daily_last'] || 0) === d) return;
        f['qi_daily_last'] = d;
        var idx = Math.floor(d / 7) % n;
        log(DAILY_POOL[idx], 'info');
    }
    try {
        if (W.timeSystem && typeof W.timeSystem.onNewDaySubscribe === 'function') W.timeSystem.onNewDaySubscribe(function () { try { dailyTick(); } catch (e) {} });
        else if (W.EventBus && W.EventBus.on) W.EventBus.on('newDay', function () { try { dailyTick(); } catch (e) {} });
    } catch (e) {}

    console.log('[qi-arc4] v25.0《灵气之尽》批四已注册：追随线 随-01~06（投海/拆坝/点兵/夜话债册/危机拍/讨伐战+真相）+同行日常池');
})();
