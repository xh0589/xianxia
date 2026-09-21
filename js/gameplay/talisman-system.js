/**
 * talisman-system.js — 符箓效果边界（v12.1 / v21.9 全线实装）
 * v21.9：17 张 implemented:false 的符箓与门派特产陷阱/毒药全部接上真实效果——
 * 攻击符直伤敌人、定身/冰封让敌人跳过回合、沉默封技、隐身强制闪避、破甲加穿透、
 * 复活符致命伤自动抵消一次、天师符 N 次完全免伤、乾坤符满状态逆转、毒药持续掉血。
 * 目标：物品只有在效果真正成功后才被消耗，战斗加成集中管理。
 */
(function(global) {
    'use strict';

    var state = {
        combatBonuses: {},      // { attack, defense, speed ... }
        bonusActionsLeft: 0,
        shield: 0,
        escapeBonus: 0,
        // ===== v21.9 新增状态 =====
        enemySkipTurns: [],     // 定身/冰封/乾坤：[{icon, text}] 每条让敌人跳过一回合
        enemySilenceTurns: 0,   // 沉默符：>0 期间敌人绝技全部封印
        enemyPoison: null,      // 毒药：{turns, dmg} 敌人回合开始结算
        enemyBlindTurns: 0,     // 第九十三波·迷烟散：>0 期间敌主命中 -30（石灰糊眼，招式失准）
        invisHits: 0,           // 隐身符：接下来 N 次敌人攻击必落空
        penetrateBonus: 0,      // 破甲符：穿透加成
        penetrateTurns: 0,
        reviveCharges: 0,       // 复活符：致命伤自动抵消次数
        divineHits: 0           // 天师符：完全免伤次数
    };

    function msg(text, type) {
        if (typeof global.showMessage === 'function') global.showMessage(text, type || 'info');
        else if (typeof console !== 'undefined') console.log(text);
    }

    function inBattle() {
        var b = global.currentBattle;
        return !!(b && !b.isFinished && b.enemy && b.enemy.isAlive);
    }

    function apply(template) {
        if (!template || !template.effect) return false;
        var eff = template.effect;
        var applied = false;
        var duration = Math.max(1, Math.floor(Number(eff.duration) || 3));

        // ===== 第九十一波 · 行囊动作也是动作 =====
        // 进攻类家什（直伤/毒/控制/隐身/乾坤）只能在自己回合用，用了这一回合就过去——
        // 与医疗动作同一本回合经济。此前它们既不挑时机也不耗回合：敌人刀还在半空，
        // 你慢悠悠翻行囊掷暗器，有多少掷多少（白嫖账）。护体/增益类符是战前功课，不在此列。
        var _battle91 = inBattle() ? global.currentBattle : null;
        var _turnCosting = !!(eff.attack_damage || eff.poison_enemy || eff.blind_enemy || eff.ash_enemy || eff.trip_enemy || eff.stun || eff.freeze || eff.silence || eff.invisibility || eff.twist_fate);
        if (_turnCosting && _battle91 && typeof _battle91.canUseBattleItem === 'function' && !_battle91.canUseBattleItem()) {
            msg('敌人的刀还在半空——你这会儿腾不出手翻行囊（进攻类家什只在自己回合用得出来）。', 'warning');
            return false;   // 不生效：家什不白耗
        }

        // ===== v21.9 攻击符/爆裂符/暗器：战斗中对当前敌人直接结算符力伤害 =====
        if (eff.attack_damage) {
            var battle = global.currentBattle;
            if (!inBattle()) {
                msg('📜 ' + template.name + '没有目标可掷——攻击类符箓只能在战斗中使用。', 'warning');
                return false; // 不生效：符不白烧
            }
            var dmg = Math.max(1, Math.floor(Number(eff.attack_damage) || 0));
            var elemNames = { fire: '烈焰', ice: '寒冰', wind: '风刃', thunder: '雷霆', all: '五行' };
            var elemName = elemNames[eff.element] || '符力';
            var actual = dmg;
            try {
                var got = battle.enemy.takeDamage('chest', dmg, 'spell');
                if (typeof got === 'number' && isFinite(got)) actual = got;
            } catch (e) {
                if (battle.enemy.health != null) {
                    battle.enemy.health = Math.max(0, battle.enemy.health - dmg);
                    if (battle.enemy.health <= 0) battle.enemy.isAlive = false;
                }
            }
            battle.log.push({ msg: '📜 ' + template.name + '应声而绽，' + elemName + '撞进 ' + battle.enemy.name + ' 胸口——造成 ' + actual + ' 点伤害！' });
            msg('📜 ' + template.name + '掷出，' + elemName + '炸开！（' + actual + ' 点伤害）', 'success');
            applied = true;
            try { battle._checkEnd(); } catch (e) {}
            if (typeof global.updateBattleUI === 'function') { try { global.updateBattleUI(); } catch (e) {} }
        }

        if (eff.attack_boost) {
            state.combatBonuses.attack = Math.max(Number(state.combatBonuses.attack) || 0, Number(eff.attack_boost) || 0);
            state.bonusActionsLeft = Math.max(state.bonusActionsLeft, duration);
            msg('📜 ' + template.name + '生效：攻击 +' + eff.attack_boost + '（' + duration + '次攻击）', 'success');
            applied = true;
        }
        if (eff.defense_boost) {
            state.combatBonuses.defense = Math.max(Number(state.combatBonuses.defense) || 0, Number(eff.defense_boost) || 0);
            state.bonusActionsLeft = Math.max(state.bonusActionsLeft, duration);
            msg('📜 ' + template.name + '生效：防御 +' + eff.defense_boost + '（' + duration + '次攻击）', 'success');
            applied = true;
        }
        if (eff.speed_boost) {
            state.combatBonuses.speed = Math.max(Number(state.combatBonuses.speed) || 0, Number(eff.speed_boost) || 0);
            state.bonusActionsLeft = Math.max(state.bonusActionsLeft, duration);
            msg('📜 ' + template.name + '生效：速度 +' + eff.speed_boost, 'success');
            applied = true;
        }
        if (eff.shield) {
            // 护盾按“可吸收总伤害”结算，比固定防御更易控强度。
            state.shield = Math.min(300, Math.max(state.shield, Number(eff.shield) || 0));
            msg('🛡️ ' + template.name + '展开护盾，可吸收 ' + state.shield + ' 点伤害', 'success');
            applied = true;
        }
        if (eff.cleanse) {
            var removed = cleansePlayer();
            msg(removed > 0 ? ('✨ 净化完成，移除 ' + removed + ' 个负面状态') : '✨ 灵台清明，当前没有可净化的负面状态', 'success');
            applied = true;
        }
        if (eff.escape_boost) {
            // 基础逃跑率50%；0.8效果不直接+80个百分点，统一压到95%上限。
            state.escapeBonus = Math.max(state.escapeBonus, Math.min(0.45, Number(eff.escape_boost) * 0.5));
            msg('💨 ' + template.name + '生效：下一次逃跑成功率大幅提高', 'success');
            applied = true;
        }
        if (eff.teleport) {
            var battle = global.currentBattle;
            if (battle) {
                try {
                    battle.isFinished = true;
                    battle.winner = 'escaped';
                    if (battle.log) battle.log.push({ msg: '🌀 你催动传送符，瞬间脱离战斗！' });
                } catch (e) {}
            }
            if (typeof global.closeInteraction === 'function') {
                try { global.closeInteraction(); } catch (e) {}
            }
            if (typeof global.closeBattle === 'function') {
                try { global.closeBattle(); } catch (e) {}
            }
            msg('🌀 传送符发动，你脱离了当前危险。', 'success');
            applied = true;
        }

        // ===== v21.9 控制类：定身/冰封/沉默/隐身/毒药——需要战斗中有活敌人 =====
        // 第九十九波：灶灰辣粉/铁蒺藜也走这条管线（撒出去的家伙，同样只能对活敌使）
        if (eff.stun || eff.freeze || eff.silence || eff.invisibility || eff.poison_enemy || eff.blind_enemy || eff.ash_enemy || eff.trip_enemy) {
            if (!inBattle()) {
                msg('📜 ' + template.name + '无处施展——控制类符箓只能在战斗中对敌使用。', 'warning');
                return false;
            }
            if (eff.stun) {
                var n = Math.max(1, Math.floor(Number(eff.stun) || 1));
                for (var si = 0; si < n; si++) state.enemySkipTurns.push({ icon: '💫', text: ' 被定身符钉在原地，动弹不得！（跳过一回合）' });
                msg('💫 定身符化作金光缠住敌人——' + n + ' 回合内无法行动！', 'success');
            }
            if (eff.freeze) {
                var fn = Math.max(1, Math.floor(Number(eff.freeze) || 1));
                for (var fi = 0; fi < fn; fi++) state.enemySkipTurns.push({ icon: '❄️', text: ' 被冰封符冻住，眉目结霜！（跳过一回合）' });
                msg('❄️ 寒气炸开，敌人被冰封——' + fn + ' 回合无法行动！', 'success');
            }
            if (eff.silence) {
                state.enemySilenceTurns = Math.max(state.enemySilenceTurns, Math.floor(Number(eff.silence) || 3));
                msg('🤐 沉默符封住了敌人的法力——' + state.enemySilenceTurns + ' 回合内绝技全部失灵！', 'success');
            }
            if (eff.invisibility) {
                state.invisHits = Math.max(state.invisHits, Math.floor(Number(eff.invisibility) || 3));
                msg('👤 你的身形淡入空气——接下来 ' + state.invisHits + ' 次敌人攻击都会落空！', 'success');
            }
            if (eff.poison_enemy) {
                state.enemyPoison = { turns: Math.max(state.enemyPoison ? state.enemyPoison.turns : 0, Math.floor(Number(eff.poison_enemy) || 3)), dmg: 15 };
                msg('☠️ 毒刃之毒渗进敌人伤口——每回合发作，共 ' + state.enemyPoison.turns + ' 回合！', 'success');
                if (_battle91 && typeof _battle91._noteDeed === 'function') _battle91._noteDeed('tricks');   // 第九十九波：撒毒是下作手段——有人看见就传得出去
            }
            if (eff.blind_enemy) {
                // 第九十四波·见招拆招：撒迷烟也是社交动作——他吃不吃，看他的性子
                // （性急的兜头糊实瞎两回；老练的侧脸闭气只瞎一回；眼毒的袖子扫开，白撒）
                var _smTurns = Math.floor(Number(eff.blind_enemy) || 2);
                var _smBattle = global.currentBattle;
                if (_smBattle && !_smBattle.isFinished && typeof _smBattle.receiveSmoke === 'function') {
                    _smTurns = _smBattle.receiveSmoke();
                }
                if (_smTurns > 0) {
                    state.enemyBlindTurns = Math.max(state.enemyBlindTurns, _smTurns);
                    msg('💨 你扬手撒出一把迷烟——' + state.enemyBlindTurns + ' 回合内他两眼流泪，招式全凭瞎摸！', 'success');
                } else {
                    msg('💨 他袖子一拂把石灰尽数挡下——迷烟散白撒了。（烟散照旧用掉）', 'warning');
                }
            }
            if (eff.ash_enemy) {
                // 第九十九波·灶灰辣粉：穷人的石灰——便宜好使，但只糊得住性急的（瞎一回）
                var _ashTurns = 0;
                var _ashBattle = global.currentBattle;
                if (_ashBattle && !_ashBattle.isFinished && typeof _ashBattle.receiveAsh === 'function') {
                    _ashTurns = _ashBattle.receiveAsh();
                }
                if (_ashTurns > 0) {
                    state.enemyBlindTurns = Math.max(state.enemyBlindTurns, _ashTurns);
                    msg('🌶️ 灶灰辣粉糊进了他的眼睛——' + _ashTurns + ' 回合内他眼泪直流，招式失准！', 'success');
                } else {
                    msg('🌶️ 他侧脸避开了大半——灶灰白撒了。（撒出去的收不回来）', 'warning');
                }
            }
            if (eff.trip_enemy) {
                // 第九十九波·铁蒺藜：撒地家伙——踩不踩得着，看他的性子（眼毒的看见就绕开）
                var _tripBattle = global.currentBattle;
                if (_tripBattle && !_tripBattle.isFinished && typeof _tripBattle.receiveCaltrop === 'function') {
                    _tripBattle.receiveCaltrop();
                }
                msg('🪤 你扬手撒出一把铁蒺藜，滚落在他脚前！', 'success');
            }
            applied = true;
        }

        // ===== v21.9 破甲符：接下来数次攻击穿透 +50 =====
        if (eff.penetrate_boost) {
            state.penetrateBonus = Math.max(state.penetrateBonus, Math.floor(Number(eff.penetrate_boost) || 50));
            state.penetrateTurns = Math.max(state.penetrateTurns, duration);
            msg('🗡️ 破甲符灵光附上兵刃——接下来 ' + duration + ' 次攻击无视更多护甲（穿透+' + state.penetrateBonus + '）！', 'success');
            applied = true;
        }

        // ===== v21.9 复活符：致命伤自动抵消一次（符力常驻，倒下时应验） =====
        if (eff.revive) {
            state.reviveCharges += 1;
            msg('🕯️ 复活符化作暖流没入眉心——下次受到致命伤时，它会自动应验（现存 ' + state.reviveCharges + ' 道）。', 'success');
            applied = true;
        }

        // ===== v21.9 天师符：接下来 N 次受击完全免伤 =====
        if (eff.divine_shield) {
            state.divineHits = Math.max(state.divineHits, Math.floor(Number(eff.duration) || 10));
            msg('🌟 天师护体金光罩身——接下来 ' + state.divineHits + ' 次受击完全免伤！', 'success');
            applied = true;
        }

        // ===== v21.9 乾坤符：扭转乾坤——伤势全复、负面尽清、敌人震滞一回合 =====
        if (eff.twist_fate) {
            // v23.0 扭转乾坤是生死之间的翻盘手，不是日常补药：战外拒绝催动，符力不散（不消耗）
            if (!inBattle()) {
                msg('🌌 乾坤符微微发烫又冷了下去——此符之力唯有生死搏杀之间才能扭转天地。平时催动，符力便付诸虚空了。（符未消耗）', 'warning');
                return false;
            }
            var cleaned = cleansePlayer();
            if (typeof global.restoreBodyDurability === 'function') { try { global.restoreBodyDurability(9999); } catch (e) {} }
            var cdF = (typeof global.getCurrentCharData === 'function') ? global.getCurrentCharData() : global.currentCharData;
            if (cdF) {
                cdF.qi = cdF.maxQi != null ? cdF.maxQi : 100;
                cdF.energy = cdF.maxEnergy != null ? cdF.maxEnergy : 100;
            }
            if (typeof global.updateCharacterStatus === 'function') { try { global.updateCharacterStatus(); } catch (e) {} }
            var stunned = false;
            if (inBattle()) {
                state.enemySkipTurns.push({ icon: '🌌', text: ' 被乾坤之力撼动，天地倒悬——呆立当场！（跳过一回合）' });
                stunned = true;
            }
            msg('🌌 乾坤符化开——伤势尽复、真气回满' + (cleaned > 0 ? '、负面状态尽清' : '') + (stunned ? '，敌人被震得呆立当场！' : '。'), 'success');
            applied = true;
        }
        // 第九十一波 · 用了就吃回合：进攻类家什生效后，这一回合就过去了（与医疗动作同一本经济）
        // 第九十二波 · 行动条改版：吃回合升级为扣行动条——按家什轻重扣（暗器快活扣得少，乾坤翻盘手扣得狠）
        if (applied && _turnCosting && _battle91 && !_battle91.isFinished &&
            typeof _battle91.playerItemTurn === 'function') {
            var _itemCost = eff.twist_fate ? 150
                : (eff.attack_damage ? 60
                : ((eff.trip_enemy || eff.ash_enemy) ? 60   // 第九十九波：撒地/撒脸的快活儿（⚡60）
                : ((eff.poison_enemy || eff.blind_enemy) ? 80
                : 100)));   // 定身/冰封/沉默/隐身：一整副身家的动作
            _battle91.playerItemTurn('🎒 你趁隙从行囊里摸出家什——这一下动作，扣掉行动条 ' + _itemCost + ' 点。', _itemCost);
            if (typeof global.updateBattleUI === 'function') { try { global.updateBattleUI(); } catch (e) {} }
        }
        return applied;
    }

    function cleansePlayer() {
        var manager = global.statusEffectManager;
        if (!manager || typeof manager.getAllEffects !== 'function') return 0;
        var negative = {
            debuff:1, curse:1, poison:1, disease:1, stun:1, sleep:1, root:1,
            silence:1, bleed:1, burn:1, freeze:1, charm:1, fear:1
        };
        var list = manager.getAllEffects('player').slice();
        var removed = 0;
        list.forEach(function(effect) {
            if (effect && negative[effect.type] && manager.removeEffect('player', effect.name)) removed += 1;
        });
        return removed;
    }

    function getCombatBonuses() {
        if (state.bonusActionsLeft <= 0) return {};
        return Object.assign({}, state.combatBonuses);
    }

    function onPlayerAttackComplete() {
        if (state.bonusActionsLeft > 0) {
            state.bonusActionsLeft -= 1;
            if (state.bonusActionsLeft <= 0) state.combatBonuses = {};
        }
        // v21.9 破甲符按攻击次数消耗
        if (state.penetrateTurns > 0) {
            state.penetrateTurns -= 1;
            if (state.penetrateTurns <= 0) state.penetrateBonus = 0;
        }
    }

    // ===== v21.9 战斗引擎钩子 =====
    // 敌人回合开始：定身/冰封/乾坤的跳回合（battle.enemyTurn 调用）
    function consumeEnemySkip() {
        if (state.enemySkipTurns.length > 0) return state.enemySkipTurns.shift();
        return null;
    }
    // 沉默期间敌人绝技封印（Entity.hasAbility 调用）
    function isEnemySilenced() { return state.enemySilenceTurns > 0; }
    // 每个敌人回合结算沉默/毒药（battle.enemyTurn 调用）
    function tickEnemyTurn() {
        if (state.enemySilenceTurns > 0) state.enemySilenceTurns -= 1;
    }
    // 第九十三波·迷烟散计时：挂在敌主「行动完毕」（_endEnemyMainAction）——
    // 若挂在行动开头，N 回合的烟只瞎得着 N-1 次（先扣后打，头一刀就少了账）
    function tickEnemyBlind() {
        if (state.enemyBlindTurns > 0) state.enemyBlindTurns -= 1;
    }
    function getEnemyBlindTurns() { return state.enemyBlindTurns; }
    // 第九十三波·淬毒入兵刃：见血渗毒——比撒毒粉温和（2 回合×10），但搭着攻击白送
    function applyBladePoison() {
        var turns = state.enemyPoison ? Math.max(state.enemyPoison.turns, 2) : 2;
        state.enemyPoison = { turns: turns, dmg: state.enemyPoison && state.enemyPoison.dmg > 10 ? state.enemyPoison.dmg : 10 };
        return state.enemyPoison;
    }
    function tickEnemyPoison(enemy) {
        if (!state.enemyPoison || state.enemyPoison.turns <= 0 || !enemy) return 0;
        var dmg = Math.max(1, Number(state.enemyPoison.dmg) || 15);
        state.enemyPoison.turns -= 1;
        if (state.enemyPoison.turns <= 0) state.enemyPoison = null;
        try {
            var got = enemy.takeDamage ? enemy.takeDamage('chest', dmg, 'spell') : null;
            if (typeof got === 'number' && isFinite(got)) return got;
        } catch (e) {}
        if (enemy.health != null) {
            enemy.health = Math.max(0, enemy.health - dmg);
            if (enemy.health <= 0) enemy.isAlive = false;
        }
        return dmg;
    }
    // 隐身：敌人攻击命中前调用，true=这次攻击落空
    function consumeInvisDodge() {
        if (state.invisHits > 0) { state.invisHits -= 1; return true; }
        return false;
    }
    // 破甲：玩家攻击结算穿透时叠加（battle._executeAttack 调用）
    function getPenetrateBonus() { return state.penetrateTurns > 0 ? state.penetrateBonus : 0; }
    // 复活符：玩家倒下时由 battle._checkEnd 调用；true=站起来了
    function tryRevive(player) {
        if (state.reviveCharges <= 0 || !player) return false;
        state.reviveCharges -= 1;
        try {
            player.isAlive = true;
            var phys = player.physiology;
            if (phys) {
                var cap = phys.maxBloodVolume || phys.bloodVolume || 100;
                phys.bloodVolume = Math.max(1, Math.floor(cap * 0.5));
                phys.health = phys.bloodVolume;
                phys.painLoad = Math.max(0, (phys.painLoad || 0) - 40);
                phys.isUnconscious = false;
            }
            if (player.health != null) player.health = Math.max(1, Math.floor((player.maxHealth || 100) * 0.5));
            if (player.durabilities && player.maxDurabilities) {
                Object.keys(player.durabilities).forEach(function (k) {
                    if (player.durabilities[k] <= 0) player.durabilities[k] = Math.max(1, Math.floor((player.maxDurabilities[k] || 10) * 0.2));
                });
            }
        } catch (e) {}
        msg('🕯️ 复活符燃尽——暖流走遍百骸，你从鬼门关被拽了回来！（半血复活）', 'success');
        return true;
    }

    function absorbDamage(amount) {
        amount = Math.max(0, Number(amount) || 0);
        if (amount <= 0) return amount;
        // v21.9 天师符：护体金光完全免伤（按受击次数消耗）
        if (state.divineHits > 0) {
            state.divineHits -= 1;
            msg('🌟 天师护体金光一闪——这次伤害被完全挡下（剩余护体 ' + state.divineHits + ' 次）', 'info');
            return 0;
        }
        if (state.shield <= 0) return amount;
        var absorbed = Math.min(state.shield, amount);
        state.shield -= absorbed;
        if (absorbed > 0) msg('🛡️ 护身符吸收 ' + Math.floor(absorbed) + ' 点伤害' + (state.shield > 0 ? '（剩余护盾 ' + Math.floor(state.shield) + '）' : ''), 'info');
        return Math.max(0, amount - absorbed);
    }

    function getEscapeChance(base) {
        base = Number(base);
        if (!Number.isFinite(base)) base = 0.5;
        return Math.min(0.95, Math.max(0.05, base + state.escapeBonus));
    }

    function consumeEscapeBoost() {
        state.escapeBonus = 0;
    }

    function reset() {
        state.combatBonuses = {};
        state.bonusActionsLeft = 0;
        state.shield = 0;
        state.escapeBonus = 0;
        state.enemySkipTurns = [];
        state.enemySilenceTurns = 0;
        state.enemyPoison = null;
        state.enemyBlindTurns = 0;
        state.invisHits = 0;
        state.penetrateBonus = 0;
        state.penetrateTurns = 0;
        state.reviveCharges = 0;
        state.divineHits = 0;
    }

    var api = {
        apply: apply,
        getCombatBonuses: getCombatBonuses,
        onPlayerAttackComplete: onPlayerAttackComplete,
        absorbDamage: absorbDamage,
        getEscapeChance: getEscapeChance,
        consumeEscapeBoost: consumeEscapeBoost,
        reset: reset,
        // v21.9 战斗引擎钩子
        consumeEnemySkip: consumeEnemySkip,
        isEnemySilenced: isEnemySilenced,
        getEnemyBlindTurns: getEnemyBlindTurns,
        tickEnemyBlind: tickEnemyBlind,
        applyBladePoison: applyBladePoison,
        tickEnemyTurn: tickEnemyTurn,
        tickEnemyPoison: tickEnemyPoison,
        consumeInvisDodge: consumeInvisDodge,
        getPenetrateBonus: getPenetrateBonus,
        tryRevive: tryRevive,
        debugState: function() { return JSON.parse(JSON.stringify(state)); }
    };
    global.TalismanSystem = api;
    global.XianXia = global.XianXia || {};
    global.XianXia.TalismanSystem = api;

    if (global.StateRegistry && typeof global.StateRegistry.register === 'function') {
        global.StateRegistry.register('talismanState', {
            version: 1,
            export: function() { return JSON.parse(JSON.stringify(state)); },
            import: function(data) {
                reset();
                data = data || {};
                state.combatBonuses = Object.assign({}, data.combatBonuses || {});
                state.bonusActionsLeft = Math.max(0, Number(data.bonusActionsLeft) || 0);
                state.shield = Math.max(0, Number(data.shield) || 0);
                state.escapeBonus = Math.max(0, Number(data.escapeBonus) || 0);
                // v21.9 新增状态同样入档
                state.enemySkipTurns = Array.isArray(data.enemySkipTurns) ? data.enemySkipTurns.slice(0, 10) : [];
                state.enemySilenceTurns = Math.max(0, Number(data.enemySilenceTurns) || 0);
                state.enemyPoison = (data.enemyPoison && Number(data.enemyPoison.turns) > 0) ? { turns: Number(data.enemyPoison.turns), dmg: Number(data.enemyPoison.dmg) || 15 } : null;
                state.invisHits = Math.max(0, Number(data.invisHits) || 0);
                state.penetrateBonus = Math.max(0, Number(data.penetrateBonus) || 0);
                state.penetrateTurns = Math.max(0, Number(data.penetrateTurns) || 0);
                state.reviveCharges = Math.max(0, Number(data.reviveCharges) || 0);
                state.divineHits = Math.max(0, Number(data.divineHits) || 0);
            },
            reset: reset
        });
    }
})(typeof window !== 'undefined' ? window : this);
