// ==================== sect-art-channeling.js - 第十五波 · 秘艺运功（门派功法接入运功三槽） ====================
// 门派功法表（SECT_SPECIFIC_ARTS，含开山秘艺）此前只有「被动面」：参悟掌握度自动折六维、走流派判定。
// 可玩家最显眼的功法界面是「运功栏三槽」——内功/身法/绝技——里面却永远只有江湖流通的五十门功法，
// 自己门里的《易筋经》《达摩心印》反而运不了功，看得到摸不着。本模块把桥打通：
//   参悟过（掌握度 m>0）的门派功法 → 折成运功栏认得的功法形 → 出现在对应槽位的选择列表 → 可装备为主修。
// 装备的真实所得（不双吃，全部走既有管线）：
//   ① 绝技/身法槽：战斗中真的能出招（按类型与品阶生成招式，注册进 SKILL_ATTACK_MOVES）；
//   ② 内功主修槽：修炼吸纳加成（app.js 主修功法 +10% 既有规则）；
//   ③ 六维底蕴照旧走掌握度自动结算（getSectArtAttrBonuses），运功**不另发一份**——
//      效果文案只描述、不写战斗解析认得的「真气上限/防御/闪避+数字」字样，防止 inventory 重复入账。
// 凭据口径：装备门槛 = 掌握度 m>0（书翻开过才算会）；读档校验 = 结构查表（功法在表里就认，
//   因为读档时弟子状态还没恢复，掌握度账在后头才对上）。
// 纪律：幂等、缺表不炸、零外文字母、零浏览器原生弹窗。
(function () {
    'use strict';
    var W = window;
    if (typeof W === 'undefined') return;

    // ---------- 类型 → 图标 / 槽位走向（槽位映射本身走 equipment.js 的 SKILL_CATEGORY_MAP，这里只管脸面） ----------
    var TYPE_ICON = {
        '剑法': '🗡️', '刀法': '🔪', '拳掌': '✋', '长兵': '🔱', '轻功': '💨',
        '奇门': '🌀', '炼体': '🛡️', '法术': '✨', '符箓': '📜', '医术': '🌸', '内功': '📖'
    };
    var DOMAIN_WORD = { alchemy: '丹道', forging: '锻冶', poison: '毒经', intel: '情报', talisman: '符造', tomes: '典籍', qi: '养气' };
    var ATTR_WORD = { strength: '根骨', constitution: '体魄', dexterity: '身法', intelligence: '悟性', willpower: '心志', meridian: '经脉' };

    // ---------- 结构查表：功法在不在门派功法表里（不看掌握度——读档校验用这个口径） ----------
    function sectArtFind(artId) {
        try {
            var tables = W.SECT_SPECIFIC_ARTS || {};
            for (var sect in tables) {
                var arts = tables[sect] || [];
                for (var i = 0; i < arts.length; i++) {
                    if (arts[i] && arts[i].id === artId) return { art: arts[i], sect: sect };
                }
            }
        } catch (e) {}
        return null;
    }

    function insightOf(artId) {
        try {
            var d = W.discipleState;
            var ins = d && d.artInsights ? d.artInsights[artId] : null;
            return ins || null;
        } catch (e) { return null; }
    }
    function masteryOf(artId) {
        var ins = insightOf(artId);
        return ins ? Math.min(100, Math.round(Number(ins.m) || 0)) : 0;
    }

    // ---------- 折成运功栏认得的功法形 ----------
    // 效果文案纪律：六维用「根骨/体魄/身法/悟性/心志/经脉」正名——绝不出现
    // 「真气上限+N」「防御+N」「闪避+N」字样（那是装备功法入账的解析口径，写了就双吃）。
    function effectText(found) {
        var art = found.art;
        var parts = [];
        for (var k in (art.bonus || {})) parts.push((ATTR_WORD[k] || k) + ' +' + art.bonus[k]);
        var txt = parts.length ? parts.join('、') : '温养六维';
        txt += '（随掌握度发挥，当前 ' + masteryOf(art.id) + '%）';
        if (art.domain && DOMAIN_WORD[art.domain]) txt += '；艺之域·' + DOMAIN_WORD[art.domain];
        return txt;
    }

    // 结构口径：在表里就折得出形（读档校验/查名用）
    W.sectArtAsSkill = function (artId) {
        var found = sectArtFind(artId);
        if (!found) return null;
        var art = found.art;
        return {
            id: art.id,
            name: art.name,
            icon: TYPE_ICON[art.type] || '📜',
            type: art.type || '内功',
            grade: art.grade || '七品',
            desc: (art.desc || '') + '——' + found.sect + '传承，参悟后方可运功。',
            effect: effectText(found),
            qiCost: 0,
            _sectArt: true,
            _sectName: found.sect,
            _tier: Number(art.tier) || 1
        };
    };

    // 装备/列表口径：参悟过（掌握度 m>0）才算会——书没翻开，运不了功
    W.sectArtChannelable = function (artId) {
        return !!(sectArtFind(artId) && masteryOf(artId) > 0);
    };

    // 当前可运功的门派功法清单（运功栏选择列表/常用栏管理消费）
    W.sectArtChannelList = function () {
        var out = [];
        try {
            var ins = (W.discipleState && W.discipleState.artInsights) || {};
            for (var artId in ins) {
                if (!(masteryOf(artId) > 0)) continue;
                var def = W.sectArtAsSkill(artId);
                if (def) out.push(def);
            }
        } catch (e) {}
        return out;
    };

    // ---------- 招式生成：绝技/身法槽的门派武功，战斗中真的出得了招 ----------
    // 力度口径：与流通功法同带——一品阶一档（tier1 起手 1.05 → tier4 真传 1.65），
    // 真气消耗随品阶走，不白送。内功无招（主修槽的所得是修炼吸纳，不是拳头）。
    var MOVE_TPL = {
        '剑法': { dmg: 'pierce', names: ['·起手剑', '·真传一剑'], pen: [0, 10] },
        '刀法': { dmg: 'pierce', names: ['·开山刀', '·真传绝刀'], pen: [5, 15] },
        '拳掌': { dmg: 'blunt', names: ['·开山拳', '·崩山掌'], pen: [0, 8] },
        '长兵': { dmg: 'pierce', names: ['·出如龙', '·横扫阵'], pen: [5, 12] },
        '奇门': { dmg: 'pierce', names: ['·布机式', '·夺机式'], pen: [0, 6], hit: [10, 15] },
        '炼体': { dmg: 'blunt', names: ['·横练一击', '·金刚怒目'], pen: [10, 25] },
        '法术': { dmg: 'mental', names: ['·引诀', '·法出如山'], pen: [0, 5] },
        '符箓': { dmg: 'mental', names: ['·敕符', '·召雷令'], pen: [0, 5] },
        '轻功': { dmg: 'blunt', names: ['·掠影式', '·穿云式'], pen: [0, 0], hit: [15, 10], multMul: 0.8 },
        '医术': { dmg: 'heal', names: ['·回春真气'], pen: [0, 0], single: true }
    };
    function tierForce(tier) {
        if (tier >= 4) return { mults: [1.25, 1.65], qi: [12, 22] };
        if (tier >= 2) return { mults: [1.15, 1.5], qi: [9, 17] };
        return { mults: [1.05, 1.35], qi: [7, 13] };
    }
    function buildMoves(art) {
        var tpl = MOVE_TPL[art.type];
        if (!tpl) return []; // 内功：无招（所得在修炼吸纳）
        var f = tierForce(Number(art.tier) || 1);
        var mm = tpl.multMul || 1;
        var out = [];
        var n = tpl.single ? 1 : 2;
        for (var i = 0; i < n; i++) {
            out.push({
                id: art.id + '_m' + (i + 1),
                name: art.name + tpl.names[i],
                icon: TYPE_ICON[art.type] || '⚔️',
                partPreference: tpl.dmg === 'heal' ? 'chest' : (i === 0 ? 'chest' : 'head'),
                damageType: tpl.dmg,
                qiCost: f.qi[i] || f.qi[0],
                staminaCost: i === 0 ? 8 : 14,
                hitBonus: (tpl.hit && tpl.hit[i]) || 0,
                armorPenetration: (tpl.pen && tpl.pen[i]) || 0,
                damageMult: Math.round(f.mults[i] * mm * 100) / 100,
                desc: art.name + '的' + (i === 0 ? '入门一招' : '真传一式') + '——' + (art.desc || '')
            });
        }
        return out;
    }
    // 注册进既有招式表（幂等；equipment.js 在前、门派功法表与秘艺都已就位时才有东西可注册）
    function registerMoves() {
        var reg = 0;
        try {
            if (!W.SKILL_ATTACK_MOVES || !W.SECT_SPECIFIC_ARTS) return reg;
            for (var sect in W.SECT_SPECIFIC_ARTS) {
                var arts = W.SECT_SPECIFIC_ARTS[sect] || [];
                for (var i = 0; i < arts.length; i++) {
                    var art = arts[i];
                    if (!art || !art.id || W.SKILL_ATTACK_MOVES[art.id]) continue;
                    var mv = buildMoves(art);
                    if (mv.length) { W.SKILL_ATTACK_MOVES[art.id] = mv; reg++; }
                }
            }
        } catch (e) {}
        return reg;
    }
    var moveRegCount = registerMoves();
    W.sectArtMoves = function (artId) {
        var found = sectArtFind(artId);
        if (!found) return [];
        return (W.SKILL_ATTACK_MOVES && W.SKILL_ATTACK_MOVES[artId]) || buildMoves(found.art);
    };
    // 秘艺表是后挂的（掌门亲传那些），加载时序不巧时补一轮注册
    if (W.EventBus && W.EventBus.on) {
        try { W.EventBus.on('newDay', function () { registerMoves(); }); } catch (e) {}
    }

    // ---------- 探针 ----------
    W.sectArtChannelProbe = function () {
        var total = 0, withMoves = 0;
        try {
            for (var sect in (W.SECT_SPECIFIC_ARTS || {})) {
                var arts = W.SECT_SPECIFIC_ARTS[sect] || [];
                for (var i = 0; i < arts.length; i++) {
                    total++;
                    if (W.SKILL_ATTACK_MOVES && W.SKILL_ATTACK_MOVES[arts[i].id]) withMoves++;
                }
            }
        } catch (e) {}
        return {
            totalArts: total,
            artsWithMoves: withMoves,
            moveRegThisLoad: moveRegCount,
            channelable: W.sectArtChannelList().length
        };
    };
    console.log('[sect-art-channeling] 秘艺运功桥已架：门派功法参悟后可入运功三槽，本次注册招式 ' + moveRegCount + ' 门');
})();
