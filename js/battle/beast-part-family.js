// ==================== beast-part-family.js (v27.13 - 敌人非人形部位族 · 兽形伤势册) ====================
// 主档模块②「敌人非人形 SVG/部位族」终稿落地。依据：
//   · 外包兽身总图 BS-015（code.html，只读）：十五格 .part[data-id]，近/远同 data-id 异侧节点，
//     data-vital / data-status / data-dx / data-dy 一字不改（美术冻结）。
//   · 裁决稿二稿（示例-敌人部位族伤势UI.html，只读）：暗色转译色板、BEAST_FAMILY 十五格伤势表、
//     critical 窗口（割喉3轮/贯脊10轮/破肚6轮），以及待裁四笔的建议口径。TA 批「做」＝按建议口径落地。
//
// ── 四笔裁决的落法（逐笔对齐示例稿「裁决面板」）───────────────────────────
//   第一笔 头颅/脑——判死。按拟案：碎首窗口 4 轮、脑髓震损窗口 2 轮（woundTable 按稿 .50/.70）。
//   第二笔 胸廓——判死。按拟案第一支：「胸廓塌陷」窗口 12 轮（与 battle.js 人形判死名单里
//          本有 chest 一格的既有口径衔接；woundTable 按稿 .38）。
//   第三笔 咽喉名分——新立 throat 格（示例稿明笔：人形 neck 在兽身上斜在颈背，与「割断气脉」
//          的腹侧位置不同，故不沿用）。兽册账键用 throat，底层耐久账映射人形 neck 槽；
//          割喉窗口 3 轮按稿。
//   第四笔 妖丹——案 B：兽册不设丹格。BS-015 十五格是冻结终稿，案 A「需外包补画」无此依赖；
//          妖丹维持②搜刮/解剖的物品账（js/loot-system.js 侧，两不相干）。丹田位来攻经
//          反向映射记到腹格；底层 dantian 槽照旧吃伤，不触发任何妖丹语义。
//   四笔既裁，「待裁·赭金虚线」态整体退役：head/brain/chest 回归在册玉青，几何仍一字不改。
//
// ── 接线约定（承示例稿「数据结构面板」）────────────────────────────────
//   · data-id 即数据/热区/立绘三方共用键；远侧肢与近侧同 data-id——一律 querySelectorAll 取全，
//     记账合一（远/近同格一伤俱伤；底层耐久账镜像写入 L/R 两槽）。
//   · 人形 eyes 上色拆左右（app.js 两处既有特判）；兽册只有一枚眼——兽形走单格上色，
//     left/right 节点在兽图中不存在，人形拆分分支自然空转，互不污染。
//   · 兽形判定缺席＝人形照旧：本模块缺席/旧档无键/判定为假，全部调用点静默回落人形路径，
//     绝不拦战斗。
//   · 兽形伤势账是战斗实体上的运行时账（与既有 battle 伤势账同寿命：战斗不落盘、账不落盘），
//     不向 StateRegistry 加键，无升版问题；旧档载入后首场兽战从空账起算，零迁移。

(function () {
    'use strict';

    var VERSION = 'v27.13';

    // ---------- 十五格伤势表（BEAST_FAMILY，按示例稿移植；四笔已裁，pending 态删除） ----------
    var BEAST_FAMILY = {
        familyId: 'beast',
        label: '兽形',
        covers: '妖兽 · 野兽 · 灵禽走兽共用此族',
        artSheet: 'BS-015 通用四足 · 十五格（暗色转译）',
        rollRule: '命中即按该格 woundTable 加权掷档；同格档位只升不降；远/近同 data-id 一伤俱伤',
        flavor: { light: '皮肉擦挫', heavy: '皮开肉绽' },
        parts: {

            /* 第一笔已裁：头颅——判死，碎首窗口 4 轮（快过贯脊） */
            head: { name: '头颅', attr: 'constitution', vital: '要害', status: '在册',
                woundTable: { light: .15, heavy: .35, critical: .50 },
                critical: { name: '碎首', fatal: true, rounds: 4,
                    effect: '颅骨开裂——四轮内气绝，快过贯脊' } },

            /* 第一笔已裁：脑——判死，脑髓震损窗口 2 轮（全族最促） */
            brain: { name: '脑', attr: 'intelligence', vital: '要害', status: '在册',
                woundTable: { light: .08, heavy: .22, critical: .70 },
                critical: { name: '脑髓震损', fatal: true, rounds: 2,
                    effect: '神识中枢受创——两轮内气绝，全族最促' } },

            /* 功能伤：眼——闪避降档（受击判定放宽） */
            eyes: { name: '眼', attr: 'dexterity', vital: '—', status: '在册',
                woundTable: { light: .55, heavy: .35, critical: .10 },
                critical: { name: '眼瞳震碎', fatal: false, rounds: 0,
                    effect: '不致命：感知残缺，闪避降档——受击判定放宽（功能伤）' } },

            /* 功能伤：下颌——撕咬封禁（兽册现无咬合类招式机制，此flag先记后用） */
            jaw: { name: '下颌', attr: 'willpower', vital: '—', status: '在册',
                woundTable: { light: .48, heavy: .38, critical: .14 },
                critical: { name: '断颌', fatal: false, rounds: 0,
                    effect: '不致命：撕咬封禁——咬合类招式禁用，只余扑击、甩尾（功能伤）' } },

            /* 要害一：咽喉——新立 throat 格（第三笔已裁），割喉窗口 3 轮 */
            throat: { name: '咽喉', attr: 'constitution', vital: '要害', status: '提案',
                woundTable: { light: .12, heavy: .26, critical: .62 },
                critical: { name: '割喉', fatal: true, rounds: 3,
                    effect: '咽喉割裂、气脉断绝——救治窗口全族最短，三轮不济即毙命' } },

            /* 要害二：脊背——贯脊，瘫痪+窗口 10 轮 */
            spine: { name: '脊背', attr: 'constitution', vital: '要害', status: '提案',
                woundTable: { light: .18, heavy: .34, critical: .48 },
                critical: { name: '贯脊', fatal: true, rounds: 10,
                    effect: '脊梁洞穿、瘫痪倒地——周身失用、任凭处置；十轮内气血衰竭而亡' } },

            /* 第二笔已裁：胸廓——判死，胸廓塌陷窗口 12 轮（心肺受损） */
            chest: { name: '胸廓', attr: 'strength', vital: '要害', status: '在册',
                woundTable: { light: .20, heavy: .42, critical: .38 },
                critical: { name: '胸廓塌陷', fatal: true, rounds: 12,
                    effect: '肋笼凹陷、心肺受损——十二轮内气血衰竭而亡' } },

            /* 要害三：腹——破肚，流亡窗口 6 轮 */
            abdomen: { name: '腹', attr: 'constitution', vital: '要害', status: '在册',
                woundTable: { light: .22, heavy: .36, critical: .42 },
                critical: { name: '破肚', fatal: true, rounds: 6,
                    effect: '腹壁洞开、脏腑外流——气血奔泻，六轮内不封创即流亡' } },

            /* 功能伤：腰——扑击起势迟滞 */
            waist: { name: '腰（脊下软腰）', attr: 'dexterity', vital: '—', status: '在册',
                woundTable: { light: .42, heavy: .44, critical: .14 },
                critical: { name: '腰筋断裂', fatal: false, rounds: 0,
                    effect: '不致命：拧腰转身降档——扑击起势迟滞（功能伤）' } },

            /* 功能伤：臀——蹬地蹿跃降档 */
            haunch: { name: '臀（后腿根）', attr: 'strength', vital: '—', status: '提案',
                woundTable: { light: .40, heavy: .44, critical: .16 },
                critical: { name: '臀股撕裂', fatal: false, rounds: 0,
                    effect: '不致命：蹬地蹿跃降档——突进距离减半（功能伤）' } },

            /* 功能伤：尾——横扫封禁（兽册现无横扫类招式机制，此flag先记后用） */
            tail: { name: '尾', attr: 'dexterity', vital: '—', status: '提案',
                woundTable: { light: .72, heavy: .23, critical: .05 },
                critical: { name: '尾椎断折', fatal: false, rounds: 0,
                    effect: '不致命：平衡减益——转身发飘，横扫封禁（功能伤）' } },

            /* 功能伤：四肢四格——断肢，扑击/移速降档 */
            forelegUpper: { name: '前肢上段', attr: 'strength', vital: '—', status: '提案',
                woundTable: { light: .60, heavy: .32, critical: .08 },
                critical: { name: '前肩碎裂', fatal: false, rounds: 0,
                    effect: '不致命：该肢承重失力——扑击降档（断肢·功能伤）' } },
            forelegLower: { name: '前肢下段', attr: 'dexterity', vital: '—', status: '提案',
                woundTable: { light: .65, heavy: .28, critical: .07 },
                critical: { name: '前膝断折', fatal: false, rounds: 0,
                    effect: '不致命：该侧前肢失用——扑击、移速降档（断肢·功能伤）' } },
            hindlegUpper: { name: '后肢上段', attr: 'strength', vital: '—', status: '提案',
                woundTable: { light: .60, heavy: .32, critical: .08 },
                critical: { name: '后胯碎裂', fatal: false, rounds: 0,
                    effect: '不致命：蹬地失力——移速降档（断肢·功能伤）' } },
            hindlegLower: { name: '后肢下段', attr: 'constitution', vital: '—', status: '提案',
                woundTable: { light: .65, heavy: .28, critical: .07 },
                critical: { name: '后膝断折', fatal: false, rounds: 0,
                    effect: '不致命：该侧后肢失用——移速大降，跪地难起（断肢·功能伤）' } }
        }
    };

    var BEAST_PART_IDS = ['head', 'brain', 'eyes', 'jaw', 'throat', 'spine', 'chest', 'abdomen',
        'waist', 'haunch', 'tail', 'forelegUpper', 'forelegLower', 'hindlegUpper', 'hindlegLower'];

    var TIER_ORDER = { none: 0, light: 1, heavy: 2, critical: 3 };

    // ---------- 兽形格 → 底层人形耐久槽（战斗数学继续走既有 22 格账） ----------
    // 人形账没有「脊」「尾」格：脊背收敛到胸笼（人形账的脊拆在颈/胸/腰/盆，取躯干核一格承伤，
    // 兽格账仍按 throat/spine/… 各记各的）；尾根在臀，与 haunch 共用盆槽。
    var ROUTE = {
        head: ['head'],
        brain: ['brain'],
        eyes: ['eyes'],
        jaw: ['jaw'],
        throat: ['neck'],
        spine: ['chest'],
        chest: ['chest'],
        abdomen: ['abdomen'],
        waist: ['waist'],
        haunch: ['pelvis'],
        tail: ['pelvis'],
        forelegUpper: ['upperArmL', 'upperArmR'],
        forelegLower: ['forearmL', 'forearmR'],
        hindlegUpper: ['thighL', 'thighR'],
        hindlegLower: ['calfL', 'calfR']
    };

    // ---------- 底层人形槽 → 兽形格（人形 id 的散伤/溅射/队员兽攻进兽册，不漏账） ----------
    // dantian→abdomen（第四笔案 B：兽无丹格，丹田位来攻记到腹）；hand→forelegLower、
    // foot→hindlegLower（兽的爪掌/蹄掌并进腿下段记一格，承 BS-015 账本原文）。
    var REVERSE = {
        head: 'head', brain: 'brain', eyes: 'eyes', jaw: 'jaw',
        neck: 'throat', chest: 'chest', abdomen: 'abdomen', waist: 'waist',
        dantian: 'abdomen', pelvis: 'haunch',
        upperArmL: 'forelegUpper', upperArmR: 'forelegUpper',
        forearmL: 'forelegLower', forearmR: 'forelegLower',
        handL: 'forelegLower', handR: 'forelegLower',
        thighL: 'hindlegUpper', thighR: 'hindlegUpper',
        calfL: 'hindlegLower', calfR: 'hindlegLower',
        footL: 'hindlegLower', footR: 'hindlegLower'
    };

    // 人形判死名单（battle.js 938/checkDeath 的四格）→ 兽形格（要害池归零时强制危急用）
    var VITAL_POOL_TO_BEAST = { brain: 'brain', head: 'head', chest: 'chest', neck: 'throat' };

    // ---------- 出手方的功能伤减档（兽形攻出来时读） ----------
    var FUNCTIONAL_PENALTY = {
        waist: { dmgMul: 0.9 },        // 腰筋断裂：扑击起势迟滞
        haunch: { dmgMul: 0.85 },      // 臀股撕裂：突进距离减半
        forelegUpper: { dmgMul: 0.85 },// 前肩碎裂：扑击降档
        forelegLower: { dmgMul: 0.8 }, // 前膝断折：扑击、移速降档
        hindlegUpper: { dmgMul: 0.8 }, // 后胯碎裂：移速降档
        hindlegLower: { dmgMul: 0.75 } // 后膝断折：移速大降，跪地难起
    };
    var EYES_HIT_DELTA = -15;          // 眼瞳震碎：受击判定放宽（兽形出手命中减档）

    // 测试缝：冒烟桩测可注入固定随机源；游戏侧恒 Math.random
    var _rng = null;
    function rnd() { return _rng ? _rng() : Math.random(); }

    // ---------- 兽形判定：模板账 / 档位 / 生理类型，任一命中即为兽形 ----------
    var BEAST_TYPE_NAMES = { beast: 1, demon_beast: 1, boss_beast: 1 };
    function isBeastForm(entity) {
        if (!entity) return false;
        try {
            if (entity._beastTemplateId) return true;
            if (BEAST_TYPE_NAMES[entity._enemyType]) return true;
            if (entity.physiologyType === 'beast') return true;
            if (BEAST_TYPE_NAMES[entity.type]) return true;
            if (entity.physiology && entity.physiology.type === 'beast') return true;
        } catch (e) { /* 判定缺席＝人形照旧 */ }
        return false;
    }

    // ---------- 兽形账（实体上的运行时账；旧档无此键＝空账起算，零迁移） ----------
    function ensureLedger(entity) {
        if (!entity) return null;
        if (!entity._beastLedger || entity._beastLedger.v !== 1) {
            var parts = {};
            for (var i = 0; i < BEAST_PART_IDS.length; i++) {
                parts[BEAST_PART_IDS[i]] = { tier: 'none', crit: null };
            }
            entity._beastLedger = { v: 1, parts: parts, notes: [] };
        }
        return entity._beastLedger;
    }

    function pushNote(entity, text) {
        if (!text) return;
        var led = ensureLedger(entity);
        if (led && led.notes && led.notes.length < 20) led.notes.push(text);
    }

    function drainNotes(entity) {
        var led = entity && entity._beastLedger;
        if (!led || !led.notes || !led.notes.length) return '';
        var txt = led.notes.join('　');
        led.notes = [];
        return txt;
    }

    // ---------- 路由 ----------
    function routeIncomingPart(entity, partId) {
        if (partId && BEAST_PART_IDS.indexOf(partId) >= 0) {
            var slots = ROUTE[partId] || ['chest'];
            return { part: slots[0], beastPart: partId };
        }
        return { part: partId, beastPart: REVERSE[partId] || null };
    }
    function reversePart(slotId) { return REVERSE[slotId] || null; }

    // 远/近同格一伤俱伤：主槽走正常结算，其余镜像槽只扣耐久（不二次生成伤口/不触发要害复核）
    function mirrorTwin(entity, beastPartId, primarySlot, actual) {
        if (!entity || !entity.durabilities || !(actual >= 1)) return;
        var slots = ROUTE[beastPartId];
        if (!slots || slots.length < 2) return;
        for (var i = 0; i < slots.length; i++) {
            var s = slots[i];
            if (s === primarySlot) continue;
            if (entity.durabilities[s] == null) continue;
            entity.durabilities[s] = Math.max(0, entity.durabilities[s] - actual);
        }
    }

    // ---------- 兽形格显示耐久＝底层各槽比率取最小（远/近同格取最伤的一侧） ----------
    function partRatio(entity, beastPartId) {
        if (!entity || !entity.durabilities || !entity.maxDurabilities) return 1;
        var slots = ROUTE[beastPartId];
        if (!slots) return 1;
        var min = 1;
        for (var i = 0; i < slots.length; i++) {
            var s = slots[i];
            var cur = Number(entity.durabilities[s]);
            var max = Number(entity.maxDurabilities[s]);
            if (!isFinite(cur) || !isFinite(max) || max <= 0) continue;
            var r = Math.max(0, Math.min(1, cur / max));
            if (r < min) min = r;
        }
        return min;
    }

    // ---------- 掷档（按示例稿 rollTier；同格档位只升不降） ----------
    function rollTier(w) {
        var r = rnd();
        if (r < w.light) return 'light';
        if (r < w.light + w.heavy) return 'heavy';
        return 'critical';
    }

    function activateCritical(entry, partDef) {
        var c = partDef.critical;
        if (!c || entry.crit) return;
        if (c.fatal && c.rounds > 0) {
            entry.crit = { name: c.name, fatal: true, roundsLeft: c.rounds, roundsTotal: c.rounds };
        } else {
            entry.crit = { name: c.name, fatal: false, roundsLeft: null, roundsTotal: 0 };
        }
    }

    // 命中入账：掷档＋升级才改账记事（轻伤只记账不上播报，免刷屏；重伤/危急才出声）
    function recordHit(entity, beastPartId, actual, damageType) {
        var p = BEAST_FAMILY.parts[beastPartId];
        if (!p || !entity || !entity.isAlive) return;
        var led = ensureLedger(entity);
        var entry = led.parts[beastPartId];
        if (!entry) return;
        // 格已彻底摧毁（底层槽归零）：不重掷，账顶到危急并补危急态
        if (partRatio(entity, beastPartId) <= 0) {
            markDestroyed(entity, beastPartId);
            return;
        }
        var tier = rollTier(p.woundTable);
        if (TIER_ORDER[tier] <= TIER_ORDER[entry.tier]) return;   // 只升不降
        entry.tier = tier;
        if (tier === 'critical') {
            activateCritical(entry, p);
            var c = p.critical;
            if (c.fatal && c.rounds > 0) {
                pushNote(entity, '🩸 兽形伤势·危急——' + p.name + '：' + c.name + '！' + c.effect + '（气绝窗口 ' + c.rounds + ' 轮）');
            } else {
                pushNote(entity, '⚠️ 兽形伤势·功能伤——' + p.name + '：' + c.name + '。' + c.effect);
            }
        } else if (tier === 'heavy') {
            pushNote(entity, '🩸 兽形伤势·重伤——' + p.name + '：' + BEAST_FAMILY.flavor.heavy + '（皮开肉绽）');
        }
        // light：账上记档，播报从简
    }

    // 格归零（要害池或非要害格被彻底摧毁）：致命格强制危急开窗（窗口死，非即死——四笔已裁口径）
    function markDestroyed(entity, beastPartId) {
        var p = BEAST_FAMILY.parts[beastPartId];
        if (!p || !entity) return null;
        var led = ensureLedger(entity);
        var entry = led.parts[beastPartId];
        if (!entry) return null;
        var note = null;
        if (TIER_ORDER.critical > TIER_ORDER[entry.tier]) {
            entry.tier = 'critical';
            var wasNew = !entry.crit;
            activateCritical(entry, p);
            var c = p.critical;
            if (wasNew && c.fatal && c.rounds > 0) {
                note = '💀 ' + (entity.name || '兽') + ' 的' + p.name + '被彻底摧毁——' + c.name + '！（气绝窗口 ' + c.rounds + ' 轮）';
            } else if (wasNew) {
                note = '⚠️ ' + (entity.name || '兽') + ' 的' + p.name + '被彻底摧毁——' + (c ? c.name : '失用') + '。';
            }
        }
        if (note) pushNote(entity, note);
        return note;
    }

    // battle.js 938/checkDeath 的要害池归零 → 兽形改判「窗口死」（人形照旧即死）
    function forceVitalZero(entity, poolSlotId, hitBeastPart) {
        var id = hitBeastPart || VITAL_POOL_TO_BEAST[poolSlotId] || REVERSE[poolSlotId];
        if (!id) return null;
        return markDestroyed(entity, id);
    }

    // ---------- 回合边界：致命危急窗口倒计时；到点气绝判死 ----------
    function tickRound(entity) {
        if (!entity || !entity.isAlive) return '';
        var led = entity._beastLedger;
        if (!led) return '';
        var lines = [];
        for (var i = 0; i < BEAST_PART_IDS.length; i++) {
            var id = BEAST_PART_IDS[i];
            var entry = led.parts[id];
            if (!entry || !entry.crit || !entry.crit.fatal || entry.crit.roundsLeft == null) continue;
            if (entry.crit.roundsLeft <= 0) continue;
            entry.crit.roundsLeft -= 1;
            var p = BEAST_FAMILY.parts[id];
            if (entry.crit.roundsLeft <= 0) {
                entry.crit.roundsLeft = 0;
                entity.isAlive = false;
                entity.deathCause = 'beastCritical:' + id;   // UI-15 同律：哪一格判的死，就地记名
                lines.push('💀 ' + (entity.name || '兽') + (p ? '的' + p.name : '') + '创发不治（' + entry.crit.name + '）——气绝身亡！');
            } else {
                lines.push('⏳ ' + (entity.name || '兽') + (p ? '的' + p.name : '') + '伤势恶化（' + entry.crit.name + '，余 ' + entry.crit.roundsLeft + ' 轮）');
            }
        }
        return lines.join('　');
    }

    // 贯脊瘫痪：脊背致命危急在身，兽主瘫倒难起（跳过其出手）
    function isParalyzed(entity) {
        var led = entity && entity._beastLedger;
        if (!led) return false;
        var entry = led.parts.spine;
        return !!(entry && entry.crit && entry.crit.fatal && entry.crit.roundsLeft != null);
    }

    // ---------- 兽形出手方的功能伤减档 ----------
    function attackerPenalty(entity) {
        var led = entity && entity._beastLedger;
        if (!led) return null;
        var hitDelta = 0;
        var mul = 1;
        for (var i = 0; i < BEAST_PART_IDS.length; i++) {
            var id = BEAST_PART_IDS[i];
            var entry = led.parts[id];
            if (!entry || !entry.crit) continue;
            if (id === 'eyes' && entry.crit.name === '眼瞳震碎') hitDelta += EYES_HIT_DELTA;
            var fp = FUNCTIONAL_PENALTY[id];
            if (fp && entry.crit.name === BEAST_FAMILY.parts[id].critical.name) mul *= fp.dmgMul;
        }
        if (!hitDelta && mul === 1) return null;
        return { hitDelta: hitDelta, dmgMul: Math.max(0.4, mul) };
    }
    function attackMul(entity) {
        var pen = attackerPenalty(entity);
        return pen ? pen.dmgMul : 1;
    }

    // ============================================================
    //  立绘：BS-015 暗色转译（几何与 data-* 一字不改；id 只加不改）
    //  近群带 id="enemy-<格id>"（人形上色路径若误至，eyes 特判的基础 id 也能着色）；
    //  远群不加 id（同格异侧，避免同文档重 id），一律以 data-id 取全。
    // ============================================================
    var SVG_OPEN = '<svg id="enemy-body-svg" data-beast="1" class="beast-svg mode-status" viewBox="120 50 820 570" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="通用四足兽的部位切割图，十五个部位，四足对角步站姿">'
        + '<style>'
        + '#enemy-body-svg .part-body{fill:#3a6157;stroke:#0a0d11;stroke-width:2.5;stroke-linejoin:round}'
        + '#enemy-body-svg .part-body.far{fill:#2b4841}'
        + '#enemy-body-svg .label{font-family:"Microsoft YaHei","PingFang SC",sans-serif;font-size:12px;font-weight:600;fill:#ece5d2;text-anchor:middle;paint-order:stroke;stroke:#0a0d11;stroke-width:3px;pointer-events:none}'
        + '#enemy-body-svg .label.small{font-size:9.5px}'
        + '#enemy-body-svg .label.tiny{font-size:8.5px}'
        + '#enemy-body-svg .ground{stroke:#3d4557;stroke-width:1;stroke-dasharray:7 6;opacity:.6}'
        + '#enemy-body-svg .note{font-size:12px;fill:#6d7688;letter-spacing:2px}'
        // 底色按稿：要害＝暗朱砂；提案/在册＝浅玉/玉青。四笔已裁，head/brain/chest（data-vital="待裁"）
        // 不再吃赭金虚线态——不匹配任何底色规则，自然回落玉青本底。
        + '#enemy-body-svg.mode-status .part[data-vital="要害"] .part-body{fill:#7a3a2f}'
        + '#enemy-body-svg.mode-status .part[data-vital="—"][data-status="提案"] .part-body{fill:#4e6d63}'
        + '#enemy-body-svg.mode-status .part[data-vital="—"][data-status="在册"] .part-body{fill:#3a6157}'
        + '#enemy-body-svg.mode-status .part-body.far{fill:#2b4841}'
        + '#enemy-body-svg.mode-status .part[data-vital="—"][data-status="提案"] .part-body.far{fill:#3a544c}'
        // 交互态与伤势着色（伤势 !important 压过底色）
        + '#enemy-body-svg .part{cursor:pointer;transition:transform .25s ease}'
        + '#enemy-body-svg .part:hover .part-body{filter:brightness(1.18) saturate(1.08)}'
        + '#enemy-body-svg .part.hl .part-body{filter:brightness(1.18) saturate(1.08)}'
        + '#enemy-body-svg .part.selected .part-body{stroke:#d8b878;stroke-width:3.5;filter:brightness(1.1) saturate(1.12)}'
        + '#enemy-body-svg .part.w-light .part-body{fill:#565a3d!important;stroke:#a8a46e!important}'
        + '#enemy-body-svg .part.w-heavy .part-body{fill:#6d4a26!important;stroke:#c9975a!important}'
        + '#enemy-body-svg .part.w-crit .part-body{fill:#7c2f27!important;stroke:#d4574a!important}'
        + '#enemy-body-svg .part.w-fatal .part-body{animation:beastcritpulse 1.15s ease-in-out infinite}'
        + '@keyframes beastcritpulse{50%{filter:brightness(1.4) saturate(1.15)}}'
        + '</style>';

    var SVG_PARTS =
        // 远侧肢体（同格异侧，垫底）
        '<g class="part" data-id="hindlegUpper" data-vital="—" data-status="提案" data-dx="45" data-dy="35">'
        + '<path class="part-body far" d="M 594,372 C 628,377 664,381 700,385 C 690,420 679,455 666,488 C 646,492 626,492 608,488 C 602,449 597,410 594,372 Z"/></g>'
        + '<g class="part" data-id="hindlegLower" data-vital="—" data-status="提案" data-dx="65" data-dy="95">'
        + '<path class="part-body far" d="M 608,488 C 626,492 646,492 666,488 C 663,508 660,528 658,546 L 658,556 Q 658,594 646,594 L 622,594 Q 610,594 610,556 L 610,546 C 608,528 606,508 608,488 Z"/></g>'
        + '<g class="part" data-id="forelegLower" data-vital="—" data-status="提案" data-dx="-50" data-dy="95">'
        + '<path class="part-body far" d="M 444,402 C 464,406 484,410 502,414 C 498,438 494,462 491,486 C 489,508 488,528 488,546 L 488,556 Q 488,594 476,594 L 452,594 Q 440,594 440,556 L 440,546 C 439,524 437,500 434,476 C 430,450 426,424 424,410 C 430,405 436,402 444,402 Z"/></g>'
        // 尾
        + '<g class="part" id="enemy-tail" data-id="tail" data-vital="—" data-status="提案" data-dx="55" data-dy="-50">'
        + '<path class="part-body" d="M 752,178 C 804,164 860,142 908,108 C 911,111 909,115 904,116 C 854,156 810,180 760,208 C 759,198 756,188 752,178 Z"/>'
        + '<text class="label" x="838" y="160" transform="rotate(-17 838 160)">尾</text></g>'
        // 脊背
        + '<g class="part" id="enemy-spine" data-id="spine" data-vital="要害" data-status="提案" data-dx="0" data-dy="-60">'
        + '<path class="part-body" d="M 316,156 C 342,160 372,163 402,165 C 452,168 508,170 560,171 C 608,171 656,172 700,170 C 720,169 738,173 752,178 C 756,188 759,198 760,208 C 757,228 753,248 748,266 C 716,264 682,263 650,264 C 618,265 586,267 556,268 C 506,269 456,271 410,274 C 376,236 344,196 316,156 Z"/>'
        + '<text class="label" x="545" y="218">脊背◆</text></g>'
        // 臀
        + '<g class="part" id="enemy-haunch" data-id="haunch" data-vital="—" data-status="提案" data-dx="60" data-dy="-15">'
        + '<path class="part-body" d="M 650,264 C 682,263 716,264 748,266 C 753,248 757,228 760,208 C 764,244 766,270 762,298 C 758,330 748,360 736,390 C 712,391 684,391 656,390 C 656,382 655,374 655,366 C 654,348 652,306 650,264 Z"/>'
        + '<text class="label" x="704" y="318">臀</text></g>'
        // 近侧后肢
        + '<g class="part" id="enemy-hindlegUpper" data-id="hindlegUpper" data-vital="—" data-status="提案" data-dx="45" data-dy="35">'
        + '<path class="part-body" d="M 656,390 C 684,391 712,391 736,390 C 733,422 729,456 725,488 C 705,492 685,492 669,490 C 663,456 659,422 656,390 Z"/>'
        + '<text class="label small" x="696" y="438">后肢上段</text></g>'
        + '<g class="part" id="enemy-hindlegLower" data-id="hindlegLower" data-vital="—" data-status="提案" data-dx="65" data-dy="95">'
        + '<path class="part-body" d="M 669,490 C 685,492 705,492 725,488 C 723,508 721,528 720,548 L 720,556 Q 720,594 707,594 L 687,594 Q 675,594 675,556 L 675,548 C 673,528 671,508 669,490 Z"/>'
        + '<text class="label small" x="700" y="542" transform="rotate(-90 700 542)">后肢下段</text></g>'
        // 躯干三格
        + '<g class="part" id="enemy-chest" data-id="chest" data-vital="待裁" data-status="在册" data-dx="-20" data-dy="20">'
        + '<path class="part-body" d="M 410,274 C 456,271 506,269 556,268 C 557,318 558,374 558,428 C 546,430 530,431 514,430 C 490,428 468,421 446,410 C 434,364 422,318 410,274 Z"/>'
        + '<text class="label" x="484" y="346">胸廓</text></g>'
        + '<g class="part" id="enemy-abdomen" data-id="abdomen" data-vital="要害" data-status="在册" data-dx="5" data-dy="55">'
        + '<path class="part-body" d="M 559,366 C 590,366 622,366 655,366 C 655,374 656,382 656,390 C 632,402 596,418 558,428 C 558,408 558,386 559,366 Z"/>'
        + '<text class="label" x="602" y="390">腹◆</text></g>'
        + '<g class="part" id="enemy-waist" data-id="waist" data-vital="—" data-status="在册" data-dx="40" data-dy="15">'
        + '<path class="part-body" d="M 556,268 C 586,267 618,265 650,264 C 652,306 654,348 655,366 C 622,366 590,366 559,366 C 557,332 556,298 556,268 Z"/>'
        + '<text class="label" x="602" y="314">腰</text></g>'
        // 近侧前肢
        + '<g class="part" id="enemy-forelegUpper" data-id="forelegUpper" data-vital="—" data-status="提案" data-dx="-35" data-dy="50">'
        + '<path class="part-body" d="M 410,274 C 398,314 386,356 376,398 C 400,402 424,407 446,410 C 434,364 422,318 410,274 Z"/>'
        + '<text class="label small" x="404" y="330">前肢<tspan x="404" dy="12">上段</tspan></text></g>'
        + '<g class="part" id="enemy-forelegLower" data-id="forelegLower" data-vital="—" data-status="提案" data-dx="-50" data-dy="95">'
        + '<path class="part-body" d="M 376,398 C 400,402 424,407 446,410 C 442,440 438,472 434,504 C 432,524 432,540 432,552 L 432,556 Q 432,594 418,594 L 394,594 Q 380,594 380,556 L 380,545 C 379,496 377,447 376,398 Z"/>'
        + '<text class="label small" x="401" y="500" transform="rotate(-90 401 500)">前肢下段</text></g>'
        // 咽喉
        + '<g class="part" id="enemy-throat" data-id="throat" data-vital="要害" data-status="提案" data-dx="-15" data-dy="45">'
        + '<path class="part-body" d="M 316,156 C 300,172 280,188 258,202 C 257,214 256,226 256,236 C 288,278 330,338 376,398 C 382,356 394,314 410,274 C 376,236 344,196 316,156 Z"/>'
        + '<text class="label" x="340" y="294">咽喉◆</text></g>'
        // 头
        + '<g class="part" id="enemy-head" data-id="head" data-vital="待裁" data-status="在册" data-dx="-55" data-dy="-40">'
        + '<path class="part-body" d="M 134,162 C 148,152 180,140 216,130 C 224,126 232,121 242,114 C 250,109 258,107 264,108 C 272,106 280,104 288,102 C 294,90 302,78 310,72 C 314,68 320,70 321,77 C 323,89 325,100 326,109 C 333,101 340,93 346,89 C 351,86 356,90 357,97 C 358,106 356,114 352,121 C 344,134 332,147 316,156 C 300,172 280,188 258,202 C 224,194 186,186 142,176 C 136,174 134,169 134,162 Z"/>'
        + '<text class="label" x="244" y="184">头颅</text></g>'
        // 下颌
        + '<g class="part" id="enemy-jaw" data-id="jaw" data-vital="—" data-status="在册" data-dx="-40" data-dy="30">'
        + '<path class="part-body" d="M 142,176 C 186,186 224,194 258,202 C 257,214 256,226 256,236 C 224,225 184,208 146,192 C 140,188 139,181 142,176 Z"/>'
        + '<text class="label small" x="226" y="212">下颌</text></g>'
        // 脑
        + '<g class="part" id="enemy-brain" data-id="brain" data-vital="待裁" data-status="在册" data-dx="-90" data-dy="-75">'
        + '<ellipse class="part-body" cx="272" cy="150" rx="24" ry="17"/>'
        + '<text class="label tiny" x="272" y="154">脑</text></g>'
        // 眼（兽册单眼——近侧一枚，远侧被头挡住不画）
        + '<g class="part" id="enemy-eyes" data-id="eyes" data-vital="—" data-status="在册" data-dx="-70" data-dy="-20">'
        + '<path class="part-body" d="M 190,163 C 197,154 211,154 218,162 C 212,170 197,171 190,163 Z"/>'
        + '<circle cx="204" cy="163" r="4" fill="#0a0d11" stroke="none"/>'
        + '<circle cx="202" cy="161" r="1.3" fill="#f2ecd9" stroke="none"/>'
        + '<text class="label tiny" x="204" y="149">眼</text></g>';

    var SVG_CLOSE = '</svg>';

    function buildBeastSvgString() {
        return SVG_OPEN + '<line class="ground" x1="350" y1="595" x2="795" y2="595"/>'
            + '<text class="note" x="925" y="70" text-anchor="end">侧视 · 近侧玉青／远侧灰玉 · 对角步</text>'
            + SVG_PARTS + SVG_CLOSE;
    }

    // ---------- 渲染进敌栏（已有兽图则只重上色；人形图在场则顶掉） ----------
    function renderEnemySvg(container, enemy) {
        if (!container) return null;
        var old = container.querySelector ? container.querySelector('#enemy-body-svg') : null;
        if (old && old.getAttribute && old.getAttribute('data-beast') === '1') {
            paintEnemySvg(enemy);
            return 'beast-repaint';
        }
        container.innerHTML = buildBeastSvgString();
        var svg = container.querySelector('#enemy-body-svg');
        if (svg) wireInteractions(svg);
        paintEnemySvg(enemy);
        return 'beast-rendered';
    }

    function wireInteractions(svg) {
        // 点格＝点一处部位即出手（沿用既有两步出手：先挑招式、后点部位）；悬停远/近同格一起亮
        svg.addEventListener('click', function (e) {
            var g = e.target && e.target.closest ? e.target.closest('.part') : null;
            var all = svg.querySelectorAll('.part.selected');
            for (var i = 0; i < all.length; i++) all[i].classList.remove('selected');
            if (!g) return;
            var id = g.getAttribute('data-id');
            var grp = svg.querySelectorAll('.part[data-id="' + id + '"]');
            for (var j = 0; j < grp.length; j++) grp[j].classList.add('selected');
            if (typeof window.battleAttackPart === 'function') {
                try { window.battleAttackPart(id); } catch (eA) { /* 出手失败不拦看图 */ }
            }
        });
        svg.addEventListener('mouseover', function (e) {
            var g = e.target && e.target.closest ? e.target.closest('.part') : null;
            if (!g) return;
            var grp = svg.querySelectorAll('.part[data-id="' + g.getAttribute('data-id') + '"]');
            for (var i = 0; i < grp.length; i++) grp[i].classList.add('hl');
        });
        svg.addEventListener('mouseout', function (e) {
            var g = e.target && e.target.closest ? e.target.closest('.part') : null;
            if (!g) return;
            var grp = svg.querySelectorAll('.part[data-id="' + g.getAttribute('data-id') + '"]');
            for (var i = 0; i < grp.length; i++) grp[i].classList.remove('hl');
        });
    }

    // ---------- 上色：以 data-id 取全（远/近同格一伤俱伤），档位决定类名 ----------
    var TIER_CLASS = { light: 'w-light', heavy: 'w-heavy', critical: 'w-crit' };
    function paintEnemySvg(entity) {
        var svg = document.getElementById('enemy-body-svg');
        if (!svg || !svg.getAttribute || svg.getAttribute('data-beast') !== '1') return;
        var led = entity && entity._beastLedger;
        for (var i = 0; i < BEAST_PART_IDS.length; i++) {
            var id = BEAST_PART_IDS[i];
            var grp = svg.querySelectorAll('.part[data-id="' + id + '"]');
            if (!grp.length) continue;
            var entry = led ? led.parts[id] : null;
            var cls = ['part'];
            if (entry && TIER_CLASS[entry.tier]) cls.push(TIER_CLASS[entry.tier]);
            if (entry && entry.crit && entry.crit.fatal && entry.crit.roundsLeft != null) cls.push('w-fatal');
            for (var g = 0; g < grp.length; g++) {
                // 保留 selected/hl（交互态），只重置伤势类
                var keep = [];
                if (grp[g].classList.contains('selected')) keep.push('selected');
                if (grp[g].classList.contains('hl')) keep.push('hl');
                grp[g].setAttribute('class', cls.concat(keep).join(' '));
            }
        }
    }

    // ---------- 爆开（data-dx/dy 照稿；战斗面板空间有限，固定 45% 档，悬停+点锁仍在） ----------
    var EXPLODE_K = 0.45;
    function setExplode(on) {
        var svg = document.getElementById('enemy-body-svg');
        if (!svg) return;
        var grp = svg.querySelectorAll('.part');
        for (var i = 0; i < grp.length; i++) {
            var g = grp[i];
            if (on) {
                var dx = Number(g.getAttribute('data-dx')) || 0;
                var dy = Number(g.getAttribute('data-dy')) || 0;
                g.style.transform = 'translate(' + (dx * EXPLODE_K) + 'px,' + (dy * EXPLODE_K) + 'px)';
            } else {
                g.style.transform = '';
            }
        }
        svg.setAttribute('data-exploded', on ? '1' : '0');
    }
    function toggleExplode() {
        var svg = document.getElementById('enemy-body-svg');
        if (!svg) return;
        setExplode(svg.getAttribute('data-exploded') !== '1');
    }

    // ---------- 栏底兽册数字账（十五格；点行即出手；带分离检视钮） ----------
    function tierText(entry) {
        if (!entry || entry.tier === 'none') return '无';
        if (entry.tier === 'light') return '轻伤';
        if (entry.tier === 'heavy') return '重伤';
        var c = entry.crit;
        if (!c) return '危急';
        if (c.fatal && c.roundsLeft != null) return '危急·' + c.name + '（余' + c.roundsLeft + '轮）';
        return '危急·' + c.name + '（功能伤）';
    }
    function renderBeastSideList(containerId, entity) {
        var box = document.getElementById(containerId);
        if (!box) return;
        var led = ensureLedger(entity);
        var html = '<div style="display:flex;align-items:center;justify-content:space-between;margin:2px 2px 4px;">'
            + '<span style="font-size:11px;color:#9ca3af;letter-spacing:2px">兽册 · 一十五格（点格出手）</span>'
            + '<button onclick="BeastPartFamily.toggleExplode()" title="按 data-dx/dy 爆开检视（45% 档）" '
            + 'style="font-size:10px;padding:1px 6px;border:1px solid #4b5563;border-radius:4px;background:#1f2937;color:#d1d5db;cursor:pointer">🔎 分离</button>'
            + '</div>';
        for (var i = 0; i < BEAST_PART_IDS.length; i++) {
            var id = BEAST_PART_IDS[i];
            var p = BEAST_FAMILY.parts[id];
            var entry = led.parts[id];
            var ratio = partRatio(entity, id);
            var pct = Math.round(ratio * 100);
            var color = ratio >= 0.8 ? '#22c55e' : ratio >= 0.3 ? '#FF851B' : '#ef4444';
            var vital = p.vital === '要害' ? '◆' : '';
            html += '<div class="battle-side-list-item beast-row" data-bp="' + id
                + '" onclick="battleAttackPart(\'' + id + '\')" style="cursor:pointer" '
                + 'title="' + p.name + ' · ' + (p.vital === '要害' ? '要害' : '常格') + ' · ' + p.attr + '">'
                + '<span class="battle-side-list-label">' + p.name + vital
                + (entry && entry.tier !== 'none' ? ' <span style="color:#e0685a">' + tierText(entry) + '</span>' : '')
                + '</span>'
                + '<span class="battle-side-list-num" style="color:' + color + '">' + pct + '%</span></div>';
        }
        box.innerHTML = html;
    }

    // ---------- 导出 ----------
    window.BeastPartFamily = {
        version: VERSION,
        BEAST_FAMILY: BEAST_FAMILY,
        BEAST_PART_IDS: BEAST_PART_IDS,
        isBeastForm: isBeastForm,
        ensureLedger: ensureLedger,
        routeIncomingPart: routeIncomingPart,
        reversePart: reversePart,
        mirrorTwin: mirrorTwin,
        partRatio: partRatio,
        recordHit: recordHit,
        markDestroyed: markDestroyed,
        forceVitalZero: forceVitalZero,
        tickRound: tickRound,
        isParalyzed: isParalyzed,
        attackerPenalty: attackerPenalty,
        attackMul: attackMul,
        drainNotes: drainNotes,
        buildBeastSvgString: buildBeastSvgString,
        renderEnemySvg: renderEnemySvg,
        paintEnemySvg: paintEnemySvg,
        renderBeastSideList: renderBeastSideList,
        setExplode: setExplode,
        toggleExplode: toggleExplode,
        // 测试缝（冒烟桩测注入固定随机源；游戏侧不用）
        _setRng: function (fn) { _rng = fn; }
    };
})();
