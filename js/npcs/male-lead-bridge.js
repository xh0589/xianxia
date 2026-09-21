// ==================== male-lead-bridge.js - 男主论交（情敌和解）事件 v1.0 ====================
// 依赖：npcs/npc-personal-events.js、npcs/male-lead-rivalry.js（detectRivalRomance 已扩展含男主）
//       npc-system.js（setNPCRelationshipPair/adjustNPCRelationshipPair）
// 加载顺序：在 male-lead-rivalry.js 之后
// 复用既有 npcRelationships 配对图 + adjustNPCRelationshipPair 分段逻辑（enemy→neutral→friend→至交）。
// 每位男主独立声口 6 档文案，非通用模板。
// v20.76 第二批：嵩山逵佩南（条文/合符声口）、丐帮桑拾玖（消息/说书声口）入册，九位男主齐。
// v20.77 第三批：阎罗殿聂明泽（档/格/签/复核声口，程序性善意）入册，十位男主齐。
// v20.78 第四批：霹雳堂雷惊蛰（方子/批注/验雷声口）、天书阁宓书言（校讎/签/校记声口）、大隐阁隗九爻（起卦/糖葫芦/半句声口）、
// 侠隐阁简知忆（建档/批注/附页声口）、天涯海阁狄长亭（路引/驿制/公文腔声口）、大旗门樊惊筹（针脚/旗/军中短句声口）入册，十六位男主齐。

var ML_BRIDGE_CD = 14;
var ML_BRIDGE_INTIMATE = 80;

// 档位判定（同女主角版）
function _mlResolveBridgeTier(bRel, bStr, aRel, aStr, choice) {
    if (aRel === 'friend' && aStr >= ML_BRIDGE_INTIMATE) return 'intimate';
    if (aRel === 'friend' && bRel !== 'friend') return 'friend_form';
    if (aRel === 'friend' && bRel === 'friend') return 'friend_deepen';
    if (bRel === 'enemy' && (aRel === 'neutral' || aStr < bStr)) return 'enemy_ease';
    if (bRel === 'neutral' || (bRel === 'enemy' && aRel === 'neutral')) return 'neutral_warm';
    return 'neutral_warm';
}

function _mlPlayerTa() { return (window.currentCharData && window.currentCharData.gender === 'female') ? '她' : '他'; }

// 16 位男主 × 6 档 独立文案
var ML_BRIDGE_TIER_MSGS = {
    'sect_leader_铸剑山庄': { // 冶砚：炉火/铸剑声口
        enemy_ease: function(r){ return '冶砚收了火气，给'+r+'递了把钳子——头一回，他把情敌当炉友不当敌。再论交几回，或可放下。'; },
        neutral_warm: function(r){ return '冶砚送'+r+'出炉房，破天荒说了句「慢走」。他回身把锤子在掌心转了一圈，搁下。再撮合几回，或可成友。'; },
        friend_form: function(r){ return '冶砚把一柄刚开刃的剑递给'+r+'看：「这柄，我替你调的配重。」'+r+'接了——两个铸剑的，在一柄剑上停了战。你这一局，撮合成了。'; },
        friend_deepen: function(r){ return '他俩交换关于'+_mlPlayerTa()+'的糗事，冶砚笑得虎牙全露：「'+_mlPlayerTa()+'怕烫？」'+r+'答：「'+_mlPlayerTa()+'连炉灰都敢碰。」两人笑成一团。再论交几回，或可结金兰。'; },
        intimate: function(r){ return '冶砚把自己那柄三年铸成的剑横在两人之间，让'+r+'握住剑鞘——两双手叠在剑上。「这柄剑，等了三年。」他哑声，「今天，它认了第二个人。」'+_mlPlayerTa()+'来时，他俩再不争先后，只论炉友。'; }
    },
    'sect_leader_药王谷': { // 芩木：医毒/茶声口
        enemy_ease: function(r){ return '芩木收了温润的凉意，给'+r+'倒了杯热茶——头一回，他把情敌当客人不当敌。再论交几回，或可放下。'; },
        neutral_warm: function(r){ return '芩木送'+r+'出药庐，破天荒说了句「慢走」。他回身把那只凉茶杯烫了遍。再撮合几回，或可成友。'; },
        friend_form: function(r){ return '芩木把那张改到十八遍的方子递给'+r+'看：「这味，你师父的方子差在哪。」'+r+'看了一眼：「差在剂量。」芩木竟笑了——两个医毒的，在一张方子上停了战。'; },
        friend_deepen: function(r){ return '他俩交换关于'+_mlPlayerTa()+'的糗事，芩木笑得眼底终于到底：「'+_mlPlayerTa()+'怕苦？」'+r+'答：「'+_mlPlayerTa()+'连断肠草都敢尝。」两人笑。再论交几回，或可结金兰。'; },
        intimate: function(r){ return '芩木把一丸解百毒的药推到'+r+'面前：「从前我替自己留的。今天，替你留。」'+r+'懂了，把自己的一味独门毒草也放进药篓。两人在一壶药茶里结了金兰——'+_mlPlayerTa()+'来时，他俩再不争先后，只论药友。'; }
    },
    'sect_leader_茅山派': { // 昴既明：符箓/阴阳声口
        enemy_ease: function(r){ return '昴既明收了银光，给'+r+'让了半步进符阁——头一回，他把情敌当客不当敌。再论交几回，或可放下。'; },
        neutral_warm: function(r){ return '昴既明送'+r+'出符阁，破天荒说了句「慢走」。他回身把未画完的符收好。再撮合几回，或可成友。'; },
        friend_form: function(r){ return '昴既明把一道渡魂符递给'+r+'看：「这道，我替师兄画的。」'+r+'没说话，把自己的护身符也挂上阁墙——两道符并挂。你这一局，撮合成了。'; },
        friend_deepen: function(r){ return '他俩交换关于'+_mlPlayerTa()+'的糗事，昴既明清冷里裂一线暖：「'+_mlPlayerTa()+'怕鬼？」'+r+'答：「'+_mlPlayerTa()+'连阴阳眼都敢看。」两人在符阁笑。再论交几回，或可结金兰。'; },
        intimate: function(r){ return '昴既明把那道护身符横在两人之间，让'+r+'握住符角——两双手叠在符上。「这道符，我画了三年。」他哑声，「今天，它认了第二个人。」'+_mlPlayerTa()+'来时，他俩再不争先后，只论符友。'; }
    },
    'sect_leader_金刚宗': { // 赫渊：金刚线/塔声口
        enemy_ease: function(r){ return '赫渊松了右臂金刚线一圈，给'+r+'让了塔门半步——头一回，他把情敌当客不当敌。再论交几回，或可放下。'; },
        neutral_warm: function(r){ return '赫渊送'+r+'出塔，破天荒开了口「慢走」。他回身把金刚线又松了一圈。再撮合几回，或可成友。'; },
        friend_form: function(r){ return '赫渊把那块闭口禅木牌翻回正面，递给'+r+'看：「这块，我刻了二十年。」'+r+'没说话，把自己的念珠也放在塔案上。两个守戒的，在一块木牌上停了战。'; },
        friend_deepen: function(r){ return '他俩交换关于'+_mlPlayerTa()+'的糗事，赫渊沉静里罕见地有了暖：「'+_mlPlayerTa()+'怕苦行？」'+r+'答：「'+_mlPlayerTa()+'连金刚线都敢解。」两人在塔里笑。再论交几回，或可结金兰。'; },
        intimate: function(r){ return '赫渊把那圈金刚线解下，横在两人之间，让'+r+'握住线头——两双手叠在线上。「这圈线，我缠了二十年。」他哑声，「今天，它认了第二个人。」'+_mlPlayerTa()+'来时，他俩再不争先后，只论塔友。'; }
    },
    'sect_leader_华山派': { // 竺听雨：雨/账/剑堂声口，笑着说重话（v20.73 入册）
        enemy_ease: function(r){ return '竺听雨收了笑里那点锋，给'+r+'续了盏热茶——头一回，他把情敌当客不当敌。再论交几回，或可放下。'; },
        neutral_warm: function(r){ return '竺听雨送'+r+'下苍龙岭，破天荒叮嘱了句「栈道滑，扶着走」。他回身把案上那两只茶盏收进袖里。再撮合几回，或可成友。'; },
        friend_form: function(r){ return '竺听雨把「听雨」剑横过来，指腹抚过那道锻接痕给'+r+'看：「断了三回才接上的。」'+r+'看了半晌，把自己的剑也抽出来并排搁在案上——两个用剑的，在一道旧痕上停了战。你这一局，撮合成了。'; },
        friend_deepen: function(r){ return '他俩交换关于'+_mlPlayerTa()+'的糗事，竺听雨笑得肩膀直抖：「'+_mlPlayerTa()+'怕雨？」'+r+'答：「'+_mlPlayerTa()+'连断索的栈道都敢走。」两个人在剑堂笑成一团，檐外的雨都没听见。再论交几回，或可结金兰。'; },
        intimate: function(r){ return '竺听雨向'+_mlPlayerTa()+'借了腰间那只旧酒葫芦，拍开一坛「千年醉」灌进去，推到'+r+'面前：「师父的葫芦，装过十年的苦。今天装酒——你喝头一口。」'+r+'喝了，把自己门中的酒也倾进半壶。两只酒混在一处，两个人在剑堂结了金兰——'+_mlPlayerTa()+'来时，他俩再不争先后，只论剑友。'; }
    },
    'sect_leader_武当派': { // 阙守拙：剑/推手/晨钟/扫阶声口，话少而实（v20.74 入册）
        enemy_ease: function(r){ return '阙守拙收了眼底那点剑意，给'+r+'续了一盏茶——头一回，他把情敌当客不当敌。再论交几回，或可放下。'; },
        neutral_warm: function(r){ return '阙守拙送'+r+'下千级石阶，破天荒叮嘱了句「阶滑。走稳」。他回身把案上那两只茶盏一只一只收进殿里。再撮合几回，或可成友。'; },
        friend_form: function(r){ return '阙守拙把「不争」平搁在案上，剑柄转向'+r+'，让'+r+'看清近锷处那两个小字：「不争。师父赐的名。」'+r+'看了半晌，把自己的兵刃也解下来并排搁好——两件兵刃一案，两个用剑的停了战。你这一局，撮合成了。'; },
        friend_deepen: function(r){ return '他俩交换关于'+_mlPlayerTa()+'的糗事。阙守拙说得慢，一字是一字：「'+_mlPlayerTa()+'怕静？」'+r+'答：「'+_mlPlayerTa()+'能在真武殿坐到三更——坐到剑鸣。」阙守拙耳根红了，破天荒接了一整句：「那夜。我在。」'+r+'笑出了声，他没笑，只给'+r+'把茶续上。再论交几回，或可结金兰。'; },
        intimate: function(r){ return '阙守拙起身，抬掌，教'+r+'推了一局手——舍己从人，不攻，不伤。一局推罢，他收掌，一字一顿：「推手不伤人。我教人，只教不伤人的。」'+r+'怔了半晌，深深一揖，取出自己门中的茶叶，倾进案边那只壶里。两个人在真武殿结了金兰——'+_mlPlayerTa()+'来时，他俩再不争先后，只论道。'; }
    },
    'sect_leader_逍遥派': { // 闻人酌：酒/棋/琴声口，慵懒机锋（v20.75 入册）
        enemy_ease: function(r){ return '闻人酌收了酒里那点锋，给'+r+'斟了盏满酒——头一回，他把情敌当酒客不当敌。再论交几回，或可放下。'; },
        neutral_warm: function(r){ return '闻人酌送'+r+'下山门，破天荒没躺回坛边，一直送到阶口，还叮嘱了句「雾大，慢走——酒醒了再上路」。他回身把石桌上那三只盏一只一只收进袖里。再撮合几回，或可成友。'; },
        friend_form: function(r){ return '闻人酌把自己那张从不离身的琴横过石桌，指腹抚过七弦给'+r+'看：「这七根弦，陪了我半生。没让人碰过。」'+r+'看了半晌，把自己随身的信物也解下来，并排搁在琴边——一张琴，一件信物，两个痴人在酒仙池边停了战。你这一局，撮合成了。'; },
        friend_deepen: function(r){ return '他俩交换关于'+_mlPlayerTa()+'的糗事。闻人酌笑得慵懒，酒盏直晃：「'+_mlPlayerTa()+'怕醉？」'+r+'答：「'+_mlPlayerTa()+'连酒仙池的头一盏都敢一饮而尽——面不改色。」闻人酌抚掌大笑，笑完了给'+r+'把盏续上，又低声补了半句：「那回，我掺了三成水——怕酒伤了'+_mlPlayerTa()+'。」'+r+'一怔，也笑了。再论交几回，或可结金兰。'; },
        intimate: function(r){ return '闻人酌把那局残棋重新摆上石桌，分了一半白子给'+r+'：「这局，从前一个人解。如今两个人。」他执黑先落一子，笑得慵懒，「人多，棋才活。」一局下罢，'+r+'久久没起身，取出自己门中的酒，倾进池边那坛新酒里。两个人在酒仙池边结了金兰——'+_mlPlayerTa()+'来时，他俩再不争先后，只论棋与酒。'; }
    },
    'sect_leader_嵩山派': { // 逵佩南：条文/卷宗/合符声口，精确寡言（v20.76 入册）
        enemy_ease: function(r){ return '逵佩南收了条文里那点锋，给'+r+'斟了一盏滤过两遍的酽茶——头一回，他把情敌当堂上的客不当敌。再论交几回，或可放下。'; },
        neutral_warm: function(r){ return '逵佩南送'+r+'出执法堂阶前，破天荒多嘱了一句「山道滑，走石阶内侧」。他回身把案上那两只茶盏一只一只收进堂里。再撮合几回，或可成友。'; },
        friend_form: function(r){ return '逵佩南把那份存了两本的《并派章程》摊开给'+r+'看：「两本对不上，执法堂两本都存。条文不站队，只记录。」'+r+'看了半晌，把自己门中一份两说难断的旧例也摆上案来——两个讲规矩的，在两本章程上停了战。你这一局，撮合成了。'; },
        friend_deepen: function(r){ return '他俩交换关于'+_mlPlayerTa()+'的糗事，逵佩南答得像在堂上宣条：「'+_mlPlayerTa()+'怕罚？」'+r+'答：「'+_mlPlayerTa()+'连执法堂的判词都敢当面驳。」逵佩南唇角极轻微地动了一下——你如今看得懂，这是他的大笑，「驳得对。那一句我记档了。」再论交几回，或可结金兰。'; },
        intimate: function(r){ return '逵佩南取出一册空白的卷宗封皮，横在两人之间，让'+r+'在落款处也押了名——两双手叠在同一册档上。「这一册，无被告，无罪由，永不结案。」他一字一顿，「立档为证：今日入册的，是两个人。」'+r+'郑重把自己门中的一件信物也压进册里。两个人在执法堂结了金兰——'+_mlPlayerTa()+'来时，他俩再不争先后，只勘档，只论条。'; }
    },
    'sect_leader_丐帮': { // 桑拾玖：消息/说书/粥棚声口，讲别人眉飞色舞（v20.76 入册）
        enemy_ease: function(r){ return '桑拾玖收了签上那点锋，给'+r+'盛了一碗热粥——头一回，他把情敌当听客不当敌。再论交几回，或可放下。'; },
        neutral_warm: function(r){ return '桑拾玖送'+r+'出总舵，破天荒没压着嗓子，扬声说了句「下回来，粥棚留座」。他回身把案上那两只粗碗一只一只涮净收好。再撮合几回，或可成友。'; },
        friend_form: function(r){ return '桑拾玖从竹签墙上抽出一支空白签递给'+r+'：「讯房的规矩，立了功的才上墙。这一支，你先刻名。」'+r+'看了半晌，把自己随身的信物也解下来并排搁在案上——一支空签，一件信物，两个懂「不说」二字的，在讯房里停了战。你这一局，撮合成了。'; },
        friend_deepen: function(r){ return '他俩交换关于'+_mlPlayerTa()+'的糗事，桑拾玖讲得眉飞色舞：「'+_mlPlayerTa()+'怕雷？」'+r+'答：「'+_mlPlayerTa()+'雷雨夜敢在城墙上听满一宿。」桑拾玖抚掌笑出了声，笑完压回嗓子，给'+r+'把茶续上，「这条我入册。头等。」再论交几回，或可结金兰。'; },
        intimate: function(r){ return '桑拾玖把自己那只豁口粗碗推到'+r+'面前，盛满，双手递过去：「讨来的每一口，都是人家给你的脸面。这只碗跟了我十二年——今日给你端。」'+r+'双手接了，饮尽，把自己门中的好茶倾进讯房那壶粗茶里。两个人在粥棚边上结了金兰——'+_mlPlayerTa()+'来时，他俩再不争先后，一个讲书，一个听书。'; }
    },
    'sect_leader_阎罗殿': { // 聂明泽：档/格/签/复核声口，又短又平，程序性善意（v20.77 入册）
        enemy_ease: function(r){ return '聂明泽收了核档时那点冷，给'+r+'倒了盏热水——头一回，他把情敌当核档的客不当敌。再论交几回，或可放下。'; },
        neutral_warm: function(r){ return '聂明泽送'+r+'出鬼市长街口，破天荒多嘱了一句「散集路岔多，跟着灯走」。他回身把案上那两只盏一只一只收进档房。再撮合几回，或可成友。'; },
        friend_form: function(r){ return '聂明泽把自己拟的那张「拒查格式」摊开给'+r+'看：「朱批在，档随你查。朱批不在——档，不出此门。」'+r+'看了半晌，把自己门中一套查档的规矩也摆上案来——两个讲格式的，在一张单页上停了战。你这一局，撮合成了。'; },
        friend_deepen: function(r){ return '他俩交换关于'+_mlPlayerTa()+'的糗事，聂明泽答得像念档：「'+_mlPlayerTa()+'怕鬼？」'+r+'答：「'+_mlPlayerTa()+'敢一个人在档房坐到三更——还替记档人核签。」他低头接着归档，耳朵红着，笔尖却稳，半晌落下一句：「这一条，入册了。『胆』字栏的格式，昨夜新设。」再论交几回，或可结金兰。'; },
        intimate: function(r){ return '聂明泽取出一页空白档纸——边角焦黑，是从鬼市旧纸摊里赎回来的那种——横在两人之间，让'+r+'在页首也落了名，他自己在旁边落一个。两个名字并排。「一页，两名。」他说得极慢，「我写过一回。那回，朱笔悬着落不下去。」他抬眼，耳朵红着，话却平，「这一回落下去了。入册：两个人，一页——不是并案。同案。」'+r+'郑重把自己门中的信物压进那页纸里。两个人在档房灯下结了金兰——'+_mlPlayerTa()+'来时，他俩再不争先后，一个核档，一个烧水。'; }
    },
    'sect_leader_霹雳堂': { // 雷惊蛰：方子/批注/验雷声口，声轻而实（v20.78 入册）
        enemy_ease: function(r){ return '雷惊蛰收了验雷时那点戒备，给'+r+'倒了盏粗茶——头一回，他把情敌当配药的伴不当敌。再论交几回，或可放下。'; },
        neutral_warm: function(r){ return '雷惊蛰送'+r+'出药坊，破天荒送到了山门口，还极轻地嘱了句「路上有硝坑，走里侧」。他回身把案上那两只粗茶盏一只一只收进坊里。再撮合几回，或可成友。'; },
        friend_form: function(r){ return '雷惊蛰把方子册摊开一页给'+r+'看：「硝六硫四，炭取陈柳。方子不瞒会看的人。」'+r+'看了半晌，把自己门里的手艺规程也摆上案来——两个动手的人，在一页方子上停了战。你这一局，撮合成了。'; },
        friend_deepen: function(r){ return '他俩交换关于'+_mlPlayerTa()+'的糗事，雷惊蛰笑得极轻，耳朵红着：「'+_mlPlayerTa()+'怕雷？」'+r+'答：「'+_mlPlayerTa()+'敢站在样尺边上，看人验雷看到三更。」两人在药坊里笑，笑完各自呷了口茶。再论交几回，或可结金兰。'; },
        intimate: function(r){ return '雷惊蛰从防火布囊里取出那页无声花的方子，横在两人之间，让'+r+'也按了一角——两双手压在同一页纸上。「这一页，我配了十六年。」他说得很轻，「今夜，给第二个人看了。」'+r+'郑重把自己门中的手艺底单也压进页角。两个人在药坊灯下结了金兰——'+_mlPlayerTa()+'来时，他俩再不争先后，一个量雷，一个扎捻。'; }
    },
    'sect_leader_天书阁': { // 宓书言：校讎/签/校记声口，较真而锋利（v20.78 入册）
        enemy_ease: function(r){ return '宓书言收了校笔上那点锋，给'+r+'续了盏温茶——头一回，他把情敌不当讹字，当对校的客。再论交几回，或可放下。'; },
        neutral_warm: function(r){ return '宓书言送'+r+'下云台山，破天荒没在路上背阁规，临别还嘱了句「山道石阶，走内侧」。他回身把案上那两只茶盏一只一只收进楼里。再撮合几回，或可成友。'; },
        friend_form: function(r){ return '宓书言把自己那册校了三年的校记摊开给'+r+'看：「存疑不圈这一条，请指教。」'+r+'看了半晌，指出一处装裱的破绽，两人就着灯对校到灯花结了两次——两个较真的人，在一册校记上停了战。你这一局，撮合成了。'; },
        friend_deepen: function(r){ return '他俩交换关于'+_mlPlayerTa()+'的糗事，宓书言答得像出校记：「'+_mlPlayerTa()+'怕写错字？」'+r+'答：「'+_mlPlayerTa()+'敢当面改总校勘的校记——改得还对了。」宓书言唇角极轻微地动了一下——你如今看得懂，这是他的大笑，「那一条，我入了签。」再论交几回，或可结金兰。'; },
        intimate: function(r){ return '宓书言取出一页空白的校记纸，横在两人之间，让'+r+'先押了名——两双手叠在同一页上。「校讎者，两人相对，一字不欺。」他一字一顿，「今日这页入卷：两名，一页——不是异文。同押。」'+r+'郑重把自己门中的信物也压进那页纸里。两个人在万卷楼结了金兰——'+_mlPlayerTa()+'来时，他俩再不争先后，一个校卷，一个研墨。'; }
    },
    'sect_leader_大隐阁': { // 隗九爻：起卦/糖葫芦/半句声口，市井里的仙气（v20.78 入册）
        enemy_ease: function(r){ return '隗九爻收了起卦时那点卦师的锋，给'+r+'叫了碗热豆花——头一回，他把情敌不当敌，当街口的客。再论交几回，或可放下。'; },
        neutral_warm: function(r){ return '隗九爻送'+r+'出食摊街，破天荒说了句全乎的送客话：「慢走，糖别忘。」他回身把案上那两只碗一只一只记上欠账。再撮合几回，或可成友。'; },
        friend_form: function(r){ return '隗九爻抽出一根新糖葫芦递给'+r+'：「起一卦。随便起——起错了我给你圆。」'+r+'数了半晌，两人为双数为吉还是单数为吉就着签子争了半日，争完各自咬了颗山楂——两个吃江湖饭的，在一根签子上停了战。你这一局，撮合成了。'; },
        friend_deepen: function(r){ return '他俩交换关于'+_mlPlayerTa()+'的糗事，隗九爻笑得像叫卖：「'+_mlPlayerTa()+'怕大凶？」'+r+'答：「'+_mlPlayerTa()+'敢抢他签头那颗山楂吃。」满街哄笑，糖葫芦婶子笑扶着糖锅。再论交几回，或可结金兰。'; },
        intimate: function(r){ return '隗九爻从袖子里摸出那根磨得发亮的老竹签，横在两人之间，让'+r+'也握住签尾——两双手叠在一根签上。「这根签，我留了二十年。」他慢悠悠说，破天荒全乎，「今日，给第二个人看。」'+r+'郑重把自己门中的信物挂上签头。两个人在街口灯下结了金兰——'+_mlPlayerTa()+'来时，他俩再不争先后，一个起卦，一个付账。'; }
    },
    'sect_leader_侠隐阁': { // 简知忆：建档/批注/附页声口，纸笔栏卷一套（v20.78 入册）
        enemy_ease: function(r){ return '简知忆收了核档时那把量人的尺，给'+r+'续了盏温茶——头一回，他把情敌不当高危条目，当来核档的客。再论交几回，或可放下。'; },
        neutral_warm: function(r){ return '简知忆送'+r+'出东院，破天荒多说了一句格式外的话：「路上慢走。」他回身把案上那两只茶盏一只一只收了，把那页档归回架里。再撮合几回，或可成友。'; },
        friend_form: function(r){ return '简知忆抽出一册侠名录旧卷给'+r+'看：「这一册，替我核一遍——两支笔，比一支稳。」'+r+'核了半卷，挑出三处存疑，他一条一条批注「注：对」——两个较真的人，在一册档上停了战。你这一局，撮合成了。'; },
        friend_deepen: function(r){ return '他俩交换关于'+_mlPlayerTa()+'的糗事，简知忆答得像落批注：「'+_mlPlayerTa()+'怕建档？」'+r+'答：「'+_mlPlayerTa()+'敢翻他那页空白。」简知忆的笔尖顿了半息，半晌落下一条：「注：此条存疑，不究——但入档。」再论交几回，或可结金兰。'; },
        intimate: function(r){ return '简知忆取出一页新档纸，横在两人之间，让'+r+'也在页尾落了名——两双手压在同一页上。「两名，一档。」他说得极平，「格式里原先没有这一条。今日起有了。入档：不是两册。是一册，两个人。」'+r+'郑重把自己门中的信物压进档页之间。两个人在档房灯下结了金兰——'+_mlPlayerTa()+'来时，他俩再不争先后，一个核档，一个研墨。'; }
    },
    'sect_leader_天涯海阁': { // 狄长亭：路引/驿制/公文腔声口，娇柔而能干（v20.78 入册）
        enemy_ease: function(r){ return '狄长亭收了公文腔里那点生分，给'+r+'的盏里续满了热水——头一回，他把情敌不当过路的行人，当滞留的客。再论交几回，或可放下。'; },
        neutral_warm: function(r){ return '狄长亭送'+r+'出碑界，破天荒多送了一步出界，还轻声嘱了句「前路有利——有利，也慢行」。他回身把案上那两只盏一只一只收进站里。再撮合几回，或可成友。'; },
        friend_form: function(r){ return '狄长亭把十年的存根册摊开给'+r+'看：「这一部驿路，替我核核里程——两个人的眼，比一个人的稳。」'+r+'核了一段，指出灯线记差了一处，他当场颤笔批注「属实，改」——两个认路的人，在一册存根上停了战。你这一局，撮合成了。'; },
        friend_deepen: function(r){ return '他俩交换关于'+_mlPlayerTa()+'的糗事，狄长亭掩口轻笑：「'+_mlPlayerTa()+'怕离别？」'+r+'答：「'+_mlPlayerTa()+'敢在他碑界外头折回来——折过三回。」狄长亭耳根红了，转身给'+r+'把水续上，话软却一字认真：「这一条，入存根。头等。」再论交几回，或可结金兰。'; },
        intimate: function(r){ return '狄长亭取出一纸新路引，横在两人之间，让'+r+'先填去向栏，自己在旁边也填了一个——一纸路引，两个去向，并排。「驿制卷一：一引一去向。」他公文腔一字一字念完，耳根红着，话却稳，「今夜新设驿制：这一纸，两个去向——哪一处不利，同走。」'+r+'郑重把自己门中的信物压进引纸折页。两个人在总驿灯下结了金兰——'+_mlPlayerTa()+'来时，他俩再不争先后，一个写引，一个挑灯。'; }
    },
    'sect_leader_大旗门': { // 樊惊筹：针脚/旗/军中短句声口，猛将针线活（v20.78 入册）
        enemy_ease: function(r){ return '樊惊筹收了阵前那点锋，给'+r+'的海碗里续满了酽茶——头一回，他把情敌不当敌，当灯下的客。再论交几回，或可放下。'; },
        neutral_warm: function(r){ return '樊惊筹送'+r+'出大旗门大门，破天荒送过了门槛，还多嘱了两个字「慢走」。他回身把案上那两只茶碗一只一只收进房里。再撮合几回，或可成友。'; },
        friend_form: function(r){ return '樊惊筹把自己缝的一副护腕递给'+r+'看：「内衬，七式针脚。看。」'+r+'翻来覆去摸了半晌，报出三种针式，他点头，耳朵微红：「眼力，够用。」——两个动手的人，在一副护腕上停了战。你这一局，撮合成了。'; },
        friend_deepen: function(r){ return '他俩交换关于'+_mlPlayerTa()+'的糗事，樊惊筹答得短如军令：「'+_mlPlayerTa()+'怕针？」'+r+'答：「'+_mlPlayerTa()+'敢拿他的铁皮盒，数着针码问字。」樊惊筹愣了半晌，把碗里的茶一口喝干，憋出三个字：「记下了。」再论交几回，或可结金兰。'; },
        intimate: function(r){ return '樊惊筹把铁皮针线盒打开，摆在两人之间，让'+r+'先挑了一轴线——两双手在一盒线上方碰了碰。「旗是护人的。」他一字一顿，「我娘的话。我守了二十六年。」他把一根针穿好线，针柄递到'+r+'手里，「今日守到头了——针，递给第二个人。」'+r+'郑重把自己门中的丝绦也缠上线轴。两个人在旗房灯下结了金兰——'+_mlPlayerTa()+'来时，他俩再不争先后，一个扛旗，一个递线。'; }
    }
};

function _mlApplyBridgeEffects(npc, choice) {
    var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
    if (!rival) return { affection: 0, msg: '（无人可论交——你已无他情。）' };
    var rivalNpc = window.npcManager && window.npcManager.getNPC ? window.npcManager.getNPC(rival.id) : null;
    if (!rivalNpc) return { affection: 0, msg: '（情敌不在。）' };

    // 确保配对初始化（复用既有 setNPCRelationshipPair）
    var before = (window.getNPCRelationship && window.getNPCRelationship(npc.id, rival.id))
        ? { relation: window.getNPCRelationship(npc.id, rival.id), strength: (npc.npcRelationships && npc.npcRelationships[rival.id] && npc.npcRelationships[rival.id].strength) || 0 }
        : { relation: 'neutral', strength: 0 };
    // 若无配对，初始化为 enemy/60
    if (!npc.npcRelationships || !npc.npcRelationships[rival.id]) {
        if (typeof window.setNPCRelationshipPair === 'function') window.setNPCRelationshipPair(npc, rivalNpc, 'enemy', 60);
    }
    var bRel = (npc.npcRelationships && npc.npcRelationships[rival.id] && npc.npcRelationships[rival.id].relation) || 'neutral';
    var bStr = (npc.npcRelationships && npc.npcRelationships[rival.id] && npc.npcRelationships[rival.id].strength) || 0;

    var delta = (choice === 'mediate') ? 26 : (choice === 'convey') ? 18 : 10;
    var result = null;
    if (typeof window.adjustNPCRelationshipPair === 'function') {
        result = window.adjustNPCRelationshipPair(npc, rivalNpc, delta, { defaultRelation: 'enemy' });
    }
    var after = result || { relation: bRel, strength: bStr };
    var aRel = after.relation || 'neutral';
    var aStr = Number(after.strength) || 0;

    var aff = (choice === 'mediate') ? 3 : (choice === 'convey' ? 2 : 1);
    var tier = _mlResolveBridgeTier(bRel, bStr, aRel, aStr, choice);
    var table = ML_BRIDGE_TIER_MSGS[npc.id] || ML_BRIDGE_TIER_MSGS['sect_leader_铸剑山庄'];
    var fn = table[tier] || table.neutral_warm;
    return { affection: aff, msg: fn(rival.name) };
}

var MALE_BRIDGE_EVENTS = {
    'lu_event_bridge': {
        id: 'lu_event_bridge', npcId: 'sect_leader_铸剑山庄', title: '炉房论交', icon: '🤝',
        desc: '你邀的那位，到了铸剑山庄。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: ML_BRIDGE_CD, flag: 'lu_e_bridge_cd',
        requireEventDone: 'lu_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你递了信。三日后，那位情敌到了铸剑山庄炉房。', type: 'description' },
            { speaker: 'npc', text: '冶砚把锤一搁，琥珀眼底看着你，又看那人。「……你让我跟他论交？」他虎牙没露，「行。炉前的位，给他一个。」' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「你们都为我好。各说一句真话。」', effect: 'mediate', affection: 3 },
                { text: '替他们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _mlApplyBridgeEffects(npc, choice); }
    },
    'su_event_bridge': {
        id: 'su_event_bridge', npcId: 'sect_leader_药王谷', title: '药庐论交', icon: '🤝',
        desc: '你邀的那位，到了药王谷。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: ML_BRIDGE_CD, flag: 'su_e_bridge_cd',
        requireEventDone: 'su_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你递了信。三日后，那位情敌到了药王谷药庐。', type: 'description' },
            { speaker: 'npc', text: '芩木推过两只热茶，温润地笑：「……你让我跟他论交？」他看你，「行。药庐的门，给他开一扇。」' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「你们都为我好。各说一句真话。」', effect: 'mediate', affection: 3 },
                { text: '替他们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _mlApplyBridgeEffects(npc, choice); }
    },
    'ms_event_bridge': {
        id: 'ms_event_bridge', npcId: 'sect_leader_茅山派', title: '符阁论交', icon: '🤝',
        desc: '你邀的那位，到了茅山派。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: ML_BRIDGE_CD, flag: 'ms_e_bridge_cd',
        requireEventDone: 'ms_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你递了信。三日后，那位情敌到了茅山派符阁。', type: 'description' },
            { speaker: 'npc', text: '昴既明执笔不动，银光看那人一眼：「……你让我跟他论交？」他收笔，「行。符阁的位，给他留一个。」' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「你们都为我好。各说一句真话。」', effect: 'mediate', affection: 3 },
                { text: '替他们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _mlApplyBridgeEffects(npc, choice); }
    },
    'jg_event_bridge': {
        id: 'jg_event_bridge', npcId: 'sect_leader_金刚宗', title: '塔内论交', icon: '🤝',
        desc: '你邀的那位，到了金刚宗。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: ML_BRIDGE_CD, flag: 'jg_e_bridge_cd',
        requireEventDone: 'jg_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你递了信。三日后，那位情敌到了金刚宗塔内。', type: 'description' },
            { speaker: 'npc', text: '赫渊盘坐塔内，金刚线松了一线。他看那人一眼，没开口——为你破了闭口禅：「……行。塔门，给他开一扇。」' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「你们都为我好。各说一句真话。」', effect: 'mediate', affection: 3 },
                { text: '替他们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _mlApplyBridgeEffects(npc, choice); }
    },
    'hs_event_bridge': {
        id: 'hs_event_bridge', npcId: 'sect_leader_华山派', title: '剑堂论交', icon: '🤝',
        desc: '你邀的那位，到了华山派。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: ML_BRIDGE_CD, flag: 'hs_e_bridge_cd',
        requireEventDone: 'hs_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你递了信。三日后，那位情敌到了华山派剑堂。檐外落着细雨，堂内两盏茶，是他一早备下的。', type: 'description' },
            { speaker: 'npc', text: '竺听雨给那人斟了茶，笑着抬头看你：「……你让我跟他论交？」他把茶壶搁下，「行。华山的雨，淋过的人都是一样狼狈——剑堂的门，给他开一扇。」' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「你们都为我好。各说一句真话。」', effect: 'mediate', affection: 3 },
                { text: '替他们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _mlApplyBridgeEffects(npc, choice); }
    },
    'wd_event_bridge': {
        id: 'wd_event_bridge', npcId: 'sect_leader_武当派', title: '真武殿论交', icon: '🤝',
        desc: '你邀的那位，到了武当派。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: ML_BRIDGE_CD, flag: 'wd_e_bridge_cd',
        requireEventDone: 'wd_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你递了信。三日后，那位情敌到了武当真武殿。案上两盏茶，是他一早备下的；祖师像侧供着「问道」。那人进门那刻——剑没鸣。', type: 'description' },
            { speaker: 'npc', text: '阙守拙给那人斟了茶，才抬头看你：「……你让我跟他论交？」他把茶壶搁下，话说得慢，一字是一字，「它不鸣，是不把你当外人。真武殿的位，给他一个。」' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「你们都为我好。各说一句真话。」', effect: 'mediate', affection: 3 },
                { text: '替他们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _mlApplyBridgeEffects(npc, choice); }
    },
    'xy_event_bridge': {
        id: 'xy_event_bridge', npcId: 'sect_leader_逍遥派', title: '酒仙池论交', icon: '🤝',
        desc: '你邀的那位，到了逍遥派。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: ML_BRIDGE_CD, flag: 'xy_e_bridge_cd',
        requireEventDone: 'xy_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你递了信。三日后，那位情敌到了逍遥派酒仙池。石桌上摆着三只盏，是他一早备下的；琴横在案尾，没盖脸。那人进门那刻，他提起壶，把第三只盏斟上了。', type: 'description' },
            { speaker: 'npc', text: '闻人酌把斟满的盏推到那人面前，才转头看你，笑得慵懒：「……你让我跟他论交？」他把酒壶搁下，「肯同你共一盏的，都不是外人。坐。」' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「你们都为我好。各说一句真话。」', effect: 'mediate', affection: 3 },
                { text: '替他们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _mlApplyBridgeEffects(npc, choice); }
    },
    'song_event_bridge': {
        id: 'song_event_bridge', npcId: 'sect_leader_嵩山派', title: '执法堂论交', icon: '🤝',
        desc: '你邀的那位，到了嵩山派。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: ML_BRIDGE_CD, flag: 'song_e_bridge_cd',
        requireEventDone: 'song_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你递了信。三日后，那位情敌到了嵩山执法堂。案上两盏酽茶，滤过两遍，是他一早备下的；案侧卷袋码得方方正正。那人进门那刻，他起身，玄衣一振，拱手——礼数一分不缺。', type: 'description' },
            { speaker: 'npc', text: '逵佩南把一盏茶推到那人面前，才抬眼看你：「……你让我跟他论交？」他把茶壶搁下，话说得一字是一字，「条令不禁论交。执法堂里有档的，都是客。执法堂的座——给他一个。」' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「你们都为我好。各说一句真话。」', effect: 'mediate', affection: 3 },
                { text: '替他们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _mlApplyBridgeEffects(npc, choice); }
    },
    'gai_event_bridge': {
        id: 'gai_event_bridge', npcId: 'sect_leader_丐帮', title: '讯房论交', icon: '🤝',
        desc: '你邀的那位，到了丐帮。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: ML_BRIDGE_CD, flag: 'gai_e_bridge_cd',
        requireEventDone: 'gai_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你递了信。三日后，那位情敌到了丐帮讯房。案边条凳上两只粗碗，粥还冒着热气，是他一早备下的；满墙竹签后头，水也烧开了。那人进门那刻，他把一碗粥推了过去——碗口的豁，冲着他自己。', type: 'description' },
            { speaker: 'npc', text: '桑拾玖给那人把粥续满，才转头看你，眉飞色舞地笑：「……你让我跟他论交？」他把粥勺搁下，「讯房里来的，都是有故事的人。先喝粥，后说话——粥棚的规矩，一个锅里盛出来的，不兴动气。」' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「你们都为我好。各说一句真话。」', effect: 'mediate', affection: 3 },
                { text: '替他们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _mlApplyBridgeEffects(npc, choice); }
    },
    'yan_event_bridge': {
        id: 'yan_event_bridge', npcId: 'sect_leader_阎罗殿', title: '档房论交', icon: '🤝',
        desc: '你邀的那位，到了阎罗殿。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: ML_BRIDGE_CD, flag: 'yan_e_bridge_cd',
        requireEventDone: 'yan_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你递了信。三日后，那位情敌到了阎罗殿档房。案上两只盏，热水是他刚烧的；千架旧册之间，灯芯剪得干干净净。那人进门那刻，他取出一页新档纸摊平，摆在案心——页首空着，没写名，也没立栏。', type: 'description' },
            { speaker: 'npc', text: '聂明泽把那盏热水推到那人面前，才抬眼看你：「……你让我跟他论交？」他把盏搁下，话说得一字是一字，「档房的规矩：进门核档的，都是客。来路有档可查的——给座。」他顿了顿，指指案心那页空白，「这一页，新立。栏名：论交。」' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「你们都为我好。各说一句真话。」', effect: 'mediate', affection: 3 },
                { text: '替他们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _mlApplyBridgeEffects(npc, choice); }
    },
    'pi_event_bridge': {
        id: 'pi_event_bridge', npcId: 'sect_leader_霹雳堂', title: '药坊论交', icon: '🤝',
        desc: '你邀的那位，到了霹雳堂。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: ML_BRIDGE_CD, flag: 'pi_e_bridge_cd',
        requireEventDone: 'pi_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你递了信。三日后，那位情敌到了霹雳堂药坊。案上两只粗茶盏，是他一早斟好的；样尺和炭笔码得整整齐齐，方子册却收在怀里，没搁在案上。那人进门那刻，他从防火布囊里取出一枚新扎的捻口，摆在两人中间的案心。', type: 'description' },
            { speaker: 'npc', text: '雷惊蛰把那盏粗茶往那人面前推了推，声音很轻，字却一个一个送到了：「……你让我跟他论交？」他把茶盏搁下，「药坊的规矩：进门的，先学一件事——别捂耳朵。不捂耳朵，才听得见话。」他指了指案心那枚捻口，「验雷的位子，给他一个。」' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「你们都为我好。各说一句真话。」', effect: 'mediate', affection: 3 },
                { text: '替他们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _mlApplyBridgeEffects(npc, choice); }
    },
    'shu_event_bridge': {
        id: 'shu_event_bridge', npcId: 'sect_leader_天书阁', title: '万卷楼论交', icon: '🤝',
        desc: '你邀的那位，到了天书阁。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: ML_BRIDGE_CD, flag: 'shu_e_bridge_cd',
        requireEventDone: 'shu_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你递了信。三日后，那位情敌到了天书阁万卷楼。案上两盏温茶，是他一早备下的；签筒立在砚边，「校讎」剑靠在扶手，剑柄摆得端端正正。那人进门那刻，他抽出一张空白的竹纸签摆在案心——签面朝上，一个字没写。', type: 'description' },
            { speaker: 'npc', text: '宓书言把那盏温茶推到那人面前，才抬眼看你：「……你让我跟他论交？」他把茶盏搁下，语速又快又平，「校讎者，两人相对，各执一书，一字不欺——这个词里，从来就有两个人。万卷楼的校位，给他一个。」' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「你们都为我好。各说一句真话。」', effect: 'mediate', affection: 3 },
                { text: '替他们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _mlApplyBridgeEffects(npc, choice); }
    },
    'dy_event_bridge': {
        id: 'dy_event_bridge', npcId: 'sect_leader_大隐阁', title: '街口论交', icon: '🤝',
        desc: '你邀的那位，到了大隐阁山下的食摊街口。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: ML_BRIDGE_CD, flag: 'dy_e_bridge_cd',
        requireEventDone: 'dy_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你递了信。三日后，那位情敌到了大隐阁山下的食摊街口。红布幌子底下两只小凳，两碗热豆花，是隗九爻一早叫好的；糖葫芦婶子的新签插在糖锅边上，糖还温着。那人进门那刻，他把签子抽出来，举平，一颗一颗数——数完，搁在两只凳子中间。', type: 'description' },
            { speaker: 'npc', text: '「剩四颗。」他慢悠悠报了卦，才抬眼看你：「……你让我跟他论交？」他啧了一声，用签子指了指身边的空凳，「四颗，宜静。静者——宜坐。街口的凳，给他一个。」' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「你们都为我好。各说一句真话。」', effect: 'mediate', affection: 3 },
                { text: '替他们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _mlApplyBridgeEffects(npc, choice); }
    },
    'yin_event_bridge': {
        id: 'yin_event_bridge', npcId: 'sect_leader_侠隐阁', title: '东院论交', icon: '🤝',
        desc: '你邀的那位，到了侠隐阁。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: ML_BRIDGE_CD, flag: 'yin_e_bridge_cd',
        requireEventDone: 'yin_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你递了信。三日后，那位情敌到了侠隐阁东院档房。案上两盏温茶，是他一早斟好的；档笔立在笔架上，案心摊平一页新档纸——名字栏空着，批注栏也空着，像等人来核。那人进门那刻，他把那页档纸往前推了半寸。', type: 'description' },
            { speaker: 'npc', text: '简知忆把那盏温茶推到那人面前，才抬眼看你：「……你让我跟他论交？」他把茶盏搁下，批注腔一字一字：「注：进门核档的，都是客。客有客档，危险程度——」他顿了顿，提起档笔，在名字栏落了两个字，落得极平：「低。」' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「你们都为我好。各说一句真话。」', effect: 'mediate', affection: 3 },
                { text: '替他们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _mlApplyBridgeEffects(npc, choice); }
    },
    'ty_event_bridge': {
        id: 'ty_event_bridge', npcId: 'sect_leader_天涯海阁', title: '总驿论交', icon: '🤝',
        desc: '你邀的那位，到了天涯海阁。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: ML_BRIDGE_CD, flag: 'ty_e_bridge_cd',
        requireEventDone: 'ty_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你递了信。三日后，那位情敌到了江陵总驿。文书案上两盏热水，是他一早斟好的；存根册摊开着，裁好的引纸码得整整齐齐，案角那半枚铜符擦得发亮。那人进门那刻，他起身，整了整衣襟，拱手——礼数一分不缺，又把一纸早写好的路引推过去：去向栏空着。', type: 'description' },
            { speaker: 'npc', text: '狄长亭把那盏热水推到那人面前，才抬眼看你：「……你让我跟他论交？」他把盏搁下，公文腔又轻又软，一字却是一字，「驿制：进站的，都是客。客——站站有灯。」他指了指那纸空白路引，「这一纸新发。去向栏，请他自己填。他要去哪，驿路送到哪。」' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「你们都为我好。各说一句真话。」', effect: 'mediate', affection: 3 },
                { text: '替他们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _mlApplyBridgeEffects(npc, choice); }
    },
    'dq_event_bridge': {
        id: 'dq_event_bridge', npcId: 'sect_leader_大旗门', title: '旗房论交', icon: '🤝',
        desc: '你邀的那位，到了大旗门。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: ML_BRIDGE_CD, flag: 'dq_e_bridge_cd',
        requireEventDone: 'dq_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你递了信。三日后，那位情敌到了大旗门旗房。案上两只粗碗，茶酽，是他一早备下的；纛旗叠到一半搁在长案上，铁皮针线盒开着，线轴按粗细排成一排。那人进门那刻，他站起来，没拱手，只把一只小马扎用脚往那人那边推了推——马扎放得很实，正对着背风的位置。', type: 'description' },
            { speaker: 'npc', text: '樊惊筹把那碗酽茶推到那人面前，才抬眼看你：「……你让我跟他论交？」他把茶碗搁下，两个字两个字地说：「坐。茶热。」顿了顿，破天荒多补了一句整话：「旗房不论先后，只论针脚——针脚实的，人实。」' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「你们都为我好。各说一句真话。」', effect: 'mediate', affection: 3 },
                { text: '替他们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _mlApplyBridgeEffects(npc, choice); }
    }
};

if (typeof NPC_PERSONAL_EVENTS !== 'undefined') {
    Object.assign(NPC_PERSONAL_EVENTS, MALE_BRIDGE_EVENTS);
}

// 每日钩子：玩家在某男主门派 + 吃醋已发生 + 有情敌 + 配对未至至交 + cd → 触发论交
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
                var rivalEvId = h.id === 'sect_leader_铸剑山庄' ? 'lu_event_rival'
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
                var bridgeId = h.id === 'sect_leader_铸剑山庄' ? 'lu_event_bridge'
                    : h.id === 'sect_leader_药王谷' ? 'su_event_bridge'
                    : h.id === 'sect_leader_茅山派' ? 'ms_event_bridge'
                    : h.id === 'sect_leader_金刚宗' ? 'jg_event_bridge'
                    : h.id === 'sect_leader_华山派' ? 'hs_event_bridge'
                    : h.id === 'sect_leader_武当派' ? 'wd_event_bridge'
                    : h.id === 'sect_leader_逍遥派' ? 'xy_event_bridge'
                    : h.id === 'sect_leader_嵩山派' ? 'song_event_bridge'
                    : h.id === 'sect_leader_丐帮' ? 'gai_event_bridge'
                    : h.id === 'sect_leader_阎罗殿' ? 'yan_event_bridge'
                    : h.id === 'sect_leader_霹雳堂' ? 'pi_event_bridge'
                    : h.id === 'sect_leader_天书阁' ? 'shu_event_bridge'
                    : h.id === 'sect_leader_大隐阁' ? 'dy_event_bridge'
                    : h.id === 'sect_leader_侠隐阁' ? 'yin_event_bridge'
                    : h.id === 'sect_leader_天涯海阁' ? 'ty_event_bridge'
                    : h.id === 'sect_leader_大旗门' ? 'dq_event_bridge' : null;
                if (!rivalEvId || !bridgeId) continue;
                if (typeof hasEventTriggered === 'function' && !hasEventTriggered(rivalEvId)) continue; // 吃醋须已发生
                var npc = window.npcManager.getNPC ? window.npcManager.getNPC(h.id) : null;
                if (!npc) continue;
                var aff = (npc.relationship && npc.relationship.affection) || 0;
                if (aff < 50) continue;
                if (typeof window.detectRivalRomance !== 'function' || !window.detectRivalRomance(h.id)) continue;
                // 配对未至至交
                var pair = (npc.npcRelationships) ? npc.npcRelationships : null;
                if (pair) {
                    var rivalObj = null;
                    var det = window.detectRivalRomance(h.id);
                    if (det) rivalObj = pair[det.id];
                    if (rivalObj && rivalObj.relation === 'friend' && (Number(rivalObj.strength) || 0) >= ML_BRIDGE_INTIMATE) continue;
                }
                var ev = NPC_PERSONAL_EVENTS[bridgeId];
                if (!ev) continue;
                if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) continue;
                if (typeof checkEventTrigger === 'function' && !checkEventTrigger(ev, window.currentCharData)) continue;
                setTimeout(function(evId, npcInst) {
                    if (document.querySelector && document.querySelector('.personal-event-modal')) return;
                    var ev2 = NPC_PERSONAL_EVENTS[evId];
                    if (!ev2) return;
                    if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev2, npcInst)) return;
                    if (typeof triggerPersonalEvent === 'function') triggerPersonalEvent(evId);
                }.bind(null, bridgeId, npc), 1200);
            }
        } catch (e) { console.warn('[男主论交] 每日触发失败:', e); }
    });
}

if (typeof window !== 'undefined') {
    window.MALE_BRIDGE_EVENTS = MALE_BRIDGE_EVENTS;
    window.ML_BRIDGE_TIER_MSGS = ML_BRIDGE_TIER_MSGS;
}
console.log('[男主论交] 男主情敌论交事件加载完成：' + Object.keys(MALE_BRIDGE_EVENTS).length + ' 个');
