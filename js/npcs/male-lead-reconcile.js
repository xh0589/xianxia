// ==================== male-lead-reconcile.js - 男主和好事件 v1.0 ====================
// 依赖：npcs/npc-personal-events.js、npcs/male-lead-rivalry.js（detectRivalRomance 已扩展）
// 加载顺序：在 male-lead-rivalry.js 之后
// 吃醋对峙后，好感养回≥55 + 仍有情敌 + 一次性 → 触发和好。道侣走苦涩、表白走二次机会。
// v20.76 第二批：嵩山逵佩南（「待勘」改「永不结」）、丐帮桑拾玖（销不了的签）入册，九位男主齐。
// v20.77 第三批：阎罗殿聂明泽（刮掉「并案？」批注，重新落笔「命格：未定——复核人：本人」）入册，十位男主齐。
// v20.78 第四批：霹雳堂雷惊蛰（受潮批注底下添新行，引信量回样尺）、天书阁宓书言（「讹」页重校三遍改「非讹」）、
// 大隐阁隗九爻（新签数出「剩两颗」，签头那颗重新留起）、侠隐阁简知忆（销毁的附页重写装订回档里）、
// 天涯海阁狄长亭（多算三站的路引重写，里程一里一里对齐）、大旗门樊惊筹（加固针没拆，线头全收进夹层）入册，十六位男主齐。

var MALE_RECONCILE_EVENTS = {
    // ---- 冶砚：炉房和好 ----
    'lu_event_reconcile': {
        id: 'lu_event_reconcile', npcId: 'sect_leader_铸剑山庄', title: '炉火又亮', icon: '🍵',
        desc: '炉房的灯，又亮了。',
        minAffection: 55, trigger: { random: 1.0 }, cooldown: 0, flag: 'lu_e_reconcile_done',
        requireRivalRomance: true, requireEventDone: 'lu_event_rival',
        scenes: [
            { speaker: 'narrator', text: '炉房。你推门——炉火又亮了，比上次那只凉茶暖。冶砚背对你在打铁，听见脚步，锤没停。', type: 'description' },
            { speaker: 'npc', text: '「你又来了。」他声音闷，火气消了大半，「我以为你不来了。」' },
            { speaker: 'npc', text: '「炉前的位，我给你留着。」他把锤一搁，回头看你，琥珀眼底有真东西，「你愿意推门，就一直能推。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「我以后只来你这炉房。」', effect: 'only', affection: 10 },
                { text: '「炉我坐。但有些事我做不到了。」', effect: 'honest', affection: 4 },
                { text: '什么都不说，帮他拉风箱', effect: 'silent', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            if (!rival) return { affection: 0, msg: '（无人可论交——你已无他情。）' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'only':
                    aff = dao ? -2 : 10;
                    msg = dao
                        ? '他笑了一下，虎牙没露：「……只来我这？你道侣'+rival.name+'，怕是不依。」他摇头，「炉前的位给你留着，但只做炉友——你要来，别说得满。」'
                        : '他怔了怔，琥珀眼底亮了一瞬，随即垂下：「……好。」他把风箱拉杆也递你一根，「两根杆，一起拉。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 8);
                    break;
                case 'honest':
                    aff = dao ? 2 : 4;
                    msg = dao
                        ? '他点头，火气平了：「'+rival.name+'既是你道侣，你做不到的，我懂。」他把炉前的凳推近，「炉房不收道侣，只收炉友。你来，我留位。」'
                        : '他叹了口气：「……你倒老实。」他把炉火拨旺，「做不到的，慢慢来。炉先坐着——门没落锁。」';
                    break;
                case 'silent':
                    aff = 6;
                    msg = '你没说话，过去拉风箱。他看你拉，许久，锤落得比往日稳。「……不说话也好。」他低声，「炉火，又暖了。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 芩木：药庐和好 ----
    'su_event_reconcile': {
        id: 'su_event_reconcile', npcId: 'sect_leader_药王谷', title: '热茶', icon: '🍵',
        desc: '他推来的茶，又是热的了。', // v20.25 芩木是男主，旧版照抄女主文案写成"她"
        minAffection: 55, trigger: { random: 1.0 }, cooldown: 0, flag: 'su_e_reconcile_done',
        requireRivalRomance: true, requireEventDone: 'su_event_rival',
        scenes: [
            { speaker: 'narrator', text: '药庐。芩木推一只热茶到你面前——和上次那只凉的，同一位置。', type: 'description' },
            { speaker: 'npc', text: '「你又来了。」他温润地笑，浅褐眼底有了真东西，「我以为你不来了。」' },
            { speaker: 'npc', text: '「茶给你。药庐的门……」他顿了顿，「你愿意推，就一直能推。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「我以后只来你这药庐。」', effect: 'only', affection: 10 },
                { text: '「茶我喝。但有些事我做不到了。」', effect: 'honest', affection: 4 },
                { text: '什么都不说，把茶喝了', effect: 'silent', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            if (!rival) return { affection: 0, msg: '（无人可论交——你已无他情。）' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'only':
                    aff = dao ? -2 : 10;
                    msg = dao
                        ? '他笑了一下，温润里有苦：「……只来我这？你道侣'+rival.name+'，怕是不依。」他摇头，「茶给你喝，但只做药友——你来，别说得满。」'
                        : '他怔了怔，浅褐眼底亮了一瞬，随即垂下：「……好。」他起身去烫第二只杯子，「两只，都温着。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 8);
                    break;
                case 'honest':
                    aff = dao ? 2 : 4;
                    msg = dao
                        ? '他点头，温润平了：「'+rival.name+'既是你道侣，你做不到的，我懂。」他把热茶推近，「药庐不收道侣，只收常客。你来，我留位。」'
                        : '他叹了口气：「……你倒老实。」他把茶推给你，「做不到的，慢慢来。茶先喝——门没落锁。」';
                    break;
                case 'silent':
                    aff = 6;
                    msg = '你把热茶喝了。他看着你喝完，弯了弯眼：「……不说话也好。」他起身去烫第二只杯子，「明日还有一盏。」——药庐的灯，又亮到很晚。';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 昴既明：符阁和好 ----
    'ms_event_reconcile': {
        id: 'ms_event_reconcile', npcId: 'sect_leader_茅山派', title: '符阁开线', icon: '🍵',
        desc: '符阁落锁的门，又开出一条道。',
        minAffection: 55, trigger: { random: 1.0 }, cooldown: 0, flag: 'ms_e_reconcile_done',
        requireRivalRomance: true, requireEventDone: 'ms_event_rival',
        scenes: [
            { speaker: 'narrator', text: '符阁外。门前的积雪被扫出一条道——从阶下直通到门内。他没看你，但那条道是给你扫的。', type: 'description' },
            { speaker: 'npc', text: '「朱砂今日研好了。」他声音清冷，但没拦你，「……你要进来，就进来。」' },
            { speaker: 'npc', text: '「门我没落锁。」他终于看你，银光里雪化了一线，「但你要进来——就只守这一道符。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '踏上那条扫出的道，进门', effect: 'enter', affection: 10 },
                { text: '「符，我守。」', effect: 'promise', affection: 8 },
                { text: '「我可能守不住。」', effect: 'honest', affection: 4 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            if (!rival) return { affection: 0, msg: '（无人可论交——你已无他情。）' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'enter':
                    aff = dao ? 0 : 10;
                    msg = dao
                        ? '你踏上道，进了符阁。他没拦，但护身符挂在中龛，没让你近。「你道侣是'+rival.name+'。」他背对你，「守符要一心。你既有了'+rival.name+'——符阁的门，开这一回，是还你的情。下回，别来了。」'
                        : '你踏上道，进了符阁。他让了半步，没拦。符阁里两道符并挂——他画的，和你的。他看着符：「……守得住，就守。守不住，门我还会扫。」';
                    break;
                case 'promise':
                    aff = dao ? 3 : 8;
                    msg = dao
                        ? '他看了你很久：「……你已把'+rival.name+'当道侣，符怎么守？」他摇头，「话我记下了。但守符要一心——你心里两个名字，符不认。门，开这一线，是最后的。」'
                        : '他点头，银光里一线雪化开：「……行。符认你，我也不拦。」他让开身，「门开着。但'+rival.name+'的事，你给我个了断——符道不容二心。」';
                    break;
                case 'honest':
                    aff = 4;
                    msg = '他沉默半晌，难得露出一点笑意，清冷里的暖：「……守不住也来。这才叫守。」他让开半步，「门开着。能守多久守多久——符等得起。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 赫渊：塔内和好 ----
    'jg_event_reconcile': {
        id: 'jg_event_reconcile', npcId: 'sect_leader_金刚宗', title: '塔门开', icon: '🍵',
        desc: '金刚塔的门，又开了。',
        minAffection: 55, trigger: { random: 1.0 }, cooldown: 0, flag: 'jg_e_reconcile_done',
        requireRivalRomance: true, requireEventDone: 'jg_event_rival',
        scenes: [
            { speaker: 'narrator', text: '金刚塔。门开着——赫渊盘坐塔内，金刚线松了一线。他没睁眼，但为你留了门。', type: 'description' },
            { speaker: 'npc', text: '他许久没动，然后——极轻地开口：「……你来了。」闭口禅，又为你续上了。「我以为你不来了。」' },
            { speaker: 'npc', text: '「塔门我没闭。」他睁眼，沉静的眼底有真东西，「你愿意进，就一直能进。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '进塔，盘坐他旁边', effect: 'enter', affection: 10 },
                { text: '「我以后只守你这塔。」', effect: 'only', affection: 8 },
                { text: '「我可能守不住。」', effect: 'honest', affection: 4 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            if (!rival) return { affection: 0, msg: '（无人可论交——你已无他情。）' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'enter':
                    aff = dao ? 0 : 10;
                    msg = dao
                        ? '你进塔，盘坐他旁边。他没拦，但金刚线缠回了一圈。「你道侣是'+rival.name+'。」他背对你，「守塔要一心。你既有了'+rival.name+'——塔门开这一回，是还你的情。下回，别来了。」'
                        : '你进塔，盘坐他旁边。他让了半寸，没拦。两人盘坐，金刚线松着。「……守得住，就守。守不住，门我还留。」他低声。';
                    break;
                case 'only':
                    aff = dao ? 3 : 8;
                    msg = dao
                        ? '他看了你很久：「……你已把'+rival.name+'当道侣，塔怎么守？」他摇头，「话我记下了。但守塔要一心——你心里两个名字，塔不认。门，开这一回，是最后的。」'
                        : '他点头，沉静的眼底一线暖：「……行。塔认你，我也不拦。」他让开身，「门开着。但'+rival.name+'的事，你给我个了断——塔里不容二心。」';
                    break;
                case 'honest':
                    aff = 4;
                    msg = '他沉默半晌，沉静的眼底罕见地有了暖：「……守不住也来。这才叫守。」他把金刚线松了一圈，「门开着。能守多久守多久——塔等得起。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 竺听雨：思过崖檐下和好（v20.73 入册） ----
    'hs_event_reconcile': {
        id: 'hs_event_reconcile', npcId: 'sect_leader_华山派', title: '伞递过来', icon: '🍵',
        desc: '他烧了那页账，把伞递给你。',
        minAffection: 55, trigger: { random: 1.0 }, cooldown: 0, flag: 'hs_e_reconcile_done',
        requireRivalRomance: true, requireEventDone: 'hs_event_rival',
        scenes: [
            { speaker: 'narrator', text: '思过崖下起雨。你上山时，竺听雨站在崖庐檐下，手里一把伞——只一把。他看见你，笑了笑，把伞递过来。', type: 'description' },
            { speaker: 'npc', text: '「你又来了。」他摆手，「那页账我烧了。烧完才知道，记在心里的那一份，烧不掉。」' },
            { speaker: 'npc', text: '「伞拿着。华山的雨，淋过的人都是一样狼狈——我不介意再多淋一场。」他抬眼，眼底有真东西，「你愿意上山，就一直能上。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「伞一起打。往后我只上你华山。」', effect: 'only', affection: 10 },
                { text: '「伞我拿。但有些事我做不到了。」', effect: 'honest', affection: 4 },
                { text: '什么都不说，把伞收起来，陪他站在檐下听雨', effect: 'silent', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            if (!rival) return { affection: 0, msg: '（无人可论交——你已无他情。）' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'only':
                    aff = dao ? -2 : 10;
                    msg = dao
                        ? '他笑了一下，笑里有苦：「……只上我华山？你道侣'+rival.name+'，怕是要问的。」他还是把伞往你手里塞实，「伞给你，但只做崖上客——你来，别说得满。」'
                        : '他怔了怔，眼底亮了一瞬，随即摆手笑开：「……好。」他把伞撑开，往你这边偏了大半，自己半边肩膀落在雨里，「两个人打，才叫伞。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 8);
                    break;
                case 'honest':
                    aff = dao ? 2 : 4;
                    msg = dao
                        ? '他点头，笑意平了：「'+rival.name+'既是你道侣，你做不到的，我懂。」他把你往檐下拉了半步，「崖庐不收道侣，只收躲雨的人。你来，我留檐。」'
                        : '他叹了口气，笑得自嘲：「……你倒老实。」他把伞收了，往案上一搁，「做不到的，慢慢来。雨先躲——门没落锁。」';
                    break;
                case 'silent':
                    aff = 6;
                    msg = '你把伞收起来，站回他旁边。两个人在檐下听了一夜雨，谁也没说话。天蒙蒙亮时他从袖里摸出那页烧剩的账角，就着灯点了，看它烧尽：「……不说话也好。」他拍拍手上的灰，「账清了。往后记新的。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 阙守拙：真武殿前庭，鞘擦了还你，推手今日不让（v20.74 入册） ----
    'wd_event_reconcile': {
        id: 'wd_event_reconcile', npcId: 'sect_leader_武当派', title: '今日不让', icon: '🍵',
        desc: '他把剑鞘擦了擦，还回你手里。',
        minAffection: 55, trigger: { random: 1.0 }, cooldown: 0, flag: 'wd_e_reconcile_done',
        requireRivalRomance: true, requireEventDone: 'wd_event_rival',
        scenes: [
            { speaker: 'narrator', text: '拂晓，真武殿前庭。你上到千级阶头——他拄着扫帚立在那里，怀里抱着那具剑鞘。对峙那日你曾把鞘塞还他手里，他没接。今日，他接了。', type: 'description' },
            { speaker: 'npc', text: '他掏出净布，把鞘一寸一寸擦过，鞘口七道铜丝，一道一道捋平。擦完，双手捧还到你手里：「鞘，我擦了。」他看你，话说得慢，「搁在我这几日。我想明白了——尘擦得掉，鞘里的话，擦不掉。」' },
            { speaker: 'npc', text: '他把扫帚靠上阶边，抬掌，搭了个推手的起手式。这些年推手，他都让你先出手。今日不让：「今日不让。让，是怕输。今日，不怕。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '收鞘入怀，抬掌搭上去：「推一局。往后我只上你武当的阶。」', effect: 'only', affection: 10 },
                { text: '收鞘：「手我推。但有些事，我做不到了。」', effect: 'honest', affection: 4 },
                { text: '什么都不说，掌贴上他的掌，把这局推完', effect: 'silent', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            if (!rival) return { affection: 0, msg: '（无人可论交——你已无他情。）' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'only':
                    aff = dao ? -2 : 10;
                    msg = dao
                        ? '他的掌在半空停了停，劲收了半寸，又缓缓送足。「……只上我的阶？你道侣'+rival.name+'，怕是要问的。」鞘仍往你怀里按实，「鞘你拿着。但只做阶上客——你来，别说得满。」'
                        : '他怔了怔，搭在你腕上的掌劲松了一线，耳根慢慢红了。「……好。」这一局他不让也不留手，一寸一寸接你的劲，接到东方既白。收势时他说了三个字，一字一顿：「天天来。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 8);
                    break;
                case 'honest':
                    aff = dao ? 2 : 4;
                    msg = dao
                        ? '他点头，收掌，声音很平：「'+rival.name+'既是你道侣，你做不到的，我懂。」他把鞘往你怀里正了正，「推手不伤人。你来，前庭总留一局——只一局。多的，不要。」'
                        : '他想了很久，缓缓点头：「……老实。好。」他把鞘又往你手里按了按，「做不到的，慢慢来。手先推——鞘，没锁。」';
                    break;
                case 'silent':
                    aff = 6;
                    msg = '你不说话，掌贴上他的掌，把这局推完。他不让，也不问，只是引，只是随。收势时钟楼自己响了——是那个贪睡的小道童，被你们惊醒，爬上去补撞晨钟。他听了听钟声，把鞘上的落尘吹净，重新按进你怀里：「……不说话也好。」他拾起扫帚，「往后，脚印重数。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 闻人酌：酒仙池边，封着的酒开了，收起的局摆回来了（v20.75 入册） ----
    'xy_event_reconcile': {
        id: 'xy_event_reconcile', npcId: 'sect_leader_逍遥派', title: '这局，续', icon: '🍵',
        desc: '他把收进匣的残局，重新摆回了石桌。',
        minAffection: 55, trigger: { random: 1.0 }, cooldown: 0, flag: 'xy_e_reconcile_done',
        requireRivalRomance: true, requireEventDone: 'xy_event_rival',
        scenes: [
            { speaker: 'narrator', text: '酒仙池边。对峙那夜之后，石桌上的残局不见了——派中弟子都说，守藏人把棋收了匣，琴也好几日没响。今日你上山，残局重新摆回了石桌；枰边一坛酒，封泥开了，酒香漫了半个池子。', type: 'description' },
            { speaker: 'npc', text: '他坐在枰前，指间捏着一枚黑子。见你来，也不起身，只把对面座位上的落叶拂了拂，给自己斟了半盏，再把你那盏斟满：「这坛酒封了有些年头。我说过，等值得的一日再开。」' },
            { speaker: 'npc', text: '他把黑子落在枰上，抬起头，笑得慵懒，眼底却正经：「解局的人回来了。这局，续。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '执白落子：「这局我续。往后我只上你逍遥的山。」', effect: 'only', affection: 10 },
                { text: '执白落子：「棋我续。但有些事，我做不到了。」', effect: 'honest', affection: 4 },
                { text: '什么都不说，在他对面坐下，把酒饮尽，再执白落子', effect: 'silent', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            if (!rival) return { affection: 0, msg: '（无人可论交——你已无他情。）' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'only':
                    aff = dao ? -2 : 10;
                    msg = dao
                        ? '他执黑的手在半空停了停，棋子在指间转了半圈。他笑了一下，笑里有苦：「……只上我的山？你道侣'+rival.name+'，怕是要问的。」他还是把白子的匣推到你手边，「棋你续。但只做枰边客——你来，别说得满。」'
                        : '他怔了怔，指间的黑子轻轻落回枰上，「嗒」的一声。「……好。」他伸手把池边的灯拨亮了些，又给你把酒续上，「两个人下的才叫局。一个人的，那叫残棋。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 8);
                    break;
                case 'honest':
                    aff = dao ? 2 : 4;
                    msg = dao
                        ? '他点头，给自己斟了盏酒，语气很平：「'+rival.name+'既是你道侣，你做不到的，我懂。」他把白子的匣往你那边推了推，「棋不伤人。你来，石桌总留一局——只一局。旁的，我自斟自渡。」'
                        : '他「啧」了一声，笑得慵懒：「……你倒老实。」他把那坛开了封的酒往你那边挪了挪，「做不到的，慢慢来。棋先续——酒，没再封回去。」';
                    break;
                case 'silent':
                    aff = 6;
                    msg = '你不说话，在他对面坐下，把那盏酒一口饮尽，再执白落子。他也不问，只是接，只是应。两个人下到月上中天，谁也没提那夜的话。他给自己又斟了半盏，望着枰上黑白相持的局，忽然低笑：「……不说话也好。」他把酒坛往你那边推了推，「局没下完，酒没喝完。都长着——往后，盏别空着。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 逵佩南：执法堂灯下，「待勘」那笔重核三遍，改判不结案（v20.76 入册） ----
    'song_event_reconcile': {
        id: 'song_event_reconcile', npcId: 'sect_leader_嵩山派', title: '改判', icon: '🍵',
        desc: '那笔「待勘」，他重核了三遍——改判：不结。',
        minAffection: 55, trigger: { random: 1.0 }, cooldown: 0, flag: 'song_e_reconcile_done',
        requireRivalRomance: true, requireEventDone: 'song_event_rival',
        scenes: [
            { speaker: 'narrator', text: '深夜执法堂，灯还亮着。你上山——逵佩南在案后核卷，案角那页「待勘」还在，边角压得平平整整，看得出被人展开过、又折上过许多回。听见你的脚步，他没抬头，把案边一盏茶推过来——滤过两遍的茶，温着。', type: 'description' },
            { speaker: 'npc', text: '「你又来了。」他把手里的卷宗归档，归得一丝不苟，才开口，「那笔『待勘』，这个月我重核了三遍。结论一样：失态，条文里没有。」他抬眼看你，目光沉静，沉静里有真东西，「不一样的是——头一遍核完，我想结案。第三遍核完，不想。」' },
            { speaker: 'npc', text: '他把那页纸翻过来，背面是新研的墨，笔搁在砚上。「执法堂的灯夜夜亮。」他说得一字是一字，「你愿意来灯下坐——就一直亮着。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「灯下我坐。往后我只上你嵩山。」', effect: 'only', affection: 10 },
                { text: '「灯下我坐。但有些事，我做不到了。」', effect: 'honest', affection: 4 },
                { text: '什么都不说，替那盏灯添了油，陪他核卷到天亮', effect: 'silent', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            if (!rival) return { affection: 0, msg: '（无人可论交——你已无他情。）' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'only':
                    aff = dao ? -2 : 10;
                    msg = dao
                        ? '他执笔的手停了半息。「只上嵩山？」他核了一遍这四个字，极轻微地笑了一下——那种不加批注的笑，「你道侣'+rival.name+'，怕是要问的。」他还是把茶又推近半寸，「案侧的座给你。但只做灯下客——你来，别说得满。」'
                        : '他怔了怔，提笔，在那页「待勘」背面落了四个字，写完推给你看——「改判：不结」。「执法堂改判要有实据。」他把笔搁下，耳廓微红，神色却前所未有地清楚，「实据在灯下坐着。往后这一案，两个人核。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 8);
                    break;
                case 'honest':
                    aff = dao ? 2 : 4;
                    msg = dao
                        ? '他点头，语气平得像念条文：「'+rival.name+'既是你道侣，你做不到的，我查过条令——查得到出处。」他把案侧的椅子挪近半尺，「执法堂不收道侣，只收灯下同坐的人。你来，我留座。」'
                        : '「老实。」他把这两个字入卷，又取过一页新纸摊平，「做不到的，慢慢来。条文可以修，判词可以补——」他看了你一眼，学得极慢的幽默又露了半句，「灯先别灭。灭了我摸黑核卷，判错要算我的。」';
                    break;
                case 'silent':
                    aff = 6;
                    msg = '你替灯添了油，在他案侧坐下，什么也不说。他递卷，你掌灯，堂里只有纸页翻动的声音。五更天最后一册归架，他吹灯前忽然开口：「往年今夜，核完档我总要坐一会儿——不是累，是空。」黑暗里他的声音低了半度，「今年没空。不说话也好。说了话，就要入卷——你我这一案，入哪一卷，我都舍不得。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 桑拾玖：粥棚收摊后，销不了的那一支签，重新插回墙上（v20.76 入册） ----
    'gai_event_reconcile': {
        id: 'gai_event_reconcile', npcId: 'sect_leader_丐帮', title: '销不掉的签', icon: '🍵',
        desc: '他说销了案的那条——他没销掉。',
        minAffection: 55, trigger: { random: 1.0 }, cooldown: 0, flag: 'gai_e_reconcile_done',
        requireRivalRomance: true, requireEventDone: 'gai_event_rival',
        scenes: [
            { speaker: 'narrator', text: '城南沙粥棚，散了场。帮里弟兄说，对峙那夜之后，桑长老的书照讲，关窍照巧，只是不再往棚柱左边第三个位子上看了。今日你到时，他正在收摊，见你来，手里两只碗摞到一半——停了。', type: 'description' },
            { speaker: 'npc', text: '「你又来了。」他把半碗粥推过来，粥温着，豁口冲着他自个儿，「讯房的规矩，销了案的不再提。我上回说，那条我自个儿销了。」他笑了笑，笑得比讲书时淡，「销不掉。签拔出来又插回去，插回去又拔出来——竹签墙十二年，头一支销不掉的。」' },
            { speaker: 'npc', text: '他把碗呷了一口，望着棚外的灯火：「讲别人的故事眉飞色舞，讲自个儿的收住。」他转过头看你，「这一回不收。你愿意听——说书人的位子，一直给你留着。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「往后你的书，我一场不落。」', effect: 'only', affection: 10 },
                { text: '「书我听。但有些事，我做不到了。」', effect: 'honest', affection: 4 },
                { text: '什么都不说，把那半碗粥喝净，陪他收摊到灯尽', effect: 'silent', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            if (!rival) return { affection: 0, msg: '（无人可论交——你已无他情。）' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'only':
                    aff = dao ? -2 : 10;
                    msg = dao
                        ? '他端碗的手停了半息，随即笑了笑，这回的笑到了眼底一半：「一场不落？你道侣'+rival.name+'，怕是要问的。」他还是把粥又给你添了半勺，「位子给你留。但只做粥棚的听客——你来，别说得满。」'
                        : '他怔了怔，低头笑出了声——讯房长老不设防的笑，原先只对着湖水有过。「好。」他转身朝粥棚里喊了一嗓子，「老师傅，往里头一碗粥，盛两份——一份讯房，一份棚柱左边第三个位子。」他回身坐下，眉飞色舞回来了，耳根却红着，「这一场书，从头讲。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 8);
                    break;
                case 'honest':
                    aff = dao ? 2 : 4;
                    msg = dao
                        ? '他点头，语气平得像核签：「'+rival.name+'既是你道侣，你做不到的，我懂。」他把粥碗往你手边推了推，「说书不伤人。你来，条凳上总留一个位——只一个位。多的，我讲给湖水听。」'
                        : '他「唔」了一声，给你把粥续上：「老实。来路齐。」他把碗搁下，「做不到的，慢慢来。书先听——这一段，我没销。讯房的人记性好，销不掉的，就留着慢慢讲。」';
                    break;
                case 'silent':
                    aff = 6;
                    msg = '你把那半碗粥喝净，陪他收摊，一句话没说。他涮碗，你抹案；两只豁口碗摞在一处，他把其中一只塞进你手里：「碗拿着。豁口的碗不漏——漏的是端碗的人，端稳了就成。」收完摊，两人一前一后往回走，走到岔路口，他忽然开口，声音散在夜风里：「往后我册子里的事——你头一个听。这一条不入册。入册的要核，这一条，免核。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 聂明泽：档房灯前，「并案？」批注刮净，新落一笔「命格：未定——复核人：本人」（v20.77 入册） ----
    'yan_event_reconcile': {
        id: 'yan_event_reconcile', npcId: 'sect_leader_阎罗殿', title: '改档', icon: '🍵',
        desc: '那页「并案？」的批注，他用刀笔刮掉了——重新落了一笔。',
        minAffection: 55, trigger: { random: 1.0 }, cooldown: 0, flag: 'yan_e_reconcile_done',
        requireRivalRomance: true, requireEventDone: 'yan_event_rival',
        scenes: [
            { speaker: 'narrator', text: '掌灯前的档房。你上山——聂明泽在案后坐着，案角那页档还在，边角压得平平整整，看得出被人展开过、又折上过许多回。「并案？」两个字的批注被刀笔刮掉了，刮得很净，纸面上只留一层浅痕。听见你的脚步，他没抬头，先把手里的档归了格，才把案边一盏热水推过来——档房没有茶，只有他自烧的热水。', type: 'description' },
            { speaker: 'npc', text: '「你又来了。」他把那页档摊平给你看：页首新落了一笔朱字，又短又平，一字是一字——「命格：未定——复核人：本人」。「这一页，这个月我复核了三遍。」他抬眼看你，目光沉静，沉静里有真东西，「头一遍核完，我想销案。第三遍核完——不想。」' },
            { speaker: 'npc', text: '他把朱笔的笔帽揭开，搁在笔山边上，帽口朝着灯。「档房的灯，夜夜点。」他说得又短又平，「你愿意来灯下坐——甲字一号格，就一直有你一页。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「灯下我坐。往后我只上你阎罗殿。」', effect: 'only', affection: 10 },
                { text: '「灯下我坐。但有些事，我做不到了。」', effect: 'honest', affection: 4 },
                { text: '什么都不说，替他烧上水，陪他归档到灯尽', effect: 'silent', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            if (!rival) return { affection: 0, msg: '（无人可论交——你已无他情。）' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'only':
                    aff = dao ? -2 : 10;
                    msg = dao
                        ? '他执笔的手停了半息。「只上阎罗殿？」他把这四个字核了一遍，极短地笑了一声，像纸页落格，「你道侣'+rival.name+'，怕是要问的。」他还是把那盏热水往你手边推近半寸，「灯下的座给你。但只做殿中客——你来，别说得满。」'
                        : '他怔了怔，提朱笔，在「复核人：本人」底下又添了一行极小的字，添完推给你看——「此档，双人核。永久。」耳根红着，执笔的手却稳，「双人核，要有实据。」他把笔搁下，「实据在灯下坐着。往后这一案，两个人核。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 8);
                    break;
                case 'honest':
                    aff = dao ? 2 : 4;
                    msg = dao
                        ? '他点头，把朱笔帽扣回去，又揭开，动作像把什么归了格又取出来：「'+rival.name+'既是你道侣，你做不到的，我查过档规——查得到出处：不可抗力，不追。」他把案侧的小凳挪近半尺，「档房不收道侣，收来核档的人。你来，我留座——灯最近的那一个。」'
                        : '「老实。」他把这两个字入册，又取过一页新纸摊平，「做不到的，慢慢来。档可以改，批注可以补——」他看了你一眼，学得极慢的幽默又露了半句，「只是别改你名字那一页。那一页动一动，我就要多核四百遍。」';
                    break;
                case 'silent':
                    aff = 6;
                    msg = '你替他烧上水，在案侧坐下，什么也不说。他核档，你看火，千架之间只有纸页翻动的声音。五更天最后一册归格，他吹灯前忽然开口：「往年今夜，归完格我要一个人坐一会儿。不是累。是空。」黑暗里他的声音低了半格，「今年没空。不说话也好。说了话，就要入档——你我这一案归哪一格，档规里没有。我想了半年，想自己新立一格。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 雷惊蛰：药坊焙房前，受潮批注底下添了新行，引信量回样尺（v20.78 入册） ----
    'pi_event_reconcile': {
        id: 'pi_event_reconcile', npcId: 'sect_leader_霹雳堂', title: '批注重写', icon: '🍵',
        desc: '「人也受潮」那条批注底下，他添了一行新的——墨迹很亮。',
        minAffection: 55, trigger: { random: 1.0 }, cooldown: 0, flag: 'pi_e_reconcile_done',
        requireRivalRomance: true, requireEventDone: 'pi_event_rival',
        scenes: [
            { speaker: 'narrator', text: '你上霹雳堂，药坊的门开着。雷惊蛰在案前焙药，一簸一簸翻着。见你来，翻药的手停了，案上的炭笔滚了半圈。方子册摊着，摊在批注那页——「是日，硝受潮。人也受潮。」底下添了一行新墨，墨迹很亮：「是日，天晴。药入焙房，翻了一簸。」焙房边上晾着一把引信，根根量到样尺的长短，一根不短。', type: 'description' },
            { speaker: 'npc', text: '「你又来了。」他的声音还是轻，可比上回松了半格，「那条批注，我重新称了三遍。头一遍称完，想锁册子。第三遍称完——不想。」他把方子册往你那边推了半寸，「药受潮，晒得回来，方子册的规矩里有。人受潮，规矩里没有。我新立了一条。」' },
            { speaker: 'npc', text: '他从防火布囊里取出一个小纸包，打开——一撮焙好的硝，白的，干的。「焙房出来的头一簸。」他把纸包搁在你手心，替你合上手指，耳根红着，话更轻了，「药坊的灯夜夜点。你愿意来灯下坐——样尺的位子，一直给你留着。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「灯下我坐。往后我只上你霹雳堂。」', effect: 'only', affection: 10 },
                { text: '「灯下我坐。但有些事，我做不到了。」', effect: 'honest', affection: 4 },
                { text: '什么都不说，拿起样尺，陪他把那把引信一根根量完', effect: 'silent', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            if (!rival) return { affection: 0, msg: '（无人可论交——你已无他情。）' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'only':
                    aff = dao ? -2 : 10;
                    msg = dao
                        ? '他捏纸包的手停了半息。「只上霹雳堂？」他把这五个字过了一遍秤，称得很慢，「你道侣'+rival.name+'，怕是要问的。」他还是把那包硝按实到你手里，「案边的位给你。但只做配药的伴——你来，别说得满。」'
                        : '他怔了怔，炭笔从手里落到案上，滚了半圈，他没去捡。「……好。」他翻开方子册新的一页，蘸了炭笔——头一回不写批注，写方子，写完转过来给你看：「硝六硫四，炭取陈柳。是日，批注双人核。」耳根红透，手却稳，「双人核，要有实据。」他把笔搁下，「实据在灯下坐着。往后这一册，两个人写。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 8);
                    break;
                case 'honest':
                    aff = dao ? 2 : 4;
                    msg = dao
                        ? '他点头，把纸包收回布囊，收得很轻：「'+rival.name+'既是你道侣，你做不到的，我查了册规——册规没有这一条。没有的，不问。」他把案边的小凳往你这边挪了半尺，「药坊不收道侣，收配药的伴。你来，我留位——离灯最近的那一个。」'
                        : '「老实。」他把这两个字入了册，又取过一页新纸摊平，「做不到的，慢慢来。药可以重焙，批注可以补——」他看了你一眼，学得极慢的幽默又露了半句，「只是别再让人受潮。受潮一回，焙回来，要三倍的日子。」';
                    break;
                case 'silent':
                    aff = 6;
                    msg = '你没说话，拿起样尺，在案边坐下，陪他把那把引信一根根量完。他扎，你量，药坊里只有样尺磕着案沿的轻响和炭笔走纸的沙沙声。五更天最后一根扎完，他忽然开口：「往年今夜，焙完药我总要一个人坐一会儿。不是累——是潮。」黑暗里他的声音低了半格，「今年不潮。不说话也好。说了话，就要进册子——你我这一条归到哪一页，格式里没有。我想了半个月，想新立一个格式。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 宓书言：万卷楼灯下，「讹」字那页重校三遍，新校记「非讹」（v20.78 入册） ----
    'shu_event_reconcile': {
        id: 'shu_event_reconcile', npcId: 'sect_leader_天书阁', title: '重校', icon: '🍵',
        desc: '那页划掉「讹」改「存疑」的纸——他重校了三遍，出了新校记。',
        minAffection: 55, trigger: { random: 1.0 }, cooldown: 0, flag: 'shu_e_reconcile_done',
        requireRivalRomance: true, requireEventDone: 'shu_event_rival',
        scenes: [
            { speaker: 'narrator', text: '你上云台山，万卷楼顶层的灯还亮着。那页被笔尖戳破的竹纸压在案角，破角用一小方纸闷润裱平了，裱工极细，一看就是下了真功夫的。纸上「讹」字划掉了，划痕旁边一条新校记：「重校三遍。结论：非讹。」宓书言坐在案后，听见你的脚步没抬头，先把一方温着的砚推过来——墨是新研的，浓淡正好。', type: 'description' },
            { speaker: 'npc', text: '「你又来了。」他把校笔搁下，「那页纸，这个月我重校了三遍。头一遍，结论：讹，当圈。第二遍：讹，存疑。第三遍——」他抬眼看你，目光平平的，平里有真东西，「非讹。字没有错。是人吓着了。」' },
            { speaker: 'npc', text: '他从签筒里抽出一张空白的竹纸签，搁在砚台边，签面朝上。「批语不过四。」他说得又快又平，「这一张，空着。写什么——你定。」他顿了顿，声音低了半格，「万卷楼的灯夜夜点。你愿意来灯下坐——对面校书的位子，一直给你留着。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「灯下我坐。往后我只上你天书阁。」', effect: 'only', affection: 10 },
                { text: '「灯下我坐。但有些事，我做不到了。」', effect: 'honest', affection: 4 },
                { text: '什么都不说，拿起那张空白签，替他研墨，陪他校卷到天亮', effect: 'silent', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            if (!rival) return { affection: 0, msg: '（无人可论交——你已无他情。）' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'only':
                    aff = dao ? -2 : 10;
                    msg = dao
                        ? '他执笔的手停了半息。「只上天书阁？」他把这四个字校了一遍，极短地笑了一声，像纸页落进格里，「你道侣'+rival.name+'，怕是要问的。」他还是把签筒往你手边推了推，「灯下的位给你。但只做对校的伴——你来，别说得满。」'
                        : '他怔了怔，提笔，在那张空白签上落了四个字，写完按进你掌心——「同押收存。」耳根红着，执笔的手却稳，「同押收存，要有实据。」他把笔搁下，对齐砚边，「实据在灯下坐着。往后这一签，两个人核。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 8);
                    break;
                case 'honest':
                    aff = dao ? 2 : 4;
                    msg = dao
                        ? '他点头，把笔搁回笔架，又拿起来，动作像把什么归了格又取出来：「'+rival.name+'既是你道侣，你做不到的，我查过阁规——查得到出处：疑者阙之，不强校。」他把案对面那张小凳挪近半尺，「万卷楼不收道侣，收对校的人。你来，我留位——离灯最近的那一个。」'
                        : '「老实。」他把这两个字入了校记，又取过一页新纸摊平，「做不到的，慢慢来。字可以重校，签可以补——」他看了你一眼，学得极慢的幽默又露了半句，「只是别再戳破我的页角。页角破了，裱起来，很费工夫。」';
                    break;
                case 'silent':
                    aff = 6;
                    msg = '你拿起那张空白签，蘸他研的墨，却没有写字——把签搁回筒边，替他掌起灯，在校书对面坐下。他校卷，你添墨，四壁书墙之间只有纸页翻动的声音。五更天他搁笔，忽然开口：「往年今夜，校完卷我要一个人坐一会儿。不是累——是独。」黑暗里他的声音低了半格，「今年不独。不说话也好。说了话，就要入校记——校记不录人。你我这一条，我想了半年，想把它放进卷尾。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 隗九爻：食摊街口，新签数出「剩两颗」，签头那颗重新留起（v20.78 入册） ----
    'dy_event_reconcile': {
        id: 'dy_event_reconcile', npcId: 'sect_leader_大隐阁', title: '剩两颗', icon: '🍵',
        desc: '他买了串新糖葫芦，数给你——剩两颗，双数，吉。',
        minAffection: 55, trigger: { random: 1.0 }, cooldown: 0, flag: 'dy_e_reconcile_done',
        requireRivalRomance: true, requireEventDone: 'dy_event_rival',
        scenes: [
            { speaker: 'narrator', text: '你到食摊街口——红布幌子重新挂起来了，隗九爻坐在老位置上，手里一串新糖葫芦，一颗没动。见你来，他把签子举平，一颗一颗数，数得很慢，数完报给满街听：「剩两颗。」摊主们的耳朵全竖起来了。他啧了一声，破天荒自己把下半句接完：「双数为吉。吉在——有人来。」', type: 'description' },
            { speaker: 'npc', text: '「你又来了。」他把签子搁下，从袖子里摸出那根老竹签给你看——签头光着，那颗风干的山楂没了，签头上留着一圈浅浅的印子。「三卦大凶，我重新起了三遍。」他把老签转了半圈，「头一遍起完，想收摊。第三遍起完——不想。卦是假的，想收摊是真的。」' },
            { speaker: 'npc', text: '他把新签上两颗山楂里的一颗拔下来，捏在指间，没吃，朝你举了举：「这颗，从今日起重新留着。」他慢悠悠说，「留给下半句——这一句的下半句，我不猜了，直接说：你愿意来幌子底下坐，街口这个位置，两个座。」他往长凳上拍了拍半个座宽，「灯天天点。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「我坐。往后我只赶你这条街的集。」', effect: 'only', affection: 10 },
                { text: '「我坐。但有些事，我做不到了。」', effect: 'honest', affection: 4 },
                { text: '什么都不说，坐进那半个座，陪他把一碗豆花吃完', effect: 'silent', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            if (!rival) return { affection: 0, msg: '（无人可论交——你已无他情。）' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'only':
                    aff = dao ? -2 : 10;
                    msg = dao
                        ? '他捏山楂的手停了半息，随即笑了，这回的笑到眼底一半：「只赶这条街的集？你道侣'+rival.name+'，怕是要问的。」他还是把那颗山楂摆在你面前，「座给你。但只做街口的客——你来，别说得满。」'
                        : '他怔了怔，把那颗山楂收回，扔进自己嘴里，嚼得嘎嘣响：「好。」嚼完他冲糖葫芦婶子的摊子扬声喊了一嗓子，中气足得半条街都听见：「婶子——往后我这一摊的账，记两个名字。利息，我付。」他坐回来，耳朵红着，慢条斯理补完下半句：「这一卦的下半句，我自己说了：宜，长久。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 8);
                    break;
                case 'honest':
                    aff = dao ? 2 : 4;
                    msg = dao
                        ? '他点头，语气慢条斯理得像数签子：「'+rival.name+'既是你道侣，你做不到的，我懂。」他把那碗豆花往你那边推了半寸，「起卦不伤人。你来，幌子底下总留半个座——只半个。多的，我欠给这条街。」'
                        : '「老实。」他把这两个字评了一遍，捻起一颗山楂扔进嘴里，「老实这一味，吉。」他嚼完，把签子往你手边一搁，「做不到的，慢慢来。卦先起——大凶是大凶，大凶也得先把这颗吃了。吃完了，慢慢消化。」';
                    break;
                case 'silent':
                    aff = 6;
                    msg = '你没说话，坐进那半个座。糖葫芦婶子端来两碗豆花，他推一碗给你，两个人吃完，他付账——头一回没记在欠账上，摸出实钱，数得很慢，摊主们全看见了。他抹抹嘴，忽然扬声对满街说：「都听着——街口这个位置，两个座，往后天天摆。」说完坐回来，声音压得只剩你听得见：「往年收摊，我一个人坐一会儿。不是饱——是空。今年不空。不说话也好。说的话，得是全乎话——全乎话这条街上我只对一个人说过。你我这一卦落在哪根签上，我想了半个月：就落老签头上。签头空着，正好，留给往后的那颗。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 简知忆：东院档房灯下，销毁的三页附页重写装订回档里（v20.78 入册） ----
    'yin_event_reconcile': {
        id: 'yin_event_reconcile', npcId: 'sect_leader_侠隐阁', title: '附页重装', icon: '🍵',
        desc: '销毁的那三页附页——他重写了一遍，装订回档里，这回没销毁。',
        minAffection: 55, trigger: { random: 1.0 }, cooldown: 0, flag: 'yin_e_reconcile_done',
        requireRivalRomance: true, requireEventDone: 'yin_event_rival',
        scenes: [
            { speaker: 'narrator', text: '你到侠隐阁东院档房——灯还亮着。那份「危险程度：高」的档压在案角，页角压得平平整整，看得出被人展开过、又合上过许多回。档厚了一截：后头新装订了三页附页，装订的线脚极细。简知忆坐在案后，听见你的脚步没抬头，先把档笔搁回笔架，才把案边一盏温茶推过来。', type: 'description' },
            { speaker: 'npc', text: '「你又来了。」他把那份档转过来给你看：危险程度栏那个「高」字旁边，添了一条极小的批注：「修正：非高。是没数。」他抬眼看你，目光平平，平里有真东西，「附页三页，销毁了三页。这个月我重写了一遍。写完没销毁——装订了。」' },
            { speaker: 'npc', text: '他把附页翻开一半给你看，半页密密麻麻全是小字，写到了什么，他用手掌盖住，只露出最末一行的日期。「档房的灯夜夜点。」他批注腔说得极平，平得刻意，「你愿意来灯下坐——案这边的小凳，一直在。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「灯下我坐。往后我只来你侠隐阁。」', effect: 'only', affection: 10 },
                { text: '「灯下我坐。但有些事，我做不到了。」', effect: 'honest', affection: 4 },
                { text: '什么都不说，替他把灯挑亮，陪他核档到天亮', effect: 'silent', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            if (!rival) return { affection: 0, msg: '（无人可论交——你已无他情。）' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'only':
                    aff = dao ? -2 : 10;
                    msg = dao
                        ? '他执档笔的手停了半息。「只来侠隐阁？」他把这四个字批注了一遍，极短地笑了一声，那一声笑没归档，「你道侣'+rival.name+'，怕是要问的。」他还是把那份档往你那边推了半寸，「案侧的座给你。但只做核档的伴——你来，别说得满。」'
                        : '他怔了怔，提起档笔，在附页最末一行添了一条批注，添完转过来给你看——「此档，双人核。永久。」耳根红着，执笔的手却稳，「双人核，要有实据。」他把笔搁下，「实据在灯下坐着。往后这一档，两个人批。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 8);
                    break;
                case 'honest':
                    aff = dao ? 2 : 4;
                    msg = dao
                        ? '他点头，把档笔搁回笔架，又拿出来，动作像把什么归了架又取出来：「'+rival.name+'既是你道侣，你做不到的，我查过阁规——查得到出处：存疑，不究。」他把案侧的小凳挪近半尺，「档房不收道侣，收核档的人。你来，我留座——离灯最近的那一个。」'
                        : '「老实。」他把这两个字入了档，又取过一页新附页摊平，「做不到的，慢慢来。档可以改，批注可以补——」他看了你一眼，学得极慢的幽默又露了半句，「只是别再让我销毁附页。销毁的页，纸屑要我自己扫。」';
                    break;
                case 'silent':
                    aff = 6;
                    msg = '你替他把灯挑亮，在案侧坐下，什么也不说。他核档，你递卷，档房里只有纸页翻动和笔尖走纸的声音。五更天最后一册归架，他搁下笔，忽然开口：「往年今夜，核完档我要一个人坐一会儿。不是累——是空白。」黑暗里他的声音低了半格，「我那一页档，空了半辈子。今年不空了。不说话也好。说了话，就要入档——你我这一条归到哪一架，格式里没有。我想了半年，想新立一个档名。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 狄长亭：总驿文书案前，多算三站的路引重写，里程一里一里对齐（v20.78 入册） ----
    'ty_event_reconcile': {
        id: 'ty_event_reconcile', npcId: 'sect_leader_天涯海阁', title: '里程改实', icon: '🍵',
        desc: '那张多算三站的路引他重写了——里程对齐了，批注栏留给你批。',
        minAffection: 55, trigger: { random: 1.0 }, cooldown: 0, flag: 'ty_e_reconcile_done',
        requireRivalRomance: true, requireEventDone: 'ty_event_rival',
        scenes: [
            { speaker: 'narrator', text: '你到江陵总驿——文书案的灯挑到五分亮。狄长亭在案后重装路引存根，听见你的脚步，手里的小刷子停了半息，没抬头，先把案边一盏热水推过来。案上摊着一纸新写的路引：去向栏、里程栏，一里一里都对得齐平，一笔不多。只有批注栏空着，笔搁在砚边，像等人批。', type: 'description' },
            { speaker: 'npc', text: '「你又来了。」他把那纸新引往你这边摆正，声音又轻又软：「多算三站的那一纸，我重新核了三遍。头一遍核完，想作废。第三遍核完——不想。」他顿了顿，公文腔，一字端正，「里程改实了。多算的三站，不是误。不是误——是不入公文。」' },
            { speaker: 'npc', text: '他把那支笔拿起来，双手笔杆朝你递过来，递的姿势像呈一纸等批的公文：「批注栏，留给你。」耳根微红，话却说得稳，「总驿的灯夜夜点。你愿意来灯下坐——文书案边这把椅子，一直是你的。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '接笔，在批注栏里写下两个字：「滞留。」——「往后我只来你天涯海阁。」', effect: 'only', affection: 10 },
                { text: '接笔：「批注我批。但有些事，我做不到了。」', effect: 'honest', affection: 4 },
                { text: '什么都不说，把笔放回他手里，陪他重装存根到驿灯熄', effect: 'silent', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            if (!rival) return { affection: 0, msg: '（无人可论交——你已无他情。）' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'only':
                    aff = dao ? -2 : 10;
                    msg = dao
                        ? '他接笔的手停了半息。「只来天涯海阁？」他把这五个字核了一遍，极轻地笑了一声，那一声笑没入存根，「你道侣'+rival.name+'，怕是要问的。」他还是把那盏热水又给你续温了些，「案边的座给你。但只做站中的客——你来，别说得满。」'
                        : '他看你写下「滞留」两个字，怔了怔，接笔的手停在半空，耳根一寸一寸红上来——那两个字他核了三遍，核完把路引仔细折好，收进贴胸衣襟，和那半枚铜符收在一处。「驿制：去向既定，引即生效。」他声音软软的，尾音松了，「生效——就不滞留了。往后这一纸，两个人批。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 8);
                    break;
                case 'honest':
                    aff = dao ? 2 : 4;
                    msg = dao
                        ? '他点头，把笔收回砚上，又拿起来：「'+rival.name+'既是你道侣，你做不到的，我查过驿制——查得到出处：路况有变，不追。」他把案边的椅子挪近半尺，「总驿不收道侣，收滞留的客。你来，我留座——离灯最近的那一把。」'
                        : '「老实。」他把这两个字批进了存根，又铺平一页新存根纸，「做不到的，慢慢来。路引可以重写，批注可以补——」他看了你一眼，话说得软软的，却露了半句学得极慢的幽默，「只是别再让我写『不利』。写一回『不利』，驿门的灯就要多挑一回亮——灯油，很贵的。」';
                    break;
                case 'silent':
                    aff = 6;
                    msg = '你把笔放回他手里，什么也不说，在案边坐下陪他重装存根。他扫灰，你压页，驿灯底下只有纸页的沙沙声和很远处的蹄声。五更天最后一册存根装订完，他放下小刷子，忽然开口：「往年今夜，装完存根我要一个人坐一会儿。不是累——是听。」黑暗里他的声音更软了，「听驿路上的蹄声。听了十年，没有一双在我门口停。今年不用听了。不说话也好。说了话，就要入存根——你我这一程宿在哪一站，格式里没有这一栏。我想了半年，想新立一栏。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 樊惊筹：旗房灯下，加固针没拆，线头全收进了夹层（v20.78 入册） ----
    'dq_event_reconcile': {
        id: 'dq_event_reconcile', npcId: 'sect_leader_大旗门', title: '线头收了', icon: '🍵',
        desc: '那排加固针他没拆——线头全收进了夹层，不硌手了。',
        minAffection: 55, trigger: { random: 1.0 }, cooldown: 0, flag: 'dq_e_reconcile_done',
        requireRivalRomance: true, requireEventDone: 'dq_event_rival',
        scenes: [
            { speaker: 'narrator', text: '你到大旗门旗房——灯亮着。樊惊筹在灯下做针线，手里是你的护腕，那排加固针还在，一道没少。见你来，他没抬头，走完一针，把内衬上所有线头一根一根收进夹层——收得很慢，很实。案角铁皮针线盒开着，盒盖内侧那张刻格对着灯。', type: 'description' },
            { speaker: 'npc', text: '「你又来了。」他把护腕往你腕上套，收带，动作还是军令一样，只是比上回慢了半拍。「针，没拆。」他说。顿了顿，破天荒多说了整整一句：「线头收了。不硌手了。」' },
            { speaker: 'npc', text: '他把铁皮针线盒往你那边推了半寸，盒盖内侧的刻格在灯里发亮。「旗房的灯，夜夜点。」他的话还是短，可一句是一句，落地砸坑，「你愿意来灯下坐——案边这个位置，我给你留着。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '戴上护腕，在案边坐下：「往后我只来你大旗门。」', effect: 'only', affection: 10 },
                { text: '戴上护腕：「灯下我坐。但有些事，我做不到了。」', effect: 'honest', affection: 4 },
                { text: '什么都不说，从盒里拣出一束线，陪他缝旗到灯尽', effect: 'silent', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            if (!rival) return { affection: 0, msg: '（无人可论交——你已无他情。）' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'only':
                    aff = dao ? -2 : 10;
                    msg = dao
                        ? '他收带的手停了半息。「只来大旗门？」他把这五个字核了一遍，核得极慢，「你道侣'+rival.name+'，怕是要问的。」他还是把你的护腕带子正了正，「案边的座给你。但只做灯下的客——你来，别说得满。」'
                        : '他怔了怔，低头看自己的手——那双扛了二十六年旗杆、缝了六年暗针的手，此刻不知往哪儿放。最后他拿起针，穿了线，把针递到你手里，耳朵红透，话更短了：「教你。头一针。」顿了顿，又补三个字，「别扎手。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 8);
                    break;
                case 'honest':
                    aff = dao ? 2 : 4;
                    msg = dao
                        ? '他点头，把针收回盒里：「'+rival.name+'既是你道侣，你做不到的，我懂。」他把护腕又往你腕上按实半寸，「针线不伤人。你来，旗房总留一个座——只一个座。多的，我留给旗。」'
                        : '「老实。」他把这两个字评了一遍，点头，点得很实，「兵的德。」他重新穿针，「做不到的，慢慢来。针脚先密着——密的我缝，松的你收。两个人的针脚，花不了。」';
                    break;
                case 'silent':
                    aff = 6;
                    msg = '你拣出一束线，在案边坐下，什么也不说。他缝旗，你递线，旗房里只有针穿过布的声音和远处巡夜更夫的梆子。五更天他咬断一个线头，忽然开口：「往年今夜，缝完我要一个人坐一会儿。不是累——是攥。」黑暗里他的声音比平日还平，「攥着点东西，不知给谁。今年给了。不说话也好。说了话，就是军令——军令，你和我之间，我想了半个月，一条都发不出来。发不出来的，缝了。都在针脚里，你自己摸。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    }
};

if (typeof NPC_PERSONAL_EVENTS !== 'undefined') {
    Object.assign(NPC_PERSONAL_EVENTS, MALE_RECONCILE_EVENTS);
}

// 每日钩子：男主门派 + 吃醋已发生 + 好感≥55 + 仍有情敌 + 未和好 → 触发
if (typeof window !== 'undefined' && window.timeSystem && window.timeSystem.onNewDaySubscribe) {
    window.timeSystem.onNewDaySubscribe(function() {
        try {
            if (!window.currentCharData || !window.npcManager) return;
            if (typeof window.MALE_LEAD_ROSTER === 'undefined') return;
            var loc = window.currentCharData.location || '';
            var roster = window.MALE_LEAD_ROSTER || [];
            for (var i = 0; i < roster.length; i++) {
                var h = roster[i];
                if (!h || h.sect !== loc) continue;
                var rivalId = h.id === 'sect_leader_铸剑山庄' ? 'lu_event_rival'
                    : h.id === 'sect_leader_药王谷' ? 'su_event_rival'
                    : h.id === 'sect_leader_茅山派' ? 'ms_event_rival'
                    : h.id === 'sect_leader_金刚宗' ? 'jg_event_rival'
                    : h.id === 'sect_leader_华山派' ? 'hs_event_rival'
                    : h.id === 'sect_leader_武当派' ? 'wd_event_rival'
                    : h.id === 'sect_leader_逍遥派' ? 'xy_event_rival'
                    : h.id === 'sect_leader_嵩山派' ? 'song_event_rival'
                    : h.id === 'sect_leader_丐帮' ? 'gai_event_rival'
                    : h.id === 'sect_leader_阎罗殿' ? 'yan_event_rival'
                    : h.id === 'sect_leader_霹雳堂' ? 'pi_event_rival'
                    : h.id === 'sect_leader_天书阁' ? 'shu_event_rival'
                    : h.id === 'sect_leader_大隐阁' ? 'dy_event_rival'
                    : h.id === 'sect_leader_侠隐阁' ? 'yin_event_rival'
                    : h.id === 'sect_leader_天涯海阁' ? 'ty_event_rival'
                    : h.id === 'sect_leader_大旗门' ? 'dq_event_rival' : null;
                var reconId = h.id === 'sect_leader_铸剑山庄' ? 'lu_event_reconcile'
                    : h.id === 'sect_leader_药王谷' ? 'su_event_reconcile'
                    : h.id === 'sect_leader_茅山派' ? 'ms_event_reconcile'
                    : h.id === 'sect_leader_金刚宗' ? 'jg_event_reconcile'
                    : h.id === 'sect_leader_华山派' ? 'hs_event_reconcile'
                    : h.id === 'sect_leader_武当派' ? 'wd_event_reconcile'
                    : h.id === 'sect_leader_逍遥派' ? 'xy_event_reconcile'
                    : h.id === 'sect_leader_嵩山派' ? 'song_event_reconcile'
                    : h.id === 'sect_leader_丐帮' ? 'gai_event_reconcile'
                    : h.id === 'sect_leader_阎罗殿' ? 'yan_event_reconcile'
                    : h.id === 'sect_leader_霹雳堂' ? 'pi_event_reconcile'
                    : h.id === 'sect_leader_天书阁' ? 'shu_event_reconcile'
                    : h.id === 'sect_leader_大隐阁' ? 'dy_event_reconcile'
                    : h.id === 'sect_leader_侠隐阁' ? 'yin_event_reconcile'
                    : h.id === 'sect_leader_天涯海阁' ? 'ty_event_reconcile'
                    : h.id === 'sect_leader_大旗门' ? 'dq_event_reconcile' : null;
                if (!rivalId || !reconId) continue;
                var npc = window.npcManager.getNPC ? window.npcManager.getNPC(h.id) : null;
                if (!npc) continue;
                var aff = (npc.relationship && npc.relationship.affection) || 0;
                if (aff < 55) continue;
                if (typeof hasEventTriggered === 'function' && !hasEventTriggered(rivalId)) continue; // 吃醋须已发生
                if (typeof hasEventTriggered === 'function' && hasEventTriggered(reconId)) continue; // 未和好
                if (typeof window.detectRivalRomance !== 'function' || !window.detectRivalRomance(h.id)) continue;
                var ev = NPC_PERSONAL_EVENTS[reconId];
                if (!ev) continue;
                if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) continue;
                setTimeout(function(evId, npcInst) {
                    if (document.querySelector && document.querySelector('.personal-event-modal')) return;
                    var ev2 = NPC_PERSONAL_EVENTS[evId];
                    if (!ev2) return;
                    if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev2, npcInst)) return;
                    if (typeof triggerPersonalEvent === 'function') triggerPersonalEvent(evId);
                }.bind(null, reconId, npc), 1200);
            }
        } catch (e) { console.warn('[男性和好] 每日触发失败:', e); }
    });
}

if (typeof window !== 'undefined') window.MALE_RECONCILE_EVENTS = MALE_RECONCILE_EVENTS;
console.log('[男性和好] 男主和好事件加载完成：' + Object.keys(MALE_RECONCILE_EVENTS).length + ' 个');
