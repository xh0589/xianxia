// ==================== sect-identity.js - 门派特色身份层（补厚批二 · 8派样板） ====================
// 旧特色是「按钮buff」：点一下、加个数、等冷却——意义不明，没有代价，没有世界反应。
// 本层把特色重做成「身份」：每派的本事从命门/地形/神功里长出来，用一次要付一次代价，
// 代价会被世界看见（同门侧目/正道留意/账本记一笔），灵气枯竭的年代本事还会变异（接主线旗）。
// 样板八派：修罗宫·血引 / 药王谷·识毒济生 / 丐帮·街谈网 / 铸剑山庄·心火淬火 /
//           少林·戒疤面壁 / 天山派·雪魄养心 / 天书阁·万卷归一 / 唐门·袖箭淬毒
// 机制约定：precheck() 返回字符串=代价不足，直接打回、不烧冷却（引擎钩子在 useSectSpecialty）；
//           状态全部挂 eventFlags（零新增存档键）；内读状态只报档位词，永不报裸数字；
//           costText/stateText 由门派详情页特色卡展示（UI是真理）。
(function () {
    'use strict';
    var W = window;
    var SP = W.SECT_SPECIALTIES;
    if (!SP) { console.warn('[sect-identity] SECT_SPECIALTIES 未就绪，身份层跳过'); return; }

    function flags() { return (W.eventFlags = W.eventFlags || {}); }
    function absDay() {
        try {
            if (W.timeSystem && W.timeSystem.getAbsoluteDay) return Number(W.timeSystem.getAbsoluteDay()) || 0;
        } catch (e) {}
        return 0;
    }
    function log(m) { try { if (W.gameLog && W.gameLog.add) W.gameLog.add(m); } catch (e) {} }
    function qiStage() { return Number(flags()['qi_stage'] || 0); }
    function cityWithered(c) { return !!flags()['qi_withered_' + c]; }
    function stones() {
        try {
            if (W.XianXia && W.XianXia.DataManager && W.XianXia.DataManager.getSpiritStones) return Number(W.XianXia.DataManager.getSpiritStones()) || 0;
        } catch (e) {}
        return (W.inventory && W.inventory.currency && Number(W.inventory.currency.spiritStones)) || 0;
    }
    function payStones(n) {
        if (stones() < n) return false;
        try {
            if (W.XianXia && W.XianXia.DataManager && W.XianXia.DataManager.deductSpiritStones) { W.XianXia.DataManager.deductSpiritStones(n); return true; }
        } catch (e) {}
        if (W.inventory && W.inventory.currency) { W.inventory.currency.spiritStones -= n; return true; }
        return false;
    }
    function addStones(n) {
        try {
            if (W.XianXia && W.XianXia.DataManager && W.XianXia.DataManager.addSpiritStones) { W.XianXia.DataManager.addSpiritStones(n); return; }
        } catch (e) {}
        if (W.inventory && W.inventory.currency) W.inventory.currency.spiritStones = (Number(W.inventory.currency.spiritStones) || 0) + n;
    }
    // 背包里按 subtype 找一格物品（返回 {slot, template} 或 null）
    function findItem(subtype, tid) {
        var inv = W.inventory;
        if (!inv || !inv.slots) return null;
        for (var i = 0; i < inv.slots.length; i++) {
            var s = inv.slots[i];
            if (!s || !(s.count > 0)) continue;
            if (tid && s.templateId === tid) return { slot: s, idx: i };
            if (subtype) {
                var t = (s.getTemplate && s.getTemplate()) || (W.itemById && W.itemById[s.templateId]);
                if (t && t.subtype === subtype) return { slot: s, idx: i, template: t };
            }
        }
        return null;
    }
    function takeOne(found) {
        if (!found) return false;
        found.slot.count -= 1;
        if (found.slot.count <= 0 && W.inventory && W.inventory.slots) W.inventory.slots[found.idx] = null;
        try { if (typeof W.updateInventoryUI === 'function') W.updateInventoryUI(); } catch (e) {}
        return true;
    }
    function addContribution(n, reason) {
        try { if (typeof W.sectAddContribution === 'function') { W.sectAddContribution(n, reason); return; } } catch (e) {}
        var ds = W.discipleState;
        if (ds) ds.contribution = (Number(ds.contribution) || 0) + n;
    }
    function once(key, fn) { if (!flags()[key]) { flags()[key] = absDay() || 1; try { fn(); } catch (e) {} } }

    // ============ 一 · 修罗宫「血引」：杀意是攒出来的，世界看得见 ============
    function killing() { return Math.max(0, Math.min(100, Number(flags()['sect_id_shura_killing'] || 0))); }
    function killingWord(k) { return k >= 80 ? '出鞘' : k >= 50 ? '如藏锋' : k >= 25 ? '已动' : '微动'; }
    SP['修罗宫'] = {
        name: '血引',
        icon: '🩸',
        desc: '修罗宫不拜神，拜血。引血入刃，杀意攒一层，刀就快一层——只是杀意这东西，攒得住，藏不住。',
        type: 'buff',
        effect: '攻击提升、防御下降，幅度随杀意深浅而变，持续6小时',
        cooldown: 20,
        rankReq: 5,
        costText: '不收灵石——收的是你的杀意，攒多了，旁人看得见',
        stateText: function () { return '杀意：' + killingWord(killing()); },
        applyEffect: function () {
            var k = Math.min(100, killing() + 25);
            flags()['sect_id_shura_killing'] = k;
            var atk = +(0.2 + k * 0.004).toFixed(2);   // 杀意0~100 → 攻+20%~60%
            var def = -(+(0.1 + k * 0.0025).toFixed(2)); // 杀意0~100 → 防-10%~-35%
            applyBuff('sect_xiuluo_buff', { attack: atk, defense: def }, 6);
            var out = '你割破掌心，血顺着刀脊爬上来。刀认得这个味——杀意「' + killingWord(k) + '」。';
            if (k >= 50) once('sect_id_shura_avert', function () {
                log('🩸 你路过演武场，切磋的同门停了手，让开半步。没人敢跟你对视——血引的杀意，藏不住了。');
            });
            if (k >= 80) {
                once('sect_id_shura_noticed', function () {
                    log('🩸 城门外，一个正道修士认出了你，什么也没说，转身就走。三日后，江湖告示的「留意」名单上，多了一张你的脸。');
                    flags()['sect_id_shura_marked'] = 1;
                });
                out += '夜里你自己也睡不安稳——刀在鞘里，杀意在外头。';
            }
            if (qiStage() >= 2) out += '灵气薄的年头，杀意比从前更难压下去。';
            return out;
        }
    };

    // ============ 二 · 药王谷「识毒济生」：药材是真代价，枯年药力减等 ============
    function herbCost() { return qiStage() >= 2 ? 2 : 1; }
    SP['药王谷'] = {
        name: '识毒济生',
        icon: '💊',
        desc: '药王谷的本事不在炼丹，在认毒。拿一株药材来，谷里教你把毒认全——认全了毒，才救得了人。',
        type: 'buff',
        effect: '体质与心境提升（百毒不侵之效），持续12小时；偶尔辨出新药性',
        cooldown: 24,
        rankReq: 5,
        costText: '每次耗药材一份（灵气枯竭之年药力减等，要两份）',
        stateText: function () { return qiStage() >= 2 ? '枯年药力减等——从前一份能办的事，如今要两份。' : ''; },
        precheck: function () {
            var need = herbCost(), have = 0;
            var inv = W.inventory;
            if (inv && inv.slots) {
                for (var i = 0; i < inv.slots.length; i++) {
                    var s = inv.slots[i];
                    if (!s || !(s.count > 0)) continue;
                    var t = (s.getTemplate && s.getTemplate()) || (W.itemById && W.itemById[s.templateId]);
                    if (t && t.subtype === 'herb') have += s.count;
                }
            }
            if (have < need) return '药篓是空的——识毒先得有毒可识，济生先得有药可济。' + (need >= 2 ? '枯年药力减等，备齐两份药材再来。' : '采一份药材再来。');
            return null;
        },
        applyEffect: function () {
            var need = herbCost(), took = [];
            for (var n = 0; n < need; n++) {
                var f = findItem('herb');
                if (!f) break;
                if (took.indexOf(f.slot.templateId) < 0) took.push((f.template && f.template.name) || '药材');
                takeOne(f);
            }
            applyBuff('sect_yaowang_buff', { constitution: 20, willpower: 20 }, 12);
            var out = '你拿' + (took[0] || '药材') + '试了半日毒——入口是麻的，回甘是苦的。毒认全了一味，往后遇上，你就是能救人的那个人。';
            var roll = (absDay() * 7 + 13) % 100;
            if (roll < 25) {
                var herbs = ['mat_liquorice', 'mat_scutellaria', 'mat_lingzhi', 'mat_he_shou_wu'];
                var pick = herbs[roll % herbs.length];
                if (typeof W.addItem === 'function') W.addItem(pick, 1);
                out += '顺手在药渣里辨出一株没见过的药性——谷里老人说，这叫「毒里生药」。';
            }
            if (roll >= 90) {
                addContribution(8, '药王谷·识毒济生');
                out += '你把新认的毒记进谷中毒谱，执事长老在你名下记了一笔功。';
            }
            if (qiStage() >= 2) out += '（枯年药力薄，两份药材才煎出从前一份的功。）';
            return out;
        }
    };
    // ============ 三 · 丐帮「街谈网」：消息不白听，接街谈库，偶尔有用 ============
    var GB_RUMORS = [
        '东街米铺的掌柜说，南边来的粮船这个月少了三条——不是船没了，是河道上的人心散了。',
        '城门口的守卫换了生面孔，盘查得比往常紧，像是上头交代了什么。',
        '听说城西当铺收了一件带血的玉佩，掌柜的连夜把它锁进了地窖。',
        '码头上的力夫讲，昨夜有条无灯的船出城，船头站着的人戴着斗笠——谁也没看清脸。',
        '茶馆里的说书人新编了一段书，说的是多年前一场旧案——台下有人听着听着就走了。',
        '药市的行情又变了：从前论斤卖的草药，如今论株。'
    ];
    var GB_RUMORS_WITHER = [
        '街上的流民比上月又多了——帮里的兄弟说，北边几座城的田，种什么枯什么。',
        '有个修士在巷口散尽了修为，换了一家老小三张出城的船票。帮里没人笑他。',
        '灵石铺子挂出牌子：收灵石，价跌三成。伙计说，石头还是石头，只是世道不认它了。',
        '城隍庙的香火旺得反常，道士们反倒下山来帮里讨口饭吃。',
        '南边传来消息：兽群在迁徙，猎户们跟着兽群走，村子空了一半。',
        '帮里最老的乞丐说，他讨饭五十年，头一回见城里人给乡下人下跪——求一口粮。'
    ];
    SP['丐帮'] = {
        name: '街谈网',
        icon: '👂',
        desc: '天下消息，一半在庙堂，另一半在墙根底下。丐帮弟子散在每座城的墙根——请兄弟们吃顿热饭，墙根底下的事，说给你听。',
        type: 'quest',
        effect: '听得两条街谈；运气好时，讨回一桩有用的消息（折成贡献记在账上）',
        cooldown: 24,
        rankReq: 5,
        costText: '打点费20灵石——消息不白听，兄弟们也要吃饭',
        precheck: function () {
            if (stones() < 20) return '打点费不够二十灵石。街谈网不收赊账——墙根底下的兄弟，等不起。';
            return null;
        },
        applyEffect: function () {
            payStones(20);
            var pool = qiStage() >= 2 ? GB_RUMORS_WITHER : GB_RUMORS;
            var d = absDay();
            var lines = [pool[d % pool.length], pool[(d * 3 + 1) % pool.length]];
            // 灵气之尽的街谈入了库，丐帮的耳朵也听得见——主线账翻开后优先说它
            try {
                var qs = flags()['qi_street'];
                if (flags()['qi_route'] && qs && qs.length) {
                    var fresh = qs[qs.length - 1];
                    lines[0] = fresh.text || lines[0];
                }
            } catch (e) {}
            log('👂 街谈网·其一：' + lines[0]);
            log('👂 街谈网·其二：' + lines[1]);
            var out = '热饭端上去，话就下来了。两条街谈已记在你心里。';
            var roll = (d * 31 + 7) % 100;
            if (roll < 30) {
                addContribution(30, '丐帮·一桩有用的消息');
                out += '其中一条不是闲话——是一桩能办的事。你把它报给堂口，账上记了你一笔功。';
            }
            return out;
        }
    };

    // ============ 四 · 铸剑山庄「心火淬火」：炭钱真金白银，兵刃真的会折 ============
    function mainHand() {
        var eq = W.currentEquipment;
        return (eq && eq.mainHand) ? eq.mainHand : null;
    }
    function quenchAtk() { return (qiStage() >= 3 || cityWithered('炎城')) ? 0.12 : 0.25; }
    SP['铸剑山庄'] = {
        name: '心火淬火',
        icon: '🔨',
        desc: '山庄铸剑，先问铸剑人敢不敢把自己烧进去。心火引炉火，淬一次，刃口利一层——只是刃利一分，铁也薄一分。',
        type: 'buff',
        effect: '攻击提升（淬火新锋），持续8小时；兵刃耐久受损',
        cooldown: 48,
        rankReq: 3,
        costText: '炭火钱30灵石 + 主手兵刃耐久折损',
        stateText: function () {
            if (qiStage() >= 3 || cityWithered('炎城')) return '地火衰了——炎城的火脉凉透之后，炉子里淬出来的锋，不如从前响。';
            return '';
        },
        precheck: function () {
            var w = mainHand();
            if (!w) return '你手里连兵刃都没有，淬什么火？先提一把主手兵刃来。';
            if (stones() < 30) return '炭火钱不够三十灵石。炉子不认人情，只认炭。';
            if (typeof w.durability === 'number' && w.durability <= 10) return '这把刃已经卷口了，再淬就要碎在炉里。先去兵器库养护，或换一把。';
            return null;
        },
        applyEffect: function () {
            payStones(30);
            var w = mainHand();
            if (w && typeof w.durability === 'number') w.durability = Math.max(0, w.durability - 10);
            var atk = quenchAtk();
            applyBuff('sect_zhujian_buff', { attack: atk }, 8);
            var out = '你把' + ((w && w.name) || '兵刃') + '递进炉膛，心火顺着掌心压下去。淬火那一声不像铁响，像人咬牙。刃口新亮了一线。';
            if (typeof w.durability === 'number') out += '（刃身薄了一分——耐久折了。）';
            if (atk < 0.25) out += '炉温到底不如从前。老师傅在旁边看着，没说话，只是往炉里又添了两铲炭。';
            return out;
        }
    };

    // ============ 五 · 少林寺「戒疤面壁」：面壁攒戒疤，戒疤养皮肉，日子久了会淡 ============
    function jieba() { return Math.max(0, Math.min(3, Number(flags()['sect_id_shaolin_jieba'] || 0))); }
    var JIEBA_WORD = ['无', '一', '二', '三'];
    SP['少林寺'] = {
        name: '戒疤面壁',
        icon: '🧘',
        desc: '达摩洞的石壁上看不到佛，只看得到自己的影子。面壁一回，心头落一枚戒疤——戒疤越多，皮肉越沉，刀枪越难进。只是戒疤这东西，久不面壁，会淡。',
        type: 'buff',
        effect: '防御与心境提升，幅度随戒疤层数加深，持续12小时',
        cooldown: 24,
        rankReq: 5,
        costText: '香火钱10灵石；戒疤七日不面壁淡一层',
        stateText: function () { return '戒疤：' + JIEBA_WORD[jieba()] + '层'; },
        precheck: function () {
            if (stones() < 10) return '香火钱不够十灵石。佛前不点空灯——洞口的知客僧合十不语，意思你懂。';
            return null;
        },
        applyEffect: function () {
            payStones(10);
            var j = Math.min(3, jieba() + 1);
            flags()['sect_id_shaolin_jieba'] = j;
            flags()['sect_id_shaolin_lastday'] = absDay();
            var def = +(0.15 + j * 0.05).toFixed(2); // 20%~30%
            applyBuff('sect_shaolin_buff', { defense: def, mind: 30 }, 12);
            var out = '你在石壁前坐到灯尽。起身时，心头那枚戒疤又深了一分——如今是' + JIEBA_WORD[j] + '层。';
            if (j >= 3) once('sect_id_shaolin_full', function () {
                log('🧘 扫地的老僧在你面壁洞口站了一会儿，念了声佛号：「施主的皮肉，比从前沉了。」——戒疤三层，寺里认得这个分量。');
            });
            if (qiStage() >= 2) out += '洞里的长明灯一夜暗了三回。知客僧说，灯油也涨价了。';
            return out;
        }
    };

    // ============ 六 · 天山派「雪魄养心」：冰原城的冰死没死，天山知道 ============
    function snowEff() { return cityWithered('冰原城') || qiStage() >= 3 ? { qiRegen: 0.25, willpower: 15 } : { qiRegen: 0.5, willpower: 30 }; }
    SP['天山派'] = {
        name: '雪魄养心',
        icon: '❄️',
        desc: '天山的心法不在招式，在「冷」字诀：雪魄入体，气机自回。养心要么拿一株雪莲做引，要么奉上香火——天山不收空愿。',
        type: 'buff',
        effect: '真气恢复与心境提升，持续10小时',
        cooldown: 18,
        rankReq: 5,
        costText: '雪莲一株，或香火钱20灵石',
        stateText: function () {
            return (cityWithered('冰原城') || qiStage() >= 3) ? '北边的冰镜缩了——冰没了魂，只剩下冷。雪魄一年比一年难养。' : '';
        },
        precheck: function () {
            if (findItem(null, 'mat_snow_lotus')) return null;
            if (stones() >= 20) return null;
            return '既没有雪莲做引，香火钱也不够二十灵石。雪魄不认空手——天山的风比谁都直。';
        },
        applyEffect: function () {
            var byLotus = findItem(null, 'mat_snow_lotus');
            if (byLotus) { takeOne(byLotus); } else { payStones(20); }
            var eff = snowEff();
            applyBuff('sect_tianshan_buff', eff, 10);
            var out = byLotus
                ? '雪莲在掌心化开，一线凉气顺着气机爬满周身——雪魄认了这个引子。'
                : '香火燃尽时，你在殿前的雪地里坐了一个时辰。凉气入体，气机自回。';
            if (eff.qiRegen < 0.5) out += '只是这凉气比从前薄——北边的冰死了魂，雪魄养出来的心，也只养得半分。';
            return out;
        }
    };

    // ============ 七 · 天书阁「万卷归一」：抄书钱不白付，残页里偶尔有功 ============
    SP['天书阁'] = {
        name: '万卷归一',
        icon: '📖',
        desc: '天书阁的规矩：书不外借，但可以抄。抄书钱五十灵石，贵在灯油与纸——你把万卷抄成一卷，悟性是自己长出来的。',
        type: 'buff',
        effect: '悟性与修炼速度提升，持续8小时；偶得残页之功',
        cooldown: 36,
        rankReq: 3,
        costText: '抄书钱50灵石',
        stateText: function () { return qiStage() >= 2 ? '字缝里的灵气淡了——同一页书，从前读出十分，如今只得五分。' : ''; },
        precheck: function () {
            if (stones() < 50) return '抄书钱不够五十灵石。管书的先生头也不抬：「纸贵，灯油更贵。」';
            return null;
        },
        applyEffect: function () {
            payStones(50);
            var cult = qiStage() >= 2 ? 0.1 : 0.2;
            applyBuff('sect_tianshu_buff', { wisdom: 0.4, cultivationSpeed: cult }, 8);
            var out = '你在阁中抄了整整半卷。笔尖磨秃两支，抄到后来字不像字，像道——悟性这东西，是抄出来的。';
            var roll = (absDay() * 13 + 5) % 100;
            if (roll < 10) {
                addContribution(15, '天书阁·残页之功');
                out += '灯下翻到一页残卷，缺了头尾，中间三行却让你怔了半晌。你把抄本呈给阁中，名下记了一笔功。';
            }
            if (qiStage() >= 2) out += '（枯年读书，字缝里的灵气淡了，悟出来的只有一半——先生们说，书没变，是天地变了。）';
            return out;
        }
    };

    // ============ 八 · 唐门「袖箭淬毒」：毒是家底，枯年毒虫不长 ============
    function tangEff() { return qiStage() >= 2 ? { poisonDmg: 0.15, crit: 0.05 } : { poisonDmg: 0.3, crit: 0.1 }; }
    SP['唐门'] = {
        name: '袖箭淬毒',
        icon: '🎯',
        desc: '唐门的暗器从不空手出门。出门前，拿一份毒把袖箭淬一遍——毒是唐门的家底，家底薄了，唐门就不姓唐。',
        type: 'buff',
        effect: '毒伤与暗器准头（会心）提升，持续8小时',
        cooldown: 24,
        rankReq: 5,
        costText: '毒药一份（家底），淬完袖箭才算齐',
        stateText: function () { return qiStage() >= 2 ? '灵气枯了，毒虫不长——同一份毒，淬出来的锋只有一半。' : ''; },
        precheck: function () {
            if (findItem(null, 'special_poison')) return null;
            return '袖箭里的毒用尽了——唐门不出空手。去坊市或毒瘴地里寻一份毒药再来。';
        },
        applyEffect: function () {
            takeOne(findItem(null, 'special_poison'));
            var eff = tangEff();
            applyBuff('sect_tang_buff', eff, 8);
            var out = '你把毒调进小炉，袖箭一支支过火——毒色吃进铁里，箭尾微微发乌。唐门的老话：见血封喉，不如见血封心。';
            if (eff.poisonDmg < 0.3) out += '毒虫这年景不长个，毒也淡——老师傅让你淬了两遍，才勉强吃上色。';
            return out;
        }
    };

    // ============ 模板铺开：其余二十八派接身份层（真代价 + 枯年变异，效果文本同步打折） ============
    // 八派样板是量身定做；其余按模板统一：启功费是真金白银，枯竭年代 buff 减半、
    // 效果展示文本里的百分比同步减半——UI 永不虚标（effect 显示的就是真拿到的）。
    var TEMPLATE_FLAVOR = {
        '武当派': '武当纯阳，以柔克刚——太极的圆不在招里，在一呼一吸之间。吐纳一回，山门的松涛都跟着慢半拍。',
        '全真教': '终南山的内丹把人身当炉鼎——真气不假外求，先养自己的心王。',
        '华山派': '华山的剑气轻灵，像苍龙岭上的天梯——剑意走在险处，险处才有锋。',
        '嵩山派': '五岳之首的剑法雄浑如山脉——剑阵一起，嵩山十三峰的势都借来了。',
        '恒山派': '恒山把琴音揉进剑意——琴声里有慈悲，剑意里有静气，两样都是尼师们的日课。',
        '衡山派': '衡山是南岳，寿岳的火主阴阳调和——剑气从南荒里生出来，轻快，也绵长。',
        '泰山派': '泰山如坐，剑意厚重端正——十八盘的石阶一级一级，都是基本功。',
        '峨眉派': '峨眉佛道兼修，琴剑杖同源——两秀峰之间，三分侠气，七分慈悲。',
        '大旗门': '汴京的军阵生在沙场——旗进人进，长兵齐扫，一个人快不算快，一堵墙推过去才算。',
        '侠隐阁': '武昌的江湖武学收百家之长——阁里藏着无数市井把式的影子，招招都有来处。',
        '茅山派': '茅山的符箓请神调将——朱砂落纸，符成之后，纸上那点红就是虚空中的一队兵。',
        '大隐阁': '九华山的隐退高人收着刀教你出刀——收过锋的人，最知道锋从哪儿来。',
        '天涯海阁': '江陵的文人以笔与琴为兵——一篇文章里藏着金戈铁马，一段琴音里埋着十面埋伏。',
        '神机门': '滕州的机关术夺天工之巧——机括咬合之间，木石也会咬人。',
        '霹雳堂': '寿春的火器性如霹雳——炉里的火药认生死，一响之内的规矩，由不得人。',
        '昆仑派': '昆仑是西域玄门的活化石——剑意与雪线一样老，也一样硬。',
        '金刚宗': '吐蕃的密宗苦行把皮肉炼成金刚——挨过打的骨头，比没挨过的经打。',
        '青城派': '青城剑法刚里藏柔——蜀中的雾气养人，也养剑，幽境里出来的锋都不响。',
        '蓬莱派': '蓬莱的水法与幻术同炉——一瓢海水里，半是幻，半是真，分不开才算学会。',
        '五仙教': '南疆的蛊术是正统不是邪路——蛊虫认主之前，先认人心，养蛊即养性。',
        '逍遥派': '缥缈峰的隐世门规只有一条：心宽即是逍遥——出手之前，先把胜负放下。',
        '百花谷': '白鹿泽医武双修——花香里藏着暗器的冷光，救人和伤人用的是同一双手。',
        '铁掌帮': '洞庭湖的铁掌功讲一个「透」字——掌风到时，铁砂还没到。',
        '阎罗殿': '雷公山的刀法霸道——刀出鞘先向人间要买路钱，给不给，都得过。',
        '血手门': '关外的爪功狠辣——爪风带毒，见血封喉，门里的规矩是手上不能干净。',
        '飞蝎坞': '江南水乡的暗桩养毒针——针细如蝎尾，快如水影，中针的人常以为是蚊子。',
        '烈日教': '西北边陲拜烈日为尊——借一缕真火入体，焚开穴窍，火性烈，人也得烈。',
        '天龙教': '大漠深处的魔教不讳言魔名——八部神功借魔的名头，走人间的路。'
    };
    var TEMPLATE_COST = { '大隐阁': 30, '烈日教': 30, '天龙教': 40, '昆仑派': 30, '金刚宗': 30, '逍遥派': 30, '蓬莱派': 30, '天涯海阁': 30 };
    Object.keys(TEMPLATE_FLAVOR).forEach(function (sect) {
        var sp = SP[sect];
        if (!sp || sp.costText) return; // 已定制的样板不动
        sp.desc = TEMPLATE_FLAVOR[sect];
        var costN = TEMPLATE_COST[sect] || 20;
        var baseEffect = String(sp.effect || '');
        sp.costText = '启功费' + costN + '灵石——门中的功夫，不白传';
        sp.stateText = function () { return qiStage() >= 2 ? '天地灵气薄，门中香火打折——这门功夫的效力只剩一半。' : ''; };
        try {
            Object.defineProperty(sp, 'effect', {
                configurable: true,
                get: function () {
                    if (qiStage() < 2) return baseEffect;
                    return baseEffect.replace(/(\d+(?:\.\d+)?)\s*%/g, function (m, n) { return (+(Number(n) / 2).toFixed(1)) + '%'; }) + '（枯年打折）';
                }
            });
        } catch (e) {}
        var origApply = sp.applyEffect;
        sp.precheck = function () {
            if (stones() < costN) return '启功费' + costN + '灵石还没凑齐——功夫不白传，这是门里的规矩。';
            return null;
        };
        sp.applyEffect = function () {
            payStones(costN);
            var r;
            if (qiStage() >= 2) {
                var _ob = W.applyBuff;
                W.applyBuff = function (id, eff, dur) {
                    var half = {};
                    Object.keys(eff || {}).forEach(function (k) { half[k] = typeof eff[k] === 'number' ? +(eff[k] / 2).toFixed(4) : eff[k]; });
                    return _ob(id, half, dur);
                };
                try { r = origApply(); } finally { W.applyBuff = _ob; }
                if (typeof r === 'string' && r.indexOf('枯年') < 0) r += '（枯年香火薄，所得效力打了折。）';
            } else {
                r = origApply();
            }
            return r;
        };
    });

    // ============ 日钩：杀意沉淀 / 戒疤转淡（世界不等你） ============
    function dayTick() {
        var f = flags();
        // 修罗宫：杀意每日沉淀（枯年更难压，沉淀慢）
        var k = Number(f['sect_id_shura_killing'] || 0);
        if (k > 0) {
            var decay = qiStage() >= 2 ? 2 : 5;
            f['sect_id_shura_killing'] = Math.max(0, k - decay);
        }
        // 少林：七日不面壁，戒疤淡一层
        var j = Number(f['sect_id_shaolin_jieba'] || 0);
        var last = Number(f['sect_id_shaolin_lastday'] || 0);
        if (j > 0 && last && absDay() - last >= 7) {
            f['sect_id_shaolin_jieba'] = j - 1;
            f['sect_id_shaolin_lastday'] = absDay();
            if (j - 1 === 0) log('🧘 心头最后一枚戒疤淡了。达摩洞的石壁还是那面石壁——它不催你，它只是等。');
        }
    }
    try {
        if (W.timeSystem && typeof W.timeSystem.onNewDaySubscribe === 'function') W.timeSystem.onNewDaySubscribe(function () { try { dayTick(); } catch (e) {} });
        else if (W.EventBus && W.EventBus.on) W.EventBus.on('newDay', function () { try { dayTick(); } catch (e) {} });
    } catch (e) {}

    // 进城时的世界反应：杀意「出鞘」者被多打量两眼（一城一回）
    try {
        var _origEnter = W.enterCity;
        if (typeof _origEnter === 'function') {
            W.enterCity = function () {
                var r = _origEnter.apply(this, arguments);
                try {
                    var f = flags();
                    if (f['sect_id_shura_marked'] && killing() >= 80) {
                        var city = (arguments && arguments[0]) || (W.currentCity && W.currentCity.name) || '';
                        if (city) once('sect_id_shura_gaze_' + city, function () {
                            log('🩸 进城的时候，守门的兵丁多看了你两眼，手按在了刀柄上——又慢慢松开。修罗宫血引杀意「出鞘」的人，城里认得。');
                        });
                    }
                } catch (e) {}
                return r;
            };
        }
    } catch (e) {}

    // 对外探针（测试与后续铺开用）
    W.sectIdentityProbe = function () {
        return {
            exemplars: ['修罗宫', '药王谷', '丐帮', '铸剑山庄', '少林寺', '天山派', '天书阁', '唐门'],
            killing: killing(), killingWord: killingWord(killing()),
            jieba: jieba(),
            quenchAtk: quenchAtk(), snowWeak: snowEff().qiRegen < 0.5
        };
    };
    console.log('[sect-identity] 门派特色身份层已注册：八派样板（血引/识毒济生/街谈网/心火淬火/戒疤面壁/雪魄养心/万卷归一/袖箭淬毒）+ 枯竭变异 + 世界反应');
})();
