// ==================== v27.3 手艺与街面批 · 手艺摊引擎（新文件 service-stall.js） ====================
// 设计方案 D 引擎：43 看风水 · 44 画小像 · 45 篆刻摊（原「抄书」撞车书肆零工，换血）· 46 写墓志铭 ·
//   49 替富户布阵 · 50 测灵根 · 51 教蒙童吐纳 · 53 保媒 · 54 婚礼司仪 · 55 捉鬼（仅宗门 flavor，核实无玩家服务）·
//   29 走方行医；52 书院讲学、57 拆穿假神仙 → 一次性街面大事。
// 统一模型：选手艺出摊 → 掷客流（手艺×城望，明账区间写在牌面上）→ 结钱 + 低概率客人事件。
// 纪律：**一日一摊**（cd()._stall 单字段日戳，押镖/工账同款先例）；钱平庸（铜钱口，营生路不是印钞路）；
//   事件才是肉（12% 一骰，引擎随机源正门，零直掷）；门槛够不着的摊子亮锁写原因（禁止设计 #2）；
//   银钱/城望/精力/长进一笔事务走 RewardService 统一结算；时辰走 advanceTime；风声走 playerPushDeed。
(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    var CFG = {
        EVENT_P: 0.12,        // 客人事件概率（每摊至多一桩）
        BASE_CUSTOMERS: 1,    // 保底一位客
        SKILL_PER_CUSTOMER: 20,   // 手艺每 20 点多一位客
        REP_PER_CUSTOMER: 2500,   // 城望每 2500 多一位客
        DICE_CUSTOMERS: 3,    // 骰子加客 0~2
        CUSTOMER_CAP: 6,      // 客流封顶（摊子就巴掌大）
        LECTURE_SKILL: 60,    // 书院讲学门槛：学识
        FAKE_SKILL: 40        // 拆穿假神仙门槛：学识或口才其一
    };

    // ============ 十一门手艺（一行一摊） ============
    // need: 手艺点数门槛；realm: 境界序门槛（getRealmIndex）；unit: 每位客的铜钱；ev: 客人事件（winP 随手艺现算）
    var STALLS = [
        { key: 'doctor', icon: '🩺', name: '走方行医', skill: '医术', need: 30, unit: 12, energy: 15, minutes: 120,
          desc: '一只药箱走街串巷——脉金随缘，治好病才是招牌。',
          ev: { text: '🩺 抬来一位浑身肿亮、气息游丝的老妪，陪人直哭：「大夫，死马当活马医吧。」',
                win: { copper: 30, rep: 4, msg: '三针下去肿退人醒——老妪的儿子当场跪了。你的名号在巷子里传开了。' },
                lose: { rep: -2, msg: '你尽了全力，人还是没留住。家属没怪你，可街面上的议论扎了几天耳朵。' } } },
        { key: 'fengshui', icon: '🧭', name: '看风水', skill: '学识', need: 20, unit: 10, energy: 10, minutes: 120,
          desc: '罗盘一端，阴阳宅相一相——富贵人家最信这个。',
          ev: { text: '🧭 一户人家迁祖坟，族里两房为穴向吵得不可开交，都盯着你的罗盘等一句话。',
                win: { copper: 40, rep: 3, msg: '你引经据典断了一向，两房心服口服——谢仪翻着倍地给。' },
                lose: { rep: -1, msg: '你断的向，半年后坟边塌了个角——两房都把账记在你头上。' } } },
        { key: 'portrait', icon: '🖼️', name: '画小像', skill: '学识', need: 10, unit: 8, energy: 10, minutes: 120,
          desc: '支个画案给人画小像——像不像三分，气韵七分。',
          ev: { text: '🖼️ 一位锦袍贵人坐下就不走了：「画得好，赏钱翻倍；画得俗，摊子就别摆了。」',
                win: { stones: 3, rep: 1, msg: '你笔下加了三分风骨，贵人抚掌：「有点意思。」赏了三枚灵石压摊。' },
                lose: { msg: '贵人扫了一眼，摇着头走了——摊子还摆得成，只是这一单白画。' } } },
        { key: 'seal', icon: '🪨', name: '篆刻摊', skill: '锻造', need: 20, unit: 10, energy: 12, minutes: 120,
          desc: '一刀一石，方寸之间刻名号斋印——读书人的体面。',
          ev: { text: '🪨 一位藏家捏着你刻的印石对光看了半晌：「这刀口……你师承何人？」',
                win: { copper: 50, msg: '藏家当场加钱把印买断，又订了三方——「刀口有古意，值这个价。」' },
                lose: { copper: -15, msg: '一刀崩了个口，料是客人的——赔了石料钱，还得陪笑。' } } },
        { key: 'epitaph', icon: '✍️', name: '写墓志铭', skill: '学识', need: 40, unit: 15, energy: 12, minutes: 120,
          desc: '替逝者写一生——笔下积德，字里收钱。',
          ev: { text: '✍️ 丧家两兄弟为父亲的墓志铭吵起来：一个要写「乐善好施」，一个咬定「一生抠门」是实。',
                win: { copper: 30, rep: 2, msg: '你一句「俭以持家」两边都圆了过去——丧家服气，润笔加厚。' },
                lose: { rep: -1, msg: '你照实写了，得罪了出钱的那位——润笔照付，名声落了个「不会做人」。' } } },
        { key: 'formation', icon: '🌀', name: '替富户布阵', skill: '学识', need: 30, realm: 1, unit: 20, energy: 25, minutes: 180,
          desc: '聚灵阵、安神阵——富户宅院最吃这套（须筑基修为压得住阵眼）。',
          ev: { text: '🌀 阵成那一刻灵光一滞——阵眼位下埋着旧铜镜，煞气顶回来了！',
                win: { stones: 5, rep: 2, msg: '你反手改了个阵脚，铜镜煞气尽数收进镜背——主家看得目瞪口呆，谢仪五枚灵石。' },
                lose: { health: -10, qi: -20, msg: '煞气冲了你一个趔趄（伤-10，真气-20）——阵勉强成了，你灰头土脸收了半价。' } } },
        { key: 'root', icon: '🔮', name: '测灵根', skill: null, need: 0, realm: 1, unit: 12, energy: 10, minutes: 120,
          desc: '一块测灵石，替城中孩童测灵根——爹娘们排着队（须筑基修为引动测灵石）。',
          ev: { text: '🔮 测灵石在一个鼻涕娃手里亮得晃眼——三灵根！他爹娘腿都软了。',
                win: { rep: 5, copper: 20, deed: 'good', msg: '你把娃引荐给相熟门派的执事，临走塞给你一叠谢礼。这桩善事，街面上都传遍了。' },
                lose: { msg: '亮了一瞬又灭了——石头的老毛病。娃娘的眼神从期望到失落，你只能多送一句宽慰。' } } },
        { key: 'teach', icon: '🧒', name: '教蒙童吐纳', skill: null, need: 0, realm: 1, unit: 8, energy: 12, minutes: 120, mood: 2,
          desc: '教城里娃娃们打坐吐纳——束脩微薄，胜在干净（须筑基修为做引）。',
          ev: { text: '🧒 一个总打瞌睡的小娃，今天忽然引气入体了——一院子娃都看直了眼。',
                win: { mood: 3, copper: 20, msg: '小娃他爹送来一篮鸡蛋和铜钱，你摆摆手只收了两个——心里亮堂了一整天。' },
                lose: { msg: '娃还是睡着了，口水滴在蒲团上。你叹口气给他披了件衣裳——教的是缘分。' } } },
        { key: 'match', icon: '💞', name: '保媒', skill: '口才', need: 20, unit: 10, energy: 10, minutes: 120,
          desc: '一张嘴成就一对姻缘——谢媒礼薄不了。',
          ev: { text: '💞 一对小夫妻闹到要和离，两家老人请你这媒人「评评理」。',
                win: { copper: 40, rep: 3, msg: '你两头传话各有分寸，一对璧人破涕为笑——两家各封了一份厚礼。' },
                lose: { rep: -2, msg: '话没传好，两家把你各数落了一顿——媒人的名声，坏就坏在一张嘴上。' } } },
        { key: 'mc', icon: '🎊', name: '婚礼司仪', skill: '口才', need: 30, unit: 14, energy: 15, minutes: 180,
          desc: '赞礼、喊堂、说吉利话——一场喜事全凭你一张嘴撑起来。',
          ev: { text: '🎊 拜堂拜到一半，一位旧相识闯进来拍桌：「这婚不能成！」满堂宾客齐刷刷看你。',
                win: { copper: 30, rep: 4, msg: '你一句「吉时不改，有话礼成后再讲」稳住满堂，又暗中使人把那人的旧账问清——原来是场误会。主家谢你救了大礼。' },
                lose: { rep: -3, msg: '场面乱了，喜宴草草收场——主家的脸面和你司仪的名声，一起摔在了地上。' } } },
        { key: 'ghost', icon: '👻', name: '捉鬼', skill: null, need: 0, realm: 2, unit: 25, energy: 30, minutes: 180,
          desc: '闹宅的邪祟、作怪的阴物——贴符设坛，真刀真枪（须金丹修为镇得住场）。',
          ev: { text: '👻 坛刚设好，屋里的灯全绿了——来的不是野鬼，是成了气候的东西。',
                win: { stones: 15, rep: 6, deed: 'good', msg: '一场恶斗，你把它镇回了坛底。主家千恩万谢，十五枚灵石双手奉上——街坊都说这条巷子干净了。' },
                lose: { health: -30, qi: -20, msg: '你被那东西撞了个正着（伤-30，真气-20），符纸烧尽才逼退它半尺——主家的谢仪，你只敢收一半。' } } }
    ];
    var STALL_BY_KEY = {};
    STALLS.forEach(function (s) { STALL_BY_KEY[s.key] = s; });

    // ============ 小工具（city-jobs 同款口径） ============
    function cd() { return window.currentCharData || null; }
    function say(m, t) { try { if (window.showMessage) window.showMessage(m, t || 'info'); } catch (e) {} }
    function log(m, t) { try { if (window.gameLog && window.gameLog.add) window.gameLog.add(m, t || 'info'); } catch (e) {} }
    function city() {
        return (cd() && cd().location) ||
            (typeof window.getCurrentCityName === 'function' && window.getCurrentCityName()) || '';
    }
    function pkCity(s) { return String(s == null ? '' : s).replace(/\s+/g, ''); }
    function absDay() {
        try {
            if (window.WorldCalendar && typeof window.WorldCalendar.day === 'number' && window.WorldCalendar.day > 0) return Math.floor(window.WorldCalendar.day);
            if (typeof window.getAbsoluteDay === 'function') { var g = window.getAbsoluteDay(); if (g) return Math.floor(g); }
            if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') { var t = window.timeSystem.getAbsoluteDay(); if (t) return Math.floor(t); }
        } catch (e) {}
        return 0;
    }
    function dice() { return (typeof window.__scenarioRng === 'function') ? window.__scenarioRng() : Math.random(); }
    function skillVal(name) { var c = cd(); return (c && c.lifeSkills && Number(c.lifeSkills[name])) || 0; }
    function realmIdx() {
        try {
            var r = cd() && cd().realm;
            if (r && typeof window.getRealmIndex === 'function') return Number(window.getRealmIndex(r)) || 0;
        } catch (e) {}
        return 0;
    }
    function repOf(ct) {
        try { if (typeof window.getReputationValue === 'function') return Number(window.getReputationValue(ct || city())) || 0; } catch (e) {}
        return 0;
    }
    function settle(spec) {
        try {
            if (window.RewardService && typeof window.RewardService.apply === 'function') {
                var r = window.RewardService.apply(spec, { facilitySpend: true, source: '手艺摊', city: city() });
                return { ok: !!(r && r.success !== false), note: r && r.messages ? r.messages.join('、') : '' };
            }
        } catch (e) {}
        return { ok: false, note: '' };
    }
    function spendTime(min, why) {
        try { if (window.timeSystem && window.timeSystem.advanceTime) window.timeSystem.advanceTime(min, why); else if (window.advanceTime) window.advanceTime(min, why); } catch (e) { console.warn('[静默失败] js/city-facilities/service-stall.js · spendTime：出摊的时辰没扣', e && e.message); }
    }
    function refresh() { try { if (window.updateCharacterStatus) window.updateCharacterStatus(); } catch (e) {} }
    function deed(mood, text) { try { if (typeof window.playerPushDeed === 'function') window.playerPushDeed(mood, text); } catch (e) {} }
    function grow(name, exp) { try { if (typeof window.growLifeSkill === 'function') window.growLifeSkill(name, exp || 1); } catch (e) {} }

    // ============ 一日一摊账（cd()._stall 单字段日戳，读档归一化） ============
    function stallLedger() {
        var c = cd();
        if (!c) return null;
        if (!c._stall || typeof c._stall !== 'object') c._stall = { lastDay: 0 };
        c._stall.lastDay = Math.max(0, Math.floor(Number(c._stall.lastDay) || 0));
        return c._stall;
    }
    function onceLedger() {
        var c = cd();
        if (!c) return null;
        if (!c._stallOnce || typeof c._stallOnce !== 'object') c._stallOnce = {};
        ['lecture', 'fakexian'].forEach(function (k) {
            if (c._stallOnce[k] != null) c._stallOnce[k] = Math.max(0, Math.floor(Number(c._stallOnce[k]) || 0));
        });
        return c._stallOnce;
    }
    function pitchedToday() { var l = stallLedger(); return !!(l && l.lastDay === absDay()); }

    // ============ 客流与门槛（明账） ============
    function gateFail(s) {
        if (s.realm != null && realmIdx() < s.realm) {
            var rn = s.realm >= 2 ? '金丹' : '筑基';
            return '须' + rn + '修为——这份手艺压不住场。';
        }
        if (s.skill && skillVal(s.skill) < s.need) return s.skill + '不足 ' + s.need + '（现 ' + skillVal(s.skill) + '）——手艺骗不了人。';
        return null;
    }
    function customerBase(s) {
        var lv = s.skill ? skillVal(s.skill) : 0;
        return Math.min(CFG.CUSTOMER_CAP, CFG.BASE_CUSTOMERS + Math.floor(lv / CFG.SKILL_PER_CUSTOMER) + Math.floor(repOf() / CFG.REP_PER_CUSTOMER));
    }
    function customerRange(s) {
        var b = customerBase(s);
        return b + '~' + Math.min(CFG.CUSTOMER_CAP, b + CFG.DICE_CUSTOMERS - 1);
    }

    // ============ 出摊 ============
    function pitch(key) {
        var s = STALL_BY_KEY[key];
        if (!s) { say('🛠️ 没这门手艺摊。', 'warning'); return false; }
        var ct = city();
        if (!ct) { say('🛠️ 先进城——街面上才支得起摊。', 'info'); return false; }
        var gf = gateFail(s);
        if (gf) { say('🛠️ 「' + s.name + '」支不起来：' + gf, 'warning'); return false; }
        var l = stallLedger();
        var d = absDay();
        if (!d) { say('🛠️ 天上没钟，街面不开市——改日再来。', 'info'); return false; }
        if (l.lastDay === d) { say('🛠️ 今日已经出过摊了——一条街就认你一张摊布，明日请早。', 'info'); return false; }
        if (Number(cd().energy || 0) < s.energy) { say('🛠️ 精力不够支摊（要 ' + s.energy + '）——歇一日再来。', 'warning'); return false; }
        // 掷客流（引擎骰，明账区间内）
        var base = customerBase(s);
        var customers = Math.min(CFG.CUSTOMER_CAP, base + Math.floor(dice() * CFG.DICE_CUSTOMERS));
        var copper = customers * s.unit;
        var spec = { copper: copper, energy: -s.energy };
        if (s.mood) spec.mood = s.mood;
        var r = settle(spec);
        if (!r.ok) { say('🛠️ 这一摊没支成——账没走通，什么也没扣你的。', 'warning'); return false; }
        l.lastDay = d;
        if (s.skill) grow(s.skill, 1);
        spendTime(s.minutes, '出摊·' + s.name);
        refresh();
        log('🛠️ ' + s.icon + '「' + s.name + '」出摊一个时辰：来了 ' + customers + ' 位客（保底 ' + base + '），铜钱 ' + copper + ' 文落袋' + (s.skill ? '，' + s.skill + '也长了进益' : '') + '。', 'success');
        // 客人事件（12% 一骰——事件才是肉）
        if (s.ev && dice() < CFG.EVENT_P) resolveEvent(s);
        open();
        return true;
    }

    function resolveEvent(s) {
        var ev = s.ev;
        var lv = s.skill ? skillVal(s.skill) : realmIdx() * 20;
        var winP = Math.min(0.85, Math.max(0.25, 0.45 + lv * 0.004));
        var win = dice() < winP;
        var br = win ? ev.win : ev.lose;
        var spec = { msg: br.msg, msgType: win ? 'success' : 'warning' };
        if (br.copper) spec.copper = br.copper;
        if (br.stones) spec.stones = br.stones;
        if (br.rep) spec.rep = br.rep;
        if (br.mood) spec.mood = br.mood;
        if (br.health) spec.health = br.health;
        if (br.qi) spec.qi = br.qi;
        log('🛠️ 摊上来了桩事：' + ev.text, 'info');
        settle(spec);
        if (win && br.deed) deed(br.deed, '你在' + city() + '摆「' + s.name + '」摊时做下一桩好事——街面上都念你的好');
        refresh();
    }

    // ============ 一次性街面大事（52 书院讲学 · 57 拆穿假神仙） ============
    function lecture() {
        var ol = onceLedger();
        if (ol.lecture) { say('📖 你在书院讲过学了——先生们的帖子早递过一轮了。', 'info'); return false; }
        if (skillVal('学识') < CFG.LECTURE_SKILL) { say('📖 书院讲学要学识 ' + CFG.LECTURE_SKILL + ' 起步（现 ' + skillVal('学识') + '）——先生们的讲台，不认半瓶醋。', 'warning'); return false; }
        if (Number(cd().energy || 0) < 30) { say('📖 精力不够讲一整天（要 30）。', 'warning'); return false; }
        var r = settle({ copper: 300, rep: 15, energy: -30, lifeSkill: { name: '学识', exp: 2 }, msg: '📖 你在书院讲了一整天学，台下坐满了生员——束脩 300 铜，满城读书人都知道了你的学问。（城望+15）', msgType: 'success' });
        if (!r.ok) { say('📖 讲台没登上——账没走通。', 'warning'); return false; }
        ol.lecture = absDay() || 1;
        spendTime(240, '书院讲学');
        deed('good', '你在书院讲了一整天学——读书人都传你的学问');
        refresh();
        open();
        return true;
    }
    function fakexian(choice) {
        var ol = onceLedger();
        if (ol.fakexian) { say('🎭 那个假神仙早跑了——这出戏唱完了。', 'info'); return false; }
        if (choice === 'walk') {
            ol.fakexian = absDay() || 1;
            log('🎭 你看了看那条喧闹的街，转身走了。假神仙还在装神弄鬼——只是这件事，往后与你无关了。', 'info');
            try { if (typeof window.closeModalSoft === 'function') window.closeModalSoft(); } catch (e) {}
            return true;
        }
        var mouth = Math.max(skillVal('学识'), skillVal('口才'));
        if (mouth < CFG.FAKE_SKILL) { say('🎭 拆穿假神仙要学识或口才 ' + CFG.FAKE_SKILL + ' 起步——当众拆台，肚里没货反被倒打一耙。', 'warning'); return false; }
        var p = Math.min(0.85, 0.35 + mouth * 0.005);
        var win = dice() < p;
        if (win) {
            settle({ copper: 150, rep: 12, msg: '🎭 你三句话戳穿了假神仙的把戏——袖里的纸人、提前买通的托儿、抹在额头的假汗。围观的人哄然，被骗过的苦主追着他讨钱。苦主们凑了 150 铜谢你，街面上都夸你眼明嘴利。（城望+12）', msgType: 'success' });
            deed('good', '你当街拆穿了一个装神弄鬼的骗子——被骗的人家都念你的好');
        } else {
            settle({ rep: -4, msg: '🎭 假神仙反咬一口：「这位才是招摇撞骗的！」他雇的托儿一拥而上帮腔，围观的人将信将疑——你说不清了。（城望-4）', msgType: 'warning' });
        }
        ol.fakexian = absDay() || 1;
        spendTime(60, '拆穿假神仙');
        refresh();
        try { if (typeof window.closeModalSoft === 'function') window.closeModalSoft(); } catch (e) {}
        return true;
    }
    function openFakexian() {
        var ol = onceLedger();
        if (ol.fakexian) { say('🎭 那个假神仙早跑了——这出戏唱完了。', 'info'); return false; }
        var mouth = Math.max(skillVal('学识'), skillVal('口才'));
        var html = '<p class="text-sm text-gray-300 mb-2">街口围了一圈人：一个「半仙」正从袖里抖出纸人，说这家宅子里有祟，法事要价十两。你看得分明——纸人是他自己塞进去的，托儿就站在人群头排。</p>' +
            '<p class="text-xs text-gray-500 mb-3">当众拆台要肚里有货（学识或口才 ' + CFG.FAKE_SKILL + ' 起步；你现 ' + mouth + '）。拆成了，苦主们谢你；拆砸了，反被倒打一耙。</p>' +
            '<button onclick="ServiceStall.fakexian(\'expose\')" class="w-full p-3 rounded mb-2 text-left text-sm bg-amber-800 hover:bg-amber-700 text-white">🗣️ 当众拆穿他（成功率约 ' + Math.round(Math.min(0.85, 0.35 + mouth * 0.005) * 100) + '%）</button>' +
            '<button onclick="ServiceStall.fakexian(\'walk\')" class="w-full p-3 rounded mb-2 text-left text-sm bg-gray-700 hover:bg-gray-600 text-white">🚶 不趟这浑水（这出戏就唱完了）</button>';
        if (typeof window.showModal === 'function') window.showModal('🎭 街面上的假神仙', html);
        return true;
    }

    // ============ 牌面 ============
    function stallOk(ct) {
        var c = ct || city();
        if (!c) return false;
        try { if (window.locationSystem && window.locationSystem.getCityData && !window.locationSystem.getCityData(c)) return false; } catch (e) {}
        return true;
    }
    function open() {
        var ct = city();
        if (!ct) { say('🛠️ 先进城——街面上才支得起摊。', 'info'); return false; }
        var d = absDay();
        var done = pitchedToday();
        var html = '<p class="text-sm text-gray-400 mb-2">' + ct + '的街面上给你留着一块摊位。' +
            (done ? '<b class="text-amber-300">今日已出过摊</b>——一条街就认你一张摊布，明日请早。' : '一日只支一摊，支哪门手艺你挑（客流与单价都是明账）：') + '</p>';
        STALLS.forEach(function (s) {
            var gf = gateFail(s);
            var can = !gf && !done;
            html += '<div class="p-2 rounded mb-2 border ' + (can ? 'bg-emerald-900/20 border-emerald-800/50' : 'bg-gray-800/40 border-gray-700 opacity-70') + '">' +
                '<div class="flex justify-between items-center"><span class="text-sm text-emerald-300 font-bold">' + s.icon + ' ' + s.name + '</span>' +
                (can ? '<button onclick="ServiceStall.pitch(\'' + s.key + '\')" class="text-xs bg-emerald-700 hover:bg-emerald-600 text-white px-2 py-1 rounded">出摊</button>'
                     : '<span class="text-xs text-gray-500">' + (done ? '今日已出摊' : '🔒 ' + gf) + '</span>') + '</div>' +
                '<p class="text-xs text-gray-500 mt-1">' + s.desc + '</p>' +
                '<p class="text-xs text-gray-400 mt-1">客流 ' + customerRange(s) + ' 人 × ' + s.unit + ' 铜/人 · 精力-' + s.energy + ' · ' + (s.minutes / 60) + ' 时辰' +
                (s.skill ? ' · ' + s.skill + '长进益' : '') + (s.ev ? ' · 摊上有概率来桩事' : '') + '</p></div>';
        });
        // 一次性街面大事
        var ol = onceLedger();
        html += '<div class="border-t border-gray-600 mt-2 pt-2"><p class="text-xs text-gray-300 font-bold mb-1">🎪 街面大事（一生一回）</p>';
        if (ol.lecture) html += '<p class="text-xs text-gray-500 mb-1">📖 书院讲学——讲过了（第 ' + ol.lecture + ' 日）。</p>';
        else html += '<button onclick="ServiceStall.lecture()" class="w-full p-2 rounded mb-1 text-left text-sm ' + (skillVal('学识') >= CFG.LECTURE_SKILL ? 'bg-indigo-900 hover:bg-indigo-800' : 'bg-gray-800 opacity-60') + ' text-white">📖 书院讲学（学识 ' + CFG.LECTURE_SKILL + ' 起步 · 束脩 300 铜 · 城望+15 · 一整天）</button>';
        if (ol.fakexian) html += '<p class="text-xs text-gray-500 mb-1">🎭 拆穿假神仙——那出戏唱完了（第 ' + ol.fakexian + ' 日）。</p>';
        else html += '<button onclick="ServiceStall.openFakexian()" class="w-full p-2 rounded mb-1 text-left text-sm ' + (Math.max(skillVal('学识'), skillVal('口才')) >= CFG.FAKE_SKILL ? 'bg-amber-900 hover:bg-amber-800' : 'bg-gray-800 opacity-60') + ' text-white">🎭 街口有个假神仙（学识或口才 ' + CFG.FAKE_SKILL + ' 起步 · 拆穿或走开，一生一回）</button>';
        html += '</div>';
        if (typeof window.showModal === 'function') window.showModal('🛠️ 手艺摊 · ' + ct, html);
        return true;
    }

    window.ServiceStall = {
        CFG: CFG, STALLS: STALLS,
        stallOk: stallOk, open: open, pitch: pitch,
        gateFail: gateFail, customerBase: customerBase, customerRange: customerRange,
        pitchedToday: pitchedToday, lecture: lecture, fakexian: fakexian, openFakexian: openFakexian,
        resolveEvent: resolveEvent
    };
    window.openServiceStall = function () { return open(); };
})();
