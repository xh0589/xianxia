// ==================== construct-undead-family.js (v27.19 - 敌人非人形部位族 · 构装/亡灵两册) ====================
// 主档模块②「部位族」续篇。v27.13 落了兽形族（beast-part-family.js：十五格+四笔裁决），
// 本文件按同一套范式落**构装族**与**亡灵族**两册——一文件两族，机制共用（路由/伤册/功能减档），
// 族表分立（格子的"身体"不一样，账不能混）。
//
// ── 设计依据（总档②新增-1 + v27.15 卷刃播报的接龙）─────────────────
//   「构装体的壳是吃刃的（对硬质部位，斩/刺武器吃亏）；换钝器砸壳、利刃切关节，才是对的打法」
//   ——卷刃（v27.15）落的是"武器侧的代价"，本族落"敌人侧的弱点"：同一句话的另一半。
//   弱点系数（双向明账，写死在表里）：
//     · 构装·躯壳：钝 ×1.3（壳怕震）/ 斩 ×0.7、刺 ×0.8（壳吃刃——卷刃的账在武器侧另算，不双扣）
//     · 构装·关节：斩 ×1.3、刺 ×1.2（关节缝薄，利刃切得进去）/ 钝 ×0.9（震不动铆钉）
//     · 亡灵·骨格通吃：钝 ×1.2（骨怕锤）、火 ×1.3（阴物怕火——damageType 'fire' 侧现有 5 处）
//
// ── 生死口径（刻意的保守——不碰四笔）───────────────────────────────
//   判死口径**一字不动**：构装/亡灵走 battle.js 现状统一判据（头/脑/胸/颈归零即死——
//   「石魔像是躯壳撑不住了」「骨散了」的现状语义照旧）。本族不学兽形 forceVitalZero 开窗
//   （兽形四笔是 TA 裁的窗口死，构装/亡灵没有这层裁决——没有裁决就不发明口径）。
//   要害池映射刻意避开判死名单之外的新增：core（枢座）→ abdomen（腹槽）——
//   枢座崩坏靠伤册危急（停机窗 6 轮，tickRound 消费），不走人形判死格。
//
// ── 接线约定（与兽形族同一把尺）─────────────────────────────────────
//   battle.js takeDamage：路由（构装/亡灵格 id→底层人形耐久槽）+弱点系数乘（in 弱点表）；
//   getAttack：构装关节/悬臂危急的功能减档（关节锁死 0.8·悬臂折断 0.85·枢座震损 0.9，叠乘封底 0.4）；
//   模块缺席/非构装/非亡灵＝原样放行（人形照旧，绝不拦战斗）。
(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    var VERSION = '27.19';

    // ============ 构装族六格（REVERSE：构装格 → 底层人形耐久槽） ============
    var CONSTRUCT_FAMILY = {
        flavor: { heavy: '甲片迸裂，铆钉崩飞', light: '壳上添了道白印' },
        parts: {
            shell:    { name: '躯壳', vital: '判死池', status: '在册',
                woundTable: { light: .55, heavy: .35, critical: .10 },
                critical: { name: '壳裂', fatal: false, rounds: 0, effect: '硬化充能层碎——再挨打就是干壳' } },
            core:     { name: '枢座', vital: '伤册危急', status: '在册',
                woundTable: { light: .20, heavy: .30, critical: .50 },
                critical: { name: '枢座崩坏', fatal: true, rounds: 6, effect: '符纹断续、灵光紊乱——停机窗口' } },
            joint_l:  { name: '左关节', vital: '功能', status: '在册',
                woundTable: { light: .45, heavy: .40, critical: .15 },
                critical: { name: '关节锁死', fatal: false, rounds: 0, effect: '左侧出劲失灵' } },
            joint_r:  { name: '右关节', vital: '功能', status: '在册',
                woundTable: { light: .45, heavy: .40, critical: .15 },
                critical: { name: '关节锁死', fatal: false, rounds: 0, effect: '右侧出劲失灵' } },
            arm_l:    { name: '左悬臂', vital: '功能', status: '在册',
                woundTable: { light: .50, heavy: .35, critical: .15 },
                critical: { name: '悬臂折断', fatal: false, rounds: 0, effect: '那条臂抡不动了' } },
            arm_r:    { name: '右悬臂', vital: '功能', status: '在册',
                woundTable: { light: .50, heavy: .35, critical: .15 },
                critical: { name: '悬臂折断', fatal: false, rounds: 0, effect: '那条臂抡不动了' } }
        }
    };
    var CONSTRUCT_REVERSE = {
        shell: 'chest',       // 躯壳→胸槽：归零即死（「躯壳撑不住」的现状口径，照旧）
        core: 'abdomen',      // 枢座→腹槽：避开人形判死名单——崩坏走伤册停机窗（6 轮）
        joint_l: 'forearmL', joint_r: 'forearmR',
        arm_l: 'upperArmL', arm_r: 'upperArmR'
    };
    // 玩家打过来的底层人形槽 → 构装格（要害池命中时反查记册）
    var CONSTRUCT_FROM_SLOT = {
        chest: 'shell', abdomen: 'core', waist: 'core',
        forearmL: 'joint_l', forearmR: 'joint_r',
        upperArmL: 'arm_l', upperArmR: 'arm_r',
        handL: 'joint_l', handR: 'joint_r'
    };
    // 弱点系数表（battle takeDamage 消费）：构装格 × damageType → 乘数
    var CONSTRUCT_WEAKNESS = {
        shell: { blunt: 1.3, slash: 0.7, pierce: 0.8 },
        joint_l: { slash: 1.3, pierce: 1.2, blunt: 0.9 },
        joint_r: { slash: 1.3, pierce: 1.2, blunt: 0.9 }
    };

    // ============ 亡灵族六骨格 ============
    var UNDEAD_FAMILY = {
        flavor: { heavy: '骨面崩开一线，磷火从缝里漏出来', light: '骨上多了一道刻痕' },
        parts: {
            skull:    { name: '颅骨', vital: '判死池', status: '在册',
                woundTable: { light: .50, heavy: .35, critical: .15 },
                critical: { name: '颅裂', fatal: true, rounds: 2, effect: '魂火在颅腔里晃——散得更快了' } },
            spine:    { name: '脊骨', vital: '功能', status: '在册',
                woundTable: { light: .45, heavy: .40, critical: .15 },
                critical: { name: '脊骨断折', fatal: false, rounds: 0, effect: '下半身拖地而行' } },
            ribcage:  { name: '肋骨笼', vital: '判死池', status: '在册',
                woundTable: { light: .50, heavy: .38, critical: .12 },
                critical: { name: '肋笼塌陷', fatal: true, rounds: 4, effect: '腔里的阴风散了架' } },
            arm_l:    { name: '左臂骨', vital: '功能', status: '在册',
                woundTable: { light: .55, heavy: .32, critical: .13 },
                critical: { name: '臂骨碎断', fatal: false, rounds: 0, effect: '爪子抓不动了' } },
            arm_r:    { name: '右臂骨', vital: '功能', status: '在册',
                woundTable: { light: .55, heavy: .32, critical: .13 },
                critical: { name: '臂骨碎断', fatal: false, rounds: 0, effect: '爪子抓不动了' } },
            pelvis:   { name: '盆骨', vital: '功能', status: '在册',
                woundTable: { light: .50, heavy: .35, critical: .15 },
                critical: { name: '盆骨散架', fatal: false, rounds: 0, effect: '一步三晃，站不太住' } }
        }
    };
    var UNDEAD_REVERSE = {
        skull: 'head',        // 颅骨→头槽：归零即死（统一判据现状，照旧）
        spine: 'waist',
        ribcage: 'chest',     // 肋笼→胸槽：归零即死（现状）
        arm_l: 'upperArmL', arm_r: 'upperArmR',
        pelvis: 'pelvis'
    };
    var UNDEAD_FROM_SLOT = {
        head: 'skull', brain: 'skull', jaw: 'skull',
        waist: 'spine', chest: 'ribcage', abdomen: 'ribcage',
        upperArmL: 'arm_l', upperArmR: 'arm_r',
        forearmL: 'arm_l', forearmR: 'arm_r',
        handL: 'arm_l', handR: 'arm_r',
        pelvis: 'pelvis'
    };
    // 亡灵弱点：骨格通吃钝 ×1.2、火 ×1.3（阴物怕火——damageType 'fire' 现有 5 处）
    var UNDEAD_WEAKNESS_MUL = { blunt: 1.2, fire: 1.3 };

    // ============ 共用机制（兽形族同款简版） ============
    var TIER_ORDER = { light: 1, heavy: 2, critical: 3 };

    function _physType(entity) {
        return String((entity && (entity.physiologyType || (entity.physiology && entity.physiology.type))) || '');
    }
    function isConstructForm(entity) { return _physType(entity) === 'construct'; }
    function isUndeadForm(entity) { return _physType(entity) === 'undead'; }

    function familyOf(entity) {
        if (isConstructForm(entity)) return { family: CONSTRUCT_FAMILY, reverse: CONSTRUCT_REVERSE, kind: '构装' };
        if (isUndeadForm(entity)) return { family: UNDEAD_FAMILY, reverse: UNDEAD_REVERSE, kind: '亡灵' };
        return null;
    }

    // 伤册（挂实体._cufLedger；兽形册同款：轻/重/危急只升不降+危急窗）
    function ensureLedger(entity) {
        if (!entity._cufLedger) {
            var f = familyOf(entity);
            if (!f) return null;
            entity._cufLedger = { kind: f.kind, notes: [], round: 0, parts: {} };
            var ids = Object.keys(f.family.parts);
            for (var i = 0; i < ids.length; i++) {
                entity._cufLedger.parts[ids[i]] = { tier: 'light', crit: null };
            }
        }
        return entity._cufLedger;
    }
    function pushNote(entity, text) {
        var led = entity && entity._cufLedger;
        if (!led) return;
        led.notes.push(text);
        if (led.notes.length > 8) led.notes.shift();
        try { if (entity && typeof entity.pushBattleNote === 'function') entity.pushBattleNote(text); } catch (e) {}
    }
    function drainNotes(entity) {
        var led = ensureLedger(entity);
        if (!led || !led.notes.length) return [];
        var out = led.notes.slice();
        led.notes.length = 0;
        return out;
    }

    // 路由：进来的格 id（构装/亡灵格名直传，或人形槽反查）
    function routeIncomingPart(entity, partId) {
        var f = familyOf(entity);
        if (!f) return null;
        // 族格名直传 → 映射底层槽
        if (f.family.parts[partId]) return { part: f.reverse[partId] || partId, familyPart: partId };
        // 人形槽 → 反查族格（记册用；表外槽原样放行）
        var from = (isConstructForm(entity) ? CONSTRUCT_FROM_SLOT : UNDEAD_FROM_SLOT)[partId] || null;
        return { part: partId, familyPart: from };
    }

    function partRatio(entity, familyPart) {
        try {
            var f = familyOf(entity);
            if (!f) return 1;
            var slot = f.reverse[familyPart];
            if (!slot || !entity.durabilities) return 1;
            var max = (entity.maxDurabilities && entity.maxDurabilities[slot]) || 100;
            var cur = entity.durabilities[slot];
            if (cur == null) return 1;
            return Math.max(0, cur / (max || 100));
        } catch (e) { return 1; }
    }

    function rollTier(w) {
        var r = Math.random();
        var acc = 0;
        var keys = ['light', 'heavy', 'critical'];
        for (var i = 0; i < keys.length; i++) {
            acc += (w && w[keys[i]]) || 0;
            if (r < acc) return keys[i];
        }
        return 'light';
    }

    // 记册：这一击按格掷档（只升不降；格摧毁顶到危急）
    function recordHit(entity, familyPart, actual, damageType) {
        var f = familyOf(entity);
        if (!f || !familyPart || !entity) return;
        var p = f.family.parts[familyPart];
        var led = ensureLedger(entity);
        if (!p || !led) return;
        var entry = led.parts[familyPart];
        if (!entry) return;
        if (actual == null || actual < 1) return;
        if (partRatio(entity, familyPart) <= 0) { markDestroyed(entity, familyPart); return; }
        var tier = rollTier(p.woundTable);
        if (TIER_ORDER[tier] <= TIER_ORDER[entry.tier]) return;
        entry.tier = tier;
        if (tier === 'critical') {
            entry.crit = { name: p.critical.name, rounds: p.critical.rounds || 0, fatal: !!p.critical.fatal };
            pushNote(entity, (p.critical.fatal && p.critical.rounds > 0)
                ? '💀 ' + (entity.name || '它') + '的' + p.name + '——' + p.critical.name + '！' + p.critical.effect + '（停机窗口 ' + p.critical.rounds + ' 轮）'
                : '⚠️ ' + (entity.name || '它') + '的' + p.name + '——' + p.critical.name + '。' + p.critical.effect);
        } else if (tier === 'heavy') {
            pushNote(entity, '🩸 ' + (entity.name || '它') + '的' + p.name + '受创——' + f.family.flavor.heavy + '。');
        }
    }

    function markDestroyed(entity, familyPart) {
        var f = familyOf(entity);
        if (!f || !familyPart) return null;
        var p = f.family.parts[familyPart];
        var led = ensureLedger(entity);
        var entry = led && led.parts[familyPart];
        if (!p || !entry) return null;
        var note = null;
        if (TIER_ORDER.critical > TIER_ORDER[entry.tier]) {
            entry.tier = 'critical';
            entry.crit = { name: p.critical.name, rounds: p.critical.rounds || 0, fatal: !!p.critical.fatal };
            note = '💀 ' + (entity.name || '它') + '的' + p.name + '被彻底摧毁——' + p.critical.name + '！' + p.critical.effect;
            pushNote(entity, note);
        }
        return note;
    }

    // 弱点系数（battle takeDamage 消费）：构装按格、亡灵通吃——不在表=1
    function weaknessMul(entity, familyPart, damageType) {
        try {
            if (!entity || !damageType) return 1;
            if (isConstructForm(entity)) {
                var w = (familyPart && CONSTRUCT_WEAKNESS[familyPart]) || null;
                return (w && w[damageType]) || 1;
            }
            if (isUndeadForm(entity)) {
                return UNDEAD_WEAKNESS_MUL[damageType] || 1;
            }
        } catch (e) {}
        return 1;
    }

    // 功能减档（getAttack 消费）：构装关节/悬臂/枢座危急在身，出劲按格降
    var CONSTRUCT_PENALTY = { joint_l: 0.8, joint_r: 0.8, arm_l: 0.85, arm_r: 0.85, core: 0.9 };
    var UNDEAD_PENALTY = { arm_l: 0.85, arm_r: 0.85, spine: 0.9, pelvis: 0.9 };
    function attackMul(entity) {
        try {
            var led = entity && entity._cufLedger;
            if (!led) return 1;
            var table = isConstructForm(entity) ? CONSTRUCT_PENALTY : (isUndeadForm(entity) ? UNDEAD_PENALTY : null);
            if (!table) return 1;
            var mul = 1;
            for (var k in table) {
                var entry = led.parts[k];
                if (entry && entry.tier === 'critical') mul *= table[k];
            }
            return Math.max(0.4, mul);
        } catch (e) { return 1; }
    }

    // 危急窗（构装枢座停机 6 轮/亡灵颅裂 2·肋笼 4）：每轮递减，到点气绝
    function tickRound(entity) {
        var led = entity && entity._cufLedger;
        if (!led) return false;
        var died = false;
        for (var k in led.parts) {
            var entry = led.parts[k];
            if (entry && entry.crit && entry.crit.fatal && entry.crit.rounds > 0) {
                entry.crit.rounds--;
                if (entry.crit.rounds <= 0) {
                    died = true;   // 窗口到点——停机/魂散（battle 侧读到 true 自行了结，生死口径仍在 battle）
                }
            }
        }
        return died;
    }

    // 侧栏数字账（兽形 renderBeastSideList 同款）：六格列表——格名/要害◆/伤标/百分比，点格出手。
    // SVG 不另配（构装/亡灵暂用人形图族上色——壳红即壳损，语义通；族专属 SVG 待外包图，列遗留）。
    var PART_ORDER = { construct: ['shell', 'core', 'joint_l', 'joint_r', 'arm_l', 'arm_r'], undead: ['skull', 'spine', 'ribcage', 'arm_l', 'arm_r', 'pelvis'] };
    function renderSideList(containerId, entity) {
        var box = document.getElementById(containerId);
        if (!box) return;
        var f = familyOf(entity);
        if (!f) return;
        var isC = isConstructForm(entity);
        var order = PART_ORDER[isC ? 'construct' : 'undead'];
        var led = ensureLedger(entity);
        var html = '<div style="display:flex;align-items:center;justify-content:space-between;margin:2px 2px 4px;">'
            + '<span style="font-size:11px;color:#9ca3af;letter-spacing:2px">' + (isC ? '构装册 · 六格（点格出手）' : '骨相册 · 六格（点格出手）') + '</span></div>';
        for (var i = 0; i < order.length; i++) {
            var id = order[i];
            var p = f.family.parts[id];
            if (!p) continue;
            var entry = led.parts[id];
            var ratio = partRatio(entity, id);
            var pct = Math.max(0, Math.round(ratio * 100));
            var color = ratio >= 0.8 ? '#22c55e' : ratio >= 0.3 ? '#FF851B' : '#ef4444';
            var vital = (p.vital === '要害' || p.critical.fatal) ? '◆' : '';
            var tierTxt = entry && entry.tier && entry.tier !== 'none' ? ({ light: '轻创', heavy: '重创', critical: '危急' })[entry.tier] : '';
            html += '<div class="battle-side-list-item" data-cp="' + id + '" onclick="battleAttackPart(\'' + id + '\')" style="cursor:pointer" '
                + 'title="' + p.name + ' · ' + (p.vital || '') + '">'
                + '<span class="battle-side-list-label">' + p.name + vital + (tierTxt ? ' <span style="color:#e0685a">' + tierTxt + '</span>' : '') + '</span>'
                + '<span class="battle-side-list-num" style="color:' + color + '">' + pct + '%</span></div>';
        }
        box.innerHTML = html;
    }

    // ============ 导出 ============
    window.ConstructUndeadFamily = {
        version: VERSION,
        CONSTRUCT_FAMILY: CONSTRUCT_FAMILY,
        UNDEAD_FAMILY: UNDEAD_FAMILY,
        isConstructForm: isConstructForm,
        isUndeadForm: isUndeadForm,
        familyOf: familyOf,
        routeIncomingPart: routeIncomingPart,
        ensureLedger: ensureLedger,
        recordHit: recordHit,
        markDestroyed: markDestroyed,
        weaknessMul: weaknessMul,
        attackMul: attackMul,
        tickRound: tickRound,
        drainNotes: drainNotes,
        renderSideList: renderSideList
    };
})();
