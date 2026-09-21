// ==================== qi-arc2.js - 《灵气之尽》对抗线 main_011~018 ====================
// v25.0 推倒重写 · 批二：枯萎巡 / 占脉者四仗 / 初次照面+暴涨① / 守脉盟（盟帖→构陷对质→天秘） / 聚义+中幕加信
// 文本逐字对齐：详稿·第二批·对抗线.md C1~C8
// 纪律：真仗玩家亲手、败可再战（_isQiStory 豁免）；门槛叙事化永不报数；账厚账薄内读真账；
//       名册不报数；走开/作揖类世界不打分；玩家可见文本零外文字母零配额句式；旗标全 qi_* 前缀。
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
    function realmTier() {
        try { return typeof W.getRealmTier === 'function' ? W.getRealmTier((W.currentCharData || {}).realm) : 6; } catch (e) { return 6; }
    }
    function fame(n) { if (typeof W.addFame === 'function') { try { W.addFame(n); } catch (e) {} } }
    function essence(n) { if (typeof W.gainCultivationBonus === 'function') { try { W.gainCultivationBonus(n); } catch (e) {} } }
    function street(text) {
        var f = flags();
        if (!f['qi_street'] || !f['qi_street'].push) f['qi_street'] = [];
        f['qi_street'].push({ day: absDay(), text: text });
    }
    W.qiStreetProbe = function () { return flags()['qi_street'] || []; };

    // ---- 关键道具：半块阵眼灵石（渡结局囚阵的点火件）----
    var HALF_STONE = { id: 'qi_half_array_stone', name: '半块阵眼灵石', type: 'material', subtype: 'special', category: 'material', quality: 'PIN1', level: 30, price: 0, stackable: false, desc: '七霞派阵眼剩下的那半块灵石。虞松子说：阵守不住了，石头跟着能打仗的人走。石头认得你。', icon: '🔷' };
    try {
        if (W.itemById && !W.itemById[HALF_STONE.id]) {
            W.itemById[HALF_STONE.id] = HALF_STONE;
            if (W.allItems && W.allItems.push) W.allItems.push(HALF_STONE);
            if (W.materials && W.materials.push) W.materials.push(HALF_STONE);
        }
    } catch (e) {}

    // ---- 章节注册 main_011~018 ----
    function q(id, title, desc, flag) {
        return {
            id: id, title: title, type: 'main', priority: 10, description: desc,
            objectives: [{ type: 'custom', target: flag, count: 1, completed: false }],
            rewards: { exp: 0, spiritStones: 0, items: [] },
            story: '灵气之尽 · 对抗线', accepted: false, completed: false, turnedIn: false
        };
    }
    var QI_ARC2 = [
        q('main_011', '枯萎巡', '顺着白疤走——枯萎图上，头一座城正在死。', 'qi_c11'),
        q('main_012', '占脉者·毒谷药主', '万毒谷的药香里，有人在做时代的生意。', 'qi_c12'),
        q('main_013', '初次照面', '红线停在了剑阁——这一回，她等你。', 'qi_c13'),
        q('main_014', '占脉者·炎城税主', '炎城的火矮了三丈，有人把它论时辰卖。', 'qi_c14'),
        q('main_015', '占脉者·噬骨佣军', '官道上有支佣军，专收「废掉的人」。', 'qi_c15'),
        q('main_016', '占脉者·联盟库主', '「代天守脉」的库门里，锁着天下人的活路。', 'qi_c16'),
        q('main_017', '守脉盟', '盟帖、构陷、对质——还有密档库里那卷东西。', 'qi_c17'),
        q('main_018', '聚义', '灵气之尽只剩最后一程——点一遍愿意同行的人。', 'qi_c18')
    ];
    (function register() {
        try {
            var chain = W.mainQuestChain;
            if (chain && chain.push) {
                for (var i = 0; i < QI_ARC2.length; i++) {
                    var has = false;
                    for (var j = 0; j < chain.length; j++) { if (chain[j] && chain[j].id === QI_ARC2[i].id) { has = true; break; } }
                    if (!has) chain.push(QI_ARC2[i]);
                }
            }
            if (W.QuestRegistry && typeof W.QuestRegistry.registerMany === 'function') W.QuestRegistry.registerMany(QI_ARC2);
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
        f['qi_c_scene'] = '';
        try {
            var qq = W.QuestRegistry && W.QuestRegistry.get ? W.QuestRegistry.get(id) : null;
            if (qq) { qq.completed = true; qq.turnedIn = true; if (qq.objectives && qq.objectives[0]) qq.objectives[0].completed = true; }
            if (typeof W.updateQuestUI === 'function') W.updateQuestUI();
        } catch (e) {}
    }
    function scene(s) { flags()['qi_c_scene'] = s; }

    // ---- 序幕旧账读取 ----
    function chenHelped() { var c = flags()['_qi_chen']; return c === 'sit' || c === 'stone'; }
    function liuHelped() { var c = flags()['_qi_liu']; return c === 'buy' || c === 'move'; }
    function yuGuarded() { return flags()['_qi_yu'] === 'guard'; }
    function zhouLedger() { var c = flags()['_qi_zhou']; return c === 'redeem' || c === 'name'; }

    // ---- 义士名册（不报数——来一个，是一个名字；全读真账）----
    function roster() {
        var f = flags(), out = [];
        out.push({
            name: '陈五久', line: '「卡了三百年的金丹。剩下的年头，想办一件不卡的事。」',
            why: chenHelped()
                ? '官道边那半个时辰。他说这一笔还你——三百年的账里，他记着。'
                : '你们不认得。他来，是因为你在追她——他想亲眼看看，路是怎么断的。'
        });
        if (liuHelped()) out.push({ name: '柳四娘', line: '「药车备好了。我们只有这些。」', why: '你买走过一篓不值钱的枯药（或替她移过苗）。她说，不值钱，不等于不值——这句话全村药农都记着。' });
        if (yuGuarded()) out.push({ name: '虞松子', line: '「七霞派的半块灵石，和老道这条命，都到。」', why: '七霞派就剩他了。你替他守过阵眼最后小半块灵石——他把自己也算进了行装。' });
        if (f['qi_boss1_fate'] === 'spare') out.push({ name: '杜无忧', line: '「药箱背上。你倒在哪一波，我救到哪一波。」', why: '你废了他修为，留了他命。他每月初一十五开仓施药——一刀之恩，他记着。' });
        if (f['qi_boss2_fate'] === 'spare') out.push({ name: '霍无霜', line: '「我带一炉火。天冷——你们用得着。」', why: '你砸了她的税册，留了她命。炎城头一座公炉，是她自己点的。' });
        if (f['qi_boss3_fate'] === 'spare') out.push({ name: '沙量', line: '「押最后一趟镖。镖是你。」', why: '你留他命，给他派了差事：拆矿，遣人。那背卖过人，如今给人当桥。' });
        if (f['qi_boss4_fate'] === 'spare') out.push({ name: '藏风真人', line: '「库都空了，就剩这条命。抵押给你。」', why: '你留了他命，他自己开了库门。如今在广场上给人写家书——他说他这辈子头一回觉得字有用。' });
        if (zhouLedger()) out.push({ name: '田埂小镇的婆婆', line: '「我不懂大事。他们去哪儿，我去哪儿。」', why: f['_qi_zhou'] === 'redeem' ? '你花三百灵石赎回了周小满。她谢不出口的那一回，你扶住了她。' : '你把周来福、周小满父子的名字写进了账本。周小满回家了——名册上那一页，是你销的。' });
        return out;
    }
    W.qiRosterProbe = function () { return roster(); };
    W.qiOpenRoster = function (idx) {
        var list = roster();
        var body;
        if (typeof idx === 'number' && list[idx]) {
            body = para('<b class="text-amber-200">' + list[idx].name + '</b>') + para(list[idx].line)
                + para('<span class="text-gray-400">此人为何而来：' + list[idx].why + '</span>')
                + btns([btn('📜 回名册', 'window.qiOpenRoster()', 'bg-gray-600 hover:bg-gray-500')]);
            modal('📜 名册 · ' + list[idx].name, body);
            return;
        }
        if (!list.length) {
            body = para('名册还空着。名字自己会来。');
        } else {
            body = para('名册不报数——来一个，是一个名字。点名字，看此人为何而来（全读你的真账）：')
                + list.map(function (p, i) {
                    return '<div class="text-sm text-gray-300 py-1 border-b border-gray-700/50"><button class="text-amber-200 hover:text-amber-100 text-left" onclick="window.qiOpenRoster(' + i + ')">' + p.name + '</button><span class="text-gray-500 text-xs">　' + p.line + '</span></div>';
                }).join('');
        }
        body += btns([btn('合上名册', 'window.qiCloseModal()', 'bg-gray-600 hover:bg-gray-500')]);
        modal('📜 义士名册', body);
    };

    // ---- 占脉者四仗 ----
    var BOSSES = {
        1: { name: '毒谷药主·杜无忧', hp: 1800, atk: 220, def: 120, spd: 95, desc: '他不毒人——他只卖时代毒出来的药' },
        2: { name: '炎城税主·霍无霜', hp: 1900, atk: 230, def: 125, spd: 90, desc: '她不抢火——她只是给火上了锁，再按锁收费' },
        3: { name: '噬骨佣军头目·沙量', hp: 2000, atk: 240, def: 130, spd: 100, desc: '他卖人，但他管饭——这是他的道理，也是他的甲' },
        4: { name: '大派联盟库主·藏风真人', hp: 2200, atk: 250, def: 150, spd: 95, desc: '他守的库比山稳——因为库里锁着的是别人的活路' }
    };
    var LOSE_TEXT = {
        1: '💔 杜无忧的毒雾缠了你一身。你退出药庐——药柜还在，跪着的人还在。（回面板可再战）',
        2: '💔 火闸的热浪把你掀了下来。你退到闸外——排队的人看了你一眼，又赶紧低下头，像怕沾上什么。（回面板可再战）',
        3: '💔 灵绳抽在你背上，火辣辣的。佣军押着队伍走了——走出老远，沙量的笑声还在：「下次带够本事再来行善！」（回面板可再战）',
        4: '💔 库门的禁制把你弹了出去。藏风真人在库顶摇了摇头：「何必呢。」广场上搬石头的人，重新开始搬。（回面板可再战）'
    };
    W.qiBossFight = function (n) {
        var b = BOSSES[n];
        if (!b) return;
        scene('boss' + n + '_battle');
        var mul = 1 + 0.15 * realmTier();
        var enemy = {
            name: b.name,
            hp: Math.round(b.hp * mul), maxHp: Math.round(b.hp * mul),
            attack: Math.round(b.atk * mul), defense: Math.round(b.def * mul), speed: Math.round(b.spd * mul),
            description: b.desc,
            _isQiStory: true, _qiBeat: 'boss' + n
        };
        log('⚔️ ' + b.name + '——这一仗，你亲手打。（' + b.desc + '）', 'danger');
        if (typeof W.startBattle === 'function') W.startBattle(enemy);
    };
    W._qiSettleExtra = function (win, beat) {
        var m = /^boss(\d)$/.exec(String(beat || ''));
        if (m) {
            var n = Number(m[1]);
            if (win) { _fateModal(n); }
            else {
                scene('boss' + n + '_battle');
                say(LOSE_TEXT[n], 'warning');
            }
            return;
        }
        // 批三/批四的剧情战（护送/刺客/先锋/讨伐）走链式分流
        if (typeof W._qiSettleExtraB === 'function') { try { W._qiSettleExtraB(win, beat); } catch (e) {} }
    };

    // ---- 面板章节按钮（枢纽面板调用；锁而不死——其余页签照常用）----
    var SCENE_LABEL = {
        c11_intro: '枯萎巡', c11_tablet: '出城路上 · 长生牌位', c12_intro: '万毒谷 · 药庐',
        c13: '剑阁 · 照面', c13_resp: '剑阁 · 她的回应', c13_surge: '当夜宿营 · 义士来投',
        c14_intro: '炎城 · 火闸', c15_intro: '官道 · 佣军队伍', c16_intro: '联名库 · 广场',
        c17_pact: '守脉盟 · 盟帖', c17_trial: '长安朱雀门 · 对质大会', c17_verdict: '对质 · 判', c17_preceptor: '朱雀门外 · 拦国师', c17_truth: '当夜 · 密档库', c17_end: '离开密档库',
        c18_roster: '聚义 · 名册点名', c18_letter: '她的信使', c18_end: '聚义散的那夜',
        boss1_battle: '万毒谷 · 药庐之战', boss1_fate: '药庐 · 他的命在你手里',
        boss2_battle: '炎城 · 闸楼之战', boss2_fate: '闸楼 · 她的命在你手里',
        boss3_battle: '官道 · 佣军之战', boss3_fate: '矿口 · 他的命在你手里',
        boss4_battle: '联名库 · 库门之战', boss4_fate: '库顶 · 他的命在你手里'
    };
    // 境界门：用全序（含真仙/金仙/飞升）——getRealmTier 对飞升后境界按炼气处理，会误锁
    function realmIdx(r) {
        var order = ['凡人', '炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫', '真仙', '金仙', '飞升'];
        var i = order.indexOf(String(r == null ? '' : r));
        if (i >= 0) return i;
        try { return typeof W.getRealmTier === 'function' ? W.getRealmTier(r) : 6; } catch (e) { return 6; }
    }
    function realmGateOk() {
        return realmIdx((W.currentCharData || {}).realm) >= realmIdx('炼虚');
    }
    W.qiOpposeButtons = function () {
        var f = flags();
        if (f['qi_route'] !== 'oppose' || !f['qi_prologue_done']) return [];
        if (f['qi_ending']) return []; // 批七：结局已定，章节按钮全部收口（面板只剩终幕「回望那一页」）
        var out = [];
        var sc = f['qi_c_scene'];
        if (sc) {
            out.push(btn('▶️ 继续——' + (SCENE_LABEL[sc] || '未走完的路'), 'window.qiResumeOppose()', 'bg-red-800 hover:bg-red-700'));
        } else if (!f['qi_c11']) {
            out.push(btn('⚔️ 顺着白疤走——枯萎图上，头一座城正在死', 'window.qiStartC11()'));
        } else if (!f['qi_c12']) {
            out.push(btn('⚔️ 万毒谷的药香里，有人在做时代的生意', 'window.qiStartC12()'));
        } else if (!f['qi_c13']) {
            if (realmGateOk()) out.push(btn('⚔️ 红线停在了剑阁——这一次，她在等你', 'window.qiStartC13()'));
            else out.push(lock('🔒 红线停在了剑阁。剑阁的剑气还能割人——需炼虚以上修为，才站得住那条脉的脉口。'));
        } else if (!f['qi_c14']) {
            out.push(btn('⚔️ 炎城的火矮了三丈，有人把它论时辰卖', 'window.qiStartC14()'));
        } else if (!f['qi_c15']) {
            out.push(btn('⚔️ 官道上有支佣军，专收「废掉的人」', 'window.qiStartC15()'));
        } else if (!f['qi_c16']) {
            out.push(btn('⚔️ 「代天守脉」的库门里，锁着天下人的活路', 'window.qiStartC16()'));
        } else if (!f['qi_c17']) {
            out.push(btn('📜 守脉盟的帖子到了——借先生之名，以安九州之心', 'window.qiStartC17()'));
        } else if (!f['qi_c18']) {
            out.push(btn('📜 灵气之尽只剩最后一程——发聚义帖，点一遍愿意同行的人', 'window.qiStartC18()'));
        } else {
            out.push(lock('🌊 只剩最后一条脉了。脉尽头在血海坝下——脉尽头之威，肉身难近，需渡劫修为。'));
        }
        if (f['qi_roster_open']) out.push(btn('📜 名册——来一个，是一个名字', 'window.qiOpenRoster()', 'bg-amber-800 hover:bg-amber-700'));
        return out;
    };
    W.qiResumeOppose = function () {
        var sc = flags()['qi_c_scene'];
        if (!sc) { if (typeof W.openQiEndgamePanel === 'function') W.openQiEndgamePanel(); return; }
        var m = /^boss(\d)_battle$/.exec(sc);
        if (m) { W.qiBossFight(Number(m[1])); return; }
        m = /^boss(\d)_fate$/.exec(sc);
        if (m) { _fateModal(Number(m[1])); return; }
        if (sc === 'c11_intro') _c11Intro();
        else if (sc === 'c11_tablet') _c11Tablet();
        else if (sc === 'c12_intro') _c12Intro();
        else if (sc === 'c13') _c13Intro();
        else if (sc === 'c13_resp') _c13Resp(flags()['qi_motive']);
        else if (sc === 'c13_surge') _surge1();
        else if (sc === 'c14_intro') _c14Intro();
        else if (sc === 'c15_intro') _c15Intro();
        else if (sc === 'c16_intro') _c16Intro();
        else if (sc === 'c17_pact') _c17Pact();
        else if (sc === 'c17_trial') _c17Trial();
        else if (sc === 'c17_verdict') _c17Verdict();
        else if (sc === 'c17_preceptor') _preceptor();
        else if (sc === 'c17_truth') _c17Truth();
        else if (sc === 'c17_end') _c17End();
        else if (sc === 'c18_roster') _c18Roster();
        else if (sc === 'c18_letter') _c18Letter();
        else if (sc === 'c18_end') _c18End();
    };

    // ============ C1 · main_011 枯萎巡 ============
    W.qiStartC11 = function () {
        if (flags()['qi_c11'] || flags()['qi_c_scene']) { W.qiResumeOppose(); return; }
        accept('main_011');
        flags()['qi_roster_open'] = true;
        _c11Intro();
    };
    function _c11Intro() {
        scene('c11_intro');
        var body = para('枯萎图上的头一座城：大漠孤城。你赶到时，驼铃还在响，空气里的气已经没了。')
            + para('城门口聚着一小队修士——不是等她，是等你。消息传得比风快：有人开始追抽脉的人了。');
        body += chenHelped()
            ? para('为首的是那个灰袍人。陈五久先开口：「不用劝，也不用问。你那半个时辰，我记了三百年的账里——这一笔，还你。」')
            : para('为首的是个你不认识的灰袍人，他先开口：「你不认得我，我也不指望你认得。你在追她——这就够了。我姓陈，卡了三百年的金丹。今年路断了，我想亲眼看看它是怎么断的。」');
        if (liuHelped()) body += para('陈五久身后，柳四娘背着药篓挤上前来：「你买走的枯药，钱我攒着。」她把一张写满字的纸塞给你——全村药农的名字，「要出远门办大事的人，得有人给你记着家里。」');
        if (yuGuarded()) body += para('虞松子站在最后，道袍还是那件洗得发白的。他什么也没说，只朝你拱了拱手，站进了队伍里。七霞派就剩他了——他把自己也算进了行装。');
        body += para('<span class="text-gray-400">（义士名册开册：到场的人一个个自报姓名。<b>名册不报数</b>——来一个，是一个名字。面板页签「📜 名册」，每人一行，点名字可看此人为何而来——全读你的真账。）</span>')
            + btns([btn('🕯️ 出城——顺着白疤追下去', 'window.qiC11Tablet()')]);
        modal('⚔️ 枯萎巡 · 大漠孤城', body);
    }
    W.qiC11Tablet = function () { _c11Tablet(); };
    function _c11Tablet() {
        scene('c11_tablet');
        modal('🕯️ 出城路上 · 长生牌位', para('出城的路经过一座小镇。镇口立着块新牌位，香火未断。牌位上三个字：<b class="text-red-300">玄冥子</b>。')
            + para('一个老婆婆在上香。同行的义士都沉默了。')
            + para('有人忍不住问：「婆婆，您知道那是谁吗？」')
            + para('「不知道。」老婆婆磕了个头，「只知道今年仙师们没来收我家孙女。谁让仙师们来不了的，我就谢谁。」')
            + para('<b class="text-gray-400">没人接话。没人接得了。</b>')
            + btns([
                btn('🕯️ 对着牌位作个揖', 'window.qiTabletChoice(\'bow\')', 'bg-amber-800 hover:bg-amber-700'),
                btn('🚶 沉默走过', 'window.qiTabletChoice(\'pass\')', 'bg-gray-600 hover:bg-gray-500')
            ]));
    }
    W.qiTabletChoice = function (c) {
        _close();
        var f = flags();
        if (f['qi_tablet']) return;
        f['qi_tablet'] = c === 'bow' ? 'bowed' : 'passed';
        record(c === 'bow' ? 'qi_tablet_bow' : 'qi_tablet_pass', '枯萎巡');
        if (c === 'bow') log('🕯️ 你作了个揖。身后的义士们愣了愣，也跟着作了。这个揖是什么意思，你们谁也说不清。（选择记忆：你给她的长生牌作过揖。不入恩仇簿——这一拍世界不打分）', 'info');
        else log('🚶 你从牌位前走了过去。香烟跟了你一路。（选择记忆：你没作揖。不入恩仇簿——这一拍世界不打分）', 'info');
        finish('main_011', 'qi_c11');
        if (typeof W.qiWitherCity === 'function') W.qiWitherCity('大漠孤城');
        log('🥀 大漠孤城在你身后。枯萎图上，红线拐向了冰原城——她永远比你早到一步，但每一步都留下痕迹。（枯萎巡毕）', 'warning');
    };

    // ============ C2 · main_012 毒谷药主·杜无忧 ============
    W.qiStartC12 = function () {
        if (flags()['qi_c12'] || flags()['qi_c_scene']) { W.qiResumeOppose(); return; }
        accept('main_012');
        if (typeof W.qiWitherCity === 'function') W.qiWitherCity('冰原城');
        log('🥀 冰原城不需要你——你到时，脉已经枯了。红线往南，拐进万毒谷。', 'warning');
        _c12Intro();
    };
    function _c12Intro() {
        scene('c12_intro');
        modal('⚔️ 万毒谷 · 药庐', para('毒雾薄了三成，谷里的药主却发了财。杜无忧垄断了谷中最后一片活灵田，炼出「续脉丹」，十倍价出售。买丹的队伍从谷口排到雾里——全是废了根基的老修士，用一辈子的积蓄，买几天「还是修士」的日子。')
            + para('药庐里，杜无忧胖得很和气，笑容也很和气：「道友来得正好。这片田，方圆千里就它还活着——你守着它，比你追那个女人有用十倍。」')
            + para('他身后的药柜上，丹瓶码得像墙。墙根底下跪着的买丹人，已经跪得没了力气。')
            + btns([btn('⚔️ 掀了药庐（真仗——毒谷药主·杜无忧）', 'window.qiBossFight(1)')]));
    }

    // ---- 四仗共通：胜后抉择 ----
    var FATE_BTN = {
        1: ['⚔️ 斩——「生意做到人头上，就不是生意了。」', '🕊️ 放——废他修为，留他命：「药仓开了。丹给最该吃的人，不收钱。」'],
        2: ['⚔️ 斩', '🕊️ 放——「砸了账本，留你命：火归城，暖不再论时辰卖。」'],
        3: ['⚔️ 斩', '🕊️ 放——留他命，给他派个差事：「拆矿，遣人。送一个苦力还乡，算你一笔功。」'],
        4: ['⚔️ 斩——库门当众破开', '🕊️ 放——留他性命，让他自己开库']
    };
    var FATE_LEAD = {
        1: '杜无忧瘫在药柜前，胖脸上第一次没了和气。他忽然说：「杀了我，丹方就没了。跪着的那些人，连几天都买不起了——你想清楚。」<br><b class="text-gray-400">他说的是实话。这才是最难办的地方。</b>',
        2: '霍无霜的闸楼塌了半边。她坐在废墟上，账本还抱在怀里。闸外排队的人围了过来，没人说话——火还锁着，钥匙在她手里，命在你手里。',
        3: '沙量跪在矿口，佣军树倒猢狲散。灵绳还拴着一串人——矿里的、路上的，全看着你。他的命，和这些人的去处，都在你一念之间。',
        4: '藏风真人从库顶下来，站在你面前。库门的禁制碎了，万枚灵石就在门后——门开不开、人留不留，都在你一念之间。'
    };
    function _fateModal(n) {
        scene('boss' + n + '_fate');
        modal('⚖️ 占脉者 · 命在你手里', para(FATE_LEAD[n])
            + btns([
                btn(FATE_BTN[n][0], 'window.qiBossFate(' + n + ',\'slay\')'),
                btn(FATE_BTN[n][1], 'window.qiBossFate(' + n + ',\'spare\')', 'bg-emerald-800 hover:bg-emerald-700')
            ]));
    }
    var CHAPTER_OF_BOSS = { 1: ['main_012', 'qi_c12'], 2: ['main_014', 'qi_c14'], 3: ['main_015', 'qi_c15'], 4: ['main_016', 'qi_c16'] };
    W.qiBossFate = function (n, fate) {
        _close();
        var f = flags();
        if (f['qi_boss' + n + '_fate']) return;
        f['qi_boss' + n + '_fate'] = fate;
        record('qi_boss' + n + '_' + (fate === 'slay' ? 'slay' : 'spare'), '占脉者');
        if (n === 1) _fate1(fate);
        else if (n === 2) _fate2(fate);
        else if (n === 3) _fate3(fate);
        else if (n === 4) _fate4(fate);
        var ch = CHAPTER_OF_BOSS[n];
        finish(ch[0], ch[1]);
        if (n === 1 && typeof W.qiWitherCity === 'function') W.qiWitherCity('万毒谷');
        if (n === 2 && typeof W.qiWitherCity === 'function') W.qiWitherCity('炎城');
        if (n === 4 && typeof W.qiWitherCity === 'function') W.qiWitherCity('洛水城');
    };
    function _fate1(fate) {
        if (fate === 'slay') {
            W.addQiVendetta('杜无忧（毒谷药主）——已划名：你的剑穿过药庐。他到死攥着丹方，没算明白稳赚的买卖怎么会输。');
            street('毒谷的药主死了，丹也没了。有人说好，有人说坏——说的人都不敢大声。');
            log('⚔️ 你的剑穿过药庐。杜无忧死时还攥着他的丹方，眼睛没闭上——他到死没算明白，稳赚的买卖怎么会输。万毒谷的毒雾散了个干净，药商的鞭子放了半天。可三个月后消息传来：续脉丹断了，靠丹吊着的那批老修士，走得比没吃丹的还早。（仇列划名：杜无忧。街谈新条：「毒谷的药主死了，丹也没了。有人说好，有人说坏——说的人都不敢大声。」）', 'danger');
        } else {
            W.addQiGrace('杜无忧，放。他每月初一十五开仓施药——续脉丹救不回枯掉的根基，但至少那些人走的时候手里攥着药，不是攥着空匣子。');
            street('毒谷那个药主，从前宰人，如今施药。人心里那把锁，敢情是剑撬开的。');
            log('🕊️ 你废了他的修为，留了他的命。他瘫在丹炉前，一下子老了十岁。当晚药仓开了——续脉丹照样救不回枯掉的根基，但至少，那些人走的时候手里攥着药，不是攥着空匣子。（恩列：杜无忧，放。他每月初一十五开仓施药。街谈新条：「毒谷那个药主，从前宰人，如今施药。人心里那把锁，敢情是剑撬开的。」终战兑现：他到场，背着药箱替你挡一波——「一刀之恩，今日还。」）', 'success');
        }
    }
    function _fate2(fate) {
        if (fate === 'slay') {
            W.addQiVendetta('霍无霜（炎城税主）——已划名：她死在闸楼上，手里还攥着账本。');
            street('税主死了，火也散了。是好事坏事？问今年冬天吧。');
            log('⚔️ 税主死在闸楼上，手里还攥着账本。火闸开了，半城的人跪着谢你——另一半人当夜就上了山，背着锄头：火脉没人管闸，也就没人管渠，他们得自己挖点别的活路。（仇列划名：霍无霜。街谈新条：「税主死了，火也散了。是好事坏事？问今年冬天吧。」）', 'danger');
        } else {
            W.addQiGrace('霍无霜，放。她亲手点起了炎城第一座公炉——如今管炉子不管账。炉子比账暖和。');
            street('炎城头一座公炉，是税主自己点的。她如今管炉子不管账——炉子比账暖和。');
            log('🕊️ 你当着她的面砸了税册，留了她的命。她在塌掉的税棚前站到半夜，然后亲手点起了炎城第一座公炉——火光照着她的手，有人说那手在抖，有人说没有。（恩列：霍无霜，放。街谈新条：「炎城头一座公炉，是税主自己点的。她如今管炉子不管账——炉子比账暖和。」终战兑现：她到场，带一炉火——「一炉之恩。天冷，你们用得着。」）', 'success');
        }
    }
    function _fate3(fate) {
        if (fate === 'slay') {
            W.addQiVendetta('沙量（噬骨佣军头目）——已划名：佣军树倒猢狲散，矿场的枷你亲手砸开。');
            if (typeof W.resolveQiStranded === 'function') W.resolveQiStranded('噬骨矿枷，你亲手砸的——名册上被掳的苦力名字，一个一个亮起来');
            street('矿上的人出来了。有认识的没有？有认识的喊一声——喊一声就能少一个人失踪。');
            log('⚔️ 佣军树倒猢狲散。你砸开矿场的枷，苦力们走出来，站在太阳底下，很多人半天没动——有的一辈子没晒过这么久的太阳。（仇列划名：沙量。搁浅列批量销账：「噬骨矿枷，你亲手砸的」——名册上被掳的苦力名字，一个一个亮起来。街谈新条：「矿上的人出来了。有认识的没有？有认识的喊一声——喊一声就能少一个人失踪。」）', 'danger');
        } else {
            W.addQiGrace('沙量，放。矿他自己拆，人他自己送还乡——三个月后，名册上最后一个苦力到了家。');
            if (typeof W.resolveQiStranded === 'function') W.resolveQiStranded('沙量拆矿遣人——三个月后，名册上最后一个苦力到了家');
            street('噬骨佣军如今改行押人还乡了。有人看见头目背一个老修士过河——那背卖过人，如今给人当桥。');
            log('🕊️ 你留了沙量的命——不是慈悲，是差事：矿他自己拆，人他自己送还乡。他跪在矿口，直到你走远。三个月后，名册上最后一个苦力到了家。（恩列：沙量，放。街谈新条：「噬骨佣军如今改行押人还乡了。有人看见头目背一个老修士过河——那背卖过人，如今给人当桥。」终战兑现：他到场，身后一队还过乡的人——「押最后一趟镖。镖是你。」搁浅列同样批量销账）', 'success');
        }
        if (flags()['_qi_zhou'] === 'name') {
            log('🌾 苦力的队伍里，你认出一张十六岁的脸——周小满。你送他回了镇，搁浅列销了一页。他愣愣地看着你，不认得你是谁，但他认得回家的路。临别他朝你作了个揖——他爹教的，说受了人的恩，手要怎么摆。（序幕联动：田埂小镇记过的名字，回家了）', 'success');
        }
    }
    function _fate4(fate) {
        if (fate === 'slay') {
            W.addQiVendetta('藏风真人（大派联盟库主）——已划名：库门当众破开，万枚灵石按人头分了。');
            street('灵石分了，人心也分了。有人骂分石头的惹乱子，有人在家给他立了长生牌——同一个人，两样都占了。');
            log('⚔️ 库门破开那刻，万枚灵石滚了一地，像水。围观的散修半天没敢动，然后齐齐跪下了。你说：别跪，拿——按人头分。（仇列划名：藏风真人。街谈新条：「灵石分了，人心也分了。有人骂分石头的惹乱子，有人在家给他立了长生牌——同一个人，两样都占了。」）', 'danger');
        } else {
            W.addQiGrace('藏风真人，放。他自己开了库门——库守的是石头，石头守的是命；命都守不住，石头算什么。如今在广场上给人写家书。');
            street('九派的库空了，库主还活着，如今在广场上给人写家书——他说他这辈子头一回觉得字有用。');
            log('🕊️ 你留了藏风真人的命。他在被搬空的库前坐了一夜。天亮时他自己开了库门——不是善心，是他想明白了：库守的是石头，石头守的是命；命都守不住，石头算什么。（恩列：藏风真人，放。街谈新条：「九派的库空了，库主还活着，如今在广场上给人写家书——他说他这辈子头一回觉得字有用。」终战兑现：他到场——「守了半辈子的库叫你搬空了。怪事——我睡得着了。」）', 'success');
        }
        log('📜 库门的事，第二天就传进了守脉盟。国师·元辰子的案头多了一份名册——名册头一行，是你的名字。（守脉盟的目光，落到你身上了）', 'info');
    }

    // ============ C3 · main_013 初次照面 + 暴涨① ============
    W.qiStartC13 = function () {
        if (flags()['qi_c13'] || flags()['qi_c_scene']) { W.qiResumeOppose(); return; }
        if (!realmGateOk()) {
            say('红线停在了剑阁。剑阁的剑气还能割人——需炼虚以上修为，才站得住那条脉的脉口。', 'warning');
            return;
        }
        accept('main_013');
        _c13Intro();
    };
    function _c13Intro() {
        scene('c13');
        modal('⚔️ 剑阁 · 初次照面', para('剑阁的脉前，你追上了她。')
            + para('这一次没有潮。她就站在脉尽头等你——好像等了很久。身后剑阁山上，万剑齐鸣了最后一次。')
            + para('你拔剑。她没有拔。')
            + para('交手没有超过三息。你甚至不记得自己是怎么输的——天地歪了一下，再正过来时，你坐在地上，她还站在原地，衣角都没乱。')
            + para('<span class="text-gray-400">（败而不辱：她没有追击，没有羞辱。剑阁的剑修在远处看见了全程——他们看见的是她没拔刀，而你站了起来。）</span>')
            + para('她低头看你，问得很认真：')
            + para('<b class="text-pink-200">「你追本座——图什么？」</b>')
            + btns([
                btn('⚔️ 「为那些被截断的命。」', 'window.qiMotiveChoice(\'life\')'),
                btn('🏙️ 「为账上那些城。」', 'window.qiMotiveChoice(\'city\')'),
                btn('🔍 「为想知道——破栏之后，你要干什么。」', 'window.qiMotiveChoice(\'curious\')'),
                btn('🤷 「说不清。」', 'window.qiMotiveChoice(\'unclear\')', 'bg-gray-600 hover:bg-gray-500')
            ]));
    }
    var MOTIVE_RESP = {
        life: '她听完，点点头：「义士。」语气里听不出是夸还是叹，「本座账上义士很多。每一个，本座都记着。」她转身走了，「接着追。」',
        city: '「本座账上的？」她挑眉，「你见过本座的账？」你说：没见过，但猜得到——干这种事的人，不可能不记账。她脸上第一次有了点真正的表情：「你猜得到。」她把这三个字收下了，走了。',
        curious: '她盯着你看了很久。「有意思。」她说，「天下人都在拦本座，你想看后头。」她没有回答，走出十几步，留下一句：「追到最后，本座让你看。」',
        unclear: '她愣住了，随即笑出声来——笑得惊起剑阁一山的鸦。「好。」她抹了抹眼角（像抹掉什么，又像什么都没有），「想清楚了的人，都是假的。那就接着追——本座等你想明白。」'
    };
    W.qiMotiveChoice = function (m) {
        var f = flags();
        if (f['qi_motive']) return;
        f['qi_motive'] = m;
        record('qi_motive_' + m, '初次照面');
        _c13Resp(m);
    };
    function _c13Resp(m) {
        scene('c13_resp');
        modal('🌊 她的回应', para('<span class="text-pink-200">' + (MOTIVE_RESP[m] || MOTIVE_RESP.unclear) + '</span>')
            + para('<span class="text-gray-400">（这个回答她收下了。第三幕终战前，她会原样奉还。）</span>')
            + btns([btn('🔥 当夜宿营——义士们围着你的火堆', 'window.qiFinishC13()')]));
    }
    W.qiFinishC13 = function () {
        _close();
        if (flags()['qi_c13']) return;
        finish('main_013', 'qi_c13');
        try {
            if (typeof W.qiCodexNote === 'function') W.qiCodexNote('qi_xuanmingzi', '玄冥子', '血海之主。三万年前，平民把她推进血海，仙人收了她的祭——两个世界都辜负过她。她要拆掉梯子：不为恨梯子下的人，为记得梯子底下长什么样。剑阁一晤，她没有拔刀。');
            if (typeof W.qiJournalNote === 'function') W.qiJournalNote('剑阁一晤', '你在剑阁追上了她。交手不过三息，她未拔刀。她问你图什么——你的回答，她收下了。');
        } catch (e) {}
        if (typeof W.qiSetStage === 'function') W.qiSetStage(2);
        if (typeof W.qiWitherCity === 'function') { W.qiWitherCity('青木城'); W.qiWitherCity('剑阁'); }
        log('🥀 你在剑阁站起来的第二天，红线连拐两城——青木城、剑阁连枯。她在加速。（对抗线一幕毕；天地灵气，薄了一大截）', 'warning');
        _surge1();
    };
    function _surge1() {
        var f = flags();
        var first = !f['qi_surge1_done'];
        scene('c13_surge');
        var body = para('🎁 当夜宿营，义士们围着你的火堆坐了一圈。');
        body += chenHelped()
            ? para('陈五久先开口，把那卷磨破的手札塞进你手里：「三百年的陈账。给还能往前走的人。」<span class="text-gray-400">（三百年卡关所悟入体：修为大补）</span>')
            : para('那个你不认识的灰袍人也递来了手札：「你不认得我。但你追她，这东西你用得上。」<span class="text-gray-400">（修为大补——只是少了那份交情。暴涨照给，世界不惩罚你）</span>');
        body += liuHelped()
            ? para('柳四娘赶来一车伤药：「全村凑的。别问够不够——我们只有这些。」')
            : para('伤药是义士们各掏各的凑的，一样满车。');
        if (yuGuarded()) body += para('虞松子最后起身，从怀里捧出小半块灵石——七霞派阵眼剩下的那半块：「阵守不住了。石头跟着能打仗的人走。」<span class="text-amber-200">（得关键道具「半块阵眼灵石」——它认得你）</span>');
        body += btns([btn('🔥 收下——这一夜的账，你记下了', 'window.qiSurge1Done()')]);
        if (first) {
            f['qi_surge1_done'] = true;
            essence(2000);
            fame(25);
            if (yuGuarded() && typeof W.addItem === 'function') { try { W.addItem('qi_half_array_stone', 1); } catch (e) {} }
            log('📜 义士来投的消息当夜传开——追抽脉人的那个，不再是孤身一人了。（名望大涨；名册页添新名字；修为大补——数额不入文案，账在身上）', 'success');
        }
        modal('🎁 暴涨 · 义士来投', body);
    }
    W.qiSurge1Done = function () { _close(); scene(''); };

    // ============ C4 · main_014 炎城税主·霍无霜 ============
    W.qiStartC14 = function () {
        if (flags()['qi_c14'] || flags()['qi_c_scene']) { W.qiResumeOppose(); return; }
        accept('main_014');
        _c14Intro();
    };
    function _c14Intro() {
        scene('c14_intro');
        modal('⚔️ 炎城 · 火闸', para('红线穿过炎城。火脉凉了半截——剩下的半截，被人围了起来。')
            + para('炎城税主霍无霜在火脉口设了闸：想烤一炉火，按时辰交「暖税」。修士交灵石，平民交粮。交不出的，站在闸外吹冷风——这个时代，冷是会死人的。')
            + para('她站在闸楼上数她的账，见你来了，头也不抬：「要火？排队。要拆闸？」她终于抬眼，「先问问闸外这些人——他们今天烤上火了，靠的是谁的闸。」')
            + para('闸外排队的人没人说话。有人低头把怀里的粮袋又抱紧了些。')
            + btns([btn('⚔️ 拆闸（真仗——炎城税主·霍无霜）', 'window.qiBossFight(2)')]));
    }

    // ============ C5 · main_015 噬骨佣军·沙量 ============
    W.qiStartC15 = function () {
        if (flags()['qi_c15'] || flags()['qi_c_scene']) { W.qiResumeOppose(); return; }
        accept('main_015');
        _c15Intro();
    };
    function _c15Intro() {
        scene('c15_intro');
        modal('⚔️ 官道 · 佣军队伍', para('红线往东，你撞上了一支佣军的队伍。押送的不是货——是人。')
            + para('废了根基的修士、灵田绝收的药农、山门解散的杂役，一串一串，用灵绳拴着，往北边的灵石矿走。灵气枯了，灵石倒成了硬通货——矿上缺的，正是「从前是修士」的耐扛的苦力。')
            + para('佣军头目沙量骑在马上清点人数，见你拦路，咧嘴一笑：「道友行个方便。这些人搁半年前是仙长，搁现在——废人一个，管饭就卖命。我们给他们饭吃，这是善举。」')
            + para('队伍里没人喊冤。有个老修士抬头看了你一眼，又低下去了——那种眼神你认得：不指望了。')
            + btns([btn('⚔️ 拦下这支队伍（真仗——噬骨佣军头目·沙量）', 'window.qiBossFight(3)')]));
    }

    // ============ C6 · main_016 大派联盟库主·藏风真人 ============
    W.qiStartC16 = function () {
        if (flags()['qi_c16'] || flags()['qi_c_scene']) { W.qiResumeOppose(); return; }
        accept('main_016');
        _c16Intro();
    };
    function _c16Intro() {
        scene('c16_intro');
        modal('⚔️ 联名库 · 广场', para('红线的最后一站不在图上——在九大派的联名库。')
            + para('灵气枯了三年，九派把天下散修的灵石「代为保管」了三年，美其名曰：代天守脉，集中力量办大事。库建得比皇宫还高，库门上的封条写着「为天下计」。')
            + para('库前的广场上，抓来的散修在搬石头——库不够用了，要扩。搬石头的里面，有你在枯萎巡路上见过的脸。')
            + para('库主藏风真人站在库顶，声音飘飘下来：「小友，你追你的抽脉人，本座守本座的库——你我本无仇。何必呢？」')
            + para('广场上的散修都停下了。没人说话，所有人都在看你。')
            + btns([btn('⚔️ 破库门（真仗——大派联盟库主·藏风真人）', 'window.qiBossFight(4)')]));
    }

    // ============ C7 · main_017 守脉盟（盟帖→构陷对质→天秘） ============
    W.qiStartC17 = function () {
        if (flags()['qi_c17'] || flags()['qi_c_scene']) { W.qiResumeOppose(); return; }
        accept('main_017');
        _c17Pact();
    };
    function _c17Pact() {
        scene('c17_pact');
        modal('📜 守脉盟 · 盟帖', para('守脉盟的帖子写得比灵石还漂亮：「脉贼窃天，天下共讨。盟愿代天守脉、代民请命——借先生之名，以安九州之心。」')
            + para('使者长揖到地。门外是九大派的目光——库才空了三天，他们的笑比谁都和气。门内是你的名册。')
            + btns([
                btn('✍️ 签盟——交出名册，听调遣', 'window.qiAllianceChoice(\'sign\')', 'bg-gray-600 hover:bg-gray-500'),
                btn('🚫 拒签——帖子推回去', 'window.qiAllianceChoice(\'refuse\')', 'bg-amber-800 hover:bg-amber-700'),
                btn('🔥 当面撕帖——「我的名字，我自己写。」', 'window.qiAllianceChoice(\'tear\')')
            ]));
    }
    W.qiAllianceChoice = function (a) {
        _close();
        var f = flags();
        if (f['qi_alliance']) return;
        f['qi_alliance'] = a;
        record('qi_alliance_' + a, '守脉盟');
        if (a === 'sign') {
            W.addQiHeart('你签了守脉盟的盟帖——人心簿里，这一笔叫「低头」。名册上那些名字，也一并入了盟册。');
            log('✍️ 你签了。笔落的那一刻，使者的笑意深了三分。当夜你的名字刻上了盟碑——你名册上那些名字，也一并入了册。（人心簿：低头一笔。终战兑现：盟军首波助战、天兵折一成——但结局页有专属讽刺：「盟册上写着，你也在盟的保护之列。」被保护的人，说不出保护两个字）', 'info');
        } else if (a === 'refuse') {
            W.addQiHeart('盟使临走那句：盟外之人——盟护不到。三日之内，江湖上多了许多「你私通脉贼余党」的传闻。');
            log('🚫 你把帖子推了回去。使者收起笑，收得很慢：「先生再想想。盟外之人——盟护不到。」（人心簿记下这句威胁。构陷开始：三日内，江湖上多了许多「你私通脉贼余党」的传闻）', 'warning');
        } else {
            fame(30);
            log('🔥 你当着使者的面把帖子撕成两半，只说了一句：「我的名字，我自己写。」使者拂袖而去。三日后，九州每一间茶馆都在讲这一幕。（名望大涨；构陷加倍——但对质大会那天，肯替你站出来的人多了一倍：江湖记性好，记打脸，也记风骨）', 'success');
        }
        _c17Trial();
    };
    function _c17Trial() {
        scene('c17_trial');
        modal('🏛️ 长安朱雀门 · 对质大会', para('守脉盟的「证据」做得比灵石还漂亮：噬骨佣军的骨牌（沙量的旧物）、半枚续脉丹（杜无忧的货）、一件染血的灰袍（陈五久穿过的样式）。三证俱全，指向「私通脉贼」。')
            + para('对质大会开在长安朱雀门。九派到场，平民围了三层——平民是来看的：追了抽脉人三年的那个，到底是不是脉贼。')
            + para('盟中执事高声问：「你可有辩词？」')
            + para('<b class="text-amber-200">你的辩词，是你的账本。</b>')
            + btns([btn('📕 打开账本——让账说话', 'window.qiTrialResolve()')]));
    }
    function ledgerWeight() {
        try {
            var L = W.qiLedgerProbe();
            return (L.graces ? L.graces.length : 0) + (L.stranded ? L.stranded.length : 0);
        } catch (e) { return 0; }
    }
    W.qiTrialResolve = function () {
        _close();
        if (flags()['qi_trial_done']) { _c17Truth(); return; }
        flags()['qi_trial_done'] = true;
        var line = flags()['qi_alliance'] === 'tear' ? 3 : 5; // 撕帖者厚度线降一档（风骨也是账）——内读，永不报数
        if (ledgerWeight() >= line) _verdictThick();
        else _verdictThin();
    };
    function _verdictThick() {
        flags()['qi_verdict'] = 'thick';
        fame(40);
        W.addQiHeart('朱雀门那日，盟的三证输给了活人——输给了一个不识字的老婆婆。元辰子收帖退场，一个字没认。构陷者，每一笔都记下了。');
        street('朱雀门那日，盟的证据输给了一个不识字的老婆婆。');
        _renderVerdictThick();
    }
    function _renderVerdictThick() {
        var f = flags();
        var wit = [];
        wit.push(chenHelped()
            ? '陈五久先出列：「他陪我坐过半个时辰。这样的人是脉贼？那老夫是贼头。」'
            : '陈五久先出列：「他不认得我。但枯萎巡上他替我们挡过三回刀——老夫的眼睛没枯。」');
        if (liuHelped()) wit.push('柳四娘抱着药篓上台，把那张写满名字的纸举过头顶。');
        if (yuGuarded()) wit.push('虞松子：「七霞派的阵，是他守的。盟里的诸位的阵——守过几座？」');
        if (f['qi_boss1_fate'] === 'spare') wit.push('杜无忧背着药箱出列：「续脉丹是我炼的，卖给将死的人。要说私通——盟里买丹的名录，要不要老朽念一念？」满场哗然。');
        if (f['qi_boss3_fate'] === 'spare') wit.push('沙量出列，身后站着一排还过乡的苦力，没人说话，一起撸起了袖子——灵绳的勒痕都在。');
        else if (f['qi_boss3_fate'] === 'slay') wit.push('一排还过乡的苦力出列，没人说话，一起撸起了袖子——灵绳的勒痕都在。');
        if (zhouLedger()) wit.push('人群里有人把一位老婆婆扶上台。她不识字，只说了一句：「我家小子回家了。他被人构陷的那天——你们都在哪儿？」');
        scene('c17_verdict');
        modal('🏛️ 对质 · 当堂翻案', wit.map(para).join('')
            + para('守脉盟的三证被活人证一一驳倒。元辰子面色如古井，收帖，退场——一个字没认。人群散去时，不知谁先喊了一声你的名字，然后整个广场都在喊。')
            + para('<span class="text-gray-400">（名望暴涨；人心簿：构陷者每一笔入账。街谈新条：「朱雀门那日，盟的证据输给了一个不识字的老婆婆。」）</span>')
            + btns([btn('🏛️ 拦住去路——元辰子还没走远', 'window.qiToPreceptor()')]));
    }
    // ---- 盘问国师（8.3 决策段：问罪→名望；追内情满两笔→终战少一波）----
    W.qiToPreceptor = function () { _close(); _preceptor(); };
    function _preceptor() {
        scene('c17_preceptor');
        modal('🏛️ 朱雀门外 · 拦国师', para('人群散去。国师·元辰子最后一个离开朱雀门——他走得不快，像今日这场败与他无关。')
            + para('你拦住了他的路。他站定，拱手：「先生还有何指教？」')
            + para('广场上的人还没散尽，都在看。他的三证刚被活人驳倒——<b class="text-gray-400">这一下拦路，你占着理。</b>')
            + btns([
                btn('⚔️ 问罪——构陷的每一笔，亲手讨回来', 'window.qiPreceptorChoice(\'condemn\')'),
                btn('🔍 追内情——盟到底在替谁守什么', 'window.qiPreceptorChoice(\'press\')', 'bg-amber-800 hover:bg-amber-700'),
                btn('🚶 放他走——话到朱雀门为止', 'window.qiPreceptorChoice(\'pass\')', 'bg-gray-600 hover:bg-gray-500')
            ]));
    }
    W.qiPreceptorChoice = function (c) {
        _close();
        var f = flags();
        if (f['qi_preceptor']) { _c17Truth(); return; }
        f['qi_preceptor'] = c;
        record('qi_preceptor_' + c, '守脉盟');
        if (c === 'condemn') {
            fame(20);
            W.addQiHeart('构陷的三笔，你当街亲手讨了回来。元辰子拱手说「盟，受教」——他认的不是罪，是你的账。');
            log('⚔️ 你没有吼，也没有骂，只把账一笔一笔亲手翻给他看：骨牌是哪日伪的，灰袍是哪日染的血，传闻是哪日撒进茶馆的——三笔，一笔不差。元辰子听完，面色依旧如古井，末了拱了拱手：「盟，受教。」转身走了。次日，守脉盟把构陷你的三样「证物」原物封箱送回，附帖一个字没多写。（名望涨；人心簿：构陷者每一笔，讨回来了）', 'success');
        } else if (c === 'press') {
            f['qi_preceptor_intel'] = 2;
            W.addQiHeart('你从元辰子嘴里追出了两笔内情：盟守的不是脉，是钥匙；他们不怕她拆脉，怕的是天下人知道脉为什么该拆。第二问，他请你留在门内。');
            log('🔍 你没问罪，只问了两件事。第一件：盟代天守脉——替谁守？第二件：她拆脉三年，盟为何不慌；天锁二字出口，盟为何连夜收帖？元辰子两次开口想搪塞，都被你的眼神止住。最后他只说了一句：「先生，第二个问题，请你留在门内。」——他退了。可两笔内情你都拿到了：盟的密档库里有见不得光的东西；盟怕的不是她拆脉，是天下人知道脉为什么该拆。（内情满两笔——终战那日，守脉盟会撤回与天上的香火盟约：收割者，少一镰）', 'info');
        } else {
            log('🚶 你看了他一眼，终究侧身让开了半步。他从你身边走过时停了停，声音压得很低：「先生的账，盟记下了。」是威胁，是服软，分不清。（路放了——有些东西，只好夜里自己去查）', 'info');
        }
        _c17Truth();
    };
    function _verdictThin() {
        flags()['qi_verdict'] = 'thin';
        fame(-10);
        W.addQiHeart('朱雀门那日：没人扔菜，也没人替你挡。一个不认识的老头塞给你一个炊饼——老汉不信盟，可也不认得你。今日之冷，记账。');
        _renderVerdictThin();
    }
    function _renderVerdictThin() {
        var body = para('没有人朝你扔菜——也没有人替你挡。你走出朱雀门时，一个不认识的老头默默塞给你一个炊饼：「老汉不信盟。可老汉也不认得你——后生，你自己保重。」')
            + para('<span class="text-gray-400">（名望小损；人心簿记下今日之冷）</span>');
        if (yuGuarded()) body += para('🔷 你怀里那半块阵眼灵石自己发起热来——石头的热气顺着胳膊爬上来，像有人握了一下你的手。<b class="text-amber-200">石头认得你。人也认得——只是今天没来。</b>');
        else if (chenHelped()) body += para('人群外，陈五久朝你拱了拱手，没有走开——「老夫信不过盟。信你追了三年的脚程。」');
        else body += para('人群外，那个不认识你的灰袍人陈五久朝你拱了拱手，没有走开——「老夫信不过盟。信你追了三年的脚程。」');
        body += btns([btn('🌙 当夜——守脉盟密档库', 'window.qiToTruth()')]);
        scene('c17_verdict');
        modal('🏛️ 对质 · 半信半疑', body);
    }
    function _c17Verdict() {
        if (flags()['qi_verdict'] === 'thick') _renderVerdictThick();
        else _renderVerdictThin();
    }
    W.qiToTruth = function () { _close(); _c17Truth(); };
    function _c17Truth() {
        scene('c17_truth');
        modal('🌙 密档库 · 《天锁论》', para('当夜你摸进了守脉盟的密档库。不为偷——为看看他们到底在守什么。')
            + para('你看到了。一卷《天锁论》，万年来只在历任盟主之间手传：<b class="text-red-300">灵脉是天的收租管道；飞升是被收割；灵气不够，是故意的。</b>卷末一行小字，是初代盟主的笔：')
            + para('「脉可枯，锁可紧，天不可言。天一言，九州乱；九州乱，谁的脉都守不成。」')
            + para('<b class="text-red-300">他们早就知道。他们早就知道她说的是对的。</b>他们守了一万年的不是脉——是自己站在管道口的位置。')
            + para('卷宗在你手里。火折子也在。')
            + btns([
                btn('📜 公示——印一千份，撒遍九州', 'window.qiTruthChoice(\'publish\')'),
                btn('🔥 烧掉——真相太重，九州承受不起', 'window.qiTruthChoice(\'burn\')', 'bg-gray-600 hover:bg-gray-500')
            ]));
    }
    W.qiTruthChoice = function (t) {
        _close();
        var f = flags();
        if (f['qi_truth']) return;
        f['qi_truth'] = t;
        record('qi_truth_' + t, '守脉盟');
        try {
            if (typeof W.qiCodexNote === 'function') W.qiCodexNote('qi_tiansuolun', '天锁论', '守脉盟万年来只在历任盟主之间手传的一卷书：灵脉是天的收租管道；飞升是被收割；灵气不够，是故意的。——你' + (t === 'publish' ? '把它公示了，撒遍九州' : '把它烧了，独握了真相') + '。');
            if (typeof W.qiJournalNote === 'function') W.qiJournalNote('天锁论', t === 'publish' ? '《天锁论》公示九州——识字的人念给不识字的人听。平民舆论线自此提前转向。' : '《天锁论》被烧于密档库。没人知道这件事发生过——包括被瞒下的天下人。');
        } catch (e) {}
        if (t === 'publish') {
            f['qi_opinion_turned'] = true;
            street('街头那张纸，识字的一个个念给不识字的听。念到「飞升是被收割」，满街的人一起抬头看天。');
            street('九派连夜收回贴文，可纸这个东西——收得回墙上贴的，收不回人心里念的。');
            W.addQiHeart('他把《天锁论》公示了——他把天下人当人。');
            log('📜 三日之内，《天锁论》贴满了九州的街口。平民看不懂字，修士看得懂——修士看完，头一回集体沉默。有人烧了自己的功法，有人连夜去砸盟里的碑，也有人开始收拾行囊：不是躲枯，是去问她。（平民舆论线提前转向。街谈：「街头那张纸，识字的一个个念给不识字的听。念到『飞升是被收割』，满街的人一起抬头看天。」／「九派连夜收回贴文，可纸这个东西——收得回墙上贴的，收不回人心里念的。」终战兑现：她到场见你第一句：「你是会说出去的人。」）', 'success');
        } else {
            W.addQiHeart('他独握了真相——那卷《天锁论》，他烧了，火光照了他半张脸。没人知道这件事发生过，包括被他瞒下的天下人。');
            log('🔥 你把《天锁论》烧了。火光照了你半张脸。你告诉自己：这张纸出去，九州会在她抽完之前先乱掉——乱掉的地方，死人比枯掉的多。（人心簿重笔：他独握了真相。街谈无新增——没人知道这件事发生过，包括被你瞒下的天下人。终战兑现：她当面点破：「你烧掉的那卷东西，本座背得出来。教本座认字的，偏偏是个管事。」——她知道。你这拍谁也没瞒住，只瞒住了自己）', 'warning');
        }
        _c17End();
    };
    function _c17End() {
        scene('c17_end');
        modal('🌙 离开密档库', para('离开密档库前，你回头看了一眼那排空了的架子。')
            + para('忽然明白了她为什么要快、也明白了他们为什么要拦——<b class="text-amber-200">两边都不是在守脉。一边要拆锁，一边要守钥匙。</b>')
            + para('而九州的人，在锁和钥匙的底下，一代比一代矮。')
            + btns([btn('📜 守脉盟一章，到此为止', 'window.qiFinishC17()')]));
    }
    W.qiFinishC17 = function () {
        _close();
        if (flags()['qi_c17']) return;
        finish('main_017', 'qi_c17');
        log('📜 守脉盟一章毕。你手里没有兵，没有盟——但你有账，账上有名字。（红线已近长安）', 'info');
    };

    // ============ C8 · main_018 聚义 + 中幕加信 ============
    W.qiStartC18 = function () {
        if (flags()['qi_c18'] || flags()['qi_c_scene']) { W.qiResumeOppose(); return; }
        accept('main_018');
        _c18Roster();
    };
    function _c18Roster() {
        scene('c18_roster');
        var list = roster();
        var body = para('你发了聚义帖。不求兵马，只求一件事：灵气之尽那天，愿意跟你一起站到脉尽头的人——来。')
            + para('<b class="text-amber-200">名册不报数。名字自己会来——</b>')
            + list.map(function (p) { return para('<b class="text-amber-200">' + p.name + '</b>：' + p.line); }).join('');
        if (list.length <= 2) {
            body += yuGuarded()
                ? para('名册薄得能透光。你把它合上，火堆噼啪响了一声。怀里那半块阵眼灵石发起热来——<b class="text-amber-200">石头认得你。从你替七霞派守住阵眼那天起，你就在名册上了，只是名册不在纸上。</b>')
                : para('名册薄得能透光。你把它合上，火堆噼啪响了一声。帐外传来脚步声。那个不认得你的灰袍人掀帘进来，把行囊往地上一放：「别数了。数来数去都是老夫一个——一个顶三个，金丹三百年不是白卡的。」');
        }
        body += btns([btn('🕯️ 聚义毕——愿意同行的人，点完了', 'window.qiToLetter()')]);
        modal('📜 聚义 · 名册点名', body);
    }
    W.qiToLetter = function () { _close(); _c18Letter(); };
    function _c18Letter() {
        if (flags()['qi_interlude']) { say('信使早走了。有些问题，一辈子只问一次。', 'info'); _c18End(); return; }
        scene('c18_letter');
        modal('✉️ 她的信使', para('她的信使在你城外候了三日。你以为是战书——展开来，通篇没有一个字提「盟」，也没有一个字提「脉」。只有一个问题，字写得意外地好看：')
            + para('<b class="text-pink-200">「若本座不拆你的仙路，你还会来杀本座吗？」</b>')
            + para('信使低着头：「主人说了，答什么都行。她要的不是答案——是你的实话。」')
            + btns([
                btn('✍️ 答实话——「会来。但我会为你多难过一天。」', 'window.qiInterludeChoice(\'answer\')'),
                btn('🤐 不答——把信凑到烛火上', 'window.qiInterludeChoice(\'silent\')', 'bg-gray-600 hover:bg-gray-500')
            ]));
    }
    W.qiInterludeChoice = function (c) {
        _close();
        var f = flags();
        if (f['qi_interlude']) return;
        f['qi_interlude'] = c;
        record('qi_interlude_' + c, '聚义');
        if (c === 'answer') {
            W.addQiGrace('她问：若本座不拆你的仙路，你还会来杀本座吗。你答了实话：会来。但我会为你多难过一天。——她把这个问题问出口，说明她也想知道答案。');
            log('✍️ 你答了实话。信使走后第三日，枯萎图上她的红线停了一天——九州不解其意，只有你隐约明白：那一天的实话，值钱。（恩列：她把这个问题问出口，说明她也想知道答案。终战兑现：定账时，她会想起这句）', 'success');
        } else {
            W.addQiGrace('她问的那个问题，你没答，烧了信。她笑了：不敢答，说明答案本座不爱听。——不答，也是答。她记性好得很。');
            log('🤐 你不答，烧了信。据说她收到回报后笑了：「不敢答，说明答案本座不爱听。」——不答，也是答。（恩列：她记性好得很。终战兑现：定账时，她会想起这一烧）', 'info');
        }
        _c18End();
    };
    function _c18End() {
        scene('c18_end');
        modal('🌫️ 聚义散的那夜', para('聚义散的那夜，名册厚了一页。你摊开枯萎图——她的红线已经进了长安。')
            + para('<b class="text-red-300">只剩最后一条脉了。</b>')
            + para('你忽然明白，这最后一段路，你追的已经不是她——<b class="text-amber-200">是你、是她、是天上那些管事，三方都在赶同一个终点。</b>')
            + btns([btn('🌊 二幕毕——最后一程，脉尽头见', 'window.qiFinishC18()')]));
    }
    W.qiFinishC18 = function () {
        _close();
        if (flags()['qi_c18']) return;
        finish('main_018', 'qi_c18');
        if (typeof W.qiSetStage === 'function') W.qiSetStage(3);
        if (typeof W.qiWitherCity === 'function') W.qiWitherCity('帝都·长安');
        log('🥀 帝都·长安的脉，枯了。八条脉只剩最后一条——在血海坝下。（对抗线二幕毕。第三幕：脉尽头之威，肉身难近——需渡劫修为。她在等你。）', 'warning');
    };

    console.log('[qi-arc2] v25.0《灵气之尽》批二已注册：对抗线 main_011~018（枯萎巡/占脉者四仗/初次照面+暴涨/守脉盟/聚义+中幕加信/名册）');
})();
