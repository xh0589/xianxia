// ==================== qi-arc1.js - 《灵气之尽》终局枢纽 · 账本 · 序幕 · 选路 ====================
// v25.0 推倒重写 · 批一：main_010「灵脉干了」（四场戏+初见+选路点）+ 账本四列 UI + 终局枢纽面板
// 文本逐字对齐：详稿·第一批·世界层与序幕.md B 节（含扫雷修订：初见认脸、田埂无人当场死）
// 纪律：走开类选项不入账（世界不打分）；门槛叙事化；玩家可见文本零外文字母零配额句式；
//       她的称呼永远从上位出（年龄铁设定）。旗标全部 qi_* 前缀，旧终局旗标一律不读不写。
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
    function sheToPlayer(m, f) { return isMale() ? m : f; }
    function record(id) { if (typeof W.recordChoice === 'function') { try { W.recordChoice(id, '灵脉干了'); } catch (e) {} } }
    function _close() {
        try { var o = document.getElementById('qi-modal-overlay'); if (o) o.remove(); } catch (e) {}
    }
    function modal(title, body) {
        _close();
        var wrap = '<div class="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4" id="qi-modal-overlay">'
            + '<div class="bg-gray-900 border-2 border-cyan-700 rounded-xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto">'
            + '<h2 class="text-xl font-bold text-cyan-300 mb-3 text-center">' + title + '</h2>' + body + '</div></div>';
        if (document.body && document.body.insertAdjacentHTML) document.body.insertAdjacentHTML('beforeend', wrap);
    }
    function btn(label, onclick, cls) {
        return '<button onclick="' + onclick + '" class="' + (cls || 'bg-cyan-800 hover:bg-cyan-700') + ' text-xs px-3 py-2 rounded text-left">' + label + '</button>';
    }
    function btns(arr) { return '<div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">' + arr.join('') + '</div>'; }
    function para(t) { return '<p class="text-sm text-gray-300 leading-relaxed mb-2">' + t + '</p>'; }
    function money() { return (W.inventory && W.inventory.currency) || {}; }
    function spend(n) {
        var cur = money();
        cur.spiritStones = (cur.spiritStones || 0) - n;
        if (typeof W.updateCurrencyUI === 'function') { try { W.updateCurrencyUI(); } catch (e) {} }
    }
    function realmTier() {
        try { return typeof W.getRealmTier === 'function' ? W.getRealmTier((W.currentCharData || {}).realm) : 6; } catch (e) { return 6; }
    }

    // ============ 账本四列（恩/仇=占脉名单/搁浅/人心） ============
    var LEDGER = { graces: [], vendettas: [], stranded: [], hearts: [] };
    function _push(arr, text) { arr.push({ day: absDay(), text: text }); if (arr.length > 60) arr.shift(); }
    W.addQiGrace = function (t) { _push(LEDGER.graces, t); };
    W.addQiVendetta = function (t) { _push(LEDGER.vendettas, t); };
    W.addQiStranded = function (t) { _push(LEDGER.stranded, t); };
    W.addQiHeart = function (t) { _push(LEDGER.hearts, t); };
    W.qiLedgerProbe = function () { return LEDGER; };
    // ---- 交心账（情分换皮：只报称号不报数；来源六处走批三/批四）----
    function hbTitle(s) {
        if (s >= 100) return '血海为证';
        if (s >= 60) return '知心';
        if (s >= 30) return '交心';
        return '相识';
    }
    W.qiHeartBondTitle = function () { return hbTitle(Number(flags()['qi_heart_bond'] || 0)); };
    W.qiHeartBondProbe = function () { return Number(flags()['qi_heart_bond'] || 0); };
    W.addQiHeartBond = function (n, reason) {
        var f = flags();
        var before = Number(f['qi_heart_bond'] || 0);
        var after = Math.max(0, before + (Number(n) || 0));
        f['qi_heart_bond'] = after;
        if (before < 30 && after >= 30 && !f['qi_hb_m30']) {
            f['qi_hb_m30'] = true;
            log('🍶 她喝酒时对你说了句没头没尾的话：「本座种过田。庄稼长得好，不怕地里有草——就怕它连当庄稼都不敢。」说完自己愣了一下，像没想到这话会说给你听。（你与她的称号：自今日起，交心）', 'success');
        }
        if (before < 60 && after >= 60 && !f['qi_hb_m60']) {
            f['qi_hb_m60'] = true;
            log('🍶 那晚之后，她开始给你留东西：一坛新酿的酒、半块没吃完的糖人……都不入账。「本座不供你了。」她说，「供着的是客。你随本座带着——带着的，是自己人。」（你与她的称号：自今日起，知心）', 'success');
        }
        return after;
    };
    if (W.StateRegistry && typeof W.StateRegistry.register === 'function') {
        W.StateRegistry.register('qiLedger', {
            version: 1,
            export: function () { return JSON.parse(JSON.stringify(LEDGER)); },
            import: function (d) { if (d) { LEDGER.graces = d.graces || []; LEDGER.vendettas = d.vendettas || []; LEDGER.stranded = d.stranded || []; LEDGER.hearts = d.hearts || []; } },
            reset: function () { LEDGER = { graces: [], vendettas: [], stranded: [], hearts: [] }; }
        });
    }
    function _col(title, arr, empty) {
        var items = arr.length
            ? arr.map(function (e) {
                if (e.resolved) {
                    return '<div class="text-xs text-gray-500 py-1 border-b border-gray-700/50">· <span class="line-through">' + e.text + '</span><br><span class="text-green-400">已销账：' + (e.note || '') + '</span></div>';
                }
                return '<div class="text-xs text-gray-300 py-1 border-b border-gray-700/50">· ' + e.text + '<span class="text-gray-500">（第' + e.day + '日）</span></div>';
            }).join('')
            : '<div class="text-xs text-gray-500 py-1">' + empty + '</div>';
        return '<div class="mb-3"><div class="text-sm font-bold text-amber-200 mb-1">' + title + '</div>' + items + '</div>';
    }
    // 搁浅列销账（批二矿场联动用）：真账逻辑——条目保留、划掉、写销账注
    W.resolveQiStranded = function (note, match) {
        var n = 0;
        for (var i = 0; i < LEDGER.stranded.length; i++) {
            var e = LEDGER.stranded[i];
            if (!e.resolved && (!match || e.text.indexOf(match) >= 0)) { e.resolved = true; e.note = note || '销了'; n++; }
        }
        return n;
    };
    W.openQiLedger = function () {
        _close();
        var body = '<div class="text-left">'
            + _col('🔴 占脉名单', LEDGER.vendettas, '——还没有名字。趁乱吃人的，后来会一个个写上来。')
            + _col('🟢 恩列', LEDGER.graces, '——还空着。世道再薄，也总有人记得一碗饭、半个时辰。')
            + _col('🟡 搁浅列', LEDGER.stranded, '——还空着。脉枯废掉的人与派，会搁浅在这一页。')
            + _col('⚫ 人心簿', LEDGER.hearts, '——还空着。构陷与冷眼，将来都会记在这里。')
            + '</div>'
            + btns([btn('合上账本', 'window.qiCloseModal()', 'bg-gray-600 hover:bg-gray-500')]);
        if (typeof W.showModal === 'function') W.showModal('📕 账本', body);
    };
    W.qiCloseModal = _close;

    // ============ 章节注册：main_010 新文本 ============
    var QI_ARC1 = [{
        id: 'main_010', title: '灵脉干了', type: 'main', priority: 10,
        description: '天地灵气在变薄——说书人说，是有人在抽天下的脉。去官道走一趟，亲眼看看这个世界正在发生什么。',
        objectives: [{ type: 'custom', target: 'qi_route_chosen', count: 1, completed: false }],
        rewards: { exp: 0, spiritStones: 0, items: [] },
        story: '灵气之尽 · 序幕', accepted: false, completed: false, turnedIn: false
    }];
    (function register() {
        try {
            var chain = W.mainQuestChain;
            if (chain && chain.push) {
                var has = false;
                for (var i = 0; i < chain.length; i++) { if (chain[i] && chain[i].id === 'main_010') { has = true; break; } }
                if (!has) chain.push(QI_ARC1[0]);
            }
            if (W.QuestRegistry && typeof W.QuestRegistry.registerMany === 'function') W.QuestRegistry.registerMany(QI_ARC1);
        } catch (e) {}
    })();
    function accept(id) {
        try {
            var q = W.QuestRegistry && W.QuestRegistry.get ? W.QuestRegistry.get(id) : null;
            if (q && !q.accepted && typeof W.acceptQuest === 'function') W.acceptQuest(id);
        } catch (e) {}
    }

    // ============ 终局枢纽面板 ============
    W.openQiEndgamePanel = function () {
        _close();
        var f = flags();
        var body = '';
        if (!f['qi_prologue_started']) {
            body = para('这一年秋天，九州的修士同时打了个寒噤。灵气薄了——薄得像掺了水的酒，像退了潮的滩。')
                + para('说书人说，是有人在抽天下的脉。你原本不信。')
                + btns([
                    btn('🌫️ 去官道走一趟——亲眼看看（序幕 · 灵脉干了）', 'window.qiStartPrologue()', 'bg-cyan-800 hover:bg-cyan-700'),
                    btn('关闭', 'window.qiCloseModal()', 'bg-gray-600 hover:bg-gray-500')
                ]);
        } else if (!f['qi_prologue_done']) {
            body = para('官道上的事，还没走完。（序幕进行中）')
                + btns([
                    btn('🌫️ 继续——官道尽头还有人和事等着你', 'window.qiResumePrologue()', 'bg-cyan-800 hover:bg-cyan-700'),
                    btn('关闭', 'window.qiCloseModal()', 'bg-gray-600 hover:bg-gray-500')
                ]);
        } else {
            var routeName = f['qi_route'] === 'oppose' ? '⚔️ 对抗——你在追她' : (f['qi_route'] === 'ignore' ? '🚶 无视——你过日子，世界从你门前路过' : '🩸 追随——你在她麾下');
            var extra = [];
            try { if (typeof W.qiOpposeButtons === 'function') extra = extra.concat(W.qiOpposeButtons() || []); } catch (eX) {}
            try { if (typeof W.qiIgnoreButtons === 'function') extra = extra.concat(W.qiIgnoreButtons() || []); } catch (eX2) {}
            try { if (typeof W.qiFollowButtons === 'function') extra = extra.concat(W.qiFollowButtons() || []); } catch (eX3) {}
            try { if (typeof W.qiFinaleButtons === 'function') extra = extra.concat(W.qiFinaleButtons() || []); } catch (eX4) {}
            body = para(routeName + '。枯萎图上的红线还在爬——她的路，和九州所有人的命，缠在同一张图上。')
                + btns(extra.concat([
                    btn('🗺️ 九州枯萎图——看看她的红线爬到哪了', 'window.qiOpenWitherMap()', 'bg-red-900 hover:bg-red-800'),
                    btn('📕 账本——恩、仇、搁浅、人心，四列', 'window.openQiLedger()', 'bg-amber-800 hover:bg-amber-700'),
                    btn('🍵 街谈——天下人在背后怎么说', 'window.qiOpenStreetTalk()', 'bg-emerald-900 hover:bg-emerald-800'),
                    btn('关闭', 'window.qiCloseModal()', 'bg-gray-600 hover:bg-gray-500')
                ]));
        }
        if (typeof W.showModal === 'function') W.showModal('📜 终局 · 灵气之尽', body);
    };

    // ============ 序幕 main_010 ============
    W.qiStartPrologue = function () {
        _close();
        if (flags()['qi_prologue_started']) { W.qiResumePrologue(); return; }
        flags()['qi_prologue_started'] = true;
        accept('main_010');
        log('🌫️ 灵气之尽 · 序幕「灵脉干了」。这一年秋天，九州的修士同时打了个寒噤——没人说得清是哪一天开始的。灵田里的药一茬比一茬矮，丹炉的火一炉比一炉温，宗门大阵的灯，一夜比一夜暗。说书人说，是有人在抽天下的脉。你原本不信。直到你路过官道。', 'info');
        _scene('chen');
    };
    W.qiResumePrologue = function () {
        _close();
        var s = flags()['qi_scene'] || 'chen';
        if (s === 'yu_battle_pending') { _yuBattle(); return; }
        if (s === 'meet') { _meet(); return; }
        if (s === 'route') { _routeModal(); return; }
        _scene(s);
    };

    function _scene(key) {
        flags()['qi_scene'] = key;
        if (key === 'chen') _sceneChen();
        else if (key === 'liu') _sceneLiu();
        else if (key === 'yu') _sceneYu();
        else if (key === 'zhou') _sceneZhou();
        else if (key === 'meet') _meet();
        else if (key === 'route') _routeModal();
    }

    function _sceneChen() {
        modal('🍂 官道边 · 第一场', para('官道边坐着个灰袍人，一动不动。你认得那种坐姿——金丹修士，气机却像一口枯井。他面前的地上用枯枝画了个圈，圈里写着一个字：「卡」。')
            + para('路人往圈里扔了枚铜板。他没捡。')
            + para('他卡了三十年。金丹第九层，差一步元婴——前面那条路，今年断了。')
            + btns([
                btn('🍵 陪他坐一会儿——不问，不劝，就坐着', 'window.qiSceneChoice(\'chen\',\'sit\')', 'bg-emerald-800 hover:bg-emerald-700'),
                btn('💰 塞给他一枚灵石', 'window.qiSceneChoice(\'chen\',\'stone\')', 'bg-amber-800 hover:bg-amber-700'),
                btn('🚶 什么也不说，走过去', 'window.qiSceneChoice(\'chen\',\'pass\')', 'bg-gray-600 hover:bg-gray-500')
            ]));
    }
    function _sceneLiu() {
        var poor = (money().spiritStones || 0) < 30;
        modal('🌾 枯死的灵田 · 第二场', para('路边的灵田枯黄一片。一个中年妇人跪在田埂上，一把一把往外拔枯死的药——手在抖，动作却很轻，像拔自己的孩子。')
            + para('药篓上贴着四个字：柳家药庐。')
            + para('「第四年了。」她像在对田说话，「头年减一半，去年剩三成，今年……今年连草都不长了。」')
            + btns([
                poor
                    ? '<div class="bg-gray-700/50 text-xs px-3 py-2 rounded text-left text-gray-500 cursor-not-allowed">🧺 买下整篓枯药（灵石三十）<br><span class="text-[10px]">灵石不够——但你还可以搭把手</span></div>'
                    : btn('🧺 买下整篓枯药（灵石三十）', 'window.qiSceneChoice(\'liu\',\'buy\')', 'bg-emerald-800 hover:bg-emerald-700'),
                btn('🌱 帮她把还活着的苗移进背阴的沟', 'window.qiSceneChoice(\'liu\',\'move\')', 'bg-emerald-900 hover:bg-emerald-800'),
                btn('🚶 路过', 'window.qiSceneChoice(\'liu\',\'pass\')', 'bg-gray-600 hover:bg-gray-500')
            ]));
    }
    function _sceneYu() {
        modal('🏔️ 七霞派 · 第三场', para('山顶立着一座小派的山门，匾上三个字：七霞派。')
            + para('半山以上的殿宇塌了，祖师堂里大阵的灵光明灭如烛。一个老道站在阵眼中央，道袍洗得发白，站得笔直——像一座坟，自己在守自己。阵眼里的灵石，只剩小半块。')
            + para('山下传来马蹄声。脉贼——趁着脉枯打劫残余灵石的鬣狗——盯上了这最后小半块。')
            + btns([
                btn('⚔️ 帮守阵眼（真仗——脉贼头目）', 'window.qiSceneChoice(\'yu\',\'guard\')', 'bg-red-800 hover:bg-red-700'),
                btn('🚶 不帮——这不是你的山门', 'window.qiSceneChoice(\'yu\',\'pass\')', 'bg-gray-600 hover:bg-gray-500')
            ]));
    }
    function _yuBattle() {
        flags()['qi_scene'] = 'yu_battle_pending';
        var mul = 1 + 0.15 * realmTier();
        var enemy = {
            name: '脉贼头目·疤面',
            hp: Math.round(900 * mul), maxHp: Math.round(900 * mul),
            attack: Math.round(120 * mul), defense: Math.round(70 * mul), speed: Math.round(60 * mul),
            description: '趁枯打劫的鬣狗——是人类，不是她的手下',
            _isQiStory: true, _qiBeat: 'yu'
        };
        log('⚔️ 脉贼头目·疤面带人扑向阵眼。你拔剑站在老道身前——这一仗，你亲手打。', 'danger');
        if (typeof W.startBattle === 'function') W.startBattle(enemy);
    }
    W.settleQiBattle = function (win, beat) {
        if (beat !== 'yu' && typeof W._qiSettleExtra === 'function') {
            try { W._qiSettleExtra(win, beat); } catch (e) {}
            return;
        }
        if (beat === 'yu') {
            if (win) {
                flags()['_qi_yu'] = 'guard';
                W.addQiGrace('七霞派掌门虞松子：你替他守住了阵眼最后小半块灵石。他说——阵记得，老道也记得。');
                log('🏔️ 你把脉贼赶下了山。老道转身，整了整那件洗得发白的道袍，向你行了个全礼：「七霞派，虞松子。道友今日守的不是阵——是七霞派最后一口气。」他说得很平静，「这阵守不住的，灵石就剩小半块，撑不过三日。但今日守过，阵记得，老道也记得。」（恩列记账：虞松子）', 'success');
                _scene('zhou');
            } else {
                flags()['qi_scene'] = 'yu';
                say('💔 脉贼的刀又乱又狠。你退下山道——山门还立着，老道还在阵里站着。（回终局面板可再来，他们跑不了）', 'warning');
            }
        }
    };
    function _sceneZhou() {
        var poor = (money().spiritStones || 0) < 300;
        modal('🌾 田埂小镇 · 第四场', para('镇子很小，村口有一间灵草行。')
            + para('事情不复杂：一个老农锄地，误锄了一株灵草——那草是宗门三年前撒的种，没人通知过镇里。来收草的是个外门弟子，年纪不到二十，骑在剑上，马鞭一挥，把老农的腿打断了；又让人把老农的儿子绑了——「抵草钱」，带去北边矿上充三年苦力。')
            + para('全镇的人跪了一圈。没有人敢站起来。')
            + para('那位仙师没有下剑，只说了两个字：「谢吧。」——「草有价，人命没有。本座已经仁至义尽。」')
            + para('然后御剑走了。')
            + para('老农的婆娘朝着剑光还在磕头：「谢仙师留我们全家活命。」')
            + para('<b class="text-gray-400">她在谢。男人的腿断了，儿子被带走了，她还在谢。</b>')
            + para('这一幕没有任何账本记。天地自己记着。')
            + btns([
                poor
                    ? '<div class="bg-gray-700/50 text-xs px-3 py-2 rounded text-left text-gray-500 cursor-not-allowed">💰 追上去，花钱赎人（灵石三百）<br><span class="text-[10px]">灵石不够——但你还可以做别的</span></div>'
                    : btn('💰 追上去，花钱赎人（灵石三百）', 'window.qiSceneChoice(\'zhou\',\'redeem\')', 'bg-emerald-800 hover:bg-emerald-700'),
                btn('✍️ 把父子的名字记下来', 'window.qiSceneChoice(\'zhou\',\'name\')', 'bg-amber-800 hover:bg-amber-700'),
                btn('🚶 走开', 'window.qiSceneChoice(\'zhou\',\'pass\')', 'bg-gray-600 hover:bg-gray-500')
            ]));
    }

    W.qiSceneChoice = function (scene, choice) {
        _close();
        var f = flags();
        if (scene === 'chen') {
            if (f['_qi_chen']) return;
            f['_qi_chen'] = choice;
            record('qi_chen_' + choice);
            if (choice === 'sit') {
                W.addQiGrace('散修陈五久：官道边，你陪一个「废人」坐了半个时辰。他把三百年卡关的手札给了你——这笔账他记了三百年的账里。');
                log('🍵 你在他旁边坐下，从日中坐到日影西斜。谁也没说话。起身要走时，他忽然开口：「小友，你这人有意思。陪一个废人坐了半个时辰。」他笑得像沙，「我坐了七天，想明白一件事——路不是断的，路是本来就只到这儿。我走到头了。」（恩列记账：陈五久。第一幕收尾，他会把这半个时辰还给你）', 'success');
            } else if (choice === 'stone') {
                W.addQiGrace('散修陈五久：你塞给他一枚灵石。他说灵石也不顶用了——但他到底没收回去。他记着你。');
                log('💰 你把灵石放进圈里。他看了看，没捡，也没推。「灵石如今也不顶用了。」他说，「这里头的气，跟天地间的气一个样——跑了。」但他到底没收回去。你走出很远，还觉得他在看你的背影——不怨，就是记着。（恩列记账：陈五久。他没用你的灵石，但他记着你）', 'success');
            } else {
                log('🚶 你从他面前走过去。他没抬头。官道上的风把圈里那个「卡」字磨掉了一半。（不入账——世界不围着你转）', 'info');
            }
            _scene('liu');
            return;
        }
        if (scene === 'liu') {
            if (f['_qi_liu']) return;
            if (choice === 'buy') {
                if ((money().spiritStones || 0) < 30) { say('灵石不够——但你可以搭把手。', 'warning'); _sceneLiu(); return; }
                spend(30);
            }
            if (choice === 'redeem_check') { _sceneLiu(); return; }
            f['_qi_liu'] = choice;
            record('qi_liu_' + choice);
            if (choice === 'buy') {
                W.addQiGrace('药农柳四娘：你花三十灵石买走了一整篓不值钱的枯药。她说仙长破费——你说，不值钱，不等于不值。');
                log('🧺 你把整篓枯药买了下来。她愣住：「枯药不值钱，仙长破费。」你说：不值钱，不等于不值。她在衣角上把手擦了又擦才敢接钱，又从怀里掏出一把晒干的药草硬塞给你：「就剩这点拿得出手的。」（恩列记账：柳四娘。第二幕她会带着一车伤药来——那一车的钱，是从这篓枯药里攒出来的）', 'success');
            } else if (choice === 'move') {
                W.addQiGrace('药农柳四娘：你帮她把十几株半活的苗移进了背阴的沟。她说「能活」，又说「活不了也没事，好歹死在阴凉里」。');
                log('🌱 你和她把田埂里十几株半活的苗挖出来，移进背阴有水的沟里。她看着那条沟，忽然说：「能活。」顿了顿又说：「活不了也没事。好歹死在阴凉里。」（恩列记账：柳四娘。第二幕你再路过时，那条沟里的苗活成了一小片）', 'success');
            } else {
                log('🚶 你没与她搭话。妇人继续拔她的枯药，一把一把，田埂上堆成了一座枯黄的小山。（不入账）', 'info');
            }
            _scene('yu');
            return;
        }
        if (scene === 'yu') {
            if (f['_qi_yu']) return;
            if (choice === 'guard') { _yuBattle(); return; }
            f['_qi_yu'] = 'pass';
            record('qi_yu_pass');
            log('🚶 你没上山。当夜，山顶大阵的灵光灭了。次日你听说过路的樵夫说：七霞派的老道长没走，第二天还在扫他的祖师堂，一片一片碎瓦往山下搬。后来山门废了，老道随着流民走了。（不入账；第二幕你会在流民里见他一面——他认得你，只朝你点了点头，像对一位旧识，不怨）', 'info');
            _scene('zhou');
            return;
        }
        if (scene === 'zhou') {
            if (f['_qi_zhou']) return;
            if (choice === 'redeem') {
                if ((money().spiritStones || 0) < 300) { say('灵石不够——三百灵石，赎一条自由的命。你也可以只记名字。', 'warning'); _sceneZhou(); return; }
                spend(300);
                W.addQiGrace('田埂小镇：你花三百灵石从仙师手里赎回了周小满。他娘要给你磕头，你扶住了——这一回，她谢不出口。');
                f['_qi_zhou'] = 'redeem';
                record('qi_zhou_redeem');
                log('💰 你追上仙师的队伍，掏出三百灵石。仙师收了钱，上下打量你一眼：「倒是个懂行情的。」——在他眼里这不是救人，是买卖。儿子回了镇，当夜家家门前点了一盏灯。婆娘要给你磕头，你扶住了。她一个字也说不出来——这一回，是谢不出口。（恩列记账：田埂小镇。搁浅列：周小满当场销账。平民舆论线：「修士里也有这样的」）', 'success');
            } else if (choice === 'name') {
                W.addQiStranded('周来福，五十七岁，一辈子替人种地——腿断了。周小满，十六岁——被带去北边的灵石矿。「某宗门外门弟子，御青钢剑」，这笔账没有名字，但记下了。');
                f['_qi_zhou'] = 'name';
                record('qi_zhou_name');
                log('✍️ 你问了名字：老农周来福，五十七岁，一辈子替人种地；儿子周小满，刚满十六，被带去北边的灵石矿。你把两个名字写进你的账本——搁浅列头一页的头两个名字。打断腿、绑走人的人你不知道姓名，只好写：「某宗门外门弟子，御青钢剑。」（搁浅列记账：周来福、周小满。周小满的名字，会出现在北边矿场的名册里）', 'success');
            } else {
                f['_qi_zhou'] = 'pass';
                record('qi_zhou_pass');
                log('🚶 你走出了镇子。没人拦你，也没人看你。打谷场冲洗过了，血渗进石板缝里，冲不干净。老农躺在门板上，他儿子戴着绳往北走。（不入账——但这一幕你亲眼看见了。往后不管你走哪条路，它都在）', 'info');
            }
            _scene('meet');
            return;
        }
    };

    // ---- 初见（四场毕自动） ----
    function _meet() {
        flags()['qi_scene'] = 'meet';
        modal('🌊 灵脉尽头 · 初见', para('你是循着灵气的倒流找到那里的。')
            + para('草木全朝一个方向倾倒，空气里有潮声。潮水的尽头，一条九州最大的灵脉正在死去——灵气像退潮一样离开地面，汇进一个红衣女人的袖中。')
            + para('她没有看你。她在看脚下枯掉的脉，像农人看收割完的田。')
            + para('抽完这一脉，她直起身，才看见你——眉梢动了一下，她认得你。')
            + para('「又是你。」她的语气里没有仇意，「当面拆过本座这具身体的，天下只有一个。本座记性很好。」')
            + para('灵压漫过来，你不由自主退了半步——<b class="text-gray-400">她没有出手。这半步不是你的败，是潮来了。</b>')
            + para('她看了你很久。')
            + para('<span class="text-pink-200">' + sheToPlayer(
                '「不怕。」她说，像发现了什么稀罕物件，「修士见本座，怕的、恨的、想从本座身上讨点什么的——你是头一个都不图的。」',
                '「你在看本座。」她偏了偏头，「看的不是魔头，不是血海之主——是在看我。三万年了，头一个。」') + '</span>')
            + para('她转身走，走出十步，丢下一句：')
            + para('<b class="text-red-300">「你修了一百天的东西，本座要拆掉。你恨本座吗？」</b>')
            + para('潮声停了。灵脉的原地只剩一道白色的疤。')
            + para('<span class="text-gray-500">（她没有等你回答。你的回答，在前头的三条路里）</span>')
            + btns([btn('🌫️ 回到人间——这句话得想想怎么答', 'window.qiToRoute()', 'bg-cyan-800 hover:bg-cyan-700')]));
    }
    W.qiToRoute = function () { _close(); _routeModal(); };

    // ---- 选路点 ----
    function _routeModal() {
        flags()['qi_scene'] = 'route';
        modal('⚖️ 选路', para('脉的疤在九州的地底蔓延。她那句话留在灵脉尽头，也留在你心里：你修了一百天的东西，本座要拆掉。——你打算怎么回答？')
            + btns([
                btn('⚔️ 对抗——「你只知道不能让她这么干下去。为什么——追着想去吧。」', 'window.qiRouteChoice(\'oppose\')', 'bg-red-800 hover:bg-red-700'),
                btn('🚶 无视——「天是仙人的天，塌了先砸高个的。你过日子。」', 'window.qiRouteChoice(\'ignore\')', 'bg-gray-600 hover:bg-gray-500'),
                btn('🩸 追随——「下面的人献了她，上面的人收了祭。你想看看她怎么拆这把梯子。」', 'window.qiRouteChoice(\'follow\')', 'bg-purple-800 hover:bg-purple-700')
            ]));
    }
    W.qiRouteChoice = function (r) {
        _close();
        var f = flags();
        if (f['qi_route']) return;
        f['qi_route'] = r;
        f['qi_prologue_done'] = true;
        f['qi_scene'] = 'done';
        f['qi_anchor_day'] = absDay() || 1;
        record('qi_route_' + r);
        try {
            if (typeof W.qiJournalNote === 'function') W.qiJournalNote('灵气之尽', '有人在抽天下的脉。她公示了期限：三年后的今日，天下最后一缕灵气入海。你选的路——' + (r === 'oppose' ? '对抗' : (r === 'ignore' ? '无视' : '追随')) + '。');
            if (typeof W.qiCodexNote === 'function') W.qiCodexNote('qi_lingqizhijin', '灵气之尽', '灵脉是天道收租的管道。有人在拆管道——她公示：三年后的今日，天下最后一缕灵气入海。');
        } catch (e) {}
        if (typeof W.qiSetStage === 'function') W.qiSetStage(1);
        try {
            var q = W.QuestRegistry && W.QuestRegistry.get ? W.QuestRegistry.get('main_010') : null;
            if (q) { q.completed = true; q.turnedIn = true; if (q.objectives && q.objectives[0]) q.objectives[0].completed = true; }
            if (typeof W.updateQuestUI === 'function') W.updateQuestUI();
        } catch (e) {}
        if (r === 'oppose') {
            log('⚔️ 你转身下山。她说的那句话，你答不上来。你只知道官道上那个用枯枝画的「卡」字、药篓上的「柳家药庐」、那座自己守自己的坟、打谷场上那声「谢仙师留我们全家活命」。不能让她这么干下去。为什么——追着想去吧。（对抗线开启：枯萎巡）', 'success');
        } else if (r === 'ignore') {
            log('🚶 你转身回了家。天塌下来先砸高个的——你不是高个，也不想当。灵气薄了就薄了，日子还得过。那道灵脉的疤在你看不见的地方，她那句话，你只当是风。（无视线开启：衰减的日子——从今往后，天地灵气随你的日子，一分一分变薄）', 'info');
        } else {
            log('🩸 你顺着那道白疤，朝灵脉尽头走了回去。（追随线开启：投海）', 'danger');
        }
        log('🗺️ 终局面板已开：九州枯萎图（她的红线+三年倒计时）、账本（恩/仇/搁浅/人心四列）。天地灵气，薄了一分。', 'info');
        W.openQiEndgamePanel();
    };

    console.log('[qi-arc1] v25.0《灵气之尽》批一已注册：终局枢纽+账本四列+序幕四场戏+初见+选路点（main_010 新文本）');
})();
