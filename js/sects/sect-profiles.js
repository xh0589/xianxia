// ==================== sect-profiles.js - v20.49 门派命门档案 ====================
// 大事件重置的地基：36 门各立一张「命门表」——靠什么吃饭、怕什么、在什么地界。
// 事件不再抽签，从命门里长：药王谷怕疫病歉收、修罗宫怕盐卡官非、铸剑山庄怕矿脉断供。
// 一表三用：大事件因果门禁、既有门派专属事件的权重、故事弧取材。
//
// 字段口径：
//   livelihood  靠什么吃饭（影响钱粮族/官府族/机缘族权重）
//   fears       怕什么（天时族/外敌族权重与文案取材）
//   terrain     地形（山/水/城/漠/岛——山洪/盗匪/海患的地理门禁）
//   weightMods  各事件族权重修正（缺省 1.0；0 表示该门极难出此类事）
(function () {
    'use strict';

    var SECT_PROFILES = {
        '少林寺': { livelihood: ['香火', '武名'], fears: ['香火受损', '弟子破戒'], terrain: '山',
            weightMods: { bandit: 0.2, rite: 1.4, exam: 1.3, ally: 1.2 } },
        '嵩山派': { livelihood: ['武名', '盟会'], fears: ['盟位旁落', '仇家'], terrain: '山',
            weightMods: { elder: 1.4, ally: 1.3, bandit: 0.5 } },
        '大旗门': { livelihood: ['军械', '护商'], fears: ['军械失窃', '战事'], terrain: '城',
            weightMods: { bandit: 0.3, ally: 1.4, office: 1.2 } },
        '恒山派': { livelihood: ['香火'], fears: ['香客稀少', '山寇'], terrain: '山',
            weightMods: { rite: 1.3, bandit: 0.8 } },
        '全真教': { livelihood: ['道场', '香火'], fears: ['道统之争'], terrain: '山',
            weightMods: { rite: 1.3, elder: 1.2, exam: 1.2 } },
        '华山派': { livelihood: ['武名', '游客'], fears: ['剑箓失传'], terrain: '山',
            weightMods: { exam: 1.4, bandit: 0.5, ancient: 1.3 } },
        '武当派': { livelihood: ['道场', '香火'], fears: ['道音断绝', '山道毁'], terrain: '山',
            weightMods: { flood: 1.2, rite: 1.3, ally: 1.2 } },
        '侠隐阁': { livelihood: ['授业'], fears: ['生源断绝'], terrain: '城',
            weightMods: { influx: 1.3, exam: 1.3, bandit: 0.4 } },
        '天涯海阁': { livelihood: ['海贸', '护航'], fears: ['海患', '海盗'], terrain: '岛',
            weightMods: { flood: 1.3, bandit: 0.9, ally: 1.2 } },
        '泰山派': { livelihood: ['武名', '封禅'], fears: ['大雪封山'], terrain: '山',
            weightMods: { rite: 1.3, flood: 0.8, bandit: 0.5 } },
        '药王谷': { livelihood: ['丹药', '医名'], fears: ['疫病', '药田歉收'], terrain: '山',
            weightMods: { plague: 1.6, flood: 1.3, buyout: 0.9, influx: 1.3 } },
        '神机门': { livelihood: ['器械', '机关'], fears: ['图样失窃'], terrain: '城',
            weightMods: { bandit: 0.5, exam: 1.2, ancient: 1.2 } },
        '霹雳堂': { livelihood: ['火器', '矿冶'], fears: ['矿脉断供'], terrain: '山',
            weightMods: { vein: 1.6, bandit: 0.4, office: 1.2 } },
        '茅山派': { livelihood: ['法事', '驱邪'], fears: ['邪祟反噬'], terrain: '山',
            weightMods: { evil: 1.4, rite: 1.4, plague: 1.2 } },
        '大隐阁': { livelihood: ['隐世'], fears: ['行藏败露'], terrain: '山',
            weightMods: { bandit: 0.1, influx: 0.2, office: 0.2, ancient: 1.4 } },
        '天书阁': { livelihood: ['藏书', '典籍'], fears: ['走水', '典籍失窃'], terrain: '山',
            weightMods: { flood: 0.9, bandit: 0.3, ancient: 1.3 } },
        '蓬莱派': { livelihood: ['海产', '灵植'], fears: ['海患', '台风'], terrain: '岛',
            weightMods: { flood: 1.5, bandit: 0.7, ally: 1.2 } },
        '衡山派': { livelihood: ['武名', '香火'], fears: ['香客稀少'], terrain: '山',
            weightMods: { rite: 1.2, bandit: 0.6 } },
        '丐帮': { livelihood: ['耳目', '乞讨'], fears: ['分舵内乱'], terrain: '城',
            weightMods: { bandit: 1.5, elder: 1.3, influx: 1.4, office: 0.8 } },
        '铁掌帮': { livelihood: ['护商', '镖路'], fears: ['镖路断绝'], terrain: '城',
            weightMods: { bandit: 1.3, ally: 1.3, vendetta: 1.3 } },
        '百花谷': { livelihood: ['灵植', '花酿'], fears: ['花疫', '霜冻'], terrain: '谷',
            weightMods: { flood: 1.2, influx: 1.3, bandit: 0.6 } },
        '五仙教': { livelihood: ['蛊毒', '医药'], fears: ['官府剿抚', '疫变'], terrain: '山',
            weightMods: { office: 1.5, plague: 1.4, vendetta: 1.2 } },
        '修罗宫': { livelihood: ['刀兵', '私盐'], fears: ['盐卡官非', '仇家'], terrain: '水',
            weightMods: { vendetta: 1.6, office: 1.4, bandit: 0.6 } },
        '阎罗殿': { livelihood: ['赏格', '杀伐'], fears: ['正道围剿'], terrain: '城',
            weightMods: { vendetta: 1.6, office: 1.3, bandit: 0.5 } },
        '昆仑派': { livelihood: ['玉矿', '道场'], fears: ['雪崩', '矿争'], terrain: '山',
            weightMods: { vein: 1.4, ancient: 1.3, bandit: 0.3 } },
        '金刚宗': { livelihood: ['武名', '护法'], fears: ['戒律崩坏'], terrain: '漠',
            weightMods: { exam: 1.3, rite: 1.2, bandit: 0.4 } },
        '天龙教': { livelihood: ['教众', '香火'], fears: ['教众离心', '官府'], terrain: '漠',
            weightMods: { office: 1.4, elder: 1.3, influx: 1.3 } },
        '烈日教': { livelihood: ['沙商', '驼队'], fears: ['沙暴', '商路断'], terrain: '漠',
            weightMods: { bandit: 1.3, buyout: 1.3, ally: 1.2 } },
        '天山派': { livelihood: ['剑庐', '雪莲'], fears: ['雪崩', '封山'], terrain: '山',
            weightMods: { flood: 1.2, ancient: 1.3, bandit: 0.2 } },
        '逍遥派': { livelihood: ['隐逸'], fears: ['尘缘扰攘'], terrain: '山',
            weightMods: { bandit: 0.1, influx: 0.3, office: 0.2, ancient: 1.5, exam: 0.6 } },
        '血手门': { livelihood: ['暗业'], fears: ['官府缉拿', '仇家'], terrain: '城',
            weightMods: { vendetta: 1.6, office: 1.5, bandit: 0.6 } },
        '青城派': { livelihood: ['武名', '山产'], fears: ['山寇'], terrain: '山',
            weightMods: { rite: 1.2, bandit: 0.8 } },
        '峨眉派': { livelihood: ['香火', '灵茶'], fears: ['山寇', '香火受损'], terrain: '山',
            weightMods: { rite: 1.3, influx: 1.2, bandit: 0.7 } },
        '唐门': { livelihood: ['暗器', '毒物'], fears: ['秘方外泄', '仇家'], terrain: '城',
            weightMods: { vendetta: 1.4, bandit: 0.3, exam: 1.2 } },
        '铸剑山庄': { livelihood: ['铸剑', '矿冶'], fears: ['矿脉断供', '炉毁'], terrain: '岛',
            weightMods: { vein: 1.7, bandit: 0.5, exam: 1.2 } },
        '飞蝎坞': { livelihood: ['蝎毒', '海货'], fears: ['官府缉拿', '海患'], terrain: '岛',
            weightMods: { office: 1.5, flood: 1.3, vendetta: 1.3 } }
    };

    function getProfile(sectName) {
        return SECT_PROFILES[sectName] || { livelihood: [], fears: [], terrain: '山', weightMods: {} };
    }

    // 族权重：命门修正 × 地形门禁（山洪不下漠、海患只扰岛）
    function familyWeight(sectName, family) {
        var p = getProfile(sectName);
        var w = (p.weightMods && p.weightMods[family] != null) ? p.weightMods[family] : 1.0;
        if (family === 'flood') {
            if (p.terrain === '漠') w = 0;            // 沙漠没有山洪
            if (p.terrain === '岛' || p.terrain === '水') w *= 1.3;
        }
        if (family === 'vein' && (p.terrain === '岛' || p.terrain === '水')) w *= 0.6;
        if (family === 'ancient' && p.terrain === '城') w *= 0.7;
        return w;
    }

    window.SECT_PROFILES = SECT_PROFILES;
    window.getSectProfile = getProfile;
    window.getSectFamilyWeight = familyWeight;
    if (window.XianXia) window.XianXia.SectProfiles = { all: SECT_PROFILES, get: getProfile, familyWeight: familyWeight };
})();
