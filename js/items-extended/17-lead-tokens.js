// ==================== 17-lead-tokens.js — 主角信物（v20.91 特殊品级） ====================
// 「特殊」是独一份的品级：十六位男主、二十位女主，人手一件信物，天下仅此一枚。
// 不进商铺、不入掉落、不上拍卖（price 0 + UNIQUE 双重挡闸）——只在结为道侣那一刻，
// 由那个人亲手放进你手里（dao-bridge.ensureDaoBond 单一写点发放，按名册认领）。
// 佩戴位统一 acc2（饰品2）：信物贴身，戴的是心意，不是数值。
(function () {
    'use strict';

    function token(id, name, icon, lead, sect, attrs, bonus, desc) {
        return {
            id: id, name: name, type: 'equipment', subtype: 'accessory', slot: 'acc2',
            category: 'equipment', quality: 'UNIQUE', level: 25, price: 0,
            attrs: attrs, defense: 8, combatBonus: bonus,
            armorDurability: 999, weight: 0.1, desc: desc, icon: icon,
            tokenOf: lead, tokenSect: sect, priceless: true
        };
    }

    var LEAD_TOKENS = [
        // ===== 女主信物（20 枚） =====
        token('token_wen_heng', '蘅芷香囊', '🧵', '温蘅', '百花谷',
            { intelligence: 10, willpower: 10 }, { hit: 12, qi_regen: 4 },
            '百花谷谷主亲手缝的香囊，针脚里晾着晒过太阳的蘅芷。「茶要趁热喝，路要平安走。」'),
        token('token_fei_lei', '再折断簪', '💔', '绯泪', '修罗宫',
            { dexterity: 10, willpower: 10 }, { crit: 12, attack: 10 },
            '她的簪子断过一回，为了旧人。认下你那天又断了一截——她把两截都塞进你手里：「断过的东西才认人。它认你了。」'),
        token('token_cheng_ling', '冰心玉珮', '❄️', '琤霄凌', '天山派',
            { intelligence: 12, willpower: 8 }, { block: 12, hit: 8 },
            '天山雪线以上凿的玄冰芯，裹进玉里再也不化。握着它，心口永远是凉的、静的。'),
        token('token_lan_feng', '银铃蛊哨', '🔔', '蓝凤凰', '五仙教',
            { dexterity: 12, constitution: 8 }, { dodge: 10, attack: 10 },
            '五仙教主的银铃，摇三声蛊虫退避。「我的蛊不咬你——它们认得这铃声，也认得你。」'),
        token('token_su_gu', '霜鸣剑穗', '🗡️', '夙孤鸿', '峨眉派',
            { strength: 10, dexterity: 10 }, { attack: 14, crit: 8 },
            '峨眉剑「霜鸣」的旧穗子，她换了新的，旧的给你。「剑穗离了剑还能红——它这辈子只红一次。」'),
        token('token_yan_wan', '袖影机簧', '🎯', '晏万解', '唐门',
            { dexterity: 14, intelligence: 6 }, { crit: 14, hit: 8 },
            '唐门门主拆了自己第一具袖箭送你的机簧。「唐门的东西都带毒，这个不带——这个带心。」'),
        token('token_ying_zhao', '晚照鲛珠', '🌅', '瀛晚照', '蓬莱派',
            { intelligence: 10, constitution: 10 }, { qi_regen: 6, block: 8 },
            '蓬莱海落日时分鲛人泣的珠，一晚上只得一颗。「晚照晚照——最亮的时候，就是舍不得的时候。」'),
        token('token_qi_qing', '清禅念珠', '📿', '祁清禅', '恒山派',
            { willpower: 14, intelligence: 6 }, { block: 14, qi_regen: 4 },
            '恒山师太盘了二十年的念珠，绳换过三回，珠子一颗没少。「佛前许的愿不能说——说了就不灵了。给你，替我说。」'),
        token('token_yue_qing', '晓色玉玦', '🌄', '岳清晓', '泰山派',
            { strength: 8, willpower: 12 }, { attack: 10, hit: 10 },
            '泰山顶第一缕晨光里琢的玉玦。「我在日观峰看了半辈子日出，往后想把身边那个位置留给你。」'),
        token('token_you_cui', '幽篁竹笛', '🎋', '幽翠微', '青城派',
            { intelligence: 12, dexterity: 8 }, { hit: 12, dodge: 8 },
            '青城后山最幽处一竿竹，她凿了七个孔。「笛子要两个人才成曲——我吹上半句，等你接。」'),
        token('token_xi_xiang', '湘竹泪痕扇', '🪭', '奚湘筠', '衡山派',
            { intelligence: 10, willpower: 10 }, { qi_regen: 5, crit: 8 },
            '湘妃竹上斑斑是泪痕，衡山派的扇子却从不哭。「斑是竹子记的。我的心事，扇子替你记着。」'),
        token('token_geng_xue', '一剪雪绸', '🩸', '耿雪衣', '血手门',
            { strength: 10, constitution: 10 }, { attack: 12, block: 10 },
            '血手门主的白衣裁下一角，血洗不掉的门派，偏偏留了一剪最干净的雪绸。「我的衣服只有这一角没沾过血——给你。」'),
        token('token_tuo_yin', '银沙蝎尾针', '🦂', '拓银沙', '飞蝎坞',
            { dexterity: 12, strength: 8 }, { crit: 12, penetrate: 8 },
            '飞蝎坞银沙里养出的蝎尾针，毒她亲手拔净了。「大漠里的东西都带刺——刺我全拔了，剩下的是真心。」'),
        token('token_fu_li', '璃火圣羽', '🔥', '伏璃茵', '烈日教',
            { strength: 10, intelligence: 10 }, { attack: 12, qi_regen: 5 },
            '烈日教圣火台上落过的一根火羽，离了火也不冷。「圣火三百年不熄，我头一回盼它慢点烧——烧慢些，日子就长些。」'),
        token('token_tan_wang', '望舒檀木牌', '🌙', '檀望舒', '天龙教',
            { willpower: 12, constitution: 8 }, { block: 12, qi_regen: 4 },
            '千年檀心刻的月牌，望舒是月，也是她。「天龙教夜里不点灯——有这块牌子在，你就是我的月亮。」'),
        token('token_qi_qiao', '巧机木雀', '🐦', '戚巧机', '神机门',
            { intelligence: 14, dexterity: 6 }, { hit: 12, dodge: 8 },
            '神机门主十八岁做的第一只木雀，上了弦会绕着你飞三圈。「它认主。我拆遍天下机关，拆不动自己这颗心。」'),
        token('token_qiu_shuang', '霜莺铁手环', '⛓️', '裘霜莺', '铁掌帮',
            { strength: 12, constitution: 8 }, { attack: 14, block: 8 },
            '铁掌帮帮主的护腕，加了一排拆不出来的加固针——针脚是给你缝的。「铁打的镯子，头一回戴在帮主以外的人手上。」'),
        token('token_ji_yun', '云锦帕', '🧣', '姬云锦', '昆仑派',
            { intelligence: 10, willpower: 10 }, { qi_regen: 6, hit: 8 },
            '昆仑云锦一寸值一匹绢，这方帕子织了三个月。「锦上的云走得慢——我想让日子也走得慢些。」'),
        token('token_chong_yu', '玉衡星簪', '✨', '翀玉衡', '全真教',
            { intelligence: 12, willpower: 8 }, { crit: 10, qi_regen: 5 },
            '全真教观星台的玉衡星位簪，北斗第五星，主衡平。「我一生替人衡命——唯独你的命格，我算不了，也不想算。」'),
        token('token_zhu_zhao', '照禅菩提坠', '🪵', '竺照禅', '少林寺',
            { constitution: 12, willpower: 8 }, { block: 12, hp_regen: 4 },
            '少林菩提树下一颗自落的子，照禅小师父磨了七七四十九天。「师父说，菩提本无树。可这颗子，实实在在落进了我手里——如今落进你手里。」'),

        // ===== 男主信物（16 枚） =====
        token('token_ye_yan', '铸心砚', '🪨', '冶砚', '铸剑山庄',
            { strength: 10, willpower: 10 }, { attack: 12, block: 10 },
            '铸剑山庄少庄主开炉那日用过的砚，砚膛里墨早干了，磨的是剑心。「铸剑的人一生只开一次炉——我的那次，铸给你了。」'),
        token('token_mao_ji', '既明晨符', '📜', '昴既明', '茅山派',
            { intelligence: 12, willpower: 8 }, { hit: 12, qi_regen: 4 },
            '茅山派天亮前画的第一道符，符头写「既明」二字。「符是天亮前画的，心是天亮后定的——定在你这里。」'),
        token('token_fan_jing', '一针惊筹', '🪡', '樊惊筹', '大旗门',
            { dexterity: 12, constitution: 8 }, { dodge: 12, block: 8 },
            '大旗门军旗上的加固针，他拆下来一根。「旗在人在，针在旗在——这根针离了旗，往后只护你。」'),
        token('token_kui_jiu', '九爻龟甲', '🐢', '隗九爻', '大隐阁',
            { intelligence: 14, willpower: 6 }, { crit: 10, hit: 10 },
            '大隐阁卜了半辈子的老龟甲，第九爻裂了纹。「九爻之内，天机我都算过。第九爻外那个变数——是你，我不算了。」'),
        token('token_sang_shi', '无字竹签', '🎋', '桑拾玖', '丐帮',
            { dexterity: 10, intelligence: 10 }, { dodge: 10, hit: 10 },
            '丐帮签筒里销不掉的一支签，签面空白。「别的签都销了，这支销不掉——长老说，无字的签，命是自己写的。」'),
        token('token_he_yuan', '降魔杵坠', '🔱', '赫渊', '金刚宗',
            { strength: 14, constitution: 6 }, { attack: 14, block: 8 },
            '金刚宗降魔杵缩成的一枚坠子，杵尖朝内。「降魔的杵，尖冲自己——我这一生降的第一个魔，是心里那点不敢说的念头。」'),
        token('token_zhu_ting', '听雨箫', '🌧️', '竺听雨', '华山派',
            { intelligence: 10, dexterity: 10 }, { hit: 12, crit: 8 },
            '华山听雨崖上竹制的箫，雨声大的时候才吹得响。「剑要听雨才活，人要听雨才静——你听，这箫认你的脚步。」'),
        token('token_wen_ren', '酌酒玉壶', '🍶', '闻人酌', '逍遥派',
            { constitution: 10, dexterity: 10 }, { qi_regen: 6, dodge: 8 },
            '逍遥派酒仙池边封了十年的壶，开封那天他倒了两杯。「酒逢知己千杯少——我这壶里只剩一杯的量了，那杯给你。」'),
        token('token_kui_pei', '佩南合符', '🪬', '逵佩南', '嵩山派',
            { willpower: 12, intelligence: 8 }, { block: 12, qi_regen: 4 },
            '嵩山执法堂的合符，两半严丝合缝。「条文我背了半生，条条有出处。唯独这一条——『合符者，同心也』，查无出处，我信了。」'),
        token('token_lei_jing', '惊蛰雷珠', '⚡', '雷惊蛰', '霹雳堂',
            { strength: 12, dexterity: 8 }, { attack: 14, crit: 8 },
            '霹雳堂春雷落地时凝的珠子，攥着它手心发麻。「雷一年只惊蛰一次，我这颗心也一样——响过那一次，就再没停过。」'),
        token('token_qin_mu', '药庐温茶盏', '🍵', '芩木', '药王谷',
            { constitution: 12, willpower: 8 }, { hp_regen: 6, qi_regen: 4 },
            '药王谷药庐里那只永远温着的茶盏。「茶凉了就别喝了——往后你什么时候来，它什么时候是热的。」'),
        token('token_jian_zhi', '一纸附页', '📖', '简知忆', '侠隐阁',
            { intelligence: 12, dexterity: 8 }, { hit: 12, dodge: 8 },
            '侠隐阁档案册后多出的一页附页，批注只有一行小字。「正档写的是你的生平。附页写的——是我的私心。」'),
        token('token_mi_shu', '书言墨玉笔', '🖌️', '宓书言', '天书阁',
            { intelligence: 14, willpower: 6 }, { crit: 10, qi_regen: 5 },
            '天书阁抄书人的墨玉笔，笔杆被指腹磨出了两处浅窝。「天下的书我都抄得。唯独写给你的那行字，练了三年没敢落笔——如今笔给你，你来写。」'),
        token('token_di_chang', '三站路引', '🧭', '狄长亭', '天涯海阁',
            { dexterity: 12, constitution: 8 }, { dodge: 12, hp_regen: 4 },
            '天涯海阁多算了三站的路引，他一里一里重新对齐了。「路引写到哪里，脚就走到哪里。这份的终点我改过了——改成你身边。」'),
        token('token_que_shou', '守拙木剑', '🗡️', '阙守拙', '武当派',
            { strength: 10, willpower: 10 }, { attack: 10, block: 12 },
            '武当山门房道人削了三十年的木剑，剑身光滑如镜。「巧的招我都忘了，只剩这一式笨的——笨到只会护着一个人。」'),
        token('token_nie_ming', '复核朱笔', '🖊️', '聂明泽', '阎罗殿',
            { intelligence: 12, strength: 8 }, { attack: 10, hit: 12 },
            '阎罗殿档案房里那支复核用的朱笔，笔杆刻着「命格：未定——复核人：本人」。「生死簿我批了半生。你的那一页，我压着笔没批——未定，就是还有将来。」')
    ];

    // 名册：按人名认领信物（结契写点在 dao-bridge.ensureDaoBond，按 npc.name 查这张表）
    var LEAD_TOKEN_MAP = {};
    LEAD_TOKENS.forEach(function (t) { LEAD_TOKEN_MAP[t.tokenOf] = t.id; });

    // 自注册进物品库（已有定义不覆盖）
    if (!window.itemById) window.itemById = {};
    if (!window.allItems) window.allItems = [];
    LEAD_TOKENS.forEach(function (item) {
        if (!item || !item.id || window.itemById[item.id]) return;
        window.itemById[item.id] = item;
        window.allItems.push(item);
    });
    if (window.armor) LEAD_TOKENS.forEach(function (item) { window.armor.push(item); });

    function ownsToken(itemId) {
        var inv = window.inventory;
        if (!inv || !Array.isArray(inv.slots)) return false;
        for (var i = 0; i < inv.slots.length; i++) {
            var s = inv.slots[i];
            if (s && s.templateId === itemId) return true;
        }
        // 戴在身上也算有
        var ce = window.currentEquipment || {};
        for (var k in ce) { if (ce[k] && (ce[k].templateId === itemId || ce[k].id === itemId)) return true; }
        return false;
    }

    /** 结契那一刻：这个人的信物落进背包（幂等——已有不重发，无名册匹配则静默） */
    function grantLeadToken(npcName, opts) {
        opts = opts || {};
        if (!npcName || !LEAD_TOKEN_MAP[npcName]) return false;
        var itemId = LEAD_TOKEN_MAP[npcName];
        var tpl = window.itemById && window.itemById[itemId];
        if (!tpl || ownsToken(itemId)) return false;
        if (typeof window.addItem !== 'function') return false;
        if (!window.addItem(itemId, 1)) return false;
        var ta = opts.gender === 'male' ? '他' : '她';
        var msg = '🎁 ' + npcName + '把「' + tpl.name + '」放进你掌心，指尖在' + (opts.gender === 'male' ? '他' : '她') + '自己心口按了一下：「收好。这东西天下只有一件——如今它是你的了。」';
        if (!opts.silent && window.gameLog && typeof window.gameLog.add === 'function') window.gameLog.add(msg, 'success');
        return true;
    }

    // ==================== v20.94 信物余韵：贴身之物，人是会看在眼里的 ====================
    // ① 每日钩子：戴着自己道侣的信物 → 那个人心里一暖（好感+1，一天一次）；
    //    戴着别人的信物而自己有道侣 → 道侣看在眼里（好感-2，一天一次，吃醋线的话头）；
    //    独身戴信物 → 无人吃醋，只有那个人偶尔想起你（好感≥50 才有回响）。
    // ② 信物架：人脉面板可开陈列——得到的连人带故事一起摆着，没得到的只留一个空位。

    var TOKEN_BY_ITEM = {};
    LEAD_TOKENS.forEach(function (t) { TOKEN_BY_ITEM[t.id] = t; });

    function shelfState() {
        var st = window.__leadTokenShelf || (window.__leadTokenShelf = { lastReactDay: -1 });
        return st;
    }
    function today() {
        try {
            if (window.timeSystem && window.timeSystem.gameTime) return Number(window.timeSystem.gameTime.currentDay) || 0;
        } catch (e) {}
        return 0;
    }
    function log(msg, type) {
        if (window.gameLog && typeof window.gameLog.add === 'function') window.gameLog.add(msg, type || 'info');
    }
    function wornToken() {
        var ce = window.currentEquipment || {};
        var acc = ce.acc2;
        if (!acc) return null;
        var id = acc.templateId || acc.id;
        return TOKEN_BY_ITEM[id] || null;
    }
    function daoBondOf(name) {
        var bonds = (window.currentCharData && window.currentCharData.bonds) || {};
        for (var id in bonds) {
            if (bonds[id] && bonds[id].type === 'dao_companion' && bonds[id].name === name) return { id: id, bond: bonds[id] };
        }
        return null;
    }
    function allDaoBonds() {
        var bonds = (window.currentCharData && window.currentCharData.bonds) || {};
        var out = [];
        for (var id in bonds) { if (bonds[id] && bonds[id].type === 'dao_companion') out.push({ id: id, bond: bonds[id] }); }
        return out;
    }
    function npcOf(id) {
        try { return window.npcManager && window.npcManager.getNPC ? window.npcManager.getNPC(id) : null; } catch (e) { return null; }
    }
    var WARM_LINES = [
        '看见你贴身戴着{token}，{ta}没说什么，嘴角却压不住——今晚的话都软了三分。',
        '{ta}替你把{token}的穗子理了理：「戴稳些。丢了，我可要重新问过你的心。」',
        '有人问起你身上的{token}，{ta}隔着人群望过来一眼——那一眼比答话先到了。',
        '{ta}低声问：「一直戴着？」你点头。{ta}别过脸去，耳根有点红。'
    ];
    var COLD_LINES = [
        '{wife}的目光落在你佩戴的{token}上，停了很久：「{owner}的东西，倒是贴身。」（好感-2）',
        '你戴着{token}去见{wife}，{ta}笑了笑，笑意没到眼底：「这信物真好看——是谁的？」（好感-2）',
        '{wife}替你掸了掸衣襟，指尖在{token}上顿了一顿，什么也没说。沉默比话重。（好感-2）'
    ];
    var SOFT_LINES = [
        '{owner}的目光在{token}上停了一瞬，又移开了——像想起什么，又像不敢想。',
        '你佩戴着{token}，{owner}远远看见，脚步慢了半拍。'
    ];
    function pick(arr, seed) { return arr[Math.abs(seed) % arr.length]; }
    function taOf(npc) { return (npc && npc.gender === 'male') ? '他' : '她'; }

    function tokenDailyTick() {
        var st = shelfState();
        var day = today();
        if (st.lastReactDay === day) return false;
        var worn = wornToken();
        if (!worn) return false;
        st.lastReactDay = day;
        var daos = allDaoBonds();
        var own = daoBondOf(worn.tokenOf);
        if (own) {
            // 戴的是自家道侣的信物：那个人心里一暖
            var npc = npcOf(own.id);
            if (npc && typeof npc.changeAffection === 'function') npc.changeAffection(1);
            var line = pick(WARM_LINES, day).replace(/\{token\}/g, '「' + worn.name + '」').replace(/\{ta\}/g, taOf(npc));
            log('💞 ' + line, 'success');
            return true;
        }
        if (daos.length) {
            // 戴着别人的信物：自家道侣看在眼里
            daos.forEach(function (d) {
                var npc = npcOf(d.id);
                if (npc && typeof npc.changeAffection === 'function') npc.changeAffection(-2);
                var line = pick(COLD_LINES, day + d.id.length)
                    .replace(/\{token\}/g, '「' + worn.name + '」')
                    .replace(/\{owner\}/g, worn.tokenOf)
                    .replace(/\{wife\}/g, d.bond.name || '你的道侣')
                    .replace(/\{ta\}/g, taOf(npc));
                log('💔 ' + line, 'warning');
            });
            return true;
        }
        // 独身戴着某人的信物：无缘无故，只是有人偶尔想起你
        var owner = null;
        try {
            var all = window.npcManager && window.npcManager.getAllNPCs ? window.npcManager.getAllNPCs() : [];
            for (var i = 0; i < all.length; i++) { if (all[i] && all[i].name === worn.tokenOf) { owner = all[i]; break; } }
        } catch (e) {}
        var aff = owner && owner.relationship ? Number(owner.relationship.affection) || 0 : 0;
        if (owner && aff >= 50) {
            log('🎐 ' + pick(SOFT_LINES, day).replace(/\{token\}/g, '「' + worn.name + '」').replace(/\{owner\}/g, worn.tokenOf), 'info');
            return true;
        }
        return false;
    }
    if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
        try { window.timeSystem.onNewDaySubscribe(function () { try { tokenDailyTick(); } catch (e) {} }); } catch (e) {}
    }

    /** 信物架：得到的连人带故事摆着，没得到的只留一个空位（不剧透是谁的） */
    function openTokenShelf() {
        var owned = LEAD_TOKENS.filter(function (t) { return ownsToken(t.id); });
        var worn = wornToken();
        var html = '<p class="text-xs text-gray-400 mb-3">天下独一份的信物，架上已收 <span class="text-pink-300 font-bold">' + owned.length + '</span> / ' + LEAD_TOKENS.length + ' 枚。每一枚都是某个人亲手放进你掌心的。</p>';
        if (owned.length) {
            html += '<div class="grid grid-cols-1 gap-2 mb-3">';
            owned.forEach(function (t) {
                var isWorn = worn && worn.id === t.id;
                html += '<div class="bg-gray-900 rounded p-2 border ' + (isWorn ? 'border-pink-500' : 'border-gray-700') + '">'
                    + '<div class="flex justify-between items-center"><span class="text-sm text-pink-200 font-bold">' + t.icon + ' ' + t.name + (isWorn ? ' <span class="text-[11px] text-pink-400">（佩戴中）</span>' : '') + '</span>'
                    + '<span class="text-[11px] text-gray-500">' + t.tokenOf + ' · ' + t.tokenSect + '</span></div>'
                    + '<p class="text-xs text-gray-400 mt-1">' + t.desc + '</p></div>';
            });
            html += '</div>';
        }
        var empty = LEAD_TOKENS.length - owned.length;
        if (empty > 0) {
            html += '<div class="grid grid-cols-4 gap-2">';
            for (var i = 0; i < Math.min(empty, 36); i++) {
                html += '<div class="bg-gray-900/60 rounded p-2 text-center border border-gray-800"><span class="text-lg opacity-40">🎁</span><p class="text-[10px] text-gray-600 mt-1">虚位以待</p></div>';
            }
            html += '</div>';
            html += '<p class="text-[11px] text-gray-600 mt-2">空位不题名——信物认人，缘到了，它是谁的自然是谁的。</p>';
        }
        if (typeof window.showModal === 'function') window.showModal('🎁 信物架', html);
        else if (window.showMessage) window.showMessage('信物架：已收 ' + owned.length + ' / ' + LEAD_TOKENS.length + ' 枚', 'info');
    }

    // 存档持久：反应日随档走（StateRegistry 在则挂账，不在则内存）
    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        try {
            window.StateRegistry.register('leadTokenShelf', {
                version: 1,
                export: function () { return shelfState(); },
                import: function (d) { var st = shelfState(); if (d && typeof d === 'object') { st.lastReactDay = Number(d.lastReactDay) || -1; } },
                reset: function () { shelfState().lastReactDay = -1; }
            });
        } catch (e) {}
    }

    window.LEAD_TOKENS = LEAD_TOKENS;
    window.LEAD_TOKEN_MAP = LEAD_TOKEN_MAP;
    window.grantLeadToken = grantLeadToken;
    window.openTokenShelf = openTokenShelf;
    window.tokenDailyTick = tokenDailyTick;
    console.log('[lead-tokens] v20.91 主角信物已注册：' + LEAD_TOKENS.length + ' 枚（特殊品级，独一份）');
})();
