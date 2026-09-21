// ==================== qi-finale.js - 《灵气之尽》第三幕：汇流终战 + 犹豫拍 + 四结局 ====================
// v25.0 推倒重写 · 批五：main_056 血海坝前（三幕前夜改道/到场姿态/三方战波次/还命名单）
//                        main_057 犹豫（原样奉还/两种笑/两种笑都不谴责）
//                        main_058 灵气之尽（斩/渡/放/不飞升 四结局页+尾声账单+页脚小字）
// 对齐：主线大纲·灵气之尽.md 第三幕节 + 8.3 终幕决策 + 8.4 补丁⑤改道 + 11.1 结局即关系 + 11.4②③④⑤⑦
// 纪律：波数与折敌内读账本、界面只见名字不见数字；被放者逐波还命各一句；两种笑都不谴责；
//       渡门槛叙事化（吃过一碗/喝过一坛/看过债册）；只叙事不扣数值；道侣陪你老去不死不离；零轮回暗示。
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
    function record(id, title) { if (typeof W.recordChoice === 'function') { try { W.recordChoice(id, title || '灵气之尽'); } catch (e) {} } }
    function _close() { if (typeof W.qiCloseModal === 'function') W.qiCloseModal(); }
    function modal(title, body) {
        _close();
        var wrap = '<div class="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4" id="qi-modal-overlay">'
            + '<div class="bg-gray-900 border-2 border-red-800 rounded-xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto">'
            + '<h2 class="text-xl font-bold text-red-300 mb-3 text-center">' + title + '</h2>' + body + '</div></div>';
        if (document.body && document.body.insertAdjacentHTML) document.body.insertAdjacentHTML('beforeend', wrap);
    }
    function btn(label, onclick, cls) {
        return '<button onclick="' + onclick + '" class="' + (cls || 'bg-red-800 hover:bg-red-700') + ' text-xs px-3 py-2 rounded text-left">' + label + '</button>';
    }
    function btns(arr) { return '<div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">' + arr.join('') + '</div>'; }
    function para(t) { return '<p class="text-sm text-gray-300 leading-relaxed mb-2">' + t + '</p>'; }
    function lock(text) { return '<div class="bg-gray-700/50 text-xs px-3 py-2 rounded text-left text-gray-500 cursor-not-allowed">' + text + '</div>'; }
    function realmIdx(r) {
        var order = ['凡人', '炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫', '真仙', '金仙', '飞升'];
        var i = order.indexOf(String(r == null ? '' : r));
        if (i >= 0) return i;
        try { return typeof W.getRealmTier === 'function' ? W.getRealmTier(r) : 6; } catch (e) { return 6; }
    }
    function tribOk() { return realmIdx((W.currentCharData || {}).realm) >= realmIdx('渡劫'); }
    function fame(n) { if (typeof W.addFame === 'function') { try { W.addFame(n); } catch (e) {} } }
    function hb() { try { return typeof W.qiHeartBondProbe === 'function' ? W.qiHeartBondProbe() : 0; } catch (e) { return 0; } }
    function restore(n) { if (typeof W.restoreWorldQi === 'function') { try { W.restoreWorldQi(n); } catch (e) {} } }
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
    function street(text) {
        var f = flags();
        if (!f['qi_street'] || !f['qi_street'].push) f['qi_street'] = [];
        f['qi_street'].push({ day: absDay(), text: text });
    }

    // ---- 章节注册 main_056~058（第三幕；旧正典 main_021~035 存活占用，重编号避让）----
    function q(id, title, desc, flag) {
        return {
            id: id, title: title, type: 'main', priority: 10, description: desc,
            objectives: [{ type: 'custom', target: flag, count: 1, completed: false }],
            rewards: { exp: 0, spiritStones: 0, items: [] },
            story: '灵气之尽 · 第三幕', accepted: false, completed: false, turnedIn: false
        };
    }
    var QI_FIN = [
        q('main_056', '血海坝前', '三年了。最后一条脉在血海坝下——你、她、天上的管事，三方都到了。', 'qi_fin_fought'),
        q('main_057', '犹豫', '镰尽了。她站在漩涡底下，力竭，不躲——她想看看你会不会犹豫。', 'qi_fin_hesitated'),
        q('main_058', '灵气之尽', '账本的最后一笔，得你来写。', 'qi_ending')
    ];
    (function register() {
        try {
            var chain = W.mainQuestChain;
            if (chain && chain.push) {
                for (var i = 0; i < QI_FIN.length; i++) {
                    var has = false;
                    for (var j = 0; j < chain.length; j++) { if (chain[j] && chain[j].id === QI_FIN[i].id) { has = true; break; } }
                    if (!has) chain.push(QI_FIN[i]);
                }
            }
            if (W.QuestRegistry && typeof W.QuestRegistry.registerMany === 'function') W.QuestRegistry.registerMany(QI_FIN);
        } catch (e) {}
    })();
    function accept(id) {
        try {
            var qq = W.QuestRegistry && W.QuestRegistry.get ? W.QuestRegistry.get(id) : null;
            if (qq && !qq.accepted && typeof W.acceptQuest === 'function') W.acceptQuest(id);
        } catch (e) {}
    }
    function completeQuest(id) {
        try {
            var qq = W.QuestRegistry && W.QuestRegistry.get ? W.QuestRegistry.get(id) : null;
            if (qq) { qq.completed = true; qq.turnedIn = true; if (qq.objectives && qq.objectives[0]) qq.objectives[0].completed = true; }
            if (typeof W.updateQuestUI === 'function') W.updateQuestUI();
        } catch (e) {}
    }
    function scene(s) { flags()['qi_e_scene'] = s; }

    // ---- 终幕资格与面板按钮 ----
    function finaleReady() {
        var f = flags();
        var r = f['qi_route'];
        if (r === 'oppose') return !!f['qi_c18'];
        if (r === 'follow') return !!f['qi_s06'];
        if (r === 'ignore') return f['qi_finale_ignore'] === 'go';
        return false;
    }
    var SCENE_LABEL = {
        e_eve: '三幕前夜', e_arrive: '血海坝前 · 到场', e_life: '波次之间 · 还命',
        e_w1_battle: '三方战 · 首波', e_w2_battle: '三方战 · 次波', e_w3_battle: '三方战 · 管事',
        e_hes: '漩涡底下 · 犹豫', e_end: '账本的最后一笔'
    };
    W.qiFinaleButtons = function () {
        var f = flags();
        if (!f['qi_prologue_done']) return [];
        var out = [];
        if (f['qi_ending']) {
            out.push(btn('📖 回望那一页——结局账单', 'window.qiShowEndingPage()', 'bg-amber-800 hover:bg-amber-700'));
            return out;
        }
        if (f['qi_route'] === 'ignore' && f['qi_h06'] && f['qi_finale_ignore'] === 'stay') {
            out.push(btn('📖 灵气之尽那夜，你没去——把那天的账结了吧', 'window.qiShowStayEnding()', 'bg-gray-600 hover:bg-gray-500'));
            return out;
        }
        if (!finaleReady()) return [];
        var sc = f['qi_e_scene'];
        if (sc) {
            out.push(btn('▶️ 继续——' + (SCENE_LABEL[sc] || '血海坝前的路'), 'window.qiResumeFinale()', 'bg-red-800 hover:bg-red-700'));
        } else if (tribOk()) {
            out.push(btn('🌊 脉尽头前夜——三年了，该到账了', 'window.qiStartFinale()', 'bg-red-800 hover:bg-red-700'));
        } else {
            out.push(lock('🔒 脉尽头之威，肉身难近——需渡劫修为，才站得住潮声里。（世界规则，不哄人）'));
        }
        return out;
    };
    W.qiResumeFinale = function () {
        var sc = flags()['qi_e_scene'];
        if (!sc) { if (typeof W.openQiEndgamePanel === 'function') W.openQiEndgamePanel(); return; }
        var m = /^e_w(\d)_battle$/.exec(sc);
        if (m) { _waveBattle(Number(m[1])); return; }
        if (sc === 'e_eve') _eve();
        else if (sc === 'e_arrive') _arrive();
        else if (sc === 'e_life') _lifeModal();
        else if (sc === 'e_hes') _hesitate();
        else if (sc === 'e_end') _endModal();
    };

    // ============ main_056 血海坝前 ============
    W.qiStartFinale = function () {
        var f = flags();
        if (f['qi_ending'] || f['qi_e_scene']) { W.qiResumeFinale(); return; }
        if (!finaleReady() || !tribOk()) {
            say('脉尽头之威，肉身难近——需渡劫修为，才站得住潮声里。', 'warning');
            return;
        }
        accept('main_056');
        f['qi_finale_started'] = true;
        if (f['qi_route'] === 'follow') f['qi_finale_follow'] = true; // 同行期收束，日常池停拍
        if (!f['qi_eve_done']) _eve();
        else _arrive();
    };
    // ---- 三幕前夜：唯一一次改道（补丁⑤，只此一夜，过期不候）----
    function _eve() {
        scene('e_eve');
        var f = flags(), r = f['qi_route'];
        var setting = r === 'follow' ? '她的大帐里，灯没点。' : (r === 'ignore' ? '你家院子里，窗台上（或行囊里）是那坛酒。' : '义士们的营地，火堆压得很低。');
        var extra = [];
        if (r === 'oppose') extra.push(btn('🩸 改投她帐下——去她那边（债册会多一页「他来得晚」）', 'window.qiEveChoice(\'follow\')', 'bg-purple-800 hover:bg-purple-700'));
        if (r === 'follow') extra.push(btn('⚔️ 改立她对面——拔剑站到义士那头（最重的背叛：她依旧不躲）', 'window.qiEveChoice(\'oppose\')'));
        if (r === 'ignore') {
            extra.push(btn('🩸 去她那边——那坛酒，就是做头的由头', 'window.qiEveChoice(\'follow\')', 'bg-purple-800 hover:bg-purple-700'));
            extra.push(btn('⚔️ 站到她对面——那坛酒，就是做头的由头', 'window.qiEveChoice(\'oppose\')'));
        }
        var body = para('脉尽头前夜。' + setting)
            + para('明日，最后一条脉的地方，三方都会到：你、她、和天上那些执镰的管事。')
            + para('<b class="text-amber-200">只此一夜，你还可以换一条路。过了今夜，过期不候。</b>')
            + btns([btn('🕯️ 不换——脚下的路，就是要走完的路', 'window.qiEveChoice(\'keep\')', 'bg-gray-600 hover:bg-gray-500')].concat(extra));
        modal('🌒 三幕前夜', body);
    }
    W.qiEveChoice = function (c) {
        _close();
        var f = flags();
        if (f['qi_eve_done']) return;
        f['qi_eve_done'] = true;
        record(c === 'keep' ? 'qi_eve_keep' : 'qi_eve_switch', '三幕前夜');
        if (c === 'keep') {
            log('🕯️ 前夜，你没换路。有些账，走到这一步就不用再算了——脚下这条，就是你要走完的。', 'info');
        } else {
            var old = f['qi_route'];
            f['qi_route'] = c;
            if (c === 'follow') {
                f['qi_finale_follow'] = true;
                f['qi_came_late'] = true;
                log('🩸 前夜，你去了她的帐。她看了你很久，什么都没说，翻开债册写了一页：「<b class="text-pink-200">他来得晚。</b>」写完合上册子：「来得晚，也是来了。」（改道：追随——明日她站在你身边半步）', 'success');
            } else {
                f['qi_betrayal'] = true;
                log('⚔️ 前夜，你离开了大帐，站到了义士们那头。她知道了。她什么都没说——明日漩涡底下，她依旧不躲。（改道：对抗——最重的背叛戏，犹豫拍她有一句专属的话）', 'warning');
            }
            if (old === 'ignore') log('🍶 你把那坛酒从窗台上（或行囊里）拿了起来。酒是做头的由头——你动身了。', 'info');
        }
        _arrive();
    };
    // ---- 到场姿态（三线各写）+ 三方战开场 ----
    function allyScore() {
        var f = flags(), r = f['qi_route'], s = 0;
        if (r === 'oppose') {
            try { s = typeof W.qiRosterProbe === 'function' ? W.qiRosterProbe().length : 1; } catch (e) { s = 1; }
        } else if (r === 'follow') {
            s = Math.floor(hb() / 30) + (f['qi_truth_told'] ? 1 : 0) + (f['qi_debt_name'] ? 1 : 0);
        } else {
            s = (f['qi_knock2'] === 'escort' ? 1 : 0) + (f['qi_knock3'] === 'wine' ? 1 : 0) + (f['qi_kin'] === 'took' ? 1 : 0);
        }
        return s;
    }
    function waveCount() {
        var f = flags();
        var w = f['qi_route'] === 'ignore' ? 3 : (allyScore() >= 4 ? 2 : 3);
        // 盘问国师·内情满两笔：守脉盟撤了与天上的香火盟约——收割者少一镰（8.3 兑现，内读不报数）
        if (Number(f['qi_preceptor_intel'] || 0) >= 2) w = Math.max(1, w - 1);
        return w;
    }
    function hpMul() {
        var f = flags();
        var mul = 1 - 0.08 * Math.min(allyScore(), 4); // 折敌叠乘——内读，界面只见名字不见数字
        if (f['qi_route'] === 'oppose' && f['qi_alliance'] === 'sign') mul *= 0.9; // 签盟：天兵折一成
        return mul;
    }
    function _arrive() {
        scene('e_arrive');
        var f = flags(), r = f['qi_route'];
        var body = '';
        if (r === 'oppose') {
            var names = [];
            try { names = (typeof W.qiRosterProbe === 'function' ? W.qiRosterProbe() : []).map(function (p) { return p.name; }); } catch (e) {}
            body += para('血海坝前，潮声如雷。你到时，义士们已经在了——名册上的名字一个个到场，站到你身后：' + (names.length ? '<b class="text-amber-200">' + names.join('、') + '</b>。' : '来的人不多，但来了的，都站定了。'))
                + para('名册不报数。来一个，是一个名字。');
            if (f['qi_truth'] === 'publish') body += para('她见到你的第一句，不是骂，不是问：「<b class="text-pink-200">你是会说出去的人。</b>」顿了顿，又补了半句，「本座等这种人，等了三万年。」');
        } else if (r === 'follow') {
            body += para('血海坝前，潮声如雷。她就站在你身边，半步没离开——三年拆坝、点兵、夜话、危机，这条路的每一步她都与你同账。')
                + para('血海营的大帐拆了，跟来的人都站在坝下。她今日没看账。');
        } else {
            if (f['qi_knock3'] === 'wine') body += para('血海坝前，潮声如雷。你带着那坛酒来的——她在坝下看见你，眉梢动了一下：「真来了。」');
            else body += para('血海坝前，潮声如雷。你一个人来的，空着手。她在坝上看见你，没有打招呼，也没有赶你走——过客有过客的站法。');
            if (f['qi_knock1'] === 'went') {
                body += para('她忽然提起一件旧事：「守脉盟那份名册，你去看过。」不是问句。「看完的人，什么都没说——本座一直可惜。」她转身面向潮声，「今日，本座让你看个真的。」');
                street('不问世事的人，当年去看过盟的名册。今日他站在血海坝前——看真的那一本。');
            }
        }
        body += para('天上的云裂开了。<b class="text-red-300">管事执镰而至。</b>他们主要不是来杀你的——是来杀她的。三万年了，头一个逃税的，天要亲自来收账。')
            + para('镰刀落下来的时候，' + (r === 'follow' ? '她已经与你并肩：「这一仗，本座与你，一本账。」' : '她已经在你们中间了。'));
        if (r === 'oppose') {
            body += para('她头也不回：<b class="text-pink-200">「别误会——他们收的是税，不是公道。本座护的不是你，是这田里最后一茬不肯跪的。」</b>');
            if (f['qi_alliance'] === 'sign') body += para('守脉盟的盟军首波也到了——阵却摆在你身后，军中有人高喊：「盟册上写着，你也在盟的保护之列！」（被保护的人，说不出保护两个字）');
        } else if (r === 'ignore') {
            body += para('你要独战。' + (f['qi_knock3'] === 'wine' ? '她叹了口气，侧身站到你波前：「那坛酒，本座记着。」——有一波，她会替你挡。' : '她远远看了你一眼，没过来——各打各的账。'));
        }
        body += btns([
            btn('⚔️ 首波——执镰的收割者落下来了（真仗）', 'window.qiWaveFight()'),
            btn('🚶 转身离开——账，不是非清不可', 'window.qiEnding(\'stay\')', 'bg-gray-600 hover:bg-gray-500')
        ]);
        modal('🌊 血海坝前 · 三方战', body);
    }
    var WAVE_ENEMIES = [
        { name: '管事·执镰者', hp: 2600, atk: 280, def: 160, spd: 110, desc: '天道的收租人——镰刀割过三万年的熟' },
        { name: '管事·拽锁人', hp: 2800, atk: 300, def: 170, spd: 105, desc: '锁是他上的，钥匙也是他守的' },
        { name: '管事之首·司稼者', hp: 3200, atk: 340, def: 190, spd: 115, desc: '收割有册，稼穑有名——他管的就是这片「田」' }
    ];
    W.qiWaveFight = function () {
        var n = (Number(flags()['qi_wave']) || 0) + 1;
        _waveBattle(n);
    };
    function _waveBattle(n) {
        var f = flags();
        var total = waveCount();
        if (n > total) { _hesitate(); return; }
        // 无视线+接酒：次波她替你挡（那坛酒的兑现场）
        if (f['qi_route'] === 'ignore' && f['qi_knock3'] === 'wine' && n === 2) {
            f['qi_wave'] = 2;
            log('🍶 第二波镰刀落下来时，她侧身站到了你面前，袖袍一卷，替你挡了个干净。「那坛酒，本座记着。」她说，「这一波，两清。」（还命：她的——酒债当场销）', 'success');
            _lifeModal();
            return;
        }
        var e = WAVE_ENEMIES[Math.min(n, WAVE_ENEMIES.length) - 1];
        scene('e_w' + n + '_battle');
        var mul = (1 + 0.15 * realmIdx((W.currentCharData || {}).realm)) * hpMul();
        var enemy = {
            name: e.name,
            hp: Math.round(e.hp * mul), maxHp: Math.round(e.hp * mul),
            attack: Math.round(e.atk * mul), defense: Math.round(e.def * mul), speed: Math.round(e.spd * mul),
            description: e.desc,
            _isQiStory: true, _qiBeat: 'fin_w' + n
        };
        log('⚔️ ' + e.name + '执镰而落——这一仗，你亲手打。（' + e.desc + '）', 'danger');
        if (typeof W.startBattle === 'function') W.startBattle(enemy);
    }
    var WAVE_LOSE = '💔 镰风把你掀翻在坝前。她（或义士们）把你拖了回来——收割者收的是她的账，你的命，他们暂时不收。（回面板可再战）';
    W._qiSettleExtraD = function (win, beat) {
        var m = /^fin_w(\d)$/.exec(String(beat || ''));
        if (!m) return;
        var n = Number(m[1]);
        if (!win) {
            scene('e_w' + n + '_battle');
            say(WAVE_LOSE, 'warning');
            return;
        }
        var f = flags();
        f['qi_wave'] = n;
        if (n >= waveCount()) {
            f['qi_fin_fought'] = true;
            completeQuest('main_056');
            log('🌊 最后一镰被你打断了。管事之首收起残镰，看了她一眼，又看了你一眼——像在看一株长歪了的庄稼。云缝合上了。坝前只剩潮声、漩涡，和她。（三方战毕）', 'success');
            _hesitate();
        } else {
            _lifeModal();
        }
    };
    // ---- 波次之间：还命名单（全读真账，逐波各一句）----
    function lifeLines() {
        var f = flags(), out = [];
        if (f['qi_boss1_fate'] === 'spare') out.push('杜无忧背着药箱出列，替你挡了一波镰影：「一刀之恩，今日还。」');
        if (f['qi_boss2_fate'] === 'spare') out.push('霍无霜把一炉火搬到你阵脚：「一炉之恩。天冷——你们用得着。」');
        if (f['qi_boss3_fate'] === 'spare') out.push('沙量带着一队还过乡的人结成人墙：「押最后一趟镖。镖是你。」');
        if (f['qi_boss4_fate'] === 'spare') out.push('藏风真人把袖子倒空——写家书攒下的灵石全扔进你阵里：「守了半辈子的库叫你搬空了。怪事——我睡得着了。」');
        if (f['_qi_chen'] === 'stone') out.push('陈五久摸出你那枚灵石——他一直没用，磨得发亮：「那枚灵石我没能用上，但收着了。今日，给你压阵。」');
        if (f['qi_knock2'] === 'escort') out.push('南边来的三百口人走了千里，为首的白发老掌门拄着剑：「灯下半日，今日还。」');
        if (f['qi_kin'] === 'took') out.push('你收留过的那个旧识也来了，拎着一把菜刀——他根基废了，力气还在：「家里那双筷子，今日用上了。」');
        if (f['qi_crisis'] === 'silent') out.push('人群里有几张你没见过的脸——从炎城逃出来的人。他们没报名字，只把锄头和灵绳举了起来：城没出来的三千口，他们替着来了。');
        if (f['_qi_zhou'] === 'redeem' || (f['_qi_zhou'] === 'name' && f['qi_boss3_fate'])) out.push('田埂小镇的婆婆来了，提着一篮新蒸的馍：「我不懂大事。他们去哪儿，我去哪儿。」');
        return out;
    }
    function _lifeModal() {
        scene('e_life');
        var f = flags();
        var shown = Number(f['qi_life_shown'] || 0);
        var lines = lifeLines();
        var rest = lines.slice(shown);
        f['qi_life_shown'] = lines.length;
        var body = para('波次之间，坝前喘了一口气的工夫——');
        // 11.4⑦：对抗线首波打退后，她的专属一句（男/女分流，一次性）
        if (f['qi_route'] === 'oppose' && Number(f['qi_wave']) >= 1 && !f['qi_seven_shown']) {
            f['qi_seven_shown'] = true;
            body = para(isMale()
                ? '打退首波，她咧开嘴，血点子溅在腮上也不擦：「<b class="text-pink-200">门后要是有好东西，本座六成——骗你的，五五分。</b>」'
                : '打退首波，她与你背靠着背，只说了两个字：「<b class="text-pink-200">并肩。</b>」') + body;
        }
        if (rest.length) body += rest.map(para).join('') + para('<span class="text-gray-400">（还命：账上的人，一个个到场。名册不报数，到场的都是名字。）</span>');
        else body += para('没有人再赶到——该到的都到了，该还的都在还。风里只剩潮声。');
        body += btns([btn('⚔️ 下一波——镰刀又抬起来了（真仗）', 'window.qiWaveFight()')]);
        modal('🕯️ 波次之间 · 还命', body);
    }

    // ============ main_057 犹豫 ============
    function echoText() {
        var f = flags(), r = f['qi_route'];
        if (r === 'oppose') {
            var m = f['qi_motive'];
            if (m === 'life') return para('她先开了口，把你当年的话原样还给你：「<b class="text-pink-200">为那些被截断的命。</b>——这是你当年说的。本座今日原样奉还：你护住了吗？」');
            if (m === 'city') return para('她先开了口，把你当年的话原样还给你：「<b class="text-pink-200">为账上那些城。</b>——这是你当年说的。本座今日原样奉还：账，清了吗？」');
            if (m === 'curious') return para('她先开了口，把你当年的话原样还给你：「<b class="text-pink-200">为想知道——破栏之后，你要干什么。</b>——这是你当年说的。栏就要破了。你看到了吗？」');
            if (m === 'unclear') return para('她先开了口，笑出声来——笑得像当年惊起剑阁一山的鸦：「<b class="text-pink-200">说不清。</b>——这是你当年说的。如今还说不清吗？说不清就好。想清楚了的人，都是假的。」');
            // 改道而来（追随→对抗）：没有剑阁那句旧话，她还的是另一笔账
            return para('她先开了口，把你这三年的路原样还给你：「你替本座拆过坝，也替本座记过账。今夜你站到本座对面来了——<b class="text-pink-200">这一剑，是你自己的路递到本座手里的。</b>」');
        }
        if (r === 'follow') {
            var t = '';
            if (f['qi_talk'] === 'tease') t = para('她想起崖边那晚：「你说要请本座吃一碗面。两个铜板的。」今天她没弹你脑瓜崩——她没力气了。「<b class="text-pink-200">你这一剑，是贫嘴，还是认真？</b>」');
            else if (f['qi_talk'] === 'earnest') t = para('她想起崖边那晚：「你说：不怪。冷饭的世界里，那勺汤是唯一的热的。今日本座再问你一回——<b class="text-pink-200">梯子倒了以后的世界，你懂吗？</b>」');
            else t = para('她想起你入帐那天：「你去哪儿，我去哪儿，就这样——这是你说的。」今天她把这句话还给你：「<b class="text-pink-200">本座去哪儿，你还去吗？</b>」');
            if (f['qi_debt_name']) t += para('「债册最后一页，你替本座写了名字。」她看着你，「写了，就要看到底——<b class="text-pink-200">现在，本座请你看到底。</b>」');
            return t;
        }
        if (f['qi_knock3'] === 'wine') return para('她冲你举了举手边的坛子：「你接酒的时候，本座说过：<b class="text-pink-200">你来，就有你一份。</b>」坛子里是天下最后一缕灵气。「你的一份，本座留到了现在。」');
        return para('她朝你家的方向看了一眼：「窗台上那坛酒，你带来了吗？」你摇头。「也好，」她说，「<b class="text-pink-200">那本来就是送行。</b>」');
    }
    function _hesitate() {
        var f = flags();
        if (f['qi_fin_hesitated']) { _endModal(); return; }
        accept('main_057');
        scene('e_hes');
        var body = para('镰尽了。灵气的漩涡在血海上空慢慢转，像一口倒过来的井。她站在漩涡底下，衣袍湿透，力竭——三年的账，她一个人算到了最后一页。')
            + para('身后是栏，身前是你。')
            + echoText();
        if (f['qi_route'] === 'oppose' && f['qi_truth'] === 'burn') {
            body += para('她忽然想起什么似的，看着你笑了：「<b class="text-pink-200">你烧掉的那卷东西，本座背得出来。</b>教本座认字的，偏偏是个管事。」——她知道。你谁也没瞒住，她替你瞒到了今天。');
        }
        if (f['qi_route'] === 'oppose' && f['qi_interlude'] === 'answer') {
            body += para('她又想起那封信：「你答过本座——会来。但会为你多难过一天。」她笑得很轻，「<b class="text-pink-200">这句话，本座记了三年。</b>红线停的那一天，就是它值钱的那一天。」');
        }
        if (f['qi_betrayal']) body += para('她看了看你手里的剑，忽然笑了：<b class="text-red-300">「本座早知道会有这一天。还是想看看。」</b>');
        body += para('她站定，不躲：')
            + para('<b class="text-pink-200">「你动手吧。本座不躲——本座想看看，你会不会犹豫。」</b>')
            + btns([
                btn('⚔️ 这一剑，刺下去了', 'window.qiHesitation(\'strike\')'),
                btn('🕯️ 你犹豫了一瞬', 'window.qiHesitation(\'wait\')', 'bg-amber-800 hover:bg-amber-700'),
                btn('🚶 转身离开——账，不是非清不可', 'window.qiEnding(\'stay\')', 'bg-gray-600 hover:bg-gray-500')
            ]);
        modal('🌌 漩涡底下 · 犹豫', body);
    }
    W.qiHesitation = function (c) {
        _close();
        var f = flags();
        if (f['qi_fin_hesitated']) { _endModal(); return; }
        f['qi_hesitation'] = c;
        record('qi_hesitation_' + c, '犹豫');
        if (c === 'strike') {
            f['qi_fin_hesitated'] = true;
            completeQuest('main_057');
            var laugh = isMale()
                ? '她笑得畅快，血从嘴角淌下来也不擦：「好啊。梯子上头的人，也有肯亲手拆自己脚下这一级的——本座没看错你。替本座看看……上头。」'
                : '她笑得畅快，血从嘴角淌下来也不擦：「好啊。输给你，心服口服。替本座看看……上头。」';
            log('⚔️ ' + laugh, 'danger');
            if (hb() >= 60) log('🗡️ 笑完，她忽然凑近了半分，声音低得只有你一个人听得见：「本座陪过很多人修行，只有你，陪到了本座心里。」她直起身，还是笑的，「<b class="text-pink-200">刺得好。别难过太久——一天就够了。</b>」（情分至深×刺下去——这一句，天下只有你听过）', 'danger');
            log('🗡️ 她死前看着你，不看天：「<b class="text-pink-200">你还是选了那把梯子。</b>」说完，是笑的。（犹豫拍：刺下去——两种笑都不谴责，这只改她最后的话与账单页的余韵）', 'danger');
            qiEndingDirect('slay');
        } else {
            f['qi_fin_hesitated'] = true;
            completeQuest('main_057');
            log('🕯️ 你的剑停在半空——只停了一瞬，但她看见了。她反而笑了：「犹豫就对了。不犹豫的，本座见过每一个——后来都成了管事。」两种笑都不谴责你。（犹豫拍：犹豫一瞬——结局池不变，她的最后一句话变了）', 'info');
            _endModal();
        }
    };
    function _endModal() {
        scene('e_end');
        var ferryOk = _ferryOk();
        modal('🌌 账本的最后一笔', para('漩涡在她头顶转，天下最后一缕灵气在她袖中。她力竭，不躲，等你落笔。')
            + para('<b class="text-amber-200">这一笔，只能你来写。</b>')
            + btns([
                ferryOk
                    ? btn('⛓️ 渡——留她性命，废她修为，囚她：「你要负责。」', 'window.qiEnding(\'ferry\')', 'bg-amber-800 hover:bg-amber-700')
                    : lock('🔒 渡的手，得先接过她的东西——你与她只是相识，没吃过一碗、没喝过一坛、没看过债册。（与她吃过一碗、喝过一坛、看过债册的人，才走得到她身边）'),
                btn('🕊️ 放——让开路，让她的理想走完', 'window.qiEnding(\'release\')', 'bg-emerald-800 hover:bg-emerald-700'),
                btn('🚶 转身离开——账，不是非清不可', 'window.qiEnding(\'stay\')', 'bg-gray-600 hover:bg-gray-600')
            ]));
    }
    function _ferryOk() {
        var f = flags();
        return hb() >= 30 || f['qi_knock3'] === 'wine' || !!f['qi_debt_choice'] || !!f['qi_talk'];
    }

    // ============ main_058 四结局 ============
    W.qiShowStayEnding = function () { qiEndingDirect('stay'); };
    W.qiEnding = function (kind) { _close(); qiEndingDirect(kind); };
    function qiEndingDirect(kind) {
        var f = flags();
        if (f['qi_ending']) { W.qiShowEndingPage(); return; }
        f['qi_ending'] = kind;
        f['qi_ending_route'] = f['qi_route'];
        f['qi_ending_day'] = absDay() || 1;
        f['qi_e_scene'] = '';
        record('qi_ending_' + kind, '灵气之尽');
        try {
            if (typeof W.qiCodexNote === 'function') W.qiCodexNote('qi_ending_' + kind, '灵气之尽 · ' + _endingName(kind), _journalLine(kind));
        } catch (e) {}
        accept('main_058');
        completeQuest('main_056');
        completeQuest('main_057');
        completeQuest('main_058');
        f['qi_fin_hesitated'] = true;
        f['qi_fin_fought'] = true;
        // 世界数值（只此一处按结局调总闸余量——灵气回多少，账在世界身上）
        if (kind === 'slay') { restore(20); fame(50); }
        else if (kind === 'ferry') { restore(12); fame(20); }
        else if (kind === 'release') { if (hb() >= 60) restore(10); }
        try {
            if (W.WorldJournal && W.WorldJournal.record) W.WorldJournal.record({ type: 'endgame', title: '灵气之尽', text: _journalLine(kind) });
        } catch (e) {}
        log('📕 灵气之尽——结局「' + _endingName(kind) + '」已入档。账单页合上了，日子还长。（回望：终局面板「回望那一页」）', 'success');
        W.qiShowEndingPage();
    }
    function _journalLine(kind) {
        if (kind === 'slay') return '血海坝溃，蓄气归脉。玄冥子死于漩涡之下，死前是笑的。末法时代自今年始。';
        if (kind === 'ferry') return '玄冥子废修为，囚于七霞派祖师堂。债册放在她膝上。坝未开，蓄气百年缓渗。';
        if (kind === 'release') return '玄冥子携蓄气破栏而去，裂缝在她身后合拢。灵脉永空，仙路终结。';
        return '灵气之尽那夜，没有人到血海去。第二天，天地间安静得像一口空井——她把要做的事做完了。';
    }
    function _endingName(kind) {
        var f = flags();
        if (kind === 'slay') return '斩 · 末法时代';
        if (kind === 'ferry') return '渡 · 问责';
        if (kind === 'release') return '放 · 仙路终结';
        var r = f['qi_ending_route'] || f['qi_route'];
        if (r === 'ignore') return '不飞升 · 旁观·过客';
        if (r === 'follow') return '不飞升 · 山下面馆';
        return '不飞升 · 账清了';
    }
    W.qiShowEndingPage = function () {
        var f = flags();
        var kind = f['qi_ending'];
        if (!kind) { say('账本还没写到那一页。', 'info'); return; }
        var secs = [], footer = [];
        var comp = companionName();
        if (kind === 'slay') {
            secs.push(para('⚔️ 你的剑穿过她的胸口。她死前看着你，不看天：「你还是选了那把梯子。」说完，是笑的。'));
            secs.push(para('血海坝溃了。三年蓄的灵气随潮归回九州——枯过的脉重新睁开眼，天地深深吸了一口气。'));
            secs.push(para('可<b class="text-amber-200">伤过的脉不回上古</b>。末法时代来了：灵气一年比一年薄，仙路一年比一年窄。梯子还在，收割照旧，天上的管事换了一茬又一茬——账对上了，一笔都没少。'));
            secs.push(para('你保住了超脱的可能，也保住了吃人的等级。义士名册的头一个名字是你，说书人把你唱了一百年。'));
            footer.push('账单页不给答案——她死前是笑的。这一剑对不对，天地没说，你也没说。');
        } else if (kind === 'ferry') {
            secs.push(para('⛓️ 你没杀她。你废了她的修为——那只抽过天下灵脉的手，再也提不起刀。你把她囚在了七霞派祖师堂。'));
            secs.push(flags()['_qi_yu'] === 'guard'
                ? para('囚阵是用那半块阵眼灵石点亮的——虞松子亲手把石头交给你，只说了四个字：「阵记得她。」')
                : para('囚阵是百姓凑的灵石点的——一家一块，没有一块是整的。阵普通，灯也普通，可守灯的人不少。'));
            secs.push(para('她不反抗。阵点亮的时候，她只说了一句：「<b class="text-pink-200">你是头一个对本座说『你要负责』的人。好。本座负责。</b>」'));
            secs.push(flags()['qi_debt_name']
                ? para('债册放在她膝上。册子的最后一页不再是空白——那三个字是你写的，她每天都看。')
                : para('债册放在她膝上。最后一页还空着。她不写。她在等。'));
            secs.push(para('坝未开，蓄气百年缓渗——灵气半回，末法减轻。梯子拆了一半：上头的人下得来，下头的人，爬上去难了。'));
            secs.push(para('你隔三差五去送饭。她学会了等人。'));
            if (hb() >= 60) {
                secs.push(para('囚阵点亮那日，她把腰间那枚血玉解下来，隔着阵递给你：「收着。」你问她留这个做什么。她耳根红了，咬着那两个字：「……放肆。」却没有收回手，「本座这一生，抢过灵气、抢过命。头一回——想被人收下。<b class="text-pink-200">收好了，概不退换。</b>」'));
                secs.push(para('<span class="text-gray-400">（此后每次探视，囚阵内外，她学会了等人，学会了说账以外的事。本座被' + (isMale() ? '他' : '她') + '调戏了很多年——这话她死也不会认，下文照样不给他们，给你留着。）</span>'));
            }
            footer.push('问责，是把她当人。三十万年了，头一回有人给她这个待遇。');
        } else if (kind === 'release') {
            secs.push(para('🕊️ 你让开了路。她看了你一眼，没问为什么——她带着三年的蓄气，破了栏。'));
            secs.push(para('裂缝在她身后合拢。上面有什么，这一界再没有人知道了。<b class="text-gray-400">她没有回头。</b>'));
            if (hb() >= 60) {
                secs.push(para('她走到裂缝底下，忽然停住，回手抛给你一样东西——血玉凝的半坛灵气，沉得坠手。「<b class="text-pink-200">本座欠过谁一碗面。</b>」她说，「<b class="text-pink-200">欠了，就还。</b>」'));
                secs.push(para('她转身破栏而去，走了两步，头一回回头：「从今往后，本座不欠天下人——就欠你一个。留着。别还。」世界半回，仙路成了窄路。'));
            }
            secs.push(para('灵脉永空，仙路终结。修行文明在一代人内落幕——你的修为一天天废下去，你摸得出来，没有后悔。'));
            secs.push(para('但平民的孩子不再被宗门抱走，城墙不再需要跪仙人。她把差距拉平到零。代价是：没人能再往上。'));
            secs.push(para('你是最后一代仙人。最后一代的日子，过得格外平凡，也格外金贵。'));
            footer.push('她没说谢。她不需要说。');
        } else {
            var r = f['qi_ending_route'] || f['qi_route'];
            if (r === 'follow') {
                secs.push(para('🚶 你离开了大军，走下血海坝。追了她三年，最后一笔，你没写。'));
                secs.push(para('闷响是在你走到山下时传来的——她把要做的事做完了。你停了一下，没有回头。'));
                secs.push(para('你在山下开了一间面馆。那碗热汤面，煮给自己吃：两个铜板的面，一勺热汤。她没来吃过——<b class="text-amber-200">你总多摆一双筷子。</b>'));
            } else if (r === 'ignore') {
                if (f['qi_finale_started']) {
                    secs.push(para('🚶 你到了血海坝前，最终没有上前。她远远看见了你，没有喊你——过客有过客的走法。（旁观 · 过客）'));
                    secs.push(para('你转身走下坝。那声闷响在身后传来，天地之间随即安静得像一口空井——她把要做的事做完了。'));
                } else {
                    secs.push(para('🚶 你没去。（旁观 · 过客）'));
                    secs.push(para('那夜天边的云是红的，红了整整一夜。第二天早上，天地之间安静得像一口空井——她把要做的事做完了。'));
                }
                secs.push(para('天门开了三日，又关了。没人说得清门后发生了什么。说书人编了十八个版本，每个版本里都有一个关着门过日子的人。有听客问：那人后来呢？说书人说：<b class="text-gray-400">后来他去买了菜。</b>'));
                if (f['qi_knock3'] === 'wine') secs.push(para('她给你的那坛酒，你一个人喝了。喝完把坛子洗得干干净净，摆回窗台——往后，换你替她守着。'));
                else secs.push(para('她走前，把你窗台的酒换成了一坛新的，坛下压着一张字条：「<b class="text-pink-200">新时代缺个见证人。替本座活着看看。</b>」——你还是没喝。从「不舍得」，变成了「受托」。'));
                secs.push(para('你活到很老。做最后一代仙人，把日子过完。'));
            } else {
                secs.push(para('🚶 你转身走开了。追了她半生，站到了血海坝前，最后没有写那一笔。'));
                secs.push(para('闷响是在你下山走到一半时传来的。你停了一下，没有回头——她把要做的事做完了。'));
                secs.push(para('回到家，你烧水、泡茶，慢慢喝。<b class="text-amber-200">账，不是非清不可。</b>那晚你把自己心里的账清了一遍——清完发现，欠的还的，两讫了。'));
            }
            footer.push('账单页恩仇皆空，只有日子记得厚。');
            if ((f['qi_ending_route'] || f['qi_route']) === 'ignore' && f['qi_knock3'] !== 'wine') footer.push('账是空的。可窗台上那坛酒，比什么账都沉。');
        }
        // 尾声 · 你的下场：修为/宗门/建筑/道侣四件呈示（只叙事不扣数值——纪律⑥）
        var epi = [];
        var realmName = (W.currentCharData || {}).realm || '凡人';
        var sectNm = (W.currentCharData || {}).sect;
        var hasSect = !!(sectNm && sectNm !== '散修');
        if (kind === 'release' || kind === 'stay') {
            epi.push('<b>修为</b>：你的修为一天天废下去——你摸得出来，没有后悔。最后一代仙人，这代人走完，仙路就跟着走完了。');
            epi.push(hasSect
                ? '<b>宗门</b>：' + sectNm + '的山门后来不再收徒了。教的改成识字和营生——最后一代仙人，把学会的东西留给了下一代的平常日子。'
                : '<b>宗门</b>：你从来是散修——没有山门要回，也没有山门要失。日子落到哪儿，哪儿就是山门。');
            epi.push('<b>建筑</b>：洞府的建筑都还在，灵田荒了。你没拆——留着，让后人知道仙人这样住过。烟囱里还有烟：你煮的是人间的饭。');
        } else {
            epi.push(kind === 'slay'
                ? '<b>修为</b>：你的修为停在' + realmName + '——梯子还在，你站在梯子上。这一站值不值，账单页不答，日子答。'
                : '<b>修为</b>：你的修为停在' + realmName + '。你隔三差五去祖师堂送饭——走的不再是登仙路，是去井边的那条绕路。');
            epi.push(hasSect
                ? '<b>宗门</b>：' + sectNm + '的山门还在。香火薄了，灯没灭——灯在，山门就在。'
                : '<b>宗门</b>：你从来是散修——没有山门要回，也没有山门要失。日子落到哪儿，哪儿就是山门。');
            epi.push('<b>建筑</b>：洞府的建筑都还在，灵田也还在——气不如从前了，收成还养得起人。你住过的地方，烟囱照样冒烟。');
        }
        epi.push(comp
            ? '<b>道侣</b>：你的道侣<b class="text-pink-200">' + comp + '</b>陪你把这条路走完了——不死，不离，陪你老去。日子薄了，人没走。'
            : '<b>道侣</b>：家里没有人等你——或者说，人间都在等你。日子很长，你学着慢慢过。');
        secs.push(para('<b class="text-amber-200">🏠 尾声 · 你的下场</b>') + epi.map(function (x) { return para('· ' + x); }).join(''));
        // 页脚小字：关键账分流
        if (flags()['qi_alliance'] === 'sign' && kind !== 'stay') footer.push('盟册上写着，你也在盟的保护之列。——被保护的人，说不出保护两个字。');
        if (flags()['qi_truth'] === 'publish') footer.push('你公示的那卷《天锁论》，如今是说书人的开场白——识字的人念给不识字的人听，念了一代又一代。');
        if (flags()['qi_truth'] === 'burn') footer.push('你烧掉的那卷东西，她背得出来。你谁也没瞒住，只瞒住了自己——可她替你守住了这个秘密。');
        if (flags()['qi_tablet'] === 'bowed') footer.push('你给她长生牌作的那个揖，她后来听说了。她没说什么——那晚她多喝了一杯。');
        if (flags()['qi_kin'] === 'took') footer.push('家里住过一个废掉的老朋友。他走后，你把他的名字刻在了门后——没人看见，你看见了。');
        if (flags()['qi_crisis'] === 'silent') footer.push('炎城那三千个名字，她写完了，你看着她写完的。这一页账，你们两个一起背。');
        if (flags()['qi_crisis'] === 'detour') footer.push('你劝来的那半年，炎城三千口人过完了。长生牌上只刻一个姓，可人人知道是谁。');
        if (flags()['qi_task'] === 'strict') footer.push('你办过的那桩「标准答案」，后来她当着你的面又办了一遍。你没拦。这一笔，人心簿上你们各背一半。');
        if (!flags()['qi_debt_name'] && (kind === 'stay' || kind === 'release')) footer.push('她那本册子的最后一页，一直空着。她在等一个人替她记，或者等她自己敢。');
        _close();
        try { var o = document.getElementById('qi-ending-overlay'); if (o) o.remove(); } catch (e2) {}
        var color = kind === 'slay' ? 'border-red-600' : (kind === 'ferry' ? 'border-amber-500' : (kind === 'release' ? 'border-emerald-600' : 'border-gray-500'));
        var tcolor = kind === 'slay' ? 'text-red-300' : (kind === 'ferry' ? 'text-amber-200' : (kind === 'release' ? 'text-emerald-300' : 'text-gray-300'));
        var wrap = '<div class="fixed inset-0 bg-black/95 flex items-center justify-center p-4" id="qi-ending-overlay" style="z-index:60">'
            + '<div class="bg-gray-900 border-2 ' + color + ' rounded-xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto">'
            + '<h1 class="text-2xl font-bold text-center mb-1 ' + tcolor + '">📕 灵气之尽</h1>'
            + '<p class="text-center text-sm text-gray-400 mb-4">结局 ·「' + _endingName(kind) + '」</p>'
            + secs.join('')
            + '<p class="text-xs text-gray-500 mt-4 border-t border-gray-700 pt-3">' + footer.join('<br>') + '</p>'
            + btns([btn('📕 合上账单——日子还长', 'window.qiCloseEnding()', 'bg-gray-600 hover:bg-gray-500')])
            + '</div></div>';
        if (document.body && document.body.insertAdjacentHTML) document.body.insertAdjacentHTML('beforeend', wrap);
    };
    W.qiCloseEnding = function () {
        try { var o = document.getElementById('qi-ending-overlay'); if (o) o.remove(); } catch (e) {}
    };

    console.log('[qi-finale] v25.0《灵气之尽》批五已注册：三方战波次+还命名单+犹豫拍+四结局页+三幕前夜改道（main_056~021）');
})();
