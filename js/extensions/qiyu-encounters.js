// ==================== qiyu-encounters.js — 奇遇（v20.94） ====================
// 行走江湖撞上的独一份机缘：十段奇遇，各有门槛（地点/境界/生活技能），各有两难取舍。
// 奖励走 RewardService 统一结算（灵石/铜钱/物品/长进/因果/声望），奇物全部自注册且打
// qiyuOnly 标记——不进商铺货架、不上拍卖行，只有撞见的人才拿得到。
// 触发：进城（location:visited）、野外采集（app.js 钩子）、打坐修炼（app.js 钩子）。
// 纪律：每段奇遇一生一次；两段奇遇之间至少隔两个游戏日；弹窗不可用时静默跳过（不堵流程）。
(function (global) {
    'use strict';

    // ============ 奇遇奇物（自注册进物品库，qiyuOnly = 不上货架） ============
    var QIYU_ITEMS = [
        { id: 'qiyu_jiuxian_jiu', name: '仙家残酒', type: 'consumable', subtype: 'food', category: 'consumable', quality: 'PIN2', level: 25, price: 3000, effect: { qi_recovery: 500, energy_recovery: 100, hp_recovery: 300, mood_boost: 20 }, stackable: true, maxStack: 5, useContext: ['world'], qiyuOnly: true, desc: '醉仙落在桌上的半葫芦酒，酒气三百年不散。抿一口，人间尘土全消', icon: '🍶' },
        { id: 'qiyu_canpu', name: '遗音谱页', type: 'material', subtype: 'misc', category: 'material', quality: 'PIN3', level: 20, price: 2000, stackable: true, maxStack: 10, qiyuOnly: true, desc: '北冥冰壁下渗出的琴曲，只接住了半阙——谱页上的墨迹是霜', icon: '🎼' },
        { id: 'qiyu_lanke_stone', name: '烂柯石', type: 'material', subtype: 'stone', category: 'material', quality: 'PIN2', level: 24, price: 4000, stackable: true, maxStack: 10, qiyuOnly: true, desc: '观棋人手里攥了三百年的石头，石心里那局棋还没下完', icon: '🪨' },
        { id: 'qiyu_jianzhong_jing', name: '剑冢铁英', type: 'material', subtype: 'metal', category: 'material', quality: 'PIN2', level: 26, price: 5000, stackable: true, maxStack: 10, qiyuOnly: true, desc: '万剑朽在冢里，铁英不锈——铸兵人求一块而不得', icon: '⚙️' },
        { id: 'qiyu_dumu_zhu', name: '毒母珠', type: 'material', subtype: 'misc', category: 'material', quality: 'PIN2', level: 25, price: 4500, stackable: true, maxStack: 10, qiyuOnly: true, desc: '万毒谷母树百年一结的珠子，握在手里，百毒退避三舍', icon: '🟣' },
        { id: 'qiyu_fengxue_stone', name: '凤血石', type: 'material', subtype: 'stone', category: 'material', quality: 'PIN1', level: 30, price: 12000, stackable: true, maxStack: 5, qiyuOnly: true, desc: '凤凰换羽时滴落的一滴血，落进火山岩里凝成的石——一品奇材', icon: '🔴' },
        { id: 'qiyu_jiaoren_lei', name: '鲛人之泪', type: 'equipment', subtype: 'accessory', slot: 'neck', category: 'equipment', quality: 'PIN2', level: 25, price: 8000, attrs: { intelligence: 14, willpower: 14 }, defense: 12, combatBonus: { qi_regen: 6, hit: 8 }, armorDurability: 90, weight: 0.2, qiyuOnly: true, desc: '鲛人哭出来的那颗珠子，贴着颈子，凉得像一句没说完的话', icon: '💧' },
        { id: 'qiyu_wuming_sword', name: '无名古剑', type: 'equipment', subtype: 'sword', slot: 'mainHand', category: 'equipment', quality: 'PIN2', level: 24, price: 9000, attrs: { strength: 18, dexterity: 14, intelligence: 10 }, combatBonus: { attack: 150, crit: 12, hit: 8 }, damageType: 'slash', weight: 3.5, qiyuOnly: true, desc: '荒碑里锈了三百年的一把剑。锈是它的名字，剑是它的骨头', icon: '🗡️' },
        { id: 'qiyu_jiuzhuan_zha', name: '九转炉渣', type: 'consumable', subtype: 'pill', category: 'consumable', quality: 'PIN3', level: 28, price: 5000, effect: { hp_recovery: 900, qi_recovery: 500, energy_recovery: 200 }, stackable: true, maxStack: 5, useContext: ['world', 'battle'], qiyuOnly: true, desc: '药王弃炉里剩下的九转药渣——是渣，也是九转', icon: '💊' },
        { id: 'qiyu_beile_sutra', name: '贝叶残经', type: 'material', subtype: 'misc', category: 'material', quality: 'PIN3', level: 22, price: 3500, stackable: true, maxStack: 10, qiyuOnly: true, desc: '古佛国贝叶上抄的半页经文，字是梵文，读不懂也觉得静', icon: '🍂' }
    ];

    (function registerItems() {
        if (!global.itemById) global.itemById = {};
        if (!global.allItems) global.allItems = [];
        QIYU_ITEMS.forEach(function (it) {
            if (!it || !it.id || global.itemById[it.id]) return;
            global.itemById[it.id] = it;
            global.allItems.push(it);
        });
    })();

    // ============ 小工具 ============
    function skill(name) {
        try { return (typeof global.getLifeSkill === 'function') ? (global.getLifeSkill(name) || 0) : 0; } catch (e) { return 0; }
    }
    function city() {
        try {
            if (global.locationSystem && typeof global.locationSystem.getCurrentLocation === 'function') return global.locationSystem.getCurrentLocation() || '';
        } catch (e) {}
        return (global.currentCharData && global.currentCharData.location) || '';
    }
    function region() {
        try {
            var d = global.locationSystem && global.locationSystem.getCityData ? global.locationSystem.getCityData(city()) : null;
            if (d && d.region) return d.region;
        } catch (e) {}
        return '';
    }
    function realmIdx() {
        var order = ['凡人', '炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫', '真仙', '金仙'];
        var r = (global.currentCharData && global.currentCharData.realm) || '';
        var i = order.indexOf(r);
        return i < 0 ? 1 : i;
    }
    function day() {
        try {
            if (global.timeSystem && global.timeSystem.gameTime) return Number(global.timeSystem.gameTime.currentDay) || 0;
        } catch (e) {}
        return 0;
    }
    function hasQin() {
        try {
            if (global.QinArts && typeof global.QinArts.equippedQin === 'function') return !!global.QinArts.equippedQin();
        } catch (e) {}
        return false;
    }
    function log(msg, type) { if (global.gameLog && typeof global.gameLog.add === 'function') global.gameLog.add(msg, type || 'info'); }

    // ============ 奇遇名册（十段，各有门槛与两难） ============
    var QIYU = [
        {
            id: 'qy_beiming_yiyin', name: '北冥遗音', icon: '🌊',
            ctx: ['city', 'cultivate'], weight: 3,
            cond: function () { return region() === '北冥' && skill('音律') >= 20; },
            scene: function () {
                return '夜过北冥冰原，冰壁深处渗出一缕琴音——不成调，却成意，像是谁把三百年前的一曲冻在了冰里。\n\n你的音律：' + skill('音律') + ' 级。' + (hasQin() ? '背上的琴嗡嗡作响，像认得这段音。' : '你两手空空，只能用耳朵接。');
            },
            choices: [
                {
                    text: function () { return hasQin() ? '🪕 循声和一曲（以琴接琴）' : '🎵 循声轻哼，试着接住这段音（音律40+）'; },
                    ok: function () { return hasQin() || skill('音律') >= 40; },
                    effects: { spiritStones: 50, lifeSkill: [{ name: '音律', exp: 6 }], items: [{ itemId: 'qiyu_canpu', count: 1 }] },
                    msg: '你循着冰壁下的调子接了下去。一曲终了，冰壁里铮然一声，半页霜墨谱文从冰缝里滑出来——是它给你的回礼。音修远在天边，缘在近在耳边。（音律+6，灵石+50，得「遗音谱页」）',
                    failEffects: { lifeSkill: { name: '音律', exp: 2 } },
                    failMsg: '你接了半句就散了调。冰壁里的琴音顿了顿，像是叹了口气，又沉回冰底。好歹耳朵记住了那半句。（音律+2）'
                },
                {
                    text: '🧘 静坐听完（不打扰它）',
                    effects: { lifeSkill: { name: '音律', exp: 3 }, karma: 2 },
                    msg: '你席地坐下，听完了一整曲。天亮时琴音止了，你起身作了一揖——有些缘分，听过就算数。（音律+3，因果+2）'
                }
            ]
        },
        {
            id: 'qy_jiuxian_yuzhuo', name: '醉仙遗酌', icon: '🍶',
            ctx: ['city'], weight: 3,
            cond: function () { return realmIdx() >= 1; },
            scene: function () {
                return '酒馆打烊前，一个醉倒的老头趴在桌上打呼噜，怀里半只酒葫芦滑落在地——葫芦口的塞子是玉的，酒香隔着三步就把你的真气勾动了。\n\n你的口才：' + skill('口才') + ' 级。';
            },
            choices: [
                {
                    text: '🗣️ 叫醒老丈，问个来历（口才40+）',
                    ok: function () { return skill('口才') >= 40; },
                    effects: { items: [{ itemId: 'qiyu_jiuxian_jiu', count: 1 }], lifeSkill: { name: '口才', exp: 3 } },
                    msg: '你笑着替他把葫芦拾起来。老头眯眼打量你半晌，忽然哈哈大笑：「识货！也识人！」葫芦塞回你手里，人已经醉倒在桌上——再问，只剩呼噜声。（得「仙家残酒」，口才+3）',
                    failEffects: { items: [{ itemId: 'qiyu_jiuxian_jiu', count: 1 }] },
                    failMsg: '你摇了半天，老头翻了个身，葫芦顺势滚进你怀里，呼噜照旧。这算送的还是算捡的，说不清了。（得「仙家残酒」）'
                },
                {
                    text: '🤫 悄悄收了葫芦（没人看见）',
                    effects: { items: [{ itemId: 'qiyu_jiuxian_jiu', count: 1 }], karma: -3 },
                    msg: '葫芦入手温热。你快步出了酒馆，身后呼噜声没停——可这一夜你翻来覆去：酒是好酒，就是喝着有点亏心。（得「仙家残酒」，因果-3）'
                }
            ]
        },
        {
            id: 'qy_lanke_qiju', name: '烂柯棋局', icon: '⚫',
            ctx: ['cultivate', 'wild'], weight: 3,
            cond: function () { return skill('学识') >= 15 || city() === '太虚山' || city() === '青城山'; },
            scene: function () {
                return '山道边的石壁上刻着一局残棋，黑白咬在中盘，落子处被人摩挲得发亮。石壁根下一只烂了柄的斧头，斧刃上的锈有三百年厚。\n\n你的学识：' + skill('学识') + ' 级。';
            },
            choices: [
                {
                    text: '♟️ 执子续这局棋（学识40+）',
                    ok: function () { return skill('学识') >= 40; },
                    effects: { lifeSkill: { name: '学识', exp: 8 }, items: [{ itemId: 'qiyu_lanke_stone', count: 1 }] },
                    msg: '你拾起石子里的一颗白子，落在中盘。石壁嗡然——那局棋认了你的落子。回过神来日头已偏西，掌心里多了一块温热的石头，石心里棋局未终。（学识+8，得「烂柯石」）',
                    failEffects: { lifeSkill: { name: '学识', exp: 4 } },
                    failMsg: '你落了一子，石壁毫无动静——棋不认你。但你盯着残局看到天黑，看懂了三十年的中盘杀。（学识+4）'
                },
                {
                    text: '📜 把棋谱抄下来带走',
                    effects: { lifeSkill: { name: '学识', exp: 3 }, copper: 200 },
                    msg: '你一子一子把残局抄进本子。抄完最后一子，石壁上的刻痕淡了几分——像是交了班。（学识+3，铜钱+200）'
                }
            ]
        },
        {
            id: 'qy_jianzhong_jianming', name: '剑冢夜鸣', icon: '⚔️',
            ctx: ['city'], weight: 3,
            cond: function () { return (city() === '万剑宗' || city() === '剑阁') && realmIdx() >= 2; },
            scene: function () {
                return '夜半剑冢方向万剑齐鸣，声浪压过北风。守冢的老人拦住要进去的弟子们，唯独没拦你——他看了你一眼：「剑点名，点到谁，谁自己拿主意。」';
            },
            choices: [
                {
                    text: '🗡️ 入冢应名（真元护体，或有灼伤）',
                    effects: { items: [{ itemId: 'qiyu_jianzhong_jing', count: 1 }], exp: 30, health: -40 },
                    msg: '你以真元护体走进剑林。万剑让开一条缝，冢心的铁英自己跳进你掌心——出来时衣袖焦了三处，掌心滚烫，值。（得「剑冢铁英」，历练+30，气血-40）'
                },
                {
                    text: '👂 冢外听剑（听一夜剑鸣也是造化）',
                    effects: { lifeSkill: [{ name: '学识', exp: 3 }, { name: '锻造', exp: 2 }], exp: 15 },
                    msg: '你在冢外坐了一夜，听万剑把三百年的锈一声声抖落。天亮时你懂了半式剑意，也懂了铁是怎么死的。（学识+3，锻造+2，历练+15）'
                }
            ]
        },
        {
            id: 'qy_shaxia_cangjing', name: '沙下藏经', icon: '🏜️',
            ctx: ['city'], weight: 3,
            cond: function () { return city() === '佛国遗址'; },
            scene: function () {
                return '一场夜风移开了半座沙丘，大塔遗迹脚下露出一角贝叶经的边——沙还在流，再晚半天它就又沉回去了。';
            },
            choices: [
                {
                    text: '⛏️ 抢在流沙前挖出来（耗时半日）',
                    effects: { items: [{ itemId: 'qiyu_beile_sutra', count: 1 }], lifeSkill: { name: '学识', exp: 5 }, spiritStones: 100 },
                    msg: '你和流沙抢了半天，抢回来半卷贝叶残经和一小匣香火钱——塔下埋的，不知是哪朝僧人的私蓄。（得「贝叶残经」，学识+5，灵石+100）'
                },
                {
                    text: '🙏 把沙扫回去，替它诵一段经',
                    effects: { karma: 5, lifeSkill: { name: '学识', exp: 2 } },
                    msg: '你把沙一捧捧扫回去，掩好经角，合十诵了一段不知真假的经。风停的时候，塔影好像直了一瞬。（因果+5，学识+2）'
                }
            ]
        },
        {
            id: 'qy_dumu_zhu', name: '毒母之珠', icon: '🟣',
            ctx: ['city', 'wild'], weight: 3,
            cond: function () { return region() === '南疆' && skill('毒术') >= 25; },
            scene: function () {
                return '万毒谷深处那株母树今年挂了果——一颗紫珠在枝心慢慢转，百步内的虫豸绕着它飞，不敢落。你的毒术：' + skill('毒术') + ' 级。';
            },
            choices: [
                {
                    text: function () { return skill('毒术') >= 40 ? '🧤 以毒引毒，摘珠（毒术40+，稳拿）' : '🧤 硬摘（毒术不到40，恐被毒气反噬）'; },
                    ok: function () { return skill('毒术') >= 40; },
                    effects: { items: [{ itemId: 'qiyu_dumu_zhu', count: 1 }], lifeSkill: { name: '毒术', exp: 5 } },
                    msg: '你以自身毒息引开母树的护毒，指尖一捻，紫珠入手——百步内的虫豸齐齐伏地。这是它们认下的新毒主。（得「毒母珠」，毒术+5）',
                    failEffects: { items: [{ itemId: 'qiyu_dumu_zhu', count: 1 }], health: -60, lifeSkill: { name: '毒术', exp: 3 } },
                    failMsg: '珠子是摘到了，母树的毒气也顺着你的手腕爬了上来——半边胳膊黑了一整天。毒这一行，学费从来是拿肉交的。（得「毒母珠」，气血-60，毒术+3）'
                },
                {
                    text: '🚶 退后三步，看它转完这一轮',
                    effects: { lifeSkill: { name: '毒术', exp: 2 }, karma: 1 },
                    msg: '你没伸手。紫珠转完一轮，缩回枝心——明年再结。有些东西看着它长，比摘了它更像懂毒。（毒术+2，因果+1）'
                }
            ]
        },
        {
            id: 'qy_fenghuang_luoyu', name: '凤凰落羽', icon: '🪶',
            ctx: ['city'], weight: 2,
            cond: function () { return city() === '凤凰巢'; },
            scene: function () {
                return '赤羽市上空一声长鸣，一只凤凰裔鸟掠过火山口换羽——一根赤羽打着旋往下落，羽尖上还燃着没熄的凤火。满市的人都在仰头，没人敢先动。';
            },
            choices: [
                {
                    text: '🔥 迎风接羽（凤火燎身，灼伤难免）',
                    effects: { items: [{ itemId: 'qiyu_fengxue_stone', count: 1 }], health: -50 },
                    msg: '你抢在所有人前头跃起，双掌合住那根赤羽——凤火顺着掌纹烧进来，疼得眼前发白。等火熄了，掌心里躺着一块凝成的凤血石，一品奇材。（得「凤血石」，气血-50）'
                },
                {
                    text: '🙇 远远拱手，让羽落地归市',
                    effects: { karma: 3, spiritStones: 30, cityReputation: 2 },
                    msg: '你拱手退开。赤羽落在赤羽市的老掌柜脚边，他拾起来冲你点头：「懂礼数的客人，巢城记得。」当晚凤裔长老遣人送来一份谢仪。（因果+3，灵石+30，本城声望+2）'
                }
            ]
        },
        {
            id: 'qy_jiaoren_lei', name: '鲛人夜泣', icon: '🧜',
            ctx: ['city'], weight: 2,
            cond: function () { return region() === '东南海域'; },
            scene: function () {
                return '夜潮退到最远的那一晚，礁石上坐着一个鲛人，尾鳍在月光下泛着青。她没哭出声——眼泪落进海里，一颗一颗，全是珠子。你的口才：' + skill('口才') + ' 级。';
            },
            choices: [
                {
                    text: function () { return skill('口才') >= 30 ? '💬 上前宽慰（口才30+，她肯抬头）' : '💬 上前宽慰（口才不到30，只怕词穷）'; },
                    ok: function () { return skill('口才') >= 30; },
                    effects: { items: [{ itemId: 'qiyu_jiaoren_lei', count: 1 }], lifeSkill: { name: '口才', exp: 3 } },
                    msg: '你没问她的伤心事，只坐在三步外说了半宿人间琐碎——谁家的饭糊了，谁家的猫上房。她听着听着就笑了，走时把最大的一颗泪珠放在你坐过的地方。（得「鲛人之泪」，口才+3）',
                    failEffects: { lifeSkill: { name: '口才', exp: 2 }, spiritStones: 50 },
                    failMsg: '你张了半天嘴，只憋出一句「都会好的」。她摇摇头潜回海里——礁石上留下两颗小些的珠子，算谢你陪坐。（灵石+50，口才+2）'
                },
                {
                    text: '🌙 远远看着，替她守着这片海滩',
                    effects: { spiritStones: 200, karma: 2 },
                    msg: '你站在滩头守了一夜，替她挡了三个想捡珠子的醉汉。天亮前她朝你的方向拜了一拜，海里推上来一小匣珍珠。（灵石+200，因果+2）'
                }
            ]
        },
        {
            id: 'qy_xiujian_shibei', name: '锈剑石碑', icon: '🗡️',
            ctx: ['wild'], weight: 3,
            cond: function () { return realmIdx() >= 1; },
            scene: function () {
                return '荒草没膝的野地里立着半截石碑，碑上插着一把锈得看不出原色的剑。碑文被风沙磨平了，只剩落款两个字还清楚——「候人」。\n\n你的学识：' + skill('学识') + ' 级。';
            },
            choices: [
                {
                    text: function () { return skill('学识') >= 25 ? '🔍 先辨剑再动手（学识25+）' : '🔍 先辨剑再动手（学识不到25，只怕看走眼）'; },
                    ok: function () { return skill('学识') >= 25; },
                    effects: { items: [{ itemId: 'qiyu_wuming_sword', count: 1 }], lifeSkill: { name: '学识', exp: 4 } },
                    msg: '你用学识辨出锈下的剑脊纹路——这不是凡铁，是三百年前有人埋剑候人的信物。你按古礼三揖，双手请剑出碑，锈壳片片剥落，剑身如秋水。（得「无名古剑」，学识+4）',
                    failEffects: { items: [{ itemId: 'mat_iron_ore', count: 3 }], lifeSkill: { name: '锻造', exp: 2 } },
                    failMsg: '你看了半天没看出名堂，一咬牙拔了剑——剑身应声断成三截，只有剑柄里掉出几块好铁。碑文那句「候人」，等的不是你这个拔法。（铁矿×3，锻造+2）'
                },
                {
                    text: '🪦 不拔剑，替碑培一捧土',
                    effects: { karma: 3, lifeSkill: { name: '学识', exp: 2 } },
                    msg: '你没碰那把剑。埋剑候人，候的自然是配得上它的人——你自问今天还不是。你替石碑培了土，作了个揖走人。身后剑鸣了一声，很轻，像是记下了你。（因果+3，学识+2）'
                }
            ]
        },
        {
            id: 'qy_yaowang_yulu', name: '药王遗炉', icon: '🔥',
            ctx: ['wild', 'city'], weight: 3,
            cond: function () { return skill('医术') >= 20 || city() === '青木城'; },
            scene: function () {
                return '山坳里一座弃了的药炉，炉膛居然还温着，炉壁的九转刻纹只磨浅了一转——是药王谷哪位前辈路过留下的炉子，炉渣里药性未散。你的医术：' + skill('医术') + ' 级。';
            },
            choices: [
                {
                    text: function () { return skill('医术') >= 40 ? '🔥 续上炉火，把药渣再炼一转（医术40+）' : '🔥 试着续炉火（医术不到40，火候难拿）'; },
                    ok: function () { return skill('医术') >= 40; },
                    effects: { items: [{ itemId: 'qiyu_jiuzhuan_zha', count: 1 }], lifeSkill: { name: '医术', exp: 6 }, energy: -20 },
                    msg: '你添柴、压火、转炉，把炉渣又炼了一转——开炉时药香冲起三丈。九转炉渣，是渣，也是九转。（得「九转炉渣」，医术+6，精力-20）',
                    failEffects: { items: [{ itemId: 'qiyu_jiuzhuan_zha', count: 1 }], lifeSkill: { name: '医术', exp: 3 }, energy: -20 },
                    failMsg: '火候差着一线，药渣只回了半转——成色打折，但也是别处求不来的东西。你把它小心收好。（得「九转炉渣」，医术+3，精力-20）'
                },
                {
                    text: '🧺 把炉渣收好，把炉膛封上',
                    effects: { lifeSkill: { name: '医术', exp: 3 }, karma: 1 },
                    msg: '你把炉渣包好收进药囊，又用石片把炉膛封了——留给下一位路过的医者。药王谷的规矩：炉火不熄于人手。（医术+3，因果+1）'
                }
            ]
        },
        // ===== v21.9 高境界奇遇：此前门槛最高筑基（realmIdx>=2）——化神往后人间再无新鲜事 =====
        {
            id: 'qy_xinghai_guzhou', name: '星槎孤舟', icon: '🛶',
            ctx: ['wild', 'cultivate'], weight: 3,
            cond: function () { return realmIdx() >= 5; },
            scene: function () {
                return '夜半打坐，天外掠过一叶无人孤舟——舟身是整块陨石雕的，舷上刻满了星图，舟尾拖着一缕没散尽的星辉。它飞得极慢，像是在等什么人上船。\n\n你的神识：' + skill('学识') + ' 级学识。';
            },
            choices: [
                {
                    text: '🛶 纵身登舟，随星图走一程（学识50+）',
                    ok: function () { return skill('学识') >= 50; },
                    effects: { exp: 8000, items: [{ itemId: 'mat_star_sand', count: 2 }], energy: -30 },
                    msg: '你踏上舟头，星图在你脚下次第亮起——这一程走的是三千年前某位仙人回家的路。舟到星尽处，你被轻轻放下，袖中多了两捧星砂。（经验+8000，得「星辰砂」×2，精力-30）',
                    failEffects: { exp: 3000, energy: -30 },
                    failMsg: '你跃上舟舷，星图却一片晦暗——认不得路的人，船不肯载。孤舟把你放回原地，继续慢吞吞地飞。（经验+3000，精力-30）'
                },
                {
                    text: '🙏 拱手相送，不搭这趟船',
                    effects: { karma: 3, exp: 1500 },
                    msg: '你立在原地，朝孤舟长揖到地。舟尾的星辉忽然亮了一瞬，像是回礼——有些路是别人的归途，看过就算送过。（因果+3，经验+1500）'
                }
            ]
        },
        {
            id: 'qy_gushen_zhican', name: '古神残响', icon: '🗿',
            ctx: ['wild'], weight: 3,
            cond: function () { return realmIdx() >= 6; },
            scene: function () {
                return '荒山深处半截神像斜插进土里，断口新鲜得不像万年遗物。你靠近时，神像残躯里传出极缓的心跳声——一下，又一下。有东西还没死透，在借着石胎做梦。';
            },
            choices: [
                {
                    text: '👂 贴耳听它把梦做完（意志过硬才守得住神魂）',
                    ok: function () { var a = (global.currentCharData && global.currentCharData.attrs) || {}; return (Number(a.willpower) || 0) >= 60; },
                    effects: { exp: 15000, items: [{ itemId: 'mat_dragon_crystal', count: 1 }], energy: -40 },
                    msg: '你听见了开天辟地时的一声叹息——那是它没做完的梦。醒来时天光已换了三回，识海里多了一段不属于人间的道韵，掌心里凝出一枚龙晶。（经验+15000，得「龙晶」，精力-40）',
                    failEffects: { exp: 4000, energy: -40 },
                    failMsg: '梦太大，你的神魂盛不下——被心跳声推着退出来，七窍发麻。但那段梦的边角，够你咀嚼很久。（经验+4000，精力-40）'
                },
                {
                    text: '⛰️ 替它把断口埋回土里',
                    effects: { karma: 5, exp: 3000 },
                    msg: '你搬石填土，把半截神像重新埋好，压上一块青石。心跳声渐渐缓了、沉了——它继续做梦，不再被人打扰。死者为大，神也一样。（因果+5，经验+3000）'
                }
            ]
        },
        {
            id: 'qy_tianhe_daoguan', name: '天河道痕', icon: '🌌',
            ctx: ['cultivate'], weight: 2,
            cond: function () { return realmIdx() >= 8; },
            scene: function () {
                return '入定至深处，识海外忽然横过一条无声的河——不是水，是法则本身在流动。河面上有一道极浅的旧痕，像谁曾经在此处渡河，又像是留给后来者的脚印。';
            },
            choices: [
                {
                    text: '👣 踏进那道旧痕，沿前人的脚印走（大乘之姿）',
                    ok: function () { return realmIdx() >= 8; },
                    effects: { exp: 30000, items: [{ itemId: 'mat_space_crystal', count: 1 }], energy: -60 },
                    msg: '你的道与旧痕合了一瞬——那一瞬你看见了渡河人回头。再睁眼时，识海澄澈如洗，身前浮着一枚空间结晶，是河水的谢礼。（经验+30000，得「空间结晶」，精力-60）',
                    failEffects: { exp: 8000, energy: -60 },
                    failMsg: '脚印太深，你的道太轻——被法则的涟漪轻轻推出识海。它没伤你，这是天河对你的客气。养足精神再来。（经验+8000，精力-60）'
                },
                {
                    text: '🖋️ 不渡河，只在岸边把自己的道刻一笔',
                    effects: { karma: 4, fame: 20, exp: 10000 },
                    msg: '你在天河岸边刻下自己的道痕，浅，但清楚。千万年后若有后来者渡河，会看见两个脚印——一深一浅，一前一后。（因果+4，名望+20，经验+10000）'
                }
            ]
        }
    ];

    // ============ 状态与持久 ============
    var state = { done: {}, lastDay: -99 };
    function st() { return state; }
    if (global.StateRegistry && typeof global.StateRegistry.register === 'function') {
        try {
            global.StateRegistry.register('qiyuEncounters', {
                version: 1,
                export: function () { return { done: state.done, lastDay: state.lastDay }; },
                import: function (d) { if (d && typeof d === 'object') { state.done = d.done || {}; state.lastDay = (d.lastDay != null && isFinite(Number(d.lastDay))) ? Number(d.lastDay) : -99; } },
                reset: function () { state.done = {}; state.lastDay = -99; }
            });
        } catch (e) {}
    }

    // ============ 触发 ============
    var CTX_CHANCE = { city: 0.04, wild: 0.03, cultivate: 0.02 };
    var COOLDOWN_DAYS = 2;
    var pending = null;
    var pendingEl = null;   // 第一百零九波：记住奇遇弹窗本体——被顶掉/点遮罩关掉时靠它认尸兜底

    function candidates(ctxName) {
        var d = day();
        return QIYU.filter(function (q) {
            if (state.done[q.id]) return false;
            if (q.ctx.indexOf(ctxName) < 0) return false;
            if (d - state.lastDay < COOLDOWN_DAYS) return false;
            try { return !!q.cond(); } catch (e) { return false; }
        });
    }
    function pickWeighted(list, rng) {
        var total = list.reduce(function (s, q) { return s + (q.weight || 1); }, 0);
        var r = rng() * total;
        for (var i = 0; i < list.length; i++) { r -= (list[i].weight || 1); if (r <= 0) return list[i]; }
        return list[list.length - 1];
    }
    /** 行动钩子：进城/采集/打坐后调一下，撞上就弹窗（rng 可注入测试） */
    function maybeTrigger(ctxName, opts) {
        opts = opts || {};
        if (pending) {
            // 第一百零九波 · 软锁兜底：弹窗被别的窗顶掉、或玩家点遮罩关掉时 pending 永不清除——
            // 此前整局奇遇从此猝死（进城/采集/打坐全都不再触发）。
            // 认尸要认得实：只有「挂过记号的窗确认不在了」才放行；认不出窗（无弹窗环境/拿不到节点）
            // 就保守照旧等——宁可维持老行为，不可把冷却期的账一起顶翻。
            var _alive = true;
            if (pendingEl) {
                try {
                    _alive = !!(pendingEl.getAttribute && pendingEl.getAttribute('data-qiyu-pending') === '1'
                        && (!global.document || !global.document.body || typeof global.document.body.contains !== 'function'
                            || global.document.body.contains(pendingEl)));
                } catch (eAlive) { _alive = true; }
            }
            if (_alive) return null;
            pending = null;
            pendingEl = null;
        }
        var rng = (typeof global.__qiyuRng === 'function') ? global.__qiyuRng : (opts.rng || Math.random);
        var chance = CTX_CHANCE[ctxName] || 0.02;
        // v21.1 气运通电：主要属性栏写「高气运者奇遇更勤」，就得真勤——
        // 气运 0 → ×0.5，50 → ×1.0，100 → ×1.5（天眷之人撞机缘的概率是常人的三倍于天煞孤星）
        try {
            // v21.9 getLuckChance 通电：全局 API 此前定义了零调用方，这里内联重复了同款公式——现在统一走它
            if (typeof global.getLuckChance === 'function') {
                chance = global.getLuckChance(chance);
            } else {
                var cd = global.currentCharData;
                var lk = (cd && cd.luck != null) ? Number(cd.luck) : 50;
                if (isFinite(lk)) chance = chance * (0.5 + Math.max(0, Math.min(100, lk)) / 100);
            }
        } catch (e) {}
        if (rng() > chance) return null;
        var list = candidates(ctxName);
        if (!list.length) return null;
        var q = pickWeighted(list, rng);
        openQiyu(q);
        return q;
    }
    /** 直接开一段（调试/剧情指定用） */
    function forceTrigger(id) {
        var q = null;
        for (var i = 0; i < QIYU.length; i++) if (QIYU[i].id === id) q = QIYU[i];
        if (!q || state.done[q.id]) return false;
        openQiyu(q);
        return true;
    }
    function openQiyu(q) {
        pending = q;
        var body = '<div class="text-sm text-gray-200 whitespace-pre-line mb-3">' + q.scene() + '</div><div style="display:flex;flex-direction:column;gap:8px">';
        q.choices.forEach(function (c, i) {
            var label = (typeof c.text === 'function') ? c.text() : c.text;
            body += '<button onclick="qiyuChoose(' + i + ')" class="bg-indigo-800 hover:bg-indigo-700 text-xs px-3 py-2 rounded text-left">' + label + '</button>';
        });
        body += '<button onclick="qiyuChoose(-1)" class="bg-stone-700 hover:bg-stone-600 text-xs px-3 py-2 rounded text-left">🚶 不凑这个热闹（转身走开）</button></div>';
        if (typeof global.showModal === 'function') {
            global.showModal(q.icon + ' 奇遇 · ' + q.name, body);
            // 第一百零九波：给弹窗挂记号——之后它被顶掉或关掉，maybeTrigger 认得出「窗没了」
            try {
                var _ov = (global.document && global.document.getElementById) ? global.document.getElementById('xianxia-modal-overlay') : null;
                if (_ov && _ov.setAttribute) _ov.setAttribute('data-qiyu-pending', '1');
                pendingEl = _ov || null;
            } catch (eOv) { pendingEl = null; }
        } else {
            // 无弹窗环境（自动化/测试）：静默取消，不堵流程
            pending = null;
            pendingEl = null;
        }
    }
    /** 玩家选择（-1 = 走开） */
    function qiyuChoose(idx) {
        var q = pending;
        if (!q) return false;
        pending = null;
        pendingEl = null;
        state.done[q.id] = day();
        state.lastDay = day();
        try {
            var o = document.getElementById && document.getElementById('xianxia-modal-overlay');
            if (o && o.remove) o.remove();
        } catch (e) {}
        if (idx < 0 || !q.choices[idx]) {
            log('🌫️ 奇遇「' + q.name + '」——你转身走开了。有些缘分，看过就算见过。', 'info');
            return true;
        }
        var c = q.choices[idx];
        var won = (typeof c.ok === 'function') ? !!c.ok() : true;
        var effects = won ? c.effects : (c.failEffects || null);
        var msg = won ? c.msg : (c.failMsg || c.msg);
        if (effects && global.RewardService && typeof global.RewardService.apply === 'function') {
            try { global.RewardService.apply(effects, { source: 'qiyu_' + q.id }); } catch (e) {}
        }
        if (global.timeSystem && typeof global.timeSystem.advanceTime === 'function') {
            try { global.timeSystem.advanceTime(60, '奇遇·' + q.name); } catch (e) {}
        }
        // v21.9 机缘值入池：奇遇得手 +10 机缘——攒满 30 可在突破仪式里「燃机缘·破境必成」
        if (won) {
            try {
                var cdF = global.currentCharData;
                if (cdF) {
                    cdF.fortune = Math.min(100, (Number(cdF.fortune) || 0) + 10);
                    log('🍀 机缘到手——机缘值 +10（现在 ' + cdF.fortune + ' 点；满 30 点可在突破仪式里点燃，换一次破境必成）', 'success');
                }
            } catch (e) {}
        }
        log('✨ 奇遇「' + q.name + '」：' + msg, won ? 'success' : 'info');
        if (typeof global.showMessage === 'function') global.showMessage('✨ ' + q.name + '——' + msg, won ? 'success' : 'info');
        return true;
    }

    // ============ 接线 ============
    if (global.EventBus && typeof global.EventBus.on === 'function') {
        global.EventBus.on('location:visited', function () { try { maybeTrigger('city'); } catch (e) {} });
    }

    global.QiyuEncounters = {
        list: QIYU,
        items: QIYU_ITEMS,
        maybeTrigger: maybeTrigger,
        forceTrigger: forceTrigger,
        choose: qiyuChoose,
        candidates: candidates,
        pending: function () { return pending; },
        state: st
    };
    global.qiyuChoose = qiyuChoose;
    console.log('[qiyu] v20.94 奇遇已注册：' + QIYU.length + ' 段，奇物 ' + QIYU_ITEMS.length + ' 件');
})(typeof window !== 'undefined' ? window : this);
