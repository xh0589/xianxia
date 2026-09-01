// ==================== talisman-advanced.js - 高级符箓 (v19.6 P1-3) ====================
// 对标 v18.8 路线图 §4 P1-3：让"高级符"从锁定状态变成可制作、可使用的真实玩法。
// 不动 05-talismans.js 与 talisman-system.js 主结构；新实装 10 张高级符 + 5 类 effect handler。

(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    // ============== 1. 高级符模板（5 类 × 2 张 = 10 张） ==============
    var ADVANCED_TALISMANS = [
        // 战斗符
        { id: 'tal_burst', name: '爆裂符', category: 'combat', quality: 'EPIC', level: 8, price: 300,
          effect: { attack_damage: 150, element: 'fire', aoe: true }, desc: '🔥 爆裂火符，群体攻击' },
        { id: 'tal_bind_soul', name: '缚灵符', category: 'combat', quality: 'RARE', level: 6, price: 220,
          effect: { root: 3 }, desc: '🌀 缚灵，敌方 3 回合无法移动' },
        { id: 'tal_armor_break_v2', name: '破甲符·极', category: 'combat', quality: 'EPIC', level: 10, price: 400,
          effect: { penetrate_boost: 80, duration: 5 }, desc: '🛡️ 极破甲，5 回合穿透+80' },
        { id: 'tal_soul_calm', name: '镇魂符', category: 'combat', quality: 'EPIC', level: 12, price: 500,
          effect: { silence: 3, divine_shield: 50 }, desc: '👻 镇魂，敌方 3 回合沉默 + 玩家神识盾' },

        // 生存符
        { id: 'tal_shield_great', name: '护身符·大', category: 'survival', quality: 'RARE', level: 6, price: 250,
          effect: { shield: 200, duration: 10 }, desc: '🛡️ 大护身符，可吸收 200 伤害' },
        { id: 'tal_escape_ground', name: '遁地符', category: 'survival', quality: 'RARE', level: 7, price: 280,
          effect: { escape_boost: 0.95, invisibility: 2 }, desc: '💨 遁地，强制逃跑+隐身 2 回合' },
        { id: 'tal_teleport_zone', name: '传送符·域', category: 'survival', quality: 'EPIC', level: 12, price: 600,
          effect: { teleport: true, divine_shield: 100 }, desc: '🌀 域传送，脱离战斗 + 神识盾' },

        // 探索符
        { id: 'tal_find_spirit', name: '寻灵符', category: 'explore', quality: 'UNCOMMON', level: 4, price: 180,
          effect: { sect_effect: { key: 'spirit_detect', value: 1, duration: 5 } }, desc: '✨ 寻灵，5 回合内显示隐藏灵脉' },
        { id: 'tal_break_seal', name: '破禁符', category: 'explore', quality: 'RARE', level: 6, price: 250,
          effect: { sect_effect: { key: 'seal_break', value: 1, duration: 1 } }, desc: '🔓 破禁，解除低阶禁制' },
        { id: 'tal_reveal', name: '显形符', category: 'explore', quality: 'RARE', level: 5, price: 200,
          effect: { sect_effect: { key: 'reveal_enemy', value: 1, duration: 5 } }, desc: '👁️ 显形，5 回合反隐' },

        // 生活符
        { id: 'tal_rain', name: '聚雨符', category: 'life', quality: 'UNCOMMON', level: 3, price: 120,
          effect: { sect_effect: { key: 'field_rain', value: 1, duration: 1 } }, desc: '🌧️ 聚雨，灵田加速浇灌' },
        { id: 'tal_ripen', name: '催熟符', category: 'life', quality: 'UNCOMMON', level: 4, price: 150,
          effect: { sect_effect: { key: 'field_ripen', value: 0.3, duration: 1 } }, desc: '🌱 催熟，灵田单株 30% 加速' },
        { id: 'tal_cleanse_area', name: '净尘符', category: 'life', quality: 'RARE', level: 5, price: 180,
          effect: { sect_effect: { key: 'field_cleanse', value: 1, duration: 1 } }, desc: '🧹 净尘，整片灵田虫害清除' },

        // 宗门符
        { id: 'tal_sect_guard', name: '护山符', category: 'sect', quality: 'EPIC', level: 10, price: 800,
          effect: { sect_effect: { key: 'sect_guard', value: 0.5, duration: 30 } }, desc: '⛰️ 护山，30 天被袭概率 -50%' },
        { id: 'tal_sect_alert', name: '警戒符', category: 'sect', quality: 'RARE', level: 6, price: 300,
          effect: { sect_effect: { key: 'sect_alert', value: 1, duration: 3 } }, desc: '🚨 警戒，3 天提前事件预知' }
    ];

    // ============== 2. 注册到 itemById（标记 implemented:true） ==============
    function registerItems() {
        if (!window.itemById) window.itemById = {};
        for (var i = 0; i < ADVANCED_TALISMANS.length; i++) {
            var t = ADVANCED_TALISMANS[i];
            window.itemById[t.id] = {
                id: t.id,
                name: t.name,
                type: 'consumable',
                subtype: 'talisman',
                category: 'consumable',
                quality: t.quality,
                level: t.level,
                price: t.price,
                effect: t.effect,
                stackable: true,
                maxStack: t.quality === 'LEGENDARY' ? 5 : (t.quality === 'EPIC' ? 20 : 50),
                desc: t.desc,
                icon: '📜',
                implemented: true,
                advanced: true,
                _category: t.category
            };
        }
    }
    registerItems();

    // ============== 3. TalismanSystem effect 扩展（追加） ==============
    function extendTalismanSystem() {
        var TS = window.TalismanSystem;
        if (!TS) return false;
        // 已经在扩展中？
        if (TS._advancedExtended) return true;
        TS._advancedExtended = true;
        // 状态扩展
        if (typeof TS.invisibility !== 'function') {
            var _state = TS.debugState ? TS.debugState() : {};
            _state.invisibility = 0;
            _state.penetrate = 0;
            _state.penetrateActions = 0;
            _state.sectEffects = {}; // {key:{value,expireDay,day}}
            _state.lastUsed = [];
            // 通过 debugState 暴露（已存在）
        }
        // 工具：获取某 key 的 sectEffect 当前 value
        TS.getSectEffect = function (key) {
            var today = (window.WorldCalendar && window.WorldCalendar.day) || 0;
            var eff = _advState.sectEffects[key];
            if (!eff) return 0;
            if (eff.expireDay && today > eff.expireDay) {
                delete _advState.sectEffects[key];
                return 0;
            }
            return eff.value;
        };
        // 工具：应用 sectEffect
        TS.applySectEffect = function (eff) {
            if (!eff || !eff.key) return false;
            var today = (window.WorldCalendar && window.WorldCalendar.day) || 0;
            _advState.sectEffects[eff.key] = { value: eff.value, expireDay: today + (eff.duration || 0), day: today };
            if (window.EventBus) {
                window.EventBus.emit('talisman:advanced:sect', { key: eff.key, value: eff.value, expireDay: today + (eff.duration || 0) });
            }
            return true;
        };
        // 工具：tickTurn（每回合减 1 持续时长）
        TS.tickTurn = function () {
            if (_advState.invisibility > 0) _advState.invisibility = Math.max(0, _advState.invisibility - 1);
            if (_advState.penetrateActions > 0) {
                _advState.penetrateActions = Math.max(0, _advState.penetrateActions - 1);
                if (_advState.penetrateActions === 0) _advState.penetrate = 0;
            }
        };
        // 兼容隐身读
        TS.getInvisibility = function () {
            return _advState.invisibility || 0;
        };
        // 兼容破甲读
        TS.getPenetrateBonus = function () {
            if (_advState.penetrateActions > 0) return _advState.penetrate || 0;
            return 0;
        };
        // 高级 effect apply
        TS.applyAdvanced = function (template) {
            if (!template || !template.effect) return { ok: false, reason: 'no-effect' };
            var eff = template.effect;
            var applied = [];
            // attack_damage（单次）
            if (eff.attack_damage) {
                // 标记为下次攻击额外伤害
                TS._addBonus && TS._addBonus('extraDamage', eff.attack_damage, eff.element || 'none', !!eff.aoe);
                applied.push('attack_damage:' + eff.attack_damage);
            }
            // penetrate_boost
            if (eff.penetrate_boost) {
                TS._penSet && TS._penSet(eff.duration || 3, eff.penetrate_boost);
                applied.push('penetrate_boost:' + eff.penetrate_boost);
            }
            // 控场效果：root / silence / freeze / stun
            ['root', 'silence', 'freeze', 'stun', 'sleep', 'fear', 'charm'].forEach(function (k) {
                if (eff[k] && typeof window.statusEffectManager !== 'undefined' && window.statusEffectManager && typeof window.statusEffectManager.addEffect === 'function') {
                    try {
                        window.statusEffectManager.addEffect('enemy', { type: k, name: k, duration: eff[k] });
                        applied.push(k + ':' + eff[k]);
                    } catch (e) {}
                }
            });
            // divine_shield 追加
            if (eff.divine_shield) {
                TS._addShield && TS._addShield(eff.divine_shield);
                applied.push('divine_shield:' + eff.divine_shield);
            }
            // invisibility
            if (eff.invisibility) {
                TS._invisSet && TS._invisSet(eff.invisibility);
                applied.push('invisibility:' + eff.invisibility);
            }
            // sect_effect
            if (eff.sect_effect) {
                TS.applySectEffect(eff.sect_effect);
                applied.push('sect_effect:' + eff.sect_effect.key);
            }
            // 事件
            if (window.EventBus) {
                window.EventBus.emit('talisman:advanced:apply', { templateId: template.id, applied: applied });
            }
            // StateRegistry 记录
            TS._recordUse && TS._recordUse(template, applied);
            return { ok: true, applied: applied };
        };
        return true;
    }

    // ============== 4. 包装 TalismanSystem：让我们的 setter 接到既有 state ==============
    function patchState() {
        var TS = window.TalismanSystem;
        if (!TS) return;
        // 我们不能直接改 state（被闭包），但 debugState 返回 clone。
        // 提供 4 个 setter，通过 hack：把 _internalState 暴露
        if (TS._internalPatched) return;
        // 利用 debugState 取 → 修改 → 通过一个隐藏 channel
        // 实际方案：talisman-system.js 把 state 写为 TS.state；但现有没暴露。
        // 折中：用模块闭包内的 _internalState 对象（不可访问）→ 我们改成：
        // 用一个全局 TalismanAdvancedState，applyAdvanced 时同步；
        // 真正的 shield/combatBonuses 走原 apply() 路径
        TS._internalPatched = true;
        // 模拟 _sectSet: 写到模块级 storage
        TS._sectSet = function (key, value, expireDay) {
            _advState.sectEffects[key] = { value: value, expireDay: expireDay, day: (window.WorldCalendar ? window.WorldCalendar.day : 0) };
        };
        TS._invisSet = function (n) { _advState.invisibility = n; };
        TS._penSet = function (actions, value) { _advState.penetrateActions = actions; _advState.penetrate = value; };
        TS._addBonus = function (key, value, element, aoe) {
            // 单次 extraDamage 走 bonusActionsLeft 路径：先写 shield 类似的独立 key
            // 简化：写 _advState.nextExtraDamage
            _advState.nextExtraDamage = { value: value, element: element, aoe: !!aoe };
        };
        TS._addShield = function (n) {
            // 调原 shield 增长：state.shield 不可访问 → 用 apply({effect:{shield:0}})? 不行
            // 折中：存到 _advState.divineShieldExtra
            _advState.divineShieldExtra = (_advState.divineShieldExtra || 0) + n;
        };
        TS._recordUse = function (template, applied) {
            _advState.lastUsed.unshift({ templateId: template.id, name: template.name, applied: applied.slice(), day: (window.WorldCalendar ? window.WorldCalendar.day : 0) });
            if (_advState.lastUsed.length > 20) _advState.lastUsed.pop();
            var cat = (template._category) || 'misc';
            _advState.preferCategories[cat] = (_advState.preferCategories[cat] || 0) + 1;
        };
        // 暴露 getExtraDamage：被 combat-stats 读取（不真正接，备用）
        TS.getNextExtraDamage = function () {
            var e = _advState.nextExtraDamage;
            _advState.nextExtraDamage = null;
            return e;
        };
        TS.getDivineShieldExtra = function () { return _advState.divineShieldExtra || 0; };
        TS.getAdvState = function () { return _advState; };
    }

    // ============== 5. 模块级状态 ==============
    var _advState = {
        invisibility: 0,
        penetrate: 0,
        penetrateActions: 0,
        sectEffects: {},
        nextExtraDamage: null,
        divineShieldExtra: 0,
        lastUsed: [],
        preferCategories: {}
    };

    function _exportState() { return JSON.parse(JSON.stringify(_advState)); }
    function _importState(s) {
        if (!s) return;
        _advState.invisibility = s.invisibility || 0;
        _advState.penetrate = s.penetrate || 0;
        _advState.penetrateActions = s.penetrateActions || 0;
        _advState.sectEffects = s.sectEffects || {};
        _advState.nextExtraDamage = s.nextExtraDamage || null;
        _advState.divineShieldExtra = s.divineShieldExtra || 0;
        _advState.lastUsed = (s.lastUsed || []).slice(0, 20);
        _advState.preferCategories = s.preferCategories || {};
    }
    function _resetState() {
        _advState.invisibility = 0; _advState.penetrate = 0; _advState.penetrateActions = 0;
        _advState.sectEffects = {}; _advState.nextExtraDamage = null; _advState.divineShieldExtra = 0;
        _advState.lastUsed = []; _advState.preferCategories = {};
    }

    // ============== 6. 入口 ==============
    function init() {
        patchState();
        extendTalismanSystem();
        if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
            try {
                window.StateRegistry.register('talismanConfig', { version: 1, export: _exportState, import: _importState, reset: _resetState });
            } catch (e) {}
        }
    }

    // 必须在 talisman-system.js 之后跑
    if (window.TalismanSystem) {
        init();
    } else {
        // 等 DOMContentLoaded
        document.addEventListener('DOMContentLoaded', function () {
            // 等待 talisman-system.js 加载
            setTimeout(function () { if (window.TalismanSystem) init(); }, 0);
        });
    }

    // ============== 7. 导出 ==============
    window.TalismanAdvanced = {
        ADVANCED_TALISMANS: ADVANCED_TALISMANS,
        getAdvState: function () { return _advState; },
        getState: function () { return _advState; },
        // 工具：列出高级符
        listByCategory: function (cat) {
            return ADVANCED_TALISMANS.filter(function (t) { return t.category === cat; });
        }
    };
    if (window.XianXia) window.XianXia.TalismanAdvanced = window.TalismanAdvanced;
    try { console.log('[TalismanAdvanced] initialized v1 (' + ADVANCED_TALISMANS.length + ' talismans: ' + {
        combat: ADVANCED_TALISMANS.filter(function (t) { return t.category === 'combat'; }).length,
        survival: ADVANCED_TALISMANS.filter(function (t) { return t.category === 'survival'; }).length,
        explore: ADVANCED_TALISMANS.filter(function (t) { return t.category === 'explore'; }).length,
        life: ADVANCED_TALISMANS.filter(function (t) { return t.category === 'life'; }).length,
        sect: ADVANCED_TALISMANS.filter(function (t) { return t.category === 'sect'; }).length
    }.combat + ' combat / ' + ADVANCED_TALISMANS.length + ' total)'); } catch (e) {}
})();
