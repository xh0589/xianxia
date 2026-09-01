/**
 * storylines-v2/batch3.js — NPC故事线重写·第三批（收官）（v13.5）
 *
 * 收录：玄冰子(elder_01) / 柳随风(rival_01) / 张大爷(villager_01)
 *       / 铁匠老王(craftsman_01) / 神秘老者(mysterious_01)
 * 格式与 batch1/batch2 完全一致（五段线：相遇→交集→秘密→抉择→终章）。
 * 终章 _dynamicScenes 复用 batch1 的全局 triggerPersonalEvent 包装；
 * 秘密注入与自动触发挂钩为链式幂等包装（batch1→batch2→batch3→原生）。
 */
(function () {
    'use strict';

    // ============ 抉择读写（全局缺失时本地兜底） ============
    var LS_KEY = 'xianxia_storyline_choices';
    function getChoiceFn() {
        if (typeof window.getStorylineChoice === 'function') return window.getStorylineChoice;
        return function (npcId) {
            try {
                var all = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
                return all[npcId] || null;
            } catch (e) { return null; }
        };
    }
    function recordChoiceFn() {
        if (typeof window.recordStorylineChoice === 'function') return window.recordStorylineChoice;
        return function (npcId, choice) {
            var all = {};
            try { all = JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch (e) {}
            all[npcId] = choice;
            try { localStorage.setItem(LS_KEY, JSON.stringify(all)); } catch (e) {}
        };
    }

    // ============ 玄冰子（elder_01）============
    // 秘密底子：寒冰真气反噬入髓，撑不过三年——门派需要他这尊压山石
    var ELDER_EVENTS = {
        'elder01_event_1': {
            id: 'elder01_event_1', npcId: 'elder_01',
            title: '不化的霜', icon: '❄️',
            desc: '盛夏，他院里的石阶却结了一层薄霜。',
            minAffection: 15,
            trigger: { random: 0.4 }, cooldown: 3,
            flag: 'elder01_e1_done',
            autoTrigger: { timeRange: [6, 12], random: 0.4 },
            scenes: [
                { speaker: 'narrator', text: '三伏天的天山派，凉得舒服。唯独玄冰子居所前的石阶，霜结得比冬天还厚——弟子们说是功法异象，习以为常。', type: 'description' },
                { speaker: 'narrator', text: '你扫阶时留意了半晌：霜是从他每晨站桩的那一方石面蔓延开的，纹路呈针状，根根朝外——像是有什么东西在往外刺。', type: 'description' },
                { speaker: 'player_select', text: '你如何做？', options: [
                    { text: '默默把那方石阶的霜扫净，往后的清晨也顺手扫了', effect: 'sweep', affection: 4 },
                    { text: '去问管事弟子要些防滑的粗盐铺上', effect: 'salt', affection: 2 },
                    { text: '什么也不动，只把这件事记在心里', effect: 'remember', affection: 3 }
                ]}
            ],
            effects: function (npc, choice) {
                var aff = 0, msg = '';
                switch (choice) {
                    case 'sweep': aff = 4; msg = '第七天清晨，他破例开了门，看了一眼干净的石阶，又看了看你：「多事。」语气是冷的，门却没关。'; break;
                    case 'salt': aff = 2; msg = '粗盐铺上了，霜照结。他路过时瞥了一眼：「徒劳。」——但没让人撤掉。'; break;
                    case 'remember': aff = 3; msg = '你记下了针状霜纹的样子。后来你会知道，自己记住的是什么。'; break;
                }
                return { affection: aff, msg: msg };
            }
        },
        'elder01_event_2': {
            id: 'elder01_event_2', npcId: 'elder_01',
            title: '花圃里的药', icon: '🌿',
            desc: '你撞见他把一碗熬好的汤药倒进了花圃。',
            minAffection: 25,
            trigger: { random: 0.3 }, cooldown: 3,
            flag: 'elder01_e2_done',
            autoTrigger: { timeRange: [17, 22], random: 0.3 },
            scenes: [
                { speaker: 'narrator', text: '黄昏，你抄近路经过他的院子，正看见玄冰子端着一碗黑漆漆的汤药，手腕一斜，整碗浇进了花圃的土里。', type: 'description' },
                { speaker: 'narrator', text: '药气散出来，是驱寒毒的方子，配伍极贵。花圃里的草被浇得精神，比人先受了惠。', type: 'description' },
                { speaker: 'npc', text: '看见了？', emotion: 'cold' },
                { speaker: 'narrator', text: '他没有辩解，也没有让你保密，只是淡淡地补了一句。', type: 'description' },
                { speaker: 'npc', text: '药是给病人喝的。我不喝。——去吧。', emotion: 'proud' },
                { speaker: 'player_select', text: '你如何做？', options: [
                    { text: '「花圃受不起这么贵的药。您受得起。」', effect: 'needle', affection: 5 },
                    { text: '一言不发，第二天把药渣里最贵的一味主药的采买路子打听到了', effect: 'silent_do', affection: 4 },
                    { text: '行礼退下，当没看见', effect: 'bow_out', affection: 1 }
                ]}
            ],
            effects: function (npc, choice) {
                var aff = 0, msg = '';
                switch (choice) {
                    case 'needle': aff = 5; msg = '他握着空碗的手紧了紧，半晌，从鼻子里哼出一声：「牙尖嘴利。」——但那天夜里，厨房的人看见药碗第一次是空的送回来的。'; break;
                    case 'silent_do': aff = 4; msg = '三天后你把那条雪线莲的采买路子递到他案上，一句话没说。他盯着纸看了很久：「……倒会办事。」'; break;
                    case 'bow_out': aff = 1; msg = '他看着你的背影消失在院门外，把碗搁下了。花圃的草又精神了一天。'; break;
                }
                return { affection: aff, msg: msg };
            }
        },
        'elder01_event_3': {
            id: 'elder01_event_3', npcId: 'elder_01',
            title: '红冰', icon: '🩸',
            desc: '深夜的演武场外，你听见一声闷响。',
            minAffection: 35,
            trigger: { random: 0.3 }, cooldown: 0,
            flag: 'elder01_e3_done',
            autoTrigger: { timeRange: [21, 24], random: 0.3 },
            unlockSecret: 'elder_secret_01',
            scenes: [
                { speaker: 'narrator', text: '子夜，演武场方向传来一声闷响，像冰面开裂。你赶过去——玄冰子单膝跪在场地中央，一手扶着插在地上的长剑，指缝间渗出的血落在青石上。', type: 'description' },
                { speaker: 'narrator', text: '血没有洇开。它落地即冻，冻成一小片一小片暗红的冰，像谁把红梅砸碎在了石头上。', type: 'description' },
                { speaker: 'narrator', text: '他抬手止住你上前，靠着剑喘了很久，才把话说出口。', type: 'description' },
                { speaker: 'npc', text: '反噬入髓了。寒冰功百年，前八十年是我驭气，后二十年，是气驭我。每运功一次，如万针穿髓。', emotion: 'heavy' },
                { speaker: 'npc', text: '郎中的意思，三年。北境三宗盯着天山的地界，掌门闭死关，这派里能压住场面的只有我一尊金丹。……我倒不得。', emotion: 'deep' },
                { speaker: 'player_select', text: '你如何回应？', options: [
                    { text: '「压山石的裂缝，该让信得过的人知道——比如我。」', effect: 'trust_me', affection: 6 },
                    { text: '「三年可以做很多事。从今晚起，您的药我盯着喝。」', effect: 'steward', affection: 5 },
                    { text: '蹲下来，把地上那些红冰一块块敲碎掩进雪里', effect: 'cover', affection: 5 }
                ]}
            ],
            effects: function (npc, choice) {
                var aff = 0, msg = '', secretId = null;
                switch (choice) {
                    case 'trust_me': aff = 6; msg = '他盯着你看了很久，久到落雪都积了你一肩。「……好。你是第二个知道的。第一个是掌门，他在关里，还不知道。」'; break;
                    case 'steward': aff = 5; msg = '「盯着？」他从鼻腔里笑出声，「我这辈子没人敢盯。」——但次日清晨，药碗第一次见了底。'; break;
                    case 'cover': aff = 5; msg = '你敲碎红冰的时候他就站在旁边看着，忽然开口：「不必埋。让它留着——总有一天，藏不住了再说。」'; break;
                }
                secretId = 'elder_secret_01';
                return { affection: aff, msg: msg, secretId: secretId };
            }
        },
        'elder01_event_4': {
            id: 'elder01_event_4', npcId: 'elder_01',
            title: '传印', icon: '🏔️',
            desc: '反噬加速了。他把毕生的东西摆在你面前，让你陪他做最后一道题。',
            minAffection: 45,
            trigger: { random: 0.3 }, cooldown: 0,
            flag: 'elder01_e4_done',
            autoTrigger: { random: 0.3 },
            scenes: [
                { speaker: 'narrator', text: '入冬后反噬骤然加速——他左手的三根手指开始常年僵冷，握不住笔。他把两样东西摆在石桌上：一枚掌门信物的副印，一件通体幽蓝的空法器「寒渊镜」。', type: 'description' },
                { speaker: 'npc', text: '郎中改口了。不是三年，是一年。再往后，寒毒侵脉，会先冻住心智——我会变得不认人，像块真正的冰。', emotion: 'heavy' },
                { speaker: 'npc', text: '在那之前，我得选。所以叫你来——你见过我最多的狼狈，这道题，你有一票。', emotion: 'serious' },
                { speaker: 'player_select', text: '此抉择无法回头——三条路，你推哪条？', options: [
                    { text: '「自封修为，卸下金丹保命。做个教蒙童的老先生，安安稳稳活到老。」', effect: 'seal' },
                    { text: '「把毕生真气灌进寒渊镜，留给门派后辈。油尽灯枯，灯却是长明的。」', effect: 'vessel' },
                    { text: '「赌。冲金丹大圆满——成了反噬自解重续三十年，败了……也比冻成一块不认人的冰强。」', effect: 'breakthrough' }
                ]}
            ],
            effects: function (npc, choice) {
                recordChoiceFn()('elder_01', choice);
                var aff = 0, msg = '';
                switch (choice) {
                    case 'seal': aff = 4; msg = '他沉默良久：「自封修为……四十年前我会啐你一脸。现在听着，竟有点馋。」'; break;
                    case 'vessel': aff = 4; msg = '「化进镜子里，守着天山。」他摩挲着幽蓝的镜面，「这结局，配得上我这一身功。」'; break;
                    case 'breakthrough': aff = 5; msg = '他眼里头一回烧起一点火，很快又按下去：「大圆满的门槛，我摸了三十年不敢跨——你知道为什么吗？怕败了误了门派。如今倒是你提醒我：横竖都是误，不如搏一回。」'; break;
                }
                return { affection: aff, msg: msg };
            }
        },
        'elder01_event_5': {
            id: 'elder01_event_5', npcId: 'elder_01',
            title: '终章·雪停的时候', icon: '🌤️',
            desc: '那一日来了。',
            minAffection: 55,
            trigger: { random: 0.3 }, cooldown: 0,
            flag: 'elder01_e5_done',
            // 终章仅手动触发：无 autoTrigger
            _dynamicScenes: function () {
                var c = getChoiceFn()('elder_01');
                if (c === 'seal') {
                    return [
                        { speaker: 'narrator', text: '自封修为那一日，他把自己关在密室一天一夜。出来时还是那身蓝袍，只是周身的寒气没有了——走在太阳底下，像个普通的清瘦老人。', type: 'description' },
                        { speaker: 'narrator', text: '北境三宗探过风声，试探着在边境磨蹭了几回，见天山依旧戒备森严，终究没敢动。他们不知道，压山的石已经换成了满山不知情的胆气。', type: 'description' },
                        { speaker: 'narrator', text: '如今的玄冰子在山下蒙学堂教书，教一群流着鼻涕的娃娃认字。你去看他，他正拿戒尺敲桌沿，教一个「永」字。', type: 'description' },
                        { speaker: 'npc', text: '「永」字八法，点、横、竖、钩……写不好这个字，练什么剑。', emotion: 'warm' },
                        { speaker: 'player_select', text: '你如何回应？', options: [
                            { text: '「您现在教的字，将来能挡刀。」', effect: 'words', affection: 7 },
                            { text: '在他身边的空位坐下，陪了一堂课', effect: 'sit_in', affection: 6 }
                        ]}
                    ];
                }
                if (c === 'vessel') {
                    return [
                        { speaker: 'narrator', text: '灌顶进行了三天三夜。第三夜子时，寒渊镜通体大亮，映得半座天山如昼——随后光敛，镜沉如水。', type: 'description' },
                        { speaker: 'narrator', text: '他坐在镜前没有起身，背脊挺直，须眉皆白，唇边带着一点笑。掌门出关后追赐他「镇山长老」之位，葬于剑冢之上。', type: 'description' },
                        { speaker: 'narrator', text: '如今每年冬至，全派弟子会在寒渊镜前集体练功。镜面的寒气百年不散，呵气成霜——老人们说，那是他还在看着。', type: 'description' },
                        { speaker: 'player_select', text: '冬至夜，你在镜前站了很久。你说了句什么？', options: [
                            { text: '「您这盏灯，比谁点的都亮。」', effect: 'lamp', affection: 7 },
                            { text: '什么也没说，只把一套拳从头到尾打得端端正正', effect: 'form', affection: 8 }
                        ]}
                    ];
                }
                // breakthrough（默认分支）
                return [
                    { speaker: 'narrator', text: '他闭死了关。第七日，北境天地变色，一股寒潮自天山之巅席卷千里，邻宗连夜遣人来问是否出了变故。', type: 'description' },
                    { speaker: 'narrator', text: '第八日清晨，关门开了。他一步跨出来——头发全白了，白得像落满了雪，可腰杆挺得笔直，周身寒气凝而不散，收放由心。', type: 'description' },
                    { speaker: 'npc', text: '大圆满。反噬压回去了十年。', emotion: 'calm' },
                    { speaker: 'npc', text: '十年，够我把北境的事一样一样安排完。够我把蒙学堂也办起来——文脉这种东西，比剑经传得远。', emotion: 'warm' },
                    { speaker: 'player_select', text: '你如何回应？', options: [
                        { text: '「恭喜您，赌赢了。」', effect: 'won', affection: 7 },
                        { text: '「十年之后呢？」——「十年之后再赌一场。到时候你还陪着，我就还敢。」', effect: 'again', affection: 8 }
                    ]}
                ];
            },
            scenes: [],
            effects: function (npc, choice) {
                var aff = 0, msg = '';
                switch (choice) {
                    case 'words': aff = 7; msg = '他执戒尺的手顿了顿，难得没有反驳：「……这话，等他们长大了，你自己说给他们听。」'; break;
                    case 'sit_in': aff = 6; msg = '一堂课结束，娃娃们跑光了。他收拾书案，忽然说：「下堂课讲《千字文》。你也带本子。」——这是他收学生的说法。'; break;
                    case 'lamp': aff = 7; msg = '镜面轻轻起了一层霜花，转瞬化了。守镜的弟子说是风。你知道不是。'; break;
                    case 'form': aff = 8; msg = '一套拳打完，你呵出的白气久久不散。镜面上，霜花开成了一圈，像有人沿着边缘，慢慢鼓了一次掌。'; break;
                    case 'won': aff = 7; msg = '「赢？」他望着山下层层叠叠的雪原，「我这是跟老天爷讨回了十年的利息。本金，还得继续挣。」'; break;
                    case 'again': aff = 8; msg = '他愣了一下，随即大笑起来——笑声震得檐上积雪扑扑往下落：「好！一言为定！」那是天山弟子们头一回听见他们最冷的长老这样笑。'; break;
                }
                return { affection: aff, msg: msg };
            }
        }
    };

    // ============ 柳随风（rival_01）============
    // 秘密底子：其实是魔教卧底——影子做了十年没做过的事
    var RIVAL_EVENTS = {
        'rival01_event_1': {
            id: 'rival01_event_1', npcId: 'rival_01',
            title: '半枚铜钱', icon: '🪙',
            desc: '酒馆结账，他掉了一枚奇怪的铜钱。',
            minAffection: 15,
            trigger: { random: 0.4 }, cooldown: 3,
            flag: 'rival01_e1_done',
            autoTrigger: { timeRange: [17, 23], random: 0.4 },
            scenes: [
                { speaker: 'narrator', text: '酒馆里柳随风请客，出手向来阔绰。结账时一枚铜钱从他袖中滚落，当啷一声——你眼尖，看见那钱的一面被人磨平了，只余半个模糊的花纹。', type: 'description' },
                { speaker: 'narrator', text: '他的动作快得惊人：铜钱还没滚到桌沿就被两根手指钉住，收进了袖子深处。全程不到半息，脸上的笑纹丝没动。', type: 'description' },
                { speaker: 'player_select', text: '你如何做？', options: [
                    { text: '只当没看见，举杯继续聊', effect: 'drink', affection: 2 },
                    { text: '「你这钱有点意思——哪来的？」', effect: 'ask', affection: 3 },
                    { text: '替他把话岔开，冲小二喊再来一壶', effect: 'cover', affection: 4 }
                ]}
            ],
            effects: function (npc, choice) {
                var aff = 0, msg = '';
                switch (choice) {
                    case 'drink': aff = 2; msg = '那晚他喝得很尽兴。临走时拍了拍你的肩：「跟你喝酒不用防备，难得。」'; break;
                    case 'ask': aff = 3; msg = '「旧年间的玩意儿，」他晃了晃杯子，「有些东西磨掉一半，才好用在另一半上。」——答了，等于没答。'; break;
                    case 'cover': aff = 4; msg = '他深深看了你一眼，笑意到了眼底：「你这朋友，交得。」'; break;
                }
                return { affection: aff, msg: msg };
            }
        },
        'rival01_event_2': {
            id: 'rival01_event_2', npcId: 'rival_01',
            title: '离奇获释', icon: '🔓',
            desc: '秘境冲突中被掳的正道弟子，毫发无伤地回来了。',
            minAffection: 25,
            trigger: { random: 0.3 }, cooldown: 3,
            flag: 'rival01_e2_done',
            autoTrigger: { random: 0.3 },
            scenes: [
                { speaker: 'narrator', text: '江湖传闻：上月秘境冲突里被魔教掳走的青云弟子回来了，毫发无伤，只说「看守半夜换岗松懈」。', type: 'description' },
                { speaker: 'narrator', text: '可你听回来的当事人私下嘀咕过一句怪话：那晚看守给他松了绑，塞了两个馒头，还低声说了句「往南走，别回头」。那嗓音他总觉得耳熟。', type: 'description' },
                { speaker: 'player_select', text: '你如何做？', options: [
                    { text: '把这句怪话记下来，不动声色', effect: 'note', affection: 2 },
                    { text: '找柳随风喝酒，状似无意提起这桩新闻', effect: 'probe', affection: 3 },
                    { text: '「耳熟的嗓音……会不会是你认识的人？」直接问他', effect: 'direct', affection: 4 }
                ]}
            ],
            effects: function (npc, choice) {
                var aff = 0, msg = '';
                switch (choice) {
                    case 'note': aff = 2; msg = '这条线索静静躺在你的记忆里。直到某一天，它会和另一件事对上。'; break;
                    case 'probe': aff = 3; msg = '他转着酒杯听完，笑道：「魔教也有蠢货嘛。」——杯底压着的指节，白了白。'; break;
                    case 'direct': aff = 4; msg = '他挑了挑眉：「认识我的人多了。江湖上嗓音相似的，总有那么百八十个。」——但他没笑。'; break;
                }
                return { affection: aff, msg: msg };
            }
        },
        'rival01_event_3': {
            id: 'rival01_event_3', npcId: 'rival_01',
            title: '两份名册', icon: '📜',
            desc: '密林深处的火光，和一份没烧完的名册。',
            minAffection: 35,
            trigger: { random: 0.3 }, cooldown: 0,
            flag: 'rival01_e3_done',
            autoTrigger: { random: 0.3 },
            unlockSecret: 'rival_secret_01',
            scenes: [
                { speaker: 'narrator', text: '你夜间穿林，看见一处火堆旁有人在烧东西。火光照出的侧脸——柳随风。他一张一张地把纸页喂进火里，动作很慢，像在烧自己的日子。', type: 'description' },
                { speaker: 'narrator', text: '你踩断了枯枝。他霍然回头，手里的纸页飘落在你们两人之间。你抢在火燎到之前拾起一角——是份抄本：各派布防、换防时刻、暗哨点位。', type: 'description' },
                { speaker: 'npc', text: '……抢到就看完吧。反正你要看的，不止这一张。', emotion: 'bitter' },
                { speaker: 'narrator', text: '他索性盘腿坐了下来，从怀里掏出另一本册子丢给你——封皮写着《随风录》。里面一笔一笔记着：某年月日，青云门张某，释于南麓；某年月日，百花谷李氏兄妹，纵于渡口……整整十年，一百一十七人。', type: 'description' },
                { speaker: 'npc', text: '我是幽阑教的暗桩，代号随风。布防图是我的差事，我拖了三个月，今天烧了。烧了就是叛教，格杀勿论的那种叛。', emotion: 'neutral' },
                { speaker: 'npc', text: '这本册子上的一百一十七个人，是我拿命换回来还的。我不是好人——我只是个干了点别的坏事的坏人。', emotion: 'deep' },
                { speaker: 'player_select', text: '你如何回应？', options: [
                    { text: '「一百一十七条命，够把你从『坏人』里赎出来了。」', effect: 'redeem', affection: 6 },
                    { text: '「布防图烧了，名册还在写。接下来打算怎么办？」', effect: 'next', affection: 4 },
                    { text: '把布防图的残页也递进火堆里，帮他一起烧完', effect: 'burn_too', affection: 6 }
                ]}
            ],
            effects: function (npc, choice) {
                var aff = 0, msg = '', secretId = null;
                switch (choice) {
                    case 'redeem': aff = 6; msg = '他笑了，笑得有点狼：「赎？江湖上可没有这个规矩。」——但那晚他把《随风录》送给了你：「拿着。哪天我死了，总得有人记得我不是全坏的。」'; break;
                    case 'next': aff = 4; msg = '「怎么办？」他仰头看林梢的月亮，「走一步看一步。影子过日子，从来不看五年以后。」'; break;
                    case 'burn_too': aff = 6; msg = '火苗蹿高的时候，他一直看着你。「这张纸值三千两黄金。」他说，「你现在也是同犯了。感觉如何？」——「还行。」「那就好。同犯比朋友可靠。」'; break;
                }
                secretId = 'rival_secret_01';
                return { affection: aff, msg: msg, secretId: secretId };
            }
        },
        'rival01_event_4': {
            id: 'rival01_event_4', npcId: 'rival_01',
            title: '召回令', icon: '🕯️',
            desc: '三十日内回总坛述职——不去是死，去了多半也是。',
            minAffection: 45,
            trigger: { random: 0.3 }, cooldown: 0,
            flag: 'rival01_e4_done',
            autoTrigger: { random: 0.3 },
            scenes: [
                { speaker: 'narrator', text: '召回令是一支黑羽箭，钉在他的门框上。三十日内回总坛述职，逾期以叛论处。而布防图失焚的消息显然已经传回去了——述职，多半是灭口。', type: 'description' },
                { speaker: 'npc', text: '有意思的是另一件事。我手里还有最后一份情报，最要命的：半年后中秋，幽阑教要血洗云来城，祭旗。', emotion: 'serious' },
                { speaker: 'narrator', text: '他把黑羽箭折成两段，扔进火盆。「回去是死，不回也是死。区别只在——云来城的十几万口人，能不能沾我的死捞点好处。」', type: 'description' },
                { speaker: 'player_select', text: '此抉择无法回头——你怎么说？', options: [
                    { text: '「把情报交给正道，我帮你安排投诚。审查营里熬几年，换个明面上的活法。」', effect: 'defect' },
                    { text: '「回去。虎穴里周旋，能拖一天是一天——城那边，我来想办法。」', effect: 'return' },
                    { text: '「带着你的人远走高飞。谁都别做了——江湖这么大，总有容身之处。」', effect: 'flee' }
                ]}
            ],
            effects: function (npc, choice) {
                recordChoiceFn()('rival_01', choice);
                var aff = 0, msg = '';
                switch (choice) {
                    case 'defect': aff = 4; msg = '「投诚……」他念叨着这两个字，像在尝一味没吃过的菜，「影子站到太阳底下。晒脱几层皮，总归是活的。」'; break;
                    case 'return': aff = 6; msg = '他愣住了：「你知道回去是什么下场。」「知道。」「……哈。」他仰头把杯中酒干了个底朝天，「行。你既然敢接城那边，我就敢回虎穴。这买卖对等。」'; break;
                    case 'flee': aff = 4; msg = '他沉默了很久很久，久到你以为他要答应了。「跑？我跑了，暗线里那些跟我一样阳奉阴违的，第一个被清算。……让我想想。让我好好想想。」'; break;
                }
                return { affection: aff, msg: msg };
            }
        },
        'rival01_event_5': {
            id: 'rival01_event_5', npcId: 'rival_01',
            title: '终章·影子的去向', icon: '🌗',
            desc: '后来的事，后来的说法。',
            minAffection: 55,
            trigger: { random: 0.3 }, cooldown: 0,
            flag: 'rival01_e5_done',
            // 终章仅手动触发：无 autoTrigger
            _dynamicScenes: function () {
                var c = getChoiceFn()('rival_01');
                if (c === 'defect') {
                    return [
                        { speaker: 'narrator', text: '情报换来了庇护，也换来了三年的软禁审查。正道各派轮番提审，他一条一条地答，答完了就在院里晒太阳。', type: 'description' },
                        { speaker: 'narrator', text: '云来城按情报换了三次城防布置。中秋那夜，魔教的人马在城外四十里扑了个空，悻悻而去。十几万口人，什么都不知道。', type: 'description' },
                        { speaker: 'narrator', text: '你去审查营看他，他坐在院里跟看守下棋，用的是他那套只动兵卒的路数。', type: 'description' },
                        { speaker: 'npc', text: '影子头一回站在太阳底下——还挺晒的。', emotion: 'happy' },
                        { speaker: 'player_select', text: '你如何回应？', options: [
                            { text: '「晒着吧。晒够了，就是个正经人了。」', effect: 'sun', affection: 7 },
                            { text: '坐下替他走了一步棋——用的正是他从不舍得动的车', effect: 'rook', affection: 6 }
                        ]}
                    ];
                }
                if (c === 'flee') {
                    return [
                        { speaker: 'narrator', text: '多年以后，南方的水乡小镇上流行着一个说书段子：《影子侠》，讲一个大盗专偷魔教的账本，救被掳的孩子，来无影去无踪。', type: 'description' },
                        { speaker: 'narrator', text: '你在茶棚里听完这段书，放下茶钱起身。门口擦肩走过一个戴斗笠的男人，牵着一个扎羊角辫的小哑女，斗笠压得很低。', type: 'description' },
                        { speaker: 'narrator', text: '谁也没有停下，谁也没有戳穿。走出十步，背后传来很轻的一声：「……茶钱我付过了。」', type: 'description' },
                        { speaker: 'player_select', text: '你如何回应？', options: [
                            { text: '头也不回地摆了摆手', effect: 'wave', affection: 7 },
                            { text: '大声对茶棚老板说：「方才那位客官，是个大好人。」', effect: 'goodman', affection: 6 }
                        ]}
                    ];
                }
                // return（默认分支）
                return [
                    { speaker: 'narrator', text: '他回去了。三个月杳无音信。', type: 'description' },
                    { speaker: 'narrator', text: '然后江湖上传来消息：幽阑教总坛内乱，暗桩「随风」死于乱军之中，尸首烧得只剩半枚磨花的铜钱。同一个月，云来城的城防连换三任布置，中秋之夜固若金汤——魔教的祭旗计划，不了了之。', type: 'description' },
                    { speaker: 'narrator', text: '又过了一年。某个北方的渡口，你看见一个戴斗笠的人牵着个哑女排队上船。船家收钱时，那人袖口滑出半枚铜钱，又被两根手指不动声色地钉了回去。', type: 'description' },
                    { speaker: 'narrator', text: '他没有看你。只是在登船之前，朝着你的方向，遥遥举了举手里的酒葫芦。', type: 'description' },
                    { speaker: 'player_select', text: '你如何回应？', options: [
                        { text: '举起酒壶，隔空碰了一下', effect: 'toast', affection: 7 },
                        { text: '转身就走，把整个渡口的喧哗留给他', effect: 'walk', affection: 6 }
                    ]}
                ];
            },
            scenes: [],
            effects: function (npc, choice) {
                var aff = 0, msg = '';
                switch (choice) {
                    case 'sun': aff = 7; msg = '「正经人有什么好。」他嘟囔着，落下一子，「不过晒着确实舒服。」那只从不让人看见的手背上，晒出了今年第一层健康的黑色。'; break;
                    case 'rook': aff = 6; msg = '他盯着那枚横冲直撞的车，半天憋出一句：「……你这是欺负我不会躲。」看守们哄堂大笑。审查营的院子里，头一回有了点人间的声音。'; break;
                    case 'wave': aff = 7; msg = '你没有回头。但你知道他看见了——这就够了。影子和影子道别，从来不需要正面。'; break;
                    case 'goodman': aff = 6; msg = '茶棚老板愣愣地重复：「大好人？」……多年后《影子侠》的新段子里，多了这么一句定场诗：人人都说影子黑，谁知影子背过谁。'; break;
                    case 'toast': aff = 7; msg = '隔着嘈杂的人声和一整条河，两只容器遥遥一碰。无声，胜过万语。'; break;
                    case 'walk': aff = 6; msg = '你走得不快不慢。身后传来船家解缆的吆喝，还有一声几不可闻的轻笑——是他一贯的那种，笑意到了眼底的那种。'; break;
                }
                return { affection: aff, msg: msg };
            }
        }
    };

    // ============ 张大爷（villager_01）============
    // 秘密底子：年轻时也曾梦想修仙——而且真的过了初选
    var VILLAGER_EVENTS = {
        'villager01_event_1': {
            id: 'villager01_event_1', npcId: 'villager_01',
            title: '田埂上的棋盘', icon: '♟️',
            desc: '村口大青石上刻着一副棋盘，刻痕深得不像随手玩的。',
            minAffection: 15,
            trigger: { random: 0.4 }, cooldown: 3,
            flag: 'villager01_e1_done',
            autoTrigger: { random: 0.4 },
            scenes: [
                { speaker: 'narrator', text: '张大爷田埂边有块大青石，石面上一副楚河汉界的棋盘，刻痕深可见凿，边角被几十年的手掌摸得溜光水滑。', type: 'description' },
                { speaker: 'player_select', text: '歇脚时你问他会不会下棋。', options: [
                    { text: '「大爷，杀一盘？」', effect: 'play', affection: 4 },
                    { text: '「这刻痕可有年头了，谁刻的呀？」', effect: 'ask_carve', affection: 3 },
                    { text: '夸这石头坐着凉快，不提棋', effect: 'stone', affection: 2 }
                ]}
            ],
            effects: function (npc, choice) {
                var aff = 0, msg = '';
                switch (choice) {
                    case 'play': aff = 4; msg = '他摆摆手说不会不会，手却在裤腿上蹭了蹭——那个动作，像是很久很久以前习惯性拈棋子的样子。'; break;
                    case 'ask_carve': aff = 3; msg = '「瞎刻的瞎刻的。」他笑呵呵地岔开话。可你分明看见，棋盘上的星位刻得分毫不差——瞎刻的人，做不到。'; break;
                    case 'stone': aff = 2; msg = '「凉快吧？夏天干活晌午都在这儿歇。」他拍拍青石，拍得像拍老伙计的肩膀。'; break;
                }
                return { affection: aff, msg: msg };
            }
        },
        'villager01_event_2': {
            id: 'villager01_event_2', npcId: 'villager_01',
            title: '凌晨的吐纳', icon: '🌅',
            desc: '借宿村里的凌晨，你看见院子里有个笨拙又认真的影子。',
            minAffection: 25,
            trigger: { random: 0.3 }, cooldown: 3,
            flag: 'villager01_e2_done',
            autoTrigger: { timeRange: [4, 7], random: 0.3 },
            scenes: [
                { speaker: 'narrator', text: '你借宿张家，天不亮被院里窸窣的声音弄醒。扒窗一看：张大爷站在院当中，双臂缓缓起落，配合着一长一短的呼吸——动作僵硬得像木偶，却一丝不苟。', type: 'description' },
                { speaker: 'narrator', text: '那是最基础的引气诀起手式。而且是几十年前的老版本——如今门派的教材早就简化了。', type: 'description' },
                { speaker: 'player_select', text: '你如何做？', options: [
                    { text: '不出声，等他收了式再开门打招呼', effect: 'wait', affection: 3 },
                    { text: '推门出去，跟着比划了两下，装作晨练', effect: 'mimic', affection: 4 },
                    { text: '「大爷，您这套是引气诀吧？」', effect: 'name_it', affection: 3 }
                ]}
            ],
            effects: function (npc, choice) {
                var aff = 0, msg = '';
                switch (choice) {
                    case 'wait': aff = 3; msg = '他做完最后一式，长长吐出一口气，满足地捶了捶腰。那份满足是真的，跟收成无关。'; break;
                    case 'mimic': aff = 4; msg = '他愣了愣，居然认认真真过来纠正你的手势：「胳膊再沉一点，气才落得下去。」——教人的样子，熟极了。'; break;
                    case 'name_it': aff = 3; msg = '他的手停在半空，好几息才放下来：「瞎比划，活动筋骨哩。」——可你分明看见，他收势收得规规矩矩，一丝不苟。'; break;
                }
                return { affection: aff, msg: msg };
            }
        },
        'villager01_event_3': {
            id: 'villager01_event_3', npcId: 'villager_01',
            title: '房梁上的木盒', icon: '📦',
            desc: '帮忙取东西，一只旧木盒从房梁上掉了下来。',
            minAffection: 35,
            trigger: { random: 0.3 }, cooldown: 0,
            flag: 'villager01_e3_done',
            autoTrigger: { random: 0.3 },
            unlockSecret: 'villager_secret_01',
            scenes: [
                { speaker: 'narrator', text: '你帮张大爷取房梁上的干货篮，篮子带下来一只缠着三层油布的小木盒——盒子摔开了，滚出一截洗得发白的布料，像道袍的袖套，和一张黄脆的帖子。', type: 'description' },
                { speaker: 'narrator', text: '帖子上盖着朱印：仙缘初选·凭信。年份是四十三年前。「入选者：太虚山·张守田。」', type: 'description' },
                { speaker: 'narrator', text: '张大爷进屋看见，愣在那里。好半天，他把东西一样一样捡起来，用袖子擦了又擦，才慢慢坐下。', type: 'description' },
                { speaker: 'npc', text: '那年二十岁。我跟邻村的栓子一块儿过的初选，俩人就一份盘缠凑不够。临出发前头七天，我弟染了急症，家里塌了半边天。', emotion: 'gentle' },
                { speaker: 'npc', text: '我把凭信给了栓子。仙路是独木桥，我家那头也得有人守着哩。……他不后悔。就是每年上元节，想对着这个盒子喝一杯。', emotion: 'warm_sad' },
                { speaker: 'player_select', text: '你如何回应？', options: [
                    { text: '「守了四十年家，也守了四十年这件事。您了不起，张大爷。」', effect: 'respect', affection: 6 },
                    { text: '「栓子后来怎么样了？」', effect: 'ask_friend', affection: 4 },
                    { text: '「明年上元节，我陪您喝这一杯。」', effect: 'drink_promise', affection: 6 }
                ]}
            ],
            effects: function (npc, choice) {
                var aff = 0, msg = '', secretId = null;
                switch (choice) {
                    case 'respect': aff = 6; msg = '他连连摆手：「了不起啥呀，庄稼人。」——嘴上这么说，捏着袖套的那双手，一直在轻轻发抖。'; break;
                    case 'ask_friend': aff = 4; msg = '「栓子啊……入了门，改名了，当上长老喽。前几年坐化的，寿终正寝。」他笑了笑，「他每年都托人给我捎酒。你说这人，走得比我早，惦记得比谁都长。」'; break;
                    case 'drink_promise': aff = 6; msg = '他眼睛一下子亮了：「真的？哎哟——那我得把去年舍不得喝的那坛启了给你留着！」'; break;
                }
                secretId = 'villager_secret_01';
                return { affection: aff, msg: msg, secretId: secretId };
            }
        },
        'villager01_event_4': {
            id: 'villager01_event_4', npcId: 'villager_01',
            title: '迟到的机缘', icon: '🚪',
            desc: '游方道人开坛收徒——十六至六十岁皆可试灵根。他今年六十。',
            minAffection: 45,
            trigger: { random: 0.3 }, cooldown: 0,
            flag: 'villager01_e4_done',
            autoTrigger: { random: 0.3 },
            scenes: [
                { speaker: 'narrator', text: '村里来了个游方道人，相中了村后山的灵眼，要开坛收徒。告示写得明白：凡十六至六十岁，皆可试灵根，不限出身。', type: 'description' },
                { speaker: 'narrator', text: '张大爷去镇上一趟，回来后在青石上坐了一整晚。烟锅子明明灭灭。你过去的时候，他先开了口。', type: 'description' },
                { speaker: 'npc', text: '道人说，像我这样念力埋了几十年的，一试便知。真有灵根呢，从头修，虽到不了高处，强身健体、多活二十年是不亏的。要是没有……也就断了这个念想了。', emotion: 'conflicted' },
                { speaker: 'npc', text: '你说怪不怪。我盼了四十年，真到了这一天，反倒怕了。怕试出来有根，六十岁拜师叫全村看笑话；更怕试出来没根——那这四十年的念想，算个啥哩？', emotion: 'deep' },
                { speaker: 'player_select', text: '此抉择无法回头——你如何答？', options: [
                    { text: '「去试。四十年的事，该有个答案——不管答案长什么样。」', effect: 'test' },
                    { text: '「不去。有些桥不走，是为了记得它一直在那儿。」', effect: 'notest' },
                    { text: '「我去求道人单独给您验——结果不说破，您自己揣着，要不要上山以后再定。」', effect: 'silent_test' }
                ]}
            ],
            effects: function (npc, choice) {
                recordChoiceFn()('villager_01', choice);
                var aff = 0, msg = '';
                switch (choice) {
                    case 'test': aff = 5; msg = '他把烟锅在鞋底磕了磕，站起来的动作比平时利索：「哎。有答案，总比悬着强。庄稼人不怕收成差，就怕地里没种子。」'; break;
                    case 'notest': aff = 4; msg = '他望着后山的方向，烟雾绕着他的白发打转：「……你这话，说到我心窝子里去了。有些念想，养着比兑现金贵。」'; break;
                    case 'silent_test': aff = 4; msg = '「验了不说破？」他咀嚼着这个主意，浑浊的眼睛慢慢亮了：「这法子好。老天爷知道就行——我知道不知道，都不耽误种地。」'; break;
                }
                return { affection: aff, msg: msg };
            }
        },
        'villager01_event_5': {
            id: 'villager01_event_5', npcId: 'villager_01',
            title: '终章·上元节的酒', icon: '🏮',
            desc: '又是一年上元节。',
            minAffection: 55,
            trigger: { random: 0.3 }, cooldown: 0,
            flag: 'villager01_e5_done',
            // 终章仅手动触发：无 autoTrigger
            _dynamicScenes: function () {
                var c = getChoiceFn()('villager_01');
                if (c === 'test') {
                    return [
                        { speaker: 'narrator', text: '试灵根那天全村都去了。轮到张大爷，道人搭着他的腕子闭目良久，睁眼时神情古怪——「杂灵根。土水双杂，下品。」', type: 'description' },
                        { speaker: 'narrator', text: '人群里有半大孩子笑出了声。张大爷却笑得比谁都大声，笑得直不起腰，回家路上一直在哼小曲儿。', type: 'description' },
                        { speaker: 'narrator', text: '如今每天卯时，他都跟着道人的小童学吐纳，动作还是笨拙，一天不落。青石棋盘上，也终于有人陪他对弈了——道人偶尔下山，让他两个子。', type: 'description' },
                        { speaker: 'player_select', text: '你如何回应？', options: [
                            { text: '「下品怎么了。种了一辈子地的人，最懂慢工出细活。」', effect: 'slow_work', affection: 7 },
                            { text: '「六十岁入门。张大爷，您这资质，是全村独一份的传奇。」', effect: 'legend', affection: 6 }
                        ]}
                    ];
                }
                if (c === 'silent_test') {
                    return [
                        { speaker: 'narrator', text: '道人果然应允了单独验。那天清晨你陪他去的，验完，道人只对他一个人说了几句什么，他点点头，揣了样东西在怀里，谁也没告诉。', type: 'description' },
                        { speaker: 'narrator', text: '之后的日子一切如常：种地，闲聊，午休。唯一的分别是他不再在凌晨练吐纳了——因为每天傍晚收工，他都会在田埂上多站一会儿，面向后山。', type: 'description' },
                        { speaker: 'narrator', text: '某天清晨你路过田边，看见他腰带上挂着一枚小小的玉符，随着锄头的起落一晃一晃，晃出细碎的光。', type: 'description' },
                        { speaker: 'player_select', text: '你如何回应？', options: [
                            { text: '什么也不问，笑着朝他挥挥手', effect: 'wave_morning', affection: 7 },
                            { text: '「今儿天气真好。」——「是啊，」他说，「种地的天。」', effect: 'weather', affection: 6 }
                        ]}
                    ];
                }
                // notest（默认分支）
                return [
                    { speaker: 'narrator', text: '上元节夜里，村里家家点灯。你提着一壶酒去张大爷家，他已经在院里等着了，膝盖上放着那只旧木盒。', type: 'description' },
                    { speaker: 'narrator', text: '这一次，他当着你的面打开了盒子，把袖套和拜帖取出来，端端正正摆在石桌上，然后斟了三杯酒。', type: 'description' },
                    { speaker: 'npc', text: '一杯敬栓子，一路走好。一杯敬我兄弟，病好了，儿孙满堂。这第三杯……', emotion: 'gentle' },
                    { speaker: 'narrator', text: '他把第三杯酒缓缓洒在地上，朝着年轻时的自己站过的方向。', type: 'description' },
                    { speaker: 'npc', text: '敬那个二十岁的愣小子。守着呢。一直守着呢。', emotion: 'moved' },
                    { speaker: 'player_select', text: '你如何回应？', options: [
                        { text: '陪他洒了第四杯：「敬田埂。它也守了您四十年。」', effect: 'field', affection: 7 },
                        { text: '什么都不说，把杯里的酒一口干了', effect: 'dry', affection: 6 }
                    ]}
                ];
            },
            scenes: [],
            effects: function (npc, choice) {
                var aff = 0, msg = '';
                switch (choice) {
                    case 'slow_work': aff = 7; msg = '「哈哈！」他抹了把脸，「这话在理！地不哄人，功也不哄人——咱爷俩都靠这个理活着！」'; break;
                    case 'legend': aff = 6; msg = '「传奇不敢当。」他挠挠头，像个真正的二十岁小伙子，「不过等我练到炼气一层，你就得改口叫我张师兄喽！」'; break;
                    case 'wave_morning': aff = 7; msg = '他也朝你挥手，玉符在朝阳底下闪了一下。有些答案，揣在自己怀里就够了。'; break;
                    case 'weather': aff = 6; msg = '「种地的天。」他重复了一遍，笑纹里盛满了晨光。锄头起落的节奏，比昨天轻快了些许。'; break;
                    case 'field': aff = 7; msg = '他怔了怔，随即笑出了眼泪：「对对对，还有田埂！——你看这孩子，说话跟种地似的，实在！」'; break;
                    case 'dry': aff = 6; msg = '烈酒入喉，两个人都被呛得咳嗽，咳嗽着咳嗽着都笑了。月亮很圆，灯很亮，四十年就这么过去了。'; break;
                }
                return { affection: aff, msg: msg };
            }
        }
    };

    // ============ 铁匠老王（craftsman_01）============
    // 秘密底子：曾打造过一把被诅咒的剑
    var CRAFTSMAN_EVENTS = {
        'craftsman01_event_1': {
            id: 'craftsman01_event_1', npcId: 'craftsman_01',
            title: '轰出去的单子', icon: '🔨',
            desc: '有豪客出十倍价铸剑，条件只有一个：不问用途，不留铭款。',
            minAffection: 15,
            trigger: { random: 0.4 }, cooldown: 3,
            flag: 'craftsman01_e1_done',
            autoTrigger: { timeRange: [8, 18], random: 0.4 },
            scenes: [
                { speaker: 'narrator', text: '铺子里来了个绸缎庄打扮的豪客，开口十倍工钱，条件却古怪：铸剑可以，不问用途，不留铭款，交货时不许验看买主。', type: 'description' },
                { speaker: 'narrator', text: '一向和气的铁匠老王，脸当场就沉了。他抄起烧火棍，把人连人带礼盒轰出去半条街，回来时胸口还在起伏。', type: 'description' },
                { speaker: 'player_select', text: '你如何做？', options: [
                    { text: '递瓢井水过去，什么也不问', effect: 'water', affection: 4 },
                    { text: '「十倍价啊。祖上到底立的什么规矩？」', effect: 'ask_rule', affection: 3 },
                    { text: '「这样的客人，得罪就得罪得起才行。」提醒他小心报复', effect: 'worry', affection: 3 }
                ]}
            ],
            effects: function (npc, choice) {
                var aff = 0, msg = '';
                switch (choice) {
                    case 'water': aff = 4; msg = '他咕咚咕咚灌了半瓢，抹抹嘴缓过神来：「……谢了。刚才失态了。那种单子，我们铺子三十年前接过一回。」'; break;
                    case 'ask_rule': aff = 3; msg = '「规矩就是规矩。」他闷闷地说，抡锤的手却比平时重了三分，火星子溅得格外凶。'; break;
                    case 'worry': aff = 3; msg = '「报复？」他冷笑了一声，「我等的就不是报复。」这句话没头没尾，他却不再解释了。'; break;
                }
                return { affection: aff, msg: msg };
            }
        },
        'craftsman01_event_2': {
            id: 'craftsman01_event_2', npcId: 'craftsman_01',
            title: '墙里的账本', icon: '🧱',
            desc: '铺子后墙上划满了粉笔道道，每一道旁边一个小地名。',
            minAffection: 25,
            trigger: { random: 0.3 }, cooldown: 3,
            flag: 'craftsman01_e2_done',
            autoTrigger: { random: 0.3 },
            scenes: [
                { speaker: 'narrator', text: '你帮老王搬煤，无意瞥见后墙挂着块黑木板——上面粉笔道道密密麻麻，足有十七道。每一道旁边都用小楷注着一个地名：雁门。洛水。赤沙镇……', type: 'description' },
                { speaker: 'player_select', text: '你随口问那是什么。', options: [
                    { text: '「王师傅，你这送货记录，跑的地方可够远的。」', effect: 'delivery', affection: 2 },
                    { text: '不问，默默把最边上快磨没的一道描清晰了些', effect: 'trace', affection: 4 },
                    { text: '「十七个地名……这不是记录。这是路线。」', effect: 'route', affection: 4 }
                ]}
            ],
            effects: function (npc, choice) {
                var aff = 0, msg = '';
                switch (choice) {
                    case 'delivery': aff = 2; msg = '「嗯，送货。」他应得飞快，手上锻打的节奏乱了半拍。那不是打铁的节奏——那是心虚的节奏。'; break;
                    case 'trace': aff = 4; msg = '他站在你身后看着你描那道浅痕，很久没说话。末了重重叹了口气：「快了。第十八个地名，快出现了。」'; break;
                    case 'route': aff = 4; msg = '锤声停了。他背对着你站了一会儿，肩膀垮了下来：「……你这眼睛，太毒了。」'; break;
                }
                return { affection: aff, msg: msg };
            }
        },
        'craftsman01_event_3': {
            id: 'craftsman01_event_3', npcId: 'craftsman_01',
            title: '墙里的账本', icon: '🗡️',
            desc: '第十八个地名出现的当晚，他把一切都告诉你了。',
            minAffection: 35,
            trigger: { random: 0.3 }, cooldown: 0,
            flag: 'craftsman01_e3_done',
            autoTrigger: { random: 0.3 },
            unlockSecret: 'craftsman_secret_01',
            scenes: [
                { speaker: 'narrator', text: '当晚他关了铺门，温了一壶酒，摆出两只碗，然后指着那块黑板，从第一道划痕说起。', type: 'description' },
                { speaker: 'npc', text: '三十岁那年，我手艺刚成名，来了单黑活：用来历不明的陨铁铸剑，酬劳是我师傅后半辈子的药钱。我铸了。剑名「哭夜」。', emotion: 'heavy' },
                { speaker: 'npc', text: '铸成那夜炉膛无故爆燃，我师傅为护炉瞎了一只眼。半年后，买主持剑屠了仇家满门十三口——然后剑就「活」了。它开始在江湖上自己流转，每一任主人，最后都家破人亡。', emotion: 'deep' },
                { speaker: 'narrator', text: '他的手指抚过那十七道划痕，一道一道，像在数自己的骨头。', type: 'description' },
                { speaker: 'npc', text: '二十年，我追着它跑了十七个地方。每次易主我都赶到，加价买回、深埋、再被下一个贪心的挖出来。……造孽的是我的手，收孽的也得是这双手。', emotion: 'bitter' },
                { speaker: 'player_select', text: '你如何回应？', options: [
                    { text: '「剑无罪，人心有罪。可您这二十年，是在替所有人还账。」', effect: 'debt', affection: 6 },
                    { text: '「与其追着埋，不如毁了它。您有这手艺。」', effect: 'destroy', affection: 5 },
                    { text: '「第十八个地名在哪。这次，我陪您去。」', effect: 'accompany', affection: 6 }
                ]}
            ],
            effects: function (npc, choice) {
                var aff = 0, msg = '', secretId = null;
                switch (choice) {
                    case 'debt': aff = 6; msg = '他仰头把碗里的酒干了：「还账……嘿。我师傅瞎了眼都没骂过我。你这一句话，比他当年那一巴掌还重。」'; break;
                    case 'destroy': aff = 5; msg = '「毁？」他苦笑，「陨铁的东西，寻常炉火熔不动。我在等一个机会——一个能把火候催到顶的机会。」'; break;
                    case 'accompany': aff = 6; msg = '他猛地抬头，眼睛红得吓人，半天，重重点了点头：「……好。这回路上有人说话了。」'; break;
                }
                secretId = 'craftsman_secret_01';
                return { affection: aff, msg: msg, secretId: secretId };
            }
        },
        'craftsman01_event_4': {
            id: 'craftsman01_event_4', npcId: 'craftsman_01',
            title: '第十八家', icon: '👶',
            desc: '这一次不一样——第十八任主人，是个孩子。',
            minAffection: 45,
            trigger: { random: 0.3 }, cooldown: 0,
            flag: 'craftsman01_e4_done',
            autoTrigger: { random: 0.3 },
            scenes: [
                { speaker: 'narrator', text: '第十八个地名是座山城。你们寻到时，剑已经易主半个月了——新主人是个十三四岁的少年，铸剑世家的遗孤：全家死于「哭夜」上一任主人手里，少年在血泊里捡到了这柄剑。', type: 'description' },
                { speaker: 'narrator', text: '他不知道诅咒。他把剑当成爹娘留下的遗物，贴身背着，闯荡江湖寻仇。老王远远跟了三天，一根烟抽完了没敢上前。', type: 'description' },
                { speaker: 'npc', text: '夺，这孩子仇深似海，那是他仅剩的「爹娘」，拼死不会撒手。不夺，诅咒认主，他活不过两年。', emotion: 'anguished' },
                { speaker: 'narrator', text: '二十年没见他这般失魂过。铁匠的手艺能断金铁，断不开这样的死结。', type: 'description' },
                { speaker: 'player_select', text: '此抉择无法回头——怎么走？', options: [
                    { text: '「收他进铺子当学徒。师徒名分在手，慢慢教慢慢处，剑的事等他成年再摊牌。」', effect: 'apprentice' },
                    { text: '「实话实说。把这二十年的账本给他看——恨要有对象，让他知道该恨的是剑，不是更多人的名字。」', effect: 'truth' },
                    { text: '「我出钱造势悬赏『哭夜』，找人演一场盗剑——先把剑骗过来，孩子的仇我们替他记着。」', effect: 'trick' }
                ]}
            ],
            effects: function (npc, choice) {
                recordChoiceFn()('craftsman_01', choice);
                var aff = 0, msg = '';
                switch (choice) {
                    case 'apprentice': aff = 5; msg = '「学徒……」他咂摸着这两个字，粗糙的脸慢慢柔和下来，「我这铺子二十年了没响过徒弟的锤声。也好。也好。」'; break;
                    case 'truth': aff = 5; msg = '「摊牌……」他反复摩挲着那块粉笔板，「让他恨我总好过让他死于不明不白。行。这实话，我陪他一起挨。」'; break;
                    case 'trick': aff = 4; msg = '「演戏……」他眉头拧成一个疙瘩，「骗得了一时的手，骗不了一世的命。但这法子至少让孩子先活下去——活下去，才有以后。」'; break;
                }
                return { affection: aff, msg: msg };
            }
        },
        'craftsman01_event_5': {
            id: 'craftsman01_event_5', npcId: 'craftsman_01',
            title: '终章·淬火', icon: '⚒️',
            desc: '铺子里的炉火烧得比哪一年都旺。',
            minAffection: 55,
            trigger: { random: 0.3 }, cooldown: 0,
            flag: 'craftsman01_e5_done',
            // 终章仅手动触发：无 autoTrigger
            _dynamicScenes: function () {
                var c = getChoiceFn()('craftsman_01');
                if (c === 'apprentice') {
                    return [
                        { speaker: 'narrator', text: '少年入了铺子，学拉风箱、认矿石、淬火。半年后，他打出了第一件属于自己的东西——一柄小小的削皮刀，刃口开得歪歪扭扭，却亮得晃眼。', type: 'description' },
                        { speaker: 'narrator', text: '当天夜里，老王把「哭夜」沉进了铺子最深的水井，井口压上三块青石。少年站在井边看了很久，问：「师父，它还会出来吗？」', type: 'description' },
                        { speaker: 'npc', text: '等你能独立扛动大锤了，这口井开不开，你自己决定。', emotion: 'solemn' },
                        { speaker: 'player_select', text: '你如何回应？', options: [
                            { text: '「到那天，他大概会选择让井继续压着。」', effect: 'well_stay', affection: 7 },
                            { text: '「这口井里泡着的，其实是他往后的人生。」', effect: 'well_life', affection: 6 }
                        ]}
                    ];
                }
                if (c === 'trick') {
                    return [
                        { speaker: 'narrator', text: '戏做得十足：悬赏贴遍七十二行，「哭夜」在众目睽睽之下「被盗」。可少年疯了似的找了半个月——原来他早知道诅咒。', type: 'description' },
                        { speaker: 'narrator', text: '剑柄的夹层里缠着他娘的一缕头发。他带着剑，是想循着诅咒找到仇人的余党，同归于尽。', type: 'description' },
                        { speaker: 'narrator', text: '老王只好提前摊牌。三个人围着炉火坐了一夜：老王的二十年，少年的血仇，和那柄在火光里泛着幽光的剑。', type: 'description' },
                        { speaker: 'narrator', text: '天亮时，少年亲手把娘的发丝取下来收好，看着「哭夜」被送进炉膛。仇恨落地的方式，比想象中安静。', type: 'description' },
                        { speaker: 'player_select', text: '你如何回应？', options: [
                            { text: '「剑化了，账没化。往后你的人生，是新的账本。」', effect: 'new_book', affection: 7 },
                            { text: '「留下来吧。炉子边缺个拉风箱的——顺便，学会为自己活。」', effect: 'stay_alive', affection: 6 }
                        ]}
                    ];
                }
                // truth（默认分支）
                return [
                    { speaker: 'narrator', text: '老王把粉笔板摘下来，连同二十年的话，一字一句摊给了少年。少年三天没说话，饭吃得很少，锤却抡得很凶。', type: 'description' },
                    { speaker: 'narrator', text: '第四天清晨，少年站在老王面前，眼睛肿着，只说了一句：「帮我把它毁了。」', type: 'description' },
                    { speaker: 'narrator', text: '三代铸匠的手艺合在一处：老王掌火，你拉风箱，少年亲自执钳。「哭夜」入炉七天七夜，诅咒化尽的那一刻，炉火纯青得像一场大雪。', type: 'description' },
                    { speaker: 'narrator', text: '出炉的，是一柄无名素剑，通体干净。老王把它赠予少年；少年转身，把它供在了自家新坟前——然后回到铺子，抄起了自己的锤。', type: 'description' },
                    { speaker: 'player_select', text: '你如何回应？', options: [
                        { text: '「十八个地名，今天全部擦掉了。」', effect: 'erased', affection: 7 },
                        { text: '「铺子里又添一双筷子。往后这炉火，三个人分。」', effect: 'share_fire', affection: 6 }
                    ]}
                ];
            },
            scenes: [],
            effects: function (npc, choice) {
                var aff = 0, msg = '';
                switch (choice) {
                    case 'well_stay': aff = 7; msg = '老王点头：「我也是这么想的。有些东西不必毁在天手里——埋在水里让它自己凉透，也是一种慈悲。」'; break;
                    case 'well_life': aff = 6; msg = '他望着井口的青石沉默许久：「……是啊。所以我才要教他打铁。手上有活的人，顾不上跟井底的东西较劲。」'; break;
                    case 'new_book': aff = 7; msg = '少年闻言回头看了你一眼。那是他进铺子以来，头一回露出不属于仇恨的表情——像一个真正十三岁的孩子。'; break;
                    case 'stay_alive': aff = 6; msg = '老王重重拍了下少年的肩：「听见没？拉风箱的活，最累——正好，把心里的东西也一并拉出来烧了。」'; break;
                    case 'erased': aff = 7; msg = '老王拿起布擦粉笔板，擦一下，顿一下。擦完最后一道，他把木板劈了当柴，添进了当晚的灶里。「这顿饭香。二十年了，头一顿吃着不亏心的饭。」'; break;
                    case 'share_fire': aff = 6; msg = '「分就分！」少年头一个嚷嚷起来，「不过丑话说前头——我师父打的铁比方正，我打的铁比他好看！」铺子里响起久违的两个人的笑声。'; break;
                }
                return { affection: aff, msg: msg };
            }
        }
    };

    // ============ 神秘老者（mysterious_01）============
    // 秘密底子：曾是上古大能，因遭背叛而隐居
    var MYSTERIOUS_EVENTS = {
        'mysterious01_event_1': {
            id: 'mysterious01_event_1', npcId: 'mysterious_01',
            title: '不对等的棋', icon: '♟️',
            desc: '洞府里那副棋，他从来只用兵卒与你周旋。',
            minAffection: 15,
            trigger: { random: 0.4 }, cooldown: 3,
            flag: 'mysterious01_e1_done',
            autoTrigger: { random: 0.4 },
            scenes: [
                { speaker: 'narrator', text: '洞府的石桌上刻着一副棋。神秘老者邀你对弈——然后你发现，他永远只挪动兵卒，车马炮自始至终一动不动。', type: 'description' },
                { speaker: 'narrator', text: '即便如此，你还是输了。输给了一群拱到底线的老兵。', type: 'description' },
                { speaker: 'player_select', text: '你如何回应？', options: [
                    { text: '「让您三个子还输成这样，看来是我技不如人。」', effect: 'humble', affection: 4 },
                    { text: '「为什么不用车马炮？」', effect: 'why', affection: 3 },
                    { text: '记下他每一步兵卒的走法，下次再来', effect: 'study', affection: 4 }
                ]}
            ],
            effects: function (npc, choice) {
                var aff = 0, msg = '';
                switch (choice) {
                    case 'humble': aff = 4; msg = '「不。」他纠正你，「是你认真。认真的人，配得上我用全力。」——他指的是那些兵卒。'; break;
                    case 'why': aff = 3; msg = '他望着棋盘，目光穿过棋盘落在很远的地方：「让你三个子的规矩……是我欠人的。」'; break;
                    case 'study': aff = 4; msg = '第三次复盘时他忽然说：「第七步你不该跳马。」——原来他一直知道你在偷师。「下次偷得隐蔽些。不过，喜欢来。」'; break;
                }
                return { affection: aff, msg: msg };
            }
        },
        'mysterious01_event_2': {
            id: 'mysterious01_event_2', npcId: 'mysterious_01',
            title: '三盏灯与一座冷灯', icon: '🕯️',
            desc: '洞府深处供着四座长明灯，三亮一冷。',
            minAffection: 25,
            trigger: { random: 0.3 }, cooldown: 3,
            flag: 'mysterious01_e2_done',
            autoTrigger: { timeRange: [21, 24], random: 0.3 },
            scenes: [
                { speaker: 'narrator', text: '洞府最深处有一面石壁，壁上凿了四座灯台。三盏长明灯焰色沉稳，据说万年未灭；每逢甲子日，老者会亲自添一次灯油，仪式郑重得近乎虔诚。', type: 'description' },
                { speaker: 'narrator', text: '第四座灯台上也有灯——灯芯完好，灯油充盈，却是冷的。冷的像一块石头。', type: 'description' },
                { speaker: 'player_select', text: '你如何做？', options: [
                    { text: '「前三盏敬的是故人。第四盏呢？」', effect: 'ask_fourth', affection: 4 },
                    { text: '伸手想去探那盏冷灯的温度', effect: 'touch', affection: 3 },
                    { text: '默默记下甲子日的日期', effect: 'remember_date', affection: 4 }
                ]}
            ],
            effects: function (npc, choice) {
                var aff = 0, msg = '';
                switch (choice) {
                    case 'ask_fourth': aff = 4; msg = '洞府静了很久。「那盏灯，」他终于开口，「还没轮到点亮的时候。」——没轮到？还是不敢？'; break;
                    case 'touch': aff = 3; msg = '指尖还未触及，他已扣住你的手腕——力道不大，却不容分说。「别碰它。」他松开手，「它记性好得很，谁碰过它，它记谁一辈子。」'; break;
                    case 'remember_date': aff = 4; msg = '下一个甲子日你特意前来，看见他添油的手在第四座灯台前停了一瞬——只有一瞬——然后移开。'; break;
                }
                return { affection: aff, msg: msg };
            }
        },
        'mysterious01_event_3': {
            id: 'mysterious01_event_3', npcId: 'mysterious_01',
            title: '第四盏灯', icon: '🌌',
            desc: '甲子日夜，你撞见他对着冷灯说话。',
            minAffection: 35,
            trigger: { random: 0.3 }, cooldown: 0,
            flag: 'mysterious01_e3_done',
            autoTrigger: { timeRange: [21, 24], random: 0.3 },
            unlockSecret: 'mysterious_secret_01',
            scenes: [
                { speaker: 'narrator', text: '又一个甲子日夜。你进洞送山果，听见深处传来话语声——他在对那盏冷灯说话，声音低得像叹息。', type: 'description' },
                { speaker: 'narrator', text: '「……今年山下又是太平年。你们仨要的太平，我给你们守着。」他顿了顿，「守烦了。什么时候轮到我歇？」', type: 'description' },
                { speaker: 'narrator', text: '他察觉到你，却没有赶你走。那一夜，他讲了万年前的事：四位守界人，将破的天隙，以身补天的仪式——以及那支做了局的签。', type: 'description' },
                { speaker: 'npc', text: '补天需三人，四人抽签。我「抽中」了。直到仪式前一刻我才知道：签是他们三个做了局的——他们算准了我的天赋最高、路最长，合谋要我活。', emotion: 'heavy' },
                { speaker: 'npc', text: '他们管那叫成全。我管那叫背叛！凭什么我的命就贵一些？！我一怒掀了祭坛——封印迟滞三百年才合拢。三百年，妖潮从缝里漏进来，白骨千里。', emotion: 'fury' },
                { speaker: 'narrator', text: '他闭上眼，声音低下去，像刀锋入鞘。', type: 'description' },
                { speaker: 'npc', text: '三人魂飞前，最后传音给我一句话：「等你哪天不恨了，来看看第四盏灯。」……一万年了。我没敢点。我怕点了灯，就要承认他们是对的。', emotion: 'deep' },
                { speaker: 'player_select', text: '你如何回应？', options: [
                    { text: '「他们不是替你决定生死——是替你扛下了他们扛得动的那部分。」', effect: 'reframe', affection: 6 },
                    { text: '「三百年妖潮不是他们的错，也不是你的错。是天隙的错。」', effect: 'blame_gap', affection: 5 },
                    { text: '「一万年了。您恨的不是他们，是自己欠他们的那句谢谢。」', effect: 'thanks_owed', affection: 6 }
                ]}
            ],
            effects: function (npc, choice) {
                var aff = 0, msg = '', secretId = null;
                switch (choice) {
                    case 'reframe': aff = 6; msg = '他猛然睁眼瞪着你，瞪了很久很久——那股万年的戾气像潮水撞上礁石，碎成了一片白沫。「……你这张嘴。」他别过脸去，「像他们。」'; break;
                    case 'blame_gap': aff = 5; msg = '「天隙的错。」他咀嚼着这三个字，忽然低低笑了一声，「一万年了，头一回有人说，这不赖我。」'; break;
                    case 'thanks_owed': aff = 6; msg = '洞府里静得能听见灯芯燃烧的声音。许久，他说：「……或许吧。或许我早就不恨了。只是不恨了，就更不知道该怎么面对他们。」'; break;
                }
                secretId = 'mysterious_secret_01';
                return { affection: aff, msg: msg, secretId: secretId };
            }
        },
        'mysterious01_event_4': {
            id: 'mysterious01_event_4', npcId: 'mysterious_01',
            title: '心灯法门', icon: '🔥',
            desc: '天隙再度松动。这一次的选择，重逾万年。',
            minAffection: 45,
            trigger: { random: 0.3 }, cooldown: 0,
            flag: 'mysterious01_e4_done',
            autoTrigger: { random: 0.3 },
            scenes: [
                { speaker: 'narrator', text: '他观测天象归来，脸色前所未有地凝重：天隙封印再度松动，妖气渗漏的征兆已现于北天。', type: 'description' },
                { speaker: 'npc', text: '上古的修补之法，需要四位守界人同心引灵。如今只剩我一个。但我这些年参悟出一门「心灯」法门——以残存道行为引，点亮第四盏灯，可补一线天隙。', emotion: 'serious' },
                { speaker: 'npc', text: '代价是：灯亮之时，我万年修为散尽，跌落凡尘。不死，但从元婴打回一个普通老头。', emotion: 'neutral' },
                { speaker: 'npc', text: '或者不动灯。以我现在的修为强行镇压，能撑一千年。……一千年后的事，与我无关了。', emotion: 'deep' },
                { speaker: 'player_select', text: '此抉择无法回头——你怎么说？', options: [
                    { text: '「点灯。一万年前欠下的位子，今天你自己坐回去——这一次，是你自己的选择。」', effect: 'light' },
                    { text: '「镇压。天隙还有一千年，你有传人了——把剩下的年月用来教完他。」', effect: 'suppress' },
                    { text: '「找第三条路：把心灯法门传下去。一人一盏不够，就让后来的守界人都学会点灯。」', effect: 'teach' }
                ]}
            ],
            effects: function (npc, choice) {
                recordChoiceFn()('mysterious_01', choice);
                var aff = 0, msg = '';
                switch (choice) {
                    case 'light': aff = 6; msg = '他怔怔地看着你，万年的风霜在眼底翻涌了一遍，最后归于平静。「……好。这一次，没有人替我做局。我自己点。」'; break;
                    case 'suppress': aff = 5; msg = '「教完他……」他望向洞府外你来的方向，嘴角浮起一丝极淡的笑，「也好。万年前他们为我算了一局，如今我为传人算一局——这算不算传承？」'; break;
                    case 'teach': aff = 6; msg = '他猛地抬头，眼中精光爆射：「让后来人都学会点灯？！……妙啊。一盏灯是一个人的命，一门法是万世的火。你这脑子——比我有慧根！」'; break;
                }
                return { affection: aff, msg: msg };
            }
        },
        'mysterious01_event_5': {
            id: 'mysterious01_event_5', npcId: 'mysterious_01',
            title: '终章·现在是平局了', icon: '⚖️',
            desc: '洞府的灯，等来了它的答案。',
            minAffection: 55,
            trigger: { random: 0.3 }, cooldown: 0,
            flag: 'mysterious01_e5_done',
            // 终章仅手动触发：无 autoTrigger
            _dynamicScenes: function () {
                var c = getChoiceFn()('mysterious_01');
                if (c === 'light') {
                    return [
                        { speaker: 'narrator', text: '点灯那夜，他沐浴更衣，像赴一场迟到一万年的约。心灯法门运转，第四盏灯的灯芯颤了颤——亮了。', type: 'description' },
                        { speaker: 'narrator', text: '灯亮的瞬间，他的白发寸寸转墨，元婴修为如潮水般退去，退成一个普普通通的清瘦老头。北天上，渗漏的妖气如雾般消散了。', type: 'description' },
                        { speaker: 'narrator', text: '他站在四盏齐明的灯前，看了很久很久，忽然说了一句谁也没想到的话。', type: 'description' },
                        { speaker: 'npc', text: '「从前你们仨一盏灯，我一个人。现在我也点上了——四对四。现在是平局了。」', emotion: 'peaceful' },
                        { speaker: 'player_select', text: '你如何回应？', options: [
                            { text: '「走吧。凡间的酒不好喝，但管醉。」', effect: 'wine_drunk', affection: 8 },
                            { text: '「平局好啊。平局，才能接着下下去。」', effect: 'draw_on', affection: 7 }
                        ]}
                    ];
                }
                if (c === 'suppress') {
                    return [
                        { speaker: 'narrator', text: '镇压启动那日，他以自身为阵眼坐镇洞府，万载道行化作无形的幕，罩住北天一线。此后他不能再远离洞府半步。', type: 'description' },
                        { speaker: 'narrator', text: '但他的日子反而热闹了起来——你每隔旬日便来学艺，他把守界的心法拆成了三课：观天、辨隙、守心。每一课，都够凡人修行者琢磨十年。', type: 'description' },
                        { speaker: 'npc', text: '一万年太久。教到你这一辈，够了。', emotion: 'warm' },
                        { speaker: 'player_select', text: '结课那日，他考了你最后一题：「何为守界？」你答了什么？', options: [
                            { text: '「守的不是界，是界这边的人。」', effect: 'people', affection: 8 },
                            { text: '「守心，即是守界。」', effect: 'heart', affection: 7 }
                        ]}
                    ];
                }
                // teach（默认分支）
                return [
                    { speaker: 'narrator', text: '心灯法门被他拆成了人人可学的引诀，刻在洞府外的崖壁上。起初无人问津；三年后，第一批远道而来的修行者在崖下驻扎；十年后，崖前已成聚落，灯火点点如星。', type: 'description' },
                    { speaker: 'narrator', text: '聚落立了一条不成文的规矩：入门者各得一盏自己的灯，learned 引诀者可为他人护灯。而崖壁最高处的第四座灯台，始终为后来者空着。', type: 'description' },
                    { speaker: 'narrator', text: '他站在洞府门前送你远行，白发被风吹起，脸上是万年未有的松弛。', type: 'description' },
                    { speaker: 'npc', text: '「去吧。轮到你给别人留灯的时候——别忘了今天。」', emotion: 'warm' },
                    { speaker: 'player_select', text: '你如何回应？', options: [
                        { text: '「忘不了。今天这盏灯，本来就是您留给我的。」', effect: 'left_for_me', affection: 8 },
                        { text: '「我会留很多盏。多到您在洞里数不过来。」', effect: 'many_lamps', affection: 7 }
                    ]}
                ];
            },
            scenes: [],
            effects: function (npc, choice) {
                var aff = 0, msg = '';
                switch (choice) {
                    case 'wine_drunk': aff = 8; msg = '那晚他喝得酩酊大醉，抱着酒坛子把三位挚友的名字喊了一遍又一遍，喊着喊着就哭了，哭着哭着又笑了。一万年的债，原来一坛凡酒就能偿。'; break;
                    case 'draw_on': aff = 7; msg = '「接着下……」他喃喃念着，转头看向洞内那副棋盘，「好啊。那下一局，我用车马炮。」——万年来第一次。'; break;
                    case 'people': aff = 8; msg = '他久久注视着你，最后只吐出两个字：「出师了。」——声音很稳，眼角很湿。'; break;
                    case 'heart': aff = 7; msg = '「守心即守界。」他将这三个字刻在了洞府的门楣上，「这四个字，比我一万年的修为值钱。」'; break;
                    case 'left_for_me': aff = 8; msg = '他背着手转过身去，好一会儿，才传来一声轻咳：「……胡说。那盏灯，是留给所有值得的人的。」——值得的人。他说这三个字的时候，没有看你。'; break;
                    case 'many_lamps': aff = 7; msg = '「哈哈哈！」他大笑起来，笑声惊起了崖边的宿鸟，「好大的口气！——不过我等着。我这个人，最擅长的就是等。」'; break;
                }
                return { affection: aff, msg: msg };
            }
        }
    };

    // ============ 注册到全局事件池 ============
    [ELDER_EVENTS, RIVAL_EVENTS, VILLAGER_EVENTS, CRAFTSMAN_EVENTS, MYSTERIOUS_EVENTS].forEach(function (pack) {
        Object.keys(pack).forEach(function (k) { NPC_PERSONAL_EVENTS[k] = pack[k]; });
    });

    // ============ 秘密注入（幂等，独立注入表） ============
    var STORYLINE_SECRET_MAP_B3 = {
        elder_01: ['elder_secret_01'],
        rival_01: ['rival_secret_01'],
        villager_01: ['villager_secret_01'],
        craftsman_01: ['craftsman_secret_01'],
        mysterious_01: ['mysterious_secret_01']
    };

    function injectStorylineSecretsB3() {
        if (!window.npcManager || typeof window.npcManager.getNPC !== 'function') return;
        var data = window.SPECIAL_NPC_DATA || {};
        Object.keys(STORYLINE_SECRET_MAP_B3).forEach(function (npcId) {
            var npc = window.npcManager.getNPC(npcId);
            if (!npc) return;
            if (npc.secrets && npc.secrets[STORYLINE_SECRET_MAP_B3[npcId][0]]) return; // 已注入
            var src = data[npcId] && data[npcId].secrets;
            if (!src) return;
            npc.secrets = npc.secrets || {};
            Object.keys(src).forEach(function (sk) {
                npc.secrets[sk] = JSON.parse(JSON.stringify(src[sk]));
            });
        });
    }

    // 再包一层 getPersonalEventButtons（链式：batch2 → batch1 → 原生）
    var _origGetPEB3 = (typeof window.getPersonalEventButtons === 'function') ? window.getPersonalEventButtons : null;
    window.getPersonalEventButtons = function (npc, npcId) {
        try { injectStorylineSecretsB3(); } catch (e) {}
        return _origGetPEB3 ? _origGetPEB3(npc, npcId) : '';
    };

    // ============ 自动触发挂钩（再包一层 getGreeting，链式） ============
    var B3_NPC_IDS = ['elder_01', 'rival_01', 'villager_01', 'craftsman_01', 'mysterious_01'];
    var B3_FINAL_EVENTS = {
        elder_01: 'elder01_event_5', rival_01: 'rival01_event_5', villager_01: 'villager01_event_5',
        craftsman_01: 'craftsman01_event_5', mysterious_01: 'mysterious01_event_5'
    };

    var _origGetGreeting3 = (typeof window.getGreeting === 'function') ? window.getGreeting : null;
    window.getGreeting = function (npc, player) {
        try {
            if (npc && B3_NPC_IDS.indexOf(npc.id) >= 0 && typeof window.maybeAutoTriggerPersonalEvent === 'function') {
                window.maybeAutoTriggerPersonalEvent(npc.id, 'greet', { finalEvents: [B3_FINAL_EVENTS[npc.id]] });
            }
        } catch (e) {}
        return _origGetGreeting3 ? _origGetGreeting3(npc, player) : '你好。';
    };

    // daily 源：新的一天开始时兜底（玩家与NPC同城时）
    if (typeof window.timeSystem !== 'undefined' && window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
        window.timeSystem.onNewDaySubscribe(function () {
            try {
                if (!window.currentCharData || !window.npcManager) return;
                var loc = window.currentCharData.location || ''; // P0-2规范字段（v13.5审查修正：currentLocation从未被赋值）
                B3_NPC_IDS.forEach(function (nid) {
                    var npc = window.npcManager.getNPC(nid);
                    if (npc && npc.location === loc) {
                        window.maybeAutoTriggerPersonalEvent(nid, 'daily', { finalEvents: [B3_FINAL_EVENTS[nid]] });
                    }
                });
            } catch (e) { console.warn('[故事线v2·批次3] 每日自动触发失败:', e); }
        });
    }

    console.log('📖 故事线v2·第三批（收官）已加载：玄冰子 / 柳随风 / 张大爷 / 铁匠老王 / 神秘老者（各5段，共25事件）');
})();
