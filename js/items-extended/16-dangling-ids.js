// ==================== 16-dangling-ids.js - 悬空道具补洞（v20.85） ====================
// 全库审计发现：搜刮/解剖掉落、地标探索奖励、北冥挖矿、主线终局奖励、飞禽传书、
// NPC 送货任务与生活消费、资源点产出，共 27 处按 ID 发放的道具在物品库里没有模板——
// addItem 因「物品模板不存在」静默丢弃，玩家白打白挖白跑（与 v20.81 九种鱼同一族问题）。
// 本文件按各系统语境补齐模板（掉落表权重、地标进度奖励文案、任务目标皆已存在，只缺物品本体）。
// 注册规则与 13-missing-ids.js 同一套：已有定义不覆盖、注册进 itemById/allItems、并入 extended 数组。
// 加载顺序：在 items-extended.js（合并器）之后、与 13/14/15 同批。

(function () {
    'use strict';

    function mat(id, name, subtype, quality, level, price, desc, icon) {
        return { id: id, name: name, type: 'material', subtype: subtype, category: 'material', quality: quality, level: level, price: price, stackable: true, maxStack: 999, desc: desc, icon: icon || '🪨' };
    }
    function pill(id, name, quality, level, price, effect, desc) {
        return { id: id, name: name, type: 'consumable', subtype: 'pill', category: 'consumable', quality: quality, level: level, price: price, stackable: true, maxStack: 30, effect: effect, desc: desc, icon: '💊' };
    }

    var danglingItems = [
        // ===== 搜刮/解剖掉落（loot-system.js 掉落表按 ID 发放）=====
        { id: 'art_sword_wind', name: '御风剑诀', type: 'secret_art', subtype: 'sword', category: 'secret_art', quality: 'PIN7', level: 10, price: 2000, effect: { sword_attack_boost: 40, speed_boost: 20 }, desc: '剑出如风，身随剑走', icon: '🌬️', elements: { wood: 1.0 } },
        { id: 'art_jiuyang', name: '九阳神功', type: 'secret_art', subtype: 'internal', category: 'secret_art', quality: 'PIN5', level: 16, price: 5500, effect: { max_qi_boost: 60, hp_regen_boost: 15 }, desc: '九阳真气，至刚至阳', icon: '☀️', elements: { fire: 1.0 } },
        mat('mat_spirit_stone', '灵石矿', 'stone', 'PIN9', 3, 30, '含灵气的矿石，炼器布阵的基料', '💎'),
        { id: 'wpn_spirit_sword', name: '灵纹剑', type: 'equipment', subtype: 'sword', slot: 'mainHand', category: 'equipment', quality: 'PIN7', level: 8, price: 650, attrs: { strength: 8, dexterity: 6, intelligence: 4 }, combatBonus: { attack: 24, crit: 4 }, damageType: 'pierce', weight: 3, desc: '剑身刻有聚灵纹，秘境守卫的佩剑', icon: '⚔️' },
        { id: 'arm_spirit_armor', name: '灵纹甲', type: 'equipment', subtype: 'armor', slot: 'body', category: 'equipment', quality: 'PIN7', level: 8, price: 600, attrs: { constitution: 9, willpower: 5 }, defense: 22, combatBonus: { block: 5 }, resistance: { slash: 30, pierce: 25, blunt: 25 }, coverage: { chest: 0.8, abdomen: 0.6, back: 0.6 }, armorDurability: 50, weight: 6, desc: '灵纹护体，秘境守卫的制式甲', icon: '🛡️' },
        mat('mat_bone_powder', '骨粉', 'bone', 'PIN9', 1, 3, '亡灵骸骨研成的粉末，炼毒肥田两相宜', '🦴'),
        mat('mat_undead_essence', '亡魂精粹', 'essence', 'PIN8', 5, 60, '亡灵体内凝出的一缕阴精，驱邪炼器皆可入药', '👻'),
        mat('mat_mechanism_part', '机关残件', 'mechanism', 'PIN9', 2, 12, '构装体躯壳里的传动残件，神机门人最爱收', '⚙️'),
        mat('mat_spirit_crystal', '灵晶', 'stone', 'PIN8', 6, 80, '灵气凝成的晶体，布阵的阵眼料', '🔮'),
        mat('mat_element_crystal', '五行晶', 'essence', 'PIN8', 6, 90, '元素生物凝散时留下的五行结晶', '🌈'),

        // ===== 地标探索奖励（landmark-explore.js 按进度发放）=====
        mat('mat_ancient_sword_fragment', '上古剑器碎片', 'metal', 'PIN7', 10, 300, '上古剑器的残片，断口处的剑意千年未散', '🗡️'),
        mat('mat_spirit_steel', '灵钢', 'metal', 'PIN7', 8, 200, '炼器师口中的「活铁」——认炉火，也认人', '⛓️'),
        mat('mat_dragon_soul', '龙魂', 'essence', 'PIN5', 15, 2000, '一缕不散的龙魂，铸兵则兵灵，炼器则器鸣', '🐉'),
        pill('pill_soul_strengthen', '炼魂丹', 'PIN5', 12, 900, { qi_recovery: 100, energy_recovery: 50 }, '淬炼神魂的秘丹，服之神识清明'),
        pill('pill_soul_rebirth', '还魂丹', 'PIN5', 14, 1500, { hp_recovery: 500, qi_recovery: 200 }, '魂断之际续命还魂，阎王簿上抢人用的丹'),
        pill('pill_ice_core', '冰心丹', 'PIN7', 8, 400, { hp_recovery: 150, energy_recovery: 80 }, '一片冰心在玉壶，服之心火自熄'),
        mat('mat_lightning_stone', '雷石', 'stone', 'PIN8', 6, 70, '雷击之地凝出的石头，握在手里隐隐发麻', '⚡'),
        pill('pill_lightning_core', '雷核丹', 'PIN5', 12, 1000, { qi_recovery: 200, energy_recovery: 100 }, '雷核入药，服之真气奔涌如雷行'),
        mat('mat_spirit_flower', '幻海灵花', 'herb', 'PIN7', 7, 150, '幻海之滨开放的灵花，花瓣上流转着雾色', '🌸'),

        // ===== 北冥挖矿（app.js 区域矿石表）=====
        mat('mat_ice_crystal', '冰晶', 'stone', 'PIN8', 4, 50, '北冥寒气凝成的冰晶，千年不化', '🧊'),

        // ===== 主线终局奖励（main_033 最终决战）=====
        pill('pill_rebirth', '重生丹', 'PIN3', 20, 8000, { hp_recovery: 9999, qi_recovery: 999, energy_recovery: 999 }, '决战之后赐下的丹——生死人肉白骨，从阎王手里整本抢人'),

        // ===== 飞禽传书（mail-system.js 信使通道凭此物开通）=====
        { id: 'tal_transmission', name: '传音符', type: 'consumable', subtype: 'talisman', category: 'consumable', quality: 'PIN8', level: 4, price: 100, stackable: true, maxStack: 50, effect: {}, desc: '一次性远距离传音符，寄语千里外', icon: '📯' },
        { id: 'pet_immortal_crane', name: '仙鹤', type: 'special', subtype: 'token', category: 'special', quality: 'PIN5', level: 10, price: 3000, stackable: false, maxStack: 1, effect: {}, desc: '灵兽信使，认主之后千里往返不失一字——化神以上修士的书信体面', icon: '🦢' },

        // ===== NPC 日常送货任务目标（npc-life-system.js 商贾委托）=====
        mat('mat_fabric', '布料', 'misc', 'PIN9', 1, 8, '寻常布料，商队走货的基本盘', '🧵'),

        // ===== NPC 生活消费与委托（npc-life-system.js 药师日用「回血丹」）=====
        pill('pill_recovery', '回血丹', 'PIN9', 2, 25, { hp_recovery: 50 }, '最家常的疗伤丹，江湖行走人手一瓶'),

        // ===== 资源点产出（resource-points.js 秘银矿/雷晶矿）=====
        mat('mat_refined_silver', '精银', 'metal', 'PIN8', 5, 55, '秘银提纯后的成品，轻量软韧，刻纹不走形', '🪙'),
        mat('mat_thunder_crystal', '雷晶', 'stone', 'PIN8', 6, 75, '东海雷晶矿的结晶，蓄着一缕雷气，炼器布阵两相宜', '⚡')
    ];

    function register(list) {
        if (!window.itemById) window.itemById = {};
        if (!window.allItems) window.allItems = [];
        list.forEach(function (item) {
            if (!item || !item.id) return;
            if (window.itemById[item.id]) return; // 已有定义不覆盖
            window.itemById[item.id] = item;
            window.allItems.push(item);
        });
    }
    register(danglingItems);

    // 并入 extended 数组（商店/图鉴按这些数组进货的也能看到）
    danglingItems.forEach(function (it) {
        if (it.type === 'material' && window.extendedMaterials) window.extendedMaterials.push(it);
        if (it.subtype === 'pill' && window.extendedPills) window.extendedPills.push(it);
        if (it.type === 'secret_art' && window.extendedArts) window.extendedArts.push(it);
        if (it.type === 'equipment' && (it.subtype === 'sword' ? window.extendedWeapons : window.extendedArmor)) {
            (it.subtype === 'sword' ? window.extendedWeapons : window.extendedArmor).push(it);
        }
        if (it.subtype === 'talisman' && window.extendedTalismans) window.extendedTalismans.push(it);
    });

    window._danglingItemsB16 = danglingItems;
    console.log('[悬空道具补洞] 注册 ' + danglingItems.length + ' 种（掉落/地标/挖矿/主线奖励/传书/送货/资源点）');
})();
