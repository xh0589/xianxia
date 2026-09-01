// ==================== 任务系统扩展 v2.0 ====================
// 从quest-system.js 加载后自动合并扩展任务
// 主线扩展20步→35步（覆盖炼气→真仙→飞升，七章完整剧情）
// 新增剧情对话文本系统

(function() {
    // ==================== 剧情对话文本系统 ====================
    var STORY_DIALOGUES = {
        // 第四章：金丹大道
        'main_021': {
            accept: '你来到古遗迹前，石门缓缓打开，一股古老的气息扑面而来。\n「终于等到有人来了…」一个苍老的声音在遗迹中回荡…',
            progress: '遗迹深处散发着金丹期的气息，你需要找到【金丹传承】…',
            complete: '你获得了上古金丹修士的完整传承！金丹大道就在眼前！'
        },
        'main_022': {
            accept: '你发现了一处上古灵脉，灵气浓郁得几乎化为实质。\n「若能在此修炼，金丹可成！」',
            progress: '在灵脉上修炼，积累足够的金丹之力…',
            complete: '灵脉之力灌入体内，金丹开始凝聚！'
        },
        'main_023': {
            accept: '其他宗门也发现了古遗迹，一场争夺不可避免。\n「金丹秘境，唯有强者可得！」',
            progress: '击败其他宗门前来争夺的弟子，证明你的实力…',
            complete: '你击败了所有竞争者，获得了遗迹的控制权…'
        },
        // 第五章：元婴出窍
        'main_024': {
            accept: '金丹大成后，你感应到天地异象。天空中出现血色漩涡。\n「魔教终于按捺不住了…」',
            progress: '调查血色漩涡的来源，发现魔教正在举行某种仪式…',
            complete: '你发现了魔教的阴谋——他们企图召唤上古魔神！'
        },
        'main_025': {
            accept: '魔教大军压境，各门派紧急召集所有弟子。\n「保卫山门，誓与宗门共存亡！」',
            progress: '参与宗门守卫战，击退魔教进攻…',
            complete: '在付出了惨重代价后，魔教暂时退却。但更大的危机还在后面…'
        },
        'main_026': {
            accept: '战争结束后，你感到金丹开始震动，元婴即将破壳而出。\n「天地异象，元婴出窍…」',
            progress: '寻找安全的地方突破元婴期，需要准备渡劫材料…',
            complete: '你成功凝结元婴！元婴出窍的瞬间，你看到了天地法则的奥秘…'
        },
        // 第六章：化神之秘
        'main_027': {
            accept: '元婴期后，你发现了一个惊天秘密——上古仙魔大战的真相。\n「原来这个世界曾经历过如此惨烈的战争…」',
            progress: '探索上古战场遗迹，收集散落的记忆碎片…',
            complete: '你拼凑出了真相：上古时期，仙魔两界大战，封印了通往天界的通道…'
        },
        'main_028': {
            accept: '要突破化神，需要找到五种天地本源之力。\n「金木水火土，五行本源，缺一不可。」',
            progress: '前往五大绝地，收集五行本源之力…',
            complete: '五行本源齐聚，你的身体开始发生质的变化…'
        },
        'main_029': {
            accept: '化神劫降临，天雷滚滚。这不仅是力量的考验，更是心境的考验。\n「化神者，化凡为神，脱胎换骨。」',
            progress: '渡过化神天劫，需要在天雷中淬炼肉身和神魂…',
            complete: '你成功渡过化神劫！从此超凡脱俗，踏入化神之境…'
        },
        // 第七章：飞升之劫
        'main_030': {
            accept: '化神之后，你接触到了真正的世界真相。天界之门已经打开。\n「飞升之路，就在眼前。但这条路，充满了荆棘。」',
            progress: '前往天界之门，接受飞升考验…',
            complete: '天界之门守卫承认了你的实力，但你还需要通过最后的考验…'
        },
        'main_031': {
            accept: '要飞升天界，必须渡过九重天劫。每一重天劫都是一次生死考验。\n「天劫九重，一重一世界。渡过便是仙，渡不过便是劫灰。」',
            progress: '渡过九重天劫，每重天劫都需要不同的应对策略…',
            complete: '九重天劫全部渡过！你的身体开始转化为仙体…'
        },
        'main_032': {
            accept: '天劫过后，心魔来袭。你一生中的所有选择都将在此刻接受审判。\n「你…可曾后悔？」',
            progress: '面对心魔，坚守本心。心魔会幻化成你最在意的人或事…',
            complete: '你战胜了心魔！道心更加坚定！'
        },
        'main_033': {
            accept: '魔教余孽趁你渡劫虚弱之际发动了最后的总攻。\n「这是最后的决战了…」',
            progress: '与正道盟军一起，彻底消灭魔教势力…',
            complete: '魔教被彻底消灭，天下太平。但天界之门还在等待着你…'
        },
        'main_034': {
            accept: '所有尘缘已了，你站在天界之门前。回头看了一眼这方世界。\n「是时候了…」',
            progress: '做出最终选择：飞升天界，或留在人间…',
            complete: '你的选择将决定你最终的命运…'
        },
        'main_035': {
            accept: '天界之门缓缓打开，金光万丈。你感受到了前所未有的召唤。\n「飞升吧，这是你应得的。」',
            progress: '踏入天界之门，完成最终的飞升…',
            complete: '祝贺你，飞升成功！你的名字将永远铭刻在仙路长青的传说中…'
        }
    };

    // ==================== NPC个人故事线 ====================
    var NPC_STORY_DIALOGUES = {
        // 清虚道人 - 与魔教圣女的往事
        'npc_mentor_01': { accept: '清虚道人望着远方，叹了口气。\n「你来了…我最近总是想起往事。」', progress: '清虚开始讲述他年轻时与魔教圣女的故事…', complete: '「谢谢你听我说这些。这是我年轻时的心结。」' },
        'npc_mentor_02': { accept: '清虚道人递给你一封泛黄的信。\n「这是她当年写给我的信…你能帮我找到她吗？」', progress: '寻找魔教圣女的下落，她可能隐藏在某个城市…', complete: '你找到了魔教圣女的下落，她隐居在蓬莱仙岛…' },
        'npc_mentor_03': { accept: '清虚道人和魔教圣女终于重逢了。\n「这么多年了…你还好吗？」', progress: '调解清虚与圣女之间的恩怨，让他们化解心结…', complete: '两人握手言和，清虚道人的心结终于解开…' },
        'npc_mentor_04': { accept: '清虚道人感激地看着你。\n「多亏了你，我才能放下这段往事。这是我独创的功法，传授给你。」', progress: '学习清虚道人传授的独门功法…', complete: '你学会了清虚道人的独门功法！' },
        // 灵素 - 身患奇毒的真相
        'npc_healer_01': { accept: '灵素咳嗽了几声，脸色苍白。\n「你来了…我最近身体越来越差了。」', progress: '灵素透露她身患奇毒，需要寻找解毒药材…', complete: '你了解了灵素的病情，决定帮她寻找解药…' },
        'npc_healer_02': { accept: '灵素虚弱地说：\n「要解毒需要三种药材：千年灵芝、龙涎草、凤凰血。」', progress: '收集三种解毒药材：千年灵芝、龙涎草、凤凰血…', complete: '药材收集齐了，可以开始炼制解药…' },
        'npc_healer_03': { accept: '灵素服下解药后，脸色渐渐恢复红润。\n「我感觉好多了…谢谢你救了我的命！」', progress: '陪伴灵素恢复，帮她调理身体…', complete: '灵素完全康复了！她感激地表示愿意成为你的专属治疗师…' },
        // 铁山 - 神秘对手的身份
        'npc_warrior_01': { accept: '铁山擦着汗，神情凝重。\n「我一直在找那个打败我的人…」', progress: '铁山讲述了他当年败给神秘对手的经过…', complete: '你决定帮铁山调查这个神秘对手的身份…' },
        'npc_warrior_02': { accept: '调查发现，铁山的对手是魔教的一名护法。\n「原来是他…难怪当年我败得那么惨。」', progress: '找到魔教护法的藏身之处，准备决战…', complete: '找到了魔教护法的老巢…' },
        'npc_warrior_03': { accept: '铁山站在魔教护法面前，战意高昂。\n「来吧，当年的恩怨，今日了结！」', progress: '与铁山一起击败魔教护法…', complete: '魔教护法被击败！铁山终于解开了多年的心结…' },
        'npc_warrior_04': { accept: '铁山感激地拍了拍你的肩膀。\n「多谢你了！这套拳法是我毕生所学，传授给你。」', progress: '学习铁山传授的战斗技巧…', complete: '你学会了铁山的独门拳法！' },
        // 贾有道 - 禁品交易的背后
        'npc_merchant_01': { accept: '贾有道神秘地压低声音。\n「兄弟，我这里有一批好货，要不要看看？」', progress: '贾有道展示了他的禁品交易网络…', complete: '你了解了贾有道的禁品交易，决定深入调查…' },
        'npc_merchant_02': { accept: '贾有道交给你一个任务。\n「帮我把这批货运到金城，报酬少不了你的。」', progress: '帮贾有道完成一次禁品运输任务…', complete: '运输完成，你发现了交易背后的更大阴谋…' },
        'npc_merchant_03': { accept: '你发现贾有道的禁品交易背后有魔教的影子。\n「你…你怎么知道的？」贾有道脸色大变…', progress: '选择：举报贾有道，或与他同流合污…', complete: '你的选择将决定贾有道的命运…' },
        'npc_merchant_04': { accept: '（根据你的选择，贾有道的结局不同）\n如果你举报了他，他被官府带走；如果你包庇了他，他成了你的心腹…', progress: '贾有道的结局已定…', complete: '贾有道的事情告一段落…' },
        // 神秘老者 - 上古大能的复仇
        'npc_mysterious_01': { accept: '神秘老者目光深邃。\n「你终于来了…我等你很久了。」', progress: '老者透露了他上古大能的身份，以及他的仇敌…', complete: '你震惊地发现，这位老者竟是上古时期的仙尊…' },
        'npc_mysterious_02': { accept: '老者缓缓说道：\n「我的仇敌是魔教始祖，他背叛了我，夺取了我的修为。」', progress: '帮助老者寻找恢复实力的方法…', complete: '找到了恢复实力的关键——上古灵脉…' },
        'npc_mysterious_03': { accept: '老者的实力恢复了大半。\n「现在，是时候去找他了。你愿意陪我走这一趟吗？」', progress: '与老者一起前往魔教禁地，面对魔教始祖…', complete: '一场惊天动地的大战…' },
        'npc_mysterious_04': { accept: '击败魔教始祖后，老者终于放下了执念。\n「我这一生，所求不过是一个公道。如今心愿已了。」', progress: '老者决定将毕生修为传授给你…', complete: '你获得了上古大能的完整传承！' },
        // 柳随风 - 魔教卧底的身份
        'npc_rival_01': { accept: '柳随风风度翩翩地走来，但眼神中有一丝不易察觉的阴郁。\n「又见面了。你最近在调查我？」', progress: '你发现柳随风行踪可疑，经常深夜出入魔教据点…', complete: '你确认了柳随风是魔教卧底的身份…' },
        'npc_rival_02': { accept: '柳随风坦然承认了身份。\n「没错，我是魔教的人。但事情不是你想的那样。」', progress: '柳随风讲述了他的故事——他从小被魔教收养，身不由己…', complete: '你了解了柳随风的苦衷…' },
        'npc_rival_03': { accept: '柳随风面临抉择：继续为魔教效力，还是背叛魔教。\n「你说…我该怎么办？」', progress: '选择：劝他归顺正道，或支持他继续卧底，或举报他…', complete: '柳随风做出了他的选择…' },
        'npc_rival_04': { accept: '（根据你的选择，柳随风的结局不同）\n如果归顺：他成了正道的重要情报来源。\n如果继续卧底：他成了双面间谍。\n如果举报：他被囚禁，但保住了性命…', progress: '柳随风的命运已定…', complete: '柳随风的故事告一段落…' }
    };

    // NPC个人故事线任务
    var extraNPCQuests = [
        // 清虚道人故事线（3步）
        { id: 'npc_mentor_01', title: '往事如烟', type: 'npc_story', npcId: 'mentor_01', priority: { id: 'medium', name: '重要', color: 'text-blue-400' },
          description: '与清虚道人交谈，倾听他的往事…', minAffection: 20,
          objectives: [{ type: 'talk_to_npc', npcId: 'mentor_01', count: 1, completed: false }],
          rewards: { exp: 500, spiritStones: 200, affection: 5 },
          storyDialogue: NPC_STORY_DIALOGUES['npc_mentor_01'], accepted: false, completed: false, turnedIn: false },
        { id: 'npc_mentor_02', title: '寻人启事', type: 'npc_story', npcId: 'mentor_01', priority: { id: 'medium', name: '重要', color: 'text-blue-400' },
          description: '帮清虚道人寻找魔教圣女的下落…', minAffection: 40,
          objectives: [{ type: 'explore', count: 1, completed: false }],
          rewards: { exp: 1000, spiritStones: 500, affection: 10 },
          storyDialogue: NPC_STORY_DIALOGUES['npc_mentor_02'], accepted: false, completed: false, turnedIn: false },
        { id: 'npc_mentor_03', title: '重逢', type: 'npc_story', npcId: 'mentor_01', priority: { id: 'medium', name: '重要', color: 'text-blue-400' },
          description: '帮助清虚道人化解与魔教圣女的恩怨…', minAffection: 60,
          objectives: [{ type: 'talk_to_npc', npcId: 'mentor_01', count: 3, completed: false }],
          rewards: { exp: 2000, spiritStones: 1000, affection: 15, items: [{ itemId: 'art_taiji_sword', count: 1 }] },
          storyDialogue: NPC_STORY_DIALOGUES['npc_mentor_03'], accepted: false, completed: false, turnedIn: false },
        // 灵素故事线（3步）
        { id: 'npc_healer_01', title: '隐疾', type: 'npc_story', npcId: 'healer_01', priority: { id: 'medium', name: '重要', color: 'text-blue-400' },
          description: '了解灵素的病情，寻找解毒方法…', minAffection: 20,
          objectives: [{ type: 'talk_to_npc', npcId: 'healer_01', count: 1, completed: false }],
          rewards: { exp: 500, spiritStones: 200, affection: 5 },
          storyDialogue: NPC_STORY_DIALOGUES['npc_healer_01'], accepted: false, completed: false, turnedIn: false },
        { id: 'npc_healer_02', title: '寻药', type: 'npc_story', npcId: 'healer_01', priority: { id: 'medium', name: '重要', color: 'text-blue-400' },
          description: '收集解毒药材：千年灵芝、龙涎草、凤凰血…', minAffection: 40,
          objectives: [{ type: 'collect', item: 'mat_thousand_lingzhi', count: 1, completed: false }, { type: 'collect', item: 'mat_dragon_grass', count: 1, completed: false }, { type: 'collect', item: 'mat_phoenix_blood', count: 1, completed: false }],
          rewards: { exp: 1500, spiritStones: 800, affection: 10 },
          storyDialogue: NPC_STORY_DIALOGUES['npc_healer_02'], accepted: false, completed: false, turnedIn: false },
        { id: 'npc_healer_03', title: '康复', type: 'npc_story', npcId: 'healer_01', priority: { id: 'medium', name: '重要', color: 'text-blue-400' },
          description: '陪伴灵素康复，她将成为你的专属治疗师…', minAffection: 60,
          objectives: [{ type: 'talk_to_npc', npcId: 'healer_01', count: 2, completed: false }],
          rewards: { exp: 2000, spiritStones: 1000, affection: 15, items: [{ itemId: 'pill_nine_revival', count: 3 }] },
          storyDialogue: NPC_STORY_DIALOGUES['npc_healer_03'], accepted: false, completed: false, turnedIn: false },
        // 铁山故事线（4步）
        { id: 'npc_warrior_01', title: '往昔对手', type: 'npc_story', npcId: 'warrior_01', priority: { id: 'medium', name: '重要', color: 'text-blue-400' },
          description: '听铁山讲述他当年的对手…', minAffection: 20,
          objectives: [{ type: 'talk_to_npc', npcId: 'warrior_01', count: 1, completed: false }],
          rewards: { exp: 500, spiritStones: 200, affection: 5 },
          storyDialogue: NPC_STORY_DIALOGUES['npc_warrior_01'], accepted: false, completed: false, turnedIn: false },
        { id: 'npc_warrior_02', title: '调查', type: 'npc_story', npcId: 'warrior_01', priority: { id: 'medium', name: '重要', color: 'text-blue-400' },
          description: '帮铁山调查神秘对手的身份…', minAffection: 40,
          objectives: [{ type: 'explore', count: 1, completed: false }],
          rewards: { exp: 1000, spiritStones: 500, affection: 10 },
          storyDialogue: NPC_STORY_DIALOGUES['npc_warrior_02'], accepted: false, completed: false, turnedIn: false },
        { id: 'npc_warrior_03', title: '决战', type: 'npc_story', npcId: 'warrior_01', priority: { id: 'high', name: '紧急', color: 'text-yellow-400' },
          description: '与铁山一起击败魔教护法…', minAffection: 60,
          objectives: [{ type: 'kill', target: '魔教护法', count: 1, completed: false }],
          rewards: { exp: 3000, spiritStones: 1500, affection: 15, items: [{ itemId: 'arm_golden_silk_armor', count: 1 }] },
          storyDialogue: NPC_STORY_DIALOGUES['npc_warrior_03'], accepted: false, completed: false, turnedIn: false },
        { id: 'npc_warrior_04', title: '传承', type: 'npc_story', npcId: 'warrior_01', priority: { id: 'medium', name: '重要', color: 'text-blue-400' },
          description: '学习铁山的独门拳法…', minAffection: 80,
          objectives: [{ type: 'talk_to_npc', npcId: 'warrior_01', count: 1, completed: false }],
          rewards: { exp: 5000, spiritStones: 2000, affection: 20, items: [{ itemId: 'art_iron_fist', count: 1 }] },
          storyDialogue: NPC_STORY_DIALOGUES['npc_warrior_04'], accepted: false, completed: false, turnedIn: false },
        // 贾有道故事线（4步）
        { id: 'npc_merchant_01', title: '禁品交易', type: 'npc_story', npcId: 'merchant_01', priority: { id: 'medium', name: '重要', color: 'text-blue-400' },
          description: '了解贾有道的禁品交易…', minAffection: 20,
          objectives: [{ type: 'talk_to_npc', npcId: 'merchant_01', count: 1, completed: false }],
          rewards: { exp: 500, spiritStones: 300, affection: 5 },
          storyDialogue: NPC_STORY_DIALOGUES['npc_merchant_01'], accepted: false, completed: false, turnedIn: false },
        { id: 'npc_merchant_02', title: '运货', type: 'npc_story', npcId: 'merchant_01', priority: { id: 'medium', name: '重要', color: 'text-blue-400' },
          description: '帮贾有道完成一次禁品运输…', minAffection: 40,
          objectives: [{ type: 'deliver', count: 1, completed: false }],
          rewards: { exp: 1000, spiritStones: 800, affection: 10 },
          storyDialogue: NPC_STORY_DIALOGUES['npc_merchant_02'], accepted: false, completed: false, turnedIn: false },
        { id: 'npc_merchant_03', title: '抉择', type: 'npc_story', npcId: 'merchant_01', priority: { id: 'high', name: '紧急', color: 'text-yellow-400' },
          description: '发现交易背后的魔教阴谋，做出选择…', minAffection: 60,
          objectives: [{ type: 'talk_to_npc', npcId: 'merchant_01', count: 1, completed: false }],
          rewards: { exp: 2000, spiritStones: 1000, affection: 15 },
          storyDialogue: NPC_STORY_DIALOGUES['npc_merchant_03'], accepted: false, completed: false, turnedIn: false },
        { id: 'npc_merchant_04', title: '结局', type: 'npc_story', npcId: 'merchant_01', priority: { id: 'medium', name: '重要', color: 'text-blue-400' },
          description: '贾有道的最终命运…', minAffection: 80,
          objectives: [{ type: 'talk_to_npc', npcId: 'merchant_01', count: 1, completed: false }],
          rewards: { exp: 3000, spiritStones: 2000, affection: 20, items: [{ itemId: 'spec_spirit_crystal', count: 5 }] },
          storyDialogue: NPC_STORY_DIALOGUES['npc_merchant_04'], accepted: false, completed: false, turnedIn: false },
        // 神秘老者故事线（4步）
        { id: 'npc_mysterious_01', title: '上古秘闻', type: 'npc_story', npcId: 'mysterious_01', priority: { id: 'medium', name: '重要', color: 'text-blue-400' },
          description: '了解神秘老者的真实身份…', minAffection: 20,
          objectives: [{ type: 'talk_to_npc', npcId: 'mysterious_01', count: 1, completed: false }],
          rewards: { exp: 1000, spiritStones: 500, affection: 5 },
          storyDialogue: NPC_STORY_DIALOGUES['npc_mysterious_01'], accepted: false, completed: false, turnedIn: false },
        { id: 'npc_mysterious_02', title: '恢复实力', type: 'npc_story', npcId: 'mysterious_01', priority: { id: 'medium', name: '重要', color: 'text-blue-400' },
          description: '帮助老者寻找恢复实力的方法…', minAffection: 40,
          objectives: [{ type: 'explore_dungeon', dungeon: 'mountain', count: 1, completed: false }],
          rewards: { exp: 3000, spiritStones: 1500, affection: 10 },
          storyDialogue: NPC_STORY_DIALOGUES['npc_mysterious_02'], accepted: false, completed: false, turnedIn: false },
        { id: 'npc_mysterious_03', title: '最终对决', type: 'npc_story', npcId: 'mysterious_01', priority: { id: 'high', name: '紧急', color: 'text-yellow-400' },
          description: '与老者一起面对魔教始祖…', minAffection: 60,
          objectives: [{ type: 'kill', target: '魔教始祖', count: 1, completed: false }],
          rewards: { exp: 10000, spiritStones: 5000, affection: 20, items: [{ itemId: 'mat_chaos_stone', count: 3 }] },
          storyDialogue: NPC_STORY_DIALOGUES['npc_mysterious_03'], accepted: false, completed: false, turnedIn: false },
        { id: 'npc_mysterious_04', title: '上古传承', type: 'npc_story', npcId: 'mysterious_01', priority: { id: 'medium', name: '重要', color: 'text-blue-400' },
          description: '获得老者的毕生传承…', minAffection: 80,
          objectives: [{ type: 'talk_to_npc', npcId: 'mysterious_01', count: 1, completed: false }],
          rewards: { exp: 20000, spiritStones: 10000, affection: 30, items: [{ itemId: 'art_chaos_art', count: 1 }] },
          storyDialogue: NPC_STORY_DIALOGUES['npc_mysterious_04'], accepted: false, completed: false, turnedIn: false },
        // 柳随风故事线（4步）
        { id: 'npc_rival_01', title: '可疑之人', type: 'npc_story', npcId: 'rival_01', priority: { id: 'medium', name: '重要', color: 'text-blue-400' },
          description: '调查柳随风的真实身份…', minAffection: 20,
          objectives: [{ type: 'explore', count: 1, completed: false }],
          rewards: { exp: 800, spiritStones: 400, affection: 5 },
          storyDialogue: NPC_STORY_DIALOGUES['npc_rival_01'], accepted: false, completed: false, turnedIn: false },
        { id: 'npc_rival_02', title: '魔教卧底', type: 'npc_story', npcId: 'rival_01', priority: { id: 'medium', name: '重要', color: 'text-blue-400' },
          description: '柳随风坦白了他的卧底身份…', minAffection: 40,
          objectives: [{ type: 'talk_to_npc', npcId: 'rival_01', count: 1, completed: false }],
          rewards: { exp: 1000, spiritStones: 500, affection: 10 },
          storyDialogue: NPC_STORY_DIALOGUES['npc_rival_02'], accepted: false, completed: false, turnedIn: false },
        { id: 'npc_rival_03', title: '立场抉择', type: 'npc_story', npcId: 'rival_01', priority: { id: 'high', name: '紧急', color: 'text-yellow-400' },
          description: '帮助柳随风做出选择…', minAffection: 60,
          objectives: [{ type: 'talk_to_npc', npcId: 'rival_01', count: 1, completed: false }],
          rewards: { exp: 2000, spiritStones: 1000, affection: 15 },
          storyDialogue: NPC_STORY_DIALOGUES['npc_rival_03'], accepted: false, completed: false, turnedIn: false },
        { id: 'npc_rival_04', title: '随风而去', type: 'npc_story', npcId: 'rival_01', priority: { id: 'medium', name: '重要', color: 'text-blue-400' },
          description: '柳随风的最终命运…', minAffection: 80,
          objectives: [{ type: 'talk_to_npc', npcId: 'rival_01', count: 1, completed: false }],
          rewards: { exp: 5000, spiritStones: 3000, affection: 20, items: [{ itemId: 'wpn_feng_sword', count: 1 }] },
          storyDialogue: NPC_STORY_DIALOGUES['npc_rival_04'], accepted: false, completed: false, turnedIn: false }
    ];

    // 主线扩展（15个新增，总计35个，覆盖全部9境界→飞升）
    var extraMain = [
        // === 第四章：金丹大道（main_021-023）===
        { id: 'main_021', title: '金丹传承', type: 'main', priority: { id: 'critical', name: '主线', color: 'text-red-500' },
          description: STORY_DIALOGUES['main_021'].accept,
          objectives: [{ type: 'explore_dungeon', dungeon: 'mountain', count: 1, completed: false }],
          rewards: { exp: 10000, spiritStones: 8000, items: [{ itemId: 'pill_golden_core', count: 3 }] },
          storyDialogue: STORY_DIALOGUES['main_021'], accepted: false, completed: false, turnedIn: false },
        { id: 'main_022', title: '灵脉修炼', type: 'main', priority: { id: 'critical', name: '主线', color: 'text-red-500' },
          description: STORY_DIALOGUES['main_022'].accept,
          objectives: [{ type: 'cultivate', amount: 5000, completed: false }],
          rewards: { exp: 12000, spiritStones: 5000, items: [{ itemId: 'mat_spirit_spring', count: 5 }] },
          storyDialogue: STORY_DIALOGUES['main_022'], accepted: false, completed: false, turnedIn: false },
        { id: 'main_023', title: '宗门之争', type: 'main', priority: { id: 'high', name: '紧急', color: 'text-yellow-400' },
          description: STORY_DIALOGUES['main_023'].accept,
          objectives: [{ type: 'kill', target: '宗门弟子', count: 10, completed: false }],
          rewards: { exp: 15000, spiritStones: 10000, items: [{ itemId: 'pill_primordial', count: 1 }] },
          storyDialogue: STORY_DIALOGUES['main_023'], accepted: false, completed: false, turnedIn: false },
        // === 第五章：元婴出窍（main_024-026）===
        { id: 'main_024', title: '血色漩涡', type: 'main', priority: { id: 'critical', name: '主线', color: 'text-red-500' },
          description: STORY_DIALOGUES['main_024'].accept,
          objectives: [{ type: 'explore', count: 1, completed: false }],
          rewards: { exp: 20000, spiritStones: 12000, items: [{ itemId: 'mat_dragon_blood', count: 3 }] },
          storyDialogue: STORY_DIALOGUES['main_024'], accepted: false, completed: false, turnedIn: false },
        { id: 'main_025', title: '宗门守卫战', type: 'main', priority: { id: 'high', name: '紧急', color: 'text-yellow-400' },
          description: STORY_DIALOGUES['main_025'].accept,
          objectives: [{ type: 'kill', target: '魔教弟子', count: 30, completed: false }, { type: 'kill', target: '魔教护法', count: 3, completed: false }],
          rewards: { exp: 25000, spiritStones: 15000, items: [{ itemId: 'arm_dragon_scale_armor', count: 1 }] },
          storyDialogue: STORY_DIALOGUES['main_025'], accepted: false, completed: false, turnedIn: false },
        { id: 'main_026', title: '元婴破壳', type: 'main', priority: { id: 'critical', name: '主线', color: 'text-red-500' },
          description: STORY_DIALOGUES['main_026'].accept,
          objectives: [{ type: 'breakthrough_realm', fromRealm: '金丹', toRealm: '元婴', completed: false }],
          rewards: { exp: 30000, spiritStones: 20000, items: [{ itemId: 'wpn_xu_yuan', count: 1 }, { itemId: 'pill_primordial', count: 3 }] },
          storyDialogue: STORY_DIALOGUES['main_026'], accepted: false, completed: false, turnedIn: false },
        // === 第六章：化神之秘（main_027-029）===
        { id: 'main_027', title: '上古真相', type: 'main', priority: { id: 'critical', name: '主线', color: 'text-red-500' },
          description: STORY_DIALOGUES['main_027'].accept,
          objectives: [{ type: 'explore_dungeon', dungeon: 'ruin', count: 3, completed: false }],
          rewards: { exp: 40000, spiritStones: 25000, items: [{ itemId: 'mat_chaos_stone', count: 1 }] },
          storyDialogue: STORY_DIALOGUES['main_027'], accepted: false, completed: false, turnedIn: false },
        { id: 'main_028', title: '五行本源', type: 'main', priority: { id: 'critical', name: '主线', color: 'text-red-500' },
          description: STORY_DIALOGUES['main_028'].accept,
          objectives: [{ type: 'collect', item: 'mat_five_element_essence', count: 50, completed: false }],
          rewards: { exp: 50000, spiritStones: 30000, items: [{ itemId: 'pill_divine', count: 2 }] },
          storyDialogue: STORY_DIALOGUES['main_028'], accepted: false, completed: false, turnedIn: false },
        { id: 'main_029', title: '化神天劫', type: 'main', priority: { id: 'critical', name: '主线', color: 'text-red-500' },
          description: STORY_DIALOGUES['main_029'].accept,
          objectives: [{ type: 'breakthrough_realm', fromRealm: '元婴', toRealm: '化神', completed: false }],
          rewards: { exp: 80000, spiritStones: 50000, items: [{ itemId: 'arm_nine_heaven_robe', count: 1 }, { itemId: 'pill_sutra_change', count: 2 }] },
          storyDialogue: STORY_DIALOGUES['main_029'], accepted: false, completed: false, turnedIn: false },
        // === 第七章：飞升之劫（main_030-035）===
        { id: 'main_030', title: '天界之门', type: 'main', priority: { id: 'critical', name: '主线', color: 'text-red-500' },
          description: STORY_DIALOGUES['main_030'].accept,
          objectives: [{ type: 'explore', count: 1, completed: false }],
          rewards: { exp: 100000, spiritStones: 60000, items: [{ itemId: 'spec_spirit_crystal', count: 10 }] },
          storyDialogue: STORY_DIALOGUES['main_030'], accepted: false, completed: false, turnedIn: false },
        { id: 'main_031', title: '九重天劫', type: 'main', priority: { id: 'critical', name: '主线', color: 'text-red-500' },
          description: STORY_DIALOGUES['main_031'].accept,
          objectives: [{ type: 'breakthrough_realm', fromRealm: '化神', toRealm: '炼虚', completed: false }],
          rewards: { exp: 150000, spiritStones: 80000, items: [{ itemId: 'wpn_zhu_xian', count: 1 }] },
          storyDialogue: STORY_DIALOGUES['main_031'], accepted: false, completed: false, turnedIn: false },
        { id: 'main_032', title: '心魔考验', type: 'main', priority: { id: 'critical', name: '主线', color: 'text-red-500' },
          description: STORY_DIALOGUES['main_032'].accept,
          objectives: [{ type: 'breakthrough_realm', fromRealm: '炼虚', toRealm: '合体', completed: false }],
          rewards: { exp: 200000, spiritStones: 100000, items: [{ itemId: 'art_chaos_art', count: 1 }] },
          storyDialogue: STORY_DIALOGUES['main_032'], accepted: false, completed: false, turnedIn: false },
        { id: 'main_033', title: '最终决战', type: 'main', priority: { id: 'high', name: '紧急', color: 'text-yellow-400' },
          description: STORY_DIALOGUES['main_033'].accept,
          objectives: [{ type: 'kill', target: '魔教教主', count: 1, completed: false }, { type: 'kill', target: '魔教长老', count: 5, completed: false }],
          rewards: { exp: 300000, spiritStones: 150000, items: [{ itemId: 'pill_rebirth', count: 1 }] },
          storyDialogue: STORY_DIALOGUES['main_033'], accepted: false, completed: false, turnedIn: false },
        { id: 'main_034', title: '尘缘了断', type: 'main', priority: { id: 'critical', name: '主线', color: 'text-red-500' },
          description: STORY_DIALOGUES['main_034'].accept,
          objectives: [{ type: 'breakthrough_realm', fromRealm: '合体', toRealm: '大乘', completed: false }],
          rewards: { exp: 500000, spiritStones: 200000, items: [{ itemId: 'pill_divine', count: 5 }] },
          storyDialogue: STORY_DIALOGUES['main_034'], accepted: false, completed: false, turnedIn: false },
        { id: 'main_035', title: '渡劫飞升', type: 'main', priority: { id: 'critical', name: '主线', color: 'text-red-500' },
          description: STORY_DIALOGUES['main_035'].accept,
          objectives: [{ type: 'breakthrough_realm', fromRealm: '大乘', toRealm: '渡劫', completed: false }],
          rewards: { exp: 1000000, spiritStones: 500000, items: [{ itemId: 'spec_immortal_token', count: 1 }] },
          storyDialogue: STORY_DIALOGUES['main_035'], accepted: false, completed: false, turnedIn: false }
    ];

    // 随机任务（20个）
    var extraRandom = [
        { id: 'random_001', title: '采集灵草', type: 'random', priority: { id: 'low', name: '普通', color: 'text-gray-400' }, description: '采集10株灵芝…', objectives: [{ type: 'collect', item: 'mat_lingzhi', count: 10, completed: false }], rewards: { exp: 80, spiritStones: 60 }, accepted: false, completed: false, turnedIn: false },
        { id: 'random_002', title: '猎杀妖兽', type: 'random', priority: { id: 'low', name: '普通', color: 'text-gray-400' }, description: '猎杀5只妖兽…', objectives: [{ type: 'kill', target: '妖兽', count: 5, completed: false }], rewards: { exp: 100, spiritStones: 80, items: [{ itemId: 'mat_beast_skin', count: 3 }] }, accepted: false, completed: false, turnedIn: false },
        { id: 'random_003', title: '矿石采集', type: 'random', priority: { id: 'low', name: '普通', color: 'text-gray-400' }, description: '采集15块精铁…', objectives: [{ type: 'collect', item: 'mat_refined_iron', count: 15, completed: false }], rewards: { exp: 60, spiritStones: 100 }, accepted: false, completed: false, turnedIn: false },
        { id: 'random_004', title: '护送商队', type: 'random', priority: { id: 'medium', name: '重要', color: 'text-blue-400' }, description: '护送商队安全穿越危险区域…', objectives: [{ type: 'escort', count: 1, completed: false }], rewards: { exp: 200, spiritStones: 150 }, accepted: false, completed: false, turnedIn: false },
        { id: 'random_005', title: '探索洞穴', type: 'random', priority: { id: 'medium', name: '重要', color: 'text-blue-400' }, description: '探索未知洞穴带回宝物…', objectives: [{ type: 'explore', count: 1, completed: false }], rewards: { exp: 150, spiritStones: 120 }, accepted: false, completed: false, turnedIn: false },
        { id: 'random_006', title: '击败山贼头目', type: 'random', priority: { id: 'medium', name: '重要', color: 'text-blue-400' }, description: '教训山贼头目…', objectives: [{ type: 'kill', target: '山贼头目', count: 1, completed: false }], rewards: { exp: 250, spiritStones: 200 }, accepted: false, completed: false, turnedIn: false },
        { id: 'random_007', title: '传递消息', type: 'random', priority: { id: 'low', name: '普通', color: 'text-gray-400' }, description: '将信件送到邻近城市…', objectives: [{ type: 'deliver', count: 1, completed: false }], rewards: { exp: 50, spiritStones: 80 }, accepted: false, completed: false, turnedIn: false },
        { id: 'random_008', title: '清理遗迹', type: 'random', priority: { id: 'medium', name: '重要', color: 'text-blue-400' }, description: '遗迹中有魔物盘踞…', objectives: [{ type: 'kill', target: '魔物', count: 8, completed: false }], rewards: { exp: 300, spiritStones: 250, items: [{ itemId: 'mat_five_element_essence', count: 2 }] }, accepted: false, completed: false, turnedIn: false },
        { id: 'random_009', title: '炼丹委托', type: 'random', priority: { id: 'medium', name: '重要', color: 'text-blue-400' }, description: '炼制一批回春丹…', objectives: [{ type: 'craft', item: 'pill_spring_recovery', count: 3, completed: false }], rewards: { exp: 200, spiritStones: 300 }, accepted: false, completed: false, turnedIn: false },
        { id: 'random_010', title: '锻造武器', type: 'random', priority: { id: 'medium', name: '重要', color: 'text-blue-400' }, description: '锻造一把青钢剑…', objectives: [{ type: 'craft', item: 'wpn_steel_sword', count: 1, completed: false }], rewards: { exp: 300, spiritStones: 400 }, accepted: false, completed: false, turnedIn: false },
        { id: 'random_011', title: '灵泉取水', type: 'random', priority: { id: 'low', name: '普通', color: 'text-gray-400' }, description: '去灵泉取一瓶灵泉水…', objectives: [{ type: 'collect', item: 'spec_ten_thousand_milk', count: 1, completed: false }], rewards: { exp: 100, spiritStones: 100 }, accepted: false, completed: false, turnedIn: false },
        { id: 'random_012', title: '妖兽巢穴', type: 'random', priority: { id: 'high', name: '紧急', color: 'text-yellow-400' }, description: '彻底清除妖兽巢穴…', objectives: [{ type: 'kill', target: '妖兽', count: 15, completed: false }], rewards: { exp: 500, spiritStones: 400, items: [{ itemId: 'mat_demon_beast_core', count: 3 }] }, accepted: false, completed: false, turnedIn: false },
        { id: 'random_013', title: '寻找失踪修士', type: 'random', priority: { id: 'medium', name: '重要', color: 'text-blue-400' }, description: '在秘境中寻找失踪修士…', objectives: [{ type: 'explore_dungeon', dungeon: 'cave', count: 1, completed: false }], rewards: { exp: 400, spiritStones: 300 }, accepted: false, completed: false, turnedIn: false },
        { id: 'random_014', title: '收集兽皮', type: 'random', priority: { id: 'low', name: '普通', color: 'text-gray-400' }, description: '收集妖兽皮制作装备…', objectives: [{ type: 'collect', item: 'mat_demon_beast_skin', count: 10, completed: false }], rewards: { exp: 80, spiritStones: 150 }, accepted: false, completed: false, turnedIn: false },
        { id: 'random_015', title: '雪莲采集', type: 'random', priority: { id: 'medium', name: '重要', color: 'text-blue-400' }, description: '去雪山采集天山雪莲…', objectives: [{ type: 'collect', item: 'mat_snow_lotus', count: 5, completed: false }], rewards: { exp: 200, spiritStones: 250 }, accepted: false, completed: false, turnedIn: false },
        { id: 'random_016', title: '符箓绘制', type: 'random', priority: { id: 'medium', name: '重要', color: 'text-blue-400' }, description: '绘制火球符用于防御…', objectives: [{ type: 'craft', item: 'tal_fireball', count: 5, completed: false }], rewards: { exp: 150, spiritStones: 200 }, accepted: false, completed: false, turnedIn: false },
        { id: 'random_017', title: '竞技挑战', type: 'random', priority: { id: 'medium', name: '重要', color: 'text-blue-400' }, description: '在竞技场中连胜3场…', objectives: [{ type: 'arena_win', count: 3, completed: false }], rewards: { exp: 400, spiritStones: 500 }, accepted: false, completed: false, turnedIn: false },
        { id: 'random_018', title: '驱逐邪修', type: 'random', priority: { id: 'high', name: '紧急', color: 'text-yellow-400' }, description: '驱逐作乱的邪修…', objectives: [{ type: 'kill', target: '邪修', count: 3, completed: false }], rewards: { exp: 600, spiritStones: 500, items: [{ itemId: 'mat_purple_gold', count: 2 }] }, accepted: false, completed: false, turnedIn: false },
        { id: 'random_019', title: '守护灵田', type: 'random', priority: { id: 'medium', name: '重要', color: 'text-blue-400' }, description: '守护灵田不被妖兽破坏…', objectives: [{ type: 'defend', count: 1, completed: false }], rewards: { exp: 200, spiritStones: 150 }, accepted: false, completed: false, turnedIn: false },
        { id: 'random_020', title: '深海寻珠', type: 'random', priority: { id: 'high', name: '紧急', color: 'text-yellow-400' }, description: '去深海寻找灵源珠…', objectives: [{ type: 'collect', item: 'spec_spirit_source_pearl', count: 1, completed: false }], rewards: { exp: 500, spiritStones: 800, items: [{ itemId: 'pill_marrow_wash', count: 1 }] }, accepted: false, completed: false, turnedIn: false }
    ];

    // 合并到全局
    function merge() {
        if (typeof window.mainQuestChain !== 'undefined' && Array.isArray(window.mainQuestChain)) {
            var existMain = window.mainQuestChain.map(function(q) { return q.id; });
            for (var i = 0; i < extraMain.length; i++) {
                if (existMain.indexOf(extraMain[i].id) === -1) {
                    window.mainQuestChain.push(extraMain[i]);
                }
            }
        }
        if (typeof window.allQuests !== 'undefined' && Array.isArray(window.allQuests)) {
            var existAll = window.allQuests.map(function(q) { return q.id; });
            for (var j = 0; j < extraRandom.length; j++) {
                if (existAll.indexOf(extraRandom[j].id) === -1) {
                    window.allQuests.push(extraRandom[j]);
                }
            }
            // 主线也加入allQuests
            for (var k = 0; k < extraMain.length; k++) {
                if (existAll.indexOf(extraMain[k].id) === -1) {
                    window.allQuests.push(extraMain[k]);
                }
            }
            // NPC故事线任务加入allQuests
            for (var m = 0; m < extraNPCQuests.length; m++) {
                if (existAll.indexOf(extraNPCQuests[m].id) === -1) {
                    window.allQuests.push(extraNPCQuests[m]);
                }
            }
        }
        // 同时注册到window.npcStoryQuests以便NPC系统访问
        window.npcStoryQuests = extraNPCQuests;
        console.log('[quest-ext] 已添加 ' + extraMain.length + ' 主线 + ' + extraRandom.length + ' 随机 + ' + extraNPCQuests.length + ' NPC故事线任务');
    }

    // quest-system.js 已在本文件之前加载，直接合并；不再用延迟猜加载顺序。
    merge();
})();