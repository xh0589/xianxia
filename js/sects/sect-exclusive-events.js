// ==================== sect-exclusive-events.js - v20.46 门派专属事件 ====================
// 每门每派自己的戏：通用事件池是"天下门派都有的事"，这里是"只有这一家才有的事"。
// 与通用池同权混抽（sect-events.js generateSectEvent），结算走同一 handleSectEvent。
// 效果纪律：门派侧动士气/资源/弟子/影响力，弟子侧动贡献/积分——数值尺度与通用池一致。
// 加载顺序：在 sect-events.js 之后（只挂数据与纯函数，不抢任何既有名字）。

(function () {

function _internal(sectName) {
    return (window.SECT_INTERNAL && window.SECT_INTERNAL[sectName]) || null;
}

function _inSect(sectName) {
    var ds = window.discipleState || {};
    return ds.isInSect && ds.sectId === sectName;
}

function _morale(sectName, delta) {
    var d = _internal(sectName);
    if (!d) return;
    d.morale = delta >= 0 ? Math.min(100, (d.morale || 50) + delta) : Math.max(0, (d.morale || 50) + delta);
}

function _resources(sectName, delta) {
    var d = _internal(sectName);
    if (!d) return;
    d.resources = delta >= 0 ? (d.resources || 100) + delta : Math.max(0, (d.resources || 100) + delta);
}

function _influence(sectName, delta) {
    var d = _internal(sectName);
    if (!d) return;
    d.influence = (d.influence || 50) + delta;
}

function _contrib(sectName, n) {
    var ds = window.discipleState || {};
    if (_inSect(sectName)) ds.contribution = (ds.contribution || 0) + n;
}

function _points(sectName, n) {
    var ds = window.discipleState || {};
    if (_inSect(sectName)) ds.points = (ds.points || 0) + n;
}

var SECT_EXCLUSIVE_EVENTS = {
    '少林寺': {
        'shaolin_muxiang': {
            type: 'internal', icon: '🪵', name: '木巷禅机',
            desc: function () { return '木巷中一位面壁三年的老僧忽然开口，只说了一句「吃茶去」，满巷弟子若有所悟。'; },
            effect: function (s) { _morale(s, 10); _points(s, 20); return '全派士气 +10，你参禅有得，积分 +20'; },
            minMorale: 0, maxMorale: 100
        },
        'shaolin_copysutra': {
            type: 'internal', icon: '📿', name: '藏经缮写',
            desc: function () { return '藏经阁发起缮写藏经之役，抄经一卷，功德一件。'; },
            effect: function (s) { _contrib(s, 20); _morale(s, 5); return '你参与缮写，贡献 +20，士气 +5'; },
            minMorale: 0, maxMorale: 100
        }
    },
    '嵩山派': {
        'songshan_alliance': {
            type: 'external', icon: '🚩', name: '五岳盟会',
            desc: function () { return '五岳剑派盟会在嵩山召开，各派掌门齐聚，论剑三日。'; },
            effect: function (s) { _influence(s, 12); _morale(s, 8); return '嵩山执盟，影响力 +12，士气 +8'; },
            minMorale: 0, maxMorale: 100
        },
        'songshan_summit': {
            type: 'internal', icon: '⛰️', name: '峻极论剑',
            desc: function () { return '嵩山弟子登峻极峰论剑，胜者得「峻极剑士」之名。'; },
            effect: function (s) { _points(s, 25); _morale(s, 5); return '论剑有得，积分 +25，士气 +5'; },
            minMorale: 0, maxMorale: 100
        }
    },
    '大旗门': {
        'daqii_banner': {
            type: 'internal', icon: '🏳️', name: '战旗修缮',
            desc: function () { return '大旗门祖传战旗年久破损，全门斋戒三日，亲手修缮。'; },
            effect: function (s) { _morale(s, 12); return '旗成，军心大振，士气 +12'; },
            minMorale: 0, maxMorale: 100
        },
        'daqii_drill': {
            type: 'internal', icon: '🥁', name: '军阵演武',
            desc: function () { return '大旗门以军法治派，今日演大阵，金鼓齐鸣。'; },
            effect: function (s) { _contrib(s, 20); _morale(s, 5); return '演武出力，贡献 +20，士气 +5'; },
            minMorale: 0, maxMorale: 100
        }
    },
    '恒山派': {
        'hengshan_n_herbs': {
            type: 'internal', icon: '🌿', name: '绝壁采药',
            desc: function () { return '恒山绝壁多灵药，弟子们结伴攀崖采集。'; },
            effect: function (s) { _resources(s, 30); _contrib(s, 15); return '采得灵药，资源 +30，贡献 +15'; },
            minMorale: 0, maxMorale: 100
        },
        'hengshan_n_chant': {
            type: 'internal', icon: '🔔', name: '晨钟清课',
            desc: function () { return '恒山晨钟响起，弟子清课诵经，山色空明。'; },
            effect: function (s) { _morale(s, 8); _points(s, 15); return '清课有得，士气 +8，积分 +15'; },
            minMorale: 0, maxMorale: 100
        }
    },
    '全真教': {
        'quanzhen_dan': {
            type: 'internal', icon: '⚗️', name: '内丹大会',
            desc: function () { return '全真弟子齐聚重阳宫修习内丹，坐忘七日。'; },
            effect: function (s) { _morale(s, 10); _points(s, 20); return '丹道有进，士气 +10，积分 +20'; },
            minMorale: 0, maxMorale: 100
        },
        'quanzhen_lecture': {
            type: 'internal', icon: '📜', name: '七真轮讲',
            desc: function () { return '全真七子轮流开坛讲道，门下弟子争相听讲。'; },
            effect: function (s) { _points(s, 25); _morale(s, 5); return '听讲有得，积分 +25，士气 +5'; },
            minMorale: 0, maxMorale: 100
        }
    },
    '华山派': {
        'huashan_swordtalk': {
            type: 'internal', icon: '🗡️', name: '论剑峰会',
            desc: function () { return '华山论剑之期，弟子各呈剑学，峰顶剑气纵横。'; },
            effect: function (s) { _points(s, 25); _morale(s, 8); return '论剑有得，积分 +25，士气 +8'; },
            minMorale: 0, maxMorale: 100
        },
        'huashan_cliff': {
            type: 'internal', icon: '🧗', name: '悬壁取剑',
            desc: function () { return '先辈遗剑悬于绝壁，今日弟子结伴攀崖取剑，试的是胆，也是剑心。'; },
            effect: function (s) { _contrib(s, 25); _morale(s, 5); return '取得遗剑归藏剑阁，贡献 +25，士气 +5'; },
            minMorale: 0, maxMorale: 100
        }
    },
    '武当派': {
        'wudang_incense': {
            type: 'internal', icon: '🕯️', name: '真武香火',
            desc: function () { return '真武殿香火百年不断，今日殿前香炉忽然爆出灯花，被视为吉兆。'; },
            effect: function (s) { _morale(s, 12); return '吉兆，全派士气 +12'; },
            minMorale: 0, maxMorale: 100
        },
        'wudang_pushhands': {
            type: 'internal', icon: '☯️', name: '太极推手',
            desc: function () { return '紫霄宫前推手交流，以柔克刚，四两拨千斤。'; },
            effect: function (s) { _points(s, 20); _morale(s, 5); return '推手有得，积分 +20，士气 +5'; },
            minMorale: 0, maxMorale: 100
        }
    },
    '侠隐阁': {
        'xiayin_ledger': {
            type: 'internal', icon: '🖋️', name: '侠名录更新',
            desc: function () { return '侠隐阁收录天下侠士事迹，今日开阁修名录，江湖又添新名字。'; },
            effect: function (s) { _influence(s, 10); _points(s, 15); return '名录更新，影响力 +10，积分 +15'; },
            minMorale: 0, maxMorale: 100
        },
        'xiayin_auction': {
            type: 'external', icon: '💎', name: '奇珍暗拍',
            desc: function () { return '侠隐阁暗拍奇珍，各路豪客云集，落槌无声。'; },
            effect: function (s) { _resources(s, 40); _morale(s, 5); return '暗拍得利，资源 +40，士气 +5'; },
            minMorale: 0, maxMorale: 100
        }
    },
    '天涯海阁': {
        'tianya_voyage': {
            type: 'external', icon: '⛵', name: '出海探航',
            desc: function () { return '天涯海阁弟子扬帆出海，探一处前人未至的岛礁。'; },
            effect: function (s) { _contrib(s, 25); _resources(s, 25); return '探航归来，贡献 +25，资源 +25'; },
            minMorale: 0, maxMorale: 100
        },
        'tianya_pearl': {
            type: 'internal', icon: '🦪', name: '采珠潮',
            desc: function () { return '海阁辖下珠池开采，弟子轮番潜采。'; },
            effect: function (s) { _resources(s, 35); return '采得海珠，资源 +35'; },
            minMorale: 0, maxMorale: 100
        }
    },
    '泰山派': {
        'taishan_sunrise': {
            type: 'internal', icon: '🌄', name: '观日课',
            desc: function () { return '泰山弟子寅时登日观峰观日，采朝阳初升之气。'; },
            effect: function (s) { _points(s, 15); _morale(s, 8); return '观日有得，积分 +15，士气 +8'; },
            minMorale: 0, maxMorale: 100
        },
        'taishan_rubbing': {
            type: 'internal', icon: '🪧', name: '碑林拓印',
            desc: function () { return '泰山碑林多前贤墨宝，弟子拓印研习。'; },
            effect: function (s) { _points(s, 20); return '拓印有得，积分 +20'; },
            minMorale: 0, maxMorale: 100
        }
    },
    '药王谷': {
        'yaowang_festival': {
            type: 'bonus', icon: '🌸', name: '药圃祭',
            desc: function () { return '药王谷药圃丰收，全谷祭祀药王，百草生辉。'; },
            effect: function (s) { _resources(s, 35); _morale(s, 10); return '药圃丰收，资源 +35，士气 +10'; },
            minMorale: 0, maxMorale: 100
        },
        'yaowang_charity': {
            type: 'external', icon: '💊', name: '义诊施药',
            desc: function () { return '山下时疫小起，药王谷弟子下山义诊施药。'; },
            effect: function (s) { _influence(s, 12); _contrib(s, 20); return '悬壶济世，影响力 +12，贡献 +20'; },
            minMorale: 0, maxMorale: 100
        }
    },
    '神机门': {
        'shenji_contest': {
            type: 'internal', icon: '⚙️', name: '机关大赛',
            desc: function () { return '神机门弟子各出机关造物比试，木牛走马，巧思百出。'; },
            effect: function (s) { _points(s, 25); _morale(s, 5); return '机关有得，积分 +25，士气 +5'; },
            minMorale: 0, maxMorale: 100
        },
        'shenji_repair': {
            type: 'internal', icon: '🔧', name: '机枢检修',
            desc: function () { return '门中大型机关年久需检修，全门动手。'; },
            effect: function (s) { _contrib(s, 20); _resources(s, 15); return '检修完毕，贡献 +20，资源 +15'; },
            minMorale: 0, maxMorale: 100
        }
    },
    '霹雳堂': {
        'pili_test': {
            type: 'internal', icon: '🎆', name: '火器试放',
            desc: function () { return '霹雳堂新制火器试放，山谷轰鸣，烟腾数丈。'; },
            effect: function (s) { _morale(s, 8); _resources(s, 20); return '试放成功，士气 +8，资源 +20'; },
            minMorale: 0, maxMorale: 100
        },
        'pili_mining': {
            type: 'external', icon: '🧨', name: '火矿开采',
            desc: function () { return '霹雳堂辖下火石矿脉开采正盛。'; },
            effect: function (s) { _resources(s, 35); return '火石丰足，资源 +35'; },
            minMorale: 0, maxMorale: 100
        }
    },
    '茅山派': {
        'maoshan_ritual': {
            type: 'internal', icon: '📿', name: '金箓斋醮',
            desc: function () { return '茅山开坛做金箓大醮，符灯千盏，夜如白昼。'; },
            effect: function (s) { _morale(s, 12); return '醮成，士气 +12'; },
            minMorale: 0, maxMorale: 100
        },
        'maoshan_zombie': {
            type: 'external', icon: '🧟', name: '伏僵尸令',
            desc: function () { return '山下村落报有僵尸伤人，茅山发伏尸令，弟子领命下山。'; },
            effect: function (s) { _contrib(s, 30); _influence(s, 8); return '伏尸有功，贡献 +30，影响力 +8'; },
            minMorale: 0, maxMorale: 100
        }
    },
    '大隐阁': {
        'dayin_chess': {
            type: 'internal', icon: '♟️', name: '隐者棋会',
            desc: function () { return '大隐阁诸隐士以棋会友，一局一日，胜负不论。'; },
            effect: function (s) { _points(s, 20); _morale(s, 5); return '棋会有得，积分 +20，士气 +5'; },
            minMorale: 0, maxMorale: 100
        },
        'dayin_lecture': {
            type: 'internal', icon: '🎋', name: '隐修讲道',
            desc: function () { return '大隐阁前辈开讲，讲的不是功法，是进退存亡之道。'; },
            effect: function (s) { _points(s, 25); return '听讲有得，积分 +25'; },
            minMorale: 0, maxMorale: 100
        }
    },
    '天书阁': {
        'tianshu_sort': {
            type: 'internal', icon: '📚', name: '天书整理',
            desc: function () { return '天书阁藏书万卷，弟子编目整理，偶有孤本重见天日。'; },
            effect: function (s) { _points(s, 20); _resources(s, 15); return '整理有获，积分 +20，资源 +15'; },
            minMorale: 0, maxMorale: 100
        },
        'tianshu_decode': {
            type: 'internal', icon: '🔮', name: '残卷解谜',
            desc: function () { return '阁中一幅上古残卷被解开一角，阁中震动。'; },
            effect: function (s) { _morale(s, 10); _points(s, 25); return '解谜有功，士气 +10，积分 +25'; },
            minMorale: 0, maxMorale: 100
        }
    },
    '蓬莱派': {
        'penglai_cloudsea': {
            type: 'internal', icon: '☁️', name: '云海聚灵',
            desc: function () { return '蓬莱云海翻涌，灵气如潮，弟子临海吐纳。'; },
            effect: function (s) { _morale(s, 10); _points(s, 15); return '聚灵有得，士气 +10，积分 +15'; },
            minMorale: 0, maxMorale: 100
        },
        'penglai_feast': {
            type: 'bonus', icon: '🍑', name: '仙岛宴',
            desc: function () { return '蓬莱仙岛灵果成熟，全派设宴同庆。'; },
            effect: function (s) { _morale(s, 15); _contrib(s, 15); return '仙岛宴，士气 +15，贡献 +15'; },
            minMorale: 0, maxMorale: 100
        }
    },
    '衡山派': {
        'hengshan_s_clouds': {
            type: 'internal', icon: '🌫️', name: '衡岳云海',
            desc: function () { return '衡山云海连日不散，弟子云海之上晨课。'; },
            effect: function (s) { _morale(s, 8); _points(s, 15); return '晨课有得，士气 +8，积分 +15'; },
            minMorale: 0, maxMorale: 100
        },
        'hengshan_s_incense': {
            type: 'internal', icon: '🛕', name: '祝圣香火',
            desc: function () { return '祝圣寺香火鼎盛，衡山弟子随喜护持。'; },
            effect: function (s) { _morale(s, 10); _influence(s, 5); return '护持有功，士气 +10，影响力 +5'; },
            minMorale: 0, maxMorale: 100
        }
    },
    '丐帮': {
        'gaibang_relay': {
            type: 'external', icon: '📨', name: '情报接力',
            desc: function () { return '丐帮弟子遍布天下，一条消息一夜传遍九州。'; },
            effect: function (s) { _influence(s, 12); _contrib(s, 15); return '情报立功，影响力 +12，贡献 +15'; },
            minMorale: 0, maxMorale: 100
        },
        'gaibang_staff': {
            type: 'internal', icon: '🥢', name: '打狗棒会',
            desc: function () { return '丐帮一年一度的打狗棒法比试，帮众围观如堵。'; },
            effect: function (s) { _morale(s, 12); _points(s, 20); return '棒会有得，士气 +12，积分 +20'; },
            minMorale: 0, maxMorale: 100
        }
    },
    '铁掌帮': {
        'tiezhang_palm': {
            type: 'internal', icon: '🖐️', name: '掌力大较',
            desc: function () { return '铁掌帮掌力大较，一掌断石，满场喝彩。'; },
            effect: function (s) { _morale(s, 10); _points(s, 20); return '掌较有得，士气 +10，积分 +20'; },
            minMorale: 0, maxMorale: 100
        },
        'tiezhang_escort': {
            type: 'external', icon: '🚢', name: '水路护航',
            desc: function () { return '铁掌帮辖下水路商船求护航，帮中领命出船。'; },
            effect: function (s) { _resources(s, 30); _contrib(s, 15); return '护航得利，资源 +30，贡献 +15'; },
            minMorale: 0, maxMorale: 100
        }
    },
    '百花谷': {
        'baihua_bloom': {
            type: 'bonus', icon: '🌺', name: '百花会',
            desc: function () { return '百花谷百花齐放，全谷张灯，弟子以花为题各展才艺。'; },
            effect: function (s) { _morale(s, 15); _contrib(s, 15); return '百花会，士气 +15，贡献 +15'; },
            minMorale: 0, maxMorale: 100
        },
        'baihua_cuisine': {
            type: 'internal', icon: '🍡', name: '药膳宴',
            desc: function () { return '百花谷以花入馔、以药入膳，今日设药膳宴。'; },
            effect: function (s) { _morale(s, 10); _points(s, 10); return '药膳养人，士气 +10，积分 +10'; },
            minMorale: 0, maxMorale: 100
        }
    },
    '五仙教': {
        'wuxian_gufest': {
            type: 'internal', icon: '🦋', name: '祭蛊大典',
            desc: function () { return '五仙教祭蛊大典，万蛊齐鸣，鼓乐通宵。'; },
            effect: function (s) { _morale(s, 12); return '祭典成，士气 +12'; },
            minMorale: 0, maxMorale: 100
        },
        'wuxian_gucontest': {
            type: 'internal', icon: '🕷️', name: '斗蛊会',
            desc: function () { return '教中弟子斗蛊为戏，胜者的蛊得「蛊王」之名。'; },
            effect: function (s) { _points(s, 20); _morale(s, 8); return '斗蛊有得，积分 +20，士气 +8'; },
            minMorale: 0, maxMorale: 100
        }
    },
    '修罗宫': {
        'xiuluo_ledger': {
            type: 'internal', icon: '📕', name: '血债簿清点',
            desc: function () { return '修罗宫季度清点血债簿，旧账新账，一笔一笔摊开。'; },
            effect: function (s) { _morale(s, 8); _contrib(s, 20); return '清点有功，士气 +8，贡献 +20'; },
            minMorale: 0, maxMorale: 100
        },
        'xiuluo_formation': {
            type: 'internal', icon: '🗡️', name: '双刺合阵',
            desc: function () { return '修罗宫弟子演练双刺合阵，阵成之日，殿前寒气逼人。'; },
            effect: function (s) { _morale(s, 10); _points(s, 20); return '合阵有得，士气 +10，积分 +20'; },
            minMorale: 0, maxMorale: 100
        }
    },
    '阎罗殿': {
        'yanluo_register': {
            type: 'internal', icon: '📖', name: '索命册更新',
            desc: function () { return '阎罗殿索命册添了新名字，殿中灯火一夜未熄。'; },
            effect: function (s) { _morale(s, 8); return '册成，士气 +8'; },
            minMorale: 0, maxMorale: 100
        },
        'yanluo_market': {
            type: 'external', icon: '🏮', name: '鬼市开集',
            desc: function () { return '阎罗殿辖下鬼市开集，来路不明的奇货摆满长街。'; },
            effect: function (s) { _resources(s, 35); _morale(s, 5); return '鬼市得利，资源 +35，士气 +5'; },
            minMorale: 0, maxMorale: 100
        }
    },
    '昆仑派': {
        'kunlun_jade': {
            type: 'internal', icon: '💠', name: '玉脉养气',
            desc: function () { return '昆仑玉脉温润养人，弟子入脉静坐养气。'; },
            effect: function (s) { _points(s, 15); _morale(s, 8); return '养气有得，积分 +15，士气 +8'; },
            minMorale: 0, maxMorale: 100
        },
        'kunlun_trial': {
            type: 'internal', icon: '❄️', name: '冰雪试炼',
            desc: function () { return '昆仑弟子攀冰峰、过雪线，一年一度的冰雪试炼。'; },
            effect: function (s) { _contrib(s, 25); _morale(s, 5); return '试炼有功，贡献 +25，士气 +5'; },
            minMorale: 0, maxMorale: 100
        }
    },
    '金刚宗': {
        'jingang_relic': {
            type: 'bonus', icon: '📿', name: '舍利放光',
            desc: function () { return '金刚宗塔内舍利夜放光明，全寺僧众合十诵经。'; },
            effect: function (s) { _morale(s, 15); return '祥瑞，士气 +15'; },
            minMorale: 0, maxMorale: 100
        },
        'jingang_debate': {
            type: 'internal', icon: '🗣️', name: '辩经大会',
            desc: function () { return '金刚宗辩经大会，僧众机锋往来，辩到酣处，满堂皆寂。'; },
            effect: function (s) { _points(s, 20); _morale(s, 5); return '辩经有得，积分 +20，士气 +5'; },
            minMorale: 0, maxMorale: 100
        }
    },
    // ==================== v20.50 第二批：补齐零专属的十门 ====================
    '天山派': {
        'tsl_rongxue': {
            type: 'internal', icon: '🌊', name: '融雪断道',
            desc: function () { return '春阳一暖，雪水冲垮了上山的吊桥，采药道断了两日。掌门点人轮班修栈，你也在班上。'; },
            effect: function (s) { _contrib(s, 35); _morale(s, 3); return '吊桥复通，过桥的师姐朝你点了点头。贡献 +35，士气 +3'; },
            minMorale: 0, maxMorale: 100
        },
        'tsl_xuelian': {
            type: 'bonus', icon: '❄️', name: '雪莲开了',
            desc: function () { return '崖顶雪莲三年一开，开不过一个时辰。采莲须赤手、须赶在日出前——霜气最重的时候，花瓣才合得最紧。'; },
            effect: function (s) { _points(s, 15); _morale(s, 5); return '你带回来的雪莲根须齐全，掌门难得笑了一声。积分 +15，士气 +5'; },
            minMorale: 0, maxMorale: 100
        }
    },
    '逍遥派': {
        'xy_shiqin': {
            type: 'bonus', icon: '🎶', name: '石琴自鸣',
            desc: function () { return '山雨初歇，风穿石隙，后山的石琴自己响了半阙《流水》。阁中弟子都停了手里的活——听完了，才想起来没人会弹琴。'; },
            effect: function (s) { _points(s, 20); _morale(s, 4); return '半阙曲子入梦，三日不绝。积分 +20，士气 +4'; },
            minMorale: 0, maxMorale: 100
        },
        'xy_laike': {
            type: 'internal', icon: '🥾', name: '山道来客',
            desc: function () { return '一名官差借问山路，眼睛却一直在数门里的屋顶。阁中规矩：不迎、不拒、不留。你奉茶一盏，送客下山。'; },
            effect: function (s) { _influence(s, 2); _contrib(s, 15); return '官差下山后再没来过。长老说了句：「送得干净。」贡献 +15，影响力 +2'; },
            minMorale: 0, maxMorale: 100
        }
    },
    '血手门': {
        'xsm_yongjin': {
            type: 'bonus', icon: '🩸', name: '旧单尾款',
            desc: function () { return '三年前一桩旧单的尾款到了，走的是七道手、换了四批人。账房让你点数——点清楚了，这单才算销。'; },
            effect: function (s) { _contrib(s, 40); return '银票对上暗记，分毫不差。账房破例给你倒了杯酒。贡献 +40'; },
            minMorale: 0, maxMorale: 100
        },
        'xsm_shao': {
            type: 'internal', icon: '🔥', name: '烧档之夜',
            desc: function () { return '官府在翻三年前的一桩旧案。门里连夜烧档，火盆从上房摆到柴房。你守的是最里间那口柜子——烧完，钥匙沉了井。'; },
            effect: function (s) { _contrib(s, 25); _morale(s, -4); return '档烧干净了，人心也烧去了一角——被烧掉的那些名字，总得有人记得。贡献 +25，士气 -4'; },
            minMorale: 0, maxMorale: 60
        }
    },
    '青城派': {
        'qc_shanchan': {
            type: 'bonus', icon: '🌿', name: '山产出山',
            desc: function () { return '后山茯苓今年是个大年，一窖挖出脸盆大的一窝。门里赶集的车凑不齐人手，你报了名。'; },
            effect: function (s) { _contrib(s, 30); _resources(s, 20); return '山货卖了俏价，回来时车上捎了两篓盐。贡献 +30，库存 +20'; },
            minMorale: 0, maxMorale: 100
        },
        'qc_xunshan': {
            type: 'internal', icon: '🪓', name: '巡山清道',
            desc: function () { return '采药道上有人剪径，劫的是上山香客。门里组队巡山，点到你的名——香客敢上山，靠的是这条路太平。'; },
            effect: function (s) { _contrib(s, 25); _morale(s, 5); return '流寇散了，山道三日无警。香客路过山门，作了个揖。贡献 +25，士气 +5'; },
            minMorale: 0, maxMorale: 100
        }
    },
    '峨眉派': {
        'em_lingcha': {
            type: 'bonus', icon: '🍵', name: '雨前灵茶',
            desc: function () { return '谷雨前的灵茶只采三日，芽尖带露、指尖不能沾油。师父说：采茶的手，比剑上的手更要稳。'; },
            effect: function (s) { _contrib(s, 25); _resources(s, 25); return '三十六斤雨前茶入仓，来年的香火钱有了一半。贡献 +25，库存 +25'; },
            minMorale: 0, maxMorale: 100
        },
        'em_xiangke': {
            type: 'internal', icon: '🪷', name: '女尼进香',
            desc: function () { return '山下庵堂百名女尼上山进香，知客房一夜没合眼。你被点去引路——峨眉的香火，一半是这些脚步声。'; },
            effect: function (s) { _contrib(s, 30); _morale(s, 3); return '香客下山时，为首的老师太往你手里塞了一串佛珠。贡献 +30，士气 +3'; },
            minMorale: 0, maxMorale: 100
        }
    },
    '唐门': {
        'tm_shidu': {
            type: 'internal', icon: '⚗️', name: '试毒当值',
            desc: function () { return '药堂新配「牵机散」，按门规须有人服了解药试毒——试出几分发麻，才算成药。轮到你当值，堂主亲自看着你喝。'; },
            effect: function (s) { _points(s, 15); _morale(s, -2); return '半日舌根发麻，傍晚才散。药堂记了你的名——唐门的毒谱上，也有一页是你的舌头。积分 +15，士气 -2'; },
            minMorale: 0, maxMorale: 100
        },
        'tm_gongfang': {
            type: 'bonus', icon: '🎯', name: '工坊赶工',
            desc: function () { return '老主顾催一批子母飞蝗镖，工坊三炉齐开仍赶不齐，你被派去修刺——一百枚，一枚都不能有毛刺。'; },
            effect: function (s) { _contrib(s, 35); _resources(s, 15); return '一百枚验完，验镖的师傅挑不出一根刺，难得夸了句「手稳」。贡献 +35，库存 +15'; },
            minMorale: 0, maxMorale: 100
        }
    },
    '铸剑山庄': {
        'zj_kaolu': {
            type: 'bonus', icon: '🔥', name: '开炉祭',
            desc: function () { return '新炉开火是山庄的大日子：绕炉三周、投铁三块、老庄主亲手点第一把火——火色青了，才许开炉。'; },
            effect: function (s) { _morale(s, 6); _contrib(s, 20); return '火色青透，满庄喝彩。这一炉里，也有你投的那块铁。贡献 +20，士气 +6'; },
            minMorale: 0, maxMorale: 100
        },
        'zj_cuihuo': {
            type: 'internal', icon: '🌊', name: '淬火之夜',
            desc: function () { return '名剑出炉在即，淬火须取子时海潮，弟子轮班下到礁盘搅水——潮头一乱，剑就废了。你值的是最冷的那个时辰。'; },
            effect: function (s) { _contrib(s, 35); _points(s, 10); return '剑入水那一声长吟，你一辈子忘不掉。锻师说：「潮头是你稳住的。」贡献 +35，积分 +10'; },
            minMorale: 0, maxMorale: 100
        }
    },
    '飞蝎坞': {
        'fx_fenwo': {
            type: 'internal', icon: '🦂', name: '蝎房分窝',
            desc: function () { return '种蝎产籽三百，须连夜分窝——二人一班、竹钳一柄，被蜇了不许叫，惊了种蝎，全坞的年毒就没了。'; },
            effect: function (s) { _contrib(s, 30); _points(s, 10); return '三百籽蝎各归各窝，你的手背上多了两个红点——坞里说，这是「入行的印」。贡献 +30，积分 +10'; },
            minMorale: 0, maxMorale: 100
        },
        'fx_ganghai': {
            type: 'bonus', icon: '🐚', name: '赶大潮',
            desc: function () { return '月圆退大潮，滩涂能走出去三里。坞中倾巢赶海——蛏子、海葵、搁浅的银鱼，潮水回来之前，滩上全是人。'; },
            effect: function (s) { _resources(s, 30); _morale(s, 3); return '潮水回来时，篓子满了。晚饭加了一道银鱼汤，坞主亲自分的。库存 +30，士气 +3'; },
            minMorale: 0, maxMorale: 100
        }
    },
    '烈日教': {
        'lr_tuodui': {
            type: 'bonus', icon: '🐪', name: '驼队归坞',
            desc: function () { return '走西线的驼队三个月后终于进了坞，驼背上压着成捆的毡子和半路救下的一车瓷器。卸货点数，缺了一件——按教规，谁的队谁认。'; },
            effect: function (s) { _resources(s, 35); _morale(s, 4); return '点数入库，教里摆了汤锅。卸货的人先吃。库存 +35，士气 +4'; },
            minMorale: 0, maxMorale: 100
        },
        'lr_taojing': {
            type: 'internal', icon: '🕳️', name: '淘井',
            desc: function () { return '绿洲的老井水位又落了三尺。教里点丁淘井，下到三丈，泥里淘出来的不只是沙——还有前朝商队失落的半枚铜铃。'; },
            effect: function (s) { _contrib(s, 30); _morale(s, 3); return '井水涨回了两尺。铜铃挂在井亭，风一过就响。贡献 +30，士气 +3'; },
            minMorale: 0, maxMorale: 100
        }
    },
    '天龙教': {
        'tl_nagong': {
            type: 'bonus', icon: '🕯️', name: '八方纳贡',
            desc: function () { return '秋祭将近，八方分舵的教众齐来纳贡：粮、皮子、香烛，还有各家攒的旧铁。教主令：纳贡的人，先吃饭。'; },
            effect: function (s) { _resources(s, 30); _morale(s, 5); return '贡入库房，饭摆到山门外——教众离心的事，最怕的就是这一口热饭。库存 +30，士气 +5'; },
            minMorale: 0, maxMorale: 100
        },
        'tl_xunjiang': {
            type: 'internal', icon: '📖', name: '随行长老巡讲',
            desc: function () { return '长老巡讲安众，点名要一名随行记录——记的不是经文，是各分舵的脸色。哪个舵的人心浮了，记下来，比经文要紧。'; },
            effect: function (s) { _contrib(s, 30); _influence(s, 2); return '半册记录交上去，长老翻完只说：「眼睛不错。」贡献 +30，影响力 +2'; },
            minMorale: 0, maxMorale: 100
        }
    }
};

window.SECT_EXCLUSIVE_EVENTS = SECT_EXCLUSIVE_EVENTS;

})();
