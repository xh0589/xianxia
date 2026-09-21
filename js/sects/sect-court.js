// ==================== sect-court.js - 高位日常（第十一波 · 坐堂早朝/断案批账/掌门威仪） ====================
// 此前职位越高日子越空：杂役每天两桩差事，长老以上日常差事为零——只剩教导/外交两桩长者差事，
// 做完今天就没事了；掌门案头又只在断粮缺士气时才有内容。本模块把长老到掌门的每一天填满：
//   坐堂（长老以上，辰巳时开堂，一日一堂）：随机两三件门中事务上案——弟子斗殴、库房请领、门人窃取、
//     属城香火、盟家宴帖、旧人求济……每件两三个处置，宽严各有后果，钱粮士气全走真账；
//   批账（副掌门以上，一月一回）：读真账本审可疑支出——查出亏空追回入库，账目干净也是功；
//   掌门威仪：巡山（一日一回，真耗时辰，七成无事/两成查出隐患/一成拾得好处）、
//     讲道（一月一会，全派士气与你的名望真涨）；
//   身份改版：长老以上上早课改「领众」、听晚课改「讲经」、灵田帮工改「督耕」——文案与辈分对齐；
//   长者差事加日子口径：教导一天点化一回（弟子自有日课，你点到即止）。
// 守恒纪律：每一笔进出有名有姓——香火是属城送的、追补是亏空退赔的、报恩是受过济的门人回来谢的；
//   「下月来报」的账挂旗上，到期真入真扣。零外文字母，文案不带计数器口吻（一日一堂是制度，时辰为门）。
(function () {
    'use strict';
    var W = window;
    if (typeof W === 'undefined') return;

    // 第九波同款真钟链
    function absDay() {
        try {
            if (typeof W.getAbsoluteDay === 'function') { var g = W.getAbsoluteDay(); if (g) return Math.floor(g); }
            var t = W.timeSystem;
            if (t) {
                if (typeof t.getAbsoluteDay === 'function') { var g2 = t.getAbsoluteDay(); if (g2) return Math.floor(g2); }
                if (t.gameTime && t.gameTime.currentDay) return Math.floor(t.gameTime.currentDay);
                if (t.totalDays) return Math.floor(t.totalDays);
            }
            if (W.WorldCalendar && W.WorldCalendar.day) return Math.floor(W.WorldCalendar.day);
        } catch (e) {}
        return 0;
    }
    function hour() { try { return Number(W.timeSystem && W.timeSystem.gameTime ? W.timeSystem.gameTime.currentHour : 12) || 0; } catch (e) { return 12; } }
    function advance(min, why) { try { if (W.timeSystem && W.timeSystem.advanceTime) W.timeSystem.advanceTime(min, why || '门中仪轨'); } catch (e) {} }
    function ds() { return W.discipleState || null; }
    function cd() { return W.currentCharData || null; }
    function mySect() { try { var d = ds(); return d && d.isInSect ? (d.sectName || d.sectId) : null; } catch (e) { return null; } }
    function myRank() { var d = ds(); return d && d.rank != null ? d.rank : 7; }
    function flags() { return (W.eventFlags = W.eventFlags || {}); }
    function log(m, t) { try { if (W.gameLog && W.gameLog.add) W.gameLog.add(m); } catch (e) {} }
    function msg(m, t) { if (typeof W.showMessage === 'function') W.showMessage(m, t || 'info'); }
    function modal(t, b) { if (typeof W.showModal === 'function') W.showModal(t, b); }
    function para(t) { return '<p class="text-sm text-gray-300 leading-relaxed mb-2">' + t + '</p>'; }
    function btn(label, onclick, cls) { return '<button onclick="' + onclick + '" class="' + (cls || 'bg-amber-700 hover:bg-amber-600') + ' text-xs px-3 py-2 rounded text-left">' + label + '</button>'; }
    function playerName() { try { return (cd() || {}).name || '门下'; } catch (e) { return '门下'; } }
    function internal(sect) { return (W.SECT_INTERNAL && W.SECT_INTERNAL[sect]) || null; }
    function chron(sect, text) { try { if (W.SectGov && W.SectGov.chronicle) { W.SectGov.chronicle(sect, text); return; } } catch (e) {} }
    function addC(n, r) { try { if (typeof W.sectAddContribution === 'function') return W.sectAddContribution(n, r); } catch (e) {} var d = ds(); if (d) d.contribution = (Number(d.contribution) || 0) + n; return d && d.contribution; }
    function street(text) {
        try {
            var f = flags();
            if (!f['qi_street'] || !f['qi_street'].push) f['qi_street'] = [];
            f['qi_street'].push({ day: absDay(), text: String(text) });
            if (f['qi_street'].length > 60) f['qi_street'].splice(0, f['qi_street'].length - 60);
        } catch (e) {}
    }
    // 定数随机：同一天同一门派，堂上的案是一样的（读档不重摇）
    function seeded(day, sect, salt) {
        var h = (salt || 0) * 7919;
        var s = String(sect || '');
        for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000;
        h = (h + (day || 0) * 131) % 100000;
        h = (h * h * 7 + h * 13 + 11) % 100000;
        return h / 100000;
    }

    // ============ 一 · 挂账（「下月来报」的许诺，到期真入真扣） ============
    function pendList() {
        var f = flags();
        if (!f['sect_court_pend'] || !f['sect_court_pend'].push) f['sect_court_pend'] = [];
        return f['sect_court_pend'];
    }
    function pendAdd(sect, dueDay, stones, text) {
        pendList().push({ sect: sect, due: dueDay, stones: stones, text: text });
    }
    function pendRun() {
        var day = absDay();
        if (!day) return;
        var list = pendList();
        for (var i = list.length - 1; i >= 0; i--) {
            var p = list[i];
            if (!p || !p.sect || (day | 0) < (p.due | 0)) continue;
            var it = internal(p.sect);
            if (it) {
                if (p.stones > 0) it.resources = (Number(it.resources) || 0) + p.stones;
                else if (p.stones < 0) it.resources = Math.max(0, (Number(it.resources) || 0) + p.stones);
            }
            chron(p.sect, p.text + (p.stones ? '（公库灵石' + (p.stones > 0 ? '+' : '') + p.stones + '）' : ''));
            log('📜 ' + p.text + (p.stones ? '（公库灵石' + (p.stones > 0 ? '+' : '') + p.stones + '）' : ''), p.stones >= 0 ? 'success' : 'warning');
            list.splice(i, 1);
        }
    }

    // ============ 二 · 案卷（每一件的钱粮士气都有来路有去向） ============
    var CASES = [
        {
            id: 'fight', title: '两个弟子动了手',
            text: '演武场边上围了一圈人——两个外门弟子为一份月例的成色动了手，一个破了嘴角，一个撕了衣襟。执事的把两个都带来了堂下。',
            options: [
                { label: '严判：各罚半月月例，当众认错', run: function (ctx) {
                    var it = ctx.it; if (it) it.morale = Math.max(0, (Number(it.morale) || 50) - 2);
                    ctx.addC(20); ctx.chron('两个斗殴的弟子各罚了半月月例——堂上板子没落下去，规矩立起来了。');
                    return '罚单当场念了。围观的弟子散得很安静——安静，就是畏惧。你的规矩立住了。（士气微挫，功绩记档）';
                } },
                { label: '宽判：各打五十大板的事算了，罚他们同扫一个月山道', run: function (ctx) {
                    var it = ctx.it; if (it) it.morale = Math.min(100, (Number(it.morale) || 50) + 2);
                    ctx.addC(12); ctx.chron('斗殴的两个弟子被罚同扫山道一个月——扫到后来，两人反倒成了朋友。');
                    return '一个月后，那两个一起扫山道的弟子成了朋友。门里人说你判得有人情味。（士气小涨，功绩记档）';
                } }
            ]
        },
        {
            id: 'armory', title: '库房执事请领兵器',
            text: '兵器库的执事捧着册子上堂：今冬妖兽下山频繁，外务的弟子手里家伙不够，请领法器二十件发下去。',
            options: [
                { label: '准：兵器是弟子的命，发', run: function (ctx) {
                    var it = ctx.it;
                    if (it) {
                        var give = Math.min(20, Math.floor(Number(it.weapons) || 0));
                        it.weapons = (Number(it.weapons) || 0) - give;
                        it.defense = (Number(it.defense) || 0) + Math.ceil(give / 4);
                        ctx.chron('外务弟子领了' + give + '件法器下山——库里薄了，山门外的腰杆硬了。');
                        return '发下去' + give + '件。库里的账薄了，可外务弟子的腰杆硬了。（防务 +' + Math.ceil(give / 4) + '）';
                    }
                    return '库里一件像样的都没有——执事捧着空册子退下了。（先铸造，再谈发放）';
                } },
                { label: '驳：库里也紧，让他们自己挣贡献换', run: function (ctx) {
                    var it = ctx.it; if (it) it.morale = Math.max(0, (Number(it.morale) || 50) - 1);
                    ctx.addC(5); ctx.chron('请领兵器的条子被驳了——「库里也紧，用贡献来换。」外务的弟子嘴上应着，心里凉着。');
                    return '条子驳了。库是保住了，外务弟子嘴上应着，心里凉着。（士气微挫）';
                } }
            ]
        },
        {
            id: 'theft', title: '有人动了库里的灵材',
            text: '管库的老执事压着嗓子上堂：账对不上，三株灵草不见了。他盯了几天，锁定了个手脚不干净的记名弟子——人证物证都在，就等你一句话。',
            options: [
                { label: '逐出山门，昭告全门', run: function (ctx) {
                    var it = ctx.it; if (it) it.morale = Math.max(0, (Number(it.morale) || 50) - 1);
                    ctx.addC(20); ctx.chron('窃取灵材的记名弟子被逐出山门——行囊当日清点的，没人为他说话。');
                    ctx.street('「' + ctx.sect + '」逐了个手脚不干净的弟子，山门外围观的人不少——门规是动真的。');
                    return '当日逐出，行囊当众清点。门规是冷的，可剩下的人心里那杆秤正了。（功绩记档，士气微挫）';
                } },
                { label: '留他颜面：私下责令退赔，记过留用', run: function (ctx) {
                    var r = ctx.seeded(11);
                    if (r < 0.3) {
                        var it = ctx.it; if (it) it.morale = Math.max(0, (Number(it.morale) || 50) - 3);
                        ctx.chron('私下退赔的事还是走漏了风声——门里议论了半月：堂上的规矩，原来能讲人情。');
                        return '纸包不住火。退赔是退了，可「讲人情」三个字传开了，比偷三株灵草伤得更重。（士气受挫）';
                    }
                    ctx.addC(15);
                    var it2 = ctx.it; if (it2) it2.resources = (Number(it2.resources) || 0) + 15;
                    ctx.chron('窃取灵材的弟子私下退赔折银十五，记过留用——第二年他成了管库最仔细的人。');
                    return '他红着眼眶退了赔银，磕了个头。第二年，他成了管库最仔细的人。（追回折银入库，功绩记档）';
                } }
            ]
        },
        {
            id: 'incense', title: '属城送来香火钱',
            text: '护持城的香首带着两个后生上堂，抬着一只封红的匣子：城中香火鼎盛，信众们凑了一份心意，谢山门一年护持。',
            options: [
                { label: '受：香火是信众的心，收下记档', run: function (ctx) {
                    var it = ctx.it; if (it) it.resources = (Number(it.resources) || 0) + 30;
                    ctx.addC(10); ctx.chron('属城香首代信众送香火钱三十入公库——匣子上贴着全城铺子的联名红纸。');
                    return '匣子开封，灵石三十，红纸上是全城铺子的联名。香火情，收下了就是欠下了——往后城里的事，山门要管。（公库 +30）';
                } },
                { label: '厚谢回礼：加倍还一份，山里出产', run: function (ctx) {
                    var it = ctx.it;
                    if (!it || (Number(it.resources) || 0) < 15) return '库里拿不出回礼的体面——香首看出你的迟疑，自己把话圆了过去。（公库不凑手，先充实库房）';
                    it.resources = (Number(it.resources) || 0) - 15;
                    it.influence = (Number(it.influence) || 40) + 2;
                    ctx.addC(15); ctx.chron('属城送来的香火钱，山门加倍回了礼——「门里不占信众的便宜」这话，香首带回城说了三年。');
                    return '你回了一份山里的出产，加倍的。「不占信众便宜」这句话，香首带回城说了三年。（公库 -15，影响力 +2，功绩记档）';
                } }
            ]
        },
        {
            id: 'rogue', title: '游方修士求见',
            text: '一个游方修士在山门外递了帖：路过宝地，仰慕已久，求借藏经阁一观，愿以一路见闻相换。执事的拿不准，请你示下。',
            options: [
                { label: '请进来：见闻也是书', run: function (ctx) {
                    var it = ctx.it; if (it) it.influence = (Number(it.influence) || 40) + 1;
                    var r = ctx.seeded(13);
                    if (r < 0.25) {
                        ctx.addC(30);
                        ctx.chron('游方修士在藏经阁抄了半日书，留下一卷手记作谢——里面有几页连长老都没见过的古法残篇。');
                        return '他留下了一卷手记——有几页古法残篇，连长老都没见过。（影响力 +1，功绩 +30）';
                    }
                    ctx.addC(8); ctx.chron('游方修士借观藏经阁一日，讲了三段塞外见闻——弟子们听得入了迷。');
                    return '他讲了三段塞外见闻，弟子们听得入迷。山门的门开一条缝，江湖的风就进来一缕。（影响力 +1）';
                } },
                { label: '婉拒：藏经阁重地，不便外客', run: function (ctx) {
                    ctx.chron('有游方修士求借藏经阁，被婉拒了——他在山门外作了个长揖，转身下山。');
                    return '他作了个长揖，转身下山。规矩是规矩——只是那背影走得从容，倒显得山门小气了。';
                } }
            ]
        },
        {
            id: 'feast_inv', title: '盟家递来宴帖',
            text: '交好门派的管事递来一张洒金帖：老掌门做寿，设宴三日，请山门遣人赴席。礼单要你过目——这份人情，去不去、送多重，都是学问。',
            options: [
                { label: '亲赴，备厚礼（公库出二十灵石）', run: function (ctx) {
                    var it = ctx.it;
                    if (!it || (Number(it.resources) || 0) < 20) return '库里凑不出像样的贺仪——管事看出你的为难，笑着把帖子收了：「改日，改日再请。」（公库不凑手）';
                    it.resources = (Number(it.resources) || 0) - 20;
                    it.influence = (Number(it.influence) || 40) + 3;
                    ctx.addC(15); ctx.chron('盟家老掌门寿宴，山门亲赴厚礼——席间两门弟子拼了酒，老掌门拍着桌子认了「通家之好」。');
                    return '三日宴，你亲赴。老掌门拍着桌子认下「通家之好」——往后两门的事，好商量了。（公库 -20，影响力 +3）';
                } },
                { label: '遣弟子代席，礼数不缺', run: function (ctx) {
                    var it = ctx.it; if (it) it.resources = Math.max(0, (Number(it.resources) || 0) - 5);
                    ctx.addC(8); ctx.chron('盟家寿宴遣弟子代席，贺礼五石——礼数不缺，情分也就止于礼数。');
                    return '弟子代席，礼数不缺。只是席间别家掌门问起你，你的人答不上三句。（公库 -5）';
                } },
                { label: '辞：山中事务缠身', run: function (ctx) {
                    var it = ctx.it; if (it) it.influence = Math.max(0, (Number(it.influence) || 40) - 2);
                    ctx.chron('盟家的寿宴请帖被辞了——帖子退回那日，两门山道上遇到的弟子，各自别过了头。');
                    return '帖子退回去了。江湖上的人情是存折——你取了一笔，没存。（影响力 -2）';
                } }
            ]
        },
        {
            id: 'old_disc', title: '下山多年的旧门人回来了',
            text: '一个下山多年的旧门人上堂，衣襟打着补丁：他想在城里盘间铺子做营生，差三十灵石的本，回来求山门周转——「成了，双倍还门里。」',
            options: [
                { label: '济他三十（公库出，挂账下月）', run: function (ctx) {
                    var it = ctx.it;
                    if (!it || (Number(it.resources) || 0) < 30) return '你想济，库里却拿不出三十——他看出你的难处，反倒安慰你：「山门的心意，我领了。」（公库不凑手）';
                    it.resources = (Number(it.resources) || 0) - 30;
                    var r = ctx.seeded(17);
                    if (r < 0.75) {
                        ctx.pend(ctx.sect, ctx.day + 30, 50, '下山经商的旧门人回来了，把双倍的本钱捧上堂——「山门济我时，没问我能还多少。」');
                        ctx.chron('旧门人求济经商，公库周转三十——他磕了个头，说成了双倍还。');
                        return '他捧着灵石磕了个头。账挂上了——下月这个时候，看他的铺子成不成。（公库 -30；成了，下月回来报）';
                    }
                    ctx.pend(ctx.sect, ctx.day + 60, 30, '旧门人的铺子没能成，人回来请罪，把本钱原数奉上——「再给我一次机会。」');
                    ctx.chron('旧门人求济经商，公库周转三十——两个月后铺子没成，他把本钱原数奉还，人瘦了一圈。');
                    return '你济了他。生意有赚有赔——赔了，他也会把本钱还回来，人还认这个门。（公库 -30，两月后回本）';
                } },
                { label: '婉拒：公中的钱，不好做人情', run: function (ctx) {
                    var it = ctx.it; if (it) it.morale = Math.max(0, (Number(it.morale) || 50) - 1);
                    ctx.chron('旧门人求济被婉拒——他走的时候在山门口站了很久，把补丁衣襟抻平了才下山。');
                    return '他站了很久，把衣襟抻平了才下山。规矩没错——只是门里老人听说后，沉默了几天。（士气微挫）';
                } }
            ]
        },
        {
            id: 'prowler', title: '夜里山道有黑影',
            text: '巡夜的弟子回报：连着三夜，后山山道有黑影晃过，身法不像门里人。库房刚进了一批灵材——要不要加派人手？',
            options: [
                { label: '加派夜巡（公库出十灵石雇更夫）', run: function (ctx) {
                    var it = ctx.it;
                    if (!it || (Number(it.resources) || 0) < 10) return '库里连雇更夫的钱都紧——你把自己的佩剑挂到了库房门口，黑影第四夜没再来。（公库不凑手，威仪代之）';
                    it.resources = (Number(it.resources) || 0) - 10;
                    it.defense = (Number(it.defense) || 0) + 3;
                    ctx.addC(10); ctx.chron('后山加了夜巡，雇了城里两个更夫——黑影第四夜没再来，山道上的灯笼倒是常亮了。');
                    return '灯笼亮了一冬，黑影没再来。山门的眼睛，有时候比剑管用。（公库 -10，防务 +3）';
                } },
                { label: '不动声色，暗中盯', run: function (ctx) {
                    var r = ctx.seeded(19);
                    if (r < 0.3) {
                        ctx.pend(ctx.sect, ctx.day + 30, -30, '库房到底还是来了夜客——丢的不是灵材，是脸面。追查半月，人没抓着。');
                        ctx.chron('后山黑影的事压下了，暗中盯了一个月——盯丢了。');
                        return '你暗中盯了一个月，盯丢了。下月库房的事，不好说。（悬着）';
                    }
                    ctx.addC(12); ctx.chron('后山黑影被暗中盯了半月——是山下猎户误入采药，客客气气送下山了。');
                    return '半月后真相大白：山下猎户误入采药。虚惊一场，可门里人看你处置，服气。（功绩记档）';
                } }
            ]
        },
        {
            id: 'liyou', title: '弟子请下山历练',
            text: '一个内门弟子上堂长跪：在山上十年，功夫到了瓶颈，求下山历练三年。按门规，放不放，堂上说了算。',
            options: [
                { label: '放：功夫在山上，也在山下', run: function (ctx) {
                    var it = ctx.it; if (it) it.morale = Math.min(100, (Number(it.morale) || 50) + 1);
                    var r = ctx.seeded(23);
                    if (r < 0.25) {
                        ctx.pend(ctx.sect, ctx.day + 30, 0, '下山历练的弟子回来了，带着一身风霜和一段江湖佳话——山门的名字，被他带到了三百里外。');
                        var it2 = ctx.it; if (it2) it2.influence = (Number(it2.influence) || 40) + 2;
                    }
                    ctx.addC(10); ctx.chron('准了一名内门弟子下山历练——「功夫在山上，也在山下。」这话后来被门里传了很久。');
                    return '你扶他起来：「功夫在山上，也在山下。」他磕了个头，第二日天没亮就走了。（士气小涨；他的江湖，才开头）';
                } },
                { label: '留：瓶颈是心魔，下山躲不开', run: function (ctx) {
                    ctx.addC(5); ctx.chron('一名内门弟子请下山历练，被堂上留了——「瓶颈是心魔，下山躲不开。」他应是，眼里没光。');
                    return '他应是退下了，眼里没光。三个月后你还是准了——有些路，劝不住的。（功绩记档）';
                } }
            ]
        },
        {
            id: 'yamen', title: '官府行文（掌门案）',
            leaderOnly: true,
            text: '府衙的书办捧着公文上堂：城中新设坊市税卡，行文各山门「知会」——话里话外，是要山门表个态：认这个卡，还是认旧例。',
            options: [
                { label: '以礼相待：备程仪，认新卡（公库出二十）', run: function (ctx) {
                    var it = ctx.it;
                    if (!it || (Number(it.resources) || 0) < 20) return '程仪备不起，书办的脸就淡了——公文搁在案上，「再议」。（公库不凑手）';
                    it.resources = (Number(it.resources) || 0) - 20;
                    it.influence = (Number(it.influence) || 40) + 3;
                    ctx.chron('官府设卡行文，山门以礼相待——书办临走时作了个揖：「贵派是识大体的。」');
                    return '书办作了个揖：「贵派识大体。」官府那本册子上，山门这一页往后好翻。（公库 -20，影响力 +3）';
                } },
                { label: '照旧例：山门超然，不接这个话', run: function (ctx) {
                    var it = ctx.it; if (it) it.influence = Math.max(0, (Number(it.influence) || 40) - 2);
                    var r = ctx.seeded(29);
                    if (r < 0.3) ctx.pend(ctx.sect, ctx.day + 30, -20, '税卡的人上山「查香火账」，住了三日，走时库中少了二十灵石——公文上的字，比刀慢，也比刀狠。');
                    ctx.chron('官府行文设卡，山门照旧例不接——书办收起公文时笑了笑，那笑没到眼睛。');
                    return '书办收起公文，笑了笑，那笑没到眼睛。超然是超然了——官府的账，早晚有人来对。（影响力 -2，悬着）';
                } }
            ]
        }
    ];

    // ============ 三 · 坐堂 / 早朝 ============
    function courtOpen() { return hour() >= 5 && hour() < 13; }
    function courtRec() {
        var f = flags();
        var rec = f['sect_court_day'];
        if (!rec || rec.day !== absDay() || rec.sect !== mySect()) rec = { day: absDay(), sect: mySect(), resolved: {} };
        return rec;
    }
    function todaysCases(sect) {
        var day = absDay();
        var isLeader = myRank() === 0;
        var pool = CASES.filter(function (c) { return isLeader || !c.leaderOnly; });
        var n = isLeader ? 3 : 2;
        var picks = [], used = {};
        for (var i = 0; i < n; i++) {
            var idx = Math.floor(seeded(day, sect, i + 1) * pool.length);
            var guard = 0;
            while (used[idx] && guard < pool.length) { idx = (idx + 1) % pool.length; guard++; }
            used[idx] = 1;
            picks.push(pool[idx]);
        }
        return picks;
    }
    W.openCourtPanel = function () {
        var sect = mySect();
        if (!sect) { msg('还没入门——堂上的事，轮不到外人听。', 'warning'); return; }
        var rank = myRank();
        if (rank > 2) { msg('坐堂是长老以上的事——先把位子熬上来。', 'info'); return; }
        var isLeader = rank === 0;
        if (!courtOpen()) { msg((isLeader ? '早朝' : '坐堂') + '在辰巳时（清晨五时至午时一刻）——过了时辰，堂就散了。', 'info'); return; }
        var rec = courtRec();
        var cases = todaysCases(sect);
        var h = '<p class="text-xs text-gray-400 mb-2">' + (isLeader ? '早朝：各堂口报事，逐件批。' : '坐堂：门中的事，今天到你案上。') + '（辰巳时开堂，一日一堂——事情要留着明天办）</p>';
        var allDone = true;
        cases.forEach(function (c, i) {
            var done = rec.resolved[c.id];
            h += '<div class="bg-gray-900/50 border ' + (done ? 'border-gray-700' : 'border-amber-700/50') + ' rounded p-2 mb-2">';
            h += '<p class="text-sm text-amber-300 mb-1">' + c.title + (done ? '<span class="text-xs text-gray-500 ml-2">（已结）</span>' : '') + '</p>';
            h += '<p class="text-xs text-gray-400 mb-2">' + c.text + '</p>';
            if (done) {
                h += '<p class="text-xs text-gray-300">' + done.text + '</p>';
            } else {
                allDone = false;
                h += '<div class="flex flex-wrap gap-1">' + c.options.map(function (o, j) {
                    return btn(o.label, 'window._courtResolve(' + i + ',' + j + ')', j === 0 ? 'bg-amber-700 hover:bg-amber-600' : 'bg-gray-700 hover:bg-gray-600');
                }).join('') + '</div>';
            }
            h += '</div>';
        });
        // 批账（副掌门以上，一月一回）
        var af = flags();
        var auditMonth = Math.floor(absDay() / 30);
        var canAudit = rank <= 1;
        if (canAudit) {
            if (af['sect_audit_month'] === auditMonth) {
                h += '<p class="text-xs text-gray-500 mb-2">本月的账已批过了——账房先生说，下月初一再来。</p>';
            } else {
                h += '<div class="border border-sky-800/60 bg-sky-900/10 rounded p-2 mb-2">' +
                    '<p class="text-sm text-sky-300 mb-1">批账 · 这个月的进出</p>' +
                    '<p class="text-xs text-gray-400 mb-2">' + ledgerBrief() + '</p>' +
                    btn('提笔批账——有一笔看着可疑', 'window._courtAudit()', 'bg-sky-800 hover:bg-sky-700') + '</div>';
            }
        }
        if (allDone) h += '<p class="text-xs text-gray-500">今日堂上事了——散堂。</p>';
        modal((isLeader ? '早朝' : '坐堂') + ' · ' + sect, h);
    };
    function ledgerBrief() {
        try {
            var es = (typeof W.sectLedgerEntries === 'function' ? W.sectLedgerEntries() : []) || [];
            var last = es.slice(-3).map(function (e) { return (e.reason || '无名目') + (e.amt > 0 ? ' +' : ' ') + e.amt; });
            if (last.length) return '账本最近几笔：' + last.join('；') + '。';
        } catch (e) {}
        return '账本还薄——进出几笔，都在眼里。有一笔采买的数目，看着比市价虚。';
    }
    W._courtResolve = function (caseIdx, optIdx) {
        var sect = mySect();
        if (!sect) return;
        var rank = myRank();
        if (rank > 2 || !courtOpen()) { msg('堂已散了。', 'info'); return; }
        var rec = courtRec();
        var cases = todaysCases(sect);
        var c = cases[caseIdx];
        if (!c || rec.resolved[c.id]) return;
        var o = c.options[optIdx];
        if (!o) return;
        var ctx = {
            sect: sect, day: absDay(), it: internal(sect),
            addC: function (n) { return addC(n, '堂上断事·' + c.title); },
            chron: function (t) { chron(sect, t); },
            street: function (t) { street(t); },
            pend: pendAdd,
            seeded: function (salt) { return seeded(absDay(), sect, salt); }
        };
        advance(30, rank === 0 ? '早朝断事' : '坐堂断事');
        var text = '';
        try { text = o.run(ctx) || '此事依你处置。'; } catch (e) { text = '此事依你处置。'; }
        rec.resolved[c.id] = { text: text, opt: optIdx };
        flags()['sect_court_day'] = rec;
        log('🏛️ ' + c.title + '——' + text, 'info');
        W.openCourtPanel();
    };
    W._courtAudit = function () {
        var sect = mySect();
        if (!sect) return;
        var rank = myRank();
        if (rank > 1) { msg('批账是副掌门以上的权柄。', 'info'); return; }
        var auditMonth = Math.floor(absDay() / 30);
        if (flags()['sect_audit_month'] === auditMonth) { msg('本月的账已批过了——账房先生说，下月初一再来。', 'info'); return; }
        flags()['sect_audit_month'] = auditMonth;
        advance(60, '批账');
        var r = seeded(absDay(), sect, 31);
        var it = internal(sect);
        if (r < 0.6 && it) {
            it.resources = (Number(it.resources) || 0) + 20;
            addC(20, '批账·查出亏空');
            chron(sect, '副掌门批账，查出一笔采买虚了市价——经手的执事把差额二十灵石退赔入库，记过一次。');
            log('📊 那笔采买果然有鬼。经手的执事脸白着把差额退赔了——二十灵石入库，记过一次。（贡献+20）', 'success');
            msg('查出亏空：退赔二十灵石入库，经手人记过。（贡献+20）', 'success');
        } else {
            addC(5, '批账·账目干净');
            chron(sect, '本月的账批过了——笔笔有着落，账房先生的算盘没白响。');
            log('📊 账目干净，笔笔有着落。你把笔搁下，账房先生松了口气。（贡献+5）', 'info');
            msg('账目干净——笔笔有着落。（贡献+5）', 'info');
        }
        W.openCourtPanel();
    };

    // ============ 四 · 掌门威仪：巡山 / 讲道 ============
    W.doSectPatrol = function () {
        var sect = mySect();
        if (!sect || myRank() !== 0) { msg('巡山是掌门的功课。', 'info'); return false; }
        if (flags()['sect_patrol_day'] === absDay()) { msg('今日的山已经巡过了——山道上的雪，一天扫一遍就够。', 'info'); return false; }
        flags()['sect_patrol_day'] = absDay();
        advance(60, '巡山');
        var it = internal(sect);
        var r = seeded(absDay(), sect, 37);
        if (r < 0.1 && it) {
            var gain = 20 + Math.floor(seeded(absDay(), sect, 41) * 21);
            it.resources = (Number(it.resources) || 0) + gain;
            addC(15, '巡山·拾得');
            chron(sect, '掌门巡山，在后山崖缝里拾得一株老参——折了' + gain + '灵石入库，门里说是好兆头。');
            log('🏔️ 崖缝里一株老参，须子比你的手指还粗。折银' + gain + '灵石入库——门里人都说是好兆头。（功绩+15）', 'success');
            return true;
        }
        if (r < 0.3 && it) {
            it.defense = (Number(it.defense) || 0) + 2;
            addC(10, '巡山·查出隐患');
            chron(sect, '掌门巡山查出后山栅栏朽了三处，当日换了新的——夜里风大，灯却稳了。');
            log('🏔️ 后山栅栏朽了三处，你摸着黑看完了换新的。（防务 +2，功绩+10）', 'info');
            return true;
        }
        if (it) it.morale = Math.min(100, (Number(it.morale) || 50) + 1);
        addC(3, '巡山');
        log('🏔️ 山道走完一圈：灶上冒着烟，演武场有喝声，库房的锁是好的。太平日子，也是要人走出来的。（士气微涨）', 'info');
        return true;
    };
    W.doSectPreach = function () {
        var sect = mySect();
        if (!sect || myRank() !== 0) { msg('讲道是掌门的法座。', 'info'); return false; }
        var m = Math.floor(absDay() / 30);
        if (flags()['sect_preach_month'] === m) { msg('这个月已经讲过一场道了——经义要温，不要贪。下月再开法座。', 'info'); return false; }
        flags()['sect_preach_month'] = m;
        advance(120, '开坛讲道');
        var it = internal(sect);
        if (it) it.morale = Math.min(100, (Number(it.morale) || 50) + 3);
        addC(30, '开坛讲道');
        try { if (cd()) cd().fame = Math.min(99999, (Number(cd().fame) || 0) + 1); } catch (e) {}
        chron(sect, '掌门开坛讲道一个时辰——漫山弟子列坐，连伙房的火都压小了。散场时，演武场上还坐着几个没悟过来的。');
        street('「' + sect + '」掌门开坛讲道，山下都有人搬着板凳来听——墙外听完了，回去讲给街坊，又添三分声色。');
        log('📿 你讲了整整一个时辰。讲到「山不在高」那一段，台下连咳嗽都没有。（全派士气+3，名望+1，功绩+30）', 'success');
        return true;
    };

    // ============ 五 · 身份改版：领众早课 / 讲经晚课 / 督耕 ============
    function wrapDaily(fnName, flavor) {
        try {
            if (typeof W[fnName] === 'function' && !W[fnName].__courtWrapped) {
                var orig = W[fnName];
                W[fnName] = function () {
                    var r = orig.apply(this, arguments);
                    try {
                        if (r === true && myRank() <= 2) {
                            var sect = mySect();
                            addC(5, flavor.ledger);
                            if (sect) chron(sect, flavor.chron);
                            log(flavor.log, 'info');
                        }
                    } catch (e) {}
                    return r;
                };
                W[fnName].__courtWrapped = true;
            }
        } catch (e) {}
    }
    wrapDaily('doMorningClass', {
        ledger: '领众早课',
        chron: '早课是长老在前头领的——桩功错了的，他一眼就看得出来。',
        log: '🌅 你站在队前领课，而不是在队里挨板子。一上午，纠正了七副桩功——弟子们看你的眼神不一样了。（功绩+5）'
    });
    wrapDaily('doEveningClass', {
        ledger: '讲经晚课',
        chron: '晚课的经，是长老逐句讲的——讲到「上善若水」，经堂里静得能听见灯花爆。',
        log: '🌆 执经的师叔把位置让了让你：「您讲。」一个时辰讲下来，你自己也把旧经读出三分新味。（功绩+5）'
    });
    wrapDaily('doSectFarmWork', {
        ledger: '督耕',
        chron: '灵田的活，长老亲自下田督着——管田的老修士说，贵人踩过的垄，苗都壮些。',
        log: '🌾 你不是来帮工的，是来督耕的——可你还是脱了外袍下了田。收工时，田里的弟子看你的眼神，比苗还直。（功绩另记）'
    });

    // ============ 六 · 日钩：挂账到期结算 + 堂上对表 ============
    function dayHook() {
        try { pendRun(); } catch (e) {}
    }
    try {
        if (W.EventBus && W.EventBus.on) W.EventBus.on('newDay', dayHook);
        else if (W.timeSystem && typeof W.timeSystem.onNewDaySubscribe === 'function') W.timeSystem.onNewDaySubscribe(dayHook);
    } catch (e) {}

    // ============ 七 · 探针（测试用） ============
    W.sectCourtProbe = function () {
        var sect = mySect();
        if (!sect) return null;
        var rec = flags()['sect_court_day'];
        return {
            sect: sect, rank: myRank(), open: courtOpen(), hour: hour(),
            cases: todaysCases(sect).map(function (c) { return c.id; }),
            resolved: (rec && rec.day === absDay() && rec.sect === sect) ? Object.keys(rec.resolved) : [],
            auditDone: flags()['sect_audit_month'] === Math.floor(absDay() / 30),
            patrolDone: flags()['sect_patrol_day'] === absDay(),
            preachDone: flags()['sect_preach_month'] === Math.floor(absDay() / 30),
            pend: pendList().length
        };
    };
    console.log('[sect-court] 高位日常已注册：坐堂早朝（辰巳时一日一堂，案卷走真账）+ 批账（月度，读真账本）+ 巡山讲道（掌门威仪）+ 领众/讲经/督耕（身份改版）');
})();
