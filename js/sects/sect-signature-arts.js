// ==================== sect-signature-arts.js - 开山秘艺（第十二波 · 门派特色升华为高级功法） ====================
// 旧「门派特色」是点一下加个数等冷却的按钮，早就退役成了「门中底子」被动层——可各派的看家本事
// （达摩洞悟道、太极演武、丹方研究、名剑铸造……）一直缺一门**功法形态**的正身。
// 本模块把三十六派的特色逐一升华为「开山秘艺」：一门 tier4 三品绝学，挂进既有的门派功法表——
// 藏经阁四层阅览、掌门亲传、参悟掌握度、战斗六维加成、流派判定，全部走现成的真线，零平行数据。
// 与既有镇派绝学（易筋经/太极剑意们）并列：镇派的是「武功之巅」，秘艺是「立派的本事入了武道」。
// 纪律：幂等（重复加载不重复挂）、缺表不炸、零外文字母。
(function () {
    'use strict';
    var W = window;
    if (typeof W === 'undefined') return;

    // 三十六派 · 特色 → 秘艺。类型三条规则定：
    //   ① 跟着原特色的实际效果走（防御心境→炼体，真气修炼→内功，剑技→剑法……），不跟名字的感觉走；
    //   ② 与本派镇派绝学互补成对（武当绝学是剑，秘艺就走内功养气）——主题冲突时跟主题（金刚宗不坏真身照走炼体）；
    //   ③ 四族各接真系统：养（内功）接真气恢复、击走流派判定、身走六维入战斗、百工带「域」折进炼丹/锻造/情报/典籍真判定。
    var SIGNATURES = [
        { sect: '少林寺', name: '达摩心印', type: '炼体', domain: null },        // 原效果防御+心境 → 炼体；与易筋经（内功）互补
        { sect: '武当派', name: '太极真意', type: '内功', domain: 'qi' },        // 原效果招架反击养气 → 内功；与太极剑意（剑）互补
        { sect: '全真教', name: '重阳丹诀', type: '内功', domain: 'qi' },
        { sect: '华山派', name: '华山剑气篇', type: '剑法', domain: null },
        { sect: '嵩山派', name: '嵩山阵剑', type: '剑法', domain: null },
        { sect: '恒山派', name: '恒山绵丝剑', type: '剑法', domain: null },
        { sect: '衡山派', name: '衡山云雾诀', type: '剑法', domain: null },
        { sect: '泰山派', name: '泰山压顶捶', type: '拳掌', domain: null },
        { sect: '峨眉派', name: '峨眉剑意篇', type: '剑法', domain: null },
        { sect: '丐帮', name: '千耳百目功', type: '奇门', domain: 'intel' },     // 消息灵通 → 情报域
        { sect: '大旗门', name: '大旗战阵诀', type: '长兵', domain: null },
        { sect: '侠隐阁', name: '南天遗风', type: '剑法', domain: null },
        { sect: '药王谷', name: '药王丹经', type: '医术', domain: 'alchemy' },   // 丹方研究 → 丹道域
        { sect: '天山派', name: '雪魄寒诀', type: '内功', domain: 'qi' },
        { sect: '铸剑山庄', name: '百炼铸剑录', type: '奇门', domain: 'forging' }, // 名剑铸造 → 锻冶域
        { sect: '茅山派', name: '符笔春秋', type: '符箓', domain: 'talisman' },
        { sect: '大隐阁', name: '大隐晦明篇', type: '内功', domain: 'qi' },
        { sect: '天书阁', name: '天书读神术', type: '奇门', domain: 'tomes' },   // 天书阅览 → 典籍域（参悟效率）
        { sect: '天涯海阁', name: '海阁歌韵诀', type: '内功', domain: 'qi' },
        { sect: '神机门', name: '神机百工谱', type: '奇门', domain: 'forging' }, // 机关研究 → 锻冶域
        { sect: '霹雳堂', name: '霹雳雷火诀', type: '奇门', domain: 'forging' }, // 火药调配 → 锻冶域
        { sect: '昆仑派', name: '昆仑玄天功', type: '内功', domain: 'qi' },
        { sect: '金刚宗', name: '不坏真身篇', type: '炼体', domain: null },      // 主题冲突时跟主题：金刚不坏照走炼体
        { sect: '青城派', name: '松风剑诀', type: '剑法', domain: null },
        { sect: '蓬莱派', name: '蓬莱寻潮步', type: '轻功', domain: null },
        { sect: '五仙教', name: '蛊母秘典', type: '奇门', domain: 'poison' },    // 蛊术研究 → 毒经域（毒丹同炉）
        { sect: '逍遥派', name: '逍遥游身诀', type: '轻功', domain: null },
        { sect: '唐门', name: '袖里百炼篇', type: '奇门', domain: 'forging' },   // 暗器工坊 → 锻冶域
        { sect: '百花谷', name: '百花酿香谱', type: '医术', domain: 'alchemy' }, // 百花酿制 → 丹道域
        { sect: '铁掌帮', name: '铁掌裂浪功', type: '拳掌', domain: null },
        { sect: '修罗宫', name: '修罗屠戮篇', type: '刀法', domain: null },
        { sect: '阎罗殿', name: '阎罗夺命诀', type: '刀法', domain: null },
        { sect: '血手门', name: '血手五毒经', type: '奇门', domain: 'poison' },  // 血手毒功 → 毒经域
        { sect: '飞蝎坞', name: '飞蝎毒经', type: '医术', domain: 'poison' },    // 毒药炼制 → 毒经域（毒丹同炉）
        { sect: '烈日教', name: '烈日焚天诀', type: '法术', domain: null },
        { sect: '天龙教', name: '八部护法功', type: '炼体', domain: null }
    ];
    var DOMAIN_WORD = { alchemy: '丹道', forging: '锻冶', poison: '毒经', intel: '情报', talisman: '符造', tomes: '典籍', qi: '养气' };
    // ============ 力度总表（第十二波·平衡落地：全部旋钮收进一张表，改平衡只动这里） ============
    // 预算带：每门秘艺满掌握的出力 = 六维合计（22~24 点，两族等值）+ 至多一个域效果（下列系数即封顶）。
    // 对照口径：击/身族独有项 = 流派被动（暴击/反击 10~15 点或 10~15% 乘区，build-school 真值）；
    //           百工族独有项 = 域钩子（经济/情报/恢复，按期望值折算与流派被动同数量级，见审计测试的声明常数）。
    var SIG_TUNING = {
        sixBudget: [22, 24],   // 六维预算带（含端点）
        craftRate: 0.04,       // 丹道/毒经→炼丹、锻冶→锻造：成功率封顶 +4%
        poisonEase: 0.30,      // 丹道/毒经第二面：丹毒积累减免封顶 30%
        intelChance: 0.15,     // 情报域：情报机缘封顶 +15%
        intelCombat: 2,        // 情报第二面：战斗命中/闪避封顶各 +2（耳目是斥候，不是先锋）
        tomesStudy: 0.30,      // 典籍域：参悟效率封顶 +30%
        qiRegen: 3,            // 养气域：真气恢复封顶 +3%
        forgeDiscount: 0.15,   // 锻冶第二面：制作强化费用再折封顶 15%
        forgeFloor: 0.45,      // 费用折上折的封底（消费在制作费用结算，登记在此备审计）
        talismanQiSave: 0.30   // 符造第二面：制符真气消耗减免封顶 30%（符笔随心）
    };
    W.SECT_SIG_TUNING = SIG_TUNING;

    // 类型 → 六维走向（与既有 tier4 绝学同量级：两维合计落在预算带内）
    var TYPE_BONUS = {
        '内功': { constitution: 12, meridian: 12 },
        '剑法': { strength: 12, dexterity: 12 },
        '刀法': { strength: 14, willpower: 9 },
        '拳掌': { strength: 13, constitution: 10 },
        '轻功': { dexterity: 14, meridian: 9 },
        '奇门': { intelligence: 13, dexterity: 10 },
        '符箓': { intelligence: 14, willpower: 9 },
        '炼体': { constitution: 14, strength: 9 },
        '法术': { intelligence: 15, meridian: 8 },
        '医术': { intelligence: 11, constitution: 11 }
    };

    function specOf(sect) { try { return (W.SECT_SPECIALTIES || {})[sect] || null; } catch (e) { return null; } }
    function sigArtOf(sect) {
        try {
            var arts = (W.SECT_SPECIFIC_ARTS || {})[sect] || [];
            for (var i = 0; i < arts.length; i++) { if (String(arts[i].id || '').indexOf('art_sig_') === 0) return arts[i]; }
        } catch (e) {}
        return null;
    }

    // 转化：每派一门，幂等
    function buildAll() {
        var built = 0;
        if (!W.SECT_SPECIFIC_ARTS) return built;
        SIGNATURES.forEach(function (sig, idx) {
            try {
                var arts = W.SECT_SPECIFIC_ARTS[sig.sect];
                if (!arts) return;
                if (sigArtOf(sig.sect)) return; // 已挂过（重复加载/读档重跑）不重复挂
                var spec = specOf(sig.sect);
                var id = 'art_sig_' + (idx < 10 ? '0' + idx : String(idx));
                arts.push({
                    id: id,
                    name: sig.name,
                    type: sig.type,
                    domain: sig.domain || null, // 百工/养气之域——掌握度折进对应真判定的凭据
                    grade: '三品',
                    tier: 4,
                    transmit: 'direct', // 与镇派绝学同格：掌门亲传方可参悟
                    wuxingReq: 26,
                    bonus: TYPE_BONUS[sig.type] || { constitution: 11, intelligence: 11 },
                    copyPrice: 3000,
                    desc: '「' + sig.sect + '」的开山秘艺——把立派的本事练进武道' + (spec && spec.desc ? '：' + spec.desc : '') + '。掌握越深，越见本源。'
                });
                built++;
            } catch (e) {}
        });
        return built;
    }
    var builtCount = buildAll();

    // ============ 域的钩子：掌握度折进真判定（crafting / 藏经阁 / 情报 / 吐纳四处消费） ============
    function ownSigArt() {
        try {
            var d = W.discipleState;
            if (!d || !d.isInSect) return null;
            var sect = d.sectName || d.sectId;
            var art = sigArtOf(sect);
            if (!art) return null;
            var ins = insightOf(art.id);
            var m = ins ? Math.round(Number(ins.m) || 0) : 0;
            return m > 0 ? { art: art, m: m } : null; // 参悟过才算数——书没翻开，本事不会自己上身
        } catch (e) { return null; }
    }
    // 丹道/毒经助丹炉、锻冶助铁砧、符造助符笔：掌握度折成成功率（力度读总表，封顶即表值；与门中炉火的场地加成可叠加——炉火是场地，秘艺是本事）
    W.sectSignatureCraftBonus = function (category) {
        var own = ownSigArt();
        if (!own) return 0;
        var dom = own.art.domain;
        if ((dom === 'alchemy' || dom === 'poison') && category === 'pilfer') return Math.round(own.m * SIG_TUNING.craftRate) / 100;
        if (dom === 'forging' && category === 'forging') return Math.round(own.m * SIG_TUNING.craftRate) / 100;
        if (dom === 'talisman' && category === 'talismans') return Math.round(own.m * SIG_TUNING.craftRate) / 100;
        return 0;
    };
    // 典籍域：会读书的人，参悟更快（满掌握按总表封顶）
    W.sectSignatureStudyMul = function () {
        var own = ownSigArt();
        if (!own || own.art.domain !== 'tomes') return 1;
        return 1 + Math.round(own.m * SIG_TUNING.tomesStudy) / 100;
    };
    // 养气域：内功秘艺练上身，吐纳自绵长（走既有恢复结算，百分数封顶读总表）
    W.sectSignatureQiRegenPct = function () {
        var own = ownSigArt();
        if (!own || own.art.domain !== 'qi') return 0;
        return Math.round(own.m * SIG_TUNING.qiRegen / 10) / 10;
    };
    // 情报域：耳目练出来了，听人说话自会拣要紧的（情报机缘封顶读总表）
    W.sectSignatureIntelBonus = function () {
        var own = ownSigArt();
        if (!own || own.art.domain !== 'intel') return 0;
        return Math.round(own.m * SIG_TUNING.intelChance) / 100;
    };
    // ===== 百工的第二面（上场）：本事不只留在工坊里 =====
    // 情报域·战斗面：听风辨位——命中与闪避封顶读总表（耳目是斥候，不是先锋）
    W.sectSignatureCombatBonus = function () {
        var own = ownSigArt();
        if (!own || own.art.domain !== 'intel') return {};
        var v = Math.round(own.m * SIG_TUNING.intelCombat / 100);
        return v > 0 ? { hit: v, dodge: v } : {};
    };
    // 丹道/毒经域·战斗面：知药者丹毒轻——减免封顶读总表（走既有丹毒账）
    W.sectSignaturePoisonEase = function () {
        var own = ownSigArt();
        if (!own || (own.art.domain !== 'alchemy' && own.art.domain !== 'poison')) return 0;
        return Math.round(own.m * SIG_TUNING.poisonEase) / 100;
    };
    // 锻冶域·场面上：炉工熟络——制作强化费用再折封顶读总表（与工坊折扣叠乘，封底 forgeFloor）
    W.sectSignatureForgeDiscount = function () {
        var own = ownSigArt();
        if (!own || own.art.domain !== 'forging') return 0;
        return Math.round(own.m * SIG_TUNING.forgeDiscount) / 100;
    };
    // 符造域·第二面：符笔随心——凝符纹耗的真气省几成（封顶读总表；只在制符结算吃折扣，不改配方标价）
    W.sectSignatureTalismanQiSave = function () {
        var own = ownSigArt();
        if (!own || own.art.domain !== 'talisman') return 0;
        return Math.round(own.m * SIG_TUNING.talismanQiSave) / 100;
    };

    // ============ 门派详情页的「开山秘艺」卡 ============
    function insightOf(artId) {
        try {
            var d = W.discipleState;
            var ins = d && d.artInsights ? d.artInsights[artId] : null;
            return ins || null;
        } catch (e) { return null; }
    }
    W.sectSignatureCard = function (sectName) {
        var art = sigArtOf(sectName);
        if (!art) return '';
        var d = W.discipleState || {};
        var ins = insightOf(art.id);
        var m = ins ? Math.round(Number(ins.m) || 0) : 0;
        var heard = !!(ins && ins.heard);
        var stateLine;
        if (m >= 100) stateLine = '<span class="text-amber-300">已大成——秘艺在你手里见了本源。</span>';
        else if (m > 0) stateLine = '参悟中：掌握 ' + m + '%（越深越见本源，师父在时请益事半功倍）——已可运功：去运功栏把这门秘艺选作主修。';
        else if (heard) stateLine = '阁中翻过，还未入定参悟。';
        else if (d.isInSect && d.rank != null && d.rank <= 2) stateLine = '你已上得藏经阁四层——去阁中翻阅，再请掌门亲传。';
        else stateLine = '藏经阁四层之物，长老以上可阅；亲传非掌门不授。';
        var bonusText = [];
        var BN = { strength: '根骨', constitution: '体魄', dexterity: '身法', intelligence: '悟性', willpower: '心志', meridian: '经脉' };
        for (var k in art.bonus) { bonusText.push((BN[k] || k) + ' +' + art.bonus[k]); }
        // 域：秘艺的本事折进哪个真判定，卡上写明白（掌握度越深越得力）
        var domLine = '';
        if (art.domain && DOMAIN_WORD[art.domain]) {
            var domEffect = {
                alchemy: '丹炉成功率 +' + (Math.round(m * SIG_TUNING.craftRate * 10) / 10) + '%；第二面·知药者丹毒轻（丹毒积累 −' + Math.round(m * SIG_TUNING.poisonEase) + '%）',
                poison: '毒丹同炉，炼丹成功率 +' + (Math.round(m * SIG_TUNING.craftRate * 10) / 10) + '%；第二面·知毒者毒不滞体（丹毒积累 −' + Math.round(m * SIG_TUNING.poisonEase) + '%）',
                forging: '锻造成功率 +' + (Math.round(m * SIG_TUNING.craftRate * 10) / 10) + '%；第二面·炉工熟络（制作强化费用 −' + Math.round(m * SIG_TUNING.forgeDiscount) + '%）',
                intel: '情报机缘 +' + Math.round(m * SIG_TUNING.intelChance) + '%；第二面·听风辨位（战斗命中/闪避 +' + Math.round(m * SIG_TUNING.intelCombat / 100) + '）',
                tomes: '藏经阁参悟更快（效率 +' + Math.round(m * SIG_TUNING.tomesStudy) + '%）',
                qi: '吐纳绵长（真气恢复 +' + (Math.round(m * SIG_TUNING.qiRegen / 10) / 10) + '%）',
                talisman: '制符成功率 +' + (Math.round(m * SIG_TUNING.craftRate * 10) / 10) + '%；第二面·符笔随心（制符真气消耗 −' + Math.round(m * SIG_TUNING.talismanQiSave) + '%）'
            }[art.domain] || '';
            domLine = '<p class="text-xs text-gray-400 mb-1">艺之域：<span class="text-emerald-300">' + DOMAIN_WORD[art.domain] + '</span>——' + domEffect + '</p>';
        }
        // 互补成对：镇派绝学是武功之巅，秘艺是立派的本事
        var peers = [];
        try {
            var all = (W.SECT_SPECIFIC_ARTS || {})[sectName] || [];
            for (var i = 0; i < all.length; i++) {
                if ((Number(all[i].tier) || 1) === 4 && String(all[i].id || '').indexOf('art_sig_') !== 0) peers.push('《' + all[i].name + '》');
            }
        } catch (e) {}
        var pairLine = peers.length
            ? '<p class="text-xs text-gray-500 mb-1">与本派镇派绝学' + peers.join('、') + '互补成对——一个是武功之巅，一个是立派的本事入了武道。</p>'
            : '';
        return '<div class="bg-gray-800/60 border border-amber-700/50 rounded p-2 mb-3">' +
            '<p class="text-sm text-amber-300 mb-1">「' + art.name + '」 <span class="text-xs text-gray-400">' + art.type + ' · ' + art.grade + ' · 镇派之格（掌门亲传）</span></p>' +
            '<p class="text-xs text-gray-400 mb-1">' + (art.desc || '') + '</p>' +
            '<p class="text-xs text-gray-400 mb-1">功成之效：' + bonusText.join('，') + '（按掌握度发挥）</p>' +
            domLine + pairLine +
            '<p class="text-xs text-gray-300">' + stateLine + '</p></div>';
    };

    W.sectSignatureProbe = function (sectName) {
        if (sectName) {
            var art = sigArtOf(sectName);
            return art ? { sect: sectName, id: art.id, name: art.name, type: art.type, tier: art.tier, transmit: art.transmit, domain: art.domain || null } : null;
        }
        var total = 0, sects = [];
        for (var i = 0; i < SIGNATURES.length; i++) {
            if (sigArtOf(SIGNATURES[i].sect)) { total++; sects.push(SIGNATURES[i].sect); }
        }
        return { total: total, built: builtCount, sects: sects };
    };

    // ============ 审计：三十六门预算账（平衡调参的对账单，力度全读总表） ============
    var MARTIAL_TYPES = { '内功': 1, '剑法': 1, '刀法': 1, '拳掌': 1, '长兵': 1, '轻功': 1, '炼体': 1, '法术': 1 };
    W.sectSignatureAudit = function () {
        var rows = [];
        for (var i = 0; i < SIGNATURES.length; i++) {
            var s = SIGNATURES[i];
            var bonus = TYPE_BONUS[s.type] || { constitution: 11, intelligence: 11 };
            var sum = 0;
            for (var k in bonus) sum += bonus[k];
            rows.push({
                sect: s.sect, name: s.name, type: s.type, domain: s.domain || null,
                sixSum: sum,
                within: sum >= SIG_TUNING.sixBudget[0] && sum <= SIG_TUNING.sixBudget[1],
                martial: !!MARTIAL_TYPES[s.type],          // 武功书（可驱动流派）
                schoolDriver: !!MARTIAL_TYPES[s.type] && (s.type === '剑法' || s.type === '刀法' || s.type === '拳掌' || s.type === '炼体' || s.type === '长兵' || s.type === '内功' || s.type === '法术'),
                hooks: s.domain ? 1 : 0                     // 每门至多一个域钩子（防双吃）
            });
        }
        return rows;
    };
    console.log('[sect-signature-arts] 开山秘艺已注册：三十六派特色升华为镇派之格的高级功法（藏经阁四层/掌门亲传/掌握度成长，全走既有真线），本次新挂 ' + builtCount + ' 门');
})();
