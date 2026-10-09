// ==================== v26.1 五路进城批（第一百五十二批 · 用户点单）· 茶馆说书账 ====================
// 用户点单：「茶馆现在只能听别人说。我想把自己的生平搬上台——满堂打赏、传闻池灌自己的名头；
//           还能说添油加醋的假本，台下若有知情人当场拆台。」
// 本账在老茶馆的台上开一个「说自己的书」的口子（茶馆菜单里进）：
//   ① 真本：照着生平账（传记那本现成的 compile）讲自己的实底——打赏吃名望，声望+1，
//      传闻池灌一条真事；心气顺（心境+2）；
//   ② 假本（添油加醋）：打赏×1.8、名望+2——但拆台率是明账：
//      p = 12% 底子 + 恶名/250 + （名望≥60 再加 10%——名气越大，台下越可能坐着知情人）；
//      被拆台：当堂对质、声望−3、心境−3、名望−1，本城茶馆拉黑 7 日（跑堂的见你就拦）；
//   ③ 每日至多说一场（九十分钟，嗓子也要歇）；拉黑按城记——这城拆台，换座城照说（江湖就是这么现实）。
// 口径：铜钱/名望/声望走 RewardService；时辰走 advanceTime；风声走 playerPushDeed；
//   生平本料读 Biography.compile（守卫读取，缺账说通稿）；每日账落 StateRegistry 'teaTale' 正门。
(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    var CFG = {
        PERFORM_MIN: 90,          // 一场书的时辰
        DAILY_MAX: 1,             // 每日一场
        TIP_BASE: 15,             // 打赏底子（铜钱）
        TIP_FAME_DIV: 8,          // 名望加成除数
        LIE_TIP_MUL: 1.8,         // 假本打赏倍数
        TRUE_REP: 1,              // 真本声望
        TRUE_FAME_CHANCE: 0.25,   // 真本说得精彩，名望+1 的概率
        LIE_FAME: 2,              // 假本名望（没被拆台时）
        SPOT_BASE: 0.12,          // 拆台率底子
        SPOT_NOTO_DIV: 250,       // 恶名放大除数
        SPOT_FAME_HIGH: 0.10,     // 名望≥60 的加项（名气越大，知情人越多）
        SPOT_FAME_AT: 60,
        BUST_REP: -3, BUST_MOOD: -3, BUST_FAME: -1,
        BAN_DAYS: 7,              // 被拆台后本城茶馆拉黑天数
        MOOD_UP: 2                // 说自己的书，心气顺
    };

    var _st = { day: -1, told: 0, trues: 0, lies: 0, busted: 0, earned: 0, banned: {} };   // banned: {城名: 解禁绝对日}

    // ===== v27.16：季节线（⑬改良-3 seasonChange 广播口的消费方） =====
    // 四句按季——茶馆是城里最会看天的屋子；换季那声广播到时（书场开着）现场换一句。
    function seasonLine() {
        var s = '';
        try { s = (window.timeSystem && window.timeSystem.gameTime && window.timeSystem.gameTime.currentSeason) || ''; } catch (e) {}
        var map = {
            spring: '立春后头一场书，先生说的是「万物生发」——堂外的柳条比昨儿又青了一指。',
            summer: '入了夏，先生把醒木泡在凉茶里再拍——满堂蒲扇摇成一片，「今日说的是伏天的江湖」。',
            autumn: '秋深了，茶博士换了菊花茶——先生开口便是「一叶落而知天下秋」。',
            winter: '寒冬腊月，堂里拢了炭盆——先生说书前先呵了呵手：「今儿个，讲个雪夜的故事。」'
        };
        return map[s] || '';
    }
    try {
        if (window.EventBus && typeof window.EventBus.on === 'function') {
            window.EventBus.on('seasonChange', function () {
                try {
                    var line = seasonLine();
                    if (line) log('🍃 ' + line);
                } catch (eL16) {}
            });
        }
    } catch (eSub16) { console.warn('[静默失败] js/city-facilities/tea-storyteller.js · 换季广播没订上（先生这季不开口）', eSub16 && eSub16.message); }

    // ============ 小工具（茶馆同款口径） ============
    function cd() { return window.currentCharData || null; }
    function say(m, t) { try { if (window.showMessage) window.showMessage(m, t || 'info'); } catch (e) { return false; } return true; }
    function log(m, t) { try { if (window.gameLog && window.gameLog.add) window.gameLog.add(m, t || 'info'); } catch (e) { return false; } return true; }
    function city() {
        return (cd() && cd().location) ||
            (typeof window.getCurrentCityName === 'function' && window.getCurrentCityName()) || '';
    }
    function absDay() {
        try {
            if (window.WorldCalendar && typeof window.WorldCalendar.day === 'number' && window.WorldCalendar.day > 0) return Math.floor(window.WorldCalendar.day);
            if (typeof window.getAbsoluteDay === 'function') { var g = window.getAbsoluteDay(); if (g) return Math.floor(g); }
            if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') { var t = window.timeSystem.getAbsoluteDay(); if (t) return Math.floor(t); }
        } catch (e) { console.warn('[静默失败] js/city-facilities/tea-storyteller.js · absDay：日历没读出来，按零日算', e && e.message); return 0; }
        return 0;
    }
    function settle(spec, source) {
        try {
            if (window.RewardService && typeof window.RewardService.apply === 'function') {
                var r = window.RewardService.apply(spec, { facilitySpend: true, source: source || '说书', city: city() });
                return { ok: !!(r && r.success !== false), note: r && r.messages ? r.messages.join('、') : '' };
            }
        } catch (e) { console.warn('[静默失败] js/city-facilities/tea-storyteller.js · settle：这笔账没落成一笔', e && e.message); }
        return { ok: false, note: '' };
    }
    function advance(min, why) {
        try { if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') window.timeSystem.advanceTime(min, why); } catch (e) { console.warn('[静默失败] js/city-facilities/tea-storyteller.js · advance：时辰没扣成', e && e.message); }
    }
    function deed(mood, s) {
        try { if (typeof window.playerPushDeed === 'function') window.playerPushDeed(mood, s); } catch (e) { console.warn('[静默失败] js/city-facilities/tea-storyteller.js · deed：风声没递进传闻池', e && e.message); }
    }
    function refresh() {
        try { if (window.updateCharacterStatus) window.updateCharacterStatus(); } catch (e) { console.warn('[静默失败] js/city-facilities/tea-storyteller.js · refresh：面板没刷新', e && e.message); }
        try { if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI(); } catch (e2) { console.warn('[静默失败] js/city-facilities/tea-storyteller.js · refresh：钱袋没刷新', e2 && e2.message); }
    }
    function fameNow() { var c = cd(); return c ? (Number(c.fame) || 0) : 0; }
    function notoNow() { var c = cd(); return c ? (Number(c.notoriety) || 0) : 0; }

    // 生平本料（守卫读传记账——缺账说通稿，不硬崩）
    function material() {
        try {
            if (window.Biography && typeof window.Biography.compile === 'function') {
                var book = window.Biography.compile();
                if (book && Array.isArray(book.chapters) && book.chapters.length > 0) {
                    return { verdict: String(book.verdict || ''), chapters: book.chapters.length, ok: true };
                }
            }
        } catch (e) { console.warn('[静默失败] js/city-facilities/tea-storyteller.js · material：生平账没翻开，说一段通稿', e && e.message); }
        return { verdict: '路还长，书还没写到一半。', chapters: 0, ok: false };
    }
    function tipOf(isLie) {
        var t = CFG.TIP_BASE + Math.floor(fameNow() / CFG.TIP_FAME_DIV);
        return isLie ? Math.round(t * CFG.LIE_TIP_MUL) : t;
    }
    function bustP() {
        return Math.min(0.85, CFG.SPOT_BASE + notoNow() / CFG.SPOT_NOTO_DIV + (fameNow() >= CFG.SPOT_FAME_AT ? CFG.SPOT_FAME_HIGH : 0));
    }
    function banDaysLeft(ct) {
        var until = _st.banned[ct];
        if (!until) return 0;
        return Math.max(0, until - absDay());
    }
    function rollDay() {
        var day = absDay();
        if (_st.day !== day) { _st.day = day; _st.told = 0; }
    }

    // ============ 登台说一场 ============
    function perform(isLie, rng) {
        rollDay();
        var c = cd();
        if (!c) { say('请先创建角色。', 'warning'); return false; }
        var ct = city();
        if (!ct) { say('🎤 你不在城里——茶馆的台子支在城中。', 'info'); return false; }
        var ban = banDaysLeft(ct);
        if (ban > 0) { say('🎤 ' + ct + '茶馆的跑堂一见面就把你往外引：「先生，您那回的书说得满堂哗然——掌柜的吩咐了，还有 ' + ban + ' 日才能请您上台。」（被拆台的城，茶馆拉黑 ' + CFG.BAN_DAYS + ' 日）', 'warning'); return false; }
        if (_st.told >= CFG.DAILY_MAX) { say('🎤 今日已在台上说过一场——嗓子冒烟了，明日请早。（每日至多 ' + CFG.DAILY_MAX + ' 场）', 'info'); return false; }

        var mat = material();
        var rr = (typeof rng === 'function') ? rng : Math.random;
        advance(CFG.PERFORM_MIN, '茶馆登台说书');
        _st.told += 1;

        if (isLie) {
            // 假本：先掷拆台
            if (rr() < bustP()) {
                _st.busted += 1;
                _st.lies += 1;
                _st.banned[ct] = absDay() + CFG.BAN_DAYS;
                settle({ cityReputation: CFG.BUST_REP, mood: CFG.BUST_MOOD, fame: CFG.BUST_FAME }, '假本被拆台');
                deed('bad', '你在' + ct + '茶馆把自己的经历吹上了天，被台下一位知情人当场拆台——满堂哄笑，跑堂的把你请下了台');
                log('🎤 你一拍醒木，把自己的经历添油加醋说到天上——台下忽然有人冷笑一声站起来：「诸位莫听他胡吹！' + (mat.ok ? '他的实底我清楚得很' : '这人根本没那些事') + '！」满堂茶客齐刷刷回头看你。你灰头土脸地被跑堂的请下台。（声望' + CFG.BUST_REP + '，心境' + CFG.BUST_MOOD + '，名望' + CFG.BUST_FAME + '，' + ct + '茶馆拉黑 ' + CFG.BAN_DAYS + ' 日）', 'danger');
                say('🎤 假本被知情人当场拆台——满堂哄笑。（声望' + CFG.BUST_REP + ' 心境' + CFG.BUST_MOOD + ' 名望' + CFG.BUST_FAME + '，本城茶馆拉黑 ' + CFG.BAN_DAYS + ' 日）', 'error');
                refresh();
                return true;
            }
            _st.lies += 1;
            var tipL = tipOf(true);
            settle({ copper: tipL, fame: CFG.LIE_FAME, mood: CFG.MOOD_UP }, '说书打赏（假本）');
            _st.earned += tipL;
            deed('good', '你在' + ct + '茶馆说了一段「亲历奇谈」，添油加醋满堂喝彩——打赏的铜钱落了半笸箩（只有你自己知道有几分真）');
            log('🎤 醒木一拍，你把自己的生平添油加醋：斩的妖多了一层，喝的酒贵了一档——满堂喝彩，铜钱落进笸箩。（打赏 ' + tipL + ' 铜钱，名望+' + CFG.LIE_FAME + '，心境+' + CFG.MOOD_UP + '）散场时你留意到角落里有人盯着你看了很久——吹出去的牛，江湖迟早对账。（今日拆台率本是 ' + Math.round(bustP() * 100) + '%）', 'success');
            say('🎤 假本说得满堂彩——打赏 ' + tipL + ' 铜钱，名望+' + CFG.LIE_FAME + '。（吹出去的牛，江湖迟早对账）', 'success');
            refresh();
            return true;
        }

        // 真本
        _st.trues += 1;
        var tipT = tipOf(false);
        var spec = { copper: tipT, cityReputation: CFG.TRUE_REP, mood: CFG.MOOD_UP };
        if (rr() < CFG.TRUE_FAME_CHANCE) spec.fame = 1;
        settle(spec, '说书打赏（真本）');
        _st.earned += tipT;
        deed('good', '你在' + ct + '茶馆登台说了自己的真事——' + mat.verdict);
        log('🎤 你登上台，把自己的实底原原本本说了一回' + (mat.ok ? '（生平 ' + mat.chapters + ' 卷，卷卷是真账）' : '（闯荡的日子还浅，说的是通稿）') + '。说到' + (mat.ok ? '判词那句「' + mat.verdict + '」' : '动情处') + '，堂里静了一瞬，随即茶碗盖响成一片。（打赏 ' + tipT + ' 铜钱，声望+' + CFG.TRUE_REP + '，心境+' + CFG.MOOD_UP + (spec.fame ? '，名望+1' : '') + '）', 'success');
        say('🎤 真本说完，满堂茶碗盖响——打赏 ' + tipT + ' 铜钱，声望+' + CFG.TRUE_REP + '。', 'success');
        refresh();
        return true;
    }

    // ============ 牌面（茶馆菜单进） ============
    function open() {
        // v27.16：季节订阅示范（⑬改良-3 的第一个消费方）——先生的开场诗按季换。
        // 换季那声广播（time-system updateSeason → EventBus 'seasonChange'）到时若书场正开着，
        // 现场换一句换季话——听书的换茶不换座。订阅挂在文件加载时（一次），此处只读当前季。
        try {
            var s16 = seasonLine();
            if (s16) log('🍵 ' + s16);
        } catch (eS16) {}
        rollDay();
        if (!cd()) { say('请先创建角色。', 'warning'); return false; }
        var ct = city();
        if (!ct) { say('🎤 你不在城里——茶馆的台子支在城中。', 'info'); return false; }
        var ban = banDaysLeft(ct);
        var btn = 'class="w-full p-3 rounded mb-2 text-left text-sm text-white hover:opacity-90"';
        var html = '<p class="text-sm text-gray-400 mb-2">茶馆掌柜得知你亲历江湖，把醒木往台上一放：「先生要不……自己说自己的书？」（你的名望 ' + fameNow() + '，恶名 ' + notoNow() + '）</p>' +
            '<p class="text-xs text-gray-500 mb-2">今日 ' + (_st.told >= CFG.DAILY_MAX ? '<span class="text-amber-300">已说过一场（嗓子冒烟，明日请早）</span>' : '还没登台') + ' · 累计打赏 ' + _st.earned + ' 铜钱 · 真本 ' + _st.trues + ' 场 / 假本 ' + _st.lies + ' 场 / 被拆台 ' + _st.busted + ' 回' +
            (ban > 0 ? ' · <span class="text-red-300">本城茶馆拉黑中，还有 ' + ban + ' 日</span>' : '') + '</p>' +
            (ban > 0 ? '' :
                '<button onclick="window.TeaTale.perform(false)" ' + btn.replace('p-3', 'bg-emerald-900 p-3') + '>📖 说真本（' + CFG.PERFORM_MIN + ' 分钟 · 照生平实底讲——打赏 ' + tipOf(false) + ' 铜钱起 · 声望+' + CFG.TRUE_REP + ' · 传闻池灌真事）</button>' +
                '<button onclick="window.TeaTale.perform(true)" ' + btn.replace('p-3', 'bg-rose-900 p-3') + '>🎭 说假本·添油加醋（打赏×' + CFG.LIE_TIP_MUL + ' = ' + tipOf(true) + ' 铜钱 · 名望+' + CFG.LIE_FAME + ' · 拆台率 ' + Math.round(bustP() * 100) + '%——被拆台声望' + CFG.BUST_REP + '、本城拉黑 ' + CFG.BAN_DAYS + ' 日）</button>') +
// v27.13：说史钮挂在牌面尾部——被拉黑也照给（拉黑拦的是你登台说书，不拦你听先生讲史）；无年表时点了就是老话本
              '<button onclick="window.TeaTale.listenHistory()" ' + btn.replace('p-3', 'bg-yellow-900 p-3') + '>📜 听说书先生讲史（天下大事入过史册的，先生翻给你听——不要钱、不占你登台的场）</button>' +
              // v27.24：今日新闻钮——史册里 ≤7 日的新鲜账（太平无账时先生照旧说老话本）
              '<button onclick="window.TeaTale.listenNews()" ' + btn.replace('p-3', 'bg-cyan-900 p-3') + '>📰 听今日新闻（史官新添的墨，先生开场先讲——同样是听，不占你登台的场）</button>' +
            '<p class="text-[11px] text-gray-500 mt-1">明账：拆台率 = 12% 底子 + 恶名/250' + (fameNow() >= CFG.SPOT_FAME_AT ? ' + 名望≥60 的 10%（名气越大，台下越可能坐着知情人）' : '（名望到 ' + CFG.SPOT_FAME_AT + ' 再加 10%）') + '。真本薄利，假本厚利带刺——自己掂量。</p>';
        if (typeof window.showBuildingEffectDialog === 'function') {
            window.showBuildingEffectDialog('🎤 茶馆登台 · 说自己的书 · ' + ct, html);
            return true;
        }
        return false;
    }

    // ============ 说史（v27.13：世界年表·模块⑬的消费面——说书先生翻史册） ============
    // 与传闻账（WorldLedger.noteRumor/knownRumors——客栈夜话用的是那本）分工，两张皮互不顶替：
    //   传闻 = 街头消息：带账龄、6 条滚旧、只在「新鲜事」市场流通，商旅当天带话才到站；
    //   年表 = 盖棺定论的史册：天下大事（谁登基/哪城灾/谁飞升）才入册，不随商旅走——史官记了就是记了。
    // 说书先生讲史：优先挑 ≥30 日前的老账（太新的史事满城都在嚼，先生说点有年头的才显掌故本行；
    // 只有新鲜账也照讲，点明是新鲜事）；史册缺席/空账 → 照旧说书（老话本垫场）。
    // 挂现成茶馆牌面（open 面板加一颗钮），不建新面板；纯下茶的话——不扣钱不扣时辰不进每日一场的账。
    function pickAnnal() {
        try {
            if (window.WorldLedger && typeof window.WorldLedger.annals === 'function') {
                var list = window.WorldLedger.annals(50); // 旧在前（史书从头翻）
                if (list && list.length) {
                    var today = absDay();
                    var old = [];
                    for (var i = 0; i < list.length; i++) {
                        if (today - (Number(list[i].day) || 0) >= 30) old.push(list[i]);
                    }
                    var pool = old.length ? old : list;
                    return pool[Math.floor(Math.random() * pool.length)];
                }
            }
        } catch (e) { console.warn('[静默失败] js/city-facilities/tea-storyteller.js · pickAnnal：史册没翻开，照旧说书', e && e.message); }
        return null;
    }
    // v27.24：今日新闻口——史册里 ≤7 日的新鲜账，先生开场先讲（讲史翻的是老账，讲新闻讲的是眼前事）
      function pickNews() {
          try {
              if (window.WorldLedger && typeof window.WorldLedger.annals === 'function') {
                  var list = window.WorldLedger.annals(20); // 旧在前
                  if (list && list.length) {
                      var today = absDay();
                      var fresh = [];
                      for (var i = 0; i < list.length; i++) {
                          var age = today - (Number(list[i].day) || 0);
                          if (age >= 0 && age <= 7) fresh.push(list[i]);
                      }
                      if (fresh.length) return fresh[Math.floor(Math.random() * fresh.length)];
                  }
              }
          } catch (e) { console.warn('[静默失败] js/city-facilities/tea-storyteller.js · pickNews：史册没翻开，无新闻可说', e && e.message); }
          return null;
      }
      function listenNews() {
          rollDay();
          if (!cd()) { say('请先创建角色。', 'warning'); return false; }
          var ct = city();
          if (!ct) { say('🎤 你不在城里——茶馆的台子支在城中。', 'info'); return false; }
          var a = pickNews();
          if (!a) {
              log('🎤 说书先生理了理醒木：「这几日天下太平，史官案头没添新墨——太平年景，难说书啊。」说罢仍旧开讲前朝旧话本。', 'info');
              say('🎤 这几日天下无事，先生接着讲老话本。', 'info');
              return false;
          }
          var age = Math.max(0, absDay() - (Number(a.day) || 0));
          log('📰 说书先生一拍醒木：「要说一桩新鲜出炉的大事——' + a.text + '」满座茶客放下茶碗，都朝台上望。（史册账龄 ' + age + ' 日）', 'info');
          say('🎤 说书先生讲今日新闻：「' + a.text + '」', 'info');
          return true;
      }

      function listenHistory() {
        rollDay();
        if (!cd()) { say('请先创建角色。', 'warning'); return false; }
        var ct = city();
        if (!ct) { say('🎤 你不在城里——茶馆的台子支在城中。', 'info'); return false; }
        var a = pickAnnal();
        if (!a) {
            // 没账照旧说书：年表还没开张（天下无事——是好事），先生说书还是老三样
            log('🎤 说书先生醒木一拍，说的还是前朝旧话本——英雄美人、妖仙斗法，满堂茶客听得入神。你竖起耳朵听了半晌，没听着一件这些年天下真出过的大事。（年表无账——史官还没开笔）', 'info');
            say('🎤 说书先生说的还是老话本——年表无账，史官还没开笔。', 'info');
            return true;
        }
        var age = Math.max(0, absDay() - (Number(a.day) || 0));
        var intro = age >= 30 ? '要说近些年天下奇事——' : '要说一桩新鲜出炉的大事——';
        // a.text 自带「修仙历N年，」年号头（recordAnnal 统一加），先生只起话头
        log('📖 说书先生一拍醒木：「' + intro + a.text + '！——这可不是我编排，史册上白纸黑字写着哩。」满堂茶客啧啧称奇，茶碗盖响成一片。（史册账龄 ' + age + ' 日）', 'info');
        say('🎤 说书先生讲史：「' + a.text + '」', 'info');
        return true;
    }

    // ============ 存读档（StateRegistry 正门） ============
    function _export() { return JSON.parse(JSON.stringify(_st)); }
    function _import(s) {
        var st = { day: -1, told: 0, trues: 0, lies: 0, busted: 0, earned: 0, banned: {} };
        if (s && typeof s === 'object') {
            st.day = Number.isFinite(Number(s.day)) ? Number(s.day) : -1;
            st.told = Math.max(0, Math.min(CFG.DAILY_MAX, Math.floor(Number(s.told)) || 0));
            var cnt = function (v, cap) { return Math.max(0, Math.min(cap, Math.floor(Number(v)) || 0)); };
            st.trues = cnt(s.trues, 100000);
            st.lies = cnt(s.lies, 100000);
            st.busted = cnt(s.busted, 100000);
            st.earned = cnt(s.earned, 10000000);
            if (s.banned && typeof s.banned === 'object') {
                for (var k in s.banned) {
                    var d = Number(s.banned[k]);
                    if (Number.isFinite(d)) st.banned[String(k).slice(0, 30)] = Math.max(0, Math.floor(d));
                }
            }
        }
        _st = st;
    }
    function _reset() { _st = { day: -1, told: 0, trues: 0, lies: 0, busted: 0, earned: 0, banned: {} }; }
    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        window.StateRegistry.register('teaTale', { version: 1, export: _export, import: _import, reset: _reset });
    }

    window.TeaTale = {
        CFG: CFG,
        perform: perform, bustP: bustP, tipOf: tipOf, banDaysLeft: banDaysLeft,
        open: open,
listenHistory: listenHistory,   // v27.13 说史口：说书先生翻世界年表（空账照旧说书）
          listenNews: listenNews,         // v27.24 今日新闻口：史册 ≤7 日的新鲜账
          pickAnnal: pickAnnal,           // v27.13 测试钩子：从史册挑一条老账（优先 ≥30 日前），无账返 null
          pickNews: pickNews,             // v27.24 测试钩子：从史册挑一条 ≤7 日的新鲜账，无账返 null
        state: _export
    };
    window.openTeaTaleStage = function () { return open(); };
})();
