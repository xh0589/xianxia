// ==================== sect-passives.js - 门里的底子：门派特色全被动化（改造批一） ====================
// 玩家拍板：特色按钮和冷却整套删除——冷却是街机语言，不是仙侠语言。
// 少林弟子皮肉沉，是因为从小练铁布衫，不是因为点了个按钮等二十个时辰。
// 重做原则：
//   一、特色=入身即有的被动（底子）：永远在身上，无按钮、无冷却、无「准备就绪」。
//   二、底子靠真实行为练：真仗/切磋/练武/读书/采药/挖矿/做工/行医/社交——你干什么，你就是什么。
//   三、四档成长：入门→小成→大成→圆满（练出来的，不是氪出来的）；枯竭年代底子打折（接主线总闸）。
//   四、战斗真读者：底子加成六维，走 buildPlayerBattleEntity 统一合并（与旧伤折损同一挂点）。
// 纪律：进度挂 discipleState._passive 随档；文案零外文字母、零配额句式、零冷却句式。
(function () {
    'use strict';
    var W = window;

    // ============ 三十六派底子表 ============
    // attrs: 每档六维加点；train: 哪些真实行为长功底；lore: 底子从哪来（命门/地形/神功）
    var PASSIVES = {
        '少林寺': { name: '外功底子', icon: '🧘', attrs: { constitution: 3, strength: 2 }, train: ['drill', 'battle'], lore: '禅武合一，皮肉是从小在罗汉堂里熬出来的——挨过打的骨头，比没挨过的经打。' },
        '武当派': { name: '以柔克刚', icon: '☯️', attrs: { dexterity: 3, meridian: 2 }, train: ['study', 'drill'], lore: '太极的圆不在招里，在一呼一吸之间——四两拨千斤，靠的是听劲。' },
        '全真教': { name: '内丹根基', icon: '⚗️', attrs: { meridian: 3, intelligence: 2 }, train: ['study'], lore: '终南山把人身当炉鼎——真气不假外求，先养自己的心王。' },
        '华山派': { name: '剑走险锋', icon: '⚔️', attrs: { dexterity: 3, strength: 2 }, train: ['drill', 'battle'], lore: '苍龙岭的天梯养出来的剑意——险处才有锋。' },
        '嵩山派': { name: '剑阵之势', icon: '🗡️', attrs: { strength: 3, constitution: 2 }, train: ['drill', 'battle'], lore: '五岳之首的剑法雄浑如山脉——一个人快不算快，一堵墙推过去才算。' },
        '恒山派': { name: '静心剑意', icon: '🛕', attrs: { willpower: 3, intelligence: 2 }, train: ['study', 'drill'], lore: '晨钟暮鼓之间练的剑——琴声里有慈悲，剑意里有静气。' },
        '衡山派': { name: '剑气箫心', icon: '🎻', attrs: { intelligence: 3, dexterity: 2 }, train: ['study', 'drill'], lore: '南岳的火主阴阳调和——回雁峰的琴音揉进剑里，轻快，也绵长。' },
        '泰山派': { name: '稳如泰山', icon: '🪨', attrs: { constitution: 3, strength: 2 }, train: ['drill'], lore: '十八盘的石阶一级一级都是基本功——泰山如坐，剑意厚重端正。' },
        '峨眉派': { name: '侠骨慈心', icon: '🌸', attrs: { willpower: 3, dexterity: 2 }, train: ['drill', 'heal'], lore: '佛道兼修，琴剑杖同源——三分侠气，七分慈悲。' },
        '丐帮': { name: '百耳通街', icon: '👂', attrs: { intelligence: 3, dexterity: 2 }, train: ['social'], lore: '天下消息一半在庙堂，另一半在墙根底下——丐帮弟子的耳朵长在墙根。', special: 'ears' },
        '大旗门': { name: '军阵杀伐', icon: '🏴', attrs: { strength: 3, willpower: 2 }, train: ['drill', 'battle'], lore: '汴京的军阵生在沙场——旗进人进，长兵齐扫。' },
        '侠隐阁': { name: '百家武学', icon: '🏯', attrs: { strength: 2, dexterity: 3 }, train: ['drill', 'battle'], lore: '阁里收百家之长——招招都有来处，市井把式也是功夫。' },
        '药王谷': { name: '辨毒眼', icon: '💊', attrs: { intelligence: 3, constitution: 2 }, train: ['gather', 'heal', 'craft'], lore: '药王谷的本事不在炼丹，在认毒——毒认全了一味，你就是能救人的那个人。' },
        '天山派': { name: '雪魄冰心', icon: '❄️', attrs: { meridian: 3, willpower: 2 }, train: ['study', 'drill'], lore: '天山的心法在「冷」字诀——雪魄入体，气机自回。' },
        '铸剑山庄': { name: '知刃', icon: '🔨', attrs: { constitution: 3, dexterity: 2 }, train: ['craft', 'mine'], lore: '打铁先打身——听得出炉温、看得出血线的人，手里的刃也听话。', special: 'blade' },
        '茅山派': { name: '符箓养神', icon: '📜', attrs: { willpower: 3, intelligence: 2 }, train: ['study', 'craft'], lore: '朱砂落纸，笔笔是功课——符成之前，先成的是人。' },
        '大隐阁': { name: '藏锋不露', icon: '🌫️', attrs: { dexterity: 3, willpower: 2 }, train: ['study', 'battle'], lore: '收过锋的人，最知道锋从哪儿来。' },
        '天书阁': { name: '万卷在心', icon: '📖', attrs: { intelligence: 3, meridian: 2 }, train: ['study'], lore: '天下书籍尽入此楼——读进去的是字，长出来的是见识。' },
        '天涯海阁': { name: '笔墨藏锋', icon: '🖌️', attrs: { intelligence: 3, dexterity: 2 }, train: ['study', 'social'], lore: '一篇文章里藏着金戈铁马——文人的兵刃不在袖里。' },
        '神机门': { name: '天工巧手', icon: '⚙️', attrs: { intelligence: 3, dexterity: 2 }, train: ['craft', 'mine'], lore: '机括咬合之间，木石也会咬人——手稳的人，心也稳。' },
        '霹雳堂': { name: '火眼金睛', icon: '🧨', attrs: { intelligence: 3, willpower: 2 }, train: ['craft', 'battle'], lore: '炉里的火药认生死——一响之内的规矩，由不得手抖。' },
        '昆仑派': { name: '雪山剑骨', icon: '🏔️', attrs: { constitution: 3, willpower: 2 }, train: ['study', 'drill'], lore: '西域玄门的活化石——剑意与雪线一样老，也一样硬。' },
        '金刚宗': { name: '金刚不坏', icon: '💪', attrs: { constitution: 4, strength: 1 }, train: ['drill', 'mine'], lore: '密宗苦行把皮肉炼成金刚——五百罗汉的拳印，掌掌都是功课。' },
        '青城派': { name: '幽境剑意', icon: '🍃', attrs: { dexterity: 3, intelligence: 2 }, train: ['study', 'drill'], lore: '蜀中的雾气养人，也养剑——幽境里出来的锋都不响。' },
        '蓬莱派': { name: '水眸月影', icon: '🌊', attrs: { meridian: 3, dexterity: 2 }, train: ['study', 'drill'], lore: '一瓢海水里半是幻半是真——分不开，才算学会。' },
        '五仙教': { name: '蛊心相连', icon: '🐛', attrs: { intelligence: 3, willpower: 2 }, train: ['gather', 'battle'], lore: '蛊虫认主之前先认人心——养蛊即养性。' },
        '逍遥派': { name: '逍遥随心', icon: '🍶', attrs: { meridian: 3, dexterity: 2 }, train: ['study', 'social'], lore: '缥缈峰的门规只有一条：心宽即是逍遥——出手之前，先把胜负放下。' },
        '唐门': { name: '例无虚发', icon: '🎯', attrs: { dexterity: 4, intelligence: 1 }, train: ['craft', 'battle'], lore: '袖箭里的准头是喂出来的——唐门不出空手，家底全在手上。' },
        '百花谷': { name: '香沁体肤', icon: '🌺', attrs: { constitution: 3, intelligence: 2 }, train: ['gather', 'heal'], lore: '医武双修——花香里藏着暗器的冷光，救人和伤人用的是同一双手。' },
        '铁掌帮': { name: '铁掌透劲', icon: '✋', attrs: { strength: 4, constitution: 1 }, train: ['drill', 'mine'], lore: '洞庭湖的掌讲一个「透」字——掌风到时，铁砂还没到。' },
        '修罗宫': { name: '血引', icon: '🩸', attrs: { strength: 4, dexterity: 1 }, train: ['battle', 'spar'], lore: '修罗宫不拜神，拜血——真仗打出来的杀意，攒一层，刀就快一层。' },
        '阎罗殿': { name: '霸道刀势', icon: '🔥', attrs: { strength: 3, willpower: 2 }, train: ['battle', 'drill'], lore: '刀出鞘先向人间要买路钱——给不给，都得过。' },
        '血手门': { name: '爪风带毒', icon: '🩸', attrs: { dexterity: 3, strength: 2 }, train: ['battle', 'gather'], lore: '关外的爪功狠辣——见血封喉，门里的规矩是手上不能干净。' },
        '飞蝎坞': { name: '水遁无形', icon: '💧', attrs: { dexterity: 3, constitution: 2 }, train: ['drill', 'battle'], lore: '水网纵横的暗桩——针细如蝎尾，快如水影。' },
        '烈日教': { name: '真火焚身', icon: '☀️', attrs: { constitution: 3, strength: 2 }, train: ['drill', 'battle'], lore: '借一缕真火入体，焚开穴窍——火性烈，人也得烈。' },
        '天龙教': { name: '八部天神', icon: '🐉', attrs: { strength: 3, intelligence: 2 }, train: ['battle', 'study'], lore: '借魔的名头，走人间的路——八部神功，练的是胆。' }
    };
    var LEVELS = [
        { name: '入门', need: 0 },
        { name: '小成', need: 100 },
        { name: '大成', need: 260 },
        { name: '圆满', need: 500 }
    ];

    function ds() { return W.discipleState || null; }
    function passiveState() {
        var d = ds(); if (!d) return null;
        if (!d._passive) d._passive = { xp: 0 };
        return d._passive;
    }
    function sectName() { var d = ds(); return (d && d.isInSect && (d.sectName || d.sectId)) || null; }
    function def(sect) { return PASSIVES[sect] || null; }
    function witherMul() {
        try { return Number((W.eventFlags || {})['qi_stage'] || 0) >= 2 ? 0.75 : 1; } catch (e) { return 1; }
    }
    function levelOf(xp) {
        var lv = 0;
        for (var i = LEVELS.length - 1; i >= 0; i--) { if (xp >= LEVELS[i].need) { lv = i; break; } }
        return lv;
    }
    W.sectPassiveLevel = function () {
        var st = passiveState();
        return st ? levelOf(Number(st.xp) || 0) : 0;
    };
    // 战斗真读者：底子加成六维（buildPlayerBattleEntity 统一合并）
    W.sectPassiveAttrs = function () {
        var out = {};
        var sect = sectName();
        var p = sect && def(sect);
        if (!p) return out;
        var lv = W.sectPassiveLevel();
        if (lv <= 0) return out;
        var mul = witherMul();
        for (var k in p.attrs) {
            out[k] = Math.round(p.attrs[k] * lv * mul * 10) / 10;
        }
        return out;
    };
    // 行为练功：真实行为长功底（战斗胜利/切磋/练武/读书/采药/挖矿/做工/行医/社交）
    var TRAIN_XP = { battle: 10, spar: 6, drill: 5, study: 5, gather: 4, mine: 4, craft: 5, heal: 4, social: 3 };
    W.sectPassiveTrain = function (kind, quiet) {
        var sect = sectName();
        var p = sect && def(sect);
        var st = passiveState();
        if (!p || !st) return 0;
        if (!p.train || p.train.indexOf(kind) < 0) return 0;
        var before = levelOf(Number(st.xp) || 0);
        st.xp = (Number(st.xp) || 0) + (TRAIN_XP[kind] || 3);
        var after = levelOf(st.xp);
        if (after > before && !quiet) {
            var line = '✨ 「' + p.name + '」练到了' + LEVELS[after].name + '——' + sect + '的底子又深了一层。' + (after === 3 ? '圆满了。门里老人说：往后的路，底子替你垫着。' : '');
            try { if (W.gameLog && W.gameLog.add) W.gameLog.add(line, 'success'); } catch (e) {}
            if (typeof W.showMessage === 'function') W.showMessage(line, 'success');
        }
        return st.xp;
    };
    // 特殊底子的零散读者
    W.sectPassiveHas = function (special) {
        var sect = sectName();
        var p = sect && def(sect);
        return !!(p && p.special === special && W.sectPassiveLevel() >= 1);
    };
    // 换派/出师清空（入门重新练）——由 joinSect 钩子调用
    W.sectPassiveReset = function () {
        var d = ds();
        if (d) d._passive = { xp: 0 };
    };
    // ============ UI：门中底子卡（顶替旧特色按钮卡） ============
    W.sectPassiveCard = function (sect) {
        var p = def(sect);
        if (!p) return '';
        var st = passiveState();
        var mine = sectName() === sect;
        var xp = (mine && st) ? (Number(st.xp) || 0) : 0;
        var lv = mine ? levelOf(xp) : 0;
        var next = LEVELS[lv + 1];
        var wm = witherMul();
        var attrTxt = Object.keys(p.attrs).map(function (k) {
            var NAMES = { strength: '力量', dexterity: '灵巧', intelligence: '神识', willpower: '意志', constitution: '体质', meridian: '经脉' };
            return (NAMES[k] || k) + '+' + Math.round(p.attrs[k] * lv * wm * 10) / 10;
        }).join(' ');
        var TRAIN_WORD = { battle: '真仗', spar: '切磋', drill: '练武', study: '读书参悟', gather: '采药', mine: '挖矿', craft: '做工淬炼', heal: '行医', social: '闲谈交际' };
        var howTrain = (p.train || []).map(function (t) { return TRAIN_WORD[t] || t; }).join('、');
        var html = '<div class="bg-gray-800/40 p-3 rounded border ' + (mine ? 'border-purple-600' : 'border-gray-700') + ' mb-4">'
            + '<div class="flex items-center gap-2">'
            + '<span class="text-2xl">' + p.icon + '</span>'
            + '<div class="flex-1">'
            + '<p class="font-bold text-sm text-white">' + p.icon + ' 门中底子 · ' + p.name + (mine ? ' <span class="text-xs text-purple-300">' + LEVELS[lv].name + '</span>' : '') + '</p>'
            + '<p class="text-xs text-gray-400 mt-1">' + p.lore + '</p>'
            + (mine
                ? '<p class="text-xs text-purple-400 mt-1">' + (lv > 0 ? '现在的底子：' + attrTxt : '还没练出底子——去' + howTrain + '，功夫自己会长') + (wm < 1 ? ' <span class="text-gray-500">（枯年气薄，底子打折）</span>' : '') + '</p>'
                    + (next ? '<p class="text-xs text-gray-500 mt-1">练到「' + next.name + '」还差 ' + (next.need - xp) + ' 分功底——' + howTrain + '都算练。</p>' : '<p class="text-xs text-amber-300/70 mt-1">底子已至圆满——' + howTrain + '，一日日练出来的。</p>')
                : '<p class="text-xs text-gray-500 mt-1">这是' + sect + '弟子的底子——入了门，它才长在你身上。</p>')
            + '</div></div></div>';
        return html;
    };
    W.SECT_PASSIVES = PASSIVES;
    W.sectPassiveProbe = function () {
        var st = passiveState();
        return { sect: sectName(), xp: st ? (Number(st.xp) || 0) : 0, level: W.sectPassiveLevel(), attrs: W.sectPassiveAttrs(), witherMul: witherMul() };
    };

    console.log('[sect-passives] 门中底子已注册：三十六派被动特色（无按钮无冷却，行为练级四档成长，战斗真读者+枯年打折）');
})();
